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
    const b64 = process.env.GOOGLE_SERVICE_ACCOUNT_JSON_B64;
    const plain = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
    const credentials = b64 ? JSON.parse(Buffer.from(b64, 'base64').toString('utf8')) : (plain ? JSON.parse(plain) : null);
    if (!credentials) return null;
    const auth = new google.auth.GoogleAuth({
      credentials,
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

/* ── Phase 3: SEO-Tiefe ──────────────────────────────────────────────── */
// GSC-Zeitraum (2 Tage Lag); offsetDays verschiebt den Bereich nach hinten (für Vorperioden-Vergleich).
function gscDates(days: number, offsetDays = 0) {
  const end = new Date(Date.now() - (2 + offsetDays) * 86400_000).toISOString().slice(0, 10);
  const start = new Date(Date.now() - (2 + offsetDays + days) * 86400_000).toISOString().slice(0, 10);
  return { start, end };
}

/** Unsere echten Rankings aus GSC als Map keyword(lowercase)→Position. Für Gegencheck gegen DataForSEO-"Lücken". */
export async function gscRankedQueries(days = 90, limit = 2000): Promise<Map<string, number>> {
  const gsc = getClient();
  const m = new Map<string, number>();
  if (!gsc) return m;
  const { start, end } = gscDates(days);
  try {
    const resp = await gsc.searchanalytics.query({
      siteUrl: SITE, requestBody: { startDate: start, endDate: end, dimensions: ['query'], rowLimit: limit },
    });
    for (const r of (resp.data.rows || [])) {
      const q = (r.keys?.[0] || '').toLowerCase();
      if (q) m.set(q, r.position || 999);
    }
  } catch { /* leer */ }
  return m;
}

export async function gscByCountry(days = 28, limit = 15) {
  const gsc = getClient(); if (!gsc) return [];
  const { start, end } = gscDates(days);
  try {
    const resp = await gsc.searchanalytics.query({
      siteUrl: SITE, requestBody: { startDate: start, endDate: end, dimensions: ['country'], rowLimit: limit },
    });
    return (resp.data.rows || []).map((r: any) => ({
      country: (r.keys?.[0] || '').toUpperCase(),
      clicks: r.clicks || 0, impressions: r.impressions || 0, ctr: r.ctr || 0, position: r.position || 0,
    }));
  } catch { return []; }
}

export async function gscByDevice(days = 28) {
  const gsc = getClient(); if (!gsc) return [];
  const { start, end } = gscDates(days);
  try {
    const resp = await gsc.searchanalytics.query({
      siteUrl: SITE, requestBody: { startDate: start, endDate: end, dimensions: ['device'], rowLimit: 5 },
    });
    return (resp.data.rows || []).map((r: any) => ({
      device: r.keys?.[0] || '', clicks: r.clicks || 0, impressions: r.impressions || 0, ctr: r.ctr || 0, position: r.position || 0,
    }));
  } catch { return []; }
}

/** Query×Seite: welche Seite rankt für welche Suche (konkrete Optimierungs-Paare). */
export async function gscQueryPage(days = 28, limit = 50) {
  const gsc = getClient(); if (!gsc) return [];
  const { start, end } = gscDates(days);
  try {
    const resp = await gsc.searchanalytics.query({
      siteUrl: SITE, requestBody: { startDate: start, endDate: end, dimensions: ['query', 'page'], rowLimit: limit },
    });
    return (resp.data.rows || []).map((r: any) => ({
      query: r.keys?.[0] || '', page: r.keys?.[1] || '',
      clicks: r.clicks || 0, impressions: r.impressions || 0, ctr: r.ctr || 0, position: r.position || 0,
    }));
  } catch { return []; }
}

/** Gewinner/Verlierer: Queries mit größter Klick-Veränderung ggü. Vorperiode (gleiche Länge). */
export async function gscMovers(days = 28, limit = 12) {
  const gsc = getClient(); if (!gsc) return { gainers: [], losers: [] };
  const cur = gscDates(days);
  const prev = gscDates(days, days);
  try {
    const q = (s: string, e: string) => gsc.searchanalytics.query({
      siteUrl: SITE, requestBody: { startDate: s, endDate: e, dimensions: ['query'], rowLimit: 1000 },
    });
    const [rc, rp] = await Promise.all([q(cur.start, cur.end), q(prev.start, prev.end)]);
    const prevMap = new Map<string, any>();
    for (const r of (rp.data.rows || [])) prevMap.set(r.keys?.[0] || '', r);
    const merged = (rc.data.rows || []).map((r: any) => {
      const k = r.keys?.[0] || ''; const p = prevMap.get(k);
      return {
        query: k, clicks: r.clicks || 0, prevClicks: p?.clicks || 0, deltaClicks: (r.clicks || 0) - (p?.clicks || 0),
        position: r.position || 0, prevPosition: p?.position || 0, deltaPosition: (p?.position || 0) - (r.position || 0), // positiv = besser (kleinere Position)
      };
    });
    const gainers = [...merged].sort((a, b) => b.deltaClicks - a.deltaClicks).slice(0, limit).filter((x) => x.deltaClicks > 0);
    const losers = [...merged].sort((a, b) => a.deltaClicks - b.deltaClicks).slice(0, limit).filter((x) => x.deltaClicks < 0);
    return { gainers, losers };
  } catch { return { gainers: [], losers: [] }; }
}
