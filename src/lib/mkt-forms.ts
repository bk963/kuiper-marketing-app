/**
 * Marketing-Forms + Leads Data-Access.
 *
 * - forms/submissions: mkt_forms / mkt_form_submissions (pb-tracking).
 * - leads: LIVE aus marketing_lead_submissions (echte Lead-Submissions inkl. Datum/
 *   Quelle), gemappt auf das von der Leads-Seite erwartete Feld-Schema. Kein Kopieren
 *   → immer aktuell. Quelle der Wahrheit ist dieselbe wie fürs KPI-Board.
 */
import { pbList, pbCount, type ListOpts } from './pb-server';

const LEADS_SRC = 'marketing_lead_submissions';
// Test-Submissions (test+…@) raus, damit die Lead-Liste sauber ist.
const REAL = 'lead_email != "" && lead_email !~ "test+"';

function deriveSource(r: any): string {
  if (r.gclid || r.gbraid || r.wbraid) return 'Google Ads';
  if (r.msclkid) return 'Bing Ads';
  if (r.fbclid) return 'Meta';
  if (r.utm_source) return String(r.utm_source);
  if (r.lead_source) return String(r.lead_source);
  return 'Direkt';
}

function mapLead(r: any) {
  const name = [r.lead_first_name, r.lead_last_name].filter(Boolean).join(' ').trim();
  return {
    id: r.id,
    contact_email: r.lead_email || '',
    contact_name: name || r.lead_salutation || '',
    contact_phone: r.lead_phone || '',
    company_name: r.lead_company || '',
    status: r.status || 'new',
    source: deriveSource(r),
    created: r.submitted_at || r.created || '',
    last_contact_at: r.last_contact_at || '',
    next_followup_at: r.next_followup_at || '',
  };
}

export const mktForms = {
  forms: (opts: ListOpts = {}) => pbList('mkt_forms', opts),
  submissions: (opts: ListOpts = {}) => pbList('mkt_form_submissions', opts),
  // LIVE-Leads aus marketing_lead_submissions, gemappt.
  leads: async (opts: ListOpts = {}) => {
    const filter = opts.filter ? `(${REAL}) && (${opts.filter})` : REAL;
    const { items, error } = await pbList(LEADS_SRC, {
      perPage: opts.perPage ?? 200,
      sort: opts.sort?.includes('created') ? '-submitted_at' : (opts.sort || '-submitted_at'),
      filter,
      fields: 'id,lead_email,lead_first_name,lead_last_name,lead_salutation,lead_phone,lead_company,status,gclid,gbraid,wbraid,msclkid,fbclid,utm_source,lead_source,submitted_at,last_contact_at,next_followup_at',
    });
    return { items: items.map(mapLead), error };
  },
};

export const mktFormsCounts = {
  forms: () => pbCount('mkt_forms'),
  formsActive: () => pbCount('mkt_forms', 'status="active"'),
  submissions: () => pbCount('mkt_form_submissions'),
  leads: () => pbCount(LEADS_SRC, REAL),
  leadsNew: () => pbCount(LEADS_SRC, `${REAL} && (status="new" || status="")`),
};
