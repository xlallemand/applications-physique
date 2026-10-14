# Chapitre 15 : Oxydoréduction (piles et accumulateurs) (prompt de génération)

Lis d'abord `docs/prompts-sti2d/00-commun.md` (sources, charte, structure, livraison).

## Application : on part de l'existant

Deux modules du chapitre sont déjà développés :

- `oxydoreduction-STI2D/` : application d'une seule page (`spa: true`). Module 1 « Oxydants et réducteurs » (cours `COURS` + entraînement), module 2 « Écrire les réactions » (20 questions, l'aide diminue). Elle charge **Tailwind** (CDN), hors charte.
- `pile/` : « Schéma d'une pile », un écran sans module. Schéma à compléter par glisser-déposer (polarités, e⁻, I, ions du pont salin, anode / cathode, demi-équations, équation de fonctionnement), série de questions. Elle est aussi utilisée en Tle spécialité. Elle charge Tailwind et a des boutons `btn-blue` / `btn-orange` / `btn-green`, hors charte.

**Décision** : l'application du chapitre 15 est **`oxydoreduction-STI2D/`, transformée en application à pages séparées** (`index.html` + `modules/`, nom « Chapitre 15 : Oxydoréduction (piles et accumulateurs) », préfixe `ox`, `data-matiere="chimie"`). Garde le nom du dossier : il est cité dans le portail.

- **Les deux modules existants y deviennent les modules 1 et 2, sans perte de contenu ni de fonctionnalité** : cours, entraînement, 20 questions à aide décroissante. Seule la mise en page passe à la charte : cartes `er-card`, boutons pilule, plus de Tailwind dans ces pages.
- **Le schéma de la pile devient le module 5.** Sors le moteur de `pile/index.html` dans `pile/pile.js` (+ `pile/pile.css`), sans changer son comportement. `pile/index.html` et la page du module 5 le chargent tous les deux : une seule source, l'application `pile/` reste en place pour la spécialité.
  - Le moteur doit pouvoir monter dans une zone donnée ; vérifie qu'il marche encore seul.
  - Passe ses boutons aux classes de la charte (`btn-primary` / `btn-secondary` / `btn-small` : jamais de bouton coloré, §3), pour les deux usages.
- **Anciennes adresses** : redirige `oxydoreduction-STI2D/index.html#course`, `#training`, `#reactions`, `#fiche` vers les nouvelles pages (petit script sur l'accueil), pour garder les favoris des élèves. L'ancienne progression (`localStorage`) peut être perdue : dis-le dans le compte rendu.
- **Portail** :
  - titre « Chapitre 15 : Oxydoréduction (piles et accumulateurs) » (nom de l'application, voir `00-commun.md` §3) ;
  - desc « Oxydants, réducteurs, équations, quantités de matière, piles : schéma et capacité. » ;
  - `niv: ['sti']` ;
  - dessin d'en-tête `formules:redox`.

## Sources (`TSTI2D/15- Oxydoreduction/`)

| Fichier | Contenu | À lire |
|---|---|---|
| `Chap15-Cours_complete.pdf` (2 p.) | Cours complété à la main | Non : résumé ci-dessous. Page 2 si tu veux reprendre le schéma de la pile annoté |
| `Chap15-Exercices.pdf` (5 p.) | Ex. 1 à 11 (numérotation de la feuille) | `pdftotext -layout` suffit pour les énoncés ; image seulement pour le schéma de l'ex. 8 (page 3) |
| `Chap15-Correction_Exercices.pdf` (5 p.) | Corrections (manuscrites pour 1 à 9, tapées pour 10 et 11) | Oui |

## Contenu du cours

### Module 1 : Oxydants et réducteurs (existant)

- **Définitions** :
  - un **oxydant** peut **capter** des électrons, un **réducteur** peut en **céder** ;
  - demi-équation d'un couple ox/red : **ox + e⁻ = red** (« à retenir »), la réduction dans le sens →, l'oxydation dans le sens ← ;
  - oxydation : red → ox + e⁻ ; réduction : ox + e⁻ → red.
- **À faire** : vérifier que le cours existant dit tout cela ; ajouter seulement ce qui manque.

### Module 2 : Écrire une réaction d'oxydoréduction (existant)

- **Qui réagit avec qui** : l'oxydant d'un couple réagit avec le réducteur de l'autre. Les couples ox<sub>1</sub>/red<sub>1</sub> et ox<sub>2</sub>/red<sub>2</sub> donnent ox<sub>1</sub> + red<sub>2</sub> → ox<sub>2</sub> + red<sub>1</sub>, ou red<sub>1</sub> + ox<sub>2</sub> → ox<sub>1</sub> + red<sub>2</sub>.
  
  Note manuscrite : entourer les deux réactifs dans les deux couples écrits l'un sous l'autre.
- **Méthode** (sujets de bac : demi-équations données) :
  1. écrire chaque demi-équation dans le sens où ses réactifs sont à gauche ;
  2. multiplier pour avoir le même nombre d'électrons ;
  3. additionner (les électrons disparaissent) ;
  4. simplifier H⁺ et H<sub>2</sub>O s'il y en a des deux côtés (ex. 7).
- **Exemple du cours** : Cu²⁺ et Fe²⁺ (couples Cu²⁺/Cu, Fe³⁺/Fe²⁺), donc Cu²⁺ + 2 Fe²⁺ → Cu + 2 Fe³⁺.
- Le module existant couvre ce point : n'ajoute que ce qui manque (cas avec H⁺ et H<sub>2</sub>O, dismutation).

### Module 3 : Quantités de matière consommées ou produites (même méthode que le chapitre 14)

- **Méthode de `combustions/` (module 1 et `CO.schema` dans `co.js`)**, à reprendre telle quelle :
  - l'équation écrite en tête, **une colonne par espèce** ;
  - sous l'espèce connue, la donnée (m, ou c et V) puis n ;
  - la ligne des **relations stœchiométriques** n<sub>A</sub>/a = n<sub>B</sub>/b = … ;
  - sous l'espèce cherchée, n puis la grandeur demandée (m = n × M, ou c = n / V) ;
  - flèches pleines pour le chemin de calcul, en pointillés pour les autres colonnes.
  
  L'outil `CO.schema` est propre aux combustions. Écris une version générale `schemaMethode({ especes: [{ f, coef }], depart, cible })`, même rendu, mêmes classes renommées, dans **`assets/schema-methode.js` + `assets/schema-methode.css`**, pour qu'elle serve aussi au chapitre 16. Ne touche pas à `combustions/`.
- **Formules** :
  - n = m / M ;
  - n = c × V ;
  - c = n / V ;
  - m = n × M (M d'un ion ≈ M de l'atome).
- **Électrons** (chaîne pile → électricité) : la demi-équation relie n(e⁻) à n(espèce), par exemple n(e⁻) = 2 n(H<sub>2</sub>) ; Q = n(e⁻) × F (F = 96 500 C·mol⁻¹). Le schéma accepte une colonne e⁻ issue de la demi-équation.
- **Outil schéma (obligatoire)**. L'élève :
  - place les données de l'énoncé sous les bonnes colonnes (glisser-déposer) ;
  - choisit la relation stœchiométrique utile ;
  - calcule chaque étape (parties successives).
  
  C'est la première partie de chaque exercice de calcul (ex. 1 à 4, 9.6, 10, 11).
- **Série** : n consommé ou produit, masse, concentration, avec des couples variés (Cu²⁺/Cu, Fe²⁺/Fe, Fe³⁺/Fe²⁺, Ag⁺/Ag, Zn²⁺/Zn, Al³⁺/Al).
  
  Erreurs : coefficient oublié ou inversé (n<sub>Fe³⁺</sub> = 2 n<sub>Cu²⁺</sub> et non n<sub>Cu²⁺</sub> / 2), mL non convertis, M mal choisie.

### Module 4 : Piles, accumulateurs, capacité et énergie

- **Définitions** :
  - **pile** : convertit l'énergie chimique en énergie électrique ;
  - **batterie** (accumulateur) : rechargeable en inversant le sens de la réaction. Deux chaînes énergétiques : décharge (réactifs → énergie chimique → batterie → énergie électrique → appareil) et charge (chargeur → énergie électrique → batterie → énergie chimique → réactifs) ;
  - **pile à combustible** : un des réactifs est O<sub>2</sub>, elle produit H<sub>2</sub>O ;
  - **tension à vide** : tension aux bornes quand la pile ne débite pas.
- **Capacité** : Q = I × Δt, en A·h (A, h) **ou** en C (A, s), avec 1 C = 1 A × 1 s ; 1 A·h = 3600 C.
- **Énergie disponible** : E = Q × U = U × I × Δt = P × Δt (chaîne d'égalités du cours).
- **Lien avec le chapitre 2** : application `piles-accumulateurs/` si elle existe déjà, sinon pas de lien.
- **Série** : chaînes énergétiques à compléter, Q en A·h et en C, E en J et en Wh, durée de fonctionnement.

### Module 5 : Schéma de fonctionnement d'une pile (outil existant `pile/`)

**Cours avant l'outil** (nouveau, `COURS`) :

- **Moyens mnémotechniques** : réduction = **c**athode (consonne – consonne), **o**xydation = **a**node (voyelle – voyelle).
- **À la cathode**, ox<sub>1</sub> + e⁻ = red<sub>1</sub> (réduction, des e⁻ y arrivent) ; **à l'anode**, red<sub>2</sub> = ox<sub>2</sub> + e⁻ (oxydation, des e⁻ en partent). Équation de la pile : ox<sub>1</sub> + red<sub>2</sub> → ox<sub>2</sub> + red<sub>1</sub>, sans électrons.
- **Dans les fils**, des électrons circulent ; **dans le pont salin**, des ions : il ferme le circuit. « Attention, le sens des ions est à l'inverse de l'intuition. »
- **Placer I et e⁻**, deux méthodes :
  - **si on connaît l'électricité** (multimètre) : la borne COM est branchée sur le − ; on place + et − ; I va du + vers le − dans le circuit extérieur, les e⁻ du − vers le + ; on en déduit le sens des demi-équations ;
  - **si on connaît la chimie** (espèce consommée ou formée) : red<sub>2</sub> = ox<sub>2</sub> + e⁻, donc les e⁻ partent de cette électrode ; on en déduit le −, le + et le sens de I.
  
  Pont salin : les **anions** se déplacent dans le **même sens que les e⁻**, les **cations** dans le **même sens que I**.

**Puis l'outil `pile/`** (moteur partagé `pile/pile.js`) pour s'entraîner. L'exemple traité est l'ex. 8 (Zn/Cu).

## Exercices (numérotation de la feuille)

**Ex. 1** :
- Cu²⁺ + Fe → Cu + Fe²⁺ ;
- n(Fe²⁺) = n(Cu²⁺) = 2,0 mol.

**Ex. 2** :
- **l'énoncé dit « entre Fe et Cu²⁺ » mais la question (Cu consommé, Fe produit) et la correction traitent Cu + Fe²⁺ → Cu²⁺ + Fe : écris « entre Cu et Fe²⁺ »** ;
- n(Cu) = 3,5 / 64 ≈ 0,055 mol = n(Fe).

**Ex. 3** :
- Cu²⁺ + 2 Fe²⁺ → Cu + 2 Fe³⁺ ;
- n(Cu²⁺) = 0,25 × 30 × 10⁻³ = 7,5 × 10⁻³ mol ;
- n(Fe³⁺) = 1,5 × 10⁻² mol ;
- c = 0,50 mol·L⁻¹ ;
- m(Cu) = 0,48 g.

**Ex. 4** :
- Cu + 2 Fe³⁺ → Cu²⁺ + 2 Fe²⁺ ;
- n(Cu) = 3,0 × 10⁻² / 2 = 1,5 × 10⁻² mol ;
- m = 0,96 g.

**Ex. 5** : Cr<sub>2</sub>O<sub>7</sub>²⁻ + 14 H⁺ + 3 Fe → 2 Cr³⁺ + 7 H<sub>2</sub>O + 3 Fe²⁺.

**Ex. 6** : Ca + 2 H⁺ → Ca²⁺ + H<sub>2</sub>.

**Ex. 7** (dismutation) : 2 H<sub>2</sub>O<sub>2</sub> → 2 H<sub>2</sub>O + O<sub>2</sub>, après simplification des H⁺.

**Ex. 8** (pile Zn/Cu, outil pile) :
- Zn au −, anode : Zn = Zn²⁺ + 2e⁻ (oxydation) ;
- Cu au +, cathode : Cu²⁺ + 2e⁻ = Cu (réduction) ;
- e⁻ de Zn vers Cu, I dans l'autre sens ;
- anions vers Zn, cations vers Cu ;
- équation : Zn + Cu²⁺ → Zn²⁺ + Cu.

**Ex. 9** (pile Cu/Ag) :
- le cuivre est consommé : Cu = Cu²⁺ + 2e⁻ (−, anode) ;
- Ag⁺ + e⁻ = Ag (+, cathode) ;
- équation : Cu + 2 Ag⁺ → Cu²⁺ + 2 Ag ;
- 0,5 g de Cu donne n = 7,87 × 10⁻³ mol, n(Ag) = 1,57 × 10⁻² mol, m ≈ 1,7 g.

**Ex. 10** (pile à combustible) :
1. 2 H<sub>2</sub> + O<sub>2</sub> → 2 H<sub>2</sub>O ;
2. eau, non polluante ;
3. électrons ;
4. H<sub>2</sub> est oxydé ;
5. O<sub>2</sub> est dans l'air ;
6. n(H<sub>2</sub>) = 500 / 2 = 250 mol ;
7. n(e⁻) = 500 mol ;
8. V = 250 × 24 = 6000 L = 6 m³, pas raisonnable ;
9. stockage sous pression.

**Ex. 11** (Ni-Cd, 1,6 A·h) :
1. 2 NiO(OH) + 2 H<sub>2</sub>O + Cd → 2 Ni(OH)<sub>2</sub> + Cd(OH)<sub>2</sub> ;
2. borne − : Cd ;
3. Q = 5760 C ;
4. n(e⁻) = 5760 / 96 500 ≈ 6,0 × 10⁻² mol ;
5. n(NiO(OH)) = n(e⁻), m ≈ 6,0 × 10⁻² × 91,7 ≈ 5,5 g ;
6. E = 5760 × 1,2 ≈ 6,9 × 10³ J.
