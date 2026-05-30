/**
 * GA4 Measurement Protocol — Server-Side-Event-Fire.
 *
 * Phase T4 (2026-05-30) — Tracking-Maximum-Sprint.
 *
 * Endpoint: https://www.google-analytics.com/mp/collect?measurement_id=...&api_secret=...
 * Doku: https://developers.google.com/analytics/devguides/collection/protocol/ga4
 *
 * Sendet ein 'generate_lead' Event mit value + currency.
 * Client_id wird aus _ga-Cookie reconstructed oder fallback visitor_id.
 */

export type CapiResult = { status: 'sent' | 'skipped' | 'error'; error?: string };

export type LeadForCapi = {
  id: string;
  lead_email?: string;
  lead_phone?: string;
  lead_first_name?: string;
  lead_last_name?: string;
  visitor_id?: string;
  session_id?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  gclid?: string;
  fbclid?: string;
  msclkid?: string;
  landing_page?: string;
  user_agent?: string;
  ip_hash?: string;
  quality_score?: number;
  revenue?: number;
  /** ISO-Datestring */
  submitted_at?: string;
};

export async function fireGA4(lead: LeadForCapi): Promise<CapiResult> {
  const mid = process.env.GA4_MEASUREMENT_ID;
  const secret = process.env.GA4_API_SECRET;
  if (!mid || !secret) return { status: 'skipped', error: 'no_token' };
  if (!lead.id) return { status: 'skipped', error: 'no_lead_id' };

  // Client-ID: aus _ga-Cookie wäre besser, aber haben wir hier nicht. Fallback: visitor_id (32-bit hash).
  const clientId = lead.visitor_id || `mls_${lead.id}`;
  const value = typeof lead.revenue === 'number' && lead.revenue > 0 ? lead.revenue : 0;

  const body = {
    client_id: clientId,
    timestamp_micros: lead.submitted_at
      ? new Date(lead.submitted_at).getTime() * 1000
      : Date.now() * 1000,
    events: [
      {
        name: 'generate_lead',
        params: {
          currency: 'EUR',
          value,
          lead_source: lead.utm_source || 'direct',
          campaign: lead.utm_campaign || '',
          medium: lead.utm_medium || '',
          landing_page: lead.landing_page || '',
          quality_score: lead.quality_score || 0,
        },
      },
    ],
  };

  try {
    const url = `https://www.google-analytics.com/mp/collect?measurement_id=${encodeURIComponent(mid)}&api_secret=${encodeURIComponent(secret)}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (res.status === 204 || res.status === 200) return { status: 'sent' };
    const txt = await res.text();
    return { status: 'error', error: `HTTP ${res.status}: ${txt.slice(0, 200)}` };
  } catch (e: any) {
    return { status: 'error', error: String(e?.message || e).slice(0, 200) };
  }
}
