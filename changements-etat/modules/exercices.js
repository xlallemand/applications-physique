/* ============================================================
   Exercices du module 6 (application « Chapitre 11 : Changements
   d'état et transferts thermiques ») : les exercices de la feuille,
   dans l'ordre de la correction et avec leur numérotation : 13 et 14
   p. 146, 10 p. 145, 15 p. 146, 7 et 8 p. 145, 17 p. 147, puis
   l'exercice de bac blanc « Dégivrage ».

   Chaque exercice : { id, groupe, titre, desc, contexte (HTML),
   parties: fonction qui les fabrique } ; chaque partie suit le format
   de CE.PARTIES avec p.q (question) et p.solution (correction
   détaillée : formule, grandeur isolée, application numérique avec
   les unités). Les exercices à étapes (14, 15 e, bac blanc 2 à 4)
   commencent par le schéma des étapes (CE.etapes).

   Valeurs vérifiées par un script :
     ex. 13 : 500 × (−334) ≈ −1,67 × 10⁵ J ;
     ex. 14 : 0,250 × 1 970 × 23 ≈ 1,13 × 10⁴ J ; 0,250 × 334 × 10³ ≈ 8,35 × 10⁴ J ;
       0,250 × 4 180 × 100 ≈ 1,05 × 10⁵ J ; 0,250 × 2 257 × 10³ ≈ 5,64 × 10⁵ J ; Q ≈ 7,64 × 10⁵ J ;
     ex. 15 : 2,00 × 662 × (49 − 70) ≈ −2,78 × 10⁴ J ; 2,00 × (−233,7 × 10³) ≈ −4,67 × 10⁵ J ;
       2,00 × 1 257 × (30 − 49) ≈ −4,78 × 10⁴ J ; Q ≈ −5,43 × 10⁵ J ;
     ex. 17 : m = 1 000 × 560 = 5,6 × 10⁵ kg ; Q = 5,6 × 10⁵ × 4 180 × 11 ≈ 2,6 × 10¹⁰ J ;
       Q_f = 2,6 × 10¹⁰ − 8,0 × 10⁹ ≈ 1,8 × 10¹⁰ J ;
     bac blanc : m = 920 × 5 × 0,5 × 10⁻³ = 2,3 kg ; E₁ ≈ 4,81 × 10⁴ J ; E₂ ≈ 7,66 × 10⁵ J ;
       E ≈ 8,14 × 10⁵ J ; u = 0,5 % × 28,02 + 4 × 0,01 ≈ 0,18 V ; P = 1 250 W ;
       Δt = 8,14 × 10⁵ / 1 250 ≈ 651 s ≈ 10,9 min.
   Écarts avec la correction :
     ex. 10 : la correction écrit T_c = 374,15 K ; T_c = 374 °C ≈ 647 K (valeur retenue) ;
     bac blanc : la donnée c_el = 418 J·kg⁻¹·K⁻¹ du sujet est fausse (4 180), et inutilisée ;
       la correction écrit 10,8 min : 651 s / 60 ≈ 10,9 min.
   ============================================================ */
(function () {
  'use strict';

  const { o, fmt, sci, proche, dessin, schemaPose, slot, figDiag, schemaDiag, figPT, COURBES, tVap, etapes, PROBLEMES, chaineEnergie } = window.CE;
  const calc = h => `<p class="ph-calc">${h}</p>`;
  const c = h => `<span class="c">${h}</span>`;
  const pr = (a, b) => proche(a, b, .02);
  const UC = 'J·kg<sup>−1</sup>·K<sup>−1</sup>', ULk = 'kJ·kg<sup>−1</sup>';
  // fabriques de parties
  const choix = (q, options, bonne, correction, opts) => Object.assign({ type: 'choix', q, options, bonne, correction, melanger: false, colonne: options.some(x => x.label.replace(/<[^>]+>/g, '').length > 24) }, opts);
  const nombre = (q, label, valeur, unite, correction, opts) => Object.assign({ type: 'nombre', q, label, valeur, unite, correction, signe: false }, opts);
  const scient = (q, label, valeur, unite, correction, opts) => Object.assign({ type: 'sci', q, label, valeur, unite, correction, cs: 3, rel: .01 }, opts);
  const donnees = l => `<p class="ph-donnees">Données : ${l.join(' ; ')}.</p>`;

  /* ---------- Exercice 13 p. 146 : transformer de l'eau en glace ---------- */
  const ex13 = {
    id: '13', groupe: 'energie', titre: 'Exercice 13 p. 146 : de l\'eau en glace', desc: 'Température de solidification, liaisons hydrogène, Q = m × L',
    contexte: `<p class="er-contexte">On souhaite transformer m = 500 g d'eau en glace.</p>
      <ul class="er-liste"><li>a) À quelle température se fait ce changement d'état ?</li><li>b) Lors de ce changement d'état, quel type de liaisons deviennent effectives ?</li>
        <li>c) Quelle est l'énergie nécessaire pour réaliser ce changement d'état ?</li></ul>
      ${donnees(['énergie massique de solidification de l\'eau : L = −334 J·g<sup>−1</sup>'])}`,
    parties: () => [
      nombre('a) À quelle température l\'eau se solidifie-t-elle (pression atmosphérique) ?', 'T =', 0, '°C', '<p>À la pression atmosphérique, l\'eau se solidifie à <b>0 °C</b> (comme la glace fond à 0 °C).</p>',
        { tol: .5, signe: true, diag: v => (Math.abs(v - 100) < 1 ? '100 °C, c\'est l\'ébullition : la solidification est le passage liquide → solide.' : Math.abs(v - 273) < 1 ? 'La question attend des °C : 273 K = 0 °C.' : 'La solidification de l\'eau se fait à la même température que la fusion de la glace.') }),
      choix('b) Quel type de liaisons deviennent effectives ?', [o('h', 'des liaisons hydrogène entre les molécules'), o('cov', 'des liaisons covalentes O–H'), o('ion', 'des liaisons ioniques')], 'h',
        '<p>En se solidifiant, les molécules d\'eau se rangent : les <b>liaisons hydrogène</b> entre un H d\'une molécule et le O d\'une autre deviennent effectives.</p>',
        { indices: { cov: 'Les liaisons covalentes O–H sont à l\'intérieur de chaque molécule : elles existent déjà dans l\'eau liquide.', ion: 'L\'eau est faite de molécules, pas d\'ions.' } }),
      choix('c) Quelle formule utilises-tu ?', [o('mL', 'Q = m × L'), o('mc', 'Q = m × c × (T<sub>f</sub> − T<sub>i</sub>)'), o('div', 'Q = L / m')], 'mL',
        '<p>Changement d\'état à température fixe (0 °C) : <b>Q = m × L</b>.</p>',
        { indices: { mc: 'La température ne change pas pendant la solidification : c\'est un changement d\'état.', div: 'Plus il y a d\'eau, plus il faut d\'énergie : on multiplie.' } }),
      scient('Calcule l\'énergie Q (3 chiffres significatifs, signe compris).', 'Q =', 500 * -334, 'J',
        calc(`Q = m × L = 500 g × (−334 J·g<sup>−1</sup>) ≈ ${c('−1,67 × 10<sup>5</sup> J')}`) + '<p>m en g avec L en J·g<sup>−1</sup> : le résultat est en J. On peut la noter Q ou E. Q < 0 : l\'eau <b>cède</b> cette énergie.</p>',
        { diag: v => (pr(v, 500 * 334) ? 'L est négative (solidification) : l\'eau cède de l\'énergie, Q < 0.' : pr(v, -.5 * 334) || pr(v, .5 * 334) ? 'L est en J·g<sup>−1</sup> : garde la masse en grammes (500 g).' : 'Q = m × L = 500 × (−334).') }),
    ],
  };

  /* ---------- Exercice 14 p. 146 : Mike Horn et son thé ---------- */
  const ex14 = {
    id: '14', groupe: 'energie', titre: 'Exercice 14 p. 146 : de la glace pour le thé', desc: 'Schéma des étapes : glace −23 °C → vapeur 100 °C, quatre étapes',
    contexte: `<p class="er-contexte">Mike Horn, célèbre aventurier-explorateur, a tenté la traversée de l'océan Arctique à ski en 2019. Lors d'une pause bien méritée, il a souhaité faire fondre de la glace pour se préparer un thé. Distrait par un ours polaire, toute la glace qu'il avait mis à chauffer s'est évaporée.</p>
      <p class="er-contexte">Calculer l'énergie nécessaire pour faire évaporer m = 250 g de glace à une température initiale θ<sub>i</sub> = −23 °C.</p>
      ${donnees(['c<sub>eau liquide</sub> = 4 180 ' + UC, 'c<sub>eau vapeur</sub> = 2 090 ' + UC, 'c<sub>glace</sub> = 1 970 ' + UC, 'L<sub>vap</sub> = 2 257 ' + ULk, 'L<sub>fus</sub> = 334 ' + ULk])}`,
    parties: () => etapes(PROBLEMES.ex14()),
  };

  /* ---------- Exercice 10 p. 145 : diagramme d'état de l'eau ---------- */
  const ex10 = {
    id: '10', groupe: 'diagrammes', titre: 'Exercice 10 p. 145 : le diagramme d\'état de l\'eau', desc: 'Point triple, point critique, zones, températures de changement d\'état',
    contexte: `<p class="er-contexte">On donne ci-dessous le diagramme d'état de l'eau (schématique).</p>
      ${figDiag({ livre: true, noms: false })}
      <ul class="er-liste"><li>a) Définir le point triple et le point critique. Rechercher leurs valeurs.</li><li>b) Indiquer sur le diagramme (p, T) les états : solide, liquide, gaz.</li>
        <li>c) Indiquer les températures particulières repérées sur le diagramme. Quelles sont leurs valeurs pour l'eau à la pression indiquée ?</li></ul>`,
    parties: () => [
      choix('a) Qu\'est-ce que le point triple ?', [o('ok', 'le point où les états solide, liquide et gazeux coexistent'), o('crit', 'le point où s\'arrête la courbe de vaporisation'), o('fus', 'le point de fusion de la glace à 101,3 kPa')], 'ok',
        '<p>Point triple : point du diagramme où les états <b>solide, liquide et gazeux coexistent</b>.</p>',
        { indices: { crit: 'Ça, c\'est le point critique.', fus: 'À 101,3 kPa, la glace fond à 0 °C ; le point triple est à une pression beaucoup plus faible.' } }),
      nombre('Pression du point triple de l\'eau, en Pa.', 'P =', 611, 'Pa', calc(`P = ${c('611 Pa')} (la correction écrit 610,6 Pa), soit 0,006 bar.`),
        { tol: 1.5, diag: v => (pr(v, .611) || pr(v, .006) ? 'La pression est demandée en Pa : 611 Pa = 0,611 kPa = 0,006 bar.' : pr(v, 101300) || pr(v, 101.3) ? '101,3 kPa, c\'est la pression atmosphérique.' : 'Revois le cours : P ≈ 611 Pa.') }),
      // conversion °C → K avec 273 (273,15 accepté : 273,16 K)
      nombre('Température du point triple de l\'eau, en K.', 'T =', 273.01, 'K', calc(`T = 0,01 + 273 ≈ ${c('273 K')}`),
        { tol: .2, affiche: '273', diag: v => (Math.abs(v - .01) < .02 ? 'C\'est la valeur en °C : T (K) = θ (°C) + 273.' : 'Le point triple de l\'eau est à 0,01 °C : T = 0,01 + 273.') }),
      choix('Qu\'est-ce que le point critique ?', [o('ok', 'le point où s\'arrête la courbe de vaporisation : plus de distinction entre liquide et gaz'), o('tri', 'le point où les trois états coexistent'), o('eb', 'le point d\'ébullition de l\'eau à 101,3 kPa')], 'ok',
        '<p>Point critique : point où <b>s\'arrête la courbe de vaporisation</b> ; au-delà, il n\'y a plus de distinction entre les états liquide et gazeux.</p>',
        { indices: { tri: 'Ça, c\'est le point triple.', eb: 'À 101,3 kPa, l\'eau bout à 100 °C : ce n\'est pas le point critique.' } }),
      nombre('Pression du point critique de l\'eau, en MPa (une décimale).', 'P<sub>c</sub> =', 22.1, 'MPa', calc(`P<sub>c</sub> ≈ 221 bar = ${c('22,1 MPa')}`),
        { tol: .15, dec: 1, diag: v => (pr(v, 221) || pr(v, 218) ? 'En MPa : 1 MPa = 10 bar, donc 221 bar = 22,1 MPa.' : pr(v, 22100) ? 'En MPa, pas en kPa : 22 100 kPa = 22,1 MPa.' : 'Revois le cours : P<sub>c</sub> ≈ 221 bar.') }),
      nombre('Température du point critique de l\'eau, en K.', 'T<sub>c</sub> =', 647, 'K', calc(`T<sub>c</sub> = 374 + 273 ≈ ${c('647 K')}`) + '<p>Attention : 374 est la valeur en °C (la correction écrit 374,15 K, c\'est une erreur).</p>',
        { tol: 1.5, diag: v => (Math.abs(v - 374) < 1.5 ? '374 est la température en °C : T (K) = θ (°C) + 273.' : 'T<sub>c</sub> = 374 °C, à convertir en kelvins.') }),
      { type: 'schema', titrePalette: 'États', q: 'b) Place les états sur le diagramme : fais glisser chaque étiquette dans sa zone.',
        schema: schemaDiag({ s: slot('s'), l: slot('l'), g: slot('g') }, { livre: true }),
        etiquettes: [
          { id: 's', label: 'solide', cible: 's', indice: 'Le solide est à basse température : à gauche de la courbe de fusion.' },
          { id: 'l', label: 'liquide', cible: 'l', indice: 'Le liquide est au-dessus de la courbe de vaporisation (forte pression), à droite de la courbe de fusion.' },
          { id: 'g', label: 'gaz', cible: 'g', indice: 'Le gaz est à basse pression et haute température : sous la courbe de vaporisation.' }],
        correction: `<p>Solide à gauche (basses températures), liquide en haut au milieu, gaz en bas à droite (basses pressions).</p>${figDiag({ livre: true })}` },
      // conversions °C → K avec 273 (273,15 et 373,15 K acceptés)
      nombre('c) Température de fusion de l\'eau à 101,3 kPa, en K.', 'T<sub>fus</sub> =', 273, 'K', calc(`T<sub>fus</sub> = 0 °C = 0 + 273 = ${c('273 K')}`),
        { tol: .2, dec: 0, diag: v => (Math.abs(v) < .5 ? 'Le diagramme est en kelvins : T (K) = θ (°C) + 273.' : Math.abs(v - 373) < .5 ? 'Ça, c\'est l\'ébullition ; la fusion est le croisement avec la courbe de fusion.' : 'Fusion de la glace à la pression atmosphérique : 0 °C.') }),
      nombre('Température d\'ébullition de l\'eau à 101,3 kPa, en K.', 'T<sub>éb</sub> =', 373, 'K', calc(`T<sub>éb</sub> = 100 °C = 100 + 273 = ${c('373 K')}`) + '<p>À la pression atmosphérique (101,3 kPa) : fusion à 0 °C (273 K), ébullition à 100 °C (373 K).</p>',
        { tol: .2, dec: 0, diag: v => (Math.abs(v - 100) < .5 ? 'Le diagramme est en kelvins : T (K) = θ (°C) + 273.' : 'Ébullition de l\'eau à la pression atmosphérique : 100 °C.') }),
    ],
  };

  /* ---------- Exercice 15 p. 146 : le fluide R22 ---------- */
  const r22 = COURBES.r22;
  const ex15 = {
    id: '15', groupe: 'diagrammes', titre: 'Exercice 15 p. 146 : le fluide frigorigène R22', desc: 'Courbe pression-température, schéma des étapes d\'un refroidissement',
    contexte: `<p class="er-contexte">Le fluide frigorigène R22 était utilisé en climatisation car il possède une basse température de vaporisation à la pression atmosphérique.</p>
      ${figPT('r22', {})}<p class="ce-note" style="text-align:center">Relation pression-température du R22</p>
      <ul class="er-liste"><li>a) Définir la pression relative.</li><li>b) Quelle est sa température de vaporisation à la pression atmosphérique ?</li>
        <li>c) Comment évolue la température de vaporisation lorsque la pression relative augmente ?</li><li>d) À quelle pression relative la température de vaporisation est-elle de 20 °C ?</li>
        <li>e) Dans une pompe à chaleur, ce fluide est amené à une pression relative de 18 bars et à une température de 70 °C. À 18 bars, la température de vaporisation est de 49 °C. Après avoir cédé de la chaleur au milieu extérieur, il est à une température de 30 °C. Calculer l'énergie thermique transférée au milieu extérieur pour une masse m = 2,00 kg de fluide.</li></ul>
      ${donnees(['énergie massique de vaporisation : L = 233,7 ' + ULk, 'capacité thermique massique liquide : c<sub>liq</sub> = 1,257 kJ·kg<sup>−1</sup>·K<sup>−1</sup>', 'capacité thermique massique gaz : c<sub>gaz</sub> = 0,662 kJ·kg<sup>−1</sup>·K<sup>−1</sup>'])}`,
    parties: () => [
      choix('a) Qu\'est-ce que la pression relative ?', [o('ok', 'la pression par rapport à la pression atmosphérique'), o('abs', 'la pression mesurée par rapport au vide'), o('max', 'la pression maximale que supporte le fluide')], 'ok',
        '<p>La pression relative est la pression <b>par rapport à la pression atmosphérique</b> : 0 bar relatif = pression atmosphérique.</p>',
        { indices: { abs: 'Par rapport au vide, c\'est la pression absolue.', max: 'La courbe donne la pression pour chaque température : ce n\'est pas une pression maximale.' } }),
      nombre('b) Température de vaporisation à la pression atmosphérique.', 'T =', -40, '°C', `${figPT('r22', { lecture: { P: 0 } })}<p>Pression atmosphérique : pression relative <b>nulle</b>. On lit T = ${c('−40 °C')}.</p>`,
        { tol: 2.5, signe: true, affiche: '−40', diag: v => (Math.abs(v - 20) < 3 ? 'Pression atmosphérique = pression relative nulle : lis la température où la courbe coupe l\'axe des températures.' : 'Pression relative nulle : point de départ de la courbe, sur l\'axe des températures.') }),
      choix('c) Quand la pression relative augmente, la température de vaporisation…', [o('aug', 'augmente'), o('dim', 'diminue'), o('cst', 'ne change pas')], 'aug',
        '<p>La courbe monte : la température de vaporisation <b>augmente</b> lorsque la pression relative augmente.</p>',
        { indices: { dim: 'La courbe monte vers la droite : à une pression plus grande correspond une température plus grande.', cst: 'La température de vaporisation passe de −40 °C à 20 °C quand la pression passe de 0 à 8 bar.' } }),
      nombre('d) Pression relative pour une température de vaporisation de 20 °C.', 'P =', r22.f(20), 'bar', `${figPT('r22', { lecture: { T: 20 }, valeur: true })}<p>On lit P ≈ ${c('8 bar')}.</p>`,
        { tol: .4, affiche: '8', diag: v => (Math.abs(v - 20) < 1 ? 'On lit une pression, sur l\'axe vertical.' : 'Pars de 20 °C sur l\'axe horizontal, monte jusqu\'à la courbe, puis lis la pression.') }),
    ].concat(etapes(PROBLEMES.ex15()).map((p, k) => (k === 0 ? Object.assign(p, { q: 'e) ' + p.q + ' Le fluide est sous 18 bar : il se liquéfie à 49 °C.' }) : p))),
  };

  /* ---------- Exercice 7 p. 145 : liaison hydrogène ---------- */
  const ex7 = {
    id: '7', groupe: 'matiere', titre: 'Exercice 7 p. 145 : la liaison hydrogène', desc: 'La bonne représentation',
    contexte: `<p class="er-contexte">Quelle est la bonne représentation de la liaison hydrogène ?</p>
      <div class="ce-figs">${[1, 2, 3].map(r => dessin('liaisonH', { rep: r, numero: true })).join('')}</div>`,
    parties: () => [
      choix('Choisis la bonne représentation.', [1, 2, 3].map(r => o(String(r), 'représentation ' + r)), '1',
        '<p>La bonne représentation est la <b>1</b> : la liaison hydrogène (pointillés) relie un H (δ<sup>+</sup>) d\'une molécule au O (2δ<sup>−</sup>) d\'une autre molécule.</p>',
        { indices: { 2: 'Dans la représentation 2, deux atomes H (tous deux δ<sup>+</sup>) sont reliés : des charges de même signe se repoussent.', 3: 'Dans la représentation 3, les deux H d\'une même molécule sont reliés : la liaison hydrogène relie deux molécules.' } }),
    ],
  };

  /* ---------- Exercice 8 p. 145 : représentations microscopiques ---------- */
  const ex8 = {
    id: '8', groupe: 'matiere', titre: 'Exercice 8 p. 145 : solide, liquide, gaz', desc: 'Attribuer un état à chaque représentation',
    contexte: `<p class="er-contexte">Attribuer à chaque représentation microscopique de la matière l'état solide, liquide et gazeux.</p>${dessin('micro', { ordre: ['l', 's', 'g'], numeros: true })}`,
    parties: () => [
      { type: 'grille', q: 'Choisis l\'état de chaque représentation.', options: [o('s', 'solide'), o('l', 'liquide'), o('g', 'gazeux')],
        lignes: [
          { id: '1', label: 'Représentation 1', bonne: 'l', indices: { s: 'Molécules serrées mais en désordre : pas un solide.', g: 'Molécules serrées : pas un gaz.' } },
          { id: '2', label: 'Représentation 2', bonne: 's', indices: { l: 'Molécules rangées régulièrement : c\'est un solide.', g: 'Molécules serrées et rangées : pas un gaz.' } },
          { id: '3', label: 'Représentation 3', bonne: 'g', indices: { s: 'Molécules très éloignées : pas un solide.', l: 'Molécules très éloignées : pas un liquide.' } }],
        correction: '<p>Représentation 1 : état <b>liquide</b> (serrées, en désordre). Représentation 2 : état <b>solide</b> (serrées, rangées). Représentation 3 : état <b>gazeux</b> (très éloignées).</p>' },
    ],
  };

  /* ---------- Exercice 17 p. 147 : pompe à chaleur ---------- */
  const m17 = 1000 * 560, Q17 = m17 * 4180 * 11, We = 8e9;
  const ex17 = {
    id: '17', groupe: 'bilans', titre: 'Exercice 17 p. 147 : une pompe à chaleur', desc: 'Transferts Q_f, Q_c, W_e ; chauffage de l\'eau d\'une piscine',
    contexte: `<p class="er-contexte">La pompe à chaleur (PAC) est un équipement de chauffage thermodynamique à énergie renouvelable. La PAC transfère de l'énergie depuis une source renouvelable, appelée source froide (l'air extérieur, l'eau d'une nappe souterraine ou de la mer, ou la terre) vers un autre milieu (un bâtiment, un logement, un bassin d'eau…).</p>
      <p class="er-contexte">On étudie une PAC utilisée pour le chauffage de l'eau d'une piscine. Cette PAC fonctionne comme une machine cyclique : au terme d'un cycle, la somme des énergies échangées par le fluide frigorigène contenu dans la PAC est nulle. Au cours d'un cycle :</p>
      <ul class="er-liste"><li>Q<sub>f</sub> : énergie transférée de l'air extérieur (source froide) au fluide de la PAC ;</li><li>Q<sub>c</sub> : énergie transférée par le fluide de la PAC à l'eau du bassin de la piscine ;</li>
        <li>W<sub>e</sub> : énergie électrique consommée par la PAC et transférée intégralement au fluide de la PAC sous une autre forme.</li></ul>
      <p class="er-contexte">Les grandeurs Q<sub>f</sub>, Q<sub>c</sub> et W<sub>e</sub> sont positives.</p>
      <ul class="er-liste"><li>a) Parmi Q<sub>f</sub>, Q<sub>c</sub> et W<sub>e</sub>, indiquer ceux qui correspondent à une énergie reçue par le fluide de la PAC et ceux qui correspondent à de l'énergie cédée.</li>
        <li>b) Quelle relation peut-on écrire entre Q<sub>f</sub>, Q<sub>c</sub> et W<sub>e</sub> ? Justifier.</li>
        <li>c) Une piscine de volume V = 560 m³ est remplie d'eau à 17 °C ; on veut l'amener à 28 °C. Le transfert thermique depuis la PAC sert intégralement à chauffer l'eau, sans déperdition. Calculer l'énergie thermique reçue par l'eau du bassin.</li>
        <li>d) En déduire Q<sub>c</sub>.</li><li>e) L'énergie électrique consommée pendant ce transfert vaut W<sub>e</sub> = 8,0 × 10<sup>9</sup> J. Déterminer Q<sub>f</sub>.</li></ul>
      ${donnees(['ρ<sub>eau</sub> = 1 000 kg·m<sup>−3</sup>', 'c<sub>eau</sub> = 4,18 kJ·kg<sup>−1</sup>·K<sup>−1</sup>'])}`,
    parties: () => [
      { type: 'schema', titrePalette: 'Noms', q: 'Complète le schéma des transferts de la PAC d\'après l\'énoncé : fais glisser chaque nom à sa place.',
        schema: schemaPose('pac', {}, { air: slot('air'), res: slot('res'), eau: slot('eau'), qf: slot('qf'), we: slot('we'), qc: slot('qc') }),
        etiquettes: [
          { id: 'air', label: 'Air extérieur', cible: 'air', indice: 'L\'air extérieur (source froide) fournit Q<sub>f</sub> au fluide : la flèche part de lui vers le fluide.' },
          { id: 'res', label: 'Réseau électrique', cible: 'res', indice: 'Le réseau électrique fournit W<sub>e</sub> au fluide.' },
          { id: 'eau', label: 'Eau du bassin', cible: 'eau', indice: 'L\'eau du bassin reçoit Q<sub>c</sub> : la flèche va du fluide vers elle.' },
          { id: 'qf', label: 'Q<sub>f</sub>', cible: 'qf', indice: 'Q<sub>f</sub> va de l\'air extérieur vers le fluide.' },
          { id: 'we', label: 'W<sub>e</sub>', cible: 'we', indice: 'W<sub>e</sub> va du réseau électrique vers le fluide.' },
          { id: 'qc', label: 'Q<sub>c</sub>', cible: 'qc', indice: 'Q<sub>c</sub> va du fluide vers l\'eau du bassin.' }],
        correction: dessin('pac') },
      { type: 'grille', q: 'a) Pour le fluide de la PAC, chaque énergie est-elle reçue ou cédée ?', options: [o('r', 'reçue'), o('c', 'cédée')],
        lignes: [
          { id: 'qf', label: 'Q<sub>f</sub>', bonne: 'r', indices: { c: 'Q<sub>f</sub> va de l\'air extérieur vers le fluide.' } },
          { id: 'we', label: 'W<sub>e</sub>', bonne: 'r', indices: { c: 'W<sub>e</sub> est transférée au fluide par le réseau électrique.' } },
          { id: 'qc', label: 'Q<sub>c</sub>', bonne: 'c', indices: { r: 'Q<sub>c</sub> va du fluide vers l\'eau du bassin.' } }],
        correction: '<p>Q<sub>f</sub> et W<sub>e</sub> sont <b>reçues</b> par le fluide ; Q<sub>c</sub> est <b>cédée</b> par le fluide.</p>' },
      choix('b) Quelle relation peut-on écrire ?', [o('ok', 'Q<sub>f</sub> + W<sub>e</sub> − Q<sub>c</sub> = 0'), o('plus', 'Q<sub>f</sub> + W<sub>e</sub> + Q<sub>c</sub> = 0'), o('moins', 'Q<sub>f</sub> − W<sub>e</sub> − Q<sub>c</sub> = 0')], 'ok',
        '<p><b>Q<sub>f</sub> + W<sub>e</sub> − Q<sub>c</sub> = 0</b> : sur un cycle, la somme des énergies échangées par le fluide est nulle ; Q<sub>f</sub> et W<sub>e</sub> sont reçues (+), Q<sub>c</sub> est cédée (−), et les trois grandeurs sont positives.</p>',
        { indices: { plus: 'Q<sub>c</sub> est cédée par le fluide : elle compte en moins (les trois grandeurs sont positives).', moins: 'W<sub>e</sub> est reçue par le fluide : elle compte en plus.' } }),
      scient('c) Calcule d\'abord la masse d\'eau de la piscine.', 'm =', m17, 'kg', calc('m = ρ × V = 1 000 kg·m<sup>−3</sup> × 560 m³ = ' + c('5,6 × 10<sup>5</sup> kg')),
        { cs: 2, rel: .02, diag: v => (pr(v, 560) ? 'm = ρ × V : multiplie le volume par la masse volumique (1 000 kg·m<sup>−3</sup>).' : pr(v, 560 / 1000) || pr(v, 1000 / 560) ? 'm = ρ × V (on multiplie).' : 'm = 1 000 × 560.') }),
      scient('Calcule l\'énergie thermique reçue par l\'eau du bassin (2 chiffres significatifs).', 'Q =', Q17, 'J',
        calc('Q = m × c<sub>eau</sub> × (θ<sub>f</sub> − θ<sub>i</sub>) = ρ × V × c<sub>eau</sub> × (θ<sub>f</sub> − θ<sub>i</sub>)') + calc(`Q = 1 000 × 560 × 4,18 × 10<sup>3</sup> × (28 − 17) ≈ ${c('2,6 × 10<sup>10</sup> J')}`),
        { cs: 2, rel: .02, diag: v => (pr(v, Q17 / 1000) ? 'Convertis c en J : 4,18 kJ·kg<sup>−1</sup>·K<sup>−1</sup> = 4,18 × 10<sup>3</sup> J·kg<sup>−1</sup>·K<sup>−1</sup>.' : pr(v, -Q17) ? 'L\'eau chauffe : Q > 0.' : pr(v, m17 * 4180 * 28) ? 'C\'est l\'écart θ<sub>f</sub> − θ<sub>i</sub> = 28 − 17 = 11 °C.' : 'Q = 5,6 × 10<sup>5</sup> × 4 180 × (28 − 17).') }),
      scient('d) En déduire Q<sub>c</sub>.', 'Q<sub>c</sub> =', Q17, 'J', `<p>Toute l'énergie cédée par le fluide est reçue par l'eau : Q<sub>c</sub> = |Q| = ${c('2,6 × 10<sup>10</sup> J')}.</p>`,
        { cs: 2, rel: .02, diag: v => (pr(v, -Q17) ? 'Q<sub>c</sub> est une grandeur positive (énoncé) : Q<sub>c</sub> = |Q|.' : 'Sans déperdition, l\'énergie cédée par le fluide est celle reçue par l\'eau.') }),
      scient('e) Détermine Q<sub>f</sub>.', 'Q<sub>f</sub> =', 1.8e10, 'J',
        calc('Q<sub>f</sub> + W<sub>e</sub> − Q<sub>c</sub> = 0, donc Q<sub>f</sub> = Q<sub>c</sub> − W<sub>e</sub>') + calc(`Q<sub>f</sub> = 2,6 × 10<sup>10</sup> − 8,0 × 10<sup>9</sup> ≈ ${c('1,8 × 10<sup>10</sup> J')}`),
        { cs: 2, rel: .03, diag: v => (pr(v, Q17 + We) || pr(v, 2.6e10 + We) ? 'D\'après b), Q<sub>f</sub> = Q<sub>c</sub> − W<sub>e</sub> (on retranche W<sub>e</sub>).' : pr(v, -1.8e10) ? 'Q<sub>f</sub> est positive : Q<sub>f</sub> = Q<sub>c</sub> − W<sub>e</sub>.' : 'Q<sub>f</sub> = Q<sub>c</sub> − W<sub>e</sub> = 2,6 × 10<sup>10</sup> − 8,0 × 10<sup>9</sup>.') }),
    ],
  };

  /* ---------- Bac blanc : dégivrage ---------- */
  const E = 2.3 * 2090 * 10 + 2.3 * 333e3, dt = E / 1250;
  const NOTICE = `<div class="ph-defile"><table class="ph-tableau"><tr><th>Gamme</th><th>Résolution</th><th>Incertitude-type</th></tr>
    <tr><td>600 mV</td><td>0,1 mV</td><td rowspan="4">± 0,5 % de la valeur lue + 4 digits</td></tr><tr><td>6 V</td><td>1 mV</td></tr><tr><td>60 V</td><td>10 mV</td></tr><tr><td>600 V</td><td>100 mV</td></tr></table></div>`;
  const exBac = {
    id: 'Bac', groupe: 'bilans', titre: 'Bac blanc : dégivrage', desc: 'Masse de glace, schéma des étapes, appareils de mesure, incertitude, durée',
    contexte: `<p class="er-contexte">Le givrage des différentes parties d'un avion est un problème qui peut être résolu de différentes façons. Le réchauffement de zones vulnérables est une méthode très courante de prévention du givrage. On s'intéresse ici au dégivrage par apport d'énergie thermique.</p>
      ${donnees(['c<sub>el</sub> = 4 180 ' + UC + ' (eau liquide)', 'c<sub>es</sub> = 2 090 ' + UC + ' (eau solide)', 'L<sub>fusion</sub> = 333 ' + ULk + ' (glace à 0 °C)', 'ρ<sub>es</sub> = 920 kg·m<sup>−3</sup> (eau solide à −10 °C)'])}
      <p class="er-contexte">Une surface S = 5 m² de glace recouvre l'aile d'un avion sur une épaisseur e = 0,5 mm. La température de la glace est T<sub>1</sub> = −10 °C.</p>
      <ol class="er-liste"><li>Déterminer la masse de glace m déposée sur l'aile de l'avion.</li><li>Exprimer puis déterminer l'énergie E<sub>1</sub> nécessaire pour augmenter la température de la glace de −10 °C à 0 °C (m = 2,3 kg).</li>
        <li>Exprimer puis déterminer l'énergie E<sub>2</sub> nécessaire pour transformer à 0 °C la glace en eau liquide.</li><li>En déduire l'énergie totale nécessaire au dégivrage.</li></ol>
      <p class="er-contexte">Cette énergie est apportée par une batterie de tension continue U = 28,0 V qui alimente cinq éléments chauffants résistifs (résistance globale R), répartis sur l'aile, consommant chacun une puissance électrique P<sub>E</sub> = 250 W.</p>
      ${dessin('circuit')}
      <ol class="er-liste" start="5"><li>Nommer les appareils M<sub>1</sub> et M<sub>2</sub> ; lequel mesure la tension, lequel l'intensité ?</li><li>Indiquer sur le schéma les bornes COM des appareils de mesure.</li>
        <li>Déterminer l'incertitude-type de la tension : le multimètre affiche 28,02 V ; un digit correspond à la résolution.</li></ol>
      <p class="ce-note">Notice du multimètre (mesures en mode DC) :</p>${NOTICE}
      <ol class="er-liste" start="8"><li>Compléter la chaîne énergétique de la résistance chauffante.</li><li>Déterminer la puissance de la batterie nécessaire pour alimenter toutes les résistances.</li>
        <li>Sans perte thermique, déterminer la durée t<sub>1</sub> du dégivrage complet de l'aile. Commenter.</li></ol>`,
    parties: () => [
      nombre('1. Masse de glace sur l\'aile (une décimale).', 'm =', 920 * 5 * .5e-3, 'kg',
        calc('m = ρ<sub>es</sub> × V<sub>glace</sub> = ρ<sub>es</sub> × S × e') + calc(`m = 920 kg·m<sup>−3</sup> × 5 m² × 0,5 × 10<sup>−3</sup> m = ${c('2,3 kg')}`),
        { tol: .05, dec: 1, diag: v => (pr(v, 2300) ? 'L\'épaisseur doit être en m : e = 0,5 mm = 0,5 × 10<sup>−3</sup> m.' : pr(v, 2.3e-3) || pr(v, .23) ? 'V = S × e avec S en m² et e = 0,5 × 10<sup>−3</sup> m.' : 'm = ρ × V = ρ × S × e.') }),
    ].concat(etapes(PROBLEMES.bac(), { sans: ['sens'] }).map((p, k, l) => (k === 0 ? Object.assign(p, { q: '2 à 4. ' + p.q }) : p)), [
      { type: 'grille', q: '5. Quels sont les appareils M<sub>1</sub> et M<sub>2</sub> ?', options: [o('A', 'ampèremètre (intensité)'), o('V', 'voltmètre (tension)')],
        lignes: [
          { id: 'm1', label: 'M<sub>1</sub>', bonne: 'A', indices: { V: 'M<sub>1</sub> est sur le fil, en série : le courant le traverse.' } },
          { id: 'm2', label: 'M<sub>2</sub>', bonne: 'V', indices: { A: 'M<sub>2</sub> est branché entre les deux fils, en dérivation.' } }],
        correction: '<p>M<sub>1</sub>, en série : <b>ampèremètre</b>, il mesure l\'intensité. M<sub>2</sub>, en dérivation : <b>voltmètre</b>, il mesure la tension.</p>' },
      { type: 'schema', titrePalette: 'Bornes', q: '6. Place les bornes des appareils : fais glisser chaque étiquette sur une borne.',
        schema: schemaPose('circuit', {}, { b1: slot('b1'), b2: slot('b2'), b3: slot('b3'), b4: slot('b4') }),
        etiquettes: [
          { id: 'com1', label: 'COM', cible: ['b2', 'b4'], indice: 'Le courant entre dans l\'ampèremètre par la borne A et en sort par la borne COM ; pour le voltmètre, la borne COM est du côté de la borne − de la batterie.' },
          { id: 'com2', label: 'COM', cible: ['b2', 'b4'], indice: 'Le courant entre dans l\'ampèremètre par la borne A et en sort par la borne COM ; pour le voltmètre, la borne COM est du côté de la borne − de la batterie.' },
          { id: 'A', label: 'A', cible: 'b1', indice: 'Le courant sort par la borne + (en haut) et traverse M<sub>1</sub> de gauche à droite : il entre par la borne A.' },
          { id: 'V', label: 'V', cible: 'b3', indice: 'La borne V du voltmètre est du côté de la borne + de la batterie (fil du haut).' }],
        correction: `<p>M<sub>1</sub> : le courant entre par A (à gauche) et sort par <b>COM</b> (à droite). M<sub>2</sub> : V en haut (côté +), <b>COM</b> en bas (côté −).</p>${dessin('circuit', { com: true })}` },
      nombre('7. Incertitude-type de la tension (deux décimales).', 'u(U) =', .005 * 28.02 + .04, 'V',
        '<p>Valeur lue : 28,02 V, sur le calibre 60 V : 1 digit = 10 mV = 0,01 V.</p>' + calc(`u(U) = ${CE.fr('0,5', '100')} × 28,02 + 4 × 0,01 ≈ ${c('0,18 V')}`),
        { tol: .006, dec: 2, diag: v => (pr(v, .005 * 28.02) ? 'Ajoute les 4 digits : 4 × 0,01 V.' : pr(v, .005 * 28.02 + .004) ? 'Calibre 60 V : 1 digit = 10 mV = 0,01 V (pas 1 mV).' : pr(v, .5 * 28.02 + .04) ? '0,5 % = 0,5 / 100.' : 'u = 0,5 % × 28,02 + 4 × 0,01.') }),
      { type: 'schema', titrePalette: 'Étiquettes', q: '8. Complète la chaîne énergétique de la résistance chauffante.',
        schema: chaineEnergie({ entree: { slot: 'in' }, conv: { slot: 'conv' }, sortie: { slot: 'out' } }),
        etiquettes: [
          { id: 'el', label: 'énergie électrique', cible: 'in', indice: 'La résistance reçoit de l\'énergie électrique de la batterie.' },
          { id: 'res', label: 'résistance', cible: 'conv', indice: 'Le convertisseur est l\'élément chauffant : la résistance.' },
          { id: 'th', label: 'énergie thermique', cible: 'out', indice: 'La résistance chauffe l\'aile : elle fournit de l\'énergie thermique.' },
          { id: 'lum', label: 'énergie lumineuse', cible: null, indice: 'Une résistance chauffante ne sert pas à éclairer.' },
          { id: 'mot', label: 'moteur', cible: null, indice: 'Un moteur fournit de l\'énergie mécanique : ici, c\'est une résistance.' }],
        correction: chaineEnergie({ entree: 'énergie électrique', conv: 'résistance', sortie: 'énergie thermique' }) },
      nombre('9. Puissance de la batterie pour alimenter toutes les résistances.', 'P =', 1250, 'W', calc(`P = 5 × P<sub>E</sub> = 5 × 250 W = ${c('1 250 W')}`),
        { tol: .5, diag: v => (pr(v, 250) ? 'Il y a cinq éléments chauffants de 250 W chacun.' : pr(v, 28 * 250) ? 'La batterie alimente 5 résistances de 250 W : P = 5 × 250.' : 'P = 5 × 250.') }),
      nombre('10. Durée t<sub>1</sub> du dégivrage, en secondes.', 't<sub>1</sub> =', dt, 's',
        calc('E = P × Δt, donc Δt = E / P') + calc(`Δt = ${CE.fr('8,14 × 10<sup>5</sup> J', '1 250 W')} ≈ ${c('651 s')}`),
        { tol: 3, affiche: '651', diag: v => (pr(v, E * 1250) ? 'Δt = E / P : on divise l\'énergie par la puissance.' : pr(v, E / 250) ? 'Utilise la puissance totale des cinq résistances : 1 250 W.' : 'Δt = 8,14 × 10<sup>5</sup> / 1 250.') }),
      nombre('Convertis cette durée en minutes (une décimale).', 't<sub>1</sub> =', dt / 60, 'min', calc(`t<sub>1</sub> = 651 / 60 ≈ ${c('10,9 min')}`) + '<p>(La correction écrit 10,8 min : 651,2 / 60 ≈ 10,85, soit 10,9 min.)</p>',
        { tol: .11, dec: 1, diag: v => (pr(v, dt / 100) ? '1 min = 60 s (pas 100 s).' : pr(v, dt * 60) ? 'Pour passer des secondes aux minutes, on divise par 60.' : 't = 651 / 60.') }),
      choix('Cette durée est-elle réaliste ?', [o('oui', 'oui : une dizaine de minutes, c\'est compatible avec la préparation d\'un avion'), o('non', 'non : c\'est beaucoup trop long')], 'oui',
        '<p>Une dizaine de minutes : cette durée paraît <b>réaliste</b> par rapport à la durée totale de préparation d\'un avion avant le décollage.</p>',
        { indices: { non: 'Compare avec la préparation d\'un avion avant le décollage (embarquement, vérifications) : bien plus de 10 minutes.' } }),
    ]),
  };

  window.CE.EXERCICES = [ex13, ex14, ex10, ex15, ex7, ex8, ex17, exBac];
  window.CE.GROUPES_EX = [
    { id: 'energie', titre: 'Énergie et changements d\'état' },
    { id: 'diagrammes', titre: 'Diagrammes d\'état' },
    { id: 'matiere', titre: 'États de la matière et liaison hydrogène' },
    { id: 'bilans', titre: 'Bilans d\'énergie' },
  ];
})();
