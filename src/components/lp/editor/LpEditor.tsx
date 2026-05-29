'use client';
/**
 * LpEditor — Haupt-Client-Component für /admin/content/landingpages/[id].
 *
 * State-Modell:
 *  - lp: LP-Record aus PB (initial)
 *  - sections: content_json.sections (lokal mutiert)
 *  - selectedSectionId: aktive Section im Config-Panel
 *  - dirty: ob ungespeicherte Änderungen
 *  - saving / saveError / lastSavedAt
 *
 * Save: PATCH /api/admin/lp/[id] mit { content_json: { sections } } (+ ggf. SEO-Felder)
 */
import { useState, useMemo, useCallback, useEffect } from 'react';
import Link from 'next/link';
import type { BshSection, BshSectionType } from '../sections/types';
import { BSH_SECTION_CATALOG, BSH_DEFAULT_CONFIGS } from '../sections/types';
import SectionList from './SectionList';
import SectionConfigPanel from './SectionConfigPanel';
import EditorSidebar from './EditorSidebar';

/** Lokale Variante von abStats (server-safe weil pure-function). */
function localAbStats(lp: any) {
  const va = Number(lp.ab_views_a || 0);
  const vb = Number(lp.ab_views_b || 0);
  const ca = Number(lp.ab_conversions_a || 0);
  const cb = Number(lp.ab_conversions_b || 0);
  return {
    views: { a: va, b: vb, total: va + vb },
    conversions: { a: ca, b: cb, total: ca + cb },
    rate: { a: va > 0 ? ca / va : 0, b: vb > 0 ? cb / vb : 0 },
    lift: vb > 0 && va > 0 ? ((cb / vb) / (ca / va) - 1) : 0,
    winner: ca / Math.max(va, 1) > cb / Math.max(vb, 1) ? 'a' : 'b',
  };
}

const STATUS_COLOR: Record<string, string> = {
  live: 'bg-emerald-100 text-emerald-800',
  draft: 'bg-amber-100 text-amber-800',
  archived: 'bg-slate-100 text-slate-600',
};

function uid(prefix = 'sec'): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export default function LpEditor({ lp: initialLp }: { lp: any }) {
  const [lp] = useState(initialLp);
  const initialContent = useMemo(() => initialLp.content_json || {}, [initialLp]);
  const initialSections = useMemo<BshSection[]>(
    () => (Array.isArray(initialContent.sections) ? initialContent.sections : []),
    [initialContent]
  );

  const [sections, setSections] = useState<BshSection[]>(initialSections);
  const [seoTitle, setSeoTitle] = useState<string>(initialLp.seo_title || '');
  const [seoDescription, setSeoDescription] = useState<string>(initialLp.seo_description || '');
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(
    initialSections[0]?.id || null
  );
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [showPicker, setShowPicker] = useState(false);

  // Mark dirty on any sections / seo change (after first render)
  useEffect(() => {
    if (
      JSON.stringify(sections) !== JSON.stringify(initialSections) ||
      seoTitle !== (initialLp.seo_title || '') ||
      seoDescription !== (initialLp.seo_description || '')
    ) {
      setDirty(true);
    }
  }, [sections, seoTitle, seoDescription, initialSections, initialLp.seo_title, initialLp.seo_description]);

  const selectedSection = useMemo(
    () => sections.find(s => s.id === selectedSectionId) || null,
    [sections, selectedSectionId]
  );

  // Section-Operationen
  const addSection = useCallback((type: BshSectionType) => {
    const newSection: BshSection = {
      id: uid(type),
      type,
      config: structuredClone(BSH_DEFAULT_CONFIGS[type]),
    };
    setSections(prev => [...prev, newSection]);
    setSelectedSectionId(newSection.id);
    setShowPicker(false);
  }, []);

  const updateSection = useCallback((id: string, patch: Partial<BshSection>) => {
    setSections(prev => prev.map(s => (s.id === id ? { ...s, ...patch } : s)));
  }, []);

  const updateSectionConfig = useCallback((id: string, configPatch: any) => {
    setSections(prev => prev.map(s => (s.id === id ? { ...s, config: { ...s.config, ...configPatch } } : s)));
  }, []);

  const removeSection = useCallback((id: string) => {
    setSections(prev => prev.filter(s => s.id !== id));
    if (selectedSectionId === id) {
      const remaining = sections.filter(s => s.id !== id);
      setSelectedSectionId(remaining[0]?.id || null);
    }
  }, [sections, selectedSectionId]);

  const duplicateSection = useCallback((id: string) => {
    const s = sections.find(x => x.id === id);
    if (!s) return;
    const dup: BshSection = { ...s, id: uid(s.type), config: structuredClone(s.config) };
    const idx = sections.findIndex(x => x.id === id);
    setSections(prev => [...prev.slice(0, idx + 1), dup, ...prev.slice(idx + 1)]);
    setSelectedSectionId(dup.id);
  }, [sections]);

  const moveSection = useCallback((id: string, dir: -1 | 1) => {
    setSections(prev => {
      const idx = prev.findIndex(s => s.id === id);
      const newIdx = idx + dir;
      if (idx < 0 || newIdx < 0 || newIdx >= prev.length) return prev;
      const copy = [...prev];
      [copy[idx], copy[newIdx]] = [copy[newIdx], copy[idx]];
      return copy;
    });
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
          seo_title: seoTitle,
          seo_description: seoDescription,
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
      setSaveError(e?.message || 'Speichern fehlgeschlagen');
    } finally {
      setSaving(false);
    }
  }

  const ab = localAbStats(lp);

  return (
    <div className="max-w-[1600px]">
      {/* Header */}
      <div className="flex items-baseline justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/admin/content/landingpages" className="text-slate-500 hover:text-brand">← Zurück</Link>
          <h1 className="text-3xl font-extrabold">🎨 {lp.internal_name || '(ohne Name)'}</h1>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${STATUS_COLOR[lp.status] || 'bg-slate-100 text-slate-600'}`}>
            {lp.status || 'draft'}
          </span>
          {dirty && <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-amber-100 text-amber-800">Ungespeichert</span>}
        </div>
        <div className="flex items-center gap-2">
          {lastSavedAt && !dirty && (
            <span className="text-xs text-slate-500">
              Gespeichert {lastSavedAt.toLocaleTimeString('de-DE')}
            </span>
          )}
          {saveError && <span className="text-xs text-red-600 font-mono max-w-md truncate">{saveError}</span>}
          {lp.status === 'live' && lp.slug && (
            <a
              href={`https://marketing.kuiper-safety.de/lp/${lp.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-bold hover:bg-slate-200 transition text-sm"
            >
              Live ↗
            </a>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={!dirty || saving}
            className="px-4 py-2 bg-brand text-navy rounded-lg font-bold hover:bg-brand-light transition text-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saving ? 'Speichert …' : 'Speichern'}
          </button>
        </div>
      </div>

      {/* 3-Spalten-Editor */}
      <div className="grid grid-cols-[320px_1fr_300px] gap-5">
        {/* Section-Liste */}
        <SectionList
          sections={sections}
          selectedId={selectedSectionId}
          onSelect={setSelectedSectionId}
          onMove={moveSection}
          onRemove={removeSection}
          onDuplicate={duplicateSection}
          onAddClick={() => setShowPicker(true)}
        />

        {/* Config-Panel */}
        <SectionConfigPanel
          section={selectedSection}
          onConfigChange={(patch) => selectedSection && updateSectionConfig(selectedSection.id, patch)}
          onTypeRename={(newId) => {
            if (!selectedSection) return;
            updateSection(selectedSection.id, { id: newId });
            setSelectedSectionId(newId);
          }}
        />

        {/* Sidebar */}
        <EditorSidebar
          lp={lp}
          ab={ab}
          seoTitle={seoTitle}
          seoDescription={seoDescription}
          onSeoTitleChange={setSeoTitle}
          onSeoDescriptionChange={setSeoDescription}
        />
      </div>

      {/* Add-Section-Picker (Modal) */}
      {showPicker && (
        <AddSectionPicker
          onPick={addSection}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  );
}

function AddSectionPicker({ onPick, onClose }: { onPick: (t: BshSectionType) => void; onClose: () => void }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl w-full max-w-3xl max-h-[80vh] overflow-y-auto shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b flex items-center justify-between sticky top-0 bg-white">
          <h2 className="text-lg font-bold">Section hinzufügen</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-2xl leading-none">×</button>
        </div>
        <div className="p-6 grid grid-cols-2 gap-3">
          {BSH_SECTION_CATALOG.map(it => (
            <button
              key={it.key}
              type="button"
              onClick={() => onPick(it.key)}
              className="text-left p-4 rounded-lg border border-slate-200 hover:border-brand hover:bg-brand/5 transition"
            >
              <div className="font-bold text-sm text-navy">{it.label}</div>
              <div className="text-xs text-slate-600 mt-1">{it.desc}</div>
              <div className="text-[10px] font-mono text-slate-400 mt-2">{it.key}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
