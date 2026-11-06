Lis `docs/prompts-2nde/00-commun.md`, puis exécute ce prompt.

# 03 · Image par une lentille convergente (A13)

## 1. Application

- Nom : **« Image par une lentille convergente »** ; dossier `lentilles/` ; préfixe `lt`, espace de noms `LT` ; `data-matiere="physique"` ; kicker « Physique · Seconde ».
- Portail : `dom: 'physique'`, `desc: "Foyers, rayons particuliers, construction de l'image, grandissement, banc d'optique et modèle de l'œil."`
- Dessin d'en-tête : **`rayons`** (créé par `02-refraction.md`) ; s'il n'existe pas encore, crée-le comme le décrit ce prompt-là.
- **Prérequis** : `02-refraction.md` est fait (outil `OPT`). Sinon, crée `OPT` comme il le décrit, puis étends-le.

## 2. Objectif et programme

Indispensable I8. Capacités exigibles :
- « Caractériser les foyers d'une lentille mince convergente à l'aide du modèle du rayon lumineux. »
- « Utiliser le modèle du rayon lumineux pour déterminer graphiquement la position, la taille et le sens de l'image réelle d'un objet plan réel donnée par une lentille mince convergente. »
- « Définir et déterminer géométriquement un grandissement. » ; « Modéliser l'œil. »
- « Produire et caractériser l'image réelle d'un objet plan réel formée par une lentille mince convergente. » ; capacité mathématique : « utiliser le théorème de Thalès ».

## 3. Ce que dit le cours

Sources : `05- Lentilles minces convergentes/Chap05-Cours-exercices complete.pdf` (p. 1-3 cours et fiche 1, p. 4-7 exercices), `TP1-lentilles complete.pdf` (partie II), `TP2-lentilles convergentes.pdf`, `Chap05-Exercices2.pdf`, corrections.

- **Symbole** : lentille convergente = segment vertical avec une flèche à chaque bout ; **axe optique** horizontal (« perpendiculaire au plan de la lentille, passant par son centre ») ; **centre optique O** ; **foyer objet F** et **foyer image F′**, petits traits sur l'axe, **symétriques par rapport à O**.
- **Trois rayons** (cours p. 1, TP1) :
  1. « Tout rayon qui passe par le centre optique O de la lentille n'est pas dévié. »
  2. « Tout rayon qui arrive horizontal ressort de la lentille en passant par son foyer image F′. » (TP1 : « parallèle à l'axe optique »)
  3. « Tout rayon qui arrive en passant par le foyer objet F ressort de la lentille horizontal. »
- **Distance focale** : f′ = OF′ (encadré).
- **Vergence** (cours, ajout manuscrit, et TP1) : « Ordonnances : force des lunettes notée en dioptries » ; **v = 1 / f′**, unité la dioptrie, symbole δ, 1 δ = 1 m<sup>−1</sup> ; f′ en mètres. TP2 : « lentille convergente de dioptrie 10 m<sup>−1</sup>, ce qui correspond à une distance focale de 1/10 m = 0,1 m = 10 cm (f′ = 10 cm = 100 mm) ». **Choix de l'enseignant : utiliser la vergence (lentille « de 10 δ ») et expliciter chaque fois le passage à f′** (f′ = 1 / v, en m, puis en cm).
- **Construction de l'image** (cours p. 1, fiche 1) : on trace des rayons issus de B ; « B′, l'intersection de ces rayons, est l'image de B » ; « A′, l'image de A, est à la verticale de B′ sur l'axe optique » (fiche : « on projette orthogonalement B′ sur l'axe optique ») ; « tout rayon qui part de B passe par B′ » ; « pour observer une image nette, il faut mettre l'écran en A′ » ; la construction donne la **position (OA′)**, la **taille (A′B′)** et le **sens** (« droite si elle est à l'endroit, renversée si elle est à l'envers par rapport à AB »). La fiche dit « tracer **deux** des trois rayons particuliers » ; **choix de l'enseignant : deux rayons suffisent, l'élève peut tracer le troisième**.
- Objets de la fiche 1 : au-delà de 2f′, entre f′ et 2f′, et un objet **sous l'axe** (B en bas) ; **objet entre F et O : « Hors programme (vu en 1<sup>re</sup> spécialité) »**, « image virtuelle », « c'est la situation de l'utilisation d'une loupe ». **Choix de l'enseignant : visible dans le simulateur seulement, avec une bulle « hors programme ».**
- **Grandissement** γ (gamma) = A′B′ / AB ; A′B′ = γ × AB ; γ = OA′ / OA, à savoir démontrer par le **théorème de Thalès** (triangles ABO et A′B′O : AB / A′B′ = AO / OA′ = BO / OB′) ; « γ > 1 : image plus grande ; γ < 1 : image plus petite que l'objet ».
- **Œil réduit** (cours p. 2) : diaphragme (trou de taille réglable) = pupille (« permet de faire entrer plus ou moins de lumière ») ; lentille convergente = cristallin ; écran = rétine. **Accommodation** : « pour voir un objet à l'infini, le cristallin est au repos ; l'image se forme sur la rétine. Si l'objet se rapproche, pour que l'image reste sur la rétine, l'œil doit accommoder : le cristallin se déforme pour être plus convergent. La distance focale du cristallin diminue. »
- **TP2 (banc d'optique)** : objet = lettre « d » éclairée par une lanterne, représentée par une flèche ; objet au zéro du banc ; lentille de 10 δ ; lentille à 40 cm de l'objet, puis à 20 cm ; chercher l'écran qui donne une image nette (« Y a-t-il plusieurs positions de l'écran qui donnent une image nette ? » : non) ; image droite ou renversée ; mesurer AB et A′B′ à la règle, OA et OA′, calculer γ = A′B′ / AB et OA′ / OA, relation entre les deux.
- **Exercices** : exercice 4 (f′ = 2 cm, construire, taille et sens) ; exercice 8 (construire l'image, ou retrouver l'objet à partir de l'image) ; exercice 9 (AB = 2,0 cm et A′B′ = 1,5 cm : γ = 0,75 ; γ = 0,70 : A′B′ = 1,4 cm) ; exercice 15 (f′ = 3,0 cm, AB = 2,0 cm, OA = 8,0 cm : OA′ = 4,8 cm, A′B′ = 1,2 cm, γ = 0,60).

À relire seulement pour refaire les figures : fiche 1 (p. 3) et exercices 1 à 8 (p. 4-6).

## 4. Plan de l'application (`PLAN`)

### Module 1 : Les rayons particuliers (manipulation guidée, `module_1_manip.html`)

- Quadrillage (1 carreau = 1 cm sauf indication), lentille, axe optique.
- Situation 1 : **placer les foyers** : f′ donnée (« f′ = 3 cm »), puis vergence donnée (« lentille de 25 δ » : l'élève écrit f′ = 1 / 25 = 0,04 m = 4 cm avant de placer F′) ; toucher la position de F′ puis de F. Erreurs : F′ du côté de l'objet (« F′, foyer image, est du côté où sort la lumière ») ; F non symétrique ; f′ prise en m sur un quadrillage en cm (« f′ = 0,04 m = 4 cm : 4 carreaux »).
- Situations 2 à 7 : un rayon incident est dessiné (parallèle à l'axe, passant par O, passant par F, à différentes hauteurs, au-dessus ou au-dessous de l'axe) ; l'élève **trace le rayon émergent** : il glisse un point par lequel le rayon émergent passe (aimanté aux nœuds du quadrillage et aux points F, F′, O), ou ◀ ▶ ▲ ▼ ; le rayon part toujours du point où le rayon incident touche la lentille.
- Erreurs à diagnostiquer :
  - rayon parallèle qui ressort par F au lieu de F′ : « Un rayon qui arrive parallèle à l'axe ressort en passant par le foyer **image** F′, de l'autre côté de la lentille. » ;
  - rayon passant par F qui ne ressort pas parallèle : « Un rayon qui passe par le foyer objet F ressort parallèle à l'axe optique. » ;
  - rayon passant par O dévié : « Un rayon qui passe par le centre optique O n'est pas dévié. » ;
  - rayon dévié avant la lentille ou au mauvais endroit : « Le rayon ne change de direction qu'en traversant la lentille. »
- Bilan : les trois règles, avec la figure.

### Module 2 : Construire l'image A′B′ (série notée sur 20, `module_2_questions.html`)

- Chaque question : lentille (f′ en cm, ou vergence en δ à convertir), objet AB perpendiculaire à l'axe, A sur l'axe, B au-dessus ou au-dessous, à une distance de 2f′ à 4f′ (images réelles seulement ; **pas d'objet entre F et O**).
- Parties :
  (a) tracer **au moins deux rayons issus de B** : l'élève touche B, choisit le passage (« parallèle à l'axe », « par O », « par F ») ou touche directement le point de passage, puis trace le rayon émergent comme au module 1 ; un troisième rayon est accepté ;
  (b) **placer B′** à l'intersection (toucher ; tolérance ½ carreau) ;
  (c) **placer A′** sur l'axe, à la verticale de B′ ; la flèche A′B′ se dessine ;
  (d) lire **OA′** et **A′B′** sur le quadrillage (avec l'échelle si 1 carreau ≠ 1 cm) et donner le **sens** (droite / renversée) ;
  (e) calculer **γ** = A′B′ / AB, et vérifier γ = OA′ / OA (un des deux selon la question).
- Groupe à part (exercice 8) : l'image A′B′ est donnée, retrouver l'objet (rayons tracés depuis B′, en sens inverse).
- Erreurs : B′ placé à l'intersection d'un rayon et de l'axe ; A′ pas à la verticale de B′ ; taille lue en carreaux sans l'échelle ; sens « droite » pour une image sous l'axe ; γ calculé à l'envers (AB / A′B′) : « γ = A′B′ / AB : la taille de l'image divisée par la taille de l'objet. »

### Module 3 : Banc d'optique (simulation, `module_3_simulation.html`)

- Banc gradué en cm (0 à 100 cm) : lanterne et objet « d » au zéro (fixe), lentille, écran. Lentilles au choix : **10 δ** (celle du TP2), 5 δ, 20 δ ; à chaque choix, une ligne écrit le passage : « v = 10 δ, f′ = 1 / v = 1 / 10 = 0,10 m = 10 cm ».
- La lentille et l'écran se **glissent** sur le banc, avec boutons ± 1 cm et ± 1 mm. L'image sur l'écran est **floue** sauf quand l'écran est en A′ (tolérance ± 3 mm) : elle devient nette, renversée (la lettre tournée d'un demi-tour) et à la bonne taille ; l'écran est gradué pour mesurer A′B′.
- Case « afficher la construction » : la vue de dessus du banc (schéma de la fiche 1 à l'échelle) se dessine avec deux rayons issus de B et suit les déplacements.
- Déroulé guidé (TP2) :
  1. mesure AB sur l'objet ;
  2. lentille à 40 cm de l'objet : cherche l'image nette (OA′ = 13,3 cm), « Y a-t-il plusieurs positions de l'écran qui donnent une image nette ? » (non) ; image droite ou renversée ;
  3. mesure A′B′ et calcule γ = A′B′ / AB, puis OA′ / OA : même valeur (0,33) ;
  4. lentille à 20 cm de l'objet : OA′ = 20 cm, γ = 1 ;
  5. bilan : γ = A′B′ / AB = OA′ / OA.
- **Objet entre F et O** (lentille à moins de f′ de l'objet) : aucune image nette sur l'écran, quelle que soit sa position ; une bulle ⓘ apparaît : « **Hors programme.** L'objet est entre F et O : l'image est virtuelle. On ne peut pas la recueillir sur un écran ; on la voit en regardant à travers la lentille, comme avec une loupe. » ; la construction (si elle est affichée) montre les rayons émergents qui divergent et leurs prolongements en pointillés.

### Module 4 : L'œil (simulation, `module_4_simulation.html`)

- Partie 1 : coupe de l'œil (pupille et iris, cristallin, rétine) à côté du modèle de l'œil réduit (diaphragme, lentille convergente, écran) ; l'élève **relie** chaque partie de l'œil à son modèle (glisser une étiquette ou deux appuis) ; erreur : « Le cristallin dévie la lumière comme une lentille : c'est la lentille convergente. »
- Partie 2 : **accommodation** : un objet s'éloigne ou se rapproche (curseur de distance, de 25 cm à « l'infini ») ; la rétine est à distance fixe du cristallin (17 mm) ; l'élève règle la distance focale du cristallin (curseur, ± 0,1 mm) pour que l'image se forme sur la rétine (nette) ; la vergence correspondante s'affiche (v = 1 / f′ en δ).
- Déroulé : objet à l'infini, cristallin au repos (f′ = 17 mm) ; objet à 1 m, puis à 25 cm : f′ diminue, v augmente, « le cristallin est plus convergent » ; bilan avec la phrase du cours.

## 5. Rendu

- SVG à l'échelle : 1 carreau = 1 cm (ou échelle indiquée « 1 carreau ↔ 2 cm ») ; quadrillage `--paper-3`, axe `--ink`, lentille `--ink` épaisse avec flèches, F et F′ petits traits nommés, objet AB flèche `--ink`, image A′B′ flèche `--accent-ink`, rayons `--accent` fins avec flèche au milieu, prolongements virtuels en pointillés.
- Banc d'optique : banc gradué, lanterne, lentille sur son support, écran ; image floue rendue par un flou SVG (`feGaussianBlur`) qui diminue près de A′.
- 1280 px : construction à gauche, étapes à droite ; 390 px : figure pleine largeur (zoom adapté pour que le quadrillage reste lisible), boutons dessous.

## 6. Outils

- **`OPT`** (créé par `02-refraction.md`) **à étendre de façon compatible** : lentille mince (`dioptre: { type: 'lentille', f }`), axe optique, foyers F et F′, rayons particuliers, rayon émergent d'un rayon quelconque (passant par le foyer secondaire), intersection de deux rayons, prolongements virtuels ; quadrillage et aimantation aux nœuds. Reteste `refraction/` après l'extension.
- Position de l'image : calculée en interne par la relation de conjugaison (1 / OA′ − 1 / OA = 1 / f′, grandeurs algébriques), **jamais affichée** ; la construction graphique doit donner le même point.
- `assets/dragdrop.js`, `BULLE`.
- Inspiration sans copie : `construction image lentille.pps` (convertir en PDF pour le voir) et le lien GeoGebra de `Liens.txt`.

## 7. Vérifications propres

- Recalculer par script : f′ = 10 cm, OA = 40 cm → OA′ = 13,3 cm, γ = 0,33 ; OA = 20 cm → OA′ = 20 cm, γ = 1 ; OA = 30 cm → 15 cm, γ = 0,5 ; exercice 15 : OA′ = 4,8 cm, A′B′ = 1,2 cm, γ = 0,60 ; exercice 9 : 0,75 et 1,4 cm ; 25 δ → 4 cm ; œil : f′ = 17 mm à l'infini, 16,7 mm à 1 m, 15,9 mm à 25 cm.
- Chaque fabrique de la série : B′ tombe sur un nœud ou un demi-nœud du quadrillage, image dans le cadre.
- Les trois sortes de rayons tracés au doigt (CDP) et avec les flèches ; trois rayons acceptés.
- Banc : image nette seulement à ± 3 mm de A′ ; objet entre F et O : bulle hors programme, aucune image sur l'écran.

## 8. Hors périmètre

- Pas de relation de conjugaison affichée ni à utiliser (TP2 partie III, vue en 1<sup>re</sup>), pas de grandeurs algébriques.
- Pas de lentille divergente, pas de défauts de l'œil ni de correction par des lunettes.
- Objet entre F et O : seulement dans le simulateur, avec sa bulle ; jamais dans la série.
