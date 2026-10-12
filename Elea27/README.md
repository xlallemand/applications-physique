# Intégration des applications dans Éléa (Elea27)

Objectif : publier chaque application du dépôt dans Éléa (Moodle des lycées) sous forme de **parcours qui suit le plan de l'application**, avec les **notes de chaque série** et une **note globale** remontées dans Éléa. Import le plus simple possible, mise à jour facile, outil local hors connexion à terme.

Ce document garde les choix, les méthodes et l'état d'avancement pour reprendre le travail dans une autre session.

---

## 1. État d'avancement

| Étape | État |
|---|---|
| 1. Étude des possibilités (§2 à §4) | faite ; montage **C** et outil **Python** validés par l'enseignant |
| 2. Premier essai léger avec `conversions/` (sans outil automatique) | fait : `conversions-essai/`, testé sur un Moodle 4.5 local (§7) |
| 3. Validation de l'import sur Éléa par l'enseignant | **validée** (12/10/2026) : restauration du `.mbz` réussie, notes remontées dans Éléa |
| 4. Outil local `generer.py` (§6) | fait : Conversions complète et pH générés, testés sur Moodle 4.5 local (§7) ; **en attente de validation sur Éléa** |
| 5. Autres applications | à faire après l'étape 4 (§8) |

Décisions de l'enseignant (12/10/2026) : **toutes les pages** du plan deviennent des activités ; note globale = **moyenne des séries faites** ; page d'exercices **sans note** (achevée quand tous les exercices sont faits) ; appli multi-pages d'essai : **pH**.

## 2. Ce qu'Éléa permet à un enseignant

Éléa est un Moodle (passé en 4.1 en janvier 2024 ; version actuelle non vérifiée) sans possibilité d'installer de plugin ni de brancher un serveur externe. Un enseignant peut :

- ajouter une activité **« Paquetage SCORM »** (dépôt d'un `.zip`) ;
- **restaurer une sauvegarde `.mbz`** : créer un parcours avec le gabarit « parcours vide », puis *Plus → Réutilisation de cours → Restauration*, déposer le fichier, cocher **« Fusionner le cours sauvegardé avec ce cours »** (procédure officielle DNE « Faire migrer un parcours »).

## 3. Pourquoi SCORM, et les solutions écartées

La seule façon pour une application HTML / JavaScript existante de renvoyer une note à Éléa **sans serveur** est **SCORM** : le lecteur SCORM de Moodle fournit une API JavaScript (`window.API` en SCORM 1.2) que la page appelle. Le `.mbz` n'est pas une alternative au SCORM : c'est l'emballage d'un **parcours complet** (sections + activités SCORM déjà réglées), restauré en une fois.

| Solution écartée | Raison |
|---|---|
| Lien URL / iframe vers l'application en ligne | aucune note remontée |
| H5P | ne peut pas contenir une application HTML / JS libre |
| Test Moodle (questions GIFT / XML) | tout à réécrire ; perte des questions aléatoires, du pavé numérique, du glisser-déposer, des diagnostics |
| LTI, xAPI / cmi5 | demandent un serveur ou un plugin impossible à installer sur Éléa |

## 4. Montage retenu : C (un SCORM par page + un `.mbz` du parcours)

| | A. Un seul SCORM | B. Un SCORM par page, à la main | **C. B + `.mbz` (retenu)** |
|---|---|---|---|
| Import | 1 zip | une activité à créer et régler par page | parcours vide → Restauration → 1 fichier |
| Parcours visible dans Éléa | non | oui | oui, réglages compris |
| Notes | une seule | une colonne par série + total | idem, total réglé |
| Mise à jour | remplacer le zip | remplacer chaque zip touché | idem, ou nouveau `.mbz` dans un parcours neuf |

Les zips de B sont livrés à côté du `.mbz` : méthode de secours si la restauration échoue.

## 5. Choix techniques (validés sur Moodle 4.5 local)

### Pont SCORM (`commun/elea-scorm.js`)

Ajouté **dans le paquet seulement**, dans la page lancée, juste après `assets/sommaire.js` :
`<script src="../elea/elea-scorm.js" data-page="niveau-1" data-type="serie" data-spa></script>`
(`data-ex="ph-exercices"` en plus pour une page d'exercices ; pas de `data-spa` pour une application en plusieurs pages).

- Point d'accroche : `SOM.marquer` (`assets/sommaire.js`), par où passent toutes les notes (`{ note }`) et les cours terminés (`{ fait: true }`). Aucune modification de l'application d'origine.
- **Une activité = une page du `PLAN`** : le pont ouvre l'application sur sa page (ancre `#cle` en application d'une seule page, fichier `modules/<cle>.html` sinon), neutralise `SOM.menu` / `SOM.accueil` (pas de sommaire), masque (observateur de mutations) et désactive tout lien vers une autre page de l'application ou d'une autre application du dépôt, et bloque tout changement d'ancre (sinon la note irait dans la mauvaise activité). Les liens vers des sites extérieurs sont gardés. La navigation entre étapes est celle d'Éléa.
- Types d'activité (`data-type`, déduit du type de page du `PLAN`) : `serie` (questions, entraînement) : `cmi.core.score.raw` = note sur 20 (`score.min` 0, `score.max` 20), transmise **seulement si meilleure** que celle de la tentative en cours, puis statut `completed` ; `cours` : `completed` quand `SOM.marquer({ fait: true })` (dernière étape) ; `vue` (fiche, exemple, simulation) : `completed` à l'ouverture ; `exercices` : résultats (`localStorage[cleEx]`, écrits par l'application) copiés dans `cmi.suspend_data` et relus à l'ouverture, `completed` quand il y a un résultat pour chaque exercice de la liste (cartes `.ph-ex-carte[data-id]` de la charte). Statut `incomplete` à l'ouverture ; `LMSCommit` à chaque événement ; `session_time`, `exit` et `LMSFinish` au déchargement.
- `localStorage` remplacé par un stockage en mémoire : rien n'est écrit dans le navigateur (postes partagés entre élèves). La progression de l'application n'est plus affichée (sommaire masqué) ; l'état est porté par Éléa (statut, note, résultats des exercices).
- Hors d'Éléa (pas d'API), l'application fonctionne sur sa page sans rien transmettre.

### Paquets SCORM

- Arborescence du dépôt conservée dans le zip : tout le dossier de l'application, plus les fichiers qu'elle charge hors de son dossier (`<script src>`, `<link href>`, `<img src>`, `@import` / `url()` des CSS, de proche en proche : `assets/…`, `equilibrer-reactions/modules/er.css`, moteur d'une autre application…). Chemins relatifs inchangés. Tous les paquets d'une application ont le même contenu, sauf la page lancée (pont SCORM) et le manifeste.
- Tout est embarqué, aucune requête externe : **Tailwind** (`commun/vendor/tailwind-browser-4.3.3.js`, licence MIT, seulement si l'application l'utilise) au lieu du CDN jsdelivr ; **police** Hanken Grotesk (`commun/police/`, @fontsource 5.3.0, licence OFL) au lieu de Google Fonts (l'`@import` de `assets/theme.css` est remplacé dans la copie du paquet). Toute autre ressource en ligne est signalée par l'outil (« attention : … »).
- `imsmanifest.xml` SCORM 1.2, un seul SCO. **Identifiants fixes** dérivés de la page : `MANIFEST-conversions-niveau-1`, `ORG-…`, `ITEM-…`, `RES-…`. Remplacer le zip d'une activité garde les SCO, les tentatives et les notes (vérifié).
- Zips et `.mbz` **reproductibles** (dates fixes, ordre trié) : refabriquer sans changement donne des fichiers identiques.

### Réglages des activités (dans le `.mbz`)

| Réglage Moodle | Série | Cours, fiche, exemple | Exercices |
|---|---|---|---|
| Méthode d'évaluation (`grademethod`) | note la plus haute, sur 20 | objets d'apprentissage (1 si terminé) | idem |
| Tentatives | illimitées ; évaluation : tentative la plus haute | idem | idem |
| Nouvelle tentative (`forcenewattempt`) | quand la précédente est terminée (sinon Moodle rouvre en « révision » et n'enregistre plus) | idem | **non** : une fois tout fait, Moodle rouvre en « révision », l'élève retrouve ses résultats (nouveaux scores non enregistrés) |
| Ouverture | page courante, accès direct au contenu (`skipview` toujours), sans structure ni navigation SCORM | idem | idem |
| Achèvement | automatique, statut « terminé » exigé | idem | idem |
| Coefficient dans le total | 1 | **0** | **0** |

Carnet : **moyenne pondérée** des notes, total sur 20, seules les séries notées comptent (`aggregateonlygraded`, réglage par défaut de Moodle). Les activités non notées apparaissent dans le carnet (1/1 quand elles sont terminées) mais ne comptent pas. Une série ouverte et pas finie n'a pas de note et ne compte pas.

Noms des activités : « Cours · <titre du module> », « Questions · … », « Fiche récapitulative · … » ; libellé propre du plan s'il existe (`noms`, ex. « Astuces ») ; nom de la partie pour une partie d'une seule page dans un module en plusieurs parties (ex. « Niveau 1 : nombres décimaux ») ; titre du module pour la page d'exercices. Sections : « Module N · <titre> », résumé = `desc` du plan.

### Format `.mbz` (`outil/mbz.py`)

- Archive tar.gz (ustar) : `.ARCHIVE_INDEX`, `moodle_backup.xml`, `course/`, `sections/section_N/`, `activities/scorm_N/` (`scorm.xml` avec les SCO, `module.xml`, `grades.xml`, `inforef.xml`…), `gradebook.xml`, `files.xml`, `files/<2 car.>/<sha1>` (fichiers identiques stockés une fois).
- Structure relevée sur une sauvegarde faite par Moodle 4.5 ; la sauvegarde **se déclare Moodle 4.1** (`2022112800`) pour être restaurable sur 4.1 comme sur 4.5 sans avertissement (Moodle 4.5 n'applique aucune conversion aux sauvegardes postérieures à 4.0). Les éléments propres à 4.5 (sous-sections…) sont présents et ignorés par 4.1.
- Pour un SCORM : le zip (aire `package`) **et** son contenu décompressé (aire `content`) ; Moodle ne redécompresse pas à la restauration.
- Sans données utilisateur. Section 0 vide. Fusion dans un parcours existant : Moodle ne remplit le nom et le résumé d'une section que s'ils sont vides, et ne restaure le carnet (moyenne pondérée) que si le parcours n'a pas encore de catégorie de notes (cas du « parcours vide »).

## 6. Organisation du dossier

```
Elea27/
  README.md                       ce document
  generer.py                      OUTIL : python3 Elea27/generer.py conversions ph …
  outil/
    plan.py                       lecture du PLAN et de SOM.init (lecteur de littéraux JS), liste des activités
    paquet.py                     paquets SCORM 1.2 (fichiers, pont, Tailwind et police embarqués, manifeste)
    mbz.py                        écriture du .mbz (format Moodle 4.1)
    procedure.py                  PROCEDURE.md de chaque application
  commun/                         fichiers copiés dans chaque paquet (dossier elea/ du zip)
    elea-scorm.js                 pont SCORM
    vendor/                       Tailwind embarqué + licence
    police/                       police embarquée + licence
  conversions/, ph/               SORTIES de l'outil (ne pas modifier à la main) :
    <appli>.mbz                   parcours complet à restaurer
    scorm/<appli>-NN-<page>.zip   un paquet par activité (mises à jour, secours)
    PROCEDURE.md                  contenu, import, vérifications, mise à jour
  conversions-essai/              premier essai validé sur Éléa (archive, figé ; remplacé par conversions/)
  test-moodle/                    scripts de test sur un Moodle local (§7)
```

Générer ou mettre à jour : `python3 Elea27/generer.py <application> …` (Python 3, bibliothèque standard, hors connexion). Les paquets sont reproductibles : seuls ceux dont l'application a changé ont un contenu différent. Les identifiants (`<id>-<page>`) sont ceux de l'essai : les zips de `conversions/scorm/` peuvent remplacer ceux du parcours d'essai déjà restauré sans perdre les notes.

Applications prises en charge (navigation commune `SOM` avec un `PLAN`) : avancement-reaction, combustions, conversions, equations-en-physique, equations-en-physique-avec-aide, equilibrer-reactions, fractions-college, lecture-graphique, oxydoreduction-STI2D, ph, proportionnalite, puissance-active, puissances-10, spectres-etoiles. Non prises en charge : cinematique et transport-electricite (navigation propre `CIN.menu`), equations-college, pile, decroissance-radioactive (pas de `PLAN`).

## 7. Tests sur un Moodle local (environnement de Claude)

Fait pour l'essai, tout est passé :

- restauration en fusion dans un parcours vide, **en ligne de commande** (`test-moodle/restaurer.php`) et **par l'interface** en tant qu'enseignant (Playwright : dépôt du fichier, « Fusionner », restauration en arrière-plan) : sections nommées, 4 activités, réglages, carnet en moyenne pondérée, aucun avertissement ;
- parcours élève (`test-moodle/parcours-eleve.js`) : bonne page ouverte, pas de sommaire, liens vers les autres pages bloqués ; cours terminé ; préfixes 14/20 ; niveau 1 : 16, puis « Recommencer » à 12 non transmis, nouvelle tentative 18, puis 10 → reste **18** ; niveau 2 ouvert sans finir → pas de note ; **total 16/20** ;
- série réellement jouée (`test-moodle/serie-jouee.js`, saisies et « Vérifier ») : 7/10 → **14/20** au carnet, activité « Terminé » ; vue téléphone 390 px sans défilement horizontal ;
- remplacement du zip d'une activité : mêmes SCO, tentatives et notes conservées ;
- paquet ouvert hors Moodle (fichier local) : fonctionne, aucune requête externe.

Fait pour l'outil (Conversions complète et pH), avec `test-moodle/parcours-complet.js` (chaque activité ouverte et vérifiée), tout est passé :

- restauration de `conversions.mbz` (4 sections, 14 activités) et `ph.mbz` (3 sections, 7 activités) en fusion dans un parcours vide ;
- chaque activité ouvre la bonne page (`#cle` ou `modules/<cle>.html`), sans sommaire, sans aucun lien visible vers une autre page (y compris en fin de cours) ;
- Conversions : 3 cours, 4 pages vues (astuces, fiches), 7 séries notées : **14/14 activités terminées**, total = moyenne des 7 séries (15/20) ;
- pH : cours terminés, fiches vues, série du module 1 jouée par l'interface (réponses affichées : 0/20 transmis), puis 15/20 en nouvelle tentative → 15 ; exercices : 3 faits, on quitte, on revient → **3/17 retrouvés** ; les 14 autres → **activité terminée** ; en revenant (révision) → 17/17 affichés ; **7/7 terminées**, total 15/20 ;
- fabrication reproductible (deux fabrications successives donnent des fichiers identiques).

Remarques : ce test ne remplace pas celui sur Éléa (version, gabarit « parcours vide », réglages de la plateforme). Safari iOS n'est pas testable ici. La question d'équation par glisser-déposer de la série du module 2 de pH n'a pas été jouée automatiquement (note transmise par `SOM.marquer`).

Remonter l'environnement de test (session Claude) :

- PostgreSQL 16 : `pg_ctlcluster 16 main start`, base `moodle` / utilisateur `moodle` ;
- Moodle : `git clone --depth 1 --branch MOODLE_405_STABLE https://github.com/moodle/moodle.git` (download.moodle.org et les archives GitHub sont bloqués par le proxy, git fonctionne), puis `php -d max_input_vars=5000 admin/cli/install.php --wwwroot=http://localhost:8080 --dbtype=pgsql … --lang=en` ;
- serveur : `PHP_CLI_SERVER_WORKERS=6 php -d max_input_vars=5000 -d upload_max_filesize=100M -d post_max_size=100M -S localhost:8080` (plusieurs processus, sinon le sélecteur de fichiers bloque) ;
- restauration par l'interface : elle passe en tâche de fond, la terminer avec `php admin/cli/adhoc_task.php --execute` ;
- Playwright : `NODE_PATH=$(npm root -g) node …` (Chromium préinstallé).

## 8. Suite prévue

1. Validation sur Éléa de `conversions/` et `ph/` (procédures dans chaque dossier).
2. Générer les autres applications prises en charge et les vérifier une par une (`parcours-complet.js`) : pages de type `simulation`, applications qui réutilisent le moteur d'une autre (puissance-active).
3. Cinématique et Transport de l'électricité : brancher le pont sur leur navigation propre (`CIN.menu`, notes) ; applications sans `PLAN` : une seule activité (decroissance-radioactive charge en plus Chart.js en ligne, à embarquer).

## Sources consultées

- Éléa : documentation DNE (dépôt `gitlab.com/dne-elearning/moodle-elea/documentation`) : « Découvrir et récupérer des parcours de la Éléathèque », « Faire migrer un parcours », billet « passage à Moodle 4.1 » (décembre 2023) ; tutoriels DRANE (Martinique, Clermont, Paris).
- SCORM dans Éléa : DRANE Normandie (générateur d'activités SCORM), SVT Versailles (export SCORM Canoprof vers Éléa), Mathix (MathALÉA et Éléa).
- Moodle 4.5 (code source) : `mod/scorm` (notation, tentatives, achèvement), `backup/` (format et restauration).
