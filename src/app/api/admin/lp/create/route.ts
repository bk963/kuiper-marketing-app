/**
 * Admin-LP-Create-Endpoint.
 *
 * POST /api/admin/lp/create
 * Body: { internal_name, slug, template_id, status, seo_title?, seo_description?, content_json? }
 *
 * Auth: requireAdmin (JWT-Cookie)
 * Path: PB-Superuser-Token
 *
 * Whitelist auf alle PB-required + sinnvolle Defaults:
 *  - migrated_from_crm=false (System-Default)
 *  - crm_source_id="" (kein CRM-Bezug)
 *  - ab_test_active=false (Default)
 *
 * Pendant zu PATCH /api/admin/lp/[id]. Recovery 2026-05-29 hat den
 * DB-Drift behoben → POST funktioniert wieder zuverlässig.
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

  // Required-Fields-Check (PB schema)
  const required = ['internal_name', 'slug', 'template_id', 'status'];
  const missing = required.filter(k => !body[k] || String(body[k]).trim().length === 0);
  if (missing.length) {
    return NextResponse.json({ error: 'missing required fields', missing }, { status: 400 });
  }

  const pbUrl = process.env.MPB_URL || 'https://pb.kuiper-safety.de';
  const su = await getSuperuserToken(pbUrl);
  if (!su) {
    return NextResponse.json({ error: 'PB-Superuser-Auth failed' }, { status: 500 });
  }

  const payload: Record<string, any> = {
    internal_name: String(body.internal_name).trim(),
    slug: String(body.slug).trim(),
    template_id: String(body.template_id).trim(),
    status: String(body.status).trim(),
    seo_title: body.seo_title ? String(body.seo_title).trim() : '',
    seo_description: body.seo_description ? String(body.seo_description).trim() : '',
    content_json: body.content_json || { sections: [] },
    ab_test_active: false,
    migrated_from_crm: false,
  };

  try {
    const r = await fetch(`${pbUrl}/api/collections/mkt_landingpages/records`, {
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
    return NextResponse.json({ ok: true, id: d.id, slug: d.slug });
  } catch (e: any) {
    return NextResponse.json({ error: 'fetch-error', detail: e?.message?.slice(0, 200) }, { status: 502 });
  }
}
