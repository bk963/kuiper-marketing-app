import { requireAdmin } from '@/lib/admin-auth';
import { mktForms, mktFormsCounts } from '@/lib/mkt-forms';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

const STATUS_COLOR: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-800',
  inactive: 'bg-slate-100 text-slate-600',
};

export default async function FormsPage() {
  await requireAdmin();
  const counts = {
    total: await mktFormsCounts.forms(),
    active: await mktFormsCounts.formsActive(),
    submissions: await mktFormsCounts.submissions(),
  };
  const { items, error } = await mktForms.forms({
    perPage: 100, sort: '-updated',
    fields: 'id,name,description,status,fields,updated',
  });

  return (
    <div className="max-w-7xl">
      <div className="flex items-baseline justify-between mb-6">
        <div>
          <h1 className="text-3xl font-extrabold">📋 Formulare</h1>
          <p className="text-slate-600 text-sm mt-1">{counts.total} Forms · {counts.active} aktiv · {counts.submissions} Submissions total</p>
        </div>
        <Link href="/admin/content/forms/new" className="px-4 py-2 bg-brand text-navy rounded-lg font-bold hover:bg-brand-light transition">
          + Neues Formular
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
        <Stat label="Forms" value={counts.total} />
        <Stat label="Aktiv" value={counts.active} />
        <Stat label="Submissions" value={counts.submissions} />
      </div>

      {error && (
        <div className="mb-4 p-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-sm">{error}</div>
      )}

      {!error && !items.length && (
        <div className="p-8 rounded-lg bg-slate-100 text-slate-600 text-center">
          Noch keine Formulare — Migration in Phase 2.0f.
        </div>
      )}

      {items.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((f: any) => (
            <Link key={f.id} href={`/admin/content/forms/${f.id}`} className="block p-5 bg-white rounded-xl border hover:shadow-md hover:border-brand transition">
              <div className="flex items-start justify-between mb-2">
                <div className="font-bold text-base">{f.name}</div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${STATUS_COLOR[f.status] || 'bg-slate-100 text-slate-600'}`}>
                  {f.status || '—'}
                </span>
              </div>
              {f.description && <p className="text-sm text-slate-600 mb-2 line-clamp-2">{f.description}</p>}
              <div className="text-xs text-slate-500 mt-2">
                {Array.isArray(f.fields) ? `${f.fields.length} Felder` : ''}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="p-5 bg-white rounded-xl border border-slate-200/70">
      <div className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">{label}</div>
      <div className="text-3xl font-extrabold mt-1">{value.toLocaleString('de-DE')}</div>
    </div>
  );
}
