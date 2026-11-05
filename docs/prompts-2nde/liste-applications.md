# Applications de 2nde : liste à valider, puis un prompt par application

Ce prompt se lance en deux étapes, dans une session cloud sur `xlallemand/applications-physique`.

- **Étape 1** : écris seulement
  > Lis `docs/prompts-2nde/liste-applications.md` et exécute l'étape 1.

  La session produit `docs/prompts-2nde/liste-applications.html`. L'enseignant l'ouvre dans son navigateur, valide, modifie ou supprime chaque application, puis clique sur « Copier mes retours ».
- **Étape 2** (même session ou nouvelle session) :
  > Lis `docs/prompts-2nde/liste-applications.md` et exécute l'étape 2. Retours : (coller ici)

  La session produit `00-commun.md`, `README.md` et un prompt par application retenue.
- Ensuite, chaque application se développe dans **sa propre session** :
  > Lis `docs/prompts-2nde/NN-<dossier>.md` et exécute-le.

## 0. Branche et dépôts

- Travaille sur la branche `2nde` de `applications-physique` : `git fetch origin 2nde && git checkout 2nde`, puis pousse sur `2nde`. Si la session impose une autre branche, pars de `2nde`, pousse sur la branche imposée et signale-le dans le compte rendu.
- Dépôt des cours `xlallemand/Cours-2nde` : s'il n'est pas dans la session, attache-le avec `add_repo` (lecture seule) et clone-le dans `/home/user/Cours-2nde`. **Ne le modifie jamais.**
- Pas de pull request sans demande.

## 1. Objectif

Créer pour les élèves de 2nde des **simulateurs, animations et outils de manipulation**, pas des cours. L'élève agit (place, glisse, touche, règle un paramètre, choisit une expression) ; l'application montre, vérifie et explique l'erreur. Une application peut regrouper plusieurs modules.

## 2. Consignes, par ordre de priorité

### Niveau 1 : règles impératives

1. `CLAUDE.md` et `docs/charte-applications.md` : style, navigation (`SOM`), portail, vérifications. La charte prime pour la présentation et la navigation ; ce prompt prime pour le contenu (pas de cours).
2. Fichiers ouverts directement dans le navigateur (`file://`) : scripts classiques, pas de `fetch()`, pas de bibliothèque externe, chemins relatifs (charte §1).
3. Tout se fait à la souris **et** au doigt : Pointer Events (`assets/dragdrop.js`), cibles larges, rien qui dépende du survol (charte §8).
4. Textes en français, tutoiement, ton direct ; espace insécable avant : ; ? ! et à l'intérieur des « » ; police sans empattement ; couleurs uniquement par les variables de `assets/theme.css` ; code commenté en français.
5. **Notations, vocabulaire et méthodes du cours du professeur** (`Cours-2nde`), puis du programme officiel. Aucune notation différente.
6. **Pas de cours** : pas de pages `cours` (notion → exemple → « À toi »). Seulement des rappels courts (bulle ⓘ, encadré de 2 ou 3 lignes) et des liens « Revois… » vers une application existante.
7. Réutiliser avant de créer. Un outil existant s'utilise ou s'étend sans casser les applications qui l'emploient.

### Niveau 2 : applications indispensables

Chacune doit figurer dans la liste, seule ou comme module d'une application plus large. Les notations entre parenthèses sont à confirmer dans le cours.

**I1. Mesurer une période et une fréquence**
- Sur un signal périodique (oscillogramme, son, électrocardiogramme…) : repérer un motif, mesurer plusieurs périodes pour gagner en précision, T = Δt / n, puis f = 1 / T, avec les unités et les conversions (ms → s).
- **Utiliser l'outil de `lecture-graphique/`** : `modules/lgtools.js` et `lgtools.css` (graphiques en millimètres « papier », règle virtuelle, étiquettes à glisser, déroulé « division par le nombre de périodes »). `puissance-active/` le charge déjà depuis son dossier d'origine : faire de même, ne pas le copier.
- Variante écran d'oscilloscope : nombre de divisions × base de temps.
- Sources : `01- Signaux sonores/`.

**I2. Réfraction et relation de Snell-Descartes**
- Plusieurs situations : air → eau, eau → air, air → verre, verre → air, demi-cylindre du TP, incidence normale, surface horizontale, verticale ou inclinée, lumière venant de différents côtés.
- L'élève **place sur le schéma** : point d'incidence, normale, rayon incident, rayon réfracté, angle d'incidence et angle de réfraction (mesurés depuis la normale), indices des deux milieux. Puis il **écrit la relation** (n₁ × sin i₁ = n₂ × sin i₂) avec des étiquettes à glisser, notations accordées aux milieux de la situation.
- Erreurs à diagnostiquer : angle mesuré depuis la surface, indices inversés, rayon réfracté du mauvais côté de la normale, rayon qui se rapproche de la normale alors qu'il devrait s'en éloigner (et l'inverse).
- Ensuite, simulateur : l'élève fait varier l'angle d'incidence et voit le rayon réfracté ; calcul d'un angle ou d'un indice.
- Sources : `02- Lumiere/` (cours, `Chap2-Fiche methode.pdf`, `TP1-refraction_complete.docx`, exercices et corrections).

**I3. Chromatographie sur couche mince**
- Animation : ligne de dépôt, dépôts, cuve avec l'éluant sous la ligne de dépôt, montée du front de l'éluant qui entraîne chaque espèce à sa vitesse, repérage du front, révélation (selon le TP), chromatogramme final. Commandes : choix des dépôts (espèces pures, mélanges), lecture, pause, vitesse, recommencer.
- Exercices d'exploitation **directement sur les taches** : l'élève touche une ou plusieurs taches, puis construit sa conclusion avec des **expressions à piocher** (« corps pur », « mélange », « une seule tache », « plusieurs taches », « taches à la même hauteur », « contient l'espèce … », « ne contient pas l'espèce … », « espèce non identifiée »…). Questions types : ce dépôt est-il un corps pur ? quels sont ses constituants ? telle espèce est-elle présente ?
- Erreurs à diagnostiquer : hauteurs comparées depuis le bas de la plaque au lieu de la ligne de dépôt, tache d'un mélange attribuée à une espèce absente des références, conclusion sans justification.
- Sources : `2- Corps purs et melanges/` (cours, `TP2 - CCM.pdf`, exercices, devoir).

**I4. Atome : couches électroniques et configuration électronique**
- Construire l'atome (éléments au programme, Z ≤ 18) : remplir les couches et sous-couches dans l'ordre du cours, voir la configuration s'écrire en direct (exposants), repérer la couche externe et les électrons de valence.
- Exercices : de Z à la configuration ; de la configuration à Z et à l'élément.
- Erreurs à diagnostiquer : ordre de remplissage, nombre maximal d'électrons par sous-couche, total différent de Z.
- Sources : `03- Atomes et ions/` (cours complété `Chap04-Cours complete.pdf`, `TP1 - modeles atome complete.docx`, exercices), `04- Entites plus stables/` (cours ; `Animations.txt` : liens dont s'inspirer sans les copier).

**I5. Ions : gagner ou perdre des électrons**
- Très visuel : les charges + du noyau et − des électrons se compensent deux à deux ; l'élève retire ou ajoute des électrons sur la couche externe ; la charge restante apparaît et s'écrit (Na⁺, Mg²⁺, Cl⁻, O²⁻) ; le noyau ne change pas.
- Prévoir la charge : configuration du gaz noble le plus proche (règles du duet et de l'octet si le cours les emploie) ; pourquoi Na perd 1 électron plutôt que d'en gagner 7.
- Sources : `03- Atomes et ions/` (cours, `Chap04-Fiche1-ions complete.docx`), `04- Entites plus stables/` (cours).

**I6. Classification périodique : faire les liens**
- Tableau interactif (18 premiers éléments au moins, plus ceux du cours). Toucher un élément montre puis fait retrouver :
  1. la structure électronique (ligne ↔ couche externe) ;
  2. le nombre d'électrons de valence (colonne) ;
  3. l'ion formé ;
  4. le nombre de liaisons dans une molécule (doublets liants et non liants).
- Modes : exploration, puis défis (placer un élément d'après sa configuration, prévoir l'ion d'un élément d'une colonne, prévoir le nombre de liaisons, reconnaître une famille : alcalins, halogènes, gaz nobles).
- Sources : `04- Entites plus stables/` (cours-fiche-exos, `TP1 - Mendeleiev complete.docx`, `TP2 - Molecules complete.pdf`).

**I7. Formules de Lewis**
- Reconnaître si une formule de Lewis est bien écrite et dire pourquoi (duet, octet, atome par atome ; nombre de doublets) ; compléter une formule (doublets liants ou non liants manquants).
- **Réutiliser le moteur `ORGA`** de `nomenclature/` : `assets/orga.js`, `assets/orga-dessin.js`, `assets/orga.css` (écriture `developpee` avec doublets, éditeur `ORGA.editeur`, outils `ORGA.partieH`, `ORGA.dessinActif`). Vérifier ses limites pour la 2nde (hydrogènes implicites, molécules sans carbone ou sans atome autre que H : H₂O, NH₃, HCl, H₂, O₂, N₂, CO₂) et proposer une extension compatible si besoin.
- Sources : `04- Entites plus stables/` (cours, `TP2 - Molecules complete.pdf`).

**I8. Image d'un objet par une lentille mince convergente**
- L'élève trace lui-même les rayons particuliers (par le centre optique ; parallèle à l'axe puis par F' ; par F puis parallèle à l'axe) en glissant ; chaque rayon est vérifié ; l'image A'B' se construit à l'intersection.
- Ensuite, simulateur : déplacer l'objet ou changer la distance focale, voir l'image bouger ; caractéristiques de l'image (sens, taille, position) et grandissement si le cours le traite.
- Sources : `05- Lentilles minces convergentes/` (cours-exercices, TP1, TP2, `construction image lentille.pps`, `Liens.txt`).

**I9. Électricité : réaliser un montage à partir d'un schéma**
- **Méthode imposée, toujours la même :**
  1. repérer sur le schéma la boucle principale, celle qui contient le générateur (l'élève la surligne) ;
  2. partir d'une borne du générateur (celle du TP) et suivre dans l'ordre les fils et les dipôles en série, en réalisant le montage au fur et à mesure ;
  3. ajouter ensuite les dérivations, une par une, toujours dans l'ordre du schéma.
- À l'écran (côte à côte sur ordinateur, l'un sous l'autre sur téléphone) :
  - la **table de montage** : dipôles et fils **dessinés de façon réaliste**, comme en salle de TP (générateur et ses bornes, lampes sur support, résistances, interrupteur, moteur, DEL, multimètre en ampèremètre ou en voltmètre avec ses bornes… selon le matériel du TP) ;
  - le **schéma normalisé**, sur lequel chaque élément branché **se colore**.
- **Ordre obligatoire** : pas de dérivation avant que la boucle principale soit fermée ; un branchement hors de l'ordre est refusé avec une explication. Le circuit ne fonctionne (lampes allumées) que s'il est conforme au schéma.
- Progression : circuit série simple → série avec interrupteur et ampèremètre → une dérivation → plusieurs dérivations et voltmètre.
- Sources : `10- Electricite/` (`TP circuit electrique complete.pdf`, `Fiche TP.pdf`).

### Niveau 3 : applications à proposer

Propose d'autres applications à partir du programme et des dossiers de `Cours-2nde`. Privilégie ce qui est difficile à voir ou à réaliser en classe, ce qui se manipule, et ce qui réutilise un outil. Pistes à trier, regrouper, compléter ou écarter en justifiant :

- Signaux sonores : émission, propagation, réception ; célérité mesurée par le retard entre deux récepteurs (TP 2 et 3) ; domaine audible ; niveau sonore (Fiche 1).
- Lumière : dispersion par un prisme (TP 2), en lien avec `spectres-etoiles/`.
- Lentilles : modèle réduit de l'œil.
- Mouvements : chronophotographie, trajectoire, vitesse, relativité du mouvement (s'inspirer de `cinematique/`).
- Forces : diagramme objet-interaction, bilan des forces et vecteurs force, principe d'inertie (s'inspirer du bilan des forces de `principe-dynamique/`) ; interaction gravitationnelle.
- Corps purs et mélanges : masse volumique pour identifier un liquide, composition de l'air, tests d'identification (TP 3), palier de changement d'état d'un corps pur.
- Solutions aqueuses : dissolution et dilution geste par geste (verrerie, ordre imposé comme en électricité), concentration en masse, échelle de teinte.
- Mole : dénombrer par paquets (activité grains de sable).
- Transformation nucléaire : conservation du nombre de masse et du numéro atomique.
- Synthèse : montage de chauffage à reflux à assembler dans l'ordre (TP de `13- Synthese/`).
- Électricité : caractéristique tension-courant et loi d'Ohm ; lois des nœuds et des mailles ; capteurs.

### Niveau 4 : déjà fait pour la 2nde, à ne pas refaire

- `spectres-etoiles/`, `equilibrer-reactions/`, `avancement-reaction/` (modules 1 à 4 pour la 2nde) ; outils mathématiques `lecture-graphique/`, `conversions/`, `puissances-10/`, `proportionnalite/`, `equations-en-physique/`, `equations-en-physique-avec-aide/`.
- À rappeler dans la liste (non modifiable). Un complément à l'une d'elles peut être proposé comme item à part (« extension de … »).

## 3. Sources

### Dépôt `Cours-2nde` (lecture seule)

- `Programme Physique Chimie 2nde.pdf` (racine) : programme officiel, texte tapé (`pdftotext -layout`). Sert à rattacher chaque application aux notions et capacités exigibles et à vérifier ce qui est au programme.
- Un dossier par chapitre ; le nom du dossier fait foi (les numéros des fichiers, comme `Chap04` dans `03- Atomes et ions/`, ne le suivent pas toujours).

| Dossier | Fichiers utiles | Pour |
|---|---|---|
| `01- Signaux sonores/` | cours complété, exercices et correction, `TP 1 - frequence complete.docx`, `TP 2 - celerite ultrasons complete.docx`, `TP 3 - celerite son.pdf`, fiches 1 et 2, devoir | I1, sons |
| `02- Lumiere/` | cours complété, `Chap2-Fiche methode.pdf`, `TP1-refraction_complete.docx`, `TP2-dispersion_lumiere complete.pdf`, exercices (+ supplémentaires), devoir, interro | I2, dispersion |
| `2- Corps purs et melanges/` | cours complété, activités 1 et 2, `TP1-Masse volumique.pdf`, `TP2 - CCM.pdf`, `TP3 - tests ions.pdf`, exercices, devoir | I3, propositions |
| `03- Atomes et ions/` | `Chap04-Cours complete.pdf`, `Chap04-Fiche1-ions complete.docx`, `TP1 - modeles atome complete.docx`, `TP2 - element cuivre.pdf`, exercices, devoir | I4, I5 |
| `04- Entites plus stables/` | `Chap04-Cours-fiche-exos complete.pdf`, `TP1 - Mendeleiev complete.docx`, `TP2 - Molecules complete.pdf`, exercices, devoir, `Animations.txt` | I5, I6, I7 |
| `05- Lentilles minces convergentes/` | `Chap05-Cours-exercices complete.pdf`, TP1, TP2, exercices 2, devoir, `construction image lentille.pps`, `Liens.txt` | I8 |
| `06- Description des mouvements/` | cours-exercices, `TP1 - Vitesse.pdf`, ressource chronophotographie | propositions |
| `07- Forces/` | cours complété, `Chap07-Fiche Bilan des forces-correction.pdf`, exercices, devoir | propositions |
| `08- Solutions aqueuses/` | cours-exercices, `TP1-dissolution-dilution complete.pdf`, `TP1-fiches methode.pdf`, résolution de problème, devoir, idée d'échelle de teinte | propositions |
| `09- Mole et transformation chimique/` | cours, fiches 1 et 2, activité grains de sable, TP bouteille bleue, TP transformation | propositions (avancement déjà fait) |
| `10- Electricite/` | `TP circuit electrique complete.pdf`, `Fiche TP.pdf` | I9 |
| `13- Synthese/` | `TP - synthese ethanoate de linalyle.pdf` | propositions |

À ignorer : `~$voir Lumiere.docx` (fichier temporaire de Word), `Saut parachute.mp4`, `Introduction.pptx` (lourds), sauf besoin précis. Les liens des `.txt` servent d'inspiration ; le réseau peut les bloquer.

Lecture des fichiers (comme `docs/prompts-sti2d/00-commun.md` §1) :
- cours complétés et corrections contiennent des **annotations manuscrites** : lis le PDF avec `Read` et `pages`, une page à la fois, une seule fois, en notant ce qui sert ;
- `.docx` et `.pps` : `soffice --headless --convert-to pdf --outdir <scratchpad> "<fichier>"`, puis lis le PDF obtenu ;
- texte tapé seul (programme, consignes) : `pdftotext -layout`, bien moins cher.

### Dépôt `applications-physique`

| Fichier | Pour |
|---|---|
| `CLAUDE.md`, `docs/charte-applications.md` | règles ; étape 1 : §1, §2, §5 (types de pages, application sans plan), §6 « Manipulation directe », §8 ; étape 2 : en entier |
| `docs/prompts-sti2d/00-commun.md`, `docs/prompts-sti2d/README.md`, `docs/prompts-sti2d/chapitre-17.md` | modèle de forme des prompts de l'étape 2 |
| `docs/flashcards/relecture/relecture.js` (en-tête), `docs/flashcards/maquettes/relecture.html` | modèle de la page de validation : Valider / Modifier / Supprimer, « Copier mes retours », choix gardés |
| `index.html` (racine), liste `APPS` | applications existantes, niveau `'2de'` |
| `lecture-graphique/modules/lgtools.js` (en-tête) | I1 |
| `assets/orga.js`, `assets/orga-dessin.js` (en-têtes), `nomenclature/` | I7 |
| `assets/dragdrop.js`, `assets/molecules.js`, `assets/hero.js` (en-têtes) | glisser-déposer, formules et boules, dessins d'en-tête |
| `spectres-etoiles/`, `ondes-sonores/`, `spectre-signal/`, `principe-dynamique/`, `cinematique/` | exemples de simulations et de manipulations existantes |

Ne lis que les en-têtes et le strict nécessaire : les prompts de l'étape 2 nommeront les fichiers précis.

## 4. Étape 1 : la liste à valider

### 4.1 Lire, le minimum

1. `CLAUDE.md`, la charte (sections du §3).
2. Le programme officiel, en entier (texte).
3. Pour chaque chapitre concerné : les titres et notations du cours complété (premières pages) ; pour I2, I3 et I9, le TP (matériel, méthode).
4. Les en-têtes des outils réutilisables.

### 4.2 Construire la liste

- Des applications de 1 à 4 modules. Chaque indispensable (I1 à I9) est couvert ; indique « couvre I4, I5 ». Propose les regroupements qui ont du sens (par exemple atome et ions, ou classification et Lewis) en justifiant ; l'enseignant tranche.
- Classement par thème du programme (Constitution et transformations de la matière ; Mouvement et interactions ; Ondes et signaux), puis par priorité : **indispensable**, puis **proposée** (par intérêt décroissant).
- Propositions : celles qui apportent vraiment quelque chose, en général 5 à 10.

### 4.3 Descriptif de chaque application

- identifiant stable (`A01`, `A02`… ; modules `A01-M1`…) ;
- nom court et parlant pour un élève ; dossier proposé (minuscules, tirets) ; domaine (physique / chimie) ; priorité ; indispensables couverts ;
- chapitres de `Cours-2nde` et capacités exigibles du programme (citées brièvement) ;
- résumé en 2 ou 3 phrases : ce que fait l'élève, ce que montre l'application ;
- pour chaque module : type (simulation, animation, manipulation guidée, entraînement noté sur 20) et déroulé en quelques puces (actions de l'élève, réponses de l'application, erreurs repérées, situations prévues) ;
- outils réutilisés ou à créer (fichiers), dépendances avec d'autres applications ;
- taille estimée (S, M, L) ;
- 3 questions au plus à trancher par l'enseignant, précises, avec des choix (« Notation des angles : i₁ et i₂ comme dans la fiche méthode, ou autre ? »).

En plus, une section « Outils partagés » (par exemple un moteur de rayons lumineux commun à I2 et I8, un modèle d'atome commun à I4, I5, I6) avec l'ordre de développement conseillé, et le rappel des applications déjà faites.

### 4.4 La page `docs/prompts-2nde/liste-applications.html`

Outil pour l'enseignant, pas une application du portail : ne pas l'ajouter à `APPS`.

- Un seul fichier HTML autonome, qui fonctionne ouvert en `file://` après téléchargement depuis GitHub. Données dans un tableau JavaScript en tête de script (une entrée par application, version de la liste). Charge `../../assets/theme.css` et n'emploie que ses variables de couleur. Police sans empattement, lisible à 390 px, souris et tactile.
- Une carte par application : tout le descriptif du §4.3, modules dépliables, et trois boutons **Valider**, **Modifier**, **Supprimer**. « Modifier » ouvre une zone de remarque. Par module : case « garder » et remarque facultative. Pour chaque question à trancher : les choix proposés et un champ libre.
- Bandeau : compteurs (validées, modifiées, supprimées, à voir), filtre par état et par thème, « Tout replier ».
- En fin de page : « Applications à ajouter » (autant que voulu) et « Remarques générales ».
- **Copier mes retours** : texte compact qui ne contient que l'utile, par exemple :

  ```
  Retours liste 2nde — version 1 (12 applications)
  A01 Signaux périodiques : VALIDÉE
  A02 Réfraction : MODIFIÉE — remarque : …
    A02-M3 retiré
    Question 1 : i₁ et i₂
  A07 … : SUPPRIMÉE
  Non traitées : A09, A10
  Ajouts : …
  Remarques générales : …
  ```

  `navigator.clipboard`, sinon `document.execCommand('copy')` ; si les deux échouent, le texte s'affiche sélectionné dans une zone de texte (comme `relecture.js`).
- Choix gardés dans `localStorage` (clé `liste-2nde-v<version>`, en `try/catch`) : on peut s'arrêter et reprendre. Bouton « Tout effacer » avec confirmation.

### 4.5 Vérifier et livrer

- Playwright / Chromium (déjà installé, ne pas lancer `playwright install`), à 1280 px et à 390 px avec émulation tactile : chaque bouton, les remarques, la persistance après rechargement, le texte copié, aucune erreur dans la console, aucun défilement horizontal.
- Commit en français, push sur `2nde`.
- Compte rendu court : nombre d'applications (indispensables, proposées), chemin du fichier, comment l'ouvrir (le télécharger depuis la branche `2nde` sur GitHub) et la phrase de l'étape 2.

## 5. Étape 2 : un prompt par application

Entrée : les retours collés par l'enseignant (format du §4.4). Si un retour est ambigu, pose la question avant d'écrire. Si les retours demandent une nouvelle version de la liste plutôt que les prompts, mets à jour la page (version suivante, nouvelle clé `localStorage`) et arrête-toi là.

### 5.1 Lire

1. La charte **en entier**, `docs/prompts-sti2d/00-commun.md` et un ou deux prompts STI2D comme modèle de précision et de longueur (100 à 250 lignes).
2. Pour chaque application retenue : ses sources dans `Cours-2nde` (cours, TP, fiches méthode, exercices et corrections), page par page, une seule fois. Relève les notations exactes, le vocabulaire, les conventions de schéma, les valeurs (indices, distances focales, espèces de la CCM, matériel du TP…), la méthode du professeur et les erreurs fréquentes visibles dans les corrections, avec la référence (fichier, page).
3. Les outils à réutiliser (en-tête, API utile), pour décrire précisément leur emploi.

### 5.2 Écrire dans `docs/prompts-2nde/`

**`00-commun.md`** : instructions communes à toutes les applications de 2nde, sur le modèle de `docs/prompts-sti2d/00-commun.md`, adaptées :
- sources : `Cours-2nde` en lecture seule (`add_repo`, chemin du clone), façons de lire PDF, `.docx` et `.pps` ;
- à lire dans `applications-physique` : `CLAUDE.md`, la charte en entier, les applications de référence ;
- structure : dossier, préfixe, `modules/`, `PLAN` et `SOM`, pages de type `simulation` (▸) et `entrainement` ou `questions` ; **pas de cours ni de fiche** ; rappels courts ; accueil en lignes dépliables ; portail `APPS` avec `niv: ['2de']` ; `AVANCEMENT` de `assets/avancement.js` ; dessin d'en-tête (`assets/hero.js`) ;
- interactions : `assets/dragdrop.js`, cibles tactiles, boutons fléchés en complément du glisser (charte §6 « Manipulation directe »), rien qui dépende du survol, animations avec lecture, pause, vitesse et respect de `prefers-reduced-motion` ;
- retours à l'élève : diagnostics ciblés plutôt qu'un simple « faux » ; série notée sur 20 pour chaque entraînement ;
- outils partagés : le premier qui en a besoin le crée dans `assets/` (en-tête, API) ; les suivants le réutilisent ; toute application existante qui l'utilise est retestée ;
- branche `2nde` ; vérifications du §10 de la charte, plus celles des manipulations (glisser à la souris et au doigt via CDP, ordre imposé, états de fin) ; valeurs numériques vérifiées par un script ; compte rendu court (fait, écarts et pourquoi, non testable : Safari iOS).

**`NN-<dossier>.md`**, un par application retenue, NN dans l'ordre de développement conseillé. Plan imposé :
1. **Nom, dossier, préfixe, domaine, dessin d'en-tête** ; première ligne : « Lis `00-commun.md`, puis exécute ce prompt. »
2. **Objectif et programme** : capacités exigibles visées (citées).
3. **Ce que dit le cours** : notations, vocabulaire, conventions et méthode, avec références (fichier, page), assez complet pour ne pas relire le cours ; ce qu'il faut encore lire (énoncés, figures) et pourquoi.
4. **Plan de l'application** (`PLAN`) : modules et pages ; pour chaque page, ce qui est affiché, le déroulé pas à pas (action de l'élève → réponse de l'application), les états (début, en cours, réussi), les erreurs à diagnostiquer, les données exactes (situations, valeurs, espèces…), la notation s'il y en a une.
5. **Rendu** : SVG ou canvas, disposition à 1280 px et à 390 px, éléments réalistes à dessiner, animations, couleurs (variables du thème).
6. **Outils** : à réutiliser (fichier, fonctions, façon de les charger) ; à créer ou à étendre (API proposée, emplacement, applications à retester).
7. **Vérifications propres** à l'application (cas à tester, valeurs à recalculer).
8. **Hors périmètre** : ce qu'il ne faut pas faire.

**`README.md`**, sur le modèle de `docs/prompts-sti2d/README.md` : utilisation (une session par application, phrase à écrire), tableau (nom, fichier, dossier, modules particuliers, outils), ordre conseillé (outils partagés d'abord).

Les applications supprimées n'ont pas de prompt ; les ajouts de l'enseignant en ont un, comme les autres.

### 5.3 Vérifier et livrer

- Relis chaque prompt : autonome avec `00-commun.md`, sans contradiction avec la charte ni avec les retours, notations identiques à celles du cours, chaque indispensable retenu couvert.
- Commit en français, push sur `2nde`.
- Compte rendu court : fichiers créés et ordre de lancement.
