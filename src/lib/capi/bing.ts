/**
 * Bing Ads Offline Conversion Import — Server-Side Fire.
 *
 * Phase T4 (2026-05-30) — Tracking-Maximum-Sprint.
 * Phase T4b (2026-05-30) — SOAP-Format laut Microsoft-Doku korrigiert:
 *   - Header xmlns direkt im Bing-namespace (kein i:-prefix für jeden tag)
 *   - Body-Elements im default Bing-namespace (kein a:-prefix mehr)
 *   - i:nil="true" für optional-fields (XMLSchema-instance namespace)
 *   - AlphaORDER: ConversionCurrencyCode/Name/Time/Value/MicrosoftClickId
 *   - https://learn.microsoft.com/en-us/advertising/campaign-management-service/applyofflineconversions
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
  // Bing-Format: "YYYY-MM-DDTHH:MM:SS" (kein Z, keine ms)
  const formattedTime = convTime.replace(/\.\d+Z?$/, '').replace('Z', '');

  // Microsoft-Doku-konforme SOAP-Envelope:
  // - Header xmlns="...CampaignManagement/v13" für ALLE child-tags (kein prefix)
  // - Body-Operation im default Bing-namespace
  // - OfflineConversion-Felder ohne namespace-prefix (im outer xmlns vererbt)
  // - AlphaORDER der Felder
  // - i:nil="true" für optionale Felder, "i" deklariert im s:Envelope
  const soap = `<?xml version="1.0" encoding="utf-8"?>
<s:Envelope xmlns:i="http://www.w3.org/2001/XMLSchema-instance" xmlns:s="http://schemas.xmlsoap.org/soap/envelope/">
  <s:Header xmlns="https://bingads.microsoft.com/CampaignManagement/v13">
    <Action mustUnderstand="1">ApplyOfflineConversions</Action>
    <AuthenticationToken i:nil="false">${escapeXml(access)}</AuthenticationToken>
    <CustomerAccountId i:nil="false">${escapeXml(accountId)}</CustomerAccountId>
    <CustomerId i:nil="false">${escapeXml(customerId)}</CustomerId>
    <DeveloperToken i:nil="false">${escapeXml(devToken)}</DeveloperToken>
  </s:Header>
  <s:Body>
    <ApplyOfflineConversionsRequest xmlns="https://bingads.microsoft.com/CampaignManagement/v13">
      <OfflineConversions i:nil="false">
        <OfflineConversion>
          <AdjustmentValue i:nil="true"/>
          <ConversionCurrencyCode i:nil="false">EUR</ConversionCurrencyCode>
          <ConversionName i:nil="false">${escapeXml(goalName)}</ConversionName>
          <ConversionTime>${escapeXml(formattedTime)}</ConversionTime>
          <ConversionValue i:nil="false">${value}</ConversionValue>
          <ExternalAttributionCredit i:nil="true"/>
          <ExternalAttributionModel i:nil="true"/>
          <HashedEmailAddress i:nil="true"/>
          <HashedPhoneNumber i:nil="true"/>
          <MicrosoftClickId i:nil="false">${escapeXml(lead.msclkid)}</MicrosoftClickId>
        </OfflineConversion>
      </OfflineConversions>
    </ApplyOfflineConversionsRequest>
  </s:Body>
</s:Envelope>`;

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
    // SOAP-Fault-Check (Bing returnt HTTP 200 selbst bei Fehler)
    if (txt.includes('<s:Fault>') || txt.includes('<faultcode>')) {
      const m = txt.match(/<faultstring[^>]*>([^<]+)</);
      return { status: 'error', error: m ? m[1].slice(0, 200) : `SOAP-Fault: ${txt.slice(0, 200)}` };
    }
    // BatchError = teilweise Fehler trotz Success
    if (txt.includes('<BatchError>') && !txt.includes('<BatchErrors i:nil="true"')) {
      const m = txt.match(/<Message[^>]*>([^<]+)</);
      return { status: 'error', error: m ? `batch: ${m[1].slice(0, 180)}` : 'batch_error' };
    }
    if (res.ok && txt.includes('ApplyOfflineConversionsResponse')) return { status: 'sent' };
    return { status: 'error', error: `HTTP ${res.status}: ${txt.slice(0, 200)}` };
  } catch (e: any) {
    return { status: 'error', error: String(e?.message || e).slice(0, 200) };
  }
}
