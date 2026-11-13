# Prompt : application d'entraînement à l'orthographe (3e, dictée du brevet)

À donner tel quel à une session, sur le dépôt `xlallemand/applications-physique`, branche `orthographe`.

**État au 12/11/2026 : étapes 1 à 5 terminées, application `orthographe/` développée (section 7). Astuces GN2 et SV4 reformulées (validé le 12/11/2026).** Message de lancement qui a servi au développement :

> Sur la branche `orthographe`, lis `docs/prompt-orthographe.md` en entier, puis développe l'application `orthographe/` selon la section 7 (spécification retenue) et la maquette de référence `docs/maquettes/orthographe-v3.html`, en respectant la charte.

---

## 1. Objectif

Créer l'application **Orthographe** pour des élèves de 3e qui préparent la dictée du brevet. But : que le nombre de fautes sur une dictée normale de brevet soit minimal.

Elle fait travailler :

- les **règles d'orthographe** du français ;
- la **méthode de relecture** pour corriger ses propres fautes.

## 2. Choix déjà validés par l'enseignant

| Sujet | Décision |
|---|---|
| Emplacement | Dossier `orthographe/` du portail `applications-physique`, charte respectée. |
| Portail | Nouveau domaine **« Français »** dans `APPS` (sa couleur d'accent, niveau `col`), **sans pastille de filtre** « Français ». |
| Audio | Synthèse vocale du navigateur (Web Speech API, voix française du système). Aucun fichier audio. |
| Textes | **Mixte** : extraits courts de dictées officielles du brevet (source citée) + textes rédigés dans le même style **et** textes courts générés (banque annotée + gabarits). |
| Génération des dictées | **Banque de phrases annotées + tirage** : chaque mot piège est annoté (règle, formes fautives plausibles) ; le moteur tire les phrases et injecte les fautes selon les notions cochées. En plus, **gabarits combinatoires** (sujet + verbe + complément…) pour multiplier les variantes : il faut un très grand nombre de phrases. |
| Note | Deux affichages à chaque dictée : **note sur 20 de type brevet** (barème par type de faute, rapporté à la longueur) **et taux de réussite par type d'erreur**. |
| Suivi | Dans le navigateur (`localStorage`, clés `orthographe-…`), intégré à « Enregistrer / Reprendre ma progression » du portail (fusion dans `assets/progression.js`), avec **bilan imprimable**. |
| Cours | Pas de cours par étapes : **fiches de règles** consultables + **rappel de la règle** accessible sur chaque faute. L'essentiel reste les dictées. |
| Validation des règles | **Page HTML interactive** dans le dépôt. |

## 3. Fonctionnalités

### Dictées à corriger (texte écrit)

- Dictées **très courtes**, contenant des fautes à repérer et/ou corriger.
- Pour chaque faute : bouton **« Règle »** qui ouvre le rappel de la règle (lien vers la fiche).
- **Niveaux de difficulté** (options combinables) :
  1. fautes **déjà repérées**, il faut les corriger ;
  2. fautes **à repérer** puis corriger (sans repérage, on peut toucher un mot correct : c'est compté) ;
  3. correction **avec ou sans choix multiples** ;
  4. **fin de mot à écrire** (le début est donné, la terminaison non).
- **Menu de choix** des notions travaillées : cases à cocher, regroupées par famille de règles.

### Dictées audio

- Vraie dictée très courte lue par la synthèse vocale : lecture d'ensemble, puis groupes de mots **répétés plusieurs fois**, débit réglable, **pause**, **relire** (le groupe, la phrase, tout le texte), relecture finale.
- L'élève tape le texte ; comparaison mot à mot, chaque écart classé par type d'erreur, note.

### Dictée brevet complète

- Mode supplémentaire : une dictée de **la vraie longueur du brevet** (environ 600 signes, 20 minutes, déroulé officiel : lecture préalable, dictée avec ponctuation et liaisons, relecture sans ponctuation, mots au tableau).
- Texte tiré d'une dictée déjà tombée **ou** généré dans le même style.

### Méthode de relecture (guidée)

Quatre passages successifs, chacun avec sa consigne. Tout se fait **de tête** : on ne demande jamais de souligner, d'entourer ni de tracer des flèches (seule exception : marquer d'un point dans la marge un mot douteux pendant la dictée). Aide à la demande : repérer le verbe puis son sujet (clic sur le verbe, puis clic sur le sujet) :

1. **Accords en genre et en nombre** (déterminant → nom → adjectif) ;
2. **Conjugaison** (trouver le verbe, son sujet, son temps) ;
3. **Mots particuliers** (homophones : a/à, ses/ces, et/est, on/ont, son/sont…) ;
4. **Passage à l'envers**, mot par mot, de la fin au début, pour l'orthographe de chaque mot.

### Suivi et diagnostic

- Chaque erreur est enregistrée avec son **type** (règle) ; historique des notes.
- Tableau de bord : notions maîtrisées / fragiles / à travailler, évolution, **priorités proposées**.

### Mode automatique

- Choisit seul les notions à travailler selon les erreurs passées et la progression.
- **Priorité aux compétences de base** (prérequis) avant les plus complexes : on ne pousse pas l'accord du participe passé avec avoir tant que l'accord sujet-verbe et la distinction é/er ne sont pas solides.
- Ordre des prérequis issu du classement validé (étape 4), sous forme de graphe de dépendances.

## 4. Plan de travail

### Étape 1 — Ce prompt et les questions (fait)

### Étape 2 — Recherche d'informations

- Liste des règles importantes, **classées** (fréquence au brevet × nombre de points perdus × prérequis).
- Le maximum de **dictées de brevet**, sources officielles en priorité (Eduscol, Bulletin officiel, sujets nationaux, sites académiques), puis sites qui reprennent les sujets (avec date et auteur de l'extrait).
- Barème officiel de la dictée (points par type de faute) et programme de cycle 4 (étude de la langue).
- Analyse des dictées : pour chaque mot difficile, la règle en jeu → statistique des règles les plus rentables.
- **Si l'accès à internet manque ou les sources sont insuffisantes : s'arrêter et dire comment régler le problème.**

### Étape 3 — Classement et stockage

Dans `docs/orthographe/` (sources de travail) puis dans les données de l'application :

- `regles` : identifiant, famille, niveau de priorité, prérequis, énoncé court, explication, astuce (ex. remplacer par « vendre » pour é/er), exemples, contre-exemples, pièges, formes fautives typiques ;
- `methodes` : relecture en 4 passages, astuces de vérification ;
- `dictees` : textes officiels (source, année) et textes rédigés, mots pièges annotés ;
- `phrases` et `gabarits` : banque annotée pour la génération ;
- `mots` : mots invariables et mots d'usage fréquents au brevet.

### Étape 4 — Validation par l'enseignant

Page `docs/orthographe/validation.html` (ouverte sans serveur) :

- règles présentées par **niveaux** (familles → groupes → règles), classement visible et modifiable ;
- validation **par groupe** ou **règle par règle** : « Validé / À revoir / Retirer », champ de commentaire ;
- règles essentielles signalées (validation obligatoire) ;
- avancement de la validation, état gardé dans le navigateur ;
- **export** du résultat (fichier ou texte à copier) à renvoyer à Claude.

Même chose ensuite, plus brièvement, pour les méthodes et un échantillon de dictées.

Résultat (11/11/2026) : les 64 règles, les 4 méthodes et les 3 points à trancher sont **validés**, aucune dictée retirée. Décisions retenues :

- **Barème** : faute grammaticale −1 point sur 10, faute d'usage, d'accent, de majuscule ou de ponctuation −0,5 ; même faute sur le même mot comptée une fois ; plancher 0. **Dictée brevet** : ce barème, puis sur 20. **Dictées courtes** (décision du 12/11/2026) : note sur le nombre de fautes à trouver, ramenée sur 20 (juste du premier coup 1 point, au 2e essai 0,5, mot juste signalé −0,5 ; dictée audio : mots pièges réussis, autre erreur −0,5).
- **Mode automatique** : une règle n'est proposée que si ses prérequis sont maîtrisés (80 % de réussite sur les 20 dernières occasions), en commençant par le niveau 1 ; révision espacée des règles maîtrisées.
- **Rectifications de 1990** : les deux orthographes acceptées, l'orthographe traditionnelle affichée.
- Majuscules (LX13) : règle essentielle.

### Étape 5 — Maquettes puis développement

- Maquettes `docs/maquettes/orthographe.html` (v1), `docs/maquettes/orthographe-v2.html` (v2) et `docs/maquettes/orthographe-v3.html` (v3) : **plusieurs options** d'interface (dictée à corriger, dictée audio, relecture guidée, menu des notions, tableau de suivi, résultat noté), au design de la charte.
- Retenu après la v1 (12/11/2026) : couleur **prune** pour le domaine Français, notions choisies **par famille**, dictée à corriger en **texte + liste des fautes**.
- Simplifications demandées pour la v2 : **un seul menu « Réglages »** pour toutes les options ; **suivi regroupé** (une ligne par groupe, dépliable) ; **un seul module « Dictée courte »** qui enchaîne dictée, relecture en 4 passages et résultat. Plan proposé : Dictée courte, Dictée brevet, Mon suivi, Fiches de règles, plus Réglages.
- Retenu après la v2 (12/11/2026) : dictée courte avec **vérification immédiate**, suivi **groupé par famille**, réglages en **panneau**, accueil simplifié, dictée brevet au même déroulé. Fiches : une par famille, regroupées, règle dépliée au clic, présentation peu chargée : en v3, pastilles des familles en haut et règles en lignes dépliables (mélange des deux options). Nouvelle maquette demandée avant le développement.
- **Retenu après la v3 (12/11/2026) — maquette validée** : accueil simplifié, dictée courte avec vérification immédiate, dictée brevet au même déroulé, suivi groupé par famille, fiches en pastilles + lignes, réglages en panneau. Seule remarque : en « J'écris la fin du mot », un **petit haut-parleur** à côté de chaque mot à compléter fait entendre le mot (ajouté dans la v3).
- Développement : fait (12/11/2026), voir la section 7. Les règles validées sont recopiées dans `orthographe/modules/regles.js` (à garder identique à `docs/orthographe/donnees/regles.js`) ; banque de phrases et gabarits : `orthographe/modules/banque.js` ; dictées officielles annotées : `orthographe/modules/textes-brevet.js` ; mots : `orthographe/modules/mots.js`.

## 5. À lire avant de commencer

1. `CLAUDE.md`, puis **en entier** `docs/charte-applications.md`.
2. `cinematique/` (application de référence), `assets/sommaire.js`, `assets/theme.css`, `assets/progression.js`, `index.html` (portail).

## 6. Contraintes

- Fichiers HTML/CSS/JS ouverts en `file://` : pas de serveur, pas de `fetch`, pas de module, pas de bibliothèque externe.
- Police sans empattement, couleurs du thème uniquement, souris et tactile, tutoiement, code commenté en français.
- Espaces insécables (`docs/outils/typo.py`, `docs/outils/verif-typo.js`).
- Défilement automatique après chaque validation.
- Ne modifier que ce qui est demandé.

## 7. Spécification retenue pour le développement

Référence visuelle et fonctionnelle : **`docs/maquettes/orthographe-v3.html`** (ouvrir en `file://`). La barre noire en haut de la maquette (choix d'écran, d'option, d'appareil, commentaires) sert seulement à la maquette : elle ne passe pas dans l'application. Les données affichées dans la maquette (suivi, notes) sont fictives.

### Données déjà prêtes

- `docs/orthographe/donnees/regles.js` : 64 règles validées, 7 familles (`desc`, `passage` de relecture), 4 niveaux, prérequis, champs `essentielle`, `astuce`, `exemples`, contre-exemples, pièges, formes fautives.
- `docs/orthographe/donnees/dictees-brevet.js` : dictées officielles du brevet (source, année), mots pièges annotés.
- `docs/orthographe/validation.html` : page de validation (référence, ne pas la livrer dans l'application).
- À créer : banque de **phrases annotées** et **gabarits combinatoires** (très grand nombre de phrases), mots invariables et mots d'usage.

### Structure

- Sommaire de la charte (à gauche sur ordinateur, bandeau « où suis-je » sur téléphone) : **1. Dictée courte**, **2. Dictée brevet**, **3. Mon suivi**, **4. Fiches de règles**, plus un bouton **⚙ Réglages** (dans le sommaire sur ordinateur, à droite du bandeau sur téléphone).
- Couleur du domaine Français : prune, à ajouter dans `assets/theme.css` :
  `html:root[data-matiere="francais"] { --accent: #9d2f72; --accent-ink: #6e1f50; --cle-bg: #f6e6ef; --cle-line: #e7c3d7; }` (vérifier aussi le thème sombre si la charte en prévoit un).

### Accueil (simplifié)

En-tête « Aa · Français · 3e · Orthographe », carte « Reprendre » (dernier module ouvert), ligne « Tes réglages » (résumé en étiquettes + bouton Réglages), puis les 4 modules en lignes dépliables avec la dernière note et « Commencer → » / « Ouvrir → ». Lien vers le portail toujours présent.

### Réglages (panneau)

Panneau latéral qui s'ouvre par-dessus la page (fermeture par « Fermer ✕ », clic sur le voile ou Échap). Un changement de réglage démarre une nouvelle dictée.

- **Ce que tu travailles** : « Automatique (conseillé) » / « Je choisis ». En « Je choisis » : familles dépliables, case par famille (état intermédiaire) et case par règle avec son niveau, compteur de notions cochées.
- **Dictée courte** : Type (Texte à corriger / Dictée audio) ; Les fautes (Déjà repérées / À repérer) ; Pour corriger (Choix multiples / J'écris le mot / J'écris la fin du mot) ; Longueur (Très courte / Courte). Avec « J'écris la fin du mot », les mots à compléter sont déjà repérés ; « Les fautes » et « Pour corriger » ne concernent que le texte à corriger.
- **Lecture à voix haute** (dictée audio et dictée brevet) : vitesse (lente 0,7 / normale 0,85 / rapide 1) ; lectures par groupe (1, 2 ou 3).

### Dictée courte (un seul module)

En-tête avec le résumé des réglages en étiquettes, puis une barre d'étapes :

| Réglage | Étapes |
|---|---|
| Texte, fautes à repérer | Relecture 1 · 2 · 3 · 4 → Résultat |
| Texte, fautes déjà repérées | Corrige les fautes → Résultat |
| Texte, fin du mot | Complète les mots → Relecture 1 · 2 · 3 · 4 → Résultat |
| Dictée audio | Écoute et écris → Relecture 1 · 2 · 3 · 4 → Résultat |

- **Mise en page** : texte à gauche, liste des fautes à droite (une colonne sur téléphone, défilement automatique vers l'élément utile après chaque action).
- **Relecture en 4 passages** : une consigne par passage (Accords ; Conjugaison ; Mots particuliers ; À l'envers), tout de tête. Aide « verbe → sujet » à la demande (clic sur le verbe puis sur son sujet). Passage 4 : les mots affichés du dernier au premier, touchables.
- **Vérification immédiate** : toucher un mot faux l'ajoute à la liste ; toucher un mot juste affiche « … est juste : ce n'est pas une faute (−0,5 point) ». Chaque faute se corrige tout de suite (choix multiples ou saisie) : 2 essais, diagnostic après une erreur, puis bouton pour afficher la réponse. Bouton **📖 Règle** sur chaque faute (rappel de la règle, lien vers la fiche).
- **J'écris la fin du mot** : le début du mot est donné, une case pour la fin, et un **petit haut-parleur 🔊** juste après la case qui fait entendre le mot à écrire (synthèse vocale, vitesse des réglages). Compteur de mots complétés ; les fins restent modifiables pendant la relecture ; au passage 4, toucher un mot place le curseur dans sa case.
- **Dictée audio** : lecture d'ensemble, puis groupes de mots (▶ / ⏸, groupe précédent / suivant, relire le groupe, la phrase, tout le texte), nombre de lectures par groupe et vitesse des réglages, ponctuation dite (« virgule », « point »). L'élève tape sa copie (correcteur et majuscule automatique désactivés). Comparaison mot à mot à la fin.
- **Note (sur le nombre de fautes à trouver, ramenée sur 20, arrondie au demi-point)** : texte à corriger : juste du premier coup 1 point, au 2e essai 0,5, sinon 0 ; mot juste signalé −0,5. Fin de mot : 1 point par mot juste. Dictée audio : 1 point par mot piège juste, −0,5 par autre erreur. Note = 20 × max(0, points) / nombre de fautes. Affichage « X points sur N fautes à trouver », barème rappelé.
- **Résultat** : note, taux de réussite par type d'erreur, liste des erreurs (écrit → attendu, règle, mention « non repérée », « réponse affichée »…), boutons « Nouvelle dictée » et vers le suivi.

### Dictée brevet (même déroulé)

Environ 600 signes, 20 minutes. Choix du texte : dictée déjà tombée ou texte généré. Étapes : Lecture d'ensemble → Dictée → Relecture du texte → Ta relecture 1 · 2 · 3 · 4 → Résultat. Mots au tableau (et source de l'extrait), chronomètre, boutons Pause, Relire la phrase, « • Mot douteux » (seule marque autorisée). Comme au brevet : pas de question après la relecture du texte. Note avec le **barème du brevet** (grammaire −1, usage −0,5 sur 10, puis sur 20), rappelé à l'écran.

### Mon suivi (groupé par famille)

- Carte « À travailler en priorité » : 3 règles (statut à travailler ou fragile, prérequis maîtrisés ; tri par niveau, puis à travailler avant fragile, puis fréquence au brevet), bouton « Dictée courte sur ces règles → », dernières notes et petite courbe.
- Carte « Mes compétences » : une ligne par famille, dépliable, avec une barre empilée (Maîtrisée / Fragile / À travailler / Pas encore vue / Prérequis à acquérir) et l'alerte du nombre de règles à travailler ; dépliée : les règles avec statut et pourcentage. Légende des statuts.
- Statuts : maîtrisée = 80 % de réussite sur les 20 dernières occasions ; une règle n'est proposée que si ses prérequis sont maîtrisés.
- Bilan imprimable ; données dans « Enregistrer / Reprendre ma progression » (`assets/progression.js`).

### Fiches de règles (pastilles + lignes)

Pastilles des 7 familles en haut (une famille affichée à la fois), puis une carte : nom de la famille, phrase d'introduction avec son passage de relecture, règles **essentielles** d'abord en lignes dépliables (au toucher : la règle, son **Test** dans un encadré, deux exemples), puis bouton « Pour aller plus loin (n) » qui déplie les autres règles. Présentation peu chargée.

### Points à soumettre à l'enseignant pendant le développement

- Fait (12/11/2026) : les astuces de **GN2** et **SV4** sont reformulées pour la relecture de tête (« remonte de tête vers chaque mot qui s’accorde », « Relis la phrase de tête sans le pronom »), dans `docs/orthographe/donnees/regles.js` et `orthographe/modules/regles.js`.

### Livraison

Déclaration dans `APPS` du portail (domaine Français, sans pastille de filtre, avec `mots`) et dans `AVANCEMENT` ; `python3 docs/outils/index-recherche.py` ; fusion dans `assets/progression.js` ; `python3 docs/outils/typo.py --corriger orthographe` puis `docs/outils/verif-typo.js` ; toutes les vérifications du §10 de la charte (ordinateur et téléphone, souris et tactile, aucun débordement, aucune erreur dans la console).
