/**
 * Ausrichtung speichern (Ziele/Gegner/Fokus bearbeiten).
 * PATCH { id?, keil, region, zielperson, ziel_score, ziel_leads, fokus_gruppen[], gegner[] }
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { listTrackingRecords, createTrackingRecord, patchTrackingRecord } from '@/lib/pb-tracking';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function guard(req: NextRequest) {
  const t = process.env.MARKETING_INTERNAL_TOKEN;
  if (t && req.headers.get('x-internal-token') === t) return true;
  try { await requireAdmin(); return true; } catch { return false; }
}

const arr = (v: any): string[] => (Array.isArray(v) ? v.map((x) => String(x).trim()).filter(Boolean) : []);

export async function PATCH(req: NextRequest) {
  if (!(await guard(req))) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  let b: any = {}; try { b = await req.json(); } catch { return NextResponse.json({ error: 'invalid JSON' }, { status: 400 }); }
  const body = {
    keil: String(b.keil || '').slice(0, 200),
    region: String(b.region || '').slice(0, 100),
    zielperson: String(b.zielperson || '').slice(0, 120),
    ziel_score: Math.max(0, Math.min(100, Number(b.ziel_score) || 0)),
    ziel_leads: Math.max(0, Number(b.ziel_leads) || 0),
    fokus_gruppen: arr(b.fokus_gruppen).slice(0, 10),
    gegner: arr(b.gegner).slice(0, 10),
    aktiv: true,
  };
  try {
    let id = b.id;
    if (!id) {
      const r = await listTrackingRecords('mkt_ausrichtung', { sort: '-created', perPage: 1 });
      id = (r as any)?.items?.[0]?.id;
    }
    if (id) { const r = await patchTrackingRecord('mkt_ausrichtung', id, body); if (!r.ok) throw new Error(r.error); }
    else { const r = await createTrackingRecord('mkt_ausrichtung', body); if (r.error) throw new Error(r.error); }
    return NextResponse.json({ ok: true });
  } catch (e: any) { return NextResponse.json({ ok: false, error: e?.message || 'Fehler' }, { status: 502 }); }
}
