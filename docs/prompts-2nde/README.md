# Prompts des applications de 2nde

Un fichier par application, numéroté dans l'ordre de développement conseillé ; les instructions communes sont dans `00-commun.md`, lu par chaque prompt. Ces prompts découlent de la liste validée par l'enseignant (`liste-applications.html`, version 1) et de ses retours : A08 (la mole), A09 (forces) et A15 (le son) sont supprimées ; A17 (dispersion) devient le module 5 de la réfraction.

## Utilisation

1. Ouvre une session cloud sur `applications-physique`, avec le dépôt privé `xlallemand/Cours-2nde` (sinon la session l'ajoute elle-même avec `add_repo`, comme le dit `00-commun.md`).
2. Écris seulement :
   > Lis `docs/prompts-2nde/NN-<dossier>.md` et exécute-le.
3. Une session par application. La session travaille et pousse sur la branche `2nde`.

## Applications

| N° | Nom de l'application | Fichier | Dossier | Modules particuliers | Outils |
|---|---|---|---|---|---|
| A11 | Période et fréquence d'un signal | `01-periode-frequence.md` | `periode-frequence/` | une période puis plusieurs, écran d'oscilloscope | crée `BULLE` ; `LG` |
| A12 + A17 | Réfraction et loi de Snell-Descartes | `02-refraction.md` | `refraction/` | placer normale et angles, simulateur, **dispersion par un prisme** (module 5) | **crée `OPT`** ; `SP.rgb` |
| A13 | Image par une lentille convergente | `03-lentilles.md` | `lentilles/` | rayons particuliers, banc d'optique (10 δ), œil | étend `OPT` |
| A02 | Atome et ions | `04-atome-ions.md` | `atome-ions/` | cercles et cases remplis ensemble, former un ion, composés ioniques | **crée `ATOME`** |
| A03 | Classification périodique | `05-classification-periodique.md` | `classification-periodique/` | Z = 1 à 20, ions et liaisons par le tableau | `ATOME` |
| A04 | Schémas de Lewis | `06-lewis.md` | `lewis/` | relier les liaisons, vérifier, compléter | étend `ORGA` ; `ATOME` |
| A01 | Chromatographie sur couche mince | `07-chromatographie.md` | `chromatographie/` | animation (espèces fictives), conclusions à piocher | **crée `CCM`** |
| A14 | Réaliser un montage électrique | `08-montage-electrique.md` | `montage-electrique/` | méthode de la boucle principale, table réaliste et schéma | **crée `MONTAGE` et `ETAPES`** |
| A16 | Lois de l'électricité et capteurs | `09-lois-electricite.md` | `lois-electricite/` | nœuds, mailles, loi d'Ohm, thermistance et photorésistance | `MONTAGE` ; `LG` |
| A05 | Dissolution, dilution et échelle de teinte | `10-solutions.md` | `solutions/` | gestes des fiches méthode dans l'ordre, Fe<sup>3+</sup> et thiocyanate | **crée `PAILLASSE`** ; `ETAPES` |
| A06 | Identifier une espèce chimique | `11-identifier-especes.md` | `identifier-especes/` | masse volumique, palier, tests des gaz et des ions | `PAILLASSE`, `ETAPES` ; `LG` |
| A07 | Synthèse et montage à reflux | `12-synthese.md` | `synthese/` | acétate d'isoamyle, ampoule à décanter, CCM | `PAILLASSE`, `ETAPES`, `CCM` |
| A10 | Décrire un mouvement | `13-mouvement.md` | `mouvement/` | référentiels animés, pointage simplifié, vecteur vitesse | `VEC` ; règle de `LG` |

Déjà faites pour la 2nde (ne pas refaire) : `spectres-etoiles/`, `equilibrer-reactions/`, `avancement-reaction/` (modules 1 à 4), et les outils mathématiques `lecture-graphique/`, `conversions/`, `puissances-10/`, `proportionnalite/`, `equations-en-physique/`, `equations-en-physique-avec-aide/`.

## Ordre conseillé

Les outils partagés sont créés par le premier prompt qui en a besoin (`00-commun.md` §8) ; suis la numérotation, ou au moins ces dépendances :

- **01** d'abord : il crée `BULLE` et valide la façon de travailler.
- **02 avant 03** : `OPT` (rayons lumineux), dessin d'en-tête `rayons`.
- **04 avant 05 et 06** : `ATOME`, dessin d'en-tête `atome`.
- **07 avant 12** : `CCM`.
- **08 avant 09, 10, 11 et 12** : `MONTAGE` (09) et `ETAPES` (10, 11, 12), dessin d'en-tête `circuit`.
- **10 avant 11 et 12** : `PAILLASSE`, dessin d'en-tête `verrerie`.
- **13** est indépendant.

Si un prompt est lancé avant celui qui crée son outil, il le crée lui-même comme le décrit le prompt créateur (chaque prompt le rappelle dans sa section « Prérequis »).
