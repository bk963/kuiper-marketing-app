'use client';
/**
 * BSH-LP-Lead-Form als Client-Component.
 *
 * 1:1 Port der Logic aus brandschutzhelfer-ausbildung.astro:714-823.
 *
 * Tracking:
 *  - form_start (erstes focus)
 *  - form_field_focus / form_field_complete (mit field+ms)
 *  - form_submit
 *  - generate_lead (auf 2xx response)
 *  - cta_click (auf .kf-bsh-pill-Clicks — siehe Template)
 *
 * Submit-Endpoint:
 *  - Default /api/lp/lead (Marketing-App-Proxy → Reach-Bridge)
 *  - Form-Action über Props overridable
 */
import { useEffect, useRef, useState } from 'react';

type Props = {
  formId?: string;
  leadSource?: string;
  endpoint?: string;
  lpId?: string;
};

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
    kuiperTracking?: { all?: () => Record<string, any> };
    kuiperEvents?: {
      getBatch?: () => any[];
      getMaxScroll?: () => number;
      getSectionTimes?: () => Record<string, number>;
    };
  }
}

export default function BshForm({
  formId = 'bsh-hero',
  leadSource = 'bsh-lp',
  endpoint = '/api/lp/lead',
  lpId,
}: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Track-State über Closures (re-Render-stable)
  const startedRef = useRef(false);
  const formStartTimeRef = useRef(0);
  const fieldTimesRef = useRef<Record<string, number>>({});
  const abandonedRef = useRef<string[]>([]);

  function track(name: string, params: Record<string, any> = {}) {
    if (typeof window === 'undefined') return;
    const w = window;
    const data = { form_id: formId, ...params };
    if (typeof w.gtag === 'function') {
      w.gtag('event', name, data);
    } else if (Array.isArray(w.dataLayer)) {
      w.dataLayer.push({ event: name, ...data });
    }
  }

  // Field-Focus/Blur-Tracking hängen wir per Effect an alle Inputs
  useEffect(() => {
    const form = formRef.current;
    if (!form) return;
    const fields = Array.from(form.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
      'input, select, textarea'
    ));

    const handlers: Array<() => void> = [];

    for (const f of fields) {
      if (f.type === 'submit' || f.type === 'button' || f.type === 'hidden') continue;
      const onFocus = () => {
        if (!startedRef.current) {
          track('form_start');
          startedRef.current = true;
          formStartTimeRef.current = Date.now();
        }
        fieldTimesRef.current[f.name] = Date.now();
        track('form_field_focus', { field: f.name });
      };
      const onBlur = () => {
        const elapsed = fieldTimesRef.current[f.name] ? Date.now() - fieldTimesRef.current[f.name] : 0;
        if (f.value) {
          track('form_field_complete', { field: f.name, ms: elapsed });
        } else if (startedRef.current) {
          if (!abandonedRef.current.includes(f.name)) abandonedRef.current.push(f.name);
        }
      };
      f.addEventListener('focus', onFocus);
      f.addEventListener('blur', onBlur);
      handlers.push(() => {
        f.removeEventListener('focus', onFocus);
        f.removeEventListener('blur', onBlur);
      });
    }
    return () => handlers.forEach(fn => fn());
  }, [formId]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMsg(null);
    const form = e.currentTarget;
    setSubmitting(true);
    track('form_submit');

    // FormData → Object
    const formData: Record<string, string> = {};
    new FormData(form).forEach((v, k) => { formData[k] = String(v); });

    const w = typeof window !== 'undefined' ? window : ({} as any);
    const tracking = w.kuiperTracking?.all?.() ?? {};
    const kfEvents = w.kuiperEvents?.getBatch?.() ?? [];
    const maxScroll = w.kuiperEvents?.getMaxScroll?.() ?? 0;
    const sectionTimes = w.kuiperEvents?.getSectionTimes?.() ?? {};

    // A/B-Variant aus Cookie lesen (lp_ab_<slug>)
    let abVariant: string | null = null;
    try {
      const slug = typeof location !== 'undefined' ? location.pathname.replace(/^\/lp\//, '').replace(/\/$/, '') : '';
      const m = document.cookie.match(new RegExp(`(?:^|;\\s*)lp_ab_${slug}=([ab])`));
      if (m) abVariant = m[1];
    } catch { /* swallow */ }

    const payload = {
      form_id: formId,
      lead_source: leadSource,
      lp_id: lpId || null,
      lp_ab_variant: abVariant,
      form_page: typeof location !== 'undefined' ? location.pathname : '',
      submitted_at: new Date().toISOString(),
      form_duration_ms: startedRef.current ? Date.now() - formStartTimeRef.current : 0,
      fields_filled: Object.values(formData).filter(v => v && v.length > 0).length,
      abandoned_fields: abandonedRef.current,
      max_scroll_pct: maxScroll,
      section_dwell_ms: sectionTimes,
      events: kfEvents,
      lead: formData,
      tracking,
      honeypot: (form.querySelector('input[name=website_url]') as HTMLInputElement)?.value || '',
    };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include',
      });
      if (res.ok) {
        track('generate_lead');
        // Beacon-Fallback gegen unload-Race
        if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
          try { navigator.sendBeacon('/api/lp/lead/beacon', JSON.stringify(payload)); } catch { /* swallow */ }
        }
        if (typeof location !== 'undefined') {
          location.href = `/lp/danke/?via=${leadSource}`;
        }
        return;
      }
      const txt = await res.text().catch(() => '');
      console.warn('[lp-submit] failed', res.status, txt);
      setErrorMsg('Sorry, das hat nicht geklappt. Bitte später nochmal versuchen oder direkt anrufen: +49 281 444 199 51');
    } catch (err) {
      console.error('[lp-submit] error', err);
      try {
        if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
          navigator.sendBeacon('/api/lp/lead/beacon', JSON.stringify(payload));
        }
      } catch { /* swallow */ }
      setErrorMsg('Verbindungsfehler — bitte anrufen: +49 281 444 199 51');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      ref={formRef}
      className="kf-kform"
      id={formId}
      data-form-id={formId}
      aria-label="Anfrageformular"
      noValidate
      onSubmit={onSubmit}
    >
      <h2 className="kf-kform__title">Jetzt direkt Infos und Preise anfordern</h2>

      <label className="kf-kform__field">
        <span className="kf-kform__label">Unternehmensname *</span>
        <input type="text" name="company" required placeholder="Ihre Firma" />
      </label>

      <label className="kf-kform__field">
        <span className="kf-kform__label">Straße und Hausnummer *</span>
        <input type="text" name="street" required placeholder="Musterstraße 12" />
      </label>

      <div className="kf-kform__row">
        <label className="kf-kform__field">
          <span className="kf-kform__label">Postleitzahl *</span>
          <input type="text" name="zip" required pattern="[0-9]{5}" inputMode="numeric" placeholder="46562" />
        </label>
        <label className="kf-kform__field">
          <span className="kf-kform__label">Stadt *</span>
          <input type="text" name="city" required placeholder="Voerde" />
        </label>
      </div>

      <div className="kf-kform__row">
        <label className="kf-kform__field">
          <span className="kf-kform__label">Anrede *</span>
          <select name="salutation" required defaultValue="">
            <option value="">Bitte wählen…</option>
            <option value="Frau">Frau</option>
            <option value="Herr">Herr</option>
          </select>
        </label>
        <label className="kf-kform__field">
          <span className="kf-kform__label">Nachname *</span>
          <input type="text" name="lastname" required placeholder="Mustermann" />
        </label>
      </div>

      <div className="kf-kform__row">
        <label className="kf-kform__field">
          <span className="kf-kform__label">Telefonnummer *</span>
          <input type="tel" name="phone" required placeholder="+49 …" />
        </label>
        <label className="kf-kform__field">
          <span className="kf-kform__label">E-Mail *</span>
          <input type="email" name="email" required placeholder="ihre@email.de" />
        </label>
      </div>

      {/* Honeypot — wird per CSS unsichtbar gemacht (in kf-kform-CSS) — Bots füllen es trotzdem aus */}
      <input
        type="text"
        name="website_url"
        tabIndex={-1}
        autoComplete="off"
        style={{ position: 'absolute', left: '-9999px', opacity: 0, pointerEvents: 'none', height: 0 }}
        aria-hidden="true"
      />

      <label className="kf-kform__consent">
        <input type="checkbox" name="human" required />
        <span>
          Ich bin ein Mensch und stimme der Verarbeitung meiner Daten gemäß der{' '}
          <a href="https://kuiper-safety.de/datenschutz/" target="_blank" rel="noopener noreferrer">Datenschutzerklärung</a> zu.
        </span>
      </label>

      {errorMsg && (
        <div className="text-red-700 text-sm font-semibold mt-2" role="alert">{errorMsg}</div>
      )}

      <button type="submit" className="kf-kform__submit" disabled={submitting}>
        <span>{submitting ? 'Wird gesendet…' : 'Anfrage absenden'}</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <line x1="5" y1="12" x2="19" y2="12" />
          <polyline points="12 5 19 12 12 19" />
        </svg>
      </button>
    </form>
  );
}
