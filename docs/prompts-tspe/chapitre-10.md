# Force des acides et des bases (prompt de génération)

Lis d'abord `docs/prompts-tspe/00-commun.md` (sources, charte, structure, outils partagés, livraison).

## Application

- Dossier `force-acides-bases/`, nom « Force des acides et des bases », `data-matiere="chimie"`, préfixe `fab`, espace de noms `FAB`.
- Portail : `desc: "Taux d'avancement, acides et bases forts ou faibles, Ka et pKa, diagrammes de prédominance, calcul du pH, tampons."` ; `mots` : acide fort, base forte, acide faible, équilibre, ⇄, taux d'avancement, xf, constante d'acidité, Ka, pKa, Ke, produit ionique, 10^-14, prédominance, distribution, pH = pKa + log, indicateur coloré, zone de virage, solution tampon, acide aminé, zwitterion, second degré, discriminant…
- Dessin d'en-tête : celui de « Transformations acide-base » ou de `ph/`.
- **Prérequis** : `outils-communs.md` (outil `EQ`) et `chapitre-04.md` (outil d'échange du proton de « Transformations acide-base », à réutiliser en partie `perso`). Outils : `EQ`, `TITRAGE` (indicateurs colorés, si utile), `LG`, `ORGA` (acides α-aminés), `BULLE`, `PLEIN`.

## Sources (`10- Force des acides et des bases/`)

| Fichier | Contenu | À lire |
|---|---|---|
| `Chap10-Cours_acide_base complete.pdf` (9 p.) | Cours tapé, complété à la main | Non : résumé ci-dessous. Pages 2 (tableaux des exemples 1 et 2), 5 (diagrammes), 9 (acide α-aminé) pour les figures |
| `Chap10-Exercices acide base.pdf` (3 p.) | Énoncés des ex. 1 à 18 (ex. 1 à 8 tapés, ex. 9 à 18 en images avec diagrammes de distribution : BBT, acide phosphorique) | Oui |
| `Chap10-Exercices acide base correction.pdf` (14 p.) | Corrections manuscrites des ex. 1 à 18 | Oui |

Le TP de détermination de K<sub>a</sub> n'est pas repris.

## Consignes du professeur

- **Reprendre ce qui est déjà fait** dans d'autres applications **pour les tableaux d'avancement** (`avancement-reaction/`, « Rappels de chimie », module 5).
- **Reprendre ce qui est fait dans `equations-en-physique/` et `equations-physique-mobile/` pour la manipulation des équations** : pH, K<sub>a</sub>, et **l'expression du pH en fonction du pK<sub>a</sub>** (outil commun `EQ`).
- **Insister** : n'importe quel **acide fort dans l'eau = H<sub>3</sub>O<sup>+</sup>** ; n'importe quelle **base forte dans l'eau = HO<sup>−</sup>**.

## Contenu du cours (résumé)

### I. Acides forts, bases fortes

- Acide fort : réaction **totale** avec l'eau AH + H<sub>2</sub>O → A<sup>−</sup> + H<sub>3</sub>O<sup>+</sup> ; base forte : B<sup>−</sup> + H<sub>2</sub>O → BH + HO<sup>−</sup>. Un acide fort n'a pas de base conjuguée (A<sup>−</sup> ne peut pas capter H<sup>+</sup> dans l'eau), une base forte pas d'acide conjugué.
- **En solution, un acide fort est TOUJOURS sous forme de H<sub>3</sub>O<sup>+</sup>** (noté H<sup>+</sup> si besoin) et d'ions A<sup>−</sup> spectateurs ; **une base forte TOUJOURS sous forme de HO<sup>−</sup>**.
- À connaître : acide chlorhydrique (HCl gaz ; en solution (H<sub>3</sub>O<sup>+</sup>, Cl<sup>−</sup>)) ; soude (NaOH solide blanc ; (Na<sup>+</sup>, HO<sup>−</sup>)) ; acide nitrique ; réactions : HCl + soude, HCl + NH<sub>3</sub>, soude + CH<sub>3</sub>COOH, soude + NH<sub>4</sub><sup>+</sup> (écrites avec H<sub>3</sub>O<sup>+</sup> et HO<sup>−</sup>).

### II. Équilibre chimique

- Transformation **non totale** : x<sub>f</sub> < x<sub>max</sub> ; tous les réactifs et produits coexistent ; quantités constantes : **état d'équilibre** (x<sub>f</sub> = x<sub>éq</sub>), symbole **⇄**.
- **Taux d'avancement τ = x<sub>f</sub> / x<sub>max</sub>** : < 1 réaction équilibrée (⇄) ; = 1 totale ou quasi totale (→) ; τ ≪ 1 très peu avancée.
- Exemple 1 : 5,0 × 10<sup>−4</sup> mol d'acide éthanoïque dans 50 mL, pH = 3,4 (tableau état initial / final (équilibre) / final si totale) ; exemple 2 : acide nitrique, même quantité, pH = 2 (τ = 1).

### III. Acides faibles, bases faibles

- Acide faible : réaction **équilibrée** avec l'eau AH + H<sub>2</sub>O ⇄ A<sup>−</sup> + H<sub>3</sub>O<sup>+</sup> ; sa base conjuguée est une base faible (CH<sub>3</sub>COO<sup>−</sup> + H<sub>2</sub>O ⇄ CH<sub>3</sub>COOH + HO<sup>−</sup>).
- **Constante d'acidité** (sans dimension, ne dépend que de T) : **K<sub>a</sub> = [H<sub>3</sub>O<sup>+</sup>]<sub>éq</sub> × [A<sup>−</sup>]<sub>éq</sub> / [AH]<sub>éq</sub>** ; plus K<sub>a</sub> est grande, plus l'acide est fort ; **pK<sub>a</sub> = −log K<sub>a</sub>** (plus pK<sub>a</sub> est petit, plus l'acide est fort). Échelle : H<sub>2</sub>O/HO<sup>−</sup> 14 ; NH<sub>4</sub><sup>+</sup>/NH<sub>3</sub> 9,2 (K<sub>a</sub> = 6,3 × 10<sup>−10</sup>) ; CH<sub>3</sub>COOH/CH<sub>3</sub>COO<sup>−</sup> 4,8 (1,6 × 10<sup>−5</sup>) ; H<sub>3</sub>O<sup>+</sup>/H<sub>2</sub>O 0 (K<sub>a</sub> = 1) ; flèches « acide plus fort » vers le bas, « base plus forte » vers le haut.
- **Produit ionique de l'eau** : 2 H<sub>2</sub>O ⇄ H<sub>3</sub>O<sup>+</sup> + HO<sup>−</sup> ; **K<sub>e</sub> = [H<sub>3</sub>O<sup>+</sup>]<sub>éq</sub> × [HO<sup>−</sup>]<sub>éq</sub> = 1,0 × 10<sup>−14</sup>** à 25 °C, pK<sub>e</sub> = 14 ; connaissant [H<sub>3</sub>O<sup>+</sup>], [HO<sup>−</sup>] ou le pH, on calcule les deux autres (exemples : [H<sub>3</sub>O<sup>+</sup>] = 1,0 × 10<sup>−8</sup> ; pH = 3,0 ; [HO<sup>−</sup>] = 1,0 × 10<sup>−4</sup>).
- **Diagramme de prédominance** : A prédomine sur B si [A] > [B] ; AH si pH < pK<sub>a</sub>, A<sup>−</sup> si pH > pK<sub>a</sub>, [AH] = [A<sup>−</sup>] si pH = pK<sub>a</sub>.
  - **Justification** (« première étape à maîtriser parfaitement : exprimer le pH en fonction du pK<sub>a</sub> ») : log K<sub>a</sub> = log[H<sub>3</sub>O<sup>+</sup>] + log([A<sup>−</sup>]/[AH]) ⟺ −pK<sub>a</sub> = −pH + log([A<sup>−</sup>]/[AH]), soit **pH = pK<sub>a</sub> + log([A<sup>−</sup>]/[AH])** ; puis les trois cas avec le signe de log x (courbe de log : log x < 0 si x < 1, > 0 si x > 1).
  - CH<sub>3</sub>COOH/CH<sub>3</sub>COO<sup>−</sup> (pK<sub>a</sub> = 4,8) à pH 8 et 2 : **deux rédactions possibles** (placer le pH sur le diagramme ; ou « si pH < pK<sub>a</sub> → acide, si pH > pK<sub>a</sub> → basique ») et trois formulations (« CH<sub>3</sub>COO<sup>−</sup> prédomine » / « l'acide est majoritairement présent sous forme de CH<sub>3</sub>COO<sup>−</sup> » / « l'acide est présent sous sa forme basique »).
  - **Exemple important** : (CO<sub>2</sub>, H<sub>2</sub>O) = H<sub>2</sub>CO<sub>3</sub> = CO<sub>2</sub>(aq), diacide : pK<sub>a</sub> 6,4 (H<sub>2</sub>CO<sub>3</sub>/HCO<sub>3</sub><sup>−</sup>) et 10,3 (HCO<sub>3</sub><sup>−</sup>/CO<sub>3</sub><sup>2−</sup>), diagramme à trois domaines (« + H<sup>+</sup> » sous chaque frontière) ; « ex. 5, 6, 7 ».
- **Diagramme de distribution** : % de AH et A<sup>−</sup> en fonction du pH ; intersection à 50 % : pH = pK<sub>a</sub> ; **%AH + %A<sup>−</sup> = 100 %** ; avec les concentrations : **[AH] + [A<sup>−</sup>] = c** (c concentration apportée).

### IV. Calcul du pH

- **Acide fort** : [H<sub>3</sub>O<sup>+</sup>] = c, pH = −log c (HCl 1,0 × 10<sup>−3</sup> ; HNO<sub>3</sub> 1,5 × 10<sup>−4</sup>) ; ⚠ **acide sulfurique** H<sub>2</sub>SO<sub>4</sub> + 2 H<sub>2</sub>O → 2 H<sub>3</sub>O<sup>+</sup> + SO<sub>4</sub><sup>2−</sup> : [H<sub>3</sub>O<sup>+</sup>] = 2c.
- **Base forte** : pH = −log(K<sub>e</sub>/[HO<sup>−</sup>]) (soude 1,0 × 10<sup>−3</sup> ; concentration d'une soude de pH 8,5).
- **Acide faible** (méthode encadrée : tableau d'avancement de la réaction avec l'eau ; relations entre concentrations à l'équilibre ; expression de K<sub>a</sub> avec une seule inconnue ; équation du second degré). Exemple corrigé : acide éthanoïque c = 3,0 × 10<sup>−4</sup> mol·L<sup>−1</sup>, pK<sub>a</sub> = 4,8 : « **Important : on exprime tout en fonction de [H<sub>3</sub>O<sup>+</sup>] ; ici on pose [H<sub>3</sub>O<sup>+</sup>] = h** » ; [CH<sub>3</sub>COO<sup>−</sup>] = h ; [CH<sub>3</sub>COOH] = c − h ; K<sub>a</sub> = h²/(c − h) ⟺ h² + K<sub>a</sub>h − K<sub>a</sub>c = 0 ; Δ = b² − 4ac = 1,92 × 10<sup>−8</sup> ; racine positive h = 6,1 × 10<sup>−5</sup> mol·L<sup>−1</sup> ; [CH<sub>3</sub>COOH] = 2,4 × 10<sup>−4</sup> mol·L<sup>−1</sup> ; pH = 4,2.

### V. Couples particuliers

- **Indicateurs colorés** IndH/Ind<sup>−</sup> : couleur de IndH si [IndH] > 10[Ind<sup>−</sup>] ; zone de virage pK<sub>a</sub> − 1 à pK<sub>a</sub> + 1 ; BBT (pK<sub>a</sub> 7,1 ; 6–7,6 ; jaune / bleu) ; hélianthine (3,4 ; 3–4 ; rouge / jaune).
- **Solution tampon** : pH qui varie peu par ajout modéré d'acide, de base ou par dilution ; mélange d'un acide faible et de sa base conjuguée à des concentrations voisines ; pH proche du pK<sub>a</sub>.
- **Acides α-aminés** : H<sub>2</sub>N–CHR–COOH (carbone α) ; peptides, protéines ; COOH/COO<sup>−</sup> pK<sub>a1</sub> ≈ 2–5 ; NH<sub>3</sub><sup>+</sup>/NH<sub>2</sub> pK<sub>a2</sub> ≈ 9–10 ; diagramme à trois domaines (cation, **zwitterion** <sup>+</sup>H<sub>3</sub>N–CHR–COO<sup>−</sup>, anion) ; « la forme H<sub>2</sub>N–CHR–COOH n'existe donc pas : abus d'écriture ».

## Plan de l'application (`PLAN`)

### Module 1 : Acides forts, bases fortes, équilibre chimique

Cours (sous-modules) : acides et bases forts (**acide fort dans l'eau = H<sub>3</sub>O<sup>+</sup>, base forte = HO<sup>−</sup>** : encadré `cle` et rappel dans chaque exercice concerné) ; transformation non totale, taux d'avancement (tableau à trois lignes, **repris des outils de tableau d'avancement existants**). « À toi » : tableau de l'exemple 1 (τ ≈ 0,040), exemple 2 (τ = 1). Série : écrire la réaction d'un acide fort ou d'une base forte avec l'eau, τ, flèche → ou ⇄, réactions avec la soude ou l'acide chlorhydrique écrites avec HO<sup>−</sup> / H<sub>3</sub>O<sup>+</sup> (diagnostic : « NaOH n'existe pas dans l'eau : écris HO<sup>−</sup> »).

### Module 2 : Ka, pKa, Ke

Cours : K<sub>a</sub>, pK<sub>a</sub>, échelle des pK<sub>a</sub>, comparer des forces, K<sub>e</sub>. **Manipulations d'équations avec `EQ`** (outils log, 10<sup>x</sup>, ×(−1), fraction) : K<sub>a</sub> = 10<sup>−pK<sub>a</sub></sup> ; [HO<sup>−</sup>] = K<sub>e</sub>/[H<sub>3</sub>O<sup>+</sup>] ; [H<sub>3</sub>O<sup>+</sup>] à partir de K<sub>a</sub> et du rapport. Série : K<sub>a</sub> ↔ pK<sub>a</sub>, classement d'acides et de bases, [HO<sup>−</sup>] et pH, expression de K<sub>a</sub> d'un couple donné (concentrations de l'équilibre, eau absente).

### Module 3 : Diagrammes de prédominance et de distribution

- Cours : **démonstration pH = pK<sub>a</sub> + log([A<sup>−</sup>]/[AH]) dans `EQ`** (démonstration étape par étape, puis « À toi » : l'élève passe de K<sub>a</sub> = … à pH = pK<sub>a</sub> + log(…) : appliquer log aux deux membres, log d'un produit, multiplier par −1) — consigne du professeur ; les trois cas ; diagrammes ; CO<sub>2</sub> (diacide) ; distribution (%AH + %A<sup>−</sup> = 100 %, [AH] + [A<sup>−</sup>] = c).
- **Simulateur : prédominance et distribution** (`module_3_simulation.html`, un écran) : un couple (ou un diacide, un acide α-aminé) choisi dans une banque ; curseur de pH ; diagramme de prédominance, diagramme de distribution et proportions en direct ; la molécule dessinée (`ORGA`) change de forme (le H<sup>+</sup> part ou arrive, réutilise l'outil d'échange du proton) ; indicateur coloré dans un tube qui change de couleur dans sa zone de virage ; mélange tampon (ajouts d'acide ou de base, le pH varie peu). Défis dans n'importe quel ordre : placer pH = pK<sub>a</sub> ; trouver la forme prédominante du sang (pH 7,4) pour le couple CO<sub>2</sub>/HCO<sub>3</sub><sup>−</sup> ; zwitterion majoritaire ; zone de virage du BBT ; montrer l'effet tampon.
- Série : forme prédominante, diagramme à compléter, lecture d'un diagramme de distribution, pourcentage, acide α-aminé, indicateur adapté.

### Module 4 : Calculer un pH

- Sous-modules de cours : acide fort (dont H<sub>2</sub>SO<sub>4</sub> : 2c) ; base forte ; acide faible (méthode encadrée, « on exprime tout en fonction de h = [H<sub>3</sub>O<sup>+</sup>] », équation du second degré).
- **Atelier : pH d'un acide faible** (dans le cours ou page `simulation`) : tableau d'avancement (outil existant), concentrations en fonction de h, expression de K<sub>a</sub>, mise sous la forme h² + K<sub>a</sub>h − K<sub>a</sub>c = 0 dans `EQ`, Δ et racine positive (calculatrice : icône), pH ; diagnostics : racine négative gardée, c − h remplacé par c sans justification (accepté en remarque si h ≪ c, avec la comparaison), K<sub>a</sub> confondu avec pK<sub>a</sub>.
- Lien facultatif : `equations-en-physique/` (équation du second degré, si un module existe ; sinon `calcul-numerique/`).
- Série : pH d'acides et bases forts et faibles, concentrations des espèces, τ à partir du pH.

### Module 5 : Exercices

Ex. 1 à 18 de la feuille : 1 pH après dilution ; 2 concentration en ions hydroxyde ; 3 solution d'hydroxyde de sodium ; 4 vitamine C ; 5 couple de l'ammoniac ; 6 acide éthanoïque ; 7 espèce prédominante ; 8 déterminer une constante d'acidité ; 9 estimer la force d'un acide ; 10 comparer la force de deux acides ; 11 comparer la force de deux bases ; 12 acide fort ou faible ; 13 un acide aminé ; 14 zone de virage du BBT ; 15 acide phosphorique ; 16 tampon ammoniacal ; 17 acide faible et équation du second degré ; 18 conservateur alimentaire.

## Vérifications propres

- Script : chaque exemple (τ de l'exemple 1 avec pH = 3,4 : x<sub>f</sub> = 10<sup>−3,4</sup> × 0,050 = 2,0 × 10<sup>−5</sup> mol, τ = 0,040 ; exemple de l'acide éthanoïque : h = 6,1 × 10<sup>−5</sup>, pH = 4,2) et chaque exercice.
- `EQ` : la démonstration de pH = pK<sub>a</sub> + log(…) se fait dans l'éditeur avec les outils disponibles (log d'un produit : si l'éditeur ne sait pas « couper » log(a × b) en log a + log b, ajoute cet outil à `EQ` de façon compatible et reteste `equations-physique-mobile/`).
