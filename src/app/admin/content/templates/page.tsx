import { requireAdmin } from '@/lib/admin-auth';
import { mktSite, mktSiteCounts } from '@/lib/mkt-site';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

const STATUS_COLOR: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-800',
  inactive: 'bg-slate-100 text-slate-600',
};

const TYPE_LABEL: Record<string, string> = {
  email: '✉️ E-Mail',
  landing_page: '🎨 Landing-Page',
  social: '🤖 Social',
};

export default async function TemplatesPage() {
  await requireAdmin();
  const counts = {
    total: await mktSiteCounts.templates(),
    active: await mktSiteCounts.templatesActive(),
  };
  const { items, error } = await mktSite.templates({
    perPage: 200, sort: '-updated',
    fields: 'id,name,type,status,description,updated',
  });

  return (
    <div className="max-w-7xl">
      <div className="flex items-baseline justify-between mb-6">
        <div>
          <h1 className="text-3xl font-extrabold">📐 Templates</h1>
          <p className="text-slate-600 text-sm mt-1">{counts.total} Templates · {counts.active} aktiv</p>
        </div>
        <Link href="/admin/content/templates/new" className="px-4 py-2 bg-brand text-navy rounded-lg font-bold hover:bg-brand-light transition">
          + Neues Template
        </Link>
      </div>

      {error && (
        <div className="mb-4 p-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-sm">{error}</div>
      )}

      {!error && !items.length && (
        <div className="p-8 rounded-lg bg-slate-100 text-slate-600 text-center">
          Noch keine Templates — Migration in Phase 2.0f.
        </div>
      )}

      {items.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((t: any) => (
            <Link key={t.id} href={`/admin/content/templates/${t.id}`} className="block p-5 bg-white rounded-xl border hover:shadow-md hover:border-brand transition">
              <div className="flex items-start justify-between mb-3">
                <div className="text-lg font-bold">{t.name}</div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${STATUS_COLOR[t.status] || 'bg-slate-100 text-slate-600'}`}>
                  {t.status || '—'}
                </span>
              </div>
              <div className="text-xs text-slate-500 mb-2">{TYPE_LABEL[t.type] || t.type || '—'}</div>
              {t.description && <p className="text-sm text-slate-600 line-clamp-2">{t.description}</p>}
              {t.updated && (
                <div className="text-xs text-slate-400 mt-3">
                  Aktualisiert: {new Date(t.updated).toLocaleDateString('de-DE')}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
