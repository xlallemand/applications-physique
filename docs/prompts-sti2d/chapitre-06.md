# Chapitre 6 : Principe fondamental de la dynamique (prompt de génération)

Lis d'abord `docs/prompts-sti2d/00-commun.md` (sources, charte, structure, livraison).

## Application

- Dossier `principe-dynamique/`, nom « Chapitre 6 : Principe fondamental de la dynamique », `data-matiere="physique"`, préfixe `pfd`.
- Portail : desc « Bilan des forces, accélération, Σ F⃗ = m a⃗ et principe d'inertie. » ; dessin d'en-tête : `cinematique`.

## Sources (`TSTI2D/06- Principe fondamental de la dynamique/`)

| Fichier | Contenu | À lire |
|---|---|---|
| `Chap06-Cours.pdf` (1 p.) | Cours tapé, avec les formules | Non : résumé ci-dessous |
| `Chap06-Cours complete g2.docx` | Même cours, annoté à la main (notes reprises ci-dessous) | Non |
| `Chap06-Fiche forces.pdf` (2 p.) | **Fiche « Faire un bilan des forces »**, base du module spécial | Oui : **prends le PDF** (2 images de pages, tous les dessins et les vecteurs nommés). Le `.docx` coûte plus de texte et perd les noms des vecteurs. **La fiche n'est pas complétée** : les bilans attendus sont donnés ci-dessous |
| `Chap06-Exercices.pdf` (2 p.) | Ex. 1, 2, 3 (hors manuel) et 5 p. 84, 7 p. 85, 9 p. 85, 10 p. 86, 11 p. 86, 13 p. 86, 14 p. 86, 19 p. 87 | Oui (figures des ex. 7, 9, 10, 11, 19) |
| `Chap06-Correction exercices.pdf` (4 p.) | Corrections tapées et figures | Oui |

## Contenu du cours

### Module 1 : Référentiel et nature du mouvement

- **Référentiel** : solide de référence par rapport auquel on étudie le mouvement du système.
- **Référentiel galiléen** : le principe d'inertie y est vérifié ; il est immobile ou en mouvement rectiligne uniforme.
- **Exemples** : terrestre (le plus souvent), géocentrique (satellites), héliocentrique (planètes).
- **Nature d'un mouvement rectiligne** d'après une chronophotographie : uniforme, accéléré, décéléré (ex. 7).
- **Outil `perso`** : chronophotographie animée, l'élève choisit la nature du mouvement.
- **Série** : référentiel adapté à une situation, nature du mouvement d'après des positions successives.

### Module 2 : Faire un bilan des forces (module spécial, voir plus bas)

**Cours** (notion → exemple → « À toi ») :

- **Méthode du diagramme objet-action** :
  1. d'abord les **forces à distance**. Il n'y en a que trois : **poids** (force gravitationnelle), **force magnétique** (aimants), **force électrique** (charges). La flèche part du **centre** du système ;
  2. puis les **forces de contact** : **chaque objet qui touche le système** exerce une force. La flèche part du **point de contact**.
- **Poids** : P = m × g (P en N, m en kg, g = 9,81 N/kg).
  
  Note manuscrite : « dans certains sujets g n'est pas donné, on peut utiliser g = 10 N/kg ».
- **Réaction du support** : R⃗ = R⃗<sub>N</sub> + f⃗.
  - Note manuscrite : « N = normal = perpendiculaire ».
  - **Sans frottement**, la force du support est perpendiculaire au support.
  - **Avec frottement**, on ajoute f⃗, opposée au mouvement qu'il y aurait si le solide glissait sans frottement.
- **Compensation** : forces qui se compensent (somme nulle) ou non. Exemples de la fiche :
  - palet d'air-hockey : R⃗<sub>N</sub> et P⃗ se compensent toujours ;
  - skieur sans frottement : elles ne se compensent pas, Σ F⃗ = R⃗<sub>N</sub> + P⃗ vers le bas de la pente ;
  - livre que l'on tire : R⃗<sub>N</sub>, P⃗, F⃗<sub>corde</sub>, f⃗ ;
  - skieur avec frottements.

**Série** : situations tirées au hasard. L'élève choisit les objets qui agissent, distance ou contact, point d'application, direction et sens, nom du vecteur. Plus des QCM « ces forces se compensent-elles ? ».

### Module 3 : Accélération

- **Définition** : a = dv/dt (= v′), variation de la vitesse, en **m·s⁻²** (note : « à connaître, important »).
- **Méthodes** :
  - v(t) connue : on dérive (v = 7,25 t donne a = 7,25 m·s⁻²) ;
  - a constante : a = Δv / Δt = (v<sub>fin</sub> − v<sub>début</sub>) / durée. Un résultat négatif veut dire que le système ralentit ; pour une norme, on garde la valeur positive ;
  - Σ F connue : a = Σ F / m (module 4).
- **Conversion** km/h → m/s : ÷ 3,6 (100 km/h = 27,8 m/s). Lien vers `conversions/`.
- **Série** : a = Δv/Δt avec conversions, dérivées simples de v(t), signe de a.

### Module 4 : Principe fondamental de la dynamique

- **Énoncé** : dans un référentiel galiléen, m a⃗ = Σ F⃗<sub>ext</sub> (m en kg, a en m·s⁻², Σ F en N). Notes : « résultante = somme, à connaître » ; « Σ = somme, addition de toutes les forces ».
- **Principe d'inertie** : Σ F⃗<sub>ext</sub> = 0⃗ ⇔ immobile ou mouvement rectiligne uniforme.
- **Utilisation** (tableau à quatre entrées) :
  - Σ F⃗ connue : a⃗ a la même direction et le même sens ; a = Σ F / m ;
  - a⃗ connue : Σ F⃗ a la même direction et le même sens ; Σ F = m × a.
- **Résultante sans souci d'échelle** :
  - forces opposées : soustraction ;
  - forces perpendiculaires : diagonale du rectangle (ex. 9 b).
  
  **Outil vectoriel** : réutilise le repère et le tracé de vecteurs de `cinematique/modules/vecteurs.js` (pointe à glisser + flèches, sur quadrillage) pour tracer Σ F⃗ puis a⃗.
- **Méthode type** (ex. 2, 5) :
  1. bilan des forces ;
  2. les forces qui se compensent (P⃗ + R⃗<sub>N</sub> = 0⃗) ;
  3. Σ F⃗ = ce qui reste ;
  4. projection sur le mouvement (m a = F<sub>m</sub> − f) ;
  5. on isole l'inconnue.
- **Série** : Σ F = m a, a = Σ F/m, f ou F<sub>m</sub> à partir de m a = F<sub>m</sub> − f, direction de a⃗ d'après les forces.

### Module 5 : Exercices

Même ordre et même numérotation que la feuille, voir plus bas.

## Module spécial : « Faire un bilan des forces » (pages `simulation` + cours du module 2)

**But pédagogique.** Que l'élève applique **toujours la même méthode** :
1. forces à distance (3 possibles, depuis le centre) ;
2. un objet qui touche = une force de contact (depuis le point de contact) ;
3. direction et sens ;
4. nom du vecteur ;
5. compensation ou non.

Il doit savoir faire le bilan de n'importe quelle situation de la fiche sans aide.

**Forme.** Un outil `perso` en plusieurs exemplaires, une situation dessinée en SVG (reprends les dessins de la fiche). Pour chaque situation, quatre étapes successives (parties de question) :

1. **Qui agit sur le système ?** Étiquettes à cocher ou glisser parmi des acteurs plausibles : Terre, sol, table, support, fil, ressort, air, eau, huile, aimant, bâton frotté, pied, main, corde, route… avec des distracteurs comme la main qui a lâché la balle.
2. **À distance ou de contact ?** Classement des forces retenues.
3. **Tracé** : pour chaque force, choisir le point de départ (centre ou point de contact, points cliquables) puis la direction et le sens.
   - Choix parmi 8 directions, plus « perpendiculaire au support » et « le long du fil » pour les plans inclinés et les pendules.
   - Gros boutons fléchés au doigt, pointe glissable à la souris ; sans souci d'échelle.
4. **Nom du vecteur** : P⃗, R⃗<sub>N</sub>, f⃗, T⃗, F⃗<sub>A</sub>, F⃗<sub>m</sub>, F⃗<sub>mag</sub>, F⃗<sub>élec</sub>, F⃗<sub>pied</sub>…, puis « se compensent-elles ? ».

Diagnostic ciblé à chaque erreur. Exemples :
- « la main ne touche plus la balle : elle n'exerce plus de force » ;
- « une force de contact part du point de contact » ;
- « sans frottement, la réaction est perpendiculaire au support » ;
- « les frottements s'opposent au glissement ».

**Cheminement**, du plus simple au plus difficile :
1. exemple traité : le ballon (avant, pendant, après la frappe) ;
2. brique sur une planche horizontale ;
3. masse suspendue au ressort ;
4. pendule ;
5. balle lancée ;
6. bouchon qui flotte ;
7. goutte qui tombe dans l'huile ;
8. brique immobile sur la planche inclinée ;
9. brique qui glisse ;
10. aimant posé près d'un autre aimant ;
11. boule d'aluminium et bâton d'ébonite ;
12. clou attiré par un aimant ;
13. voiture au démarrage.
14. , 15., 16. : ajouter 3 autres situations

**Bilans attendus** (la fiche est vierge : ce sont les réponses à coder) :

| Situation | Forces |
|---|---|
| Ballon avant la frappe (posé) | P⃗ (centre, vers le bas) ; R⃗<sub>N</sub> du sol (contact, vers le haut) ; elles se compensent |
| Ballon pendant la frappe | P⃗ ; R⃗<sub>N</sub> du sol ; F⃗ du pied (contact pied-ballon, vers l'avant) |
| Ballon après la frappe | P⃗ seul (frottements de l'air négligés) |
| Balle lancée (la main ne la touche plus) | P⃗ seul |
| Aimant de gauche posé sur la table | P⃗ ; F⃗<sub>mag</sub> de l'autre aimant (à distance, horizontale, vers lui si attraction) ; R⃗<sub>N</sub> de la table ; f⃗ de la table opposée à F⃗<sub>mag</sub> s'il reste immobile |
| Masse au bout du ressort | P⃗ ; T⃗ du ressort (point d'accroche, vers le haut) ; elles se compensent |
| Bouchon qui flotte | P⃗ ; poussée F⃗<sub>A</sub> de l'eau (vers le haut) ; elles se compensent |
| Pendule | P⃗ ; T⃗ du fil (vers le point d'attache) |
| Boule d'aluminium et bâton frotté | P⃗ ; T⃗ du fil ; F⃗<sub>élec</sub> (à distance, vers le bâton) |
| Goutte dans l'huile | P⃗ ; F⃗<sub>A</sub> de l'huile (haut) ; f⃗ frottement de l'huile (haut, opposé à la chute). Accepte aussi une seule force de l'huile, mais propose la séparation comme dans l'ex. 19 |
| Brique, planche horizontale | P⃗ ; R⃗<sub>N</sub> ; elles se compensent |
| Brique immobile, planche inclinée | P⃗ ; R⃗<sub>N</sub> (perpendiculaire) ; f⃗ (le long de la pente, vers le haut) ; R⃗ = R⃗<sub>N</sub> + f⃗ compense P⃗ |
| Brique qui glisse | P⃗ ; R⃗<sub>N</sub> ; f⃗ vers le haut de la pente ; elles ne se compensent pas |
| Clou attiré par l'aimant | P⃗ ; F⃗<sub>mag</sub> (à distance, du centre vers l'aimant) ; R⃗ du sol (au point de contact) |
| Voiture au démarrage (traction avant) | P⃗ ; R⃗ de la route sur les roues avant = R⃗<sub>N</sub> + force motrice vers l'avant (frottement de la route sur les roues motrices) ; R⃗<sub>N</sub> sur les roues arrière + frottements de la route vers l'arrière ; frottements de l'air vers l'arrière |

## Exercices (même numérotation que la feuille)

**Ex. 1** (hors manuel) : a = 27,8 / 2,5 = 11,1 m·s⁻², Σ F = 600 × 11,1 = 6,66 × 10³ N.

**Ex. 2** :
- schéma P⃗, R⃗<sub>N</sub>, f⃗ ;
- a = 10 / 4,0 = 2,5 m·s⁻² (la remarque sur le signe négatif est à garder) ;
- Σ F = 0,046 × 2,5 = 0,115 N = f, car P⃗ + R⃗<sub>N</sub> = 0⃗.

**Ex. 3** :
- a = v′ = 7,25 m·s⁻² ;
- Σ F = 10,0 × 10³ × 7,25 = 7,25 × 10⁴ N.

L'énoncé dit « sur la voiture » : écris « sur l'avion ».

**Ex. 7 p. 85** : 1er cas uniforme, 2e accéléré, 3e décéléré.

**Ex. 9 p. 85** :
- a) a⃗ du côté de la plus grande force (cas 1 vers la gauche, cas 2 a⃗ = 0⃗, cas 3 vers la droite) ;
- b) cas 1 : F⃗<sub>1</sub> + F⃗<sub>3</sub> = 2 N vers le bas, plus F⃗<sub>2</sub> = 3 N à droite, donc a⃗ en diagonale vers le bas et à droite ; cas 2 : verticales compensées, résultante 2 N vers la gauche.

Tracé avec l'outil vectoriel.

**Ex. 10 p. 86** :
- balle qui tombe : Σ F⃗ vers le bas ;
- voiture qui freine : Σ F⃗ dans le sens de a⃗ (vers l'arrière de la voiture, comme a⃗ sur la figure).

**Ex. 11 p. 86** :
- Σ F⃗ dans le sens de a⃗ ;
- forces : poids, réaction, traction ;
- P⃗ et R⃗ se compensent, donc F⃗ a la direction et le sens de a⃗.

**Ex. 5 p. 84** (corrigé du manuel) :
- P = 850 × 9,81 = 8,34 × 10³ N ;
- Σ F⃗ = f⃗ + F⃗<sub>m</sub> ;
- m a = F<sub>m</sub> − f.

**Le corrigé du manuel calcule avec 580 kg : F<sub>m</sub> = 850 × 2,5 + 250 = 2375 N ≈ 2,4 × 10³ N** (corrigé à la main).

**Ex. 13 p. 86** : F<sub>pr</sub> = 740 × 11,5 = 8,51 × 10³ N ; F<sub>pou</sub> = 10 × 10³ × 6,0 = 6,0 × 10⁴ N.

**Ex. 14 p. 86** : P⃗ = m a⃗, donc a⃗ = g⃗ pour les deux objets : ils arrivent en même temps.

**Ex. 19 p. 87** :
1. Σ F⃗ = m a⃗ ;
2. P = 3,92 N, V = 5,2 × 10⁻⁴ m³, F<sub>A</sub> = 6,3 × 10⁻³ N, P / F<sub>A</sub> ≈ 620 ;
3. v constante, donc a = 0 ;
4. f = P = 3,92 N.

La correction titre « p. 86 » : c'est la p. 87.
