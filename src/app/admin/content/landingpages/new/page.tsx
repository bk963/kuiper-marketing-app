/**
 * Neue Landingpage-Wizard.
 *
 * Server-Component shell, Client-Component LpWizard für Form-State.
 * Submit → POST /api/admin/lp/create → POST mkt_landingpages mit BSH-Defaults
 *  → redirect /admin/content/landingpages/[id]
 *
 * Bk-Erwartung: 4 Felder, schneller "Anlegen"-Click, dann Editor.
 */
import { requireAdmin } from '@/lib/admin-auth';
import LpWizard from '@/components/lp/editor/LpWizard';

export const dynamic = 'force-dynamic';

export default async function NewLandingpagePage() {
  await requireAdmin();
  return <LpWizard />;
}
