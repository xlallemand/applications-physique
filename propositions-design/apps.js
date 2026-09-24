/* ============================================================
   Données communes aux trois propositions de design :
   liste des matières et des applications du portail.
   ============================================================ */
window.MATIERES = [
  {
    id: 'maths', nom: 'Outils mathématiques', couleur: 'maths',
    apps: [
      { titre: 'Puissances de 10', desc: "S'entraîner à utiliser les puissances de 10, indispensables pour les conversions.", dossier: 'puissances-10' },
      { titre: 'Conversions', desc: 'Réaliser facilement des conversions en utilisant les puissances de 10.', dossier: 'conversions' },
      { titre: 'Équations en physique', desc: 'Manipuler les équations pour exprimer une grandeur en fonction des autres.', dossier: 'equations-en-physique' },
      { titre: 'Équations en physique (avec aide)', desc: 'Même entraînement, avec blocage et explication de la règle en cas de déplacement incorrect.', dossier: 'equations-en-physique-avec-aide' },
      { titre: 'Proportionnalité', desc: 'Reconnaître une situation de proportionnalité, la calculer et la lire sur un graphique.', dossier: 'proportionnalite' }
    ]
  },
  {
    id: 'chimie', nom: 'Chimie', couleur: 'chimie',
    apps: [
      { titre: 'Oxydoréduction', desc: "Apprendre à écrire les réactions d'oxydoréduction.", dossier: 'oxydoreduction-STI2D', niveau: 'Terminale STI2D' },
      { titre: "Schéma d'une pile", desc: "Compléter le schéma et le fonctionnement d'une pile électrochimique.", dossier: 'pile' }
    ]
  },
  {
    id: 'physique', nom: 'Physique', couleur: 'physique',
    apps: [
      { titre: 'Désintégration radioactive', desc: 'Simulation interactive de la loi de décroissance radioactive.', dossier: 'decroissance-radioactive' }
    ]
  },
  {
    id: 'college', nom: 'Collège', couleur: 'college',
    apps: [
      { titre: 'Équations du 1er degré', desc: 'Résoudre des équations étape par étape, avec progression sauvegardée.', dossier: 'equations-college' },
      { titre: 'Fractions', desc: 'Simplifier, multiplier, diviser, additionner et soustraire des fractions.', dossier: 'fractions-college' }
    ]
  }
];

/* Générateur pseudo-aléatoire reproductible (mêmes images à chaque chargement) */
window.graine = function (seed) {
  return function () {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
};
