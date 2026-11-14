/* ============================================================
   Plan de l'application « Équations en physique » et navigation
   (sommaire et accueil : voir assets/sommaire.js)
     EP.menu(cle)      sommaire de toute l'application ('accueil' : bandeau avec le lien vers le portail)
     EP.accueil(zone)  accueil : une ligne dépliable par module
   Quatre modules : méthode (cours) puis entraînement noté.
   ============================================================ */
(function () {
  'use strict';

  const PLAN = [
    { n: 1, titre: 'Le principe', desc: 'Les règles de base pour isoler une grandeur, un exemple complet, l\'entraînement', fiche: 'fiche_1',
      parties: [{ nom: 'Le principe', cours: 'module_1', exemple: 'module_2', entrainement: 'module_3', noms: { cours: 'Méthode' } }] },
    { n: 2, titre: 'Les fractions', desc: 'Équations à plusieurs zones, fraction multipliée par un autre terme', fiche: 'fiche_2',
      parties: [{ nom: 'Les fractions', cours: 'module_4', entrainement: 'module_5', noms: { cours: 'Méthode' } }] },
    { n: 3, titre: 'Les + et les −', desc: 'Déplacer un terme additif d\'un côté à l\'autre de l\'équation', fiche: 'fiche_3',
      parties: [{ nom: 'Les + et les −', cours: 'module_6', entrainement: 'module_7', noms: { cours: 'Méthode' } }] },
    { n: 4, titre: 'Les fonctions réciproques', desc: 'Supprimer une fonction (racine, carré, sinus…) avec sa fonction réciproque', fiche: 'fiche_4',
      parties: [{ nom: 'Les fonctions réciproques', cours: 'module_8', entrainement: 'module_9', noms: { cours: 'Méthode' } }] },
  ];
  window.SOM.init({ nom: 'Équations en physique', id: 'equations-en-physique', plan: PLAN });
  window.EP = {
    PLAN,
    menu: cle => window.SOM.menu(cle),
    accueil: zone => window.SOM.accueil(zone),
  };
})();
