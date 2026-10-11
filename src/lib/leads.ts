/**
 * Leads-Datenlayer für das Leads-Dashboard (/admin/leads).
 * Quelle: pb-tracking `marketing_lead_submissions` (echte Form-Absendungen, 3000+).
 *
 * WICHTIG (PB-Eigenheit dieser Collection): Sort/Filter auf `created` wirft HTTP 400.
 * Als Zeitfeld daher IMMER `submitted_at` nutzen (funktioniert für sort + filter).
 * perPage-Cap: 500 → bei größeren Fenstern paginieren.
 */
import { listTrackingRecords } from './pb-tracking';

export type LeadRow = {
  id: string;
  lead_source?: string;
  form_id?: string;
  form_page?: string;
  landing_page?: string;
  first_referrer?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  status?: string;
  quality_score?: number;
  submitted_at?: string;
  geo_city?: string;
  lead_company?: string;
  lead_email?: string;
};

const FIELDS = 'id,lead_source,form_id,form_page,landing_page,first_referrer,utm_source,utm_medium,utm_campaign,status,quality_score,submitted_at,geo_city,lead_company,lead_email';

/** Holt alle Leads im Zeitfenster (days=null → alle). Paginiert bis max. 4000. */
export async function getLeads(days: number | null): Promise<LeadRow[]> {
  let filter = '';
  if (days && days > 0) {
    const since = new Date(Date.now() - days * 86400000).toISOString().replace('T', ' ').slice(0, 19);
    filter = `submitted_at>="${since}"`;
  }
  const all: LeadRow[] = [];
  for (let page = 1; page <= 8; page++) {
    const r = await listTrackingRecords('marketing_lead_submissions', {
      perPage: 500, page, sort: '-submitted_at', filter, fields: FIELDS,
    });
    const items = ((r as any)?.items || []) as LeadRow[];
    all.push(...items);
    if (items.length < 500) break;
  }
  return all;
}

export const QUALIFIED_MIN = 60;
export const isQualified = (l: LeadRow) => (l.quality_score || 0) >= QUALIFIED_MIN;
export const isLeadMagnet = (l: LeadRow) =>
  (l.lead_source || '').startsWith('leadmagnet-') || (l.form_id || '').startsWith('leadmagnet-');

/** Zählt Werte eines Feldes, absteigend. Leere → fallbackLabel. */
export function tally(rows: LeadRow[], key: keyof LeadRow, fallback = '(direkt / ohne)'): Array<{ label: string; n: number }> {
  const m = new Map<string, number>();
  for (const r of rows) {
    const v = String(r[key] ?? '').trim() || fallback;
    m.set(v, (m.get(v) || 0) + 1);
  }
  return [...m.entries()].map(([label, n]) => ({ label, n })).sort((a, b) => b.n - a.n);
}

/** Tages-Trend (YYYY-MM-DD → count), chronologisch, fehlende Tage mit 0 aufgefüllt. */
export function dailyTrend(rows: LeadRow[], days: number): Array<{ day: string; n: number }> {
  const m = new Map<string, number>();
  for (const r of rows) {
    const d = (r.submitted_at || '').slice(0, 10);
    if (d) m.set(d, (m.get(d) || 0) + 1);
  }
  const out: Array<{ day: string; n: number }> = [];
  const span = Math.min(days, 90);
  for (let i = span - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
    out.push({ day: d, n: m.get(d) || 0 });
  }
  return out;
}
