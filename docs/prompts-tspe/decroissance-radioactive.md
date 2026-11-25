# Désintégration radioactive : mise à jour (prompt de génération d'une application annexe)

Lis d'abord `docs/prompts-tspe/00-commun.md` (branche, charte, simulations §5, livraison).

## Pourquoi

Consigne du professeur (chapitre « Transformations nucléaires ») : faire un **simulateur de désintégration radioactive**, **le même que l'application `decroissance-radioactive/`**, en le **mettant à jour avec les contraintes des simulateurs** (une seule page, plein écran, manipulation libre, situations avec questions). Décision du professeur : l'application existante est **réécrite sur place** (même dossier, même adresse : `radioactivite/` (STI2D) y renvoie déjà) ; le chapitre « Transformations nucléaires » l'intègre par une **page externe ↗**.

## L'existant

`decroissance-radioactive/index.html` (une seule page, 806 lignes) : « Simulation stochastique de la loi de décroissance radioactive. À chaque itération (= 1 seconde), chaque noyau a une probabilité λ de se désintégrer » ; grille de noyaux (non désintégrés / désintégrés), compteurs (itération, restants, désintégrés), graphique N(t) avec la courbe N<sub>0</sub>e<sup>−λt</sup>, boutons « Itération suivante », « Terminer toutes les itérations », « Réinitialiser ». **Hors charte** : il charge **Chart.js depuis un CDN** (interdit : pas de bibliothèque externe, fonctionnement hors ligne en `file://`), styles propres, pas de `SOM`, pas de plein écran commun.

Lis-le en entier avant de commencer : garde tout ce qu'il fait (réglages, grille, itérations, comparaison à la loi), puis réécris-le.

## Application

- Même dossier `decroissance-radioactive/`, nom « Désintégration radioactive », `data-matiere="physique"`, préfixe `dr`, espace de noms `DR`.
- **Un seul écran** (`00-commun.md` §5), comme `double-periodicite/` : `SOM.init({ nom, id: 'decroissance-radioactive', plan: [] }); SOM.menu('accueil');`, bouton plein écran commun (`PLEIN.bouton()`), enregistrement de l'ouverture (état de la page externe ↗, `outils-communs.md` §2).
- Portail : `niv: ['spe', 'sti']` (elle sert aux deux), `desc: "Simulateur : désintégrations noyau par noyau, caractère aléatoire, N(t) = N₀e^(−λt), demi-vie, activité."` ; `mots` : désintégration, radioactivité, aléatoire, probabilité, noyau, demi-vie, constante radioactive, λ, exponentielle, activité, becquerel, dés, loi de décroissance…
- **Graphique en SVG** (repère et courbes comme dans `lecture-graphique/` ou `cinematique/` : classes de la charte), **sans Chart.js**.

## Ce que le simulateur doit faire

- **Figure** (gauche) : la grille de noyaux (N<sub>0</sub> réglable : 100, 200, 400, 1000 ; au-delà, une grille agrégée), les noyaux qui se désintègrent clignotent puis changent d'aspect (père → fils, avec le symbole des noyaux d'un exemple réel en option : <sup>14</sup>C → <sup>14</sup>N) ; le graphique N(t) en dessous ou à côté (selon la place, `00-commun.md` §5).
- **Réglages** (panneau, à tout moment) : N<sub>0</sub>, λ (probabilité par unité de temps : 1/6 comme un dé du TP, 0,1, 0,2, 0,5…), ou t<sub>1/2</sub> (lié à λ par t<sub>1/2</sub> = ln 2 / λ, l'un se règle, l'autre se calcule) ; mode **« dés »** (chaque noyau est un dé : il se désintègre quand il tombe sur la face colorée, analogie du professeur) ; Itération suivante, Lecture / Pause (itérations automatiques), vitesse, Terminer, Recommencer, « Nouveau tirage » (même réglage, autre hasard).
- **Graphique** : points expérimentaux N(t) ; courbe théorique N<sub>0</sub>e<sup>−λt</sup> affichable ; **activité** A = nombre de désintégrations par itération (histogramme) et λN affichables ; **outils de lecture** : t<sub>1/2</sub> (moitié de N<sub>0</sub> reportée sur la courbe), N<sub>0</sub>/2<sup>n</sup> après n demi-vies ; modélisation exponentielle (ajustement de λ par les moindres carrés sur ln N, affiché comme un tableur ou Regressi).
- **Plusieurs tirages superposés** (option) : l'élève voit que chaque tirage est différent (aléatoire) mais que la moyenne suit la loi, d'autant mieux que N<sub>0</sub> est grand.
- **Défis « À essayer »** (dans n'importe quel ordre, cochés tout seuls) : constater que le nombre de désintégrations par itération est proportionnel au nombre de noyaux restants (A = λN) ; lire t<sub>1/2</sub> et le comparer à ln 2 / λ ; constater que la demi-vie ne dépend pas de N<sub>0</sub> ; constater qu'on ne peut pas prévoir quel noyau se désintègre (deux tirages) ; montrer qu'avec N<sub>0</sub> grand l'écart à la loi diminue ; après 10 demi-vies, il ne reste presque rien.
- **Questions** dans le panneau (QCM, valeur à lire).
- Textes valables pour la Terminale spécialité et la STI2D (rien qui suppose l'un des deux cours) ; l'équation différentielle dN/dt + λN = 0 est dans une bulle ⓘ (utile en spécialité, sans être exigée en STI2D).

## Après la réécriture

- `radioactivite/modules/module_4a_cours.html` renvoie déjà à `decroissance-radioactive/index.html` : vérifie que le lien marche. Dans le `PLAN` de `radioactivite/`, propose (dans le compte rendu, sans le faire) d'en faire une page ↗.
- Portail : mets à jour `niv`, `desc`, `mots` ; `AVANCEMENT` (application sans plan : rien ou l'ouverture, comme `double-periodicite/`) ; index de recherche.

## Vérifications propres

- Aucune ressource extérieure (`grep -n "http" decroissance-radioactive/index.html` ne trouve que des liens éventuels de cours) ; fonctionne hors ligne en `file://`.
- Un écran à 1280 × 720 / 650 et 390 × 844 ; défis dans le désordre ; reduced-motion (pas d'itérations automatiques, bouton seulement).
- Statistique : sur 50 tirages de N<sub>0</sub> = 1000, la moyenne de N(t<sub>1/2</sub>) est proche de 500 (test automatique dans le scratchpad).
- Mets à jour `00-commun.md` §10 (ligne `decroissance-radioactive.md`).
