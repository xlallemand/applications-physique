/* ============================================================
   Pont SCORM 1.2 : une page d'une application dans une activité
   « Paquetage SCORM » d'Éléa (Moodle).

   Ajouté dans les paquets fabriqués pour Éléa (dossier Elea27/),
   jamais dans l'application d'origine. À charger juste après
   assets/sommaire.js :
     <script src="../elea/elea-scorm.js" data-page="niveau-1" data-type="serie" data-spa></script>
       data-page : clé de la page du PLAN affichée par l'activité
       data-type : 'cours' (terminé à la dernière étape),
                   'serie' (note sur 20, la meilleure est gardée),
                   'fiche' (terminée à l'ouverture)
       data-spa  : application en une seule page (les pages sont des ancres #cle)

   Ce que fait le pont :
   - ouvre l'application directement sur sa page et masque le sommaire :
     on passe d'une étape à l'autre avec le parcours Éléa ;
   - empêche d'aller sur une autre page de l'application (sa note irait
     dans la mauvaise activité) ;
   - transmet à Éléa la note sur 20 des séries et l'achèvement, en
     s'accrochant à SOM.marquer (assets/sommaire.js) ;
   - garde la progression en mémoire plutôt que dans le navigateur
     (postes partagés entre élèves) ;
   - hors d'Éléa (pas d'API SCORM), l'application fonctionne sur sa page
     sans rien transmettre.
   ============================================================ */
(function () {
  'use strict';

  const moi = document.currentScript;
  const PAGE = moi.dataset.page;
  const TYPE = moi.dataset.type || 'cours';
  const SPA = moi.hasAttribute('data-spa');
  const SUR = 20;                         // les notes de l'application sont sur 20
  const debut = Date.now();

  /* ---------- Progression en mémoire (rien n'est écrit dans le navigateur) ---------- */
  const memoire = (function () {
    const m = new Map();
    return {
      getItem: k => (m.has(String(k)) ? m.get(String(k)) : null),
      setItem: (k, v) => { m.set(String(k), String(v)); },
      removeItem: k => { m.delete(String(k)); },
      clear: () => { m.clear(); },
      key: i => Array.from(m.keys())[i] ?? null,
      get length() { return m.size; },
    };
  })();
  try { Object.defineProperty(window, 'localStorage', { value: memoire, configurable: true }); } catch (e) { /* tant pis : stockage du navigateur */ }

  /* ---------- API SCORM 1.2 : fenêtre parente (lecteur Moodle) ou fenêtre ouvrante ---------- */
  function chercherAPI(w) {
    for (let n = 0; w && n < 10; n++) {
      try { if (w.API) return w.API; } catch (e) { return null; }   // fenêtre d'une autre origine
      if (w.parent === w) break;
      w = w.parent;
    }
    return null;
  }
  const api = chercherAPI(window.parent !== window ? window.parent : null) || (window.opener ? chercherAPI(window.opener) : null);
  let actif = false;
  const lire = e => (actif ? String(api.LMSGetValue(e)) : '');
  const ecrire = (e, v) => { if (actif) api.LMSSetValue(e, String(v)); };
  const enregistrer = () => { if (actif) api.LMSCommit(''); };

  let statut = '';            // cmi.core.lesson_status de la tentative en cours
  let meilleure = null;       // meilleure note déjà transmise dans cette tentative

  // activité terminée (cours fini, fiche ouverte, série notée)
  function terminer() {
    if (statut !== 'completed') { ecrire('cmi.core.lesson_status', 'completed'); statut = 'completed'; }
    enregistrer();
  }
  // note sur 20 d'une série : on ne transmet que si elle est meilleure
  function noter(note) {
    if (meilleure === null || note > meilleure) {
      ecrire('cmi.core.score.min', 0);
      ecrire('cmi.core.score.max', SUR);
      ecrire('cmi.core.score.raw', note);
      meilleure = note;
    }
    terminer();
  }

  if (api) {
    actif = String(api.LMSInitialize('')) === 'true';
    statut = lire('cmi.core.lesson_status');
    const s = parseFloat(lire('cmi.core.score.raw'));
    meilleure = isNaN(s) ? null : s;
    if (TYPE === 'fiche') terminer();
    else if (statut === '' || statut === 'not attempted') { ecrire('cmi.core.lesson_status', 'incomplete'); statut = 'incomplete'; enregistrer(); }
  }

  // durée de la séance au format SCORM 1.2 (HH:MM:SS)
  const deux = n => String(n).padStart(2, '0');
  function duree(ms) {
    const s = Math.round(ms / 1000);
    return `${deux(Math.floor(s / 3600))}:${deux(Math.floor(s / 60) % 60)}:${deux(s % 60)}`;
  }
  // fin de séance (bouton « Quitter l'activité » d'Éléa, fermeture de la page)
  let fini = false;
  function quitter() {
    if (!actif || fini) return;
    fini = true;
    ecrire('cmi.core.session_time', duree(Date.now() - debut));
    ecrire('cmi.core.exit', statut === 'completed' ? '' : 'suspend');
    api.LMSFinish('');
  }
  addEventListener('pagehide', quitter);
  addEventListener('beforeunload', quitter);

  /* ---------- Une seule page : celle de l'activité ---------- */
  const versPage = () => history.replaceState(null, '', location.pathname + location.search + '#' + PAGE);
  if (SPA) {
    if (location.hash.slice(1) !== PAGE) versPage();
    // un lien ou le retour arrière vers une autre page ne change rien (écouteur placé avant celui de l'application)
    addEventListener('hashchange', e => {
      if (location.hash.slice(1) !== PAGE) { e.stopImmediatePropagation(); versPage(); }
    });
  }
  // liens de fin de cours et de fiche vers les autres pages : masqués ; sommaire masqué
  const style = document.createElement('style');
  style.textContent = `#app-nav { display: none !important; }
    .er-actions a[href]:not([href="#${PAGE}"]):not([href="${PAGE}.html"]) { display: none !important; }`;
  document.head.appendChild(style);
  // tout autre lien vers une page de l'application est sans effet
  document.addEventListener('click', e => {
    const a = e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    const h = a.getAttribute('href');
    const autre = SPA ? (h.startsWith('#') && h.slice(1) !== PAGE) : (/^[\w-]+\.html(#.*)?$/.test(h) && !h.startsWith(PAGE + '.html'));
    if (autre) e.preventDefault();
  }, true);

  /* ---------- Accroche au module commun de navigation (assets/sommaire.js) ---------- */
  const SOM = window.SOM;
  if (SOM) {
    SOM.menu = function () {};          // pas de sommaire ni de bandeau : la navigation est celle d'Éléa
    SOM.accueil = function () {};
    const marquerApp = SOM.marquer;
    SOM.marquer = function (info, cle) {
      marquerApp(info, cle);
      if ((cle || PAGE) !== PAGE) return;
      if (TYPE === 'serie' && info.note != null) noter(info.note);
      else if (TYPE === 'cours' && info.fait) terminer();
    };
  }
})();
