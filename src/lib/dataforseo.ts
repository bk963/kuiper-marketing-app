/**
 * DataForSEO (Labs) — Wettbewerbs-/SEO-Daten. Basic Auth, pay-per-use.
 * ENV: DATAFORSEO_LOGIN, DATAFORSEO_PASSWORD.
 * Keyword-Gap wird client-seitig aus ranked_keywords berechnet (robuster als domain_intersection).
 */
const BASE = 'https://api.dataforseo.com/v3';
const LOC = { language_name: 'German', location_name: 'Germany' };

function auth(): string | null {
  const l = process.env.DATAFORSEO_LOGIN, p = process.env.DATAFORSEO_PASSWORD;
  if (!l || !p) return null;
  return 'Basic ' + Buffer.from(`${l}:${p}`).toString('base64');
}

async function dfs(path: string, task: Record<string, any>): Promise<{ result: any[] | null; error?: string; cost?: number }> {
  const a = auth();
  if (!a) return { result: null, error: 'DataForSEO nicht konfiguriert' };
  try {
    const r = await fetch(`${BASE}/${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: a },
      body: JSON.stringify([{ ...LOC, ...task }]),
      next: { revalidate: 21600 }, // 6h cachen (spart Credits)
    } as any);
    const d = await r.json();
    if (d.status_code !== 20000) return { result: null, error: `${d.status_code}: ${d.status_message}` };
    const t = (d.tasks || [])[0] || {};
    if (t.status_code !== 20000) return { result: null, error: `${t.status_code}: ${t.status_message}` };
    return { result: t.result || [], cost: t.cost };
  } catch (e: any) {
    return { result: null, error: e?.message?.slice(0, 160) || 'DataForSEO-Fehler' };
  }
}

export type DfsOverview = { domain: string; etv: number; keywords: number; pos1: number; pos2_3: number; pos4_10: number; pos11_20: number } | null;

export async function dfsOverview(domain: string): Promise<{ data: DfsOverview; error?: string }> {
  const { result, error } = await dfs('dataforseo_labs/google/domain_rank_overview/live', { target: domain });
  if (!result) return { data: null, error };
  const m = result[0]?.items?.[0]?.metrics?.organic;
  if (!m) return { data: null, error: 'keine Daten' };
  return { data: { domain, etv: Math.round(m.etv || 0), keywords: m.count || 0, pos1: m.pos_1 || 0, pos2_3: m.pos_2_3 || 0, pos4_10: m.pos_4_10 || 0, pos11_20: m.pos_11_20 || 0 } };
}

export type DfsKw = { keyword: string; volume: number; position: number; url: string; cpc: number };

export async function dfsRankedKeywords(domain: string, limit = 50): Promise<{ data: DfsKw[]; error?: string }> {
  const { result, error } = await dfs('dataforseo_labs/google/ranked_keywords/live', { target: domain, limit, order_by: ['ranked_serp_element.serp_item.rank_absolute,asc'] });
  if (!result) return { data: [], error };
  const items = result[0]?.items || [];
  const data: DfsKw[] = items.map((it: any) => {
    const kd = it.keyword_data || {};
    const se = it.ranked_serp_element?.serp_item || {};
    return {
      keyword: kd.keyword || '',
      volume: kd.keyword_info?.search_volume || 0,
      position: se.rank_absolute || 0,
      url: (se.url || '').replace(/^https?:\/\//, ''),
      cpc: Math.round((kd.keyword_info?.cpc || 0) * 100) / 100,
    };
  });
  return { data };
}

/** Keyword-Gap: Keywords, für die der Wettbewerber rankt, wir aber NICHT (oder deutlich schlechter). */
export async function dfsKeywordGap(ourDomain: string, competitor: string, limit = 50): Promise<{ data: (DfsKw & { ourPosition: number | null })[]; error?: string }> {
  const [comp, ours] = await Promise.all([
    dfsRankedKeywords(competitor, 300),
    dfsRankedKeywords(ourDomain, 700),
  ]);
  if (comp.error) return { data: [], error: comp.error };
  const ourMap = new Map<string, number>();
  for (const k of ours.data) ourMap.set(k.keyword.toLowerCase(), k.position);
  const gap = comp.data
    .map((k) => ({ ...k, ourPosition: ourMap.get(k.keyword.toLowerCase()) ?? null }))
    // Gap = Wettbewerber in Top 20, wir nicht da ODER >10 Positionen schlechter
    .filter((k) => k.position <= 20 && (k.ourPosition === null || k.ourPosition - k.position >= 10))
    .sort((a, b) => b.volume - a.volume)
    .slice(0, limit);
  return { data: gap };
}
