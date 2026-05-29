import { getAdminSession } from '@/lib/admin-auth';
import { redirect } from 'next/navigation';
import Image from 'next/image';
import LoginForm from './LoginForm';

export const metadata = {
  title: 'Login · Marketing',
  robots: { index: false, follow: false },
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (await getAdminSession()) redirect('/admin');
  const sp = await searchParams;
  return (
    <div className="min-h-screen flex items-center justify-center bg-navy p-4 relative overflow-hidden">
      {/* Cyan-Akzent-Gradient im Hintergrund */}
      <div className="absolute inset-0 bg-gradient-to-br from-navy via-navy to-navy-dark opacity-90" />
      <div className="absolute -top-32 -right-32 w-96 h-96 bg-brand/20 rounded-full blur-3xl" />

      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Image src="/brand/kss-k-cyan.svg" alt="KS" width={36} height={36} />
            <div className="text-2xl font-extrabold text-navy">Marketing</div>
          </div>
          <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">marketing.kuiper-safety.de</p>
        </div>
        <LoginForm error={sp.error} />
      </div>
    </div>
  );
}
