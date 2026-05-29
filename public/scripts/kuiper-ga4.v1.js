/*!
 * Kuiper GA4 — v1  (Google Analytics 4, Consent-Mode v2)
 * Property "Kuiper Safety" · Measurement-ID G-YV7MPLX2VF
 * An den Kuiper-Consent-Banner gekoppelt: analytics_storage nur bei Kategorie "statistik".
 * Default = denied (Consent-Mode v2 cookieless pings), Update bei Einwilligung.
 */
(function () {
  'use strict';
  var GA_ID = 'G-YV7MPLX2VF';

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = gtag;

  gtag('js', new Date());

  // Consent-Mode v2 — vor allem anderen: standardmäßig verweigert
  gtag('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'denied',
    wait_for_update: 500
  });

  // gtag.js laden
  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
  document.head.appendChild(s);

  gtag('config', GA_ID, { anonymize_ip: true });

  // Aktuelle/whichende Einwilligung auf Consent-Mode mappen
  function applyConsent(c) {
    if (!c && window.kuiperConsent && window.kuiperConsent.get) {
      c = window.kuiperConsent.get();
    }
    c = c || {};
    gtag('consent', 'update', {
      analytics_storage: c.statistik ? 'granted' : 'denied',
      ad_storage:        c.marketing ? 'granted' : 'denied',
      ad_user_data:      c.marketing ? 'granted' : 'denied',
      ad_personalization:c.marketing ? 'granted' : 'denied'
    });
  }

  applyConsent();
  window.addEventListener('kuiper-consent-change', function (e) { applyConsent(e.detail); });
})();
