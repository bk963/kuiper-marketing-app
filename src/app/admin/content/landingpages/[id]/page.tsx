import { requireAdmin } from '@/lib/admin-auth';
import { getLandingpage, abStats } from '@/lib/mkt-lp';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

const STATUS_COLOR: Record<string, string> = {
  live: 'bg-emerald-100 text-emerald-800',
  draft: 'bg-amber-100 text-amber-800',
  archived: 'bg-slate-100 text-slate-600',
};

export default async function LandingpageEditor({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const lp = await getLandingpage(id);
  if (!lp) notFound();

  const ab = abStats(lp);
  const content = lp.content_json || {};
  const sections = Array.isArray(content.sections) ? content.sections : [];

  return (
    <div className="max-w-7xl">
      <div className="flex items-baseline justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/admin/content/landingpages" className="text-slate-500 hover:text-brand">← Zurück</Link>
          <h1 className="text-3xl font-extrabold">🎨 {lp.internal_name || '(ohne Name)'}</h1>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${STATUS_COLOR[lp.status] || 'bg-slate-100 text-slate-600'}`}>
            {lp.status || 'draft'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {lp.status === 'live' && (
            <a href={`https://marketing.kuiper-safety.de/lp/${lp.slug}`} target="_blank" className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-bold hover:bg-slate-200 transition text-sm">
              Live ansehen ↗
            </a>
          )}
          <button className="px-4 py-2 bg-brand text-navy rounded-lg font-bold hover:bg-brand-light transition text-sm">
            Speichern
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Section-Editor (links, 2/3) */}
        <div className="lg:col-span-2">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3">Sections ({sections.length})</h2>
          <div className="bg-white rounded-xl border p-6">
            {sections.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-sm">
                <div className="text-3xl mb-2">📐</div>
                Noch keine Sections — Section-Editor wird im Sub-Sprint 3d gebaut.
                <div className="text-xs text-slate-400 mt-2">
                  Section-Types: Hero, Trust, Features, CTA, FAQ, Form, Testimonials, Pricing
                </div>
              </div>
            ) : (
              <ul className="space-y-2">
                {sections.map((s: any, i: number) => (
                  <li key={s.id || i} className="p-3 bg-slate-50 rounded-lg flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-sm">{s.type || 'unknown'}</div>
                      <div className="text-xs text-slate-500 font-mono">{s.id || '—'}</div>
                    </div>
                    <span className="text-xs text-slate-400">{i + 1}/{sections.length}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Sidebar: Settings + A/B-Stats (rechts, 1/3) */}
        <aside className="space-y-4">
          {/* Settings */}
          <div className="bg-white rounded-xl border p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Settings</h3>
            <dl className="text-sm space-y-2">
              <div className="flex justify-between">
                <dt className="text-slate-500">Slug</dt>
                <dd className="font-mono">{lp.slug}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Template</dt>
                <dd className="font-mono text-xs">{lp.template_id || '—'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Form</dt>
                <dd className="font-mono text-xs">{lp.form_id || lp.linked_form_id || lp.formular || '—'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Campaign</dt>
                <dd className="font-mono text-xs">{lp.campaign_id || '—'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Veröffentlicht</dt>
                <dd className="text-xs">{lp.published_at ? new Date(lp.published_at).toLocaleDateString('de-DE') : '—'}</dd>
              </div>
            </dl>
          </div>

          {/* SEO */}
          <div className="bg-white rounded-xl border p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">SEO</h3>
            <dl className="text-sm space-y-2">
              <div>
                <dt className="text-slate-500 text-xs">Meta-Title</dt>
                <dd className="font-mono text-xs truncate">{lp.seo_title || '—'}</dd>
              </div>
              <div>
                <dt className="text-slate-500 text-xs">Meta-Description</dt>
                <dd className="text-xs line-clamp-2">{lp.seo_description || '—'}</dd>
              </div>
            </dl>
          </div>

          {/* A/B-Test Stats */}
          {lp.ab_test_active && (
            <div className="bg-purple-50 rounded-xl border border-purple-200 p-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-purple-800 mb-3">A/B-Test aktiv</h3>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <div className="font-semibold text-slate-600">Variant A</div>
                  <div className="font-mono mt-1">{ab.views.a} Views</div>
                  <div className="font-mono">{ab.conversions.a} Conv.</div>
                  <div className="font-mono text-purple-700">{(ab.rate.a * 100).toFixed(2)}%</div>
                </div>
                <div>
                  <div className="font-semibold text-slate-600">Variant B</div>
                  <div className="font-mono mt-1">{ab.views.b} Views</div>
                  <div className="font-mono">{ab.conversions.b} Conv.</div>
                  <div className="font-mono text-purple-700">{(ab.rate.b * 100).toFixed(2)}%</div>
                </div>
              </div>
              {ab.lift !== 0 && (
                <div className="text-xs text-slate-600 mt-3 pt-3 border-t border-purple-200">
                  Lift Variant B: <span className={`font-bold ${ab.lift > 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {ab.lift > 0 ? '+' : ''}{(ab.lift * 100).toFixed(1)}%
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Stub-Hinweis */}
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
            <strong>Sub-Sprint 3d</strong>: Section-Editor mit Drag-Drop, 8 Section-Types, Config-Panel, Live-Preview kommt nächste Phase.
          </div>
        </aside>
      </div>
    </div>
  );
}
