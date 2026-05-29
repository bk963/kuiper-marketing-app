/**
 * Admin-LP-PATCH-Endpoint.
 *
 * PATCH /api/admin/lp/[id]
 * Body: { content_json?, seo_title?, seo_description?, status?,
 *         ab_test_active?, ab_variant_b? }
 *
 * Auth: requireAdmin (JWT-Cookie)
 * Path: PB-Superuser-Token (Collection-Rules sind admin-only)
 *
 * Whitelist auf editierbare Felder — Migration-Felder (crm_source_id,
 * migrated_from_crm) und System-Felder werden NIE überschrieben.
 *
 * Hinweis: Vermeidet bewusst POST (PM-festung untersucht ein PB-JS-Hook der
 * POST mkt_landingpages mit HTTP 400 blockt). PATCH funktioniert.
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

const ALLOWED_FIELDS = new Set([
  'content_json',
  'seo_title',
  'seo_description',
  'status',
  'ab_test_active',
  'ab_variant_b',
  'internal_name',
  'slug',
  'template_id',
  'campaign_id',
  'form_id',
  'linked_form_id',
  'published_at',
]);

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  // Admin-Auth
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { id } = await ctx.params;
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid JSON' }, { status: 400 });
  }

  // Whitelist filter
  const patch: Record<string, any> = {};
  for (const k of Object.keys(body)) {
    if (ALLOWED_FIELDS.has(k)) patch[k] = body[k];
  }
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'no allowed fields in body', allowed: [...ALLOWED_FIELDS] }, { status: 400 });
  }

  const pbUrl = process.env.MPB_URL || 'https://pb.kuiper-safety.de';
  const su = await getSuperuserToken(pbUrl);
  if (!su) {
    return NextResponse.json({
      error: 'PB-Superuser-Auth failed',
      hint: 'PB_BLOG_EMAIL/PASS env vars missing or wrong',
    }, { status: 500 });
  }

  try {
    const r = await fetch(`${pbUrl}/api/collections/mkt_landingpages/records/${id}`, {
      method: 'PATCH',
      headers: pbHeaders({ Authorization: su }),
      body: JSON.stringify(patch),
    });
    if (!r.ok) {
      const txt = await r.text();
      return NextResponse.json({
        error: 'PB-PATCH-fehlgeschlagen',
        status: r.status,
        body: txt.slice(0, 500),
      }, { status: 502 });
    }
    const d = await r.json();
    return NextResponse.json({ ok: true, id: d.id, updated: d.updated });
  } catch (e: any) {
    return NextResponse.json({ error: 'fetch-error', detail: e?.message?.slice(0, 200) }, { status: 502 });
  }
}
