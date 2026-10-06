'use client';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { RANGE_OPTIONS } from '@/lib/range';

/** Zeitraum-Umschalter (Presets). Steuert ?range und löst Server-Re-Render aus. */
export default function RangePicker({ current }: { current: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const setPreset = (key: string) => {
    const p = new URLSearchParams(sp.toString());
    p.set('range', key);
    router.push(`${pathname}?${p.toString()}`);
  };

  return (
    <div className="inline-flex flex-wrap items-center gap-1 mb-6 bg-slate-100 rounded-lg p-1">
      <span className="px-2 text-xs text-slate-500 font-medium">Zeitraum:</span>
      {RANGE_OPTIONS.map((o) => (
        <button
          key={o.key}
          onClick={() => setPreset(o.key)}
          className={`px-3 py-1.5 text-sm rounded-md transition ${
            current === o.key ? 'bg-white shadow font-semibold text-slate-900' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
