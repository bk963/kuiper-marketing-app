/**
 * BSH-USPs-Section — kf-bsh-usps
 * Pos 2 in der Default-BSH-LP.
 * N Cards mit FontAwesome-Icon + Title + Body in 3er-Grid.
 *
 * Phase 1b: flat text-fields (eyebrow, headline) via EditableText.
 * Phase 1c: cards[] via EditableText path + ItemToolbar (icon bleibt — Settings-Sidebar Phase 7).
 */
import { EditableText } from '../editor/EditableText';
import ItemToolbar, { AddItemButton } from '../editor/ItemToolbar';
import { USPS_CARD_DEFAULT } from '../editor/itemDefaults';

export type UspsBshConfig = {
  eyebrow?: string;
  headline: string;
  cards: { icon: string; title: string; body: string }[];
};

export default function UspsBshSection({ config }: { config: UspsBshConfig }) {
  return (
    <section className="kf-bsh-usps">
      <div className="kf-bsh-usps__inner">
        {config.eyebrow && (
          <EditableText as="p" fieldKey="eyebrow" className="kf-bsh-usps__eyebrow">
            {config.eyebrow}
          </EditableText>
        )}
        <EditableText as="h2" fieldKey="headline" className="kf-bsh-usps__headline">
          {config.headline}
        </EditableText>
        <div className="kf-bsh-usps__grid">
          {config.cards.map((c, i) => (
            <article key={i} className="kf-bsh-card" data-edit-item-container>
              <ItemToolbar arrayKey="cards" index={i} total={config.cards.length} template={USPS_CARD_DEFAULT} />
              <div className="kf-bsh-card__icon">
                <i className={c.icon} aria-hidden="true"></i>
              </div>
              <EditableText as="h3" fieldKey={`cards.${i}.title`} className="kf-bsh-card__title">
                {c.title}
              </EditableText>
              <EditableText as="p" fieldKey={`cards.${i}.body`} className="kf-bsh-card__body">
                {c.body}
              </EditableText>
            </article>
          ))}
        </div>
        <AddItemButton arrayKey="cards" template={USPS_CARD_DEFAULT} label="+ Neue USP-Karte" />
      </div>
    </section>
  );
}
