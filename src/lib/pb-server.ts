/**
 * Server-Side PB-Helper mit Superuser-Token-Cache.
 *
 * Alle mkt_*-Collections haben admin-only Rules → CF-Access allein reicht nicht.
 * Lib holt + cacht Superuser-Token (5 min) und hängt ihn an jeden PB-Call.
 */
import { pbHeaders } from './admin-auth';

let _suToken: string | null = null;
let _suExpires = 0;

const PB = process.env.MPB_URL || 'https://pb.kuiper-safety.de';

async function getSuperuserToken(): Promise<string> {
  if (_suToken && Date.now() < _suExpires) return _suToken;
  const email = process.env.PB_BLOG_EMAIL || process.env.PB_SUPERUSER_EMAIL || '';
  const pass = process.env.PB_BLOG_PASS || process.env.PB_SUPERUSER_PASS || '';
  if (!email || !pass) return '';
  try {
    const r = await fetch(`${PB}/api/collections/_superusers/auth-with-password`, {
      method: 'POST',
      headers: pbHeaders(),
      body: JSON.stringify({ identity: email, password: pass }),
      cache: 'no-store',
    });
    if (r.ok) {
      const d = await r.json();
      _suToken = String(d.token || '');
      _suExpires = Date.now() + 5 * 60 * 1000;
      return _suToken;
    }
  } catch { /* swallow */ }
  return '';
}

export type ListOpts = { perPage?: number; filter?: string; sort?: string; fields?: string };

export async function pbList(collection: string, opts: ListOpts = {}): Promise<{ items: any[]; error?: string }> {
  const su = await getSuperuserToken();
  const params = new URLSearchParams();
  params.set('perPage', String(opts.perPage ?? 200));
  params.set('skipTotal', '1');
  if (opts.filter) params.set('filter', opts.filter);
  if (opts.sort) params.set('sort', opts.sort);
  if (opts.fields) params.set('fields', opts.fields);
  try {
    const r = await fetch(`${PB}/api/collections/${collection}/records?${params.toString()}`, {
      headers: pbHeaders({ Authorization: su }),
      cache: 'no-store',
    });
    if (!r.ok) return { items: [], error: `HTTP ${r.status}: ${(await r.text()).slice(0, 200)}` };
    const d = await r.json();
    return { items: d.items || [] };
  } catch (e: any) {
    return { items: [], error: e?.message?.slice(0, 200) || 'fetch error' };
  }
}

export async function pbCount(collection: string, filter = ''): Promise<number> {
  /**
   * PB v0.22 hat ständige 'Something went wrong while processing your request.'
   * bei `?perPage=1` (mit oder ohne filter). Workaround: immer Fallback-Pattern
   * mit skipTotal=1 + fields=id + perPage=500 und items.length zurückgeben.
   *
   * Trade-off: kein O(1) Counter mehr — aber 500-Items-Limit reicht für alle
   * aktuellen mkt_*-Collections. Für >500 Records wäre Pagination nötig.
   */
  const su = await getSuperuserToken();
  if (!su) return 0;
  try {
    const u = `${PB}/api/collections/${collection}/records?perPage=500&skipTotal=1&fields=id${filter ? `&filter=${encodeURIComponent(filter)}` : ''}`;
    const r = await fetch(u, { headers: pbHeaders({ Authorization: su }), cache: 'no-store' });
    if (!r.ok) return 0;
    const d = await r.json();
    return (d.items || []).length;
  } catch { return 0; }
}

export async function pbGet(collection: string, id: string): Promise<any | null> {
  const su = await getSuperuserToken();
  try {
    const r = await fetch(`${PB}/api/collections/${collection}/records/${id}`, {
      headers: pbHeaders({ Authorization: su }), cache: 'no-store',
    });
    if (!r.ok) return null;
    return await r.json();
  } catch { return null; }
}
