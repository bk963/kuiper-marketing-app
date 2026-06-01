/**
 * Default-Sections-Generator.
 *
 * Generiert content_json.sections für eine fresh BSH-LP — alle 14 Sections
 * in Default-Reihenfolge mit Default-Configs aus BSH_DEFAULT_CONFIGS.
 *
 * Wird verwendet von:
 *  - /lp/[slug]/page.tsx als Slug-Fallback (Demo ohne PB-Record)
 *  - LP-Wizard "Aus Template anlegen" (Phase 3d-3)
 *
 * V2 (2026-06-01): Optimierungs-Sandbox-Variante via Slug "brandschutzhelfer-ausbildung-v2".
 *   - Eigene Section-Order in BSH_V2_ORDER (start: 1:1 wie V1, iterativ überschreibbar)
 *   - Eigene Config-Overrides in BSH_V2_CONFIGS (start: nur Lead-Source-Trennung)
 *   - generateBshV2Sections() merged V1-Defaults mit V2-Overrides
 */
import { BSH_DEFAULT_CONFIGS, type BshSection, type BshSectionType } from './types';

/** Mini-UUID generator (kein crypto.randomUUID weil server-component-safe in alten Node) */
function uid(prefix = 'sec'): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Default-Section-Reihenfolge der BSH-LP V1 (Pos 1-14). */
export const BSH_DEFAULT_ORDER: BshSectionType[] = [
  'bsh-hero',
  'bsh-usps',
  'bsh-story',
  'bsh-member',
  'bsh-testi',
  'bsh-pe',
  'bsh-steps',
  'bsh-content',
  'bsh-hybrid',
  'bsh-team',
  'bsh-loc',
  'bsh-faq',
  'bsh-final',
  'bsh-open',
];

/** Generiert komplette BSH-Default-Sections inkl. IDs (V1). */
export function generateBshDefaultSections(): BshSection[] {
  return BSH_DEFAULT_ORDER.map(type => ({
    id: uid(type),
    type,
    config: { ...BSH_DEFAULT_CONFIGS[type] },
  }));
}

// ============================================================
// V2 — Optimierungs-Sandbox
// ============================================================

/**
 * Section-Order V2 — start identisch zu V1, iterativ anpassbar.
 * Beispiele zukünftiger Änderungen:
 *   - Section-Reihenfolge ändern (z.B. testi vor story für Trust-First)
 *   - Sections weglassen (z.B. bsh-pe wenn ProvenExpert-Widget nicht performt)
 *   - Neue Section-Types einführen (z.B. bsh-faq-jsonld als Schema.org-Variante)
 */
export const BSH_V2_ORDER: BshSectionType[] = [
  'bsh-hero',
  'bsh-usps',
  'bsh-story',
  'bsh-member',
  'bsh-testi',
  'bsh-pe',
  'bsh-steps',
  'bsh-content',
  'bsh-hybrid',
  'bsh-team',
  'bsh-loc',
  'bsh-faq',
  'bsh-final',
  'bsh-open',
];

/**
 * Section-Config-Overrides V2 (Iteration 3 — Astro-Pixel-Perfect-Baseline 2026-06-01).
 *
 * Bk-Direktive: V1-Astro auf /lp/brandschutzhelfer-ausbildung ist die Vorlage.
 * V2 soll INHALTLICH 1:1 wie V1-Astro sein (gleiche Texte/Listen/Reihenfolge) und nur
 * STYLE-Add-Ons als V2-Optimierungen tragen:
 *   - photoOverlap (Hand ragt über Story-Section)
 *   - fullColor (Member-Logos voll farbig)
 *   - sealImgSrc (PE statisches Award-Badge zusätzlich zum Widget)
 *   - customPlayButton (Clickfunnels-Style Play-Overlay)
 *
 * Alle früheren Text-/Listen-Overrides entfernt — V2 nutzt jetzt die unveränderten
 * V1-Default-Configs (= identisch zu Astro-Original-Inhalten).
 *
 * Plus: Lead-Source-/Form-ID-Trennung damit V2-Submits in CRM separat trackbar bleiben.
 */
export const BSH_V2_CONFIGS: Partial<Record<BshSectionType, any>> = {
  'bsh-hero': {
    // Sektions-Optimierung 1 (2026-06-01): Inhouse + Bundesweit-USP schärfer
    eyebrow: '★ Brandschutzhelfer-Ausbildung · Bundesweit · Inhouse vor Ort',
    headlinePre: 'Brandschutz von',
    headlineAccent: 'echten Feuerwehrmännern',
    subline: 'Wir kommen mit komplettem Equipment direkt zu Ihnen ins Unternehmen — bundesweit, ab 8 Teilnehmern. Praxisnah mit Zertifikat nach DGUV 205-023 und ASR 2.2.',
    formTitle: 'Jetzt unverbindlich Infos und Preise anfordern',
    // V2-Add-Ons:
    leadSource: 'bsh-lp-v2',
    formId: 'bsh-hero-v2',
    customPlayButton: true,
  },
  'bsh-story': {
    photoOverlap: true,
  },
  'bsh-member': {
    fullColor: true,
  },
  'bsh-pe': {
    // V1-Astro-Widget-Source bleibt (in BSH_DEFAULT_CONFIGS), nur Sticker-Add darüber.
    sealImgSrc: 'https://www.provenexpert.com/profile/de-de/sticker-2026/brown.svg',
    sealImgAlt: 'ProvenExpert · Von Kunden empfohlen 2026 · Kuiper Brandschutz',
    sealLinkHref: 'https://www.provenexpert.com/de-de/kuiper-brandschutz/',
  },
};

/**
 * Generiert V2-Sections — V1-Defaults gemerged mit V2-Overrides.
 * Per Section wird die V1-Default-Config genommen und dann mit dem V2-Override
 * gespread (override gewinnt). Section-Reihenfolge folgt BSH_V2_ORDER.
 */
export function generateBshV2Sections(): BshSection[] {
  return BSH_V2_ORDER.map(type => ({
    id: uid(type),
    type,
    config: {
      ...BSH_DEFAULT_CONFIGS[type],
      ...(BSH_V2_CONFIGS[type] || {}),
    },
  }));
}
