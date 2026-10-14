# Chapitre 14 : Combustions, mise à la charte (prompt de mise à jour)

Lis d'abord `docs/prompts-sti2d/00-commun.md` (sources, charte, structure, livraison).

L'application existe : `combustions/`. **Ne change ni le contenu scientifique ni les fonctionnalités existantes** : ce travail porte sur la **forme** (charte), plus le module d'exercices du support papier que la charte impose.

## Sources (`TSTI2D/14- Combustions/`)

| Fichier | Contenu | À lire |
|---|---|---|
| `Chap14- Cours_complete.pdf` (1 p.) | Cours (exercice type, méthode en 3 étapes, formules, pouvoir calorifique) | Non : l'application le couvre déjà |
| `Chap14- Exercices.pdf` (2 p.) | Ex. 1, 2, 3, 4 (hors manuel) ; 16 p. 178 ; 15 p. 178 ; 21 p. 179 | Oui (extrait de classification de l'ex. 2, tableau des PC de l'ex. 4, encadré « réactif limitant » de l'ex. 15, schéma de la chaudière de l'ex. 21) |
| `Chap14- Exercices correction.pdf` (4 p.) | Corrections tapées des ex. 1 à 4 (page 1) | Page 1 seulement |
| `Chap14- Exercices correction.docx` | **Les corrections manuscrites des ex. 16, 15 et 21 sont des images EMF que le PDF n'affiche pas** (pages 2 à 4 blanches) | Extrais-les : `unzip -o "<docx>" 'word/media/*'` puis `soffice --headless --convert-to png word/media/image1.emf` (et image2, image3). image1 = ex. 16, image2 = ex. 15, image3 = ex. 21 |
| `Chap14- Sujets bac.pdf` (2 p.) + `Chap14- Sujets bac - Correction.pdf` (2 p.) | Exercice 1 « avion » (kérosène), exercice 2 « poêle à bois » | Oui |

## Écarts relevés par rapport à la charte

1. **Exercices du support papier absents (le plus important).** Le module 7 « Exercices complets » tire au hasard 10 exercices générés (`BANQUE.EXERCICES`, `CO.serie`). La charte (§4 « Exercices », §6 « Fiches et exercices ») demande :
   - les exercices du support papier, avec **la même numérotation** ;
   - une liste groupée par thème (`ph-ex-groupe`, `ph-ex-carte`, pastille ✓, « Meilleur score : x / y ») ;
   - un exercice à la fois, la correction détaillée toujours disponible (« Voir la correction », 0 point) ;
   - `exercices`, `exNom`, `nbEx` dans le `PLAN` et `cleEx` dans `SOM.init`.

   **À faire** :
   - créer un nouveau module d'exercices, format de `cinematique/modules/exercices.js` + `module_6.html` (ou `transport-electricite/modules/exercices.js` + `module_4_exercices.html`) ;
   - garder l'actuel module 7 comme **page d'entraînement** (type `entrainement` du `PLAN`, libellé « Entraînement : exercices complets »), sans rien lui retirer ;
   - mettre à jour la numérotation, les badges, les liens de suite et les fiches.
2. **Module 6 « L'exemple du cours, pas à pas » hors moteur commun.**
   - `module_6.html` a son propre enchaînement de cartes (`carte`, `continuer`, `exercer`), sans « Afficher tout le cours » ni bloc « À toi » ; son badge est « MODULE 6 » seul.
   - **À faire** : le réécrire avec `assets/cours.js` (`COURS.Cours`, `c.aToi` avec des parties `perso` qui montent `CO.question`). Même déroulé et mêmes deux exemples (éthanol 23 g, puis méthane 32 g « à ton tour »), badge « MODULE 6 · EXEMPLE ». Le cours sera marqué fait à la dernière étape.
3. **Module 1 sans série notée** (cours seul). Écart mineur : c'est le module de présentation de la méthode. **Ne rien ajouter**, le signaler seulement.
4. **Vérifications de forme à faire page par page** (charte §10) :
   - badges « MODULE N · COURS / QUESTIONS / FICHE RÉCAPITULATIVE / EXEMPLE » ;
   - titres de page ;
   - « Afficher tout le cours » dans le premier « À toi » de chaque cours ;
   - progression (meilleure note) ;
   - sommaire et accueil ;
   - aucun débordement à 390 px.
   
   Corrige ce qui manque.

## Le nouveau module d'exercices

Groupes et ordre de la feuille ; chaque exercice de calcul commence par le **schéma de la méthode** (`CO.schema` de `co.js`). L'élève y place les données de l'énoncé, comme les schémas de `transport-electricite`, puis enchaîne : équation, n = m / M, relation stœchiométrique, m = n × M, énergie.

**Ex. 1** : M(C<sub>6</sub>H<sub>12</sub>O<sub>6</sub>) = 180 g/mol.

**Ex. 2** :
1. Quantités de matière :
   - 2,1 g de Fe : 3,8 × 10⁻² mol ;
   - 3,1 kg de Fe : 56 mol ;
   - 3,1 × 10⁻² g d'Al : 1,1 × 10⁻³ mol ;
   - 3,1 × 10⁻² kg d'Al : 1,1 mol ;
   - 2,1 g de CH<sub>4</sub> : 0,13 mol ;
   - 2,0 mL d'éthanol (ρ = 0,79 g/mL) : m = 1,58 g, n = 3,4 × 10⁻² mol ;
   - 2,0 mL d'eau : 1,1 × 10⁻¹ mol ;
2. M(H<sub>2</sub>O) = 18 g/mol, 10 mol pèsent 180 g ;
3. M(Cu(OH)<sub>2</sub>) = 97,5 g/mol, m ≈ 2,9 g.

Masse volumique m = ρ × V : explique-la dans la correction, l'application ne l'a pas encore.

**Ex. 3** (pentane 5,3 g, PC = 48,6 MJ/kg) :
- C<sub>5</sub>H<sub>12</sub> + 8 O<sub>2</sub> → 5 CO<sub>2</sub> + 6 H<sub>2</sub>O ;
- n = 7,4 × 10⁻² mol ;
- n(CO<sub>2</sub>) = 0,37 mol, m ≈ 16 g ;
- E ≈ 0,26 MJ.

**Ex. 4** :
1. a) 114,5 MJ ; b) 2,88 MJ ; c) 2,0 × 10⁵ MJ ;
2. a) 528 g donc 24,2 MJ ; b) 0,24 g donc 1,2 × 10⁻² MJ ; c) 2,85 × 10³ kg donc 1,21 × 10⁵ MJ.

**Ex. 16 p. 178** (propane 200 g) :
- CO<sub>2</sub> et H<sub>2</sub>O ;
- C<sub>3</sub>H<sub>8</sub> + 5 O<sub>2</sub> → 3 CO<sub>2</sub> + 4 H<sub>2</sub>O ;
- n = 200/44 ≈ 4,55 mol ;
- n(CO<sub>2</sub>) ≈ 13,6 mol ;
- PC = 9,16 / 0,200 ≈ 45,8 MJ/kg.

**Ex. 15 p. 178** (éthanol 92 g, 9 mol de O<sub>2</sub>) :
- équation ;
- n = 2 mol ;
- **réactif limitant** : 2/1 < 9/3, donc l'éthanol (encadré du manuel à reprendre, lien vers `avancement-reaction/`) ;
- 4 mol de CO<sub>2</sub>, 6 mol de H<sub>2</sub>O, soit 176 g et 108 g ;
- E = 28,8 × 0,092 ≈ 2,65 MJ.

**Ex. 21 p. 179** (chaudière à condensation, PC = 802 kJ·mol⁻¹, attention : **par mole**) :
- n(CH<sub>4</sub>) = 6,25 mol ;
- Q<sub>comb</sub> ≈ 5,01 × 10³ kJ ;
- CH<sub>4</sub> + 2 O<sub>2</sub> → CO<sub>2</sub> + 2 H<sub>2</sub>O ;
- n(H<sub>2</sub>O) = 12,5 mol, soit 225 g ;
- Q<sub>liquéfaction</sub> = 2260 × 0,225 ≈ 508,5 kJ (la correction note : « Q<sub>condensation</sub> devrait s'appeler Q<sub>liquéfaction</sub> ») ;
- total ≈ 5,52 × 10³ kJ ;
- gain ≈ 10 %.

**Bac 1 « avion »** :
- pictogramme « inflammable » ;
- 2 C<sub>10</sub>H<sub>22</sub> + 31 O<sub>2</sub> → 20 CO<sub>2</sub> + 22 H<sub>2</sub>O ;
- n<sub>k</sub> = 3521 mol ;
- n(CO<sub>2</sub>) = 10 n<sub>k</sub> ≈ 3,52 × 10⁴ mol ;
- m = 1549 kg en 24 h, donc 36 t en 560 h.

**Bac 2 « poêle à bois »** :
- 2.1 : m = 1 MWh / 4 kWh·kg⁻¹ = 250 kg, M = 162 g/mol, n ≈ 1,5 × 10³ mol ;
- 2.2 : C<sub>6</sub>H<sub>10</sub>O<sub>5</sub> + 6 O<sub>2</sub> → 6 CO<sub>2</sub> + 5 H<sub>2</sub>O. La correction arrondit n avant de multiplier (9 × 10³ mol, donc 396 kg) ; avec n = 1543 mol on trouve ≈ 407 kg. Donne ≈ 4,0 × 10² kg et explique l'arrondi ;
- 2.3 : le bois n'est pas que de la cellulose ; bilan carbone bien plus faible ;
- 3.1 : deux groupes hydroxyle ;
- 3.2 : l'eau pure gèlerait ; le propylène glycol abaisse la température de fusion.

## À signaler au professeur (sans rien changer dans l'application)

- **Cours papier complété** : la note manuscrite écrit « 28,8 × 23 / 10³ = 0,066 MJ » ; c'est **0,66 MJ**. L'application affiche déjà 0,66 MJ.
- **Contenus du cours papier absents de l'application** : n = c × V (concentration) et m = ρ × V. Ajout possible dans le cours du module 3, **seulement si le professeur le demande**.
