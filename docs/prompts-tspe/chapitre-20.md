# Mouvements d'un fluide (prompt de génération)

Lis d'abord `docs/prompts-tspe/00-commun.md` (sources, charte, structure, outils partagés, livraison).

## Application

- Dossier `mecanique-fluides/`, nom « Mouvements d'un fluide », `data-matiere="physique"`, préfixe `mf`, espace de noms `MF`.
- Portail : `desc: "Force pressante, poussée d'Archimède, débit volumique, relation de Bernoulli, effet Venturi, statique des fluides."` ; `mots` : pression, pascal, force pressante, poussée d'Archimède, fluide déplacé, flotter, volume immergé, débit volumique, conservation du débit, section, vitesse d'écoulement, Bernoulli, ligne de courant, fluide parfait, incompressible, régime permanent, Venturi, portance, aile d'avion, pulvérisateur, trompe à eau, Torricelli, vidange, hydrostatique…
- Dessin d'en-tête : celui de `statique-fluides/` (STI2D) s'il convient, sinon lignes de courant autour d'un profil d'aile (nouveau dessin `ecoulement`).
- Outils : `VEC`, `EQ` (isoler v dans Bernoulli), `BULLE`, `PLEIN` ; `canvas` pour les particules de l'écoulement.

## Sources (`20- Mouvements d'un fluide/`)

| Fichier | Contenu | À lire |
|---|---|---|
| `Chap20-Cours-Exercices complete.pdf` (8 p.) | Cours complété à la main (pages 1 à 6) puis **exercices** (pages 7 et 8 : ex. 1 à 6, dont ex. 3 jet d'eau, ex. 4 conduite forcée et formule de Torricelli) | Non pour le cours (résumé ci-dessous ; page 2 pour l'origine de la poussée d'Archimède, pages 3 à 5 pour les démonstrations manuscrites) ; oui pour les exercices |
| `Chap20-Correction exercices.pdf` (6 p.) | Corrections manuscrites | Oui |

## Consignes du professeur

- **Origine de la poussée d'Archimède** : une **petite animation dans le cours** où l'on voit **une boule sortir de l'eau d'un bécher** et la **zone correspondante dans l'eau visualisée en pointillés** (le « fluide déplacé » : le volume que la boule occupait, rempli d'eau, est en équilibre ; les forces de pression de l'eau autour sont les mêmes : leur résultante, la poussée, est l'opposé du poids de cette eau).
- **Simulateur des applications de l'effet Venturi** : **pulvérisateur**, **trompe à eau**, **aile d'avion**. Pour l'aile : une animation montre que **la vitesse de l'air sur la surface supérieure est plus grande que sur la surface inférieure** (on **suit des particules**, comme dans une simulation numérique de mécanique des fluides). **Idée générale** pour ces applications : faire le lien **débit constant + rétrécissement → v plus grande (conservation du débit) → P plus faible (loi de Bernoulli)**.

## Contenu du cours (résumé)

### I. Poussée d'Archimède

- **Force pressante** F = P × S (N, Pa, m²) ; exemple : pression atmosphérique sur 1 m² (≈ 10<sup>5</sup> N).
- **Origine** (page 2, manuscrite : à lire pour reprendre l'explication du professeur) : différence des forces de pression entre le bas et le haut du corps immergé (la pression augmente avec la profondeur).
- **Expression** : la poussée d'Archimède est l'opposé du poids du fluide déplacé : **π⃗ = −ρ<sub>fluide</sub> V<sub>immergé</sub> g⃗** (kg·m<sup>−3</sup>, m³, N·kg<sup>−1</sup>).
- Exemple : cylindre de peuplier (H = 1,25 m, S = 0,250 m², ρ<sub>bois</sub> = 390 kg·m<sup>−3</sup>) totalement immergé dans l'eau de mer (ρ = 1025 kg·m<sup>−3</sup>) : π = ρ<sub>mer</sub> V g ≈ 3,14 × 10³ N (V = 0,3125 m³) ; poids ≈ 1,20 × 10³ N : il remonte et flotte ; à l'équilibre, π = P ≈ 1,20 × 10³ N ; V<sub>immergé</sub> = ρ<sub>bois</sub>V/ρ<sub>mer</sub> ≈ 0,119 m³.

### II. Débit volumique

- D<sub>V</sub> = V/Δt (m³·s<sup>−1</sup>) ; **fluide incompressible en régime permanent : D<sub>V</sub> constant** le long d'une canalisation ; **D<sub>V</sub> = S × v** (démonstration : le volume S × v Δt traverse la section pendant Δt) ; changement de section : **S<sub>A</sub>v<sub>A</sub> = S<sub>B</sub>v<sub>B</sub>** : **si la section diminue, la vitesse augmente**.

### III. Relation de Bernoulli

- Ligne de courant ; le long d'une ligne de courant, fluide parfait incompressible, régime permanent : **½ρv² + ρgz + P = constante** (fournie) ; entre A et B : ½ρv<sub>A</sub>² + ρgz<sub>A</sub> + P<sub>A</sub> = ½ρv<sub>B</sub>² + ρgz<sub>B</sub> + P<sub>B</sub>.
- **Interprétation énergétique** : énergie cinétique volumique, énergie potentielle de pesanteur volumique, énergie volumique des forces de pression : conservation de l'énergie.
- Air (compressible) : utilisable tant que v ≪ v<sub>son</sub>.
- **Vidange par un trou** (H = 10 m, A et B à P<sub>0</sub>, v<sub>A</sub> ≈ 0) : v<sub>B</sub> = √(2gH) ≈ 14 m·s<sup>−1</sup>.
- **Effet Venturi** : dans une conduite horizontale, si la section diminue, la vitesse augmente et la pression diminue (démonstration : S<sub>A</sub>v<sub>A</sub> = S<sub>B</sub>v<sub>B</sub> puis Bernoulli à z constant). Applications : **pulvérisateur de parfum**, **trompe à eau** (aspiration), **portance d'une aile d'avion**.

### IV. Fluides au repos (révision de 1<sup>re</sup>)

- Bernoulli avec v = 0 : ρgz + P = constante, soit **P<sub>2</sub> − P<sub>1</sub> = ρg(z<sub>1</sub> − z<sub>2</sub>)** : si on descend de h, la pression augmente de ρgh.
- Applications : surface libre horizontale, baromètre à mercure, mesure de pression, crève-tonneau de Pascal.

## Plan de l'application (`PLAN`)

### Module 1 : Pression et poussée d'Archimède

- Cours : force pressante ; **origine de la poussée d'Archimède** avec l'**animation demandée** dans une étape du cours (dans la page de cours, en SVG : bécher d'eau, une boule immergée ; « Sortir la boule » : la boule monte et sort, et la **zone qu'elle occupait apparaît en pointillés**, remplie d'eau, avec les forces de pression autour (flèches plus longues en bas qu'en haut) et leur résultante π⃗ ; « Remettre la boule » ; affichage du poids de l'eau de la zone pointillée = π ; reduced-motion : étapes au bouton) ; expression vectorielle ; flotter ou couler (comparer π et P, ou ρ<sub>corps</sub> et ρ<sub>fluide</sub>) ; volume immergé à l'équilibre.
- Série : F = PS, π, flotte ou coule, volume immergé, iceberg, montgolfière (lien avec Thermodynamique), sens et direction de π⃗.
- Lien facultatif : `statique-fluides/` (révisions de pression et statique, application STI2D).

### Module 2 : Débit et relation de Bernoulli

- Cours (sous-modules) : débit, conservation, S<sub>A</sub>v<sub>A</sub> = S<sub>B</sub>v<sub>B</sub> ; Bernoulli et son interprétation énergétique (lien avec l'énergie mécanique) ; vidange (Torricelli, avec `EQ` pour isoler v) ; statique des fluides comme cas particulier.
- Série : débit, vitesse après un rétrécissement (rapport des sections, diamètres : S = πd²/4, diagnostic « tu as utilisé le rapport des diamètres, pas des sections »), pression avec Bernoulli, vidange, Δp = ρgh.

### Module 3 : Effet Venturi et ses applications

- **Simulateur : effet Venturi** (`module_3_simulation.html`, page `simulation`, un écran) — consigne du professeur :
  - **onglet « Tube de Venturi »** : conduite horizontale avec un rétrécissement réglable ; **particules** qui suivent les lignes de courant (plus serrées et plus rapides dans le rétrécissement) ; vitesses et pressions en A et B en continu (manomètres, ou tubes verticaux dont le niveau baisse dans le rétrécissement) ; la chaîne **« débit constant + section ↘ → v ↗ (conservation du débit) → P ↘ (Bernoulli) »** s'affiche et s'allume étape par étape quand on resserre ;
  - **onglet « Pulvérisateur »** : on presse la poire : l'air passe vite au-dessus du tube plongeur, la pression y baisse, le liquide monte et est pulvérisé ;
  - **onglet « Trompe à eau »** : l'eau accélère dans le rétrécissement, la pression baisse, l'air (ou le gaz d'une fiole à vide) est aspiré ;
  - **onglet « Aile d'avion »** : profil d'aile (incidence réglable) dans un écoulement ; **particules lâchées ensemble en amont** (lignes de « marqueurs » comme en soufflerie ou en simulation numérique) : celles qui passent **au-dessus arrivent avant** celles qui passent dessous ; vitesses comparées, pressions dessus / dessous, **portance** (flèche) ; vitesse de l'avion réglable (la portance augmente) ;
  - l'écoulement est calculé par un **modèle simple et stable** (écoulement potentiel autour d'un profil par transformation conforme de Joukowski, ou champ précalculé et interpolé), signalé comme modèle dans une bulle ⓘ ; il doit montrer qualitativement juste : vitesse plus grande dessus, pression plus faible dessus ;
  - défis dans n'importe quel ordre : doubler la vitesse dans le rétrécissement (section ÷ 2) ; faire monter le liquide du pulvérisateur ; aspirer avec la trompe ; montrer que les particules du dessus de l'aile arrivent en premier ; augmenter la portance.
- Cours (après le simulateur) : l'effet Venturi démontré ; les trois applications expliquées avec la même chaîne.
- Série : sens de variation de v et P dans un rétrécissement, explication d'une application (phrases à remettre dans l'ordre : débit constant → v ↗ → P ↘), calcul d'une différence de pression.

### Module 4 : Exercices

Ex. 1 à 6 de la feuille (pages 7 et 8 du document de cours) ; ex. 3 (jet d'eau : hauteur théorique et observée) et ex. 4 (Torricelli, conduite forcée : vérifie l'expression de v<sub>C</sub> sur l'énoncé et la correction, le texte extrait semble écrire √(2g × 2H)).

## Vérifications propres

- Script : exemple du cylindre (3,14 × 10³ N ; 1,20 × 10³ N ; 0,119 m³), vidange (14 m·s<sup>−1</sup>), chaque exercice.
- Animation d'Archimède : fonctionne dans la page de cours, plusieurs exemplaires possibles (« Afficher tout le cours »), reduced-motion.
- Simulateur : un écran à 1280 × 720 / 650 et 390 × 844, fluidité (particules en `canvas`, 60 images/s visées, réduites sur téléphone), défis dans le désordre.
