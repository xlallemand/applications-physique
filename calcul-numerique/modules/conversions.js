/* ============================================================
   Calcul numérique — les compétences de conversion (CV1 à CV10), puis l'objet CN.C
   ------------------------------------------------------------
   Utilise les outils de competences.js (CN.C0) : unités { h, e }, exposant de
   conversion E = e(départ) − e(arrivée), parties de question, diagnostics.
   CV1 (vers ou depuis l'unité sans préfixe) est la compétence clé (cle: true).
   Construit à la fin CN.C : THEMES, familles, liste, R, question(id, niv), PREF, themeDe(id).
   ============================================================ */
(function () {
  'use strict';
  const CN = window.CN;
  const N = CN.N, K = CN.C0;
  const { hasard, melanger, nb, ent, p10, ecr } = N;
  const { PR, U, UL, valConv, partieConv, partieExp, partiePref, solConv, sens, nbP, choixP, question, calc, c, fix, par, dit, ajouter } = K;

  /* ---------- Unités courantes pour chaque préfixe ---------- */
  const UNITES = { k: ['m', 'g', 'W', 'J', 'Hz', 'V', 'Pa'], c: ['m', 'L'], m: ['m', 'g', 's', 'A', 'V', 'L', 'W'], d: ['m', 'L'], h: ['Pa', 'L', 'm'],
    M: ['W', 'Hz', 'J', 'Pa'], 'µ': ['m', 'g', 's', 'A'], G: ['W', 'Hz', 'o', 'J'], n: ['m', 's'], da: ['m'], T: ['o', 'W'] };
  const PREF_NIV = { 1: ['k', 'c', 'm'], 2: ['k', 'c', 'm', 'd', 'h', 'M', 'µ'], 3: ['M', 'µ', 'G', 'n', 'da', 'h', 'd', 'T'] };
  const COEF = { 1: K.COEF1, 2: K.COEF2, 3: K.COEF3 };

  // exposant de conversion à écrire (étape intermédiaire), avec les erreurs typiques
  function partieE(o, aide) {
    const err = [[-o.E, 'C’est à l’envers : exposant = (puissance de départ) − (puissance d’arrivée). ' + sens(o)]];
    if (o.de.q && o.vers.q && o.de.q.e && o.vers.q.e && o.de.k === 1) err.push([o.de.q.e + o.vers.q.e, 'Attention aux signes : ' + ent(o.de.q.e) + ' − ' + par(o.vers.q.e) + (o.vers.q.e < 0 ? ', retrancher un nombre négatif revient à ajouter son opposé.' : '.')]);
    if (o.de.k > 1) err.push([o.de.q.e - o.vers.q.e, 'L’unité est au ' + (o.de.k === 2 ? 'carré' : 'cube') + ' : la différence des exposants est multipliée par ' + o.de.k + '.']);
    return partieExp('Exposant de conversion (' + o.de.h + ' → ' + o.vers.h + ') : 10', o.E, err, aide || 'Exposant = (puissance du préfixe de départ) − (puissance du préfixe d’arrivée).');
  }
  // une conversion entre préfixes d'une unité simple, au carré ou au cube : o = { x, p, de, vers }
  function prep(x, p, de, vers) { return { x, p, de, vers, E: de.e - vers.e }; }
  const indicesConv = o => [
    'Préfixe de départ : ' + dit(o.de.q) + ' ; préfixe d’arrivée : ' + dit(o.vers.q) + '.',
    sens(o),
    'Exposant de conversion : ' + (o.de.k > 1 ? '(' + ent(o.de.q.e) + ' − ' + par(o.vers.q.e) + ') × ' + o.de.k : ent(o.de.q.e) + ' − ' + par(o.vers.q.e)) + ' = ' + ent(o.E) + (o.p ? ', à ajouter à l’exposant ' + ent(o.p) + ' du nombre.' : '.')
  ];

  /* -------------------- CV1 : la compétence clé -------------------- */
  ajouter({ id: 'CV1', famille: 'CV', niveau: 3, prerequis: ['PR1', 'PU2'], cle: true, titre: 'Vers ou depuis l’unité sans préfixe',
    regle: 'C’est la conversion la plus utile en physique : on passe d’une unité avec préfixe à l’unité du Système international (km → m, mA → A, kW → W) ou l’inverse. On <b>recopie le nombre</b> et on le multiplie par 10 puissance <b>(préfixe de départ) − (préfixe d’arrivée)</b> ; une unité sans préfixe a la puissance 0.',
    methode: '1. Écris la puissance de 10 du préfixe (k = 10<sup>3</sup>). 2. Vers l’unité sans préfixe : on multiplie par cette puissance ; depuis l’unité sans préfixe : par la puissance de signe opposé. 3. Vérifie le sens : une unité d’arrivée plus petite demande un nombre plus grand.',
    exemple: calc('3,2&nbsp;km = 3,2 × 10<sup>3</sup>&nbsp;m = ' + c('3&nbsp;200&nbsp;m')) + calc('450&nbsp;mA = 450 × 10<sup>−3</sup>&nbsp;A = ' + c('0,45&nbsp;A')) + calc('2&nbsp;m = 2 × 10<sup>2</sup>&nbsp;cm = ' + c('200&nbsp;cm') + ' (car 0 − (−2) = 2)'),
    piege: '2 m = 200 cm, pas 0,02 cm : le centimètre est plus petit que le mètre, il en faut plus.',
    gen(niv) {
      const s = hasard(PREF_NIV[niv]), q = PR(s), u = hasard(UNITES[s]), x = hasard(COEF[niv]);
      const avec = U(q, u), sans = U(PR(''), u);
      const versBase = Math.random() < 0.55;
      const o = versBase ? prep(x, 0, avec, sans) : prep(x, 0, sans, avec);
      o.aide = '1&nbsp;' + q.s + u + ' = ' + p10(q.e) + '&nbsp;' + u + (versBase ? ' : on multiplie par ' + p10(q.e) + '.' : ' : donc 1&nbsp;' + u + ' = ' + p10(-q.e) + '&nbsp;' + q.s + u + '.');
      const parts = niv === 1 ? [partiePref(q), partieConv(o)] : [partieConv(o)];
      return question('CV1', niv, 'CV1:' + x + o.de.h + o.vers.h, 'Convertis ' + nb(x) + '&nbsp;' + o.de.h + ' en ' + o.vers.h + '. Toute écriture juste est acceptée.', parts,
        '<p>1&nbsp;' + q.s + u + ' = ' + p10(q.e) + '&nbsp;' + u + (versBase ? '' : ', donc 1&nbsp;' + u + ' = ' + p10(-q.e) + '&nbsp;' + q.s + u) + '. ' + sens(o) + '</p>' + solConv(o), indicesConv(o));
    } });

  /* -------------------- CV2 : entre deux préfixes -------------------- */
  // [départ, arrivée, unité, difficulté]
  const PAIRES = [['c', 'm', 'm', 1], ['m', 'c', 'm', 1], ['k', 'h', 'm', 1], ['c', 'm', 'L', 1], ['d', 'c', 'L', 1], ['k', 'c', 'm', 1], ['h', 'k', 'Pa', 1],
    ['k', 'm', 'm', 2], ['k', 'm', 'g', 2], ['m', 'µ', 'A', 2], ['µ', 'm', 's', 2], ['k', 'M', 'W', 2], ['M', 'k', 'Hz', 2], ['G', 'M', 'o', 2], ['m', 'µ', 'g', 2], ['d', 'm', 'L', 2],
    ['n', 'µ', 'm', 3], ['µ', 'n', 'm', 3], ['M', 'G', 'Hz', 3], ['c', 'µ', 'm', 3], ['n', 'm', 's', 3], ['G', 'k', 'W', 3], ['h', 'M', 'Pa', 3], ['µ', 'c', 'm', 3]];
  ajouter({ id: 'CV2', famille: 'CV', niveau: 4, prerequis: ['CV1'], titre: 'Entre deux préfixes',
    regle: 'La méthode est la même quand les deux unités ont un préfixe : exposant = (préfixe de départ) − (préfixe d’arrivée). On retranche souvent un nombre négatif : <b>attention aux signes</b>.',
    methode: 'Écris les deux puissances de 10, fais la différence (départ − arrivée) avec des parenthèses autour d’un exposant négatif, puis multiplie le nombre recopié.',
    exemple: calc('450&nbsp;µA → mA : −6 − (−3) = −3') + calc('450&nbsp;µA = 450 × 10<sup>−3</sup>&nbsp;mA = ' + c('0,45&nbsp;mA')),
    piege: '−6 − (−3) = −6 + 3 = −3, pas −9.',
    gen(niv) {
      const [a, b, u] = hasard(PAIRES.filter(t => t[3] === niv)), x = hasard(COEF[niv]);
      const o = prep(x, 0, U(PR(a), u), U(PR(b), u));
      const parts = niv === 1 ? [partiePref(PR(a)), partiePref(PR(b)), partieConv(o)] : niv === 2 ? [partieE(o), partieConv(o)] : [partieConv(o)];
      return question('CV2', niv, 'CV2:' + x + a + b + u, 'Convertis ' + nb(x) + '&nbsp;' + o.de.h + ' en ' + o.vers.h + '. Toute écriture juste est acceptée.', parts, solConv(o) + '<p>' + sens(o) + '</p>', indicesConv(o));
    } });

  /* -------------------- CV3 : avec une puissance de 10 -------------------- */
  ajouter({ id: 'CV3', famille: 'CV', niveau: 5, prerequis: ['CV1', 'PU3'], titre: 'Convertir un nombre qui a une puissance de 10',
    regle: 'Si le nombre est déjà écrit avec une puissance de 10, on <b>ajoute</b> l’exposant de conversion à son exposant : 10<sup>a</sup> × 10<sup>b</sup> = 10<sup>a + b</sup>.',
    methode: 'Calcule l’exposant de conversion comme d’habitude, puis additionne-le à l’exposant du nombre. Le nombre devant ne change pas.',
    exemple: calc('2,5 × 10<sup>4</sup>&nbsp;mm → m : exposant −3 − 0 = −3') + calc('2,5 × 10<sup>4</sup>&nbsp;mm = 2,5 × 10<sup>4 + (−3)</sup>&nbsp;m = ' + c('2,5 × 10<sup>1</sup>&nbsp;m = 25&nbsp;m')),
    piege: 'On additionne les exposants (produit de puissances de 10) : 2,5 × 10<sup>4</sup> mm = 2,5 × 10<sup>1</sup> m, pas 2,5 × 10<sup>−12</sup> m.',
    gen(niv) {
      let o;
      const x = hasard([1.5, 2.5, 3.2, 4.8, 6.4, 7, 9.1, 1.08]);
      const p = niv === 1 ? hasard([2, 3, 4, 5, -2, -3]) : hasard([-6, -5, -4, 4, 5, 6, 7, -8, 8]);
      if (niv < 3) {
        const s = hasard(PREF_NIV[2]), q = PR(s), u = hasard(UNITES[s]);
        o = Math.random() < 0.5 ? prep(x, p, U(q, u), U(PR(''), u)) : prep(x, p, U(PR(''), u), U(q, u));
      } else {
        const [a, b, u] = hasard(PAIRES.filter(t => t[3] >= 2));
        o = prep(x, p, U(PR(a), u), U(PR(b), u));
      }
      const parts = niv === 1 ? [partieE(o), partieConv(o)] : [partieConv(o)];
      return question('CV3', niv, 'CV3:' + x + p + o.de.h + o.vers.h, 'Convertis ' + ecr(x, p) + '&nbsp;' + o.de.h + ' en ' + o.vers.h + '. Toute écriture juste est acceptée.', parts, solConv(o), indicesConv(o));
    } });

  /* -------------------- CV4 et CV5 : unités au carré et au cube -------------------- */
  const LONG = [['c', '', 1], ['', 'c', 1], ['m', '', 1], ['k', '', 1], ['d', '', 1], ['', 'm', 2], ['m', 'c', 2], ['c', 'm', 2], ['', 'd', 2], ['', 'k', 2], ['k', 'h', 3], ['m', 'd', 3], ['d', 'c', 3], ['h', '', 3]];
  function genPuiss(id, k) {
    return function (niv) {
      const [a, b] = hasard(LONG.filter(t => t[2] === niv || (niv === 3 && t[2] === 2)));
      const x = hasard(COEF[niv === 3 ? 2 : niv]), p = niv === 3 && Math.random() < 0.5 ? hasard([2, 3, -2, -3]) : 0;
      const o = prep(x, p, U(PR(a), 'm', k), U(PR(b), 'm', k));
      const d = PR(a).e - PR(b).e, nom = k === 2 ? 'carré' : 'cube';
      const l1 = U(PR(a), 'm'), l2 = U(PR(b), 'm');
      const parts = niv === 1 ? [
        partieExp('1&nbsp;' + l1.h + ' = 10', d, [[-d, 'À l’envers : ' + ent(PR(a).e) + ' − ' + par(PR(b).e) + '.']], 'Exposant = (puissance du préfixe de départ) − (puissance du préfixe d’arrivée).', ),
        partieExp('donc 1&nbsp;' + o.de.h + ' = (10<sup>' + ent(d) + '</sup>)<sup>' + k + '</sup>&nbsp;' + o.vers.h + ' = 10', d * k, [[d, 'L’unité est au ' + nom + ' : 1&nbsp;' + o.de.h + ' = ' + (k === 2 ? '1&nbsp;' + l1.h + ' × 1&nbsp;' + l1.h : '1&nbsp;' + l1.h + ' × 1&nbsp;' + l1.h + ' × 1&nbsp;' + l1.h) + ' : on multiplie l’exposant par ' + k + '.'], [d + k, 'Puissance d’une puissance : on <b>multiplie</b> les exposants.']], 'On multiplie l’exposant par ' + k + '.'),
        partieConv(o)] : niv === 2 ? [partieE(o), partieConv(o)] : [partieConv(o)];
      o.erreurs = [[d, 'L’unité est au ' + nom + ' : la différence des exposants (' + ent(d) + ') est multipliée par ' + k + '.']];
      return question(id, niv, id + ':' + x + p + a + b, 'Convertis ' + ecr(x, p, true) + '&nbsp;' + o.de.h + ' en ' + o.vers.h + '. Toute écriture juste est acceptée.', parts,
        '<p>1&nbsp;' + l1.h + ' = ' + p10(d) + '&nbsp;' + l2.h + ', donc 1&nbsp;' + o.de.h + ' = (' + p10(d) + ')<sup>' + k + '</sup>&nbsp;' + o.vers.h + ' = ' + p10(d * k) + '&nbsp;' + o.vers.h + '.</p>' + solConv(o),
        ['Commence par la conversion des longueurs : 1&nbsp;' + l1.h + ' = ' + p10(d) + '&nbsp;' + l2.h + '.', 'Au ' + nom + ', l’exposant est multiplié par ' + k + ' : ' + p10(d * k) + '.', (p ? 'Ajoute l’exposant ' + ent(p) + ' du nombre.' : sens(o))]);
    };
  }
  ajouter({ id: 'CV4', famille: 'CV', niveau: 6, prerequis: ['CV2'], titre: 'Unités au carré (cm², m²…)',
    regle: 'Une unité au carré est le produit de deux longueurs : 1 cm² = 1 cm × 1 cm = 10<sup>−2</sup> m × 10<sup>−2</sup> m = 10<sup>−4</sup> m². L’exposant de conversion des longueurs est <b>multiplié par 2</b>.',
    methode: '1. Exposant de conversion des longueurs (départ − arrivée). 2. Multiplie-le par 2. 3. Recopie le nombre et multiplie par cette puissance de 10.',
    exemple: calc('3&nbsp;cm² → m² : (−2 − 0) × 2 = −4') + calc('3&nbsp;cm² = 3 × 10<sup>−4</sup>&nbsp;m² = ' + c('0,000&nbsp;3&nbsp;m²')),
    piege: '1 m² = 10 000 cm², pas 100 cm² : un carré de 1 m de côté contient 100 × 100 petits carrés de 1 cm.',
    gen: genPuiss('CV4', 2) });
  ajouter({ id: 'CV5', famille: 'CV', niveau: 7, prerequis: ['CV4'], titre: 'Unités au cube (cm³, m³…)',
    regle: 'Une unité au cube est le produit de trois longueurs : 1 cm³ = (10<sup>−2</sup> m)<sup>3</sup> = 10<sup>−6</sup> m³. L’exposant de conversion des longueurs est <b>multiplié par 3</b>.',
    methode: '1. Exposant de conversion des longueurs (départ − arrivée). 2. Multiplie-le par 3. 3. Recopie le nombre et multiplie par cette puissance de 10.',
    exemple: calc('5&nbsp;mm³ → m³ : (−3 − 0) × 3 = −9') + calc('5&nbsp;mm³ = ' + c('5 × 10<sup>−9</sup>&nbsp;m³')),
    piege: '1 m³ = 1 000 000 cm³ (10<sup>6</sup>), pas 1 000 cm³ : c’est 1 dm³ qui vaut 1 000 cm³.',
    gen: genPuiss('CV5', 3) });

  /* -------------------- CV6 : litres et m³ -------------------- */
  const L_ = s => UL(PR(s)), M3 = s => U(PR(s), 'm', 3);
  ajouter({ id: 'CV6', famille: 'CV', niveau: 8, prerequis: ['CV5'], titre: 'Litres et mètres cubes',
    regle: '<b>1 L = 1 dm³</b> et <b>1 mL = 1 cm³</b> ; donc 1 m³ = 1 000 L. Pour convertir des litres en m³ (ou l’inverse), on passe par le dm³ (ou le cm³), puis on convertit l’unité au cube.',
    methode: 'Remplace L par dm³ (ou mL par cm³), puis fais la conversion d’une unité au cube (exposant × 3).',
    exemple: calc('2,5&nbsp;m³ = 2,5 × 10<sup>3</sup>&nbsp;dm³ = ' + c('2&nbsp;500&nbsp;L')) + calc('250&nbsp;mL = ' + c('250&nbsp;cm³')) + calc('1,5&nbsp;L = 1,5&nbsp;dm³ = ' + c('1&nbsp;500&nbsp;cm³')),
    piege: '1 L n’est pas 1 m³ : un litre est un cube de 10 cm de côté, il en faut 1 000 pour remplir 1 m³.',
    gen(niv) {
      const x = hasard(COEF[niv === 3 ? 2 : 1].filter(v => v !== 0.045));
      if (niv === 1) {
        // en deux étapes, par le dm³ ou le cm³
        const cas = hasard([
          [M3(''), M3('d'), L_('')], [L_(''), M3('d'), M3('c')], [M3('c'), M3('d'), L_('')], [L_('m'), M3('c'), M3('m')], [M3('d'), M3('c'), L_('m')]]);
        const [A, B, C] = cas;
        const o1 = prep(x, 0, A, B), o = prep(x, 0, A, C);
        const v1 = valConv(x, 0, o1.E);
        const p1 = o1.E ? partieConv(o1) : nbP(nb(x) + '&nbsp;' + A.h + ' =', x, { apres: B.h, diag: () => (A.litre ? '1&nbsp;' + A.h + ' = 1&nbsp;' + B.h : '1&nbsp;' + B.h + ' = 1&nbsp;' + A.h) + ' : le nombre ne change pas.' });
        const o2 = prep(v1, 0, B, C);
        const p2 = nbP('donc ' + nb(x) + '&nbsp;' + A.h + ' = ' + nb(v1) + '&nbsp;' + B.h + ' =', valConv(x, 0, o.E), { apres: C.h, diag: o2.E ? K.diagConv(o2) : () => (C.litre ? '1&nbsp;' + B.h + ' = 1&nbsp;' + C.h : '1&nbsp;' + C.h + ' = 1&nbsp;' + B.h) + ' : le nombre ne change pas.' });
        return question('CV6', niv, 'CV6:' + x + A.h + C.h, 'Convertis ' + nb(x) + '&nbsp;' + A.h + ' en ' + C.h + ', en passant par le ' + B.h + '.', [p1, p2],
          '<p>1&nbsp;L = 1&nbsp;dm³ et 1&nbsp;mL = 1&nbsp;cm³.</p>' + calc(nb(x) + '&nbsp;' + A.h + ' = ' + nb(v1) + '&nbsp;' + B.h + ' = ' + c(K.resultat(x, 0, o.E) + '&nbsp;' + C.h)),
          ['1&nbsp;L = 1&nbsp;dm³ et 1&nbsp;mL = 1&nbsp;cm³.', 'Pour une unité au cube, l’exposant de conversion des longueurs est multiplié par 3.']);
      }
      const P = niv === 2 ? [[M3(''), L_('')], [L_(''), M3('')], [L_('m'), M3('c')], [M3('c'), L_('m')], [L_(''), M3('c')], [M3('c'), L_('')], [M3('d'), L_('m')], [L_('m'), M3('d')]]
        : [[L_('c'), M3('c')], [M3('m'), L_('m')], [M3(''), L_('m')], [L_('h'), M3('')], [L_('µ'), M3('m')], [L_('d'), M3('c')], [M3('c'), L_('h')]];
      const [A, C] = hasard(P);
      const p = niv === 3 && Math.random() < 0.4 ? hasard([2, 3, -2]) : 0;
      const o = prep(x, p, A, C);
      o.aide = 'Passe par le dm³ (1&nbsp;L = 1&nbsp;dm³) ou le cm³ (1&nbsp;mL = 1&nbsp;cm³), puis convertis l’unité au cube (exposant × 3).';
      o.erreurs = [[o.E / 3 | 0, 'Unité au cube : l’exposant de conversion des longueurs est multiplié par 3.']];
      const sol = '<p>1&nbsp;L = 1&nbsp;dm³ = 10<sup>−3</sup>&nbsp;m³ et 1&nbsp;mL = 1&nbsp;cm³ = 10<sup>−6</sup>&nbsp;m³.</p><p>Exposant de conversion : ' + ent(A.e) + ' − ' + par(C.e) + ' = <b>' + ent(o.E) + '</b> (puissances de 10 de chaque unité en m³).</p>' +
        calc(ecr(x, p, true) + '&nbsp;' + A.h + ' = ' + c(K.resultat(x, p, o.E) + '&nbsp;' + C.h));
      return question('CV6', niv, 'CV6:' + x + p + A.h + C.h, 'Convertis ' + ecr(x, p, true) + '&nbsp;' + A.h + ' en ' + C.h + '. Toute écriture juste est acceptée.', [partieConv(o)], sol,
        ['1&nbsp;L = 1&nbsp;dm³ et 1&nbsp;mL = 1&nbsp;cm³.', 'En m³ : 1&nbsp;' + A.h + ' = ' + p10(A.e) + '&nbsp;m³ et 1&nbsp;' + C.h + ' = ' + p10(C.e) + '&nbsp;m³.', 'Exposant de conversion : ' + ent(A.e) + ' − ' + par(C.e) + ' = ' + ent(o.E) + '.']);
    } });

  /* -------------------- CV7 : écrire une unité composée -------------------- */
  // [écriture avec /, écriture avec puissances négatives, mauvaises écritures « / », mauvaises écritures « · », difficulté]
  const ECR = [
    ['m/s', 'm·s<sup>−1</sup>', ['m × s', 's/m', '1/(m·s)'], ['m·s', 's·m<sup>−1</sup>', 'm<sup>−1</sup>·s'], 1],
    ['g/L', 'g·L<sup>−1</sup>', ['g × L', 'L/g', '1/(g·L)'], ['g·L', 'L·g<sup>−1</sup>', 'g<sup>−1</sup>·L'], 1],
    ['km/h', 'km·h<sup>−1</sup>', ['km × h', 'h/km', '1/(km·h)'], ['km·h', 'h·km<sup>−1</sup>', 'km<sup>−1</sup>·h'], 1],
    ['kg/m³', 'kg·m<sup>−3</sup>', ['kg × m³', 'm³/kg', 'kg/m<sup>−3</sup>'], ['kg·m³', 'kg·m<sup>−1</sup>', 'm<sup>3</sup>·kg<sup>−1</sup>'], 2],
    ['mol/L', 'mol·L<sup>−1</sup>', ['mol × L', 'L/mol', '1/(mol·L)'], ['mol·L', 'L·mol<sup>−1</sup>', 'mol<sup>−1</sup>·L'], 2],
    ['m/s²', 'm·s<sup>−2</sup>', ['m × s²', 's²/m', 'm/s<sup>−2</sup>'], ['m·s<sup>2</sup>', 'm·s<sup>−1</sup>', 's<sup>−2</sup>·m<sup>−1</sup>'], 2],
    ['J/(kg·K)', 'J·kg<sup>−1</sup>·K<sup>−1</sup>', ['J/kg·K', '(kg·K)/J', 'J·K/kg'], ['J·kg<sup>−1</sup>·K', 'J·kg·K<sup>−1</sup>', 'J<sup>−1</sup>·kg·K'], 3],
    ['N/m²', 'N·m<sup>−2</sup>', ['N × m²', 'm²/N', 'N/m<sup>−2</sup>'], ['N·m<sup>2</sup>', 'N·m<sup>−1</sup>', 'N<sup>−1</sup>·m<sup>2</sup>'], 3],
    ['mol/(L·s)', 'mol·L<sup>−1</sup>·s<sup>−1</sup>', ['mol/L·s', 'mol·s/L', '(L·s)/mol'], ['mol·L<sup>−1</sup>·s', 'mol·L·s<sup>−1</sup>', 'mol<sup>−1</sup>·L·s'], 3],
    ['W/(m²·K)', 'W·m<sup>−2</sup>·K<sup>−1</sup>', ['W/m²·K', 'W·K/m²', '(m²·K)/W'], ['W·m<sup>2</sup>·K<sup>−1</sup>', 'W·m<sup>−2</sup>·K', 'W·m<sup>−1</sup>·K<sup>−1</sup>'], 3]];
  ajouter({ id: 'CV7', famille: 'CV', niveau: 3, prerequis: ['PU1'], titre: 'Écrire m/s ou m·s<sup>−1</sup>',
    regle: 'Diviser par une unité, c’est la multiplier par cette unité à la puissance −1 : <b>m/s = m·s<sup>−1</sup></b>, g/L = g·L<sup>−1</sup>, kg/m³ = kg·m<sup>−3</sup>. Le point · se lit « fois ».',
    methode: 'Chaque unité du dénominateur passe à côté des autres, avec l’exposant opposé : s → s<sup>−1</sup>, m³ → m<sup>−3</sup>. Les unités du numérateur ne changent pas.',
    exemple: calc('m/s = ' + c('m·s<sup>−1</sup>')) + calc('kg/m³ = ' + c('kg·m<sup>−3</sup>')) + calc('J/(kg·K) = ' + c('J·kg<sup>−1</sup>·K<sup>−1</sup>')),
    piege: 'm·s<sup>−1</sup> n’est pas m·s : la puissance −1 dit que le s est au dénominateur.',
    gen(niv) {
      const [sl, pt, faux1, faux2] = hasard(ECR.filter(t => t[4] === niv));
      const versPt = Math.random() < 0.5;
      const bonne = versPt ? pt : sl, depart = versPt ? sl : pt, faux = versPt ? faux2 : faux1;
      const ops = melanger([{ id: 'ok', label: bonne }].concat(faux.map((f, i) => ({ id: 'f' + i, label: f }))));
      const ind = { f0: 'Regarde les puissances : une unité au dénominateur prend un exposant négatif.', f1: 'Le numérateur et le dénominateur sont échangés.', f2: 'Chaque unité du dénominateur prend l’exposant opposé (s → s<sup>−1</sup>, m² → m<sup>−2</sup>) ; celles du numérateur ne changent pas.' };
      return question('CV7', niv, 'CV7:' + sl + versPt, 'Choisis l’autre écriture de cette unité.', [
        choixP('Quelle est l’autre écriture de <b>' + depart + '</b> ?', ops, 'ok', ind)],
        calc(sl + ' = ' + c(pt)) + '<p>Une unité au dénominateur passe à côté des autres avec l’exposant opposé.</p>',
        ['Diviser par une unité, c’est la multiplier par cette unité à la puissance −1.', 'Les unités du numérateur ne changent pas.']);
    } });

  /* -------------------- CV8 et CV9 : unités composées -------------------- */
  // unité composée num / den ; ecr0 : 'pt' (puissance négative) ou '/' ; e = e(num) − e(den)
  function UCx(num, den, ecr0) {
    const h = ecr0 === 'pt' ? num.h + '·' + den.q.s + den.u + '<sup>' + ent(-den.k) + '</sup>' : num.h + '/' + den.h;
    return { h, e: num.e - den.e, num, den };
  }
  const M = (s, u, k) => U(PR(s), u, k), Lt = s => UL(PR(s));
  // conversion d'une unité composée : explication du numérateur et du dénominateur
  function solComp(o) {
    const en = o.de.num.e - o.vers.num.e, ed = o.de.den.e - o.vers.den.e;
    return '<p>Numérateur : ' + o.de.num.h + ' → ' + o.vers.num.h + ' : ' + (en ? 'facteur ' + p10(en) : 'pas de changement') + '.</p>' +
      '<p>Dénominateur : 1&nbsp;' + o.de.den.h + ' = ' + p10(ed) + '&nbsp;' + o.vers.den.h + (ed ? ' ; diviser par ' + p10(ed) + ', c’est multiplier par ' + p10(-ed) : ' : pas de changement') + '.</p>' +
      '<p>Exposant de conversion : ' + ent(en) + ' + ' + par(-ed) + ' = <b>' + ent(o.E) + '</b></p>' +
      calc(ecr(o.x, o.p || 0, true) + '&nbsp;' + o.de.h + ' = ' + c(K.resultat(o.x, o.p || 0, o.E) + '&nbsp;' + o.vers.h));
  }
  function genComp(id, CAS) {
    return function (niv) {
      const cas = hasard(CAS[niv]), ecr0 = Math.random() < 0.5 ? 'pt' : '/';
      const de = UCx(cas[0], cas[1], ecr0), vers = UCx(cas[2], cas[3], ecr0);
      const x = hasard(COEF[niv === 3 ? 2 : 1]), p = niv === 3 && id === 'CV9' && Math.random() < 0.4 ? hasard([2, 3, -3]) : 0;
      const o = { x, p, de, vers, E: de.e - vers.e };
      const en = de.num.e - vers.num.e, ed = de.den.e - vers.den.e;
      o.erreurs = [];
      if (ed) o.erreurs.push([en + ed, 'Le préfixe du dénominateur a l’effet inverse : diviser par ' + p10(ed) + ', c’est multiplier par ' + p10(-ed) + '.']);
      if (en && ed) { o.erreurs.push([en, 'Tu as converti le numérateur, pas le dénominateur (' + de.den.h + ' → ' + vers.den.h + ').']); o.erreurs.push([-ed, 'Tu as converti le dénominateur, pas le numérateur (' + de.num.h + ' → ' + vers.num.h + ').']); }
      o.aide = 'Convertis séparément le numérateur et le dénominateur ; le dénominateur a l’effet inverse.';
      const pNum = partieExp('Numérateur : 1&nbsp;' + de.num.h + ' = 10', en, [[-en, 'À l’envers : (puissance de départ) − (puissance d’arrivée).']], 'Exposant = (puissance de départ) − (puissance d’arrivée).');
      const pDen = partieExp('Dénominateur : 1&nbsp;' + de.den.h + ' = 10', ed, [[-ed, 'À l’envers : (puissance de départ) − (puissance d’arrivée).']], de.den.k > 1 ? 'Unité au ' + (de.den.k === 2 ? 'carré' : 'cube') + ' : l’exposant des longueurs est multiplié par ' + de.den.k + '.' : 'Exposant = (puissance de départ) − (puissance d’arrivée).');
      pNum.apres = vers.num.h; pDen.apres = vers.den.h;
      const pE = partieExp('Exposant de conversion (' + de.h + ' → ' + vers.h + ') : 10', o.E, o.erreurs.concat([[-o.E, 'À l’envers : le nombre doit ' + (o.E > 0 ? 'augmenter' : 'diminuer') + '.']]), o.aide);
      let parts;
      if (niv === 1) parts = (en && ed) || id === 'CV9' ? [pNum, pDen, partieConv(o)] : [en ? pNum : pDen, partieConv(o)];
      else if (niv === 2) parts = [pE, partieConv(o)];
      else parts = [partieConv(o)];
      return question(id, niv, id + ':' + x + p + de.h + vers.h, 'Convertis ' + ecr(x, p, true) + '&nbsp;' + de.h + ' en ' + vers.h + '. Toute écriture juste est acceptée.', parts, solComp(o),
        ['Numérateur : 1&nbsp;' + de.num.h + ' = ' + p10(en) + '&nbsp;' + vers.num.h + '.', 'Dénominateur : 1&nbsp;' + de.den.h + ' = ' + p10(ed) + '&nbsp;' + vers.den.h + ' : son effet est inversé (' + p10(-ed) + ').', 'Exposant de conversion : ' + ent(en) + ' + ' + par(-ed) + ' = ' + ent(o.E) + '.']);
    };
  }
  // [numérateur départ, dénominateur départ, numérateur arrivée, dénominateur arrivée]
  const CAS8 = {
    1: [[M('m', 'g'), Lt(''), M('', 'g'), Lt('')], [M('', 'g'), Lt(''), M('m', 'g'), Lt('')], [M('m', 'mol'), Lt(''), M('', 'mol'), Lt('')], [M('', 'mol'), Lt(''), M('m', 'mol'), Lt('')], [M('k', 'J'), M('k', 'g'), M('', 'J'), M('k', 'g')], [M('µ', 'g'), Lt(''), M('m', 'g'), Lt('')]],
    2: [[M('', 'g'), Lt('m'), M('', 'g'), Lt('')], [M('', 'g'), Lt(''), M('', 'g'), Lt('m')], [M('', 'J'), M('', 'g'), M('', 'J'), M('k', 'g')], [M('', 'mol'), Lt('m'), M('', 'mol'), Lt('')], [M('', 'g'), Lt('c'), M('', 'g'), Lt('')], [M('', 'W'), M('', 'g'), M('', 'W'), M('k', 'g')]],
    3: [[M('m', 'g'), Lt('m'), M('', 'g'), Lt('')], [M('k', 'g'), Lt(''), M('', 'g'), Lt('m')], [M('µ', 'g'), Lt('m'), M('m', 'g'), Lt('')], [M('m', 'mol'), Lt('m'), M('', 'mol'), Lt('')], [M('', 'g'), Lt('m'), M('k', 'g'), Lt('')], [M('k', 'J'), M('', 'g'), M('', 'J'), M('k', 'g')]]
  };
  ajouter({ id: 'CV8', famille: 'CV', niveau: 6, prerequis: ['CV2', 'CV7'], titre: 'Unités composées (mg/L, g/mL…)',
    regle: 'On convertit <b>séparément</b> le numérateur et le dénominateur. Le préfixe du numérateur agit comme d’habitude ; celui du <b>dénominateur a l’effet inverse</b> : 1 g/mL = 1 g / (10<sup>−3</sup> L) = 10<sup>3</sup> g/L.',
    methode: 'Exposant de conversion = (exposant du numérateur) − (exposant du dénominateur), chacun calculé par (départ) − (arrivée). Ou : remplace chaque unité par sa valeur, puis calcule.',
    exemple: calc('250&nbsp;mg/L = 250 × 10<sup>−3</sup>&nbsp;g/L = ' + c('0,25&nbsp;g/L')) + calc('1,2&nbsp;g/mL = 1,2&nbsp;g / (10<sup>−3</sup>&nbsp;L) = ' + c('1,2 × 10<sup>3</sup>&nbsp;g/L')),
    piege: 'Un dénominateur plus petit donne une valeur plus grande : 1 g/mL = 1 000 g/L, pas 0,001 g/L.',
    gen: genComp('CV8', CAS8) });
  const CAS9 = {
    1: [[M('', 'g'), M('c', 'm', 3), M('k', 'g'), M('', 'm', 3)], [M('k', 'g'), M('', 'm', 3), M('', 'g'), M('c', 'm', 3)], [M('', 'N'), M('c', 'm', 2), M('', 'N'), M('', 'm', 2)], [M('', 'W'), M('c', 'm', 2), M('', 'W'), M('', 'm', 2)]],
    2: [[M('', 'g'), Lt(''), M('k', 'g'), M('', 'm', 3)], [M('', 'mol'), M('', 'm', 3), M('', 'mol'), Lt('')], [M('k', 'g'), Lt(''), M('k', 'g'), M('', 'm', 3)], [M('', 'g'), Lt('m'), M('k', 'g'), M('', 'm', 3)], [M('', 'g'), M('', 'm', 2), M('', 'g'), M('c', 'm', 2)]],
    3: [[M('m', 'g'), M('c', 'm', 3), M('k', 'g'), M('', 'm', 3)], [M('k', 'g'), M('', 'm', 3), M('m', 'g'), Lt('m')], [M('', 'mol'), Lt(''), M('', 'mol'), M('', 'm', 3)], [M('m', 'W'), M('c', 'm', 2), M('', 'W'), M('', 'm', 2)], [M('k', 'N'), M('', 'm', 2), M('', 'N'), M('m', 'm', 2)]]
  };
  ajouter({ id: 'CV9', famille: 'CV', niveau: 9, prerequis: ['CV8', 'CV5'], titre: 'Unités composées avec un carré ou un cube (g/cm³ → kg/m³)',
    regle: 'Même méthode que pour les unités composées, mais le dénominateur est une unité au carré ou au cube (exposant des longueurs × 2 ou × 3), ou des litres (1 L = 1 dm³ = 10<sup>−3</sup> m³).',
    methode: 'Numérateur : (départ) − (arrivée). Dénominateur : conversion d’une unité au carré ou au cube, puis effet inverse. Additionne les deux.',
    exemple: calc('1&nbsp;g/cm³ : numérateur g → kg : 10<sup>−3</sup> ; dénominateur 1 cm³ = 10<sup>−6</sup>&nbsp;m³ → × 10<sup>6</sup>') + calc('1&nbsp;g/cm³ = 10<sup>−3 + 6</sup>&nbsp;kg/m³ = ' + c('1&nbsp;000&nbsp;kg/m³')),
    piege: 'La masse volumique de l’eau vaut 1 g/cm³ = 1 kg/L = 1 000 kg/m³ : un bon moyen de vérifier ta conversion.',
    gen: genComp('CV9', CAS9) });

  /* -------------------- CV10 : m/s et km/h -------------------- */
  ajouter({ id: 'CV10', famille: 'CV', niveau: 9, prerequis: ['CV8'], titre: 'm/s ↔ km/h',
    regle: '1 km/h = 1 000 m / 3 600 s, et 3 600 / 1 000 = 3,6. Pour passer de <b>m/s à km/h</b>, on <b>multiplie par 3,6</b> ; de <b>km/h à m/s</b>, on <b>divise par 3,6</b>.',
    methode: 'Deux méthodes. <b>1. La distance et la durée.</b> Convertis la distance (km ↔ m) et la durée (h ↔ s), puis divise : 36 km/h = 36 000 m / 3 600 s = 10 m/s.<br><b>2. Le facteur 3,6.</b> Quand on marche, on parcourt environ 1 m en 1 s, et environ 4 km en 1 h : la valeur en km/h est <b>plus grande</b> que la valeur en m/s. Donc de m/s à km/h on multiplie par 3,6, de km/h à m/s on divise par 3,6.',
    exemple: calc('15&nbsp;m/s = 15 × 3,6&nbsp;km/h = ' + c('54&nbsp;km/h')) + calc('72&nbsp;km/h = 72 000&nbsp;m / 3&nbsp;600&nbsp;s = ' + c('20&nbsp;m/s')),
    piege: 'Multiplier ou diviser ? Pense à la marche : environ 1 m/s, c’est environ 4 km/h. La valeur en km/h est toujours la plus grande.',
    gen(niv) {
      const versKmh = Math.random() < 0.5;
      const ms = Math.random() < 0.5 ? 'm/s' : 'm·s<sup>−1</sup>', kmh = ms === 'm/s' ? 'km/h' : 'km·h<sup>−1</sup>';
      let x;
      if (versKmh) x = niv === 1 ? hasard([10, 5, 20, 2, 15, 25, 30]) : niv === 2 ? hasard([2.5, 1.5, 12, 8, 0.5, 40, 35]) : hasard([3.3, 9.81, 1.25, 340, 8.3, 11.2]);
      else x = niv === 1 ? hasard([36, 72, 18, 90, 54, 108, 144]) : niv === 2 ? hasard([9, 45, 126, 7.2, 5.4, 180, 27]) : hasard([50, 130, 110, 80, 30, 300, 1000]);
      const v = fix(versKmh ? x * 3.6 : x / 3.6);
      const exact = N.egal(N.arrondi(v, 3), v, 1e-9) && String(v).replace(/[.-]/g, '').replace(/^0+/, '').length <= 4;
      const cible = exact ? v : N.arrondi(v, 3);
      const de = versKmh ? ms : kmh, vers = versKmh ? kmh : ms;
      const diag = r => {
        const w = r.v, pres = (a, b) => N.egal(a, b, 0.01);
        if (pres(w, versKmh ? x / 3.6 : x * 3.6)) return 'Tu as ' + (versKmh ? 'divisé' : 'multiplié') + ' par 3,6. Pense à la marche : environ 1 m/s, c’est environ 4 km/h. La valeur en km/h est la plus grande : ' + (versKmh ? 'on multiplie par 3,6.' : 'on divise par 3,6.');
        if (pres(w, x * 1000) || pres(w, x / 1000)) return 'Tu as converti les kilomètres, mais pas la durée : 1 h = 3&nbsp;600 s.';
        if (pres(w, x * 3600) || pres(w, x / 3600)) return 'Tu as converti la durée, mais pas la distance : 1 km = 1&nbsp;000 m.';
        if (pres(w, x * 1000 / 60) || pres(w, x * 60 / 1000) || pres(w, x / 60) || pres(w, x * 60)) return '1 h = 3&nbsp;600 s (60 × 60), pas 60 s.';
        return 'Utilise le facteur 3,6 : ' + (versKmh ? 'm/s → km/h, on multiplie.' : 'km/h → m/s, on divise.');
      };
      const m1 = versKmh
        ? '<p><b>Méthode 1.</b> ' + nb(x) + ' m en 1 s, donc en 1 h = 3&nbsp;600 s : ' + nb(x) + ' × 3&nbsp;600 = ' + nb(fix(x * 3600)) + ' m = ' + nb(fix(x * 3.6)) + ' km. Donc v = ' + nb(fix(x * 3.6)) + '&nbsp;' + kmh + '.</p>'
        : '<p><b>Méthode 1.</b> ' + nb(x) + ' km = ' + nb(fix(x * 1000)) + ' m, parcourus en 1 h = 3&nbsp;600 s : v = ' + nb(fix(x * 1000)) + ' / 3&nbsp;600 ' + (exact ? '= ' : '≈ ') + nb(cible) + '&nbsp;' + ms + '.</p>';
      const m2 = '<p><b>Méthode 2.</b> La valeur en km/h est la plus grande (marche : 1 m/s ≈ 4 km/h) : on ' + (versKmh ? 'multiplie' : 'divise') + ' par 3,6.</p>' +
        calc(nb(x) + (versKmh ? ' × ' : ' / ') + '3,6 ' + (exact ? '= ' : '≈ ') + c(nb(cible) + '&nbsp;' + vers));
      return question('CV10', niv, 'CV10:' + x + versKmh, 'Convertis ' + nb(x) + '&nbsp;' + de + ' en ' + vers + (exact ? '.' : ', arrondi à 3 chiffres significatifs.'), [
        nbP(nb(x) + '&nbsp;' + de + ' =', cible, { apres: vers, rel: exact ? 1e-9 : 0.004, calc: niv > 1, diag })],
        m1 + m2,
        ['Pense à la marche : environ 1 m/s, c’est environ 4 km/h. La valeur en km/h est la plus grande.', versKmh ? 'De m/s à km/h, on multiplie par 3,6.' : 'De km/h à m/s, on divise par 3,6.']);
    } });

  /* =====================================================================
     L'objet CN.C
     ===================================================================== */
  const liste = K.liste;
  const R = {};
  liste.forEach(x => { R[x.id] = x; });
  const themeDe = id => K.familles.find(f => f.id === R[id].famille).theme;
  CN.C = { THEMES: K.THEMES, familles: K.familles, liste, R, PREF: K.PREF, themeDe, question: (id, niv) => R[id].gen(niv) };
})();
