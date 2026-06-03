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

/**
 * Generic list-Helper für Tracking-Collections (T5 — Admin-Dashboards).
 * Nutzt skipTotal=1 + perPage Workaround für PB v0.22-Bug.
 */
export async function listTrackingRecords(collection: string, opts?: {
  perPage?: number;
  page?: number;
  sort?: string;
  filter?: string;
  fields?: string;
}): Promise<{ items: any[]; totalItems?: number; page?: number; perPage?: number; totalPages?: number } | null> {
  const perPage = opts?.perPage ?? 100;
  const page = opts?.page ?? 1;
  const params = new URLSearchParams({ perPage: String(perPage), page: String(page), skipTotal: '1' });
  if (opts?.sort) params.set('sort', opts.sort);
  if (opts?.filter) params.set('filter', opts.filter);
  if (opts?.fields) params.set('fields', opts.fields);
  try {
    const r = await fetch(`${PB}/api/collections/${collection}/records?${params.toString()}`, {
      headers: await authHeaders(),
      cache: 'no-store',
    });
    if (!r.ok) return null;
    return await r.json();
  } catch {
    return null;
  }
}

/** Generisch: Record anlegen (für KPI-Tiles — pb-tracking-PB ist schreibfähig). */
export async function createTrackingRecord(collection: string, body: Record<string, any>): Promise<{ record?: any; error?: string }> {
  try {
    const r = await fetch(`${PB}/api/collections/${collection}/records`, {
      method: 'POST', headers: await authHeaders(), body: JSON.stringify(body),
    });
    if (!r.ok) return { error: `HTTP ${r.status}: ${(await r.text()).slice(0, 200)}` };
    return { record: await r.json() };
  } catch (e: any) { return { error: e?.message?.slice(0, 200) || 'create error' }; }
}

/** Generisch: Record patchen. */
export async function patchTrackingRecord(collection: string, id: string, body: Record<string, any>): Promise<{ ok: boolean; error?: string }> {
  try {
    const r = await fetch(`${PB}/api/collections/${collection}/records/${id}`, {
      method: 'PATCH', headers: await authHeaders(), body: JSON.stringify(body),
    });
    if (!r.ok) return { ok: false, error: `HTTP ${r.status}` };
    return { ok: true };
  } catch (e: any) { return { ok: false, error: e?.message?.slice(0, 200) || 'patch error' }; }
}

/** Generisch: Record löschen. */
export async function deleteTrackingRecord(collection: string, id: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const r = await fetch(`${PB}/api/collections/${collection}/records/${id}`, {
      method: 'DELETE', headers: await authHeaders(),
    });
    if (!r.ok) return { ok: false, error: `HTTP ${r.status}` };
    return { ok: true };
  } catch (e: any) { return { ok: false, error: e?.message?.slice(0, 200) || 'delete error' }; }
}

/** Count-Helper — perPage=1 für totalItems ohne Datenload. */
export async function countTrackingRecords(collection: string, filter?: string): Promise<number> {
  const params = new URLSearchParams({ perPage: '1', page: '1' });
  if (filter) params.set('filter', filter);
  try {
    const r = await fetch(`${PB}/api/collections/${collection}/records?${params.toString()}`, {
      headers: await authHeaders(),
      cache: 'no-store',
    });
    if (!r.ok) return 0;
    const d = await r.json();
    return Number(d.totalItems || 0);
  } catch {
    return 0;
  }
}
