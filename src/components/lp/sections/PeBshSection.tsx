/**
 * BSH-ProvenExpert-Widget-Section — kf-bsh-pe
 * Pos 6 in der Default-BSH-LP. JS-Widget-Embed.
 *
 * Phase 1b: label via EditableText. widgetSrc bleibt (non-text, Settings-Sidebar Phase 7).
 */
import { EditableText } from '../editor/EditableText';

export type PeBshConfig = {
  label?: string;
  widgetSrc: string;
};

export default function PeBshSection({ config }: { config: PeBshConfig }) {
  return (
    <section className="kf-bsh-pe">
      <div className="kf-bsh-pe__inner">
        {config.label && (
          <EditableText as="p" fieldKey="label" className="kf-bsh-pe__label">
            {config.label}
          </EditableText>
        )}
        <div id="pewl"></div>
        <script type="text/javascript" src={config.widgetSrc} async></script>
      </div>
    </section>
  );
}
