/**
 * Marketing-Forms + Leads Data-Access — mkt_forms, mkt_form_submissions, mkt_leads.
 */
import { pbList, pbCount, type ListOpts } from './pb-server';

export const mktForms = {
  forms: (opts: ListOpts = {}) => pbList('mkt_forms', opts),
  submissions: (opts: ListOpts = {}) => pbList('mkt_form_submissions', opts),
  leads: (opts: ListOpts = {}) => pbList('mkt_leads', opts),
};

export const mktFormsCounts = {
  forms: () => pbCount('mkt_forms'),
  formsActive: () => pbCount('mkt_forms', 'status="active"'),
  submissions: () => pbCount('mkt_form_submissions'),
  leads: () => pbCount('mkt_leads'),
  leadsNew: () => pbCount('mkt_leads', 'status="new"'),
};
