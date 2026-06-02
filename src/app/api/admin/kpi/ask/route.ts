/**
 * POST /api/admin/kpi/ask
 * Body: { question: string }
 * → GEX44 baut QuerySpec → Engine führt aus → { spec, result }
 *
 * Der Clou: Natürliche Frage rein, Live-KPI raus. DSGVO: LLM on-premise (GEX44).
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { questionToSpec } from '@/lib/kpi/prompt';
import { runQuery } from '@/lib/kpi/engine';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try { await requireAdmin(); } catch { return NextResponse.json({ error: 'unauthorized' }, { status: 401 }); }

  let body: any = {};
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'invalid JSON' }, { status: 400 }); }
  const question = String(body.question || '').trim();
  if (!question) return NextResponse.json({ error: 'Frage fehlt' }, { status: 400 });

  const p = await questionToSpec(question);
  if (!p.ok || !p.spec) return NextResponse.json({ error: p.error || 'Frage nicht verstanden', raw: p.raw }, { status: 422 });

  const result = await runQuery(p.spec);
  return NextResponse.json({ spec: p.spec, result });
}
