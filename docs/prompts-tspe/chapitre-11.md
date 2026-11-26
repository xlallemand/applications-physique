# Ondes sonores et effet Doppler (prompt de génération)

Lis d'abord `docs/prompts-tspe/00-commun.md` (sources, charte, structure, outils partagés, livraison).

## Application

- Dossier `ondes-doppler/`, nom « Ondes sonores et effet Doppler », `data-matiere="physique"`, préfixe `od`, espace de noms `OD` (l'application STI2D `ondes-sonores/` existe : ne pas confondre).
- Portail : `desc: "Célérité et retard, double périodicité, intensité et niveau sonores, atténuation, effet Doppler et Doppler-Fizeau."` ; `mots` : onde progressive, célérité, retard, période, fréquence, longueur d'onde, λ, c = λf, décibel, dB, intensité sonore, W/m², seuil d'audibilité, sonomètre, log, atténuation géométrique, absorption, Doppler, décalage Doppler, radar, échographie Doppler, redshift, blueshift, décalage vers le rouge, vitesse radiale…
- Dessin d'en-tête : celui de `ondes-sonores/` ou `double-periodicite/` (ondes), ou un nouveau `doppler` (fronts d'onde circulaires resserrés devant une source).
- **Prérequis** : `outils-communs.md` (outil `EQ`, pages externes ↗). Outils : `EQ`, `LG`, `BULLE`, `PLEIN` ; son par la Web Audio API (comme `ondes-sonores/` : regarde comment il produit le son).

## Sources (`11- Ondes sonores/`)

| Fichier | Contenu | À lire |
|---|---|---|
| `Chap11-Cours_ondes_sonores complete.pdf` (8 p.) | Cours tapé, complété à la main | Non : résumé ci-dessous. Pages 6 et 7 (démonstration du décalage Doppler, schéma du professeur) pour la figure |
| `Chap11-Exercices.pdf` (4 p.) | Ex. 1 à 15 (1 durées de propagation ; 2 oscillogramme ; 3 sismogramme ; 4 deux saxophones ; 5 milieu industriel ; 7 corne de brume ; 8 résolution de problème (atténuation) ; 10 comparer des fréquences ; 11 décalage Doppler en fréquence ; 12 expérience historique ; 15 spectre d'une étoile lointaine…) | Oui |
| `Chap11-Exercices-correction.pdf` (8 p.) | Corrections | Oui |
| `Son Doppler Voiture arret.mp3`, `Son Doppler Voiture marche.mp3`, `red shift.jpg` | Sons d'une voiture à l'arrêt et en marche ; image du décalage vers le rouge | Écoute / regarde pour t'en inspirer ; ne les copie pas dans l'application (droits inconnus) : le son se synthétise, le spectre se dessine |

Le TP (ultrasons, oscilloscope) n'est pas repris.

## Consignes du professeur

- **Double périodicité** : **lien vers l'application `double-periodicite/`** pour l'**inclure dans le parcours** sans la reprendre (page externe ↗, obligatoire).
- **Manipulation des équations avec log** (L = 10 log(I/I<sub>0</sub>), I = I<sub>0</sub> × 10<sup>L/10</sup>) : **comme pour « Force des acides et des bases »** (outil commun `EQ`, démonstration puis « À toi »).
- **Simulation de l'effet Doppler** pour la découverte et la compréhension : **visualisation des fronts d'onde** et **le son plus aigu ou plus grave** que l'on entend ; **intégrer aussi l'effet Doppler-Fizeau**.

## Contenu du cours (résumé)

### I. Rappels sur les ondes

- **Onde progressive** : propagation d'une perturbation sans transport de matière, avec transport d'énergie (houle : le bateau s'élève sans avancer).
- Ondes électromagnétiques (vide et matière) ; ondes mécaniques (matière seulement : houle, son, ondes sismiques).
- **Célérité** v = MM′/τ (m, s, m·s<sup>−1</sup>) ; application : avion à 9,92 km, c = 320 m·s<sup>−1</sup> → τ = 31 s.

### II. Ondes progressives sinusoïdales

- Onde périodique (période T = 1/f), sinusoïdale ; mesurer la fréquence de deux signaux.
- **Double périodicité** (▶ vidéo facultative : https://www.youtube.com/watch?v=5ZSnayfDMRk) : période temporelle T (s), fréquence f (Hz) ; période spatiale λ (m) : plus petite distance entre deux points en phase.
- **c = λ / T = λ × f** ; **la fréquence ne change pas d'un milieu à l'autre** ; célérité et longueur d'onde dépendent du milieu. Applications : 1500 m·s<sup>−1</sup>, T = 2,0 ms → λ = 3,0 m ; 20 kHz, 26,5 cm → 5,3 × 10³ m·s<sup>−1</sup> ; 21 m·s<sup>−1</sup>, 14 m → 1,5 Hz ; 7,2 km·h<sup>−1</sup>, 10 cm → 20 Hz.

### III. Ondes sonores et ultrasonores

- Audible de 20 Hz à 20 kHz (infrasons, ultrasons).
- **Intensité sonore** I = P / S (W·m<sup>−2</sup>, W, m²), liée à l'amplitude ; seuil d'audibilité I<sub>0</sub> = 10<sup>−12</sup> W·m<sup>−2</sup> ; seuil de douleur 25 W·m<sup>−2</sup>.
- **Niveau sonore L = 10 log(I / I<sub>0</sub>)** (dB, sonomètre) ; exemples : I<sub>1</sub> = 1,0 × 10<sup>−5</sup> W·m<sup>−2</sup> → 70 dB ; L<sub>2</sub> = 40 dB → I = 1,0 × 10<sup>−8</sup> W·m<sup>−2</sup>.
- **Intensité doublée : + 3 dB** (justification : 10 log(2I/I<sub>0</sub>) = 10 log 2 + L ≈ L + 3).
- **Les intensités s'additionnent, pas les niveaux** : 4 trompettes à 80 dB → 86 dB.
- **Atténuation géométrique** A = L<sub>proche</sub> − L<sub>éloigné</sub> (dB) ; exemple 1 : I = 7,3 × 10<sup>−2</sup> puis 2,5 × 10<sup>−3</sup> W·m<sup>−2</sup> → A ≈ 15 dB ; **exemple 2 (à savoir refaire)** : distance doublée → I divisée par 4 (I = P/(4πd²)) → A = 10 log 4 ≈ 6 dB.
- **Atténuation par absorption** A = L<sub>incident</sub> − L<sub>transmis</sub> ; note : I<sub>incidente</sub> = I<sub>transmise</sub> + I<sub>réfléchie</sub> + I<sub>absorbée</sub>.

### IV. Effet Doppler

- **Description** : émetteur et récepteur en mouvement relatif → la fréquence reçue est décalée ; E, R, f<sub>E</sub>, f<sub>R</sub>, **Δf = f<sub>R</sub> − f<sub>E</sub>** ; figures des fronts d'onde (E immobile : cercles concentriques, f<sub>R</sub> = f<sub>E</sub> ; E se rapproche : cercles resserrés devant, f<sub>R</sub> > f<sub>E</sub> ; E s'éloigne : f<sub>R</sub> < f<sub>E</sub>).
- **Expression (émetteur mobile, récepteur fixe, 1D)** : « formule sera fournie (pas à connaître) **mais à savoir démontrer** ». Démonstration du professeur (page 7, à reprendre fidèlement avec son schéma) : t = 0 premier bip émis, reçu en t<sub>1</sub> (d = v t<sub>1</sub>) ; à t<sub>2</sub> = T<sub>E</sub> second bip, E a avancé de d<sub>E</sub> = v<sub>E</sub> t<sub>2</sub>, reçu en t<sub>3</sub> ; « ⚠ important : d − d<sub>E</sub> = v (t<sub>3</sub> − t<sub>2</sub>) » ; T<sub>E</sub> = t<sub>2</sub>, T<sub>R</sub> = t<sub>3</sub> − t<sub>1</sub> ; T<sub>R</sub> = T<sub>E</sub>(1 − v<sub>E</sub>/v) = T<sub>E</sub>(v − v<sub>E</sub>)/v ; **f<sub>R</sub> = f<sub>E</sub> × v/(v − v<sub>E</sub>)** (« relation souvent utilisée ») ; **Δf = f<sub>E</sub> × v<sub>E</sub>/(v − v<sub>E</sub>)** ; homogénéité vérifiée.
- **Application** : klaxon 480 Hz, piéton perçoit 508 Hz (f′ > f donc la voiture se rapproche) : Δf = 28 Hz ; Δf(v − v<sub>E</sub>) = f<sub>E</sub>v<sub>E</sub> ⟺ v<sub>E</sub> = Δf × v/(f<sub>E</sub> + Δf) = 28 × 340/508 = 18,7 m·s<sup>−1</sup> = 67,5 km/h (manipulation d'équation à faire avec `EQ`).
- En 3D : seule compte la **vitesse radiale** (composante de v⃗<sub>E</sub> vers R).
- **Applications** : voiture qui passe ; **Doppler veineux** (ultrasons, vitesse du sang) ; **radar** (cinémomètre : émetteur et récepteur fixes, onde réfléchie par le véhicule) ; **Doppler-Fizeau** en astronomie : vitesse radiale d'une étoile par comparaison de son spectre d'absorption avec un spectre de référence ; s'éloigne → **décalage vers le rouge (redshift)** ; se rapproche → **vers le bleu (blueshift)**.

## Plan de l'application (`PLAN`)

### Module 1 : Ondes progressives

- Cours : définition, milieux, célérité et retard ; ondes sinusoïdales, c = λf, fréquence indépendante du milieu.
- **Page externe ↗** (type 2, obligatoire) : `double-periodicite/` (« Simulateur : double périodicité »), juste après le cours sur la double périodicité.
- Série : retard, célérité, λ, f, conversions (km/h, ms, kHz), lecture d'un oscillogramme ou d'un sismogramme (`LG`).

### Module 2 : Intensité et niveau sonores

- Cours (sous-modules) : intensité ; niveau sonore avec **`EQ`** (démonstration L = 10 log(I/I<sub>0</sub>) ⟺ I = I<sub>0</sub> × 10<sup>L/10</sup>, puis « À toi » : isoler I, comme le pH dans « Transformations acide-base » et « Force des acides et des bases ») ; + 3 dB ; addition des intensités ; atténuations géométrique (distance doublée : 6 dB, à savoir refaire) et par absorption.
- **Simulateur : sources et sonomètre** (page `simulation`, un écran) : nombre de sources identiques, distance au sonomètre (I = P/(4πd²)), paroi absorbante ; I et L en direct ; défis : + 3 dB, + 10 dB (×10 sources), distance doublée (− 6 dB), seuil de douleur.
- Série : L ↔ I, sources multiples, atténuations, diagnostics : niveaux additionnés, log oublié, I<sub>0</sub> mal écrit, 10<sup>L/10</sup> mal calculé.

### Module 3 : Effet Doppler

- **Simulateur : effet Doppler** (`module_3_simulation.html`, page `simulation` « Simulateur : effet Doppler », un écran) — consigne du professeur :
  - **vue de dessus** : la source (voiture, ambulance, train, avion, chauve-souris…) émet des **fronts d'onde circulaires** qui s'éloignent à la célérité v ; la source se déplace à v<sub>E</sub> réglable (0 à v, et au-delà pour montrer le « mur du son » en option) ; un ou deux **observateurs** (devant, derrière, sur le côté) placés au doigt ;
  - **le son entendu** par l'observateur choisi est joué (Web Audio, fréquence f<sub>R</sub> calculée en continu, intensité qui augmente quand la source approche) : plus **aigu** quand la source s'approche, plus **grave** quand elle s'éloigne ; bouton « Son » (coupé par défaut, rien ne se joue sans geste de l'élève) ; mode « passage » : la voiture passe devant l'observateur (son qui « tombe » au passage), comparable aux enregistrements du cours ;
  - en continu : f<sub>E</sub>, f<sub>R</sub>, Δf, λ devant et derrière, et la formule f<sub>R</sub> = f<sub>E</sub> × v/(v − v<sub>E</sub>) avec les valeurs ; mode « À trouver » (Δf masqué) ;
  - **onglet « Démonstration »** : le schéma du professeur (deux instants t = 0 et t = t<sub>2</sub>, distances d, d<sub>E</sub>, v(t<sub>3</sub> − t<sub>2</sub>)) animé pas à pas, pour **savoir démontrer** la formule ;
  - **onglet « Doppler-Fizeau »** : une étoile ou une galaxie dont la vitesse radiale se règle (approche / éloignement) ; son **spectre d'absorption** (raies de l'hydrogène, couleurs du visible, dessinées comme dans `spectres-etoiles/` : regarde son code) comparé au spectre de référence ; les raies glissent vers le rouge ou le bleu ; λ<sub>R</sub> = λ<sub>E</sub>(1 + v<sub>r</sub>/c) (approximation non relativiste, indiquée) ; mesure de Δλ et calcul de la vitesse radiale ;
  - **onglet « Radar et échographie »** (facultatif si la place manque) : onde réfléchie par un véhicule ou par le sang.
  - Défis dans n'importe quel ordre : entendre la différence devant / derrière ; rendre Δf nul (source immobile, ou observateur sur le côté : vitesse radiale nulle) ; doubler v<sub>E</sub> et comparer Δf ; trouver la vitesse de la voiture (480 → 508 Hz) ; trouver si une galaxie s'éloigne (redshift) et sa vitesse.
- Cours (après le simulateur) : description, démonstration (étapes du professeur, « À toi » sur les étapes), application (v<sub>E</sub> isolée avec `EQ`), vitesse radiale, applications, Doppler-Fizeau.
- Série : sens du décalage, f<sub>R</sub>, Δf, v<sub>E</sub> (isoler dans l'éditeur), redshift ou blueshift, vitesse radiale d'une étoile.

### Module 4 : Exercices

Ex. 1 à 15 de la feuille ; ex. 8 « résolution de problème (atténuation) » : question complexe guidée (§4 de `00-commun.md`).

## Vérifications propres

- Script : chaque application du cours (31 s ; 3,0 m ; 5,3 × 10³ m·s<sup>−1</sup> ; 1,5 Hz ; 20 Hz ; 70 dB ; 1,0 × 10<sup>−8</sup> W·m<sup>−2</sup> ; 86 dB ; 15 dB ; 6 dB ; 18,7 m·s<sup>−1</sup>) et chaque exercice.
- Simulateur Doppler : un écran ; aucun son sans geste ; f<sub>R</sub> calculée = fréquence jouée ; reduced-motion (fronts d'onde figés, mise à jour par étapes) ; Doppler-Fizeau : sens du décalage juste.
