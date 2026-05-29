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

      {/* Footer-3-Teiler */}
      <div style={{ height: 16, background: 'rgb(45,189,206)' }} aria-hidden="true" />
      <FooterMain />
      <FooterCopyright />
    </>
  );
}

function FooterMain() {
  return (
    <footer
      style={{
        background: 'linear-gradient(45deg, rgb(11,26,77), rgb(18,90,110))',
        color: '#fff',
        padding: 'calc(60 * var(--kf-u)) calc(160 * var(--kf-u))',
        fontFamily: '"Figtree", system-ui, sans-serif',
      }}
    >
      <div style={{ maxWidth: 1425, margin: '0 auto', display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr 1fr', gap: 'calc(48 * var(--kf-u))' }}>
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/kuiper-logo-lp.png" alt="Kuiper Safety Systems" style={{ height: 56, width: 'auto', marginBottom: 16 }} />
          <p style={{ fontSize: 'calc(14 * var(--kf-u))', lineHeight: 1.6, color: 'rgba(255,255,255,0.85)', margin: 0 }}>
            Brandschutz-Komplettlösungen für Unternehmen in ganz Deutschland.
          </p>
        </div>

        <div>
          <h4 style={{ fontSize: 'calc(13 * var(--kf-u))', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgb(48,196,237)', margin: '0 0 calc(16 * var(--kf-u))', fontWeight: 700 }}>Kontakt</h4>
          <p style={{ fontSize: 'calc(14 * var(--kf-u))', lineHeight: 1.7, color: 'rgba(255,255,255,0.85)', margin: 0 }}>
            Kuiper Brandschutz GmbH<br />
            Friedrichsfelder Str. 34<br />
            46562 Voerde (Niederrhein)<br /><br />
            <a href="tel:+4928555910900" style={{ color: '#fff', textDecoration: 'none' }}>+49 2855 5910900</a><br />
            <a href="mailto:info@kuiper-safety.de" style={{ color: '#fff', textDecoration: 'none' }}>info@kuiper-safety.de</a>
          </p>
        </div>

        <div>
          <h4 style={{ fontSize: 'calc(13 * var(--kf-u))', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgb(48,196,237)', margin: '0 0 calc(16 * var(--kf-u))', fontWeight: 700 }}>Hinweis</h4>
          <p style={{ fontSize: 'calc(14 * var(--kf-u))', lineHeight: 1.6, color: 'rgba(255,255,255,0.85)', margin: 0 }}>
            Alle Angaben ohne Gewähr. Änderungen vorbehalten.
          </p>
        </div>

        <div style={{ textAlign: 'right' }}>
          <a href="#anfrage" style={{ color: 'rgb(48,196,237)', fontWeight: 700, fontSize: 'calc(14 * var(--kf-u))', textDecoration: 'none' }}>
            ↑ Nach oben
          </a>
        </div>
      </div>

      <div
        style={{
          maxWidth: 1425,
          margin: 'calc(40 * var(--kf-u)) auto 0',
          paddingTop: 'calc(24 * var(--kf-u))',
          borderTop: '1px solid rgba(255,255,255,0.15)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', gap: 'calc(24 * var(--kf-u))', fontSize: 'calc(13 * var(--kf-u))', color: 'rgba(255,255,255,0.7)' }}>
          <a href="https://kuiper-safety.de/impressum/" style={{ color: 'inherit', textDecoration: 'none' }}>Impressum</a>
          <a href="https://kuiper-safety.de/datenschutz/" style={{ color: 'inherit', textDecoration: 'none' }}>Datenschutz</a>
          <a href="https://kuiper-safety.de/agb/" style={{ color: 'inherit', textDecoration: 'none' }}>AGB</a>
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
          <a href="https://www.youtube.com/@kuiper-safety" target="_blank" rel="noopener noreferrer" aria-label="YouTube" style={{ color: 'rgba(255,255,255,0.8)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
          </a>
          <a href="https://www.linkedin.com/company/kuiper-brandschutz" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" style={{ color: 'rgba(255,255,255,0.8)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.063 2.063 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
          </a>
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
