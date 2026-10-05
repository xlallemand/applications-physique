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

- Feuilles de style chargées dans cet ordre dans **toutes** les pages : `../../assets/theme.css`, `../../equilibrer-reactions/modules/er.css` (cartes, boutons, écrans de fin communs), puis `<pref>.css`.
- Balise `<html lang="fr" data-matiere="…">` : `maths`, `chimie`, `physique` ou `college`. C'est ce qui fixe la couleur d'accent (voir §3).
- `<title>` d'une page de module : `Module 1 : référentiel — Cinématique` ; accueil : le nom de l'application.
- Corps de page : `<div id="app-nav"></div>` puis `<div class="er-page">…</div>`. La navigation s'y construit (voir §5).
- Pour une nouvelle application : partir de `cinematique/modules/cin.js` (moteur de questions + navigation) et `cin.css`, renommer l'espace de noms et le préfixe de classes, remplacer `PLAN`, les clés de `localStorage` et les textes.
- Déclarer l'application dans la liste `MATIERES` de `index.html` à la racine (portail) : `{ titre, desc, dossier, niveau }`, dans la bonne matière.
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

1. Bandeau supérieur fixe (voir §5) avec le lien vers le portail.
2. **En-tête illustré** : `<header class="app-hero" data-dessin="…" style="margin-top:-24px">` avec `canvas`, `.app-hero-in` (kicker « Physique · Terminale », `h1`, `app-hero-lead`) et `.app-hero-edge`. Dessin animé par `assets/hero.js` (parallaxe).
3. Liste des modules en **lignes dépliables** (voir §5), carte « Reprendre ».

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

Cours **par étapes** (`new CIN.Cours(zone, [étape, étape…])`). Chaque étape = une carte `.er-card.er-etape` :

- `h3.cours-titre` numéroté : « 1. Qu'est-ce qu'un référentiel ? » ;
- `.cours-bloc` (fond papier) contenant le texte, puis `.cle` pour la définition / la formule / la règle ;
- `.cours-exemple` (fond blanc) avec `.cours-exemple-t` (« Exemple ») : un exemple traité ;
- formules : `.ph-formule` (centrées, grandes) ; calculs : `.ph-calc` (résultat en `.c`) ;
- avertissement : `.cin-attention` ou `callout-danger` avec `cle-titre` ;
- tableaux : `.cin-tab` dans un `.cin-defile` ; figures : SVG `.cin-fig` / `.cin-graphe`, image `.cin-image img` ;
- puis le bloc **« À toi »** (voir §6), puis le bouton « Continuer → » (`btn-primary`, aligné à droite) qui n'apparaît qu'une fois le « À toi » réussi.

Dernière étape : carte **« À retenir »** (une `.cle` par notion), puis `.er-actions` : bouton principal vers les questions du module, boutons secondaires vers le cours suivant et vers la fiche récapitulative.

Pas de lien « Fiche récapitulative » en haut du cours (la fiche est dans les onglets).

### Série de questions (`CIN.serie`)

- Carte d'introduction : badge, titre, intro, encadré `.cle` « Barème », bouton « Commencer → ».
- Carte d'en-tête de question : badge, titre, « Question n/10 · Score : x pts », `progress-bar`.
- Carte de la question (`.ph-question`) : thème (`er-q-nom`), consigne (`er-consigne`), énoncé, figure, **parties successives** (a, b, c… chacune n'apparaît qu'après la réussite de la précédente), bilan, bouton « Question suivante → » (désactivé 450 ms pour éviter le double appui) ; dernier : « Voir mon score → ».
- Écran de fin (`er-fin`) : note sur 20 (arrondie au demi-point) en grand, pourcentage, message selon le résultat (100 % / ≥ 70 % / ≥ 50 % / moins), grille récapitulative Q1…Q10 (vert / neutre / rouge), boutons « ↺ Recommencer avec d'autres questions » (secondaire), « Revoir le cours » (secondaire), « suite » (principal), confettis si sans-faute.
- 10 questions tirées au hasard dans des groupes thématiques ; chaque question est une **fabrique** qui renvoie une question différente (nouvelles valeurs, nouveaux distracteurs) à chaque appel.

### Exercices (module de fin)

- Liste groupée par thème (`ph-ex-groupe` + `ph-ex-carte` avec pastille numérotée qui devient ✓ et « Meilleur score : x / y »). **Même numérotation que le support papier du cours.**
- Un exercice : carte d'en-tête (badge « MODULE 6 · EXERCICE k » + « ← Liste des exercices »), carte contexte (`ph-contexte`, fond `--cle-bg`) avec énoncé et figure, carte des questions. **Correction détaillée toujours disponible** (« Voir la correction », 0 point pour la partie). Fin : « Exercice terminé : x / y points », boutons Refaire / Exercice suivant / Liste.
- Pas de navigation latérale sur cette page (bandeau seul avec « ⌂ Accueil »).

### Fiche récapitulative (une par module)

- Page `fiche_N.html`, classe `cin-fiche`, badge « MODULE N · FICHE RÉCAPITULATIVE ».
- Une carte par notion : `cours-titre`, `.cle` (définitions, formules), figures importantes (`cin-fiche-figs`, 2 ou 3 colonnes, 1 colonne sous 640 px), tableaux. **Que du contenu à retenir : aucune question.**
- Une ancre `id="<slug>"` sur la première section de chaque partie du module, pour que l'onglet Fiche ouvre la fiche à la bonne partie.
- Bas de page : `.er-actions.cin-fiche-liens` avec « Revoir le cours » et « Questions sur… ».

## 5. Navigation

Deux niveaux, jamais de menu burger. Le plan est déclaré une fois dans `PLAN` (`cin.js`) : modules → parties → pages (cours, questions), plus la fiche du module et éventuellement une page d'exercices.

- **Niveau 1 : les parties** du module (pastilles). Un module à une seule partie n'a pas ce niveau.
- **Niveau 2 : les onglets** de la partie : **Cours**, **Questions**, **Fiche** (icônes `C`, `Q`, `≡`).
- **Changer de partie garde l'onglet ; changer d'onglet garde la partie.** Ce sont de simples liens `<a>` (retour arrière du navigateur correct). L'onglet Fiche ouvre `fiche_N.html#<slug-de-la-partie>`.
- Tout est accessible à tout moment : aucun verrouillage entre modules ou parties.
- Seuil téléphone / ordinateur : **900 px** de large.

### Bandeau supérieur (`.app-topbar`, fixe, 60 px)

- À gauche : pilule `.cin-pilule` — sur l'accueil « ← Toutes les applications » (« ← Applications » sous 520 px) qui renvoie au **portail** (`../index.html`, racine du dépôt) ; sur une page de module « ⌂ Accueil » (accueil de l'application).
- Titre : « **Nom de l'application** · Module n · Titre du module » (le module en gris, tronqué avec …).
- Sur téléphone, la pilule « ⌂ Accueil » est masquée sur les pages à barre du bas (l'accueil est alors dans cette barre).

### Ordinateur (≥ 900 px) : barre latérale fixe, la plus étroite possible

- Colonne 1, **120 px** : les parties (pastilles à bords arrondis 14 px, nom sur deux lignes si besoin), avec le titre « MODULE n » en petites capitales couleur d'accent.
- Colonne 2, **72 px** (« rail »), fond `--cle-bg` : les trois onglets Cours / Questions / Fiche (icône + libellé), tous visibles, **pas de bouton « Suite »**.
- La partie sélectionnée **se prolonge dans le rail** (même couleur, coin droit carré) : on voit que les onglets appartiennent à cette partie.
- Module à une seule partie : seulement le rail (72 px), avec le titre « MODULE n ».
- Le corps de page reçoit `padding-left` égal à la largeur de la barre.

### Téléphone (< 900 px)

- Sous le bandeau : barre de **pastilles des parties** (48 px, défilement horizontal, la partie en cours est centrée) — seulement pour les modules à plusieurs parties.
- **Barre du bas** à 4 entrées : Accueil, Cours, Questions, Fiche. Elle se **masque quand un champ de saisie a le focus** (clavier ouvert), via une classe sur `<html>`.
- La page réserve la place des barres (`padding-bottom`, `scroll-padding-top` / `scroll-padding-bottom`) : un défilement vers une ancre ne finit jamais sous une barre. Utiliser `scroll-padding`, pas `scroll-margin` (les deux s'additionneraient).

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
3. Un bloc **« À toi »** (`CIN.aToi`) : une suite de petites questions du **même type que l'exemple**, de difficulté progressive, sans points. Il faut les réussir (ou afficher la réponse) pour que « Continuer → » apparaisse.
4. Étape suivante. Le cours se termine par « À retenir ».

Variantes de l'exemple trouvé par l'élève : quand l'exemple est donné sous forme de questions à résoudre, la réponse affichée est suivie de **« ✍ Complète ton cours : … »** (ce qu'il doit recopier dans son cahier).

### Bouton « Afficher tout le cours »

- Dans l'en-tête du **premier « À toi »**, près de la première question de chaque cours.
- Affiche d'un coup toutes les étapes **sans avoir à répondre**. La position dans la page ne bouge pas (le bouton reste à sa place à l'écran).
- Les réponses ne sont pas affichées mais l'élève peut répondre (« Valider ») ou afficher directement la réponse (« Afficher la réponse » est disponible tout de suite).
- Le bouton devient « Tout le cours est affiché » (désactivé). L'état reste vrai : les étapes suivantes s'affichent dépliées. Toute question ou « À toi » d'un cours s'enregistre pour être dépliable.

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
- Saisie d'un nombre : champ `.ph-champ` + bouton **±** (le clavier numérique des téléphones n'a pas toujours de « − »), `inputmode="decimal"`, `autocomplete="off"`, `spellcheck="false"`. Tolérance relative par défaut 0,5 % (ou absolue `tol`). L'unité est dans l'étiquette du champ ; préciser le nombre de chiffres significatifs attendu.

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

- Liens et boutons réels (`<a>`, `<button type="button">`), `aria-label` sur les boutons-icônes et les champs, `aria-current="page"` sur la partie et l'onglet actifs, `aria-expanded` / `aria-controls` sur les lignes dépliables, `role="img"` + `aria-label` sur les figures SVG.
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
5. Navigation : partie ↔ onglet (chacun garde l'autre), ancres de fiche, bouton Reprendre, ✓ et notes sur l'accueil (profil persistant), lien vers le portail, barre du bas masquée pendant la saisie.
6. Tous les liens internes pointent vers des pages existantes.
7. Tracés de vecteurs : glisser à la souris, au doigt (CDP), flèches ; valeur affichée en direct.

Limite connue : Safari iOS n'est pas testable dans cet environnement ; le dire explicitement dans le compte rendu.

## 11. Mettre une application existante à la charte

À faire dans cet ordre, application par application, sans toucher au contenu scientifique ni perdre de fonctionnalité :

1. **Navigation** : retirer `assets/nav.js` (menu burger `AppNav`) et `<div id="app-nav">` qui l'utilisait ; ajouter `PLAN`, `menu()` et `accueil()` selon §5 ; bandeau avec lien vers le portail.
2. **Accueil** : en-tête illustré `app-hero` conservé, liste des modules en lignes dépliables, « Reprendre », compteurs et notes (§4, §5).
3. **Découpage** : chaque module → une page de cours, une série de questions notée sur 20, une fiche récapitulative ; plusieurs parties si le module est long.
4. **Cours** : passer en cours par étapes avec notion → exemple → « À toi » et bouton « Afficher tout le cours » (§6).
5. **Style** : cartes `er-card`, boutons en pilule encre, encarts `.cle` / `callout-*`, badges ; supprimer les couleurs en dur et les classes de couleur Tailwind (le thème les neutralise, mais ne pas en ajouter).
6. **Saisies** : ± pour les nombres, ≥ 16 px, cibles tactiles larges, retours d'erreur diagnostiqués (§6, §7, §8).
7. **Progression** : `localStorage` en `try/catch`, meilleure note conservée.
8. Passer la liste de §10, puis mettre à jour la description de l'application dans `index.html` du portail si elle a changé.

## 12. Fichiers de référence

| Sujet | Où regarder |
|---|---|
| Variables, boutons, encarts, bandeau, en-tête illustré | `assets/theme.css` |
| Cartes, écrans de fin, confettis | `equilibrer-reactions/modules/er.css` |
| Cours, « À toi », questions, graphiques, exercices, fiches, navigation, accueil | `cinematique/modules/cin.css` |
| Moteur de questions, séries, cours par étapes, `PLAN`, `menu`, `accueil`, progression | `cinematique/modules/cin.js` |
| Repère et tracé de vecteurs, écritures vectorielles | `cinematique/modules/vecteurs.js` |
| Figures SVG | `cinematique/modules/figures.js` |
| Exercices (format des données) | `cinematique/modules/exercices.js`, `module_6.html` |
| Exemple de cours, de série, de fiche | `module_1_cours.html`, `module_1_questions.html`, `fiche_1.html` |
| Accueil de l'application | `cinematique/index.html` |
| Dessins d'en-tête | `assets/hero.js` |
| Portail (liste des applications) | `index.html` (racine) |
