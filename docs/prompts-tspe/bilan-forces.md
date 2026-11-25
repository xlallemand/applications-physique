# Bilan des forces (prompt de génération d'une application annexe)

Lis d'abord `docs/prompts-tspe/00-commun.md` (branche, charte, structure, simulations, livraison).

## Pourquoi

Consigne du professeur (chapitre « Lois de Newton ») : des choses sont déjà faites dans l'application `principe-dynamique/` (Terminale STI2D) ; **créer une application pour le bilan des forces, niveau 2nde, 1re et Terminale, qui reprend celle de `principe-dynamique`**. Le cours de Terminale sur « faire un bilan des forces » sera très succinct, avec un lien vers cette application. **L'application de Terminale ne fait pas de lien vers `principe-dynamique/`** (elle passe par celle-ci).

## Application

- Dossier `bilan-forces/`, nom « Bilan des forces », `data-matiere="physique"`, préfixe `bf`, espace de noms `BF`.
- Portail : `niv: ['2de', '1re', 'spe']` (ajoute `'sti'` si `principe-dynamique/` y renvoie à la fin, voir plus bas), `desc: "Forces à distance et de contact, diagramme objet-action, poids, réaction du support, frottements, représenter une force."` ; `mots` : force, vecteur force, newton, interaction, action mécanique, diagramme objets-actions, DOA, poids, réaction normale, frottement, tension du fil, poussée d'Archimède, force de l'air, compensation, système, centre de masse…
- Dessin d'en-tête : celui de `principe-dynamique/`.
- Kicker : « Physique · Lycée ».

## Sources

- **`principe-dynamique/`** (dans ce dépôt) : module 2 « Faire un bilan des forces » : sous-modules de cours `module_2a_cours` à `module_2f_cours` (forces à distance et de contact, méthode du diagramme objet-action, force de l'air, poids, réaction du support, forces qui se compensent), atelier `module_2_simulation` (« Atelier : bilan des forces », situations de `modules/situations.js`), série `module_2_questions`, fiche `fiche_2` ; moteur `modules/pfd.js` (scènes, flèches, diagramme objet-action, outils de tracé). Lis le prompt qui l'a produit : `docs/prompts-sti2d/chapitre-06.md` (partie « bilan des forces »).
- **Cours de Terminale** (`Cours-TSpe`, `07- Newton/Chap07-Cours_Forces_Mouvement_G3.pdf`, pages 1 à 3) : partie I « Bilan des forces » : système et milieu extérieur ; **centre de masse** (barycentre des masses ; centre de symétrie d'un solide homogène ; figures de solides homogènes et non homogènes) ; **vecteur force** (point d'application, direction, sens, intensité en newtons, dynamomètre ; notations F⃗<sub>A/B</sub> et F) ; forces **à distance** (gravitation = poids près de la Terre, électrostatique, magnétique ; vecteur depuis le centre de masse) et **de contact** (depuis le point ou le centre de la surface de contact) ; **diagramme objets-actions** (objets dans des ovales, système au centre, trait plein = contact, pointillés = distance ; exemple du ballon de foot avant / pendant / après la frappe) ; **frottements solides** : sans frottements, la force du sol est perpendiculaire au sol (mobile sur coussin d'air : R⃗ et P⃗ se compensent ; skieur sans frottements : elles ne se compensent pas, leur somme fait accélérer vers le bas de la pente) ; avec frottements, f⃗ s'ajoute, opposée au mouvement qu'il y aurait sans frottements (livre tiré par une corde, skieur avec frottements).
- Exercices de Terminale sur le bilan des forces (`07- Newton/Chap07-Exercices.pdf`, ex. 1 à 6 : valise portée / posée, poids lancé, skieurs, livre sur plan incliné, roues d'une voiture à traction avant au démarrage et au freinage, bateau à voile, caravane tractée qui freine ; corrections dans `Chap07-Exercices correction.pdf`) : ce sont des situations pour l'atelier.

## Ce que l'application reprend et ajoute

- **Reprend** le module 2 de `principe-dynamique/` (cours 2a à 2f, atelier, série, fiche), en le découpant en modules, **sans rien perdre** (situations, diagnostics, gestes). Le moteur `pfd.js` ne se recopie pas en entier : extrais ce qui sert au bilan des forces dans `bilan-forces/modules/bf.js` (ou, mieux, dans un outil partagé `assets/forces.js` si `principe-dynamique/` peut le charger à son tour sans changement visible).
- **Niveaux** : 2nde (modéliser une action par une force, poids, forces qui se compensent, principe d'inertie qualitatif), 1re (somme des forces, lien avec la variation de vitesse), Terminale (centre de masse, diagramme objets-actions, frottements solides, réaction normale et tangentielle). Une pastille de niveau sur chaque page du `PLAN` (dans `desc` ou `noms`) ; rien n'est verrouillé.
- **Ajoute** :
  - le **centre de masse** (Terminale) : cours court et placement de G sur des solides homogènes (centre de symétrie) et non homogènes (justification qualitative : G plus près de la partie la plus lourde) ;
  - les **situations du cours et des exercices 1 à 6 de Terminale** dans l'atelier (ballon de foot avant / pendant / après la frappe ; valise portée, posée ; poids lancé ; skieurs avec et sans frottements ; livre sur plan incliné ; roues avant et arrière d'une voiture à traction au démarrage et au freinage ; bateau à voile ; caravane tractée qui freine) ;
  - la **réaction décomposée** R⃗ = R⃗<sub>N</sub> + f⃗ en Terminale (option d'affichage).
- **Atelier** : un écran, défis et situations dans n'importe quel ordre, plein écran (`00-commun.md` §5) ; c'est une mise à jour de l'atelier existant, qui suivait un parcours linéaire : passe-le aux nouvelles règles (situations en pastilles, rangées par niveau puis par difficulté, filtre de niveau).

## Plan proposé (`PLAN`)

1. **Modéliser une action par une force** (2nde) : système, action mécanique, vecteur force (4 caractéristiques), à distance / de contact. Cours, série, fiche.
2. **Le diagramme objets-actions** (2nde à Tle) : méthode, exemples (ballon de foot). Cours, série, fiche.
3. **Les forces usuelles** (sous-modules : poids, réaction du support, force de l'air, tension d'un fil, poussée d'Archimède, frottements solides). Cours, série, fiche.
4. **Centre de masse** (Tle). Cours, série, fiche.
5. **Forces qui se compensent** (2nde, 1re). Cours, série, fiche.
6. **Atelier : bilan des forces** (toutes les situations, filtrables par niveau), puis une série de synthèse.

## `principe-dynamique/` après cette application

- Ne supprime rien de `principe-dynamique/`. Propose dans le compte rendu (sans le faire) de remplacer son module 2 par une page externe ↗ vers `bilan-forces/` ; le professeur décidera.

## Vérifications propres

- Toutes les situations de `principe-dynamique/modules/situations.js` fonctionnent à l'identique dans l'atelier ; les nouvelles aussi (directions acceptées, noms, compensation).
- Atelier : un écran à 1280 × 720 / 650 et 390 × 844, tracé de flèches à la souris, au doigt (CDP) et aux flèches.
- Mets à jour `00-commun.md` §10 (ligne `bilan-forces.md`).
