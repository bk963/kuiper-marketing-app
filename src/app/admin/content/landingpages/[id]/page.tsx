/**
 * LP-Editor-Page (Server-Component).
 *
 * Lädt die LP aus mkt_landingpages, übergibt an <LpEditor /> Client-Component.
 *
 * Layout: [Section-Liste 320px] | [Config-Panel flex-1] | [Sidebar 280px]
 *
 * Sub-Sprint 3d-3:
 *  - Section-Liste mit Up/Down/Delete/Duplicate
 *  - Add-Section-Picker aus BSH_SECTION_CATALOG
 *  - Config-Panel mit Forms pro Section-Type
 *  - Save → PATCH /api/admin/lp/[id]
 */
import { requireAdmin } from '@/lib/admin-auth';
import { getLandingpage } from '@/lib/mkt-lp';
import { notFound } from 'next/navigation';
import LpEditor from '@/components/lp/editor/LpEditor';

export const dynamic = 'force-dynamic';

export default async function LandingpageEditorPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const lp = await getLandingpage(id);
  if (!lp) notFound();
  return <LpEditor lp={lp} />;
}
