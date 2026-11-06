Lis `docs/prompts-2nde/00-commun.md`, puis exécute ce prompt.

# 13 · Décrire un mouvement (A10)

## 1. Application

- Nom : **« Décrire un mouvement »** ; dossier `mouvement/` ; préfixe `mv`, espace de noms `MV` ; `data-matiere="physique"` ; kicker « Physique · Seconde ».
- Portail : `dom: 'physique'`, `desc: "Référentiel, trajectoire, vitesse en un point et vecteur vitesse sur des chronophotographies."`
- Dessin d'en-tête : **`cinematique`** (existant : chronophotographies et vecteurs vitesse).
- Aucune dépendance aux autres prompts de 2nde ; réutilise `VEC` (`cinematique/`) et la règle de `LG` (`lecture-graphique/`).

## 2. Objectif et programme

Capacités exigibles :
- « Choisir un référentiel pour décrire le mouvement d'un système. » ; « Expliquer, dans le cas de la translation, l'influence du choix du référentiel sur la description du mouvement d'un système. »
- « Décrire le mouvement d'un système par celui d'un point et caractériser cette modélisation en termes de perte d'informations. » ; « Caractériser différentes trajectoires. »
- « Définir le vecteur vitesse moyenne d'un point. » ; « Approcher le vecteur vitesse d'un point à l'aide du vecteur déplacement MM′, où M et M′ sont les positions successives à des instants voisins séparés de Δt ; le représenter. »
- « Caractériser un mouvement rectiligne uniforme ou non uniforme. » ; « Réaliser et/ou exploiter une vidéo ou une chronophotographie d'un système en mouvement et représenter des vecteurs vitesse ; décrire la variation du vecteur vitesse. »

## 3. Ce que dit le cours

Sources : `06- Description des mouvements/Chap6-Cours-Exercices complete.pdf` (p. 1-4 cours, p. 5-6 activités, p. 7-8 exercices), `TP1 - Vitesse.pdf`, `Chap6-Exercices-correction.pdf`, `Ressource chronophotographie mesure vitesse.txt` (inspiration).

**Choix de l'enseignant** : vitesse au point M<sub>2</sub> : **v<sub>2</sub> = M<sub>2</sub>M<sub>3</sub> / (t<sub>3</sub> − t<sub>2</sub>)**, comme le cours ; **ajouter un pointage simplifié sur une animation** (le TP1 pointe une vidéo avec Regressi).

- **Système** : « l'objet qu'on étudie (on l'appelle aussi « corps ») ». **Référentiel** : « un objet par rapport auquel on étudie le mouvement » ; « **C'est l'endroit où on pose la caméra** » ; « un même mouvement apparaîtra différemment selon le référentiel dans lequel on l'étudie ».
- **Référentiels à connaître** (figure : Soleil, Terre et trois étoiles fixes) : **héliocentrique** (centre du Soleil, trois axes vers des étoiles fixes ; adapté au mouvement des planètes autour du Soleil) ; **géocentrique** (centre de la Terre, axes vers des étoiles fixes ; satellites autour de la Terre) ; **terrestre** (fixe par rapport à la Terre, repère pratique ; tout objet sur Terre).
- **Activité 1** : parachutiste au moment où il ouvre son parachute ; mouvements en ville : un bus roule lentement, Alain est assis dans le bus, Brigitte marche dans l'allée vers l'arrière pour faire des signes à Claude, sur le bord de la route, et reste à sa hauteur ; tableau « X est-il en mouvement par rapport à Y ? » (Alain, Brigitte, Claude, bus).
- **Trajectoire** : « l'ensemble des positions du centre de l'objet, repérées à intervalle de temps régulier » (points sur une courbe en pointillés avec une flèche). TP1 : sur une chronophotographie, la trajectoire d'un point P de l'objet est compliquée, celle du point G est simple : « ce point s'appelle le centre d'inertie, ou centre de gravité ».
- **Décrire un mouvement avec deux mots** (encadré) : forme de la trajectoire : **rectiligne** (droite), **circulaire** (cercle), **curviligne** (« toutes les autres ») ; vitesse : **uniforme** (« vitesse constante »), **accéléré** (« vitesse augmente »), **ralenti** (« vitesse diminue ») ; « si l'objet ne bouge pas, le mouvement est immobile ». Activité 2 : saut à ski (part sans vitesse, une centaine de km/h en bas), 400 m (sprint avant l'arrivée), poursuite sur piste (vitesse constante dans les courbes), marathon des sables (empreintes), gymnaste qui fait un soleil (pieds à distance constante de la barre).
- **Vitesse moyenne** : **v = d / Δt** (d en m, Δt en s, v en m/s, « noté aussi m.s<sup>−1</sup> ») ; d = v × Δt ; Δt = d / v (isoler avec une flèche) ; conversions : m/s → km/h : **× 3,6** ; km/h → m/s : **÷ 3,6**. Activité 3 : vitesse moyenne d'un trajet et vitesse instantanée du radar.
- **Vitesse instantanée** (encadré) : « La vitesse d'un point est approximativement égale à la vitesse moyenne calculée entre deux instants successifs les plus proches possible de ce point : **v<sub>2</sub>(t) = M<sub>2</sub>M<sub>3</sub> / (t<sub>3</sub> − t<sub>2</sub>) = M<sub>2</sub>M<sub>3</sub> / Δt** ». Exemple corrigé (Δt = 50 ms, échelle 1:1) : M<sub>2</sub>M<sub>3</sub> = 1,5 cm, v<sub>2</sub> = 1,5.10<sup>−2</sup> m / 50.10<sup>−3</sup> s = 0,30 m/s (2 c.s.) ; M<sub>7</sub>M<sub>8</sub> = 1,4 cm, v<sub>7</sub> = 0,28 m.s<sup>−1</sup>.
- **Vecteur vitesse** (manuel, collé dans le cours) : vecteur vitesse moyenne entre M et M′ : v⃗<sub>moy</sub> = MM′⃗ / Δt avec Δt = t<sub>M′</sub> − t<sub>M</sub> ; « si Δt est très courte, v⃗ est assimilé à v⃗<sub>moy</sub> » ; représentation : **direction** : tangente à la trajectoire ; **sens** : celui du mouvement ; **valeur** : celle de la vitesse, en m·s<sup>−1</sup> ; « le vecteur vitesse est représenté à l'aide d'une **échelle** adaptée » (segment « 1,0 m·s<sup>−1</sup> »). Tableau : direction qui change ou non × valeur qui change ou non → non rectiligne / rectiligne, non uniforme / uniforme ; le professeur entoure « direction et valeur qui ne changent pas : rectiligne et uniforme » (« le plus important à utiliser »).
- **Méthode de tracé** (trottinette, cours p. 4) : « mesurer la longueur M<sub>2</sub>M<sub>3</sub> sur la chronophotographie et utiliser l'échelle pour avoir sa valeur réelle ; calculer la valeur de la vitesse v<sub>2</sub> = M<sub>2</sub>M<sub>3</sub> / (t<sub>3</sub> − t<sub>2</sub>) = M<sub>2</sub>M<sub>3</sub> / Δt ; utiliser une échelle de représentation des vecteurs vitesse ; calculer la norme (ou longueur) du vecteur ; représenter v⃗<sub>2</sub> : direction celle du segment [M<sub>2</sub>M<sub>3</sub>], sens celui du mouvement, norme calculée ». Données : échelle 1,0 cm ↔ 2,0 m ; Δt = 0,40 s ; M<sub>2</sub>M<sub>3</sub> : 1 cm → 2 m, v<sub>2</sub> = 2,0 m / 0,40 s = 5,0 m.s<sup>−1</sup> ; M<sub>5</sub>M<sub>6</sub> : 1,6 cm → 3,2 m, v<sub>5</sub> = 8,0 m.s<sup>−1</sup> ; échelle des vecteurs du professeur : 8 m/s ↔ 4 cm, 5 m/s → 2,5 cm.
- **TP1 (pointage avec Regressi)** : placer l'origine du repère ; étalonner les longueurs (deux traits distants de 1 m) ; pointer les positions successives du centre de l'objet « à partir de la première image pour laquelle la balle ne touche plus la main » ; choisir l'origine des temps ; afficher les vecteurs vitesse ; « Comment sont les vecteurs vitesse par rapport à la trajectoire ? » (tangents).

À relire seulement pour refaire les figures : chronophotographies des p. 3 et 4, activités p. 5-6, exercices p. 7-8.

## 4. Plan de l'application (`PLAN`)

### Module 1 : Changer de référentiel (simulation, `module_1_simulation.html`)

- Animations (Lecture / Pause / vitesse / Recommencer, case « laisser la trace ») avec des boutons de **caméra** : « caméra posée sur le trottoir » (référentiel terrestre), « caméra dans le bus », « caméra sur le vélo », « caméra au centre de la Terre » (géocentrique), « caméra au centre du Soleil » (héliocentrique). La trajectoire se trace dans le référentiel choisi.
  1. **Le bus** de l'activité 1 (Alain, Brigitte, Claude) : l'élève remplit le tableau « X est-il en mouvement par rapport à Y ? » (oui / non dans chaque case, en regardant chaque caméra) ;
  2. **la valve d'une roue de vélo** : un cercle dans le référentiel du vélo, une courbe en arceaux dans le référentiel terrestre ;
  3. **une balle lâchée dans un train** (translation) : chute verticale pour la caméra du train, courbe pour la caméra du quai ;
  4. **la Lune** : un cercle dans le référentiel géocentrique, une courbe ondulée autour du Soleil dans le référentiel héliocentrique ;
  5. **le parachutiste** à l'ouverture du parachute : vu du sol il descend moins vite ; vu par un parachutiste resté en chute libre, il monte.
- Déroulé guidé : pour chaque animation, « Décris le mouvement de … dans ce référentiel » (deux mots) ; puis **choisir le référentiel adapté** (planète autour du Soleil, satellite autour de la Terre, objet sur Terre).
- Bilan : « Le référentiel, c'est l'endroit où on pose la caméra. Un même mouvement apparaît différemment selon le référentiel. »

### Module 2 : Décrire un mouvement (série notée sur 20, `module_2_questions.html`)

- Chaque question montre une chronophotographie générée (positions M<sub>1</sub>, M<sub>2</sub>… à intervalles de temps égaux, flèche du sens du mouvement) ou une situation de l'activité 2 ; l'élève choisit **deux mots** : forme (rectiligne, circulaire, curviligne) et vitesse (uniforme, accéléré, ralenti), ou « immobile ».
- Groupes : rectiligne uniforme / accéléré / ralenti ; circulaire uniforme ; curviligne ; situations de l'activité 2 ; **point P ou point G** (TP1) : sur la chronophotographie d'un objet qui tourne en avançant, toucher le point dont la trajectoire est la plus simple ; « ce qu'on perd en décrivant le système par un point » (la rotation).
- Erreurs à diagnostiquer :
  - **écart entre les points mal interprété** (sens du mouvement oublié) : « Le mouvement va de M<sub>1</sub> vers M<sub>8</sub> : les points s'écartent, la distance parcourue pendant chaque Δt augmente : le mouvement est accéléré. » ;
  - **« accéléré » confondu avec « rapide »** : « Les points sont éloignés, mais toujours à la même distance les uns des autres : le mouvement est rapide, mais uniforme. » ;
  - circulaire et curviligne confondus ; « rectiligne » pour une trajectoire légèrement courbe.

### Module 3 : Vitesse en un point (deux pages)

**Simulation « Pointer une animation » (`module_3_simulation.html`)** : pointage simplifié, comme le TP1.
- Une animation (balle lancée, trottinette, palet sur la glace) se lit **image par image** (◀ ▶, Δt affiché : 40 ms entre deux images) ; une règle de 1 m est visible dans la scène.
- Étapes : 1. placer l'origine du repère ; 2. **étalonner** : toucher les deux traits de la règle (1 m) ; 3. **pointer le centre de l'objet** sur chaque image, à partir de la première où la balle a quitté la main (zone de 44 px, tolérance de 3 px sur l'image, loupe interdite au doigt : boutons ◀ ▲ ▼ ▶ pour ajuster le pointé) ; 4. la chronophotographie se construit (points M<sub>1</sub>, M<sub>2</sub>…, temps t<sub>1</sub>, t<sub>2</sub>…) et s'affiche avec son échelle.
- Erreurs : objet pointé sur un bord au lieu de son centre (écart > tolérance : « pointe le centre de la balle ») ; image sautée.
- La chronophotographie obtenue est reprise par la page suivante.

**Manipulation guidée « Calculer v<sub>2</sub> » (`module_3_manip.html`)** : chronophotographies du cours (échelle 1:1, Δt = 50 ms ; trottinette : 1,0 cm ↔ 2,0 m, Δt = 0,40 s) et celle du pointage.
- Pas à pas : 1. **mesurer M<sub>2</sub>M<sub>3</sub>** à la règle virtuelle (en cm) ; 2. **convertir avec l'échelle** (tableau de proportionnalité de la charte §4 : `Distance (cm)` / `d (m)`) ; 3. **t<sub>3</sub> − t<sub>2</sub> = Δt** en s ; 4. **v<sub>2</sub> = M<sub>2</sub>M<sub>3</sub> / (t<sub>3</sub> − t<sub>2</sub>)** (champ, unité m/s, 2 chiffres significatifs) ; 5. conversion en km/h (× 3,6).
- Erreurs à diagnostiquer : **M<sub>1</sub>M<sub>3</sub> ou M<sub>1</sub>M<sub>2</sub> mesuré** (« Le cours prend M<sub>2</sub>M<sub>3</sub> : de M<sub>2</sub> au point suivant. ») ; t<sub>3</sub> − t<sub>1</sub> (« entre M<sub>2</sub> et M<sub>3</sub>, il s'écoule un seul Δt ») ; cm non convertis en m ; ms non convertis en s ; échelle oubliée ; ÷ 3,6 au lieu de × 3,6.

### Module 4 : Vecteur vitesse (manipulation guidée, `module_4_manip.html`)

- Chronophotographie dans un repère quadrillé (`VEC.Repere`, mode **mixte** : on glisse la pointe depuis M<sub>2</sub>, les boutons ↑ ← ↓ → l'ajustent d'un carreau ; la **valeur représentée** s'affiche en direct, `valeur: { k, unite: 'm/s', dec }`).
- Pas à pas pour v⃗<sub>2</sub> : valeur v<sub>2</sub> (du module 3, ou donnée) ; échelle des vitesses (« 1 carreau ↔ 1 m/s » ou « 1 cm ↔ 2 m/s ») ; longueur du vecteur ; **tracé** : direction celle de [M<sub>2</sub>M<sub>3</sub>], sens du mouvement, longueur à l'échelle. Vérification séparée de la direction, du sens et de la longueur.
- Puis v⃗<sub>5</sub> (trottinette : 5,0 et 8,0 m/s), et des chronophotographies où l'élève trace deux ou trois vecteurs et **décrit leur variation** avec le tableau du cours (direction change ? valeur change ?) : rectiligne uniforme (vecteurs identiques), rectiligne accéléré (même direction, plus longs), curviligne uniforme (même longueur, direction qui tourne).
- Erreurs : **vecteur tracé de M<sub>2</sub> à M<sub>3</sub>** (« Le vecteur vitesse ne relie pas deux positions : sa longueur se calcule avec l'échelle des vitesses. ») ; sens inversé ; longueur sans l'échelle (« 5,0 m/s avec 1 cm ↔ 2 m/s : 2,5 cm ») ; vecteur qui ne part pas de M<sub>2</sub>.
- Données choisies pour que la pointe de chaque vecteur tombe sur un nœud du quadrillage (charte §6), jamais sur un point de la trajectoire.

## 5. Rendu

- Chronophotographies en SVG : points de position (petites croix ou disques `--ink`), noms M<sub>i</sub>, flèche du sens du mouvement, échelle dessinée (« 1,0 cm ↔ 2,0 m ») ; l'objet dessiné en clair à chaque position dans l'animation du pointage.
- Animations du module 1 : décor simple (route, bus, quai, Terre, Lune, Soleil) en traits fins, trace de la trajectoire `--accent` ; aucune rotation rapide (confort visuel), `prefers-reduced-motion` respecté.
- Vecteurs : rendu `VEC` (couleur d'accent de la physique), nom avec sa flèche (`VEC.nomHTML('v_2')`).
- 1280 px : figure à gauche, déroulé à droite ; 390 px : figure pleine largeur (repère recalculé pour garder les carreaux lisibles), flèches de tracé de 58 × 50 px dessous.

## 6. Outils

- **`VEC`** (`cinematique/modules/vecteurs.js`, chargé depuis son dossier comme `principe-dynamique/modules/module_5.html`) : `new VEC.Repere(zone, { mode: 'mixte', vecteurs, points, extra })`, `VEC.nomHTML` ; ses styles `.vec-*` sont dans `cinematique/modules/cin.css` : recopie dans `mv.css` les règles nécessaires.
- **Règle virtuelle de `LG`** (`lecture-graphique/modules/lgtools.js`) : si elle n'est pas exportée seule, exporte-la de façon compatible (par exemple `LG.regle(svg, options)`, sans changer `LG.figure` ni `LG.bacASable`) et reteste `lecture-graphique/` et `puissance-active/`.
- `assets/dragdrop.js`, `BULLE`. Liens « Revois… » : `conversions/` (m/s ↔ km/h), `proportionnalite/` (échelle), `cinematique/` n'est pas à citer (terminale).

## 7. Vérifications propres

- Script : 1,5 × 10<sup>−2</sup> / 50 × 10<sup>−3</sup> = 0,30 m/s ; 1,4 × 10<sup>−2</sup> / 50 × 10<sup>−3</sup> = 0,28 m/s ; 2,0 / 0,40 = 5,0 m/s ; 3,2 / 0,40 = 8,0 m/s ; longueurs des vecteurs à chaque échelle ; conversions × 3,6.
- Pointage : la chronophotographie reconstruite redonne la vitesse de l'animation à 5 % près.
- Tracés de vecteurs à la souris, au doigt (CDP) et aux flèches ; valeur affichée en direct.
- Les trajectoires du module 1 sont justes dans chaque référentiel (cercle, courbe en arceaux, chute verticale ou courbe).

## 8. Hors périmètre

- Pas de forces ni de principe d'inertie (application supprimée par l'enseignant).
- Pas de vecteur variation de vitesse, pas d'accélération (1<sup>re</sup> et terminale).
- Pas de programmation Python des positions (capacité numérique laissée au professeur).
