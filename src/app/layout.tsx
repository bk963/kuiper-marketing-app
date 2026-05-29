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
  const pathname = (await headers()).get('x-pathname') || '';
  const isLogin = pathname === '/admin/login';

  return (
    <html lang="de" className={`${figtree.variable} ${dmSans.variable}`}>
      <body className="font-sans bg-slate-50 text-ink antialiased min-h-screen">
        {/* Tracking-Stack (1:1 wie blog./www) — auch im Marketing-Cockpit für Self-Tracking */}
        {!isLogin && (
          <>
            <Script src="/scripts/kuiper-consent.v1.js" strategy="beforeInteractive" />
            <Script src="/scripts/kuiper-ga4.v1.js" strategy="afterInteractive" />
            <Script src="/scripts/kuiper-tracking.v1.js" strategy="afterInteractive" />
          </>
        )}
        {children}
      </body>
    </html>
  );
}
