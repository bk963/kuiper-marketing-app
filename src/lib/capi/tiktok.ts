/**
 * TikTok Events-API — Server-Side Fire.
 *
 * Phase T4 (2026-05-30) — Tracking-Maximum-Sprint.
 *
 * Endpoint: https://business-api.tiktok.com/open_api/v1.3/event/track/
 * Doku: https://business-api.tiktok.com/portal/docs?id=1727541103358977
 *
 * Voraussetzung: TIKTOK_ACCESS_TOKEN + TIKTOK_PIXEL_ID
 * Token-Status: aktuell leer → graceful skip.
 */
import crypto from 'crypto';
import type { CapiResult, LeadForCapi } from './ga4';

function sha256(input: string): string {
  return crypto.createHash('sha256').update(input.toLowerCase().trim()).digest('hex');
}

export async function fireTikTok(lead: LeadForCapi): Promise<CapiResult> {
  const token = process.env.TIKTOK_ACCESS_TOKEN;
  const pixelId = process.env.TIKTOK_PIXEL_ID;
  if (!token || !pixelId) return { status: 'skipped', error: 'no_token' };

  const value = typeof lead.revenue === 'number' && lead.revenue > 0 ? lead.revenue : 0;
  const userCtx: Record<string, any> = {};
  if (lead.lead_email) userCtx.email = sha256(lead.lead_email);
  if (lead.lead_phone) userCtx.phone = sha256(lead.lead_phone.replace(/\D/g, ''));
  if (lead.ip_hash) userCtx.ip = lead.ip_hash;
  if (lead.user_agent) userCtx.user_agent = lead.user_agent;

  const body = {
    pixel_code: pixelId,
    event: 'Lead',
    event_id: `mls_${lead.id}`,
    timestamp: lead.submitted_at || new Date().toISOString(),
    context: {
      user: userCtx,
      page: {
        url: lead.landing_page
          ? `https://kuiper-safety.de${lead.landing_page}`
          : 'https://kuiper-safety.de',
      },
    },
    properties: {
      currency: 'EUR',
      value,
      contents: [
        { content_id: `mls_${lead.id}`, content_name: lead.utm_campaign || 'lead' },
      ],
    },
  };

  try {
    const res = await fetch('https://business-api.tiktok.com/open_api/v1.3/event/track/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Access-Token': token,
      },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => null);
    if (res.ok && data?.code === 0) return { status: 'sent' };
    return { status: 'error', error: `HTTP ${res.status}: ${JSON.stringify(data).slice(0, 200)}` };
  } catch (e: any) {
    return { status: 'error', error: String(e?.message || e).slice(0, 200) };
  }
}
