import { requireAdmin } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export default async function Page() {
  await requireAdmin();
  return (
    <div className="max-w-4xl">
      <h1 className="text-3xl font-extrabold mb-2">🖼️ Medien-Bibliothek</h1>
      <p className="text-slate-600 mb-8">Bilder + alt-Text + Tags für Article-Hero-Images</p>
      <div className="p-8 rounded-xl border bg-gradient-to-br from-slate-50 to-brand/5">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-3xl">🚧</span>
          <h2 className="font-bold text-lg">Phase 2.0b+</h2>
        </div>
        <p className="text-slate-700">Upload-Komponente + Bild-Optimierung (Real-ESRGAN/WebP) kommt nachgelagert. Collection mkt_blog_media existiert.</p>
      </div>
    </div>
  );
}
