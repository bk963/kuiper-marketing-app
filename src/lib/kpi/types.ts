/**
 * KPI-Cockpit — zentrale Typen.
 *
 * Eine QuerySpec ist die Single-Source-of-Truth: GEX44 produziert sie aus einer
 * NL-Frage, gepinnte Kacheln speichern sie, und die Engine führt sie aus.
 * Jede Kachel = genau eine QuerySpec.
 */

/** Welche Kennzahl. Bestimmt implizit die Datenquelle. */
export type KpiMetric =
  // Leads (pb-tracking · marketing_lead_submissions)
  | 'qualified_leads'          // Anzahl Leads mit quality_score >= 60
  | 'leads'                    // Alle Form-Submits
  | 'submit_to_qualified_rate' // qualified / leads
  | 'avg_quality_score'        // Ø quality_score
  | 'revenue'                  // Summe revenue (Closed-Loop)
  | 'won_deals'               // Anzahl status=won
  // Google Ads
  | 'cost'
  | 'conversions'
  | 'cpa'                      // cost / conversions (Ads-intern)
  | 'cpa_qualified'            // cost / qualified_leads (echter CPA)
  | 'clicks'
  | 'impressions'
  | 'ctr'
  | 'cpc'
  | 'roas'
  | 'conversion_value'
  // GA4
  | 'sessions'
  | 'users'
  // GSC
  | 'gsc_clicks'
  | 'gsc_impressions'
  | 'gsc_position';

/** Aufschlüsselung (Breakdown-Achse). 'none' = einzelne Zahl. */
export type KpiDimension = 'none' | 'city' | 'channel' | 'campaign' | 'day' | 'course';

/** Kanal-Filter (abgeleitet aus gclid/msclkid/utm_source). */
export type KpiChannel = 'google' | 'bing' | 'organic' | 'direct' | 'meta' | 'other';

export interface QuerySpec {
  metric: KpiMetric;
  dimension?: KpiDimension;
  /** Filter */
  city?: string;       // matcht lead_city / geo_city (case-insensitive contains)
  channel?: KpiChannel;
  campaign?: string;   // contains-Match auf Kampagnenname
  course?: string;     // lead_course_interest contains
  /** Zeitraum — relative Tage (Default 30) ODER explizit from/to (ISO YYYY-MM-DD) */
  days?: number;
  from?: string;
  to?: string;
  /** Anzeige */
  title?: string;
}

export type KpiUnit = 'eur' | 'pct' | 'int' | 'float' | 'pos';

export interface KpiResult {
  spec: QuerySpec;
  ok: boolean;
  value: number | null;
  unit: KpiUnit;
  label: string;
  series?: { date: string; value: number }[];
  breakdown?: { key: string; value: number }[];
  /** Vergleich zur gleich langen Vorperiode (nur bei Einzelwert-Kacheln). */
  delta?: { prev: number | null; pct: number | null };
  source: string;
  note?: string;
  error?: string;
}

/** Ist ein steigender Wert "gut"? Steuert die Δ-Ampelfarbe (z.B. Kosten runter = grün). */
export const METRIC_HIGHER_IS_BETTER: Record<KpiMetric, boolean> = {
  qualified_leads: true, leads: true, submit_to_qualified_rate: true, avg_quality_score: true,
  revenue: true, won_deals: true, conversions: true, clicks: true, impressions: true,
  ctr: true, roas: true, conversion_value: true, sessions: true, users: true,
  gsc_clicks: true, gsc_impressions: true,
  cost: false, cpa: false, cpa_qualified: false, cpc: false, gsc_position: false,
};

/** Default-Zeitraum, wenn die Spec keinen nennt. */
export const DEFAULT_DAYS = 30;

/** Schwelle für "qualifiziert" — identisch zur Worker-scoring.v1.js. */
export const QUALIFIED_THRESHOLD = 60;

/** Welche Unit pro Metrik (für Formatierung im Frontend). */
export const METRIC_UNIT: Record<KpiMetric, KpiUnit> = {
  qualified_leads: 'int', leads: 'int', submit_to_qualified_rate: 'pct',
  avg_quality_score: 'float', revenue: 'eur', won_deals: 'int',
  cost: 'eur', conversions: 'float', cpa: 'eur', cpa_qualified: 'eur',
  clicks: 'int', impressions: 'int', ctr: 'pct', cpc: 'eur', roas: 'float',
  conversion_value: 'eur', sessions: 'int', users: 'int',
  gsc_clicks: 'int', gsc_impressions: 'int', gsc_position: 'float',
};

/** Menschlicher Default-Titel pro Metrik (wenn spec.title fehlt). */
export const METRIC_LABEL: Record<KpiMetric, string> = {
  qualified_leads: 'Qualifizierte Leads', leads: 'Leads (alle)',
  submit_to_qualified_rate: 'Submit→Qualified-Quote', avg_quality_score: 'Ø Lead-Score',
  revenue: 'Umsatz (Closed-Loop)', won_deals: 'Gewonnene Deals',
  cost: 'Ad-Spend', conversions: 'Conversions', cpa: 'CPA (Ads)',
  cpa_qualified: 'CPA pro qualifiziertem Lead', clicks: 'Klicks',
  impressions: 'Impressionen', ctr: 'CTR', cpc: 'CPC', roas: 'ROAS',
  conversion_value: 'Conversion-Wert', sessions: 'Sessions', users: 'Nutzer',
  gsc_clicks: 'SEO-Klicks', gsc_impressions: 'SEO-Impressionen', gsc_position: 'Ø Position',
};
