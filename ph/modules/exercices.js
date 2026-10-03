/* ============================================================
   Exercices du module 3 (application « pH »)

   Chaque exercice : { id, groupe, titre, desc, contexte (HTML),
   parties: [p] } ; chaque partie suit le format de PH.PARTIES
   (choix, nombre, sci, tableau, equation) avec p.q (question) et
   p.correction (correction détaillée, toujours consultable).
   ============================================================ */
(function () {
  'use strict';

  const { fmt, sci, H3O, UNITE, diagPH, diagC } = window.PH;
  const M = window.PH.MOINS;
  const { T, S, P, F, FN } = window.PH.EQ;
  const pHde = c => -Math.log10(c);
  const e10 = n => `10<sup>${fmt(n)}</sup>`;

  // grandeurs des équations
  const tH = T('c', H3O), t0 = T('c0', 'c°'), tp = T('pH', 'pH'), tc = T('c', 'c');
  const fracH = (t) => F(S(t || tH), S(t0));

  /* ---------- Fabriques de parties ---------- */
  // pH calculé à partir d'une concentration c (mol/L) ; cTxt : écriture de c dans la correction
  function partiePH(q, c, cTxt, opts) {
    const ph = pHde(c);
    return Object.assign({ type: 'nombre', q, label: 'pH =', valeur: ph, tol: .051, diag: v => diagPH(v, ph, c),
      indice: `pH = ${M}log(${H3O} / c°), avec ${H3O} en ${UNITE} et c° = 1 ${UNITE}.`,
      correction: `<p class="ph-calc">pH = ${M}log(${H3O} / c°) = ${M}log(${cTxt || sci(c, 2)} / 1) = <span class="c">${fmt(ph, 1)}</span></p>` }, opts);
  }
  // concentration calculée à partir d'un pH
  function partieC(q, ph, opts) {
    const c = Math.pow(10, -ph);
    return Object.assign({ type: 'sci', q, label: `${H3O} =`, unite: UNITE, valeur: c, diag: v => diagC(v, c, ph),
      indice: `${H3O} = c° × 10<sup>${M}pH</sup>, avec c° = 1 ${UNITE}.`,
      correction: `<p class="ph-calc">${H3O} = c° × 10<sup>${M}pH</sup> = 1 × 10<sup>${M}${fmt(ph, ph % 1 ? 1 : 0)}</sup> = <span class="c">${sci(c, 2)} ${UNITE}</span></p>` }, opts);
  }
  const nombre = (q, label, valeur, correction, opts) => Object.assign({ type: 'nombre', q, label, valeur, tol: 1e-9, entier: Number.isInteger(valeur), correction }, opts);
  const choix = (q, options, bonne, correction, opts) => Object.assign({ type: 'choix', q, options, bonne, correction, colonne: true }, opts);
  const calc = h => `<p class="ph-calc">${h}</p>`;

  // valeurs de test des équations de la relation du pH (c° varie pour vérifier sa place)
  function valeursPH(id) {
    return () => {
      const c0 = .5 + Math.random() * 2.5, c = Math.pow(10, -1 - Math.random() * 11), o = { c0, pH: -Math.log10(c / c0) };
      o[id || 'c'] = c;
      return o;
    };
  }

  const EXERCICES = [

    /* ============================================================
       LE LOGARITHME, SANS CONTEXTE
       ============================================================ */
    { id: 'L1', groupe: 'log', titre: 'Calculer sans calculatrice', desc: 'log d\'un produit, d\'un quotient, regrouper deux log.',
      contexte: '<p class="er-contexte">Calcule sans calculatrice, en utilisant les propriétés de la fonction log.</p>',
      parties: [
        nombre(null, `log(10<sup>3</sup> × 10<sup>${M}5</sup>) =`, -2, calc(`log(10<sup>3</sup> × 10<sup>${M}5</sup>) = log(10<sup>3</sup>) + log(10<sup>${M}5</sup>) = 3 + (${M}5) = <span class="c">${M}2</span>`) + '<p>Propriété : log(a × b) = log a + log b.</p>',
          { indice: 'log(a × b) = log a + log b, et log(10<sup>a</sup>) = a.' }),
        nombre(null, 'log(10<sup>4</sup> / 10<sup>7</sup>) =', -3, calc(`log(10<sup>4</sup> / 10<sup>7</sup>) = log(10<sup>4</sup>) − log(10<sup>7</sup>) = 4 − 7 = <span class="c">${M}3</span>`) + '<p>Propriété : log(a / b) = log a − log b.</p>',
          { indice: 'log(a / b) = log a − log b.' }),
        nombre(null, 'log(2) + log(5) =', 1, calc('log(2) + log(5) = log(2 × 5) = log(10) = <span class="c">1</span>'), { indice: 'Regroupe en un seul log : log a + log b = log(a × b).' }),
        nombre(null, 'log(50) − log(5) =', 1, calc('log(50) − log(5) = log(50 / 5) = log(10) = <span class="c">1</span>'), { indice: 'Regroupe en un seul log : log a − log b = log(a / b).' }),
      ] },

    { id: 'L2', groupe: 'log', titre: 'Avec log 2 ≈ 0,30', desc: 'Décomposer un nombre pour calculer son log sans calculatrice.',
      contexte: '<p class="er-contexte">On donne <b>log 2 ≈ 0,30</b>. Calcule sans calculatrice, en décomposant chaque nombre à l\'aide de 2 et de puissances de 10.</p>',
      parties: [
        nombre(null, `log(2 × 10<sup>${M}3</sup>) ≈`, -2.7, calc(`log(2 × 10<sup>${M}3</sup>) = log 2 + log(10<sup>${M}3</sup>) ≈ 0,30 − 3 = <span class="c">${M}2,70</span>`), { tol: .006, indice: 'log(a × b) = log a + log b.' }),
        nombre(null, 'log(5) ≈', 0.7, calc('5 = 10 / 2, donc log(5) = log 10 − log 2 ≈ 1 − 0,30 = <span class="c">0,70</span>'), { tol: .006, indice: 'Écris 5 = 10 / 2.' }),
        nombre(null, 'log(8 × 10<sup>4</sup>) ≈', 4.9, calc('log(8 × 10<sup>4</sup>) = log(2<sup>3</sup>) + log(10<sup>4</sup>) = 3 log 2 + 4 ≈ 0,90 + 4 = <span class="c">4,90</span>'), { tol: .006, indice: '8 = 2<sup>3</sup> et log(a<sup>n</sup>) = n log a.' }),
        nombre(null, 'log(0,5) ≈', -0.3, calc(`0,5 = 1 / 2, donc log(0,5) = log 1 − log 2 ≈ 0 − 0,30 = <span class="c">${M}0,30</span>`), { tol: .006, indice: 'Écris 0,5 = 1 / 2.' }),
      ] },

    { id: 'L3', groupe: 'log', titre: 'Exercice 18 : le « point maths »', desc: 'Résoudre deux équations, puis calculer des valeurs approchées.',
      contexte: `<p class="er-contexte"><b>1.</b> Résoudre les équations suivantes. L'inconnue est le réel h ou le réel strictement positif G.<br>
        &nbsp; a. 10<sup>h</sup> = 100 &nbsp; &nbsp; b. log(G / 10) = ${M}3</p>
        <p class="er-contexte" style="margin-top:6px"><b>2.</b> En utilisant la calculatrice, donner les valeurs approchées avec trois chiffres significatifs de :
        a = log(2) ; b = log(5 × 10<sup>${M}7</sup>) ; c = 2 log(5) − 5 log(2) ; A = 10<sup>${M}0,1</sup> ; B = 10<sup>0,5</sup> ; C = 5 × 10<sup>${M}7,2</sup>.</p>`,
      parties: [
        nombre('1. a. Résoudre 10<sup>h</sup> = 100.', 'h =', 2, calc('10<sup>h</sup> = 100 ⇔ h = log(100) = log(10<sup>2</sup>) = <span class="c">2</span>'), { indice: 'y = log(x) ⇔ x = 10<sup>y</sup>.' }),
        { type: 'equation', q: `1. b. Exprime G à partir de log(G / 10) = ${M}3, par glisser-déposer.`, eq: {
          tuiles: [T('G', 'G'), T('dix', '10', 10), T('trois', '3', 3)], cible: 'G', valeurs: () => ({ G: .01 }),
          gauche: () => P(FN('log', F(S(T('G', 'G')), S(T('dix', '10', 10))))), droite: () => P(S(T('trois', '3', 3)), true),
          aides: ['Applique la fonction 10<sup>x</sup>, réciproque de log, aux deux membres.', 'G est divisé par 10 : glisse le dénominateur 10 de l\'autre côté, il multipliera.', 'Inverse le sens de l\'équation avec ⇄.'],
          solution: [
            { L: P(FN('log', F(S(T('G', 'G')), S(T('dix', '10', 10))))), R: P(S(T('trois', '3', 3)), true) },
            { op: '10<sup>x</sup>', L: P(F(S(T('G', 'G')), S(T('dix', '10', 10)))), R: P(FN('p10', P(S(T('trois', '3', 3)), true))), texte: '10<sup>log a</sup> = a' },
            { op: '× 10', L: P(S(T('G', 'G'))), R: P([S(T('dix', '10', 10)), FN('p10', P(S(T('trois', '3', 3)), true))]), final: true },
          ] },
          correction: calc(`log(G / 10) = ${M}3 ⇔ G / 10 = 10<sup>${M}3</sup> ⇔ <span class="c">G = 10 × 10<sup>${M}3</sup></span>`) },
        nombre('1. b. Calcule G.', 'G =', .01, calc(`G = 10 × 10<sup>${M}3</sup> = 10<sup>${M}2</sup> = <span class="c">0,01</span>`), { tol: 1e-9, entier: false, indice: `10 × 10<sup>${M}3</sup> = 10<sup>1 + (${M}3)</sup>.` }),
        nombre('2. a = log(2)', 'a ≈', Math.log10(2), calc('a = log(2) ≈ <span class="c">0,301</span>'), { tol: .0006, indice: 'Trois chiffres significatifs : 0,301.' }),
        nombre(`2. b = log(5 × 10<sup>${M}7</sup>)`, 'b ≈', Math.log10(5e-7), calc(`b = log(5 × 10<sup>${M}7</sup>) = log 5 + log(10<sup>${M}7</sup>) ≈ 0,699 − 7 ≈ <span class="c">${M}6,30</span>`), { tol: .006, indice: 'Tape log(5×10^(-7)) avec les parenthèses.' }),
        nombre('2. c = 2 log(5) − 5 log(2)', 'c ≈', 2 * Math.log10(5) - 5 * Math.log10(2), calc(`c = 2 log(5) − 5 log(2) ≈ 1,398 − 1,505 ≈ <span class="c">${M}0,107</span>`), { tol: .0006, indice: 'Calcule 2 × log(5), puis 5 × log(2), puis la différence.' }),
        nombre(`2. A = 10<sup>${M}0,1</sup>`, 'A ≈', Math.pow(10, -.1), calc(`A = 10<sup>${M}0,1</sup> ≈ <span class="c">0,794</span>`), { tol: .0006, indice: 'Touche 10<sup>x</sup>, pas e<sup>x</sup>.' }),
        nombre('2. B = 10<sup>0,5</sup>', 'B ≈', Math.pow(10, .5), calc('B = 10<sup>0,5</sup> ≈ <span class="c">3,16</span>'), { tol: .006, indice: 'Touche 10<sup>x</sup>.' }),
        { type: 'sci', q: `2. C = 5 × 10<sup>${M}7,2</sup>`, label: 'C ≈', valeur: 5 * Math.pow(10, -7.2), rel: .003, cs: 3,
          indice: 'Tape 5×10^(-7,2).', correction: calc(`C = 5 × 10<sup>${M}7,2</sup> ≈ <span class="c">3,15 × 10<sup>${M}7</sup></span>`) },
      ] },

    { id: 'L4', groupe: 'log', titre: 'Exprimer une grandeur', desc: 'Manipuler par glisser-déposer des équations avec log et 10<sup>x</sup>.',
      contexte: '<p class="er-contexte">Exprime la grandeur demandée par glisser-déposer. Une opération (×(−1), 10<sup>x</sup>, log) se fait toujours sur les deux membres.</p>',
      parties: (() => {
        const tx = T('x', 'x'), ty = T('y', 'y'), ta = T('a', 'a'), tb = T('b', 'b');
        const v = () => { const a = .5 + Math.random() * 4, x = .1 + Math.random() * 50; return { a, x, y: Math.log10(x / a), b: x }; };
        const v2 = () => { const a = .5 + Math.random() * 4, y = Math.random() * 4 - 2; return { a, y, b: a * Math.pow(10, y) }; };
        const v3 = () => { const x = Math.pow(10, -Math.random() * 6); return { x, y: -Math.log10(x) }; };
        return [
          { type: 'equation', q: 'a. Exprime x à partir de y = log(x / a).', eq: { tuiles: [tx, ty, ta], cible: 'x', valeurs: v,
            gauche: () => P(S(ty)), droite: () => P(FN('log', F(S(tx), S(ta)))),
            aides: ['Applique 10<sup>x</sup> aux deux membres.', 'a divise x : glisse le dénominateur a de l\'autre côté.', 'Inverse le sens de l\'équation avec ⇄.'],
            solution: [{ L: P(S(ty)), R: P(FN('log', F(S(tx), S(ta)))) }, { op: '10<sup>x</sup>', L: P(FN('p10', P(S(ty)))), R: P(F(S(tx), S(ta))) },
              { op: '× a', L: P([S(ta), FN('p10', P(S(ty)))]), R: P(S(tx)) }, { centre: '⇄', L: P(S(tx)), R: P([S(ta), FN('p10', P(S(ty)))]), final: true }] },
            correction: calc('y = log(x / a) ⇔ 10<sup>y</sup> = x / a ⇔ <span class="c">x = a × 10<sup>y</sup></span>') },
          { type: 'equation', q: 'b. Exprime y à partir de b = a × 10<sup>y</sup>.', eq: { tuiles: [ty, ta, tb], cible: 'y', valeurs: v2,
            gauche: () => P(S(tb)), droite: () => P([S(ta), FN('p10', P(S(ty)))]),
            aides: ['a multiplie 10<sup>y</sup> : glisse la barre de fraction sur b, puis a dans le dénominateur.', 'Applique log aux deux membres.', 'Inverse le sens de l\'équation avec ⇄.'],
            solution: [{ L: P(S(tb)), R: P([S(ta), FN('p10', P(S(ty)))]) }, { op: '÷ a', L: P(F(S(tb), S(ta))), R: P(FN('p10', P(S(ty)))) },
              { op: 'log', L: P(FN('log', F(S(tb), S(ta)))), R: P(S(ty)) }, { centre: '⇄', L: P(S(ty)), R: P(FN('log', F(S(tb), S(ta)))), final: true }] },
            correction: calc('b = a × 10<sup>y</sup> ⇔ b / a = 10<sup>y</sup> ⇔ <span class="c">y = log(b / a)</span>') },
          { type: 'equation', q: `c. Exprime x à partir de y = ${M}log(x).`, eq: { tuiles: [tx, ty], cible: 'x', valeurs: v3,
            gauche: () => P(S(ty)), droite: () => P(FN('log', P(S(tx))), true),
            aides: ['Enlève le signe − devant log avec ×(−1), sur les deux membres.', 'Applique 10<sup>x</sup> aux deux membres.', 'Inverse le sens de l\'équation avec ⇄.'],
            solution: [{ L: P(S(ty)), R: P(FN('log', P(S(tx))), true) }, { op: '×(−1)', L: P(S(ty), true), R: P(FN('log', P(S(tx)))) },
              { op: '10<sup>x</sup>', L: P(FN('p10', P(S(ty), true))), R: P(S(tx)) }, { centre: '⇄', L: P(S(tx)), R: P(FN('p10', P(S(ty), true))), final: true }] },
            correction: calc(`y = ${M}log(x) ⇔ ${M}y = log(x) ⇔ <span class="c">x = 10<sup>${M}y</sup></span>`) },
        ];
      })() },

    /* ============================================================
       EXERCICES DU COURS
       ============================================================ */
    { id: 'E11a', groupe: 'cours', titre: 'Exercice 11 : tableau avec calculatrice', desc: `Compléter un tableau ${H3O} / pH.`,
      contexte: `<p class="er-contexte">Recopier puis compléter le tableau ci-dessous en utilisant une calculatrice.</p>`,
      parties: [{ type: 'tableau', q: 'Complète chaque colonne : pH avec une décimale, concentration avec deux chiffres significatifs.',
        cols: [{ c: .1, cTxt: '0,10', trouver: 'ph', ph: 1 }, { ph: 2, trouver: 'c', c: 1e-2 }, { c: 3.7e-8, trouver: 'ph', ph: pHde(3.7e-8) }, { ph: 8.4, trouver: 'c', c: Math.pow(10, -8.4) }],
        correction: calc(`pH = ${M}log(0,10) = <span class="c">1,0</span><br>${H3O} = 10<sup>${M}2,0</sup> = <span class="c">1,0 × 10<sup>${M}2</sup> ${UNITE}</span><br>
          pH = ${M}log(3,7 × 10<sup>${M}8</sup>) = <span class="c">7,4</span><br>${H3O} = 10<sup>${M}8,4</sup> = <span class="c">4,0 × 10<sup>${M}9</sup> ${UNITE}</span>`) }] },

    { id: 'E11b', groupe: 'cours', titre: 'Exercice 11 : tableau sans calculatrice', desc: 'Utiliser log(10<sup>a</sup>) = a et log(a × b).',
      contexte: `<p class="er-contexte">Compléter le tableau <b>sans utiliser de calculatrice</b>.</p><p class="ph-donnees">Donnée : 10<sup>${M}10,1</sup> = 7,9 × 10<sup>${M}11</sup></p>`,
      parties: [{ type: 'tableau', q: 'Complète chaque colonne sans calculatrice.',
        cols: [{ c: 1e-4, cTxt: `1,0 × 10<sup>${M}4</sup>`, trouver: 'ph', ph: 4 }, { ph: 5, trouver: 'c', c: 1e-5 }, { c: 7.9e-10, cTxt: `7,9 × 10<sup>${M}10</sup>`, trouver: 'ph', ph: 9.1 }, { ph: 10.1, trouver: 'c', c: 7.9e-11 }],
        correction: calc(`pH = ${M}log(10<sup>${M}4</sup>) = <span class="c">4,0</span><br>${H3O} = 10<sup>${M}5,0</sup> = <span class="c">1,0 × 10<sup>${M}5</sup> ${UNITE}</span><br>
          7,9 × 10<sup>${M}10</sup> = 10 × 7,9 × 10<sup>${M}11</sup> = 10<sup>1</sup> × 10<sup>${M}10,1</sup>, donc<br>pH = ${M}log(10<sup>1</sup> × 10<sup>${M}10,1</sup>) = ${M}[log(10<sup>1</sup>) + log(10<sup>${M}10,1</sup>)] = ${M}(1 − 10,1) = <span class="c">9,1</span><br>
          ${H3O} = 10<sup>${M}10,1</sup> = <span class="c">7,9 × 10<sup>${M}11</sup> ${UNITE}</span> (donnée)`) + '<p>La 3<sup>e</sup> colonne utilise la propriété log(a × b) = log a + log b.</p>' }] },

    { id: 'E12', groupe: 'cours', titre: 'Exercice 12 : la digestion', desc: 'Un pH, puis une concentration.',
      contexte: `<p class="er-contexte">1. Dans l'intestin, la digestion des protéines est réalisée en présence d'ions oxonium à la concentration ${H3O} = 5,0 × 10<sup>${M}9</sup> ${UNITE}.<br>
        2. Le pH moyen du suc gastrique est de 1,5.</p>`,
      parties: [
        partiePH('1. Calculer le pH de cette solution aqueuse.', 5e-9, `5,0 × 10<sup>${M}9</sup>`),
        partieC('2. Calculer la concentration en ions oxonium du suc gastrique.', 1.5),
      ] },

    { id: 'E13', groupe: 'cours', titre: 'Exercice 13 : le sang', desc: 'Intervalle de concentration, pH minimal et maximal.',
      contexte: `<p class="er-contexte">Le sang est une solution aqueuse complexe dont le pH est régulé grâce à la respiration et à l'action des reins.</p>
        <p class="ph-donnees">• Le pH du sang artériel d'un être humain en bonne santé varie entre 7,35 et 7,45.<br>
        • Des cellules s'endommagent irréversiblement si la concentration en ions oxonium est inférieure à 1,6 × 10<sup>${M}8</sup> ${UNITE} ou supérieure à 1,6 × 10<sup>${M}7</sup> ${UNITE}.</p>`,
      parties: [
        partieC(`1. Calculer ${H3O} pour pH = 7,35.`, 7.35),
        partieC(`1. Calculer ${H3O} pour pH = 7,45.`, 7.45),
        choix('1. En déduire l\'intervalle de la concentration en ions oxonium du sang artériel :', [
          { id: 'ok', label: `3,5 × 10<sup>${M}8</sup> ${UNITE} ≤ ${H3O} ≤ 4,5 × 10<sup>${M}8</sup> ${UNITE}` },
          { id: 'a', label: `4,5 × 10<sup>${M}8</sup> ${UNITE} ≤ ${H3O} ≤ 3,5 × 10<sup>${M}8</sup> ${UNITE}` },
          { id: 'b', label: `7,35 ≤ ${H3O} ≤ 7,45` }], 'ok',
          '<p>Le plus grand pH (7,45) correspond à la plus petite concentration (3,5 × 10<sup>−8</sup> mol·L<sup>−1</sup>).</p>', { indice: 'Plus le pH est grand, plus la concentration est petite.' }),
        partiePH('2. Calculer la valeur minimale du pH du sang artériel pour que les cellules ne soient pas irréversiblement endommagées.', 1.6e-7, `1,6 × 10<sup>${M}7</sup>`, {
          diag: v => (Math.abs(v - pHde(1.6e-8)) < .06 ? 'Le pH minimal correspond à la concentration <b>maximale</b> en ions oxonium.' : diagPH(v, pHde(1.6e-7), 1.6e-7)),
          correction: '<p>Le pH le plus petit correspond à la concentration la plus grande : 1,6 × 10<sup>−7</sup> mol·L<sup>−1</sup>.</p>' + calc(`pH<sub>min</sub> = ${M}log(1,6 × 10<sup>${M}7</sup>) = <span class="c">6,8</span>`) }),
        partiePH('3. En déduire la valeur maximale du pH.', 1.6e-8, `1,6 × 10<sup>${M}8</sup>`, {
          correction: '<p>Le pH maximal correspond à la concentration minimale, 1,6 × 10<sup>−8</sup> mol·L<sup>−1</sup>, qui est 10 fois plus petite que 1,6 × 10<sup>−7</sup> mol·L<sup>−1</sup> :</p>' +
            calc(`pH<sub>max</sub> = ${M}log(1,6 × 10<sup>${M}7</sup> / 10) = ${M}log(1,6 × 10<sup>${M}7</sup>) + log 10 = 6,8 + 1 = <span class="c">7,8</span>`) + '<p>(propriété log(a / b) = log a − log b)</p>' }),
      ] },

    { id: 'E14', groupe: 'cours', titre: 'Exercice 14 : pH après dilution', desc: 'Effet d\'une dilution au dixième sur le pH.',
      contexte: `<p class="er-contexte">On étudie une solution de chlorure d'hydrogène (H<sub>3</sub>O<sup>+</sup> + Cl<sup>${M}</sup>) de concentration c = 2,8 × 10<sup>${M}2</sup> ${UNITE} ; on a donc ${H3O} = c.</p>`,
      parties: [
        choix('1. Exprimer le pH de cette solution :', [
          { id: 'ok', label: PH.EQ.ligne(P(S(tp)), P(FN('log', fracH(tc)), true)) },
          { id: 'a', label: PH.EQ.ligne(P(S(tp)), P(FN('log', fracH(tc)))) },
          { id: 'b', label: PH.EQ.ligne(P(S(tp)), P([S(t0), FN('p10', P(S(tc), true))])) }], 'ok',
          `<p>${H3O} = c, donc pH = ${M}log(c / c°).</p>`, { indice: 'Utilise la définition du pH, avec [H<sub>3</sub>O<sup>+</sup>] = c.' }),
        partiePH('1. Calculer la valeur du pH.', 2.8e-2, `2,8 × 10<sup>${M}2</sup>`),
        { type: 'sci', q: '2. Calculer la concentration c\' des ions après une dilution au dixième.', label: 'c\' =', unite: UNITE, valeur: 2.8e-3,
          indice: 'Une dilution au dixième divise la concentration par 10.',
          correction: calc(`c' = c / 10 = 2,8 × 10<sup>${M}2</sup> / 10 = <span class="c">2,8 × 10<sup>${M}3</sup> ${UNITE}</span>`) },
        partiePH('3. En déduire le pH de la solution diluée.', 2.8e-3, `2,8 × 10<sup>${M}3</sup>`),
        choix('3. Quel est l\'effet de la dilution au dixième sur le pH d\'une solution acide ?', [
          { id: 'ok', label: 'le pH augmente d\'une unité' }, { id: 'a', label: 'le pH diminue d\'une unité' },
          { id: 'b', label: 'le pH est multiplié par 10' }, { id: 'c', label: 'le pH ne change pas' }], 'ok',
          '<p>1,6 → 2,6 : le pH augmente de 1. Avec les propriétés du log :</p>' + calc(`pH' = ${M}log(c / (10 c°)) = ${M}[log(c / c°) − log 10] = pH + 1`),
          { indice: 'Compare les deux pH calculés.' }),
      ] },

    { id: 'E15', groupe: 'cours', titre: 'Exercice 15 : le soda', desc: 'pH d\'une boisson et risque pour les dents.',
      contexte: `<p class="er-contexte">Sur l'étiquette d'un soda, on peut lire la liste des ingrédients suivante : <i>eau gazéifiée au dioxyde de carbone, sucre, colorant (caramel), conservateur (acide benzoïque), acidifiant (acide phosphorique), extraits végétaux, caféine, arômes naturels.</i></p>
        <p class="er-contexte" style="margin-top:6px">La concentration en ions oxonium de la boisson est ${H3O} = 3,2 mmol·L<sup>−1</sup>. Un aliment peut déminéraliser la surface dentaire (et provoquer une carie) si sa consommation fait diminuer le pH de la salive à une valeur inférieure à 5,7.</p>`,
      parties: [
        partiePH('1. Déterminer le pH de cette boisson.', 3.2e-3, `3,2 × 10<sup>${M}3</sup>`, {
          diag: v => (Math.abs(v - pHde(3.2)) < .06 ? `Convertis d'abord en ${UNITE} : 3,2 mmol·L<sup>−1</sup> = 3,2 × 10<sup>${M}3</sup> ${UNITE}.` : diagPH(v, pHde(3.2e-3), 3.2e-3)),
          correction: `<p>3,2 mmol·L<sup>−1</sup> = 3,2 × 10<sup>${M}3</sup> ${UNITE}.</p>` + calc(`pH = ${M}log(3,2 × 10<sup>${M}3</sup> / 1) = <span class="c">2,5</span>`) }),
        choix('2. Commenter sa composition.', [
          { id: 'ok', label: 'Elle contient des acides (acide benzoïque, acide phosphorique, dioxyde de carbone dissous) : c\'est cohérent avec son pH acide.' },
          { id: 'a', label: 'Elle ne contient aucun acide : son pH devrait être supérieur à 7.' },
          { id: 'b', label: 'Le sucre est responsable de son pH.' }], 'ok',
          '<p>L\'acide phosphorique (acidifiant), l\'acide benzoïque (conservateur) et le dioxyde de carbone dissous rendent la boisson acide : pH = 2,5.</p>'),
        partieC('3. a. Déterminer la concentration en ions oxonium à partir de laquelle la surface dentaire risque une déminéralisation (pH = 5,7).', 5.7),
        choix('3. b. La boisson présente-t-elle un risque pour la surface dentaire ?', [
          { id: 'ok', label: `Oui : ${H3O} = 3,2 × 10<sup>${M}3</sup> ${UNITE} est bien supérieure à 2,0 × 10<sup>${M}6</sup> ${UNITE} (pH = 2,5 &lt; 5,7).` },
          { id: 'a', label: `Non : 3,2 × 10<sup>${M}3</sup> ${UNITE} est inférieure à 2,0 × 10<sup>${M}6</sup> ${UNITE}.` },
          { id: 'b', label: 'Non : le pH de la boisson est inférieur à 5,7.' }], 'ok',
          '<p>Le pH de la boisson (2,5) est bien inférieur à 5,7 : boire ce soda peut faire diminuer le pH de la salive sous 5,7. Risque de déminéralisation.</p>'),
      ] },

    { id: 'E16', groupe: 'cours', titre: 'Exercice 16 : l\'acide sulfurique', desc: 'pH d\'une solution mère et d\'une solution diluée 5 fois.',
      contexte: `<p class="er-contexte">Une solution d'acide sulfurique de concentration 8,0 × 10<sup>${M}2</sup> ${UNITE} en acide apporté doit être diluée 5 fois. Il faut préparer 200,0 mL d'acide dilué. L'acide sulfurique réagit totalement avec l'eau :</p>
        <p class="ph-formule" style="font-size:1.05rem">2 H<sub>2</sub>O(l) + H<sub>2</sub>SO<sub>4</sub>(l) → 2 H<sub>3</sub>O<sup>+</sup>(aq) + SO<sub>4</sub><sup>2${M}</sup>(aq)</p>`,
      parties: [
        { type: 'sci', q: `1. Concentration en ions oxonium ${H3O} de la solution mère :`, label: `${H3O} =`, unite: UNITE, valeur: .16,
          diag: v => (PH.proche(v, .08, .03) ? 'D\'après l\'équation, une molécule de H<sub>2</sub>SO<sub>4</sub> donne <b>deux</b> ions H<sub>3</sub>O<sup>+</sup>.' : null),
          indice: 'Regarde les nombres stœchiométriques de l\'équation.',
          correction: '<p>D\'après l\'équation, 1 H<sub>2</sub>SO<sub>4</sub> donne 2 H<sub>3</sub>O<sup>+</sup> :</p>' + calc(`${H3O} = 2 × 8,0 × 10<sup>${M}2</sup> = <span class="c">1,6 × 10<sup>${M}1</sup> ${UNITE}</span>`) },
        partiePH('1. Déterminer le pH de la solution mère.', .16, '0,16', { tol: .051 }),
        choix('2. Indiquer la verrerie nécessaire à la dilution.', [
          { id: 'ok', label: 'une pipette jaugée de 40,0 mL et une fiole jaugée de 200,0 mL' },
          { id: 'a', label: 'une éprouvette graduée de 40 mL et un bécher de 200 mL' },
          { id: 'b', label: 'une pipette jaugée de 5,0 mL et une fiole jaugée de 200,0 mL' },
          { id: 'c', label: 'une pipette jaugée de 40,0 mL et un bécher de 200 mL' }], 'ok',
          '<p>Facteur de dilution F = 5 : volume à prélever = 200,0 / 5 = 40,0 mL, avec une pipette jaugée ; on complète dans une fiole jaugée de 200,0 mL.</p>'),
        { type: 'sci', q: `3. Déterminer la concentration en ions oxonium de la solution diluée.`, label: `${H3O}' =`, unite: UNITE, valeur: .032,
          indice: 'Diluer 5 fois divise la concentration par 5.',
          correction: calc(`${H3O}' = ${H3O} / 5 = 0,16 / 5 = <span class="c">3,2 × 10<sup>${M}2</sup> ${UNITE}</span>`) },
        partiePH('4. En déduire le pH de la solution diluée.', .032, `3,2 × 10<sup>${M}2</sup>`),
      ] },

    { id: 'E17', groupe: 'cours', titre: 'Exercice 17 : l\'acide iodhydrique', desc: 'Couple acide / base, équation, pH d\'une solution.',
      contexte: `<p class="er-contexte">Bernard Courtois a découvert l'iode en 1811 et a mis en évidence l'acide iodhydrique HI(g) en 1813. On prépare 1 L de solution par barbotage de 20 mL de HI(g) dans l'eau. L'acide réagit totalement avec l'eau.</p>
        <p class="ph-donnees">Donnée : volume molaire des gaz à température ambiante V<sub>m</sub> = 24 L·mol<sup>−1</sup>. (La question 1, schéma de Lewis, n'est pas reprise ici.)</p>`,
      parties: [
        choix('2. Justifier le caractère acide de HI.', [
          { id: 'ok', label: 'HI peut céder un ion H<sup>+</sup> : c\'est un acide de Brønsted.' },
          { id: 'a', label: 'HI peut capter un ion H<sup>+</sup>.' },
          { id: 'b', label: 'HI contient de l\'iode.' }], 'ok', '<p>Un acide est une espèce capable de céder un ion H<sup>+</sup> : HI → I<sup>−</sup> + H<sup>+</sup>.</p>'),
        choix('3. Identifier sa base conjuguée.', [
          { id: 'ok', label: 'I<sup>−</sup>' }, { id: 'a', label: 'H<sub>2</sub>I<sup>+</sup>' }, { id: 'b', label: 'I<sub>2</sub>' }, { id: 'c', label: 'H<sub>3</sub>O<sup>+</sup>' }], 'ok',
          '<p>Couple HI / I<sup>−</sup> : HI = I<sup>−</sup> + H<sup>+</sup>.</p>', { colonne: false }),
        choix('4. Écrire l\'équation de la réaction entre l\'acide iodhydrique et l\'eau.', [
          { id: 'ok', label: 'HI + H<sub>2</sub>O → I<sup>−</sup> + H<sub>3</sub>O<sup>+</sup>' },
          { id: 'a', label: 'HI + H<sub>3</sub>O<sup>+</sup> → H<sub>2</sub>I<sup>+</sup> + H<sub>2</sub>O' },
          { id: 'b', label: 'HI + H<sub>2</sub>O → HIO + H<sub>2</sub>' }], 'ok',
          '<p>HI cède un ion H<sup>+</sup> à l\'eau (couple H<sub>3</sub>O<sup>+</sup> / H<sub>2</sub>O) : HI + H<sub>2</sub>O → I<sup>−</sup> + H<sub>3</sub>O<sup>+</sup>.</p>'),
        { type: 'sci', q: '5. Quantité de matière de HI dissous :', label: 'n(HI) =', unite: 'mol', valeur: .02 / 24,
          diag: v => (PH.proche(v, 20 / 24, .03) ? 'Convertis le volume en litres : 20 mL = 20 × 10<sup>−3</sup> L.' : null),
          indice: 'n = V / V<sub>m</sub>, avec V en litres.',
          correction: calc(`n(HI) = V / V<sub>m</sub> = 20 × 10<sup>${M}3</sup> / 24 = <span class="c">8,3 × 10<sup>${M}4</sup> mol</span>`) },
        { type: 'sci', q: `5. Concentration ${H3O} de la solution (1 L) :`, label: `${H3O} =`, unite: UNITE, valeur: .02 / 24,
          indice: 'La réaction est totale : 1 HI donne 1 H<sub>3</sub>O<sup>+</sup>. Puis [H<sub>3</sub>O<sup>+</sup>] = n / V.',
          correction: calc(`n(H<sub>3</sub>O<sup>+</sup>) = n(HI) ; ${H3O} = n / V = 8,3 × 10<sup>${M}4</sup> / 1 = <span class="c">8,3 × 10<sup>${M}4</sup> ${UNITE}</span>`) },
        partiePH('5. Déterminer le pH de la solution obtenue.', .02 / 24, `8,3 × 10<sup>${M}4</sup>`),
      ] },

    /* ============================================================
       LE LOGARITHME EN CHIMIE
       ============================================================ */
    { id: 'K1', groupe: 'chimie', titre: 'Calculer un pH sans calculatrice', desc: 'log(a × 10<sup>n</sup>) = log a + n.',
      contexte: `<p class="er-contexte">Une solution a une concentration en ions oxonium ${H3O} = 2,0 × 10<sup>${M}4</sup> ${UNITE}. On donne log 2 ≈ 0,30 et log 5 ≈ 0,70.</p>`,
      parties: [
        choix(`a. log(2,0 × 10<sup>${M}4</sup>) est égal à :`, [
          { id: 'ok', label: `log 2 + log(10<sup>${M}4</sup>)` }, { id: 'a', label: `log 2 × log(10<sup>${M}4</sup>)` },
          { id: 'b', label: `log(2 + 10<sup>${M}4</sup>)` }, { id: 'c', label: '4 × log 2' }], 'ok',
          calc(`log(2,0 × 10<sup>${M}4</sup>) = log 2 + log(10<sup>${M}4</sup>) ≈ 0,30 − 4 = ${M}3,70`), { colonne: false, indice: 'log(a × b) = log a + log b.' }),
        partiePH('b. En déduire le pH de la solution, sans calculatrice.', 2e-4, null, { correction: calc(`pH = ${M}log(2,0 × 10<sup>${M}4</sup>) = ${M}(0,30 − 4) = <span class="c">3,7</span>`) }),
        partiePH(`c. Même question pour ${H3O} = 5,0 × 10<sup>${M}3</sup> ${UNITE}.`, 5e-3, null, { correction: calc(`pH = ${M}log(5,0 × 10<sup>${M}3</sup>) = ${M}(log 5 + log(10<sup>${M}3</sup>)) = ${M}(0,70 − 3) = <span class="c">2,3</span>`) + '<p>C\'est un exemple du cours.</p>' }),
      ] },

    { id: 'K2', groupe: 'chimie', titre: 'Concentration multipliée ou divisée', desc: 'Prévoir le nouveau pH avec les propriétés du log.',
      contexte: `<p class="er-contexte">Une solution S a un pH de 4,5. On cherche le pH d'autres solutions sans calculer ${H3O}.</p>`,
      parties: [
        nombre(`a. On ajoute de l'acide : ${H3O} est multipliée par 100. Nouveau pH ?`, 'pH =', 2.5,
          calc(`pH' = ${M}log(100 × ${H3O} / c°) = ${M}[log 100 + log(${H3O} / c°)] = ${M}2 + pH = 4,5 − 2 = <span class="c">2,5</span>`),
          { tol: .051, entier: false, indice: 'log(100 × a) = log 100 + log a = 2 + log a.', diag: v => (Math.abs(v - 6.5) < .06 ? 'Plus de H<sub>3</sub>O<sup>+</sup> : le pH diminue.' : null) }),
        nombre('b. On dilue 1 000 fois une solution de pH = 2,5. Nouveau pH ?', 'pH =', 5.5,
          calc(`pH' = ${M}log(${H3O} / (1 000 c°)) = ${M}[log(${H3O} / c°) − log 1 000] = pH + 3 = 2,5 + 3 = <span class="c">5,5</span>`),
          { tol: .051, entier: false, indice: 'Diluer 1 000 fois divise [H<sub>3</sub>O<sup>+</sup>] par 1 000 = 10<sup>3</sup>.', diag: v => (Math.abs(v + .5) < .06 ? 'Une dilution diminue la concentration en ions oxonium : le pH augmente.' : null) }),
      ] },

    { id: 'K3', groupe: 'chimie', titre: 'Comparer deux solutions', desc: `Rapport des concentrations ${H3O} avec log(a / b).`,
      contexte: '<p class="er-contexte">La solution A a un pH de 3,0 ; la solution B a un pH de 5,0.</p>',
      parties: [
        choix('a. Quelle solution est la plus acide (la plus concentrée en ions oxonium) ?', [{ id: 'ok', label: 'A' }, { id: 'b', label: 'B' }], 'ok',
          '<p>Plus le pH est petit, plus la concentration en ions oxonium est grande : A.</p>', { colonne: false, melanger: false }),
        nombre(`b. Combien de fois ${H3O} est-elle plus grande dans A que dans B ?`, '[H<sub>3</sub>O<sup>+</sup>]<sub>A</sub> / [H<sub>3</sub>O<sup>+</sup>]<sub>B</sub> =', 100,
          calc(`log([H<sub>3</sub>O<sup>+</sup>]<sub>A</sub> / [H<sub>3</sub>O<sup>+</sup>]<sub>B</sub>) = log([H<sub>3</sub>O<sup>+</sup>]<sub>A</sub> / c°) − log([H<sub>3</sub>O<sup>+</sup>]<sub>B</sub> / c°) = ${M}3 − (${M}5) = 2`) +
          calc('donc [H<sub>3</sub>O<sup>+</sup>]<sub>A</sub> / [H<sub>3</sub>O<sup>+</sup>]<sub>B</sub> = 10<sup>2</sup> = <span class="c">100</span>'),
          { indice: 'log(a / b) = log a − log b, et log([H<sub>3</sub>O<sup>+</sup>] / c°) = −pH.', diag: v => (Math.abs(v - 2) < 1e-6 ? '2 est le log du rapport : le rapport vaut 10<sup>2</sup>.' : null) }),
        nombre('c. Avec la calculatrice : solution C de pH 2,7 et solution D de pH 4,2. Rapport [H<sub>3</sub>O<sup>+</sup>]<sub>C</sub> / [H<sub>3</sub>O<sup>+</sup>]<sub>D</sub> (deux chiffres significatifs) ?', 'rapport ≈', Math.pow(10, 1.5),
          calc(`log(rapport) = ${M}2,7 − (${M}4,2) = 1,5, donc rapport = 10<sup>1,5</sup> ≈ <span class="c">32</span>`),
          { rel: .025, tol: undefined, entier: false, indice: 'log(rapport) = pH<sub>D</sub> − pH<sub>C</sub>.' }),
      ] },

    { id: 'K4', groupe: 'chimie', titre: 'Exprimer la concentration d\'un acide', desc: 'Manipuler pH = −log(2c / c°) par glisser-déposer.',
      contexte: `<p class="er-contexte">Une solution d'acide sulfurique de concentration c en acide apporté contient des ions oxonium à la concentration ${H3O} = 2c (une molécule H<sub>2</sub>SO<sub>4</sub> donne deux ions H<sub>3</sub>O<sup>+</sup>). Son pH vérifie donc :</p>
        <p class="ph-formule">${PH.EQ.ligne(P(S(tp)), P(FN('log', F(S(T('deux', '2', 2), tc), S(t0))), true))}</p>`,
      parties: (() => {
        const t2 = T('deux', '2', 2);
        const sol = [
          { L: P(S(tp)), R: P(FN('log', F(S(t2, tc), S(t0))), true) },
          { op: '×(−1)', L: P(S(tp), true), R: P(FN('log', F(S(t2, tc), S(t0)))) },
          { op: '10<sup>x</sup>', L: P(FN('p10', P(S(tp), true))), R: P(F(S(t2, tc), S(t0))) },
          { op: '× c°', L: P([S(t0), FN('p10', P(S(tp), true))]), R: P(S(t2, tc)) },
          { op: '÷ 2', L: P(F(P([S(t0), FN('p10', P(S(tp), true))]), S(t2))), R: P(S(tc)) },
          { centre: '⇄', L: P(S(tc)), R: P(F(P([S(t0), FN('p10', P(S(tp), true))]), S(t2))), final: true },
        ];
        return [
          { type: 'equation', q: 'a. Exprime c en fonction du pH, par glisser-déposer.', eq: {
            tuiles: [tp, tc, t0, t2], cible: 'c', valeurs: () => { const c0 = .5 + Math.random() * 2.5, c = Math.pow(10, -2 - Math.random() * 9); return { c, c0, pH: -Math.log10(2 * c / c0) }; },
            gauche: () => P(S(tp)), droite: () => P(FN('log', F(S(t2, tc), S(t0))), true),
            aides: ['Enlève le signe − devant log avec ×(−1), sur les deux membres.', 'Applique 10<sup>x</sup> aux deux membres.', 'c° divise : glisse le dénominateur de l\'autre côté.',
              '2 multiplie c : glisse la barre de fraction sur le membre de gauche, puis 2 dans le dénominateur.', 'Inverse le sens de l\'équation avec ⇄.'],
            solution: sol },
            correction: calc(`pH = ${M}log(2c / c°) ⇔ 10<sup>${M}pH</sup> = 2c / c° ⇔ <span class="c">c = c° × 10<sup>${M}pH</sup> / 2</span>`) },
          { type: 'sci', q: 'b. Calcule c pour obtenir une solution de pH = 2,0.', label: 'c =', unite: UNITE, valeur: 5e-3,
            diag: v => (PH.proche(v, 1e-2, .03) ? 'Tu as calculé [H<sub>3</sub>O<sup>+</sup>] : il faut encore diviser par 2.' : null),
            indice: 'c = c° × 10<sup>−pH</sup> / 2.', correction: calc(`c = 1 × 10<sup>${M}2,0</sup> / 2 = <span class="c">5,0 × 10<sup>${M}3</sup> ${UNITE}</span>`) },
        ];
      })() },

    { id: 'K5', groupe: 'chimie', titre: 'Le jus de citron', desc: 'Exprimer puis calculer la concentration en ions oxonium.',
      contexte: `<p class="er-contexte">Le pH d'un jus de citron vaut 2,4. On note c la concentration en ions oxonium : pH = ${M}log(c / c°).</p>`,
      parties: [
        { type: 'equation', q: 'a. Exprime c en fonction du pH, par glisser-déposer.', eq: {
          tuiles: [tp, tc, t0], cible: 'c', valeurs: valeursPH('c'), gauche: () => P(S(tp)), droite: () => P(FN('log', fracH(tc)), true),
          aides: ['Enlève le signe − devant log avec ×(−1), sur les deux membres.', 'Applique 10<sup>x</sup> aux deux membres.', 'c° divise c : glisse le dénominateur de l\'autre côté.', 'Inverse le sens de l\'équation avec ⇄.'],
          solution: [
            { L: P(S(tp)), R: P(FN('log', fracH(tc)), true) },
            { op: '×(−1)', L: P(S(tp), true), R: P(FN('log', fracH(tc))) },
            { op: '10<sup>x</sup>', L: P(FN('p10', P(S(tp), true))), R: P(fracH(tc)) },
            { op: '× c°', L: P([S(t0), FN('p10', P(S(tp), true))]), R: P(S(tc)) },
            { centre: '⇄', L: P(S(tc)), R: P([S(t0), FN('p10', P(S(tp), true))]), final: true }] },
          correction: calc(`pH = ${M}log(c / c°) ⇔ <span class="c">c = c° × 10<sup>${M}pH</sup></span>`) },
        partieC('b. Calcule c.', 2.4, { label: 'c =' }),
      ] },
  ];

  const GROUPES_EX = [
    { id: 'log', titre: 'Le logarithme, sans contexte' },
    { id: 'cours', titre: 'Les exercices du cours' },
    { id: 'chimie', titre: 'Le logarithme en chimie' },
  ];

  window.PH.EXERCICES = EXERCICES;
  window.PH.GROUPES_EX = GROUPES_EX;
})();
