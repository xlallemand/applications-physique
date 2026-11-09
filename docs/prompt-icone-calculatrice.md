# Prompt : icône calculatrice dans toutes les applications déjà écrites

À donner tel quel à une nouvelle session, sur le dépôt `xlallemand/applications-physique`.

---

## 1. Objectif

Dans **toutes les applications** du portail (tous niveaux), chaque champ de saisie dont la valeur se **calcule à la calculatrice** porte une petite **icône calculatrice**, placée juste après l'unité du champ. L'élève sait ainsi tout de suite qu'il doit sortir sa calculatrice.

La règle est déjà écrite dans `docs/charte-applications.md` (§7, « Icône calculatrice ») et appliquée dans `periode-frequence/` (application de référence pour cette règle).

## 2. À lire avant de commencer

1. `CLAUDE.md`, puis **en entier** `docs/charte-applications.md`.
2. `assets/theme.css`, fin du fichier : classe `.calc-icone` (icône dessinée par un masque SVG, couleur `--ink-2`, aucune image à ajouter). `theme.css` est chargé par toutes les pages : rien d'autre à charger.
3. Exemples dans `periode-frequence/modules/` :
   - `pf.js`, partie `nombre` : option `calc: true` → icône après l'unité ;
   - `oscillo.js`, champs `T = …` : `PF.CALC` après l'unité.

## 3. Le code de l'icône

```html
<span class="calc-icone" role="img" aria-label="À calculer à la calculatrice" title="À calculer à la calculatrice"></span>
```

Dans un moteur de questions, ajouter plutôt une option à la partie (par exemple `calc: true`) qui insère ce code après l'unité, pour ne pas le répéter dans chaque question.

## 4. Quand mettre l'icône

**Oui**, si le résultat n'est pas évident à obtenir de tête :
- inverse (f = 1 / T, T = 1 / f), quotient ou produit de nombres décimaux (m = ρ × V, v = d / Δt, c = n / V…) ;
- calculs avec des puissances de 10 non triviales, racines, logarithmes (pH), exponentielles, fonctions trigonométriques ;
- produit en croix dont le résultat n'est pas un nombre simple.

**Non**, si la valeur :
- se lit sur un graphique, une règle, un écran ou un tableau, ou se recopie de l'énoncé ;
- se compte (nombre de carreaux, de périodes, d'atomes…) ;
- se calcule de tête (conversion par une puissance de 10, différence de deux graduations, 8 × 0,5, 10 / 4…) ;
- est un choix (QCM), un mot, une formule ou un coefficient stœchiométrique.

En cas de doute, regarder les valeurs que l'application tire au hasard : si une seule d'entre elles demande la calculatrice, mettre l'icône.

## 5. Méthode

1. Lister les applications : `APPS` dans `index.html` (champ `dossier`).
2. Pour chacune, repérer les champs de saisie numériques : `grep -rn "type: 'nombre'\|type: 'sci'\|type: 'champs'\|inputmode=\"decimal\"" <dossier>/` (moteurs : `assets/cours.js`, `cinematique/modules/cin.js`, `ph/modules/ph.js`, `transport-electricite/modules/te.js`, moteurs propres à chaque application).
3. Si l'application utilise un moteur commun, ajouter l'option `calc` **une fois** dans le moteur (rendu après l'unité), puis la mettre sur les parties concernées.
4. Décider champ par champ avec le §4, sans toucher au contenu scientifique, aux diagnostics ni à la présentation du reste.
5. Ne modifier que l'ajout de l'icône.

## 6. Vérifications

Avec Playwright (Chromium déjà installé, ne pas relancer `playwright install`), à **1280 px** et **390 px** :

1. Sur une page de chaque application modifiée, l'icône est visible à côté des champs concernés, alignée avec l'unité, sans retour à la ligne disgracieux ni défilement horizontal.
2. Aucune erreur dans la console.
3. Thème sombre (si l'application le propose) : l'icône reste visible (`--ink-2`).

Compte rendu court : applications modifiées, champs qui ont reçu l'icône, champs volontairement laissés sans icône et pourquoi. Safari iOS n'est pas testable dans cet environnement : le dire.
