# Charte des applications : style, présentation, navigation, pédagogie

Référence : l'application **Cinématique** (`cinematique/`). Toute nouvelle application, et toute mise à jour d'une application existante, suit ce document. En cas de doute sur un détail, lis le code de `cinematique/` (c'est la source de vérité) puis suis-le.

À lire en entier avant de créer ou de modifier une application.

Ne change ni le contenu scientifique ni les fonctionnalités propres à une application existante sans demande explicite : la charte règle la présentation, la navigation et la structure pédagogique.

---

## 1. Contraintes techniques

- Fichiers HTML, CSS et JavaScript ouverts **directement dans un navigateur** (`file://`), sans serveur ni outil de build ni dépendance npm.
- Scripts classiques (`<script src="…">`), jamais `type="module"`, jamais `fetch()` d'un fichier local (bloqués en `file://`). Chemins relatifs uniquement.
- Pas de bibliothèque externe. Seule ressource en ligne : la police Google Fonts déjà importée par `assets/theme.css` (repli sur une police sans empattement du système si hors ligne).
- Moteur en JavaScript pur, dans une IIFE `'use strict'`, exposé sur un espace de noms global propre à l'application (`CIN`, `VEC`, `FIG`).
- Tout fonctionne à la souris **et** sur n'importe quel écran tactile (voir §8).
- Police **sans empattement** partout (celle du thème). Jamais de police à empattement.
- Code commenté **en français** : bloc d'en-tête de chaque fichier (rôle, API), un commentaire par fonction ou section non triviale. Noms de variables et de fonctions en français quand le sens l'exige (`valider`, `partie`, `reussi`).
- Les textes s'adressent à l'élève en **tutoiement**, ton direct (« Choisis… », « Compte les carreaux… »).

## 2. Organisation des fichiers

```
<application>/                    dossier au nom court, minuscules, tirets (ex. cinematique, equilibrer-reactions)
  index.html                      accueil de l'application
  modules/
    <pref>.css                    styles propres à l'application (pref = 2 à 3 lettres : cin, ph, er, av, co)
    <pref>.js                     moteur : questions, cours par étapes, navigation, accueil
    module_N_cours.html           cours du module N
    module_N_questions.html       série de questions du module N
    module_Na_cours.html …        module découpé en parties : a, b, c… (ou 2b), un cours + une série de questions par partie
    fiche_N.html                  fiche récapitulative du module N
    module_6.html                 page d'exercices (liste puis un exercice à la fois)
    exercices.js                  données des exercices
    images/                       images (jpg, svg)
```

- Feuilles de style chargées dans cet ordre dans **toutes** les pages : `../../assets/theme.css`, `../../equilibrer-reactions/modules/er.css` (cartes, boutons, écrans de fin communs), `<pref>.css`, puis `../../assets/sommaire.css` (sommaire, accueil, fiches). Pages de cours : `../../assets/cours.css` en dernier.
- Scripts : `../../assets/sommaire.js` (navigation commune, voir §5) **avant** `<pref>.js`, qui déclare le `PLAN` et appelle `SOM.init`. Pages de cours : `../../assets/cours.js` (moteur de cours commun, voir §4) après `<pref>.js`. Sur l'accueil, `../assets/hero.js` puis `../assets/sommaire.js` puis `modules/<pref>.js`.
- Balise `<html lang="fr" data-matiere="…">` : `maths`, `chimie`, `physique` ou `college`. C'est ce qui fixe la couleur d'accent (voir §3).
- `<title>` d'une page de module : `Module 1 : référentiel — Cinématique` ; accueil : le nom de l'application.
- Corps de page : `<div id="app-nav"></div>` puis `<div class="er-page">…</div>`. La navigation s'y construit (voir §5).
- Pour une nouvelle application : partir de `cinematique/modules/cin.js` (moteur de questions) et `cin.css`, renommer l'espace de noms et le préfixe de classes, remplacer les textes ; **la navigation et les cours ne se recopient pas** : déclarer le `PLAN` et utiliser le module commun `assets/sommaire.js` (§5), écrire les cours avec le moteur commun `assets/cours.js` (§4).
- Déclarer l'application dans la liste `APPS` de `index.html` à la racine (portail) : `{ titre, dom, niv, dossier, desc }`, à la suite des applications du même domaine.
  - `dom` : `'physique'`, `'chimie'` ou `'maths'` (outils mathématiques, collège compris) ;
  - `niv` : liste parmi `'col'` (collège), `'2de'`, `'1re'`, `'spe'` (terminale spécialité), `'sti'` (terminale STI2D) ; `LYCEE` pour les quatre niveaux du lycée ;
  - `desc` : une phrase courte (une ligne sur ordinateur, masquée sur téléphone).
- Un nouveau dessin d'en-tête s'ajoute dans `assets/hero.js` (objet `dessins` + liste commentée en tête de fichier).

## 3. Style visuel (design « Chambre à bulles »)

Tout vient de `assets/theme.css`. N'écris **aucune couleur en dur** dans les CSS : utilise les variables. Seules exceptions : les attributs de présentation des SVG (constantes `VEC.C`) et les confettis.

### Couleurs

| Rôle | Variable | Valeur |
|---|---|---|
| Fond de page, blocs de cours | `--paper` | `#f3f1ec` |
| Papier plus foncé (survol) | `--paper-2` | `#ebe8e1` |
| Filets, séparateurs en pointillés | `--paper-3` | `#dfdbd2` |
| Feuille (cartes, fond du corps) | `--sheet` | `#ffffff` |
| Texte, boutons principaux | `--ink` | `#16181d` |
| Texte secondaire | `--ink-2` | `#55585f` |
| Texte discret | `--ink-3` | `#8d8f94` |
| Fine bordure de carte | `--line` | `#ebe8e2` |

**Une seule couleur d'accent par matière**, posée par `data-matiere` : `--accent` (titres de section, sélection), `--accent-ink` (texte accentué foncé), `--cle-bg` (fond des parties importantes), `--cle-line`.

| Matière | `--accent` | `--accent-ink` | `--cle-bg` |
|---|---|---|---|
| maths | `#2952c8` | `#1c3782` | `#e6ecf9` |
| chimie | `#0a7d57` | `#075c40` | `#e2f1ea` |
| physique | `#5a3fc4` | `#3f2a93` | `#ebe7f8` |
| college | `#c2570c` | `#8f3f08` | `#f8e9dc` |

**Vert et rouge sont réservés au juste / faux** : `--success` `#16a34a`, `--success-bg`, `--success-text` ; `--danger` `#dc2626`, `--danger-bg`, `--danger-text`. Ne jamais les utiliser en décoration. Pas d'autre couleur vive (pas de bleu, violet, orange hors accent de la matière).

### Forme et typographie

- Police : `var(--font-sans)` (Hanken Grotesk, poids 400 à 800). Titres : `letter-spacing: -.02em`. Les nombres des tableaux et calculs : `font-variant-numeric: tabular-nums`.
- **Pas d'ombres portées** (sauf fantôme du glisser-déposer) : une bordure fine `1px solid var(--line)` ou un fond papier.
- Arrondis : cartes 22 px (18 px sur téléphone), parties importantes `.cle` 20 px, blocs de cours 16 px, exemples 12 px, boutons et pastilles **en pilule** (`999px`), boutons de choix 16 px, champs de saisie 12 px.
- Boutons (classes de `theme.css`) :
  - `btn-primary` : pilule encre, texte blanc : l'action principale (Valider, Continuer, Question suivante, Commencer) ;
  - `btn-secondary` : pilule blanche cerclée de gris (`inset 1.5px var(--paper-3)`), cercle encre au survol : actions secondaires et boutons de choix ;
  - `btn-small` : même style en plus petit : actions discrètes (Afficher la réponse, Afficher tout le cours).
  - Jamais de bouton coloré. Bouton principal désactivé : opacité .4.
- Encarts : `callout` (papier), `callout-accent` (`--cle-bg`), `callout-success`, `callout-danger`.
- Parties importantes d'un cours : `<div class="cle">` avec un début en `<b class="cle-titre">Définition.</b>`.
- Pastille de numéro / badge : `er-badge` (texte en capitales, `--cle-bg`).
- Quadrillage et courbes des graphiques : classes `ph-*` / `cin-*` du CSS de l'application (grille en pointillés `--paper-3`, axes `--ink`, courbe `--accent`).
- Mouvement : transitions courtes (.15 s). Toute animation en boucle est coupée par `@media (prefers-reduced-motion: reduce)`.

## 4. Anatomie des pages

### Accueil de l'application (`index.html`)

1. Bandeau supérieur fixe avec le lien vers le portail (voir §5).
2. **En-tête illustré** : `<header class="app-hero" data-dessin="…" style="margin-top:-24px">` avec `canvas`, `.app-hero-in` (kicker « Physique · Terminale », `h1`, `app-hero-lead`) et `.app-hero-edge`. Dessin animé par `assets/hero.js` (parallaxe).
3. Liste des modules en **lignes dépliables** (voir §5), carte « Reprendre ».

### Portail (`index.html` à la racine)

1. En-tête illustré « Physique Chimie » (cliché de chambre à bulles en parallaxe), puis une feuille blanche qui le recouvre au défilement.
2. **Barre de tri** collée en haut de l'écran : pastilles **Domaine** (Tous, Physique, Chimie, Outils maths) et **Niveau** (Tous, Collège, 2de, 1re, Tle spé, Tle STI2D), compteur d'applications et « Tout afficher » quand un tri est en cours. Par défaut, « Tous » : tout est affiché. Choisir une pastille ne garde que les applications qui la portent, en choisir d'autres les ajoute ; domaine et niveau se combinent. Le tri n'est pas mémorisé.
3. **Liste compacte** regroupée par domaine (couleur du domaine) : une ligne par application avec titre, étiquettes de niveau (« Lycée » quand les quatre niveaux du lycée sont concernés ; celles du tri en cours sont mises en valeur), description sur une ligne et flèche. Deux colonnes sur ordinateur, une sur téléphone (description masquée sous 640 px, pastilles sur une ligne qui défile de côté).
4. Pas de sommaire sur le portail.

### Page de module (cours, questions, fiche, exercices)

Pas d'en-tête illustré. Première carte :

```html
<div class="er-card">
  <span class="er-badge">MODULE 1 · COURS</span>          (… · QUESTIONS, … · FICHE RÉCAPITULATIVE, … · EXERCICE 3)
  <h2 class="er-titre">Référentiel et trajectoire</h2>
  <p class="er-contexte">Une ou deux phrases : ce qu'on va faire, avec les mots-clés en <b>gras</b>.</p>
</div>
```

Contenu dans `.er-page` (largeur max 60 rem, centré, marges réduites sur téléphone). Une idée = une `.er-card`.

### Cours

Cours **par étapes**, écrit avec le **moteur de cours commun** `assets/cours.js` (objet `COURS`, styles `assets/cours.css`, classes préfixées `crs-`) ; seules `cinematique/` (moteur `CIN`), `transport-electricite/` (`TE`), `ph/` et `puissance-active/` (`PH`) gardent leur propre moteur, de même présentation.

```js
const cours = new COURS.Cours(zone, [etape1, etape2, aRetenir], { cle });   // cle : clé du PLAN (application en une seule page)
function etape1(c) {
  const carte = c.carte('1. Passer de la masse à la quantité de matière');
  c.ajouter(carte, `<div class="cours-bloc">… <div class="cle">n = m / M</div></div>
                    ${COURS.exemple('<p class="crs-calc">n = 64 / 16 = <span class="c">4 mol</span></p>')}`);
  c.aToi(carte, [ { titre, enonce, parties: [p, …] }, … ]);   // « Continuer → » quand c'est réussi
  return carte;
}
```

Chaque étape = une carte `.er-card.er-etape` :

- `h3.cours-titre` numéroté : « 1. Qu'est-ce qu'un référentiel ? » ;
- `.cours-bloc` (fond papier) contenant le texte, puis `.cle` pour la définition / la formule / la règle ;
- `.cours-exemple` (fond blanc) avec `.cours-exemple-t` (« Exemple ») : un exemple traité (`COURS.exemple(html)`) ;
- formules : `.crs-formule` (centrées, grandes) ; calculs : `.crs-calc` (résultat en `.c`) ;
- avertissement : `.crs-attention` ou `callout-danger` avec `cle-titre` ;
- tableaux : `.crs-tab` dans un `.crs-defile` ; figures : SVG ou image de l'application ;
- puis le bloc **« À toi »** (`c.aToi(carte, items)`, voir §6), puis le bouton « Continuer → » (`btn-primary`, aligné à droite) qui n'apparaît qu'une fois le « À toi » réussi. Une étape sans « À toi » appelle `c.continuer(carte)`.

Parties de question du moteur (`p.type`) : `'choix'` (QCM, `indices` par mauvais choix), `'nombre'` (champ ±, `tol` ou `rel`, `diag(v)`), `'champs'` (plusieurs nombres validés ensemble, cases fausses en rouge), `'sci'` (a × 10<sup>n</sup>), `'texte'` (formule, mot), `'perso'` (outil propre à l'application : `monter(zone, api)` appelle `api.reussi()` / `api.erreur(diagnostic)` et renvoie `{ montrer() }`). Toutes ont `q`, `solution`, et `aide: true` quand aucune erreur ne peut être validée (réaction réglée en direct) : « Afficher la réponse » est alors proposé tout de suite. Un outil `perso` doit pouvoir exister en **plusieurs exemplaires** dans la page (pas d'`id` fixe ni d'état global) : avec « Afficher tout le cours », tous les « À toi » sont affichés en même temps.

Le cours est marqué fait (sommaire, accueil) à l'affichage de la dernière étape.

Dernière étape : carte **« À retenir »** (une `.cle` par notion), puis `.er-actions` : bouton principal vers les questions du module, boutons secondaires vers le cours suivant et vers la fiche récapitulative.

Pas de lien « Fiche récapitulative » en haut du cours (la fiche est dans le sommaire).

### Série de questions (`CIN.serie`)

- Carte d'introduction : badge, titre, intro, encadré `.cle` « Barème », bouton « Commencer → ».
- Carte d'en-tête de question : badge, titre, « Question n/10 · Score : x pts », `progress-bar`.
- Carte de la question (`.ph-question`) : thème (`er-q-nom`), consigne (`er-consigne`), énoncé, figure, **parties successives** (a, b, c… chacune n'apparaît qu'après la réussite de la précédente), bilan, bouton « Question suivante → » (désactivé 450 ms pour éviter le double appui) ; dernier : « Voir mon score → ».
- Écran de fin (`er-fin`) : note sur 20 (arrondie au demi-point) en grand, pourcentage, message selon le résultat (100 % / ≥ 70 % / ≥ 50 % / moins), grille récapitulative Q1…Q10 (vert / neutre / rouge), boutons « ↺ Recommencer avec d'autres questions » (secondaire), « Revoir le cours » (secondaire), « suite » (principal), confettis si sans-faute.
- 10 questions tirées au hasard dans des groupes thématiques ; chaque question est une **fabrique** qui renvoie une question différente (nouvelles valeurs, nouveaux distracteurs) à chaque appel.

### Exercices (module de fin)

- Liste groupée par thème (`ph-ex-groupe` + `ph-ex-carte` avec pastille numérotée qui devient ✓ et « Meilleur score : x / y »). **Même numérotation que le support papier du cours.**
- Un exercice : carte d'en-tête (badge « MODULE 6 · EXERCICE k » + « ← Liste des exercices »), carte contexte (`ph-contexte`, fond `--cle-bg`) avec énoncé et figure, carte des questions. **Correction détaillée toujours disponible** (« Voir la correction », 0 point pour la partie). Fin : « Exercice terminé : x / y points », boutons Refaire / Exercice suivant / Liste.
- Le sommaire est présent comme sur les autres pages (page « Exercices 1 à 16 » encadrée).

### Fiche récapitulative (une par module)

- Page `fiche_N.html`, classe `som-fiche` (`cin-fiche` dans Cinématique), badge « MODULE N · FICHE RÉCAPITULATIVE ». Classes communes de `assets/sommaire.css` : `som-formule` (formule centrée), `som-tab` dans `som-defile` (tableau défilant), `som-fiche-figs` (figures), `som-fiche-liens` (liens du bas), `som-fr` (fraction).
- Une carte par notion : `cours-titre`, `.cle` (définitions, formules), figures importantes (`cin-fiche-figs`, 2 ou 3 colonnes, 1 colonne sous 640 px), tableaux. **Que du contenu à retenir : aucune question.**
- Une ancre `id="<slug>"` sur la première section de chaque partie du module, pour que le lien Fiche du sommaire ouvre la fiche à la bonne partie.
- Bas de page : `.er-actions.som-fiche-liens` avec « Revoir le cours » et « Questions sur… ».
- En fin de cours, un lien vers la fiche du module.

## 5. Navigation

Un **sommaire de toute l'application**, comme la table des matières d'un cahier : modules → parties → pages (**Cours**, **Questions**, **Fiche**, icônes `C`, `Q`, `≡`). Jamais de menu burger anonyme.

### Module commun `assets/sommaire.js` (objet `SOM`)

Toutes les applications utilisent ce module (+ `assets/sommaire.css`, classes préfixées `som-`) ; seules `cinematique/` et `transport-electricite/` gardent leur propre copie dans leur moteur (`CIN.menu`, même présentation). L'application déclare seulement son plan :

```js
const PLAN = [
  { n: 1, titre: 'La fonction logarithme décimal', desc: 'Une phrase courte', fiche: 'fiche_1',   // fiche : seulement s'il y a un cours
    parties: [{ nom: 'La fonction log', slug: 'log',                            // slug : ancre de la fiche (module en plusieurs parties)
                cours: 'module_1_cours', questions: 'module_1_questions',
                noms: { questions: 'Vérification' } }] },                      // libellés propres (facultatif)
  { n: 3, titre: 'Exercices d\'entraînement', exercices: 'module_3', exNom: 'Exercices', nbEx: 20 },
];
SOM.init({ nom: 'pH', id: 'ph', cleEx: 'ph-exercices', plan: PLAN });
```

- Types de pages d'une partie, dans cet ordre : `simulation`, `cours`, `exemple`, `questions`, `entrainement` (icônes `▸`, `C`, `Ex`, `Q`, `E`) ; fiche `≡`, exercices `#`. Chaque type vaut la clé de la page (nom du fichier sans `.html`).
- `SOM.menu(cle)` dans chaque page : `'accueil'` → bandeau avec le lien vers le portail ; sinon le sommaire, page `cle` encadrée.
- `SOM.accueil(zone)` sur l'accueil : lignes dépliables, carte « Reprendre ».
- `SOM.marquer({ fait: true })` en fin de cours, `SOM.marquer({ note })` en fin de série (note sur 20, la meilleure est gardée).
- `SOM.init` remet la configuration à zéro : un moteur partagé entre applications (ex. `ph.js` chargé par Puissance active) est donc suivi du moteur de l'application, qui rappelle `SOM.init` avec son propre plan.
- **Application en une seule page** (`spa: true`) : les clés du plan sont des ancres (`#cours-1`, `#fiche-1`…). L'application appelle `SOM.menu(cle)` à chaque changement d'écran, met l'adresse à jour (`history.pushState`) et ouvre l'écran demandé au chargement et sur `hashchange` : le retour arrière du navigateur reste correct. `SOM.marquer(info, cle)` y prend la clé explicitement.
- Application d'un seul écran sans cours (simulation) : `SOM.init({ nom, id, plan: [] }); SOM.menu('accueil');` (bandeau vers le portail seul).

- **On voit toujours où on est**, sans changer de page : le module et la partie de la page en cours sont dépliés et la page en cours est encadrée (`aria-current="page"`).
- **On va dans n'importe quel module sans repasser par l'accueil** : un clic sur un module ou une partie le **déplie sur place** (la page ne change pas) ; un clic sur une page y va. Plusieurs modules peuvent être dépliés en même temps.
- Chaque ligne de module : pastille (numéro, ✓ si tout est fait), titre, compteur `n/m`, chevron. Les pages affichent leur état : Cours ✓, Questions avec la meilleure note `16/20`.
- Module à une seule partie : ses trois pages directement sous le module. Module d'exercices : une page « Exercices 1 à 16 ».
- Les pages sont de simples liens `<a>` (retour arrière du navigateur correct). La Fiche d'une partie ouvre `fiche_N.html#<slug-de-la-partie>` ; sur la fiche, le sommaire suit l'ancre (`hashchange`).
- Tout est accessible à tout moment : aucun verrouillage entre modules ou parties.
- Seuil téléphone / ordinateur : **900 px** de large.

### Ordinateur (≥ 900 px) : le sommaire toujours ouvert à gauche

- Colonne fixe de **264 px**, sur toute la hauteur, fond blanc, bordure fine à droite. **Pas de bandeau en haut** sur les pages de module : toute la navigation est à gauche.
- En tête de colonne : le nom de l'application (lien vers son accueil) et la pilule « ⌂ Accueil » ; puis l'étiquette « Sommaire » et l'arbre.
- Le module en cours a un fond `--cle-bg`, sa pastille est pleine (accent) ; les parties sont reliées par un filet vertical `--cle-line`.
- Le corps de page reçoit `padding-left: 264px`. Si le sommaire dépasse la hauteur de l'écran, il défile seul, la page en cours y est ramenée au centre.

### Téléphone (< 900 px) : un bandeau « où suis-je », le sommaire à la demande

- **Une seule barre fixe en haut, 54 px** : un grand bouton pilule (`--cle-bg`) avec la pastille du module, le titre du module (petit, accent) et la page en gras (« Vitesse · Cours », « Questions », « Fiche récapitulative »), puis un chevron ▾. Pas de pastilles, pas de barre du bas.
- Un appui **déroule le même sommaire** sous le bandeau (feuille blanche aux coins bas arrondis, voile sombre derrière), ouvert à la page en cours. Il se referme par le bandeau, le voile, la touche Échap ou un lien.
- La page réserve la place du bandeau (`scroll-padding-top`) : un défilement vers une ancre ne finit jamais sous le bandeau. Utiliser `scroll-padding`, pas `scroll-margin` (les deux s'additionneraient).

### Accueil de l'application

- Bandeau `app-topbar` avec la pilule « ← Toutes les applications » (« ← Applications » sous 520 px) qui renvoie au **portail** (`../index.html`, racine du dépôt). Pas de sommaire sur l'accueil : la liste des modules en tient lieu.

### Accueil : une ligne dépliable par module

- Carte noire **« Reprendre »** (dernière page ouverte) en tête.
- Une ligne par module : pastille (numéro, ✓ si tout est fait), titre + description (description masquée sous 640 px), compteur `n/m`, chevron. **Un seul module déplié à la fois** ; par défaut celui de la dernière page, sinon le premier non terminé.
- Contenu d'un module déplié : une carte par partie avec les boutons « Cours ✓ » et « Questions 14/20 » (✓ et note quand c'est fait ; la page en cours en accent), puis « Fiche récapitulative ». Module d'exercices : un bouton noir « Exercices 1 à 16 → ».
- Lien vers le portail des applications **toujours présent** sur l'accueil, ordinateur et téléphone.

### Progression (gardée dans le navigateur)

- `localStorage` : `<app>-progression` = `{ derniere, pages: { <page>: { fait, note } } }` et `<app>-exercices` = `{ <id>: { pts, max } }`.
- Cours terminé = dernière étape atteinte (`fait`). Série terminée = note sur 20 ; **on garde la meilleure**.
- Toujours dans un `try/catch` : l'application fonctionne si le stockage est indisponible.
- La progression **informe** (✓, `n/m`, notes) et n'interdit rien.

## 6. Pédagogie

### Déroulé d'un cours

**Notion → exemple → l'élève fait des exemples semblables → notion suivante.**

1. Une notion courte, la règle dans un encadré `.cle`.
2. Un exemple traité (`.cours-exemple`).
3. Un bloc **« À toi »** (`c.aToi` du moteur commun, `CIN.aToi` dans Cinématique) : une suite de petites questions du **même type que l'exemple**, de difficulté progressive, sans points. Il faut les réussir (ou afficher la réponse) pour que « Continuer → » apparaisse.
4. Étape suivante. Le cours se termine par « À retenir ».

Variantes de l'exemple trouvé par l'élève : quand l'exemple est donné sous forme de questions à résoudre, la réponse affichée est suivie de **« ✍ Complète ton cours : … »** (ce qu'il doit recopier dans son cahier).

### Bouton « Afficher tout le cours »

- Dans l'en-tête du **premier « À toi »**, près de la première question de chaque cours.
- Affiche d'un coup toutes les étapes **sans avoir à répondre**. La position dans la page ne bouge pas (le bouton reste à sa place à l'écran).
- Les réponses ne sont pas affichées mais l'élève peut répondre (« Valider ») ou afficher directement la réponse (« Afficher la réponse » est disponible tout de suite).
- Le bouton devient « Tout le cours est affiché » (désactivé). L'état reste vrai : les étapes suivantes s'affichent dépliées. Toute question ou « À toi » d'un cours s'enregistre pour être dépliable.
- Le moteur commun place ce bouton tout seul dans le premier « À toi » du cours.

### Questions et retours à l'élève

- Une question est découpée en **parties successives** ; une partie réussie fait apparaître la suivante.
- **Points** : 2 si tout est juste du premier coup, 1 si juste après au moins une erreur, 0 si la réponse a été affichée. Série : 10 questions, note sur 20.
- **Retour d'erreur** : encadré `callout-danger` « **Ce n'est pas ça.** » suivi d'un **diagnostic ciblé** de l'erreur typique (coordonnées inversées, mauvais signe, constante non dérivée…), jamais un simple « Faux ». Fournir `indice` / `indices[choix]` / `diag(valeur)` pour chaque partie. Après 2 erreurs : « Corrige ta réponse, ou affiche la réponse (0 point pour cette question). »
- **Retour de réussite** : « Juste ! » (premier coup) ou « C'est juste. » (après erreur), encadré `callout-success`, avec la `solution` expliquée. Réponse affichée : encadré `callout` « Réponse » (« Correction » dans les exercices).
- **Sortie toujours possible** : bouton « Afficher la réponse » (`btn-small`) dans les séries ; dans les cours il n'apparaît qu'après une erreur (ou si tout le cours est affiché) ; dans les exercices « Voir la correction » est toujours là.
- Les **mauvais choix** d'un QCM sont des erreurs classiques d'élève, pas des réponses absurdes.
- **Aléatoire** : refaire une série donne d'autres valeurs. Les énoncés sont choisis pour que la réponse se lise ou se calcule proprement.
- Message d'erreur de format (« Écris un nombre (avec une virgule si besoin). ») sans compter d'erreur.
- Écran de fin et bilans d'exercice : encourageants et factuels, jamais culpabilisants.

### Manipulation directe (tracés dans un repère)

- Mode **mixte** : on glisse la pointe du vecteur depuis son point de départ, et des **boutons fléchés** (↑ ← ↓ →) l'ajustent d'un carreau (indispensable au doigt).
- **Pas de loupe** sur tactile.
- La **valeur représentée** par le vecteur en cours de tracé s'affiche en direct (`valeur: { k, unite, dec }`).
- Les vecteurs tracés s'arrêtent sur une **graduation** de la grille, jamais sur un point de la trajectoire ; un vecteur ne relie jamais deux points de la trajectoire.
- Les données sont choisies pour tomber sur des valeurs lisibles sur le quadrillage.

### Fiches et exercices

- Chaque cours a sa **fiche** : définitions, formules, graphiques importants (§4).
- Les exercices reprennent ceux du support papier, **avec la même numérotation**, en les guidant par parties.

## 7. Écriture scientifique et typographie

- Français partout. Nombres avec **virgule décimale**, espace insécable pour les milliers (`CIN.fmt`). Moins typographique `−` (U+2212), pas le tiret `-`. Lecture des saisies : accepter `,` ou `.`, `-` ou `−`, espaces (`CIN.lire`).
- Écriture scientifique : `2,3 × 10<sup>5</sup>` (`CIN.sci`). Unités : `m·s<sup>−1</sup>`, `m·s<sup>−2</sup>`. Indices avec `<sub>`.
- **Vecteurs** : nom surmonté d'une flèche, jamais de gras seul : `VEC.nomHTML('v')` (`.vec-nom`), indice hors de la flèche (`u⃗ₜ`). **Coordonnées en colonne** entre parenthèses : `VEC.colHTML(a, b)` (`.vcol`). Écriture a i⃗ + b j⃗ : `VEC.ijHTML`.
- Fractions `CIN.fr`, dérivées `CIN.dd('v')` (`dv/dt`), racines `.racine`, systèmes avec accolade `CIN.sys(...)`.
- Ne jamais insérer de `${…}` dans du HTML « statique » : seuls les gabarits JavaScript (backticks) les évaluent.
- Saisie d'un nombre : champ `.crs-champ` (moteur commun ; `.ph-champ` dans Cinématique et pH) + bouton **±** (le clavier numérique des téléphones n'a pas toujours de « − »), `inputmode="decimal"`, `autocomplete="off"`, `spellcheck="false"`. Tolérance relative par défaut 0,5 % (ou absolue `tol`). L'unité est dans l'étiquette du champ ; préciser le nombre de chiffres significatifs attendu.

## 8. Tactile, smartphone, souris

- Largeur de référence de test : **390 px** (téléphone) et **1280 px** (ordinateur). Aucun défilement horizontal de la page : formules, tableaux et figures qui dépassent défilent dans leur propre conteneur (`overflow-x: auto`).
- `touch-action: manipulation` et `-webkit-tap-highlight-color: transparent` sur les boutons ; `touch-action: none` seulement sur les poignées à faire glisser ; `touch-action: pan-y` sur les graphiques pour ne pas bloquer le défilement.
- Cibles tactiles larges : boutons de choix 46 px de haut au moins, flèches de tracé 58 × 50 px, bouton ± 38 × 42 px (32 × 38 px dans les champs « petit »).
- Taille de police des champs de saisie **≥ 16 px** (sinon iOS zoome à la mise au point).
- Après un appui sur ±, **ne pas donner le focus au champ sur téléphone** (le clavier masquerait la question) ; sur ordinateur oui (`matchMedia('(hover: hover)')`).
- Quand une saisie est faite avec des boutons à l'écran (écriture `a i⃗ + b j⃗`), pas de champ texte : le clavier du téléphone ne s'ouvre pas.
- Protection contre le **double appui** : après « Continuer » ou « Question suivante », `pointer-events: none` pendant ~350 ms sur la zone.
- Après une réponse, `scrollIntoView({ block: 'nearest', behavior: 'smooth' })` pour amener la partie suivante, sans sauter dans la page.
- SVG des repères et des courbes : `max-width: 100%`, recalcul à la largeur disponible pour garder graduations lisibles ; sur téléphone le repère prend aussi la marge intérieure de la carte.

## 9. Accessibilité

- Liens et boutons réels (`<a>`, `<button type="button">`), `aria-label` sur les boutons-icônes et les champs, `aria-current="page"` sur la page en cours dans le sommaire, `aria-expanded` / `aria-controls` sur les lignes dépliables, `role="img"` + `aria-label` sur les figures SVG.
- Focus visible : `outline: 2px solid var(--accent); outline-offset: 2px` sur tous les éléments de navigation.
- Jamais d'information portée par la seule couleur : juste / faux accompagnés d'un texte (« Juste ! », « Ce n'est pas ça. ») et d'un symbole (✓).
- Contraste : texte inactif en `--ink-2` au minimum sur les fonds colorés (pas `--ink-3`).
- `prefers-reduced-motion` respecté.

## 10. Vérifications avant de livrer

Avec Playwright / Chromium (déjà installé, ne pas relancer `playwright install`), à **1280 px** et **390 px** (émulation tactile comprise) :

1. Parcourir **chaque cours** en répondant juste, puis en faisant des erreurs volontaires (diagnostics affichés, « Afficher la réponse » après erreur).
2. Parcourir **chaque série** (10 questions, note sur 20) et **chaque exercice**.
3. Mode « Afficher tout le cours » : tout se déplie, la position du bouton ne bouge pas, les réponses ne sont pas affichées.
4. Aucune erreur dans la console, aucun défilement horizontal de la page.
5. Navigation : la page en cours est encadrée dans le sommaire, déplier un autre module ne change pas de page, chaque lien du sommaire mène à la bonne page, ancres de fiche, sommaire du téléphone (ouverture, fermeture, voile), bouton Reprendre, ✓ et notes (profil persistant), lien vers le portail.
6. Tous les liens internes pointent vers des pages existantes.
7. Tracés de vecteurs : glisser à la souris, au doigt (CDP), flèches ; valeur affichée en direct.

Limite connue : Safari iOS n'est pas testable dans cet environnement ; le dire explicitement dans le compte rendu.

## 11. Mettre une application existante à la charte

À faire dans cet ordre, application par application, sans toucher au contenu scientifique ni perdre de fonctionnalité :

1. **Navigation** : retirer l'ancien menu burger ; charger `assets/sommaire.css` et `assets/sommaire.js`, déclarer le `PLAN`, appeler `SOM.menu(cle)` dans chaque page et `SOM.accueil(zone)` sur l'accueil (§5).
2. **Accueil** : en-tête illustré `app-hero` conservé, liste des modules en lignes dépliables, « Reprendre », compteurs et notes (§4, §5).
3. **Découpage** : chaque module → une page de cours, une série de questions notée sur 20, une fiche récapitulative ; plusieurs parties si le module est long.
4. **Cours** : réécrire avec le moteur commun `assets/cours.js` en étapes notion → exemple → « À toi », bouton « Afficher tout le cours » (§4, §6). Les outils interactifs existants deviennent l'exemple ou des items `perso` d'« À toi ». Un cours mélangé à une série (cours dans l'intro de la série) passe sur sa propre page `module_N_cours.html`.
5. **Style** : cartes `er-card`, boutons en pilule encre, encarts `.cle` / `callout-*`, badges ; supprimer les couleurs en dur et les classes de couleur Tailwind (le thème les neutralise, mais ne pas en ajouter).
6. **Saisies** : ± pour les nombres, ≥ 16 px, cibles tactiles larges, retours d'erreur diagnostiqués (§6, §7, §8).
7. **Progression** : `localStorage` en `try/catch`, meilleure note conservée.
8. Passer la liste de §10, puis mettre à jour la description et les étiquettes (`dom`, `niv`) de l'application dans `index.html` du portail si elles ont changé.

## 12. Fichiers de référence

| Sujet | Où regarder |
|---|---|
| Variables, boutons, encarts, bandeau, en-tête illustré | `assets/theme.css` |
| Cartes, écrans de fin, confettis | `equilibrer-reactions/modules/er.css` |
| Sommaire, accueil en lignes, progression, fiches (module commun `SOM`) | `assets/sommaire.js`, `assets/sommaire.css` |
| Exemple de `PLAN` (pages séparées / une seule page) | `ph/modules/ph.js` / `puissances-10/index.html` |
| Cours par étapes, « À toi », « Afficher tout le cours » (moteur commun `COURS`) | `assets/cours.js`, `assets/cours.css` |
| Exemple de cours avec le moteur commun (pages séparées / une seule page / outils `perso`) | `combustions/modules/module_3_cours.html` / `puissances-10/index.html` / `equilibrer-reactions/modules/module_1.html` |
| Questions, graphiques, exercices | `cinematique/modules/cin.css` |
| Moteur de questions, séries | `cinematique/modules/cin.js` |
| Repère et tracé de vecteurs, écritures vectorielles | `cinematique/modules/vecteurs.js` |
| Figures SVG | `cinematique/modules/figures.js` |
| Exercices (format des données) | `cinematique/modules/exercices.js`, `module_6.html` |
| Exemple de cours, de série, de fiche | `module_1_cours.html`, `module_1_questions.html`, `fiche_1.html` |
| Accueil de l'application | `cinematique/index.html` |
| Dessins d'en-tête | `assets/hero.js` |
| Portail (liste des applications, tri par domaine et niveau) | `index.html` (racine) : `DOMAINES`, `NIVEAUX`, `APPS` |
