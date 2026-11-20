/* ============================================================
   PLEIN ÉCRAN COMMUN (objet PLEIN) — bouton de toutes les pages de simulation
   et de manipulation (modèle : double-periodicite/).

   Utilisation, après SOM.menu(...) (le bandeau du haut doit exister) :
     <link rel="stylesheet" href="../../assets/plein-ecran.css">
     <script src="../../assets/plein-ecran.js"></script>
     PLEIN.bouton();                      // remplace l'élément [data-plein] de la page s'il existe
                                          // (page de module : dans la première carte, à droite du titre),
                                          // sinon s'ajoute à droite du bandeau .app-topbar (page unique)
     PLEIN.bouton({ ou: element });       // ou bien ajouté dans cet élément
     PLEIN.bouton({ surChange(on) {…} }); // rappel à chaque entrée / sortie

   Le bouton (icône quatre coins + « Plein écran », icône seule sur téléphone)
   passe toute la page en plein écran ; pendant le plein écran, la classe
   « pe-actif » sur <html> cache le sommaire et donne toute la largeur à la page.
   Sans plein écran du navigateur (iPhone), le bouton bascule seulement
   cette page sans sommaire (pas de bouton s'il n'y a pas de sommaire).
   ============================================================ */
(function () {
  'use strict';
  const racine = document.documentElement;
  const ICONE_ENTRER = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 9V3h6M21 9V3h-6M3 15v6h6M21 15v6h-6"/></svg>';
  const ICONE_SORTIR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 3v6H3M15 3v6h6M9 21v-6H3M15 21v-6h6"/></svg>';

  function bouton(opts) {
    opts = opts || {};
    const demander = racine.requestFullscreen || racine.webkitRequestFullscreen;
    const api = !!(demander && (document.fullscreenEnabled || document.webkitFullscreenEnabled));
    // sans plein écran du navigateur ni sommaire à cacher, le bouton ne servirait à rien
    if (!api && !racine.classList.contains('som-nav')) { const p = document.querySelector('[data-plein]'); if (p) p.remove(); return null; }
    const enPlein = () => !!(document.fullscreenElement || document.webkitFullscreenElement);
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'btn-small pe-bouton';
    let actif = false;
    // affichage du bouton et de la page selon l'état
    function regler(on) {
      actif = on;
      racine.classList.toggle('pe-actif', on);
      b.innerHTML = (on ? ICONE_SORTIR : ICONE_ENTRER) +
        `<span class="pe-texte">${on ? 'Quitter le plein écran' : 'Plein écran'}</span>`;
      b.setAttribute('aria-label', on ? 'Quitter le plein écran' : 'Plein écran');
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      // les figures se redessinent à leur nouvelle largeur
      setTimeout(() => dispatchEvent(new Event('resize')), 60);
      if (opts.surChange) opts.surChange(on);
    }
    b.addEventListener('click', () => {
      if (!api) { regler(!actif); return; }
      try {
        const r = enPlein() ? (document.exitFullscreen || document.webkitExitFullscreen).call(document) : demander.call(racine);
        if (r && r.catch) r.catch(() => regler(!actif));
      } catch (e) { regler(!actif); }   // plein écran refusé : page sans sommaire
    });
    // entrée / sortie (bouton, Échap, geste du navigateur)
    const suivre = () => regler(enPlein());
    document.addEventListener('fullscreenchange', suivre);
    document.addEventListener('webkitfullscreenchange', suivre);
    regler(false);
    const place = document.querySelector('[data-plein]');
    if (opts.ou) opts.ou.appendChild(b);
    else if (place) place.replaceWith(b);
    else { const barre = document.querySelector('.app-topbar'); if (barre) barre.appendChild(b); }
    return b;
  }

  window.PLEIN = { bouton };
})();
