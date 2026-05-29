/**
 * Shared Helper-Components für BSH-LP-Sections.
 *
 * Video — wraps native <video> in der kf-vid-Klasse (Astro VideoPlayer-Drop-in).
 * RichText — rendert HTML aus Editor (kontrolliert via dangerouslySetInnerHTML,
 *   sanitisiert nicht — Quelle ist immer Editor-Input vom Admin, kein User-Content).
 * ArrowSvg / ArrowCircleSvg — wiederverwendete Pfeile in CTAs.
 */

export function Video({
  src,
  poster,
  controls = true,
  videoId,
}: { src: string; poster?: string; controls?: boolean; videoId?: string }) {
  return (
    <div className="kf-vid">
      <video
        id={videoId}
        src={src}
        poster={poster}
        controls={controls}
        playsInline
        preload="metadata"
        style={{ width: '100%', height: 'auto', display: 'block' }}
      />
    </div>
  );
}

/** RichText — rendert Editor-HTML mit erlaubten Inline-Tags (strong/em/br). */
export function RichText({ html, as: As = 'p' }: { html: string; as?: keyof React.JSX.IntrinsicElements }) {
  const Tag = As as any;
  return <Tag dangerouslySetInnerHTML={{ __html: html }} />;
}

export function ArrowSvg() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 10h12M11 5l5 5-5 5" />
    </svg>
  );
}
