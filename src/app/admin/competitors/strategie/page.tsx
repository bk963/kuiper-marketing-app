import { requireAdmin } from '@/lib/admin-auth';
import { latestStrategie } from '@/lib/strategie';
import StrategieRunButton from '@/components/StrategieRunButton';
import TodoActions from '@/components/TodoActions';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

const IMP: Record<string, string> = { hoch: 'bg-emerald-100 text-emerald-800', mittel: 'bg-amber-100 text-amber-800', gering: 'bg-slate-100 text-slate-600' };
const EFFORT: Record<string, string> = { low: '🟢 gering', med: '🟡 mittel', high: '🔴 hoch' };

function arr(v: any): any[] { if (Array.isArray(v)) return v; if (typeof v === 'string') { try { const p = JSON.parse(v); return Array.isArray(p) ? p : []; } catch { return []; } } return []; }

export default async function StrategiePage() {
  await requireAdmin();
  const s = await latestStrategie();
  const roadmap = arr(s?.roadmap), quickwins = arr(s?.quickwins), cluster = arr(s?.content_cluster), verteidigung = arr(s?.verteidigung), massnahmen = arr(s?.massnahmen);

  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-2 mb-2"><Link href="/admin/competitors" className="text-sm text-slate-500 hover:text-slate-700">← Wettbewerb</Link></div>
      <div className="flex items-start justify-between gap-4 flex-wrap mb-2">
        <h1 className="text-3xl font-extrabold">♟️ Marktdominanz-Strategie</h1>
        <StrategieRunButton label={s ? 'Neu erarbeiten' : 'Strategie erarbeiten'} />
      </div>
      <p className="text-slate-600 mb-6">Die KI nimmt die komplette Lage (Dominanz-Score, unsere Positionen, Wettbewerber-Dossiers, Keyword-Universum) und erarbeitet eine konkrete Strategie Richtung <b>100% Dominanz externe SiFa + BSB, Fokus Pflege</b>. Jede Maßnahme lässt sich per Klick an den Worker beauftragen.</p>

      {!s && (
        <div className="p-8 rounded-xl border bg-slate-50 border-slate-200 text-center text-slate-600">
          Noch keine Strategie. Klick auf <b>„Strategie erarbeiten"</b> — dauert ~1-2 Minuten.
        </div>
      )}

      {s && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border p-5">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <h2 className="text-xl font-bold text-slate-900">{s.titel}</h2>
              <span className="text-xs text-slate-400">Score {s.dominanz_score ?? '—'}/100 · {s.datum}</span>
            </div>
            {s.lage && <p className="text-slate-800 mt-2 leading-relaxed"><span className="text-xs uppercase tracking-wide text-slate-400 font-semibold block mb-0.5">Lage</span>{s.lage}</p>}
            {s.positionierung && <p className="text-slate-800 mt-3 leading-relaxed"><span className="text-xs uppercase tracking-wide text-slate-400 font-semibold block mb-0.5">Positionierung</span>{s.positionierung}</p>}
          </div>

          {quickwins.length > 0 && (
            <div className="bg-white rounded-xl border p-5">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-2">⚡ Quick-Wins</h3>
              <ul className="list-disc list-inside text-sm text-slate-700 space-y-1">{quickwins.map((q, i) => <li key={i}>{q}</li>)}</ul>
            </div>
          )}

          {roadmap.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-2">🗺️ Roadmap</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {roadmap.map((r: any, i: number) => (
                  <div key={i} className="bg-white rounded-xl border p-4">
                    <div className="text-xs font-bold text-cyan-700">{r.phase}</div>
                    <div className="text-sm font-semibold text-slate-900 mt-1 mb-2">{r.ziel}</div>
                    <ul className="text-xs text-slate-600 list-disc list-inside space-y-0.5">{arr(r.schritte).map((x: string, j: number) => <li key={j}>{x}</li>)}</ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {cluster.length > 0 && (
            <div className="bg-white rounded-xl border p-5">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-2">📚 Content-Cluster</h3>
              <div className="space-y-2">{cluster.map((c: any, i: number) => (
                <div key={i} className="text-sm"><b className="text-slate-900">{c.thema}</b> <span className="text-slate-500">— {c.zweck}</span>
                  <div className="flex flex-wrap gap-1 mt-1">{arr(c.keywords).map((k: string, j: number) => <span key={j} className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{k}</span>)}</div>
                </div>
              ))}</div>
            </div>
          )}

          {verteidigung.length > 0 && (
            <div className="bg-white rounded-xl border p-5">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-2">🛡️ Verteidigung</h3>
              <ul className="list-disc list-inside text-sm text-slate-700 space-y-1">{verteidigung.map((v, i) => <li key={i}>{v}</li>)}</ul>
            </div>
          )}

          {massnahmen.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-2">✅ Maßnahmen ({massnahmen.length}) — per Klick an den Worker beauftragen</h3>
              <div className="space-y-3">
                {massnahmen.map((m: any, i: number) => (
                  <div key={i} className="bg-white rounded-xl border p-4">
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                      <span className="font-semibold text-slate-900">{m.title}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">{m.kategorie || '—'}</span>
                      {m.impact && <span className={`text-xs px-2 py-0.5 rounded-full ml-auto ${IMP[m.impact] || 'bg-slate-100'}`}>Impact: {m.impact}</span>}
                      <span className="text-xs text-slate-500">{EFFORT[m.effort] || m.effort || ''}</span>
                    </div>
                    {m.action && <p className="text-sm text-slate-700 mb-2.5"><span className="text-slate-400">Aktion:</span> {m.action}</p>}
                    <TodoActions todo={{ title: m.title, category: m.kategorie, action: m.action, impact: m.impact, effort: m.effort, source: 'strategie' }} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
