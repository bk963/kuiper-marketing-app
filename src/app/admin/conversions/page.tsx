import { requireAdmin } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export default async function Page() {
  await requireAdmin();
  return (
    <div className="max-w-4xl">
      <h1 className="text-3xl font-extrabold mb-2">💰 Conversions</h1>
      <p className="text-slate-600 mb-8">Funnel View → Form → Lead → MQL → Deal → Won + Attribution-Modelle</p>
      <div className="p-8 rounded-xl border bg-gradient-to-br from-emerald-50 to-brand/5">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-3xl">⏭️</span>
          <h2 className="font-bold text-lg">Phase 2 — Closed-Loop-ROAS</h2>
        </div>
        <ul className="space-y-2 text-slate-700 text-sm list-disc list-inside">
          <li>Funnel-Stages: View → Form-Open → Form-Submit → Lead → MQL → Deal → Won</li>
          <li>Conversion-Rates pro Stufe + Drop-off-Analyse</li>
          <li>Attribution: Last-Click / First-Click / Linear / Time-Decay / Data-Driven</li>
          <li>Read-Sync zu CRM-PB (crm_deals, crm_companies, reach_leads)</li>
          <li>ROAS pro Kanal + Kampagne + Landingpage (gegen echten Deal-Won-Wert)</li>
        </ul>
      </div>
    </div>
  );
}
