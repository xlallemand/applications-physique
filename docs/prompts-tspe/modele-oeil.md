# Modèle de l'œil (prompt de génération d'une application annexe)

Lis d'abord `docs/prompts-tspe/00-commun.md` (branche, charte, simulations §5, livraison).

## Pourquoi

Consigne du professeur (chapitre « Lunette astronomique ») : **modifier l'application `lentilles/` (2nde) : enlever son module 3 « L'œil » pour en faire une application à part (modèle de l'œil)**, vers laquelle la lunette astronomique fera un lien.

**Le simulateur de l'œil ne change pas** : la manipulation et le simulateur sont déplacés tels quels. `modele-oeil/` ne contient rien qui soit propre à un niveau : **ce qui est particulier à la 2nde reste dans `lentilles/`, ce qui est particulier à la Terminale reste dans `lunette-astronomique/`**, et ces applications font un lien vers `modele-oeil/`.

## L'existant

`lentilles/` (« Image par une lentille convergente », 2nde), `PLAN` de `lentilles/modules/lt.js` :

- module 3 « L'œil » (`sousModules: true`) : « Manipulation : le modèle de l'œil réduit » (`module_3a_manip.html`, `modules/oeil.js` : `LT.simulateurOeil`, relier les parties de l'œil à leur modèle) et « Simulateur : accommodation et correction de la vision » (`module_3b_simulation.html`, `modules/vision.js` : `LT.simulateurVision`, objet déplaçable, œil normal / myope / hypermétrope, presbytie, accommodation, lunettes) ;
- ils utilisent l'outil partagé `OPT` (`assets/optique.js`) et le moteur `LT` (`modules/lt.js`, `lt.css`).

Lis ces fichiers et le prompt qui les a produits (`docs/prompts-2nde/03-lentilles.md`, partie « œil ») avant de commencer.

## Application

- Dossier `modele-oeil/`, nom « Modèle de l'œil », `data-matiere="physique"`, préfixe `mo`, espace de noms `MO`.
- Portail : `niv: ['2de', 'spe']` (ajoute `'1re'` si le professeur le demande), `desc: "Modèle de l'œil réduit, accommodation, défauts de la vision et leur correction par des lunettes."` ; `mots` : œil, cristallin, rétine, pupille, iris, diaphragme, lentille, écran, accommodation, punctum proximum, punctum remotum, myopie, hypermétropie, presbytie, lunettes, verres correcteurs, vergence, dioptrie…
- Dessin d'en-tête : `rayons` (créé pour la 2nde) ou un œil en coupe (nouveau dessin `oeil` si rien ne convient).
- Kicker : « Physique · Lycée ».

## À faire

1. **Déplacer** (pas recopier en double) le module 3 de `lentilles/` dans `modele-oeil/` : pages, scripts propres (`oeil.js`, `vision.js` et ce qu'ils utilisent de `lt.js` et `lt.css`). **Aucune modification du simulateur ni de la manipulation** : mêmes figures, mêmes textes, mêmes réglages, mêmes défis, mêmes diagnostics, même bilan, même plein écran. Seuls changent, mécaniquement : l'espace de noms (`LT` → `MO`), le préfixe des classes (`lt-` → `mo-`), les chemins, les en-têtes des pages (badge « MODULE N », `<title>`) et les commentaires d'en-tête. `lt.js` appelle `SOM.init` avec le plan de `lentilles/` au chargement : il ne peut pas être chargé depuis `modele-oeil/` ; copie dans `modules/mo.js` seulement les fonctions utiles (`fmt`, `melanger`, `defiler`, `lettre`… et ce qu'elles appellent), et dans `mo.css` seulement les règles utiles.
2. **Plan de `modele-oeil/`** : module 1 « Le modèle de l'œil réduit » (la manipulation) ; module 2 « Voir net : accommoder, corriger » (le simulateur). **Rien d'autre** : ni cours, ni série, ni défi ajouté (une série serait propre à un niveau).
3. **Terminale** : rien à ajouter dans `modele-oeil/`. L'observation sans fatigue et le diamètre apparent sont dans le cours de `lunette-astronomique/` (`chapitre-19.md`, module 3), qui fait un lien facultatif (type 1) vers `modele-oeil/`.
4. **`lentilles/` après** : son module 3 « L'œil » reste dans son `PLAN` (même titre, même `desc`, qui commence par « À savoir faire : » selon `00-commun.md` §6), mais ses deux pages deviennent des **pages externes ↗** (type 2 : elles font toujours partie du parcours de 2nde) vers les deux pages de `modele-oeil/` ; supprime les pages et scripts devenus inutiles (`module_3a_manip.html`, `module_3b_simulation.html`, `oeil.js`, `vision.js`, règles de `lt.css` et fonctions de `lt.js` qui ne servent plus qu'à eux). Mets à jour `AVANCEMENT` de `lentilles` (pages ↗) et l'index de recherche. **La progression déjà enregistrée** des élèves sur les pages déplacées (`lentilles-progression`, pages `module_3a_manip`, `module_3b_simulation`) : recopie-la dans `modele-oeil-progression` au premier chargement de `modele-oeil/` si elle existe (migration silencieuse, en `try/catch`) ; dis-le dans le compte rendu.
5. Mets à jour `docs/prompts-2nde/README.md` (ligne A13 : « module 3 déplacé dans `modele-oeil/`, pages ↗ ») et la ligne de `modele-oeil.md` dans `docs/prompts-tspe/00-commun.md` §10.

## Vérifications propres

- `lentilles/` : modules 1 et 2 inchangés, module 3 en deux pages ↗ vers `modele-oeil/`, compteurs et portail justes (l'état ↗ se met à jour après avoir fait la page dans `modele-oeil/`) ; aucun lien cassé (`grep -rn "module_3a_manip\|module_3b_simulation\|simulateurOeil\|simulateurVision" --include=*.html --include=*.js .`).
- `modele-oeil/` : manipulation et simulateur **identiques à l'original** (captures comparées à celles de `lentilles/` avant le déplacement, aux mêmes tailles, dans les mêmes états ; mêmes défis, mêmes diagnostics), un écran à 1280 × 720 / 650 et 390 × 844 ; migration de la progression testée.
