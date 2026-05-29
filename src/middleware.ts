import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const COOKIE_NAME = 'ks_admin_session';

export async function middleware(req: NextRequest) {
  const p = req.nextUrl.pathname;

  // x-pathname für Layout-Erkennung durchreichen
  const reqHeaders = new Headers(req.headers);
  reqHeaders.set('x-pathname', p);

  /**
   * Phase 6 LP-URL-Architecture VERSCHOBEN auf Folge-Sprint:
   * Multi-Layer-Proxy (Cloudflare → Caddy auf kuiper-web-prod → Coolify-Traefik
   * → Next.js) strippt Custom-Marker-Header X-Lp-Proxy-From zwischen Caddy und
   * Marketing-App-Receiver. Direkt-Test mit -H "X-Lp-Proxy-From: kuiper-web-prod"
   * → 200 (Middleware-Logik korrekt), via Proxy → 301-Loop (Marker fehlt).
   *
   * Alternative-Strategien für Folge-Sprint:
   *  - robots.txt auf marketing.kuiper-safety.de noindex /lp/* (SEO-Schutz reicht)
   *  - Coolify-Traefik-Middleware mit IP-Whitelist (Caddy-IP allow, sonst 301)
   *  - Cloudflare-Worker auf marketing.kuiper-safety.de der vor Next.js 301 setzt
   *
   * SEO-Risiko aktuell: minimal — marketing.kuiper-safety.de/lp/* war nur kurzzeitig
   * live (heute Sprint), kein Google-Crawl in der Zwischenzeit. Canonical-Tag
   * (Phase 4) genügt um beide URLs dem gleichen Inhalt zuzuweisen.
   */

  // Root / leitet zum Admin-Bereich
  if (p === '/') {
    return NextResponse.redirect(new URL('/admin', req.url));
  }

  // Public: /admin/login + /admin/api/auth/* + non-admin static
  const isPublicAdmin = p === '/admin/login' || p.startsWith('/admin/api/auth/');
  if (!p.startsWith('/admin') || isPublicAdmin) {
    return NextResponse.next({ request: { headers: reqHeaders } });
  }

  const c = req.cookies.get(COOKIE_NAME)?.value;
  if (!c) return NextResponse.redirect(new URL('/admin/login', req.url));
  try {
    const secret = new TextEncoder().encode(process.env.ADMIN_JWT_SECRET || 'change-me-please-min-32-chars-long-yo');
    await jwtVerify(c, secret);
    return NextResponse.next({ request: { headers: reqHeaders } });
  } catch {
    return NextResponse.redirect(new URL('/admin/login', req.url));
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon|brand|scripts).*)'],
};
