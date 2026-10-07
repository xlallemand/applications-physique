/* ============================================================
   Plan de l'application « Proportionnalité » et navigation
   (sommaire et accueil : voir assets/sommaire.js)
     PT.menu(cle)      sommaire de toute l'application ('accueil' : bandeau avec le lien vers le portail)
     PT.accueil(zone)  accueil : une ligne dépliable par module
   Trois modules, chacun en trois pages : cours, vérification des connaissances, entraînement.
   ============================================================ */
(function () {
  'use strict';

  const PLAN = [
    { n: 1, titre: 'Reconnaître une proportionnalité', desc: 'Proportionnalité directe, inverse, ou ni l\'une ni l\'autre', fiche: 'fiche_1',
      parties: [{ nom: 'Reconnaître', cours: 'module_1', questions: 'module_2', entrainement: 'module_3', noms: { questions: 'Vérification' } }] },
    { n: 2, titre: 'Utiliser la proportionnalité', desc: 'Produit en croix, coefficient de proportionnalité, retour à l\'unité', fiche: 'fiche_2',
      parties: [{ nom: 'Utiliser', cours: 'module_4', questions: 'module_5', entrainement: 'module_6', noms: { questions: 'Vérification' } }] },
    { n: 3, titre: 'Représentation graphique', desc: 'Reconnaître une proportionnalité sur un graphique, coefficient directeur', fiche: 'fiche_3',
      parties: [{ nom: 'Graphique', cours: 'module_7', questions: 'module_8', entrainement: 'module_9', noms: { questions: 'Vérification' } }] },
  ];
  window.SOM.init({ nom: 'Proportionnalité', id: 'proportionnalite', plan: PLAN });
  window.PT = {
    PLAN,
    menu: cle => window.SOM.menu(cle),
    accueil: zone => window.SOM.accueil(zone),
  };
})();
