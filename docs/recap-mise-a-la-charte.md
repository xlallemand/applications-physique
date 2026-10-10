# Mise à la charte des applications : récapitulatif

Branche : `claude/zen-babbage-9t2h94`. Références non modifiées : `cinematique/` et `transport-electricite/`.

## Commun à toutes les applications

- **Charte** (`docs/charte-applications.md`) mise à jour avec le module de sommaire commun (§2, §4, §5, §11, §12).
- **Nouveau module de navigation partagé** : `assets/sommaire.js` + `assets/sommaire.css` (même présentation que Cinématique : sommaire à gauche sur ordinateur, bandeau « où suis-je » sur téléphone, accueil en lignes dépliables, carte « Reprendre », compteurs `n/m`, notes `/20`, progression dans `localStorage` en `try/catch`). Chaque application déclare seulement son `PLAN`. Il gère aussi les applications en une seule page (pages = ancres `#…`, retour arrière du navigateur correct).
- **Menu burger (`assets/nav.js`) retiré partout** ; le fichier, devenu inutile, est supprimé.
- **Accueil** : en-tête illustré conservé, lien « ← Toutes les applications » vers le portail.
- **Fiches récapitulatives** : créées uniquement pour les modules qui ont un cours ; lien vers la fiche ajouté en fin de cours.
- **Progression** : cours terminé (ou ouvert, pour les cours d'une seule page) = ✓ ; séries et entraînements = meilleure note sur 20.

## Par application

| Application | Modifications |
|---|---|
| **pH** | Menu remplacé ; accueil en lignes ; **fiches 1 et 2 créées** ; bouton « Afficher tout le cours » ajouté aux cours 1 et 2 (démonstrations et éditeurs compris) ; progression. |
| **Puissance active** | Menu remplacé ; accueil en lignes ; **fiches 1 à 4 créées** ; « Afficher tout le cours » dans les cours 3 et 4 ; activités 1 et 2 marquées faites à l'affichage du bilan ; colonnes collantes recalées. |
| **Avancement d'une réaction** | Menu remplacé ; accueil en lignes ; **fiches 1, 2, 3, 5 et 7 créées** (pas de fiche pour les entraînements 4 et 6) ; meilleure note des entraînements ; barre de simulation recalée. |
| **Combustions** | Menu remplacé ; accueil en lignes ; **fiches 1 à 5 créées** (pas de fiche pour l'exemple pas à pas 6 ni les exercices complets 7) ; progression. |
| **Équilibrer une réaction** | Menu remplacé ; accueil en lignes ; **fiches 1 et 2 créées** (pas de fiche pour les entraînements 3 et 4) ; bandeau « Revenir au module 1 » recalé. |
| **Lecture graphique** | Menu remplacé (plan dans `modules/plan.js`, `lgtools.js` étant partagé) ; accueil en lignes ; **fiche 1 créée** ; note sur 20 en fin d'entraînement. |
| **Proportionnalité** | Menu remplacé ; les 9 pages regroupées en **3 modules** (cours, vérification, entraînement) comme sur l'ancien accueil, badges renumérotés ; accueil réécrit en lignes ; **fiches 1 à 3 créées** ; note sur 20. |
| **Spectres et étoiles** | Menu remplacé ; accueil en lignes ; meilleure note des séries. Pas de cours → pas de fiche. |
| **Équations en physique** | Menu remplacé ; les 9 pages regroupées en **4 modules** (méthode, exemple, entraînement) comme sur l'ancien accueil, badges et liens de suite renumérotés ; accueil réécrit en lignes ; **fiches 1 à 4 créées** ; note sur 20. |
| **Équations en physique (avec aide)** | Mêmes modifications ; **fiches 1 à 4 créées**. |
| **Puissances de 10** (une page) | Menu remplacé par le sommaire (pages en ancres) ; accueil en lignes ; **fiches 1 à 3 créées** (pas de fiche pour le module 4, sans cours) ; progression. |
| **Fractions** (une page) | Idem ; **fiches 1 à 4 créées** (pas de fiche pour le module 5). |
| **Oxydoréduction** (une page) | Menu remplacé ; 2 modules (cours + entraînement ; écrire les réactions) ; accueil en lignes ; **fiche du module 1 créée** ; progression. |
| **Conversions** (une page) | Menu remplacé ; les 11 écrans regroupés en **4 modules** (préfixes et méthode ; 4 niveaux d'entraînement ; carré et cube ; unités composées), étiquettes renumérotées ; accueil en lignes ; **fiches 1, 3 et 4 créées** ; progression. |
| **Équations du 1er degré** (une page) | Menu remplacé (modules en ancres, « Ma progression » conservée) ; accueil en lignes, points clés conservés ; meilleures notes reprises. Pas de cours → pas de fiche. |
| **Désintégration radioactive** | Menu burger remplacé par le bandeau vers le portail (un seul écran, pas de cours → pas de sommaire ni de fiche). |
| **Schéma d'une pile** | Idem. |

## Cours réécrits au format « notion → exemple → À toi »

**Moteur commun** `assets/cours.js` + `assets/cours.css` (objet `COURS`) : cours par étapes, encadré `.cle`, exemple traité, « À toi » (questions sans points, diagnostic ciblé de chaque erreur, « Continuer → » une fois réussi), bouton « Afficher tout le cours », « À retenir », cours marqué fait à la dernière étape. Les outils interactifs des applications (simulations, glisser-déposer, équations à équilibrer, règle…) deviennent des questions « À toi » et fonctionnent en plusieurs exemplaires quand tout le cours est affiché.

| Application | Cours réécrits | À savoir |
|---|---|---|
| **Combustions** | Modules 1 à 5 | Cours séparés des séries : nouvelles pages `module_2_cours` à `module_5_cours` ; `module_2` devient l'entraînement noté du module 2. L'ancien aiguillage du module 2 (test de départ qui sautait le rappel) est remplacé par des étapes de rappel et des liens vers « Équilibrer une réaction ». |
| **Avancement d'une réaction** | Modules 1, 2, 3, 5, 7 | L'entraînement de fin du module 7 est sur sa propre page (`module_7_entrainement`). Trois exercices guidés deviennent des exemples rédigés. |
| **Équilibrer une réaction** | Modules 1 et 2 | Le lien « Du mal à compter les atomes ? » ramène toujours au même endroit du cours. Réactions réglées en direct : « Afficher la réponse » proposé tout de suite. |
| **Lecture graphique** | Module 1 | La partie « mesurer à la règle » passe en étape 2 (avant la méthode) pour que les « À toi » suivants se fassent à la règle. |
| **Proportionnalité** | Cours des 3 modules | Tailwind retiré de ces pages. Phrase corrigée dans l'exemple du devoir sur 36. |
| **Équations en physique** (avec et sans aide) | Méthode des 4 modules | Toutes les manipulations gardées, dans l'ordre ; exemple avant / après ajouté pour chaque règle ; Tailwind retiré de ces pages. Badge « MODULE N · MÉTHODE » gardé (libellé du sommaire). |
| **Puissances de 10** | Cours 1 à 3 | Phrase fausse corrigée (« 10<sup>−n</sup> = 0,00…01 avec n zéros après la virgule »). |
| **Fractions** | Cours 1 à 4 | Étape « fractions égales » ajoutée en tête du cours 4. |
| **Oxydoréduction** | Cours du module 1 | Le cours n'est plus marqué fait à l'ouverture, mais à « À retenir ». |
| **Conversions** | Cours des modules 1, 3, 4 | Petites questions d'origine gardées, questions tirées au hasard en plus. |

Dans les cours, les saisies passent par les champs du moteur (bouton ±) au lieu du pavé numérique, qui reste dans les entraînements.

Corrigé ensuite dans Combustions : la réaction du test « équilibrer » (Al<sub>4</sub>O<sub>3</sub>, qui n'existe pas, remplacé par 2 Al<sub>2</sub>O<sub>3</sub> + 3 C → 4 Al + 3 CO<sub>2</sub>) et les élisions des séries et exercices (« de l'éthanol », « d'octane »). Dans Équilibrer une réaction, « Afficher la réponse » est proposé tout de suite sur les réactions réglées en direct. La charte décrit le moteur de cours commun (§2, §4, §6, §7, §11, §12).

## Non fait (à décider)

- Tailwind (CDN) toujours utilisé dans les pages de vérification, d'exemple et d'entraînement de Proportionnalité et d'Équations en physique, et dans les applications en une page (hors contenu des cours) ; Chart.js (CDN) dans Désintégration radioactive.
- Vérifié avec Playwright/Chromium à 1280 et 390 px (pages, liens, console, débordement, sommaire, ancres, notes). Safari iOS non testable ici ; Tailwind et Chart.js non chargés dans l'environnement de test (sans accès réseau à ces CDN).
