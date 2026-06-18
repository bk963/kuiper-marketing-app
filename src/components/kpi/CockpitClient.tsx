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
  'Leads und Kosten pro Lead letzte 7 Tage',
  'Klicks, CTR und Kosten bei Google diese Woche',
  'Qualifizierte Leads letzte 30 Tage',
  'Conversions letzte 30 Tage in Köln',
  'Qualifizierte Leads je Stadt',
  'Lead-Verlauf der letzten 90 Tage',
];

export default function CockpitClient({ initialTiles }: { initialTiles: RenderedTile[] }) {
  const [q, setQ] = useState('');
  const [asking, setAsking] = useState(false);
  const [askErr, setAskErr] = useState<string | null>(null);
  const [askResults, setAskResults] = useState<{ spec: QuerySpec; result: KpiResult }[]>([]);
  const [tiles, setTiles] = useState<RenderedTile[]>(initialTiles);
  const [pinning, setPinning] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function ask(question: string) {
    const text = question.trim();
    if (!text || asking) return;
    setAsking(true); setAskErr(null); setAskResults([]);
    try {
      const r = await fetch('/admin/api/kpi/ask', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: text }),
      });
      const d = await r.json();
      if (!r.ok) { setAskErr(d.error || 'Frage nicht verstanden.'); return; }
      // Multi-Metrik: results[] = alle Kacheln; Fallback auf Einzel (Alt-Format).
      const list = Array.isArray(d.results) && d.results.length
        ? d.results
        : (d.result ? [{ spec: d.spec, result: d.result }] : []);
      setAskResults(list);
    } catch { setAskErr('Verbindungsfehler.'); }
    finally { setAsking(false); }
  }

  /** Eine einzelne Kennzahl ins Dashboard pinnen. */
  async function pinOne(spec: QuerySpec, result: KpiResult) {
    const r = await fetch('/admin/api/kpi/tiles', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ spec }),
    });
    const d = await r.json();
    if (!r.ok) throw new Error(d.error || 'Pinnen fehlgeschlagen.');
    setTiles((t) => [...t, { id: d.tile.id, viz: d.tile.viz || 'auto', span: d.tile.span || 1, result }]);
  }

  /** Alle aktuellen Ergebnisse pinnen (oder eines, wenn nur eines da ist). */
  async function pinAll() {
    if (!askResults.length || pinning) return;
    setPinning(true);
    try {
      for (const { spec, result } of askResults) {
        if (result?.ok) await pinOne(spec, result);
      }
      setAskResults([]); setQ('');
    } catch (e: any) { setAskErr(e?.message || 'Pinnen fehlgeschlagen.'); }
    finally { setPinning(false); }
  }

  async function unpin(id: string) {
    setBusyId(id);
    try {
      const r = await fetch(`/admin/api/kpi/tiles/${id}`, { method: 'DELETE' });
      if (r.ok) setTiles((t) => t.filter((x) => x.id !== id));
    } finally { setBusyId(null); }
  }

  async function move(idx: number, dir: -1 | 1) {
    const j = idx + dir;
    if (j < 0 || j >= tiles.length) return;
    const next = [...tiles];
    [next[idx], next[j]] = [next[j], next[idx]];
    setTiles(next);
    // Positionen der beiden vertauschten Kacheln persistieren
    await Promise.all([
      fetch(`/admin/api/kpi/tiles/${next[idx].id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ position: idx + 1 }) }),
      fetch(`/admin/api/kpi/tiles/${next[j].id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ position: j + 1 }) }),
    ]).catch(() => {});
  }

  async function toggleSpan(id: string) {
    setTiles((t) => t.map((x) => x.id === id ? { ...x, span: x.span === 2 ? 1 : 2 } : x));
    const cur = tiles.find((x) => x.id === id);
    const newSpan = cur && cur.span === 2 ? 1 : 2;
    fetch(`/admin/api/kpi/tiles/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ span: newSpan }) }).catch(() => {});
  }

  const [refreshing, setRefreshing] = useState(false);
  async function refreshAll() {
    if (refreshing || !tiles.length) return;
    setRefreshing(true);
    try {
      const updated = await Promise.all(tiles.map(async (t) => {
        try {
          const r = await fetch('/admin/api/kpi/run', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ spec: t.result.spec }) });
          const d = await r.json();
          return r.ok && d.result ? { ...t, result: d.result } : t;
        } catch { return t; }
      }));
      setTiles(updated);
    } finally { setRefreshing(false); }
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

        {askResults.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs text-slate-500">
                {askResults.length === 1 ? 'Ergebnis' : `${askResults.length} Kennzahlen erkannt`}
              </div>
              <button onClick={pinAll} disabled={pinning || !askResults.some((x) => x.result?.ok)}
                className="px-4 py-2 rounded-xl bg-brand text-navy-dark font-bold hover:brightness-95 disabled:opacity-40 transition">
                {pinning ? 'Pinne …' : askResults.length === 1 ? '📌 Ins Dashboard' : '📌 Alle ins Dashboard'}
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
              {askResults.map((x, i) => (
                <div key={i}><KpiTile result={x.result} /></div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Gepinnte Kacheln ── */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">Dein Dashboard</h2>
          <div className="flex items-center gap-3">
            {tiles.length > 0 && (
              <button onClick={refreshAll} disabled={refreshing}
                className="text-xs font-semibold text-slate-500 hover:text-brand disabled:opacity-40 transition flex items-center gap-1">
                <span className={refreshing ? 'inline-block animate-spin' : ''}>⟳</span> {refreshing ? 'Aktualisiere …' : 'Aktualisieren'}
              </button>
            )}
            <span className="text-xs text-slate-400">{tiles.length} {tiles.length === 1 ? 'Kachel' : 'Kacheln'}</span>
          </div>
        </div>
        {tiles.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/50 p-8 text-center text-sm text-slate-500">
            Noch nichts gepinnt. Stell oben eine Frage und klick <span className="font-semibold text-navy">📌 Ins Dashboard</span> — deine Kachel erscheint hier und aktualisiert sich automatisch.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tiles.map((t, i) => (
              <div key={t.id} className={t.span === 2 ? 'sm:col-span-2' : ''}>
                <KpiTile
                  result={t.result} viz={t.viz}
                  onUnpin={() => unpin(t.id)}
                  onMoveUp={i > 0 ? () => move(i, -1) : undefined}
                  onMoveDown={i < tiles.length - 1 ? () => move(i, 1) : undefined}
                  onToggleSpan={() => toggleSpan(t.id)}
                  busy={busyId === t.id}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
