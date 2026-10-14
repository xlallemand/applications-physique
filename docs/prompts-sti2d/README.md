# Prompts des applications de Terminale STI2D

Un fichier par chapitre ; les instructions communes sont dans `00-commun.md`, lu par chaque prompt.

## Utilisation

1. Ouvre une session cloud sur `applications-physique`, avec le dépôt privé `xlallemand/Cours-TSTI2D` (sinon la session l'ajoute elle-même avec `add_repo`, comme le dit `00-commun.md`).
2. Écris seulement :
   > Lis `docs/prompts-sti2d/chapitre-NN.md` et exécute-le.

## Chapitres

| Chapitre | Fichier | Dossier de l'application | Modules particuliers |
|---|---|---|---|
| 1. Énergie et puissance | `chapitre-01.md` | `energie-puissance/` | activité STEP, aire sous P(t) |
| 2. Piles et accumulateurs | `chapitre-02.md` | `piles-accumulateurs/` | assemblage de cellules |
| 3. Puissance active | — | `puissance-active/` | déjà fait |
| 4. Transport de l'électricité | — | `transport-electricite/` | déjà fait |
| 5. Flux et transferts thermiques | `chapitre-05.md` | `transferts-thermiques/` | schéma de paroi en couches |
| 6. Principe fondamental de la dynamique | `chapitre-06.md` | `principe-dynamique/` | **bilan des forces** |
| 7. Théorème de l'énergie cinétique | `chapitre-07.md` | `energie-cinetique/` | **simulateur du travail d'une force** |
| 8. Mouvements de rotation | `chapitre-08.md` | `mouvements-rotation/` | bras de levier, point de fonctionnement |
| 9. Statique des fluides | `chapitre-09.md` | `statique-fluides/` | schéma point haut / point bas |
| 10. Énergie transportée par la lumière | `chapitre-10.md` | `energie-lumiere/` | caractéristique d'un panneau, niveaux d'énergie |
| 11. Changements d'état | `chapitre-11.md` | `changements-etat/` | **schéma des étapes** |
| 12. Radioactivité | `chapitre-12.md` | `radioactivite/` | **calcul de t comme pour le pH** (ln, eˣ dans `ph/modules/eq.js`) |
| 13. Énergie nucléaire | `chapitre-13.md` | `energie-nucleaire/` | tableau du défaut de masse |
| 14. Combustions | `chapitre-14.md` | `combustions/` | **mise à la charte** (exercices papier, module 6) |
| 15. Oxydoréduction | `chapitre-15.md` | `oxydoreduction-STI2D/` (transformée) | **Oxydoréduction et Pile intégrées**, méthode du chapitre 14 |
| 16. Acides et bases | `chapitre-16.md` | `acides-bases/` | règle du gamma, **méthode du chapitre 14** |
| 17. Spectre d'un signal périodique | `chapitre-17.md` | `spectre-signal/` | **synthèse de Fourier** (`assets/fourier.js`) |
| 18. Ondes sonores | `chapitre-18.md` | `ondes-sonores/` | **simulateur musical** (même moteur, avec le son) |
| 19. Ondes électromagnétiques | `chapitre-19.md` | `ondes-electromagnetiques/` | **simulateur AM / FM** |

## Ordre conseillé

Certains outils sont partagés : le premier chapitre qui en a besoin les crée.

- **17 avant 18** : `assets/fourier.js`, dessin d'en-tête `spectre`.
- **15 avant 16** : `assets/schema-methode.js`.

Les autres chapitres sont indépendants.
