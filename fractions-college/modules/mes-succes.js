/* ============================================================
   Fractions — les succès de l'application
   ------------------------------------------------------------
   Rôle : déclare les succès (moteur commun assets/succes.js, objet SUC),
   compte ce qu'il faut à chaque question et à chaque séance, et calcule
   l'état de départ d'après le suivi déjà enregistré (première fois).
   Chargé après fra.js (FRA.statut, FRA.C…).

   Compteurs (SUC, clé fractions-college-succes) :
     seances      séances terminées            sansFaute   séances à 20/20
     serie        questions justes sans erreur d'affilée (en cours) ; serieMax : record
     autonome     questions justes sans erreur et sans aide (rappel, indice, exemple)
     tenace       questions réussies après une erreur (1 point)
     difficiles   questions de difficulté 3 justes sans erreur
     fam-<famille>  questions de la famille justes sans erreur
   Jours : jours avec au moins une séance terminée.
   Ensemble « maitrisees » : compétences maîtrisées au moins une fois.

   API :
     FRA.succesApres(occasions, note)  appelé par FRA.enregistrer ; occasion : { r, ok, diff, aide } ;
                                      renvoie les nouveaux succès et les ajoute à FRA.nouveauxSucces
     FRA.nouveauxSucces                nouveaux succès depuis le chargement de la page
     FRA.carteSucces()                 carte « Mes succès » (page Mon suivi)
     FRA.blocSucces(liste)             bloc « Nouveaux succès » avec le lien vers Mon suivi (ou null)
   ============================================================ */
(function () {
  'use strict';
  const FRA = window.FRA, C = FRA.C;
  const APP = 'fractions-college';

  // compétences maîtrisées au moins une fois
  const maitrisees = E => C.liste.filter(c => (E.e.maitrisees || []).indexOf(c.id) >= 0).length;
  // icône de chaque famille (succès de famille)
  const ICONES = { EG: '⚖️', MD: '✖️', AS: '➕', RE: '➖', PR: '🧮' };

  const categories = [
    { nom: 'Régularité', succes: [
      { id: 'regulier', ic: '🔥', nom: 'Régulier', cond: 'Jours d’affilée avec au moins une séance terminée', seuils: [3, 7, 14, 30], u: 'j',
        val: E => SUC.serie(E.j).record, avance: E => SUC.serie(E.j).encours,
        astuce: E => {
          const s = SUC.serie(E.j);
          if (!s.record) return '';
          if (s.aujourdhui) return 'Série en cours : ' + FRA.pluriel(s.encours, 'jour') + '. Séance faite aujourd’hui ✓ : reviens demain pour la prolonger.';
          if (s.encours) return 'Série en cours : ' + FRA.pluriel(s.encours, 'jour') + '. Fais une séance aujourd’hui pour la prolonger.';
          return 'Record : ' + FRA.pluriel(s.record, 'jour') + ' d’affilée. Fais une séance aujourd’hui pour commencer une nouvelle série.';
        } },
      { id: 'assidu', ic: '📅', nom: 'Assidu', cond: 'Jours différents avec au moins une séance terminée', seuils: [5, 15, 30, 60], u: 'j', val: E => E.j.length },
      { id: 'infatigable', ic: '🎯', nom: 'Infatigable', cond: 'Séances terminées', seuils: [10, 25, 50, 100], val: E => E.c.seances || 0 }
    ] },
    { nom: 'Réussite', succes: [
      { id: 'sansfaute', ic: '⭐', nom: 'Sans faute', cond: 'Séances terminées avec 20/20', seuils: [1, 5, 15, 40], val: E => E.c.sansFaute || 0 },
      { id: 'inarretable', ic: '⚡', nom: 'Inarrêtable', cond: 'Questions justes sans erreur d’affilée', seuils: [10, 20, 40, 75],
        val: E => E.c.serieMax || 0, avance: E => E.c.serie || 0,
        astuce: E => (E.c.serieMax ? 'Série en cours : ' + (E.c.serie || 0) + ' · record : ' + E.c.serieMax + '. Une erreur ou la solution affichée remet la série à zéro.' : '') },
      { id: 'autonome', ic: '🧠', nom: 'Autonome', cond: 'Questions justes sans erreur et sans aucune aide (rappel, indice, exemple)', seuils: [20, 60, 150, 300], val: E => E.c.autonome || 0 },
      { id: 'tenace', ic: '💪', nom: 'Tenace', cond: 'Questions réussies après une erreur, sans afficher la solution', seuils: [5, 15, 40, 100], val: E => E.c.tenace || 0 },
      { id: 'hautniveau', ic: '🏔️', nom: 'Haut niveau', cond: 'Questions de difficulté 3 (nombres les plus grands) justes sans erreur', seuils: [5, 20, 50, 100], val: E => E.c.difficiles || 0 }
    ] },
    { nom: 'Compétences', succes: [
      { id: 'maitrise', ic: '🏅', nom: 'Maîtrise', cond: 'Compétences maîtrisées au moins une fois (Platine : toutes)',
        seuils: () => [3, 6, 10, C.liste.length], val: E => maitrisees(E) }
    ].concat(C.familles.map(f => ({
      id: 'famille-' + f.id, ic: ICONES[f.id] || '★', nom: f.nom, cond: 'Questions de la famille justes sans erreur',
      seuils: [5, 15, 30, 50], val: E => E.c['fam-' + f.id] || 0
    }))) }
  ];

  // état de départ (première fois) : calculé d'après le suivi déjà enregistré
  function depart() {
    let v = null;
    try { v = JSON.parse(localStorage.getItem(APP + '-suivi')); } catch (e) { v = null; }
    const c = {}, j = [];
    if (v && typeof v === 'object') {
      const notes = Array.isArray(v.notes) ? v.notes.filter(x => Array.isArray(x) && x.length === 3) : [];
      c.seances = notes.length;
      c.sansFaute = notes.filter(x => x[2] === 20).length;
      notes.forEach(x => j.push(SUC.jourDe(x[0])));
      // toutes les questions, dans l'ordre (avec leur famille) : réussites après erreur, séries sans erreur, réussites par famille
      const q = [];
      if (v.r && typeof v.r === 'object') Object.keys(v.r).forEach(k => {
        if (C.R[k] && Array.isArray(v.r[k])) v.r[k].forEach(x => { if (Array.isArray(x)) q.push([x[0], x[1], C.R[k].famille]); });
      });
      q.sort((a, b) => a[0] - b[0]);
      c.tenace = q.filter(x => x[1] === 0.5).length;
      let s = 0, m = 0;
      q.forEach(x => {
        s = x[1] === 1 ? s + 1 : 0; if (s > m) m = s;
        if (x[1] === 1) c['fam-' + x[2]] = (c['fam-' + x[2]] || 0) + 1;
      });
      c.serie = s; c.serieMax = m;
    }
    const e = { maitrisees: C.liste.filter(x => FRA.statut(x.id) === 'm').map(x => x.id) };
    return { c, j, e };
  }

  SUC.init({ app: APP, categories, depart });

  // compétences maîtrisées maintenant : ajoutées à l'ensemble (gardées pour toujours)
  const noterMaitrisees = () => SUC.reunir('maitrisees', C.liste.filter(x => FRA.statut(x.id) === 'm').map(x => x.id));

  // première fois : l'état de départ est enregistré tout de suite (niveaux déjà atteints, sans annonce),
  // avant que la question suivante ne s'ajoute au suivi
  try { if (localStorage.getItem(APP + '-succes') === null) { noterMaitrisees(); SUC.verifier(); } } catch (e) { /* stockage indisponible */ }

  const nouveauxSucces = [];
  // après chaque question (occasions) et à la fin d'une séance (note)
  function succesApres(occasions, note) {
    occasions.forEach(o => {
      if (o.ok === 1) {
        const E = SUC.etat();
        SUC.fixer('serie', (E.c.serie || 0) + 1);
        SUC.record('serieMax', (E.c.serie || 0) + 1);
        if (!o.aide) SUC.ajouter('autonome');
        if (o.diff === 3) SUC.ajouter('difficiles');
        if (C.R[o.r]) SUC.ajouter('fam-' + C.R[o.r].famille);
      } else {
        SUC.fixer('serie', 0);
        if (o.ok === 0.5) SUC.ajouter('tenace');
      }
    });
    if (note != null) {
      SUC.ajouter('seances');
      if (note === 20) SUC.ajouter('sansFaute');
      SUC.jour();
    }
    noterMaitrisees();
    const n = SUC.verifier();
    n.forEach(x => {
      const i = nouveauxSucces.findIndex(y => y.s === x.s);
      if (i < 0) nouveauxSucces.push(x); else if (x.niv > nouveauxSucces[i].niv) nouveauxSucces[i] = x;
    });
    return n;
  }

  // carte « Mes succès » : niveaux à jour (compétences maîtrisées, copie restaurée)
  function carteSucces() {
    noterMaitrisees();
    SUC.verifier();
    return SUC.carte();
  }

  const blocSucces = liste => SUC.blocNouveaux(liste, 'suivi.html#succes');

  Object.assign(FRA, { succesApres, nouveauxSucces, carteSucces, blocSucces });
})();
