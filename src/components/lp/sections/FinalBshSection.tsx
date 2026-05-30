/**
 * BSH-Final-CTA-Section — kf-bsh-final
 * Pos 13 in der Default-BSH-LP. Navy-Hintergrund + Check-Liste + Big-Cyan-Pill.
 *
 * Phase 1b: eyebrow, headlinePre, headlineAccent, headlineSuffix, ctaText via EditableText.
 * Phase 1c: bullets[] (string-array) via EditableText path + ItemToolbar.
 *   ctaHref bleibt Settings-Sidebar (Phase 7).
 */
import { ArrowSvg } from './_helpers';
import { EditableText } from '../editor/EditableText';
import ItemToolbar, { AddItemButton } from '../editor/ItemToolbar';
import { BULLET_DEFAULT } from '../editor/itemDefaults';

export type FinalBshConfig = {
  eyebrow?: string;
  headlinePre: string;
  headlineAccent: string;
  headlineSuffix?: string;
  bullets: string[];
  ctaText: string;
  ctaHref: string;
};

export default function FinalBshSection({ config }: { config: FinalBshConfig }) {
  return (
    <section className="kf-bsh-final">
      <div className="kf-bsh-final__inner">
        {config.eyebrow && (
          <EditableText as="p" fieldKey="eyebrow" className="kf-bsh-final__eyebrow">
            {config.eyebrow}
          </EditableText>
        )}
        <h2 className="kf-bsh-final__headline">
          <EditableText as="span" fieldKey="headlinePre">{config.headlinePre}</EditableText>{' '}
          <EditableText as="span" fieldKey="headlineAccent" className="kf-bsh-final__accent">
            {config.headlineAccent}
          </EditableText>
          {config.headlineSuffix && (
            <>
              {' '}
              <EditableText as="span" fieldKey="headlineSuffix">{config.headlineSuffix}</EditableText>
            </>
          )}
        </h2>
        <ul className="kf-bsh-final__list">
          {config.bullets.map((b, i) => (
            <li key={i} data-edit-item-container>
              <ItemToolbar arrayKey="bullets" index={i} total={config.bullets.length} template={BULLET_DEFAULT} />
              <EditableText as="span" fieldKey={`bullets.${i}`}>{b}</EditableText>
            </li>
          ))}
        </ul>
        <AddItemButton arrayKey="bullets" template={BULLET_DEFAULT} label="+ Neuer Bullet-Point" />
        <a href={config.ctaHref} className="kf-bsh-pill kf-bsh-pill--cta kf-bsh-pill--lg">
          <EditableText as="span" fieldKey="ctaText">{config.ctaText}</EditableText>
          <ArrowSvg />
        </a>
      </div>
    </section>
  );
}
