# Synthèse organique (prompt de génération)

Lis d'abord `docs/prompts-tspe/00-commun.md` (sources, charte, structure, outils partagés, livraison).

## Application

- Dossier `synthese-organique/`, nom « Synthèse organique », `data-matiere="chimie"`, préfixe `sor` (`so` est celui de l'application de 2nde `solutions/`), espace de noms `SOR`.
- Portail : `desc: "Optimiser une synthèse, rendement, montages et techniques, catégories de réactions, protection, synthèse multi-étapes, chimie verte."` ; `mots` : rendement, catalyseur, excès, chauffage à reflux, réfrigérant, Dean-Stark, ampoule à décanter, phase organique, phase aqueuse, relargage, séchage, sulfate de magnésium anhydre, distillation, évaporateur rotatif, büchner, recristallisation, chromatographie sur colonne, CCM, banc Kofler, température de fusion, substitution, addition, élimination, oxydoréduction, acide-base, protection, déprotection, polymère, chimie verte, utilisation atomique…
- Dessin d'en-tête : `verrerie` (créé par `docs/prompts-2nde/10-solutions.md` ou `chapitre-01.md`) ou `topologique` (créé par `nomenclature/`).
- **Outils partagés avec la 2nde** (consigne du professeur, §« Mise en commun ») : `PAILLASSE`, `ETAPES`, `CCM` (`chromatographie/modules/ccm.js`, chargé depuis son dossier) et **`SYNTHESE`** (montage à reflux, ampoule à décanter : à créer ici ou par `docs/prompts-2nde/12-synthese.md`, le premier exécuté). Autres outils : `ORGA` (molécules, groupes caractéristiques, catégories de réactions), `MOL`, outils de tableau d'avancement existants, `BULLE`, `PLEIN`.

## Sources (`21- Synthese organique/`)

| Fichier | Contenu | À lire |
|---|---|---|
| `Chap21-Cours Synthese organique complete.pdf` (7 p.) | Cours tapé, complété à la main | Non : résumé ci-dessous. Pages 2 à 4 pour les figures des montages et techniques, 5 et 6 pour les réactions (exemples dessinés), 7 (chimie verte, Lazabémide) |
| `Chap21-Exercices.pdf` (8 p.) | Ex. 1 à 12 (1 conditions expérimentales de la synthèse d'un arôme de banane ; 2 protocoles ; 3 sujet Métropole septembre 2022 ; 4, 5 catégories de réactions ; 6 protection / déprotection ; 7 synthèse d'un alcène ; 8 à 11 séquences réactionnelles ; 12) | Oui |
| `Chap21-Exercices_correction.pdf` (5 p.) | Corrections | Oui (ex. 3 : la correction est sur labolycee.org selon l'énoncé ; si elle n'est pas dans le fichier, rédige-la et vérifie chaque valeur) |

## Consignes du professeur

- **Insister sur les calculs de rendement**, en utilisant des **grandeurs variées pour calculer les quantités de matière** (masse, concentration, masse volumique, densité…).
- **Chromatographie** : **donner le lien vers l'application `chromatographie/`** (lien facultatif, type 1 : rappel de 2nde).
- **Mise en commun avec la 2nde** : des modules similaires seront exploités dans l'application de 2nde `synthese/` (`docs/prompts-2nde/12-synthese.md` : montage à reflux, chauffage à reflux, ampoule à décanter, CCM, synthèse de l'acétate d'isoamyle) : les outils sont communs (voir plus bas).

## Contenu du cours (résumé)

### I. Optimiser une synthèse

- **Vitesse de formation** : catalyseur (absent de l'équation, introduit en petite quantité sans mesure précise : « quelques gouttes d'acide sulfurique ») ; température (chauffage à reflux) ; concentration des réactifs.
- **Rendement** : **r = m<sub>obtenue</sub>/m<sub>attendue</sub> = n<sub>obtenue</sub>/n<sub>attendue</sub>**. L'augmenter : **excès d'un réactif** ou **élimination d'un produit** (évaporation, Dean-Stark) ; justification avec Q = [produits]/[réactifs] : Q diminue, la réaction avance dans le sens direct pour que Q remonte vers K : on déplace l'équilibre.
- **Calcul de n<sub>attendu</sub>** (rappels manuscrits) : n<sub>réactifs</sub> : avec m : n = m/M ; avec c et V<sub>solution</sub> : n = c × V<sub>sol</sub> ; avec V<sub>réactif</sub> et ρ<sub>réactif</sub> (ou d<sub>réactif</sub>) : **« IMPORTANT » : 1. calculer m = ρ × V ; 2. puis n = m/M** ; « ρ = d en g/mL » ; n<sub>produits</sub> : tableau d'avancement, réactif limitant, x<sub>max</sub>. **n<sub>obtenu</sub>** : par m<sub>obtenue</sub> (n = m/M) ou V<sub>obtenu</sub> (m = ρV puis n = m/M).
- **Trois étapes** : **transformation**, **traitement** (purifier le produit d'intérêt : réactifs restants, sous-produits), **identification** (le bon produit, pur).
- **Transformation** : **chauffage à reflux** (réfrigérant à boules, ampoule de coulée pour ajouter progressivement un réactif, ballon bicol, chauffe-ballon, support élévateur ; « arrivée d'eau toujours en bas, sortie toujours en haut » ; questions classiques « principe du chauffage à reflux ? » et « ses avantages ? » : chauffer sans perte de matière, accélérer la réaction) ; **réfrigérant à air** (si on ne chauffe pas trop : erlenmeyer, agitateur magnétique chauffant).
- **Traitement** : **ampoule à décanter** (deux solvants non miscibles, phase la moins dense en haut ; « alourdir » la phase aqueuse avec du sel) ; **séchage** de la phase organique (sulfate de magnésium anhydre, poudre blanche qui capte l'eau → pâte hydratée, puis filtration) ; **distillation** (colonne, réfrigérant, distillat) ; **évaporateur rotatif** (pression réduite) ; **filtration sur büchner** (trompe à eau, fiole à vide ; séchage à l'étuve 80 °C ou entre deux papiers filtres) ; **recristallisation** (produit soluble à chaud, insoluble à froid ; impuretés solubles à chaud et à froid ; vidéos facultatives : https://www.youtube.com/watch?v=3wKTiLfnSNs et https://www.youtube.com/watch?v=2ShPhUtNcus) ; **chromatographie sur colonne** (silice, éluant ; vidéo facultative https://www.youtube.com/watch?v=S-CDbA8tYKM, à partir de 8 min 20).
- **Identification** : **CCM** (dépôts R1 réactif, M0 milieu au début, M30 au bout de 30 min, P<sub>ref</sub> produit de référence ; lecture du résultat) ; spectroscopies IR et RMN ; **température de fusion** au **banc Kofler** (indication de pureté ; vidéo facultative https://www.youtube.com/watch?v=5UKnz8klOJ4).

### II. Stratégies de synthèse multi-étapes

- **Catégories de réactions** : **substitution** (un atome ou groupe remplacé par un autre : acide salicylique + acide éthanoïque → aspirine + eau, –H remplacé par –COCH<sub>3</sub>) ; **addition** (tous les atomes des réactifs dans le produit ; disparition d'une double liaison ou d'un cycle : Br<sub>2</sub> sur une C=C ; H<sub>2</sub> et ouverture de cycle) ; **élimination** (apparition d'une double liaison ou d'un cycle : cyclohexanol → cyclohexène + H<sub>2</sub>O ; acide hexanedioïque → cyclopentanone + CO<sub>2</sub> + H<sub>2</sub>O) ; **oxydoréduction** (alcool → aldéhyde) ; **acide-base** (échange de H<sup>+</sup>).
- **Protection / déprotection** : plusieurs groupes réactifs ; on protège celui qu'on ne veut pas modifier (exemple : oxydation par KMnO<sub>4</sub> ; protection de l'hydroxyle par estérification, oxydation, puis déprotection).
- **Synthèse multi-étapes** : banque de réactions ; exemple : N-méthylméthanamide à partir de l'éthanol en trois étapes.
- **Polymères** : A réagit sur B en A–B qui réagit encore… ; polyéthylène à partir de l'éthylène.
- **Chimie écoresponsable** : 12 principes de la chimie verte ; exemple du Lazabémide (ancien et nouveau procédé) ; **utilisation atomique UA = M(produit désiré)/M(tous les produits obtenus)**.

## Plan de l'application (`PLAN`)

### Module 1 : Rendement d'une synthèse (cœur de la consigne)

- Cours (sous-modules) : définition du rendement ; **calcul de n à partir de grandeurs variées** (m et M ; c et V ; V et ρ ; V et d : m = ρV puis n = m/M ; « ρ = d en g/mL ») ; n<sub>attendu</sub> par le tableau d'avancement (réactif limitant) ; n<sub>obtenu</sub> ; r. Lien facultatif vers « Rappels de chimie » (carte des grandeurs) et vers `avancement-reaction/`.
- **Atelier : calculer un rendement** (page `simulation` « Atelier : rendement », un écran, entraînement sans fin) : un protocole tiré d'une banque (estérification de l'acétate d'isoamyle, aspirine, savon, arôme de banane de l'ex. 1, synthèses des exercices…) avec des **données présentées de façons variées** (masse pesée, volume de liquide pur avec densité ou masse volumique, solution de concentration donnée, pourcentage massique) ; l'élève remplit un **schéma de méthode** (une colonne par espèce : données → m → n, puis tableau d'avancement → n<sub>attendu</sub> → m<sub>attendue</sub>, puis r), réutilise `SCHM` (`assets/schema-methode.js`) s'il convient ; diagnostics : d utilisée comme ρ en g/L, V × d oublié, M mal calculée, réactif limitant mal choisi (coefficients), r > 1 (« impossible : vérifie n<sub>attendu</sub> »), r en % mal converti. Compteur de réussites ; page faite après 5 réussites.
- Série (10 questions) : rendements avec toutes les grandeurs ; optimiser (excès, élimination d'un produit, justification par Q et K).

### Module 2 : Montages et techniques (mis en commun avec la 2nde)

- Cours (sous-modules) : les trois étapes ; transformation (reflux, réfrigérant à air, Dean-Stark si un exercice le cite) ; traitement (ampoule à décanter, relargage, séchage, distillation, évaporateur rotatif, büchner, recristallisation, colonne) ; identification (CCM, IR, Kofler). **Lien facultatif** : `chromatographie/` (« Revois : Chromatographie sur couche mince »).
- **Manipulation : montage à reflux et ampoule à décanter** (`module_2_manip.html`, page `entrainement`) : **avec l'outil partagé `SYNTHESE`** (voir plus bas), en **mode Terminale** : assembler le montage (ordre et refus expliqués), animation du reflux, légender ; ampoule à décanter (placer les phases et les espèces d'après densités et solubilités ; relargage ; séchage) ; CCM de suivi (R1, M0, M30, P<sub>ref</sub>) avec `CCM`.
- Série : rôle de chaque élément d'un montage, phases dans l'ampoule, technique adaptée (solide / liquide, purification), lecture d'une CCM de suivi, température de fusion et pureté.

### Module 3 : Stratégies de synthèse

- Cours (sous-modules) : catégories de réactions (molécules dessinées par `ORGA`, groupes entourés) ; protection / déprotection ; synthèse multi-étapes ; polymères ; chimie verte (UA).
- **Atelier : séquence réactionnelle** (page `simulation`) : une molécule de départ et une molécule cible ; une **banque de réactions** (cartes : réactif, conditions, produit, catégorie) ; l'élève **enchaîne** les cartes pour aller du départ à la cible (glisser les cartes dans des cases, ou toucher), avec protection / déprotection quand un autre groupe serait touché ; diagnostics (« cette réaction oxyde aussi le groupe hydroxyle : protège-le d'abord ») ; catégorie de chaque étape à donner. Défis : exemples du cours (N-méthylméthanamide depuis l'éthanol), ex. 8 à 11.
- Série : catégorie d'une réaction (substitution / addition / élimination / oxydoréduction / acide-base), étape de protection, UA, monomère et motif d'un polymère, choix d'un procédé plus « vert ».

### Module 4 : Exercices

Ex. 1 à 12 de la feuille ; ex. 3 (sujet Métropole septembre 2022) : guidé par parties, questions complexes avec le réflexe de commencer par les quantités de matière.

## Mise en commun avec la 2nde : outil `SYNTHESE`

- **À créer s'il n'existe pas** (sinon à étendre de façon compatible) : `assets/synthese.js`, `assets/synthese.css`, objet `SYNTHESE`, sur `PAILLASSE` et `ETAPES` (créés par `docs/prompts-2nde/10-solutions.md` ou `chapitre-01.md` ; s'ils n'existent pas encore, crée-les comme le décrit `10-solutions.md` §6) :
  - `SYNTHESE.reflux(zone, { niveau: '2de' | 'tle', reactifs, gestes, animation, legendes, textes })` : assembler le montage à reflux (gestes et refus de `docs/prompts-2nde/12-synthese.md` §4, module 1), animer le reflux (module 2 de la 2nde), légender ; en Terminale, options **ampoule de coulée, ballon bicol, Dean-Stark, réfrigérant à air** ;
  - `SYNTHESE.ampoule(zone, { especes: [{ nom, densite, solubilite }], solvants, relargage, sechage })` : ampoule à décanter (verser, agiter en dégazant, décanter, placer phases et espèces, éliminer une phase) ; en Terminale, séchage au sulfate de magnésium anhydre ;
  - textes, espèces et tableaux de données passés en options (aucun texte propre à une application).
- La 2nde (`synthese/`) l'utilise en mode `'2de'` (acétate d'isoamyle, sans quantités de matière) ; cette application en mode `'tle'`. Le premier prompt exécuté crée l'outil ; le second le réutilise. Après toute modification : reteste `synthese/` (si elle existe), `solutions/`, `identifier-especes/`, `chromatographie/`.
- Mets à jour `00-commun.md` §9 (ligne `SYNTHESE`) et, si tu crées l'outil, signale-le dans `docs/prompts-2nde/README.md` (colonne « Outils » de A07).

## Vérifications propres

- Script : chaque rendement (banque de l'atelier, exercices), masses molaires, densités ; UA de l'exemple.
- `SYNTHESE` : modes `'2de'` et `'tle'` testés ; refus du montage à reflux (eau par le haut, montage bouché, chauffage avant l'eau…) ; phases justes pour chaque espèce de la banque.
- Atelier de séquence : chaque séquence attendue mène à la cible, les mauvaises cartes sont refusées avec leur explication.
