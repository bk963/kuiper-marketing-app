/**
 * Default-Templates für Array-Items pro Section-Type.
 *
 * Phase 1c — beim "Add-Item"-Click und beim "Duplicate-Item"-Click
 * (wenn kein Source-Item) wird das Default-Template verwendet.
 *
 * Bewusst minimal + sinnvoll-deutsch, damit Bk sofort sieht was er kriegt.
 */

export const USPS_CARD_DEFAULT = {
  icon: 'fas fa-star',
  title: 'Neue Eigenschaft',
  body: 'Kurze Beschreibung was diesen Punkt ausmacht.',
};

export const MEMBER_LOGO_DEFAULT = {
  src: '/images/placeholder-logo.png',
  alt: 'Verbands-Logo',
};

export const TESTI_VIDEO_DEFAULT = {
  src: '',
  poster: '',
};

export const STEPS_STEP_DEFAULT = {
  num: '00',
  title: 'Neuer Schritt',
  body: 'Was passiert in diesem Schritt?',
};

export const TEAM_PERSON_DEFAULT = {
  name: 'Vorname Nachname',
  role: 'Rolle / Position',
  photo: '/images/placeholder-person.jpg',
  quals: [] as string[],
};

export const TEAM_QUAL_DEFAULT = 'Neue Qualifikation';

export const FAQ_ITEM_DEFAULT = {
  q: 'Neue Frage?',
  a: 'Antwort auf die Frage…',
};

/** String-Item-Templates (Story/Content/Hybrid/Final) */
export const PARAGRAPH_DEFAULT = 'Neuer Absatz mit weiteren Infos…';
export const BULLET_DEFAULT = 'Neuer Bullet-Point';
export const CONTENT_ITEM_DEFAULT = 'Neuer Listen-Eintrag';
