import { requireAdmin } from '@/lib/admin-auth';
import { getLeads, tally, dailyTrend, isQualified, isLeadMagnet, QUALIFIED_MIN, type LeadRow } from '@/lib/leads';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

const RANGES: Array<{ key: string; days: number | null; label: string }> = [
  { key: '7', days: 7, label: '7 Tage' },
  { key: '30', days: 30, label: '30 Tage' },
  { key: '90', days: 90, label: '90 Tage' },
  { key: 'all', days: null, label: 'Gesamt' },
];

const nf = (n: number) => new Intl.NumberFormat('de-DE').format(Math.round(n));

function Kpi({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div className={`rounded-xl border p-4 ${accent ? 'bg-cyan-50 border-cyan-200' : 'bg-white'}`}>
      <div className="text-xs uppercase tracking-wide text-slate-400 font-semibold">{label}</div>
      <div className={`text-2xl font-bold mt-0.5 ${accent ? 'text-cyan-800' : 'text-slate-900'}`}>{value}</div>
      {sub && <div className="text-xs text-slate-500 mt-0.5">{sub}</div>}
    </div>
  );
}

function BarList({ title, rows, total, hint, max = 8 }: { title: string; rows: Array<{ label: string; n: number }>; total: number; hint?: string; max?: number }) {
  const top = rows.slice(0, max);
  const peak = Math.max(1, ...top.map((r) => r.n));
  return (
    <div className="bg-white rounded-xl border p-5">
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="text-sm font-bold text-slate-700">{title}</h2>
        {hint && <span className="text-xs text-slate-400">{hint}</span>}
      </div>
      {!top.length && <div className="text-sm text-slate-400">Keine Daten im Zeitraum.</div>}
      <div className="space-y-2">
        {top.map((r) => (
          <div key={r.label} className="flex items-center gap-3 text-sm">
            <div className="w-40 sm:w-52 shrink-0 truncate text-slate-700" title={r.label}>{r.label}</div>
            <div className="flex-1 bg-slate-100 rounded-full h-2.5 overflow-hidden">
              <div className="h-full bg-cyan-400 rounded-full" style={{ width: `${Math.round((r.n / peak) * 100)}%` }} />
            </div>
            <div className="w-16 shrink-0 text-right tabular-nums font-semibold text-slate-900">{nf(r.n)}</div>
            <div className="w-12 shrink-0 text-right tabular-nums text-xs text-slate-400">{total ? Math.round((r.n / total) * 100) : 0}%</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Trend({ data }: { data: Array<{ day: string; n: number }> }) {
  const peak = Math.max(1, ...data.map((d) => d.n));
  return (
    <div className="bg-white rounded-xl border p-5">
      <h2 className="text-sm font-bold text-slate-700 mb-3">Verlauf (Leads/Tag)</h2>
      <div className="flex items-end gap-0.5 h-28">
        {data.map((d) => (
          <div key={d.day} className="flex-1 group relative flex flex-col justify-end">
            <div className="bg-cyan-400 hover:bg-cyan-500 rounded-t transition-all" style={{ height: `${Math.max(2, Math.round((d.n / peak) * 100))}%` }} />
            <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover:block whitespace-nowrap text-[10px] bg-slate-900 text-white px-1.5 py-0.5 rounded z-10">
              {new Date(d.day).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}: {d.n}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default async function LeadsDashboard({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const range = RANGES.find((r) => r.key === sp.range) || RANGES[1];
  const leads = await getLeads(range.days);

  const total = leads.length;
  const qualified = leads.filter(isQualified).length;
  const magnets = leads.filter(isLeadMagnet);
  const avgScore = total ? Math.round(leads.reduce((s, l) => s + (l.quality_score || 0), 0) / total) : 0;
  const qualRate = total ? Math.round((qualified / total) * 100) : 0;

  const bySource = tally(leads, 'lead_source');
  const byPage = tally(leads, 'form_page');
  const byChannel = tally(leads, 'utm_source');
  const byStatus = tally(leads, 'status');
  const byCity = tally(leads.filter((l) => l.geo_city), 'geo_city', '(unbekannt)');
  const byMagnet = tally(magnets, 'lead_source');
  const trend = dailyTrend(leads, range.days || 90);

  const recent: LeadRow[] = leads.slice(0, 25);

  return (
    <div className="max-w-6xl">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-1">
        <div>
          <h1 className="text-3xl font-extrabold">👥 Leads-Dashboard</h1>
          <p className="text-slate-600 text-sm mt-1">Form-Absendungen aus allen Landingpages, Formularen &amp; Lead-Magneten. Read-only, Sales-Übergabe läuft im CRM.</p>
        </div>
        <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
          {RANGES.map((r) => (
            <Link key={r.key} href={`/admin/leads?range=${r.key}`}
              className={`px-3 py-1.5 rounded-md text-sm font-semibold transition ${r.key === range.key ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-800'}`}>
              {r.label}
            </Link>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 my-6">
        <Kpi label="Leads gesamt" value={nf(total)} sub={range.label} accent />
        <Kpi label="Qualifiziert" value={nf(qualified)} sub={`Score ≥ ${QUALIFIED_MIN}`} />
        <Kpi label="Qualifizierungsrate" value={`${qualRate}%`} sub="qualifiziert / gesamt" />
        <Kpi label="Lead-Magnete" value={nf(magnets.length)} sub="PDF-/Checklisten-Opt-ins" />
        <Kpi label="Ø Quality-Score" value={String(avgScore)} sub="0–100" />
      </div>

      <Trend data={trend} />

      <div className="grid md:grid-cols-2 gap-4 mt-4">
        <BarList title="Nach Lead-Quelle" rows={bySource} total={total} hint="lead_source" />
        <BarList title="Nach Seite / Herkunft" rows={byPage} total={total} hint="form_page" />
      </div>

      <div className="grid md:grid-cols-2 gap-4 mt-4">
        <BarList title="Lead-Magnete / Downloads" rows={byMagnet} total={magnets.length} hint="Opt-ins je Magnet" />
        <BarList title="Nach Kanal" rows={byChannel} total={total} hint="utm_source" />
      </div>

      <div className="grid md:grid-cols-2 gap-4 mt-4">
        <BarList title="Top-Städte" rows={byCity} total={total} hint="geo_city" />
        <BarList title="Status" rows={byStatus} total={total} hint="Lead-Status" max={6} />
      </div>

      {/* Tabelle */}
      <div className="mt-6">
        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-3">Letzte Leads ({recent.length})</h2>
        <div className="bg-white rounded-xl border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50/70 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Datum</th>
                <th className="px-3 py-3 text-left font-semibold">Firma / E-Mail</th>
                <th className="px-3 py-3 text-left font-semibold">Quelle</th>
                <th className="px-3 py-3 text-left font-semibold">Seite</th>
                <th className="px-3 py-3 text-left font-semibold">Stadt</th>
                <th className="px-3 py-3 text-right font-semibold">Score</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((l) => (
                <tr key={l.id} className="border-t hover:bg-slate-50">
                  <td className="px-4 py-2.5 text-xs text-slate-500 whitespace-nowrap">{(l.submitted_at || '').slice(0, 10)}</td>
                  <td className="px-3 py-2.5">
                    {l.lead_company && <div className="text-slate-800">{l.lead_company}</div>}
                    <div className="text-xs text-slate-500 font-mono">{l.lead_email || '—'}</div>
                  </td>
                  <td className="px-3 py-2.5 text-xs text-slate-600">{l.lead_source || '—'}</td>
                  <td className="px-3 py-2.5 text-xs text-slate-500 max-w-[180px] truncate" title={l.form_page}>{l.form_page || '—'}</td>
                  <td className="px-3 py-2.5 text-xs text-slate-500">{l.geo_city || '—'}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${isQualified(l) ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'}`}>{l.quality_score || 0}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-slate-400 mt-5">Quelle: <span className="font-mono">marketing_lead_submissions</span> · Zeitfeld <span className="font-mono">submitted_at</span> · {range.key === 'all' ? 'alle' : `letzte ${range.label}`}. Lead-Magnete = Formulare mit Präfix <span className="font-mono">leadmagnet-</span>.</p>
    </div>
  );
}
