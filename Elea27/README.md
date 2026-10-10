# Intégration des applications dans Éléa (Elea27)

Objectif : publier chaque application du dépôt dans Éléa (Moodle des lycées) sous forme de **parcours qui suit le plan de l'application**, avec les **notes de chaque série** et une **note globale** remontées dans Éléa. Import le plus simple possible, mise à jour facile, outil local hors connexion à terme.

Ce document garde les choix, les méthodes et l'état d'avancement pour reprendre le travail dans une autre session.

---

## 1. État d'avancement

| Étape | État |
|---|---|
| 1. Étude des possibilités (§2 à §4) | faite ; montage **C** et outil **Python** validés par l'enseignant |
| 2. Premier essai léger avec `conversions/` (sans outil automatique) | fait : `conversions-essai/`, testé sur un Moodle 4.5 local (§7) |
| 3. Validation de l'import sur Éléa par l'enseignant | **en attente** (procédure : `conversions-essai/PROCEDURE.md`) |
| 4. Outil local automatisé, autres applications | à faire après l'étape 3 (§8) |

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

Ajouté **dans le paquet seulement**, juste après `assets/sommaire.js` :
`<script src="../elea/elea-scorm.js" data-page="niveau-1" data-type="serie" data-spa></script>`

- Point d'accroche : `SOM.marquer` (`assets/sommaire.js`), par où passent toutes les notes (`{ note }`) et les cours terminés (`{ fait: true }`). Aucune modification de l'application d'origine.
- **Une activité = une page du `PLAN`** : le pont ouvre l'application sur sa page (ancre `#cle` en application d'une seule page), neutralise `SOM.menu` / `SOM.accueil` (pas de sommaire), masque les liens `.er-actions` vers les autres pages et bloque tout changement d'ancre ou lien vers une autre page (sinon la note irait dans la mauvaise activité). La navigation entre étapes est celle d'Éléa.
- SCORM 1.2 : `LMSInitialize` ; statut `incomplete` à l'ouverture ; série : `cmi.core.score.raw` = note sur 20 (`score.min` 0, `score.max` 20), transmise **seulement si meilleure** que celle de la tentative en cours, puis statut `completed` ; cours : `completed` quand `SOM.marquer({ fait: true })` (dernière étape) ; fiche : `completed` à l'ouverture ; `LMSCommit` à chaque événement ; `session_time`, `exit` et `LMSFinish` au déchargement.
- `localStorage` remplacé par un stockage en mémoire : rien n'est écrit dans le navigateur (postes partagés entre élèves). Pas besoin de `suspend_data` : la progression de l'application n'est plus affichée (sommaire masqué) ; l'état est porté par Éléa (statut, note).
- Hors d'Éléa (pas d'API), l'application fonctionne sur sa page sans rien transmettre.

### Paquets SCORM

- Arborescence du dépôt conservée dans le zip (`conversions/index.html`, `assets/…`, `equilibrer-reactions/modules/er.css`) : chemins relatifs inchangés. Lancement : `conversions/index.html`.
- Tout est embarqué, aucune requête externe : **Tailwind** (`commun/vendor/tailwind-browser-4.3.3.js`, licence MIT) au lieu du CDN jsdelivr ; **police** Hanken Grotesk (`commun/police/`, @fontsource 5.3.0, licence OFL) au lieu de Google Fonts (l'`@import` de `assets/theme.css` est remplacé dans la copie du paquet).
- `imsmanifest.xml` SCORM 1.2, un seul SCO. **Identifiants fixes** dérivés de la page : `MANIFEST-conversions-niveau-1`, `ORG-…`, `ITEM-…`, `RES-…`. Remplacer le zip d'une activité garde les SCO, les tentatives et les notes (vérifié).
- Zips et `.mbz` **reproductibles** (dates fixes, ordre trié) : refabriquer sans changement donne des fichiers identiques.

### Réglages des activités (dans le `.mbz`)

| Réglage Moodle | Série | Cours |
|---|---|---|
| Méthode d'évaluation (`grademethod`) | note la plus haute, sur 20 | objets d'apprentissage (1 si terminé) |
| Tentatives | illimitées ; évaluation : tentative la plus haute | idem |
| Nouvelle tentative (`forcenewattempt`) | quand la précédente est terminée (sinon Moodle rouvre en « révision » et n'enregistre plus) | idem |
| Ouverture | page courante, accès direct au contenu (`skipview` toujours), sans structure ni navigation SCORM | idem |
| Achèvement | automatique, statut « terminé » exigé | idem |
| Coefficient dans le total | 1 | **0** |

Carnet : **moyenne pondérée** des notes, total sur 20, seules les séries notées comptent (`aggregateonlygraded`, réglage par défaut de Moodle). Le cours apparaît dans le carnet (1/1 quand il est fini) mais ne compte pas. Une série ouverte et pas finie n'a pas de note et ne compte pas.

### Format `.mbz` (`conversions-essai/fabrication/mbz.py`)

- Archive tar.gz (ustar) : `.ARCHIVE_INDEX`, `moodle_backup.xml`, `course/`, `sections/section_N/`, `activities/scorm_N/` (`scorm.xml` avec les SCO, `module.xml`, `grades.xml`, `inforef.xml`…), `gradebook.xml`, `files.xml`, `files/<2 car.>/<sha1>` (fichiers identiques stockés une fois).
- Structure relevée sur une sauvegarde faite par Moodle 4.5 ; la sauvegarde **se déclare Moodle 4.1** (`2022112800`) pour être restaurable sur 4.1 comme sur 4.5 sans avertissement (Moodle 4.5 n'applique aucune conversion aux sauvegardes postérieures à 4.0). Les éléments propres à 4.5 (sous-sections…) sont présents et ignorés par 4.1.
- Pour un SCORM : le zip (aire `package`) **et** son contenu décompressé (aire `content`) ; Moodle ne redécompresse pas à la restauration.
- Sans données utilisateur. Section 0 vide. Fusion dans un parcours existant : Moodle ne remplit le nom et le résumé d'une section que s'ils sont vides, et ne restaure le carnet (moyenne pondérée) que si le parcours n'a pas encore de catégorie de notes (cas du « parcours vide »).

## 6. Organisation du dossier

```
Elea27/
  README.md                       ce document
  commun/                         fichiers copiés dans chaque paquet (dossier elea/ du zip)
    elea-scorm.js                 pont SCORM
    vendor/                       Tailwind embarqué + licence
    police/                       police embarquée + licence
  conversions-essai/              premier essai (Conversions, 2 modules, 4 activités)
    PROCEDURE.md                  import dans Éléa pas à pas, vérifications, méthode de secours
    conversions-essai.mbz         parcours à restaurer
    scorm/                        les 4 paquets SCORM (secours, mises à jour)
    fabrication/
      construire_essai.py         fabrique scorm/ et le .mbz (python3, bibliothèque standard)
      mbz.py                      écriture du .mbz
  test-moodle/                    scripts de test sur un Moodle local (§7)
```

Refabriquer l'essai : `python3 Elea27/conversions-essai/fabrication/construire_essai.py`

## 7. Tests sur un Moodle local (environnement de Claude)

Fait pour l'essai, tout est passé :

- restauration en fusion dans un parcours vide, **en ligne de commande** (`test-moodle/restaurer.php`) et **par l'interface** en tant qu'enseignant (Playwright : dépôt du fichier, « Fusionner », restauration en arrière-plan) : sections nommées, 4 activités, réglages, carnet en moyenne pondérée, aucun avertissement ;
- parcours élève (`test-moodle/parcours-eleve.js`) : bonne page ouverte, pas de sommaire, liens vers les autres pages bloqués ; cours terminé ; préfixes 14/20 ; niveau 1 : 16, puis « Recommencer » à 12 non transmis, nouvelle tentative 18, puis 10 → reste **18** ; niveau 2 ouvert sans finir → pas de note ; **total 16/20** ;
- série réellement jouée (`test-moodle/serie-jouee.js`, saisies et « Vérifier ») : 7/10 → **14/20** au carnet, activité « Terminé » ; vue téléphone 390 px sans défilement horizontal ;
- remplacement du zip d'une activité : mêmes SCO, tentatives et notes conservées ;
- paquet ouvert hors Moodle (fichier local) : fonctionne, aucune requête externe.

Remarques : ce test ne remplace pas celui sur Éléa (version, gabarit « parcours vide », réglages de la plateforme). Safari iOS n'est pas testable ici.

Remonter l'environnement de test (session Claude) :

- PostgreSQL 16 : `pg_ctlcluster 16 main start`, base `moodle` / utilisateur `moodle` ;
- Moodle : `git clone --depth 1 --branch MOODLE_405_STABLE https://github.com/moodle/moodle.git` (download.moodle.org et les archives GitHub sont bloqués par le proxy, git fonctionne), puis `php -d max_input_vars=5000 admin/cli/install.php --wwwroot=http://localhost:8080 --dbtype=pgsql … --lang=en` ;
- serveur : `PHP_CLI_SERVER_WORKERS=6 php -d max_input_vars=5000 -d upload_max_filesize=100M -d post_max_size=100M -S localhost:8080` (plusieurs processus, sinon le sélecteur de fichiers bloque) ;
- restauration par l'interface : elle passe en tâche de fond, la terminer avec `php admin/cli/adhoc_task.php --execute` ;
- Playwright : `NODE_PATH=$(npm root -g) node …` (Chromium préinstallé).

## 8. Suite prévue (après validation sur Éléa)

Outil local `python3 Elea27/generer.py <application>` :

- lit le `PLAN` de l'application (une seule source de vérité) et en déduit sections (modules) et activités (cours, exemple, questions, entraînement, fiche, exercices) ;
- applications en plusieurs pages (`modules/*.html`) : lancement sur le fichier de la page, `data-spa` absent (le pont gère déjà ce cas, non testé) ;
- généralise `construire_essai.py` et `mbz.py` ; écrit `Elea27/<application>/` (zips + `.mbz` + procédure) ;
- points à traiter : exercices (`SOM` / `cleEx`, points par exercice), fiches, ressources propres à chaque application (images…), applications sans `SOM`.

## Sources consultées

- Éléa : documentation DNE (dépôt `gitlab.com/dne-elearning/moodle-elea/documentation`) : « Découvrir et récupérer des parcours de la Éléathèque », « Faire migrer un parcours », billet « passage à Moodle 4.1 » (décembre 2023) ; tutoriels DRANE (Martinique, Clermont, Paris).
- SCORM dans Éléa : DRANE Normandie (générateur d'activités SCORM), SVT Versailles (export SCORM Canoprof vers Éléa), Mathix (MathALÉA et Éléa).
- Moodle 4.5 (code source) : `mod/scorm` (notation, tentatives, achèvement), `backup/` (format et restauration).
