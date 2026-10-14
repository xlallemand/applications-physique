# Chapitre 18 : Ondes sonores (prompt de génération)

Lis d'abord `docs/prompts-sti2d/00-commun.md` (sources, charte, structure, livraison), puis la section « Module spécial » de `docs/prompts-sti2d/chapitre-17.md` : le simulateur de ce chapitre en est une variante.

## Application

- Dossier `ondes-sonores/`, nom « Chapitre 18 : Ondes sonores », `data-matiere="physique"`, préfixe `os`.
- Portail : desc « Son pur, son complexe, hauteur et timbre, niveau sonore en décibels, audiogramme, atténuation. »
- Dessin d'en-tête : `spectre` (créé au chapitre 17 ; s'il n'existe pas, crée-le comme décrit là-bas).

## Sources (`TSTI2D/18- Ondes sonores/`)

| Fichier | Contenu | À lire |
|---|---|---|
| `Chap18-Cours_complete.pdf` (2 p.) | Cours complété à la main | Non : résumé ci-dessous. Page 2 pour refaire l'audiogramme annoté (fréquences en échelle logarithmique) |
| `Chap18-Exercices.pdf` (2 p.) | Ex. 6 p. 230, 8 p. 231, 10, 11 p. 232, 17 p. 233, « Exercice » (audiogramme, bouchons d'oreilles), 16 p. 233 | Oui (graphiques à refaire en SVG) |
| `Chap18-Correction exercices.pdf` (2 p.) | Corrections tapées. **L'ex. 6 n'y est pas** : rédige sa correction (valeurs ci-dessous) | Oui |
| `../17- Spectre signal periodique/Sujet bac son polynesie 2022.pdf` (4 p.) | Sujet « Étude du son d'un violon » (chapitres 17 et 18), correction page 4 | Oui : c'est l'exercice de bac de ce chapitre |
| `Chap18-Exercice bac.pdf` (3 p.) | Autre correction du sujet « violon » | Non (doublon) |
| `Chap10-Cours-Exercices complete.docx` | Ancienne version du cours et des exercices | Non |

## Contenu du cours

### Module 1 : L'onde sonore

- **Onde** : transfert d'énergie sans transport de matière.
- **Onde mécanique** : elle a besoin d'un support matériel, elle ne se propage pas dans le vide.
- **Onde sonore dans l'air** : propagation d'une variation de pression (compressions et dilatations).
  
  **Outil `perso`** : rangée de points d'air qui oscillent autour de leur position, avec les zones de compression et de dilatation qui avancent du haut-parleur vers l'oreille. Animation coupée si `prefers-reduced-motion`, avec un bouton pas à pas.
- **Vitesse du son dans l'air** : 340 m·s⁻¹. λ = v / f (rappel du chapitre 10, la<sub>3</sub> à 440 Hz donne λ ≈ 0,773 m).
- **Série** : vrai ou faux sur la propagation (vide, matière, énergie), λ ou f d'un son.

### Module 2 : Son pur, son complexe (simulateur musical, puis cours)

- **Son pur** : signal **sinusoïdal** de fréquence f<sub>1</sub> ; spectre à **un seul pic**.
- **Son complexe** : signal périodique **non sinusoïdal** ; spectre avec **plusieurs pics** (fondamental f<sub>1</sub> + harmoniques f<sub>n</sub> = n × f<sub>1</sub>).
- **Mesurer f** : sur le signal (T, puis f = 1/T) ou directement sur le spectre (f<sub>1</sub>).
- **Vocabulaire** :
  - **hauteur** = fréquence (du fondamental) = note ; hauteur élevée = son aigu ;
  - **timbre** = richesse du son en harmoniques = forme du signal.
  
  **Deux instruments différents qui jouent la même note ont la même hauteur mais pas le même timbre.**
- **Notes** (données de l'ex. 8) : La<sub>4</sub> 880 Hz, Si<sub>4</sub> 988 Hz, Do<sub>5</sub> 1046 Hz, Ré<sub>5</sub> 1174 Hz ; la<sub>3</sub> du diapason 440 Hz.
- **Série** : pur ou complexe d'après un signal ou un spectre, hauteur, note jouée, même hauteur / même timbre entre deux spectres, fréquences des harmoniques.

### Module 3 : Intensité et niveau sonores

- **Intensité sonore** I : puissance par unité de surface, en W·m⁻². Elle diminue quand on s'éloigne de la source (surfaces A, 4A, 9A à r, 2r, 3r : figure à refaire).
- **Niveau sonore** : L = 10 log(I / I<sub>0</sub>) en dB, I<sub>0</sub> = 10⁻¹² W·m⁻² (seuil d'audibilité) ; réciproque I = I<sub>0</sub> × 10<sup>L/10</sup>. Ces deux formules sont **toujours données** : il faut savoir les exploiter.
- **Audible ou non** : I > I<sub>0</sub> ⇔ L > 0 dB, on entend.
- **Additions** : **les intensités s'additionnent, pas les niveaux** ; quand l'intensité double, le niveau augmente de 3 dB.
- **Méthode pour deux sources** : I de chaque source, somme des I, puis L total. Elle se fait en trois parties de question.
- **Série** : L à partir de I, I à partir de L (calculatrice : log et 10<sup>x</sup>), deux sources identiques (+3 dB), deux sources différentes.
  
  Erreurs à diagnostiquer : niveaux additionnés, I<sub>0</sub> oublié, log et ln confondus.

### Module 4 : Audiogramme et atténuation

- **Courbe de sensibilité de l'oreille** (audiogramme) :
  - seuil d'audibilité, seuil de la douleur, zones « conversation » et « musique » ;
  - **axe des fréquences en échelle logarithmique**, pas une échelle régulière (note manuscrite : graduations 200, 400, 500, 2000, 4000 placées) ;
  - sous le seuil c'est inaudible, au-dessus audible. Exemples : 100 Hz et 20 dB, inaudible ; 4000 Hz et 20 dB, audible.
- **Outil `perso`** : audiogramme. L'élève place un point (f, L) par glisser-déposer ; il répond « audible / inaudible », puis lit des graduations logarithmiques.
- **Atténuation par une paroi** : vocabulaire **incidente, réfléchie, transmise, absorbée** (onde, intensité ou énergie), figure de la paroi à compléter par glisser-déposer.
  
  Atténuation A = L<sub>incidente</sub> − L<sub>transmise</sub> (dB).
- **Série** : audible ou non, lecture d'une perte auditive, atténuation, choix d'un matériau selon la fréquence.

### Module 5 : Exercices

Voir plus bas.

## Module spécial : simulateur musical (page `simulation` en tête du module 2)

**Même moteur que le chapitre 17** : `assets/fourier.js` (`FOURIER.monter(zone, options)`). S'il n'existe pas encore, crée-le d'abord exactement comme décrit dans `chapitre-17.md` :
- spectre sous le signal ;
- pas de déphasage ;
- composante continue (fixée à 0 ici et masquée : un son n'en a pas).

L'habillage et le vocabulaire sont **musicaux** :

- **Le son s'entend** : bouton « ▶ Écouter » (Web Audio API, `createPeriodicWave` avec les amplitudes a<sub>n</sub>, sinus de phase nulle).
  - Volume réglable et limité, son de 1,5 s avec fondu d'entrée et de sortie, démarré seulement par un geste de l'élève ;
  - fonctionne en `file://` ;
  - si l'audio est indisponible, le reste marche et un message le dit.
- **Choix de la note** au lieu d'une fréquence libre : petit clavier (do<sub>3</sub> à do<sub>5</sub>, avec la<sub>3</sub> = 440 Hz et les notes de l'ex. 8). La note jouée et sa fréquence sont affichées. Un mode « fréquence libre » reste disponible.
- **Instruments** (spectres simplifiés, à présenter comme tels) :

  | Instrument | Spectre |
  |---|---|
  | **diapason** | **son pur**, une seule raie |
  | flûte | fondamental fort, 2 ou 3 harmoniques faibles (spectre de la flûte de l'exercice « audiogramme ») |
  | violon | d'après le sujet de bac : a<sub>2</sub> > a<sub>1</sub>, a<sub>3</sub> et a<sub>4</sub> faibles |
  | clarinette | surtout les harmoniques impairs |
  | orgue | fondamental et rang 2 (ex. 12 du chapitre 17) |
  | guitare | harmoniques jusqu'au rang 7 |

  Chaque instrument est un préréglage des a<sub>n</sub> ; l'élève peut ensuite modifier les raies et écouter.
- **Mots affichés** : « hauteur (note) », « timbre », « son pur », « son complexe ». Une étiquette dynamique dit « son pur » s'il n'y a qu'une raie, « son complexe » sinon. La note (hauteur) est rappelée au-dessus du spectre.

**Cheminement pédagogique** (étapes guidées, « ✍ Complète ton cours » à la fin) :

1. **Le diapason** : la<sub>3</sub>, son pur.
   - Signal sinusoïdal et une seule raie à 440 Hz ; on écoute.
   - Mesure de T sur le signal (curseurs du chapitre 17), puis f = 1/T, qui est bien la raie.
2. **La hauteur** : joue d'autres notes au diapason. Plus la fréquence est grande, plus le son est aigu ; la raie se déplace, la période change.
3. **Le timbre** : **la même note jouée par des instruments différents**.
   - On choisit la<sub>3</sub>, puis diapason, flûte, violon, clarinette.
   - Le fondamental reste à 440 Hz (**même hauteur**) ; les harmoniques et la forme du signal changent (**timbre différent**).
   - Question : « qu'ont en commun ces spectres ? qu'est-ce qui change ? ».
4. **Fabriquer un timbre** : partir du son pur et ajouter des harmoniques en écoutant. Le son devient plus riche, la note ne change pas.
5. **Reconnaître** (défis) :
   - on montre deux spectres ou deux signaux : même hauteur ? même timbre ?
   - « quel instrument ? » parmi les préréglages ;
   - « quelle note ? » d'après f<sub>1</sub> et le tableau des notes ;
   - le sujet de bac « violon et microcontrôleur » (même hauteur, timbres très proches).

**Bilan** :
- son pur : sinusoïdal, une raie ;
- son complexe : plusieurs raies f<sub>n</sub> = n f<sub>1</sub> ;
- hauteur = fréquence du fondamental ;
- timbre = harmoniques = forme du signal ;
- même note sur deux instruments : même hauteur, timbre différent.

## Exercices (ordre de la feuille)

Données de la feuille : L = 10 log(I / I<sub>0</sub>), I<sub>0</sub> = 10⁻¹² W·m⁻², I = I<sub>0</sub> × 10<sup>L/10</sup>.

**Ex. 6 p. 230** (Lexus LFA, 100 dB), **sans correction fournie** :
1. son complexe (trois raies) ;
2. f<sub>1</sub> = 1 kHz ;
3. question 2bis : sur le signal, T = 1,0 ms, donc f = 1000 Hz, la même fréquence ;
4. harmoniques à 2 kHz (rang 2) et 4 kHz (rang 4) : compatibles (multiples de f<sub>1</sub>) ;
5. I = 10⁻¹² × 10¹⁰ = 1,0 × 10⁻² W·m⁻² ;
6. deux voitures : I = 2,0 × 10⁻² W·m⁻², L ≈ 103 dB (+3 dB).

Vérifie la période sur l'image agrandie du signal.

**Ex. 8 p. 231** (glockenspiel) :
- a) son complexe : fondamental et 2 harmoniques ;
- b) f<sub>1</sub> ≈ 1 kHz ;
- c) Si<sub>4</sub> (988 Hz) ;
- d) 2 kHz et 5 kHz, f<sub>n</sub> = n f<sub>1</sub> ;
- e) vérifiée pour les rangs 2 et 5.

**Ex. 10 p. 232** : a) 70 dB ; b) 56 dB ; c) 47 dB.

**Ex. 11 p. 232** :
- a) 3,2 × 10⁻⁸ W·m⁻² ;
- b) 1,0 × 10¹ W·m⁻² ;
- c) 1,0 × 10⁻³ W·m⁻².

**Ex. 17 p. 233** (atténuation béton / plâtre, graphique à refaire, fréquences en échelle log) :
- a) le béton est un bon isolant pour les hautes fréquences ;
- b) moins performant pour les basses ;
- c) le plâtre aussi pour les hautes fréquences ;
- d) moins bon pour les basses, surtout vers 400 Hz ;
- e) vrai seulement en hautes fréquences ;
- f) 100 Hz : béton ; 130 Hz : équivalents ; 500 Hz : béton.

**Exercice « audiogramme et bouchons »** (exercice « A », sans numéro du manuel) :
1. perte de 35 dB à 4000 Hz ;
2. elle correspond à 40-60 ans : il y a un problème d'audition ;
3. les bouchons moulés (atténuation presque constante) ; la mousse atténue davantage les aigus ;
4. son complexe (harmoniques) ;
5. les bouchons moulés ne déforment pas le spectre, la mousse fait perdre les harmoniques.

Les spectres et courbes sont à refaire en SVG.

**Ex. 16 p. 233** :
- a) périodique, non sinusoïdal ;
- b) T = 0,008 s, f = 125 Hz ;
- c) fondamental et harmoniques ;
- d) f<sub>1</sub> = 125 Hz, f<sub>2</sub> = 250, f<sub>3</sub> = 375, f<sub>4</sub> = 500 Hz ;
- e) 125, 250, 375, 500, 750, 875 Hz ;
- f) même hauteur ;
- g) sensation différente : le timbre.

Bouton « Écouter » avec les deux spectres chargés dans le simulateur.

**Sujet de bac « violon »** (exercice « Bac ») :
1. T ≈ 2,6 ms (7 motifs en 18,25 ms ; autre correction : 18,4 ms) ;
2. f ≈ 384 Hz ≈ 390 Hz ;
3. A est le pic de plus petite fréquence, à la fréquence du signal : fondamental ;
4. f<sub>B</sub> ≈ 770 Hz, f<sub>C</sub> ≈ 1160 Hz ;
5. 770/390 ≈ 1,97 ≈ 2 et 1160/390 ≈ 2,97 ≈ 3.

   **La correction écrit « f<sub>C</sub>/f<sub>1</sub> = 770/390 » : c'est 1160/390.**
6. B rang 2, C rang 3 ;
7. le microcontrôleur a un fondamental à ≈ 390 Hz : même hauteur ;
8. mêmes harmoniques (≈ 810 Hz et 1200 Hz) : timbres très proches.
