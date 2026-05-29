import { requireAdmin } from '@/lib/admin-auth';
import { mktSeoCounts } from '@/lib/mkt-seo';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

const TILES = [
  { title: 'Keywords', desc: 'Volumen / Difficulty / Intent / Tracking', icon: '🔑', path: '/admin/content/seo-intel/keywords', count: 'keywords' as const },
  { title: 'Rankings', desc: 'Position-Verlauf pro Keyword (DataForSEO + GSC)', icon: '📈', path: '/admin/content/seo-intel/rankings', count: 'rankings' as const },
  { title: 'Wettbewerber', desc: 'Domains, Backlinks, DR, Overlap-Score', icon: '🥷', path: '/admin/content/seo-intel/competitors', count: 'competitors' as const },
  { title: 'Content-Gaps', desc: 'Fehlende Themen vs Wettbewerb', icon: '🕳️', path: '/admin/content/seo-intel/gaps' },
  { title: 'Empfehlungen', desc: 'KI-Vorschläge: neuer Artikel / FAQ / Internal-Link', icon: '💡', path: '/admin/content/seo-intel/recommendations', count: 'recommendations' as const },
  { title: 'OnPage-Audit', desc: 'Pro-Artikel-SEO-Score (Yoast-Style)', icon: '🛡️', path: '/admin/content/seo-intel/audit' },
];

export default async function SeoHub() {
  await requireAdmin();
  const counts = {
    keywords: await mktSeoCounts.keywords(),
    keywordsTracked: await mktSeoCounts.keywordsTracked(),
    rankings: await mktSeoCounts.rankings(),
    competitors: await mktSeoCounts.competitors(),
    competitorsTracked: await mktSeoCounts.competitorsTracked(),
    recommendations: await mktSeoCounts.recommendations(),
    recommendationsOpen: await mktSeoCounts.recommendationsOpen(),
  };

  return (
    <div className="max-w-7xl">
      <div className="flex items-baseline justify-between mb-2">
        <h1 className="text-3xl font-extrabold">🎯 SEO-Intelligence</h1>
        <div className="text-xs text-slate-500">Marketing-App · Phase 2.0c</div>
      </div>
      <p className="text-slate-600 mb-6">Keyword-Strategy + Ranking-Tracking + Wettbewerb + KI-Empfehlungen.</p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
        <Stat label="Keywords" value={counts.keywords} hint={`${counts.keywordsTracked} tracked`} />
        <Stat label="Rankings" value={counts.rankings} hint="History-Points" />
        <Stat label="Wettbewerber" value={counts.competitors} hint={`${counts.competitorsTracked} tracked`} />
        <Stat label="Empfehlungen" value={counts.recommendations} hint={`${counts.recommendationsOpen} offen`} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {TILES.map(t => (
          <Link key={t.path} href={t.path} className="block p-6 bg-white rounded-xl border hover:shadow-md hover:border-brand transition">
            <div className="text-2xl mb-2">{t.icon}</div>
            <div className="font-bold text-lg mb-1 flex items-center gap-2">
              {t.title}
              {t.count && <span className="text-xs font-normal text-slate-500">({counts[t.count] ?? 0})</span>}
            </div>
            <p className="text-sm text-slate-600">{t.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: number; hint?: string }) {
  return (
    <div className="p-5 bg-white rounded-xl border border-slate-200/70">
      <div className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">{label}</div>
      <div className="text-3xl font-extrabold mt-1">{value}</div>
      {hint && <div className="text-xs text-slate-500 mt-1">{hint}</div>}
    </div>
  );
}
