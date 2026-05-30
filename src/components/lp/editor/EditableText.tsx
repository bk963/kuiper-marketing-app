'use client';
/**
 * EditableText — React-managed inline-editable text component.
 *
 * Phase 1b der Inline-Editor-Migration (Bk 2026-05-30).
 *
 * Pattern:
 *  - Section-Components rendern `<EditableText fieldKey="eyebrow" as="span" className="...">value</EditableText>`
 *  - OHNE EditableContext (= Apex-LP) → rendert plain `<span className="...">value</span>` (unverändert)
 *  - MIT EditableContext.editable=true (= Inline-Editor) → rendert `<span contenteditable>` mit onBlur-Save
 *
 * Vorteil gegenüber DOM-Hack:
 *  - Apex-Output identisch (Server-Rendering-fähig)
 *  - Stable durch React-Re-Renders (kein post-mount querySelector mehr)
 *  - Multiple Spans im selben h1/Container ohne Konflikt (z.B. headlinePre + headlineAccent getrennt editierbar)
 *
 * EditableContext muss von InlineEditor.tsx mit { editable: true, onPatchField } provided sein.
 * Ohne Provider rendert die Component im Read-Only-Mode.
 */
import { createContext, useContext, useRef } from 'react';
import type { ElementType, ReactNode, FocusEvent, KeyboardEvent } from 'react';

export type EditableContextValue = {
  /** Master-Switch: wenn false, EditableText rendert wie ein normaler Tag */
  editable: boolean;
  /** Sektion-Scope: wer aktuell editiert wird. EditableText holt sich onPatchField vom Parent SectionEditFrame. */
  onPatchField: (key: string, value: string) => void;
};

export const EditableContext = createContext<EditableContextValue | null>(null);

export type EditableTextProps = {
  /** HTML-Tag (span/h1/h2/p/div) — Default span */
  as?: ElementType;
  /** config-Key (z.B. "eyebrow", "headlinePre") — wird mit dem Wert an onPatchField übergeben */
  fieldKey: string;
  /** Optional CSS-Klassen */
  className?: string;
  /** Aktueller Wert (= config[fieldKey]). MUSS = children, sonst Edit/Read drift */
  children: ReactNode;
  /** Im Edit-Mode angezeigter Hinweis wenn leer */
  placeholder?: string;
};

export function EditableText({
  as,
  fieldKey,
  className,
  children,
  placeholder,
}: EditableTextProps) {
  const ctx = useContext(EditableContext);
  const ref = useRef<HTMLElement>(null);
  const Tag: ElementType = as || 'span';

  // Read-Only-Mode (Apex-LP oder Edit-Mode disabled)
  if (!ctx?.editable) {
    return <Tag className={className}>{children}</Tag>;
  }

  // Edit-Mode: contentEditable wrap mit blur-save
  const onBlur = (e: FocusEvent<HTMLElement>) => {
    const newText = (e.currentTarget.textContent || '').trim();
    // Skip wenn unverändert
    const currentText = typeof children === 'string' ? children : String(children ?? '');
    if (newText !== currentText) {
      ctx.onPatchField(fieldKey, newText);
    }
  };

  const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      (e.currentTarget as HTMLElement).blur();
    } else if (e.key === 'Escape') {
      // Abbruch: revert + blur
      e.preventDefault();
      const currentText = typeof children === 'string' ? children : String(children ?? '');
      e.currentTarget.textContent = currentText;
      (e.currentTarget as HTMLElement).blur();
    }
  };

  return (
    <Tag
      ref={ref as any}
      className={className}
      contentEditable
      suppressContentEditableWarning
      spellCheck={false}
      data-inline-edit={fieldKey}
      data-placeholder={placeholder || ''}
      onBlur={onBlur}
      onKeyDown={onKeyDown}
    >
      {children}
    </Tag>
  );
}
