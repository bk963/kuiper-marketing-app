/**
 * A/B-Test-Statistik mit Confidence-Level (Z-Test für Proportionen).
 *
 * Phase T6 (2026-05-30) — Tracking-Maximum-Sprint.
 *
 * Berechnet pro LP:
 *  - Views A/B + Conversions A/B
 *  - CR A/B (Conversion-Rate)
 *  - Lift% (relative Verbesserung B vs A)
 *  - Confidence% via 2-Sample-Z-Test (approximate Normal-CDF)
 *  - Winner (statistisch signifikant ab 95% Confidence + min 100 Views je Variante)
 */

export type AbStats = {
  views_a: number;
  views_b: number;
  conv_a: number;
  conv_b: number;
  cr_a: number;
  cr_b: number;
  /** lift = (cr_b / cr_a) - 1; positiv = B besser */
  lift: number;
  /** z-score */
  z: number;
  /** Konfidenz dass B != A, in [0, 1] */
  confidence: number;
  /** 'a' | 'b' | 'tie' — bei nicht-signifikant */
  winner: 'a' | 'b' | 'tie';
  /** true wenn confidence ≥ 0.95 UND min 100 Views je Variante */
  significant: boolean;
};

/** Standard-Normal-CDF Approximation (Abramowitz/Stegun 26.2.17, max error ~7.5e-8) */
function normCdf(x: number): number {
  const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741;
  const a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
  const sign = x < 0 ? -1 : 1;
  const ax = Math.abs(x) / Math.sqrt(2);
  const t = 1.0 / (1.0 + p * ax);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-ax * ax);
  return 0.5 * (1.0 + sign * y);
}

export function computeAbStats(lp: any): AbStats {
  const va = Number(lp.ab_views_a || 0);
  const vb = Number(lp.ab_views_b || 0);
  const ca = Number(lp.ab_conversions_a || 0);
  const cb = Number(lp.ab_conversions_b || 0);

  const cr_a = va > 0 ? ca / va : 0;
  const cr_b = vb > 0 ? cb / vb : 0;
  const lift = cr_a > 0 ? (cr_b / cr_a) - 1 : 0;

  // Z-Test für Differenz zweier Proportionen
  let z = 0, confidence = 0;
  if (va >= 30 && vb >= 30) {
    const p_pool = (ca + cb) / (va + vb);
    const se = Math.sqrt(p_pool * (1 - p_pool) * (1 / va + 1 / vb));
    if (se > 0) {
      z = (cr_b - cr_a) / se;
      // Two-tailed confidence: P(|Z| < |z|) = 2 * normCdf(|z|) - 1
      confidence = 2 * normCdf(Math.abs(z)) - 1;
    }
  }

  let winner: 'a' | 'b' | 'tie';
  if (cr_a > cr_b) winner = 'a';
  else if (cr_b > cr_a) winner = 'b';
  else winner = 'tie';

  const significant = confidence >= 0.95 && va >= 100 && vb >= 100;

  return {
    views_a: va, views_b: vb,
    conv_a: ca, conv_b: cb,
    cr_a, cr_b,
    lift, z, confidence,
    winner, significant,
  };
}
