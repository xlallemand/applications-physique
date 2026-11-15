# Applications mobiles : comment les coder

Tout ce qu'il faut pour créer une application « mobile » du portail, sur le modèle des trois qui existent :

| Application | Dossier | Objet JS | Saisie de l'élève |
|---|---|---|---|
| Fractions (collège) | `fractions-college/` | `FRA` | feuille ligne par ligne, pavé ou clavier |
| Équations du 1er degré (collège) | `equations-college/` | `EQ` | feuille ligne par ligne, pavé ou clavier |
| Équations en physique (smartphone) | `equations-physique-mobile/` | `EPM` | éditeur à tuiles (glisser-déposer) |

Avant de commencer : `CLAUDE.md`, puis **en entier** `docs/charte-applications.md`. Ce document ne remplace pas la charte : il décrit ce qui est propre aux applications mobiles. L'application de référence est `equations-college/` (la plus simple) ; `equations-physique-mobile/` montre un module de plus (Découverte) et un réglage de classe.

---

## 1. Ce qui distingue une application mobile

- **Conçue pour le téléphone d'abord** (390 px de large), et utilisable à l'ordinateur et à la souris.
- **Installable sur l'écran d'accueil et utilisable hors ligne** (PWA : manifeste, service worker, icônes).
- **Pas de cours linéaire** : l'élève fait des **séances de 5 questions**. L'application **choisit les compétences** à travailler d'après son **suivi**, ou l'élève les choisit dans les réglages.
- **Pas de lien vers le portail** : le bouton « Accueil » du sommaire mène à l'accueil de l'application, et l'accueil n'a pas de lien « Toutes les applications » (option `mobile: true` de `SOM.init`, §4).
- **Sauvegarde dans l'application** : la progression est gardée à chaque question, avec une copie de secours dans un fichier (§9).
- Comme toutes les applications du dépôt : HTML, CSS et JavaScript purs, ouverts aussi depuis l'ordinateur (`file://`). Donc **ni modules ES, ni `fetch`, ni serveur**. Les scripts sont des IIFE qui remplissent un objet global (`window.EQ`, `window.FRA`, `window.EPM`).

## 2. Les fichiers

```
mon-app/
  index.html                 accueil (bandeau, en-tête illustré, une ligne par module, Sauvegarde, Réglages)
  manifest.webmanifest       manifeste PWA
  sw.js                      service worker (cache d'abord)
  icones/                    apple-touch-icon.png (180), favicon-32.png (32), icone-192.png,
                             icone-512.png, icone-maskable-512.png (512, motif dans la zone sûre : 80 % central)
  modules/
    xx.js                    moteur commun (objet XX) : PLAN, navigation, réglages, suivi, accueil, Mon suivi, Fiches
    xx.css                   styles propres (préfixe xx-), couleurs par variables du thème
    competences.js           les compétences (XX.C) : fiches et fabriques de questions (ou banque)
    expr.js                  écriture compacte des expressions, analyse et calcul (si saisie au clavier)
    sauvegarde.js            PWA (manifeste, inscription du service worker, installation) et copies de secours
    seance.js                la séance de 5 questions
    seance.html, suivi.html, fiches.html   une page par module (pages courtes : en-tête + <main id="zone">)
```

Une page par module, chacune dans un fichier : `modules/seance.html` contient seulement l'en-tête de la page, puis `<main id="zone"></main>`, et finit par `XX.menu('seance'); XX.seance(document.getElementById('zone'));`.

## 3. L'en-tête de chaque page

```html
<html lang="fr" data-matiere="college">              <!-- couleur du thème (assets/theme.css) -->
<meta name="theme-color" content="#c2570c">          <!-- même couleur que theme_color du manifeste -->
<!-- application sur l'écran d'accueil (manifeste ajouté par modules/sauvegarde.js sur le site) -->
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="Équations">      <!-- nom court sous l'icône -->
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<link rel="apple-touch-icon" href="icones/apple-touch-icon.png">  <!-- ../icones/ depuis modules/ -->
<link rel="icon" type="image/png" href="icones/favicon-32.png">
```

- Le **manifeste n'est pas dans le HTML** : `sauvegarde.js` l'ajoute seulement quand la page est servie par un site (http ou https). Une page ouverte depuis l'ordinateur ne peut pas le charger.
- Styles, dans cet ordre : `assets/theme.css`, `equilibrer-reactions/modules/er.css` (cartes `er-card`, badges, boutons), les CSS propres, puis `assets/sommaire.css` en dernier.
- Scripts : `assets/hero.js` (accueil seulement), `assets/sommaire.js`, **`sauvegarde.js` avant le moteur** (une reprise `#reprise=` est écrite avant la lecture du stockage), puis `expr.js`, `competences.js`, `xx.js`, et le script de la page (`seance.js`).
- Corps : `<div id="app-nav"></div>`, puis `<div class="er-page">` avec une carte d'en-tête (`er-card`, badge `MODULE 1 · SÉANCE`, titre, une phrase de consigne) et la zone.

## 4. Navigation (`assets/sommaire.js`)

```js
SOM.init({ nom: 'Équations du 1er degré', id: 'equations-college',
           coches: false, liensDirects: true, mobile: true, plan: PLAN });
```

- `coches: false` : le sommaire n'affiche ni coches ni notes (le suivi des compétences suffit).
- `liensDirects: true` : chaque module d'une seule page est un lien direct dans le sommaire, sans sous-menu.
- `mobile: true` : le bouton « Accueil » du sommaire mène à l'accueil **de l'application** ; le bandeau de l'accueil n'a **pas** de lien vers le portail.
- `PLAN` : une partie par module, une seule page par partie, par exemple `{ n: 1, titre: 'Séance de résolution', desc: '…', parties: [{ nom: 'Séance de résolution', questions: 'seance', noms: { questions: 'Séance de 5 questions' } }] }`. Le type de page (`cours`, `questions`, `entrainement`) sert seulement au libellé et à l'index de recherche.
- `XX.menu(cle)` appelle `SOM.menu(cle)`, puis ajoute :
  - les pastilles « ⚙ Réglages » et « ⤓ Sauvegarde » sous le nom de l'application, dans le sommaire de l'ordinateur ;
  - un bouton rond ⚙ à droite du bandeau « où suis-je » du téléphone.
- Accueil (`XX.accueil(zone)`) : une ligne par module, qui ouvre directement sa page. Ensuite, séparées des modules, les zones dépliables « Sauvegarde » et « Réglages ».

## 5. Les compétences (`competences.js`, objet `XX.C`)

Chaque compétence :

```js
{ id: 'MU2',                 // 2 lettres (famille) + numéro
  famille: 'MU', niveau: 2,  // niveau : ordre de progression (1, 2, 3…)
  prerequis: ['MU1'],        // à maîtriser avant qu'elle soit proposée en mode automatique
  titre, regle, methode, exemple, piege,      // textes de la fiche (HTML, espaces insécables)
  gen(niv) }                 // fabrique : une question différente à chaque appel, niv = difficulté 1 à 3
```

- Question produite : `{ comp, niv, consigne, depart, valeur, solution: [lignes], indices: [html], diag(v) }`.
- Variante avec une **banque** de questions (Équations en physique) : `XX.C.cibles(id)` donne les questions de la compétence, chacune avec sa difficulté (`diff`), ses étapes et ses indices.
- Une compétence peut dépendre d'un réglage. Par exemple, `classe: '2de' | '1re' | 'tle'` avec `XX.C.permise(id, classe)` retire des compétences selon la classe choisie.
- API : `XX.C.familles`, `XX.C.liste`, `XX.C.R` (par identifiant), `XX.C.question(id, niv)`.

## 6. Le moteur (`xx.js`, objet `XX`)

### Stockage (localStorage, toujours dans un `try/catch`)

| Clé | Contenu |
|---|---|
| `<id>-progression` | (SOM) `{ derniere, pages: { <page>: { fait, note } } }` |
| `<id>-reglages` | `{ auto, comps: { <id>: true }, … }` : mode automatique ou compétences choisies, puis réglages propres (nombres, pavé, classe…) |
| `<id>-suivi` | `{ v: 1, r: { <comp>: [[t, ok], …] }, notes: [[t, 's', note], …] }` ; `t` date en ms, unique et croissante ; `ok` : 1 juste du premier coup, 0,5 juste après une erreur, 0 solution affichée ; les 30 dernières questions par compétence, les 100 dernières notes |
| `<id>-sauvegarde` | `{ n, seuil, derniere }` : séances depuis la dernière copie ; propre à l'appareil, **jamais copié** |

### Suivi et choix des compétences

- `XX.enregistrer(occasions, note)` est appelé **à chaque question** avec `[{ r: comp, ok: pts / 2 }]` et `null`, puis à la fin de la séance avec `[]` et la note sur 20.
- `XX.statut(id)` est calculé sur les 10 dernières questions de la compétence :

  | Statut | Condition |
  |---|---|
  | `m` maîtrisée | au moins 80 % de réussite et au moins 4 questions |
  | `e` en bonne voie | au moins 80 % de réussite, mais moins de 4 questions |
  | `f` fragile | de 50 % à 80 % |
  | `t` à travailler | moins de 50 % |
  | `n` pas encore vue | aucune question, prérequis maîtrisés |
  | `v` prérequis à acquérir | aucune question, prérequis pas encore maîtrisés |

- `XX.priorites()` : les 3 compétences à retravailler en premier.
- `XX.niveauDe(id)` donne la difficulté de départ de la compétence :
  - 1 si moins de 2 questions ou moins de 60 % de réussite ;
  - 2 si moins de 80 % ou moins de 4 questions ;
  - 3 sinon.
- `XX.planSeance(ids)` donne la liste des 5 questions de la séance, sous la forme `[{ comp, raison }]` :
  - **compétences imposées** (adresse `seance.html#comp=MU1,AD2` ou réglage « Je choisis ») : ces compétences à tour de rôle ;
  - **mode automatique** :
    - une ou deux compétences à travailler, fragiles ou en cours, sinon nouvelles, prises de niveau en niveau ;
    - 3 ou 4 questions sur la première ;
    - une compétence maîtrisée à réviser.
- Pendant la séance, la difficulté s'ajuste à chaque question de la même compétence : +1 après 2 points, −1 après 0 point.

### Réglages

Ils s'ouvrent dans un panneau latéral (`XX.ouvrirReglages()`) :
- groupes de boutons à choix unique (`aria-pressed`) ;
- mode automatique, ou choix des compétences à cocher ;
- réglages propres à l'application.

Ils s'appliquent à la séance suivante. `XX.resumeReglages()` donne les étiquettes affichées sur l'accueil.

### Pages Mon suivi et Fiches

- **Mon suivi** :
  - les notes des dernières séances, avec une petite courbe ;
  - les priorités, avec un lien vers une séance sur ces compétences (`seance.html#comp=ID1,ID2`) ;
  - toutes les compétences, groupées par famille, avec leur pastille de statut et leur taux de réussite.
- **Fiches** :
  - une fiche par compétence (règle, méthode, exemple, piège) ;
  - adresse `fiches.html#ID` pour une compétence, ou `fiches.html#FA` pour une famille ;
  - lien « M'entraîner sur cette compétence → » (`seance.html#comp=ID`).

## 7. La séance (`seance.js`)

1. **Intro** :
   - les compétences de la séance, avec leur raison (à travailler, nouvelle, révision…) ;
   - le barème ;
   - la façon de répondre ;
   - les boutons « Commencer → » et « ⚙ Changer les compétences ».
2. **Question** :
   - en-tête « Question k/5 · Score » et barre de progression ;
   - nom de la compétence ;
   - consigne ;
   - zone de réponse ;
   - aides toujours disponibles : 📖 Rappel (fiche de la compétence), 💡 Indice (successifs), ✎ Exemple (autres nombres, ou autre question de la même compétence), Afficher la solution.
3. **Points** :
   - 2 si c'est juste sans erreur ;
   - 1 si c'est juste après une erreur (ligne fausse, ou déplacement refusé) ;
   - 0 si la solution est affichée.

   Le rappel, les indices et l'exemple sont gratuits.
4. **Fin** :
   - note sur 20 au demi-point, `SOM.marquer({ note })` ;
   - points de chaque question ;
   - bilan par compétence avec son statut à jour ;
   - boutons « Nouvelle séance », « Mon suivi », « Fiches » ;
   - confettis si tout est juste.

Règles d'ergonomie (charte §8) :
- après une validation, le message et la suite sont amenés à l'écran avec `XX.versVue(el)` (`scrollIntoView` doux, sous le bandeau grâce à `scroll-padding-top` de `sommaire.css`) : **jamais besoin de remonter** ;
- le bouton « Question suivante → » est désactivé 450 ms, et la zone ignore les appuis pendant 350 ms (`pointerEvents`), pour qu'un double appui ne saute pas une question ;
- chaque ligne fausse reçoit un **diagnostic ciblé** (terme passé sans changer de signe, division oubliée d'un côté…), pas seulement « faux ».

### Saisie

- **Feuille ligne par ligne** (Fractions, Équations du 1er degré) : l'élève écrit chaque ligne avec un **pavé** à l'écran (fractions, signes, effacer, valider) ou avec le clavier. Le pavé peut être masqué sur ordinateur (réglage). Chaque ligne est vérifiée : est-elle équivalente à celle de départ ? La question est finie quand la dernière ligne a la forme attendue (`x = nombre`, fraction irréductible…).
- **Éditeur à tuiles** (Équations en physique) : glisser-déposer à la souris et au doigt (`assets/dragdrop.js`), outils dans une réserve, « Vérifier l'étape ». Chaque étape est vérifiée numériquement, sur des valeurs tirées au hasard.

## 8. Installation et hors ligne (PWA)

### `manifest.webmanifest`

```json
{ "name": "Équations du 1er degré", "short_name": "Équations", "description": "…", "lang": "fr",
  "id": "./", "start_url": "./index.html", "scope": "./", "display": "standalone", "orientation": "any",
  "background_color": "#f3f1ec", "theme_color": "#c2570c",
  "icons": [ { "src": "icones/icone-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any" },
             { "src": "icones/icone-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any" },
             { "src": "icones/icone-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" } ] }
```

La portée (`scope`) est le dossier de l'application seulement.

Icônes : un dessin simple, lisible en petit (exemple : « t = d/v » en blanc sur la couleur du thème), fabriqué avec Python et PIL. Pour l'icône maskable, le motif doit tenir dans le cercle central (80 %).

### `sw.js` : le cache d'abord

- À l'installation, toute la liste `FICHIERS` est mise en cache :
  - les pages et scripts de l'application ;
  - **les fichiers communs** : `../assets/theme.css`, `sommaire.css`, `sommaire.js`, `hero.js`, `dragdrop.js`… et `../equilibrer-reactions/modules/er.css`.
- À l'activation, les caches des versions précédentes sont supprimés, **seulement ceux qui ont le préfixe de cette application**.
- Réponse : le cache d'abord, puis la mise à jour en arrière-plan. La nouvelle version s'affiche au lancement suivant.
- La clé de cache est `origin + pathname`, sans l'ancre : `seance.html#comp=…` est la même page.
- Hors ligne, une page jamais vue renvoie l'accueil.
- Les polices Google Fonts sont gardées en cache. La progression (localStorage) n'est jamais touchée.
- **À chaque modification d'un fichier de l'application ou d'un fichier commun qu'elle met en cache, change `VERSION`** (`equations-v1` → `equations-v2`). Sinon les téléphones gardent l'ancienne version.
- **Un préfixe de cache unique par application.** Le service worker d'Équations du 1er degré efface tous les caches qui commencent par `equations-`. C'est pourquoi Équations en physique utilise `eqphys-`. Vérifie les préfixes déjà pris : `grep -n "startsWith" */sw.js`.

### Inscription (`sauvegarde.js`)

Seulement sur le site (`/^https?:$/.test(location.protocol)`) :
- lien `rel="manifest"` ajouté ;
- `navigator.serviceWorker.register('…/sw.js')` au chargement ;
- `beforeinstallprompt` gardé pour le bouton « Installer l'application » ;
- `navigator.storage.persist()` demandé pour que le navigateur n'efface pas la progression.

## 9. Sauvegarde (`sauvegarde.js`)

Copier `equations-college/modules/sauvegarde.js` et l'adapter : objet, clés, nom de l'application, couleurs, chemins.

- La progression est gardée automatiquement à chaque question.
- **« Enregistrer une copie »** fabrique un fichier `.html` autonome :
  - données dans `<script type="application/json" id="progression">` ;
  - un lien « Reprendre ma progression » vers `index.html#reprise=<données>` (JSON → UTF-8 → base64url) ;
  - paquet `{ v: 1, app: '<id>', date, donnees: { <clé>: <valeur> } }`.

  Sur iPhone, le fichier passe par la feuille de partage (« Enregistrer dans Fichiers ») ; ailleurs, il va dans Téléchargements.
- **« Restaurer une copie »** : choix du fichier. Ouvrir une vieille copie n'efface jamais une progression plus récente : on fusionne, comme sur le portail (`assets/progression.js`).
- Un rappel apparaît toutes les 5 séances terminées depuis la dernière copie.
- Une copie faite dans l'application s'ouvre aussi depuis le portail, et inversement.

## 10. Intégration au portail

1. `index.html` (racine), tableau `APPS` : `{ titre, dom, niv, dossier, mobile: true, desc, mots: [...] }`. Avec `mobile: true`, l'application apparaît sous le type « Application mobile ».
2. `assets/avancement.js` : `'mon-app': { pages: ['seance', 'suivi', 'fiches'] }`.
3. `assets/progression.js` :
   - la clé `<id>-suivi` prend le type `suivi-competences` (fusion fine) ;
   - la clé `<id>-sauvegarde` renvoie `null` (jamais copiée) ;
   - mettre à jour le commentaire d'en-tête.
4. `docs/charte-applications.md` :
   - ligne des clés `…-suivi`, tableau de la sauvegarde (§ progression) ;
   - ligne des applications installables (tableau des fichiers de référence).
5. `python3 docs/outils/index-recherche.py`, pour régénérer `assets/recherche-index.js` (jamais à la main).

## 11. Vérifications avant livraison

- `python3 docs/outils/typo.py --corriger mon-app`, puis `docs/outils/verif-typo.js` sur les pages rendues (espaces insécables, y compris dans les textes produits par JavaScript).
- Playwright (Chromium déjà installé) :
  - à **390 px et 1280 px**, chaque page : pas de défilement horizontal, pas d'erreur dans la console ;
  - une **séance complète** jusqu'à la note ;
  - le suivi mis à jour ;
  - les réglages appliqués à la séance suivante ;
  - un **glisser-déposer au doigt** (événements tactiles CDP), s'il y en a ;
  - après chaque validation, le message et le bouton suivant sont visibles à l'écran.
- PWA : servir le dépôt (`python3 -m http.server`), ouvrir l'application, puis vérifier :
  - service worker actif ;
  - nombre de fichiers en cache égal à `FICHIERS.length` (aucun fichier manquant : un seul 404 fait échouer `addAll`) ;
  - manifeste présent.
- Portail : la recherche trouve l'application, et le type « Application mobile » la montre.
- Navigation : aucun lien vers le portail (`../index.html` depuis l'accueil, `../../index.html` depuis une page), et le bouton « Accueil » mène à l'accueil de l'application.
- Safari sur iPhone ne se teste pas ici : le signaler.
