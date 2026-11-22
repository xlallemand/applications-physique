/* ============================================================
   Calcul numérique — séance de 5 questions et test de positionnement (CN.seance)
   (même déroulé que modules/seance.js de l'application Équations en physique)
   ------------------------------------------------------------
   Séance :
     - intro : thème (Tout, Puissances de 10, Écrire un résultat, Conversions ;
       mode automatique seulement), compétences de la séance avec leur raison,
       proposition du test de positionnement pour un thème jamais travaillé,
       barème, façon de répondre ;
     - plan de la séance (CN.planSeance : mode automatique dans le thème,
       compétences choisies, ou adresse seance.html#comp=CV1,CV2) ;
     - difficulté progressive d'après le suivi, ajustée à chaque question
       (+1 après 2 points, −1 après 0 point) : niveau 1 guidé en parties ;
     - points : 2 sans erreur, 1 après erreur, 0 solution affichée ;
       note sur 20 ; suivi enregistré à chaque question (CN.enregistrer).
   Test de positionnement (adresse seance.html#test=P, R ou C) :
     6 questions difficiles (niveau 3) du thème, sans aide, une seule réponse ;
     une compétence dont toutes les questions sont réussies devient acquise,
     avec ses prérequis (CN.marquerTest) ; rien n'est enregistré dans le suivi.
   Dépend de : cn.js, question.js, competences.js, conversions.js, nombre.js.
   API : CN.seance(zone)
   ============================================================ */
(function () {
  'use strict';
  const CN = window.CN, C = CN.C;
  const el = CN.el, bouton = CN.bouton;
  const NB = 5;
  // les questions de chaque test de positionnement
  const TESTS = { P: ['PU1', 'PU2', 'PU2', 'PU3', 'PU3', 'PU4'], R: ['ES2', 'ES3', 'ES4', 'CS1', 'CS2', 'CS3'], C: ['PR2', 'CV2', 'CV3', 'CV5', 'CV8', 'CV10'] };
  const NOM = th => (C.THEMES.find(t => t.id === th) || {}).nom;

  function entete(t, k, n, points, badge) {
    t.innerHTML = '<span class="er-badge">' + badge + ' · QUESTION ' + (k + 1) + '/' + n + '</span><p class="cn-petit cn-score">Question ' + (k + 1) + '/' + n + (points == null ? '' : ' · Score : ' + points + ' pts') + '</p>' +
      '<div class="progress-bar"><div class="progress-fill" style="width:' + (100 * k / n) + '%"></div></div>';
  }
  // bouton suivant : désactivé 450 ms, la zone ignore les appuis 350 ms (double appui)
  function suivant(zone, act, texte, fn) {
    const b = bouton('btn-primary', texte, () => {
      zone.style.pointerEvents = 'none';
      setTimeout(() => { zone.style.pointerEvents = ''; }, 350);
      fn();
      CN.versVue(zone.firstChild, 'start');
    });
    b.disabled = true;
    setTimeout(() => { b.disabled = false; }, 450);
    act.appendChild(b);
  }

  function seance(zone) {
    const demande = (/#comp=([A-Z0-9,]+)/.exec(location.hash) || [])[1];
    const testDemande = (/#test=([PRC])/.exec(location.hash) || [])[1];
    let plan, k, points, res;
    CN.noteReglages = 'Les changements de compétences s’appliquent à la prochaine séance.';

    /* ===================== Séance ===================== */
    function intro() {
      const auto = !demande && CN.reglages().auto;
      const theme = CN.reglages().theme;
      plan = CN.planSeance(demande ? demande.split(',') : null, theme);
      k = 0; points = 0; res = [];
      zone.innerHTML = '';
      const c = el('div', 'er-card');
      c.appendChild(el('h3', 'cn-h3', 'Ta séance : ' + NB + ' questions'));
      // thème (mode automatique)
      if (auto) {
        c.appendChild(el('p', 'cn-lab', 'Thème'));
        const ch = el('div', 'cn-chips cn-themes');
        ch.setAttribute('role', 'group'); ch.setAttribute('aria-label', 'Thème de la séance');
        CN.THEMES.forEach(([id, nom]) => {
          const b = bouton('', CN.esc(nom), () => { CN.regler('theme', id); intro(); });
          b.setAttribute('aria-pressed', id === theme);
          ch.appendChild(b);
        });
        c.appendChild(ch);
        // test de positionnement : thèmes jamais travaillés
        const nv = (theme === 'T' ? C.THEMES.map(t => t.id) : [theme]).filter(th => !CN.themeTravaille(th));
        if (nv.length) {
          const t = el('div', 'callout callout-accent cn-conseil cn-test-prop');
          t.innerHTML = '<b>Tu connais déjà ' + (nv.length > 1 ? 'certains de ces thèmes' : '« ' + NOM(nv[0]) + ' »') + ' ?</b> Fais le test de positionnement : 6 questions, environ 3 minutes, sans aide. Ce que tu réussis est compté comme acquis, et les séances passent à la suite.';
          const r = el('div', 'cn-rangee');
          nv.forEach(th => { const a = el('a', 'btn-small', 'Test : ' + CN.esc(NOM(th)) + ' →'); a.href = '#test=' + th; r.appendChild(a); });
          t.appendChild(r);
          c.appendChild(t);
        }
        if (CN.decouverteFaits().length === 0 && !CN.notes().length) {
          c.appendChild(el('div', 'callout cn-conseil', 'Tu pars de zéro ? La <a href="decouverte.html">Découverte</a> présente chaque notion avec un exemple et des questions guidées.'));
        }
      }
      c.appendChild(el('p', 'cn-petit', demande ? 'Les compétences demandées :' : auto ? 'Choisies automatiquement d’après ton suivi (thème : ' + CN.NOM_THEME[theme] + ') :' : 'Les compétences cochées dans tes réglages :'));
      const vus = [];
      const ul = el('ul', 'cn-plan');
      plan.forEach(p => {
        if (vus.indexOf(p.comp) >= 0) return;
        vus.push(p.comp);
        const n = plan.filter(x => x.comp === p.comp).length;
        ul.appendChild(el('li', '', '<b>' + C.R[p.comp].titre + '</b> <span class="cn-petit">· ' + CN.pluriel(n, 'question') + (p.raison && p.raison !== 'choisie' ? ' · ' + p.raison : '') + '</span>'));
      });
      c.appendChild(ul);
      c.appendChild(el('div', 'cle', '<b class="cle-titre">Barème.</b> 2 points pour une question réussie sans erreur, 1 point après une erreur, 0 si tu affiches la solution. Le rappel, les indices et l’exemple sont gratuits. Note sur 20.'));
      c.appendChild(el('p', 'cn-petit', 'Écris tes réponses avec le pavé : la touche ×10<sup>n</sup> passe à l’exposant de la puissance de 10 (pour 10<sup>−3</sup> seul, touche directement ×10<sup>n</sup>). Toute écriture juste d’un nombre est acceptée, sauf quand la question demande une écriture précise. Les premières questions d’une compétence sont guidées en plusieurs étapes.'));
      const r = el('div', 'er-actions');
      r.appendChild(bouton('btn-primary', 'Commencer →', () => question()));
      r.appendChild(bouton('btn-small', '⚙ Changer les compétences', CN.ouvrirReglages));
      c.appendChild(r);
      zone.appendChild(c);
    }

    // difficulté : d'après le suivi, puis ajustée selon la question précédente de la même compétence
    function niveau(comp) {
      let n = CN.niveauDe(comp);
      const avant = res.filter(x => x.comp === comp);
      if (avant.length) {
        const der = avant[avant.length - 1];
        n = der.pts === 2 ? Math.min(3, der.niv + 1) : der.pts === 0 ? Math.max(1, der.niv - 1) : der.niv;
      }
      return n;
    }
    // une question pas encore posée dans la séance
    function tirer(comp, niv, deja) {
      let q = null;
      for (let i = 0; i < 10 && (!q || deja.indexOf(q.cle) >= 0); i++) q = C.question(comp, niv);
      return q;
    }

    function question() {
      const p = plan[k], niv = niveau(p.comp);
      const q = tirer(p.comp, niv, res.map(x => x.cle));
      zone.innerHTML = '';
      const t = el('div', 'er-card cn-entete-q');
      entete(t, k, NB, points, 'SÉANCE');
      zone.appendChild(t);
      const c = el('div', 'er-card cn-q');
      c.appendChild(el('p', 'er-q-nom', C.R[p.comp].titre + (p.raison && p.raison !== 'choisie' ? ' <span class="cn-tag">' + p.raison + '</span>' : '') + ' <span class="cn-niv">niv. ' + niv + '</span>'));
      zone.appendChild(c);
      CN.Q.monter(c, q, {
        surFin: (pts, act, info) => {
          points += pts;
          res.push({ comp: p.comp, niv, pts, cle: q.cle });
          CN.enregistrer([{ r: p.comp, ok: pts / 2, diff: niv, aide: info.aide }], null);
          entete(t, k, NB, points, 'SÉANCE');
          t.querySelector('.progress-fill').style.width = (100 * (k + 1) / NB) + '%';
          const dernier = k === NB - 1;
          suivant(zone, act, dernier ? 'Voir mon résultat →' : 'Question suivante →', () => { k++; if (dernier) fin(); else question(); });
        }
      });
      zone.firstChild.scrollIntoView({ block: 'start' });
    }

    function fin() {
      const note = Math.round(points / (2 * NB) * 20 * 2) / 2;
      SOM.marquer({ note });
      CN.enregistrer([], note);
      zone.innerHTML = '';
      const c = el('div', 'er-card er-fin');
      const pct = Math.round(100 * points / (2 * NB));
      const msg = pct === 100 ? 'Sans faute ! Bravo.' : pct >= 70 ? 'Très bien : continue comme ça.' : pct >= 50 ? 'C’est bien parti : refais une séance pour consolider.' : 'Ces compétences demandent encore du travail : relis leurs fiches et refais une séance.';
      c.innerHTML = '<span class="er-badge">SÉANCE TERMINÉE</span><p class="er-trophee">' + msg + '</p><div class="er-score">' + CN.virg(note) + '<small>/20</small></div><p class="er-score-pct">' + pct + ' % des points</p>';
      const g = el('div', 'er-recap');
      res.forEach((x, i) => g.appendChild(el('div', x.pts === 2 ? 'ok' : x.pts === 0 ? 'ko' : '', '<b>Q' + (i + 1) + '</b>' + x.pts + ' pt' + (x.pts > 1 ? 's' : ''))));
      c.appendChild(g);
      // bilan par compétence, avec son statut à jour
      const ul = el('ul', 'cn-bilan');
      const vus = [];
      res.forEach(x => {
        if (vus.indexOf(x.comp) >= 0) return;
        vus.push(x.comp);
        const l = res.filter(y => y.comp === x.comp), p = l.reduce((a, y) => a + y.pts, 0);
        const st = CN.statut(x.comp);
        ul.appendChild(el('li', '', '<span class="cn-puce cn-s-' + st + '" aria-hidden="true"></span><span><b>' + C.R[x.comp].titre + '</b> · ' + p + '/' + (2 * l.length) + ' pts</span><span class="cn-pct">' + CN.LIBS[st].toLowerCase() + '</span>'));
      });
      c.appendChild(ul);
      // nouveaux succès de la séance (modules/mes-succes.js)
      const ns = CN.blocSucces ? CN.blocSucces(CN.nouveauxSucces) : null;
      if (ns) c.appendChild(ns);
      const a = el('div', 'er-actions');
      a.appendChild(bouton('btn-primary', 'Nouvelle séance →', () => { if (demande) history.replaceState(null, '', location.pathname); location.reload(); }));
      const s = el('a', 'btn-secondary', 'Mon suivi'); s.href = 'suivi.html'; a.appendChild(s);
      const d = el('a', 'btn-secondary', 'Défi chrono'); d.href = 'defi.html'; a.appendChild(d);
      const f = el('a', 'btn-secondary', 'Fiches des compétences'); f.href = 'fiches.html'; a.appendChild(f);
      c.appendChild(a);
      zone.appendChild(c);
      if (pct === 100) CN.confettis();
    }

    /* ===================== Test de positionnement ===================== */
    function testIntro(th) {
      const ent = document.querySelector('#entete');
      if (ent) {
        ent.querySelector('.er-badge').textContent = 'MODULE 2 · TEST DE POSITIONNEMENT';
        ent.querySelector('.er-titre').textContent = 'Test : ' + NOM(th);
        ent.querySelector('.er-contexte').innerHTML = 'Six questions difficiles, <b>sans aide</b>, une seule réponse par question. Ce que tu réussis est compté comme <b>acquis</b>.';
      }
      zone.innerHTML = '';
      const c = el('div', 'er-card');
      c.appendChild(el('h3', 'cn-h3', 'Test de positionnement : ' + NOM(th)));
      const ids = [...new Set(TESTS[th])];
      c.appendChild(el('p', 'cn-petit', 'Compétences testées :'));
      const ul = el('ul', 'cn-plan');
      ids.forEach(id => ul.appendChild(el('li', '', C.R[id].titre)));
      c.appendChild(ul);
      c.appendChild(el('div', 'cle', '<b class="cle-titre">Comment ça marche.</b> Une compétence réussie (et ce qu’il faut savoir avant elle) est comptée comme maîtrisée : les séances passent à la suite, et y reviennent en révision. Une erreur ne te pénalise pas : la compétence sera travaillée en séance. Le test ne compte pas dans tes notes.' + (th === 'C' ? ' La conversion vers ou depuis l’unité sans préfixe, compétence clé, se gagne seulement en séance.' : '')));
      if (CN.testFait(th)) c.appendChild(el('p', 'cn-petit', 'Tu as déjà fait ce test : le refaire met à jour les compétences acquises.'));
      const r = el('div', 'er-actions');
      r.appendChild(bouton('btn-primary', 'Commencer le test →', () => testQuestions(th)));
      const a = el('a', 'btn-small', 'Revenir à la séance'); a.href = 'seance.html';
      a.addEventListener('click', e => { e.preventDefault(); history.replaceState(null, '', location.pathname); location.reload(); });
      r.appendChild(a);
      c.appendChild(r);
      zone.appendChild(c);
    }
    function testQuestions(th) {
      const L = CN.N.melanger(TESTS[th]), R = [], deja = [];
      let i = 0;
      function suivante() {
        const comp = L[i], q = tirer(comp, 3, deja);
        deja.push(q.cle);
        zone.innerHTML = '';
        const t = el('div', 'er-card cn-entete-q');
        entete(t, i, L.length, null, 'TEST');
        zone.appendChild(t);
        const c = el('div', 'er-card cn-q');
        c.appendChild(el('p', 'er-q-nom', C.R[comp].titre));
        zone.appendChild(c);
        CN.Q.monter(c, q, { aides: false, unEssai: true, surFin: (pts, act) => {
          R.push({ comp, ok: pts > 0 });
          t.querySelector('.progress-fill').style.width = (100 * (i + 1) / L.length) + '%';
          const dernier = i === L.length - 1;
          suivant(zone, act, dernier ? 'Voir le résultat →' : 'Question suivante →', () => { i++; if (dernier) testFin(th, R); else suivante(); });
        } });
        zone.firstChild.scrollIntoView({ block: 'start' });
      }
      suivante();
    }
    function testFin(th, R) {
      const res = {};
      R.forEach(x => { res[x.comp] = (res[x.comp] !== false) && x.ok; });
      const nouveaux = CN.marquerTest(th, res);
      zone.innerHTML = '';
      const c = el('div', 'er-card er-fin');
      const j = R.filter(x => x.ok).length;
      c.innerHTML = '<span class="er-badge">TEST TERMINÉ</span><p class="er-trophee">' + (j === R.length ? 'Tout est juste : tu maîtrises déjà ce thème.' : j >= R.length / 2 ? 'De bonnes bases : les séances partiront de là.' : 'Les séances vont reprendre ce thème pas à pas.') + '</p><div class="er-score">' + j + '<small>/' + R.length + '</small></div>';
      const ul = el('ul', 'cn-bilan');
      Object.keys(res).forEach(id => ul.appendChild(el('li', '', '<span class="cn-puce cn-s-' + (res[id] ? 'm' : 'n') + '" aria-hidden="true"></span><span><b>' + C.R[id].titre + '</b></span><span class="cn-pct">' + (res[id] ? 'acquise' : 'à travailler en séance') + '</span>')));
      c.appendChild(ul);
      const autres = nouveaux.filter(id => !(id in res));
      if (autres.length) c.appendChild(el('p', 'cn-petit', 'Comptées aussi comme acquises (elles viennent avant) : ' + autres.map(id => CN.sansBalises(C.R[id].titre)).join(' ; ') + '.'));
      const a = el('div', 'er-actions');
      a.appendChild(bouton('btn-primary', 'Commencer une séance →', () => { CN.regler('theme', th); history.replaceState(null, '', location.pathname); location.reload(); }));
      const s = el('a', 'btn-secondary', 'Mon suivi'); s.href = 'suivi.html'; a.appendChild(s);
      c.appendChild(a);
      zone.appendChild(c);
      if (j === R.length) CN.confettis();
    }

    if (testDemande) testIntro(testDemande); else intro();
    // un lien vers un test (#test=…) ou une autre séance (#comp=…) dans la même page : on recharge
    addEventListener('hashchange', () => location.reload());
  }

  CN.seance = seance;
})();
