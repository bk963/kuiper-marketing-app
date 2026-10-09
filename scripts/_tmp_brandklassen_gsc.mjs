// TEMP read-only GSC check for keyword "brandklassen"
import fs from 'node:fs';
import { google } from 'googleapis';

// load .env.local
const env = fs.readFileSync(new URL('../.env.local', import.meta.url), 'utf8');
for (const line of env.split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) process.env[m[1]] = m[2].replace(/^"|"$/g, '');
}

const b64 = process.env.GOOGLE_SERVICE_ACCOUNT_JSON_B64;
const credentials = JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));
const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
});
const gsc = google.searchconsole({ version: 'v1', auth });
const SITE = process.env.GSC_SITE_URL || 'sc-domain:kuiper-safety.de';
console.log('SITE:', SITE);

const end = new Date(Date.now() - 2 * 86400_000).toISOString().slice(0, 10);
const start = new Date(Date.now() - 90 * 86400_000).toISOString().slice(0, 10);
console.log('Range:', start, '->', end);

// 1) all queries containing "brandklass"
const q = await gsc.searchanalytics.query({
  siteUrl: SITE,
  requestBody: {
    startDate: start, endDate: end,
    dimensions: ['query'],
    dimensionFilterGroups: [{ filters: [{ dimension: 'query', operator: 'contains', expression: 'brandklass' }] }],
    rowLimit: 100,
  },
});
console.log('\n=== QUERIES containing "brandklass" (90d) ===');
for (const r of (q.data.rows || [])) {
  console.log(`${(r.keys[0]).padEnd(45)} clicks=${r.clicks}\timpr=${r.impressions}\tctr=${(r.ctr*100).toFixed(1)}%\tpos=${r.position.toFixed(1)}`);
}

// 2) pages ranking for brandklass queries (query+page)
const qp = await gsc.searchanalytics.query({
  siteUrl: SITE,
  requestBody: {
    startDate: start, endDate: end,
    dimensions: ['page', 'query'],
    dimensionFilterGroups: [{ filters: [{ dimension: 'query', operator: 'contains', expression: 'brandklass' }] }],
    rowLimit: 100,
  },
});
console.log('\n=== PAGE x QUERY for "brandklass" (90d) ===');
for (const r of (qp.data.rows || [])) {
  console.log(`pos=${r.position.toFixed(1)}\tcl=${r.clicks}\timp=${r.impressions}\t${r.keys[1]}\t<- ${r.keys[0]}`);
}
