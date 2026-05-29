/**
 * BSH-Testimonials-Section — kf-bsh-testi
 * Pos 5 in der Default-BSH-LP. Video-Testimonials in 2-Spalten-Grid.
 */
import { Video } from './_helpers';

export type TestiBshConfig = {
  eyebrow?: string;
  headline: string;
  videos: { src: string; poster?: string }[];
};

export default function TestiBshSection({ config }: { config: TestiBshConfig }) {
  return (
    <section className="kf-bsh-testi">
      <div className="kf-bsh-testi__inner">
        {config.eyebrow && <p className="kf-bsh-testi__eyebrow">{config.eyebrow}</p>}
        <h2 className="kf-bsh-testi__headline">{config.headline}</h2>
        <div className="kf-bsh-testi__grid">
          {config.videos.map((v, i) => (
            <Video key={i} videoId={`testi-${i + 1}`} src={v.src} poster={v.poster} />
          ))}
        </div>
      </div>
    </section>
  );
}
