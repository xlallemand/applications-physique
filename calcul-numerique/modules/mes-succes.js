/* ============================================================
   Calcul numérique — les succès de l'application
   (même fonctionnement que modules/mes-succes.js de l'application Équations en physique)
   ------------------------------------------------------------
   Rôle : déclare les succès (moteur commun assets/succes.js, objet SUC),
   compte ce qu'il faut à chaque question, à chaque séance et à chaque défi,
   et calcule l'état de départ d'après le suivi déjà enregistré (première fois).
   Chargé après cn.js (CN.statut, CN.C, CN.decouverteFaits…) et defi.js (CN.lireDefi).

   Compteurs (SUC, clé calcul-numerique-succes) :
     seances      séances terminées            sansFaute   séances à 20/20
     serie        questions sans erreur d'affilée (en cours) ; serieMax : record
     autonome     questions réussies sans erreur et sans aide (rappel, indice, exemple)
     tenace       questions réussies après une erreur (1 point)
     difficiles   questions de difficulté 3 réussies sans erreur
     defis        défis chrono terminés ; defisReussis : 10/10 en moins de 2 minutes
     defiRapide   meilleur niveau de vitesse d'un défi à 10/10 (1 : < 2 min, 2 : < 1 min 30, 3 : < 1 min, 4 : < 45 s)
   Jours : jours avec au moins une séance ou un défi terminé.
   Ensemble « maitrisees » : compétences maîtrisées au moins une fois.

   API :
     CN.succesApres(occasions, note)  appelé par CN.enregistrer (séances, défi) et par la Découverte ;
                                      occasion : { r, ok, diff, aide } ; renvoie les nouveaux succès
                                      et les ajoute à CN.nouveauxSucces
     CN.succesDefi(justes, temps)     fin d'un défi chrono (temps en dixièmes de seconde) : nouveaux succès
     CN.nouveauxSucces                nouveaux succès depuis le chargement de la page
     CN.carteSucces()                 carte « Mes succès » (page Mon suivi)
     CN.blocSucces(liste)             bloc « Nouveaux succès » avec le lien vers Mon suivi (ou null)
   ============================================================ */
(function () {
  'use strict';
  const CN = window.CN, C = CN.C;
  const APP = 'calcul-numerique';
  const pl = (n, mot) => n + ' ' + mot + (n > 1 ? 's' : '');

  // compétences (toutes, ou celles d'une famille)
  const ids = fam => C.liste.filter(c => !fam || c.famille === fam).map(c => c.id);
  // compétences maîtrisées au moins une fois
  const maitrisees = (E, fam) => ids(fam).filter(id => (E.e.maitrisees || []).indexOf(id) >= 0).length;
  // seuils d'une famille : 25 %, 50 %, 75 % et toutes ses compétences
  const seuilsFamille = fam => () => { const n = ids(fam).length; return [0.25, 0.5, 0.75, 1].map(x => Math.max(1, Math.ceil(x * n))); };
  // niveau de vitesse d'un défi à 10/10 (temps en dixièmes de seconde)
  const niveauVitesse = t => t < 450 ? 4 : t < 600 ? 3 : t < 900 ? 2 : t < 1200 ? 1 : 0;
  const famille = (id, ic) => { const f = C.familles.find(x => x.id === id); return { id: 'famille-' + id, ic, nom: f.nom, cond: 'Compétences de la famille maîtrisées au moins une fois', seuils: seuilsFamille(id), val: E => maitrisees(E, id) }; };

  const categories = [
    { nom: 'Régularité', succes: [
      { id: 'regulier', ic: '🔥', nom: 'Régulier', cond: 'Jours d’affilée avec au moins une séance ou un défi terminé', seuils: [3, 7, 14, 30], u: 'j',
        val: E => SUC.serie(E.j).record, avance: E => SUC.serie(E.j).encours,
        astuce: E => {
          const s = SUC.serie(E.j);
          if (!s.record) return '';
          if (s.aujourdhui) return 'Série en cours : ' + pl(s.encours, 'jour') + '. Fait aujourd’hui ✓ : reviens demain pour la prolonger.';
          if (s.encours) return 'Série en cours : ' + pl(s.encours, 'jour') + '. Fais une séance aujourd’hui pour la prolonger.';
          return 'Record : ' + pl(s.record, 'jour') + ' d’affilée. Fais une séance aujourd’hui pour commencer une nouvelle série.';
        } },
      { id: 'assidu', ic: '📅', nom: 'Assidu', cond: 'Jours différents avec au moins une séance ou un défi terminé', seuils: [5, 15, 30, 60], u: 'j', val: E => E.j.length },
      { id: 'infatigable', ic: '🎯', nom: 'Infatigable', cond: 'Séances terminées', seuils: [10, 25, 50, 100], val: E => E.c.seances || 0 }
    ] },
    { nom: 'Réussite', succes: [
      { id: 'sansfaute', ic: '⭐', nom: 'Sans faute', cond: 'Séances terminées avec 20/20', seuils: [1, 5, 15, 40], val: E => E.c.sansFaute || 0 },
      { id: 'inarretable', ic: '⚡', nom: 'Inarrêtable', cond: 'Questions réussies sans erreur d’affilée', seuils: [10, 20, 40, 75],
        val: E => E.c.serieMax || 0, avance: E => E.c.serie || 0,
        astuce: E => (E.c.serieMax ? 'Série en cours : ' + (E.c.serie || 0) + ' · record : ' + E.c.serieMax + '. Une erreur ou la solution affichée remet la série à zéro.' : '') },
      { id: 'autonome', ic: '🧠', nom: 'Autonome', cond: 'Questions réussies sans erreur et sans aucune aide (rappel, indice, exemple)', seuils: [20, 60, 150, 300], val: E => E.c.autonome || 0 },
      { id: 'tenace', ic: '💪', nom: 'Tenace', cond: 'Questions réussies après une erreur, sans afficher la solution', seuils: [5, 15, 40, 100], val: E => E.c.tenace || 0 },
      { id: 'hautniveau', ic: '🏔️', nom: 'Haut niveau', cond: 'Questions de difficulté 3 réussies sans erreur', seuils: [5, 20, 50, 100], val: E => E.c.difficiles || 0 }
    ] },
    { nom: 'Compétences', succes: [
      { id: 'maitrise', ic: '🏅', nom: 'Maîtrise', cond: 'Compétences maîtrisées au moins une fois (Platine : toutes)',
        seuils: () => { const n = ids().length; return [4, 9, 15, n]; }, val: E => maitrisees(E) },
      famille('PU', '🔟'), famille('ES', '🔬'), famille('CS', '🎯'), famille('PR', '🔤'), famille('CV', '🔁')
    ] },
    { nom: 'Défi chrono', succes: [
      { id: 'defis', ic: '⏱️', nom: 'Compétiteur', cond: 'Défis chrono terminés', seuils: [1, 5, 15, 40], val: E => E.c.defis || 0 },
      { id: 'eclair', ic: '🏁', nom: 'Défi réussi', cond: 'Défis à 10/10 en moins de 2 minutes', seuils: [1, 3, 10, 25], val: E => E.c.defisReussis || 0 },
      { id: 'fusee', ic: '🚀', nom: 'Fusée', cond: 'Un défi à 10/10 en moins de 2 min (bronze), 1 min 30 s (argent), 1 min (or), 45 s (platine)', seuils: [1, 2, 3, 4],
        val: E => E.c.defiRapide || 0,
        astuce: () => (CN.recordDefi && CN.recordDefi() ? 'Ton record : ' + CN.recordDefi() + '.' : '') }
    ] },
    { nom: 'Découverte', succes: [
      { id: 'explorateur', ic: '🧭', nom: 'Explorateur', cond: 'Étapes de la Découverte faites', seuils: () => [6, 12, 18, CN.ETAPES.length], val: () => CN.decouverteFaits().length }
    ] }
  ];

  // état de départ (première fois) : calculé d'après le suivi et le défi déjà enregistrés
  function depart() {
    let v = null;
    try { v = JSON.parse(localStorage.getItem(APP + '-suivi')); } catch (e) { v = null; }
    const c = {}, j = [];
    if (v && typeof v === 'object') {
      const notes = Array.isArray(v.notes) ? v.notes.filter(x => Array.isArray(x) && x.length === 3) : [];
      c.seances = notes.length;
      c.sansFaute = notes.filter(x => x[2] === 20).length;
      notes.forEach(x => j.push(SUC.jourDe(x[0])));
      // toutes les questions, dans l'ordre : réussites après erreur, séries sans erreur
      const q = [];
      if (v.r && typeof v.r === 'object') Object.keys(v.r).forEach(k => { if (Array.isArray(v.r[k])) v.r[k].forEach(x => { if (Array.isArray(x)) q.push(x); }); });
      q.sort((a, b) => a[0] - b[0]);
      c.tenace = q.filter(x => x[1] === 0.5).length;
      let s = 0, m = 0;
      q.forEach(x => { s = x[1] === 1 ? s + 1 : 0; if (s > m) m = s; });
      c.serie = s; c.serieMax = m;
    }
    const d = CN.lireDefi ? CN.lireDefi() : { n: 0 };
    if (d.n) c.defis = d.n;
    if (d.meilleur && d.meilleur.j === 10 && niveauVitesse(d.meilleur.t)) { c.defiRapide = niveauVitesse(d.meilleur.t); c.defisReussis = 1; }
    const e = { maitrisees: C.liste.filter(x => CN.statut(x.id) === 'm').map(x => x.id) };
    return { c, j, e };
  }

  SUC.init({ app: APP, categories, depart });

  // compétences maîtrisées maintenant : ajoutées à l'ensemble (gardées pour toujours)
  const noterMaitrisees = () => SUC.reunir('maitrisees', C.liste.filter(x => CN.statut(x.id) === 'm').map(x => x.id));

  // première fois : l'état de départ est enregistré tout de suite (niveaux déjà atteints, sans annonce)
  try { if (localStorage.getItem(APP + '-succes') === null) { noterMaitrisees(); SUC.verifier(); } } catch (e) { /* stockage indisponible */ }

  const nouveauxSucces = [];
  function retenir(n) {
    n.forEach(x => {
      const i = nouveauxSucces.findIndex(y => y.s === x.s);
      if (i < 0) nouveauxSucces.push(x); else if (x.niv > nouveauxSucces[i].niv) nouveauxSucces[i] = x;
    });
    return n;
  }
  // après chaque question (occasions) et à la fin d'une séance (note)
  function succesApres(occasions, note) {
    occasions.forEach(o => {
      if (o.ok === 1) {
        const E = SUC.etat();
        SUC.fixer('serie', (E.c.serie || 0) + 1);
        SUC.record('serieMax', (E.c.serie || 0) + 1);
        if (!o.aide) SUC.ajouter('autonome');
        if (o.diff === 3) SUC.ajouter('difficiles');
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
    return retenir(SUC.verifier());
  }
  // fin d'un défi chrono : justes sur 10, temps en dixièmes de seconde
  function succesDefi(justes, temps) {
    SUC.ajouter('defis');
    const v = justes === 10 ? niveauVitesse(temps) : 0;
    if (v) { SUC.ajouter('defisReussis'); SUC.record('defiRapide', v); }
    SUC.jour();
    noterMaitrisees();
    return retenir(SUC.verifier());
  }

  // carte « Mes succès » : niveaux à jour (compétences maîtrisées, copie restaurée)
  function carteSucces() {
    noterMaitrisees();
    SUC.verifier();
    return SUC.carte();
  }

  const blocSucces = liste => SUC.blocNouveaux(liste, 'suivi.html#succes');

  Object.assign(CN, { succesApres, succesDefi, nouveauxSucces, carteSucces, blocSucces });
})();
