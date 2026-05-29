import { requireAdmin } from '@/lib/admin-auth';
import { mktBlogCounts } from '@/lib/mkt-blog';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

const TILES = [
  { title: 'Artikel', desc: 'Alle Blog-Artikel verwalten', icon: '📝', path: '/admin/content/blog/articles', countFn: 'articles' as const },
  { title: 'Kategorien', desc: 'Brandschutz / Arbeitsschutz / Gesundheitsschutz', icon: '🏷️', path: '/admin/content/blog/categories', countFn: 'categories' as const },
  { title: 'Pillar-Seiten', desc: 'Hauptthemen-Hub-Pages', icon: '🏛️', path: '/admin/content/blog/pillars', countFn: 'pillars' as const },
  { title: 'Content-Planung', desc: 'Redaktionsplan + Status', icon: '📅', path: '/admin/content/blog/content-plan' },
  { title: 'KI-Generator', desc: 'Claude → fertige Artikel', icon: '✨', path: '/admin/content/blog/ai-generator' },
  { title: 'Medien', desc: 'Bibliothek für Bilder', icon: '🖼️', path: '/admin/content/blog/media', countFn: 'media' as const },
  { title: 'Interne Verlinkung', desc: 'Cross-Article-Anchor-Verwaltung', icon: '🔗', path: '/admin/content/blog/internal-links', countFn: 'internalLinks' as const },
];

export default async function BlogHub() {
  await requireAdmin();
  const counts: Record<string, number> = {};
  for (const t of TILES) {
    if (t.countFn) counts[t.countFn] = await mktBlogCounts[t.countFn]();
  }
  const totalArticles = counts.articles ?? 0;
  const totalPub = await mktBlogCounts.articlesPublished();
  const totalDraft = await mktBlogCounts.articlesDraft();

  return (
    <div className="max-w-7xl">
      <div className="flex items-baseline justify-between mb-2">
        <h1 className="text-3xl font-extrabold">📰 Blog</h1>
        <div className="text-xs text-slate-500">Marketing-App · Phase 2.0b</div>
      </div>
      <p className="text-slate-600 mb-6">Content-Erstellung, Pillar-Struktur, KI-Unterstützung.</p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
        <Stat label="Artikel total" value={totalArticles} />
        <Stat label="Veröffentlicht" value={totalPub} hint="status=published" />
        <Stat label="Drafts" value={totalDraft} hint="status=draft" />
        <Stat label="Interne Links" value={counts.internalLinks ?? 0} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {TILES.map(t => (
          <Link key={t.path} href={t.path} className="block p-6 bg-white rounded-xl border hover:shadow-md hover:border-brand transition">
            <div className="text-2xl mb-2">{t.icon}</div>
            <div className="font-bold text-lg mb-1 flex items-center gap-2">
              {t.title}
              {t.countFn && (
                <span className="text-xs font-normal text-slate-500">({counts[t.countFn] ?? 0})</span>
              )}
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
