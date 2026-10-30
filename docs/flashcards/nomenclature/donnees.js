/* Relecture des flashcards de l'application « Nomenclature » (nomenclature)
   Tour 1 : compétences et paquets proposés (voir docs/flashcards/prompt-generation.md)
   Un paquet par sous-module de cours ; le module 4 (Exercices) n'a pas de cours : pas de paquet.
   Prérequis proposés : chaque paquet après son cours. */
(function () {
  RELECTURE({
    dossier: 'nomenclature', titre: 'Nomenclature', court: 'Nomenclature', matiere: 'chimie',
    tour: 1, etape: 'competences',
    // pages de cours de l'application (prérequis possibles)
    cours: [
      { cle: 'module_1a_cours', nom: 'Cours : combien de liaisons ?' },
      { cle: 'module_1b_cours', nom: 'Cours : les trois écritures' },
      { cle: 'module_1c_cours', nom: 'Cours : passer d\'une écriture à l\'autre' },
      { cle: 'module_2a_cours', nom: 'Cours : les alcanes à chaîne linéaire' },
      { cle: 'module_2b_cours', nom: 'Cours : nommer un alcane ramifié' },
      { cle: 'module_2c_cours', nom: 'Cours : du nom à la formule' },
      { cle: 'module_2d_cours', nom: 'Cours : les alcanes cycliques' },
      { cle: 'module_3a_cours', nom: 'Cours : alcènes, alcools, halogénoalcanes, amines' },
      { cle: 'module_3b_cours', nom: 'Cours : le groupe carbonyle' },
      { cle: 'module_3c_cours', nom: 'Cours : acides carboxyliques, esters, amides' },
      { cle: 'module_3d_cours', nom: 'Cours : nommer alcènes, alcools, aldéhydes, cétones, acides carboxyliques' },
      { cle: 'module_3e_cours', nom: 'Cours : nommer les esters, amines et amides' },
    ],
    paquets: [
      /* ---------- Module 1 · Représenter les molécules ---------- */
      { id: 'm1a', module: 1, titre: 'Combien de liaisons ?', apres: ['module_1a_cours'],
        competences: [
          { id: 'c1', texte: 'Énoncer la règle du duet (H : un seul doublet, liant)', types: ['definition'], source: 'fiche_1 · Combien de liaisons ? ; cours 1a · étape 1' },
          { id: 'c2', texte: 'Énoncer la règle de l\'octet (4 doublets autour de l\'atome, soit 8 électrons)', types: ['definition'], source: 'fiche_1 · Combien de liaisons ? ; À retenir' },
          { id: 'c3', texte: 'Calculer le nombre de doublets non liants : doublets non liants = 4 − doublets liants', types: ['formule'], source: 'fiche_1 · Combien de liaisons ? ; À retenir' },
          { id: 'c4', texte: 'Donner le nombre de liaisons et de doublets non liants de H, C, N, O et des halogènes (H 1 ; C 4 ; N 3 + 1 ; O 2 + 2 ; F, Cl, Br, I 1 + 3)', types: ['savoir'], source: 'À retenir ; série 1 · liaisons et doublets d\'un atome' },
          { id: 'c5', texte: 'Retrouver le nombre de liaisons avec la classification : cases vers la droite jusqu\'à la colonne des gaz nobles', types: ['savoir'], source: 'fiche_1 · Combien de liaisons ? ; série 1 · position dans la classification (diagnostic : cases comptées vers la gauche)' },
        ] },
      { id: 'm1b', module: 1, titre: 'Les trois écritures', apres: ['module_1b_cours'],
        competences: [
          { id: 'c1', texte: 'Définir la formule développée (de Lewis) : tous les atomes, toutes les liaisons, les doublets non liants', types: ['definition'], source: 'fiche_1 · Les trois écritures ; À retenir' },
          { id: 'c2', texte: 'Définir la formule semi-développée : les H regroupés sur leur atome (CH₃, CH₂, OH, NH₂)', types: ['definition'], source: 'fiche_1 · Les trois écritures ; À retenir' },
          { id: 'c3', texte: 'Définir la formule topologique : ni les C, ni les H liés aux C ; zigzag ; chaque sommet et chaque bout de trait est un C', types: ['definition'], source: 'fiche_1 · Les trois écritures ; À retenir' },
          { id: 'c4', texte: 'Lire les écritures abrégées : C₂H₅ = –CH₂–CH₃ ; (CH₂)₅ = cinq –CH₂– à la suite ; C₆H₅ = cycle benzénique qui porte 5 H', types: ['savoir'], source: 'fiche_1 · Les trois écritures ; série 1 · formule brute avec C₂H₅ ; exercices 3 et 5' },
          { id: 'c5', texte: 'Écrire la formule brute d\'une topologique sans oublier les C des bouts de traits ni les H implicites', types: ['reflexe'], source: 'série 1 · formule brute d\'une topologique, diagnostics « C des bouts de traits », « H implicites »' },
        ] },
      { id: 'm1c', module: 1, titre: 'Passer d\'une écriture à l\'autre', apres: ['module_1c_cours'],
        competences: [
          { id: 'c1', texte: 'Passer de la développée à la semi-développée : « on enlève les liaisons des H et on les regroupe sur leur atome »', types: ['savoir'], source: 'fiche_1 · Passer d\'une écriture à l\'autre ; À retenir' },
          { id: 'c2', texte: 'Passer à la topologique : « on efface tous les CH », puis le zigzag (le H d\'un OH reste)', types: ['savoir'], source: 'fiche_1 · Passer d\'une écriture à l\'autre ; série 1 · diagnostic « effacer le H d\'un OH »' },
          { id: 'c3', texte: 'Depuis la topologique : un C au bout de chaque trait, s\'il n\'y a pas déjà un autre atome ; nombre de H = 4 − nombre de traits', types: ['formule'], source: 'fiche_1 · Passer d\'une écriture à l\'autre ; À retenir ; série 1 · diagnostic « C ajouté au bout d\'un trait qui porte O ou N »' },
        ] },

      /* ---------- Module 2 · Nommer les alcanes ---------- */
      { id: 'm2a', module: 2, titre: 'Les alcanes à chaîne linéaire', apres: ['module_2a_cours'],
        competences: [
          { id: 'c1', texte: 'Définir un alcane : hydrocarbure saturé (C et H, liaisons simples)', types: ['definition'], source: 'fiche_2 · Les alcanes à chaîne linéaire ; À retenir' },
          { id: 'c2', texte: 'Connaître la formule brute des alcanes CₙH₂ₙ₊₂ (n : nombre de C)', types: ['formule'], source: 'fiche_2 · Les alcanes à chaîne linéaire ; série 2 · formule brute' },
          { id: 'c3', texte: 'Nommer les dix alcanes linéaires, de 1 à 10 C : méthane… décane', types: ['savoir'], source: 'fiche_2 · tableau des dix alcanes ; série 2 · alcanes linéaires' },
        ] },
      { id: 'm2b', module: 2, titre: 'Nommer un alcane ramifié', apres: ['module_2b_cours'],
        competences: [
          { id: 'c1', texte: 'Définir la chaîne principale : la chaîne carbonée la plus longue, pas forcément dessinée en ligne droite', types: ['definition'], source: 'fiche_2 · Nommer un alcane ramifié (1.) ; série 2 · toucher la chaîne la plus longue' },
          { id: 'c2', texte: 'Nommer un alcane ramifié en trois étapes : chaîne la plus longue ; « ane » → « yl », plus petits numéros, di, tri… ; ordre alphabétique, virgules et tirets', types: ['methode'], source: 'fiche_2 · Nommer un alcane ramifié ; À retenir' },
          { id: 'c3', texte: 'Repérer un nom faux : 1-méthylbutane, 2-éthylpentane (la chaîne n\'est pas la plus longue)', types: ['reflexe'], source: 'série 2 · trouver l\'erreur dans un nom' },
        ] },
      { id: 'm2c', module: 2, titre: 'Du nom à la formule', apres: ['module_2c_cours'],
        competences: [
          { id: 'c1', texte: 'Dessiner une molécule à partir de son nom, à l\'envers du nom : chaîne principale, numérotation, ramifications, H', types: ['methode'], source: 'fiche_2 · Du nom à la formule ; À retenir' },
          { id: 'c2', texte: 'Exercice-type : dessiner la formule topologique d\'un alcane ramifié à partir de son nom (3-éthyl-2-méthylhexane)', types: ['methode'], source: 'série 2 · du nom à la formule ; exercice 7 · ✎ crayon' },
        ] },
      { id: 'm2d', module: 2, titre: 'Les alcanes cycliques', apres: ['module_2d_cours'],
        competences: [
          { id: 'c1', texte: 'Définir un alcane cyclique : la chaîne se referme sur elle-même', types: ['definition'], source: 'cours 2d · introduction et étape 1' },
          { id: 'c2', texte: 'Nommer un alcane cyclique : cyclo + nom de l\'alcane ; un substituant : pas de numéro ; plusieurs : plus petits numéros, le premier dans l\'ordre alphabétique a le n° 1', types: ['savoir'], source: 'fiche_2 · Les alcanes cycliques ; À retenir' },
          { id: 'c3', texte: 'Exercice-type : nommer un alcane cyclique à deux substituants (1-éthyl-3-méthylcyclohexane)', types: ['methode'], source: 'cours 2d · exemple ; série 2 · alcane cyclique ; exercice 10 · ✎ crayon' },
        ] },

      /* ---------- Module 3 · Les familles ---------- */
      { id: 'm3a', module: 3, titre: 'Alcènes, alcools, halogénoalcanes, amines', apres: ['module_3a_cours'],
        competences: [
          { id: 'c1', texte: 'Définir le groupe caractéristique (groupe fonctionnel) et la famille (classe fonctionnelle)', types: ['definition'], source: 'fiche_3 · Familles et groupes caractéristiques ; cours 3a · introduction' },
          { id: 'c2', texte: 'Alcènes : double liaison C=C', types: ['definition'], source: 'fiche_3 · tableau des familles (par cœur)' },
          { id: 'c3', texte: 'Alcools : groupe hydroxyle –OH, sur un C qui ne porte pas de =O', types: ['definition'], source: 'fiche_3 · tableau des familles (par cœur)' },
          { id: 'c4', texte: 'Halogénoalcanes : groupe halogéno –X (X = F, Cl, Br ou I)', types: ['definition'], source: 'fiche_3 · tableau des familles (par cœur)' },
          { id: 'c5', texte: 'Amines : groupe amine –N, N lié seulement à des C (et à des H), sans C=O', types: ['definition'], source: 'fiche_3 · tableau des familles (par cœur)' },
          { id: 'c6', texte: 'Définir une amine primaire, secondaire, tertiaire : 1, 2 ou 3 C liés au N', types: ['definition'], source: 'fiche_3 · Amines ; À retenir' },
          { id: 'c7', texte: 'Exercice-type : entourer le groupe caractéristique, écrire son nom, puis la famille entre parenthèses', types: ['methode'], source: 'fiche_3 · Familles et groupes caractéristiques ; série 3 · groupe caractéristique ; exercices 4 et 5 · ✎ crayon' },
        ] },
      { id: 'm3b', module: 3, titre: 'Le groupe carbonyle', apres: ['module_3b_cours'],
        competences: [
          { id: 'c1', texte: 'Définir le groupe carbonyle : C=O (un O lié à un C par une double liaison)', types: ['definition'], source: 'cours 3b · étape 1' },
          { id: 'c2', texte: 'Aldéhydes : C=O en bout de chaîne (le C porte un H)', types: ['definition'], source: 'fiche_3 · Le groupe carbonyle ; tableau des familles' },
          { id: 'c3', texte: 'Cétones : C=O entre deux C', types: ['definition'], source: 'fiche_3 · Le groupe carbonyle ; tableau des familles' },
        ] },
      { id: 'm3c', module: 3, titre: 'Acides carboxyliques, esters, amides', apres: ['module_3c_cours'],
        competences: [
          { id: 'c1', texte: 'Acides carboxyliques : groupe carboxyle –COOH, le C=O et un OH sur le même C', types: ['definition'], source: 'fiche_3 · Acides carboxyliques, esters, amides ; tableau des familles' },
          { id: 'c2', texte: 'Esters : groupe ester –COO–C, le C=O et un O lié à un autre C, sur le même C', types: ['definition'], source: 'fiche_3 · Acides carboxyliques, esters, amides ; tableau des familles' },
          { id: 'c3', texte: 'Amides : groupe amide –CO–N, le C=O et un N sur le même C', types: ['definition'], source: 'fiche_3 · Acides carboxyliques, esters, amides ; tableau des familles' },
          { id: 'c4', texte: 'Ne pas confondre : acide ≠ alcool + cétone ; ester ≠ acide', types: ['reflexe'], source: 'À retenir ; série 3 · familles proches (diagnostics)' },
          { id: 'c5', texte: 'Ne pas confondre : amide ≠ amine + cétone', types: ['reflexe'], source: 'À retenir ; série 3 · familles proches (diagnostics)' },
        ] },
      { id: 'm3d', module: 3, titre: 'Nommer alcènes, alcools, halogénoalcanes, aldéhydes, cétones, acides carboxyliques', apres: ['module_3d_cours'],
        competences: [
          { id: 'c1', texte: 'Nommer une molécule à un groupe : la chaîne principale contient le groupe ; le n° est celui du C qui porte le groupe, le plus petit possible, juste devant la terminaison', types: ['savoir'], source: 'fiche_3 · Nommer ; À retenir ; diagnostic « 2-pentanol » (n° devant la terminaison)' },
          { id: 'c2', texte: 'Donner la terminaison du nom de chaque famille, et la famille d\'après le nom : -ène, -ol, -al, -one, acide …-oïque, préfixes fluoro, chloro, bromo, iodo (6 cartes, une par famille, -al et -oïque : pas de numéro)', types: ['savoir'], source: 'fiche_3 · Nommer ; cours 3d · tableau des terminaisons ; série 3 · famille d\'après le nom' },
        ] },
      { id: 'm3e', module: 3, titre: 'Nommer les esters, amines et amides', apres: ['module_3e_cours'],
        competences: [
          { id: 'c1', texte: 'Nommer un ester : alcanoate (chaîne du C=O, son C est le n° 1) d\'alkyle (chaîne liée à l\'O, numérotée à partir du C lié à l\'O)', types: ['savoir'], source: 'fiche_3 · Nommer : esters ; À retenir ; diagnostic « chaînes inversées »' },
          { id: 'c2', texte: 'Donner la terminaison du nom d\'une amine (…an-n-amine) et d\'un amide (…anamide), et la famille d\'après le nom (2 cartes)', types: ['savoir'], source: 'fiche_3 · Nommer : amines, amides ; À retenir ; série 3 · famille d\'après le nom' },
          { id: 'c3', texte: 'Noter N- les ramifications sur le N d\'une amine ou d\'un amide (N-éthyléthanamine)', types: ['savoir'], source: 'fiche_3 · Nommer : amines, amides ; À retenir' },
        ] },
    ],
  });
})();
