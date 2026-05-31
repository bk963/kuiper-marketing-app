import type { Metadata } from 'next';
import { Figtree, DM_Sans } from 'next/font/google';
import Script from 'next/script';
import { headers } from 'next/headers';
import './globals.css';

const figtree = Figtree({ subsets: ['latin'], variable: '--font-figtree', display: 'swap' });
const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-dm-sans', display: 'swap' });

export const metadata: Metadata = {
  title: { default: 'Marketing · Kuiper Safety', template: '%s · Kuiper Marketing' },
  description: 'Marketing-Cockpit: Traffic, SEO, Ads, Conversions, Landingpages',
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
  icons: { icon: '/favicon.ico' },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const hdrs = await headers();
  const pathname = hdrs.get('x-pathname') || '';
  // Tracking NUR auf öffentlichen Public-LPs unter kuiper-safety.de/lp/*.
  // Edge-Caddy (kuiper-web-prod) setzt X-Lp-Proxy-From für den /lp/*-Reverse-Proxy.
  // Direkt-Zugriffe auf marketing.kuiper-safety.de (Admin + interne /lp/*) haben den Header nicht
  // → kein GA4 / kein Clarity / keine Pixel / kein Self-Tracking.
  // Bk-Direktive 2026-05-31: marketing.kuiper-safety.de geht nicht live, daher kein Tracking dort.
  const proxiedFromEdge = hdrs.get('x-lp-proxy-from') === 'kuiper-web-prod';
  const isPublicLP = proxiedFromEdge && pathname.startsWith('/lp/');

  return (
    <html lang="de" className={`${figtree.variable} ${dmSans.variable}`}>
      <body className="font-sans bg-slate-50 text-ink antialiased min-h-screen">
        {/* Tracking-Stack (1:1 wie blog./www) — NUR für public LPs unter kuiper-safety.de */}
        {isPublicLP && (
          <>
            <Script src="/scripts/kuiper-consent.v1.js" strategy="beforeInteractive" />
            <Script src="/scripts/kuiper-ga4.v1.js" strategy="afterInteractive" />
            <Script src="/scripts/kuiper-tracking.v1.js" strategy="afterInteractive" />
            {/* Microsoft Clarity — Consent-gated (Kategorie statistik), inline-Snippet */}
            <Script id="kuiper-clarity-loader" strategy="afterInteractive">
              {`(function(){var CLARITY_ID="wwb7ihptp7";function load(){if(window.__clarityLoaded)return;window.__clarityLoaded=true;(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y)})(window,document,"clarity","script",CLARITY_ID)}function check(){try{if(window.kuiperConsent&&window.kuiperConsent.has("statistik"))load()}catch(e){}}check();if(window.kuiperConsent&&typeof window.kuiperConsent.on==="function"){window.kuiperConsent.on("update",check)}else{var n=0;var iv=setInterval(function(){check();if(window.__clarityLoaded||++n>=15)clearInterval(iv)},2000)}})();`}
            </Script>
          </>
        )}
        {children}
      </body>
    </html>
  );
}
