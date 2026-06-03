/**
 * Google Ads API Wrapper (Read-Only Reports)
 *
 * ENV (alle bereits gesetzt in marketing-capi.env):
 *   GOOGLE_ADS_DEVELOPER_TOKEN
 *   GOOGLE_ADS_CUSTOMER_ID         — Account-ID ohne Bindestriche
 *   GOOGLE_ADS_LOGIN_CUSTOMER_ID   — MCC-Manager-Account-ID
 *   GOOGLE_OAUTH_CLIENT_ID
 *   GOOGLE_OAUTH_CLIENT_SECRET
 *   GOOGLE_OAUTH_REFRESH_TOKEN
 */
import { GoogleAdsApi } from 'google-ads-api';

let _api: any = null;
function getApi() {
  if (_api) return _api;
  const dt = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
  const cid = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const csec = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  if (!dt || !cid || !csec) return null;
  try {
    _api = new GoogleAdsApi({
      client_id: cid,
      client_secret: csec,
      developer_token: dt,
    });
    return _api;
  } catch { return null; }
}

function getCustomer() {
  const api = getApi();
  const cid = process.env.GOOGLE_ADS_CUSTOMER_ID;
  const login_cid = process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID;
  const refresh = process.env.GOOGLE_OAUTH_REFRESH_TOKEN;
  if (!api || !cid || !refresh) return null;
  try {
    return api.Customer({
      customer_id: cid.replace(/-/g, ''),
      login_customer_id: login_cid?.replace(/-/g, ''),
      refresh_token: refresh,
    });
  } catch { return null; }
}

export async function gadsAccountSummary(days = 7) {
  const customer = getCustomer();
  if (!customer) return null;
  try {
    const rows = await customer.query(`
      SELECT
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros,
        metrics.conversions,
        metrics.conversions_value
      FROM customer
      WHERE segments.date DURING LAST_${days}_DAYS
    `);
    const r = rows[0] || ({} as any);
    const cost = Number(r.metrics?.cost_micros || 0) / 1_000_000;
    const clicks = Number(r.metrics?.clicks || 0);
    const impressions = Number(r.metrics?.impressions || 0);
    const conv = Number(r.metrics?.conversions || 0);
    const convValue = Number(r.metrics?.conversions_value || 0);
    return {
      impressions, clicks, cost, conversions: conv, conversionValue: convValue,
      cpc: clicks ? cost / clicks : 0,
      ctr: impressions ? clicks / impressions : 0,
      cpa: conv ? cost / conv : 0,
      roas: cost ? convValue / cost : 0,
    };
  } catch (e: any) {
    return { impressions: 0, clicks: 0, cost: 0, conversions: 0, conversionValue: 0, cpc: 0, ctr: 0, cpa: 0, roas: 0, error: e?.message?.slice(0, 200) };
  }
}

// ─── KPI-Cockpit: generische Metrik-Abfragen (Account-Total / Tagesreihe / je Kampagne) ───

export type GadsMetricKey =
  | 'cost' | 'conversions' | 'clicks' | 'impressions'
  | 'ctr' | 'cpc' | 'roas' | 'cpa' | 'conversion_value';

/** Roh-Metriken einer GAQL-Zeile in Kennzahlen umrechnen. */
function deriveGadsRow(m: any) {
  const cost = Number(m?.cost_micros || 0) / 1_000_000;
  const clicks = Number(m?.clicks || 0);
  const impressions = Number(m?.impressions || 0);
  const conv = Number(m?.conversions || 0);
  const convValue = Number(m?.conversions_value || 0);
  return {
    cost, clicks, impressions, conversions: conv, conversion_value: convValue,
    cpc: clicks ? cost / clicks : 0,
    ctr: impressions ? clicks / impressions : 0,
    cpa: conv ? cost / conv : 0,
    roas: cost ? convValue / cost : 0,
  };
}

const METRIC_SELECT = `
  metrics.impressions, metrics.clicks, metrics.cost_micros,
  metrics.conversions, metrics.conversions_value`;

const ZERO = { cost_micros: 0, clicks: 0, impressions: 0, conversions: 0, conversions_value: 0 };
function addRow(a: any, m: any) {
  a.cost_micros += Number(m?.cost_micros || 0);
  a.clicks += Number(m?.clicks || 0);
  a.impressions += Number(m?.impressions || 0);
  a.conversions += Number(m?.conversions || 0);
  a.conversions_value += Number(m?.conversions_value || 0);
  return a;
}
const dateClause = (from: string, to: string) => `segments.date BETWEEN '${from}' AND '${to}'`;

/** Einzelwert einer Ads-Metrik über das Konto im Zeitraum [from,to] (optional 1 Kampagne). */
export async function gadsMetricTotal(metric: GadsMetricKey, fromISO: string, toISO: string, campaignContains?: string): Promise<number | null> {
  const customer = getCustomer();
  if (!customer) return null;
  try {
    const src = campaignContains ? 'campaign' : 'customer';
    const where = [dateClause(fromISO, toISO)];
    if (campaignContains) where.push(`campaign.name LIKE '%${campaignContains.replace(/'/g, '')}%'`, `campaign.status != 'REMOVED'`);
    const rows = await customer.query(`SELECT ${METRIC_SELECT} FROM ${src} WHERE ${where.join(' AND ')}`);
    const agg = rows.reduce((a: any, r: any) => addRow(a, r.metrics), { ...ZERO });
    return (deriveGadsRow(agg) as any)[metric] ?? 0;
  } catch { return null; }
}

/** Tagesreihe einer Ads-Metrik (für Charts). */
export async function gadsMetricSeries(metric: GadsMetricKey, fromISO: string, toISO: string, campaignContains?: string): Promise<{ date: string; value: number }[]> {
  const customer = getCustomer();
  if (!customer) return [];
  try {
    const src = campaignContains ? 'campaign' : 'customer';
    const where = [dateClause(fromISO, toISO)];
    if (campaignContains) where.push(`campaign.name LIKE '%${campaignContains.replace(/'/g, '')}%'`, `campaign.status != 'REMOVED'`);
    const rows = await customer.query(`SELECT segments.date, ${METRIC_SELECT} FROM ${src} WHERE ${where.join(' AND ')} ORDER BY segments.date`);
    const byDate = new Map<string, any>();
    for (const r of rows) {
      const d = String(r.segments?.date || '');
      byDate.set(d, addRow(byDate.get(d) || { ...ZERO }, r.metrics));
    }
    return [...byDate.entries()].sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, agg]) => ({ date, value: (deriveGadsRow(agg) as any)[metric] ?? 0 }));
  } catch { return []; }
}

/** Breakdown einer Ads-Metrik je Kampagne im Zeitraum. */
export async function gadsMetricByCampaign(metric: GadsMetricKey, fromISO: string, toISO: string, limit = 15): Promise<{ key: string; value: number }[]> {
  const customer = getCustomer();
  if (!customer) return [];
  try {
    const rows = await customer.query(`
      SELECT campaign.name, ${METRIC_SELECT}
      FROM campaign
      WHERE ${dateClause(fromISO, toISO)} AND campaign.status != 'REMOVED'
      ORDER BY metrics.cost_micros DESC LIMIT ${limit}`);
    return rows.map((r: any) => ({
      key: r.campaign?.name || '—',
      value: (deriveGadsRow(r.metrics) as any)[metric] ?? 0,
    })).filter((x: any) => x.value > 0);
  } catch { return []; }
}

export async function gadsCampaigns(days = 7, limit = 20) {
  const customer = getCustomer();
  if (!customer) return null;
  try {
    const rows = await customer.query(`
      SELECT
        campaign.id,
        campaign.name,
        campaign.status,
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros,
        metrics.conversions,
        metrics.conversions_value
      FROM campaign
      WHERE segments.date DURING LAST_${days}_DAYS
        AND campaign.status != 'REMOVED'
      ORDER BY metrics.cost_micros DESC
      LIMIT ${limit}
    `);
    return rows.map((r: any) => {
      const cost = Number(r.metrics?.cost_micros || 0) / 1_000_000;
      const clicks = Number(r.metrics?.clicks || 0);
      const conv = Number(r.metrics?.conversions || 0);
      const convValue = Number(r.metrics?.conversions_value || 0);
      return {
        id: r.campaign?.id || '',
        name: r.campaign?.name || '',
        status: r.campaign?.status || '',
        impressions: Number(r.metrics?.impressions || 0),
        clicks,
        cost,
        conversions: conv,
        cpc: clicks ? cost / clicks : 0,
        cpa: conv ? cost / conv : 0,
        roas: cost ? convValue / cost : 0,
      };
    });
  } catch { return []; }
}
