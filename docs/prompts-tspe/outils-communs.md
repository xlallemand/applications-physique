# Outils communs de Terminale spécialité (prompt de génération)

Lis d'abord `docs/prompts-tspe/00-commun.md` (branche, charte, livraison). Cette session ne crée pas d'application : elle prépare deux outils dont les chapitres ont besoin, et elle migre les applications existantes qui utilisent l'ancien éditeur d'équations.

## 1. Éditeur d'équations partagé `EQ`

### Pourquoi

Consigne du professeur : pour manipuler les équations (pH, Ka, pKa, log, ln, exponentielle, L = 10 log(I/I₀), N = N₀e<sup>−λt</sup>, u = E(1 − e<sup>−t/τ</sup>), PV = nRT…), les applications de Terminale utilisent **le même outil que l'application `equations-physique-mobile/`** (l'éditeur à tuiles `EPM.ED`, le plus récent et le plus complet : fonctions réciproques sqrt, pow, sin/asin, log/pow10, ln/exp, 1/x, parenthèses, sommes signées, aides). L'ancien éditeur `ph/modules/eq.js` (`PH.Editeur`, `PH.demo`) ne doit plus servir.

### À faire

- Crée **`assets/equations.js`** et **`assets/equations.css`** (objet `EQ`) à partir de `equations-physique-mobile/modules/editeur.js`, `aide-rules.js`, `tuiles.js`, `ecriture.js` et de leurs CSS (`editeur.css`, `tuiles.css`) : lis leurs blocs d'en-tête, puis ce qu'il faut.
  - Même comportement, mêmes gestes, mêmes aides que dans `equations-physique-mobile` (c'est ce que les élèves connaissent).
  - **Plusieurs éditeurs dans une page** : `EPM.ED` n'en gère qu'un à la fois ; `EQ` doit pouvoir être monté en plusieurs exemplaires (« Afficher tout le cours » déplie tous les « À toi » d'un cours) : état par instance, pas d'`id` fixe. Si une contrainte forte l'empêche (glisser-déposer global), un seul éditeur **actif** à la fois est acceptable à condition que les autres restent affichés et se réactivent au toucher.
  - API proposée (à adapter à ce que tu trouves) :
    - `EQ.monter(zone, exercice, rappels)` → `{ montrer(), detruire() }` ; `exercice` comme dans `EPM.ED` (`tiles`, `initialLeft()`, `initialRight()`, `targetId`, `sample()`, `funcTools`, `needsParenTool`) ;
    - `EQ.partie(exercice, opts)` → partie `'perso'` du moteur de cours `COURS` et des séries (`monter(zone, api)` qui appelle `api.reussi()` / `api.erreur(diag)`) ;
    - `EQ.demo(zone, { etapes: [{ gauche, droite, texte }] })` : démonstration étape par étape (remplace `PH.demo`), boutons « Étape suivante » / « Tout afficher » ;
    - `EQ.statique(noeud)`, `EQ.ligne(gauche, droite)` : écriture figée (cours, fiches, corrections).
  - Textes des aides et diagnostics passés en options quand ils sont propres à un chapitre (« applique ln, la réciproque de e<sup>x</sup>, aux deux membres ») ; ceux de `aide-rules.js` restent par défaut.
- **`equations-physique-mobile/` charge ensuite l'outil commun** (supprime ses copies devenues inutiles) si cela se fait sans risque ; sinon laisse-la telle quelle et dis pourquoi. Elle doit fonctionner exactement comme avant (séances, succès, fiches, hors ligne : mets à jour la liste des fichiers en cache de `sw.js` si elle charge `assets/equations.*`).
- **Migre les applications qui utilisent `ph/modules/eq.js`** :
  - `acides-bases/modules/module_3b_cours.html` (STI2D, calcul du pH) ;
  - `radioactivite/modules/module_5b_cours.html` (STI2D, calcul de t avec ln).

  Même déroulé pédagogique (démonstration puis « À toi »), avec `EQ.demo` et `EQ.partie`. Leurs liens vers `ph/modules/module_2_cours.html` restent pour l'instant (le chapitre 4 les fera pointer vers « Transformations acide-base »).
- `puissance-active/` ne charge pas `eq.js` : elle charge le moteur de cours et de questions `ph/modules/ph.js` et `ph.css`. **N'y touche pas** (`ph/` reste dans le dépôt ; seule son entrée du portail sera retirée par le chapitre 4). Dis-le dans le compte rendu.
- `ph/modules/eq.js` reste en place (l'application `ph/` s'en sert encore) ; plus aucune autre page ne le charge (`grep -rl "ph/modules/eq.js" --include=*.html .` ne renvoie que `ph/`).

## 2. Pages externes ↗ dans le `PLAN` (`00-commun.md` §6)

Un module « à faire » qui se trouve dans une autre application apparaît dans le parcours du chapitre.

- **`assets/sommaire.js` (`SOM`)** : nouveau type de page `externe` dans une partie du `PLAN` :
  ```js
  { nom: 'Double périodicité', externe: { app: 'double-periodicite', page: 'index', nom: 'Simulateur : double périodicité' } }
  ```
  - Sommaire, accueil (lignes dépliables) : la page s'affiche avec une icône ↗ (et un texte pour les lecteurs d'écran : « ouvre l'application … dans une nouvelle fenêtre »), son nom (`externe.nom`) et l'application d'origine en petit ; le lien est `../../<app>/modules/<page>.html` (ou `../../<app>/index.html` pour `'index'`), `target="_blank" rel="noopener"`.
  - **État** : lu dans `localStorage['<app>-progression']` (`pages[<page>]` : ✓ si `fait`, note si `note`) ; pour `page: 'index'` (application sans plan) : faite dès que `<app>-progression` existe ou que l'application a été ouverte (ajoute, si besoin, l'enregistrement d'une ouverture dans les applications sans plan concernées : `double-periodicite/`, `decroissance-radioactive/`…). L'état se relit quand la fenêtre redevient visible (`visibilitychange`, `focus`) pour que le ✓ apparaisse au retour.
  - **Compteurs** : la page compte dans `n/m` du module et dans le ✓ du module. Elle n'entre pas dans « Reprendre » (`derniere`).
- **`assets/avancement.js`** : une page externe se déclare `'↗<app>/<page>'` dans la liste `pages` de l'application (ou la forme que tu juges plus claire, documentée en tête du fichier) et se compte avec l'état de l'autre application.
- **`docs/outils/index-recherche.py`** : la page externe n'est pas indexée comme une page de l'application qui la cite (elle l'est déjà dans la sienne) ; règle commentée en tête du script.
- **`assets/progression.js`** : rien à changer (chaque application garde sa clé) ; vérifie-le.
- Documente le type `externe` dans la charte (`docs/charte-applications.md` §5, liste des types de pages, et §2 pour `AVANCEMENT`).
- **Test** : une application de test temporaire dans le scratchpad n'est pas possible (chemins relatifs) : ajoute provisoirement une page externe au `PLAN` d'une application existante sur une branche locale, vérifie sommaire, accueil, compteurs, portail, recherche, puis retire-la (ou laisse le premier chapitre l'utiliser). Toutes les applications qui chargent `sommaire.js` continuent de fonctionner (parcours rapide de chaque accueil, console sans erreur).

## 3. Livraison

- Vérifications du §12 de `00-commun.md` ; retest Playwright de `equations-physique-mobile/` (une séance de chaque compétence qui utilise log, ln, exp, sqrt), `acides-bases/` et `radioactivite/` (les pages migrées), et d'un accueil par niveau sur le portail.
- Mets à jour `00-commun.md` §9 (outils `EQ` et pages externes : « existe ») et §10 (ligne `outils-communs.md`).
