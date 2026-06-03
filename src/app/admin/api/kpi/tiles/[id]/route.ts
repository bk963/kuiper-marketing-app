/**
 * DELETE /admin/api/kpi/tiles/[id]   → unpin
 * PATCH  /admin/api/kpi/tiles/[id]    → update: Body { position?, span? }
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { unpinTile, updateTile } from '@/lib/kpi/tiles';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try { await requireAdmin(); } catch { return NextResponse.json({ error: 'unauthorized' }, { status: 401 }); }
  const { id } = await params;
  const { ok, error } = await unpinTile(id);
  if (!ok) return NextResponse.json({ error: error || 'unpin fehlgeschlagen' }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try { await requireAdmin(); } catch { return NextResponse.json({ error: 'unauthorized' }, { status: 401 }); }
  const { id } = await params;
  let body: any = {};
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'invalid JSON' }, { status: 400 }); }
  const fields: { position?: number; span?: number } = {};
  if (Number.isFinite(Number(body.position))) fields.position = Number(body.position);
  if (body.span === 1 || body.span === 2) fields.span = body.span;
  if (!('position' in fields) && !('span' in fields)) return NextResponse.json({ error: 'position oder span nötig' }, { status: 400 });
  const { ok, error } = await updateTile(id, fields);
  if (!ok) return NextResponse.json({ error: error || 'update fehlgeschlagen' }, { status: 500 });
  return NextResponse.json({ ok: true });
}
