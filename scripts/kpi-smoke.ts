/* Smoke-Test der KPI-Engine gegen ECHTE APIs. Nicht im Build — nur manuell via tsx. */
import { runQuery } from '@/lib/kpi/engine';
import { questionToSpec } from '@/lib/kpi/prompt';

async function main() {
  console.log('— 1) Ads-Spend 30T —');
  const cost = await runQuery({ metric: 'cost', days: 30 });
  console.log('  ok', cost.ok, '| value', cost.value, '| source', cost.source, '| series', cost.series?.length);

  console.log('— 2) Qualifizierte Leads 30T —');
  const ql = await runQuery({ metric: 'qualified_leads', days: 30 });
  console.log('  ok', ql.ok, '| value', ql.value, '| source', ql.source, cost.error || '');

  console.log('— 3) CPA pro qual. Lead 30T —');
  const cpa = await runQuery({ metric: 'cpa_qualified', days: 30 });
  console.log('  ok', cpa.ok, '| value', cpa.value, '| note', cpa.note || '-');

  console.log('— 4) Conversions je Kampagne 30T —');
  const byc = await runQuery({ metric: 'conversions', dimension: 'campaign', days: 30 });
  console.log('  ok', byc.ok, '| value', byc.value, '| breakdown', byc.breakdown?.slice(0, 5));

  console.log('— 5) GEX44: Frage → Spec —');
  const p = await questionToSpec('Wie hoch waren die Conversions der letzten 30 Tage in Köln?');
  console.log('  ok', p.ok, '| spec', JSON.stringify(p.spec), '| err', p.error || '-');
  if (p.ok && p.spec) {
    const r = await runQuery(p.spec);
    console.log('  → runQuery ok', r.ok, '| value', r.value, '| source', r.source);
  }
  console.log('\nSMOKE DONE');
}
main().catch((e) => { console.error('SMOKE FAIL', e); process.exit(1); });
