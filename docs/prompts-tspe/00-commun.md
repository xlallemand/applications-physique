# Instructions communes : applications des chapitres de Terminale spécialité

Ce fichier est lu au début de chaque session qui fabrique l'application d'un chapitre (`chapitre-NN.md`). Le prompt du chapitre précise ce qui lui est propre ; tout le reste est ici.

## 1. Sources (dépôt privé des cours)

- Dépôt `xlallemand/Cours-TSpe` : attache-le avec `add_repo` (lecture seule), clone-le dans `/home/user/cours-tspe`. Les chemins des prompts partent de la racine de ce dépôt (`02- Nomenclature/…`).
- **Ne modifie jamais ce dépôt** : il ne sert qu'à lire.
- `competences.md` (racine du dépôt) : compétences évaluées au bac, chapitre par chapitre, avec les contextes classiques des sujets. **Lis seulement la section de ton chapitre** : les séries et les exercices supplémentaires s'en inspirent (questions de type bac, contextes). Le numéro de chapitre est celui de `competences.md` et du dossier du cours.
- Les cours sont des PDF (Word) avec des **annotations manuscrites** (encre de tablette) et des images ; les corrections sont souvent des **scans manuscrits**. `pdftotext` ne les voit pas.
  - PDF : lis-le avec `Read` et `pages` ; c'est le rendu exact, notes manuscrites comprises.
  - Détail trop petit (formule, figure) : `pdftoppm -r 200` sur la page, puis recadre l'image (scratchpad).
  - `.docx` sans PDF : convertis-le d'abord (`soffice --headless --convert-to pdf --outdir <scratchpad> "<fichier.docx>"`).
  - Pour un texte tapé seul (consignes, liste de noms), `pdftotext -layout` coûte bien moins cher.
- **Économie de tokens.** Le prompt du chapitre résume déjà le cours, les méthodes et les erreurs relevées dans les corrections : ne relis pas le cours en entier. Lis les **énoncés** (données exactes, figures à refaire en SVG) et les **corrections** (pour rédiger les corrections détaillées), une page à la fois, une seule fois, en notant ce dont tu as besoin. Ne relis une page de cours que pour vérifier un détail.
- Quand une correction manuscrite ou un énoncé contient une erreur relevée dans le prompt, utilise la version corrigée du prompt.

### Vidéos et liens du cours

- Les cours renvoient à des **vidéos** (YouTube) par des liens et des QR codes. Reprends-les **en liens seulement** : pas de QR code, pas de vidéo intégrée (un lecteur intégré ne marche pas toujours en `file://` ni hors ligne).
- Place le lien juste avant la notion qu'il explique, dans un encart discret (`callout`) : « ▶ Vidéo (facultative) : <ce qu'elle montre> », lien `target="_blank" rel="noopener"`.
- **Le cours de l'application se suffit à lui-même** : aucune étape, aucune question ne suppose d'avoir vu la vidéo.
- Animations et exercices en ligne d'autres sites (chimie.ostralo.net, educaplay…) : seulement si le prompt du chapitre le demande ; l'application les remplace.

## 2. Ce qu'il faut lire dans `applications-physique`

1. `CLAUDE.md`, puis **en entier** `docs/charte-applications.md`. Elle prime sur tout le reste pour la présentation, la navigation et la pédagogie.
2. Les applications de référence :
   - `cinematique/` : référence de la charte (moteur `cin.js`, exercices `exercices.js` + `module_6.html`) ;
   - `combustions/` : chimie avec le moteur de cours commun `COURS`, sous-modules de cours (`module_3a_cours.html`, `module_3b_cours.html`), exercices par étapes ;
   - `principe-dynamique/` : module découpé en sous-modules (`sousModules: true`), atelier en page `simulation` (`module_2_simulation.html`) avec un outil `perso` en plusieurs exemplaires ;
   - `equilibrer-reactions/modules/module_1.html` : outils `perso` dans un cours.
3. Les applications de Tle spécialité déjà en ligne (`ph/`, `cinematique/`, `oxydoreduction-spe/`, `pile/`, `decroissance-radioactive/`) : à citer en lien quand le chapitre s'en sert, sans refaire leur contenu.
4. Ne lis que les fichiers utiles à ton chapitre (le prompt du chapitre les nomme).

## 3. Structure de l'application

- Un dossier à la racine (nom court sans numéro de chapitre, donné dans le prompt du chapitre), `index.html` et `modules/`. Préfixe de 2 ou 3 lettres, espace de noms global propre.
- **Nom de l'application = titre du chapitre avec son numéro** : « Chapitre N : Titre », tel que le donne le prompt du chapitre. Le même texte, au caractère près, partout où l'application est nommée :
  - `<title>` et `<h1>` de l'accueil ;
  - `SOM.init({ nom })` (sommaire et barre du haut) ;
  - fin du `<title>` des pages de module (« Module 1 : … — Chapitre N : Titre ») ;
  - `titre` de l'entrée `APPS` du portail.

  `SOM.init({ id })` reste le nom du dossier : c'est la clé de la progression enregistrée.
- Kicker de l'en-tête illustré : « Chimie · Terminale spécialité » ou « Physique · Terminale spécialité ».
- Pour le reste, suis la charte : `<html lang="fr" data-matiere="physique|chimie">`, feuilles de style et scripts dans l'ordre du §2, `SOM` pour la navigation, `COURS` (`assets/cours.js`) pour les cours, moteur de questions et d'exercices copié depuis `cinematique/modules/cin.js` puis renommé.
- Chaque module :
  - un cours (notion → exemple → « À toi », « Afficher tout le cours », « À retenir ») ;
  - une série de 10 questions notée sur 20 (fabriques aléatoires, diagnostics ciblés) ;
  - une fiche récapitulative.

  Un cours long se découpe en sous-modules de cours (a, b…), charte §4.
- Dernier module : **exercices du support papier, avec la même numérotation** (« Exercice 6 »). Chaque exercice est guidé par parties, avec la correction détaillée toujours disponible (« Voir la correction », 0 point). Les exercices supplémentaires ou de bac portent une lettre ou leur titre.
- Les ateliers, simulations ou outils demandés par le prompt du chapitre sont des pages de type `simulation` (icône ▸). Chaque simulation est suivie d'un bilan (« ✍ Complète ton cours ») et marquée faite à l'affichage du bilan ; un atelier d'entraînement est marqué fait quand sa liste de tâches est terminée.
- **Outils partagés entre chapitres** (moteur de dessin de molécules, etc.) : dans `assets/`, avec leur espace de noms, chargés par chaque application qui s'en sert. Le premier chapitre qui en a besoin les crée (voir `README.md`).
- Portail : ajoute l'application dans `APPS` de `index.html` (racine), `niv: ['spe']`, `titre` = nom de l'application, parmi les applications du même domaine, après les applications de Tle spécialité de numéro de chapitre plus petit. Déclare ses pages dans `AVANCEMENT` de `assets/avancement.js`. Ajoute un dessin d'en-tête dans `assets/hero.js` seulement si aucun dessin existant ne convient (liste en tête du fichier).
- Applications d'outils à citer en lien (« Revois… ») plutôt que de refaire leur contenu : `conversions/`, `puissances-10/`, `equations-en-physique/`, `proportionnalite/`, `lecture-graphique/`.
- Nouvelle clé `localStorage` (réglages d'un outil…) : préfixée par le dossier (`<dossier>-…`, charte §5).

## 4. Habitudes du professeur

- **Couleurs** : sur ses corrections et ses cours, il colore de la même couleur une partie de la molécule et la partie du nom qui lui correspond (chaîne principale, ramifications, numéros, groupe). Dans l'application, ces couleurs sont celles que fixe le prompt du chapitre (jamais le vert et le rouge du juste / faux).
- **Entourer** : il entoure le groupe caractéristique et écrit à côté son nom puis la famille entre parenthèses (« groupe carbonyle (aldéhydes) »). Les corrections de l'application font de même.
- **Calculs** (vu dans ses corrections de STI2D, même professeur ; vérifie dans les corrections du chapitre) : formule littérale, grandeur cherchée isolée, application numérique **avec les unités écrites**, résultat avec son unité et des chiffres significatifs raisonnables. Conversions dans une étape à part. Il montre souvent **deux méthodes** pour le même calcul (« OU ») : garde les deux quand le prompt le signale.

## 5. Maquettes à valider (quand le prompt du chapitre en demande)

Un outil nouveau et important (moteur de dessin, simulateur) se valide sur maquettes **avant** de développer l'application.

- **Étape 1 (première session)** :
  - maquettes **fonctionnelles** (on s'en sert vraiment, au doigt et à la souris) dans le dossier donné par le prompt du chapitre, avec les vraies feuilles de style du dépôt, ouvertes en `file://` ;
  - une page `index.html` qui présente les maquettes : ce qui les distingue, ce qu'il faut essayer, les questions posées au professeur ;
  - vérification à 1280 px et à 390 px (tactile émulé) avec Playwright ;
  - commit, push, compte rendu avec les chemins. Si l'outil `Artifact` est disponible, publie aussi la page d'index (fichiers joints par `files`) pour que le professeur essaie sur son téléphone.

  **Puis arrête-toi** : pas d'application avant la validation.
- **Étape 2 (session suivante)** : le professeur indique la maquette choisie et ses remarques. Reproduis-la fidèlement. Les maquettes restent dans `docs/` comme référence.

## 6. Avant de livrer

- Passe la liste du §10 de la charte (Playwright / Chromium à 1280 px et 390 px ; ne lance pas `playwright install`).
- Vérifie **chaque donnée des exercices** (valeur numérique, nom de molécule, formule) avec un petit script (scratchpad), pas de tête.
- Commits en français, clairs ; push sur la branche indiquée par la session. Pas de pull request sans demande.
- Compte rendu court :
  - ce qui est fait ;
  - les écarts avec le prompt et pourquoi ;
  - ce qui n'est pas testable (Safari iOS).
