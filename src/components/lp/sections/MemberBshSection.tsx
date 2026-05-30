/**
 * BSH-Member-Section — kf-bsh-member
 * Pos 4 in der Default-BSH-LP.
 * "Wir sind Mitglied im" + Verbands-Logos in Reihe.
 *
 * Phase 1b: label via EditableText.
 * Phase 1c: logos[] mit ItemToolbar (alt-Text editierbar, src bleibt Settings-Sidebar Phase 7).
 */
import { EditableText } from '../editor/EditableText';
import ItemToolbar, { AddItemButton } from '../editor/ItemToolbar';
import { MEMBER_LOGO_DEFAULT } from '../editor/itemDefaults';

export type MemberBshConfig = {
  label?: string;
  logos: { src: string; alt: string }[];
};

export default function MemberBshSection({ config }: { config: MemberBshConfig }) {
  return (
    <section className="kf-bsh-member">
      <div className="kf-bsh-member__inner">
        {config.label && (
          <EditableText as="p" fieldKey="label" className="kf-bsh-member__label">
            {config.label}
          </EditableText>
        )}
        <div className="kf-bsh-member__row">
          {config.logos.map((l, i) => (
            <div key={i} data-edit-item-container>
              <ItemToolbar arrayKey="logos" index={i} total={config.logos.length} template={MEMBER_LOGO_DEFAULT} hideDuplicate />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={l.src} alt={l.alt} loading="lazy" />
              <EditableText as="span" fieldKey={`logos.${i}.alt`} className="sr-only">{l.alt}</EditableText>
            </div>
          ))}
        </div>
        <AddItemButton arrayKey="logos" template={MEMBER_LOGO_DEFAULT} label="+ Neues Verbands-Logo" />
      </div>
    </section>
  );
}
