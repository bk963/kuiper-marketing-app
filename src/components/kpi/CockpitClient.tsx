'use client';
import { useState } from 'react';
import KpiTile from './KpiTile';
import type { KpiResult, QuerySpec } from '@/lib/kpi/types';

export interface RenderedTile {
  id: string;
  viz: string;
  span: number;
  result: KpiResult;
}

const EXAMPLES = [
  'Qualifizierte Leads letzte 30 Tage',
  'Conversions letzte 30 Tage in Köln',
  'Ad-Spend letzte 7 Tage bei Google',
  'Qualifizierte Leads je Stadt',
  'Kosten pro qualifiziertem Lead in der NRW-Kampagne',
  'Lead-Verlauf der letzten 90 Tage',
];

export default function CockpitClient({ initialTiles }: { initialTiles: RenderedTile[] }) {
  const [q, setQ] = useState('');
  const [asking, setAsking] = useState(false);
  const [askErr, setAskErr] = useState<string | null>(null);
  const [askResult, setAskResult] = useState<KpiResult | null>(null);
  const [askSpec, setAskSpec] = useState<QuerySpec | null>(null);
  const [tiles, setTiles] = useState<RenderedTile[]>(initialTiles);
  const [pinning, setPinning] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function ask(question: string) {
    const text = question.trim();
    if (!text || asking) return;
    setAsking(true); setAskErr(null); setAskResult(null); setAskSpec(null);
    try {
      const r = await fetch('/api/admin/kpi/ask', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: text }),
      });
      const d = await r.json();
      if (!r.ok) { setAskErr(d.error || 'Frage nicht verstanden.'); return; }
      setAskResult(d.result); setAskSpec(d.spec);
    } catch { setAskErr('Verbindungsfehler.'); }
    finally { setAsking(false); }
  }

  async function pin() {
    if (!askSpec || !askResult || pinning) return;
    setPinning(true);
    try {
      const r = await fetch('/api/admin/kpi/tiles', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spec: askSpec }),
      });
      const d = await r.json();
      if (!r.ok) { setAskErr(d.error || 'Pinnen fehlgeschlagen.'); return; }
      setTiles((t) => [...t, { id: d.tile.id, viz: d.tile.viz || 'auto', span: d.tile.span || 1, result: askResult }]);
      setAskResult(null); setAskSpec(null); setQ('');
    } catch { setAskErr('Pinnen fehlgeschlagen.'); }
    finally { setPinning(false); }
  }

  async function unpin(id: string) {
    setBusyId(id);
    try {
      const r = await fetch(`/api/admin/kpi/tiles/${id}`, { method: 'DELETE' });
      if (r.ok) setTiles((t) => t.filter((x) => x.id !== id));
    } finally { setBusyId(null); }
  }

  return (
    <div>
      {/* ── Prompt-Leiste (Hero) ── */}
      <div className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2 text-sm font-bold text-navy mb-2">
          <span className="text-brand">✦</span> Frag deine Zahlen
        </div>
        <form onSubmit={(e) => { e.preventDefault(); ask(q); }} className="flex gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="z. B. Conversions letzte 30 Tage in Köln …"
            className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:border-brand focus:ring-2 focus:ring-brand/20 outline-none text-[15px]"
          />
          <button
            type="submit" disabled={asking || !q.trim()}
            className="px-5 py-3 rounded-xl bg-navy text-white font-bold hover:bg-navy-dark disabled:opacity-40 transition whitespace-nowrap"
          >{asking ? 'Frage …' : 'Auswerten'}</button>
        </form>

        <div className="flex flex-wrap gap-1.5 mt-3">
          {EXAMPLES.map((ex) => (
            <button key={ex} onClick={() => { setQ(ex); ask(ex); }}
              className="text-[12px] px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200 text-slate-600 hover:border-brand hover:text-brand transition">
              {ex}
            </button>
          ))}
        </div>

        {askErr && <div className="mt-3 text-sm text-rose-600">{askErr}</div>}

        {askResult && (
          <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
            <div><KpiTile result={askResult} /></div>
            <div className="flex flex-col gap-2 pt-1">
              <div className="text-xs text-slate-500">
                Verstanden als:&nbsp;
                <code className="text-[11px] bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5">{JSON.stringify(askSpec)}</code>
              </div>
              <button onClick={pin} disabled={pinning || !askResult.ok}
                className="self-start px-4 py-2 rounded-xl bg-brand text-navy-dark font-bold hover:brightness-95 disabled:opacity-40 transition">
                {pinning ? 'Pinne …' : '📌 Ins Dashboard'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Gepinnte Kacheln ── */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">Dein Dashboard</h2>
          <span className="text-xs text-slate-400">{tiles.length} {tiles.length === 1 ? 'Kachel' : 'Kacheln'}</span>
        </div>
        {tiles.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/50 p-8 text-center text-sm text-slate-500">
            Noch nichts gepinnt. Stell oben eine Frage und klick <span className="font-semibold text-navy">📌 Ins Dashboard</span> — deine Kachel erscheint hier und aktualisiert sich automatisch.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tiles.map((t) => (
              <div key={t.id} className={t.span === 2 ? 'sm:col-span-2' : ''}>
                <KpiTile result={t.result} viz={t.viz} onUnpin={() => unpin(t.id)} busy={busyId === t.id} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
