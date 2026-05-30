/**
 * BSH-Steps-Section — kf-bsh-steps
 * Pos 7 in der Default-BSH-LP. N Schritte als nummerierte Cards + CTA-Pill am Ende.
 *
 * Phase 1b: eyebrow, headlinePre, headlineAccent, headlineSuffix, ctaText via EditableText.
 * steps-Array + ctaHref bleiben (Phase 1c / Settings-Sidebar).
 */
import { ArrowSvg } from './_helpers';
import { EditableText } from '../editor/EditableText';

export type StepsBshConfig = {
  eyebrow?: string;
  headlinePre: string;
  headlineAccent: string;
  headlineSuffix?: string;
  steps: { num: string; title: string; body: string }[];
  ctaText?: string;
  ctaHref?: string;
};

export default function StepsBshSection({ config }: { config: StepsBshConfig }) {
  return (
    <section className="kf-bsh-steps">
      <div className="kf-bsh-steps__inner">
        {config.eyebrow && (
          <EditableText as="p" fieldKey="eyebrow" className="kf-bsh-steps__eyebrow">
            {config.eyebrow}
          </EditableText>
        )}
        <h2 className="kf-bsh-steps__headline">
          <EditableText as="span" fieldKey="headlinePre">{config.headlinePre}</EditableText>{' '}
          <EditableText as="span" fieldKey="headlineAccent" className="kf-bsh-steps__accent">
            {config.headlineAccent}
          </EditableText>
          {config.headlineSuffix && (
            <>
              {' '}
              <EditableText as="span" fieldKey="headlineSuffix">{config.headlineSuffix}</EditableText>
            </>
          )}
        </h2>
        <div className="kf-bsh-steps__grid">
          {config.steps.map((s, i) => (
            <article key={i} className="kf-bsh-step">
              <div className="kf-bsh-step__num">{s.num}</div>
              <h3 className="kf-bsh-step__title">{s.title}</h3>
              <p className="kf-bsh-step__body">{s.body}</p>
            </article>
          ))}
        </div>
        {config.ctaText && config.ctaHref && (
          <div className="kf-bsh-steps__cta-row">
            <a href={config.ctaHref} className="kf-bsh-pill">
              <EditableText as="span" fieldKey="ctaText">{config.ctaText}</EditableText>
              <ArrowSvg />
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
