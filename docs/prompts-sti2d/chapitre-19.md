# Chapitre 19 : Ondes électromagnétiques (prompt de génération)

Lis d'abord `docs/prompts-sti2d/00-commun.md` (sources, charte, structure, livraison).

## Application

- Dossier `ondes-electromagnetiques/`, nom « Chapitre 19 : Ondes électromagnétiques », `data-matiere="physique"`, préfixe `oem`.
- Portail : desc « Longueur d'onde et fréquence, domaines des télécommunications, modulation AM et FM, antennes. »
- Dessin d'en-tête : nouveau dessin « antenne et onde modulée » dans `hero.js`, ou `spectre` (chapitre 17).

## Sources (`TSTI2D/19- Ondes electromagnetiques/`)

| Fichier | Contenu | À lire |
|---|---|---|
| `Chap19-Cours complete.pdf` (2 p.) | Cours complété à la main | Non : résumé ci-dessous. Page 2 pour les figures de la modulation (spectres AM, signaux modulant, porteuse, AM, FM) |
| `Chap19-Exercice.pdf` (4 p.) | Ex. 9, 10, 11 p. 245, 12 p. 246, 17 p. 247 ; exercice de bac 1 « Carte RFID » ; exercice de bac 2 « Le talkie-walkie » | Oui (tableaux de bandes, figure de l'ex. 12, documents RFID, signal et spectre du talkie-walkie) |
| `Chap19-Correction-Exercices.pdf` (5 p.) | Corrections (tapées pour 9 à 17, manuscrites pour les deux exercices de bac) | Oui |

Ignore les `.docx` et `Chap19-Cours.pdf`. La correction a l'en-tête « Chapitre 11 » d'une ancienne année : c'est bien le chapitre 19.

## Contenu du cours

### Module 1 : Onde électromagnétique, longueur d'onde et fréquence

- **Définition** : onde qui **peut se propager dans le vide** ; célérité **c = 3,00 × 10⁸ m·s⁻¹**.
- **Longueur d'onde** λ = période spatiale (sinusoïde en fonction de la distance, λ marquée).
- **Relations** : c = λ / T ou c = λ × f (c en m·s⁻¹, λ en m, T en s, f en Hz = s⁻¹), donc λ = c / f et f = c / λ.
- **Domaines** : bande des ondes électromagnétiques en λ et en f (γ, X, UV, visible, IR, micro-ondes, radio), à refaire en SVG (lien avec le chapitre 10).
- **Outil `perso`** : curseur sur la bande du spectre électromagnétique (échelle logarithmique). On choisit f ou λ, l'autre grandeur et le domaine s'affichent. À toi : « place cette onde sur l'échelle ».
- **Série** : λ ↔ f avec préfixes (kHz, MHz, GHz ; mm, cm, km), domaine d'une onde.
  
  Erreurs : préfixe non converti, λ = f / c, 10³ et 10⁶ confondus. Lien vers `puissances-10/` et `conversions/`.

### Module 2 : Domaines de fréquences des télécommunications

- **Bandes radio** (tableau du cours, de 300 GHz à 30 kHz) : EHF, SHF, UHF, VHF, HF (ondes courtes), MF (petites ondes), BF (grandes ondes). Les bornes sont des décades « 3 × 10ⁿ ».
- **Exemples du cours** :

  | Moyen de communication | Fréquences | Bande |
  |---|---|---|
  | radio FM | 87,5-108 MHz | VHF |
  | grandes ondes | 148,5-238,5 kHz | BF |
  | AM | 3,2-3,4 MHz | HF |
  | 4G | λ = 0,43 m, donc f = 7 × 10⁸ Hz = 0,7 GHz | UHF |
  | TNT | λ entre 0,38 et 0,64 m, donc 4,7 × 10⁸ à 8 × 10⁸ Hz | UHF |

- **Méthode** : si on donne λ, on calcule f d'abord, puis on place f sur l'échelle des bandes (attention, l'échelle est décroissante de gauche à droite dans le manuel).
- **Outil `perso`** : glisser une étiquette (FM, 4G, Wi-Fi, RFID…) dans la bonne bande de l'échelle, après calcul de f si nécessaire.
- **Série** : bande d'une fréquence ou d'une longueur d'onde donnée ; portée et débit (basse fréquence : grande portée, pénètre mieux dans les bâtiments ; haute fréquence : faible portée, meilleur débit).

### Module 3 : Transposition de fréquence et modulation (simulateur, puis cours)

- **Transposition fréquentielle** : on décale les fréquences du signal à transmettre (voix : 20 Hz à 20 kHz) vers de plus hautes fréquences, parce que :
  - les basses fréquences se transmettent mal (portée très limitée) ;
  - des signaux émis sur des fréquences différentes ne se brouillent pas.
  
  Cela se fait par **modulation** d'amplitude ou de fréquence.
- **Vocabulaire** :
  - **signal modulant** : l'information à transmettre ;
  - **porteuse** : onde de haute fréquence F ;
  - **signal modulé** : la porteuse dont on a modifié une caractéristique.
- **Les deux modulations** :
  - **modulation d'amplitude (AM)**, radios grandes ondes : l'**amplitude** de la porteuse varie au rythme du signal modulant ;
  - **modulation de fréquence (FM)** : la **fréquence** de la porteuse varie.
  
  En bande FM, les porteuses de deux stations sont séparées de 0,1 MHz pour ne pas se gêner.
- **Spectre du signal modulé** : bande latérale inférieure et supérieure autour de F. La bande occupée vaut **2 f<sub>h</sub>**, de F − f<sub>h</sub> à F + f<sub>h</sub> (f<sub>h</sub> = plus haute fréquence du modulant). Le signal modulé encombre donc plus le spectre que le modulant.
- **Bande passante d'un canal** : écart entre les porteuses de deux canaux voisins. Elle doit être au moins égale à 2 f<sub>max</sub> pour transmettre sans déformation (talkie-walkie).
- **Série** :
  - identifier modulant, porteuse, modulé (ex. 12) ;
  - AM ou FM d'après une figure ;
  - largeur de bande occupée ;
  - bande passante suffisante ou non ;
  - nombre de stations dans une bande.

### Module 4 : Antennes

- **Principe** : une antenne pour émettre, une autre pour recevoir.
- **Taille** : elle est liée à la longueur d'onde. La taille optimale est λ ; en pratique on prend un sous-multiple, **λ/2 (demi-onde)** ou **λ/4 (quart d'onde)**, L = λ/n.
- **Méthode** : si on donne f, on calcule d'abord λ = c / f, puis L = λ/2.
- **Série** : longueur d'une antenne demi-onde ou quart d'onde, fréquence pour une antenne donnée, nombre de tours d'un fil bobiné (RFID).
  
  Erreur : λ/2 oublié.

### Module 5 : Exercices

Voir plus bas.

## Module spécial : simulateur « Modulation AM et FM » (page `simulation` en tête du module 3)

**But pédagogique** : comprendre que moduler, c'est **inscrire un signal basse fréquence (la voix, la musique) dans une onde haute fréquence (la porteuse)** :
- en faisant varier **son amplitude** (AM) ;
- ou **sa fréquence** (FM) ;

et pourquoi on le fait :
- portée ;
- antennes de taille raisonnable ;
- plusieurs émetteurs sans brouillage.

**Forme** : trois graphiques empilés, sur le même axe des temps, aspect de la figure du cours :
1. **signal modulant** (sinusoïde basse fréquence, ou au choix un « signal sonore » à deux ou trois harmoniques, repris du moteur `FOURIER` du chapitre 17 s'il existe) ;
2. **porteuse** ;
3. **signal modulé**.

Un sélecteur **AM / FM** (deux gros boutons) change le troisième graphique.

**Réglages** (curseurs larges, valeurs affichées) :
- fréquence du modulant f<sub>m</sub> et amplitude du modulant ;
- fréquence de la porteuse F, toujours nettement plus grande que f<sub>m</sub> : rapport F/f<sub>m</sub> de 10 à 40 pour rester lisible ;
- AM : taux de modulation m de 0 à 1,2, l'enveloppe est tracée en pointillés. Au-delà de 1, **surmodulation** : l'enveloppe ne suit plus le modulant, message « l'information est déformée » ;
- FM : excursion de fréquence ΔF ; un repère montre que la porteuse se resserre quand le modulant est haut et s'écarte quand il est bas.

Les échelles sont pédagogiques (fréquences « affichées » en unités relatives, par exemple f<sub>m</sub> = 1 kHz et F = 20 kHz). Un encadré rappelle les ordres de grandeur réels : voix de 20 Hz à 20 kHz, FM vers 100 MHz, grandes ondes vers 200 kHz.

**Spectre du signal modulé (AM)** sous les graphiques, en raies : porteuse F et deux raies à F ± f<sub>m</sub>. Avec le modulant à plusieurs harmoniques, les deux **bandes latérales** sont symétriques. L'étiquette « bande occupée = 2 f<sub>h</sub> » se met à jour.

**Cheminement** (étapes guidées, « ✍ Complète ton cours » à la fin) :

1. **Le problème** : un signal sonore de 1 kHz a une longueur d'onde de 300 km. Il faudrait une antenne de 150 km (λ/2) et il porterait mal ; deux radios sur la même bande se brouilleraient.
   - Petit calcul guidé ;
   - même calcul pour une porteuse à 100 MHz (λ = 3 m, antenne 1,5 m).
2. **La porteuse seule** : haute fréquence, amplitude constante. Elle ne transporte aucune information.
3. **Modulation d'amplitude** : on active AM. L'élève fait varier m et f<sub>m</sub> et observe que l'**enveloppe du signal modulé reproduit le signal modulant**.
   - Questions : « qu'est-ce qui varie : l'amplitude ou la fréquence de la porteuse ? » ;
   - cas de la surmodulation (m > 1).
4. **Modulation de fréquence** : on passe en FM. L'amplitude reste constante ; les oscillations se resserrent et s'écartent au rythme du modulant.
   - Question : « qu'est-ce qui varie ? » ;
   - comparaison AM / FM côte à côte (bouton « comparer »), comme la figure du manuel.
5. **Le spectre et la bande occupée** (AM) : raies F − f<sub>m</sub>, F, F + f<sub>m</sub>. La bande occupée vaut 2 f<sub>h</sub>. Deux stations doivent avoir des porteuses séparées d'au moins cette largeur, sinon leurs bandes se chevauchent (deuxième station affichable, zone de chevauchement en hachures avec mention « brouillage »).
6. **Défis** :
   - « reconnais AM ou FM » sur des signaux générés ;
   - « identifie modulant, porteuse, modulé » (ex. 12) ;
   - « quelle bande passante faut-il pour ce signal ? ».

**Bilan à compléter** :
- modulant, porteuse, modulé ;
- AM : l'amplitude de la porteuse varie ; FM : sa fréquence varie ;
- bande occupée 2 f<sub>h</sub> ;
- intérêt de la transposition.

**Technique** :
- moteur dans `modules/modulation.js`, objet `MOD`, montable en plusieurs exemplaires, SVG, aucune bibliothèque ;
- courbes en `--accent` ou via attributs SVG ;
- pas d'animation obligatoire, `prefers-reduced-motion` respecté (un défilement éventuel du signal est coupé).

## Exercices (ordre de la feuille)

**Ex. 9 p. 245** :
1. 300 GHz et 30 kHz ;
2. λ :
   - a) 750 m, radio ;
   - b) 1,19 m, radio ;
   - c) 2,40 km, radio ;
   - d) 25,0 km, pas une onde radio (> 10 km) ;
3. f :
   - a) 2,4 MHz ;
   - b) 86 kHz ;
   - c) 67 GHz ;
   - d) 3,8 MHz ;
4. bandes : a MF, b BF, c EHF, d HF.

**Ex. 10 p. 245** : λ = 3,00 × 10⁸ / 2450 × 10⁶ ≈ 0,122 m : micro-ondes.

**Ex. 11 p. 245** (antennes demi-onde) :
1. longueurs d'antenne :
   - a) 0,5 mm ;
   - b) 1,5 km ;
   - c) 7,5 cm ;
   - d) 21 dm ;
   - e) 7500 m ;
2. λ puis L :
   - a) 12 cm et 6,0 cm ;
   - b) 6,7 × 10³ m et 3,4 × 10³ m ;
   - c) 4,0 × 10⁶ m et 2,0 × 10⁶ m ;
   - d) 2,5 × 10³ m et 1,3 × 10³ m ;
   - e) 0,69 m et 0,35 m.

**Ex. 12 p. 246** : 1er signal = modulant, 2e = porteuse, 3e = modulé ; modulation d'amplitude.

Figure à refaire en SVG avec le moteur `MOD`.

**Ex. 17 p. 247** (téléphonie mobile) :
- a) 700 MHz donne λ ≈ 0,43 m ; 26 GHz donne λ ≈ 11,5 mm ;
- b) UHF et SHF ;
- c) basses fréquences : plus grande portée, moins d'antennes relais à la campagne ;
- d) 1,8 et 2,6 GHz : meilleur débit, portée réduite sans gêne en ville ;
- e) débit insuffisant ;
- f) garder une bande à grande portée pour les zones rurales ;
- g) portée très faible à 26 GHz ;
- h) multiplier les antennes relais.

**Bac 1 « Carte RFID »** :
1. 135 kHz : BF ; 13,56 MHz : HF ; 433 MHz : UHF ;
2. adaptation à des milieux, des distances de lecture et des débits différents ;
3. λ = 3 × 10⁸ / 135 × 10³ ≈ 2222 m ;
4. périmètre = 2 × 6,5 + 2 × 4,5 = 22 cm ;
5. L = λ/2 ≈ 1111 m, n = 1111 / 0,22 ≈ 5050 tours ;
6. une fréquence plus élevée augmente le taux de transfert.

**Bac 2 « Le talkie-walkie »** :
- 1.1 : canal 3, f = 446,03125 MHz, λ ≈ 0,673 m, L = λ/2 ≈ 33,6 cm (3 chiffres significatifs) ;
- 1.2 : l'antenne de la photo est plus courte, ce n'est pas une demi-onde ;
- 2.1 : son complexe (signal non sinusoïdal) ;
- 2.2 : 7T = 6,6 ms, T ≈ 0,94 ms, f ≈ 1064 Hz, donc do<sub>5</sub> (1046 Hz) ;
- 2.3 : plusieurs pics, donc son composé ; fondamental ≈ 1050 Hz ;
- 2.4 : f<sub>m</sub> ≈ 4,2 kHz ;
- 2.5 : bande passante du canal 3 = 446,04375 − 446,01875 = 0,025 MHz = 25 kHz > 2 f<sub>m</sub> = 8,4 kHz : suffisante.
  
  Garde la méthode de la correction : écart entre les porteuses des canaux 4 et 2. L'énoncé dit « deux canaux successifs », ce qui donne 12,5 kHz, encore > 8,4 kHz. **Signale-le dans la correction**, la conclusion ne change pas.
- 3.1 : I<sub>1</sub> = 10⁻¹² × 10<sup>8,7</sup> ≈ 5,01 × 10⁻⁴ W·m⁻², P = I × 4πR² ≈ 1,57 × 10⁻³ W ≈ 1,6 × 10⁻³ W ;
- 3.2 : I<sub>5</sub> = 1,6 × 10⁻³ / (4π × 5,0²) ≈ 5,1 × 10⁻⁶ W·m⁻², L ≈ 67 dB.

Formules données : L = 10 log(I/I<sub>0</sub>), I = P/(4πR²). Lien vers `ondes-sonores/` (chapitre 18) si l'application existe.
