/**
 * BSH-FAQ-Section — kf-bsh-faq
 * Pos 12 in der Default-BSH-LP. <details>-Accordion mit Chevron-Toggle.
 *
 * Phase 1b: eyebrow, headlinePre, headlineAccent, headlineSuffix via EditableText.
 * Phase 1c: items[] (q/a) via EditableText path + ItemToolbar.
 */
import { EditableText } from '../editor/EditableText';
import ItemToolbar, { AddItemButton } from '../editor/ItemToolbar';
import { FAQ_ITEM_DEFAULT } from '../editor/itemDefaults';

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
            <li key={i} data-edit-item-container>
              <ItemToolbar arrayKey="items" index={i} total={config.items.length} template={FAQ_ITEM_DEFAULT} />
              <details>
                <summary>
                  <EditableText as="span" fieldKey={`items.${i}.q`}>{it.q}</EditableText>
                  <span className="kf-bsh-faq__chev"></span>
                </summary>
                <EditableText as="p" fieldKey={`items.${i}.a`}>{it.a}</EditableText>
              </details>
            </li>
          ))}
        </ul>
        <AddItemButton arrayKey="items" template={FAQ_ITEM_DEFAULT} label="+ Neue FAQ-Frage" />
      </div>
    </section>
  );
}
