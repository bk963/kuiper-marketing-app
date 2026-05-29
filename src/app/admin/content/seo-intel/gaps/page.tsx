import { requireAdmin } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export default async function GapsPage() {
  await requireAdmin();
  return (
    <div className="max-w-4xl">
      <h1 className="text-3xl font-extrabold mb-2">🕳️ Content-Gaps</h1>
      <p className="text-slate-600 mb-8">Fehlende Themen vs Wettbewerb — welche Keywords ranken die anderen, die wir nicht haben?</p>
      <div className="p-8 rounded-xl border bg-gradient-to-br from-slate-50 to-brand/5">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-3xl">🚧</span>
          <h2 className="font-bold text-lg">Phase 2.0c+</h2>
        </div>
        <p className="text-slate-700">
          Gap-Analyse braucht DataForSEO/Ahrefs-Anbindung für Wettbewerber-Keyword-Lists. Kommt nachgelagert sobald
          Competitor-Tracking aktiv läuft.
        </p>
      </div>
    </div>
  );
}
