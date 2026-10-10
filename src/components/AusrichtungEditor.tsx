'use client';
import { useState } from 'react';

type A = { id?: string; keil: string; region: string; zielperson: string; ziel_score: number; ziel_leads: number; fokus_gruppen: string[]; gegner: string[] };
const GRUPPEN = ['sifa', 'bsb', 'pflege', 'lokal', 'kosten'];

export default function AusrichtungEditor({ initial }: { initial: A }) {
  const [open, setOpen] = useState(false);
  const [a, setA] = useState<A>(initial);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const save = async () => {
    setSaving(true); setErr('');
    try {
      const r = await fetch('/admin/api/ausrichtung', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...a, gegner: a.gegner, fokus_gruppen: a.fokus_gruppen }),
      });
      const d = await r.json();
      if (!d.ok) { setErr(d.error || 'Fehler'); setSaving(false); return; }
      location.reload();
    } catch (e: any) { setErr(e?.message || 'Fehler'); setSaving(false); }
  };

  if (!open) return (
    <button onClick={() => setOpen(true)} className="text-sm px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-semibold text-slate-700 hover:border-cyan-400 hover:text-cyan-700">⚙️ Ausrichtung ändern</button>
  );

  const toggleGruppe = (g: string) => setA((s) => ({ ...s, fokus_gruppen: s.fokus_gruppen.includes(g) ? s.fokus_gruppen.filter((x) => x !== g) : [...s.fokus_gruppen, g] }));

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4" onClick={() => !saving && setOpen(false)}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-5 space-y-3" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-bold text-lg text-slate-900">Ausrichtung ändern</h3>
        <label className="block text-sm"><span className="text-xs text-slate-500 font-semibold">Keil (Fokus)</span>
          <input value={a.keil} onChange={(e) => setA({ ...a, keil: e.target.value })} className="w-full border border-slate-200 rounded-lg px-3 py-2 mt-1 text-sm" /></label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm"><span className="text-xs text-slate-500 font-semibold">Region</span>
            <input value={a.region} onChange={(e) => setA({ ...a, region: e.target.value })} className="w-full border border-slate-200 rounded-lg px-3 py-2 mt-1 text-sm" /></label>
          <label className="block text-sm"><span className="text-xs text-slate-500 font-semibold">Zielperson</span>
            <input value={a.zielperson} onChange={(e) => setA({ ...a, zielperson: e.target.value })} className="w-full border border-slate-200 rounded-lg px-3 py-2 mt-1 text-sm" /></label>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm"><span className="text-xs text-slate-500 font-semibold">Ziel Dominanz-Score</span>
            <input type="number" min={0} max={100} value={a.ziel_score} onChange={(e) => setA({ ...a, ziel_score: Number(e.target.value) })} className="w-full border border-slate-200 rounded-lg px-3 py-2 mt-1 text-sm" /></label>
          <label className="block text-sm"><span className="text-xs text-slate-500 font-semibold">Ziel Leads / Woche</span>
            <input type="number" min={0} value={a.ziel_leads} onChange={(e) => setA({ ...a, ziel_leads: Number(e.target.value) })} className="w-full border border-slate-200 rounded-lg px-3 py-2 mt-1 text-sm" /></label>
        </div>
        <div className="text-sm"><span className="text-xs text-slate-500 font-semibold">Fokus-Gruppen (zählen für den Nordstern)</span>
          <div className="flex flex-wrap gap-1.5 mt-1">{GRUPPEN.map((g) => (
            <button key={g} onClick={() => toggleGruppe(g)} className={`text-xs px-2.5 py-1 rounded-full border ${a.fokus_gruppen.includes(g) ? 'bg-cyan-500 text-white border-cyan-500' : 'bg-white text-slate-500 border-slate-200'}`}>{g}</button>
          ))}</div>
        </div>
        <label className="block text-sm"><span className="text-xs text-slate-500 font-semibold">Gegner (Domains, kommagetrennt)</span>
          <input value={a.gegner.join(', ')} onChange={(e) => setA({ ...a, gegner: e.target.value.split(',').map((x) => x.trim()).filter(Boolean) })} className="w-full border border-slate-200 rounded-lg px-3 py-2 mt-1 text-sm" placeholder="fss-service.de, ias-gruppe.de" /></label>
        {err && <p className="text-xs text-rose-600">{err}</p>}
        <div className="flex justify-end gap-2 pt-1">
          <button onClick={() => setOpen(false)} disabled={saving} className="text-sm px-3 py-2 rounded-lg text-slate-500">Abbrechen</button>
          <button onClick={save} disabled={saving} className="text-sm px-4 py-2 rounded-lg bg-cyan-500 text-white font-semibold hover:bg-cyan-400 disabled:opacity-60">{saving ? 'Speichert…' : 'Speichern'}</button>
        </div>
      </div>
    </div>
  );
}
