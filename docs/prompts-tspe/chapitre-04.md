# Transformations acide-base (prompt de génération)

Lis d'abord `docs/prompts-tspe/00-commun.md` (sources, charte, structure, outils partagés, livraison).

## Application

- Dossier `transformations-acide-base/`, nom « Transformations acide-base », `data-matiere="chimie"`, préfixe `tab`, espace de noms `TAB`.
- Portail : `desc: "Acides et bases de Brönsted, couples, échange du proton H⁺, logarithme et pH."` ; `mots` : Brönsted, proton, H+, ion oxonium, H3O+, ion hydroxyde, HO-, couple acide/base, demi-équation, amphotère, ampholyte, électronégativité, polarisation, acide carboxylique, carboxylate, amine, ammonium, ammoniac, acide carbonique, hydrogénocarbonate, autoprotolyse, log, logarithme, 10^x…
- Dessin d'en-tête : celui de `ph/` (regarde `data-dessin` de `ph/index.html` avant de supprimer le dossier).
- **Prérequis** : `outils-communs.md` exécuté (éditeur d'équations `EQ`, `assets/equations.js`). Sinon, crée `EQ` comme il le décrit.
- **Cette application reprend l'application `ph/`** (consigne du professeur, §3).

## Sources (`04- Transformations acide-base/`)

| Fichier | Contenu | À lire |
|---|---|---|
| `Chap04-Cours_transfo_acide_base_G3.pdf` (5 p.) | Cours tapé, complété à la main | Non : résumé ci-dessous. Page 2 si tu veux voir les schémas de Lewis du professeur |
| `Chap04-Exercices.pdf` (4 p.) | Ex. 1 à 18 (ex. 11 à 18 : pH, déjà dans `ph/`) | Oui (`pdftotext`, puis `Read` pour les figures) |
| `Chap04-Exercices-correction.pdf` (6 p.) | Corrections manuscrites | Oui, pour les ex. 1 à 10 |

## Consignes du professeur

- Un **module de manipulation pour comprendre l'échange du proton H⁺** entre l'acide et la base. Les élèves ont du mal avec **l'ajout ou le retrait du H**, et **surtout avec l'ajout ou le retrait de la charge +**.
- **Inclure l'application pH** dans cette application : la recopier, en remplaçant l'outil de résolution d'équation (`PH.Editeur`, `PH.demo` de `ph/modules/eq.js`) par **celui de `equations-physique-mobile`** (outil commun `EQ`).

## Contenu du cours (résumé)

### I. Définitions selon Brönsted

- Étude documentaire : évolution des notions d'acide et de base (ex. 1 : Boyle, Arrhenius, Brönsted).
- L'ion H<sup>+</sup> s'appelle ion hydrogène ou **proton** ; H<sub>3</sub>O<sup>+</sup> l'ion **oxonium** ; dans l'eau H<sup>+</sup> n'existe pas (il forme H<sub>3</sub>O<sup>+</sup> avec H<sub>2</sub>O), mais on se permet de raisonner avec H<sup>+</sup>.
- **Acide** : espèce capable de **libérer** un proton H<sup>+</sup> (AH) ; **base** : espèce capable de **capter** un proton (A<sup>−</sup>) ; **couple AH/A<sup>−</sup>** ; **demi-équation AH ⇄ A<sup>−</sup> + H<sup>+</sup>** (acide, base conjuguée, proton ; la double flèche est parfois notée =) ; acide et base **conjugués**.

### II. Lien avec la structure de Lewis

- Rappel des schémas de Lewis à partir de la classification (lignes 1 à 3 ; nombre de liaisons pour atteindre le gaz noble suivant ; doublets non liants) : H, C, N, O, halogènes ; H<sub>2</sub>O, CO<sub>2</sub>, NH<sub>3</sub>, CH<sub>3</sub>–CH<sub>2</sub>–COOH. Rappel facultatif : application `lewis/` (2nde).
- **Électronégativité** χ (« khi ») : capacité d'un atome à attirer le doublet d'une liaison ; échelle de Pauling (H 2,20 ; C 2,55 ; N 3,04 ; O 3,44 ; F 3,98 ; Cl 3,16 ; Br 2,96 ; Mg 1,31 ; Na 0,93…). **Liaison polarisée** A–B avec χ(B) > χ(A) : δ<sup>+</sup> sur A, δ<sup>−</sup> sur B. À retenir : O, N, halogènes plus électronégatifs que C ; C–H non polarisée.
- Exemples corrigés : H–O–CH<sub>2</sub>–CH<sub>3</sub> (Hδ<sup>+</sup>–Oδ<sup>−</sup> ; Oδ<sup>−</sup>–CH<sub>2</sub>δ<sup>+</sup>) ; Br–Mg–CH<sub>2</sub> (Brδ<sup>−</sup>–Mgδ<sup>+</sup> ; Mgδ<sup>+</sup>–Cδ<sup>−</sup>) ; Hδ<sup>+</sup>–Clδ<sup>−</sup>.
- **Lien avec le caractère acide** : une liaison polarisée peut se rompre ; l'atome le plus électronégatif récupère les deux électrons (gagne une charge −), l'autre perd son électron (charge +). **Un acide possède un H lié à un atome plus électronégatif** : il peut le libérer en H<sup>+</sup>. Annotation du professeur, à reprendre : CH<sub>3</sub>–C(=O)–O–H, flèche du doublet O–H vers O (« O plus électronégatif que H ») → CH<sub>3</sub>–C(=O)–O<sup>⊖</sup> (« a gagné un e<sup>−</sup> → ⊖ ») + H<sup>⊕</sup> (« a perdu un e<sup>−</sup> ») : « ce qu'il faut répondre à la question “expliquer pourquoi CH<sub>3</sub>COOH est un acide” ». Pour l'amine : R–NH<sub>2</sub> + H<sup>+</sup> → R–NH<sub>3</sub><sup>+</sup>, le doublet non liant de N capte H<sup>+</sup> (« N est ⊕ car il a perdu un e<sup>−</sup> » ; « question de bac non posée en devoir en début d'année »).

### III. Couples acide-base à connaître (♡)

- **Eau** : H<sub>2</sub>O/HO<sup>−</sup> (eau / ion hydroxyde, demi-équation H<sub>2</sub>O = HO<sup>−</sup> + H<sup>+</sup>) et H<sub>3</sub>O<sup>+</sup>/H<sub>2</sub>O (ion oxonium / eau, H<sub>3</sub>O<sup>+</sup> = H<sub>2</sub>O + H<sup>+</sup>) : l'eau est **amphotère** (acide d'un couple et base d'un autre).
- **Acide carbonique** : H<sub>2</sub>CO<sub>3</sub> / HCO<sub>3</sub><sup>−</sup> et (CO<sub>2</sub>,H<sub>2</sub>O) / HCO<sub>3</sub><sup>−</sup> (ion hydrogénocarbonate).
- **Acide carboxylique** R–COOH (groupe carboxyle, forme de Lewis, nomenclature : acide 3-méthylbutanoïque) : R–CO<sub>2</sub>H / R–CO<sub>2</sub><sup>−</sup> (ion carboxylate) ; à connaître : CH<sub>3</sub>COOH / CH<sub>3</sub>COO<sup>−</sup> (acide éthanoïque / ion éthanoate).
- **Amine** R–NH<sub>2</sub> (pentan-1-amine) : c'est une base ; R–NH<sub>3</sub><sup>+</sup> / R–NH<sub>2</sub> (ion de type ammonium / amine) ; à connaître : NH<sub>4</sub><sup>+</sup> / NH<sub>3</sub> (ion ammonium / ammoniac).

### IV. Réaction acide-base

- « La base d'un couple capte le proton libéré par l'acide d'un autre couple. »
- **Deux méthodes** du professeur (à reprendre telles quelles) :
  - **méthode 1** : on entoure le H qui part de l'acide et on le fait passer, par une flèche, sur la base : CH<sub>3</sub>COO<b>H</b> + H<sub>2</sub>O → CH<sub>3</sub>COO<sup>−</sup> + H<sub>3</sub>O<sup>+</sup> ;
  - **méthode 2** : on écrit les deux couples l'un sous l'autre, on entoure l'acide de l'un (CH<sub>3</sub>COOH dans CH<sub>3</sub>COOH/CH<sub>3</sub>COO<sup>−</sup>) et la base de l'autre (H<sub>2</sub>O dans H<sub>3</sub>O<sup>+</sup>/H<sub>2</sub>O ; « pas H<sub>2</sub>O/HO<sup>−</sup> car l'acide CH<sub>3</sub>COOH doit réagir avec une base »), on les met en réactifs et leurs conjugués en produits.
- Exemples corrigés : acide éthanoïque + eau ; NH<sub>4</sub><sup>+</sup> + H<sub>2</sub>O → NH<sub>3</sub> + H<sub>3</sub>O<sup>+</sup> ; CH<sub>3</sub>COOH + NH<sub>3</sub> → CH<sub>3</sub>COO<sup>−</sup> + NH<sub>4</sub><sup>+</sup> ; CH<sub>3</sub>COO<sup>−</sup> + H<sub>2</sub>O → CH<sub>3</sub>COOH + HO<sup>−</sup> ; NH<sub>3</sub> + H<sub>2</sub>O → NH<sub>4</sub><sup>+</sup> + HO<sup>−</sup>.
- **Autoprotolyse de l'eau** (♡) : H<sub>2</sub>O (acide) + H<sub>2</sub>O (base) → HO<sup>−</sup> + H<sub>3</sub>O<sup>+</sup>, soit 2 H<sub>2</sub>O → H<sub>3</sub>O<sup>+</sup> + HO<sup>−</sup>.

### V. pH : contenu de l'application `ph/`

Fonction log (courbe, réciproque de 10<sup>x</sup>, log(10<sup>a</sup>) = a, 10<sup>log a</sup> = a, propriétés), **pH = −log([H<sub>3</sub>O<sup>+</sup>]/c°)**, c° = 1 mol·L<sup>−1</sup>, réciproque [H<sub>3</sub>O<sup>+</sup>] = c° × 10<sup>−pH</sup>, exemples, limite de validité. Le contenu est celui de `ph/` (modules 1 et 2, fiches, 17 exercices) : ne le réécris pas, reprends-le.

## Plan de l'application (`PLAN`)

### Module 1 : Acides et bases de Brönsted

Cours (sous-modules si besoin) : proton et oxonium ; acide, base, couple, demi-équation ; couples à connaître (eau, acide carbonique, acides carboxyliques, amines, ammoniac) ; amphotère. Série : demi-équations, base conjuguée d'un acide (et l'inverse), couples à connaître, amphotère (ex. 2 et 3 en questions aléatoires : ClOH, H<sub>2</sub>CO<sub>3</sub>, H<sub>3</sub>PO<sub>4</sub>, HS<sup>−</sup>…). Diagnostics : **H enlevé mais charge non modifiée** (CH<sub>3</sub>COO au lieu de CH<sub>3</sub>COO<sup>−</sup>) ; **charge enlevée au lieu d'en ajouter une** (NH<sub>4</sub> au lieu de NH<sub>3</sub>, NH<sub>2</sub><sup>+</sup>…) ; H<sup>+</sup> ajouté du mauvais côté ; base conjuguée de HO<sup>−</sup> confondue.

### Module 2 : Manipulation : l'échange du proton (cœur de la consigne)

Page `entrainement` « Manipulation : l'échange du proton H⁺ » (`module_2_manip.html`, un écran, `00-commun.md` §5), outil propre à l'application, montable en plusieurs exemplaires (il resservira en partie `perso` dans les cours et les séries, et au chapitre Force des acides et des bases).

- **Le proton est un objet** : un jeton « H<sup>+</sup> » (pastille avec H et ⊕ séparés visuellement). L'acide est écrit en grand, **atome par atome** (formule semi-développée simplifiée pour les espèces usuelles : CH<sub>3</sub>–COO–H, H–O–H, H<sub>3</sub>O<sup>+</sup> = H–O(–H)–H avec son ⊕, N–H…), avec sa **charge globale affichée à part, en grand**, dans une case.
- Geste 1 : l'élève **détache** le H<sup>+</sup> de l'acide (glisser le H acide, ou le toucher) : le H disparaît de la formule **et le ⊕ part avec lui** ; la case de charge de l'acide **perd un +** (animation du « + » qui s'en va avec le H : 0 → −1 ; +1 → 0 ; −1 → −2). Le H choisi doit être un H acide (lié à O ou N) : un H lié à C est refusé (« liaison C–H non polarisée : ce H ne part pas »).
- Geste 2 : l'élève **dépose** le H<sup>+</sup> sur la base (sur un doublet non liant, dessiné) : la formule gagne un H et la case de charge **gagne un +** (−1 → 0 ; 0 → +1).
- **Saisie de la formule conjuguée** (au choix : par le geste, ou en écrivant la formule avec un clavier de formules à boutons, sans clavier du téléphone) : la case de charge doit être juste ; diagnostics ciblés sur la charge (« tu as enlevé H mais pas la charge + : un proton H<sup>+</sup> emporte une charge + ; CH<sub>3</sub>COOH (charge 0) devient CH<sub>3</sub>COO<sup>−</sup> (charge 0 − 1 = −1) »), sur le nombre de H, sur le côté de la demi-équation.
- Trois **situations** (onglets, dans n'importe quel ordre) :
  1. **Demi-équation d'un couple** : un acide → sa base conjuguée (ou l'inverse), demi-équation AH ⇄ A<sup>−</sup> + H<sup>+</sup> écrite au fur et à mesure ;
  2. **Réaction entre deux couples** : l'acide d'un couple et la base d'un autre ; le H<sup>+</sup> passe de l'un à l'autre (méthode 1 du professeur, la flèche dessinée) ; l'équation s'écrit, et la méthode 2 (les deux couples l'un sous l'autre, acide et base entourés) s'affiche en regard ;
  3. **Amphotère** : l'eau (et HCO<sub>3</sub><sup>−</sup>, HS<sup>−</sup>) : tantôt elle donne, tantôt elle capte ; autoprotolyse.
- Banque d'espèces : eau, H<sub>3</sub>O<sup>+</sup>, HO<sup>−</sup>, acide éthanoïque, méthanoïque (fourmis), benzoïque, lactique, ammoniac, ammonium, méthylamine, acide carbonique, hydrogénocarbonate, carbonate, HCl, HNO<sub>3</sub>, HS<sup>−</sup>/H<sub>2</sub>S, acide oxalique (ex. 8), acide ascorbique (AH, ex. 6), aspirine (C<sub>9</sub>H<sub>8</sub>O<sub>4</sub>, ex. 5)… ; situations tirées au hasard, compteur de réussites ; page faite après 3 réussites dans chaque onglet.
- Bilan : un acide libère H<sup>+</sup> : il perd un H **et** une charge + ; une base capte H<sup>+</sup> : elle gagne un H **et** une charge +.

### Module 3 : Polarisation et caractère acide (Lewis)

Cours : rappels de Lewis (lien facultatif `lewis/`), électronégativité, polarisation, rupture d'une liaison polarisée, « pourquoi CH<sub>3</sub>COOH est un acide », « pourquoi une amine est une base », schémas de Lewis et formules semi-développées d'un acide carboxylique, d'un ion carboxylate, d'une amine, d'un ion ammonium (dessinés par `ORGA`, développée avec doublets). Série : δ<sup>+</sup>/δ<sup>−</sup> sur des liaisons pointées, H acide d'une molécule (toucher le bon H), justification à compléter, schéma de Lewis d'un ion carboxylate (doublets et charge).

### Module 4 : Réactions acide-base

Cours : définition, méthodes 1 et 2, exemples corrigés, autoprotolyse. Série : écrire une réaction (choix des réactifs dans deux couples donnés, produits), reconnaître les couples d'une réaction donnée (ex. 3), réaction d'un comprimé effervescent (ex. 6), amphotère. Réutilise l'outil du module 2 en partie `perso`.

### Modules 5 et 6 : La fonction logarithme ; Définition du pH (repris de `ph/`)

- **Recopie** les modules 1 et 2 de `ph/` (cours, séries, fiches) dans cette application, avec le moteur commun `COURS` et le moteur de questions de l'application (le contenu, les étapes, les « À toi », les questions et diagnostics restent les mêmes).
- **Remplace partout** `PH.Editeur` / `PH.demo` par l'outil commun `EQ` (`EQ.partie`, `EQ.demo`), avec les outils ×(−1), fraction, log et 10<sup>x</sup> : même dispositif pédagogique (démonstration étape par étape, puis « À toi » dans l'éditeur, « Vérifier l'étape », aides progressives).
- Ajoute la **dilution d'un acide** (compétence : « calculer l'effet d'une dilution sur le pH d'une solution acide » ; correction du chapitre 10 : « diluer 10 fois → pH + 1, le pH tend vers 7 ») si `ph/` ne l'a pas déjà (ex. 14 « pH après dilution »).

### Module 7 : Exercices

- Ex. 1 à 10 de la feuille (Brönsted, couples, réactions, Lewis, polarisation), guidés, à partir de l'énoncé et des corrections ;
- ex. 11 à 18 et les exercices supplémentaires : **repris de `ph/modules/exercices.js`** (17 exercices), avec `EQ` à la place de `PH.Editeur` ;
- même numérotation que la feuille ; les exercices supplémentaires de `ph/` gardent leur titre.

## Retrait du portail et suppression de `ph/` (décision du professeur)

- Supprime l'entrée `ph` de `APPS` (`index.html`) et de `AVANCEMENT` (`assets/avancement.js`) ; relance `python3 docs/outils/index-recherche.py`.
- Liens qui pointaient vers `ph/` : `acides-bases/modules/module_3b_cours.html` et `radioactivite/modules/module_5b_cours.html` (« Application pH ») et tout autre lien trouvé par `grep -rn "ph/index.html\|ph/modules/module_" --include=*.html --include=*.js .` : fais-les pointer vers les pages équivalentes de cette application.
- La progression `ph-progression` n'est pas reprise (décision du professeur) ; signale-le dans le compte rendu.
- **Supprime le dossier `ph/`** (`git rm -r ph`) une fois les modules recopiés et les liens repointés, si plus rien n'en dépend : `grep -rn "\.\./ph/\|\bph/modules/\|\bph/index" --include=*.html --include=*.js --include=*.css --include=*.py . | grep -v "^./ph/"` ne doit rien renvoyer (`puissance-active/` a sa propre copie du moteur depuis `outils-communs.md` ; si elle charge encore `ph/modules/ph.js`, fais d'abord cette étape de `outils-communs.md`).
- Mets à jour les mentions de `ph/` dans la documentation vivante : `docs/charte-applications.md` (moteurs propres, exemple de `PLAN` en pages séparées : prends une application existante équivalente), commentaires de `assets/sommaire.js` et `assets/cours.js` qui la citent en exemple. Ne touche pas aux documents historiques (`docs/remarques-github.html`, `docs/prompts-sti2d/`).

## Liens vers d'autres applications

- Facultatifs (`00-commun.md` §6, type 1) : `lewis/` (schémas de Lewis), `nomenclature/` (groupes carboxyle et amine), `puissances-10/`.

## Vérifications propres

- Manipulation du proton : chaque onglet, chaque type d'erreur de charge et de H (le bon diagnostic), au doigt et à la souris, un écran.
- Modules repris de `ph/` : mêmes questions et mêmes résultats que dans `ph/` (compare quelques fabriques), éditeur `EQ` partout.
- Dossier `ph/` supprimé, le `grep` ci-dessus ne renvoie rien, portail et applications liées ouverts sans lien cassé.
- Portail : `ph` absent, « Transformations acide-base » présent ; recherche « pH » trouve les modules de cette application.
