/* ============================================================
   Banque de réactions des entraînements (modules 3 et 4)

   Deux groupes de difficulté, chacun divisé en trois sous-groupes
   de difficulté croissante. Avant le dernier sous-groupe, aucune
   réaction n'a plus de 2 réactifs ou plus de 2 produits. Pour chaque entraînement, on pioche
   3 réactions dans le 1er sous-groupe, 4 dans le 2e et 3 dans le 3e.

   r : réactifs, p : produits, c : nombres stœchiométriques
   (les plus petits entiers possibles, dans l'ordre réactifs puis produits)
   ============================================================ */
window.BANQUE = {
  /* ---------- Module 3 : réactions faciles à équilibrer ---------- */
  faciles: [
    { titre: 'Un seul nombre stœchiométrique à trouver', tirage: 3, reactions: [
      { r: ['H2', 'Cl2'], p: ['HCl'], c: [1, 1, 2], nom: "Synthèse du chlorure d'hydrogène" },
      { r: ['N2', 'O2'], p: ['NO'], c: [1, 1, 2], nom: "Formation de monoxyde d'azote dans un moteur" },
      { r: ['H2', 'Br2'], p: ['HBr'], c: [1, 1, 2], nom: "Synthèse du bromure d'hydrogène" },
      { r: ['Zn', 'HCl'], p: ['ZnCl2', 'H2'], c: [1, 2, 1, 1], nom: "Action de l'acide chlorhydrique sur le zinc" },
      { r: ['Fe', 'HCl'], p: ['FeCl2', 'H2'], c: [1, 2, 1, 1], nom: "Action de l'acide chlorhydrique sur le fer" },
      { r: ['Mg', 'HCl'], p: ['MgCl2', 'H2'], c: [1, 2, 1, 1], nom: "Action de l'acide chlorhydrique sur le magnésium" },
      { r: ['C', 'H2'], p: ['CH4'], c: [1, 2, 1], nom: 'Synthèse du méthane' },
      { r: ['C', 'CO2'], p: ['CO'], c: [1, 1, 2], nom: 'Formation de monoxyde de carbone' },
    ]},
    { titre: 'Deux nombres stœchiométriques égaux à 2', tirage: 4, reactions: [
      { r: ['H2', 'O2'], p: ['H2O'], c: [2, 1, 2], nom: "Synthèse de l'eau" },
      { r: ['Mg', 'O2'], p: ['MgO'], c: [2, 1, 2], nom: 'Combustion du magnésium' },
      { r: ['Cu', 'O2'], p: ['CuO'], c: [2, 1, 2], nom: 'Oxydation du cuivre' },
      { r: ['Na', 'Cl2'], p: ['NaCl'], c: [2, 1, 2], nom: 'Synthèse du chlorure de sodium' },
      { r: ['CH4', 'O2'], p: ['CO2', 'H2O'], c: [1, 2, 1, 2], nom: 'Combustion du méthane' },
      { r: ['CO', 'O2'], p: ['CO2'], c: [2, 1, 2], nom: 'Combustion du monoxyde de carbone' },
      { r: ['H2O2'], p: ['H2O', 'O2'], c: [2, 2, 1], nom: "Décomposition de l'eau oxygénée" },
      { r: ['Zn', 'O2'], p: ['ZnO'], c: [2, 1, 2], nom: 'Oxydation du zinc' },
      { r: ['SO2', 'O2'], p: ['SO3'], c: [2, 1, 2], nom: 'Formation du trioxyde de soufre' },
      { r: ['CuO', 'C'], p: ['Cu', 'CO2'], c: [2, 1, 2, 1], nom: "Réduction de l'oxyde de cuivre par le carbone" },
    ]},
    { titre: 'Encore des nombres égaux à 2', tirage: 3, reactions: [
      { r: ['H2O'], p: ['H2', 'O2'], c: [2, 2, 1], nom: "Électrolyse de l'eau" },
      { r: ['HgO'], p: ['Hg', 'O2'], c: [2, 2, 1], nom: "Décomposition de l'oxyde de mercure" },
      { r: ['NaCl'], p: ['Na', 'Cl2'], c: [2, 2, 1], nom: 'Électrolyse du chlorure de sodium fondu' },
      { r: ['Ca', 'O2'], p: ['CaO'], c: [2, 1, 2], nom: 'Combustion du calcium' },
      { r: ['Fe', 'O2'], p: ['FeO'], c: [2, 1, 2], nom: "Formation d'oxyde de fer II" },
      { r: ['NO', 'O2'], p: ['NO2'], c: [2, 1, 2], nom: "Formation du dioxyde d'azote" },
      { r: ['Cl2', 'NaBr'], p: ['NaCl', 'Br2'], c: [1, 2, 2, 1], nom: 'Action du dichlore sur le bromure de sodium' },
      { r: ['Na', 'HCl'], p: ['NaCl', 'H2'], c: [2, 2, 2, 1], nom: "Action de l'acide chlorhydrique sur le sodium" },
      { r: ['H2S', 'O2'], p: ['S', 'H2O'], c: [2, 1, 2, 2], nom: "Combustion incomplète du sulfure d'hydrogène" },
    ]},
  ],

  /* ---------- Module 4 : réactions moins faciles à équilibrer ---------- */
  moinsFaciles: [
    { titre: "Nombres stœchiométriques jusqu'à 4", tirage: 3, reactions: [
      { r: ['N2', 'H2'], p: ['NH3'], c: [1, 3, 2], nom: "Synthèse de l'ammoniac" },
      { r: ['Na', 'H2O'], p: ['NaOH', 'H2'], c: [2, 2, 2, 1], nom: "Action de l'eau sur le sodium" },
      { r: ['Ca', 'H2O'], p: ['Ca(OH)2', 'H2'], c: [1, 2, 1, 1], nom: "Action de l'eau sur le calcium" },
      { r: ['Fe', 'Cl2'], p: ['FeCl3'], c: [2, 3, 2], nom: 'Combustion du fer dans le dichlore' },
      { r: ['Fe', 'O2'], p: ['Fe3O4'], c: [3, 2, 1], nom: 'Combustion du fer dans le dioxygène' },
      { r: ['C2H4', 'O2'], p: ['CO2', 'H2O'], c: [1, 3, 2, 2], nom: "Combustion de l'éthylène" },
      { r: ['CuCl2', 'NaOH'], p: ['Cu(OH)2', 'NaCl'], c: [1, 2, 1, 2], nom: "Test des ions cuivre avec la soude" },
      { r: ['FeCl3', 'NaOH'], p: ['Fe(OH)3', 'NaCl'], c: [1, 3, 1, 3], nom: 'Test des ions fer III avec la soude' },
      { r: ['NaOH', 'H2SO4'], p: ['Na2SO4', 'H2O'], c: [2, 1, 1, 2], nom: "Réaction entre la soude et l'acide sulfurique" },
      { r: ['Al', 'O2'], p: ['Al2O3'], c: [4, 3, 2], nom: "Oxydation de l'aluminium" },
      { r: ['Fe', 'O2'], p: ['Fe2O3'], c: [4, 3, 2], nom: 'Formation de la rouille' },
      { r: ['Na', 'O2'], p: ['Na2O'], c: [4, 1, 2], nom: 'Oxydation du sodium' },
      { r: ['Al', 'Cl2'], p: ['AlCl3'], c: [2, 3, 2], nom: "Combustion de l'aluminium dans le dichlore" },
      { r: ['Fe2O3', 'CO'], p: ['Fe', 'CO2'], c: [1, 3, 2, 3], nom: 'Réaction dans un haut fourneau' },
      { r: ['KClO3'], p: ['KCl', 'O2'], c: [2, 2, 3], nom: 'Décomposition du chlorate de potassium' },
      { r: ['H2S', 'O2'], p: ['SO2', 'H2O'], c: [2, 3, 2, 2], nom: "Combustion du sulfure d'hydrogène" },
    ]},
    { titre: 'Combustions et nombres plus grands', tirage: 4, reactions: [
      { r: ['C3H8', 'O2'], p: ['CO2', 'H2O'], c: [1, 5, 3, 4], nom: 'Combustion du propane' },
      { r: ['C2H6O', 'O2'], p: ['CO2', 'H2O'], c: [1, 3, 2, 3], nom: "Combustion de l'éthanol" },
      { r: ['CH4O', 'O2'], p: ['CO2', 'H2O'], c: [2, 3, 2, 4], nom: 'Combustion du méthanol' },
      { r: ['C6H12O6', 'O2'], p: ['CO2', 'H2O'], c: [1, 6, 6, 6], nom: 'Respiration (combustion du glucose)' },
      { r: ['Al', 'HCl'], p: ['AlCl3', 'H2'], c: [2, 6, 2, 3], nom: "Action de l'acide chlorhydrique sur l'aluminium" },
      { r: ['P', 'O2'], p: ['P2O5'], c: [4, 5, 2], nom: 'Combustion du phosphore' },
      { r: ['NH3', 'O2'], p: ['N2', 'H2O'], c: [4, 3, 2, 6], nom: "Combustion de l'ammoniac" },
      { r: ['C6H12O6'], p: ['C2H6O', 'CO2'], c: [1, 2, 2], nom: 'Fermentation alcoolique' },
      { r: ['C2H2', 'O2'], p: ['CO2', 'H2O'], c: [2, 5, 4, 2], nom: "Combustion de l'acétylène" },
    ]},
    { titre: 'Les plus difficiles', tirage: 3, reactions: [
      { r: ['C2H6', 'O2'], p: ['CO2', 'H2O'], c: [2, 7, 4, 6], nom: "Combustion de l'éthane" },
      { r: ['C4H10', 'O2'], p: ['CO2', 'H2O'], c: [2, 13, 8, 10], nom: 'Combustion du butane' },
      { r: ['C5H12', 'O2'], p: ['CO2', 'H2O'], c: [1, 8, 5, 6], nom: 'Combustion du pentane' },
      { r: ['C8H18', 'O2'], p: ['CO2', 'H2O'], c: [2, 25, 16, 18], nom: "Combustion de l'octane (essence)" },
      { r: ['C6H6', 'O2'], p: ['CO2', 'H2O'], c: [2, 15, 12, 6], nom: 'Combustion du benzène' },
      { r: ['NH3', 'O2'], p: ['NO', 'H2O'], c: [4, 5, 4, 6], nom: "Oxydation de l'ammoniac" },
      { r: ['FeS2', 'O2'], p: ['Fe2O3', 'SO2'], c: [4, 11, 2, 8], nom: 'Grillage de la pyrite' },
      { r: ['Ca(OH)2', 'H3PO4'], p: ['Ca3(PO4)2', 'H2O'], c: [3, 2, 1, 6], nom: 'Formation du phosphate de calcium' },
      { r: ['Al2(SO4)3', 'NaOH'], p: ['Al(OH)3', 'Na2SO4'], c: [1, 6, 2, 3], nom: "Précipitation de l'hydroxyde d'aluminium" },
      { r: ['CaCO3', 'HCl'], p: ['CaCl2', 'CO2', 'H2O'], c: [1, 2, 1, 1, 1], nom: "Action de l'acide chlorhydrique sur le calcaire" },
      { r: ['NaHCO3'], p: ['Na2CO3', 'CO2', 'H2O'], c: [2, 1, 1, 1], nom: "Décomposition de l'hydrogénocarbonate de sodium" },
    ]},
  ],
};
