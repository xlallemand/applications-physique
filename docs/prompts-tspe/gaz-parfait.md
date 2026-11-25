# Gaz parfait : PV = nRT (prompt de génération d'une application annexe)

Lis d'abord `docs/prompts-tspe/00-commun.md` (branche, charte, simulations §5, livraison).

## Pourquoi

Consigne du professeur (chapitre « Thermodynamique ») : **développer une autre application qui est un simulateur pour voir comment évoluent les grandeurs dans PV = nRT**, avec un **lien depuis le cours** vers ce simulateur (page externe ↗ du chapitre).

## Application

- Dossier `gaz-parfait/`, nom « Gaz parfait : PV = nRT », `data-matiere="physique"`, préfixe `gp`, espace de noms `GP`.
- **Un seul écran** (comme `double-periodicite/`) : `SOM.init({ nom, id: 'gaz-parfait', plan: [] }); SOM.menu('accueil');`, bouton plein écran commun, enregistrement de l'ouverture (état de la page externe ↗, `outils-communs.md` §2).
- Portail : `dom: 'physique'`, `niv: ['spe']`, `desc: "Simulateur : pression, volume, quantité de matière et température d'un gaz, du microscopique au macroscopique."` ; `mots` : gaz parfait, équation d'état, pression, pascal, bar, volume, m³, température, kelvin, zéro absolu, quantité de matière, constante des gaz parfaits, R, agitation thermique, chocs, Boyle-Mariotte, Gay-Lussac, Charles, volume molaire, Avogadro…
- Outils : `LG` (graphiques), `EQ` (isoler une grandeur dans PV = nRT, en option), `BULLE`, `PLEIN`.
- Inspiration (ne pas copier, ne pas lier) : la simulation PhET « Gas Properties » citée par le cours (`17- Thermodynamique/Chap17-Cours_Thermodynamique_complete.pdf`, page 2, questions « Que se passe-t-il si on augmente la température ? si on double la température ? la quantité de gaz ? si on agrandit l'enceinte ? si on double le volume ? »).

## Ce que dit le cours (résumé utile au simulateur)

- Un gaz : entités libres de se déplacer, mouvement désordonné. Deux échelles : **macroscopique** (pression P en Pa, 1 bar = 10<sup>5</sup> Pa ; température T en K, T = θ + 273,15, zéro absolu 0 K = −273,15 °C ; masse volumique ρ = m/V en kg·m<sup>−3</sup>) et **microscopique** (chocs des particules sur la paroi ; agitation des particules ; zéro absolu : plus aucune agitation ; masse d'une particule et nombre de particules par unité de volume). Ces grandeurs sont interdépendantes.
- **Gaz parfait** : particules ponctuelles, sans interaction entre elles (seulement des chocs ; interactions électromagnétiques et poids négligés).
- **PV = nRT** (P en Pa, V en m³, n en mol, R = 8,31 J·K<sup>−1</sup>·mol<sup>−1</sup>, T en K).
- **Limites** : pression et masse volumique pas trop élevées (1 bar : peu élevée).
- **Avogadro-Ampère** : même volume molaire pour tous les gaz dans les mêmes conditions ; V<sub>m</sub> à 20 °C et 1 bar : RT/P ≈ 24,4 L·mol<sup>−1</sup>.
- **Masse volumique d'un gaz parfait** ρ = PM/(RT) (à savoir refaire) ; air (M ≈ 29 g·mol<sup>−1</sup>) : ρ ≈ 1,2 kg·m<sup>−3</sup> ; montgolfière (air chaud moins dense).

## Écran (un seul, `00-commun.md` §5)

- **Figure** (gauche) : une **enceinte** (cylindre avec piston mobile, ou boîte dont on tire la paroi) remplie de particules qui s'agitent (vitesse moyenne liée à T, nombre lié à n) ; les **chocs sur la paroi** s'allument (la fréquence et la violence des chocs font la pression) ; un **manomètre** et un **thermomètre** (°C et K) ; un réchaud / refroidisseur sous l'enceinte ; une pompe pour ajouter ou retirer du gaz ; option « afficher les vitesses ».
- **Réglages** (panneau, à tout moment) : **choisir la grandeur maintenue constante** (V, P, T ou n, comme dans PhET) ; régler les autres (curseurs, glisser le piston, chauffer, pomper) ; **PV = nRT affiché en continu avec les valeurs** et les unités, et PV/(nT) = R qui reste constant (vérification) ; graphiques dans un onglet : P = f(V) à T constante (hyperbole ; P = f(1/V) droite), P = f(T) à V constante (droite passant par 0 K : extrapolation au zéro absolu), V = f(T) à P constante, avec les points relevés au fur et à mesure.
- **Échelle microscopique** reliée en permanence : « T ↗ → agitation ↗ → chocs plus violents et plus fréquents → P ↗ » (phrases courtes qui s'affichent selon le geste).
- **Gaz réel / limites** : à haute pression ou forte masse volumique, un indicateur montre que les particules ne sont plus « ponctuelles » (taille visible, interactions) et que PV/(nT) s'écarte de R (modèle simple, signalé « illustration »).
- **Défis « À essayer »** (questions du cours devenues défis, dans n'importe quel ordre, cochés tout seuls) : doubler T (en K !) à V constant → P double ; doubler V à T constante → P divisée par 2 ; doubler n → P double ; agrandir l'enceinte ; chauffer de 20 °C à 40 °C : P ne double pas (diagnostic : « la température doit être en kelvins : 293 K → 313 K ») ; trouver le volume molaire à 20 °C et 1 bar ; trouver le zéro absolu par extrapolation ; montgolfière : comparer la masse volumique de l'air froid et chaud.
- **Questions** dans le panneau (QCM, valeur à calculer avec l'icône calculatrice, conversions bar → Pa, L → m³, °C → K) et bilan « ✍ Complète ton cours ».

## Vérifications propres

- Un écran à 1280 × 720 / 650 et 390 × 844 dans chaque onglet ; défis dans le désordre ; reduced-motion (particules figées, mise à jour au geste).
- Script : PV = nRT vérifiée pour chaque état affiché (unités SI), V<sub>m</sub> = 24,4 L·mol<sup>−1</sup>, ρ<sub>air</sub> ≈ 1,2 kg·m<sup>−3</sup>.
- Mets à jour `00-commun.md` §10 (ligne `gaz-parfait.md`).
