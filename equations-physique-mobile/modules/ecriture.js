/* ============================================================
   Équations en physique (smartphone) — écriture compacte des équations (objet EPM.P)
   ------------------------------------------------------------
   Une équation s'écrit en texte court, les grandeurs étant désignées par
   leur identifiant (déclaré avec son libellé dans la banque) :
     'Ec = [1|2] m v^2'           [num|den] : fraction ; facteurs séparés par des espaces
     'P2 - P1 = rho g (z1 - z2)'  parenthèses ; + et − entre les termes
     'pH = - log([C|C0])'         fonctions : sqrt cbrt sin cos tan asin acos atan log ln exp p10 rootN( )
     'T = deux pi sqrt([l|g])'    1 : le nombre 1 ; les autres nombres sont des grandeurs déclarées (deux : 2)
     'x^2', '(…)^3', 'T^4'        puissances (2 : carré, 3 : cube, n : puissance n) ; rootN(…) : puissance 1/N
   Deux sorties :
     - les nœuds de l'éditeur (modules/editeur.js) : lireEq(texte, g) → { left, right } ;
     - le HTML des fiches et des solutions (notation de fiches.js) : html(texte, g).
   API : EPM.P.lireEq(texte, g), EPM.P.membre(texte, g), EPM.P.html(texte, g), EPM.P.htmlEq(texte, g) → [gauche, droite]
   ============================================================ */
(function () {
  'use strict';
  const EPM = window.EPM = window.EPM || {};
  const FN = ['sqrt', 'cbrt', 'sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'log', 'ln', 'exp', 'p10'];

  /* ---------- Lecture : texte → arbre ---------- */
  function jetons(t) {
    const l = [], re = /\s*([A-Za-z_][A-Za-z0-9_']*|\d+|[[\]|()+\-−=^])/y;
    let m;
    re.lastIndex = 0;
    while (re.lastIndex < t.length) {
      const i = re.lastIndex;
      m = re.exec(t);
      if (!m) { if (/^\s*$/.test(t.slice(i))) break; throw new Error('Écriture illisible : ' + t + ' (position ' + i + ')'); }
      l.push(m[1] === '−' ? '-' : m[1]);
    }
    return l;
  }
  // expr : liste de termes { s, f: [facteurs] } ; facteur : { t:'id' | 'un' | 'fr' | 'par' | 'fn' | 'pow' }
  function analyser(t) {
    const J = jetons(t);
    let i = 0;
    const voir = () => J[i], prendre = x => { if (x && J[i] !== x) throw new Error('« ' + x + ' » attendu dans : ' + t); return J[i++]; };
    function expr() {
      const termes = [];
      let s = 1;
      if (voir() === '+' || voir() === '-') s = prendre() === '-' ? -1 : 1;
      termes.push({ s, f: terme() });
      while (voir() === '+' || voir() === '-') { s = prendre() === '-' ? -1 : 1; termes.push({ s, f: terme() }); }
      return termes;
    }
    function terme() {
      const f = [];
      while (i < J.length && ['+', '-', ')', ']', '|', '='].indexOf(voir()) < 0) f.push(facteur());
      if (!f.length) throw new Error('Terme vide dans : ' + t);
      return f;
    }
    function facteur() {
      let p = primaire();
      while (voir() === '^') { prendre('^'); p = { t: 'pow', b: p, k: +prendre() }; }
      return p;
    }
    function primaire() {
      const x = prendre();
      if (x === '[') { const n = expr(); prendre('|'); const d = expr(); prendre(']'); return { t: 'fr', n, d }; }
      if (x === '(') { const e = expr(); prendre(')'); return { t: 'par', e }; }
      if (x === '1') return { t: 'un' };
      if (/^root\d+$/.test(x) || FN.indexOf(x) >= 0) {
        prendre('('); const e = expr(); prendre(')');
        return /^root/.test(x) ? { t: 'fn', fn: 'proot', n: +x.slice(4), e } : { t: 'fn', fn: x, e };
      }
      if (/^[A-Za-z_]/.test(x)) return { t: 'id', id: x };
      throw new Error('« ' + x + ' » inattendu dans : ' + t);
    }
    const e = expr();
    if (i < J.length) throw new Error('Fin inattendue (« ' + J[i] + ' ») dans : ' + t);
    return e;
  }
  function couper(t) {
    const k = t.indexOf('=');
    if (k < 0 || t.indexOf('=', k + 1) >= 0) throw new Error('Une équation a un seul signe = : ' + t);
    return [t.slice(0, k), t.slice(k + 1)];
  }

  /* ---------- Arbre → nœuds de l'éditeur ---------- */
  const N = () => EPM.ED.noeuds;
  function tuile(f, g) {
    if (f.t === 'un') return { id: 'one', label: '1' };
    if (!(f.id in g)) throw new Error('Grandeur non déclarée : ' + f.id);
    return { id: f.id, label: g[f.id] };
  }
  const estTuile = f => f.t === 'id' || f.t === 'un';
  // grandeur élevée à une puissance entière (v^2, T^4) : une tuile qui porte sa puissance (déplaçable)
  const estPuiss = f => f.t === 'pow' && f.b.t === 'id' && f.k >= 2;
  const tuileP = (f, g) => estPuiss(f) ? Object.assign(tuile(f.b, g), { pow: f.k }) : tuile(f, g);
  const tuileOuP = f => estTuile(f) || estPuiss(f);
  const seulTerme = e => e.length === 1 && e[0].s === 1;
  // zones d'un produit : les grandeurs voisines dans une même zone
  function zones(fs, g) {
    const n = N(), out = [];
    let tas = [];
    const vider = () => { if (tas.length) { out.push(n.simple(tas)); tas = []; } };
    fs.forEach(f => {
      if (tuileOuP(f)) { tas.push(tuileP(f, g)); return; }
      if (f.t === 'par' && seulTerme(f.e)) { zones(f.e[0].f, g).forEach(z => { vider(); out.push(z); }); return; }
      vider();
      out.push(noeud(f, g));
    });
    vider();
    return out.length ? out : [n.simple([])];
  }
  function somme(e, g) {
    const n = N();
    return n.sumNode(e.map(x => ({ sign: x.s, node: n.seq(zones(x.f, g)) })));
  }
  // contenu d'une fraction ou d'une fonction
  function interieur(e, g) {
    const n = N();
    if (!seulTerme(e)) return somme(e, g);
    const fs = e[0].f;
    if (fs.every(tuileOuP)) return n.simple(fs.map(f => tuileP(f, g)));
    const z = zones(fs, g);
    return z.length === 1 ? z[0] : n.seq(z);
  }
  function noeud(f, g) {
    const n = N();
    if (tuileOuP(f)) return n.simple([tuileP(f, g)]);
    if (f.t === 'fr') return n.frac(interieur(f.n, g), interieur(f.d, g));
    if (f.t === 'par') return seulTerme(f.e) ? interieur(f.e, g) : somme(f.e, g);
    if (f.t === 'fn') {
      const fn = f.fn === 'p10' ? 'pow10' : f.fn;
      return n.func(fn, interieur(f.e, g), f.n);
    }
    if (f.t === 'pow') {
      const b = f.b.t === 'par' ? interieur(f.b.e, g) : noeud(f.b, g);
      return f.k === 2 ? n.func('sq', b) : f.k === 3 ? n.func('cube', b) : n.func('pow', b, f.k);
    }
    throw new Error('Facteur inconnu');
  }
  // un membre : produit de zones, ou somme (plusieurs termes, ou un seul terme négatif)
  function membre(texte, g) {
    const n = N(), e = analyser(texte);
    if (seulTerme(e)) return n.seq(zones(e[0].f, g));
    return n.seq([somme(e, g)]);
  }
  function lireEq(texte, g) {
    const [a, b] = couper(texte);
    return { left: membre(a, g), right: membre(b, g) };
  }

  /* ---------- Arbre → HTML (notation des fiches : fi-fr, fi-rac) ---------- */
  const NOMS = { sin: 'sin', cos: 'cos', tan: 'tan', asin: 'Arcsin', acos: 'Arccos', atan: 'Arctan', log: 'log', ln: 'ln' };
  const nombre = l => /^[0-9][0-9,  ]*$/.test(l.replace(/<[^>]*>/g, ''));
  function hExpr(e, g) {
    return e.map((x, k) => (k ? (x.s < 0 ? ' − ' : ' + ') : (x.s < 0 ? '−' : '')) + hProd(x.f, g)).join('');
  }
  function hProd(fs, g) {
    let h = '';
    fs.forEach((f, k) => {
      const x = hFact(f, g);
      if (k) {
        const prec = fs[k - 1];
        // nombre devant une grandeur : 2g, 2π ; sinon le signe ×
        h += (estTuile(prec) && nombre(tuile(prec, g).label) && f.t !== 'un' && !(estTuile(f) && nombre(tuile(f, g).label))) ? '' : ' × ';
      }
      h += x;
    });
    return h;
  }
  const par = h => '(' + h + ')';
  // contenu entre parenthèses quand il n'est pas une seule grandeur
  function hBase(e, g) {
    const seul = seulTerme(e) && e[0].f.length === 1 && estTuile(e[0].f[0]);
    return seul ? hExpr(e, g) : par(hExpr(e, g));
  }
  function hFact(f, g) {
    if (estTuile(f)) return tuile(f, g).label;
    if (f.t === 'fr') return '<span class="fi-fr"><span>' + hExpr(f.n, g) + '</span><span>' + hExpr(f.d, g) + '</span></span>';
    if (f.t === 'par') return par(hExpr(f.e, g));
    if (f.t === 'pow') {
      const b = f.b.t === 'par' ? par(hExpr(f.b.e, g)) : f.b.t === 'fr' ? par(hFact(f.b, g)) : hFact(f.b, g);
      return b + '<sup>' + f.k + '</sup>';
    }
    if (f.t === 'fn') {
      if (f.fn === 'sqrt') return '<span class="fi-rac">' + hExpr(f.e, g) + '</span>';
      if (f.fn === 'cbrt') return '<span class="fi-rac" data-n="3">' + hExpr(f.e, g) + '</span>';
      if (f.fn === 'proot') return hBase(f.e, g) + '<sup>1/' + f.n + '</sup>';
      if (f.fn === 'exp') return 'e<sup>' + hExpr(f.e, g) + '</sup>';
      if (f.fn === 'p10') return '10<sup>' + hExpr(f.e, g) + '</sup>';
      return NOMS[f.fn] + par(hExpr(f.e, g));
    }
    return '';
  }
  const html = (texte, g) => hExpr(analyser(texte), g);
  // tuiles d'une équation (avec leur puissance), pour la réserve de l'éditeur
  function tuiles(eq) {
    const out = [], vues = {};
    (function voir(n) {
      if (!n) return;
      if (n.kind === 'simple') n.items.forEach(it => { if (it.id !== 'one' && !vues[it.id]) { vues[it.id] = 1; out.push(Object.assign({}, it)); } });
      else if (n.kind === 'func') voir(n.inner);
      else if (n.kind === 'frac') { voir(n.num); voir(n.den); }
      else if (n.kind === 'sum') n.terms.forEach(t => voir(t.node));
      else n.slots.forEach(voir);
    })({ kind: 'seq', slots: [eq.left, eq.right] });
    return out;
  }
  const htmlEq = (texte, g) => couper(texte).map(x => html(x, g));

  EPM.P = { analyser, lireEq, membre, html, htmlEq, tuiles };
})();
