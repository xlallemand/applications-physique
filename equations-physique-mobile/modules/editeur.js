/* ============================================================
   Équations en physique (smartphone) — éditeur d'équation à tuiles (objet EPM.ED)
   ------------------------------------------------------------
   L'éditeur est désormais l'outil commun assets/equations.js (objet EQ,
   styles assets/equations.css), créé à partir de l'ancien editeur.js de
   cette application (avec aide-rules.js et tuiles.js) sans changer son
   comportement. Ce fichier garde seulement l'API que l'application utilise :
   une seule équation éditable à la fois dans la page (celle de la question en cours).

   API :
     EPM.ED.monter(zone, exercice, rappels)   affiche l'éditeur dans zone (voir EQ.monter)
     EPM.ED.fin()                             l'éditeur affiché ne répond plus (question terminée)
     EPM.ED.statique(noeud), EPM.ED.ligne(gauche, droite), EPM.ED.finir(el)   écriture figée
     EPM.ED.evaluer(noeud, valeurs), EPM.ED.compterUns(noeud), EPM.ED.noeuds,
     EPM.ED.libelleOutil(t), EPM.ED.noteOutil(t)
     EPM.ED.ops                               opérations de l'éditeur affiché (tests automatiques)
   Chargé après assets/dragdrop.js et assets/equations.js.
   ============================================================ */
(function () {
  'use strict';
  const EPM = window.EPM = window.EPM || {};

  // éditeur affiché (le dernier monté)
  let actif = null;
  // opérations de l'éditeur affiché, relues à chaque appel
  const ops = new Proxy({}, { get: (o, k) => actif && actif.ops[k] });

  EPM.ED = {
    monter(zone, exercice, rappels) {
      actif = EQ.monter(zone, exercice, rappels);
      return actif.racine;
    },
    fin() { if (actif) actif.fin(); },
    statique: EQ.statique, ligne: EQ.ligne, finir: EQ.finir,
    evaluer: EQ.evaluer, compterUns: EQ.compterUns, noeuds: EQ.noeuds,
    libelleOutil: EQ.libelleOutil, noteOutil: EQ.noteOutil,
    ops,
  };
})();
