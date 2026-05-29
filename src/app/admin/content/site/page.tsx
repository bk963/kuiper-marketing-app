import { requireAdmin } from '@/lib/admin-auth';
import { mktSite, mktSiteCounts } from '@/lib/mkt-site';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

const STATUS_COLOR: Record<string, string> = {
  published: 'bg-emerald-100 text-emerald-800',
  draft: 'bg-amber-100 text-amber-800',
  archived: 'bg-slate-100 text-slate-600',
};

function num(n: number) { return n.toLocaleString('de-DE'); }

export default async function SitePagesOverview() {
  await requireAdmin();
  const counts = {
    total: await mktSiteCounts.pages(),
    published: await mktSiteCounts.pagesPublished(),
    draft: await mktSiteCounts.pagesDraft(),
  };
  const { items, error } = await mktSite.pages({
    perPage: 200, sort: '-updated',
    fields: 'id,title,slug,status,template_type,updated,published_at,seo_title',
  });

  return (
    <div className="max-w-7xl">
      <div className="flex items-baseline justify-between mb-6">
        <div>
          <h1 className="text-3xl font-extrabold">🌐 Site-Pages</h1>
          <p className="text-slate-600 text-sm mt-1">{counts.total} Pages · Static-Pages, Landing-Areas, Legal</p>
        </div>
        <Link href="/admin/content/site/new" className="px-4 py-2 bg-brand text-navy rounded-lg font-bold hover:bg-brand-light transition">
          + Neue Page
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
        <Stat label="Total" value={counts.total} />
        <Stat label="Veröffentlicht" value={counts.published} />
        <Stat label="Drafts" value={counts.draft} />
      </div>

      {error && (
        <div className="mb-4 p-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-sm">{error}</div>
      )}

      {!error && !items.length && (
        <div className="p-8 rounded-lg bg-slate-100 text-slate-600 text-center">
          Noch keine Site-Pages — Migration in Phase 2.0f.
        </div>
      )}

      {items.length > 0 && (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50/70 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Titel</th>
                <th className="px-4 py-3 text-left font-semibold">Slug</th>
                <th className="px-3 py-3 text-left font-semibold">Template</th>
                <th className="px-3 py-3 text-left font-semibold">Status</th>
                <th className="px-3 py-3 text-left font-semibold">Aktualisiert</th>
              </tr>
            </thead>
            <tbody>
              {items.map((p: any) => (
                <tr key={p.id} className="border-t hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link href={`/admin/content/site/${p.id}`} className="font-semibold text-navy hover:text-brand">
                      {p.title || '(ohne Titel)'}
                    </Link>
                    {p.seo_title && <div className="text-xs text-slate-500 mt-0.5 truncate max-w-xs">SEO: {p.seo_title}</div>}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-600">/{p.slug}</td>
                  <td className="px-3 py-3 text-xs uppercase text-slate-600">{p.template_type || '—'}</td>
                  <td className="px-3 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${STATUS_COLOR[p.status] || 'bg-slate-100 text-slate-600'}`}>
                      {p.status || 'draft'}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-xs text-slate-500">
                    {p.updated ? new Date(p.updated).toLocaleDateString('de-DE') : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="p-5 bg-white rounded-xl border border-slate-200/70">
      <div className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">{label}</div>
      <div className="text-3xl font-extrabold mt-1">{num(value)}</div>
    </div>
  );
}
