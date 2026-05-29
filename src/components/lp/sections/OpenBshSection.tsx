/**
 * BSH-Open-Seminars-Section — kf-bsh-open
 * Pos 14 in der Default-BSH-LP. Alternative-Box (Offene Seminare).
 */

export type OpenBshConfig = {
  eyebrow?: string;
  headline: string;
  body: string;
};

export default function OpenBshSection({ config }: { config: OpenBshConfig }) {
  return (
    <section className="kf-bsh-open">
      <div className="kf-bsh-open__inner">
        {config.eyebrow && <p className="kf-bsh-open__eyebrow">{config.eyebrow}</p>}
        <h3 className="kf-bsh-open__headline">{config.headline}</h3>
        <p>{config.body}</p>
      </div>
    </section>
  );
}
