import { requireAdmin } from '@/lib/admin-auth';
import { getGa4Client, getPropertyName } from '@/lib/ga4';
import { gscSiteOverview } from '@/lib/gsc';
import { gadsAccountSummary } from '@/lib/google-ads';

export const dynamic = 'force-dynamic';

export default async function IntegrationsPage() {
  await requireAdmin();

  const ga4Ready = !!getGa4Client() && !!getPropertyName();
  const [gsc, ads] = await Promise.all([gscSiteOverview(7), gadsAccountSummary(1)]);
  const gscReady = !!gsc && !gsc.error;
  const adsReady = !!ads && !ads.error;

  return (
    <div className="max-w-4xl">
      <h1 className="text-3xl font-extrabold mb-2">🔌 Integrationen</h1>
      <p className="text-slate-600 mb-8">Status aller externen Datenquellen.</p>

      <div className="space-y-4">
        <Service
          name="GA4 Data API"
          ready={ga4Ready}
          envs={[
            { key: 'GOOGLE_SERVICE_ACCOUNT_JSON', set: !!process.env.GOOGLE_SERVICE_ACCOUNT_JSON },
            { key: 'GA4_PROPERTY_ID', set: !!process.env.GA4_PROPERTY_ID, value: process.env.GA4_PROPERTY_ID },
          ]}
          docs="SA als Viewer in GA4-Property „Kuiper Safety" (G-YV7MPLX2VF) + numerische Property-ID"
        />
        <Service
          name="Google Search Console"
          ready={gscReady}
          envs={[
            { key: 'GOOGLE_SERVICE_ACCOUNT_JSON', set: !!process.env.GOOGLE_SERVICE_ACCOUNT_JSON },
            { key: 'GSC_SITE_URL', set: !!process.env.GSC_SITE_URL, value: process.env.GSC_SITE_URL || 'sc-domain:kuiper-safety.de (default)' },
          ]}
          docs="SA als „Limited User" in GSC-Property hinzufügen"
        />
        <Service
          name="Google Ads"
          ready={adsReady}
          envs={[
            { key: 'GOOGLE_ADS_DEVELOPER_TOKEN', set: !!process.env.GOOGLE_ADS_DEVELOPER_TOKEN },
            { key: 'GOOGLE_ADS_CUSTOMER_ID', set: !!process.env.GOOGLE_ADS_CUSTOMER_ID, value: process.env.GOOGLE_ADS_CUSTOMER_ID },
            { key: 'GOOGLE_ADS_LOGIN_CUSTOMER_ID', set: !!process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID, value: process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID },
            { key: 'GOOGLE_OAUTH_CLIENT_ID', set: !!process.env.GOOGLE_OAUTH_CLIENT_ID },
            { key: 'GOOGLE_OAUTH_CLIENT_SECRET', set: !!process.env.GOOGLE_OAUTH_CLIENT_SECRET },
            { key: 'GOOGLE_OAUTH_REFRESH_TOKEN', set: !!process.env.GOOGLE_OAUTH_REFRESH_TOKEN },
          ]}
          docs="OAuth-Token aus marketing-capi.env (Bk bereits autorisiert)"
        />
        <Service
          name="Blog-PocketBase (Read)"
          ready={true}
          envs={[
            { key: 'BLOG_PB_URL', set: true, value: process.env.BLOG_PB_URL || 'https://pb.kuiper-safety.de (default)' },
            { key: 'PB_CF_ACCESS_CLIENT_ID', set: !!process.env.PB_CF_ACCESS_CLIENT_ID },
            { key: 'PB_CF_ACCESS_CLIENT_SECRET', set: !!process.env.PB_CF_ACCESS_CLIENT_SECRET },
          ]}
          docs="Read-Only Zugriff auf blog_articles / blog_keywords / blog_rankings"
        />
      </div>
    </div>
  );
}

function Service({ name, ready, envs, docs }: {
  name: string;
  ready: boolean;
  envs: { key: string; set: boolean; value?: string }[];
  docs: string;
}) {
  return (
    <div className="p-5 bg-white rounded-xl border">
      <div className="flex items-center justify-between mb-2">
        <div className="font-bold text-lg">{name}</div>
        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${ready ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'}`}>
          {ready ? '✓ verbunden' : '⚠ nicht verbunden'}
        </span>
      </div>
      <p className="text-sm text-slate-600 mb-3">{docs}</p>
      <div className="space-y-1">
        {envs.map((e) => (
          <div key={e.key} className="flex items-center gap-2 text-xs">
            <span className={`w-2 h-2 rounded-full ${e.set ? 'bg-emerald-500' : 'bg-slate-300'}`} />
            <span className="font-mono text-slate-600">{e.key}</span>
            {e.value && <span className="text-slate-500">→ {e.value}</span>}
            {!e.set && <span className="text-amber-700 text-[10px] uppercase font-semibold">fehlt</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
