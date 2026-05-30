/**
 * BSH-Open-Seminars-Section — kf-bsh-open
 * Pos 14 in der Default-BSH-LP. Alternative-Box (Offene Seminare).
 *
 * Phase 1b: alle 3 Fields (eyebrow, headline, body) via EditableText.
 */
import { EditableText } from '../editor/EditableText';

export type OpenBshConfig = {
  eyebrow?: string;
  headline: string;
  body: string;
};

export default function OpenBshSection({ config }: { config: OpenBshConfig }) {
  return (
    <section className="kf-bsh-open">
      <div className="kf-bsh-open__inner">
        {config.eyebrow && (
          <EditableText as="p" fieldKey="eyebrow" className="kf-bsh-open__eyebrow">
            {config.eyebrow}
          </EditableText>
        )}
        <EditableText as="h3" fieldKey="headline" className="kf-bsh-open__headline">
          {config.headline}
        </EditableText>
        <EditableText as="p" fieldKey="body">
          {config.body}
        </EditableText>
      </div>
    </section>
  );
}
