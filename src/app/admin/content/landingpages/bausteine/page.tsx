/**
 * Bausteine-Liste — wiederverwendbare Section-Configs (mkt_lp_bausteine).
 *
 * Ein Baustein = ein vorab konfiguriertes Section-Block das mehrfach in
 * Landingpages eingebettet werden kann. Im LP-Editor unter "+ Section" als
 * Tab "Bausteine" sichtbar.
 *
 * Felder (Schema):
 *  - name, description, type (= BshSectionType), content_json (= config), status
 *
 * Hinweis (3e): mkt_lp_bausteine ist aktuell leer wegen PB-DB-Drift-Bug.
 * UI hier vollständig, sobald PB-Fix da, können Bk + Editor sofort Bausteine anlegen.
 */
import { requireAdmin } from '@/lib/admin-auth';
import { mktLp, mktLpCounts } from '@/lib/mkt-lp';
import Link from 'next/link';
import { BSH_SECTION_CATALOG } from '@/components/lp/sections/types';

export const dynamic = 'force-dynamic';

const TYPE_LABEL: Record<string, string> = Object.fromEntries(
  BSH_SECTION_CATALOG.map(c => [c.key, c.label])
);

const STATUS_COLOR: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-800',
  inactive: 'bg-slate-100 text-slate-600',
  draft: 'bg-amber-100 text-amber-800',
};

export default async function BausteinePage() {
  await requireAdmin();
  const [counts, { items, error }] = await Promise.all([
    Promise.all([mktLpCounts.bausteine(), mktLpCounts.bausteineActive()]),
    mktLp.bausteine({
      perPage: 200,
      sort: '-created',
      fields: 'id,name,description,type,status,created',
    }),
  ]);

  const [total, active] = counts;

  return (
    <div className="max-w-7xl">
      <div className="flex items-baseline justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/admin/content/landingpages" className="text-slate-500 hover:text-brand">← LPs</Link>
          <h1 className="text-3xl font-extrabold">🧩 LP-Bausteine</h1>
        </div>
        <p className="text-slate-600 text-sm">{total} Bausteine · {active} aktiv</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Stat label="Total" value={total} />
        <Stat label="Aktiv" value={active} hint="status=active" />
        <Stat label="14 BSH-Types" value={14} hint="Default-Catalog (sofort verfügbar im Editor)" />
      </div>

      {error && (
        <div className="mb-4 p-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-sm">{error}</div>
      )}

      {!error && !items.length && (
        <div className="p-6 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 text-sm">
          <p className="font-bold mb-1">Noch keine Bausteine angelegt</p>
          <p className="text-xs">Bausteine sind vorab gespeicherte Section-Configs. Sobald angelegt, erscheinen sie im LP-Editor unter "+ Section" → Tab "Bausteine".</p>
          <p className="text-xs mt-2 text-amber-700">PB-Hook-Fix für POST mkt_lp_bausteine in Arbeit (PM-festung).</p>
        </div>
      )}

      {items.length > 0 && (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50/70 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Name</th>
                <th className="px-4 py-3 text-left font-semibold">Section-Typ</th>
                <th className="px-4 py-3 text-left font-semibold">Beschreibung</th>
                <th className="px-3 py-3 text-left font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map((b: any) => (
                <tr key={b.id} className="border-t hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link href={`/admin/content/landingpages/bausteine/${b.id}`} className="font-semibold text-navy hover:text-brand">
                      {b.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {b.type ? (
                      <span className="font-mono">{TYPE_LABEL[b.type] || b.type}</span>
                    ) : <span className="text-slate-400">—</span>}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600 max-w-md truncate">{b.description || '—'}</td>
                  <td className="px-3 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${STATUS_COLOR[b.status] || 'bg-slate-100 text-slate-600'}`}>
                      {b.status || '—'}
                    </span>
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

function Stat({ label, value, hint }: { label: string; value: number; hint?: string }) {
  return (
    <div className="p-5 bg-white rounded-xl border border-slate-200/70">
      <div className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">{label}</div>
      <div className="text-3xl font-extrabold mt-1">{value.toLocaleString('de-DE')}</div>
      {hint && <div className="text-xs text-slate-500 mt-1">{hint}</div>}
    </div>
  );
}
