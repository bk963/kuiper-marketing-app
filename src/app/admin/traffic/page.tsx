import { requireAdmin } from '@/lib/admin-auth';
import { ga4Overview, ga4Channels, ga4TopPages, ga4Devices, ga4Countries } from '@/lib/ga4';
import StatCard from '@/components/StatCard';
import ConnectionStatus from '@/components/ConnectionStatus';

export const dynamic = 'force-dynamic';

function num(n: number) { return n.toLocaleString('de-DE'); }
function pct(n: number, d = 1) { return (n * 100).toFixed(d) + '%'; }
function dur(s: number) { return s < 60 ? `${s.toFixed(0)}s` : `${Math.floor(s / 60)}m ${Math.floor(s % 60)}s`; }

export default async function TrafficPage() {
  await requireAdmin();
  const [ov, channels, pages, devices, countries] = await Promise.all([
    ga4Overview(28),
    ga4Channels(28),
    ga4TopPages(28, 25),
    ga4Devices(28),
    ga4Countries(28, 10),
  ]);

  const connected = !!ov;

  return (
    <div className="max-w-7xl">
      <h1 className="text-3xl font-extrabold mb-2">📈 Traffic</h1>
      <p className="text-slate-600 mb-6">GA4-Daten letzte 28 Tage über alle Properties (kuiper-safety.de + Subdomains).</p>

      <ConnectionStatus checks={[{ name: 'GA4 Data API', connected, hint: 'GA4_PROPERTY_ID + GOOGLE_SERVICE_ACCOUNT_JSON in env setzen' }]} />

      {!connected && (
        <div className="p-8 rounded-xl border bg-amber-50 border-amber-200 mb-8">
          <h2 className="font-bold text-amber-900 mb-2">GA4 noch nicht verbunden</h2>
          <p className="text-sm text-amber-900 mb-3">Schritte:</p>
          <ol className="text-sm text-amber-900 space-y-1 list-decimal list-inside">
            <li>Service-Account-JSON (z.B. <code>mailbrain-gcp-sa.json</code>) in env <code>GOOGLE_SERVICE_ACCOUNT_JSON</code> (single-line)</li>
            <li>GA4-Property „Kuiper Safety" (G-YV7MPLX2VF) → Verwaltung → Property-Zugriff → SA-Email als Viewer</li>
            <li>Numerische Property-ID kopieren → env <code>GA4_PROPERTY_ID</code></li>
            <li>Coolify-Redeploy</li>
          </ol>
        </div>
      )}

      {connected && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <StatCard label="Sessions" value={num(ov!.total.sessions)} hint="letzte 28 T" />
            <StatCard label="Nutzer" value={num(ov!.total.users)} />
            <StatCard label="Pageviews" value={num(ov!.total.pageviews)} />
            <StatCard label="Engagement-Rate" value={pct(ov!.total.engagementRate)} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-8">
            <Card title="Channels">
              {channels && channels.length > 0 ? (
                <Table headers={['Channel', 'Sessions', 'Users', 'Convs']}>
                  {channels.map((c, i) => (
                    <tr key={i} className="border-t hover:bg-slate-50">
                      <td className="px-3 py-2">{c.channel}</td>
                      <td className="px-3 py-2 text-right font-mono">{num(c.sessions)}</td>
                      <td className="px-3 py-2 text-right font-mono">{num(c.users)}</td>
                      <td className="px-3 py-2 text-right font-mono">{num(c.conversions)}</td>
                    </tr>
                  ))}
                </Table>
              ) : <Empty />}
            </Card>

            <Card title="Devices">
              {devices && devices.length > 0 ? (
                <Table headers={['Device', 'Sessions']}>
                  {devices.map((d, i) => (
                    <tr key={i} className="border-t hover:bg-slate-50">
                      <td className="px-3 py-2 capitalize">{d.device}</td>
                      <td className="px-3 py-2 text-right font-mono">{num(d.sessions)}</td>
                    </tr>
                  ))}
                </Table>
              ) : <Empty />}
            </Card>
          </div>

          <Card title="Top Pages" className="mb-8">
            {pages && pages.length > 0 ? (
              <Table headers={['Path', 'Views', 'Users', 'Ø Dauer']}>
                {pages.map((p, i) => (
                  <tr key={i} className="border-t hover:bg-slate-50">
                    <td className="px-3 py-2 truncate max-w-md font-mono text-xs">{p.path}</td>
                    <td className="px-3 py-2 text-right font-mono">{num(p.pageviews)}</td>
                    <td className="px-3 py-2 text-right font-mono">{num(p.users)}</td>
                    <td className="px-3 py-2 text-right font-mono">{dur(p.avgDuration)}</td>
                  </tr>
                ))}
              </Table>
            ) : <Empty />}
          </Card>

          <Card title="Länder">
            {countries && countries.length > 0 ? (
              <Table headers={['Land', 'Sessions']}>
                {countries.map((c, i) => (
                  <tr key={i} className="border-t hover:bg-slate-50">
                    <td className="px-3 py-2">{c.country}</td>
                    <td className="px-3 py-2 text-right font-mono">{num(c.sessions)}</td>
                  </tr>
                ))}
              </Table>
            ) : <Empty />}
          </Card>
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
        <tr>
          {headers.map((h, i) => (
            <th key={i} className={`px-3 py-2 font-semibold ${i === 0 ? 'text-left' : 'text-right'}`}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  );
}
function Empty() { return <div className="p-6 text-center text-slate-500 text-sm">Keine Daten</div>; }
