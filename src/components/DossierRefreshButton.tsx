'use client';
import { useState } from 'react';

// Frischt ein Wettbewerber-Dossier on-demand auf (DataForSEO + GEX44, ~1 min).
export default function DossierRefreshButton({ domain }: { domain: string }) {
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const run = async () => {
    setState('loading');
    try {
      const r = await fetch('/admin/api/competitors/dossier', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ domain }) });
      const d = await r.json();
      setState(d.ok ? 'done' : 'error');
      if (d.ok) location.reload();
    } catch { setState('error'); }
  };
  return (
    <button onClick={run} disabled={state === 'loading'}
      className="text-xs px-2 py-1 rounded-md border border-slate-200 text-slate-500 hover:border-cyan-400 hover:text-cyan-700 disabled:opacity-50">
      {state === 'loading' ? 'aktualisiere … (~1 min)' : state === 'error' ? 'Fehler — erneut' : '↻ aktualisieren'}
    </button>
  );
}
