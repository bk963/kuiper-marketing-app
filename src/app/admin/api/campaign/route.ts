/**
 * Content-Kampagne anlegen (→ Generator erzeugt per Opus) + Status/Freigabe.
 * POST   { thema, keywords[], kanaele[], gegner, region, zielperson } → status=angefragt
 * PATCH  { id, status }  (z.B. entwurf → freigegeben)
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { createTrackingRecord, patchTrackingRecord } from '@/lib/pb-tracking';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function guard(req: NextRequest) {
  const t = process.env.MARKETING_INTERNAL_TOKEN;
  if (t && req.headers.get('x-internal-token') === t) return true;
  try { await requireAdmin(); return true; } catch { return false; }
}
const arr = (v: any): string[] => (Array.isArray(v) ? v.map((x) => String(x).trim()).filter(Boolean) : String(v || '').split(',').map((x) => x.trim()).filter(Boolean));

export async function POST(req: NextRequest) {
  if (!(await guard(req))) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  let b: any = {}; try { b = await req.json(); } catch { return NextResponse.json({ error: 'invalid JSON' }, { status: 400 }); }
  const thema = String(b.thema || '').trim();
  if (!thema) return NextResponse.json({ error: 'Thema fehlt' }, { status: 400 });
  const rec = await createTrackingRecord('mkt_campaigns', {
    thema: thema.slice(0, 300), keywords: arr(b.keywords), kanaele: arr(b.kanaele).length ? arr(b.kanaele) : ['blog', 'linkedin', 'reel', 'whatsapp'],
    gegner: String(b.gegner || '').slice(0, 120), region: String(b.region || '').slice(0, 100), zielperson: String(b.zielperson || '').slice(0, 120),
    status: 'angefragt', pieces: {},
  });
  if (rec.error) return NextResponse.json({ ok: false, error: rec.error }, { status: 502 });
  return NextResponse.json({ ok: true, id: rec.record?.id });
}

export async function PATCH(req: NextRequest) {
  if (!(await guard(req))) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  let b: any = {}; try { b = await req.json(); } catch { return NextResponse.json({ error: 'invalid JSON' }, { status: 400 }); }
  if (!b.id || !b.status) return NextResponse.json({ error: 'id/status fehlt' }, { status: 400 });
  const r = await patchTrackingRecord('mkt_campaigns', b.id, { status: String(b.status).slice(0, 30) });
  if (!r.ok) return NextResponse.json({ ok: false, error: r.error }, { status: 502 });
  return NextResponse.json({ ok: true });
}
