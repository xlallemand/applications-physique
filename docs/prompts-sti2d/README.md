# Prompts des applications de Terminale STI2D

Un fichier par chapitre ; les instructions communes sont dans `00-commun.md`, lu par chaque prompt.

## Utilisation

1. Ouvre une session cloud sur `applications-physique`, avec le dépôt privé `xlallemand/Cours-TSTI2D` (sinon la session l'ajoute elle-même avec `add_repo`, comme le dit `00-commun.md`).
2. Écris seulement :
   > Lis `docs/prompts-sti2d/chapitre-NN.md` et exécute-le.

## Chapitres

Le nom de chaque application est le titre du chapitre avec son numéro, le même dans l'application et dans le portail (`index.html`). Le dossier garde un nom court, sans numéro (`00-commun.md` §3).

| Nom de l'application | Fichier | Dossier | Modules particuliers |
|---|---|---|---|
| Chapitre 1 : Énergie et puissance | `chapitre-01.md` | `energie-puissance/` | activité STEP, aire sous P(t) |
| Chapitre 2 : Piles et accumulateurs | `chapitre-02.md` | `piles-accumulateurs/` | assemblage de cellules |
| Chapitre 3 : Puissances active et apparente | — | `puissance-active/` | déjà fait : nom à mettre à jour |
| Chapitre 4 : Transport et distribution de l'électricité | — | `transport-electricite/` | déjà fait : nom à mettre à jour |
| Chapitre 5 : Flux et transferts thermiques | `chapitre-05.md` | `transferts-thermiques/` | schéma de paroi en couches |
| Chapitre 6 : Principe fondamental de la dynamique | `chapitre-06.md` | `principe-dynamique/` | **bilan des forces** |
| Chapitre 7 : Théorème de l'énergie cinétique | `chapitre-07.md` | `energie-cinetique/` | **simulateur du travail d'une force** |
| Chapitre 8 : Mouvements de rotation | `chapitre-08.md` | `mouvements-rotation/` | bras de levier, point de fonctionnement |
| Chapitre 9 : Statique des fluides | `chapitre-09.md` | `statique-fluides/` | schéma point haut / point bas |
| Chapitre 10 : Énergie transportée par la lumière | `chapitre-10.md` | `energie-lumiere/` | caractéristique d'un panneau, niveaux d'énergie |
| Chapitre 11 : Changements d'état et transferts thermiques | `chapitre-11.md` | `changements-etat/` | **schéma des étapes** |
| Chapitre 12 : Radioactivité | `chapitre-12.md` | `radioactivite/` | **calcul de t comme pour le pH** (ln, eˣ dans `ph/modules/eq.js`) |
| Chapitre 13 : Énergie nucléaire | `chapitre-13.md` | `energie-nucleaire/` | tableau du défaut de masse |
| Chapitre 14 : Combustions | `chapitre-14.md` | `combustions/` | **mise à la charte** (exercices papier, module 6) |
| Chapitre 15 : Oxydoréduction (piles et accumulateurs) | `chapitre-15.md` | `oxydoreduction-STI2D/` (transformée) | **Oxydoréduction et Pile intégrées**, méthode du chapitre 14 |
| Chapitre 16 : Acides et bases | `chapitre-16.md` | `acides-bases/` | règle du gamma, **méthode du chapitre 14** |
| Chapitre 17 : Spectre d'un signal périodique | `chapitre-17.md` | `spectre-signal/` | **synthèse de Fourier** (`assets/fourier.js`) |
| Chapitre 18 : Ondes sonores | `chapitre-18.md` | `ondes-sonores/` | **simulateur musical** (même moteur, avec le son) |
| Chapitre 19 : Ondes électromagnétiques | `chapitre-19.md` | `ondes-electromagnetiques/` | **simulateur AM / FM** |

## Chapitres 3 et 4 (déjà faits)

Pour leur donner leur nom de chapitre, écris dans une session :
> Applique la règle « Nom de l'application » de `docs/prompts-sti2d/00-commun.md` §3 à `puissance-active/` (« Chapitre 3 : Puissances active et apparente ») et à `transport-electricite/` (« Chapitre 4 : Transport et distribution de l'électricité »). Ne change rien d'autre.

## Ordre conseillé

Certains outils sont partagés : le premier chapitre qui en a besoin les crée.

- **17 avant 18** : `assets/fourier.js`, dessin d'en-tête `spectre`.
- **15 avant 16** : `assets/schema-methode.js`.

Les autres chapitres sont indépendants.
