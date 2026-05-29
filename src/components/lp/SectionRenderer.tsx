/**
 * Section-Renderer für Editor-driven Landingpages.
 *
 * Phase 3d: Skeleton — kommt in 3d-2 zu Leben, sobald die 13 BSH-Sections
 * als separate React-Components extrahiert sind.
 *
 * Maps section.type → Component(props=section.config).
 * Für jetzt: nur Platzhalter-UI mit Section-Type-Liste.
 */
import type { LpSection } from '@/lib/mkt-lp';

export default function SectionRenderer({ lp, sections }: { lp: any; sections: LpSection[] }) {
  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">{lp.internal_name}</h1>
        <p className="text-slate-600 mb-8">Slug: <code className="bg-slate-200 px-2 py-1 rounded">/lp/{lp.slug}</code> · {sections.length} Sections</p>

        <div className="bg-amber-50 border border-amber-300 rounded-lg p-4 mb-8 text-amber-900">
          <strong>Phase 3d-2 ausstehend:</strong> Editor-driven Section-Rendering wird mit Section-Components ausgeliefert.
          Aktuell wird nur die Section-Liste (Typ + ID) angezeigt.
        </div>

        <div className="space-y-3">
          {sections.map((s, i) => (
            <div key={s.id || i} className="bg-white rounded-lg border p-4">
              <div className="flex items-baseline justify-between">
                <span className="font-bold text-navy">{i + 1}. {s.type}</span>
                <code className="text-xs text-slate-500">{s.id}</code>
              </div>
              {s.config && Object.keys(s.config).length > 0 && (
                <pre className="mt-2 text-xs bg-slate-100 p-2 rounded overflow-auto max-h-32">
                  {JSON.stringify(s.config, null, 2)}
                </pre>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
