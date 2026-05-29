/**
 * BSH-Story-Section — kf-bsh-story
 * Pos 3 in der Default-BSH-LP.
 * Text-Block links + Portrait-Foto rechts auf Navy-Hintergrund mit Cyan-Akzent.
 */
import { RichText } from './_helpers';

export type StoryBshConfig = {
  headlinePre: string;
  headlineAccent: string;
  headlineSuffix?: string;
  /** Paragraphen können <strong>-HTML enthalten */
  paragraphs: string[];
  photoSrc?: string;
  photoAlt?: string;
};

export default function StoryBshSection({ config }: { config: StoryBshConfig }) {
  return (
    <section className="kf-bsh-story">
      <div className="kf-bsh-story__inner">
        <div className="kf-bsh-story__text">
          <h2 className="kf-bsh-story__headline">
            {config.headlinePre} <span className="kf-bsh-story__accent">{config.headlineAccent}</span>
            {config.headlineSuffix && <> {config.headlineSuffix}</>}
          </h2>
          <div className="kf-bsh-story__body">
            {config.paragraphs.map((p, i) => <RichText key={i} html={p} as="p" />)}
          </div>
        </div>
        {config.photoSrc && (
          <div className="kf-bsh-story__photo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={config.photoSrc} alt={config.photoAlt || ''} width={947} height={738} loading="lazy" />
          </div>
        )}
      </div>
    </section>
  );
}
