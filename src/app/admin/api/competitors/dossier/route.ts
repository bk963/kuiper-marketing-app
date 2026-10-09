/**
 * Wettbewerber-Dossier on-demand auffrischen.
 * POST { domain } → DataForSEO-Overview + Keyword-Lücken + GEX44-Stärken → upsert.
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { refreshDossier } from '@/lib/dossier';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const t = process.env.MARKETING_INTERNAL_TOKEN;
  const internalOk = !!t && req.headers.get('x-internal-token') === t;
  if (!internalOk) { try { await requireAdmin(); } catch { return NextResponse.json({ error: 'unauthorized' }, { status: 401 }); } }
  let domain = '';
  try { const b = await req.json(); domain = String(b?.domain || ''); } catch { /* */ }
  if (!domain) return NextResponse.json({ error: 'domain fehlt' }, { status: 400 });
  const res = await refreshDossier(domain);
  if (!res.ok) return NextResponse.json({ ok: false, error: res.error }, { status: 502 });
  return NextResponse.json({ ok: true });
}
