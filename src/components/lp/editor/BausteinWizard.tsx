'use client';
/**
 * BausteinWizard — Neuen Baustein anlegen.
 *
 * Felder:
 *  - name (required)
 *  - description (optional)
 *  - type (Select aus BSH_SECTION_CATALOG = 14 bsh-* Types)
 *  - status (active|inactive|draft, Default draft)
 *
 * "Mit BSH-Default-Config seeden" Checkbox → content_json = BSH_DEFAULT_CONFIGS[type]
 *
 * Submit → POST /api/admin/baustein/create → location.href = /admin/content/landingpages/bausteine/[id]
 */
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { BshSectionType } from '../sections/types';
import { BSH_SECTION_CATALOG, BSH_DEFAULT_CONFIGS } from '../sections/types';
import { TextInput, TextareaInput } from './inputs';

export default function BausteinWizard() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<BshSectionType>('bsh-hero');
  const [status, setStatus] = useState('draft');
  const [seedDefaults, setSeedDefaults] = useState(true);

  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const canSubmit = name.trim().length > 0 && !creating;

  async function handleCreate() {
    setCreating(true);
    setCreateError(null);
    try {
      const body: any = {
        name: name.trim(),
        description: description.trim() || undefined,
        type,
        status,
        content_json: seedDefaults ? structuredClone(BSH_DEFAULT_CONFIGS[type]) : {},
      };
      const res = await fetch('/api/admin/baustein/create', {
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
        router.push(`/admin/content/landingpages/bausteine/${d.id}`);
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
        <Link href="/admin/content/landingpages/bausteine" className="text-slate-500 hover:text-brand">← Zurück</Link>
        <h1 className="text-3xl font-extrabold">🧩 Neuer Baustein</h1>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-1">
        <TextInput
          label="Name *"
          value={name}
          onChange={setName}
          placeholder="z.B. BSH Hero (Standard)"
        />
        <TextareaInput
          label="Beschreibung"
          value={description}
          onChange={setDescription}
          rows={2}
          placeholder="Wofür soll dieser Baustein verwendet werden?"
        />

        <label className="block mb-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Section-Typ</span>
          <select
            value={type}
            onChange={e => setType(e.target.value as BshSectionType)}
            className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-brand"
          >
            {BSH_SECTION_CATALOG.map(c => (
              <option key={c.key} value={c.key}>{c.label} — {c.desc}</option>
            ))}
          </select>
        </label>

        <label className="block mb-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Status</span>
          <select
            value={status}
            onChange={e => setStatus(e.target.value)}
            className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-brand"
          >
            <option value="draft">Draft (nicht im Picker)</option>
            <option value="active">Aktiv (im Section-Picker sichtbar)</option>
            <option value="inactive">Inaktiv</option>
          </select>
        </label>

        <hr className="my-4" />

        <label className="flex items-start gap-2 mb-4 cursor-pointer">
          <input
            type="checkbox"
            checked={seedDefaults}
            onChange={e => setSeedDefaults(e.target.checked)}
            className="mt-0.5"
          />
          <span className="text-sm">
            <span className="font-bold">Mit BSH-Default-Config seeden</span>
            <span className="block text-xs text-slate-500">Lädt die Default-Werte des Section-Typs (Headline, Eyebrow, …) als Startpunkt — sonst leeres content_json.</span>
          </span>
        </label>

        {createError && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-900 text-sm font-mono whitespace-pre-wrap">{createError}</div>
        )}

        <div className="flex items-center justify-between">
          <Link href="/admin/content/landingpages/bausteine" className="text-sm text-slate-500 hover:text-slate-700">
            Abbrechen
          </Link>
          <button
            type="button"
            onClick={handleCreate}
            disabled={!canSubmit}
            className="px-5 py-2 bg-brand text-navy rounded-lg font-bold hover:bg-brand-light transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {creating ? 'Wird angelegt …' : 'Baustein anlegen →'}
          </button>
        </div>
      </div>
    </div>
  );
}
