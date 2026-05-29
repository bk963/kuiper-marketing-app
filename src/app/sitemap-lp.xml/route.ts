/**
 * /sitemap-lp.xml — Sitemap aller live Landingpages aus mkt_landingpages.
 *
 * Liefert <urlset> mit allen LPs unter Apex-URL (https://kuiper-safety.de/lp/<slug>).
 * Über Caddy-Proxy auf kuiper-web-prod als kuiper-safety.de/sitemap-lp.xml erreichbar.
 *
 * Astro-Site referenziert diese als <sitemap><loc>.../sitemap-lp.xml</loc></sitemap>
 * im Sitemap-Index.
 *
 * LPs mit seo_noindex=true werden ausgeschlossen.
 */
import { NextResponse } from 'next/server';
import { mktLp } from '@/lib/mkt-lp';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET() {
  const { items } = await mktLp.landingpages({
    perPage: 500,
    filter: 'status="live"',
    sort: '-updated',
    fields: 'slug,seo_noindex,updated,published_at',
  });

  const now = new Date().toISOString();
  const urls = (items || [])
    .filter((lp: any) => lp.slug && !lp.seo_noindex)
    .map((lp: any) => {
      const slug = escapeXml(String(lp.slug));
      const lastmod = lp.updated || lp.published_at || now;
      // PB-DateString → ISO-konform für lastmod
      const lastmodIso = String(lastmod).replace(' ', 'T').replace(/\.\d+Z?$/, 'Z');
      return `  <url>
    <loc>https://kuiper-safety.de/lp/${slug}</loc>
    <lastmod>${escapeXml(lastmodIso)}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

  return new NextResponse(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=300, must-revalidate',
    },
  });
}
