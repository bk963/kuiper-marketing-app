import { requireAdmin } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export default async function SitePageEditor({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  return (
    <div className="max-w-5xl">
      <h1 className="text-3xl font-extrabold mb-2">🌐 Site-Page bearbeiten</h1>
      <p className="text-slate-600 mb-2 font-mono text-xs">ID: {id}</p>
      <div className="p-8 rounded-xl border bg-gradient-to-br from-slate-50 to-brand/5 mt-6">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-3xl">🚧</span>
          <h2 className="font-bold text-lg">Editor-Sub-Sprint</h2>
        </div>
        <p className="text-slate-700 mb-3">
          Section-Editor (Hero/Trust/Features/CTA/FAQ/Form/Testimonials) + Meta/SEO-Sidebar + Publish-Workflow kommt im nächsten Sub-Sprint.
        </p>
      </div>
    </div>
  );
}
