# Forces et mouvement : lois de Newton (prompt de génération)

Lis d'abord `docs/prompts-tspe/00-commun.md` (sources, charte, structure, outils partagés, livraison).

## Application

- Dossier `lois-newton/`, nom « Forces et mouvement : lois de Newton », `data-matiere="physique"`, préfixe `ln`, espace de noms `LN`.
- Portail : `desc: "Bilan des forces, référentiel galiléen, principe d'inertie, actions réciproques et deuxième loi de Newton."` ; `mots` : Newton, inertie, première loi, deuxième loi, troisième loi, actions réciproques, ΣF = ma, somme des forces, résultante, galiléen, référentiel terrestre, géocentrique, héliocentrique, isolé, pseudo-isolé, centre de masse, accélération…
- Dessin d'en-tête : celui de `principe-dynamique/` ou de `cinematique/`.
- **Prérequis** : `bilan-forces.md` exécuté (application `bilan-forces/`). Outils : `VEC` (`cinematique/modules/vecteurs.js`, repère et vecteurs : somme de forces, projection), outil de forces de `bilan-forces/` (s'il est partagé dans `assets/forces.js`), `BULLE`, `PLEIN`.

## Sources (`07- Newton/`)

| Fichier | Contenu | À lire |
|---|---|---|
| `Chap07-Cours_Forces_Mouvement_G3.pdf` (7 p.) | Cours tapé, exemples complétés à la main | Non : résumé ci-dessous. Pages 5 à 7 pour les exemples résolus (principe d'inertie, voiture de course, palet) |
| `Chap07-Exercices.pdf` (6 p.) | Ex. 1 à 20 (ex. 20 : sujet de bac « parapente », projections de vecteurs) | Oui |
| `Chap07-Exercices correction.pdf` (13 p.) | Corrections manuscrites | Oui |

## Consignes du professeur

- Des choses sont déjà faites dans `principe-dynamique/` : **ne pas faire de lien vers cette application**.
- Le cours **« faire un bilan des forces » est très succinct, avec un lien vers l'application `bilan-forces/`** (créée par `bilan-forces.md`, niveaux 2nde à Terminale).

## Contenu du cours (résumé)

- **I. Bilan des forces** (voir `bilan-forces.md`, « Sources ») : système, centre de masse, vecteur force, forces à distance et de contact, diagramme objets-actions, frottements solides. Ici : un résumé d'une page.
- **II. Lois de Newton**
  - **Troisième loi** (actions réciproques) : F⃗<sub>A/B</sub> = −F⃗<sub>B/A</sub> ; personne qui pousse un mur ; Terre et Lune.
  - **Référentiel galiléen** : un référentiel où le principe d'inertie est vérifié ; un référentiel qui tourne, ralentit ou accélère par rapport à un référentiel galiléen ne l'est pas ; héliocentrique (galiléen), géocentrique (galiléen si l'étude ne dépasse pas quelques jours), terrestre (si elle ne dépasse pas quelques minutes).
  - **Première loi** (principe d'inertie) : dans un référentiel galiléen, si un système est isolé ou pseudo-isolé, il est immobile ou en mouvement rectiligne uniforme, et réciproquement ; ΣF⃗<sub>ext</sub> = 0⃗ ⟺ v⃗ constant. Isolé : aucune force ; pseudo-isolé : forces qui se compensent.
  - **Six façons d'utiliser le principe d'inertie** (à reprendre telles quelles, phrases du cours) : 1. immobile / MRU donc ΣF⃗ = 0⃗ ; 2. ΣF⃗ = 0⃗ donc immobile / MRU ; 3. pas MRU donc ΣF⃗ ≠ 0⃗ ; 4. ΣF⃗ ≠ 0⃗ donc pas immobile / pas MRU ; 5. immobile / MRU et ΣF⃗ ≠ 0⃗ donc le référentiel n'est pas galiléen ; 6. pas MRU et ΣF⃗ = 0⃗ donc le référentiel n'est pas galiléen. Exemples : ballon posé ; bagages sur le toit d'une voiture qui démarre ; ballon pendant la frappe ; passager d'une voiture qui freine (référentiel voiture).
  - **Deuxième loi** : « Dans un référentiel galiléen, pour un système de masse constante, ΣF⃗<sub>ext</sub> = m a⃗ » (F en N, m en kg, a en m·s<sup>−2</sup>) ; le principe d'inertie en est le cas particulier a⃗ = 0⃗.
  - **Utilisation** (méthode en 4 points, à reprendre) : définir le système ; définir le référentiel et vérifier qu'il est galiléen ; faire un schéma ; « Dans le référentiel … supposé galiléen, d'après la deuxième loi de Newton pour le système de masse constante, ΣF⃗<sub>ext</sub> = m a⃗ ».
    - Résultante connaissant l'accélération : voiture de course m = 600 kg, 0 à 100 km/h (27,8 m·s<sup>−1</sup>) en 2,5 s, accélération constante.
    - Accélération connaissant les forces (« la situation la plus intéressante » : on en déduit ensuite la vitesse puis la position) : palet m = 500 g poussé par F = 5,0 N, frottements f = 1,0 N.
    - **Erreur du cours à corriger** : « puis la position (car la vitesse est la dérivée de l'accélération) » : il faut « car la vitesse est la dérivée de la position ».

## Plan de l'application (`PLAN`)

### Module 1 : Bilan des forces (succinct)

- Un cours d'**une étape** : système, centre de masse, forces à distance et de contact, diagramme objets-actions, frottements, en résumé (une `cle` par notion, figures), puis « À toi » court (2 bilans).
- **Page externe ↗** (`00-commun.md` §6, type 2, obligatoire) : `bilan-forces/` : son atelier (« Atelier : bilan des forces », niveau Terminale). Le lien remplace tout ce qui serait refait ici.
- Pas de série dans ce module (elle est dans `bilan-forces/`) ; fiche d'une page.

### Module 2 : Troisième loi et référentiel galiléen

Cours, série (forces réciproques : même direction, sens opposés, même valeur, points d'application sur deux objets différents ; référentiel galiléen ou non selon la durée et le mouvement), fiche.

### Module 3 : Principe d'inertie

- Cours : énoncé, isolé / pseudo-isolé, les six façons de l'utiliser.
- **Animation : le principe d'inertie** (`module_3_simulation.html`, page `simulation`, un écran) : une chronophotographie (positions à intervalles de temps égaux) produite en direct par la somme des forces que l'élève règle (forces ajoutées, valeur et direction) sur un palet, une voiture, un skieur ; la somme ΣF⃗ tracée (`VEC`) ; le mouvement obtenu (immobile, MRU, accéléré, ralenti, courbe) décrit en deux mots ; option « référentiel non galiléen » (voiture qui freine, passager). Défis : obtenir un MRU avec deux forces ; un ralentissement ; une trajectoire courbe ; illustrer chacune des six phrases (la phrase se coche quand la situation la réalise).
- Série : appliquer une des six phrases (choisir la phrase juste, compléter), situations variées (chute, glissement, choc, freinage, caddie poussé à force constante, ex. 11).

### Module 4 : Deuxième loi de Newton

- Cours (sous-modules) : énoncé ; résultante connaissant le mouvement (voiture de course : a = Δv/Δt = 11 m·s<sup>−2</sup>, ΣF = 6,7 × 10³ N, à vérifier) ; accélération connaissant les forces (palet : a = (F − f)/m = 8,0 m·s<sup>−2</sup>) ; **sens et direction de la résultante** à partir du mouvement (a⃗ et ΣF⃗ ont même direction et même sens ; lien avec la cinématique : variation du vecteur vitesse) ; **projections** sur des axes (plan incliné, parapente de l'ex. 20).
- **Atelier : somme des forces et accélération** (`module_4_simulation.html`, page `simulation`) : sur un quadrillage (`VEC`), forces données ; l'élève trace ΣF⃗ (règle du parallélogramme ou bout à bout), puis a⃗ = ΣF⃗ / m à l'échelle ; projections sur x et y. Défis dans n'importe quel ordre.
- Série : a à partir des forces, ΣF à partir du mouvement, sens de ΣF d'après une chronophotographie, projections (cos, sin), conversions km/h → m/s.
- Lien facultatif : `cinematique/` (vecteurs vitesse et accélération).

### Module 5 : Exercices

Ex. 1 à 20 de la feuille. Les ex. 1 à 6 (bilans de forces) se font dans l'outil de `bilan-forces/` en partie `perso` si son outil est partagé (`assets/forces.js`), sinon renvoient à l'atelier de `bilan-forces/` (situations ajoutées par `bilan-forces.md`). Ex. 15 à 18 (skieur, voiture-jouet sur une rampe…) : analyse qualitative du mouvement. Ex. 20 : sujet de bac « parapente » (projections de vecteurs, vol droit équilibré) : question complexe guidée par étapes.

## Vérifications propres

- Script : chaque valeur des exemples et des exercices.
- Animation et atelier : un écran, défis dans le désordre, tracé à la souris, au doigt et aux flèches.
- Aucun lien vers `principe-dynamique/` (`grep`).
