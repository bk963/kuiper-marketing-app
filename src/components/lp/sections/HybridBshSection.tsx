/**
 * BSH-Hybrid-Section — kf-bsh-hybrid
 * Pos 9 in der Default-BSH-LP. Volltext-Block (paragraphs) + Note.
 *
 * Phase 1b: flat fields via EditableText.
 * Phase 1c: paragraphs[] (string-array) via EditableText path + ItemToolbar.
 *   Inline-HTML (<strong>) wird im Edit-Mode strip-displayed (Phase 1d für rich-text).
 */
import { EditableText } from '../editor/EditableText';
import ItemToolbar, { AddItemButton } from '../editor/ItemToolbar';
import { PARAGRAPH_DEFAULT } from '../editor/itemDefaults';
import ParagraphRenderer from './_ParagraphRenderer';

export type HybridBshConfig = {
  eyebrow?: string;
  headlinePre: string;
  headlineAccent: string;
  headlineSuffix?: string;
  /** Paragraphen können <strong>-HTML enthalten */
  paragraphs: string[];
  /** Einzelner Hinweis-Satz am Ende, fett+cyan */
  note?: string;
};

export default function HybridBshSection({ config }: { config: HybridBshConfig }) {
  return (
    <section className="kf-bsh-hybrid">
      <div className="kf-bsh-hybrid__inner">
        {config.eyebrow && (
          <EditableText as="p" fieldKey="eyebrow" className="kf-bsh-hybrid__eyebrow">
            {config.eyebrow}
          </EditableText>
        )}
        <h2 className="kf-bsh-hybrid__headline">
          <EditableText as="span" fieldKey="headlinePre">{config.headlinePre}</EditableText>{' '}
          <EditableText as="span" fieldKey="headlineAccent" className="kf-bsh-hybrid__accent">
            {config.headlineAccent}
          </EditableText>
          {config.headlineSuffix && (
            <>
              {' '}
              <EditableText as="span" fieldKey="headlineSuffix">{config.headlineSuffix}</EditableText>
            </>
          )}
        </h2>
        <div className="kf-bsh-hybrid__body">
          {config.paragraphs.map((p, i) => (
            <div key={i} data-edit-item-container>
              <ItemToolbar arrayKey="paragraphs" index={i} total={config.paragraphs.length} template={PARAGRAPH_DEFAULT} />
              <ParagraphRenderer html={p} arrayKey="paragraphs" index={i} />
            </div>
          ))}
          <AddItemButton arrayKey="paragraphs" template={PARAGRAPH_DEFAULT} label="+ Neuer Absatz" />
          {config.note && (
            <EditableText as="p" fieldKey="note" className="kf-bsh-hybrid__note">
              {config.note}
            </EditableText>
          )}
        </div>
      </div>
    </section>
  );
}
