/**
 * Marketing-Forms + Leads Data-Access — mkt_forms, mkt_form_submissions, mkt_leads.
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
