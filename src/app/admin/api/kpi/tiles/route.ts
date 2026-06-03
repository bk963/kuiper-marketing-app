/**
 * GET  /api/admin/kpi/tiles        → { tiles }
 * POST /api/admin/kpi/tiles         → pin: Body { spec, span?, viz? } → { tile }
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, getAdminSession } from '@/lib/admin-auth';
import { listTiles, pinTile } from '@/lib/kpi/tiles';
import type { QuerySpec } from '@/lib/kpi/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try { await requireAdmin(); } catch { return NextResponse.json({ error: 'unauthorized' }, { status: 401 }); }
  const { tiles, error } = await listTiles();
  if (error) return NextResponse.json({ tiles: [], error }, { status: 200 });
  return NextResponse.json({ tiles });
}

export async function POST(req: NextRequest) {
  let session;
  try { await requireAdmin(); session = await getAdminSession(); }
  catch { return NextResponse.json({ error: 'unauthorized' }, { status: 401 }); }

  let body: any = {};
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'invalid JSON' }, { status: 400 }); }
  const spec = body.spec as QuerySpec;
  if (!spec || !spec.metric) return NextResponse.json({ error: 'spec.metric fehlt' }, { status: 400 });

  const span = body.span === 2 ? 2 : 1;
  const viz = ['number', 'line', 'bar', 'auto'].includes(body.viz) ? body.viz : 'auto';
  const { tile, error } = await pinTile(spec, session?.email || 'admin', { span, viz });
  if (error || !tile) return NextResponse.json({ error: error || 'pin fehlgeschlagen' }, { status: 500 });
  return NextResponse.json({ tile });
}
