/**
 * Marketing-Landingpages Data-Access — mkt_landingpages + mkt_lp_bausteine + mkt_templates(landing_page).
 *
 * mkt_landingpages enthält A/B-Test-State embedded:
 *   - ab_test_active (bool)
 *   - ab_variant_b (json) — Variant-B-Inhalt (Sections-Override)
 *   - ab_views_a / ab_views_b (number)
 *   - ab_conversions_a / ab_conversions_b (number)
 *
 * Public-LP-Route /lp/:slug nutzt diese Lib um zwischen Variant A (default) und B
 * zu routen (50/50-Split + Cookie-Sticky).
 */
import { pbList, pbCount, pbGet, type ListOpts } from './pb-server';

export const mktLp = {
  landingpages: (opts: ListOpts = {}) => pbList('mkt_landingpages', opts),
  bausteine: (opts: ListOpts = {}) => pbList('mkt_lp_bausteine', opts),
  // LP-Templates = mkt_templates mit type='landing_page'
  templates: (opts: ListOpts = {}) => {
    const filter = opts.filter ? `(${opts.filter})&&type="landing_page"` : 'type="landing_page"';
    return pbList('mkt_templates', { ...opts, filter });
  },
};

export const mktLpCounts = {
  landingpages: () => pbCount('mkt_landingpages'),
  landingpagesLive: () => pbCount('mkt_landingpages', 'status="live"'),
  landingpagesDraft: () => pbCount('mkt_landingpages', 'status="draft"'),
  landingpagesAbActive: () => pbCount('mkt_landingpages', 'ab_test_active=true'),
  bausteine: () => pbCount('mkt_lp_bausteine'),
  bausteineActive: () => pbCount('mkt_lp_bausteine', 'status="active"'),
  templatesLp: () => pbCount('mkt_templates', 'type="landing_page"'),
};

export const getLandingpage = (id: string) => pbGet('mkt_landingpages', id);
export const getBaustein = (id: string) => pbGet('mkt_lp_bausteine', id);

/**
 * Section-Types die im Section-Editor verfügbar sind.
 * Mapping zu Bausteine-Type-Werten (mkt_lp_bausteine.type select).
 */
export const SECTION_TYPES = [
  { key: 'hero', label: '🎯 Hero', desc: 'Headline + Subheadline + CTA + optional Image' },
  { key: 'trust', label: '⭐ Trust', desc: 'Logos + Bewertungen + Testimonials-Strip' },
  { key: 'features', label: '🧩 Features', desc: '3-6 Icon-Cards mit Title + Text' },
  { key: 'cta', label: '📣 CTA', desc: 'Single Big-Button-Section' },
  { key: 'faq', label: '❓ FAQ', desc: 'Accordion mit Frage-Antwort-Paaren' },
  { key: 'form', label: '📋 Form', desc: 'Lead-Formular (Anbindung an mkt_forms)' },
  { key: 'testimonials', label: '💬 Testimonials', desc: 'Kunden-Stimmen mit Foto + Name + Firma' },
  { key: 'pricing', label: '💰 Pricing', desc: 'Tabellen-Spalten mit Features + Preis + CTA' },
] as const;

export type SectionType = (typeof SECTION_TYPES)[number]['key'];

/**
 * Standard-Section-Schema im content_json:
 *
 * {
 *   "sections": [
 *     { "id": "abc123", "type": "hero", "config": { ... } },
 *     { "id": "def456", "type": "features", "config": { ... } },
 *     ...
 *   ],
 *   "settings": {
 *     "theme": "light" | "dark",
 *     "container_width": "narrow" | "default" | "wide" | "full"
 *   }
 * }
 */
export type LpSection = {
  id: string;
  type: SectionType;
  config: Record<string, any>;
};

export type LpContent = {
  sections: LpSection[];
  settings?: {
    theme?: 'light' | 'dark';
    container_width?: 'narrow' | 'default' | 'wide' | 'full';
  };
};

/**
 * A/B-Conversion-Rate-Calc.
 * Returns null wenn keine Views.
 */
export function abStats(lp: any) {
  const va = Number(lp.ab_views_a || 0);
  const vb = Number(lp.ab_views_b || 0);
  const ca = Number(lp.ab_conversions_a || 0);
  const cb = Number(lp.ab_conversions_b || 0);
  return {
    views: { a: va, b: vb, total: va + vb },
    conversions: { a: ca, b: cb, total: ca + cb },
    rate: {
      a: va > 0 ? ca / va : 0,
      b: vb > 0 ? cb / vb : 0,
    },
    lift: vb > 0 && va > 0 ? ((cb / vb) / (ca / va) - 1) : 0,
    winner: ca / Math.max(va, 1) > cb / Math.max(vb, 1) ? 'a' : 'b',
  };
}
