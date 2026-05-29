// Clarity Loader — wartet auf statistik-Consent (1:1 wie www.kuiper-safety.de)
export default function TrackingClarity() {
  const snippet = `(function(){const CLARITY_ID = "wwb7ihptp7";
    (function(){
      function loadClarity(){
        if (window.__clarityLoaded) return;
        window.__clarityLoaded = true;
        (function(c,l,a,r,i,t,y){
          c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
          t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
          y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
        })(window, document, "clarity", "script", CLARITY_ID);
      }
      function check(){
        if (window.kuiperConsent && window.kuiperConsent.has('statistik')) loadClarity();
      }
      check();
      window.addEventListener('kuiper-consent-change', check);
    })();
  })();`;
  return <script dangerouslySetInnerHTML={{ __html: snippet }} />;
}
