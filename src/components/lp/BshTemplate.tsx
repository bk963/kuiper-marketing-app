/**
 * Brandschutzhelfer-Ausbildung LP-Template — 1:1 React-Port der
 * Astro-Source `/opt/projects/kuiper-marketing-web/src/pages/lp/brandschutzhelfer-ausbildung.astro`.
 *
 * Architektur:
 *  - Server-Component (statisches HTML)
 *  - Form-Block ist Client-Component <BshForm /> (interaktivität + Tracking)
 *  - VideoPlayer als minimaler <video>-Tag (Astro hatte eigenes Component)
 *  - Header/Trust-Bar + Footer alles inline (war im Astro auch so)
 *
 * Phase 3d-1 = Pixel-Perfect-Demo. Phase 3d-2 wird das in 13 modulare
 * Sections aufteilen die der Editor in beliebiger Reihenfolge zusammenstellt.
 */
import BshForm from './BshForm';

type Props = {
  slug: string;
  formAction?: string;
  lpId?: string;
};

function Video({
  src,
  poster,
  controls = true,
  className = '',
  videoId,
}: { src: string; poster?: string; controls?: boolean; className?: string; videoId?: string }) {
  return (
    <div className={`kf-vid ${className}`}>
      <video
        id={videoId}
        src={src}
        poster={poster}
        controls={controls}
        playsInline
        preload="metadata"
        style={{ width: '100%', height: 'auto', display: 'block' }}
      />
    </div>
  );
}

export default function BshTemplate({ slug, formAction, lpId }: Props) {
  void slug;
  return (
    <>
      <div data-disable-tracking="1" style={{ display: 'none' }} />

      {/* ============ Trust-Bar ============ */}
      <div className="hb-trust">
        <div className="hb-trust__inner">
          <span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12l5 5L20 7" /></svg>
            {' '}TÜV Rheinland zertifiziert
          </span>
          <span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            {' '}24/7 erreichbar
          </span>
          <span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            {' '}1.000+ Brandschutzhelfer ausgebildet
          </span>
        </div>
      </div>

      {/* ============ Header ============ */}
      <header className="hb">
        <div className="hb__inner">
          <a href="https://kuiper-safety.de/" className="hb__logo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/kuiper-logo-lp.png" alt="Kuiper Safety Systems" />
          </a>
          <div className="hb__right">
            <a href="tel:+4928144419951" className="hb__phone">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              +49 281 444 199 51
            </a>
            <a href="#anfrage" className="hb__cta">
              Jetzt Termin sichern
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M4 10h12M11 5l5 5-5 5" />
              </svg>
            </a>
          </div>
        </div>
      </header>

      {/* ============ HERO ============ */}
      <section className="kf-bsh-hero" id="anfrage">
        <div className="kf-bsh-hero__top">
          <span className="kf-bsh-hero__eyebrow">★ Brandschutzhelfer Ausbildung Bundesweit</span>
          <h1 className="kf-bsh-hero__headline">
            Brandschutz von <span className="kf-bsh-hero__accent">echten Feuerwehrmännern</span>
          </h1>
          <p className="kf-bsh-hero__subline">
            Direkt bei Ihnen live im Unternehmen. Inkl. Zertifikat nach DGUV Information 205-023 und ASR 2.2.
          </p>
        </div>

        <div className="kf-bsh-hero__frame">
          <div className="kf-bsh-hero__video">
            <Video videoId="hero-bsh" src="/videos/bsh-lp/hero.mp4" poster="/videos/bsh-lp/hero-poster.jpg" />
            <p className="kf-bsh-hero__video-caption">Video enthält wichtige Infos für Sie</p>
          </div>

          <div className="kf-bsh-hero__form-wrap">
            <BshForm formId="bsh-hero" leadSource="bsh-lp" endpoint={formAction} lpId={lpId} />
          </div>
        </div>

        <div className="kf-bsh-hero__tuev">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="kf-bsh-hero__tuev-logo" src="https://kuiper-safety.de/bsd-assets/tuev.png" alt="TÜV Rheinland zertifiziert-Logo" loading="lazy" />
          <div className="kf-bsh-hero__tuev-text">
            <h3 className="kf-bsh-hero__tuev-title">TÜV zertifizierter Dienstleister</h3>
            <p className="kf-bsh-hero__tuev-body">Die Kuiper Brandschutz GmbH ist durch den technischen Überwachungsverein (TÜV Rheinland) im Bereich der Erbringung von Beratungen und Schulungen nach der ISO 9001 2015 zertifiziert worden.</p>
          </div>
        </div>
      </section>

      {/* ============ USP Grid ============ */}
      <section className="kf-bsh-usps">
        <div className="kf-bsh-usps__inner">
          <p className="kf-bsh-usps__eyebrow">02 — Vertrauen</p>
          <h2 className="kf-bsh-usps__headline">Warum Kuiper Brandschutz.</h2>

          <div className="kf-bsh-usps__grid">
            <article className="kf-bsh-card">
              <div className="kf-bsh-card__icon"><i className="fas fa-file-signature" aria-hidden="true"></i></div>
              <h3 className="kf-bsh-card__title">Zertifikat nach</h3>
              <p className="kf-bsh-card__body">DGUV Information 205-023 und ASR 2.2</p>
            </article>

            <article className="kf-bsh-card">
              <div className="kf-bsh-card__icon"><i className="fas fa-user-graduate" aria-hidden="true"></i></div>
              <h3 className="kf-bsh-card__title">Praxisnah</h3>
              <p className="kf-bsh-card__body">Von echten Feuerwehrmännern lernen</p>
            </article>

            <article className="kf-bsh-card">
              <div className="kf-bsh-card__icon"><i className="far fa-clock" aria-hidden="true"></i></div>
              <h3 className="kf-bsh-card__title">Garantierte Termine</h3>
              <p className="kf-bsh-card__body">Unsere Termine finden statt.</p>
            </article>

            <article className="kf-bsh-card">
              <div className="kf-bsh-card__icon"><i className="fas fa-laptop" aria-hidden="true"></i></div>
              <h3 className="kf-bsh-card__title">E-Learning</h3>
              <p className="kf-bsh-card__body">Unsere theoretische Ausbildung ist als Hybrid Variante möglich.</p>
            </article>

            <article className="kf-bsh-card">
              <div className="kf-bsh-card__icon"><i className="fas fa-phone-alt" aria-hidden="true"></i></div>
              <h3 className="kf-bsh-card__title">24/7 erreichbar</h3>
              <p className="kf-bsh-card__body">Wir sind tagtäglich für Sie erreichbar und antworten auf Ihre Fragen</p>
            </article>
          </div>
        </div>
      </section>

      {/* ============ Story ============ */}
      <section className="kf-bsh-story">
        <div className="kf-bsh-story__inner">
          <div className="kf-bsh-story__text">
            <h2 className="kf-bsh-story__headline">
              Von <span className="kf-bsh-story__accent">echten Feuerwehrmännern</span> lernen
            </h2>
            <div className="kf-bsh-story__body">
              <p>Möchten Sie für den Ernstfall gerüstet sein und im Brandfall schnell und sicher handeln können?</p>
              <p>Dann ist unsere Brandschutzhelfer Ausbildung von echten <strong>Feuerwehrmännern</strong> genau das Richtige für Sie!</p>
              <p>In unserer praxisnahen Ausbildung lernen Sie von erfahrenen <strong>Feuerwehrleuten</strong> alles über Brandschutz, Brandverhütung und den Umgang mit Feuerlöschern.</p>
              <p>Unser Kurs ist nicht nur für Unternehmen interessant, sondern auch für Sie als Privatperson, wenn Sie Ihre Familie und Ihr Zuhause schützen möchten.</p>
              <p>Nach erfolgreichem Abschluss der Ausbildung erhalten Sie ein <strong>Zertifikat</strong> und sind somit als Brandschutzhelfer qualifiziert.</p>
              <p>Vertrauen Sie auf die Expertise unserer <strong>Feuerwehrmänner</strong> und sichern Sie sich jetzt Ihren Platz in unserem nächsten Kurs!</p>
            </div>
          </div>
          <div className="kf-bsh-story__photo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="https://kuiper-safety.de/bsd-assets/bjoern-portrait-clean.webp" alt="Björn Kuiper – Kuiper Brandschutz" width={947} height={738} loading="lazy" />
          </div>
        </div>
      </section>

      {/* ============ Member ============ */}
      <section className="kf-bsh-member">
        <div className="kf-bsh-member__inner">
          <p className="kf-bsh-member__label">Wir sind Mitglied im</p>
          <div className="kf-bsh-member__row">
            {/* eslint-disable @next/next/no-img-element */}
            <img src="https://kuiper-safety.de/bsd-assets/badge-vdsi.jpeg" alt="VDSI" loading="lazy" />
            <img src="https://kuiper-safety.de/bsd-assets/badge-vfdb.png" alt="vfdb" loading="lazy" />
            <img src="https://kuiper-safety.de/bsd-assets/badge-divb.jpeg" alt="DIVB" loading="lazy" />
            <img src="https://kuiper-safety.de/bsd-assets/badge-eusab.jpeg" alt="EUSAB" loading="lazy" />
            {/* eslint-enable @next/next/no-img-element */}
          </div>
        </div>
      </section>

      {/* ============ Testimonials ============ */}
      <section className="kf-bsh-testi">
        <div className="kf-bsh-testi__inner">
          <p className="kf-bsh-testi__eyebrow">04 — Teilnehmer-Stimmen</p>
          <h2 className="kf-bsh-testi__headline">Das sagen Teilnehmer zur Ausbildung.</h2>
          <div className="kf-bsh-testi__grid">
            <Video videoId="testi-1" src="/videos/bsh-lp/testimonial-1.mp4" poster="/videos/bsh-lp/testimonial-1-poster.jpg" />
            <Video videoId="testi-2" src="/videos/bsh-lp/testimonial-2.mp4" poster="/videos/bsh-lp/testimonial-2-poster.jpg" />
          </div>
        </div>
      </section>

      {/* ============ ProvenExpert-Widget ============ */}
      <section className="kf-bsh-pe">
        <div className="kf-bsh-pe__inner">
          <p className="kf-bsh-pe__label">Ausgezeichnete Kundenbewertungen</p>
          <div id="pewl"></div>
          <script
            type="text/javascript"
            src="https://www.provenexpert.com/widget/landing_brandschutzdozenten.js?feedback=1&avatar=1&competence=1&language=de-de&style=white"
            async
          ></script>
        </div>
      </section>

      {/* ============ 3 Schritte ============ */}
      <section className="kf-bsh-steps">
        <div className="kf-bsh-steps__inner">
          <p className="kf-bsh-steps__eyebrow">05 — Ablauf</p>
          <h2 className="kf-bsh-steps__headline">
            In 3 Schritten zur <span className="kf-bsh-steps__accent">Brandschutzhelfer Ausbildung</span>.
          </h2>

          <div className="kf-bsh-steps__grid">
            <article className="kf-bsh-step">
              <div className="kf-bsh-step__num">01</div>
              <h3 className="kf-bsh-step__title">Anfrage</h3>
              <p className="kf-bsh-step__body">Fragen Sie direkt Ihre individuelle Brandschutzhelfer Ausbildung an und sichern Sie sich heute noch Ihren Schulungstermin.</p>
            </article>
            <article className="kf-bsh-step">
              <div className="kf-bsh-step__num">02</div>
              <h3 className="kf-bsh-step__title">Ausbildung</h3>
              <p className="kf-bsh-step__body">Die Ausbildung wird direkt bei Ihnen vor Ort im Unternehmen durch unsere Feuerwehrmänner durchgeführt.</p>
            </article>
            <article className="kf-bsh-step">
              <div className="kf-bsh-step__num">03</div>
              <h3 className="kf-bsh-step__title">Zertifikat</h3>
              <p className="kf-bsh-step__body">Im Nachgang der Brandschutzhelfer Ausbildung erhalten Sie direkt ein Zertifikat nach ASR 2.2 und DGUV Information 205-023.</p>
            </article>
          </div>

          <div className="kf-bsh-steps__cta-row">
            <a href="#anfrage" className="kf-bsh-pill">
              Jetzt Infos und Termine anfordern
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 10h12M11 5l5 5-5 5" />
              </svg>
            </a>
          </div>
        </div>
      </section>

      {/* ============ Inhalte ============ */}
      <section className="kf-bsh-content">
        <div className="kf-bsh-content__inner">
          <h2 className="kf-bsh-content__headline">Inhalte der Ausbildung zum Brandschutzhelfer</h2>
          <ul className="kf-bsh-content__list">
            <li>Grundzüge des Brandschutzes</li>
            <li>Betriebliche Brandschutzorganisation</li>
            <li>Funktion und Wirkungsweise von Feuerlöscheinrichtungen</li>
            <li>Gefahren durch Brände</li>
            <li>Verhalten im Brandfall</li>
            <li>Praktisches Löschtraining</li>
          </ul>
        </div>
      </section>

      {/* ============ Hybrid ============ */}
      <section className="kf-bsh-hybrid">
        <div className="kf-bsh-hybrid__inner">
          <p className="kf-bsh-hybrid__eyebrow">07 — Flexibilität</p>
          <h2 className="kf-bsh-hybrid__headline">
            Auch <span className="kf-bsh-hybrid__accent">Hybrid</span> möglich.
          </h2>
          <div className="kf-bsh-hybrid__body">
            <p>Durch diese flexible Online-Option der theoretischen Brandschutzhelfer Ausbildung können Unternehmen Zeit und Kosten sparen, da die Teilnehmer die Theorie bequem von zu Hause oder am Arbeitsplatz aus erlernen können.</p>
            <p>Es ist keine langfristige Planung für Präsenzveranstaltungen notwendig, was den organisatorischen Aufwand und <strong>Ausfallzeiten minimiert</strong> und eine schnellere und effizientere Ausbildung ermöglicht.</p>
            <p>Der große Vorteil dieser Ausbildungsform ist, dass Sie nicht alle Ihre Mitarbeiterinnen und Mitarbeiter an einem Stück komplett einen halben Tag freistellen müssen.</p>
            <p>Im Nachgang wird dann nur noch die praktische Ausbildung bei Ihnen vor Ort durchgeführt.</p>
            <p className="kf-bsh-hybrid__note">Ausbildung auf Wunsch auch in Englisch durchführbar.</p>
          </div>
        </div>
      </section>

      {/* ============ Team ============ */}
      <section className="kf-bsh-team">
        <div className="kf-bsh-team__inner">
          <p className="kf-bsh-team__eyebrow">08 — Team</p>
          <h2 className="kf-bsh-team__headline">Ihr Expertenteam.</h2>

          <div className="kf-bsh-team__grid">
            <TeamPerson name="Björn Kuiper" role="Gesellschafter & Geschäftsführer" photo="https://kuiper-safety.de/bsd-assets/team-bjoern.png"
              quals={['Brandschutzsachverständiger', 'Fachkraft für Arbeitssicherheit', 'Gruppenführer Feuerwehr B III']} />
            <TeamPerson name="Kevin Thies" role="Ausbilder" photo="https://kuiper-safety.de/bsd-assets/team-kevin.png" quals={['Brandschutzbeauftragter']} />
            <TeamPerson name="Stefanie Kuiper" role="Leitung Personal" photo="https://kuiper-safety.de/bsd-assets/team-stefanie.jpeg" quals={['Assistentin der Geschäftsführung']} />
            <TeamPerson name="Sven Hoffbauer" role="Ausbilder" photo="https://kuiper-safety.de/bsd-assets/team-sven.png" quals={['Brandschutzbeauftragter']} />
            <TeamPerson name="Marc Roscher" role="Brandschutzbeauftragter" photo="https://kuiper-safety.de/bsd-assets/team-marc.jpeg" quals={['Fachinformatiker']} />
            <TeamPerson name="Stefan Lehwald" role="Ausbilder" photo="https://kuiper-safety.de/bsd-assets/team-stefan.png" quals={['Brandschutzbeauftragter']} />
            <TeamPerson name="Martin O'Flanagan" role="IT-Administrator / Backoffice" photo="https://kuiper-safety.de/bsd-assets/team-martin.png" quals={['Fachinformatiker', 'Brandschutzbeauftragter']} />
            <TeamPerson name="Florian Schmucker" role="Fachplaner Vorbeugender Brandschutz" photo="https://kuiper-safety.de/bsd-assets/team-florian.png"
              quals={['Feuerwehrpläne, Flucht- und Rettungspläne, Feuerwehrlaufkarten, Brandschutzpläne, Brandschutzkonzepte']} />
            <TeamPerson name="Markus Legros" role="Backoffice / Vertrieb" photo="https://kuiper-safety.de/bsd-assets/team-markus.png" quals={['Präventionsexperte']} />
          </div>
          <p className="kf-bsh-team__stand">Stand: 16.01.2026</p>
        </div>
      </section>

      {/* ============ Standort ============ */}
      <section className="kf-bsh-loc">
        <div className="kf-bsh-loc__inner">
          <p className="kf-bsh-loc__eyebrow">09 — Standort</p>
          <h2 className="kf-bsh-loc__big">
            Voerde<br /><span className="kf-bsh-loc__accent">Niederrhein.</span>
          </h2>
          <p className="kf-bsh-loc__body">Von hier aus betreuen wir Unternehmen in der gesamten Bundesrepublik rund um den organisatorischen Brandschutz. Unsere Partner, Kunden und Interessenten haben jederzeit die Möglichkeit uns besuchen zu kommen.</p>
          <a href="https://maps.google.com/?q=Friedrichsfelder+Stra%C3%9Fe+34,+46562+Voerde" target="_blank" rel="noopener noreferrer" className="kf-bsh-pill kf-bsh-pill--outline">
            Zur Anfahrtsbeschreibung
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 10h12M11 5l5 5-5 5" />
            </svg>
          </a>
        </div>
      </section>

      {/* ============ FAQ ============ */}
      <section className="kf-bsh-faq">
        <div className="kf-bsh-faq__inner">
          <p className="kf-bsh-faq__eyebrow">10 — Häufige Fragen</p>
          <h2 className="kf-bsh-faq__headline">
            Fragen zur <span className="kf-bsh-faq__accent">Brandschutzhelfer-Ausbildung</span>?
          </h2>

          <ul className="kf-bsh-faq__list">
            <FaqItem q="Geht die Brandschutzhelfer Ausbildung auch ohne praktische Ausbildung?"
              a="Nein. Für die Ausbildung zum Brandschutzhelfer ist zwingend eine praktische Ausbildung erforderlich." />
            <FaqItem q="Wie lange dauert die Ausbildung?"
              a="Für die Theorie sind mindestens 2 Unterrichtseinheiten à 45 Minuten vorzusehen. Im Anschluss erfolgt die praktische Ausbildung mit ca. 1 Unterrichtseinheit à 45 Minuten." />
            <FaqItem q="Welche Termine sind verfügbar?"
              a="Wir richten uns direkt nach Ihren betrieblichen Anforderungen und sichern Ihnen eine zeitnahe Durchführung an Ihrem Wunschtermin zu." />
            <FaqItem q="Sind die Inhalte aktuell?"
              a="Ja, die Inhalte sind immer auf dem aktuellsten Stand." />
            <FaqItem q="Gehen wir auf unseren Betrieb ein, oder ist es nur pauschal?"
              a="Selbstverständlich gehen wir auf Ihre betrieblichen Gegebenheiten und Besonderheiten ein, so dass Ihre Mitarbeiterinnen und Mitarbeiter nach der Ausbildung direkt umsetzbares Wissen erhalten." />
          </ul>
        </div>
      </section>

      {/* ============ Final CTA ============ */}
      <section className="kf-bsh-final">
        <div className="kf-bsh-final__inner">
          <p className="kf-bsh-final__eyebrow">11 — Jetzt starten</p>
          <h2 className="kf-bsh-final__headline">
            Starten Sie jetzt Ihre <span className="kf-bsh-final__accent">Ausbildung zum Brandschutzhelfer</span>.
          </h2>
          <ul className="kf-bsh-final__list">
            <li>Garantierte Ausbildungstermine.</li>
            <li>Wir kommen in Ihr Unternehmen.</li>
            <li>Sie haben immer einen persönlichen Ansprechpartner.</li>
            <li>Lerninhalte aktuell und betriebsspezifisch.</li>
            <li>Keine versteckten Kosten.</li>
          </ul>
          <a href="#anfrage" className="kf-bsh-pill kf-bsh-pill--cta kf-bsh-pill--lg">
            Jetzt Infos und Termine anfordern
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 10h12M11 5l5 5-5 5" />
            </svg>
          </a>
        </div>
      </section>

      {/* ============ Open Seminars ============ */}
      <section className="kf-bsh-open">
        <div className="kf-bsh-open__inner">
          <p className="kf-bsh-open__eyebrow">12 — Alternative</p>
          <h3 className="kf-bsh-open__headline">Nicht genug Teilnehmer? Kommen Sie zu uns.</h3>
          <p>Wir führen regelmäßig offene Brandschutzhelfer Seminare direkt bei uns am Standort in 46562 Voerde durch. Kostenlose Parkplätze sowie direkte Nahverkehrsanbindung vorhanden.</p>
        </div>
      </section>

      {/* ============ Footer 3-Teiler ============ */}
      <Section11FooterSpacer />
      <Section12Footer />
      <Section13Copyright />
    </>
  );
}

/* === Sub-Components für Wiederholungs-Listen === */

function TeamPerson({ name, role, photo, quals }: { name: string; role: string; photo: string; quals: string[] }) {
  return (
    <article className="kf-bsh-person">
      <div className="kf-bsh-person__photo">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photo} alt={name} loading="lazy" />
      </div>
      <h3 className="kf-bsh-person__name">{name}</h3>
      <p className="kf-bsh-person__role">{role}</p>
      <ul className="kf-bsh-person__quals">
        {quals.map((q, i) => <li key={i}>{q}</li>)}
      </ul>
    </article>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <li>
      <details>
        <summary>
          {q}
          <span className="kf-bsh-faq__chev"></span>
        </summary>
        <p>{a}</p>
      </details>
    </li>
  );
}

/* === Footer-Sections — 1:1 Port aus Section11FooterSpacer.astro + Section12Footer.astro + Section13Copyright.astro === */

function Section11FooterSpacer() {
  return <div style={{ height: 16, background: 'rgb(45,189,206)' }} aria-hidden="true" />;
}

function Section12Footer() {
  return (
    <footer
      style={{
        background: 'linear-gradient(45deg, rgb(11,26,77), rgb(18,90,110))',
        color: '#fff',
        padding: 'calc(60 * var(--kf-u)) calc(160 * var(--kf-u))',
        fontFamily: '"Figtree", system-ui, sans-serif',
      }}
    >
      <div style={{ maxWidth: 1425, margin: '0 auto', display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr 1fr', gap: 'calc(48 * var(--kf-u))' }}>
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/kuiper-logo-lp.png" alt="Kuiper Safety Systems" style={{ height: 56, width: 'auto', marginBottom: 16 }} />
          <p style={{ fontSize: 'calc(14 * var(--kf-u))', lineHeight: 1.6, color: 'rgba(255,255,255,0.85)', margin: 0 }}>
            Brandschutz-Komplettlösungen für Unternehmen in ganz Deutschland.
          </p>
        </div>

        <div>
          <h4 style={{ fontSize: 'calc(13 * var(--kf-u))', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgb(48,196,237)', margin: '0 0 calc(16 * var(--kf-u))', fontWeight: 700 }}>Kontakt</h4>
          <p style={{ fontSize: 'calc(14 * var(--kf-u))', lineHeight: 1.7, color: 'rgba(255,255,255,0.85)', margin: 0 }}>
            Kuiper Brandschutz GmbH<br />
            Friedrichsfelder Str. 34<br />
            46562 Voerde (Niederrhein)<br /><br />
            <a href="tel:+4928555910900" style={{ color: '#fff', textDecoration: 'none' }}>+49 2855 5910900</a><br />
            <a href="mailto:info@kuiper-safety.de" style={{ color: '#fff', textDecoration: 'none' }}>info@kuiper-safety.de</a>
          </p>
        </div>

        <div>
          <h4 style={{ fontSize: 'calc(13 * var(--kf-u))', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgb(48,196,237)', margin: '0 0 calc(16 * var(--kf-u))', fontWeight: 700 }}>Hinweis</h4>
          <p style={{ fontSize: 'calc(14 * var(--kf-u))', lineHeight: 1.6, color: 'rgba(255,255,255,0.85)', margin: 0 }}>
            Alle Angaben ohne Gewähr. Änderungen vorbehalten.
          </p>
        </div>

        <div style={{ textAlign: 'right' }}>
          <a href="#anfrage" style={{ color: 'rgb(48,196,237)', fontWeight: 700, fontSize: 'calc(14 * var(--kf-u))', textDecoration: 'none' }}>
            ↑ Nach oben
          </a>
        </div>
      </div>

      <div
        style={{
          maxWidth: 1425,
          margin: 'calc(40 * var(--kf-u)) auto 0',
          paddingTop: 'calc(24 * var(--kf-u))',
          borderTop: '1px solid rgba(255,255,255,0.15)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', gap: 'calc(24 * var(--kf-u))', fontSize: 'calc(13 * var(--kf-u))', color: 'rgba(255,255,255,0.7)' }}>
          <a href="https://kuiper-safety.de/impressum/" style={{ color: 'inherit', textDecoration: 'none' }}>Impressum</a>
          <a href="https://kuiper-safety.de/datenschutz/" style={{ color: 'inherit', textDecoration: 'none' }}>Datenschutz</a>
          <a href="https://kuiper-safety.de/agb/" style={{ color: 'inherit', textDecoration: 'none' }}>AGB</a>
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
          <a href="https://www.youtube.com/@kuiper-safety" target="_blank" rel="noopener noreferrer" aria-label="YouTube" style={{ color: 'rgba(255,255,255,0.8)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
          </a>
          <a href="https://www.linkedin.com/company/kuiper-brandschutz" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" style={{ color: 'rgba(255,255,255,0.8)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.063 2.063 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
          </a>
        </div>
      </div>
    </footer>
  );
}

function Section13Copyright() {
  return (
    <div
      style={{
        background: '#0D1B3E',
        color: 'rgba(255,255,255,0.6)',
        padding: '16px 24px',
        fontSize: 12,
        fontFamily: '"DM Sans", sans-serif',
        textAlign: 'center',
      }}
    >
      © 2026 Kuiper Safety Systems. Alle Rechte vorbehalten. &nbsp;·&nbsp; 🇩🇪 Made in Voerde, NRW
    </div>
  );
}
