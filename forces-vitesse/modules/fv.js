/* ============================================================
   Plan de l'application « Somme des forces et variation de la vitesse »
   (1re spécialité). Le moteur est celui de « Bilan des forces »
   (bilan-forces/modules/bf.js, chargé APRÈS ce fichier) : questions,
   séries notées sur 20, tracés dans un quadrillage (BF.partieResultante,
   BF.partieAcc), navigation BF.menu / BF.accueil.
   BF_AUTRE_PLAN : bf.js n'installe pas le plan de « Bilan des forces ».
   ============================================================ */
(function () {
  'use strict';
  window.BF_AUTRE_PLAN = true;

  /* PLAN DE L'APPLICATION ET NAVIGATION (voir assets/sommaire.js) */
  const PLAN = [
    { n: 1, titre: 'Faire un bilan des forces', desc: 'À savoir faire avant de commencer : diagramme objet-action, forces dessinées sur le schéma, forces qui se compensent',
      // page externe ↗ : l'atelier de l'application « Bilan des forces »
      parties: [{ nom: 'Bilan des forces', externe: { app: 'bilan-forces', page: 'module_6_simulation', nom: 'Atelier : bilan des forces', appNom: 'Bilan des forces' } }] },
    { n: 2, titre: 'Somme des forces et variation de la vitesse', desc: 'Somme des forces Σ <span class="vec-nom">F</span>, variation du vecteur vitesse <span class="vec-nom">Δv</span> de même direction et de même sens, m <span class="vec-nom">Δv</span> / Δt ≈ Σ <span class="vec-nom">F</span>', fiche: 'fiche_2',
      parties: [{ nom: 'Somme des forces et variation de la vitesse', cours: 'module_2_cours', questions: 'module_2_questions' }] },
  ];
  window.SOM.init({ nom: 'Somme des forces et variation de la vitesse', id: 'forces-vitesse', plan: PLAN });
  window.FV = { PLAN };
})();
