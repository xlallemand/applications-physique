# Chapitre 1 : Énergie et puissance (prompt de génération)

Lis d'abord `docs/prompts-sti2d/00-commun.md` (sources, charte, structure, livraison).

## Application

- Dossier `energie-puissance/`, nom « Énergie et puissance », `data-matiere="physique"`, préfixe `ep`.
- Portail :
  - desc : « Rendement, puissance moyenne et instantanée, énergie et aire sous la courbe. »
  - dessin d'en-tête : `puissance`.

## Sources (`TSTI2D/01- Energie puissance/`)

| Fichier | Contenu | À lire |
|---|---|---|
| `Chap01-Cours.pdf` (1 p.) | « À retenir » tapé, pas de version complétée | Non : résumé ci-dessous |
| `Chap01-Activité 1.pdf` (1 p.) | Activité 1 p. 24 : STEP (stocker de l'énergie en plein air) | `pdftotext` suffit (données ci-dessous) |
| `Chap1-Exercices.pdf` (2 p.) | Énoncés du manuel : ex. 7 à 16 p. 30-32 | Oui, pour les données et les figures (graphiques des ex. 7, 10, 15, 16 ; diagrammes de l'ex. 14) |
| `Chap01-Exercices-correction.pdf` (5 p.) | Corrections manuscrites | Oui |
| `Chap1-TP-calo.pdf` | TP de calorimétrie | Non |

Ignore les `.docx` (mêmes contenus).

## Contenu du cours

### Module 1 : Rendement et schéma de conversion

- **Formes d'énergie** : chimique (batterie, essence), électrique, solaire (rayonnante), mécanique (= mouvement), thermique, nucléaire.
- **Schéma de conversion** : énergie (ou puissance) apportée → appareil (rendement η) → énergie utile + énergie perdue (en général thermique).
- **Formules** :
  - η = P<sub>u</sub> / P<sub>a</sub> = E<sub>u</sub> / E<sub>a</sub>, sans unité, entre 0 et 1 (ou en %) ;
  - P<sub>u</sub> = η × P<sub>a</sub> ;
  - P<sub>a</sub> = P<sub>u</sub> / η ;
  - P<sub>perdue</sub> = P<sub>a</sub> − P<sub>u</sub> (de même pour les énergies).
- **Méthodes** :
  - isoler P<sub>u</sub> ou P<sub>a</sub> ;
  - mettre les deux puissances dans la **même unité** (mW, W, kW) ;
  - η ne peut pas dépasser 1.
- **Outil interactif.** Schéma de conversion à compléter par glisser-déposer : formes d'énergie, puis valeurs. Repars de `PA.schema` / `PA.slot` (`puissance-active/modules/pa-outils.js`) et de `assets/dragdrop.js`.
- **Activité (page `simulation`)** : l'Activité 1 p. 24 (STEP), guidée.
  - Données :
    - bassins à 1590 m et 770 m ;
    - débit en turbinage 216 m³/s, en pompage 135 m³/s ;
    - 8 pompes de 150 MW ;
    - E<sub>p</sub> = m g z, g = 9,81 N/kg.
  - Questions :
    1. intérêt du stockage (transition énergétique, énergies intermittentes) ;
    2. schémas de conversion en turbinage et en pompage ;
    3. réversibilité (un groupe électrogène diesel ne l'est pas) ;
    4. calcul du rendement :
       - Δz = 820 m ;
       - m = 216 000 kg en 1 s ;
       - E<sub>p</sub> ≈ 1,74 × 10⁹ J ;
       - durée de pompage 216/135 = 1,6 s ;
       - E<sub>élec</sub> = 1200 MW × 1,6 s = 1,92 × 10⁹ J ;
       - η ≈ 0,90.
     
     Vérifie ces valeurs par un script.
- **Série** :
  - calcul de η, de P<sub>u</sub> ou de P<sub>a</sub> avec des unités mélangées ;
  - forme d'énergie utile ou perdue d'un appareil ;
  - lecture d'un diagramme énergétique.
  
  Erreurs à diagnostiquer : rapport inversé (η > 1), unités non converties, P<sub>u</sub> = P<sub>a</sub> × η confondu avec P<sub>a</sub> / η.

### Module 2 : Puissance moyenne et puissance instantanée

- **Puissance moyenne** : P = E / Δt, avec W, J, s (1 W = 1 J/s) ou kW, kWh, h.
- **Puissance instantanée** : variation d'énergie par rapport au temps, P = dE/dt, **dérivée de l'énergie**.
  - Si on a l'expression E(t), on dérive. Dérivées utiles : constante → 0 ; a t + b → a ; a t² → 2 a t ; sin(a t) → a cos(a t) (calculatrice en **radians**).
  - Si on a un graphique E(t) droit, P est le **coefficient directeur** de la droite.
  - Si on a des valeurs successives, P ≈ petite variation d'énergie / petite durée.
- **Exemple** : E<sub>c</sub>(t) = ½ m v² avec v = 2t, donc E<sub>c</sub> = 2 m t² et P = 4 m t (ex. 8).
- **À toi** : dériver E(t) puis calculer P à une date (champs) ; coefficient directeur d'une droite E(t). Renvoie vers `lecture-graphique/` pour la lecture.
- **Série** : dérivées de la liste ci-dessus avec des coefficients aléatoires, coefficient directeur, P = E/Δt avec conversions.
  
  Erreurs : P(t) non dérivée, constante gardée, degrés au lieu de radians, droite linéaire ou affine.

### Module 3 : Calcul de l'énergie

- **P constante** : E = P × Δt (J, W, s ou kWh, kW, h).
- **P non constante** : l'énergie est l'**intégrale** de la puissance, c'est-à-dire l'**aire sous la courbe P(t)**. On découpe l'aire en rectangles, triangles et trapèzes. Ça marche aussi quand P est constante.
- **Graphique I(t) à tension constante** : on trace d'abord P = U × I, ce qui revient à multiplier chaque graduation par U (ex. 15, 16).
- **Conversion et autonomie** : 1 Wh = 3600 J ; autonomie = énergie disponible / puissance moyenne.
- **Outil interactif central** : graphique P(t) où l'élève choisit l'intervalle, voit l'aire hachurée, lit base et hauteur sur le graphique, puis calcule (rectangle, triangle, somme de morceaux).
  - Repars du graphique `PA.Graphe` avec `aires` (`puissance-active/modules/pa.js`) et de l'outil « remplir l'aire » de `puissance-active/modules/module_1.html`.
  - Plusieurs exemplaires dans la page (« Afficher tout le cours »).
- **Série** :
  - aire d'un créneau ;
  - aire d'un triangle ou d'un trapèze ;
  - somme de deux morceaux ;
  - E = P × Δt avec des heures ou des kWh ;
  - autonomie d'une batterie.

## Exercices (même numérotation que le manuel)

Ordre du cours :

| Groupe | Exercices |
|---|---|
| Rendement (p. 32) | 11, 12, 13, 14 |
| Puissance instantanée (p. 31) | 9, 8, 10 |
| Énergie (p. 31-32) | 7, 15, 16 |

Notes par exercice :

- **Ex. 14** : diagrammes énergétiques des deux lampes à refaire en SVG. η = 3/60 = 0,05 et 3/11 = 0,27 ; la lampe fluocompacte est la plus économe.
- **Ex. 10** : droite passant par (40 s ; 10 000 J), coefficient directeur 250 J/s = 250 W, E = 250 t, P = 250 W.
- **Ex. 7** :
  - a) 200 W × 2 s = 400 J ;
  - b) triangle 200 × 100 / 2 = 10 000 J.
- **Ex. 15** : graduations × 400 V.
  - E<sub>1</sub> (0 à 25 s) = 72 000 W × 25 s = 1,8 × 10⁶ J ;
  - E<sub>2</sub> (25 à 180 s) = 24 000 × 155 / 2 + 14 000 × 155 ≈ 4,0 × 10⁶ J (triangle + rectangle).
  
  Refais le graphique I(t) puis P(t) avec les aires colorées comme dans la correction.
- **Ex. 16** : P<sub>1</sub> = 7,2 × 0,65 = 4,7 W, P<sub>2</sub> = 7,2 × 1,9 = 13,7 W.
  - E<sub>1</sub> = 4,7 × 55 ≈ 259 J.
  - **La correction manuscrite écrit à la question e) « E<sub>2</sub> = 7,2 × 120 = 1640 J » : la bonne écriture est E<sub>2</sub> = 13,7 W × 120 s ≈ 1,64 × 10³ J.**
  - Deux moteurs : E = 2 × (259 + 1640) ≈ 3,8 × 10³ J en 175 s, soit 21,7 W.
  - 11,5 Wh = 41 400 J, autonomie ≈ 1908 s ≈ 31,8 min.
- **Ex. 9 d** : P(t) = 157 cos(6,28 t), P(10) ≈ 157 W (radians).
