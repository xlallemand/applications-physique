/* ============================================================
   Équations du 1er degré — écriture « comme sur une feuille » (objet EQ.X)
   (même principe que modules/expr.js de l'application Fractions)
   ------------------------------------------------------------
   Rôle :
     - modèle d'une ligne : liste d'éléments, chaque élément est un
       caractère ('0'…'9', ',', 'x', '+', '−', '×', '÷', '(', ')', '=')
       ou une fraction { num: [liste], den: [liste] } ;
     - écriture compacte pour les données : « 3x + 5 = [2x|3] − 1 »
       ([num|den] : une fraction ; x : l'inconnue ; 3x : produit implicite) ;
     - analyse d'une ligne (deux membres séparés par =, priorités,
       parenthèses, produits implicites 3x et 2(x + 1)) et calcul exact
       de chaque membre sous la forme a x + b (a et b rationnels) ;
     - « calculs fautifs » (développements faux) pour diagnostiquer une ligne ;
     - affichage d'une ligne (HTML) ;
     - éditeur d'une ligne avec curseur (clavier de l'ordinateur et pavé
       à l'écran : chiffres, x, =, fraction, opérations, parenthèses, flèches).

   API :
     EQ.X.lire(texte)                écriture compacte → modèle
     EQ.X.html(modele | texte)       HTML d'une ligne (sans curseur)
     EQ.X.m(texte)                   raccourci : HTML d'une écriture compacte
     EQ.X.analyserEq(modele)         { g, d } arbres des deux membres (lève { msg } si l'écriture est incomplète)
     EQ.X.analyser(modele)           arbre d'une expression (sans =)
     EQ.X.lin(arbre, fautif)         forme { a, b } (a x + b) d'un membre ; fautif : { nom, i } (développement faux)
     EQ.X.FAUTIFS                    développements faux et leur diagnostic
     EQ.X.solution(lg, ld)           { type: 'un', v } | { type: 'tous' } | { type: 'aucune' }
     EQ.X.ecrireLin(L)               écriture compacte de a x + b
     EQ.X.Q : nombres rationnels (pgcd, ppcm, red, add, sous, mul, div, egal, opp, ecrire)
     new EQ.X.Editeur(zone, { surChange, surValider })   éditeur d'une ligne
     EQ.X.pave(editeur)                                   pavé à l'écran (élément)
   ============================================================ */
(function () {
  'use strict';
  const EQ = window.EQ = window.EQ || {};
  const MOINS = '−';

  /* =====================================================================
     Nombres rationnels exacts { n, d } (d > 0, fraction irréductible)
     ===================================================================== */
  const MAXI = 1e12;
  function pgcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { const t = a % b; a = b; b = t; } return a; }
  const ppcm = (a, b) => Math.abs(a * b) / pgcd(a, b);
  function red(n, d) {
    if (d === 0) throw { msg: 'Un dénominateur ne peut pas être égal à 0.' };
    if (Math.abs(n) > MAXI || Math.abs(d) > MAXI) throw { msg: 'Les nombres deviennent trop grands : vérifie ta ligne.' };
    const g = pgcd(n, d) || 1;
    let a = n / g, b = d / g;
    if (b < 0) { a = -a; b = -b; }
    return { n: a + 0, d: b };
  }
  const add = (p, q) => red(p.n * q.d + q.n * p.d, p.d * q.d);
  const sous = (p, q) => red(p.n * q.d - q.n * p.d, p.d * q.d);
  const mul = (p, q) => red(p.n * q.n, p.d * q.d);
  const div = (p, q) => { if (q.n === 0) throw { msg: 'On ne peut pas diviser par 0.' }; return red(p.n * q.d, p.d * q.n); };
  const egal = (p, q) => !!p && !!q && p.n === q.n && p.d === q.d;
  const opp = p => ({ n: -p.n + 0, d: p.d });
  const ZERO = { n: 0, d: 1 }, UN = { n: 1, d: 1 };
  // écriture compacte d'un rationnel : « 3 », « −2 », « [3|4] », « −[3|4] »
  function ecrire(q) {
    if (q.d === 1) return (q.n < 0 ? MOINS : '') + Math.abs(q.n);
    return (q.n < 0 ? MOINS : '') + '[' + Math.abs(q.n) + '|' + q.d + ']';
  }
  const Q = { pgcd, ppcm, red, add, sous, mul, div, egal, opp, ecrire, ZERO, UN };

  /* =====================================================================
     Écriture compacte → modèle
     « 3x + 5 = 20 », « [x|4] = −3 », « −(2x − 3) = x + 9 »
     '-' '*' ':' '/' '.' sont acceptés pour − × ÷ ÷ , (le « / » seul n'est pas une fraction)
     ===================================================================== */
  const NORMAL = { '-': MOINS, '*': '×', ':': '÷', '/': '÷', '.': ',', 'X': 'x' };
  function lire(texte) {
    let i = 0;
    const s = String(texte);
    function liste(fin) {
      const l = [];
      while (i < s.length) {
        const c = s[i];
        if (fin.indexOf(c) >= 0) return l;
        i++;
        if (c === ' ' || c === ' ') continue;
        if (c === '[') {
          const num = liste('|');
          i++;                                   // « | »
          const den = liste(']');
          i++;                                   // « ] »
          l.push({ num, den });
        } else l.push(NORMAL[c] || c);
      }
      return l;
    }
    return liste('');
  }
  // modèle → écriture compacte (comparaisons, tests)
  function texte(l) { return l.map(e => typeof e === 'string' ? e : '[' + texte(e.num) + '|' + texte(e.den) + ']').join(''); }
  // copie profonde d'un modèle
  const copie = l => l.map(e => typeof e === 'string' ? e : { num: copie(e.num), den: copie(e.den) });

  /* =====================================================================
     Analyse : modèle → arbre
     nœuds : { t: 'nb', v, txt } { t: 'x' } { t: 'fr', num, den } { t: 'op', o, a, b, impl } { t: 'neg', a } { t: 'par', a }
     ===================================================================== */
  const erreur = msg => { throw { msg }; };
  const estChiffre = c => typeof c === 'string' && ((c >= '0' && c <= '9') || c === ',');
  const SIGNES = '+−×÷';
  // un nombre écrit (chiffres et virgule) → rationnel exact
  function nombre(t) {
    if (t[0] === ',') erreur('Écris un chiffre avant la virgule : 0,5 et non ,5.');
    if (t[t.length - 1] === ',') erreur('Écris un chiffre après la virgule.');
    if (t.split(',').length > 2) erreur('Un nombre ne peut avoir qu’une seule virgule.');
    const p = t.split(',');
    const dec = p[1] || '';
    return red(parseInt(p[0] + dec, 10), Math.pow(10, dec.length));
  }
  // découpe en jetons : nombres (chiffres regroupés), x, fractions, opérations, parenthèses
  function jetons(l) {
    const t = [];
    for (let i = 0; i < l.length; i++) {
      const e = l[i];
      if (typeof e === 'object') {
        if (!e.num.length || !e.den.length) erreur('Complète le numérateur et le dénominateur de chaque fraction.');
        if (e.num.indexOf('=') >= 0 || e.den.indexOf('=') >= 0) erreur('Le signe = ne se met pas dans une fraction.');
        t.push({ t: 'fr', num: analyser(e.num), den: analyser(e.den) });
      } else if (estChiffre(e)) {
        let v = e;
        while (estChiffre(l[i + 1])) v += l[++i];
        t.push({ t: 'nb', v: nombre(v), txt: v });
      } else if (e === 'x') t.push({ t: 'x' });
      else t.push({ o: e });
    }
    return t;
  }
  // une expression (un membre de l'équation, ou le contenu d'une fraction)
  function analyser(l) {
    const t = jetons(l);
    if (!t.length) erreur('Écris un calcul.');
    let i = 0;
    const voir = () => t[i], prendre = () => t[i++];
    const est = (k, o) => k && k.o !== undefined && o.indexOf(k.o) >= 0;
    const atome = k => k && (k.t || k.o === '(');
    // expression : somme de termes (le signe − est permis au début : −3x + …)
    function expr() {
      let a;
      if (est(voir(), MOINS)) { prendre(); a = { t: 'neg', a: terme() }; }
      else if (est(voir(), '+')) { prendre(); a = terme(); }
      else a = terme();
      while (est(voir(), '+−')) {
        const o = prendre().o;
        a = { t: 'op', o, a, b: terme() };
      }
      return a;
    }
    // terme : produits et quotients de groupes
    function terme() {
      let a = groupe();
      while (est(voir(), '×÷')) { const o = prendre().o; a = { t: 'op', o, a, b: groupe() }; }
      return a;
    }
    // groupe : produit implicite (3x, 2(x + 1), [2|3]x), plus fort que × et ÷ (6 ÷ 2x = 6 ÷ (2x))
    function groupe() {
      let a = facteur();
      while (atome(voir())) {
        const k = voir(), av = a.t === 'op' && a.impl ? a.b : a;
        if (k.t === 'nb') erreur(av.t === 'x' ? 'Écris le nombre avant x : 3x, et non x3.' : av.t === 'par' ? 'Il manque un signe opératoire après la parenthèse « ) ».' : 'Il manque un signe opératoire entre deux nombres.');
        if (k.t === 'fr') erreur('Il manque un signe opératoire avant la fraction.');
        a = { t: 'op', o: '×', a, b: facteur(), impl: true };
      }
      return a;
    }
    function facteur() {
      const k = voir();
      if (!k) erreur('Il manque un nombre à la fin.');
      if (k.o === '(') {
        prendre();
        if (est(voir(), ')')) erreur('Les parenthèses sont vides.');
        const e = expr();
        if (!est(voir(), ')')) erreur('Il manque une parenthèse fermante « ) ».');
        prendre();
        return { t: 'par', a: e };
      }
      if (k.t) { prendre(); return k; }
      if (k.o === MOINS || k.o === '+') erreur('Après un signe opératoire, écris un nombre négatif entre parenthèses : × (−3).');
      if (k.o === ')') erreur('Il y a une parenthèse fermante « ) » en trop.');
      if (k.o === '=') erreur('Écris une seule fois le signe = sur la ligne.');
      erreur('Il manque un nombre avant « ' + k.o + ' ».');
    }
    const a = expr();
    if (i < t.length) erreur(est(voir(), ')') ? 'Il y a une parenthèse fermante « ) » en trop.' : 'Il manque un signe opératoire.');
    return a;
  }
  // une équation : deux membres séparés par un seul signe =
  function analyserEq(l) {
    const p = [];
    l.forEach((e, i) => { if (e === '=') p.push(i); });
    if (!l.length) erreur('Écris une équation sur la ligne.');
    if (!p.length) erreur('Écris une équation : il manque le signe =.');
    if (p.length > 1) erreur('Écris une seule fois le signe = sur la ligne.');
    const G = l.slice(0, p[0]), D = l.slice(p[0] + 1);
    if (!G.length) erreur('Il manque le membre de gauche, avant le signe =.');
    if (!D.length) erreur('Il manque le membre de droite, après le signe =.');
    return { g: analyser(G), d: analyser(D) };
  }

  /* =====================================================================
     Calcul d'un membre : forme a x + b (a et b rationnels)
     ===================================================================== */
  const L = (a, b) => ({ a, b });
  const addL = (p, q) => L(add(p.a, q.a), add(p.b, q.b));
  const sousL = (p, q) => L(sous(p.a, q.a), sous(p.b, q.b));
  const oppL = p => L(opp(p.a), opp(p.b));
  const foisL = (k, p) => L(mul(k, p.a), mul(k, p.b));
  const egalL = (p, q) => egal(p.a, q.a) && egal(p.b, q.b);
  function mulL(p, q) {
    if (p.a.n !== 0 && q.a.n !== 0) erreur('Ta ligne contient un produit de x par x : ce n’est plus une équation du premier degré. Vérifie ton calcul.');
    return p.a.n !== 0 ? foisL(q.b, p) : foisL(p.b, q);
  }
  function divL(p, q) {
    if (q.a.n !== 0) erreur('On ne divise pas par une expression qui contient x : divise par un nombre.');
    if (q.b.n === 0) erreur('On ne peut pas diviser par 0.');
    return L(div(p.a, q.b), div(p.b, q.b));
  }
  // termes d'une somme : [{ s: +1 | −1, x: nœud }]
  function termes(x, s, out) {
    out = out || []; s = s || 1;
    if (x.t === 'op' && (x.o === '+' || x.o === MOINS)) { termes(x.a, s, out); termes(x.b, x.o === '+' ? s : -s, out); }
    else if (x.t === 'neg' && out.length === 0) out.push({ s: -s, x: x.a });
    else out.push({ s, x });
    return out;
  }
  // parenthèse qui contient une somme d'au moins deux termes : la liste de ses termes, sinon null
  function sommeEntre(x) {
    if (x.t !== 'par') return null;
    const T = termes(x.a);
    return T.length > 1 ? T : null;
  }
  // produit « nombre × (somme) » : { k, T } (k constant, T termes de la somme), sinon null
  function produitDev(x, f) {
    if (x.t !== 'op' || x.o !== '×') return null;
    let T = sommeEntre(x.b), autre = x.a;
    if (!T) { T = sommeEntre(x.a); autre = x.b; }
    if (!T) return null;
    let k;
    try { k = lin(autre); } catch (e) { return null; }
    if (k.a.n !== 0) return null;
    return { k: k.b, T };
  }
  /* Développements faux (erreurs classiques d'élève). f = { nom, i } : seul le i-ième
     développement possible de la ligne est faussé (tous si i est absent) ; f.k compte les développements. */
  const FAUTIFS = {
    devPremier: 'Tu n’as multiplié que le premier terme de la parenthèse. Pour développer, multiplie chaque terme de la parenthèse par le facteur devant : k(a + b) = ka + kb.',
    devSigne: 'Un signe − devant une parenthèse change le signe de tous les termes de la parenthèse, pas seulement du premier : −(a − b) = −a + b.',
    devAbs: 'Attention aux signes en développant : chaque terme de la parenthèse est multiplié par le facteur avec son signe (règle des signes).'
  };
  const cible = f => { f.k = (f.k || 0) + 1; return f.i == null || f.i === f.k - 1; };
  // valeur de chaque terme de T, multiplié par k
  const devTermes = (T, k, f) => T.map(e => foisL(k, e.s > 0 ? lin(e.x, f) : oppL(lin(e.x, f))));
  const somme = l => l.reduce(addL, L(ZERO, ZERO));
  function lin(x, f) {
    switch (x.t) {
      case 'nb': return L(ZERO, x.v);
      case 'x': return L(UN, ZERO);
      case 'par': return lin(x.a, f);
      case 'fr': return divL(lin(x.num, f), lin(x.den, f));
      case 'neg': {
        // −(a + b) ou −k(a + b) développé en ne changeant que le signe du premier terme
        if (f && f.nom === 'devSigne') {
          const P = x.a.t === 'par' ? { k: UN, T: sommeEntre(x.a) } : produitDev(x.a);
          if (P && P.T && cible(f)) { const l = devTermes(P.T, P.k, f); l[0] = oppL(l[0]); return somme(l); }
        }
        return oppL(lin(x.a, f));
      }
      case 'op': {
        if (x.o === '+') return addL(lin(x.a, f), lin(x.b, f));
        if (x.o === MOINS) {
          // a − (b + c) ou a − k(b + c) : seul le premier terme change de signe
          if (f && f.nom === 'devSigne') {
            const P = x.b.t === 'par' ? { k: UN, T: sommeEntre(x.b) } : produitDev(x.b);
            if (P && P.T && cible(f)) { const l = devTermes(P.T, P.k, f); l[0] = oppL(l[0]); return addL(lin(x.a, f), somme(l)); }
          }
          return sousL(lin(x.a, f), lin(x.b, f));
        }
        if (x.o === '×') {
          if (f && (f.nom === 'devPremier' || f.nom === 'devAbs')) {
            const P = produitDev(x);
            if (P && (f.nom === 'devPremier' || P.k.n < 0) && cible(f)) {
              const l = P.T.map(e => e.s > 0 ? lin(e.x, f) : oppL(lin(e.x, f)));
              // devPremier : k × premier terme, les autres recopiés ; devAbs : les autres multipliés par −k
              return somme(l.map((t, j) => j === 0 ? foisL(P.k, t) : f.nom === 'devPremier' ? t : foisL(opp(P.k), t)));
            }
          }
          return mulL(lin(x.a, f), lin(x.b, f));
        }
        return divL(lin(x.a, f), lin(x.b, f));
      }
    }
    throw { msg: 'Calcul impossible.' };
  }
  // solution de lg = ld
  function solution(lg, ld) {
    const A = sous(lg.a, ld.a), B = sous(ld.b, lg.b);
    if (A.n === 0) return { type: B.n === 0 ? 'tous' : 'aucune' };
    return { type: 'un', v: div(B, A) };
  }
  // écriture compacte de a x + b : « 3x − 2 », « −x », « [1|2]x + 4 », « 5 »
  function ecrireLin(p) {
    let s = '';
    if (p.a.n !== 0) {
      const a = p.a, abs = { n: Math.abs(a.n), d: a.d };
      s = (a.n < 0 ? MOINS : '') + (abs.n === 1 && abs.d === 1 ? '' : ecrire(abs)) + 'x';
    }
    if (p.b.n !== 0 || !s) {
      if (!s) s = ecrire(p.b);
      else s += (p.b.n < 0 ? ' ' + MOINS + ' ' : ' + ') + ecrire({ n: Math.abs(p.b.n), d: p.b.d });
    }
    return s;
  }

  /* =====================================================================
     Affichage d'une ligne (HTML)
     ===================================================================== */
  // un « − » est un signe (et non une soustraction) en début de membre ou après « ( » ou une opération
  const estSigne = (l, i) => l[i] === MOINS && (i === 0 || l[i - 1] === '(' || l[i - 1] === '=' || SIGNES.indexOf(l[i - 1]) >= 0);
  function classeCar(l, i) {
    const c = l[i];
    if (SIGNES.indexOf(c) >= 0) return estSigne(l, i) ? 'eq-c eq-signe' : 'eq-c eq-op';
    if (c === '(' || c === ')') return 'eq-c eq-par';
    if (c === '=') return 'eq-c eq-op eq-egal';
    if (c === 'x') return 'eq-c eq-x';
    return 'eq-c';
  }
  function htmlListe(l, vide) {
    if (!l.length) return vide ? '<span class="eq-vide"></span>' : '';
    return l.map((e, i) => typeof e === 'string' ? '<span class="' + classeCar(l, i) + '">' + e + '</span>'
      : '<span class="eq-f"><span class="eq-n">' + htmlListe(e.num, true) + '</span><span class="eq-d">' + htmlListe(e.den, true) + '</span></span>').join('');
  }
  const html = m => '<span class="eq-ligne">' + htmlListe(typeof m === 'string' ? lire(m) : m, false) + '</span>';
  const m = t => html(t);

  /* =====================================================================
     Éditeur d'une ligne (curseur, clavier, toucher)
     ===================================================================== */
  const AIDE_CLAVIER = 'Clavier : x pour l’inconnue, « = », « * » pour ×, « : » pour ÷, « / » pour une fraction, flèches pour te déplacer, Entrée pour vérifier.';
  // positions du curseur dans l'ordre de lecture : avant chaque élément, dans le numérateur puis le dénominateur des fractions
  function positions(l, out) {
    for (let i = 0; i <= l.length; i++) {
      out.push({ l, i });
      if (i < l.length && typeof l[i] === 'object') { positions(l[i].num, out); positions(l[i].den, out); }
    }
    return out;
  }
  // fraction qui contient la liste l : { f, cote: 'num' | 'den', l: liste parente, i: place de la fraction }
  function parent(racine, l) {
    let trouve = null;
    (function cherche(liste) {
      liste.forEach((e, i) => {
        if (trouve || typeof e !== 'object') return;
        if (e.num === l) trouve = { f: e, cote: 'num', l: liste, i };
        else if (e.den === l) trouve = { f: e, cote: 'den', l: liste, i };
        else { cherche(e.num); cherche(e.den); }
      });
    })(racine);
    return trouve;
  }
  // élément qui peut monter au numérateur d'une fraction : chiffre, virgule ou x (« 2x » puis fraction → [2x|…])
  const monome = c => estChiffre(c) || c === 'x';

  function Editeur(zone, opts) {
    this.opts = opts || {};
    this.zone = zone;
    this.modele = [];
    this.cur = { l: this.modele, i: 0 };
    this.actif = true;
    zone.classList.add('eq-edit');
    zone.tabIndex = 0;
    zone.setAttribute('role', 'textbox');
    zone.setAttribute('aria-label', 'Ligne à écrire. ' + AIDE_CLAVIER);
    zone.addEventListener('keydown', e => this.clavier(e));
    zone.addEventListener('click', e => this.toucher(e));
    this.dessiner();
  }
  Editeur.prototype = {
    // remplace le contenu de la ligne
    definir(modele) { this.modele = copie(modele); this.cur = { l: this.modele, i: this.modele.length }; this.change(); },
    vider() { this.definir([]); },
    change() { this.dessiner(); if (this.opts.surChange) this.opts.surChange(this); },
    activer(oui) { this.actif = oui; this.zone.classList.toggle('off', !oui); this.zone.tabIndex = oui ? 0 : -1; this.dessiner(); },
    // une touche du pavé ou du clavier
    touche(k) {
      if (!this.actif) return;
      const c = this.cur, l = c.l;
      if (k.length === 1 && ('0123456789,x+−×÷()='.indexOf(k) >= 0)) { l.splice(c.i, 0, k); c.i++; }
      else if (k === 'frac') this.fraction();
      else if (k === 'gauche' || k === 'droite') {
        const p = positions(this.modele, []), j = p.findIndex(x => x.l === c.l && x.i === c.i);
        const n = p[Math.max(0, Math.min(p.length - 1, j + (k === 'droite' ? 1 : -1)))];
        this.cur = { l: n.l, i: n.i };
      } else if (k === 'haut' || k === 'bas') this.monter(k === 'haut');
      else if (k === 'effacer') this.effacer();
      else if (k === 'vider') { this.modele.length = 0; this.cur = { l: this.modele, i: 0 }; }
      else if (k === 'valider') { if (this.opts.surValider) this.opts.surValider(this); return; }
      this.change();
    },
    // fraction : le nombre (ou 2x, ou la parenthèse) juste avant le curseur devient le numérateur
    fraction() {
      const c = this.cur, l = c.l;
      let j = c.i;
      while (j > 0 && monome(l[j - 1])) j--;
      if (j === c.i && l[c.i - 1] === ')') {
        let p = 0, k = c.i - 1;
        for (; k >= 0; k--) { if (l[k] === ')') p++; else if (l[k] === '(') { p--; if (!p) break; } }
        if (k >= 0) {
          const grp = l.splice(k, c.i - k).slice(1, -1);
          const f = { num: grp, den: [] };
          l.splice(k, 0, f);
          this.cur = { l: f.den, i: 0 };
          return;
        }
      }
      if (j < c.i) {
        const f = { num: l.splice(j, c.i - j), den: [] };
        l.splice(j, 0, f);
        this.cur = { l: f.den, i: 0 };
      } else {
        const f = { num: [], den: [] };
        l.splice(c.i, 0, f);
        this.cur = { l: f.num, i: 0 };
      }
    },
    // ▲ / ▼ : passer du dénominateur au numérateur (et inversement), ou entrer dans la fraction juste avant le curseur
    monter(haut) {
      const c = this.cur, p = parent(this.modele, c.l);
      if (p && p.cote === (haut ? 'den' : 'num')) { const l = haut ? p.f.num : p.f.den; this.cur = { l, i: l.length }; return; }
      const av = c.l[c.i - 1];
      if (av && typeof av === 'object') { const l = haut ? av.num : av.den; this.cur = { l, i: l.length }; }
    },
    effacer() {
      const c = this.cur, l = c.l;
      if (c.i > 0) {
        const e = l[c.i - 1];
        if (typeof e === 'string') { l.splice(c.i - 1, 1); c.i--; }
        else if (!e.num.length && !e.den.length) { l.splice(c.i - 1, 1); c.i--; }
        else this.cur = { l: e.den, i: e.den.length };
        return;
      }
      const p = parent(this.modele, l);
      if (!p) return;
      if (p.cote === 'den') { this.cur = { l: p.f.num, i: p.f.num.length }; return; }
      // début du numérateur : une fraction vide disparaît, sinon le curseur passe avant elle
      if (!p.f.num.length && !p.f.den.length) p.l.splice(p.i, 1);
      this.cur = { l: p.l, i: p.i };
    },
    clavier(e) {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const k = e.key;
      // x (ou X) : l'inconnue ; * : multiplier
      const T = { '-': '−', '−': '−', '+': '+', '*': '×', '×': '×', ':': '÷', '÷': '÷', '(': '(', ')': ')', '/': 'frac', '=': '=', ',': ',', '.': ',',
        x: 'x', X: 'x', ArrowLeft: 'gauche', ArrowRight: 'droite', ArrowUp: 'haut', ArrowDown: 'bas', Backspace: 'effacer', Enter: 'valider', Escape: null };
      let t = null;
      if (k.length === 1 && k >= '0' && k <= '9') t = k;
      else if (Object.prototype.hasOwnProperty.call(T, k)) t = T[k];
      if (t) { e.preventDefault(); this.touche(t); }
    },
    // toucher (souris ou doigt) : le curseur se place à l'endroit touché
    toucher(e) {
      if (!this.actif) return;
      const cible = e.target.closest('.eq-c, .eq-vide, .eq-n, .eq-d, .eq-f');
      let pos = null;
      if (cible && cible._pos) {
        if (cible.classList.contains('eq-c') || cible.classList.contains('eq-f')) {
          const r = cible.getBoundingClientRect();
          pos = { l: cible._pos.l, i: cible._pos.i + (e.clientX > r.left + r.width / 2 ? 1 : 0) };
        } else pos = { l: cible._pos.l, i: cible._pos.l.length };
      }
      this.cur = pos || { l: this.modele, i: this.modele.length };
      this.dessiner();
      if (matchMedia('(hover: hover)').matches) this.zone.focus({ preventScroll: true });
    },
    // dessin de la ligne avec le curseur (chaque élément garde sa place dans le modèle pour le toucher)
    dessiner() {
      const ed = this;
      function liste(l, vide) {
        const s = document.createElement('span');
        s.className = 'eq-li';
        const curseur = () => { if (ed.actif && ed.cur.l === l) { const k = document.createElement('span'); k.className = 'eq-curseur'; k.setAttribute('aria-hidden', 'true'); return k; } return null; };
        if (!l.length && vide) {
          const v = document.createElement('span');
          v.className = 'eq-vide' + (ed.actif && ed.cur.l === l ? ' ici' : '');
          v._pos = { l, i: 0 };
          s.appendChild(v);
          const k = curseur(); if (k) v.appendChild(k);
          return s;
        }
        l.forEach((e, i) => {
          if (ed.cur.l === l && ed.cur.i === i) { const k = curseur(); if (k) s.appendChild(k); }
          let x;
          if (typeof e === 'string') { x = document.createElement('span'); x.className = classeCar(l, i); x.textContent = e; }
          else {
            x = document.createElement('span'); x.className = 'eq-f';
            const n = document.createElement('span'); n.className = 'eq-n'; n._pos = { l: e.num }; n.appendChild(liste(e.num, true));
            const d = document.createElement('span'); d.className = 'eq-d'; d._pos = { l: e.den }; d.appendChild(liste(e.den, true));
            x.appendChild(n); x.appendChild(d);
          }
          x._pos = { l, i };
          s.appendChild(x);
        });
        if (ed.cur.l === l && ed.cur.i === l.length) { const k = curseur(); if (k) s.appendChild(k); }
        return s;
      }
      this.zone.innerHTML = '';
      const r = liste(this.modele, false);
      r.classList.add('eq-ligne');
      if (!this.modele.length && this.actif) r.classList.add('eq-attente');
      this.zone.appendChild(r);
    }
  };

  /* =====================================================================
     Pavé à l'écran : chiffres à gauche, opérations et fraction en haut à droite,
     flèches en T inversé en bas à droite ; dernière ligne : x (l'inconnue, touche
     pleine en couleur, bien distincte de ×), =, Vérifier
     ===================================================================== */
  const PAVE = [
    ['7'], ['8'], ['9'], ['+', 'Plus'], ['−', 'Moins'], ['effacer', 'Effacer', '⌫'],
    ['4'], ['5'], ['6'], ['×', 'Multiplier', '×'], ['÷', 'Diviser'], ['frac', 'Fraction', '<span class="eq-tfrac" aria-hidden="true"><i></i><i></i></span>'],
    ['1'], ['2'], ['3'], ['(', 'Parenthèse ouvrante'], ['haut', 'Monter au numérateur', '▲'], [')', 'Parenthèse fermante'],
    ['0'], [',', 'Virgule'], ['gauche', 'Reculer le curseur', '◀'], ['bas', 'Descendre au dénominateur', '▼'], ['droite', 'Avancer le curseur', '▶'],
    ['x', 'La lettre x, l’inconnue', '<span class="eq-tx" aria-hidden="true">x</span>'], ['=', 'Signe égal'], ['valider', 'Vérifier la ligne', 'Vérifier ↵']
  ];
  function pave(ed) {
    const p = document.createElement('div');
    p.className = 'eq-pave';
    p.setAttribute('role', 'group');
    p.setAttribute('aria-label', 'Pavé de calcul');
    PAVE.forEach(t => {
      const k = t[0];
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'eq-t' + (k === 'valider' ? ' eq-t-ok' : k === 'x' ? ' eq-t-x' : k === '=' ? ' eq-t-egal' : k === '0' ? ' eq-t-zero'
        : k === 'frac' ? ' eq-t-frac' : '+−×÷()'.indexOf(k) >= 0 ? ' eq-t-op' : /^[\d,]$/.test(k) ? '' : ' eq-t-nav');
      b.innerHTML = t[2] || k;
      b.dataset.k = k;
      if (t[1]) { b.setAttribute('aria-label', t[1]); b.title = t[1]; }
      // le pavé ne prend pas le focus : la ligne garde son curseur (et le clavier de l'ordinateur reste actif)
      b.addEventListener('mousedown', e => e.preventDefault());
      b.addEventListener('click', () => {
        ed.touche(k);
        if (k !== 'valider' && matchMedia('(hover: hover)').matches && ed.actif) ed.zone.focus({ preventScroll: true });
      });
      p.appendChild(b);
    });
    return p;
  }

  EQ.X = { lire, texte, copie, html, m, analyser, analyserEq, lin, egalL, solution, ecrireLin, FAUTIFS, termes, Q, Editeur, pave, AIDE_CLAVIER, MOINS };
})();
