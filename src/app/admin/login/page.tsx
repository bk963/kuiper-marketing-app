import { getAdminSession } from '@/lib/admin-auth';
import { redirect } from 'next/navigation';
import LoginForm from './LoginForm';
import { ssoConfigured } from '@/lib/oidc';

export const metadata = {
  title: 'Login · Marketing',
  robots: { index: false, follow: false },
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (await getAdminSession()) redirect('/admin');
  const sp = await searchParams;
  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ background: 'radial-gradient(1200px 800px at 70% -10%, #14306e 0%, #0b1a4d 55%, #07123a 100%)' }}
    >
      {/* Einheitliches „Kuiper-ID"-Login-Design wie cloud.kuiper-safety.com / CRM / Academy */}
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/kuiper-logo.png" alt="Kuiper Safety Systems" className="h-10 w-auto mx-auto" />
          <p className="text-sm text-gray-500 mt-2 tracking-wide">Marketing</p>
        </div>
        <LoginForm error={sp.error} />
        {ssoConfigured() && (
          <>
            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-200" /></div>
              <div className="relative flex justify-center text-xs"><span className="bg-white px-2 text-gray-400 uppercase tracking-wide">oder</span></div>
            </div>
            <a
              href="/admin/api/auth/oidc/login"
              className="flex w-full items-center justify-center h-12 border border-slate-200 bg-white rounded-xl font-semibold text-[#0d1b3e] hover:bg-slate-50 transition"
            >
              Mit Kuiper-ID anmelden
            </a>
          </>
        )}
        <div className="mt-8 pt-6 border-t border-slate-100 text-center text-[10px] text-gray-400 font-bold uppercase tracking-wider">
          marketing.kuiper-safety.de
        </div>
      </div>
    </div>
  );
}
