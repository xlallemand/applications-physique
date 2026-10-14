# Instructions communes : applications des chapitres de Terminale STI2D

Ce fichier est lu au début de chaque session qui fabrique l'application d'un chapitre (`chapitre-NN.md`). Le prompt du chapitre précise ce qui lui est propre ; tout le reste est ici.

## 1. Sources (dépôt privé des cours)

- Dépôt `xlallemand/Cours-TSTI2D` : attache-le avec `add_repo` (lecture seule), clone-le dans `/home/user/cours-tsti2d`. Les chemins des prompts partent de `TSTI2D/`.
- **Ne modifie jamais ce dépôt** : il ne sert qu'à lire.
- Les cours complétés, les énoncés du manuel et les corrections sont surtout des **images** et des **annotations manuscrites** (encre de tablette). `pdftotext` ne les voit pas.
  - PDF : lis-le avec `Read` et `pages` ; c'est le rendu exact, notes manuscrites comprises.
  - `.docx` sans PDF complété : convertis-le d'abord (`soffice --headless --convert-to pdf --outdir <scratchpad> "<fichier.docx>"`), puis lis le PDF obtenu.
  - Pour un texte tapé seul (données, consignes), `pdftotext -layout` coûte bien moins cher.
  - Page de correction **blanche dans le PDF** : la correction est une image EMF du `.docx` (cas du chapitre 14). Extrais-la avec `unzip -o "<docx>" 'word/media/*'`, puis convertis-la avec `soffice --headless --convert-to png <image>.emf`.
- **Économie de tokens.** Le prompt du chapitre résume déjà le cours, les méthodes et les erreurs relevées dans les corrections : ne relis pas le cours en entier. Lis les **énoncés** (données exactes, figures à refaire en SVG) et les **corrections** (pour rédiger les corrections détaillées), une page à la fois, une seule fois, en notant ce dont tu as besoin. Ne relis une page de cours que pour vérifier un détail.
- Quand une correction manuscrite contient une erreur relevée dans le prompt, utilise la valeur corrigée du prompt.

## 2. Ce qu'il faut lire dans `applications-physique`

1. `CLAUDE.md`, puis **en entier** `docs/charte-applications.md`. Elle prime sur tout le reste pour la présentation, la navigation et la pédagogie.
2. Les applications de référence du même niveau :
   - `transport-electricite/` (chapitre 4) : exercices guidés avec **schémas où l'élève place les données de l'énoncé** (`modules/schemas.js`, partie `'schema'` de `te.js`, choix de la formule avant le calcul `SCH.choixFormule`) ;
   - `puissance-active/` (chapitre 3) : activités, graphiques u(t), i(t), p(t), aires sous la courbe (`modules/pa.js` `PA.Graphe`, `modules/pa-outils.js`) ;
   - `combustions/` (chapitre 14) : schéma de méthode (une colonne par espèce, flèches de calcul) et exercices par étapes ;
   - `cinematique/` : référence de la charte (moteur `cin.js`, exercices `exercices.js` + `module_6.html`).
3. Ne lis que les fichiers utiles à ton chapitre (le prompt du chapitre les nomme).

## 3. Structure de l'application

- Un dossier à la racine (nom court sans numéro de chapitre, donné dans le prompt du chapitre), `index.html` et `modules/`. Préfixe de 2 ou 3 lettres, espace de noms global propre.
- **Nom de l'application = titre du chapitre avec son numéro** : « Chapitre N : Titre », tel que le donne le prompt du chapitre (ligne « nom »). Le même texte, au caractère près, partout où l'application est nommée :
  - `<title>` et `<h1>` de l'accueil ;
  - `SOM.init({ nom })` (sommaire et barre du haut) ;
  - fin du `<title>` des pages de module (« Module 1 : … — Chapitre N : Titre ») ;
  - `titre` de l'entrée `APPS` du portail.
  
  `SOM.init({ id })` reste le nom du dossier : c'est la clé de la progression enregistrée.
- Pour le reste, suis la charte : `<html lang="fr" data-matiere="physique|chimie">`, feuilles de style et scripts dans l'ordre du §2, `SOM` pour la navigation, `COURS` (`assets/cours.js`) pour les cours, moteur de questions et d'exercices copié depuis `cinematique/modules/cin.js` puis renommé.
- Chaque module :
  - un cours (notion → exemple → « À toi », « Afficher tout le cours », « À retenir ») ;
  - une série de 10 questions notée sur 20 (fabriques aléatoires, diagnostics ciblés) ;
  - une fiche récapitulative.
  
  Un module long se découpe en parties (a, b…).
- Dernier module : **exercices du support papier, avec la même numérotation**, donc le numéro du manuel et sa page (« Exercice 11 p. 32 »). Chaque exercice est guidé par parties, avec la correction détaillée toujours disponible (« Voir la correction », 0 point). Les exercices supplémentaires ou de bac portent une lettre ou leur titre (comme les exercices de synthèse A à F de `transport-electricite`).
- Les simulations ou activités demandées par le prompt du chapitre sont des pages de type `simulation` (icône ▸), placées en tête de la partie qu'elles introduisent. Chaque simulation est suivie d'un bilan à compléter (« ✍ Complète ton cours ») et marquée faite à l'affichage du bilan.
- Portail : ajoute l'application dans `APPS` de `index.html` (racine), `niv: ['sti']`, `titre` = nom de l'application, parmi les applications STI2D du même domaine dans l'ordre des numéros de chapitre. Ajoute un dessin d'en-tête dans `assets/hero.js` seulement si aucun dessin existant ne convient (liste en tête du fichier).
- Applications d'outils à citer en lien (« Revois… ») plutôt que de refaire leur contenu : `conversions/`, `puissances-10/`, `equations-en-physique/`, `proportionnalite/`, `lecture-graphique/`.

## 4. Habitudes du professeur (visibles dans les corrections)

- Une rédaction en trois temps :
  1. la formule littérale ;
  2. la grandeur cherchée isolée (« donc P<sub>a</sub> = P<sub>u</sub> / η ») ;
  3. l'application numérique **avec les unités écrites** (en vert dans les corrections), le résultat avec son unité et des chiffres significatifs raisonnables.
  
  Les corrections des exercices de l'application suivent ce modèle.
- Il montre souvent **deux méthodes** pour le même calcul (« OU ») : la formule, ou un tableau de proportionnalité avec les unités. Garde les deux quand le prompt le signale.
- Conversions explicites (kWh → J, mAh → Ah, km/h → m/s…) dans une étape à part.
- Les grandeurs repérées sur un schéma ou un graphique (aires hachurées, valeurs reportées) aident l'élève : refais-les en SVG.

## 5. Avant de livrer

- Passe la liste du §10 de la charte (Playwright / Chromium à 1280 px et 390 px ; ne lance pas `playwright install`).
- Vérifie à la main **chaque valeur numérique** des exercices avec un petit script (scratchpad), pas de tête.
- Commits en français, clairs ; push sur la branche indiquée par la session. Pas de pull request sans demande.
- Compte rendu court :
  - ce qui est fait ;
  - les écarts avec le prompt et pourquoi ;
  - ce qui n'est pas testable (Safari iOS).
