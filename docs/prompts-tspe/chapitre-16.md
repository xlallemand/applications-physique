# Transformations nucléaires (prompt de génération)

Lis d'abord `docs/prompts-tspe/00-commun.md` (sources, charte, structure, outils partagés, livraison).

## Application

- Dossier `transformations-nucleaires/`, nom « Transformations nucléaires », `data-matiere="physique"`, préfixe `tn`, espace de noms `TN`.
- Portail : `desc: "Diagramme (N, Z), désintégrations α, β⁻, β⁺, γ, loi de décroissance, demi-vie, datation, radioprotection."` ; `mots` : noyau, nucléon, proton, neutron, isotope, Segré, vallée de stabilité, radioactivité, alpha, bêta, positon, gamma, conservation, équation différentielle, N0 e^(−λt), constante radioactive, activité, becquerel, demi-vie, carbone 14, datation, scintigraphie, radiothérapie, irradiation, contamination, sievert, ALARA…
- Dessin d'en-tête : `noyaux` (existe, utilisé par `radioactivite/`).
- **Prérequis** : `outils-communs.md` (outil `EQ`, pages externes ↗) et `decroissance-radioactive.md` (simulateur mis à jour). Outils : `EQ`, `LG`, `BULLE`, `PLEIN`.

## Sources (`16- Transformations nucléaires/`)

| Fichier | Contenu | À lire |
|---|---|---|
| `Chap16-Cours_Nucleaire_complete.pdf` (6 p.) | Cours tapé, complété à la main | Non : résumé ci-dessous. Pages 2, 3 (diagramme (N, Z), exemples complétés) et 4 (justification de la solution de l'équation différentielle) pour les figures et les solutions |
| `Chap16-Exercices.pdf` (2 p.) | Exercices (en images) | Oui |
| `Chap16-Exercices_correction.pdf` (5 p.) | Corrections | Oui |

Le TP (« dés radioactifs ») n'est pas repris comme TP, mais son analogie des dés est dans le simulateur (`decroissance-radioactive.md`).

## Consignes du professeur

- **Le cours de Terminale STI2D `radioactivite/` peut être exploité, en le mettant à niveau** (Terminale spécialité : diagramme (N, Z), équation différentielle, ln, datation, radioprotection). Lis son `PLAN` et ses cours (`radioactivite/modules/`), et le prompt qui l'a produit (`docs/prompts-sti2d/chapitre-12.md`) : reprends ce qui sert (outil d'équation de désintégration à trous, lecture de la demi-vie sur une courbe, séries) en l'adaptant.
- **Équations à manipuler avec les outils de `equations-physique-mobile`** (outil commun `EQ` : exponentielle, ln).
- **Simulateur de désintégration radioactive** : l'application `decroissance-radioactive/` mise à jour (`decroissance-radioactive.md`), intégrée par une **page externe ↗** (obligatoire).

## Contenu du cours (résumé)

### I. Stabilité des noyaux

- Noyau : nucléons (protons, neutrons) ; symbole <sup>A</sup><sub>Z</sub>X (Z protons, fixe l'élément ; A nucléons) ; <sup>56</sup><sub>26</sub>Fe, <sup>238</sup><sub>92</sub>U. **Isotopes** : même Z, A différents.
- **Diagramme de Segré (N, Z)** (▶ vidéo facultative : https://youtu.be/VZHpAwSGYZE) : forces électrostatiques répulsives entre protons ; ≈ 3000 noyaux connus, ≈ 325 naturels dont 274 stables (interaction forte, **vallée de la stabilité**, en noir) et 51 instables (hors de la vallée : radioactifs).
- **Radioactivité** : réaction nucléaire spontanée ; noyau père → noyau fils + particule. Types : **α** (<sup>4</sup><sub>2</sub>He ; <sup>235</sup><sub>92</sub>U → <sup>4</sup><sub>2</sub>He + <sup>231</sup><sub>90</sub>Th), **β<sup>−</sup>** (électron <sup>0</sup><sub>−1</sub>e ; <sup>14</sup><sub>6</sub>C → <sup>0</sup><sub>−1</sub>e + <sup>14</sup><sub>7</sub>N), **β<sup>+</sup>** (positon <sup>0</sup><sub>1</sub>e, antiparticule de l'électron ; <sup>15</sup><sub>8</sub>O → <sup>0</sup><sub>1</sub>e + <sup>15</sup><sub>7</sub>N).
- **Rayonnement γ** : le noyau fils excité Y* se désexcite (Y* → Y + γ) ; très pénétrant et énergétique (une vingtaine de cm de plomb).
- **Équilibrer** : conservation de la charge (somme des Z) et du nombre de nucléons (somme des A) ; particules à connaître : neutron <sup>1</sup><sub>0</sub>n, proton <sup>1</sup><sub>1</sub>H, électron, positon, noyau d'hélium.
- Exemples à compléter (avec la classification) : fissions de l'uranium 235 (Kr, Ba, Xe, Sr…), du plutonium 239 (Te…), <sup>15</sup>O, <sup>238</sup>U → <sup>234</sup>Th, <sup>239</sup>U β<sup>−</sup>, <sup>14</sup>C ; désintégrations de <sup>217</sup>Ra et <sup>174</sup>Hf (α), <sup>103</sup>Mo et <sup>209</sup>Pb (β<sup>−</sup>), <sup>174</sup>Ta (β<sup>+</sup>).

### II. La radioactivité et le temps

- Désintégration **spontanée** et **aléatoire** ; un noyau **ne vieillit pas** (probabilité constante).
- **Constante radioactive λ** : probabilité de désintégration d'un noyau par unité de temps (s<sup>−1</sup>). **Activité A** : nombre moyen de désintégrations par seconde (Bq).
- **Loi de décroissance** : A = −ΔN/Δt → **A = −dN/dt** ; et **A = λN** ; donc **dN/dt + λN = 0** ; solution **N(t) = N<sub>0</sub>e<sup>−λt</sup>** (justification : on vérifie qu'elle est solution, page 4).
- **Demi-vie** t<sub>1/2</sub> : durée au bout de laquelle la moitié des noyaux s'est désintégrée ; N<sub>0</sub>/2 = N<sub>0</sub>e<sup>−λt<sub>1/2</sub></sup> ⟺ ln(1/2) = −λt<sub>1/2</sub> ⟺ **t<sub>1/2</sub> = ln 2 / λ** ; après n demi-vies il reste N<sub>0</sub>/2<sup>n</sup>.

### III. Applications

- **Datation au carbone 14** : <sup>14</sup>C/<sup>12</sup>C = 10<sup>−12</sup> dans un organisme vivant (renouvelé) ; après la mort, décroissance vers <sup>14</sup>N ; on compare N(t) ou A(t) à N<sub>0</sub> ou A<sub>0</sub> d'une référence ; fiable jusqu'à ≈ 50 000 ans ; au-delà, potassium/argon, rubidium/strontium. **t = −(1/λ) ln(A(t)/A<sub>0</sub>) = (t<sub>1/2</sub>/ln 2) ln(A<sub>0</sub>/A(t))** (avec `EQ`).
- **Médecine** : scintigraphie (iode 131, thyroïde), radiothérapie (iridium 192, iode 125). Histoire : Pierre et Marie Curie, polonium, « Petites Curies », « après les rayons qui dévoilent, les rayons qui soignent ».
- **Protection** : rayonnements ionisants ; origines naturelle et artificielle ; **irradiation** (exposition externe) et **contamination** (interne : inhalation, ingestion) ; pénétration des rayonnements (α, β, γ) ; dose efficace en **sievert** ; **ALARA** : s'éloigner, écrans, limiter la durée.

## Plan de l'application (`PLAN`)

### Module 1 : Noyaux et stabilité

Cours : constitution, isotopes, diagramme (N, Z). **Atelier : diagramme de Segré** (page `simulation`, un écran) : diagramme (N, Z) interactif (vallée de stabilité, noyaux colorés par type de radioactivité, données simplifiées des noyaux usuels) ; toucher un noyau : composition, stable ou non, type de désintégration ; une désintégration fait **se déplacer** le noyau dans le diagramme (α : Z − 2, N − 2 ; β<sup>−</sup> : Z + 1, N − 1 ; β<sup>+</sup> : Z − 1, N + 1) ; défis : trouver les isotopes radioactifs d'un élément ; suivre une famille radioactive jusqu'à un noyau stable (chaîne de l'uranium 238 vers le plomb 206, simplifiée). Série : composition, isotopes, lecture du diagramme.

### Module 2 : Désintégrations et équations

Cours : types α, β<sup>−</sup>, β<sup>+</sup>, γ ; lois de conservation ; particules à connaître. **Reprends l'outil d'équation à trous de `radioactivite/`** (A, Z, symbole d'après Z dans un extrait de classification) en l'étendant aux réactions provoquées (fission avec neutrons, fusion). Série : type d'une désintégration, noyau fils, particule, équations des exemples du cours (valeurs aléatoires).

### Module 3 : Loi de décroissance radioactive

- **Page externe ↗** (type 2, obligatoire) en tête du module : `decroissance-radioactive/` (« Simulateur : désintégration radioactive »).
- Sous-modules de cours : aléatoire et spontané, λ, activité ; équation différentielle (A = −dN/dt = λN, dN/dt + λN = 0) et **vérification de la solution** (dériver N<sub>0</sub>e<sup>−λt</sup>, comme pour le circuit RC) ; demi-vie (t<sub>1/2</sub> = ln 2 / λ démontrée dans **`EQ`** : démonstration puis « À toi ») ; lecture graphique de t<sub>1/2</sub> (outil de `radioactivite/`, `LG`) ; N<sub>0</sub>/2<sup>n</sup>.
- Série : N(t), A(t), λ ↔ t<sub>1/2</sub>, lecture de t<sub>1/2</sub>, nombre de demi-vies, équation différentielle à reconnaître (forme y′ + ay = 0), vérifier une solution.

### Module 4 : Dater, soigner, se protéger

Cours (sous-modules) : datation (carbone 14 ; t avec ln, dans `EQ` : de A = A<sub>0</sub>e<sup>−λt</sup> à t = …, deux expressions ; autres méthodes) ; applications médicales ; radioprotection (ALARA, irradiation / contamination, pénétration). Série : dater un échantillon (calcul et lecture graphique), choisir une méthode de datation selon l'âge, radioprotection (QCM), contexte de bac (rubidium-strontium, plomb 210, `competences.md`).

### Module 5 : Exercices

Exercices de la feuille, avec sa numérotation.

## Vérifications propres

- Script : chaque équation (conservation de A et Z), chaque valeur des exercices ; ln 2 = 0,693.
- `EQ` : isoler t dans N = N<sub>0</sub>e<sup>−λt</sup> et A = A<sub>0</sub>e<sup>−λt</sup> (outils ln / e<sup>x</sup>).
- Page ↗ : l'état de `decroissance-radioactive` remonte dans le sommaire après l'avoir ouverte.
