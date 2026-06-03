'use client';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, Tooltip, CartesianGrid, Cell,
} from 'recharts';
import { formatValue, shortDate } from '@/lib/kpi/format';
import { METRIC_HIGHER_IS_BETTER, type KpiResult, type KpiUnit } from '@/lib/kpi/types';

const CYAN = '#00C2FF';
const NAVY = '#0b1a4d';

function pickViz(r: KpiResult, viz: string): 'number' | 'line' | 'bar' {
  if (viz === 'number' || viz === 'line' || viz === 'bar') return viz;
  if (r.breakdown && r.breakdown.length > 1) return 'bar';
  if (r.series && r.series.length > 1) return 'line';
  return 'number';
}

export default function KpiTile({
  result, viz = 'auto', onUnpin, onMoveUp, onMoveDown, onToggleSpan, busy,
}: {
  result: KpiResult;
  viz?: string;
  onUnpin?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onToggleSpan?: () => void;
  busy?: boolean;
}) {
  const unit = result.unit as KpiUnit;
  const kind = pickViz(result, viz);
  const big = formatValue(result.value, unit);
  const hasControls = onUnpin || onMoveUp || onMoveDown || onToggleSpan;
  const btn = "w-6 h-6 rounded-md text-slate-300 hover:bg-slate-100 transition text-sm leading-none flex items-center justify-center disabled:opacity-30";

  return (
    <div className="relative p-5 bg-white rounded-xl border border-slate-200/70 hover:border-brand/50 transition group">
      {hasControls && (
        <div className="absolute top-2.5 right-2.5 flex gap-0.5 opacity-0 group-hover:opacity-100 transition">
          {onMoveUp && <button onClick={onMoveUp} disabled={busy} title="Nach vorne" className={`${btn} hover:text-navy`}>↑</button>}
          {onMoveDown && <button onClick={onMoveDown} disabled={busy} title="Nach hinten" className={`${btn} hover:text-navy`}>↓</button>}
          {onToggleSpan && <button onClick={onToggleSpan} disabled={busy} title="Breite umschalten" className={`${btn} hover:text-brand`}>⇿</button>}
          {onUnpin && <button onClick={onUnpin} disabled={busy} title="Entfernen" className={`${btn} hover:text-rose-500 hover:bg-rose-50 text-lg`}>×</button>}
        </div>
      )}
      <div className="text-[11px] uppercase tracking-wider text-slate-500 font-bold pr-16">{result.label}</div>

      {!result.ok ? (
        <div className="mt-2 text-sm text-rose-600">{result.error || 'Nicht verfügbar'}</div>
      ) : (
        <>
          <div className="text-4xl font-extrabold mt-1 text-ink tabular-nums">{big}</div>
          {result.delta && result.delta.pct != null && <DeltaBadge result={result} />}

          {kind === 'line' && result.series && (
            <div className="h-24 mt-3 -mx-1">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={result.series.map((s) => ({ d: shortDate(s.date), v: s.value }))}>
                  <defs>
                    <linearGradient id={`g-${result.spec.metric}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={CYAN} stopOpacity={0.35} />
                      <stop offset="100%" stopColor={CYAN} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Tooltip
                    formatter={(v: any) => [formatValue(Number(v), unit), result.label]}
                    labelStyle={{ color: NAVY, fontWeight: 700 }}
                    contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 12 }}
                  />
                  <Area type="monotone" dataKey="v" stroke={CYAN} strokeWidth={2} fill={`url(#g-${result.spec.metric})`} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {kind === 'bar' && result.breakdown && (
            <div className="mt-3" style={{ height: Math.min(240, 28 + result.breakdown.length * 30) }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={result.breakdown.slice(0, 8).map((b) => ({ k: b.key, v: b.value }))} layout="vertical" margin={{ left: 4, right: 12 }}>
                  <CartesianGrid horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={(v) => formatValue(v, unit)} />
                  <YAxis type="category" dataKey="k" width={96} tick={{ fontSize: 11, fill: '#475569' }} />
                  <Tooltip
                    formatter={(v: any) => [formatValue(Number(v), unit), result.label]}
                    contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 12 }}
                    cursor={{ fill: 'rgba(0,194,255,0.06)' }}
                  />
                  <Bar dataKey="v" radius={[0, 4, 4, 0]}>
                    {result.breakdown.slice(0, 8).map((_, i) => (
                      <Cell key={i} fill={i === 0 ? CYAN : '#7dd8f5'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-400">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400" />
            {result.source}
            {specHint(result) && <span className="text-slate-300">·</span>}
            {specHint(result) && <span>{specHint(result)}</span>}
          </div>
          {result.note && <div className="mt-1 text-[11px] text-amber-600">{result.note}</div>}
        </>
      )}
    </div>
  );
}

function DeltaBadge({ result }: { result: KpiResult }) {
  const pct = result.delta!.pct!;
  const higherBetter = METRIC_HIGHER_IS_BETTER[result.spec.metric] ?? true;
  const good = (pct >= 0) === higherBetter;
  const arrow = pct >= 0 ? '▲' : '▼';
  const cls = Math.abs(pct) < 0.0005 ? 'text-slate-400' : good ? 'text-emerald-600' : 'text-rose-500';
  return (
    <div className={`mt-1 text-xs font-semibold ${cls}`}>
      {arrow} {Math.abs(pct * 100).toLocaleString('de-DE', { maximumFractionDigits: 0 })}%
      <span className="text-slate-400 font-normal"> vs. Vorperiode</span>
    </div>
  );
}

function specHint(r: KpiResult): string {
  const s = r.spec;
  const bits: string[] = [];
  if (s.city) bits.push(s.city);
  if (s.channel) bits.push(s.channel);
  if (s.campaign) bits.push(s.campaign);
  bits.push(`${s.days || 30} T`);
  return bits.join(' · ');
}
