# Mouvement des satellites et des planètes (prompt de génération)

Lis d'abord `docs/prompts-tspe/00-commun.md` (sources, charte, structure, outils partagés, livraison).

## Application

- Dossier `satellites-planetes/`, nom « Mouvement des satellites et des planètes », `data-matiere="physique"`, préfixe `sp`, espace de noms `SPL` (vérifie : `SP` est déjà pris par `spectres-etoiles/` pour `SP.rgb`).
- Portail : `desc: "Repère de Frenet, gravitation, vitesse et période d'un satellite, géostationnaire, lois de Kepler."` ; `mots` : satellite, planète, orbite, gravitation universelle, G, Frenet, accélération normale, v²/r, mouvement circulaire uniforme, période de révolution, géostationnaire, Kepler, ellipse, foyer, loi des aires, demi-grand axe, T²/a³, référentiel géocentrique, héliocentrique…
- Dessin d'en-tête : orbites (regarde `assets/hero.js` : un dessin d'astres existe-t-il ? sinon `orbites`).
- Outils : `VEC` (vecteurs vitesse et accélération, repère de Frenet), `EQ` (isoler v, T, M, r), `LG` (régression T² = f(a³)), `BULLE`, `PLEIN`.

## Sources (`13- Mouvement des satellites et des planetes/`)

| Fichier | Contenu | À lire |
|---|---|---|
| `Chap13_Cours_satellites_complete.pdf` (4 p.) | Cours tapé (démonstrations complètes), complété à la main | Non : résumé ci-dessous. Page 4 pour la correction manuscrite du sujet de bac 2013 |
| `Chap13_Exercices.pdf` (2 p.) | Exercices (en images) | Oui |
| `Chap13_Exercices_correction.pdf` (8 p.) | Corrections manuscrites | Oui |
| `video.txt` | Vidéo du CEA sur les lois de Kepler | Lien facultatif (`00-commun.md` §2) dans le cours des lois de Kepler |

## Consignes du professeur

- **Liens vers l'application `cinematique/`** pour proposer de **travailler plus en détail le repère de Frenet** (lien facultatif, type 1 : rappel pour ceux qui en ont besoin ; vise le module du mouvement circulaire de `cinematique/`, trouve sa page dans son `PLAN`).
- **Animations pour visualiser les trois lois de Kepler.**

## Contenu du cours (résumé)

- **Rappels (repère de Frenet, mouvement circulaire de rayon r)** : v⃗ = v u⃗<sub>t</sub> ; a⃗ = a<sub>t</sub> u⃗<sub>t</sub> + a<sub>n</sub> u⃗<sub>n</sub> avec a<sub>t</sub> = dv/dt et a<sub>n</sub> = v²/r ; mouvement circulaire **uniforme** : a<sub>t</sub> = 0, a⃗ = (v²/r) u⃗<sub>n</sub>, normal à la trajectoire (centripète).
- **Gravitation universelle** : F⃗<sub>A/B</sub> = G m<sub>A</sub> m<sub>B</sub>/d² u⃗<sub>BA</sub> (u⃗<sub>BA</sub> unitaire de B vers A ; G = 6,67 × 10<sup>−11</sup> N·m²·kg<sup>−2</sup> ; d entre les centres ; corps à répartition sphérique de masse).
- **Satellite en orbite circulaire** (référentiel géocentrique, rayon r = R<sub>T</sub> + h ; **démonstrations à savoir faire**, à reprendre pas à pas) :
  1. accélération : deuxième loi, m a⃗ = G m M<sub>T</sub>/r² u⃗<sub>n</sub> ⟹ a⃗ = G M<sub>T</sub>/r² u⃗<sub>n</sub> ;
  2. **nature du mouvement** : en identifiant avec a⃗ = (dv/dt) u⃗<sub>t</sub> + (v²/r) u⃗<sub>n</sub> : dv/dt = 0 ⟹ v constante : **mouvement uniforme** ;
  3. **vitesse** : v²/r = G M<sub>T</sub>/r² ⟹ **v = √(G M<sub>T</sub>/r)** (indépendante de la masse du satellite) ;
  4. **période** : T = 2πr/v ⟹ **T = √(4π² r³/(G M<sub>T</sub>))** (indépendante de la masse).
- **Lois de Kepler** (référentiel héliocentrique) :
  1. **loi des orbites** : ellipse dont le Soleil est un foyer (demi-grand axe a, second foyer) ;
  2. **loi des aires** : aires égales balayées en des durées égales ⟹ plus la planète est proche du Soleil, plus elle va vite ;
  3. **loi des périodes** : T²/a³ = k pour tous les corps tournant autour du même astre (s²·m<sup>−3</sup>) ; **retrouvée dans le cas circulaire** : T²/r³ = 4π²/(G M<sub>T</sub>).
- **Satellite géostationnaire** : fixe par rapport à un point de la surface (immobile dans le référentiel terrestre) : orbite dans le **plan de l'équateur** et **période de 24 h** (rotation de la Terre) ; rayon donc fixé (troisième loi) : altitude 35 800 km. **Deux formulations du cours à corriger** : « il a ainsi la même vitesse que celle de rotation de la Terre » → « la même **vitesse angulaire** (il fait un tour en 24 h) » ; « puisque sa vitesse est fixée, le rayon l'est aussi » → « puisque sa **période** est fixée ». (La période de rotation exacte est le jour sidéral, 23 h 56 min : à mentionner en bulle seulement si un exercice l'utilise.)
- **Sujet de bac 2013** (h = 35 800 km, R<sub>T</sub> = 6370 km, M<sub>T</sub> = 5,972 × 10<sup>24</sup> kg) : mouvement uniforme ; v = √(G M<sub>T</sub>/(R<sub>T</sub> + h)) ≈ 3,07 × 10³ m·s<sup>−1</sup> ; T ≈ 8,62 × 10<sup>4</sup> s ≈ 24 h : géostationnaire.

## Plan de l'application (`PLAN`)

### Module 1 : Satellite en orbite circulaire

- Cours (sous-modules) : rappels de Frenet (**lien facultatif vers `cinematique/`**, module du mouvement circulaire) ; gravitation universelle ; démonstration « mouvement uniforme » ; vitesse ; période (avec `EQ` pour isoler v, T, r ou M ; démonstration de T à partir de v).
- **Simulateur : satellite en orbite** (page `simulation`, un écran) : Terre (ou autre astre : Mars, Jupiter, Soleil) ; altitude réglable ; satellite qui tourne à la vitesse calculée ; vecteurs v⃗ et a⃗ (`VEC`) et F⃗ ; v, T, a affichés ; masse du satellite réglable (rien ne change : défi « montrer que v ne dépend pas de m ») ; **géostationnaire** : vue depuis la Terre qui tourne, le satellite reste au-dessus du même point quand T = 24 h et l'orbite équatoriale. Défis : trouver l'altitude géostationnaire ; ISS (h ≈ 400 km : T ≈ 1 h 30) ; doubler r et comparer T (× 2√2).
- Série : expressions et valeurs de v et T, masse d'un astre à partir de T et r, vecteurs dans le repère de Frenet, géostationnaire (conditions), lecture de données (satellites de Jupiter…).

### Module 2 : Lois de Kepler

- **Animations : les trois lois de Kepler** (`module_2_simulation.html`, page `simulation` « Animation : lois de Kepler », un écran, trois onglets) — consigne du professeur :
  1. **Loi des orbites** : l'ellipse se construit (méthode du jardinier : les deux foyers, la somme des distances constante) ; excentricité réglable (de 0, cercle, à des ellipses très allongées) ; le Soleil sur un foyer, le second foyer vide ; demi-grand axe a marqué ;
  2. **Loi des aires** : la planète parcourt l'ellipse (vitesse calculée par la loi des aires, intégration numérique ou équation de Kepler) ; à intervalles de temps égaux, les **secteurs balayés** se colorent (deux ou plusieurs secteurs comparés, aires chiffrées égales) ; vecteur vitesse dont la longueur varie ; défis : comparer la vitesse au périhélie et à l'aphélie, retrouver que les aires sont égales ;
  3. **Loi des périodes** : plusieurs planètes (vraies données du Système solaire, ou satellites de Jupiter) tournent ensemble à l'échelle des temps ; tableau T, a, T²/a³ qui se remplit ; **graphique T² = f(a³)** : droite passant par l'origine, régression (comme un tableur ou Python, compétence du bac) ; défis : prévoir la période d'une planète fictive placée à a donné ; trouver la masse du Soleil à partir de la pente (4π²/(GM)).
  - Lien facultatif vers la vidéo du CEA (`video.txt`).
- Cours : les trois lois, conséquence de la loi des aires, troisième loi retrouvée dans le cas circulaire, satellite géostationnaire et troisième loi.
- Série : lire une ellipse (foyer, demi-grand axe), vitesse au périhélie / aphélie, T²/a³ constant, calculer T ou a, masse de l'astre central, régression (pente).

### Module 3 : Exercices

Exercices de la feuille, avec sa numérotation, puis le sujet de bac 2013 du cours (lettre A). Contextes de bac à privilégier pour la correction guidée : masse d'un astre par deux méthodes, transit d'une exoplanète, choix d'une orbite géostationnaire (`competences.md`).

## Vérifications propres

- Script : bac 2013 (v ≈ 3,07 × 10³ m·s<sup>−1</sup>, T ≈ 8,62 × 10<sup>4</sup> s), chaque exercice, données du Système solaire utilisées (T²/a³ constant à 1 % près).
- Animations : un écran ; loi des aires respectée numériquement (aires égales à 1 % près) ; reduced-motion.
