import { requireAdmin } from '@/lib/admin-auth';
import { latestReport } from '@/lib/brain';
import RunBrainButton from '@/components/RunBrainButton';

export const dynamic = 'force-dynamic';

const CAT: Record<string, string> = {
  SEO: 'bg-sky-100 text-sky-800 border-sky-200',
  Content: 'bg-violet-100 text-violet-800 border-violet-200',
  Ads: 'bg-amber-100 text-amber-800 border-amber-200',
  UX: 'bg-rose-100 text-rose-800 border-rose-200',
  Branding: 'bg-emerald-100 text-emerald-800 border-emerald-200',
};
const EFFORT: Record<string, string> = { low: '🟢 gering', med: '🟡 mittel', high: '🔴 hoch' };

export default async function BrainPage() {
  await requireAdmin();
  const rep = await latestReport();
  const todos = Array.isArray(rep?.todos) ? [...rep.todos].sort((a: any, b: any) => (a.priority || 9) - (b.priority || 9)) : [];

  return (
    <div className="max-w-5xl">
      <div className="flex items-start justify-between gap-4 mb-2">
        <h1 className="text-3xl font-extrabold">🧠 Marketing-Brain</h1>
        <RunBrainButton />
      </div>
      <p className="text-slate-600 mb-6">Täglicher KI-Lauf (GEX44, on-prem): analysiert Traffic, SEO, Ads & Verhalten und leitet priorisierte To-dos ab. {rep ? `Letzter Lauf: ${rep.report_date}.` : ''}</p>

      {!rep && (
        <div className="p-8 rounded-xl border bg-slate-50 border-slate-200 text-center">
          <p className="text-slate-700 mb-2">Noch kein Report. Klick auf <b>„Jetzt analysieren"</b> — der erste Lauf dauert ~1 Minute.</p>
          <p className="text-xs text-slate-500">Danach läuft die Analyse automatisch täglich.</p>
        </div>
      )}

      {rep && (
        <>
          <div className="bg-white rounded-xl border p-5 mb-6">
            <div className="text-xs uppercase tracking-wide text-slate-400 font-semibold mb-1">Gesamtlage</div>
            <p className="text-slate-800 leading-relaxed">{rep.summary || '—'}</p>
          </div>

          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-3">Priorisierte To-dos ({todos.length})</h2>
          <div className="space-y-3">
            {todos.map((t: any, i: number) => (
              <div key={i} className="bg-white rounded-xl border p-4 hover:shadow-sm transition">
                <div className="flex items-center gap-2 flex-wrap mb-1.5">
                  <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center shrink-0">{t.priority || i + 1}</span>
                  <span className="font-semibold text-slate-900">{t.title}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${CAT[t.category] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>{t.category || '—'}</span>
                  <span className="text-xs text-slate-500 ml-auto">{EFFORT[t.effort] || t.effort || ''}</span>
                </div>
                {t.why && <p className="text-sm text-slate-600 mb-1.5"><span className="text-slate-400">Warum:</span> {t.why}</p>}
                {t.action && <p className="text-sm text-slate-800"><span className="text-slate-400">Aktion:</span> {t.action}</p>}
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-5">Modell: {rep.model || 'GEX44'} · on-premise · DSGVO-konform (Daten verlassen nicht das Haus).</p>
        </>
      )}
    </div>
  );
}
