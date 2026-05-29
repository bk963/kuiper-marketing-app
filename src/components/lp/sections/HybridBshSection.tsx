/**
 * BSH-Hybrid-Section — kf-bsh-hybrid
 * Pos 9 in der Default-BSH-LP. Volltext-Block (paragraphs) + Note.
 */
import { RichText } from './_helpers';

export type HybridBshConfig = {
  eyebrow?: string;
  headlinePre: string;
  headlineAccent: string;
  headlineSuffix?: string;
  /** Paragraphen können <strong>-HTML enthalten */
  paragraphs: string[];
  /** Einzelner Hinweis-Satz am Ende, fett+cyan */
  note?: string;
};

export default function HybridBshSection({ config }: { config: HybridBshConfig }) {
  return (
    <section className="kf-bsh-hybrid">
      <div className="kf-bsh-hybrid__inner">
        {config.eyebrow && <p className="kf-bsh-hybrid__eyebrow">{config.eyebrow}</p>}
        <h2 className="kf-bsh-hybrid__headline">
          {config.headlinePre} <span className="kf-bsh-hybrid__accent">{config.headlineAccent}</span>
          {config.headlineSuffix && <> {config.headlineSuffix}</>}
        </h2>
        <div className="kf-bsh-hybrid__body">
          {config.paragraphs.map((p, i) => <RichText key={i} html={p} as="p" />)}
          {config.note && <p className="kf-bsh-hybrid__note">{config.note}</p>}
        </div>
      </div>
    </section>
  );
}
