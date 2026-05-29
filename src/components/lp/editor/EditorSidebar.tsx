'use client';
/**
 * EditorSidebar — rechte Spalte im Editor.
 *
 * Enthält:
 *  - Settings (read-only: slug, template, form, campaign, published_at)
 *  - SEO-Form (seo_title, seo_description)
 *  - A/B-Stats wenn aktiv
 */
import { TextInput, TextareaInput } from './inputs';

type AbStatsShape = {
  views: { a: number; b: number; total: number };
  conversions: { a: number; b: number; total: number };
  rate: { a: number; b: number };
  lift: number;
  winner: string;
};

export default function EditorSidebar({
  lp,
  ab,
  seoTitle,
  seoDescription,
  onSeoTitleChange,
  onSeoDescriptionChange,
}: {
  lp: any;
  ab: AbStatsShape;
  seoTitle: string;
  seoDescription: string;
  onSeoTitleChange: (v: string) => void;
  onSeoDescriptionChange: (v: string) => void;
}) {
  return (
    <aside className="space-y-4">
      {/* Settings */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Settings</h3>
        <dl className="text-sm space-y-2">
          <Row label="Slug" value={lp.slug || '—'} mono />
          <Row label="Template" value={lp.template_id || '—'} mono small />
          <Row label="Form" value={lp.form_id || lp.linked_form_id || lp.formular || '—'} mono small />
          <Row label="Campaign" value={lp.campaign_id || '—'} mono small />
          <Row
            label="Veröffentlicht"
            value={lp.published_at ? new Date(lp.published_at).toLocaleDateString('de-DE') : '—'}
            small
          />
        </dl>
      </div>

      {/* SEO */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">SEO</h3>
        <TextInput
          label="Meta-Title"
          value={seoTitle}
          onChange={onSeoTitleChange}
          placeholder="Brandschutzhelfer Ausbildung ..."
          hint={`${seoTitle.length}/60 Zeichen empfohlen`}
        />
        <TextareaInput
          label="Meta-Description"
          value={seoDescription}
          onChange={onSeoDescriptionChange}
          placeholder="Brandschutzhelfer Ausbildung bundesweit ..."
          rows={3}
          hint={`${seoDescription.length}/160 Zeichen empfohlen`}
        />
      </div>

      {/* A/B-Stats */}
      {lp.ab_test_active && (
        <div className="bg-purple-50 rounded-xl border border-purple-200 p-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-purple-800 mb-3">A/B-Test aktiv</h3>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <Variant label="Variant A" views={ab.views.a} convs={ab.conversions.a} rate={ab.rate.a} />
            <Variant label="Variant B" views={ab.views.b} convs={ab.conversions.b} rate={ab.rate.b} />
          </div>
          {ab.lift !== 0 && (
            <div className="text-xs text-slate-600 mt-3 pt-3 border-t border-purple-200">
              Lift Variant B:{' '}
              <span className={`font-bold ${ab.lift > 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                {ab.lift > 0 ? '+' : ''}
                {(ab.lift * 100).toFixed(1)}%
              </span>
            </div>
          )}
        </div>
      )}

      <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900">
        <strong>3d-3 LIVE</strong> — Section-Editor mit 14 BSH-Section-Types.
        A/B-UI kommt in 3f, Live-Preview-Pane in einem späteren Sprint.
      </div>
    </aside>
  );
}

function Row({ label, value, mono, small }: { label: string; value: string; mono?: boolean; small?: boolean }) {
  return (
    <div className="flex justify-between gap-2">
      <dt className="text-slate-500 shrink-0">{label}</dt>
      <dd className={[mono ? 'font-mono' : '', small ? 'text-xs' : '', 'truncate text-right'].join(' ')}>{value}</dd>
    </div>
  );
}

function Variant({ label, views, convs, rate }: { label: string; views: number; convs: number; rate: number }) {
  return (
    <div>
      <div className="font-semibold text-slate-600">{label}</div>
      <div className="font-mono mt-1">{views} Views</div>
      <div className="font-mono">{convs} Conv.</div>
      <div className="font-mono text-purple-700">{(rate * 100).toFixed(2)}%</div>
    </div>
  );
}
