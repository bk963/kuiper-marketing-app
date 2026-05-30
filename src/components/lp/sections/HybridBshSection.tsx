/**
 * BSH-Hybrid-Section — kf-bsh-hybrid
 * Pos 9 in der Default-BSH-LP. Volltext-Block (paragraphs) + Note.
 *
 * Phase 1b: flat fields via EditableText. paragraphs-Array bleibt (Phase 1c).
 */
import { RichText } from './_helpers';
import { EditableText } from '../editor/EditableText';

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
          {config.paragraphs.map((p, i) => <RichText key={i} html={p} as="p" />)}
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
