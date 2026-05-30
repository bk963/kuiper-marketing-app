'use client';
/**
 * ItemToolbar — Mini-Toolbar pro Array-Item innerhalb einer Section.
 *
 * Phase 1c (2026-05-30). Z.B. pro Card in USPs, pro Person in Team, pro FAQ-Item.
 *
 * Pattern:
 *   <ItemToolbar arrayKey="cards" index={i} total={cards.length} template={USPS_CARD_DEFAULT} />
 *
 * Floating top-right INNERHALB des Item-Containers (z-index 20 — über
 * Section-Type-Badge 10 aber unter Section-Toolbar 30). Sichtbar on item-hover.
 *
 * Item-Container MUSS `position: relative` haben + ein einzigartiges
 * data-edit-item attribute. CSS-Hover-Selector liegt im InlineEditor.tsx.
 */
import { useContext } from 'react';
import { EditableContext } from './EditableText';

export type ItemToolbarProps = {
  /** Array-Field-Name in der Section-Config (z.B. "cards", "people", "items") */
  arrayKey: string;
  /** Aktueller Item-Index */
  index: number;
  /** Gesamt-Item-Count (für Up/Down-Disable) */
  total: number;
  /** Default-Template für "Duplicate" / "Add-After" */
  template?: any;
  /** Optional: hide bestimmte Operationen */
  hideAdd?: boolean;
  hideDuplicate?: boolean;
  hideMove?: boolean;
};

export default function ItemToolbar({
  arrayKey,
  index,
  total,
  template,
  hideAdd = false,
  hideDuplicate = false,
  hideMove = false,
}: ItemToolbarProps) {
  const ctx = useContext(EditableContext);
  if (!ctx?.editable || !ctx.onArrayOp) return null;

  const op = ctx.onArrayOp;

  return (
    <div className="inline-editor-item-toolbar" data-item-toolbar={`${arrayKey}-${index}`}>
      {!hideMove && (
        <>
          <button
            type="button"
            onClick={() => op(arrayKey, 'move', { from: index, to: index - 1 })}
            disabled={index === 0}
            title="Item nach oben"
            aria-label={`${arrayKey}-Item nach oben verschieben`}
          >
            ↑
          </button>
          <button
            type="button"
            onClick={() => op(arrayKey, 'move', { from: index, to: index + 1 })}
            disabled={index === total - 1}
            title="Item nach unten"
            aria-label={`${arrayKey}-Item nach unten verschieben`}
          >
            ↓
          </button>
        </>
      )}
      {!hideDuplicate && template !== undefined && (
        <button
          type="button"
          onClick={() => op(arrayKey, 'add', { index: index + 1, template: JSON.parse(JSON.stringify(template)) })}
          title="Item duplizieren (Default-Template einfügen)"
          aria-label={`${arrayKey}-Item duplizieren`}
        >
          ⎘
        </button>
      )}
      <button
        type="button"
        onClick={() => op(arrayKey, 'delete', { index })}
        className="delete"
        title="Item löschen"
        aria-label={`${arrayKey}-Item löschen`}
      >
        🗑️
      </button>
    </div>
  );
}

/**
 * AddItemButton — Knopf am Ende eines Arrays um neues Item hinzuzufügen.
 * Auch sichtbar in Apex (= ohne Provider) → nichts render.
 */
export function AddItemButton({ arrayKey, template, label }: { arrayKey: string; template: any; label?: string }) {
  const ctx = useContext(EditableContext);
  if (!ctx?.editable || !ctx.onArrayOp) return null;

  return (
    <button
      type="button"
      onClick={() => ctx.onArrayOp!(arrayKey, 'add', { template: JSON.parse(JSON.stringify(template)) })}
      className="inline-editor-add-item-btn"
      data-add-item={arrayKey}
      aria-label={`Neues ${arrayKey}-Item hinzufügen`}
    >
      ➕ {label || `Neues ${arrayKey}-Item`}
    </button>
  );
}
