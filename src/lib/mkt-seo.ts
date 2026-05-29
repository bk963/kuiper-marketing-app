/**
 * Marketing-SEO Data-Access — mkt_blog_keywords/rankings/competitors/recommendations.
 */
import { pbList, pbCount, type ListOpts } from './pb-server';

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
