/**
 * Admin-Baustein-Create-Endpoint.
 *
 * POST /api/admin/baustein/create
 * Body: { name, description?, type, status, content_json? }
 *
 * Auth: requireAdmin (JWT-Cookie)
 * Path: PB-Superuser-Token
 *
 * Schema-Hinweis: mkt_lp_bausteine.type wurde am 2026-05-29 erweitert von
 * 8 Legacy-Values auf 22 (Legacy + 14 BSH bsh-* Values).
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, pbHeaders } from '@/lib/admin-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

let _suToken: string | null = null;
let _suExpires = 0;

async function getSuperuserToken(pbUrl: string): Promise<string> {
  if (_suToken && Date.now() < _suExpires) return _suToken;
  const email = process.env.PB_BLOG_EMAIL || process.env.PB_SUPERUSER_EMAIL || '';
  const pass = process.env.PB_BLOG_PASS || process.env.PB_SUPERUSER_PASS || '';
  if (!email || !pass) return '';
  try {
    const r = await fetch(`${pbUrl}/api/collections/_superusers/auth-with-password`, {
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

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  let body: any = {};
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'invalid JSON' }, { status: 400 }); }

  if (!body.name || String(body.name).trim().length === 0) {
    return NextResponse.json({ error: 'name required' }, { status: 400 });
  }

  const pbUrl = process.env.MPB_URL || 'https://pb.kuiper-safety.de';
  const su = await getSuperuserToken(pbUrl);
  if (!su) return NextResponse.json({ error: 'PB-Superuser-Auth failed' }, { status: 500 });

  const payload: Record<string, any> = {
    name: String(body.name).trim(),
    description: body.description ? String(body.description).trim() : '',
    type: body.type || 'bsh-hero',
    status: body.status || 'draft',
    content_json: body.content_json || {},
    migrated_from_crm: false,
  };

  try {
    const r = await fetch(`${pbUrl}/api/collections/mkt_lp_bausteine/records`, {
      method: 'POST',
      headers: pbHeaders({ Authorization: su }),
      body: JSON.stringify(payload),
    });
    if (!r.ok) {
      const txt = await r.text();
      return NextResponse.json({
        error: 'PB-POST-fehlgeschlagen',
        status: r.status,
        body: txt.slice(0, 500),
      }, { status: 502 });
    }
    const d = await r.json();
    return NextResponse.json({ ok: true, id: d.id });
  } catch (e: any) {
    return NextResponse.json({ error: 'fetch-error', detail: e?.message?.slice(0, 200) }, { status: 502 });
  }
}
