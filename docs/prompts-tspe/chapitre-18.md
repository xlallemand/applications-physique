# Équilibre chimique et piles (prompt de génération)

Lis d'abord `docs/prompts-tspe/00-commun.md` (sources, charte, structure, outils partagés, livraison).

## Application

- Dossier `equilibre-piles/`, nom « Équilibre chimique et piles », `data-matiere="chimie"`, préfixe `ep`, espace de noms `EP`.
- Portail : `desc: "Quotient de réaction, constante d'équilibre, sens d'évolution spontanée, oxydants et réducteurs usuels, piles et capacité."` ; `mots` : équilibre dynamique, Qr, quotient de réaction, constante d'équilibre, K, sens direct, sens indirect, critère d'évolution, activité, eau de Javel, dioxygène, dichlore, acide ascorbique, dihydrogène, bloc s, alcalins, alcalino-terreux, pile, demi-pile, pont salin, anode, cathode, oxydation, réduction, tension à vide, capacité, coulomb, Faraday, F = 96 500…
- Dessin d'en-tête : celui de `pile/` ou de `oxydoreduction-spe/`.
- Outils : `MOL`, outils de tableau d'avancement existants (`avancement-reaction/`, « Rappels de chimie »), `EQ` si utile, `BULLE`, `PLEIN` ; l'outil de schéma de pile de `pile/` (lis `pile/modules/pi.js`, `pile/pile.js`) s'il peut se monter en partie `perso`.

## Sources (`18- Equilibre chimique, pile/`)

| Fichier | Contenu | À lire |
|---|---|---|
| `Chap18-Cours_equilibre_complete.pdf` (9 p.) | Cours tapé, complété à la main | Non : résumé ci-dessous. Pages 4 à 7 (expérience initiale, schéma de la pile, exemples 1 et 2 corrigés), 9 (capacité, solution) pour les figures et les solutions |
| `Chap18-Exercices_equilibre.pdf` (2 p.) | Énoncés des ex. 1 à 10 (1 taux d'avancement final ; 2 exprimer un quotient de réaction ; 3 calculer une constante d'équilibre ; 4 avancement final à partir de K ; 5, 6 et 8 prévoir le sens d'évolution ; 7 exprimer une constante d'équilibre (dismutation de l'eau de Javel) ; 9 durée de fonctionnement d'une pile diiode-zinc ; 10 pile cuivre-aluminium) | Oui |
| `Chap18-Exercices_equilibre_correction.pdf` (7 p.) | Corrections manuscrites des ex. 1 à 10 | Oui |

Le TP « pile » n'est pas repris.

## Consignes du professeur

- **Inclure la définition hors programme du quotient de réaction** (avec les activités), **en indiquant que c'est hors programme** (bulle ⓘ « Hors programme. » ou encadré discret, comme le cours).
- **Lien vers `oxydoreduction-spe/`** pour travailler l'oxydoréduction en détail, avec un **bref rappel dans le cours** de ce chapitre (lien facultatif, type 1 : « Revois… »).
- **Lien vers `pile/`** pour **s'entraîner** sur les piles : page externe ↗ obligatoire (type 2) vers son entraînement « Entraînement : schéma d'une pile » (`module_1_pile`).

## Contenu du cours (résumé)

### I. Quotient de réaction et constante d'équilibre

- **Équilibre dynamique** : aA + bB ⇄ cC + dD modélisé par deux réactions opposées ; à l'équilibre, la vitesse de disparition de A (sens direct) égale sa vitesse d'apparition (sens indirect) : d[A]/dt = 0. **Erreur du cours à corriger** : « la réaction dans le sens indirect (←) consomme les réactifs pour former les produits » → elle **consomme les produits pour reformer les réactifs**.
- **Quotient de réaction** : (hors programme) Q<sub>r</sub> = a(C)<sup>c</sup> a(D)<sup>d</sup> / (a(A)<sup>a</sup> a(B)<sup>b</sup>), activité : [X]/c° en solution (c° = 1 mol·L<sup>−1</sup>), 1 pour le solvant et les solides, P(X)/P° pour un gaz (P° = 1 bar) ; **écriture simplifiée** Q<sub>r</sub> = [C]<sup>c</sup>[D]<sup>d</sup> / ([A]<sup>a</sup>[B]<sup>b</sup>) ; l'eau et les solides n'apparaissent pas.
- **Constante d'équilibre** : Q<sub>r,éq</sub> = K(T), sans dimension, ne dépend que de T (pas de l'état initial) ; exemple CH<sub>3</sub>COOH + H<sub>2</sub>O ⇄ CH<sub>3</sub>COO<sup>−</sup> + H<sub>3</sub>O<sup>+</sup> : K = 1,6 × 10<sup>−5</sup> à 25 °C ; réactions inverses : K′ = 1/K (autoprotolyse K<sub>e</sub> = 10<sup>−14</sup>, très peu avancée ; H<sub>3</sub>O<sup>+</sup> + HO<sup>−</sup> → 2 H<sub>2</sub>O, K = 10<sup>14</sup>, considérée comme totale).
- **Évolution spontanée** : le système évolue pour que Q<sub>r</sub> s'approche de K : Q<sub>r,i</sub> = K équilibre ; Q<sub>r,i</sub> < K sens direct (→) ; Q<sub>r,i</sub> > K sens indirect (←). Exemple 1 (acide éthanoïque : [CH<sub>3</sub>COOH]<sub>i</sub> = 6,5 × 10<sup>−6</sup>, [CH<sub>3</sub>COO<sup>−</sup>]<sub>i</sub> = 3,1 × 10<sup>−4</sup>, [H<sub>3</sub>O<sup>+</sup>]<sub>i</sub> = 1,0 × 10<sup>−7</sup> mol·L<sup>−1</sup> : Q<sub>r,i</sub> ≈ 4,8 × 10<sup>−6</sup> < K : sens direct) ; exemple 2 (Ni + Pb<sup>2+</sup> ⇄ Ni<sup>2+</sup> + Pb, K = 2,7 × 10³ ; Q<sub>r,i</sub> = [Ni<sup>2+</sup>]<sub>i</sub>/[Pb<sup>2+</sup>]<sub>i</sub> = 1,0/2,0 × 10<sup>−4</sup> = 5,0 × 10³ > K : sens indirect ←, corrigé manuscrit).

### II. Oxydants et réducteurs usuels

- **Couples à connaître** (document du manuel, page 3) : eau de Javel ClO<sup>−</sup>/Cl<sup>−</sup> (ClO<sup>−</sup> + H<sub>2</sub>O + 2 e<sup>−</sup> = Cl<sup>−</sup> + 2 HO<sup>−</sup>, milieu basique) ; dioxygène O<sub>2</sub>/H<sub>2</sub>O (O<sub>2</sub> + 4 e<sup>−</sup> + 4 H<sup>+</sup> = 2 H<sub>2</sub>O : « savoir équilibrer la demi-équation (O puis H) ») ; dichlore Cl<sub>2</sub>/Cl<sup>−</sup> ; acide ascorbique C<sub>6</sub>H<sub>6</sub>O<sub>6</sub>/C<sub>6</sub>H<sub>8</sub>O<sub>6</sub> (réducteur, anti-oxydant) ; dihydrogène H<sup>+</sup>/H<sub>2</sub> (« les deux couples O<sub>2</sub>/H<sub>2</sub>O et H<sup>+</sup>/H<sub>2</sub> utilisés pour les piles à combustible : consomme H<sub>2</sub> et O<sub>2</sub>, rejette uniquement H<sub>2</sub>O ») ; métaux M<sup>n+</sup>/M (lithium des accumulateurs).
- **Métaux du bloc s** (deux premières colonnes : alcalins, alcalino-terreux) : 1 ou 2 électrons sur la couche externe, qu'ils tendent à perdre pour avoir la structure du gaz noble précédent (Li<sup>+</sup> et Be<sup>2+</sup> comme He ; Na<sup>+</sup> et Mg<sup>2+</sup> comme Ne ; la note manuscrite « Be<sup>2+</sup> (idem Ne) » est à corriger) : ce sont des **réducteurs**.
- Rappel bref de l'oxydoréduction (oxydant, réducteur, demi-équation, réaction) avec le lien facultatif vers `oxydoreduction-spe/`.

### III. Piles

- **Expérience initiale** : lames de Cu et de Zn dans un mélange Cu<sup>2+</sup> + Zn<sup>2+</sup> (20 mL à 0,20 mol·L<sup>−1</sup> chacune) : dépôt de cuivre sur le zinc ; Cu<sup>2+</sup> + Zn → Cu + Zn<sup>2+</sup> ; le critère d'évolution le confirme (K = 2 × 10<sup>37</sup>, Q<sub>r,i</sub> = 1).
- **Constitution** : en obligeant les électrons à passer par un circuit extérieur, on obtient une pile ; chaque couple forme une **demi-pile** ; **anode : oxydation** ; **cathode : réduction** ; voltmètre : **tension à vide U<sub>0</sub>** (courant presque nul) ; électrons dans les fils seulement ; **pont salin** (ions mobiles) pour fermer le circuit, **membrane** dans une pile solide ; « attention : le sens de déplacement des ions est à l'inverse de l'intuition » ; équation de fonctionnement : somme des demi-équations. **Pourquoi séparer les réactifs** : sinon les électrons passent directement d'un réactif à l'autre, sans circuit.
- **Fonctionnement** : deux façons de trouver le sens des électrons : (1) le sens des réactions (expérience ou Q<sub>r</sub> et K), puis la polarité ; (2) la polarité mesurée (voltmètre, ampèremètre), électrons de la borne − vers la borne +, puis le sens des réactions. Exemple 1 (pile cuivre-zinc, K<sub>1</sub>, K<sub>2</sub>, pont NH<sub>4</sub><sup>+</sup>/NO<sub>3</sub><sup>−</sup>) ; exemple 2 (pile cuivre-argent, ampèremètre COM sur le cuivre, valeur positive).
- **Capacité** : Q = I × Δt (C, A, s) ; Q = n(e<sup>−</sup>) × N<sub>A</sub> × e = n(e<sup>−</sup>) × F, F = 9,65 × 10<sup>4</sup> C·mol<sup>−1</sup>. Exemple corrigé (pile cuivre-argent, 12 g de Cu, 250 mL à 0,20 mol·L<sup>−1</sup> d'Ag<sup>+</sup>, I = 200 mA) : étape 1 tableau d'avancement (Ag<sup>+</sup> limitant, x<sub>max</sub> = 0,025 mol) ; étape 2 n(e<sup>−</sup>) = 2x<sub>max</sub> = 0,050 mol ; étape 3 Q = 4,8 × 10³ C, Δt = Q/I ≈ 2,4 × 10<sup>4</sup> s ≈ 6,7 h.

## Plan de l'application (`PLAN`)

### Module 1 : Quotient de réaction et évolution spontanée

- Cours (sous-modules) : équilibre dynamique ; quotient de réaction (bulle **« Hors programme. »** avec les activités, consigne du professeur ; écriture simplifiée ; eau et solides absents) ; constante d'équilibre (réactions inverses) ; critère d'évolution (exemples 1 et 2).
- **Simulateur : Q<sub>r</sub> et K** (page `simulation`, un écran) : une réaction choisie dans une banque (acide éthanoïque, Ni/Pb<sup>2+</sup>, Cu/Zn, Fe<sup>3+</sup>/Ag…, ex. 3) ; concentrations initiales réglables ; une **jauge** horizontale (échelle logarithmique) avec la position de Q<sub>r</sub> et celle de K ; « Laisser évoluer » : Q<sub>r</sub> glisse vers K, les quantités changent (tableau d'avancement en direct), la flèche du sens d'évolution s'affiche ; défis : faire évoluer dans le sens indirect ; partir de l'équilibre ; constater que K ne dépend pas de l'état initial ; taux d'avancement final.
- Série : écrire Q<sub>r</sub> (eau et solides absents, exposants = coefficients), calculer Q<sub>r,i</sub>, sens d'évolution, K′ = 1/K, taux d'avancement final.

### Module 2 : Oxydants et réducteurs usuels

Cours : rappel bref (lien facultatif `oxydoreduction-spe/`) ; couples à connaître ; métaux du bloc s (classification interactive : toucher un élément du bloc s → ion formé). Série : oxydant ou réducteur, demi-équations des couples usuels (O<sub>2</sub>/H<sub>2</sub>O, ClO<sup>−</sup>/Cl<sup>−</sup>), caractère réducteur des alcalins.

### Module 3 : Piles

- Sous-modules de cours : expérience initiale ; constitution (séparation des réactifs, pont salin) ; fonctionnement (deux méthodes, exemples 1 et 2) ; capacité (trois étapes du professeur).
- **Page externe ↗** (type 2, obligatoire) après le cours sur le fonctionnement : `pile/` (« Entraînement : schéma d'une pile », `module_1_pile`).
- Série : anode / cathode, sens des électrons et des ions, polarité, équation de fonctionnement, capacité et durée (tableau d'avancement, n(e<sup>−</sup>), Q, Δt).

### Module 4 : Exercices

Ex. 1 à 10 de la feuille, avec sa numérotation, guidés à partir des corrections.

## Vérifications propres

- Script : exemples (Q<sub>r,i</sub> ≈ 4,8 × 10<sup>−6</sup> ; 5,0 × 10³ ; capacité 4,8 × 10³ C et 6,7 h) et chaque exercice.
- Bulle « Hors programme. » présente sur la définition avec les activités.
- Page ↗ : l'état de `pile/` (entraînement) remonte dans le sommaire.
