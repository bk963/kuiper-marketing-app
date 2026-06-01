'use client';
/**
 * FooterTopButton — Client-only Button für smooth-scroll to top.
 *
 * Notwendig weil LpFrame/FooterMain Server-Components sind und onClick-Handler
 * dort nicht erlaubt sind. 1:1 V1-Astro-Verhalten (smooth scroll to top).
 */
export default function FooterTopButton() {
  return (
    <button
      type="button"
      className="kf-s12__totop"
      aria-label="Nach oben scrollen"
      onClick={() => {
        if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
      }}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <line x1="12" y1="19" x2="12" y2="5" />
        <polyline points="5 12 12 5 19 12" />
      </svg>
    </button>
  );
}
