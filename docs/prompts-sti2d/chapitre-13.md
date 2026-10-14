# Chapitre 13 : Énergie nucléaire (prompt de génération)

Lis d'abord `docs/prompts-sti2d/00-commun.md` (sources, charte, structure, livraison).

## Application

- Dossier `energie-nucleaire/`, nom « Chapitre 13 : Énergie nucléaire », `data-matiere="physique"` (partie « Matière et matériaux »), préfixe `nuc`.
- Portail : desc « Fission, fusion, défaut de masse, E = |Δm| c², énergie d'un échantillon. » ; dessin d'en-tête : `noyaux`.

## Sources (`TSTI2D/13- Energie nucleaire/`)

| Fichier | Contenu | À lire |
|---|---|---|
| `Chap13-Cours_complete.pdf` (1 p.) | Cours complété à la main | Non : résumé ci-dessous. Lis-le si tu veux reprendre les figures fission / fusion |
| `Chap13-Exercice.pdf` (2 p.) | Ex. 1 à 7 (numérotation de la feuille, pas du manuel) | Oui (données, schéma de la bombe H, documents de l'ex. 7) |
| `Chap13-Exercice correction.pdf` (7 p.) | Corrections manuscrites | Oui, en tenant compte des erreurs signalées ci-dessous |

Ignore `Chap13-Cours.pdf` et les `.docx`.

## Contenu du cours

### Module 1 : Fission, fusion ou radioactivité ?

- **Fission** : un noyau lourd se scinde en deux noyaux plus légers, sous l'impact d'un neutron.
  
  Exemple : <sup>1</sup><sub>0</sub>n + <sup>235</sup><sub>92</sub>U → <sup>94</sup><sub>38</sub>Sr + <sup>140</sup><sub>54</sub>Xe + 2 <sup>1</sup><sub>0</sub>n.
- **Fusion** : deux noyaux légers s'associent pour former un noyau plus lourd.
  
  Exemple : <sup>2</sup><sub>1</sub>H + <sup>3</sup><sub>1</sub>H → <sup>4</sup><sub>2</sub>He + <sup>1</sup><sub>0</sub>n.
- **Méthode du professeur pour reconnaître la réaction d'après l'équation** :
  1. repérer le **nombre de nucléons le plus grand** ;
  2. s'il est **à gauche**, c'est une **fission** (un gros noyau donne des noyaux plus petits) ;
  3. s'il est **à droite**, c'est une **fusion** (des petits noyaux en donnent un plus gros) ;
  4. si c'est **le même à gauche et à droite**, c'est une **radioactivité**.
  
  Remarque : <sup>235</sup>U → <sup>231</sup>Th + <sup>4</sup><sub>2</sub>He est une radioactivité α, car pour une fission il faut deux réactifs (le neutron).
- **Exemples à classer** (cours) :
  - <sup>3</sup><sub>2</sub>He + <sup>3</sup><sub>2</sub>He → <sup>4</sup><sub>2</sub>He + 2 <sup>1</sup><sub>1</sub>H : fusion ;
  - <sup>2</sup><sub>1</sub>H + <sup>1</sup><sub>1</sub>H → <sup>3</sup><sub>2</sub>He : fusion ;
  - <sup>235</sup>U + n → <sup>85</sup>Br + <sup>148</sup>La + 3 n : fission ;
  - <sup>14</sup><sub>7</sub>N + <sup>1</sup><sub>1</sub>H → <sup>15</sup><sub>8</sub>O + γ : fusion ;
  - <sup>14</sup><sub>6</sub>C → <sup>0</sup><sub>−1</sub>e + <sup>14</sup><sub>7</sub>N : radioactivité β⁻.
- **Compléter une équation** : conservation des A et des Z (rappel du chapitre 12), nombre x de neutrons, élément d'après Z. Le neutron <sup>1</sup><sub>0</sub>n a 0 proton et 1 nucléon.
- **Outil `perso`** : équation à trous comme au chapitre 12 (A, Z, symbole, coefficient des neutrons), puis classement fission / fusion / radioactivité α, β⁻, β⁺ avec diagnostic ciblé :
  - « le plus grand nombre de nucléons est à gauche… » ;
  - « un seul réactif : ce n'est pas une fission ».
- **Série** : classer une réaction, trouver x, A, Z ou l'élément ; « ce n'est pas une réaction chimique car les éléments ne sont pas conservés ».

### Module 2 : Défaut de masse et énergie libérée

- **Défaut de masse** : Δm = m<sub>produits</sub> − m<sub>réactifs</sub> (kg). Il est négatif quand de l'énergie est libérée.
- **Énergie libérée** : E<sub>lib</sub> = |Δm| × c² (J).
  - c = 3,00 × 10⁸ m·s⁻¹ quand c n'est pas donné, sinon la valeur de l'énoncé (299 792 458 m·s⁻¹) ;
  - **1 MeV = 1,60 × 10⁻¹³ J** (ou 1 eV = 1,602177 × 10⁻¹⁹ J et 1 MeV = 10⁶ eV).
- **Masses en u** : 1 u = 1,660539 × 10⁻²⁷ kg. On fait le calcul en u, puis on convertit.
- **Méthode avec tableau (outil `perso`)** : deux colonnes, réactifs et produits. Chaque espèce sur une ligne, avec son **coefficient** × sa masse ; somme de chaque colonne ; Δm.
  - Les neutrons des deux côtés se simplifient en partie : 3 n à droite et 1 n à gauche donnent 2 × m(n) dans Δm (ex. 2 et 4).
  - Inspire-toi du schéma par colonnes de `combustions/` (`co.js`, `schema`).
- **Exemple du cours** : 4 <sup>1</sup><sub>1</sub>H → <sup>4</sup><sub>2</sub>He + 2 <sup>0</sup><sub>1</sub>e.
  - Δm = 6,6447 × 10⁻²⁷ + 2 × 9,11 × 10⁻³¹ − 4 × 1,6726 × 10⁻²⁷ ≈ −4,3878 × 10⁻²⁹ kg ;
  - E ≈ 3,9436 × 10⁻¹² J ≈ 24,6 MeV.
- **Série** : Δm de réactions générées (valeurs du cours et des exercices), E en J puis en MeV, conversions u → kg.
  
  Erreurs : coefficient oublié, signe gardé dans E, c non élevé au carré, MeV et eV confondus. Lien vers `puissances-10/` pour les calculs en écriture scientifique.

### Module 3 : Énergie d'un échantillon, comparaison avec le pétrole

- **Nombre de noyaux** dans une masse m : N = m / m<sub>1 noyau</sub>, avec m en **kg** des deux côtés. Garde le « OU » du professeur : tableau de proportionnalité 1 noyau ↔ m<sub>1 noyau</sub> ; N ↔ m.
  
  Exemple du cours : nombre de noyaux d'hélium 4 dans 10 g.
- **Énergie totale** : E = N × E<sub>1 noyau</sub>.
- **Masse de pétrole équivalente** : m = E / PC (PC = pouvoir calorifique, 42 MJ·kg⁻¹ ; lien avec `combustions/`, module 5). Proportionnalité 1 kg ↔ 42 × 10⁶ J.
- **Puissance et activité** (ex. 7) : nombre de désintégrations par seconde = P / E<sub>1 désintégration</sub>, c'est l'activité en Bq.
- **Série** : N dans une masse donnée, énergie de m grammes de combustible nucléaire, masse de pétrole équivalente, activité d'après une puissance.

### Module 4 : Exercices

Voir plus bas.

## Exercices (numérotation de la feuille)

**Ex. 1** :
- a) x = 2, Z = 53 (iode) : fission ;
- b) α (A = 231, Z = 90) ;
- c) <sup>2</sup><sub>1</sub>H + <sup>3</sup><sub>1</sub>H → <sup>4</sup><sub>2</sub>He + <sup>1</sup><sub>0</sub>n : fusion, pas une α car il y a deux noyaux à gauche ;
- d) β⁺ (<sup>131</sup><sub>52</sub>Te) ;
- e) X = <sup>124</sup><sub>53</sub>I, β⁻ ;
- 2. neutron (0 proton, 1 nucléon).

**Ex. 2** :
- Δm = m(Sr) + m(Xe) + 2 m(n) − m(U) ≈ −3,20744 × 10⁻²⁸ kg ;
- E ≈ 2,88 × 10⁻¹¹ J.

**Ex. 3** (« très important : type bac ») :
1. fusion (noyau le plus lourd à droite) ;
2. Δm = −9,6 × 10⁻³⁰ kg ;
3. E = 8,64 × 10⁻¹³ J = 5,39 MeV ;
4. N = 5 × 10⁻³ / 5,0064 × 10⁻²⁷ ≈ 9,99 × 10²³ noyaux, donc E ≈ 8,63 × 10¹¹ J ;
5. m<sub>pétrole</sub> = 8,63 × 10¹¹ / 42 × 10⁶ ≈ 2,05 × 10⁴ kg ≈ 20,5 t.

**Ex. 4** :
- a) x = 2, Z = 54 ;
- b) Δm = −0,19825 u ≈ −3,29202 × 10⁻²⁸ kg ;
- c) Q ≈ 2,95872 × 10⁻¹¹ J ≈ 184,7 MeV ;
- d) « Important (question posée au bac) ». m<sub>noyau</sub> = 234,99332 u = 3,90216 × 10⁻²⁵ kg = 3,90216 × 10⁻²² g, donc **N = 5,00 / 3,90216 × 10⁻²² ≈ 1,28 × 10²² noyaux** ;
- e) **E ≈ 1,28 × 10²² × 2,95872 × 10⁻¹¹ ≈ 3,79 × 10¹¹ J** ;
- f) **m ≈ 3,79 × 10¹¹ / 42 × 10⁶ ≈ 9,0 × 10³ kg ≈ 9 t**.

**⚠ La correction manuscrite trouve N = 1,28 × 10²⁵ (division fausse), puis 3,79 × 10¹⁴ J et 9000 t : erreur d'un facteur 1000 à corriger.** Le contrôle « 5 g d'hélium 3 contiennent 10²⁴ noyaux, l'uranium est 78 fois plus lourd » permet de la voir : mets-le dans la correction.

**Ex. 5** (ITER) :
- a) A = 1, Z = 0 : neutron ;
- b) pas une réaction chimique : les éléments ne sont pas conservés ;
- c) fusion ;
- d) Δm = −3,1500 × 10⁻²⁹ kg ;
- e) E ≈ 2,8311 × 10⁻¹² J ≈ 17,67 MeV ;
- f) N = 5,0 × 10⁻³ / 3,3436 × 10⁻²⁷ ≈ 1,5 × 10²⁴ ;
- g) E ≈ 2,6 × 10²⁵ MeV ≈ 4,2 × 10¹² J.

L'énoncé écrit « c = 299 792 458.10⁸ m·s⁻¹ » : c'est 299 792 458 m·s⁻¹.

**Ex. 6** (bombe H) :
1. fission du Pu 239, fission de l'U 235, fusion de l'hydrogène ;
2. les neutrons libérés par la fission du plutonium font fissionner l'uranium ;
3. a) non (réaction chimique) ; b) oui ; c) oui ; d) non.

**Ex. 7** (RTG de New Horizons) :
1. a) α ; b) Δm ≈ −9,809 × 10⁻³⁰ kg ; c) E ≈ 8,828 × 10⁻¹³ J (c = 3,00 × 10⁸, non donné) ;
2. a) 4400 / 8,828 × 10⁻¹³ ≈ 4,98 × 10¹⁵ désintégrations par seconde ; b) A<sub>0</sub> ≈ 4,98 × 10¹⁵ Bq.
