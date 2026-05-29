/**
 * Marketing-Blog Data-Access — liest mkt_blog_*-Collections.
 * Nutzt pb-server.ts für Superuser-Auth (Collection-Rules sind admin-only).
 */
import { pbList, pbCount, pbGet, type ListOpts } from './pb-server';

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

export const getArticle = (id: string) => pbGet('mkt_blog_articles', id);
export const getCategory = (id: string) => pbGet('mkt_blog_categories', id);
