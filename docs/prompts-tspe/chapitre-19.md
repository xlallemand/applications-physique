# Lunette astronomique (prompt de génération)

Lis d'abord `docs/prompts-tspe/00-commun.md` (sources, charte, structure, outils partagés, livraison).

## Application

- Dossier `lunette-astronomique/`, nom « Lunette astronomique », `data-matiere="physique"`, préfixe `la`, espace de noms `LA`.
- Portail : `desc: "Lentille convergente, foyers et infini, lunette afocale, image intermédiaire, grossissement G = f′₁/f′₂."` ; `mots` : lentille convergente, foyer objet, foyer image, distance focale, vergence, dioptrie, conjugaison, grandissement, infini, rayons parallèles, plan focal, objectif, oculaire, afocal, diamètre apparent, grossissement, cercle oculaire, lunette commerciale 70/700…
- Dessin d'en-tête : `rayons` (existe).
- **Prérequis** : `modele-oeil.md` exécuté (application `modele-oeil/`). Outils : **`OPT`** (`assets/optique.js`, `optique.css` : rayons, lentilles, constructions ; lis son en-tête ; étends-le si besoin de façon compatible et reteste `refraction/`, `lentilles/`, `modele-oeil/`, `banc-optique/` s'il le charge), `BULLE`, `PLEIN`.

## Sources (`19- Lunette astronomique/`)

| Fichier | Contenu | À lire |
|---|---|---|
| `Chap19-Cours lunette complete.pdf` (7 p.) | Cours tapé, complété à la main | Non : résumé ci-dessous. Pages 2 à 4 (constructions corrigées, **page 3 « IMPORTANT »**), 5 à 7 (diamètre apparent, construction de la lunette, démonstration du grossissement, cercle oculaire) pour les figures et les démonstrations |
| `Chap19-Exercices.pdf` (3 p.) | Ex. 1 à 11 (en images) | Oui |
| `Chap19-Exercices correction.pdf` (9 p.) | Corrections manuscrites | Oui |

Le TP (maquette de lunette) n'est pas repris : l'application `banc-optique/` le permet (voir les liens).

## Consignes du professeur

- **Rappels rapides** sur les constructions de l'image par une lentille convergente ; **lien vers `lentilles/`** pour des rappels plus approfondis (lien facultatif, type 1).
- **Beaucoup d'entraînement** pour savoir que **l'infini et le plan focal sont conjugués** : très important, les élèves ont du mal à l'intégrer.
- **Lien vers `banc-optique/`** pour **faire et manipuler une lunette astronomique** (page externe ↗, obligatoire : son module ou sa page « lunette astronomique » ; trouve sa clé dans son `PLAN`, `banc-optique/modules/bo.js` / `tp.js`).
- **Lien vers `modele-oeil/`** (créée par `modele-oeil.md`) : lien facultatif (type 1) dans le cours « observation sans fatigue ».

## Contenu du cours (résumé)

### I. Lentilles convergentes (rappels)

- **Distance focale f′ = OF′** (m), **algébrique** ; **vergence** v = 1/f′ (dioptrie δ, 1 δ = 1 m<sup>−1</sup>).
- Constructions : image A′B′ d'un objet AB ; objet AB qui donne une image A′B′ donnée.
- **Conjugaison** 1/OA′ − 1/OA = 1/OF′ = 1/f′ ; **grandissement** γ = A′B′/AB = OA′/OA (algébriques). Exemple : f′ = 3,0 cm, objet de 2,0 cm à 8,0 cm : schéma à l'échelle, puis relations (OA′ = 4,8 cm, γ = −0,6, A′B′ = −1,2 cm).
- **L'infini en optique** (« IMPORTANT ») : un objet à l'infini donne des rayons parallèles ; si les rayons qui doivent former l'image sont parallèles, l'image est à l'infini. Notes du professeur : « **infini = rayons parallèles** » ; « **foyer et infini sont conjugués** (= image l'un de l'autre) ».
- **Très important : images des plans focaux et de l'infini** (tableau à quatre cases, page 3) :
  - l'image du foyer objet est un faisceau horizontal (rayon par O non dévié) ;
  - l'image d'un faisceau horizontal est le foyer image ;
  - l'image d'un objet dans le plan focal objet est un faisceau parallèle ; **méthode** : ① le rayon qui passe par O n'est pas dévié ; ② les autres rayons sont parallèles à ce rayon (car image du foyer = infini) ;
  - l'image d'un faisceau parallèle est dans le plan focal image ; **méthode** : ① le rayon qui arrive en O n'est pas dévié ; ② image de l'infini = foyer, donc B′ est dans le plan focal image (à la perpendiculaire de F′) ; ③ A′ sur l'axe optique.
  - Avec les relations : objet à l'infini (1/OA = 0) ⟹ OA′ = f′ : A′ en F′ ; image à l'infini (1/OA′ = 0) ⟹ OA = −f′ : A en F.
- Exemples à construire (objet à l'infini, objet dans le plan focal, image à l'infini).

### II. Lunette astronomique

- **Observation sans fatigue** : rayons incidents parallèles (l'œil n'accommode pas) ; les instruments donnent une image à l'infini : c'est le rôle de l'oculaire.
- **Diamètre apparent** α : angle sous lequel on voit un objet ; étoile : ponctuelle à l'échelle (rayons parallèles), et en exagérant sa taille, angle α ; les deux sur un même dessin.
- **Constitution** : objectif (côté objet) et oculaire (côté œil), convergents, même axe ; **système afocal** (rayons parallèles à l'entrée et à la sortie) : **foyer image de l'objectif et foyer objet de l'oculaire confondus**.
- **Construction** : L<sub>1</sub> donne de AB (à l'infini) une **image intermédiaire A<sub>1</sub>B<sub>1</sub> dans son plan focal image** ; L<sub>2</sub> en donne une image A<sub>2</sub>B<sub>2</sub> à l'infini.
- **Grossissement** G = α′/α ; **G = f′<sub>1</sub>/f′<sub>2</sub>** (démonstration à savoir faire : tan α ≈ α = A<sub>1</sub>B<sub>1</sub>/f′<sub>1</sub>, α′ = A<sub>1</sub>B<sub>1</sub>/f′<sub>2</sub>) ; fort grossissement : objectif de grande focale, oculaire de courte focale.
- **Lunette commerciale** : diamètre et focale de l'objectif en mm (70/700) ; focales des oculaires fournies → G.
- **Cercle oculaire** : image de l'objectif par l'oculaire ; c'est là qu'on place l'œil (toute la lumière y passe) ; construction.

## Plan de l'application (`PLAN`)

### Module 1 : Lentille convergente (rappels rapides)

Cours court (une ou deux étapes) : focale, vergence, constructions, relations algébriques ; **lien facultatif** vers `lentilles/` (« Revois : Image par une lentille convergente »). Série : constructions (outil `OPT`), conjugaison et grandissement (algébriques, signes), vergence.

### Module 2 : L'infini et le plan focal sont conjugués (beaucoup d'entraînement)

- Cours : « infini = rayons parallèles », « foyer et infini sont conjugués », le tableau des quatre cas avec les méthodes du professeur (rayon non dévié par O, puis parallèles / plan focal), et la vérification par les relations.
- **Atelier d'entraînement** (`module_2_simulation.html`, page `simulation` « Atelier : foyers et infini », un écran) : **entraînement sans fin** sur les quatre cas, tirés au hasard (lentille de focale et position variables, faisceau incliné d'angle variable, point objet dans le plan focal à hauteur variable) : l'élève **trace** le rayon non dévié par O, puis **place** le point image dans le plan focal image (glisser, ou toucher) ou **oriente** le faisceau émergent (glisser la direction, flèches fines) ; vérification et diagnostics (« le faisceau sort parallèle au rayon qui passe par O », « l'image d'un faisceau parallèle n'est pas au foyer F′ s'il est incliné : elle est dans le plan focal, à la verticale de F′ », « tu as placé l'image dans le plan focal objet ») ; compteur de réussites par cas ; page faite après 3 réussites dans chaque cas ; défis « enchaîner deux lentilles » (préparation de la lunette).
- Série (10 questions, beaucoup de constructions) : les quatre cas, objet / image à l'infini avec les relations, choisir la bonne figure parmi plusieurs (distracteurs classiques).

### Module 3 : La lunette astronomique

- Cours (sous-modules) : observation sans fatigue (lien facultatif `modele-oeil/`) ; diamètre apparent ; constitution et système afocal ; construction de la lunette ; grossissement (démonstration en « À toi » par étapes) ; lunette commerciale ; cercle oculaire.
- **Simulateur : lunette afocale** (page `simulation`, un écran) : objectif et oculaire (focales réglables, position de l'oculaire réglable), faisceau parallèle incliné d'angle α venant d'un point de l'astre ; image intermédiaire A<sub>1</sub>B<sub>1</sub> ; faisceau émergent d'angle α′ ; G = α′/α mesuré et f′<sub>1</sub>/f′<sub>2</sub> calculé ; cercle oculaire ; défis : rendre la lunette afocale (F′<sub>1</sub> = F<sub>2</sub>) ; obtenir G = 20 avec les oculaires d'une lunette 70/700 ; trouver le cercle oculaire ; voir que l'image est renversée.
- **Page externe ↗** (type 2, obligatoire) : `banc-optique/` (page de la lunette astronomique).
- Série : construction (outil `OPT`), G = f′<sub>1</sub>/f′<sub>2</sub> et G = α′/α, données d'une lunette commerciale, cercle oculaire, rôle de l'objectif et de l'oculaire.

### Module 4 : Exercices

Ex. 1 à 11 de la feuille ; les constructions se font dans l'outil `OPT` en partie `perso`.

## Vérifications propres

- Script : exemple du cours (OA′ = 4,8 cm, γ = −0,6), chaque exercice (G, focales, diamètres apparents en radians et degrés).
- Atelier et simulateur : un écran, tracés au doigt et à la souris, flèches fines ; diagnostics de chaque erreur listée.
- `OPT` : si modifié, `refraction/`, `lentilles/`, `modele-oeil/` (et `banc-optique/` s'il le charge) retestées.
