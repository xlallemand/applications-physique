# Circuit RC (prompt de génération)

Lis d'abord `docs/prompts-tspe/00-commun.md` (sources, charte, structure, outils partagés, livraison).

## Application

- Dossier `circuit-rc/`, nom « Circuit RC », `data-matiere="physique"`, préfixe `crc` (`rc` est celui de « Rappels de chimie »), espace de noms `CRC`.
- Portail : `desc: "Condensateur, q = Cu, capteurs capacitifs, équation différentielle, charge et décharge, temps caractéristique τ = RC."` ; `mots` : condensateur, capacité, farad, armature, charge, i = dq/dt, i = C du/dt, convention récepteur, convention générateur, loi des mailles, loi des nœuds, équation différentielle, exponentielle, constante de temps, tau, 63 %, 37 %, 5τ, tangente à l'origine, asymptote, régime transitoire, permanent, capteur capacitif, écran tactile, microcontrôleur…
- Dessin d'en-tête : `circuit` (existe, créé pour `montage-electrique/`) ou une courbe de charge.
- **Prérequis** : `outils-communs.md` (`EQ`). Outils : `MONTAGE` (`assets/montage.js`, schémas de circuits ; lis son en-tête), `EQ`, `LG`, `BULLE`, `PLEIN`.

## Sources (`14- RC/`)

| Fichier | Contenu | À lire |
|---|---|---|
| `Chap14-Cours_RC_complete.pdf` (8 p.) | Cours tapé (démonstrations complètes), annoté à la main | Non : résumé ci-dessous. Page 4 (documents sur les capteurs capacitifs), pages 6 à 8 pour les figures (tangente, 37 %, 63 %, interrupteur 3 voies, créneau) |
| `Chap14-Exercices.pdf` (4 p.) | Ex. 1 à 17 (en images) | Oui |
| `Chap14-Exercices_correction.pdf` (10 p.) | Corrections manuscrites | Oui |
| `2022-Amsud-J2-Exo1-Sujet-Airbag-10pts.pdf`, `2022-AmSud-J2-Exo1-Correction-Airbag-10pts.pdf` | Sujet de bac (Amérique du Sud 2022) « Airbag » et sa correction | Oui (`pdftotext`, puis figures) : exercice de bac de l'application |

Les TP (RC, microcontrôleur) ne sont pas repris.

## Consignes du professeur

- **Lien vers `montage-electrique/`** pour qui veut travailler le montage électrique (lien facultatif, type 1).
- **Animation montrant le fonctionnement de quelques capteurs capacitifs.**
- **Mêmes outils pour manipuler les équations que dans `equations-physique-mobile`** (outil commun `EQ` : exponentielle, ln, isoler t dans u = E(1 − e<sup>−t/τ</sup>), RC…).
- **Simulateur pour exploiter la charge ou la décharge d'un condensateur** : le **montage visible**, le **graphique u<sub>C</sub>(t)** affiché, et les **manipulations sur le graphique pour trouver les grandeurs** (τ avec la **tangente à l'origine**, **valeur à t = 0**, valeur de l'**asymptote**…).

## Contenu du cours (résumé)

### I. Grandeurs électriques fondamentales

- Courant : régime permanent I = Q/Δt (1 A = 1 C·s<sup>−1</sup>) ; régime variable **i = dq/dt** (intensité algébrique selon le sens choisi).
- **Conventions** : récepteur (u et i de sens opposés, p = ui > 0 absorbée) ; générateur (même sens, p = ui > 0 fournie).
- **Étude d'un circuit** : i identique avant et après un dipôle ; tension constante le long d'un fil ; **loi des nœuds** ; **loi des mailles** (« la tension entre deux points est la même quel que soit le chemin ») ; **ordre à suivre à chaque fois** : 1. i au générateur (convention générateur) ; 2. intensités dans les mailles (loi des nœuds) ; 3. tensions aux bornes de chaque dipôle (convention récepteur) ; 4. lois des mailles.
- Ampèremètre en série, voltmètre et oscilloscope en dérivation (masse, CH1, CH2) ; visualiser un courant : tension aux bornes d'une résistance.

### II. Dipôles

- **Résistance** : u = Ri ; P = Ri².
- **Condensateur** : « condensation de l'électricité » (▶ vidéo facultative : https://www.youtube.com/watch?v=A-0Wf2xaYa0) ; deux armatures conductrices séparées par un isolant ; charges opposées q et −q ; **q sur l'armature où arrive i** ; capacité C en farads ; **q = C u<sub>C</sub>** ; **i = dq/dt = C du<sub>C</sub>/dt** ; en régime continu i = 0 (interrupteur ouvert). Notes du professeur, à reprendre dans le cours et la fiche : « 1<sup>re</sup> chose à retenir : le schéma : i et u<sub>C</sub> opposés, +q sur la plaque où arrive i ; 2<sup>e</sup> : la formule q = Cu (se prononce « Q = Cu ») ; 3<sup>e</sup> : savoir retrouver i = … = C du<sub>C</sub>/dt ».
- **Capteurs capacitifs** : capacités usuelles du nF au µF ; C augmente avec la surface S, diminue avec la distance ℓ, dépend de l'isolant (permittivité ε) ; **C = εS/ℓ** (pas à connaître, fournie ; « si S est × 2, C est × 2 ; si ℓ est × 2, C est ÷ 2 ») ; capteur de **remplissage** (cuve : le liquide remplace l'air entre les armatures), **écran tactile** (le doigt modifie localement la capacité d'une grille), et d'après `competences.md` : humidité du sol, télépéage, pression, déplacement.

### III. Circuit RC série (« à savoir refaire intégralement à chaque fois »)

- **Décharge** (u<sub>C</sub>(0) = E, R en série, interrupteur fermé à t = 0) : méthode : 1. loi des mailles ; 2. formules du condensateur → équation différentielle en u<sub>C</sub> ; 3. résolution avec une condition initiale. u<sub>C</sub> + Ri = 0, i = C du<sub>C</sub>/dt ⟹ **du<sub>C</sub>/dt + u<sub>C</sub>/τ = 0** avec **τ = RC** (unité de RC : s, question du cours) ; solution u<sub>C</sub> = A e<sup>−t/τ</sup>, u<sub>C</sub>(0) = E ⟹ A = E : **u<sub>C</sub>(t) = E e<sup>−t/τ</sup>**. Allure de l'exponentielle, limites, valeur en 0, dérivée. **Au bac** : on fait établir l'équation, puis **vérifier** qu'une expression proposée est solution et trouver A.
- **Temps caractéristique** : la tangente à l'origine coupe l'axe des abscisses en t = τ ; à t = τ, déchargé à 63 %, u<sub>C</sub>(τ) = 0,37 E (justification : e<sup>−1</sup> ≈ 0,37) ; après 5τ, déchargé à plus de 99 %.
- **Charge** (u<sub>C</sub>(0) = 0, générateur E) : u<sub>C</sub> + Ri = E ⟹ **du<sub>C</sub>/dt + u<sub>C</sub>/τ = E/τ** ; u<sub>C</sub> = A e<sup>−t/τ</sup> + E ; u<sub>C</sub>(0) = 0 ⟹ A = −E : **u<sub>C</sub>(t) = E(1 − e<sup>−t/τ</sup>)** ; régime transitoire, régime permanent ; **au bac** : vérifier que A e<sup>−t/τ</sup> + B est solution, trouver A et B. La tangente à l'origine coupe l'asymptote u<sub>C</sub> = E en t = τ ; u<sub>C</sub>(τ) = 0,63 E ; u<sub>C</sub>(5τ) = 0,99 E.
- ⚠ **Erreur du cours à corriger** : « la solution de y′ = ay + b est y = A e<sup>at</sup> + b/a » : c'est **y = A e<sup>at</sup> − b/a**. Dans l'application, écris l'équation sous la forme du cours **du/dt + u/τ = E/τ**, dont la solution est **u = A e<sup>−t/τ</sup> + E** (la solution particulière constante vérifie u/τ = E/τ), sans formule générale ambiguë ; si tu cites la forme mathématique, écris-la juste.
- **Charge et décharge dans un même circuit** : interrupteur trois voies (position 1 : charge, position 2 : décharge) ; générateur de tension en créneaux.

## Plan de l'application (`PLAN`)

### Module 1 : Lois des circuits (rappels)

Cours court : conventions, ordre à suivre (4 étapes), lois des nœuds et des mailles, appareils de mesure. **Lien facultatif** : `montage-electrique/` (réaliser un montage). Série : placer flèches et lois sur un schéma (`MONTAGE`), brancher l'oscilloscope.

### Module 2 : Le condensateur et les capteurs capacitifs

- Cours : constitution, q = Cu<sub>C</sub>, i = C du<sub>C</sub>/dt (les trois choses à retenir du professeur), ordres de grandeur, C = εS/ℓ.
- **Animation : capteurs capacitifs** (`module_2_simulation.html`, un écran, onglets) — consigne du professeur : **remplissage d'une cuve** (le niveau x monte, la capacité suit, graphique C = f(x)) ; **écran tactile** (grille de condensateurs, le doigt touche, la capacité d'un nœud change, la position est détectée) ; **clavier ou capteur de déplacement** (distance ℓ qui change) ; **humidité** (permittivité qui change). Dans chaque onglet : S, ℓ, ε et C en direct (C = εS/ℓ fournie), et ce que « voit » le circuit de mesure. Défis : doubler C de trois façons ; trouver la hauteur de liquide à partir de C.
- Série : q = Cu, i = C du/dt (pente d'une droite u(t) → i), effet de S, ℓ, ε, conversions nF / µF, schéma (signe des charges, sens de i et u<sub>C</sub>).

### Module 3 : Charge et décharge d'un condensateur

- Sous-modules de cours : décharge (équation différentielle, résolution, τ) ; charge (idem) ; **vérifier qu'une expression est solution** (dérivée de e<sup>−t/τ</sup>, outil `EQ` ou étapes guidées) ; temps caractéristique (tangente, 63 %, 37 %, 5τ) ; calculer t pour atteindre une tension donnée (**`EQ`** : de u = E(1 − e<sup>−t/τ</sup>) à t = −τ ln(1 − u/E), outils ln / e<sup>x</sup>, comme `equations-physique-mobile`).
- **Simulateur : charge et décharge** (`module_3_simulation.html`, un écran) — consigne du professeur :
  - le **montage** visible (générateur E, interrupteur trois voies ou générateur en créneaux, R, C, oscilloscope ou microcontrôleur branché aux bornes de C), dessiné avec `MONTAGE` ; l'interrupteur se bascule au toucher ; charges +q / −q sur les armatures et courant animé (sens, intensité) ;
  - le **graphique u<sub>C</sub>(t)** (et, en option, u<sub>R</sub>(t) et i(t)) qui se trace en direct ; R, C, E réglables à tout moment ;
  - **outils de lecture sur le graphique** (`LG`) : **tangente à l'origine** (à placer en glissant, puis lire son intersection avec l'asymptote ou l'axe : τ) ; **valeur à t = 0** ; **asymptote** (à tracer, valeur E) ; **méthode des 63 % / 37 %** (placer 0,63 E sur l'axe, reporter sur la courbe, lire t) ; **5τ** ;
  - mode « À trouver » : R ou C masqué, l'élève le retrouve à partir de τ lu (τ = RC) ;
  - défis dans n'importe quel ordre : trouver τ par la tangente, puis par 63 % ; vérifier τ = RC ; doubler R et comparer ; trouver C inconnue ; atteindre le régime permanent (5τ) ; décharge : 37 %.
- Série : équation différentielle à établir (étapes à compléter), solution à vérifier, A et B, τ sur une courbe (tangente, 63 %, 37 %), τ = RC (unités), temps pour atteindre une tension (`EQ`), énergie stockée si un exercice l'utilise (½ C u², `competences.md`).

### Module 4 : Exercices

Ex. 1 à 17 de la feuille, puis le **sujet de bac « Airbag »** (Amérique du Sud 2022, J2, exercice 1 ; lettre A ou son titre) guidé par parties avec la correction officielle fournie.

## Vérifications propres

- Script : valeurs des exercices et du sujet de bac ; e<sup>−1</sup> = 0,368, 1 − e<sup>−1</sup> = 0,632, 1 − e<sup>−5</sup> = 0,993.
- Simulateur : un écran ; courbe calculée = solution exacte ; τ lu par la tangente à 3 % près ; tangente et repères au doigt ; reduced-motion.
- `EQ` : les outils ln et e<sup>x</sup> isolent t dans les deux expressions (charge, décharge).
