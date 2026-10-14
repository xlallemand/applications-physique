# Chapitre 9 : Statique des fluides (prompt de génération)

Lis d'abord `docs/prompts-sti2d/00-commun.md` (sources, charte, structure, livraison).

## Application

- Dossier `statique-fluides/`, nom « Chapitre 9 : Statique des fluides », `data-matiere="physique"`, préfixe `sf`.
- Portail : desc « Pression et force pressante, pression relative, principe fondamental de l'hydrostatique. » ; dessin d'en-tête : nouveau dessin « château d'eau et niveaux » dans `hero.js`, ou `formules:physique`.

## Sources (`TSTI2D/09- Statique des fluides/`)

| Fichier | Contenu | À lire |
|---|---|---|
| `Chap09-Cours complete.pdf` (2 p.) | Cours tapé complété à la main (exemples résolus) | Non : résumé ci-dessous. Page 2 si tu veux reprendre les schémas (château d'eau, maison, combles) |
| `Chap09-Exercices.pdf` (2 p.) | Ex. 7, 8, 11 p. 119 ; 14 p. 120 ; 21, 18 p. 121 ; 15 p. 120 ; 22 p. 121 | Oui (figures du cric, du réservoir à deux liquides, du baromètre) |
| `Chap09-Correction-Exercices.pdf` (4 p.) | Corrections manuscrites | Oui |
| `Chap09-Exercice supplementaire.pdf` (2 p.) | Ex. 20 p. 120 (chalet) + corrigé tapé | Oui |

Ignore les `.docx` et `Chap09-Cours.pdf` (version non complétée).

## Contenu du cours

### Module 1 : Pression et force pressante

- **Origine de la pression** : dans un fluide (liquide ou gaz), les molécules sont en agitation permanente ; leurs chocs sont à l'origine de la pression.
- **Unités** :
  - Pa (unité SI) ;
  - **1 bar = 10⁵ Pa** ;
  - 1 hPa = 100 Pa ;
  - pression atmosphérique ≈ 1 bar = 10⁵ Pa = 1000 hPa ;
  - 1 atm = 1 bar dans les exercices.
- **Formule** : P = F / S (P en Pa, F force pressante en N, S en m²). La force pressante est perpendiculaire à la paroi.
- **Exemples** :
  1. bécher de 0,1 kg sur la table : F = m g = 0,981 N, S = 30 cm² = 30 × 10⁻⁴ m², P ≈ 327 Pa ;
  2. fond de piscine de 200 m² à 1,5 bar : F = P × S = 3,0 × 10⁷ N, soit le poids de 3000 tonnes.
- **Conversions de surface** : cm² → m² (× 10⁻⁴), mm² → m² (× 10⁻⁶), dm² → m² (× 10⁻²).
  
  Outil `perso` : tableau de conversion des surfaces. Lien vers `conversions/` (module « carré et cube »).
- **Série** : P = F/S, F = P × S avec conversions (bar, hPa, cm², mm²).
  
  Erreurs à diagnostiquer : cm² converti comme des cm (× 10⁻²), bar non converti.

### Module 2 : Pression absolue et pression relative

- **Pression absolue** : mesurée par rapport au vide (0 Pa).
- **Pression relative** : P<sub>rel</sub> = P<sub>abs</sub> − P<sub>atm</sub>. C'est celle des **canalisations** et des **pneus** (manomètre).
- **Série** : passer de l'une à l'autre, situations concrètes (pneu à 2,2 bar).

### Module 3 : Principe fondamental de l'hydrostatique

- **Énoncé** : dans un même liquide incompressible au repos, **P<sub>point bas</sub> = P<sub>point haut</sub> + ρ g h**.
  - ρ en kg·m⁻³ (ρ<sub>eau</sub> = 1000) ;
  - g = 9,8 m·s⁻² ;
  - h = z<sub>haut</sub> − z<sub>bas</sub> en m.
- **Points de même altitude dans le même liquide** : même pression.
- **Très important** (note rouge) : à la surface libre d'un liquide à l'air libre (château d'eau, piscine), **P = P<sub>atm</sub> = 10⁵ Pa**. Dans le vide, P = 0 Pa (baromètre).
- **Méthode avec schéma (obligatoire)**, celle des trois exemples du cours :
  1. repérer sur le schéma le **point haut** et le **point bas** ;
  2. noter la pression connue (souvent P<sub>atm</sub> à la surface) et la hauteur h entre les deux points ;
  3. écrire P<sub>bas</sub> = P<sub>haut</sub> + ρ g h ;
  4. isoler l'inconnue :
     - P<sub>haut</sub> = P<sub>bas</sub> − ρ g h ;
     - h = (P<sub>bas</sub> − P<sub>haut</sub>) / (ρ g).
- **Outil schéma** : schéma (château d'eau et maison, combles, piscine, réservoir) où l'élève fait glisser les étiquettes « point haut », « point bas », « P<sub>atm</sub> », la valeur de h et les pressions connues. Les cases vides sont les inconnues. Puis il choisit la formule à utiliser (P<sub>bas</sub> = …, P<sub>haut</sub> = …, h = …).
  
  Inspire-toi de `SCH.slot` et de la partie `'schema'` de `transport-electricite/modules/te.js`.
- **Exemples traités** (ρ = 1000, g = 9,8, P<sub>atm</sub> = 10⁵ Pa) :
  1. **point bas** : maison 50 m sous la surface du château d'eau, P<sub>M</sub> = 10⁵ + 1000 × 9,8 × 50 = 5,9 × 10⁵ Pa ;
  2. **point haut** : combles 8 m au-dessus du réducteur réglé à 3 bar, P<sub>C</sub> = 3 × 10⁵ − 1000 × 9,8 × 8 ≈ 2,2 × 10⁵ Pa (3 bar à convertir en Pa) ;
  3. **hauteur** : pour 3 bar dans la maison, h = (3 × 10⁵ − 1 × 10⁵) / (1000 × 9,8) ≈ 20,4 m. Garde le « OU mieux : h = (P<sub>M</sub> − P<sub>C</sub>) / (ρ g) ».
- **Calcul de tête** (remarque du cours) : avec ρ = 1000 et g = 10, tous les 10 m d'eau on gagne 1 bar.
  
  À toi : estimations rapides.
- **Série** :
  - pression au fond (absolue et relative) ;
  - pression en un point haut ;
  - hauteur nécessaire ;
  - deux liquides superposés (interface puis fond) ;
  - liquide autre que l'eau (ρ donné).

### Module 4 : Applications (presse et cric hydrauliques, baromètre)

- **Transmission de la pression dans un liquide** : même pression en A et B à la même altitude. F<sub>2</sub> = P × S<sub>2</sub> est bien plus grande que F<sub>1</sub> si S<sub>2</sub> ≫ S<sub>1</sub> (cric). Surface d'un piston : S = π R².
- **Baromètre de Torricelli** : P<sub>A</sub> = 0 (vide), P<sub>atm</sub> = ρ<sub>Hg</sub> g h ; le « mm de mercure » est une unité de pression.
- **Série** : force sur le grand piston, rayon nécessaire, hauteur de mercure.

## Exercices (ordre et numérotation de la feuille)

Données de la feuille : P<sub>atm</sub> = 1 bar = 10⁵ Pa ; g = 9,81 (la feuille écrit « N·m⁻² » : c'est N·kg⁻¹ ou m·s⁻²).

**Ex. 7 p. 119** :
- a) 2,0 × 10³ / 45 × 10⁻⁵ ≈ 4,4 × 10⁶ Pa ;
- b) 15 / 20 × 10⁻⁴ = 7,5 × 10³ Pa ;
- c) 20 × 10³ / 33 × 10⁻⁶ ≈ 6,1 × 10⁸ Pa.

**Ex. 8 p. 119** :
- a) 4,8 × 10² N ;
- b) 1500 hPa × 4 cm², donc F = 60 N ;
- c) 0,85 × 10⁵ × 0,55 ≈ 4,7 × 10⁴ N.

**Ex. 11 p. 119** : surface de contact bien plus petite, donc pression bien plus grande pour la même force.

**Ex. 14 p. 120** :
- a) F = 1,013 × 10⁵ × 2,5 ≈ 2,53 × 10⁵ N ;
- b) m = F / g ≈ **2,58 × 10⁴ kg ≈ 25,8 t**. La correction écrit 2,56 × 10⁴ kg : à corriger ;
- c) la vitre subit la même force sur ses deux faces.

**Ex. 21 p. 121** (cric, R<sub>1</sub> = 5,0 mm, R<sub>2</sub> = 50 mm, F<sub>1</sub> = 150 N) :
- S<sub>A</sub> = 7,85 × 10⁻⁵ m², p<sub>A</sub> ≈ 1,9 × 10⁶ Pa ;
- p<sub>B</sub> = p<sub>A</sub> (même altitude) ;
- F<sub>2</sub> ≈ 15 000 N (100 fois F<sub>1</sub>, car S<sub>2</sub> / S<sub>1</sub> = 100) ;
- multiplier la force ;
- 1,5 × 10⁴ N > 9,81 × 10³ N : suffisant ;
- camion de 12 t : diminuer S<sub>A</sub>, augmenter S<sub>B</sub> ou F<sub>1</sub>.

**Ex. 18 p. 121** (piscine, profondeur 1,9 m) :
- p<sub>0</sub> = 10⁵ Pa ;
- p<sub>1</sub> = 10⁵ + 1000 × 9,81 × 1,9 ≈ 1,19 × 10⁵ Pa ;
- p<sub>2</sub> = p<sub>1</sub> − p<sub>0</sub> ≈ 1,9 × 10⁴ Pa.

**Ex. 15 p. 120** (huile ρ = 800 sur eau, h<sub>1</sub> = 50 cm, h<sub>2</sub> = 1,0 m) :
- surface : 10⁵ Pa ;
- l'huile est au-dessus (moins dense), interface : 1,04 × 10⁵ Pa ;
- fond : 1,14 × 10⁵ Pa.

Schéma à compléter : deux couches, deux « point haut / point bas » successifs.

**Ex. 22 p. 121** (Torricelli, ρ<sub>Hg</sub> = 13 600) :
- p<sub>B</sub> = p<sub>C</sub> (même altitude) ;
- p<sub>A</sub> = 0 Pa (« à retenir ») ;
- p<sub>B</sub> = ρ g h ;
- h = 760 mm donne P<sub>atm</sub> ≈ 101 396 Pa ;
- 960 hPa donne h ≈ 0,720 m = 720 mm de mercure.

**Ex. 20 p. 120** (exercice supplémentaire, chalet, corrigé tapé) :
- p<sub>0</sub> = 920 hPa ;
- Δp = 9,8 × 10³ Pa ;
- p<sub>2</sub> = 920 × 10² + 9,8 × 10³ + 1000 × 9,81 × 60 ≈ 6,9 × 10⁵ Pa, soit 6,9 bar ;
- étage (4 m plus haut) : p<sub>3</sub> ≈ 6,5 × 10⁵ Pa > 2 bar, donc il faut un réducteur ;
- consommation 162 × 4 = 648 L < 2000 L ;
- eau de pluie (WC, arrosage, nettoyage, lessive) 83 × 4 = 332 L.
