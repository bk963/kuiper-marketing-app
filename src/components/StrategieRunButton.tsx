'use client';
import { useState } from 'react';

// Startet einen Strategie-Lauf (GEX44, ~1-2 min) und lädt die Seite neu.
export default function StrategieRunButton({ label = 'Strategie erarbeiten' }: { label?: string }) {
  const [state, setState] = useState<'idle' | 'loading' | 'error'>('idle');
  const [err, setErr] = useState('');
  const run = async () => {
    setState('loading'); setErr('');
    try {
      const r = await fetch('/admin/api/competitors/strategie', { method: 'POST' });
      const d = await r.json();
      if (d.ok) location.reload();
      else { setErr(d.error || 'Fehler'); setState('error'); }
    } catch (e: any) { setErr(e?.message || 'Fehler'); setState('error'); }
  };
  return (
    <div className="flex items-center gap-2">
      <button onClick={run} disabled={state === 'loading'}
        className="px-4 py-2 rounded-lg bg-cyan-500 text-white text-sm font-bold hover:bg-cyan-400 disabled:opacity-60">
        {state === 'loading' ? '🧠 erarbeite Strategie … (~1-2 min)' : `🧠 ${label}`}
      </button>
      {err && <span className="text-xs text-rose-600">{err}</span>}
    </div>
  );
}
