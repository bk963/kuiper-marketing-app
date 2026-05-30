/**
 * /api/admin/fire-capi — CAPI-Fire-Orchestrator für Marketing-Leads.
 *
 * Phase T4 (2026-05-30) — Tracking-Maximum-Sprint.
 *
 * Aufgerufen vom pb-tracking PB-Hook bei marketing_lead_submissions.onCreate (+won-status).
 *
 * Body: { lead_id, lead_source_collection? }
 * 1. Liest Lead aus pb-tracking marketing_lead_submissions
 * 2. Feuert parallel: GA4 MP, Google Ads OCI, Bing Ads OCI, Meta CAPI, LinkedIn CAPI, TikTok CAPI
 * 3. Schreibt capi_<platform>_{status,at,error} pro Plattform in marketing_lead_submissions zurück
 * 4. Return-Body: pro Plattform Status
 *
 * Auth: Internal-Token-Check (CAPI_FIRE_INTERNAL_TOKEN env) — Hook MUSS Token mitschicken.
 * Sonst öffnet das auch jedem Public-User die CAPI-Fire-Logik.
 */
import { NextRequest, NextResponse } from 'next/server';
import { fireGA4, type LeadForCapi } from '@/lib/capi/ga4';
import { fireMeta } from '@/lib/capi/meta';
import { fireGoogleAds } from '@/lib/capi/googleads';
import { fireLinkedIn } from '@/lib/capi/linkedin';
import { fireTikTok } from '@/lib/capi/tiktok';
import { fireBing } from '@/lib/capi/bing';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PB_TRACKING = process.env.TRACKING_PB_URL || 'https://pb-tracking.kuiper-safety.de';

let _suToken: string | null = null;
let _suExpires = 0;

async function getTrackingPbToken(): Promise<string> {
  if (_suToken && Date.now() < _suExpires) return _suToken;
  const email = process.env.TRACKING_PB_SUPERUSER_EMAIL || '';
  const pass = process.env.TRACKING_PB_SUPERUSER_PASSWORD || '';
  if (!email || !pass) return '';
  try {
    const r = await fetch(`${PB_TRACKING}/api/collections/_superusers/auth-with-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identity: email, password: pass }),
    });
    if (!r.ok) return '';
    const d = await r.json();
    _suToken = String(d.token || '');
    _suExpires = Date.now() + 5 * 60 * 1000;
    return _suToken;
  } catch {
    return '';
  }
}

async function loadLead(leadId: string): Promise<LeadForCapi | null> {
  const token = await getTrackingPbToken();
  if (!token) return null;
  try {
    const r = await fetch(`${PB_TRACKING}/api/collections/marketing_lead_submissions/records/${encodeURIComponent(leadId)}`, {
      headers: { Authorization: token },
      cache: 'no-store',
    });
    if (!r.ok) return null;
    const lead = await r.json();
    return {
      id: lead.id,
      lead_email: lead.lead_email,
      lead_phone: lead.lead_phone,
      lead_first_name: lead.lead_first_name,
      lead_last_name: lead.lead_last_name,
      visitor_id: lead.visitor_id,
      session_id: lead.session_id,
      utm_source: lead.utm_source,
      utm_medium: lead.utm_medium,
      utm_campaign: lead.utm_campaign,
      gclid: lead.gclid,
      fbclid: lead.fbclid,
      msclkid: lead.msclkid,
      landing_page: lead.landing_page,
      user_agent: lead.user_agent,
      ip_hash: lead.ip_hash,
      quality_score: lead.quality_score,
      revenue: lead.revenue,
      submitted_at: lead.submitted_at || lead.created,
    };
  } catch {
    return null;
  }
}

async function persistStatus(leadId: string, plat: string, result: { status: string; error?: string }) {
  const token = await getTrackingPbToken();
  if (!token) return;
  const at = new Date().toISOString();
  const patch: Record<string, any> = {
    [`capi_${plat}_status`]: result.status,
    [`capi_${plat}_at`]: at,
    [`capi_${plat}_error`]: (result.error || '').slice(0, 500),
  };
  try {
    await fetch(`${PB_TRACKING}/api/collections/marketing_lead_submissions/records/${encodeURIComponent(leadId)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: token },
      body: JSON.stringify(patch),
    });
  } catch {}
}

export async function POST(req: NextRequest) {
  // Internal-Token-Check
  const expectedToken = process.env.CAPI_FIRE_INTERNAL_TOKEN || '';
  const headerToken = req.headers.get('x-internal-token') || '';
  if (!expectedToken || expectedToken !== headerToken) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  let body: { lead_id?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'bad_json' }, { status: 400 });
  }
  const leadId = body.lead_id;
  if (!leadId || typeof leadId !== 'string') {
    return NextResponse.json({ error: 'missing_lead_id' }, { status: 400 });
  }

  const lead = await loadLead(leadId);
  if (!lead) {
    return NextResponse.json({ error: 'lead_not_found' }, { status: 404 });
  }

  // Fire alle Plattformen parallel
  const [ga4, google, bing, meta, linkedin, tiktok] = await Promise.all([
    fireGA4(lead),
    fireGoogleAds(lead),
    fireBing(lead),
    fireMeta(lead),
    fireLinkedIn(lead),
    fireTikTok(lead),
  ]);

  // Schema hat capi_{google,bing,meta,linkedin,tiktok}_* — KEIN ga4-Feld.
  // GA4 wird nur als API-Response returned, nicht persistiert (Schema-Erweiterung später optional).
  await Promise.all([
    persistStatus(leadId, 'google', google),
    persistStatus(leadId, 'bing', bing),
    persistStatus(leadId, 'meta', meta),
    persistStatus(leadId, 'linkedin', linkedin),
    persistStatus(leadId, 'tiktok', tiktok),
  ]);

  return NextResponse.json({
    lead_id: leadId,
    results: {
      ga4,
      google,
      bing,
      meta,
      linkedin,
      tiktok,
    },
  });
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    endpoint: '/api/admin/fire-capi',
    methods: ['POST'],
    platforms: ['ga4', 'google', 'bing', 'meta', 'linkedin', 'tiktok'],
    auth: 'X-Internal-Token (CAPI_FIRE_INTERNAL_TOKEN)',
  });
}
