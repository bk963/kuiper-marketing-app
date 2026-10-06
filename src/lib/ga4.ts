/**
 * GA4 Data API Wrapper
 *
 * ENV nötig:
 *   GA4_PROPERTY_ID — numerische Property-ID (z.B. 312345678), NICHT die G-YV...-Measurement-ID
 *   GOOGLE_SERVICE_ACCOUNT_JSON — kompletter JSON-Inhalt der SA-Datei (single-line)
 *     ODER GOOGLE_APPLICATION_CREDENTIALS — Pfad zur SA-Datei
 *
 * Service-Account muss "Viewer"-Rolle auf der GA4-Property haben.
 * (Mailbrain-Harvester SA `id-mailbrain-harvester@kuiper-mailbrain.iam.gserviceaccount.com`
 *  ist laut MEMORY GA-Admin → in GA4-Property als Viewer hinzufügen reicht.)
 */
import { BetaAnalyticsDataClient } from '@google-analytics/data';

let _client: BetaAnalyticsDataClient | null = null;

export function getGa4Client(): BetaAnalyticsDataClient | null {
  if (_client) return _client;
  try {
    // Akzeptiert: GOOGLE_SERVICE_ACCOUNT_JSON_B64 (base64) ODER GOOGLE_SERVICE_ACCOUNT_JSON (plain) ODER GOOGLE_APPLICATION_CREDENTIALS (file)
    const b64 = process.env.GOOGLE_SERVICE_ACCOUNT_JSON_B64;
    const plain = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
    if (b64) {
      _client = new BetaAnalyticsDataClient({ credentials: JSON.parse(Buffer.from(b64, 'base64').toString('utf8')) });
    } else if (plain) {
      _client = new BetaAnalyticsDataClient({ credentials: JSON.parse(plain) });
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      _client = new BetaAnalyticsDataClient();
    } else {
      return null;
    }
    return _client;
  } catch (e) {
    console.error('[ga4] init failed', e);
    return null;
  }
}

export function getPropertyName(): string | null {
  const id = process.env.GA4_PROPERTY_ID;
  return id ? `properties/${id}` : null;
}

export type Ga4OverviewRow = { dimension: string; sessions: number; users: number; pageviews: number; bounceRate: number; engagementRate: number };

export async function ga4Overview(days = 7): Promise<{ rows: Ga4OverviewRow[]; total: Omit<Ga4OverviewRow, 'dimension'>; error?: string } | null> {
  const client = getGa4Client();
  const property = getPropertyName();
  if (!client || !property) return null;

  try {
    const [resp] = await client.runReport({
      property,
      dateRanges: [{ startDate: `${days}daysAgo`, endDate: 'today' }],
      dimensions: [{ name: 'date' }],
      metrics: [
        { name: 'sessions' },
        { name: 'totalUsers' },
        { name: 'screenPageViews' },
        { name: 'bounceRate' },
        { name: 'engagementRate' },
      ],
      orderBys: [{ dimension: { dimensionName: 'date' } }],
    });
    const rows: Ga4OverviewRow[] = (resp.rows || []).map((r) => ({
      dimension: r.dimensionValues?.[0]?.value || '',
      sessions: Number(r.metricValues?.[0]?.value || 0),
      users: Number(r.metricValues?.[1]?.value || 0),
      pageviews: Number(r.metricValues?.[2]?.value || 0),
      bounceRate: Number(r.metricValues?.[3]?.value || 0),
      engagementRate: Number(r.metricValues?.[4]?.value || 0),
    }));
    const total = rows.reduce(
      (acc, r) => ({
        sessions: acc.sessions + r.sessions,
        users: acc.users + r.users,
        pageviews: acc.pageviews + r.pageviews,
        bounceRate: r.bounceRate, // letzter Tag als Repräsentant
        engagementRate: r.engagementRate,
      }),
      { sessions: 0, users: 0, pageviews: 0, bounceRate: 0, engagementRate: 0 },
    );
    return { rows, total };
  } catch (e: any) {
    return { rows: [], total: { sessions: 0, users: 0, pageviews: 0, bounceRate: 0, engagementRate: 0 }, error: e?.message?.slice(0, 200) || 'GA4 error' };
  }
}

export async function ga4Channels(days = 7) {
  const client = getGa4Client();
  const property = getPropertyName();
  if (!client || !property) return null;
  try {
    const [resp] = await client.runReport({
      property,
      dateRanges: [{ startDate: `${days}daysAgo`, endDate: 'today' }],
      dimensions: [{ name: 'sessionDefaultChannelGroup' }],
      metrics: [{ name: 'sessions' }, { name: 'totalUsers' }, { name: 'conversions' }],
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      limit: 10,
    });
    return (resp.rows || []).map((r) => ({
      channel: r.dimensionValues?.[0]?.value || 'unknown',
      sessions: Number(r.metricValues?.[0]?.value || 0),
      users: Number(r.metricValues?.[1]?.value || 0),
      conversions: Number(r.metricValues?.[2]?.value || 0),
    }));
  } catch { return []; }
}

export async function ga4TopPages(days = 7, limit = 20) {
  const client = getGa4Client();
  const property = getPropertyName();
  if (!client || !property) return null;
  try {
    const [resp] = await client.runReport({
      property,
      dateRanges: [{ startDate: `${days}daysAgo`, endDate: 'today' }],
      dimensions: [{ name: 'pagePath' }, { name: 'pageTitle' }],
      metrics: [{ name: 'screenPageViews' }, { name: 'totalUsers' }, { name: 'averageSessionDuration' }],
      orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
      limit,
    });
    return (resp.rows || []).map((r) => ({
      path: r.dimensionValues?.[0]?.value || '',
      title: r.dimensionValues?.[1]?.value || '',
      pageviews: Number(r.metricValues?.[0]?.value || 0),
      users: Number(r.metricValues?.[1]?.value || 0),
      avgDuration: Number(r.metricValues?.[2]?.value || 0),
    }));
  } catch { return []; }
}

export async function ga4Devices(days = 7) {
  const client = getGa4Client();
  const property = getPropertyName();
  if (!client || !property) return null;
  try {
    const [resp] = await client.runReport({
      property,
      dateRanges: [{ startDate: `${days}daysAgo`, endDate: 'today' }],
      dimensions: [{ name: 'deviceCategory' }],
      metrics: [{ name: 'sessions' }],
    });
    return (resp.rows || []).map((r) => ({
      device: r.dimensionValues?.[0]?.value || 'unknown',
      sessions: Number(r.metricValues?.[0]?.value || 0),
    }));
  } catch { return []; }
}

export async function ga4Countries(days = 7, limit = 10) {
  const client = getGa4Client();
  const property = getPropertyName();
  if (!client || !property) return null;
  try {
    const [resp] = await client.runReport({
      property,
      dateRanges: [{ startDate: `${days}daysAgo`, endDate: 'today' }],
      dimensions: [{ name: 'country' }],
      metrics: [{ name: 'sessions' }],
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      limit,
    });
    return (resp.rows || []).map((r) => ({
      country: r.dimensionValues?.[0]?.value || 'unknown',
      sessions: Number(r.metricValues?.[0]?.value || 0),
    }));
  } catch { return []; }
}

/* ── Phase 2: Tiefen-Dimensionen ─────────────────────────────────────── */
const _range = (days: number) => [{ startDate: `${days}daysAgo`, endDate: 'today' }];

/** Quelle/Medium: woher kommt der Traffic (sessionSourceMedium). */
export async function ga4SourceMedium(days = 7, limit = 20) {
  const client = getGa4Client(); const property = getPropertyName();
  if (!client || !property) return null;
  try {
    const [resp] = await client.runReport({
      property, dateRanges: _range(days),
      dimensions: [{ name: 'sessionSourceMedium' }],
      metrics: [{ name: 'sessions' }, { name: 'totalUsers' }, { name: 'conversions' }, { name: 'engagementRate' }],
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }], limit,
    });
    return (resp.rows || []).map((r) => ({
      sourceMedium: r.dimensionValues?.[0]?.value || '(not set)',
      sessions: Number(r.metricValues?.[0]?.value || 0),
      users: Number(r.metricValues?.[1]?.value || 0),
      conversions: Number(r.metricValues?.[2]?.value || 0),
      engagementRate: Number(r.metricValues?.[3]?.value || 0),
    }));
  } catch { return []; }
}

/** Landingpages: Einstiegsseiten mit Conversions/Bounce. */
export async function ga4LandingPages(days = 7, limit = 25) {
  const client = getGa4Client(); const property = getPropertyName();
  if (!client || !property) return null;
  try {
    const [resp] = await client.runReport({
      property, dateRanges: _range(days),
      dimensions: [{ name: 'landingPagePlusQueryString' }],
      metrics: [{ name: 'sessions' }, { name: 'conversions' }, { name: 'bounceRate' }, { name: 'averageSessionDuration' }],
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }], limit,
    });
    return (resp.rows || []).map((r) => ({
      landing: r.dimensionValues?.[0]?.value || '(not set)',
      sessions: Number(r.metricValues?.[0]?.value || 0),
      conversions: Number(r.metricValues?.[1]?.value || 0),
      bounceRate: Number(r.metricValues?.[2]?.value || 0),
      avgDuration: Number(r.metricValues?.[3]?.value || 0),
    }));
  } catch { return []; }
}

/** Top-Events (eventName → eventCount), inkl. Key-Event-Markierung. */
export async function ga4Events(days = 7, limit = 25) {
  const client = getGa4Client(); const property = getPropertyName();
  if (!client || !property) return null;
  try {
    const [resp] = await client.runReport({
      property, dateRanges: _range(days),
      dimensions: [{ name: 'eventName' }, { name: 'isKeyEvent' }],
      metrics: [{ name: 'eventCount' }, { name: 'totalUsers' }],
      orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }], limit,
    });
    return (resp.rows || []).map((r) => ({
      event: r.dimensionValues?.[0]?.value || '',
      keyEvent: (r.dimensionValues?.[1]?.value || '').toLowerCase() === 'true',
      count: Number(r.metricValues?.[0]?.value || 0),
      users: Number(r.metricValues?.[1]?.value || 0),
    }));
  } catch { return []; }
}

/** Neu vs. Wiederkehrend. */
export async function ga4NewReturning(days = 7) {
  const client = getGa4Client(); const property = getPropertyName();
  if (!client || !property) return null;
  try {
    const [resp] = await client.runReport({
      property, dateRanges: _range(days),
      dimensions: [{ name: 'newVsReturning' }],
      metrics: [{ name: 'sessions' }, { name: 'totalUsers' }],
    });
    return (resp.rows || []).map((r) => ({
      type: r.dimensionValues?.[0]?.value || '(unknown)',
      sessions: Number(r.metricValues?.[0]?.value || 0),
      users: Number(r.metricValues?.[1]?.value || 0),
    }));
  } catch { return []; }
}

/** Top-Städte. */
export async function ga4Cities(days = 7, limit = 15) {
  const client = getGa4Client(); const property = getPropertyName();
  if (!client || !property) return null;
  try {
    const [resp] = await client.runReport({
      property, dateRanges: _range(days),
      dimensions: [{ name: 'city' }],
      metrics: [{ name: 'sessions' }, { name: 'conversions' }],
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }], limit,
    });
    return (resp.rows || []).map((r) => ({
      city: r.dimensionValues?.[0]?.value || '(not set)',
      sessions: Number(r.metricValues?.[0]?.value || 0),
      conversions: Number(r.metricValues?.[1]?.value || 0),
    }));
  } catch { return []; }
}

/** Browser-Verteilung. */
export async function ga4Browsers(days = 7, limit = 10) {
  const client = getGa4Client(); const property = getPropertyName();
  if (!client || !property) return null;
  try {
    const [resp] = await client.runReport({
      property, dateRanges: _range(days),
      dimensions: [{ name: 'browser' }],
      metrics: [{ name: 'sessions' }],
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }], limit,
    });
    return (resp.rows || []).map((r) => ({
      browser: r.dimensionValues?.[0]?.value || 'unknown',
      sessions: Number(r.metricValues?.[0]?.value || 0),
    }));
  } catch { return []; }
}
