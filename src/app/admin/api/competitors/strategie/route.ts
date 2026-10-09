/**
 * Marktdominanz-Strategie erarbeiten (GEX44, on-prem). Dauert ~1-2 min.
 * POST → neuer Strategie-Lauf. Via Cron/Internal-Token origin-direkt aufrufbar.
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { runStrategie } from '@/lib/strategie';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const t = process.env.MARKETING_INTERNAL_TOKEN;
  const internalOk = !!t && req.headers.get('x-internal-token') === t;
  if (!internalOk) { try { await requireAdmin(); } catch { return NextResponse.json({ error: 'unauthorized' }, { status: 401 }); } }
  const res = await runStrategie();
  if (!res.ok) return NextResponse.json({ ok: false, error: res.error }, { status: 502 });
  return NextResponse.json({ ok: true, id: res.id });
}
