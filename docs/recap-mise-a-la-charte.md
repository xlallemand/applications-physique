# Mise à la charte des applications : récapitulatif

Branche : `claude/zen-babbage-9t2h94`. Références non modifiées : `cinematique/` et `transport-electricite/`.

## Commun à toutes les applications

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

## Non fait (à décider)

- Cours non réécrits en « notion → exemple → À toi » quand ils n'utilisent pas déjà ce moteur (avancement, combustions, équilibrer, lecture graphique, proportionnalité, équations, applications en une page) : refonte du contenu.
- Tailwind (CDN) toujours utilisé dans les pages de Proportionnalité, Équations en physique et les applications en une page ; Chart.js (CDN) dans Désintégration radioactive.
- La charte (`docs/charte-applications.md`) ne mentionne pas encore `assets/sommaire.js`.
- Vérifié avec Playwright/Chromium à 1280 et 390 px (pages, liens, console, débordement, sommaire, ancres, notes). Safari iOS non testable ici ; Tailwind et Chart.js non chargés dans l'environnement de test (sans accès réseau à ces CDN).
