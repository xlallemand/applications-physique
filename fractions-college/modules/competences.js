/* ============================================================
   Fractions — les compétences (objet FRA.C)
   ------------------------------------------------------------
   Chaque compétence : identifiant (2 lettres + numéro), famille, niveau
   (1 à 4 : ordre de progression), prérequis, texte de la fiche
   (règle, méthode, exemple, piège) et une fabrique de questions
   gen(niv) (niv = difficulté des nombres, 1 à 3) qui renvoie à chaque
   appel une question différente :
     { comp, niv, consigne, depart, prefixe, affiche, ref, valeur, but,
       solution: [lignes], indices: [html], diag(v) }
       depart   : écriture compacte de la ligne de départ (voir expr.js) ;
       prefixe  : « A = » devant les lignes (sinon « = » seul) ;
       affiche  : HTML de la ligne de départ quand ce n'est pas un calcul (« Inverse de … ») ;
       ref      : calcul de départ pour les diagnostics (par défaut : depart ; null : aucun) ;
       valeur   : valeur exacte attendue { n, d } ;
       but      : 'irr' (fraction irréductible ou entier) ou { den: N } (fraction de dénominateur N) ;
       solution : lignes de la solution détaillée (écriture compacte) ;
       indices  : aides successives (HTML) ;
       diag(v)  : diagnostic propre à la compétence (valeur fausse v), ou null.
   Dépend de : expr.js (FRA.X).

   API : FRA.C.familles, FRA.C.liste, FRA.C.R (par identifiant), FRA.C.question(id, niv)
   ============================================================ */
(function () {
  'use strict';
  const FRA = window.FRA = window.FRA || {};
  const X = FRA.X, Q = X.Q, m = X.m, M = '−';

  /* ---------- Hasard ---------- */
  const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const choix = l => l[Math.floor(Math.random() * l.length)];
  const val = t => X.valeur(X.analyser(X.lire(t)));
  // tire des valeurs jusqu'à ce que la condition soit remplie
  function tirer(f, ok) { for (let k = 0; k < 400; k++) { const v = f(); if (ok(v)) return v; } return f(); }

  /* ---------- Écritures ---------- */
  // fraction écrite telle quelle (numérateur négatif possible) : [−3|4]
  const fr = (n, d) => '[' + (n < 0 ? M + (-n) : n) + '|' + (d < 0 ? M + (-d) : d) + ']';
  // nombre dans un calcul, entre parenthèses s'il est négatif
  const nbp = x => x < 0 ? '(' + M + (-x) + ')' : String(x);
  // valeur n/d écrite proprement : 3, −2, [3|4], −[3|4]
  function propre(n, d) {
    if (d < 0) { n = -n; d = -d; }
    if (d === 1) return (n < 0 ? M : '') + Math.abs(n);
    return (n < 0 ? M : '') + '[' + Math.abs(n) + '|' + d + ']';
  }
  // lignes qui mènent de [N|D] (déjà écrite) à la fraction irréductible
  function simp(N, D) {
    const g = Q.pgcd(N, D), s = N < 0 ? M : '', a = Math.abs(N) / g, b = D / g;
    if (g === 1 || b === 1) return b === 1 ? [s + a] : [];
    return [s + '[' + a + '×' + g + '|' + b + '×' + g + ']', propre(N / g, b)];
  }
  // « + » suivi d'un nombre : 4 + (−3) s'écrit 4 − 3
  const suite = (o, y) => y < 0 ? (o === '+' ? ' ' + M + ' ' : ' + ') + (-y) : ' ' + o + ' ' + y;
  // somme (ou différence) de deux fractions A et B { n, d } : mise au même dénominateur L, calcul, simplification
  function solSomme(A, B, o, L, avecSimp) {
    const ka = L / A.d, kb = L / B.d, l = [];
    const conv = (F, k) => k === 1 ? fr(F.n, F.d) : '[' + (F.n < 0 ? M + (-F.n) : F.n) + '×' + k + '|' + F.d + '×' + k + ']';
    if (ka !== 1 || kb !== 1) {
      l.push(conv(A, ka) + ' ' + o + ' ' + conv(B, kb));
      l.push(fr(A.n * ka, L) + ' ' + o + ' ' + fr(B.n * kb, L));
    }
    const x = A.n * ka, y = B.n * kb, S = o === '+' ? x + y : x - y;
    l.push('[' + (x < 0 ? M + (-x) : x) + suite(o, y) + '|' + L + ']');
    l.push(fr(S, L));
    if (avecSimp !== false) {
      const s = simp(S, L);
      if (s.length) l.push(...s); else if (S < 0) l.push(propre(S, L));
    }
    return { lignes: l, S };
  }

  /* =====================================================================
     Familles
     ===================================================================== */
  const familles = [
    { id: 'EG', nom: 'Égalité et simplification', desc: 'Une fraction ne change pas quand on multiplie (ou divise) son numérateur et son dénominateur par le même nombre.' },
    { id: 'MD', nom: 'Multiplier et diviser', desc: 'Produit de deux fractions, inverse d’une fraction, quotient de deux fractions.' },
    { id: 'AS', nom: 'Additionner et soustraire', desc: 'On additionne des fractions qui ont le même dénominateur : sinon, on les y met d’abord.' },
    { id: 'RE', nom: 'Fractions et nombres relatifs', desc: 'Le signe d’une fraction, et les calculs avec des fractions négatives.' },
    { id: 'PR', nom: 'Priorités et calculs enchaînés', desc: 'Plusieurs opérations dans un même calcul : les parenthèses d’abord, puis × et ÷, puis + et −.' }
  ];

  /* =====================================================================
     Compétences
     ===================================================================== */
  const liste = [
    /* ---------------- Égalité et simplification ---------------- */
    { id: 'EG1', famille: 'EG', niveau: 1, prerequis: [], titre: 'Écrire une fraction égale',
      regle: 'Une fraction ne change pas de valeur quand on <b>multiplie</b> (ou divise) son numérateur <b>et</b> son dénominateur par le <b>même nombre</b>.',
      methode: 'Pour obtenir le dénominateur voulu : cherche par quel nombre multiplier le dénominateur, puis multiplie aussi le numérateur par ce nombre.',
      exemple: { consigne: 'Fraction égale à {[3|4]} de dénominateur 20', depart: '[3|4]', lignes: ['[3×5|4×5]', '[15|20]'] },
      piege: 'On n’ajoute pas le même nombre en haut et en bas : {[3+16|4+16]} n’est pas égale à {[3|4]}.',
      gen(niv) {
        if (niv >= 3 && Math.random() < 0.5) {
          // diviser : [a·k|b·k] = [?|b]
          const v = tirer(() => ({ a: rnd(1, 9), b: rnd(2, 9), k: rnd(2, 9) }), v => v.a !== v.b && Q.pgcd(v.a, v.b) === 1);
          const N = v.a * v.k, D = v.b * v.k;
          return { consigne: 'Écris la fraction égale à ' + m(fr(N, D)) + ' qui a pour dénominateur <b>' + v.b + '</b>.',
            depart: fr(N, D), valeur: Q.red(N, D), but: { den: v.b },
            solution: ['[' + v.a + '×' + v.k + '|' + v.b + '×' + v.k + ']', fr(v.a, v.b)],
            indices: ['Par quel nombre faut-il diviser ' + D + ' pour obtenir ' + v.b + ' ?', D + ' ÷ ' + v.k + ' = ' + v.b + ' : divise aussi le numérateur par ' + v.k + '.'] };
        }
        const v = tirer(() => ({ a: rnd(1, niv === 1 ? 8 : 15), b: rnd(2, 9), k: niv === 1 ? rnd(2, 5) : niv === 2 ? rnd(3, 9) : rnd(6, 12) }), v => v.a !== v.b && (niv > 1 || v.a < v.b));
        const D = v.b * v.k;
        return { consigne: 'Écris la fraction égale à ' + m(fr(v.a, v.b)) + ' qui a pour dénominateur <b>' + D + '</b>.',
          depart: fr(v.a, v.b), valeur: Q.red(v.a, v.b), but: { den: D },
          solution: ['[' + v.a + '×' + v.k + '|' + v.b + '×' + v.k + ']', fr(v.a * v.k, D)],
          indices: ['Par quel nombre faut-il multiplier ' + v.b + ' pour obtenir ' + D + ' ?', v.b + ' × ' + v.k + ' = ' + D + ' : multiplie aussi le numérateur par ' + v.k + '.'] };
      } },
    { id: 'EG2', famille: 'EG', niveau: 1, prerequis: ['EG1'], titre: 'Simplifier une fraction',
      regle: 'Simplifier une fraction, c’est <b>diviser</b> son numérateur et son dénominateur par un même nombre (un diviseur commun).',
      methode: 'Cherche un nombre qui divise à la fois le numérateur et le dénominateur (critères de divisibilité par 2, 3, 5…). Écris les deux nombres comme des produits, puis simplifie.',
      exemple: { consigne: 'Simplifie', depart: '[15|35]', lignes: ['[3×5|7×5]', '[3|7]'] },
      piege: 'On ne soustrait pas : {[15−10|35−10]} n’est pas égale à {[15|35]}. On divise le haut et le bas par le même nombre.',
      gen(niv) {
        const k = choix(niv === 1 ? [2, 3, 5] : niv === 2 ? [2, 3, 5, 7] : [7, 11, 13]);
        const v = tirer(() => ({ p: rnd(1, niv === 3 ? 12 : 9), q: rnd(2, niv === 3 ? 12 : 9) }), v => v.p !== v.q && Q.pgcd(v.p, v.q) === 1);
        const N = v.p * k, D = v.q * k;
        return { consigne: 'Simplifie la fraction jusqu’à obtenir une <b>fraction irréductible</b>.', depart: fr(N, D), prefixe: 'A =', valeur: Q.red(N, D), but: 'irr',
          solution: ['[' + v.p + '×' + k + '|' + v.q + '×' + k + ']', propre(v.p, v.q)],
          indices: ['Cherche un nombre qui divise à la fois ' + N + ' et ' + D + '. Pense aux critères de divisibilité par 2, 3, 5…',
            N + ' = ' + v.p + ' × ' + k + ' et ' + D + ' = ' + v.q + ' × ' + k + '.', 'Divise le numérateur et le dénominateur par ' + k + '.'] };
      } },
    { id: 'EG3', famille: 'EG', niveau: 2, prerequis: ['EG2'], titre: 'Obtenir une fraction irréductible',
      regle: 'Une fraction est <b>irréductible</b> quand on ne peut plus la simplifier : le seul diviseur commun du numérateur et du dénominateur est 1.',
      methode: 'Simplifie en plusieurs fois (par 2, puis encore par 2, par 3…) jusqu’à ce que ce ne soit plus possible, ou d’un seul coup par le plus grand diviseur commun.',
      exemple: { consigne: 'Écris sous forme irréductible', depart: '[36|48]', lignes: ['[18|24]', '[3×6|4×6]', '[3|4]'] },
      piege: 'Vérifie toujours le résultat : {[18|24]} est égale à {[36|48]} mais n’est pas irréductible (18 et 24 sont pairs).',
      gen(niv) {
        const g = choix(niv === 1 ? [4, 6, 9, 10] : niv === 2 ? [6, 8, 12, 15] : [12, 14, 18, 20, 24]);
        const v = tirer(() => ({ p: rnd(1, 9), q: rnd(2, 9) }), v => v.p !== v.q && Q.pgcd(v.p, v.q) === 1);
        const N = v.p * g, D = v.q * g;
        return { consigne: 'Écris cette fraction sous forme <b>irréductible</b>.', depart: fr(N, D), prefixe: 'A =', valeur: Q.red(N, D), but: 'irr',
          solution: ['[' + v.p + '×' + g + '|' + v.q + '×' + g + ']', propre(v.p, v.q)],
          indices: ['Tu peux simplifier en plusieurs fois : par 2, par 3, par 5… tant que c’est possible.',
            'Le plus grand nombre qui divise à la fois ' + N + ' et ' + D + ' est ' + g + '.', N + ' = ' + v.p + ' × ' + g + ' et ' + D + ' = ' + v.q + ' × ' + g + '.'] };
      } },

    /* ---------------- Multiplier et diviser ---------------- */
    { id: 'MD1', famille: 'MD', niveau: 1, prerequis: [], titre: 'Multiplier deux fractions',
      regle: 'Pour multiplier deux fractions, on multiplie les <b>numérateurs entre eux</b> et les <b>dénominateurs entre eux</b>.',
      methode: '{[a|b] × [c|d] = [a×c|b×d]}. Simplifie ensuite si c’est possible.',
      exemple: { consigne: 'Calcule', depart: '[2|3] × [5|7]', prefixe: 'A =', lignes: ['[2×5|3×7]', '[10|21]'] },
      piege: 'Pas besoin de dénominateur commun pour multiplier, et pas de produit en croix : {[2|3] × [5|7]} n’est pas {[2×7|3×5]}.',
      gen(niv) {
        const v = tirer(() => ({ a: rnd(1, niv === 3 ? 12 : 7), b: rnd(2, niv === 3 ? 12 : 9), c: rnd(1, niv === 3 ? 12 : 7), d: rnd(2, niv === 3 ? 12 : 9) }),
          v => v.a !== v.b && v.c !== v.d && Q.pgcd(v.a, v.b) === 1 && Q.pgcd(v.c, v.d) === 1 && (niv === 1 ? Q.pgcd(v.a * v.c, v.b * v.d) === 1 : niv === 2 ? Q.pgcd(v.a * v.c, v.b * v.d) > 1 : true) && v.b * v.d <= 100);
        const N = v.a * v.c, D = v.b * v.d;
        return { consigne: 'Calcule et donne le résultat sous forme d’une <b>fraction irréductible</b>.', depart: fr(v.a, v.b) + ' × ' + fr(v.c, v.d), prefixe: 'A =', valeur: Q.red(N, D), but: 'irr',
          solution: ['[' + v.a + '×' + v.c + '|' + v.b + '×' + v.d + ']', fr(N, D)].concat(simp(N, D)),
          indices: ['Multiplie les numérateurs entre eux et les dénominateurs entre eux.', 'Écris ' + m('[' + v.a + '×' + v.c + '|' + v.b + '×' + v.d + ']') + ' puis calcule.', 'Vérifie à la fin si la fraction peut se simplifier.'] };
      } },
    { id: 'MD2', famille: 'MD', niveau: 2, prerequis: ['MD1', 'EG2'], titre: 'Simplifier avant de multiplier',
      regle: 'Dans un produit de fractions, on peut <b>simplifier avant de calculer</b> : un facteur du numérateur et le même facteur du dénominateur s’éliminent.',
      methode: 'Touche « Simplifier », puis un nombre d’un numérateur et un nombre d’un dénominateur qui ont un diviseur commun : ils se barrent, et tu écris ce qu’il reste à la place de chacun (rien s’il reste 1). « Décomposer » fait apparaître les facteurs (9 = 3 × 3). Quand plus rien ne se simplifie, multiplie ce qui reste.',
      exemple: { consigne: 'Calcule', depart: '[14|15] × [25|21]', prefixe: 'A =', lignes: ['[14×25|15×21]', '[2×7×5×5|3×5×3×7]', '[2×5|3×3]', '[10|9]'] },
      piege: 'On simplifie un facteur d’un numérateur avec un facteur d’un dénominateur, jamais deux facteurs du numérateur entre eux. Et seulement dans un produit : dans {[2|3] + [3|4]}, on ne barre pas les 3.',
      gen(niv) {
        const K = niv === 1 ? [2, 3, 5] : niv === 2 ? [2, 3, 5, 7] : [3, 5, 7, 11];
        const v = tirer(() => ({ a: rnd(1, 5), b: rnd(1, 5), c: rnd(1, 5), d: rnd(1, 5), k1: choix(K), k2: choix(K) }),
          v => Q.pgcd(v.a * v.c, v.b * v.d) === 1 && v.b * v.d > 1 && v.a * v.k1 !== v.b * v.k2 && v.c * v.k2 !== v.d * v.k1 && v.k1 !== v.k2);
        const n1 = v.a * v.k1, d1 = v.b * v.k2, n2 = v.c * v.k2, d2 = v.d * v.k1;
        const prod = (x, k) => x === 1 ? String(k) : x + '×' + k;
        return { consigne: 'Calcule en <b>simplifiant avant de multiplier</b> : touche « Simplifier », puis un nombre du numérateur et un nombre du dénominateur qui ont un diviseur commun, pour les barrer (« Décomposer » peut aider). Écris ensuite le résultat sous forme d’une fraction irréductible.', exige: true, depart: fr(n1, d1) + ' × ' + fr(n2, d2), prefixe: 'A =',
          valeur: Q.red(n1 * n2, d1 * d2), but: 'irr',
          solution: ['[' + n1 + '×' + n2 + '|' + d1 + '×' + d2 + ']', '[' + prod(v.a, v.k1) + '×' + prod(v.c, v.k2) + '|' + prod(v.b, v.k2) + '×' + prod(v.d, v.k1) + ']',
            '[' + [v.a, v.c].filter(x => x > 1).concat(v.a * v.c === 1 ? [1] : []).join('×') + '|' + [v.b, v.d].filter(x => x > 1).join('×') + ']', propre(v.a * v.c, v.b * v.d)].filter((x, i, t) => t.indexOf(x) === i),
          indices: [n1 + ' (en haut) et ' + d2 + ' (en bas) ont un diviseur commun : ' + v.k1 + '. Touche « Simplifier », puis ces deux nombres.',
            'Il reste ' + v.a + ' à la place de ' + n1 + ' et ' + v.d + ' à la place de ' + d2 + '. Fais de même avec ' + d1 + ' et ' + n2 + ' (diviseur commun : ' + v.k2 + ').',
            'Quand plus rien ne se simplifie, multiplie ce qui reste en haut, puis ce qui reste en bas.'] };
      } },
    { id: 'MD3', famille: 'MD', niveau: 1, prerequis: [], titre: 'Inverse d’une fraction',
      regle: 'L’<b>inverse</b> d’un nombre x (non nul) est le nombre qui, multiplié par x, donne 1. L’inverse de {[a|b]} est {[b|a]} : on échange le numérateur et le dénominateur.',
      methode: 'Fraction : échange le numérateur et le dénominateur. Nombre entier n : son inverse est {[1|n]}.',
      exemple: { affiche: 'Inverse de {[3|7]}', lignes: ['[7|3]'] },
      piege: 'Ne confonds pas l’inverse et l’opposé : l’opposé de {[3|7]} est {−[3|7]}, son inverse est {[7|3]}.',
      gen(niv) {
        let x, sol, ind;
        const t = niv === 1 ? 0 : rnd(0, 2);
        if (t === 1) { const n = rnd(2, 12); x = { n, d: 1 }; sol = [fr(1, n)]; ind = n + ' = ' + m(fr(n, 1)) + '.'; }
        else if (t === 2) { const n = rnd(2, 12); x = { n: 1, d: n }; sol = [String(n)]; ind = 'Échange le numérateur et le dénominateur, puis simplifie : ' + m(fr(n, 1)) + ' = ' + n + '.'; }
        else {
          const v = tirer(() => ({ a: rnd(1, 12), b: rnd(2, 12) }), v => v.a !== v.b && v.a !== 1 && Q.pgcd(v.a, v.b) === 1 && (niv > 1 || v.a < v.b));
          x = { n: v.a, d: v.b }; sol = [propre(v.b, v.a)]; ind = 'Échange le numérateur et le dénominateur.';
        }
        const xt = x.d === 1 ? String(x.n) : fr(x.n, x.d);
        return { consigne: 'Donne l’<b>inverse</b> de ce nombre (fraction irréductible ou nombre entier).', affiche: 'Inverse de ' + m(xt), ref: null,
          valeur: Q.red(x.d, x.n), but: 'irr', solution: sol,
          indices: ['L’inverse d’un nombre x est le nombre qui, multiplié par x, donne 1.', ind],
          diag: v => Q.egal(v, Q.red(x.n, x.d)) ? 'Tu as recopié le nombre. L’inverse s’obtient en échangeant le numérateur et le dénominateur.'
            : Q.egal(v, Q.red(-x.n, x.d)) ? 'Ça, c’est l’opposé (le même nombre avec le signe contraire). L’inverse s’obtient en échangeant le numérateur et le dénominateur.' : null };
      } },
    { id: 'MD4', famille: 'MD', niveau: 2, prerequis: ['MD1', 'MD3'], titre: 'Diviser par une fraction',
      regle: 'Diviser par une fraction, c’est <b>multiplier par son inverse</b> : {[a|b] ÷ [c|d] = [a|b] × [d|c]}.',
      methode: 'Remplace « ÷ {[c|d]} » par « × {[d|c]} » (on retourne la deuxième fraction), puis multiplie comme d’habitude et simplifie.',
      exemple: { consigne: 'Calcule', depart: '[2|5] ÷ [3|4]', prefixe: 'A =', lignes: ['[2|5] × [4|3]', '[2×4|5×3]', '[8|15]'] },
      piege: 'C’est la deuxième fraction (celle par laquelle on divise) qu’on retourne, pas la première.',
      gen(niv) {
        const v = tirer(() => ({ a: rnd(1, niv === 3 ? 12 : 8), b: rnd(2, niv === 3 ? 12 : 9), c: rnd(1, niv === 3 ? 12 : 8), d: rnd(2, niv === 3 ? 12 : 9) }),
          v => v.a !== v.b && v.c !== v.d && Q.pgcd(v.a, v.b) === 1 && Q.pgcd(v.c, v.d) === 1 && (niv === 1 ? Q.pgcd(v.a * v.d, v.b * v.c) === 1 : niv === 2 ? Q.pgcd(v.a * v.d, v.b * v.c) > 1 : true) && v.b * v.c <= 100);
        const N = v.a * v.d, D = v.b * v.c;
        return { consigne: 'Calcule et donne le résultat sous forme d’une <b>fraction irréductible</b>.', depart: fr(v.a, v.b) + ' ÷ ' + fr(v.c, v.d), prefixe: 'A =', valeur: Q.red(N, D), but: 'irr',
          solution: [fr(v.a, v.b) + ' × ' + fr(v.d, v.c), '[' + v.a + '×' + v.d + '|' + v.b + '×' + v.c + ']', fr(N, D)].concat(simp(N, D)),
          indices: ['Diviser par une fraction, c’est multiplier par son inverse.', 'L’inverse de ' + m(fr(v.c, v.d)) + ' est ' + m(fr(v.d, v.c)) + '.',
            'Écris ' + m(fr(v.a, v.b) + ' × ' + fr(v.d, v.c)) + ' puis multiplie.'] };
      } },

    /* ---------------- Additionner et soustraire ---------------- */
    { id: 'AS1', famille: 'AS', niveau: 1, prerequis: [], titre: 'Additionner avec le même dénominateur',
      regle: 'Pour additionner (ou soustraire) des fractions qui ont le <b>même dénominateur</b>, on additionne (ou on soustrait) les numérateurs et on <b>garde le dénominateur</b>.',
      methode: '{[a|d] + [b|d] = [a+b|d]}. Simplifie ensuite si c’est possible.',
      exemple: { consigne: 'Calcule', depart: '[5|9] + [7|9]', prefixe: 'A =', lignes: ['[5+7|9]', '[12|9]', '[4×3|3×3]', '[4|3]'] },
      piege: 'On n’additionne pas les dénominateurs : {[5|9] + [7|9]} n’est pas {[12|18]}.',
      gen(niv) {
        const o = niv === 1 ? '+' : choix(['+', M]);
        const trois = niv === 3 && Math.random() < 0.5;
        const v = tirer(() => ({ d: rnd(3, niv === 1 ? 9 : 15), a: rnd(1, 14), b: rnd(1, 14), c: rnd(1, 9) }), v => {
          const S = trois ? v.a + v.b - v.c : o === '+' ? v.a + v.b : v.a - v.b;
          return S > 0 && v.a !== v.d && v.b !== v.d && (niv === 1 ? Q.pgcd(S, v.d) === 1 && v.a < v.d && v.b < v.d : niv === 2 ? Q.pgcd(S, v.d) > 1 : true);
        });
        const S = trois ? v.a + v.b - v.c : o === '+' ? v.a + v.b : v.a - v.b;
        const dep = fr(v.a, v.d) + ' ' + o + ' ' + fr(v.b, v.d) + (trois ? ' ' + M + ' ' + fr(v.c, v.d) : '');
        const nums = trois ? v.a + '+' + v.b + M + v.c : v.a + o + v.b;
        return { consigne: 'Calcule et donne le résultat sous forme d’une <b>fraction irréductible</b> (ou d’un nombre entier).', depart: trois ? fr(v.a, v.d) + ' + ' + fr(v.b, v.d) + ' ' + M + ' ' + fr(v.c, v.d) : dep, prefixe: 'A =',
          valeur: Q.red(S, v.d), but: 'irr', solution: ['[' + nums + '|' + v.d + ']', fr(S, v.d)].concat(simp(S, v.d)),
          indices: ['Les dénominateurs sont égaux : calcule avec les numérateurs et garde le dénominateur ' + v.d + '.', 'Écris ' + m('[' + nums + '|' + v.d + ']') + '.', 'Vérifie à la fin si la fraction peut se simplifier.'] };
      } },
    { id: 'AS2', famille: 'AS', niveau: 2, prerequis: ['AS1', 'EG1'], titre: 'Un dénominateur multiple de l’autre',
      regle: 'Quand un dénominateur est un <b>multiple</b> de l’autre, on transforme seulement la fraction qui a le plus petit dénominateur pour avoir le <b>même dénominateur</b>.',
      methode: 'Cherche par quel nombre multiplier le petit dénominateur pour obtenir le grand, multiplie le numérateur et le dénominateur de cette fraction par ce nombre, puis additionne les numérateurs.',
      exemple: { consigne: 'Calcule', depart: '[2|3] + [1|12]', prefixe: 'A =', lignes: ['[2×4|3×4] + [1|12]', '[8|12] + [1|12]', '[8+1|12]', '[9|12]', '[3×3|4×3]', '[3|4]'] },
      piege: 'Quand tu multiplies le dénominateur par 4, multiplie aussi le numérateur par 4 : {[2|3]} devient {[8|12]}, pas {[2|12]}.',
      gen(niv) {
        const o = niv === 1 ? '+' : choix(['+', M]);
        const v = tirer(() => ({ b: rnd(2, niv === 3 ? 9 : 6), k: rnd(2, niv === 3 ? 5 : 4), a: rnd(1, 9), c: rnd(1, 20), ordre: niv > 1 && Math.random() < 0.4 }), v => {
          const L = v.b * v.k, x = v.a * v.k;
          if (v.a === v.b || Q.pgcd(v.a, v.b) !== 1) return false;
          if (Q.pgcd(v.c, L) !== 1 || v.c === L) return false;
          const S = v.ordre ? (o === '+' ? v.c + x : v.c - x) : (o === '+' ? x + v.c : x - v.c);
          return S > 0 && L <= 40 && (niv === 1 ? v.a < v.b && v.c < L : true);
        });
        const L = v.b * v.k, A = { n: v.a, d: v.b }, B = { n: v.c, d: L };
        const s = v.ordre ? solSomme(B, A, o, L) : solSomme(A, B, o, L);
        const dep = v.ordre ? fr(v.c, L) + ' ' + o + ' ' + fr(v.a, v.b) : fr(v.a, v.b) + ' ' + o + ' ' + fr(v.c, L);
        return { consigne: 'Calcule et donne le résultat sous forme d’une <b>fraction irréductible</b> (ou d’un nombre entier).', depart: dep, prefixe: 'A =',
          valeur: val(dep), but: 'irr', solution: s.lignes,
          indices: [L + ' est un multiple de ' + v.b + ' : mets les deux fractions au dénominateur ' + L + '.',
            v.b + ' × ' + v.k + ' = ' + L + ' : ' + m(fr(v.a, v.b)) + ' = ' + m('[' + v.a + '×' + v.k + '|' + v.b + '×' + v.k + ']') + ' = ' + m(fr(v.a * v.k, L)) + '.',
            'Les dénominateurs sont alors égaux : calcule avec les numérateurs, garde ' + L + ', puis simplifie si c’est possible.'] };
      } },
    { id: 'AS3', famille: 'AS', niveau: 3, prerequis: ['AS2'], titre: 'Dénominateurs différents',
      regle: 'Pour additionner (ou soustraire) des fractions de dénominateurs différents, on les met d’abord au <b>même dénominateur</b> : un multiple commun des deux dénominateurs (le plus petit possible).',
      methode: 'Cherche un multiple commun des deux dénominateurs (leur produit marche toujours). Transforme chaque fraction pour avoir ce dénominateur, puis additionne les numérateurs.',
      exemple: { consigne: 'Calcule', depart: '[3|4] + [1|6]', prefixe: 'A =', lignes: ['[3×3|4×3] + [1×2|6×2]', '[9|12] + [2|12]', '[9+2|12]', '[11|12]'] },
      piege: 'Chaque fraction se multiplie par son propre nombre : {[3|4]} par 3 (pour avoir 12), {[1|6]} par 2.',
      gen(niv) {
        const o = niv === 1 ? '+' : choix(['+', M]);
        const v = tirer(() => ({ b: rnd(2, niv === 3 ? 12 : 9), d: rnd(2, niv === 3 ? 12 : 9), a: rnd(1, 9), c: rnd(1, 9) }), v => {
          if (v.b === v.d || v.b % v.d === 0 || v.d % v.b === 0) return false;
          if (v.a === v.b || v.c === v.d || Q.pgcd(v.a, v.b) !== 1 || Q.pgcd(v.c, v.d) !== 1) return false;
          const L = Q.ppcm(v.b, v.d), S = o === '+' ? v.a * L / v.b + v.c * L / v.d : v.a * L / v.b - v.c * L / v.d;
          return S > 0 && L <= 60 && (niv === 1 ? Q.pgcd(v.b, v.d) === 1 && v.a < v.b && v.c < v.d : niv === 2 ? Q.pgcd(v.b, v.d) > 1 : true);
        });
        const L = Q.ppcm(v.b, v.d), dep = fr(v.a, v.b) + ' ' + o + ' ' + fr(v.c, v.d);
        const s = solSomme({ n: v.a, d: v.b }, { n: v.c, d: v.d }, o, L);
        return { consigne: 'Calcule et donne le résultat sous forme d’une <b>fraction irréductible</b> (ou d’un nombre entier).', depart: dep, prefixe: 'A =',
          valeur: val(dep), but: 'irr', solution: s.lignes,
          indices: ['Cherche un multiple commun de ' + v.b + ' et de ' + v.d + ' (le plus petit possible).',
            L + ' convient : ' + v.b + ' × ' + (L / v.b) + ' = ' + L + ' et ' + v.d + ' × ' + (L / v.d) + ' = ' + L + '.',
            m(fr(v.a, v.b)) + ' = ' + m(fr(v.a * L / v.b, L)) + ' et ' + m(fr(v.c, v.d)) + ' = ' + m(fr(v.c * L / v.d, L)) + '.'] };
      } },

    /* ---------------- Fractions et nombres relatifs ---------------- */
    { id: 'RE1', famille: 'RE', niveau: 2, prerequis: ['EG2'], titre: 'Le signe d’une fraction',
      regle: 'Le quotient de deux nombres de <b>même signe</b> est positif, de <b>signes contraires</b> il est négatif : {[−a|b] = [a|−b] = −[a|b]} et {[−a|−b] = [a|b]}.',
      methode: 'Compte les signes − : un nombre pair de signes −, la fraction est positive ; un nombre impair, elle est négative. Écris le signe devant la fraction, puis simplifie.',
      exemple: { consigne: 'Écris avec le signe devant', depart: '[6|−8]', prefixe: 'A =', lignes: ['−[6|8]', '−[3×2|4×2]', '−[3|4]'] },
      piege: 'Le signe − se place devant la fraction ou au numérateur, pas au dénominateur.',
      gen(niv) {
        const v = tirer(() => ({ a: rnd(1, 9), b: rnd(2, 9), k: niv === 1 ? 1 : rnd(2, 5) }), v => v.a !== v.b && Q.pgcd(v.a, v.b) === 1);
        const N = v.a * v.k, D = v.b * v.k;
        const t = rnd(0, niv >= 2 ? 4 : 2);
        const dep = [fr(-N, D), fr(N, -D), fr(-N, -D), M + fr(-N, D), M + fr(N, -D)][t];
        const neg = t === 0 || t === 1;
        const sol = [(neg ? M : '') + fr(N, D)].concat(simp(neg ? -N : N, D));
        return { consigne: 'Écris ce nombre sous la forme d’une <b>fraction irréductible</b>, avec son signe devant (ou sans signe s’il est positif).', depart: dep, prefixe: 'A =',
          valeur: val(dep), but: 'irr', solution: sol,
          indices: ['Le quotient de deux nombres de même signe est positif ; de signes contraires, il est négatif.',
            'Compte les signes − : ' + (neg ? 'il y en a un nombre impair, le nombre est négatif.' : 'il y en a un nombre pair, le nombre est positif.'),
            v.k > 1 ? 'Simplifie ensuite par ' + v.k + '.' : 'La fraction ' + m(fr(N, D)) + ' est déjà irréductible.'] };
      } },
    { id: 'RE2', famille: 'RE', niveau: 3, prerequis: ['RE1', 'MD1', 'MD4'], titre: 'Multiplier et diviser des fractions négatives',
      regle: 'On calcule comme avec des fractions positives, et on applique la <b>règle des signes</b> : même signe → résultat positif, signes contraires → résultat négatif.',
      methode: 'Détermine d’abord le signe du résultat, puis calcule avec les nombres sans leur signe et simplifie.',
      exemple: { consigne: 'Calcule', depart: '[−2|3] × [9|4]', prefixe: 'A =', lignes: ['−[2×9|3×4]', '−[2×3×3|3×2×2]', '−[3|2]'] },
      piege: 'Pour diviser, retourne toujours la deuxième fraction, avec son signe.',
      gen(niv) {
        const o = niv === 1 ? '×' : choix(['×', '÷']);
        const v = tirer(() => ({ a: rnd(1, 9), b: rnd(2, 9), c: rnd(1, 9), d: rnd(2, 9), s1: choix([1, -1]), s2: choix([1, -1]), place: rnd(0, 1) }), v => {
          if (v.s1 > 0 && v.s2 > 0) return false;
          if (v.a === v.b || v.c === v.d || Q.pgcd(v.a, v.b) !== 1 || Q.pgcd(v.c, v.d) !== 1) return false;
          const N = o === '×' ? v.a * v.c : v.a * v.d, D = o === '×' ? v.b * v.d : v.b * v.c;
          return D <= 80 && (niv >= 2 || Q.pgcd(N, D) === 1);
        });
        // signe au numérateur ou au dénominateur
        const f1 = v.s1 < 0 ? (v.place ? fr(v.a, -v.b) : fr(-v.a, v.b)) : fr(v.a, v.b);
        const f2 = v.s2 < 0 ? fr(-v.c, v.d) : fr(v.c, v.d);
        const dep = f1 + ' ' + o + ' ' + f2;
        const neg = v.s1 * v.s2 < 0, s = neg ? M : '';
        const N = o === '×' ? v.a * v.c : v.a * v.d, D = o === '×' ? v.b * v.d : v.b * v.c;
        const sol = (o === '÷' ? [f1 + ' × ' + (v.s2 < 0 ? fr(-v.d, v.c) : fr(v.d, v.c))] : [])
          .concat([s + '[' + (o === '×' ? v.a + '×' + v.c : v.a + '×' + v.d) + '|' + (o === '×' ? v.b + '×' + v.d : v.b + '×' + v.c) + ']', s + fr(N, D)]).concat(simp(neg ? -N : N, D));
        return { consigne: 'Calcule et donne le résultat sous forme d’une <b>fraction irréductible</b>.', depart: dep, prefixe: 'A =',
          valeur: val(dep), but: 'irr', solution: sol,
          indices: ['Détermine d’abord le signe du résultat : ' + (neg ? 'signes contraires, le résultat est négatif.' : 'même signe, le résultat est positif.'),
            o === '÷' ? 'Diviser par une fraction, c’est multiplier par son inverse.' : 'Multiplie les numérateurs entre eux et les dénominateurs entre eux.', 'Simplifie si c’est possible.'] };
      } },
    { id: 'RE3', famille: 'RE', niveau: 3, prerequis: ['RE1', 'AS2'], titre: 'Additionner et soustraire des fractions négatives',
      regle: 'On met au même dénominateur comme d’habitude, puis on calcule avec les numérateurs en suivant les règles des <b>nombres relatifs</b>.',
      methode: 'Écris chaque fraction avec le signe au numérateur, mets au même dénominateur, calcule le numérateur (somme de relatifs), puis simplifie.',
      exemple: { consigne: 'Calcule', depart: '[1|4] − [5|6]', prefixe: 'A =', lignes: ['[1×3|4×3] − [5×2|6×2]', '[3|12] − [10|12]', '[3−10|12]', '[−7|12]', '−[7|12]'] },
      piege: 'Le résultat peut être négatif : 3 − 10 = −7.',
      gen(niv) {
        const v = tirer(() => ({ b: rnd(2, 9), d: rnd(2, 9), a: rnd(1, 9), c: rnd(1, 9), t: rnd(0, niv === 1 ? 0 : 2) }), v => {
          if (v.a === v.b || v.c === v.d || Q.pgcd(v.a, v.b) !== 1 || Q.pgcd(v.c, v.d) !== 1) return false;
          const L = Q.ppcm(v.b, v.d);
          if (L > 36 || (niv === 1 && v.b !== v.d && L !== Math.max(v.b, v.d))) return false;
          const x = v.a * L / v.b, y = v.c * L / v.d;
          const S = v.t === 0 ? x - y : v.t === 1 ? -x + y : -x - y;
          return S !== 0 && (v.t !== 0 || S < 0);
        });
        const L = Q.ppcm(v.b, v.d);
        let dep, A, B, o;
        if (v.t === 0) { dep = fr(v.a, v.b) + ' ' + M + ' ' + fr(v.c, v.d); A = { n: v.a, d: v.b }; B = { n: v.c, d: v.d }; o = M; }
        else if (v.t === 1) { dep = fr(-v.a, v.b) + ' + ' + fr(v.c, v.d); A = { n: -v.a, d: v.b }; B = { n: v.c, d: v.d }; o = '+'; }
        else { dep = fr(-v.a, v.b) + ' ' + M + ' ' + fr(v.c, v.d); A = { n: -v.a, d: v.b }; B = { n: v.c, d: v.d }; o = M; }
        const s = solSomme(A, B, o, L);
        return { consigne: 'Calcule et donne le résultat sous forme d’une <b>fraction irréductible</b> (ou d’un nombre entier).', depart: dep, prefixe: 'A =',
          valeur: val(dep), but: 'irr', solution: s.lignes,
          indices: [v.b === v.d ? 'Les dénominateurs sont égaux.' : 'Mets les deux fractions au dénominateur ' + L + '.',
            'Calcule le numérateur avec les règles des nombres relatifs.', 'Le résultat peut être négatif : écris le signe devant la fraction.'] };
      } },

    /* ---------------- Priorités et calculs enchaînés ---------------- */
    { id: 'PR1', famille: 'PR', niveau: 3, prerequis: ['MD1', 'AS2'], titre: 'Priorités opératoires',
      regle: 'Sans parenthèses, on effectue d’abord les <b>multiplications et divisions</b>, puis les <b>additions et soustractions</b>.',
      methode: 'Repère la multiplication (ou la division), calcule-la sur une ligne en recopiant le reste, puis termine par l’addition (ou la soustraction).',
      exemple: { consigne: 'Calcule', depart: '[1|2] + [3|4] × [2|3]', prefixe: 'A =', lignes: ['[1|2] + [3×2|4×3]', '[1|2] + [6|12]', '[1|2] + [1|2]', '[2|2]', '1'] },
      piege: 'On ne calcule pas de gauche à droite : {[1|2] + [3|4]} ne se calcule pas en premier.',
      gen(niv) {
        const div = niv === 3 && Math.random() < 0.5;
        const v = tirer(() => ({ a: rnd(1, 7), b: rnd(2, 9), c: rnd(1, 7), d: rnd(2, 9), e: rnd(1, 7), f: rnd(2, 9), o: niv === 1 ? '+' : choix(['+', M]), avant: Math.random() < 0.5 }), v => {
          if (v.a === v.b || v.c === v.d || v.e === v.f || Q.pgcd(v.a, v.b) !== 1 || Q.pgcd(v.c, v.d) !== 1 || Q.pgcd(v.e, v.f) !== 1) return false;
          const P = div ? Q.red(v.c * v.f, v.d * v.e) : Q.red(v.c * v.e, v.d * v.f);
          const L = Q.ppcm(v.b, P.d);
          if (L > 36 || P.d === 1 || (L !== v.b && L !== P.d)) return false;
          const R = v.o === '+' ? Q.add({ n: v.a, d: v.b }, P) : v.avant ? Q.sous(P, { n: v.a, d: v.b }) : Q.sous({ n: v.a, d: v.b }, P);
          return R.n > 0 && R.d <= 36;
        });
        const os = div ? '÷' : '×';
        const prod = fr(v.c, v.d) + ' ' + os + ' ' + fr(v.e, v.f);
        const dep = v.avant ? prod + ' ' + v.o + ' ' + fr(v.a, v.b) : fr(v.a, v.b) + ' ' + v.o + ' ' + prod;
        const Nn = div ? v.c * v.f : v.c * v.e, Dd = div ? v.d * v.e : v.d * v.f, P = Q.red(Nn, Dd);
        const pt = '[' + (div ? v.c + '×' + v.f : v.c + '×' + v.e) + '|' + (div ? v.d + '×' + v.e : v.d + '×' + v.f) + ']';
        const autour = x => v.avant ? x + ' ' + v.o + ' ' + fr(v.a, v.b) : fr(v.a, v.b) + ' ' + v.o + ' ' + x;
        const l = [];
        if (div) l.push(autour(fr(v.c, v.d) + ' × ' + fr(v.f, v.e)));
        l.push(autour(pt), autour(fr(Nn, Dd)));
        if (P.d !== Dd) l.push(autour(fr(P.n, P.d)));
        const A = v.avant ? P : { n: v.a, d: v.b }, B = v.avant ? { n: v.a, d: v.b } : P;
        const s = solSomme(A, B, v.o, Q.ppcm(A.d, B.d));
        return { consigne: 'Calcule en respectant les <b>priorités</b>. Donne une fraction irréductible (ou un nombre entier).', depart: dep, prefixe: 'A =',
          valeur: val(dep), but: 'irr', solution: l.concat(s.lignes),
          indices: ['La ' + (div ? 'division' : 'multiplication') + ' est prioritaire : calcule d’abord ' + m(prod) + ' en recopiant le reste.',
            m(prod) + ' = ' + m(propre(P.n, P.d)) + '.', 'Il reste ' + m(autour(propre(P.n, P.d))) + ' : mets au même dénominateur.'] };
      } },
    { id: 'PR2', famille: 'PR', niveau: 4, prerequis: ['PR1', 'AS3'], titre: 'Calculs avec parenthèses',
      regle: 'On effectue d’abord les calculs <b>entre parenthèses</b>, puis les multiplications et divisions, puis les additions et soustractions.',
      methode: 'Calcule l’intérieur des parenthèses sur une ligne en recopiant le reste, puis termine le calcul.',
      exemple: { consigne: 'Calcule', depart: '([1|2] + [1|3]) × [3|5]', prefixe: 'A =', lignes: ['([1×3|2×3] + [1×2|3×2]) × [3|5]', '([3|6] + [2|6]) × [3|5]', '[5|6] × [3|5]', '[5×3|6×5]', '[1|2]'] },
      piege: 'Sans les parenthèses, le calcul serait différent : les parenthèses passent avant la multiplication.',
      gen(niv) {
        const op = niv === 3 ? choix(['×', '÷']) : '×';
        const v = tirer(() => ({ a: rnd(1, 7), b: rnd(2, 9), c: rnd(1, 7), d: rnd(2, 9), e: rnd(1, 7), f: rnd(2, 9), o: niv === 1 ? '+' : choix(['+', M]), avant: Math.random() < 0.5 }), v => {
          if (v.a === v.b || v.c === v.d || v.e === v.f || Q.pgcd(v.a, v.b) !== 1 || Q.pgcd(v.c, v.d) !== 1 || Q.pgcd(v.e, v.f) !== 1 || v.b === v.d) return false;
          const L = Q.ppcm(v.b, v.d);
          if (L > 24 || (niv === 1 && L !== Math.max(v.b, v.d))) return false;
          const S = v.o === '+' ? Q.add({ n: v.a, d: v.b }, { n: v.c, d: v.d }) : Q.sous({ n: v.a, d: v.b }, { n: v.c, d: v.d });
          if (S.n <= 0) return false;
          const R = op === '×' ? Q.mul(S, { n: v.e, d: v.f }) : Q.div(S, { n: v.e, d: v.f });
          return R.d <= 40 && Math.abs(R.n) <= 60;
        });
        const par = '(' + fr(v.a, v.b) + ' ' + v.o + ' ' + fr(v.c, v.d) + ')';
        const ef = fr(v.e, v.f);
        const autour = x => v.avant && op === '×' ? ef + ' × ' + x : x + ' ' + op + ' ' + ef;
        const dep = autour(par);
        const L = Q.ppcm(v.b, v.d);
        const s = solSomme({ n: v.a, d: v.b }, { n: v.c, d: v.d }, v.o, L, false);
        // lignes de la somme, gardées entre parenthèses, puis la somme simplifiée
        const S = Q.red(s.S, L);
        const l = s.lignes.slice(0, -1).map(x => autour(/^\[[^\[\]]*\]$/.test(x) ? x : '(' + x + ')'));
        l.push(autour(fr(s.S, L)));
        if (S.d !== L) l.push(autour(fr(S.n, S.d)));
        let N, D, pl;
        if (op === '×') { N = S.n * v.e; D = S.d * v.f; pl = v.avant ? '[' + v.e + '×' + S.n + '|' + v.f + '×' + S.d + ']' : '[' + S.n + '×' + v.e + '|' + S.d + '×' + v.f + ']'; }
        else { l.push(fr(S.n, S.d) + ' × ' + fr(v.f, v.e)); N = S.n * v.f; D = S.d * v.e; pl = '[' + S.n + '×' + v.f + '|' + S.d + '×' + v.e + ']'; }
        l.push(pl, fr(N, D));
        l.push(...simp(N, D));
        return { consigne: 'Calcule en commençant par les <b>parenthèses</b>. Donne une fraction irréductible (ou un nombre entier).', depart: dep, prefixe: 'A =',
          valeur: val(dep), but: 'irr', solution: l,
          indices: ['Commence par le calcul entre parenthèses, en recopiant le reste du calcul.',
            m(fr(v.a, v.b) + ' ' + v.o + ' ' + fr(v.c, v.d)) + ' = ' + m(propre(S.n, S.d)) + ' (dénominateur commun ' + L + ').',
            op === '÷' ? 'Ensuite, diviser par ' + m(ef) + ', c’est multiplier par ' + m(fr(v.f, v.e)) + '.' : 'Ensuite, multiplie par ' + m(ef) + ' et simplifie.'] };
      } }
  ];

  const R = {};
  liste.forEach(c => { R[c.id] = c; });
  // une question de la compétence id, difficulté niv (1 à 3)
  function question(id, niv) {
    const c = R[id];
    const q = c.gen(niv);
    q.comp = id; q.niv = niv;
    if (q.ref === undefined) q.ref = q.depart;
    q.prefixe = q.prefixe || '';
    return q;
  }
  // texte d'une fiche : {écriture compacte} → écriture mathématique
  const texte = t => String(t).replace(/\{([^{}]+)\}/g, (x, e) => m(e));
  FRA.C = { familles, liste, R, question, fr, propre, texte };
})();
