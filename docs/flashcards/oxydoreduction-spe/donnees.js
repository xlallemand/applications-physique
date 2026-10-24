/* Relecture des flashcards de l'application « Oxydoréduction » (oxydoreduction-spe)
   Tour 1 : compétences et paquets (voir docs/flashcards/prompt-generation.md)
   Le module 4 (Écrire les réactions) reprend tous les autres : pas de paquet. */
RELECTURE({
  dossier: 'oxydoreduction-spe', titre: 'Oxydoréduction', court: 'Oxydoréduction', matiere: 'chimie',
  tour: 1, etape: 'competences',
  // pages de cours de l'application (prérequis possibles)
  cours: [
    { cle: 'module_1a_cours', nom: 'Cours : oxydant et réducteur' },
    { cle: 'module_1b_cours', nom: 'Cours : couple et demi-équation' },
    { cle: 'module_1c_cours', nom: 'Cours : oxydation et réduction' },
    { cle: 'module_1d_cours', nom: 'Cours : réaction entre un oxydant et un réducteur' },
    { cle: 'module_2a_cours', nom: 'Cours : la méthode en 4 étapes' },
    { cle: 'module_2b_cours', nom: 'Cours : équilibrer les charges' },
    { cle: 'module_3_cours', nom: 'Cours du module 3' },
    { cle: 'module_4_cours', nom: 'Méthode express (module 4)' },
  ],
  paquets: [
    { id: 'm1a', module: 1, titre: 'Oxydant et réducteur', apres: ['module_1a_cours'], competences: [
      { id: 'c1', texte: 'Définir un oxydant', types: ['definition'], source: 'fiche_1 · Oxydant et réducteur' },
      { id: 'c2', texte: 'Définir un réducteur', types: ['definition'], source: 'fiche_1 · Oxydant et réducteur' },
      { id: 'c3', texte: 'Relier capter / céder des électrons à la baisse / la hausse de la charge', types: ['savoir'], source: 'cours 1a · étape 1 ; À retenir' },
      { id: 'c4', texte: 'Trouver le nombre d\'électrons échangés à partir des deux charges (exercice-type : Sn²⁺ devient Sn⁴⁺)', types: ['methode'], source: 'cours 1a · « Compter les électrons »' },
      { id: 'c5', texte: 'Ne pas lire le nombre d\'électrons sur une seule charge, ni faire la somme des charges', types: ['reflexe'], source: 'cours 1a · diagnostic du nombre d\'électrons' },
    ] },
    { id: 'm1b', module: 1, titre: 'Couple et demi-équation', apres: ['module_1b_cours'], competences: [
      { id: 'c1', texte: 'Définir un couple oxydant / réducteur et l\'écrire Ox / Red, l\'oxydant en premier', types: ['definition'], source: 'fiche_1 · Couple et demi-équation' },
      { id: 'c2', texte: 'Écrire la demi-équation d\'un couple : Oxydant + n e⁻ = Réducteur', types: ['formule'], source: 'fiche_1 · Couple et demi-équation ; À retenir 1b' },
      { id: 'c3', texte: 'Écrire le couple à partir d\'une phrase (« Cu²⁺ peut être réduit en Cu », « Fe²⁺ peut être oxydé en Fe³⁺ »)', types: ['methode'], source: 'série 1 · Écrire un couple' },
      { id: 'c4', texte: 'Placer les électrons du côté de l\'oxydant, en bon nombre (couple Al³⁺ / Al)', types: ['reflexe'], source: 'cours 1b et série 1 · diagnostics électrons du mauvais côté, nombre d\'électrons' },
      { id: 'c5', texte: 'Trouver l\'oxydant dans une demi-équation avec H⁺ et H₂O (H⁺ n\'est pas l\'oxydant)', types: ['reflexe'], source: 'cours 1b · « L\'oxydant d\'une demi-équation » ; série 1 · diagnostic H⁺' },
    ] },
    { id: 'm1c', module: 1, titre: 'Oxydation et réduction', apres: ['module_1c_cours'], competences: [
      { id: 'c1', texte: 'Définir une oxydation (perte d\'électrons)', types: ['definition'], source: 'fiche_1 · Oxydation et réduction' },
      { id: 'c2', texte: 'Définir une réduction (gain d\'électrons)', types: ['definition'], source: 'fiche_1 · Oxydation et réduction' },
      { id: 'c3', texte: 'Placer « réduction » et « oxydation » sur les deux sens de Ox + n e⁻ = Red', types: ['schema'], source: 'méthode express · tuile « Réduction et oxydation »' },
      { id: 'c4', texte: 'Savoir que l\'oxydant est réduit et que le réducteur est oxydé', types: ['savoir'], source: 'cours 1c · « Oxydé ou réduit ? » ; série 1 · grille vocabulaire' },
      { id: 'c5', texte: 'Reconnaître une oxydation ou une réduction sur une demi-équation orientée (place des électrons)', types: ['methode'], source: 'cours 1c · « Reconnaître » ; série 1 · Oxydation ou réduction' },
      { id: 'c6', texte: 'Écrire une demi-équation orientée toujours avec le signe =, jamais avec une flèche', types: ['reflexe'], source: 'À retenir 1c · « Attention à l\'écriture »' },
    ] },
    { id: 'm1d', module: 1, titre: 'Réaction entre un oxydant et un réducteur', apres: ['module_1d_cours'], competences: [
      { id: 'c1', texte: 'Définir une réaction d\'oxydoréduction : Ox₁ + Red₂ → Red₁ + Ox₂', types: ['definition', 'formule'], source: 'fiche_1 · Réaction d\'oxydoréduction' },
      { id: 'c2', texte: 'Savoir que les électrons ne restent jamais libres en solution', types: ['savoir'], source: 'cours 1d · étape 1 ; série 1 · grille vocabulaire' },
      { id: 'c3', texte: 'Trouver les produits d\'une réaction à partir des réactifs et des couples (exercice-type : Ag⁺ et Cu)', types: ['methode'], source: 'cours 1d · « Les produits » ; série 1 · Une réaction' },
      { id: 'c4', texte: 'Dire quelle espèce est oxydée et laquelle est réduite dans une réaction (exercice-type : Cu²⁺ + Zn → Cu + Zn²⁺)', types: ['methode'], source: 'fiche_1 · exemple ; cours 1d · « Qui est oxydé ? »' },
      { id: 'c5', texte: 'Retrouver les deux couples d\'une réaction : les deux réactifs ne forment pas un couple', types: ['reflexe'], source: 'série 1 · Les couples d\'une réaction (diagnostic)' },
    ] },
    { id: 'm2a', module: 2, titre: 'La méthode en 4 étapes', apres: ['module_2a_cours'], competences: [
      { id: 'c1', texte: 'Citer dans l\'ordre les 4 étapes pour équilibrer une demi-équation', types: ['methode'], source: 'fiche_2 · La méthode en 4 étapes' },
      { id: 'c2', texte: 'Équilibrer un élément avec un nombre stœchiométrique, jamais en changeant un indice', types: ['reflexe'], source: 'cours 2a · étape 1 ; outil DEMI · diagnostic « indice »' },
      { id: 'c3', texte: 'N\'ajouter H₂O et H⁺ que s\'il en faut (I₂ / I⁻, O₂ / H₂O₂)', types: ['savoir'], source: 'cours 2a · étape 2 ; fiche_2' },
      { id: 'c4', texte: 'Équilibrer O : de quel côté ajouter H₂O, et combien (exercice-type)', types: ['methode'], source: 'série 2 · Équilibrer O avec H₂O ; diagnostics côté, des deux côtés' },
      { id: 'c5', texte: 'Compter les H apportés par l\'eau : une molécule H₂O contient 2 atomes H', types: ['reflexe'], source: 'série 2 · Équilibrer H avec H⁺ ; diagnostic « h-eau »' },
      { id: 'c6', texte: 'Écrire la demi-équation du couple MnO₄⁻ / Mn²⁺ (exercice-type, démarche étape par étape)', types: ['methode'], source: 'fiche_2 · exemple ; méthode express · bloc B' },
      { id: 'c7', texte: 'Vérifier une demi-équation : autant d\'atomes de chaque élément et même charge des deux côtés', types: ['savoir'], source: 'cours 2a · étape 3' },
    ] },
    { id: 'm2b', module: 2, titre: 'Équilibrer les charges', apres: ['module_2b_cours'], competences: [
      { id: 'c1', texte: 'Calculer la charge totale d\'un membre (exercice-type : MnO₄⁻ + 8 H⁺)', types: ['methode'], source: 'fiche_2 · Équilibrer les charges ; cours 2b · étape 1' },
      { id: 'c2', texte: 'Charge totale : une charge négative compte en moins, chaque charge multipliée par son nombre stœchiométrique', types: ['reflexe'], source: 'cours 2b et série 2 · diagnostics signe et nombre oublié' },
      { id: 'c3', texte: 'Savoir qu\'ajouter n e⁻ fait baisser la charge de n', types: ['savoir'], source: 'cours 2b · étape 2' },
      { id: 'c4', texte: 'Placer les électrons du côté où la charge est la plus grande, y compris avec des charges négatives (−2 > −4)', types: ['savoir', 'reflexe'], source: 'cours 2b · « Où placer les électrons ? » ; diagnostic e-signe' },
      { id: 'c5', texte: 'Trouver le nombre d\'électrons : l\'écart entre les deux charges, puis vérifier', types: ['methode'], source: 'cours 2b · étape 3 ; À retenir 2b' },
      { id: 'c6', texte: 'Ne pas additionner les deux charges, ni viser une charge nulle', types: ['reflexe'], source: 'cours 2b et outil DEMI · diagnostics « charge-somme », « charge-seul »' },
    ] },
    { id: 'm3', module: 3, titre: 'Écrire l\'équation d\'une réaction', apres: ['module_3_cours'], competences: [
      { id: 'c1', texte: 'Citer dans l\'ordre les 3 étapes pour écrire l\'équation d\'une réaction', types: ['methode'], source: 'fiche_3 · La méthode ; À retenir 3' },
      { id: 'c2', texte: 'Entourer les réactifs et écrire chaque demi-équation dans le sens de la réaction, le réactif à gauche du signe =', types: ['savoir'], source: 'fiche_3 · étape 1 ; série 3 · Dans le sens de la réaction' },
      { id: 'c3', texte: 'Trouver les multiplicateurs : le plus petit multiple commun des nombres d\'électrons (exercice-type : 5 et 1, 2 et 3)', types: ['methode'], source: 'série 3 · Égaliser les électrons (diagnostics)' },
      { id: 'c4', texte: 'Multiplier toute la demi-équation ; aucun électron dans l\'équation de la réaction', types: ['reflexe'], source: 'méthode express · Les pièges ; diagnostic de l\'équation (électrons)' },
      { id: 'c5', texte: 'Simplifier les H⁺ et H₂O présents des deux côtés (exercice-type : 16 H⁺ à gauche, 10 à droite)', types: ['methode'], source: 'fiche_3 · Simplifier H⁺ et H₂O' },
      { id: 'c6', texte: 'Trouver l\'autre réactif : un oxydant réagit avec le réducteur de l\'autre couple', types: ['savoir'], source: 'série 3 · L\'autre réactif' },
      { id: 'c7', texte: 'Choisir le bon couple quand un réactif appartient à deux couples (H₂O₂ avec MnO₄⁻, avec Fe²⁺)', types: ['reflexe'], source: 'série 3 · Le bon couple (OX.DEUX_COUPLES)' },
      { id: 'c8', texte: 'Écrire l\'équation de la réaction entre MnO₄⁻ et Fe²⁺ (exercice-type, démarche)', types: ['methode'], source: 'fiche_3 · exemple ; À retenir 3' },
    ] },
  ],
});
