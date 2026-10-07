import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { analyzeCompetition } from '@/lib/competitorAnalysis';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const internalTok = process.env.MARKETING_INTERNAL_TOKEN;
  const internalOk = !!internalTok && req.headers.get('x-internal-token') === internalTok;
  if (!internalOk) {
    try { await requireAdmin(); } catch { return NextResponse.json({ error: 'unauthorized' }, { status: 401 }); }
  }
  let domains: string[] = [];
  try { const b = await req.json(); domains = String(b?.domains || '').split(',').map((d: string) => d.trim()).filter(Boolean); } catch { /* */ }
  const res = await analyzeCompetition(domains);
  if (!res.ok) return NextResponse.json({ ok: false, error: res.error }, { status: 502 });
  return NextResponse.json({ ok: true, analysis: res.analysis });
}
