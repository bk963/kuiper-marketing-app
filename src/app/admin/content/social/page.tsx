import { requireAdmin } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export default async function SocialGeneratorPage() {
  await requireAdmin();
  return (
    <div className="max-w-4xl">
      <h1 className="text-3xl font-extrabold mb-2">🤖 Social-Generator</h1>
      <p className="text-slate-600 mb-8">1 Topic / 1 Artikel → Posts für alle Social-Kanäle (LinkedIn, Facebook, Instagram, TikTok, X/Twitter, XING, Pressemitteilung).</p>
      <div className="p-8 rounded-xl border bg-gradient-to-br from-slate-50 to-brand/5">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-3xl">🚧</span>
          <h2 className="font-bold text-lg">Ollama-Anbindung Sub-Sprint</h2>
        </div>
        <p className="text-slate-700 mb-3">
          Multi-Channel-Post-Generator mit Ollama qwen2.5:32b auf GEX44. Aktuell läuft die Engine im CRM (social.js Backend wurde im Cleanup-Sprint entfernt).
        </p>
        <p className="text-sm text-slate-600">
          Sub-Sprint-Scope: <code>/api/admin/social/generate</code> POST-Endpoint + Frontend mit Topic-Input, Channel-Multi-Select, Tabs pro Generated-Post + Copy-Button.
        </p>
      </div>
    </div>
  );
}
