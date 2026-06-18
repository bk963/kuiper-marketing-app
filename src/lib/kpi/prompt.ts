/**
 * Prompt-Layer — wandelt eine natürlichsprachige Frage in eine QuerySpec.
 *
 * Läuft gegen GEX44-Ollama (qwen2.5) ON-PREMISE — DSGVO: Marketing-/Lead-Daten
 * verlassen nie das Haus. Das LLM sieht NUR die Frage + das Schema, NIE Kundendaten.
 *
 * ENV (in Coolify setzen):
 *   GEX44_URL   = https://gex44.kuiper-safety.de
 *   GEX44_USER  = bjoern
 *   GEX44_PASS  = ********
 *   GEX44_MODEL = qwen2.5:32b   (optional, Default 32b; 14b für mehr Speed)
 */
import type { QuerySpec, KpiMetric, KpiDimension, KpiChannel } from './types';
import { METRIC_LABEL } from './types';

const METRICS: KpiMetric[] = [
  'qualified_leads', 'leads', 'submit_to_qualified_rate', 'avg_quality_score', 'revenue', 'won_deals',
  'cost', 'conversions', 'cpa', 'cpa_qualified', 'clicks', 'impressions', 'ctr', 'cpc', 'roas', 'conversion_value',
  'sessions', 'users', 'gsc_clicks', 'gsc_impressions', 'gsc_position',
];
const DIMENSIONS: KpiDimension[] = ['none', 'city', 'channel', 'campaign', 'day', 'course'];
const CHANNELS: KpiChannel[] = ['google', 'bing', 'organic', 'direct', 'meta', 'other'];

function systemPrompt(): string {
  const metricLines = METRICS.map((m) => `  "${m}" = ${METRIC_LABEL[m]}`).join('\n');
  return `Du bist der Query-Builder eines Marketing-KPI-Dashboards für ein deutsches Brandschutz-Unternehmen (Kuiper Safety, Brandschutzhelfer-Ausbildung).
Wandle die Frage des Nutzers in KPI-Abfragen um. Antworte AUSSCHLIESSLICH mit einem JSON-Objekt der Form:
{"queries": [ <eine Spec je Kennzahl> ]}
kein Text drumherum.

ANZAHL KENNZAHLEN (WICHTIG):
- "queries" ist IMMER ein Array.
- EINE Kennzahl gefragt → genau EIN Objekt im Array.
- MEHRERE Kennzahlen in einer Frage (z.B. „Leads und CPL", „Klicks, CTR und Kosten", „wie laufen Google und Bing") → MEHRERE Objekte, ein Objekt je Kennzahl. Gemeinsame Filter (Zeitraum, Stadt, Kanal, Kampagne) in JEDES Objekt kopieren.

FELDER je Spec im Array:
- metric (PFLICHT, einer dieser Werte):
${metricLines}
- dimension (optional): ${DIMENSIONS.join(' | ')}   // Aufschlüsselung; "none" wenn eine einzelne Zahl gefragt ist
- city (optional): Stadtname, z.B. "Köln"          // nur bei Stadt-Bezug
- channel (optional): ${CHANNELS.join(' | ')}        // google=Google Ads, bing=Microsoft Ads, organic=SEO
- campaign (optional): Teil eines Kampagnennamens, z.B. "NRW"
- course (optional): Kurs-Interesse, z.B. "Brandschutzhelfer"
- days (optional, Zahl): relativer Zeitraum in Tagen (Default 30). "letzte Woche"=7, "letzter Monat"=30, "Quartal"=90, "Jahr"=365
- title (optional): kurzer deutscher Kachel-Titel

REGELN:
- "Conversions" aus Werbe-Kontext → metric "conversions"; "Leads"/"Anfragen" → "leads"; "qualifizierte Leads"/"gute Leads" → "qualified_leads".
- "Kosten"/"Ausgaben"/"Spend"/"Budget verbraucht" → "cost". "Kosten pro Lead"/"CPL"/"CPA" → "cpa_qualified".
- "Umsatz" → "revenue". "ROAS" → "roas". "Klickrate" → "ctr". "Klickpreis" → "cpc".
- Stadt erwähnt ("in Köln") → city setzen. Aufschlüsselung erwünscht ("pro Stadt", "je Kanal", "nach Kampagne", "Verlauf"/"pro Tag") → dimension setzen.
- Nenne keine Felder, die nicht gebraucht werden.

BEISPIELE:
Frage: "Wie hoch waren die Conversions der letzten 30 Tage in Köln?"
JSON: {"queries":[{"metric":"conversions","city":"Köln","days":30,"title":"Conversions Köln · 30 Tage"}]}

Frage: "Qualifizierte Leads pro Stadt diesen Monat"
JSON: {"queries":[{"metric":"qualified_leads","dimension":"city","days":30,"title":"Qualifizierte Leads je Stadt"}]}

Frage: "Was haben wir letzte Woche bei Google ausgegeben?"
JSON: {"queries":[{"metric":"cost","channel":"google","days":7,"title":"Google-Spend · 7 Tage"}]}

Frage: "Lead-Verlauf der letzten 90 Tage"
JSON: {"queries":[{"metric":"leads","dimension":"day","days":90,"title":"Lead-Verlauf · 90 Tage"}]}

Frage: "Leads und Kosten pro Lead letzte 7 Tage"
JSON: {"queries":[{"metric":"leads","days":7,"title":"Leads · 7 Tage"},{"metric":"cpa_qualified","days":7,"title":"CPL · 7 Tage"}]}

Frage: "Klicks, CTR und Kosten bei Google diese Woche"
JSON: {"queries":[{"metric":"clicks","channel":"google","days":7,"title":"Klicks · 7 Tage"},{"metric":"ctr","channel":"google","days":7,"title":"CTR · 7 Tage"},{"metric":"cost","channel":"google","days":7,"title":"Kosten · 7 Tage"}]}

Frage: "Google vs Bing Kosten und Klicks diese Woche"
JSON: {"queries":[{"metric":"cost","channel":"google","days":7,"title":"Google-Kosten · 7 Tage"},{"metric":"clicks","channel":"google","days":7,"title":"Google-Klicks · 7 Tage"},{"metric":"cost","channel":"bing","days":7,"title":"Bing-Kosten · 7 Tage"},{"metric":"clicks","channel":"bing","days":7,"title":"Bing-Klicks · 7 Tage"}]}`;
}

export interface PromptResult {
  ok: boolean;
  spec?: QuerySpec;
  raw?: string;
  error?: string;
}

/** Validiert + säubert die LLM-Ausgabe zu einer sicheren QuerySpec. */
function sanitize(obj: any): QuerySpec | null {
  if (!obj || typeof obj !== 'object') return null;
  const metric = obj.metric;
  if (!METRICS.includes(metric)) return null;
  const spec: QuerySpec = { metric };
  if (DIMENSIONS.includes(obj.dimension) && obj.dimension !== 'none') spec.dimension = obj.dimension;
  if (typeof obj.city === 'string' && obj.city.trim()) spec.city = obj.city.trim().slice(0, 60);
  if (CHANNELS.includes(obj.channel)) spec.channel = obj.channel;
  if (typeof obj.campaign === 'string' && obj.campaign.trim()) spec.campaign = obj.campaign.trim().slice(0, 80);
  if (typeof obj.course === 'string' && obj.course.trim()) spec.course = obj.course.trim().slice(0, 60);
  const days = Number(obj.days);
  if (Number.isFinite(days) && days > 0 && days <= 730) spec.days = Math.round(days);
  if (typeof obj.title === 'string' && obj.title.trim()) spec.title = obj.title.trim().slice(0, 80);
  return spec;
}

/** Max. Anzahl Kennzahlen pro Multi-Frage (verhindert Kachel-Flut). */
const MAX_SPECS = 6;

export interface PromptMultiResult {
  ok: boolean;
  specs?: QuerySpec[];
  raw?: string;
  error?: string;
}

/** Roh-Antwort von GEX44 holen (gemeinsamer Pfad für Single + Multi). */
async function askGex44(question: string): Promise<{ ok: boolean; raw?: string; error?: string }> {
  const url = process.env.GEX44_URL || 'https://gex44.kuiper-safety.de';
  const user = process.env.GEX44_USER || '';
  const pass = process.env.GEX44_PASS || '';
  const model = process.env.GEX44_MODEL || 'qwen2.5:32b';
  if (!user || !pass) return { ok: false, error: 'GEX44-Zugang nicht konfiguriert (GEX44_USER/PASS).' };

  const auth = 'Basic ' + Buffer.from(`${user}:${pass}`).toString('base64');
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 30000);
    const r = await fetch(`${url}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: auth },
      body: JSON.stringify({
        model, format: 'json', stream: false,
        options: { temperature: 0 },
        system: systemPrompt(),
        prompt: question.slice(0, 500),
      }),
      signal: ctrl.signal,
      cache: 'no-store',
    });
    clearTimeout(t);
    if (!r.ok) return { ok: false, error: `GEX44 HTTP ${r.status}` };
    const d = await r.json();
    return { ok: true, raw: String(d.response || '') };
  } catch (e: any) {
    return { ok: false, error: e?.name === 'AbortError' ? 'GEX44 Timeout (30s)' : (e?.message?.slice(0, 160) || 'GEX44-Fehler') };
  }
}

/** Parst die LLM-Antwort zu einer oder mehreren Specs (Array, {queries:[]} oder Einzelobjekt). */
function parseSpecs(parsed: any): QuerySpec[] {
  const arr = Array.isArray(parsed) ? parsed
    : Array.isArray(parsed?.queries) ? parsed.queries
    : [parsed];
  const specs: QuerySpec[] = [];
  for (const o of arr) {
    const s = sanitize(o);
    if (s) specs.push(s);
    if (specs.length >= MAX_SPECS) break;
  }
  return specs;
}

/** Multi-Metrik: NL-Frage → 1..n QuerySpecs. */
export async function questionToSpecs(question: string): Promise<PromptMultiResult> {
  const g = await askGex44(question);
  if (!g.ok) return { ok: false, error: g.error };
  const raw = g.raw || '';
  let parsed: any;
  try { parsed = JSON.parse(raw); } catch { return { ok: false, raw, error: 'LLM-Antwort war kein gültiges JSON.' }; }
  const specs = parseSpecs(parsed);
  if (!specs.length) return { ok: false, raw, error: 'Frage nicht verstanden — bitte konkreter (z.B. „qualifizierte Leads in Köln letzte 30 Tage").' };
  return { ok: true, specs, raw };
}

/** Single-Metrik (Rückwärtskompatibel): gibt die erste Spec zurück. */
export async function questionToSpec(question: string): Promise<PromptResult> {
  const m = await questionToSpecs(question);
  if (!m.ok || !m.specs?.length) return { ok: false, raw: m.raw, error: m.error };
  return { ok: true, spec: m.specs[0], raw: m.raw };
}
