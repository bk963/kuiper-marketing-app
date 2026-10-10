/**
 * Kuiper Marketing-Brain — täglicher Analyse-Lauf.
 * Sammelt Signale (GA4/GSC/Ads/Clarity/Leads) → GEX44 (on-prem, DSGVO) → priorisierte To-dos.
 * Speichert Report in pb-tracking (mkt_brain_reports). Ausgelöst via /admin/api/brain/run (Cron).
 */
import { ga4Overview, ga4TopPages, ga4SourceMedium, ga4Channels } from '@/lib/ga4';
import { gscSiteOverview, gscMovers, gscQueryPage } from '@/lib/gsc';
import { gadsAccountSummary, gadsCampaigns } from '@/lib/google-ads';
import { clarityInsights } from '@/lib/clarity';
import { createTrackingRecord, listTrackingRecords } from '@/lib/pb-tracking';
import { askGex44 } from '@/lib/gex44';
import { parseLlmJson, dedupeByTitle } from '@/lib/llmjson';

export async function collectSignals(days = 28) {
  const [ov, topPages, srcMedium, channels, gsc, movers, qp, ads, camps, clarity] = await Promise.all([
    ga4Overview(days), ga4TopPages(days, 10), ga4SourceMedium(days, 8), ga4Channels(days),
    gscSiteOverview(days), gscMovers(days, 8), gscQueryPage(days, 40),
    gadsAccountSummary(days), gadsCampaigns(days, 10), clarityInsights(3, 'URL'),
  ]);

  // SEO-Chancen: hohe Impressionen, Position 4–20 (Striking Distance → mit wenig Aufwand auf Seite 1)
  const seoOpportunities = (qp || [])
    .filter((r: any) => r.position > 3 && r.position <= 20 && r.impressions >= 30)
    .sort((a: any, b: any) => b.impressions - a.impressions)
    .slice(0, 12)
    .map((r: any) => ({
      query: r.query, page: r.page.replace(/^https?:\/\//, ''), impressions: r.impressions, clicks: r.clicks,
      position: Math.round(r.position * 10) / 10,
      // GSC-Gegencheck: rankt die Seite für diesen Begriff schon gut? Dann NICHT neu schreiben,
      // sonst riskiert man ein bestehendes Ranking (vgl. "Brandklassen" = Pos ~7, voll optimiert).
      standing: r.position <= 8 ? 'rankt_bereits_gut' : 'striking_distance',
    }));

  // Friktion: Seiten mit den meisten Rage/Dead-Clicks
  const friction = (clarity?.byUrl || [])
    .map((x) => ({ url: x.url.replace(/^https?:\/\/(www\.)?/, ''), sessions: x.sessions, dead: x.deadClicks, rage: x.rageClicks, quickBack: x.quickBacks, scriptErr: x.scriptErrors, score: x.deadClicks + x.rageClicks * 2 + x.quickBacks + x.scriptErrors * 2 }))
    .filter((x) => x.score > 0).sort((a, b) => b.score - a.score).slice(0, 8);

  // Leads: echte form_submit-Events letzte 7 Tage — OHNE die Test-Absendungen des
  // BSH-Form-Watchdogs (Cron alle 2h via HeadlessChrome). Die blähten die Zahl sonst massiv auf.
  let leads7d = 0;
  try {
    const since = new Date(Date.now() - 7 * 86400000).toISOString().replace('T', ' ').slice(0, 19);
    const r = await listTrackingRecords('tracking_events', { filter: `event_type~"form_submit" && created>="${since}" && user_agent !~ "Headless"`, perPage: 500, fields: 'id' });
    leads7d = (r as any)?.items?.length ?? 0;
  } catch { /* */ }

  return {
    period_days: days,
    ga4: ov ? { sessions: ov.total.sessions, users: ov.total.users, pageviews: ov.total.pageviews, engagementRate: Math.round(ov.total.engagementRate * 100) } : null,
    channels: (channels || []).map((c) => ({ channel: c.channel, sessions: c.sessions, conversions: c.conversions })),
    sourceMedium: (srcMedium || []).slice(0, 8).map((s) => ({ src: s.sourceMedium, sessions: s.sessions, conv: s.conversions })),
    topPages: (topPages || []).map((p) => ({ path: p.path, views: p.pageviews })),
    gsc: gsc ? { clicks: gsc.total.clicks, impressions: gsc.total.impressions, ctr: Math.round((gsc.total.clicks / Math.max(gsc.total.impressions, 1)) * 1000) / 10, position: Math.round(gsc.total.position * 10) / 10 } : null,
    seoMovers: { gainers: (movers?.gainers || []).slice(0, 6).map((m: any) => ({ q: m.query, dClicks: m.deltaClicks })), losers: (movers?.losers || []).slice(0, 6).map((m: any) => ({ q: m.query, dClicks: m.deltaClicks })) },
    seoOpportunities,
    ads: ads ? { spend: Math.round(ads.cost), clicks: ads.clicks, cpc: Math.round(ads.cpc * 100) / 100, conversions: ads.conversions, cpa: Math.round(ads.cpa) } : null,
    campaigns: (camps || []).slice(0, 8).map((c: any) => ({ name: c.name, spend: Math.round(c.cost), conv: c.conversions, cpa: c.conversions ? Math.round(c.cost / c.conversions) : null })),
    frictionPages: friction,
    leads7d,
  };
}

const SYS = `Du bist der Marketing-Analyst von Kuiper Safety Systems. STRATEGISCHES ZIEL: Marktführerschaft als externe SiFa (Fachkraft für Arbeitssicherheit) + externer Brandschutzbeauftragter (BSB), done-for-you, Fokus Pflegeeinrichtungen & Pflegedienste (wiederkehrende Verträge > einmalige Kurse). Priorisiere Maßnahmen, die auf dieses Ziel einzahlen. B2B, Deutschland.
Analysiere die Marketing-Signale und liefere die wichtigsten, KONKRETEN Handlungsempfehlungen.
Regeln: claim-safe (keine Heils-/Garantieversprechen, Haftung nur als Risiko), DE, umsetzbar, nach echtem Geschäftsimpact priorisiert (Leads/Umsatz, nicht nur Klicks).

WICHTIGER GUARDRAIL (SEO): In seoOpportunities steht pro Keyword ein "standing".
- standing="rankt_bereits_gut" (Position ≤ 8): Die Seite rankt bereits stark. NIEMALS "Seite neu schreiben"/"neuen Inhalt erstellen" empfehlen — das riskiert ein bestehendes Ranking. Mach daraus KEIN eigenes To-do pro Keyword; solche Begriffe höchstens in EINEM gebündelten "Top-Rankings halten"-To-do erwähnen, und nur wenn es eine konkrete Aktion gibt.
- standing="striking_distance" (Position 9–20): ECHTER Hebel — Ausbau/gezielte Optimierung Richtung Top-3.
Verwechsle "schon stark" nicht mit "Lücke". Fokussiere To-dos auf echte Hebel: striking_distance-Keywords, Content für Pflegeeinrichtungen/-dienste, Ads-Effizienz (CPA/Budget), Friction-Fixes.

QUALITÄT: Jedes To-do EINDEUTIG — KEINE Wiederholungen/Varianten desselben Themas, nicht künstlich auffüllen. Lieber 3–6 starke, distinkte To-dos als 10 schwache.

Antworte NUR als JSON (kein Markdown, keine Code-Fences):
{"summary":"2-4 Sätze Gesamtlage","todos":[{"title":"kurz","category":"SEO|Content|Ads|UX|Branding","why":"datenbasierte Begründung","action":"konkreter nächster Schritt","priority":1,"impact":"hoch|mittel|gering","effort":"low|med|high"}]}
3–8 To-dos, wichtigstes zuerst, keine Dubletten. priority 1=höchste. impact = erwarteter Geschäftsimpact (Leads/Umsatz).`;

export async function runBrain(days = 28): Promise<{ ok: boolean; report?: any; error?: string }> {
  const signals = await collectSignals(days);
  const prompt = `${SYS}\n\nSIGNALE (letzte ${days} Tage):\n${JSON.stringify(signals)}`;
  const g = await askGex44(prompt);
  if (!g.ok) return { ok: false, error: g.error };
  const parsed = parseLlmJson(g.raw);
  if (!parsed) return { ok: false, error: 'GEX44-Antwort kein valides JSON' };
  // Dedup: Modell füllt sonst auf die Zielzahl mit Varianten desselben Themas auf.
  const todos = dedupeByTitle(Array.isArray(parsed.todos) ? parsed.todos : [], 'title', 10);
  const summary = String(parsed.summary || '').slice(0, 1500);
  const report_date = new Date().toISOString().slice(0, 10);
  const rec = await createTrackingRecord('mkt_brain_reports', {
    report_date, summary, todos, signals, model: process.env.GEX44_BRAIN_MODEL || 'qwen2.5:14b',
  });
  return { ok: true, report: { report_date, summary, todos, signals, id: rec.record?.id } };
}

export async function latestReport(): Promise<any | null> {
  try {
    const r = await listTrackingRecords('mkt_brain_reports', { sort: '-created', perPage: 1 });
    return (r as any)?.items?.[0] || null;
  } catch { return null; }
}
