/**
 * Kuiper-ID-SSO (Authentik OIDC) für das Marketing-Admin — additiv zum Passwort-Login.
 *
 * Flow: /admin/api/auth/oidc/login → Authentik → /callback. Auf dem Callback wird die
 * SSO-E-Mail gegen die mpb-_superusers-Allow-List geprüft und per Impersonation ein
 * echtes PocketBase-Token erzeugt (gleiche Session-Shape wie der Passwort-Login:
 * ks_admin_session = { pb, email, role }). Admin-Routen bleiben unverändert.
 *
 * Master-Cred für die Impersonation: TRACKING_PB_SUPERUSER_* (mpb == pb-tracking,
 * bereits in der ENV). Kein neues Credential nötig; neu nur AUTHENTIK_*.
 */
import * as client from 'openid-client';
import { SignJWT, jwtVerify } from 'jose';

const ISSUER = process.env.AUTHENTIK_ISSUER || 'https://account.kuiper-safety.com/application/o/marketing-oidc/';
const CLIENT_ID = process.env.AUTHENTIK_CLIENT_ID || '';
const CLIENT_SECRET = process.env.AUTHENTIK_CLIENT_SECRET || '';

export const PUBLIC_URL = process.env.MARKETING_PUBLIC_URL || 'https://marketing.kuiper-safety.de';
export const REDIRECT_URI = `${PUBLIC_URL}/admin/api/auth/oidc/callback`;

export const OIDC_FLIGHT_COOKIE = 'ks_oidc_flight';
export const SESSION_COOKIE = 'ks_admin_session';
export const SESSION_MAX_AGE = 7 * 24 * 60 * 60;

export function ssoConfigured(): boolean {
  return Boolean(CLIENT_ID && CLIENT_SECRET);
}

function secret() {
  const s = process.env.ADMIN_JWT_SECRET || 'change-me-please-min-32-chars-long-yo';
  return new TextEncoder().encode(s);
}

// openid-client-Discovery (einmalig gecached). Holt die Authentik-Endpoints vom Issuer.
let configPromise: Promise<client.Configuration> | undefined;
export async function getConfig(): Promise<client.Configuration> {
  if (!configPromise) {
    if (!ssoConfigured()) throw new Error('AUTHENTIK_CLIENT_ID / AUTHENTIK_CLIENT_SECRET nicht gesetzt');
    configPromise = client.discovery(new URL(ISSUER), CLIENT_ID, CLIENT_SECRET);
  }
  return configPromise;
}

// ── Flight-State (state/nonce/PKCE) als kurzlebiges signiertes httpOnly-Cookie ──
export type Flight = { state: string; nonce: string; verifier: string; next: string };

export async function signFlight(f: Flight): Promise<string> {
  return new SignJWT({ ...f })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('10m')
    .sign(secret());
}

export async function readFlight(token: string): Promise<Flight | null> {
  try {
    const { payload } = await jwtVerify(token, secret());
    return {
      state: String(payload.state || ''),
      nonce: String(payload.nonce || ''),
      verifier: String(payload.verifier || ''),
      next: String(payload.next || '/admin'),
    };
  } catch {
    return null;
  }
}

// Gleiche Session-Shape wie admin-auth.adminLogin → Admin-Routen brauchen keine Änderung.
export async function signSession(pbToken: string, email: string): Promise<string> {
  return new SignJWT({ pb: pbToken, email, role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(secret());
}

// CF-Access-Service-Token-Headers für Server-Side-Calls zu mpb (hinter Cloudflare Access).
function pbHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const h: Record<string, string> = { 'Content-Type': 'application/json', ...extra };
  if (process.env.PB_CF_ACCESS_CLIENT_ID) h['CF-Access-Client-Id'] = process.env.PB_CF_ACCESS_CLIENT_ID;
  if (process.env.PB_CF_ACCESS_CLIENT_SECRET) h['CF-Access-Client-Secret'] = process.env.PB_CF_ACCESS_CLIENT_SECRET;
  return h;
}

/**
 * Impersonation: Master-Superuser (Tracking-Cred) → per-User-PB-Token für die SSO-E-Mail,
 * NUR wenn die E-Mail ein mpb-_superuser ist (= Admin-Allow-List). Sonst null (kein Admin).
 */
export async function impersonateSuperuserByEmail(email: string): Promise<string | null> {
  const pbUrl = process.env.MPB_URL || process.env.TRACKING_PB_URL || 'https://pb-tracking.kuiper-safety.de';
  const masterEmail = process.env.TRACKING_PB_SUPERUSER_EMAIL || '';
  const masterPass = process.env.TRACKING_PB_SUPERUSER_PASSWORD || '';
  if (!masterEmail || !masterPass) {
    throw new Error('TRACKING_PB_SUPERUSER_EMAIL/PASSWORD nicht gesetzt (Master-Cred für Impersonation)');
  }

  // 1) Master-Superuser authentifizieren
  const authRes = await fetch(`${pbUrl}/api/collections/_superusers/auth-with-password`, {
    method: 'POST', headers: pbHeaders(), cache: 'no-store',
    body: JSON.stringify({ identity: masterEmail, password: masterPass }),
  });
  if (!authRes.ok) throw new Error(`Master-Auth gegen mpb fehlgeschlagen (HTTP ${authRes.status})`);
  const masterToken = (await authRes.json())?.token;
  if (!masterToken) throw new Error('Kein Master-Token von mpb');

  // 2) Ziel-_superuser per E-Mail finden (Allow-List; Anführungszeichen entfernt → kein Filter-Break)
  const filter = encodeURIComponent(`email="${email.replace(/"/g, '')}"`);
  const findRes = await fetch(`${pbUrl}/api/collections/_superusers/records?perPage=1&filter=${filter}`, {
    headers: pbHeaders({ Authorization: masterToken }), cache: 'no-store',
  });
  if (!findRes.ok) throw new Error(`_superusers-Lookup fehlgeschlagen (HTTP ${findRes.status})`);
  const item = (await findRes.json())?.items?.[0];
  if (!item?.id) return null; // kein Admin → kein Zugang

  // 3) Impersonieren → per-User-Token (gleiche TTL wie die Session)
  const impRes = await fetch(`${pbUrl}/api/collections/_superusers/impersonate/${item.id}`, {
    method: 'POST', headers: pbHeaders({ Authorization: masterToken }), cache: 'no-store',
    body: JSON.stringify({ duration: SESSION_MAX_AGE }),
  });
  if (!impRes.ok) throw new Error(`Impersonation fehlgeschlagen (HTTP ${impRes.status})`);
  const impToken = (await impRes.json())?.token;
  if (!impToken) throw new Error('Kein Impersonation-Token von mpb');
  return impToken;
}
