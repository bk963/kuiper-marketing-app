/**
 * BSH-Final-CTA-Section — kf-bsh-final
 * Pos 13 in der Default-BSH-LP. Navy-Hintergrund + Check-Liste + Big-Cyan-Pill.
 */
import { ArrowSvg } from './_helpers';

export type FinalBshConfig = {
  eyebrow?: string;
  headlinePre: string;
  headlineAccent: string;
  headlineSuffix?: string;
  bullets: string[];
  ctaText: string;
  ctaHref: string;
};

export default function FinalBshSection({ config }: { config: FinalBshConfig }) {
  return (
    <section className="kf-bsh-final">
      <div className="kf-bsh-final__inner">
        {config.eyebrow && <p className="kf-bsh-final__eyebrow">{config.eyebrow}</p>}
        <h2 className="kf-bsh-final__headline">
          {config.headlinePre} <span className="kf-bsh-final__accent">{config.headlineAccent}</span>
          {config.headlineSuffix}
        </h2>
        <ul className="kf-bsh-final__list">
          {config.bullets.map((b, i) => <li key={i}>{b}</li>)}
        </ul>
        <a href={config.ctaHref} className="kf-bsh-pill kf-bsh-pill--cta kf-bsh-pill--lg">
          {config.ctaText}
          <ArrowSvg />
        </a>
      </div>
    </section>
  );
}
