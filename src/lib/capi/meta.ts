/**
 * Meta Conversions API — Server-Side Event-Fire.
 *
 * Phase T4 (2026-05-30) — Tracking-Maximum-Sprint.
 *
 * Endpoint: https://graph.facebook.com/v18.0/<PIXEL_ID>/events
 * Doku: https://developers.facebook.com/docs/marketing-api/conversions-api
 *
 * PII (email/phone) MUSS SHA256-gehasht sein. lower-cased + trimmed.
 *
 * Token-Status: META_PIXEL_ID + META_CAPI_ACCESS_TOKEN aktuell leer.
 * Wenn Bk Token einsetzt, läuft Fire automatisch.
 */
import crypto from 'crypto';
import type { CapiResult, LeadForCapi } from './ga4';

function sha256(input: string): string {
  return crypto.createHash('sha256').update(input.toLowerCase().trim()).digest('hex');
}

export async function fireMeta(lead: LeadForCapi): Promise<CapiResult> {
  const pixelId = process.env.META_PIXEL_ID;
  const token = process.env.META_CAPI_ACCESS_TOKEN;
  if (!pixelId || !token) return { status: 'skipped', error: 'no_token' };

  const value = typeof lead.revenue === 'number' && lead.revenue > 0 ? lead.revenue : 0;
  const userData: Record<string, any> = {};
  if (lead.lead_email) userData.em = [sha256(lead.lead_email)];
  if (lead.lead_phone) userData.ph = [sha256(lead.lead_phone.replace(/\D/g, ''))];
  if (lead.lead_first_name) userData.fn = [sha256(lead.lead_first_name)];
  if (lead.lead_last_name) userData.ln = [sha256(lead.lead_last_name)];
  if (lead.fbclid) userData.fbc = [`fb.1.${Date.now()}.${lead.fbclid}`];
  if (lead.ip_hash) userData.client_ip_address = lead.ip_hash;
  if (lead.user_agent) userData.client_user_agent = lead.user_agent;

  const body: any = {
    data: [
      {
        event_name: 'Lead',
        event_time: lead.submitted_at
          ? Math.floor(new Date(lead.submitted_at).getTime() / 1000)
          : Math.floor(Date.now() / 1000),
        event_id: `mls_${lead.id}`,
        action_source: 'website',
        event_source_url: lead.landing_page
          ? `https://kuiper-safety.de${lead.landing_page}`
          : 'https://kuiper-safety.de',
        user_data: userData,
        custom_data: {
          currency: 'EUR',
          value,
          content_name: lead.utm_campaign || 'lead',
          content_category: lead.utm_source || 'direct',
          lead_quality: lead.quality_score || 0,
        },
      },
    ],
  };
  if (process.env.META_TEST_EVENT_CODE) {
    body.test_event_code = process.env.META_TEST_EVENT_CODE;
  }

  try {
    const url = `https://graph.facebook.com/v18.0/${encodeURIComponent(pixelId)}/events?access_token=${encodeURIComponent(token)}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => null);
    if (res.ok && data && (data.events_received > 0 || data.fbtrace_id)) return { status: 'sent' };
    return { status: 'error', error: `HTTP ${res.status}: ${JSON.stringify(data).slice(0, 200)}` };
  } catch (e: any) {
    return { status: 'error', error: String(e?.message || e).slice(0, 200) };
  }
}
