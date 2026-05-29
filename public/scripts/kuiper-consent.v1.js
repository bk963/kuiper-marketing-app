/*!
 * Kuiper Consent — v1
 * DSGVO-Cookie-Consent-Manager für www.kuiper-safety.de (+ alle Subdomains)
 *
 * 3 Tiers:
 *   notwendig  → IMMER an, nicht abwählbar (Form-Submit, Click-ID-URL-Read, Server-CAPI)
 *   statistik  → opt-in: 90-Tage-Cookies, Frontend-Events, Microsoft Clarity
 *   marketing  → opt-in (zukünftig): Custom-Audiences-Sync, Retargeting
 *
 * API (auf window.kuiperConsent):
 *   .has(category)   → bool
 *   .get()           → {notwendig, statistik, marketing, timestamp, version}
 *   .save(obj)       → speichert + feuert 'kuiper-consent-change' event
 *   .reset()         → löscht Storage, Banner zeigt sich wieder
 *   .openSettings()  → öffnet Settings-Layer (für Footer-Link)
 *
 * Persistenz: localStorage 'kuiper_consent_v1' (kein Cookie nötig — first-party only)
 *
 * Banner-DOM wird via CookieBanner.astro Component bereitgestellt (HTML).
 * Dieses Script aktiviert nur die Logik.
 */
(function(){
  'use strict';

  var STORAGE_KEY = 'kuiper_consent_v1';
  var CONSENT_VERSION = 1;
  var ALL_CATEGORIES = ['notwendig', 'statistik', 'marketing'];

  function getStorage() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      var obj = JSON.parse(raw);
      if (!obj || obj.version !== CONSENT_VERSION) return null;
      return obj;
    } catch (_) { return null; }
  }

  function setStorage(obj) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
    } catch (_) {}
  }

  function defaultConsent() {
    return {
      notwendig: true,
      statistik: false,
      marketing: false,
      timestamp: 0,
      version: CONSENT_VERSION,
    };
  }

  function currentConsent() {
    return getStorage() || defaultConsent();
  }

  function fireEvent(detail) {
    try {
      window.dispatchEvent(new CustomEvent('kuiper-consent-change', { detail: detail }));
    } catch (_) {}
  }

  var api = {
    get: function() { return currentConsent(); },
    has: function(category) {
      if (category === 'notwendig') return true;
      var c = currentConsent();
      return !!c[category] && c.timestamp > 0;
    },
    hasDecided: function() {
      var c = getStorage();
      return !!(c && c.timestamp > 0);
    },
    save: function(choices) {
      var c = {
        notwendig: true,
        statistik: !!choices.statistik,
        marketing: !!choices.marketing,
        timestamp: Date.now(),
        version: CONSENT_VERSION,
      };
      setStorage(c);
      fireEvent(c);
      return c;
    },
    acceptAll: function() {
      return this.save({ statistik: true, marketing: true });
    },
    rejectAll: function() {
      return this.save({ statistik: false, marketing: false });
    },
    reset: function() {
      try { localStorage.removeItem(STORAGE_KEY); } catch (_) {}
      // Auch alle _kf_* Cookies löschen
      try {
        var cookies = document.cookie.split(';');
        for (var i = 0; i < cookies.length; i++) {
          var name = cookies[i].split('=')[0].trim();
          if (name.indexOf('_kf_') === 0) {
            document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=.kuiper-safety.de';
            document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
          }
        }
      } catch (_) {}
      fireEvent({ reset: true });
    },
    openSettings: function() {
      var banner = document.getElementById('kuiper-cookie-banner');
      if (banner) {
        banner.classList.remove('kc-hidden');
        banner.classList.add('kc-show-settings');
      }
    },
    closeSettings: function() {
      var banner = document.getElementById('kuiper-cookie-banner');
      if (banner) {
        banner.classList.add('kc-hidden');
        banner.classList.remove('kc-show-settings');
      }
    }
  };

  window.kuiperConsent = api;

  // === UI-Binding ===
  function bindBanner() {
    var banner = document.getElementById('kuiper-cookie-banner');
    if (!banner) return;

    // Initial state — falls noch keine Entscheidung, Banner zeigen
    if (!api.hasDecided()) {
      // Kleine Verzögerung damit User Page sieht bevor Banner kommt (One-Second-Wow)
      setTimeout(function() {
        banner.classList.remove('kc-hidden');
        banner.classList.add('kc-show');
      }, 600);
    }

    // Buttons
    var btnAccept = banner.querySelector('[data-kc-accept]');
    var btnReject = banner.querySelector('[data-kc-reject]');
    var btnSave   = banner.querySelector('[data-kc-save]');
    var btnSettings = banner.querySelector('[data-kc-settings]');
    var btnBack   = banner.querySelector('[data-kc-back]');

    var toggleStat = banner.querySelector('[data-kc-toggle="statistik"]');
    var toggleMark = banner.querySelector('[data-kc-toggle="marketing"]');

    if (btnAccept) btnAccept.addEventListener('click', function() {
      api.acceptAll();
      banner.classList.remove('kc-show', 'kc-show-settings');
      banner.classList.add('kc-hidden');
    });

    if (btnReject) btnReject.addEventListener('click', function() {
      api.rejectAll();
      banner.classList.remove('kc-show', 'kc-show-settings');
      banner.classList.add('kc-hidden');
    });

    if (btnSettings) btnSettings.addEventListener('click', function() {
      banner.classList.add('kc-show-settings');
    });

    if (btnBack) btnBack.addEventListener('click', function() {
      banner.classList.remove('kc-show-settings');
    });

    if (btnSave) btnSave.addEventListener('click', function() {
      api.save({
        statistik: toggleStat ? toggleStat.checked : false,
        marketing: toggleMark ? toggleMark.checked : false,
      });
      banner.classList.remove('kc-show', 'kc-show-settings');
      banner.classList.add('kc-hidden');
    });

    // Aktuelle Auswahl in Toggles spiegeln (wenn schon mal entschieden, User passt an)
    var c = api.get();
    if (toggleStat) toggleStat.checked = !!c.statistik;
    if (toggleMark) toggleMark.checked = !!c.marketing;
  }

  // Footer-Link "Cookie-Einstellungen"
  function bindFooterLinks() {
    var links = document.querySelectorAll('[data-kuiper-cookie-settings]');
    for (var i = 0; i < links.length; i++) {
      links[i].addEventListener('click', function(e) {
        e.preventDefault();
        api.openSettings();
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() { bindBanner(); bindFooterLinks(); });
  } else {
    bindBanner();
    bindFooterLinks();
  }
})();
