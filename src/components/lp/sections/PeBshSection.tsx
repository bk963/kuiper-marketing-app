/**
 * BSH-ProvenExpert-Widget-Section — kf-bsh-pe
 * Pos 6 in der Default-BSH-LP. JS-Widget-Embed.
 */

export type PeBshConfig = {
  label?: string;
  widgetSrc: string;
};

export default function PeBshSection({ config }: { config: PeBshConfig }) {
  return (
    <section className="kf-bsh-pe">
      <div className="kf-bsh-pe__inner">
        {config.label && <p className="kf-bsh-pe__label">{config.label}</p>}
        <div id="pewl"></div>
        <script type="text/javascript" src={config.widgetSrc} async></script>
      </div>
    </section>
  );
}
