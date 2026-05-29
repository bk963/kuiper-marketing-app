import { requireAdmin } from '@/lib/admin-auth';
import { mktForms, mktFormsCounts } from '@/lib/mkt-forms';

export const dynamic = 'force-dynamic';

const STATUS_COLOR: Record<string, string> = {
  new: 'bg-amber-100 text-amber-800',
  contacted: 'bg-blue-100 text-blue-800',
  qualified: 'bg-purple-100 text-purple-800',
  converted: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-rose-100 text-rose-800',
};

export default async function LeadsPage() {
  await requireAdmin();
  const total = await mktFormsCounts.leads();
  const newCount = await mktFormsCounts.leadsNew();

  const { items, error } = await mktForms.leads({
    perPage: 200, sort: '-created',
    fields: 'id,email,name,phone,company,status,landingpage_slug,utm_source,utm_campaign,created',
  });

  return (
    <div className="max-w-7xl">
      <div className="flex items-baseline justify-between mb-6">
        <div>
          <h1 className="text-3xl font-extrabold">👥 Marketing-Leads</h1>
          <p className="text-slate-600 text-sm mt-1">{total} Leads · {newCount} neu · Read-only</p>
        </div>
        <div className="text-xs text-slate-500">Sales-Übergabe via CRM</div>
      </div>

      {error && (
        <div className="mb-4 p-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-sm">{error}</div>
      )}

      {!error && !items.length && (
        <div className="p-8 rounded-lg bg-slate-100 text-slate-600 text-center">
          Noch keine Leads — Migration in Phase 2.0f (21 Records aus CRM-leads).
        </div>
      )}

      {items.length > 0 && (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50/70 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">E-Mail</th>
                <th className="px-3 py-3 text-left font-semibold">Name / Firma</th>
                <th className="px-3 py-3 text-left font-semibold">Telefon</th>
                <th className="px-3 py-3 text-left font-semibold">Status</th>
                <th className="px-3 py-3 text-left font-semibold">UTM-Source</th>
                <th className="px-3 py-3 text-left font-semibold">Erstellt</th>
              </tr>
            </thead>
            <tbody>
              {items.map((l: any) => (
                <tr key={l.id} className="border-t hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-xs">{l.email}</td>
                  <td className="px-3 py-3">
                    {l.name && <div>{l.name}</div>}
                    {l.company && <div className="text-xs text-slate-500">{l.company}</div>}
                  </td>
                  <td className="px-3 py-3 text-slate-600 text-xs">{l.phone || '—'}</td>
                  <td className="px-3 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${STATUS_COLOR[l.status] || 'bg-slate-100 text-slate-600'}`}>
                      {l.status || 'new'}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-xs text-slate-600">{l.utm_source || '—'}</td>
                  <td className="px-3 py-3 text-xs text-slate-500">
                    {l.created ? new Date(l.created).toLocaleDateString('de-DE') : '—'}
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
