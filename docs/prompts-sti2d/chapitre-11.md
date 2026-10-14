# Chapitre 11 : Changements d'état et transferts thermiques (prompt de génération)

Lis d'abord `docs/prompts-sti2d/00-commun.md` (sources, charte, structure, livraison).

## Application

- Dossier `changements-etat/`, nom « Chapitre 11 : Changements d'état et transferts thermiques », `data-matiere="physique"` (partie « Matière et matériaux »), préfixe `ce`.
- Portail : desc « Chaleur latente, Q = m c ΔT et Q = m L, diagramme d'état, schéma des étapes d'un chauffage. » ; dessin d'en-tête : `molecules`, ou un nouveau dessin « glaçon, eau, vapeur » dans `hero.js`.

## Sources (`TSTI2D/11- Changements d'etat et transferts thermiques/`)

| Fichier | Contenu | À lire |
|---|---|---|
| `Chap11-Cours_complete.pdf` (1 p.) | Cours complété à la main (exemples sur le diagramme d'état) | Non : résumé ci-dessous. Lis-le une fois si tu veux reproduire le diagramme des transitions et le diagramme d'état |
| `Chap11-Exercices.pdf` (2 p.) | Ex. 13, 14 p. 146 ; 10 p. 145 ; 15 p. 146 ; 7, 8 p. 145 ; 17 p. 147 | Oui (diagrammes, représentations moléculaires, schéma de la PAC) |
| `Chap11-correction exercices.pdf` (4 p.) | Corrections manuscrites, **avec le schéma des étapes** (ex. 14 et 15) | Oui : c'est le modèle de la méthode |
| `exo bac blanc.pdf` (2 p.) + `exo bac blanc corr.pdf` (1 p.) | Exercice de bac blanc « Dégivrage » et sa correction | Oui (circuit avec M<sub>1</sub>, M<sub>2</sub>, données du multimètre) |

Ignore `Chap11-Cours.pdf` et tous les `.docx`.

## Contenu du cours

### Module 1 : États de la matière et liaison hydrogène

- **Les trois états** : solide, liquide, gaz ; représentations microscopiques (ex. 8).
- **Les six changements d'état** (diagramme triangulaire à refaire en SVG) : fusion, solidification, vaporisation, liquéfaction, sublimation, condensation.
- **Chaleurs latentes** : L<sub>solidification</sub> = −L<sub>fusion</sub> ; L<sub>liquéfaction</sub> = −L<sub>vaporisation</sub> ; L<sub>condensation</sub> = −L<sub>sublimation</sub>.
- **Liaison hydrogène** : charges partielles δ⁺ sur H, 2δ⁻ sur O ; liaison entre un H d'une molécule et le O d'une autre (pointillés).
  - Elle explique les propriétés de l'eau : la glace est moins dense que l'eau liquide, les glaçons flottent.
  - Expérience du cours : un filet d'eau est dévié par une règle frottée.
- **Série** : nom d'un changement d'état, état d'une représentation microscopique, bonne représentation de la liaison hydrogène (ex. 7), signe de L.

### Module 2 : Diagramme d'état (P, T)

- **Le diagramme** : zones solide, liquide, gaz ; **point triple** (les trois états coexistent : eau 611 Pa, 273,16 K) ; **point critique** (fin de la courbe de vaporisation : eau 218 atm, 374 °C).
- **Savoir dire dans quel état est l'espèce** pour (T, P). Exemples du cours :
  - −10 °C et 1 bar : solide ; on chauffe : fusion à 0 °C, ébullition à 100 °C ;
  - 120 °C et 2 bar : liquide ;
  - 50 °C et 0,06 bar : gaz.
- **La température de changement d'état dépend de la pression** (ex. 15 : R22).
- **Outil `perso`** : diagramme d'état de l'eau, schématique comme celui du cours. L'élève place un point (T, P) et l'état s'affiche après sa réponse. Un chauffage à pression constante est une **flèche horizontale** : les croisements avec les courbes donnent les températures de changement d'état. Cet outil prépare le schéma des étapes.
- **Série** : état pour (T, P), températures de fusion et d'ébullition à une pression donnée, lecture d'une courbe P(T) de vaporisation.

### Module 3 : Énergie et changement de température

- **Formule** : Q = m × c × (T<sub>f</sub> − T<sub>i</sub>) (Q en J, m en kg, c capacité thermique massique en J·kg⁻¹·K⁻¹ ou J·kg⁻¹·°C⁻¹).
- **c dépend de l'état** : c<sub>glace</sub>, c<sub>eau liquide</sub>, c<sub>vapeur</sub>, différents.
- **Signe** : Q > 0, énergie **reçue** par le système (il chauffe) ; Q < 0, énergie **cédée** (il refroidit).
- **Série** : Q pour un chauffage ou un refroidissement, avec conversions g → kg et kJ → J.
  
  Erreurs : T<sub>i</sub> − T<sub>f</sub> inversé, mauvais c (celui de l'autre état), températures négatives (0 − (−23) = 23).

### Module 4 : Énergie et changement d'état

- **Formule** : E (ou Q) = m × L (E en J, m en kg, L chaleur latente en J·kg⁻¹ ; aussi kJ·kg⁻¹, J·g⁻¹).
- **Pendant un changement d'état d'un corps pur, la température reste constante.**
- **Signe** : L > 0 pour fusion, vaporisation, sublimation ; L < 0 pour les transformations inverses.
- **Série** : énergie de fusion, de vaporisation, de solidification (négative), conversions d'unités de L.

### Module 5 : La méthode du schéma des étapes (module spécial)

**Cours**, puis entraînement. Voir la section suivante.

### Module 6 : Exercices

Voir plus bas.

## Module spécial : « Schéma des étapes » (outil + cours du module 5)

**Méthode du professeur** (corrections des ex. 14 et 15) : avant tout calcul, on dessine le schéma.
- **Bulles successives** : chaque bulle porte l'**état physique** (glace, eau, gaz…) et la **température** (et la pression si elle n'est pas atmosphérique), de l'état de départ à l'état final, en passant par les températures intermédiaires.
- **Flèches** : chaque flèche entre deux bulles est **une étape**, notée Q<sub>1</sub>, Q<sub>2</sub>…
  - soit un **changement de température** dans un même état, Q = m c<sub>état</sub> (T<sub>f</sub> − T<sub>i</sub>) ;
  - soit un **changement d'état à température fixe**, Q = m L.
- **Énergie totale** : Q = Q<sub>1</sub> + Q<sub>2</sub> + … ; son signe dit si le système reçoit ou cède de l'énergie.

**But pédagogique.** L'élève ne doit plus jamais chercher « la » formule. Il découpe la transformation en étapes, chacune avec sa formule, et ne se trompe plus de c (celui de l'état de la bulle) ni de L (celui de la transition de la flèche), ni de signe.

**Forme de l'outil** (`perso`, plusieurs exemplaires, chaîne horizontale qui passe à la verticale sur téléphone, comme `SCH.chaine` de `transport-electricite/modules/schemas.js`) :

1. **Construire le schéma.** L'élève choisit l'état et la température de départ, puis ajoute des bulles jusqu'à l'état final :
   - pour chaque bulle : état (solide / liquide / gaz) et température ;
   - les températures de changement d'état (0 °C, 100 °C à pression atmosphérique, ou celle de l'énoncé) sont proposées en étiquettes.
   
   Contrôle : un changement d'état se fait à température fixe (deux bulles de même température et d'états différents) ; un changement de température se fait sans changer d'état. Diagnostics ciblés, par exemple :
   - « la glace ne peut pas dépasser 0 °C : il faut d'abord la faire fondre » ;
   - « entre ces deux bulles, l'état change : la température doit rester la même ».
2. **Nature de chaque flèche** : « changement de température » ou « changement d'état (lequel ?) ».
3. **Formule et données de chaque flèche** : choix entre m c ΔT et m L, puis le bon c ou le bon L parmi les données de l'énoncé, puis le calcul de Q<sub>i</sub> (champ numérique, signe compris).
4. **Somme** Q = ΣQ<sub>i</sub> et interprétation : reçue ou cédée.

**Cheminement** (exemples puis « À toi », du plus simple au plus long) :

1. une seule étape (Q = m c ΔT, puis Q = m L) ;
2. deux étapes : le dégivrage du bac blanc (glace −10 °C → glace 0 °C → eau 0 °C) ;
3. quatre étapes : ex. 14 (glace −23 °C → glace 0 °C → eau 0 °C → eau 100 °C → vapeur 100 °C) ;
4. refroidissement avec énergies négatives : ex. 15 (gaz 70 °C → gaz 49 °C → liquide 49 °C → liquide 30 °C, à 18 bar) ;
5. séries aléatoires : corps (eau, éthanol, R22…), températures, masses, chauffage ou refroidissement.

Dans les exercices, chaque exercice à étapes commence par ce schéma, comme les schémas de `transport-electricite`.

## Exercices (ordre de la correction)

**Ex. 13 p. 146** :
- a) 0 °C ;
- b) liaisons hydrogène ;
- c) Q = m L = 500 g × (−334 J·g⁻¹) ≈ −1,67 × 10⁵ J (on peut la noter Q ou E).

**Ex. 14 p. 146** (m = 250 g, de −23 °C à la vapeur, schéma à 5 bulles) :
- Q<sub>1</sub> = 0,250 × 1970 × 23 ≈ 1,13 × 10⁴ J ;
- Q<sub>2</sub> = 0,250 × 334 × 10³ ≈ 8,35 × 10⁴ J ;
- Q<sub>3</sub> = 0,250 × 4180 × 100 ≈ 1,05 × 10⁵ J ;
- Q<sub>4</sub> = 0,250 × 2257 × 10³ ≈ 5,64 × 10⁵ J ;
- Q ≈ 7,64 × 10⁵ J.

Le manuel donne « c<sub>glace</sub> = 1970 » et « c<sub>eau vapeur</sub> = 2090 » ; L<sub>fus</sub> = 334 kJ·kg⁻¹, unité corrigée à la main. Garde les données de l'énoncé.

**Ex. 10 p. 145** :
- a) point triple : les trois états coexistent, 611 Pa et 273,16 K (la correction écrit 610,6 Pa) ;
- point critique : fin de la courbe de vaporisation, plus de distinction liquide / gaz, P<sub>c</sub> ≈ 22,1 MPa et **T<sub>c</sub> ≈ 647 K (374 °C). La correction écrit « 374,15 K » : erreur à corriger** ;
- b) zones à placer ;
- c) fusion 0 °C (273,15 K), ébullition 100 °C (373,15 K) à 101,3 kPa.

**Ex. 15 p. 146** (R22) :
- a) pression par rapport à la pression atmosphérique ;
- b) −40 °C ;
- c) elle augmente avec la pression ;
- d) 8 bar ;
- e) schéma à 4 bulles :
  - Q<sub>1</sub> = 2,00 × 662 × (49 − 70) ≈ −2,78 × 10⁴ J ;
  - Q<sub>2</sub> = 2,00 × (−233,7 × 10³) ≈ −4,67 × 10⁵ J ;
  - Q<sub>3</sub> = 2,00 × 1257 × (30 − 49) ≈ −4,78 × 10⁴ J ;
  - Q ≈ −5,43 × 10⁵ J : le fluide a cédé 5,43 × 10⁵ J au milieu extérieur.

**Ex. 7 p. 145** : représentation 1.

**Ex. 8 p. 145** : 1 liquide, 2 solide, 3 gazeux.

**Ex. 17 p. 147** (PAC) :
- a) Q<sub>f</sub> et W<sub>e</sub> reçues, Q<sub>c</sub> cédée ;
- b) Q<sub>f</sub> + W<sub>e</sub> − Q<sub>c</sub> = 0 ;
- c) Q = 1000 × 560 × 4,18 × 10³ × 11 ≈ 2,6 × 10¹⁰ J ;
- d) Q<sub>c</sub> = 2,6 × 10¹⁰ J ;
- e) Q<sub>f</sub> ≈ 1,8 × 10¹⁰ J.

Schéma des transferts de la PAC à compléter (flèches et noms).

**Bac blanc : dégivrage** (exercice « Bac blanc ») :
1. m = 920 × 5 × 0,5 × 10⁻³ = 2,3 kg ;
2. E<sub>1</sub> = 2,3 × 2090 × 10 ≈ 4,81 × 10⁴ J ;
3. E<sub>2</sub> = 2,3 × 333 × 10³ ≈ 7,66 × 10⁵ J ;
4. E ≈ 8,14 × 10⁵ J ;
5. M<sub>1</sub> ampèremètre, M<sub>2</sub> voltmètre ;
6. bornes COM (schéma à compléter) ;
7. incertitude, suivre la correction : 0,5 % × 28,02 + 4 × 0,01 ≈ 0,18 V ;
8. chaîne : électrique → résistance → thermique ;
9. P = 5 × 250 = 1250 W ;
10. Δt = 8,14 × 10⁵ / 1250 ≈ 651 s ≈ 10,9 min (la correction écrit 10,8 min), réaliste.

La donnée « c<sub>el</sub> = 418 J·kg⁻¹·K⁻¹ » du sujet est fausse (4180) mais inutilisée : écris 4180.
