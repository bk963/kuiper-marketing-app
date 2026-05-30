/**
 * BSH-Steps-Section — kf-bsh-steps
 * Pos 7 in der Default-BSH-LP. N Schritte als nummerierte Cards + CTA-Pill am Ende.
 *
 * Phase 1b: eyebrow, headlinePre, headlineAccent, headlineSuffix, ctaText via EditableText.
 * Phase 1c: steps[] (num/title/body) via EditableText path + ItemToolbar.
 *   ctaHref bleibt Settings-Sidebar (Phase 7).
 */
import { ArrowSvg } from './_helpers';
import { EditableText } from '../editor/EditableText';
import ItemToolbar, { AddItemButton } from '../editor/ItemToolbar';
import { STEPS_STEP_DEFAULT } from '../editor/itemDefaults';

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
            <article key={i} className="kf-bsh-step" data-edit-item-container>
              <ItemToolbar arrayKey="steps" index={i} total={config.steps.length} template={STEPS_STEP_DEFAULT} />
              <EditableText as="div" fieldKey={`steps.${i}.num`} className="kf-bsh-step__num">
                {s.num}
              </EditableText>
              <EditableText as="h3" fieldKey={`steps.${i}.title`} className="kf-bsh-step__title">
                {s.title}
              </EditableText>
              <EditableText as="p" fieldKey={`steps.${i}.body`} className="kf-bsh-step__body">
                {s.body}
              </EditableText>
            </article>
          ))}
        </div>
        <AddItemButton arrayKey="steps" template={STEPS_STEP_DEFAULT} label="+ Neuer Schritt" />
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
