import { requireAdmin } from '@/lib/admin-auth';
import { mktBlog } from '@/lib/mkt-blog';

export const dynamic = 'force-dynamic';

const POSITION_COLOR: Record<string, string> = {
  intro: 'bg-blue-100 text-blue-800',
  body: 'bg-slate-100 text-slate-700',
  conclusion: 'bg-purple-100 text-purple-800',
  sidebar: 'bg-emerald-100 text-emerald-800',
};

export default async function InternalLinksPage() {
  await requireAdmin();
  const { items, error } = await mktBlog.internalLinks({ perPage: 300, sort: '-updated', fields: 'id,source_article_id,target_article_id,anchor_text,position,automatic,updated' });

  return (
    <div className="max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold">🔗 Interne Verlinkung</h1>
        <p className="text-slate-600 text-sm mt-1">{items.length} Anchor-Links · Cross-Article-Vernetzung</p>
      </div>

      {error && (
        <div className="mb-4 p-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-sm">{error}</div>
      )}

      {!error && !items.length && (
        <div className="p-8 rounded-lg bg-slate-100 text-slate-600 text-center">
          Noch keine internen Links — Migration der 180 CRM-Records in Phase 2.0f.
        </div>
      )}

      {items.length > 0 && (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50/70 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Quell-Artikel</th>
                <th className="px-4 py-3 text-left font-semibold">Ziel-Artikel</th>
                <th className="px-4 py-3 text-left font-semibold">Anchor-Text</th>
                <th className="px-4 py-3 text-left font-semibold">Position</th>
                <th className="px-4 py-3 text-center font-semibold">Auto</th>
              </tr>
            </thead>
            <tbody>
              {items.map((l: any) => (
                <tr key={l.id} className="border-t hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-xs">{(l.source_article_id || '—').slice(0, 12)}</td>
                  <td className="px-4 py-3 font-mono text-xs">{(l.target_article_id || '—').slice(0, 12)}</td>
                  <td className="px-4 py-3 max-w-xs truncate">{l.anchor_text || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${POSITION_COLOR[l.position] || 'bg-slate-100 text-slate-600'}`}>
                      {l.position || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">{l.automatic ? '✓' : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
