/* ============================================================
   Exercices du module 5 (application « Chapitre 2 : Piles et
   accumulateurs ») : les exercices 7, 10, 11 et 14 du manuel
   (p. 40-41), avec la même numérotation, puis l'activité 2 p. 37.

   Chaque exercice : { id, groupe, titre, desc, contexte (HTML),
   parties: [p] } ; chaque partie suit le format de PA2.PARTIES avec
   p.q (question) et p.correction (correction détaillée : formule,
   grandeur isolée, application numérique avec les unités).

   Écarts avec la correction manuscrite (voir le prompt du chapitre) :
     ex. 14 e) : les énergies massiques s'écrivent E_m (et non « E_V ») ;
     activité 2, 3) : Li-ion 150 - 250 Wh·kg⁻¹ (le manuel indique
       1 500 - 2 500, coquille d'un facteur 10) : m = 20 kg (et non 2 kg).
   ============================================================ */
(function () {
  'use strict';

  const { o, fmt, fr, sci, proche, batterie, partieTableau, tableauTechnos, NOTE_LIION } = window.PA2;
  const calc = h => `<p class="ph-calc">${h}</p>`;
  const c = h => `<span class="c">${h}</span>`;
  // fabriques de parties
  const choix = (q, options, bonne, correction, opts) => Object.assign({ type: 'choix', q, options, bonne, correction, colonne: options.some(x => x.label.replace(/<[^>]+>/g, '').length > 24) }, opts);
  const nombre = (q, label, valeur, unite, correction, opts) => Object.assign({ type: 'nombre', q, label, valeur, unite, correction, signe: false }, opts);
  const scient = (q, label, valeur, unite, correction, opts) => Object.assign({ type: 'sci', q, label, valeur, unite, correction, cs: 3, rel: .01 }, opts);
  const dE = (v, U, Q, Qbrut) => (Qbrut != null && proche(v, U * Qbrut, .02)) ? 'Convertis la capacité en Ah avant de multiplier (1 Ah = 1 000 mAh).' : proche(v, U * Q * 3600, .02) ? 'Avec Q en Ah, E = Q × U est en Wh (pas en J).' : 'E = Q × U, avec Q en Ah et U en V.';

  // tableau des courants du camping-car (exercice 14)
  const COURANTS = [['Chauffage', 1.3], ['Frigo', 0.6], ['Pompe à eau', 1.5], ['Téléviseur', 3.9], ['Éclairage', 3.8], ['Alarme gaz', 0.085]];
  const TAB14 = `<div class="ph-defile"><table class="ph-tableau"><tr><th>Éléments</th><th>Courant (A)</th></tr>
    ${COURANTS.map(([n, i]) => `<tr><td>${n}</td><td>${fmt(i)}</td></tr>`).join('')}</table></div>`;
  const I14 = COURANTS.reduce((s, x) => s + x[1], 0);                         // 11,185 A ≈ 11,2 A
  const V1 = .330 * .171 * .2355, V2 = .513 * .189 * .223;                      // ≈ 0,0133 et 0,0216 m³

  const GROUPES_EX = [
    { id: 'energie', titre: 'Énergie disponible (p. 40-41) : exercices 7, 10 et 11' },
    { id: 'synthese', titre: 'Synthèse (p. 41) : exercice 14' },
    { id: 'activite', titre: 'Activité 2 p. 37 : les accumulateurs' },
  ];

  const EXERCICES = [

    /* ============================ EXERCICE 7 ============================ */
    { id: '7', groupe: 'energie', titre: 'Exercice 7 p. 40 : énergie disponible', desc: 'Trois piles et accumulateurs : E = Q × U.',
      contexte: `<p class="er-contexte">Calculer l'énergie maximale, en Wh, stockée dans ces piles et accumulateurs :</p>
        <ul class="pa2-donnees"><li>a) pile bouton oxyde d'argent : capacité 105 mAh et tension nominale 1,55 V ;</li><li>b) pile alcaline : capacité 2 400 mAh et tension nominale 1,5 V ;</li><li>c) accumulateur lithium-polymère : capacité 0,9 Ah et tension nominale 7,4 V.</li></ul>`,
      parties: [
        choix('Quelle relation donne l\'énergie disponible ?', [o('ok', 'E = Q × U (Q en Ah, U en V : E en Wh)'), o('a', 'E = Q / U'), o('b', 'E = Q × I')], 'ok', '<p>E = Q × U ; avec Q en Ah et U en V, E est en Wh.</p>',
          { melanger: false, indices: { a: 'Vérifie les unités : Ah / V ne donne pas des Wh.', b: 'L\'énergie fait intervenir la tension.' } }),
        nombre('a) Convertis la capacité de la pile bouton en Ah.', 'Q =', .105, 'Ah', calc(`Q = 105 mAh = ${c('0,105 Ah')}`), { diag: v => proche(v, 105000) ? 'On divise par 1 000.' : '1 Ah = 1 000 mAh.' }),
        nombre('a) Calcule l\'énergie disponible (3 chiffres significatifs).', 'E =', .105 * 1.55, 'Wh', calc(`E = Q × U = 0,105 Ah × 1,55 V ≈ ${c('0,163 Wh')}`), { rel: .01, affiche: '0,163', diag: v => dE(v, 1.55, .105, 105) }),
        nombre('b) Calcule l\'énergie disponible dans la pile alcaline.', 'E =', 2.4 * 1.5, 'Wh', calc(`Q = 2 400 mAh = 2,400 Ah<br>E = Q × U = 2,400 Ah × 1,5 V = ${c('3,6 Wh')}`), { rel: .01, diag: v => dE(v, 1.5, 2.4, 2400) }),
        nombre('c) Calcule l\'énergie disponible dans l\'accumulateur (2 chiffres significatifs).', 'E =', .9 * 7.4, 'Wh', calc(`E = Q × U = 0,9 Ah × 7,4 V = 6,66 ≈ ${c('6,7 Wh')} (7 Wh si on ne garde qu'un chiffre significatif)`), { rel: .015, affiche: '6,7', diag: v => dE(v, 7.4, .9) }),
      ] },

    /* ============================ EXERCICE 10 ============================ */
    { id: '10', groupe: 'energie', titre: 'Exercice 10 p. 40 : batterie au plomb', desc: '80 Ah – 12 V : énergie et nombre de cellules.',
      contexte: `<p class="er-contexte">a) Calculer l'énergie disponible pour une batterie comme celle ci-dessous.<br>b) Une batterie au plomb est composée de plusieurs cellules ayant une tension nominale d'environ 2 V. De combien de cellules cette batterie est-elle composée ?</p>
        ${batterie({ lignes: ['80 Ah · 12 V'], aria: 'Batterie au plomb marquée 80 Ah et 12 V' })}`,
      parties: [
        { type: 'gabarit', q: 'a) Lis la capacité et la tension sur l\'étiquette de la batterie.', label: 'Q =', morceaux: [{ v: 80, aria: 'Capacité en Ah' }, 'Ah ; U =', { v: 12, aria: 'Tension en V' }, 'V'],
          diag: ([q, u]) => proche(q, 12) && proche(u, 80) ? 'Tu as inversé : la capacité est en Ah, la tension en V.' : 'Lis les nombres suivis de « Ah » et de « V ».', correction: '<p>Q = 80 Ah ; U = 12 V.</p>' },
        nombre('a) Calcule l\'énergie disponible.', 'E =', 960, 'Wh', calc(`E = Q × U = 80 Ah × 12 V = ${c('960 Wh')}`), { diag: v => dE(v, 12, 80) }),
        nombre('b) De combien de cellules de 2 V cette batterie est-elle composée ?', 'n =', 6, 'cellules', calc(`En série, les tensions s'additionnent : n = ${fr('12 V', '2 V')} = ${c('6 cellules')}`), { tol: .01, diag: v => proche(v, 24) ? 'On divise : n = 12 / 2.' : 'n = U<sub>batterie</sub> / U<sub>cellule</sub>.' }),
      ] },

    /* ============================ EXERCICE 11 ============================ */
    { id: '11', groupe: 'energie', titre: 'Exercice 11 p. 41 : batterie lithium-ion', desc: 'Compter les cellules, tension d\'une cellule, énergie.',
      contexte: `<p class="er-contexte">Voici une batterie lithium-ion, vue de dessus : on voit ses cellules reliées en série.</p>
        ${batterie({ lignes: ['Li-ion', '40 V · 40 Ah'], cellules: 11, aria: 'Batterie Li-ion marquée 40 V et 40 Ah, avec 11 cellules visibles reliées en série' })}`,
      parties: [
        nombre('a) Quelle est la tension nominale de cette batterie ?', 'U =', 40, 'V', '<p>Tension nominale : U = 40 V (lue sur l\'étiquette).</p>', { diag: () => 'Lis le nombre suivi de « V » sur l\'étiquette.' }),
        nombre('b) De combien de cellules est-elle composée ? Compte-les sur le dessin.', 'n =', 11, 'cellules', '<p>On compte 11 cellules.</p>', { tol: .01, diag: v => v < 11 ? 'Compte de nouveau, de gauche à droite : il y en a plus.' : 'Compte de nouveau : il y en a moins.' }),
        nombre('c) Que vaut la tension nominale de chacune des cellules (2 chiffres significatifs) ?', 'U<sub>cellule</sub> =', 40 / 11, 'V', calc(`Les cellules sont en série : U<sub>cellule</sub> = ${fr('40 V', '11')} ≈ ${c('3,6 V')}`), { rel: .02, affiche: '3,6', diag: v => proche(v, 440) ? 'En série, les tensions s\'additionnent : on divise 40 V par le nombre de cellules.' : 'U<sub>cellule</sub> = U / n.' }),
        nombre('d) Calcule l\'énergie disponible.', 'E =', 1600, 'Wh', calc(`E = Q × U = 40 Ah × 40 V = ${c('1 600 Wh')}`), { diag: v => dE(v, 40, 40) }),
      ] },

    /* ============================ EXERCICE 14 ============================ */
    { id: '14', groupe: 'synthese', titre: 'Exercice 14 p. 41 : batterie pour camping-car', desc: 'Intensité totale, énergie, volume, énergies volumique et massique, autonomie.',
      contexte: `<p class="er-contexte">La consommation d'un camping-car à l'arrêt correspond à l'utilisation de différents appareils :</p>${TAB14}
        <p class="er-contexte" style="margin-top:8px">Caractéristiques de deux batteries pour camping-car :</p>
        <ul class="pa2-donnees"><li><b>Batterie 1</b> : 12 V – 80 Ah – 330 × 171 × 235,5 mm – 32,6 kg ;</li><li><b>Batterie 2</b> : 12 V – 120 Ah – 513 × 189 × 223 mm – 41,7 kg.</li></ul>
        <p class="er-contexte" style="margin-top:8px">Le but est de déterminer quelle batterie est la plus adaptée à l'utilisation du camping-car pendant une journée.</p>`,
      parties: [
        nombre('a) Quel est le courant maximum I consommé si tous les équipements fonctionnent en même temps ?', 'I =', I14, 'A', calc(`I = 1,3 + 0,60 + 1,5 + 3,9 + 3,8 + 0,085 = 11,185 ≈ ${c('11,2 A')}`), { rel: .01, affiche: '11,2', diag: () => 'Les intensités des appareils qui fonctionnent en même temps s\'additionnent.' }),
        { type: 'gabarit', q: 'b) Calcule l\'énergie disponible de chacune des batteries.', label: 'E<sub>1</sub> =', morceaux: [{ v: 960, aria: 'Énergie de la batterie 1 en Wh' }, 'Wh ; E<sub>2</sub> =', { v: 1440, aria: 'Énergie de la batterie 2 en Wh' }, 'Wh'],
          diag: () => 'E = Q × U pour chaque batterie (Q en Ah, U en V).', correction: calc('E<sub>1</sub> = Q × U = 80 × 12 = 960 Wh<br>E<sub>2</sub> = Q × U = 120 × 12 = 1 440 Wh') },
        scient('c) Calcule le volume de la batterie 1 (dimensions en m).', 'V<sub>1</sub> =', V1, 'm<sup>3</sup>', calc(`V<sub>1</sub> = 0,330 m × 0,171 m × 0,2355 m ≈ ${c('0,0133 m<sup>3</sup>')}`),
          { diag: v => proche(v, V1 * 1e9, .02) ? 'Ce sont des mm<sup>3</sup> : convertis d\'abord les dimensions en mètres.' : 'Convertis les dimensions en m (330 mm = 0,330 m…), puis multiplie.' }),
        scient('c) Calcule le volume de la batterie 2.', 'V<sub>2</sub> =', V2, 'm<sup>3</sup>', calc(`V<sub>2</sub> = 0,513 × 0,189 × 0,223 ≈ ${c('0,0216 m<sup>3</sup>')}`),
          { diag: v => proche(v, V2 * 1e9, .02) ? 'Ce sont des mm<sup>3</sup> : convertis d\'abord les dimensions en mètres.' : 'V = L × l × h, en mètres.' }),
        scient('d) En déduire l\'énergie volumique de la batterie 1.', 'E<sub>V1</sub> =', 960 / .0133, 'Wh/m<sup>3</sup>', calc(`E<sub>V1</sub> = ${fr('E<sub>1</sub>', 'V<sub>1</sub>')} = ${fr('960 Wh', '0,0133 m<sup>3</sup>')} ≈ ${c('7,22 × 10<sup>4</sup> Wh/m<sup>3</sup>')}`),
          { diag: v => proche(v, .0133 / 960, .03) ? 'Rapport inversé : E<sub>V</sub> = E / V.' : 'E<sub>V</sub> = E / V.' }),
        scient('d) Énergie volumique de la batterie 2.', 'E<sub>V2</sub> =', 1440 / .0216, 'Wh/m<sup>3</sup>', calc(`E<sub>V2</sub> = ${fr('1 440 Wh', '0,0216 m<sup>3</sup>')} ≈ ${c('6,67 × 10<sup>4</sup> Wh/m<sup>3</sup>')}`),
          { diag: v => proche(v, .0216 / 1440, .03) ? 'Rapport inversé : E<sub>V</sub> = E / V.' : 'E<sub>V</sub> = E / V.' }),
        choix('d) Compare ces valeurs.', [o('ok', 'la batterie 1 a la plus grande énergie volumique : à énergie égale, elle est moins encombrante'), o('a', 'la batterie 2 a la plus grande énergie volumique'), o('b', 'les deux sont égales')], 'ok',
          '<p>E<sub>V1</sub> ≈ 72 200 Wh/m<sup>3</sup> &gt; E<sub>V2</sub> ≈ 66 700 Wh/m<sup>3</sup> : la batterie 1 stocke plus d\'énergie par m<sup>3</sup>.</p>', { melanger: false, indices: { a: 'Compare les puissances de 10 et les nombres : 7,22 × 10<sup>4</sup> et 6,67 × 10<sup>4</sup>.', b: 'Les deux valeurs calculées sont différentes.' } }),
        { type: 'gabarit', q: 'e) Calcule l\'énergie massique de chacune (3 chiffres significatifs).', label: 'E<sub>m1</sub> =', morceaux: [{ v: 960 / 32.6, rel: .01, aria: 'Énergie massique de la batterie 1' }, 'Wh/kg ; E<sub>m2</sub> =', { v: 1440 / 41.7, rel: .01, aria: 'Énergie massique de la batterie 2' }, 'Wh/kg'],
          diag: ([a]) => proche(a, 32.6 / 960, .03) ? 'Rapport inversé : E<sub>m</sub> = E / m.' : 'E<sub>m</sub> = E / m, avec m en kg.',
          correction: calc(`E<sub>m1</sub> = ${fr('E<sub>1</sub>', 'm<sub>1</sub>')} = ${fr('960 Wh', '32,6 kg')} ≈ 29,4 Wh/kg<br>E<sub>m2</sub> = ${fr('1 440 Wh', '41,7 kg')} ≈ 34,5 Wh/kg`) + '<p>La batterie 2 a la plus grande énergie massique : à énergie égale, elle est plus légère.</p>' },
        nombre('f) Combien de temps fonctionnerait la batterie 1 si on utilisait en continu tous les appareils ?', 'Δt<sub>1</sub> =', 80 / I14, 'h', calc(`Q = I × Δt (Q en Ah) donc Δt = ${fr('Q', 'I')}<br>Δt<sub>1</sub> = ${fr('80 Ah', '11,2 A')} ≈ ${c('7,1 h')}`) + '<p>OU : 80 Ah, c\'est 80 A pendant 1 h ; avec 11,2 A, on tient 80 / 11,2 h (« combien de fois 11,2 A dans 80 A·h ? »).</p>',
          { rel: .015, affiche: '7,1', diag: v => proche(v, I14 / 80, .03) ? 'Rapport inversé : Δt = Q / I.' : proche(v, 960 / I14, .02) ? 'Utilise la capacité (en Ah), pas l\'énergie : Δt = Q / I.' : 'Δt = Q / I.' }),
        nombre('f) Et la batterie 2 ?', 'Δt<sub>2</sub> =', 120 / I14, 'h', calc(`Δt<sub>2</sub> = ${fr('120 Ah', '11,2 A')} ≈ ${c('10,7 h')}`), { rel: .015, affiche: '10,7', diag: v => proche(v, I14 / 120, .03) ? 'Rapport inversé : Δt = Q / I.' : 'Δt = Q / I.' }),
        choix('g) L\'utilisation d\'une batterie est-elle suffisante si le camping-car est à l\'arrêt toute une journée ?', [o('ok', 'Non : aucune ne tient une journée ; il faut installer plusieurs batteries en dérivation, dont les capacités s\'additionnent'), o('a', 'Oui : la batterie 2 tient une journée'), o('b', 'Non : il faut brancher deux batteries en série')], 'ok',
          '<p>Aucune de ces durées (7,1 h et 10,7 h) ne permet de tenir une journée entière. Il faut installer au moins deux batteries, en dérivation : la tension reste 12 V et les capacités s\'additionnent.</p>',
          { melanger: false, indices: { a: '10,7 h, c\'est moins qu\'une journée.', b: 'En série, on obtiendrait 24 V, trop pour les appareils ; c\'est la capacité qu\'il faut augmenter.' } }),
      ] },

    /* ============================ ACTIVITÉ 2 ============================ */
    { id: 'A2', groupe: 'activite', titre: 'Activité 2 p. 37 : les accumulateurs', desc: 'Tension et capacité d\'une batterie, masse pour stocker 5 000 Wh.',
      contexte: `<p class="er-contexte"><b>Doc. 1.</b> Les principales caractéristiques d'un accumulateur sont : sa <b>force électromotrice</b> (tension à vide, en V), sa <b>capacité</b> (quantité d'électricité qu'il peut stocker, en Ah), son <b>énergie massique</b> (en Wh·kg<sup>−1</sup>) et son <b>nombre de cycles</b> de charge.</p>
        <p class="er-contexte" style="margin-top:8px"><b>Doc. 2.</b> Plomb-acide : le plus répandu (voitures thermiques, alimentations de secours). Ni-Cd : n'est plus utilisé par le grand public (cadmium polluant et toxique), mais autorisé dans l'industrie car très fiable et de longue durée de vie (12 à 15 ans). Ni-MH : appareils portables, voitures hybrides. Li-ion : électronique portable.</p>
        ${tableauTechnos(false)}
        <p class="er-contexte" style="margin-top:8px">Cette batterie, constituée de plusieurs accumulateurs au plomb, est utilisée pour une voiture :</p>
        ${batterie({ lignes: ['75 Ah · 12 V', '620 A (EN)'], aria: 'Batterie de voiture marquée 75 Ah, 12 V et 620 A' })}`,
      parties: [
        nombre('1. Quelle est la tension à vide de la batterie d\'automobile ?', 'U =', 12, 'V', '<p>U = 12 V (lue sur la batterie).</p>', { diag: v => proche(v, 2.1) ? 'C\'est la f.é.m. d\'un seul accumulateur au plomb ; lis la tension de la batterie.' : 'Lis le nombre suivi de « V ».' }),
        choix('1. La f.é.m. d\'un accumulateur plomb-acide (2,1 V) est inférieure à 12 V. Comment atteint-on cette tension ?', [o('ok', 'on associe plusieurs accumulateurs en série'), o('a', 'on associe plusieurs accumulateurs en dérivation'), o('b', 'on utilise un seul accumulateur plus gros')], 'ok',
          '<p>Pour atteindre 12 V, on associe plusieurs accumulateurs <b>en série</b> : les tensions s\'additionnent (6 × 2,1 ≈ 12 V).</p>', { melanger: false, indices: { a: 'En dérivation, la tension ne change pas.', b: 'La f.é.m. dépend de la technologie, pas de la taille.' } }),
        nombre('2. Quelle est la capacité de cette batterie ?', 'Q =', 75, 'Ah', '<p>Q = 75 Ah.</p>', { diag: v => proche(v, 620) ? '620 A est le courant de démarrage ; la capacité est en Ah.' : 'Lis le nombre suivi de « Ah ».' }),
        partieTableau({ q: '3. On veut stocker 5 000 Wh avec des accumulateurs plomb-acide (limite haute : 50 Wh·kg<sup>−1</sup>). Complète le tableau de proportionnalité.',
          lignes: [['Wh', { v: 50 }, { v: 5000 }], ['kg', 1, '?']], solution: '<p>50 Wh pour 1 kg ; 5 000 Wh pour m kg.</p>', diag: vs => proche(vs[0], 30) ? 'On prend la limite haute de l\'énergie massique : 50 Wh·kg<sup>−1</sup>.' : proche(vs[0], 5000) ? '50 Wh correspondent à 1 kg : même colonne que le 1.' : '' }),
        nombre('3. Masse d\'accumulateurs plomb-acide :', 'm =', 100, 'kg', calc(`m = ${fr('5 000 × 1', '50')} = ${c('100 kg')} (produit en croix)`), { diag: v => proche(v, 250000) ? 'Produit en croix : 5 000 × 1 / 50.' : 'm = E / E<sub>m</sub>.' }),
        nombre('3. Masse d\'accumulateurs Ni-Cd (limite haute 80 Wh·kg<sup>−1</sup>) :', 'm =', 62.5, 'kg', calc(`m = ${fr('5 000', '80')} = ${c('62,5 kg')}`), { diag: v => proche(v, 5000 / 45, .02) ? 'Prends la limite haute : 80 Wh·kg<sup>−1</sup>.' : 'm = E / E<sub>m</sub>.' }),
        nombre('3. Masse d\'accumulateurs Ni-MH (limite haute 110 Wh·kg<sup>−1</sup>, 3 chiffres significatifs) :', 'm =', 5000 / 110, 'kg', calc(`m = ${fr('5 000', '110')} ≈ ${c('45,5 kg')}`), { rel: .01, affiche: '45,5', diag: v => proche(v, 5000 / 60, .02) ? 'Prends la limite haute : 110 Wh·kg<sup>−1</sup>.' : 'm = E / E<sub>m</sub>.' }),
        nombre('3. Masse d\'accumulateurs Li-ion (limite haute 250 Wh·kg<sup>−1</sup>) :', 'm =', 20, 'kg', calc(`m = ${fr('5 000', '250')} = ${c('20 kg')}`) + `<p class="pa2-note">${NOTE_LIION} Avec la valeur du manuel (2 500), on trouverait 2 kg.</p>`,
          { diag: v => proche(v, 2) ? 'C\'est le résultat avec la valeur du manuel, qui est une coquille : prends 250 Wh·kg<sup>−1</sup>.' : 'm = E / E<sub>m</sub> = 5 000 / 250.' }),
        choix('4. Quels sont les avantages des accumulateurs Ni-Cd ?', [o('ok', 'ils sont très fiables et ont une longue durée de vie'), o('a', 'ils ne polluent pas'), o('b', 'ils ont la plus grande énergie massique')], 'ok',
          '<p>Les accumulateurs Ni-Cd sont très fiables et ont une durée de vie longue (12 à 15 ans, 2 000 cycles).</p>', { melanger: false, indices: { a: 'Le cadmium est polluant et toxique.', b: 'C\'est le Li-ion qui a la plus grande énergie massique.' } }),
      ] },
  ];

  window.PA2.EXERCICES = EXERCICES;
  window.PA2.GROUPES_EX = GROUPES_EX;
})();
