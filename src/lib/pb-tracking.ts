/**
 * Server-Side Client für pb-tracking (eigene PB-Instanz auf web-prod / pb-tracking.kuiper-safety.de).
 *
 * Schreibt in Tracking-Collections (bsh_visits, marketing_lead_submissions, tracking_webhooks).
 * Service-Superuser "crm-writeback@kuiper-safety.de" — siehe /root/.kuiper-secrets/tracking-pb-writeback.env.
 *
 * Phase T1 (2026-05-30): Tracking-Backend `/api/track/event` nutzt diesen Client
 * für bsh_visits write/update.
 *
 * Auth-Token wird 5 min gecacht (gleiches Pattern wie pb-server.ts).
 */
let _token: string | null = null;
let _expires = 0;

const PB = process.env.TRACKING_PB_URL || 'https://pb-tracking.kuiper-safety.de';

async function getToken(): Promise<string> {
  if (_token && Date.now() < _expires) return _token;
  const email = process.env.TRACKING_PB_SUPERUSER_EMAIL || '';
  const pass = process.env.TRACKING_PB_SUPERUSER_PASSWORD || '';
  if (!email || !pass) return '';
  try {
    const r = await fetch(`${PB}/api/collections/_superusers/auth-with-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identity: email, password: pass }),
      cache: 'no-store',
    });
    if (!r.ok) return '';
    const d = await r.json();
    _token = String(d.token || '');
    _expires = Date.now() + 5 * 60 * 1000;
    return _token;
  } catch {
    return '';
  }
}

export type TrackingHeaders = Record<string, string>;

async function authHeaders(): Promise<TrackingHeaders> {
  const t = await getToken();
  const h: TrackingHeaders = { 'Content-Type': 'application/json' };
  if (t) h['Authorization'] = t;
  return h;
}

/** Find bsh_visits-Record by session_id (für upsert beim Page-View). */
export async function findVisitBySession(sessionId: string): Promise<any | null> {
  if (!sessionId) return null;
  try {
    const filter = encodeURIComponent(`session_id="${sessionId.replace(/"/g, '\\"')}"`);
    const r = await fetch(`${PB}/api/collections/bsh_visits/records?perPage=1&filter=${filter}&skipTotal=1`, {
      headers: await authHeaders(),
      cache: 'no-store',
    });
    if (!r.ok) return null;
    const d = await r.json();
    return d.items?.[0] || null;
  } catch {
    return null;
  }
}

/** Create new bsh_visits record. */
export async function createVisit(body: Record<string, any>): Promise<any | null> {
  try {
    const r = await fetch(`${PB}/api/collections/bsh_visits/records`, {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify(body),
    });
    if (!r.ok) return null;
    return await r.json();
  } catch {
    return null;
  }
}

/** Patch existing bsh_visits record. */
export async function patchVisit(id: string, body: Record<string, any>): Promise<any | null> {
  try {
    const r = await fetch(`${PB}/api/collections/bsh_visits/records/${id}`, {
      method: 'PATCH',
      headers: await authHeaders(),
      body: JSON.stringify(body),
    });
    if (!r.ok) return null;
    return await r.json();
  } catch {
    return null;
  }
}
