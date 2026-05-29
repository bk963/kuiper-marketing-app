import { requireAdmin } from '@/lib/admin-auth';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function NewLandingpagePage() {
  await requireAdmin();
  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/content/landingpages" className="text-slate-500 hover:text-brand">← Zurück</Link>
        <h1 className="text-3xl font-extrabold">🎨 Neue Landingpage</h1>
      </div>

      <div className="p-8 rounded-xl border bg-gradient-to-br from-slate-50 to-brand/5">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-3xl">🚧</span>
          <h2 className="font-bold text-lg">Wizard kommt in 3d</h2>
        </div>
        <p className="text-slate-700 mb-3">
          Wizard-Schritt 1: Template-Auswahl aus Template-Library (mkt_templates type='landing_page')<br/>
          Wizard-Schritt 2: Slug + Name + Form-Bindung<br/>
          Wizard-Schritt 3: Erste Sections aus Bausteine-Library<br/>
          Wizard-Schritt 4: SEO-Sidebar (Meta-Title, Description)<br/>
          Final: Anlegen + Direkt-Editor-Sprung
        </p>
        <p className="text-sm text-slate-500">
          Aktuell: 1 Demo-LP migriert (slug=marc). Anlegen via PB-Admin oder via Section-Editor in 3d.
        </p>
      </div>
    </div>
  );
}
