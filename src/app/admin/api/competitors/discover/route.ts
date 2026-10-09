/**
 * POST /admin/api/competitors/discover
 * Durchsucht die SERPs unserer Money-Keywords → entdeckt Wettbewerber → GEX44-Analyse → pb-tracking.
 * Dauert ~4-5 Min (SERP-Calls) → via Cron/Internal-Token origin-direkt aufrufen.
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { runCompetitorIntel } from '@/lib/competitorIntel';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const internalTok = process.env.MARKETING_INTERNAL_TOKEN;
  const internalOk = !!internalTok && req.headers.get('x-internal-token') === internalTok;
  if (!internalOk) {
    try { await requireAdmin(); } catch { return NextResponse.json({ error: 'unauthorized' }, { status: 401 }); }
  }
  let gruppe: string | undefined;
  try { const b = await req.json(); if (b?.gruppe) gruppe = String(b.gruppe); } catch { /* kein Body ok */ }
  const res = await runCompetitorIntel(gruppe ? { gruppe } : undefined);
  if (!res.ok) return NextResponse.json({ ok: false, error: res.error }, { status: 502 });
  return NextResponse.json({ ok: true, id: res.id });
}
