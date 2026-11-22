/* ============================================================
   Calcul numérique — une question à l'écran (objet CN.Q)
   (partagé par la séance, le test de positionnement et la Découverte)
   ------------------------------------------------------------
   Carte de la question : énoncé, parties successives (a, b, c : chacune
   n'apparaît qu'après la réussite de la précédente), aides toujours
   disponibles (rappel de la compétence, indices successifs, exemple avec
   d'autres nombres, solution à 0 point), pavé collé en bas de l'écran
   (CN.N.pave) qui écrit dans le champ de la partie en cours, puis bilan
   et bouton suivant.
   Points : 2 juste sans erreur, 1 juste après une erreur, 0 solution affichée.
   Une erreur d'écriture (champ vide, exposant manquant) ne compte pas.
   API :
     CN.Q.monter(carte, q, opts) → { terminer(pts) }
        q    : question de CN.C.question(id, niv)
        opts : { aides: true | false, rappel: true | false, unEssai: false,
                 sansDefiler: false, surFin(pts, zoneActions, { aide, diff, justes }) }
                 sansDefiler : la première partie n'amène pas la page jusqu'à elle (haut de page gardé)
                 aides : false → ni aides ni solution (test) ; unEssai : une réponse fausse termine (0 point)
     CN.Q.verifier(partie, lecture) → { ok } | { format: message } | { faux: message }
     CN.Q.solutionHTML(q)
   ============================================================ */
(function () {
  'use strict';
  const CN = window.CN, N = CN.N;
  const el = CN.el, bouton = CN.bouton;
  const LETTRES = 'abcdef';
  const CALC = '<span class="calc-icone" role="img" aria-label="À calculer à la calculatrice" title="À calculer à la calculatrice"></span>';

  /* ---------- Vérification d'une partie « nombre » ---------- */
  function verifier(p, r) {
    if (r.erreur) return { format: r.erreur };
    if (p.entier && Math.round(r.v) !== r.v) return { format: 'Écris un nombre entier.' };
    if (N.egal(r.v, p.v, p.rel)) {
      if (p.forme === 'sci' && !r.sci) return { faux: 'La valeur est juste, mais ce n’est pas l’écriture scientifique : le nombre devant la puissance de 10 doit être compris entre 1 et 10 (1 ≤ a &lt; 10).' };
      if (p.forme === 'dec' && r.e !== null) return { faux: 'La valeur est juste, mais écris-la en écriture décimale, sans puissance de 10.' };
      if (p.cs && !(r.csMin <= p.cs && p.cs <= r.cs)) return { faux: 'La valeur est juste, mais elle est écrite avec ' + r.cs + ' chiffre' + (r.cs > 1 ? 's' : '') + ' significatif' + (r.cs > 1 ? 's' : '') + ' : il en faut ' + p.cs + (r.cs < p.cs ? '. Garde les zéros qui comptent (par exemple 3,0 ou 10,0).' : '.') };
      return { ok: true };
    }
    // arrondi juste, mais au mauvais nombre de chiffres significatifs
    if (p.cs && p.brut != null && r.cs !== p.cs && N.egal(r.v, N.arrondi(p.brut, r.cs))) {
      return { faux: 'Ton arrondi a ' + r.cs + ' chiffre' + (r.cs > 1 ? 's' : '') + ' significatif' + (r.cs > 1 ? 's' : '') + ' : il en faut ' + p.cs + '.' };
    }
    const m = p.diag ? p.diag(r) : null;
    return { faux: m || 'Ce n’est pas la bonne valeur.' };
  }

  // réponse attendue d'une partie, écrite (solution d'un exemple, réponse affichée au test)
  function attendue(p) {
    if (p.type === 'choix') return p.options.find(o => o.id === p.bonne).label;
    if (p.aff) return p.aff + (p.apres ? '&nbsp;' + p.apres : '');
    if (p.entier && p.sup) return '10<sup>' + N.ent(p.v) + '</sup>';
    if (p.entier) return N.ent(p.v);
    const d = N.decompose(p.v);
    const t = p.cs ? (p.forme === 'sci' || Math.abs(d.n) > 4 ? N.sci(p.v, p.cs) : N.txtCS(p.v, p.cs))
      : p.forme === 'sci' || Math.abs(d.n) > 6 ? N.sci(p.v) : N.nb(p.v);
    return t + (p.apres ? '&nbsp;' + p.apres : '');
  }
  const solutionHTML = q => '<div class="cn-sol-q">' + q.solution + '</div>';
  // texte d'une partie avant la réponse (sans le « 10 » d'un exposant à écrire, déjà dans la réponse)
  const texteQ = p => (p.sup ? p.q.replace(/\s*10$/, '') : p.q);

  /* ---------- Une question ---------- */
  function monter(carte, q, opts) {
    opts = opts || {};
    const aides = opts.aides !== false;
    let erreurs = 0, fini = false, nInd = 0, aide = false, k = 0;
    CN.questionEnCours = q;                         // question affichée (tests automatiques)
    carte.appendChild(el('div', 'er-consigne cn-enonce', q.enonce));
    // aides
    const barre = el('div', 'cn-aides');
    barre.setAttribute('role', 'group'); barre.setAttribute('aria-label', 'Aides');
    const zRap = el('div', 'cn-aide'), zInd = el('div', 'cn-aide'), zEx = el('div', 'cn-aide'), zSol = el('div', 'cn-aide');
    const bRap = bouton('btn-small', '📖 Rappel', () => {
      const oui = !zRap.firstChild;
      if (oui) aide = true;
      zRap.innerHTML = '';
      if (oui) { zRap.appendChild(CN.blocRappel(q.comp)); montrer(zRap); }
      bRap.setAttribute('aria-expanded', oui);
    });
    bRap.setAttribute('aria-expanded', 'false');
    const bInd = bouton('btn-small', '💡 Indice', () => {
      if (nInd >= q.indices.length) return;
      aide = true;
      const d = el('div', 'cn-indice', '<b>Indice ' + (nInd + 1) + '.</b> ' + q.indices[nInd]);
      zInd.appendChild(d);
      nInd++;
      majInd();
      montrer(d);
    });
    const majInd = () => {
      bInd.innerHTML = nInd >= q.indices.length ? '💡 Tous les indices sont affichés' : nInd ? '💡 Indice suivant (' + (nInd + 1) + '/' + q.indices.length + ')' : '💡 Indice';
      bInd.disabled = nInd >= q.indices.length;
    };
    // exemple : une autre question de la même compétence, avec d'autres nombres, corrigée
    const bEx = bouton('btn-small', '✎ Exemple', montrerExemple);
    function montrerExemple() {
      aide = true;
      let e = null;
      for (let i = 0; i < 8 && (!e || e.cle === q.cle); i++) e = CN.C.question(q.comp, q.diff);
      zEx.innerHTML = '';
      const b = el('div', 'cn-rappel');
      b.innerHTML = '<p class="cn-rappel-t">Exemple avec d’autres nombres</p><p>' + e.enonce + '</p>' +
        e.parties.map((p, i) => '<p>' + (e.parties.length > 1 ? '<b>' + LETTRES[i] + '.</b> ' : '') + texteQ(p) + ' <b>' + attendue(p) + '</b>' + (p.apres && p.sup ? '&nbsp;' + p.apres : '') + '</p>').join('') + solutionHTML(e);
      const r2 = el('div', 'cn-rangee');
      r2.appendChild(bouton('btn-small', '↻ Un autre exemple', montrerExemple));
      r2.appendChild(bouton('btn-small', 'Fermer', () => { zEx.innerHTML = ''; }));
      b.appendChild(r2);
      zEx.appendChild(b);
      montrer(b);
    }
    const bSol = bouton('btn-small', 'Afficher la solution', () => {
      if (fini) return;
      afficherSolution('<b>Réponse.</b> La correction (0 point pour cette question) :');
      terminer(0);
    });
    function afficherSolution(titre) {
      zSol.innerHTML = '';
      zSol.appendChild(el('div', 'callout', titre + '<p>' + q.parties.map((p, i) => (q.parties.length > 1 ? '<b>' + LETTRES[i] + '.</b> ' : '') + attendue(p)).join(' ; ') + '</p>' + solutionHTML(q)));
    }
    majInd();
    if (aides) {
      (opts.rappel === false ? [bInd, bEx, bSol] : [bRap, bInd, bEx, bSol]).forEach(b => barre.appendChild(b));
      carte.appendChild(barre);
      [zRap, zInd, zEx].forEach(z => carte.appendChild(z));
    }
    // les parties
    const zParts = el('div', 'cn-parties');
    carte.appendChild(zParts);
    const bilan = el('div', 'cn-retour');
    bilan.setAttribute('aria-live', 'polite');
    carte.appendChild(bilan);
    carte.appendChild(zSol);
    const act = el('div', 'er-actions cn-suite');
    carte.appendChild(act);
    // le pavé, collé en bas de l'écran, écrit dans le champ de la partie en cours
    const cible = { champ: null };
    const zPave = el('div', 'cn-pave-z');
    const pv = N.pave(cible);
    zPave.appendChild(pv);
    zPave.hidden = true;
    carte.appendChild(zPave);
    CN.surReglages(cle => { if (cle === 'pave' && !fini && cible.champ) zPave.hidden = !CN.pave(); });
    // un clic sur une aide ne retire pas le focus du champ : on continue à taper au clavier
    carte.addEventListener('mousedown', e => { if (e.target.closest('button') && e.target.closest('.cn-aides, .cn-aide')) e.preventDefault(); });

    // amène un élément à l'écran, au-dessus du pavé (collé en bas de l'écran)
    function montrer(n) {
      n.style.scrollMarginBottom = (zPave.hidden ? 16 : zPave.offsetHeight + 16) + 'px';
      CN.versVue(n);
    }

    function partie() {
      const p = q.parties[k];
      const d = el('div', 'cn-partie');
      const lettre = q.parties.length > 1 ? '<span class="cn-lettre">' + LETTRES[k] + '.</span> ' : '';
      const ret = el('div', 'cn-reponse');
      ret.setAttribute('aria-live', 'polite');
      let erreursP = 0;
      const faux = (msg, b) => {
        erreurs++; erreursP++;
        if (opts.unEssai) { ret.innerHTML = '<div class="callout-danger cn-msg"><b>Ce n’est pas ça.</b> La réponse : <b>' + attendue(p) + '</b>.</div>'; finir(false); return; }
        ret.innerHTML = '<div class="callout-danger cn-msg"><b>Ce n’est pas ça.</b> ' + msg + (erreurs >= 2 && aides ? '<br>Corrige ta réponse, ou affiche la solution (0 point pour cette question).' : '') + '</div>';
        if (b) { b.classList.remove('er-secoue'); void b.offsetWidth; b.classList.add('er-secoue'); }
        montrer(ret);
      };
      const finir = ok => {
        d.classList.add(ok ? 'cn-partie-ok' : 'cn-partie-ko');
        if (champ) champ.fin();
        d.querySelectorAll('.cn-choix button').forEach(b => { b.disabled = true; });
        if (ok) ret.innerHTML = '<p class="cn-juste">✓ ' + (erreursP ? 'C’est juste.' : 'Juste !') + '</p>';
        if (!ok) { terminer(0); return; }
        k++;
        if (k < q.parties.length) partie();
        else reussi();
      };
      let champ = null;
      if (p.type === 'nb') {
        // exposant seul (« 1 km = 10^□ m ») : le « 10 » de la question et une petite case en haut à droite
        const ligne = el('div', 'cn-ligne', lettre + (p.sup ? '<span class="cn-texte">' + texteQ(p) + '</span>' : '<span class="cn-texte">' + p.q + '</span>'));
        champ = new N.Champ({ entier: p.entier, label: p.sup ? 'Exposant de la puissance de 10' : 'Ta réponse', surValider: () => {
          const r = champ.lire(), v = verifier(p, r);
          if (v.format) { ret.innerHTML = '<div class="callout cn-msg">' + v.format + '</div>'; montrer(ret); return; }
          if (v.faux) { faux(v.faux, champ.el); return; }
          finir(true);
        }, surChange: () => { garderVisible(); } });
        if (p.sup) {
          champ.el.classList.add('cn-champ-sup');
          const pu = el('span', 'cn-puiss', '<span class="cn-puiss-10">10</span>');
          pu.appendChild(champ.el);
          ligne.appendChild(pu);
        } else ligne.appendChild(champ.el);
        if (p.apres) ligne.appendChild(el('span', 'cn-apres', p.apres));
        if (p.calc) ligne.insertAdjacentHTML('beforeend', CALC);
        // sans le pavé (ordinateur), un bouton Valider à côté du champ
        const bV = bouton('btn-primary cn-valider', 'Valider', () => champ.touche('valider'));
        bV.addEventListener('mousedown', e => e.preventDefault());
        d.appendChild(ligne);
        d.appendChild(bV);
        const majPave = () => { bV.hidden = CN.pave(); };
        majPave(); CN.surReglages(cle => { if (cle === 'pave') majPave(); });
        cible.champ = champ;
        pv.majChamp();
        zPave.hidden = !CN.pave();
        champ.el.addEventListener('focus', () => { cible.champ = champ; pv.majChamp(); });
      } else {
        cible.champ = null;
        zPave.hidden = true;
        d.appendChild(el('div', 'cn-ligne', lettre + '<span class="cn-texte">' + p.q + '</span>'));
        const g = el('div', 'cn-choix');
        g.setAttribute('role', 'group');
        p.options.forEach(o => {
          const b = bouton('btn-secondary', o.label, () => {
            if (fini || b.disabled) return;
            if (o.id === p.bonne) { b.classList.add('cn-bon'); finir(true); return; }
            b.classList.add('cn-mauvais');
            b.disabled = true;
            faux(p.indices[o.id] || 'Relis la question.', b);
          });
          g.appendChild(b);
        });
        d.appendChild(g);
      }
      d.appendChild(ret);
      zParts.appendChild(d);
      if (champ && matchMedia('(hover: hover)').matches) champ.el.focus({ preventScroll: true });
      // première partie d'une question qui ouvre la page (Découverte) : on reste en haut de la page
      if (k > 0 || !opts.sansDefiler) setTimeout(() => montrer(d), 30);
    }
    // le champ en cours ne doit jamais être caché par le pavé
    function garderVisible() {
      const c = cible.champ;
      if (!c || !c.el.isConnected) return;
      const rc = c.el.getBoundingClientRect(), bas = zPave.hidden ? innerHeight : zPave.getBoundingClientRect().top;
      if (rc.bottom > bas || rc.top < 60) montrer(c.el.closest('.cn-partie'));
    }
    function reussi() {
      const pts = erreurs ? 1 : 2;
      bilan.innerHTML = '';
      bilan.appendChild(el('div', 'callout callout-success cn-msg', (pts === 2 ? '<b>Juste !</b>' : '<b>C’est juste.</b>') + solutionHTML(q)));
      terminer(pts);
    }
    // fin de la question : le champ se fige, la page appelante enregistre et propose la suite
    function terminer(pts) {
      if (fini) return;
      fini = true;
      zParts.querySelectorAll('.cn-champ').forEach(x => x.classList.add('cn-fige'));
      zParts.querySelectorAll('button').forEach(b => { b.disabled = true; });
      zPave.hidden = true;
      cible.champ = null;
      bSol.disabled = true;
      if (pts === 0 && opts.unEssai) afficherSolution('<b>Correction.</b>');
      if (opts.surFin) opts.surFin(pts, act, { aide, diff: q.diff, justes: pts > 0 });
      setTimeout(() => montrer(act.firstChild ? act : bilan), 40);
    }
    partie();
    return { terminer, erreurs: () => erreurs };
  }

  CN.Q = { monter, verifier, solutionHTML, attendue, texteQ };
})();
