/**
 * Ausrichtung / Kommando-Stand — zieht die ECHTE Lage zusammen:
 * Nordstern (Dominanz-Score der Fokus-Gruppen + echte Leads), Gegner-Kopf-an-Kopf
 * (unsere vs. Gegner-Positionen je Money-Keyword), Score-Verlauf. Alles Live-Daten.
 */
import { listTrackingRecords } from '@/lib/pb-tracking';
import { latestIntel, dominanzHistory } from '@/lib/competitorIntel';
import { latestReport } from '@/lib/brain';

export type Ausrichtung = {
  id?: string; keil: string; region: string; zielperson: string;
  ziel_score: number; ziel_leads: number; fokus_gruppen: string[]; gegner: string[]; aktiv?: boolean;
};

const DEFAULT: Ausrichtung = {
  keil: 'Externer BSB + SiFa · stationäre Pflege', region: 'NRW zuerst', zielperson: 'Einrichtungsleitung / GF',
  ziel_score: 40, ziel_leads: 30, fokus_gruppen: ['pflege', 'bsb'], gegner: ['fss-service.de', 'ias-gruppe.de'],
};

function asArr(v: any): string[] { if (Array.isArray(v)) return v; if (typeof v === 'string') { try { const p = JSON.parse(v); return Array.isArray(p) ? p : []; } catch { return []; } } return []; }

export async function getAusrichtung(): Promise<Ausrichtung> {
  try {
    const r = await listTrackingRecords('mkt_ausrichtung', { sort: '-created', perPage: 1 });
    const rec = (r as any)?.items?.[0];
    if (!rec) return DEFAULT;
    return {
      id: rec.id, keil: rec.keil || DEFAULT.keil, region: rec.region || DEFAULT.region,
      zielperson: rec.zielperson || DEFAULT.zielperson,
      ziel_score: Number(rec.ziel_score) || DEFAULT.ziel_score, ziel_leads: Number(rec.ziel_leads) || DEFAULT.ziel_leads,
      fokus_gruppen: asArr(rec.fokus_gruppen).length ? asArr(rec.fokus_gruppen) : DEFAULT.fokus_gruppen,
      gegner: asArr(rec.gegner).length ? asArr(rec.gegner) : DEFAULT.gegner, aktiv: rec.aktiv,
    };
  } catch { return DEFAULT; }
}

/** Dominanz-Score der Fokus-Gruppen (Mittel), aktuell + Vorlauf (Delta). */
export async function getNordstern(a: Ausrichtung) {
  const intel = await latestIntel();
  const dom = intel?.dominanz || {};
  const byGroup = dom.byGroup || dom.by_group || {};
  const scores = a.fokus_gruppen.map((g) => Number(byGroup?.[g]?.score ?? 0));
  const focusScore = scores.length ? Math.round(scores.reduce((x, y) => x + y, 0) / scores.length) : 0;

  const rep = await latestReport();
  const sig = rep?.signals || {};
  const leads = Number((typeof sig === 'string' ? JSON.parse(sig) : sig)?.leads7d ?? 0);

  // Delta ggü. vorletztem Voll-Lauf (Fokus-Gruppen)
  const hist = await dominanzHistory(10);
  const prev = hist[1];
  let prevScore: number | null = null;
  if (prev) {
    const bg = typeof prev.by_group === 'string' ? JSON.parse(prev.by_group || '{}') : (prev.by_group || {});
    const ps = a.fokus_gruppen.map((g) => Number(bg?.[g]?.score ?? 0));
    prevScore = ps.length ? Math.round(ps.reduce((x: number, y: number) => x + y, 0) / ps.length) : null;
  }
  return { focusScore, leads, scoreDelta: prevScore == null ? null : focusScore - prevScore };
}

/** Kopf-an-Kopf: je Money-Keyword der Fokus-Gruppen unsere Position + Gegner-Position. */
export async function getHeadToHead(a: Ausrichtung) {
  const intel = await latestIntel();
  let serps: any[] = Array.isArray(intel?.serps) ? intel.serps : [];
  serps = serps.filter((s) => a.fokus_gruppen.includes(s.gruppe)).slice(0, 12);
  return serps.map((s) => {
    const posOf = (dom: string) => {
      const hit = (s.top || []).find((t: any) => (t.domain || '').includes(dom.replace(/^www\./, '')));
      return hit ? hit.position : null;
    };
    return { keyword: s.keyword, our: s.our ?? null, gegner: a.gegner.map((g) => ({ domain: g, pos: posOf(g) })) };
  });
}

/** Score-Verlauf der Fokus-Gruppen (älteste→neueste) für die Mini-Kurve. */
export async function getScoreVerlauf(a: Ausrichtung): Promise<number[]> {
  const hist = await dominanzHistory(14);
  return [...hist].reverse().map((r) => {
    const bg = typeof r.by_group === 'string' ? JSON.parse(r.by_group || '{}') : (r.by_group || {});
    const ps = a.fokus_gruppen.map((g) => Number(bg?.[g]?.score ?? 0));
    return ps.length ? Math.round(ps.reduce((x: number, y: number) => x + y, 0) / ps.length) : 0;
  });
}

/** Was gerade auf die Ausrichtung einzahlt: offene Brain-Tasks + letzte Strategie. */
export async function getEinzahlungen() {
  let tasks: any[] = [];
  try {
    const r = await listTrackingRecords('mkt_brain_tasks', { sort: '-created', perPage: 8 });
    tasks = ((r as any)?.items || []).filter((t: any) => !['verworfen', 'erledigt'].includes(t.status));
  } catch { /* */ }
  let strategie: any = null;
  try {
    const r = await listTrackingRecords('mkt_strategie', { sort: '-created', perPage: 1 });
    strategie = (r as any)?.items?.[0] || null;
  } catch { /* */ }
  return { tasks, strategie };
}
