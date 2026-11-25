# Prompts des applications de Terminale spécialité

Un fichier par chapitre (`chapitre-NN.md`, NN = numéro du dossier du cours dans `Cours-TSpe`) et un fichier par application annexe ou outil commun. Les instructions communes, les outils partagés et **l'avancement** sont dans `00-commun.md`, lu par chaque prompt.

## Utilisation

1. Ouvre une session cloud sur `applications-physique`, avec le dépôt privé `xlallemand/Cours-TSpe` (sinon la session l'ajoute elle-même avec `add_repo`, comme le dit `00-commun.md`).
2. Écris seulement :
   > Lis `docs/prompts-tspe/chapitre-NN.md` et exécute-le.

   Pour un chapitre en deux étapes (maquettes à valider, `00-commun.md` §8 : chapitres 12 et 15) :
   > Lis `docs/prompts-tspe/chapitre-NN.md` et exécute l'étape 1.

   puis, dans une nouvelle session, après avoir essayé les maquettes :
   > Lis `docs/prompts-tspe/chapitre-NN.md` et exécute l'étape 2. Maquette retenue : … Remarques : …
3. Une session par prompt. La session travaille et pousse sur la branche `TSpe`, puis met à jour l'avancement (`00-commun.md` §10).

## Ordre

`outils-communs.md` d'abord. Puis les chapitres dans l'ordre ; une application annexe se fait avant le chapitre qui la cite :

| Prompt annexe | Avant |
|---|---|
| `outils-communs.md` (éditeur d'équations partagé, pages externes ↗) | tous (en premier) |
| `bilan-forces.md` | 07 |
| `travail-force.md` | 09 |
| `decroissance-radioactive.md` | 16 |
| `gaz-parfait.md` | 17 |
| `modele-oeil.md` | 19 |

Chapitres déjà faits : 2 (Nomenclature, avec `chapitre-02.md`) et 5 (Cinématique, sans prompt). Il manque dans le dépôt des cours l'énoncé des exercices du chapitre 18 (`18- Equilibre chimique, pile/Chap18-Exercices_equilibre.pdf`, supprimé) et celui du chapitre 10 (seule la correction est présente) : les prompts disent quoi faire en leur absence.
