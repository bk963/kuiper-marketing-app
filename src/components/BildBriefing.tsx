'use client';
import { useState } from 'react';

type Briefing = {
  slot?: string; motiv?: string; szene?: string; personen?: string;
  komposition?: string; details?: string; logo?: string; format?: string;
};
const FELDER: [keyof Briefing, string][] = [
  ['motiv', 'Motiv'], ['szene', 'Szene'], ['personen', 'Personen'],
  ['komposition', 'Komposition'], ['details', 'Details/PSA'], ['logo', 'Logo'], ['format', 'Format'],
];

function asText(b: Briefing): string {
  const lines = [b.slot ? `Bild — ${b.slot}` : 'Bild-Briefing'];
  for (const [k, label] of FELDER) if (b[k]) lines.push(`${label}: ${b[k]}`);
  return lines.join('\n');
}

export default function BildBriefing({ b, i }: { b: Briefing | string; i: number }) {
  const [copied, setCopied] = useState(false);
  // Legacy: altes String-Format weiterhin anzeigen
  if (typeof b === 'string') return <li className="text-xs text-slate-600">{b}</li>;

  const copy = async () => {
    try { await navigator.clipboard.writeText(asText(b)); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch {}
  };
  return (
    <div className="border border-slate-200 rounded-lg p-3 bg-slate-50">
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs font-bold text-slate-700">🖼️ Bild {i + 1}{b.slot ? ` — ${b.slot}` : ''}</span>
        <button onClick={copy} className="text-[11px] px-2 py-1 rounded-md bg-cyan-500 text-white font-semibold hover:bg-cyan-400">
          {copied ? '✓ kopiert' : 'Briefing kopieren'}
        </button>
      </div>
      <dl className="text-xs space-y-1">
        {FELDER.map(([k, label]) => b[k] ? (
          <div key={k} className="flex gap-2">
            <dt className="text-slate-400 font-semibold shrink-0 w-24">{label}</dt>
            <dd className="text-slate-700">{b[k]}</dd>
          </div>
        ) : null)}
      </dl>
    </div>
  );
}
