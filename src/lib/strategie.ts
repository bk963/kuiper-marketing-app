/**
 * Marktdominanz-Strategie-Werkstatt.
 * Nimmt ALLE Wettbewerbsdaten (Dominanz-Score, unsere Positionen, Leaderboard, Dossiers,
 * Keyword-Universum) → GEX44 (on-prem) → strukturiertes Strategiepapier.
 * Die Maßnahmen können 1:1 als Brain-Tasks in die Auto-Pickup-Pipeline übernommen werden.
 */
import { askGex44 } from '@/lib/gex44';
import { parseLlmJson, dedupeByTitle } from '@/lib/llmjson';
import { listTrackingRecords, createTrackingRecord } from '@/lib/pb-tracking';
import { latestIntel } from '@/lib/competitorIntel';
import { listDossiers } from '@/lib/dossier';
import { getKeywordsByGroup } from '@/lib/keywordSets';

const OUR = (process.env.GSC_SITE_URL || 'sc-domain:kuiper-safety.de').replace('sc-domain:', '').replace(/^https?:\/\//, '');

export async function runStrategie(): Promise<{ ok: boolean; id?: string; error?: string }> {
  const intel = await latestIntel();
  if (!intel) return { ok: false, error: 'Noch keine Wettbewerbsdaten — erst einen Wettbewerbs-Lauf starten.' };
  const dom = intel.dominanz || {};
  const serps = Array.isArray(intel.serps) ? intel.serps : [];
  const leaderboard = (Array.isArray(intel.leaderboard) ? intel.leaderboard : []).filter((l: any) => !l.generic).slice(0, 8);
  const dossiers = await listDossiers();
  const kwGroups = await getKeywordsByGroup();

  const data = {
    wir: OUR,
    dominanz_score: dom.score ?? null,
    score_je_gruppe: dom.byGroup || {},
    unsere_positionen: serps.map((s: any) => ({ kw: s.keyword, gruppe: s.gruppe, pos: s.our })),
    echte_wettbewerber: leaderboard.map((l: any) => ({ domain: l.domain, keywords: l.appearances, avgPos: l.avgPosition })),
    dossiers: dossiers.slice(0, 5).map((d: any) => ({ domain: d.domain, traffic: d.traffic, keywords: d.keywords, staerken: d.staerken, luecken: (d.luecken || []).slice(0, 8) })),
    keyword_gruppen: kwGroups,
  };

  const prompt = `Du bist Chef-Stratege für Kuiper Safety Systems. ZIEL (wörtlich vom Inhaber): "100% Dominanz als externe SiFa (Fachkraft für Arbeitssicherheit) und externer Brandschutzbeauftragter, besonders für Pflegeeinrichtungen und Pflegedienste, als Done-for-you / Sifa-Pakete". B2B, Deutschland. Wiederkehrende Verträge > einmalige Kurse.

Du bekommst die KOMPLETTE Wettbewerbs- und Sichtbarkeitslage (Dominanz-Score 0-100 wo 100=überall #1, unsere Google-Positionen je Keyword, echte Wettbewerber, deren Dossiers mit Stärken+Keyword-Lücken, unser Keyword-Universum nach Gruppen).

Erarbeite eine KONKRETE, umsetzbare Marktdominanz-Strategie. Ehrlich, datenbezogen, claim-safe (keine Garantie-/Heilsversprechen). Jede Maßnahme muss ein eigenständiger, direkt startbarer Arbeitsauftrag sein (unser Worker setzt sie um: Analyse/Content-Entwurf/SEO reversibel autonom, Live-Schaltung erst nach Freigabe).

Antworte NUR als JSON (kein Markdown):
{
 "titel":"prägnanter Strategie-Titel",
 "lage":"3-5 Sätze: wo stehen wir wirklich, was ist der Hebel",
 "positionierung":"2-4 Sätze: wie positionieren wir uns unterscheidbar (Pflege-Fokus, done-for-you)",
 "roadmap":[{"phase":"30 Tage|60 Tage|90 Tage","ziel":"messbares Ziel","schritte":["..."]}],
 "quickwins":["sofort umsetzbare Hebel mit hohem Verhältnis Wirkung/Aufwand"],
 "content_cluster":[{"thema":"Cluster/Pillar","keywords":["..."],"zweck":"warum"}],
 "verteidigung":["wie halten/verteidigen wir vorhandene Stärken"],
 "massnahmen":[{"title":"kurzer Auftrag","action":"konkreter erster Schritt","kategorie":"SEO|Content|Ads|UX|Branding","impact":"hoch|mittel|gering","effort":"low|med|high"}]
}
Max 3 roadmap-Phasen, max 6 je andere Liste, max 8 massnahmen. Wichtigstes zuerst.

DATEN:
${JSON.stringify(data)}`;

  const g = await askGex44(prompt, { timeoutMs: 240000, numCtx: 24576 });
  if (!g.ok) return { ok: false, error: g.error };
  const p = parseLlmJson<any>(g.raw);
  if (!p) return { ok: false, error: 'GEX44-Antwort kein valides JSON' };
  if (Array.isArray(p.massnahmen)) p.massnahmen = dedupeByTitle(p.massnahmen, 'title', 8);

  const rec = await createTrackingRecord('mkt_strategie', {
    datum: new Date().toISOString().slice(0, 10),
    titel: String(p.titel || 'Marktdominanz-Strategie').slice(0, 200),
    lage: String(p.lage || '').slice(0, 3000),
    positionierung: String(p.positionierung || '').slice(0, 3000),
    roadmap: p.roadmap || [], quickwins: p.quickwins || [], content_cluster: p.content_cluster || [],
    verteidigung: p.verteidigung || [], massnahmen: p.massnahmen || [], dominanz_score: dom.score ?? null,
  });
  if (rec.error) return { ok: false, error: rec.error };
  return { ok: true, id: rec.record?.id };
}

export async function latestStrategie(): Promise<any | null> {
  try {
    const r = await listTrackingRecords('mkt_strategie', { sort: '-created', perPage: 1 });
    return (r as any)?.items?.[0] || null;
  } catch { return null; }
}
