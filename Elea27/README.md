# Intégration des applications dans Éléa (Elea27)

Objectif : publier chaque application du dépôt dans Éléa (Moodle des lycées) sous forme de **parcours qui suit le plan de l'application**, avec les **notes de chaque série** et si possible une **note globale** remontées dans Éléa. Import le plus simple possible, mise à jour facile, outil local hors connexion à terme.

Ce document garde les choix, les méthodes et l'état d'avancement pour reprendre le travail dans une autre session.

---

## 1. État d'avancement

| Étape | État |
|---|---|
| 1. Étude des possibilités (ce document, §2 à §5) | faite, **en attente de validation** |
| 2. Premier essai léger avec `conversions/` (sans outil automatique) | à faire après validation |
| 3. Validation de l'import sur Éléa par l'enseignant | à faire |
| 4. Outil local automatisé, autres applications | à faire après l'étape 3 |

Décisions en attente :

1. Montage retenu (recommandation : **C**, avec les zips de **B** livrés à côté en secours, voir §4).
2. Forme de l'outil local : script Python (recommandé) ou page HTML (voir §6).
3. Contenu du premier essai (proposition au §7).

## 2. Ce qu'Éléa permet à un enseignant

Éléa est un Moodle (version 4.x, non vérifiée) sans possibilité d'installer de plugin ni de brancher un serveur externe. Un enseignant peut :

- ajouter une activité **« Paquetage SCORM »** (dépôt d'un `.zip`) ;
- **restaurer une sauvegarde `.mbz`** dans un parcours : créer un parcours vide, puis *Plus → Réutilisation de cours → Restauration*, déposer le fichier (même procédure que pour les parcours de l'Éléathèque). Selon l'académie, il faut parfois ajouter le bloc Administration.

## 3. Pourquoi SCORM

La seule façon pour une application HTML / JavaScript existante de renvoyer une note à Éléa **sans serveur** est **SCORM** : le lecteur SCORM de Moodle fournit une API JavaScript (`window.API` en SCORM 1.2) que la page appelle.

Le `.mbz` n'est pas une alternative au SCORM : c'est l'emballage d'un **parcours complet** (sections + activités SCORM déjà réglées), restauré en une fois.

Point d'accroche dans le code : toutes les notes des applications passent par `SOM.marquer({ note })` (`assets/sommaire.js`), les cours terminés par `SOM.marquer({ fait: true })`. Un script « pont SCORM » ajouté **dans le paquet seulement** intercepte ces appels et transmet note / achèvement à Éléa. L'application d'origine n'est pas modifiée.

Dans `conversions/` (application en une seule page, `spa: true`) : 7 séries notées sur 20 (`prefixes`, `niveau-1` à `niveau-4`, `ex-sq`, `ex-comp`), 14 pages au total dans le `PLAN`.

### Solutions écartées

| Solution | Raison |
|---|---|
| Lien URL / iframe vers l'application en ligne | aucune note remontée |
| H5P | ne peut pas contenir une application HTML / JS libre |
| Test Moodle (questions GIFT / XML) | notes natives, mais tout est à réécrire ; perte des questions aléatoires, du pavé numérique, du glisser-déposer, des diagnostics |
| LTI, xAPI / cmi5 | demandent un serveur ou un plugin impossible à installer sur Éléa |

## 4. Les trois montages SCORM

| | A. Un seul SCORM pour toute l'application | B. Un SCORM par étape, ajoutés à la main | C. Un SCORM par étape + un `.mbz` du parcours |
|---|---|---|---|
| Import | 1 zip | une activité à créer et régler par étape (14 pour Conversions) | parcours vide → Restauration → 1 fichier |
| Parcours visible dans Éléa | non : une seule activité, le sommaire de l'application guide | oui : une section par module, une activité par cours / série / fiche | oui, comme B, réglages compris |
| Notes dans le carnet | une seule (globale) ; détail par série dans le rapport SCORM « Objectifs » | une colonne par série + total = note globale | comme B, total réglé en moyenne sur 20 |
| Achèvement (✓ Éléa) | une case | par activité, à régler à la main | par activité, déjà réglé |
| Mise à jour de l'application | remplacer le zip dans les paramètres de l'activité (notes conservées) | remplacer le zip de chaque activité touchée | comme B (notes conservées), ou restaurer le nouveau `.mbz` dans un parcours neuf (rentrée) |
| Nouvelle application | 1 zip | tout refaire à la main | regénérer, 1 restauration |
| Risque technique | faible | faible | moyen : `.mbz` = format interne de Moodle, généré hors Moodle, à valider sur Éléa |

**Recommandation : C**, en livrant aussi les zips de B : si la restauration échoue sur Éléa, on bascule sur B sans rien refaire.

## 5. Contraintes et choix techniques communs

- **SCORM 1.2** (le mieux géré par Moodle). Note envoyée sur 20 (`cmi.core.score.raw`, `score.min = 0`, `score.max = 20`), note maximale de l'activité = 20, évaluation « note la plus haute » : comme l'application, qui garde la meilleure. Le pont n'envoie une note que si elle est meilleure que celle déjà enregistrée. *(Correspondance score brut ↔ note du carnet à vérifier sur Moodle lors de l'essai.)*
- **Une activité = une page du `PLAN`** : chaque paquet ouvre l'application directement sur sa page (ancre pour une application en une seule page). Le sommaire interne et les liens vers les autres pages sont masqués : sinon un élève ferait le niveau 3 depuis l'activité « niveau 1 » et la note irait au mauvais endroit. La navigation entre étapes est celle d'Éléa.
- **Achèvement** : cours → `completed` à la dernière étape (`SOM.marquer({ fait: true })`) ; fiche → `completed` à l'ouverture ; série → `passed` / `completed` à la note.
- **Progression** : sur les postes partagés du lycée, le `localStorage` mélange les élèves. En mode Éléa, la progression est gardée par Éléa (`cmi.suspend_data`, 4 096 caractères en SCORM 1.2), plus dans le navigateur.
- **Ressources en ligne** : Conversions charge Tailwind (cdn.jsdelivr.net) et la police Google Fonts. À embarquer dans le paquet pour ne pas dépendre du filtrage réseau du lycée (dans le paquet seulement).
- **Mise à jour sans perte de notes** : remplacer le zip d'une activité garde les notes si l'identifiant de l'item du manifeste (`imsmanifest.xml`) ne change pas. Les identifiants sont donc fixes, dérivés de la clé de page du `PLAN` (ex. `conversions-niveau-1`).
- **Carnet de notes** : pas de détail question par question (possible plus tard dans les rapports SCORM via `cmi.interactions`).
- **Note globale** : catégorie du carnet en « moyenne des notes », sur 20. *(À vérifier : Moodle ne restaure la structure du carnet que si le parcours cible n'a pas encore de notes ; d'où la restauration dans un parcours vide.)*
- **Format `.mbz`** : archive tar.gz de fichiers XML (`moodle_backup.xml`, `sections/`, `activities/scorm_N/`, `files.xml`, `files/<2 car.>/<sha1>`…). Pour un SCORM, il contient le zip **et** les fichiers décompressés (Moodle ne redécompresse pas à la restauration). Fichiers identiques stockés une seule fois. On génère un format d'une version de Moodle ancienne (4.1) : Moodle restaure les sauvegardes de versions antérieures.

## 6. Outil local (étape 4, pas encore commencé)

Principe : l'outil lit le `PLAN` de l'application (une seule source de vérité), copie l'application et les fichiers de `assets/` utilisés, ajoute le pont SCORM, puis écrit dans `Elea27/<application>/` un zip par activité et le `.mbz` du parcours. Hors connexion, aucune dépendance.

- **Script Python** (bibliothèque standard seulement : `zipfile`, `tarfile`, `hashlib`) : `python Elea27/generer.py conversions`. Python à installer une fois. Peut aussi être lancé par Claude dans une session. *Recommandé.*
- **Page HTML** (`generer.html`) : rien à installer ; zip et tar.gz écrits en JavaScript pur ; écriture directe dans un dossier seulement sous Chrome / Edge.

## 7. Premier essai proposé (étape 2)

Dossier `Elea27/conversions-essai/`, fait à la main (sans outil) :

- parcours de 2 sections :
  1. *Les préfixes et la méthode* : Cours (achevé en fin de cours), Apprendre les préfixes (noté sur 20) ;
  2. *S'entraîner à convertir* : Niveau 1, Niveau 2 (notés sur 20) ;
- 3 notes + total sur 20 ;
- livrables : le `.mbz`, les 4 zips SCORM, une procédure d'import pas à pas et la liste de ce qu'il faut vérifier dans Éléa.

## 8. Environnement de travail de Claude (pour les sessions suivantes)

- PHP 8.3 (extensions pgsql, zip, intl, gd…) et PostgreSQL sont présents : on peut installer un Moodle local pour restaurer le `.mbz` et tester les notes SCORM avec Playwright avant livraison.
- `download.moodle.org` et les archives GitHub sont bloqués par le proxy ; `git` vers `github.com/moodle/moodle` fonctionne (branche `MOODLE_405_STABLE`, clonage superficiel).
- Ce test local ne remplace pas le test sur Éléa (version et réglages propres à la plateforme).

## Sources consultées

- Restauration d'un `.mbz` dans Éléa : documentation DNE « Découvrir et récupérer des parcours de la Éléathèque » (dne-elearning.gitlab.io), tutoriels DRANE (Martinique, Clermont, Paris).
- SCORM dans Éléa : DRANE Normandie (générateur d'activités SCORM), SVT Versailles (export SCORM Canoprof vers Éléa), Mathix (MathALÉA et Éléa).
- Moodle : docs.moodle.org « Restauration de cours », « Paramètres SCORM ».
