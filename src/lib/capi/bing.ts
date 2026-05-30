/**
 * Bing Ads Offline Conversion Import — Server-Side Fire.
 *
 * Phase T4 (2026-05-30) — Tracking-Maximum-Sprint.
 *
 * Bing uses SOAP, not REST. ApplyOfflineConversions via CampaignManagement-Service.
 * Doku: https://learn.microsoft.com/en-us/advertising/campaign-management-service/applyofflineconversions
 *
 * Voraussetzung: msclkid muss im Lead persistiert sein.
 * Token-Status: alle Bing-Ads-Tokens vollständig (OAuth + DevToken + Customer + Account + ConversionGoal).
 */
import type { CapiResult, LeadForCapi } from './ga4';

let _accessToken: string | null = null;
let _accessExpires = 0;

async function getAccessToken(): Promise<string> {
  if (_accessToken && Date.now() < _accessExpires) return _accessToken;
  const clientId = process.env.BING_OAUTH_CLIENT_ID;
  const refreshToken = process.env.BING_OAUTH_REFRESH_TOKEN;
  const tenantId = process.env.BING_OAUTH_TENANT_ID || 'common';
  if (!clientId || !refreshToken) return '';
  try {
    const res = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        scope: 'https://ads.microsoft.com/msads.manage offline_access',
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

function escapeXml(s: string): string {
  return s.replace(/[<>&"']/g, c => ({ '<':'&lt;', '>':'&gt;', '&':'&amp;', '"':'&quot;', "'":'&apos;' }[c]!));
}

export async function fireBing(lead: LeadForCapi): Promise<CapiResult> {
  const devToken = process.env.BING_ADS_DEVELOPER_TOKEN;
  const accountId = process.env.BING_ADS_ACCOUNT_ID;
  const customerId = process.env.BING_ADS_CUSTOMER_ID;
  const goalName = process.env.BING_ADS_CONVERSION_NAME;
  if (!devToken || !accountId || !customerId || !goalName) return { status: 'skipped', error: 'no_token' };
  if (!lead.msclkid) return { status: 'skipped', error: 'no_msclkid' };

  const access = await getAccessToken();
  if (!access) return { status: 'error', error: 'oauth_refresh_failed' };

  const value = typeof lead.revenue === 'number' && lead.revenue > 0 ? lead.revenue : 0;
  const convTime = lead.submitted_at || new Date().toISOString();
  // Bing braucht: "YYYY-MM-DDTHH:MM:SS"
  const formattedTime = convTime.replace(/\.\d+Z$/, '').replace('Z', '');

  const soap = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
               xmlns:i="https://bingads.microsoft.com/CampaignManagement/v13">
  <soap:Header>
    <i:DeveloperToken>${escapeXml(devToken)}</i:DeveloperToken>
    <i:CustomerAccountId>${escapeXml(accountId)}</i:CustomerAccountId>
    <i:CustomerId>${escapeXml(customerId)}</i:CustomerId>
    <i:AuthenticationToken>${escapeXml(access)}</i:AuthenticationToken>
  </soap:Header>
  <soap:Body>
    <ApplyOfflineConversionsRequest xmlns="https://bingads.microsoft.com/CampaignManagement/v13">
      <OfflineConversions xmlns:a="http://schemas.datacontract.org/2004/07/Microsoft.AdCenter.Advertiser.CampaignManagement.Api.DataContracts.V13">
        <a:OfflineConversion>
          <a:ConversionCurrencyCode>EUR</a:ConversionCurrencyCode>
          <a:ConversionName>${escapeXml(goalName)}</a:ConversionName>
          <a:ConversionTime>${escapeXml(formattedTime)}</a:ConversionTime>
          <a:ConversionValue>${value}</a:ConversionValue>
          <a:MicrosoftClickId>${escapeXml(lead.msclkid)}</a:MicrosoftClickId>
        </a:OfflineConversion>
      </OfflineConversions>
    </ApplyOfflineConversionsRequest>
  </soap:Body>
</soap:Envelope>`;

  try {
    const res = await fetch('https://campaign.api.bingads.microsoft.com/Api/Advertiser/CampaignManagement/v13/CampaignManagementService.svc', {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        SOAPAction: 'ApplyOfflineConversions',
      },
      body: soap,
    });
    const txt = await res.text();
    if (res.ok && !txt.includes('<faultcode>') && !txt.includes('<s:Fault>')) return { status: 'sent' };
    return { status: 'error', error: `HTTP ${res.status}: ${txt.slice(0, 200)}` };
  } catch (e: any) {
    return { status: 'error', error: String(e?.message || e).slice(0, 200) };
  }
}
