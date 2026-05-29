/**
 * Inline-Widget oben in Dashboards das zeigt ob GA4 / GSC / Ads / MPB connected sind.
 * Hilft Bk sofort zu sehen welche Datenquelle (noch nicht) eingerichtet ist.
 */
type S = { name: string; connected: boolean; hint?: string };

export default function ConnectionStatus({ checks }: { checks: S[] }) {
  const allOk = checks.every((c) => c.connected);
  return (
    <div className={`mb-6 p-3 rounded-lg border text-xs flex flex-wrap items-center gap-3 ${allOk ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
      <span className="font-semibold text-slate-700">Datenquellen:</span>
      {checks.map((c) => (
        <span
          key={c.name}
          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full font-medium ${c.connected ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'}`}
          title={c.hint}
        >
          <span className={`w-2 h-2 rounded-full ${c.connected ? 'bg-emerald-500' : 'bg-amber-500'}`} />
          {c.name}
        </span>
      ))}
      {!allOk && (
        <span className="text-amber-900 ml-auto">→ Hinweise: <a href="/admin/integrations" className="underline">/admin/integrations</a></span>
      )}
    </div>
  );
}
