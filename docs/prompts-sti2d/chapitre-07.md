# Chapitre 7 : Théorème de l'énergie cinétique (prompt de génération)

Lis d'abord `docs/prompts-sti2d/00-commun.md` (sources, charte, structure, livraison).

## Application

- Dossier `energie-cinetique/`, nom « Travail et énergie cinétique », `data-matiere="physique"`, préfixe `ec`.
- Portail : desc « Frottements, travail d'une force, énergie cinétique et théorème de l'énergie cinétique. » ; dessin d'en-tête : `cinematique`, ou un nouveau dessin « wagon tiré » dans `hero.js`.

## Sources (`TSTI2D/07- Theoreme de l'energie cinetique/`)

| Fichier | Contenu | À lire |
|---|---|---|
| `Chap07-Cours-Exercices complete.pdf` (3 p.) | Cours + exemples 1 à 5 résolus à la main | Non : résumé ci-dessous. Pages 2-3 seulement si tu veux recopier fidèlement les schémas des exemples |
| `Chap07-Activite2_travail_force.pdf` (2 p.) | **Activité « travail d'une force »**, base du simulateur | Page 1 en image (dessin du wagon et des 5 personnages à refaire en SVG) ; le reste en `pdftotext` (moins cher que le `.docx`, qui donne le même texte sans les figures) |
| `Chap07-Activite1.pdf` (1 p.) | Activité « force de résistance aérodynamique » (5 documents) | Oui, 1 page |
| `Chap07-Exercices supplem.pdf` (2 p.) | Ex. 18 et 19 p. 98, corrigés tapés page 2 | Oui |

Il n'y a pas d'autre fiche d'exercices : les exemples 1 à 5 du cours en tiennent lieu.

## Contenu du cours

### Module 1 : Forces de frottement

- **Frottements solides** : R⃗ = R⃗<sub>N</sub> + f⃗ (lien avec le chapitre 6).
- **Frottements fluides** (air, liquide) : la **traînée** f<sub>x</sub> = ½ × ρ × v² × S × C<sub>x</sub>. Cette formule est toujours donnée.
  - Unités, à souligner : f<sub>x</sub> en N, ρ en kg·m⁻³, v en m·s⁻¹, S (maître-couple) en m², C<sub>x</sub> sans unité.
  - Notes : ρ<sub>eau</sub> = 1000 kg/m³, ρ<sub>air</sub> ≈ 1 kg/m³.
- **Avion** : la force de l'air comprend la traînée et la **portance** (différence de pression entre le dessus et le dessous de l'aile).
- **Activité (page `simulation` ou cours guidé)** : Activité 1, docs 1 à 5.
  - Origine de la portance.
  - La traînée n'est **pas** proportionnelle à v : la courbe du doc. 5 est une parabole, f varie comme v².
  - A, B, C = S, C<sub>x</sub>, v.
  - Pour diminuer la traînée : plus petit maître-couple, forme profilée (C<sub>x</sub> faible).
- **Série** :
  - calcul de f<sub>x</sub> avec conversions (km/h, cm²) ;
  - effet de doubler v (×4) ou S (×2) ;
  - forme ayant le plus petit C<sub>x</sub>.

### Module 2 : Travail d'une force (simulateur, puis cours)

- **Définition** : le travail d'une force est l'**énergie transmise** à un solide par une force au cours d'un déplacement, en **joules**.
- **Formule** : W<sub>AB</sub>(F⃗) = F × AB × cos α (F constante en N, AB en m, α angle entre F⃗ et AB⃗).
  
  Note : régler la calculatrice en degrés ou en radians selon l'unité de l'angle. Petit cercle trigonométrique : cos 0 = 1, cos 90° = 0, cos 180° = −1.
- **Signe du travail** :
  - W > 0 : travail **moteur**, il fait augmenter la vitesse ;
  - W < 0 : travail **résistant**, il la fait diminuer ;
  - W = 0 : travail nul.
- **Travail du poids** : W<sub>AB</sub>(P⃗) = m g h si on descend de h ; −m g h si on monte.
- **Force perpendiculaire au déplacement** : son travail est **toujours nul**. Note manuscrite : « important, pas besoin de calcul ; écrire : la force est ⊥ au déplacement donc W = 0 ».
- **Série** :
  - W pour F, AB, α aléatoires (dont 0°, 90°, 180°, 60°, 120°) ;
  - moteur, résistant ou nul ;
  - travail du poids à la montée et à la descente ;
  - travail de R⃗<sub>N</sub>.
  
  Erreurs à diagnostiquer : calculatrice en radians, signe oublié à 180°, h confondu avec AB.

### Module 3 : Énergie cinétique

- **Formule** : E<sub>c</sub> = ½ m v² (J, kg, m·s⁻¹).
- **Conversion** km/h → m/s (÷ 3,6), à faire **avant** d'élever au carré. Lien vers `conversions/`.
- **Série** : E<sub>c</sub> d'une voiture, d'un camion, d'une balle ; v à partir de E<sub>c</sub> (v = √(2E<sub>c</sub>/m)) ; effet du doublement de v.

### Module 4 : Théorème de l'énergie cinétique

- **Énoncé** : ΔE<sub>c</sub> = E<sub>c</sub>(B) − E<sub>c</sub>(A) = W<sub>AB</sub>(F⃗<sub>1</sub>) + W<sub>AB</sub>(F⃗<sub>2</sub>) + …, c'est-à-dire ½ m v<sub>B</sub>² − ½ m v<sub>A</sub>² = Σ W.
- **Usage** :
  - W connu : on calcule ΔE<sub>c</sub>, donc la variation de vitesse ;
  - v<sub>initiale</sub> et v<sub>finale</sub> connues : on calcule W, donc la force ou la distance.
- **Méthode avec schéma** (celle de toutes les corrections) :
  1. schéma avec A, B, le déplacement, chaque force et son angle α avec AB⃗, et les données (v<sub>A</sub>, v<sub>B</sub>, h ou AB) ;
  2. écrire le théorème ;
  3. remplacer chaque travail. Les forces ⊥ au déplacement donnent 0 ; à 180°, cos = −1 ;
  4. application numérique ;
  5. isoler l'inconnue.
  
  Note : « au sommet, v<sub>B</sub> = 0 : important, à savoir ».
- **Outil schéma (obligatoire)**. L'élève :
  - place les données de l'énoncé sur le schéma (v<sub>A</sub>, v<sub>B</sub>, AB ou h, m) par glisser-déposer ;
  - choisit pour chaque force l'angle α (0°, 90°, 180°) ;
  - obtient l'expression de chaque travail (« 0 car ⊥ », « f × AB × (−1) »).
  
  Inspire-toi du schéma à compléter de `transport-electricite` (`SCH.slot`, partie `'schema'`).
- **Exemples du cours**, à reprendre comme exemples traités puis comme « À toi » à valeurs changées. Valeurs de la correction vérifiées :
  1. pomme lâchée de 10 m (m = 100 g, g = 10) : v<sub>B</sub> = √200 ≈ 14,1 m/s. Garde aussi la version littérale v<sub>B</sub> = √(2 g h) du « OU » ;
  2. pomme lancée à 10 m/s vers le haut : h = 5 m ;
  3. voiture de 900 kg à 50 km/h, arrêt sur 10 m : ΔE<sub>c</sub> = −8,68 × 10⁴ J, f ≈ 8,7 × 10³ N ;
  4. voiture de 800 kg à 70 km/h, f = 9,0 × 10³ N : AB ≈ 16,8 m ;
  5. voiture de 800 kg, de 0 à 20 km/h sur 12 m, F<sub>m</sub> = 1,3 × 10³ N : 1,23 × 10⁴ = 1,3 × 10³ × 12 − 12 f, d'où f ≈ 271 N.
- **Série** : vitesse finale après une chute, hauteur atteinte, force de freinage, distance d'arrêt, force de frottement au démarrage (valeurs aléatoires).

## Module spécial : simulateur « Travail d'une force » (page `simulation` en tête du module 2)

**But pédagogique.** Comprendre que le travail est **l'énergie fournie (ou retirée) par la force**, et qu'il dépend de trois grandeurs : la **valeur de la force**, la **distance** sur laquelle elle s'applique et l'**angle** entre la force et le déplacement. Faire ressortir les cas particuliers :
- α = 0° : travail **moteur et maximal** ;
- α = 90° : travail **nul** ;
- α = 180° : travail **résistant et maximal en valeur absolue** (perte d'énergie maximale).

Il remplace l'animation en ligne de l'activité (phyanim) : même déroulé, tout dans l'application.

**Cheminement**, en quatre étapes (parties de la page, chacune débloquée par la précédente) :

1. **Le wagon** (partie I de l'activité). Scène SVG : wagon sur rails de A vers B, cinq personnages tirant avec des cordes à des angles différents.

   | Personnage | Angle | Réplique | Travail |
   |---|---|---|---|
   | F<sub>1</sub> | 0° | « C'est moi le plus efficace ! » | moteur |
   | F<sub>2</sub> et F<sub>3</sub> | aigus | « Je fais ce que je peux ! » | moteur |
   | F<sub>4</sub> | 180° | « Je résisterai ! » | résistant |
   | F<sub>5</sub> | 90° | « Je ne sers à rien. » | nul |

   Vérifie les positions sur la page 1 de l'activité. L'élève fait glisser les répliques dans les bulles, classe chaque travail, désigne celui qui fournit le plus de travail. Diagnostics ciblés.
2. **Le simulateur** : un solide se déplace de A à B ; on règle :
   - F (curseur, 0 à 20 N par pas de 1 N) ;
   - AB (curseur ou point B glissable, 0 à 2 m par pas de 0,1 m) ;
   - α (curseur de −180° à 180° par pas de 5°, avec un aimant sur 0°, 45°, 90°, 135°, 180°, −90°).
   
   Affichage en direct :
   - la flèche F⃗ et l'angle α marqué ;
   - la **projection de F⃗ sur le déplacement** (F cos α), en pointillés ;
   - W en joules (deux chiffres significatifs) ;
   - l'étiquette « moteur / nul / résistant » (texte, pas seulement couleur) ;
   - une jauge horizontale de −F × AB à +F × AB qui montre W comme énergie fournie (à droite) ou retirée (à gauche) ;
   - un chariot animé qui accélère ou ralentit selon le signe de W.
   
   Trois boutons « α = 0° », « α = 90° », « α = 180° » placent les cas particuliers, chacun avec son encadré `.cle`.
   
   L'élève **remplit les trois tableaux de la question 7** : F variable ; AB variable ; α = 45°, 90°, 135°, 180°, −90°. Il lit W sur le simulateur et le saisit, avec vérification.
3. **Quelle formule ?** (question 8). Choix parmi :
   - a. F × AB ;
   - b. F / AB ;
   - c. F × AB × α ;
   - d. F × AB × cos α ;
   - e. F × AB × sin α.
   
   Diagnostic à partir des tableaux. Par exemple « avec sin α, le travail serait nul à 0° : regarde ton tableau ». Réponse d.
4. **Le chemin suivi** (partie III). Quatre trajets de A à B avec F⃗ constante (10 N, α = 0° par rapport à AB) :
   - trajet 1 : droit ;
   - trajet 2 : en zigzag ;
   - trajet 3 : monter, aller à l'horizontale, descendre ;
   - trajet 4 : un autre détour.
   
   W s'accumule pendant l'animation : même total sur tous les trajets. Sur le trajet 3, l'élève explique chaque partie : à la montée et à la descente, F⃗ est ⊥ au déplacement, donc W = 0 ; à l'horizontale, α = 0.

**Bilan** (« ✍ Complète ton cours ») :
- W<sub>AB</sub>(F⃗) = F × AB × cos α, avec le schéma (F⃗, A, B, α) ;
- en joules ;
- moteur, nul, résistant ;
- il ne dépend pas du chemin pour une force constante.

Le simulateur doit fonctionner au doigt (curseurs larges, ≥ 46 px) et en plusieurs exemplaires si on le réutilise comme « À toi ».

## Exercices

- **Exemples 1 à 5 du cours** : déjà dans le cours, ne les duplique pas.
- **Ex. 18 p. 98** (camion de 33,0 t à 90,0 km/h, arrêt sur 60,0 m) :
  - a) et b) poids et réaction ⊥ au déplacement, donc W = 0 ;
  - c) E<sub>c,A</sub> = 1,03 × 10⁷ J ;
  - d) E<sub>c,B</sub> = 0 ;
  - e) W(f⃗) = −1,03 × 10⁷ J ;
  - f) résistant ;
  - g) f = 1,72 × 10⁵ N.
  
  Commence par l'outil schéma.
- **Ex. 19 p. 98** (curling, m = 18,52 kg, v<sub>i</sub> = 2,8 m/s, ℓ = 27,5 m, g = 9,8) :
  - a) bilan P⃗, N⃗, f⃗ ;
  - b) W(P⃗) = W(N⃗) = 0 ;
  - c) f = μ N ;
  - d) W(f⃗) = −μ m g ℓ, résistant ;
  - e) E<sub>c,i</sub> ≈ 73 J, E<sub>c,f</sub> = 0 ;
  - f) 0 − E<sub>c,i</sub> = −μ m g ℓ ;
  - g) μ = 72,6 / (18,52 × 9,8 × 27,5) ≈ **0,015**. Le corrigé écrit 0,014 : arrondi trop tôt.
