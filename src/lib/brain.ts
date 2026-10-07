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
    .map((r: any) => ({ query: r.query, page: r.page.replace(/^https?:\/\//, ''), impressions: r.impressions, clicks: r.clicks, position: Math.round(r.position * 10) / 10 }));

  // Friktion: Seiten mit den meisten Rage/Dead-Clicks
  const friction = (clarity?.byUrl || [])
    .map((x) => ({ url: x.url.replace(/^https?:\/\/(www\.)?/, ''), sessions: x.sessions, dead: x.deadClicks, rage: x.rageClicks, quickBack: x.quickBacks, scriptErr: x.scriptErrors, score: x.deadClicks + x.rageClicks * 2 + x.quickBacks + x.scriptErrors * 2 }))
    .filter((x) => x.score > 0).sort((a, b) => b.score - a.score).slice(0, 8);

  // Leads: form_submit-Events letzte 7 Tage
  let leads7d = 0;
  try {
    const since = new Date(Date.now() - 7 * 86400000).toISOString().replace('T', ' ').slice(0, 19);
    const r = await listTrackingRecords('tracking_events', { filter: `event_type~"form_submit" && created>="${since}"`, perPage: 500, fields: 'id' });
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
Antworte NUR als JSON:
{"summary":"2-4 Sätze Gesamtlage","todos":[{"title":"kurz","category":"SEO|Content|Ads|UX|Branding","why":"datenbasierte Begründung","action":"konkreter nächster Schritt","priority":1,"effort":"low|med|high"}]}
Maximal 10 To-dos, wichtigstes zuerst. priority 1=höchste.`;

export async function runBrain(days = 28): Promise<{ ok: boolean; report?: any; error?: string }> {
  const signals = await collectSignals(days);
  const prompt = `${SYS}\n\nSIGNALE (letzte ${days} Tage):\n${JSON.stringify(signals)}`;
  const g = await askGex44(prompt);
  if (!g.ok) return { ok: false, error: g.error };
  let parsed: any = {};
  try { parsed = JSON.parse(g.raw || '{}'); } catch { return { ok: false, error: 'GEX44-Antwort kein valides JSON' }; }
  const todos = Array.isArray(parsed.todos) ? parsed.todos.slice(0, 12) : [];
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
