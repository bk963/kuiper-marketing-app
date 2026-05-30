import { requireAdmin } from '@/lib/admin-auth';
import { listTrackingRecords } from '@/lib/pb-tracking';

export const dynamic = 'force-dynamic';

type Agg = { source: string; medium: string; campaign: string; count: number; leads: number };

export default async function Page() {
  await requireAdmin();

  // bsh_visits + marketing_lead_submissions aggregieren nach UTM
  const [visitsRes, leadsRes] = await Promise.all([
    listTrackingRecords('bsh_visits', {
      perPage: 500,
      sort: '-visit_at',
      fields: 'utm_source,utm_medium,utm_campaign,gclid,msclkid,fbclid,led_to_lead',
    }),
    listTrackingRecords('marketing_lead_submissions', {
      perPage: 500,
      sort: '-created',
      fields: 'utm_source,utm_medium,utm_campaign,status,revenue',
    }),
  ]);

  const visits = visitsRes?.items || [];
  const leads = (leadsRes?.items || []).filter((l: any) => l.status !== 'spam');

  // Aggregate Visits + Leads per (source, medium, campaign)
  const map = new Map<string, Agg>();
  const norm = (s: any) => (s && String(s).trim()) || '(direct)';
  for (const v of visits) {
    const k = `${norm(v.utm_source)}|${norm(v.utm_medium)}|${norm(v.utm_campaign)}`;
    const cur = map.get(k) || { source: norm(v.utm_source), medium: norm(v.utm_medium), campaign: norm(v.utm_campaign), count: 0, leads: 0 };
    cur.count++;
    map.set(k, cur);
  }
  for (const l of leads) {
    const k = `${norm(l.utm_source)}|${norm(l.utm_medium)}|${norm(l.utm_campaign)}`;
    const cur = map.get(k) || { source: norm(l.utm_source), medium: norm(l.utm_medium), campaign: norm(l.utm_campaign), count: 0, leads: 0 };
    cur.leads++;
    map.set(k, cur);
  }
  const rows = Array.from(map.values()).sort((a, b) => b.leads * 100 + b.count - (a.leads * 100 + a.count));

  // Click-ID-Capture-Rate
  const withGclid = visits.filter(v => v.gclid).length;
  const withMsclkid = visits.filter(v => v.msclkid).length;
  const withFbclid = visits.filter(v => v.fbclid).length;

  return (
    <div className="max-w-6xl">
      <h1 className="text-3xl font-extrabold mb-2">🔗 UTM &amp; Click-ID Tracking</h1>
      <p className="text-slate-600 text-sm mb-8">
        Attribution aus <code>bsh_visits</code> + <code>marketing_lead_submissions</code> — UTM/Click-ID-Capture via{' '}
        <code>kuiper-tracking.v1.js</code>
      </p>

      <div className="grid grid-cols-4 gap-3 mb-6">
        <div className="p-4 rounded-xl border bg-white">
          <div className="text-xs uppercase tracking-wider text-slate-500 font-bold">Visits gesamt</div>
          <div className="text-2xl font-extrabold mt-1">{visits.length}</div>
        </div>
        <div className="p-4 rounded-xl border bg-emerald-50">
          <div className="text-xs uppercase tracking-wider text-emerald-700 font-bold">Leads gesamt</div>
          <div className="text-2xl font-extrabold mt-1 text-emerald-700">{leads.length}</div>
        </div>
        <div className="p-4 rounded-xl border bg-blue-50">
          <div className="text-xs uppercase tracking-wider text-blue-700 font-bold">Lead-Rate</div>
          <div className="text-2xl font-extrabold mt-1 text-blue-700">{visits.length ? ((leads.length / visits.length) * 100).toFixed(2) : '0'}%</div>
        </div>
        <div className="p-4 rounded-xl border bg-slate-50">
          <div className="text-xs uppercase tracking-wider text-slate-700 font-bold">Click-IDs erfasst</div>
          <div className="text-sm mt-2 space-y-0.5">
            <div>gclid: <strong>{withGclid}</strong></div>
            <div>msclkid: <strong>{withMsclkid}</strong></div>
            <div>fbclid: <strong>{withFbclid}</strong></div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="p-3 border-b bg-slate-50 font-bold text-sm">Attribution: Source / Medium / Campaign</div>
        {rows.length === 0 ? (
          <div className="p-8 text-center text-slate-500">Noch keine UTM-Daten.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Source</th>
                <th className="px-4 py-3 text-left font-semibold">Medium</th>
                <th className="px-4 py-3 text-left font-semibold">Campaign</th>
                <th className="px-4 py-3 text-right font-semibold">Visits</th>
                <th className="px-4 py-3 text-right font-semibold">Leads</th>
                <th className="px-4 py-3 text-right font-semibold">CR</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className="border-t hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-xs">{r.source}</td>
                  <td className="px-4 py-3 font-mono text-xs">{r.medium}</td>
                  <td className="px-4 py-3 font-mono text-xs">{r.campaign}</td>
                  <td className="px-4 py-3 text-right">{r.count}</td>
                  <td className="px-4 py-3 text-right font-semibold text-emerald-700">{r.leads}</td>
                  <td className="px-4 py-3 text-right text-xs text-slate-600">
                    {r.count > 0 ? ((r.leads / r.count) * 100).toFixed(1) + '%' : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="mt-4 text-xs text-slate-500">
        Visits-Window: aktuell letzte 500 (page-paginated). Lead-Window: letzte 500 non-spam.
      </div>
    </div>
  );
}
