Lis `docs/prompts-2nde/00-commun.md`, puis exécute ce prompt.

# 01 · Période et fréquence d'un signal (A11)

## 1. Application

- Nom : **« Période et fréquence d'un signal »** ; dossier `periode-frequence/` ; préfixe `pf`, espace de noms `PF` ; `data-matiere="physique"` ; kicker « Physique · Seconde ».
- Portail : `dom: 'physique'`, `desc: "Repérer le motif, mesurer la période à l'échelle, calculer la fréquence, lire un écran d'oscilloscope."`
- Dessin d'en-tête : **nouveau dessin `oscillo`** dans `assets/hero.js` : écran quadrillé, signal périodique non sinusoïdal (forme de clarinette) qui défile lentement, un motif repassé plus épais et une double flèche « T » au-dessus.
- Cette application crée aussi `assets/bulle.js` (`BULLE`, voir `00-commun.md` §4).

## 2. Objectif et programme

Indispensable I1. Capacités exigibles visées :
- « Définir et déterminer la période et la fréquence d'un signal sonore notamment à partir de sa représentation temporelle. » ; « Mesurer la période d'un signal sonore périodique. »
- Capacité mathématique : « Identifier une fonction périodique et déterminer sa période. »

## 3. Ce que dit le cours

Sources : `01- Signaux sonores/Chap01-Cours complete.pdf` p. 1-2, `TP 1 - frequence complete.docx`, `Chap01-Exercices.pdf` et `Chap01-Exercices-correction.pdf` p. 1-2.

- **Signal périodique** : « un signal qui se répète à l'identique de façon régulière » (exemples du cours : battements du cœur, rotation de la Terre). La correction justifie : « le signal est périodique car il se répète à l'identique à intervalle de temps régulier ».
- **Période** : « la durée du motif élémentaire », notée **T**, unité SI la seconde (s). Sur les figures, le professeur **surligne un motif** (en couleur) et place une double flèche T, entre deux sommets successifs, ou entre deux creux (« ou »). Le TP dit : « durée entre deux sommets successifs par exemple ».
- **Fréquence** : f = 1 / T, « avec T en seconde (s), f en Hertz (Hz) », 1 Hz = 1 / 1 s = 1 s<sup>−1</sup> ; T = 1 / f ; « la fréquence est le nombre de fois que le motif élémentaire se répète par seconde ».
- **Méthode du cours (une période, avec l'échelle)**, clarinette p. 1 : « On utilise l'échelle : 7,4 cm ↔ 13 ms ; T : 1,65 cm → (13 × 1,65) / 7,4 = 2,90 ms, soit T = 2,9 ms », puis f = 1 / (2,9 × 10<sup>−3</sup>) = 345 Hz. Le calcul est un produit en croix ; dans l'application il s'écrit dans le **tableau de proportionnalité** de la charte §4 (colonnes `Distance (cm)` et `t (ms)`), choix de l'enseignant.
- **Méthode des corrections (plusieurs périodes)**, exercice 7 : « Échelle : 3,5 cm ↔ 10 ms ; 4T<sub>A</sub> : 3,2 cm ↔ (10 × 3,2) / 3,5 = 9,14 ms ; donc T<sub>A</sub> = 9,14 / 4 = 2,3 ms ; f<sub>A</sub> = 1 / (2,3 × 10<sup>−3</sup>) = 435 Hz ».
- **Choix de l'enseignant** : on mesure **d'abord une période**, puis **plusieurs périodes pour gagner en précision** (T = Δt / n).
- **Oscilloscope** (exercice 4 et sa correction) : « T = 4 × 0,5 = 2 ms (4 carreaux) », énoncé « 0,5 ms/carreau et 2 V/carreau ». Vocabulaire : **carreau** (le cours montre aussi un écran « 1.0 ms / div »). Le professeur écrit d'abord le nombre de carreaux, puis le produit par la base de temps.
- Exemples à reprendre : T = 4 ms → f = 250 Hz ; T = 5 ms → 200 Hz.
- Chiffres significatifs : le professeur garde 2 ou 3 chiffres (« T = 2,9 ms », « 435 Hz »).
- **Ne pas faire référence aux numéros d'exercices, aux TP, au cours**. L'application est indépendante des sources.

À relire seulement pour refaire des signaux : figures de la clarinette et du diapason (cours p. 1), des exercices 1, 3, 4 et 7 (`Chap01-Exercices.pdf`).

## 4. Plan de l'application (`PLAN`)

### Module 1 : Le motif élémentaire (manipulation guidée, `module_1_manip.html`)

- Affichage : un signal « papier » (graphique LG en millimètres, axe des temps en ms) et la consigne.
- Situation 0 (deux questions d'abord) : trois signaux dont un non périodique (bruit, battements irréguliers) ; l'élève touche « périodique » ou « non périodique » sous chacun ; diagnostic : « Ce signal ne se répète pas à l'identique : cherche une portion qui revient exactement pareille. »
- Situations 1 à 6 : sinusoïde (diapason), clarinette (forme complexe), électrocardiogramme, créneau, triangle, trompette. L'élève **touche le début d'un motif** (n'importe quel point du signal), puis **la fin du motif** ; le motif se surligne (accent, trait épais) et la double flèche T s'affiche.
- Vérification : la fin est au point équivalent une période plus loin (même valeur **et** même sens de variation), tolérance 2 % de T.
- Erreurs à diagnostiquer :
  - fin après une demi-période ou à un point de même hauteur qui ne repart pas de la même façon : « Le signal repasse par la même valeur, mais il ne repart pas de la même façon : ce n'est qu'une partie du motif. » ;
  - fin après deux périodes ou plus : « Tu as pris deux motifs : le motif élémentaire est le plus petit morceau qui se répète. » ;
  - portion qui ne se répète pas (début et fin sans rapport) : « Le morceau choisi ne se répète pas à l'identique juste après. »
- Bilan : « La période T est la durée du motif élémentaire. On peut la mesurer entre deux sommets, deux creux, ou deux points qui se correspondent. »

### Module 2 : Mesurer T et calculer f (manipulation guidée, `module_2_manip.html`)
Un outil de mesure sur un graphique (règle) est déjà disponible dans l'application 'lecture-graphique'.
Pour mesurer un valeur sur un graphique, proposer toujours 2 possibilités : 
- lecture directe sur le graphique car la mesure tombe sur des valeurs de la grille simples à lire
- utilisation de la règle et d'un tableau de proportionnalité.
Une option à cocher permet de choisir entre les deux. Si la valeur lue directement n'est pas suffisamment facile à lire / précise, refuser cette méthode de lecture directe.

Déroulé de `LG.poserQuestion` (règle virtuelle, tableau de proportionnalité, produit en croix, division par le nombre de périodes), en trois temps pour chaque signal :
1. **Une période** : la règle virtuelle mesure une seule période ; tableau `Distance (cm)` / `t (ms)` : ligne de l'échelle (mesurée sur l'axe), ligne de la mesure, case « T » mise en valeur ; produit en croix ; T avec son unité.
2. **Plusieurs périodes** : même signal, l'élève mesure n périodes (le plus grand nombre lisible), tableau, produit en croix pour nT, puis T = Δt / n. Comparaison affichée : « Une période : T = 2,8 ms ; 4 périodes : T = 2,90 ms. L'erreur de lecture (environ 1 mm) est partagée entre les 4 périodes : la deuxième mesure est plus précise. »
3. **Fréquence** : conversion de T en s (« T = 2,90 ms = 2,90 × 10<sup>−3</sup> s »), puis f = 1 / T (champ, unité Hz, 3 chiffres significatifs).
- Erreurs à diagnostiquer (en plus de celles de LG) :
  - f calculée avec T en ms (0,345 au lieu de 345) : « Tu as gardé T en ms : dans f = 1 / T, T doit être en secondes. » ;
  - conversion à l'envers (× 10<sup>3</sup>) : « 1 ms = 10<sup>−3</sup> s : T en secondes est plus petit que T en ms. » ;
  - division par le nombre de sommets au lieu du nombre de périodes : « Entre le premier et le cinquième sommet, il y a 4 périodes, pas 5. » ;
  - T et f confondus (T = 1 / f écrit f = T) : « f = 1 / T : la fréquence est l'inverse de la période. »
- Signaux : la clarinette du cours (T = 2,9 ms), le diapason la<sub>3</sub> (T = 2,27 ms, f = 440 Hz), la guitare de l'exercice 7 (T = 2,3 ms), un électrocardiogramme (T de l'ordre de 0,8 s, f en Hz puis « battements par minute » en bilan), une trompette. Valeurs à recalculer par script.
- Lien « Revois la lecture graphique » → `lecture-graphique/` ; « Revois les tableaux de proportionnalité » → `proportionnalite/` ; « Revois les conversions » → `conversions/` .

### Module 3 : Écran d'oscilloscope (simulation, `module_3_simulation.html`)

- Écran de 10 × 8 carreaux, un signal (sinusoïde ou forme de son), bouton de **base de temps** (0,1 ; 0,2 ; 0,5 ; 1 ; 2 ; 5 ms/carreau, boutons − / + et sélecteur), réglage de la fréquence du signal masqué en mode défi.
- Déroulé guidé :
  1. compte les carreaux d'une période (deux curseurs verticaux glissables, aimantés au dixième de carreau, ou boutons ◀ ▶) ;
  2. T = nombre de carreaux × base de temps (champ) ;
  3. mesure plusieurs périodes : T = (nombre de carreaux × base de temps) / n ;
  4. change la base de temps : le signal se dilate ou se resserre, **la période ne change pas** (question « T a-t-elle changé ? ») ;
  5. f = 1 / T.
- Erreurs : base de temps oubliée (« tu as donné des carreaux, pas une durée ») ; multiplication par la sensibilité verticale (V/carreau) au lieu de la base de temps ; division par n oubliée.
- Bilan à cocher : « T = nombre de carreaux × base de temps ».

### Module 4 : Entraînement (série notée sur 20, `module_4_questions.html`)

10 questions tirées dans ces groupes :
- **Signal à l'axe gradué** (exercices 1 et 3) : lire T directement sur l'axe (repère du motif, plusieurs périodes), puis f.
- **Signal « papier » à l'échelle** : partie `'perso'` avec `LG` (règle, tableau, n périodes).
- **Oscilloscope** : carreaux × base de temps, puis f.
- **T ↔ f** : f à partir de T (ms, µs, s) et T à partir de f (Hz, kHz).

Chaque question a 2 ou 3 parties ; diagnostics ci-dessus.

## 5. Rendu

- Graphiques LG (SVG en mm « papier », identiques à tous les écrans) : courbe en `--accent`, quadrillage `--paper-3`, motif surligné en accent épais semi-transparent.
- Écran d'oscilloscope dessiné en SVG : fond `--paper`, cadre `--ink`, quadrillage pointillé `--paper-3`, axes centraux gradués en cinquièmes de carreau, trace `--accent`, curseurs verticaux `--ink-2` avec poignées de 44 px.
- 1280 px : figure à gauche, déroulé guidé à droite ou dessous selon la place ; 390 px : figure pleine largeur, commandes dessous.
- Pas de son (choix de l'enseignant).

## 6. Outils

- **LG** (existant) : `lecture-graphique/modules/lgtools.js` et `lgtools.css`, chargés depuis leur dossier comme `puissance-active/modules/module_3_cours.html`. API : `LG.figure`, `LG.bacASable`, `LG.poserQuestion(root, def, opts)` (`def.type: 'periode'`, `def.signal: { forme, periode, ampl, phase }`, formes `sinus`, `triangle`, `carre`, `dent`, `complexe`, `ecg`), `LG.fmt`, `LG.lireNombre`.
- **Extensions compatibles de LG** à faire ici, si elles manquent (valeurs par défaut inchangées) :
  - imposer le nombre de périodes mesurées (`def.nImpose: 1`, ou `'plusieurs'` : n ≥ 2) pour le déroulé « une période, puis plusieurs » ;
  - formes `clarinette` et `trompette` (fondamental + harmoniques, comme `complexe`) ;
  - rappel au moment de f = 1 / T si `opts.frequence: true`.
  Retester ensuite `lecture-graphique/` et `puissance-active/`.
- **À créer** : `assets/bulle.js` + `assets/bulle.css` (`BULLE.info(html, label)`), et l'écran d'oscilloscope dans `periode-frequence/modules/oscillo.js` (objet `OSC`, plusieurs exemplaires par page : `OSC.monter(zone, { signal, baseTemps, curseurs })`).
- `assets/dragdrop.js` si des étiquettes sont à glisser ; `assets/numpad.js` comme LG.

## 7. Vérifications propres

- Recalculer par script : 13 × 1,65 / 7,4 = 2,90 ms et f = 345 Hz ; 10 × 3,2 / 3,5 = 9,14 ms, T = 2,3 ms, f = 435 Hz ; T = 4 ms → 250 Hz ; T = 5 ms → 200 Hz ; T du la<sub>3</sub> = 2,27 ms.
- Chaque signal généré : n périodes lisibles sous la règle (≤ 160 mm), motif identifiable.
- Le toucher du début et de la fin d'un motif fonctionne au doigt (CDP) sur chaque forme ; la tolérance accepte un appui à 2 mm près.
- L'oscilloscope : T affiché constant quand la base de temps change ; nombre de carreaux juste pour chaque base.
- `lecture-graphique/` et `puissance-active/` toujours fonctionnels après l'extension de LG.

## 8. Hors périmètre

- Pas de domaine audible (infrasons, ultrasons), pas de hauteur ni de timbre.
- Pas de son à écouter, pas de niveau sonore (dB), pas de vitesse de propagation du son (application supprimée), pas de spectre (terminale).
- Pas de cours ni de fiche.
