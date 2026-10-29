# Prompts des applications de Terminale spécialité

Un fichier par chapitre ; les instructions communes sont dans `00-commun.md`, lu par chaque prompt.

## Utilisation

1. Ouvre une session cloud sur `applications-physique`, avec le dépôt privé `xlallemand/Cours-TSpe` (sinon la session l'ajoute elle-même avec `add_repo`, comme le dit `00-commun.md`).
2. Écris seulement :
   > Lis `docs/prompts-tspe/chapitre-NN.md` et exécute-le.

   Pour un chapitre en deux étapes (maquettes à valider, `00-commun.md` §5) :
   > Lis `docs/prompts-tspe/chapitre-NN.md` et exécute l'étape 1.

   puis, dans une nouvelle session, après avoir essayé les maquettes :
   > Lis `docs/prompts-tspe/chapitre-NN.md` et exécute l'étape 2. Maquette retenue : … Remarques : …

## Chapitres

Le nom de chaque application est le titre du chapitre avec son numéro (celui de `competences.md`), le même dans l'application et dans le portail (`index.html`). Le dossier garde un nom court, sans numéro (`00-commun.md` §3).

| Nom de l'application | Fichier | Dossier | Modules particuliers |
|---|---|---|---|
| Chapitre 2 : Nomenclature | `chapitre-02.md` | `nomenclature/` | **en deux étapes** : maquettes puis application ; **moteur de dessin des molécules** `ORGA` (`assets/orga*.js`) |

Les autres chapitres s'ajoutent à ce tableau quand leur cours est dans `Cours-TSpe` : un prompt par chapitre, sur le plan de `chapitre-02.md`.

## Outils partagés

Le premier chapitre qui a besoin d'un outil le crée dans `assets/` ; les suivants le réutilisent.

- `assets/orga.js`, `assets/orga-dessin.js`, `assets/orga.css` (espace de noms `ORGA`) : molécules organiques (trois écritures, éditeur, groupes caractéristiques, nomenclature). Créé par le **chapitre 2**, à faire avant tout chapitre qui dessine des molécules (spectroscopie, acides et bases, titrages).
