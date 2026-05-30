/**
 * /api/track/event — Tracking-Backend für kuiper-tracking.v1.js
 *
 * Phase T1 (2026-05-30). Tracking-Maximum-Sprint.
 *
 * Empfängt Events vom Client-Side-Tracking-Script:
 *  - type='page_view'  → page_views++ in bsh_visits (oder neu erstellen)
 *  - type='event'      → events_json.push({name, data, at}) in bsh_visits
 *
 * Datenfluss:
 *   Client (kuiper-tracking.v1.js)
 *      → POST {kuiper-safety.de}/api/track/event           (Caddy-Proxy auf marketing-app)
 *      → POST {marketing-app}/api/track/event              (= dieser Handler)
 *      → upsert in pb-tracking.kuiper-safety.de:bsh_visits (via TRACKING_PB_*)
 *
 * Consent-gating findet CLIENT-SIDE statt — `kuiper-tracking.v1.js` ruft uns
 * nur auf wenn `kuiperConsent.has('statistik')` true. Server vertraut dem.
 *
 * Rate-Limit: kein dediziertes Rate-Limit hier — Caddy-Proxy soll's machen.
 * Bot-Filter: einfacher User-Agent-Check (siehe isBot()).
 *
 * Response: 204 No Content (Fire-and-Forget, kein Body).
 */
import { NextRequest, NextResponse } from 'next/server';
import { findVisitBySession, createVisit, patchVisit } from '@/lib/pb-tracking';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type TrackEventBody = {
  type: 'page_view' | 'event';
  /** session_id MUSS client-seitig erzeugt werden (visitor_id-cookie + tab-id) */
  session_id: string;
  visitor_id?: string;
  /** Identifikation */
  ip_hash?: string;
  user_agent?: string;
  device?: 'mobile' | 'tablet' | 'desktop' | 'unknown';
  /** Pfad-Info */
  landing_page?: string;
  exit_page?: string;
  referrer?: string;
  /** Attribution */
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  gclid?: string;
  fbclid?: string;
  msclkid?: string;
  /** Engagement */
  scroll_max?: number;
  dwell_ms?: number;
  /** Wenn type='event': */
  event_name?: string;
  event_data?: Record<string, any>;
};

function isBot(ua: string): boolean {
  if (!ua) return true;
  const lower = ua.toLowerCase();
  return /bot|crawl|spider|http-?client|curl|wget|playwright|headless|monitor|uptime/i.test(lower);
}

function pickAllowedString(v: any, max = 500): string | undefined {
  if (typeof v !== 'string') return undefined;
  const s = v.trim();
  if (!s) return undefined;
  return s.slice(0, max);
}

export async function POST(req: NextRequest) {
  let body: TrackEventBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'bad_json' }, { status: 400 });
  }

  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'bad_body' }, { status: 400 });
  }
  if (body.type !== 'page_view' && body.type !== 'event') {
    return NextResponse.json({ error: 'bad_type' }, { status: 400 });
  }
  if (!body.session_id || typeof body.session_id !== 'string') {
    return NextResponse.json({ error: 'missing_session_id' }, { status: 400 });
  }

  const ua = req.headers.get('user-agent') || body.user_agent || '';
  if (isBot(ua)) {
    // Bot — silent-drop (kein Bsh_visits-Eintrag, aber 204 zurück damit Bot nicht retried)
    return new NextResponse(null, { status: 204 });
  }

  // Suche existing visit by session_id
  const existing = await findVisitBySession(body.session_id);
  const nowIso = new Date().toISOString();

  if (!existing) {
    // Neuer Visit
    if (body.type !== 'page_view') {
      // Custom-Event ohne vorherigen Page-View → kein Sinn. Silent-drop.
      return new NextResponse(null, { status: 204 });
    }
    const create: Record<string, any> = {
      session_id: body.session_id.slice(0, 80),
      visitor_id: pickAllowedString(body.visitor_id, 80) || '',
      ip_hash: pickAllowedString(body.ip_hash, 64) || '',
      user_agent: ua.slice(0, 500),
      device: ['mobile', 'tablet', 'desktop'].includes(body.device || '') ? body.device : 'unknown',
      landing_page: pickAllowedString(body.landing_page, 500) || '',
      exit_page: pickAllowedString(body.landing_page, 500) || '',
      referrer: pickAllowedString(body.referrer, 500) || '',
      utm_source: pickAllowedString(body.utm_source, 150) || '',
      utm_medium: pickAllowedString(body.utm_medium, 150) || '',
      utm_campaign: pickAllowedString(body.utm_campaign, 150) || '',
      utm_content: pickAllowedString(body.utm_content, 150) || '',
      utm_term: pickAllowedString(body.utm_term, 150) || '',
      gclid: pickAllowedString(body.gclid, 200) || '',
      fbclid: pickAllowedString(body.fbclid, 200) || '',
      msclkid: pickAllowedString(body.msclkid, 200) || '',
      page_views: 1,
      scroll_max: typeof body.scroll_max === 'number' ? body.scroll_max : 0,
      dwell_total_ms: typeof body.dwell_ms === 'number' ? body.dwell_ms : 0,
      events_json: [{ name: 'page_view', at: nowIso, page: body.landing_page }],
      visit_at: nowIso,
      led_to_lead: false,
    };
    await createVisit(create);
    return new NextResponse(null, { status: 204 });
  }

  // Existing visit → update
  const patch: Record<string, any> = {};
  if (body.type === 'page_view') {
    patch.page_views = (existing.page_views || 1) + 1;
    if (body.landing_page) patch.exit_page = body.landing_page.slice(0, 500);
    const events = Array.isArray(existing.events_json) ? existing.events_json.slice(0, 200) : [];
    events.push({ name: 'page_view', at: nowIso, page: body.landing_page });
    patch.events_json = events;
  } else if (body.type === 'event') {
    const events = Array.isArray(existing.events_json) ? existing.events_json.slice(0, 200) : [];
    events.push({
      name: pickAllowedString(body.event_name, 80) || 'unknown',
      at: nowIso,
      data: body.event_data || {},
    });
    patch.events_json = events;
  }
  if (typeof body.scroll_max === 'number' && body.scroll_max > (existing.scroll_max || 0)) {
    patch.scroll_max = body.scroll_max;
  }
  if (typeof body.dwell_ms === 'number') {
    patch.dwell_total_ms = (existing.dwell_total_ms || 0) + body.dwell_ms;
  }
  if (Object.keys(patch).length > 0) {
    await patchVisit(existing.id, patch);
  }
  return new NextResponse(null, { status: 204 });
}

/** GET = Health-Check für Caddy-Proxy + Monitoring */
export async function GET() {
  return NextResponse.json({
    ok: true,
    endpoint: '/api/track/event',
    methods: ['POST'],
    pb_tracking_url: process.env.TRACKING_PB_URL || 'https://pb-tracking.kuiper-safety.de',
  });
}
