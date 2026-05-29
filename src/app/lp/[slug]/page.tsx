/**
 * Public-LP-Route: /lp/<slug>
 *
 * Ablauf:
 *  1. mkt_landingpages by slug (filter: slug="..." && status="live")
 *  2. A/B-Routing (Cookie-Sticky + 50/50-Split) — Phase 3f
 *  3. Render:
 *     - Wenn content_json.sections vorhanden → SectionRenderer (Editor-driven)
 *     - Sonst Fallback auf Slug-spezifisches React-Template
 *       (heute: brandschutzhelfer-ausbildung → BshTemplate als 1:1-Port)
 *  4. View-Increment (ab_views_a/b) — Phase 3f
 *
 * SEO:
 *  - Wenn lp.seo_title → Page-Title aus PB
 *  - Wenn lp.seo_noindex → robots noindex,nofollow
 */
import { notFound } from 'next/navigation';
import { mktLp } from '@/lib/mkt-lp';
import BshTemplate from '@/components/lp/BshTemplate';
import SectionRenderer from '@/components/lp/SectionRenderer';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const { items } = await mktLp.landingpages({
    filter: `slug="${slug.replace(/"/g, '\\"')}"`,
    perPage: 1,
    fields: 'id,internal_name,seo_title,seo_description,seo_noindex,slug',
  });
  const lp = items[0];
  if (!lp) return { title: 'Landingpage nicht gefunden' };
  return {
    title: lp.seo_title || lp.internal_name || `LP: ${slug}`,
    description: lp.seo_description || undefined,
    robots: lp.seo_noindex ? 'noindex,nofollow' : undefined,
    alternates: { canonical: `https://kuiper-safety.de/lp/${slug}` },
  };
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
    // Slug-Fallback: brandschutzhelfer-ausbildung hartcodiert auch ohne PB-Record sichtbar,
    // damit Bk SOFORT Pixel-Perfect-Demo sehen kann ohne erst LP in PB anlegen zu müssen.
    if (slug === 'brandschutzhelfer-ausbildung') {
      return <BshTemplate slug={slug} formAction="/api/lp/lead" />;
    }
    notFound();
  }

  // Editor-driven: hat sections im content_json?
  const sections = lp.content_json?.sections || [];
  if (sections.length > 0) {
    return <SectionRenderer lp={lp} sections={sections} />;
  }

  // Hardcoded-Slug-Template-Fallback (BSH-LP Pixel-Perfect-Clone)
  if (slug === 'brandschutzhelfer-ausbildung') {
    return <BshTemplate slug={slug} formAction="/api/lp/lead" lpId={lp.id} />;
  }

  // Kein Template, keine Sections, kein Slug-Match → 404
  notFound();
}
