/**
 * Marketing-Site Data-Access — mkt_site_pages + mkt_templates.
 */
import { pbList, pbCount, type ListOpts } from './pb-server';

export const mktSite = {
  pages: (opts: ListOpts = {}) => pbList('mkt_site_pages', opts),
  templates: (opts: ListOpts = {}) => pbList('mkt_templates', opts),
};

export const mktSiteCounts = {
  pages: () => pbCount('mkt_site_pages'),
  pagesPublished: () => pbCount('mkt_site_pages', 'status="published"'),
  pagesDraft: () => pbCount('mkt_site_pages', 'status="draft"'),
  templates: () => pbCount('mkt_templates'),
  templatesActive: () => pbCount('mkt_templates', 'status="active"'),
};
