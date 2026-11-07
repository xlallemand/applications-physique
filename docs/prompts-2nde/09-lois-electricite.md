Lis `docs/prompts-2nde/00-commun.md`, puis exécute ce prompt.

# 09 · Lois de l'électricité et capteurs (A16)

## 1. Application

- Nom : **« Lois de l'électricité et capteurs »** ; dossier `lois-electricite/` ; préfixe `le`, espace de noms `LE` ; `data-matiere="physique"` ; kicker « Physique · Seconde ».
- Portail : `dom: 'physique'`, `desc: "Loi des nœuds, loi des mailles, caractéristique et loi d'Ohm, capteurs résistifs et courbe d'étalonnage."`
- Dessin d'en-tête : **`circuit`** (créé par `08-montage-electrique.md`).
- **Prérequis** : `08-montage-electrique.md` est fait (outil `MONTAGE`). Sinon, crée `MONTAGE` et `ETAPES` comme il le décrit.

## 2. Objectif et programme

Capacités exigibles :
- « Exploiter la loi des mailles et la loi des nœuds dans un circuit électrique comportant au plus deux mailles. » ; « Mesurer une tension et une intensité. »
- « Exploiter la caractéristique d'un dipôle électrique : point de fonctionnement, modélisation par une relation U = f(I) ou I = g(U). » ; « Utiliser la loi d'Ohm. » ; « Représenter et exploiter la caractéristique d'un dipôle. » ; capacité mathématique : « identifier une situation de proportionnalité ».
- « Citer des exemples de capteurs présents dans les objets de la vie quotidienne. » ; « Mesurer une grandeur physique à l'aide d'un capteur électrique résistif. Produire et utiliser une courbe d'étalonnage reliant la résistance d'un système avec une grandeur d'intérêt (température, pression, intensité lumineuse, etc.). »

## 3. Ce que dit le cours

Sources : `10- Electricite/TP circuit electrique complete.pdf` et `Fiche TP.pdf` (résumés dans `08-montage-electrique.md` §3 : relis-le). Il n'y a pas de cours écrit sur ces lois ni sur les capteurs : garde les notations du TP et celles du programme.

**Choix de l'enseignant** : **tensions représentées par des flèches avec leur nom** (U<sub>G</sub>, U<sub>390</sub>, U<sub>100</sub>) ; capteurs : **thermistance et photorésistance**.

- **Notations du TP** : intensités I<sub>1</sub>, I<sub>2</sub>, I<sub>3</sub> (flèche sur le fil, dans le sens du courant) ; tensions U<sub>G</sub>, U<sub>390</sub>, U<sub>100</sub>, U (flèche le long du dipôle, nom à côté) ; résistances 100 Ω, 390 Ω, 470 Ω ; générateur réglé sur 8 V, puis de −8 V à +8 V pour la loi d'Ohm.
- **Résultats du TP** (écrits par l'enseignant) :
  - série : « I<sub>1</sub> = I<sub>2</sub> = I<sub>3</sub> = 0,017 A » ; « U<sub>100</sub> + U<sub>390</sub> = U<sub>G</sub> » ;
  - dérivation : « I<sub>1</sub> = I<sub>2</sub> + I<sub>3</sub> » ; « U<sub>G</sub> = U<sub>390</sub> = U<sub>100</sub> » ;
  - loi d'Ohm : tableau U (V), I (A), U/I ; « Trouver la relation entre U et I ».
- **Mesures** (fiche TP) : ampèremètre en série (COM et 10A, puis mA ; indication positive si le courant sort par COM) ; voltmètre en dérivation (V et COM ; positive si COM est relié du côté de la borne − du générateur) ; ohmmètre « sur le conducteur ohmique seul, hors du circuit ».
- **Énoncés à employer** (programme, formulés pour la 2nde) :
  - loi des nœuds : la somme des intensités des courants qui arrivent à un nœud est égale à la somme des intensités des courants qui en partent ;
  - loi des mailles : dans une maille, la tension aux bornes du générateur est égale à la somme des tensions aux bornes des autres dipôles (écriture du TP : U<sub>G</sub> = U<sub>390</sub> + U<sub>100</sub>) ; deux dipôles en dérivation ont la même tension ;
  - loi d'Ohm : **U = R × I** (U en V, R en Ω, I en A) ; la caractéristique d'un conducteur ohmique est une droite qui passe par l'origine (U et I proportionnels, U / I = R).
- Rédaction des calculs comme dans les autres chapitres : formule littérale, grandeur isolée, application numérique avec les unités, résultat ; conversions (mA → A, kΩ → Ω) dans une étape à part.
- **Ne pas faire référence aux numéros d'exercices, aux TP, au cours**. L'application est indépendante des sources.

## 4. Plan de l'application (`PLAN`)

### Module 1 : Loi des nœuds (manipulation guidée, `module_1_manip.html`)

- Montage en dérivation du TP (8 V ; 390 Ω et 100 Ω), déjà monté (`MONTAGE`, table et schéma côte à côte).
- Déroulé :
  1. **placer les trois ampèremètres** : toucher un fil du schéma pour y insérer un ampèremètre (il s'insère aussi sur la table) ; les intensités I<sub>1</sub>, I<sub>2</sub>, I<sub>3</sub> se nomment sur le schéma avec leur flèche ;
  2. **relever** les mesures dans un tableau (une colonne par intensité, valeurs en mA puis en A) ;
  3. **trouver la relation** parmi « I<sub>1</sub> = I<sub>2</sub> = I<sub>3</sub> », « I<sub>1</sub> = I<sub>2</sub> + I<sub>3</sub> », « I<sub>3</sub> = I<sub>1</sub> + I<sub>2</sub> », vérifiée sur les valeurs ;
  4. comparer avec le montage en série (I<sub>1</sub> = I<sub>2</sub> = I<sub>3</sub>) ;
  5. énoncé de la loi des nœuds, à compléter avec des étiquettes (« arrivent », « partent », « somme »).
- Puis 6 **calculs** dans des circuits à deux mailles au plus (schémas avec flèches d'intensité, une valeur cherchée) : I<sub>3</sub> à partir de I<sub>1</sub> et I<sub>2</sub>, I<sub>1</sub> à partir des deux branches, nœud à trois branches.
- Erreurs : somme au lieu de différence (« I<sub>1</sub> arrive au nœud, I<sub>2</sub> et I<sub>3</sub> en partent : I<sub>1</sub> = I<sub>2</sub> + I<sub>3</sub>, donc I<sub>3</sub> = I<sub>1</sub> − I<sub>2</sub>. ») ; unités mélangées (mA et A) ; ampèremètre placé dans la mauvaise branche (« I<sub>2</sub> est l'intensité dans la branche de la résistance de 390 Ω »).

### Module 2 : Loi des mailles (manipulation guidée, `module_2_manip.html`)

- Montage en série du TP (8 V ; 390 Ω ; 100 Ω). L'élève **place trois voltmètres** en touchant les deux bornes d'un dipôle sur le schéma (V du côté de la flèche, COM de l'autre) ; les **flèches de tension avec leur nom** U<sub>G</sub>, U<sub>390</sub>, U<sub>100</sub> se dessinent.
- Relevé, relation (« U<sub>G</sub> = U<sub>390</sub> + U<sub>100</sub> », « U<sub>G</sub> = U<sub>390</sub> = U<sub>100</sub> », « U<sub>390</sub> = U<sub>G</sub> + U<sub>100</sub> »), puis la même chose en dérivation (U<sub>G</sub> = U<sub>390</sub> = U<sub>100</sub>).
- Puis 6 **calculs** : tension manquante dans une maille (série de deux ou trois dipôles), circuit à deux mailles (dipôle en série puis deux dipôles en dérivation : U<sub>G</sub> = U<sub>1</sub> + U<sub>2</sub> et U<sub>2</sub> = U<sub>3</sub>).
- Erreurs : voltmètre branché en série (refusé, phrase de `08`) ; tension de dérivation additionnée (« les dipôles en dérivation ont la même tension ») ; signe négatif lu (COM du mauvais côté) : la phrase de la fiche TP.

### Module 3 : Caractéristique et loi d'Ohm (simulation, `module_3_simulation.html`)

- Montage de la loi d'Ohm du TP (générateur réglable, ampèremètre en série, 470 Ω, voltmètre en dérivation), dipôle au choix : **conducteur ohmique 470 Ω** (TP), 100 Ω, **lampe** (caractéristique non linéaire), résistance inconnue.
- Le générateur se règle de **−8 V à +8 V** (bouton glissé ou ± 0,5 V) ; l'élève **relève** chaque couple (U ; I) : bouton « Relever » qui ajoute une ligne au tableau (colonnes U (V), I (A), U / I (Ω) ; une ligne par mesure, charte §4) ; l'ampèremètre passe de 10 A à mA comme dans `08`.
- Les points se placent sur le graphique **U en fonction de I** (points « + », non reliés, comme au TP1 de lumière) ; l'élève fait pivoter une droite passant par l'origine jusqu'à ce qu'elle passe au plus près des points ; la pente lue est R.
- Déroulé guidé : 1. au moins 8 mesures de −8 V à +8 V ; 2. « U / I est constant : U et I sont proportionnels » ; 3. **U = R × I** avec R = 470 Ω ; 4. la lampe : la caractéristique n'est pas une droite (ce n'est pas un conducteur ohmique) ; 5. **point de fonctionnement** : le dipôle branché sur le générateur réglé à 6 V : on lit I sur la caractéristique (lecture graphique) ; 6. résistance inconnue : la trouver avec la pente.
- Puis 5 calculs avec U = R × I (U, R ou I cherché ; mA → A ; kΩ → Ω) ; erreurs : I en mA dans la formule ; R = I / U ; kΩ non converti. Lien « Revois… » → `equations-en-physique/`.

### Module 4 : Capteur résistif (simulation, `module_4_simulation.html`)

Deux capteurs, au choix par onglets :
- **Thermistance** plongée dans un bain d'eau avec un thermomètre (température réglable de 0 à 100 °C, chauffage et glaçons) ;
- **Photorésistance** sous une lampe, avec un luxmètre (éclairement réglable de 10 à 1 000 lux).

Déroulé guidé :
1. mesurer la résistance du capteur à **l'ohmmètre** (multimètre sur Ω, capteur hors du circuit, comme le dit la fiche TP), pour au moins 6 valeurs de la grandeur ;
2. **produire la courbe d'étalonnage** : tableau (T (°C), R (kΩ)) puis points sur le graphique R en fonction de T ; quand les points suffisent, la courbe lissée se trace (ce n'est pas une droite) ;
3. **utiliser** la courbe : une valeur de R est mesurée « ailleurs » (four, frigo, salle de classe ; pièce sombre, lumière du jour) : l'élève lit la grandeur sur la courbe (lecture graphique) ;
4. **exemples de capteurs** de la vie quotidienne (QCM à plusieurs réponses : thermostat de chauffage, sonde de température d'un four ou d'une voiture, éclairage public automatique, luminosité de l'écran d'un smartphone).
- Modèles (calcul interne, à vérifier par script) : thermistance CTN de 10 kΩ à 25 °C, R = 10 × exp(3950 × (1/(T + 273,15) − 1/298,15)) kΩ (33,6 kΩ à 0 °C ; 12,5 kΩ à 20 °C ; 3,6 kΩ à 50 °C ; 0,70 kΩ à 100 °C) ; photorésistance R = 100 × (10 / E)<sup>0,8</sup> kΩ (100 kΩ à 10 lux ; 15,8 kΩ à 100 lux ; 2,5 kΩ à 1 000 lux). Les mesures affichées ont 3 chiffres significatifs.

## 5. Rendu

- Schémas et tables de `MONTAGE` ; flèches de tension avec leur nom, flèches d'intensité sur les fils ; dipôle mesuré surligné.
- Graphiques (caractéristique, courbe d'étalonnage) : quadrillage pointillé `--paper-3`, axes `--ink` gradués avec leur grandeur et unité, points « + » `--ink`, droite ou courbe `--accent`.
- Bain d'eau, thermomètre, lampe, luxmètre : dessins simples en SVG, couleurs du thème (eau `--paper-2`, lumière `--cle-bg`).
- 1280 px : montage à gauche, tableau et graphique à droite ; 390 px : montage, puis tableau, puis graphique, les uns sous les autres.

## 6. Outils

- **`MONTAGE`** (créé par `08`) : schéma, table, insertion d'ampèremètres et de voltmètres en touchant le schéma, calcul des intensités et des tensions, flèches nommées ; à étendre de façon compatible si besoin (dipôle « lampe » à caractéristique non linéaire, capteurs, ohmmètre). Reteste `montage-electrique/` après toute modification.
- **`LG`** (`lecture-graphique/modules/lgtools.js`, chargé depuis son dossier) pour la lecture graphique sur la courbe d'étalonnage et la caractéristique (`type: 'lectureX'` / `'lectureY'`), si son repère convient ; sinon, graphique SVG propre à l'application.
- `assets/dragdrop.js`, `BULLE`.

## 7. Vérifications propres

- Script : série 8 V : I = 16,3 mA, U<sub>390</sub> = 6,37 V, U<sub>100</sub> = 1,63 V ; dérivation : 20,5 mA, 80,0 mA, 100,5 mA ; 470 Ω : I = 17,0 mA à 8 V, −17,0 mA à −8 V ; valeurs des deux capteurs ci-dessus ; chaque calcul des modules 1 à 3.
- Lois vérifiées sur chaque circuit généré (somme des intensités à chaque nœud, somme des tensions dans chaque maille).
- Relevé de mesures et pivot de la droite à la souris, au doigt (CDP) et aux boutons.
- `montage-electrique/` fonctionne toujours après les extensions de `MONTAGE`.

## 8. Hors périmètre

- Pas de circuit à plus de deux mailles, pas de résistance équivalente, pas de puissance ni d'énergie.
- Pas de microcontrôleur (Arduino) ni de programmation.
- Pas de réalisation du montage fil par fil (application `08`) : ici les montages sont déjà faits, l'élève place seulement les appareils de mesure.
