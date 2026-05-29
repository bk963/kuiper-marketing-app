/**
 * Generic LP-Lead-Submit-Endpoint.
 *
 * Forwarded an Reach-Bridge (CRM-Sales-Leads) wie beim Marketing-Tracking,
 * damit Leads im CRM (sales-leads → tracking → ggf. mkt_form_submissions) landen.
 *
 * Body: { form_id, lead_source, lp_id?, form_page, submitted_at, lead: {...},
 *         tracking: {...}, events, max_scroll_pct, section_dwell_ms,
 *         abandoned_fields, fields_filled, form_duration_ms, honeypot }
 *
 * Sicherheits-Layer:
 *  - Honeypot-Check (Bot-Detection)
 *  - Min-Form-Duration (Sub-Sekunden = Bot)
 *  - Email/Phone validierung
 *
 * Mail-Allow-List (KRITISCHE Grundregel):
 *  - Endpoint sendet KEINE Mails direkt
 *  - Forwards JSON an Reach-Bridge, die hat ihren eigenen Guard
 */
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const REACH_URL = process.env.REACH_LEAD_URL || 'https://app.kuiper-safety.de/hcgi/api/reach/leads';
const REACH_TOKEN = process.env.REACH_SERVICE_TOKEN || '';
const MIN_FORM_MS = 800; // < 800ms heißt Bot

export async function POST(req: NextRequest) {
  let body: any = {};
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'invalid JSON' }, { status: 400 }); }

  // 1. Honeypot
  if (body.honeypot) {
    console.warn('[lp/lead] honeypot triggered', { ip: req.headers.get('x-forwarded-for') });
    return NextResponse.json({ ok: true, dropped: 'honeypot' }, { status: 200 });
  }

  // 2. Speed-Check
  if (typeof body.form_duration_ms === 'number' && body.form_duration_ms > 0 && body.form_duration_ms < MIN_FORM_MS) {
    console.warn('[lp/lead] too-fast submit', { ms: body.form_duration_ms });
    return NextResponse.json({ ok: true, dropped: 'too_fast' }, { status: 200 });
  }

  // 3. Minimum Lead-Fields
  const lead = body.lead || {};
  if (!lead.email && !lead.phone) {
    return NextResponse.json({ error: 'email_or_phone_required' }, { status: 400 });
  }

  // 4. Reach-Bridge-Payload zusammenstellen (passt zu /hcgi/api/reach/leads)
  const idempotencyKey = `lp:${body.form_id || 'unknown'}:${body.submitted_at || Date.now()}:${lead.email || lead.phone || ''}`;
  const payload = {
    source_form_slug: body.form_id || 'lp-form',
    lead_source: body.lead_source || 'landingpage',
    submitted_at: body.submitted_at || new Date().toISOString(),
    company_name: lead.company || '',
    contact_first_name: '', // BSH-Form sammelt nur lastname
    contact_last_name: lead.lastname || '',
    salutation: lead.salutation || '',
    email: lead.email || '',
    phone: lead.phone || '',
    street: lead.street || '',
    zip: lead.zip || '',
    city: lead.city || '',
    utm: body.tracking?.utm || {},
    referrer: body.tracking?.referrer || '',
    ip_hash: body.tracking?.ip_hash || '',
    landing_url: body.form_page || '',
    notes: `LP-Lead via ${body.form_id || 'unknown'} | Scroll ${body.max_scroll_pct || 0}% | Duration ${body.form_duration_ms || 0}ms`,
    metadata: {
      lp_id: body.lp_id || null,
      events_count: Array.isArray(body.events) ? body.events.length : 0,
      section_dwell_ms: body.section_dwell_ms || {},
      abandoned_fields: body.abandoned_fields || [],
      fields_filled: body.fields_filled || 0,
    },
  };

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Idempotency-Key': idempotencyKey,
    };
    if (REACH_TOKEN) headers['X-Reach-Service-Token'] = REACH_TOKEN;

    const res = await fetch(REACH_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      console.error('[lp/lead] reach-bridge failed', res.status, txt.slice(0, 300));
      return NextResponse.json({ ok: false, error: 'forwarding_failed', status: res.status }, { status: 502 });
    }

    const d = await res.json().catch(() => ({}));
    return NextResponse.json({ ok: true, actions: d.actions || [], lead_id: d.lead_id || null });
  } catch (e: any) {
    console.error('[lp/lead] forwarding error', e?.message);
    return NextResponse.json({ ok: false, error: 'forwarding_error' }, { status: 502 });
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: '/api/lp/lead',
    method: 'POST',
    description: 'Generic LP-Lead-Submit forwarded an Reach-Bridge → CRM Sales-Leads',
    reach_target: REACH_URL,
    reach_token_set: !!REACH_TOKEN,
  });
}
