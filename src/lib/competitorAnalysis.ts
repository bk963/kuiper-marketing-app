/**
 * Strategische Markt- & Wettbewerbsanalyse: DataForSEO-Daten → GEX44 (on-prem).
 * Beantwortet: Wo stehen die Wettbewerber, wo wir, was machen sie besser, was sind unsere Chancen.
 */
import { dfsOverview, dfsRankedKeywords, dfsKeywordGap } from '@/lib/dataforseo';
import { askGex44 } from '@/lib/gex44';

const OUR = (process.env.GSC_SITE_URL || 'sc-domain:kuiper-safety.de').replace('sc-domain:', '').replace(/^https?:\/\//, '');

export async function analyzeCompetition(competitors: string[]): Promise<{ ok: boolean; analysis?: any; error?: string }> {
  const comps = competitors.filter(Boolean).slice(0, 4);
  if (!comps.length) return { ok: false, error: 'Keine Wettbewerber angegeben' };

  const ourOv = await dfsOverview(OUR);
  const ourKw = await dfsRankedKeywords(OUR, 40);
  if (ourOv.error && !ourOv.data) return { ok: false, error: `DataForSEO: ${ourOv.error}` };

  const compData = await Promise.all(comps.map(async (c) => {
    const [ov, gap, kw] = await Promise.all([dfsOverview(c), dfsKeywordGap(OUR, c, 25), dfsRankedKeywords(c, 25)]);
    return {
      domain: c,
      traffic: ov.data?.etv ?? null,
      keywords: ov.data?.keywords ?? null,
      top3: ov.data ? ov.data.pos1 + ov.data.pos2_3 : null,
      topKeywords: kw.data.slice(0, 20).map((k) => ({ kw: k.keyword, vol: k.volume, pos: k.position })),
      gap: gap.data.slice(0, 20).map((k) => ({ kw: k.keyword, vol: k.volume, theirPos: k.position, ourPos: k.ourPosition })),
    };
  }));

  const data = {
    wir: {
      domain: OUR,
      traffic: ourOv.data?.etv ?? null,
      keywords: ourOv.data?.keywords ?? null,
      top3: ourOv.data ? ourOv.data.pos1 + ourOv.data.pos2_3 : null,
      topKeywords: ourKw.data.slice(0, 20).map((k) => ({ kw: k.keyword, vol: k.volume, pos: k.position })),
    },
    wettbewerber: compData,
  };

  const prompt = `Du bist Senior-SEO-/Marketing-Stratege für Kuiper Safety Systems. ZIEL: Marktführerschaft als externe SiFa + externer Brandschutzbeauftragter (done-for-you), Fokus Pflegeeinrichtungen & Pflegedienste. B2B, Deutschland.
Analysiere die SEO-/Markt-Daten (geschätzter Organic-Traffic/Monat, Keyword-Anzahl, Top-3-Rankings, Top-Keywords, Keyword-Lücken wo Wettbewerber ranken und wir nicht).
Sei konkret, datenbezogen, ehrlich (auch wenn wir schwächer sind). claim-safe (keine Garantie-/Heilsversprechen).
Antworte NUR als JSON:
{
 "marktlage":"2-4 Sätze: wie ist die Wettbewerbssituation im DE-Brandschutz-Schulungsmarkt für uns",
 "wo_wir_stehen":"2-3 Sätze: unsere Position vs. Wettbewerber (Stärken + Schwächen, mit Zahlen)",
 "was_sie_besser_machen":["konkreter Punkt je Wettbewerber-Vorteil, mit Beleg aus den Daten"],
 "unsere_chancen":["konkrete Chance (z.B. Keyword-Lücke mit Volumen, schwach besetztes Thema)"],
 "massnahmen":[{"title":"kurz","action":"konkreter Schritt","impact":"hoch|mittel|gering","aufwand":"low|med|high"}]
}
Max 6 je Liste, wichtigstes zuerst.

DATEN:
${JSON.stringify(data)}`;

  const g = await askGex44(prompt, { model: 'qwen2.5:32b', timeoutMs: 240000 });
  if (!g.ok) return { ok: false, error: g.error };
  let parsed: any = {};
  try { parsed = JSON.parse(g.raw || '{}'); } catch { return { ok: false, error: 'GEX44-Antwort kein valides JSON' }; }
  return { ok: true, analysis: { ...parsed, data, generatedAt: new Date().toISOString() } };
}
