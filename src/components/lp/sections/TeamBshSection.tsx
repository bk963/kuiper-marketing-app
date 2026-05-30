/**
 * BSH-Team-Section — kf-bsh-team
 * Pos 10 in der Default-BSH-LP. N Personen-Cards mit Photo + Name + Role + Quals.
 *
 * Phase 1b: eyebrow, headline, standDate via EditableText. people-Array bleibt (Phase 1c).
 */
import { EditableText } from '../editor/EditableText';

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
            <article key={i} className="kf-bsh-person">
              <div className="kf-bsh-person__photo">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.photo} alt={p.name} loading="lazy" />
              </div>
              <h3 className="kf-bsh-person__name">{p.name}</h3>
              <p className="kf-bsh-person__role">{p.role}</p>
              <ul className="kf-bsh-person__quals">
                {p.quals.map((q, j) => <li key={j}>{q}</li>)}
              </ul>
            </article>
          ))}
        </div>
        {config.standDate && (
          <EditableText as="p" fieldKey="standDate" className="kf-bsh-team__stand">
            {config.standDate}
          </EditableText>
        )}
      </div>
    </section>
  );
}
