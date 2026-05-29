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
 */
import BshForm from '../BshForm';
import { Video } from './_helpers';

export type HeroBshConfig = {
  eyebrow?: string;
  headlinePre: string;
  headlineAccent: string;
  subline?: string;
  videoSrc?: string;
  videoPoster?: string;
  videoCaption?: string;
  /** Form-Konfiguration */
  formTitle?: string;
  formId?: string;
  leadSource?: string;
  formEndpoint?: string;
  /** TÜV-Box */
  tuevLogo?: string;
  tuevTitle?: string;
  tuevBody?: string;
};

export default function HeroBshSection({ config, lpId }: { config: HeroBshConfig; lpId?: string }) {
  return (
    <section className="kf-bsh-hero" id="anfrage">
      <div className="kf-bsh-hero__top">
        {config.eyebrow && <span className="kf-bsh-hero__eyebrow">{config.eyebrow}</span>}
        <h1 className="kf-bsh-hero__headline">
          {config.headlinePre} <span className="kf-bsh-hero__accent">{config.headlineAccent}</span>
        </h1>
        {config.subline && <p className="kf-bsh-hero__subline">{config.subline}</p>}
      </div>

      <div className="kf-bsh-hero__frame">
        {config.videoSrc && (
          <div className="kf-bsh-hero__video">
            <Video videoId="hero-bsh" src={config.videoSrc} poster={config.videoPoster} />
            {config.videoCaption && <p className="kf-bsh-hero__video-caption">{config.videoCaption}</p>}
          </div>
        )}
        <div className="kf-bsh-hero__form-wrap">
          <BshForm
            formId={config.formId || 'bsh-hero'}
            leadSource={config.leadSource || 'bsh-lp'}
            endpoint={config.formEndpoint || '/api/lp/lead'}
            lpId={lpId}
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
            {config.tuevTitle && <h3 className="kf-bsh-hero__tuev-title">{config.tuevTitle}</h3>}
            {config.tuevBody && <p className="kf-bsh-hero__tuev-body">{config.tuevBody}</p>}
          </div>
        </div>
      )}
    </section>
  );
}
