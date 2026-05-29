/**
 * Migration-Import-Endpoint für Phase 2.0f.
 *
 * POST /api/admin/import/:collection
 *
 * Auth: Bearer-Token (MIGRATION_BEARER_TOKEN env)
 * Body: { records: [...], dry_run?: bool }
 * Response: { collection, inserted, skipped_existing, errors, sample, dry_run? }
 *
 * Eigenschaften:
 * - Whitelist auf 14 mkt_*-Collections
 * - Idempotent via `crm_source_id` (re-run-safe)
 * - Pre-Scan auf existierende crm_source_ids, dann Insert nur was fehlt
 * - Bei jedem Insert wird `migrated_from_crm=true` automatisch gesetzt
 * - max 20 Errors gesammelt dann Abbruch, sample = erster erfolgreicher Insert
 */
import { NextRequest, NextResponse } from 'next/server';
import { pbHeaders } from '@/lib/admin-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 min für große Imports

/**
 * PB-Superuser-Auth — Token-Cache in-Memory pro Request.
 *
 * Marketing-PB Collection-Rules sind leer (admin-only). Ohne Superuser-Token wirft PB
 * 404 'Missing or invalid collection context'. Heißt: Endpoint muss self bei PB als
 * _superusers authenticated und Token an PB-Calls hängen.
 */
let _suToken: string | null = null;
let _suExpires = 0;

async function getSuperuserToken(pbUrl: string): Promise<string> {
  // 5-min cache
  if (_suToken && Date.now() < _suExpires) return _suToken;
  const email = process.env.PB_BLOG_EMAIL || process.env.PB_SUPERUSER_EMAIL || '';
  const pass = process.env.PB_BLOG_PASS || process.env.PB_SUPERUSER_PASS || '';
  if (!email || !pass) return '';
  try {
    const r = await fetch(`${pbUrl}/api/collections/_superusers/auth-with-password`, {
      method: 'POST',
      headers: pbHeaders(),
      body: JSON.stringify({ identity: email, password: pass }),
      cache: 'no-store',
    });
    if (r.ok) {
      const d = await r.json();
      _suToken = String(d.token || '');
      _suExpires = Date.now() + 5 * 60 * 1000;
      return _suToken;
    }
  } catch { /* swallow */ }
  return '';
}

const ALLOWED = new Set([
  'mkt_blog_articles',
  'mkt_blog_categories',
  'mkt_blog_pillar_pages',
  'mkt_blog_internal_links',
  'mkt_blog_media',
  'mkt_blog_keywords',
  'mkt_blog_rankings',
  'mkt_blog_competitors',
  'mkt_blog_recommendations',
  'mkt_site_pages',
  'mkt_templates',
  'mkt_forms',
  'mkt_form_submissions',
  'mkt_leads',
]);

export async function POST(req: NextRequest, ctx: { params: Promise<{ collection: string }> }) {
  const { collection } = await ctx.params;

  // 1. Bearer-Token
  const expected = process.env.MIGRATION_BEARER_TOKEN || '';
  if (!expected) {
    return NextResponse.json({ error: 'MIGRATION_BEARER_TOKEN not configured on server' }, { status: 500 });
  }
  const auth = req.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (token !== expected) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  // 2. Whitelist
  if (!ALLOWED.has(collection)) {
    return NextResponse.json({ error: 'collection not in whitelist', allowed: [...ALLOWED] }, { status: 400 });
  }

  // 3. Body
  let body: { records?: any[]; dry_run?: boolean } = {};
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'invalid JSON' }, { status: 400 }); }
  const records = Array.isArray(body.records) ? body.records : [];
  if (!records.length) return NextResponse.json({ error: 'records[] required (non-empty array)' }, { status: 400 });
  const dryRun = !!body.dry_run;

  const pbUrl = process.env.MPB_URL || 'https://pb.kuiper-safety.de';

  // PB-Superuser-Token holen (Collection-Rules sind admin-only)
  const su = await getSuperuserToken(pbUrl);
  if (!su) {
    return NextResponse.json({
      error: 'PB-Superuser-Auth failed',
      hint: 'PB_BLOG_EMAIL/PASS env vars not configured or wrong credentials',
    }, { status: 500 });
  }

  // 4. Source-IDs einsammeln (crm_source_id ODER falls fehlt: original `id` aus CRM)
  const sourceIds: string[] = records
    .map((r: any) => String(r.crm_source_id || r.id || '').trim())
    .filter(Boolean);

  // 5. Pre-Scan: welche crm_source_ids existieren bereits?
  const existing = new Set<string>();
  if (sourceIds.length) {
    const chunkSize = 40;
    for (let i = 0; i < sourceIds.length; i += chunkSize) {
      const chunk = sourceIds.slice(i, i + chunkSize);
      const filter = chunk.map(id => `crm_source_id="${id.replace(/"/g, '\\"')}"`).join('||');
      try {
        const r = await fetch(
          `${pbUrl}/api/collections/${collection}/records?perPage=${chunkSize}&skipTotal=1&filter=${encodeURIComponent(filter)}&fields=crm_source_id`,
          { headers: pbHeaders({ Authorization: su }), cache: 'no-store' }
        );
        if (r.ok) {
          const d = await r.json();
          for (const it of d.items || []) {
            if (it.crm_source_id) existing.add(String(it.crm_source_id));
          }
        }
      } catch { /* skip chunk on error */ }
    }
  }

  // 6. Dry-Run-Mode: nur zählen
  if (dryRun) {
    return NextResponse.json({
      collection,
      dry_run: true,
      total: records.length,
      would_insert: records.length - existing.size,
      would_skip_existing: existing.size,
      sample: records[0] || null,
    });
  }

  // 7. Insert
  const errors: any[] = [];
  let inserted = 0;
  let skipped_existing = 0;
  let sample: any = null;

  for (const rec of records) {
    const srcId = String(rec.crm_source_id || rec.id || '').trim();
    if (srcId && existing.has(srcId)) {
      skipped_existing++;
      continue;
    }

    // Clean: PB-System-Felder + relation-expand entfernen
    const { id: _id, collectionId: _cid, collectionName: _cn, expand: _ex, created: _cr, updated: _up, ...clean } = rec;
    clean.crm_source_id = srcId;
    clean.migrated_from_crm = true;

    try {
      const r = await fetch(`${pbUrl}/api/collections/${collection}/records`, {
        method: 'POST',
        headers: pbHeaders({ Authorization: su }),
        body: JSON.stringify(clean),
      });
      if (r.ok) {
        inserted++;
        if (!sample) sample = await r.json();
      } else {
        const txt = await r.text();
        errors.push({ src: srcId, status: r.status, body: txt.slice(0, 200) });
        if (errors.length >= 20) break;
      }
    } catch (e: any) {
      errors.push({ src: srcId, error: e?.message?.slice(0, 200) || 'fetch error' });
      if (errors.length >= 20) break;
    }
  }

  return NextResponse.json({
    collection,
    total_provided: records.length,
    inserted,
    skipped_existing,
    error_count: errors.length,
    errors: errors.slice(0, 20),
    sample,
  });
}

/**
 * GET — Status-Probe. Auch mit Bearer auth.
 * Antwort: { collection, count, sample, existing_crm_source_ids? }
 */
export async function GET(req: NextRequest, ctx: { params: Promise<{ collection: string }> }) {
  const { collection } = await ctx.params;

  const expected = process.env.MIGRATION_BEARER_TOKEN || '';
  if (!expected) return NextResponse.json({ error: 'MIGRATION_BEARER_TOKEN not configured' }, { status: 500 });
  const auth = req.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (token !== expected) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  if (!ALLOWED.has(collection)) {
    return NextResponse.json({ error: 'collection not in whitelist', allowed: [...ALLOWED] }, { status: 400 });
  }

  const pbUrl = process.env.MPB_URL || 'https://pb.kuiper-safety.de';
  const su = await getSuperuserToken(pbUrl);
  if (!su) return NextResponse.json({ error: 'PB-Superuser-Auth failed' }, { status: 500 });

  // Count via filter (totalItems wirft sonst 400 dank PB v0.22 Bug)
  let count = 0;
  let migrated = 0;
  try {
    const r1 = await fetch(`${pbUrl}/api/collections/${collection}/records?perPage=1&filter=${encodeURIComponent('id!=""')}`, {
      headers: pbHeaders({ Authorization: su }), cache: 'no-store',
    });
    if (r1.ok) {
      const d = await r1.json();
      count = d.totalItems || 0;
    }
    const r2 = await fetch(`${pbUrl}/api/collections/${collection}/records?perPage=1&filter=${encodeURIComponent('migrated_from_crm=true')}`, {
      headers: pbHeaders({ Authorization: su }), cache: 'no-store',
    });
    if (r2.ok) {
      const d = await r2.json();
      migrated = d.totalItems || 0;
    }
  } catch {}

  // Sample
  let sample: any = null;
  try {
    const r = await fetch(`${pbUrl}/api/collections/${collection}/records?perPage=1&skipTotal=1`, {
      headers: pbHeaders({ Authorization: su }), cache: 'no-store',
    });
    if (r.ok) {
      const d = await r.json();
      sample = (d.items || [])[0] || null;
    }
  } catch {}

  return NextResponse.json({ collection, count, migrated, sample });
}
