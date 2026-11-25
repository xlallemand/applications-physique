# Diffraction et interférences (prompt de génération)

Lis d'abord `docs/prompts-tspe/00-commun.md` (sources, charte, structure, maquettes §8, outils partagés, livraison).

**Ce chapitre se fait en deux sessions** (`00-commun.md` §8) :

1. **Étape 1 : maquettes du simulateur « établir i = λD/a »** (le professeur ne sait pas encore quelle forme il doit prendre et demande des propositions). Tu t'arrêtes après : le professeur choisit.
2. **Étape 2 : l'application**, avec la maquette retenue et les remarques du professeur.

Le message de la session dit quelle étape exécuter. Lis tout ce fichier dans les deux cas.

## Application

- Dossier `diffraction-interferences/`, nom « Diffraction et interférences », `data-matiere="physique"`, préfixe `di`, espace de noms `DI`.
- Portail : `desc: "Diffraction et angle θ = λ/a, interférences, différence de marche, fentes et trous d'Young, interfrange."` ; `mots` : diffraction, fente, fil, trou, tache centrale, demi-ouverture angulaire, θ, laser, interférences, constructives, destructives, en phase, opposition de phase, différence de marche, δ, chemin optique, sources synchrones, cuve à ondes, fentes d'Young, trous d'Young, interfrange, franges, couleurs interférentielles, bulle de savon, antireflet…
- Dessin d'en-tête : franges ou ondes circulaires de deux sources (nouveau dessin `interferences` si rien ne convient).
- Outils : `LG`, `BULLE`, `PLEIN` ; rendu de la surface de l'eau en `canvas` (calcul pixel par pixel, comme une carte d'amplitude) ; le reste en SVG.
- Dossier des maquettes (étape 1) : `docs/diffraction-interferences/maquettes/`.

## Sources (`12- Diffraction interferences/`)

| Fichier | Contenu | À lire |
|---|---|---|
| `Chap12-Cours_diffraction_interferences_complete.pdf` (7 p.) | Cours tapé, complété à la main | Non : résumé ci-dessous. Page 2 (montage de diffraction), page 5 (figure de la différence de marche avec les ondes le long de S<sub>1</sub>M et S<sub>2</sub>M), **page 7 (figure « TRÈS IMPORTANT » : franges sur l'axe x avec δ et k)** à regarder avant les maquettes |
| `Chap12-Exercices.pdf` (5 p.) | Ex. 1 à 16 (1 objet diffractant ; 2 conditions de diffraction ; 3 demi-angle ; 4 largeur d'une tache centrale ; 5 caractère ondulatoire ; 6 détermination expérimentale d'une longueur d'onde ; 7 à 9 interférences ; 10 interfrange ; 11 figure d'interférence ; 12 expression de l'interfrange ; 13 ; 14 interférences lumineuses ; 15 couche antireflet ; 16 bulle de savon) | Oui |
| `Chap12-Exercices_correction.pdf` (7 p.) | Corrections | Oui |
| `Interférence de deux ondes à la surface de l'eau.htm` (+ dossier `_files`, script `interference_NosC.js`) | Animation enregistrée d'un site extérieur (sources, écartement, longueur d'onde, déphasage, surface de l'eau) | **Inspiration seulement** : ouvre-la dans Chromium (Playwright) et regarde-la, lis `interference_NosC.js` pour le calcul ; ne copie ni le code ni le style (droits), n'y fais pas de lien |
| `animations.txt` | Liens vers physique.ostralo.net, phyanim (Nantes), PhET « Wave Interference » | Inspiration seulement |

Les TP (diffraction, interférences, notebook Python) ne sont pas repris. Note du professeur sur le TP d'interférences, à appliquer si un calcul de λ à partir de mesures de i apparaît dans l'application : « ne pas faire calculer λ avec un programme à part (trop compliqué pour eux) ; l'incorporer de façon masquée dans le calcul de la moyenne à partir de i ».

## Consignes du professeur

1. **Animation : influence de la taille de l'obstacle sur la diffraction.** Une **fente qu'on ferme de plus en plus** : on voit la diffraction apparaître et augmenter. Faire le lien entre **λ, a (taille de l'obstacle) et la diffraction**. **Montrer l'angle de diffraction.** Diffraction par une **fente**, un **fil**, une **ouverture circulaire**.
2. **Animation (une seule page) pour comprendre la différence de marche.**
   - Deux sources **en phase** ; on voit les **deux ondes jusqu'à un point M** (comme dans le cours, page 5).
   - Une animation permet de **déplacer S<sub>2</sub> jusqu'à la droite S<sub>1</sub>M** pour visualiser le **chemin supplémentaire** (différence de marche) et la **portion d'onde supplémentaire**.
   - On peut **déplacer M** et observer sur un **graphique temporel** les **deux ondes reçues en M et leur somme**.
   - On peut afficher **en fond la surface de l'eau** (interférences de deux sources, comme l'animation du dossier du cours) ; **le fond change** avec les réglages ; on peut **afficher / masquer les deux ondes le long du chemin** ; le graphique temporel en M reste toujours visible.
   - On peut afficher une situation d'**interférences lumineuses entre deux fentes éclairées par un laser** : le point M ne se déplace alors **que sur l'écran** (**vue de côté**, contrairement à la vue de dessus de la surface de l'eau). On peut faire varier **λ**, la **distance entre les fentes** et la **largeur des fentes** (on voit sur l'écran **interférences + diffraction**).
3. **Simulateur / animation pour comprendre comment on établit la relation i = λD/a** : il faut **voir en même temps la différence de marche et l'interfrange** quand on se déplace sur la figure d'interférences. **Proposer des maquettes pour validation** (étape 1).

## Contenu du cours (résumé)

### I. Diffraction

- **Définition** : modification de la direction de propagation d'une onde au passage d'une petite ouverture ou d'un petit obstacle, sans modification de f ni de λ ; l'onde se propage alors dans toutes les directions. À prendre en compte quand la taille de l'obstacle n'est pas très grande devant λ (cas 1 : a ≫ λ ; cas 2 : a proche de λ) ; d'autant plus prononcée que l'obstacle est petit. Exemples : houle (λ ≈ 1 m), cuve à ondes (λ ≈ 1 cm), lumière par un trou ou une fente (le cours écrit « λ = 1000 nm » : ordre de grandeur de la lumière visible, garde « ≈ 500 nm ») ; un fil donne la même figure qu'une fente.
- **Montage à connaître** : laser, fente ou fil de largeur a, écran à la distance D ; d demi-largeur de la tache centrale ; θ demi-ouverture angulaire (angle de diffraction).
- **θ = λ / a** (à connaître) ; **θ = d / D** pour de petits angles en radian (à savoir retrouver : tan θ ≈ θ ; tan(0,3), tan(0,2), tan(0,1) comparés à l'angle ; tan θ = d/D).
- Application 1 : D = 1,50 m, θ = f(1/a) est une droite y = 6,3 × 10<sup>−7</sup> x → λ = 6,3 × 10<sup>−7</sup> m = 630 nm. Application 2 : λ = 650 nm, D = 2,00 m, largeur de la tache ℓ = 1,7 cm : θ = ℓ/(2D), a = 2λD/ℓ ≈ 1,5 × 10<sup>−4</sup> m.
- **Lumière blanche** : figures de chaque λ superposées, figure colorée.
- Applications : son de 1000 Hz (λ = 0,34 m) diffracté par une porte (on entend sans voir) ; DVD (650 nm, ouverture 1,3 µm) et BluRay (0,58 µm : λ plus petite pour limiter la diffraction).

### II. Interférences

- **Sources synchrones** (même fréquence, émettent en même temps) : deux haut-parleurs sur le même générateur ; deux sources de lumière seulement si elles viennent du même laser. « Question classique » (ex. 8 q. 1, ex. 9 q. 6).
- **Différence de marche δ = S<sub>2</sub>M − S<sub>1</sub>M** (différence de chemin optique) ; figure du cours : l'onde de S<sub>1</sub> et l'onde de S<sub>2</sub> dessinées le long de S<sub>1</sub>M et S<sub>2</sub>M, δ marqué en rouge ; annotation : « en M, l'onde de S<sub>1</sub> et l'onde de S<sub>2</sub> sont opposées → en opposition de phase → interférences destructives ».
- **Constructives** : ondes en phase en M ; **δ = kλ** (k ∈ ℤ). **Destructives** : opposition de phase (décalées d'une demi-longueur d'onde) ; **δ = (k + ½)λ**. Graphiques temporels : onde reçue de S<sub>1</sub>, de S<sub>2</sub>, superposition. Réponse type à « donner les conditions » (manuscrite).
- **Fentes d'Young** : un laser éclaire deux fentes fines distantes de a ; chaque fente diffracte ; sur l'écran, la figure de diffraction d'une fente avec des franges fines à l'intérieur. Franges sombres : destructives ; brillantes : constructives. **Interfrange i** : distance entre deux franges brillantes (ou sombres) consécutives ; **i = λD/a** (pas à connaître mais à savoir utiliser) ; mesurer plusieurs interfranges et diviser.
- **Trous d'Young** : **δ = a<sub>1−2</sub> x / D** (pas à connaître, à savoir utiliser). **Savoir en déduire l'interfrange** (manuscrit) : δ = kλ et x = k i, donc kλ = a<sub>1−2</sub> k i / D, donc i = λD/a<sub>1−2</sub>. Exemples 1 (k-ième frange brillante), 2 (première frange sombre : 0,5λ = a × 0,5 i / D), 3 (entre deux franges brillantes successives, δ augmente de Δδ = λ quand x augmente de Δx = i : λ = a i / D).
- **Figure « TRÈS IMPORTANT »** (page 7) : sur l'axe x de l'écran, les franges brillantes repérées par δ = −λ (k = −1), δ = 0, δ = 1λ (k = 1), δ = 2λ (k = 2) ; les sombres par δ = −0,5λ, 0,5λ, 1,5λ ; i entre deux brillantes, i/2 entre une brillante et la sombre voisine.
- Applications : casques antibruit, couche antireflet (ex. 15), mesures nanométriques ; **couleurs interférentielles** en lumière blanche (bulle de savon : note manuscrite sur la structure du film de savon, tête hydrophile, queue hydrophobe, deux rayons qui interfèrent dans l'œil).

## Plan de l'application (`PLAN`), étape 2

### Module 1 : Diffraction

- **Animation : diffraction par un obstacle** (`module_1_simulation.html`, un écran) — consigne 1 : vue de dessus d'une onde plane (cuve à ondes, ou lumière) arrivant sur une **fente dont on règle la largeur a** (glisser les bords, curseur) ; λ réglable ; l'onde après l'obstacle (rendu `canvas` de l'amplitude, ou fronts d'onde) ; **l'angle de diffraction θ** tracé et chiffré (θ = λ/a quand il a un sens) ; à droite, la **figure sur un écran** (tache centrale et taches secondaires) et sa largeur 2d ; **onglets fente / fil / ouverture circulaire** (fil : même figure que la fente ; trou : anneaux, θ ≈ 1,22 λ/a signalé « hors programme » dans une bulle) ; lumière blanche en option. Défis : fermer la fente jusqu'à voir la diffraction ; doubler θ ; faire que a ≈ λ ; comparer fente et fil de même largeur ; trouver a à partir de la tache.
- Cours (sous-modules) : définition et condition ; montage, θ = λ/a, θ = d/D (petits angles, démonstration) ; exploitation d'une droite θ = f(1/a) (lien avec la droite d'étalonnage de « Méthodes physiques d'analyse ») ; lumière blanche et applications.
- Série : θ, a, λ, largeur de la tache, conversions nm / µm, droite θ = f(1/a), conditions de diffraction.

### Module 2 : Interférences et différence de marche

- **Animation : différence de marche** (`module_2_simulation.html`, une seule page) — consigne 2, avec tous ses éléments (deux sources en phase ; ondes le long de S<sub>1</sub>M et S<sub>2</sub>M ; **S<sub>2</sub> qui pivote autour de M jusqu'à la droite S<sub>1</sub>M** pour montrer le chemin et la portion d'onde supplémentaires ; **M déplaçable** ; **graphique temporel des deux ondes reçues en M et de leur somme**, toujours visible ; **fond « surface de l'eau »** activable qui change avec λ, l'écartement et le déphasage (déphasage seulement en option « avancé », les sources du cours sont en phase) ; ondes du chemin affichables / masquables ; **mode « lumière : fentes d'Young » en vue de côté**, M sur l'écran seulement, λ, distance entre les fentes et largeur des fentes réglables, écran qui montre interférences + diffraction) ; δ et δ/λ affichés en continu ; « constructive / destructive / intermédiaire » écrit en clair.
  - Défis : placer M sur une interférence constructive, puis destructive ; trouver δ = 2λ ; montrer que δ = λ/2 donne une somme nulle ; dans la vue « lumière », réduire la largeur des fentes et voir l'enveloppe de diffraction s'élargir ; changer λ et voir les franges s'écarter.
- Cours (sous-modules) : sources synchrones ; différence de marche ; conditions (δ = kλ, δ = (k + ½)λ) établies avec les graphiques temporels ; cuve à ondes ; fentes d'Young (figure).
- Série : constructive ou destructive pour un δ donné, conditions, sources synchrones (question classique), lecture d'une figure de cuve à ondes.

### Module 3 : Interfrange

- **Simulateur : établir i = λD/a** : **la maquette retenue à l'étape 1**.
- Cours : interfrange (mesure sur plusieurs franges), i = λD/a (à savoir utiliser), trous d'Young δ = a x / D, les trois façons d'établir i (exemples 1 à 3), figure « TRÈS IMPORTANT », couleurs interférentielles, applications (antireflet, bulle).
- Série : mesurer i (plusieurs franges, `LG` ou règle sur une figure), λ, a ou D à partir de i, établir i à partir de δ (parties successives), position d'une frange de rang k.

### Module 4 : Exercices

Ex. 1 à 16 de la feuille ; ex. 6 (détermination expérimentale d'une longueur d'onde, droite d'étalonnage, incertitudes, compatibilité) ; ex. 15 et 16 (antireflet, bulle) : questions complexes guidées.

## Étape 1 : maquettes du simulateur « établir i = λD/a »

Le but (consigne 3) : **voir en même temps la différence de marche et l'interfrange quand on se déplace sur la figure d'interférences**, pour comprendre d'où vient i = λD/a (δ = a x/D et δ = kλ aux franges brillantes, donc x<sub>k</sub> = kλD/a et i = x<sub>k+1</sub> − x<sub>k</sub> = λD/a).

Propose **trois maquettes fonctionnelles** différentes (un écran chacune, souris et doigt, `00-commun.md` §5 et §8), par exemple :

- **Maquette A : « deux vues liées »** : en haut, la vue de côté (laser, trous S<sub>1</sub> S<sub>2</sub> distants de a, écran à D, point M d'abscisse x sur l'écran, chemins S<sub>1</sub>M et S<sub>2</sub>M, petit triangle qui montre δ) ; en bas, l'écran vu de face (franges). L'élève **glisse M le long de l'écran** : δ et δ/λ s'affichent ; un **graphe δ = f(x)** (droite de pente a/D) se trace en même temps, avec des **lignes horizontales aux multiples de λ** ; chaque fois que la droite croise un multiple de λ, une frange brillante s'allume sur l'écran ; l'écart entre deux croisements est i, et sa valeur λ/(a/D) se lit sur le graphe. Réglages λ, a, D : la pente et les franges bougent ensemble.
- **Maquette B : « la règle des δ »** : la figure « TRÈS IMPORTANT » du cours rendue interactive : sous les franges, une **règle graduée en δ** (−2λ, −1,5λ … 2λ) alignée avec la règle en x ; quand on change a ou D, la règle en δ s'étire ou se resserre ; l'élève place les étiquettes k = −1, 0, 1, 2 et 0,5λ, 1,5λ sur les franges, puis mesure i entre deux brillantes ; la dérivation (kλ = a x<sub>k</sub>/D…) s'écrit pas à pas à côté, chaque ligne reliée à la figure par une couleur.
- **Maquette C : « pas à pas, de frange en frange »** : M saute de frange brillante en frange brillante (boutons ← →) ; à chaque saut, δ augmente de λ (une portion d'onde de plus apparaît sur le chemin S<sub>2</sub>M, comme dans l'animation du module 2) et x augmente de i ; tableau qui se remplit (k, x<sub>k</sub>, δ) ; l'élève en déduit Δδ = λ ↔ Δx = i, puis i = λD/a (exemple 3 du cours).

Tu peux combiner ou en proposer une autre si elle sert mieux la consigne. Dans `docs/diffraction-interferences/maquettes/index.html` : ce qui distingue les maquettes, ce qu'il faut essayer, et les **questions au professeur** (par exemple : trous ou fentes d'Young dans le simulateur ? une seule maquette, ou deux onglets complémentaires ? faut-il afficher l'approximation des petits angles ? la démonstration écrite doit-elle se faire dans le simulateur ou dans le cours ?).

## Vérifications propres (étape 2)

- Script : applications du cours (630 nm ; a ≈ 1,5 × 10<sup>−4</sup> m ; porte : λ = 0,34 m) et chaque exercice.
- Animations : un écran à 1280 × 720 / 650 et 390 × 844 dans chaque mode (eau, lumière) ; rendu `canvas` fluide (calcul limité à une résolution raisonnable, recalcul seulement quand un réglage change) ; reduced-motion ; somme des deux ondes en M juste (nulle pour δ = λ/2).
