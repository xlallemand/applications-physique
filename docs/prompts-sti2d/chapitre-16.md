# Chapitre 16 : Acides et bases (prompt de génération)

Lis d'abord `docs/prompts-sti2d/00-commun.md` (sources, charte, structure, livraison).

## Application

- Dossier `acides-bases/`, nom « Chapitre 16 : Acides et bases », `data-matiere="chimie"`, préfixe `ab`.
- Portail : desc « Couples acide/base, réactions acido-basiques, pH = −log[H₃O⁺] et quantités de matière. » ; dessin d'en-tête `formules:ph`.

## Sources (`TSTI2D/16- Acides et bases/`)

| Fichier | Contenu | À lire |
|---|---|---|
| `Chap16-Cours-Exercices-complete.pdf` (6 p.) | Pages 1-2 : cours complété ; pages 3-6 : énoncés (ex. 7, 8, 13, 9 p. 201-202 ; 10, 11 p. 202 ; 17, 20 p. 203 ; sujet de bac « Exercice 4 » ; extrait de bac « carottes de glace ») | Pages 3 à 6 seulement (le cours est résumé ci-dessous) |
| `Chap16-Correction-exercices.pdf` (6 p.) | Corrections (manuscrites et tapées) | Oui |
| `TP - Acides bases.pdf` | TP | Non |

Ignore les `.docx` et `Chap16-Cours-Exercices.pdf` (version vierge).

## Contenu du cours

### Module 1 : Acides, bases et couples

- **Définitions** :
  - un **acide** AH peut **libérer** un proton H⁺ : AH → A⁻ + H⁺ ;
  - une **base** A⁻ peut **capter** un proton : A⁻ + H⁺ → AH.
- **Couple** AH/A⁻ et sa **demi-équation** : AH = A⁻ + H⁺. Exemples du cours :
  - H<sub>3</sub>O⁺/H<sub>2</sub>O ;
  - CH<sub>3</sub>COOH/CH<sub>3</sub>COO⁻ ;
  - H<sub>2</sub>O/HO⁻ ;
  - NH<sub>4</sub>⁺/NH<sub>3</sub>.
- **Reconnaître l'acide d'un couple** : astuce manuscrite, « l'acide est celui qui a le plus de H ».
- **Base conjuguée / acide conjugué** : on enlève ou on ajoute un H⁺ (charge −1 ou +1).
- **Ampholyte** : l'eau est acide (H<sub>2</sub>O/HO⁻) et base (H<sub>3</sub>O⁺/H<sub>2</sub>O).
- **Outil `perso`** : à partir d'une formule, construire l'espèce conjuguée avec des boutons « + H⁺ / − H⁺ ». Le nombre de H et la charge s'ajustent, sans clavier.
- **Série** : acide ou base dans un couple, demi-équation, conjugué d'une espèce, couple dans une demi-équation écrite à l'envers (ex. 7.2).
  
  Erreurs : charge oubliée, H⁺ du mauvais côté, acide et base inversés.

### Module 2 : Réactions acido-basiques

- **Principe** : l'acide d'un couple donne un proton à la base d'un autre couple.
  
  Exemple : H<sub>3</sub>O⁺ + CH<sub>3</sub>COO⁻ → H<sub>2</sub>O + CH<sub>3</sub>COOH. Note : « donne H⁺ », « H⁺ vient se coller ici ».
- **Trois méthodes du cours** :
  1. **directe** : on déplace un H⁺ de l'acide vers la base ;
  2. **demi-équations** : on écrit les deux demi-équations dans le bon sens et on les additionne, comme en oxydoréduction (lien vers `oxydoreduction-STI2D/`) ;
  3. **règle du gamma γ** : les deux couples écrits l'un sous l'autre (acide<sub>1</sub>/base<sub>1</sub> au-dessus de acide<sub>2</sub>/base<sub>2</sub>). On entoure les deux réactifs ; le tracé en γ relie chaque réactif à ce qu'il devient.
     - NH<sub>3</sub> + CH<sub>3</sub>COOH → NH<sub>4</sub>⁺ + CH<sub>3</sub>COO⁻ ;
     - NH<sub>4</sub>⁺ + H<sub>2</sub>O → H<sub>3</sub>O⁺ + NH<sub>3</sub>.
- **Outil `perso` « règle du gamma »** : deux couples empilés. L'élève touche les deux réactifs ; le γ se dessine (SVG), puis il complète l'équation par glisser-déposer des espèces. Diagnostics :
  - « deux acides ne réagissent pas ensemble » ;
  - « le réactif d'un couple devient son conjugué ».
- **Reconnaître les couples dans une réaction donnée** :
  - C<sub>9</sub>H<sub>8</sub>O<sub>4</sub> + H<sub>2</sub>O → C<sub>9</sub>H<sub>7</sub>O<sub>4</sub>⁻ + H<sub>3</sub>O⁺ : couples H<sub>3</sub>O⁺/H<sub>2</sub>O et C<sub>9</sub>H<sub>8</sub>O<sub>4</sub>/C<sub>9</sub>H<sub>7</sub>O<sub>4</sub>⁻ ;
  - NH<sub>4</sub>⁺ + PO<sub>4</sub>³⁻ → NH<sub>3</sub> + HPO<sub>4</sub>²⁻ : réactifs et produits étiquetés acide / base ;
  - H<sub>2</sub>CO<sub>3</sub> = HCO<sub>3</sub>⁻ + H⁺ : c'est une demi-équation, un seul couple.
- **Série** : écrire la réaction entre deux espèces (couples donnés), retrouver les couples d'une réaction, autoprotolyse de l'eau (2 H<sub>2</sub>O → H<sub>3</sub>O⁺ + HO⁻).

### Module 3 : Le pH

- **Mesure et échelle** : le pH se mesure avec un **pH-mètre**. Échelle 0-7-14 : acide, neutre, basique.
- **Formules** :
  - pH = −log([H<sub>3</sub>O⁺]), sans dimension, [H<sub>3</sub>O⁺] en mol·L⁻¹ (note : « dans ce chapitre, [H<sub>3</sub>O⁺] et pas c(H<sub>3</sub>O⁺) ») ;
  - réciproque : [H<sub>3</sub>O⁺] = 10<sup>−pH</sup>.
- **Méthode pour passer de l'une à l'autre** : comme dans l'application `ph/` (module 2 du cours), avec `PH.demo` et l'éditeur `PH.Editeur` (`ph/modules/eq.js`), outils ×(−1), 10<sup>x</sup>, log. **Sans c°** : la version STI2D écrit pH = −log([H<sub>3</sub>O⁺]).
  - Configure l'éditeur sans la tuile c° ; s'il faut la rendre facultative, fais-le **sans changer le comportement** de `ph/` ni de `puissance-active/`, et vérifie-les ensuite.
  - Mets un lien vers `ph/` (« Pour aller plus loin »).
- **Exemples du cours** :
  - [H<sub>3</sub>O⁺] = 0,05 donne 1,3 ; 3 × 10⁻² donne 1,5 ; 10⁻⁵ donne 5 ; 1,0 × 10⁻⁴ donne 4 ;
  - pH 3 donne 10⁻³ ; pH 8 donne 10⁻⁸ ; pH 2,5 donne 3,2 × 10⁻³ ; pH 9,4 donne 4,0 × 10⁻¹⁰ mol·L⁻¹.
- **Évolution du pH** :
  - [H<sub>3</sub>O⁺] augmente, donc le pH diminue (et inversement) ;
  - ajout d'un acide : le pH diminue ; ajout d'une base : il augmente ;
  - **dilution** : le pH tend vers 7.
  
  Axe double pH / [H<sub>3</sub>O⁺] à refaire en SVG.
- **Série** : pH ↔ [H<sub>3</sub>O⁺] (une décimale pour le pH, deux chiffres significatifs pour la concentration), sens d'évolution du pH, acide / neutre / basique, lecture d'une échelle de survie (ex. 9).
  
  Erreurs : signe − oublié, log et 10<sup>x</sup> confondus, « plus acide = pH plus grand ».

### Module 4 : Quantités de matière (même méthode que le chapitre 14)

- **Méthode de `combustions/`**, comme au chapitre 15 :
  - l'équation écrite en tête, une colonne par espèce ;
  - les données sous l'espèce connue (m, ou c et V, ou [H<sub>3</sub>O⁺] et V) puis n ;
  - les relations stœchiométriques n<sub>A</sub>/a = n<sub>B</sub>/b ;
  - sous l'espèce cherchée, n puis la grandeur demandée.
  
  **Utilise `assets/schema-methode.js` / `.css`** (outil général décrit dans `chapitre-15.md`, module 3). S'il n'existe pas encore, crée-le comme décrit là-bas, sans toucher à `combustions/`.
- **Formules** :
  - n = m / M ;
  - n = c × V, avec n(H<sub>3</sub>O⁺) = [H<sub>3</sub>O⁺] × V ;
  - V = n / c ;
  - 1 m³ = 1000 L.
- **Exemples** :
  - acide sulfamique : 1,0 g donne 1,0 × 10⁻² mol, puis n(H<sub>3</sub>O⁺) formé par NH<sub>2</sub>SO<sub>3</sub>H + H<sub>2</sub>O → NH<sub>2</sub>SO<sub>3</sub>⁻ + H<sub>3</sub>O⁺ ;
  - détartrage : CaCO<sub>3</sub> + 2 H<sub>3</sub>O⁺ → CO<sub>2</sub> + 3 H<sub>2</sub>O + Ca²⁺, masse de tartre éliminée par n(H<sub>3</sub>O⁺) donné ;
  - bassin du sujet de bac.
- **Série** : n(H<sub>3</sub>O⁺) d'un volume de pH donné, masse de réactif, volume de solution à ajouter.

## Exercices (ordre de la feuille)

**Ex. 7 p. 201** :
1. a) HIO<sub>3</sub> = IO<sub>3</sub>⁻ + H⁺ ; b) C<sub>2</sub>H<sub>4</sub>O<sub>4</sub> = C<sub>2</sub>H<sub>3</sub>O<sub>4</sub>⁻ + H⁺ ; c) NH<sub>4</sub>⁺ = NH<sub>3</sub> + H⁺ ;
2. couples CH<sub>3</sub>COOH/CH<sub>3</sub>COO⁻, CH<sub>3</sub>NH<sub>3</sub>⁺/CH<sub>3</sub>NH<sub>2</sub>, HPO<sub>4</sub>²⁻/PO<sub>4</sub>³⁻.

**Ex. 8 p. 201** :
1. NO<sub>3</sub>⁻ ; H<sub>2</sub>PO<sub>4</sub>⁻ ;
2. HF ; H<sub>2</sub>PO<sub>4</sub>⁻.

**Ex. 10 p. 202** :
- a) H<sub>3</sub>O⁺ + HO⁻ → 2 H<sub>2</sub>O ;
- b) HCOOH + NH<sub>3</sub> → HCOO⁻ + NH<sub>4</sub>⁺ ;
- c) CH<sub>3</sub>COO⁻ + H<sub>3</sub>O⁺ → CH<sub>3</sub>COOH + H<sub>2</sub>O ;
- d) HF + H<sub>2</sub>O → F⁻ + H<sub>3</sub>O⁺.

**Ex. 11 p. 202** : HNO<sub>3</sub> + NH<sub>3</sub> → NO<sub>3</sub>⁻ + NH<sub>4</sub>⁺ ; couples HNO<sub>3</sub>/NO<sub>3</sub>⁻ et NH<sub>4</sub>⁺/NH<sub>3</sub>.

**Ex. 13 p. 202** :
- H<sub>3</sub>O⁺ ; HO⁻ ;
- couples et demi-équations ;
- 2 H<sub>2</sub>O → H<sub>3</sub>O⁺ + HO⁻ (règle du γ) ;
- ampholyte.

**Ex. 9 p. 201** (graphique de survie à refaire en SVG) :
1. brochets pH 5,0, donc 10⁻⁵ ; anguilles 4,4, donc 10⁻⁴·⁴ ; crevettes 5,9, donc 10⁻⁵·⁹ mol·L⁻¹ ;
2. truite 5,0 ; escargot 5,9 ; écrevisse 5,5 ; grenouille 4,0.

**Ex. 17 p. 203** (acide sulfamique) :
- a) n = 1,0 / 97 ≈ 1,0 × 10⁻² mol (schéma de la méthode) ;
- b) définition de Brønsted ;
- c) NH<sub>2</sub>SO<sub>3</sub>⁻ ;
- d) transfert d'un proton ;
- e) NH<sub>2</sub>SO<sub>3</sub>H + H<sub>2</sub>O → NH<sub>2</sub>SO<sub>3</sub>⁻ + H<sub>3</sub>O⁺ ;
- f) H<sub>3</sub>O⁺ ;
- g) de la réaction de l'acide avec l'eau ;
- h) CO<sub>2</sub>, H<sub>2</sub>O, Ca²⁺ : le tartre est éliminé.

**Ex. 20 p. 203** (guppys, 200 L) :
- a) basique ;
- b) incompatible ;
- c) 3,2 × 10⁻⁹ mol·L⁻¹ ;
- d) il faut ajouter l'acide ;
- e) 3,2 × 10⁻⁷ mol·L⁻¹ ;
- f) n<sub>i</sub> = 6,4 × 10⁻⁷ mol, n<sub>f</sub> = 6,4 × 10⁻⁵ mol, n ≈ 6,3 × 10⁻⁵ mol, V = 6,3 mL.
  
  Garde ce raisonnement, celui du corrigé. **Remarque pour le professeur** : il néglige les ions HO⁻ de l'eau à pH 8,5 (≈ 6,4 × 10⁻⁴ mol à neutraliser d'abord, soit environ 64 mL).

**Sujet de bac « Exercice 4 » (maraîcher)** :
1. relever le pH de 0,5 (de 6,1 à 6,6 ; la correction écrit « 6,5 », lapsus), terre argileuse 450 g/m² × 600 m² = 270 kg ;
2. définition d'un acide ;
3. couple H<sub>3</sub>O⁺/H<sub>2</sub>O, acide H<sub>3</sub>O⁺ ;
4. H<sub>3</sub>O⁺ est consommé, donc le pH augmente ;
5. pH-mètre ;
6. pH = −log[H<sub>3</sub>O⁺] ;
7. 10⁻⁵·⁶ ≈ 2,5 × 10⁻⁶ mol·L⁻¹ ;
8. n = 2,5 × 10⁻⁶ × 60 000 L ≈ 0,15 mol (schéma de la méthode) ;
9. m(CaCO<sub>3</sub>) = 1,3 × 100 = 130 g ;
10. très faible devant 270 kg : inutile de traiter l'eau.

**Extrait de bac « carottes de glace »** :
1. définition d'un acide ;
2. HNO<sub>3</sub> + H<sub>2</sub>O → H<sub>3</sub>O⁺ + NO<sub>3</sub>⁻ (règle du γ) ;
3. 10⁻⁶·² ≈ 6,3 × 10⁻⁷ mol·L⁻¹ ;
4. plus de CO<sub>2</sub> donne plus d'acide carbonique, donc plus de H<sub>3</sub>O⁺ et un pH qui baisse ;
5. CO<sub>2</sub> ;
6. énergie dont la source se renouvelle moins vite qu'on la consomme.
