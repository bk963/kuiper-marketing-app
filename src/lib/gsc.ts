/**
 * Google Search Console API Wrapper
 *
 * ENV: GOOGLE_SERVICE_ACCOUNT_JSON
 * Service-Account muss als "Limited User" in der GSC-Property hinzugefügt sein.
 */
import { google } from 'googleapis';

let _gsc: any = null;

function getClient() {
  if (_gsc) return _gsc;
  try {
    const json = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
    if (!json) return null;
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(json),
      scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
    });
    _gsc = google.searchconsole({ version: 'v1', auth: auth as any });
    return _gsc;
  } catch { return null; }
}

const SITE = process.env.GSC_SITE_URL || 'sc-domain:kuiper-safety.de';

export async function gscSiteOverview(days = 28) {
  const gsc = getClient();
  if (!gsc) return null;
  const start = new Date(Date.now() - days * 86400_000).toISOString().slice(0, 10);
  const end = new Date(Date.now() - 2 * 86400_000).toISOString().slice(0, 10); // GSC hat 2 Tage Lag

  try {
    const resp = await gsc.searchanalytics.query({
      siteUrl: SITE,
      requestBody: {
        startDate: start,
        endDate: end,
        dimensions: ['date'],
        rowLimit: days + 5,
      },
    });
    const rows = (resp.data.rows || []).map((r: any) => ({
      date: r.keys?.[0] || '',
      clicks: r.clicks || 0,
      impressions: r.impressions || 0,
      ctr: r.ctr || 0,
      position: r.position || 0,
    }));
    const total = rows.reduce(
      (acc, r) => ({
        clicks: acc.clicks + r.clicks,
        impressions: acc.impressions + r.impressions,
        ctr: r.ctr,
        position: r.position,
      }),
      { clicks: 0, impressions: 0, ctr: 0, position: 0 },
    );
    return { rows, total };
  } catch (e: any) {
    return { rows: [], total: { clicks: 0, impressions: 0, ctr: 0, position: 0 }, error: e?.message?.slice(0, 200) };
  }
}

export async function gscTopQueries(days = 28, limit = 50) {
  const gsc = getClient();
  if (!gsc) return null;
  const start = new Date(Date.now() - days * 86400_000).toISOString().slice(0, 10);
  const end = new Date(Date.now() - 2 * 86400_000).toISOString().slice(0, 10);
  try {
    const resp = await gsc.searchanalytics.query({
      siteUrl: SITE,
      requestBody: { startDate: start, endDate: end, dimensions: ['query'], rowLimit: limit },
    });
    return (resp.data.rows || []).map((r: any) => ({
      query: r.keys?.[0] || '',
      clicks: r.clicks || 0,
      impressions: r.impressions || 0,
      ctr: r.ctr || 0,
      position: r.position || 0,
    }));
  } catch { return []; }
}

export async function gscTopPages(days = 28, limit = 50) {
  const gsc = getClient();
  if (!gsc) return null;
  const start = new Date(Date.now() - days * 86400_000).toISOString().slice(0, 10);
  const end = new Date(Date.now() - 2 * 86400_000).toISOString().slice(0, 10);
  try {
    const resp = await gsc.searchanalytics.query({
      siteUrl: SITE,
      requestBody: { startDate: start, endDate: end, dimensions: ['page'], rowLimit: limit },
    });
    return (resp.data.rows || []).map((r: any) => ({
      page: r.keys?.[0] || '',
      clicks: r.clicks || 0,
      impressions: r.impressions || 0,
      ctr: r.ctr || 0,
      position: r.position || 0,
    }));
  } catch { return []; }
}
