'use client';
/**
 * LpWizard — Neue Landingpage anlegen.
 *
 * Felder (alle PB-required + zwei SEO-Felder):
 *  - internal_name
 *  - slug (auto-generated aus name, editierbar)
 *  - template_id (Default 'bsh' bzw. 'default')
 *  - status (draft|live, Default draft)
 *  - seo_title (optional)
 *  - seo_description (optional)
 *
 * "Mit BSH-Defaults füllen" Checkbox → content_json bekommt 14 BSH-Default-Sections
 * (sonst leeres sections-Array → User legt selbst im Editor an).
 *
 * Submit → POST /api/admin/lp/create → location.href = /admin/content/landingpages/[id]
 */
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { TextInput, TextareaInput } from './inputs';
import { generateBshDefaultSections } from '../sections/defaults';

/** Slug-Vorschlag aus Name. */
function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export default function LpWizard() {
  const router = useRouter();
  const [internalName, setInternalName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [templateId, setTemplateId] = useState('bsh');
  const [status, setStatus] = useState('draft');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [seedDefaults, setSeedDefaults] = useState(true);

  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Slug auto-fill aus internalName bis Bk slug manuell editiert hat
  useEffect(() => {
    if (!slugTouched) {
      setSlug(slugify(internalName));
    }
  }, [internalName, slugTouched]);

  const canSubmit = internalName.trim().length > 0 && slug.trim().length > 0 && !creating;

  async function handleCreate() {
    setCreating(true);
    setCreateError(null);
    try {
      const body: any = {
        internal_name: internalName.trim(),
        slug: slug.trim(),
        template_id: templateId,
        status,
        seo_title: seoTitle.trim() || undefined,
        seo_description: seoDescription.trim() || undefined,
        content_json: seedDefaults
          ? { sections: generateBshDefaultSections() }
          : { sections: [] },
      };
      const res = await fetch('/api/admin/lp/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const txt = await res.text();
        setCreateError(`HTTP ${res.status}: ${txt.slice(0, 300)}`);
        return;
      }
      const d = await res.json();
      if (d.id) {
        router.push(`/admin/content/landingpages/${d.id}`);
      } else {
        setCreateError('Antwort ohne ID');
      }
    } catch (e: any) {
      setCreateError(e?.message || 'Anlegen fehlgeschlagen');
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/content/landingpages" className="text-slate-500 hover:text-brand">← Zurück</Link>
        <h1 className="text-3xl font-extrabold">🎨 Neue Landingpage</h1>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-1">
        <TextInput
          label="Interner Name *"
          value={internalName}
          onChange={setInternalName}
          placeholder="z.B. Brandschutzhelfer Bundesweit Q3"
        />

        <TextInput
          label="Slug *"
          value={slug}
          onChange={v => { setSlug(v); setSlugTouched(true); }}
          placeholder="brandschutzhelfer-bundesweit-q3"
          hint={`URL: marketing.kuiper-safety.de/lp/${slug || '<slug>'}`}
        />

        <label className="block mb-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Template</span>
          <select
            value={templateId}
            onChange={e => setTemplateId(e.target.value)}
            className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-brand"
          >
            <option value="bsh">BSH (Brandschutzhelfer-Pattern)</option>
            <option value="default">Default (leerer Start)</option>
          </select>
          <span className="text-[11px] text-slate-500 mt-1 block">Bestimmt Default-Sections + Form-Felder.</span>
        </label>

        <label className="block mb-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Status</span>
          <select
            value={status}
            onChange={e => setStatus(e.target.value)}
            className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-brand"
          >
            <option value="draft">Draft (nur Editor sichtbar)</option>
            <option value="live">Live (Public-Route aktiv)</option>
          </select>
        </label>

        <hr className="my-4" />
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">SEO (optional)</h3>

        <TextInput
          label="Meta-Title"
          value={seoTitle}
          onChange={setSeoTitle}
          placeholder="z.B. Brandschutzhelfer Ausbildung – Kuiper Brandschutz"
          hint={`${seoTitle.length}/60 Zeichen empfohlen`}
        />
        <TextareaInput
          label="Meta-Description"
          value={seoDescription}
          onChange={setSeoDescription}
          rows={3}
          placeholder="Direkt bei Ihnen im Unternehmen. Inkl. Zertifikat …"
          hint={`${seoDescription.length}/160 Zeichen empfohlen`}
        />

        <hr className="my-4" />

        <label className="flex items-start gap-2 mb-4 cursor-pointer">
          <input
            type="checkbox"
            checked={seedDefaults}
            onChange={e => setSeedDefaults(e.target.checked)}
            className="mt-0.5"
          />
          <span className="text-sm">
            <span className="font-bold">Mit 14 BSH-Default-Sections vorbefüllen</span>
            <span className="block text-xs text-slate-500">Hero · Usps · Story · Member · Testi · ProvenExpert · Steps · Content · Hybrid · Team · Loc · Faq · Final · Open</span>
          </span>
        </label>

        {createError && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-900 text-sm font-mono whitespace-pre-wrap">{createError}</div>
        )}

        <div className="flex items-center justify-between">
          <Link href="/admin/content/landingpages" className="text-sm text-slate-500 hover:text-slate-700">
            Abbrechen
          </Link>
          <button
            type="button"
            onClick={handleCreate}
            disabled={!canSubmit}
            className="px-5 py-2 bg-brand text-navy rounded-lg font-bold hover:bg-brand-light transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {creating ? 'Wird angelegt …' : 'Landingpage anlegen →'}
          </button>
        </div>
      </div>
    </div>
  );
}
