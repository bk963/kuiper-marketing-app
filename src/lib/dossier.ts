/**
 * Wettbewerber-Dossiers: lebendes Profil je echtem Konkurrenten.
 * Traffic + Keyword-Zahl + Top3 (DataForSEO Overview) + Keyword-Lücken (sie ranken, wir nicht)
 * + kurze Stärken-Einschätzung (GEX44). Persistiert in mkt_competitor_dossier (upsert je Domain).
 * DataForSEO-Calls sind teuer (~24s) → im Daily-Run nur das STALESTE Dossier (1/Tag) auffrischen.
 */
import { dfsOverview, dfsKeywordGap } from '@/lib/dataforseo';
import { askGex44 } from '@/lib/gex44';
import { parseLlmJson } from '@/lib/llmjson';
import { listTrackingRecords, createTrackingRecord, patchTrackingRecord } from '@/lib/pb-tracking';

const OUR = (process.env.GSC_SITE_URL || 'sc-domain:kuiper-safety.de').replace('sc-domain:', '').replace(/^https?:\/\//, '');

export async function refreshDossier(domain: string): Promise<{ ok: boolean; error?: string }> {
  const d = domain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '');
  if (!d) return { ok: false, error: 'keine Domain' };

  const [ov, gap] = await Promise.all([dfsOverview(d), dfsKeywordGap(OUR, d, 25)]);
  const traffic = ov.data?.etv ?? 0;
  const keywords = ov.data?.keywords ?? 0;
  const top3 = ov.data ? (ov.data.pos1 + ov.data.pos2_3) : 0;
  const luecken = (gap.data || []).filter((k: any) => k.volume).slice(0, 15)
    .map((k: any) => ({ kw: k.keyword, vol: k.volume, theirPos: k.position, ourPos: k.ourPosition ?? null }));

  // kurze Stärken-Einschätzung (GEX44) — claim-safe, datenbezogen
  let staerken: string[] = [];
  const g = await askGex44(
    `Wettbewerber-Kurzprofil für Kuiper Safety Systems (Ziel: Marktführerschaft externe SiFa + externer Brandschutzbeauftragter, Fokus Pflege). Konkurrent: ${d}, geschätzter Organic-Traffic/Mon ${traffic}, ${keywords} Keywords, ${top3} Top-3-Rankings. Deren Keyword-Lücken ggü. uns: ${JSON.stringify(luecken.slice(0, 10))}. Nenne die 3 wichtigsten STÄRKEN dieses Konkurrenten (datenbezogen, knapp). Antworte NUR JSON: {"staerken":["...","...","..."]}`,
    { timeoutMs: 120000 },
  );
  if (g.ok) { const p = parseLlmJson<any>(g.raw); if (p?.staerken) staerken = p.staerken.slice(0, 4); }

  const zuletzt = new Date().toISOString().slice(0, 10);
  const body = { domain: d, traffic, keywords, top3, staerken, luecken, zuletzt };
  // upsert
  try {
    const ex = await listTrackingRecords('mkt_competitor_dossier', { filter: `domain="${d}"`, perPage: 1 });
    const id = (ex as any)?.items?.[0]?.id;
    if (id) await patchTrackingRecord('mkt_competitor_dossier', id, body);
    else await createTrackingRecord('mkt_competitor_dossier', body);
  } catch (e: any) { return { ok: false, error: e?.message || 'DB-Fehler' }; }
  return { ok: true };
}

export async function listDossiers(): Promise<any[]> {
  try {
    const r = await listTrackingRecords('mkt_competitor_dossier', { sort: '-traffic', perPage: 30 });
    return (r as any)?.items || [];
  } catch { return []; }
}

/** Im Daily-Run aufrufen: frischt genau EIN Dossier auf (stalest zuerst) aus den aktuellen
 *  echten Leaderboard-Domains — hält die DataForSEO-Kosten/Laufzeit pro Tag niedrig. */
export async function refreshStalestFromLeaderboard(realDomains: string[]): Promise<void> {
  if (!realDomains.length) return;
  let existing: any[] = [];
  try { existing = (await listTrackingRecords('mkt_competitor_dossier', { perPage: 50 }) as any)?.items || []; } catch { /* */ }
  const byDomain = new Map(existing.map((e) => [e.domain, e.zuletzt || '']));
  // Priorität: Domains ohne Dossier zuerst, dann ältestes zuletzt
  const sorted = [...realDomains].sort((a, b) => (byDomain.get(a) || '') .localeCompare(byDomain.get(b) || ''));
  const target = sorted[0];
  if (target) await refreshDossier(target);
}
