import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import * as client from 'openid-client';
import {
  getConfig, readFlight, impersonateSuperuserByEmail, signSession,
  REDIRECT_URI, OIDC_FLIGHT_COOKIE, SESSION_COOKIE, SESSION_MAX_AGE,
} from '@/lib/oidc';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function publicBase(req: Request): string {
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host');
  const proto = req.headers.get('x-forwarded-proto') || 'https';
  return host ? `${proto}://${host}` : new URL(req.url).origin;
}

function fail(req: Request, error: string) {
  const url = new URL('/admin/login', publicBase(req));
  url.searchParams.set('error', error);
  return NextResponse.redirect(url, { status: 303 });
}

// Authentik-Rücksprung: Code einlösen, E-Mail-Claim prüfen, gegen die mpb-_superusers-
// Allow-List impersonieren → gleiche Session-Shape wie der Passwort-Login. Bei jedem
// Fehler zurück zum Login mit Hinweis (Passwort-Login bleibt als Fallback nutzbar).
export async function GET(req: Request) {
  try {
    const config = await getConfig();

    const flightToken = (await cookies()).get(OIDC_FLIGHT_COOKIE)?.value;
    const flight = flightToken ? await readFlight(flightToken) : null;
    if (!flight) return fail(req, 'Anmeldung abgelaufen, bitte erneut starten.');

    // Callback-URL mit allen Query-Params für openid-client rekonstruieren.
    const currentUrl = new URL(REDIRECT_URI);
    new URL(req.url).searchParams.forEach((v, k) => currentUrl.searchParams.set(k, v));

    const tokens = await client.authorizationCodeGrant(config, currentUrl, {
      pkceCodeVerifier: flight.verifier,
      expectedState: flight.state,
      expectedNonce: flight.nonce,
      idTokenExpected: true,
    });

    const claims = tokens.claims() as Record<string, unknown> | undefined;
    const email = String(claims?.email || '');
    if (!email) return fail(req, 'Kein E-Mail-Claim aus Kuiper-ID.');

    const pbToken = await impersonateSuperuserByEmail(email);
    if (!pbToken) return fail(req, 'Diese Kuiper-ID ist kein Marketing-Admin.');

    const session = await signSession(pbToken, email);
    const next = flight.next?.startsWith('/') ? flight.next : '/admin';
    const res = NextResponse.redirect(new URL(next, publicBase(req)), { status: 303 });
    res.cookies.set(SESSION_COOKIE, session, {
      httpOnly: true, secure: true, sameSite: 'lax', path: '/admin', maxAge: SESSION_MAX_AGE,
    });
    // Flight-Cookie entwerten.
    res.cookies.set(OIDC_FLIGHT_COOKIE, '', {
      httpOnly: true, secure: true, sameSite: 'lax', path: '/admin', maxAge: 0,
    });
    return res;
  } catch (e: unknown) {
    return fail(req, 'SSO-Login fehlgeschlagen: ' + (e instanceof Error ? e.message : ''));
  }
}
