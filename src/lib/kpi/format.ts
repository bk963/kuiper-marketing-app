/** Wert-Formatierung pro Unit — geteilt zwischen Server und Client. */
import type { KpiUnit } from './types';

export function formatValue(value: number | null | undefined, unit: KpiUnit): string {
  if (value == null || Number.isNaN(value)) return '—';
  switch (unit) {
    case 'eur':
      return value.toLocaleString('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: value >= 100 ? 0 : 2 });
    case 'pct':
      return (value * 100).toLocaleString('de-DE', { maximumFractionDigits: 1 }) + '%';
    case 'int':
      return Math.round(value).toLocaleString('de-DE');
    case 'pos':
      return value.toLocaleString('de-DE', { maximumFractionDigits: 1 });
    case 'float':
    default:
      return value.toLocaleString('de-DE', { maximumFractionDigits: 2 });
  }
}

/** Kurzes Datum (TT.MM.) für Charts. */
export function shortDate(iso: string): string {
  const m = /^(\d{4})-?(\d{2})-?(\d{2})/.exec(iso);
  if (!m) return iso;
  return `${m[3]}.${m[2]}.`;
}
