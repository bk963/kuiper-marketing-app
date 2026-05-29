/**
 * Read-Only-Zugriff auf blog-PB (https://pb.kuiper-safety.de) für SEO-Dashboard.
 * Liest blog_articles, blog_rankings, blog_keywords (sofern existieren).
 */
import { pbHeaders } from './admin-auth';

const BLOG_PB = process.env.BLOG_PB_URL || 'https://pb.kuiper-safety.de';

export async function blogArticleCount(filter?: string): Promise<number> {
  try {
    const u = `${BLOG_PB}/api/collections/blog_articles/records?perPage=1${filter ? `&filter=${encodeURIComponent(filter)}` : ''}`;
    const r = await fetch(u, { headers: pbHeaders(), cache: 'no-store' });
    if (!r.ok) return 0;
    const d = await r.json();
    return d.totalItems || 0;
  } catch { return 0; }
}

export async function blogRankings(limit = 50) {
  try {
    const u = `${BLOG_PB}/api/collections/blog_rankings/records?perPage=${limit}&skipTotal=1&sort=-checked_at`;
    const r = await fetch(u, { headers: pbHeaders(), cache: 'no-store' });
    if (!r.ok) return [];
    const d = await r.json();
    return d.items || [];
  } catch { return []; }
}

export async function blogKeywords(limit = 100) {
  try {
    const u = `${BLOG_PB}/api/collections/blog_keywords/records?perPage=${limit}&skipTotal=1&sort=-search_volume`;
    const r = await fetch(u, { headers: pbHeaders(), cache: 'no-store' });
    if (!r.ok) return [];
    const d = await r.json();
    return d.items || [];
  } catch { return []; }
}
