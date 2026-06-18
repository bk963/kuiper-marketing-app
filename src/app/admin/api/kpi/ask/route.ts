/**
 * POST /api/admin/kpi/ask
 * Body: { question: string }
 * → GEX44 baut QuerySpec → Engine führt aus → { spec, result }
 *
 * Der Clou: Natürliche Frage rein, Live-KPI raus. DSGVO: LLM on-premise (GEX44).
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { questionToSpecs } from '@/lib/kpi/prompt';
import { runQuery } from '@/lib/kpi/engine';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  // Server-zu-Server: internes Token (z.B. CRM-Assistent „Timmy") darf ohne Admin-Cookie
  // anfragen. Sonst normaler Admin-Cookie-Schutz. (KPI-Brain läuft on-prem über GEX44.)
  const internalTok = process.env.MARKETING_INTERNAL_TOKEN;
  const internalOk = !!internalTok && req.headers.get('x-internal-token') === internalTok;
  if (!internalOk) {
    try { await requireAdmin(); } catch { return NextResponse.json({ error: 'unauthorized' }, { status: 401 }); }
  }

  let body: any = {};
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'invalid JSON' }, { status: 400 }); }
  const question = String(body.question || '').trim();
  if (!question) return NextResponse.json({ error: 'Frage fehlt' }, { status: 400 });

  const p = await questionToSpecs(question);
  if (!p.ok || !p.specs?.length) return NextResponse.json({ error: p.error || 'Frage nicht verstanden', raw: p.raw }, { status: 422 });

  // Alle Kennzahlen parallel auswerten. results[] = alle Kacheln,
  // spec/result = erste (rückwärtskompatibel für CRM-Assistent „Timmy").
  const results = await Promise.all(p.specs.map(async (spec) => ({ spec, result: await runQuery(spec) })));
  return NextResponse.json({ spec: results[0].spec, result: results[0].result, results, raw: p.raw });
}
