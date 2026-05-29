import { requireAdmin } from '@/lib/admin-auth';
import { gscSiteOverview, gscTopQueries, gscTopPages } from '@/lib/gsc';
import { blogRankings, blogKeywords } from '@/lib/blog-data';
import StatCard from '@/components/StatCard';
import ConnectionStatus from '@/components/ConnectionStatus';

export const dynamic = 'force-dynamic';

function num(n: number) { return n.toLocaleString('de-DE'); }
function pct(n: number, d = 1) { return (n * 100).toFixed(d) + '%'; }
function pos(n: number) { return n.toFixed(1); }

export default async function SeoPage() {
  await requireAdmin();
  const [ov, queries, pages, rankings, keywords] = await Promise.all([
    gscSiteOverview(28),
    gscTopQueries(28, 50),
    gscTopPages(28, 25),
    blogRankings(50),
    blogKeywords(100),
  ]);

  const gscOk = !!ov;
  const blogPbOk = rankings.length > 0 || keywords.length > 0;

  return (
    <div className="max-w-7xl">
      <h1 className="text-3xl font-extrabold mb-2">🔍 SEO</h1>
      <p className="text-slate-600 mb-6">Google Search Console + Blog-Ranking-Daten (kuiper-safety.de + brandschutzdozenten.de Transfer).</p>

      <ConnectionStatus checks={[
        { name: 'GSC', connected: gscOk, hint: 'Service-Account als Limited User in GSC-Property hinzufügen' },
        { name: 'Blog-PB Rankings', connected: blogPbOk, hint: 'blog_rankings + blog_keywords Collections in pb.kuiper-safety.de' },
      ]} />

      {gscOk && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <StatCard label="Klicks · 28T" value={num(ov!.total.clicks)} />
          <StatCard label="Impressionen · 28T" value={num(ov!.total.impressions)} />
          <StatCard label="CTR" value={pct(ov!.total.clicks / Math.max(ov!.total.impressions, 1))} />
          <StatCard label="Ø Position" value={pos(ov!.total.position)} />
        </div>
      )}

      {!gscOk && (
        <div className="p-8 rounded-xl border bg-amber-50 border-amber-200 mb-8">
          <h2 className="font-bold text-amber-900 mb-2">Search Console nicht verbunden</h2>
          <ol className="text-sm text-amber-900 space-y-1 list-decimal list-inside">
            <li>SA-Email (mailbrain-harvester) in GSC → Einstellungen → Nutzer und Berechtigungen → „Hinzufügen"</li>
            <li>Berechtigung: „Eingeschränkt"</li>
            <li>env <code>GSC_SITE_URL</code> auf <code>sc-domain:kuiper-safety.de</code></li>
          </ol>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-8">
        <Card title="Top Queries (GSC, 28T)">
          {queries && queries.length > 0 ? (
            <div className="max-h-96 overflow-y-auto">
              <Table headers={['Query', 'Klicks', 'Impr.', 'CTR', 'Pos.']}>
                {queries.map((q, i) => (
                  <tr key={i} className="border-t hover:bg-slate-50">
                    <td className="px-3 py-2 max-w-xs truncate">{q.query}</td>
                    <td className="px-3 py-2 text-right font-mono">{num(q.clicks)}</td>
                    <td className="px-3 py-2 text-right font-mono">{num(q.impressions)}</td>
                    <td className="px-3 py-2 text-right font-mono">{pct(q.ctr)}</td>
                    <td className="px-3 py-2 text-right font-mono">{pos(q.position)}</td>
                  </tr>
                ))}
              </Table>
            </div>
          ) : <Empty />}
        </Card>

        <Card title="Top Pages (GSC, 28T)">
          {pages && pages.length > 0 ? (
            <div className="max-h-96 overflow-y-auto">
              <Table headers={['Page', 'Klicks', 'Pos.']}>
                {pages.map((p, i) => (
                  <tr key={i} className="border-t hover:bg-slate-50">
                    <td className="px-3 py-2 max-w-xs truncate font-mono text-xs">{p.page.replace('https://', '')}</td>
                    <td className="px-3 py-2 text-right font-mono">{num(p.clicks)}</td>
                    <td className="px-3 py-2 text-right font-mono">{pos(p.position)}</td>
                  </tr>
                ))}
              </Table>
            </div>
          ) : <Empty />}
        </Card>
      </div>

      <Card title="Blog-Keywords (aus blog_keywords)" className="mb-8">
        {keywords.length > 0 ? (
          <div className="max-h-96 overflow-y-auto">
            <Table headers={['Keyword', 'Vol.', 'Diff.', 'Intent', 'Last Pos.']}>
              {keywords.slice(0, 50).map((k: any, i: number) => (
                <tr key={i} className="border-t hover:bg-slate-50">
                  <td className="px-3 py-2">{k.keyword}</td>
                  <td className="px-3 py-2 text-right font-mono">{num(k.search_volume || 0)}</td>
                  <td className="px-3 py-2 text-right font-mono">{k.difficulty || '—'}</td>
                  <td className="px-3 py-2 text-right text-xs uppercase">{k.intent || '—'}</td>
                  <td className="px-3 py-2 text-right font-mono">{k.last_position || '—'}</td>
                </tr>
              ))}
            </Table>
          </div>
        ) : (
          <div className="p-6 text-center text-slate-500 text-sm">
            <p className="mb-1">Noch keine Keywords im Blog-PB.</p>
            <p className="text-xs">In Stage 2 wird der SEO-Hub aus dem CRM portiert und Keyword-Daten fließen ein.</p>
          </div>
        )}
      </Card>

      <Card title="Aktuelle Rankings (aus blog_rankings)">
        {rankings.length > 0 ? (
          <div className="max-h-96 overflow-y-auto">
            <Table headers={['Datum', 'Position', 'Klicks', 'Impr.', 'CTR']}>
              {rankings.slice(0, 50).map((r: any, i: number) => (
                <tr key={i} className="border-t hover:bg-slate-50">
                  <td className="px-3 py-2 text-xs">{(r.checked_at || '').slice(0, 10)}</td>
                  <td className="px-3 py-2 text-right font-mono">{r.position}</td>
                  <td className="px-3 py-2 text-right font-mono">{num(r.clicks || 0)}</td>
                  <td className="px-3 py-2 text-right font-mono">{num(r.impressions || 0)}</td>
                  <td className="px-3 py-2 text-right font-mono">{r.ctr ? pct(r.ctr) : '—'}</td>
                </tr>
              ))}
            </Table>
          </div>
        ) : (
          <div className="p-6 text-center text-slate-500 text-sm">
            <p>Noch keine Rankings im Blog-PB.</p>
            <p className="text-xs mt-1">Der SEO-Monitor-Cron (Task #12) schreibt täglich neue Daten.</p>
          </div>
        )}
      </Card>
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
