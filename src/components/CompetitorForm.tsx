'use client';
import { useRouter, usePathname } from 'next/navigation';
import { useState } from 'react';

export default function CompetitorForm({ current }: { current: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [val, setVal] = useState(current);

  const go = () => {
    const clean = val.split(/[,\s]+/).map((d) => d.trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '')).filter(Boolean).slice(0, 4);
    router.push(clean.length ? `${pathname}?domains=${encodeURIComponent(clean.join(','))}` : pathname);
  };

  return (
    <div className="flex flex-wrap items-center gap-2 mb-6">
      <input
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') go(); }}
        placeholder="Wettbewerber-Domains, z.B. konkurrent1.de, konkurrent2.de"
        className="flex-1 min-w-[280px] border rounded-lg px-3 py-2 text-sm"
      />
      <button onClick={go} className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-semibold hover:bg-slate-700">Analysieren</button>
    </div>
  );
}
