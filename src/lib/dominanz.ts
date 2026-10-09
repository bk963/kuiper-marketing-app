/**
 * Dominanz-/Sichtbarkeits-Score für das Ziel "100% Marktdominanz".
 * Aus unseren SERP-Positionen je Keyword (our) wird ein Score 0–100 berechnet:
 * 100 = überall #1 (totale Dominanz), 0 = nirgends in Top 15.
 * Positions-Gewichtung ~ Klickanteil (Pos 1 dominiert, danach steiler Abfall).
 */
import type { IntelSerp } from '@/lib/competitorIntel';

// Position → Sichtbarkeits-Punkte (0–100), grob an organische CTR-Kurve angelehnt.
export function positionScore(pos: number | null): number {
  if (!pos || pos < 1) return 0;
  const table: Record<number, number> = { 1: 100, 2: 85, 3: 70, 4: 55, 5: 46, 6: 39, 7: 33, 8: 28, 9: 24, 10: 20 };
  if (pos <= 10) return table[Math.round(pos)] ?? 20;
  if (pos <= 15) return Math.max(5, 20 - (pos - 10) * 3);
  return 0;
}

export type Dominanz = {
  score: number; top3: number; top10: number; notRanking: number; kwCount: number;
  byGroup: Record<string, { score: number; count: number; top3: number }>;
};

export function computeDominanz(serps: IntelSerp[]): Dominanz {
  const groups: Record<string, { sum: number; count: number; top3: number }> = {};
  let sum = 0, top3 = 0, top10 = 0, notRanking = 0;
  for (const s of serps) {
    const pts = positionScore(s.our);
    sum += pts;
    if (s.our && s.our <= 3) top3++;
    if (s.our && s.our <= 10) top10++;
    if (!s.our) notRanking++;
    const g = s.gruppe || 'sonstige';
    (groups[g] ||= { sum: 0, count: 0, top3: 0 });
    groups[g].sum += pts; groups[g].count++; if (s.our && s.our <= 3) groups[g].top3++;
  }
  const kwCount = serps.length || 1;
  const byGroup: Dominanz['byGroup'] = {};
  for (const [g, v] of Object.entries(groups)) {
    byGroup[g] = { score: Math.round(v.sum / v.count), count: v.count, top3: v.top3 };
  }
  return {
    score: Math.round(sum / kwCount), top3, top10, notRanking, kwCount: serps.length, byGroup,
  };
}
