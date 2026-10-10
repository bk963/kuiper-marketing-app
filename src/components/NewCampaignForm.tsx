'use client';
import { useState } from 'react';

type Defaults = { gegner: string; region: string; zielperson: string };
const KANAELE = [
  { k: 'blog', label: '📝 Blog/SEO' }, { k: 'linkedin', label: '💼 LinkedIn' },
  { k: 'reel', label: '🎬 Instagram-Reel' }, { k: 'whatsapp', label: '💬 WhatsApp' }, { k: 'youtube', label: '▶️ YouTube' },
];

export default function NewCampaignForm({ defaults, suggestion }: { defaults: Defaults; suggestion?: { thema: string; keywords: string } }) {
  const [thema, setThema] = useState(suggestion?.thema || '');
  const [keywords, setKeywords] = useState(suggestion?.keywords || '');
  const [kanaele, setKanaele] = useState<string[]>(['blog', 'linkedin', 'reel', 'whatsapp']);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const toggle = (k: string) => setKanaele((s) => s.includes(k) ? s.filter((x) => x !== k) : [...s, k]);

  const create = async () => {
    if (!thema.trim()) { setErr('Thema eingeben'); return; }
    setBusy(true); setErr('');
    try {
      const r = await fetch('/admin/api/campaign', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ thema, keywords: keywords.split(',').map((x) => x.trim()).filter(Boolean), kanaele, ...defaults }),
      });
      const d = await r.json();
      if (!d.ok) { setErr(d.error || 'Fehler'); setBusy(false); return; }
      location.reload();
    } catch (e: any) { setErr(e?.message || 'Fehler'); setBusy(false); }
  };

  return (
    <div className="bg-white rounded-xl border p-5 mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-bold text-slate-900">Neue Kampagne</h2>
        <span className="text-xs text-slate-400">Gegner <b className="text-amber-700">{defaults.gegner || '—'}</b> · {defaults.region} · {defaults.zielperson}</span>
      </div>
      {suggestion && <p className="text-xs text-cyan-700 mb-2">💡 Vorschlag aus der Ausrichtung (rote Keyword-Zeile) — anpassbar.</p>}
      <div className="space-y-3">
        <label className="block text-sm"><span className="text-xs text-slate-500 font-semibold">Thema</span>
          <input value={thema} onChange={(e) => setThema(e.target.value)} placeholder="z.B. Externer Brandschutzbeauftragter Köln für Pflegeeinrichtungen" className="w-full border border-slate-200 rounded-lg px-3 py-2 mt-1 text-sm" /></label>
        <label className="block text-sm"><span className="text-xs text-slate-500 font-semibold">Ziel-Keywords (kommagetrennt)</span>
          <input value={keywords} onChange={(e) => setKeywords(e.target.value)} placeholder="externer brandschutzbeauftragter köln, brandschutz pflegeheim köln" className="w-full border border-slate-200 rounded-lg px-3 py-2 mt-1 text-sm" /></label>
        <div className="text-sm"><span className="text-xs text-slate-500 font-semibold">Kanäle</span>
          <div className="flex flex-wrap gap-1.5 mt-1">{KANAELE.map((c) => (
            <button key={c.k} onClick={() => toggle(c.k)} className={`text-xs px-3 py-1.5 rounded-full border ${kanaele.includes(c.k) ? 'bg-cyan-500 text-white border-cyan-500' : 'bg-white text-slate-600 border-slate-200'}`}>{c.label}</button>
          ))}</div>
        </div>
        {err && <p className="text-xs text-rose-600">{err}</p>}
        <button onClick={create} disabled={busy} className="px-4 py-2 rounded-lg bg-cyan-500 text-white text-sm font-bold hover:bg-cyan-400 disabled:opacity-60">
          {busy ? 'Wird angelegt…' : '🏭 Kampagne erzeugen (Opus, ~3–5 Min)'}
        </button>
        <p className="text-[11px] text-slate-400">Der Generator erzeugt alle Kanäle als Entwurf. Veröffentlicht wird erst nach deiner Freigabe.</p>
      </div>
    </div>
  );
}
