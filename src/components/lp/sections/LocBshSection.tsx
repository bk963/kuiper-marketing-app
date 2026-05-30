/**
 * BSH-Standort-Section — kf-bsh-loc
 * Pos 11 in der Default-BSH-LP. Big-Town-Name 2-Zeilen + Body + Maps-Pill.
 *
 * Phase 1b: eyebrow, bigPart1, bigPart2, body, mapsText via EditableText.
 * mapsUrl bleibt (non-text, Settings-Sidebar Phase 7).
 */
import { ArrowSvg } from './_helpers';
import { EditableText } from '../editor/EditableText';

export type LocBshConfig = {
  eyebrow?: string;
  bigPart1: string;
  bigPart2: string;
  body?: string;
  mapsUrl?: string;
  mapsText?: string;
};

export default function LocBshSection({ config }: { config: LocBshConfig }) {
  return (
    <section className="kf-bsh-loc">
      <div className="kf-bsh-loc__inner">
        {config.eyebrow && (
          <EditableText as="p" fieldKey="eyebrow" className="kf-bsh-loc__eyebrow">
            {config.eyebrow}
          </EditableText>
        )}
        <h2 className="kf-bsh-loc__big">
          <EditableText as="span" fieldKey="bigPart1">{config.bigPart1}</EditableText>
          <br />
          <EditableText as="span" fieldKey="bigPart2" className="kf-bsh-loc__accent">
            {config.bigPart2}
          </EditableText>
        </h2>
        {config.body && (
          <EditableText as="p" fieldKey="body" className="kf-bsh-loc__body">
            {config.body}
          </EditableText>
        )}
        {config.mapsUrl && config.mapsText && (
          <a href={config.mapsUrl} target="_blank" rel="noopener noreferrer" className="kf-bsh-pill kf-bsh-pill--outline">
            <EditableText as="span" fieldKey="mapsText">{config.mapsText}</EditableText>
            <ArrowSvg />
          </a>
        )}
      </div>
    </section>
  );
}
