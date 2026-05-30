/**
 * BSH-Team-Section — kf-bsh-team
 * Pos 10 in der Default-BSH-LP. N Personen-Cards mit Photo + Name + Role + Quals.
 *
 * Phase 1b: eyebrow, headline, standDate via EditableText.
 * Phase 1c: people[] (name/role) + nested quals[] (string-array per person)
 *   via EditableText path + ItemToolbar. Photo bleibt Settings-Sidebar (Phase 7).
 */
import { EditableText } from '../editor/EditableText';
import ItemToolbar, { AddItemButton } from '../editor/ItemToolbar';
import { TEAM_PERSON_DEFAULT, TEAM_QUAL_DEFAULT } from '../editor/itemDefaults';

export type TeamBshConfig = {
  eyebrow?: string;
  headline: string;
  people: {
    name: string;
    role: string;
    photo: string;
    quals: string[];
  }[];
  standDate?: string;
};

export default function TeamBshSection({ config }: { config: TeamBshConfig }) {
  return (
    <section className="kf-bsh-team">
      <div className="kf-bsh-team__inner">
        {config.eyebrow && (
          <EditableText as="p" fieldKey="eyebrow" className="kf-bsh-team__eyebrow">
            {config.eyebrow}
          </EditableText>
        )}
        <EditableText as="h2" fieldKey="headline" className="kf-bsh-team__headline">
          {config.headline}
        </EditableText>
        <div className="kf-bsh-team__grid">
          {config.people.map((p, i) => (
            <article key={i} className="kf-bsh-person" data-edit-item-container>
              <ItemToolbar arrayKey="people" index={i} total={config.people.length} template={TEAM_PERSON_DEFAULT} />
              <div className="kf-bsh-person__photo">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.photo} alt={p.name} loading="lazy" />
              </div>
              <EditableText as="h3" fieldKey={`people.${i}.name`} className="kf-bsh-person__name">
                {p.name}
              </EditableText>
              <EditableText as="p" fieldKey={`people.${i}.role`} className="kf-bsh-person__role">
                {p.role}
              </EditableText>
              <ul className="kf-bsh-person__quals">
                {p.quals.map((q, j) => (
                  <li key={j} data-edit-item-container>
                    <ItemToolbar arrayKey={`people.${i}.quals`} index={j} total={p.quals.length} template={TEAM_QUAL_DEFAULT} hideDuplicate />
                    <EditableText as="span" fieldKey={`people.${i}.quals.${j}`}>{q}</EditableText>
                  </li>
                ))}
              </ul>
              <AddItemButton arrayKey={`people.${i}.quals`} template={TEAM_QUAL_DEFAULT} label="+ Qualifikation" />
            </article>
          ))}
        </div>
        <AddItemButton arrayKey="people" template={TEAM_PERSON_DEFAULT} label="+ Neue Person" />
        {config.standDate && (
          <EditableText as="p" fieldKey="standDate" className="kf-bsh-team__stand">
            {config.standDate}
          </EditableText>
        )}
      </div>
    </section>
  );
}
