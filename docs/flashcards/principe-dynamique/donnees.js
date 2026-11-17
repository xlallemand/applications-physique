/* Relecture des flashcards de l'application « Chapitre 6 : Principe fondamental de la dynamique » (principe-dynamique)
   Tour 1 : compétences et paquets proposés (un paquet par cours ou sous-module de cours ;
   le module 5, exercices, n'a pas de cours : pas de paquet).
   Toutes les définitions et toutes les formules du cours, plus une ou deux capacités par cours.
   Préfixe des identifiants de cartes : pfd- (voir docs/flashcards/prompt-generation.md). */
(function () {
  RELECTURE({
    dossier: 'principe-dynamique', titre: 'Chapitre 6 : Principe fondamental de la dynamique', court: 'Chapitre 6', matiere: 'physique',
    tour: 1, etape: 'competences',
    // pages de cours de l'application (prérequis possibles), plus l'atelier du module 2
    cours: [
      { cle: 'module_1_cours', nom: 'Cours (module 1)' },
      { cle: 'module_2a_cours', nom: 'Cours : forces à distance, forces de contact' },
      { cle: 'module_2b_cours', nom: 'Cours : méthode du diagramme objet-action' },
      { cle: 'module_2c_cours', nom: 'Cours : force de l\'air' },
      { cle: 'module_2d_cours', nom: 'Cours : poids' },
      { cle: 'module_2e_cours', nom: 'Cours : réaction du support' },
      { cle: 'module_2f_cours', nom: 'Cours : forces qui se compensent' },
      { cle: 'module_2_simulation', nom: 'Atelier : bilan des forces' },
      { cle: 'module_3a_cours', nom: 'Cours : définition de l\'accélération' },
      { cle: 'module_3b_cours', nom: 'Cours : dériver la vitesse' },
      { cle: 'module_3c_cours', nom: 'Cours : vitesse constante' },
      { cle: 'module_3d_cours', nom: 'Cours : accélération constante' },
      { cle: 'module_3e_cours', nom: 'Cours : accélération et forces' },
      { cle: 'module_4a_cours', nom: 'Cours : principe fondamental de la dynamique' },
      { cle: 'module_4b_cours', nom: 'Cours : principe d\'inertie' },
      { cle: 'module_4c_cours', nom: 'Cours : résultante des forces et accélération' },
      { cle: 'module_4d_cours', nom: 'Cours : méthode type' },
    ],
    paquets: [
      /* ---------- Module 1 · Référentiel et nature du mouvement ---------- */
      { id: 'm1', module: 1, titre: 'Référentiel et nature du mouvement', apres: ['module_1_cours'],
        competences: [
          { id: 'c1', texte: 'Définir le référentiel : solide de référence par rapport auquel on étudie le mouvement du système', types: ['definition'], source: 'fiche_1 · Référentiel ; À retenir' },
          { id: 'c2', texte: 'Choisir le référentiel adapté : terrestre (le plus souvent), géocentrique (satellites, Lune), héliocentrique (planètes)', types: ['savoir'], source: 'fiche_1 · Référentiel ; série 1 · « Quel référentiel est le plus adapté ? »' },
          { id: 'c3', texte: 'Définir un référentiel galiléen (principe d\'inertie vérifié ; immobile ou en mouvement rectiligne uniforme par rapport à un référentiel galiléen ; le terrestre est considéré comme galiléen)', types: ['definition'], source: 'fiche_1 · Référentiel galiléen ; série 1' },
          { id: 'c4', texte: 'Définir les trois trajectoires : rectiligne, circulaire, curviligne (une carte par mot)', types: ['definition'], source: 'fiche_1 · 1er mot : la trajectoire' },
          { id: 'c5', texte: 'Définir les trois mots de la vitesse : uniforme, accéléré, décéléré ou ralenti (une carte par mot)', types: ['definition'], source: 'fiche_1 · 2e mot : la vitesse' },
          { id: 'c6', texte: 'Définir une chronophotographie : positions successives à intervalles de temps égaux', types: ['definition'], source: 'cours 1 · étape 3 ; fiche_1' },
          { id: 'c7', texte: 'Décrire un mouvement en deux mots (trajectoire, puis vitesse) d\'après une chronophotographie', types: ['graphique'], source: 'fiche_1 · Décrire un mouvement ; série 1 ; exercice 7' },
        ] },

      /* ---------- Module 2 · Forces à distance, forces de contact ---------- */
      { id: 'm2a', module: 2, titre: 'Forces à distance, forces de contact', apres: ['module_2a_cours'],
        competences: [
          { id: 'c1', texte: 'Définir une force à distance (les objets ne se touchent pas ; la flèche part du centre G)', types: ['definition'], source: 'cours 2a · étape 1 ; À retenir ; série 2 · « Point de départ »' },
          { id: 'c2', texte: 'Définir une force de contact (chaque objet qui touche le système, l\'air compris ; la flèche part du point de contact)', types: ['definition'], source: 'cours 2a · étape 2 ; À retenir ; série 2 · « À distance ou de contact ? »' },
          { id: 'c3', texte: 'Citer les trois seules forces à distance : poids P⃗ (toujours), force magnétique F⃗mag, force électrique F⃗élec', types: ['savoir'], source: 'cours 2a · Règle ; À retenir' },
        ] },

      /* ---------- Module 2 · Méthode du diagramme objet-action ---------- */
      { id: 'm2b', module: 2, titre: 'Méthode du diagramme objet-action', apres: ['module_2b_cours'],
        competences: [
          { id: 'c1', texte: 'Définir le diagramme objet-action : il liste toutes les forces, sans en oublier et sans en inventer', types: ['definition'], source: 'fiche_2 · La méthode du diagramme objet-action ; À retenir' },
          { id: 'c2', texte: 'Construire un diagramme objet-action : système au centre, Terre (pointillés), une bulle par objet en contact, l\'air compris (trait plein), trait barré si force négligeable · crayon', types: ['methode'], source: 'cours 2b · Méthode ; série 2 · diagnostic « n\'oublie pas le poids » ; atelier' },
        ] },

      /* ---------- Module 2 · Force de l'air ---------- */
      { id: 'm2c', module: 2, titre: 'Force de l\'air', apres: ['module_2c_cours'],
        competences: [
          { id: 'c1', texte: 'Savoir quand on ne néglige pas la force de l\'air : frottements importants (grande vitesse, grande surface) ou poussée d\'Archimède importante (système très léger pour son volume)', types: ['savoir'], source: 'fiche_2 · La force de l\'air ; cours 2c · Règle' },
          { id: 'c2', texte: 'Définir la poussée d\'Archimède F⃗archi : force d\'un fluide (air, eau, huile…), verticale, vers le haut', types: ['definition'], source: 'fiche_2 · Poussée d\'Archimède ; cours 2c · Notation' },
          { id: 'c3', texte: 'Définir les frottements de l\'air F⃗air : force de l\'air opposée au mouvement', types: ['definition'], source: 'cours 2c · Règle et Méthode' },
        ] },

      /* ---------- Module 2 · Poids ---------- */
      { id: 'm2d', module: 2, titre: 'Poids', apres: ['module_2d_cours'],
        competences: [
          { id: 'c1', texte: 'Calculer le poids : P = m × g (P en N, m en kg, g en N/kg)', types: ['formule'], source: 'fiche_2 · Le poids ; À retenir' },
          { id: 'c2', texte: 'Calculer la masse à partir du poids : m = P / g', types: ['formule'], source: 'cours 2d · À toi « Retrouver la masse »' },
          { id: 'c3', texte: 'Définir le poids P⃗ : force exercée par la Terre, verticale, vers le bas, depuis le centre G ; dans tous les bilans', types: ['definition'], source: 'fiche_2 · Le poids ; cours 2d' },
          { id: 'c4', texte: 'Définir l\'intensité de la pesanteur g : 9,81 N/kg (10 N/kg si g n\'est pas donné)', types: ['definition'], source: 'fiche_2 · Le poids ; cours 2d' },
          { id: 'c5', texte: 'Réflexe : masse en g ou en tonnes, la convertir en kg avant de calculer P', types: ['reflexe'], source: 'série 2 · diagnostic « Convertis la masse en kg » ; cours 2d · « Une masse en grammes »' },
        ] },

      /* ---------- Module 2 · Réaction du support ---------- */
      { id: 'm2e', module: 2, titre: 'Réaction du support', apres: ['module_2e_cours'],
        competences: [
          { id: 'c1', texte: 'Écrire la réaction du support avec frottements : R⃗ = R⃗N + f⃗', types: ['formule'], source: 'fiche_2 · La réaction du support ; À retenir' },
          { id: 'c2', texte: 'Définir la réaction normale R⃗N : force du support sans frottement, perpendiculaire au support, depuis le point de contact', types: ['definition'], source: 'cours 2e · Règle ; fiche_2' },
          { id: 'c3', texte: 'Définir les frottements f⃗ : parallèles au support, opposés au glissement qu\'il y aurait sans eux', types: ['definition'], source: 'cours 2e · étape 2 ; fiche_2' },
        ] },

      /* ---------- Module 2 · Forces qui se compensent ---------- */
      { id: 'm2f', module: 2, titre: 'Forces qui se compensent', apres: ['module_2f_cours'],
        competences: [
          { id: 'c1', texte: 'Définir des forces qui se compensent : leur somme vectorielle est nulle, Σ F⃗ = 0⃗', types: ['definition'], source: 'fiche_2 · Forces qui se compensent ; À retenir' },
          { id: 'c2', texte: 'Donner les caractéristiques de deux forces qui se compensent : même direction, sens opposés, même valeur', types: ['savoir'], source: 'cours 2f · Définition ; série 2 · « Compensation »' },
          { id: 'c3', texte: 'Faire un bilan des forces : diagramme objet-action, chaque force sur le schéma (point de départ, direction, sens, nom), puis compensation · crayon', types: ['methode'], source: 'cours 2f · À retenir ; série 2 · bilans complets ; atelier ; exercices 2, 5, 11' },
        ] },

      /* ---------- Module 3 · Définition de l'accélération ---------- */
      { id: 'm3a', module: 3, titre: 'Définition de l\'accélération', apres: ['module_3a_cours'],
        competences: [
          { id: 'c1', texte: 'Définir l\'accélération : a = dv/dt, la dérivée de la vitesse par rapport au temps (variation de la vitesse au cours du temps), en m·s−2', types: ['definition'], source: 'fiche_3 · Définition (à connaître) ; À retenir' },
          { id: 'c2', texte: 'Choisir comment calculer a selon ce que l\'on connaît : v(t) → a = v′ ; vitesse constante → a = 0 ; vitesses de départ et d\'arrivée → a = Δv / Δt ; forces → a = Σ F / m', types: ['methode'], source: 'fiche_3 · Quatre façons ; cours 3a · À toi' },
        ] },

      /* ---------- Module 3 · Dériver la vitesse ---------- */
      { id: 'm3b', module: 3, titre: 'Dériver la vitesse', apres: ['module_3b_cours'],
        competences: [
          { id: 'c1', texte: 'Calculer a quand on connaît v(t) : a = v′', types: ['formule'], source: 'fiche_3 · Dériver la vitesse ; À retenir' },
          { id: 'c2', texte: 'Exercice-type : v = k × t + v0 donne a = k (la dérivée d\'une constante est nulle)', types: ['methode'], source: 'fiche_3 · exemple v = 7,25 t ; série 3 · diagnostic « la dérivée d\'une constante est nulle » ; exercice 3' },
        ] },

      /* ---------- Module 3 · Vitesse constante ---------- */
      { id: 'm3c', module: 3, titre: 'Vitesse constante', apres: ['module_3c_cours'],
        competences: [
          { id: 'c1', texte: 'Savoir qu\'une vitesse constante donne a = 0 (la vitesse ne varie pas) · deux sens', types: ['savoir'], source: 'fiche_3 · Vitesse constante ; À retenir' },
        ] },

      /* ---------- Module 3 · Accélération constante ---------- */
      { id: 'm3d', module: 3, titre: 'Accélération constante', apres: ['module_3d_cours'],
        competences: [
          { id: 'c1', texte: 'Calculer une accélération constante : a = Δv / Δt = (vfin − vdébut) / durée', types: ['formule'], source: 'fiche_3 · Accélération constante ; À retenir' },
          { id: 'c2', texte: 'Calculer une durée : Δt = Δv / a', types: ['formule'], source: 'série 3 · « Combien de temps lui faut-il ? » (pas dans la fiche)' },
          { id: 'c3', texte: 'Convertir une vitesse des km/h aux m/s : on divise par 3,6', types: ['formule'], source: 'fiche_3 · km/h → m/s ; cours 3d · étape 2' },
          { id: 'c4', texte: 'Réflexe : vitesse en km/h dans a = Δv / Δt, la convertir en m/s avant de calculer · calculatrice', types: ['reflexe'], source: 'série 3 · diagnostic « Utilise la vitesse en m/s » ; exercice 1' },
          { id: 'c5', texte: 'Interpréter un résultat négatif : le système ralentit ; pour la valeur de a, on garde le nombre positif', types: ['savoir'], source: 'fiche_3 ; séries 3 et 4 · diagnostic « Pour la valeur, garde le nombre positif »' },
        ] },

      /* ---------- Module 3 · Accélération et forces ---------- */
      { id: 'm3e', module: 3, titre: 'Accélération et forces', apres: ['module_3e_cours'],
        competences: [
          { id: 'c1', texte: 'Calculer a à partir des forces : a = Σ F / m (Σ F en N, m en kg, a en m·s−2)', types: ['formule'], source: 'fiche_3 · Accélération et forces ; À retenir ; série 4' },
        ] },

      /* ---------- Module 4 · Principe fondamental de la dynamique ---------- */
      { id: 'm4a', module: 4, titre: 'Principe fondamental de la dynamique', apres: ['module_4a_cours'],
        competences: [
          { id: 'c1', texte: 'Énoncer le principe fondamental de la dynamique : dans un référentiel galiléen, m a⃗ = Σ F⃗ext (m en kg, a en m·s−2, Σ F en N)', types: ['formule'], source: 'fiche_4 · Le principe fondamental ; À retenir' },
          { id: 'c2', texte: 'Définir la résultante des forces Σ F⃗ext : la somme de toutes les forces extérieures', types: ['definition'], source: 'fiche_4 ; cours 4a' },
          { id: 'c3', texte: 'Calculer la résultante : Σ F = m × a', types: ['formule'], source: 'fiche_4 · Direction et valeur ; cours 4a · exemple ; série 4' },
          { id: 'c4', texte: 'Calculer la masse : m = Σ F / a', types: ['formule'], source: 'série 4 · « Retrouver la masse » (pas dans la fiche)' },
        ] },

      /* ---------- Module 4 · Principe d'inertie ---------- */
      { id: 'm4b', module: 4, titre: 'Principe d\'inertie', apres: ['module_4b_cours'],
        competences: [
          { id: 'c1', texte: 'Énoncer le principe d\'inertie : Σ F⃗ = 0⃗ ⇔ immobile ou mouvement rectiligne uniforme', types: ['definition'], source: 'fiche_4 · Le principe d\'inertie ; À retenir' },
          { id: 'c2', texte: 'Réflexe : un système en mouvement rectiligne uniforme (parachutiste à vitesse constante) : Σ F⃗ = 0⃗, les forces se compensent', types: ['reflexe'], source: 'série 4 · diagnostic « Mouvement rectiligne uniforme : Σ F = 0 » ; cours 4b · exemple ; exercice 19' },
        ] },

      /* ---------- Module 4 · Résultante des forces et accélération ---------- */
      { id: 'm4c', module: 4, titre: 'Résultante des forces et accélération', apres: ['module_4c_cours'],
        competences: [
          { id: 'c1', texte: 'Savoir que a⃗ et Σ F⃗ ont la même direction et le même sens', types: ['savoir'], source: 'fiche_4 · Direction et valeur ; série 4 · « Direction de a » ; exercices 9, 10' },
          { id: 'c2', texte: 'Construire la résultante sans souci d\'échelle : forces opposées → on soustrait ; perpendiculaires → diagonale du rectangle · crayon', types: ['methode'], source: 'fiche_4 ; cours 4c · À toi ; exercices 9, 11' },
        ] },

      /* ---------- Module 4 · Méthode type ---------- */
      { id: 'm4d', module: 4, titre: 'Méthode type', apres: ['module_4d_cours'],
        competences: [
          { id: 'c1', texte: 'Projeter sur la direction du mouvement : m a = Fm − f, puis isoler l\'inconnue (Fm = m a + f ; f = Fm − m a)', types: ['formule'], source: 'fiche_4 · Méthode type ; cours 4d ; série 4 · diagnostic « N\'oublie pas les frottements »' },
          { id: 'c2', texte: 'Exercice-type : voiture de masse m, accélération a, frottements f : trouver la force motrice Fm (démarche : bilan, forces qui se compensent, Σ F, projection) · crayon et calculatrice', types: ['methode'], source: 'fiche_4 · exemple ; cours 4d · À toi ; exercices 1, 2, 5' },
        ] },
    ],
  });
})();
