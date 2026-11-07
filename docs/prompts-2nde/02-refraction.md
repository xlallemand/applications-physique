Lis `docs/prompts-2nde/00-commun.md`, puis exécute ce prompt.

# 02 · Réfraction et loi de Snell-Descartes (A12, avec la dispersion de A17)

## 1. Application

- Nom : **« Réfraction et loi de Snell-Descartes »** ; dossier `refraction/` ; préfixe `rf`, espace de noms `RF` ; `data-matiere="physique"` ; kicker « Physique · Seconde ».
- Portail : `dom: 'physique'`, `desc: "Normale, angles, loi de Descartes, indice d'un milieu, simulateur de réfraction et dispersion par un prisme."`
- Dessin d'en-tête : **nouveau dessin `rayons`** dans `assets/hero.js` : surface de séparation horizontale, normale en pointillés, rayons incidents et réfractés fins (quelques-uns), arc d'angle, et un petit prisme qui étale un pinceau en éventail. Il resservira à `03-lentilles.md`.
- Cette application crée l'outil partagé **`OPT`** (`assets/optique.js`, `assets/optique.css`), réutilisé par `03-lentilles.md`.

## 2. Objectif et programme

Indispensable I2, plus la dispersion (application A17 intégrée en module 5, choix de l'enseignant). Capacités exigibles :
- « Exploiter les lois de Snell-Descartes pour la réflexion et la réfraction. »
- « Tester les lois de Snell-Descartes à partir d'une série de mesures et déterminer l'indice de réfraction d'un milieu. »
- « Décrire et expliquer qualitativement le phénomène de dispersion de la lumière par un prisme. »
- « Caractériser un rayonnement monochromatique par sa longueur d'onde dans le vide ou dans l'air. »

## 3. Ce que dit le cours

Sources : `02- Lumiere/Chap2-Cours complete.pdf` (3 p.), `Chap2-Fiche methode.pdf`, `TP1-refraction_complete.docx`, `Chap2-Exercices.pdf` et sa correction, `Devoir.pdf`, `Interro.docx`, `TP2-dispersion_lumiere complete.pdf` (partie I).

- Le cours dit **« loi de Descartes »** (le nom de l'application garde « Snell-Descartes », comme le programme) ; dans les textes de l'application, écris « loi de Descartes ».
- **Rayon** : trait avec une flèche au milieu, « toujours vers l'œil » ; la lumière se propage en ligne droite dans un milieu homogène.
- **Réflexion** : « lumière qui se réfléchit en arrivant sur une surface de séparation entre deux milieux » ; **réfraction** : « changement de direction de la lumière quand elle traverse la surface de séparation entre deux milieux transparents différents » (exemple air / eau : réflexion, « la surface de l'eau fait miroir », et réfraction).
- **Loi de Descartes pour la réflexion** : i<sub>1</sub> = i<sub>2</sub> (figure : deux angles de part et d'autre de la normale en pointillés). Dans le simulateur, nomme l'angle du rayon réfléchi « angle de réflexion » pour ne pas le confondre avec l'angle de réfraction, et rappelle « on l'écrit i<sub>1</sub> = i<sub>2</sub> ».
- **Loi de Descartes pour la réfraction** (figure du cours p. 2, à reproduire) : normale en pointillés avec l'angle droit marqué en I, rayon incident dans le **milieu 1 (n<sub>1</sub>)**, rayon réfracté dans le **milieu 2 (n<sub>2</sub>)**, **i<sub>1</sub> (angle d'incidence)** entre la normale et le rayon incident, **i<sub>2</sub> (angle de réfraction)** entre la normale et le rayon réfracté. Formule encadrée : n<sub>1</sub> sin(i<sub>1</sub>) = n<sub>2</sub> sin(i<sub>2</sub>) ; la fiche méthode écrit **n<sub>1</sub> × sin(i<sub>1</sub>) = n<sub>2</sub> × sin(i<sub>2</sub>)**, « n<sub>1</sub> (milieu d'incidence) et n<sub>2</sub> (milieu de réfraction) ». Exercice 1 : « l'indice 1 pour le milieu contenant le rayon incident et l'indice 2 pour le milieu contenant le rayon réfracté ».
- « La **normale** est la droite perpendiculaire en I à la surface de séparation. »
- **Rayon perpendiculaire** : non dévié ; justification du cours : i<sub>1</sub> = 0°, n<sub>1</sub> × sin(0) = n<sub>2</sub> × sin(i<sub>2</sub>), donc sin(i<sub>2</sub>) = 0 et i<sub>2</sub> = 0.
- **Choix de l'enseignant : indices notés par le nom du milieu** (fiche méthode) : n<sub>air</sub> × sin(i<sub>1</sub>) = n<sub>verre</sub> × sin(i<sub>2</sub>). Les angles gardent i<sub>1</sub> et i<sub>2</sub>.
- **Méthode** (cours II.3.d et fiche méthode), dans cet ordre : faire un schéma (rayons, normale, angles, milieux) ; écrire la loi en adaptant les notations ; donner l'expression littérale de ce qu'on cherche (sin(i<sub>2</sub>) = n<sub>air</sub> × sin(i<sub>1</sub>) / n<sub>verre</sub>, ou n<sub>verre</sub> = n<sub>air</sub> × sin(i<sub>1</sub>) / sin(i<sub>2</sub>)) ; calculatrice **en degrés** ; application numérique de sin(i<sub>2</sub>) ; angle par « SHIFT sin » (sin<sup>−1</sup>, Asin) puis « ans » ; résultat avec le bon nombre de chiffres significatifs (interrogation : « 2 chiffres significatifs car 25° a 2 cs, 1,00 en a 3 et 1,33 en a 3 »).
- **Indices** : n<sub>air</sub> = 1,00 ; n<sub>eau</sub> = 1,33 ; **n<sub>verre</sub> = 1,50** (choix de l'enseignant ; la fiche méthode écrit 1,51) ; n<sub>plexi</sub> = 1,51.
- **Exemples corrigés** (à reprendre) : air → eau, i<sub>1</sub> = 30,0° : sin(i<sub>2</sub>) = 0,376, i<sub>2</sub> = 22° ; eau → verre, i<sub>1</sub> = 30,0° : 0,443, i<sub>2</sub> = 26,3° ; eau → air avec i<sub>2</sub> = 35,0° : sin(i<sub>1</sub>) = 0,431, i<sub>1</sub> = 25,5° ; plexiglas, i<sub>1</sub> = 60,0° et i<sub>2</sub> = 35,1° : n<sub>plexi</sub> = 1,51 ; devoir : demi-disque d'eau, i<sub>1</sub> = 60,0°, i<sub>2</sub> = 40,6° : n<sub>eau</sub> = 1,33 ; fiche : air → verre, 55° : i<sub>2</sub> = 33°.
- Corrections de l'exercice 1 : surfaces **horizontales et verticales**, lumière venant d'en haut, d'en bas, de gauche ou de droite ; la correction place toujours i<sub>1</sub> du côté du rayon incident.
- **TP1** : expérience de la pièce (la pièce cachée par le bord du récipient réapparaît quand on verse de l'eau : schéma eau → air, milieu 1 eau, milieu 2 air) ; mesures air → plexiglas avec un demi-cylindre sur un disque gradué, lampe sur 12 V, réglage du zéro (i<sub>1</sub> = 0 donne i<sub>2</sub> = 0) ; tableau pour i<sub>1</sub> = 0, 10, 20, 30, 40, 50, 60 et 80° ; graphique **sin(i<sub>1</sub>) en fonction de sin(i<sub>2</sub>)** : points en « + » (pas en ×), non reliés, droite qui passe au plus près de tous les points (autant au-dessus qu'au-dessous) ; relation de proportionnalité ; application : i<sub>1</sub> = 25°, 35°, 45° → i<sub>2</sub> ; i<sub>2</sub> = 25° → i<sub>1</sub>.
- **Dispersion** (cours III, TP2 I.1) : la lumière blanche est décomposée par un prisme en une infinité de radiations (couleurs) : son spectre, continu de 400 nm à 800 nm ; une lumière **monochromatique** ne peut pas être décomposée ; elle est caractérisée par sa **longueur d'onde λ** (lambda) en mètres, unité usuelle le nm (1 nm = 10<sup>−9</sup> m) ; lumière **polychromatique** ; l'indice du prisme dépend de la longueur d'onde : **les radiations bleues (petite λ) sont plus déviées que les rouges** ; « la lumière est réfractée deux fois, ce qui accentue le phénomène ».
- **Exercice du prisme** (exercice 7, devoir exercice 6) : prisme ABC rectangle en C, angle au sommet A = 30,0° ; un rayon de lumière blanche arrive perpendiculairement en I sur la face AC (non dévié), rencontre la face AB en J avec un angle d'incidence de 30,0° ; flint : n<sub>b</sub> = 1,673 (bleu ; l'exercice dit violet) et n<sub>r</sub> = 1,609 (rouge) ; angles de réfraction **i<sub>2b</sub> = 56,8°** et **i<sub>2r</sub> = 53,6°** (notations du devoir) ; le bleu est le plus dévié.
- **Ne pas faire référence aux numéros d'exercices, aux TP, au cours**. L'application est indépendante des sources.

À relire seulement pour refaire les schémas : figures de l'exercice 1 et de sa correction (quatre orientations), photo du TP1 (disque gradué), figure du prisme.

## 4. Plan de l'application (`PLAN`)

### Module 1 : Placer les éléments du schéma (manipulation guidée, `module_1_manip.html`)

Situations (dans cet ordre, puis tirées au hasard au deuxième passage) :
1. air → eau, surface horizontale, lumière venant d'en haut à gauche (exercice 2, i<sub>1</sub> = 30°) ;
2. eau → air, la pièce du TP1 (lumière venant du fond) ;
3. air → verre, surface **verticale**, lumière venant de gauche (fiche méthode) ;
4. verre → air, surface verticale, lumière venant de droite ;
5. air → plexiglas, demi-cylindre du TP1 (lumière arrivant au centre de la face plane) ;
6. incidence normale (air → eau) ;
7. verre → air, surface inclinée (face d'un prisme).

Pas à pas, chaque pas vérifié avant le suivant :
1. **Toucher le point d'incidence I** (cible de 44 px) ; erreur : « I est le point où le rayon rencontre la surface de séparation. »
2. **Tracer la normale** : un trait pointillé pivote autour de I (glisser son extrémité, ou ◀ ▶ par pas de 1°) ; validé à ± 3° de la perpendiculaire, l'angle droit se dessine ; erreur si le trait est le long de la surface : « Ce trait suit la surface ; la normale est perpendiculaire à la surface en I. »
3. **Nommer les rayons** : glisser les étiquettes « rayon incident », « rayon réfracté » (et « rayon réfléchi » quand il est dessiné) sur les rayons, puis toucher chaque rayon pour placer sa flèche dans le sens de la lumière.
4. **Placer i<sub>1</sub> et i<sub>2</sub>** : la figure montre, autour de I, les arcs possibles (entre chaque rayon et la normale, entre chaque rayon et la surface) ; l'élève glisse « i<sub>1</sub> » et « i<sub>2</sub> » sur un arc.
5. **Milieux** : glisser « milieu 1 : air (n<sub>air</sub> = 1,00) » et « milieu 2 : eau (n<sub>eau</sub> = 1,33) » sur les deux milieux.
6. Dans les situations 2, 4 et 7, le rayon réfracté n'est pas dessiné : **tracer son allure** (glisser son extrémité, ou ◀ ▶) ; validé s'il est de l'autre côté de la normale et s'il se rapproche ou s'éloigne de la normale comme il faut (tolérance large, c'est une allure ; la valeur exacte s'affiche ensuite).

Erreurs à diagnostiquer :
- angle placé entre le rayon et la surface : « Les angles se mesurent depuis la normale, pas depuis la surface. » ;
- milieux ou indices inversés : « Le milieu 1 est celui qui contient le rayon incident. » ;
- rayon réfracté du même côté de la normale que le rayon incident : « Le rayon réfracté traverse la surface et passe de l'autre côté de la normale. » ;
- rayon qui se rapproche de la normale au lieu de s'en éloigner (et l'inverse) : « n<sub>eau</sub> > n<sub>air</sub> : dans n<sub>air</sub> × sin(i<sub>1</sub>) = n<sub>eau</sub> × sin(i<sub>2</sub>), sin(i<sub>2</sub>) est plus petit que sin(i<sub>1</sub>), donc i<sub>2</sub> < i<sub>1</sub> : le rayon réfracté se rapproche de la normale. » (et le texte inverse pour eau → air) ;
- incidence normale : rayon réfracté dévié : « i<sub>1</sub> = 0°, donc sin(i<sub>2</sub>) = 0 et i<sub>2</sub> = 0° : le rayon n'est pas dévié. »

Bilan : le schéma complet avec ses étiquettes, comme la figure du cours.

### Module 2 : Écrire la loi de Descartes (manipulation guidée, `module_2_manip.html`)

- Mêmes situations (schéma complet affiché). Étiquettes à glisser dans une ligne de cases : n<sub>air</sub>, n<sub>eau</sub>, n<sub>verre</sub>, n<sub>plexi</sub>, sin(i<sub>1</sub>), sin(i<sub>2</sub>), i<sub>1</sub>, i<sub>2</sub>, ×, = ; l'élève écrit n<sub>air</sub> × sin(i<sub>1</sub>) = n<sub>eau</sub> × sin(i<sub>2</sub>), notations accordées aux milieux de la situation.
- Puis l'**expression littérale** de la grandeur cherchée (fraction à remplir avec les étiquettes) : sin(i<sub>2</sub>) = n<sub>air</sub> × sin(i<sub>1</sub>) / n<sub>eau</sub>, ou sin(i<sub>1</sub>) = …, ou n<sub>plexi</sub> = n<sub>air</sub> × sin(i<sub>1</sub>) / sin(i<sub>2</sub>).
- Puis l'application numérique (champ : sin(i<sub>2</sub>) à 3 chiffres), puis l'angle (champ, ou bouton « sin<sup>−1</sup> » d'une petite calculatrice à l'écran qui reprend la valeur, comme « SHIFT sin » puis « ans »).
- Erreurs : indices échangés (n<sub>eau</sub> × sin(i<sub>1</sub>)) ; sin oublié (n<sub>air</sub> × i<sub>1</sub>) ; n<sub>1</sub> et n<sub>2</sub> écrits au lieu des noms des milieux (« adapte les notations : écris n<sub>air</sub> et n<sub>eau</sub> ») ; fraction renversée ; résultat calculé en radians (si la valeur saisie correspond au calcul en radians : « ta calculatrice est en radians : mets-la en degrés ») ; sinus donné à la place de l'angle (« c'est sin(i<sub>2</sub>) ; il faut maintenant l'angle : sin<sup>−1</sup> ») ; sinus supérieur à 1 (hors programme, voir module 3).

### Module 3 : Simulateur (simulation, `module_3_simulation.html`)

- Deux milieux au choix (air, eau, verre, plexiglas, « milieu inconnu »), surface horizontale ; source glissée sur un cercle autour de I, ou boutons − 1° / + 1° ; **rapporteur gradué** autour de I (comme le disque du TP1) ; rayon incident, rayon réfracté, rayon réfléchi (case à cocher), angles et valeurs affichés.
- Déroulé guidé :
  1. i<sub>1</sub> = 0° : le rayon n'est pas dévié ;
  2. augmente i<sub>1</sub> : i<sub>2</sub> augmente aussi ;
  3. air → eau : i<sub>2</sub> < i<sub>1</sub> ; eau → air : i<sub>2</sub> > i<sub>1</sub> ;
  4. coche le rayon réfléchi : l'angle de réflexion est égal à i<sub>1</sub> ;
  5. **mesures du TP1** (air → plexiglas) : l'élève règle i<sub>1</sub> = 0, 10, 20…, 80°, lit i<sub>2</sub> au rapporteur et remplit le tableau (colonnes i<sub>1</sub> (°), i<sub>2</sub> (°), sin(i<sub>1</sub>), sin(i<sub>2</sub>), une ligne par mesure, charte §4) ; la lecture du rapporteur est au degré près ;
  6. **graphique** sin(i<sub>1</sub>) en fonction de sin(i<sub>2</sub>) : les points se placent en « + » ; l'élève fait pivoter une droite passant par l'origine (glisser, ou ± 0,01 sur la pente) jusqu'à ce qu'elle passe au plus près des points ; la pente lue est n<sub>plexi</sub> ≈ 1,5 ;
  7. défi : « milieu inconnu » (indice tiré entre 1,30 et 1,70) : mesurer i<sub>1</sub> et i<sub>2</sub>, calculer n.
- **Réflexion totale** (choix de l'enseignant : montrée, hors programme) : du milieu d'indice le plus grand vers le plus petit, au-delà de l'angle limite (eau → air : 48,8° ; verre → air : 41,8°), le rayon réfracté disparaît et le rayon réfléchi devient intense ; une bulle ⓘ « **Hors programme.** Au-delà de cet angle, il n'y a plus de rayon réfracté : toute la lumière est réfléchie (réflexion totale). » apparaît à côté de la figure.

### Module 4 : Calculer un angle ou un indice (série notée sur 20, `module_4_questions.html`)

Chaque question suit la fiche méthode, en parties successives : (a) choisir le bon schéma parmi trois (angles depuis la surface, milieux inversés, juste) ou placer i<sub>1</sub> et i<sub>2</sub> ; (b) écrire la loi avec les étiquettes ; (c) expression littérale ; (d) valeur de sin ; (e) angle ou indice, avec le nombre de chiffres significatifs demandé.
Groupes : calculer i<sub>2</sub> (air → eau, air → verre, eau → verre) ; calculer i<sub>1</sub> à partir de i<sub>2</sub> (eau → air, verre → air) ; calculer un indice (plexiglas, eau, milieu inconnu) ; incidence normale ; données du TP (i<sub>1</sub> = 25°, 35°, 45°) ; comparer i<sub>1</sub> et i<sub>2</sub> sans calcul (le rayon se rapproche-t-il de la normale ?). Valeurs d'angles entières ou à 0,1° près, choisies pour un sinus inférieur à 1.

### Module 5 : Dispersion de la lumière par un prisme (deux pages)

**Simulation (`module_5_simulation.html`)** : un prisme (triangle) sur une table, une source de lumière **blanche** ou **monochromatique** (rouge 650 nm, vert 530 nm, bleu 450 nm), un écran.
- Le pinceau est réfracté à l'entrée puis à la sortie du prisme ; en lumière blanche, il s'étale en éventail et le spectre continu (400 à 800 nm) se forme sur l'écran ; en lumière monochromatique, une seule tache de la couleur de la source.
- L'élève tourne le prisme (glisser, ou ± 1°) et déplace la source ; il peut afficher les normales et les angles aux deux faces.
- Déroulé guidé : 1. lumière blanche : spectre continu ; 2. touche le rayon le plus dévié : le bleu ; 3. lumière monochromatique : pas de décomposition ; 4. « réfractée deux fois » : affiche les deux normales.
- Indice du prisme selon λ, entre n<sub>r</sub> = 1,609 (700 nm) et n<sub>b</sub> = 1,673 (450 nm) (loi de Cauchy n = A + B / λ² ajustée sur ces deux valeurs, calcul interne, jamais montré).
- Lien « Revois les spectres » → `spectres-etoiles/`.

**Manipulation guidée (`module_5_manip.html`)** : l'exercice du prisme du cours (A = 30,0°, rayon perpendiculaire à AC en I) :
1. placer la normale en J et l'angle d'incidence i<sub>1</sub> sur la face AB (outil du module 1) ; trouver i<sub>1</sub> = 30,0° (choix : 30°, 60°, 90°, avec le diagnostic « l'angle se mesure depuis la normale ») ;
2. écrire la loi pour le bleu : n<sub>b</sub> × sin(i<sub>1</sub>) = n<sub>air</sub> × sin(i<sub>2b</sub>), puis i<sub>2b</sub> = 56,8° ;
3. même chose pour le rouge : i<sub>2r</sub> = 53,6° ;
4. les deux rayons se tracent ; question : « Quel est le rayon le plus dévié ? » et « Comment s'appelle ce phénomène ? » (dispersion) ;
5. bilan : l'indice dépend de la longueur d'onde ; les radiations bleues (petite λ) sont plus déviées que les rouges.
- Erreur à diagnostiquer : n<sub>b</sub> et n<sub>air</sub> à la mauvaise place (la lumière sort du verre : milieu 1 = verre).

## 5. Rendu

- SVG. Milieux : air sur fond `--sheet`, eau, verre et plexiglas sur fonds `--paper` / `--paper-2` avec un nom écrit (jamais seulement une couleur). Surface `--ink` épaisse, normale pointillée `--ink-2`, rayons `--accent` avec flèche au milieu, arcs d'angle fins, rapporteur gradué `--ink-3`.
- Couleurs du spectre et des radiations : calculées à partir de λ avec `SP.rgb(λ)` de `spectres-etoiles/modules/sp.js` (chargé depuis son dossier), en attributs de présentation SVG, comme dans `spectres-etoiles/`.
- 1280 px : figure carrée à gauche (environ 480 px), étapes à droite ; 390 px : figure pleine largeur, étiquettes et boutons dessous.

## 6. Outils

- **À créer : `OPT`** (`assets/optique.js`, `assets/optique.css`), plusieurs exemplaires par page :
  - `OPT.scene(zone, { milieux: [{ nom, n, couleurFond }], dioptre: { type: 'plan' | 'demiCylindre' | 'prisme', angle, sommets }, rayons, options })` → `{ svg, maj(etat), I, normale, … }` ;
  - calcul : `OPT.refracter(n1, n2, i1)` → `{ i2 }` ou `{ totale: true }`, `OPT.reflechir(i1)`, tracé d'un rayon à travers plusieurs dioptres (prisme) ;
  - éléments manipulables : point I à toucher, normale pivotante, rayon dont on glisse l'extrémité (avec ◀ ▶), étiquettes déposables sur les rayons, arcs et milieux, rapporteur ;
  - pensé pour être **étendu par `03-lentilles.md`** (lentille mince, axe optique, foyers, rayons particuliers) : sépare la géométrie (rayons, intersections) du rendu.
- `assets/dragdrop.js` (étiquettes) ; `BULLE` (bulles ⓘ, créée par `01`) ; `SP.rgb` de `spectres-etoiles/modules/sp.js` (lecture seule ; si tu dois l'étendre, fais-le de façon compatible et reteste `spectres-etoiles/`).
- Graphique du TP : SVG propre au simulateur (points « + », droite pivotante) ; `LG` n'est pas nécessaire.

## 7. Vérifications propres

- Recalculer par script : 0,376 et 22,1° ; 0,443 et 26,3° ; 0,431 et 25,5° ; 1,51 (60° / 35,1°) ; 1,33 (60° / 40,6°) ; 33,1° (55°, n<sub>verre</sub> = 1,50) ; angles limites 48,8° (eau) et 41,8° (verre) ; prisme 56,8° et 53,6° ; TP1 avec n<sub>plexi</sub> = 1,51 : i<sub>2</sub> = 0 ; 6,6 ; 13,1 ; 19,3 ; 25,2 ; 30,5 ; 35,0 ; 40,7° ; i<sub>1</sub> = 25°, 35°, 45° → 16,3°, 22,3°, 27,9° ; i<sub>2</sub> = 25° → i<sub>1</sub> = 39,7°.
- Chaque situation du module 1 dans ses quatre orientations : normale validée seulement à ± 3° de la perpendiculaire, rayon réfracté du bon côté.
- Le diagnostic « radians » se déclenche pour sin(30 rad) et pas pour une simple erreur d'arrondi.
- Réflexion totale : apparaît exactement à l'angle limite, jamais d'air vers eau.
- Glisser de la source, de la normale et des étiquettes au doigt (CDP) et avec les flèches.

## 8. Hors périmètre

- Pas de calcul d'angle limite ni de fibre optique (la réflexion totale reste une bulle « hors programme »).
- Pas de spectres d'émission ni d'absorption (déjà dans `spectres-etoiles/`), pas de vitesse de la lumière.
- Pas de lentilles (application `03`).
