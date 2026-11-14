/* ============================================================
   Fractions — décomposer et simplifier sur une ligne écrite (objet FRA.S)
   Sur la dernière ligne de la feuille (ligne de départ, puis chaque ligne validée) :
   - Décomposer : l'élève touche un nombre et écrit sa décomposition (9 = 3 × 3) ;
     le nombre est remplacé par ses facteurs.
   - Simplifier : l'élève touche un facteur du numérateur et un facteur du dénominateur
     d'un même produit. Égaux : ils se barrent. Sinon, il écrit ce qu'il reste à la place
     de chacun (case vide : 1) ; les deux nombres se barrent, le reste s'écrit au-dessus
     (en haut) ou en dessous (en bas). Chaque paire a sa couleur ; la barre penche dans
     l'autre sens quand l'un des deux nombres est 7 (sinon elle se confond avec le 7).
   Simplification permise : dans un même produit de fractions et d'entiers (séparé par + − ÷),
   entre un facteur d'un numérateur écrit comme un produit et un facteur d'un dénominateur
   écrit comme un produit. Les nombres barrés ne changent pas la valeur de la ligne :
   la ligne suivante est écrite par l'élève.

   API : const s = FRA.S.creer({ message(texte, type), surMode(mode), surAide(), montrer(element) })
     s.attacher(elementLigne, modele)  rend la ligne active (la précédente est figée)
     s.basculer('dec' | 'sim')         choisit le mode, ou le quitte s'il est déjà choisi
     s.touche(k)                       touche du pavé : true si la saisie en cours l'a prise
     s.validerSaisie()                 valide la saisie ouverte : false si elle est fausse
     s.simplifie()                     une ligne a été simplifiée jusqu'au bout (consigne qui l'exige)
     s.aide                            « Montrer une décomposition » a été utilisée
     s.fin()                           fige tout (fin de la question)
   ============================================================ */
(function () {
  'use strict';
  const FRA = window.FRA = window.FRA || {};
  const MOINS = '−', SIGNES = '+−×÷', NBSP = ' ';
  const COULEURS = ['--orga-ram-1', '--orga-ram-3', '--orga-ram-4', '--orga-ram-2', '--orga-groupe', '--orga-chaine'];
  const coul = p => 'var(' + COULEURS[p % COULEURS.length] + ')';
  const pgcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) { const t = a % b; a = b; b = t; } return a; };
  const uneDecomp = n => { for (let a = 2; a * a <= n; a++) if (n % a === 0) return [a, n / a]; return null; };
  const typo = s => String(s).replace(/ ([:;?!»])/g, NBSP + '$1').replace(/« /g, '«' + NBSP);
  const estChiffre = c => typeof c === 'string' && c >= '0' && c <= '9';
  const estNb = e => e && typeof e === 'object' && e.nb;
  const estFr = e => e && typeof e === 'object' && e.num;
  const val = t => t.vals[t.vals.length - 1];

  /* ---------- ligne annotée ----------
     le modèle de la ligne (caractères, fractions { num, den }) où chaque nombre devient
     un jeton { nb: true, id, vals: [départ, reste1, …], cols: [paire de chaque barre] } */
  let nid = 1;
  function annoter(l) {
    const r = [];
    for (let i = 0; i < l.length; i++) {
      const e = l[i];
      if (estChiffre(e)) {
        let t = '';
        while (i < l.length && estChiffre(l[i])) t += l[i++];
        i--;
        r.push({ nb: true, id: nid++, vals: [+t], cols: [] });
      } else if (typeof e === 'object') r.push({ num: annoter(e.num), den: annoter(e.den) });
      else r.push(e);
    }
    return r;
  }
  // un « − » est un signe (et non une soustraction) en début de liste ou après « ( » ou une opération
  const estSigne = (l, i) => l[i] === MOINS && (i === 0 || l[i - 1] === '(' || (typeof l[i - 1] === 'string' && SIGNES.indexOf(l[i - 1]) >= 0));

  /* ---------- produits où l'on peut simplifier ----------
     renvoie la liste des produits { haut: [jetons], bas: [jetons] } de la ligne */
  function produits(l, out) {
    out = out || [];
    // côté (numérateur ou dénominateur) écrit comme un produit de nombres : [−] n × n × …
    const produitSimple = c => {
      let i = c[0] === MOINS ? 1 : 0;
      if (i >= c.length) return null;
      const j = [];
      for (; i < c.length; i += 2) {
        if (!estNb(c[i])) return null;
        j.push(c[i]);
        if (i + 1 < c.length && c[i + 1] !== '×') return null;
      }
      return j;
    };
    // découpe en morceaux séparés par + − ÷ (entre deux termes)
    const morceaux = [[]];
    let prof = 0;
    l.forEach((e, i) => {
      if (e === '(') prof++;
      if (e === ')') prof--;
      if (prof === 0 && typeof e === 'string' && (e === '+' || e === '÷' || (e === MOINS && !estSigne(l, i)))) morceaux.push([]);
      else morceaux[morceaux.length - 1].push(e);
    });
    morceaux.forEach(m => {
      const p = { haut: [], bas: [] };
      // facteurs du morceau séparés par × (au premier niveau)
      const facteurs = [[]];
      let pr = 0;
      m.forEach(e => {
        if (e === '(') pr++;
        if (e === ')') pr--;
        if (pr === 0 && e === '×') facteurs.push([]);
        else facteurs[facteurs.length - 1].push(e);
      });
      facteurs.forEach(f => {
        // signe devant, parenthèses autour d'un seul nombre ou d'une seule fraction : transparents
        let g = f;
        for (;;) {
          if (g[0] === MOINS) g = g.slice(1);
          else if (g[0] === '(' && g[g.length - 1] === ')' && fermante(g) === g.length - 1) g = g.slice(1, -1);
          else break;
        }
        if (g.length === 1 && estNb(g[0])) { p.haut.push(g[0]); return; }
        if (g.length === 1 && estFr(g[0])) {
          const fr = g[0], h = produitSimple(fr.num), b = produitSimple(fr.den);
          if (h) p.haut.push(...h); else produits(fr.num, out);
          if (b) p.bas.push(...b); else produits(fr.den, out);
          return;
        }
        // autre écriture (somme entre parenthèses…) : les produits à l'intérieur des parenthèses et des fractions
        if (g.length < f.length) produits(g, out); else dedans(g, out);
      });
      if (p.haut.length || p.bas.length) out.push(p);
    });
    return out;
  }

  // place de la parenthèse qui ferme celle du début de g
  function fermante(g) {
    let p = 0;
    for (let i = 0; i < g.length; i++) { if (g[i] === '(') p++; if (g[i] === ')' && --p === 0) return i; }
    return -1;
  }
  function dedans(g, out) {
    let prof = 0, grp = [];
    g.forEach(e => {
      if (e === '(') { if (prof++ === 0) { grp = []; return; } }
      if (e === ')') { if (--prof === 0) { produits(grp, out); return; } }
      if (prof > 0) grp.push(e);
      else if (estFr(e)) { produits(e.num, out); produits(e.den, out); }
    });
  }

  /* ---------- le contrôleur d'une question ---------- */
  function creer(opts) {
    opts = opts || {};
    const S = { mode: null, aide: false };
    let ligne = null;          // ligne active : { el, modele (annoté), paires, sens: [] }
    const lignes = [];         // toutes les lignes annotées (pour « simplifie »)
    let choix = null;          // jeton choisi (simplifier)
    let saisie = null;         // { type: 'dec', t, txt } | { type: 'reste', h, b, th, tb, ou }
    let zSaisie = null, bloquerClic = false, actif = true, dejaOuverte = false;
    const nouveaux = new Set();

    const message = (t, type) => { if (opts.message) opts.message(t, type); };
    // chaque nombre simplifiable : son côté et le numéro de son produit
    const tous = () => produits(ligne.modele).flatMap((pr, p) => pr.haut.map(t => ({ t, cote: 'haut', p })).concat(pr.bas.map(t => ({ t, cote: 'bas', p }))));
    const trouve = t => tous().find(o => o.t === t);

    /* ----- dessin d'une ligne annotée ----- */
    function dessinerLigne(L, vivante) {
      const ancien = L.el.querySelector('.fra-ligne');
      const s = document.createElement('span');
      s.className = 'fra-ligne sim-ligne' + (vivante && S.mode ? ' sim-on' : '');
      const elig = vivante ? new Set(tous().map(o => o.t)) : new Set();
      liste(L.modele, s, 'haut');
      function liste(l, parent, cote) {
        l.forEach((e, i) => {
          if (estNb(e)) parent.appendChild(jeton(e, cote));
          else if (estFr(e)) {
            const f = el('span', 'fra-f'), n = el('span', 'fra-n'), d = el('span', 'fra-d');
            if (!e.num.length) n.appendChild(el('span', 'fra-vide'));
            if (!e.den.length) d.appendChild(el('span', 'fra-vide'));
            liste(e.num, n, 'haut'); liste(e.den, d, 'bas');
            f.appendChild(n); f.appendChild(d); parent.appendChild(f);
          } else {
            const c = el('span', SIGNES.indexOf(e) >= 0 ? (estSigne(l, i) ? 'fra-c fra-signe' : 'fra-c fra-op') : (e === '(' || e === ')') ? 'fra-c fra-par' : 'fra-c');
            c.textContent = e;
            parent.appendChild(c);
          }
        });
      }
      // un nombre : sa valeur de départ, puis les restes (au-dessus en haut, en dessous en bas ; 1 ne s'écrit pas)
      function jeton(t, cote) {
        const s = el('span', 'sim-fac ' + cote);
        t.vals.forEach((v, i) => {
          const dernier = i === t.vals.length - 1;
          if (dernier && i > 0 && v === 1) return;
          const b = el(vivante ? 'button' : 'span', 'sim-v ' + (i ? 'sim-vq' : 'sim-v0'));
          b.textContent = String(v);
          if (vivante) b.type = 'button';
          if (!dernier) {
            const p = t.cols[i];
            b.classList.add('sim-barre');
            if (L.sens[p]) b.classList.add('sim-inv');
            b.style.setProperty('--c', coul(p));
            b.setAttribute('aria-label', v + ' barré');
          } else {
            if (i) b.style.setProperty('--c', coul(t.cols[i - 1]));
            if (vivante && v > 1 && elig.has(t) && (S.mode === 'sim' || (S.mode === 'dec' && i === 0))) b.classList.add('sim-vivant');
            if (vivante && (choix === t || (saisie && (saisie.t === t || saisie.h === t || saisie.b === t)))) b.classList.add('sim-choisi');
          }
          if (nouveaux.has(t)) b.classList.add('sim-nouveau');
          if (vivante) {
            b._jeton = t; b._dernier = dernier;
            b.addEventListener('click', () => toucher(t, dernier, b));
          }
          s.appendChild(b);
        });
        return s;
      }
      if (ancien) ancien.replaceWith(s); else L.el.appendChild(s);
      nouveaux.clear();
    }
    function el(tag, cls) { const e = document.createElement(tag); if (cls) e.className = cls; return e; }
    function dessiner() {
      if (ligne) dessinerLigne(ligne, actif);
      dessinerSaisie();
      if (opts.surMode) opts.surMode(S.mode);
    }

    /* ----- zone de saisie (sous la ligne active) ----- */
    function dessinerSaisie() {
      if (zSaisie) { zSaisie.remove(); zSaisie = null; }
      if (!saisie || !ligne) { dejaOuverte = false; return; }
      const r = el('div', 'sim-saisie');
      if (saisie.type === 'dec') {
        r.appendChild(texte('span', val(saisie.t) + ' ='));
        r.appendChild(texte('span', typo(saisie.txt.replace(/×/g, ' × ')), 'sim-case actif'));
        r.appendChild(boutonOk());
        const a = el('button', 'sim-lien'); a.type = 'button'; a.textContent = 'Montrer une décomposition (0 point)';
        a.addEventListener('click', montrerDecomp);
        r.appendChild(a);
      } else {
        r.appendChild(texte('small', 'Il reste' + NBSP + ':'));
        const m = el('span', 'sim-mini');
        const rangee = (cote, v) => {
          const sp = el('span');
          sp.appendChild(texte('small', 'à la place de ' + v));
          const k = el('button', 'sim-case' + (saisie.ou === cote ? ' actif' : '')); k.type = 'button';
          k.textContent = saisie['t' + cote];
          k.setAttribute('aria-label', 'Ce qu’il reste à la place de ' + v);
          k.addEventListener('click', () => { saisie.ou = cote; dessinerSaisie(); });
          sp.appendChild(k);
          return sp;
        };
        m.appendChild(rangee('h', val(saisie.h))); m.appendChild(el('i')); m.appendChild(rangee('b', val(saisie.b)));
        r.appendChild(m);
        r.appendChild(boutonOk());
        r.appendChild(texte('small', 'case vide' + NBSP + ': il reste 1', 'sim-note'));
      }
            ligne.el.insertAdjacentElement('afterend', r);
      zSaisie = r;
      // à l'ouverture : la saisie doit être visible (au-dessus du pavé collé en bas de l'écran)
      if (opts.montrer && !dejaOuverte) opts.montrer(r);
      dejaOuverte = true;
    }
    function texte(tag, t, cls) { const e = el(tag, cls); e.innerHTML = t; return e; }
    function boutonOk() {
      const b = el('button', 'sim-ok'); b.type = 'button'; b.textContent = '✓'; b.setAttribute('aria-label', 'Valider');
      b.addEventListener('click', () => S.validerSaisie());
      return b;
    }
    function erreur(t) {
      message(t, 'danger');
      if (zSaisie) { zSaisie.classList.remove('er-secoue'); void zSaisie.offsetWidth; zSaisie.classList.add('er-secoue'); }
      return false;
    }
    function fermer() { saisie = null; choix = null; dessiner(); }

    // validation de la saisie : true si elle est fermée (juste, ou laissée vide), false si elle est fausse
    S.validerSaisie = function () {
      if (!saisie) return true;
      if (saisie.type === 'dec') {
        const t = saisie.t, n = val(t);
        if (!saisie.txt) { fermer(); message(''); return true; }
        const m = saisie.txt.split('×').filter(Boolean).map(Number);
        if (m.length < 2) return erreur('Écris ' + n + ' comme un produit d’au moins deux nombres, avec ×.');
        if (m.some(x => x < 2)) return erreur('Multiplier par 1 ne décompose rien : utilise des nombres plus grands que 1.');
        const p = m.reduce((a, x) => a * x, 1);
        if (p !== n) return erreur(m.join(' × ') + ' = ' + p + ', pas ' + n + '.');
        // le nombre est remplacé par ses facteurs, séparés par ×
        const ou = chercher(ligne.modele, t);
        const nv = m.map(v => ({ nb: true, id: nid++, vals: [v], cols: [] }));
        const morceaux = [];
        nv.forEach((x, i) => { if (i) morceaux.push('×'); morceaux.push(x); nouveaux.add(x); });
        ou.l.splice(ou.i, 1, ...morceaux);
        fermer(); message('');
        return true;
      }
      const h = val(saisie.h), b = val(saisie.b);
      if (saisie.th === '' && saisie.tb === '') { fermer(); message(''); return true; }
      // une case laissée vide vaut 1
      const rh = saisie.th === '' ? 1 : +saisie.th, rb = saisie.tb === '' ? 1 : +saisie.tb;
      if (!rh || !rb) return erreur('Il reste au moins 1 : on n’écrit pas 0.');
      if (h % rh) return erreur(h + ' n’est pas divisible par ' + rh + '.');
      if (b % rb) return erreur(b + ' n’est pas divisible par ' + rb + '.');
      if (h / rh !== b / rb) return erreur('En haut, tu divises ' + h + ' par ' + (h / rh) + ' ; en bas, ' + b + ' par ' + (b / rb) + '. Il faut diviser les deux par le même nombre.');
      if (h / rh === 1) return erreur('Tu as gardé les mêmes nombres : rien n’est simplifié.');
      barrer(saisie.h, saisie.b, rh, rb);
      return true;
    };
    // place d'un jeton dans la ligne : { l, i }
    function chercher(l, t) {
      for (let i = 0; i < l.length; i++) {
        if (l[i] === t) return { l, i };
        if (estFr(l[i])) { const r = chercher(l[i].num, t) || chercher(l[i].den, t); if (r) return r; }
      }
      return null;
    }
    function barrer(th, tb, rh, rb) {
      const p = ligne.paires++;
      // barre dans l'autre sens si l'un des deux nombres est 7 (elle se confondrait avec le 7)
      ligne.sens[p] = val(th) === 7 || val(tb) === 7;
      th.cols.push(p); th.vals.push(rh);
      tb.cols.push(p); tb.vals.push(rb);
      fermer(); message('');
    }
    function montrerDecomp() {
      const n = val(saisie.t), d = uneDecomp(n);
      if (!d) { message(n + ' est un nombre premier : il ne se décompose pas.', 'danger'); return; }
      if (!S.aide) { S.aide = true; if (opts.surAide) opts.surAide(); }
      saisie.txt = d[0] + '×' + d[1];
      message('');
      dessinerSaisie();
    }

    /* ----- toucher un nombre de la ligne active ----- */
    function toucher(t, dernier, b) {
      if (!actif) return;
      const secouer = () => { b.classList.remove('sim-non'); void b.offsetWidth; b.classList.add('sim-non'); };
      if (!dernier) { secouer(); return; }                          // nombre barré : rien à faire
      // nombre déjà choisi : on le désélectionne
      if (choix === t || (saisie && (saisie.t === t || saisie.h === t || saisie.b === t))) { fermer(); message(''); return; }
      if (!S.mode) { secouer(); message('Pour décomposer ou simplifier, choisis d’abord « Décomposer » ou « Simplifier » dans le pavé.'); return; }
      const o = trouve(t);
      if (!o) { secouer(); message(S.mode === 'sim' ? 'Ce nombre ne peut pas se simplifier ici : on simplifie un facteur d’un numérateur avec un facteur d’un dénominateur, dans un même produit.' : 'Décompose un nombre d’un produit (numérateur ou dénominateur écrit comme un produit).', 'danger'); return; }
      if (val(t) < 2) { secouer(); return; }
      if (S.mode === 'dec') {
        if (t.vals.length > 1) { secouer(); message('Ce nombre est déjà simplifié : décompose un nombre qui n’est pas barré.', 'danger'); return; }
        saisie = { type: 'dec', t, txt: '' }; choix = null;
        dessiner(); message('Écris la décomposition de ' + val(t) + ' avec ×.');
        return;
      }
      // simplifier : un nombre en haut, un nombre en bas, dans le même produit
      if (!choix || trouve(choix).cote === o.cote) {
        choix = t;
        dessiner(); message('Touche maintenant un nombre ' + (o.cote === 'haut' ? 'du dénominateur.' : 'du numérateur.'));
        return;
      }
      const a = trouve(choix);
      if (a.p !== o.p) { secouer(); message('Ces deux nombres ne sont pas dans le même produit : on ne peut pas les simplifier ensemble.', 'danger'); return; }
      const th = a.cote === 'haut' ? a.t : t, tb = a.cote === 'haut' ? t : a.t;
      if (val(th) === val(tb)) { barrer(th, tb, 1, 1); return; }
      if (pgcd(val(th), val(tb)) === 1) { secouer(); message(val(th) + ' et ' + val(tb) + ' n’ont pas de diviseur commun : ils ne se simplifient pas.', 'danger'); return; }
      saisie = { type: 'reste', h: th, b: tb, th: '', tb: '', ou: 'h' }; choix = null;
      dessiner(); message('Écris ce qu’il reste à la place de ' + val(th) + ' et de ' + val(tb) + '.');
    }

    S.basculer = function (k) {
      if (!actif || !ligne) return;
      if (saisie && !S.validerSaisie()) return;
      S.mode = S.mode === k ? null : k; choix = null;
      dessiner();
      message(S.mode === 'sim' ? 'Simplifier : touche un nombre en haut et un nombre en bas.' : S.mode === 'dec' ? 'Décomposer : touche le nombre à décomposer.' : '');
    };
    // touches du pavé pendant une saisie
    S.touche = function (k) {
      if (!saisie) return false;
      const champ = saisie.type === 'dec' ? 'txt' : 't' + saisie.ou;
      let t = saisie[champ];
      if (/^\d$/.test(k)) t = (t + k).slice(0, 12);
      else if (k === '×' && saisie.type === 'dec') { if (t && !t.endsWith('×')) t += '×'; }
      else if (k === 'effacer') t = t.slice(0, -1);
      else if (k === 'vider') t = '';
      else if ((k === 'haut' || k === 'bas') && saisie.type === 'reste') saisie.ou = k === 'haut' ? 'h' : 'b';
      else if (k === 'valider') { S.validerSaisie(); return true; }
      else return true;                                             // autres touches : sans effet pendant la saisie
      saisie[champ] = t;
      dessinerSaisie();
      return true;
    };
    S.attacher = function (elLigne, modele) {
      if (saisie) { saisie = null; choix = null; }
      if (ligne) dessinerLigne(ligne, false);
      ligne = { el: elLigne, modele: annoter(modele), paires: 0, sens: [] };
      lignes.push(ligne);
      choix = null;
      dessiner();
    };
    // une ligne a été simplifiée, et il n'y reste plus de facteur commun dans aucun produit
    S.simplifie = () => lignes.some(L => L.paires > 0 && produits(L.modele).every(p => {
      const pr = c => p[c].reduce((a, t) => a * val(t), 1);
      return pgcd(pr('haut'), pr('bas')) === 1;
    }));
    S.saisieOuverte = () => !!saisie;
    S.fin = function () {
      saisie = null; choix = null; S.mode = null; actif = false;
      if (ligne) dessinerLigne(ligne, false);
      dessinerSaisie();
      if (opts.surMode) opts.surMode(null);
      document.removeEventListener('pointerdown', surPointeur, true);
      document.removeEventListener('click', surClic, true);
      document.removeEventListener('keydown', surTouche, true);
    };

    /* ----- toucher ailleurs : la saisie se valide d'elle-même ----- */
    function surPointeur(e) {
      if (!saisie) return;
      const t = e.target;
      if (!t.closest || t.closest('.sim-saisie')) return;
      const v = t.closest('.sim-v');
      if (v && (v._jeton === saisie.t || v._jeton === saisie.h || v._jeton === saisie.b)) return;   // désélection
      const k = t.closest('.fra-pave button, .fra-modes button');
      if (k) return;          // pavé : la touche va à la saisie (Décomposer / Simplifier valident d'abord)
      if (!S.validerSaisie()) bloquerClic = true;
    }
    function surClic(e) { if (bloquerClic) { bloquerClic = false; e.stopPropagation(); e.preventDefault(); } }
    // clavier de l'ordinateur pendant une saisie
    function surTouche(e) {
      if (!saisie || e.ctrlKey || e.metaKey || e.altKey) return;
      const k = /^\d$/.test(e.key) ? e.key : (e.key === '*' || e.key === 'x' || e.key === 'X') ? '×' : e.key === 'Backspace' ? 'effacer' : e.key === 'Enter' ? 'valider'
        : e.key === 'ArrowUp' ? 'haut' : e.key === 'ArrowDown' ? 'bas' : e.key === 'Escape' ? 'echap' : null;
      if (!k) return;
      e.preventDefault(); e.stopPropagation();
      if (k === 'echap') { fermer(); message(''); return; }
      S.touche(k);
    }
    document.addEventListener('pointerdown', surPointeur, true);
    document.addEventListener('click', surClic, true);
    document.addEventListener('keydown', surTouche, true);
    return S;
  }

  FRA.S = { creer, produits, annoter };
})();
