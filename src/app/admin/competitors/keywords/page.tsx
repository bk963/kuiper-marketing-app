import { requireAdmin } from '@/lib/admin-auth';
import { getKeywordRows } from '@/lib/keywordSets';
import KeywordManager from '@/components/KeywordManager';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function KeywordsPage() {
  await requireAdmin();
  const rows = await getKeywordRows({ onlyActive: false });

  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-2 mb-2">
        <Link href="/admin/competitors" className="text-sm text-slate-500 hover:text-slate-700">← Wettbewerb</Link>
      </div>
      <h1 className="text-3xl font-extrabold mb-2">🎯 Keyword-Universum</h1>
      <p className="text-slate-600 mb-6">Steuere, <b>welche Keywords</b> täglich beobachtet werden — gruppiert nach Kampagnen-Welt. Diese Keywords sind die Basis für Leaderboard, Dominanz-Score und Strategie. Änderungen wirken ab dem nächsten Lauf.</p>
      <KeywordManager initial={rows as any} />
    </div>
  );
}
