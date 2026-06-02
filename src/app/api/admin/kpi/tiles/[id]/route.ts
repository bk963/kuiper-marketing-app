/**
 * DELETE /api/admin/kpi/tiles/[id]   → unpin
 * PATCH  /api/admin/kpi/tiles/[id]    → reorder: Body { position }
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { unpinTile, reorderTile } from '@/lib/kpi/tiles';

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
  const position = Number(body.position);
  if (!Number.isFinite(position)) return NextResponse.json({ error: 'position fehlt' }, { status: 400 });
  const { ok, error } = await reorderTile(id, position);
  if (!ok) return NextResponse.json({ error: error || 'reorder fehlgeschlagen' }, { status: 500 });
  return NextResponse.json({ ok: true });
}
