/**
 * Blog-Pillar-Page-Detail-View. Read-only.
 *
 * Edit-Link auf blog.kuiper-safety.de/admin (Folge-Sprint: eigener Editor).
 */
import { requireAdmin } from '@/lib/admin-auth';
import { pbGet } from '@/lib/pb-server';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function PillarDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const p = await pbGet('mkt_blog_pillar_pages', id);
  if (!p) notFound();

  return (
    <div className="max-w-4xl">
      <div className="flex items-baseline justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/admin/content/blog/pillars" className="text-slate-500 hover:text-brand">← Pillars</Link>
          <h1 className="text-2xl font-extrabold leading-tight">{p.title || p.slug || '(ohne Titel)'}</h1>
        </div>
        <a
          href={`https://blog.kuiper-safety.de/admin/pillars/${id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1.5 bg-brand text-navy rounded-lg font-bold hover:bg-brand-light transition text-xs"
        >
          Im Blog-CMS bearbeiten ↗
        </a>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {p.description && (
            <div className="bg-white rounded-xl border p-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Beschreibung</h3>
              <p className="text-sm text-slate-700">{p.description}</p>
            </div>
          )}
          {p.content && (
            <div className="bg-white rounded-xl border p-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Content-Preview</h3>
              <div
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: String(p.content).slice(0, 5000) }}
              />
            </div>
          )}
        </div>

        <aside className="space-y-4">
          <div className="bg-white rounded-xl border p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Stammdaten</h3>
            <dl className="text-sm space-y-2">
              <Row label="Slug" value={p.slug} mono />
              <Row label="Focus-Keyword" value={p.focus_keyword} />
              <Row label="Hub-Articles" value={String((p.articles || []).length || 0)} />
            </dl>
          </div>
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
            Editor läuft im Blog-CMS auf <a href="https://blog.kuiper-safety.de/admin" target="_blank" rel="noopener noreferrer" className="underline">blog.kuiper-safety.de/admin</a>.
          </div>
        </aside>
      </div>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value?: any; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-2">
      <dt className="text-slate-500 shrink-0">{label}</dt>
      <dd className={`${mono ? 'font-mono' : ''} truncate text-right`}>{value || '—'}</dd>
    </div>
  );
}
