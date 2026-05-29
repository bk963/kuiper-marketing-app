export default function StatCard({
  label,
  value,
  delta,
  hint,
  emphasis,
}: {
  label: string;
  value: string | number;
  delta?: string;
  hint?: string;
  emphasis?: 'good' | 'bad' | 'neutral';
}) {
  const valueColor =
    emphasis === 'good' ? 'text-emerald-600' : emphasis === 'bad' ? 'text-rose-600' : 'text-ink';
  const deltaColor =
    delta?.startsWith('+') ? 'text-emerald-600' : delta?.startsWith('-') ? 'text-rose-600' : 'text-slate-500';
  return (
    <div className="p-5 bg-white rounded-xl border border-slate-200/70">
      <div className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">{label}</div>
      <div className={`text-3xl font-extrabold mt-1 ${valueColor}`}>{value}</div>
      <div className="flex items-baseline gap-2 mt-1">
        {delta && <div className={`text-xs font-semibold ${deltaColor}`}>{delta}</div>}
        {hint && <div className="text-xs text-slate-500">{hint}</div>}
      </div>
    </div>
  );
}
