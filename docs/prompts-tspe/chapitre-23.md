# Électrolyse (prompt de génération)

Lis d'abord `docs/prompts-tspe/00-commun.md` (sources, charte, structure, outils partagés, livraison).

## Application

- Dossier `electrolyse/`, nom « Électrolyse », `data-matiere="chimie"`, préfixe `el`, espace de noms `EL`.
- Portail : `desc: "Transformation forcée, électrolyseur, anode et cathode, quantité d'électrons et durée, stockage et conversion de l'énergie."` ; `mots` : électrolyse, transformation forcée, spontanée, générateur, électrolyseur, électrolyte, électrode inerte, anode, cathode, oxydation, réduction, recharge, Faraday, F = 96 500, charge électrique, Q = I × Δt, n(e⁻), dépôt métallique, chromage, argenture, électrolyse de l'eau, dihydrogène, accumulateur, batterie, pile à combustible, photosynthèse, respiration…
- Dessin d'en-tête : celui de « Équilibre chimique et piles » ou de `pile/`.
- **Prérequis conseillé** : `chapitre-18.md` (« Équilibre chimique et piles »), dont ce chapitre reprend la fin. Outils : `MOL`, outils de tableau d'avancement existants, `EQ`, `BULLE`, `PLEIN` ; l'outil de schéma de pile de `pile/` s'il peut se monter en partie `perso`.

## Sources (`23- Electrolyse/`)

| Fichier | Contenu | À lire |
|---|---|---|
| `Chap23-Cours_electrolyse complete.pdf` (6 p.) | Cours tapé, complété à la main | Non : résumé ci-dessous. Pages 1 à 4 pour les schémas complétés et les solutions des exemples |
| `Chap23-Exercices.pdf` (3 p.) | Ex. 1 à 11 (ex. 1 : transformation spontanée et forcée ; les autres en images) | Oui |
| `Chap23-Exercices-correction.pdf` (9 p.) | Corrections | Oui |

## Consignes du professeur

- **Il y a des reprises du cours sur les piles** (« Équilibre chimique et piles ») : **les reprendre en plus rapide**, avec des **liens si on veut revenir dessus** (liens facultatifs, type 1, vers les cours du module « Piles » de « Équilibre chimique et piles » et vers `pile/`).

## Contenu du cours (résumé)

### I. Principe de l'électrolyse

- **Réaction spontanée** (rappel de la pile cuivre-argent : Cu + 2 Ag<sup>+</sup> ⇄ Cu<sup>2+</sup> + 2 Ag, K<sub>1</sub> = 2,1 × 10<sup>15</sup> ; pôles, équations aux électrodes, sens du courant et des porteurs, pile usée ou non avec [Ag<sup>+</sup>] = [Cu<sup>2+</sup>] = 1,0 × 10<sup>−2</sup> mol·L<sup>−1</sup>).
- **Pile usée** : Cu/Cu<sup>2+</sup> (1,0 mol·L<sup>−1</sup>) // Ag<sup>+</sup> (2,2 × 10<sup>−8</sup> mol·L<sup>−1</sup>)/Ag : vérifier que Q<sub>r</sub> = K (1,0/(2,2 × 10<sup>−8</sup>)² ≈ 2,1 × 10<sup>15</sup>) : plus de courant.
- **Réaction forcée** : un générateur de tension continue fournit de l'énergie et **force les électrons à circuler dans le sens inverse** ; la réaction se fait dans l'autre sens (Cu<sup>2+</sup> + 2 Ag → Cu + 2 Ag<sup>+</sup>) : la pile se recharge (schéma à compléter).
- **Quotient de réaction** : lors d'une transformation forcée, **Q<sub>r</sub> s'éloigne de K** (au départ Q<sub>r</sub> = K, pile usée ; Q<sub>r</sub> = [Cu<sup>2+</sup>]/[Ag<sup>+</sup>]² diminue).
- **Électrolyseur** : cuve, solution électrolytique, deux électrodes (inertes ou participant à la réaction) reliées à un générateur ; **électrolyse** : procédé électrochimique où une réaction est forcée par un générateur ; étymologie (lysis = coupure : la première électrolyse fut celle de l'eau, 2 H<sub>2</sub>O → 2 H<sub>2</sub> + O<sub>2</sub>) ; **anode = oxydation, cathode = réduction** (comme dans une pile ; mais ici l'anode est reliée à la borne + du générateur).

### II. Quantités de matière et durée

- **Q = I × Δt** (bilan électrique) ; **Q = n(e<sup>−</sup>) × N<sub>A</sub> × e = n(e<sup>−</sup>) × F**, F = 9,65 × 10<sup>4</sup> C·mol<sup>−1</sup> ; n(e<sup>−</sup>) relié aux quantités consommées ou formées par les demi-équations.
- **Exemple 1 : chromage** (Cr<sup>3+</sup> + 3 e<sup>−</sup> → Cr, I = 0,70 A, dépôt de 0,50 g, M(Cr) = 52,0 g·mol<sup>−1</sup>) : sens des électrons, polarité du générateur, la pièce est la cathode ; n(Cr) = 9,6 × 10<sup>−3</sup> mol ; n(e<sup>−</sup>) = 3 n(Cr) = 2,9 × 10<sup>−2</sup> mol ; Δt = n(e<sup>−</sup>) F / I ≈ 4,0 × 10³ s ≈ 66 min. ▶ Vidéo récapitulative (facultative) : https://lycee.hachette-education.com/pc/tle/#VID_electrolysemp4.
- **Exemple 2 : électrolyse de l'eau acidifiée** (couples H<sup>+</sup>/H<sub>2</sub> et O<sub>2</sub>/H<sub>2</sub>O ; V<sub>m</sub> = 25 L·mol<sup>−1</sup>) : demi-équations, anode (O<sub>2</sub>) et cathode (H<sub>2</sub>) ; intensité pour produire 5 m³ de H<sub>2</sub> en 1 h : n(H<sub>2</sub>) = 200 mol, n(e<sup>−</sup>) = 400 mol, I ≈ 1,1 × 10<sup>4</sup> A.

### III. Conversion et stockage de l'énergie

- Stockage de l'énergie électrique sous forme chimique : **transformation forcée** ; conversion de l'énergie chimique en électrique : **transformation spontanée**.
- **Accumulateurs** (« pile rechargeable » est un abus) : batteries au plomb (démarrage des voitures thermiques), au lithium (smartphones, voitures électriques : meilleure énergie massique, plus chères, plus difficiles à recycler).
- **Pile à combustible** (2 H<sub>2</sub> + O<sub>2</sub> → 2 H<sub>2</sub>O, compartiments séparés, circuit extérieur) ; H<sub>2</sub> obtenu à partir du méthane (CH<sub>4</sub> + 2 H<sub>2</sub>O → 4 H<sub>2</sub> + CO<sub>2</sub> : fossile, polluant) ou par électrolyse de l'eau (peut être non polluant selon l'électricité, rendement faible).
- **Organismes chlorophylliens** : respiration (C<sub>6</sub>H<sub>12</sub>O<sub>6</sub> + 6 O<sub>2</sub> → 6 CO<sub>2</sub> + 6 H<sub>2</sub>O, libère de l'énergie) ; photosynthèse (bilan inverse, stocke l'énergie solaire sous forme de glucose).

## Plan de l'application (`PLAN`)

### Module 1 : De la pile à l'électrolyse (rapide)

- Cours **court** (une ou deux étapes) : rappel express de la pile (encadré : anode, cathode, sens des électrons, Q<sub>r</sub> → K ; **liens facultatifs** vers le module « Piles » de « Équilibre chimique et piles » et vers `pile/`) ; pile usée (Q<sub>r</sub> = K) ; transformation forcée (Q<sub>r</sub> s'éloigne de K).
- **Animation : recharger une pile** (page `simulation`, un écran) : la pile cuivre-argent ; « Débiter » : les électrons circulent dans un sens, les lames et les concentrations évoluent, Q<sub>r</sub> va vers K (jauge comme au module 1 de « Équilibre chimique et piles ») jusqu'à l'usure ; « Brancher un générateur » : les électrons sont forcés dans l'autre sens, la réaction s'inverse, Q<sub>r</sub> s'éloigne de K ; anode et cathode qui **échangent leur rôle et leur nom** en direct (anode = oxydation toujours) ; défis : user la pile ; la recharger ; nommer anode et cathode dans chaque cas.
- Série : spontané ou forcé, sens de Q<sub>r</sub>, polarité du générateur, anode et cathode.

### Module 2 : L'électrolyseur

Cours : constitution, électrodes inertes ou non, anode et cathode, électrolyse de l'eau. **Atelier : schéma d'un électrolyseur** (dans le cours en « À toi » ou page `simulation`) : placer la polarité du générateur, le sens des électrons dans les fils, l'anode et la cathode, écrire les demi-équations et la réaction forcée (chromage, argenture d'une bague en cuivre (contexte de bac de `competences.md`), électrolyse de l'eau, d'une solution de chlorure de sodium…). Série : même chose avec des situations variées.

### Module 3 : Quantité de matière et durée

Cours : Q = IΔt = n(e<sup>−</sup>)F ; lien avec les demi-équations ; méthode en étapes (comme la capacité d'une pile : n de l'espèce → n(e<sup>−</sup>) par les coefficients → Q → Δt ou I) ; exemples 1 et 2 (avec `EQ` pour isoler Δt ou I). Série : durée d'un dépôt, masse déposée, intensité, volume de gaz (V<sub>m</sub>), diagnostics : coefficient des électrons oublié, minutes non converties, F mal utilisée.

### Module 4 : Stocker et convertir l'énergie

Cours : forcée / spontanée ; accumulateurs ; pile à combustible ; photosynthèse et respiration ; enjeux sociétaux (recyclage, origine de l'électricité). Série : forcé ou spontané pour chaque dispositif (charge / décharge d'un accumulateur, électrolyseur, pile à combustible, photosynthèse, respiration), équations, avantages et inconvénients.

### Module 5 : Exercices

Ex. 1 à 11 de la feuille.

## Vérifications propres

- Script : exemples (Q<sub>r</sub> ≈ 2,1 × 10<sup>15</sup> ; chromage ≈ 66 min ; I ≈ 1,1 × 10<sup>4</sup> A) et chaque exercice.
- Animation : un écran, sens des électrons et noms des électrodes justes dans les deux modes, reduced-motion.
