import { requireAdmin } from '@/lib/admin-auth';
import { mktBlog } from '@/lib/mkt-blog';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function PillarsPage() {
  await requireAdmin();
  const { items, error } = await mktBlog.pillars({ perPage: 100, sort: '-updated', fields: 'id,title,slug,status,published_at,focus_keyword' });

  return (
    <div className="max-w-6xl">
      <div className="flex items-baseline justify-between mb-6">
        <div>
          <h1 className="text-3xl font-extrabold">🏛️ Pillar-Seiten</h1>
          <p className="text-slate-600 text-sm mt-1">Hub-Pages für Themen-Cluster ({items.length})</p>
        </div>
        <Link href="/admin/content/blog/pillars/new" className="px-4 py-2 bg-brand text-navy rounded-lg font-bold hover:bg-brand-light transition">
          + Neue Pillar-Page
        </Link>
      </div>

      {error && (
        <div className="mb-4 p-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-sm">{error}</div>
      )}

      {!error && !items.length && (
        <div className="p-8 rounded-lg bg-slate-100 text-slate-600 text-center">
          Noch keine Pillar-Pages — Migration in Phase 2.0f.
        </div>
      )}

      {items.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((p: any) => (
            <Link key={p.id} href={`/admin/content/blog/pillars/${p.id}`} className="block p-5 bg-white rounded-xl border hover:shadow-md hover:border-brand transition">
              <div className="font-bold text-lg mb-1">{p.title}</div>
              <div className="text-xs text-slate-500 mb-2 font-mono">{p.slug}</div>
              {p.focus_keyword && (
                <div className="text-xs text-slate-600 mb-2">Fokus: <span className="font-semibold">{p.focus_keyword}</span></div>
              )}
              <div className="flex items-center justify-between text-xs">
                <span className={`px-2 py-0.5 rounded-full font-semibold uppercase ${p.status === 'published' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                  {p.status || 'draft'}
                </span>
                {p.published_at && <span className="text-slate-500">{new Date(p.published_at).toLocaleDateString('de-DE')}</span>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
