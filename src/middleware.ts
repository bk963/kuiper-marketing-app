import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const COOKIE_NAME = 'ks_admin_session';

export async function middleware(req: NextRequest) {
  const p = req.nextUrl.pathname;

  // x-pathname für Layout-Erkennung durchreichen
  const reqHeaders = new Headers(req.headers);
  reqHeaders.set('x-pathname', p);

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
