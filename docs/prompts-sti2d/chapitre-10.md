# Chapitre 10 : Énergie transportée par la lumière (prompt de génération)

Lis d'abord `docs/prompts-sti2d/00-commun.md` (sources, charte, structure, livraison).

## Application

- Dossier `energie-lumiere/`, nom « Énergie transportée par la lumière », `data-matiere="physique"`, préfixe `el`.
- Portail : desc « Capteurs photothermiques et photovoltaïques, photon E = h f, caractéristique d'un panneau solaire. » ; dessin d'en-tête : nouveau dessin « soleil, rayons et panneau » dans `hero.js`, ou `formules:physique`.

## Sources (`TSTI2D/10- Energie transportee par la lumiere/`)

| Fichier | Contenu | À lire |
|---|---|---|
| `Chap10-Cours-complete.pdf` (2 p.) | Cours complété à la main (exemples, astuces, notes « question bac ») | Non : résumé ci-dessous. Page 2 pour refaire la caractéristique I(U) annotée et le circuit de mesure |
| `Chap10-Activites-complete.docx` | Activité (capteurs hybrides ; effet photoélectrique) complétée, **sans PDF complété** | Seulement si besoin : conversion `soffice` (cf. commun), 2 pages. Réponses ci-dessous |
| `Chap10-Exercices.pdf` (1 p.) | Ex. 7, 8 p. 129 ; 14 p. 131 ; 10 p. 130 ; 15 p. 131 | Oui (schéma de l'ex. 10, documents et graphique de l'ex. 15) |
| `Chap10-Correction exercices.pdf` (2 p.) | Corrections tapées | Oui |

Ignore `Chap10-Cours.pdf` / `.docx` et `Chap10-Activites.pdf` / `.docx`, les versions vierges.

## Contenu du cours

### Module 1 : Récupérer l'énergie lumineuse

- **Deux conversions** :
  - énergie solaire (lumineuse) → **convertisseur photothermique** (panneau thermique) → énergie thermique ;
  - énergie solaire → **convertisseur photoélectrique** (panneau photovoltaïque) → énergie électrique.
- **Rendement** : r (ou η) = P<sub>utile</sub> / P<sub>absorbée</sub> = E<sub>utile</sub> / E<sub>absorbée</sub>. Schéma : absorbée → appareil → utile + perdue (lien avec le chapitre 1).
- **Activité I** (page `simulation`, d'après l'activité complétée) : maison à très faible consommation (doc. 1), technologies de cellules (doc. 2). Schémas énergétiques à compléter par glisser-déposer :

  | Capteur | Énergie reçue | Énergie fournie |
  |---|---|---|
  | géothermique | thermique | thermique |
  | photovoltaïque | solaire (rayonnement, lumineuse) | électrique |
  | hybride | solaire | thermique **et** électrique |

  - Intérêt du capteur hybride : meilleur rendement.
  - Cellule la plus répandue : silicium multicristallin, meilleur compromis prix / rendement.
- **Série** : schémas énergétiques, type de conversion d'un dispositif, rendement (calcul et isolement).

### Module 2 : Conversion photothermique

- **Formule** : Q = m × c × (T<sub>f</sub> − T<sub>i</sub>) (Q en J, m en kg, c en J·kg⁻¹·K⁻¹ ou J·kg⁻¹·°C⁻¹).
  
  Note : même écart en K et en °C, pas de conversion ici (« si la température monte de 10 °C, elle monte de 10 K »).
- **Débits** (L·s⁻¹, m³·h⁻¹) : D = V / Δt, donc V = D × Δt. Deux méthodes, comme dans le cours :
  - proportionnalité : 0,25 m³ en 1 h, donc 6 m³ en 24 h ;
  - formule.
  
  1 L d'eau = 1 kg, 1 m³ = 1000 kg.
- **Série** : Q, élévation de température, masse d'eau d'après un débit, énergie reçue par un capteur.

### Module 3 : Ondes et photons

- **Relation fréquence – longueur d'onde** : λ = c / f, f = c / λ (c = 3,00 × 10⁸ m·s⁻¹ ; f en Hz ; λ en m).
  
  Astuce du professeur : λ et f sont inverses ; au numérateur, on met la vitesse de l'onde en m/s (pour le son, v = 340 m/s).
- **Exemples** :
  - 107,7 MHz donne λ ≈ 2,79 m ;
  - laser de 650 nm donne f ≈ 4,62 × 10¹⁴ Hz ;
  - la<sub>3</sub> à 440 Hz donne λ = 340 / 440 ≈ 0,773 m.
- **Spectre électromagnétique** (bande λ et f à refaire en SVG) : γ, X, UV, visible (400-800 nm), IR, micro-ondes, radio.
- **Photon** : E = h × f = h c / λ (h = 6,63 × 10⁻³⁴ J·s) ; 1 eV = 1,602 × 10⁻¹⁹ J.
- **Niveaux d'énergie de l'atome** :
  - **absorption** : l'électron gagne ΔE = E<sub>2</sub> − E<sub>1</sub> = h f. C'est le principe du **panneau photovoltaïque** : si l'énergie suffit à arracher l'électron, il y a un courant ;
  - **émission** : l'électron perd ΔE = h f. C'est le principe de la **LED** (DEL, diode électroluminescente).
- **Outil `perso`** : diagramme de niveaux E<sub>1</sub>, E<sub>2</sub>, E<sub>3</sub>. L'élève choisit une transition ; le photon (ondulation) entre ou sort, et f, λ, la couleur ou le domaine s'affichent. Couleur du photon via les attributs SVG, comme `VEC.C`.
- **Activité II** (effet photoélectrique) :
  - Einstein, prix Nobel 1921 pour l'effet photoélectrique (aussi la relativité, E = mc²) ;
  - ionisation de l'hydrogène : 13,6 eV = 2,18 × 10⁻¹⁸ J ;
  - E = h f ;
  - f ≈ 3,29 × 10¹⁵ Hz ;
  - λ ≈ 9,1 × 10⁻⁸ m.
- **Série** :
  - λ ↔ f avec préfixes (MHz, GHz, THz, nm, µm) ;
  - E = h f et E = h c / λ ;
  - domaine d'une onde ;
  - eV ↔ J ;
  - absorption ou émission.
  
  Erreurs : préfixe non converti, λ = f / c, h oublié. Lien vers `puissances-10/`.

### Module 4 : Panneau photovoltaïque et puissance solaire

- **Caractéristique I = f(U)** d'un panneau : le **point de fonctionnement** est celui où la puissance P = U × I est **maximale**, quand U et I sont tous les deux grands en même temps.
  
  On y lit P<sub>max</sub> = U<sub>nominal</sub> × I<sub>nominal</sub> et la tension à vide (I = 0). Variante de sujet : on donne directement la courbe P(U), et P<sub>max</sub> est son sommet.
- **Outil `perso` (obligatoire)** : caractéristique I(U) avec un point glissable. Le rectangle O-U-I-point est dessiné, son aire vaut P = U × I, et P s'affiche en direct ; une petite courbe P(U) suit en dessous. Le rectangle d'aire maximale fait comprendre où est le point de fonctionnement.
- **« Question bac » : le circuit pour tracer la caractéristique** : panneau, ampèremètre **en série**, voltmètre **en dérivation**, résistance variable.
  
  Schéma à compléter par glisser-déposer des appareils.
- **Puissance solaire reçue** : P<sub>soleil</sub> est donnée par unité de surface (W·m⁻², appelée aussi **irradiance** : « se concentrer sur l'unité »).
  - Exemple : 500 W·m⁻² sur S = 2,4 m² donne P<sub>reçue</sub> = 500 × 2,4 = 1200 W.
  - Deux méthodes : proportionnalité (500 W ↔ 1 m² ; ? ↔ 2,4 m²) ou formule et unités (W/m² × m² = W).
  - Énergie : E = P × Δt.
- **Série** :
  - point de fonctionnement sur une caractéristique générée ;
  - P<sub>reçue</sub> = irradiance × S ;
  - rendement d'un panneau ;
  - surface de N cellules carrées (côté en mm).

## Exercices (ordre de la correction)

Donnée de la feuille : h = 6,63 × 10⁻³⁴ J·s.

**Ex. 7 p. 129** :
1. E :
   - a) 1,7 × 10⁻²⁸ J ;
   - b) 2,49 × 10⁻²² J ;
   - c) 2,5 × 10⁴ THz = 2,5 × 10¹⁶ Hz, donc 1,7 × 10⁻¹⁷ J ;
2. « plus f est grande, plus E est grande » ;
3. f :
   - a) 7,5 × 10¹⁸ Hz ;
   - b) 6,8 × 10¹⁴ Hz ;
   - c) 3,8 × 10⁹ Hz ;
4. « plus l'énergie est petite, plus la fréquence est petite ».

**Ex. 8 p. 129** :
1. E :
   - a) 5,7 × 10⁻²⁶ J ;
   - b) 4,0 × 10⁻²¹ J ;
   - c) 3,98 × 10⁻¹⁹ J ;
   - d) 5,0 × 10⁻¹⁸ J ;
   - e) 4 × 10⁻¹⁶ J ;
   - f) 4,0 × 10⁻¹³ J ;
2. « plus λ est petite, plus E est grande » ;
3. λ :
   - a) 4,0 × 10⁻¹¹ m (X) ;
   - b) 4,4 × 10⁻¹⁰ m (X) ;
   - c) 0,080 m (hertzien) ;
4. « plus l'énergie est petite, plus λ est grande ».

**Ex. 14 p. 131** :
- a) Q = 500 × 3,40 × 7200 ≈ 1,22 × 10⁷ J ;
- b) V = 1 m³/h × 2 h = 2 m³ ;
- c) Δθ = 1,22 × 10⁷ / (2000 × 4185) ≈ 1,46 K, faible, d'où 6 capteurs en série ; conversion photothermique.

La feuille donne c<sub>eau</sub> = 4,18 kJ·kg⁻¹·K⁻¹ et la correction utilise 4185 : choisis 4180 et donne ≈ 1,46 K.

**Ex. 10 p. 130** : énergie reçue solaire → chauffe-eau solaire thermique → énergie utile thermique + énergie cédée à l'environnement thermique.

Schéma à compléter.

**Ex. 15 p. 131** (342 modules de 60 cellules) :
- a) chaîne : solaire → panneau PV → électrique + perte thermique ;
- b) point de fonctionnement (29,7 V ; 7,5 A) sur la courbe, avec l'outil rectangle ;
- c) P = 29,7 × 7,5 ≈ 2,2 × 10² W par module, 76 kW en tout ;
- d) S = (0,156)² × 60 × 342 ≈ 5,0 × 10² m² ;
- e) P<sub>lum</sub> = 1000 × 5,0 × 10² ≈ 500 kW ;
- f) η = 76 / 500 ≈ 15 %.
