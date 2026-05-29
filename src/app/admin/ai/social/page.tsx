import { requireAdmin } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export default async function Page() {
  await requireAdmin();
  return (
    <div className="max-w-4xl">
      <h1 className="text-3xl font-extrabold mb-2">🤖 Social-Generator</h1>
      <p className="text-slate-600 mb-8">1 Thema → Posts für 8 Kanäle via Ollama (GEX44)</p>
      <div className="p-8 rounded-xl border bg-gradient-to-br from-slate-50 to-brand/5">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-3xl">🚧</span>
          <h2 className="font-bold text-lg">Phase 4</h2>
        </div>
        <p className="text-slate-700">Dieses Modul wird in <strong>Phase 4</strong> implementiert.</p>
        <p className="text-sm text-slate-500 mt-3">Aktuell läuft Phase 1: Foundation + 3 Read-Dashboards (Traffic / SEO / Ads).</p>
      </div>
    </div>
  );
}
