# Modèle de l'œil (prompt de génération d'une application annexe)

Lis d'abord `docs/prompts-tspe/00-commun.md` (branche, charte, simulations §5, livraison).

## Pourquoi

Consigne du professeur (chapitre « Lunette astronomique ») : **modifier l'application `lentilles/` (2nde) : enlever son module 3 « L'œil » pour en faire une application à part (modèle de l'œil)**, vers laquelle la lunette astronomique fera un lien.

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

1. **Déplacer** (pas recopier en double) le module 3 de `lentilles/` dans `modele-oeil/` : pages, scripts propres (`oeil.js`, `vision.js` et ce qu'ils utilisent de `lt.js` et `lt.css`, sous le préfixe `mo`), en gardant exactement le comportement (manipulation, simulateur, défis, plein écran). Les fonctions de `lt.js` partagées avec les modules 1 et 2 de `lentilles/` ne se recopient que si nécessaire ; mieux : charge-les depuis `lentilles/modules/` (comme `puissance-active/` charge `ph/`) seulement si c'est léger et sans effet de bord ; sinon copie la partie utile.
2. **Plan de `modele-oeil/`** : module 1 « Le modèle de l'œil réduit » (la manipulation) ; module 2 « Voir net : accommoder, corriger » (le simulateur). Ajoute, s'il n'existe pas, un **module de questions** court par module (série de 10 notée sur 20 : parties de l'œil et leur modèle, accommodation, défaut et correction) ; pas de cours long : des encadrés de rappel (c'est une application d'outils, comme les applications de 2nde, `docs/prompts-2nde/00-commun.md` §4).
3. **Ajoute** ce qui sert à la Terminale (lunette) : **observation sans fatigue** (« un œil observe sans fatigue si les rayons incidents sont parallèles : il n'accommode pas ») et **diamètre apparent** (angle sous lequel on voit un objet ; objet à l'infini : rayons parallèles), en défis du simulateur ou en courte page.
4. **`lentilles/` après** : supprime le module 3 de son `PLAN` (le module 4 éventuel est renuméroté s'il existe), ses pages et scripts devenus inutiles, et ajoute à la fin du module 2 une **page externe ↗** vers `modele-oeil/` (`00-commun.md` §6, type 2 : elle fait toujours partie du parcours de 2nde). Mets à jour `AVANCEMENT` de `lentilles` (pages) et l'index de recherche. **La progression déjà enregistrée** des élèves sur les pages déplacées (`lentilles-progression`, pages `module_3a_manip`, `module_3b_simulation`) : recopie-la dans `modele-oeil-progression` au premier chargement de `modele-oeil/` si elle existe (migration silencieuse, en `try/catch`) ; dis-le dans le compte rendu.
5. Mets à jour `docs/prompts-2nde/README.md` (ligne A13 : « module 3 déplacé dans `modele-oeil/` ») et la ligne « Avant » de `docs/prompts-tspe/00-commun.md` §10.

## Vérifications propres

- `lentilles/` : modules 1 et 2 inchangés, page ↗ vers `modele-oeil/`, compteurs et portail justes ; aucun lien cassé (`grep -rn "module_3a_manip\|module_3b_simulation" --include=*.html --include=*.js .`).
- `modele-oeil/` : manipulation et simulateur identiques à l'original (mêmes défis, mêmes diagnostics), un écran à 1280 × 720 / 650 et 390 × 844 ; migration de la progression testée.
