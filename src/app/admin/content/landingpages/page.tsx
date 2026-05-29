import { requireAdmin } from '@/lib/admin-auth';
import { mktLp, mktLpCounts, abStats } from '@/lib/mkt-lp';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

const STATUS_COLOR: Record<string, string> = {
  live: 'bg-emerald-100 text-emerald-800',
  published: 'bg-emerald-100 text-emerald-800',
  draft: 'bg-amber-100 text-amber-800',
  review: 'bg-blue-100 text-blue-800',
  archived: 'bg-slate-100 text-slate-600',
};

export default async function LandingpagesPage() {
  await requireAdmin();
  const counts = {
    total: await mktLpCounts.landingpages(),
    live: await mktLpCounts.landingpagesLive(),
    draft: await mktLpCounts.landingpagesDraft(),
    abActive: await mktLpCounts.landingpagesAbActive(),
  };
  const { items, error } = await mktLp.landingpages({
    perPage: 200, sort: '-created',
    fields: 'id,internal_name,slug,status,template_id,campaign_id,published_at,created,ab_test_active,ab_views_a,ab_views_b,ab_conversions_a,ab_conversions_b',
  });

  return (
    <div className="max-w-7xl">
      <div className="flex items-baseline justify-between mb-6">
        <div>
          <h1 className="text-3xl font-extrabold">🎨 Landingpages</h1>
          <p className="text-slate-600 text-sm mt-1">{counts.total} Pages · Section-Editor + A/B-Tests + Public-LP-Route</p>
        </div>
        <Link href="/admin/content/landingpages/new" className="px-4 py-2 bg-brand text-navy rounded-lg font-bold hover:bg-brand-light transition">
          + Neue Landingpage
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <Stat label="Total" value={counts.total} />
        <Stat label="Live" value={counts.live} hint="status=live" />
        <Stat label="Drafts" value={counts.draft} hint="status=draft" />
        <Stat label="A/B-Tests aktiv" value={counts.abActive} hint="ab_test_active=true" />
      </div>

      {error && (
        <div className="mb-4 p-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-sm">{error}</div>
      )}

      {!error && !items.length && (
        <div className="p-8 rounded-lg bg-slate-100 text-slate-600 text-center">
          Noch keine Landingpages — neue anlegen mit Button oben.
        </div>
      )}

      {items.length > 0 && (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50/70 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Name</th>
                <th className="px-4 py-3 text-left font-semibold">Slug</th>
                <th className="px-3 py-3 text-left font-semibold">Status</th>
                <th className="px-3 py-3 text-center font-semibold">A/B</th>
                <th className="px-3 py-3 text-right font-semibold">Views</th>
                <th className="px-3 py-3 text-right font-semibold">Conv.</th>
                <th className="px-3 py-3 text-left font-semibold">Public-Link</th>
              </tr>
            </thead>
            <tbody>
              {items.map((lp: any) => {
                const ab = abStats(lp);
                return (
                  <tr key={lp.id} className="border-t hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <Link href={`/admin/content/landingpages/${lp.id}`} className="font-semibold text-navy hover:text-brand">
                        {lp.internal_name || '(ohne Name)'}
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">/lp/{lp.slug}</td>
                    <td className="px-3 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${STATUS_COLOR[lp.status] || 'bg-slate-100 text-slate-600'}`}>
                        {lp.status || 'draft'}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      {lp.ab_test_active ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-purple-100 text-purple-800">aktiv</span>
                      ) : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-3 py-3 text-right font-mono">{ab.views.total || '—'}</td>
                    <td className="px-3 py-3 text-right font-mono">{ab.conversions.total || '—'}</td>
                    <td className="px-3 py-3">
                      {lp.status === 'live' && lp.slug && (
                        <a href={`https://marketing.kuiper-safety.de/lp/${lp.slug}`} target="_blank" className="text-xs text-brand hover:underline font-mono">
                          /lp/{lp.slug} ↗
                        </a>
                      )}
                    </td>
                  </tr>
                );
              })}
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
