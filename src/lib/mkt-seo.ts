/**
 * Marketing-SEO Data-Access — liest mkt_blog_keywords/rankings/competitors/recommendations.
 *
 * Schema 1:1 zu CRM blog_keywords|rankings|competitors|recommendations + Marker-Felder.
 */
import { pbHeaders } from './admin-auth';

const PB = process.env.MPB_URL || 'https://pb.kuiper-safety.de';

type ListOpts = { perPage?: number; filter?: string; sort?: string; fields?: string };

async function pbList(collection: string, opts: ListOpts = {}): Promise<{ items: any[]; error?: string }> {
  const params = new URLSearchParams();
  params.set('perPage', String(opts.perPage ?? 200));
  params.set('skipTotal', '1');
  if (opts.filter) params.set('filter', opts.filter);
  if (opts.sort) params.set('sort', opts.sort);
  if (opts.fields) params.set('fields', opts.fields);
  try {
    const r = await fetch(`${PB}/api/collections/${collection}/records?${params.toString()}`, {
      headers: pbHeaders(), cache: 'no-store',
    });
    if (!r.ok) return { items: [], error: `HTTP ${r.status}: ${(await r.text()).slice(0, 200)}` };
    const d = await r.json();
    return { items: d.items || [] };
  } catch (e: any) {
    return { items: [], error: e?.message?.slice(0, 200) || 'fetch error' };
  }
}

async function pbCount(collection: string, filter = ''): Promise<number> {
  try {
    const u = `${PB}/api/collections/${collection}/records?perPage=1${filter ? `&filter=${encodeURIComponent(filter)}` : ''}`;
    const r = await fetch(u, { headers: pbHeaders(), cache: 'no-store' });
    if (!r.ok) return 0;
    const d = await r.json();
    return d.totalItems || 0;
  } catch { return 0; }
}

export const mktSeo = {
  keywords: (opts: ListOpts = {}) => pbList('mkt_blog_keywords', opts),
  rankings: (opts: ListOpts = {}) => pbList('mkt_blog_rankings', opts),
  competitors: (opts: ListOpts = {}) => pbList('mkt_blog_competitors', opts),
  recommendations: (opts: ListOpts = {}) => pbList('mkt_blog_recommendations', opts),
};

export const mktSeoCounts = {
  keywords: () => pbCount('mkt_blog_keywords'),
  keywordsTracked: () => pbCount('mkt_blog_keywords', 'tracked=true'),
  rankings: () => pbCount('mkt_blog_rankings'),
  competitors: () => pbCount('mkt_blog_competitors'),
  competitorsTracked: () => pbCount('mkt_blog_competitors', 'tracked=true'),
  recommendations: () => pbCount('mkt_blog_recommendations'),
  recommendationsOpen: () => pbCount('mkt_blog_recommendations', 'status="open"'),
};
