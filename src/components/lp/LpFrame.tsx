/**
 * LpFrame — Wrapper für jede Public-LP.
 *
 * Enthält Trust-Bar, Sticky-Header (Logo+Phone+CTA), Footer-3-Teiler.
 * Sections werden dazwischen gerendert (via children).
 *
 * In Phase 3d-3 wird das Frame editor-konfigurierbar (Phone/Logo/CTA-Text/Footer-Inhalte
 * aus mkt_site_settings o.ä.). Heute: hardcoded Kuiper-Defaults.
 */
import type { ReactNode } from 'react';
import FooterTopButton from './_FooterTopButton';

export type LpFrameConfig = {
  /** Trust-Bar-Texte */
  trustBarItems?: { svgPath: string; label: string }[];
  /** Header */
  logoSrc?: string;
  logoHref?: string;
  phoneNumber?: string;
  phoneDisplay?: string;
  ctaText?: string;
  ctaHref?: string;
};

const DEFAULTS: Required<LpFrameConfig> = {
  trustBarItems: [
    { svgPath: 'check', label: 'TÜV Rheinland zertifiziert' },
    { svgPath: 'clock', label: '24/7 erreichbar' },
    { svgPath: 'users', label: '1.000+ Brandschutzhelfer ausgebildet' },
  ],
  logoSrc: '/brand/kuiper-logo-lp.png',
  logoHref: 'https://kuiper-safety.de/',
  phoneNumber: '+4928144419951',
  phoneDisplay: '+49 281 444 199 51',
  ctaText: 'Jetzt Termin sichern',
  ctaHref: '#anfrage',
};

function TrustIcon({ path }: { path: string }) {
  if (path === 'check') {
    return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12l5 5L20 7" /></svg>;
  }
  if (path === 'clock') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    );
  }
  if (path === 'users') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    );
  }
  return null;
}

export default function LpFrame({ children, config = {} }: { children: ReactNode; config?: LpFrameConfig }) {
  const c = { ...DEFAULTS, ...config };
  return (
    <>
      <div data-disable-tracking="1" style={{ display: 'none' }} />

      {/* Trust-Bar */}
      <div className="hb-trust">
        <div className="hb-trust__inner">
          {c.trustBarItems.map((it, i) => (
            <span key={i}>
              <TrustIcon path={it.svgPath} />{' '}{it.label}
            </span>
          ))}
        </div>
      </div>

      {/* Sticky-Header */}
      <header className="hb">
        <div className="hb__inner">
          <a href={c.logoHref} className="hb__logo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={c.logoSrc} alt="Kuiper Safety Systems" />
          </a>
          <div className="hb__right">
            <a href={`tel:${c.phoneNumber}`} className="hb__phone">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              {c.phoneDisplay}
            </a>
            <a href={c.ctaHref} className="hb__cta">
              {c.ctaText}
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M4 10h12M11 5l5 5-5 5" />
              </svg>
            </a>
          </div>
        </div>
      </header>

      {/* Sections-Slot */}
      {children}

      {/* Footer 1:1 V1-Astro — Cyan-Trennlinie + kf-s12-Footer (kein Extra-Copyright-Block, V1 hat keinen) */}
      <div style={{ height: 16, background: 'rgb(45,189,206)' }} aria-hidden="true" />
      <FooterMain />
    </>
  );
}

/**
 * FooterMain — 1:1 V1-Astro "kf-s12" Footer (Bk-Direktive 2026-06-01).
 * Markup-Struktur und Styles aus brandschutzhelfer-ausbildung.astro übernommen.
 * Styles liegen in public/lp/lp-sections.css unter ".kf-s12".
 */
function FooterMain() {
  return (
    <footer className="kf-s12" role="contentinfo" aria-label="Footer">
      <div className="kf-s12__inner">
        <div className="kf-s12__row">
          <a href="/" className="kf-s12__logo" aria-label="Kuiper Safety Systems – Startseite">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/kss-logo.svg" alt="Kuiper Safety Systems" width={321} height={75} />
          </a>
          <div className="kf-s12__cols">
            <address className="kf-s12__col">
              <strong>Kuiper Safety Systems</strong>
              <span className="kf-s12__addr-line">&nbsp;</span>
              <span>Friedrichsfelder Str. 34</span>
              <span>46562 Voerde (Niederrhein)</span>
              <span>Mo. – Fr. 09 – 17 Uhr</span>
              <a href="tel:+4928555910900">+49 2855 5910900</a>
            </address>
            <div className="kf-s12__col">
              <strong>Hinweis</strong>
              <span className="kf-s12__addr-line">&nbsp;</span>
              <p className="kf-s12__hinweis">
                Die Angebote &amp; Inhalte dieser Seite richten sich ausdrücklich nur an Gewerbetreibende &amp; Unternehmer im Sinne des §14 BGB.
              </p>
            </div>
            <FooterTopButton />
          </div>
        </div>
        <div className="kf-s12__bottom">
          <nav className="kf-s12__legal" aria-label="Footer-Navigation">
            <a href="https://kuiper-safety.de/impressum/">Impressum</a>
            <span aria-hidden="true">|</span>
            <a href="https://kuiper-safety.de/datenschutz/">Datenschutz</a>
          </nav>
          <div className="kf-s12__social">
            <a href="https://www.youtube.com/@kuiper-safety" target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="kf-s12__social-link">
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
            </a>
            <a href="https://www.linkedin.com/company/kuiper-brandschutz" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="kf-s12__social-link">
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.063 2.063 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterCopyright() {
  return (
    <div
      style={{
        background: '#0D1B3E',
        color: 'rgba(255,255,255,0.6)',
        padding: '16px 24px',
        fontSize: 12,
        fontFamily: '"DM Sans", sans-serif',
        textAlign: 'center',
      }}
    >
      © 2026 Kuiper Safety Systems. Alle Rechte vorbehalten. &nbsp;·&nbsp; 🇩🇪 Made in Voerde, NRW
    </div>
  );
}
