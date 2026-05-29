/**
 * /robots.txt — host-aware:
 *
 * marketing.kuiper-safety.de → Disallow /lp/* und /sitemap-lp.xml
 *   (LP-URLs sollen über kuiper-safety.de indexiert werden — canonical zeigt dorthin)
 * kuiper-safety.de via Caddy-Proxy → ungenutzt (Astro liefert eigene robots.txt)
 *
 * Editor (/admin/*) wird bei beiden Hosts disallowed weil sensitive.
 */
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const host = req.headers.get('host') || '';
  const isMarketing = host.includes('marketing.kuiper-safety.de');

  const lines: string[] = ['User-agent: *'];

  // /admin überall blocken
  lines.push('Disallow: /admin/');

  // LP-Pfade nur auf marketing-Domain blocken (Apex-Domain soll indexieren)
  if (isMarketing) {
    lines.push('Disallow: /lp/');
    lines.push('Disallow: /sitemap-lp.xml');
    lines.push('Disallow: /api/lp/');
  }

  // Sitemap nur auf Apex-Domain bekannt geben
  if (!isMarketing) {
    lines.push('');
    lines.push('Sitemap: https://kuiper-safety.de/sitemap.xml');
    lines.push('Sitemap: https://marketing.kuiper-safety.de/sitemap-lp.xml');
  }

  return new NextResponse(lines.join('\n') + '\n', {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=600, must-revalidate',
    },
  });
}
