import { getAdminSession } from '@/lib/admin-auth';
import { redirect } from 'next/navigation';
import LoginForm from './LoginForm';

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
        <div className="mt-8 pt-6 border-t border-slate-100 text-center text-[10px] text-gray-400 font-bold uppercase tracking-wider">
          marketing.kuiper-safety.de
        </div>
      </div>
    </div>
  );
}
