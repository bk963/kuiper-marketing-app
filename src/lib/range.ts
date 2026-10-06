// Zentrale Zeitraum-Auswahl für die Analytics-Seiten (Traffic/SEO/…).
// Presets + optionaler custom Bereich (from/to als YYYY-MM-DD).
export const RANGE_OPTIONS = [
  { key: '7', days: 7, label: '7 Tage' },
  { key: '14', days: 14, label: '14 Tage' },
  { key: '28', days: 28, label: '28 Tage' },
  { key: '90', days: 90, label: '90 Tage' },
  { key: '180', days: 180, label: '6 Monate' },
  { key: '365', days: 365, label: '12 Monate' },
] as const;

export type ResolvedRange = { days: number; label: string; key: string; from: string; to: string };

const iso = (d: Date) => d.toISOString().slice(0, 10);

/** Liest range (+ optional from/to) aus den searchParams und liefert days + Datumsgrenzen. */
export function resolveRange(sp?: Record<string, string | string[] | undefined>): ResolvedRange {
  const get = (k: string) => (Array.isArray(sp?.[k]) ? (sp?.[k] as string[])[0] : (sp?.[k] as string | undefined));
  const from = get('from');
  const to = get('to');
  // Custom-Bereich (beide gesetzt, Format YYYY-MM-DD)
  if (from && to && /^\d{4}-\d{2}-\d{2}$/.test(from) && /^\d{4}-\d{2}-\d{2}$/.test(to)) {
    const d1 = new Date(from + 'T00:00:00Z').getTime();
    const d2 = new Date(to + 'T00:00:00Z').getTime();
    const days = Math.max(1, Math.round((d2 - d1) / 86400000) + 1);
    return { days, label: `${from} – ${to}`, key: 'custom', from, to };
  }
  const key = get('range') || '28';
  const o = RANGE_OPTIONS.find((x) => x.key === key) || RANGE_OPTIONS[2];
  const toD = new Date();
  const fromD = new Date(toD.getTime() - (o.days - 1) * 86400000);
  return { days: o.days, label: o.label, key: o.key, from: iso(fromD), to: iso(toD) };
}
