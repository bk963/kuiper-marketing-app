/**
 * Marketing-Blog Data-Access — liest mkt_blog_*-Collections aus pb.kuiper-safety.de.
 *
 * Schema 1:1 zu CRM blog_* + zusätzlich `migrated_from_crm` + `crm_source_id`.
 * relation-Felder (category_id, pillar_id) sind in Phase 2.0b als plain text (Phase B: relation-Schema-Upgrade).
 */
import { pbHeaders } from './admin-auth';

const PB = process.env.MPB_URL || 'https://pb.kuiper-safety.de';

type ListOpts = { perPage?: number; filter?: string; sort?: string; fields?: string };

async function pbList(collection: string, opts: ListOpts = {}): Promise<{ items: any[]; error?: string }> {
  const params = new URLSearchParams();
  params.set('perPage', String(opts.perPage ?? 200));
  params.set('skipTotal', '1'); // PB v0.22 totalItems-bug workaround
  if (opts.filter) params.set('filter', opts.filter);
  if (opts.sort) params.set('sort', opts.sort);
  if (opts.fields) params.set('fields', opts.fields);
  try {
    const r = await fetch(`${PB}/api/collections/${collection}/records?${params.toString()}`, {
      headers: pbHeaders(),
      cache: 'no-store',
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

export const mktBlog = {
  articles: (opts: ListOpts = {}) => pbList('mkt_blog_articles', opts),
  categories: (opts: ListOpts = {}) => pbList('mkt_blog_categories', opts),
  pillars: (opts: ListOpts = {}) => pbList('mkt_blog_pillar_pages', opts),
  internalLinks: (opts: ListOpts = {}) => pbList('mkt_blog_internal_links', opts),
  media: (opts: ListOpts = {}) => pbList('mkt_blog_media', opts),
};

export const mktBlogCounts = {
  articles: () => pbCount('mkt_blog_articles'),
  articlesPublished: () => pbCount('mkt_blog_articles', 'status="published"'),
  articlesDraft: () => pbCount('mkt_blog_articles', 'status="draft"'),
  categories: () => pbCount('mkt_blog_categories'),
  pillars: () => pbCount('mkt_blog_pillar_pages'),
  internalLinks: () => pbCount('mkt_blog_internal_links'),
  media: () => pbCount('mkt_blog_media'),
};

export async function getArticle(id: string) {
  try {
    const r = await fetch(`${PB}/api/collections/mkt_blog_articles/records/${id}`, {
      headers: pbHeaders(), cache: 'no-store',
    });
    if (!r.ok) return null;
    return await r.json();
  } catch { return null; }
}

export async function getCategory(id: string) {
  try {
    const r = await fetch(`${PB}/api/collections/mkt_blog_categories/records/${id}`, {
      headers: pbHeaders(), cache: 'no-store',
    });
    if (!r.ok) return null;
    return await r.json();
  } catch { return null; }
}
