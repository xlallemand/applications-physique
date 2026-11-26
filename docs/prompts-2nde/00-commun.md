# Instructions communes : applications de 2nde

Ce fichier est lu au début de chaque session qui fabrique une application de 2nde (`NN-<dossier>.md`). Le prompt de l'application précise ce qui lui est propre ; tout le reste est ici. Il découle de la liste validée par l'enseignant (`liste-applications.html`, version 1, et ses retours) : en cas de doute, le prompt de l'application prime sur cette liste.

## 1. Branche et dépôts

- Travaille sur la branche `2nde` de `applications-physique` : `git fetch origin 2nde && git checkout 2nde` (ou `git checkout -b 2nde origin/2nde`), puis pousse sur `2nde`. Si la session impose une autre branche, pars de `2nde`, pousse sur la branche imposée et signale-le dans le compte rendu.
- Pas de pull request sans demande.

## 2. Sources : dépôt `Cours-2nde` (lecture seule)

- Dépôt `xlallemand/Cours-2nde` : s'il n'est pas dans la session, attache-le avec `add_repo` (lecture seule) et clone-le dans `/home/user/Cours-2nde`. Les chemins des prompts partent de sa racine (`02- Lumiere/…`). **Ne le modifie jamais.**
- Les cours complétés et les corrections contiennent des **annotations manuscrites** (encre de tablette) que `pdftotext` ne voit pas :
  - PDF : lis-le avec `Read` et `pages`, une page à la fois, une seule fois, en notant ce qui sert ;
  - `.docx` et `.pps` : `soffice --headless --convert-to pdf --outdir <scratchpad> "<fichier>"`, puis lis le PDF obtenu ;
  - texte tapé seul (énoncés, données, consignes) : `pdftotext -layout`, bien moins cher ;
  - figure à refaire en SVG : `pdftoppm -r 200 -f N -l N -png` (avec `-x -y -W -H` pour un détail), puis `Read` de l'image.
- **Économie de tokens.** Le prompt de l'application résume déjà le cours, les notations, les méthodes et les erreurs relevées dans les corrections (section 3) : ne relis pas le cours en entier. Ne lis que ce que le prompt désigne (énoncés et figures à refaire) et, au besoin, une page pour vérifier un détail.
- Les liens des fichiers `.txt` (animations en ligne) servent d'inspiration ; ne les copie pas, le réseau peut les bloquer.

## 3. Ce qu'il faut lire dans `applications-physique`

1. `CLAUDE.md`, puis **en entier** `docs/charte-applications.md`. Elle prime pour la présentation et la navigation ; le prompt de l'application prime pour le contenu.
2. Les applications de référence, seulement les fichiers utiles :
   - `cinematique/` : référence de la charte (moteur de questions `modules/cin.js`, `CIN.serie`, styles `cin.css`, accueil `index.html`) ;
   - `spectres-etoiles/` : application de 2nde sans cours (une page par module, `PLAN` sans fiche) ;
   - **`atome-ions/`** (pages `module_1_simulation` et `module_3_simulation`, fonctions `cadreSim` et `defis` de `modules/at.js`, styles `.at-sim*` et `.at-defis*` de `at.css`) : **modèle des pages de simulation et de manipulation** (un seul écran, panneau à droite, onglets sur téléphone, défis « À essayer », §6 bis) ; copie ce qui sert et renomme-le avec le préfixe de l'application ;
   - `pile/` (page `entrainement`), `ondes-sonores/` et `energie-cinetique/` (pages `simulation` en tête d'une partie) : manipulations et simulateurs existants ;
   - les outils que le prompt de l'application nomme (section 6 du prompt).
3. Pour l'en-tête des outils partagés, lis seulement le bloc de commentaires du début (rôle, API).

## 4. Ce qu'on fabrique : des outils de manipulation, pas des cours

- **Simulateurs, animations et manipulations** : l'élève agit (place, glisse, touche, règle un paramètre, choisit une expression) ; l'application montre, vérifie et explique l'erreur.
- **Pas de page `cours`, pas de fiche récapitulative, pas de flashcards.** Seulement des rappels courts : un encadré `callout` de 2 ou 3 lignes, ou une bulle ⓘ, et des liens « Revois… » vers une autre application (nouvelle fenêtre, `target="_blank" rel="noopener"`, charte §5). Applications utiles pour ces liens : `conversions/`, `puissances-10/`, `proportionnalite/`, `equations-en-physique/`, `lecture-graphique/`, `spectres-etoiles/`, `equilibrer-reactions/`, `avancement-reaction/`, et les autres applications de 2nde déjà faites (le `README.md` de ce dossier donne leurs dossiers).
- **Notations, vocabulaire et méthodes : ceux du cours du professeur**, résumés dans la section 3 du prompt de l'application, puis ceux du programme. Aucune notation différente. Typographie de la charte §7 (virgule décimale, `−`, écriture `1,6 × 10<sup>−19</sup>` alors que le cours écrit `1,6.10⁻¹⁹` : dans les saisies, accepte les deux écritures). Unités comme le cours (`m/s`, `g/L`, `g/mL`, `Hz`, `Ω`…).
- **Aucune référence aux sources dans l'application** : ni « le cours », ni numéro d'exercice, ni TP, ni fiche, ni devoir, ni activité. Les données et figures des sources se reprennent sans dire d'où elles viennent ; l'application est indépendante des sources.
- Bulle ⓘ : reprends le principe d'`ORGA.info` (`assets/orga-dessin.js` : bouton ⓘ, bulle ouverte au toucher, fermée par un second appui ou Échap, rien au survol). Le premier prompt qui en a besoin hors de l'ORGA (`01-periode-frequence.md`) crée `assets/bulle.js` + `assets/bulle.css` (objet `BULLE`, `BULLE.info(html, label)` → code HTML, plusieurs bulles par page) ; les suivants le réutilisent. Une bulle « hors programme » (demandée par certains prompts) est une bulle ⓘ dont le texte commence par **Hors programme.**

## 5. Structure de l'application

- Un dossier à la racine (nom donné par le prompt), `index.html` et `modules/`. Préfixe de 2 ou 3 lettres et espace de noms global propre, donnés par le prompt (ils ne sont pas encore utilisés dans le dépôt).
- **Nom de l'application** : celui que donne le prompt, au caractère près, partout où l'application est nommée : `<title>` et `<h1>` de l'accueil, `SOM.init({ nom })`, fin du `<title>` des pages de module (« Module 1 : … — Nom »), `titre` de l'entrée `APPS` du portail. `SOM.init({ id })` vaut le nom du dossier.
- `<html lang="fr" data-matiere="physique|chimie">`, feuilles de style et scripts dans l'ordre de la charte §2, `SOM` pour la navigation, moteur de questions copié depuis `cinematique/modules/cin.js` puis renommé (seulement ce qui sert : `serie`, parties, `fmt`, `lire`, `sci`, `fr`).
- **Types de pages** (`PLAN`, charte §5), une partie par module sauf indication contraire :
  | Type demandé dans le prompt | Clé du `PLAN` | Libellé (`noms`) | Marquée faite quand… |
  |---|---|---|---|
  | simulation, animation | `simulation` (▸) | « Simulateur : … », « Animation : … » | tous les défis « À essayer » sont réussis, dans n'importe quel ordre |
  | manipulation guidée (situations au choix, sans note) | `entrainement` (E) | « Manipulation : … » | toutes les situations sont réussies (ou leur réponse affichée), dans n'importe quel ordre |
  | entraînement noté sur 20 | `questions` (Q) | « Entraînement » ou titre court | la série est finie : `SOM.marquer({ note })`, la meilleure est gardée |
  
  Pas de clé `fiche` dans le `PLAN` (il n'y a pas de cours). Nom des fichiers : `module_N_simulation.html`, `module_N_manip.html`, `module_N_questions.html` (ou une seule page par module si le prompt le dit).
- **Module à faire situé dans une autre application** : une page externe ↗ du `PLAN` (charte §5). Le `desc` de son module commence par « À savoir faire : » et résume en une phrase ce que l'élève doit savoir faire en sortant de l'autre application (modèle : module 2 de `principe-dynamique/`). Le prompt de l'application donne ce résumé ; sinon, rédige-le à partir des cours de l'autre application.
- **Pages de simulation et de manipulation : un seul écran, utilisables librement** (section 6 bis, modèle `atome-ions/`, pages `module_1_simulation` et `module_3_simulation`). Ce sont des **outils** que l'enseignant projette ou que l'élève ouvre pour **n'importe quel cours**, sans suivre de consignes dans l'ordre. En-tête compact (badge `MODULE N · SIMULATION` / `· MANIPULATION`, titre, contexte en une phrase avec les mots-clés en gras, ou dans une bulle ⓘ), puis la zone de manipulation et son panneau de réglages. Bouton « ↺ Recommencer » (`btn-secondary`).
- **Bouton plein écran commun** (`assets/plein-ecran.js`, objet `PLEIN`, modèle `double-periodicite/`) sur toute page de manipulation ou de simulation (charte §4, « Page de manipulation ») : dans l'en-tête, à droite du titre, sur ordinateur ; au bout des onglets sur téléphone.
- **Séries notées** : 10 questions tirées au hasard dans des groupes, chaque question est une fabrique (nouvelles valeurs, nouveaux distracteurs) ; parties successives ; 2 / 1 / 0 point ; écran de fin de la charte. Une question peut contenir une manipulation (partie `'perso'` : `monter(zone, api)`, `api.reussi()` / `api.erreur(diag)`), montable en **plusieurs exemplaires** (pas d'`id` fixe, pas d'état global).
- **Accueil** : en-tête illustré (`app-hero`, kicker « Physique · Seconde » ou « Chimie · Seconde », `h1`, phrase d'accroche), puis `SOM.accueil(zone)`.
- **Portail** : entrée dans `APPS` de `index.html` (racine) : `{ titre, dom, niv: ['2de'], dossier, desc, mots }`, `desc` donnée par le prompt, `mots` : mots-clés de recherche (charte §2) ; place-la dans le groupe de son domaine, après les applications de 2nde déjà présentes (dans l'ordre des numéros des prompts). Déclare aussi ses pages dans `AVANCEMENT` de `assets/avancement.js` (toutes les pages du `PLAN`, dans l'ordre), puis relance `python3 docs/outils/index-recherche.py` (index de recherche du portail).
- **Dessin d'en-tête** : celui que donne le prompt. Un nouveau dessin s'ajoute dans `assets/hero.js` (objet `dessins` + liste commentée en tête), dans le style des dessins existants (traits fins, couleur de la matière, parallaxe).
- Toute clé `localStorage` commence par `<dossier>-` (charte §5), toujours en `try/catch`.

## 6. Interactions (souris et doigt)

- Glisser-déposer : `assets/dragdrop.js` (Pointer Events). Une poignée à glisser : `touch-action: none` sur la poignée seulement ; `touch-action: pan-y` sur les figures pour ne pas bloquer le défilement.
- **Tout glisser a son complément au doigt fin** : boutons fléchés (↑ ← ↓ →, ± 1°, ± 1 mm, ± 1 cm…) de 58 × 50 px au moins (charte §6 « Manipulation directe », §8), et, quand c'est plus simple, « toucher l'objet puis toucher la cible » (deux appuis) en plus du glisser.
- Cibles tactiles de 46 px de haut au moins ; points à toucher sur une figure : zone sensible de 44 px de diamètre au moins, même si le dessin est plus petit.
- **Rien ne dépend du survol** : aucune information seulement au survol, pas de loupe sur tactile.
- Figures en **SVG** (sauf mention contraire), recalculées à la largeur disponible ; à 390 px la figure prend toute la largeur de la carte et les commandes passent dessous. Aucun défilement horizontal de la page.
- **Animations** : boutons Lecture / Pause, vitesse (× 0,5, × 1, × 2), « ↺ Recommencer », et, quand c'est utile, « Pas à pas ». Avec `prefers-reduced-motion: reduce` : pas d'animation automatique ; l'animation avance par étapes au bouton « Étape suivante » et chaque étape s'affiche dans son état final.
- Couleurs : uniquement les variables de `assets/theme.css` (constantes SVG seulement en attributs de présentation, comme `VEC.C`). Vert et rouge réservés au juste / faux.

## 6 bis. Simulations et manipulations : un écran, sans déroulé imposé

Règle de l'enseignant pour **toute page de simulation, d'animation ou de manipulation** ; elle prime sur ce que les prompts d'application disent de la mise en page et des étapes.

- **Tout tient sur un écran d'ordinateur, sans défilement de la page** : à 1280 × 720 et encore à 1280 × 650, figure, commandes, valeurs affichées et défis sont visibles ensemble. La page occupe `calc(100dvh − marges)` (avec `100vh` avant, pour les anciens navigateurs) ; la figure (SVG recalculé) prend la place qui reste ; le panneau de réglages est **à droite** (environ 300 px) ; une règle `@media (max-height: 760px)` compresse les marges et les textes. Ce qui ne tient pas se compresse, passe en bulle ⓘ ou dans un onglet du panneau : **jamais sous la figure**. Aucun contenu coupé dans une colonne (rien ne déborde de son panneau).
- **Téléphone et tablette (< 900 px)** : la page tient aussi dans l'écran, sous le bandeau du sommaire : figure en haut, réglages en bas en **onglets** (un bloc à la fois, « À essayer » compris), bouton plein écran au bout des onglets ; l'en-tête de la page est caché (le bandeau du sommaire nomme la page). En plein écran, la page reprend toute la hauteur.
- **Tout se règle à tout moment** : chaque paramètre de la situation (élément, milieu, angle, source, valeur, objet…) se choisit directement (bande de choix, − / +, curseur, glisser), dans n'importe quel ordre, sans passer par une étape. Rien n'est verrouillé par un déroulé : les seuls refus sont ceux de la physique, de la chimie ou du protocole (case pleine, électron de trop, geste de laboratoire hors de l'ordre), toujours expliqués par une phrase.
- **Les grandeurs utiles au cours s'affichent en continu** (valeurs, mesures, configuration, formule, nom), mises à jour à chaque geste ; ce qui est à faire trouver à l'élève se masque par une option (« Montrées » / « À trouver »), jamais par une étape.
- **Pas de déroulé guidé linéaire.** Les étapes numérotées que décrit un prompt (« Déroulé guidé : 1. … 2. … ») deviennent des **défis « À essayer »** : une rangée de pastilles numérotées, le texte du défi choisi et un bouton « Essayer » qui prépare la situation de départ (élément, milieu, réglage) sans faire le défi. Chaque défi se **coche tout seul** dès que l'état de la simulation le réalise, **dans n'importe quel ordre**, même si l'élève l'atteint sans l'avoir choisi, avec une phrase courte qui dit ce qu'il faut retenir. Tous cochés : page marquée faite.
- **Bilan** d'une simulation (ce qu'il faut retenir, quand le prompt en prévoit un) : intitulé « Bilan », **jamais « ✍ Complète ton cours »** (décision de l'enseignant, même si `docs/prompts-sti2d/` l'écrit ainsi).
- **Manipulations guidées** (situations successives) : même écran unique ; les situations sont des pastilles numérotées accessibles **dans n'importe quel ordre** (rangées dans l'ordre de progression du prompt ; « Situation suivante → » enchaîne aussi, compteur « Situation 2 / 6 ») ; la consigne du pas en cours tient en une ligne dans le panneau. Seuls les pas qui forment la méthode du cours (normale avant les angles, boucle principale avant les dérivations, gestes du protocole) restent dans l'ordre, avec un refus expliqué.
- Vérification (§9) : `document.documentElement.scrollHeight <= innerHeight` à 1280 × 720, 1280 × 650 et 390 × 844, dans chaque état (début, défis en cours, tous réussis, messages de refus affichés), et aucun bloc dont le contenu dépasse (`scrollHeight > clientHeight`).

## 7. Retours à l'élève

- **Diagnostic ciblé**, jamais un simple « Faux » : encadré `callout-danger` « **Ce n'est pas ça.** » suivi de l'erreur précise (celles que liste le prompt). Réussite : « Juste ! » / « C'est juste. » (`callout-success`) avec une phrase d'explication. Après 2 erreurs sur un même pas : « Corrige ta réponse, ou affiche la réponse. » (« Afficher la réponse », `btn-small`).
- **Ordre imposé** (montages, gestes de laboratoire, constructions) : un geste fait hors de l'ordre est **refusé tout de suite**, rien ne change sur la figure, et une phrase dit pourquoi et ce qu'il faut faire d'abord.
- Les mauvais choix des QCM et des expressions à piocher sont des erreurs classiques d'élève, pas des réponses absurdes.
- Saisie d'un nombre : charte §7 (champ, bouton ±, `inputmode="decimal"`, ≥ 16 px) ; message de format sans compter d'erreur ; nombre de chiffres significatifs attendu précisé.

## 8. Outils partagés

| Outil | Fichiers | Créé par | Réutilisé par |
|---|---|---|---|
| `BULLE` | `assets/bulle.js`, `assets/bulle.css` | 01 | toutes |
| `OPT` (rayons lumineux) | `assets/optique.js`, `assets/optique.css` | 02 | 03 |
| `ATOME` (éléments, couches, cases) | `assets/atome.js`, `assets/atome.css` | 04 | 05, 06 |
| `CCM` (plaque, taches, animation) | `chromatographie/modules/ccm.js` | 07 | 12 |
| `ETAPES` (gestes dans l'ordre) et `MONTAGE` (circuits) | `assets/etapes.js` ; `assets/montage.js`, `assets/montage.css` | 08 | 09 (MONTAGE) ; 10, 11, 12 (ETAPES) |
| `PAILLASSE` (verrerie) | `assets/paillasse.js`, `assets/paillasse.css` | 10 | 11, 12 |
| `DILUTION` (dilution, commun avec la Terminale) | `assets/dilution.js`, `assets/dilution.css` | 10 ou Tle `chapitre-01.md` | 10 ; Tle 01 |
| `SYNTHESE` (reflux, ampoule à décanter, commun avec la Terminale) | `assets/synthese.js`, `assets/synthese.css` | 12 ou Tle `chapitre-21.md` | 12 ; Tle 21 |
| `LG` (existant) | `lecture-graphique/modules/lgtools.js`, `lgtools.css` | — | 01, 09, 11, 13 |
| `ORGA` (existant) | `assets/orga.js`, `assets/orga-dessin.js`, `assets/orga.css` | — | 06 |
| `VEC` (existant) | `cinematique/modules/vecteurs.js` | — | 13 |

- Le premier prompt qui a besoin d'un outil le crée : IIFE `'use strict'`, objet global, **bloc d'en-tête complet** (rôle, API, options, exemples), montable en plusieurs exemplaires, sans `id` fixe ni état global, sans texte propre à une application (les textes et diagnostics se passent en options).
- Les suivants le **réutilisent** et, si besoin, l'**étendent de façon compatible** (nouvelles options, valeurs par défaut inchangées). Après toute modification d'un outil, **reteste chaque application qui le charge** (cherche `grep -rl "<fichier>" --include=*.html .`).
- Un outil existant d'une autre application (`LG`, `VEC`) se charge **depuis son dossier d'origine** (`../../lecture-graphique/modules/lgtools.js`), comme le fait `puissance-active/` ; ne le copie pas.

## 9. Avant de livrer

Avec Playwright / Chromium (déjà installé, ne lance pas `playwright install`), à **1280 px** et à **390 px** avec émulation tactile (`hasTouch: true, isMobile: true`) :

1. Chaque simulation : chaque commande (glisser, flèches, boutons, curseurs), chaque état (début, en cours, réussi), chaque défi « À essayer » (« Essayer », défi réussi sans l'avoir choisi, défis dans le désordre, tous cochés → page faite), « Recommencer » ; **aucun défilement de la page** à 1280 × 720, 1280 × 650 et 390 × 844, aucun contenu coupé (§6 bis).
2. Chaque manipulation guidée : toutes les situations, dans le désordre, sur un seul écran, juste puis avec les **erreurs volontaires que liste le prompt** (le bon diagnostic s'affiche), gestes hors de l'ordre refusés avec leur explication, état de fin.
3. Chaque série : 10 questions, note sur 20, écran de fin ; deux tirages différents.
4. Glisser **à la souris et au doigt** (événements tactiles CDP : `Input.dispatchTouchEvent`), flèches, deux appuis ; aucun survol nécessaire.
5. Animations : lecture, pause, vitesse, recommencer ; `prefers-reduced-motion: reduce` émulé (`page.emulateMedia({ reducedMotion: 'reduce' })`).
6. Aucune erreur dans la console, aucun défilement horizontal de la page, navigation de la charte §10 (sommaire, Reprendre, ✓ et notes après rechargement, liens internes, liens « Revois… » en nouvelle fenêtre, lien vers le portail, avancement x/y du portail).
7. Outils partagés créés ou modifiés : chaque application qui les charge est retestée.
8. **Chaque valeur numérique** (données, réponses, tolérances) vérifiée par un petit script dans le scratchpad, pas de tête.

Puis :
- ajoute la ligne de l'application dans la liste « Applications codées » de `docs/prompts-2nde/README.md` (numéro, nom, fichier du prompt, dossier, date), dans l'ordre des numéros ;
- commits en français, clairs ; push sur `2nde`. Compte rendu court :
- ce qui est fait ;
- les écarts avec le prompt et pourquoi ;
- ce qui n'est pas testable (Safari iOS).
