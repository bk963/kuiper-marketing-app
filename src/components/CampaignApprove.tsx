'use client';
import { useState } from 'react';

export default function CampaignApprove({ id }: { id: string }) {
  const [state, setState] = useState<'idle' | 'loading' | 'done'>('idle');
  const go = async () => {
    setState('loading');
    try {
      const r = await fetch('/admin/api/campaign', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status: 'freigegeben' }) });
      const d = await r.json();
      if (d.ok) { setState('done'); location.reload(); } else setState('idle');
    } catch { setState('idle'); }
  };
  if (state === 'done') return <span className="text-xs font-semibold text-emerald-700">✅ freigegeben</span>;
  return <button onClick={go} disabled={state === 'loading'} className="text-xs px-3 py-1.5 rounded-md bg-emerald-600 text-white font-semibold hover:bg-emerald-500 disabled:opacity-60">{state === 'loading' ? '…' : '✅ Kampagne freigeben'}</button>;
}
