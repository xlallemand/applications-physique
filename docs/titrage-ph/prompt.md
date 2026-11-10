# Titrage pH-métrique : TP virtuel « Dosage du Destop » (prompt de génération)

## Utilisation

Le travail se fait **en deux sessions** (§10) :

1. Ouvre une session cloud sur `applications-physique`, **attache les trois fichiers** de sources (§0) et écris :
   > Lis `docs/titrage-ph/prompt.md` et exécute l'étape 1.
2. Après avoir essayé les maquettes, dans une nouvelle session, avec les mêmes fichiers attachés :
   > Lis `docs/titrage-ph/prompt.md` et exécute l'étape 2. Maquettes retenues : … Remarques : …

Lis tout ce fichier dans les deux cas : les maquettes doivent déjà respecter ce que l'application attend.

## 0. Avant de commencer

### Sources (attachées au message de la session)

| Fichier | Contenu | À lire |
|---|---|---|
| `Chap06-TP6-titrage_Destop_pHmetrique_complete.pdf` (4 p.) | Énoncé du TP, complété à la main par le professeur (correction) | Résumé ci-dessous (§5, §8) ; à relire pour le schéma du montage corrigé (p. 2) et l'allure de la courbe et de sa dérivée (p. 3) |
| `Chap06_Cours_titrage_complete.pdf` (7 p.) | Cours « Dosage par titrage », annoté à la main | Résumé ci-dessous (§7) ; à relire pour les schémas de montage (p. 1, 4, 6), les courbes et la méthode des tangentes (p. 5) |
| `Mode_emploi_Regressi.pdf` (2 p.) | Mode d'emploi simplifié de Regressi, avec copies d'écran | **En entier** pour la fiche Regressi (§6) : mêmes noms de menus, même ordre |

- Les PDF ont des annotations manuscrites : lis-les avec `Read` (rendu exact), une page à la fois, une seule fois. `pdftotext` ne voit pas les notes manuscrites.
- **Ne les ajoute pas au dépôt** (documents du professeur) : l'application se suffit à elle-même.
- Si une source manque dans la session, les résumés de ce fichier suffisent : dis-le dans le compte rendu.

### À lire dans le dépôt

1. Lis `CLAUDE.md`, puis **en entier** `docs/charte-applications.md`. Elle prime sur tout le reste pour le style, la navigation et l'accessibilité.
2. Applications de référence à lire (seulement ce qui sert) :
   - `montage-electrique/` : application de **manipulations virtuelles** (pages `entrainement` / `simulation`, sans cours ni série) et **moteur partagé dans `assets/`** (`assets/montage.js`, `assets/montage.css`) utilisé par plusieurs applications : c'est le modèle à suivre pour le simulateur de titrage ;
   - `oscilloscope/` : simulateur qui tient dans l'écran, outils de mesure sur une courbe (curseurs), bouton de position ;
   - `ph/` : graphiques (classes `ph-*`), champs ± (`ph-champ`) ;
   - `assets/dragdrop.js` (glisser-déposer souris + tactile), `assets/etapes.js` (gestes à faire dans l'ordre) : à réutiliser plutôt que de réécrire.
3. Travaille sur la branche **`titrage`** (crée-la depuis `main` si elle n'existe pas). Commits en français ; push sur `titrage`. Pas de pull request sans demande.

## 1. L'application

- Dossier **`titrage-ph/`**, `index.html` + `modules/`, préfixe **`tph`**, espace de noms `TPH` (pages du TP).
- Nom : **« TP : titrage pH-métrique du Destop »**, le même partout (`<title>` et `<h1>` de l'accueil, `SOM.init({ nom })`, fin du `<title>` des pages, `titre` dans `APPS`).
- `<html lang="fr" data-matiere="chimie">` ; kicker « Chimie · Terminale spécialité ».
- Portail (`index.html` racine) : `dom: 'chimie'`, `niv: ['spe']`, juste après l'application `ph` ; desc : « TP virtuel : dilution, montage, titrage simulé, volume équivalent et incertitudes. » Déclare les pages dans `AVANCEMENT` (`assets/avancement.js`).
- En-tête illustré : nouveau dessin **`titrage`** dans `assets/hero.js` (burette au-dessus d'un bécher, courbe de titrage en S décroissante avec ses tangentes parallèles), ajouté à la liste commentée en tête du fichier.
- **Simulateur de titrage partagé** dans `assets/` (§4) : c'est la pièce principale, il resservira dans d'autres applications.

## 2. Contraintes générales (demandées par le professeur)

1. **Chaque partie tient dans l'écran d'un ordinateur, sans défilement de la page**, surtout le simulateur. Référence : fenêtre de **1280 × 720 px** (sommaire de 264 px à gauche compris) ; vérifie aussi 1366 × 768 et 1920 × 1080. Contrôle Playwright sur chaque page : `document.documentElement.scrollHeight <= innerHeight`. Pour tenir : une partie = une page, mise en page en colonnes, textes courts, tableau de valeurs en petit, consignes dépliables si besoin. Sur téléphone (< 900 px), la page peut défiler (empilement), mais la règle « jamais remonter pour répondre » de la charte s'applique.
2. **Chaque partie se passe facilement** : en haut de chaque page, un bouton `btn-small` **« Passer cette partie → »** qui remplit la partie avec la bonne réponse (ou des mesures toutes faites), l'affiche, enregistre ce qu'il faut pour la suite et donne le bouton vers la partie suivante. Aucune partie n'est verrouillée (charte §5) : une partie ouverte sans que la précédente soit faite utilise les valeurs par défaut (« Passer »).
3. **Données du TP toujours accessibles** sans quitter la page : bouton `btn-small` « Données du TP » dans la carte d'en-tête de chaque page, qui ouvre un panneau (contexte, titre massique, ρ, M, cA, matériel disponible, formules d'incertitude) qui se ferme par ✕, Échap ou le voile.
4. **Ce que l'élève a fait est gardé d'une page à l'autre** (mesures, Veq trouvé, résultats) : clé `localStorage` **`titrage-ph-tp`** (JSON, dans un `try/catch`, charte §5). Sans stockage, tout marche dans la page en cours.
5. Saisies d'un nombre : champs de la charte (± , `inputmode="decimal"`, ≥ 16 px, icône calculatrice si besoin). Le reste se fait **par boutons, choix et étiquettes** : pas de texte à taper.
6. Retours : « Juste ! » / « Ce n'est pas ça. » + diagnostic ciblé (charte §6), « Afficher la réponse » après une erreur.

## 3. Plan de l'application (`PLAN`)

Pas de cours, pas de série notée, pas de fiche récapitulative, sauf la fiche Regressi (module 3). Chaque page est marquée faite quand sa dernière étape est réussie ou passée.

| Module | Parties (une page chacune) | Clé de page (type) |
|---|---|---|
| 1. Préparer le titrage (`sousModules: true`) | Diluer 20 fois le Destop | `module_1a_dilution` (`entrainement`) |
| | Schéma du montage | `module_1b_montage` (`entrainement`) |
| | Réaction et équivalence | `module_1c_reaction` (`entrainement`) |
| 2. Réaliser le titrage | Simulateur de titrage | `module_2_titrage` (`simulation`) |
| 3. Exploiter le titrage (`sousModules: true`, `fiche: 'fiche_3'`) | Repérer le volume équivalent | `module_3a_equivalence` (`entrainement`) |
| | Calculer le titre massique | `module_3b_titre` (`entrainement`) |
| 4. Valider le résultat | Incertitudes et compatibilité | `module_4_incertitudes` (`entrainement`) |

`fiche_3.html` = **fiche « Le faire avec Regressi »** (§6), ancres `#ouvrir`, `#tangentes`, `#derivee`.

Accueil : en-tête illustré, puis une carte courte **« Le TP »** (contexte en 3 lignes : déboucheur = solution concentrée d'hydroxyde de sodium ; la bouteille du labo n'indique pas son titre massique ; but : le déterminer et le comparer à 10 % et 6 %), puis « Reprendre » et les lignes dépliables des modules (`SOM.accueil`).

## 4. Simulateur de titrage partagé (`assets/titrage.js`, `assets/titrage.css`, espace de noms `TITRAGE`, classes `ttr-`)

### 4.1 Architecture (réutilisable)

Il doit servir à d'autres applications pour des titrages **pH-métriques, colorimétriques et conductimétriques**. Sépare :

| Partie | Rôle |
|---|---|
| `TITRAGE.chimie` | Modèle **sans DOM** (doit se charger dans Node pour les tests) : composition du bécher, pH, conductivité, couleur, pour un volume versé V |
| `TITRAGE.montage(zone, options)` | Schéma SVG du montage : potence, burette graduée (niveau qui baisse), bécher (volume qui monte, couleur de la solution), agitateur magnétique (barreau qui tourne, coupé par `prefers-reduced-motion`), appareil de mesure (pH-mètre avec sa sonde, conductimètre avec sa cellule, ou rien pour un titrage colorimétrique), **espèces écrites** à côté de la burette et du bécher. Option `aCompleter` : zones de dépôt vides (§5.2) |
| `TITRAGE.courbe(zone, options)` | Repère SVG (grandeur mesurée en fonction de V), points et courbe, outils de repérage (§4.4, §4.5) |
| `TITRAGE.tableau(zone)` | Tableau de valeurs, en petit |
| `TITRAGE.regressi(mesures)` | Texte au format Regressi et copie dans le presse-papier (§6) |
| `TITRAGE.creer(zone, config)` | Assemble le tout (montage + commandes + tableau + courbe) et renvoie une API : `verser(v)`, `mesures()`, `recommencer()`, `remplirAuto(volumes)`, `veqTire()`, événements `onMesure` |

Tout doit pouvoir exister **en plusieurs exemplaires** dans une page (pas d'`id` fixe, pas d'état global). Couleurs uniquement par variables du thème (exception : couleurs des solutions et des indicateurs colorés, en constantes commentées comme `VEC.C`).

Configuration (à adapter, mais garder l'idée) :

```js
TITRAGE.creer(zone, {
  suivi: 'ph',                              // 'ph' | 'conductimetrie' | 'colorimetrie'
  titrant: { nom: 'acide chlorhydrique', especes: 'H₃O⁺ + Cl⁻', c: 0.100, symboleC: 'c_A' },
  titre:   { nom: 'S₀', especes: 'Na⁺ + HO⁻', V: 10.0, symboleC: 'c_B' },
  reaction: { type: 'acide-base', titrant: { fort: true }, titre: { fort: true } },   // pKa pour un couple faible
  // ou { type: 'oxydoreduction', a, b, couleurs } pour un titrage colorimétrique par espèce colorée
  veq: { moyenne: 9.00, ecartType: 0.40 },  // volume équivalent tiré au hasard (§4.3)
  eauAjoutee: 0,                            // mL d'eau distillée ajoutés au bécher (conductimétrie)
  indicateur: null,                         // 'heliantine' | 'BBT' | 'phenolphtaleine'
  pas: [1, 0.2, 0.1],                       // mL
  vMax: 25,                                 // burette de 25 mL
});
```

### 4.2 Modèle chimique

- **Acide-base** (monoacides et monobases, forts ou faibles, pKa donné) : pH exact par l'électroneutralité, résolue par dichotomie sur [H₃O⁺] (Ke = 10⁻¹⁴), dilution comprise (volume total VB + V + eau ajoutée). Cas du TP (acide fort / base forte) : pH(0) = 12,95, pH(Veq) = 7,00, pH(16 mL) = 1,57 avec c0 = 0,090 mol·L⁻¹.
- **Conductivité** : σ = Σ λᵢ [Xᵢ] avec les quantités de chaque ion (réaction totale, avancement limité par le réactif en défaut), table de λ commentée (H₃O⁺, HO⁻, Na⁺, Cl⁻, CH₃COO⁻, K⁺, MnO₄⁻…), valeurs du cours : λ(Na⁺) = 5,0 × 10⁻³, λ(HO⁻) = 20 × 10⁻³, λ(CH₃COO⁻) = 4,1 × 10⁻³ S·m²·mol⁻¹. Unité d'affichage réglable (mS·m⁻¹ par défaut).
- **Couleur** : indicateur coloré (couleur acide / basique, zone de virage : hélianthine rouge 3,1–4,4 jaune ; BBT jaune 6,0–7,6 bleu ; phénolphtaléine incolore 8,2–10 rose ; teinte mélangée dans la zone de virage) ou espèce colorée (ex. MnO₄⁻ violet qui persiste après l'équivalence).
- Dans cette application, seul le suivi `ph` est utilisé ; les deux autres suivis sont **faits et testés** (modèle, appareil, courbe ou couleur du bécher) sur une page d'essai dans le scratchpad, pas dans l'application. Les outils de repérage propres à la conductimétrie (intersection de deux droites) ne sont pas à faire maintenant : l'architecture doit permettre de les ajouter.

### 4.3 Volume équivalent aléatoire (incertitudes)

- La vraie bouteille titre **6,0 %** : Veq théorique = **9,00 mL** (c0 = 0,090 mol·L⁻¹).
- Chaque **prise d'essai** tire son propre Veq : 9,00 mL + écart gaussien d'écart-type **0,40 mL**, borné à ± 3 écarts-types (dispersion du même ordre que celle des groupes dans la correction : titres de 5,7 % à 6,53 %). Le modèle en déduit la concentration réelle du bécher (c = cA × Veq / VB), puis toutes les valeurs.
- Le pH-mètre affiche le pH **à 0,01 près**, avec un petit bruit de mesure (± 0,01) et un léger décalage d'étalonnage tiré par prise d'essai (± 0,05).
- Le Veq tiré n'est **jamais affiché** à l'élève ; il est gardé avec les mesures (`titrage-ph-tp`), pour que la page des résultats et le retour sur la page reprennent la même prise d'essai.
- Bouton `btn-small` **« Recommencer (nouvelle prise d'essai) »** : nouveau tirage, mesures effacées (confirmation si des mesures existent).
- `TITRAGE.chimie` fournit aussi une fonction qui simule le **Veq trouvé par un autre groupe** (même loi, arrondi à 0,05 mL), pour le tableau des groupes (§5.7).

### 4.4 Commandes, tableau, courbe (page `module_2_titrage`)

Disposition ordinateur, **sans défilement**, en trois colonnes :

| Gauche | Centre (la plus large) | Droite (étroite) |
|---|---|---|
| Schéma du montage (espèces, cA, VB, « agitation », pH-mètre qui affiche la valeur), sous lui les commandes | Courbe pH = f(V) qui se trace à chaque ajout | Tableau de valeurs **en petit** (≈ 0,75 rem, `tabular-nums`), qui défile dans son propre conteneur, dernière ligne toujours visible |

- **Choix du volume à verser** : trois pastilles **1 mL · 0,2 mL · 0,1 mL** (une seule active, `aria-pressed`), puis un bouton principal **« Verser »**. Un appui = un ajout du volume choisi ; le niveau de la burette baisse, la lecture « V = 7,4 mL » et le pH-mètre se mettent à jour, une ligne s'ajoute au tableau, un point à la courbe. Les volumes sont gardés en dixièmes de mL entiers (pas d'erreur d'arrondi). Arrêt à `vMax`.
- Consigne courte au-dessus des commandes (celle du TP) : « Verse l'acide 1 mL par 1 mL en notant le pH. Près du saut de pH, verse 0,2 mL à la fois, au moins 1 mL avant et 1 mL après le saut. Va jusqu'à 16 mL. »
- Tableau : colonnes `V (mL)` et `pH`, valeurs à la française (`7,4` ; `11,03`).
- Courbe : axes `V (mL)` de 0 à 20 (élargi si on va plus loin) et `pH` de 0 à 14, quadrillage en pointillés, points + courbe lissée (interpolation monotone, Fritsch-Carlson : pas d'oscillation dans le saut), couleurs de la charte.
- Liens sous la courbe : « Copier les mesures pour Regressi » (§6) et « Le faire avec Regressi » (fiche 3, nouvelle fenêtre).
- « Passer cette partie » : remplit automatiquement une série de mesures **comme le tableau du TP**, adaptée au Veq tiré : 1 mL par 1 mL jusqu'à environ Veq − 2 mL, 0,2 mL jusqu'à environ Veq + 2 mL, puis 1 mL par 1 mL jusqu'à 16 mL.
- Page terminée quand V ≥ 16 mL **et** au moins 5 points dans le saut (sinon un message dit ce qui manque : « Ajoute des points de 0,2 mL près du saut : la courbe y sera plus précise »).

### 4.5 Repérer le volume équivalent (outils de `TITRAGE.courbe`, page `module_3a_equivalence`)

La page reprend la courbe des mesures de l'élève (ou celle de « Passer » du module 2) en grand, le tableau en petit, et deux onglets de méthode : **« Méthode des tangentes »** et **« Courbe dérivée »**, plus le lien « Le faire avec Regressi ». Rappel de la méthode (texte du cours, §7) dans une ligne de consigne qui change à chaque étape.

**Méthode des tangentes, semi-automatique** (géométrie calculée en pixels, comme sur papier) :

1. « Pose ton doigt (ou la souris) sur la courbe, sur l'arrondi avant le saut. » Pendant l'appui, une **tangente à la courbe lissée** suit le doigt / la souris le long de la courbe (point de contact = abscisse du pointeur) ; **au relâchement**, elle est tracée (T₁).
2. Une **parallèle** à T₁ apparaît : l'élève la fait glisser (translation perpendiculaire à sa direction, poignée visible) jusqu'à ce qu'elle soit **tangente à l'autre arrondi**. Bouton « Valider la position » : vérifie qu'elle touche la courbe sans la couper dans la zone de l'arrondi (tolérance de quelques pixels) ; diagnostics : « Elle coupe la courbe : éloigne-la », « Elle ne touche pas la courbe : rapproche-la ». T₁ peut être reprise (bouton « Reprendre la 1re tangente »).
3. Une **perpendiculaire** aux deux tangentes apparaît, ses extrémités toujours sur T₁ et T₂ : l'élève la fait glisser le long des tangentes où il veut ; son **milieu est marqué automatiquement** (point + petites marques de longueurs égales).
4. Une **troisième droite**, parallèle aux deux autres, apparaît : l'élève la fait glisser jusqu'au milieu de la perpendiculaire (aimantée à moins de 8 px du milieu).
5. Le point d'intersection de cette droite avec la courbe (point d'équivalence E) est marqué, puis un **segment vertical en pointillés** descend de E jusqu'à l'axe des V. L'élève **lit** Veq et l'écrit (champ ± « Veq = … mL », 2 chiffres significatifs ou au dixième de mL) : juste si à ± 0,1 mL de l'abscisse de E.

Gestes : `touch-action: none` sur le repère seulement pendant un outil actif (sinon `pan-y`), cibles de 44 px au moins autour des poignées, Pointer Events (souris, doigt, stylet). Chaque élément tracé reste visible ; bouton « Tout effacer ».

**Courbe dérivée** :

1. Bouton « Tracer la dérivée dpH/dV » : calcule la dérivée en chaque point comme Regressi, (pHᵢ₊₁ − pHᵢ₋₁) / (Vᵢ₊₁ − Vᵢ₋₁), et la trace sur la même figure avec un **second axe à droite** (`dpH/dV (mL⁻¹)`), en pointillés et `--ink-2` pour la distinguer.
2. « Touche l'extrémum de la courbe dérivée. » Un appui place un trait vertical en pointillés à l'abscisse touchée, aimanté au point de la dérivée le plus proche. Ici le pH diminue : la dérivée est **négative**, l'extrémum est un **minimum** (dans la correction, le pic de la dérivée est vers le bas). Diagnostic si l'élève touche un maximum ou un autre point : « Le volume équivalent est à l'extrémum de la dérivée : ici le pH diminue, la dérivée est négative, cherche son minimum. »
3. L'élève lit et écrit Veq (même champ, même tolérance autour de l'extrémum).
4. Remarque affichée après : la précision dépend du pas des mesures près du saut (pas de 1 mL : Veq connu à ± 0,5 mL environ ; 0,2 mL : ± 0,1 mL).

Le **Veq retenu** pour la suite est la valeur écrite par l'élève (pas le Veq tiré) : il sert aux calculs (§5.6) et au tableau des groupes (§5.7). « Passer cette partie » : Veq = abscisse de l'extrémum de la dérivée des mesures, arrondie à 0,1 mL.

## 5. Les pages du TP

### 5.1 `module_1a_dilution` : diluer 20 fois le Destop

1. Relation du facteur de dilution : choix parmi **F = V<sub>fiole</sub> / V<sub>pipette</sub>** (juste), F = V<sub>pipette</sub> / V<sub>fiole</sub>, F = V<sub>fiole</sub> × V<sub>pipette</sub>, F = V<sub>fiole</sub> − V<sub>pipette</sub>.
2. **Choisir le matériel parmi le matériel disponible** : le matériel du TP est dessiné (SVG) sur une paillasse, chaque objet est un bouton qu'on touche pour le choisir (ou le reposer) : béchers, fiole jaugée 50,0 mL, fiole jaugée 100,0 mL, burette graduée, pipette jaugée 5,0 mL, pipette jaugée 10,0 mL (avec poire à pipeter), agitateur magnétique, pH-mètre. Le facteur obtenu s'affiche en direct dès qu'une fiole et une pipette sont choisies (« F = 100,0 / 5,0 = 20 »). Bouton « Valider le matériel ».
   - Juste : **pipette jaugée de 5,0 mL + fiole jaugée de 100,0 mL** (seule combinaison qui donne 20).
   - Diagnostics : fiole 50 mL + pipette 5 mL ou fiole 100 mL + pipette 10 mL → « F = 10 : la solution ne serait diluée que 10 fois » ; fiole 50 mL + pipette 10 mL → « F = 5 » ; burette ou bécher pour prélever → « Pour prélever un volume précis, on utilise une pipette jaugée » ; bécher pour la solution fille → « Le volume final doit être précis : fiole jaugée » ; pH-mètre, agitateur → « Ils ne servent pas à la dilution ».
3. **La phrase du protocole s'écrit toute seule** à partir du matériel choisi, puis s'affiche dans une `.cle` (« ✍ Recopie-la sur ton compte rendu ») :
   > Prélever 5,0 mL de Destop à l'aide d'une pipette jaugée de 5,0 mL. Les introduire dans une fiole jaugée de 100,0 mL et compléter jusqu'au trait de jauge avec de l'eau distillée.

   La phrase est construite à partir des volumes choisis (une phrase juste ne s'affiche qu'avec le bon matériel ; avec un mauvais choix, aucune phrase n'est proposée).

### 5.2 `module_1b_montage` : schéma du montage à compléter

Schéma du simulateur (`TITRAGE.montage`, option `aCompleter`), étiquettes à glisser (`assets/dragdrop.js`) **ou** à toucher puis toucher la zone (pour le tactile) :

| Zone | Étiquette juste | Étiquettes fausses (erreurs classiques) |
|---|---|---|
| Burette : espèces | H₃O⁺ + Cl⁻ (acide chlorhydrique) | Na⁺ + HO⁻ (S₀) |
| Burette : concentration | c<sub>A</sub> = 0,100 mol·L⁻¹ | c<sub>B</sub> inconnue |
| Burette : volume | V<sub>eq</sub> (volume versé à la burette graduée) | V<sub>B</sub> = 10,0 mL |
| Bécher : espèces | S₀ : Na⁺ + HO⁻ | H₃O⁺ + Cl⁻ |
| Bécher : concentration | c<sub>B</sub> inconnue | c<sub>A</sub> = 0,100 mol·L⁻¹ |
| Bécher : volume | V<sub>B</sub> = 10,0 mL à la pipette jaugée | V<sub>eq</sub> |
| Agitateur | agitation | — |

Diagnostics : titrant / titré inversés (« La burette contient la solution titrante, de concentration connue ; le bécher, la solution titrée, prélevée à la pipette jaugée ») ; Veq dans le bécher, etc.

**Appareil de mesure à placer** : trois cartes à choisir puis à poser dans le schéma : **pH-mètre** (juste : sa sonde plonge dans le bécher), **conductimètre** (« On suit ici le pH, pas la conductivité »), **quelques gouttes d'indicateur coloré** (« Un indicateur repère l'équivalence par un changement de couleur, sans mesure : on ne pourrait pas tracer de courbe »).

**Phrase à construire sans l'écrire** : des morceaux de phrase à toucher dans l'ordre (un appui l'ajoute à la phrase, un appui dans la phrase le retire), puis « Valider » :
- morceaux justes : « On trace » · « le pH » · « en fonction du » · « volume V d'acide versé » ;
- morceaux pièges : « le volume V » · « en fonction du pH » · « la conductivité σ » · « le volume équivalent Veq » · « le volume V<sub>B</sub> de S₀ ».
- Attendu : « On trace le pH en fonction du volume V d'acide versé. » Diagnostics : grandeurs inversées (« On trace y en fonction de x : le pH en ordonnée, V en abscisse »), Veq ou V<sub>B</sub> au lieu de V, σ au lieu du pH.

Fin : le schéma complet (comme la correction du professeur) et la phrase s'affichent dans une `.cle` « ✍ Recopie le schéma et la phrase ».

### 5.3 `module_1c_reaction` : réaction de titrage et relation à l'équivalence

1. **Équation** à construire avec des étiquettes à toucher (même outil que la phrase) : réactifs et produits parmi H₃O⁺, HO⁻, Na⁺, Cl⁻, H₂O, 2 H₂O. Attendu : **H₃O⁺ + HO⁻ → 2 H₂O**. Diagnostics : ions spectateurs écrits (« Na⁺ et Cl⁻ ne réagissent pas : ce sont des ions spectateurs »), H₂O au lieu de 2 H₂O (« Compte les H et les O »).
2. **Relation à l'équivalence** (QCM) : **c<sub>B</sub> × V<sub>B</sub> = c<sub>A</sub> × V<sub>eq</sub>** (juste) ; c<sub>B</sub> × V<sub>eq</sub> = c<sub>A</sub> × V<sub>B</sub> ; c<sub>B</sub> / V<sub>B</sub> = c<sub>A</sub> / V<sub>eq</sub> ; c<sub>B</sub> × V<sub>B</sub> = 2 c<sub>A</sub> × V<sub>eq</sub>. Solution affichée : « À l'équivalence, n<sub>B</sub> / 1 = n<sub>A</sub> / 1, soit c<sub>B</sub> V<sub>B</sub> = c<sub>A</sub> V<sub>eq</sub> » (coefficients de l'équation, cours : n<sub>A</sub> / a = n<sub>B</sub> / b).

### 5.4 `module_2_titrage` : le simulateur

Voir §4.4.

### 5.5 `module_3a_equivalence` : repérer le volume équivalent

Voir §4.5.

### 5.6 `module_3b_titre` : calculer le titre massique

Outil de calcul **par formules à choisir et valeurs à placer** (le même qu'au §5.7, dans `tph.js`, en plusieurs exemplaires possibles) :

- pour chaque grandeur, des **cartes de formules** (une juste et des erreurs classiques) ; une fois la bonne formule choisie, elle s'affiche avec des **cases vides** ;
- des **étiquettes de valeurs** (données du TP et résultats déjà obtenus, avec leur unité) à placer dans les cases (toucher l'étiquette puis la case, ou glisser) ;
- dès que les cases sont remplies, **le calcul se fait tout seul** (résultat avec unité et chiffres significatifs raisonnables) ; une mauvaise valeur dans une case donne un diagnostic ;
- le résultat devient une étiquette pour la suite.

Étapes (Veq = celui de l'élève, §4.5) :

| Grandeur | Formule juste | Formules pièges | Diagnostic à prévoir |
|---|---|---|---|
| c<sub>0</sub> (S₀) | c<sub>0</sub> = c<sub>A</sub> × V<sub>eq</sub> / V<sub>B</sub> | c<sub>A</sub> × V<sub>B</sub> / V<sub>eq</sub> ; c<sub>A</sub> / (V<sub>eq</sub> × V<sub>B</sub>) | V<sub>B</sub> et V<sub>eq</sub> dans la même unité (mL / mL : pas besoin de convertir) |
| c<sub>D</sub> (Destop) | c<sub>D</sub> = 20 × c<sub>0</sub> | c<sub>0</sub> / 20 | « Le Destop est plus concentré que la solution diluée » |
| C<sub>m</sub> (concentration massique) | C<sub>m</sub> = c<sub>D</sub> × M<sub>NaOH</sub> | c<sub>D</sub> / M | mol·L⁻¹ × g·mol⁻¹ = g·L⁻¹ |
| t (titre massique) | t = C<sub>m</sub> / ρ | ρ / C<sub>m</sub> ; C<sub>m</sub> × ρ | étiquettes de ρ : « 1,2 kg·L⁻¹ » et « 1 200 g·L⁻¹ » : avec 1,2, « C<sub>m</sub> est en g·L⁻¹ : ρ doit être en g·L⁻¹ » |

Avec Veq = 9,0 mL (correction du professeur) : c<sub>0</sub> = 0,100 × 9,0 / 10,0 = 9,0 × 10⁻² mol·L⁻¹ ; c<sub>D</sub> = 20 × 9,0 × 10⁻² = 1,8 mol·L⁻¹ ; C<sub>m</sub> = 1,8 × 40 = 72 g·L⁻¹ ; t = m<sub>NaOH</sub> / m<sub>solution</sub> = C<sub>m</sub> × V / (ρ × V) = 72 / 1 200 = 6,0 × 10⁻² = **6,0 %**. Afficher la justification t = C<sub>m</sub> V / (ρ V) dans la solution de la dernière étape. Icône calculatrice sur les résultats à calculer.

Fin : une `.cle` récapitule la chaîne de calcul de l'élève (« ✍ Recopie tes calculs »), qui sert aussi à calculer automatiquement le titre de chaque groupe au §5.7 : t = 20 × c<sub>A</sub> × V<sub>eq</sub> × M / (V<sub>B</sub> × ρ).

### 5.7 `module_4_incertitudes` : incertitudes et compatibilité

1. **Tableau des groupes** (petit, une colonne par groupe comme dans le TP) : ligne « V<sub>eq</sub> (mL) » et ligne « t (%) », calculée automatiquement. Groupe 1 = **toi** (ton Veq) ; groupes 2 à 9 : Veq **simulés par le simulateur** (§4.3), tirés une fois et gardés. Les cases de Veq des autres groupes sont **modifiables** pour mettre les vraies valeurs de la classe (chaque élève a fait sa propre prise d'essai), avec « + Groupe » / « − Groupe » (2 à 12 groupes) et « Revenir aux valeurs simulées ».
2. **Calculs avec l'outil du §5.6**, valeurs à placer : la colonne des t<sub>i</sub>, n, t̄, σ, u(t), t<sub>ref</sub> = 10 % et 6 % (et, en pièges, la colonne des V<sub>eq</sub>) :

| Grandeur | Formule juste | Pièges |
|---|---|---|
| moyenne | t̄ = (1/n) Σ t<sub>i</sub> | Σ t<sub>i</sub> ; (1/(n − 1)) Σ t<sub>i</sub> |
| écart-type | σ = √[ (1/(n − 1)) Σ (t<sub>i</sub> − t̄)² ] | même chose avec 1/n ; sans la racine |
| incertitude | u(t) = σ / √n | σ / n ; σ × √n ; σ |
| compatibilité | \|t̄ − t<sub>ref</sub>\| / u(t), comparé à 2 | \|t̄ − t<sub>ref</sub>\| / σ ; \|t̄ − t<sub>ref</sub>\| seul |

3. **Conclusion** pour t<sub>ref</sub> = 10 % puis 6 % : l'élève choisit « compatible » ou « non compatible » ; juste si cohérent avec la valeur calculée (≤ 2 : compatible). Correction du professeur pour vérifier : t = 5,9 ; 5,8 ; 6,53 ; 5,7 ; 6,1 ; 6,3 ; 5,7 ; 6,22 ; 6,1 (n = 9) → t̄ = 6,04 %, σ = 0,29 %, u(t) = 0,29 / √9 ≈ 9,5 × 10⁻² % ; 10 % : |6,04 − 10| / 9,5 × 10⁻² ≈ 42 > 2 → non compatible ; 6 % : |6,04 − 6| / 9,5 × 10⁻² ≈ 0,4 < 2 → compatible. (Vérifie ces nombres avec un script.)
4. Fin : bilan en une `.cle` (« ✍ Complète ton compte rendu ») et lien « Refaire un titrage » (module 2, nouvelle prise d'essai).

## 6. Regressi

- **Copie automatique** (« Copier les mesures pour Regressi », sur les pages des modules 2 et 3) : données au **format CSV**, **séparateur point-virgule**, une colonne par grandeur, **première ligne : les noms des grandeurs, `V` puis `pH`**, puis une ligne par mesure, **virgule décimale**, pas de ligne d'unités :

  ```
  V;pH
  0;12,95
  1;12,87
  7,2;11,95
  ```

  Copie par `navigator.clipboard.writeText`, avec repli `document.execCommand('copy')` sur une zone de texte cachée ; si les deux échouent, afficher le texte dans une zone sélectionnée avec « Copie-le (Ctrl + C) ». Message de réussite : « Mesures copiées. Dans Regressi : Fichier → Nouveau → Presse-papier. »
- **Fiche `fiche_3.html` « Le faire avec Regressi »** (ouverte dans une nouvelle fenêtre depuis les pages des modules 2 et 3, pour garder sa page en cours), étapes numérotées, **mêmes noms de menus et même ordre que le mode d'emploi du professeur** (`Mode_emploi_Regressi.pdf`), avec des schémas simples des boutons et fenêtres (pas de copie d'écran) :
  - `#ouvrir` : « Copier les mesures pour Regressi » dans l'application, puis dans Regressi **Fichier → Nouveau → Presse-papier** ; onglet **Graphe**, **Coord.** : V en abscisse, pH en ordonnée, cocher **Ligne** et **Point** ; lire une valeur avec **Outils gr. → Réticule libre** ;
  - `#tangentes` : une seule phrase, sans détailler : « Utilise l'outil méthode des tangentes de Regressi. » ;
  - `#derivee` : **créer la grandeur dérivée** : icône **Ajouter**, type de grandeur **« Dérivée »**, nom sans accent ni caractère spécial (`dpHdV`), dérivée de pH par rapport à V, **OK** ; puis onglet **Graphe**, **Coord.**, **Ajouter une courbe** avec `dpHdV` en ordonnée, échelle **à droite** ; repérer l'extrémum avec le **Réticule libre** et lire Veq.
- Une autre manipulation qui n'est pas dans le mode d'emploi : écris-la au mieux et signale-la dans le compte rendu.

## 7. Méthodes du cours (textes à reprendre)

- Titrage : « On détermine la quantité de matière de l'espèce à titrer en la faisant réagir avec une espèce titrante, selon une réaction de titrage qui doit être totale et rapide. » Burette graduée : espèce titrante, concentration connue c<sub>A</sub> ; bécher : espèce titrée, concentration c<sub>B</sub> inconnue, volume V<sub>B</sub> prélevé à la pipette jaugée ; agitation.
- « L'équivalence est le moment exact où toute l'espèce titrée a disparu. On dit aussi que les réactifs ont été introduits dans les proportions stœchiométriques. » « Le volume équivalent est le volume de A versé à l'équivalence : V<sub>eq</sub>. » Relation : n<sub>A</sub> / a = n<sub>B</sub> / b, soit c<sub>A</sub> V<sub>eq</sub> / a = c<sub>B</sub> V<sub>B</sub> / b.
- Titrage pH-métrique : « On mesure le pH en fonction du volume versé. » « À l'équivalence on observe un saut de pH. Le volume équivalent correspond au milieu de ce saut de pH, qui peut être repéré :
  - grâce à la méthode des tangentes : tracer deux tangentes parallèles aux arrondis de la courbe ; tracer une perpendiculaire à ces deux tangentes ; depuis le milieu de cette perpendiculaire, tracer une parallèle aux tangentes. L'intersection de cette droite avec la courbe donne le milieu du saut de pH et le volume équivalent ;
  - en faisant tracer la dérivée par un logiciel : le volume équivalent correspond à l'extrémum de cette dérivée. » (Le cours dit « maximum » pour un pH qui augmente ; ici le pH diminue, c'est un minimum : dis « extrémum ».)

## 8. Données du TP (panneau « Données du TP »)

- Contexte : un déboucheur de canalisations est une solution concentrée d'hydroxyde de sodium (soude : Na⁺ + HO⁻). Solution S : Destop liquide pur. Le Destop gel porte « solution d'hydroxyde de sodium à 20 % », le Destop liquide généralement « à 10 % » ; notre bouteille ne porte pas d'indication.
- Titre massique : t = m<sub>NaOH</sub> / m<sub>solution</sub>. ρ<sub>Destop</sub> = 1,2 kg·L⁻¹. M<sub>NaOH</sub> = 40 g·mol⁻¹.
- Dilution : le dosage se fait sur une solution S₀ diluée 20 fois. Titrage : V<sub>B</sub> = 10,0 mL de S₀ par l'acide chlorhydrique (H₃O⁺ + Cl⁻), c<sub>A</sub> = 0,100 mol·L⁻¹, suivi au pH-mètre.
- Matériel disponible : béchers autant que nécessaire ; fioles jaugées de 50,0 mL et 100,0 mL ; burette graduée ; pipettes jaugées de 5,0 mL et 10,0 mL avec poire à pipeter ; agitateur magnétique ; pH-mètre ; solutions : acide chlorhydrique à 0,100 mol·L⁻¹, solution S.
- Validité d'un résultat (incertitude de type A) : t̄ = (1/n) Σ t<sub>i</sub> ; σ = √[ (1/(n − 1)) Σ (t<sub>i</sub> − t̄)² ] ; u(t) = σ / √n ; la mesure est compatible avec t<sub>ref</sub> si |t̄ − t<sub>ref</sub>| / u(t) ≤ 2.

## 9. Avant de livrer

- Tests Node du modèle `TITRAGE.chimie` (scratchpad) : pH(0) = 12,95, pH(Veq) = 7,00, pH(16 mL) = 1,57 pour c0 = 0,090 mol·L⁻¹ ; courbe conductimétrique en V pour acide fort / base forte, pentes du cours pour acide éthanoïque / soude ; virage du BBT à l'équivalence ; Veq tirés : moyenne ≈ 9,00 mL et écart-type ≈ 0,40 mL sur 10 000 tirages.
- Liste du §10 de la charte (Playwright / Chromium, 1280 px et 390 px tactile émulé ; ne lance pas `playwright install`), plus :
  - **aucune page ne défile à 1280 × 720** (ni à 1366 × 768, 1920 × 1080) ;
  - parcours complet du TP en répondant juste, puis avec des erreurs (diagnostics), puis uniquement avec « Passer cette partie » : chaque page suivante a ses données ;
  - méthode des tangentes et dérivée **à la souris et au doigt** (CDP), sur une courbe à pas de 1 mL et sur une courbe à pas de 0,2 mL ;
  - copie Regressi (contenu exact du texte copié : `V;pH`, puis les mesures avec virgule décimale) ;
  - page d'essai des suivis conductimétrique et colorimétrique (scratchpad) ;
  - typographie : `python3 docs/outils/typo.py --corriger titrage-ph assets/titrage.js` (et les autres fichiers de `assets/` que tu as modifiés), puis `docs/outils/verif-typo.js`.
- Compte rendu court : ce qui est fait ; écarts avec ce prompt et avec les maquettes retenues, et pourquoi ; manipulations Regressi absentes du mode d'emploi ; ce qui n'est pas testable (Safari iOS).

## 10. Plan de travail : maquettes, puis application

### Étape 1 (première session) : maquettes à valider

Avant tout développement de l'application, des **maquettes fonctionnelles** (on s'en sert vraiment, à la souris et au doigt) des parties difficiles, avec **plusieurs choix de design** pour chacune quand c'est possible (2 ou 3 variantes nettement différentes) :

| Maquette | Ce qui varie entre les choix (exemples) |
|---|---|
| **A. Simulateur de titrage** (§4.4), avec le vrai modèle chimique (`TITRAGE.chimie`, §4.2–4.3) : verser 1 / 0,2 / 0,1 mL, tableau, courbe | disposition à l'écran (trois colonnes ; montage + courbe côte à côte et tableau en bandeau ; courbe en grand et montage réduit…) ; style du montage (schéma épuré comme le cours / dessin plus réaliste) ; forme des commandes de volume ; place et taille du tableau |
| **B. Méthode des tangentes** (§4.5) | façon de déplacer les droites (glisser directement / poignée / poignée + boutons fléchés pour le doigt) ; aimantation ou non ; présentation des étapes |
| **C. Courbe dérivée** (§4.5) | même figure avec second axe / deux figures superposées alignées sur V ; façon de pointer l'extrémum |
| **D. Schéma du montage à compléter** et appareil à placer (§5.2) | glisser les étiquettes / toucher l'étiquette puis la zone ; étiquettes autour du schéma / dans une réserve sous le schéma |
| **E. Phrase à construire** (§5.2, et équation §5.3) | morceaux à toucher dans l'ordre / phrase à trous avec un choix par trou |
| **F. Choix du matériel de dilution** (§5.1) | paillasse dessinée / cartes de matériel ; facteur affiché en direct ou non |
| **G. Outil de calcul** : formule à choisir puis valeurs à placer, calcul automatique (§5.6, §5.7) | cartes de formules puis cases / formule et valeurs dans une même ligne ; présentation du tableau des groupes |

- Dossier **`docs/titrage-ph/maquettes/`**, ouvert en `file://`, avec les vraies feuilles de style du dépôt (`assets/theme.css`, etc.) et le thème chimie ; le modèle chimique de la maquette A est déjà celui de `assets/titrage.js` (testé dans Node, §9).
- Chaque maquette respecte déjà les contraintes du §2 : **elle tient dans l'écran à 1280 × 720** (vérifié avec Playwright), marche au doigt et à la souris, à 390 px aussi.
- Une page **`docs/titrage-ph/maquettes/index.html`** présente les maquettes : pour chacune, les variantes, ce qui les distingue, ce qu'il faut essayer, et les **questions posées au professeur** (choix à faire, points à trancher).
- Vérification à 1280 × 720 et à 390 px (tactile émulé) avec Playwright ; commit, push sur `titrage` ; compte rendu avec les chemins. Si l'outil `Artifact` est disponible, publie aussi la page d'index (fichiers joints par `files`) pour que le professeur essaie sur son téléphone.

**Puis arrête-toi** : pas d'application avant la validation des maquettes.

### Étape 2 (session suivante) : l'application

Le professeur indique les variantes retenues et ses remarques. Reproduis-les fidèlement dans l'application (§1 à §9). Les maquettes restent dans `docs/titrage-ph/maquettes/` comme référence.
