# Chapitre 17 : Spectre d'un signal périodique (prompt de génération)

Lis d'abord `docs/prompts-sti2d/00-commun.md` (sources, charte, structure, livraison).

## Application

- Dossier `spectre-signal/`, nom « Chapitre 17 : Spectre d'un signal périodique », `data-matiere="physique"`, préfixe `sp`.
- Portail : desc « Décomposition de Fourier, composante continue, fondamental et harmoniques, lecture d'un spectre. »
- Dessin d'en-tête : **nouveau dessin `spectre`** dans `assets/hero.js` (signal périodique non sinusoïdal en haut, raies du spectre en dessous). Il resservira au chapitre 18.

## Sources (`TSTI2D/17- Spectre signal periodique/`)

| Fichier | Contenu | À lire |
|---|---|---|
| `Chap17-Cours complete.pdf` (2 p.) | Cours complété à la main (exemple entièrement résolu) | Page 1 seulement, pour refaire le signal et le spectre de l'exemple (valeurs ci-dessous) |
| `Chap17-Exercices.pdf` (2 p.) | Ex. 9 p. 219, 6 p. 218, 11, 12 p. 220, 13, 14 p. 221 | Oui : tous les graphiques sont à refaire en SVG (agrandis si besoin, `pdftoppm -r 250` avec `-x -y -W -H`) |
| `Chap17-correction exercices.pdf` (4 p.) | Corrections manuscrites | Oui |
| `Animations.txt` | Liens vers l'animation de Nantes (phyanim, synthèse de Fourier) et PhET « Fourier » | Non : le simulateur est décrit ci-dessous |
| `Sujet bac son polynesie 2022.pdf` | Sujet « son d'un violon », chapitres 17 et 18 | Non : traité dans l'application du chapitre 18 |

## Contenu du cours

### Module 1 : Analyse de Fourier (simulateur, puis cours)

- **Partie physique** : tout signal périodique peut se décomposer en une somme de fonctions sinusoïdales.
- **Partie maths** : s(t) = a<sub>0</sub> + Σ a<sub>n</sub> × sin(n × ω × t + φ<sub>n</sub>) = a<sub>0</sub> + Σ a<sub>n</sub> × sin(n × 2πf × t + φ<sub>n</sub>).
  - **pulsation** ω = 2πf ;
  - **a<sub>0</sub> = composante continue = valeur moyenne du signal** (dans l'exemple du cours, a<sub>0</sub> = 1000 mV ; sur une figure symétrique, a<sub>0</sub> = 0).
  - Dans l'application, ne parle pas des phases φ<sub>n</sub> au-delà de cette écriture (le simulateur n'en a pas).
- **Figure du cours** : les harmoniques séparées (en couleur) puis leur somme qui approche un créneau. Le simulateur la reproduit.
- **Série** : composante continue = moyenne, ω = 2πf, f<sub>n</sub> = n f<sub>1</sub>, ce qui change ou non quand on ajoute un harmonique.

### Module 2 : Le spectre

- **Définition** : le spectre représente l'amplitude des sinusoïdes qui composent le signal en fonction de la fréquence. On y lit :
  - la raie à **f = 0 Hz** : la composante continue a<sub>0</sub> ;
  - le **fondamental** f<sub>1</sub>, qui est la fréquence du signal ;
  - les **harmoniques** de rang n à **f<sub>n</sub> = n × f<sub>1</sub>** (seulement des multiples de f<sub>1</sub>), et leurs amplitudes a<sub>n</sub>.
- **Exemple du cours** (à refaire en SVG) :
  - signal s(t) de 0 à 50 ms ; spectre en mV : a<sub>0</sub> = 1000 mV, f<sub>1</sub> = 150 Hz avec a<sub>1</sub> = 1500 mV, 300 Hz avec a<sub>2</sub> = 1000 mV, 450 Hz avec a<sub>3</sub> = 670 mV, 600 Hz avec a<sub>4</sub> ≈ 170 mV ;
  - **le signal de l'application doit être calculé à partir de ce spectre** avec le moteur du simulateur, pour que les deux graphiques concordent ;
  - sur la figure du manuel on mesure 7T = 47 ms, d'où f = 149 Hz.
- **Outil `perso` « lire un spectre »** : raies générées. L'élève touche une raie ; il saisit sa fréquence et son amplitude, puis son rang. Diagnostics :
  - « la raie à 0 Hz est la composante continue, pas le fondamental » ;
  - « le rang est f<sub>n</sub> / f<sub>1</sub> ».
- **Série** :
  - a<sub>0</sub>, f<sub>1</sub>, amplitude et fréquence d'un harmonique ;
  - rang d'une raie ;
  - fréquence de l'harmonique de rang 7 (absent du spectre) ;
  - rang de l'harmonique de 1800 Hz ;
  - raie « impossible » (pas multiple de f<sub>1</sub>).

### Module 3 : Exploiter les graphiques

- **Sur le signal** : mesurer T sur plusieurs périodes (nT, puis T = durée / n, plus précis), puis f = 1/T avec T en s. La fréquence du signal est celle du fondamental.
  
  Exemple : 7T = 47 ms, T = 6,71 ms, f = 149 Hz ≈ 150 Hz.
- **Outil de mesure** : sur le graphique du signal, deux curseurs verticaux glissables (au doigt et à la souris) pour encadrer n périodes. La durée s'affiche, l'élève choisit n et calcule T, puis f.
  
  Repars des outils de `lecture-graphique/modules/lgtools.js` ou de `PA.figPhi` / `PA.reglesPhi` de `puissance-active/modules/pa-outils.js`.
- **Sur le spectre** :
  - intervalle de fréquences pour transmettre certains harmoniques (fondamental, rangs 2 et 3 : [150 Hz ; 450 Hz], largeur 300 Hz) ;
  - **bande passante** d'un système : seuls les harmoniques de cette bande sont transmis ;
  - **supprimer des harmoniques change la forme du signal mais pas sa fréquence**, qui est celle du fondamental.
- **Série** :
  - T et f sur un signal généré (nT lisible sur la grille) ;
  - intervalle de fréquences nécessaire ;
  - harmoniques transmis par une bande donnée ;
  - fréquence conservée ou non.

### Module 4 : Exercices

Voir plus bas.

## Module spécial : simulateur « Synthèse de Fourier » (page `simulation` en tête du module 1)

**Principe** : celui de l'animation de Nantes (phyanim « Synthèse de Fourier »), adapté à la demande :

- **le spectre est sous le signal** (deux graphiques empilés, même largeur) ;
- **pas de déphasage** : toutes les composantes sont des sinus de phase nulle, aucun réglage de phase ;
- **une composante continue a<sub>0</sub>** réglable, visible dans le spectre comme une raie à 0 Hz ;
- **un aspect identique à ce que les élèves manipulent en cours et en exercices** :
  - signal u(t) ou s(t) en fonction du temps en ms, quadrillage en pointillés ;
  - spectre en raies verticales fines « a<sub>n</sub> (en V ou mV) » en fonction de « Fréquence (en Hz) », axes et graduations comme dans le manuel ;
  - raies étiquetées a<sub>0</sub>, a<sub>1</sub> (fondamental), a<sub>2</sub>, a<sub>3</sub>…

**Commandes** (curseurs larges, ≥ 46 px, au doigt et à la souris ; valeur affichée à côté de chaque curseur) :

- **fréquence du fondamental** f<sub>1</sub> : 50 à 1000 Hz par pas de 10 Hz. L'axe des temps se recale pour montrer environ 3 périodes ;
- **composante continue** a<sub>0</sub> : −2 à +2 V par pas de 0,1 V ;
- **amplitudes a<sub>1</sub> à a<sub>10</sub>** : un curseur vertical par harmonique, 0 à 2 V par pas de 0,05 V, rangé **sous la raie correspondante du spectre**. On règle l'amplitude en faisant glisser la raie elle-même vers le haut ou le bas (poignée en haut de la raie), et un champ numérique permet une valeur précise ;
- **signaux prédéfinis** (boutons `btn-secondary`) :
  - sinusoïde pure ;
  - créneau (harmoniques impairs a<sub>n</sub> = 4A/(nπ)) ;
  - dent de scie (a<sub>n</sub> = 2A/(nπ)) ;
  - « exemple du cours » (valeurs ci-dessus) ;
  - « exercice 6 » (f<sub>1</sub> = 200 Hz ; a<sub>1</sub> = 0,5 V, a<sub>2</sub> = 0,75 V, a<sub>5</sub> = 1 V) ;
  - « tout à zéro » ;
- **options** (cases à cocher) :
  - « afficher les harmoniques séparément » : courbes fines de couleurs différentes, comme la figure du cours ;
  - « afficher la forme idéale » : créneau ou dent de scie en gris, pour voir la somme s'en approcher ;
  - « afficher la valeur moyenne » : droite horizontale à a<sub>0</sub>.
- **Interaction croisée** : toucher une raie du spectre met en valeur l'harmonique correspondant sur le graphique du signal, et inversement depuis la légende.
- **Lecture** : au toucher ou au survol d'une raie, une étiquette affiche f<sub>n</sub> = n × f<sub>1</sub> et a<sub>n</sub>. Les curseurs de mesure de T du module 3 sont disponibles sur le signal.

**Cheminement pédagogique** (étapes guidées sous le simulateur ; chacune donne une consigne et vérifie l'état du simulateur, avec « ✍ Complète ton cours » à la fin) :

1. **Une seule sinusoïde** : a<sub>1</sub> seul.
   - Le spectre n'a qu'une raie.
   - Fais varier f<sub>1</sub> : la raie se déplace, la période change (T = 1/f<sub>1</sub>).
   - Fais varier a<sub>1</sub> : la raie grandit, le signal aussi.
2. **La composante continue** : règle a<sub>0</sub>. Le signal monte ou descend sans changer de forme ; une raie apparaît à 0 Hz. La droite « valeur moyenne » montre que a<sub>0</sub> est la moyenne du signal.
3. **Ajouter un harmonique** (rang 2, puis 3) : la forme change, mais **la période reste celle du fondamental**. Les raies ne peuvent être qu'à 2f<sub>1</sub>, 3f<sub>1</sub>…
   
   Question : « mesure T : a-t-elle changé ? ».
4. **Construire un créneau** :
   - harmoniques impairs seulement, avec a<sub>n</sub> = a<sub>1</sub>/n (assistant : « place a<sub>3</sub> = a<sub>1</sub>/3 ») ;
   - comparaison avec la forme idéale ;
   - plus on ajoute d'harmoniques, plus on s'en rapproche.
5. **Retirer des harmoniques** (bande passante) : on coupe au-dessus d'une fréquence donnée. La forme se dégrade, la fréquence ne change pas (lien avec l'ex. 12 d).
6. **Défis** : un signal cible gris est affiché. L'élève règle a<sub>0</sub>, f<sub>1</sub> et les a<sub>n</sub> pour le reproduire (tolérance, puis « Réussi ! »). Trois défis tirés des exercices du chapitre : ex. 6, ex. 13 et l'exemple du cours.

**Bilan à compléter** :
- tout signal périodique = composante continue + fondamental (fréquence du signal) + harmoniques f<sub>n</sub> = n f<sub>1</sub> ;
- le spectre donne les amplitudes ;
- a<sub>0</sub> est la valeur moyenne.

**Technique** :
- moteur dans **`assets/fourier.js` + `assets/fourier.css`**, objet global `FOURIER`, montable en plusieurs exemplaires (`FOURIER.monter(zone, options)`), pour être réutilisé tel quel au chapitre 18 (habillage musical, son) et dans les items `perso` des cours ;
- SVG, couleurs : courbe en `--accent`, harmoniques via attributs de présentation SVG (comme `VEC.C`), grille `--paper-3` ;
- calcul en JavaScript pur, aucun `fetch`, aucune bibliothèque ;
- `prefers-reduced-motion` respecté (pas d'animation de défilement du signal).

## Exercices (ordre de la correction)

**Ex. 9 p. 219** (spectre de u(t)) :
- a) a<sub>0</sub> = 2 V ;
- b) f<sub>1</sub> = 50 Hz ;
- c) a<sub>1</sub> = 8 V ;
- d) a<sub>6</sub> = 1 V à 300 Hz ;
- e) a<sub>3</sub> = 0 V (pas de raie à 150 Hz) ;
- f) f = 50 Hz, T = 0,020 s.

Raies de l'énoncé : 0 Hz (2 V), 50 Hz (8 V), 100 Hz (11 V), 200 Hz (5 V), 250 Hz (15 V), 300 Hz (1 V), 400 Hz (7 V). Vérifie sur l'image agrandie.

**Ex. 6 p. 218** :
1. T = 5,0 ms, f = 200 Hz ;
2. f<sub>1</sub> = 200 Hz, la fréquence du signal ;
3. rangs 2 (400 Hz) et 5 (1000 Hz) ;
4. a<sub>1</sub> = 500 mV, a<sub>2</sub> = 750 mV, a<sub>5</sub> = 1000 mV ; rangs 3 et 4 nuls ;
5. pas de raie à 0 Hz, donc pas de composante continue.

**Ex. 11 p. 220** (raies à 100, 300, 500, 700, 900, 1100, 1300 Hz) :
- a) f<sub>1</sub> = 100 Hz ;
- b) rangs 1, 3, 5, 7, 9, 11, 13 ;
- c) [100 Hz ; 700 Hz], largeur 600 Hz ;
- d) de 200 à 1200 Hz on transmet les rangs **3, 5, 7, 9 et 11**.

**La correction ajoute le rang 13 et place la dernière raie à « 1200 Hz » : elle est à 1300 Hz, hors de l'intervalle.** Corrige.

**Ex. 12 p. 220** (bande passante 0-2 kHz) :
- a) guitare folk : 3,1 kHz ; orgue : 0,80 kHz ;
- b) guitare : rang 7 ; orgue : rang 2 ;
- c) guitare mal transmise (harmoniques au-dessus de 2 kHz), orgue bien transmis ;
- d) la fréquence ne change pas (fondamental).

**Ex. 13 p. 221** (Porsche 911) :
- a) 3T = 10 ms, T = 3,3 ms ;
- b) f = 300 Hz ;
- c) f<sub>1</sub> = 300 Hz ;
- d) 600, 900, 1200 Hz (rangs 2, 3, 4) ;
- e) 6000 tr/min = 100 tr/s ;
- f) 6 cylindres : 300 combustions/s ; 8 cylindres : 400 ; 10 cylindres : 500 ;
- g) 6 cylindres.

**Ex. 14 p. 221** :
- a) 50 Hz ;
- b) rangs 3, 5, 7 : 150, 250, 350 Hz ;
- c) a<sub>1</sub> = 1, a<sub>3</sub> = 0,86, a<sub>5</sub> = 0,81, a<sub>7</sub> = 0,72 ; f<sub>1</sub> = 50, f<sub>3</sub> = 150, f<sub>5</sub> = 250, f<sub>7</sub> = 350 Hz.

Bonus : bouton « Voir ce signal dans le simulateur » sur les exercices 6, 13 et 14 (spectre chargé dans un exemplaire de `FOURIER`).
