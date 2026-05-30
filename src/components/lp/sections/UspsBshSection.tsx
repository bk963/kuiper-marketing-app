/**
 * BSH-USPs-Section — kf-bsh-usps
 * Pos 2 in der Default-BSH-LP.
 * N Cards mit FontAwesome-Icon + Title + Body in 3er-Grid.
 *
 * Phase 1b: flat text-fields (eyebrow, headline) via EditableText.
 * cards-Array bleibt static (Phase 1c).
 */
import { EditableText } from '../editor/EditableText';

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
            <article key={i} className="kf-bsh-card">
              <div className="kf-bsh-card__icon">
                <i className={c.icon} aria-hidden="true"></i>
              </div>
              <h3 className="kf-bsh-card__title">{c.title}</h3>
              <p className="kf-bsh-card__body">{c.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
