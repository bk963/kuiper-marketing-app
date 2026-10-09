'use client';
import { useState } from 'react';

// Freigabe eines "wartet_freigabe"-Tasks: setzt Status → "freigegeben".
// Der Worker (28.25) nimmt freigegebene Tasks auf und schaltet die vorbereitete Arbeit live.
export default function ApproveTaskButton({ id }: { id: string }) {
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [err, setErr] = useState('');

  const approve = async () => {
    if (!confirm('Diese vorbereitete Änderung freigeben? Der Worker schaltet sie dann LIVE (Produktion).')) return;
    setState('loading'); setErr('');
    try {
      const r = await fetch('/admin/api/brain/tasks', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'freigegeben' }),
      });
      const d = await r.json();
      if (!d.ok) { setErr(d.error || 'Fehler'); setState('error'); }
      else setState('done');
    } catch (e: any) { setErr(e?.message || 'Fehler'); setState('error'); }
  };

  if (state === 'done') return <span className="text-xs font-semibold text-emerald-700">✅ freigegeben — Worker schaltet live</span>;

  return (
    <div className="flex items-center gap-2">
      <button onClick={approve} disabled={state === 'loading'}
        className="text-xs px-2.5 py-1 rounded-md bg-violet-600 text-white font-semibold hover:bg-violet-500 disabled:opacity-60">
        {state === 'loading' ? '…' : '🚀 Freigeben & live schalten'}
      </button>
      {err && <span className="text-xs text-rose-600">{err}</span>}
    </div>
  );
}
