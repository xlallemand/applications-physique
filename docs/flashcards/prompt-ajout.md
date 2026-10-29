# Prompt : ajouter ou modifier des flashcards d'une application

À donner à une nouvelle session, sur le dépôt `xlallemand/applications-physique`, branche `flashcard`, après avoir rempli le bloc ci-dessous.

Ce prompt fait **les changements que l'enseignant demande**, et seulement eux, sur les flashcards d'une application : ajouter des cartes, modifier ou supprimer des cartes existantes, changer les prérequis d'un paquet. L'application peut déjà avoir des flashcards en place, ou pas encore. Le prompt suit les règles de [`prompt-generation.md`](prompt-generation.md) (écriture, types, figures, identifiants, mise en place, vérifications) et utilise le même outil de relecture (`docs/flashcards/relecture/`).

---

## À remplir par l'enseignant

```
Application : <dossier>            (sa valeur `dossier` dans `APPS` du portail, par exemple transferts-thermiques)

Cartes à ajouter :
- <une carte par ligne : ce qu'elle doit faire réviser, et si tu veux le type, le module, le sens…>
- …

Cartes existantes à modifier ou supprimer :
<colle ici le texte de « Copier mes retours » de docs/flashcards/<dossier>/relecture.html,
 ou écris une ligne par carte : « tt-1-zero : … », « supprimer tt-3-unites »>
```

Une des deux listes peut rester vide.

Exemples de lignes à ajouter : « la formule Φ = ΔT / R », « définition de la convection », « un exercice-type : épaisseur d'isolant à ajouter », « lire le sens du flux sur le schéma d'une paroi (module 3) », « réflexe : e en cm avant de calculer R ».

Pour modifier une carte existante, le plus simple est de l'ouvrir dans la page de relecture. Les cartes validées y sont repliées, mais gardent leurs boutons « ✎ Modifier » (avec ce qu'il faut changer) et « ✕ Supprimer ». On peut aussi y demander de nouvelles cartes et changer « Disponible après ». Ensuite, « Copier mes retours ».

---

## 1. Objectif

Faire chaque changement demandé, le faire valider par l'enseignant dans la page de relecture, puis le mettre en place pour les élèves. **Ne touche pas aux autres cartes**, et préserve la progression des élèves (§4, « Garder la progression des élèves »).

Le travail se fait en **quatre étapes, dont une validation par l'enseignant, en boucle**. À chaque validation, **arrête-toi et attends sa réponse** : ne passe jamais à l'étape suivante sans elle.

1. Faire l'état des lieux, ranger les cartes à ajouter et repérer les cartes à modifier.
2. Écrire les cartes ajoutées et les modifications.
3. **Validation**, en boucle jusqu'à ce que tout soit validé.
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
6. L'application `<dossier>`, seulement ce qui sert aux changements demandés : le `PLAN` (dans `modules/<pref>.js`), puis, pour chaque carte, la fiche, la carte « À retenir », la série ou l'exercice qui en parlent.

## 3. Étape 1 : état des lieux

### Si une validation est en cours

`donnees.js` peut contenir des cartes qui ne sont ni validées ni en place (une génération ou un ajout pas terminé). Dans ce cas, **arrête-toi et demande à l'enseignant** s'il faut finir cette validation d'abord ou faire les nouveaux changements au même tour.

### Ranger les cartes à ajouter

Pour chaque ligne de « Cartes à ajouter » :

- **Le paquet** : celui du cours où la notion est enseignée (un paquet par cours ou sous-module de cours : `m1`, `m2a`…, comme dans `prompt-generation.md` §3). Si l'enseignant a indiqué un module, suis-le. Une demande sur le module d'exercices (sans cours) va dans le paquet du cours qui enseigne la méthode.
- **Un paquet qui n'existe pas encore** (application sans flashcards, ou cours sans cartes) : crée-le avec l'identifiant et les prérequis par défaut de `prompt-generation.md` §3 (la page de cours du paquet).
- **Le type** : celui demandé, sinon le type le plus proche dans le tableau de `prompt-generation.md` §5. Une définition ou une formule a **deux sens**.
- **La compétence** : celle du paquet qui correspond déjà dans `donnees.js`. Sinon, une nouvelle compétence (`id` suivant, par exemple `c10` après `c9`), écrite comme dans `prompt-generation.md` §3.
- **Une carte qui existe déjà** (même notion, même type) : ne la double pas. Signale-la à l'enseignant dans ton message, avec son `id`. S'il veut la changer, c'est une modification.

### Repérer les cartes à modifier ou supprimer

Pour chaque retour sur une carte existante, retrouve la carte par son `id` dans `flashcards.js` et dans `donnees.js`. Classe la demande :

- **Correction** (faute, valeur, notation, figure, reformulation, ajout ou retrait d'un sens, `outils`) : la carte garde son `id`.
- **Changement de sens profond** (la carte ne fait plus réviser la même chose) : nouvelle carte avec un nouvel `id`, et l'ancienne est supprimée (`prompt-generation.md` §5, « Les identifiants »).
- **Déplacement** dans un autre paquet : la carte garde son `id`.
- **Suppression**.
- **Prérequis** d'un paquet (`apres`) : à changer tel que demandé.

Si une demande est ambiguë (deux cours possibles, notion absente du cours, hors programme, correction ou changement de sens), **pose une question courte** avant d'écrire. Regroupe toutes tes questions dans un seul message.

## 4. Étape 2 : écrire les cartes ajoutées et les modifications

- **Une carte par demande d'ajout**. Fais-en deux si l'enseignant le dit, ou si la demande contient deux notions : dis-le dans ton message.
- **Une modification ne change que ce qui est demandé** sur la carte. Le reste (question, réponse, figure, type, `outils`) reste tel quel.
- Règles de `prompt-generation.md` §5 : règles d'écriture, types (dont le format des cartes formules), figures, identifiants.
- **Compatibles avec les cartes en place** : mêmes notations, mêmes tournures de question, mêmes couleurs et mêmes fonctions de figure que les cartes déjà écrites pour l'application. `id` au format `<pref>-<paquet sans m>-<mot>`, unique dans tout le dépôt (vérifie par `grep`).

### Garder la progression des élèves

L'état de chaque carte (case, prochaine révision) est rangé dans le navigateur de l'élève sous l'`id` de la carte.

- **Même `id`** : l'élève garde sa case et sa date de prochaine révision, avec le nouveau texte.
- **Nouvel `id`** : la carte repart en case 1. Elle entre dans la boîte de l'élève dès qu'il a ajouté son paquet.
- **Carte supprimée** : elle disparaît des révisions de l'élève.
- **Une carte qui gagne ou perd un sens** (une face ajoutée ou retirée) garde son `id`. Si le sens prévu pour la prochaine révision n'existe plus, le moteur prend la face qui reste.

Dis toujours à l'enseignant quelles cartes changent d'`id` ou disparaissent, puisque les élèves y perdent leur progression.

### Ce que tu produis

`docs/flashcards/<dossier>/donnees.js` :
- **s'il existe** : garde tout, sauf ce qui est demandé.
  - Nouveau tour : `tour + 1`, `etape: 'cartes'`.
  - Statuts : les cartes non touchées passent ou restent en `validee` (repliées dans la page) ; les cartes modifiées passent en `modifiee`, les cartes ajoutées en `nouvelle` ; les cartes supprimées disparaissent.
  - Les nouvelles compétences, les nouveaux paquets et les prérequis changés sont mis à jour.
  - Mets à jour le commentaire d'en-tête : tour, cartes ajoutées, modifiées et supprimées à la demande de l'enseignant.
- **s'il n'existe pas** : crée-le (`tour: 1`, `etape: 'cartes'`), avec les cartes déjà publiées dans `flashcards.js` (en `validee`, ou en `modifiee` si elles sont modifiées) et les cartes ajoutées en `nouvelle`.

`docs/flashcards/<dossier>/relecture.html` : s'il n'existe pas, copie de `docs/flashcards/relecture/modele.html` (`data-matiere` de l'application, chemins relatifs vérifiés).

Vérifie la page de relecture :
- aucune erreur ;
- les deux sens de chaque carte s'affichent ;
- figures lisibles à 390 px ;
- chaque carte ajoutée ou modifiée tient imprimée sur 99 × 70 mm.

### Ton message à l'enseignant (puis tu t'arrêtes)

Court, sur ce modèle :

> **Flashcards de « <titre> » : tour N**
> Dans `docs/flashcards/<dossier>/relecture.html`, onglet « 2. Cartes », filtre « À voir » :
> - **ajoutées (n)** : m1 : `tt-1-…` (définition), `tt-1-…` (formule) ; m3 : … ;
> - **modifiées (n)** : `tt-2-formule` (unités ajoutées), … ;
> - **supprimées (n)** : `tt-3-unites`. Elles disparaissent des révisions des élèves.
>
> Nouvel `id`, progression des élèves remise à zéro : `tt-1-zero` → `tt-1-zeroabs` (la carte ne fait plus réviser la même chose).
> Nouveau paquet : m4, disponible après « Cours : parois composées » (à changer dans l'onglet 1, « Disponible après »).
> Déjà existante, pas doublée : « … » (`tt-2-formule`).
>
> Pour chaque carte : Valider, Modifier (dis ce qu'il faut changer) ou Supprimer. Puis « Copier mes retours » et colle le texte ici.

Ne garde que les lignes utiles. Pose la question des prérequis **dans le message même** pour chaque paquet nouveau.

## 5. Étape 3 : validation (en boucle)

Comme `prompt-generation.md` §6 :

- Applique les retours : modifications, suppressions, nouvelles cartes demandées, prérequis.
- Ne touche pas aux cartes validées, sauf demande explicite de l'enseignant.
- Nouveau tour : `tour + 1` ; statut `modifiee` ou `nouvelle` pour ce qui a changé, `validee` pour le reste ; les cartes supprimées disparaissent.
- Message court : ce qui a changé, combien de cartes restent à voir.
- Recommence jusqu'à ce que **toutes les cartes soient validées** (0 à voir, 0 à modifier). Ne mets rien en place avant.

Les retours de l'enseignant ont le format de `prompt-generation.md` §9.

## 6. Étape 4 : mise en place

### L'application a déjà des flashcards

Dans `<dossier>/modules/flashcards.js` :
- **cartes modifiées** : modifie-les à leur place ;
- **cartes ajoutées** : ajoute-les à la fin de leur paquet ;
- **cartes déplacées** : déplace-les dans leur nouveau paquet ;
- **cartes supprimées** : retire-les ;
- **paquets** : crée les nouveaux à leur place, dans l'ordre du `PLAN`, et change les `apres` demandés ;
- **figures** : ajoute les nouvelles fonctions de figure, et retire celles qui ne servent plus.

Ne change rien d'autre. Ajoute à l'en-tête une ligne : « cartes ajoutées / modifiées / supprimées, validées par l'enseignant le AAAA-MM-JJ ».

### L'application n'a pas encore de flashcards

Fais toute la mise en place de `prompt-generation.md` §7 :
- `flashcards.js` ;
- `REV.APPLIS` ;
- `SOM.init({ …, flashcards: true })` ;
- `flashcards.html` ;
- `REV.finCours`, ou un écran `#flashcards`, selon l'application.

### Dans tous les cas

Garde `docs/flashcards/<dossier>/` (relecture et données) : c'est la trace des validations.

## 7. Vérifications avant livraison

Celles de `prompt-generation.md` §8, pour les cartes ajoutées ou modifiées et les paquets touchés, avec en plus :

- **seules les cartes demandées ont changé** : compare `flashcards.js` avant et après (`git diff`) ;
- **les cartes gardées ont toujours le même `id`** ;
- **la progression d'un élève est préservée** : essai avec un `localStorage` de départ où le paquet touché est déjà ajouté et ses cartes sont dans différentes cases. Vérifie que :
  - les cartes modifiées gardent leur case et leur date ;
  - les cartes ajoutées entrent dans la boîte ;
  - les cartes supprimées n'apparaissent plus ;
  - rien ne plante.

Fais un commit sur la branche de travail avec un message clair ; pas de pull request sans demande de l'enseignant.

## 8. Hors périmètre

- **Rien en dehors des changements demandés** :
  - pas de carte « en plus », même si une notion te semble manquer (propose-la en une ligne dans ton message) ;
  - pas de « petite amélioration » sur une carte que l'enseignant n'a pas citée.
- **Le contenu de l'application** : ne modifie ni les cours, ni les fiches, ni les séries, ni les exercices, ni le `PLAN`.
- **Le moteur et l'outil** : ne change pas le moteur commun (`assets/revisions.js`, sauf `REV.APPLIS`) ni l'outil de relecture. Si quelque chose y manque, signale-le à l'enseignant.
