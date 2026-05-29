import { requireAdmin } from '@/lib/admin-auth';
import { mktSeo } from '@/lib/mkt-seo';

export const dynamic = 'force-dynamic';

function num(n: number) { return n?.toLocaleString('de-DE') || '—'; }

export default async function CompetitorsPage() {
  await requireAdmin();
  const { items, error } = await mktSeo.competitors({ perPage: 100, sort: '-overlap_score', fields: 'id,domain,name,url,tracked,overlap_score,backlink_count,domain_rating' });

  return (
    <div className="max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold">🥷 Wettbewerber</h1>
        <p className="text-slate-600 text-sm mt-1">{items.length} Domains · Sort: Overlap-Score ↓</p>
      </div>

      {error && (
        <div className="mb-4 p-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-sm">{error}</div>
      )}

      {!error && !items.length && (
        <div className="p-8 rounded-lg bg-slate-100 text-slate-600 text-center">
          Noch keine Wettbewerber — Migration in Phase 2.0f + Ahrefs/SEMrush-Import.
        </div>
      )}

      {items.length > 0 && (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50/70 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Domain</th>
                <th className="px-4 py-3 text-left font-semibold">Name</th>
                <th className="px-3 py-3 text-right font-semibold">Overlap</th>
                <th className="px-3 py-3 text-right font-semibold">DR</th>
                <th className="px-3 py-3 text-right font-semibold">Backlinks</th>
                <th className="px-3 py-3 text-center font-semibold">Track</th>
              </tr>
            </thead>
            <tbody>
              {items.map((c: any) => (
                <tr key={c.id} className="border-t hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-xs">{c.domain}</td>
                  <td className="px-4 py-3">{c.name || '—'}</td>
                  <td className="px-3 py-3 text-right font-mono font-bold">{c.overlap_score ? `${c.overlap_score}%` : '—'}</td>
                  <td className="px-3 py-3 text-right font-mono">{c.domain_rating || '—'}</td>
                  <td className="px-3 py-3 text-right font-mono">{num(c.backlink_count)}</td>
                  <td className="px-3 py-3 text-center">{c.tracked ? '✓' : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
