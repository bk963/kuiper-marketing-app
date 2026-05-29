/**
 * BSH-FAQ-Section — kf-bsh-faq
 * Pos 12 in der Default-BSH-LP. <details>-Accordion mit Chevron-Toggle.
 */

export type FaqBshConfig = {
  eyebrow?: string;
  headlinePre: string;
  headlineAccent: string;
  headlineSuffix?: string;
  items: { q: string; a: string }[];
};

export default function FaqBshSection({ config }: { config: FaqBshConfig }) {
  return (
    <section className="kf-bsh-faq">
      <div className="kf-bsh-faq__inner">
        {config.eyebrow && <p className="kf-bsh-faq__eyebrow">{config.eyebrow}</p>}
        <h2 className="kf-bsh-faq__headline">
          {config.headlinePre} <span className="kf-bsh-faq__accent">{config.headlineAccent}</span>
          {config.headlineSuffix}
        </h2>
        <ul className="kf-bsh-faq__list">
          {config.items.map((it, i) => (
            <li key={i}>
              <details>
                <summary>
                  {it.q}
                  <span className="kf-bsh-faq__chev"></span>
                </summary>
                <p>{it.a}</p>
              </details>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
