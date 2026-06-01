/**
 * BSH-ProvenExpert-Widget-Section — kf-bsh-pe
 * Pos 6 in der Default-BSH-LP. JS-Widget-Embed + optional statisches Sticker-Badge.
 *
 * Phase 1b: label via EditableText. widgetSrc bleibt (non-text, Settings-Sidebar Phase 7).
 * V2-Erweiterung (2026-06-01): optional sealImgSrc für statisches PE-Award-Badge —
 *   sichtbar auch ohne JS-Widget-Load (Consent-Block, langsames Netz).
 */
import { EditableText } from '../editor/EditableText';

export type PeBshConfig = {
  label?: string;
  widgetSrc: string;
  /** Statisches ProvenExpert-Sticker-Image (z.B. https://www.provenexpert.com/profile/de-de/sticker-2026/brown.svg).
   * Wird ZUSÄTZLICH zum JS-Widget gerendert — als sichtbares Trust-Badge falls Widget nicht lädt
   * (Consent-Block, langsames Netz) oder als zweite Trust-Komponente. */
  sealImgSrc?: string;
  /** Alt-Text + Link-Ziel zur PE-Profil-Seite. */
  sealImgAlt?: string;
  sealLinkHref?: string;
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
        {config.sealImgSrc && (
          <div className="kf-bsh-pe__seal">
            <a
              href={config.sealLinkHref || 'https://www.provenexpert.com/de-de/kuiper-brandschutz/'}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="ProvenExpert Profil von Kuiper Brandschutz"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={config.sealImgSrc}
                alt={config.sealImgAlt || 'ProvenExpert: Von Kunden empfohlen 2026'}
                width={284}
                height={95}
                loading="lazy"
              />
            </a>
          </div>
        )}
        <div id="pewl"></div>
        <script type="text/javascript" src={config.widgetSrc} async></script>
      </div>
    </section>
  );
}
