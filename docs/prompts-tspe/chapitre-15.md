# Cinétique chimique (prompt de génération)

Lis d'abord `docs/prompts-tspe/00-commun.md` (sources, charte, structure, maquettes §8, outils partagés, livraison).

**Ce chapitre se fait en deux sessions** (`00-commun.md` §8), parce qu'il crée un outil nouveau et important (dessiner les flèches courbes) :

1. **Étape 1 : maquettes de l'outil « mécanismes réactionnels »** (flèches courbes). Tu t'arrêtes après : le professeur choisit.
2. **Étape 2 : l'application**, avec la maquette retenue et les remarques du professeur.

Le message de la session dit quelle étape exécuter. Lis tout ce fichier dans les deux cas.

## Application

- Dossier `cinetique-chimique/`, nom « Cinétique chimique », `data-matiere="chimie"`, préfixe `cc`, espace de noms `CC` (vérifie qu'ils sont libres).
- Portail : `desc: "Suivi temporel, facteurs cinétiques, catalyse, temps de demi-réaction, vitesses volumiques, ordre 1, mécanismes et flèches courbes."` ; `mots` : réaction lente, rapide, capteur, absorbance, conductivité, pression, facteur cinétique, température, concentration, solvant, chocs efficaces, catalyseur, catalyse homogène, hétérogène, enzymatique, enzyme, t1/2, demi-réaction, vitesse volumique d'apparition, de disparition, tangente, ordre 1, ln, exponentielle, acte élémentaire, intermédiaire réactionnel, flèche courbe, doublet, site donneur, site accepteur…
- Dessin d'en-tête : courbe x(t) avec son asymptote, ou flèches courbes sur une molécule (nouveau dessin `cinetique` si rien ne convient).
- Outils : **`ORGA`** (molécules en formule développée avec doublets non liants, charges, δ<sup>+</sup>/δ<sup>−</sup> ; étendu par cette application, voir plus bas), `LG` (tangentes, t<sub>1/2</sub>), `EQ` (ln, exponentielle), `BULLE`, `PLEIN`.
- Dossier des maquettes (étape 1) : `docs/cinetique-chimique/maquettes/`.

## Sources (`15- Cinetique/`)

| Fichier | Contenu | À lire |
|---|---|---|
| `Chap15-Cours Cinetique complete.pdf` (10 p.) | Cours tapé, complété à la main | Non : résumé ci-dessous. **Pages 9 et 10 (flèches courbes, couleurs du professeur) avant les maquettes** ; pages 2, 5, 6 pour les courbes |
| `Chap15-Exercices Cinetique.pdf` (6 p.) | Ex. 1 à 28 (1 à 3 temps de demi-réaction ; 4, 5 catalyse ; 6, 7 facteurs cinétiques ; 8 avancement / absorbance ; 9 avancement / conductivité ; 10 à 13, 16 vitesses volumiques ; 14, 15, 17 ordre ; 18 équation différentielle ; 19 à 28 : mécanismes et autres) | Oui |
| `Chap15-Exercices Cinetique - correction.pdf` (19 p.) | Corrections | Oui |
| `video catalyse.txt` | Vidéo (dailymotion) sur la catalyse | Lien facultatif dans le cours de la catalyse |

Le TP (cinétique par spectrophotométrie) n'est pas repris.

## Consignes du professeur

- **Développer un outil pour les mécanismes réactionnels : faire dessiner les flèches des actes élémentaires.** Il doit être validé sur maquettes (étape 1).

## Contenu du cours (résumé)

### I. Réactions rapides et lentes, suivi

- **Rapide** : impossible de distinguer des états intermédiaires (explosif ; permanganate + thiosulfate, décoloration immédiate ; écrire la réaction avec les couples MnO<sub>4</sub><sup>−</sup>/Mn<sup>2+</sup> et S<sub>4</sub>O<sub>6</sub><sup>2−</sup>/S<sub>2</sub>O<sub>3</sub><sup>2−</sup>). **Lente** : suivie à l'œil ou aux appareils courants (réaction du « coucher de Soleil » 3 S<sub>2</sub>O<sub>3</sub><sup>2−</sup> + 2 H<sub>3</sub>O<sup>+</sup> → 2 SO<sub>4</sub><sup>2−</sup> + 4 S + 3 H<sub>2</sub>O : le soufre opacifie la solution ; durée mesurée par la disparition d'un motif sous le bécher).
- **Suivi** : courbe x(t) qui tend vers x<sub>f</sub> ; doser une espèce à des dates connues ou mesurer une grandeur avec un **capteur** : la grandeur doit dépendre de la quantité d'un réactif ou d'un produit, et le temps de réponse doit être très inférieur à la durée de la transformation. Grandeurs : **pression** (gaz), **absorbance** (espèce colorée, Beer-Lambert A = kc), **conductivité** (ions, Kohlrausch).

### II. Modifier la durée d'une réaction

- **Facteurs cinétiques** (grandeur qui modifie la vitesse) : température (réfrigérateur, chauffage industriel, **trempe**), concentrations initiales (courbes x(t) comparées), solvant.
- **Interprétation microscopique** : agitation thermique (mouvement brownien) ; il faut un **choc** et qu'il soit **efficace** (énergie cinétique suffisante) ; concentration ↗ → fréquence des chocs ↗ ; température ↗ → fréquence des chocs ↗ **et** proportion de chocs efficaces ↗.
- **Catalyseur** : diminue la durée sans figurer dans l'équation ; ne modifie pas l'état final ; spécifique ; en faible quantité ; catalyse **homogène** (une phase), **hétérogène** (plusieurs phases), **enzymatique** (enzyme : protéine ; sélectivité liée à la structure spatiale, site actif). Exemple : dismutation de l'eau oxygénée.

### III. Vitesse d'évolution

- **Temps de demi-réaction t<sub>1/2</sub>** : durée pour laquelle x = x<sub>final</sub>/2 (souvent x<sub>final</sub> = x<sub>max</sub>) ; mesure : x<sub>final</sub> par l'asymptote, placer x<sub>final</sub>/2, lire le temps ; aussi sur n ou c d'une espèce (exemple du « coucher de Soleil » : n(S) qui croît, n(S<sub>2</sub>O<sub>3</sub><sup>2−</sup>) qui décroît).
- **Vitesses volumiques** (volume constant) : **v<sub>app</sub>(P) = d[P]/dt** ; **v<sub>disp</sub>(R) = −d[R]/dt** (mol·L<sup>−1</sup>·s<sup>−1</sup>, positives) ; mesure : **coefficient directeur de la tangente** à la courbe (signe − pour un réactif).
- **Ordre 1** : (hors programme) vitesse de la réaction v = v<sub>disp</sub>(R<sub>1</sub>)/a = … ; v = k[R<sub>1</sub>]<sup>q<sub>1</sub></sup>[R<sub>2</sub>]<sup>q<sub>2</sub></sup>. **Définition** : ordre 1 par rapport à R<sub>1</sub> si, R<sub>2</sub> en large excès, les vitesses sont proportionnelles à [R<sub>1</sub>]. Exemple CO + Cl<sub>2</sub> → COCl<sub>2</sub>, ordre 1 par rapport à CO. **Trois méthodes pour le reconnaître** : 1. v proportionnelle à [R] (droite passant par l'origine, ex. 15) ; 2. **[R](t) = [R]<sub>0</sub> e<sup>−kt</sup>** : tracé de ln([R]/[R]<sub>0</sub>) = f(t) : droite de coefficient directeur −k (ex. 17), justifiée par l'équation différentielle d[R]/dt = −k[R] ; 3. t<sub>1/2</sub> indépendant de [R]<sub>0</sub> (ex. 14).

### IV. Mécanisme réactionnel

- **Acte élémentaire** (une étape), **mécanisme** (succession d'actes), **intermédiaire réactionnel** (formé puis consommé, absent de l'équation). Exemple : (H<sub>3</sub>C)<sub>3</sub>C–Cl + HO<sup>−</sup> → (H<sub>3</sub>C)<sub>3</sub>C–OH + Cl<sup>−</sup> en deux étapes (carbocation (H<sub>3</sub>C)<sub>3</sub>C<sup>+</sup>).
- **Catalyseur** (microscopique) : il modifie le mécanisme (une étape remplacée par des étapes plus rapides), disparaît puis est régénéré.
- **Flèches courbes** : la formation ou la rupture d'une liaison se modélise par le **mouvement d'un doublet d'électrons**, représenté par une **flèche courbe** qui **part d'un doublet**. Exemple 1 : NH<sub>3</sub> + H<sup>+</sup> → NH<sub>4</sub><sup>+</sup> (flèche du doublet non liant de N vers H<sup>+</sup> ; interprétation des charges : N a 5 électrons de valence « à lui », 4 après : charge + ; H a récupéré l'électron qui lui manquait). Exemple 2 : H<sub>3</sub>C–C(NH<sub>2</sub>)(CH<sub>3</sub>)–Li + Br–C(C<sub>2</sub>H<sub>5</sub>)(CH<sub>3</sub>) → couplage des deux C + Li<sup>+</sup> + Br<sup>−</sup> (raisonnement : Li perd un électron, Br en gagne un, les deux C s'accrochent ; le professeur **entoure de couleurs différentes** les fragments qui se retrouvent dans les produits).
- **Sites donneurs** (doublet non liant, liaison polarisée côté δ<sup>−</sup>, liaison multiple) et **accepteurs** (atome avec défaut d'électrons : charge + ou δ<sup>+</sup>, H<sup>+</sup>, carbocation, C lié à un halogène) ; formation de liaison : du donneur vers l'accepteur ; rupture : la flèche part de la liaison (site donneur) vers l'atome le plus électronégatif. Notation du professeur : « d » (site donneur), « a » (site accepteur) à côté des sites.
- Exemple 2 bis (acide éthanoïque + eau) : flèche du doublet de O de l'eau vers H (δ<sup>+</sup>) de COOH, et flèche de la liaison O–H vers O ; produits : ion éthanoate (O<sup>⊖</sup>) et H<sub>3</sub>O<sup>+</sup> (O<sup>⊕</sup>). Le professeur colore **la nouvelle liaison de la couleur de la flèche qui la forme**.
- **En pratique** : « les produits formés sont toujours donnés ; il suffit de repérer le mouvement des doublets, de le représenter avec des flèches, puis d'indiquer les sites donneurs et accepteurs s'ils sont demandés ».
- Exemple 3 : addition de HBr sur le but-2-ène en deux étapes (flèche de la double liaison C=C vers H<sup>+</sup> → carbocation ; flèche du doublet de Br<sup>−</sup> vers C<sup>+</sup>). Exemple 4 : addition de HCl sur le 2-méthylpropène en une étape (deux flèches : C=C vers H ; liaison H–Cl vers Cl).

## Plan de l'application (`PLAN`), étape 2

### Module 1 : Suivre une transformation, facteurs cinétiques, catalyse

- Cours (sous-modules) : réactions lentes et rapides, suivi et choix du capteur ; facteurs cinétiques ; interprétation microscopique ; catalyse (lien facultatif vers la vidéo).
- **Simulateur : chocs efficaces** (page `simulation`, un écran) : des entités de deux réactifs s'agitent dans une boîte (agitation thermique) ; température et concentrations réglables ; les chocs s'allument, les chocs efficaces (énergie suffisante) forment un produit ; compteurs (fréquence des chocs, proportion de chocs efficaces) et courbe x(t) en direct ; catalyseur activable (seuil d'énergie abaissé, catalyseur régénéré) ; défis : doubler la vitesse de deux façons ; montrer qu'un catalyseur ne change pas l'état final ; « trempe ».
- Série : capteur adapté (pression, absorbance, conductivité), facteur cinétique d'après des courbes, type de catalyse, interprétation microscopique.

### Module 2 : Temps de demi-réaction et vitesses volumiques

- Cours : t<sub>1/2</sub> (méthode graphique : asymptote, moitié, lecture) ; vitesses volumiques (tangente, coefficient directeur, signe).
- **Atelier : lire une courbe cinétique** (page `simulation`) : courbes x(t), [P](t), [R](t), A(t), σ(t) d'une banque (dont les exercices) ; outils `LG` : asymptote, moitié, report → t<sub>1/2</sub> ; tangente à placer en un point → coefficient directeur → vitesse volumique (avec le signe pour un réactif) ; conversion A ou σ → concentration (lien « Méthodes physiques d'analyse »). Défis dans n'importe quel ordre.
- Série : t<sub>1/2</sub> sur une courbe, vitesse volumique en un point, évolution de la vitesse au cours du temps (elle diminue : explication par les concentrations), lien avancement / absorbance / conductivité.

### Module 3 : Loi de vitesse d'ordre 1

- Cours : définition ; trois méthodes ; équation différentielle d[R]/dt = −k[R] et sa solution [R]<sub>0</sub>e<sup>−kt</sup> (même mathématique que le circuit RC et la radioactivité) ; avec **`EQ`** : passer de [R] = [R]<sub>0</sub>e<sup>−kt</sup> à ln([R]/[R]<sub>0</sub>) = −kt, et t<sub>1/2</sub> = ln 2 / k.
- Série : reconnaître l'ordre 1 par l'une des trois méthodes (graphiques v = f([R]), ln([R]/[R]<sub>0</sub>) = f(t), t<sub>1/2</sub> pour plusieurs [R]<sub>0</sub>), k à partir d'une pente, t<sub>1/2</sub>.

### Module 4 : Mécanismes réactionnels et flèches courbes

- Cours (sous-modules) : actes élémentaires, intermédiaire réactionnel, catalyseur dans un mécanisme (reconnaître : formé puis consommé / consommé puis régénéré ; équation bilan obtenue en additionnant les étapes) ; flèches courbes ; sites donneurs et accepteurs.
- **Atelier : dessiner les flèches courbes** : **l'outil retenu à l'étape 1**, sur les exemples 1 à 4 du cours puis une banque de mécanismes (SN1 du chlorure de tertiobutyle, additions de HBr et HCl, protonation d'une amine, d'un alcool, réaction acide-base de l'acide éthanoïque avec l'eau, déprotonation, estérification en étapes si un exercice la donne, mécanismes des exercices 19 à 28).
- Série : identifier intermédiaire réactionnel et catalyseur, équation bilan d'un mécanisme, sites donneur et accepteur, dessiner une ou deux flèches (outil en partie `perso`).

### Module 5 : Exercices

Ex. 1 à 28 de la feuille.

## Étape 1 : maquettes de l'outil « mécanismes réactionnels »

### Ce que l'outil doit faire

- Afficher un **acte élémentaire** : réactifs → produits, molécules en **formule développée** (ou semi-développée) **avec doublets non liants (petits traits), charges + / −, δ<sup>+</sup> / δ<sup>−</sup>**, dessinées par **`ORGA`** (`assets/orga-dessin.js` : lis son en-tête ; il dessine déjà les doublets en développée). Les produits sont **toujours donnés** (pratique du professeur).
- L'élève **dessine les flèches courbes** : il touche le **départ** (un doublet non liant, ou une liaison : simple, polarisée, double, triple) puis l'**arrivée** (un atome, ou une liaison pour une rupture vers un atome… voir les cas du cours), la flèche courbe se trace (courbure automatique, réglable si utile) ; ou il **glisse** du départ à l'arrivée. Une flèche se supprime au toucher (ou gomme).
- **Validation** : l'ensemble des flèches doit être celui du mécanisme (l'ordre n'importe pas), avec des **diagnostics ciblés** :
  - « une flèche part toujours d'un doublet d'électrons (doublet non liant ou liaison), jamais d'un atome ni d'une charge + » ;
  - « la flèche va du site donneur vers le site accepteur (défaut d'électrons : + ou δ<sup>+</sup>) » ;
  - « il manque une flèche : la liaison H–Cl est rompue dans les produits » ;
  - flèche à l'envers (de H<sup>+</sup> vers N) ;
  - « cette liaison n'existe plus dans les produits : quel doublet est parti ? »
- **Options** : marquer les sites **« d » (donneur) et « a » (accepteur)** (touches à poser sur les atomes ou liaisons, comme le fait le professeur) ; **colorer la liaison formée de la couleur de sa flèche** dans les produits (habitude du professeur) ; **entourer les fragments** qui se retrouvent dans les produits (exemple 2) ; afficher le **décompte des électrons de valence** d'un atome pour justifier sa charge (exemple 1 : « N a 5 électrons à lui, puis 4 : charge + »).
- Plusieurs exemplaires dans une page (cours en « Afficher tout le cours »), souris et doigt, cibles de 44 px (un doublet est petit : zone sensible élargie autour), aucun survol nécessaire.
- **Extension de `ORGA`** (compatible : valeurs par défaut inchangées, `nomenclature/` et `lewis/` retestées) : charges formelles et δ sur les atomes, carbocations, ions (H<sup>+</sup>, Br<sup>−</sup>, Li<sup>+</sup>), points d'accroche des flèches (doublets, milieux de liaisons), et une couche SVG de flèches courbes.

### Maquettes à proposer (au moins trois, fonctionnelles)

- **Maquette A : « départ puis arrivée »** : deux appuis (toucher un doublet ou une liaison, il s'allume ; toucher la cible) ; la flèche se dessine en arc ; valider ; diagnostics.
- **Maquette B : « glisser la flèche »** : on glisse du doublet vers la cible, la flèche suit le doigt et se « colle » à la cible la plus proche (aimantation) ; complément au doigt fin : liste des départs et arrivées possibles à toucher.
- **Maquette C : « guidée par le raisonnement »** : avant les flèches, l'élève compare réactifs et produits (quelle liaison apparaît ? laquelle disparaît ? quelles charges changent ?) en touchant les liaisons concernées, puis l'outil lui demande, pour chaque liaison formée, « d'où vient le doublet ? », et dessine la flèche ; puis sites d et a.

Toutes les maquettes sur les **exemples 1 à 4 du cours** (pages 9 et 10). Page `docs/cinetique-chimique/maquettes/index.html` : ce qui les distingue, ce qu'il faut essayer, et les **questions au professeur** (formule développée complète ou semi-développée avec seulement les doublets utiles ? courbure réglable ? faut-il faire placer les charges des produits, ou sont-elles données ? flèche de rupture vers l'atome ou vers l'extérieur ? couleur de la nouvelle liaison automatique ?).

## Vérifications propres (étape 2)

- Script : valeurs des exercices (t<sub>1/2</sub>, vitesses, k) ; chaque mécanisme de la banque : les flèches attendues transforment bien les réactifs en produits (bilan des électrons et des charges vérifié par l'outil).
- `ORGA` étendu : `nomenclature/`, `lewis/` et `nomenclature-1re/` retestées.
- Simulateur et ateliers : un écran, défis dans le désordre, doigt et souris.
