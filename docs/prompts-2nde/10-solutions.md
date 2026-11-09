Lis `docs/prompts-2nde/00-commun.md`, puis exécute ce prompt.

# 10 · Dissolution, dilution et échelle de teinte (A05)

## 1. Application

- Nom : **« Dissolution, dilution et échelle de teinte »** ; dossier `solutions/` ; préfixe `so`, espace de noms `SO` ; `data-matiere="chimie"` ; kicker « Chimie · Seconde ».
- Portail : `dom: 'chimie'`, `desc: "Préparer une solution par dissolution puis par dilution, geste par geste, et doser par une échelle de teinte."`
- Dessin d'en-tête : **nouveau dessin `verrerie`** dans `assets/hero.js` : fiole jaugée avec son trait de jauge, pipette jaugée, bécher et tubes d'une échelle de teinte, en traits fins ; il resservira à `11` et `12`.
- Cette application crée l'outil partagé **`PAILLASSE`** (`assets/paillasse.js`, `assets/paillasse.css`), réutilisé par `11-identifier-especes.md` et `12-synthese.md`. Elle utilise **`ETAPES`** (`assets/etapes.js`, créé par `08-montage-electrique.md` ; s'il n'existe pas encore, crée-le comme il le décrit).

## 2. Objectif et programme

Capacités exigibles :
- « Identifier le soluté et le solvant à partir de la composition ou du mode opératoire de préparation d'une solution. »
- « Déterminer la valeur de la concentration en masse d'un soluté à partir du mode opératoire de préparation d'une solution par dissolution ou par dilution. »
- « Choisir et utiliser la verrerie adaptée pour préparer une solution par dissolution ou par dilution. »
- « Déterminer la valeur d'une concentration en masse à l'aide d'une gamme d'étalonnage (échelle de teinte ou mesure de masse volumique). » ; « Distinguer la masse volumique d'un échantillon et la concentration en masse d'un soluté au sein d'une solution. »
- Capacité mathématique : « utiliser une grandeur quotient pour déterminer le numérateur ou le dénominateur ».

## 3. Ce que dit le cours

Sources : `08- Solutions aqueuses/Chap08-Cours-Exercices complete.pdf` (p. 1-2 cours, p. 3-4 exercices), `Chap08-Exercices_correction.pdf`, `TP1-fiches methode.pdf` (2 p., figures des gestes), `TP1-dissolution-dilution complete.pdf`, `Idee TP dissolution dilution.txt`, `devoir/Devoir_solutions.pdf`.

**Choix de l'enseignant** : notations du cours **c<sub>pipette</sub>, V<sub>pipette</sub>, c<sub>fiole</sub>, V<sub>fiole</sub>** ; dans les exercices de la série, **les notations varient** comme dans les énoncés (c<sub>m</sub> et c′<sub>m</sub>, V et V′, c<sub>0</sub> et c<sub>1</sub>, c<sub>initiale</sub> et c<sub>finale</sub>) ; espèce de l'échelle de teinte : **ions Fe<sup>3+</sup> et thiocyanate** (idée de TP) ; **geste hors de l'ordre refusé tout de suite, avec l'explication**.

- **Vocabulaire** : « En dissolvant un **soluté** dans un **solvant** on obtient une **solution**. La **solubilité** d'une espèce est la masse maximale qu'on peut en dissoudre dans 1 litre de solvant (en g/L, ou g.L<sup>−1</sup>). » Exemple : solubilité 2,5 g/L, on dissout 3 g dans 1 L : il reste 0,5 g non dissous.
- **Concentration en masse** : « masse de cette espèce par litre de solution » : **c<sub>m</sub> = m / V** avec c<sub>m</sub> en g/L, m en g, V en L ; « dans le livre, elle est notée t au lieu de c<sub>m</sub> » ; « 100 mL = 100.10<sup>−3</sup> L = 0,100 L ».
- **Trois calculs** (le professeur isole la grandeur avec une flèche : « c<sub>m</sub> = m / V ⟺ m = c<sub>m</sub> × V ») : c<sub>m</sub> = m / V (0,50 g dans 500 mL → 1 g/L) ; m = c<sub>m</sub> × V **ou un produit en croix** (300 mL à 2 g/L → 0,6 g) ; V = m / c<sub>m</sub> **ou un produit en croix** (3 g/L, 0,6 g → 0,2 L ; vérification des unités : g / (g/L) = g × L / g = L). Corrections : « OU avec une règle de 3 : 1 L ↔ 1,0.10<sup>−2</sup> g ; 33 mL = 0,033 L ↔ m ».
- **Dilution** : « Pour diluer une solution, on utilise une **pipette jaugée** pour prélever un volume de solution initiale et une **fiole jaugée** pour ajouter de l'eau jusqu'au volume final » (« connaître le nom du matériel ») ; figure : bécher et pipette (V<sub>pipette</sub>, c<sub>pipette</sub>) → fiole (V<sub>fiole</sub>, c<sub>fiole</sub>). « La concentration est divisée par un nombre qu'on appelle le **facteur de dilution f** ; f est aussi le nombre par lequel le volume est multiplié. » Encadrés du professeur :
  - **f = V<sub>fiole</sub> / V<sub>pipette</sub>** (« grand V / petit V ») ; **f = c<sub>pipette</sub> / c<sub>fiole</sub>** (« grande c / petite c ») ; **c<sub>fiole</sub> = c<sub>pipette</sub> / f** (« petite c = grande c / f ») ;
  - **OU** : « m dans pipette = m dans fiole » : **c<sub>pipette</sub> × V<sub>pipette</sub> = c<sub>fiole</sub> × V<sub>fiole</sub>**.
  - Exemple 1 : 10 mL à 0,5 g/L dans une fiole de 50 mL : f = 50 mL / 10 mL = 5 ; c = 0,5 / 5 = 0,1 g/L (ou 0,5 × 10 / 50 = 0,1 g/L). Exemple 2 : 0,2 g/L vers 0,02 g/L dans 100 mL : f = 0,2 / 0,02 = 10 ; V = 100 / 10 = 10 mL.
- **Fiche méthode « Dissolution d'un solide : préparation d'une solution mère »**, 8 gestes dans l'ordre : 1. peser avec précision dans une coupelle ; 2. transvaser la poudre à l'aide d'un entonnoir (dans la fiole jaugée) ; 3. rincer la coupelle avec de l'eau distillée ; 4. rincer l'entonnoir avec de l'eau distillée ; 5. agiter jusqu'à dissolution totale ; 6. compléter avec de l'eau distillée, en dessous du trait de jauge ; 7. ajuster au trait de jauge en levant la fiole au niveau de l'œil ; 8. boucher, puis agiter pour homogénéiser. Puis c<sub>m</sub> = m / V<sub>fiole</sub> (1,0 g dans 250 mL : 1,0 / 0,250 = 4,0 g/L). « Lecture du niveau d'un liquide : il faut regarder le **bas du ménisque**. »
- **Fiche méthode « Dilution d'une solution mère »**, 8 gestes dans l'ordre : 1. faire une réserve secondaire dans un bécher ; 2. rincer une pipette jaugée à l'eau distillée puis avec la solution à prélever ; 3. prélever avec la pipette jaugée tenue au niveau de l'œil, puis déposer dans la fiole jaugée en tenant le **deuxième trait de jauge** au niveau de l'œil et en appuyant le bout de la pipette sur le rebord de la fiole ; 4. compléter avec de l'eau distillée jusqu'à la moitié ; 5. agiter pour homogénéiser ; 6. compléter jusqu'en dessous du trait de jauge ; 7. ajuster au trait de jauge en levant la fiole au niveau de l'œil ; 8. boucher, puis agiter pour homogénéiser.
- **TP1** : solution mère dans une fiole de 250 mL ; diluer 100 fois en **deux dilutions par 10** (10 mL prélevés à la pipette jaugée dans une fiole de 100 mL, deux fois) ; tubes rangés sur un portoir dans l'ordre des concentrations ; concentration de l'inconnue.
- **Idée de TP (retenue)** : ions Fe<sup>3+</sup> à partir de chlorure de fer (III) FeCl<sub>3</sub> ; « dans une fiole de 250 mL, 0,5 g → 0,5 / 0,25 = 2 g/L, puis 2 dilutions par 10 » (0,2 g/L, puis 0,02 g/L = 20 mg/L) ; échelle « autour de 10 mg/L (de 2 à 20 mg/L) » ; « puis ajout de thiocyanate de potassium (SCN<sup>−</sup>) → couleur rouge pour l'échelle de teinte ».
- **Exercices corrigés** (valeurs) : 0,5 g dans 50 mL → 10 g/L ; 2 g dans 500 mL → 4 g/L ; m = 1,0.10<sup>−2</sup> × 0,033 = 3,3.10<sup>−4</sup> g ; V = 8.10<sup>−2</sup> / 4.10<sup>−1</sup> = 0,2 L ; 10 mL dans 500 mL : f = 50, c′ = 3.10<sup>−2</sup> / 50 = 6.10<sup>−4</sup> g/L ; de 3,0.10<sup>−3</sup> à 1,5.10<sup>−4</sup> g/L dans 200 mL : f = 20, V = 10 mL, « pipette jaugée de 10,0 mL et fiole jaugée de 200,0 mL ». Devoir : choisir dans une liste (éprouvettes, pipettes jaugées de 5, 10, 20 mL, erlenmeyers, fioles de 50 et 100 mL) le matériel pour passer de 1,0.10<sup>−2</sup> à 1,0.10<sup>−3</sup> g/L, 50 mL : pipette de 5 mL et fiole de 50 mL.
- Précision de la verrerie (TP1 de masse volumique) : bécher très peu précis, éprouvette graduée précise, fiole jaugée très précise.
- **Ne pas faire référence aux numéros d'exercices, aux TP, au cours**. L'application est indépendante des sources.

## 4. Plan de l'application (`PLAN`)

### Module 1 : Dissolution (manipulation guidée, `module_1_manip.html`)

- Paillasse : balance (bouton Tare), coupelle, spatule, flacon de chlorure de fer (III) solide, entonnoir, pissette d'eau distillée, bouchon, et la verrerie à choisir : **fiole jaugée de 250 mL**, bécher de 250 mL, éprouvette graduée de 250 mL, erlenmeyer.
- Objectif affiché : « Prépare 250,0 mL de solution mère de chlorure de fer (III) à 2,0 g/L. » L'élève calcule d'abord la masse à peser (m = c<sub>m</sub> × V = 2,0 × 0,250 = 0,50 g ; champ, avec la conversion mL → L).
- Gestes dans l'ordre de la fiche (chaque geste : toucher l'objet puis la cible, ou glisser) ; **un geste hors de l'ordre est refusé tout de suite, avec son explication** (`ETAPES`). Détails :
  - choix du récipient : bécher ou éprouvette refusés : « Le bécher n'est pas précis : pour un volume précis de solution, on utilise une fiole jaugée. » ;
  - pesée : coupelle sur la balance, Tare, prises de spatule (grosse ou petite) jusqu'à 0,50 g ± 0,01 g ; oubli de la tare refusé ;
  - agiter : la poudre se dissout progressivement (animation) ; compléter avant dissolution totale refusé ;
  - **ajuster au trait de jauge** : vue agrandie du col (œil au niveau du trait, l'élève « lève la fiole » d'un geste) ; l'eau s'ajoute goutte à goutte (bouton « 1 goutte ») ; validé quand le **bas du ménisque** touche le trait ; trait dépassé : « Le ménisque dépasse le trait : la solution n'a pas le bon volume, il faut la refaire. » (« ↺ Recommencer ») ;
  - lecture faite de trop haut ou de trop bas (parallaxe) : le trait paraît au mauvais endroit ; message « Lève la fiole : l'œil doit être au niveau du trait. »
- Puis : **soluté et solvant** (étiquettes à glisser : chlorure de fer (III) / eau) ; **c<sub>m</sub> = m / V<sub>fiole</sub>** = 0,50 / 0,250 = 2,0 g/L ; erreur : V en mL (« 0,002 g/mL : V doit être en L, 250 mL = 0,250 L »).

### Module 2 : Dilution (manipulation guidée, `module_2_manip.html`)

- Paillasse : flacon de solution mère (2,0 g/L), béchers, pipettes jaugées à deux traits (5, 10, 20, 25 mL), propipette, fioles jaugées (50, 100, 250 mL), éprouvettes graduées, pissette, bouchons.
- **Première dilution par 10** (TP) : choisir la pipette et la fiole pour f = 10 (pipette de 10 mL, fiole de 100 mL ; d'autres couples justes acceptés : 5 mL et 50 mL, 25 mL et 250 mL) ; puis les gestes de la fiche dans l'ordre ; puis **f = V<sub>fiole</sub> / V<sub>pipette</sub> = 10** et **c<sub>fiole</sub> = c<sub>pipette</sub> / f = 0,20 g/L** (ou c<sub>pipette</sub> × V<sub>pipette</sub> = c<sub>fiole</sub> × V<sub>fiole</sub>).
- **Deuxième dilution par 10** : à partir de la première solution fille : 0,020 g/L = 20 mg/L.
- Refus et diagnostics :
  - pipeter directement dans le flacon : « On ne pipette jamais dans le flacon : on fait une réserve secondaire dans un bécher. » ;
  - pipette non rincée avec la solution ; éprouvette ou bécher à la place de la pipette jaugée (« Pour prélever un volume précis, on utilise une pipette jaugée. ») ; prélèvement réglé sur le premier trait seulement ;
  - remplir la fiole jusqu'au trait sans agiter à moitié ;
  - **f inversé** (V<sub>pipette</sub> / V<sub>fiole</sub> = 0,1) : « f = grand V / petit V : f est plus grand que 1. » ;
  - **concentration multipliée par f** : « Diluer, c'est diminuer la concentration : c<sub>fiole</sub> = c<sub>pipette</sub> / f. »
- Choix du matériel pour une dilution donnée (exercice 5, devoir exercice 4), 3 situations.

### Module 3 : Échelle de teinte (simulation, `module_3_simulation.html`)

- À partir de la solution à 20 mg/L (deuxième fille), la gamme est préparée dans des fioles de 50,0 mL avec les pipettes de 5,0 ; 10,0 ; 20,0 ; 25,0 mL : **2,0 ; 4,0 ; 8,0 ; 10 ; 20 mg/L** ; l'élève calcule la concentration de chaque tube (f = 50,0 / 5,0 = 10, c = 20 / 10 = 2,0 mg/L…) avant de l'étiqueter.
- Il verse quelques gouttes de thiocyanate de potassium dans chaque tube : la teinte rouge-orangé apparaît, d'autant plus foncée que la concentration est grande.
- Il **range les tubes** sur le portoir dans l'ordre des concentrations (glisser, ou deux appuis) ; refus si l'ordre est faux : « Plus la solution est concentrée, plus sa teinte est foncée. »
- Il **place le tube inconnu S** (traité au thiocyanate) entre les deux tubes de teinte la plus proche (comparaison côte à côte, vue de dessus sur fond blanc en option), puis **encadre** sa concentration : « 4,0 mg/L < c<sub>S</sub> < 8,0 mg/L ».
- Bouton « Affiner » : préparer un tube à 6,0 mg/L (pipette de 15,0 mL dans 50,0 mL) pour resserrer l'encadrement. L'inconnue est tirée au hasard entre deux tubes.

### Module 4 : Calculs (série notée sur 20, `module_4_questions.html`)

Groupes (notations variées comme les énoncés) :
- c<sub>m</sub> = m / V ; m = c<sub>m</sub> × V ; V = m / c<sub>m</sub> (deux méthodes acceptées : formule ou produit en croix, tableau de la charte §4) ; conversions mL ↔ L, mg ↔ g ;
- solubilité : masse non dissoute ;
- facteur de dilution, concentration après dilution, volume à prélever ;
- choix de la verrerie (liste du devoir) ;
- soluté et solvant d'après un mode opératoire ;
- masse volumique d'une solution ou concentration en masse d'un soluté (« 1,05 g/mL est la masse volumique de la solution, pas la concentration du soluté ») ;
- lecture d'une échelle de teinte (encadrement).
Erreurs diagnostiquées : V en mL dans c<sub>m</sub> = m / V ; fraction renversée ; f inversé ; c multipliée par f ; puissance de 10 mal convertie.

## 5. Rendu

- **Verrerie dessinée** en SVG, vue de face, réaliste et sobre : contours `--ink-2`, verre `--sheet`, liquides `--paper-2` ou teinte de la solution ; trait de jauge et graduations ; ménisque visible en vue agrandie (cercle de zoom) ; pissette, balance avec son afficheur, propipette.
- Couleur des solutions (ions thiocyanatofer) : rouge-orangé réaliste, en attributs de présentation SVG comme les couleurs des spectres de `spectres-etoiles/`, intensité proportionnelle à la concentration ; elle n'est **jamais** utilisée pour un message (juste / faux restent écrits, avec leurs couleurs de thème).
- Gestes : glisser l'objet sur sa cible, ou toucher l'objet puis la cible ; cibles de 44 px ; la consigne en cours s'affiche au-dessus de la paillasse (« 3. Rince la coupelle avec de l'eau distillée. »), les gestes faits se cochent dans la liste de la fiche méthode, sur le côté (ordinateur) ou repliée sous la paillasse (téléphone).
- 1280 px : paillasse à gauche, fiche méthode et calculs à droite ; 390 px : paillasse pleine largeur (objets plus petits, cibles toujours de 44 px), fiche dessous.

## 6. Outils

- **À créer : `PAILLASSE`** (`assets/paillasse.js`, `assets/paillasse.css`), plusieurs exemplaires par page :
  - `PAILLASSE.monter(zone, { objets: [{ id, type, volume, contenu, … }], etapes, onFin })` ; types : `fiole`, `pipette` (deux traits), `propipette`, `becher`, `eprouvette`, `erlenmeyer`, `entonnoir`, `coupelle`, `spatule`, `balance`, `pissette`, `flacon`, `bouchon`, `tube`, `portoir`, `compteGouttes` ; prévoir l'ajout de `ballon`, `refrigerant`, `chauffeBallon`, `supportElevateur`, `ampoule`, `thermometre`, `potence` (pour `11` et `12`) ;
  - niveaux de liquide, ménisque et vue agrandie au niveau de l'œil, couleur et teinte d'un contenu, dissolution animée ;
  - gestes (glisser ou deux appuis) transmis à **`ETAPES`** (ordre imposé, refus expliqués, textes passés en options).
- **`ETAPES`** (`assets/etapes.js`, créé par `08`) ; s'il faut l'étendre, fais-le de façon compatible et reteste `montage-electrique/`.
- `assets/dragdrop.js`, `BULLE`. Liens « Revois… » : `conversions/`, `equations-en-physique/`, `proportionnalite/`.

## 7. Vérifications propres

- Script : 2,0 × 0,250 = 0,50 g ; 0,50 / 0,250 = 2,0 g/L ; dilutions : 0,20 g/L et 0,020 g/L ; gamme 2,0 ; 4,0 ; 6,0 ; 8,0 ; 10 ; 20 mg/L ; tous les exercices du cours (10 g/L, 4 g/L, 3,3 × 10<sup>−4</sup> g, 0,2 L, 6 × 10<sup>−4</sup> g/L, f = 20 et 10 mL) ; couples pipette / fiole acceptés pour chaque f.
- Chaque geste hors de l'ordre est refusé avec son explication et ne change rien ; l'ajustement au trait se fait goutte à goutte ; dépasser le trait oblige à recommencer.
- Gestes à la souris, au doigt (CDP) et en deux appuis.
- Teinte : strictement croissante avec la concentration ; l'inconnue tombe toujours entre deux tubes de la gamme.

## 8. Hors périmètre

- Pas de concentration en quantité de matière (mol/L).
- Pas de spectrophotométrie, pas de loi de Beer-Lambert.
- Pas de masse volumique mesurée (application `11`), sinon pour la distinguer de la concentration en masse.
