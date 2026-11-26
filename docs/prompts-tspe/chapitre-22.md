# Photons et effet photoélectrique (prompt de génération)

Lis d'abord `docs/prompts-tspe/00-commun.md` (sources, charte, structure, outils partagés, livraison).

## Application

- Dossier `photons/`, nom « Photons et effet photoélectrique », `data-matiere="physique"`, préfixe `pho`, espace de noms `PHO`.
- Portail : `desc: "Effet photoélectrique, photon E = hν, travail d'extraction, fréquence seuil, cellules photovoltaïques et applications."` ; `mots` : photon, quantum, Planck, h, E = hν, hc/λ, électron-volt, eV, effet photoélectrique, Hertz, Hallwachs, Einstein, fréquence seuil, longueur d'onde seuil, travail d'extraction, énergie cinétique, électroscope, cellule photoélectrique, photovoltaïque, rendement, photorésistance, niveaux d'énergie, absorption, émission, dualité onde-particule, laser…
- Dessin d'en-tête : `spectre` ou un nouveau dessin `photons` (ondelettes qui frappent une plaque, électrons arrachés) si rien ne convient.
- Outils : `EQ` (isoler ν, λ, v), `BULLE`, `PLEIN` ; couleurs des rayonnements visibles comme `SP.rgb` de `spectres-etoiles/` (lis son code).

## Sources (`22- Photons/`)

| Fichier | Contenu | À lire |
|---|---|---|
| `Chap22-Photons complete.pdf` (4 p.) | Cours (pages 1 et 2, complétées à la main) puis **exercices** (pages 3 et 4 : ex. 1 bassine en cuivre ; ex. 2 lampe UV-C et zinc ; ex. 3 à 5 en images) | Non pour le cours (résumé ci-dessous ; page 1 pour la figure de l'expérience de Hallwachs et des trois cas) ; oui pour les exercices |
| `Chap22-Exercices_correction.pdf` (3 p.) | Corrections des ex. 1 à 5 | Oui |
| `2025-09-Metro-SI-J1-ExoA-Sujet-PanneauxPhotovoltaiques.pdf` + `…-Correction-…` | Sujet de bac (Métropole septembre 2025, exercice A) « panneaux photovoltaïques » et sa correction | Oui : exercice de bac (lettre A) |
| `Chargeur-solaire.pdf` + `Correction-chargeur solaire.pdf` | Exercice « chargeur solaire » et sa correction | Oui : exercice supplémentaire (lettre B) |

## Consignes du professeur

- **Faire un simulateur pour comprendre l'effet photoélectrique en reproduisant les observations expérimentales du cours** (les quatre observations ci-dessous et l'expérience de Hallwachs).

## Contenu du cours (résumé)

### I. L'effet photoélectrique

- **Définition** : émission d'électrons d'un matériau sous l'effet d'un rayonnement électromagnétique (observé en 1887 par Hertz : étincelles sur les électrodes de son détecteur d'ondes, dites plus tard hertziennes).
- **Expérience de Hallwachs** (figure à refaire) : une lame de zinc chargée négativement, reliée à un électroscope (feuilles écartées) ; éclairée par une source de lumière de longueur d'onde λ : selon λ, l'électroscope se décharge (les feuilles retombent) ou non.
- **Observations** (à reproduire dans le simulateur) ; note du professeur : « ν (nu) : fréquence (au lieu de f) ; λ = c/ν » :
  1. si la fréquence est **inférieure à la fréquence seuil** ν<sub>s</sub> (qui dépend du métal), **aucun électron** n'est arraché (λ > λ<sub>s</sub>) ;
  2. au-dessus, des électrons sont arrachés, **tous avec la même vitesse** (même énergie cinétique) ;
  3. si la **fréquence augmente**, le **nombre** d'électrons arrachés n'augmente pas mais leur **vitesse** (énergie cinétique) augmente ;
  4. si l'**intensité** de la lumière augmente, les électrons sont **plus nombreux** mais ont **toujours la même vitesse**.
- **Interprétation d'Einstein (1905)** : quantification de l'énergie lumineuse (prix Nobel 1921) ; la lumière est constituée de quanta d'énergie hν, les **photons** ; chaque photon peut arracher un électron si son énergie est suffisante (fréquence supérieure à la fréquence seuil).
- **Photon** : quantum d'énergie associé à un rayonnement électromagnétique ; **masse nulle** ; **vitesse c = 3,00 × 10<sup>8</sup> m·s<sup>−1</sup>** ; **énergie E = hν = hc/λ** (en J ; h = 6,63 × 10<sup>−34</sup> J·s).
- **Bilan énergétique** (manuscrit, encadré) : **hν = W<sub>ext</sub> + E<sub>c</sub>** : « énergie du photon incident = énergie pour arracher un électron + énergie cinétique que gagne l'électron (= le reste) », E<sub>c</sub> = ½ m<sub>électron</sub> v<sub>électron</sub>² ; **W<sub>ext</sub> = hν<sub>seuil</sub>**.

### II. Applications

- **Cellule photoélectrique** (courant sous l'effet de la lumière) ; **cellule photovoltaïque** (énergie lumineuse → électrique), **rendement η = P<sub>électrique produite</sub>/P<sub>lumineuse reçue</sub>** (puissances ; « ou avec l'énergie η = E<sub>élec</sub>/E<sub>lum</sub> ») ; **photorésistance** ; **spectroscopie UV-visible** (absorption : excitation entre niveaux d'énergie quantifiés).
- **Rappel** : niveaux d'énergie d'un atome (niveau fondamental, le plus bas ; niveaux excités) ; absorption et émission (désexcitation) d'un photon : **hν = E<sub>2</sub> − E<sub>1</sub>** ; énergies en eV (1 eV = 1,60 × 10<sup>−19</sup> J).
- Compléments de `competences.md` à évoquer brièvement (bulles ou une étape de cours) : DEL, capteurs de lumière, spectroscopie IR, **dualité onde-particule**, principe du **laser** (absorption, émission spontanée, émission stimulée, pompage optique).

## Plan de l'application (`PLAN`)

### Module 1 : L'effet photoélectrique

- **Simulateur : effet photoélectrique** (`module_1_simulation.html`, page `simulation` « Simulateur : effet photoélectrique », en tête du module, un écran) — consigne du professeur :
  - **onglet « Hallwachs »** : la lame de zinc chargée négativement sur l'électroscope ; la lampe (choix : lampe à vapeur de mercure avec ou sans plaque de verre qui arrête les UV, lumière visible, UV-C) ; les feuilles de l'électroscope retombent ou non ; une plaque de verre interposée arrête l'effet (le verre absorbe les UV) ; lame chargée positivement : rien ne se passe (les électrons arrachés sont rattirés) ;
  - **onglet « Plaque de métal »** (figure des trois cas du cours) : une plaque d'un métal choisi (zinc, cuivre, césium, potassium, sodium… avec leur W<sub>ext</sub>) ; un rayonnement dont on règle **la fréquence ν ou la longueur d'onde λ** (curseur avec la couleur du visible, les UV, l'IR) et **l'intensité** (nombre de photons par seconde, flux de petits paquets ondulés) ; les **photons** arrivent (paquets), les **électrons arrachés** partent avec une flèche dont la longueur représente leur vitesse ; compteurs en continu : énergie d'un photon hν (J et eV), W<sub>ext</sub>, E<sub>c</sub> = hν − W<sub>ext</sub>, v, nombre d'électrons par seconde ;
  - **onglet « Graphique »** : E<sub>c</sub> en fonction de ν pour le métal choisi (droite de pente h, qui coupe l'axe en ν<sub>s</sub>) ; superposer plusieurs métaux (droites parallèles) ; mesure de h et de W<sub>ext</sub> (comme l'expérience de Millikan, citée en bulle) ;
  - **défis « À essayer »** = les **quatre observations du cours**, chacune cochée quand l'élève la réalise (sous le seuil rien, même avec une intensité énorme ; au-dessus, tous les électrons ont la même vitesse ; fréquence ↗ → vitesse ↗, nombre inchangé ; intensité ↗ → nombre ↗, vitesse inchangée), plus : trouver la fréquence seuil du zinc ; expliquer pourquoi la plaque de verre arrête l'effet ; retrouver W<sub>ext</sub> = hν<sub>s</sub> ;
  - **questions** dans le panneau : « le modèle ondulatoire prévoyait que… ; qu'observe-t-on ? » (pourquoi l'intensité ne suffit pas : argument d'Einstein).
- Cours (sous-modules) : définition et histoire ; observations ; le photon (E = hν = hc/λ, eV ; avec `EQ` : λ ↔ ν ↔ E) ; bilan énergétique hν = W<sub>ext</sub> + E<sub>c</sub>, W<sub>ext</sub> = hν<sub>s</sub>, vitesse des électrons (`EQ` : isoler v).
- Série : énergie d'un photon (J, eV), λ<sub>s</sub> et ν<sub>s</sub>, effet observable ou non, E<sub>c</sub> et v des électrons (icône calculatrice), interprétation des observations, conversion eV ↔ J.

### Module 2 : Interaction photon-matière et applications

Cours : niveaux d'énergie (absorption, émission, hν = E<sub>2</sub> − E<sub>1</sub>), spectroscopie UV-visible, cellule photoélectrique, **cellule photovoltaïque et rendement** (puissance ou énergie), photorésistance, DEL, laser (bulle), dualité onde-particule. Lien facultatif vers l'application STI2D `energie-lumiere/` (niveaux d'énergie, caractéristique d'un panneau) si elle a un module adapté (lis son `PLAN`). Série : transitions (λ émise ou absorbée), rendement d'une cellule, puissance lumineuse reçue (éclairement × surface), choix d'un capteur.

### Module 3 : Exercices

Ex. 1 à 5 de la feuille (pages 3 et 4 du document de cours), puis le **sujet de bac « panneaux photovoltaïques »** (Métropole septembre 2025, lettre A) et l'exercice **« chargeur solaire »** (lettre B), guidés avec leurs corrections.

## Vérifications propres

- Script : ex. 1 (ν<sub>s</sub>(Cu) = W<sub>ext</sub>/h ≈ 1,14 × 10<sup>15</sup> Hz ; E<sub>c</sub> ≈ 1,91 × 10<sup>−17</sup> J ≈ 120 eV ; v ≈ 6,5 × 10<sup>6</sup> m·s<sup>−1</sup>), ex. 2 et chaque exercice, sujet de bac compris.
- Simulateur : un écran à 1280 × 720 / 650 et 390 × 844 ; les quatre observations réalisables dans n'importe quel ordre ; E<sub>c</sub> affichée = hν − W<sub>ext</sub> ; reduced-motion (flux de photons figé, mise à jour au réglage).
