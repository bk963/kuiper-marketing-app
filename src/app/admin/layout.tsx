import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { getAdminSession } from '@/lib/admin-auth';
import Sidebar from '@/components/Sidebar';

export const metadata: Metadata = {
  title: 'Marketing · Kuiper Safety',
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = (await headers()).get('x-pathname') || '';
  if (pathname === '/admin/login') return <>{children}</>;

  const session = await getAdminSession();
  return (
    <div className="min-h-screen flex bg-slate-50">
      <Sidebar pathname={pathname} email={session?.email} />
      <main className="flex-1 ml-64 p-6 sm:p-8 overflow-y-auto">{children}</main>
    </div>
  );
}
