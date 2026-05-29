/**
 * Default-Sections-Generator.
 *
 * Generiert content_json.sections für eine fresh BSH-LP — alle 14 Sections
 * in Default-Reihenfolge mit Default-Configs aus BSH_DEFAULT_CONFIGS.
 *
 * Wird verwendet von:
 *  - /lp/[slug]/page.tsx als Slug-Fallback (Demo ohne PB-Record)
 *  - LP-Wizard "Aus Template anlegen" (Phase 3d-3)
 */
import { BSH_DEFAULT_CONFIGS, type BshSection, type BshSectionType } from './types';

/** Mini-UUID generator (kein crypto.randomUUID weil server-component-safe in alten Node) */
function uid(prefix = 'sec'): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Default-Section-Reihenfolge der BSH-LP (Pos 1-14). */
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

/** Generiert komplette BSH-Default-Sections inkl. IDs. */
export function generateBshDefaultSections(): BshSection[] {
  return BSH_DEFAULT_ORDER.map(type => ({
    id: uid(type),
    type,
    config: { ...BSH_DEFAULT_CONFIGS[type] },
  }));
}
