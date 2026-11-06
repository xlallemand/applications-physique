Lis `docs/prompts-2nde/00-commun.md`, puis exécute ce prompt.

# 04 · Atome et ions (A02)

## 1. Application

- Nom : **« Atome et ions »** ; dossier `atome-ions/` ; préfixe `at`, espace de noms `AT` ; `data-matiere="chimie"` ; kicker « Chimie · Seconde ».
- Portail : `dom: 'chimie'`, `desc: "Noyau, configuration électronique, électrons de valence, formation des ions et composés ioniques."`
- Dessin d'en-tête : **nouveau dessin `atome`** dans `assets/hero.js` : noyau au centre, trois cercles de couches en pointillés avec des électrons, et, à droite, les cases 1s 2s 2p 3s 3p alignées le long d'une flèche « Énergie » ; il resservira à `05-classification-periodique.md`.
- Cette application crée l'outil partagé **`ATOME`** (`assets/atome.js`, `assets/atome.css`), réutilisé par `05` et `06`.

## 2. Objectif et programme

Indispensables I4 et I5. Capacités exigibles :
- « Établir l'écriture conventionnelle d'un noyau à partir de sa composition et inversement. »
- « Déterminer les électrons de valence d'un atome (Z ⩽ 18) à partir de sa configuration électronique à l'état fondamental. »
- « Établir le lien entre stabilité chimique et configuration électronique de valence d'un gaz noble. » ; « Déterminer la charge électrique d'ions monoatomiques courants. »
- « Nommer les ions : H<sup>+</sup>, Na<sup>+</sup>, K<sup>+</sup>, Ca<sup>2+</sup>, Mg<sup>2+</sup>, Cl<sup>−</sup>, F<sup>−</sup> ; écrire leur formule à partir de leur nom. » (ici sans K<sup>+</sup> ni Ca<sup>2+</sup>, voir le choix plus bas)
- « Utiliser le terme adapté parmi molécule, atome, anion et cation pour qualifier une entité chimique à partir d'une formule chimique donnée. »
- « Exploiter l'électroneutralité de la matière pour associer des espèces ioniques et citer des formules de composés ioniques. »

## 3. Ce que dit le cours

Sources : `03- Atomes et ions/Chap04-Cours complete.pdf` (chapitre 3, 4 p.), `Chap04-Fiche1-ions complete.docx`, `Chap04-Exercices.pdf`, `Devoir.pdf` ; `04- Entites plus stables/Chap04-Cours-fiche-exos complete.pdf` p. 1 à 6 et 9 à 10, `TP1 - Mendeleiev complete.docx` (questions 5 et 6), `Devoir.pdf`.

**Choix de l'enseignant** : les deux dessins de l'atome (cercles des couches et cases des sous-couches) **côte à côte, qui se remplissent ensemble** ; **Z ⩽ 18 strictement** (K et Ca sont traités dans l'application `05-classification-periodique`) ; **formules des composés ioniques dans le module 4**.

- **Constituants** : le noyau, constitué de **nucléons** : les protons (charge +e, « l'opposé de la charge d'un électron ») et les neutrons (neutres, charge nulle) ; des électrons qui tournent autour du noyau, de charge −e ; « e : charge qui se mesure en Coulomb (C) ». L'atome est électriquement neutre : autant d'électrons que de protons.
- **Écriture conventionnelle** <sup>A</sup><sub>Z</sub>X : X symbole chimique ; **Z numéro atomique = nombre de protons** ; **A nombre de nucléons** (protons + neutrons) ; nombre de neutrons **A − Z** ; nombre d'électrons **Z** (car l'atome est neutre). Rédaction du cours : « le fer <sup>56</sup><sub>26</sub>Fe a 26 protons, 56 − 26 = 30 neutrons, 26 électrons (car neutre) » ; « L'azote a 7 protons et 7 neutrons : <sup>14</sup><sub>7</sub>N » ; « Le fluor a 9 protons et 19 nucléons : <sup>19</sup><sub>9</sub>F ». Correction : « O : 1s<sup>2</sup> 2s<sup>2</sup> 2p<sup>4</sup> a 8 électrons donc 8 protons (car il est neutre) donc Z = 8 ».
- **Élément** : ensemble des espèces de même Z ; il peut être sous forme d'atomes (neutres), d'ions (chargés, « en ayant gagné ou perdu un ou des électrons ») ou de molécules. Ion chargé positivement : **cation** ; négativement : **anion**.
- **Ions (fiche 1 et cours p. 3)** : perdre un électron → charge + (X<sup>+</sup>) ; gagner un électron → charge − (X<sup>−</sup>) ; plusieurs : « nombre **devant** le signe » (X<sup>2+</sup>, X<sup>3−</sup>) ; avertissement du professeur : « ⚠ enlève → + ; ajoute → − : à l'envers » ; valeur de la charge : Cu<sup>2+</sup> → 2e, F<sup>−</sup> → −e, O<sup>2−</sup> → −2e, Fe<sup>3+</sup> → 3e (« Cu<sup>2+</sup> a perdu 2 électrons ») ; e est donnée dans l'énoncé en coulombs (e = 1,60 × 10<sup>−19</sup> C).
  - Fiche 1, lithium (3 protons, 3 électrons, 4 neutrons) : charge du noyau 3e (+ 4 × 0) ; charge des électrons 3 × (−e) = −3e ; charge de l'atome 0 (3e − 3e) ; s'il gagne un électron : −e (« un électron en trop »), anion ; s'il en perd un : +e, cation.
  - Tableau de la fiche 1 (protons, électrons, neutrons) : <sup>19</sup><sub>9</sub>F 9 / 9 / 10 ; <sup>19</sup><sub>9</sub>F<sup>−</sup> 9 / 10 / 10 ; <sup>16</sup><sub>8</sub>O 8 / 8 / 8 ; <sup>16</sup><sub>8</sub>O<sup>2−</sup> 8 / 10 / 8 ; <sup>7</sup><sub>3</sub>Li 3 / 3 / 4 ; <sup>7</sup><sub>3</sub>Li<sup>+</sup> 3 / 2 / 4 ; <sup>9</sup><sub>4</sub>Be 4 / 4 / 5 ; <sup>9</sup><sub>4</sub>Be<sup>2+</sup> 4 / 2 / 5 ; et dans l'autre sens (9 / 10 / 10 → <sup>19</sup><sub>9</sub>F<sup>−</sup>).
- **Couches et sous-couches** (chapitre 4 p. 1) : les électrons se répartissent en couches **n = 1, 2, 3** (cercles en pointillés autour du noyau, de plus en plus éloignés) ; chaque couche a une ou plusieurs sous-couches (s, p, d) ; cases **1s | 2s 2p | 3s 3p 3d** le long d'une flèche « Énergie », regroupées par couche ; « les sous-couches se remplissent dans l'ordre, les unes après les autres » ; nombre maximum d'électrons : **s : 2 ; p : 6** (d : 10).
- **Configuration électronique** : « on écrit chaque sous-couche avec le nombre d'électrons qu'elle contient en exposant » : 1s<sup>2</sup> 2s<sup>2</sup> 2p<sup>6</sup> 3s<sup>2</sup> 3p<sup>6</sup>. Le TP1 l'écrit aussi en cases (nombre d'électrons sous chaque case) et fait « stabiloter les cases de la dernière couche qui contient des électrons » (couche « remplie complètement », « partiellement », « vide »).
- **Électrons de valence** : « ceux de la dernière couche qui a des électrons » (= « ceux qui sont à la surface de l'atome ») ; ils sont **entourés** dans le cours ; « ce sont ceux qui vont permettre les réactions chimiques (les autres sont cachés dans l'atome et ne feront jamais rien) ». Exemples corrigés : 3 électrons : 1s<sup>2</sup> 2s<sup>1</sup>, 1 électron de valence ; 11 électrons : … 3s<sup>1</sup>, 1 ; carbone Z = 6 : 1s<sup>2</sup> 2s<sup>2</sup> 2p<sup>2</sup>, 4 ; <sup>27</sup><sub>13</sub>Al : 13 électrons, … 3s<sup>2</sup> 3p<sup>1</sup>, 3 ; <sup>32</sup><sub>16</sub>S : 16 électrons, … 3s<sup>2</sup> 3p<sup>4</sup>, 6 ; 1s<sup>2</sup> 2s<sup>2</sup> 2p<sup>5</sup> : 9 électrons et 7 de valence.
  - **Ne reprends pas** deux exemples erronés du cours : « <sup>24</sup><sub>24</sub>Mg » (corrigé avec 24 électrons et 3d<sup>6</sup> ; le magnésium a Z = 12) et « 1s<sup>1</sup> 2s<sup>2</sup> » (pas un état fondamental).
- **Règle de stabilité** : « Les gaz nobles sont des éléments très stables qui ne participent à aucune réaction chimique. Les autres éléments tendent à obtenir la même configuration électronique que celle d'un gaz noble. » **Formation d'ions** : « un atome peut perdre ou gagner des électrons pour obtenir la configuration électronique du gaz noble le plus proche. Il forme ainsi un ion stable. » Configuration qui termine en **1s<sup>2</sup>, comme He → règle du duet**, ou en **ns<sup>2</sup> np<sup>6</sup>, comme Ne (n = 2) et Ar (n = 3) → règle de l'octet**. Exemples corrigés : F → F<sup>−</sup> : 1s<sup>2</sup> 2s<sup>2</sup> 2p<sup>6</sup> ; Li → Li<sup>+</sup> : 1s<sup>2</sup> ; S → S<sup>2−</sup> : … 3s<sup>2</sup> 3p<sup>6</sup>. Le cours écrit « Ca de configuration 1s<sup>2</sup> 2s<sup>2</sup> 2p<sup>6</sup> 3s<sup>2</sup> » (c'est celle du magnésium) : utilise **Mg → Mg<sup>2+</sup> : 1s<sup>2</sup> 2s<sup>2</sup> 2p<sup>6</sup>**.
- Fiche « formation des ions » (chapitre 4 p. 5-6) : tableau He, Ne, Ar, Li, Be, Na, Mg, F, O (Z = 2, 10, 18, 3, 4, 11, 12, 9, 8) avec les configurations des atomes et des ions Li<sup>+</sup>, Be<sup>2+</sup>, Na<sup>+</sup>, Mg<sup>2+</sup>, F<sup>−</sup>, O<sup>2−</sup> ; « comparez avec He, Ne, Ar » ; « combien d'électrons de valence les ions stables possèdent-ils ? » (2 ou 8). Application 2 : F<sup>+</sup>, F<sup>2+</sup>, F<sup>−</sup>, F<sup>2−</sup>, Al<sup>3−</sup> … Al<sup>3+</sup> : configuration, stable ou non. Devoir : Na, Na<sup>−</sup>, Na<sup>+</sup> : « Cet ion existe-t-il ? ».
- **Noms d'ions à connaître** : H<sup>+</sup> ion hydrogène, Na<sup>+</sup> ion sodium, Mg<sup>2+</sup> ion magnésium, F<sup>−</sup> ion fluorure, Cl<sup>−</sup> ion chlorure (K<sup>+</sup> et Ca<sup>2+</sup> : application `05`).
- **Composés ioniques** (chapitre 3 p. 4) : principe d'**électroneutralité** : « tout échantillon de matière est électriquement neutre » ; formule : « symboles des cations puis ceux des anions, avec en indice le plus petit nombre entier de chacun d'entre eux (sauf s'il est égal à 1), afin que la charge globale soit nulle » ; nom : « nom de l'anion (nom de l'élément avec la terminaison « ure »), puis nom du cation, puis si besoin un numéro donnant la charge du cation ». Exemples corrigés : NaCl ; CaF<sub>2</sub> (« 2⊕ + 2 × ⊖ = 0 ») ; CuSO<sub>4</sub> (« charge 2⊕ + 2⊖ = 0 ») ; KCl chlorure de potassium ; FeCl<sub>2</sub> chlorure de fer II ; FeCl<sub>3</sub> chlorure de fer III ; Cu(OH)<sub>2</sub> hydroxyde de cuivre. Devoir : « CaF<sub>2</sub> […] F forme l'ion F<sup>−</sup> : quel est l'ion formé par le calcium ? ». Dans ce module, les ions sont **donnés avec leur charge** : les exemples du cours (avec Ca<sup>2+</sup>, K<sup>+</sup>, Fe<sup>3+</sup>, Cu<sup>2+</sup>, SO<sub>4</sub><sup>2−</sup>, OH<sup>−</sup>) restent utilisables.

## 4. Plan de l'application (`PLAN`)

### Module 1 : Construire un atome (simulation, `module_1_simulation.html`)

- Choix de l'élément (Z = 1 à 18 : boutons − / + sur Z, ou grille des symboles) : le noyau s'affiche avec Z protons (⊕) et A − Z neutrons (A usuel, voir `ATOME`), et son écriture <sup>A</sup><sub>Z</sub>X.
- **Deux dessins côte à côte qui se remplissent ensemble** : à gauche les cercles n = 1, 2, 3 autour du noyau ; à droite les cases 1s | 2s 2p | 3s 3p | 3d (3d grisée, avec une bulle ⓘ : « Pour les 18 premiers éléments, la sous-couche 3d reste vide. ») sous une flèche « Énergie ».
- L'élève ajoute les électrons **un à un** : bouton « + électron », ou glisser un électron depuis la réserve vers une case (ou vers un cercle). Chaque électron apparaît en même temps sur son cercle et dans sa case ; la configuration s'écrit en direct (1s<sup>2</sup> 2s<sup>2</sup> 2p<sup>6</sup> 3s<sup>1</sup>), le compteur « électrons : 11 / protons : 11 » se met à jour.
- Une fois l'atome complet : la dernière couche qui a des électrons est **entourée** sur les deux dessins et dans la configuration, et « électrons de valence : 1 » s'affiche.
- Refus expliqués (rien ne change) :
  - case pleine : « La sous-couche 2s est pleine : une sous-couche s contient au plus 2 électrons (p : 6). » ;
  - case sautée : « Les sous-couches se remplissent dans l'ordre : 1s, 2s, 2p, 3s, 3p. Remplis d'abord 2s. » ;
  - plus d'électrons que de protons : « L'atome a autant d'électrons que de protons. Avec un électron de plus, ce serait un ion : voir le module 3. »
- Déroulé guidé : 1. construis l'hydrogène, puis l'hélium ; 2. le lithium : la couche n = 1 est pleine ; 3. le néon : couche n = 2 pleine ; 4. le sodium : entoure les électrons de valence (l'élève touche la couche externe avant que l'application l'entoure) ; 5. défi : construis le soufre <sup>32</sup><sub>16</sub>S et donne son nombre d'électrons de valence.

### Module 2 : Configuration électronique (série notée sur 20, `module_2_questions.html`)

Groupes (10 questions) :
- **Noyau** : de <sup>A</sup><sub>Z</sub>X aux nombres de protons, neutrons, électrons, et l'inverse (tableau de la fiche 1).
- **De Z à la configuration** (Z, <sup>A</sup><sub>Z</sub>X ou nombre d'électrons donné) : l'élève pose les sous-couches dans l'ordre (étiquettes 1s, 2s, 2p, 3s, 3p à glisser dans une ligne, ou à toucher) et règle chaque exposant avec − / + (aucun clavier) ; puis le nombre d'électrons de valence.
- **De la configuration à Z et à l'élément** : nombre d'électrons, Z (« car il est neutre »), nom de l'élément (choix dans une liste).
- **Électrons de valence** d'une configuration donnée.
- Erreurs à diagnostiquer :
  - ordre de remplissage (2p avant 2s, 3s sauté) ;
  - nombre maximal dépassé (2s<sup>3</sup>, 2p<sup>7</sup>) ;
  - total différent de Z : « Ta configuration contient 12 électrons ; l'atome en a Z = 11. » ;
  - **A pris pour Z** : « Tu as utilisé A = 27 : le nombre d'électrons d'un atome est Z (ici 13). » ;
  - valence comptée sur la dernière sous-couche seulement (3p<sup>1</sup> → 1) : « Les électrons de valence sont ceux de toute la dernière couche : 3s et 3p. » ;
  - valence = tous les électrons.

### Module 3 : Former un ion (simulation, `module_3_simulation.html`)

- L'atome (Z ⩽ 18) est dessiné avec ses charges : les ⊕ du noyau et les électrons ⊖ **se compensent deux à deux** (chaque électron relié à un proton par un trait discret, ou rangés en paires dans un compteur à côté). Les deux dessins (cercles et cases) restent affichés.
- L'élève **retire** un électron de la couche externe (le glisser hors de l'atome, ou bouton « − électron ») ou en **ajoute** un (bouton « + électron ») : un ⊕ (ou un ⊖) reste sans partenaire, la **charge restante** s'affiche (+e, +2e, −e…) et la **formule** s'écrit (Na<sup>+</sup>, Mg<sup>2+</sup>, Cl<sup>−</sup>, O<sup>2−</sup>) ; le noyau ne change pas (« même nombre de protons : c'est toujours l'élément sodium »).
- Refus : retirer un électron d'une couche interne (« On retire les électrons de la couche externe. »).
- Rappel visible pendant la manipulation : « On **enlève** un électron → charge **+** ; on **ajoute** un électron → charge **−** (à l'envers !). »
- Indicateur « gaz noble le plus proche » : les configurations de He, Ne et Ar sont affichées ; quand la configuration de l'ion finit en 1s<sup>2</sup> ou en ns<sup>2</sup> np<sup>6</sup>, un badge « stable : même configuration que Ne (règle de l'octet) » ou « … que He (règle du duet) » apparaît ; sinon « cet ion n'est pas stable ».
- Déroulé guidé : 1. lithium : enlève 1 électron → Li<sup>+</sup>, cation, configuration de He ; 2. fluor : ajoute 1 électron → F<sup>−</sup>, anion ; 3. sodium : **deux chemins** affichés (perdre 1 électron pour avoir la configuration de Ne, ou en gagner 7 pour celle de Ar) : l'élève choisit et explique « le gaz noble le plus proche » ; 4. magnésium et oxygène ; 5. Li<sup>−</sup>, Li<sup>2+</sup> (fiche 1) : ces ions ne sont pas stables ; 6. noms des ions à connaître (H<sup>+</sup>, Na<sup>+</sup>, Mg<sup>2+</sup>, F<sup>−</sup>, Cl<sup>−</sup>).

### Module 4 : Ions : entraînement (série notée sur 20, `module_4_questions.html`)

Groupes :
- **Prévoir l'ion stable** d'un élément (H<sup>+</sup>, Li<sup>+</sup>, Be<sup>2+</sup>, Na<sup>+</sup>, Mg<sup>2+</sup>, Al<sup>3+</sup>, F<sup>−</sup>, Cl<sup>−</sup>, O<sup>2−</sup>, S<sup>2−</sup>) à partir de sa configuration : formule de l'ion, puis sa configuration.
- **Cet ion existe-t-il ?** (Na<sup>−</sup>, Na<sup>+</sup>, F<sup>2−</sup>, Al<sup>2+</sup>…) : configuration, puis oui / non avec la raison.
- **Protons, électrons, neutrons** d'un atome ou d'un ion (<sup>A</sup><sub>Z</sub>X<sup>q</sup>), et l'inverse ; erreur : électrons d'un cation comptés en ajoutant (« Mg<sup>2+</sup> a **perdu** 2 électrons : 12 − 2 = 10. »).
- **Charge** : en e (2e, −e) puis en coulombs avec e = 1,60 × 10<sup>−19</sup> C.
- **Atome, molécule, cation ou anion** d'après une formule (Na, Cl<sup>−</sup>, H<sub>2</sub>O, Mg<sup>2+</sup>, O<sub>2</sub>, Ne…).
- **Noms et formules** des ions à connaître (sans K<sup>+</sup> ni Ca<sup>2+</sup>).
- **Composés ioniques** : formule à partir des ions (électroneutralité, indices les plus petits), nom à partir de la formule, ion manquant à partir de la formule (CaF<sub>2</sub> et F<sup>−</sup> → Ca<sup>2+</sup>) ; erreurs : charges recopiées dans la formule (« Ca<sup>2+</sup>F<sup>−</sup><sub>2</sub> »), indices inversés (Ca<sub>2</sub>F), anion écrit en premier, nom dans le mauvais ordre (« sodium chlorure »).

## 5. Rendu

- SVG. Noyau : disque `--ink` (agrandi dans les modules 1 et 3 pour montrer les ⊕ et les neutrons) ; couches : cercles pointillés `--paper-3` épaissis et nommés (n = 1, 2, 3) ; électrons : petits disques `--accent` avec « − » ; protons : disques avec « + » ; neutrons : disques clairs `--paper-2`. Pas de rouge ni de vert pour les charges (réservés au juste / faux) : les signes sont écrits.
- Cases : rectangles arrondis `--line` avec le nom de la sous-couche, électrons en points dedans et nombre dessous ; couche externe entourée en `--accent` (comme le trait du cours).
- Configuration écrite en grand (`font-variant-numeric: tabular-nums`, exposants `<sup>`).
- 1280 px : les deux dessins côte à côte, commandes dessous ; 390 px : cercles au-dessus, cases dessous (toujours visibles ensemble sans défiler, quitte à réduire), commandes en bas.

## 6. Outils

- **À créer : `ATOME`** (`assets/atome.js`, `assets/atome.css`), plusieurs exemplaires par page :
  - données des éléments **Z = 1 à 20** (pour `05`) : `{ Z, sym, nom, A, famille, ion, liaisons, doubletsNonLiants }` (A usuel : H 1, He 4, Li 7, Be 9, B 11, C 12, N 14, O 16, F 19, Ne 20, Na 23, Mg 24, Al 27, Si 28, P 31, S 32, Cl 35, Ar 40, K 39, Ca 40 ; noms : hydrogène, hélium, lithium, béryllium, bore, carbone, azote, oxygène, fluor, néon, sodium, magnésium, aluminium, silicium, phosphore, soufre, chlore, argon, potassium, calcium ; familles : alcalins, halogènes, gaz nobles ; liaisons et doublets non liants du TP2, pour `05` et `06` : H 1/0, C 4/0, N 3/1, O 2/2, F 1/3, Si 4/0, P 3/1, S 2/2, Cl 1/3) ;
  - `ATOME.config(nbElectrons)` → `[['1s', 2], ['2s', 2], …]`, `ATOME.configHTML(…)`, `ATOME.valence(config)`, `ATOME.ionStable(Z)`, `ATOME.gazNobleProche(nbElectrons)` ;
  - `ATOME.dessin(zone, { Z, electrons, mode: 'couches' | 'cases' | 'deux', charges, interactif, onChange })` → `{ ajouter(), retirer(), etat(), maj() }` avec les refus en options de texte.
  - Données au-delà de Z = 18 : configuration jusqu'à 4s seulement (K, Ca), utilisée par aucune page de cette application.
- `assets/dragdrop.js`, `BULLE` (créée par `01`).

## 7. Vérifications propres

- Script : configuration et électrons de valence de Z = 1 à 18 ; ions stables ; nombres du tableau de la fiche 1 ; formules des composés ioniques du cours (indices les plus petits, charge nulle).
- Les deux dessins restent synchronisés après chaque ajout, retrait, refus et « Recommencer ».
- Chaque refus du module 1 et chaque diagnostic des modules 2 et 4 se déclenchent sur un cas forcé.
- Glisser un électron au doigt (CDP) vers une case et hors de l'atome ; boutons + / − seuls.

## 8. Hors périmètre

- Pas de K ni de Ca (ni configuration en 4s), pas de 3d, pas de règle de Klechkowski (exercice 8 hors programme).
- Pas de masse de l'atome, pas de taille de l'atome, pas d'histoire des modèles (TP1 du chapitre 3).
- Pas de tableau périodique (application `05`), pas de schéma de Lewis (application `06`).
