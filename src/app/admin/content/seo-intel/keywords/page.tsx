import { requireAdmin } from '@/lib/admin-auth';
import { mktSeo } from '@/lib/mkt-seo';

export const dynamic = 'force-dynamic';

const KIND_COLOR: Record<string, string> = {
  primary: 'bg-blue-100 text-blue-800',
  secondary: 'bg-indigo-100 text-indigo-800',
  long_tail: 'bg-purple-100 text-purple-800',
  brand: 'bg-emerald-100 text-emerald-800',
  competitor: 'bg-rose-100 text-rose-800',
};

const INTENT_COLOR: Record<string, string> = {
  informational: 'bg-slate-100 text-slate-700',
  navigational: 'bg-amber-100 text-amber-800',
  commercial: 'bg-emerald-100 text-emerald-800',
  transactional: 'bg-rose-100 text-rose-800',
};

function num(n: number) { return n?.toLocaleString('de-DE') || '—'; }

export default async function KeywordsPage() {
  await requireAdmin();
  const { items, error } = await mktSeo.keywords({ perPage: 300, sort: '-search_volume', fields: 'id,keyword,kind,search_volume,cpc,difficulty,intent,tracked,last_position' });

  return (
    <div className="max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold">🔑 Keywords</h1>
        <p className="text-slate-600 text-sm mt-1">{items.length} Keywords · Sort: Suchvolumen ↓</p>
      </div>

      {error && (
        <div className="mb-4 p-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-sm">{error}</div>
      )}

      {!error && !items.length && (
        <div className="p-8 rounded-lg bg-slate-100 text-slate-600 text-center">
          Noch keine Keywords — Migration in Phase 2.0f.
        </div>
      )}

      {items.length > 0 && (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50/70 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Keyword</th>
                <th className="px-3 py-3 text-left font-semibold">Typ</th>
                <th className="px-3 py-3 text-right font-semibold">Volumen</th>
                <th className="px-3 py-3 text-right font-semibold">CPC</th>
                <th className="px-3 py-3 text-right font-semibold">Difficulty</th>
                <th className="px-3 py-3 text-left font-semibold">Intent</th>
                <th className="px-3 py-3 text-right font-semibold">Position</th>
                <th className="px-3 py-3 text-center font-semibold">Track</th>
              </tr>
            </thead>
            <tbody>
              {items.map((k: any) => (
                <tr key={k.id} className="border-t hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium">{k.keyword}</td>
                  <td className="px-3 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${KIND_COLOR[k.kind] || 'bg-slate-100 text-slate-600'}`}>
                      {k.kind || '—'}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right font-mono">{num(k.search_volume)}</td>
                  <td className="px-3 py-3 text-right font-mono">{k.cpc ? `${Number(k.cpc).toFixed(2)} €` : '—'}</td>
                  <td className="px-3 py-3 text-right font-mono">
                    {k.difficulty !== null && k.difficulty !== undefined ? (
                      <span className={k.difficulty > 70 ? 'text-rose-600 font-bold' : k.difficulty > 40 ? 'text-amber-600' : 'text-emerald-600'}>
                        {k.difficulty}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-3 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${INTENT_COLOR[k.intent] || 'bg-slate-100 text-slate-600'}`}>
                      {k.intent || '—'}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right font-mono">{k.last_position || '—'}</td>
                  <td className="px-3 py-3 text-center">{k.tracked ? '✓' : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
