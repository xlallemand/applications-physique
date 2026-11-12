# Prompt : application d'entraînement à l'orthographe (3e, dictée du brevet)

À donner tel quel à une session, sur le dépôt `xlallemand/applications-physique`, branche `orthographe`.

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
- Retenu après la v2 (12/11/2026) : dictée courte avec **vérification immédiate**, suivi **groupé par famille**, réglages en **panneau**, accueil simplifié, dictée brevet au même déroulé. Fiches : une par famille, regroupées, règle dépliée au clic, présentation peu chargée (deux options en v3). Nouvelle maquette demandée avant le développement.
- Après validation : développement de `orthographe/`, déclaration dans `APPS`, `AVANCEMENT`, index de recherche, `progression.js` ; vérifications de la charte §10.

## 5. À lire avant de commencer

1. `CLAUDE.md`, puis **en entier** `docs/charte-applications.md`.
2. `cinematique/` (application de référence), `assets/sommaire.js`, `assets/theme.css`, `assets/progression.js`, `index.html` (portail).

## 6. Contraintes

- Fichiers HTML/CSS/JS ouverts en `file://` : pas de serveur, pas de `fetch`, pas de module, pas de bibliothèque externe.
- Police sans empattement, couleurs du thème uniquement, souris et tactile, tutoiement, code commenté en français.
- Espaces insécables (`docs/outils/typo.py`, `docs/outils/verif-typo.js`).
- Défilement automatique après chaque validation.
- Ne modifier que ce qui est demandé.
