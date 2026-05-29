import Link from 'next/link';
import Image from 'next/image';

type NavItem = {
  href: string;
  label: string;
  icon: string;
  hub?: boolean; // Top-Level-Hub-Header
  active?: boolean;
};

const NAV: NavItem[] = [
  { href: '/admin', label: 'Übersicht', icon: '📊' },

  { href: '#dashboards', label: 'DASHBOARDS', icon: '', hub: true },
  { href: '/admin/traffic', label: 'Traffic', icon: '📈' },
  { href: '/admin/seo', label: 'SEO', icon: '🔍' },
  { href: '/admin/ads', label: 'Ads', icon: '🎯' },
  { href: '/admin/conversions', label: 'Conversions', icon: '💰' },

  { href: '#content-hub', label: 'CONTENT-HUB', icon: '', hub: true },
  { href: '/admin/content/blog', label: 'Blog', icon: '📰' },
  { href: '/admin/content/seo-intel', label: 'SEO-Intel', icon: '🎯' },
  { href: '/admin/content/landingpages', label: 'Landingpages', icon: '🎨' },
  { href: '/admin/content/landingpages/bausteine', label: 'Bausteine', icon: '🧩' },
  { href: '/admin/content/site', label: 'Site-Pages', icon: '🌐' },
  { href: '/admin/content/templates', label: 'Templates', icon: '📐' },
  { href: '/admin/content/forms', label: 'Formulare', icon: '📋' },
  { href: '/admin/content/social', label: 'Social-Generator', icon: '🤖' },
  { href: '/admin/content/leads', label: 'Marketing-Leads', icon: '👥' },

  { href: '#legacy-content', label: 'CONTENT (LEGACY)', icon: '', hub: true },
  { href: '/admin/landingpages', label: 'Landingpages', icon: '🎨' },
  { href: '/admin/lead-magnets', label: 'Lead-Magnete', icon: '📥' },
  { href: '/admin/forms', label: 'Formulare (alt)', icon: '📋' },
  { href: '/admin/emails', label: 'E-Mail-Templates (alt)', icon: '✉️' },

  { href: '#ai', label: 'KI-WERKZEUGE', icon: '', hub: true },
  { href: '/admin/ai/social', label: 'Social-Generator', icon: '🤖' },
  { href: '/admin/ai/seo-recommend', label: 'SEO-Vorschläge', icon: '💡' },
  { href: '/admin/ai/lp-gen', label: 'LP-Generator', icon: '✨' },

  { href: '#campaigns', label: 'KAMPAGNEN', icon: '', hub: true },
  { href: '/admin/campaigns', label: 'E-Mail-Kampagnen', icon: '📣' },
  { href: '/admin/automations', label: 'Automationen', icon: '⚙️' },
  { href: '/admin/segments', label: 'Segmente', icon: '🏷️' },

  { href: '#tracking', label: 'TRACKING', icon: '', hub: true },
  { href: '/admin/tracking/utm', label: 'UTM-Generator', icon: '🔗' },
  { href: '/admin/tracking/pixels', label: 'Pixel-Manager', icon: '👁️' },
  { href: '/admin/tracking/capi', label: 'CAPI', icon: '🛰️' },

  { href: '#admin', label: 'SYSTEM', icon: '', hub: true },
  { href: '/admin/integrations', label: 'Integrationen', icon: '🔌' },
  { href: '/admin/alerts', label: 'Alerts', icon: '🔔' },
  { href: '/admin/reports', label: 'Reports', icon: '📄' },
];

export default function Sidebar({ pathname, email }: { pathname: string; email?: string }) {
  return (
    <aside className="w-64 bg-navy text-white p-5 flex flex-col fixed inset-y-0 overflow-y-auto">
      <Link href="/admin" className="flex items-center gap-2 mb-8 hover:opacity-80 shrink-0">
        <Image src="/brand/kss-k-cyan.svg" alt="KS" width={32} height={32} />
        <div className="flex flex-col leading-tight">
          <span className="text-xs uppercase tracking-[0.18em] font-bold text-brand">Marketing</span>
          <span className="text-[10px] text-white/60 font-mono">v1 · Phase 1</span>
        </div>
      </Link>

      <nav className="space-y-0.5 text-sm flex-1">
        {NAV.map((item) => {
          if (item.hub) {
            return (
              <div key={item.href} className="text-[10px] uppercase tracking-wider text-brand/70 font-bold pt-5 pb-1 px-3 first:pt-0">
                {item.label}
              </div>
            );
          }
          const isActive = pathname === item.href || (pathname.startsWith(item.href + '/') && item.href !== '/admin');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                'flex items-center gap-2 px-3 py-2 rounded transition',
                isActive ? 'bg-brand/15 text-brand border-l-2 border-brand pl-2.5' : 'hover:bg-white/10 text-white/85 hover:text-white',
              ].join(' ')}
            >
              <span className="w-5 text-center">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="pt-4 mt-4 border-t border-white/10 text-xs text-white/60 space-y-2 shrink-0">
        {email && <div className="px-3 font-mono truncate">{email}</div>}
        <div className="px-3">
          <Link href="https://blog.kuiper-safety.de/admin" target="_blank" className="block hover:text-brand">↗ Blog-CMS</Link>
          <Link href="https://app.kuiper-safety.de" target="_blank" className="block hover:text-brand">↗ CRM</Link>
        </div>
        <form action="/admin/api/auth/logout" method="POST" className="px-3 pt-1">
          <button type="submit" className="hover:text-white text-left w-full">Abmelden</button>
        </form>
      </div>
    </aside>
  );
}
