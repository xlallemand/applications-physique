# Titrages (prompt de génération)

Lis d'abord `docs/prompts-tspe/00-commun.md` (sources, charte, structure, outils partagés, livraison).

## Application

- Dossier `titrages/`, nom « Titrages », `data-matiere="chimie"`, préfixe `ti`, espace de noms `TI` (vérifie : `titrage-ph` utilise `tph`, `titrage-conductimetrique` `tc`).
- Portail : `desc: "Schéma et réaction de titrage, relation à l'équivalence, repérage de l'équivalence (couleur, pH, conductivité)."` ; `mots` : dosage, burette, équivalence, volume équivalent, Veq, espèce titrante, espèce titrée, proportions stœchiométriques, indicateur coloré, zone de virage, saut de pH, méthode des tangentes, dérivée, conductimétrique, changement de pente, soude, acide chlorhydrique, permanganate, diiode, empois d'amidon…
- Dessin d'en-tête : celui de `titrage-ph/` s'il convient (burette), sinon un nouveau `burette`.
- Outils : `TITRAGE` (`assets/titrage.js`, `assets/titrage.css` : modèle chimique, montage, courbe, outils de repérage — lis son en-tête), `ORGA` si des molécules sont dessinées, `LG`, `MOL`, `SCHM` (`assets/schema-methode.js`) si utile, `DILUTION` (chapitre 1) pour la préparation d'une solution, `BULLE`, `PLEIN`.

## Sources (`06- Titrage/`)

| Fichier | Contenu | À lire |
|---|---|---|
| `Chap06_Cours_titrage_G3.pdf` (7 p.) | Cours tapé, complété à la main | Non : résumé ci-dessous. Page 2 (schéma du professeur), page 4 (courbes pour l'indicateur coloré), page 7 (interprétation des pentes) pour les figures |
| `Chap06_Exercices.pdf` (3 p.) | Ex. 1 à 12 (certains en images) | Oui |
| `Chap06-Exercices correction.pdf` (5 p.) | Corrections | Oui |

Les TP (colorimétrique, pH-métrique du Destop, conductimétrique au nitrate d'argent) ne sont pas repris ici ; le TP du Destop existe déjà sous forme d'application (`titrage-ph/`).

## Consignes du professeur

1. **Première méthode importante : le schéma du titrage.**
   - Faire un schéma du titrage et **y mettre les grandeurs importantes** : pour la **burette**, formule des espèces, c et V<sub>éq</sub> ; pour le **bécher**, formule des espèces, c<sub>inconnue</sub> et V<sub>pipette</sub> ; puis l'**équation de la réaction de titrage**.
   - Les élèves ont du mal à **repérer dans l'énoncé où se placent les espèces** et à **écrire les équations**. Insister : ils doivent **connaître les acides et bases usuels** (soude, acide chlorhydrique, acide éthanoïque, ammoniaque…) ; quand une espèce s'appelle **« acide … »**, c'est une **réaction acide-base** et elle **donne H<sup>+</sup>** à l'autre réactif.
   - Écrire la **relation à l'équivalence** avec la phrase : « **À l'équivalence, les réactifs ont été introduits dans les proportions stœchiométriques, donc n<sub>A</sub> / a = n<sub>B</sub> / b** », puis **remplacer les n par les c × V du schéma**.
2. **Deuxième méthode importante** : devant une question complexe (où l'on ne demande pas de commencer par calculer la concentration inconnue), **avoir le réflexe de la calculer d'abord**, avant même de chercher comment répondre (comme dans « Méthodes physiques d'analyse », module 4).
3. Des applications existent : `titrage-ph/` et `titrage-conductimetrique/`. **Faire des liens** vers elles et **réutiliser** ce qui est déjà fait (simulateur `TITRAGE`, animation de la conductimétrie).

## Contenu du cours (résumé)

### I. Principe du dosage par titrage

- On détermine la quantité de matière de l'espèce **titrée** en la faisant réagir avec une espèce **titrante** selon une réaction de titrage **totale et rapide**. Schéma : burette graduée (espèce titrante A, c<sub>A</sub> connue), bécher (espèce titrée B, c<sub>B</sub> inconnue, V<sub>B</sub> prélevé à la pipette jaugée), agitation.
- Réaction aA + bB → cC + dD (exemple : 2 Fe<sup>2+</sup> + S<sub>2</sub>O<sub>8</sub><sup>2−</sup> → 2 Fe<sup>3+</sup> + 2 SO<sub>4</sub><sup>2−</sup>).
- **Équivalence** : moment où toute l'espèce titrée B a disparu ; les réactifs ont été introduits dans les proportions stœchiométriques ; **V<sub>éq</sub>** : volume de A versé à l'équivalence.
- **Relation à l'équivalence** n<sub>A</sub> / a = n<sub>B</sub> / b, soit c<sub>A</sub> V<sub>éq</sub> / a = c<sub>B</sub> V<sub>B</sub> / b, donc c<sub>B</sub> = b c<sub>A</sub> V<sub>éq</sub> / (a V<sub>B</sub>). **Démonstration** par le tableau d'avancement dont l'état initial est ce qui a été versé à l'équivalence (tous les réactifs disparus : x<sub>max</sub> = c<sub>A</sub>V<sub>éq</sub>/a = c<sub>B</sub>V<sub>B</sub>/b).
- **Exemple corrigé** (page 2, à reprendre fidèlement, c'est le modèle de rédaction) : V<sub>a</sub> = 10,0 mL d'acide chlorhydrique (H<sub>3</sub>O<sup>+</sup>), c<sub>a</sub> inconnue, titré par la soude (HO<sup>−</sup>) c<sub>b</sub> = 2,0 × 10<sup>−2</sup> mol·L<sup>−1</sup>, V<sub>e</sub> = 9,5 mL. **Schéma** : burette « soude : HO<sup>−</sup> ; c<sub>b</sub> = 2,0 × 10<sup>−2</sup> mol·L<sup>−1</sup> ; V<sub>e</sub> = 9,5 mL », bécher « ac. chlor. H<sub>3</sub>O<sup>+</sup> ; c<sub>a</sub> ? ; V<sub>a</sub> = 10,0 mL », agitation (« si le schéma n'est pas demandé » : un schéma minimal, burette et bécher, au brouillon). **Réaction** HO<sup>−</sup> + H<sub>3</sub>O<sup>+</sup> → 2 H<sub>2</sub>O. **Phrase** : « À l'équivalence, les réactifs ont été introduits dans les proportions stœchiométriques : n<sub>HO⁻</sub>/1 = n<sub>H₃O⁺</sub>/1 ⟺ c<sub>b</sub>V<sub>e</sub> = c<sub>a</sub>V<sub>a</sub> ⟺ c<sub>a</sub> = c<sub>b</sub>V<sub>e</sub>/V<sub>a</sub> = 2,0 × 10<sup>−2</sup> × 9,5 / 10,0 = 1,9 × 10<sup>−2</sup> mol·L<sup>−1</sup> » (V<sub>a</sub> entouré, déplacé par une flèche).
- Repérer l'équivalence : suivi d'une grandeur (pH, conductivité) ou changement de couleur.

### II. Titrage colorimétrique

- **Espèce colorée** : permanganate MnO<sub>4</sub><sup>−</sup> (violet) titrant l'eau oxygénée (incolore) : 2 MnO<sub>4</sub><sup>−</sup> + 6 H<sup>+</sup> + 5 H<sub>2</sub>O<sub>2</sub> → 2 Mn<sup>2+</sup> + 8 H<sub>2</sub>O + 5 O<sub>2</sub> ; incolore avant l'équivalence, rose (violet très clair) à l'équivalence.
- **Indicateur de fin de réaction** : thiosulfate / diiode avec quelques gouttes d'empois d'amidon (bleu foncé en présence de I<sub>2</sub>) : disparition du bleu à l'équivalence.
- **Indicateur coloré** (titrage acide-base) : couple acide/base dont les deux formes ont des couleurs différentes ; **sa zone de virage doit être dans le saut de pH**. Tableau : hélianthine rouge / 3,1–4,4 / jaune ; BBT jaune / 6,0–7,6 / bleu ; phénolphtaléine incolore / 8,2–10 / rose. Application : quatre courbes pH = f(V) (page 4) → indicateur et changement de couleur.

### III. Titrage pH-métrique

- Mode opératoire (burette, pH-mètre, bécher) ; exemples : acide fort titré par une base (pH qui augmente), base faible titrée par un acide fort (pH qui diminue).
- **Équivalence = saut de pH** ; V<sub>éq</sub> au milieu du saut : **méthode des tangentes** (deux tangentes parallèles aux arrondis, perpendiculaire commune, parallèle passant par son milieu, intersection avec la courbe) ou **maximum de la dérivée** (logiciel).

### IV. Titrage conductimétrique

- Mode opératoire (conductimètre) ; σ (mS·m<sup>−1</sup>) en fonction de V (mL) : deux portions de droites ; **V<sub>éq</sub> à l'intersection des deux droites**.
- On ajoute souvent de l'eau distillée dans le bécher pour limiter l'effet de la dilution : cela ne change pas les quantités de matière, donc la relation à l'équivalence reste c<sub>titrant</sub>V<sub>éq</sub>/a = c<sub>titré</sub>V<sub>prélevé à la pipette</sub>/b.
- **Interprétation du changement de pente** (page 7, méthode à reprendre) : titrage de CH<sub>3</sub>COOH par la soude (λ(Na<sup>+</sup>) = 5,0 ; λ(HO<sup>−</sup>) = 20 ; λ(CH<sub>3</sub>COO<sup>−</sup>) = 4,1 × 10<sup>−3</sup> S·m²·mol<sup>−1</sup>) : 1. schéma (« écrire tous les ions » : burette Na<sup>+</sup>, HO<sup>−</sup> ; bécher CH<sub>3</sub>COOH) ; 2. réaction CH<sub>3</sub>COOH + HO<sup>−</sup> → CH<sub>3</sub>COO<sup>−</sup> + H<sub>2</sub>O ; 3. bilan des ions **avant** l'équivalence (tableau : [HO<sup>−</sup>] 0 ; [Na<sup>+</sup>] ↗ ; [CH<sub>3</sub>COO<sup>−</sup>] ↗) ; 4. **après** ([HO<sup>−</sup>] ↗ ; [Na<sup>+</sup>] ↗ ; [CH<sub>3</sub>COO<sup>−</sup>] constante) ; 5. conclusion avec σ = λ(HO<sup>−</sup>)[HO<sup>−</sup>] + λ(Na<sup>+</sup>)[Na<sup>+</sup>] + λ(CH<sub>3</sub>COO<sup>−</sup>)[CH<sub>3</sub>COO<sup>−</sup>] : σ ↗ avant, σ ↗ plus vite après car λ(HO<sup>−</sup>) > λ(CH<sub>3</sub>COO<sup>−</sup>). « Astuce : regarder les λ(ions) dans les données. » **Autre rédaction** (brouillon du professeur) : dans le tableau, on note la contribution relative de chaque ion (« + 5,0 », « + 4,1 » → + 9,1 avant ; « + 20 », « + 5,0 » → + 25 après).

## Plan de l'application (`PLAN`)

### Module 1 : Schéma et équation du titrage (méthode 1)

- Cours (sous-modules) : principe et vocabulaire ; **acides et bases usuels à connaître** (soude Na<sup>+</sup> + HO<sup>−</sup>, potasse, acide chlorhydrique H<sub>3</sub>O<sup>+</sup> + Cl<sup>−</sup>, acide nitrique, acide sulfurique, acide éthanoïque CH<sub>3</sub>COOH, ammoniaque NH<sub>3</sub>, ion éthanoate, acide lactique, acide ascorbique, aspirine…) avec leur espèce **réactive** (« acide chlorhydrique → H<sub>3</sub>O<sup>+</sup> » ; « une espèce qui s'appelle “acide …” donne H<sup>+</sup> ») ; écrire la réaction de titrage (acide-base : le H<sup>+</sup> passe, rappel de l'outil d'échange du proton de « Transformations acide-base » ; oxydoréduction : lien facultatif vers `oxydoreduction-spe/`).
- **Atelier : schéma du titrage** (`module_1_simulation.html`, page `simulation` « Atelier : schéma du titrage », un écran) — cœur de la consigne 1 :
  - un **énoncé** (texte de protocole réaliste, comme les ex. 1 à 5 et 9) à gauche ou dans un onglet ; un **schéma** burette + bécher + agitateur ;
  - l'élève **surligne / glisse** les données de l'énoncé sur le schéma : pour la burette, **formule des espèces**, c, V<sub>éq</sub> ; pour le bécher, **formule des espèces**, c<sub>inconnue</sub> (« ? »), V<sub>pipette</sub> ; les étiquettes se placent seulement sur le bon récipient (« la solution de concentration connue est dans la burette » ; « le volume prélevé à la pipette jaugée est dans le bécher ») ;
  - puis il **écrit l'équation** (espèces à choisir parmi celles du schéma, coefficients) ;
  - puis la **relation à l'équivalence**, en trois temps : la phrase (à compléter), n<sub>A</sub>/a = n<sub>B</sub>/b avec les bons coefficients et indices, puis **le remplacement des n par les c × V lus sur le schéma** (glisser c × V depuis le schéma dans la relation) ; enfin le calcul (la grandeur cherchée isolée, unités).
  - Situations (pastilles, dans n'importe quel ordre) : exemple du cours, ex. 1 à 4, protocoles de l'ex. 5, ex. 9 (aspirine, dilution dans une fiole de 500,0 mL), plus une banque tirée au hasard (acide-base et oxydoréduction, coefficients différents de 1 : H<sub>2</sub>SO<sub>4</sub> + soude, I<sub>2</sub> + 2 S<sub>2</sub>O<sub>3</sub><sup>2−</sup>, MnO<sub>4</sub><sup>−</sup> + Fe<sup>2+</sup>…).
  - Diagnostics : espèce titrante mise dans le bécher ; V<sub>éq</sub> attribué au bécher ; ion spectateur écrit dans l'équation (Na<sup>+</sup>, Cl<sup>−</sup>) ; « acide chlorhydrique » écrit HCl au lieu de H<sub>3</sub>O<sup>+</sup> ; coefficients oubliés dans la relation ; n<sub>A</sub>/a = n<sub>B</sub>/b inversé (n<sub>A</sub> × a) ; V<sub>éq</sub> et V<sub>B</sub> échangés.
- Série : placer une donnée, identifier titrant/titré, écrire la réaction, relation à l'équivalence, calcul de c, de n ou de m (masse : m = n × M, volume de la fiole en cas de dilution).

### Module 2 : Repérer l'équivalence

Sous-modules de cours : colorimétrique (espèce colorée, indicateur de fin de réaction, indicateur coloré et zone de virage) ; pH-métrique (saut, tangentes, dérivée) ; conductimétrique (intersection des droites, interprétation des pentes).

- **Simulateur de titrage** (`module_2_simulation.html`, page `simulation` « Simulateur : titrages ») : **réutilise `TITRAGE`** (modèle chimique, montage, courbe, outils de repérage déjà écrits pour `titrage-ph/`), avec trois suivis au choix (couleur, pH, conductivité) et plusieurs couples titrant/titré ; indicateur coloré à choisir (sa couleur dans le bécher suit le pH) ; repérage de V<sub>éq</sub> par tangentes, dérivée ou intersection de droites. Un écran ; défis : choisir l'indicateur adapté à chaque courbe ; trouver V<sub>éq</sub> par deux méthodes ; expliquer le changement de pente (QCM sur les λ).
- **Pages externes ↗** (`00-commun.md` §6, type 2, obligatoires) :
  - `titrage-conductimetrique/` : `module_1_animation` (animation des ions pendant un titrage conductimétrique), après le cours sur la conductimétrie ;
  - `titrage-ph/` : `module_3a_equivalence` (« Repérer le volume équivalent »), après le cours sur la pH-métrie.
- **Lien facultatif** (type 1) : le reste de `titrage-ph/` (« TP : titrage pH-métrique du Destop » : dilution, montage, Regressi, titre massique, incertitudes).
- Série : indicateur coloré adapté (lecture du saut sur une courbe), couleur avant / après l'équivalence, V<sub>éq</sub> par une méthode graphique (`LG`), évolution des concentrations des ions avant et après (tableau ↗ / ↘ / constante / 0), justification du changement de pente (rédaction du cours, phrase à compléter).

### Module 3 : Exploiter un titrage (méthode 2 : la concentration d'abord)

- Cours court : **composition du système après ajout d'un volume V de titrant** (tableau d'avancement, transformation totale ; avant et après l'équivalence) ; **préparer une solution à partir d'un titre massique et d'une densité** (lien avec « Rappels de chimie », pourcentage massique) ; **question complexe : calculer d'abord la concentration inconnue** (même réflexe que dans « Méthodes physiques d'analyse », module 4), puis titre massique, masse dans un comprimé, conformité à une étiquette, en tenant compte des dilutions ; **incertitudes** (incertitude relative composée, formule fournie, comme l'ex. 9 ; compatibilité avec une valeur de référence).
- Série : problèmes à questions complexes (« Par quoi commences-tu ? » puis le calcul), composition du système à V donné, incertitude relative.

### Module 4 : Exercices

Ex. 1 à 12 de la feuille, guidés : chaque exercice commence, quand c'est utile, par l'**atelier de schéma en partie `perso`** (données placées sur le schéma, réaction, relation à l'équivalence). Ex. 9 (aspirine) : masse m<sub>exp</sub>, incertitude relative avec u(V<sub>A</sub>) = 0,1/√3 mL, u(c<sub>B</sub>) = 0,02 mol·L<sup>−1</sup>, u(V<sub>E</sub>) = 0,1 mL (vérifie ces données sur l'énoncé : u(c<sub>B</sub>) = 0,02 mol·L<sup>−1</sup> pour c<sub>B</sub> = 1,00 × 10<sup>−2</sup> mol·L<sup>−1</sup> paraît incohérent, sans doute 0,02 × 10<sup>−2</sup> ; signale-le), sachet 500 ou 1000. Ex. 11 et 12 : titrages conductimétriques (λ<sub>Ag⁺</sub> = 6,19 ; λ<sub>NO₃⁻</sub> = 7,1 ; λ<sub>Cl⁻</sub> = 7,63 mS·m²·mol<sup>−1</sup> ; λ<sub>H₃O⁺</sub> = 35 mS·m²·mol<sup>−1</sup>…), changement de pente.

## Vérifications propres

- Script : chaque calcul des exercices (c, n, m, incertitudes) ; dans l'atelier, chaque situation de la banque (équation équilibrée, charges conservées).
- Atelier de schéma : étiquette posée sur le mauvais récipient refusée avec son explication ; relation construite juste pour des coefficients différents de 1.
- Pages ↗ : l'état de `titrage-conductimetrique` et de `titrage-ph` (page 3a) remonte dans le sommaire après les avoir faites.
- `TITRAGE` : si tu l'étends (indicateurs colorés, nouveaux couples), reteste `titrage-ph/`.
