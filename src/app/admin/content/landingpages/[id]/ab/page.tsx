/**
 * A/B-Stats-Dashboard pro LP.
 *
 * Phase T6 (2026-05-30) — Tracking-Maximum-Sprint.
 *
 * URL: /admin/content/landingpages/<id>/ab
 * Zeigt: Views A/B, Conversions A/B, CR A/B, Lift, Confidence (Z-Test), Winner-Badge.
 */
import { requireAdmin } from '@/lib/admin-auth';
import { getLandingpage } from '@/lib/mkt-lp';
import { computeAbStats } from '@/lib/ab-stats';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

const STATUS_COLOR: Record<string, string> = {
  live: 'bg-emerald-100 text-emerald-800',
  draft: 'bg-amber-100 text-amber-800',
  archived: 'bg-slate-100 text-slate-600',
};

function fmtPct(x: number, digits = 2): string {
  return (x * 100).toFixed(digits) + '%';
}

export default async function AbStatsPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const lp = await getLandingpage(id);
  if (!lp) notFound();

  const s = computeAbStats(lp);
  const winnerLabel = s.winner === 'tie' ? '—' : s.winner.toUpperCase();
  const winnerColor =
    !s.significant && s.winner !== 'tie'
      ? 'bg-amber-100 text-amber-800'
      : s.winner === 'a'
        ? 'bg-blue-600 text-white'
        : s.winner === 'b'
          ? 'bg-purple-600 text-white'
          : 'bg-slate-200 text-slate-600';

  return (
    <div className="max-w-5xl">
      <div className="flex items-baseline justify-between mb-6">
        <div>
          <Link href="/admin/content/landingpages" className="text-slate-500 hover:text-brand text-sm">
            ← Landingpages
          </Link>
          <h1 className="text-3xl font-extrabold mt-1">📊 A/B-Stats: {lp.internal_name || lp.slug}</h1>
          <div className="flex items-center gap-2 mt-2">
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${STATUS_COLOR[lp.status] || 'bg-slate-100 text-slate-600'}`}>
              {lp.status || 'draft'}
            </span>
            <span className="text-xs text-slate-500 font-mono">/lp/{lp.slug}</span>
            {lp.ab_test_active ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-purple-100 text-purple-800">A/B aktiv</span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-slate-200 text-slate-600">A/B inaktiv</span>
            )}
          </div>
        </div>
        <Link
          href={`/admin/content/landingpages/${lp.id}`}
          className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-bold hover:bg-slate-200 transition text-sm"
        >
          Editor öffnen
        </Link>
      </div>

      {!lp.ab_test_active && (
        <div className="p-4 mb-6 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-sm">
          ⚠️ A/B-Test ist NICHT aktiv. Counter werden nur erfasst wenn <code>ab_test_active=true</code> im Editor gesetzt.
        </div>
      )}

      {/* Variant-Comparison-Cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-6 rounded-xl border bg-white">
          <div className="flex items-baseline justify-between mb-3">
            <div className="text-xl font-extrabold text-blue-700">Variante A (Original)</div>
            {s.winner === 'a' && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${winnerColor}`}>
                {s.significant ? '👑 Gewinner' : 'führt'}
              </span>
            )}
          </div>
          <div className="space-y-2 text-sm">
            <Row label="Views" value={s.views_a.toLocaleString('de-DE')} />
            <Row label="Conversions" value={s.conv_a.toLocaleString('de-DE')} />
            <Row label="Conversion-Rate" value={fmtPct(s.cr_a)} bold />
          </div>
        </div>

        <div className="p-6 rounded-xl border bg-white">
          <div className="flex items-baseline justify-between mb-3">
            <div className="text-xl font-extrabold text-purple-700">Variante B</div>
            {s.winner === 'b' && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${winnerColor}`}>
                {s.significant ? '👑 Gewinner' : 'führt'}
              </span>
            )}
          </div>
          <div className="space-y-2 text-sm">
            <Row label="Views" value={s.views_b.toLocaleString('de-DE')} />
            <Row label="Conversions" value={s.conv_b.toLocaleString('de-DE')} />
            <Row label="Conversion-Rate" value={fmtPct(s.cr_b)} bold />
          </div>
        </div>
      </div>

      {/* Statistik-Box */}
      <div className="p-6 rounded-xl border bg-gradient-to-br from-slate-50 to-brand/5 mb-6">
        <h3 className="font-bold mb-3">📈 Statistische Auswertung</h3>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <div className="text-xs uppercase tracking-wider text-slate-500 font-bold">Lift (B vs A)</div>
            <div className={`text-2xl font-extrabold mt-1 ${s.lift > 0 ? 'text-emerald-600' : s.lift < 0 ? 'text-red-600' : 'text-slate-500'}`}>
              {s.lift > 0 ? '+' : ''}
              {fmtPct(s.lift, 1)}
            </div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-slate-500 font-bold">Confidence</div>
            <div className={`text-2xl font-extrabold mt-1 ${s.confidence >= 0.95 ? 'text-emerald-600' : s.confidence >= 0.8 ? 'text-amber-600' : 'text-slate-500'}`}>
              {fmtPct(s.confidence, 1)}
            </div>
            <div className="text-[10px] text-slate-500 mt-1">z-score: {s.z.toFixed(2)}</div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-slate-500 font-bold">Status</div>
            <div className="mt-1">
              {s.significant ? (
                <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase bg-emerald-600 text-white">
                  ✓ signifikant
                </span>
              ) : s.views_a < 100 || s.views_b < 100 ? (
                <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase bg-slate-300 text-slate-700">
                  ⏳ zu wenig Daten
                </span>
              ) : (
                <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase bg-amber-100 text-amber-800">
                  ⚠ nicht signifikant
                </span>
              )}
            </div>
            <div className="text-[10px] text-slate-500 mt-1">
              Schwelle: ≥95% Confidence + ≥100 Views/Variante
            </div>
          </div>
        </div>
      </div>

      <div className="text-xs text-slate-500">
        <strong>Methodik:</strong> 2-Sample-Z-Test für Proportionen (zweiseitig). Daten aus{' '}
        <code>mkt_landingpages.ab_views_a/b</code> + <code>ab_conversions_a/b</code>. Counter werden via
        Public-LP-Route +1 PATCH inkrementiert (race-condition-prone — Folge-Sprint atomic +1).
      </div>
    </div>
  );
}

function Row({ label, value, bold = false }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-baseline justify-between">
      <div className="text-xs text-slate-600">{label}</div>
      <div className={`font-mono ${bold ? 'font-bold text-base' : ''}`}>{value}</div>
    </div>
  );
}
