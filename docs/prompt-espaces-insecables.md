# Prompt : espaces insécables dans toutes les applications

À exécuter sur le dépôt `applications-physique`. Lis d'abord `CLAUDE.md` et la charte (`docs/charte-applications.md`, §7 « Espaces insécables » et §10).

## 1. Objectif

Dans **tous les textes affichés** de **toutes les applications**, mettre une espace insécable (U+00A0) :
- avant `:` `;` `?` `!` ;
- à l'intérieur des guillemets : `« texte »`.

Cela concerne aussi les textes produits par JavaScript (consignes, messages d'erreur, corrections, bilans), les attributs lus à l'écran ou au survol (`title`, `aria-label`, `placeholder`, `alt`) et les textes des SVG.

Ne rien changer d'autre : ni le contenu, ni la présentation, ni le code.

## 2. Outils

- `python3 docs/outils/typo.py DOSSIER` : signale les espaces à corriger dans les sources.
- `python3 docs/outils/typo.py --corriger DOSSIER` : les corrige.
  - Fichiers `.html` : il corrige les nœuds texte, les attributs `title`, `aria-label`, `alt`, `placeholder` et `data-aide`, et traite les `<script>` en ligne comme du JavaScript.
  - Fichiers `.js` : il ne corrige que le contenu des chaînes `'…'`, `"…"` et `` `…` ``.
  - Il ne touche jamais au code (`a ? b : c`, objets, `${…}`), ni aux commentaires, ni aux expressions régulières.
  - Les lignes `?` signalent une ponctuation collée au mot (`Attention:`) : elles sont à corriger à la main.
- `node docs/outils/verif-typo.js DOSSIER` : ouvre chaque page dans Chromium et contrôle les textes affichés au chargement.
- La constante `SURVEILLANCE` du même fichier s'injecte dans un test Playwright pour contrôler aussi les messages qui n'apparaissent qu'après une réponse :

```js
const { SURVEILLANCE, releve } = require('/home/user/applications-physique/docs/outils/verif-typo.js');
await contexte.addInitScript(SURVEILLANCE);
// … parcours de la page …
console.log(await releve(page)); // [] si tout est correct
```

## 3. Méthode

1. Lister les applications : `APPS` dans `index.html` (champ `dossier`). Traiter aussi le portail (`index.html`, `revisions.html`) et les modules communs (`assets/*.js`), ainsi que les moteurs partagés (par exemple `cinematique/modules/cin.js`, `lecture-graphique/modules/lgtools.js`, `equilibrer-reactions/modules/`).
   - `periode-frequence/`, `lecture-graphique/modules/lgtools.js` et `assets/sommaire.js` sont déjà corrigés : ne les retraiter que si `typo.py` y signale encore quelque chose.
2. Travailler **application par application**, avec un commit par application (ou par petit groupe), pour qu'une erreur reste facile à retrouver.
3. Pour chaque dossier :
   1. `python3 docs/outils/typo.py DOSSIER` pour voir l'ampleur.
   2. `python3 docs/outils/typo.py --corriger DOSSIER`.
   3. **Relire le diff** (`git diff DOSSIER`), en particulier dans les `.js`. Annuler toute modification d'une chaîne qui n'est pas un texte affiché. Exemples :
      - chaîne comparée à une saisie de l'élève ou à une autre chaîne (`=== 'Oui : …'`) : corriger les deux côtés ou aucun ;
      - chaîne passée à `new RegExp(…)` ou à `querySelector(…)` ;
      - clé d'objet, identifiant, nom de classe, code CSS dans une chaîne (`'(hover: hover)'`) ;
      - réponse attendue d'un exercice, si le moteur compare des textes.
   4. Corriger à la main les cas signalés `?` (ponctuation collée) qui sont bien du texte.
   5. Chercher les textes hors `.html`/`.js` que l'outil ne lit pas (`.json`, `content:` dans les `.css`, données de flashcards…) : `grep -rn " [:;?!]" DOSSIER --include=*.json --include=*.css`. Corriger ceux qui s'affichent.
4. Dans une chaîne JavaScript, le caractère U+00A0 lui-même convient partout. `&nbsp;` ne marche que dans du HTML (`innerHTML`), jamais dans `textContent` ni dans un texte SVG créé par `createTextNode`.
5. Les tests ou outils qui comparent des textes avec des espaces ordinaires (par exemple `/Juste !/`) doivent accepter les deux : `\s` en JavaScript reconnaît U+00A0.

## 4. Vérifications

Avec Playwright (Chromium déjà installé, ne pas relancer `playwright install`) :

1. `python3 docs/outils/typo.py DOSSIER` ne signale plus rien pour chaque application traitée.
2. `node docs/outils/verif-typo.js DOSSIER` affiche « aucune espace insécable manquante ».
3. Pour chaque application, parcourir au moins un cours et une série en faisant des erreurs volontaires, avec `SURVEILLANCE` injectée : `releve(page)` est vide. Sinon, retrouver le texte dans les sources et le corriger.
4. Aucune erreur dans la console. À 1280 px et 390 px, pas de défilement horizontal nouveau : une espace insécable peut allonger une ligne qui ne se coupe plus.
5. Le fonctionnement est inchangé : réponses justes acceptées, diagnostics affichés, navigation et progression.

Compte rendu court :
- applications traitées et nombre d'espaces corrigées ;
- modifications annulées à la relecture et pourquoi ;
- cas restés sans correction, s'il y en a.

Safari iOS n'est pas testable dans cet environnement : le dire.
