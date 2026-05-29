'use client';
/**
 * BausteinEditor — Edit-Page für einen Baustein (mkt_lp_bausteine).
 *
 * Section-Config-Form für 1 Section-Type — der Baustein IST eine Section,
 * also wiederverwenden wir SectionConfigPanel.
 *
 * Plus: Stamm-Felder (name, description, type, status).
 *
 * Save: PATCH /api/admin/baustein/[id] mit { name, description, type, content_json, status }
 */
import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import type { BshSectionType } from '../sections/types';
import { BSH_SECTION_CATALOG, BSH_DEFAULT_CONFIGS } from '../sections/types';
import SectionConfigPanel from './SectionConfigPanel';
import { TextInput, TextareaInput } from './inputs';

export default function BausteinEditor({ baustein: initial }: { baustein: any }) {
  const [name, setName] = useState<string>(initial.name || '');
  const [description, setDescription] = useState<string>(initial.description || '');
  const [type, setType] = useState<BshSectionType>(initial.type as BshSectionType || 'bsh-hero');
  const [status, setStatus] = useState<string>(initial.status || 'draft');
  const [config, setConfig] = useState<any>(initial.content_json || {});

  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  // Track changes
  useEffect(() => {
    const changed =
      name !== (initial.name || '') ||
      description !== (initial.description || '') ||
      type !== (initial.type || 'bsh-hero') ||
      status !== (initial.status || 'draft') ||
      JSON.stringify(config) !== JSON.stringify(initial.content_json || {});
    setDirty(changed);
  }, [name, description, type, status, config, initial]);

  // Wrap config in fake-Section-Shape für SectionConfigPanel
  const fakeSection = useMemo(() => ({ id: initial.id, type, config }), [initial.id, type, config]);

  // Reset config wenn type sich ändert (sinnvolle Defaults)
  function onTypeChange(newType: BshSectionType) {
    if (Object.keys(config).length === 0 || !window.confirm('Bei Type-Wechsel werden Defaults für den neuen Type geladen. Aktuelle Config überschreiben?')) {
      // Bei leerem oder cancel: nur type
      if (Object.keys(config).length === 0) {
        setConfig(structuredClone(BSH_DEFAULT_CONFIGS[newType]));
      }
      setType(newType);
      return;
    }
    setType(newType);
    setConfig(structuredClone(BSH_DEFAULT_CONFIGS[newType]));
  }

  async function handleSave() {
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch(`/api/admin/baustein/${initial.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          type,
          status,
          content_json: config,
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

  return (
    <div className="max-w-[1600px]">
      <div className="flex items-baseline justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/admin/content/landingpages/bausteine" className="text-slate-500 hover:text-brand">← Bausteine</Link>
          <h1 className="text-3xl font-extrabold">🧩 {name || '(ohne Name)'}</h1>
          {dirty && <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-amber-100 text-amber-800">Ungespeichert</span>}
        </div>
        <div className="flex items-center gap-2">
          {lastSavedAt && !dirty && (
            <span className="text-xs text-slate-500">Gespeichert {lastSavedAt.toLocaleTimeString('de-DE')}</span>
          )}
          {saveError && <span className="text-xs text-red-600 font-mono max-w-md truncate">{saveError}</span>}
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

      <div className="grid grid-cols-[320px_1fr] gap-5">
        {/* Stammdaten */}
        <aside className="bg-white rounded-xl border border-slate-200 p-5 space-y-3 h-fit">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Stammdaten</h3>
          <TextInput label="Name" value={name} onChange={setName} placeholder="z.B. BSH Hero (Standard)" />
          <TextareaInput label="Beschreibung" value={description} onChange={setDescription} rows={3} placeholder="Wofür wird dieser Baustein verwendet?" />
          <label className="block">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Section-Typ</span>
            <select
              value={type}
              onChange={e => onTypeChange(e.target.value as BshSectionType)}
              className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-brand"
            >
              {BSH_SECTION_CATALOG.map(c => (
                <option key={c.key} value={c.key}>{c.label}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Status</span>
            <select
              value={status}
              onChange={e => setStatus(e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-brand"
            >
              <option value="draft">Draft</option>
              <option value="active">Aktiv</option>
              <option value="inactive">Inaktiv</option>
            </select>
          </label>
        </aside>

        {/* Section-Config-Panel — wiederverwendet aus LP-Editor */}
        <SectionConfigPanel
          section={fakeSection}
          onConfigChange={(patch) => setConfig({ ...config, ...patch })}
          onTypeRename={() => { /* Bausteine haben keine Section-IDs */ }}
        />
      </div>
    </div>
  );
}
