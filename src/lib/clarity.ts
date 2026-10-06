/**
 * Microsoft Clarity Data-Export-API (Verhaltens-Signale).
 * Limit: numOfDays 1-3, max 10 Calls/Tag/Projekt → aggressiv cachen (revalidate 3h).
 * ENV: CLARITY_API_TOKEN (Bearer, aus Clarity → Settings → Data Export).
 */
const BASE = 'https://www.clarity.ms/export-data/api/v1/project-live-insights';

export type ClarityUrlRow = {
  url: string;
  sessions: number;
  deadClicks: number;
  rageClicks: number;
  quickBacks: number;
  scriptErrors: number;
  excessiveScroll: number;
  scrollDepth: number; // %
  engagementTime: number; // s
};

export type ClarityResult = {
  ok: boolean;
  error?: string;
  days: number;
  totals: { sessions: number; bots: number; deadClicks: number; rageClicks: number; quickBacks: number; scriptErrors: number };
  byUrl: ClarityUrlRow[];
};

const n = (v: any) => (v == null || v === '' ? 0 : Number(v) || 0);

export async function clarityInsights(numOfDays = 3, dimension = 'URL'): Promise<ClarityResult | null> {
  const token = process.env.CLARITY_API_TOKEN;
  if (!token) return null;
  const empty: ClarityResult = { ok: false, days: numOfDays, totals: { sessions: 0, bots: 0, deadClicks: 0, rageClicks: 0, quickBacks: 0, scriptErrors: 0 }, byUrl: [] };
  try {
    const r = await fetch(`${BASE}?numOfDays=${numOfDays}&dimension1=${dimension}`, {
      headers: { Authorization: `Bearer ${token}` },
      // Clarity erlaubt nur 10 Calls/Tag → 3h cachen.
      next: { revalidate: 10800 },
    } as any);
    if (!r.ok) return { ...empty, error: `Clarity HTTP ${r.status}` };
    const data = await r.json();
    if (!Array.isArray(data)) return { ...empty, error: 'Unerwartetes Clarity-Format' };

    const byUrl = new Map<string, ClarityUrlRow>();
    const row = (url: string) => {
      let x = byUrl.get(url);
      if (!x) { x = { url, sessions: 0, deadClicks: 0, rageClicks: 0, quickBacks: 0, scriptErrors: 0, excessiveScroll: 0, scrollDepth: 0, engagementTime: 0 }; byUrl.set(url, x); }
      return x;
    };
    const totals = { sessions: 0, bots: 0, deadClicks: 0, rageClicks: 0, quickBacks: 0, scriptErrors: 0 };

    for (const metric of data) {
      const name: string = metric?.metricName || '';
      for (const info of (metric?.information || [])) {
        const url = info.Url || info.url || info.Page || '(gesamt)';
        const sub = n(info.subTotal); // tatsächliche Event-Anzahl der Friktions-Metrik
        const x = row(url);
        switch (name) {
          case 'Traffic': {
            const s = n(info.totalSessionCount);
            x.sessions = Math.max(x.sessions, s);
            totals.sessions += s;
            totals.bots += n(info.totalBotSessionCount);
            break;
          }
          case 'DeadClickCount': x.deadClicks = sub; totals.deadClicks += sub; break;
          case 'RageClickCount': x.rageClicks = sub; totals.rageClicks += sub; break;
          case 'QuickbackClick': x.quickBacks = sub; totals.quickBacks += sub; break;
          case 'ScriptErrorCount': x.scriptErrors = sub; totals.scriptErrors += sub; break;
          case 'ExcessiveScroll': x.excessiveScroll = sub; break;
          case 'ScrollDepth': x.scrollDepth = Math.max(x.scrollDepth, n(info.averageScrollDepth)); break;
          case 'EngagementTime': x.engagementTime = Math.max(x.engagementTime, n(info.totalTime)); break;
          default: break;
        }
      }
    }
    const rows = [...byUrl.values()].filter((x) => x.url !== '(gesamt)');
    // Für Totals, die nicht aus Traffic kamen: fallback auf Summe der URL-Rows.
    if (!totals.sessions) totals.sessions = rows.reduce((a, x) => a + x.sessions, 0);
    return { ok: true, days: numOfDays, totals, byUrl: rows };
  } catch (e: any) {
    return { ...empty, error: e?.message?.slice(0, 160) || 'Clarity-Fehler' };
  }
}
