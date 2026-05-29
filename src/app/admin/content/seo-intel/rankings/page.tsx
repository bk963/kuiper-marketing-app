import { requireAdmin } from '@/lib/admin-auth';
import { mktSeo } from '@/lib/mkt-seo';

export const dynamic = 'force-dynamic';

const SOURCE_COLOR: Record<string, string> = {
  dataforseo: 'bg-blue-100 text-blue-800',
  serp_scraper: 'bg-purple-100 text-purple-800',
  search_console: 'bg-emerald-100 text-emerald-800',
};

function num(n: number) { return n?.toLocaleString('de-DE') || '—'; }
function pct(n: number, d = 1) { return n ? (n * 100).toFixed(d) + '%' : '—'; }

export default async function RankingsPage() {
  await requireAdmin();
  const { items, error } = await mktSeo.rankings({ perPage: 300, sort: '-checked_at', fields: 'id,keyword_id,position,url,checked_at,source,device,country,impressions,clicks,ctr' });

  return (
    <div className="max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold">📈 Rankings</h1>
        <p className="text-slate-600 text-sm mt-1">{items.length} History-Points · Sort: zuletzt geprüft ↓</p>
      </div>

      {error && (
        <div className="mb-4 p-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-sm">{error}</div>
      )}

      {!error && !items.length && (
        <div className="p-8 rounded-lg bg-slate-100 text-slate-600 text-center">
          Noch keine Rankings — Migration in Phase 2.0f + tägliche SEO-Monitor-Crons.
        </div>
      )}

      {items.length > 0 && (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50/70 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Datum</th>
                <th className="px-3 py-3 text-right font-semibold">Pos</th>
                <th className="px-4 py-3 text-left font-semibold">URL</th>
                <th className="px-3 py-3 text-left font-semibold">Source</th>
                <th className="px-3 py-3 text-left font-semibold">Device</th>
                <th className="px-3 py-3 text-right font-semibold">Impr.</th>
                <th className="px-3 py-3 text-right font-semibold">Klicks</th>
                <th className="px-3 py-3 text-right font-semibold">CTR</th>
              </tr>
            </thead>
            <tbody>
              {items.map((r: any) => (
                <tr key={r.id} className="border-t hover:bg-slate-50">
                  <td className="px-4 py-3 text-xs">{r.checked_at ? new Date(r.checked_at).toLocaleDateString('de-DE') : '—'}</td>
                  <td className="px-3 py-3 text-right font-mono font-bold">{r.position || '—'}</td>
                  <td className="px-4 py-3 max-w-xs truncate font-mono text-xs text-slate-600">{r.url || '—'}</td>
                  <td className="px-3 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${SOURCE_COLOR[r.source] || 'bg-slate-100 text-slate-600'}`}>
                      {r.source || '—'}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-xs uppercase">{r.device || '—'}</td>
                  <td className="px-3 py-3 text-right font-mono">{num(r.impressions)}</td>
                  <td className="px-3 py-3 text-right font-mono">{num(r.clicks)}</td>
                  <td className="px-3 py-3 text-right font-mono">{pct(r.ctr)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
