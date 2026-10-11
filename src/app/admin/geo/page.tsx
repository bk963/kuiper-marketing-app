import { requireAdmin } from '@/lib/admin-auth';
import { listTrackingRecords } from '@/lib/pb-tracking';
import GeoBlock from '@/components/GeoBlock';

export const dynamic = 'force-dynamic';

export default async function GeoPage() {
  await requireAdmin();
  const res = await listTrackingRecords('mkt_geo_blocks', { sort: '-impressions', perPage: 200 });
  const blocks = (res as any)?.items || [];
  // nach Leistungswelt → Cluster gruppieren
  const byLw: Record<string, Record<string, any[]>> = {};
  for (const b of blocks) {
    const lw = b.leistungswelt || 'Sonstige';
    const cl = b.cluster || 'Sonstige';
    (byLw[lw] ||= {});
    (byLw[lw][cl] ||= []).push(b);
  }
  const frei = blocks.filter((b: any) => b.status === 'freigegeben' || b.status === 'live').length;

  return (
    <div className="max-w-4xl">
      <div className="text-xs uppercase tracking-wide text-cyan-600 font-semibold font-mono">Content-Maschine · GEO</div>
      <h1 className="text-3xl font-extrabold mb-1">🔎 GEO — Als Quelle in ChatGPT</h1>
      <p className="text-slate-600 mb-4 max-w-2xl">Echte Google-Search-Console-Fragen → zitierfähige §-Antwortblöcke. Fachlich freigeben, dann in die Leistungswelten (FAQ-Schema) + Indexierung. Loop: monatlich neue Fragen.</p>
      <div className="flex gap-2 mb-6 text-sm">
        <span className="px-3 py-1.5 rounded-full bg-slate-100 font-semibold">{blocks.length} Blöcke</span>
        <span className="px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">{frei} freigegeben</span>
        <span className="px-3 py-1.5 rounded-full bg-amber-100 text-amber-800 font-semibold">{blocks.length - frei} offen</span>
      </div>

      {blocks.length === 0 && <p className="text-sm text-slate-500">Noch keine Blöcke. Generator läuft (Opus) — Seite später neu laden.</p>}

      {Object.entries(byLw).map(([lw, clusters]) => (
        <section key={lw} className="mb-8">
          <h2 className="text-lg font-bold text-slate-900 border-b border-slate-200 pb-1 mb-4">🌐 {lw}</h2>
          {Object.entries(clusters).map(([cl, items]) => (
            <div key={cl} className="mb-5">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">{cl} <span className="text-slate-300">· {items.length}</span></div>
              <div className="space-y-2">{items.map((b: any) => <GeoBlock key={b.id} b={b} />)}</div>
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}
