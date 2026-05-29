/**
 * Blog-Article neu anlegen — Redirect zum Blog-CMS TipTap-Editor.
 *
 * Marketing-App ist Read-Hub für Blog-Artikel. Neu-Anlage + Editieren
 * passiert im Blog-CMS auf blog.kuiper-safety.de/admin (Stage 1).
 */
import { requireAdmin } from '@/lib/admin-auth';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function NewArticlePage() {
  await requireAdmin();
  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/content/blog/articles" className="text-slate-500 hover:text-brand">← Artikel</Link>
        <h1 className="text-3xl font-extrabold">📝 Neuer Artikel</h1>
      </div>

      <div className="bg-white rounded-xl border p-8 text-center">
        <div className="text-4xl mb-3">📰</div>
        <h2 className="font-bold text-lg mb-2">Article-Editor läuft im Blog-CMS</h2>
        <p className="text-sm text-slate-600 mb-6 max-w-md mx-auto">
          Neue Artikel werden im Blog-CMS angelegt (Stage-1 TipTap-Editor).
          Marketing-App synchronisiert sie automatisch zur Anzeige.
        </p>
        <a
          href="https://blog.kuiper-safety.de/admin/articles/new"
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
