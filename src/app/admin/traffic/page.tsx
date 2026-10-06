import { requireAdmin } from '@/lib/admin-auth';
import { ga4Overview, ga4Channels, ga4TopPages, ga4Devices, ga4Countries, ga4SourceMedium, ga4LandingPages, ga4Events, ga4NewReturning, ga4Cities, ga4Browsers } from '@/lib/ga4';
import StatCard from '@/components/StatCard';
import ConnectionStatus from '@/components/ConnectionStatus';
import RangePicker from '@/components/RangePicker';
import { resolveRange } from '@/lib/range';

export const dynamic = 'force-dynamic';

function num(n: number) { return n.toLocaleString('de-DE'); }
function pct(n: number, d = 1) { return (n * 100).toFixed(d) + '%'; }
function dur(s: number) { return s < 60 ? `${s.toFixed(0)}s` : `${Math.floor(s / 60)}m ${Math.floor(s % 60)}s`; }

export default async function TrafficPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdmin();
  const sp = await searchParams;
  const { days, label, key } = resolveRange(sp);
  const [ov, channels, pages, devices, countries, sourceMedium, landing, events, newRet, cities, browsers] = await Promise.all([
    ga4Overview(days),
    ga4Channels(days),
    ga4TopPages(days, 25),
    ga4Devices(days),
    ga4Countries(days, 10),
    ga4SourceMedium(days, 20),
    ga4LandingPages(days, 25),
    ga4Events(days, 25),
    ga4NewReturning(days),
    ga4Cities(days, 15),
    ga4Browsers(days, 10),
  ]);

  const connected = !!ov;

  return (
    <div className="max-w-7xl">
      <h1 className="text-3xl font-extrabold mb-2">📈 Traffic</h1>
      <p className="text-slate-600 mb-4">GA4-Daten über alle Properties (kuiper-safety.de + Subdomains).</p>

      <RangePicker current={key} />

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
            <StatCard label="Sessions" value={num(ov!.total.sessions)} hint={label} />
            <StatCard label="Nutzer" value={num(ov!.total.users)} />
            <StatCard label="Pageviews" value={num(ov!.total.pageviews)} />
            <StatCard label="Engagement-Rate" value={pct(ov!.total.engagementRate)} />
          </div>

          {ov!.rows && ov!.rows.length > 1 && (
            <Card title="Sessions-Verlauf" className="mb-8">
              <TrendBars data={ov!.rows.map((r) => ({ label: r.dimension, value: r.sessions }))} />
            </Card>
          )}

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

          <Card title="Quelle / Medium" className="mb-8">
            {sourceMedium && sourceMedium.length > 0 ? (
              <div className="max-h-96 overflow-y-auto">
                <Table headers={['Quelle / Medium', 'Sessions', 'Users', 'Convs', 'Engagement']}>
                  {sourceMedium.map((s, i) => (
                    <tr key={i} className="border-t hover:bg-slate-50">
                      <td className="px-3 py-2 max-w-xs truncate">{s.sourceMedium}</td>
                      <td className="px-3 py-2 text-right font-mono">{num(s.sessions)}</td>
                      <td className="px-3 py-2 text-right font-mono">{num(s.users)}</td>
                      <td className="px-3 py-2 text-right font-mono">{num(s.conversions)}</td>
                      <td className="px-3 py-2 text-right font-mono">{pct(s.engagementRate)}</td>
                    </tr>
                  ))}
                </Table>
              </div>
            ) : <Empty />}
          </Card>

          <Card title="Landingpages (Einstiegsseiten)" className="mb-8">
            {landing && landing.length > 0 ? (
              <div className="max-h-96 overflow-y-auto">
                <Table headers={['Landingpage', 'Sessions', 'Convs', 'Bounce', 'Ø Dauer']}>
                  {landing.map((l, i) => (
                    <tr key={i} className="border-t hover:bg-slate-50">
                      <td className="px-3 py-2 max-w-md truncate font-mono text-xs">{l.landing}</td>
                      <td className="px-3 py-2 text-right font-mono">{num(l.sessions)}</td>
                      <td className="px-3 py-2 text-right font-mono">{num(l.conversions)}</td>
                      <td className="px-3 py-2 text-right font-mono">{pct(l.bounceRate)}</td>
                      <td className="px-3 py-2 text-right font-mono">{dur(l.avgDuration)}</td>
                    </tr>
                  ))}
                </Table>
              </div>
            ) : <Empty />}
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-8">
            <Card title="Events / Key-Events">
              {events && events.length > 0 ? (
                <div className="max-h-96 overflow-y-auto">
                  <Table headers={['Event', 'Anzahl', 'Users', 'Key']}>
                    {events.map((e, i) => (
                      <tr key={i} className="border-t hover:bg-slate-50">
                        <td className="px-3 py-2 font-mono text-xs">{e.event}</td>
                        <td className="px-3 py-2 text-right font-mono">{num(e.count)}</td>
                        <td className="px-3 py-2 text-right font-mono">{num(e.users)}</td>
                        <td className="px-3 py-2 text-right">{e.keyEvent ? '⭐' : ''}</td>
                      </tr>
                    ))}
                  </Table>
                </div>
              ) : <Empty />}
            </Card>

            <Card title="Neu vs. Wiederkehrend">
              {newRet && newRet.length > 0 ? (
                <Table headers={['Typ', 'Sessions', 'Users']}>
                  {newRet.map((n, i) => (
                    <tr key={i} className="border-t hover:bg-slate-50">
                      <td className="px-3 py-2 capitalize">{n.type === 'new' ? 'Neu' : n.type === 'returning' ? 'Wiederkehrend' : n.type}</td>
                      <td className="px-3 py-2 text-right font-mono">{num(n.sessions)}</td>
                      <td className="px-3 py-2 text-right font-mono">{num(n.users)}</td>
                    </tr>
                  ))}
                </Table>
              ) : <Empty />}
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-8">
            <Card title="Top-Städte">
              {cities && cities.length > 0 ? (
                <div className="max-h-96 overflow-y-auto">
                  <Table headers={['Stadt', 'Sessions', 'Convs']}>
                    {cities.map((c, i) => (
                      <tr key={i} className="border-t hover:bg-slate-50">
                        <td className="px-3 py-2">{c.city}</td>
                        <td className="px-3 py-2 text-right font-mono">{num(c.sessions)}</td>
                        <td className="px-3 py-2 text-right font-mono">{num(c.conversions)}</td>
                      </tr>
                    ))}
                  </Table>
                </div>
              ) : <Empty />}
            </Card>

            <Card title="Browser">
              {browsers && browsers.length > 0 ? (
                <Table headers={['Browser', 'Sessions']}>
                  {browsers.map((b, i) => (
                    <tr key={i} className="border-t hover:bg-slate-50">
                      <td className="px-3 py-2">{b.browser}</td>
                      <td className="px-3 py-2 text-right font-mono">{num(b.sessions)}</td>
                    </tr>
                  ))}
                </Table>
              ) : <Empty />}
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
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

function TrendBars({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const fmtDay = (s: string) => (s.length === 8 ? `${s.slice(6, 8)}.${s.slice(4, 6)}` : s);
  return (
    <div className="p-4">
      <div className="flex items-end gap-[2px] h-32">
        {data.map((d, i) => (
          <div key={i} className="flex-1 group relative flex flex-col justify-end" title={`${fmtDay(d.label)}: ${d.value.toLocaleString('de-DE')}`}>
            <div className="bg-sky-400 group-hover:bg-sky-500 rounded-t transition-all" style={{ height: `${(d.value / max) * 100}%` }} />
          </div>
        ))}
      </div>
      <div className="flex justify-between text-[10px] text-slate-400 mt-1">
        <span>{fmtDay(data[0]?.label || '')}</span>
        <span>Ø {Math.round(data.reduce((a, d) => a + d.value, 0) / data.length).toLocaleString('de-DE')}/Tag</span>
        <span>{fmtDay(data[data.length - 1]?.label || '')}</span>
      </div>
    </div>
  );
}
