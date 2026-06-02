/**
 * KPI-Engine — führt eine QuerySpec gegen die ECHTEN Connectoren aus.
 *
 * Routing nach Metrik:
 *   Lead-Metriken          → pb-tracking (leads.ts)
 *   Ads-Metriken           → google-ads.ts
 *   cpa_qualified          → Ads-cost ÷ Lead-qualified (kombiniert)
 *   sessions/users         → GA4
 *   gsc_*                  → Search Console
 *
 * Das LLM (GEX44) baut NUR die Spec — Daten kommen immer aus echten APIs.
 */
import {
  type QuerySpec, type KpiResult, type KpiMetric,
  DEFAULT_DAYS, METRIC_UNIT, METRIC_LABEL,
} from './types';
import { fetchLeads, aggregate, groupLeads, type LeadRow } from './leads';
import {
  gadsMetricTotal, gadsMetricSeries, gadsMetricByCampaign, type GadsMetricKey,
} from '@/lib/google-ads';
import { ga4Overview } from '@/lib/ga4';
import { gscSiteOverview } from '@/lib/gsc';

const LEAD_METRICS: KpiMetric[] = ['qualified_leads', 'leads', 'submit_to_qualified_rate', 'avg_quality_score', 'revenue', 'won_deals'];
const ADS_METRICS: KpiMetric[] = ['cost', 'conversions', 'cpa', 'clicks', 'impressions', 'ctr', 'cpc', 'roas', 'conversion_value'];

function pad(n: number) { return String(n).padStart(2, '0'); }
function iso(d: Date) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }

/** Spec → { days, fromISO, toISO }. */
function resolveRange(spec: QuerySpec): { days: number; fromISO: string; toISO: string } {
  if (spec.from && spec.to) {
    const from = new Date(spec.from + 'T00:00:00');
    const to = new Date(spec.to + 'T00:00:00');
    const days = Math.max(1, Math.round((to.getTime() - from.getTime()) / 86400000) + 1);
    return { days, fromISO: spec.from, toISO: spec.to };
  }
  const days = Math.max(1, spec.days || DEFAULT_DAYS);
  const to = new Date();
  const from = new Date(to.getTime() - (days - 1) * 86400000);
  return { days, fromISO: iso(from), toISO: iso(to) };
}

function leadValue(rows: LeadRow[], metric: KpiMetric): number {
  const a = aggregate(rows);
  switch (metric) {
    case 'leads': return a.leads;
    case 'submit_to_qualified_rate': return a.submit_to_qualified_rate;
    case 'avg_quality_score': return a.avg_quality_score;
    case 'revenue': return a.revenue;
    case 'won_deals': return a.won;
    default: return a.qualified;
  }
}

function baseDim(metric: KpiMetric): 'qualified_leads' | 'leads' | 'revenue' | 'won_deals' | 'avg_quality_score' {
  if (metric === 'leads' || metric === 'revenue' || metric === 'won_deals' || metric === 'avg_quality_score') return metric;
  return 'qualified_leads'; // submit_to_qualified_rate fällt hier auf qualified zurück (Breakdown special-cased im Aufrufer)
}

export async function runQuery(spec: QuerySpec): Promise<KpiResult> {
  const metric = spec.metric;
  const unit = METRIC_UNIT[metric] || 'float';
  const label = spec.title || METRIC_LABEL[metric] || metric;
  const { days, fromISO, toISO } = resolveRange(spec);
  const dim = spec.dimension && spec.dimension !== 'none' ? spec.dimension : null;
  const base: Partial<KpiResult> = { spec, unit, label };

  try {
    // ── Lead-Metriken ────────────────────────────────────────────────
    if (LEAD_METRICS.includes(metric)) {
      const { rows, capped, error } = await fetchLeads(fromISO, toISO, {
        city: spec.city, channel: spec.channel, course: spec.course,
      });
      if (error) return { ...base, ok: false, value: null, source: 'pb-tracking', error } as KpiResult;
      const value = leadValue(rows, metric);
      const res: KpiResult = {
        ...base, ok: true, value, source: 'pb-tracking',
        note: capped ? 'Limit 2000 Records erreicht — Wert ggf. unvollständig' : undefined,
      } as KpiResult;
      // Tagesreihe (immer hilfreich)
      res.series = metric === 'submit_to_qualified_rate'
        ? rateSeries(rows)
        : groupLeads(rows, 'day', baseDim(metric));
      // Breakdown
      if (dim && (dim === 'city' || dim === 'channel' || dim === 'course')) {
        res.breakdown = metric === 'submit_to_qualified_rate'
          ? rateBreakdown(rows, dim)
          : groupLeads(rows, dim, baseDim(metric));
      } else if (dim === 'day') {
        res.breakdown = res.series;
      }
      return res;
    }

    // ── cpa_qualified: Ads-Spend ÷ qualifizierte Leads ───────────────
    if (metric === 'cpa_qualified') {
      const [cost, leadRes] = await Promise.all([
        gadsMetricTotal('cost', days, spec.campaign),
        fetchLeads(fromISO, toISO, { city: spec.city, channel: spec.channel, course: spec.course }),
      ]);
      const qualified = aggregate(leadRes.rows).qualified;
      const value = qualified > 0 && cost != null ? cost / qualified : null;
      return {
        ...base, ok: cost != null, value, source: 'google-ads + pb-tracking',
        note: spec.city ? 'Spend ist konto-/kampagnenweit (Ads liefert keinen Stadt-Spend); Stadt filtert nur die Leads.' : undefined,
      } as KpiResult;
    }

    // ── Ads-Metriken ─────────────────────────────────────────────────
    if (ADS_METRICS.includes(metric)) {
      const gm = metric as GadsMetricKey;
      const [value, series, breakdown] = await Promise.all([
        gadsMetricTotal(gm, days, spec.campaign),
        gadsMetricSeries(gm, days, spec.campaign),
        dim === 'campaign' ? gadsMetricByCampaign(gm, days) : Promise.resolve(undefined),
      ]);
      if (value == null) return { ...base, ok: false, value: null, source: 'google-ads', error: 'Google Ads nicht verbunden' } as KpiResult;
      return {
        ...base, ok: true, value, series, breakdown, source: 'google-ads',
        note: (spec.city && dim !== 'campaign') ? 'Stadt-Filter für Ads-Metriken nicht verfügbar (nur Leads haben Stadt).' : undefined,
      } as KpiResult;
    }

    // ── GA4 ──────────────────────────────────────────────────────────
    if (metric === 'sessions' || metric === 'users') {
      const ga = await ga4Overview(days);
      if (!ga) return { ...base, ok: false, value: null, source: 'ga4', error: 'GA4 nicht verbunden' } as KpiResult;
      const value = metric === 'users' ? ga.total.users : ga.total.sessions;
      const series = (ga.rows || []).map((r) => ({
        date: r.dimension, value: metric === 'users' ? r.users : r.sessions,
      }));
      return { ...base, ok: true, value, series, source: 'ga4', error: ga.error } as KpiResult;
    }

    // ── Search Console ───────────────────────────────────────────────
    if (metric === 'gsc_clicks' || metric === 'gsc_impressions' || metric === 'gsc_position') {
      const g: any = await gscSiteOverview(days);
      if (!g) return { ...base, ok: false, value: null, source: 'gsc', error: 'Search Console nicht verbunden' } as KpiResult;
      const t = g.total || {};
      const value = metric === 'gsc_clicks' ? Number(t.clicks || 0)
        : metric === 'gsc_impressions' ? Number(t.impressions || 0)
        : Number(t.position || 0);
      return { ...base, ok: true, value, source: 'gsc' } as KpiResult;
    }

    return { ...base, ok: false, value: null, source: 'unknown', error: `Unbekannte Metrik: ${metric}` } as KpiResult;
  } catch (e: any) {
    return { ...base, ok: false, value: null, source: 'engine', error: e?.message?.slice(0, 200) || 'Engine-Fehler' } as KpiResult;
  }
}

/** Submit→Qualified-Quote als Tagesreihe. */
function rateSeries(rows: LeadRow[]): { date: string; value: number }[] {
  const byDay = new Map<string, { q: number; n: number }>();
  for (const r of rows) {
    const d = (r.created || '').slice(0, 10);
    const c = byDay.get(d) || { q: 0, n: 0 };
    c.n++; if (r.qualified) c.q++;
    byDay.set(d, c);
  }
  return [...byDay.entries()].sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, c]) => ({ date, value: c.n ? c.q / c.n : 0 }));
}

/** Submit→Qualified-Quote je Dimension. */
function rateBreakdown(rows: LeadRow[], dim: 'city' | 'channel' | 'course'): { key: string; value: number }[] {
  const by = new Map<string, { q: number; n: number }>();
  for (const r of rows) {
    const key = dim === 'city' ? (r.city || '—') : dim === 'channel' ? r.channel : (r.course || '—');
    const c = by.get(key) || { q: 0, n: 0 };
    c.n++; if (r.qualified) c.q++;
    by.set(key, c);
  }
  return [...by.entries()].map(([key, c]) => ({ key, value: c.n ? c.q / c.n : 0 }))
    .sort((a, b) => b.value - a.value);
}
