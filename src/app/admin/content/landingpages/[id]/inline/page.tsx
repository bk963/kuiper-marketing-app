/**
 * Inline-Editor-Route (Phase 1) — ClickFunnels-Style Live-Edit.
 *
 * Zweite Route neben /admin/content/landingpages/[id] (alter 3-Spalten-Editor).
 * Bk wählt selbst welcher Modus. Folge-Phasen 1b-8 erweitern diese Route schrittweise.
 *
 * Spec siehe /root/festung/uploads/sprints/lp-inline-editor/PROJECT_DOC.md
 */
import { requireAdmin } from '@/lib/admin-auth';
import { getLandingpage } from '@/lib/mkt-lp';
import { notFound } from 'next/navigation';
import InlineEditor from '@/components/lp/editor/InlineEditor';

export const dynamic = 'force-dynamic';

export default async function InlineEditorPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const lp = await getLandingpage(id);
  if (!lp) notFound();
  return <InlineEditor lp={lp} />;
}
