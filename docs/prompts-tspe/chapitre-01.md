# Rappels de chimie (prompt de génération)

Lis d'abord `docs/prompts-tspe/00-commun.md` (sources, charte, structure, outils partagés, livraison).

## Application

- Dossier `rappels-chimie/`, nom « Rappels de chimie », `data-matiere="chimie"`, préfixe `rc`, espace de noms `RC` (vérifie qu'ils sont libres).
- Portail : `desc: "Quantité de matière, concentrations, pourcentage massique, dilution, dissolution et tableau d'avancement."` ; `mots` : mole, masse molaire, volume molaire, masse volumique, densité, concentration molaire, concentration massique, titre massique, facteur de dilution, solution mère, solution fille, pipette jaugée, fiole jaugée, réactif limitant, xmax, stœchiométrique, ions, crochets…
- Dessin d'en-tête : `verrerie` s'il existe déjà (créé par `docs/prompts-2nde/10-solutions.md`), sinon crée-le comme ce prompt le décrit.
- **Outil partagé à créer s'il n'existe pas : `DILUTION`** (`assets/dilution.js`, `assets/dilution.css`, §6), sur `PAILLASSE` et `ETAPES`. Il sert aussi à l'application de 2nde `solutions/` (module 2 de `docs/prompts-2nde/10-solutions.md`) : lis ce prompt (§3 à §6) avant de commencer.

## Sources (`01- Revisions chimie/`)

| Fichier | Contenu | À lire |
|---|---|---|
| `Chap01-Cours_revisions_chimie_G3.pdf` (6 p.) | Cours complété à la main | Non : résumé ci-dessous. Page 2 pour la figure de dilution, page 5 pour le tableau d'avancement annoté (flèches de couleur des quantités initiales vers le tableau) |
| `Chap01-Exercices.pdf` (4 p.) | Ex. 1 à 8, réponses en p. 4 | Oui (`pdftotext`) |
| `Chap01-Exercices-correction.pdf` (8 p.) | Corrections manuscrites | Oui |
| `Chap01-Exercice supplementaire.pdf` (2 p.) | « Exercice à questions complexes » (magnésium, montgolfière), avec sa correction tapée | Oui (`pdftotext`) |
| `TP1-fiches methode.pdf` (2 p.) | Fiches méthode dissolution et dilution (gestes dans l'ordre, figures) | Oui, pour les gestes de l'outil `DILUTION` (mêmes fiches qu'en 2nde) |

## Consignes du professeur

- **Ce sont des révisions** : les notions sont connues. L'application est **compacte** et se fait **rapidement**.
- **Pas de cours linéaire** : une **carte mentale** qui présente les grandeurs, reliées par les formules. Toucher une grandeur, un lien ou une formule ouvre plus d'informations.
- **Insister sur les indices** dans les formules (« sur une copie, mettre des indices »).
- Un module **formules** (n, M, m, c, c<sub>m</sub>, V<sub>m</sub>, ρ, d, pourcentage massique) qui insiste sur le **pourcentage massique** : très utilisé ensuite, où l'on demande souvent de le calculer à partir de la concentration molaire, de la masse volumique et de la masse molaire.
- Un module **dilution** : une partie manipulation (choisir le matériel ; schéma avec la pipette jaugée et la fiole jaugée, les noms et valeurs des concentrations et volumes des deux solutions, pour qu'écrire la formule soit simple et s'adapte à **toutes les notations** des exercices), puis une partie questions. **Mise en commun avec la 2nde** (outil `DILUTION`) : seule différence, en Terminale on travaille avec les concentrations **molaire et massique**, en 2nde avec la concentration **massique** seulement.
- Un module **rapide** sur le tableau d'avancement, avec des liens facultatifs vers `equilibrer-reactions/` et `avancement-reaction/` pour ceux qui en ont besoin.
- Un module **dissolution** et calcul des concentrations (en soluté apporté, de chaque ion), avec **beaucoup d'exemples** pour s'entraîner.

## Contenu du cours (résumé)

### Calculs avec la quantité de matière

Trois « liens » (titres du cours) : **g ↔ mol** (masse molaire), **g ↔ mL** (masse volumique, densité, concentration massique), **mL ↔ mol** (volume molaire, concentration molaire).

- **n = m / M** (n en mol, m en g, M en g/mol). Le professeur montre trois façons de l'utiliser : « par cœur » ; **« soit avec les unités : M en g/mol donc M = m / n »** ; isoler la grandeur cherchée (entourée) : n = m / M ⟺ m = n × M ; M = m / n. « Vérifier les unités lors de l'application numérique (même unité à gauche et à droite). »
- **Masse volumique** ρ = m / V, avec indices : **ρ<sub>espèce</sub> = m<sub>espèce</sub> / V<sub>espèce</sub>** (⚠ « sur une copie, mettre des indices »). Unités : m en g ou kg ; V en L, mL, m³ ou cm³ ; ρ en kg/m³ (physique), g/L, g/mL, g/cm³ (chimie). **À connaître : ρ<sub>eau</sub> = 1 g/mL = 1 g/cm³ (« important : g/mL = g/cm³ ») = 1 kg/L = 1000 kg/m³** ; 1 m³ = 1000 L.
- **Densité** d<sub>espèce</sub> = ρ<sub>espèce</sub> / ρ<sub>eau</sub> ; utilisation pratique : d<sub>cyclohexane</sub> = 0,78 donc ρ<sub>cyclohexane</sub> = 0,78 g/mL.
- **Concentration massique** c<sub>m</sub> = m / V, ⚠ **c<sub>m espèce</sub> = m<sub>espèce</sub> / V<sub>solution</sub>** (m en g, V en mL, c<sub>m</sub> en g/mL… ou g/L) ; « parfois notée t (pour titre massique) ». Erreur classique à diagnostiquer : confondre ρ (masse de la solution par volume de solution) et c<sub>m</sub> (masse de l'espèce dissoute par volume de solution).
- **Volume molaire** V<sub>m</sub> = V / n (L/mol) ; « V<sub>m</sub> des gaz : le même pour beaucoup de gaz, 22,4 L/mol (ou 24 L/mol à 20 °C) → voir chapitre gaz parfaits » (dans l'application : « voir Thermodynamique »).
- **Concentration molaire** c = n / V (mol/L), **c<sub>espèce</sub> = n<sub>espèce</sub> / V<sub>solution</sub>**.
- **Concentration molaire ↔ massique : trois méthodes** (le professeur les écrit côte à côte ; « utiliser la masse molaire ») :
  1. **retrouver avec les maths** : c<sub>m</sub> = m / V, or m = n × M, donc c<sub>m</sub> = n × M / V = c × M ;
  2. **retrouver avec les unités** : g/L → mol/L : M en g/mol, donc on divise par M (« on enlève g, on ajoute mol ») : c<sub>m</sub> × 1/M = c ;
  3. **par cœur** : **c<sub>m</sub> = c × M** et **c = c<sub>m</sub> / M**.
- **Pourcentage massique** : « c'est le pourcentage de la masse de l'espèce par rapport à la masse totale » : **% massique = m<sub>espèce</sub> / m<sub>total</sub>** ; « souvent calculé à partir de ρ<sub>solution</sub> » ; « voir exercice 8 → **fondamental** ». Méthode à installer (ex. 8, ammoniac d = 0,95, 28 %) : on raisonne sur **1 L de solution** : m<sub>solution</sub> = ρ<sub>solution</sub> × V = 950 g ; m<sub>NH₃</sub> = 0,28 × 950 = 266 g ; donc c<sub>m</sub> = 266 g/L et c = c<sub>m</sub> / M = 266 / 17 = 15,6 mol/L. Et dans l'autre sens (le plus fréquent au bac) : **% = c × M / ρ<sub>solution</sub>** (c × M donne la masse d'espèce dans 1 L, ρ × 1 L la masse de 1 L de solution, attention aux unités de ρ : g/L).

### Dilution

- Figure du cours : pipette (solution mère) au-dessus d'une fiole (solution fille).
- Deux méthodes encadrées : **facteur de dilution f = c<sub>mère</sub> / c<sub>fille</sub> = V<sub>fille</sub> / V<sub>mère</sub>** ; **OU** conservation de la quantité de matière : **c<sub>mère</sub> × V<sub>mère</sub> = c<sub>fille</sub> × V<sub>fille</sub>** (n<sub>mère</sub> = n<sub>fille</sub>).
- **Protocole à savoir par cœur** (♡, manuscrit) : « Prélever à l'aide d'une **pipette jaugée** 10,0 mL de la solution mère, les introduire dans une **fiole jaugée** de 50,0 mL et **compléter** avec de l'eau distillée jusqu'au trait de jauge. »
- Les notations varient selon les énoncés (c et c′, c<sub>0</sub> et c<sub>1</sub>, c<sub>mère</sub> et c<sub>fille</sub>, V et V<sub>fiole</sub>, S<sub>0</sub> et S<sub>1</sub>…) : c'est pour cela que le schéma de l'outil `DILUTION` porte **les noms de l'énoncé** sur la pipette et la fiole.

### Solutions ioniques

- Solide ionique (empilement d'ions) ; **réaction de dissolution** : l'eau n'intervient pas (elle peut s'écrire au-dessus de la flèche) : CuSO<sub>4</sub>(s) → Cu<sup>2+</sup>(aq) + SO<sub>4</sub><sup>2−</sup>(aq).
- **Concentration en soluté apporté** c<sub>CuSO₄</sub> = n<sub>CuSO₄</sub> / V<sub>solution</sub> ; **concentration d'un ion** entre crochets : [Cu<sup>2+</sup>] (note du professeur : « ions : pas c<sub>Cu²⁺</sub> mais [Cu<sup>2+</sup>] »).
- Coefficient 1 : [Cu<sup>2+</sup>] = [SO<sub>4</sub><sup>2−</sup>] = c<sub>CuSO₄</sub>. Coefficient différent de 1 : CuCl<sub>2</sub>(s) → Cu<sup>2+</sup>(aq) + **2** Cl<sup>−</sup>(aq) donc [Cl<sup>−</sup>] = **2** × c<sub>CuCl₂</sub> (« une mole de CuCl<sub>2</sub> a donné deux moles de Cl<sup>−</sup> »).
- Application corrigée : 3,0 g de Na<sub>2</sub>SO<sub>4</sub> dans 10 mL : Na<sub>2</sub>SO<sub>4</sub> → 2 Na<sup>+</sup> + SO<sub>4</sub><sup>2−</sup> ; c = m / (M × V) = 3,0 / (142 × 10 × 10<sup>−3</sup>) = 2,1 mol·L<sup>−1</sup> (« avec 2 c.s. ») ; [Na<sup>+</sup>] = 4,2 mol·L<sup>−1</sup> ; [SO<sub>4</sub><sup>2−</sup>] = 2,1 mol·L<sup>−1</sup>.

### Transformation chimique

- Réactifs, produits ; **équilibrer** : « placer les premiers coefficients devant les espèces qui contiennent plusieurs éléments différents, finir avec celles qui ne contiennent qu'un seul élément » (C<sub>3</sub>H<sub>8</sub> + 5 O<sub>2</sub> → 3 CO<sub>2</sub> + 4 H<sub>2</sub>O).
- **Tableau d'avancement** (colonnes État, Avancement, une par espèce ; lignes initial / intermédiaire / final, « en mol ») : avancement 0, x, x<sub>max</sub> ; réactifs : n<sub>initial</sub> − coefficient × x ; produits : n<sub>initial</sub> + coefficient × x ; réactif limitant : **une hypothèse par réactif** (« si c'est H<sub>2</sub>, 1 − 2x<sub>max</sub> = 0 ⟺ x<sub>max</sub> = 0,5 mol ; si c'est O<sub>2</sub>, x<sub>max</sub> = 2 mol ») et **x<sub>max</sub> est la plus petite valeur** ; puis les quantités finales.
- **Mélange stœchiométrique** : n<sub>A</sub> / a = n<sub>B</sub> / b (exemple corrigé : 2 H<sup>+</sup> + Mg → H<sub>2</sub> + Mg<sup>2+</sup>, 2 mol de Mg demandent 4 mol de H<sup>+</sup>).

## Plan de l'application (`PLAN`)

L'application est courte : 5 modules de contenu + exercices. Chaque série compte 10 questions ; les fiches sont brèves.

### Module 1 : Carte des grandeurs (page `cours` sur mesure, `module_1_carte.html`)

- **Carte mentale interactive** (SVG, tient sur un écran d'ordinateur ; sur téléphone, carte à l'échelle avec zoom par boutons + / −, ou liste dépliable des mêmes nœuds si la carte est illisible à 390 px) :
  - au centre **n (mol)** ; autour, reliées par leur formule : **m (g)** par **M** (n = m / M) ; **V d'un gaz** par **V<sub>m</sub>** (n = V / V<sub>m</sub>) ; **c (mol/L)** et **V<sub>solution</sub>** (c = n / V) ; **c<sub>m</sub> (g/L)** (c<sub>m</sub> = m / V, c<sub>m</sub> = c × M) ; **ρ** et **d** (ρ = m / V, d = ρ / ρ<sub>eau</sub>) ; **% massique** (m<sub>espèce</sub> / m<sub>total</sub>) ; **[ion]** (dissolution) ; **dilution** (c<sub>mère</sub> V<sub>mère</sub> = c<sub>fille</sub> V<sub>fille</sub>) ; **x<sub>max</sub>** (tableau d'avancement).
  - Trois « territoires » visibles (couleur de fond très légère `--paper-2` / `--cle-bg`, nom écrit) : g ↔ mol, g ↔ mL, mL ↔ mol, comme les titres du cours.
- **Toucher un nœud (grandeur)** : panneau à droite (onglet dessous sur téléphone) avec symbole, nom, unités usuelles et conversions, **indices à écrire** (ρ<sub>espèce</sub>, c<sub>espèce</sub>, V<sub>solution</sub>), pièges (ρ ou c<sub>m</sub> ?), exemple du cours, lien vers le module qui l'entraîne.
- **Toucher un lien (formule)** : la formule et ses deux autres formes (grandeur isolée), les méthodes du professeur (par cœur / avec les unités / avec les maths, voir résumé), un exemple traité, et un **« À toi » court** (2 ou 3 questions, moteur `COURS` en partie `perso` ou parties du moteur de questions) ; un lien réussi se marque sur la carte (✓ discret).
- La page est marquée faite quand chaque lien a été ouvert (compteur « 9 / 12 formules vues ») ; « Afficher tout » ouvre un récapitulatif de toutes les formules (sert aussi de fiche).
- Fiche du module : la carte, imprimable, avec toutes les formules et unités.

### Module 2 : Formules et pourcentage massique

- Cours **court** (2 étapes au plus, moteur `COURS`) : (1) **mettre les indices et isoler la grandeur** (n<sub>Fe</sub> = m<sub>Fe</sub> / M<sub>Fe</sub> ⟺ m<sub>Fe</sub> = …) ; (2) **pourcentage massique** par la méthode « 1 L de solution » (exemple de l'ex. 8, puis le sens inverse % = c × M / ρ<sub>solution</sub>), avec le schéma « 1 L de solution → masse de solution (ρ) → masse d'espèce (%) → quantité (M) → c » à compléter.
- Série (10 questions) : n, m, M ; V gaz avec V<sub>m</sub> ; c et c<sub>m</sub> dans les deux sens (trois méthodes acceptées) ; ρ, d ; **au moins 3 questions de pourcentage massique** (de % vers c, de c vers %, solution commerciale : acide chlorhydrique 37 %, d = 1,19 ; ammoniaque 28 %, d = 0,95 ; acide sulfurique 96 %, d = 1,84 ; acide éthanoïque…) ; une question « formule avec ses indices » (choisir l'écriture juste parmi des écritures sans indice ou avec le mauvais V).
- Diagnostics : V en mL ; ρ confondue avec c<sub>m</sub> ; % non converti (28 au lieu de 0,28) ; d utilisée comme ρ en g/L (0,95 g/L au lieu de 950 g/L) ; c<sub>m</sub> = c / M ; masse molaire mal calculée (coefficient de l'atome oublié).

### Module 3 : Dilution

- **Manipulation** (`module_3_manip.html`, page `entrainement`, outil `DILUTION`, un écran, `00-commun.md` §5) :
  - **Choisir le matériel** pour une dilution donnée dans une liste comme celles des exercices (éprouvettes, pipettes jaugées 5, 10, 20, 25 mL, erlenmeyers, béchers, fioles jaugées 50, 100, 200, 250 mL) : ex. 2 (f = 10, 50 mL → pipette 5,0 mL et fiole 50,0 mL) ; couples justes multiples acceptés.
  - **Schéma des deux solutions** : pipette jaugée (solution mère) et fiole jaugée (solution fille), chacune avec une étiquette à deux lignes « c<sub>…</sub> = … » et « V<sub>…</sub> = … » ; **l'élève place sur le schéma** les données de l'énoncé (étiquettes à glisser, ou toucher puis case), avec **les noms de l'énoncé** (c, c′, V, V<sub>fiole</sub> ; c<sub>0</sub>, c<sub>1</sub>…) ; la formule se construit alors d'elle-même sous le schéma : « c<sub>pipette</sub> × V<sub>pipette</sub> = c<sub>fiole</sub> × V<sub>fiole</sub> » devient « c × V = c′ × V<sub>fiole</sub> », et f = V<sub>fiole</sub> / V<sub>pipette</sub>.
  - **Gestes** de la fiche méthode (réserve dans un bécher, rincer la pipette, prélever au niveau de l'œil, verser dans la fiole, compléter à moitié, agiter, ajuster au trait, boucher et agiter), dans l'ordre, refus expliqués (`ETAPES`) ; dans cette application de révision, les gestes sont **facultatifs** (onglet « Gestes ») : le cœur est le matériel, le schéma et la formule.
  - **Concentration molaire ou massique** au choix de la situation (en 2nde : massique seulement, option de l'outil).
  - Situations (pastilles, dans n'importe quel ordre) : ex. 2 ; ex. 3 (10,0 mL à 1,0 × 10<sup>−2</sup> mol/L dans 250 mL → 4,0 × 10<sup>−4</sup> mol/L, f = 25 ; puis préparer 5,0 × 10<sup>−4</sup> mol/L → f = 20 : 10,0 mL dans 200,0 mL, ou 5,0 / 100,0) ; le protocole manuscrit du cours (10,0 mL dans 50,0 mL) ; 3 situations tirées au hasard.
  - **Rédiger le protocole** : phrase à compléter (« Prélever à l'aide d'une ___ ___ mL de la solution mère, les introduire dans une ___ de ___ mL et compléter avec de l'eau distillée jusqu'au trait de jauge »).
- Cours court (1 étape) avant la manipulation ou bulle ⓘ dans la manipulation : les deux méthodes encadrées et le protocole ♡.
- Série : f, c<sub>fille</sub>, V à prélever, matériel, notations variées, concentration massique après dilution (c<sub>m2</sub> = c<sub>2</sub> × M, ex. 3 : saccharose M = 342 g/mol → 0,17 g/L), dilution d'une solution commerciale (lien avec le module 2). Diagnostics : f inversé, c multipliée par f, éprouvette ou bécher choisis, V<sub>pipette</sub> et V<sub>fiole</sub> échangés.

### Module 4 : Dissolution et concentration des ions

- Cours (2 étapes) : réaction de dissolution (sans eau dans les réactifs) ; c<sub>soluté</sub> et [ion] avec les coefficients (CuSO<sub>4</sub>, CuCl<sub>2</sub>, Na<sub>2</sub>SO<sub>4</sub> corrigé).
- **Atelier d'entraînement** (`module_4_simulation.html`, page `simulation` « Atelier : dissolution ») : un solide ionique tiré dans une banque (NaCl, KCl, CuSO<sub>4</sub>, CuCl<sub>2</sub>, Na<sub>2</sub>SO<sub>4</sub>, FeCl<sub>3</sub>, Al<sub>2</sub>(SO<sub>4</sub>)<sub>3</sub>, K<sub>2</sub>Cr<sub>2</sub>O<sub>7</sub>, KMnO<sub>4</sub>, MgCl<sub>2</sub>, CaCl<sub>2</sub>, Na<sub>3</sub>PO<sub>4</sub>, (NH<sub>4</sub>)<sub>2</sub>SO<sub>4</sub>, Fe<sub>2</sub>(SO<sub>4</sub>)<sub>3</sub>, NaOH…) et une préparation (masse et volume, ou c) : l'élève **écrit l'équation de dissolution** (ions à choisir et coefficients, vérifiés par `MOL` : conservation des atomes et des charges), puis calcule c<sub>soluté</sub> et chaque [ion]. **Entraînement sans fin** (« Autre solide »), compteur de réussites, page faite après 5 réussites. Diagnostics : ion mal formé (Cl<sub>2</sub><sup>−</sup> au lieu de 2 Cl<sup>−</sup>), charge oubliée, coefficient oublié dans [ion], c<sub>soluté</sub> notée [CuSO<sub>4</sub>].
- Série : 10 questions variées (dont l'ex. 15 du chapitre Méthodes physiques en version simplifiée : MgCl<sub>2</sub>, [Cl<sup>−</sup>] = 2c).

### Module 5 : Tableau d'avancement (rapide)

- Cours en une étape : construire le tableau (exemple 2 H<sub>2</sub> + O<sub>2</sub> → 2 H<sub>2</sub>O avec 1 mol et 2 mol, flèches des quantités initiales vers la ligne « initial » comme sur la page 5 du cours), hypothèses de réactif limitant, x<sub>max</sub> la plus petite, état final ; mélange stœchiométrique n<sub>A</sub> / a = n<sub>B</sub> / b.
- **Liens facultatifs** (`00-commun.md` §6, type 1) : « Revois : Équilibrer une réaction » (`equilibrer-reactions/`) et « Revois : Avancement d'une réaction » (`avancement-reaction/`), dans un encadré en tête du cours.
- Série courte : équilibrer (banque de `MOL`), tableau à compléter (ex. 1, valeurs aléatoires), réactif limitant, quantités finales, masse ou volume de produit (V = n × V<sub>m</sub>), proportions stœchiométriques. Réutilise ce qui existe dans `avancement-reaction/modules/` (outils de tableau) plutôt que de le recoder.

### Module 6 : Exercices

Ex. 1 à 8 de la feuille, puis l'exercice supplémentaire « Exercice à questions complexes » (lettre A, titre « Magnésium et montgolfière »).

- Ex. 1 : cinq tableaux (C + O<sub>2</sub> → CO ; C + O<sub>2</sub> → CO<sub>2</sub> ; H<sub>2</sub> + O<sub>2</sub> → H<sub>2</sub>O ; CO + O<sub>2</sub> → CO<sub>2</sub> ; C + CO<sub>2</sub> → CO), à équilibrer puis compléter ; réponses de la feuille p. 4 (à vérifier par script : certaines lignes de la feuille ne correspondent pas à l'ordre des tableaux, corrige d'après les corrections manuscrites).
- Ex. 2, 3 : dilution (avec l'outil `DILUTION` en partie `perso`).
- Ex. 4 à 7 : tableaux d'avancement avec masses, concentrations, volume molaire (réponses p. 4 : n(H<sup>+</sup>) = 0,142 mol, m(Cu) = 178 g, V(O<sub>2</sub>) = 1,2 L, m(O<sub>2</sub>) = 1,9 g…).
- Ex. 8 : pourcentage massique (fondamental) : c<sub>m</sub> = 266 g/L, c = 15,6 mol/L.
- Ex. A (questions complexes) : d'abord les questions telles quelles ; aide « Je ne sais pas par où commencer » (`00-commun.md` §4) : équation, tableau d'avancement, H<sup>+</sup> limitant, x<sub>max</sub> = 2,5 × 10<sup>−2</sup> mol, m(H<sub>2</sub>) = 5,0 × 10<sup>−2</sup> g, V = 0,60 L ; puis l'estimation (montgolfière sphérique de 10 m de diamètre, ≈ 524 m³ → 2,2 × 10<sup>4</sup> mol → 0,53 t de magnésium ; accepter une estimation raisonnable, ordre de grandeur).

## Outil `DILUTION` (partagé avec la 2nde)

- `assets/dilution.js` + `assets/dilution.css`, objet `DILUTION`, plusieurs exemplaires par page :
  - `DILUTION.manip(zone, { situations, concentration: 'massique' | 'molaire' | 'les deux', gestes: true | false | 'facultatifs', materiel, textes, surReussite })` : choix du matériel, schéma pipette → fiole avec données à placer (noms libres de l'énoncé), formule construite, gestes (`ETAPES` + `PAILLASSE`), protocole à compléter ;
  - `DILUTION.schema(zone, { mere: { c, V, noms }, fille: { c, V, noms }, aPlacer })` : le schéma seul, pour les cours, les séries (partie `perso`) et les corrections.
- Dessin avec `PAILLASSE` (pipette jaugée à deux traits, fiole jaugée, bécher de réserve, pissette) : s'il n'existe pas encore, crée `PAILLASSE` comme le décrit `docs/prompts-2nde/10-solutions.md` §6 (seulement les objets utiles à la dilution, l'API prévue pour les autres).
- Aucun texte propre à une application dans l'outil : la 2nde (`solutions/`, module 2) l'utilisera en concentration massique, avec ses notations c<sub>pipette</sub>, V<sub>pipette</sub>, c<sub>fiole</sub>, V<sub>fiole</sub> et les gestes obligatoires.
- Mets à jour `00-commun.md` §9 (états de `DILUTION` et `PAILLASSE`).

## Vérifications propres

- Script : chaque réponse des ex. 1 à 8 et de l'ex. A ; masses molaires de la banque de dissolution ; pourcentages massiques des solutions commerciales (cohérence c, d, %).
- Carte : lisible et utilisable à 1280 × 720 et à 390 px, chaque nœud et chaque lien ouvrent leur panneau, aucun défilement de la page à 1280 × 720.
- `DILUTION` : situations dans le désordre, matériel faux refusé avec explication, notations de l'énoncé reprises dans la formule ; mode massique seul vérifié aussi (pour la 2nde).
