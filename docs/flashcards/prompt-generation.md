# Prompt : écrire les flashcards d'une application

À donner à une nouvelle session, sur le dépôt `xlallemand/applications-physique`, en remplaçant **`<dossier>`** par le dossier de l'application (sa valeur `dossier` dans `APPS` du portail, par exemple `changements-etat`).

Prérequis : le système de révision existe (prompt [`prompt-mise-en-oeuvre.md`](prompt-mise-en-oeuvre.md) : `assets/revisions.js`, page `revisions.html`, outil `docs/flashcards/relecture/`).

---

## 1. Objectif

Écrire les flashcards de l'application `<dossier>` : des cartes qui couvrent **toutes les capacités** de l'application, que l'enseignant valide en deux temps, puis les mettre en place pour les élèves.

Le travail se fait en **cinq étapes, dont deux validations par l'enseignant**. À chaque validation, **arrête-toi et attends sa réponse** : ne passe jamais à l'étape suivante sans elle.

1. Repérer les compétences et proposer les paquets → **validation 1**.
2. Intégrer les retours.
3. Écrire toutes les cartes.
4. **Validation 2**, en boucle jusqu'à ce que toutes les cartes soient validées.
5. Mettre en place et vérifier.

L'enseignant valide dans une **page de relecture** (`docs/flashcards/<dossier>/relecture.html`) : il clique, puis « Copier mes retours » et colle le texte dans la conversation.

## 2. À lire avant de commencer

1. `CLAUDE.md`, puis `docs/charte-applications.md` : la section **« Flashcards »** en entier, et §7 (écriture scientifique).
2. `assets/revisions.js` : format des cartes (`REV.paquets`), types, classes utilisables dans les cartes.
3. Un fichier de cartes déjà en place (`changements-etat/modules/flashcards.js`) et `docs/flashcards/maquettes/types.html` (un exemple de chaque type).
4. L'outil de relecture : `docs/flashcards/relecture/` (`modele.html`, format de `donnees.js`).
5. L'application `<dossier>`, dans cet ordre, en notant au fur et à mesure (lis chaque fichier une seule fois) :
   - le `PLAN` (dans `modules/<pref>.js`) : modules, cours et sous-modules, clés des pages ;
   - les **fiches** (`fiche_N.html`) : ce qu'il faut retenir ;
   - la carte **« À retenir »** de chaque cours ;
   - les **séries** : les groupes de questions (ce qui est évalué) et les **diagnostics** (`diag`, `indices`) : les erreurs typiques des élèves, source des cartes « Réflexe » ;
   - les **exercices** (`exercices.js`) : les méthodes qui reviennent, source des cartes « Méthode » et des exercices-types ;
   - les simulations et ateliers : les outils à maîtriser (lecture d'un graphique, d'un schéma), source des cartes « Lecture graphique ».
6. Si `<dossier>/modules/flashcards.js` existe déjà (cartes d'essai ou ancienne version), pars de ces cartes comme proposition, mais repasse par les deux validations. **Ne change jamais l'`id` d'une carte déjà publiée** : l'avancement des élèves y est attaché.

## 3. Étape 1 : repérer les compétences (validation 1)

### Les paquets

- **Un paquet par cours** : le cours d'un module, ou chaque sous-module de cours (`module_2a_cours`, `module_2b_cours`…). Identifiant court : `m1`, `m2a`, `m2b`…
- Pour chaque paquet, propose ses **prérequis** (`apres`) : par défaut, la page de cours du paquet. Propose d'autres pages quand les cartes en ont besoin (par exemple, un paquet « méthode » qui suppose plusieurs sous-modules faits).

### Les compétences

Pour chaque paquet, la liste des **capacités** qu'un élève doit retenir ou savoir faire, chacune avec :
- le texte (verbe à l'infinitif : « Nommer les six changements d'état », « Lire l'état de l'eau sur le diagramme (P, T) ») ;
- le ou les types de cartes prévus, et « deux sens » pour une définition ou une formule ;
- la source (« fiche_1 · Les six changements d'état », « série 3 · diagnostic signe de Q », « exercice 14 »).

Couverture visée : **toutes les capacités** des fiches et des « À retenir », les méthodes qui reviennent dans les exercices, les outils des simulations, les erreurs typiques des diagnostics ; **4 à 8 cartes par cours** (25 à 35 par chapitre environ).

### Ce que tu produis

- `docs/flashcards/<dossier>/donnees.js` : `etape: 'competences'`, `tour: 1`, paquets, prérequis proposés, compétences (format de l'outil de relecture).
- `docs/flashcards/<dossier>/relecture.html` : copie de `docs/flashcards/relecture/modele.html` (chemins relatifs vérifiés).
- Vérifie que la page s'ouvre sans erreur en `file://` (Chromium).

### Ton message à l'enseignant (puis tu t'arrêtes)

Court, sur ce modèle :

> **Étape 1 : les compétences de « <titre> »**
> J'ai repéré **N compétences** dans **P paquets** (un par cours). Ouvre `docs/flashcards/<dossier>/relecture.html`, onglet « 1. Compétences et paquets ».
> - Garde, modifie ou ajoute des compétences.
> - Demande les cartes particulières que tu veux (autant que tu veux par module) : une méthode, un exercice-type, l'utilisation d'un outil…
> - **Quels cours (ou sous-modules) faut-il avoir faits avant que chaque paquet soit proposé à l'élève ?** Ma proposition : m1 après « Cours (module 1) », m2a après « Cours : lire le diagramme d'état », … Coche ou décoche dans « Disponible après ».
>
> Puis « Copier mes retours » et colle le texte ici.

Pose la question des prérequis **dans le message même**, pas seulement dans la page. Si une compétence te semble douteuse (hors programme, ambiguë), dis-le en une ligne.

## 4. Étape 2 : intégrer les retours

- Applique tout : compétences retirées, modifiées, ajoutées ; cartes demandées ; prérequis.
- Si un retour est ambigu, pose une question courte avant d'écrire les cartes.
- Récapitule en quelques lignes ce que tu as changé.

## 5. Étape 3 : écrire toutes les cartes

### Règles d'écriture

- **Une idée par carte.** Question précise, qui dit la forme de la réponse attendue (« Formule et unités », « Deux conséquences »). Réponse courte : l'essentiel en premier, en gras, puis une ou deux lignes.
- **Rien de la réponse au recto.**
- Mêmes notations, mêmes mots et mêmes valeurs que le cours de l'application. Rien qui ne soit dans le cours, sauf une base connue de l'élève.
- Charte §7 : virgule décimale, `×` et `10<sup>n</sup>`, moins `−`, unités `J·kg<sup>−1</sup>`, indices `<sub>`. Tutoiement.
- Taille : la carte doit tenir **imprimée sur 99 × 70 mm** (§8, vérification 4) : environ 250 caractères de réponse plus une figure.

### Les types

| Type | Recto | Verso | Sens |
|---|---|---|---|
| `definition` | le mot (« Qu'est-ce que la chaleur latente L ? Unité ? ») | la définition | **deux** : face 2 = « Comment s'appelle… ? Symbole, unité ? » |
| `formule` | la situation (« Énergie Q pour… ? Formule et unités ») | la formule (`rev-formule`) et les unités (`rev-unites`) | **deux** : face 2 = la formule, « Que calcule-t-on ? Que représente chaque lettre ? » |
| `savoir` | une question sur une règle, une propriété | la règle | un, ou deux si l'inverse a du sens |
| `schema` | un schéma à légender (cases numérotées ①②…) | le schéma légendé, la liste des légendes | un |
| `graphique` | un graphique ou un diagramme avec une question (lire un état, une valeur, une période et en déduire la fréquence…) | la réponse et le graphique annoté (lecture en pointillés) | un |
| `methode` | « Comment faire pour… ? », ou un **exercice-type** : un énoncé court qui revient souvent | les étapes numérotées (5 au plus) ; pour un exercice-type, la **démarche**, pas le calcul complet | un |
| `reflexe` | une situation piège tirée des diagnostics (« m en g et L en kJ·kg<sup>−1</sup> : que fais-tu avant de calculer ? ») | ce qu'il faut vérifier ou convertir | un |

Toute carte particulière demandée par l'enseignant est écrite, même si elle sort de ces types : choisis le type le plus proche.

### Les figures

- **SVG en ligne, autonome** : attributs de présentation (`stroke`, `fill`, `font-size`…), aucune classe ni variable CSS d'une application (la page Révisions ne charge pas son moteur). Couleurs : celles de `assets/theme.css` (encre `#16181d`, `#55585f`, papier `#f3f1ec`, accent de la matière) ; police héritée.
- Pour reprendre une figure de l'application : exécute sa fonction de dessin dans Chromium (Playwright), puis recopie le SVG obtenu en remplaçant chaque classe par ses styles calculés.
- `viewBox`, largeur 520 px au plus, `role="img"` et `aria-label` qui décrit la figure ; lisible à 300 px de large et imprimée à 30 mm de haut.

### Les identifiants

- `<pref>-<paquet sans m>-<mot>` : `ce-1-L`, `ce-2a-zones`, `ce-3-formule`. Uniques dans tout le dépôt (vérifie par `grep`).
- Une carte publiée garde son `id`. Si son sens change profondément, c'est une nouvelle carte avec un nouvel `id`.

### Ce que tu produis

- `donnees.js` : `etape: 'cartes'`, `tour: 2`, toutes les cartes (statut `nouvelle`), rattachées à leur compétence.
- Vérifie la page de relecture (aucune erreur, les deux sens de chaque carte s'affichent, figures lisibles à 390 px).

### Ton message à l'enseignant (puis tu t'arrêtes)

> **Étape 2 : les cartes de « <titre> »**
> **N cartes** (dont d dans les deux sens), dans `docs/flashcards/<dossier>/relecture.html`, onglet « 2. Cartes ».
> Pour chaque carte : Valider, Modifier (dis ce qu'il faut changer) ou Supprimer ; « Tout valider » valide un module d'un coup. Tu peux demander autant de nouvelles cartes que tu veux dans chaque module.
> Puis « Copier mes retours » et colle le texte ici.

## 6. Étape 4 : validation des cartes (en boucle)

- Applique les retours : modifications, suppressions, nouvelles cartes demandées (plusieurs par module).
- Ne touche pas aux cartes validées, sauf demande.
- Nouveau tour : `tour + 1` ; statut `modifiee` ou `nouvelle` pour ce qui a changé, `validee` pour le reste (repliées dans la page) ; les cartes supprimées disparaissent.
- Message court : ce qui a changé, combien de cartes restent à voir.
- Recommence jusqu'à ce que **toutes les cartes soient validées** (0 à voir, 0 à modifier). Ne mets rien en place avant.

## 7. Étape 5 : mise en place

1. `<dossier>/modules/flashcards.js` : les cartes validées seulement, au format de `REV.paquets` (en-tête : nom de l'application, « validées par l'enseignant le AAAA-MM-JJ »). Si le fichier contenait des cartes d'essai, remplace-les ; garde l'`id` des cartes qui restent.
2. `REV.APPLIS` (`assets/revisions.js`) : ajoute `<dossier>` à sa place, dans l'ordre du portail.
3. `SOM.init({ …, flashcards: true })` dans le moteur de l'application.
4. `<dossier>/modules/flashcards.html` : copie du gabarit (titre de la page, `SOM.menu('flashcards')`).
5. Application avec son propre moteur de cours (`cinematique`, `transport-electricite`, `ph`, `puissance-active`) : appelle `REV.finCours(carte, cle)` à l'affichage de « À retenir », comme le fait `assets/cours.js`.
6. Application en une seule page (`spa: true`) : la page Flashcards est un écran `#flashcards` de l'application ; crée `modules/` pour `flashcards.js` s'il n'existe pas.
7. Garde `docs/flashcards/<dossier>/` (relecture et données) : c'est la trace des validations.

## 8. Vérifications avant livraison

Avec Playwright / Chromium, en `file://`, à 1280 px et 390 px (émulation tactile comprise) :

1. Chaque carte, dans chaque sens, s'affiche en séance (recto, verso) sans débordement ni défilement horizontal ; figures lisibles.
2. Accueil de l'application : bloc, boutons des modules et ligne « Flashcards » ; sommaire ; page Flashcards (liste complète, aperçus).
3. Ajout d'un paquet depuis la fin de son cours, prérequis respectés (« Disponible après » tant qu'ils ne sont pas faits).
4. Impression (`page.pdf`, A4) de toutes les cartes : aucune carte ne déborde.
5. Page Révisions : l'application apparaît dans « Par application » une fois un paquet ajouté.
6. `id` uniques dans tout le dépôt ; aucune erreur dans la console.

Fais un commit sur la branche de travail avec un message clair ; pas de pull request sans demande de l'enseignant.

## 9. Format des retours de l'enseignant

« Copier mes retours » produit un texte Markdown de cette forme ; c'est ce que l'enseignant colle dans la conversation :

```
# Retours flashcards — <dossier> — tour 2 (cartes)

## Prérequis
- m5 : module_5a_cours, module_5b_cours

## Compétences retirées / modifiées / ajoutées
- retirée : m1/c7
- modifiée : m2a/c3 : « … »
- ajoutée : m3 : « … »

## Nouvelles cartes demandées
- m2b : Une carte « lire la pression dans une cocotte-minute en pression relative ».
- m2b : Une carte inverse de ce-2b-pression.

## À modifier
- ce-4-palier : ajouter la valeur 100 °C sur le second palier.

## À supprimer
- ce-1-conseq

## Validées (22)
ce-1-etats, ce-1-six, …

## Encore à voir (3)
…
```

## 10. Hors périmètre

- Ne modifie ni les cours, ni les fiches, ni les séries, ni les exercices, ni le `PLAN` de l'application.
- Ne change pas le moteur commun (`assets/revisions.js`, sauf `REV.APPLIS`) : si quelque chose y manque, signale-le à l'enseignant.
