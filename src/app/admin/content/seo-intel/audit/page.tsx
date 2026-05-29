import { requireAdmin } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export default async function AuditPage() {
  await requireAdmin();
  return (
    <div className="max-w-4xl">
      <h1 className="text-3xl font-extrabold mb-2">🛡️ OnPage-Audit</h1>
      <p className="text-slate-600 mb-8">SEO-Score pro Artikel — Title-Length, Meta-Quality, Heading-Structure, Internal-Links, Readability</p>
      <div className="p-8 rounded-xl border bg-gradient-to-br from-slate-50 to-brand/5">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-3xl">🚧</span>
          <h2 className="font-bold text-lg">Phase 2.0c+</h2>
        </div>
        <p className="text-slate-700 mb-3">
          Yoast-Style Audit-Engine pro Artikel:
        </p>
        <ul className="space-y-1 text-sm text-slate-600 list-disc list-inside">
          <li>Focus-Keyword-Density-Check</li>
          <li>Meta-Title 50-60 chars / Meta-Description 140-160 chars</li>
          <li>Heading-Hierarchy (H1 max 1, H2-Struktur)</li>
          <li>Internal-Links min 2 / Outbound-Links min 1</li>
          <li>Readability (Flesch-Score DE)</li>
          <li>FAQ-Schema present</li>
          <li>Image-Alt-Texts vollständig</li>
        </ul>
      </div>
    </div>
  );
}
