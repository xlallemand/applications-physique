Lis `docs/prompts-2nde/00-commun.md`, puis exécute ce prompt.

# 12 · Synthèse et montage à reflux (A07)

## 1. Application

- Nom : **« Synthèse et montage à reflux »** ; dossier `synthese/` ; préfixe `sy`, espace de noms `SY` ; `data-matiere="chimie"` ; kicker « Chimie · Seconde ».
- Portail : `dom: 'chimie'`, `desc: "Assembler un montage à reflux, chauffer, séparer à l'ampoule à décanter et comparer par CCM."`
- Dessin d'en-tête : **`verrerie`** (créé par `10-solutions.md`).
- **Prérequis** : `10-solutions.md` (outils `PAILLASSE`, `ETAPES`) et `07-chromatographie.md` (outil `CCM`) faits. Sinon, crée-les comme ces prompts le décrivent.

## 2. Objectif et programme

Capacités exigibles :
- « Établir, à partir de données expérimentales, qu'une espèce chimique synthétisée au laboratoire peut être identique à une espèce chimique synthétisée dans la nature. »
- « Réaliser le schéma légendé d'un montage à reflux et d'une chromatographie sur couche mince. »
- « Mettre en œuvre un montage à reflux pour synthétiser une espèce chimique présente dans la nature. »
- « Mettre en œuvre une chromatographie sur couche mince pour comparer une espèce synthétisée et une espèce extraite de la nature. »

## 3. Ce que dit le cours

Source : `13- Synthese/TP - synthese ethanoate de linalyle.pdf` (2 p.) ; pour la CCM : `2- Corps purs et melanges/TP2 - CCM.pdf` et le prompt `07-chromatographie.md` §3.

**Choix de l'enseignant** : synthèse support : **l'acétate d'isoamyle (arôme de banane)** — le TP s'intitule « synthèse de l'acétate d'isoamyle » mais décrit l'éthanoate de linalyle ; l'application garde **le déroulé du TP** en remplaçant le linalol par l'alcool isoamylique ; **pas de quantités de matière** (la partie « pour les futurs spécialité physique » est exclue).

- **Réaction** (adaptée du TP) : **alcool isoamylique + anhydride éthanoïque → acétate d'isoamyle + acide éthanoïque**.
- **Tableau de données** (même forme que le TP : pictogrammes de danger, densité, masse molaire, solubilité dans l'eau salée ; sans masse molaire, puisqu'il n'y a pas de quantité de matière) — valeurs usuelles à vérifier :
  | Espèce | Densité | Solubilité dans l'eau salée | Pictogrammes |
  |---|---|---|---|
  | alcool isoamylique | 0,81 | très peu soluble | inflammable, nocif |
  | anhydride éthanoïque | 1,08 | réagit avec l'eau | inflammable, corrosif, nocif |
  | acétate d'isoamyle | 0,87 | très peu soluble | inflammable |
  | acide éthanoïque | 1,05 | très soluble | inflammable, corrosif |
  
  (Le TP écrit 1,18 pour l'acide éthanoïque ; sa densité usuelle est 1,05. L'eau salée a une densité d'environ 1,1.) Pictogrammes dessinés d'après `assets/pictogrammes/`.
- **Montage à reflux** (figure du TP, à refaire en SVG et à légender) : potence et pinces, **réfrigérant à boules** (entrée d'eau en bas, sortie d'eau en haut), **ballon** contenant le **mélange réactionnel** et des **billes de verre**, **chauffe-ballon**, **support élévateur**.
- **Manipulations du TP** : « Sous la hotte, introduire dans un ballon **sec** et avec précautions 5 mL de linalol (ici d'alcool isoamylique) puis 10 mL d'anhydride éthanoïque, ainsi que quelques **billes de verre (pour homogénéiser l'ébullition)**. Boucher le ballon quand il est en dehors de la hotte. Adapter le ballon au réfrigérant à boules. Appeler le professeur pour qu'il vérifie que le raccordement est bien fait et qu'il mette en route la **circulation d'eau**. Porter le mélange à **ébullition douce** pendant 20 minutes. »
- **Questions du TP** : « Pourquoi chauffe-t-on ? » (pour accélérer la transformation) ; « Quel est le principe du chauffage à reflux ? » (les vapeurs se condensent dans le réfrigérant et retombent dans le ballon : on ne perd pas d'espèces chimiques) ; « Pourquoi le montage est-il disposé sur un support élévateur et non pas directement sur la paillasse ? » (pour pouvoir retirer le chauffage rapidement).
- **Séparation** : « Lavage à l'eau salée (relargage) : arrêter le chauffage **sans arrêter la circulation d'eau** et abaisser le support élévateur ; retirer le dispositif de chauffage ; ajouter progressivement **30 mL d'eau salée par le haut du réfrigérant** ; refroidir le contenu du ballon en le plaçant (bouché) dans un bain d'eau froide. » « Extraction : verser le mélange dans l'**ampoule à décanter** ; agiter puis laisser décanter. » « L'anhydride éthanoïque a été introduit **en excès** : à la fin de la réaction tout le linalol (ici l'alcool isoamylique) a été consommé et il reste de l'anhydride éthanoïque ; quand on a ajouté de l'eau, tout l'anhydride restant est **transformé en acide éthanoïque**. » Questions : « Donner la liste de toutes les espèces chimiques présentes dans l'ampoule à décanter » ; « Compléter le schéma de l'ampoule à décanter (phases et espèces) avec les données du tableau » ; « Éliminer la phase aqueuse ; récupérer la **phase supérieure** contenant le produit de synthèse » ; « Quelle est la plante dont vous avez synthétisé l'arôme ? » (la banane).
- **CCM** (TP2, plaque de silice, révélation sous lampe UV) : comparer le produit synthétisé, l'acétate d'isoamyle du commerce (référence) et un arôme naturel de banane (espèce extraite de la nature), avec la rédaction du cours (« … contient … car il donne une tache à la même hauteur que … »).

## 4. Plan de l'application (`PLAN`)

### Module 1 : Assembler le montage (manipulation guidée, `module_1_manip.html`)

- Paillasse sous la hotte : potence, pinces, support élévateur, chauffe-ballon, ballons (un sec, un mouillé), éprouvettes, flacons d'alcool isoamylique et d'anhydride éthanoïque (avec leurs pictogrammes), billes de verre, bouchon, réfrigérant à boules, deux tuyaux, robinet d'eau.
- **Ordre imposé** (`ETAPES`) : 1. support élévateur sur la paillasse ; 2. chauffe-ballon sur le support élévateur ; 3. ballon **sec** ; 4. alcool isoamylique (5 mL, mesuré à l'éprouvette) puis anhydride éthanoïque (10 mL), sous la hotte ; 5. billes de verre ; 6. ballon fixé à la potence (pince) dans le chauffe-ballon ; 7. réfrigérant à boules adapté au ballon (pince) ; 8. tuyau d'arrivée d'eau **en bas** du réfrigérant, tuyau de sortie **en haut** ; 9. circulation d'eau ouverte ; 10. chauffage allumé.
- **Refus expliqués** (le geste ne se fait pas) :
  - eau qui entre par le haut : « L'eau entre par le bas du réfrigérant : il se remplit entièrement et refroidit bien les vapeurs. » ;
  - montage bouché (bouchon en haut du réfrigérant) : « Le haut du réfrigérant reste ouvert : sinon la pression monterait dans le ballon. » ;
  - pas de billes de verre : « Les billes de verre homogénéisent l'ébullition. » ;
  - ballon posé sans support élévateur, ou chauffe-ballon directement sur la paillasse : « Le support élévateur permet de retirer le chauffage rapidement. » ;
  - chauffage avant la circulation d'eau : « Sans eau dans le réfrigérant, les vapeurs s'échapperaient. » ;
  - ballon mouillé : « L'anhydride éthanoïque réagit avec l'eau : le ballon doit être sec. » ;
  - réactifs versés hors de la hotte.

### Module 2 : Chauffer à reflux (animation, `module_2_simulation.html`)

- Libellé : « Animation : chauffage à reflux ». Le montage du module 1, prêt. Lecture / Pause / vitesse / Recommencer ; une horloge accélérée compte les 20 minutes.
- On voit : l'ébullition douce (bulles régulières grâce aux billes), les **vapeurs qui montent** dans le réfrigérant, se **condensent** en gouttes sur les boules et **retombent** dans le ballon ; l'eau qui circule de bas en haut ; une jauge « avancement de la transformation » qui monte plus vite quand on chauffe (comparaison « sans chauffage » au bouton).
- Questions du TP au fil de l'animation : pourquoi chauffe-t-on ? principe du reflux ? pourquoi un support élévateur ? (QCM, mauvais choix classiques : « pour faire évaporer le produit », « pour stériliser »…).
- Puis **légender le schéma** du montage avec les étiquettes à glisser : réfrigérant à boules, entrée d'eau, sortie d'eau, ballon, mélange réactionnel, billes de verre, chauffe-ballon, support élévateur, potence.

### Module 3 : Séparer et identifier (manipulation guidée, `module_3_manip.html`)

- **Relargage**, gestes dans l'ordre : arrêter le chauffage **sans arrêter l'eau** ; abaisser le support élévateur ; retirer le chauffe-ballon ; verser 30 mL d'eau salée **par le haut du réfrigérant** ; boucher le ballon et le refroidir dans un bain d'eau froide. Refus : couper l'eau en premier.
- **Espèces dans l'ampoule** : l'élève coche la liste (acétate d'isoamyle, acide éthanoïque, eau, sel, alcool isoamylique, anhydride éthanoïque) ; diagnostics : « L'alcool isoamylique a été entièrement consommé : l'anhydride était en excès. » ; « L'anhydride restant a été transformé en acide éthanoïque par l'eau. »
- **Ampoule à décanter** : verser, boucher, agiter (en ouvrant le robinet pour dégazer), laisser décanter : deux phases ; l'élève **place les phases** (phase organique, phase aqueuse) et **les espèces** dans le schéma de l'ampoule d'après le tableau (densité, solubilité). Diagnostics : produit placé en bas (« densité 0,87, plus petite que celle de l'eau salée : la phase qui contient l'acétate d'isoamyle est au-dessus ») ; acide éthanoïque dans la phase organique (« il est très soluble dans l'eau salée ») ; puis éliminer la phase aqueuse (ouvrir le robinet, bouchon ôté) et récupérer la phase supérieure.
- **CCM** (outil `CCM`) : dépôts : produit synthétisé (S), acétate d'isoamyle du commerce (R), arôme naturel de banane (N), alcool isoamylique (A) ; élution et révélation sous lampe UV (gestes réduits : l'animation de `07` en accéléré) ; conclusion avec les expressions à piocher de `07` : « S contient de l'acétate d'isoamyle car il donne une tache à la même hauteur que R » ; « l'arôme naturel N contient aussi de l'acétate d'isoamyle » ; « l'espèce synthétisée est identique à l'espèce présente dans la banane » ; « S ne contient pas d'alcool isoamylique ». Question finale : « Quelle est la plante dont tu as synthétisé l'arôme ? »

## 5. Rendu

- `PAILLASSE` étendue : potence et pinces, support élévateur (qu'on monte et descend), chauffe-ballon (voyant), ballon, réfrigérant à boules (eau qui circule, gouttes de condensation), tuyaux, ampoule à décanter avec robinet, bain d'eau froide. Contours `--ink-2`, liquides `--paper-2`, phase organique légèrement teintée (`--cle-bg`) avec son nom écrit.
- Animation du reflux en SVG (`requestAnimationFrame`), coupée avec `prefers-reduced-motion` (étapes au bouton).
- 1280 px : montage à gauche (vertical, hauteur environ 520 px), étapes à droite ; 390 px : montage centré à l'échelle, étapes dessous.

## 6. Outils

- **`PAILLASSE`** (créé par `10`) à étendre de façon compatible (objets du reflux et de l'extraction) ; **`ETAPES`** (créé par `08`) ; **`CCM`** (`../../chromatographie/modules/ccm.js`, créé par `07`, chargé depuis son dossier). Reteste `solutions/`, `identifier-especes/` et `chromatographie/` après toute modification de ces outils.
- `assets/pictogrammes/` pour les pictogrammes de danger ; `assets/dragdrop.js`, `BULLE`.

## 7. Vérifications propres

- Chaque refus du module 1 se déclenche sur un geste forcé et ne change pas le montage ; ordre complet réussi au doigt (CDP) et en deux appuis.
- Ampoule à décanter : phase organique toujours au-dessus (0,87 < 1,1) ; espèces bien réparties.
- CCM : S, R et N donnent une tache à la même hauteur ; A une tache à une autre hauteur ; `CCM.analyser` valide les conclusions attendues.
- Données du tableau vérifiées (densités usuelles) et cohérentes avec les phases.

## 8. Hors périmètre

- Pas de quantité de matière, de masse molaire ni de réactif limitant (choix de l'enseignant), pas de rendement.
- Pas de linalol ni d'éthanoate de linalyle (sauf pour signaler que le TP papier l'utilise, si besoin dans une bulle).
- Pas d'hydrodistillation ni d'extraction de l'huile essentielle (seulement l'arôme naturel déposé sur la plaque).
