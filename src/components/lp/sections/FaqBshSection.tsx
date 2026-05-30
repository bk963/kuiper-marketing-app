/**
 * BSH-FAQ-Section — kf-bsh-faq
 * Pos 12 in der Default-BSH-LP. <details>-Accordion mit Chevron-Toggle.
 *
 * Phase 1b: eyebrow, headlinePre, headlineAccent, headlineSuffix via EditableText.
 * items-Array (q/a) bleibt (Phase 1c).
 */
import { EditableText } from '../editor/EditableText';

export type FaqBshConfig = {
  eyebrow?: string;
  headlinePre: string;
  headlineAccent: string;
  headlineSuffix?: string;
  items: { q: string; a: string }[];
};

export default function FaqBshSection({ config }: { config: FaqBshConfig }) {
  return (
    <section className="kf-bsh-faq">
      <div className="kf-bsh-faq__inner">
        {config.eyebrow && (
          <EditableText as="p" fieldKey="eyebrow" className="kf-bsh-faq__eyebrow">
            {config.eyebrow}
          </EditableText>
        )}
        <h2 className="kf-bsh-faq__headline">
          <EditableText as="span" fieldKey="headlinePre">{config.headlinePre}</EditableText>{' '}
          <EditableText as="span" fieldKey="headlineAccent" className="kf-bsh-faq__accent">
            {config.headlineAccent}
          </EditableText>
          {config.headlineSuffix && (
            <>
              {' '}
              <EditableText as="span" fieldKey="headlineSuffix">{config.headlineSuffix}</EditableText>
            </>
          )}
        </h2>
        <ul className="kf-bsh-faq__list">
          {config.items.map((it, i) => (
            <li key={i}>
              <details>
                <summary>
                  {it.q}
                  <span className="kf-bsh-faq__chev"></span>
                </summary>
                <p>{it.a}</p>
              </details>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
