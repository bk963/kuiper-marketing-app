/**
 * Section-Renderer — content_json.sections[] → React-Components.
 *
 * Schritte:
 *  1. Sections nach Type maps zur Component aus SECTION_COMPONENTS-Registry
 *  2. Wrappt das Ganze in <LpFrame> (Header + Footer-3-Teiler)
 *  3. Unbekannte Section-Types werden mit Warn-Banner statt Crash gerendert
 *
 * Wird von /lp/[slug]/page.tsx aufgerufen wenn content_json.sections nicht-leer.
 */
import LpFrame from './LpFrame';
import { SECTION_COMPONENTS } from './sections/registry';
import type { BshSection, BshSectionType } from './sections/types';

export default function SectionRenderer({
  lp,
  sections,
}: {
  lp: any;
  sections: BshSection[];
}) {
  return (
    <LpFrame>
      {sections.map((s, i) => {
        const Comp = SECTION_COMPONENTS[s.type as BshSectionType];
        if (!Comp) {
          return (
            <div
              key={s.id || i}
              style={{ background: '#fef3c7', borderLeft: '4px solid #d97706', padding: 16, margin: 8, fontFamily: 'monospace', fontSize: 13 }}
            >
              ⚠️ Unbekannter Section-Type: <code>{s.type}</code> (Position {i + 1}, id={s.id})
            </div>
          );
        }
        return <Comp key={s.id || i} config={s.config || {}} lpId={lp?.id} />;
      })}
    </LpFrame>
  );
}
