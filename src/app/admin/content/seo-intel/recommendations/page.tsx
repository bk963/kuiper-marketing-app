import { requireAdmin } from '@/lib/admin-auth';
import { mktSeo } from '@/lib/mkt-seo';

export const dynamic = 'force-dynamic';

const KIND_LABEL: Record<string, string> = {
  new_article: '✨ Neuer Artikel',
  optimize_article: '🛠️ Artikel optimieren',
  internal_link: '🔗 Internal-Link',
  expand_content: '📝 Inhalt erweitern',
  fix_meta: '🏷️ Meta korrigieren',
  add_faq: '❓ FAQ ergänzen',
};

const PRIORITY_COLOR: Record<string, string> = {
  critical: 'bg-rose-100 text-rose-800 border-rose-200',
  high: 'bg-amber-100 text-amber-800 border-amber-200',
  medium: 'bg-blue-100 text-blue-800 border-blue-200',
  low: 'bg-slate-100 text-slate-700 border-slate-200',
};

const STATUS_COLOR: Record<string, string> = {
  open: 'bg-amber-100 text-amber-800',
  in_progress: 'bg-blue-100 text-blue-800',
  done: 'bg-emerald-100 text-emerald-800',
  dismissed: 'bg-slate-100 text-slate-600',
};

const SOURCE_BADGE: Record<string, string> = {
  ai: '🤖',
  rule_engine: '⚙️',
  manual: '✋',
};

export default async function RecommendationsPage() {
  await requireAdmin();
  const { items, error } = await mktSeo.recommendations({
    perPage: 200, sort: '-created',
    fields: 'id,title,kind,priority,reason,article_id,keyword_id,status,generated_by,created',
  });

  return (
    <div className="max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold">💡 SEO-Empfehlungen</h1>
        <p className="text-slate-600 text-sm mt-1">{items.length} Empfehlungen · Sort: zuletzt generiert ↓</p>
      </div>

      {error && (
        <div className="mb-4 p-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-sm">{error}</div>
      )}

      {!error && !items.length && (
        <div className="p-8 rounded-lg bg-slate-100 text-slate-600 text-center">
          Noch keine Empfehlungen — KI-Engine wird im Sub-Sprint angebunden (Claude API + Rule-Engine).
        </div>
      )}

      {items.length > 0 && (
        <div className="space-y-3">
          {items.map((r: any) => (
            <div key={r.id} className={`p-4 bg-white rounded-xl border ${r.priority ? 'border-l-4' : ''} ${r.priority === 'critical' ? 'border-l-rose-500' : r.priority === 'high' ? 'border-l-amber-500' : r.priority === 'medium' ? 'border-l-blue-500' : 'border-l-slate-300'}`}>
              <div className="flex items-start justify-between mb-2">
                <div className="font-bold text-base flex items-center gap-2">
                  <span className="text-sm">{SOURCE_BADGE[r.generated_by] || '•'}</span>
                  {r.title}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${PRIORITY_COLOR[r.priority] || 'bg-slate-100'}`}>
                    {r.priority || 'low'}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${STATUS_COLOR[r.status] || 'bg-slate-100'}`}>
                    {r.status || 'open'}
                  </span>
                </div>
              </div>
              <div className="text-sm text-slate-600 mb-2">
                {KIND_LABEL[r.kind] || r.kind || '—'}
              </div>
              {r.reason && (
                <div className="text-sm text-slate-700 line-clamp-3">{typeof r.reason === 'string' ? r.reason : JSON.stringify(r.reason).slice(0, 200)}</div>
              )}
              <div className="text-xs text-slate-400 mt-2 flex gap-3">
                {r.article_id && <span>Artikel: {r.article_id.slice(0, 8)}</span>}
                {r.keyword_id && <span>KW: {r.keyword_id.slice(0, 8)}</span>}
                {r.created && <span>{new Date(r.created).toLocaleDateString('de-DE')}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
