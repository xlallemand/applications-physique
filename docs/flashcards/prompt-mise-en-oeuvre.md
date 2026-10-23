# Prompt : révisions espacées par flashcards (mise en œuvre)

À donner tel quel à une nouvelle session, sur le dépôt `xlallemand/applications-physique`, branche `flashcard`.

Ce prompt construit le **système** de révision (moteur, pages, intégration au portail et aux applications, sauvegarde) et le met en place sur une première application, `changements-etat`, avec des cartes d'essai. Les cartes définitives de chaque application sont écrites ensuite avec un second prompt, [`prompt-generation.md`](prompt-generation.md), dont ce prompt prépare l'outil de relecture.

---

## 1. Objectif

Chaque application peut proposer des **flashcards** : une question au recto, la réponse au verso. L'élève les range dans une **boîte de révision à cases**, comme une vraie boîte de fiches bristol. Une carte sue avance d'une case et revient plus tard ; une carte ratée recule d'une case et revient plus vite (révisions espacées, « courbe de l'oubli »).

Le système sert aussi d'**exemple** : un élève doit pouvoir refaire la même chose avec des cartes en papier, dans n'importe quelle matière. D'où la boîte à cases visible partout, le vocabulaire de la boîte réelle (cases, intercalaires, « à revoir dans 4 jours ») et l'impression des cartes.

Exigences de l'enseignant : **le moins de clics possible**, tout clair et concis, et l'élève **sait toujours où il en est** dans ses révisions.

## 2. À lire avant de commencer

1. `CLAUDE.md`, puis **en entier** `docs/charte-applications.md` : style, couleurs (variables de `assets/theme.css` uniquement), police sans empattement, navigation `SOM`, moteur de cours `COURS`, progression, tactile, vérifications.
2. **Les maquettes validées** par l'enseignant, dans `docs/flashcards/maquettes/` : ouvre-les dans Chromium (en `file://`, à 1280 px et 390 px) et reproduis-les fidèlement. Elles utilisent les vraies feuilles de style du dépôt.

   | Maquette | Écran |
   |---|---|
   | `portail.html` | portail : pilule « Révisions » et carte noire du jour |
   | `revisions.html` | page Révisions (boîte, 7 prochains jours, applications, méthodes, minuteur, boîte en papier) |
   | `seance.html` | séance de révision (réglage du nombre de cartes, glisser au doigt) ; `seance.html#libre-m4` : révision libre |
   | `appli.html` | accueil d'une application : les trois accès aux flashcards |
   | `cartes.html` | page Flashcards d'une application (boîte, liste, ajout, aperçu d'une carte) |
   | `types.html` | les sept types de cartes, recto et verso, dans les deux sens |
   | `impression.html` | impression A4 recto verso, 8 cartes par feuille |
   | `relecture.html` | outil de relecture de l'enseignant (pour le prompt de génération) |

   `fc.css` contient les styles à reprendre (préfixe `fc-` → `rev-`). **`fc-demo.js` n'est qu'une démonstration** (données fictives, rien d'enregistré) : ne t'en sers pas comme moteur, mais ses 28 cartes servent de cartes d'essai (§11).
3. `assets/sommaire.js` (accueil, sommaire, `marquer`), `assets/cours.js` (`Cours.prototype.lancer` : fin du cours), `index.html` (portail : `APPS`, `hero-nav`, `.feuille`), `assets/progression.js` (`typeDeCle`, `nettoyer`, `significatif`, `fusionner`), `assets/avancement.js`.
4. L'application `changements-etat/` (moteur `modules/ce.js`, `PLAN`, cours, fiches).

## 3. Décisions de l'enseignant (à respecter)

| Sujet | Décision |
|---|---|
| Boîte | **7 cases** : 1, 2, 4, 7, 14, 30 et 60 jours ; après la 7ᵉ case, la carte est **sue** (118 jours sans erreur, environ 4 mois). |
| « Je ne savais pas » | la carte **recule d'une case** (pas de retour en case 1). |
| Carte ratée pendant une séance | elle **revient à la fin de la séance** jusqu'à « Je savais » ; sa case ne change qu'à la **première** réponse. |
| Carte sue | **sort du planning** ; elle reste visible dans la liste et révisable en « Tout réviser ». |
| Retard | séances de **20 cartes au plus par défaut** ; l'élève choisit 10, 20, 30 ou sans limite, **à tout moment** (page Révisions et pendant la séance) ; en fin de séance, « Continuer » propose les cartes suivantes. Les cartes en retard passent en priorité. |
| Ajout | les cartes entrent dans la boîte **quand l'élève clique sur « Ajouter »**, **par paquet** (un paquet = un cours : le module, ou chaque sous-module de cours). **Première révision le lendemain.** Juste après l'ajout, on propose **« Les réviser maintenant »** : révision libre, les cartes restent à réviser le lendemain quels que soient les résultats. |
| Avant le cours | « Disponible après : Cours … » et un petit lien **« Ajouter quand même »** (la charte n'interdit rien). |
| Où ajouter | à la **fin du cours** (carte « À retenir »), dans le **module déplié de l'accueil**, sur la **page Flashcards** de l'application. Pas sur la fiche. |
| Accueil de l'application | les trois accès : **bloc « Flashcards du chapitre »** sous « Reprendre », **bouton « Flashcards » dans chaque module**, **ligne « Flashcards »** en bas de la liste **et dans le sommaire**. |
| Portail | pilule **« Révisions »** dans le bandeau, avec le nombre de cartes dues ; **carte noire** « N flashcards à réviser aujourd'hui » quand il y en a. |
| Vues de l'avancement | la **boîte à cases** (paquets côte à côte), les **7 prochains jours**, la **liste des cartes** avec case et date. |
| Séance depuis le portail | cartes de **toutes les applications mélangées**, chapitre écrit sur chaque carte. |
| Réponse | **deux boutons** « Je savais » / « Je ne savais pas », la case suivante écrite dessous. |
| Raccourcis | ordinateur : **Espace** (voir la réponse), **→** (je savais), **←** (je ne savais pas). Téléphone : **toucher la carte** la retourne, **la glisser à droite** = je savais, **à gauche** = je ne savais pas (comme les applis de « match »). Les boutons restent. |
| Avant un contrôle | **« Tout réviser (sans changer mon planning) »** sur la page Flashcards de l'application. |
| Papier | **« Imprimer les cartes »** sur la page Flashcards : A4 recto verso, à découper au format bristol. |
| Pomodoro | présentation **et petit minuteur 25 / 5 min** sur la page Révisions. |
| Méthodes | présentation rapide sur la page Révisions : **feuille blanche**, **révisions espacées** (courbe de l'oubli), **Pomodoro**, et **comment fabriquer sa boîte en papier**. |

## 4. Vocabulaire

- **Carte** : une flashcard. Elle a une ou deux **faces** `{ q, r }` (question, réponse).
- **Sens** : une carte à deux faces (définition, formule) est révisée **une fois dans un sens, la fois suivante dans l'autre** (face 1, face 2, face 1…).
- **Paquet** : les cartes d'un cours. On les ajoute ensemble. Chaque paquet a ses **prérequis** (`apres`) : les pages de cours à avoir faites.
- **Case** : 1 à 7 (délai avant la révision suivante), puis **sue**.
- **Carte due** : dans une case 1 à 7, et sa date de révision est aujourd'hui ou passée.
- **Séance** : révision des cartes dues (le planning change).
- **Révision libre** : révision sans effet sur le planning (« Tout réviser », « Les réviser maintenant »).

## 5. Planning : règles exactes

- `INTERVALLES = [1, 2, 4, 7, 14, 30, 60]` (jours), case `c` de 1 à 7 ; `c = 8` : sue.
- **Dates** : jours civils **locaux**, chaîne `AAAA-MM-JJ`. Le jour change à minuit, heure locale. N'utilise pas `toISOString()` (UTC) pour fabriquer une date.
- **Ajout d'un paquet** : `ajouts[paquet] = aujourd'hui` ; chaque carte : `{ c: 1, d: demain, s: 0, n: 0, ok: 0 }`. Une carte apparue plus tard dans un paquet déjà ajouté (nouvelle version du fichier de cartes) est ajoutée de la même façon au chargement suivant. Une carte qui n'existe plus dans le fichier est ignorée (son état est gardé, elle n'est plus comptée).
- **Réponse en séance** (première présentation de la carte dans la séance) :
  - « Je savais » : `c + 1` ; si on arrive à 8, la carte est sue (`d` supprimé) ;
  - « Je ne savais pas » : `max(1, c − 1)` ;
  - `d = aujourd'hui + INTERVALLES[nouvelle case − 1]` : le délai part **du jour de la révision** (une carte revue en retard n'est ni punie ni avantagée) ;
  - `s = (s + 1) % nombre de faces` ; `v = aujourd'hui` ; `n + 1` ; `ok + 1` si « Je savais ».
- **Carte ratée** : remise en fin de file ; elle revient jusqu'à « Je savais ». Ces passages ne changent plus rien à son état.
- **Choix des cartes d'une séance** : les cartes dues, triées par case croissante puis par retard décroissant ; on prend les `parSeance` premières (20 par défaut, 0 = sans limite) ; puis on les **mélange**, en évitant deux cartes de la même application d'affilée quand c'est possible.
- **Fin de séance** : s'il reste des cartes dues, « Encore N cartes à réviser aujourd'hui » + « Continuer (k de plus) » + « Plus tard ».
- **Révision libre** : mêmes écrans ; aucun changement d'état (ni `c`, ni `d`, ni `s`, ni `n`) ; on montre la face `s` ; les ratées reviennent en fin ; pas de limite ; mention « Révision libre : ta boîte ne change pas ».
- **Estimation de durée** affichée : 30 s par carte, arrondi à la minute supérieure.

## 6. Données

### 6.1 Les cartes : `<dossier>/modules/flashcards.js`

Écrit par le prompt de génération, chargé par une balise `<script>` (jamais de `fetch`, bloqué en `file://`).

```js
/* Flashcards de l'application « Chapitre 11 : Changements d'état et transferts thermiques »
   écrites avec docs/flashcards/prompt-generation.md, validées par l'enseignant le AAAA-MM-JJ */
REV.paquets({ dossier: 'changements-etat', titre: 'Chapitre 11 : Changements d\'état et transferts thermiques',
              court: 'Chapitre 11', matiere: 'physique' }, [
  { id: 'm3', module: 3, titre: 'Énergie et changement de température',
    apres: ['module_3_cours'],                       // clés des pages du PLAN à avoir faites (toutes)
    cartes: [
      { id: 'ce-3-formule', type: 'formule', competence: 'Calculer Q = m c (Tf − Ti) avec les bonnes unités',
        faces: [                                     // deux faces : révisée dans les deux sens
          { q: 'Énergie Q reçue par un corps de masse m qui passe de T<sub>i</sub> à T<sub>f</sub> sans changer d\'état ?',
            r: '<p class="rev-formule">Q = m × c × (T<sub>f</sub> − T<sub>i</sub>)</p><p class="rev-unites">Q en J · m en kg · c en J·kg<sup>−1</sup>·K<sup>−1</sup></p>' },
          { q: '…', r: '…' }] },
    ] },
]);
```

- `type` : `definition`, `formule`, `savoir`, `schema`, `graphique`, `methode`, `reflexe` (libellés : Définition, Formule, À savoir, Schéma, Lecture graphique, Méthode, Réflexe).
- `q`, `r` : HTML écrit selon la charte §7. Classes utilisables : `rev-formule`, `rev-unites`, `rev-fig` (figure), `rev-tab` (petit tableau), listes `<ol>`.
- **Figures : SVG en ligne, autonome** (attributs de présentation, aucune classe d'une application) : la page Révisions ne charge pas les moteurs des applications.
- `id` des cartes : unique dans tout le dépôt, stable (l'avancement de l'élève y est attaché).

### 6.2 L'avancement : `<dossier>-flashcards` (`localStorage`)

```json
{ "ajouts": { "m1": "2026-10-11", "m3": "2026-10-21" },
  "cartes": { "ce-3-formule": { "c": 2, "d": "2026-10-25", "s": 1, "v": "2026-10-23", "n": 3, "ok": 2 } } }
```

`c` case (1 à 8), `d` prochaine révision (absente si sue), `s` face de la prochaine révision, `v` dernière révision (absente si jamais revue), `n` nombre de révisions, `ok` nombre de « Je savais ». La clé commence par le dossier : elle part avec « Enregistrer ma progression ».

### 6.3 Le réglage : `revisions-reglages`

`{ "parSeance": 20 }` (10, 20, 30 ou 0 pour sans limite). Clé commune à toutes les applications.

### 6.4 Enregistrer et reprendre (`assets/progression.js`)

- `typeDeCle` : `<dossier>-flashcards` → type `flashcards` ; `revisions-reglages` → clé acceptée sans application (comme `equamath_v2`, mais rattachée à aucune application : elle n'apparaît pas dans la liste « N applications » de la fenêtre).
- `nettoyer('flashcards')` : `ajouts` = `{ nom : date }` ; `cartes` = `{ id : { c entier 1-8, d date (absente si c = 8), s entier 0-1, v date, n entier ≥ 0, ok entier 0-n } }` ; dates `^\d{4}-\d{2}-\d{2}$`. `revisions-reglages` : `parSeance` ∈ {0, 10, 20, 30}.
- `significatif` : au moins un paquet ajouté.
- `fusionner('flashcards')` : `ajouts` = réunion (date la plus ancienne) ; pour chaque carte, l'état **revu le plus récemment** (`v` le plus grand ; à égalité, `n` le plus grand ; une carte jamais revue perd contre une carte revue) ; une carte présente d'un seul côté est copiée. Réglages : ceux du navigateur. Fusion idempotente.
- Mets à jour le tableau des règles de fusion dans la charte (§5).

## 7. Fichiers

À créer :

| Fichier | Rôle |
|---|---|
| `assets/revisions.js` | moteur commun, espace de noms `REV` (IIFE `'use strict'`) : registre des applications à cartes `REV.APPLIS` (dossiers, dans l'ordre du portail), `REV.paquets()`, chargement des fichiers de cartes, planning, état, rendus (face, boîte, 7 jours, liste, séance, impression, minuteur) et intégrations (portail, accueil, sommaire, fin de cours). Découpe en deux fichiers si c'est plus clair (ex. `revisions-pages.js` pour la page Révisions). |
| `assets/revisions.css` | styles `rev-` (repris de `docs/flashcards/maquettes/fc.css`). |
| `revisions.html` (racine) | page Révisions et séances. Écrans par ancre : `#reviser` (toutes applications), `#reviser-<dossier>`, `#libre-<dossier>` (« Tout réviser »), `#libre-<dossier>-<paquet>` (« Les réviser maintenant »). `history.pushState` et `hashchange` comme une application en une seule page (charte §5) : le retour arrière reste correct. |
| `<dossier>/modules/flashcards.html` | page Flashcards de l'application (gabarit commun : la page appelle `SOM.menu('flashcards')` puis `REV.pageApplication(zone)`). |
| `<dossier>/modules/flashcards.js` | les cartes (§6.1). |
| `docs/flashcards/relecture/` | outil de relecture de l'enseignant (§12). |

À modifier : `index.html` (portail), `assets/sommaire.js` (+ `sommaire.css` si besoin), `assets/cours.js` (fin du cours), `assets/progression.js`, `changements-etat/modules/ce.js` (`SOM.init({ …, flashcards: true })`), `docs/charte-applications.md`.

Chargement :
- `SOM.init({ …, flashcards: true })` déclare qu'une application a des cartes. `sommaire.js` ajoute alors l'entrée du sommaire et, sur l'accueil, la ligne, le bloc et les boutons des modules.
- Sur les pages qui en ont besoin (accueil, page Flashcards, cours à la fin), `assets/revisions.js` et `modules/flashcards.js` sont chargés par insertion de balises `<script>` (fonctionne en `file://`), avec le bon chemin relatif (accueil : `../assets/`, `modules/` ; pages de module : `../../assets/`, même dossier). Le rendu des éléments liés aux cartes se fait quand ces scripts sont chargés.
- La page Révisions charge `assets/revisions.js` puis le fichier de cartes de chaque dossier de `REV.APPLIS`.
- Le portail charge `assets/revisions.js` seulement : il compte les cartes dues à partir des clés `<dossier>-flashcards`, sans les cartes.

## 8. Écrans

Reproduis les maquettes. Précisions et états à couvrir :

### 8.1 Portail (`index.html`)

- Pilule **« Révisions »** (`btn-small`) dans `hero-nav`, avant les boutons de progression, avec la pastille du nombre de cartes dues quand il y en a ; lien vers `revisions.html`. Visible sur téléphone.
- **Carte noire** en haut de `.feuille`, au-dessus de la barre de tri, **seulement s'il y a des cartes dues** : « Révisions · N flashcards à réviser aujourd'hui », les chapitres concernés (`court`) et la durée estimée, un lien « Ma boîte » (→ `revisions.html`) et le bouton blanc **« Réviser → »** (→ `revisions.html#reviser`). Sur téléphone, le texte sur toute la largeur, puis les boutons.
- Mise à jour après une reprise de progression (comme l'avancement x/y).

### 8.2 Page Révisions (`revisions.html`)

Bandeau `app-topbar` « ← Toutes les applications » (→ `index.html`) et titre « Révisions ». Puis, dans cet ordre (voir `maquettes/revisions.html`) :

1. Carte d'en-tête : badge « RÉVISIONS », « Mes flashcards », une phrase.
2. **Aujourd'hui** :
   - cartes dues : carte noire « N cartes à réviser », chapitres, durée, bouton « Réviser maintenant → » ;
   - rien à réviser : carte verte « À jour ✓ · Prochaine révision : demain, 5 cartes » ;
   - aucune carte ajoutée : carte papier « Pas encore de flashcards : termine un cours, puis ajoute ses cartes », avec la liste des applications qui ont des cartes.
3. Réglage **« Cartes par séance : 10 · 20 · 30 · Sans limite »** (`aria-pressed`), enregistré dans `revisions-reglages`.
4. **Ma boîte** (toutes applications) et **Les 7 prochains jours**, côte à côte sur ordinateur.
5. **Par application** : une ligne par application qui a des cartes ajoutées (titre, nombre de cartes, de cartes sues, mini-boîte, pastille « Réviser N → » ou « À jour ✓ · demain »). Clic : séance de l'application si des cartes sont dues, sinon sa page Flashcards.
6. **Cartes prêtes à ajouter** : les paquets dont les cours sont faits mais pas encore ajoutés (lien vers la page Flashcards de l'application, à l'ancre du module).
7. **Bien réviser** : feuille blanche, révisions espacées (courbe de l'oubli, SVG), Pomodoro **avec le minuteur** (§8.8). Textes de la maquette.
8. **Fabrique ta boîte en papier** : textes et dessin de la maquette, renvoi vers « Imprimer les cartes ».

### 8.3 Séance (`revisions.html#reviser…`)

Voir `maquettes/seance.html`.

- En-tête : « ✕ Arrêter » (retour à la page d'où l'on vient, sinon `revisions.html`), « Carte n / N », menu **« Au plus 20 cartes »** (pas en révision libre ; un changement s'applique tout de suite), score « ✓ x · ✗ y », barre de progression.
- La carte : en-tête comme une fiche bristol (chapitre court · module, « ⇄ 1/2 » pour une carte à deux faces, type), la question ; au verso, **la question en rappel** puis la réponse ; pied « Case 3 · revue après 4 jours ». La couleur d'accent est celle de la matière de la carte (`document.documentElement.dataset.matiere`).
- Sous la carte : « En retard de 3 j : elle passe en priorité », ou « Ratée tout à l'heure : on la revoit avant la fin de la séance ».
- Bouton **« Voir la réponse »** : la carte se retourne (rotation 3D, coupée par `prefers-reduced-motion`). Puis **« ✗ Je ne savais pas »** et **« ✓ Je savais »** (fonds `--danger-bg` / `--success-bg`, texte et symbole), chacun avec sa conséquence en dessous : « → case 2 · dans 2 j », « → sortie : sue ✓ », « on la revoit encore », « révision libre : ta boîte ne change pas ».
- **Clavier** (ordinateur) : Espace ou Entrée, → et ←, rappelés sous la carte (`@media (hover: hover)`).
- **Doigt** (téléphone, tablette) : toucher la carte la retourne ; une fois retournée, elle **suit le doigt** (translation et légère rotation) avec l'étiquette « JE SAVAIS ✓ » ou « ✗ JE NE SAVAIS PAS » ; relâchée au-delà d'**un tiers de sa largeur**, elle part de côté et la réponse est donnée ; en deçà, elle revient. Événements `pointer` (`pointerType` `touch` ou `pen`), `touch-action: pan-y` sur la carte (le défilement vertical reste possible). Aide affichée sur écran tactile seulement : « Touche la carte pour la retourner », puis « Glisse la carte à droite si tu savais, à gauche sinon ».
- Téléphone : les boutons restent **sous le pouce** (barre fixe en bas, `env(safe-area-inset-bottom)`).
- Protection contre le double appui (~300 ms) ; la carte suivante arrive sans saut de page.
- Fin de séance : nombre de cartes, ✓, ✗ ; « Encore N cartes à réviser aujourd'hui » + « Continuer (k de plus) → » / « Plus tard », ou « Tu as fini pour aujourd'hui ✓ Prochaine séance : demain, 5 cartes » ; boutons « Voir ma boîte → » et retour au chapitre (séance d'une application).

### 8.4 Accueil de l'application (`SOM.accueil` avec `flashcards: true`)

Voir `maquettes/appli.html`.

1. **Bloc « Flashcards du chapitre »** sous « Reprendre » (fond `--cle-bg`) :
   - cartes dues : « N cartes à réviser aujourd'hui », « x cartes dans tes révisions · y à ajouter (module 4) », mini-boîte, « Réviser → » (→ `../revisions.html#reviser-<dossier>`) et « Toutes les cartes » ;
   - à jour : « À jour ✓ · prochaine révision demain (5 cartes) » ;
   - rien d'ajouté mais un paquet prêt : « 7 cartes prêtes à ajouter (module 1) » + « Ajouter » ;
   - rien de disponible : « 28 cartes t'attendent : elles arrivent quand tu finis les cours » + « Voir les cartes ».
2. **Bouton dans chaque module déplié**, après « Fiche » :
   - « Flashcards ✓ » (classe `fait`) quand tous les paquets du module sont ajoutés ;
   - « + Ajouter les N flashcards » (classe `ici`) quand des paquets du module sont prêts : **un clic les ajoute sans changer de page**, puis un message sous le module : « ✓ N cartes ajoutées : première révision demain. Les réviser maintenant → » ;
   - « Flashcards » sinon (→ page Flashcards, ancre du module).
3. **Ligne « Flashcards »** en bas de la liste des modules : pastille ⧉, « Flashcards », « N cartes pour retenir l'essentiel du chapitre », compteur « cartes ajoutées / total », chevron, lien vers `modules/flashcards.html`.

Les compteurs `n/m` des modules et `assets/avancement.js` ne changent pas : les flashcards ne comptent pas dans l'avancement.

### 8.5 Sommaire

Entrée **« ⧉ Flashcards »** en bas de l'arbre, comme un module sans numéro, page encadrée sur `flashcards.html` ; sur téléphone, le bandeau affiche « Flashcards ». La numérotation des modules ne change pas.

### 8.6 Fin du cours (`assets/cours.js`)

Quand la dernière étape (« À retenir ») s'affiche, après `SOM.marquer({ fait: true })`, ajoute dans cette carte, après ses boutons, un bloc `rev-fin` (fond `--cle-bg`) pour chaque paquet dont `apres` contient la page :

- prérequis faits, paquet pas ajouté : « Range les N cartes de ce cours dans ta boîte de révision : première révision demain. » + bouton principal **« Ajouter les N cartes à mes révisions »** ; après le clic : « ✓ N cartes ajoutées » + **« Les réviser maintenant »** (révision libre) ;
- prérequis pas tous faits : « Ces cartes seront disponibles après : Cours … » + lien « Ajouter quand même » ;
- déjà ajouté : « ✓ Ces N cartes sont dans tes révisions · prochaine révision : … » + lien « Voir les cartes ».

Les applications qui gardent leur propre moteur de cours (`cinematique`, `transport-electricite`, `ph`, `puissance-active`) recevront le même appel quand elles auront des cartes (prompt de génération) : expose une fonction `REV.finCours(carte, cle)` réutilisable.

### 8.7 Page Flashcards de l'application (`modules/flashcards.html`)

Voir `maquettes/cartes.html`. Sommaire à gauche (page encadrée), puis :

1. Carte d'en-tête : badge « FLASHCARDS », « Flashcards du chapitre 11 », « 28 cartes pour retenir l'essentiel… ».
2. **Aujourd'hui** (en premier sur téléphone) : « N cartes à réviser · x dans tes révisions », « Réviser les N cartes → », **« Tout réviser (sans changer mon planning) »** (choix des modules, tous cochés, puis révision libre), **« Imprimer les cartes »**.
3. **Ma boîte** du chapitre, avec la colonne « + » des cartes pas encore ajoutées.
4. **Les cartes, cours par cours** : un `<details>` par paquet, avec l'ancre `#m<module>` ; résumé visible replié (« 7 cartes · 3 à réviser aujourd'hui », « prochaine : dans 2 j », « prêt à ajouter ») ; le bloc d'ajout (3 états, comme §8.6, avec « Les réviser maintenant » après l'ajout) ; une ligne par carte : type (⇄ si deux faces), question (sans figure), case, date (« aujourd'hui », « demain · sam. 24/10 », « dans 5 j · mer. 28/10 », « sue ✓ », « — » si pas ajoutée). Un clic sur une ligne déplie l'aperçu : recto et verso côte à côte, dans les deux sens.

### 8.8 Minuteur Pomodoro (page Révisions)

Dans la carte Pomodoro : choix « Travail 25 min » / « Pause 5 min », temps restant en grand (`tabular-nums`), « Démarrer » / « Pause », « ↺ ». À la fin d'une période, passage automatique à l'autre et un son court (Web Audio, seulement après un clic). Pendant le décompte, le titre de l'onglet affiche le temps restant. Rien n'est enregistré.

### 8.9 Impression (« Imprimer les cartes »)

Voir `maquettes/impression.html`.

- Choix des paquets (cases à cocher), puis `window.print()`.
- A4, `@page { margin: 0 }`, **8 cartes par feuille** (2 × 4) de **99 × 70,5 mm**, traits de coupe en pointillés.
- Feuille recto (questions, face 1), puis feuille verso (réponses) **en miroir** (colonnes échangées) pour une impression recto verso sur le **bord long**.
- En-tête de chaque carte : chapitre court · module, type, « ⇄ » pour une carte à deux faces (à réviser dans les deux sens, en papier aussi).
- Figures limitées à 30 mm de haut ; **aucun contenu ne déborde** (réduction de la police si besoin).
- À l'écran, la page d'impression n'affiche que les choix et un aperçu.

## 9. Ergonomie, tactile, accessibilité

- Charte §8 et §9 : cibles larges (boutons de réponse 58 px de haut), police des champs ≥ 16 px, aucun défilement horizontal, focus visible, `aria-pressed`, `aria-expanded`, `role="img"` et `aria-label` sur la boîte et les figures, juste / faux jamais par la couleur seule.
- Toutes les lectures et écritures du stockage dans un `try/catch` : sans stockage, tout s'affiche, l'ajout et la séance marchent pour la visite en cours, et un message discret le signale.
- Textes : tutoiement, courts, nombres selon la charte §7 (« dans 2 j », « 1 sem » seulement dans les onglets de la boîte).

## 10. Charte

Ajoute à `docs/charte-applications.md` une section **« Flashcards »** : principe, règles du planning (§5), fichiers, clés `localStorage`, points d'entrée (portail, accueil, sommaire, fin de cours, page Flashcards), et la règle : **une application avec des cartes déclare `flashcards: true` dans `SOM.init` et son dossier dans `REV.APPLIS`** ; les cartes s'écrivent avec `docs/flashcards/prompt-generation.md`. Mets à jour §5 (fusion de la progression) et §12 (fichiers de référence).

## 11. Première application : `changements-etat`, cartes d'essai

- Écris `changements-etat/modules/flashcards.js` à partir des 28 cartes de `docs/flashcards/maquettes/fc-demo.js` (sans l'état fictif `e`), avec des `id` selon la règle du prompt de génération (`ce-2a-zones`, `ce-2b-pression`…). Paquets : `m1` (`module_1_cours`), `m2a` (`module_2a_cours`), `m2b` (`module_2b_cours`), `m3` (`module_3_cours`), `m4` (`module_4_cours`), `m5` (`module_5a_cours`).
- Les figures y sont dessinées par `CE` : remplace-les par des **SVG autonomes** (exécute les fonctions de dessin dans Chromium et recopie le SVG produit avec ses styles calculés en attributs de présentation).
- En tête du fichier : « Cartes d'essai : à remplacer avec docs/flashcards/prompt-generation.md ».
- `SOM.init({ …, flashcards: true })` dans `ce.js` ; `changements-etat` dans `REV.APPLIS`.

## 12. Outil de relecture pour le prompt de génération

Construis l'outil générique que le prompt de génération remplira pour chaque application, d'après `maquettes/relecture.html` :

- `docs/flashcards/relecture/relecture.js` et `relecture.css` (outil commun), `docs/flashcards/relecture/modele.html` (page à copier dans `docs/flashcards/<dossier>/relecture.html`).
- La page d'une application charge le thème, `assets/revisions.js` et `revisions.css` (les cartes s'affichent **exactement comme pour l'élève**), puis `relecture.js` et le fichier de données `donnees.js` du même dossier :

```js
RELECTURE({
  dossier: 'changements-etat', titre: 'Chapitre 11 : …', tour: 2, etape: 'cartes',   // 'competences' (tour 1) ou 'cartes'
  cours: [{ cle: 'module_1_cours', nom: 'Cours (module 1)' }, …],                    // pages de cours de l'application
  paquets: [{ id: 'm1', module: 1, titre: '…', apres: ['module_1_cours'],
              competences: [{ id: 'c1', texte: 'Nommer les six changements d\'état', types: ['schema'], source: 'fiche_1 · Les six changements d\'état' }],
              cartes: [{ /* carte au format §6.1 */ competence: 'c1', statut: 'nouvelle' }] }],   // statut : nouvelle | modifiee | validee
});
```

- **Onglet 1 « Compétences et paquets »** : pour chaque paquet, « Disponible après » (cases à cocher parmi les pages de cours), les compétences (case « garder », bouton ✎ qui ouvre une remarque), **plusieurs** « + Ajouter une compétence » et **plusieurs** « + Demander une carte » (chaque demande a son champ et son ✕).
- **Onglet 2 « Cartes »** : filtres Toutes / À voir / À modifier / Validées ; pour chaque paquet « ✓ Tout valider » et, pour chaque carte, sa compétence, son `id`, son statut (nouvelle, modifiée), recto et verso **dans les deux sens**, et « ✓ Valider » / « ✎ Modifier » (champ de remarque) / « ✕ Supprimer » ; les cartes validées à un tour précédent sont repliées ; **plusieurs** « + Demander une carte » par paquet.
- Bilan en haut (cartes, validées, à modifier, supprimées, à voir) ; barre du bas collée : résumé et **« Copier mes retours »** (texte Markdown à coller dans la conversation, format au §9 du prompt de génération) ; si la copie est refusée, le texte est sélectionné dans une zone de texte.
- Les choix de l'enseignant sont gardés dans le navigateur (`relecture-<dossier>-<tour>`) pour qu'il puisse s'arrêter et reprendre.
- Fonctionne en `file://`, à 1280 px et 390 px.

## 13. Vérifications avant livraison

Avec Playwright / Chromium (déjà installé, ne pas relancer `playwright install`), en `file://`, à **1280 px** et **390 px** (émulation tactile comprise). Simule les jours avec `page.clock`.

1. **Planning** : ajout le jour J → rien à réviser à J, 1 carte due à J+1 ; « Je savais » → case 2, due à J+3 ; « Je ne savais pas » en case 3 → case 2 ; « Je savais » en case 7 → sue, plus jamais due ; carte revue avec 5 jours de retard → délai compté depuis le jour de la révision ; le sens alterne sur une carte à deux faces.
2. **Séance** : carte ratée revue en fin de séance sans changer son état une seconde fois ; 45 cartes dues avec 20 par séance → 20, puis « Continuer », puis les suivantes ; changement du nombre de cartes pendant la séance ; cartes de plusieurs applications mélangées, jamais deux de la même d'affilée quand c'est possible ; couleur d'accent de la matière de chaque carte.
3. **Révision libre** (« Tout réviser », « Les réviser maintenant ») : l'état enregistré est identique avant et après.
4. **Clavier** (Espace, →, ←) et **doigt** (toucher pour retourner, glisser à droite et à gauche, glisser trop court qui revient, défilement vertical toujours possible).
5. **Ajout** depuis la fin du cours, depuis le module de l'accueil (sans changer de page), depuis la page Flashcards ; « Disponible après » et « Ajouter quand même » ; nouvelle carte dans un paquet déjà ajouté.
6. **Affichages** : portail (pilule, carte noire seulement s'il y a des cartes dues), page Révisions (tous les états du §8.2), accueil (les trois accès et leurs états), sommaire (entrée encadrée), page Flashcards (boîte, liste, dates, aperçu), minuteur (passage 25 → 5 min avec une horloge simulée).
7. **Progression** : enregistrer puis reprendre ; un vieux fichier ne fait reculer aucune carte ; rouvrir le même fichier ne change rien ; données abîmées refusées.
8. **Impression** : PDF de Chromium (`page.pdf`, A4) pour toutes les cartes d'essai : 8 cartes par page, versos en miroir, aucun débordement.
9. Aucune erreur dans la console, aucun défilement horizontal, `prefers-reduced-motion` respecté, stockage indisponible géré.
10. Les applications sans cartes sont inchangées (accueil, sommaire, cours).

Joins les captures des écrans principaux (ordinateur et téléphone). Limite à écrire dans le compte rendu : Safari iOS et les vrais écrans tactiles ne sont pas testables ici ; donne à l'enseignant une liste courte de tests à faire à la main (glisser au doigt sur iPhone et Android, impression recto verso).

## 14. Hors périmètre

- Les cartes définitives des applications (prompt de génération), y compris celles de `changements-etat`.
- Aucun compte, aucun serveur, aucun service extérieur.
- Ne modifie ni le contenu scientifique, ni les séries, ni l'avancement x/y, ni `Elea27/`.
