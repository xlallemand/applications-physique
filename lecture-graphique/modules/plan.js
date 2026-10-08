/* ============================================================
   Plan de l'application « Lecture graphique » et navigation
   (sommaire et accueil : voir assets/sommaire.js)
     LG.menu(cle)      sommaire de toute l'application ('accueil' : bandeau avec le lien vers le portail)
     LG.accueil(zone)  accueil : une ligne dépliable par module
   (lgtools.js est aussi utilisé par « Puissance active » : le plan est donc à part)
   ============================================================ */
(function () {
  'use strict';

  const PLAN = [
    { n: 1, titre: 'La méthode', desc: 'Mesurer l\'échelle et la grandeur à la règle, tableau de proportionnalité, mesurer grand', fiche: 'fiche_1',
      parties: [{ nom: 'La méthode', cours: 'module_1' }] },
    { n: 2, titre: 'Entraînement 1', desc: '10 graphiques de difficulté progressive : périodes, longueur d\'onde, maximum, amplitude',
      parties: [{ nom: 'Entraînement 1', entrainement: 'module_2' }] },
    { n: 3, titre: 'Entraînement 2', desc: '10 graphiques plus difficiles : échelles peu pratiques, électrocardiogramme…',
      parties: [{ nom: 'Entraînement 2', entrainement: 'module_3' }] },
  ];
  window.SOM.init({ nom: 'Lecture graphique', id: 'lecture-graphique', plan: PLAN });
  window.LG = Object.assign(window.LG || {}, {
    PLAN,
    menu: cle => window.SOM.menu(cle),
    accueil: zone => window.SOM.accueil(zone),
  });
})();
