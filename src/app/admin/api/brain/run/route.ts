/**
 * POST /admin/api/brain/run
 * Löst den täglichen Marketing-Brain-Lauf aus: Signale → GEX44 → To-dos → pb-tracking.
 * Server-zu-Server via X-Internal-Token (Cron) ODER Admin-Cookie.
 * Optional Body: { days?: number }
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { runBrain } from '@/lib/brain';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const internalTok = process.env.MARKETING_INTERNAL_TOKEN;
  const internalOk = !!internalTok && req.headers.get('x-internal-token') === internalTok;
  if (!internalOk) {
    try { await requireAdmin(); } catch { return NextResponse.json({ error: 'unauthorized' }, { status: 401 }); }
  }
  let days = 28;
  try { const b = await req.json(); if (b?.days) days = Math.min(365, Math.max(7, Number(b.days))); } catch { /* kein Body ok */ }

  const res = await runBrain(days);
  if (!res.ok) return NextResponse.json({ ok: false, error: res.error }, { status: 502 });
  return NextResponse.json({ ok: true, report_date: res.report.report_date, summary: res.report.summary, todoCount: res.report.todos.length, id: res.report.id });
}
