/**
 * Blog-Article-Detail-View.
 *
 * Read-only Anzeige der mkt_blog_articles. Edit-Button verweist auf
 * blog.kuiper-safety.de/admin (das CMS Stage 1 — TipTap-Editor existiert dort).
 *
 * Im Folge-Sprint kann hier ein eigener Editor angedockt werden.
 */
import { requireAdmin } from '@/lib/admin-auth';
import { getArticle } from '@/lib/mkt-blog';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

const STATUS_COLOR: Record<string, string> = {
  published: 'bg-emerald-100 text-emerald-800',
  draft: 'bg-amber-100 text-amber-800',
  archived: 'bg-slate-100 text-slate-600',
  review: 'bg-blue-100 text-blue-800',
};

export default async function ArticleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const a = await getArticle(id);
  if (!a) notFound();

  return (
    <div className="max-w-4xl">
      <div className="flex items-baseline justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/admin/content/blog/articles" className="text-slate-500 hover:text-brand">← Artikel</Link>
          <h1 className="text-2xl font-extrabold leading-tight">{a.title || '(ohne Titel)'}</h1>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${STATUS_COLOR[a.status] || 'bg-slate-100 text-slate-600'}`}>
            {a.status || '—'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {a.slug && (
            <a href={`https://blog.kuiper-safety.de/${a.slug}`} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg font-bold hover:bg-slate-200 transition text-xs">
              Live ↗
            </a>
          )}
          <a href={`https://blog.kuiper-safety.de/admin/articles/${id}`} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 bg-brand text-navy rounded-lg font-bold hover:bg-brand-light transition text-xs">
            Im Blog-CMS bearbeiten ↗
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border p-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Excerpt</h3>
            <p className="text-sm text-slate-700">{a.excerpt || <em className="text-slate-400">kein Excerpt</em>}</p>
          </div>

          <div className="bg-white rounded-xl border p-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Content-Preview</h3>
            {a.content ? (
              <div
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: String(a.content).slice(0, 5000) }}
              />
            ) : (
              <em className="text-slate-400 text-sm">kein Content</em>
            )}
            {a.content && String(a.content).length > 5000 && (
              <p className="text-xs text-slate-500 mt-3 italic">… gekürzt. Vollständig im Blog-CMS bearbeiten.</p>
            )}
          </div>
        </div>

        <aside className="space-y-4">
          <div className="bg-white rounded-xl border p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Stammdaten</h3>
            <dl className="text-sm space-y-2">
              <Row label="Slug" value={a.slug} mono />
              <Row label="Author" value={a.author} />
              <Row label="Kategorie" value={a.category_id} mono small />
              <Row label="Pillar" value={a.pillar_id} mono small />
              <Row label="Source" value={a.source} />
              <Row label="Veröffentlicht" value={a.published_at ? new Date(a.published_at).toLocaleDateString('de-DE') : '—'} />
              <Row label="Wörter" value={String(a.word_count || 0)} />
              <Row label="Lesezeit" value={a.reading_time_min ? `${a.reading_time_min} min` : '—'} />
              <Row label="SEO-Score" value={String(a.seo_score || 0)} />
            </dl>
          </div>

          <div className="bg-white rounded-xl border p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">SEO</h3>
            <dl className="text-sm space-y-2">
              <Row label="Meta-Title" value={a.meta_title} small />
              <Row label="Focus-Keyword" value={a.focus_keyword} />
            </dl>
            {a.meta_description && (
              <div className="mt-3 text-xs text-slate-600 line-clamp-3">{a.meta_description}</div>
            )}
          </div>

          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
            <strong>Read-only-View</strong> — Editor läuft im Blog-CMS auf <a href="https://blog.kuiper-safety.de/admin" target="_blank" rel="noopener noreferrer" className="underline">blog.kuiper-safety.de/admin</a>.
          </div>
        </aside>
      </div>
    </div>
  );
}

function Row({ label, value, mono, small }: { label: string; value?: any; mono?: boolean; small?: boolean }) {
  const v = value || '—';
  return (
    <div className="flex justify-between gap-2">
      <dt className="text-slate-500 shrink-0">{label}</dt>
      <dd className={[mono ? 'font-mono' : '', small ? 'text-xs' : '', 'truncate text-right'].join(' ')}>{v}</dd>
    </div>
  );
}
