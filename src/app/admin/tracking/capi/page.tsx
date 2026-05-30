import { requireAdmin } from '@/lib/admin-auth';
import { listTrackingRecords } from '@/lib/pb-tracking';

export const dynamic = 'force-dynamic';

const PLATS = [
  { id: 'google', name: 'Google Ads OCI', envCheck: ['GOOGLE_ADS_CUSTOMER_ID', 'GOOGLE_ADS_DEVELOPER_TOKEN', 'GOOGLE_ADS_CONVERSION_ID'], needs: 'gclid' },
  { id: 'bing', name: 'Bing Ads Offline Conv.', envCheck: ['BING_ADS_DEVELOPER_TOKEN', 'BING_ADS_ACCOUNT_ID', 'BING_ADS_CONVERSION_NAME'], needs: 'msclkid' },
  { id: 'meta', name: 'Meta CAPI', envCheck: ['META_PIXEL_ID', 'META_CAPI_ACCESS_TOKEN'], needs: 'email/phone (hashed)' },
  { id: 'linkedin', name: 'LinkedIn CAPI', envCheck: ['LINKEDIN_ACCESS_TOKEN', 'LINKEDIN_CONVERSION_ID'], needs: 'email (hashed)' },
  { id: 'tiktok', name: 'TikTok Events-API', envCheck: ['TIKTOK_ACCESS_TOKEN', 'TIKTOK_PIXEL_ID'], needs: 'email/phone (hashed)' },
] as const;

const STATUS_COLOR: Record<string, string> = {
  sent: 'bg-emerald-500 text-white',
  skipped: 'bg-slate-200 text-slate-600',
  error: 'bg-red-500 text-white',
};

export default async function Page() {
  await requireAdmin();
  const env = process.env as Record<string, string | undefined>;

  // Plattform-Konfigurationen
  const platStatus = PLATS.map(p => {
    const missing = p.envCheck.filter(k => !env[k] || !String(env[k]).trim());
    return { ...p, configured: missing.length === 0, missing };
  });

  // Letzte 50 Lead-Submissions mit CAPI-Status pro Plattform
  const leadsRes = await listTrackingRecords('marketing_lead_submissions', {
    perPage: 50,
    sort: '-created',
    fields:
      'id,created,lead_email,utm_source,gclid,msclkid,status,' +
      PLATS.map(p => `capi_${p.id}_status,capi_${p.id}_at,capi_${p.id}_error`).join(','),
  });

  const leads = (leadsRes?.items || []).filter((l: any) => l.status !== 'spam');

  // Aggregate: Fire-Count + Last-Error pro Plattform
  const agg = PLATS.map(p => {
    const sent = leads.filter((l: any) => l[`capi_${p.id}_status`] === 'sent').length;
    const skipped = leads.filter((l: any) => l[`capi_${p.id}_status`] === 'skipped').length;
    const error = leads.filter((l: any) => l[`capi_${p.id}_status`] === 'error').length;
    const lastError = leads.find((l: any) => l[`capi_${p.id}_status`] === 'error');
    return { ...p, sent, skipped, error, lastError: lastError?.[`capi_${p.id}_error`] };
  });

  return (
    <div className="max-w-5xl">
      <h1 className="text-3xl font-extrabold mb-2">🛰️ Conversion-APIs</h1>
      <p className="text-slate-600 text-sm mb-8">
        Server-Side CAPI-Fire pro Lead via <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-xs">/api/admin/fire-capi</code> (T4-Sprint)
      </p>

      <div className="grid grid-cols-1 gap-3 mb-6">
        {agg.map(p => (
          <div key={p.id} className={`p-4 rounded-xl border ${p.configured ? 'bg-white' : 'bg-amber-50 border-amber-200'}`}>
            <div className="flex items-baseline justify-between mb-2">
              <div className="font-bold">{p.name}</div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${p.configured ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white'}`}>
                {p.configured ? '✓ token ok' : `⚠ fehlt: ${p.missing.join(', ')}`}
              </span>
            </div>
            <div className="text-xs text-slate-600 mb-2">benötigt: <code>{p.needs}</code></div>
            <div className="flex gap-3 text-sm">
              <span className="text-emerald-700">✓ <strong>{p.sent}</strong> sent</span>
              <span className="text-slate-500">○ <strong>{p.skipped}</strong> skipped</span>
              <span className="text-red-600">✕ <strong>{p.error}</strong> error</span>
            </div>
            {p.lastError && (
              <div className="mt-2 text-xs text-red-700 bg-red-50 rounded px-2 py-1 font-mono truncate">
                last error: {p.lastError}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="p-3 border-b bg-slate-50 font-bold text-sm">Fire-Log (letzte 50 Leads)</div>
        {leads.length === 0 ? (
          <div className="p-8 text-center text-slate-500">Noch keine Leads.</div>
        ) : (
          <table className="w-full text-xs">
            <thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-2 text-left font-semibold">Lead</th>
                <th className="px-3 py-2 text-left font-semibold">UTM</th>
                <th className="px-3 py-2 text-left font-semibold">gclid</th>
                <th className="px-3 py-2 text-left font-semibold">msclkid</th>
                {PLATS.map(p => (
                  <th key={p.id} className="px-2 py-2 text-center font-semibold">{p.id}</th>
                ))}
                <th className="px-3 py-2 text-left font-semibold">Erstellt</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((l: any) => (
                <tr key={l.id} className="border-t">
                  <td className="px-3 py-2 truncate max-w-[180px]">{l.lead_email || l.id}</td>
                  <td className="px-3 py-2 font-mono">{l.utm_source || '—'}</td>
                  <td className="px-3 py-2">{l.gclid ? '✓' : '—'}</td>
                  <td className="px-3 py-2">{l.msclkid ? '✓' : '—'}</td>
                  {PLATS.map(p => {
                    const st = l[`capi_${p.id}_status`];
                    const err = l[`capi_${p.id}_error`];
                    return (
                      <td key={p.id} className="px-2 py-2 text-center">
                        <span
                          className={`inline-flex items-center justify-center w-5 h-5 rounded text-[10px] font-bold ${STATUS_COLOR[st] || 'bg-slate-100 text-slate-400'}`}
                          title={`${st || '—'}${err ? `: ${err.slice(0, 80)}` : ''}`}
                        >
                          {st === 'sent' ? '●' : st === 'skipped' ? '○' : st === 'error' ? '✕' : '·'}
                        </span>
                      </td>
                    );
                  })}
                  <td className="px-3 py-2 text-slate-500">{l.created?.slice(11, 16)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
