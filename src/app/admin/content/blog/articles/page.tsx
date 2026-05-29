import { requireAdmin } from '@/lib/admin-auth';
import { mktBlog } from '@/lib/mkt-blog';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

const STATUS_COLOR: Record<string, string> = {
  published: 'bg-emerald-100 text-emerald-800',
  draft: 'bg-amber-100 text-amber-800',
  review: 'bg-blue-100 text-blue-800',
  archived: 'bg-slate-100 text-slate-600',
};

export default async function ArticlesPage() {
  await requireAdmin();
  const { items, error } = await mktBlog.articles({ perPage: 300, sort: '-created', fields: 'id,title,slug,status,author,category_id,published_at,updated' });

  return (
    <div className="max-w-7xl">
      <div className="flex items-baseline justify-between mb-6">
        <div>
          <h1 className="text-3xl font-extrabold">📝 Artikel</h1>
          <p className="text-slate-600 text-sm mt-1">{items.length} Artikel · Sort: zuletzt aktualisiert</p>
        </div>
        <Link href="/admin/content/blog/articles/new" className="px-4 py-2 bg-brand text-navy rounded-lg font-bold hover:bg-brand-light transition">
          + Neuer Artikel
        </Link>
      </div>

      {error && (
        <div className="mb-4 p-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-sm">
          {error}
          {error.includes('mkt_blog_articles') && (
            <div className="mt-2 text-xs">
              Collection noch nicht angelegt — PM-festung arbeitet an PB-Direct-SQLite-Create (Disk-I/O-522-Bug umgehen).
            </div>
          )}
        </div>
      )}

      {!error && !items.length && (
        <div className="p-8 rounded-lg bg-slate-100 text-slate-600 text-center">
          Noch keine Artikel — PM-festung führt Daten-Migration in Phase 2.0f durch.
        </div>
      )}

      {items.length > 0 && (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50/70 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Titel</th>
                <th className="px-4 py-3 text-left font-semibold">Slug</th>
                <th className="px-4 py-3 text-left font-semibold">Autor</th>
                <th className="px-4 py-3 text-left font-semibold">Status</th>
                <th className="px-4 py-3 text-left font-semibold">Aktualisiert</th>
              </tr>
            </thead>
            <tbody>
              {items.map((a: any) => (
                <tr key={a.id} className="border-t hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link href={`/admin/content/blog/articles/${a.id}`} className="font-semibold text-navy hover:text-brand">
                      {a.title || '(ohne Titel)'}
                    </Link>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-600">{a.slug}</td>
                  <td className="px-4 py-3 text-slate-600">{a.author || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${STATUS_COLOR[a.status] || 'bg-slate-100 text-slate-600'}`}>
                      {a.status || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">
                    {a.updated ? new Date(a.updated).toLocaleString('de-DE') : '—'}
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
