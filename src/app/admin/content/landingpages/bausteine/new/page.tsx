/**
 * Neue Baustein-Wizard.
 *
 * Server-Component shell, Client-Component BausteinWizard für Form-State.
 * Submit → POST /api/admin/baustein/create → POST mkt_lp_bausteine
 *  → redirect /admin/content/landingpages/bausteine/[id]
 */
import { requireAdmin } from '@/lib/admin-auth';
import BausteinWizard from '@/components/lp/editor/BausteinWizard';

export const dynamic = 'force-dynamic';

export default async function NewBausteinPage() {
  await requireAdmin();
  return <BausteinWizard />;
}
