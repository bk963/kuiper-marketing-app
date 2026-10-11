/**
 * GEO-Blöcke: Status/Freigabe + optional Textkorrektur.
 * PATCH { id, status }  oder  { id, antwort, vertiefung, quelle, kuiper_satz, frage }
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { patchTrackingRecord } from '@/lib/pb-tracking';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function guard(req: NextRequest) {
  const t = process.env.MARKETING_INTERNAL_TOKEN;
  if (t && req.headers.get('x-internal-token') === t) return true;
  try { await requireAdmin(); return true; } catch { return false; }
}
const FIELDS = ['status', 'frage', 'antwort', 'vertiefung', 'quelle', 'kuiper_satz', 'zielseite'];

export async function PATCH(req: NextRequest) {
  if (!(await guard(req))) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  let b: any = {}; try { b = await req.json(); } catch { return NextResponse.json({ error: 'invalid JSON' }, { status: 400 }); }
  if (!b.id) return NextResponse.json({ error: 'id fehlt' }, { status: 400 });
  const patch: Record<string, string> = {};
  for (const f of FIELDS) if (typeof b[f] === 'string') patch[f] = b[f];
  if (!Object.keys(patch).length) return NextResponse.json({ error: 'nichts zu ändern' }, { status: 400 });
  const r = await patchTrackingRecord('mkt_geo_blocks', String(b.id), patch);
  if (!r.ok) return NextResponse.json({ ok: false, error: r.error }, { status: 502 });
  return NextResponse.json({ ok: true });
}
