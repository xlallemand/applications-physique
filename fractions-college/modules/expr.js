/* ============================================================
   Fractions — calcul écrit « comme sur une feuille » (objet FRA.X)
   ------------------------------------------------------------
   Rôle :
     - modèle d'une ligne de calcul : liste d'éléments, chaque élément est
       un caractère ('0'…'9', '+', '−', '×', '÷', '(', ')') ou une
       fraction { num: [liste], den: [liste] } (fractions imbriquées possibles) ;
     - écriture compacte pour les données : « [3|4] + [1|2] × (−[2|5]) »
       ([num|den] : une fraction) ;
     - analyse d'une ligne (priorités, parenthèses, signe −) et calcul exact
       en fractions (nombres rationnels), avec des « calculs fautifs »
       (erreurs classiques d'élève) pour diagnostiquer une ligne fausse ;
     - affichage d'une ligne (HTML) ;
     - éditeur d'une ligne avec curseur (clavier de l'ordinateur et pavé
       à l'écran : chiffres, fraction, opérations, parenthèses, flèches).

   API :
     FRA.X.lire(texte)               écriture compacte → modèle
     FRA.X.html(modele | texte)      HTML d'une ligne (sans curseur)
     FRA.X.m(texte)                  raccourci : HTML d'une écriture compacte
     FRA.X.analyser(modele, opts)    arbre de calcul (lève { msg } si l'écriture est incomplète)
                                     opts : { plat: true } (de gauche à droite, sans priorités),
                                            { sansPar: true } (parenthèses oubliées)
     FRA.X.valeur(arbre, fautif)     valeur exacte { n, d } ; fautif : nom d'un calcul fautif (FAUTIFS)
     FRA.X.FAUTIFS                   calculs fautifs et leur diagnostic
     FRA.X.termes(arbre)             termes d'une somme (signe, nœud)
     FRA.X.litteral(nœud)            { n, d, frac } d'une fraction écrite (ou d'un entier), sinon null
     FRA.X.Q : outils de calcul (pgcd, ppcm, red, add, sous, mul, div, egal, texte(q), ecrire(q))
     new FRA.X.Editeur(zone, { surChange, surValider })   éditeur d'une ligne
     FRA.X.pave(editeur, { modes: { dec, sim } })         pavé à l'écran (élément), touches Décomposer et Simplifier
   ============================================================ */
(function () {
  'use strict';
  const FRA = window.FRA = window.FRA || {};
  const MOINS = '−';

  /* =====================================================================
     Nombres rationnels exacts { n, d } (d > 0, fraction irréductible)
     ===================================================================== */
  const MAXI = 1e12;
  function pgcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { const t = a % b; a = b; b = t; } return a; }
  const ppcm = (a, b) => Math.abs(a * b) / pgcd(a, b);
  function red(n, d) {
    if (d === 0) throw { msg: 'Un dénominateur ne peut pas être égal à 0.' };
    if (Math.abs(n) > MAXI || Math.abs(d) > MAXI) throw { msg: 'Les nombres deviennent trop grands : simplifie avant de calculer.' };
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
  // écriture compacte d'un rationnel : « 3 », « −2 », « [3|4] », « −[3|4] »
  function ecrire(q) {
    if (q.d === 1) return (q.n < 0 ? MOINS : '') + Math.abs(q.n);
    return (q.n < 0 ? MOINS : '') + '[' + Math.abs(q.n) + '|' + q.d + ']';
  }
  const Q = { pgcd, ppcm, red, add, sous, mul, div, egal, opp, ecrire };

  /* =====================================================================
     Écriture compacte → modèle
     « [3|4] + 2 × (−[1|5]) », « [2×3|5×7] », « [−3|4] »
     '-' '*' 'x' ':' '/' sont acceptés pour − × ÷ (le « / » seul n'est pas une fraction)
     ===================================================================== */
  const NORMAL = { '-': MOINS, '*': '×', 'x': '×', ':': '÷', '/': '÷' };
  function lire(texte) {
    let i = 0;
    const s = String(texte);
    function liste(fin) {
      const l = [];
      while (i < s.length) {
        const c = s[i];
        if (fin.indexOf(c) >= 0) return l;
        i++;
        if (c === ' ' || c === ' ') continue;
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
     Analyse : modèle → arbre de calcul
     nœuds : { t: 'nb', v } { t: 'fr', num, den } { t: 'op', o, a, b } { t: 'neg', a } { t: 'par', a }
     ===================================================================== */
  const erreur = msg => { throw { msg }; };
  const estChiffre = c => typeof c === 'string' && c >= '0' && c <= '9';
  const SIGNES = '+−×÷';
  // découpe en jetons : nombres (chiffres regroupés), fractions, opérations, parenthèses
  function jetons(l, opts) {
    const t = [];
    for (let i = 0; i < l.length; i++) {
      const e = l[i];
      if (typeof e === 'object') {
        if (!e.num.length || !e.den.length) erreur('Complète le numérateur et le dénominateur de chaque fraction.');
        t.push({ t: 'fr', num: analyser(e.num, opts), den: analyser(e.den, opts) });
      } else if (estChiffre(e)) {
        let v = e;
        while (estChiffre(l[i + 1])) v += l[++i];
        t.push({ t: 'nb', v: parseInt(v, 10) });
      } else if (opts && opts.sansPar && (e === '(' || e === ')')) continue;
      else t.push({ o: e });
    }
    return t;
  }
  function analyser(l, opts) {
    opts = opts || {};
    const t = jetons(l, opts);
    if (!t.length) erreur('Écris un calcul sur la ligne.');
    let i = 0;
    const voir = () => t[i], prendre = () => t[i++];
    const est = (k, o) => k && k.o !== undefined && o.indexOf(k.o) >= 0;
    const atome = k => k && (k.t || k.o === '(');
    // expression : somme de termes (le signe − est permis au début : −[3|4] + …)
    function expr() {
      let a;
      if (est(voir(), MOINS)) { prendre(); a = { t: 'neg', a: opts.plat ? facteur() : terme() }; }
      else a = opts.plat ? facteur() : terme();
      while (est(voir(), opts.plat ? SIGNES : '+−')) {
        const o = prendre().o;
        a = { t: 'op', o, a, b: opts.plat ? facteur() : terme() };
      }
      return a;
    }
    function terme() {
      let a = facteur();
      while (est(voir(), '×÷')) { const o = prendre().o; a = { t: 'op', o, a, b: facteur() }; }
      return a;
    }
    function facteur() {
      const k = voir();
      if (!k) erreur('Il manque un nombre à la fin de la ligne.');
      if (k.o === '(') {
        prendre();
        if (est(voir(), ')')) erreur('Les parenthèses sont vides.');
        const e = expr();
        if (!est(voir(), ')')) erreur('Il manque une parenthèse fermante « ) ».');
        prendre();
        if (atome(voir())) erreur('Il manque un signe opératoire après la parenthèse « ) ».');
        return { t: 'par', a: e };
      }
      if (k.t) {
        prendre();
        if (atome(voir())) erreur(voir().o === '(' ? 'Il manque un signe opératoire avant la parenthèse « ( ».' : 'Il manque un signe opératoire entre deux nombres.');
        return k;
      }
      if (k.o === MOINS) erreur('Après un signe opératoire, écris un nombre négatif entre parenthèses : × (−3).');
      if (k.o === ')') erreur('Il y a une parenthèse fermante « ) » en trop.');
      erreur('Il manque un nombre avant « ' + k.o + ' ».');
    }
    const a = expr();
    if (i < t.length) erreur(est(voir(), ')') ? 'Il y a une parenthèse fermante « ) » en trop.' : 'Il manque un signe opératoire.');
    return a;
  }

  /* =====================================================================
     Calcul exact, et calculs fautifs (erreurs classiques)
     ===================================================================== */
  // fraction écrite (ou entier) : numérateur et dénominateur tels qu'ils sont écrits (non simplifiés)
  function litteral(x) {
    if (x.t === 'nb') return { n: x.v, d: 1, frac: false };
    if (x.t === 'par') return litteral(x.a);
    if (x.t === 'neg') { const l = litteral(x.a); return l && { n: -l.n, d: l.d, frac: l.frac }; }
    if (x.t === 'fr') {
      let n, d;
      try { n = valeur(x.num); d = valeur(x.den); } catch (e) { return null; }
      if (n.d !== 1 || d.d !== 1) return null;
      return { n: n.n, d: d.n, frac: true };
    }
    return null;
  }
  // calculs fautifs : f(La, Lb, o) renvoie une valeur fausse (ou null si le calcul ne s'applique pas)
  const FAUTIFS = {
    denDouble: {
      o: '+−', f: (a, b, o) => a.frac && b.frac && a.d === b.d && red(o === '+' ? a.n + b.n : a.n - b.n, a.d + b.d),
      msg: 'Les dénominateurs sont égaux : on garde le dénominateur commun, on n’additionne pas les dénominateurs.'
    },
    sommeNaive: {
      o: '+−', f: (a, b, o) => (a.frac || b.frac) && (o === '+' ? red(a.n + b.n, a.d + b.d) : (a.d - b.d !== 0 ? red(a.n - b.n, a.d - b.d) : null)),
      msg: 'Tu as additionné (ou soustrait) les numérateurs entre eux et les dénominateurs entre eux. On ne peut additionner des fractions que si elles ont le même dénominateur : on additionne alors les numérateurs et on garde le dénominateur commun.'
    },
    denSansNum: {
      o: '+−', f: (a, b, o) => a.frac && b.frac && a.d !== b.d && red(o === '+' ? a.n + b.n : a.n - b.n, ppcm(a.d, b.d)),
      msg: 'Tu as pris un dénominateur commun sans changer les numérateurs. Quand tu multiplies le dénominateur d’une fraction par un nombre, multiplie aussi son numérateur par ce nombre.'
    },
    denProduitSansNum: {
      o: '+−', f: (a, b, o) => a.frac && b.frac && a.d !== b.d && ppcm(a.d, b.d) !== a.d * b.d && red(o === '+' ? a.n + b.n : a.n - b.n, a.d * b.d),
      msg: 'Tu as multiplié les dénominateurs sans changer les numérateurs. Pour mettre au même dénominateur, multiplie le numérateur et le dénominateur de chaque fraction par le même nombre.'
    },
    produitDenCommun: {
      o: '×', f: (a, b) => a.frac && b.frac && a.d === b.d && red(a.n * b.n, a.d),
      msg: 'Pour multiplier deux fractions, on multiplie les numérateurs entre eux et aussi les dénominateurs entre eux, même s’ils sont égaux. On ne garde le dénominateur commun que pour + et −.'
    },
    produitCroix: {
      o: '×', f: (a, b) => a.frac && b.frac && b.n !== 0 && red(a.n * b.d, a.d * b.n),
      msg: 'Tu as fait un produit en croix. Pour multiplier deux fractions : numérateur × numérateur, dénominateur × dénominateur.'
    },
    produitSomme: {
      o: '×', f: (a, b) => a.frac && b.frac && red(a.n * b.n, a.d + b.d),
      msg: 'Pour multiplier deux fractions, on multiplie aussi les dénominateurs entre eux (on ne les additionne pas).'
    },
    divSansInverser: {
      o: '÷', f: (a, b) => b.frac && red(a.n * b.n, a.d * b.d),
      msg: 'Diviser par une fraction, c’est multiplier par son inverse : retourne la deuxième fraction (échange son numérateur et son dénominateur), puis multiplie.'
    },
    divInverserPremier: {
      o: '÷', f: (a, b) => a.frac && b.frac && a.n !== 0 && red(a.d * b.n, a.n * b.d),
      msg: 'C’est la deuxième fraction (celle par laquelle on divise) qu’on remplace par son inverse, pas la première.'
    }
  };
  // valeur exacte d'un arbre ; fautif : nom d'un calcul fautif appliqué partout où il s'applique
  function valeur(x, fautif) {
    switch (x.t) {
      case 'nb': return { n: x.v, d: 1 };
      case 'fr': return div(valeur(x.num, fautif), valeur(x.den, fautif));
      case 'par': return valeur(x.a, fautif);
      case 'neg': return opp(valeur(x.a, fautif));
      case 'op': {
        const F = fautif && FAUTIFS[fautif];
        if (F && F.o.indexOf(x.o) >= 0) {
          const la = litteral(x.a), lb = litteral(x.b);
          if (la && lb) { const r = F.f(la, lb, x.o); if (r) return r; }
        }
        const a = valeur(x.a, fautif), b = valeur(x.b, fautif);
        return x.o === '+' ? add(a, b) : x.o === MOINS ? sous(a, b) : x.o === '×' ? mul(a, b) : div(a, b);
      }
    }
    throw { msg: 'Calcul impossible.' };
  }
  // termes d'une somme : [{ s: +1 | −1, x: nœud }]
  function termes(x, s, out) {
    out = out || []; s = s || 1;
    if (x.t === 'op' && (x.o === '+' || x.o === MOINS)) { termes(x.a, s, out); termes(x.b, x.o === '+' ? s : -s, out); }
    else if (x.t === 'neg' && out.length === 0) out.push({ s: -s, x: x.a });
    else out.push({ s, x });
    return out;
  }

  /* =====================================================================
     Affichage d'une ligne (HTML)
     ===================================================================== */
  // un « − » est un signe (et non une soustraction) en début de liste ou après « ( » ou une opération
  const estSigne = (l, i) => l[i] === MOINS && (i === 0 || l[i - 1] === '(' || SIGNES.indexOf(l[i - 1]) >= 0);
  function classeCar(l, i) {
    const c = l[i];
    if (SIGNES.indexOf(c) >= 0) return estSigne(l, i) ? 'fra-c fra-signe' : 'fra-c fra-op';
    if (c === '(' || c === ')') return 'fra-c fra-par';
    if (c === '=') return 'fra-c fra-op';
    return 'fra-c';
  }
  function htmlListe(l, vide) {
    if (!l.length) return vide ? '<span class="fra-vide"></span>' : '';
    return l.map((e, i) => typeof e === 'string' ? '<span class="' + classeCar(l, i) + '">' + e + '</span>'
      : '<span class="fra-f"><span class="fra-n">' + htmlListe(e.num, true) + '</span><span class="fra-d">' + htmlListe(e.den, true) + '</span></span>').join('');
  }
  const html = m => '<span class="fra-ligne">' + htmlListe(typeof m === 'string' ? lire(m) : m, false) + '</span>';
  const m = t => html(t);

  /* =====================================================================
     Éditeur d'une ligne (curseur, clavier, toucher)
     ===================================================================== */
  const AIDE_CLAVIER = 'Clavier : « / » fraction, « * » ×, « : » ÷, flèches pour te déplacer, Entrée pour vérifier.';
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

  function Editeur(zone, opts) {
    this.opts = opts || {};
    this.zone = zone;
    this.modele = [];
    this.cur = { l: this.modele, i: 0 };
    this.actif = true;
    zone.classList.add('fra-edit');
    zone.tabIndex = 0;
    zone.setAttribute('role', 'textbox');
    zone.setAttribute('aria-label', 'Ligne de calcul à écrire. ' + AIDE_CLAVIER);
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
      if (k.length === 1 && ('0123456789+−×÷()'.indexOf(k) >= 0)) { l.splice(c.i, 0, k); c.i++; }
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
    // fraction : le nombre (ou la parenthèse) juste avant le curseur devient le numérateur
    fraction() {
      const c = this.cur, l = c.l;
      let j = c.i;
      while (j > 0 && estChiffre(l[j - 1])) j--;
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
      const T = { '-': '−', '−': '−', '+': '+', '*': '×', 'x': '×', 'X': '×', '×': '×', ':': '÷', '÷': '÷', '(': '(', ')': ')', '/': 'frac',
        ArrowLeft: 'gauche', ArrowRight: 'droite', ArrowUp: 'haut', ArrowDown: 'bas', Backspace: 'effacer', Enter: 'valider', Escape: null };
      let t = null;
      if (k.length === 1 && k >= '0' && k <= '9') t = k;
      else if (Object.prototype.hasOwnProperty.call(T, k)) t = T[k];
      if (t) { e.preventDefault(); this.touche(t); }
    },
    // toucher (souris ou doigt) : le curseur se place à l'endroit touché
    toucher(e) {
      if (!this.actif) return;
      const cible = e.target.closest('.fra-c, .fra-vide, .fra-n, .fra-d, .fra-f');
      let pos = null;
      if (cible && cible._pos) {
        if (cible.classList.contains('fra-c')) {
          const r = cible.getBoundingClientRect();
          pos = { l: cible._pos.l, i: cible._pos.i + (e.clientX > r.left + r.width / 2 ? 1 : 0) };
        } else if (cible.classList.contains('fra-f')) {
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
        s.className = 'fra-li';
        const curseur = () => { if (ed.actif && ed.cur.l === l) { const k = document.createElement('span'); k.className = 'fra-curseur'; k.setAttribute('aria-hidden', 'true'); return k; } return null; };
        if (!l.length && vide) {
          const v = document.createElement('span');
          v.className = 'fra-vide' + (ed.actif && ed.cur.l === l ? ' ici' : '');
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
            x = document.createElement('span'); x.className = 'fra-f';
            const n = document.createElement('span'); n.className = 'fra-n'; n._pos = { l: e.num }; n.appendChild(liste(e.num, true));
            const d = document.createElement('span'); d.className = 'fra-d'; d._pos = { l: e.den }; d.appendChild(liste(e.den, true));
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
      r.classList.add('fra-ligne');
      if (!this.modele.length && this.actif) r.classList.add('fra-attente');
      this.zone.appendChild(r);
    }
  };

  /* =====================================================================
     Pavé à l'écran : chiffres à gauche (0 en large), opérations et fraction en haut à droite,
     flèches en T inversé en bas à droite ; dernière ligne : Décomposer, Simplifier, Vérifier
     ===================================================================== */
  const PAVE = [
    ['7'], ['8'], ['9'], ['+', 'Plus'], ['−', 'Moins'], ['effacer', 'Effacer', '⌫'],
    ['4'], ['5'], ['6'], ['×', 'Multiplier'], ['÷', 'Diviser'], ['frac', 'Fraction', '<span class="fra-tfrac" aria-hidden="true"><i></i><i></i></span>'],
    ['1'], ['2'], ['3'], ['(', 'Parenthèse ouvrante'], ['haut', 'Monter au numérateur', '▲'], [')', 'Parenthèse fermante'],
    ['0'], ['gauche', 'Reculer le curseur', '◀'], ['bas', 'Descendre au dénominateur', '▼'], ['droite', 'Avancer le curseur', '▶'],
    ['dec', 'Décomposer un nombre', 'Décomposer'], ['sim', 'Simplifier : barrer un facteur en haut et un en bas', 'Simplifier'], ['valider', 'Vérifier la ligne', 'Vérifier ↵']
  ];
  // opts.modes : { dec(), sim() } appelés par les touches Décomposer et Simplifier (sans opts, ces touches sont absentes)
  function pave(ed, opts) {
    opts = opts || {};
    const p = document.createElement('div');
    p.className = 'fra-pave';
    p.setAttribute('role', 'group');
    p.setAttribute('aria-label', 'Pavé de calcul');
    PAVE.forEach(t => {
      const k = t[0], mode = k === 'dec' || k === 'sim';
      if (mode && !opts.modes) return;
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'fra-t' + (k === 'valider' ? ' fra-t-ok' + (opts.modes ? '' : ' fra-t-seul') : mode ? ' fra-t-mode' : k === '0' ? ' fra-t-zero'
        : k === 'frac' ? ' fra-t-frac' : '+−×÷()'.indexOf(k) >= 0 ? ' fra-t-op' : /^\d$/.test(k) ? '' : ' fra-t-nav');
      b.innerHTML = t[2] || k;
      b.dataset.k = k;
      if (t[1]) { b.setAttribute('aria-label', t[1]); b.title = t[1]; }
      if (mode) b.setAttribute('aria-pressed', 'false');
      // le pavé ne prend pas le focus : la ligne garde son curseur (et le clavier de l'ordinateur reste actif)
      b.addEventListener('mousedown', e => e.preventDefault());
      b.addEventListener('click', () => {
        if (mode) { opts.modes[k](); return; }
        ed.touche(k);
        if (k !== 'valider' && matchMedia('(hover: hover)').matches && ed.actif) ed.zone.focus({ preventScroll: true });
      });
      p.appendChild(b);
    });
    return p;
  }

  FRA.X = { lire, texte, copie, html, m, analyser, valeur, FAUTIFS, termes, litteral, Q, Editeur, pave, AIDE_CLAVIER, MOINS };
})();
