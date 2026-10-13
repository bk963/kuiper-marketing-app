import { requireAdmin } from '@/lib/admin-auth';
import { getLeadsBetween, tally, tallyWon, dailyTrend, isQualified, isLeadMagnet, getWonHashes, isWon, QUALIFIED_MIN, type LeadRow } from '@/lib/leads';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

const TZ = 'Europe/Berlin';
const PRESETS: Array<{ key: string; label: string }> = [
  { key: 'today', label: 'Heute' },
  { key: '7', label: '7 Tage' },
  { key: '30', label: '30 Tage' },
  { key: '90', label: '90 Tage' },
  { key: 'all', label: 'Gesamt' },
];

const nf = (n: number) => new Intl.NumberFormat('de-DE').format(Math.round(n));

/** Heutiges Datum in Berlin als YYYY-MM-DD. */
function todayBerlin(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(new Date());
}
/** Wandelt eine Berlin-Wanduhrzeit (Kalendertag + h:m:s) DST-korrekt in eine UTC-Grenze "YYYY-MM-DD HH:MM:SS". */
function berlinWallToUtc(dateStr: string, h: number, mi: number, s: number): string {
  const [y, mo, d] = dateStr.split('-').map(Number);
  const guess = Date.UTC(y, mo - 1, d, h, mi, s);
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  }).formatToParts(guess);
  const g = (t: string) => Number(parts.find((p) => p.type === t)!.value);
  const berlinAsUtc = Date.UTC(g('year'), g('month') - 1, g('day'), g('hour') % 24, g('minute'), g('second'));
  const offset = berlinAsUtc - guess; // Berlin-Offset ggü. UTC
  return new Date(guess - offset).toISOString().replace('T', ' ').slice(0, 19);
}
const berlinDayStart = (d: string) => berlinWallToUtc(d, 0, 0, 0);
const berlinDayEnd = (d: string) => berlinWallToUtc(d, 23, 59, 59);
const fmtDE = (d: string) => { const [y, m, dd] = d.split('-'); return `${dd}.${m}.${y}`; };

/** Löst die Zeitraum-Auswahl (searchParams) in UTC-Grenzen + Anzeige-Metadaten auf. */
function resolveRange(sp: { range?: string; from?: string; to?: string }) {
  const today = todayBerlin();
  const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
  if (sp.range === 'custom' && sp.from && DATE_RE.test(sp.from)) {
    let from = sp.from;
    let to = (sp.to && DATE_RE.test(sp.to)) ? sp.to : from;
    if (from > to) [from, to] = [to, from];
    return { key: 'custom', label: from === to ? fmtDE(from) : `${fmtDE(from)} bis ${fmtDE(to)}`,
      since: berlinDayStart(from), until: berlinDayEnd(to), trendStart: from, trendEnd: to, from, to };
  }
  if (sp.range === 'today') {
    return { key: 'today', label: 'Heute', since: berlinDayStart(today), until: berlinDayEnd(today),
      trendStart: today, trendEnd: today, from: today, to: today };
  }
  const daysMap: Record<string, number | null> = { '7': 7, '30': 30, '90': 90, all: null };
  const key = sp.range && sp.range in daysMap ? sp.range : '30';
  const days = daysMap[key];
  const since = days ? new Date(Date.now() - days * 86400000).toISOString().replace('T', ' ').slice(0, 19) : null;
  const labelMap: Record<string, string> = { '7': '7 Tage', '30': '30 Tage', '90': '90 Tage', all: 'Gesamt' };
  const startDays = days ? days - 1 : 89; // 'Gesamt' → letzte 90 Tage im Verlauf
  const trendStart = new Date(Date.now() - startDays * 86400000).toISOString().slice(0, 10);
  return { key, label: labelMap[key], since, until: null as string | null, trendStart, trendEnd: today,
    from: new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10), to: today };
}

function Kpi({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div className={`rounded-xl border p-4 ${accent ? 'bg-cyan-50 border-cyan-200' : 'bg-white'}`}>
      <div className="text-xs uppercase tracking-wide text-slate-400 font-semibold">{label}</div>
      <div className={`text-2xl font-bold mt-0.5 ${accent ? 'text-cyan-800' : 'text-slate-900'}`}>{value}</div>
      {sub && <div className="text-xs text-slate-500 mt-0.5">{sub}</div>}
    </div>
  );
}

function BarList({ title, rows, total, hint, max = 8 }: { title: string; rows: Array<{ label: string; n: number; won?: number }>; total: number; hint?: string; max?: number }) {
  const top = rows.slice(0, max);
  const peak = Math.max(1, ...top.map((r) => r.n));
  const showWon = top.some((r) => r.won !== undefined);
  return (
    <div className="bg-white rounded-xl border p-5">
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="text-sm font-bold text-slate-700">{title}</h2>
        {hint && <span className="text-xs text-slate-400">{hint}</span>}
      </div>
      {!top.length && <div className="text-sm text-slate-400">Keine Daten im Zeitraum.</div>}
      <div className="space-y-2">
        {top.map((r) => {
          const conv = r.won !== undefined && r.n ? Math.round((r.won / r.n) * 100) : 0;
          return (
          <div key={r.label} className="flex items-center gap-3 text-sm">
            <div className="w-36 sm:w-48 shrink-0 truncate text-slate-700" title={r.label}>{r.label}</div>
            <div className="flex-1 bg-slate-100 rounded-full h-2.5 overflow-hidden relative">
              <div className="h-full bg-cyan-200 rounded-full" style={{ width: `${Math.round((r.n / peak) * 100)}%` }} />
              {showWon && r.won ? <div className="h-full bg-emerald-500 rounded-full absolute top-0 left-0" style={{ width: `${Math.round((r.won / peak) * 100)}%` }} /> : null}
            </div>
            <div className="w-14 shrink-0 text-right tabular-nums font-semibold text-slate-900">{nf(r.n)}</div>
            {showWon
              ? <div className="w-24 shrink-0 text-right tabular-nums text-xs"><span className="text-emerald-700 font-semibold">{nf(r.won || 0)} Kd.</span> <span className="text-slate-400">{conv}%</span></div>
              : <div className="w-12 shrink-0 text-right tabular-nums text-xs text-slate-400">{total ? Math.round((r.n / total) * 100) : 0}%</div>}
          </div>
          );
        })}
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

export default async function LeadsDashboard({ searchParams }: { searchParams: Promise<{ range?: string; from?: string; to?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const range = resolveRange(sp);
  const [leads, wonSet] = await Promise.all([getLeadsBetween(range.since, range.until), getWonHashes()]);

  const total = leads.length;
  const qualified = leads.filter(isQualified).length;
  const magnets = leads.filter(isLeadMagnet);
  const won = leads.filter((l) => isWon(l, wonSet)).length;
  const avgScore = total ? Math.round(leads.reduce((s, l) => s + (l.quality_score || 0), 0) / total) : 0;
  const qualRate = total ? Math.round((qualified / total) * 100) : 0;
  const convRate = total ? Math.round((won / total) * 100) : 0;

  const bySource = tallyWon(leads, 'lead_source', wonSet);
  const byPage = tallyWon(leads, 'form_page', wonSet);
  const byChannel = tally(leads, 'utm_source');
  const byStatus = tally(leads, 'status');
  const byCity = tally(leads.filter((l) => l.geo_city), 'geo_city', '(unbekannt)');
  const byMagnet = tally(magnets, 'lead_source');
  const trend = dailyTrend(leads, range.trendStart, range.trendEnd);

  const recent: LeadRow[] = leads.slice(0, 25);

  return (
    <div className="max-w-6xl">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-1">
        <div>
          <h1 className="text-3xl font-extrabold">👥 Leads-Dashboard</h1>
          <p className="text-slate-600 text-sm mt-1">Form-Absendungen aus allen Landingpages, Formularen &amp; Lead-Magneten. Read-only, Sales-Übergabe läuft im CRM.</p>
        </div>
        <div className="flex flex-col items-start md:items-end gap-2">
          <div className="flex flex-wrap gap-1 bg-slate-100 rounded-lg p-1">
            {PRESETS.map((r) => (
              <Link key={r.key} href={`/admin/leads?range=${r.key}`}
                className={`px-3 py-1.5 rounded-md text-sm font-semibold transition ${r.key === range.key ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-800'}`}>
                {r.label}
              </Link>
            ))}
          </div>
          <form method="get" action="/admin/leads"
            className={`flex flex-wrap items-center gap-2 rounded-lg p-1.5 ${range.key === 'custom' ? 'bg-cyan-50 ring-1 ring-cyan-200' : 'bg-slate-50'}`}>
            <input type="hidden" name="range" value="custom" />
            <span className="text-xs font-semibold text-slate-500 pl-1">Zeitraum</span>
            <input type="date" name="from" defaultValue={range.from} max={todayBerlin()}
              className="text-sm border rounded-md px-2 py-1 text-slate-700 bg-white" />
            <span className="text-xs text-slate-400">bis</span>
            <input type="date" name="to" defaultValue={range.to} max={todayBerlin()}
              className="text-sm border rounded-md px-2 py-1 text-slate-700 bg-white" />
            <button type="submit" className="text-sm font-semibold px-3 py-1 rounded-md bg-cyan-500 text-white hover:bg-cyan-600 transition">Anwenden</button>
          </form>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 my-6">
        <Kpi label="Leads gesamt" value={nf(total)} sub={range.label} accent />
        <Kpi label="Kunden geworden" value={nf(won)} sub="aus easybill (gematcht)" accent />
        <Kpi label="Lead→Kunde" value={`${convRate}%`} sub="Kunden / Leads" />
        <Kpi label="Qualifiziert" value={nf(qualified)} sub={`Score ≥ ${QUALIFIED_MIN} · ${qualRate}%`} />
        <Kpi label="Lead-Magnete" value={nf(magnets.length)} sub="Opt-ins" />
        <Kpi label="Ø Quality-Score" value={String(avgScore)} sub="0–100" />
      </div>

      <Trend data={trend} />

      <p className="text-xs text-slate-500 mt-4 mb-1">Balken: <span className="text-cyan-600 font-semibold">Leads</span> · <span className="text-emerald-600 font-semibold">davon Kunden</span> (easybill-Match). So siehst du, welche Quelle/Seite wirklich <b>Kunden</b> bringt, nicht nur Leads.</p>
      <div className="grid md:grid-cols-2 gap-4">
        <BarList title="Nach Lead-Quelle" rows={bySource} total={total} hint="Leads · Kunden" />
        <BarList title="Nach Seite / Herkunft" rows={byPage} total={total} hint="Leads · Kunden" />
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
                <th className="px-3 py-3 text-center font-semibold">Kunde</th>
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
                  <td className="px-3 py-2.5 text-center">{isWon(l, wonSet) ? <span className="text-emerald-600 font-bold" title="ist easybill-Kunde">✓</span> : <span className="text-slate-300">—</span>}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${isQualified(l) ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'}`}>{l.quality_score || 0}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-slate-400 mt-5">Quelle: <span className="font-mono">marketing_lead_submissions</span> · Zeitfeld <span className="font-mono">submitted_at</span> (Europe/Berlin) · Zeitraum: {range.label}. Lead-Magnete = Formulare mit Präfix <span className="font-mono">leadmagnet-</span>.</p>
    </div>
  );
}
