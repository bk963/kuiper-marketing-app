'use client';
/**
 * InlineEditor — ClickFunnels-Style Live-Edit-Mode für LPs.
 *
 * Architektur:
 *  - Rendert SectionRenderer (= 1:1 zur Apex-LP) im Admin-Context
 *  - Jede Section wird in <SectionEditFrame> wrapped → Hover-Outline + Toolbar
 *  - Phase 1b: EditableContext.Provider gibt onPatchField an Sections; Sections
 *    rendern <EditableText fieldKey="..."> die im Edit-Mode contenteditable werden.
 *  - Phase 2 (heute): Auto-Save mit 300ms-Debounce + AbortController
 *  - Phase 3 (heute): Section-Hover-Toolbar (Up/Down/Duplicate/Delete) mit Confirm-Modal
 *  - State-Verwaltung lokal (currentSections), Save schickt komplettes content_json
 *
 * Folge-Phasen:
 *  - 4 Add-Section-Insert-Button zwischen Sections (Picker für 22 Bausteine)
 *  - 5 Drag-Reorder (@dnd-kit)
 *  - 6 Inline-Image-Upload (Hetzner-S3)
 *  - 7 Settings-Sidebar für non-inline Configs (Icons, Links, IDs)
 *  - 8 Undo/Redo + content_json_draft + Publish-Workflow
 */
import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import type { BshSection, BshSectionType } from '../sections/types';
import { SECTION_COMPONENTS } from '../sections/registry';
import LpFrame from '../LpFrame';
import { EditableContext } from './EditableText';
import DeleteSectionModal from './DeleteSectionModal';

const STATUS_COLOR: Record<string, string> = {
  live: 'bg-emerald-100 text-emerald-800',
  draft: 'bg-amber-100 text-amber-800',
  archived: 'bg-slate-100 text-slate-600',
};

/** UUID-15 wie PB autogenerate-pattern */
function uuid15(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let out = '';
  for (let i = 0; i < 15; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

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
  const [deleteCandidate, setDeleteCandidate] = useState<BshSection | null>(null);

  // Auto-Save Refs
  const abortRef = useRef<AbortController | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // last-saved-snapshot um zu erkennen wann state == server-state
  const savedSnapshotRef = useRef<string>(JSON.stringify(initialSections));

  // dirty-Detection — vergleicht aktuellen sections-state mit last-saved-snapshot
  useEffect(() => {
    setDirty(JSON.stringify(sections) !== savedSnapshotRef.current);
  }, [sections]);

  /** Section-Config-Patch: single field-update */
  const patchSectionConfig = useCallback((sectionId: string, key: string, value: any) => {
    setSections(prev => prev.map(s => {
      if (s.id !== sectionId) return s;
      return { ...s, config: { ...s.config, [key]: value } };
    }));
  }, []);

  /** Section-Reorder, -Duplicate, -Delete (Phase 3 Toolbar) */
  const moveSection = useCallback((sectionId: string, direction: 'up' | 'down') => {
    setSections(prev => {
      const idx = prev.findIndex(s => s.id === sectionId);
      if (idx < 0) return prev;
      const target = direction === 'up' ? idx - 1 : idx + 1;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  }, []);

  const duplicateSection = useCallback((sectionId: string) => {
    setSections(prev => {
      const idx = prev.findIndex(s => s.id === sectionId);
      if (idx < 0) return prev;
      const clone: BshSection = JSON.parse(JSON.stringify(prev[idx]));
      clone.id = uuid15();
      const next = [...prev];
      next.splice(idx + 1, 0, clone);
      return next;
    });
  }, []);

  const deleteSection = useCallback((sectionId: string) => {
    setSections(prev => prev.filter(s => s.id !== sectionId));
    setDeleteCandidate(null);
  }, []);

  /** Save (Phase 2) — async PATCH mit AbortController; called by autosave-debounce */
  const handleSave = useCallback(async (currentSections: BshSection[]) => {
    // Abort in-flight save
    abortRef.current?.abort();
    const abort = new AbortController();
    abortRef.current = abort;

    setSaving(true);
    setSaveError(null);
    const snapshot = JSON.stringify(currentSections);

    try {
      const res = await fetch(`/api/admin/lp/${lp.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content_json: { ...initialContent, sections: currentSections },
        }),
        signal: abort.signal,
      });
      if (abort.signal.aborted) return;
      if (!res.ok) {
        const txt = await res.text();
        setSaveError(`HTTP ${res.status}: ${txt.slice(0, 200)}`);
        return;
      }
      // Erfolg: snapshot-tracking damit dirty-flag korrekt fällt
      savedSnapshotRef.current = snapshot;
      setLastSavedAt(new Date());
      // dirty-update über setSections-Trigger; hier nochmal sync
      setDirty(JSON.stringify(currentSections) !== snapshot ? true : false);
    } catch (e: any) {
      if (e?.name === 'AbortError') return; // expected
      setSaveError(e?.message || 'Save failed');
    } finally {
      if (!abort.signal.aborted) setSaving(false);
    }
  }, [initialContent, lp.id]);

  /** Auto-Save-Debounce (Phase 2) — 300ms nach letzter Änderung */
  useEffect(() => {
    if (!dirty) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      handleSave(sections);
    }, 300);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [sections, dirty, handleSave]);

  /** Manueller Save-Button — sofortiges Flush ohne debounce */
  const handleManualSave = useCallback(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    handleSave(sections);
  }, [sections, handleSave]);

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
          {saving && <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-blue-100 text-blue-800 animate-pulse">Speichert …</span>}
          {!saving && dirty && <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-amber-100 text-amber-800">Ungespeichert</span>}
          {!saving && !dirty && lastSavedAt && <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-emerald-100 text-emerald-800">✓ Gespeichert</span>}
          <span className="text-[11px] text-slate-500">{sections.length} Sections · Auto-Save (300ms)</span>
        </div>
        <div className="flex items-center gap-2">
          {lastSavedAt && !dirty && !saving && (
            <span className="text-xs text-slate-500">{lastSavedAt.toLocaleTimeString('de-DE')}</span>
          )}
          {saveError && <span className="text-xs text-red-600 font-mono max-w-md truncate">{saveError}</span>}
          {lp.status === 'live' && lp.slug && (
            <a href={`https://kuiper-safety.de/lp/${lp.slug}`} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg font-bold hover:bg-slate-200 transition text-xs">
              Live ↗
            </a>
          )}
          <button
            type="button"
            onClick={handleManualSave}
            disabled={!dirty || saving}
            className="px-4 py-1.5 bg-brand text-navy rounded-lg font-bold hover:bg-brand-light transition text-sm disabled:opacity-40 disabled:cursor-not-allowed"
            title="Sofort speichern (Strg+S)"
          >
            {saving ? 'Speichert …' : 'Speichern'}
          </button>
        </div>
      </div>

      {/* Edit-Hint-Banner */}
      <div className="px-5 py-2 bg-brand/5 border-b border-brand/20 text-xs text-slate-700">
        💡 Klick auf Text um zu editieren · Enter speichert · Esc bricht ab · Auto-Save nach 300ms · Section-Hover für Toolbar
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
              onMoveUp={() => moveSection(s.id, 'up')}
              onMoveDown={() => moveSection(s.id, 'down')}
              onDuplicate={() => duplicateSection(s.id)}
              onDelete={() => setDeleteCandidate(s)}
            />
          ))}
        </LpFrame>
      </div>

      {/* Delete-Confirm-Modal */}
      <DeleteSectionModal
        section={deleteCandidate}
        onCancel={() => setDeleteCandidate(null)}
        onConfirm={() => deleteCandidate && deleteSection(deleteCandidate.id)}
      />

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
        .inline-editor-canvas [data-inline-edit]:empty::before {
          content: attr(data-placeholder);
          color: rgba(0, 0, 0, 0.3);
          font-style: italic;
        }
        /* Section-Toolbar (Phase 3) */
        .inline-editor-section-toolbar {
          position: absolute;
          top: 8px;
          right: 8px;
          z-index: 30;
          display: flex;
          gap: 4px;
          background: rgb(11, 26, 77);
          color: white;
          padding: 4px 6px;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.15s;
        }
        .inline-editor-canvas > * > div[data-edit-section]:hover .inline-editor-section-toolbar,
        .inline-editor-canvas div[data-edit-section]:hover .inline-editor-section-toolbar {
          opacity: 1;
          pointer-events: auto;
        }
        .inline-editor-section-toolbar button {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          transition: background 0.1s;
        }
        .inline-editor-section-toolbar button:hover:not(:disabled) {
          background: rgb(48, 196, 237);
          color: rgb(11, 26, 77);
        }
        .inline-editor-section-toolbar button:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }
        .inline-editor-section-toolbar button.delete:hover {
          background: rgb(220, 38, 38);
          color: white;
        }
      `}</style>
    </div>
  );
}

/**
 * SectionEditFrame — wrapped um eine Section, fügt Edit-Mode-Attrs hinzu
 * + provided EditableContext mit onPatchField an die Section-Component.
 *
 * Phase 3: Toolbar mit Up/Down/Duplicate/Delete-Buttons schwebend rechts oben.
 */
function SectionEditFrame({
  section,
  index,
  total,
  onPatchConfig,
  onMoveUp,
  onMoveDown,
  onDuplicate,
  onDelete,
}: {
  section: BshSection;
  index: number;
  total: number;
  onPatchConfig: (key: string, value: any) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const Comp = SECTION_COMPONENTS[section.type as BshSectionType];
  if (!Comp) {
    return (
      <div data-edit-section data-section-type={section.type} className="bg-amber-50 border border-amber-200 p-4 text-amber-900 text-sm">
        ⚠️ Unbekannte Section: <code>{section.type}</code>
      </div>
    );
  }

  return (
    <div data-edit-section data-section-type={section.type} data-section-id={section.id} className="relative">
      {/* Section-Toolbar (Phase 3) — schwebt rechts oben, sichtbar on hover */}
      <div className="inline-editor-section-toolbar" data-section-toolbar={section.id}>
        <button type="button" onClick={onMoveUp} disabled={index === 0} title="Nach oben" aria-label="Section nach oben verschieben">↑</button>
        <button type="button" onClick={onMoveDown} disabled={index === total - 1} title="Nach unten" aria-label="Section nach unten verschieben">↓</button>
        <button type="button" onClick={onDuplicate} title="Duplizieren" aria-label="Section duplizieren">⎘</button>
        <button type="button" onClick={onDelete} className="delete" title="Löschen" aria-label="Section löschen">🗑️</button>
      </div>

      <EditableContext.Provider value={{ editable: true, onPatchField: onPatchConfig }}>
        <Comp config={section.config} lpId={section.id} />
      </EditableContext.Provider>
    </div>
  );
}
