'use client';
/**
 * DeleteSectionModal — Confirm-Modal mit Content-Stats vor Section-Delete.
 *
 * Phase 3 (2026-05-30). Verhindert One-Click-Datenverlust durch Anzeige
 * von "X Wörter, Y Bilder, Z Items" — Bk sieht was er verliert.
 *
 * Keyboard:
 *  - Esc → Cancel
 *  - Enter → Bestätigen (Delete)
 */
import { useEffect, useMemo } from 'react';
import type { BshSection } from '../sections/types';

export type DeleteSectionModalProps = {
  section: BshSection | null;
  onCancel: () => void;
  onConfirm: () => void;
};

/** Zählt Wörter / Bilder / Items in einer Section-Config rekursiv */
function computeStats(config: any): { words: number; images: number; items: number } {
  let words = 0;
  let images = 0;
  let items = 0;

  const walk = (val: any) => {
    if (val == null) return;
    if (typeof val === 'string') {
      // Bild-URL? (sehr simple Heuristik)
      if (/\.(jpg|jpeg|png|gif|webp|svg|avif)(\?|$)/i.test(val) || val.startsWith('/images/') || val.startsWith('https://')) {
        // nur bei eindeutigen Asset-keys zählen — siehe unten
      }
      // Wörter-Count
      const trimmed = val.trim();
      if (trimmed) {
        const w = trimmed.split(/\s+/).filter(Boolean).length;
        // Skip wenn nur 1 Wort + sehr kurz (CSS-Klassen, IDs)
        if (w > 1 || trimmed.length > 8) words += w;
      }
    } else if (Array.isArray(val)) {
      items += val.length;
      val.forEach(walk);
    } else if (typeof val === 'object') {
      Object.entries(val).forEach(([k, v]) => {
        // Bild-Keys explizit
        if (/^(photo|hero|tuevLogo|videoSrc|videoPoster|photoSrc|logo|src|widgetSrc|image)$/i.test(k) && typeof v === 'string' && v) {
          if (k !== 'widgetSrc' && k !== 'mapsUrl') images += 1;
        }
        walk(v);
      });
    }
  };
  walk(config);
  return { words, images, items };
}

export default function DeleteSectionModal({ section, onCancel, onConfirm }: DeleteSectionModalProps) {
  const stats = useMemo(() => (section ? computeStats(section.config) : null), [section]);

  useEffect(() => {
    if (!section) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        onConfirm();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [section, onCancel, onConfirm]);

  if (!section || !stats) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0 text-red-600 text-xl">
            🗑️
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">Section wirklich löschen?</h2>
            <p className="text-sm text-slate-600 mt-1">
              <code className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">{section.type}</code> — Inhalt geht verloren.
            </p>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-5 text-sm text-amber-900">
          <div className="font-bold mb-1">Was du verlierst:</div>
          <ul className="space-y-1 text-xs">
            <li>📝 <strong>{stats.words}</strong> Wörter</li>
            {stats.images > 0 && <li>🖼️ <strong>{stats.images}</strong> Bilder/Medien</li>}
            {stats.items > 0 && <li>📋 <strong>{stats.items}</strong> Listen-Einträge (Cards/People/Items)</li>}
          </ul>
        </div>

        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-bold hover:bg-slate-200 transition text-sm"
          >
            Abbrechen <span className="text-[10px] opacity-60">Esc</span>
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition text-sm"
          >
            Löschen <span className="text-[10px] opacity-80">Enter</span>
          </button>
        </div>
      </div>
    </div>
  );
}
