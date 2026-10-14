# Chapitre 12 : Radioactivité (prompt de génération)

Lis d'abord `docs/prompts-sti2d/00-commun.md` (sources, charte, structure, livraison).

## Application

- Dossier `radioactivite/`, nom « Chapitre 12 : Radioactivité », `data-matiere="physique"` (partie « Matière et matériaux »), préfixe `rad`.
- Portail : desc « Noyau, α, β⁻, β⁺, γ, activité, demi-vie, N(t) = N₀ e^(−λt) et calcul de t. » ; dessin d'en-tête : `noyaux` (existe déjà).

## Sources (`TSTI2D/12- Radioactivite/`)

| Fichier | Contenu | À lire |
|---|---|---|
| `Chap12-Cours complete.pdf` (2 p.) | Cours complété à la main (méthode de la demi-vie, calcul de t) | Non : résumé ci-dessous. Page 2 pour les graphiques N(t), A(t) et la courbe annotée (t<sub>1/2</sub> = 55 s) |
| `Chap12-Activite.pdf` (1 p.) | Activité « qu'est-ce que la radioactivité ? » (vidéos YouTube + document) | `pdftotext` suffit. Les vidéos ne s'intègrent pas : reprends seulement les questions sur le document |
| `Chap12-Exercices.pdf` (2 p.) | Ex. 7 p. 155, 1, 2 (hors manuel), 10 p. 155, 11 p. 156, 6 p. 154, 16 p. 156, sujet de bac (cobalt 60) | Oui (tableau de l'ex. 7, graphiques des ex. 6, 16 et du sujet de bac) |
| `Chap12-Correction Exercices.pdf` (3 p.) | Corrections tapées | Oui |
| `Chap12-Exercices supplementaires.pdf` (1 p.) | Ex. 17, 18, 19 « Applications technologiques » (iridium 192, technétium 99m, déchets) | Oui. **Pas de correction fournie** : rédige-la et vérifie chaque valeur |

## Contenu du cours

### Module 1 : Noyau et radioactivité

- **Radioactivité naturelle / artificielle** : phénomène naturel découvert par Becquerel ; les radioéléments fabriqués par l'homme ont les mêmes propriétés.
  
  Tableau d'ordres de grandeur d'activité : eau de pluie 0,5 Bq/L, lait 70 Bq/L, corps humain 120 Bq/L… ; radium 226, césium 137, plutonium 239 en TBq/kg.
- **Noyau** : nucléons = protons + neutrons. Symbole <sup>A</sup><sub>Z</sub>X : Z protons (qui fixe l'élément), A nucléons, A − Z neutrons.
  
  Exemples : <sup>56</sup><sub>26</sub>Fe (26 p, 30 n), <sup>238</sup><sub>92</sub>U (92 p, 146 n).
- **Isotopes** : même Z, A différents.
- **Activité d'introduction** (page `simulation` ou première étape) : questions de l'activité sur le document (définition avec « noyau instable » et « désintégration », activité et becquerel).
- **Série** : composition d'un noyau, symbole à partir de Z et A, isotopes ou non, tableau de l'ex. 7 à valeurs aléatoires.

### Module 2 : Types de radioactivité et équations

- **Les trois types** (tableau à connaître « par cœur ») :

  | Type | Particule | Exemple |
  |---|---|---|
  | α | noyau d'hélium <sup>4</sup><sub>2</sub>He | <sup>235</sup><sub>92</sub>U → <sup>4</sup><sub>2</sub>He + <sup>231</sup><sub>90</sub>Th |
  | β⁻ | électron <sup>0</sup><sub>−1</sub>e | <sup>14</sup><sub>6</sub>C → <sup>0</sup><sub>−1</sub>e + <sup>14</sup><sub>7</sub>N |
  | β⁺ | positron (positon) <sup>0</sup><sub>1</sub>e | <sup>15</sup><sub>8</sub>O → <sup>0</sup><sub>1</sub>e + <sup>15</sup><sub>7</sub>N |

- **Savoir reconnaître la particule** dans une équation : He, donc α ; e et −1, donc électron ; e et +1, donc positron.
- **Lois de conservation** : même total des A et même total des Z à gauche et à droite (235 = 4 + 231 ; 92 = 2 + 90 ; 14 = 0 + 14 ; 6 = 7 − 1).
- **Rayonnement γ** : onde électromagnétique qui accompagne chaque désintégration. Le noyau fils excité Y* se désexcite : Y* → Y + γ. Très pénétrant et très énergétique (une vingtaine de cm de plomb) ; E = h f (lien avec le chapitre 10).
- **Outil `perso`** : équation de désintégration à trous (A, Z, symbole). L'élève complète les nombres par conservation puis trouve l'élément d'après Z dans une liste d'éléments (extrait de classification). Diagnostic : « la somme des A à droite doit valoir … ».
- **Série** : type de radioactivité d'une équation, particule émise, noyau fils à compléter, élément d'après Z.

### Module 3 : Activité

- **Définition** : nombre moyen de désintégrations par seconde, en **becquerels** (1 Bq = 1 désintégration par seconde).
- **Formule** : A = −dN/dt = −N′ (l'opposé de la dérivée du nombre de noyaux restants).
- **Conversions** : désintégrations par minute → Bq (÷ 60) ; kBq, MBq, TBq.
- **Série** : conversions en Bq, ordres de grandeur.

### Module 4 : Demi-vie

- **Définition** : la demi-vie t<sub>1/2</sub> (ou période radioactive) est la durée au bout de laquelle le nombre de noyaux radioactifs est divisé par 2. Après n demi-vies, il en reste N<sub>0</sub> / 2ⁿ.
- **Méthode graphique** (note manuscrite) :
  1. diviser par 2 la valeur initiale sur l'axe des ordonnées ;
  2. reporter sur la courbe ;
  3. reporter sur l'axe des abscisses : on lit t<sub>1/2</sub>.
  
  Ça s'utilise pareil avec N, A ou la masse m.
- **Outil `perso`** : courbe de décroissance générée (N, A ou m, unités variées). L'élève place la valeur moitié sur l'axe, glisse le repère jusqu'à la courbe puis jusqu'à l'axe des temps ; t<sub>1/2</sub> est validée avec tolérance. Repars des outils de lecture de `lecture-graphique/modules/lgtools.js`.
- **Âge d'un échantillon** par lecture graphique (ex. 6 : 1000 Bq donne 18 000 ans, soit 3 demi-vies).
- **Règle des sujets** : au bout de 10 demi-vies, l'activité est négligeable.
- **Simulation existante** : `decroissance-radioactive/` (désintégrations par itérations). Mets un lien depuis ce module (« Voir la décroissance noyau par noyau »), sans la recopier : elle utilise Chart.js, hors charte.
- **Série** : t<sub>1/2</sub> sur une courbe, nombre restant après n demi-vies, durée pour atteindre N<sub>0</sub>/8.

### Module 5 : Décroissance exponentielle et calcul de t

- **Loi** : N(t) = N<sub>0</sub> e<sup>−λt</sup> (λ constante radioactive, probabilité de désintégration d'un noyau par unité de temps). De même A(t) = A<sub>0</sub> e<sup>−λt</sup> avec A<sub>0</sub> = λ N<sub>0</sub>.
  
  Dérivée : (e<sup>ax</sup>)′ = a e<sup>ax</sup> (ex. 11).
- **Calculer N** : touche e<sup>x</sup> de la calculatrice.
- **Calculer t quand on connaît N** : **même méthode que pour pH = −log([H₃O⁺]/c°) dans l'application pH**. Les étapes du cours :
  1. N<sub>0</sub> e<sup>−λt</sup> = N ;
  2. e<sup>−λt</sup> = N / N<sub>0</sub> (N<sub>0</sub> passe de l'autre côté et divise) ;
  3. −λ t = ln(N / N<sub>0</sub>) (on applique ln, la fonction réciproque de e<sup>x</sup>, aux deux membres) ;
  4. t = ln(N / N<sub>0</sub>) / (−λ).

**Réalisation** (obligatoire, reprends exactement le dispositif de `ph/modules/module_2_cours.html`, étapes 4 et 5) :

- **Démonstration visuelle étape par étape** avec `PH.demo`, puis **« À toi » dans l'éditeur d'équation par glisser-déposer** `PH.Editeur` de `ph/modules/eq.js`.
  - Tuiles N, N<sub>0</sub>, λ, t.
  - Outils : ×(−1), barre de fraction, dénominateur à passer de l'autre côté, ⇄, et deux **nouveaux outils réciproques e<sup>x</sup> et ln**, sur le modèle de 10<sup>x</sup> / log.
  - « Vérifier l'étape » teste l'équation avec des valeurs numériques ; aides progressives comme pour le pH. Exemples :
    - « N<sub>0</sub> multiplie e<sup>−λt</sup> : glisse-le de l'autre côté, il divisera » ;
    - « applique ln, la réciproque de e<sup>x</sup>, aux deux membres ».
  - Diagnostic « tu as appliqué e<sup>x</sup> à une exponentielle : il faut sa fonction réciproque, ln ».
- **Étendre `ph/modules/eq.js`**, sans dupliquer, pour ajouter `exp` et `ln` :
  - constructeur `FN('exp' | 'ln', …)` ;
  - écriture statique e<sup>…</sup> et ln(…) ;
  - évaluation numérique ;
  - inverse dans la règle des réciproques ;
  - noms dans `NOMS_OUTILS`.
  
  **La liste d'outils par défaut ne change pas** (`['neg','p10','log','frac']`) : pH et Puissance active doivent fonctionner exactement comme avant. Vérifie-les avec Playwright après la modification.
- **Ensuite** :
  - même manipulation pour A(t) = A<sub>0</sub> e<sup>−λt</sup> ;
  - application numérique (calculatrice : ln) ;
  - « ✍ Complète ton cours : t = ln(N/N<sub>0</sub>) / (−λ) ».
- **Série** : N à une date donnée, t pour atteindre une fraction donnée (N/N<sub>0</sub> = 0,25…), A(t).
  
  Erreurs : log au lieu de ln, signe de λ oublié, N/N<sub>0</sub> inversé.

### Module 6 : Exercices

Voir plus bas.

## Exercices (ordre de la feuille)

**Ex. 7 p. 155** : tableau complété (O 16, 17, 18 ; Fe 54, 56 ; U 238, 235 ; H 1, 2, 3).

Tableau interactif, une ligne à la fois.

**Ex. 1** (hors manuel) :
- a) α ;
- b) β⁻ ;
- c) α ;
- d) β⁺ ;
- e) α ;
- f) β⁺ ;
- g) β⁻.

**Ex. 2** : β⁺ positron <sup>0</sup><sub>1</sub>e ; α noyau d'hélium ; β⁻ électron.

**Ex. 10 p. 155** :
- a) 120 / 60 = 2,0 Bq ;
- b) 5,0 × 10⁶ / 60 ≈ 8,3 × 10⁴ Bq ;
- c) 6 × 10⁶ / 300 = 2 × 10⁴ Bq.

**Ex. 11 p. 156** :
- a) N = N<sub>0</sub> e<sup>−λt</sup> ;
- b) A = λ N<sub>0</sub> e<sup>−λt</sup> (= λN) ;
- c) A<sub>0</sub> = λ N<sub>0</sub>.

**La correction écrit « N = A<sub>0</sub> e<sup>−λt</sup> » : c'est A = A<sub>0</sub> e<sup>−λt</sup>.**

**Ex. 6 p. 154** :
1. 6 protons, 8 neutrons ;
2. <sup>14</sup><sub>6</sub>C → <sup>14</sup><sub>7</sub>N + <sup>0</sup><sub>−1</sub>e ;
3. T<sub>c</sub> = 6000 ans (A<sub>0</sub>/2 = 4 × 10³ Bq) ;
4. 1000 Bq donne 18 000 ans.

**Ex. 16 p. 156** :
- a) <sup>238</sup><sub>92</sub>U → <sup>234</sup><sub>90</sub>Th + <sup>4</sup><sub>2</sub>He ;
- b) t<sub>1/2</sub> ≈ 4,5 × 10⁹ ans, de l'ordre de l'âge de la Terre.

**Sujet de bac (cobalt 60)** :
- Q1 : α, β⁻, β⁺ (et γ) ; cobalt β⁻, donc électron ;
- Q2 : f = E / h = 2,13 × 10⁻¹³ / 6,63 × 10⁻³⁴ ≈ **3,21 × 10²⁰ Hz**, et λ = c / f ≈ **9,3 × 10⁻¹³ m**.
  
  **La correction écrit 2,06 × 10²² Hz (faux) et ne calcule pas la longueur d'onde demandée.**
- Q3 : A<sub>0</sub> = 41 000 kBq ;
- Q4 : t<sub>1/2</sub> ≈ 5,3 ans (passage de 41 000 à 20 500 kBq) ;
- Q5 : 10 × 5,3 = 53 ans, donc absent de la nature.

**Ex. 17, 18, 19** (supplémentaires), sans correction fournie :
- 17 : iridium 192, A = 192 nucléons, Z = 77 protons ; l'équation de l'énoncé donne <sup>192</sup><sub>76</sub>Os, donc par conservation X = <sup>0</sup><sub>1</sub>e et la radioactivité est **β⁺** ; isotopes ; définition de la demi-vie ;
- 18 : équations du molybdène 99 (β⁻) puis du technétium 99m (γ) ; compositions des trois noyaux ;
- 19 : compositions de Cs 135 et Pu 241 ; pas isotopes ; électron ; conservation ; X = <sup>241</sup><sub>95</sub>Am ; vérifier T = 14 ans sur le graphique ; courbe du césium quasi horizontale.

Vérifie chaque réponse.
