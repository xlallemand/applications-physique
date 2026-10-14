# Chapitre 5 : Flux et transferts thermiques (prompt de génération)

Lis d'abord `docs/prompts-sti2d/00-commun.md` (sources, charte, structure, livraison).

## Application

- Dossier `transferts-thermiques/`, nom « Flux et transferts thermiques », `data-matiere="physique"`, préfixe `tt`.
- Portail : desc « Kelvin, modes de transfert, flux thermique, résistance thermique d'une paroi. » ; dessin d'en-tête : `formules:physique`, ou un nouveau dessin « paroi et flux » dans `hero.js`.

## Sources (`TSTI2D/05- Transferts thermiques/`)

| Fichier | Contenu | À lire |
|---|---|---|
| `Chap05-Cours.pdf` (1 p.) | « À retenir » tapé, pas de version complétée | Non : résumé ci-dessous. La figure des trois modes de transfert (main, feu, tige) est à refaire en SVG si tu veux t'en inspirer |
| `Chap05-Exercices.pdf` (2 p.) | Manuel : ex. 6, 7, 8 et 13 à 19 p. 74-77 | Oui (données, tableaux de conductivités, figures des ex. 13 et 19) |
| `Chap05-Exercices correction.pdf` (7 p.) | Corrections manuscrites | Oui |

## Contenu du cours

### Module 1 : Température et modes de transfert

- **Échelles de température** : T (K) = θ (°C) + 273 ; 0 K = −273 °C (deux axes gradués côte à côte, à refaire en SVG).
  
  Une **différence** de température a la même valeur en K et en °C.
- **Trois modes de transfert** :
  - **conduction** : dans un solide, de proche en proche (tige chauffée) ;
  - **convection** : déplacement d'un fluide (air chaud qui monte) ;
  - **rayonnement** : sans support matériel (feu, Soleil).
- Le transfert thermique va **toujours du chaud vers le froid**.
- **Série** : conversions K ↔ °C, mode de transfert d'une situation, sens du transfert (y compris quand l'extérieur est plus chaud).

### Module 2 : Flux thermique

- **Définition** : le flux thermique Φ est la **puissance thermique** qui traverse une paroi, en W.
- **Formule** : Φ = Q / Δt (Q en J, Δt en s).
- **Conversions** :
  - 1 h 15 = 3600 + 15 × 60 = 4500 s ;
  - kJ, MJ ;
  - Q = Φ × Δt en J ou en Wh (Φ en W, Δt en h).
- **Série** : Φ à partir de Q et Δt, Q à partir de Φ et Δt (J et kWh).
  
  Erreur à diagnostiquer : durée non convertie en s.

### Module 3 : Résistance thermique d'une paroi

- **Formules** :
  - Φ = (T<sub>int</sub> − T<sub>ext</sub>) / R<sub>th</sub>, en général Φ = ΔT / R<sub>th</sub> avec ΔT = T<sub>chaud</sub> − T<sub>froid</sub> ;
  - R<sub>th</sub> = e / (λ × S) en K·W⁻¹ (e en m, S en m², λ conductivité thermique en W·m⁻¹·K⁻¹).
- **Raisonnements** :
  - plus λ est petit, plus le matériau est isolant ;
  - R augmente quand l'isolation est meilleure, et alors Φ diminue ;
  - R est proportionnelle à e : doubler e double R.
- **Isoler une grandeur** :
  - R = ΔT / Φ ;
  - λ = e / (R S) ;
  - e = R λ S.
  
  Lien vers `equations-en-physique/`.
- **Outil `perso` (exploration)** : une paroi dont on règle e, λ (liste de matériaux), S et ΔT. R et Φ s'affichent, la flèche du flux va du chaud vers le froid avec une épaisseur proportionnelle à Φ.
  
  À toi : « double e : que devient Φ ? » et autres questions de ce type.
- **Série** : calculs de R, Φ, λ, e avec conversions (cm, mm → m ; cm² → m²) ; matériau le plus isolant d'un tableau.
  
  Erreurs : e en cm, ΔT mal calculé avec des températures négatives (−3 − (−20) = 17), λ et R confondus pour juger de l'isolation.

### Module 4 : Parois composées (résistances en série)

- **Formule** : R = R<sub>1</sub> + R<sub>2</sub> + R<sub>3</sub> (couches accolées), chaque R<sub>i</sub> = e<sub>i</sub> / (λ<sub>i</sub> S) avec la **même** surface S.
- **Méthode avec schéma** (comme les corrections des ex. 14 et 18) : on dessine la paroi en couches, avec pour chacune son épaisseur et son λ, puis T<sub>int</sub>, T<sub>ext</sub> et S. On calcule chaque R<sub>i</sub>, puis R totale, puis Φ.
- **Outil schéma (obligatoire)** : schéma de paroi en couches où l'élève **place les données de l'énoncé** par glisser-déposer : e et λ de chaque couche, températures de chaque côté, S. Les cases restées vides sont les inconnues. Il choisit ensuite le sens du flux.
  - Inspire-toi de `SCH.chaine` / `SCH.slot` et de la partie `'schema'` de `transport-electricite/modules/te.js`.
  - Ce schéma ouvre les exercices 13, 14, 18, 19 et sert d'exemple dans le cours.
- **Double vitrage** (ex. 19) : verre + air + verre ; l'air immobile est très isolant.
- **Série** : R totale de 2 ou 3 couches, flux à travers un mur isolé, épaisseur d'isolant à ajouter pour atteindre une R donnée.

## Exercices (même numérotation que le manuel, p. 74-77)

**Ex. 6** :
1. Φ = (−3,0 − (−20)) / 0,022 = 773 W ;
2. du chaud (intérieur) vers le froid ;
3. R<sub>2</sub> = 2 R<sub>1</sub> = 0,044 K·W⁻¹ ;
4. R augmente, Φ diminue ;
5. R<sub>neige</sub> = 0,50 / (0,100 × 10) = 0,5, donc R<sub>3</sub> = 0,522 K·W⁻¹ ;
6. le mur glace + neige est plus isolant.

**Ex. 7** :
- a) 750 × 10³ / 4500 = 167 W ;
- b) 17 / 5,3 = 3,2 W ;
- c) R = 1,43 K·W⁻¹, Φ = 12 W.

**Ex. 8** (préciser le sens du flux) :
- a) 3,0 W ;
- b) 3,9 W, de l'extérieur vers l'intérieur ;
- c) 50 W ;
- d) R = 4 × 10⁻³ / (0,810 × 1,0) = 4,94 × 10⁻³ K·W⁻¹, Φ = 25 / 4,94 × 10⁻³ ≈ **5,1 × 10³ W**.
  
  **La correction manuscrite écrit « 50·10³ K·W⁻¹ » : la valeur et l'unité sont fausses.**

**Ex. 13** :
- transfert de l'intérieur vers l'extérieur, par conduction ;
- R<sub>poly</sub> = 5,1 × 10⁻² K·W⁻¹ ;
- R<sub>mur</sub> = 7,8 × 10⁻³ K·W⁻¹ ;
- R<sub>totale</sub> = 5,9 × 10⁻² K·W⁻¹ ;
- Φ = 20 / 5,9 × 10⁻² ≈ 340 W.

**Ex. 14** :
- R = 5,3 × 10⁻⁴ + 7,1 × 10⁻² ≈ 7,2 × 10⁻² K·W⁻¹ ;
- Φ = 12 / 7,2 × 10⁻² ≈ 167 W ;
- Q = 167 × 1800 ≈ 3,0 × 10⁵ J.

**Ex. 15** :
1. liège expansé (λ le plus faible) ;
2. R = 3 / 27,6 = 0,109 K·W⁻¹, λ = 0,040 / (0,109 × 1,6) ≈ 0,23 W·m⁻¹·K⁻¹, d'où le bois naturel ; e<sub>pin</sub> = R λ S ≈ 0,026 m = **26 mm**.

**Ex. 16** :
- a) 2,94 × 10⁶ / 600 = 4900 W ;
- b) 20 / 2,1 × 10⁻² = 952 W ;
- c) R = 20 / 2000 = 0,01 K·W⁻¹ ;
- d) le cuivre : il a le plus grand flux.

**Ex. 17** :
- λ<sub>Altuglas</sub> < λ<sub>verre</sub>, donc R<sub>Altuglas</sub> > R<sub>verre</sub> ;
- R<sub>verre</sub> = 6,7 × 10⁻³ K·W⁻¹ ;
- R<sub>Altuglas</sub> = 1,3 × 10⁻² K·W⁻¹ ;
- l'Altuglas est le meilleur isolant, même plus mince.

**Ex. 18** :
- a) S = 28,8 m², R = 1,40 × 10⁻³ + 0,116 + 6,04 × 10⁻³ ≈ 0,12 K·W⁻¹ ;
- b) la correction trouve R<sub>fibre</sub> ≈ 2,19 K·W⁻¹, d'où e = 2,19 × 0,050 × 28,8 ≈ 3,15 m, et conclut à « un problème dans les données de l'énoncé ».
  
  Garde cette conclusion. Ajoute une remarque : la valeur R = 2,2 de l'énoncé est en réalité une **résistance thermique surfacique**, R = e/λ en m²·K·W⁻¹, celle des étiquettes d'isolants. Avec elle, e<sub>fibre</sub> ≈ 0,050 × (2,2 − 0,040 − 0,174) ≈ 0,10 m.
  
  **À signaler au professeur dans le compte rendu.**
  
  Unité : la correction écrit « W·K⁻¹ », c'est K·W⁻¹.

**Ex. 19** (cotes en mm) : vitrage A = 3 verres de 4 mm + 12 mm d'air ; vitrage B = 2 verres de 4 mm + 16 mm d'air ; S = 2,0 m².
- R<sub>A</sub> ≈ 0,25 K·W⁻¹ et R<sub>B</sub> ≈ 0,32 K·W⁻¹, donc B isole mieux ;
- Φ<sub>A</sub> ≈ 88 W et Φ<sub>B</sub> ≈ 69 W, de l'intérieur vers l'extérieur ;
- sur 24 h : 7,6 × 10⁶ J (2,1 kWh) et 6,0 × 10⁶ J (1,7 kWh) ;
- simple vitrage de 4 mm : Φ ≈ 8,9 × 10³ W, soit 214 kWh par jour.

Recalcule ces valeurs : la correction arrondit R avant de diviser.
