/**
 * Admin-Authentication für /admin/* Routes.
 *
 * Auth-Flow:
 * 1. Login-Form POST → /admin/api/auth/login
 * 2. Auth gegen PB Superuser
 * 3. Bei Erfolg: signed JWT in httpOnly-Cookie (1h)
 * 4. Middleware validiert Cookie auf /admin/*
 * 5. Logout: Cookie löschen
 *
 * PageSpeed-Garantie: dieser Code wird NUR in der /admin-Route-Group
 * gebundelt — keine Auswirkung auf Public-Pages.
 */
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const COOKIE_NAME = 'ks_admin_session';
const SESSION_DURATION_S = 60 * 60; // 1 Stunde

function getSecret() {
  const s = process.env.ADMIN_JWT_SECRET || 'change-me-please-min-32-chars-long-yo';
  return new TextEncoder().encode(s);
}

/**
 * Cloudflare-Access-Service-Token-Headers für Server-Side-Calls zu PB.
 * pb.kuiper-safety.de ist hinter CF Access — diese Headers passen den Edge.
 */
export function pbHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const h: Record<string, string> = { 'Content-Type': 'application/json', ...extra };
  if (process.env.PB_CF_ACCESS_CLIENT_ID) h['CF-Access-Client-Id'] = process.env.PB_CF_ACCESS_CLIENT_ID;
  if (process.env.PB_CF_ACCESS_CLIENT_SECRET) h['CF-Access-Client-Secret'] = process.env.PB_CF_ACCESS_CLIENT_SECRET;
  return h;
}

export async function adminLogin(email: string, password: string): Promise<{ ok: true } | { ok: false; error: string }> {
  // PB-Auth gegen Marketing-PocketBase. CF-Access nötig.
  const pbUrl = process.env.MPB_URL || process.env.PB_INTERNAL_URL || 'https://mpb.kuiper-safety.de';
  try {
    const res = await fetch(`${pbUrl}/api/collections/_superusers/auth-with-password`, {
      method: 'POST',
      headers: pbHeaders(),
      body: JSON.stringify({ identity: email, password }),
      cache: 'no-store',
    });
    if (!res.ok) {
      const txt = await res.text();
      return { ok: false, error: `Login fehlgeschlagen (HTTP ${res.status}). ${txt.slice(0, 100)}` };
    }
    const data = await res.json();
    if (!data.token) return { ok: false, error: 'Kein Token vom PocketBase.' };

    // Eigenes JWT signieren (mit PB-Token + Ablauf-Zeit)
    const jwt = await new SignJWT({ pb: data.token, email, role: 'admin' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(`${SESSION_DURATION_S}s`)
      .sign(getSecret());

    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, jwt, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/admin',
      maxAge: SESSION_DURATION_S,
    });
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Verbindungsfehler' };
  }
}

export async function adminLogout() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getAdminSession(): Promise<{ email: string; pbToken: string } | null> {
  const cookieStore = await cookies();
  const c = cookieStore.get(COOKIE_NAME);
  if (!c) return null;
  try {
    const { payload } = await jwtVerify(c.value, getSecret());
    return { email: String(payload.email || ''), pbToken: String(payload.pb || '') };
  } catch {
    return null;
  }
}

export async function requireAdmin() {
  const s = await getAdminSession();
  if (!s) redirect('/admin/login');
  return s;
}
