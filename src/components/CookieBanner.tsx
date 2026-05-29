// 1:1 Port des CookieBanner.astro von www.kuiper-safety.de — bedient kuiper-consent.v1.js
// Datenschutzlink auf www.kuiper-safety.de (zentral)
export default function CookieBanner() {
  return (
    <div
      id="kuiper-cookie-banner"
      className="kc-hidden"
      role="dialog"
      aria-labelledby="kc-title"
      aria-describedby="kc-desc"
      aria-modal="false"
    >
      <div className="kc-card">
        {/* HAUPT-VIEW */}
        <div className="kc-main">
          <div className="kc-header">
            <div className="kc-icon" aria-hidden="true">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a10 10 0 1 0 10 10c0-.46-.04-.92-.1-1.36a5.39 5.39 0 0 1-4.59-2.43 5.4 5.4 0 0 1-3.75 1.39 5.4 5.4 0 0 1-5.39-5.4c0-.13.01-.26.03-.39A10.05 10.05 0 0 0 12 2z" />
                <circle cx="8.5" cy="11.5" r="0.8" fill="currentColor" />
                <circle cx="14" cy="14" r="0.8" fill="currentColor" />
                <circle cx="11" cy="17" r="0.8" fill="currentColor" />
              </svg>
            </div>
            <h2 id="kc-title">Datenschutz & Tracking</h2>
          </div>
          <p id="kc-desc">
            Wir nutzen <strong>technisch notwendige Daten</strong> für die Kontaktanfrage und <strong>messen Werbe-Conversions</strong> (Bing-Ads / Google-Ads) direkt über unseren Server — ohne Browser-Pixel.
            Mit deiner Zustimmung werten wir zusätzlich anonyme Statistiken aus (Heatmaps, Scroll-Verhalten), damit wir die Seite verbessern können.
          </p>
          <div className="kc-actions">
            <button type="button" className="kc-btn kc-btn-primary" data-kc-accept>Alle akzeptieren</button>
            <button type="button" className="kc-btn kc-btn-ghost" data-kc-reject>Nur Notwendig</button>
            <button type="button" className="kc-btn-link" data-kc-settings>Einstellungen ›</button>
          </div>
        </div>

        {/* SETTINGS-VIEW */}
        <div className="kc-settings">
          <button type="button" className="kc-back" data-kc-back aria-label="Zurück">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Zurück
          </button>
          <h3>Cookie-Einstellungen</h3>

          <div className="kc-cat">
            <div className="kc-cat-head">
              <div className="kc-cat-title">
                <span className="kc-badge kc-badge-on">aktiv</span>
                Notwendig
              </div>
              <span className="kc-cat-lock" aria-label="Immer aktiv">🔒</span>
            </div>
            <p>
              Form-Submit, Click-ID aus URL (für Werbe-Tracking), Spam-Schutz, Server-Side-Conversion-Messung an Google & Bing.<br />
              <em>Rechtsgrundlage: Art. 6 (1) f DSGVO — berechtigtes Interesse.</em>
            </p>
          </div>

          <div className="kc-cat">
            <div className="kc-cat-head">
              <div className="kc-cat-title">Statistik</div>
              <label className="kc-toggle">
                <input type="checkbox" data-kc-toggle="statistik" />
                <span className="kc-toggle-slider"></span>
              </label>
            </div>
            <p>
              Microsoft Clarity (Heatmaps + Session-Replays anonymisiert), Scroll-Verhalten pro Section, Verweildauer, Lade-Performance.<br />
              Hilft uns, die Seite zu verbessern.
            </p>
          </div>

          <div className="kc-cat">
            <div className="kc-cat-head">
              <div className="kc-cat-title">Marketing</div>
              <label className="kc-toggle">
                <input type="checkbox" data-kc-toggle="marketing" />
                <span className="kc-toggle-slider"></span>
              </label>
            </div>
            <p>
              Retargeting-Audiences für Google / Bing / Meta (Server-Side, ohne Browser-Pixel).<br />
              Nur relevant wenn du Anzeigen besser zugeschnitten bekommen möchtest.
            </p>
          </div>

          <div className="kc-actions kc-actions-settings">
            <button type="button" className="kc-btn kc-btn-primary" data-kc-save>Auswahl speichern</button>
            <button type="button" className="kc-btn kc-btn-ghost" data-kc-accept>Alle akzeptieren</button>
          </div>

          <p className="kc-legal">
            Mehr in unserer <a href="https://www.kuiper-safety.de/datenschutz/">Datenschutzerklärung</a>. Du kannst diese Auswahl jederzeit über den Link „Cookie-Einstellungen" im Footer ändern.
          </p>
        </div>
      </div>
    </div>
  );
}
