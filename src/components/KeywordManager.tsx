'use client';
import { useState } from 'react';

type KW = { id: string; keyword: string; gruppe: string; aktiv: boolean };
const GRUPPEN = ['sifa', 'bsb', 'pflege', 'lokal', 'kosten', 'sonstige'];
const GLABEL: Record<string, string> = { sifa: 'SiFa', bsb: 'Brandschutz', pflege: 'Pflege', lokal: 'Lokal/NRW', kosten: 'Kosten', sonstige: 'Sonstige' };
const GCOLOR: Record<string, string> = {
  sifa: 'bg-sky-100 text-sky-800', bsb: 'bg-amber-100 text-amber-800', pflege: 'bg-emerald-100 text-emerald-800',
  lokal: 'bg-violet-100 text-violet-800', kosten: 'bg-rose-100 text-rose-800', sonstige: 'bg-slate-100 text-slate-700',
};

export default function KeywordManager({ initial }: { initial: KW[] }) {
  const [items, setItems] = useState<KW[]>(initial);
  const [kw, setKw] = useState('');
  const [gruppe, setGruppe] = useState('sifa');
  const [busy, setBusy] = useState(false);

  const api = (method: string, body: any) =>
    fetch('/admin/api/competitors/keywords', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then((r) => r.json());

  const add = async () => {
    const k = kw.trim(); if (!k) return;
    setBusy(true);
    const d = await api('POST', { keyword: k, gruppe });
    if (d.ok) { setItems((s) => [...s, { id: d.id, keyword: k, gruppe, aktiv: true }]); setKw(''); }
    setBusy(false);
  };
  const toggle = async (it: KW) => {
    setItems((s) => s.map((x) => x.id === it.id ? { ...x, aktiv: !x.aktiv } : x));
    await api('PATCH', { id: it.id, aktiv: !it.aktiv });
  };
  const remove = async (it: KW) => {
    if (!confirm(`Keyword "${it.keyword}" löschen?`)) return;
    setItems((s) => s.filter((x) => x.id !== it.id));
    await api('DELETE', { id: it.id });
  };

  const byGroup = GRUPPEN.map((g) => ({ g, rows: items.filter((i) => i.gruppe === g) })).filter((x) => x.rows.length);
  const activeCount = items.filter((i) => i.aktiv).length;

  return (
    <div>
      <div className="flex flex-wrap items-end gap-2 mb-5 bg-white rounded-xl border p-4">
        <div className="flex-1 min-w-[220px]">
          <label className="text-xs text-slate-500 font-semibold block mb-1">Neues Keyword</label>
          <input value={kw} onChange={(e) => setKw(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()}
            placeholder="z.B. externe fachkraft für arbeitssicherheit hamburg"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="text-xs text-slate-500 font-semibold block mb-1">Gruppe</label>
          <select value={gruppe} onChange={(e) => setGruppe(e.target.value)} className="border border-slate-200 rounded-lg px-3 py-2 text-sm">
            {GRUPPEN.map((g) => <option key={g} value={g}>{GLABEL[g]}</option>)}
          </select>
        </div>
        <button onClick={add} disabled={busy || !kw.trim()}
          className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-semibold hover:bg-slate-700 disabled:opacity-50">
          + Hinzufügen
        </button>
      </div>

      <p className="text-xs text-slate-500 mb-3">{activeCount} aktiv · {items.length} gesamt — nur <b>aktive</b> Keywords werden täglich gescannt &amp; fließen in Dominanz-Score + Strategie.</p>

      {byGroup.map(({ g, rows }) => (
        <div key={g} className="mb-5">
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${GCOLOR[g]}`}>{GLABEL[g]}</span>
            <span className="text-xs text-slate-400">{rows.filter((r) => r.aktiv).length}/{rows.length} aktiv</span>
          </div>
          <div className="bg-white rounded-xl border divide-y">
            {rows.map((it) => (
              <div key={it.id} className="flex items-center gap-3 px-3 py-2">
                <input type="checkbox" checked={it.aktiv} onChange={() => toggle(it)} className="w-4 h-4 accent-cyan-500" />
                <span className={`text-sm flex-1 ${it.aktiv ? 'text-slate-900' : 'text-slate-400 line-through'}`}>{it.keyword}</span>
                <button onClick={() => remove(it)} className="text-xs text-slate-400 hover:text-rose-600">löschen</button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
