/**
 * Public-LP-Route: /lp/<slug>
 *
 * Ablauf:
 *  1. mkt_landingpages by slug (filter: slug="..." && status="live")
 *  2. A/B-Routing (Cookie-Sticky + 50/50-Split) — Phase 3f
 *  3. Render:
 *     - Wenn content_json.sections vorhanden → SectionRenderer (Editor-driven)
 *     - Sonst Slug-Fallback auf Default-Sections (generateBshDefaultSections())
 *  4. View-Increment (ab_views_a/b) — Phase 3f
 *
 * SEO:
 *  - Wenn lp.seo_title → Page-Title aus PB
 *  - Wenn lp.seo_noindex → robots noindex,nofollow
 */
import { notFound } from 'next/navigation';
import { mktLp } from '@/lib/mkt-lp';
import SectionRenderer from '@/components/lp/SectionRenderer';
import { generateBshDefaultSections } from '@/components/lp/sections/defaults';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type Props = { params: Promise<{ slug: string }> };

// Hardcoded-Slug-Fallback Metadata — gilt wenn kein PB-Record existiert.
// Wird in Phase 3e (Templates-Registry) in eine eigene Registry ausgelagert.
const HARDCODED_LP_META: Record<string, { title: string; description?: string }> = {
  'brandschutzhelfer-ausbildung': {
    title: 'Brandschutzhelfer Ausbildung von echten Feuerwehrmännern — Kuiper Brandschutz GmbH',
    description: 'Brandschutzhelfer Ausbildung bundesweit direkt bei Ihnen vor Ort. Praxisnah, mit Zertifikat nach DGUV 205-023 und ASR 2.2.',
  },
};

/** Slug → Default-Sections (Editor-driven Fallback ohne PB-Record). */
function getDefaultSectionsForSlug(slug: string) {
  if (slug === 'brandschutzhelfer-ausbildung') return generateBshDefaultSections();
  return null;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const { items } = await mktLp.landingpages({
    filter: `slug="${slug.replace(/"/g, '\\"')}"`,
    perPage: 1,
    fields: 'id,internal_name,seo_title,seo_description,seo_noindex,slug',
  });
  const lp = items[0];
  if (lp) {
    return {
      title: lp.seo_title || lp.internal_name || `LP: ${slug}`,
      description: lp.seo_description || undefined,
      robots: lp.seo_noindex ? 'noindex,nofollow' : undefined,
      alternates: { canonical: `https://kuiper-safety.de/lp/${slug}` },
    };
  }
  // Slug-Fallback (Demo-Modus ohne PB-Record)
  const hardcoded = HARDCODED_LP_META[slug];
  if (hardcoded) {
    return {
      title: hardcoded.title,
      description: hardcoded.description,
      robots: 'noindex,nofollow', // Demo-Marketing-App soll nicht in Google
      alternates: { canonical: `https://kuiper-safety.de/lp/${slug}` },
    };
  }
  return { title: 'Landingpage nicht gefunden' };
}

export default async function LpPage({ params }: Props) {
  const { slug } = await params;
  const { items, error } = await mktLp.landingpages({
    filter: `slug="${slug.replace(/"/g, '\\"')}"&&status="live"`,
    perPage: 1,
  });

  if (error) {
    console.error('[lp]', slug, error);
  }

  const lp = items[0];
  if (!lp) {
    // Slug-Fallback: brandschutzhelfer-ausbildung über Default-Sections sichtbar,
    // damit Bk SOFORT Pixel-Perfect-Demo sehen kann ohne erst LP in PB anlegen zu müssen.
    const defaults = getDefaultSectionsForSlug(slug);
    if (defaults) return <SectionRenderer lp={{ id: null, slug }} sections={defaults} />;
    notFound();
  }

  // Editor-driven: hat sections im content_json?
  const sections = lp.content_json?.sections || [];
  if (sections.length > 0) {
    return <SectionRenderer lp={lp} sections={sections} />;
  }

  // Slug-Defaults-Fallback (LP existiert in PB aber content_json ist leer)
  const defaults = getDefaultSectionsForSlug(slug);
  if (defaults) return <SectionRenderer lp={lp} sections={defaults} />;

  // Kein Template, keine Sections, kein Slug-Match → 404
  notFound();
}
