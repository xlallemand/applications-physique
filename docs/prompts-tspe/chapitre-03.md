# Méthodes physiques d'analyse (prompt de génération)

Lis d'abord `docs/prompts-tspe/00-commun.md` (sources, charte, structure, outils partagés, livraison).

## Application

- Dossier `analyse-physique/`, nom « Méthodes physiques d'analyse », `data-matiere="chimie"`, préfixe `ap`, espace de noms `AP`.
- Portail : `desc: "Spectres IR et UV-visible, lois de Beer-Lambert et de Kohlrausch, dosage par étalonnage."` ; `mots` : infrarouge, IR, UV, spectre, nombre d'onde, transmittance, absorbance, bande, liaison hydrogène, couleur complémentaire, cercle chromatique, λmax, spectrophotomètre, conductivité, conductance, conductimètre, siemens, droite d'étalonnage, courbe d'étalonnage, coefficient directeur, domaine de linéarité…
- Dessin d'en-tête : un spectre ; s'il n'existe rien d'approchant dans `assets/hero.js` (`spectre` existe pour les spectres de Fourier : regarde s'il convient), ajoute `spectre-ir` (bandes d'absorption en traits fins, quelques étiquettes C=O, O–H).
- Outils : `ORGA` (molécules dessinées, groupes entourés), `LG` (`lecture-graphique/modules/lgtools.js`, lectures sur une droite d'étalonnage), `BULLE`, `PLEIN`.

## Sources (`03- Analyse par methodes physiques/`)

| Fichier | Contenu | À lire |
|---|---|---|
| `Chap03-Cours_methodes_physique_G3.pdf` (6 p.) | Cours tapé, annoté à la main | Non : résumé ci-dessous. Page 2 (spectre de la propanone, table IR), page 3 (spectres du butan-1-ol et de l'éthanol), page 4 (spectre du permanganate) pour refaire les figures |
| `Chap03-Exercices.pdf` (5 p.) | Ex. 1 à 20, presque tous en images (spectres, tableaux) | Oui, page par page |
| `Chap03-Exercices_correction.pdf` (8 p.) | Corrections manuscrites | Oui |
| `A faire.txt` | « Ajouter un exercice avec calcul de σ en fonction de c (conc. en soluté apporté) + exemple dans le cours. » | Repris ci-dessous |

Le TP de dosage par étalonnage (spectrophotométrie, conductimétrie) n'est pas repris (`00-commun.md` §2).

## Consignes du professeur

- Un **module de manipulation pour l'exploitation des spectres IR**.
- **Insister sur le lien entre la représentation graphique et l'équation de la droite** qui correspond à la formule : la droite d'étalonnage A = f(c) **est** la loi de Beer-Lambert A = k × c (k = coefficient directeur), la droite σ = f(c) **est** la loi de Kohlrausch.
- **Méthode importante** : devant une question complexe (où l'on ne demande pas de commencer par calculer la concentration inconnue), **avoir le réflexe de calculer d'abord la concentration inconnue**, avant même de chercher comment répondre à la question.
- Ajouter un **exemple dans le cours** et un **exercice** où l'on calcule σ en fonction de c, concentration en soluté apporté (avec les concentrations des ions de la dissolution, voir « Rappels de chimie »).

## Contenu du cours (résumé)

### I. Spectroscopies

- **Principe** : « comme la police recherche des empreintes », on fait traverser l'échantillon par des radiations (UV, visible, IR) et on recueille le spectre d'absorption ; les liaisons absorbent différemment.
- **IR** : les molécules vibrent (élongation, déformation ; exemple de l'eau) ; certaines liaisons absorbent l'IR, d'où des **bandes d'absorption**.
  - **Nombre d'onde σ = 1 / λ** (σ en cm<sup>−1</sup>, λ en cm) ; un spectre IR est la **transmittance (0 à 100 %) en fonction du nombre d'onde**, axe de **4000 à 500 cm<sup>−1</sup> (décroissant vers la droite)**, bandes « vers le bas ».
  - **Exploitation** : comparer les bandes (position, largeur, intensité) à la table IR (toujours fournie au bac). Table du cours (à reprendre) : O–H hydroxyle en phase gazeuse 3590–3650 fine moyenne ; O–H hydroxyle en phase condensée 3200–3400 large forte ; N–H gaz 3300–3500 fine (très) faible (double bande si NH₂) ; N–H condensée 3100–3300 large forte ; C–H 2900–3100 moyenne à forte (bandes multiples ; jusqu'à 2700 pour le C(=O)–H d'un aldéhyde) ; O–H carboxyle 2500–3200 large moyenne à forte (se superpose aux C–H) ; C=O ester 1735–1750 fine forte ; C=O carbonyle 1700–1740 fine forte ; C=O acide 1700–1725 fine forte ; C=O amide 1650–1700 fine forte ; C=C 1620–1690 fine moyenne ; N–H 1560–1640 fine forte ; empreinte < 1500. Légende « Largeurs : large / fine ; Intensité : forte / moyenne / faible » avec les petits dessins de bandes.
  - Spectre de la page 2 : le cours le titre « butanone » mais la molécule dessinée et l'annotation manuscrite disent **propanone** : utilise « propanone ».
  - **Liaison hydrogène** (liquides et solides, pas les gaz) : bande **large et forte vers 3300 cm<sup>−1</sup>**, qui peut se superposer à O–H libre (fine, vers 3600) et à C–H (vers 3000). Butan-1-ol gazeux (molécules très éloignées : pas de LH) / liquide (LH) ; éthanol liquide, dilué dans le tétrachlorométhane (molécules éloignées : pas de LH), dilué dans l'eau (on voit les LH de l'eau).
- **UV-visible** : seules les espèces **colorées** absorbent dans le visible ; spectre de la lumière visible 400–800 nm (violet, bleu, vert, jaune, orange, rouge ; UV et IR de part et d'autre) ; **absorbance A** sans unité ; **la couleur d'une solution est la couleur complémentaire de celle qu'elle absorbe** (cercle chromatique) ; spectre d'absorption A = f(λ) ; repérer **λ<sub>max</sub>** ; exemple du permanganate : λ<sub>max</sub> = 520 nm, absorbe le vert, apparaît violet. Mesures de dosage à λ<sub>max</sub>.

### II. Dosage par étalonnage

- **Principe** (figure à trois repères : ① courbe d'étalonnage obtenue avec des solutions de concentrations connues ; ② grandeur mesurée pour la solution inconnue ; ③ concentration lue) ; note : « = protocole (mode opératoire) pour un dosage par étalonnage ».
- **Beer-Lambert** : **A = k × c** (A sans unité, c en mol·L<sup>−1</sup>, k en L·mol<sup>−1</sup>) tant que c n'est pas trop élevée. ⚠ « Ne pas oublier l'unité de k si on demande de le calculer : 1 / (mol·L<sup>−1</sup>) = L/mol. » **k est la pente (coefficient directeur) de la droite d'étalonnage.** Autre forme : **A = ε × ℓ × c** (ε en L·mol<sup>−1</sup>·m<sup>−1</sup>, ℓ largeur de la cuve en m ; ε = A / (ℓc) donc L / (m·mol)). Mesure à λ<sub>max</sub>.
- **Question classique d'ECE** (manuscrit) : « Pourquoi dilue-t-on la solution inconnue ? » → pour ramener sa concentration dans le domaine de linéarité (à une valeur proche des solutions étalons).
- **Conductimétrie** : conductance G (siemens, inverse de la résistance, dépend de la sonde) ; **σ = k × G** (k constante de cellule en m<sup>−1</sup>, σ en S·m<sup>−1</sup>, ne dépend que de la solution et de la température).
- **Kohlrausch** : **σ = Σ λ<sub>i</sub> [X<sub>i</sub>] = λ<sub>1</sub>[X<sub>1</sub>] + … + λ<sub>k</sub>[X<sub>k</sub>]** (σ en S·m<sup>−1</sup>, λ<sub>i</sub> en S·m²·mol<sup>−1</sup>, **[X<sub>i</sub>] en mol·m<sup>−3</sup>**) ; **1 mol·L<sup>−1</sup> = 10³ mol·m<sup>−3</sup>** (« 1 m³ = 1000 L ; 1 mol/L = 1 mol dans 1 L, donc dans 1 m³ = 1000 L → 1000 mol ») ; « voir ex. 13 ».
- **Domaines de validité** : proportionnalité aux faibles concentrations seulement (palier au-delà) ; on dilue l'inconnue, on la dose, puis **on multiplie par le facteur de dilution**.

## Plan de l'application (`PLAN`)

### Module 1 : Spectroscopie infrarouge

- Cours (sous-modules si besoin) : principe, nombre d'onde (σ = 1/λ, conversions cm ↔ µm ↔ m), lecture d'un spectre IR (axe décroissant, transmittance), table IR, liaison hydrogène.
- **Manipulation : exploiter un spectre IR** (`module_1_simulation.html`, page `simulation` « Atelier : spectres IR », un écran, `00-commun.md` §5) :
  - spectre à gauche (SVG, axe 4000 → 400 cm<sup>−1</sup>, transmittance), table IR dans le panneau (onglet), molécule candidate dessinée par `ORGA` ;
  - l'élève **touche une bande** : un repère vertical lit son nombre d'onde, sa largeur et son intensité s'affichent (« large, forte, vers 3300 cm<sup>−1</sup> ») ; il **l'attribue** à une ligne de la table (toucher la ligne) ; la ligne et la bande se colorent ensemble ; il **entoure dans la molécule** la liaison correspondante (outil d'entourage de `ORGA`) ;
  - défis « À essayer » (dans n'importe quel ordre) : trouver la C=O de la propanone ; distinguer O–H libre et O–H lié (butan-1-ol gaz / liquide, superposables) ; reconnaître un acide carboxylique (O–H très large 2500–3200 + C=O) ; distinguer aldéhyde et cétone (C–H vers 2700–2800) ; **choisir la bonne molécule** parmi 3 candidates (isomères : alcool / cétone / acide) d'après le spectre ; repérer qu'une zone < 1500 cm<sup>−1</sup> (empreinte) ne s'exploite pas.
  - Spectres : **générés** à partir des groupes de la molécule (somme de bandes gaussiennes ou lorentziennes aux positions, largeurs et intensités de la table, plus quelques bandes dans l'empreinte), sans prétendre reproduire des spectres réels ; ceux du cours et des exercices sont redessinés à partir des figures (positions des bandes relevées sur les pages).
  - Diagnostics : nombre d'onde lu dans le mauvais sens (axe décroissant) ; bande de l'empreinte attribuée ; O–H d'alcool confondu avec O–H d'acide (largeur, position) ; C–H pris pour O–H.
- Série : lire σ d'une bande, attribuer une bande, choisir une molécule, phase gazeuse ou condensée, σ ↔ λ.

### Module 2 : Spectroscopie UV-visible et couleur

- Cours : domaine visible, absorbance, couleur complémentaire, **cercle chromatique** (interactif : toucher une couleur absorbée → couleur perçue), λ<sub>max</sub>, choix de la longueur d'onde de travail.
- Série : couleur perçue d'après λ<sub>max</sub> ; λ<sub>max</sub> d'après un spectre (lecture graphique) ; λ de travail ; espèce colorée ou non.

### Module 3 : Dosage par étalonnage (Beer-Lambert et Kohlrausch)

Sous-modules de cours : principe ; Beer-Lambert ; conductivité et Kohlrausch (avec l'**exemple ajouté** : σ d'une solution de chlorure de sodium, puis de chlorure de calcium, de concentration c en soluté apporté : [Na<sup>+</sup>] = [Cl<sup>−</sup>] = c, σ = (λ<sub>Na⁺</sub> + λ<sub>Cl⁻</sub>) × c ; CaCl<sub>2</sub> : σ = (λ<sub>Ca²⁺</sub> + 2λ<sub>Cl⁻</sub>) × c, avec la conversion en mol·m<sup>−3</sup>) ; domaine de validité et dilution.

- **Simulateur : droite d'étalonnage** (`module_3_simulation.html`, page `simulation`, un écran) — le cœur de la consigne « graphique ↔ équation » :
  - deux onglets **Spectrophotométrie** / **Conductimétrie** ; une gamme de solutions étalons (concentrations réglables, curseur ou liste), leurs mesures (A ou σ, avec un léger bruit) portées sur le graphique au fur et à mesure ;
  - l'élève **trace la droite** passant par l'origine (glisser sa pente, flèches fines) ; **l'équation de la droite s'affiche en continu** sous le graphique, **écrite comme la loi** : « A = k × c avec k = … L·mol<sup>−1</sup> » (couleurs communes : la pente sur le graphique et k dans la formule ont la même couleur ; le point (c ; A) et les deux lettres aussi) ; « Modéliser » donne la droite des moindres carrés, comme un tableur ou Regressi ;
  - **solution inconnue** : mesure, puis lecture graphique (report horizontal puis vertical, outils de `LG`) **ou** calcul c = A / k : les deux méthodes donnent la même valeur ;
  - **domaine de linéarité** : des étalons trop concentrés montrent le palier ; l'inconnue trop concentrée tombe hors du domaine : défi « Dilue l'inconnue (facteur au choix), mesure, puis multiplie par f » ;
  - défis : relier la pente et k ; trouver c par le graphique puis par le calcul ; donner l'unité de k ; l'inconnue hors domaine ; Kohlrausch avec deux ions (pente = λ<sub>1</sub> + λ<sub>2</sub> en unités cohérentes).
- Série : k à partir d'une droite (pente avec son unité) ; c = A / k ; lecture graphique ; σ = Σλ<sub>i</sub>[X<sub>i</sub>] avec conversion mol·L<sup>−1</sup> → mol·m<sup>−3</sup> ; σ d'une solution de concentration c en soluté apporté (coefficients de dissolution) ; facteur de dilution final ; « pourquoi dilue-t-on ? ». Diagnostics : mol·L<sup>−1</sup> non converties ; coefficient de l'ion oublié ; k sans unité ; oubli du facteur de dilution ; lecture sur le mauvais axe.

### Module 4 : Question complexe : calculer d'abord la concentration

- Cours court (une étape) : **le réflexe** du professeur, sur un exemple de bac (contrôle qualité : « Le produit est-il conforme à l'étiquette ? », « Peut-on boire 1 L de cette eau ? ») : 1. repérer la grandeur mesurée et la droite d'étalonnage ; 2. **calculer la concentration inconnue** (en tenant compte d'une dilution éventuelle) ; 3. seulement ensuite, chercher comment répondre (masse, pourcentage, comparaison à une norme).
- Série de **problèmes à questions complexes** (5 questions de 2 parties, ou 10 courtes) : l'énoncé pose la question finale ; la première partie demande toujours « Par quoi commences-tu ? » (QCM : « calculer la concentration inconnue » / distracteurs classiques) puis le calcul. Ce module sert aussi de modèle au chapitre Titrages (même méthode).

### Module 5 : Exercices

Ex. 1 à 20 de la feuille (ex. 1 à 11 : spectres IR et UV-visible ; 12 à 20 : étalonnage, Kohlrausch ; ex. 15 : MgCl<sub>2</sub>, σ<sub>S</sub> = 12,9 × 10<sup>−3</sup> S·m<sup>−1</sup>, λ<sub>Mg²⁺</sub> = 10,6 × 10<sup>−3</sup>, λ<sub>Cl⁻</sub> = 7,6 × 10<sup>−3</sup> S·m²·mol<sup>−1</sup>, calcul de C), puis l'**exercice ajouté** (lettre A) : σ en fonction de c en soluté apporté (dissolution, coefficients, conversion d'unités, puis c à partir d'une σ mesurée). Les spectres sont refaits en SVG à partir des figures. Les exercices à questions complexes suivent le §4 de `00-commun.md` (réflexe « concentration d'abord »).

## Vérifications propres

- Script : chaque calcul des exercices (conversions, Kohlrausch, Beer-Lambert) ; positions des bandes des spectres générés dans les intervalles de la table.
- Atelier IR et simulateur : un écran à 1280 × 720 / 650 et 390 × 844, défis dans le désordre ; la droite tracée et l'équation affichée restent cohérentes (même pente, même unité).
