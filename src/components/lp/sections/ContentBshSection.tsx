/**
 * BSH-Content-Section — kf-bsh-content
 * Pos 8 in der Default-BSH-LP. Headline + Check-Bullet-Liste auf weißem Hintergrund.
 */

export type ContentBshConfig = {
  headline: string;
  items: string[];
};

export default function ContentBshSection({ config }: { config: ContentBshConfig }) {
  return (
    <section className="kf-bsh-content">
      <div className="kf-bsh-content__inner">
        <h2 className="kf-bsh-content__headline">{config.headline}</h2>
        <ul className="kf-bsh-content__list">
          {config.items.map((it, i) => <li key={i}>{it}</li>)}
        </ul>
      </div>
    </section>
  );
}
