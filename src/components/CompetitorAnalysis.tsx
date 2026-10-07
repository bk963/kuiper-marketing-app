'use client';
import { useState } from 'react';
import TodoActions from '@/components/TodoActions';

const IMP: Record<string, string> = { hoch: 'bg-rose-100 text-rose-800', mittel: 'bg-amber-100 text-amber-800', gering: 'bg-slate-100 text-slate-700' };

export default function CompetitorAnalysis({ domains }: { domains: string }) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [a, setA] = useState<any>(null);

  const run = async () => {
    setLoading(true); setErr(''); setA(null);
    try {
      const r = await fetch('/admin/api/competitors/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ domains }) });
      const d = await r.json();
      if (!d.ok) setErr(d.error || `Fehler (HTTP ${r.status})`);
      else setA(d.analysis);
    } catch (e: any) { setErr(e?.message || 'Fehler'); }
    setLoading(false);
  };

  if (!domains) return null;

  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-3">
        <button onClick={run} disabled={loading} className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60">
          {loading ? '🧠 Analysiere Markt… (~1 Min)' : '🧠 Strategische Markt- & Wettbewerbsanalyse erstellen'}
        </button>
        {err && <span className="text-sm text-rose-600">{err}</span>}
      </div>

      {a && (
        <div className="bg-white rounded-xl border p-5 space-y-5">
          <Section title="📊 Marktlage"><p className="text-slate-800 leading-relaxed">{a.marktlage}</p></Section>
          <Section title="📍 Wo wir stehen"><p className="text-slate-800 leading-relaxed">{a.wo_wir_stehen}</p></Section>
          <Section title="⚠️ Was die Wettbewerber besser machen">
            <ul className="list-disc list-inside space-y-1 text-slate-700">{(a.was_sie_besser_machen || []).map((x: string, i: number) => <li key={i}>{x}</li>)}</ul>
          </Section>
          <Section title="🎯 Unsere Chancen">
            <ul className="list-disc list-inside space-y-1 text-slate-700">{(a.unsere_chancen || []).map((x: string, i: number) => <li key={i}>{x}</li>)}</ul>
          </Section>
          <Section title="✅ Empfohlene Maßnahmen">
            <div className="space-y-2">
              {(a.massnahmen || []).map((m: any, i: number) => (
                <div key={i} className="border rounded-lg p-3">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-semibold text-slate-900">{m.title}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${IMP[m.impact] || 'bg-slate-100 text-slate-700'}`}>Impact: {m.impact}</span>
                    <span className="text-xs text-slate-500">Aufwand: {m.aufwand}</span>
                  </div>
                  <p className="text-sm text-slate-700 mb-2">{m.action}</p>
                  <TodoActions todo={{ title: m.title, category: 'Wettbewerb', action: m.action, impact: m.impact, effort: m.aufwand, source: 'analyse' }} />
                </div>
              ))}
            </div>
          </Section>
          <p className="text-xs text-slate-400">GEX44 qwen2.5:32b · on-premise · auf Basis der DataForSEO-Daten oben.</p>
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <div><div className="text-xs uppercase tracking-wide text-slate-400 font-semibold mb-1.5">{title}</div>{children}</div>;
}
