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
   * Phase 6 LP-URL-Architecture: marketing.kuiper-safety.de/lp/* → 301 kuiper-safety.de/lp/*
   *
   * Trigger nur bei direktem Request an marketing.kuiper-safety.de.
   * NICHT bei Caddy-Proxy von kuiper-web-prod — der setzt Custom-Marker-Header
   * `X-Lp-Proxy-From: kuiper-web-prod`. Sehr robust gegen Header-Mutationen
   * von Coolify/Traefik dazwischen.
   */
  if (p.startsWith('/lp/') || p === '/sitemap-lp.xml') {
    const host = req.headers.get('host') || '';
    const proxyMarker = req.headers.get('x-lp-proxy-from') || '';
    const isProxyFromWeb = proxyMarker === 'kuiper-web-prod';
    const isExternalDirect = host.includes('marketing.kuiper-safety.de') && !isProxyFromWeb;
    if (isExternalDirect) {
      const url = req.nextUrl.clone();
      url.host = 'kuiper-safety.de';
      url.port = '';
      url.protocol = 'https:';
      return NextResponse.redirect(url, 301);
    }
  }

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
