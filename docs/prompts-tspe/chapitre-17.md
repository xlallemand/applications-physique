# Thermodynamique (prompt de génération)

Lis d'abord `docs/prompts-tspe/00-commun.md` (sources, charte, structure, outils partagés, livraison).

## Application

- Dossier `thermodynamique/`, nom « Thermodynamique », `data-matiere="physique"`, préfixe `th`, espace de noms `TH`.
- Portail : `desc: "Gaz parfait, énergie interne, premier principe, résistance thermique, température de la Terre, loi de Newton."` ; `mots` : gaz parfait, PV = nRT, énergie interne, ΔU = mcΔT, capacité thermique, premier principe, ΔU = W + Q, transfert thermique, conduction, convection, rayonnement, flux thermique, résistance thermique, conductivité thermique, Stefan-Boltzmann, albédo, effet de serre, corps noir, loi de Newton, refroidissement, thermostat, τ = mc/(hS), calorimétrie…
- Dessin d'en-tête : celui de `transferts-thermiques/`.
- **Prérequis** : `outils-communs.md` (`EQ`, pages ↗) et `gaz-parfait.md` (simulateur). Outils : `EQ`, `LG`, `BULLE`, `PLEIN`.

## Sources (`17- Thermodynamique/`)

| Fichier | Contenu | À lire |
|---|---|---|
| `Chap17-Cours_Thermodynamique_complete.pdf` (12 p.) | Cours tapé, complété à la main | Non : résumé ci-dessous. Pages 8 et 9 (bilan radiatif, calcul de la température de la Terre, figure du disque), 10 (bilan radiatif avec effet de serre) pour les figures et la solution manuscrite |
| `Chap17-Exercices.pdf` (6 p.) | Ex. 1 à 14 (ex. 5 : montgolfière ; ex. 14 : bac 2021 Liban) | Oui |
| `Chap17-Exercices_correction.pdf` (12 p.) | Corrections manuscrites | Oui |

Les TP (calorimétrie, loi de Newton ; capacité thermique d'un matériau) ne sont pas repris.

## Consignes du professeur

- **Simulateur PV = nRT** : une **autre application** (`gaz-parfait/`, prompt `gaz-parfait.md`), avec un **lien depuis le cours** : page externe ↗ obligatoire.
- **Des parties du cours peuvent s'inspirer de l'application `transferts-thermiques/`** (STI2D : modes de transfert, flux, résistance thermique, parois composées) **en les mettant à niveau**.
- **Équations à manipuler avec les outils de `equations-physique-mobile`** (outil commun `EQ`).

## Contenu du cours (résumé)

### I. Modèle du gaz parfait

Voir `gaz-parfait.md` (« Ce que dit le cours ») : échelles macroscopique et microscopique (tableau P / chocs, T / agitation, ρ / masse et densité de particules), T = θ + 273,15, gaz parfait, **PV = nRT**, limites, Avogadro-Ampère (V<sub>m</sub> à 20 °C et 1 bar), masse volumique ρ = PM/(RT) (à savoir refaire ; air), montgolfière (ex. 5). ▶ Vidéo facultative : https://www.youtube.com/watch?v=_oLPBnhOCjM (agitation des molécules).

### II. Énergie interne et transferts

- **Énergie interne U** (J) : somme des énergies microscopiques (agitation thermique), liée à la température ; pour un système **incompressible** : **ΔU = m c ΔT = m c (T<sub>f</sub> − T<sub>i</sub>)** (c en J·K<sup>−1</sup>·kg<sup>−1</sup>) ; ou avec la capacité thermique totale **ΔU = C ΔT** (J·K<sup>−1</sup>) ; ΔT a la même valeur en K et en °C. Exemples : pièce de 20 centimes (5,70 g, 20 → 100 °C, c = 372 J·K<sup>−1</sup>·kg<sup>−1</sup> : ΔU ≈ 170 J) ; bol de soupe (50 → 42 °C, C = 1,05 × 10³ J·K<sup>−1</sup> : ΔU = −8,4 × 10³ J).
- **Transfert thermique** : spontanément du corps chaud vers le corps froid, irréversible ; trois modes : **conduction** (contact, sans transport de matière), **convection** (mouvement du fluide), **rayonnement** (onde électromagnétique) ; exemple du feu.
- **Premier principe** : énergie totale = U + E<sub>m</sub> ; échanges W (travail) et Q (thermique) ; **ΔU = W + Q** (reçu > 0, perdu < 0) ; avec variation d'énergie mécanique : ΔU + ΔE<sub>m</sub> = W + Q. Exemples : **glaçon** (5 g à −10 °C reçoit Q = 50 J, c<sub>glace</sub> = 2,1 kJ·kg<sup>−1</sup>·K<sup>−1</sup> : ΔT ≈ 4,8 K, θ<sub>f</sub> ≈ −5,2 °C) ; **réfrigérateur** (fluide : W > 0 reçu du moteur, Q<sub>f</sub> > 0 pris à l'intérieur, Q<sub>c</sub> < 0 donné à l'extérieur ; sur un cycle ΔU = 0).
- **Flux thermique** Φ = Q/Δt (W).

### III. Résistance thermique d'une paroi

**Φ = (T<sub>c</sub> − T<sub>f</sub>)/R<sub>th</sub>** (W, K, K·W<sup>−1</sup>) ; T<sub>c</sub> − T<sub>f</sub> = θ<sub>c</sub> − θ<sub>f</sub> ; **R<sub>th</sub> = e/(λS)** (fournie) ; un isolant performant : λ faible, e grand.

### IV. Température terrestre moyenne (« exercice à savoir refaire »)

- **Corps noir** (absorbe toute l'énergie reçue) ; **Stefan-Boltzmann P = σT⁴** (puissance surfacique, σ = 5,67 × 10<sup>−8</sup> W·m<sup>−2</sup>·K<sup>−4</sup> ; pas à connaître, à savoir utiliser).
- **Albédo** α = P<sub>r</sub>/P<sub>i</sub> (mer 0,05–0,15 ; forêt 0,05–0,20 ; sable 0,25–0,45 ; neige 0,8 ; Terre 0,30).
- **Bilan** : la Terre est à l'équilibre thermique : toute l'énergie absorbée est réémise. Calcul (données p<sub>s</sub> = 1,36 × 10³ W·m<sup>−2</sup>, disque πR<sub>T</sub>², sphère 4πR<sub>T</sub>²) : P<sub>T</sub> = p<sub>s</sub>πR<sub>T</sub>² ; p<sub>T</sub> = p<sub>s</sub>/4 = 340 W·m<sup>−2</sup> ; p<sub>abs</sub> = (1 − α)p<sub>T</sub> = 238 W·m<sup>−2</sup> ; σT⁴ = p<sub>abs</sub> ⟹ T ≈ 255 K ≈ −18 °C ; la température réelle (15 °C) s'explique par l'**effet de serre** ; sans albédo : T ≈ 278 K ≈ 5 °C.
- **Effet de serre** : gaz de l'atmosphère (vapeur d'eau, CO<sub>2</sub>) qui absorbent une partie de l'infrarouge émis par le sol ; plus d'effet de serre ou moins d'albédo → température plus élevée.

### V. Loi phénoménologique de Newton

- Hypothèses : système incompressible à T, échanges avec un thermostat (fluide à T<sub>th</sub> constante), convection seule.
- **Φ = hS(T<sub>th</sub> − T)** (h coefficient d'échange convectif en W·m<sup>−2</sup>·K<sup>−1</sup>, S surface d'échange) ; loi phénoménologique (établie par l'expérience).
- **Équation différentielle** : premier principe sur Δt très petit, m c ΔT = Φ Δt = hS(T<sub>th</sub> − T)Δt ⟹ dT/dt = (hS/mc)(T<sub>th</sub> − T), soit **dT/dt + (T − T<sub>th</sub>)/τ = 0** avec **τ = mc/(hS)**, ou dT/dt + T/τ = T<sub>th</sub>/τ.
- **Solution** (forme y′ + ay = b → y = A e<sup>−at</sup> + b/a, juste ici) : **T = (T<sub>0</sub> − T<sub>th</sub>) e<sup>−t/τ</sup> + T<sub>th</sub>** ; courbes de réchauffement et de refroidissement (asymptote T<sub>th</sub>, τ) ; valable en °C (écarts).
- **Durée pour atteindre une température** (ln, réciproque de e<sup>x</sup>) : T<sub>0</sub> = 55 °C, T<sub>th</sub> = 20 °C, τ = 3,0 min, atteindre 30 °C : t = τ ln((T<sub>0</sub> − T<sub>th</sub>)/(T − T<sub>th</sub>)) = 3,0 ln 3,5 ≈ 3,8 min (avec `EQ`).

## Plan de l'application (`PLAN`)

### Module 1 : Le gaz parfait

- **Page externe ↗** (type 2, obligatoire), en tête : `gaz-parfait/` (« Simulateur : gaz parfait »).
- Cours : échelles, modèle, PV = nRT (avec `EQ` : isoler P, V, n ou T), conversions (bar, L, °C), limites, volume molaire, masse volumique d'un gaz (démonstration à savoir refaire).
- Série : calculs avec PV = nRT (conversions : diagnostics « T en °C », « V en L »), interprétation microscopique, V<sub>m</sub>, ρ de l'air, montgolfière.

### Module 2 : Énergie interne et premier principe

- Cours (sous-modules ; **reprends et mets à niveau** le module 1 « Température et modes de transfert » et le module 2 « Flux thermique » de `transferts-thermiques/`) : énergie interne et ΔU = mcΔT ; sens du transfert et modes ; premier principe ΔU = W + Q (signes, schéma du système et de l'extérieur avec les flèches W et Q, comme le professeur pour le glaçon et le réfrigérateur) ; flux.
- **Atelier : bilan d'énergie** (page `simulation`, un écran) : un système (glaçon, réfrigérateur, bouilloire, pièce métallique, gaz dans un piston) ; l'élève place les **flèches W et Q** (entrantes / sortantes) sur le schéma, donne leur signe, écrit le bilan ; diagnostics sur les signes. Défis dans n'importe quel ordre.
- Série : ΔU (m c ΔT ou C ΔT), sens du transfert, mode de transfert, signes de W et Q, Φ = Q/Δt.

### Module 3 : Résistance thermique

Cours : **reprends et mets à niveau** les modules 3 et 4 de `transferts-thermiques/` (Φ = ΔT/R<sub>th</sub>, R<sub>th</sub> = e/(λS), parois composées si utile). Série : Φ, R<sub>th</sub>, comparer des isolants. Lien facultatif : `transferts-thermiques/` (parois composées, double vitrage).

### Module 4 : Température de la Terre

- Cours : corps noir, Stefan-Boltzmann, albédo, bilan, effet de serre ; **l'exercice à savoir refaire** en « À toi » par étapes (questions 1 à 6 du cours).
- **Simulateur : bilan radiatif de la Terre** (page `simulation`, un écran) : flux solaire, albédo réglable (surfaces : océans, forêts, glaces), effet de serre (fraction de l'infrarouge renvoyée vers le sol, modèle simple à une couche, signalé « modèle »), température d'équilibre calculée en continu (σT⁴ = puissance absorbée) ; défis : retrouver −18 °C sans effet de serre ; atteindre 15 °C ; fonte des glaces (albédo ↘ → T ↗) ; sans albédo.
- Série : puissances, T⁴ et racine quatrième (icône calculatrice), influence de l'albédo et de l'effet de serre.

### Module 5 : Loi de Newton (refroidissement)

- Cours : hypothèses, loi, **équation différentielle établie pas à pas** (premier principe sur Δt), solution, courbes, τ graphique (tangente à l'origine, 63 %, comme le circuit RC : même outil `LG`), durée pour atteindre une température (**`EQ`** : isoler t avec ln).
- **Simulateur : refroidissement d'une tasse** (dans le cours en « À toi », ou page `simulation`) : T<sub>0</sub>, T<sub>th</sub>, m, c, h, S réglables ; courbe T(t), τ = mc/(hS) ; lecture de τ par la tangente ; défis : refroidir plus vite (h, S), réchauffement.
- Série : τ, T(t), durée (ln), lecture graphique de τ, vérifier qu'une expression est solution.

### Module 6 : Exercices

Ex. 1 à 14 de la feuille ; ex. 14 « bac 2021 Liban » : guidé par parties.

## Vérifications propres

- Script : tous les exemples du résumé (170 J ; −8,4 × 10³ J ; −5,2 °C ; 255 K ; 278 K ; 3,8 min ; 24,4 L·mol<sup>−1</sup>) et chaque exercice.
- Page ↗ : l'état de `gaz-parfait` remonte dans le sommaire.
- `transferts-thermiques/` n'est pas modifiée (on s'en inspire, on ne la change pas).
