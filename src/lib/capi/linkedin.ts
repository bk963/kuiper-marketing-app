/**
 * LinkedIn Conversion-API — Server-Side Fire.
 *
 * Phase T4 (2026-05-30) — Tracking-Maximum-Sprint.
 *
 * Endpoint: https://api.linkedin.com/rest/conversionEvents
 * Doku: https://learn.microsoft.com/en-us/linkedin/marketing/conversions-api
 *
 * Voraussetzung: LINKEDIN_ACCESS_TOKEN + LINKEDIN_CONVERSION_ID
 * Token-Status: aktuell beide leer → graceful skip.
 */
import crypto from 'crypto';
import type { CapiResult, LeadForCapi } from './ga4';

function sha256(input: string): string {
  return crypto.createHash('sha256').update(input.toLowerCase().trim()).digest('hex');
}

export async function fireLinkedIn(lead: LeadForCapi): Promise<CapiResult> {
  const token = process.env.LINKEDIN_ACCESS_TOKEN;
  const convId = process.env.LINKEDIN_CONVERSION_ID;
  if (!token || !convId) return { status: 'skipped', error: 'no_token' };

  const value = typeof lead.revenue === 'number' && lead.revenue > 0 ? lead.revenue : 0;
  const userIds: Array<Record<string, string>> = [];
  if (lead.lead_email) userIds.push({ idType: 'SHA256_EMAIL', idValue: sha256(lead.lead_email) });

  const body = {
    conversion: `urn:lla:llaPartnerConversion:${convId}`,
    conversionHappenedAt: lead.submitted_at
      ? new Date(lead.submitted_at).getTime()
      : Date.now(),
    conversionValue: {
      currencyCode: 'EUR',
      amount: String(value),
    },
    user: { userIds, userInfo: {} },
    eventId: `mls_${lead.id}`,
  };

  try {
    const res = await fetch('https://api.linkedin.com/rest/conversionEvents', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'LinkedIn-Version': '202410',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify(body),
    });
    if (res.ok || res.status === 201) return { status: 'sent' };
    const txt = await res.text();
    return { status: 'error', error: `HTTP ${res.status}: ${txt.slice(0, 200)}` };
  } catch (e: any) {
    return { status: 'error', error: String(e?.message || e).slice(0, 200) };
  }
}
