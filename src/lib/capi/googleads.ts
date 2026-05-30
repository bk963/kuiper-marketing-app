/**
 * Google Ads Offline Conversion Import — Server-Side Fire.
 *
 * Phase T4 (2026-05-30) — Tracking-Maximum-Sprint.
 *
 * Endpoint: https://googleads.googleapis.com/v20/customers/<CID>:uploadClickConversions
 * Doku: https://developers.google.com/google-ads/api/docs/conversions/upload-clicks
 *
 * Voraussetzung: gclid muss im Lead persistiert sein (sonst kein OCI möglich).
 * Token-Status: OAuth-Tokens da, Developer-Token + Customer-ID gesetzt.
 */
import type { CapiResult, LeadForCapi } from './ga4';

let _accessToken: string | null = null;
let _accessExpires = 0;

async function getAccessToken(): Promise<string> {
  if (_accessToken && Date.now() < _accessExpires) return _accessToken;
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_OAUTH_REFRESH_TOKEN;
  if (!clientId || !clientSecret || !refreshToken) return '';
  try {
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }).toString(),
    });
    if (!res.ok) return '';
    const data = await res.json();
    _accessToken = String(data.access_token || '');
    _accessExpires = Date.now() + (data.expires_in || 3000) * 1000 - 60000;
    return _accessToken;
  } catch {
    return '';
  }
}

export async function fireGoogleAds(lead: LeadForCapi): Promise<CapiResult> {
  const cid = process.env.GOOGLE_ADS_CUSTOMER_ID;
  const loginCid = process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID;
  const devToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
  const convAction = process.env.GOOGLE_ADS_CONVERSION_ID;
  if (!cid || !devToken || !convAction) return { status: 'skipped', error: 'no_token' };
  if (!lead.gclid) return { status: 'skipped', error: 'no_gclid' };

  const access = await getAccessToken();
  if (!access) return { status: 'error', error: 'oauth_refresh_failed' };

  const value = typeof lead.revenue === 'number' && lead.revenue > 0 ? lead.revenue : 0;
  const convTime = lead.submitted_at || new Date().toISOString();
  // Google-Ads erwartet Format "YYYY-MM-DD HH:MM:SS+HH:MM"
  const formattedTime = convTime.replace('T', ' ').replace(/\.\d+Z$/, '+00:00');

  const body = {
    conversions: [
      {
        gclid: lead.gclid,
        conversionAction: `customers/${cid}/conversionActions/${convAction}`,
        conversionDateTime: formattedTime,
        conversionValue: value,
        currencyCode: 'EUR',
        orderId: `mls_${lead.id}`,
      },
    ],
    partialFailure: true,
    validateOnly: false,
  };

  try {
    const res = await fetch(`https://googleads.googleapis.com/v20/customers/${cid}:uploadClickConversions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${access}`,
        'developer-token': devToken,
        'login-customer-id': loginCid || cid,
      },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => null);
    if (res.ok && data && Array.isArray(data.results) && data.results.length > 0) return { status: 'sent' };
    if (data?.partialFailureError) {
      return { status: 'error', error: String(data.partialFailureError.message || '').slice(0, 200) };
    }
    return { status: 'error', error: `HTTP ${res.status}: ${JSON.stringify(data).slice(0, 200)}` };
  } catch (e: any) {
    return { status: 'error', error: String(e?.message || e).slice(0, 200) };
  }
}
