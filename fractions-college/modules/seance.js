/* ============================================================
   Fractions — séance de 5 questions (FRA.seance)
   ------------------------------------------------------------
   Rôle :
     - plan de la séance (FRA.planSeance : mode automatique, compétences
       choisies, ou adresse seance.html#comp=AS2,MD1) ;
     - pour chaque question : une feuille où l'élève écrit son calcul ligne
       par ligne (« = … ») avec le pavé ou le clavier ; chaque ligne est
       vérifiée (égale au calcul de départ ?), une ligne fausse reçoit un
       diagnostic ciblé ; la question est finie quand la dernière ligne est
       une fraction irréductible (ou un entier, ou la forme demandée) ;
     - aides toujours disponibles : rappel de la compétence, indices
       successifs, exemple avec d'autres nombres, solution (0 point) ;
     - points : 2 juste sans erreur, 1 juste après erreur, 0 solution affichée ;
       note sur 20 ; suivi enregistré à chaque question (FRA.enregistrer).
   Dépend de : expr.js (FRA.X), competences.js (FRA.C), fra.js (FRA).
   API : FRA.seance(zone) ; FRA.verifier(q, precedent, modele) (vérification d'une ligne, aussi pour les tests)
   ============================================================ */
(function () {
  'use strict';
  const FRA = window.FRA, X = FRA.X, C = FRA.C, Q = X.Q;
  const el = FRA.el, bouton = FRA.bouton, esc = FRA.esc;
  const NB = 5;

  /* =====================================================================
     Vérification d'une ligne
     ===================================================================== */
  // écriture « finale » : [−]n ou [−][n|d] avec n et d des nombres écrits (éventuellement négatifs)
  function ecrite(a) {
    while (a.t === 'par') a = a.a;
    let devant = false;
    if (a.t === 'neg') { devant = true; a = a.a; while (a.t === 'par') a = a.a; }
    const nombre = x => x.t === 'nb' ? { v: x.v, neg: false } : x.t === 'neg' && x.a.t === 'nb' ? { v: x.a.v, neg: true } : null;
    if (a.t === 'nb') return { n: devant ? -a.v : a.v, d: 1, frac: false, devant, numNeg: false, denNeg: false };
    if (a.t !== 'fr') return null;
    const n = nombre(a.num), d = nombre(a.den);
    if (!n || !d) return null;
    return { n: n.v, d: d.v, frac: true, devant, numNeg: n.neg, denNeg: d.neg };
  }
  // la ligne (juste) est-elle la réponse attendue ? { fini } ou { fini: false, msg }
  function forme(a, q) {
    const e = ecrite(a);
    if (q.but && q.but.den) {
      if (e && e.frac && e.d === q.but.den && !e.devant && !e.numNeg && !e.denNeg) return { fini: true };
      return { fini: false, msg: 'C’est juste. Écris maintenant la fraction qui a pour dénominateur ' + q.but.den + '.' };
    }
    if (!e) return { fini: false, msg: 'Ligne juste. Continue le calcul jusqu’à obtenir une seule fraction.' };
    if (q.valeur.d === 1) {
      if (!e.frac) return { fini: true };
      if (e.d === 1) return { fini: false, msg: 'C’est juste. Une fraction de dénominateur 1 s’écrit simplement : ' + Q.ecrire(q.valeur) + '.' };
      return { fini: false, msg: 'C’est juste. Simplifie : cette fraction est égale à un nombre entier.' };
    }
    if (e.denNeg && !e.numNeg && !e.devant) return { fini: false, msg: 'C’est juste. Place le signe − devant la fraction (ou au numérateur), pas au dénominateur.' };
    if ((e.numNeg ? 1 : 0) + (e.denNeg ? 1 : 0) + (e.devant ? 1 : 0) > 1) return { fini: false, msg: 'C’est juste. Simplifie les signes : deux signes − donnent +.' };
    if (Q.pgcd(e.n, e.d) > 1) return { fini: false, msg: 'C’est juste, mais la fraction n’est pas irréductible : simplifie-la encore.' };
    return { fini: true };
  }
  const F = (n, d) => X.m(C.fr(n, d));
  // diagnostic d'une ligne fausse (valeur v), en la comparant à la ligne précédente puis au calcul de départ
  function diagnostiquer(q, sources, a, v) {
    if (q.diag) { const m = q.diag(v); if (m) return m; }
    if (v.n !== 0 && Q.egal(v, Q.opp(q.valeur))) return 'Attention au signe : ta ligne est l’opposé du bon résultat. ' +
      (/^RE/.test(q.comp) ? 'Applique la règle des signes : même signe → positif, signes contraires → négatif.' : 'Vérifie chaque signe − de la ligne.');
    for (const mod of sources) {
      let S, juste;
      try { S = X.analyser(mod); juste = X.valeur(S); } catch (e) { continue; }
      // calculs fautifs (erreurs classiques)
      for (const nom in X.FAUTIFS) {
        try { const w = X.valeur(S, nom); if (!Q.egal(w, juste) && Q.egal(w, v)) return X.FAUTIFS[nom].msg; } catch (e) { /* calcul fautif impossible ici */ }
      }
      // priorités : calcul de gauche à droite, parenthèses oubliées
      try { const w = X.valeur(X.analyser(mod, { plat: true })); if (!Q.egal(w, juste) && Q.egal(w, v)) return 'Attention aux priorités : la multiplication et la division se calculent avant l’addition et la soustraction, même si elles sont écrites après.'; } catch (e) { /* rien */ }
      try { const w = X.valeur(X.analyser(mod, { sansPar: true })); if (!Q.egal(w, juste) && Q.egal(w, v)) return 'Les calculs entre parenthèses se font en premier : tu as calculé comme s’il n’y avait pas de parenthèses.'; } catch (e) { /* rien */ }
      // comparaison terme à terme (fraction transformée)
      const T1 = X.termes(S), T2 = X.termes(a);
      if (T1.length !== T2.length) continue;
      for (let i = 0; i < T1.length; i++) {
        const l1 = X.litteral(T1[i].x), l2 = X.litteral(T2[i].x);
        if (!l1 || !l2 || !l1.frac || !l2.frac) continue;
        const n1 = l1.n * T1[i].s, d1 = l1.d, n2 = l2.n * T2[i].s, d2 = l2.d;
        if (d1 <= 0 || d2 <= 0 || n1 * d2 === n2 * d1) continue;
        const f1 = F(n1, d1);
        if (n2 - n1 === d2 - d1) return 'Tu as ' + (n2 > n1 ? 'ajouté' : 'enlevé') + ' le même nombre au numérateur et au dénominateur de ' + f1 + ' : ça change sa valeur. Il faut multiplier (ou diviser) les deux par le même nombre.';
        if (d2 !== d1 && d2 % d1 === 0) {
          const k = d2 / d1;
          return n2 === n1 ? 'Tu as multiplié le dénominateur de ' + f1 + ' par ' + k + ' sans changer le numérateur : multiplie aussi le numérateur par ' + k + '.'
            : 'Tu as multiplié le dénominateur de ' + f1 + ' par ' + k + ' : multiplie aussi le numérateur par ' + k + ' (' + (n1 < 0 ? '(−' + (-n1) + ')' : n1) + ' × ' + k + ' = ' + (n1 * k < 0 ? '−' + (-n1 * k) : n1 * k) + ').';
        }
        if (n2 !== 0 && d1 % d2 === 0 && n1 % n2 === 0 && n1 / n2 !== d1 / d2 && n1 / n2 > 0) return 'Tu as divisé le numérateur par ' + (n1 / n2) + ' et le dénominateur par ' + (d1 / d2) + ' : il faut diviser les deux par le même nombre.';
        if (d2 === d1) return 'Tu as changé le numérateur de ' + f1 + ' sans changer son dénominateur.';
        if (n2 === n1) return 'Tu as changé le dénominateur de ' + f1 + ' sans changer son numérateur.';
        return F(n2, d2) + ' n’est pas égale à ' + f1 + '.';
      }
    }
    return 'Ta ligne n’est pas égale à la ligne précédente. Vérifie ton calcul, ou demande un indice.';
  }
  // vérifie une ligne : { type: 'format' | 'faux' | 'juste', msg, fini }
  function verifier(q, precedent, modele) {
    let a, v;
    try { a = X.analyser(modele); v = X.valeur(a); } catch (e) { return { type: 'format', msg: e.msg || 'Écriture incomplète.' }; }
    if (Q.egal(v, q.valeur)) { const f = forme(a, q); return { type: 'juste', fini: f.fini, msg: f.msg || '' }; }
    const sources = [];
    if (precedent) sources.push(precedent);
    if (q.ref) sources.push(X.lire(q.ref));
    return { type: 'faux', msg: diagnostiquer(q, sources, a, v) };
  }

  /* =====================================================================
     Séance
     ===================================================================== */
  const ligneHTML = (pre, html, cls) => '<div class="fra-l' + (cls ? ' ' + cls : '') + '"><span class="fra-pre">' + pre + '</span>' + html + '</div>';
  const solutionHTML = q => '<div class="fra-feuille-s">' + (q.affiche ? ligneHTML('', q.affiche, 'fra-l0') : ligneHTML(q.prefixe, X.m(q.depart), 'fra-l0')) +
    q.solution.map(l => ligneHTML('=', X.m(l))).join('') + '</div>';
  const RAISONS = { 'à travailler': 'à retravailler', fragile: 'à consolider', 'en cours': 'à continuer', nouvelle: 'nouvelle', 'révision': 'révision', choisie: '' };

  function seance(zone) {
    const demande = (/#comp=([A-Z0-9,]+)/.exec(location.hash) || [])[1];
    let plan, k, points, res;
    FRA.noteReglages = 'Les changements de compétences et de nombres s’appliquent à la prochaine séance.';
    const pave = () => !(FRA.reglages().pave === 'non' && matchMedia('(hover: hover) and (pointer: fine)').matches);

    function intro() {
      plan = FRA.planSeance(demande ? demande.split(',') : null);
      k = 0; points = 0; res = [];
      zone.innerHTML = '';
      const c = el('div', 'er-card');
      const auto = !demande && FRA.reglages().auto;
      c.appendChild(el('h3', 'fra-h3', 'Ta séance : ' + NB + ' questions'));
      c.appendChild(el('p', 'fra-petit', demande ? 'Les compétences demandées :' : auto ? 'Choisies automatiquement d’après ton suivi :' : 'Les compétences cochées dans tes réglages :'));
      const vus = [];
      const ul = el('ul', 'fra-plan');
      plan.forEach(p => {
        if (vus.indexOf(p.comp) >= 0) return;
        vus.push(p.comp);
        const n = plan.filter(x => x.comp === p.comp).length, r = RAISONS[p.raison];
        ul.appendChild(el('li', '', '<b>' + esc(C.R[p.comp].titre) + '</b> <span class="fra-petit">· ' + FRA.pluriel(n, 'question') + (r ? ' · ' + r : '') + '</span>'));
      });
      c.appendChild(ul);
      c.appendChild(el('div', 'cle', '<b class="cle-titre">Barème.</b> 2 points pour une question juste sans erreur, 1 point après une erreur, 0 si tu affiches la solution ou si tu fais montrer une décomposition. Le rappel, les indices et l’exemple sont gratuits. Note sur 20.'));
      c.appendChild(el('p', 'fra-petit', 'Écris ton calcul ligne par ligne, comme sur ta feuille : chaque ligne commence par « = ». Avec « Décomposer » et « Simplifier » (pavé), tu peux décomposer des nombres et barrer des facteurs communs sur la dernière ligne. ' + X.AIDE_CLAVIER));
      const r = el('div', 'er-actions');
      const go = bouton('btn-primary', 'Commencer →', () => question());
      r.appendChild(go);
      r.appendChild(bouton('btn-small', '⚙ Changer les compétences', FRA.ouvrirReglages));
      c.appendChild(r);
      zone.appendChild(c);
    }

    // difficulté : d'après le suivi, puis ajustée selon la question précédente de la même compétence
    function niveau(comp) {
      let n = FRA.niveauDe(comp);
      const avant = res.filter(x => x.comp === comp);
      if (avant.length && FRA.reglages().nombres === 'prog') {
        const der = avant[avant.length - 1];
        n = der.pts === 2 ? Math.min(3, der.niv + 1) : der.pts === 0 ? Math.max(1, der.niv - 1) : der.niv;
      }
      return n;
    }

    function question() {
      const p = plan[k], q = C.question(p.comp, niveau(p.comp)), comp = C.R[p.comp];
      FRA.questionEnCours = q;                     // question affichée (tests automatiques)
      let erreurs = 0, fini = false, precedent = q.ref ? X.lire(q.ref) : null, nInd = 0;
      zone.innerHTML = '';
      // en-tête : numéro, score, barre de progression
      const t = el('div', 'er-card fra-entete-q');
      t.innerHTML = '<span class="er-badge">SÉANCE · QUESTION ' + (k + 1) + '/' + NB + '</span><p class="fra-petit fra-score">Question ' + (k + 1) + '/' + NB + ' · Score : ' + points + ' pts</p>' +
        '<div class="progress-bar"><div class="progress-fill" style="width:' + (100 * k / NB) + '%"></div></div>';
      zone.appendChild(t);
      const c = el('div', 'er-card fra-q');
      const r = RAISONS[p.raison];
      c.appendChild(el('p', 'er-q-nom', esc(comp.titre) + (r ? ' <span class="fra-tag">' + r + '</span>' : '')));
      c.appendChild(el('p', 'er-consigne', q.consigne));
      // aides
      const barre = el('div', 'fra-aides');
      barre.setAttribute('role', 'group'); barre.setAttribute('aria-label', 'Aides');
      const zRap = el('div', 'fra-aide'), zInd = el('div', 'fra-aide'), zEx = el('div', 'fra-aide'), zSol = el('div', 'fra-aide');
      const bRap = bouton('btn-small', '📖 Rappel', () => {
        const oui = !zRap.firstChild;
        zRap.innerHTML = '';
        if (oui) { zRap.appendChild(FRA.blocRappel(q.comp)); FRA.versVue(zRap); }
        bRap.setAttribute('aria-expanded', oui);
      });
      bRap.setAttribute('aria-expanded', 'false');
      const bInd = bouton('btn-small', '💡 Indice', () => {
        if (nInd >= q.indices.length) return;
        const d = el('div', 'fra-indice', '<b>Indice ' + (nInd + 1) + '.</b> ' + q.indices[nInd]);
        zInd.appendChild(d);
        nInd++;
        majInd();
        FRA.versVue(d);
      });
      const majInd = () => {
        bInd.innerHTML = nInd >= q.indices.length ? '💡 Tous les indices sont affichés' : nInd ? '💡 Indice suivant (' + (nInd + 1) + '/' + q.indices.length + ')' : '💡 Indice';
        bInd.disabled = nInd >= q.indices.length;
      };
      const bEx = bouton('btn-small', '✎ Exemple', () => montrerExemple());
      function montrerExemple() {
        const e = C.question(q.comp, q.niv);
        zEx.innerHTML = '';
        const b = el('div', 'fra-rappel');
        b.innerHTML = '<p class="fra-rappel-t">Exemple avec d’autres nombres</p>' + (e.consigne !== q.consigne ? '<p>' + e.consigne + '</p>' : '') + solutionHTML(e);
        const r2 = el('div', 'fra-rangee');
        r2.appendChild(bouton('btn-small', '↻ Un autre exemple', montrerExemple));
        r2.appendChild(bouton('btn-small', 'Fermer', () => { zEx.innerHTML = ''; }));
        b.appendChild(r2);
        zEx.appendChild(b);
        FRA.versVue(b);
      }
      const bSol = bouton('btn-small', 'Afficher la solution', () => {
        if (fini) return;
        zSol.innerHTML = '';
        zSol.appendChild(el('div', 'callout', '<b>Réponse.</b> Une solution détaillée (0 point pour cette question) :' + solutionHTML(q)));
        terminer(0);
      });
      [bRap, bInd, bEx, bSol].forEach(b => barre.appendChild(b));
      c.appendChild(barre);
      c.appendChild(zRap); c.appendChild(zInd); c.appendChild(zEx);
      // la feuille : ligne de départ, lignes écrites, ligne en cours
      const feuille = el('div', 'fra-feuille');
      const l0 = el('div', 'fra-l fra-l0', q.affiche ? '<span class="fra-pre"></span>' + q.affiche : '<span class="fra-pre">' + esc(q.prefixe) + '</span>' + X.m(q.depart));
      feuille.appendChild(l0);
      const cour = el('div', 'fra-l fra-cour');
      cour.appendChild(el('span', 'fra-pre', '='));
      const zEd = el('div');
      cour.appendChild(zEd);
      const bVide = bouton('fra-vider', '✕', () => { ed.touche('vider'); if (matchMedia('(hover: hover)').matches) zEd.focus({ preventScroll: true }); }, 'Effacer la ligne');
      bVide.addEventListener('mousedown', e => e.preventDefault());   // la ligne garde le focus (clavier)
      bVide.title = 'Effacer la ligne';
      cour.appendChild(bVide);
      feuille.appendChild(cour);
      c.appendChild(feuille);
      // Décomposer / Simplifier quand le pavé est masqué (ordinateur avec clavier)
      const zModes = el('div', 'fra-modes');
      c.appendChild(zModes);
      const retour = el('div', 'fra-retour');
      retour.setAttribute('aria-live', 'polite');
      c.appendChild(retour);
      c.appendChild(zSol);
      const ed = new X.Editeur(zEd, { surValider: valider, surChange: () => { cour.classList.remove('fra-ko'); garderVisible(); } });
      // décomposer et simplifier sur la dernière ligne de la feuille (modules/simplifier.js)
      let aideDec = false;
      const sim = FRA.S.creer({
        message(t, type) {
          retour.innerHTML = t ? '<div class="callout-' + (type || 'accent') + ' fra-msg">' + t + '</div>' : '';
          if (t && type === 'danger') montrer(retour);
        },
        surMode(m) {
          c.querySelectorAll('[data-k="dec"], [data-k="sim"]').forEach(b => {
            b.classList.toggle('actif', b.dataset.k === m);
            b.setAttribute('aria-pressed', String(b.dataset.k === m));
          });
        },
        surAide() { aideDec = true; },
        montrer(n) { montrer(n); }
      });
      // touches du pavé : à la saisie de la décomposition (ou des restes) quand elle est ouverte, sinon à la ligne
      const routeur = { touche: k => { if (!sim.touche(k)) ed.touche(k); }, get zone() { return ed.zone; }, get actif() { return ed.actif; } };
      const modes = { dec: () => sim.basculer('dec'), sim: () => sim.basculer('sim') };
      const zPave = el('div', 'fra-pave-z');
      zPave.appendChild(X.pave(routeur, { modes }));
      zPave.hidden = !pave();
      c.appendChild(zPave);
      [['dec', 'Décomposer'], ['sim', 'Simplifier']].forEach(([k, lib]) => {
        const b = bouton('btn-small', lib, modes[k]);
        b.dataset.k = k;
        b.setAttribute('aria-pressed', 'false');
        b.addEventListener('mousedown', e => e.preventDefault());   // la ligne garde le focus (clavier)
        zModes.appendChild(b);
      });
      zModes.hidden = !zPave.hidden;
      if (!q.affiche) sim.attacher(l0, X.lire(q.depart));
      const act = el('div', 'er-actions fra-suite');
      c.appendChild(act);
      zone.appendChild(c);
      majInd();
      if (matchMedia('(hover: hover)').matches) zEd.focus({ preventScroll: true });
      FRA.surReglages(cle => { if (cle === 'pave' && !fini) { zPave.hidden = !pave(); zModes.hidden = !zPave.hidden; } });
      // début de la question : en-tête en haut de l'écran, puis la ligne à écrire au-dessus du pavé
      zone.firstChild.scrollIntoView({ block: 'start' });
      setTimeout(garderVisible, 30);

      // la ligne en cours ne doit jamais être cachée par le pavé (collé en bas de l'écran)
      function garderVisible() {
        if (!cour.parentNode) return;
        const r = cour.getBoundingClientRect(), bas = zPave.hidden ? innerHeight : zPave.getBoundingClientRect().top;
        if (r.bottom > bas || r.top < 60) montrer(cour);
      }

      // amène la ligne en cours à l'écran, au-dessus du pavé (collé en bas de l'écran)
      function montrer(n) {
        n.style.scrollMarginBottom = (zPave.hidden ? 16 : zPave.offsetHeight + 16) + 'px';
        FRA.versVue(n);
      }
      function valider() {
        if (fini) return;
        const modele = X.copie(ed.modele);
        const v = verifier(q, precedent, modele);
        if (v.type === 'format') {
          retour.innerHTML = '<div class="callout fra-msg">' + v.msg + '</div>';
          montrer(retour);
          return;
        }
        if (v.type === 'faux') {
          erreurs++;
          cour.classList.remove('er-secoue'); void cour.offsetWidth; cour.classList.add('er-secoue', 'fra-ko');
          retour.innerHTML = '<div class="callout-danger fra-msg"><b>Ce n’est pas ça.</b> ' + v.msg +
            (erreurs >= 2 ? '<br>Corrige ta ligne, ou affiche la solution (0 point pour cette question).' : '') + '</div>';
          montrer(retour);
          return;
        }
        // consigne qui exige de simplifier avant de calculer : résultat refusé (sans erreur comptée) tant que ce n'est pas fait
        if (v.fini && q.exige && !sim.simplifie()) {
          retour.innerHTML = '<div class="callout-accent fra-msg"><b>Ton résultat est juste, mais simplifie d’abord.</b> Cette question demande de simplifier avant de multiplier : touche « Simplifier », puis un nombre du numérateur et un nombre du dénominateur qui ont un diviseur commun, pour les barrer (« Décomposer » peut aider). Quand plus rien ne se simplifie, écris le résultat.</div>';
          montrer(retour);
          return;
        }
        // ligne juste : elle s'écrit sur la feuille
        const l = el('div', 'fra-l fra-juste', '<span class="fra-pre">=</span>' + X.html(modele) + '<span class="fra-coche" aria-label="ligne juste">✓</span>');
        feuille.insertBefore(l, cour);
        precedent = modele;
        if (!v.fini) {
          sim.attacher(l, modele);
          ed.vider();
          retour.innerHTML = '<div class="callout-accent fra-msg">' + v.msg + '</div>';
          montrer(zPave.hidden ? cour : retour);
          return;
        }
        cour.remove();
        const pts = aideDec ? 0 : erreurs ? 1 : 2;
        retour.innerHTML = '<div class="callout-success fra-msg"><b>' + (erreurs || aideDec ? 'C’est juste.' : 'Juste !') + '</b> ' + (aideDec ? '0 point (décomposition montrée).' : erreurs ? '1 point.' : '2 points.') + '</div>';
        const voir = bouton('btn-small', 'Voir une solution détaillée', () => { voir.replaceWith(el('div', '', solutionHTML(q))); });
        retour.firstChild.appendChild(el('br'));
        retour.firstChild.appendChild(voir);
        terminer(pts);
      }
      // fin de la question : points, suivi, bouton suivant
      function terminer(pts) {
        fini = true;
        ed.activer(false);
        sim.fin();
        zPave.hidden = true;
        zModes.hidden = true;
        if (cour.parentNode) cour.remove();
        bSol.disabled = true;
        points += pts;
        res.push({ comp: q.comp, niv: q.niv, pts });
        FRA.enregistrer([{ r: q.comp, ok: pts / 2 }], null);
        t.querySelector('.fra-score').textContent = 'Question ' + (k + 1) + '/' + NB + ' · Score : ' + points + ' pts';
        t.querySelector('.progress-fill').style.width = (100 * (k + 1) / NB) + '%';
        const dernier = k === NB - 1;
        const b = bouton('btn-primary', dernier ? 'Voir mon résultat →' : 'Question suivante →', () => {
          zone.style.pointerEvents = 'none';
          setTimeout(() => { zone.style.pointerEvents = ''; }, 350);
          k++;
          if (dernier) { fin(); FRA.versVue(zone.firstChild, 'start'); } else question();
        });
        b.disabled = true;
        setTimeout(() => { b.disabled = false; }, 450);
        act.appendChild(b);
        setTimeout(() => FRA.versVue(act), 30);
      }
    }

    function fin() {
      const note = Math.round(points / (2 * NB) * 20 * 2) / 2;
      SOM.marquer({ note });
      FRA.enregistrer([], note);
      zone.innerHTML = '';
      const c = el('div', 'er-card er-fin');
      const pct = Math.round(100 * points / (2 * NB));
      const msg = pct === 100 ? 'Sans faute ! Bravo.' : pct >= 70 ? 'Très bien : continue comme ça.' : pct >= 50 ? 'C’est bien parti : refais une séance pour consolider.' : 'Ces compétences demandent encore du travail : relis leurs fiches et refais une séance.';
      c.innerHTML = '<span class="er-badge">SÉANCE TERMINÉE</span><p class="er-trophee">' + msg + '</p><div class="er-score">' + FRA.virg(note) + '<small>/20</small></div><p class="er-score-pct">' + pct + ' % des points</p>';
      const g = el('div', 'er-recap');
      res.forEach((x, i) => g.appendChild(el('div', x.pts === 2 ? 'ok' : x.pts === 0 ? 'ko' : '', '<b>Q' + (i + 1) + '</b>' + x.pts + ' pt' + (x.pts > 1 ? 's' : ''))));
      c.appendChild(g);
      // bilan par compétence, avec son statut à jour
      const ul = el('ul', 'fra-bilan');
      const vus = [];
      res.forEach(x => {
        if (vus.indexOf(x.comp) >= 0) return;
        vus.push(x.comp);
        const l = res.filter(y => y.comp === x.comp), p = l.reduce((a, y) => a + y.pts, 0);
        const st = FRA.statut(x.comp);
        ul.appendChild(el('li', '', '<span class="fra-puce fra-s-' + st + '" aria-hidden="true"></span><span><b>' + esc(C.R[x.comp].titre) + '</b> · ' + p + '/' + (2 * l.length) + ' pts</span><span class="fra-pct">' + FRA.LIBS[st].toLowerCase() + '</span>'));
      });
      c.appendChild(ul);
      const a = el('div', 'er-actions');
      a.appendChild(bouton('btn-primary', 'Nouvelle séance →', () => { if (demande) history.replaceState(null, '', location.pathname); location.reload(); }));
      const s = el('a', 'btn-secondary', 'Mon suivi'); s.href = 'suivi.html'; a.appendChild(s);
      const f = el('a', 'btn-secondary', 'Fiches des compétences'); f.href = 'fiches.html'; a.appendChild(f);
      c.appendChild(a);
      zone.appendChild(c);
      if (pct === 100) FRA.confettis();
    }

    intro();
  }

  FRA.seance = seance;
  FRA.verifier = verifier;
})();
