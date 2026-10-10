import { requireAdmin } from '@/lib/admin-auth';
import { listTrackingRecords } from '@/lib/pb-tracking';
import { getAusrichtung, getHeadToHead } from '@/lib/ausrichtung';
import NewCampaignForm from '@/components/NewCampaignForm';
import CampaignApprove from '@/components/CampaignApprove';

export const dynamic = 'force-dynamic';

const STATUS: Record<string, { c: string; t: string }> = {
  angefragt: { c: 'bg-sky-100 text-sky-800', t: '⏳ angefragt' },
  erzeugt_laeuft: { c: 'bg-amber-100 text-amber-800 animate-pulse', t: '⚙️ wird erzeugt (Opus)' },
  entwurf: { c: 'bg-violet-100 text-violet-800', t: '📝 Entwurf — zur Freigabe' },
  freigegeben: { c: 'bg-emerald-100 text-emerald-800', t: '✅ freigegeben' },
  fehler: { c: 'bg-rose-100 text-rose-800', t: '⚠️ Fehler' },
};
function arr(v: any): any[] { return Array.isArray(v) ? v : []; }

export default async function ContentKampagnePage() {
  await requireAdmin();
  const a = await getAusrichtung();
  const [h2h, campRes] = await Promise.all([getHeadToHead(a), listTrackingRecords('mkt_campaigns', { sort: '-created', perPage: 20 })]);
  const camps = (campRes as any)?.items || [];
  // Vorschlag: erste rote Zeile (wir ranken nicht, Gegner schon)
  const red = h2h.find((r: any) => !r.our && r.gegner.some((g: any) => g.pos));
  const suggestion = red ? { thema: `${red.keyword} — ${a.region}`, keywords: red.keyword } : undefined;

  return (
    <div className="max-w-4xl">
      <div className="text-xs uppercase tracking-wide text-cyan-600 font-semibold font-mono">Content-Maschine</div>
      <h1 className="text-3xl font-extrabold mb-1">🏭 Content-Kampagne</h1>
      <p className="text-slate-600 mb-5 max-w-2xl">Ein Thema → alle Kanäle als Entwurf, in Kuiper-Stimme, geerdet auf das Regelwerk (E-E-A-T, claim-safe). Freigabe vor jeder Veröffentlichung.</p>

      <NewCampaignForm defaults={{ gegner: a.gegner[0] || '', region: a.region, zielperson: a.zielperson }} suggestion={suggestion} />

      <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-3">Kampagnen ({camps.length})</h2>
      <div className="space-y-4">
        {camps.length === 0 && <p className="text-sm text-slate-500">Noch keine Kampagne. Oben eine starten.</p>}
        {camps.map((c: any) => {
          const st = STATUS[c.status] || { c: 'bg-slate-100 text-slate-600', t: c.status };
          const p = (typeof c.pieces === 'string' ? JSON.parse(c.pieces || '{}') : c.pieces) || {};
          const ready = c.status === 'entwurf' || c.status === 'freigegeben';
          return (
            <div key={c.id} className="bg-white rounded-xl border p-5">
              <div className="flex items-start justify-between gap-3 flex-wrap mb-2">
                <div><div className="font-bold text-slate-900">{c.thema}</div>
                  <div className="text-[11px] text-slate-400 font-mono">{arr(c.kanaele).join(' · ')}{c.gegner ? ` · vs ${c.gegner}` : ''}</div></div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${st.c}`}>{st.t}</span>
                  {c.status === 'entwurf' && <CampaignApprove id={c.id} />}
                </div>
              </div>
              {c.status === 'erzeugt_laeuft' && <p className="text-sm text-amber-700">Opus schreibt gerade alle Kanäle … (~3–5 Min, Seite neu laden)</p>}
              {ready && (
                <div className="mt-3 space-y-4">
                  {p.blog?.h1 && (
                    <details open className="border rounded-lg p-3">
                      <summary className="font-semibold text-sm cursor-pointer">📝 Blog/SEO — {p.blog.h1}</summary>
                      <div className="mt-2 text-xs text-slate-500 font-mono">{p.blog.title_tag} · {p.blog.meta}</div>
                      <p className="text-sm text-slate-700 mt-2">{p.blog.intro}</p>
                      {arr(p.blog.faq).length > 0 && <ul className="mt-2 text-xs text-slate-600 list-disc list-inside">{arr(p.blog.faq).slice(0, 4).map((f: any, i: number) => <li key={i}><b>{f.q}</b></li>)}</ul>}
                    </details>
                  )}
                  {arr(p.linkedin).length > 0 && (
                    <details className="border rounded-lg p-3"><summary className="font-semibold text-sm cursor-pointer">💼 LinkedIn ({arr(p.linkedin).length})</summary>
                      <div className="mt-2 space-y-2">{arr(p.linkedin).map((x: any, i: number) => <p key={i} className="text-sm text-slate-700 whitespace-pre-line border-l-2 border-slate-200 pl-3">{typeof x === 'string' ? x : JSON.stringify(x)}</p>)}</div></details>
                  )}
                  {arr(p.reel).length > 0 && (
                    <details className="border rounded-lg p-3"><summary className="font-semibold text-sm cursor-pointer">🎬 Reels ({arr(p.reel).length})</summary>
                      <div className="mt-2 space-y-3">{arr(p.reel).map((r: any, i: number) => (
                        <div key={i} className="text-sm"><b className="text-slate-900">{r.hook}</b><ul className="text-xs text-slate-600 list-disc list-inside mt-1">{arr(r.szenen).map((s: any, j: number) => <li key={j}>{s}</li>)}</ul><div className="text-xs text-slate-400 mt-1">{r.caption} {arr(r.hashtags).join(' ')}</div></div>
                      ))}</div></details>
                  )}
                  {arr(p.whatsapp).length > 0 && (
                    <details className="border rounded-lg p-3"><summary className="font-semibold text-sm cursor-pointer">💬 WhatsApp ({arr(p.whatsapp).length})</summary>
                      <div className="mt-2 space-y-1.5">{arr(p.whatsapp).map((x: any, i: number) => <p key={i} className="text-sm text-slate-700 bg-emerald-50 rounded-lg px-3 py-2">{typeof x === 'string' ? x : JSON.stringify(x)}</p>)}</div></details>
                  )}
                  {p.youtube?.titel && (
                    <details className="border rounded-lg p-3"><summary className="font-semibold text-sm cursor-pointer">▶️ YouTube — {p.youtube.titel}</summary>
                      <p className="text-sm text-slate-700 mt-2">{p.youtube.hook}</p>
                      <ul className="text-xs text-slate-600 list-disc list-inside mt-1">{arr(p.youtube.kapitel).map((k: any, i: number) => <li key={i}>{k}</li>)}</ul></details>
                  )}
                  {arr(p.bilder).length > 0 && (
                    <details className="border rounded-lg p-3"><summary className="font-semibold text-sm cursor-pointer">🖼️ Bild-Vorgaben ({arr(p.bilder).length})</summary>
                      <ul className="mt-2 text-xs text-slate-600 list-disc list-inside space-y-1">{arr(p.bilder).map((x: any, i: number) => <li key={i}>{typeof x === 'string' ? x : JSON.stringify(x)}</li>)}</ul></details>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
