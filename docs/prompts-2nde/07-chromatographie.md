Lis `docs/prompts-2nde/00-commun.md`, puis exécute ce prompt.

# 07 · Chromatographie sur couche mince (A01)

## 1. Application

- Nom : **« Chromatographie sur couche mince »** ; dossier `chromatographie/` ; préfixe `cc`, espace de noms `CC` ; `data-matiere="chimie"` ; kicker « Chimie · Seconde ».
- Portail : `dom: 'chimie'`, `desc: "Réaliser une CCM pas à pas, puis lire un chromatogramme : corps pur, mélange, espèces identifiées."`
- Dessin d'en-tête : **nouveau dessin `ccm`** dans `assets/hero.js` : plaques de chromatographie (trait de dépôt, taches à différentes hauteurs reliées par des pointillés, front de l'éluant), une cuve avec son couvercle.
- Cette application crée l'outil **`CCM`** (`chromatographie/modules/ccm.js`), réutilisé par `12-synthese.md`.

## 2. Objectif et programme

Indispensable I3. Capacités exigibles :
- « Mesurer une température de changement d'état, déterminer la masse volumique d'un échantillon, **réaliser une chromatographie sur couche mince**, mettre en œuvre des tests chimiques, pour identifier une espèce chimique et, le cas échéant, qualifier l'échantillon de mélange. »
- « Distinguer un mélange d'un corps pur à partir de données expérimentales. »
- « Réaliser le schéma légendé d'un montage à reflux et d'une chromatographie sur couche mince. »

## 3. Ce que dit le cours

Sources : `2- Corps purs et melanges/Chap02-Cours complete.pdf` p. 2, `TP2 - CCM.pdf`, `Chap02-Exercices.pdf` (exercices 1 et 2) et `Chap02-Exercices-correction.pdf` p. 1, `Devoir corps purs et melanges correction.pdf` p. 2-3 (exercice 4).

**Choix de l'enseignant** : **espèces fictives (A, B, C…) dans l'animation, vrais noms dans l'entraînement** ; **rapport frontal R<sub>f</sub> en complément facultatif, noté « Pour aller plus loin »** (ni dans le cours, ni exigible) ; **plaque de silice seulement** (pas de papier Whatman).

- **Légendes du schéma** (correction du devoir, à employer telles quelles) : **couvercle**, **cuve à élution**, **phase stationnaire** (la plaque), **dépôts**, **trait de dépôt**, **éluant (ou phase mobile)**. L'application ajoute **front de l'éluant** (vocabulaire des TP). Les énoncés disent aussi « ligne de dépôt » : accepte-le dans les textes, écris « trait de dépôt ».
- **Plaque de silice** (TP2 II) : « une plaque d'aluminium recouverte d'une fine couche de silice ; cette couche est fragile ; le trait de dépôt doit être fait **doucement** avec un **crayon à papier gras**, **sans creuser** la plaque » ; « pour déposer une espèce solide, il faut d'abord la dissoudre dans un peu de solvant (ici de l'éthanol) » ; « l'éluant est un mélange de produits **toxiques** : les cuves doivent rester sous une hotte, avec un couvercle » ; « si des espèces chimiques sont incolores, on peut les voir en plaçant la plaque **sous une lampe à UV** ; il faut alors **entourer les taches** ainsi révélées au crayon à papier ».
- **Principe** (correction de l'exercice 2) : « Lors de la chromatographie, l'éluant monte en entraînant avec lui les espèces présentes dans le dépôt. Les différentes espèces sont plus ou moins entraînées et montent à des hauteurs différentes. On peut ainsi séparer et identifier les constituants d'un mélange. »
- **Analyser un chromatogramme « en justifiant toujours »** (cours p. 2, figure : dépôts 1, 2, 3, taches de même hauteur reliées par des **pointillés**) :
  - « 1 et 2 sont des **corps purs car ils ne donnent qu'une seule tache** » ;
  - « 3 est un **mélange** de 1 et 2 **car il donne des taches aux mêmes hauteurs**, et d'une autre espèce inconnue ».
- **Rédactions des corrections** (à reprendre mot pour mot dans les expressions à piocher) :
  - « L'huile essentielle est un mélange car elle donne plusieurs taches. »
  - « Elle contient du limonène et du citral car elle donne des taches aux mêmes hauteurs que ces espèces. »
  - « Elle ne contient pas de carvone car elle ne donne pas de tache à la même hauteur que la carvone. »
  - « La menthone, le menthol, l'eucalyptol et le menthofuranne sont purs car ils donnent une seule tache. » ; « L'huile essentielle est un mélange constitué de 5 espèces car elle donne 5 taches. »
  - « La pastille contient **au moins** 5 espèces chimiques car elle donne 5 taches. » ; « on peut aussi conclure que S ne contient ni citral ni limonène ».
- **Espèces réelles des énoncés** (pour l'entraînement) : menthe poivrée (menthone, menthol, eucalyptol, menthofuranne, huile essentielle) ; pastille rafraîchissante (citral, menthol, eucalyptol, limonène) ; huile essentielle d'orange (limonène, carvone, myrcène, citral) ; médicaments du TP2 (Brufen 400 : ibuprofène ; Aspirine UPSA : acide acétylsalicylique, l'aspirine ; Doliprane 500 : paracétamol ; « je suis allergique à l'aspirine : quel(s) médicament(s) puis-je utiliser ? »). Hauteurs des taches : à fixer dans `ccm.js` d'après les figures des exercices (pas de valeurs réelles à respecter, seulement des hauteurs distinctes et lisibles).

À relire seulement pour refaire les chromatogrammes : figure du cours p. 2, exercices 1 et 2, devoir exercice 4 (avec les pointillés de la correction).

## 4. Plan de l'application (`PLAN`)

### Module 1 : Réaliser une CCM (animation, `module_1_simulation.html`)

Libellé : « Animation : réaliser une CCM ». Espèces **fictives** : références A, B, C, D (corps purs ; A et C colorées, B et D incolores) et mélanges M (A + C) et N (B + D + une espèce inconnue X).

Gestes, dans l'ordre du TP (un geste hors de l'ordre est refusé avec son explication) :
1. **Tracer le trait de dépôt** au crayon, doucement, à 1 cm du bas de la plaque (glisser le crayon d'un bord à l'autre, ou bouton « Tracer ») ; refus si trop bas : « Le trait de dépôt doit rester au-dessus de l'éluant. »
2. **Choisir et placer les dépôts** sur le trait (toucher un flacon puis un emplacement ; 2 à 5 dépôts, espacés) ; nommer chaque dépôt sous le trait.
3. **Verser l'éluant** dans la cuve, sous la hotte (curseur du niveau) ; **poser la plaque**, **fermer le couvercle**. Si l'éluant dépasse le trait de dépôt : l'animation montre les dépôts qui se dissolvent dans l'éluant, message « Les dépôts se sont dissous dans l'éluant : le niveau de l'éluant doit rester sous le trait de dépôt. », « ↺ Recommencer ». Couvercle oublié : refus « L'éluant est toxique et s'évapore : on ferme la cuve. »
4. **Élution** : Lecture / Pause / vitesse (× 0,5, × 1, × 2) / Recommencer : le front de l'éluant monte, chaque espèce monte avec lui à sa propre vitesse (les espèces se séparent) ; on peut sortir la plaque quand le front est à 1 cm du haut (bouton « Sortir la plaque » ; avant : refus « attends que l'éluant soit presque en haut »).
5. **Repérer le front de l'éluant** : tracer un trait au crayon à sa hauteur (glisser, ou ▲ ▼).
6. **Révéler sous la lampe UV** : la plaque passe sous la lampe (fond éclairé), les taches incolores apparaissent ; l'élève **entoure chaque tache** en la touchant (cercle au crayon) ; les taches disparaissent quand on éteint la lampe, les cercles restent.
7. **Légender le schéma** du dispositif avec les étiquettes à glisser : couvercle, cuve à élution, phase stationnaire, dépôts, trait de dépôt, éluant (phase mobile), front de l'éluant.
- Bilan : le chromatogramme obtenu, et la phrase du principe (correction de l'exercice 2).

### Module 2 : Lire un chromatogramme (manipulation guidée, `module_2_manip.html`)

Espèces fictives (1, 2, 3 ou A, B, M, comme dans le cours) ; 6 situations, dont celle du cours (1 et 2 purs, 3 mélange de 1, de 2 et d'une espèce inconnue).
- Questions types : « Ce dépôt est-il un corps pur ? », « Quels sont ses constituants ? », « Telle espèce est-elle présente ? ».
- L'élève **touche une ou plusieurs taches** : quand deux taches sont à la même hauteur, un trait en **pointillés** les relie, comme dans le cours.
- Il **construit sa conclusion** en touchant des expressions à piocher, dans l'ordre : « M est un corps pur » / « M est un mélange » / « M contient l'espèce A » / « M ne contient pas l'espèce B » / « M contient une espèce non identifiée » / « M contient au moins 3 espèces », puis « car », puis « il ne donne qu'une seule tache » / « il donne plusieurs taches » / « il donne une tache à la même hauteur que A » / « il ne donne pas de tache à la même hauteur que B » / « aucune référence ne donne de tache à cette hauteur ». La phrase se compose dans une zone dédiée ; « Effacer » et « Vérifier ».
- Erreurs à diagnostiquer :
  - **conclusion sans justification** : « Justifie toujours : ajoute « car » et ce que montre le chromatogramme. » ;
  - **tache d'un mélange attribuée à une espèce absente des références** : « Aucune référence ne donne de tache à cette hauteur : cette espèce n'est pas identifiée. » ;
  - corps pur conclu pour un dépôt à plusieurs taches (et l'inverse) ;
  - « contient A » alors que la tache n'est pas à la même hauteur (les pointillés ne relient rien) ;
  - nombre exact d'espèces affirmé : « Deux espèces peuvent monter à la même hauteur : on écrit **au moins** 3 espèces. »
- **Pour aller plus loin : le rapport frontal** (section facultative en fin de page, ne compte pas pour marquer la page) : l'élève mesure, avec une règle glissable, la hauteur h d'une tache et la hauteur H du front, **toutes deux depuis le trait de dépôt**, puis R<sub>f</sub> = h / H ; deux plaques d'élution différente donnent le même R<sub>f</sub> pour la même espèce. Erreur à diagnostiquer : **hauteurs mesurées depuis le bas de la plaque** au lieu du trait de dépôt : « Les hauteurs se mesurent à partir du trait de dépôt, d'où partent les espèces. »

### Module 3 : Entraînement (série notée sur 20, `module_3_questions.html`)

10 chromatogrammes tirés au hasard, avec les **vrais noms** : menthe poivrée, pastille, orange, médicaments (dont la question « allergique à l'aspirine »), avec 2 à 4 références et 1 à 3 dépôts à analyser. Mêmes gestes qu'au module 2 (partie `'perso'`). Groupes en plus :
- légender le schéma (étiquettes du module 1) ;
- principe de la CCM et révélation des espèces incolores (QCM : lampe UV ; mauvais choix classiques : « on chauffe la plaque », « on attend que l'éluant sèche ») ;
- « Que signifie CCM ? ».
Après une erreur : l'explication, puis la bonne réponse. Pas de R<sub>f</sub> dans la série.

## 5. Rendu

- SVG. Plaque : rectangle `--sheet` à bord `--line` (couche de silice), trait de dépôt et cercles au crayon en `--ink-3`, taches en disques flous (`feGaussianBlur`) : espèces colorées en `--accent` (et nommées), espèces incolores invisibles hors de la lampe UV ; sous la lampe : fond de plaque `--cle-bg`, taches `--ink-2`.
- Cuve : verre (contour `--ink-2`), éluant `--paper-2`, couvercle ; front de l'éluant animé (bord légèrement ondulé).
- Pointillés entre taches de même hauteur : `--ink-2`, tirets.
- Expressions à piocher : pilules `btn-secondary` de 46 px, phrase construite dans un encadré `callout`.
- 1280 px : plaque et cuve à gauche, déroulé à droite ; 390 px : plaque pleine largeur, expressions dessous (sur plusieurs lignes).
- Animation : `requestAnimationFrame`, interrompue avec `prefers-reduced-motion` (étapes au bouton, état final de chaque étape).

## 6. Outils

- **À créer : `CCM`** (`chromatographie/modules/ccm.js` + styles dans `cc.css`) : `CCM.ESPECES` (fictives et réelles : nom, hauteur relative, colorée ou non) ; `CCM.plaque(zone, { depots, front, uv, interactif, pointilles })` → `{ svg, toucherTache, maj }` ; `CCM.animation(zone, options)` (élution) ; `CCM.analyser(depots, references)` (corps pur, constituants, inconnues) pour vérifier les conclusions. Écrit pour être chargé par `synthese/` (chemin `../../chromatographie/modules/ccm.js`) sans dépendre de `cc.js`.
- `assets/dragdrop.js` (étiquettes du schéma), `BULLE`.

## 7. Vérifications propres

- Chaque situation et chaque fabrique : taches de hauteurs distinctes de plus de 8 % de H quand elles sont différentes, identiques à 1 px près quand elles correspondent à la même espèce.
- `CCM.analyser` donne la conclusion attendue pour chaque situation des modules 2 et 3 (script).
- Animation : éluant au-dessus du trait → dissolution et recommencer ; ordre des gestes imposé ; UV ; légendes.
- Toucher des taches et des expressions au doigt (CDP) ; pointillés tracés seulement entre taches de même hauteur.

## 8. Hors périmètre

- Pas de papier Whatman ni de colorants alimentaires (choix de l'enseignant).
- R<sub>f</sub> seulement dans la section « Pour aller plus loin » du module 2.
- Pas de synthèse ni de comparaison espèce synthétisée / naturelle (application `12`).
