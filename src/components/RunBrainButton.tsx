'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RunBrainButton() {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const router = useRouter();

  const run = async () => {
    setLoading(true); setErr('');
    try {
      const r = await fetch('/admin/api/brain/run', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ days: 28 }) });
      const d = await r.json();
      if (!d.ok) setErr(d.error || `Fehler (HTTP ${r.status})`);
      else router.refresh();
    } catch (e: any) { setErr(e?.message || 'Fehler'); }
    setLoading(false);
  };

  return (
    <div className="flex items-center gap-3">
      <button onClick={run} disabled={loading}
        className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-semibold hover:bg-slate-700 disabled:opacity-60">
        {loading ? '🧠 Analysiere… (bis ~1 Min)' : '🧠 Jetzt analysieren'}
      </button>
      {err && <span className="text-sm text-rose-600">{err}</span>}
    </div>
  );
}
