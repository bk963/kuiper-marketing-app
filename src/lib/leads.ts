/**
 * Leads-Datenlayer für das Leads-Dashboard (/admin/leads).
 * Quelle: pb-tracking `marketing_lead_submissions` (echte Form-Absendungen).
 *
 * WICHTIG (PB-Eigenheit dieser Collection): Sort/Filter auf `created` wirft HTTP 400.
 * Als Zeitfeld daher IMMER `submitted_at`. perPage-Cap: 500 → paginieren.
 */
import { listTrackingRecords } from './pb-tracking';
import { createHash } from 'node:crypto';

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

/**
 * Nur ECHTE externe Form-Einsendungen. Ausgeschlossen (sonst ~96% Rauschen):
 * - BSH-Form-Watchdog: Cron alle 2h via HeadlessChrome → user_agent enthält "Headless"
 * - Bot-Spam: honeypot-Feld gefüllt
 * - interne Test-Mails: @test.de / e2e-watchdog / @kuiper-safety.de / @brandschutzdozenten.de / kuiper0281@gmail.com
 * Abgeglichen 2026-10-11: 30T roh 1115 → echt 36.
 */
export const REAL_LEADS_FILTER =
  'user_agent!~"Headless" && honeypot="" && lead_email!~"@test.de" && lead_email!~"e2e-watchdog" && lead_email!~"@kuiper-safety.de" && lead_email!~"@brandschutzdozenten.de" && lead_email!="kuiper0281@gmail.com"';

async function fetchLeads(filter: string): Promise<LeadRow[]> {
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

/** Leads zwischen zwei UTC-Zeitgrenzen ("YYYY-MM-DD HH:MM:SS"). null = offen. */
export async function getLeadsBetween(sinceIso: string | null, untilIso: string | null): Promise<LeadRow[]> {
  const parts = [REAL_LEADS_FILTER];
  if (sinceIso) parts.push(`submitted_at>="${sinceIso}"`);
  if (untilIso) parts.push(`submitted_at<="${untilIso}"`);
  return fetchLeads(parts.join(' && '));
}

/** Komfort: letzte N Tage (days=null → alle). */
export async function getLeads(days: number | null): Promise<LeadRow[]> {
  const since = (days && days > 0)
    ? new Date(Date.now() - days * 86400000).toISOString().replace('T', ' ').slice(0, 19)
    : null;
  return getLeadsBetween(since, null);
}

export type WonSets = { emailHashes: Set<string>; domains: Set<string> };
const FREEMAIL = new Set(['gmail.com','googlemail.com','web.de','gmx.de','gmx.net','gmx.at','gmx.ch','t-online.de','yahoo.com','yahoo.de','hotmail.com','hotmail.de','outlook.com','outlook.de','live.com','live.de','icloud.com','me.com','mac.com','aol.com','freenet.de','mail.de','posteo.de','online.de','arcor.de','vodafone.de','kabelmail.de','ewe.net','1und1.de','gmx.com','protonmail.com','proton.me']);

/**
 * Won-Marker aus echten easybill-Rechnungskunden (INVOICE, nicht draft) — täglich via
 * sync_won_emails.sh. emailHashes = exakter Zahler-Match; domains = Business-Domains der
 * Zahler (Freemail ausgeschlossen) für "privat angefragt, Firma kauft"-Fälle.
 */
export async function getWonSets(): Promise<WonSets> {
  try {
    const r = await listTrackingRecords('mkt_won_emails', { perPage: 1, fields: 'hashes_json,domains_json' });
    const rec = (r as any)?.items?.[0] || {};
    return {
      emailHashes: new Set(Array.isArray(rec.hashes_json) ? rec.hashes_json : []),
      domains: new Set(Array.isArray(rec.domains_json) ? rec.domains_json : []),
    };
  } catch { return { emailHashes: new Set(), domains: new Set() }; }
}
const emailHash = (e?: string) => e ? createHash('sha256').update(e.toLowerCase().trim()).digest('hex') : '';
const domainOf = (e?: string) => (e || '').toLowerCase().trim().split('@')[1] || '';
/** Wurde dieser Lead zahlender easybill-Kunde? Exakter Match oder (nicht-Freemail) Firmen-Domain. */
export const isWon = (l: LeadRow, w: WonSets) => {
  const e = (l.lead_email || '').toLowerCase().trim();
  if (!e.includes('@')) return false;
  if (w.emailHashes.has(emailHash(e))) return true;
  const d = domainOf(e);
  return !!d && !FREEMAIL.has(d) && w.domains.has(d);
};

/** Wie tally(), zusätzlich mit Kunden-Anzahl je Gruppe (Lead→Kunde-Conversion). */
export function tallyWon(rows: LeadRow[], key: keyof LeadRow, wonSet: WonSets, fallback = '(direkt / ohne)'): Array<{ label: string; n: number; won: number }> {
  const m = new Map<string, { n: number; won: number }>();
  for (const r of rows) {
    const v = String(r[key] ?? '').trim() || fallback;
    const e = m.get(v) || { n: 0, won: 0 };
    e.n++; if (isWon(r, wonSet)) e.won++;
    m.set(v, e);
  }
  return [...m.entries()].map(([label, x]) => ({ label, ...x })).sort((a, b) => b.n - a.n);
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

/**
 * Tages-Trend über ein explizites Fenster [startStr, endStr] (je "YYYY-MM-DD",
 * Kalendertage). Fehlende Tage mit 0. Bei >90 Tagen werden die letzten 90 gezeigt.
 */
export function dailyTrend(rows: LeadRow[], startStr: string, endStr: string): Array<{ day: string; n: number }> {
  const m = new Map<string, number>();
  for (const r of rows) {
    const d = (r.submitted_at || '').slice(0, 10);
    if (d) m.set(d, (m.get(d) || 0) + 1);
  }
  const start = Date.parse(startStr + 'T00:00:00Z');
  const end = Date.parse(endStr + 'T00:00:00Z');
  let days = Math.max(1, Math.round((end - start) / 86400000) + 1);
  let cursor = start;
  if (days > 90) { cursor = end - 89 * 86400000; days = 90; }
  const out: Array<{ day: string; n: number }> = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(cursor + i * 86400000).toISOString().slice(0, 10);
    out.push({ day: d, n: m.get(d) || 0 });
  }
  return out;
}
