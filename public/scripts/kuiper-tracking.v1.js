/*!
 * Kuiper Tracking — v1
 * Single-Source-of-Truth Tracking-Script für alle Kuiper-Marketing-Domains:
 *   - www.kuiper-safety.de (Astro Marketing-Web)
 *   - blog.kuiper-safety.de (später)
 *
 * Macht 2 Sachen:
 *   1) Click-ID & UTM Capture aus URL → First-Party Cookies (Cross-Subdomain, 90 Tage)
 *   2) Frontend-Events: page_view, scroll_depth, section_dwell, rage_click, exit_intent,
 *      js_error, web_vital_lcp/cls/inp, page_hide
 *
 * Exponiert window.kuiperTracking + window.kuiperEvents für Form-Handler.
 *
 * Adblocker- und ITP-immun:
 *   - Liest URL-Parameter (kein externes Script)
 *   - Setzt First-Party Cookies auf Root-Domain (.kuiper-safety.de)
 *   - Events gehen an /api/track/event (eigene Subdomain via sGTM später)
 */
(function(){
  'use strict';
  try {
    var w = window, d = document, l = w.location;

    // === Konfiguration ===
    var COOKIE_DOMAIN = '.kuiper-safety.de'; // Cross-Subdomain (www + blog + t.)
    var COOKIE_DAYS = 90;
    var EVENT_ENDPOINT = '/api/track/event';
    var FLUSH_INTERVAL = 15000;
    var CLICK_IDS = ['gclid','msclkid','fbclid','li_fat_id','ttclid','wbraid','gbraid'];
    var UTMS = ['utm_source','utm_medium','utm_campaign','utm_content','utm_term'];

    // === Consent-Check ===
    function hasStatConsent() {
      try { return !!(w.kuiperConsent && w.kuiperConsent.has('statistik')); }
      catch (_) { return false; }
    }
    // Session-Fallback: Click-IDs aus URL bleiben in sessionStorage (kein Cookie, nicht persistent)
    function setSession(k, v) { try { sessionStorage.setItem(k, v); } catch(_){} }
    function getSession(k) { try { return sessionStorage.getItem(k) || ''; } catch(_) { return ''; } }

    // === Cookie-Helpers ===
    function getCookie(name){
      var m = d.cookie.match(new RegExp('(?:^|; )' + name.replace(/([.$?*|{}()\[\]\\\/\+^])/g,'\\$1') + '=([^;]*)'));
      return m ? decodeURIComponent(m[1]) : '';
    }
    function setCookie(name, val, days){
      var exp = new Date(Date.now() + (days||COOKIE_DAYS)*864e5).toUTCString();
      // Domain nur setzen wenn auf .kuiper-safety.de (nicht localhost/staging)
      var domainPart = (l.hostname.endsWith('kuiper-safety.de')) ? '; domain=' + COOKIE_DOMAIN : '';
      var securePart = (l.protocol === 'https:') ? '; Secure' : '';
      d.cookie = name + '=' + encodeURIComponent(val) + '; expires=' + exp + '; path=/' + domainPart + '; SameSite=Lax' + securePart;
    }
    function uuid(){
      return 'kuiper-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2,10);
    }

    // === 1) Click-ID & UTM Capture ===
    // URL-Read passiert IMMER (auch ohne Consent — URL ist kein Cookie/Tracking).
    // Persist in Cookie (90 Tage) nur mit Consent. Ohne Consent: sessionStorage (Session-only).
    var p = new URLSearchParams(l.search);
    var captured = {};
    var canCookie = hasStatConsent();

    CLICK_IDS.forEach(function(k){
      var v = p.get(k);
      if (v) {
        captured[k] = v;
        if (canCookie) setCookie('_kf_' + k, v, COOKIE_DAYS);
        else setSession('_kf_' + k, v);
      } else {
        // Try recover from cookie (consent) or session
        var prev = canCookie ? getCookie('_kf_' + k) : getSession('_kf_' + k);
        if (prev) captured[k] = prev;
      }
    });

    var hasNewUtm = UTMS.some(function(k){ return p.get(k); });
    if (hasNewUtm) {
      UTMS.forEach(function(k){
        var v = p.get(k) || '';
        if (v) {
          captured[k] = v;
          if (canCookie) setCookie('_kf_' + k, v, COOKIE_DAYS);
          else setSession('_kf_' + k, v);
        }
      });
    }

    // Fallback Kuiper-ClickID — nur mit Consent persistent (sonst session-only)
    if (canCookie) {
      var anyClickId = CLICK_IDS.some(function(k){ return getCookie('_kf_' + k); });
      if (!getCookie('_kf_kuiperclkid')) {
        setCookie('_kf_kuiperclkid', anyClickId ? '' : uuid(), 365);
      }
    } else {
      if (!getSession('_kf_kuiperclkid')) setSession('_kf_kuiperclkid', uuid());
    }

    // First/Last-Visit + Visit-Count — nur mit Consent (sonst Session-only)
    var now = Date.now();
    if (canCookie) {
      if (!getCookie('_kf_first_visit')) {
        setCookie('_kf_first_visit', String(now), 365);
        setCookie('_kf_visit_count', '1', 365);
      } else {
        var cnt = parseInt(getCookie('_kf_visit_count') || '0', 10) + 1;
        setCookie('_kf_visit_count', String(cnt), 365);
      }
      setCookie('_kf_last_visit', String(now), 365);

      if (!getCookie('_kf_landing_page')) {
        setCookie('_kf_landing_page', l.pathname + l.search, 365);
      }
      if (!getCookie('_kf_first_referrer')) {
        setCookie('_kf_first_referrer', d.referrer || '(direct)', 365);
      }
    }

    // Public API
    w.kuiperTracking = {
      get: function(name){ return canCookie ? getCookie('_kf_' + name) : getSession('_kf_' + name); },
      all: function(){
        var out = {};
        CLICK_IDS.concat(UTMS, ['kuiperclkid','first_visit','last_visit','visit_count','landing_page','first_referrer']).forEach(function(k){
          var v = canCookie ? getCookie('_kf_' + k) : getSession('_kf_' + k);
          if (v) out[k] = v;
        });
        out.current_page = l.pathname + l.search;
        out.current_referrer = d.referrer || '';
        out.current_host = l.hostname;
        out.user_agent = navigator.userAgent;
        out.language = navigator.language;
        out.timezone = (Intl.DateTimeFormat().resolvedOptions().timeZone) || '';
        out.viewport = w.innerWidth + 'x' + w.innerHeight;
        out.screen = screen.width + 'x' + screen.height;
        return out;
      },
      captured: captured
    };

    if (p.get('_kf_debug') === '1') {
      console.log('[kuiperTracking] ready', w.kuiperTracking.all());
    }

    // === 2) Frontend-Events ===
    var queue = [];
    var sectionTimes = {};
    var sectionActive = null;
    var sectionEnterAt = 0;
    var clickHistory = [];
    var maxScrollPct = 0;

    function push(name, data){
      // Kein Frontend-Event ohne Statistik-Consent
      if (!hasStatConsent()) return;
      var ev = {
        event: name,
        ts: Date.now(),
        page: l.pathname,
        host: l.hostname,
        clkid: getCookie('_kf_kuiperclkid') || getSession('_kf_kuiperclkid'),
        data: data || {}
      };
      queue.push(ev);
      if (p.get('_kf_debug') === '1') console.log('[kf-event]', name, data);
    }

    function flush(useBeacon){
      if (queue.length === 0) return;
      if (!hasStatConsent()) { queue.length = 0; return; }
      var payload = JSON.stringify({ events: queue.splice(0, queue.length), tracking: w.kuiperTracking.all() });
      if (useBeacon && navigator.sendBeacon) {
        try { navigator.sendBeacon(EVENT_ENDPOINT, payload); return; } catch(_){}
      }
      try {
        fetch(EVENT_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
          keepalive: true
        }).catch(function(){});
      } catch(_){}
    }

    w.kuiperEvents = {
      push: push,
      queue: queue,
      flush: flush,
      getBatch: function(){ return queue.splice(0, queue.length); },
      getMaxScroll: function(){ return maxScrollPct; },
      getSectionTimes: function(){ return sectionTimes; }
    };

    setInterval(function(){ flush(false); }, FLUSH_INTERVAL);

    push('page_view', { referrer: d.referrer, url: l.href });

    d.addEventListener('visibilitychange', function(){
      if (d.visibilityState === 'hidden') {
        endActiveSection();
        push('page_hide', {});
        flush(true);
      } else if (d.visibilityState === 'visible') {
        push('page_visible', {});
      }
    });
    w.addEventListener('pagehide', function(){
      endActiveSection();
      flush(true);
    });

    // Scroll-Depth
    var hitMilestones = {};
    var scrollMilestones = [25, 50, 75, 100];
    function onScroll(){
      var docH = d.documentElement.scrollHeight - w.innerHeight;
      if (docH <= 0) return;
      var pct = Math.min(100, Math.round((w.scrollY / docH) * 100));
      if (pct > maxScrollPct) maxScrollPct = pct;
      for (var i = 0; i < scrollMilestones.length; i++) {
        var m = scrollMilestones[i];
        if (pct >= m && !hitMilestones[m]) {
          hitMilestones[m] = true;
          push('scroll_depth', { pct: m });
        }
      }
    }
    w.addEventListener('scroll', throttle(onScroll, 250), { passive: true });

    // Section-Dwell
    function startSectionTracking(){
      var sections = d.querySelectorAll('section[id], section[class*="kf-"]');
      if (!sections.length || !('IntersectionObserver' in w)) return;
      var io = new IntersectionObserver(function(entries){
        entries.forEach(function(entry){
          var sec = entry.target;
          var name = sec.id || (sec.className.match(/kf-[a-z0-9]+(?:-[a-z0-9]+)*/) || [])[0] || 'unknown';
          if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
            if (sectionActive !== name) {
              endActiveSection();
              sectionActive = name;
              sectionEnterAt = Date.now();
              push('section_enter', { section: name });
            }
          }
        });
      }, { threshold: [0.5] });
      sections.forEach(function(s){ io.observe(s); });
    }
    function endActiveSection(){
      if (sectionActive && sectionEnterAt) {
        var dwell = Date.now() - sectionEnterAt;
        if (dwell > 500) {
          sectionTimes[sectionActive] = (sectionTimes[sectionActive] || 0) + dwell;
          push('section_dwell', { section: sectionActive, ms: dwell });
        }
      }
      sectionActive = null;
      sectionEnterAt = 0;
    }
    if (d.readyState === 'loading') {
      d.addEventListener('DOMContentLoaded', startSectionTracking);
    } else {
      startSectionTracking();
    }

    // Rage-Click
    d.addEventListener('click', function(e){
      var now = Date.now();
      clickHistory = clickHistory.filter(function(c){ return now - c.t < 2000; });
      clickHistory.push({ t: now, x: e.clientX, y: e.clientY, target: (e.target && e.target.tagName) || '?' });
      if (clickHistory.length >= 3) {
        var c0 = clickHistory[0];
        var clustered = clickHistory.every(function(c){
          return Math.hypot(c.x - c0.x, c.y - c0.y) < 80;
        });
        if (clustered) {
          push('rage_click', {
            count: clickHistory.length,
            target: c0.target,
            selector: getSelector(e.target),
            x: c0.x, y: c0.y
          });
          clickHistory = [];
        }
      }
    });
    function getSelector(el){
      if (!el) return '';
      if (el.id) return '#' + el.id;
      var path = [];
      while (el && el.nodeType === 1 && path.length < 4) {
        var s = el.tagName.toLowerCase();
        if (el.className && typeof el.className === 'string') {
          s += '.' + el.className.split(/\s+/).slice(0, 2).join('.');
        }
        path.unshift(s);
        el = el.parentElement;
      }
      return path.join('>');
    }

    // Exit-Intent
    var exitFired = false;
    d.addEventListener('mouseleave', function(e){
      if (exitFired) return;
      if (e.clientY <= 5) { exitFired = true; push('exit_intent', { from_y: e.clientY }); }
    });

    // JS-Errors
    w.addEventListener('error', function(e){
      push('js_error', {
        message: (e.message || '').slice(0, 300),
        filename: (e.filename || '').slice(0, 200),
        line: e.lineno || 0,
        col: e.colno || 0,
        stack: (e.error && e.error.stack ? String(e.error.stack).slice(0, 500) : '')
      });
    });
    w.addEventListener('unhandledrejection', function(e){
      push('promise_rejection', {
        reason: String((e.reason && e.reason.message) || e.reason || '').slice(0, 300)
      });
    });

    // Web Vitals
    try {
      if ('PerformanceObserver' in w) {
        new PerformanceObserver(function(list){
          var entries = list.getEntries();
          var last = entries[entries.length - 1];
          push('web_vital_lcp', {
            value: Math.round(last.renderTime || last.loadTime || 0),
            element: last.element ? last.element.tagName : ''
          });
        }).observe({ type: 'largest-contentful-paint', buffered: true });

        var cls = 0;
        new PerformanceObserver(function(list){
          list.getEntries().forEach(function(entry){
            if (!entry.hadRecentInput) cls += entry.value;
          });
        }).observe({ type: 'layout-shift', buffered: true });
        w.addEventListener('pagehide', function(){
          if (cls > 0) push('web_vital_cls', { value: +cls.toFixed(3) });
        });

        var maxInp = 0;
        new PerformanceObserver(function(list){
          list.getEntries().forEach(function(entry){
            if (entry.interactionId && entry.duration > maxInp) maxInp = entry.duration;
          });
        }).observe({ type: 'event', buffered: true, durationThreshold: 40 });
        w.addEventListener('pagehide', function(){
          if (maxInp > 0) push('web_vital_inp', { value: Math.round(maxInp) });
        });
      }
    } catch(_) {}

    function throttle(fn, wait){
      var last = 0, t;
      return function(){
        var now = Date.now();
        if (now - last >= wait) { last = now; fn(); }
        else { clearTimeout(t); t = setTimeout(function(){ last = Date.now(); fn(); }, wait - (now - last)); }
      };
    }
  } catch (e) { /* never break the page */ }
})();
