/**
 * Lead-KPIs aus pb-tracking (Collection marketing_lead_submissions).
 *
 * Quelle der Wahrheit für: qualifizierte Leads, Submit→Qualified-Quote,
 * Ø Lead-Score, Closed-Loop-Umsatz — je Stadt / Kanal / Kurs / Tag.
 *
 * Strategie: Records im Zeitraum laden (paginiert), dann in JS filtern +
 * gruppieren. Bei aktuellem Volumen (Kampagnen frisch) unkritisch; ab ~5k
 * Leads/Monat sollte auf serverseitige Aggregation umgestellt werden (siehe CAP).
 */
import { listTrackingRecords } from '@/lib/pb-tracking';
import { QUALIFIED_THRESHOLD, type KpiChannel } from './types';

const CAP = 2000; // max Records pro Abfrage (5 Seiten à 400) — Schutz + Note bei Erreichen

export interface LeadRow {
  created: string;
  quality_score: number;
  qualified: boolean;
  city: string;
  channel: KpiChannel;
  course: string;
  status: string;
  revenue: number;
}

/** Kanal aus Click-IDs / utm_source ableiten. */
function deriveChannel(r: any): KpiChannel {
  const src = String(r.utm_source || '').toLowerCase();
  const med = String(r.utm_medium || '').toLowerCase();
  if (r.gclid || r.gbraid || r.wbraid || src.includes('google')) return 'google';
  if (r.msclkid || src.includes('bing') || src.includes('microsoft')) return 'bing';
  if (r.fbclid || src.includes('facebook') || src.includes('meta') || src.includes('instagram')) return 'meta';
  if (med.includes('organic') || src.includes('organic')) return 'organic';
  if (!src && !r.utm_medium) return 'direct';
  return 'other';
}

function normalizeRow(r: any): LeadRow {
  const score = Number(r.quality_score || 0);
  return {
    created: String(r.submitted_at || r.created || ''),
    quality_score: score,
    qualified: score >= QUALIFIED_THRESHOLD,
    city: String(r.lead_city || r.geo_city || '').trim(),
    channel: deriveChannel(r),
    course: String(r.lead_course_interest || '').trim(),
    status: String(r.status || '').toLowerCase(),
    revenue: Number(r.revenue || 0),
  };
}

export interface LeadFilters {
  city?: string;
  channel?: KpiChannel;
  course?: string;
}

export interface LeadFetch {
  rows: LeadRow[];
  capped: boolean;
  error?: string;
}

/**
 * Lädt alle Leads im Zeitraum [fromISO, toISO) und wendet Filter an.
 * fromISO/toISO als "YYYY-MM-DD" (toISO exklusiv obere Grenze + 1 Tag durch Aufrufer).
 */
export async function fetchLeads(fromISO: string, toISO: string, filters: LeadFilters = {}): Promise<LeadFetch> {
  // PB-Instanz wirft 400 bei Filtern auf das System-Feld `created` — daher
  // über das eigene Feld `submitted_at` filtern (verifiziert 2026-06-02).
  const parts = [`submitted_at >= "${fromISO} 00:00:00"`, `submitted_at <= "${toISO} 23:59:59"`];
  const filter = parts.join(' && ');
  const fields = 'id,submitted_at,quality_score,lead_city,geo_city,lead_course_interest,status,revenue,utm_source,utm_medium,gclid,gbraid,wbraid,msclkid,fbclid';

  const out: LeadRow[] = [];
  let page = 1;
  let capped = false;
  try {
    for (; page <= 5; page++) {
      const res = await listTrackingRecords('marketing_lead_submissions', {
        perPage: 400, page, sort: '-submitted_at', filter, fields,
      });
      if (!res) return { rows: out, capped, error: 'pb-tracking nicht erreichbar' };
      const items = res.items || [];
      for (const r of items) out.push(normalizeRow(r));
      if (items.length < 400) break;
      if (out.length >= CAP) { capped = true; break; }
    }
  } catch (e: any) {
    return { rows: out, capped, error: e?.message?.slice(0, 200) || 'fetch error' };
  }

  const cityQ = filters.city?.toLowerCase().trim();
  const courseQ = filters.course?.toLowerCase().trim();
  const rows = out.filter((r) => {
    if (cityQ && !r.city.toLowerCase().includes(cityQ)) return false;
    if (filters.channel && r.channel !== filters.channel) return false;
    if (courseQ && !r.course.toLowerCase().includes(courseQ)) return false;
    return true;
  });
  return { rows, capped };
}

/** Aggregat-Kennzahlen über ein Row-Set. */
export function aggregate(rows: LeadRow[]) {
  const leads = rows.length;
  const qualified = rows.filter((r) => r.qualified).length;
  const won = rows.filter((r) => r.status === 'won' || r.status === 'gewonnen').length;
  const revenue = rows.reduce((s, r) => s + r.revenue, 0);
  const scoreSum = rows.reduce((s, r) => s + r.quality_score, 0);
  return {
    leads,
    qualified,
    won,
    revenue,
    submit_to_qualified_rate: leads ? qualified / leads : 0,
    avg_quality_score: leads ? scoreSum / leads : 0,
  };
}

/** Gruppiert ein Row-Set nach Achse → {key,value} für eine gegebene Metrik. */
export function groupLeads(
  rows: LeadRow[],
  dimension: 'city' | 'channel' | 'course' | 'day',
  metric: 'qualified_leads' | 'leads' | 'revenue' | 'won_deals' | 'avg_quality_score',
): { key: string; value: number }[] {
  const buckets = new Map<string, LeadRow[]>();
  for (const r of rows) {
    let key: string;
    if (dimension === 'city') key = r.city || '—';
    else if (dimension === 'channel') key = r.channel;
    else if (dimension === 'course') key = r.course || '—';
    else key = (r.created || '').slice(0, 10);
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key)!.push(r);
  }
  const result = [...buckets.entries()].map(([key, rs]) => {
    const a = aggregate(rs);
    const value =
      metric === 'leads' ? a.leads :
      metric === 'revenue' ? a.revenue :
      metric === 'won_deals' ? a.won :
      metric === 'avg_quality_score' ? a.avg_quality_score :
      a.qualified;
    return { key, value };
  });
  // Tage chronologisch, sonst nach Wert absteigend
  if (dimension === 'day') result.sort((x, y) => x.key.localeCompare(y.key));
  else result.sort((x, y) => y.value - x.value);
  return result;
}
