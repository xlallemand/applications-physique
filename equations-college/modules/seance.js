/* ============================================================
   Équations du 1er degré — séance de 5 questions (EQ.seance)
   (même fonctionnement que modules/seance.js de l'application Fractions)
   ------------------------------------------------------------
   Rôle :
     - plan de la séance (EQ.planSeance : mode automatique, compétences
       choisies, ou adresse seance.html#comp=DE1,MU2) ;
     - pour chaque question : une feuille où l'élève écrit sa résolution
       ligne par ligne (une équation par ligne) avec le pavé ou le clavier ;
       chaque ligne est vérifiée (même solution que l'équation de départ ?),
       une ligne fausse reçoit un diagnostic ciblé (terme passé sans changer
       de signe, division oubliée d'un côté, développement faux…) ; la
       question est finie quand la dernière ligne est « x = un nombre »
       (entier, décimal ou fraction irréductible) ;
     - aides toujours disponibles : rappel de la compétence, indices
       successifs, exemple avec d'autres nombres, solution (0 point) ;
     - points : 2 juste sans erreur, 1 juste après erreur, 0 solution affichée ;
       note sur 20 ; suivi enregistré à chaque question (EQ.enregistrer).
   Dépend de : expr.js (EQ.X), competences.js (EQ.C), eq.js (EQ).
   API : EQ.seance(zone) ; EQ.verifier(q, precedent, modele) (vérification d'une ligne, aussi pour les tests)
   ============================================================ */
(function () {
  'use strict';
  const EQ = window.EQ, X = EQ.X, C = EQ.C, Q = X.Q;
  const el = EQ.el, bouton = EQ.bouton, esc = EQ.esc;
  const NB = 5;
  const M = X.MOINS;

  /* =====================================================================
     Lecture d'une ligne
     ===================================================================== */
  // { g, d } arbres, { G, D } modèles, { lg, ld } formes a x + b des deux membres, s solution ;
  // lève { msg } si la ligne est mal écrite
  function lireLigne(modele) {
    const e = X.analyserEq(modele), i = modele.indexOf('=');
    const lg = X.lin(e.g), ld = X.lin(e.d);
    return { g: e.g, d: e.d, G: modele.slice(0, i), D: modele.slice(i + 1), lg, ld, s: X.solution(lg, ld) };
  }
  const sansPar = a => { while (a.t === 'par') a = a.a; return a; };
  const estX = a => sansPar(a).t === 'x';
  // nombre « fini » écrit : entier, décimal, ou fraction de deux entiers, avec ses signes
  function ecrite(a) {
    a = sansPar(a);
    let devant = false;
    if (a.t === 'neg') { devant = true; a = sansPar(a.a); }
    const nombre = x => x.t === 'nb' ? { v: x.v, neg: false } : x.t === 'neg' && x.a.t === 'nb' ? { v: x.a.v, neg: true } : null;
    if (a.t === 'nb') return { frac: false };
    if (a.t !== 'fr') return null;
    const n = nombre(a.num), d = nombre(a.den);
    if (!n || !d || n.v.d !== 1 || d.v.d !== 1) return null;
    return { n: n.v.n, d: d.v.n, frac: true, devant, numNeg: n.neg, denNeg: d.neg };
  }
  // la ligne (juste) est-elle la réponse finale « x = nombre » ? { fini } ou { fini: false, msg }
  function forme(L) {
    const sx = estX(L.g) ? L.d : estX(L.d) ? L.g : null;          // l'autre membre quand un membre est x seul
    const s = L.s.v;
    if (sx) {
      const lc = estX(L.g) ? L.ld : L.lg;
      if (lc.a.n !== 0) return { fini: false, msg: 'Ligne juste. Il reste des x dans les deux membres : regroupe-les dans un seul membre.' };
      const e = ecrite(sx);
      if (!e) return { fini: false, msg: 'C’est juste. Calcule maintenant l’autre membre : la dernière ligne doit être x = un nombre.' };
      if (!e.frac) return { fini: true };
      if (s.d === 1) {
        if (e.d === 1 || e.d === -1) return { fini: false, msg: 'C’est juste. Une fraction de dénominateur 1 s’écrit simplement : x = ' + X.m(Q.ecrire(s)) + '.' };
        return { fini: false, msg: 'C’est juste. Termine le calcul : cette fraction est égale à un nombre entier.' };
      }
      if (e.denNeg && !e.numNeg && !e.devant) return { fini: false, msg: 'C’est juste. Place le signe − devant la fraction (ou au numérateur), pas au dénominateur.' };
      if ((e.numNeg ? 1 : 0) + (e.denNeg ? 1 : 0) + (e.devant ? 1 : 0) > 1) return { fini: false, msg: 'C’est juste. Simplifie les signes : deux signes − donnent +.' };
      if (Q.pgcd(e.n, e.d) > 1) return { fini: false, msg: 'C’est juste, mais la fraction n’est pas irréductible : simplifie-la.' };
      return { fini: true };
    }
    // un membre vaut −x ou a x, l'autre est un nombre
    const xg = L.lg.a.n !== 0, xd = L.ld.a.n !== 0;
    if (xg && xd) return { fini: false, msg: 'Ligne juste. Regroupe maintenant les termes en x dans un seul membre.' };
    const lx = xg ? L.lg : L.ld;
    if (lx.b.n === 0) {
      if (Q.egal(lx.a, Q.UN)) return { fini: false, msg: 'C’est juste. Simplifie chaque membre : la dernière ligne doit être x = un nombre.' };
      if (Q.egal(lx.a, Q.opp(Q.UN))) return { fini: false, msg: 'C’est juste. Il reste −x : change le signe des deux membres (−x = 3 donne x = −3).' };
      if (lx.a.d === 1) return { fini: false, msg: 'C’est juste. Il reste ' + X.m(X.ecrireLin(lx)) + ' : divise maintenant les deux membres par ' + X.m(Q.ecrire(lx.a)) + '.' };
      return { fini: false, msg: 'C’est juste. Continue jusqu’à x = un nombre.' };
    }
    return { fini: false, msg: 'Ligne juste. Continue : isole x.' };
  }

  /* =====================================================================
     Diagnostic d'une ligne fausse
     ===================================================================== */
  const R = n => Q.red(n, 1);
  const m = t => X.m(t);
  const ecrQ = q => m(Q.ecrire(q));
  // terme signé pour un message : « + 5 », « − 3x »
  const signe = (q, avecX) => {
    const abs = { n: Math.abs(q.n), d: q.d };
    return m((q.n < 0 ? M + ' ' : '+ ') + (avecX ? (abs.n === 1 && abs.d === 1 ? '' : Q.ecrire(abs)) + 'x' : Q.ecrire(abs)));
  };
  // nombre « simple » pour décrire une opération : entier, ou inverse d'un entier
  const simple = k => k.d === 1 || k.n === 1 || k.n === -1;
  function action(k) {
    if (Q.egal(k, R(-1))) return 'changé le signe du';
    if (k.d === 1) return 'multiplié le';
    return 'divisé le';
  }
  const parQ = k => k.d === 1 ? (Q.egal(k, R(-1)) ? '' : ' par ' + ecrQ(k)) : ' par ' + ecrQ(Q.div(Q.UN, k));
  // k tel que q = k p (formes a x + b proportionnelles), sinon null
  function rapport(p, q) {
    let k = null;
    if (p.a.n !== 0) k = Q.div(q.a, p.a); else if (p.b.n !== 0) k = Q.div(q.b, p.b);
    if (!k || k.n === 0) return null;
    return X.egalL(q, { a: Q.mul(k, p.a), b: Q.mul(k, p.b) }) ? k : null;
  }
  const memeL = (p, q) => X.egalL(p, q);
  const cst = p => p.a.n === 0;

  // erreurs classiques reconnues sur la valeur de la solution, à partir de la ligne P (lue)
  function parValeur(P, sN) {
    // a x = c (un membre a x seul, l'autre un nombre)
    const lx = P.lg.a.n !== 0 && cst(P.ld) ? P.lg : P.ld.a.n !== 0 && cst(P.lg) ? P.ld : null;
    if (lx) {
      const c = lx === P.lg ? P.ld.b : P.lg.b, a = lx.a, b = lx.b;
      const vaut = w => { try { return Q.egal(w(), sN); } catch (e) { return false; } };
      if (b.n === 0 && !Q.egal(a, Q.UN)) {
        if (Q.egal(a, R(-1))) {
          if (vaut(() => c)) return 'Si −x = ' + ecrQ(c) + ', alors x est l’opposé : change le signe des deux membres, x = ' + ecrQ(Q.opp(c)) + '.';
        } else if (a.d === 1) {
          const A = ecrQ(a);
          if (vaut(() => Q.sous(c, a))) return m(X.ecrireLin(lx)) + ', c’est ' + A + ' × x : pour isoler x, on divise les deux membres par ' + A + ', on ne soustrait pas ' + A + '.';
          if (vaut(() => Q.add(c, a)) && a.n < 0) return m(X.ecrireLin(lx)) + ', c’est ' + A + ' × x : pour isoler x, on divise les deux membres par ' + A + ', on n’ajoute pas ' + ecrQ(Q.opp(a)) + '.';
          if (vaut(() => Q.mul(c, a))) return 'x est multiplié par ' + A + ' : pour l’isoler, on divise par ' + A + ', on ne multiplie pas.';
          if (vaut(() => Q.div(a, c))) return 'Tu as divisé dans le mauvais sens : ' + m(X.ecrireLin(lx) + ' = ' + Q.ecrire(c)) + ' donne x = ' + m('[' + Q.ecrire(c) + '|' + Q.ecrire(a) + ']') + ' (le nombre seul divisé par le coefficient de x).';
          if (a.n < 0 && vaut(() => Q.div(c, Q.opp(a)))) return 'Attention au signe : on divise par ' + A + ', avec son signe −.';
        } else if (a.n === 1 || a.n === -1) {
          // x divisé par un nombre : [x|n] = c
          const n = Q.div(Q.UN, a);
          if (vaut(() => Q.div(c, n))) return 'x est divisé par ' + ecrQ(n) + ' : pour l’isoler, on multiplie les deux membres par ' + ecrQ(n) + ', on ne divise pas.';
          if (vaut(() => Q.sous(c, n)) || vaut(() => Q.add(c, n))) return 'x est divisé par ' + ecrQ(n) + ' : pour l’isoler, on multiplie les deux membres par ' + ecrQ(n) + '.';
        }
      }
      // a x + b = c divisé seulement en partie : x + b = c / a
      if (b.n !== 0 && !Q.egal(a, Q.UN) && vaut(() => Q.sous(Q.div(c, a), b)))
        return 'Quand tu divises un membre par ' + ecrQ(a) + ', tu dois diviser <b>tous</b> ses termes. Plus simple : fais d’abord passer ' + signe(b) + ' dans l’autre membre, puis divise.';
    }
    return null;
  }
  // développements faux (voir EQ.X.FAUTIFS), essayés parenthèse par parenthèse
  function parDeveloppement(modele, s, sN) {
    let e;
    try { e = X.analyserEq(modele); } catch (x) { return null; }
    for (const nom in X.FAUTIFS) {
      for (let i = 0; i < 6; i++) {
        const f = { nom, i };                               // seule la i-ième parenthèse est développée faussement
        try {
          const lg = X.lin(e.g, f), ld = X.lin(e.d, f);
          if ((f.k || 0) <= i) break;                       // plus de parenthèse à fausser
          const w = X.solution(lg, ld);
          if (w.type === 'un' && !Q.egal(w.v, s) && Q.egal(w.v, sN)) return X.FAUTIFS[nom];
        } catch (x) { break; }
      }
    }
    return null;
  }
  // comparaison des formes des membres entre la ligne P et la ligne N (même orientation)
  function parStructure(P, N) {
    const gP = P.lg, dP = P.ld, gN = N.lg, dN = N.ld;
    // un membre n'a pas changé, l'autre si
    for (const [aP, aN, bP, bN, cote, autre, bMod] of [[gP, gN, dP, dN, 'droite', 'gauche', P.D], [dP, dN, gP, gN, 'gauche', 'droite', P.G]]) {
      if (!memeL(aP, aN) || memeL(bP, bN)) continue;
      // un terme a disparu de ce membre sans passer dans l'autre
      if (bP.b.n !== 0 && bN.b.n === 0 && Q.egal(bP.a, bN.a))
        return 'Le terme ' + signe(bP.b) + ' a disparu du membre de ' + cote + ' : il doit passer dans le membre de ' + autre + ', où il devient ' + signe(Q.opp(bP.b)) + '. Ce que tu fais d’un côté du signe =, fais-le de l’autre.';
      if (bP.a.n !== 0 && bN.a.n === 0 && Q.egal(bP.b, bN.b))
        return 'Le terme ' + signe(bP.a, true) + ' a disparu du membre de ' + cote + ' : il doit passer dans le membre de ' + autre + ', où il devient ' + signe(Q.opp(bP.a), true) + '.';
      // un seul membre multiplié ou divisé (pour un membre constant : par le coefficient de x de l'autre membre)
      const k = rapport(bP, bN);
      if (k && simple(k) && (!cst(bP) || (cst(aP) === false && aP.b.n === 0 && (Q.egal(k, aP.a) || Q.egal(Q.mul(k, aP.a), Q.UN))))) return 'Tu as ' + action(k) + ' membre de ' + cote + parQ(k) + ', mais pas le membre de ' + autre + ' : fais la même opération des deux côtés du signe =.';
      if (cst(bP) && cst(bN)) return 'Le membre de ' + cote + ' n’a plus la même valeur : ' + X.html(bMod) + ' ne fait pas ' + ecrQ(bN.b) + '. Vérifie ce calcul.';
      return 'Le membre de ' + cote + ' n’a plus la même valeur que dans la ligne précédente : vérifie ta réduction (ou ton développement).';
    }
    // termes passés d'un membre à l'autre : x et nombres séparément
    const DgA = Q.sous(gN.a, gP.a), DdA = Q.sous(dN.a, dP.a), DgB = Q.sous(gN.b, gP.b), DdB = Q.sous(dN.b, dP.b);
    const okA = Q.egal(DgA, DdA), okB = Q.egal(DgB, DdB);
    const invA = !okA && Q.egal(DgA, Q.opp(DdA)), invB = !okB && Q.egal(DgB, Q.opp(DdB));
    // terme t passé d'un membre à l'autre sans changer de signe (t tel qu'il était écrit dans son membre de départ)
    const passe = (ap, an, D, avecX) => {
      const depuisGauche = an.n === 0 || Math.abs(an.n / an.d) < Math.abs(ap.n / ap.d);
      const t = depuisGauche ? Q.opp(D) : D;
      return 'Le terme ' + signe(t, avecX) + ' est passé de l’autre côté du signe = sans changer de signe : dans l’autre membre, il devient ' + signe(Q.opp(t), avecX) + '.';
    };
    if ((okA || invA) && (okB || invB) && (invA || invB)) {
      if (invB) return passe(gP.b, gN.b, DgB, false);
      return passe(gP.a, gN.a, DgA, true);
    }
    if (okA && !okB && !invB && (DgA.n !== 0 || DgB.n !== 0 || DdB.n !== 0)) return 'Les termes en x sont justes, mais pas les nombres : vérifie les calculs avec les nombres (un nombre qui change de membre change de signe).';
    if (okB && !okA && !invA && (DgB.n !== 0 || DgA.n !== 0 || DdA.n !== 0)) return 'Les nombres sont justes, mais pas les termes en x : vérifie le regroupement des x (un terme en x qui change de membre change de signe).';
    return null;
  }
  function diagnostiquer(q, prec, N, sN) {
    if (q.diag) { const d = q.diag(sN); if (d) return d; }
    const sources = [];
    if (prec) sources.push(prec);
    const dep = X.lire(q.depart);
    if (!prec || X.texte(prec) !== X.texte(dep)) sources.push(dep);
    const lues = sources.map(s => { try { return { mod: s, L: lireLigne(s) }; } catch (e) { return null; } }).filter(x => x);
    for (const P of lues) {
      const d = parValeur(P.L, sN) || parDeveloppement(P.mod, q.valeur, sN);
      if (d) return d;
    }
    // structure, par rapport à la ligne précédente seulement (dans les deux sens : membres échangés)
    if (lues.length && lues[0].mod === prec) {
      const P = lues[0].L;
      // membres échangés d'abord quand x a changé de côté (x + 5 = 12 → 12 + 5 = x)
      const seulG = L => L.lg.a.n !== 0 && L.ld.a.n === 0, seulD = L => L.ld.a.n !== 0 && L.lg.a.n === 0;
      const ech = { lg: N.ld, ld: N.lg };
      const d = (seulG(P) && seulD(N)) || (seulD(P) && seulG(N)) ? parStructure(P, ech) || parStructure(P, N) : parStructure(P, N) || parStructure(P, ech);
      if (d) return d;
      // a x = c → x = un nombre faux : le quotient est mal calculé
      const lx = P.lg.a.n !== 0 && cst(P.ld) ? P.lg : P.ld.a.n !== 0 && cst(P.lg) ? P.ld : null;
      if (lx && lx.b.n === 0 && lx.a.d === 1 && !Q.egal(lx.a, Q.UN) && (estX(N.g) || estX(N.d)))
        return 'Divise les deux membres par ' + ecrQ(lx.a) + ' : x = ' + m('[' + Q.ecrire(lx === P.lg ? P.ld.b : P.lg.b) + '|' + Q.ecrire(lx.a) + ']') + '. Vérifie ce calcul.';
    }
    if (sN.n !== 0 && Q.egal(sN, Q.opp(q.valeur))) return 'Attention au signe : ta ligne donne l’opposé de la bonne solution. Vérifie chaque signe (un terme qui change de membre change de signe ; on divise par un nombre avec son signe).';
    return 'Ta ligne n’a pas la même solution que la ligne précédente. Vérifie chaque transformation, ou demande un indice.';
  }
  // vérifie une ligne : { type: 'format' | 'faux' | 'juste', msg, fini }
  function verifier(q, precedent, modele) {
    let N;
    try { N = lireLigne(modele); } catch (e) { return { type: 'format', msg: e.msg || 'Écriture incomplète.' }; }
    if (precedent && X.texte(precedent) === X.texte(modele)) return { type: 'format', msg: 'C’est la même ligne que la précédente : transforme-la (une étape à la fois).' };
    if (N.s.type === 'tous') return { type: 'faux', msg: 'Ta ligne est vraie pour toutes les valeurs de x : les x ont disparu. Vérifie le regroupement des termes en x.' };
    if (N.s.type === 'aucune') return { type: 'faux', msg: 'Ta ligne n’a plus de solution : les termes en x se sont annulés. Vérifie le regroupement des termes en x.' };
    if (Q.egal(N.s.v, q.valeur)) { const f = forme(N); return { type: 'juste', fini: f.fini, msg: f.msg || '' }; }
    // valeur approchée écrite avec une virgule
    const ap = N.s.v.n / N.s.v.d, ex = q.valeur.n / q.valeur.d;
    if (X.texte(modele).indexOf(',') >= 0 && Math.abs(ap - ex) <= 0.006 * Math.max(1, Math.abs(ex)))
      return { type: 'format', msg: 'C’est une valeur approchée de la solution. Donne la valeur exacte : une fraction irréductible.' };
    return { type: 'faux', msg: diagnostiquer(q, precedent, N, N.s.v) };
  }

  /* =====================================================================
     Séance
     ===================================================================== */
  const ligneHTML = (html, cls) => '<div class="eq-l' + (cls ? ' ' + cls : '') + '">' + html + '</div>';
  const solutionHTML = q => '<div class="eq-feuille-s">' + ligneHTML(X.m(q.depart), 'eq-l0') + q.solution.map(l => ligneHTML(X.m(l))).join('') + '</div>';
  const RAISONS = { 'à travailler': 'à retravailler', fragile: 'à consolider', 'en cours': 'à continuer', nouvelle: 'nouvelle', 'révision': 'révision', choisie: '' };

  function seance(zone) {
    const demande = (/#comp=([A-Z0-9,]+)/.exec(location.hash) || [])[1];
    let plan, k, points, res;
    EQ.noteReglages = 'Les changements de compétences et de nombres s’appliquent à la prochaine séance.';
    const pave = () => !(EQ.reglages().pave === 'non' && matchMedia('(hover: hover) and (pointer: fine)').matches);

    function intro() {
      plan = EQ.planSeance(demande ? demande.split(',') : null);
      k = 0; points = 0; res = [];
      zone.innerHTML = '';
      const c = el('div', 'er-card');
      const auto = !demande && EQ.reglages().auto;
      c.appendChild(el('h3', 'eq-h3', 'Ta séance : ' + NB + ' équations'));
      c.appendChild(el('p', 'eq-petit', demande ? 'Les compétences demandées :' : auto ? 'Choisies automatiquement d’après ton suivi :' : 'Les compétences cochées dans tes réglages :'));
      const vus = [];
      const ul = el('ul', 'eq-plan');
      plan.forEach(p => {
        if (vus.indexOf(p.comp) >= 0) return;
        vus.push(p.comp);
        const n = plan.filter(x => x.comp === p.comp).length, r = RAISONS[p.raison];
        ul.appendChild(el('li', '', '<b>' + esc(C.R[p.comp].titre) + '</b> <span class="eq-petit">· ' + EQ.pluriel(n, 'question') + (r ? ' · ' + r : '') + '</span>'));
      });
      c.appendChild(ul);
      c.appendChild(el('div', 'cle', '<b class="cle-titre">Barème.</b> 2 points pour une équation résolue sans erreur, 1 point après une erreur, 0 si tu affiches la solution. Le rappel, les indices et l’exemple sont gratuits. Note sur 20.'));
      c.appendChild(el('p', 'eq-petit', 'Écris ta résolution ligne par ligne, comme sur ta feuille : une équation par ligne, jusqu’à x = un nombre. Avec le pavé, la touche ' + '<b class="eq-x">x</b>' + ' (en couleur) écrit l’inconnue, la touche × multiplie. ' + X.AIDE_CLAVIER));
      const r = el('div', 'er-actions');
      r.appendChild(bouton('btn-primary', 'Commencer →', () => question()));
      r.appendChild(bouton('btn-small', '⚙ Changer les compétences', EQ.ouvrirReglages));
      c.appendChild(r);
      zone.appendChild(c);
    }

    // difficulté : d'après le suivi, puis ajustée selon la question précédente de la même compétence
    function niveau(comp) {
      let n = EQ.niveauDe(comp);
      const avant = res.filter(x => x.comp === comp);
      if (avant.length && EQ.reglages().nombres === 'prog') {
        const der = avant[avant.length - 1];
        n = der.pts === 2 ? Math.min(3, der.niv + 1) : der.pts === 0 ? Math.max(1, der.niv - 1) : der.niv;
      }
      return n;
    }

    function question() {
      const p = plan[k], q = C.question(p.comp, niveau(p.comp)), comp = C.R[p.comp];
      EQ.questionEnCours = q;                     // question affichée (tests automatiques)
      let erreurs = 0, fini = false, precedent = X.lire(q.depart), nInd = 0;
      zone.innerHTML = '';
      // en-tête : numéro, score, barre de progression
      const t = el('div', 'er-card eq-entete-q');
      t.innerHTML = '<span class="er-badge">SÉANCE · QUESTION ' + (k + 1) + '/' + NB + '</span><p class="eq-petit eq-score">Question ' + (k + 1) + '/' + NB + ' · Score : ' + points + ' pts</p>' +
        '<div class="progress-bar"><div class="progress-fill" style="width:' + (100 * k / NB) + '%"></div></div>';
      zone.appendChild(t);
      const c = el('div', 'er-card eq-q');
      const r = RAISONS[p.raison];
      c.appendChild(el('p', 'er-q-nom', esc(comp.titre) + (r ? ' <span class="eq-tag">' + r + '</span>' : '')));
      c.appendChild(el('p', 'er-consigne', q.consigne));
      // aides
      const barre = el('div', 'eq-aides');
      barre.setAttribute('role', 'group'); barre.setAttribute('aria-label', 'Aides');
      const zRap = el('div', 'eq-aide'), zInd = el('div', 'eq-aide'), zEx = el('div', 'eq-aide'), zSol = el('div', 'eq-aide');
      const bRap = bouton('btn-small', '📖 Rappel', () => {
        const oui = !zRap.firstChild;
        zRap.innerHTML = '';
        if (oui) { zRap.appendChild(EQ.blocRappel(q.comp)); EQ.versVue(zRap); }
        bRap.setAttribute('aria-expanded', oui);
      });
      bRap.setAttribute('aria-expanded', 'false');
      const bInd = bouton('btn-small', '💡 Indice', () => {
        if (nInd >= q.indices.length) return;
        const d = el('div', 'eq-indice', '<b>Indice ' + (nInd + 1) + '.</b> ' + q.indices[nInd]);
        zInd.appendChild(d);
        nInd++;
        majInd();
        EQ.versVue(d);
      });
      const majInd = () => {
        bInd.innerHTML = nInd >= q.indices.length ? '💡 Tous les indices sont affichés' : nInd ? '💡 Indice suivant (' + (nInd + 1) + '/' + q.indices.length + ')' : '💡 Indice';
        bInd.disabled = nInd >= q.indices.length;
      };
      const bEx = bouton('btn-small', '✎ Exemple', () => montrerExemple());
      function montrerExemple() {
        const e = C.question(q.comp, q.niv);
        zEx.innerHTML = '';
        const b = el('div', 'eq-rappel');
        b.innerHTML = '<p class="eq-rappel-t">Exemple avec d’autres nombres</p>' + (e.consigne !== q.consigne ? '<p>' + e.consigne + '</p>' : '') + solutionHTML(e);
        const r2 = el('div', 'eq-rangee');
        r2.appendChild(bouton('btn-small', '↻ Un autre exemple', montrerExemple));
        r2.appendChild(bouton('btn-small', 'Fermer', () => { zEx.innerHTML = ''; }));
        b.appendChild(r2);
        zEx.appendChild(b);
        EQ.versVue(b);
      }
      const bSol = bouton('btn-small', 'Afficher la solution', () => {
        if (fini) return;
        zSol.innerHTML = '';
        zSol.appendChild(el('div', 'callout', '<b>Réponse.</b> Une résolution détaillée (0 point pour cette question) :' + solutionHTML(q)));
        terminer(0);
      });
      [bRap, bInd, bEx, bSol].forEach(b => barre.appendChild(b));
      c.appendChild(barre);
      c.appendChild(zRap); c.appendChild(zInd); c.appendChild(zEx);
      // la feuille : équation de départ, lignes écrites, ligne en cours
      const feuille = el('div', 'eq-feuille');
      feuille.appendChild(el('div', 'eq-l eq-l0', X.m(q.depart)));
      const cour = el('div', 'eq-l eq-cour');
      const zEd = el('div');
      cour.appendChild(zEd);
      const bVide = bouton('eq-vider', '✕', () => { ed.touche('vider'); if (matchMedia('(hover: hover)').matches) zEd.focus({ preventScroll: true }); }, 'Effacer la ligne');
      bVide.addEventListener('mousedown', e => e.preventDefault());   // la ligne garde le focus (clavier)
      bVide.title = 'Effacer la ligne';
      cour.appendChild(bVide);
      feuille.appendChild(cour);
      c.appendChild(feuille);
      const retour = el('div', 'eq-retour');
      retour.setAttribute('aria-live', 'polite');
      c.appendChild(retour);
      c.appendChild(zSol);
      const ed = new X.Editeur(zEd, { surValider: valider, surChange: () => { cour.classList.remove('eq-ko'); garderVisible(); } });
      const zPave = el('div', 'eq-pave-z');
      zPave.appendChild(X.pave(ed));
      zPave.hidden = !pave();
      c.appendChild(zPave);
      const act = el('div', 'er-actions eq-suite');
      c.appendChild(act);
      // un clic sur une aide (ou un bouton dans une aide) ne retire pas le focus de la ligne : on continue à taper au clavier
      c.addEventListener('mousedown', e => { if (e.target.closest('button') && e.target.closest('.eq-aides, .eq-aide')) e.preventDefault(); });
      zone.appendChild(c);
      majInd();
      if (matchMedia('(hover: hover)').matches) zEd.focus({ preventScroll: true });
      EQ.surReglages(cle => { if (cle === 'pave' && !fini) zPave.hidden = !pave(); });
      // début de la question : en-tête en haut de l'écran, puis la ligne à écrire au-dessus du pavé
      zone.firstChild.scrollIntoView({ block: 'start' });
      setTimeout(garderVisible, 30);

      // la ligne en cours ne doit jamais être cachée par le pavé (collé en bas de l'écran)
      function garderVisible() {
        if (!cour.parentNode) return;
        const rc = cour.getBoundingClientRect(), bas = zPave.hidden ? innerHeight : zPave.getBoundingClientRect().top;
        if (rc.bottom > bas || rc.top < 60) montrer(cour);
      }
      // amène un élément à l'écran, au-dessus du pavé (collé en bas de l'écran)
      function montrer(n) {
        n.style.scrollMarginBottom = (zPave.hidden ? 16 : zPave.offsetHeight + 16) + 'px';
        EQ.versVue(n);
      }
      function valider() {
        if (fini) return;
        const modele = X.copie(ed.modele);
        const v = verifier(q, precedent, modele);
        if (v.type === 'format') {
          retour.innerHTML = '<div class="callout eq-msg">' + v.msg + '</div>';
          montrer(retour);
          return;
        }
        if (v.type === 'faux') {
          erreurs++;
          cour.classList.remove('er-secoue'); void cour.offsetWidth; cour.classList.add('er-secoue', 'eq-ko');
          retour.innerHTML = '<div class="callout-danger eq-msg"><b>Ce n’est pas ça.</b> ' + v.msg +
            (erreurs >= 2 ? '<br>Corrige ta ligne, ou affiche la solution (0 point pour cette question).' : '') + '</div>';
          montrer(retour);
          return;
        }
        // ligne juste : elle s'écrit sur la feuille
        const l = el('div', 'eq-l eq-juste', X.html(modele) + '<span class="eq-coche" aria-label="ligne juste">✓</span>');
        feuille.insertBefore(l, cour);
        precedent = modele;
        if (!v.fini) {
          ed.vider();
          retour.innerHTML = '<div class="callout-accent eq-msg">' + v.msg + '</div>';
          montrer(zPave.hidden ? cour : retour);
          return;
        }
        cour.remove();
        const pts = erreurs ? 1 : 2;
        retour.innerHTML = '<div class="callout-success eq-msg"><b>' + (erreurs ? 'C’est juste.' : 'Juste !') + '</b> ' + (erreurs ? '1 point.' : '2 points.') + '</div>';
        const voir = bouton('btn-small', 'Voir une résolution détaillée', () => { voir.replaceWith(el('div', '', solutionHTML(q))); });
        retour.firstChild.appendChild(el('br'));
        retour.firstChild.appendChild(voir);
        terminer(pts);
      }
      // fin de la question : points, suivi, bouton suivant
      function terminer(pts) {
        fini = true;
        ed.activer(false);
        zPave.hidden = true;
        if (cour.parentNode) cour.remove();
        bSol.disabled = true;
        points += pts;
        res.push({ comp: q.comp, niv: q.niv, pts });
        EQ.enregistrer([{ r: q.comp, ok: pts / 2 }], null);
        t.querySelector('.eq-score').textContent = 'Question ' + (k + 1) + '/' + NB + ' · Score : ' + points + ' pts';
        t.querySelector('.progress-fill').style.width = (100 * (k + 1) / NB) + '%';
        const dernier = k === NB - 1;
        const b = bouton('btn-primary', dernier ? 'Voir mon résultat →' : 'Question suivante →', () => {
          zone.style.pointerEvents = 'none';
          setTimeout(() => { zone.style.pointerEvents = ''; }, 350);
          k++;
          if (dernier) { fin(); EQ.versVue(zone.firstChild, 'start'); } else question();
        });
        b.disabled = true;
        setTimeout(() => { b.disabled = false; }, 450);
        act.appendChild(b);
        setTimeout(() => EQ.versVue(act), 30);
      }
    }

    function fin() {
      const note = Math.round(points / (2 * NB) * 20 * 2) / 2;
      SOM.marquer({ note });
      EQ.enregistrer([], note);
      zone.innerHTML = '';
      const c = el('div', 'er-card er-fin');
      const pct = Math.round(100 * points / (2 * NB));
      const msg = pct === 100 ? 'Sans faute ! Bravo.' : pct >= 70 ? 'Très bien : continue comme ça.' : pct >= 50 ? 'C’est bien parti : refais une séance pour consolider.' : 'Ces compétences demandent encore du travail : relis leurs fiches et refais une séance.';
      c.innerHTML = '<span class="er-badge">SÉANCE TERMINÉE</span><p class="er-trophee">' + msg + '</p><div class="er-score">' + EQ.virg(note) + '<small>/20</small></div><p class="er-score-pct">' + pct + ' % des points</p>';
      const g = el('div', 'er-recap');
      res.forEach((x, i) => g.appendChild(el('div', x.pts === 2 ? 'ok' : x.pts === 0 ? 'ko' : '', '<b>Q' + (i + 1) + '</b>' + x.pts + ' pt' + (x.pts > 1 ? 's' : ''))));
      c.appendChild(g);
      // bilan par compétence, avec son statut à jour
      const ul = el('ul', 'eq-bilan');
      const vus = [];
      res.forEach(x => {
        if (vus.indexOf(x.comp) >= 0) return;
        vus.push(x.comp);
        const l = res.filter(y => y.comp === x.comp), p = l.reduce((a, y) => a + y.pts, 0);
        const st = EQ.statut(x.comp);
        ul.appendChild(el('li', '', '<span class="eq-puce eq-s-' + st + '" aria-hidden="true"></span><span><b>' + esc(C.R[x.comp].titre) + '</b> · ' + p + '/' + (2 * l.length) + ' pts</span><span class="eq-pct">' + EQ.LIBS[st].toLowerCase() + '</span>'));
      });
      c.appendChild(ul);
      const a = el('div', 'er-actions');
      a.appendChild(bouton('btn-primary', 'Nouvelle séance →', () => { if (demande) history.replaceState(null, '', location.pathname); location.reload(); }));
      const s = el('a', 'btn-secondary', 'Mon suivi'); s.href = 'suivi.html'; a.appendChild(s);
      const f = el('a', 'btn-secondary', 'Fiches des compétences'); f.href = 'fiches.html'; a.appendChild(f);
      c.appendChild(a);
      zone.appendChild(c);
      if (pct === 100) EQ.confettis();
    }

    intro();
  }

  EQ.seance = seance;
  EQ.verifier = verifier;
  EQ.lireLigne = lireLigne;
})();
