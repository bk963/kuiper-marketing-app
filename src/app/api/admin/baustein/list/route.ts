/**
 * Admin-Baustein-List-Endpoint.
 *
 * GET /api/admin/baustein/list[?type=bsh-hero][&status=active]
 *
 * Wird vom LpEditor AddSectionPicker geladen wenn Bk auf Tab "Bausteine" klickt.
 * Liefert eine zusätzliche Quelle für "+ Section" zusätzlich zum BSH_SECTION_CATALOG.
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { mktLp } from '@/lib/mkt-lp';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const type = req.nextUrl.searchParams.get('type');
  const status = req.nextUrl.searchParams.get('status') || 'active';

  const filters: string[] = [];
  if (status) filters.push(`status="${status.replace(/"/g, '\\"')}"`);
  if (type) filters.push(`type="${type.replace(/"/g, '\\"')}"`);

  const { items, error } = await mktLp.bausteine({
    perPage: 200,
    sort: '-created',
    filter: filters.join('&&') || undefined,
    fields: 'id,name,description,type,content_json,status',
  });

  if (error) return NextResponse.json({ error, items: [] }, { status: 502 });
  return NextResponse.json({ items });
}
