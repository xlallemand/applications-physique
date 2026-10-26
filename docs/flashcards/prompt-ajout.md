# Prompt : ajouter des flashcards demandées à une application

À donner à une nouvelle session, sur le dépôt `xlallemand/applications-physique`, branche `flashcard`, après avoir rempli le bloc ci-dessous.

Ce prompt écrit **les cartes que l'enseignant demande**, et seulement elles, pour une application qui a déjà des flashcards ou non. Il suit les règles de [`prompt-generation.md`](prompt-generation.md) (écriture, types, figures, identifiants, mise en place, vérifications) et utilise le même outil de relecture (`docs/flashcards/relecture/`).

---

## À remplir par l'enseignant

```
Application : <dossier>            (sa valeur `dossier` dans `APPS` du portail, par exemple transferts-thermiques)

Cartes à générer :
- <une carte par ligne : ce qu'elle doit faire réviser, et si tu veux le type, le module, le sens…>
- …
```

Exemples de lignes : « la formule Φ = ΔT / R », « définition de la convection », « un exercice-type : épaisseur d'isolant à ajouter », « lire le sens du flux sur le schéma d'une paroi (module 3) », « réflexe : e en cm avant de calculer R ».

---

## 1. Objectif

Écrire chaque carte de la liste, la ranger dans le bon paquet, la faire valider par l'enseignant dans la page de relecture, puis la mettre en place pour les élèves **sans rien changer aux cartes déjà publiées**.

Le travail se fait en **quatre étapes, dont une validation par l'enseignant, en boucle**. À chaque validation, **arrête-toi et attends sa réponse** : ne passe jamais à l'étape suivante sans elle.

1. Faire l'état des lieux et ranger chaque demande dans un paquet.
2. Écrire les cartes demandées.
3. **Validation**, en boucle jusqu'à ce que toutes les nouvelles cartes soient validées.
4. Mettre en place et vérifier.

## 2. À lire avant de commencer

1. `CLAUDE.md`, puis `docs/charte-applications.md` : la section **« Flashcards »** en entier, et §7 (écriture scientifique).
2. `docs/flashcards/prompt-generation.md` en entier : ce prompt en reprend les règles, sans les recopier.
3. `assets/revisions.js` : format des cartes (`REV.paquets`), types, classes utilisables dans les cartes.
4. L'outil de relecture : `docs/flashcards/relecture/` (`modele.html`, format de `donnees.js`).
5. **Ce qui existe déjà pour l'application** :
   - `<dossier>/modules/flashcards.js` : les cartes publiées, leurs paquets (`id`, `module`, `titre`, `apres`) et leurs `id` ;
   - `docs/flashcards/<dossier>/donnees.js` : la trace des validations (dernier `tour`, compétences, cartes et leur statut) ;
   - les figures déjà dessinées pour ces cartes (fonctions SVG en tête de `flashcards.js` ou de `donnees.js`) : réutilise-les plutôt que d'en dessiner de nouvelles.
6. L'application `<dossier>`, seulement ce qui sert aux cartes demandées : le `PLAN` (dans `modules/<pref>.js`), puis, pour chaque demande, la fiche, la carte « À retenir », la série ou l'exercice qui en parlent.

## 3. Étape 1 : état des lieux et rangement

### Si une validation est en cours

Si `donnees.js` contient des cartes qui ne sont ni validées ni en place (une génération ou un ajout pas terminé), **arrête-toi et demande à l'enseignant** s'il faut finir cette validation d'abord ou ajouter les nouvelles cartes au même tour.

### Ranger chaque demande

Pour chaque ligne de la liste :

- **Le paquet** : celui du cours où la notion est enseignée (un paquet par cours ou sous-module de cours : `m1`, `m2a`…, comme dans `prompt-generation.md` §3). Si l'enseignant a indiqué un module, suis-le. Une demande sur le module d'exercices (sans cours) va dans le paquet du cours qui enseigne la méthode.
- **Un paquet qui n'existe pas encore** (application sans flashcards, ou cours sans cartes) : crée-le avec l'identifiant et les prérequis par défaut de `prompt-generation.md` §3 (la page de cours du paquet).
- **Le type** : celui demandé, sinon le type le plus proche dans le tableau de `prompt-generation.md` §5 (une définition ou une formule a **deux sens**).
- **La compétence** : celle du paquet qui correspond déjà dans `donnees.js` ; sinon, une nouvelle compétence (`id` suivant : `c10` après `c9`), écrite comme dans `prompt-generation.md` §3.
- **Une carte qui existe déjà** (même notion, même type) : ne la double pas. Signale-la à l'enseignant dans ton message, avec son `id`.

Si une demande est ambiguë (deux cours possibles, notion absente du cours, hors programme), **pose une question courte** avant d'écrire, en regroupant toutes tes questions dans un seul message.

## 4. Étape 2 : écrire les cartes demandées

- **Une carte par demande** (deux si l'enseignant le dit, ou si la demande contient deux notions : dis-le dans ton message).
- Règles de `prompt-generation.md` §5 : règles d'écriture, types (dont le format des cartes formules), figures, identifiants.
- **Compatibles avec les cartes en place** : mêmes notations, mêmes tournures de question, mêmes couleurs et mêmes fonctions de figure que les cartes déjà écrites pour l'application ; `id` au format `<pref>-<paquet sans m>-<mot>`, unique dans tout le dépôt (vérifie par `grep`).

### Ce que tu produis

- `docs/flashcards/<dossier>/donnees.js` :
  - s'il existe : **garde tout**. Nouveau tour : `tour + 1`, `etape: 'cartes'` ; les cartes déjà présentes passent ou restent en `statut: 'validee'` (repliées dans la page) ; les cartes demandées sont ajoutées dans leur paquet avec `statut: 'nouvelle'` ; les nouvelles compétences et les nouveaux paquets sont ajoutés. Mets à jour le commentaire d'en-tête (tour, cartes ajoutées à la demande de l'enseignant).
  - s'il n'existe pas : crée-le (`tour: 1`, `etape: 'cartes'`), avec les cartes déjà publiées dans `flashcards.js` en `validee` (si le fichier existe) et les cartes demandées en `nouvelle`.
- `docs/flashcards/<dossier>/relecture.html` : s'il n'existe pas, copie de `docs/flashcards/relecture/modele.html` (`data-matiere` de l'application, chemins relatifs vérifiés).
- Vérifie la page de relecture : aucune erreur, les deux sens de chaque carte s'affichent, figures lisibles à 390 px, chaque nouvelle carte tient imprimée sur 99 × 70 mm.

### Ton message à l'enseignant (puis tu t'arrêtes)

Court, sur ce modèle :

> **Cartes ajoutées à « <titre> »**
> **N cartes** (dont d dans les deux sens), dans `docs/flashcards/<dossier>/relecture.html`, onglet « 2. Cartes », filtre « À voir » :
> - m1 : `tt-1-…` (définition), `tt-1-…` (formule) ;
> - m3 : …
> Nouveau paquet : m4, disponible après « Cours : parois composées » (à changer dans l'onglet 1, « Disponible après »).
> Déjà existante, pas doublée : « … » (`tt-2-formule`).
> Pour chaque carte : Valider, Modifier (dis ce qu'il faut changer) ou Supprimer. Puis « Copier mes retours » et colle le texte ici.

Pose la question des prérequis **dans le message même** pour chaque paquet nouveau.

## 5. Étape 3 : validation (en boucle)

Comme `prompt-generation.md` §6 :

- Applique les retours : modifications, suppressions, nouvelles cartes demandées, prérequis des nouveaux paquets.
- Ne touche pas aux cartes validées, ni à celles qui étaient déjà en place, sauf demande explicite.
- Nouveau tour : `tour + 1` ; statut `modifiee` ou `nouvelle` pour ce qui a changé, `validee` pour le reste ; les cartes supprimées disparaissent (jamais une carte déjà publiée sans que l'enseignant l'ait demandé).
- Message court : ce qui a changé, combien de cartes restent à voir.
- Recommence jusqu'à ce que **toutes les nouvelles cartes soient validées** (0 à voir, 0 à modifier). Ne mets rien en place avant.

Les retours de l'enseignant ont le format de `prompt-generation.md` §9.

## 6. Étape 4 : mise en place

- **L'application a déjà des flashcards** : dans `<dossier>/modules/flashcards.js`, ajoute les cartes validées à la fin de leur paquet (ou le nouveau paquet à sa place, dans l'ordre du `PLAN`), sans modifier, déplacer ni renommer les cartes en place ; ajoute les fonctions de figure nouvelles s'il y en a. Ajoute à l'en-tête une ligne : « cartes ajoutées, validées par l'enseignant le AAAA-MM-JJ ».
- **L'application n'a pas encore de flashcards** : toute la mise en place de `prompt-generation.md` §7 (`flashcards.js`, `REV.APPLIS`, `SOM.init({ …, flashcards: true })`, `flashcards.html`, `REV.finCours` ou écran `#flashcards` selon l'application).
- Garde `docs/flashcards/<dossier>/` (relecture et données) : c'est la trace des validations.

## 7. Vérifications avant livraison

Celles de `prompt-generation.md` §8, pour les nouvelles cartes et les paquets touchés, avec en plus :

- les cartes déjà en place sont inchangées (compare `flashcards.js` avant et après : seules des lignes ajoutées) ;
- un élève qui avait déjà ajouté un paquet voit les nouvelles cartes de ce paquet dans sa boîte (essai avec un `localStorage` de départ où le paquet est ajouté).

Fais un commit sur la branche de travail avec un message clair ; pas de pull request sans demande de l'enseignant.

## 8. Hors périmètre

- N'écris que les cartes demandées : pas de carte « en plus », même si une notion te semble manquer (propose-la en une ligne dans ton message).
- Ne modifie ni les cours, ni les fiches, ni les séries, ni les exercices, ni le `PLAN` de l'application.
- Ne change pas le moteur commun (`assets/revisions.js`, sauf `REV.APPLIS`) ni l'outil de relecture : si quelque chose y manque, signale-le à l'enseignant.
