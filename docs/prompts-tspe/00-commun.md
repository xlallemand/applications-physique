# Instructions communes : applications de Terminale spécialité

Ce fichier est lu au début de chaque session qui fabrique une application de Terminale spécialité (`chapitre-NN.md`) ou un outil commun (`outils-communs.md`, `bilan-forces.md`…). Le prompt de la session précise ce qui lui est propre ; tout le reste est ici. **La section 10 (avancement) se met à jour à la fin de chaque session.**

Ces prompts découlent des cours du professeur (dépôt `Cours-TSpe`), de `competences.md`, de `instructions supplementaires.md` (consignes du professeur, chapitre par chapitre, déjà reprises dans chaque prompt) et de ses réponses aux questions posées lors de leur rédaction (résumées ici en §11).

## 1. Branche et dépôts

- Travaille sur la branche **`TSpe`** de `applications-physique` : `git fetch origin TSpe && git checkout TSpe` (ou `git checkout -b TSpe origin/TSpe`), puis pousse sur `TSpe`. Si la session impose une autre branche, pars de `TSpe`, pousse sur la branche imposée et signale-le dans le compte rendu.
- Pas de pull request sans demande.

## 2. Sources : dépôt `Cours-TSpe` (lecture seule)

- Dépôt `xlallemand/Cours-TSpe` : s'il n'est pas dans la session, attache-le avec `add_repo` (lecture seule) et clone-le dans `/home/user/Cours-TSpe`. Les chemins des prompts partent de sa racine (`06- Titrage/…`). **Ne le modifie jamais.**
- `competences.md` : compétences évaluées au bac et contextes classiques des sujets. Lis seulement la section de ton chapitre (attention : sa numérotation s'arrête à 22, l'électrolyse y est dans la section 18) ; les séries et les exercices supplémentaires s'en inspirent.
- `instructions supplementaires.md` : consignes du professeur. Elles sont reprises dans le prompt du chapitre (section « Consignes du professeur ») ; relis seulement la section de ton chapitre pour vérifier qu'il ne manque rien.
- Les cours complétés sont des PDF (Word) avec des **annotations manuscrites** (encre de tablette) ; les corrections sont souvent des **scans manuscrits**. `pdftotext` ne les voit pas :
  - PDF : lis-le avec `Read` et `pages` (une page ou un intervalle par appel), une seule fois, en notant ce qui sert ;
  - détail trop petit (formule, figure à refaire en SVG) : `pdftoppm -r 200 -f N -l N -png` (avec `-x -y -W -H` pour un détail), puis `Read` de l'image ;
  - `.docx` sans PDF : `soffice --headless --convert-to pdf --outdir <scratchpad> "<fichier.docx>"` ;
  - texte tapé seul (énoncés, données, consignes) : `pdftotext -layout`, bien moins cher.
- **Économie de tokens.** Le prompt du chapitre résume le cours (notions, notations, méthodes, exemples, ajouts manuscrits du professeur). Ne relis pas le cours en entier : seulement les pages que le prompt désigne (figures, exemples résolus) et, au besoin, une page pour vérifier un détail. **Les énoncés et les corrections des exercices ne sont pas résumés** : lis-les (énoncé avec `pdftotext` quand il est tapé, figures et corrections avec `Read`), une page à la fois, pour écrire les exercices guidés et leurs corrections détaillées.
- **Les TP ne font pas partie des applications** (choix du professeur) : un TP sert seulement quand le prompt du chapitre le cite (données, figure, gestes d'une fiche méthode).
- **Vidéos et liens du cours** : reprends-les **en liens seulement** (pas de QR code, pas de vidéo intégrée), juste avant la notion qu'ils expliquent, dans un encadré discret : « ▶ Vidéo (facultative) : <ce qu'elle montre> », `target="_blank" rel="noopener"`. Le cours de l'application se suffit à lui-même. Les animations d'autres sites citées dans les fichiers `.txt` du cours servent d'inspiration ; ne les copie pas et n'y renvoie pas, sauf demande du prompt.
- Quand une correction manuscrite ou un énoncé contient une erreur relevée dans le prompt, utilise la version corrigée du prompt ; quand tu en trouves une autre, corrige-la et signale-la dans le compte rendu.

## 3. Ce qu'il faut lire dans `applications-physique`

1. `CLAUDE.md`, puis **en entier** `docs/charte-applications.md`. Elle prime pour la présentation, la navigation et la pédagogie ; le prompt du chapitre prime pour le contenu.
2. Les applications de référence, seulement les fichiers utiles :
   - `cinematique/` : référence de la charte (moteur de questions `modules/cin.js`, exercices `exercices.js` + `module_6.html`) ;
   - `combustions/` : moteur de cours commun `COURS`, sous-modules de cours, exercices par étapes ;
   - `principe-dynamique/` et `energie-cinetique/` : modules découpés en sous-modules (`sousModules: true`), simulations et ateliers ;
   - **`atome-ions/`** (pages `module_1_simulation` et `module_3_simulation`, fonctions `cadreSim` et `defis` de `modules/at.js`, styles `.at-sim*` et `.at-defis*` de `at.css`) : **modèle des pages de simulation et de manipulation** (un seul écran, défis « À essayer », §5) ; `double-periodicite/` : bouton plein écran commun ;
   - `nomenclature/` : application de Terminale spécialité déjà faite selon ces prompts (`chapitre-02.md`).
3. Les applications déjà en ligne que le chapitre cite (la section « Liens » du prompt les nomme) : lis leur `PLAN` et ce qu'il faut pour faire le lien ou réutiliser un outil, sans refaire leur contenu.
4. Pour un outil partagé, lis seulement son bloc d'en-tête (rôle, API, options).

## 4. Structure de l'application

- Un dossier à la racine (nom donné par le prompt), `index.html` et `modules/`. Préfixe de 2 ou 3 lettres et espace de noms global propre (donnés par le prompt ; vérifie avec `grep` qu'ils ne sont pas déjà pris).
- **Nom de l'application = titre du chapitre, sans numéro de chapitre** (consigne du professeur), tel que le donne le prompt. Le même texte, au caractère près, partout où l'application est nommée : `<title>` et `<h1>` de l'accueil, `SOM.init({ nom })`, fin du `<title>` des pages de module (« Module 1 : … — Titrages »), `titre` de l'entrée `APPS` du portail. `SOM.init({ id })` vaut le nom du dossier (clé de la progression). Les modules et les exercices ne citent pas non plus de numéro de chapitre (« comme au chapitre 4 » devient « comme pour les transformations acide-base »).
- Kicker de l'en-tête illustré : « Chimie · Terminale spécialité » ou « Physique · Terminale spécialité ».
- Pour le reste, suis la charte : `<html lang="fr" data-matiere="physique|chimie">`, feuilles de style et scripts dans l'ordre du §2 de la charte, `SOM` pour la navigation, `COURS` (`assets/cours.js`) pour les cours, moteur de questions et d'exercices copié depuis `cinematique/modules/cin.js` puis renommé (seulement ce qui sert).
- **Chaque module** : un cours (notion → exemple → « À toi », « Afficher tout le cours », « À retenir ») ; une série de 10 questions notée sur 20 (fabriques aléatoires, diagnostics ciblés) ; une fiche récapitulative. Un cours long se découpe en sous-modules de cours (« Cours : … », charte §4 « Longueur d'un cours »), avec une seule série et une seule fiche pour le module.
- **Dernier module : les exercices de la feuille du professeur, avec sa numérotation** (« Exercice 6 »). Chaque exercice est guidé par parties, avec la correction détaillée toujours disponible (« Voir la correction », 0 point). Les exercices supplémentaires ou de bac portent une lettre ou leur titre. Les données et figures se reprennent fidèlement (figures refaites en SVG).
- **Questions « complexes » (prise d'initiative, type bac)** : le professeur y tient (« exercice à questions complexes »). Quand le prompt en signale, l'exercice guidé propose d'abord la question telle quelle, puis, sur demande (« Je ne sais pas par où commencer »), les étapes, en commençant par le réflexe que le prompt donne (souvent : « calcule d'abord la concentration inconnue, avant même de chercher comment répondre »).
- Les simulations, animations, ateliers et manipulations demandés sont des pages `simulation` (▸, « Simulateur : … », « Animation : … », « Atelier : … ») ou `entrainement` (E, « Manipulation : … ») : règles du §5.
- Pas de flashcards dans ces sessions (elles se feront à part, avec `docs/flashcards/prompt-generation.md`).
- **Portail** : entrée dans `APPS` de `index.html` (racine) : `{ titre, dom, niv: ['spe'], dossier, desc, mots }` (`desc` donnée par le prompt, `mots` : mots-clés de recherche, charte §2), dans le groupe de son domaine, **dans l'ordre des chapitres** (numéro du dossier du cours) parmi les applications de Tle spécialité. Déclare ses pages dans `AVANCEMENT` de `assets/avancement.js`, puis relance `python3 docs/outils/index-recherche.py`. Ajoute un dessin d'en-tête dans `assets/hero.js` seulement si aucun dessin existant ne convient (liste en tête du fichier), dans le style des dessins existants.
- Toute nouvelle clé `localStorage` commence par `<dossier>-` (charte §5), toujours en `try/catch`.

## 5. Simulations et manipulations : un seul écran, plein écran, utilisables librement

Règle du professeur pour **toute page de simulation, d'animation ou de manipulation**. Elle prime sur ce que les prompts de chapitre disent de la mise en page et des étapes. Détail complet : `docs/prompts-2nde/00-commun.md` §6 et §6 bis ; modèle `atome-ions/`.

- **Tout tient sur un écran d'ordinateur, sans défilement de la page** (1280 × 720, et encore 1280 × 650) : figure à gauche (SVG recalculé à la place disponible), réglages, valeurs et défis dans un panneau à droite (≈ 300 px) ; ce qui ne tient pas se compresse, passe en bulle ⓘ (`assets/bulle.js`) ou dans un onglet du panneau, **jamais sous la figure**. Téléphone (< 900 px) : figure en haut, réglages en onglets dessous, dans l'écran.
- **Bouton plein écran commun** (`assets/plein-ecran.js`, `PLEIN`, charte §4 « Page de manipulation »).
- **Manipulation libre** : chaque paramètre se règle à tout moment, rien n'est verrouillé par une étape ; les grandeurs utiles s'affichent en continu ; ce que l'élève doit trouver se masque par une option (« Montrées / À trouver »).
- **Situations avec questions** : les étapes que décrit un prompt deviennent des **défis « À essayer »** (pastilles numérotées, bouton « Essayer » qui prépare la situation sans la résoudre), cochés tout seuls dès que l'état du simulateur les réalise, **dans n'importe quel ordre** ; les questions d'une situation (QCM, valeur à lire, phrase à compléter) s'affichent dans le panneau. Les parties d'une activité sont des onglets accessibles à tout moment.
- **Bilan** (ce qu'il faut retenir) ouvrable à tout moment depuis le panneau, intitulé « Bilan », **jamais « ✍ Complète ton cours »** (décision du professeur, même si `atome-ions/` ou `docs/prompts-2nde/` l'écrivent ainsi) ; page marquée faite quand tous les défis sont réussis ou à l'affichage du bilan.
- Animations : Lecture / Pause, vitesse (× 0,5, × 1, × 2), « ↺ Recommencer », « Pas à pas » quand c'est utile ; `prefers-reduced-motion: reduce` : pas d'animation automatique, avance par étapes.
- Tout glisser a son complément au doigt fin (boutons fléchés 58 × 50 px, ou « toucher l'objet puis la cible ») ; rien ne dépend du survol ; cibles de 44 px au moins.
- Vérification : `document.documentElement.scrollHeight <= innerHeight` à 1280 × 720, 1280 × 650 et 390 × 844, dans chaque état (début, défis en cours, tous réussis, messages affichés), et aucun bloc dont le contenu dépasse.

## 6. Liens vers d'autres applications : deux types

Consigne du professeur : les liens se distinguent selon qu'ils sont facultatifs ou font partie du parcours.

1. **Rappel facultatif** (« pour ceux qui en ont besoin ») : encadré `ph-lien-app` ou `callout` « Revois… » dans le cours, à l'endroit utile, lien en nouvelle fenêtre (`target="_blank" rel="noopener"`). Il n'apparaît pas dans le sommaire.
2. **Module à faire, situé dans une autre application** : une **page externe ↗** du `PLAN`, à sa place dans le parcours (sommaire, accueil, Reprendre exclu). Elle s'ouvre dans une nouvelle fenêtre ; son état (✓ ou note) est **lu dans la progression de l'autre application** (`<autre-dossier>-progression`, même origine) et **compte dans le compteur `n/m`** du module et dans l'avancement x/y du portail.
   - Déclaration (forme à respecter) : `{ nom: 'Double périodicité', externe: { app: 'double-periodicite', page: 'index', nom: 'Simulateur : double périodicité' } }` ; `page` est la clé de la page dans le `PLAN` de l'autre application, ou `'index'` pour une application sans plan (elle compte alors comme faite dès qu'elle a été ouverte : l'autre application enregistre `derniere`).
   - **Résumé très rapide** : le `desc` du module qui contient la page ↗ commence par « À savoir faire : » et résume en une phrase ce que l'élève doit savoir faire en sortant de l'autre application (modèle : module 2 de `principe-dynamique/`). Le prompt du chapitre donne ce résumé ; sinon, rédige-le à partir des cours de l'autre application.
   - L'extension de `assets/sommaire.js` (`SOM`), de `assets/avancement.js` et de `docs/outils/index-recherche.py` (la page ↗ n'est pas indexée deux fois) est faite par **`outils-communs.md`** ; si ce prompt n'a pas encore été exécuté, fais-la toi-même comme il le décrit.
   - Le prompt du chapitre dit, pour chaque lien, de quel type il est.

## 7. Habitudes du professeur

- **Indices partout** : dans une formule appliquée, chaque grandeur porte l'indice de l'espèce ou de l'objet (« sur une copie, mettre des indices » : ρ<sub>espèce</sub> = m<sub>espèce</sub> / V<sub>espèce</sub>, c<sub>NaOH</sub>, n<sub>H₃O⁺</sub>, V<sub>éq</sub>). Les corrections et les diagnostics de l'application font de même ; « formule sans indice » est un diagnostic.
- **Rédaction des calculs** : formule littérale, grandeur cherchée isolée (« ⟺ »), application numérique **avec les unités** et conversions dans une étape à part, résultat avec son unité et le bon nombre de chiffres significatifs (« 2,1 mol·L<sup>−1</sup> avec 2 c.s. »). « Vérifier les unités lors de l'application numérique (même unité à gauche et à droite) ».
- **Deux ou trois méthodes** pour un même calcul (« OU ») : la formule, ou « retrouver avec les unités » (g/L ÷ g/mol = mol/L), ou le tableau de proportionnalité. Garde-les quand le prompt le signale.
- **Phrases de justification** du cours à reprendre telles quelles (« À l'équivalence, les réactifs ont été introduits dans les proportions stœchiométriques, donc… », « Dans le référentiel … supposé galiléen, d'après la deuxième loi de Newton… »).
- **Schéma d'abord** : en mécanique comme en titrage, le professeur commence par un schéma sur lequel il reporte les données de l'énoncé. Les exercices guidés font placer les données sur le schéma quand le prompt le demande (modèle : `transport-electricite/modules/schemas.js`, `SCH`).
- Couleurs : le professeur colore de la même couleur un objet et la grandeur qui lui correspond ; dans l'application, ces couleurs sont celles que fixe le prompt (jamais le vert et le rouge du juste / faux, charte §3).

## 8. Maquettes à valider (quand le prompt en demande)

Un outil nouveau et important se valide sur maquettes **avant** de développer l'application.

- **Étape 1 (première session)** : maquettes **fonctionnelles** (au doigt et à la souris) dans le dossier que donne le prompt, avec les vraies feuilles de style du dépôt, ouvertes en `file://` ; une page `index.html` qui les présente (ce qui les distingue, ce qu'il faut essayer, les questions posées au professeur) ; vérification à 1280 px et 390 px (tactile émulé) ; commit, push, compte rendu avec les chemins ; si l'outil `Artifact` est disponible, publie aussi la page d'index (fichiers joints par `files`). Mets la ligne du chapitre à « maquettes livrées » (§10). **Puis arrête-toi.**
- **Étape 2 (session suivante)** : le professeur donne la maquette choisie et ses remarques ; reproduis-la fidèlement. Les maquettes restent dans `docs/` comme référence.

## 9. Outils partagés

Le premier prompt qui a besoin d'un outil le crée (comme le décrit le prompt qui en est chargé) ; les suivants le réutilisent et l'étendent **de façon compatible** (nouvelles options, valeurs par défaut inchangées). Après toute modification d'un outil, **reteste chaque application qui le charge** (`grep -rl "<fichier>" --include=*.html .`). Un outil est une IIFE `'use strict'` avec un bloc d'en-tête complet, montable en plusieurs exemplaires (pas d'`id` fixe, pas d'état global), sans texte propre à une application.

| Outil | Fichiers | État | Créé ou étendu par | Utilisé par |
|---|---|---|---|---|
| `EQ` : éditeur d'équations à tuiles (celui de `equations-physique-mobile`) | `assets/equations.js`, `assets/equations.css` | existe | `outils-communs.md` | 04, 10, 11, 14, 16, 17 ; `acides-bases/`, `radioactivite/` (à la place de `ph/modules/eq.js`) |
| Pages externes ↗ du `PLAN` | `assets/sommaire.js`, `assets/avancement.js`, `docs/outils/index-recherche.py` | existe | `outils-communs.md` | tous les chapitres qui ont un module dans une autre application |
| `DILUTION` : manipulation de dilution (pipette, fiole, schéma des deux solutions) | `assets/dilution.js`, `assets/dilution.css` (sur `PAILLASSE` et `ETAPES`) | à créer | `chapitre-01.md` ou `docs/prompts-2nde/10-solutions.md`, le premier exécuté | 01, 06 ; 2nde `solutions/` |
| `PAILLASSE` : verrerie dessinée et gestes | `assets/paillasse.js`, `assets/paillasse.css` | à créer | `docs/prompts-2nde/10-solutions.md` (ou 01 s'il passe avant) | 01, 21 ; 2nde 10, 11, 12 |
| `SYNTHESE` : montage à reflux, ampoule à décanter (modes 2de et Tle) | `assets/synthese.js`, `assets/synthese.css` (sur `PAILLASSE` et `ETAPES`) | à créer | `chapitre-21.md` ou `docs/prompts-2nde/12-synthese.md`, le premier exécuté | 21 ; 2nde `synthese/` |
| `ETAPES` : gestes dans l'ordre | `assets/etapes.js` | existe | — | 01, 21 |
| `ORGA` : molécules organiques | `assets/orga.js`, `assets/orga-dessin.js`, `assets/orga.css` | existe | étendu par 15 (flèches courbes) | 03, 04, 10, 15, 21 |
| `TITRAGE` : simulateur de titrage (modèle + dessin) | `assets/titrage.js`, `assets/titrage.css` | existe (`titrage-ph/`) | — | 06, 10 |
| `MONTAGE` : circuits | `assets/montage.js`, `assets/montage.css` | existe | — | 14 |
| `OPT` : rayons lumineux | `assets/optique.js`, `assets/optique.css` | existe | — | 19, œil |
| `VEC` : repère, vecteurs | `cinematique/modules/vecteurs.js` (chargé depuis son dossier) | existe | — | 07, 08, 09, 13, forces |
| `LG` : lectures graphiques | `lecture-graphique/modules/lgtools.js` (depuis son dossier) | existe | — | 03, 06, 14, 15, 16, 17 |
| `MOL` : formules, équilibrage | `assets/molecules.js` | existe | — | 01, 06 |
| `BULLE`, `PLEIN`, `SCHM` (schéma de méthode des quantités de matière) | `assets/bulle.js`, `assets/plein-ecran.js`, `assets/schema-methode.js` | existent | — | toutes / 01, 06, 21 |

## 10. Avancement

**À tenir à jour par chaque session** : à la fin du travail, mets à jour la ligne de ton prompt (état, date, dossier, remarques) et, si tu as créé un outil, son état au §9, dans le même commit que l'application. États : « à faire », « maquettes livrées », « fait », « fait (à revoir : … ) ».

Ordre conseillé : `outils-communs.md` d'abord ; puis les chapitres dans l'ordre ; les applications annexes avant le chapitre qui les cite (colonne « Avant »).

| Prompt | Application (nom) | Dossier | Avant | État | Date | Remarques |
|---|---|---|---|---|---|---|
| `outils-communs.md` | Éditeur d'équations partagé, pages externes ↗ | `assets/` | tous | fait | 25/11/2026 | `equations-physique-mobile/` charge `EQ` ; `acides-bases/`, `radioactivite/` migrées ; `puissance-active/modules/pa-moteur.js` ; page ↗ : `appNom` facultatif (nom de l'autre application, en petit) |
| `chapitre-01.md` | Rappels de chimie | `rappels-chimie/` | | à faire | | crée `DILUTION` (et `PAILLASSE`) s'ils n'existent pas |
| `chapitre-02.md` | Nomenclature | `nomenclature/` | | fait | 01/11/2026 | |
| `chapitre-03.md` | Méthodes physiques d'analyse | `analyse-physique/` | | à faire | | |
| `chapitre-04.md` | Transformations acide-base | `transformations-acide-base/` | | à faire | | reprend `ph/` puis supprime le dossier |
| — | Cinématique | `cinematique/` | | fait | | déjà en ligne, aucun prompt |
| `chapitre-06.md` | Titrages | `titrages/` | | à faire | | liens ↗ vers `titrage-ph/`, `titrage-conductimetrique/` |
| `bilan-forces.md` | Bilan des forces | `bilan-forces/` | 07 | fait | 26/11/2026 | 2de, 1re, Tle ; moteur extrait dans `bilan-forces/modules/bf.js` ; atelier sur un écran (`modules/atelier.js`, 30 situations, filtre de niveau) ; séries au choix du niveau (`niveaux` de `BF.serie`) ; pas de lien vers `principe-dynamique/`, dont le module 2 est remplacé par une page ↗ vers l'atelier |
| — | Somme des forces et variation de la vitesse | `forces-vitesse/` | | fait | 26/11/2026 | 1re ; cours repris de `bilan-forces/` (ancien cours 5c, Δv⃗) ; charge le moteur `bilan-forces/modules/bf.js` avec son propre plan (`BF_AUTRE_PLAN`) ; page ↗ vers l'atelier de `bilan-forces/` |
| `chapitre-07.md` | Forces et mouvement : lois de Newton | `lois-newton/` | | fait | 26/11/2026 | charge le moteur `bilan-forces/modules/bf.js` avec son propre plan (`BF_AUTRE_PLAN`, comme `forces-vitesse/`) ; page ↗ vers l'atelier de `bilan-forces/` ; ex. 1 à 4 avec `BF.bilan` ; pages sur un écran : cadre `LN.cadre`, `LN.defis`, `LN.grilleForces` (`lois-newton/modules/sim.js`) ; ex. 20 : question complexe (`LN.complexe`) |
| `chapitre-08.md` | Mouvement dans un champ uniforme | `champ-uniforme/` | | à faire | | |
| `travail-force.md` | Travail d'une force | `travail-force/` | 09 | à faire | | spe et STI2D |
| `chapitre-09.md` | Énergie et travail | `energie-travail/` | | à faire | | |
| `chapitre-10.md` | Force des acides et des bases | `force-acides-bases/` | | à faire | | |
| `chapitre-11.md` | Ondes sonores et effet Doppler | `ondes-doppler/` | | à faire | | |
| `chapitre-12.md` | Diffraction et interférences | `diffraction-interferences/` | | à faire | | **deux étapes** (maquettes i = λD/a) |
| `chapitre-13.md` | Mouvement des satellites et des planètes | `satellites-planetes/` | | à faire | | |
| `chapitre-14.md` | Circuit RC | `circuit-rc/` | | à faire | | |
| `chapitre-15.md` | Cinétique chimique | `cinetique-chimique/` | | à faire | | **deux étapes** (maquettes des flèches courbes) |
| `decroissance-radioactive.md` | Désintégration radioactive (mise à jour) | `decroissance-radioactive/` | 16 | à faire | | |
| `chapitre-16.md` | Transformations nucléaires | `transformations-nucleaires/` | | à faire | | |
| `gaz-parfait.md` | Gaz parfait : PV = nRT | `gaz-parfait/` | 17 | à faire | | |
| `chapitre-17.md` | Thermodynamique | `thermodynamique/` | | à faire | | |
| `chapitre-18.md` | Équilibre chimique et piles | `equilibre-piles/` | | à faire | | |
| `modele-oeil.md` | Modèle de l'œil | `modele-oeil/` | 19 | à faire | | sort le module 3 de `lentilles/` |
| `chapitre-19.md` | Lunette astronomique | `lunette-astronomique/` | | à faire | | |
| `chapitre-20.md` | Mouvements d'un fluide | `mecanique-fluides/` | | à faire | | |
| `chapitre-21.md` | Synthèse organique | `synthese-organique/` | | à faire | | mis en commun avec 2nde 12 |
| `chapitre-22.md` | Photons et effet photoélectrique | `photons/` | | à faire | | |
| `chapitre-23.md` | Électrolyse | `electrolyse/` | | à faire | | |

## 11. Décisions du professeur (questions posées à la rédaction des prompts)

- Les prompts résument les cours ; les sessions lisent elles-mêmes énoncés et corrections des exercices.
- Modules situés dans une autre application : pages ↗ du sommaire, comptées dans l'avancement (§6).
- Simulations : le bilan s'intitule « Bilan », jamais « ✍ Complète ton cours ».
- TP : non intégrés. Flashcards : plus tard, à part.
- Simulateurs : pages du chapitre, sauf les applications à part demandées : bilan des forces, travail d'une force (remplace le simulateur de `energie-cinetique/`), gaz parfait, modèle de l'œil, et `decroissance-radioactive/` mise à jour sur place.
- `ph/` : recopiée dans « Transformations acide-base », retirée du portail puis **supprimée** (chapitre 4). Avant, `outils-communs.md` retire toute dépendance : `acides-bases/` et `radioactivite/` passent de `ph/modules/eq.js` à `EQ`, `puissance-active/` reçoit sa propre copie du moteur `ph/modules/ph.js`.
- Dilution (chapitre 1) et synthèse (chapitre 21) : outils partagés avec les applications de 2nde (`solutions/`, `synthese/`), créés par la première session qui en a besoin ; les prompts de 2nde le disent aussi.

## 12. Avant de livrer

- Passe la liste du §10 de la charte (Playwright / Chromium à 1280 px et 390 px avec `hasTouch: true, isMobile: true` ; ne lance pas `playwright install`), et pour chaque simulation les contrôles du §5.
- Typographie : `python3 docs/outils/typo.py --corriger DOSSIER`, puis `docs/outils/verif-typo.js` sur les pages rendues (charte §7).
- Vérifie **chaque donnée et chaque résultat des exercices et des séries** (valeur numérique, chiffres significatifs, formule, équation équilibrée) avec un petit script dans le scratchpad, pas de tête.
- Outils partagés créés ou modifiés : chaque application qui les charge est retestée. Liens ↗ : l'état de la page externe se met à jour après l'avoir faite dans l'autre application.
- Mets à jour l'avancement (§10) et, si besoin, le tableau des outils (§9). Commits en français, clairs ; push sur `TSpe`. Compte rendu court : ce qui est fait ; les écarts avec le prompt et pourquoi ; les erreurs trouvées dans les sources ; ce qui n'est pas testable (Safari iOS).
