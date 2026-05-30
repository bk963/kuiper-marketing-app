/**
 * BSH-Member-Section — kf-bsh-member
 * Pos 4 in der Default-BSH-LP.
 * "Wir sind Mitglied im" + Verbands-Logos in Reihe.
 *
 * Phase 1b: label via EditableText. logos-Array bleibt (Phase 1c).
 */
import { EditableText } from '../editor/EditableText';

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
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={l.src} alt={l.alt} loading="lazy" />
          ))}
        </div>
      </div>
    </section>
  );
}
