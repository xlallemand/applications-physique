# Mouvement dans un champ uniforme (prompt de génération)

Lis d'abord `docs/prompts-tspe/00-commun.md` (sources, charte, structure, outils partagés, livraison).

## Application

- Dossier `champ-uniforme/`, nom « Mouvement dans un champ uniforme », `data-matiere="physique"`, préfixe `cu`, espace de noms `CU`.
- Portail : `desc: "Équations horaires par intégration, trajectoire parabolique, particule chargée dans un condensateur, accélérateur linéaire."` ; `mots` : chute libre, primitive, intégrer, conditions initiales, équations horaires, parabole, portée, flèche, hauteur maximale, champ de pesanteur, g, champ électrique, condensateur plan, E = U/L, force électrostatique, qE, électron, proton, déviation, accélérateur de particules, CERN, canon à électrons…
- Dessin d'en-tête : trajectoire parabolique (regarde `cinematique/` et la liste de `assets/hero.js`).
- Outils : `VEC` (repère, vecteurs, coordonnées en colonne), `EQ` si une équation se manipule (isoler t, éliminer t), `LG`, `BULLE`, `PLEIN`.

## Sources (`08- Mouvement champ uniforme/`)

| Fichier | Contenu | À lire |
|---|---|---|
| `Chap08-Cours_champ_uniforme_complete.pdf` (14 p.) | Cours tapé, complété à la main (les calculs des exemples sont manuscrits) | Non : résumé ci-dessous. Pages 4 et 5 (chute sans vitesse initiale, rédaction complète), 11 et 12 (particule chargée), 13 et 14 (accélérateur) pour les rédactions et les figures |
| `Chap08-Exercices.pdf` (8 p.) | Ex. 1, 1 bis, 2, 2 bis (chute libre), 3 à 15, 16 « l'Airbus A300 Zéro-G » ; ex. 11 « déflexion électrique », 14 « masse de l'électron » | Oui |
| `Chap08-Exercices_correction.pdf` (17 p.) | Corrections | Oui |
| `A faire.txt` | « Ajouter “remplacer q par e ou −e”. Ajouter applications accélérateurs de particules (TV, CERN). » | Repris ci-dessous |
| `sens de U.txt` | « Flèche de la tension pointe vers la borne +, donc elle est dans le sens inverse de E. » | Repris ci-dessous |

Le TP de pointage vidéo (basket, Regressi) n'est pas repris.

## Consignes du professeur

- Faire une **animation du fonctionnement des accélérateurs linéaires** qui permet d'**observer l'inversion de polarité** quand la particule change de condensateur.
- Ajouts demandés par le professeur (fichiers `A faire.txt`, `sens de U.txt`) : **« remplacer q par e ou −e »** (proton, électron) dans les calculs ; **applications des accélérateurs** de particules (tube cathodique de télévision, CERN) ; **sens de U** : la flèche de la tension pointe vers la borne +, donc dans le sens inverse de E⃗ (E⃗ va de la plaque + vers la plaque −).

## Contenu du cours (résumé)

### I. Utiliser la deuxième loi de Newton pour déterminer un mouvement

- Chaîne : bilan des forces → ΣF⃗<sub>ext</sub> ; deuxième loi m a⃗ = ΣF⃗<sub>ext</sub> → a⃗ ; a⃗ = dv⃗/dt (on intègre) → v⃗ ; v⃗ = dOM⃗/dt (on intègre) → OM⃗.
- **Primitives** (on intègre par rapport au temps ; C, C<sub>1</sub>, C<sub>2</sub>… constantes fixées par les conditions initiales) : 0 → C ; A → At + C<sub>1</sub> ; At → ½At² + C<sub>2</sub> (vérification par dérivation). Exemples : primitives de 8, 8t, 8t + 8, 5t + 3, 3i⃗ + 4t j⃗ ; a(t) = 0 et v(0) = 8 → v(t) = 8 ; v<sub>x</sub>(t) = 8t et x(0) = 5 → x(t) = 4t² + 5.
- **Étapes de résolution** (à reprendre) : 1. système, schéma, repère ; 2. bilan des forces ; 3. accélération par la deuxième loi ; 4. vitesse en intégrant et conditions initiales ; 5. position en intégrant et conditions initiales ; 6. caractéristiques du mouvement (trajectoire, hauteur maximale, durée de chute…) en **traduisant la question avec une ou plusieurs équations établies**.

### II. Champ de pesanteur uniforme

- P⃗ = m g⃗ ; g⃗ vertical vers le bas, g = 9,81 N·kg<sup>−1</sup> = 9,81 m·s<sup>−2</sup> (démonstration par la deuxième loi : a⃗ = g⃗, « accélération de la pesanteur ») ; N = kg·m·s<sup>−2</sup> ; les 7 unités de base du SI (tableau). g⃗ uniforme dans une salle (coordonnées (0 ; 0 ; −g)) ; non uniforme à l'échelle de la Terre (dirigé vers le centre).
- **Chute sans vitesse initiale** (h = 2,0 m) : repère bien choisi (un seul axe vertical, origine au sol) et mal choisi ; a<sub>z</sub> = −g ; v<sub>z</sub> = −gt ; z = −½gt² + h ; durée de chute : z = 0.
- **Vitesse initiale horizontale** (v<sub>0</sub> = 5 m·s<sup>−1</sup>, h = 2,0 m) : équations horaires x = v<sub>0</sub>t, y = −½gt² + h ; **mouvement plan** (z(t) = 0 dans le plan défini par a⃗ et v⃗<sub>0</sub>) ; trajectoire y = −g x²/(2v<sub>0</sub>²) + h (parabole) ; durée de chute, distance d ; courbes v<sub>x</sub>(t), v<sub>y</sub>(t), x(t), y(t) commentées.
- **Vitesse initiale quelconque** (v<sub>0</sub> = 5 m·s<sup>−1</sup>, α = 40°, h = 2,0 m) : v<sub>x</sub>(0) = v<sub>0</sub> cos α, v<sub>y</sub>(0) = v<sub>0</sub> sin α (figure du triangle) ; x = (v<sub>0</sub> cos α)t ; y = −½gt² + (v<sub>0</sub> sin α)t + h ; **y = −g x² / (2(v<sub>0</sub> cos α)²) + (tan α) x + h** ; tableau « point particulier → traduction mathématique » : altitude maximale (sommet, v<sub>y</sub> = 0), distance du lancer (point de chute, y = 0), autre point (cible, passer sous la transversale d'un but 3,0 m à 4,6 m).

### III. Particule chargée dans un champ électrostatique uniforme

- F⃗<sub>él</sub> = q E⃗ (N, C, N·C<sup>−1</sup>) ; champ d'une charge ponctuelle (loi de Coulomb, k q q<sub>0</sub>/d²) ; **condensateur plan** : champ uniforme entre les plaques, de la plaque + vers la plaque − ; une charge positive est attirée par la plaque −, une négative par la plaque + ; **E = U / L** (V·m<sup>−1</sup>, V, m) ; sens de la flèche de U : vers la borne + (inverse de E⃗).
- Comparaison poids / force électrostatique pour un proton (m = 1,67 × 10<sup>−27</sup> kg, e = 1,60 × 10<sup>−19</sup> C, E = 1 V·m<sup>−1</sup>) : le poids est négligeable.
- **Équations** (même démarche que la chute, g remplacé par qE/m) : a⃗ = qE⃗/m ; x = (v<sub>0</sub> cos α)t, z = −(qE/2m)t² + (v<sub>0</sub> sin α)t ; z = −qE x²/(2m(v<sub>0</sub> cos α)²) + (tan α)x ; cas q > 0 et q < 0 (parabole vers une plaque ou l'autre). **Remplacer q par e ou −e** (proton, électron).
- **Accélérateur linéaire** : particule q > 0 en O sans vitesse initiale dans un condensateur de largeur L : a<sub>x</sub> = qE/m ; v<sub>x</sub> = (qE/m)t ; x = (qE/2m)t² ; t<sub>sortie</sub> = √(2mL/(qE)) ; **v<sub>sortie</sub> = √(2qU/m)** : ne dépend que de U, q et m (pas de L).
- **En pratique** : succession de condensateurs ; chaque fois que la particule change de condensateur, la polarité est inversée pour que le champ soit toujours dans le bon sens (figure : particule dans C<sub>1</sub> accélérée ; dans C<sub>2</sub>, on inverse la polarité du générateur, donc des armatures, pour qu'elle soit de nouveau accélérée) ; on accélère fortement avec des tensions relativement faibles.

## Plan de l'application (`PLAN`)

### Module 1 : De l'accélération à la position (intégrer)

Cours : la chaîne a⃗ → v⃗ → OM⃗, primitives, conditions initiales, les 6 étapes. **Atelier : primitive et condition initiale** (dans le cours en « À toi », ou page `simulation`) : la courbe de v(t) se construit à partir de a(t) ; la constante se fixe en glissant la courbe jusqu'à la condition initiale. Série : primitives (avec la vérification par dérivation), constantes, ex. 2 et 3 du cours.

### Module 2 : Chute libre dans un champ de pesanteur uniforme

- Sous-modules de cours : chute sans vitesse initiale ; vitesse initiale horizontale ; vitesse initiale quelconque (coordonnées de v⃗<sub>0</sub>, équations horaires, trajectoire) ; exploiter les équations (durée, portée, flèche, cible : tableau « point particulier → traduction mathématique »).
- **Simulateur : tir dans le champ de pesanteur** (`module_2_simulation.html`, un écran) : v<sub>0</sub>, α, h, g (Terre, Lune, Mars, comète 67P de l'ex. 16 / Philae) réglables à tout moment ; trajectoire, vecteurs v⃗ et a⃗ en quelques points (`VEC`), coordonnées en direct ; courbes v<sub>x</sub>(t), v<sub>y</sub>(t), x(t), y(t) dans un onglet ; équations horaires et équation de la trajectoire écrites avec les valeurs ; cible ou barre transversale. Défis dans n'importe quel ordre : atteindre la cible ; passer sous la barre ; trouver l'angle de portée maximale pour h = 0 (45°) ; rendre v<sub>y</sub> nulle au sommet ; montrer que v<sub>x</sub> est constante ; même mouvement d'une bille et d'une plume sans air.
- Série : équations horaires à compléter, coordonnées de v⃗<sub>0</sub> (cos / sin, diagnostics d'échange), durée de chute (résoudre y = 0), portée, flèche, équation de la trajectoire (éliminer t), lecture de courbes.

### Module 3 : Particule chargée dans un champ électrique uniforme

- Sous-modules : champ électrique et condensateur plan (E = U/L, sens de E⃗ et de la flèche de U, force sur + et −) ; comparaison poids / force électrique ; équations du mouvement (analogie g ↔ qE/m, q remplacé par e ou −e) ; déviation (q > 0, q < 0).
- **Simulateur : déviation dans un condensateur** (un écran) : U, L, longueur des plaques, particule (électron, proton, particule α, ion), v<sub>0</sub>, α ; trajectoire, sortie ou choc sur une plaque, déviation ; analogie avec la chute affichée. Défis : faire sortir l'électron sans toucher ; inverser la déviation ; vérifier que le poids est négligeable ; trouver la masse de l'électron à partir d'une déviation mesurée (ex. 14).
- Série : sens de F⃗, valeur de E, a, équations, nature de la trajectoire, poids négligeable (rapport des ordres de grandeur).

### Module 4 : Accélérateurs de particules

- Cours : accélération dans un condensateur (démonstration, v<sub>sortie</sub> = √(2qU/m)) ; accélérateur linéaire en pratique ; **applications** (canon à électrons d'un tube cathodique de télévision ou d'oscilloscope, accélérateurs linéaires du CERN avant les anneaux, radiothérapie, analyse d'œuvres d'art — ex. 9 du chapitre Énergie « un accélérateur au service de l'art »).
- **Animation : l'accélérateur linéaire** (`module_4_simulation.html`, page `simulation` « Animation : accélérateur linéaire », un écran) — consigne du professeur :
  - une suite de condensateurs (ou de tubes de glissement, comme dans un vrai accélérateur linéaire, avec un schéma simplifié en condensateurs) alimentés par un **générateur dont la polarité s'inverse** ; les signes + et − des armatures, le sens de E⃗ (flèches) et la flèche de U s'affichent en continu ;
  - la particule (proton, électron) avance ; **à chaque changement de condensateur, la polarité s'inverse** (flash discret sur les signes, compteur d'inversions) ; la vitesse augmente par paliers (graphique v(t) ou v après chaque étage dans le panneau ; v<sub>n</sub> = √(2nqU/m) non relativiste) ;
  - mode « **sans inversion** » : la particule est accélérée puis freinée (elle oscille ou repart en arrière) : l'élève voit pourquoi il faut inverser ;
  - mode « **inversion mal synchronisée** » (fréquence réglable) : la particule arrive quand le champ est dans le mauvais sens ; l'élève règle la fréquence pour que l'inversion tombe au bon moment ; les étages s'allongent pour garder la synchronisation (comme dans un vrai accélérateur) ;
  - réglages : U, nombre d'étages, particule, fréquence ; Lecture / Pause / Pas à pas / vitesse.
  - Défis : atteindre une vitesse donnée ; comprendre pourquoi l'électron demande l'autre polarité ; montrer que la vitesse ne dépend pas de L ; régler la synchronisation.
- Série : v<sub>sortie</sub> (q = e ou −e), U nécessaire pour une vitesse donnée, nombre d'étages, sens de la polarité au bon moment.

### Module 5 : Exercices

Ex. 1 à 16 de la feuille, dans l'ordre et avec la numérotation de la feuille (1, 1 bis, 2, 2 bis…). Les « bis » reprennent la même situation que l'exercice précédent en chute libre avec un autre repère ou d'autres données : garde-les séparés. Ex. 16 (Airbus A300 Zéro-G : vol parabolique) : question complexe guidée.

## Vérifications propres

- Script : chaque valeur des exemples (h = 2,0 m : t<sub>chute</sub> = 0,64 s ; tir horizontal v<sub>0</sub> = 5 m·s<sup>−1</sup> : d = 3,2 m ; tir à 40° : sommet et portée) et des exercices ; formules du simulateur comparées à une intégration numérique.
- Animation de l'accélérateur : inversion au bon moment à chaque étage, mode sans inversion, reduced-motion (étapes).
