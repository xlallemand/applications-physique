/* ============================================================
   Application « Schéma d'une pile » (Terminale spécialité)
   Plan de l'application et navigation commune (assets/sommaire.js).

   Pages (modules/) :
     module_1_cours.html   cours par étapes (assets/cours.js) : même cours que le module 5
                           du chapitre 15 de Terminale STI2D, avec ses figures et ses parties
                           de question (oxydoreduction-STI2D/modules/ox.js : OX.figPile,
                           OX.infoCharges, OX.versCours…)
     module_1_pile.html    entraînement noté sur 20 (moteur partagé pile/pile.js)
     fiche_1.html          fiche récapitulative

   À charger après assets/sommaire.js et, sur les pages qui l'utilisent, après
   oxydoreduction-STI2D/modules/ox.js : ox.js déclare le plan du chapitre 15,
   SOM.init est donc rappelé ici avec le plan de cette application.

   PI.PLAN, PI.menu(cle), PI.accueil(zone)
   ============================================================ */
(function () {
  'use strict';

  /* ---------- Plan de l'application (voir assets/sommaire.js) ---------- */
  const PLAN = [
    { n: 1, titre: 'Schéma de fonctionnement d\'une pile', desc: 'Anode et cathode, sens de circulation des charges dans les fils et dans le pont salin, sens de I et des e<sup>−</sup>, équation de la pile', fiche: 'fiche_1',
      parties: [{ nom: 'Schéma d\'une pile', cours: 'module_1_cours', entrainement: 'module_1_pile', noms: { entrainement: 'Entraînement : schéma d\'une pile' } }] },
  ];
  // progression gardée dans le navigateur : localStorage « pile-progression »
  window.SOM.init({ nom: 'Schéma d\'une pile', id: 'pile', plan: PLAN });

  window.PI = {
    PLAN,
    menu: cle => window.SOM.menu(cle),            // 'accueil' : bandeau vers le portail ; sinon le sommaire, page cle encadrée
    accueil: zone => window.SOM.accueil(zone),    // lignes dépliables, carte « Reprendre »
  };
})();
