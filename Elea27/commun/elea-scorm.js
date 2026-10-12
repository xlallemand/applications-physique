/* ============================================================
   Pont SCORM 1.2 : une page d'une application dans une activité
   « Paquetage SCORM » d'Éléa (Moodle).

   Ajouté dans les paquets fabriqués pour Éléa (dossier Elea27/),
   jamais dans l'application d'origine. À charger juste après
   assets/sommaire.js :
     <script src="../elea/elea-scorm.js" data-page="niveau-1" data-type="serie" data-spa></script>
       data-page : clé de la page du PLAN affichée par l'activité
       data-type : 'cours'     terminé à la dernière étape (SOM.marquer({ fait: true }))
                   'serie'     note sur 20 (SOM.marquer({ note })), la meilleure est gardée
                   'vue'       terminé à l'ouverture (fiche, exemple, simulation ; 'fiche' accepté)
                   'exercices' terminé quand tous les exercices de la liste sont faits, sans note ;
                               résultats gardés par Éléa (cmi.suspend_data)
       data-ex   : clé de stockage des résultats d'exercices (cleEx de SOM.init), type 'exercices'
       data-spa  : application en une seule page (les pages sont des ancres #cle)

   Ce que fait le pont :
   - ouvre l'application directement sur sa page et masque le sommaire :
     on passe d'une étape à l'autre avec le parcours Éléa ;
   - masque et désactive les liens vers les autres pages de l'application
     (leur note irait dans la mauvaise activité) ;
   - transmet à Éléa la note et l'achèvement, en s'accrochant à
     SOM.marquer (assets/sommaire.js) ;
   - garde la progression en mémoire plutôt que dans le navigateur
     (postes partagés entre élèves) ;
   - hors d'Éléa (pas d'API SCORM), l'application fonctionne sur sa page
     sans rien transmettre.
   ============================================================ */
(function () {
  'use strict';

  const moi = document.currentScript;
  const PAGE = moi.dataset.page;
  const TYPE = ({ fiche: 'vue' })[moi.dataset.type] || moi.dataset.type || 'cours';
  const SPA = moi.hasAttribute('data-spa');
  const CLE_EX = moi.dataset.ex || null;
  const SUR = 20;                         // les notes de l'application sont sur 20
  const debut = Date.now();

  /* ---------- Progression en mémoire (rien n'est écrit dans le navigateur) ---------- */
  const stock = new Map();
  const memoire = {
    getItem: k => (stock.has(String(k)) ? stock.get(String(k)) : null),
    setItem: (k, v) => {
      stock.set(String(k), String(v));
      if (String(k) === CLE_EX) exercicesEnregistres();
    },
    removeItem: k => { stock.delete(String(k)); },
    clear: () => { stock.clear(); },
    key: i => Array.from(stock.keys())[i] ?? null,
    get length() { return stock.size; },
  };
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

  // activité terminée (cours fini, page vue, série notée, exercices tous faits)
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

  /* ---------- Exercices : résultats gardés par Éléa, terminé quand tout est fait ---------- */
  let totalEx = 0;            // nombre d'exercices de la liste (cartes .ph-ex-carte de la charte)
  function nbFaits() {
    try { return Object.keys(JSON.parse(memoire.getItem(CLE_EX)) || {}).length; } catch (e) { return 0; }
  }
  function verifierExercices() {
    if (totalEx && nbFaits() >= totalEx) terminer(); else enregistrer();
  }
  // un résultat d'exercice vient d'être écrit par l'application
  function exercicesEnregistres() {
    if (TYPE !== 'exercices') return;
    ecrire('cmi.suspend_data', memoire.getItem(CLE_EX));        // 4 096 caractères au plus en SCORM 1.2
    verifierExercices();
  }

  if (api) {
    actif = String(api.LMSInitialize('')) === 'true';
    statut = lire('cmi.core.lesson_status');
    const s = parseFloat(lire('cmi.core.score.raw'));
    meilleure = isNaN(s) ? null : s;
    if (TYPE === 'exercices' && CLE_EX) {
      const d = lire('cmi.suspend_data');
      if (d) stock.set(CLE_EX, d);                 // résultats des séances précédentes
    }
    if (TYPE === 'vue') terminer();
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
  // lien vers une autre page de l'application (ou d'une autre application du dépôt) ?
  function autrePage(a) {
    const h = a.getAttribute('href');
    if (!h || /^(mailto|tel|javascript):/i.test(h)) return false;
    let u;
    try { u = new URL(h, location.href); } catch (e) { return false; }
    if (u.origin !== location.origin) return false;                  // site extérieur : lien gardé
    if (u.pathname === location.pathname) return SPA && u.hash !== '' && u.hash.slice(1) !== PAGE;
    return /\.html?$/i.test(u.pathname);
  }
  // ces liens sont masqués dès qu'ils apparaissent (fins de cours, de série, fiches…)
  function masquerLiens() {
    document.querySelectorAll('a[href]:not([data-elea])').forEach(a => {
      a.setAttribute('data-elea', '');
      if (autrePage(a)) a.style.setProperty('display', 'none', 'important');
    });
    if (TYPE === 'exercices') {
      const n = document.querySelectorAll('.ph-ex-carte[data-id]').length;
      if (n > totalEx) { totalEx = n; verifierExercices(); }
    }
  }
  new MutationObserver(masquerLiens).observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener('DOMContentLoaded', masquerLiens);
  // et sans effet s'ils étaient cliqués quand même
  document.addEventListener('click', e => {
    const a = e.target.closest && e.target.closest('a[href]');
    if (a && autrePage(a)) e.preventDefault();
  }, true);
  // sommaire masqué
  const style = document.createElement('style');
  style.textContent = '#app-nav { display: none !important; }';
  document.head.appendChild(style);

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
