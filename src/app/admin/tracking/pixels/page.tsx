import { requireAdmin } from '@/lib/admin-auth';
import { countTrackingRecords } from '@/lib/pb-tracking';

export const dynamic = 'force-dynamic';

type PixelDef = {
  id: string;
  name: string;
  envKey: string;
  fireFn: string;
  docsUrl: string;
};

const PIXELS: PixelDef[] = [
  { id: 'meta', name: 'Meta Pixel (Facebook/Instagram)', envKey: 'META_PIXEL_ID', fireFn: 'fbq(track, ...)', docsUrl: 'https://business.facebook.com/events_manager2' },
  { id: 'linkedin', name: 'LinkedIn Insight Tag', envKey: 'LINKEDIN_PARTNER_ID', fireFn: 'lintrk(track, ...)', docsUrl: 'https://www.linkedin.com/campaignmanager/' },
  { id: 'tiktok', name: 'TikTok Pixel', envKey: 'TIKTOK_PIXEL_ID', fireFn: 'ttq.track(...)', docsUrl: 'https://ads.tiktok.com/i18n/events_manager' },
  { id: 'bing', name: 'Bing UET', envKey: 'BING_UET_TAG_ID', fireFn: 'uetq.push(...)', docsUrl: 'https://ui.ads.microsoft.com/' },
  { id: 'ga4', name: 'Google Analytics 4', envKey: 'GA4_MEASUREMENT_ID', fireFn: 'gtag(event, ...)', docsUrl: 'https://analytics.google.com/' },
  { id: 'clarity', name: 'Microsoft Clarity', envKey: 'CLARITY_PROJECT_ID', fireFn: 'clarity(...)', docsUrl: 'https://clarity.microsoft.com/' },
];

export default async function Page() {
  await requireAdmin();

  const env = process.env as Record<string, string | undefined>;
  const pixelStatus = PIXELS.map(p => ({
    ...p,
    configured: Boolean(env[p.envKey] && String(env[p.envKey]).trim()),
    value: (env[p.envKey] || '').toString().slice(0, 30),
  }));

  const totalVisits = await countTrackingRecords('bsh_visits');

  return (
    <div className="max-w-5xl">
      <h1 className="text-3xl font-extrabold mb-2">📌 Pixel-Manager</h1>
      <p className="text-slate-600 text-sm mb-8">
        Meta/LinkedIn/TikTok/Bing-UET/GA4/Clarity zentral mit Consent-Gates · Loader:{' '}
        <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-xs">/scripts/kuiper-tracking.v1.js</code>
      </p>

      <div className="grid grid-cols-1 gap-3 mb-8">
        {pixelStatus.map(p => (
          <div key={p.id} className={`p-4 rounded-xl border ${p.configured ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold">{p.name}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${p.configured ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white'}`}>
                    {p.configured ? '✓ aktiv' : '⚠ token fehlt'}
                  </span>
                </div>
                <div className="text-xs text-slate-600 font-mono">
                  ENV: <strong>{p.envKey}</strong>{p.configured ? ` = ${p.value}…` : ' = ∅'}
                </div>
                <div className="text-xs text-slate-500 mt-1">Fire: <code>{p.fireFn}</code></div>
              </div>
              <a href={p.docsUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-brand hover:underline">
                Plattform-Konsole ↗
              </a>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 rounded-xl bg-slate-100">
        <h3 className="font-bold mb-2 text-sm">Tracking-Pipeline-Status</h3>
        <ul className="text-sm space-y-1 text-slate-700">
          <li>📥 <strong>{totalVisits}</strong> Sessions in <code>bsh_visits</code> (PB pb-tracking)</li>
          <li>📤 Client-Pixel-Loader: <code>kuiper-tracking.v1.js</code> v1 (550 LOC, Consent-gated)</li>
          <li>🚀 Server-Side: <code>/api/track/event</code> (T1) + <code>/api/admin/fire-capi</code> (T4)</li>
          <li>🔐 Consent: <code>kuiper-consent.v1.js</code> Kategorie <strong>statistik</strong> für GA4/Clarity, <strong>marketing</strong> für Meta/LI/TT/Bing</li>
        </ul>
      </div>
    </div>
  );
}
