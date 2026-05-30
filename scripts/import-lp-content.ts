/**
 * import-lp-content.ts — Sprint lp-bsh-content-import Phase A (2026-05-30)
 *
 * Setzt mkt_landingpages.<id>.content_json.sections aus generateBshDefaultSections()
 * für einen bestimmten Slug. Idempotent (overwrite content_json sauber).
 *
 * Usage:
 *   npx tsx scripts/import-lp-content.ts --slug brandschutzhelfer-ausbildung [--dry-run]
 *
 * Args:
 *   --slug <slug>     Required. mkt_landingpages.slug
 *   --template <key>  Default 'bsh'. Aktuell nur 'bsh' supported.
 *   --dry-run         Zeigt vorher/nachher Diff statt PB-PATCH
 *
 * ENV needed:
 *   MPB_URL                   default https://pb.kuiper-safety.de
 *   PB_BLOG_EMAIL             Superuser
 *   PB_BLOG_PASS              Superuser-Pass
 *   PB_CF_ACCESS_CLIENT_ID    optional (für CF Access)
 *   PB_CF_ACCESS_CLIENT_SECRET optional
 *
 * Liest TypeScript-Defaults direkt aus src/components/lp/sections/defaults.ts —
 * single source of truth, kein Drift-Risiko.
 */
import { generateBshDefaultSections } from '../src/components/lp/sections/defaults';
import type { BshSection } from '../src/components/lp/sections/types';

const args = parseArgs(process.argv.slice(2));
const SLUG = args.slug as string | undefined;
const TEMPLATE = (args.template as string) || 'bsh';
const DRY_RUN = !!args['dry-run'];

if (!SLUG) {
  console.error('❌ --slug <slug> required');
  process.exit(1);
}

if (TEMPLATE !== 'bsh') {
  console.error(`❌ template '${TEMPLATE}' nicht unterstützt (nur 'bsh' aktuell)`);
  process.exit(1);
}

const PB = process.env.MPB_URL || 'https://pb.kuiper-safety.de';
const PB_EMAIL = process.env.PB_BLOG_EMAIL || '';
const PB_PASS = process.env.PB_BLOG_PASS || '';
const CF_ID = process.env.PB_CF_ACCESS_CLIENT_ID || '';
const CF_SECRET = process.env.PB_CF_ACCESS_CLIENT_SECRET || '';

if (!PB_EMAIL || !PB_PASS) {
  console.error('❌ PB_BLOG_EMAIL + PB_BLOG_PASS env required');
  process.exit(1);
}

function cfHeaders(): Record<string, string> {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (CF_ID && CF_SECRET) {
    h['CF-Access-Client-Id'] = CF_ID;
    h['CF-Access-Client-Secret'] = CF_SECRET;
  }
  return h;
}

async function main() {
  console.log(`📥 import-lp-content — slug='${SLUG}' template='${TEMPLATE}' dry-run=${DRY_RUN}`);
  console.log(`   PB: ${PB}`);

  // 1. Superuser-Token
  const authRes = await fetch(`${PB}/api/collections/_superusers/auth-with-password`, {
    method: 'POST',
    headers: cfHeaders(),
    body: JSON.stringify({ identity: PB_EMAIL, password: PB_PASS }),
  });
  if (!authRes.ok) {
    console.error(`❌ Superuser-Auth failed: HTTP ${authRes.status} ${await authRes.text()}`);
    process.exit(2);
  }
  const { token } = await authRes.json();
  if (!token) {
    console.error('❌ Kein token aus Auth-Response');
    process.exit(2);
  }
  console.log(`   ✅ Superuser-Token: ${token.length} chars`);

  // 2. LP-Record by slug — list all + JS-filter (workaround PB v0.22 skipTotal-Bug bei perPage=1+filter)
  const lpRes = await fetch(`${PB}/api/collections/mkt_landingpages/records?perPage=500&skipTotal=1`, {
    headers: { ...cfHeaders(), Authorization: token },
  });
  if (!lpRes.ok) {
    console.error(`❌ LP-Lookup failed: HTTP ${lpRes.status} ${await lpRes.text()}`);
    process.exit(3);
  }
  const lpData = await lpRes.json();
  const lp = (lpData.items || []).find((it: any) => it.slug === SLUG);
  if (!lp) {
    console.error(`❌ Kein mkt_landingpages-Record mit slug='${SLUG}'`);
    console.error(`   Verfügbare slugs: ${(lpData.items || []).map((it: any) => it.slug).join(', ')}`);
    process.exit(3);
  }
  console.log(`   ✅ LP gefunden: id=${lp.id} internal_name='${lp.internal_name}'`);

  // 3. Generate fresh sections
  const sections: BshSection[] = generateBshDefaultSections();
  console.log(`   ✅ Generated ${sections.length} sections aus generateBshDefaultSections()`);

  // 4. content_json mergen (bestehende settings/A-B beibehalten, sections überschreiben)
  const currentContent = lp.content_json || {};
  const newContent = {
    ...currentContent,
    sections,
  };

  // 5. Diff anzeigen
  const currentSectionCount = Array.isArray(currentContent.sections) ? currentContent.sections.length : 0;
  console.log('');
  console.log('   📊 Diff content_json.sections:');
  console.log(`      Vorher: ${currentSectionCount} sections`);
  console.log(`      Nachher: ${sections.length} sections`);
  console.log('');
  console.log('   📋 Neue Sections (id → type):');
  for (const [i, s] of sections.entries()) {
    console.log(`      ${String(i + 1).padStart(2, '0')}. ${s.type.padEnd(15)} → id=${s.id}`);
  }

  if (DRY_RUN) {
    console.log('');
    console.log('🔍 DRY-RUN — kein PATCH ausgeführt. Re-run ohne --dry-run um zu schreiben.');
    return;
  }

  // 6. PATCH
  console.log('');
  console.log('   📤 PATCH /api/collections/mkt_landingpages/records/' + lp.id);
  const patchRes = await fetch(`${PB}/api/collections/mkt_landingpages/records/${lp.id}`, {
    method: 'PATCH',
    headers: { ...cfHeaders(), Authorization: token },
    body: JSON.stringify({ content_json: newContent }),
  });
  if (!patchRes.ok) {
    console.error(`❌ PATCH failed: HTTP ${patchRes.status} ${await patchRes.text()}`);
    process.exit(4);
  }
  const updated = await patchRes.json();
  console.log(`   ✅ PATCH ok — updated=${updated.updated}, sections jetzt: ${(updated.content_json?.sections || []).length}`);
  console.log('');
  console.log('✅ Done. Test:');
  console.log(`   curl -sS -L https://kuiper-safety.de/lp/${SLUG} | grep -c "kf-bsh-"`);
}

function parseArgs(argv: string[]): Record<string, string | boolean> {
  const out: Record<string, string | boolean> = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith('--')) {
        out[key] = next;
        i++;
      } else {
        out[key] = true;
      }
    }
  }
  return out;
}

main().catch(err => {
  console.error('❌ Uncaught:', err);
  process.exit(99);
});
