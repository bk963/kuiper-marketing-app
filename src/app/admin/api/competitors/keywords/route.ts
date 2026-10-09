/**
 * Keyword-Universum verwalten (mkt_keywords) — steuerbar aus dem Cockpit.
 * GET    → alle Keywords (gruppiert nutzbar)
 * POST   → neues Keyword { keyword, gruppe }
 * PATCH  → { id, aktiv? , gruppe? } ändern
 * DELETE → { id } löschen
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { listTrackingRecords, createTrackingRecord, patchTrackingRecord, deleteTrackingRecord } from '@/lib/pb-tracking';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function guard(req: NextRequest) {
  const t = process.env.MARKETING_INTERNAL_TOKEN;
  if (t && req.headers.get('x-internal-token') === t) return true;
  try { await requireAdmin(); return true; } catch { return false; }
}

export async function GET(req: NextRequest) {
  if (!(await guard(req))) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const r = await listTrackingRecords('mkt_keywords', { sort: 'gruppe,keyword', perPage: 500 });
  return NextResponse.json({ ok: true, items: (r as any)?.items || [] });
}

export async function POST(req: NextRequest) {
  if (!(await guard(req))) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  let b: any = {}; try { b = await req.json(); } catch { return NextResponse.json({ error: 'invalid JSON' }, { status: 400 }); }
  const keyword = String(b.keyword || '').trim();
  if (!keyword) return NextResponse.json({ error: 'keyword fehlt' }, { status: 400 });
  const rec = await createTrackingRecord('mkt_keywords', {
    keyword: keyword.slice(0, 120), gruppe: String(b.gruppe || 'sonstige').slice(0, 30), aktiv: b.aktiv !== false,
  });
  if (rec.error) return NextResponse.json({ ok: false, error: rec.error }, { status: 502 });
  return NextResponse.json({ ok: true, id: rec.record?.id });
}

export async function PATCH(req: NextRequest) {
  if (!(await guard(req))) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  let b: any = {}; try { b = await req.json(); } catch { return NextResponse.json({ error: 'invalid JSON' }, { status: 400 }); }
  if (!b.id) return NextResponse.json({ error: 'id fehlt' }, { status: 400 });
  const patch: any = {};
  if (b.aktiv !== undefined) patch.aktiv = !!b.aktiv;
  if (b.gruppe) patch.gruppe = String(b.gruppe).slice(0, 30);
  const r = await patchTrackingRecord('mkt_keywords', b.id, patch);
  if (!r.ok) return NextResponse.json({ ok: false, error: r.error }, { status: 502 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  if (!(await guard(req))) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  let b: any = {}; try { b = await req.json(); } catch { return NextResponse.json({ error: 'invalid JSON' }, { status: 400 }); }
  if (!b.id) return NextResponse.json({ error: 'id fehlt' }, { status: 400 });
  const r = await deleteTrackingRecord('mkt_keywords', b.id);
  if (!r.ok) return NextResponse.json({ ok: false, error: r.error }, { status: 502 });
  return NextResponse.json({ ok: true });
}
