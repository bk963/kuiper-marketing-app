import { requireAdmin } from '@/lib/admin-auth';
import { runQuery } from '@/lib/kpi/engine';
import { listTiles } from '@/lib/kpi/tiles';
import { ga4Overview } from '@/lib/ga4';
import { gscSiteOverview } from '@/lib/gsc';
import { gadsAccountSummary } from '@/lib/google-ads';
import { blogArticleCount } from '@/lib/blog-data';
import KpiTile from '@/components/kpi/KpiTile';
import CockpitClient, { type RenderedTile } from '@/components/kpi/CockpitClient';
import ConnectionStatus from '@/components/ConnectionStatus';
import Link from 'next/link';
import type { QuerySpec } from '@/lib/kpi/types';

export const dynamic = 'force-dynamic';

// Daily-Driver-KPIs — immer sichtbar, oben.
const CORE: QuerySpec[] = [
  { metric: 'qualified_leads', days: 30, title: 'Qualifizierte Leads · 30T' },
  { metric: 'cpa_qualified', days: 30, title: 'CPA pro qual. Lead · 30T' },
  { metric: 'cost', days: 30, title: 'Ad-Spend · 30T' },
  { metric: 'submit_to_qualified_rate', days: 30, title: 'Submit→Qualified · 30T' },
];

export default async function AdminCockpit() {
  const session = await requireAdmin();

  // Core-KPIs + gepinnte Kacheln + Connection-Checks parallel
  const tilesList = await listTiles();
  const [core, pinnedResults, ga4, gsc, ads, blogTotal] = await Promise.all([
    Promise.all(CORE.map((s) => runQuery(s))),
    Promise.all(tilesList.tiles.map((t) => runQuery(t.spec))),
    ga4Overview(7),
    gscSiteOverview(28),
    gadsAccountSummary(7),
    blogArticleCount(),
  ]);

  const initialTiles: RenderedTile[] = tilesList.tiles.map((t, i) => ({
    id: t.id, viz: t.viz, span: t.span, result: pinnedResults[i],
  }));

  return (
    <div className="max-w-7xl">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-3xl font-extrabold text-ink">Marketing-Cockpit</h1>
        <div className="text-xs text-slate-500">Angemeldet als <span className="font-mono">{session.email}</span></div>
      </div>
      <p className="text-slate-600 mb-6">Deine Zahlen — live, fragbar, pinnbar.</p>

      {/* ── Core-KPIs ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {core.map((r, i) => <KpiTile key={i} result={r} viz="number" />)}
      </div>

      {/* ── Prompt + gepinntes Dashboard ── */}
      <CockpitClient initialTiles={initialTiles} />

      {/* ── Deep-Dive-Dashboards ── */}
      <div className="mt-12 mb-3 text-sm font-bold uppercase tracking-wider text-slate-500">Deep-Dive</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { href: '/admin/traffic', icon: '📈', t: 'Traffic', d: 'Sessions, Channels, Geo, Devices (GA4)' },
          { href: '/admin/seo', icon: '🔍', t: 'SEO', d: 'GSC, Rankings, Top-Keywords/Pages' },
          { href: '/admin/ads', icon: '🎯', t: 'Ads', d: 'Spend, CTR, CPC, CPA, ROAS pro Kampagne' },
          { href: '/admin/conversions', icon: '✅', t: 'Conversions', d: 'Funnel, Leads, Closed-Loop' },
        ].map((c) => (
          <Link key={c.href} href={c.href} className="block p-5 bg-white rounded-xl border border-slate-200/70 hover:shadow-md hover:border-brand transition">
            <div className="text-2xl mb-1.5">{c.icon}</div>
            <div className="font-bold mb-0.5">{c.t}</div>
            <p className="text-xs text-slate-600">{c.d}</p>
          </Link>
        ))}
      </div>

      {/* ── Datenquellen-Status ── */}
      <ConnectionStatus checks={[
        { name: 'GA4', connected: !!ga4, hint: 'Service-Account in GA4-Property als Viewer + GA4_PROPERTY_ID' },
        { name: 'Search Console', connected: !!gsc, hint: 'Service-Account als Limited User in GSC' },
        { name: 'Google Ads', connected: !!ads, hint: 'OAuth-Refresh-Token + Developer-Token' },
        { name: 'pb-tracking', connected: !!core[0]?.ok, hint: 'Lead-Submissions (marketing_lead_submissions)' },
        { name: 'Blog-PB', connected: blogTotal > 0, hint: 'Blog-PocketBase Read' },
      ]} />
    </div>
  );
}
