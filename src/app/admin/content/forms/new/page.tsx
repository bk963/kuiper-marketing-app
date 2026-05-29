import { requireAdmin } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export default async function NewFormPage() {
  await requireAdmin();
  return (
    <div className="max-w-3xl">
      <h1 className="text-3xl font-extrabold mb-2">📋 Neues Formular</h1>
      <div className="p-8 rounded-xl border bg-gradient-to-br from-slate-50 to-brand/5 mt-6">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-3xl">🚧</span>
          <h2 className="font-bold text-lg">Form-Builder Sub-Sprint</h2>
        </div>
        <p className="text-slate-700">Initialer Wizard mit Type-Select kommt im Sub-Sprint.</p>
      </div>
    </div>
  );
}
