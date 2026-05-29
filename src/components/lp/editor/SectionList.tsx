'use client';
/**
 * SectionList — linke Spalte im Editor.
 *
 * Listet alle Sections der LP in Reihenfolge mit Action-Buttons:
 *  - Click → wählt aus (Highlight + Config-Panel-Update)
 *  - ↑ / ↓ — verschiebt um eine Position
 *  - 📋 — dupliziert
 *  - 🗑 — entfernt
 *
 * Footer-Button "+ Section" öffnet AddSectionPicker im Parent.
 */
import type { BshSection } from '../sections/types';
import { BSH_SECTION_CATALOG } from '../sections/types';

const TYPE_LABEL: Record<string, string> = Object.fromEntries(
  BSH_SECTION_CATALOG.map(c => [c.key, c.label])
);

export default function SectionList({
  sections,
  selectedId,
  onSelect,
  onMove,
  onRemove,
  onDuplicate,
  onAddClick,
}: {
  sections: BshSection[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onMove: (id: string, dir: -1 | 1) => void;
  onRemove: (id: string) => void;
  onDuplicate: (id: string) => void;
  onAddClick: () => void;
}) {
  return (
    <aside className="bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col">
      <div className="px-4 py-3 border-b bg-slate-50 flex items-center justify-between">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600">
          Sections ({sections.length})
        </h2>
        <button
          type="button"
          onClick={onAddClick}
          className="text-xs px-2 py-1 rounded bg-brand text-navy font-bold hover:bg-brand-light"
        >
          + Section
        </button>
      </div>

      {sections.length === 0 ? (
        <div className="p-6 text-center text-sm text-slate-500">
          Noch keine Sections — klicke <em>+ Section</em> oben.
        </div>
      ) : (
        <ul className="p-2 space-y-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 220px)' }}>
          {sections.map((s, i) => {
            const active = s.id === selectedId;
            return (
              <li
                key={s.id}
                className={[
                  'rounded-lg border transition cursor-pointer group',
                  active
                    ? 'bg-brand/10 border-brand'
                    : 'bg-white border-slate-200 hover:border-slate-300',
                ].join(' ')}
              >
                <button
                  type="button"
                  onClick={() => onSelect(s.id)}
                  className="w-full text-left p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono text-slate-400 shrink-0">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="text-sm font-bold truncate flex-1" title={s.type}>
                      {TYPE_LABEL[s.type] || s.type}
                    </span>
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 mt-1 truncate">{s.id}</div>
                </button>

                <div
                  className={[
                    'flex items-center gap-1 px-2 pb-2 transition',
                    active ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
                  ].join(' ')}
                >
                  <button
                    type="button"
                    onClick={() => onMove(s.id, -1)}
                    disabled={i === 0}
                    className="text-xs px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 disabled:opacity-30"
                    title="Nach oben"
                  >↑</button>
                  <button
                    type="button"
                    onClick={() => onMove(s.id, 1)}
                    disabled={i === sections.length - 1}
                    className="text-xs px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 disabled:opacity-30"
                    title="Nach unten"
                  >↓</button>
                  <button
                    type="button"
                    onClick={() => onDuplicate(s.id)}
                    className="text-xs px-2 py-1 rounded bg-slate-100 hover:bg-slate-200"
                    title="Duplizieren"
                  >📋</button>
                  <button
                    type="button"
                    onClick={() => onRemove(s.id)}
                    className="text-xs px-2 py-1 rounded bg-rose-50 text-rose-700 hover:bg-rose-100 ml-auto"
                    title="Entfernen"
                  >🗑</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </aside>
  );
}
