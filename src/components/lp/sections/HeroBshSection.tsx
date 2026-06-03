/**
 * BSH-Hero-Section — kf-bsh-hero
 *
 * Pos 1 in der Default-BSH-LP.
 * Enthält:
 *  - Eyebrow + Headline (mit Accent-Span) + Subline (top-Block)
 *  - 2-Col-Frame: Video links | Lead-Form rechts
 *  - TÜV-Block unten (Logo + Title + Body, Petrol-Background)
 *
 * Form wird über props.formId / leadSource / endpoint an <BshForm /> übergeben.
 *
 * Phase 1b 2026-05-30: Texte via <EditableText fieldKey="..."> — in Apex-LP read-only,
 * in InlineEditor mit EditableContext.Provider editierbar.
 */
import BshForm from '../BshForm';
import { Video } from './_helpers';
import { EditableText } from '../editor/EditableText';
import CustomPlayVideo from './_CustomPlayVideo';

export type HeroBshConfig = {
  eyebrow?: string;
  headlinePre: string;
  headlineAccent: string;
  subline?: string;
  videoSrc?: string;
  videoPoster?: string;
  videoCaption?: string;
  /** V2: Custom-Play-Button-Overlay statt native Controls (Clickfunnels-Style) */
  customPlayButton?: boolean;
  /** Form-Konfiguration */
  formTitle?: string;
  formSubtitle?: string;
  formId?: string;
  leadSource?: string;
  formEndpoint?: string;
  /** TÜV-Box */
  tuevLogo?: string;
  tuevTitle?: string;
  tuevBody?: string;
};

export default function HeroBshSection({ config, lpId }: { config: HeroBshConfig; lpId?: string }) {
  // Mobile-only H1-Split: "Brandschutzhelfer-Ausbildung von" -> "Brandschutzhelfer" +
  // Zeilenumbruch + "Ausbildung von ..." OHNE Bindestrich. Desktop bleibt unveraendert.
  const _pre = config.headlinePre || '';
  const _di = _pre.indexOf('-');
  const _hasSplit = _di > 0 && _di < _pre.length - 1;
  const _m1 = _hasSplit ? _pre.slice(0, _di) : _pre;
  const _m2 = _hasSplit ? _pre.slice(_di + 1) : '';
  return (
    <section className="kf-bsh-hero" id="anfrage">
      <div className="kf-bsh-hero__top">
        {config.eyebrow && (
          <EditableText as="span" fieldKey="eyebrow" className="kf-bsh-hero__eyebrow">
            {config.eyebrow}
          </EditableText>
        )}
        <h1 className="kf-bsh-hero__headline">
          {/* Desktop/Editor: Original-Headline (editierbar) */}
          <EditableText as="span" fieldKey="headlinePre" className="kf-hh-full">
            {config.headlinePre}
          </EditableText>
          {/* Mobile-only: ohne Bindestrich, Umbruch nach erstem Wort */}
          {_hasSplit && (
            <span className="kf-hh-mob" aria-hidden="true">
              <span className="kf-hh-mob-1">{_m1}</span>{_m2}
            </span>
          )}{' '}
          <EditableText as="span" fieldKey="headlineAccent" className="kf-bsh-hero__accent">
            {config.headlineAccent}
          </EditableText>
        </h1>
        {config.subline && (
          <EditableText as="p" fieldKey="subline" className="kf-bsh-hero__subline">
            {config.subline}
          </EditableText>
        )}
      </div>

      <div className="kf-bsh-hero__frame">
        {config.videoSrc && (
          <div className="kf-bsh-hero__video">
            {config.customPlayButton ? (
              <CustomPlayVideo
                videoId="hero-bsh"
                src={config.videoSrc}
                poster={config.videoPoster}
                caption={config.videoCaption}
              />
            ) : (
              <Video videoId="hero-bsh" src={config.videoSrc} poster={config.videoPoster} />
            )}
            {config.videoCaption && (
              <EditableText as="p" fieldKey="videoCaption" className="kf-bsh-hero__video-caption">
                {config.videoCaption}
              </EditableText>
            )}
          </div>
        )}
        <div className="kf-bsh-hero__form-wrap">
          <BshForm
            formId={config.formId || 'bsh-hero'}
            leadSource={config.leadSource || 'bsh-lp'}
            endpoint={config.formEndpoint || '/api/lp/lead'}
            lpId={lpId}
            formTitle={config.formTitle}
            formSubtitle={config.formSubtitle}
          />
        </div>
      </div>

      {(config.tuevLogo || config.tuevTitle) && (
        <div className="kf-bsh-hero__tuev">
          {config.tuevLogo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="kf-bsh-hero__tuev-logo" src={config.tuevLogo} alt="TÜV Rheinland zertifiziert-Logo" loading="lazy" />
          )}
          <div className="kf-bsh-hero__tuev-text">
            {config.tuevTitle && (
              <EditableText as="h3" fieldKey="tuevTitle" className="kf-bsh-hero__tuev-title">
                {config.tuevTitle}
              </EditableText>
            )}
            {config.tuevBody && (
              <EditableText as="p" fieldKey="tuevBody" className="kf-bsh-hero__tuev-body">
                {config.tuevBody}
              </EditableText>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
