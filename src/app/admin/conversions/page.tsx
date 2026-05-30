import { requireAdmin } from '@/lib/admin-auth';
import { listTrackingRecords, countTrackingRecords } from '@/lib/pb-tracking';

export const dynamic = 'force-dynamic';

const STATUS_COLOR: Record<string, string> = {
  new: 'bg-blue-100 text-blue-800',
  contacted: 'bg-amber-100 text-amber-800',
  qualified: 'bg-emerald-100 text-emerald-800',
  won: 'bg-emerald-600 text-white',
  lost: 'bg-slate-200 text-slate-700',
  spam: 'bg-red-100 text-red-700',
  forwarded: 'bg-cyan-100 text-cyan-800',
};

const CAPI_PLATFORMS = ['google', 'bing', 'meta', 'linkedin', 'tiktok'] as const;

function pillCapi(status: string | undefined): string {
  if (status === 'sent') return 'bg-emerald-500 text-white';
  if (status === 'skipped') return 'bg-slate-200 text-slate-600';
  if (status === 'error') return 'bg-red-500 text-white';
  return 'bg-slate-100 text-slate-400';
}

function dotCapi(status: string | undefined): string {
  if (status === 'sent') return '●';
  if (status === 'skipped') return '○';
  if (status === 'error') return '✕';
  return '·';
}

export default async function Page() {
  await requireAdmin();

  const [leadsRes, totalLeads, totalWon, totalSpam] = await Promise.all([
    listTrackingRecords('marketing_lead_submissions', {
      perPage: 100,
      sort: '-created',
      fields:
        'id,created,lead_email,lead_first_name,lead_last_name,lead_company,utm_source,utm_campaign,landing_page,status,quality_score,revenue,' +
        'capi_google_status,capi_bing_status,capi_meta_status,capi_linkedin_status,capi_tiktok_status,' +
        'capi_google_at,capi_bing_at,capi_meta_at,capi_linkedin_at,capi_tiktok_at',
    }),
    countTrackingRecords('marketing_lead_submissions'),
    countTrackingRecords('marketing_lead_submissions', 'status="won"'),
    countTrackingRecords('marketing_lead_submissions', 'status="spam"'),
  ]);

  const leads = leadsRes?.items || [];
  const nonSpam = leads.filter((l: any) => l.status !== 'spam');
  const totalRevenue = leads.reduce((s: number, l: any) => s + (Number(l.revenue) || 0), 0);

  return (
    <div className="max-w-7xl">
      <div className="flex items-baseline justify-between mb-6">
        <div>
          <h1 className="text-3xl font-extrabold">💰 Conversions</h1>
          <p className="text-slate-600 text-sm mt-1">Marketing-Leads + CAPI-Fire-Status pro Plattform</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="p-4 rounded-xl border bg-white">
          <div className="text-xs uppercase tracking-wider text-slate-500 font-bold">Leads Total</div>
          <div className="text-2xl font-extrabold mt-1">{totalLeads}</div>
        </div>
        <div className="p-4 rounded-xl border bg-emerald-50">
          <div className="text-xs uppercase tracking-wider text-emerald-700 font-bold">Won</div>
          <div className="text-2xl font-extrabold mt-1 text-emerald-700">{totalWon}</div>
        </div>
        <div className="p-4 rounded-xl border bg-slate-50">
          <div className="text-xs uppercase tracking-wider text-slate-700 font-bold">Revenue Total</div>
          <div className="text-2xl font-extrabold mt-1">{totalRevenue.toFixed(2)} €</div>
        </div>
        <div className="p-4 rounded-xl border bg-red-50">
          <div className="text-xs uppercase tracking-wider text-red-700 font-bold">Spam blocked</div>
          <div className="text-2xl font-extrabold mt-1 text-red-700">{totalSpam}</div>
        </div>
      </div>

      {nonSpam.length === 0 ? (
        <div className="p-8 rounded-xl bg-slate-100 text-slate-600 text-center">Noch keine Conversions.</div>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 sticky top-0">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Lead</th>
                <th className="px-4 py-3 text-left font-semibold">Quelle</th>
                <th className="px-4 py-3 text-left font-semibold">Score</th>
                <th className="px-4 py-3 text-left font-semibold">Status</th>
                <th className="px-4 py-3 text-left font-semibold">Revenue</th>
                <th className="px-4 py-3 text-left font-semibold" title="Google · Bing · Meta · LinkedIn · TikTok">CAPI G·B·M·L·T</th>
                <th className="px-4 py-3 text-left font-semibold">Erstellt</th>
              </tr>
            </thead>
            <tbody>
              {nonSpam.map((l: any) => {
                const name = [l.lead_first_name, l.lead_last_name].filter(Boolean).join(' ');
                return (
                  <tr key={l.id} className="border-t hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="font-semibold">{name || l.lead_email || l.id}</div>
                      {l.lead_email && name && <div className="text-xs text-slate-500">{l.lead_email}</div>}
                      {l.lead_company && <div className="text-xs text-slate-500">{l.lead_company}</div>}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <div className="font-mono">{l.utm_source || '—'}</div>
                      {l.utm_campaign && <div className="text-slate-500">{l.utm_campaign}</div>}
                      {l.landing_page && <div className="text-slate-400 truncate max-w-[200px]">{l.landing_page}</div>}
                    </td>
                    <td className="px-4 py-3 font-semibold">{l.quality_score ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${STATUS_COLOR[l.status] || 'bg-slate-100 text-slate-600'}`}>
                        {l.status || 'new'}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{l.revenue ? `${Number(l.revenue).toFixed(2)} €` : '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {CAPI_PLATFORMS.map(p => (
                          <span
                            key={p}
                            className={`inline-flex items-center justify-center w-6 h-6 rounded text-[11px] font-bold ${pillCapi(l[`capi_${p}_status`])}`}
                            title={`${p}: ${l[`capi_${p}_status`] || '—'}${l[`capi_${p}_at`] ? ` @ ${l[`capi_${p}_at`].slice(11, 16)}` : ''}`}
                          >
                            {dotCapi(l[`capi_${p}_status`])}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">{l.created?.slice(0, 16).replace('T', ' ')}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-6 text-xs text-slate-500">
        <strong>CAPI-Status-Legende:</strong> ● = sent · ○ = skipped (no_token / no_gclid / no_msclkid) · ✕ = error
      </div>
    </div>
  );
}
