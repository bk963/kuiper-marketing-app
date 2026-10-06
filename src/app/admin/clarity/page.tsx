import { requireAdmin } from '@/lib/admin-auth';
import { clarityInsights } from '@/lib/clarity';
import StatCard from '@/components/StatCard';
import ConnectionStatus from '@/components/ConnectionStatus';

export const dynamic = 'force-dynamic';

function num(n: number) { return n.toLocaleString('de-DE'); }
function dur(s: number) { return s < 60 ? `${s.toFixed(0)}s` : `${Math.floor(s / 60)}m ${Math.floor(s % 60)}s`; }

export default async function ClarityPage() {
  await requireAdmin();
  const c = await clarityInsights(3, 'URL');
  const connected = !!c && c.ok;

  const friction = (c?.byUrl || [])
    .map((x) => ({ ...x, score: x.deadClicks + x.rageClicks * 2 + x.quickBacks + x.scriptErrors * 2 }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 40);

  return (
    <div className="max-w-7xl">
      <h1 className="text-3xl font-extrabold mb-2">🖱️ Verhalten (Clarity)</h1>
      <p className="text-slate-600 mb-4">Microsoft Clarity — Friktions-Signale (Dead-/Rage-Clicks, Quick-Backs, Script-Fehler) der letzten {c?.days ?? 3} Tage. Clarity liefert nur 1–3 Tage (API-Limit), Werte sind 3h gecacht.</p>

      <ConnectionStatus checks={[{ name: 'Clarity Data Export', connected, hint: 'CLARITY_API_TOKEN in env (Clarity → Settings → Data Export)' }]} />

      {!connected && (
        <div className="p-8 rounded-xl border bg-amber-50 border-amber-200 mb-8">
          <h2 className="font-bold text-amber-900 mb-2">Clarity nicht verbunden{c?.error ? ` — ${c.error}` : ''}</h2>
          <p className="text-sm text-amber-900">CLARITY_API_TOKEN in den Cockpit-Env setzen (Clarity-Dashboard → Settings → Data Export → Generate new API token).</p>
        </div>
      )}

      {connected && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
            <StatCard label="Sessions" value={num(c!.totals.sessions)} hint={`letzte ${c!.days} T`} />
            <StatCard label="🖱️ Dead-Clicks" value={num(c!.totals.deadClicks)} hint="Klick ohne Wirkung" />
            <StatCard label="😠 Rage-Clicks" value={num(c!.totals.rageClicks)} hint="Frust-Klicks" />
            <StatCard label="↩️ Quick-Backs" value={num(c!.totals.quickBacks)} hint="sofort zurück" />
            <StatCard label="🐞 Script-Fehler" value={num(c!.totals.scriptErrors)} />
          </div>

          <Card title="Seiten mit der meisten Friktion (Score = Dead + 2×Rage + QuickBack + 2×ScriptErr)">
            {friction.length > 0 ? (
              <div className="max-h-[32rem] overflow-y-auto">
                <Table headers={['Seite', 'Sess.', 'Dead', 'Rage', 'Quick-Back', 'Script-Err', 'Scroll', 'Ø Zeit', 'Score']}>
                  {friction.map((f, i) => (
                    <tr key={i} className="border-t hover:bg-slate-50">
                      <td className="px-3 py-2 max-w-sm truncate font-mono text-xs">{f.url.replace(/^https?:\/\/(www\.)?/, '')}</td>
                      <td className="px-3 py-2 text-right font-mono">{num(f.sessions)}</td>
                      <td className="px-3 py-2 text-right font-mono">{num(f.deadClicks)}</td>
                      <td className="px-3 py-2 text-right font-mono text-rose-600">{num(f.rageClicks)}</td>
                      <td className="px-3 py-2 text-right font-mono">{num(f.quickBacks)}</td>
                      <td className="px-3 py-2 text-right font-mono text-amber-600">{num(f.scriptErrors)}</td>
                      <td className="px-3 py-2 text-right font-mono">{f.scrollDepth ? f.scrollDepth.toFixed(0) + '%' : '—'}</td>
                      <td className="px-3 py-2 text-right font-mono">{f.engagementTime ? dur(f.engagementTime) : '—'}</td>
                      <td className="px-3 py-2 text-right font-mono font-bold">{num(f.score)}</td>
                    </tr>
                  ))}
                </Table>
              </div>
            ) : <Empty />}
          </Card>

          <p className="text-xs text-slate-400 mt-3">Tipp: Hohe Rage-/Dead-Clicks = kaputtes/verwirrendes UI-Element auf der Seite. Script-Fehler = technischer Bug. Beides direkte Optimierungs-Hebel.</p>
        </>
      )}
    </div>
  );
}

function Card({ title, children, className = '' }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-xl border overflow-hidden ${className}`}>
      <div className="px-4 py-3 border-b font-bold text-sm text-slate-700">{title}</div>
      {children}
    </div>
  );
}
function Table({ headers, children }: { headers: string[]; children: React.ReactNode }) {
  return (
    <table className="w-full text-sm">
      <thead className="bg-slate-50/70 text-xs uppercase tracking-wide text-slate-500 sticky top-0">
        <tr>{headers.map((h, i) => (<th key={i} className={`px-3 py-2 font-semibold ${i === 0 ? 'text-left' : 'text-right'}`}>{h}</th>))}</tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  );
}
function Empty() { return <div className="p-6 text-center text-slate-500 text-sm">Keine Clarity-Daten (evtl. zu wenig Traffic in den letzten 3 Tagen)</div>; }
