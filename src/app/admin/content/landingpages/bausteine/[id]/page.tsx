/**
 * Bausteine-Editor — single Baustein bearbeiten.
 *
 * Lädt mkt_lp_bausteine by id, übergibt an BausteinEditor Client-Component.
 * Save via PATCH /api/admin/baustein/[id] (gleiche Pattern wie LP-Editor).
 */
import { requireAdmin } from '@/lib/admin-auth';
import { getBaustein } from '@/lib/mkt-lp';
import { notFound } from 'next/navigation';
import BausteinEditor from '@/components/lp/editor/BausteinEditor';

export const dynamic = 'force-dynamic';

export default async function BausteineEditorPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const baustein = await getBaustein(id);
  if (!baustein) notFound();
  return <BausteinEditor baustein={baustein} />;
}
