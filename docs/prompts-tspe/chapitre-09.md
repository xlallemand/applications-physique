# Énergie et travail (prompt de génération)

Lis d'abord `docs/prompts-tspe/00-commun.md` (sources, charte, structure, outils partagés, livraison).

## Application

- Dossier `energie-travail/`, nom « Énergie et travail », `data-matiere="physique"`, préfixe `et`, espace de noms `ET`.
- Portail : `desc: "Travail d'une force, théorème de l'énergie cinétique, énergie mécanique et frottements, accélérateur de particules."` ; `mots` : énergie cinétique, Ec, ½mv², travail, joule, théorème de l'énergie cinétique, TEC, énergie potentielle de pesanteur, mgz, énergie mécanique, Em, conservation, frottements, qU, travail électrique, moteur, résistant…
- Dessin d'en-tête : celui de `energie-cinetique/` s'il convient.
- **Prérequis** : `travail-force.md` exécuté (application `travail-force/`). Outils : `VEC`, `EQ` (isoler v dans ½mv² = …), `LG`, `BULLE`, `PLEIN`.

## Sources (`09- Energie/`)

| Fichier | Contenu | À lire |
|---|---|---|
| `Chap09-Energie-cours complete.pdf` (8 p.) | Cours tapé, exemples complétés à la main | Non : résumé ci-dessous. Pages 2 à 6 et 8 pour les exemples résolus (schémas, bilans des forces, rédaction du TEC) |
| `Chap09-Exercices.pdf` (2 p.) | Ex. 1 à 9 (ex. 9 : « un accélérateur au service de l'art ») | Oui |
| `Chap09-Exercices-Correction.pdf` (6 p.) | Corrections manuscrites | Oui |
| `Animation Energie mecanique.txt` | Lien vers la simulation PhET « Energy Skate Park » | Inspiration seulement (`00-commun.md` §2) |

Le TP « énergie perdue par frottements » n'est pas repris.

## Consignes du professeur

- Le **simulateur du travail des forces** est une application à part (`travail-force/`, prompt `travail-force.md`), intégrée au parcours par une **page externe ↗** (obligatoire).
- Toujours des **angles en degrés**.

## Contenu du cours (résumé)

- **Théorème de l'énergie cinétique** : « La variation d'énergie cinétique d'un solide est égale au travail des forces extérieures » : Δ<sub>AB</sub>E<sub>c</sub> = ΣW<sub>AB</sub>(F⃗) avec Δ<sub>AB</sub>E<sub>c</sub> = E<sub>cB</sub> − E<sub>cA</sub> (finale moins initiale), en J.
- **Énergie cinétique** E<sub>c</sub> = ½ m v² (J, kg, m·s<sup>−1</sup>).
- **Travail d'une force constante** (l'énergie qu'elle transmet) : W<sub>AB</sub>(F⃗) = F × AB × cos α (J, N, m ; α angle entre F⃗ et AB⃗) ; **indépendant du trajet** ; exemple 1 : F = 10 N, AB = 1 m, plusieurs angles (40°, 30°…) ; exemple 2 : pétrolier remorqué sur 2,0 km, F = 100 kN à 20°.
- **Travail moteur / résistant / nul** : tableau à trois colonnes (0° ≤ α < 90°, 0 < cos α ≤ 1, W > 0, « la force favorise le déplacement » ; 90° < α ≤ 180°, W < 0, « ne favorise pas » ; α = 90°, W = 0, « n'a pas d'effet »).
- **Travail du poids** : W<sub>AB</sub>(P⃗) = m g h, h altitude **descendue** (h > 0 si l'objet descend : moteur ; h < 0 s'il monte : résistant) ; **démonstration en décomposant le trajet** A → C (vertical) → B (horizontal) : P × AC × cos 0 + 0.
- **Travail d'une force électrique constante** : W<sub>AB</sub>(F⃗<sub>él</sub>) = q U (C, V) ; démonstration sur le chemin A → C → B (qE × L, E = U/L) ; remarque : particule négative : refaire la démonstration ou raisonner « moteur ou résistant » pour le signe ; exemples : électron accéléré, particule positive ralentie.
- **Force toujours perpendiculaire au mouvement** : travail nul (attraction de la Terre sur un satellite en orbite circulaire, tension du fil d'un pendule, réaction d'une table à coussin d'air et poids sur un trajet horizontal).
- **Utiliser le TEC** : si on connaît W, on trouve la variation de vitesse ; si on connaît les vitesses, on trouve W (une force, un déplacement). Rédaction : schéma, bilan des forces, TEC. Exemples : pomme lâchée de 10 m (m = 100 g, g = 10 m·s<sup>−2</sup> : v = √(2gh) ≈ 14 m·s<sup>−1</sup>) ; pomme lancée à 10 m·s<sup>−1</sup> vers le haut (h = v²/(2g) = 5 m) ; pierre de curling (m = 18 kg, v = 1 m·s<sup>−1</sup>, f = 0,7 N : d = m v²/(2f) ≈ 13 m).
- **Accélérateur linéaire par l'énergie** : particule q > 0 sans vitesse initiale, tension U : ½ m v² = qU, v = √(2qU/m) ; électron arrivant avec v<sub>0</sub> : ½ m v² − ½ m v<sub>0</sub>² = |e| U (signe à justifier).
- **Énergie mécanique** E<sub>m</sub> = E<sub>c</sub> + E<sub>p</sub> ; en chute libre E<sub>p</sub> = E<sub>pp</sub> = m g z ; **conservée sans frottements**. E<sub>pp</sub> définie à une constante près (origine de z au choix : balle de 100 g sur un balcon à 3 m, deux choix d'origine, même variation de −3 J). Avec frottements : E<sub>m</sub> diminue ; la perte est le travail des forces de frottement. **TEC et conservation de E<sub>m</sub> sont équivalents** (au programme, E<sub>m</sub> seulement en chute libre) ; mêmes exemples de la pomme refaits avec E<sub>m</sub>.

## Plan de l'application (`PLAN`)

### Module 1 : Travail d'une force

- Sous-modules de cours : définition et formule (exemples 1 et 2) ; moteur, résistant, nul ; travail du poids (démonstration en décomposant le trajet) ; travail d'une force électrique (W = qU, signe pour une charge négative) ; force perpendiculaire au mouvement.
- **Page externe ↗** (type 2, obligatoire), **en tête du module** : `travail-force/` (« Simulateur : travail d'une force »).
- Série : W = F × AB × cos α (calculatrice en degrés : diagnostic radians), signe, travail du poids (montée / descente), W = qU (signe pour un électron), travail nul.

### Module 2 : Théorème de l'énergie cinétique

- Sous-modules : énergie cinétique ; énoncé du TEC ; utilisation dans le champ de pesanteur (pomme lâchée, pomme lancée, curling) ; accélérateur linéaire (lien avec « Mouvement dans un champ uniforme » : même résultat v = √(2qU/m) par deux méthodes).
- **Méthode avec schéma** (à reprendre de `energie-cinetique/`, module 4 « Utilisation » : schéma, bilan des forces, travaux, TEC, grandeur isolée avec `EQ`).
- Série : v finale, hauteur atteinte, distance d'arrêt, force de frottement, vitesse de sortie d'un accélérateur.

### Module 3 : Énergie mécanique

- Cours : E<sub>c</sub>, E<sub>pp</sub>, E<sub>m</sub> ; origine de l'altitude ; conservation sans frottements ; perte avec frottements = travail des frottements ; équivalence avec le TEC.
- **Simulateur : énergies d'un skieur / d'une balle** (`module_3_simulation.html`, un écran ; idée de PhET « Energy Skate Park », sans le copier) : une piste (ou un lancer) réglable, avec ou sans frottements ; barres (ou camembert) E<sub>c</sub>, E<sub>pp</sub>, E<sub>m</sub> et énergie perdue, et graphiques E(t) ou E(z) en direct ; origine de z déplaçable (E<sub>pp</sub> change, ΔE<sub>pp</sub> non). Défis : faire passer le skieur au sommet suivant ; trouver la hauteur maximale d'une balle lancée ; montrer que E<sub>m</sub> se conserve sans frottements ; mesurer l'énergie perdue par frottements et en déduire f (comme le TP, sans le citer).
- Série : E<sub>pp</sub> avec une origine donnée, conservation pour trouver v ou h, perte d'énergie, f à partir de la perte.

### Module 4 : Exercices

Ex. 1 à 9 de la feuille ; ex. 9 (« un accélérateur au service de l'art ») : question complexe guidée.

## Vérifications propres

- Script : chaque exemple (14 m·s<sup>−1</sup>, 5 m, 13 m, pétrolier 1,9 × 10<sup>8</sup> J…) et chaque exercice.
- Simulateur : un écran, conservation numérique de E<sub>m</sub> sans frottements (à 0,1 % près), défis dans le désordre.
