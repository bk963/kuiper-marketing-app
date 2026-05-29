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
    const json = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
    if (json) {
      _client = new BetaAnalyticsDataClient({ credentials: JSON.parse(json) });
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
