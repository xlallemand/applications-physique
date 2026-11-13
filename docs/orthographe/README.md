# Orthographe (3e, dictée du brevet) — base de connaissances

Dossier de travail de l'application `orthographe/` (étapes 2 à 4 de `docs/prompt-orthographe.md`).

| Fichier | Contenu |
|---|---|
| `donnees/regles.js` | **64 règles** classées (7 familles, 4 niveaux de priorité, prérequis, astuce, exemples tirés des dictées, fautes types) et **4 méthodes** (relecture en 4 passages, tests de remplacement, pendant la dictée, mémoriser un mot). |
| `donnees/dictees-brevet.js` | **22 dictées officielles complètes** (2016-2026) et **16 dictées aménagées officielles** (2022-2025) dont les **160 pièges** sont rattachés à une règle. |
| `validation.html` | Page de validation (ouvrir dans le navigateur). |
| `sources.md` | Toutes les sources consultées. |

## 1. Ce que dit l'institution

- **Format** : dictée de 20 min, notée sur 10 points, environ 600 signes (série générale) ; lecture préalable, dictée avec ponctuation et liaisons marquées, relecture sans ponctuation ; noms propres et mots rares écrits au tableau ; une ligne sur deux.
- **Barème** : aucun texte national publié ne fixe de retrait par faute. Le barème est donné aux correcteurs avec chaque sujet. Les sites de préparation citent le plus souvent −1 point par faute grammaticale (accord, conjugaison, homophone grammatical) et −0,5 par faute lexicale, d'accent ou de ponctuation : à considérer comme une **convention** à valider, pas comme une règle officielle.
- **Attendus de fin de 3e** (Eduscol) : chaînes d'accord dans le groupe nominal complexe (avec subordonnée relative), accord de l'adjectif et du participe passé en apposition, participe passé avec avoir quand le COD est un pronom relatif, accord du verbe dans les cas complexes, morphologie verbale (radical, marques de temps et de personne), temps simples et composés de l'indicatif, mots appris.
- **Repères de progression cycle 4** : 5e accord dans le GN, participe passé avec être, avec avoir (COD placé après) ; 4e GN complexe, participe passé avec avoir (COD placé avant, pronom personnel), cas complexes du verbe ; 3e relatives, apposition, COD pronom relatif.
- **Note DEPP n° 22.37 (2022)** : dans la même dictée donnée en CM2 depuis 1987, les erreurs ont presque doublé (10,7 → 19,4) ; **l'orthographe grammaticale (accord sujet-verbe, accords dans le GN, participe passé) reste la principale source d'erreurs**, les erreurs lexicales sont les moins fréquentes.

## 2. Analyse des dictées

### Pièges choisis par les concepteurs (dictées aménagées, 160 trous)

Dans la version aménagée, le candidat choisit pour chaque trou entre 2 ou 3 mots : chaque trou est donc un piège identifié officiellement.

| Famille | Pièges | Règles les plus visées |
|---|---:|---|
| Orthographe d'usage | 42 | homophones lexicaux (15), mots à mémoriser (6), doubles consonnes (5), son [s] (4) |
| Homophones grammaticaux | 36 | ce/se (7), ces/ses/c'est/s'est (5), et/est, la/là/l'a, mais/mes, tant/temps (3 chacun) |
| Terminaisons en [é], -i, -u | 29 | -é/-er/-ait/-ez (13), -er/-é (9), participe -i/-is/-it/-u (7) |
| Accord sujet-verbe | 26 | terminaison selon la personne (21) |
| Participe passé | 14 | employé seul (5), avec être (3), COD avant (3) |
| Groupe nominal | 8 | chaîne d'accord (4) |
| Conjugaison | 5 | passé simple (2) |

### Occurrences dans les 22 dictées complètes (comptage automatique, approximatif)

| Difficulté | Occurrences | Textes concernés |
|---|---:|---:|
| Pluriel dans le groupe nominal (après un déterminant pluriel) | 170 | 22/22 |
| Imparfait / conditionnel en -ais, -ait | 94 | 19/22 |
| Homophones et/est, a/à, la/là | 60 à 70 chacun | 20/22 |
| Participes passés en -é(e)(s) | 54 | 20/22 |
| Infinitifs en -er | 39 | 18/22 |
| ces/ses/c'est/s'est, ce/se | 29 et 26 | 12 à 14/22 |
| Verbes au pluriel en -aient / -ent | 18 + 14 | 11/22 et 7/22 |
| Participe passé après être / après avoir | 15 + 12 | 9/22 et 8/22 |
| Doubles consonnes / accents circonflexes | 227 / 50 mots | 22/22 |

### Conclusion : ordre d'importance

Le classement en 4 niveaux croise trois critères : **fréquence** dans les dictées (occasions de faute), **pièges officiels** visés, **erreurs réelles des élèves** (DEPP), et un quatrième, les **prérequis** (une règle n'est travaillée que lorsque celles dont elle dépend sont acquises).

1. **Socle (14 règles)** — pluriel des noms, chaîne d'accord du GN, terminaison du verbe selon la personne, -ent du pluriel, -er/-é, -é/-er/-ait/-ez, présent, imparfait, a/à, et/est, son/sont, on/ont, ou/où, mots invariables.
2. **Essentiel brevet (24)** — féminin, adjectif attribut, sujet inversé, pronom écran, participe en -i/-u, passé simple, auxiliaires, participe passé avec être / seul / avec avoir, ce/se, ces/ses/c'est/s'est, la/là/l'a, leur(s), mais/mes, peu/peut, accents, lettres muettes, son [s], m devant m/b/p, homophones lexicaux, traits d'union, majuscules…
3. **Approfondissement (20)** — participe passé avec COD placé avant, sujet « qui », imparfait/passé simple avec je, futur/conditionnel, impératif, subjonctif, participe présent, tout/tous, GN complexe, homophones plus rares, doubles consonnes, noms en -ée, adverbes en -ment…
4. **Expert (6)** — verbes pronominaux, sujets multiples et collectifs, couleurs et nombres, passé simple / subjonctif imparfait, quelque / quel que, près / prêt.

Les **38 règles marquées « essentielles »** (niveaux 1 et 2 surtout, plus le participe passé avec COD avant, attendu de fin de 3e) doivent être validées une par une.

## 3. Limites

- Le comptage automatique des occurrences est approximatif (repérage par terminaisons) : il sert à ordonner, pas à mesurer.
- Les sujets de la session 2018 (métropole) et une partie des sujets 2016-2021 des autres centres n'ont pas été trouvés en ligne.
- Le barème par faute n'est pas officiel (voir § 1).
