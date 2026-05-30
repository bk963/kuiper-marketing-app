/**
 * BSH-Content-Section — kf-bsh-content
 * Pos 8 in der Default-BSH-LP. Headline + Check-Bullet-Liste auf weißem Hintergrund.
 *
 * Phase 1b: headline via EditableText.
 * Phase 1c: items[] (string-array) via EditableText path + ItemToolbar.
 */
import { EditableText } from '../editor/EditableText';
import ItemToolbar, { AddItemButton } from '../editor/ItemToolbar';
import { CONTENT_ITEM_DEFAULT } from '../editor/itemDefaults';

export type ContentBshConfig = {
  headline: string;
  items: string[];
};

export default function ContentBshSection({ config }: { config: ContentBshConfig }) {
  return (
    <section className="kf-bsh-content">
      <div className="kf-bsh-content__inner">
        <EditableText as="h2" fieldKey="headline" className="kf-bsh-content__headline">
          {config.headline}
        </EditableText>
        <ul className="kf-bsh-content__list">
          {config.items.map((it, i) => (
            <li key={i} data-edit-item-container>
              <ItemToolbar arrayKey="items" index={i} total={config.items.length} template={CONTENT_ITEM_DEFAULT} />
              <EditableText as="span" fieldKey={`items.${i}`}>{it}</EditableText>
            </li>
          ))}
        </ul>
        <AddItemButton arrayKey="items" template={CONTENT_ITEM_DEFAULT} label="+ Neuer Bullet" />
      </div>
    </section>
  );
}
