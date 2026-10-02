/* ============================================================
   Banque de questions — application « Combustions »
   BANQUE.equilibrage()   module 1 : 10 combustions à équilibrer
   BANQUE.module3()       masse, quantité de matière, masse molaire
   BANQUE.module4()       relations stœchiométriques
   BANQUE.module5()       énergie libérée, pouvoir calorifique
   BANQUE.EXERCICES       module 6 : 10 exercices complets
   BANQUE.exercice(e)     étapes d'un exercice complet
   ============================================================ */
(function () {
  'use strict';

  const { COMB, M, calculM, coefs, equation, fmt, fH, hasard, melanger } = window.CO;
  const DONNEES = 'Données : M(C) = 12 g/mol ; M(H) = 1 g/mol ; M(O) = 16 g/mol.';
  const nf = f => `n(${fH(f)})`, mf = f => `m(${fH(f)})`, Mf = f => `M(${fH(f)})`;
  const nom = f => COMB[f] ? COMB[f].nom : '';
  const deDu = f => (/^[aeéiou]/i.test(nom(f)) ? 'd\'' : 'de ') + nom(f);
  // fraction écrite en HTML
  const frac = (a, b) => `<span class="co-frac"><span>${a}</span><span>${b}</span></span>`;

  /* ============================================================
     MODULE 1 : équilibrer des combustions
     ============================================================ */
  const ENTIERS_FACILES = ['CH4', 'C2H4', 'C3H8', 'C2H6O'];
  const ENTIERS = ['C5H12', 'C7H16', 'C3H6O', 'C4H10O', 'C6H12O6'];
  const DEMIS_FACILES = ['C2H6', 'C4H10', 'C2H2', 'CH4O'];
  const DEMIS = ['C8H18', 'C6H6', 'C6H14', 'C3H6', 'C3H8O'];

  function qCombustion(f, avecEspeces, comptes) {
    const c = coefs(f), demi = c[0] === 2;
    const parties = [];
    if (avecEspeces) parties.push({ type: 'especes', comb: f, q: `Complète l'équation de la combustion du ${nom(f)} avec les bonnes espèces.` });
    parties.push({ type: 'equilibrer', comb: f, comptes, q: `Équilibre la réaction : d'abord C, puis H, et O en dernier.`, solution: `<span class="er-eq">${equation(f)}</span>` });
    return {
      theme: `Combustion du ${nom(f)}`,
      consigne: avecEspeces ? '' : `Équation de la combustion du ${nom(f)} : ${fH(f)} + ${fH('O2')} → ${fH('CO2')} + ${fH('H2O')}`,
      parties,
      bilan: demi
        ? `Avec 1 ${fH(f)}, il aurait fallu ${fmt(c[1] / 2)} ${fH('O2')} : un demi est interdit, on a donc multiplié tous les nombres par 2.`
        : `Carbone, puis hydrogène, puis oxygène : ${c[2]} ${fH('CO2')}, ${c[3]} ${fH('H2O')}, puis ${c[1]} ${fH('O2')}.`,
    };
  }
  function equilibrage() {
    const qs = [];
    melanger(ENTIERS_FACILES).slice(0, 2).forEach(f => qs.push(qCombustion(f, true, true)));
    melanger(ENTIERS_FACILES.concat(ENTIERS)).filter(f => !qs.some(q => q.theme.includes(nom(f)))).slice(0, 2)
      .forEach(f => qs.push(qCombustion(f, true, false)));
    const d = melanger(DEMIS_FACILES).slice(0, 2);
    qs.push(qCombustion(d[0], true, true));
    qs.push(qCombustion(d[1], false, false));
    melanger(ENTIERS).filter(f => !qs.some(q => q.theme.includes(nom(f)))).slice(0, 2).forEach(f => qs.push(qCombustion(f, false, false)));
    melanger(DEMIS).slice(0, 2).forEach(f => qs.push(qCombustion(f, false, false)));
    return qs;
  }

  /* ============================================================
     MODULE 3 : m, n et M
     ============================================================ */
  const MOLECULES = ['H2O', 'CO2', 'O2', 'CH4', 'C2H6O', 'C3H8', 'C4H10', 'C2H6', 'CH4O', 'C2H2'];
  const GRANDES = ['C2H6O', 'C3H8', 'C4H10', 'C6H12O6', 'C8H18', 'C3H6O'];
  const FORMULES = {
    n: { options: [['ok', 'n = m / M'], ['a', 'n = m × M'], ['b', 'n = M / m']], unites: 'g ÷ (g/mol) = mol', donne: 'une quantité de matière en mol' },
    m: { options: [['ok', 'm = n × M'], ['a', 'm = n / M'], ['b', 'm = M / n']], unites: 'mol × g/mol = g', donne: 'une masse en g' },
    M: { options: [['ok', 'M = m / n'], ['a', 'M = m × n'], ['b', 'M = n / m']], unites: 'g ÷ mol = g/mol', donne: 'une masse molaire en g/mol' },
  };
  const pFormule = (g, q) => ({
    type: 'choix', q: q || 'Quelle formule faut-il utiliser ?',
    options: melanger(FORMULES[g].options.map(([id, label]) => ({ id, label }))), bonne: 'ok',
    indice: `Vérifie avec les unités : la formule doit donner ${FORMULES[g].donne}.`,
    solution: `Vérification avec les unités : ${FORMULES[g].unites}.`,
  });
  const pUnite = (g, calcul, bonne, autres) => ({
    type: 'choix', q: `Vérifie avec les unités : ${calcul} donne…`,
    options: melanger([bonne].concat(autres).map(u => ({ id: u, label: u }))), bonne,
    indice: 'Les unités se simplifient comme des nombres : g ÷ g = 1, mol × (1/mol) = 1.',
    solution: `${calcul} = <b>${bonne}</b> : la formule donne bien ${FORMULES[g].donne.replace(/ en .*/, '')}.`,
  });
  const pM = f => ({
    type: 'valeur', q: `Calcule la masse molaire ${Mf(f)}.`, label: `${Mf(f)} =`, valeur: M(f), unite: 'gmol', unites: ['g', 'mol', 'gmol'],
    indice: `Additionne les masses molaires de tous les atomes de la molécule : chaque masse est multipliée par le nombre d'atomes (l'indice).`,
    solution: calculM(f),
  });
  const pN = (f, m) => ({
    type: 'valeur', q: `Calcule la quantité de matière ${nf(f)}.`, label: `${nf(f)} =`, valeur: m / M(f), unite: 'mol', unites: ['g', 'mol', 'gmol'],
    indice: 'n = m / M, avec m en g et M en g/mol.',
    solution: `${nf(f)} = ${frac(mf(f), Mf(f))} = ${frac(fmt(m), M(f))} = ${fmt(m / M(f))} mol`,
  });
  const pMasse = (f, n) => ({
    type: 'valeur', q: `Calcule la masse ${mf(f)}.`, label: `${mf(f)} =`, valeur: n * M(f), unite: 'g', unites: ['g', 'mol', 'gmol'],
    indice: 'm = n × M, avec n en mol et M en g/mol.',
    solution: `${mf(f)} = ${nf(f)} × ${Mf(f)} = ${fmt(n)} × ${M(f)} = ${fmt(n * M(f))} g`,
  });

  function module3() {
    const qs = [];
    qs.push({ theme: 'Choisir la bonne formule', consigne: 'On connaît la masse m d\'un échantillon et la masse molaire M de l\'espèce. On veut sa <b>quantité de matière n</b>.',
      parties: [pFormule('n'), pUnite('n', 'g ÷ (g/mol)', 'mol', ['g', 'g²/mol'])], bilan: 'n = m / M : n en mol, m en g, M en g/mol.' });
    qs.push({ theme: 'Choisir la bonne formule', consigne: 'On connaît la quantité de matière n et la masse molaire M. On veut la <b>masse m</b> de l\'échantillon.',
      parties: [pFormule('m'), pUnite('m', 'mol × g/mol', 'g', ['mol', 'g/mol²'])], bilan: 'm = n × M : m en g, n en mol, M en g/mol.' });
    qs.push({ theme: 'Choisir la bonne formule', consigne: 'On connaît la masse m et la quantité de matière n d\'un échantillon. On veut la <b>masse molaire M</b>.',
      parties: [pFormule('M'), pUnite('M', 'g ÷ mol', 'g/mol', ['g × mol', 'mol/g'])], bilan: 'M = m / n : M en g/mol.' });
    // n = m / M, M donnée
    const mols = melanger(MOLECULES);
    [[2, 3, 0.5, 4], [0.25, 0.2, 1.5, 0.4]].forEach((liste, k) => {
      const f = mols[k], n = hasard(liste), m = n * M(f);
      qs.push({ theme: 'Calculer une quantité de matière', consigne: `Un échantillon de ${fH(f)} a une masse ${mf(f)} = ${fmt(m)} g. Sa masse molaire est ${Mf(f)} = ${M(f)} g/mol.`,
        parties: [pFormule('n'), pN(f, m)], bilan: `${nf(f)} = ${fmt(n)} mol.` });
    });
    // m = n × M, M donnée
    const f6 = mols[2], n6 = hasard([0.5, 1.5, 2.5, 0.2]);
    qs.push({ theme: 'Calculer une masse', consigne: `On dispose de ${nf(f6)} = ${fmt(n6)} mol de ${fH(f6)}, de masse molaire ${Mf(f6)} = ${M(f6)} g/mol.`,
      parties: [pFormule('m'), pMasse(f6, n6)], bilan: `${mf(f6)} = ${fmt(n6 * M(f6))} g.` });
    // M à calculer
    const f7 = hasard(['H2O', 'CO2', 'CH4', 'O2']);
    qs.push({ theme: 'Calculer une masse molaire', consigne: `${DONNEES}`, parties: [pM(f7)], bilan: calculM(f7) + '.' });
    const g = melanger(GRANDES);
    qs.push({ theme: 'Calculer une masse molaire', consigne: `${DONNEES}`, parties: [pM(g[0])], bilan: calculM(g[0]) + '.' });
    // n à partir de m, M à calculer
    const f9 = g[1], n9 = hasard([0.5, 2, 0.25, 1.5]);
    qs.push({ theme: 'Masse molaire puis quantité de matière', consigne: `On brûle ${fmt(n9 * M(f9))} g de ${fH(f9)}. ${DONNEES}`,
      parties: [pM(f9), pN(f9, n9 * M(f9))], bilan: `${calculM(f9)}, puis ${nf(f9)} = ${fmt(n9 * M(f9))} / ${M(f9)} = ${fmt(n9)} mol.` });
    // m à partir de n, M à calculer
    const f10 = hasard(['CO2', 'H2O']), n10 = hasard([1.5, 0.3, 2.5, 0.6]);
    qs.push({ theme: 'Masse molaire puis masse', consigne: `Une combustion produit ${nf(f10)} = ${fmt(n10)} mol de ${fH(f10)}. ${DONNEES}`,
      parties: [pM(f10), pMasse(f10, n10)], bilan: `${calculM(f10)}, puis ${mf(f10)} = ${fmt(n10)} × ${M(f10)} = ${fmt(n10 * M(f10))} g.` });
    return qs;
  }

  /* ============================================================
     MODULE 4 : relations stœchiométriques
     ============================================================ */
  const ESP = ['comb', 'O2', 'CO2', 'H2O'];
  const formuleEsp = (f, k) => (k === 0 ? f : ESP[k]);
  // relation complète : n(comb)/a = n(O2)/b = n(CO2)/c = n(H2O)/d
  const relation = f => coefs(f).map((c, k) => frac(nf(formuleEsp(f, k)), c)).join(' = ');
  // n(cible) à partir de n(source)
  function pRelation(f, kSrc, nSrc, kCib) {
    const c = coefs(f), S = formuleEsp(f, kSrc), C = formuleEsp(f, kCib), v = nSrc * c[kCib] / c[kSrc];
    const verbe = kCib < 2 ? 'consommée' : 'formée';
    const coefTxt = c[kSrc] === 1 ? `${c[kCib]}` : `${frac(c[kCib], c[kSrc])}`;
    return {
      type: 'valeur', q: `Quelle quantité de ${fH(C)} est ${verbe} ?`, label: `${nf(C)} =`, valeur: v, unite: 'mol', unites: ['mol', 'g', 'gmol'],
      indice: `Utilise la relation ${frac(nf(S), c[kSrc])} = ${frac(nf(C), c[kCib])}.`,
      solution: `${frac(nf(S), c[kSrc])} = ${frac(nf(C), c[kCib])} donc ${nf(C)} = ${coefTxt} × ${nf(S)} = ${coefTxt} × ${fmt(nSrc)} = ${fmt(v)} mol`,
    };
  }
  const eqEnonce = f => `<p class="co-eq">${equation(f)}</p>`;

  function module4() {
    const qs = [];
    // 1 et 2 : méthane, nombres entiers
    const n1 = hasard([1, 2]);
    qs.push({ theme: 'Combustion du méthane', enonce: eqEnonce('CH4'), consigne: `${fmt(n1)} mol de méthane ${fH('CH4')} brûle${n1 > 1 ? 'nt' : ''}.`,
      parties: [pRelation('CH4', 0, n1, 1)], bilan: 'Pour 1 mol de CH<sub>4</sub>, 2 mol de O<sub>2</sub> sont consommées.' });
    const n2 = hasard([3, 4, 5]);
    qs.push({ theme: 'Combustion du méthane', enonce: eqEnonce('CH4'), consigne: `${n2} mol de méthane brûlent.`,
      parties: [pRelation('CH4', 0, n2, 3)], bilan: `${nf('H2O')} = 2 × ${nf('CH4')}.` });
    // 3 : la relation écrite
    const p3 = hasard(['C3H8', 'C5H12']), c3 = coefs(p3);
    qs.push({ theme: 'Écrire la relation', enonce: eqEnonce(p3), consigne: `Combustion du ${nom(p3)}.`,
      parties: [
        { type: 'choix', q: 'Quelle relation lie les quantités de matière de combustible consommé et de CO<sub>2</sub> formé ?', colonne: true,
          options: melanger([
            { id: 'ok', label: `${frac(nf(p3), 1)} = ${frac(nf('CO2'), c3[2])}` },
            { id: 'a', label: `${frac(nf(p3), c3[2])} = ${frac(nf('CO2'), 1)}` },
            { id: 'b', label: `${nf(p3)} × 1 = ${nf('CO2')} × ${c3[2]}` },
          ]), bonne: 'ok',
          indice: 'Chaque quantité de matière est divisée par son propre nombre stœchiométrique.', solution: relation(p3) },
        { type: 'choix', q: `Donc ${nf('CO2')} = … × ${nf(p3)}`, options: melanger([c3[2], 1, c3[1]].map(v => ({ id: String(v), label: String(v) })).concat([{ id: 'f', label: frac(1, c3[2]) }])),
          bonne: String(c3[2]), indice: `Multiplie les deux membres de la relation par ${c3[2]}.`, solution: `${nf('CO2')} = ${c3[2]} × ${nf(p3)} : il se forme ${c3[2]} fois plus de CO<sub>2</sub> que de ${nom(p3)} consommé.` },
      ], bilan: relation(p3) });
    // 4 et 5 : propane
    const n4 = hasard([0.2, 0.3, 0.4]);
    qs.push({ theme: 'Combustion du propane', enonce: eqEnonce('C3H8'), consigne: `${fmt(n4)} mol de propane brûlent.`, parties: [pRelation('C3H8', 0, n4, 2)], bilan: relation('C3H8') });
    qs.push({ theme: 'Combustion du propane', enonce: eqEnonce('C3H8'), consigne: `${fmt(n4)} mol de propane brûlent.`, parties: [pRelation('C3H8', 0, n4, 1)], bilan: relation('C3H8') });
    // 6 : éthanol, eau formée
    const n6 = hasard([0.5, 0.2, 1.5]);
    qs.push({ theme: 'Combustion de l\'éthanol', enonce: eqEnonce('C2H6O'), consigne: `${fmt(n6)} mol d'éthanol brûlent.`, parties: [pRelation('C2H6O', 0, n6, 3)], bilan: relation('C2H6O') });
    // 7 : à l'envers
    const n7 = hasard([0.9, 1.2, 0.6]);
    qs.push({ theme: 'Dans l\'autre sens', enonce: eqEnonce('C3H8'), consigne: `La combustion de propane a formé ${fmt(n7)} mol de CO<sub>2</sub>.`,
      parties: [Object.assign(pRelation('C3H8', 2, n7, 0), { q: 'Quelle quantité de propane a été consommée ?' })], bilan: `${nf('C3H8')} = ${frac(nf('CO2'), 3)}.` });
    // 8 : nombre stœchiométrique du combustible égal à 2
    const f8 = hasard(['C4H10', 'C2H6']), c8 = coefs(f8), r8 = c8[2] / c8[0], n8 = hasard([0.5, 0.2, 0.4]);
    qs.push({ theme: `Combustion ${deDu(f8)}`, enonce: eqEnonce(f8), consigne: `${fmt(n8)} mol ${deDu(f8)} brûlent. Attention : le nombre stœchiométrique du combustible n'est pas 1.`,
      parties: [
        { type: 'choix', q: `${nf('CO2')} = … × ${nf(f8)}`, options: melanger([String(r8), String(c8[2]), frac(c8[0], c8[2]), '1'].map((label, k) => ({ id: 'o' + k, label }))), bonne: 'o0',
          indice: `${frac(nf(f8), c8[0])} = ${frac(nf('CO2'), c8[2])} : multiplie par ${c8[2]}.`, solution: `${nf('CO2')} = ${frac(c8[2], c8[0])} × ${nf(f8)} = ${r8} × ${nf(f8)}` },
        pRelation(f8, 0, n8, 2),
      ], bilan: relation(f8) });
    // 9 : dioxygène avec un nombre stœchiométrique 2 pour le combustible
    const n9 = hasard([0.4, 0.2, 0.6]);
    qs.push({ theme: 'Combustion de l\'éthane', enonce: eqEnonce('C2H6'), consigne: `${fmt(n9)} mol d'éthane brûlent.`, parties: [pRelation('C2H6', 0, n9, 1)], bilan: relation('C2H6') });
    // 10 : octane, deux produits
    const n10 = hasard([0.1, 0.2, 0.5]);
    qs.push({ theme: 'Combustion de l\'octane (essence)', enonce: eqEnonce('C8H18'), consigne: `${fmt(n10)} mol d'octane brûlent.`,
      parties: [pRelation('C8H18', 0, n10, 2), pRelation('C8H18', 0, n10, 3)], bilan: relation('C8H18') });
    return qs;
  }

  /* ============================================================
     MODULE 5 : énergie libérée
     ============================================================ */
  // tableau de proportionnalité : une colonne par grandeur (énergie, masse)
  const table = (l1, l2) => `<table class="co-prop"><tr><th>Énergie (MJ)</th><th>Masse (kg)</th></tr>${l1.map((v, k) => `<tr><td>${v}</td><td>${l2[k]}</td></tr>`).join('')}</table>`;
  const pE = (f, mkg) => {
    const PC = COMB[f].PC, E = PC * mkg;
    return {
      type: 'valeur', q: 'Calcule l\'énergie libérée.', label: 'E =', valeur: E, unite: 'MJ', unites: ['MJ', 'kg', 'MJkg'],
      indice: `Le pouvoir calorifique est l'énergie libérée par 1 kg : E = PC × m, avec m en kg.`,
      solution: `${table([fmt(PC), '<b class="x">E</b>'], ['1', fmt(mkg)])}E = ${fmt(PC)} × ${fmt(mkg)} = ${fmt(E)} MJ`,
    };
  };
  const pConv = g => ({
    type: 'valeur', q: `Convertis la masse en kg.`, label: 'm =', valeur: g / 1000, unite: 'kg', uniteFixe: true,
    indice: '1 kg = 1 000 g : divise par 1 000.', solution: `m = ${fmt(g)} g = ${fmt(g)} / 1 000 kg = ${fmt(g / 1000)} kg`,
  });
  const pMasseE = (f, E, unites) => {
    const PC = COMB[f].PC, m = E / PC;
    return {
      type: 'valeur', q: `Calcule la masse ${deDu(f)} à brûler.`, label: 'm =', valeur: m, unite: 'kg', unites: unites || ['kg', 'MJ', 'MJkg'],
      indice: `1 kg libère ${fmt(PC)} MJ : m = E / PC, résultat en kg.`,
      solution: `${table([fmt(PC), fmt(E)], ['1', '<b class="x">m</b>'])}m = ${fmt(E)} / ${fmt(PC)} = ${fmt(m)} kg${m < 1 ? ` = ${fmt(m * 1000)} g` : ''}`,
    };
  };
  const pcTxt = f => `Pouvoir calorifique : PC(${nom(f)}) = ${fmt(COMB[f].PC)} MJ/kg.`;

  function module5() {
    const qs = [];
    qs.push({ theme: 'Le pouvoir calorifique', consigne: 'Le pouvoir calorifique du méthane est PC = 50 MJ/kg. Que signifie cette valeur ?',
      parties: [{ type: 'choix', colonne: true, options: melanger([
        { id: 'ok', label: 'La combustion de 1 kg de méthane libère 50 MJ.' },
        { id: 'g', label: 'La combustion de 1 g de méthane libère 50 MJ.' },
        { id: 'mol', label: 'La combustion de 1 mol de méthane libère 50 MJ.' },
        { id: 'inv', label: 'Il faut brûler 50 kg de méthane pour libérer 1 MJ.' },
      ]), bonne: 'ok', indice: 'Regarde l\'unité : MJ/kg, des mégajoules par kilogramme.', solution: 'PC en MJ/kg : énergie (MJ) libérée par la combustion de 1 kg de combustible.' }],
      bilan: 'Le pouvoir calorifique est l\'énergie libérée par la combustion d\'un kilogramme de combustible.' });
    const f2 = hasard(['CH4', 'C3H8', 'C4H10']), m2 = hasard([2, 3, 5, 0.5]);
    qs.push({ theme: 'Calculer l\'énergie libérée', consigne: `On brûle ${fmt(m2)} kg de ${nom(f2)}. ${pcTxt(f2)}`, parties: [pE(f2, m2)], bilan: `E = PC × m = ${fmt(COMB[f2].PC * m2)} MJ.` });
    const g3 = hasard([250, 1500, 80, 400]);
    qs.push({ theme: 'Les unités de masse', consigne: `Le pouvoir calorifique est donné en MJ par kg : il faut souvent convertir la masse. Un échantillon a une masse de ${fmt(g3)} g.`,
      parties: [pConv(g3)], bilan: `${fmt(g3)} g = ${fmt(g3 / 1000)} kg.` });
    const f4 = hasard(['C3H8', 'C4H10', 'C7H16']), g4 = hasard([200, 500, 300]);
    qs.push({ theme: 'Masse en grammes', consigne: `On brûle ${fmt(g4)} g de ${nom(f4)}. ${pcTxt(f4)}`, parties: [pConv(g4), pE(f4, g4 / 1000)], bilan: `E = ${fmt(COMB[f4].PC)} × ${fmt(g4 / 1000)} = ${fmt(COMB[f4].PC * g4 / 1000)} MJ.` });
    qs.push({ theme: 'L\'exemple du cours', consigne: `On brûle 23 g d'éthanol. ${pcTxt('C2H6O')}`, parties: [pConv(23), pE('C2H6O', 0.023)], bilan: 'E = 28,8 × 0,023 ≈ 0,66 MJ.' });
    qs.push({ theme: 'Calculer la masse de combustible', consigne: 'On connaît l\'énergie E à obtenir et le pouvoir calorifique PC du combustible. On cherche la masse m à brûler.',
      parties: [{ type: 'choix', q: 'Quelle formule faut-il utiliser ?', options: melanger([{ id: 'ok', label: 'm = E / PC' }, { id: 'a', label: 'm = E × PC' }, { id: 'b', label: 'm = PC / E' }]), bonne: 'ok',
        indice: 'Vérifie avec les unités : le résultat doit être en kg.', solution: 'Vérification avec les unités : MJ ÷ (MJ/kg) = kg.' }],
      bilan: 'm = E / PC : m en kg, E en MJ, PC en MJ/kg.' });
    const f7 = hasard(['C7H16', 'C4H10', 'C6H14']), m7 = hasard([2, 4, 3]);
    qs.push({ theme: 'Calculer la masse de combustible', consigne: `On veut obtenir ${fmt(COMB[f7].PC * m7)} MJ en brûlant du ${nom(f7)}. ${pcTxt(f7)}`, parties: [pMasseE(f7, COMB[f7].PC * m7)], bilan: `m = E / PC = ${fmt(m7)} kg.` });
    const E8 = hasard([1.5, 2, 0.5]);
    qs.push({ theme: 'Calculer la masse de combustible', consigne: `On veut obtenir ${fmt(E8)} MJ en brûlant du méthane. ${pcTxt('CH4')} Donne le résultat en g ou en kg.`,
      parties: [pMasseE('CH4', E8, ['g', 'kg', 'MJ'])], bilan: `m = ${fmt(E8)} / 50 = ${fmt(E8 / 50)} kg = ${fmt(E8 / 50 * 1000)} g.` });
    const g9 = hasard([10, 20, 40]);
    qs.push({ theme: 'Énergie en kilojoules', consigne: `Un briquet brûle ${g9} g de butane. ${pcTxt('C4H10')} Donne l'énergie en MJ ou en kJ (1 MJ = 1 000 kJ).`,
      parties: [Object.assign(pE('C4H10', g9 / 1000), { unites: ['MJ', 'kJ', 'kg'] })], bilan: `E = 45 × ${fmt(g9 / 1000)} = ${fmt(45 * g9 / 1000)} MJ = ${fmt(45 * g9)} kJ.` });
    const f10 = hasard(['C2H6O', 'CH4O']), E10 = hasard([23, 46]);
    qs.push({ theme: 'Comparer des combustibles', consigne: `On veut obtenir ${E10} MJ. Pouvoirs calorifiques : PC(${nom(f10)}) = ${fmt(COMB[f10].PC)} MJ/kg ; PC(propane) = 46 MJ/kg.`,
      parties: [pMasseE(f10, E10), pMasseE('C3H8', E10),
        { type: 'choix', q: 'Quel combustible faut-il brûler en plus faible masse pour obtenir cette énergie ?', options: [{ id: f10, label: `le ${nom(f10)}` }, { id: 'C3H8', label: 'le propane' }], bonne: 'C3H8',
          indice: 'Compare les deux masses calculées.', solution: 'Le propane a le plus grand pouvoir calorifique : il faut en brûler une plus petite masse.' }],
      bilan: 'Plus le pouvoir calorifique est grand, plus la masse à brûler pour une même énergie est petite.' });
    return qs;
  }

  /* ============================================================
     MODULE 6 : exercices complets (10 exercices différents)
     m : masse de combustible (g) ; E : énergie demandée (MJ) si on cherche la masse ;
     extra : 'O2' (n de dioxygène consommé) ou 'H2O' (masse d'eau formée)
     ============================================================ */
  const EXERCICES = [
    { f: 'CH4', m: 80, titre: 'La gazinière', texte: 'Une gazinière brûle 80 g de méthane CH<sub>4</sub>, principal constituant du gaz naturel.' },
    { f: 'C3H8', m: 220, titre: 'Le barbecue', texte: 'Un barbecue au gaz brûle 220 g de propane C<sub>3</sub>H<sub>8</sub>.', extra: 'O2' },
    { f: 'C4H10', m: 29, titre: 'Le camping', texte: 'Un réchaud de camping brûle 29 g de butane C<sub>4</sub>H<sub>10</sub>.', E: 2.25 },
    { f: 'C2H6O', m: 92, titre: 'Le bioéthanol', texte: 'Une voiture roulant au bioéthanol brûle 92 g d\'éthanol C<sub>2</sub>H<sub>6</sub>O.', extra: 'H2O' },
    { f: 'C8H18', m: 1140, titre: 'L\'essence', texte: 'Un moteur à essence brûle 1 140 g d\'octane C<sub>8</sub>H<sub>18</sub>.' },
    { f: 'C2H6', m: 60, titre: 'L\'éthane', texte: 'Une torchère brûle 60 g d\'éthane C<sub>2</sub>H<sub>6</sub>.', extra: 'O2' },
    { f: 'CH4O', m: 64, titre: 'Le réchaud à alcool', texte: 'Un réchaud brûle 64 g de méthanol CH<sub>4</sub>O.', E: 10 },
    { f: 'C6H12O6', m: 90, titre: 'La respiration', texte: 'Dans les cellules, la respiration « brûle » 90 g de glucose C<sub>6</sub>H<sub>12</sub>O<sub>6</sub> comme une combustion.', extra: 'H2O' },
    { f: 'C2H2', m: 52, titre: 'Le chalumeau', texte: 'Un chalumeau de soudeur brûle 52 g d\'acétylène C<sub>2</sub>H<sub>2</sub>.' },
    { f: 'C7H16', m: 200, titre: 'Le groupe électrogène', texte: 'Un groupe électrogène brûle 200 g d\'heptane C<sub>7</sub>H<sub>16</sub>.', E: 90 },
  ];

  function exercice(e) {
    const f = e.f, c = coefs(f), n = e.m / M(f), nCO2 = n * c[2] / c[0], PC = COMB[f].PC;
    const qs = [];
    qs.push({ theme: '1. L\'équation de la combustion', parties: [
      { type: 'especes', comb: f, q: `Complète l'équation de la combustion du ${nom(f)}.` },
      { type: 'equilibrer', comb: f, q: 'Équilibre la réaction (C, puis H, puis O).', solution: `<span class="er-eq">${equation(f)}</span>` },
    ], bilan: c[0] === 2 ? 'Le demi-nombre de O<sub>2</sub> a été évité en multipliant tous les nombres par 2.' : '' });
    qs.push({ theme: '2. Quantité de matière de combustible', consigne: `Calcule la quantité de matière de ${nom(f)} brûlé (${fmt(e.m)} g).`,
      parties: [pM(f), pN(f, e.m)], bilan: `${nf(f)} = ${fmt(n)} mol.` });
    qs.push({ theme: '3. Quantité de matière de CO₂ formé', consigne: 'Utilise la relation stœchiométrique.',
      parties: [pRelation(f, 0, n, 2)], bilan: relation(f) });
    qs.push({ theme: '4. Masse de CO₂ formé', parties: [pM('CO2'), pMasse('CO2', nCO2)],
      bilan: `${mf('CO2')} = ${fmt(nCO2 * 44)} g${nCO2 * 44 >= 1000 ? ` = ${fmt(nCO2 * 44 / 1000)} kg` : ''}.` });
    if (e.extra === 'O2') {
      qs.push({ theme: '5. Dioxygène consommé', consigne: 'On peut aussi calculer les quantités des autres espèces.', parties: [pRelation(f, 0, n, 1)], bilan: relation(f) });
    } else if (e.extra === 'H2O') {
      const nH = n * c[3] / c[0];
      qs.push({ theme: '5. Masse d\'eau formée', consigne: 'On peut aussi calculer les quantités des autres espèces.', parties: [pRelation(f, 0, n, 3), pM('H2O'), pMasse('H2O', nH)],
        bilan: `${mf('H2O')} = ${fmt(nH * 18)} g.` });
    }
    const num = qs.length + 1;
    if (e.E) {
      qs.push({ theme: `${num}. Masse de combustible pour une énergie donnée`, consigne: `On veut obtenir une énergie de ${fmt(e.E)} MJ. Quelle masse de ${nom(f)} faut-il brûler ?`,
        parties: [Object.assign(pMasseE(f, e.E, ['g', 'kg', 'MJ']), { q: '' })], bilan: `m = E / PC = ${fmt(e.E)} / ${fmt(PC)} = ${fmt(e.E / PC)} kg.` });
    } else {
      qs.push({ theme: `${num}. Énergie libérée`, consigne: `Calcule l'énergie libérée par la combustion des ${fmt(e.m)} g de ${nom(f)}.`,
        parties: [pConv(e.m), Object.assign(pE(f, e.m / 1000), { q: '' })], bilan: `E = ${fmt(PC)} × ${fmt(e.m / 1000)} = ${fmt(PC * e.m / 1000)} MJ.` });
    }
    return qs;
  }

  window.BANQUE = { equilibrage, module3, module4, module5, EXERCICES, exercice, relation, frac, DONNEES, qCombustion, pM, pN, pMasse, pRelation, pE, pConv, pMasseE, table };
})();
