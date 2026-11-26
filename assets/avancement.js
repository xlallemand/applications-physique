/* ============================================================
   Avancement de chaque application, affiché sur le portail (x/y)
   (portail seulement, voir docs/charte-applications.md §4 et §5)

   Même décompte que les compteurs n/m des modules sur l'accueil de
   chaque application (assets/sommaire.js, et CIN / TE dans
   Cinématique et Transport de l'électricité) :
   - une page par simulation, cours, exemple, série, entraînement…
     (faite quand elle est terminée ou qu'elle a une note) ;
   - plus chaque exercice d'un module d'exercices à nbEx exercices
     (un exercice est compté dès qu'il a un résultat).
   y = somme des compteurs des modules de l'accueil de l'application.

   AVANCEMENT[dossier] = { pages: [clés des pages comptées], ex: nombre d'exercices comptés, strict }
     dossier : sa valeur dans APPS du portail (aussi l'id de SOM.init)
     pages   : toutes les pages du PLAN qui comptent, dans l'ordre du plan
               (une page d'exercices sans nbEx compte pour une page)
     ex      : somme des nbEx du PLAN (absent s'il n'y en a pas)
     strict  : décompte de CIN et TE (moteurs propres) : une série (…_questions)
               compte quand elle a une note, une autre page quand elle est terminée
   Page externe ↗ du PLAN (module situé dans une autre application, charte §5) :
     '↗<app>/<page>' dans pages, à sa place dans l'ordre du plan
     (ex. '↗double-periodicite/index', '↗pile/module_1_pile') ; elle compte avec
     l'état de l'autre application : faite si <app>-progression a cette page
     terminée ou notée ('index' : dès que <app>-progression existe).
   À METTRE À JOUR quand le PLAN d'une application change.
   Une application absente de la liste (simulation sans plan :
   décroissance radioactive) n'affiche pas d'avancement.

   Progression lue dans le navigateur (jamais écrite) :
     localStorage <dossier>-progression = { pages: { <page>: { fait, note } } }   (et <app>-progression des pages ↗)
     localStorage <dossier>-exercices   = { <id>: { pts, max } }

   API (objet AV) :
     AV.avancement(dossier)   { fait, total } ou null (pas d'avancement)
   ============================================================ */
(function () {
  'use strict';

  const AVANCEMENT = {
    'energie-puissance': { ex: 10, pages: [
      'module_1_simulation', 'module_1_cours', 'module_1_questions', 'module_2_cours',
      'module_2_questions', 'module_3_cours', 'module_3_questions'] },
    'piles-accumulateurs': { ex: 5, pages: [
      'module_1_cours', 'module_1_questions', 'module_2_cours', 'module_2_questions', 'module_3_cours',
      'module_3_questions', 'module_4_cours', 'module_4_questions'] },
    'puissance-active': { pages: [
      'module_1', 'module_2', 'module_3_cours', 'module_3_questions', 'module_4_cours',
      'module_4_exercices'] },
    'transport-electricite': { ex: 14, strict: true, pages: [
      'module_1_cours', 'module_1_questions', 'module_2_simulation', 'module_2_cours',
      'module_2_questions', 'module_3_cours', 'module_3_questions', 'module_4_cours'] },
    'transferts-thermiques': { ex: 10, pages: [
      'module_1_cours', 'module_1_questions', 'module_2_cours', 'module_2_questions', 'module_3_cours',
      'module_3_questions', 'module_4_cours', 'module_4_questions'] },
    'bilan-forces': { pages: [
      'module_1a_cours', 'module_1b_cours', 'module_1_questions', 'module_2_cours', 'module_2_questions',
      'module_3a_cours', 'module_3b_cours', 'module_3f_cours', 'module_3c_cours', 'module_3e_cours', 'module_3d_cours',
      'module_3_questions', 'module_4_cours', 'module_4_questions', 'module_5a_cours', 'module_5b_cours',
      'module_5_questions', 'module_6_simulation', 'module_6_questions'] },
    'lois-newton': { ex: 20, pages: [
      'module_1_cours', '↗bilan-forces/module_6_simulation', 'module_2_cours', 'module_2_questions',
      'module_3a_cours', 'module_3b_cours', 'module_3_simulation', 'module_3_questions',
      'module_4a_cours', 'module_4b_cours', 'module_4c_cours', 'module_4d_cours', 'module_4e_cours',
      'module_4_simulation', 'module_4_questions'] },
    'champ-uniforme': { ex: 18, pages: [
      'module_1_cours', 'module_1_questions',
      'module_2_cours', 'module_2_questions',
      'module_3a_cours', 'module_3b_cours', 'module_3c_cours', 'module_3d_cours', 'module_3_simulation', 'module_3_questions',
      'module_4a_cours', 'module_4b_cours', 'module_4c_cours', 'module_4d_cours', 'module_4_simulation', 'module_4_questions',
      'module_5a_cours', 'module_5b_cours', 'module_5_simulation', 'module_5_questions'] },
    'forces-vitesse': { pages: ['↗bilan-forces/module_6_simulation', 'module_2_cours', 'module_2_questions'] },
    'principe-dynamique': { ex: 11, pages: [
      'module_1_cours', 'module_1_questions', '↗bilan-forces/module_6_simulation',
      'module_3a_cours', 'module_3b_cours', 'module_3c_cours', 'module_3d_cours', 'module_3e_cours',
      'module_3_questions', 'module_4a_cours', 'module_4b_cours', 'module_4c_cours', 'module_4d_cours',
      'module_4_questions'] },
    'energie-cinetique': { ex: 2, pages: [
      'module_1_simulation', 'module_1_cours', 'module_1_questions', 'module_2_simulation',
      'module_2a_cours', 'module_2b_cours', 'module_2c_cours', 'module_2d_cours', 'module_2_questions',
      'module_3a_cours', 'module_3b_cours', 'module_3c_cours', 'module_3d_cours', 'module_3_questions',
      'module_4a_cours', 'module_4b_cours', 'module_4c_cours', 'module_4d_cours', 'module_4e_cours',
      'module_4f_cours', 'module_4_questions'] },
    'mouvements-rotation': { ex: 9, pages: [
      'module_1_cours', 'module_1_questions', 'module_2_cours', 'module_2_questions', 'module_3a_cours',
      'module_3b_cours', 'module_3_questions', 'module_4_cours', 'module_4_questions'] },
    'statique-fluides': { ex: 9, pages: [
      'module_1_cours', 'module_1_questions', 'module_2_cours', 'module_2_questions', 'module_3a_cours',
      'module_3b_cours', 'module_3_questions', 'module_4_cours', 'module_4_questions'] },
    'energie-lumiere': { ex: 5, pages: [
      'module_1_simulation', 'module_1_cours', 'module_1_questions', 'module_2_cours',
      'module_2_questions', 'module_3a_cours', 'module_3b_simulation', 'module_3b_cours',
      'module_3_questions', 'module_4_cours', 'module_4_questions'] },
    'changements-etat': { ex: 8, pages: [
      'module_1_cours', 'module_1_questions', 'module_2a_cours', 'module_2b_cours', 'module_2_questions',
      'module_3_cours', 'module_3_questions', 'module_4_cours', 'module_4_questions', 'module_5a_cours',
      'module_5b_cours', 'module_5c_cours', 'module_5_entrainement', 'module_5_questions'] },
    'radioactivite': { ex: 11, pages: [
      'module_1_simulation', 'module_1_cours', 'module_1_questions', 'module_2a_cours', 'module_2b_cours',
      'module_2_questions', 'module_3_cours', 'module_3_questions', 'module_4a_cours', 'module_4b_cours',
      'module_4_questions', 'module_5a_cours', 'module_5b_cours', 'module_5c_cours', 'module_5_questions'] },
    'energie-nucleaire': { ex: 7, pages: [
      'module_1a_cours', 'module_1b_cours', 'module_1_questions', 'module_2a_cours', 'module_2b_cours',
      'module_2_questions', 'module_3a_cours', 'module_3b_cours', 'module_3_questions'] },
    'spectre-signal': { ex: 6, pages: [
      'module_1_simulation', 'module_1_cours', 'module_1_questions', 'module_2a_cours', 'module_2b_cours',
      'module_2_questions', 'module_3a_cours', 'module_3b_cours', 'module_3_questions'] },
    'ondes-sonores': { ex: 8, pages: [
      'module_1_cours', 'module_1_questions', 'module_2_simulation', 'module_2_cours', 'module_2_questions',
      'module_3a_cours', 'module_3b_cours', 'module_3_questions', 'module_4_simulation', 'module_4a_cours',
      'module_4b_cours', 'module_4_questions'] },
    'ondes-electromagnetiques': { ex: 7, pages: [
      'module_1a_cours', 'module_1b_cours', 'module_1_questions', 'module_2a_cours', 'module_2b_cours',
      'module_2_questions', 'module_3_simulation', 'module_3a_cours', 'module_3b_cours',
      'module_3_questions', 'module_4_cours', 'module_4_questions'] },
    'spectres-etoiles': { pages: ['module_1', 'module_2', 'module_3', 'module_4'] },
    'periode-frequence': { pages: ['module_1_manip', 'module_2_manip', 'module_3a_carreaux', 'module_3b_curseurs', 'module_4_questions'] },
    'refraction': { pages: ['module_1_manip', 'module_2_simulation', 'module_3a_cours', 'module_3b_manip', 'module_3c_manip', 'module_4_questions', 'module_5_simulation', 'module_5_manip'] },
    'lentilles': { pages: ['module_1_questions', 'module_2_simulation', 'module_3a_manip', 'module_3b_simulation'] },
    'montage-electrique': { pages: ['module_1a_manip', 'module_1b_simulateur', 'module_2_manip', 'module_3_manip', 'module_3b_oscilloscope'] },
    'oscilloscope': { pages: ['module_1a_carreaux', 'module_1b_curseurs', 'module_2a_carreaux', 'module_2b_curseurs',
      'module_3a_carreaux', 'module_3b_curseurs', 'module_4_intensite'] },
    'atome-ions': { pages: ['module_1_simulation', 'module_2_questions', 'module_3_simulation', 'module_4_questions'] },
    'classification-periodique': { pages: ['module_1_simulation', 'module_2_manip', 'module_3_questions'] },
    'lewis': { pages: ['module_1_manip', 'module_2_manip', 'module_3_manip', 'module_4_questions'] },
    'chromatographie': { pages: ['module_1_simulation', 'module_2_manip', 'module_2_rf', 'module_3_questions'] },
    'cinematique': { ex: 16, strict: true, pages: [
      'module_1_cours', 'module_1_questions', 'module_2_cours', 'module_2_questions', 'module_2b_cours',
      'module_2b_questions', 'module_3_cours', 'module_3_questions', 'module_4a_cours',
      'module_4a_questions', 'module_4b_cours', 'module_4b_questions', 'module_4c_cours',
      'module_4c_questions', 'module_4d_cours', 'module_4d_questions', 'module_5_cours',
      'module_5_questions'] },
    'rappels-1ere-sti2d': { ex: 6, pages: ['module_1_cours', 'module_1_questions', 'module_2_cours', 'module_2_questions'] },
    'combustions': { ex: 9, pages: [
      'module_1', 'module_2_cours', 'module_2', 'module_3a_cours', 'module_3b_cours', 'module_3',
      'module_4_cours', 'module_4', 'module_5_cours', 'module_5', 'module_6', 'module_6_entrainement'] },
    'oxydoreduction-STI2D': { ex: 11, pages: [
      'module_1_cours', 'module_1_questions', 'module_2_cours', 'module_2_reactions', 'module_3a_cours',
      'module_3b_cours', 'module_3_questions', 'module_4_cours', 'module_4_questions', 'module_5_cours',
      'module_5_pile'] },
    'acides-bases': { ex: 10, pages: [
      'module_1_cours', 'module_1_questions', 'module_2_cours', 'module_2_questions', 'module_3a_cours',
      'module_3b_cours', 'module_3c_cours', 'module_3_questions', 'module_4_cours', 'module_4_questions'] },
    'pile': { pages: ['module_1_cours', 'module_1_pile'] },
    'oxydoreduction-spe': { pages: [
      'module_1a_cours', 'module_1b_cours', 'module_1c_cours', 'module_1d_cours', 'module_1_questions',
      'module_2a_cours', 'module_2b_cours', 'module_2_questions', 'module_3_cours', 'module_3_questions',
      'module_4_cours', 'module_4'] },
    'equilibrer-reactions': { pages: ['module_1', 'module_2', 'module_3', 'module_4'] },
    'avancement-reaction': { pages: [
      'module_1', 'module_2', 'module_3', 'module_4', 'module_5', 'module_6', 'module_7',
      'module_7_entrainement'] },
    'nomenclature': { ex: 9, pages: [
      'module_1a_cours', 'module_1b_cours', 'module_1c_cours', 'module_1_dessin', 'module_1_libre', 'module_1_conversion', 'module_1_questions',
      'module_2a_cours', 'module_2b_cours', 'module_2c_cours', 'module_2d_cours', 'module_2_nommer', 'module_2_dessiner', 'module_2_questions',
      'module_3a_cours', 'module_3b_cours', 'module_3c_cours', 'module_3d_cours', 'module_3e_cours', 'module_3_entourer', 'module_3_nommer', 'module_3_dessiner', 'module_3_questions'] },
    'nomenclature-1re': { ex: 5, pages: [
      'module_1a_cours', 'module_1b_cours', 'module_1_dessin', 'module_1_libre', 'module_1_conversion', 'module_1_questions',
      'module_2a_cours', 'module_2b_cours', 'module_2c_cours', 'module_2d_cours', 'module_2_nommer', 'module_2_dessiner', 'module_2_questions',
      'module_3a_cours', 'module_3b_cours', 'module_3_entourer', 'module_3_nommer', 'module_3_dessiner', 'module_3_questions',
      'module_5a_cours', 'module_5b_cours', 'module_5_conversion', 'module_5_questions'] },
    'ph': { ex: 17, pages: ['module_1_cours', 'module_1_questions', 'module_2_cours', 'module_2_questions'] },
    'titrage-ph': { pages: ['module_1a_dilution', 'module_1b_montage', 'module_2_titrage', 'module_3a_equivalence', 'module_3b_regressi', 'module_3c_titre', 'module_4_incertitudes'] },
    'titrage-conductimetrique': { pages: ['module_1_animation'] },
    'puissances-10': { pages: ['course-1', 'training-1', 'course-2', 'training-2', 'course-3', 'training-3', 'training-4'] },
    'conversions': { pages: [
      'cours', 'astuces', 'prefixes', 'niveau-1', 'niveau-2', 'niveau-3', 'niveau-4', 'cours-sq', 'ex-sq',
      'cours-comp', 'ex-comp'] },
    'equations-en-physique': { pages: [
      'module_1', 'module_2', 'module_3', 'module_4', 'module_5', 'module_6', 'module_7', 'module_8',
      'module_9'] },
    'proportionnalite': { pages: [
      'module_1', 'module_2', 'module_3', 'module_4', 'module_5', 'module_6', 'module_7', 'module_8',
      'module_9'] },
    'lecture-graphique': { pages: ['module_1', 'module_2', 'module_3'] },
    'equations-physique-mobile': { pages: ['decouverte', 'seance', 'suivi', 'fiches'] },
    'calcul-numerique': { pages: ['decouverte', 'seance', 'defi', 'suivi', 'fiches'] },
    'equations-college': { pages: ['seance', 'suivi', 'fiches'] },
    'fractions-college': { pages: ['seance', 'suivi', 'fiches'] }
  };

  // lecture d'une clé du navigateur (stockage indisponible ou valeur abîmée : objet vide)
  function lire(cle) {
    try {
      const v = JSON.parse(localStorage.getItem(cle));
      return v && typeof v === 'object' && !Array.isArray(v) ? v : {};
    } catch (e) { return {}; }
  }

  // page externe ↗ '<app>/<page>' : état lu dans la progression de l'autre application (même règle que assets/sommaire.js)
  function externeFaite(ref) {
    const k = ref.indexOf('/'), app = ref.slice(0, k), page = ref.slice(k + 1);
    let existe = false;
    try { existe = localStorage.getItem(app + '-progression') != null; } catch (e) { /* stockage indisponible */ }
    if (page === 'index') return existe;
    const e = (lire(app + '-progression').pages || {})[page] || {};
    return !!e.fait || e.note != null;
  }

  // { fait, total } d'une application, null si elle n'a pas d'avancement
  function avancement(dossier) {
    const a = Object.prototype.hasOwnProperty.call(AVANCEMENT, dossier) ? AVANCEMENT[dossier] : null;
    if (!a) return null;
    const pages = lire(dossier + '-progression').pages || {};
    // une page est faite quand elle est terminée ou qu'elle a une note (strict : selon le type de page)
    const faite = p => {
      if (p[0] === '↗') return externeFaite(p.slice(1));
      const e = pages[p] || {};
      if (a.strict) return /_questions$/.test(p) ? e.note != null : !!e.fait;
      return !!e.fait || e.note != null;
    };
    const faites = a.pages.filter(faite).length;
    const ex = a.ex ? Math.min(a.ex, Object.keys(lire(dossier + '-exercices')).length) : 0;
    return { fait: faites + ex, total: a.pages.length + (a.ex || 0) };
  }

  window.AV = { avancement };
})();
