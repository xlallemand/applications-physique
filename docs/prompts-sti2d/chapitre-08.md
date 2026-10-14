# Chapitre 8 : Mouvements de rotation (prompt de génération)

Lis d'abord `docs/prompts-sti2d/00-commun.md` (sources, charte, structure, livraison).

## Application

- Dossier `mouvements-rotation/`, nom « Chapitre 8 : Mouvements de rotation », `data-matiere="physique"`, préfixe `rot`.
- Portail : desc « Vitesse angulaire, tr/min et rad/s, moment d'une force, couple, point de fonctionnement d'un moteur. » ; dessin d'en-tête : nouveau dessin « engrenages et arcs de cercle » dans `hero.js`, ou `formules:physique`.

## Sources (`TSTI2D/08- Mouvements de rotation/`)

| Fichier | Contenu | À lire |
|---|---|---|
| `Chap08-Cours-complete.pdf` (2 p.) | Cours complété à la main | Non : résumé ci-dessous. Page 2 si tu veux reproduire fidèlement les deux caractéristiques du moteur |
| `Chap08-Exercices.pdf` (3 p.) | Ex. 9, 8 p. 107 ; 12, 11 p. 108 ; ex. 1 et 2 (hors manuel) ; 15 p. 108 ; 16, 17 p. 109 | Oui (figures et graphiques à refaire en SVG) |
| `Chap08-Correction-Exercices.pdf` (5 p.) | Corrections manuscrites (graphiques annotés pour 16 et 17) | Oui |

`Chap08-Cours.docx` contient déjà une partie des annotations : ignore-le, ainsi que les autres `.docx`.

## Contenu du cours

### Module 1 : Vitesse angulaire

- **Formules** :
  - ω = θ / Δt (ω en rad·s⁻¹, θ en rad, Δt en s) ;
  - **v = R × ω** (v en m·s⁻¹, R = **rayon** en m).
  
  Figure : arc de cercle, angle θ, positions à t et t + Δt, v⃗ tangent.
- **Période et fréquence** : T = durée d'un tour (θ = 2π), donc ω = 2π / T ; fréquence de rotation f = 1 / T (Hz).
- **Angle** : θ = ω × Δt ; conversion rad → degrés par un tableau de proportionnalité (2π rad ↔ 360°).
- **Outil `perso`** : un disque tourne (animation coupée si `prefers-reduced-motion`) ; on règle ω et on lit θ, T, et v d'un point placé à la distance R choisie.
- **Série** : ω à partir de θ et Δt ou de T ; v = R ω.
  
  Erreur à diagnostiquer : diamètre pris pour le rayon. C'est l'erreur de la correction de l'ex. 12, à mettre en avant.

### Module 2 : Convertir tr/min et rad/s

- **Règle** : **1 tour = 2π rad**, 1 min = 60 s.
- **Méthode du professeur** (écriture en fraction) : 1500 tr/min = 1500 tours / 1 min = 1500 × 2π rad / 60 s ≈ 157 rad/s.
- **Dans l'autre sens** :
  - 25 rad/s = 25 rad / 1 s ;
  - 25 rad = 25 / (2π) tours (tableau de proportionnalité rad | tours : 2π ↔ 1) ;
  - donc 25 rad/s = 25 × 60 / (2π) tr/min ≈ 239 tr/min.
- **Outil `perso`** : la fraction à compléter étape par étape (unités écrites à chaque étape). Lien vers `conversions/`.
- **Série** : tr/min → rad/s, rad/s → tr/min, tr/s.
  
  Erreurs : ×2π oublié, ÷60 au lieu de ×60, 2π au lieu de π.

### Module 3 : Moment d'une force et couple

- **Moment d'une force** : grandeur qui traduit l'efficacité d'une force pour faire tourner un solide autour d'un axe. M(F⃗) = F × d.
  - M en N·m, F en N ;
  - d = **bras de levier** = distance entre l'axe de rotation et la **droite d'action** de la force, en m.
- **Force oblique** : d = OA × cos α (ex. 2).
- **Exemple** : volant de diamètre 30 cm, F = 20 N. d = 15 cm, donc M = 20 × 0,15 = 3 N·m.
- **Couple de forces** : deux forces de même intensité, même direction, sens opposés. M = F × D (D = distance entre les deux droites d'action).
  - Exemple : volant, F<sub>1</sub> = F<sub>2</sub> = 20 N, D = 30 cm, donc M = 6 N·m.
  - C'est la somme des deux moments (d/2 × F<sub>1</sub> + d/2 × F<sub>2</sub>).
- **Outil `perso` (obligatoire, en plusieurs exemplaires)** : clé ou barre tournant autour de O. On fait glisser le point d'application et l'orientation de F⃗. La droite d'action (pointillés), le bras de levier d (perpendiculaire tracée depuis O, avec équerre) et M = F × d s'affichent en direct.
  
  À toi : « où appuyer pour un moment maximal ? », « force dirigée vers l'axe : M = 0 ».
- **Série** : M = F × d avec conversions cm → m, bras de levier d'une force oblique, moment d'un couple, F minimale pour un moment donné (F = M / d).

### Module 4 : Caractéristique d'un moteur et point de fonctionnement

- **Caractéristique d'un moteur** : couple T<sub>u</sub> en fonction de la fréquence de rotation n (tr/s ou tr/min). On y repère :
  - le couple au démarrage ;
  - le couple maximal ;
  - la fréquence nominale ;
  - la fréquence de rotation à vide (couple nul) ;
  - la **zone utile**, entre la fréquence nominale et la fréquence à vide. Note : « couple maximal et fréquence nominale sont écrits sur le moteur ; meilleure zone de fonctionnement ».
- **Point de fonctionnement** : intersection de la caractéristique du moteur et de celle de la charge (couple résistant). Il **donne la vitesse de rotation et le couple du moteur avec la charge**. Au point de fonctionnement, T<sub>u</sub> = T<sub>r</sub>.
- **Outil** : deux courbes superposées sur un même graphique. L'élève place le point d'intersection, puis lit n et T avec des pointillés vers les axes (outils de lecture de `lecture-graphique/modules/lgtools.js`).
  
  À toi : repérer les grandeurs nommées sur une caractéristique (glisser les étiquettes).
- **Série** : lecture du couple maximal, de la fréquence à vide, du point de fonctionnement sur des caractéristiques générées (paramètres aléatoires).

## Exercices (ordre et numérotation de la feuille)

**Ex. 9 p. 107** (manège, 45 tours en 3 min, enfant à 3 m) :
- a) T = 3 × 60 / 45 = 4 s ; remarque : f = 0,25 Hz. La question a) est barrée sur la feuille, mais la correction la fait : garde-la comme étape ;
- b) 45 tr / 3 min = 15 tr/min (ajouté à la main dans l'énoncé) et ω = 2π / 4 = π/2 ≈ 1,57 rad·s⁻¹ ;
- c) v = 3 × 1,57 = 4,71 m·s⁻¹ ;
- d) θ = 1,57 × 10 = 15,7 rad = 900° (tableau de proportionnalité).

**Ex. 8 p. 107** (τ = 20 ms, OA<sub>1</sub> = 35 cm) :
- a) uniforme : points régulièrement espacés ;
- b) demi-tour = 4 × 20 = 80 ms, tour = 160 ms ;
- c) ω = 2π / 0,160 ≈ 39 rad·s⁻¹.

**Ex. 12 p. 108** (900 tr/min, tambour de diamètre 65,0 cm) :
- a) ω = 900 × 2π / 60 ≈ 94,2 rad·s⁻¹ ;
- b) **R = 32,5 cm (rayon), v = 0,325 × 94,2 ≈ 30,6 m·s⁻¹. La correction manuscrite prend le diamètre (61,2 m·s⁻¹) : erreur à corriger**, et à expliquer dans la correction ;
- c) T = 2π / 94,2 ≈ 6,67 × 10⁻² s.

**Ex. 11 p. 108** (tire-bouchon, F = 15 N) :
- a) M = 15 × 0,10 = 1,5 N·m ;
- b) forces à 3 cm de l'axe, donc D = 6 cm et M = 0,9 N·m : plus faible.

**Ex. 1** (hors manuel) :
1. M = 200 × 0,20 = 40 N·m ;
2. clé à bougie : couple, M = 90 × 0,20 = 18 N·m.

**Ex. 2** (hors manuel, roue crevée, C<sub>s</sub> = 45 N·m, OA = 35 cm, F = 130 N) :
1. d = 35 × cos 25° ≈ 31,7 cm, M ≈ 41,2 N·m < 45 N·m : il ne peut pas débloquer l'écrou ;
2. clé en croix :
   - a) forces de même intensité, même direction, sens contraires : c'est un couple ;
   - b) F<sub>min</sub> = 45 / 0,40 ≈ 112,5 N < 130 N : c'est possible.

**Ex. 15 p. 108** (barrière, m = 20 kg, OG = 1,2 m) :
1. P⃗ en G, verticale, vers le bas, P = 196 N ;
2. M = 196 × 1,2 ≈ 235 N·m ;
3. a) sens 2 ; b) couple minimal 235 N·m (il diminue quand la barrière se lève, car le bras de levier diminue).

**Ex. 16 p. 109** :
1. à vide n = 550 tr/min (T<sub>u</sub> = 0) ;
2. superposition des deux caractéristiques :
   - a) T′<sub>u</sub> = 8 N·m ;
   - b) T′<sub>r</sub> = 8 N·m (forcément le même) ;
   - c) n = 525 tr/min.
   
   Superposition interactive.

**Ex. 17 p. 109** (MAS et pompe) :
- a) T<sub>u,max</sub> ≈ 25,5 N·m à 750 tr/min ;
- b) n<sub>max</sub> = 1000 tr/min ;
- c) T<sub>r,min</sub> = 2 N·m ;
- d) pas linéaire (pas une droite) ;
- e) couple résistant ≈ 9 N·m ;
- f) n ≈ 950 tr/min.

Lecture graphique avec tolérance.
