import { requireAdmin } from '@/lib/admin-auth';
import { getAusrichtung, getNordstern, getHeadToHead, getScoreVerlauf, getEinzahlungen } from '@/lib/ausrichtung';
import AusrichtungEditor from '@/components/AusrichtungEditor';

export const dynamic = 'force-dynamic';

const STATUS: Record<string, string> = {
  beauftragt: 'bg-sky-100 text-sky-800', in_arbeit: 'bg-amber-100 text-amber-800', wartet_freigabe: 'bg-violet-100 text-violet-800',
  freigegeben: 'bg-indigo-100 text-indigo-800', fehler: 'bg-rose-100 text-rose-800',
};
function ring(score: number, goal: number, color: string) {
  const pct = goal > 0 ? Math.min(100, Math.round((score / goal) * 100)) : 0;
  return { pct, dash: `${pct} 100`, color };
}

export default async function AusrichtungPage() {
  await requireAdmin();
  const a = await getAusrichtung();
  const [ns, h2h, verlauf, ein] = await Promise.all([getNordstern(a), getHeadToHead(a), getScoreVerlauf(a), getEinzahlungen()]);

  const scoreR = ring(ns.focusScore, a.ziel_score, '#00c2ff');
  const leadsR = ring(ns.leads, a.ziel_leads, '#2bbd6e');
  const maxV = Math.max(a.ziel_score, ...verlauf, 1);

  return (
    <div className="max-w-5xl">
      <div className="flex items-start justify-between gap-4 flex-wrap mb-1">
        <div>
          <div className="text-xs uppercase tracking-wide text-cyan-600 font-semibold font-mono">Kommando-Stand</div>
          <h1 className="text-3xl font-extrabold">🎯 Marschrichtung</h1>
        </div>
        <AusrichtungEditor initial={a} />
      </div>
      <p className="text-slate-600 mb-5 max-w-2xl">Ein Ziel, ein Gegner, ein Keil. Brain, Strategie und Content zahlen hierauf ein — das ist dein Tacho.</p>

      {/* Mission-Leiste */}
      <div className="flex flex-wrap gap-2 mb-6">
        <span className="text-sm px-3 py-1.5 rounded-full bg-white border border-slate-200"><span className="text-slate-400">Keil </span><b>{a.keil}</b></span>
        <span className="text-sm px-3 py-1.5 rounded-full bg-white border border-slate-200"><span className="text-slate-400">Region </span><b>{a.region}</b></span>
        <span className="text-sm px-3 py-1.5 rounded-full bg-white border border-slate-200"><span className="text-slate-400">Zielperson </span><b>{a.zielperson}</b></span>
        <span className="text-sm px-3 py-1.5 rounded-full bg-white border border-amber-200"><span className="text-slate-400">Hauptgegner </span><b className="text-amber-700">{a.gegner[0] || '—'}</b></span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Nordstern */}
        <div className="bg-white rounded-xl border p-5">
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-4">① Nordstern — worauf wir optimieren</h2>
          <div className="grid grid-cols-2 gap-4">
            {[{ label: 'Dominanz-Score', sub: a.fokus_gruppen.join(' + '), val: ns.focusScore, goal: a.ziel_score, r: scoreR, delta: ns.scoreDelta },
              { label: 'Echte Leads', sub: 'pro Woche', val: ns.leads, goal: a.ziel_leads, r: leadsR, delta: null }].map((g, i) => (
              <div key={i} className="text-center">
                <div className="relative w-28 h-28 mx-auto">
                  <svg viewBox="0 0 36 36" className="w-28 h-28 -rotate-90">
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="#eef2f7" strokeWidth="3.2" />
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke={g.r.color} strokeWidth="3.2" strokeDasharray={g.r.dash} strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-extrabold tabular-nums">{g.val}</span>
                    <span className="text-[10px] text-slate-400 font-mono">Ziel {g.goal}</span>
                  </div>
                </div>
                <div className="text-sm text-slate-700 mt-2 font-medium">{g.label}</div>
                <div className="text-[11px] text-slate-400 font-mono">{g.sub}</div>
                {g.delta != null && <div className={`text-xs font-semibold mt-1 ${g.delta > 0 ? 'text-emerald-600' : g.delta < 0 ? 'text-rose-600' : 'text-slate-400'}`}>{g.delta > 0 ? `▲ +${g.delta}` : g.delta < 0 ? `▼ ${g.delta}` : '● stabil'} ggü. letztem Lauf</div>}
              </div>
            ))}
          </div>
        </div>

        {/* Verlauf */}
        <div className="bg-white rounded-xl border p-5">
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-4">③ Fortschritt — Fokus-Score über Zeit</h2>
          {verlauf.length > 1 ? (
            <>
              <div className="flex items-end gap-1.5 h-28">
                {verlauf.map((v, i) => (
                  <div key={i} className="flex-1 rounded-t" style={{ height: `${Math.max(4, (v / maxV) * 100)}%`, background: i === verlauf.length - 1 ? '#2bbd6e' : '#00c2ff', opacity: i === verlauf.length - 1 ? 1 : 0.4 }} title={`${v}`} />
                ))}
              </div>
              <div className="flex justify-between text-[11px] text-slate-400 font-mono mt-2"><span>älteste</span><span>neueste · {verlauf.at(-1)}</span><span>Ziel {a.ziel_score}</span></div>
            </>
          ) : <p className="text-sm text-slate-500">Noch zu wenig Verlauf — füllt sich mit jedem täglichen Wettbewerbs-Lauf.</p>}
        </div>
      </div>

      {/* Gegner Kopf-an-Kopf */}
      <div className="bg-white rounded-xl border p-5 mb-4">
        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-1">② Der Gegner — Kopf an Kopf auf den Money-Keywords</h2>
        <p className="text-xs text-slate-400 mb-3">Rot = wir ranken nicht (Angriffsziel). Live aus dem letzten Wettbewerbs-Lauf.</p>
        {h2h.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="py-1 font-semibold">Keyword</th><th className="py-1 text-center font-semibold">WIR</th>
                {a.gegner.map((g) => <th key={g} className="py-1 text-center font-semibold">{g.replace('.de', '').replace('.com', '')}</th>)}
              </tr></thead>
              <tbody>
                {h2h.map((row: any, i: number) => (
                  <tr key={i} className="border-t">
                    <td className="py-2 pr-3">{row.keyword}</td>
                    <td className="py-2 text-center">
                      <span className={`inline-block min-w-[30px] px-1.5 py-0.5 rounded font-mono text-xs font-bold ${row.our && row.our <= 10 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-600'}`}>{row.our || '—'}</span>
                    </td>
                    {row.gegner.map((gg: any, j: number) => (
                      <td key={j} className="py-2 text-center">
                        <span className="inline-block min-w-[30px] px-1.5 py-0.5 rounded font-mono text-xs bg-slate-100 text-slate-600">{gg.pos || '—'}</span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="text-sm text-slate-500">Noch keine Keyword-Daten für die Fokus-Gruppen — kommt mit dem nächsten Wettbewerbs-Lauf.</p>}
      </div>

      {/* Was einzahlt */}
      <div className="bg-white rounded-xl border p-5">
        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-3">Was gerade auf diese Ausrichtung einzahlt</h2>
        <div className="space-y-2">
          {ein.strategie && (
            <div className="flex items-center gap-3 bg-slate-50 rounded-lg px-3 py-2.5 border">
              <span>♟️</span>
              <div className="flex-1 min-w-0 text-sm"><div className="font-medium text-slate-900 truncate">Strategie: {ein.strategie.titel}</div><div className="text-[11px] text-slate-400 font-mono">Opus · {ein.strategie.datum}</div></div>
              <span className="text-[10px] font-mono uppercase px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">aktiv</span>
            </div>
          )}
          {ein.tasks.map((t: any) => (
            <div key={t.id} className="flex items-center gap-3 bg-slate-50 rounded-lg px-3 py-2.5 border">
              <span>⚙️</span>
              <div className="flex-1 min-w-0 text-sm"><div className="font-medium text-slate-900 truncate">{t.title}</div>{t.result && <div className="text-[11px] text-slate-400 truncate">{t.result}</div>}</div>
              <span className={`text-[10px] font-mono uppercase px-2 py-1 rounded-full ${STATUS[t.status] || 'bg-slate-100 text-slate-600'}`}>{t.status}</span>
            </div>
          ))}
          {!ein.strategie && ein.tasks.length === 0 && <p className="text-sm text-slate-500">Noch nichts beauftragt. Sobald du eine Strategie-Maßnahme oder Content-Kampagne startest, erscheint sie hier.</p>}
        </div>
      </div>
    </div>
  );
}
