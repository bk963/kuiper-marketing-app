'use client';
import { useState } from 'react';

type Block = {
  id: string; frage: string; antwort: string; vertiefung?: string;
  quelle?: string; kuiper_satz?: string; status?: string; impressions?: number;
};

export default function GeoBlock({ b }: { b: Block }) {
  const [status, setStatus] = useState(b.status || 'entwurf');
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const patch = async (payload: any) => {
    setBusy(true);
    try {
      const r = await fetch('/admin/api/geo', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: b.id, ...payload }) });
      const d = await r.json(); if (d.ok && payload.status) setStatus(payload.status);
    } catch {} finally { setBusy(false); }
  };
  const copy = async () => {
    const t = `## ${b.frage}\n\n${b.antwort}${b.vertiefung ? `\n\n${b.vertiefung}` : ''}\n\nQuelle: ${b.quelle || ''}\n\n${b.kuiper_satz || ''}`;
    try { await navigator.clipboard.writeText(t); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch {}
  };

  const done = status === 'freigegeben' || status === 'live' || status === 'dublette';
  const isEntwurf = status === 'entwurf';
  const badge = status === 'live' ? { c: 'bg-emerald-100 text-emerald-800', t: '🌐 live' }
    : status === 'dublette' ? { c: 'bg-slate-100 text-slate-600', t: '♻️ schon auf Seite' }
    : status === 'freigegeben' ? { c: 'bg-emerald-100 text-emerald-800', t: '✓ frei, wird publiziert' }
    : { c: 'bg-amber-100 text-amber-800', t: '📝 Entwurf' };
  return (
    <div className={`rounded-lg border p-4 ${status === 'dublette' ? 'border-slate-200 bg-slate-50/60 opacity-75' : done ? 'border-emerald-200 bg-emerald-50/40' : 'border-slate-200 bg-white'}`}>
      <div className="flex items-start justify-between gap-3 mb-1">
        <h3 className="font-bold text-slate-900 text-sm">{b.frage}</h3>
        <span className={`shrink-0 text-[11px] px-2 py-0.5 rounded-full font-semibold ${badge.c}`}>{badge.t}</span>
      </div>
      <p className="text-sm text-slate-800">{b.antwort}</p>
      {b.vertiefung && <p className="text-xs text-slate-500 mt-2">{b.vertiefung}</p>}
      {b.quelle && <p className="text-[11px] text-cyan-700 mt-2 font-mono">§ {b.quelle}</p>}
      {b.kuiper_satz && <p className="text-xs text-slate-600 italic mt-1">↳ {b.kuiper_satz}</p>}
      <div className="flex items-center gap-2 mt-3">
        {isEntwurf && <button onClick={() => patch({ status: 'freigegeben' })} disabled={busy} className="text-xs px-3 py-1.5 rounded-md bg-emerald-600 text-white font-semibold hover:bg-emerald-500 disabled:opacity-60">✓ fachlich freigeben</button>}
        {status === 'freigegeben' && <button onClick={() => patch({ status: 'entwurf' })} disabled={busy} className="text-xs px-3 py-1.5 rounded-md bg-slate-200 text-slate-700 font-semibold hover:bg-slate-300 disabled:opacity-60">zurück zu Entwurf</button>}
        {status === 'dublette' && <span className="text-[11px] text-slate-400">Diese Frage steht bereits auf der Seite, nichts zu tun.</span>}
        <button onClick={copy} className="text-xs px-3 py-1.5 rounded-md bg-cyan-500 text-white font-semibold hover:bg-cyan-400">{copied ? '✓ kopiert' : 'Block kopieren'}</button>
        {b.impressions ? <span className="text-[11px] text-slate-400 ml-auto">GSC {b.impressions} Impr.</span> : null}
      </div>
    </div>
  );
}
