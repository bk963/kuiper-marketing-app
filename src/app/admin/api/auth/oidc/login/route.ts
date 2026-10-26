import { NextResponse } from 'next/server';
import * as client from 'openid-client';
import { getConfig, signFlight, REDIRECT_URI, OIDC_FLIGHT_COOKIE, ssoConfigured } from '@/lib/oidc';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function publicBase(req: Request): string {
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host');
  const proto = req.headers.get('x-forwarded-proto') || 'https';
  return host ? `${proto}://${host}` : new URL(req.url).origin;
}

function toLogin(req: Request, error: string) {
  const url = new URL('/admin/login', publicBase(req));
  url.searchParams.set('error', error);
  return NextResponse.redirect(url, { status: 303 });
}

// Startet den Kuiper-ID-Login: PKCE + state/nonce erzeugen, Flight als kurzlebiges
// signiertes httpOnly-Cookie ablegen, zur Authentik-Authorize-URL weiterleiten.
export async function GET(req: Request) {
  if (!ssoConfigured()) return toLogin(req, 'Kuiper-ID-Login ist nicht konfiguriert.');
  try {
    const config = await getConfig();
    const state = client.randomState();
    const nonce = client.randomNonce();
    const verifier = client.randomPKCECodeVerifier();
    const challenge = await client.calculatePKCECodeChallenge(verifier);

    const nextParam = new URL(req.url).searchParams.get('next');
    const next = nextParam && nextParam.startsWith('/') ? nextParam : '/admin';

    const authUrl = client.buildAuthorizationUrl(config, {
      redirect_uri: REDIRECT_URI,
      scope: 'openid email profile',
      state,
      nonce,
      code_challenge: challenge,
      code_challenge_method: 'S256',
    });

    const flight = await signFlight({ state, nonce, verifier, next });
    const res = NextResponse.redirect(authUrl.href, { status: 303 });
    res.cookies.set(OIDC_FLIGHT_COOKIE, flight, {
      httpOnly: true, secure: true, sameSite: 'lax', path: '/admin', maxAge: 600,
    });
    return res;
  } catch (e: unknown) {
    return toLogin(req, 'SSO-Konfiguration fehlerhaft: ' + (e instanceof Error ? e.message : ''));
  }
}
