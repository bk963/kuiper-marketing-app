/**
 * BSH-Section-Types — Type-Definitionen für Editor-driven LP-Sections.
 *
 * Jede Section hat:
 *  - key: string-Identifier für Registry-Lookup
 *  - config: Props die im Editor editiert werden + default-Values
 *  - render: React-Component
 *
 * content_json.sections = [
 *   { id: 'uuid', type: 'bsh-hero', config: { eyebrow: '...', headline: '...', ... } },
 *   ...
 * ]
 *
 * Editor (Phase 3d-3) generiert UI aus den Config-Schemas, Renderer mapped type → component.
 */

export type BshSectionType =
  | 'bsh-hero'
  | 'bsh-usps'
  | 'bsh-story'
  | 'bsh-member'
  | 'bsh-testi'
  | 'bsh-pe'
  | 'bsh-steps'
  | 'bsh-content'
  | 'bsh-hybrid'
  | 'bsh-team'
  | 'bsh-loc'
  | 'bsh-faq'
  | 'bsh-final'
  | 'bsh-open';

export type BshSection<T = Record<string, any>> = {
  id: string;
  type: BshSectionType;
  config: T;
};

/** Section-Catalog für Editor — Position-Order entspricht Default-BSH-LP. */
export const BSH_SECTION_CATALOG: { key: BshSectionType; label: string; desc: string }[] = [
  { key: 'bsh-hero',    label: '🎯 Hero',                desc: 'Headline + Video + Form + TÜV-Block' },
  { key: 'bsh-usps',    label: '⭐ USPs',                desc: '5-6 Vorteile als Cards mit FontAwesome-Icons' },
  { key: 'bsh-story',   label: '📖 Story',               desc: 'Text + Portrait-Foto (Bjoern-Pattern)' },
  { key: 'bsh-member',  label: '🤝 Mitgliedschaften',    desc: 'Verbands-Logos in Reihe' },
  { key: 'bsh-testi',   label: '💬 Testimonials',        desc: 'Video-Testimonials 2-Spalten-Grid' },
  { key: 'bsh-pe',      label: '⭐ ProvenExpert-Widget', desc: 'Kundenbewertungen via JS-Embed' },
  { key: 'bsh-steps',   label: '🪜 Prozess-Schritte',    desc: '3-Schritte-Cards + CTA-Pill' },
  { key: 'bsh-content', label: '✓ Inhaltsliste',         desc: 'Headline + Check-Liste' },
  { key: 'bsh-hybrid',  label: '🔀 Hybrid-Info',         desc: 'Volltext-Block + Note' },
  { key: 'bsh-team',    label: '👥 Team',                desc: 'Personen-Grid mit Photo + Quals' },
  { key: 'bsh-loc',     label: '📍 Standort',            desc: 'Big-Town-Name + Body + Maps-Pill' },
  { key: 'bsh-faq',     label: '❓ FAQ',                  desc: '<details>-Accordion' },
  { key: 'bsh-final',   label: '🎯 Final-CTA',           desc: 'Navy-Hintergrund + Check-Liste + Big-Pill' },
  { key: 'bsh-open',    label: '➕ Alternative',         desc: 'Offene-Seminare-Hinweis' },
];

/** Section-Default-Configs aus BSH-Source. Wird vom new-LP-Wizard verwendet. */
export const BSH_DEFAULT_CONFIGS: Record<BshSectionType, any> = {
  'bsh-hero': {
    eyebrow: '★ Brandschutzhelfer Ausbildung Bundesweit',
    headlinePre: 'Brandschutz von',
    headlineAccent: 'echten Feuerwehrmännern',
    subline: 'Direkt bei Ihnen live im Unternehmen. Inkl. Zertifikat nach DGUV Information 205-023 und ASR 2.2.',
    videoSrc: '/videos/bsh-lp/hero.mp4',
    videoPoster: '/videos/bsh-lp/hero-poster.jpg',
    videoCaption: 'Video enthält wichtige Infos für Sie',
    formTitle: 'Jetzt direkt Infos und Preise anfordern',
    formId: 'bsh-hero',
    leadSource: 'bsh-lp',
    tuevLogo: 'https://kuiper-safety.de/bsd-assets/tuev.png',
    tuevTitle: 'TÜV zertifizierter Dienstleister',
    tuevBody: 'Die Kuiper Brandschutz GmbH ist durch den technischen Überwachungsverein (TÜV Rheinland) im Bereich der Erbringung von Beratungen und Schulungen nach der ISO 9001 2015 zertifiziert worden.',
  },
  'bsh-usps': {
    eyebrow: '02 — Vertrauen',
    headline: 'Warum Kuiper Brandschutz.',
    cards: [
      { icon: 'fas fa-file-signature', title: 'Zertifikat nach', body: 'DGUV Information 205-023 und ASR 2.2' },
      { icon: 'fas fa-user-graduate', title: 'Praxisnah', body: 'Von echten Feuerwehrmännern lernen' },
      { icon: 'far fa-clock', title: 'Garantierte Termine', body: 'Unsere Termine finden statt.' },
      { icon: 'fas fa-laptop', title: 'E-Learning', body: 'Unsere theoretische Ausbildung ist als Hybrid Variante möglich.' },
      { icon: 'fas fa-phone-alt', title: '24/7 erreichbar', body: 'Wir sind tagtäglich für Sie erreichbar und antworten auf Ihre Fragen' },
    ],
  },
  'bsh-story': {
    headlinePre: 'Von',
    headlineAccent: 'echten Feuerwehrmännern',
    headlineSuffix: 'lernen',
    paragraphs: [
      'Möchten Sie für den Ernstfall gerüstet sein und im Brandfall schnell und sicher handeln können?',
      'Dann ist unsere Brandschutzhelfer Ausbildung von echten <strong>Feuerwehrmännern</strong> genau das Richtige für Sie!',
      'In unserer praxisnahen Ausbildung lernen Sie von erfahrenen <strong>Feuerwehrleuten</strong> alles über Brandschutz, Brandverhütung und den Umgang mit Feuerlöschern.',
      'Unser Kurs ist nicht nur für Unternehmen interessant, sondern auch für Sie als Privatperson, wenn Sie Ihre Familie und Ihr Zuhause schützen möchten.',
      'Nach erfolgreichem Abschluss der Ausbildung erhalten Sie ein <strong>Zertifikat</strong> und sind somit als Brandschutzhelfer qualifiziert.',
      'Vertrauen Sie auf die Expertise unserer <strong>Feuerwehrmänner</strong> und sichern Sie sich jetzt Ihren Platz in unserem nächsten Kurs!',
    ],
    photoSrc: 'https://kuiper-safety.de/bsd-assets/bjoern-portrait-clean.webp',
    photoAlt: 'Björn Kuiper – Kuiper Brandschutz',
  },
  'bsh-member': {
    label: 'Wir sind Mitglied im',
    logos: [
      { src: 'https://kuiper-safety.de/bsd-assets/badge-vdsi.jpeg', alt: 'VDSI' },
      { src: 'https://kuiper-safety.de/bsd-assets/badge-vfdb.png', alt: 'vfdb' },
      { src: 'https://kuiper-safety.de/bsd-assets/badge-divb.jpeg', alt: 'DIVB' },
      { src: 'https://kuiper-safety.de/bsd-assets/badge-eusab.jpeg', alt: 'EUSAB' },
    ],
  },
  'bsh-testi': {
    eyebrow: '04 — Teilnehmer-Stimmen',
    headline: 'Das sagen Teilnehmer zur Ausbildung.',
    videos: [
      { src: '/videos/bsh-lp/testimonial-1.mp4', poster: '/videos/bsh-lp/testimonial-1-poster.jpg' },
      { src: '/videos/bsh-lp/testimonial-2.mp4', poster: '/videos/bsh-lp/testimonial-2-poster.jpg' },
    ],
  },
  'bsh-pe': {
    label: 'Ausgezeichnete Kundenbewertungen',
    widgetSrc: 'https://www.provenexpert.com/widget/landing_brandschutzdozenten.js?feedback=1&avatar=1&competence=1&language=de-de&style=white',
  },
  'bsh-steps': {
    eyebrow: '05 — Ablauf',
    headlinePre: 'In 3 Schritten zur',
    headlineAccent: 'Brandschutzhelfer Ausbildung',
    headlineSuffix: '.',
    steps: [
      { num: '01', title: 'Anfrage', body: 'Fragen Sie direkt Ihre individuelle Brandschutzhelfer Ausbildung an und sichern Sie sich heute noch Ihren Schulungstermin.' },
      { num: '02', title: 'Ausbildung', body: 'Die Ausbildung wird direkt bei Ihnen vor Ort im Unternehmen durch unsere Feuerwehrmänner durchgeführt.' },
      { num: '03', title: 'Zertifikat', body: 'Im Nachgang der Brandschutzhelfer Ausbildung erhalten Sie direkt ein Zertifikat nach ASR 2.2 und DGUV Information 205-023.' },
    ],
    ctaText: 'Jetzt Infos und Termine anfordern',
    ctaHref: '#anfrage',
  },
  'bsh-content': {
    headline: 'Inhalte der Ausbildung zum Brandschutzhelfer',
    items: [
      'Grundzüge des Brandschutzes',
      'Betriebliche Brandschutzorganisation',
      'Funktion und Wirkungsweise von Feuerlöscheinrichtungen',
      'Gefahren durch Brände',
      'Verhalten im Brandfall',
      'Praktisches Löschtraining',
    ],
  },
  'bsh-hybrid': {
    eyebrow: '07 — Flexibilität',
    headlinePre: 'Auch',
    headlineAccent: 'Hybrid',
    headlineSuffix: 'möglich.',
    paragraphs: [
      'Durch diese flexible Online-Option der theoretischen Brandschutzhelfer Ausbildung können Unternehmen Zeit und Kosten sparen, da die Teilnehmer die Theorie bequem von zu Hause oder am Arbeitsplatz aus erlernen können.',
      'Es ist keine langfristige Planung für Präsenzveranstaltungen notwendig, was den organisatorischen Aufwand und <strong>Ausfallzeiten minimiert</strong> und eine schnellere und effizientere Ausbildung ermöglicht.',
      'Der große Vorteil dieser Ausbildungsform ist, dass Sie nicht alle Ihre Mitarbeiterinnen und Mitarbeiter an einem Stück komplett einen halben Tag freistellen müssen.',
      'Im Nachgang wird dann nur noch die praktische Ausbildung bei Ihnen vor Ort durchgeführt.',
    ],
    note: 'Ausbildung auf Wunsch auch in Englisch durchführbar.',
  },
  'bsh-team': {
    eyebrow: '08 — Team',
    headline: 'Ihr Expertenteam.',
    people: [
      { name: 'Björn Kuiper', role: 'Gesellschafter & Geschäftsführer', photo: 'https://kuiper-safety.de/bsd-assets/team-bjoern.png', quals: ['Brandschutzsachverständiger', 'Fachkraft für Arbeitssicherheit', 'Gruppenführer Feuerwehr B III'] },
      { name: 'Kevin Thies', role: 'Ausbilder', photo: 'https://kuiper-safety.de/bsd-assets/team-kevin.png', quals: ['Brandschutzbeauftragter'] },
      { name: 'Stefanie Kuiper', role: 'Leitung Personal', photo: 'https://kuiper-safety.de/bsd-assets/team-stefanie.jpeg', quals: ['Assistentin der Geschäftsführung'] },
      { name: 'Sven Hoffbauer', role: 'Ausbilder', photo: 'https://kuiper-safety.de/bsd-assets/team-sven.png', quals: ['Brandschutzbeauftragter'] },
      { name: 'Marc Roscher', role: 'Brandschutzbeauftragter', photo: 'https://kuiper-safety.de/bsd-assets/team-marc.jpeg', quals: ['Fachinformatiker'] },
      { name: 'Stefan Lehwald', role: 'Ausbilder', photo: 'https://kuiper-safety.de/bsd-assets/team-stefan.png', quals: ['Brandschutzbeauftragter'] },
      { name: "Martin O'Flanagan", role: 'IT-Administrator / Backoffice', photo: 'https://kuiper-safety.de/bsd-assets/team-martin.png', quals: ['Fachinformatiker', 'Brandschutzbeauftragter'] },
      { name: 'Florian Schmucker', role: 'Fachplaner Vorbeugender Brandschutz', photo: 'https://kuiper-safety.de/bsd-assets/team-florian.png', quals: ['Feuerwehrpläne, Flucht- und Rettungspläne, Feuerwehrlaufkarten, Brandschutzpläne, Brandschutzkonzepte'] },
      { name: 'Markus Legros', role: 'Backoffice / Vertrieb', photo: 'https://kuiper-safety.de/bsd-assets/team-markus.png', quals: ['Präventionsexperte'] },
    ],
    standDate: 'Stand: 16.01.2026',
  },
  'bsh-loc': {
    eyebrow: '09 — Standort',
    bigPart1: 'Voerde',
    bigPart2: 'Niederrhein.',
    body: 'Von hier aus betreuen wir Unternehmen in der gesamten Bundesrepublik rund um den organisatorischen Brandschutz. Unsere Partner, Kunden und Interessenten haben jederzeit die Möglichkeit uns besuchen zu kommen.',
    mapsUrl: 'https://maps.google.com/?q=Friedrichsfelder+Stra%C3%9Fe+34,+46562+Voerde',
    mapsText: 'Zur Anfahrtsbeschreibung',
  },
  'bsh-faq': {
    eyebrow: '10 — Häufige Fragen',
    headlinePre: 'Fragen zur',
    headlineAccent: 'Brandschutzhelfer-Ausbildung',
    headlineSuffix: '?',
    items: [
      { q: 'Geht die Brandschutzhelfer Ausbildung auch ohne praktische Ausbildung?', a: 'Nein. Für die Ausbildung zum Brandschutzhelfer ist zwingend eine praktische Ausbildung erforderlich.' },
      { q: 'Wie lange dauert die Ausbildung?', a: 'Für die Theorie sind mindestens 2 Unterrichtseinheiten à 45 Minuten vorzusehen. Im Anschluss erfolgt die praktische Ausbildung mit ca. 1 Unterrichtseinheit à 45 Minuten.' },
      { q: 'Welche Termine sind verfügbar?', a: 'Wir richten uns direkt nach Ihren betrieblichen Anforderungen und sichern Ihnen eine zeitnahe Durchführung an Ihrem Wunschtermin zu.' },
      { q: 'Sind die Inhalte aktuell?', a: 'Ja, die Inhalte sind immer auf dem aktuellsten Stand.' },
      { q: 'Gehen wir auf unseren Betrieb ein, oder ist es nur pauschal?', a: 'Selbstverständlich gehen wir auf Ihre betrieblichen Gegebenheiten und Besonderheiten ein, so dass Ihre Mitarbeiterinnen und Mitarbeiter nach der Ausbildung direkt umsetzbares Wissen erhalten.' },
    ],
  },
  'bsh-final': {
    eyebrow: '11 — Jetzt starten',
    headlinePre: 'Starten Sie jetzt Ihre',
    headlineAccent: 'Ausbildung zum Brandschutzhelfer',
    headlineSuffix: '.',
    bullets: [
      'Garantierte Ausbildungstermine.',
      'Wir kommen in Ihr Unternehmen.',
      'Sie haben immer einen persönlichen Ansprechpartner.',
      'Lerninhalte aktuell und betriebsspezifisch.',
      'Keine versteckten Kosten.',
    ],
    ctaText: 'Jetzt Infos und Termine anfordern',
    ctaHref: '#anfrage',
  },
  'bsh-open': {
    eyebrow: '12 — Alternative',
    headline: 'Nicht genug Teilnehmer? Kommen Sie zu uns.',
    body: 'Wir führen regelmäßig offene Brandschutzhelfer Seminare direkt bei uns am Standort in 46562 Voerde durch. Kostenlose Parkplätze sowie direkte Nahverkehrsanbindung vorhanden.',
  },
};
