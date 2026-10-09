/**
 * Steuerbares Keyword-Universum für die Wettbewerbs-/Dominanz-Analyse.
 * Liest aktive Keywords aus PB-Collection `mkt_keywords` (im Cockpit pflegbar).
 * Fallback auf die eingebauten Money-Keywords, falls die Collection leer/nicht erreichbar ist.
 */
import { listTrackingRecords } from '@/lib/pb-tracking';

export type KeywordRow = { id: string; keyword: string; gruppe: string; aktiv: boolean; notiz?: string };

// Fallback — die Nische: externe SiFa + externer BSB, Fokus Pflege.
export const FALLBACK_KEYWORDS: { keyword: string; gruppe: string }[] = [
  { keyword: 'externe fachkraft für arbeitssicherheit', gruppe: 'sifa' },
  { keyword: 'externe sicherheitsfachkraft', gruppe: 'sifa' },
  { keyword: 'externer brandschutzbeauftragter', gruppe: 'bsb' },
  { keyword: 'brandschutzbeauftragter extern kosten', gruppe: 'kosten' },
  { keyword: 'externe sifa pflege', gruppe: 'pflege' },
  { keyword: 'externer brandschutzbeauftragter pflegeheim', gruppe: 'pflege' },
];

export const GRUPPEN = ['sifa', 'bsb', 'pflege', 'lokal', 'kosten', 'sonstige'] as const;

export async function getKeywordRows(opts?: { gruppe?: string; onlyActive?: boolean }): Promise<KeywordRow[]> {
  try {
    const r = await listTrackingRecords('mkt_keywords', { sort: 'gruppe,keyword', perPage: 500 });
    let items = ((r as any)?.items || []) as KeywordRow[];
    if (opts?.onlyActive !== false) items = items.filter((k) => k.aktiv);
    if (opts?.gruppe) items = items.filter((k) => k.gruppe === opts.gruppe);
    return items;
  } catch { return []; }
}

/** Aktive Keywords als flache Liste (für SERP-Scan). Fällt auf FALLBACK zurück, wenn leer. */
export async function getActiveKeywords(gruppe?: string): Promise<string[]> {
  const rows = await getKeywordRows({ gruppe, onlyActive: true });
  if (rows.length) return rows.map((r) => r.keyword);
  const fb = gruppe ? FALLBACK_KEYWORDS.filter((k) => k.gruppe === gruppe) : FALLBACK_KEYWORDS;
  return fb.map((k) => k.keyword);
}

/** Map gruppe -> keyword[] (aktive). Für Dominanz-Score je Gruppe. */
export async function getKeywordsByGroup(): Promise<Record<string, string[]>> {
  const rows = await getKeywordRows({ onlyActive: true });
  const src = rows.length ? rows : FALLBACK_KEYWORDS.map((k, i) => ({ id: `fb${i}`, aktiv: true, ...k }));
  const out: Record<string, string[]> = {};
  for (const r of src) { (out[r.gruppe || 'sonstige'] ||= []).push(r.keyword); }
  return out;
}
