/**
 * LP-Layout — Public-Route /lp/<slug>.
 *
 * Eigenes Layout (NICHT das admin-layout), weil:
 *  - kein Sidebar / Header
 *  - eigenes <head> mit Font-Preload + LP-Stylesheet
 *  - eigenes Body-Background (sonst gewinnt Tailwind-base mit hellem BG)
 *
 * CSS-Strategie:
 *  - /lp/global.css = Astro-LP-Tailwind-Tokens (Brand-Vars + Typography)
 *  - /lp/lp-sections.css = alle kf-bsh-* Section-Styles (extrahiert aus brandschutzhelfer-ausbildung.astro)
 */
import type { ReactNode } from 'react';

export default function LpLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {/* Astro-Sources-Fonts (preload + display=swap) */}
      <link rel="preload" href="/fonts/manrope-800.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      <link rel="preload" href="/fonts/figtree-400.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      <link rel="preload" href="/fonts/figtree-700.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />

      {/* LP-Stylesheets */}
      <link rel="stylesheet" href="/lp/global.css" />
      <link rel="stylesheet" href="/lp/lp-sections.css" />

      {/* Font-Awesome für kf-bsh-card__icon <i class="fas fa-..."> */}
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css"
        integrity="sha512-WBQiX2hmrK1WTZIYwYEKpWPYbmqV+vMV+iLpb2cYHC+xxqv0EgKsfOyFw57iiR5G6/zJpRP9ScVrIA13EkRDvg=="
        crossOrigin="anonymous"
        referrerPolicy="no-referrer"
      />

      {children}
    </>
  );
}
