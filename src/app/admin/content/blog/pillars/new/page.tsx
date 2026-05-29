/**
 * Pillar-Page neu — Redirect zu Blog-CMS.
 */
import { requireAdmin } from '@/lib/admin-auth';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function NewPillarPage() {
  await requireAdmin();
  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/content/blog/pillars" className="text-slate-500 hover:text-brand">← Pillars</Link>
        <h1 className="text-3xl font-extrabold">🏛️ Neue Pillar-Seite</h1>
      </div>
      <div className="bg-white rounded-xl border p-8 text-center">
        <div className="text-4xl mb-3">🏛️</div>
        <h2 className="font-bold text-lg mb-2">Pillar-Editor läuft im Blog-CMS</h2>
        <p className="text-sm text-slate-600 mb-6 max-w-md mx-auto">
          Neue Pillar-Pages werden im Blog-CMS angelegt.
        </p>
        <a
          href="https://blog.kuiper-safety.de/admin/pillars/new"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block px-5 py-2.5 bg-brand text-navy rounded-lg font-bold hover:bg-brand-light transition"
        >
          Im Blog-CMS anlegen ↗
        </a>
      </div>
    </div>
  );
}
