import { redirect } from 'next/navigation';

// Alt-Stub (las die leere mkt_form_submissions-Collection und zeigte "noch keine Leads").
// Abgelöst durch das echte Leads-Dashboard /admin/leads (marketing_lead_submissions,
// gefiltert auf echte externe Einsendungen). Permanente Umleitung, falls alte
// Bookmarks/Links noch hierher zeigen.
export default function LeadsStubRedirect() {
  redirect('/admin/leads');
}
