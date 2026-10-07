import { requireAdmin } from '@/lib/admin-auth';
import { dfsOverview, dfsRankedKeywords, dfsKeywordGap } from '@/lib/dataforseo';
import CompetitorForm from '@/components/CompetitorForm';
import StatCard from '@/components/StatCard';

export const dynamic = 'force-dynamic';

const OUR = (process.env.GSC_SITE_URL || 'sc-domain:kuiper-safety.de').replace('sc-domain:', '').replace(/^https?:\/\//, '');
function num(n: number) { return (n || 0).toLocaleString('de-DE'); }

export default async function CompetitorsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdmin();
  const sp = await searchParams;
  const domainsRaw = (Array.isArray(sp.domains) ? sp.domains[0] : sp.domains) || '';
  const competitors = domainsRaw.split(',').map((d) => d.trim()).filter(Boolean).slice(0, 4);

  const ourOv = await dfsOverview(OUR);
  const compData = await Promise.all(competitors.map(async (c) => ({
    domain: c,
    ov: await dfsOverview(c),
    gap: await dfsKeywordGap(OUR, c, 30),
    kws: await dfsRankedKeywords(c, 20),
  })));

  return (
    <div className="max-w-7xl">
      <h1 className="text-3xl font-extrabold mb-2">🥊 Wettbewerb</h1>
      <p className="text-slate-600 mb-4">Wettbewerbs-Analyse via DataForSEO: geschätzter Organic-Traffic, Keyword-Lücken (sie ranken, wir nicht) & Top-Keywords. Eigene Domain: <b>{OUR}</b>.</p>

      <CompetitorForm current={competitors.join(', ')} />

      {ourOv.error && <div className="p-4 rounded-xl border bg-amber-50 border-amber-200 text-sm text-amber-900 mb-6">DataForSEO: {ourOv.error}{ourOv.error.includes('40104') || ourOv.error.includes('verify') ? ' — Konto-Limits propagieren direkt nach Verifizierung noch (kurz warten).' : ''}</div>}

      {/* Overview-Vergleich */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <StatCard label={`${OUR} (wir)`} value={ourOv.data ? num(ourOv.data.etv) : '—'} hint="geschätzte Besucher/Mon" />
        {compData.map((c, i) => (
          <StatCard key={i} label={c.domain} value={c.ov.data ? num(c.ov.data.etv) : '—'} hint="geschätzte Besucher/Mon" />
        ))}
      </div>

      {ourOv.data && (
        <Card title={`Überblick-Vergleich (geschätzt)`} className="mb-8">
          <Table headers={['Domain', 'Traffic/Mon', 'Keywords', 'Top 3', 'Pos 4–10', 'Pos 11–20']}>
            <Row d={OUR + ' (wir)'} o={ourOv.data} highlight />
            {compData.map((c, i) => c.ov.data ? <Row key={i} d={c.domain} o={c.ov.data} /> : (
              <tr key={i} className="border-t"><td className="px-3 py-2">{c.domain}</td><td className="px-3 py-2 text-right text-slate-400" colSpan={5}>{c.ov.error || 'keine Daten'}</td></tr>
            ))}
          </Table>
        </Card>
      )}

      {competitors.length === 0 && (
        <div className="p-8 rounded-xl border bg-slate-50 border-slate-200 text-center text-slate-600">
          Gib oben eine oder mehrere <b>Wettbewerber-Domains</b> ein (z.B. aus Google-Suchen zu euren Keywords) — dann zeige ich Traffic-Vergleich, <b>Keyword-Lücken</b> und ihre Top-Keywords.
        </div>
      )}

      {compData.map((c, i) => (
        <div key={i} className="mb-8">
          <h2 className="text-xl font-bold text-slate-800 mb-3 mt-2">🎯 {c.domain}</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Card title={`Keyword-Lücken — sie ranken, wir (fast) nicht (${c.gap.data.length})`}>
              {c.gap.error ? <ErrBox msg={c.gap.error} /> : c.gap.data.length > 0 ? (
                <div className="max-h-96 overflow-y-auto">
                  <Table headers={['Keyword', 'Vol.', 'Ihre Pos.', 'Unsere Pos.']}>
                    {c.gap.data.map((k, j) => (
                      <tr key={j} className="border-t hover:bg-slate-50">
                        <td className="px-3 py-2 max-w-xs truncate">{k.keyword}</td>
                        <td className="px-3 py-2 text-right font-mono">{num(k.volume)}</td>
                        <td className="px-3 py-2 text-right font-mono text-emerald-600">{k.position}</td>
                        <td className="px-3 py-2 text-right font-mono text-rose-600">{k.ourPosition ?? '—'}</td>
                      </tr>
                    ))}
                  </Table>
                </div>
              ) : <Empty />}
            </Card>
            <Card title={`Ihre Top-Keywords (${c.kws.data.length})`}>
              {c.kws.error ? <ErrBox msg={c.kws.error} /> : c.kws.data.length > 0 ? (
                <div className="max-h-96 overflow-y-auto">
                  <Table headers={['Keyword', 'Vol.', 'Pos.', 'CPC €']}>
                    {c.kws.data.map((k, j) => (
                      <tr key={j} className="border-t hover:bg-slate-50">
                        <td className="px-3 py-2 max-w-xs truncate">{k.keyword}</td>
                        <td className="px-3 py-2 text-right font-mono">{num(k.volume)}</td>
                        <td className="px-3 py-2 text-right font-mono">{k.position}</td>
                        <td className="px-3 py-2 text-right font-mono">{k.cpc || '—'}</td>
                      </tr>
                    ))}
                  </Table>
                </div>
              ) : <Empty />}
            </Card>
          </div>
        </div>
      ))}
    </div>
  );
}

function Row({ d, o, highlight }: { d: string; o: any; highlight?: boolean }) {
  return (
    <tr className={`border-t ${highlight ? 'bg-sky-50/60 font-semibold' : 'hover:bg-slate-50'}`}>
      <td className="px-3 py-2">{d}</td>
      <td className="px-3 py-2 text-right font-mono">{(o.etv || 0).toLocaleString('de-DE')}</td>
      <td className="px-3 py-2 text-right font-mono">{(o.keywords || 0).toLocaleString('de-DE')}</td>
      <td className="px-3 py-2 text-right font-mono">{(o.pos1 + o.pos2_3) || 0}</td>
      <td className="px-3 py-2 text-right font-mono">{o.pos4_10 || 0}</td>
      <td className="px-3 py-2 text-right font-mono">{o.pos11_20 || 0}</td>
    </tr>
  );
}
function Card({ title, children, className = '' }: { title: string; children: React.ReactNode; className?: string }) {
  return <div className={`bg-white rounded-xl border overflow-hidden ${className}`}><div className="px-4 py-3 border-b font-bold text-sm text-slate-700">{title}</div>{children}</div>;
}
function Table({ headers, children }: { headers: string[]; children: React.ReactNode }) {
  return <table className="w-full text-sm"><thead className="bg-slate-50/70 text-xs uppercase tracking-wide text-slate-500 sticky top-0"><tr>{headers.map((h, i) => <th key={i} className={`px-3 py-2 font-semibold ${i === 0 ? 'text-left' : 'text-right'}`}>{h}</th>)}</tr></thead><tbody>{children}</tbody></table>;
}
function Empty() { return <div className="p-6 text-center text-slate-500 text-sm">Keine Daten</div>; }
function ErrBox({ msg }: { msg: string }) { return <div className="p-4 text-sm text-amber-800 bg-amber-50">{msg}{(msg.includes('40104') || msg.includes('verify')) ? ' — Limits propagieren noch, kurz warten.' : ''}</div>; }
