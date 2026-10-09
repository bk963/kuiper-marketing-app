'use client';
import { useState } from 'react';

// Beauftragt eine MAX-QUALITÄT-Strategie (Claude/Opus) über die Worker-Pipeline.
// Legt einen Task "STRATEGIE: …" an → der Worker (28.25) erarbeitet sie mit Opus (~5-10 Min),
// danach erscheint sie auf dieser Seite. (Opus geht nur auf dem Worker — die App hat keinen Cloud-Key.)
export default function StrategieRunButton({ label = 'Strategie erarbeiten' }: { label?: string }) {
  const [state, setState] = useState<'idle' | 'loading' | 'queued' | 'error'>('idle');
  const [err, setErr] = useState('');
  const run = async () => {
    setState('loading'); setErr('');
    try {
      const r = await fetch('/admin/api/brain/tasks', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'STRATEGIE: Marktdominanz (Opus) neu erarbeiten', category: 'Strategie', source: 'strategie-run', impact: 'hoch', effort: 'med' }),
      });
      const d = await r.json();
      if (d.ok) setState('queued');
      else { setErr(d.error || 'Fehler'); setState('error'); }
    } catch (e: any) { setErr(e?.message || 'Fehler'); setState('error'); }
  };
  if (state === 'queued') return <span className="text-sm font-semibold text-emerald-700">✅ beauftragt — Opus erarbeitet im Hintergrund (~5-10 Min), dann hier sichtbar</span>;
  return (
    <div className="flex items-center gap-2">
      <button onClick={run} disabled={state === 'loading'}
        className="px-4 py-2 rounded-lg bg-cyan-500 text-white text-sm font-bold hover:bg-cyan-400 disabled:opacity-60">
        {state === 'loading' ? '…' : `🧠 ${label} (Opus)`}
      </button>
      {err && <span className="text-xs text-rose-600">{err}</span>}
    </div>
  );
}
