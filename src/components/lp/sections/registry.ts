/**
 * Section-Registry für SectionRenderer.
 *
 * Maps content_json.sections[].type → Component.
 * Editor (Phase 3d-3) nutzt BSH_SECTION_CATALOG aus types.ts für die Auswahl-UI.
 *
 * IMPORTANT: Wenn neue Section-Types hinzukommen, hier UND in types.ts ergänzen.
 */
import type { BshSectionType } from './types';

import HeroBshSection from './HeroBshSection';
import UspsBshSection from './UspsBshSection';
import StoryBshSection from './StoryBshSection';
import MemberBshSection from './MemberBshSection';
import TestiBshSection from './TestiBshSection';
import PeBshSection from './PeBshSection';
import StepsBshSection from './StepsBshSection';
import ContentBshSection from './ContentBshSection';
import HybridBshSection from './HybridBshSection';
import TeamBshSection from './TeamBshSection';
import LocBshSection from './LocBshSection';
import FaqBshSection from './FaqBshSection';
import FinalBshSection from './FinalBshSection';
import OpenBshSection from './OpenBshSection';

export const SECTION_COMPONENTS: Record<BshSectionType, React.ComponentType<{ config: any; lpId?: string }>> = {
  'bsh-hero': HeroBshSection,
  'bsh-usps': UspsBshSection,
  'bsh-story': StoryBshSection,
  'bsh-member': MemberBshSection,
  'bsh-testi': TestiBshSection,
  'bsh-pe': PeBshSection,
  'bsh-steps': StepsBshSection,
  'bsh-content': ContentBshSection,
  'bsh-hybrid': HybridBshSection,
  'bsh-team': TeamBshSection,
  'bsh-loc': LocBshSection,
  'bsh-faq': FaqBshSection,
  'bsh-final': FinalBshSection,
  'bsh-open': OpenBshSection,
};
