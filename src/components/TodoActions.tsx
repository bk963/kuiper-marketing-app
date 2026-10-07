'use client';
import { useState } from 'react';

type Todo = { title: string; category?: string; action?: string; why?: string; priority?: number; impact?: string; effort?: string; source?: string };

export default function TodoActions({ todo }: { todo: Todo }) {
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'dismissed' | 'error'>('idle');
  const [err, setErr] = useState('');

  const assign = async () => {
    setState('loading'); setErr('');
    try {
      const r = await fetch('/admin/api/brain/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(todo) });
      const d = await r.json();
      if (!d.ok) { setErr(d.error || 'Fehler'); setState('error'); }
      else setState('done');
    } catch (e: any) { setErr(e?.message || 'Fehler'); setState('error'); }
  };

  if (state === 'done') return <span className="text-xs font-semibold text-emerald-700">🤝 an Claude beauftragt</span>;
  if (state === 'dismissed') return <span className="text-xs text-slate-400">verworfen</span>;

  return (
    <div className="flex items-center gap-2">
      <button onClick={assign} disabled={state === 'loading'}
        className="text-xs px-2.5 py-1 rounded-md bg-slate-900 text-white font-semibold hover:bg-slate-700 disabled:opacity-60">
        {state === 'loading' ? '…' : '🤝 An Claude beauftragen'}
      </button>
      <button onClick={() => setState('dismissed')} className="text-xs px-2 py-1 rounded-md text-slate-400 hover:text-slate-600">Verwerfen</button>
      {err && <span className="text-xs text-rose-600">{err}</span>}
    </div>
  );
}
