import { requireAdmin } from '@/lib/admin-auth';
import { ga4Overview } from '@/lib/ga4';
import { gscSiteOverview } from '@/lib/gsc';
import { gadsAccountSummary } from '@/lib/google-ads';
import { blogArticleCount } from '@/lib/blog-data';
import StatCard from '@/components/StatCard';
import ConnectionStatus from '@/components/ConnectionStatus';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

function eur(n: number) { return n.toLocaleString('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }); }
function num(n: number) { return n.toLocaleString('de-DE'); }
function pct(n: number, decimals = 1) { return (n * 100).toFixed(decimals) + '%'; }

export default async function AdminOverview() {
  const session = await requireAdmin();

  const [ga4, gsc, ads, blogTotal, blogPublished] = await Promise.all([
    ga4Overview(7),
    gscSiteOverview(28),
    gadsAccountSummary(7),
    blogArticleCount(),
    blogArticleCount('status="published"'),
  ]);

  return (
    <div className="max-w-7xl">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-3xl font-extrabold">Marketing-Übersicht</h1>
        <div className="text-xs text-slate-500">Angemeldet als <span className="font-mono">{session.email}</span></div>
      </div>
      <p className="text-slate-600 mb-6">Kerndaten der letzten 7 / 28 Tage über alle Kanäle.</p>

      <ConnectionStatus checks={[
        { name: 'GA4', connected: !!ga4, hint: 'Service-Account in GA4-Property als Viewer hinterlegen + GA4_PROPERTY_ID setzen' },
        { name: 'Search Console', connected: !!gsc, hint: 'Service-Account als Limited User in GSC hinterlegen' },
        { name: 'Google Ads', connected: !!ads, hint: 'OAuth-Refresh-Token + Developer-Token bereits gesetzt' },
        { name: 'Blog-PB', connected: blogTotal > 0, hint: 'Blog-PocketBase Read-Verbindung' },
      ]} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <StatCard label="Sessions · 7T" value={ga4 ? num(ga4.total.sessions) : '—'} hint={ga4 ? `${num(ga4.total.users)} User` : 'GA4 nicht verbunden'} />
        <StatCard label="GSC Klicks · 28T" value={gsc ? num(gsc.total.clicks) : '—'} hint={gsc ? `${num(gsc.total.impressions)} Impressionen` : 'GSC nicht verbunden'} />
        <StatCard label="Ads Spend · 7T" value={ads ? eur(ads.cost) : '—'} hint={ads ? `ROAS ${ads.roas.toFixed(2)}x` : 'Ads nicht verbunden'} />
        <StatCard label="Blog-Artikel" value={blogTotal} hint={`${blogPublished} veröffentlicht`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-10">
        <Link href="/admin/traffic" className="block p-6 bg-white rounded-xl border hover:shadow-md hover:border-brand transition">
          <div className="text-2xl mb-2">📈</div>
          <div className="font-bold text-lg mb-1">Traffic-Dashboard</div>
          <p className="text-sm text-slate-600">Sessions, Channels, Geo, Devices, Top-Pages (GA4)</p>
        </Link>
        <Link href="/admin/seo" className="block p-6 bg-white rounded-xl border hover:shadow-md hover:border-brand transition">
          <div className="text-2xl mb-2">🔍</div>
          <div className="font-bold text-lg mb-1">SEO-Dashboard</div>
          <p className="text-sm text-slate-600">GSC + Rankings + Top-Keywords/Pages (Search Console)</p>
        </Link>
        <Link href="/admin/ads" className="block p-6 bg-white rounded-xl border hover:shadow-md hover:border-brand transition">
          <div className="text-2xl mb-2">🎯</div>
          <div className="font-bold text-lg mb-1">Ads-Dashboard</div>
          <p className="text-sm text-slate-600">Google Ads: Spend, CTR, CPC, CPA, ROAS pro Kampagne</p>
        </Link>
      </div>

      <div className="p-6 rounded-xl border bg-slate-50/50">
        <h2 className="font-bold mb-3">Phase-1-Scope</h2>
        <ul className="text-sm text-slate-700 space-y-1 list-disc list-inside">
          <li>3 Read-Dashboards: Traffic / SEO / Ads (echte Daten aus GA4 + GSC + Google-Ads-API)</li>
          <li>5 weitere Hubs sind als Stub angelegt (Content / KI / Kampagnen / Tracking / System)</li>
          <li>Auth: JWT + Marketing-PocketBase (mpb.kuiper-safety.de)</li>
          <li>Maximum-Tracking 1:1 wie blog./www. (GA4 + Clarity + Consent + Click-IDs)</li>
          <li>Cross-Subdomain-Persistenz mit www. + blog. via .kuiper-safety.de Cookie-Domain</li>
        </ul>
      </div>
    </div>
  );
}
