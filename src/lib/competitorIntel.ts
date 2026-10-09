/**
 * "Living" Wettbewerbs-Intelligenz: durchsucht die SERPs unserer Money-Keywords,
 * entdeckt die echten Wettbewerber (wer rankt wofür), erkennt Chancen, empfiehlt Maßnahmen (GEX44).
 * Läuft als Hintergrund-Job (SERP-Calls ~24s → nicht on-page). Speichert in pb-tracking.
 */
import { dfsSerp } from '@/lib/dataforseo';
import { askGex44 } from '@/lib/gex44';
import { parseLlmJson, dedupeByTitle } from '@/lib/llmjson';
import { createTrackingRecord, listTrackingRecords } from '@/lib/pb-tracking';
import { getKeywordRows, FALLBACK_KEYWORDS } from '@/lib/keywordSets';
import { computeDominanz } from '@/lib/dominanz';
import { refreshStalestFromLeaderboard } from '@/lib/dossier';

const OUR = (process.env.GSC_SITE_URL || 'sc-domain:kuiper-safety.de').replace('sc-domain:', '').replace(/^https?:\/\//, '');

// Keine echten Schulungs-Wettbewerber (Portale/Social/Verzeichnisse/Shops) — werden markiert.
const GENERIC = new Set([
  // Social/Portale/Verzeichnisse/Shops/Jobs
  'youtube.com', 'wikipedia.org', 'facebook.com', 'google.com', 'amazon.de', 'linkedin.com', 'instagram.com', 'xing.com',
  'indeed.com', 'stepstone.de', 'wlw.de', '11880.com', 'gelbeseiten.de', 'studysmarter.de', 'talents.studysmarter.de',
  // Behörden / Berufsgenossenschaften / Unfallkassen — ranken stark, sind aber KEINE kommerziellen Wettbewerber
  'dguv.de', 'bgn.de', 'baua.de', 'komnet.nrw.de', 'bgw-online.de', 'bghw.de', 'bgrci.de', 'vbg.de', 'arbeitsschutz.nrw.de',
]);

export type IntelLeader = { domain: string; appearances: number; avgPosition: number; bestPosition: number; keywords: string[]; generic: boolean };
export type IntelSerp = { keyword: string; gruppe?: string; our: number | null; top: { domain: string; position: number }[] };

export async function runCompetitorIntel(opts?: { gruppe?: string }): Promise<{ ok: boolean; id?: string; error?: string }> {
  const serps: IntelSerp[] = [];
  const agg = new Map<string, { positions: number[]; keywords: Set<string> }>();

  // Steuerbares Keyword-Set aus dem Cockpit (mkt_keywords, aktiv). Optional auf eine Gruppe begrenzt.
  let rows = await getKeywordRows({ gruppe: opts?.gruppe, onlyActive: true });
  if (!rows.length) rows = FALLBACK_KEYWORDS.map((k, i) => ({ id: `fb${i}`, aktiv: true, ...k }));
  const SEED_KEYWORDS = rows.map((r) => r.keyword);
  const KW_GROUP: Record<string, string> = Object.fromEntries(rows.map((r) => [r.keyword, r.gruppe || 'sonstige']));

  // SERP-Calls parallel (je ~24s) → zusammen ~24s statt 240s sequenziell.
  const results = await Promise.all(SEED_KEYWORDS.map(async (kw) => ({ kw, data: (await dfsSerp(kw, 15)).data })));

  for (const { kw, data } of results) {
    if (!data.length) continue;
    let our: number | null = null;
    const top: { domain: string; position: number }[] = [];
    for (const r of data) {
      if (r.domain === OUR) { if (our === null) our = r.position; continue; }
      top.push({ domain: r.domain, position: r.position });
      const a = agg.get(r.domain) || { positions: [], keywords: new Set<string>() };
      a.positions.push(r.position); a.keywords.add(kw); agg.set(r.domain, a);
    }
    serps.push({ keyword: kw, gruppe: KW_GROUP[kw], our, top: top.slice(0, 5) });
  }

  const leaderboard: IntelLeader[] = [...agg.entries()]
    .map(([domain, v]) => ({
      domain,
      appearances: v.keywords.size,
      avgPosition: Math.round((v.positions.reduce((a, b) => a + b, 0) / v.positions.length) * 10) / 10,
      bestPosition: Math.min(...v.positions),
      keywords: [...v.keywords],
      generic: GENERIC.has(domain),
    }))
    .sort((a, b) => b.appearances - a.appearances || a.avgPosition - b.avgPosition)
    .slice(0, 20);

  // GEX44-Analyse: echte Wettbewerber (ohne generic) + unsere Positionen
  const realComp = leaderboard.filter((l) => !l.generic).slice(0, 10);
  const prompt = `Du bist SEO-/Marketing-Stratege für Kuiper Safety Systems. ZIEL: Marktführerschaft als **externe SiFa (Fachkraft für Arbeitssicherheit)** + **externer Brandschutzbeauftragter (BSB)** als Done-for-you-Dienstleistung — Fokus **Pflegeeinrichtungen & Pflegedienste** (wiederkehrende Verträge, nicht einmalige Kurse). B2B, Deutschland.
Hier die SERP-Analyse unserer Money-Keywords: wer rankt (Wettbewerber-Leaderboard) und wo WIR stehen (our = unsere Position, null = nicht in Top 15).
Erkenne die Lage, konkrete Chancen und priorisierte Maßnahmen. claim-safe, datenbezogen, ehrlich.
Antworte NUR als JSON:
{"lage":"2-4 Sätze: Wettbewerbssituation in unseren Kern-Keywords","top_wettbewerber":["domain – warum stark (Beleg)"],"chancen":["konkrete Chance mit Keyword-Bezug"],"massnahmen":[{"title":"kurz","action":"konkreter Schritt","impact":"hoch|mittel|gering","aufwand":"low|med|high"}]}
Max 6 je Liste.

LEADERBOARD (echte Wettbewerber): ${JSON.stringify(realComp.map((l) => ({ domain: l.domain, keywords: l.appearances, avgPos: l.avgPosition, bestPos: l.bestPosition })))}
UNSERE POSITIONEN je Keyword: ${JSON.stringify(serps.map((s) => ({ kw: s.keyword, our: s.our })))}`;

  // 14b (nicht 32b): zuverlässig in Route-Zeit, num_ctx 16384 reicht → kein Output-Abschnitt
  // (32b hatte heute getimeoutet → analysis=null, Seite halbleer). Robustes Parsing + Dedup.
  const g = await askGex44(prompt, { timeoutMs: 240000 });
  let analysis: any = g.ok ? parseLlmJson(g.raw) : null;
  if (analysis && Array.isArray(analysis.massnahmen)) {
    analysis.massnahmen = dedupeByTitle(analysis.massnahmen, 'title', 6);
  }

  // Dominanz-Score berechnen + in Verlauf speichern (nur Voll-Läufe zählen für den Trend)
  const dominanz = computeDominanz(serps);
  const scope = opts?.gruppe || 'alle';
  try {
    await createTrackingRecord('mkt_dominanz', {
      datum: new Date().toISOString().slice(0, 10), scope,
      score: dominanz.score, top3: dominanz.top3, top10: dominanz.top10,
      not_ranking: dominanz.notRanking, kw_count: dominanz.kwCount, by_group: dominanz.byGroup,
    });
  } catch { /* History optional */ }

  const rec = await createTrackingRecord('mkt_competitor_intel', {
    generated_at: new Date().toISOString(),
    leaderboard, serps, analysis, seed_keywords: SEED_KEYWORDS, scope, dominanz,
  });
  if (rec.error) return { ok: false, error: rec.error };

  // 1 Dossier/Lauf auffrischen (stalest) — nur bei Voll-Läufen, hält dfs-Kosten niedrig
  if (!opts?.gruppe) {
    try { await refreshStalestFromLeaderboard(realComp.map((l) => l.domain)); } catch { /* optional */ }
  }
  return { ok: true, id: rec.record?.id };
}

export async function latestIntel(): Promise<any | null> {
  try {
    const r = await listTrackingRecords('mkt_competitor_intel', { sort: '-created', perPage: 1 });
    return (r as any)?.items?.[0] || null;
  } catch { return null; }
}

/** Dominanz-Verlauf (nur Voll-Läufe scope=alle), neueste zuerst. */
export async function dominanzHistory(limit = 14): Promise<any[]> {
  try {
    const r = await listTrackingRecords('mkt_dominanz', { sort: '-created', perPage: 60, filter: 'scope="alle"' });
    return ((r as any)?.items || []).slice(0, limit);
  } catch { return []; }
}
