/**
 * Default-Sections-Generator.
 *
 * Generiert content_json.sections für eine fresh BSH-LP — alle 14 Sections
 * in Default-Reihenfolge mit Default-Configs aus BSH_DEFAULT_CONFIGS.
 *
 * Wird verwendet von:
 *  - /lp/[slug]/page.tsx als Slug-Fallback (Demo ohne PB-Record)
 *  - LP-Wizard "Aus Template anlegen" (Phase 3d-3)
 *
 * V2 (2026-06-01): Optimierungs-Sandbox-Variante via Slug "brandschutzhelfer-ausbildung-v2".
 *   - Eigene Section-Order in BSH_V2_ORDER (start: 1:1 wie V1, iterativ überschreibbar)
 *   - Eigene Config-Overrides in BSH_V2_CONFIGS (start: nur Lead-Source-Trennung)
 *   - generateBshV2Sections() merged V1-Defaults mit V2-Overrides
 */
import { BSH_DEFAULT_CONFIGS, type BshSection, type BshSectionType } from './types';

/** Mini-UUID generator (kein crypto.randomUUID weil server-component-safe in alten Node) */
function uid(prefix = 'sec'): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Default-Section-Reihenfolge der BSH-LP V1 (Pos 1-14). */
export const BSH_DEFAULT_ORDER: BshSectionType[] = [
  'bsh-hero',
  'bsh-usps',
  'bsh-story',
  'bsh-member',
  'bsh-testi',
  'bsh-pe',
  'bsh-steps',
  'bsh-content',
  'bsh-hybrid',
  'bsh-team',
  'bsh-loc',
  'bsh-faq',
  'bsh-final',
  'bsh-open',
];

/** Generiert komplette BSH-Default-Sections inkl. IDs (V1). */
export function generateBshDefaultSections(): BshSection[] {
  return BSH_DEFAULT_ORDER.map(type => ({
    id: uid(type),
    type,
    config: { ...BSH_DEFAULT_CONFIGS[type] },
  }));
}

// ============================================================
// V2 — Optimierungs-Sandbox
// ============================================================

/**
 * Section-Order V2 — start identisch zu V1, iterativ anpassbar.
 * Beispiele zukünftiger Änderungen:
 *   - Section-Reihenfolge ändern (z.B. testi vor story für Trust-First)
 *   - Sections weglassen (z.B. bsh-pe wenn ProvenExpert-Widget nicht performt)
 *   - Neue Section-Types einführen (z.B. bsh-faq-jsonld als Schema.org-Variante)
 */
export const BSH_V2_ORDER: BshSectionType[] = [
  'bsh-hero',
  'bsh-usps',
  'bsh-story',
  'bsh-member',
  'bsh-testi',
  'bsh-pe',
  'bsh-steps',
  'bsh-content',
  'bsh-hybrid',
  'bsh-team',
  'bsh-loc',
  'bsh-faq',
  'bsh-final',
  'bsh-open',
];

/**
 * Section-Config-Overrides V2 (Iteration 2 — Content-Polish 2026-06-01).
 *
 * Optimierungen basieren auf:
 *   - GA4-Vergleich V1 vs BSD-LP (BSD-LP 81 % Engagement, 18 % Bounce, 184s Duration)
 *   - Audit Search-Term-Daten ("in der naehe" CPA 15 EUR Killer, Standort-Searches teuer)
 *   - Bundesweit/Inhouse-Pitch klarer (echte USP)
 *   - Content-Tiefe ausbauen (BSD 11.570 Wörter, V1 nur 2.081)
 *   - FAQ aus echten User-Suchen ableiten (12 Items statt 5)
 */
export const BSH_V2_CONFIGS: Partial<Record<BshSectionType, any>> = {
  'bsh-hero': {
    eyebrow: '★ Brandschutzhelfer-Ausbildung Bundesweit · Inhouse',
    headlinePre: 'Brandschutzhelfer-Ausbildung von',
    headlineAccent: 'echten Feuerwehrmännern',
    subline: 'Wir kommen mit allem Equipment direkt zu Ihnen ins Unternehmen — bundesweit. Praxisnah, mit Zertifikat nach DGUV 205-023 und ASR 2.2. Ab 8 Teilnehmer.',
    formTitle: 'Jetzt direkt Infos und Preise anfordern',
    leadSource: 'bsh-lp-v2',
    formId: 'bsh-hero-v2',
  },
  'bsh-usps': {
    eyebrow: '02 — Warum Kuiper',
    headline: 'Echte Feuerwehrleute. Bundesweit. Praxisnah.',
    cards: [
      { icon: 'fas fa-file-signature', title: 'Zertifikat nach', body: 'DGUV Information 205-023 und ASR 2.2 — direkt nach der Schulung in der Hand' },
      { icon: 'fas fa-user-graduate',  title: 'Echte Feuerwehrleute',     body: 'Unsere Ausbilder sind aktive Feuerwehrleute mit Einsatz-Erfahrung — keine reinen Theoretiker' },
      { icon: 'fas fa-map-marker-alt', title: 'Bundesweit Inhouse',       body: 'Wir kommen mit allem Equipment direkt zu Ihnen ins Unternehmen' },
      { icon: 'far fa-clock',          title: 'Garantierte Termine',      body: 'Wenn wir buchen, findet die Schulung statt — kein Ausfall, keine Verschiebung' },
      { icon: 'fas fa-laptop',         title: 'Hybrid möglich',           body: 'Theorie online + Praxis vor Ort — minimaler Ausfall im Betrieb' },
      { icon: 'fas fa-phone-alt',      title: '24/7 erreichbar',          body: 'Persönlicher Ansprechpartner für alle Fragen — vor, während und nach der Schulung' },
    ],
  },
  // bsh-story bleibt — BSD-LP zeigt dass der Story-Pitch funktioniert
  // bsh-member bleibt — Verbands-Logos sind statisches Trust-Signal
  // bsh-testi bleibt — Video-Testimonials sind starkes Signal
  // bsh-pe bleibt — ProvenExpert-Widget
  'bsh-steps': {
    eyebrow: '05 — Ablauf',
    headlinePre: 'In 3 Schritten zur',
    headlineAccent: 'Brandschutzhelfer-Ausbildung',
    headlineSuffix: '.',
    steps: [
      { num: '01', title: 'Anfrage in 60 Sekunden',  body: 'Sie schildern uns kurz Ihren Bedarf — Teilnehmerzahl, Wunschtermin, Standort. Wir melden uns innerhalb eines Werktags mit einem konkreten Angebot.' },
      { num: '02', title: 'Schulung bei Ihnen vor Ort', body: 'Wir kommen mit kompletter Ausstattung (Brandsimulator, Feuerlöscher, Schulungsmaterial) zu Ihnen. Theorie + Praxis in nur einem halben Tag.' },
      { num: '03', title: 'Zertifikat sofort in der Hand', body: 'Im Anschluss erhält jeder Teilnehmer das Zertifikat nach DGUV 205-023 und ASR 2.2 — digital und auf Wunsch in Papierform.' },
    ],
    ctaText: 'Jetzt unverbindlich Termin anfragen',
    ctaHref: '#anfrage',
  },
  'bsh-content': {
    headline: 'Das lernen Ihre Mitarbeiter in der Brandschutzhelfer-Ausbildung',
    items: [
      'Rechtliche Grundlagen: DGUV 205-023, ASR 2.2, ArbSchG',
      'Brandschutz-Grundlagen: Brandentstehung, Brandklassen, Verbrennungsdreieck',
      'Betriebliche Brandschutzorganisation: Aufgaben und Pflichten des Brandschutzhelfers',
      'Funktion und Wirkungsweise von Feuerlöschern (Pulver, Wasser, CO₂, Schaum)',
      'Auswahl des richtigen Löschmittels je Brandklasse',
      'Gefahren durch Brände: Rauchgas-Toxizität, Wärmestrahlung, Sauerstoffmangel',
      'Verhalten im Brandfall: Alarmierung, Räumung, Erste-Hilfe-Maßnahmen',
      'Flucht- und Rettungswege: Kennzeichnung, Begehbarkeit, Notausgänge',
      'Sammelplatz-Management und Vollständigkeitskontrolle',
      'Zusammenarbeit mit Feuerwehr und Rettungsdiensten',
      'Praktisches Löschtraining mit echtem Feuer (Brandsimulator)',
      'Notfall-Kommunikation: Notruf 112 absetzen, Erstinformation',
    ],
  },
  'bsh-hybrid': {
    eyebrow: '07 — Flexibilität',
    headlinePre: 'Auch',
    headlineAccent: 'Hybrid',
    headlineSuffix: 'durchführbar.',
    paragraphs: [
      'Die theoretische Ausbildung lässt sich als <strong>E-Learning bequem vom Arbeitsplatz oder zuhause</strong> absolvieren — Ihre Mitarbeiter wählen selbst, wann sie die Lerneinheiten bearbeiten.',
      'Vorteil für Sie: <strong>keine ganztägige Freistellung</strong> der Belegschaft, kein Komplett-Ausfall der Abteilung. Statt einem halben Tag verlieren Sie nur die 60-90 Minuten der praktischen Übung.',
      'Im Nachgang kommen unsere Ausbilder nur noch für die <strong>praktische Löschübung mit echtem Feuer</strong> direkt zu Ihnen — Brandsimulator und Feuerlöscher bringen wir mit.',
      'Diese Hybrid-Variante ist besonders attraktiv bei <strong>Schichtbetrieb, verteilten Standorten oder Home-Office-Anteil</strong> — alle Mitarbeiter können theoretisch geschult werden, ohne dass Sie die Arbeitsorganisation umstellen müssen.',
    ],
    note: 'Schulung auf Wunsch auch in Englisch durchführbar — wir haben muttersprachliche Trainer.',
  },
  // bsh-team bleibt — 9 echte Personen mit Vita ist starkes Trust-Signal (BSD-Pattern)
  // bsh-loc bleibt — Voerde-Standort als sekundär (Hauptangebot ist Inhouse)
  'bsh-faq': {
    eyebrow: '10 — Häufige Fragen',
    headlinePre: 'Fragen zur',
    headlineAccent: 'Brandschutzhelfer-Ausbildung',
    headlineSuffix: '?',
    items: [
      { q: 'Was kostet eine Brandschutzhelfer-Ausbildung?', a: 'Die Kosten hängen von der Teilnehmerzahl und dem Schulungsort ab. Bei Inhouse-Schulungen ab 8 Teilnehmern liegt der Preis pro Person typisch zwischen 80 und 130 EUR netto. Fordern Sie unverbindlich Ihr individuelles Angebot an — wir nennen Ihnen den genauen Preis innerhalb eines Werktags.' },
      { q: 'Wie viele Brandschutzhelfer braucht ein Unternehmen?', a: 'Laut ASR 2.2 sind <strong>mindestens 5 % der Belegschaft</strong> als Brandschutzhelfer auszubilden — je nach Tätigkeit und Brandgefährdung kann der Anteil höher sein. In Krankenhäusern, Pflegeeinrichtungen oder Bereichen mit erhöhter Brandgefahr wird ein Anteil von 10 % oder mehr empfohlen.' },
      { q: 'Wie lange dauert die Schulung?', a: 'Die Ausbildung umfasst <strong>mindestens 2 Unterrichtseinheiten à 45 Minuten Theorie</strong> sowie ca. 1 Unterrichtseinheit Praxis (Löschübung mit Feuerlöscher). Inhouse dauert die komplette Schulung damit rund einen halben Tag. In der Hybrid-Variante reduziert sich der Vor-Ort-Termin auf 60-90 Minuten.' },
      { q: 'Wie oft muss die Brandschutzhelfer-Ausbildung aufgefrischt werden?', a: 'Die DGUV empfiehlt eine Auffrischung <strong>alle 3 bis 5 Jahre</strong>. Bei Änderungen in der Brandschutzorganisation, neuen Räumlichkeiten oder erhöhter Brandgefahr ist auch eine frühere Wiederholung sinnvoll.' },
      { q: 'Wo findet die Schulung statt? Sind Sie auch in Berlin / München / Hamburg?', a: 'Wir kommen <strong>bundesweit direkt zu Ihnen ins Unternehmen</strong> (Inhouse) — egal ob Berlin, München, Hamburg, Köln oder ländlich. Anfahrt ist im Inhouse-Preis enthalten. Alternativ bieten wir offene Seminare bei uns am Standort in 46562 Voerde an, vor allem für Einzelpersonen oder Kleinstgruppen.' },
      { q: 'Ab wie viele Teilnehmer ist eine Inhouse-Schulung möglich?', a: 'Bereits <strong>ab 8 Teilnehmern</strong> rechnet sich die Inhouse-Variante. Bei kleineren Teams oder einzelnen Mitarbeitern bieten wir das offene Seminar in Voerde an.' },
      { q: 'Ist die Brandschutzhelfer-Ausbildung Pflicht?', a: 'Ja. Nach <strong>ASR A2.2 sowie DGUV Information 205-023</strong> muss jeder Arbeitgeber eine angemessene Anzahl ausgebildeter Brandschutzhelfer im Betrieb haben. Die Pflicht ergibt sich aus dem Arbeitsschutzgesetz (§10 ArbSchG).' },
      { q: 'Was unterscheidet einen Brandschutzhelfer von einem Brandschutzbeauftragten?', a: 'Der <strong>Brandschutzhelfer</strong> wird in 3-4 UE für die akute Brand-Bekämpfung am Arbeitsplatz ausgebildet — Feuerlöscher bedienen, Räumung, Erste-Hilfe. Der <strong>Brandschutzbeauftragte</strong> hat eine 64-UE-Vollausbildung und ist verantwortlich für das gesamte betriebliche Brandschutzkonzept.' },
      { q: 'Bekomme ich ein offizielles Zertifikat?', a: 'Ja. Nach erfolgreichem Abschluss erhält jeder Teilnehmer ein <strong>Zertifikat nach DGUV 205-023 und ASR 2.2</strong> — digital sofort und auf Wunsch auch in Papierform. Das Zertifikat dient als Nachweis gegenüber Berufsgenossenschaft und Aufsichtsbehörden.' },
      { q: 'Ist die Ausbildung steuerlich absetzbar?', a: 'Ja, als <strong>Betriebsausgabe</strong> ist die Brandschutzhelfer-Ausbildung in voller Höhe absetzbar. Die Pflicht zur Bestellung von Brandschutzhelfern ergibt sich aus dem Arbeitsschutzgesetz — die Kosten sind damit notwendige Betriebsausgaben.' },
      { q: 'Können Sie auch englischsprachige Schulungen anbieten?', a: 'Ja. Wir haben muttersprachliche Trainer und führen die Ausbildung auf Wunsch komplett <strong>auf Englisch</strong> durch — wichtig für internationale Teams und Standorte mit hohem Auslands-Anteil.' },
      { q: 'Gehen Sie auf die Besonderheiten unseres Betriebs ein?', a: 'Selbstverständlich. Wir besprechen vorab Ihre <strong>betrieblichen Gegebenheiten und spezifische Brandgefahren</strong> (z.B. Lagerung brennbarer Stoffe, Maschinenpark, Arbeitsbereiche). Die Schulung wird daran ausgerichtet — Ihre Mitarbeiter erhalten direkt anwendbares Wissen für Ihren Betrieb.' },
    ],
  },
  'bsh-final': {
    eyebrow: '11 — Jetzt starten',
    headlinePre: 'Starten Sie jetzt Ihre',
    headlineAccent: 'Brandschutzhelfer-Ausbildung',
    headlineSuffix: '.',
    bullets: [
      'Bundesweit Inhouse — wir kommen mit allem Equipment zu Ihnen',
      'Garantierte Termine — keine Verschiebung, kein Ausfall',
      'Echte Feuerwehrleute als Ausbilder — Einsatz-Erfahrung aus erster Hand',
      'Zertifikat nach DGUV 205-023 und ASR 2.2 direkt nach der Schulung',
      'Persönlicher Ansprechpartner vor, während und nach der Schulung',
      'Hybrid-Option: Theorie online + Praxis vor Ort — minimaler Ausfall',
      'Auf Wunsch auch englischsprachig durchführbar',
      'Keine versteckten Kosten — Anfahrt und Material inklusive',
    ],
    ctaText: 'Jetzt unverbindlich Angebot anfordern',
    ctaHref: '#anfrage',
  },
  'bsh-open': {
    eyebrow: '12 — Alternative',
    headline: 'Weniger als 8 Teilnehmer? Kommen Sie zu uns nach Voerde.',
    body: 'Für Einzelpersonen, Kleinstgruppen oder wenn Sie die Schulung außerhalb Ihres Betriebs durchführen möchten: Wir führen regelmäßig <strong>offene Brandschutzhelfer-Seminare</strong> bei uns am Standort in 46562 Voerde durch. Kostenlose Parkplätze und direkte Nahverkehrsanbindung vorhanden. Auch ideal für Selbstständige oder als Teamevent-Schulung in der Niederrhein-Region.',
  },
};

/**
 * Generiert V2-Sections — V1-Defaults gemerged mit V2-Overrides.
 * Per Section wird die V1-Default-Config genommen und dann mit dem V2-Override
 * gespread (override gewinnt). Section-Reihenfolge folgt BSH_V2_ORDER.
 */
export function generateBshV2Sections(): BshSection[] {
  return BSH_V2_ORDER.map(type => ({
    id: uid(type),
    type,
    config: {
      ...BSH_DEFAULT_CONFIGS[type],
      ...(BSH_V2_CONFIGS[type] || {}),
    },
  }));
}
