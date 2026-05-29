/**
 * BSH-Standort-Section — kf-bsh-loc
 * Pos 11 in der Default-BSH-LP. Big-Town-Name 2-Zeilen + Body + Maps-Pill.
 */
import { ArrowSvg } from './_helpers';

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
        {config.eyebrow && <p className="kf-bsh-loc__eyebrow">{config.eyebrow}</p>}
        <h2 className="kf-bsh-loc__big">
          {config.bigPart1}<br /><span className="kf-bsh-loc__accent">{config.bigPart2}</span>
        </h2>
        {config.body && <p className="kf-bsh-loc__body">{config.body}</p>}
        {config.mapsUrl && config.mapsText && (
          <a href={config.mapsUrl} target="_blank" rel="noopener noreferrer" className="kf-bsh-pill kf-bsh-pill--outline">
            {config.mapsText}
            <ArrowSvg />
          </a>
        )}
      </div>
    </section>
  );
}
