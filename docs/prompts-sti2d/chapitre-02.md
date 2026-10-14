# Chapitre 2 : Piles et accumulateurs (prompt de génération)

Lis d'abord `docs/prompts-sti2d/00-commun.md` (sources, charte, structure, livraison).

## Application

- Dossier `piles-accumulateurs/`, nom « Chapitre 2 : Piles et accumulateurs », `data-matiere="physique"` (partie « Énergie » du programme), préfixe `pa2`. Pas `pa` : ce préfixe est pris par Puissance active.
- Portail :
  - desc : « Capacité, énergie disponible, énergies massique et volumique, branchements. »
  - dessin d'en-tête : `formules:pile`.

## Sources (`TSTI2D/02- Piles et accumulateurs/`)

| Fichier | Contenu | À lire |
|---|---|---|
| `Chap02-Cours complete g3.docx` | « À retenir » complété à la main (seule version complétée, pas de PDF) | Non : résumé ci-dessous. Si besoin, conversion `soffice` (cf. commun) ; les formules tapées (E = U × Q) n'apparaissent pas dans ce rendu, elles sont dans `Chap02-Cours.pdf` |
| `Chap02-Exercices.pdf` (2 p.) | Manuel : ex. 7, 10, 11, 14 p. 40-41 et Activité 2 p. 37 (accumulateurs) | Oui (données, tableaux, photos des batteries à décrire) |
| `Chap02-Exercices correction.pdf` (3 p.) | Corrections manuscrites | Oui |

## Contenu du cours

### Module 1 : Pile ou accumulateur

- **Schéma de conversion** : espèces chimiques → (énergie chimique) → pile → (énergie électrique) → moteur.
- **Réversibilité** : une pile n'est **pas réversible** ; un accumulateur **est réversible** (on peut le recharger).
- **Vocabulaire** :
  - force électromotrice (f.é.m.) = tension nominale = **tension à vide** (rien de branché) ;
  - capacité Q = quantité d'électricité que peut fournir la pile (Ah, mAh).
- **Technologies** (Doc. 2 de l'Activité 2) : plomb-acide (voitures), Ni-Cd (polluant, fiable, longue durée de vie), Ni-MH (portables, voitures hybrides), Li-ion. Tableau : énergie massique, f.é.m., nombre de cycles.
- **Série** : QCM de vocabulaire et de reconnaissance (pile ou accumulateur, tension à vide, capacité), schéma de conversion à compléter.

### Module 2 : Capacité et énergie disponible

- **Capacité** : Q = I × Δt (Q en Ah, I en A, Δt en h), donc Δt = Q / I.
  
  Exemple du cours (pile 2600 mAh) : débitée à 2600 mA, elle se décharge en 1 h ; à 30 mA, elle dure 2600/30 ≈ 87 h. Le professeur montre aussi le raisonnement « combien de fois 30 dans 2600 ».
- **Énergie disponible** : E = U × Q.
  - Q en Ah donne E en **Wh** (V × A × h) ;
  - Q en A·s donne E en **J** (V × A × s).
  
  Conversions mAh → Ah et Wh → J (× 3600).
- **Série** : E à partir de U et Q (mAh à convertir), durée de fonctionnement Δt = Q / I, intensité totale de plusieurs appareils.
  
  Erreurs à diagnostiquer : mAh non converti, Wh et J confondus, Q / I inversé.

### Module 3 : Énergies massique et volumique

- **Énergie massique** : E<sub>m</sub> = E / m en Wh/kg (Wh·kg⁻¹).
  
  Exemple : pile de 20 g, E<sub>m</sub> = 130 Wh·kg⁻¹, donc E = 130 × 0,020 = 2,6 Wh.
- **Énergie volumique** : E<sub>V</sub> = E / V en Wh/m³.
  
  Exemple : V = E / E<sub>V</sub> = 4,0 × 10³ / 1,2 × 10⁵ ≈ 3,3 × 10⁻² m³.
- **Trois méthodes montrées par le professeur** (garde-les, au choix de l'élève, avec un « OU ») :
  1. l'analyse des unités : Wh/kg × kg = Wh ;
  2. un **tableau de proportionnalité** avec les unités en tête de ligne (Wh | 130 | ? ; kg | 1 | 0,020) et le produit en croix ;
  3. la formule E<sub>m</sub> = E / m que l'on isole.
- **Outil.** Le tableau de proportionnalité à remplir est un item `perso`. Lien vers `proportionnalite/`.
- **Volume d'un pavé** (ex. 14) : dimensions en mm à convertir en m avant de multiplier.
- **Série** : calculer E, m ou V à partir de E<sub>m</sub> ou E<sub>V</sub>, comparer deux batteries.

### Module 4 : Branchements

- **Série** : les **tensions** s'additionnent. **Dérivation** (= parallèle) : les **intensités** (et les capacités) s'additionnent.
- **Nombre de cellules** = U<sub>batterie</sub> / U<sub>cellule</sub> (batterie au plomb 12 V : 6 cellules de 2 V).
- **Outil `perso`** : assembler n cellules identiques (U, Q) en série et/ou en dérivation pour obtenir une tension et une capacité demandées ; tension, capacité et énergie s'affichent.
- **Série** : tension ou capacité d'un assemblage, nombre de cellules, type de branchement pour un besoin donné.

## Exercices (même numérotation que le manuel)

**Ex. 7 p. 40** : E = Q × U.
- a) 0,105 Ah × 1,55 V = 0,163 Wh ;
- b) 2,400 × 1,5 = 3,6 Wh ;
- c) 0,9 × 7,4 = 6,7 Wh (7 Wh avec un chiffre significatif).

**Ex. 10 p. 40** : E = 80 × 12 = 960 Wh ; 12 / 2 = 6 cellules.

**Ex. 11 p. 41** : U = 40 V ; 11 cellules comptées sur la photo ; 40/11 = 3,6 V par cellule ; E = 40 × 40 = 1600 Wh.
- Pour le comptage, décris la batterie en SVG : 11 cellules visibles.

**Ex. 14 p. 41** (camping-car) :
- a) I = 1,3 + 0,60 + 1,5 + 3,9 + 3,8 + 0,085 ≈ 11,2 A ;
- b) E<sub>1</sub> = 960 Wh, E<sub>2</sub> = 1440 Wh ;
- c) V<sub>1</sub> = 0,330 × 0,171 × 0,2355 ≈ 0,0133 m³, V<sub>2</sub> ≈ 0,0216 m³ ;
- d) E<sub>V1</sub> ≈ 7,22 × 10⁴ Wh/m³, E<sub>V2</sub> ≈ 6,67 × 10⁴ Wh/m³ ;
- e) E<sub>m1</sub> = 960 / 32,6 ≈ 29,4 Wh/kg, E<sub>m2</sub> ≈ 34,5 Wh/kg.
  
  La correction manuscrite note ces énergies massiques « E<sub>V</sub> » par erreur : écris E<sub>m</sub>.
- f) Δt = Q / I : 80 / 11,2 ≈ 7,1 h et 120 / 11,2 ≈ 10,7 h. Garde aussi le raisonnement « combien de fois 11,2 A dans 80 A·h ».
- g) aucune ne tient une journée : il faut deux batteries (en dérivation).

**Activité 2 p. 37** (exercice « Activité 2 », à la suite) :
1. 12 V : on associe plusieurs accumulateurs **en série** ;
2. Q = 75 Ah (lu sur la photo) ;
3. masse pour stocker 5000 Wh, avec la limite haute de l'énergie massique : plomb 100 kg, Ni-Cd 62,5 kg, Ni-MH 45,5 kg, Li-ion (voir ci-dessous) ;
4. Ni-Cd : très fiables, longue durée de vie.

**⚠ À trancher.** Le tableau du manuel donne pour le Li-ion 1500-2500 Wh·kg⁻¹, valeur fausse d'un facteur 10 : la réalité est 150-250 Wh·kg⁻¹. La correction en déduit 2 kg. Dans l'application, utilise **150-250 Wh·kg⁻¹ (m = 20 kg)** et ajoute une remarque « le manuel indique 1500-2500, c'est une coquille ». Signale-le dans ton compte rendu.
