/**
 * POST /api/admin/kpi/run
 * Body: { spec: QuerySpec }
 * → Engine führt eine bekannte Spec aus → { result }
 *
 * Genutzt zum Aktualisieren gepinnter Kacheln und für Direkt-Specs (ohne LLM).
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { runQuery } from '@/lib/kpi/engine';
import type { QuerySpec } from '@/lib/kpi/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try { await requireAdmin(); } catch { return NextResponse.json({ error: 'unauthorized' }, { status: 401 }); }

  let body: any = {};
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'invalid JSON' }, { status: 400 }); }
  const spec = body.spec as QuerySpec;
  if (!spec || typeof spec !== 'object' || !spec.metric) {
    return NextResponse.json({ error: 'spec.metric fehlt' }, { status: 400 });
  }

  const result = await runQuery(spec);
  return NextResponse.json({ result });
}
