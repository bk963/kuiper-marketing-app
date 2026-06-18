/**
 * Bing / Microsoft Ads — Read-Only-Metriken aus dem PB-Cache (Collection bing_daily).
 *
 * Die Microsoft-Reporting-API ist SOAP + asynchron (submit → poll → CSV) und zu
 * langsam/fragil für einen Web-Request. Darum schreibt ein täglicher Sync
 * (/root/ads-analysis/bing_daily_sync.py) die Bing-Tagesmetriken je Kampagne nach
 * pb-tracking → hier lesen wir nur noch schnell aus.
 *
 * Spiegelt die Signaturen aus google-ads.ts (gadsMetric*), damit die Engine beide
 * Kanäle identisch behandeln kann.
 */
import { listTrackingRecords } from '@/lib/pb-tracking';
import type { GadsMetricKey } from '@/lib/google-ads';

interface BingRow { date: string; campaign: string; impressions: number; clicks: number; spend: number; conversions: number; }

const ZERO = { spend: 0, clicks: 0, impressions: 0, conversions: 0 };

/** Roh-Summen → abgeleitete Kennzahlen (analog deriveGadsRow). */
function derive(a: { spend: number; clicks: number; impressions: number; conversions: number }) {
  const cost = a.spend, clicks = a.clicks, impressions = a.impressions, conv = a.conversions;
  return {
    cost, clicks, impressions, conversions: conv,
    conversion_value: 0,                                  // Bing-Report liefert hier keinen Wert
    cpc: clicks ? cost / clicks : 0,
    ctr: impressions ? clicks / impressions : 0,
    cpa: conv ? cost / conv : 0,
    roas: 0,
  };
}

function pick(d: any, metric: GadsMetricKey): number {
  return (derive(d) as any)[metric] ?? 0;
}

/** Lädt bing_daily-Rows im Zeitraum [from,to] (optional Kampagnen-Contains). */
async function loadRows(fromISO: string, toISO: string, campaignContains?: string): Promise<BingRow[]> {
  let filter = `date >= "${fromISO}" && date <= "${toISO}"`;
  if (campaignContains) filter += ` && campaign ~ "${campaignContains.replace(/"/g, '')}"`;
  const res = await listTrackingRecords('bing_daily', { perPage: 500, sort: 'date', filter });
  return (res?.items || []) as BingRow[];
}

function sum(rows: BingRow[]) {
  return rows.reduce((a, r) => {
    a.spend += Number(r.spend || 0); a.clicks += Number(r.clicks || 0);
    a.impressions += Number(r.impressions || 0); a.conversions += Number(r.conversions || 0);
    return a;
  }, { ...ZERO });
}

/** Einzelwert einer Bing-Metrik über den Zeitraum. null = kein Cache/keine Daten. */
export async function bingMetricTotal(metric: GadsMetricKey, fromISO: string, toISO: string, campaignContains?: string): Promise<number | null> {
  try {
    const rows = await loadRows(fromISO, toISO, campaignContains);
    if (!rows.length) return 0;
    return pick(sum(rows), metric);
  } catch { return null; }
}

/** Tagesreihe einer Bing-Metrik (für Charts). */
export async function bingMetricSeries(metric: GadsMetricKey, fromISO: string, toISO: string, campaignContains?: string): Promise<{ date: string; value: number }[]> {
  try {
    const rows = await loadRows(fromISO, toISO, campaignContains);
    const byDate = new Map<string, any>();
    for (const r of rows) {
      const cur = byDate.get(r.date) || { ...ZERO };
      cur.spend += Number(r.spend || 0); cur.clicks += Number(r.clicks || 0);
      cur.impressions += Number(r.impressions || 0); cur.conversions += Number(r.conversions || 0);
      byDate.set(r.date, cur);
    }
    return [...byDate.entries()].sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, d]) => ({ date, value: pick(d, metric) }));
  } catch { return []; }
}

/** Breakdown einer Bing-Metrik je Kampagne. */
export async function bingMetricByCampaign(metric: GadsMetricKey, fromISO: string, toISO: string, limit = 15): Promise<{ key: string; value: number }[]> {
  try {
    const rows = await loadRows(fromISO, toISO);
    const byCamp = new Map<string, any>();
    for (const r of rows) {
      const cur = byCamp.get(r.campaign) || { ...ZERO };
      cur.spend += Number(r.spend || 0); cur.clicks += Number(r.clicks || 0);
      cur.impressions += Number(r.impressions || 0); cur.conversions += Number(r.conversions || 0);
      byCamp.set(r.campaign, cur);
    }
    return [...byCamp.entries()].map(([key, d]) => ({ key, value: pick(d, metric) }))
      .filter((x) => x.value > 0).sort((a, b) => b.value - a.value).slice(0, limit);
  } catch { return []; }
}
