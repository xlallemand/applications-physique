/* ============================================================
   Équations du 1er degré — les compétences (objet EQ.C)
   ------------------------------------------------------------
   Chaque compétence : identifiant (2 lettres + numéro), famille, niveau
   (1 à 4 : ordre de progression), prérequis, texte de la fiche
   (règle, méthode, exemple, piège) et une fabrique de questions
   gen(niv) (niv = difficulté des nombres, 1 à 3) qui renvoie à chaque
   appel une question différente :
     { comp, niv, consigne, depart, valeur, solution: [lignes], indices: [html], diag(v) }
       depart   : écriture compacte de l'équation (voir expr.js) ;
       valeur   : solution exacte attendue { n, d } ;
       solution : lignes de la résolution détaillée (écriture compacte) ;
       indices  : aides successives (HTML) ;
       diag(v)  : diagnostic propre à la compétence (solution fausse v d'une ligne), ou null.
   Dépend de : expr.js (EQ.X).

   API : EQ.C.familles, EQ.C.liste, EQ.C.R (par identifiant), EQ.C.question(id, niv), EQ.C.texte(t)
   ============================================================ */
(function () {
  'use strict';
  const EQ = window.EQ = window.EQ || {};
  const X = EQ.X, Q = X.Q, m = X.m, M = '−';

  /* ---------- Hasard ---------- */
  const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const rnz = (a, b) => { let v; do { v = rnd(a, b); } while (v === 0); return v; };
  const choix = l => l[Math.floor(Math.random() * l.length)];
  // tire des valeurs jusqu'à ce que la condition soit remplie
  function tirer(f, ok) { for (let k = 0; k < 500; k++) { const v = f(); if (ok(v)) return v; } return f(); }

  /* ---------- Écritures (compactes, voir expr.js) ---------- */
  const nb = v => (v < 0 ? M : '') + Math.abs(v);
  // terme en x : 1 → x, −1 → −x, 3 → 3x
  const cx = a => (a === 1 ? '' : a === -1 ? M : nb(a)) + 'x';
  // « + b » ou « − |b| » à la suite d'un terme
  const plus = b => b < 0 ? ' ' + M + ' ' + (-b) : ' + ' + b;
  // « + ax » ou « − |a|x » à la suite d'un terme
  const plusx = a => a < 0 ? ' ' + M + ' ' + cx(-a) : ' + ' + cx(a);
  // a x + b
  const ex = (a, b) => a === 0 ? nb(b) : cx(a) + (b ? plus(b) : '');
  // fraction écrite telle quelle (signe au numérateur ou au dénominateur) : [20|−4]
  const fr = (n, d) => '[' + nb(n) + '|' + nb(d) + ']';
  // nombre propre : 3, −2, [3|4], −[3|4]
  const propre = (n, d) => Q.ecrire(Q.red(n, d));
  const val = t => { const e = X.analyserEq(X.lire(t)); return X.solution(X.lin(e.g), X.lin(e.d)).v; };
  // lignes de la fin d'une résolution : a x = c → x = [c|a] → (simplification) → x = solution
  function finDiv(a, c) {
    if (a === 1) return [];
    if (a === -1) return ['x = ' + nb(-c)];
    const l = ['x = ' + fr(c, a)], r = Q.red(c, a), g = Q.pgcd(c, a);
    if (r.d === 1) l.push('x = ' + nb(r.n));
    else if (g > 1) l.push('x = ' + (r.n < 0 ? M : '') + '[' + (Math.abs(c) / g) + '×' + g + '|' + (Math.abs(a) / g) + '×' + g + ']', 'x = ' + propre(c, a));
    else if (a < 0) l.push('x = ' + propre(c, a));
    return l;
  }
  const CONSIGNE = 'Résous l’équation : écris des lignes jusqu’à <b>x = …</b>';
  const CONSIGNE_FR = 'Résous l’équation. Donne la solution sous forme d’une <b>fraction irréductible</b> (ou d’un nombre entier).';

  /* =====================================================================
     Familles
     ===================================================================== */
  const familles = [
    { id: 'TA', nom: 'Termes additifs', desc: 'On peut ajouter ou soustraire le même nombre aux deux membres : un terme qui change de membre change de signe.' },
    { id: 'MU', nom: 'Termes multiplicatifs', desc: 'On peut multiplier ou diviser les deux membres par le même nombre (non nul) : un facteur devient un diviseur.' },
    { id: 'DE', nom: 'Deux étapes', desc: 'D’abord les termes additifs, ensuite le coefficient de x.' },
    { id: 'FR', nom: 'Solutions en fraction', desc: 'La solution n’est pas toujours un nombre entier : on la donne en fraction irréductible.' },
    { id: 'PA', nom: 'Parenthèses', desc: 'On développe d’abord, puis on résout comme d’habitude.' }
  ];

  /* =====================================================================
     Compétences
     ===================================================================== */
  const liste = [
    /* ---------------- Termes additifs ---------------- */
    { id: 'TA1', famille: 'TA', niveau: 1, prerequis: [], titre: 'Résoudre x + a = b',
      regle: 'On peut <b>ajouter ou soustraire le même nombre</b> aux deux membres d’une équation. Autrement dit : un terme qui <b>passe de l’autre côté</b> du signe = <b>change de signe</b> (+ devient −, − devient +).',
      methode: 'Repère le nombre ajouté à x (ou soustrait). Fais-le passer dans l’autre membre en changeant son signe, puis calcule.',
      exemple: { consigne: 'Résous', depart: 'x + 5 = 12', lignes: ['x = 12 − 5', 'x = 7'] },
      piege: 'Le signe change : {x + 5 = 12} donne {x = 12 − 5}, pas {x = 12 + 5}.',
      gen(niv) {
        const f = niv === 1 ? rnd(0, 1) : niv === 2 ? rnd(0, 2) : rnd(0, 3);       // 0 : x + a = b ; 1 : x − a = b ; 2 : a + x = b ; 3 : b = x + a
        const v = tirer(() => ({ S: niv === 1 ? rnd(1, 15) : niv === 2 ? rnz(-12, 15) : rnz(-30, 30), a: niv === 1 ? rnd(2, 9) : niv === 2 ? rnd(2, 15) : rnd(2, 30) }),
          v => f !== 1 || niv > 1 || v.S > v.a);
        const S = v.S, a = v.a, b = f === 1 ? S - a : S + a;
        const dep = f === 0 ? 'x + ' + a + ' = ' + nb(b) : f === 1 ? 'x − ' + a + ' = ' + nb(b) : f === 2 ? a + ' + x = ' + nb(b) : nb(b) + ' = x + ' + a;
        const sg = f === 1 ? '−' : '+', so = f === 1 ? '+' : '−';
        const sol = f === 3 ? [nb(b) + ' − ' + a + ' = x', nb(S) + ' = x'] : ['x = ' + nb(b) + ' ' + so + ' ' + a, 'x = ' + nb(S)];
        return { consigne: CONSIGNE, depart: dep, valeur: Q.red(S, 1), solution: sol,
          indices: [f === 3 ? 'x est dans le membre de droite : il faut y faire disparaître le « + ' + a + ' ».' : 'Pour isoler x, il faut faire disparaître le « ' + sg + ' ' + a + ' » du membre ' + (f === 2 ? 'de gauche (il est devant x)' : 'de gauche') + '.',
            'Un terme qui change de membre change de signe : « ' + sg + ' ' + a + ' » devient « ' + so + ' ' + a + ' » dans l’autre membre.',
            'Écris ' + m(sol[0]) + ', puis calcule.'] };
      } },
    { id: 'TA2', famille: 'TA', niveau: 2, prerequis: ['TA1'], titre: 'Regrouper les termes en x',
      regle: 'Quand x est dans les deux membres, on <b>regroupe les termes en x</b> dans un membre et les <b>nombres</b> dans l’autre. Chaque terme qui change de membre change de signe, les termes en x aussi.',
      methode: 'Fais passer le terme en x du membre de droite dans le membre de gauche, et le nombre du membre de gauche dans le membre de droite, en changeant leur signe. Réduis ensuite : {4x − 3x = x}.',
      exemple: { consigne: 'Résous', depart: '4x + 3 = 3x + 10', lignes: ['4x − 3x = 10 − 3', 'x = 7'] },
      piege: 'Le terme en x change aussi de signe : {4x + 3 = 3x + 10} donne {4x − 3x}, pas {4x + 3x}.',
      gen(niv) {
        const v = tirer(() => ({ S: niv === 1 ? rnd(1, 12) : niv === 2 ? rnz(-10, 12) : rnz(-15, 15), c: niv === 1 ? rnd(1, 5) : niv === 2 ? rnd(1, 8) : rnz(-6, 8),
          b: niv === 1 ? rnd(1, 9) : rnz(-12, 12), droite: niv > 1 && Math.random() < 0.4 }), v => {
          const a = v.c + 1, d = v.droite ? v.b - v.S : v.S + v.b;
          return a !== 0 && d !== 0 && (niv > 1 || d > 0);
        });
        const c = v.c, a = c + 1, b = v.b, S = v.S;
        let dep, sol;
        if (!v.droite) {
          // a x + b = c x + d, x = d − b
          const d = S + b;
          dep = ex(a, b) + ' = ' + ex(c, d);
          sol = [cx(a) + plusx(-c) + ' = ' + nb(d) + plus(-b), 'x = ' + nb(S)];
        } else {
          // c x + b = a x + d, b − d = x
          const d = b - S;
          dep = ex(c, b) + ' = ' + ex(a, d);
          sol = [nb(b) + plus(-d) + ' = ' + cx(a) + plusx(-c), nb(S) + ' = x'];
        }
        return { consigne: CONSIGNE, depart: dep, valeur: Q.red(S, 1), solution: sol,
          indices: ['Regroupe les termes en x dans un membre et les nombres dans l’autre.',
            'Chaque terme qui change de membre change de signe, les termes en x comme les nombres.',
            'Écris ' + m(sol[0]) + ', puis réduis chaque membre.'] };
      } },

    /* ---------------- Termes multiplicatifs ---------------- */
    { id: 'MU1', famille: 'MU', niveau: 1, prerequis: [], titre: 'Résoudre ax = b',
      regle: 'On peut <b>diviser les deux membres</b> d’une équation par un même nombre non nul. Dans {3x}, x est multiplié par 3 : pour isoler x, on <b>divise</b> les deux membres par 3.',
      methode: '{ax = b} donne {x = [b|a]}. Calcule ensuite le quotient.',
      exemple: { consigne: 'Résous', depart: '3x = 12', lignes: ['x = [12|3]', 'x = 4'] },
      piege: 'On ne soustrait pas le coefficient : {3x = 12} ne donne pas {x = 12 − 3}. {3x}, c’est {3 × x} : on divise par 3.',
      gen(niv) {
        const a = niv === 1 ? rnd(2, 9) : niv === 2 ? rnd(2, 10) : rnd(2, 12);
        const S = niv === 1 ? rnd(1, 10) : niv === 2 ? rnz(-10, 10) : rnz(-12, 12);
        const b = a * S, droite = niv === 3 && Math.random() < 0.3;
        const dep = droite ? nb(b) + ' = ' + cx(a) : cx(a) + ' = ' + nb(b);
        return { consigne: CONSIGNE, depart: dep, valeur: Q.red(S, 1), solution: finDiv(a, b),
          indices: ['Dans ' + m(cx(a)) + ', x est multiplié par ' + a + ' : pour isoler x, divise les deux membres par ' + a + '.',
            'Écris ' + m('x = ' + fr(b, a)) + ', puis calcule le quotient.'] };
      } },
    { id: 'MU2', famille: 'MU', niveau: 2, prerequis: ['MU1'], titre: 'Un coefficient négatif',
      regle: 'On divise par le coefficient de x <b>avec son signe</b>. {−x}, c’est {−1 × x} : {−x = 5} donne {x = −5}.',
      methode: 'Divise les deux membres par le coefficient de x, signe compris, puis applique la règle des signes : deux nombres de même signe donnent un quotient positif, de signes contraires un quotient négatif.',
      exemple: { consigne: 'Résous', depart: '−4x = 20', lignes: ['x = [20|−4]', 'x = −5'] },
      piege: '{−x = 7} ne donne pas {x = 7} : on change le signe des deux membres, {x = −7}.',
      gen(niv) {
        const a = niv === 1 ? choix([-1, -rnd(2, 9)]) : niv === 2 ? choix([-1, -rnd(2, 10)]) : -rnd(2, 12);
        const S = niv === 1 ? rnd(1, 10) * choix([1, -1]) : rnz(-12, 12);
        const b = a * S;
        return { consigne: CONSIGNE, depart: cx(a) + ' = ' + nb(b), valeur: Q.red(S, 1), solution: finDiv(a, b),
          indices: a === -1 ? [m('−x') + ', c’est ' + m('−1 × x') + '.', 'Change le signe des deux membres : si ' + m('−x = ' + nb(b)) + ', alors ' + m('x = ' + nb(-b)) + '.']
            : ['Divise les deux membres par ' + nb(a) + ', avec son signe.', 'Écris ' + m('x = ' + fr(b, a)) + ', puis applique la règle des signes.'] };
      } },
    { id: 'MU3', famille: 'MU', niveau: 2, prerequis: ['MU1'], titre: 'x divisé par un nombre',
      regle: 'Dans {[x|4]}, x est <b>divisé</b> par 4. Pour isoler x, on <b>multiplie</b> les deux membres par 4.',
      methode: '{[x|a] = b} donne {x = b × a}. Si x a un coefficient ({[2x|3] = 4}), multiplie d’abord par le dénominateur, puis divise par le coefficient.',
      exemple: { consigne: 'Résous', depart: '[x|4] = 3', lignes: ['x = 3 × 4', 'x = 12'] },
      piege: 'On multiplie, on ne divise pas : {[x|4] = 3} donne {x = 3 × 4}, pas {x = [3|4]}.',
      gen(niv) {
        const a = rnd(2, 9);
        if (niv === 3 && Math.random() < 0.6) {
          // [k x|a] = b → k x = a b → x = a b / k (entier : b = k u, x = a u)
          const v = tirer(() => ({ k: rnd(2, 5), u: rnz(-3, 3) }), v => v.k !== a && Q.pgcd(v.k, a) === 1);
          const b = v.k * v.u, S = a * v.u;
          return { consigne: CONSIGNE, depart: '[' + v.k + 'x|' + a + '] = ' + nb(b), valeur: Q.red(S, 1),
            solution: [cx(v.k) + ' = ' + nb(b) + ' × ' + a, cx(v.k) + ' = ' + nb(a * b)].concat(finDiv(v.k, a * b)),
            indices: ['Multiplie d’abord les deux membres par ' + a + ' : ' + m(cx(v.k) + ' = ' + nb(b) + ' × ' + a) + '.', 'Divise ensuite par ' + v.k + '.'] };
        }
        const b = niv === 1 ? rnd(1, 9) : rnz(-9, 9), S = a * b;
        return { consigne: CONSIGNE, depart: '[x|' + a + '] = ' + nb(b), valeur: Q.red(S, 1), solution: ['x = ' + nb(b) + ' × ' + a, 'x = ' + nb(S)],
          indices: ['Dans ' + m('[x|' + a + ']') + ', x est divisé par ' + a + ' : pour isoler x, multiplie les deux membres par ' + a + '.',
            'Écris ' + m('x = ' + nb(b) + ' × ' + a) + ', puis calcule.'] };
      } },

    /* ---------------- Deux étapes ---------------- */
    { id: 'DE1', famille: 'DE', niveau: 2, prerequis: ['TA1', 'MU1'], titre: 'Résoudre ax + b = c',
      regle: 'On isole x en <b>deux étapes</b> : d’abord on fait passer le nombre dans l’autre membre (il change de signe), ensuite on divise par le coefficient de x.',
      methode: '{ax + b = c} donne {ax = c − b}. Calcule {c − b}, puis divise les deux membres par a.',
      exemple: { consigne: 'Résous', depart: '3x + 5 = 20', lignes: ['3x = 20 − 5', '3x = 15', 'x = [15|3]', 'x = 5'] },
      piege: 'D’abord le terme additif, ensuite le coefficient : {3x + 5 = 20} ne donne pas {x + 5 = [20|3]}. Si tu divises un membre, divise tous ses termes.',
      gen(niv) {
        const v = tirer(() => ({ a: niv === 1 ? rnd(2, 6) : niv === 2 ? rnd(2, 9) : rnz(-9, 9), b: niv === 1 ? rnd(1, 12) : niv === 2 ? rnz(-15, 15) : rnz(-20, 20),
          S: niv === 1 ? rnd(1, 10) : niv === 2 ? rnz(-10, 10) : rnz(-12, 12), f: niv === 3 ? rnd(0, 2) : 0 }), v => Math.abs(v.a) > 1);
        const a = v.a, b = v.b, S = v.S, c = a * S + b;
        // 0 : a x + b = c ; 1 : b + a x = c ; 2 : c = a x + b
        const dep = v.f === 0 ? ex(a, b) + ' = ' + nb(c) : v.f === 1 ? nb(b) + plusx(a) + ' = ' + nb(c) : nb(c) + ' = ' + ex(a, b);
        const sol = v.f === 2 ? [nb(c) + plus(-b) + ' = ' + cx(a), nb(a * S) + ' = ' + cx(a), cx(a) + ' = ' + nb(a * S)].concat(finDiv(a, a * S))
          : [cx(a) + ' = ' + nb(c) + plus(-b), cx(a) + ' = ' + nb(a * S)].concat(finDiv(a, a * S));
        return { consigne: CONSIGNE, depart: dep, valeur: Q.red(S, 1), solution: sol,
          indices: ['Commence par faire passer le nombre ' + nb(b) + ' dans l’autre membre (il change de signe).',
            'Tu obtiens ' + m(cx(a) + ' = ' + nb(c) + plus(-b)) + ' : calcule le membre de droite.',
            'Divise ensuite les deux membres par ' + nb(a) + '.'] };
      } },
    { id: 'DE2', famille: 'DE', niveau: 3, prerequis: ['DE1', 'TA2'], titre: 'x dans les deux membres',
      regle: 'On <b>regroupe</b> les termes en x dans un membre et les nombres dans l’autre (chaque terme qui change de membre change de signe), on <b>réduit</b>, puis on divise par le coefficient de x.',
      methode: '{5x + 2 = 3x + 8} donne {5x − 3x = 8 − 2}, donc {2x = 6}, puis {x = [6|2]}.',
      exemple: { consigne: 'Résous', depart: '5x + 2 = 3x + 8', lignes: ['5x − 3x = 8 − 2', '2x = 6', 'x = [6|2]', 'x = 3'] },
      piege: 'Le terme {3x} change de signe en passant à gauche : {5x − 3x}, pas {5x + 3x}.',
      gen(niv) {
        const v = tirer(() => ({ a: niv === 1 ? rnd(3, 9) : rnz(-7, 9), c: niv === 1 ? rnd(1, 5) : rnz(-7, 9), b: niv === 1 ? rnd(1, 10) : rnz(-12, 12),
          S: niv === 1 ? rnd(1, 8) : niv === 2 ? rnz(-8, 8) : rnz(-10, 10) }), v => {
          const k = v.a - v.c, d = k * v.S + v.b;
          return Math.abs(k) >= 2 && d !== 0 && (niv > 1 || (k > 0 && d > 0)) && (niv === 3 || k > 0) && Math.abs(d) <= 60;
        });
        const a = v.a, c = v.c, b = v.b, S = v.S, k = a - c, d = k * S + b;
        return { consigne: CONSIGNE, depart: ex(a, b) + ' = ' + ex(c, d), valeur: Q.red(S, 1),
          solution: [cx(a) + plusx(-c) + ' = ' + nb(d) + plus(-b), cx(k) + ' = ' + nb(k * S)].concat(finDiv(k, k * S)),
          indices: ['Regroupe les termes en x dans le membre de gauche et les nombres dans le membre de droite.',
            'Écris ' + m(cx(a) + plusx(-c) + ' = ' + nb(d) + plus(-b)) + ' : chaque terme qui change de membre change de signe.',
            'Réduis : ' + m(cx(k) + ' = ' + nb(k * S)) + ', puis divise par ' + nb(k) + '.'] };
      } },

    /* ---------------- Solutions en fraction ---------------- */
    { id: 'FR1', famille: 'FR', niveau: 2, prerequis: ['MU1'], titre: 'Une solution en fraction',
      regle: 'La solution d’une équation n’est pas toujours un nombre entier : on la donne sous forme de <b>fraction irréductible</b> (simplifiée au maximum).',
      methode: '{ax = b} donne {x = [b|a]}. Si b et a ont un diviseur commun, simplifie la fraction.',
      exemple: { consigne: 'Résous', depart: '6x = 4', lignes: ['x = [4|6]', 'x = [2×2|3×2]', 'x = [2|3]'] },
      piege: 'Pas de valeur approchée : {x = [2|3]}, pas {x = 0,67}. Et c’est b qu’on divise par a : {[4|6]}, pas {[6|4]}.',
      gen(niv) {
        const v = tirer(() => ({ p: rnd(2, 9), q: rnd(1, 15), g: niv === 1 ? 1 : rnd(2, 4), s1: niv === 3 ? choix([1, -1]) : 1, s2: niv === 3 ? choix([1, -1]) : 1 }),
          v => Q.pgcd(v.p, v.q) === 1 && v.q % v.p !== 0 && v.p * v.g <= 24 && (niv === 1 || v.q * v.g <= 40) && (niv < 3 || v.s1 * v.s2 < 0 || Math.random() < 0.3));
        const a = v.s1 * v.p * v.g, b = v.s2 * v.q * v.g;
        return { consigne: CONSIGNE_FR, depart: cx(a) + ' = ' + nb(b), valeur: Q.red(b, a), solution: finDiv(a, b),
          indices: ['Divise les deux membres par ' + nb(a) + ' : ' + m('x = ' + fr(b, a)) + '.',
            v.g > 1 ? nb(Math.abs(b)) + ' et ' + nb(Math.abs(a)) + ' sont tous les deux divisibles par ' + v.g + ' : simplifie la fraction.' : 'La fraction ' + m(fr(Math.abs(b), Math.abs(a))) + ' est déjà irréductible.'].concat(a < 0 || b < 0 ? ['Écris le signe − devant la fraction (ou au numérateur), pas au dénominateur.'] : []) };
      } },
    { id: 'FR2', famille: 'FR', niveau: 3, prerequis: ['DE1', 'FR1'], titre: 'Deux étapes, solution en fraction',
      regle: 'On résout comme d’habitude (termes additifs, puis coefficient de x) et on donne la solution en <b>fraction irréductible</b>.',
      methode: 'Isole le terme en x, divise par son coefficient, puis simplifie la fraction obtenue.',
      exemple: { consigne: 'Résous', depart: '4x + 3 = 13', lignes: ['4x = 13 − 3', '4x = 10', 'x = [10|4]', 'x = [5×2|2×2]', 'x = [5|2]'] },
      piege: 'Ne t’arrête pas à {x = [10|4]} : la fraction doit être irréductible, {x = [5|2]}.',
      gen(niv) {
        const deux = niv === 3 && Math.random() < 0.6;
        const v = tirer(() => ({ a: niv === 1 ? rnd(2, 9) : rnz(-9, 9), c: deux ? rnz(-6, 6) : 0, b: niv === 1 ? rnd(1, 12) : rnz(-12, 12), N: niv === 1 ? rnd(1, 25) : rnz(-25, 25) }), v => {
          const k = v.a - v.c;
          return Math.abs(v.a) > 1 && Math.abs(k) > 1 && v.N % k !== 0 && (niv > 1 || Q.pgcd(v.N, k) === 1) && v.N + v.b !== 0 && v.a !== v.c;
        });
        const a = v.a, c = v.c, b = v.b, N = v.N, k = a - c, d = N + b;
        // a x + b = c x + d (c = 0 : a x + b = d), (a − c) x = N
        const dep = ex(a, b) + ' = ' + (c ? ex(c, d) : nb(d));
        const sol = [cx(a) + (c ? plusx(-c) : '') + ' = ' + nb(d) + plus(-b)];
        if (c) sol.push(cx(k) + ' = ' + nb(N)); else sol.push(cx(a) + ' = ' + nb(N));
        return { consigne: CONSIGNE_FR, depart: dep, valeur: Q.red(N, k), solution: sol.concat(finDiv(k, N)),
          indices: [c ? 'Regroupe les termes en x dans le membre de gauche, les nombres dans le membre de droite.' : 'Fais passer ' + nb(b) + ' dans l’autre membre (il change de signe).',
            'Tu dois obtenir ' + m(cx(k) + ' = ' + nb(N)) + '.', 'Divise par ' + nb(k) + ' et simplifie la fraction si c’est possible.'] };
      } },

    /* ---------------- Parenthèses ---------------- */
    { id: 'PA1', famille: 'PA', niveau: 3, prerequis: ['DE1'], titre: 'Développer : k(x + a) = b',
      regle: 'Pour <b>développer</b> {k(a + b)}, on multiplie <b>chaque terme</b> de la parenthèse par k : {k(a + b) = ka + kb}.',
      methode: 'Développe le membre qui contient la parenthèse, puis résous comme d’habitude.',
      exemple: { consigne: 'Résous', depart: '3(x + 2) = 21', lignes: ['3x + 6 = 21', '3x = 21 − 6', '3x = 15', 'x = [15|3]', 'x = 5'] },
      piege: 'Multiplie tous les termes : {3(x + 2) = 3x + 6}, pas {3x + 2}.',
      gen(niv) {
        const v = tirer(() => ({ k: niv === 1 ? rnd(2, 6) : rnd(2, 7), p: niv === 3 ? rnd(2, 5) : 1, b: niv === 1 ? rnd(1, 9) : rnz(-9, 9), S: niv === 1 ? rnd(1, 10) : rnz(-10, 10) }),
          v => v.k !== v.p && v.p * v.S + v.b !== 0 && Math.abs(v.k * (v.p * v.S + v.b)) <= 120);
        const k = v.k, p = v.p, b = v.b, S = v.S, c = k * (p * S + b), A = k * p, B = k * b;
        return { consigne: CONSIGNE, depart: k + '(' + ex(p, b) + ') = ' + nb(c), valeur: Q.red(S, 1),
          solution: [ex(A, B) + ' = ' + nb(c), cx(A) + ' = ' + nb(c) + plus(-B), cx(A) + ' = ' + nb(A * S)].concat(finDiv(A, A * S)),
          indices: ['Développe : multiplie chaque terme de la parenthèse par ' + k + '.',
            m(k + '(' + ex(p, b) + ')') + ' = ' + m(ex(A, B)) + '.', 'Résous ensuite ' + m(ex(A, B) + ' = ' + nb(c)) + ' comme d’habitude.'] };
      } },
    { id: 'PA2', famille: 'PA', niveau: 3, prerequis: ['PA1', 'MU2'], titre: 'Un signe − devant la parenthèse',
      regle: 'Un signe − devant une parenthèse <b>change le signe de chaque terme</b> : {−(a + b) = −a − b} et {−(a − b) = −a + b}.',
      methode: 'Supprime la parenthèse en changeant tous les signes qu’elle contient (avec un facteur, {−2(x − 3) = −2x + 6}), puis résous.',
      exemple: { consigne: 'Résous', depart: '−(2x − 3) = x + 9', lignes: ['−2x + 3 = x + 9', '−2x − x = 9 − 3', '−3x = 6', 'x = [6|−3]', 'x = −2'] },
      piege: 'Tous les signes changent : {−(2x − 3) = −2x + 3}, pas {−2x − 3}.',
      gen(niv) {
        const v = tirer(() => ({ k: niv === 3 ? rnd(2, 4) : 1, a: niv === 1 ? 1 : rnd(1, niv === 3 ? 3 : 4), b: rnz(-9, 9), c: niv === 1 ? 0 : rnd(-3, 3),
          S: niv === 1 ? rnz(-10, 10) : rnz(-8, 8) }), v => {
          const K = -v.k * v.a - v.c, d = K * v.S - v.k * v.b;
          return K !== 0 && d !== 0 && Math.abs(d) <= 50;
        });
        const k = v.k, a = v.a, b = v.b, c = v.c, S = v.S, K = -k * a - c, d = K * S - k * b;
        const gauche = (k === 1 ? M : M + k) + '(' + ex(a, b) + ')', droite = ex(c, d);
        const sol = [ex(-k * a, -k * b) + ' = ' + droite, cx(-k * a) + (c ? plusx(-c) : '') + ' = ' + nb(d) + plus(k * b)];
        sol.push(cx(K) + ' = ' + nb(d + k * b));
        return { consigne: CONSIGNE, depart: gauche + ' = ' + droite, valeur: Q.red(S, 1), solution: sol.concat(finDiv(K, K * S)),
          indices: ['Le signe − devant la parenthèse change le signe de chaque terme qu’elle contient.',
            m(gauche) + ' = ' + m(ex(-k * a, -k * b)) + '.', 'Résous ensuite comme d’habitude : regroupe, réduis, divise.'] };
      } },
    { id: 'PA3', famille: 'PA', niveau: 4, prerequis: ['PA1', 'DE2'], titre: 'Tout combiné',
      regle: 'Dans une équation plus longue : on <b>développe</b> chaque parenthèse, on <b>réduit</b> chaque membre, on <b>regroupe</b> les x d’un côté et les nombres de l’autre, puis on <b>divise</b>.',
      methode: 'Procède étape par étape, une transformation par ligne. Vérifie les signes à chaque développement.',
      exemple: { consigne: 'Résous', depart: '2(x + 3) + x = 4(x − 1) + 7', lignes: ['2x + 6 + x = 4x − 4 + 7', '3x + 6 = 4x + 3', '3x − 4x = 3 − 6', '−x = −3', 'x = 3'] },
      piege: 'Réduis chaque membre avant de regrouper : {2x + 6 + x = 3x + 6}.',
      gen(niv) {
        const v = tirer(() => ({ a: rnd(2, 4), b: rnd(1, 3), c: rnz(-4, 4), d: rnz(-4, 4), e: niv === 1 ? rnd(2, 3) : choix([-3, -2, -1, 2, 3]), f: rnz(-4, 4), S: niv === 1 ? rnd(1, 6) : rnz(-6, 6) }), v => {
          const K = v.a * v.b + v.d - v.e, g = (v.a * v.b + v.d) * v.S + v.a * v.c - v.e * v.S - v.e * v.f;
          return K !== 0 && Math.abs(g) <= 30 && g !== 0 && v.a * v.b + v.d !== 0;
        });
        const { a, b, c, d, e, f, S } = v;
        const g = (a * b + d) * S + a * c - e * S - e * f, K = a * b + d - e, N = e * f + g - a * c;
        const fe = e === -1 ? M : nb(e);
        const dep = a + '(' + ex(b, c) + ')' + plusx(d) + ' = ' + fe + '(x' + plus(f) + ')' + plus(g);
        const sol = [ex(a * b, a * c) + plusx(d) + ' = ' + ex(e, e * f) + plus(g), ex(a * b + d, a * c) + ' = ' + ex(e, e * f + g),
          cx(a * b + d) + plusx(-e) + ' = ' + nb(e * f + g) + plus(-a * c), cx(K) + ' = ' + nb(N)].concat(finDiv(K, N));
        return { consigne: CONSIGNE, depart: dep, valeur: Q.red(S, 1), solution: sol,
          indices: ['Développe les deux parenthèses (attention aux signes).', 'Réduis chaque membre : ' + m(sol[1]) + '.',
            'Regroupe les x à gauche et les nombres à droite, puis divise par le coefficient de x.'] };
      } }
  ];

  const R = {};
  liste.forEach(c => { R[c.id] = c; });
  // une question de la compétence id, difficulté niv (1 à 3) ; la solution est vérifiée
  function question(id, niv) {
    const c = R[id];
    let q;
    for (let k = 0; k < 20; k++) {
      q = c.gen(niv);
      try { if (Q.egal(val(q.depart), q.valeur)) break; } catch (e) { /* tirage impossible : on recommence */ }
    }
    q.comp = id; q.niv = niv;
    return q;
  }
  // texte d'une fiche : {écriture compacte} → écriture mathématique
  const texte = t => String(t).replace(/\{([^{}]+)\}/g, (x, e) => m(e));
  EQ.C = { familles, liste, R, question, propre, texte };
})();
