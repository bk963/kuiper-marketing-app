import { requireAdmin } from '@/lib/admin-auth';
import { gadsAccountSummary, gadsCampaigns } from '@/lib/google-ads';
import StatCard from '@/components/StatCard';
import ConnectionStatus from '@/components/ConnectionStatus';

export const dynamic = 'force-dynamic';

function eur(n: number) { return n.toLocaleString('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 }); }
function num(n: number) { return n.toLocaleString('de-DE'); }
function pct(n: number, d = 1) { return (n * 100).toFixed(d) + '%'; }

export default async function AdsPage() {
  await requireAdmin();
  const [summary, campaigns] = await Promise.all([gadsAccountSummary(28), gadsCampaigns(28, 25)]);

  const connected = !!summary && !summary.error;

  return (
    <div className="max-w-7xl">
      <h1 className="text-3xl font-extrabold mb-2">🎯 Ads</h1>
      <p className="text-slate-600 mb-6">Google Ads — Account 8809406986 (kuiperbrandschutzgmbh), letzte 28 Tage.</p>

      <ConnectionStatus checks={[
        { name: 'Google Ads API', connected, hint: connected ? '' : (summary?.error || 'OAuth nicht autorisiert / Token abgelaufen') },
      ]} />

      {!connected && (
        <div className="p-8 rounded-xl border bg-amber-50 border-amber-200 mb-8">
          <h2 className="font-bold text-amber-900 mb-2">Google Ads nicht verbunden</h2>
          <p className="text-sm text-amber-900 mb-2">Credentials sind alle gesetzt (Developer-Token + OAuth + Customer-IDs).</p>
          {summary?.error && <p className="text-xs text-amber-900 font-mono">Fehler: {summary.error}</p>}
          <p className="text-xs text-amber-900 mt-3">Mögliche Ursache: Refresh-Token abgelaufen (Re-Auth nötig) oder Customer-ID falsch.</p>
        </div>
      )}

      {connected && summary && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <StatCard label="Spend · 28T" value={eur(summary.cost)} />
            <StatCard label="Klicks" value={num(summary.clicks)} hint={`Ø CPC ${eur(summary.cpc)}`} />
            <StatCard label="Conversions" value={num(summary.conversions)} hint={`Ø CPA ${summary.cpa > 0 ? eur(summary.cpa) : '—'}`} />
            <StatCard label="ROAS" value={summary.roas.toFixed(2) + 'x'} emphasis={summary.roas >= 2 ? 'good' : summary.roas > 0 ? 'neutral' : 'bad'} />
          </div>

          <Card title="Kampagnen-Übersicht" className="mb-8">
            {campaigns && campaigns.length > 0 ? (
              <Table headers={['Kampagne', 'Status', 'Klicks', 'Spend', 'Convs', 'CPA', 'ROAS']}>
                {campaigns.map((c: any, i: number) => (
                  <tr key={i} className="border-t hover:bg-slate-50">
                    <td className="px-3 py-2 max-w-xs truncate">{c.name}</td>
                    <td className="px-3 py-2 text-xs uppercase">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${c.status === 'ENABLED' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right font-mono">{num(c.clicks)}</td>
                    <td className="px-3 py-2 text-right font-mono">{eur(c.cost)}</td>
                    <td className="px-3 py-2 text-right font-mono">{num(c.conversions)}</td>
                    <td className="px-3 py-2 text-right font-mono">{c.cpa > 0 ? eur(c.cpa) : '—'}</td>
                    <td className={`px-3 py-2 text-right font-mono font-bold ${c.roas >= 2 ? 'text-emerald-600' : c.roas > 0 ? 'text-slate-700' : 'text-slate-400'}`}>
                      {c.roas > 0 ? c.roas.toFixed(2) + 'x' : '—'}
                    </td>
                  </tr>
                ))}
              </Table>
            ) : (
              <div className="p-6 text-center text-slate-500 text-sm">Keine aktiven Kampagnen.</div>
            )}
          </Card>

          <div className="p-6 rounded-xl border bg-slate-50/50 text-sm text-slate-700">
            <div className="font-semibold mb-2">📌 Closed-Loop ROAS (kommt in Phase 2)</div>
            <p>
              Hier wird in Phase 2 der ROAS gegen die <strong>realen Deal-Won-Werte</strong> aus dem CRM gerechnet
              (statt nur gegen Conversion-Action-Value). Dann zeigt jede Kampagne tatsächlichen Umsatz, nicht nur Lead-Counts.
            </p>
          </div>
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
      <thead className="bg-slate-50/70 text-xs uppercase tracking-wide text-slate-500">
        <tr>{headers.map((h, i) => (
          <th key={i} className={`px-3 py-2 font-semibold ${i === 0 ? 'text-left' : i === 1 ? 'text-left' : 'text-right'}`}>{h}</th>
        ))}</tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  );
}
