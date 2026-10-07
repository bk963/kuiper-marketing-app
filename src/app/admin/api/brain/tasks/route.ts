/**
 * Marketing-Brain Auftrags-Queue.
 * POST   → neuen Auftrag anlegen (To-do/Maßnahme „an Claude beauftragen")
 * GET    → Aufträge listen
 * PATCH  → Status ändern (verwerfen etc.)  Body: { id, status }
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { createTrackingRecord, listTrackingRecords, patchTrackingRecord } from '@/lib/pb-tracking';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function guard(req: NextRequest) {
  const t = process.env.MARKETING_INTERNAL_TOKEN;
  if (t && req.headers.get('x-internal-token') === t) return true;
  try { await requireAdmin(); return true; } catch { return false; }
}

export async function POST(req: NextRequest) {
  if (!(await guard(req))) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  let b: any = {};
  try { b = await req.json(); } catch { return NextResponse.json({ error: 'invalid JSON' }, { status: 400 }); }
  if (!b.title) return NextResponse.json({ error: 'title fehlt' }, { status: 400 });
  const rec = await createTrackingRecord('mkt_brain_tasks', {
    title: String(b.title).slice(0, 300),
    category: String(b.category || '').slice(0, 40),
    action: String(b.action || '').slice(0, 2000),
    why: String(b.why || '').slice(0, 2000),
    priority: Number(b.priority) || 0,
    impact: String(b.impact || '').slice(0, 20),
    effort: String(b.effort || '').slice(0, 20),
    source: String(b.source || 'brain').slice(0, 20),
    status: 'beauftragt',
    assigned_by: 'cockpit',
  });
  if (rec.error) return NextResponse.json({ ok: false, error: rec.error }, { status: 502 });
  return NextResponse.json({ ok: true, id: rec.record?.id });
}

export async function GET(req: NextRequest) {
  if (!(await guard(req))) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const r = await listTrackingRecords('mkt_brain_tasks', { sort: '-created', perPage: 100 });
  return NextResponse.json({ ok: true, items: (r as any)?.items || [] });
}

export async function PATCH(req: NextRequest) {
  if (!(await guard(req))) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  let b: any = {};
  try { b = await req.json(); } catch { return NextResponse.json({ error: 'invalid JSON' }, { status: 400 }); }
  if (!b.id) return NextResponse.json({ error: 'id fehlt' }, { status: 400 });
  const patch: any = {};
  if (b.status) patch.status = String(b.status).slice(0, 20);
  if (b.result !== undefined) patch.result = String(b.result).slice(0, 4000);
  const r = await patchTrackingRecord('mkt_brain_tasks', b.id, patch);
  if (!r.ok) return NextResponse.json({ ok: false, error: r.error }, { status: 502 });
  return NextResponse.json({ ok: true });
}
