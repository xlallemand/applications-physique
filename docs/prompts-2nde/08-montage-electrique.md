Lis `docs/prompts-2nde/00-commun.md`, puis exécute ce prompt.

# 08 · Réaliser un montage électrique (A14)

## 1. Application

- Nom : **« Réaliser un montage électrique »** ; dossier `montage-electrique/` ; préfixe `me`, espace de noms `ME` ; `data-matiere="physique"` ; kicker « Physique · Seconde ».
- Portail : `dom: 'physique'`, `desc: "Du schéma au montage : boucle principale, dipôles en série, puis dérivations, ampèremètre et voltmètre."`
- Dessin d'en-tête : **nouveau dessin `circuit`** dans `assets/hero.js` : schéma normalisé (générateur, résistances, ampèremètre, voltmètre, nœuds) en traits fins, et des fils souples qui le recopient sur une table, des points lumineux qui circulent lentement le long de la boucle.
- Cette application crée deux outils partagés : **`MONTAGE`** (`assets/montage.js`, `assets/montage.css`), réutilisé par `09-lois-electricite.md`, et **`ETAPES`** (`assets/etapes.js`), le moteur « gestes dans l'ordre » réutilisé par `10`, `11` et `12`.

## 2. Objectif et programme

Indispensable I9. Capacités visées :
- « Mesurer une tension et une intensité. »
- Préparation de « Exploiter la loi des mailles et la loi des nœuds dans un circuit électrique comportant au plus deux mailles » (application `09`).
- Rappels du collège : circuit en série, en dérivation, boucle, sens du courant.

## 3. Ce que dit le cours

Sources : `10- Electricite/TP circuit electrique complete.pdf` (2 p.) et `Fiche TP.pdf` (1 p.). Il n'y a pas de cours écrit : la méthode est celle que l'enseignant impose (ci-dessous) et le vocabulaire celui du TP.

**Choix de l'enseignant** : **lampes, interrupteur, DEL et moteur en plus** des résistances et des multimètres, pour voir le circuit fonctionner ; **départ toujours de la borne + du générateur** ; ampèremètre branché sur **COM et 10 A, puis passage en mA** (fiche TP).

- **Méthode imposée, toujours la même** :
  1. repérer sur le schéma la **boucle principale**, celle qui contient le générateur (l'élève la surligne) ;
  2. partir de la **borne + du générateur** et suivre **dans l'ordre** les fils et les dipôles en série, en réalisant le montage au fur et à mesure ;
  3. ajouter ensuite les **dérivations, une par une**, toujours dans l'ordre du schéma.
  Pas de dérivation avant que la boucle principale soit fermée ; un branchement hors de l'ordre est **refusé tout de suite, avec une explication** ; le circuit ne fonctionne (lampes allumées, moteur qui tourne, mesures affichées) que s'il est **conforme au schéma**.
- **TP** : générateur réglé sur **8 V** (sortie réglable, vérifiée en branchant un voltmètre) ; résistances **100 Ω, 390 Ω et 470 Ω** (vérifiées au multimètre en ohmmètre). Schémas du TP (à refaire en SVG) :
  - **série** : G (+ à gauche, − à droite), 390 Ω puis 100 Ω ; trois ampèremètres pour I<sub>1</sub>, I<sub>2</sub>, I<sub>3</sub> (avant, entre et après les résistances) ; puis trois voltmètres pour U<sub>G</sub>, U<sub>390</sub>, U<sub>100</sub> ; résultats notés : « I<sub>1</sub> = I<sub>2</sub> = I<sub>3</sub> = 0,017 A », « U<sub>100</sub> + U<sub>390</sub> = U<sub>G</sub> » ;
  - **dérivation** : 390 Ω et 100 Ω en dérivation sur G ; ampèremètres I<sub>1</sub> (branche principale), I<sub>2</sub> (390 Ω), I<sub>3</sub> (100 Ω) ; « I<sub>1</sub> = I<sub>2</sub> + I<sub>3</sub> » ; voltmètres : « U<sub>G</sub> = U<sub>390</sub> = U<sub>100</sub> » ;
  - **loi d'Ohm** : G, ampèremètre en série, 470 Ω, voltmètre en dérivation sur la résistance ; « mesurer U et I en faisant varier la tension de −8 V à +8 V ».
  - Sur les schémas : intensités nommées I<sub>1</sub>, I<sub>2</sub>, I<sub>3</sub> avec une flèche sur le fil ; tensions nommées U<sub>G</sub>, U<sub>390</sub>, U<sub>100</sub>, U avec une flèche à côté du dipôle.
- **Fiche TP (multimètre)** : « Choisir la fonction (ohmmètre, voltmètre ou ampèremètre) ; régler sur le plus grand des calibres disponibles ; choisir la nature du courant : continu (zone ⎓) ou alternatif (∼). » Bornes du multimètre (Jeulin CL3005) : **10A**, **mA**, **COM**, **VΩ**.
  - « **L'ampèremètre se branche en série.** On règle le calibre sur 10 A (continu), et on branche les entrées **COM et 10A**. Si nécessaire, on change l'entrée 10A pour l'entrée **mA** en diminuant le calibre. » « Pour mesurer l'intensité du courant I circulant de A vers B dans le dipôle AB, on débranche le fil de la borne A du dipôle pour le placer sur l'entrée 10 A ou mA du multimètre, puis on relie avec un autre fil la borne COM à la borne A du dipôle. » « L'indication est positive lorsque le courant **sort** de l'ampèremètre par la borne COM ; elle est négative si le courant entre par la borne COM. »
  - « **Le voltmètre se branche en dérivation.** Pour mesurer la tension U<sub>AB</sub> entre A et B, sans modifier le circuit, on relie le point A à la borne V et B à la borne COM. » « Il indique une tension positive si sa borne COM est reliée vers la borne négative du générateur. »
  - « L'ohmmètre se branche sur le conducteur ohmique seul, hors du circuit. »
- **Ne pas faire référence aux numéros d'exercices, aux TP, au cours**. L'application est indépendante des sources.

## 4. Plan de l'application (`PLAN`)

### Module 1 : Lire le schéma (manipulation guidée, `module_1_manip.html`)

- 6 schémas de difficulté croissante (série simple ; série avec interrupteur et ampèremètre ; une dérivation ; deux dérivations ; schémas du TP série et dérivation).
- L'élève **surligne la boucle principale** en touchant ses fils et ses dipôles (chaque élément touché s'épaissit en `--accent` ; toucher à nouveau l'enlève), puis « Vérifier ». Toute boucle fermée qui contient le générateur est acceptée ; s'il y en a plusieurs, l'application garde celle qu'il a choisie pour la suite.
- Puis il **touche les nœuds** (points où le courant se partage) et les **dérivations** (branches hors de la boucle principale).
- Erreurs à diagnostiquer :
  - **boucle sans le générateur** : « La boucle principale contient le générateur : c'est lui qui fait circuler le courant. » ;
  - **chemin non fermé** : « Ta boucle s'arrête en … : suis les fils jusqu'à revenir au générateur. » ;
  - **dérivation prise dans la boucle** (boucle qui passe par deux branches en dérivation à la fois) : « Ta boucle passe deux fois par le nœud … : une boucle ne prend qu'une des branches. » ;
  - point de croisement de deux fils sans point noir pris pour un nœud (schémas où des fils se croisent sans se toucher).

### Module 2 : Montage en série (manipulation guidée, `module_2_manip.html`)

- Écran : **table de montage** réaliste et **schéma normalisé** côte à côte (≥ 900 px), l'un sous l'autre sur téléphone (schéma au-dessus, réduit et toujours visible en haut pendant le montage : bandeau collant de la hauteur du schéma).
- Situations (progression de l'enseignant) :
  1. générateur et une lampe ;
  2. générateur, interrupteur et deux lampes ;
  3. générateur, interrupteur, lampe, moteur et **ampèremètre** (COM et 10 A, puis passage en mA) ;
  4. générateur, **DEL** et résistance de protection (sens de la DEL) ;
  5. montage série du TP (8 V ; 390 Ω ; 100 Ω ; un ampèremètre placé en I<sub>1</sub>, puis déplacé en I<sub>2</sub> et en I<sub>3</sub>).
- Déroulé de chaque situation : 1. surligner la boucle principale sur le schéma (comme au module 1) ; 2. tirer les fils **à partir de la borne + du générateur**, d'une borne à l'autre, dans l'ordre de la boucle ; chaque fil accepté et chaque dipôle branché **se colorent sur le schéma** ; 3. fermer la boucle sur la borne − ; 4. fermer l'interrupteur, régler le générateur, lire les mesures.
- **Ampèremètre** : le multimètre a un sélecteur (fonctions et calibres) et ses quatre bornes ; l'élève choisit « A ⎓ », calibre 10 A, branche **10A** et **COM** ; lecture peu précise (« 0,02 ») ; puis il passe le fil de 10A à mA et le calibre à 200 mA : lecture « 16,3 ». Si le courant entre par COM : indication négative et la phrase de la fiche TP.
- Refus expliqués (le fil n'est pas posé) :
  - départ ailleurs que de la borne + : « On part toujours de la borne + du générateur. » ;
  - borne qui n'est pas la suivante dans la boucle : « D'après le schéma, après la lampe vient l'interrupteur : relie la borne libre de la lampe à l'interrupteur. » ;
  - ampèremètre branché sur VΩ, ou sur mA d'emblée : « On commence par l'entrée 10A, le plus grand calibre ; on passe à mA ensuite si l'intensité est petite. » ;
  - ampèremètre en dérivation (deux fils sur les bornes d'un même dipôle) : « L'ampèremètre se branche en série : le courant doit le traverser. » ;
  - deux fils sur une même borne d'un dipôle alors que le schéma n'a pas de nœud à cet endroit.
- **Fonctionnement** : seulement quand la boucle est fermée et conforme : lampes allumées (halo), moteur qui tourne (sens selon la polarité), DEL allumée **seulement dans le sens passant** (sinon éteinte et la question « Pourquoi la DEL ne s'éclaire-t-elle pas ? » avec la réponse : elle ne laisse passer le courant que dans un sens) ; interrupteur ouvert : rien ne fonctionne.

### Module 3 : Ajouter des dérivations (manipulation guidée, `module_3_manip.html`)

- Situations : 1. deux lampes en dérivation ; 2. lampe et moteur en dérivation avec interrupteur dans la branche principale ; 3. dérivation du TP (390 Ω et 100 Ω) avec les trois ampèremètres I<sub>1</sub>, I<sub>2</sub>, I<sub>3</sub> ; 4. **voltmètres** : U<sub>G</sub>, U<sub>390</sub> et U<sub>100</sub> sur le montage série du TP (chaque voltmètre est une dérivation, ajoutée après la boucle) ; 5. montage de la loi d'Ohm (470 Ω, ampèremètre en série, voltmètre en dérivation).
- Même déroulé : boucle principale d'abord (fermée), puis chaque dérivation, une par une, **dans l'ordre du schéma** (de la plus proche du générateur à la plus éloignée, en partant du nœud le plus proche de la borne +).
- **Voltmètre** : fonction « V ⎓ », bornes **V** et **COM**, COM du côté de la borne − du générateur pour une indication positive (sinon : indication négative et la phrase de la fiche).
- Refus expliqués :
  - dérivation commencée avant la fermeture de la boucle : « Ferme d'abord la boucle principale ; on ajoute les dérivations ensuite. » ;
  - dérivation dans le désordre : « D'après le schéma, la première dérivation part du nœud … » ;
  - voltmètre en série (il couperait la boucle) : « Le voltmètre se branche en dérivation, sur les bornes du dipôle, sans modifier le circuit. »
- Fonctionnement et mesures comme au module 2 ; les nœuds du schéma s'allument quand la dérivation correspondante est branchée.

### Module 4 : Montages de mesure (série notée sur 20, `module_4_questions.html`)

- 10 montages tirés parmi : les schémas du TP (série avec I<sub>1</sub>, I<sub>2</sub>, I<sub>3</sub> ; série avec U<sub>G</sub>, U<sub>390</sub>, U<sub>100</sub> ; dérivation avec ampèremètres ; dérivation avec voltmètres ; loi d'Ohm) et des circuits à lampes, interrupteur, DEL et moteur (une ou deux dérivations).
- Chaque question : surligner la boucle principale, réaliser le montage, puis lire une mesure (champ : valeur avec unité).
- **Note** : 2 points sans branchement refusé ; 1 point avec un ou deux refus ; 0 si l'élève a demandé « Afficher le montage » (le montage se fait alors seul, fil par fil, au ralenti).

## 5. Rendu

- **Table de montage** dessinée de façon réaliste en SVG, vue de dessus, comme en salle de TP : générateur d'alimentation (écran avec la tension, bouton de réglage, bornes + et −), résistances sur leur plaquette avec la valeur imprimée (100 Ω, 390 Ω, 470 Ω), lampes sur support, interrupteur à levier, DEL sur support (+ marqué), moteur avec hélice, multimètres (écran, sélecteur rotatif, bornes 10A, mA, COM, VΩ), fils souples (courbes de Bézier) tirés d'une borne à l'autre.
- Couleurs : **pas de rouge pour la borne +** (le rouge est réservé au faux) : bornes avec le signe écrit, + cerclée `--accent`, − cerclée `--ink`. Fils en `--ink-2`, fil en cours de tracé en `--accent`. Lampe allumée : halo `--cle-bg`.
- **Schéma normalisé** synchronisé : symboles normalisés (générateur cercle et + / −, résistance rectangle, lampe cercle avec croix, interrupteur, DEL triangle et barre avec flèches, moteur cercle M, ampèremètre cercle A, voltmètre cercle V), nœuds en points noirs, intensités et tensions nommées ; élément branché coloré `--accent`, boucle surlignée en accent épais semi-transparent.
- Bornes : cibles de 44 px ; le fil se tire au doigt depuis une borne (poignée) jusqu'à une autre, ou par deux appuis (borne de départ, puis borne d'arrivée) ; un fil posé se retire en le touchant puis « Retirer ce fil ».
- 1280 px : table à gauche (≈ 60 %), schéma à droite ; 390 px : schéma en haut (collant), table dessous, à l'échelle de la largeur.

## 6. Outils

- **À créer : `ETAPES`** (`assets/etapes.js`) : moteur de gestes à faire dans l'ordre, sans dessin : `ETAPES.creer({ etapes: [{ id, accepte(geste), refus(geste) → message ou null }], ordreStrict: true, onAvance(etape), onRefus(message), onFin() })` → `{ proposer(geste), courante(), faites(), refus: n, recommencer() }`. Écrit pour servir aussi aux gestes de laboratoire (`10`, `11`, `12`).
- **À créer : `MONTAGE`** (`assets/montage.js`, `assets/montage.css`), plusieurs exemplaires par page :
  - description d'un circuit : `{ dipoles: [{ id, type: 'generateur' | 'resistance' | 'lampe' | 'interrupteur' | 'del' | 'moteur' | 'amperemetre' | 'voltmetre', valeur, nom }], fils: [[borne, borne]], boucle: [...], derivations: [[...], …], noeuds, intensites: [{ nom, fil, sens }], tensions: [{ nom, dipole }] }` ;
  - `MONTAGE.schema(zone, circuit, options)` (schéma normalisé, surlignage, éléments colorés, flèches de tension et d'intensité nommées) ; `MONTAGE.table(zone, circuit, options)` (table réaliste, fils à tirer, multimètres à régler) ; `MONTAGE.monter(zone, circuit, { modes, onFin })` qui relie les deux avec `ETAPES` ;
  - **calcul** des intensités et des tensions (générateur idéal réglable, résistances, lampes et moteur modélisés par des résistances, DEL à seuil de 2 V passante dans un sens, interrupteur), circuits à **deux mailles au plus** ; affichage des multimètres selon la fonction, le calibre (résolution) et le sens.
  - Pensé pour `09-lois-electricite.md` : flèches de tension avec leur nom (U<sub>G</sub>, U<sub>390</sub>), mesures relevées dans un tableau, capteurs résistifs (thermistance, photorésistance) ajoutables comme dipôles.
- `BULLE` pour les rappels (« L'ampèremètre se branche en série », « Le voltmètre se branche en dérivation »).

## 7. Vérifications propres

- Script : série 8 V, 390 Ω + 100 Ω : I = 16,3 mA (le TP mesure 0,017 A), U<sub>390</sub> = 6,37 V, U<sub>100</sub> = 1,63 V ; dérivation : I<sub>2</sub> = 20,5 mA, I<sub>3</sub> = 80,0 mA, I<sub>1</sub> = 100,5 mA ; loi d'Ohm 470 Ω : I = U / 470 (8 V → 17,0 mA) ; affichages au calibre 10 A (résolution 0,01 A) puis mA (0,1 mA).
- Chaque refus du module 2 et du module 3 se déclenche sur un geste forcé, et le fil n'est pas posé.
- Circuit non conforme (dipôle oublié, voltmètre en série, DEL à l'envers) : rien ne fonctionne ou la DEL reste éteinte, avec l'explication.
- Tirer un fil à la souris, au doigt (CDP) et en deux appuis ; retirer un fil.
- À 390 px : le schéma reste visible pendant tout le montage, la table entière tient dans la largeur.


## 8. Plan de travail

- commencer par une maquette avec uniquement le design pour le valider. S'il y a plusierus choix possible, les proposer.
- une fois le design des outils validé, développer

## 9. Hors périmètre

- Pas de lois des nœuds et des mailles, pas de caractéristique ni de capteur (application `09`).
- Pas de courant alternatif, pas de court-circuit spectaculaire (un court-circuit est simplement refusé : « Ce fil relierait directement les bornes du générateur. »).
- Pas de résistance équivalente ni de calcul de puissance.
