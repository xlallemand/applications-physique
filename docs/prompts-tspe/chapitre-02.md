# Nomenclature (prompt de génération)

Lis d'abord `docs/prompts-tspe/00-commun.md` (sources, charte, structure, maquettes, livraison).

**Ce chapitre se fait en deux sessions** (`00-commun.md` §5) :

1. **Étape 1 : maquettes du moteur de dessin des molécules.** Tu t'arrêtes après : le professeur choisit.
2. **Étape 2 : l'application**, avec la maquette validée et les remarques du professeur.

Le message de la session dit quelle étape exécuter. Lis tout ce fichier dans les deux cas : les maquettes doivent déjà respecter ce que l'application attend du moteur.

## Application

- Dossier `nomenclature/`, nom « Nomenclature », `data-matiere="chimie"`, préfixe `nom`.
- Portail : desc « Formules développée, semi-développée et topologique, noms des alcanes et des familles. » ; `niv: ['spe']`.
- Dessin d'en-tête : **nouveau dessin `topologique`** dans `assets/hero.js` (formules topologiques en zigzag, quelques OH, O, NH₂, Cl, comme écrites au tableau).
- **Moteur partagé de chimie organique `ORGA`** (`assets/orga.js`, `assets/orga-dessin.js`, `assets/orga.css`) : il resservira dans d'autres chapitres de Tle spécialité (acides et bases, spectroscopie, titrages).

## Sources (`02- Nomenclature/`)

| Fichier | Contenu | À lire |
|---|---|---|
| `Chap02-Cours nomenclature.pdf` (5 p.) | Cours tapé, tableaux à compléter, complétés en partie à la main | Non : résumé ci-dessous. Page 3 (tableau des familles) si tu veux revoir la mise en couleurs du professeur |
| `Chap02-Exercices.pdf` (4 p.) | Ex. 1 à 12 ; les formules sont des images | Seulement pour vérifier une molécule : elles sont toutes données ci-dessous en SMILES |
| `Chap02-Exercices_correction.pdf` (7 p.) | Corrections manuscrites | Seulement pour vérifier un détail : les réponses sont ci-dessous |

**Hors de cette application** : partie IV du cours (isomérie de constitution, polymères) et ex. 8, 11, 12 ; ex. 1 (exercices en ligne educaplay, remplacés par les séries). Les animations de chimie.ostralo.net citées par le cours sont remplacées par les ateliers : pas de lien.

## Ce que le professeur veut faire passer

- **Combien de liaisons** a chaque atome : H 1, C 4, N 3, O 2, halogènes 1. Lien rapide avec la classification : nombre de liaisons = nombre de cases à parcourir vers la droite pour arriver dans la dernière colonne (gaz nobles).
- **Trois écritures** : développée, semi-développée, topologique. La développée est la moins utile (peu pratique : on lui préfère la semi-développée). **La topologique est la plus difficile** pour les élèves : c'est celle qu'il faut le plus travailler.
- **Passer d'une écriture à l'autre**, avec trois phrases à faire intégrer (à reprendre telles quelles dans le cours, la fiche et les diagnostics) :
  1. développée → semi-développée : **« on enlève les liaisons des H et on les regroupe sur leur atome »** (s'il y en a plusieurs) ;
  2. vers la topologique : **« on efface tous les CH »** ;
  3. depuis la topologique : **« on ajoute un C avec le bon nombre de H au bout de chaque trait, s'il n'y a pas déjà un autre atome »**.
- **Nommer les alcanes** : les 10 alcanes linéaires par cœur ; nommer un alcane ramifié et le dessiner à partir de son nom. Insister : **on commence par trouver ou écrire la chaîne carbonée la plus longue, puis les ramifications**, à l'envers du nom (qui commence par les ramifications et finit par la chaîne principale).
- **Les familles** : apprendre par cœur familles et groupes caractéristiques, savoir **entourer** le groupe dans une molécule. **C'est le plus important** (question classique du bac : entourer un groupe caractéristique, nommer le groupe et la famille). Puis savoir nommer ces molécules.

## Vidéos du cours (liens, `00-commun.md` §1)

| Où | Lien | Ce qu'elle montre |
|---|---|---|
| Module 1, cours « Les trois écritures », avant la formule développée | https://www.youtube.com/watch?v=mObSA3j3svA | formules brute, développée, semi-développée |
| Module 1, même cours, avant la formule topologique | https://www.youtube.com/watch?v=OMv3DIvZFYU puis https://www.youtube.com/watch?v=PSQ_g8mJQzs | formule topologique (deux vidéos) |
| Module 2, cours « Nommer un alcane ramifié » | https://www.youtube.com/watch?v=9LPnknbY0ds | nommer un alcane ramifié |
| Module 3, premier cours | https://www.youtube.com/watch?v=1OQyiSniTgI et https://www.youtube.com/watch?v=l2jxhqaL330 | nomenclature en chimie organique (deux vidéos) |
| Module 3, premier cours des noms | https://www.youtube.com/watch?v=d-w-bRSgWgg | plus longue, prend le temps d'expliquer. **Avertissement à écrire avec le lien** : « Attention : dans la vidéo, il met des tirets partout ; il n'y a des tirets qu'entre les lettres et les chiffres. » |

## Moteur `ORGA` (partagé, dans `assets/`)

Le cœur du chapitre. Toutes les molécules de l'application (cours, séries, fiches, exercices, corrections) sont dessinées par lui, en SVG.

| Fichier | Rôle |
|---|---|
| `assets/orga.js` | Modèle et chimie, **sans DOM** (il doit se charger dans Node pour les tests) : lecture des données, H implicites, formule brute, comparaison de deux molécules, groupes caractéristiques, nomenclature dans les deux sens, diagnostic d'un nom saisi |
| `assets/orga-dessin.js` | Rendu SVG des trois écritures, disposition automatique, éditeur, outils de conversion, sélection et couleurs, champ de nom, bulles d'aide |
| `assets/orga.css` | Classes `orga-` |

Tout outil doit pouvoir exister en **plusieurs exemplaires** dans une page (pas d'`id` fixe, pas d'état global) et marcher au doigt comme à la souris (charte §8).

### Modèle (`orga.js`)

- Éléments : C, N, O, F, Cl, Br, I ; H implicites. Valences : C 4, N 3, O 2, halogènes 1, H 1. Liaisons simple, double, triple. Nombre de H = valence − somme des ordres des liaisons ; la valence n'est jamais dépassée.
- **Données en SMILES simplifié** (majuscules, ramifications entre parenthèses, `=`, `#`, cycles par chiffres ; cycle benzénique écrit en Kékulé `C1=CC=CC=C1`) : `ORGA.lire('CC(C)C(=O)O')`. Pour une molécule compliquée (cycles, sujets de bac), des coordonnées peuvent être données dans les données ; pour reproduire un énoncé, des **étiquettes condensées** en semi-développée (`C2H5`, `(CH2)5`, `C6H5`).
- `ORGA.formuleBrute(mol)` (C, puis H, puis ordre alphabétique : `C5H12O`).
- `ORGA.meme(m1, m2)` : même molécule (même graphe, éléments et ordres de liaison), quelle que soit la façon dont elle est dessinée.
- `ORGA.groupes(mol)` : tous les groupes caractéristiques de la molécule (il peut y en avoir plusieurs, ex. 5), chacun avec sa famille, le nom du groupe et ses atomes :

  | Famille | Groupe caractéristique (nom) | Atomes à entourer |
  |---|---|---|
  | alcène | C=C | les deux C |
  | alcool | groupe hydroxyle | O et son H (OH sur un C qui n'a pas de C=O) |
  | aldéhyde | groupe carbonyle, en bout de chaîne | C=O et le H du C (le C porte un H) |
  | cétone | groupe carbonyle, entre deux C | C=O |
  | acide carboxylique | groupe carboxyle | C(=O)–OH |
  | ester | groupe ester | C(=O)–O |
  | amine | groupe amine (primaire, secondaire, tertiaire) | N et ses H |
  | amide | groupe amide | C(=O)–N et les H du N |
  | halogénoalcane | groupe halogéno | X (F, Cl, Br, I) |

  Pour valider un entourage : il contient les atomes du groupe, avec ou sans les H qui leur sont liés, et rien d'autre.

- **Outil existant pour entourer les groupes** : le cours « Les groupes caractéristiques » de l'application `rappels-1ere-sti2d/` (`modules/module_1_cours.html`, série `module_1_questions.html`) a déjà un outil d'entourage, `RP.partieEntourer(m)` dans `modules/rp.js` (partie `perso`, styles `rp-at`, `rp-cercle` dans `modules/rp.css`) :
  - l'élève touche les atomes pour les marquer (ou les libérer), puis Valider ;
  - les groupes sont alors entourés et numérotés, avec une légende « groupe … : famille des … » (`RP.legende`), puis nommés par QCM groupe · famille (`RP.partiesNommer`) ;
  - diagnostics : atome de la chaîne carbonée (« ne contient que C et H »), OH d'un carboxyle entouré seul, carboxyle incomplet, groupe oublié.

  Il ne connaît que les groupes hydroxyle et carboxyle, sur sa propre formule semi-développée en grille HTML. **Reprends son fonctionnement (gestes, cercles numérotés, légende, diagnostics) dans `ORGA`**, étendu à toutes les familles et aux trois écritures. Ne modifie pas `rappels-1ere-sti2d/`.

### Nomenclature (`orga.js`)

`ORGA.nommer(mol)` renvoie le nom **et ses parties** (chaîne principale et ses atomes, numérotation, ramifications avec leurs numéros et leurs atomes, groupe et son numéro), pour colorer le dessin et le nom de la même façon ; ou `{ horsProgramme: raison }`. `ORGA.lireNom(nom)` fait l'inverse. Règles du cours (niveau lycée) :

- **Une seule fonction** par molécule nommée (alcool, aldéhyde, cétone, acide carboxylique, ester, amine, amide, ou une C=C), avec des ramifications alkyles et des halogènes. Au-delà : hors programme (les ex. 4 et 5 ne demandent que d'entourer les groupes).
- **Chaîne principale** : la plus longue qui **contient le groupe** (les deux C de la C=C : 2-éthyl-4-méthylpent-1-ène, ex. 9). À longueur égale : celle qui porte le plus de ramifications (3-éthyl-2-méthylhexane, pas 3-(1-méthyléthyl)hexane).
- **Numérotation** : le plus petit numéro au C qui porte le groupe (« le n° est celui de l'atome de carbone qui porte le groupe caractéristique ») ; puis les plus petits numéros pour les ramifications (premier point de différence) ; à égalité, le plus petit à la première dans l'ordre alphabétique. -al, -oïque, -oate, -amide : le C du groupe est le n° 1, jamais écrit.
- **Ramifications** : alcane − « ane » + « yl » (méthyl, éthyl, propyl, butyl) ; halogènes : fluoro, chloro, bromo, iodo. Préfixes di, tri, tétra, penta, hexa. **Ordre alphabétique** sans tenir compte de di, tri… (éthyl avant méthyl ; diméthyl se classe à m).
- **Suffixes** : -ane, -ène (n° du premier C de la double liaison), -ol, -al, -one, acide …-oïque, …-oate de …-yle, -amine, -amide. Élision du « e » de « ane » devant une voyelle (butan-2-ol, butanal, propanamide, butan-1-amine).
- **Esters** « alcanoate d'alkyle » : la chaîne qui porte le C=O donne l'alcanoate (C n° 1 = le C du groupe) ; la chaîne liée à l'O donne l'alkyle, numérotée à partir du C lié à l'O (1-méthyléthyle, 1-méthylpropyle, 2-méthylpropyle, 3-méthylbutyle). « d' » devant une voyelle.
- **Amines secondaires et tertiaires, amides substitués** : la plus longue chaîne liée au N donne le nom ; les autres sont des ramifications sur le N, notées N- (N-éthyl-N-méthylpropan-1-amine, N-butyléthanamide). Note manuscrite du professeur à reprendre : « N-éthyléthanamine : sur le N, il y a un éthyle accroché ».
- **Cycloalcanes** : cyclo + nom de l'alcane ; un seul substituant : pas de numéro (éthylcyclohexane) ; plusieurs : plus petits numéros, et le premier dans l'ordre alphabétique a le n° 1 (1-éthyl-3-méthylcyclohexane, pas 3-éthyl-1-méthylcyclohexane, ex. 10).
- **Écriture** : tirets entre lettres et chiffres, virgules entre chiffres, pas d'espace (sauf « acide … » et « … de … »). Les numéros sans ambiguïté s'écrivent comme dans le cours : méthylpropane, éthanal, propanamide, méthylpropanoate d'éthyle, mais 2-méthylpropan-2-ol ; à la saisie, un numéro en plus ou en moins dans ces cas est accepté.
- `ORGA.diagnostiquerNom(saisie, mol)` : compare la saisie au nom attendu, partie par partie, et renvoie un diagnostic ciblé :
  - chaîne trop courte (« ta chaîne a 5 C ; il y en a une de 6 ») ; « 1-méthyl… », « 2-éthyl… » (la ramification prolonge la chaîne) ;
  - numérotation dans le mauvais sens (« en partant de l'autre bout, les numéros sont plus petits ») ;
  - ordre alphabétique, di/tri comptés dans l'ordre, « 2-méthyl-3-méthyl » au lieu de « 2,3-diméthyl », préfixe oublié ;
  - tirets, virgules et espaces (« pas de tiret entre deux lettres ») ;
  - mauvais suffixe ou mauvaise famille (-ol / -al / -one…), numéro du groupe oublié.

  Accents oubliés : accepté, avec la remarque « pense aux accents : méthyl ».

### Rendu des trois écritures (`orga-dessin.js`)

`ORGA.dessiner(zone, mol, { ecriture: 'developpee' | 'semi' | 'topo', … })`, avec une **disposition automatique** (chaîne principale horizontale, ramifications réparties de part et d'autre), comme dans le tableau de la page 1 du cours :

- **Développée** (formule de Lewis) : tous les atomes et toutes les liaisons, H compris, à angle droit ; **doublets non liants** dessinés (petits traits) sur N, O et les halogènes.
- **Semi-développée** : H regroupés sur leur atome (CH₃, CH₂, CH, OH, NH₂, NH), indices en `<tspan>` ; H₃C, HO, H₂N quand la liaison arrive par la droite ; ramifications verticales ; =O et OH en oblique sur le C d'un groupe en bout de chaîne, comme dans le cours.
- **Topologique** : **zigzag** (« serpent » : traits à ±30° de l'horizontale, angles de 120°) ; chaque sommet et chaque extrémité est un C ; N, O, halogènes écrits avec leurs H (OH, NH₂, NH) ; double liaison : un second trait parallèle, à l'intérieur de l'angle ; triple : trois traits alignés ; cycles réguliers.
- **Options** : numéros des C ; couleurs de marquage sur des ensembles d'atomes (chaîne principale, chaque type de ramification, groupe) ; **entourage** d'un ensemble d'atomes (contour arrondi, comme le professeur entoure à la main) ; étiquettes condensées.
- Longueur de liaison constante, `viewBox` ajusté à la molécule, `max-width: 100%`, défilement dans son conteneur si la molécule est trop large (aucun défilement de la page à 390 px). `role="img"` et `aria-label` (nom ou formule).

**Couleurs de marquage** (exception à la charte §3, comme les constantes SVG `VEC.C`) : variables à ajouter dans `assets/theme.css` (`--orga-chaine`, `--orga-ram-1` à `--orga-ram-4`, `--orga-groupe`) et à documenter dans la charte (§3 et §12). **Jamais de vert ni de rouge** (réservés au juste / faux, et le vert est l'accent de la chimie). Reprends si possible les accents existants : bleu des maths `#2952c8` pour la chaîne principale, orange du collège `#c2570c` et violet de la physique `#5a3fc4` pour les ramifications ; une teinte magenta pour le groupe, comme dans le cours. Une couleur par **type** de ramification (tous les méthyles de la même couleur). L'information n'est jamais portée par la seule couleur : numéros des C et noms des ramifications à côté.

### Éditeur (sous-module 1 : dessiner une molécule)

`ORGA.editeur(zone, { ecriture, hydrogenes: 'auto' | 'eleve', elements, depart, surChange })` : dessiner facilement en **semi-développée** et en **topologique** (la développée se dessine aussi, ses H se placent d'eux-mêmes).

- **Principe** : à partir d'un atome, on ajoute dans une direction un C, un N, un O ou un halogène (F, Cl, Br, I). La façon de le faire est **celle de la maquette validée** (étape 1).
- En **topologique**, l'ajout suit le zigzag (« serpent ») : la direction qui continue le zigzag est proposée en premier ; on fait une chaîne de 6 C en 6 gestes.
- **Liaisons** : simple, double, triple (refusée si la valence est dépassée : « ce carbone a déjà 4 liaisons »).
- **Gomme**, **↶ Annuler**, **Tout effacer** ; boutons pilule de la charte, cibles d'au moins 44 px.
- **Changement d'écriture** (semi / topo / développée) en gardant la molécule : disposition automatique.
- **Hydrogènes** :
  - `'auto'` : les H se complètent seuls ;
  - `'eleve'` (« au début » : module 1, ex. 2) : en semi-développée, l'élève touche un atome et choisit son nombre de H (C, CH, CH₂, CH₃ ; N, NH, NH₂ ; O, OH) ; en développée, il ajoute les H un par un. Diagnostic : « ce C a 2 liaisons : il lui faut 2 H (4 liaisons en tout) ».
- `surChange(mol)` à chaque modification : la formule brute et le nom s'affichent **en direct** sous le dessin quand l'outil le demande (« Ta molécule : 2-méthylpentane » ; « nom hors programme »).

### Changer d'écriture (sous-module 2)

Outil `ORGA.conversion(zone, { mol, de, vers })` qui fait **appliquer les trois phrases**, étape par étape, sur le dessin :

| Conversion | Geste | Diagnostics |
|---|---|---|
| développée → semi-développée | l'élève touche chaque atome : ses liaisons C–H disparaissent et ses H se regroupent sur lui (H, H, H → CH₃), animation courte | « tu as regroupé 2 H : ce C en porte 3 » |
| semi-développée → topologique | l'élève touche chaque CH₃, CH₂, CH, C pour l'effacer (les traits restent et se rejoignent), puis « Mettre en zigzag » | « on n'efface que les C et leurs H : OH reste » |
| topologique → semi-développée | l'élève touche chaque sommet et chaque bout de trait et choisit C, CH, CH₂ ou CH₃ (4 − nombre de traits) | « ce sommet a 3 traits : 4 − 3 = 1 H, c'est CH » ; « au bout de ce trait il y a déjà OH : pas de C à ajouter » |
| développée → topologique | les deux premières à la suite | |

Puis, sans guidage, l'élève dessine directement l'écriture demandée dans l'éditeur (validation par `ORGA.meme`). Le réglage « étapes guidées » s'active ou se désactive.

### Nommer et dessiner les alcanes (sous-module 3)

Deux sens, dans les trois écritures :

- **Du nom au dessin** : le nom est donné ; l'élève dessine dans l'éditeur ; **le nom de ce qu'il a dessiné s'affiche automatiquement pendant les modifications**, en couleurs (chaîne, ramifications). Validation par `ORGA.meme` ; sinon diagnostic à partir des deux noms (« ta molécule s'appelle 2-méthylhexane : sa chaîne principale a 6 C, il en faut 5 »). La consigne rappelle la méthode : écris d'abord la chaîne principale (la fin du nom), puis place les ramifications.
- **Du dessin au nom**, avec des **aides activables séparément** (panneau « Aides » à trois interrupteurs, réglage gardé dans `localStorage` `nomenclature-aides`, toutes activées par défaut ; disponible partout où l'on nomme : cours, ateliers, séries, exercices) :
  1. **Couleurs** : l'élève fait ressortir la chaîne principale **en touchant ses C** ; elle prend la couleur de la chaîne (validée : c'est une des chaînes les plus longues ; sinon « il y a une chaîne plus longue »). Il choisit le bout n° 1 (numéros affichés). Puis il fait de même pour chaque ramification, qui prend la couleur de son type.
  2. **Nom découpé** : le champ du nom est découpé en morceaux de la couleur des parties du dessin : une ligne par type de ramification (numéros, préfixe, nom en -yl) puis la chaîne principale. **La chaîne principale se complète d'abord** (les autres morceaux attendent : « commence par la chaîne principale : c'est la fin du nom ») ; tirets et virgules s'ajoutent tout seuls et le nom complet s'affiche dessous. Aide désactivée : un seul champ libre.
  3. **Bulles d'aide** : des boutons ⓘ à côté de chaque étape et de chaque morceau ouvrent une bulle (au toucher, pas au survol) avec la règle du cours et un mini-exemple :
     - chaîne la plus longue (« elle n'est pas toujours dessinée en ligne droite ») ;
     - nom des ramifications (-ane → -yl) ;
     - numérotation (les plus petits numéros) ;
     - di, tri, tétra ;
     - ordre alphabétique (« é avant m ; di, tri… ne comptent pas », note manuscrite du cours) ;
     - tirets et virgules.
- **Fabrique d'alcanes** : chaîne principale de 4 à 10 C, 1 à 3 ramifications (méthyl, éthyl, propyl si la chaîne est assez longue), nom calculé par `ORGA.nommer` (on écarte ce qui est hors programme).

### Nommer et dessiner toutes les familles (sous-module 4)

Le même outil que le sous-module 3, pour toutes les familles, avec une aide de plus en tête :

- **Groupe** : l'élève entoure le groupe caractéristique (il touche ses atomes), puis choisit le nom du groupe et la famille ; le groupe prend sa couleur. La chaîne principale doit le contenir ; la numérotation donne le plus petit numéro au C qui le porte.
- Le **nom découpé** ajoute le morceau du groupe (numéro + suffixe : « -2-ol », « -al », « -one », « acide … -oïque », « -amine », « -amide », « -ène ») ; les halogènes rejoignent les ramifications (ordre alphabétique commun). Ester : deux morceaux, l'alcanoate (chaîne du C=O) et l'alkyle (sur l'O), de deux couleurs, comme les annotations du professeur sur « éthanoate de butyle ». Amines et amides : ramifications « N- ».
- Bulles en plus :
  - « le n° est celui de l'atome de carbone qui porte le groupe caractéristique » ;
  - la chaîne principale contient le groupe ;
  - le tableau des suffixes ;
  - l'ester « alcanoate d'alkyle » ;
  - N- : « la ramification est accrochée sur le N ».
- Fabriques par famille (chaîne de 2 à 8 C, 0 à 2 ramifications).

## Étape 1 : maquettes du moteur de dessin

Dossier **`docs/orga/maquettes/`**. Le modèle et le rendu écrits pour les maquettes sont la **première version de `assets/orga.js` et `assets/orga-dessin.js`** (repris à l'étape 2) : seules les interactions d'ajout d'atomes diffèrent d'une maquette à l'autre (script propre aux maquettes). La nomenclature n'est pas nécessaire à cette étape (la formule brute en direct suffit).

| Fichier | Contenu |
|---|---|
| `index.html` | Présentation : ce qui distingue les maquettes, ce qu'il faut essayer, les questions au professeur |
| `rendu.html` | Rendu des trois écritures : les trois molécules du tableau de la page 1 du cours, les alcanes de la page 2, une molécule par famille (page 3). Les couleurs de marquage proposées : chaîne principale, ramifications, numéros des C, groupe entouré, et le nom écrit dans les mêmes couleurs |
| `dessin-a.html` | **A « Emplacements »** : on touche un atome, des emplacements libres apparaissent autour en pointillés (celui qui continue le zigzag mis en valeur) ; on touche un emplacement, l'atome de l'élément choisi y est ajouté |
| `dessin-b.html` | **B « Flèches »** : un pavé de flèches sous le dessin (4 directions en semi-développée, 6 en topologique, plus « ⟿ suite du zigzag ») agit sur l'atome sélectionné ; le dernier atome ajouté reste sélectionné, on enchaîne les appuis pour faire une chaîne (comme les boutons fléchés de tracé des vecteurs de `cinematique/`) |
| `dessin-c.html` | **C « Glisser »** : on tire un trait depuis un atome, il s'aimante à la direction permise la plus proche ; au lâcher, un nouvel atome. Un appui court sur un emplacement voisin fait pareil |
| `conversion.html` | Les trois gestes de conversion (replier les H, effacer les CH, ajouter les CH) sur les molécules du tableau de la page 1 |

Dans les trois maquettes de dessin, tout le reste est identique : palette d'éléments (C, N, O, F, Cl, Br, I), liaisons double et triple, gomme, ↶ Annuler, Tout effacer, changement d'écriture (semi / topo / développée), H automatiques ou à compléter, formule brute en direct.

Tâches à proposer sur chaque maquette (les mêmes partout, pour comparer) :

1. dessiner le 2-méthylpentane en semi-développée, H à compléter ;
2. le voir en topologique et en développée ;
3. dessiner en topologique le 4-méthylpent-2-ène, puis la pentan-2-one ;
4. ajouter un OH, un Cl ;
5. tout refaire au doigt sur téléphone.

**Questions au professeur** dans `index.html` et dans le compte rendu :

- quelle façon de dessiner (A, B, C, ou un mélange) ;
- le rendu des trois écritures (zigzag, H₃C à gauche, doublets non liants de la développée) ;
- les couleurs de marquage ;
- les gestes de conversion.

**Puis arrête-toi** (`00-commun.md` §5).

## Étape 2 : l'application

Reprends la maquette validée et les remarques du professeur (données dans le message de la session). Termine `ORGA` (nomenclature, éditeur, conversion, sélection, champ de nom, bulles) puis l'application.

**Tests du moteur** (script Node dans le scratchpad, `00-commun.md` §6) :

- chaque molécule de ce prompt : `ORGA.nommer(ORGA.lire(smiles))` donne le nom attendu, `ORGA.meme(ORGA.lireNom(nom), ORGA.lire(smiles))` est vrai, `ORGA.groupes` donne les groupes attendus ;
- 500 molécules de chaque fabrique : le nom relu redonne la même molécule.

### Module 1 : Représenter les molécules (`sousModules: true`)

**Cours 1a : combien de liaisons ?**

- Règle du duet pour H (un seul doublet, liant), de l'octet pour les autres (4 doublets) :
  - C : 4 doublets liants ;
  - N : 3 liants et 1 non liant ;
  - O : 2 liants et 2 non liants ;
  - halogènes (F, Cl, Br, I) : 1 liant et 3 non liants.

  Écritures de la remarque manuscrite du cours, en SVG : C avec 4 liaisons simples, une double et deux simples, une triple et une simple ; −N̄− et |N≡ ; −Ō− et O= avec ses doublets ; −X̄| avec ses doublets.
- **Lien avec la classification** (court) : nombre de liaisons = nombre de cases jusqu'à la colonne des gaz nobles, en allant vers la droite (C : 4, N : 3, O : 2, F : 1 ; H : 1 jusqu'à He). Extrait de la classification en SVG (lignes 1 à 3, Br et I dans la colonne 17), outil `perso` : l'élève touche un élément, les cases se comptent jusqu'à la dernière colonne.
- S'en servir : compléter les H d'une formule développée, repérer une formule impossible (C à 5 liaisons, O à 3).

**Cours 1b : les trois écritures** (vidéos : voir le tableau)

- **Développée** (formule de Lewis) : tous les doublets, liants et non liants.
- **Semi-développée** : on regroupe les H sur les atomes auxquels ils sont liés. C'est la plus utilisée ; la développée est la moins utile.
- **Topologique** : on ne représente ni les atomes de carbone ni les atomes d'hydrogène liés à des carbones ; chaque sommet, chaque bout de trait est un C ; zigzag. La plus difficile : elle sera beaucoup travaillée.
- Exemples : les trois molécules de la page 1 dans les trois écritures, côte à côte.
- « À toi » : reconnaître l'écriture, compter les C d'une topologique, en donner la formule brute (piège : les H implicites).

**Cours 1c : passer d'une écriture à l'autre** : une étape par phrase (les trois phrases ci-dessus, en `.cle`), chacune avec l'outil de conversion en exemple et en « À toi ». « À retenir » : les trois phrases.

**Atelier « Prise en main de l'outil de dessin des molécules »** (sous-module 1, page `simulation`) : toujours la même suite de six molécules, dans l'ordre, une par outil de l'éditeur (tirer un trait, appui court pour une ramification, un autre atome, double liaison, triple liaison, topologique). Pas de bilan.

**Atelier « Dessin libre de molécules »** (sous-module 1, page `simulation`) : l'éditeur, toutes les écritures, « Vérifier les H ».

Dans tous les ateliers où l'on dessine, les H s'écrivent toujours à la main (outil « H », dans la barre des atomes ; en topologique, seulement ceux des atomes autres que C). Dans les ateliers où l'on dessine ou nomme, chaque aide s'active ou se désactive dans la carte « Réglages » (pas de bouton « toutes les aides »).

**Atelier « Changer d'écriture »** (sous-module 2, page `simulation`) : une dizaine de molécules par conversion, étapes guidées puis sans guidage. Molécules variées (toutes les familles, ramifications, doubles liaisons), chaîne de 3 à 7 C.

**Série** :
- liaisons et doublets d'un atome (QCM, position dans la classification) ;
- H manquants d'une semi-développée ;
- reconnaître une écriture ;
- formule brute d'une topologique ;
- formule impossible ;
- conversions (outil `perso` : éditeur ou conversion).

Erreurs à diagnostiquer :
- en topologique, oublier les C des bouts de traits ;
- oublier les H implicites ;
- effacer le H d'un OH ;
- ajouter un C au bout d'un trait qui porte déjà O ou N ;
- C à 3 ou 5 liaisons.

### Module 2 : Nommer les alcanes (`sousModules: true`)

**Cours 2a : les alcanes à chaîne linéaire**

- Alcanes : hydrocarbures saturés (C et H, liaisons simples), formule brute CₙH₂ₙ₊₂.
- **À connaître par cœur** :

  | Formule | Nom |
  |---|---|
  | CH₄ | méthane |
  | C₂H₆ | éthane |
  | C₃H₈ | propane |
  | C₄H₁₀ | butane |
  | C₅H₁₂ | pentane |
  | C₆H₁₄ | hexane |
  | C₇H₁₆ | heptane |
  | C₈H₁₈ | octane |
  | C₉H₂₀ | nonane |
  | C₁₀H₂₂ | décane |

  En semi-développée pour les cinq premiers, comme le cours.
- « À toi » : nombre de C ↔ nom ↔ formule brute, dans les deux sens.

**Cours 2b : nommer un alcane ramifié** (vidéo : voir le tableau)

- **Étape 1** : trouver la chaîne carbonée la plus longue (elle donne le nom, elle n'est pas forcément dessinée en ligne droite) ; les ramifications : nom de l'alcane en remplaçant « ane » par « yl » (–CH₂–CH₂–CH₃ : propyl).
- **Étape 2** : numéroter par la droite ou par la gauche, pour que les numéros soient les plus petits possibles ; ramifications identiques regroupées : di, tri, tétra, penta, hexa (2,3,5-triméthyl… = un –CH₃ sur les carbones 2, 3 et 5).
- **Étape 3** : ordre alphabétique (é avant m ; di, tri… ne comptent pas) ; tirets et virgules.
- Exemples du cours, avec la mise en couleurs : chaîne principale, ramifications entourées, numéros. La note manuscrite à côté de « méthylpropane » : « si le méthyl est ailleurs, c'est du butane ».
- « À toi » : l'outil du sous-module 3 (dessin → nom, aides activées).

**Cours 2c : du nom à la formule**

- **On dessine à l'envers du nom** :
  1. lire la fin du nom et écrire la chaîne principale (…hexane : 6 C) ;
  2. la numéroter ;
  3. placer les ramifications ;
  4. compléter les H.
- Exemple pas à pas : 3-éthyl-2,2-diméthylhexane.
- « À toi » : l'outil du sous-module 3 (nom → dessin, nom en direct).

**Cours 2d : les alcanes cycliques** (court ; tableau des familles et ex. 10) : cyclo + nom ; un substituant sans numéro ; plusieurs : plus petits numéros, le premier dans l'ordre alphabétique a le n° 1.

**Atelier « Nommer un alcane »** et **atelier « Dessiner un alcane »** (sous-module 3, pages `simulation`), avec la fabrique d'alcanes, dans les trois écritures.

**Série** :
- linéaires (nom ↔ nombre de C ↔ CₙH₂ₙ₊₂) ;
- toucher la chaîne la plus longue ;
- nommer (semi-développée, topologique, développée) ;
- dessiner à partir du nom ;
- trouver l'erreur dans un nom (QCM aux erreurs classiques : 1-méthylbutane, 2-éthylpentane, numérotation inversée, ordre alphabétique, di oublié, tirets).

### Module 3 : Les familles (`sousModules: true`)

Reconnaître avant de nommer : c'est le plus important. Le tableau du cours (page 3) est à **apprendre par cœur** : famille (= classe fonctionnelle), groupe caractéristique (= groupe fonctionnel) et son nom, exemple.

**Cours 3a : alcènes, alcools, halogénoalcanes, amines** (vidéos 1OQyiSniTgI et l2jxhqaL330) : un groupe sans C=O ; amines primaire, secondaire, tertiaire. « À toi » : entourer le groupe, choisir son nom et la famille.

**Cours 3b : le groupe carbonyle** : aldéhyde (C=O en bout de chaîne, le C porte un H) et cétone (C=O entre deux C).

**Cours 3c : acides carboxyliques, esters, amides** : le C=O et un autre atome sur le même C. Les confusions classiques, en diagnostics :
- acide ≠ alcool + cétone ;
- ester ≠ acide (O lié à un C, pas à un H) ;
- amide ≠ amine + cétone ;
- aldéhyde ≠ cétone.

**Cours 3d : nommer les alcènes, alcools, halogénoalcanes, aldéhydes, cétones et acides** (vidéo d-w-bRSgWgg avec l'avertissement) : la chaîne principale contient le groupe ; le n° est celui du C qui porte le groupe ; suffixes et préfixes. Exemples du tableau du cours.

**Cours 3e : nommer les esters, amines et amides** : « alcanoate d'alkyle » ; N- ; exemples du tableau du cours avec les annotations du professeur.

**Atelier « Entourer les groupes »** (page `simulation`, question type bac) : molécules à plusieurs groupes (ex. 5 et molécules des sujets : acide lactique, acide malique, atropine, frambinone, voir `competences.md` §2) ; entourer chaque groupe, le nommer, donner la famille (outil repris de `rappels-1ere-sti2d/`, voir « Moteur `ORGA` »). Pour un cycle benzénique, on ne demande que les groupes du programme.

**Atelier « Nommer une molécule »** et **atelier « Dessiner une molécule à partir de son nom »** (sous-module 4, pages `simulation`).

**Série** (au moins 4 questions sur 10 « entourer, nommer le groupe, la famille ») :
- distinguer deux familles proches ;
- famille d'après le nom (-ol, -al, -one, acide -oïque, -oate de -yle, -amine, -amide, préfixe halogéno, -ène) ;
- nommer ;
- dessiner à partir du nom.

### Module 4 : Exercices

Même numérotation que la feuille ; « Exercices 2 à 10 » (sans 1 et 8). Correction : la molécule dessinée par le moteur, groupe entouré, nom du groupe et famille entre parenthèses, nom en couleurs.

- **Ex. 2 (+ 4)** : topologique → semi-développée (éditeur, H à compléter), puis (ex. 4) entourer et nommer le groupe, donner la famille. Une partie par lettre.
- **Ex. 3 (+ 4)** : semi-développée → topologique, puis entourer et nommer le groupe.
- **Ex. 5** : entourer et nommer tous les groupes, donner les familles.
- **Ex. 6** : nom → semi-développée.
- **Ex. 7** : nom → topologique.
- **Ex. 9** : tableau à compléter (pour chaque ligne, les deux cases vides) ; découpé comme la feuille : lignes 1 à 7, 8 à 15, 16 à 18.
- **Ex. 10** : nommer des alcanes cycliques.

## Molécules (SMILES vérifiés sur les corrections)

### Cours

| Où | SMILES | Nom |
|---|---|---|
| p. 1, ligne 1 | `CC(C)C(O)CN` | (écritures seulement) |
| p. 1, ligne 2 | `ClCC(C)OC=N` | (écritures seulement) |
| p. 1, ligne 3 | `BrCC(=O)OCC#C` | (écritures seulement) |
| p. 2 | `CC(C)CCC` | 2-méthylpentane |
| p. 2 | `CC(C)C(C)CCC` | 2,3-diméthylhexane |
| p. 2 | `CC(C)C` | méthylpropane |
| p. 2 | `CCCC(CC)C(C)(C)C` | 3-éthyl-2,2-diméthylhexane (le cours écrit « 3-éthyl 2,2-diméthylhexane » : il manque le tiret) |
| p. 2 | `CCCCC(C)C(C)(C)CCC` | 4,4,5-triméthylnonane |
| p. 2 | `CC(C)C(C)(C)C(C)CC` | 2,3,3,4-tétraméthylhexane |
| p. 3 | `CCCCC` | pentane |
| p. 3 | `CCC(C)C` | 2-méthylbutane |
| p. 3 | `C1CCCCC1` | cyclohexane |
| p. 3 | `C=CCC(C)C` | 4-méthylpent-1-ène |
| p. 3 | `CC(C)(C)O` | 2-méthylpropan-2-ol |
| p. 3 | `CC=O` | éthanal |
| p. 3 | `CCCC(C)=O` | pentan-2-one |
| p. 3 | `CC(C)CC(=O)O` | acide 3-méthylbutanoïque |
| p. 3 | `CCCCOC(C)=O` | éthanoate de butyle |
| p. 3 | `CCCCCN` | pentan-1-amine |
| p. 3 | `CCNCC` | N-éthyléthanamine |
| p. 3 | `CCCN(C)CC` | N-éthyl-N-méthylpropan-1-amine |
| p. 3 | `CCCC(N)=O` | butanamide |
| p. 3 | `CCCCNC(C)=O` | N-butyléthanamide |
| p. 3 | `CCC(C)CC(C)Br` | 2-bromo-4-méthylhexane |

### Exercices

| Ex. | SMILES | Nom | Groupe (famille) |
|---|---|---|---|
| 2a | `CC(C)C=CC` | 4-méthylpent-2-ène | C=C (alcènes) |
| 2b | `CC(C)(O)C(C)CC` | 2,3-diméthylpentan-2-ol | hydroxyle (alcools) |
| 2c | `CCC(C)CC=O` | 3-méthylpentanal | carbonyle (aldéhydes) |
| 2d | `CCC(CC)C(C)C(=O)C(C)C` | 5-éthyl-2,4-diméthylheptan-3-one | carbonyle (cétones) |
| 2e | `CCCC(CC)C(=O)O` | acide 2-éthylpentanoïque | carboxyle (acides carboxyliques) |
| 2f | `CCC(C)C(=O)OCC` | 2-méthylbutanoate d'éthyle | ester (esters) |
| 2g | `CCCC(C)NC` | N-méthylpentan-2-amine | amine (amines) |
| 2h | `CCCCN(C)CC` | N-éthyl-N-méthylbutan-1-amine | amine (amines) |
| 2i | `CCCC(C)CC(=O)NC` | N,3-diméthylhexanamide | amide (amides) |
| 3a | `CC=C(C)C` | 2-méthylbut-2-ène | C=C (alcènes) |
| 3b | `CC(C)CCC(C)O` | 5-méthylhexan-2-ol | hydroxyle (alcools) |
| 3c | `CC(N)CCC` | pentan-2-amine | amine (amines) |
| 3d | `CC(=O)CC(CC)CC` | 4-éthylhexan-2-one | carbonyle (cétones) |
| 3e | `CCCC=O` | butanal | carbonyle (aldéhydes) |
| 3f | `CC(NCC)CC` | N-éthylbutan-2-amine | amine (amines) |
| 3g | `CCC(C)C(=O)OCC` | 2-méthylbutanoate d'éthyle | ester (esters) |
| 3h | `CCCC(=O)NC` | N-méthylbutanamide | amide (amides) |
| 5a glycine | `NCC(=O)O` | | amine, carboxyle |
| 5b sérine | `OCC(N)C(=O)O` | | hydroxyle, amine, carboxyle |
| 5c asparagine | `NC(=O)CC(N)C(=O)O` | | amide, amine, carboxyle |
| 5d phéromone | `CC(=O)CCCCCC=CC(=O)O` (énoncé : `(CH2)5`) | | carbonyle (cétones), C=C (alcènes), carboxyle |
| 5e cannelle | `C1=CC=CC=C1C=CC=O` (énoncé : `C6H5`) | | C=C (alcènes), carbonyle (aldéhydes) |
| 6a | `CC=CC(C)C` | 4-méthylpent-2-ène | |
| 6b | `CCC(C)CO` | 2-méthylbutan-1-ol | |
| 6c | `CCC(CC)CC=O` | 3-éthylpentanal | |
| 6d | `CCC(C)C(C)=O` | 3-méthylpentan-2-one | |
| 6e | `CC(C)CC(=O)O` | acide 3-méthylbutanoïque | |
| 6f | `CC(C)C(=O)OCC` | méthylpropanoate d'éthyle | |
| 6g | `CC(C)N` | propan-2-amine | |
| 6h | `CCCCNCC` | N-éthylbutan-1-amine | |
| 6i | `CCC(N)=O` | propanamide | |
| 6j | `CC(=O)NC` | N-méthyléthanamide | |
| 7a | `CCC=CC(C)C` | 2-méthylhex-3-ène | |
| 7b | `CC(O)CC(C)C` | 4-méthylpentan-2-ol | |
| 7c | `CC(C)C(=O)C(CC)CC` | 4-éthyl-2-méthylhexan-3-one | |
| 7d | `CCCC(CC)C(=O)O` | acide 2-éthylpentanoïque | |
| 7e | `CCC(=O)OC(C)C` | propanoate de 1-méthyléthyle | |
| 7f | `CCC(C)CC(=O)OCC(C)C` | 3-méthylpentanoate de 2-méthylpropyle | |
| 7g | `CC(C)N(C)CC` | N-éthyl-N-méthylpropan-2-amine | |
| 7h | `CCC(C)CC(=O)NCC` | N-éthyl-3-méthylpentanamide | |
| 9.1 (semi donnée) | `C=C(C)CC` | 2-méthylbut-1-ène | |
| 9.2 (topo donnée) | `CC(C)C(C)C(C)(C)C` | 2,2,3,4-tétraméthylpentane | |
| 9.3 (nom donné) | `CCCC(CC)C(C)C` | 3-éthyl-2-méthylhexane | |
| 9.4 (semi donnée) | `CCC(C)(O)C(C)C` | 2,3-diméthylpentan-3-ol | |
| 9.5 (topo donnée) | `C=C(CC)CC(C)C` | 2-éthyl-4-méthylpent-1-ène | |
| 9.6 (nom donné) | `CCCC(C)C(=O)O` | acide 2-méthylpentanoïque | |
| 9.7 (semi donnée) | `O=CC(CC)CC` | 2-éthylbutanal | |
| 9.8 (topo donnée) | `CC(N)CC(C)(C)C` | 4,4-diméthylpentan-2-amine | |
| 9.9 (nom donné) | `CCC(C)C(C)=O` | 3-méthylpentan-2-one | |
| 9.10 (semi donnée) | `CC(=O)OCCC(C)C` | éthanoate de 3-méthylbutyle | |
| 9.11 (topo donnée) | `CC(O)CC(C)C` | 4-méthylpentan-2-ol | |
| 9.12 (nom donné) | `CCC(C)C(=O)OC(C)CC` | 2-méthylbutanoate de 1-méthylpropyle | |
| 9.13 (semi donnée) | `CCCC(CCC)C(C)=O` | 3-propylhexan-2-one | |
| 9.14 (topo donnée) | `CC(Cl)C(C)(Br)Br` | 2,2-dibromo-3-chlorobutane | |
| 9.15 (nom donné) | `CCC(C)C(C)C(C)N` | 3,4-diméthylhexan-2-amine | |
| 9.16 (semi donnée) | `CCN(C)CC` | N-éthyl-N-méthyléthanamine | |
| 9.17 (topo donnée) | `CCC(C)C(N)=O` | 2-méthylbutanamide | |
| 9.18 (nom donné) | `CCN(C)C(=O)CCC(C)C` | N-éthyl-N,4-diméthylpentanamide | |
| 10a | `C1CCCC1` | cyclopentane | |
| 10b | `CCC1CCCCC1` | éthylcyclohexane | |
| 10c | `CCC1CCCC(CC)C1` | 1,3-diéthylcyclohexane | |
| 10d | `CCC1CCCC(C)C1` | 1-éthyl-3-méthylcyclohexane | |

### Erreurs de la feuille

- **Ex. 7a** : la feuille écrit « 5-méthylhex-3-ène ». La double liaison a le n° 3 dans les deux sens, donc le méthyl doit avoir le plus petit numéro : **écris « 2-méthylhex-3-ène »** (même molécule que la correction).
- **Tirets** (règle du cours : des tirets seulement entre lettres et chiffres) :
  - ex. 6h « N-éthyl-butan-1-amine » → **N-éthylbutan-1-amine** ;
  - ex. 6j « N-méthyl-éthanamide » → **N-méthyléthanamide** ;
  - ex. 7g « N-éthyl- N-méthylpropan-2-amine » → **N-éthyl-N-méthylpropan-2-amine** ;
  - cours p. 2 « 3-éthyl 2,2-diméthylhexane » → **3-éthyl-2,2-diméthylhexane**.
- **Ex. 9.18** : la feuille écrit « N-éthyl-N-méthyl-4-méthylpentanamide ». Le moteur écrit **N-éthyl-N,4-diméthylpentanamide** (méthyles regroupés) ; écris le nom de la feuille dans l'énoncé, accepte les deux formes et explique le regroupement dans la correction. Même règle pour 2i.
- **Ex. 6f** : « méthylpropanoate d'éthyle » est juste (un seul emplacement possible) ; accepte aussi « 2-méthylpropanoate d'éthyle ».
