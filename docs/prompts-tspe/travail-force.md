# Travail d'une force (prompt de génération d'une application annexe)

Lis d'abord `docs/prompts-tspe/00-commun.md` (branche, charte, simulations §5, livraison).

## Pourquoi

Consigne du professeur (chapitre « Énergie ») : **faire une application de simulation pour le travail des forces**, en s'inspirant du simulateur existant **en l'améliorant** et en respectant **les nouvelles règles des simulations** : une seule page, manipulation libre, situations avec des questions (`00-commun.md` §5). Décision du professeur : c'est une **application à part**, utilisée par la Terminale spécialité (page externe ↗ du chapitre « Énergie et travail ») et par la Terminale STI2D (elle **remplace** le simulateur de `energie-cinetique/`).

(Le professeur cite `principe-dynamique/` ; le simulateur du travail est en fait dans **`energie-cinetique/modules/module_2_simulation.html`** : « Simulateur : travail d'une force », quatre étapes qui se débloquent, wagon tiré par cinq personnages, chariot réglable, quatre chemins. C'est lui qu'on reprend.)

## Application

- Dossier `travail-force/`, nom « Travail d'une force », `data-matiere="physique"`, préfixe `tf`, espace de noms `TF`.
- Une **application d'un seul écran** (comme `double-periodicite/`) : `SOM.init({ nom, id, plan: [] }); SOM.menu('accueil');`, bouton plein écran dans le bandeau (`PLEIN.bouton()`), enregistrement de l'ouverture pour l'état de la page externe ↗ (`outils-communs.md` §2).
- Portail : `dom: 'physique'`, `niv: ['spe', 'sti']`, `desc: "Simulateur : W = F × AB × cos α, travail moteur, résistant ou nul, indépendant du chemin, travail du poids."` ; `mots` : travail, joule, W, cos, angle, force constante, déplacement, moteur, résistant, nul, perpendiculaire, chemin suivi, poids, mgh, altitude…
- Dessin d'en-tête : sans objet (application d'un écran) ; vignette du portail comme `double-periodicite/`.
- Outils : `VEC` (vecteurs), `BULLE`, `PLEIN`, `LG` si un graphique est tracé.

## Ce que le simulateur doit faire comprendre (consignes du professeur)

Situations avec questions, dans des onglets ou des défis « À essayer », **toutes accessibles à tout moment** :

1. **D'où vient la formule W = F × AB × cos α** :
   - W est **proportionnel à F** et **proportionnel à AB** (tableaux de mesures qui se remplissent tout seuls quand on fait varier F ou AB, graphique W = f(F), W = f(AB) : des droites passant par l'origine) ;
   - la dépendance en α est **celle de cos α** : une fonction **maximale pour 0°, nulle pour 90°, négative et minimale (« négative max ») pour 180°** : graphique W = f(α) qui se trace point par point quand on tourne la force, superposé à F × AB × cos α ;
   - **toujours en degrés** (jamais de radians, ni dans l'affichage ni dans les questions).
2. **Le travail ne dépend pas du chemin suivi** : pour une force constante, aller de A à B par plusieurs chemins (droit, en escalier, en arc, en zigzag, tracé libre par l'élève au doigt) donne le même travail ; la somme des travaux de chaque portion s'affiche.
3. **Travail nul pour une force perpendiculaire au déplacement** (α = 90° ; réaction normale, poids sur un trajet horizontal, force centripète d'un mouvement circulaire).
4. **Cas particulier du travail du poids** : décomposer le déplacement en un **mouvement horizontal** (W = 0, poids perpendiculaire) et un **mouvement vertical** (W = m g h, h altitude descendue) ; montée : W = −m g h (résistant) ; vérifier sur un trajet quelconque (toboggan, piste de ski, tracé libre) que W<sub>AB</sub>(P⃗) = m g (z<sub>A</sub> − z<sub>B</sub>).

## Écran (un seul, `00-commun.md` §5)

- **Figure** (gauche) : un objet qui se déplace de A à B (chariot, wagon sur des rails vu de dessus, skieur, caisse tirée), la force F⃗ (flèche à orienter en glissant sa pointe ou au bouton ± 1° / ± 15°), le vecteur AB⃗, l'angle α marqué en degrés, F, AB réglables (curseurs, glisser le point B) ; « Lancer » anime le déplacement et fait monter une jauge « énergie transmise » (positive, nulle ou négative, avec son texte : moteur / nul / résistant).
- **Panneau** (droite) : onglets « Formule » (F, AB, α, cos α, W en direct, W = F × AB × cos α avec les valeurs ; mode « À trouver » qui masque W pour le faire calculer), « Graphiques » (W = f(F), f(AB), f(α)), « Chemins », « Poids », « À essayer » (défis et questions), « Bilan ».
- **Reprends et améliore** ce qui existe dans `energie-cinetique/module_2_simulation.html` : le wagon et les cinq personnages (travail moteur, nul, résistant selon la direction de la corde), le chariot réglable, les quatre chemins ; mais **sans étapes qui se débloquent** : tout est accessible, les étapes deviennent des défis.
- Défis (exemples, à compléter) : rendre le travail nul ; obtenir le travail le plus grand pour F et AB donnés ; obtenir un travail résistant ; doubler W en changeant F, puis en changeant AB ; trouver α pour lequel W = F × AB / 2 (60°) ; montrer que deux chemins donnent le même travail ; calculer le travail du poids d'un skieur qui descend de 120 m ; vérifier que le poids ne travaille pas sur un trajet horizontal.
- Questions dans le panneau (QCM, valeur à calculer avec l'icône calculatrice, phrase à compléter) avec diagnostics : cos α oublié ; α mesuré par rapport à la verticale ; calculatrice en radians (« 0,15 au lieu de 0,87 : ta calculatrice est en radians, passe-la en degrés ») ; h compté positivement pour une montée ; signe du travail.

## `energie-cinetique/` après cette application

- Remplace sa page `module_2_simulation` par une **page externe ↗** vers `travail-force/` dans son `PLAN` (`00-commun.md` §6, type 2), sans changer le reste de l'application ; mets à jour `AVANCEMENT` et l'index de recherche. Les liens internes qui pointaient vers l'ancienne page pointent vers la nouvelle. Supprime l'ancienne page seulement si plus rien n'y renvoie.

## Vérifications propres

- Un écran à 1280 × 720 / 650 et 390 × 844 dans chaque onglet ; défis dans le désordre ; glisser au doigt (CDP), à la souris, boutons ± ; reduced-motion.
- Script : W pour des valeurs de contrôle (F = 10 N, AB = 1 m, α = 40° : 7,66 J ; pétrolier 100 kN, 2,0 km, 20° : 1,9 × 10<sup>8</sup> J).
- `energie-cinetique/` : sommaire, compteurs, portail toujours justes.
- Mets à jour `00-commun.md` §10 (ligne `travail-force.md`).
