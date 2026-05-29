import { requireAdmin } from '@/lib/admin-auth';
import { mktBlog } from '@/lib/mkt-blog';

export const dynamic = 'force-dynamic';

export default async function CategoriesPage() {
  await requireAdmin();
  const { items, error } = await mktBlog.categories({ perPage: 200, sort: 'name', fields: 'id,name,slug,description,parent_id,sort_order' });

  return (
    <div className="max-w-5xl">
      <h1 className="text-3xl font-extrabold mb-2">🏷️ Kategorien</h1>
      <p className="text-slate-600 mb-6">Brandschutz / Arbeitsschutz / Gesundheitsschutz · Hierarchische Taxonomie</p>

      {error && (
        <div className="mb-4 p-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-sm">{error}</div>
      )}

      {!error && !items.length && (
        <div className="p-8 rounded-lg bg-slate-100 text-slate-600 text-center">
          Noch keine Kategorien — Migration in Phase 2.0f.
        </div>
      )}

      {items.length > 0 && (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50/70 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Name</th>
                <th className="px-4 py-3 text-left font-semibold">Slug</th>
                <th className="px-4 py-3 text-left font-semibold">Parent</th>
                <th className="px-4 py-3 text-right font-semibold">Sort</th>
              </tr>
            </thead>
            <tbody>
              {items.map((c: any) => (
                <tr key={c.id} className="border-t hover:bg-slate-50">
                  <td className="px-4 py-3 font-semibold">{c.name}</td>
                  <td className="px-4 py-3 font-mono text-xs">{c.slug}</td>
                  <td className="px-4 py-3 text-slate-600 text-xs">{c.parent_id || '—'}</td>
                  <td className="px-4 py-3 text-right font-mono text-xs">{c.sort_order ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
