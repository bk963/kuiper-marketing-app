'use client';
/**
 * InlineEditor — ClickFunnels-Style Live-Edit-Mode für LPs.
 *
 * Architektur:
 *  - Rendert SectionRenderer (= 1:1 zur Apex-LP) im Admin-Context
 *  - Jede Section wird in <SectionEditFrame> wrapped → Hover-Outline + Toolbar
 *  - Text-Felder bekommen contenteditable=true mit onBlur → patchSectionConfig
 *  - State-Verwaltung lokal (currentSections), Save schickt komplettes content_json
 *
 * Phase 1 (heute):
 *  - Foundation: render + Section-Hover-Outline
 *  - Inline-Text-Edit für sichtbare Texte (Headlines, Subtexte, CTAs)
 *  - Manuelle Save-Button + Dirty-Indicator
 *
 * Folge-Phasen:
 *  - 2 Auto-Save-Debounce
 *  - 3 Section-Toolbar (Up/Down/Dup/Delete) on hover
 *  - 4 Add-Section-Insert-Button zwischen Sections
 *  - 5 Drag-Reorder
 *  - 6 Inline-Image-Upload
 *  - 7 Settings-Sidebar für non-inline Configs
 */
import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import Link from 'next/link';
import type { BshSection, BshSectionType } from '../sections/types';
import { SECTION_COMPONENTS } from '../sections/registry';
import LpFrame from '../LpFrame';

const STATUS_COLOR: Record<string, string> = {
  live: 'bg-emerald-100 text-emerald-800',
  draft: 'bg-amber-100 text-amber-800',
  archived: 'bg-slate-100 text-slate-600',
};

export default function InlineEditor({ lp: initialLp }: { lp: any }) {
  const [lp] = useState(initialLp);
  const initialContent = useMemo(() => initialLp.content_json || {}, [initialLp]);
  const initialSections = useMemo<BshSection[]>(
    () => (Array.isArray(initialContent.sections) ? initialContent.sections : []),
    [initialContent]
  );

  const [sections, setSections] = useState<BshSection[]>(initialSections);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  // dirty-Detection
  useEffect(() => {
    setDirty(JSON.stringify(sections) !== JSON.stringify(initialSections));
  }, [sections, initialSections]);

  /** Section-Config-Patch via path-pfeil */
  const patchSectionConfig = useCallback((sectionId: string, key: string, value: any) => {
    setSections(prev => prev.map(s => {
      if (s.id !== sectionId) return s;
      return { ...s, config: { ...s.config, [key]: value } };
    }));
  }, []);

  async function handleSave() {
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch(`/api/admin/lp/${lp.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content_json: { ...initialContent, sections },
        }),
      });
      if (!res.ok) {
        const txt = await res.text();
        setSaveError(`HTTP ${res.status}: ${txt.slice(0, 200)}`);
        return;
      }
      setDirty(false);
      setLastSavedAt(new Date());
    } catch (e: any) {
      setSaveError(e?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="inline-editor-root">
      {/* Top-Bar */}
      <div className="sticky top-0 z-40 bg-white border-b border-slate-200 px-5 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <Link href="/admin/content/landingpages" className="text-slate-500 hover:text-brand text-sm">← Zurück</Link>
          <h1 className="text-xl font-extrabold">🎨 {lp.internal_name || lp.slug}</h1>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${STATUS_COLOR[lp.status] || 'bg-slate-100 text-slate-600'}`}>
            {lp.status || 'draft'}
          </span>
          {dirty && <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-amber-100 text-amber-800">Ungespeichert</span>}
          <span className="text-[11px] text-slate-500">{sections.length} Sections · Inline-Edit-Mode</span>
        </div>
        <div className="flex items-center gap-2">
          {lastSavedAt && !dirty && (
            <span className="text-xs text-slate-500">Gespeichert {lastSavedAt.toLocaleTimeString('de-DE')}</span>
          )}
          {saveError && <span className="text-xs text-red-600 font-mono max-w-md truncate">{saveError}</span>}
          {lp.status === 'live' && lp.slug && (
            <a href={`https://kuiper-safety.de/lp/${lp.slug}`} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg font-bold hover:bg-slate-200 transition text-xs">
              Live ↗
            </a>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={!dirty || saving}
            className="px-4 py-1.5 bg-brand text-navy rounded-lg font-bold hover:bg-brand-light transition text-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saving ? 'Speichert …' : 'Speichern'}
          </button>
        </div>
      </div>

      {/* Edit-Hint-Banner */}
      <div className="px-5 py-2 bg-brand/5 border-b border-brand/20 text-xs text-slate-700">
        💡 Klick auf Text um zu editieren · Tab/Enter um zu speichern · Section-Toolbar (Folge-Phase)
      </div>

      {/* Live-Rendered LP mit Edit-Wrappern */}
      <div className="inline-editor-canvas">
        <LpFrame>
          {sections.map((s, i) => (
            <SectionEditFrame
              key={s.id}
              section={s}
              index={i}
              total={sections.length}
              onPatchConfig={(k, v) => patchSectionConfig(s.id, k, v)}
            />
          ))}
        </LpFrame>
      </div>

      <style jsx global>{`
        .inline-editor-canvas section[data-edit-section] {
          position: relative;
          transition: outline 0.15s;
        }
        .inline-editor-canvas section[data-edit-section]:hover {
          outline: 2px dashed rgb(48, 196, 237);
          outline-offset: -2px;
        }
        .inline-editor-canvas section[data-edit-section]::before {
          content: attr(data-section-type);
          position: absolute;
          top: 0;
          left: 0;
          background: rgb(48, 196, 237);
          color: rgb(11, 26, 77);
          font-family: 'DM Sans', sans-serif;
          font-weight: 700;
          font-size: 10px;
          padding: 4px 10px;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          z-index: 10;
          opacity: 0;
          transition: opacity 0.15s;
          pointer-events: none;
        }
        .inline-editor-canvas section[data-edit-section]:hover::before {
          opacity: 1;
        }
        .inline-editor-canvas [data-inline-edit] {
          outline: 1px dashed transparent;
          transition: outline 0.15s, background 0.15s;
          cursor: text;
        }
        .inline-editor-canvas [data-inline-edit]:hover {
          outline-color: rgba(48, 196, 237, 0.4);
          background: rgba(48, 196, 237, 0.05);
        }
        .inline-editor-canvas [data-inline-edit]:focus {
          outline: 2px solid rgb(48, 196, 237);
          background: rgba(48, 196, 237, 0.1);
        }
      `}</style>
    </div>
  );
}

/**
 * SectionEditFrame — wrapped um eine Section, fügt Edit-Mode-Attrs hinzu.
 *
 * Statt SECTION_COMPONENTS direkt zu rendern, rendern wir den Section-Component
 * mit gepatchtem config-Object dessen Felder via Inline-Edit verändert werden.
 * Für jetzt einfaches Pattern: TextInlineWrappers proxien spezifische Configs
 * an die Section-Components.
 */
function SectionEditFrame({
  section,
  index,
  total,
  onPatchConfig,
}: {
  section: BshSection;
  index: number;
  total: number;
  onPatchConfig: (key: string, value: any) => void;
}) {
  void index; void total;
  const Comp = SECTION_COMPONENTS[section.type as BshSectionType];
  if (!Comp) {
    return (
      <div data-edit-section data-section-type={section.type} className="bg-amber-50 border border-amber-200 p-4 text-amber-900 text-sm">
        ⚠️ Unbekannte Section: <code>{section.type}</code>
      </div>
    );
  }

  // Wrappe Config mit Inline-Edit-Proxy-Strings
  // Sehr simple Strategie: rendere zuerst Section, dann patche per useEffect ContentEditable-Marker
  // Phase 1 nutzt einfacheres Pattern — Section-Component mit modified-config das Edit-Marker enthält
  return (
    <div data-edit-section data-section-type={section.type} data-section-id={section.id}>
      <InlineConfigProxy section={section} onPatchConfig={onPatchConfig}>
        <Comp config={section.config} lpId={section.id} />
      </InlineConfigProxy>
    </div>
  );
}

/**
 * InlineConfigProxy — durchsucht children-DOM nach Section-Text-Inhalten,
 * markiert sie als data-inline-edit + contenteditable.
 *
 * Phase 1: post-mount-Mutation. DOM-Hack aber pragmatisch.
 * Phase 2 (besser): Section-Components selbst rendern Inline-Edit-Spans.
 */
function InlineConfigProxy({
  section,
  onPatchConfig,
  children,
}: {
  section: BshSection;
  onPatchConfig: (key: string, value: any) => void;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    // Map: CSS-Selector → config-key
    // Diese Patterns basieren auf den BSH-Section-Klassen.
    const TEXT_MAPS: { selector: string; key: string }[] = [
      { selector: '.kf-bsh-hero__eyebrow', key: 'eyebrow' },
      { selector: '.kf-bsh-hero__headline', key: 'headlinePre' },
      { selector: '.kf-bsh-hero__accent', key: 'headlineAccent' },
      { selector: '.kf-bsh-hero__subline', key: 'subline' },
      { selector: '.kf-bsh-usps__eyebrow', key: 'eyebrow' },
      { selector: '.kf-bsh-usps__headline', key: 'headline' },
      { selector: '.kf-bsh-story__headline', key: 'headlinePre' },
      { selector: '.kf-bsh-testi__eyebrow', key: 'eyebrow' },
      { selector: '.kf-bsh-testi__headline', key: 'headline' },
      { selector: '.kf-bsh-steps__eyebrow', key: 'eyebrow' },
      { selector: '.kf-bsh-steps__headline', key: 'headlinePre' },
      { selector: '.kf-bsh-content__headline', key: 'headline' },
      { selector: '.kf-bsh-hybrid__eyebrow', key: 'eyebrow' },
      { selector: '.kf-bsh-hybrid__headline', key: 'headlinePre' },
      { selector: '.kf-bsh-team__eyebrow', key: 'eyebrow' },
      { selector: '.kf-bsh-team__headline', key: 'headline' },
      { selector: '.kf-bsh-loc__eyebrow', key: 'eyebrow' },
      { selector: '.kf-bsh-faq__eyebrow', key: 'eyebrow' },
      { selector: '.kf-bsh-final__eyebrow', key: 'eyebrow' },
      { selector: '.kf-bsh-open__eyebrow', key: 'eyebrow' },
      { selector: '.kf-bsh-open__headline', key: 'headline' },
    ];

    const cleanups: Array<() => void> = [];

    for (const { selector, key } of TEXT_MAPS) {
      const el = root.querySelector(selector) as HTMLElement | null;
      if (!el) continue;
      // Skip wenn schon initialized (id-marker)
      if (el.dataset.inlineEdit === key) continue;
      el.dataset.inlineEdit = key;
      el.setAttribute('contenteditable', 'true');
      el.setAttribute('spellcheck', 'false');

      const onBlur = () => {
        const newVal = el.textContent || '';
        if (newVal !== section.config[key]) {
          onPatchConfig(key, newVal);
        }
      };
      const onKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          el.blur();
        }
      };
      el.addEventListener('blur', onBlur);
      el.addEventListener('keydown', onKeyDown);
      cleanups.push(() => {
        el.removeEventListener('blur', onBlur);
        el.removeEventListener('keydown', onKeyDown);
      });
    }

    return () => cleanups.forEach(fn => fn());
  }, [section.config, onPatchConfig]);

  return <div ref={ref}>{children}</div>;
}
