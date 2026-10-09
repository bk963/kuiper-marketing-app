import { requireAdmin } from '@/lib/admin-auth';
import { dfsOverview, dfsRankedKeywords, dfsKeywordGap } from '@/lib/dataforseo';
import { latestIntel, dominanzHistory } from '@/lib/competitorIntel';
import { listDossiers } from '@/lib/dossier';
import CompetitorForm from '@/components/CompetitorForm';
import CompetitorAnalysis from '@/components/CompetitorAnalysis';
import DossierRefreshButton from '@/components/DossierRefreshButton';
import TodoActions from '@/components/TodoActions';
import StatCard from '@/components/StatCard';

const IMP: Record<string, string> = { hoch: 'bg-rose-100 text-rose-800', mittel: 'bg-amber-100 text-amber-800', gering: 'bg-slate-100 text-slate-700' };
const GLABEL: Record<string, string> = { sifa: 'SiFa', bsb: 'Brandschutz', pflege: 'Pflege', lokal: 'Lokal/NRW', kosten: 'Kosten', sonstige: 'Sonstige' };

export const dynamic = 'force-dynamic';

const OUR = (process.env.GSC_SITE_URL || 'sc-domain:kuiper-safety.de').replace('sc-domain:', '').replace(/^https?:\/\//, '');
function num(n: number) { return (n || 0).toLocaleString('de-DE'); }
function scoreColor(s: number) { return s >= 60 ? '#10a050' : s >= 30 ? '#e08900' : '#d03030'; }

export default async function CompetitorsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdmin();
  const sp = await searchParams;
  const domainsRaw = (Array.isArray(sp.domains) ? sp.domains[0] : sp.domains) || '';
  const competitors = domainsRaw.split(',').map((d) => d.trim()).filter(Boolean).slice(0, 4);

  const intel = await latestIntel();
  const ib = Array.isArray(intel?.leaderboard) ? intel.leaderboard : [];
  const iserps = Array.isArray(intel?.serps) ? intel.serps : [];
  const ianalysis = intel?.analysis || null;

  // Dominanz-Score + Verlauf
  const domHist = await dominanzHistory(14);
  const dom = intel?.dominanz || domHist[0] || null;
  const domPrev = domHist[1] || null;
  const domDelta = dom && domPrev ? (dom.score - domPrev.score) : null;
  const spark = [...domHist].reverse(); // älteste→neueste für Sparkline
  const byGroup = dom?.byGroup || dom?.by_group || {};
  const dossiers = await listDossiers();

  const ourOv = await dfsOverview(OUR);
  const compData = await Promise.all(competitors.map(async (c) => ({
    domain: c,
    ov: await dfsOverview(c),
    gap: await dfsKeywordGap(OUR, c, 30),
    kws: await dfsRankedKeywords(c, 20),
  })));

  return (
    <div className="max-w-7xl">
      <div className="flex items-start justify-between gap-4 flex-wrap mb-2">
        <h1 className="text-3xl font-extrabold">🥊 Wettbewerb</h1>
        <div className="flex items-center gap-2">
          <a href="/admin/competitors/strategie" className="text-sm px-3 py-1.5 rounded-lg bg-cyan-500 text-white font-bold hover:bg-cyan-400">♟️ Marktdominanz-Strategie</a>
          <a href="/admin/competitors/keywords" className="text-sm px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-semibold text-slate-700 hover:border-cyan-400 hover:text-cyan-700">🎯 Keywords</a>
        </div>
      </div>
      <p className="text-slate-600 mb-4">Wettbewerbs-Analyse via DataForSEO: geschätzter Organic-Traffic, Keyword-Lücken (sie ranken, wir nicht) & Top-Keywords. Eigene Domain: <b>{OUR}</b>.</p>

      {/* ===== DOMINANZ-SCORE ===== */}
      {dom && (
        <div className="bg-white rounded-xl border p-5 mb-8">
          <div className="flex items-start gap-6 flex-wrap">
            <div className="flex items-center gap-4">
              <div className="relative w-24 h-24 shrink-0">
                <svg viewBox="0 0 36 36" className="w-24 h-24 -rotate-90">
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="#eef2f7" strokeWidth="3.4" />
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke={scoreColor(dom.score)} strokeWidth="3.4"
                    strokeDasharray={`${dom.score} 100`} strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-extrabold text-slate-900">{dom.score}</span>
                  <span className="text-[10px] text-slate-400 -mt-0.5">/ 100</span>
                </div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-slate-400 font-semibold">Marktdominanz-Score</div>
                <div className="text-sm text-slate-700 mt-0.5 max-w-xs">Sichtbarkeit über alle beobachteten Keywords. <b>100 = überall #1.</b></div>
                {domDelta !== null && (
                  <div className={`text-xs font-semibold mt-1 ${domDelta > 0 ? 'text-emerald-600' : domDelta < 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                    {domDelta > 0 ? '▲ +' : domDelta < 0 ? '▼ ' : '● '}{domDelta !== 0 ? Math.abs(domDelta) : 'stabil'}{domDelta !== 0 ? ' ggü. letztem Lauf' : ''}
                  </div>
                )}
              </div>
            </div>

            {/* Mini-Stats */}
            <div className="flex gap-4 items-center">
              <div className="text-center"><div className="text-xl font-bold text-emerald-600">{dom.top3}</div><div className="text-[11px] text-slate-500">in Top 3</div></div>
              <div className="text-center"><div className="text-xl font-bold text-slate-700">{dom.top10}</div><div className="text-[11px] text-slate-500">in Top 10</div></div>
              <div className="text-center"><div className="text-xl font-bold text-rose-500">{dom.not_ranking ?? dom.notRanking}</div><div className="text-[11px] text-slate-500">nicht gelistet</div></div>
              <div className="text-center"><div className="text-xl font-bold text-slate-400">{dom.kw_count ?? dom.kwCount}</div><div className="text-[11px] text-slate-500">Keywords</div></div>
            </div>

            {/* Sparkline Verlauf */}
            {spark.length > 1 && (
              <div className="flex items-end gap-1 h-16 ml-auto" title="Verlauf (ältester → neuester Lauf)">
                {spark.map((p: any, i: number) => (
                  <div key={i} className="w-2.5 rounded-t" style={{ height: `${Math.max(4, p.score)}%`, background: scoreColor(p.score), opacity: i === spark.length - 1 ? 1 : 0.45 }} />
                ))}
              </div>
            )}
          </div>

          {/* Pro Gruppe */}
          {Object.keys(byGroup).length > 0 && (
            <div className="mt-5 pt-4 border-t grid grid-cols-2 md:grid-cols-5 gap-3">
              {Object.entries(byGroup).map(([g, v]: [string, any]) => (
                <div key={g}>
                  <div className="flex items-center justify-between mb-1"><span className="text-xs font-semibold text-slate-600">{GLABEL[g] || g}</span><span className="text-xs font-bold" style={{ color: scoreColor(v.score) }}>{v.score}</span></div>
                  <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden"><div className="h-full rounded-full" style={{ width: `${v.score}%`, background: scoreColor(v.score) }} /></div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{v.top3}/{v.count} in Top 3</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===== WETTBEWERBER-DOSSIERS ===== */}
      {dossiers.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-bold text-slate-900 mb-1">📇 Wettbewerber-Dossiers</h2>
          <p className="text-sm text-slate-600 mb-3">Lebende Profile der echten Konkurrenten — Traffic, Stärken und ihre Keyword-Lücken ggü. uns (= was wir ihnen abnehmen können). Täglich wird das älteste Dossier automatisch aufgefrischt.</p>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {dossiers.map((d: any) => {
              const staerken = Array.isArray(d.staerken) ? d.staerken : [];
              const luecken = Array.isArray(d.luecken) ? d.luecken : [];
              return (
                <div key={d.id} className="bg-white rounded-xl border p-4">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="font-bold text-slate-900">{d.domain}</div>
                    <DossierRefreshButton domain={d.domain} />
                  </div>
                  <div className="flex gap-4 text-sm mb-3">
                    <span><b>{num(d.traffic)}</b> <span className="text-slate-400">Besucher/Mon</span></span>
                    <span><b>{num(d.keywords)}</b> <span className="text-slate-400">Keywords</span></span>
                    <span><b>{num(d.top3)}</b> <span className="text-slate-400">Top 3</span></span>
                  </div>
                  {staerken.length > 0 && (
                    <div className="mb-3">
                      <div className="text-xs uppercase tracking-wide text-slate-400 font-semibold mb-1">Stärken</div>
                      <ul className="text-sm text-slate-700 list-disc list-inside space-y-0.5">{staerken.map((s: string, i: number) => <li key={i}>{s}</li>)}</ul>
                    </div>
                  )}
                  {luecken.length > 0 && (
                    <div>
                      <div className="text-xs uppercase tracking-wide text-slate-400 font-semibold mb-1">Keyword-Lücken (sie ranken, wir nicht)</div>
                      <div className="flex flex-wrap gap-1">
                        {luecken.slice(0, 8).map((k: any, i: number) => (
                          <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700" title={`Vol ${k.vol}/Mon · ihre Pos ${k.theirPos}`}>{k.kw}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="text-[10px] text-slate-400 mt-3">zuletzt aktualisiert: {d.zuletzt || '—'}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ===== Automatische Wettbewerbs-Suche (SERP-Discovery) ===== */}
      <div className="bg-white rounded-xl border p-5 mb-8">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
          <h2 className="text-lg font-bold text-slate-900">🔎 Automatische Wettbewerbs-Suche</h2>
          <span className="text-xs text-slate-400">{intel?.generated_at ? `zuletzt: ${new Date(intel.generated_at).toLocaleString('de-DE')}` : 'läuft täglich'}</span>
        </div>
        <p className="text-sm text-slate-600 mb-4">Durchsucht die Google-SERPs unserer Money-Keywords und entdeckt, <b>wer wofür rankt</b> — plus Chancen &amp; Maßnahmen. Aktualisiert täglich automatisch.</p>

        {!intel && <div className="p-6 text-center text-slate-500 text-sm bg-slate-50 rounded-lg">Noch keine Suche gelaufen – der tägliche Job füllt das in Kürze (oder ich stoße ihn einmalig an).</div>}

        {intel && (
          <>
            {ianalysis?.lage && <div className="mb-5 text-slate-800 leading-relaxed"><span className="text-xs uppercase tracking-wide text-slate-400 font-semibold block mb-1">Lage</span>{ianalysis.lage}</div>}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
              <Card title={`Wettbewerber-Leaderboard (wer rankt für unsere Keywords)`}>
                <div className="max-h-96 overflow-y-auto">
                  <Table headers={['Domain', 'Keywords', 'Ø Pos', 'Best', 'Typ']}>
                    {ib.map((l: any, i: number) => (
                      <tr key={i} className="border-t hover:bg-slate-50">
                        <td className="px-3 py-2">{l.domain}</td>
                        <td className="px-3 py-2 text-right font-mono">{l.appearances}</td>
                        <td className="px-3 py-2 text-right font-mono">{l.avgPosition}</td>
                        <td className="px-3 py-2 text-right font-mono">{l.bestPosition}</td>
                        <td className="px-3 py-2 text-right text-xs">{l.generic ? <span className="text-slate-400">Portal</span> : <span className="text-emerald-700 font-semibold">direkt</span>}</td>
                      </tr>
                    ))}
                  </Table>
                </div>
              </Card>

              <Card title="Wer rankt für welches Keyword (Top 3 + unsere Position)">
                <div className="max-h-96 overflow-y-auto">
                  <Table headers={['Keyword', 'Top 3', 'Wir']}>
                    {iserps.map((s: any, i: number) => (
                      <tr key={i} className="border-t hover:bg-slate-50 align-top">
                        <td className="px-3 py-2">{s.keyword}</td>
                        <td className="px-3 py-2 text-xs text-slate-600">{(s.top || []).slice(0, 3).map((t: any) => `${t.position}. ${t.domain}`).join(' · ')}</td>
                        <td className="px-3 py-2 text-right font-mono">{s.our ? <span className="text-emerald-700">Pos {s.our}</span> : <span className="text-rose-600">—</span>}</td>
                      </tr>
                    ))}
                  </Table>
                </div>
              </Card>
            </div>

            {Array.isArray(ianalysis?.chancen) && ianalysis.chancen.length > 0 && (
              <div className="mb-4">
                <span className="text-xs uppercase tracking-wide text-slate-400 font-semibold">🎯 Chancen</span>
                <ul className="list-disc list-inside text-sm text-slate-700 mt-1 space-y-1">{ianalysis.chancen.map((x: string, i: number) => <li key={i}>{x}</li>)}</ul>
              </div>
            )}

            {Array.isArray(ianalysis?.massnahmen) && ianalysis.massnahmen.length > 0 && (
              <div>
                <span className="text-xs uppercase tracking-wide text-slate-400 font-semibold">✅ Empfohlene Maßnahmen</span>
                <div className="space-y-2 mt-2">
                  {ianalysis.massnahmen.map((m: any, i: number) => (
                    <div key={i} className="border rounded-lg p-3">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-semibold text-slate-900">{m.title}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${IMP[m.impact] || 'bg-slate-100 text-slate-700'}`}>Impact: {m.impact}</span>
                        <span className="text-xs text-slate-500">Aufwand: {m.aufwand}</span>
                      </div>
                      <p className="text-sm text-slate-700 mb-2">{m.action}</p>
                      <TodoActions todo={{ title: m.title, category: 'Wettbewerb', action: m.action, impact: m.impact, effort: m.aufwand, source: 'wettbewerb-intel' }} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <h2 className="text-lg font-bold text-slate-900 mb-1">Einzel-Domain-Deep-Dive</h2>
      <p className="text-sm text-slate-600 mb-3">Eine bestimmte Domain tiefer analysieren (Traffic, Keyword-Lücken, Top-Keywords):</p>
      <CompetitorForm current={competitors.join(', ')} />

      <CompetitorAnalysis domains={competitors.join(',')} />

      {ourOv.error && <div className="p-4 rounded-xl border bg-amber-50 border-amber-200 text-sm text-amber-900 mb-6">DataForSEO: {ourOv.error}{ourOv.error.includes('40104') || ourOv.error.includes('verify') ? ' — Konto-Limits propagieren direkt nach Verifizierung noch (kurz warten).' : ''}</div>}

      {/* Overview-Vergleich */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <StatCard label={`${OUR} (wir)`} value={ourOv.data ? num(ourOv.data.etv) : '—'} hint="geschätzte Besucher/Mon" />
        {compData.map((c, i) => (
          <StatCard key={i} label={c.domain} value={c.ov.data ? num(c.ov.data.etv) : '—'} hint="geschätzte Besucher/Mon" />
        ))}
      </div>

      {ourOv.data && (
        <Card title={`Überblick-Vergleich (geschätzt)`} className="mb-8">
          <Table headers={['Domain', 'Traffic/Mon', 'Keywords', 'Top 3', 'Pos 4–10', 'Pos 11–20']}>
            <Row d={OUR + ' (wir)'} o={ourOv.data} highlight />
            {compData.map((c, i) => c.ov.data ? <Row key={i} d={c.domain} o={c.ov.data} /> : (
              <tr key={i} className="border-t"><td className="px-3 py-2">{c.domain}</td><td className="px-3 py-2 text-right text-slate-400" colSpan={5}>{c.ov.error || 'keine Daten'}</td></tr>
            ))}
          </Table>
        </Card>
      )}

      {competitors.length === 0 && (
        <div className="p-8 rounded-xl border bg-slate-50 border-slate-200 text-center text-slate-600">
          Gib oben eine oder mehrere <b>Wettbewerber-Domains</b> ein (z.B. aus Google-Suchen zu euren Keywords) — dann zeige ich Traffic-Vergleich, <b>Keyword-Lücken</b> und ihre Top-Keywords.
        </div>
      )}

      {compData.map((c, i) => (
        <div key={i} className="mb-8">
          <h2 className="text-xl font-bold text-slate-800 mb-3 mt-2">🎯 {c.domain}</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Card title={`Keyword-Lücken — sie ranken, wir (fast) nicht (${c.gap.data.length})`}>
              {c.gap.error ? <ErrBox msg={c.gap.error} /> : c.gap.data.length > 0 ? (
                <div className="max-h-96 overflow-y-auto">
                  <Table headers={['Keyword', 'Vol.', 'Ihre Pos.', 'Unsere Pos.']}>
                    {c.gap.data.map((k, j) => (
                      <tr key={j} className="border-t hover:bg-slate-50">
                        <td className="px-3 py-2 max-w-xs truncate">{k.keyword}</td>
                        <td className="px-3 py-2 text-right font-mono">{num(k.volume)}</td>
                        <td className="px-3 py-2 text-right font-mono text-emerald-600">{k.position}</td>
                        <td className="px-3 py-2 text-right font-mono text-rose-600">{k.ourPosition ?? '—'}</td>
                      </tr>
                    ))}
                  </Table>
                </div>
              ) : <Empty />}
            </Card>
            <Card title={`Ihre Top-Keywords (${c.kws.data.length})`}>
              {c.kws.error ? <ErrBox msg={c.kws.error} /> : c.kws.data.length > 0 ? (
                <div className="max-h-96 overflow-y-auto">
                  <Table headers={['Keyword', 'Vol.', 'Pos.', 'CPC €']}>
                    {c.kws.data.map((k, j) => (
                      <tr key={j} className="border-t hover:bg-slate-50">
                        <td className="px-3 py-2 max-w-xs truncate">{k.keyword}</td>
                        <td className="px-3 py-2 text-right font-mono">{num(k.volume)}</td>
                        <td className="px-3 py-2 text-right font-mono">{k.position}</td>
                        <td className="px-3 py-2 text-right font-mono">{k.cpc || '—'}</td>
                      </tr>
                    ))}
                  </Table>
                </div>
              ) : <Empty />}
            </Card>
          </div>
        </div>
      ))}
    </div>
  );
}

function Row({ d, o, highlight }: { d: string; o: any; highlight?: boolean }) {
  return (
    <tr className={`border-t ${highlight ? 'bg-sky-50/60 font-semibold' : 'hover:bg-slate-50'}`}>
      <td className="px-3 py-2">{d}</td>
      <td className="px-3 py-2 text-right font-mono">{(o.etv || 0).toLocaleString('de-DE')}</td>
      <td className="px-3 py-2 text-right font-mono">{(o.keywords || 0).toLocaleString('de-DE')}</td>
      <td className="px-3 py-2 text-right font-mono">{(o.pos1 + o.pos2_3) || 0}</td>
      <td className="px-3 py-2 text-right font-mono">{o.pos4_10 || 0}</td>
      <td className="px-3 py-2 text-right font-mono">{o.pos11_20 || 0}</td>
    </tr>
  );
}
function Card({ title, children, className = '' }: { title: string; children: React.ReactNode; className?: string }) {
  return <div className={`bg-white rounded-xl border overflow-hidden ${className}`}><div className="px-4 py-3 border-b font-bold text-sm text-slate-700">{title}</div>{children}</div>;
}
function Table({ headers, children }: { headers: string[]; children: React.ReactNode }) {
  return <table className="w-full text-sm"><thead className="bg-slate-50/70 text-xs uppercase tracking-wide text-slate-500 sticky top-0"><tr>{headers.map((h, i) => <th key={i} className={`px-3 py-2 font-semibold ${i === 0 ? 'text-left' : 'text-right'}`}>{h}</th>)}</tr></thead><tbody>{children}</tbody></table>;
}
function Empty() { return <div className="p-6 text-center text-slate-500 text-sm">Keine Daten</div>; }
function ErrBox({ msg }: { msg: string }) { return <div className="p-4 text-sm text-amber-800 bg-amber-50">{msg}{(msg.includes('40104') || msg.includes('verify')) ? ' — Limits propagieren noch, kurz warten.' : ''}</div>; }
