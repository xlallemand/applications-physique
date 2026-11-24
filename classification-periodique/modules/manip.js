/* ============================================================
   Module 2 : retrouver les liens (manipulation guidée sur un seul écran)
   CP.manipLiens(zone)
   Dix situations (pastilles dans un ordre fixe, accessibles dans n'importe quel ordre) :
     1 à 4  élément d'après la configuration, la classification (symboles) étant fournie :
            la carte se glisse dans sa case (ou toucher la carte, puis la case) ;
     5      configuration d'après la case : composer la configuration (étiquettes et − / +) ;
     6, 7   électrons de valence d'après la case ;
     8 à 10 ion d'après la position : toucher les cases une à une jusqu'à la dernière colonne
            (ou jusqu'au gaz noble de la ligne précédente, écrit à gauche), puis la formule.
   Diagnostics : ligne prise pour le nombre d'électrons de valence, colonne 3 au lieu de 13,
   couche externe mal repérée, électrons de valence comptés sur la dernière sous-couche seulement,
   ion de signe inversé. Après deux erreurs sur un pas : « Afficher la réponse ».
   Toutes les situations réussies (ou leur réponse affichée) → page marquée faite.
   ============================================================ */
(function () {
  'use strict';

  const MOINS = '−';
  const pl = (k, mot) => `${k} ${mot}${k > 1 ? 's' : ''}`;
  // « le phosphore », « l'oxygène »
  const le = Z => { const n = ATOME.element(Z).nom; return /^[aeéèêiouyh]/i.test(n) ? 'l\'' + n : 'le ' + n; };
  const SITUATIONS = [
    { type: 'placer', Z: 15 }, { type: 'placer', Z: 11 }, { type: 'placer', Z: 13 }, { type: 'placer', Z: 8 },
    { type: 'config', Z: 16 }, { type: 'valence', Z: 14 }, { type: 'valence', Z: 7 },
    { type: 'ion', Z: 8 }, { type: 'ion', Z: 13 }, { type: 'ion', Z: 19 },
  ];
  const TITRES = { placer: 'Élément d\'après la configuration', config: 'Configuration d\'après la case', valence: 'Électrons de valence d\'après la case', ion: 'Ion d\'après la position' };

  /* ---------- Diagnostics communs (aussi utilisés par la série du module 3) ---------- */
  // électrons de la dernière sous-couche seulement
  const derniere = Z => { const c = ATOME.config(Z); return c[c.length - 1]; };
  const extHTML = Z => {
    const c = ATOME.config(Z), n = ATOME.derniereCouche(c);
    return c.filter(t => ATOME.couche(t[0]) === n);
  };
  // la ligne donnée est fausse
  function diagLigne(Z, l) {
    const p = CP.position(Z), v = CP.valenceCase(Z), d = derniere(Z);
    if (l === v && l !== p.ligne) return `La ligne donne la couche externe (n = ${p.ligne}), pas le nombre d'électrons de valence.`;
    if (l === p.ligne - 1) return `La dernière couche qui a des électrons est n = ${p.ligne} (${d[0]}<sup>${d[1]}</sup>) : ligne ${p.ligne}.`;
    return `Le numéro de la ligne est celui de la couche externe : ici la dernière couche qui a des électrons est n = ${p.ligne} (${d[0]}<sup>${d[1]}</sup>).`;
  }
  // la colonne donnée est fausse (lignes justes)
  function diagColonne(Z, col) {
    const p = CP.position(Z), v = CP.valenceCase(Z), ext = extHTML(Z), d = derniere(Z);
    if (v >= 3 && col === v) return `Avec ${v} électrons de valence, l'élément est dans la colonne ${v + 10} : le tableau saute les 10 colonnes cachées.`;
    const vCol = col <= 2 ? col : col - 10;
    if (ext.length > 1 && vCol === d[1]) {
      return `Les électrons de valence sont ceux de toute la couche n = ${p.ligne} : ${ext.map(t => `${t[0]}<sup>${t[1]}</sup>`).join(' et ')}, soit ${ext.map(t => t[1]).join(' + ')} = ${v} → colonne ${p.col}.`;
    }
    if (col === p.ligne && p.ligne !== p.col) return `La colonne donne le nombre d'électrons de valence (${v}), pas la couche externe.`;
    return `Compte les électrons de la couche n = ${p.ligne} : ${v}. ${v <= 2 ? `${v} électron${v > 1 ? 's' : ''} de valence → colonne ${v}.` : `${v} électrons de valence → colonne ${v + 10} (${v}<sup>e</sup> case de la ligne).`}`;
  }
  // nombre d'électrons de valence faux
  function diagValence(Z, rep) {
    const p = CP.position(Z), v = CP.valenceCase(Z), ext = extHTML(Z), d = derniere(Z);
    if (rep === p.ligne && rep !== v) return `La ligne ${p.ligne} donne la couche externe (n = ${p.ligne}), pas le nombre d'électrons de valence. Lis la colonne.`;
    if (ext.length > 1 && rep === d[1]) return `${d[0]}<sup>${d[1]}</sup> seulement ? Les électrons de valence sont ceux de toute la couche externe : ${ext.map(t => `${t[0]}<sup>${t[1]}</sup>`).join(' ')}, soit ${ext.map(t => t[1]).join(' + ')} = ${v}.`;
    if (rep === p.col) return `Colonne ${p.col} : on retire les 10 colonnes cachées.`;
    return `Lis la colonne : colonnes 1 et 2 → 1 et 2 électrons de valence ; colonnes 13 à 18 → 3 à 8 (on retire les 10 colonnes cachées).`;
  }
  // formule d'ion fausse : q donné par l'élève
  function diagIon(Z, q) {
    const i = CP.ion(Z), e = ATOME.element(Z), v = CP.valenceCase(Z);
    if (q === -i.q) return i.sens === 'droite' ? 'Vers la droite, l\'atome gagne des électrons : la charge est négative.' : 'Vers la gauche, l\'atome perd des électrons : la charge est positive.';
    if (i.sens === 'droite' && q === v) return `${e.sym} a ${v} électrons de valence, mais il est plus simple d'en gagner ${i.n} (${pl(i.n, 'case')} vers la droite) que d'en perdre ${v}.`;
    if (i.sens === 'gauche' && q === -(8 - v)) return `Vers la droite, il faudrait gagner ${8 - v} électrons ; vers la gauche, ${pl(i.n, 'case')} suffi${i.n > 1 ? 'sent' : 't'} : ${e.sym} perd ${pl(i.n, 'électron')}.`;
    return `Compte les cases jusqu'à la dernière colonne : ${pl(i.n, 'case')} vers la ${i.sens}, donc ${pl(i.n, 'électron')} ${i.sens === 'droite' ? 'gagné' : 'perdu'}${i.n > 1 ? 's' : ''}.`;
  }

  function manipLiens(zone) {
    const st = { n: 0, faites: SITUATIONS.map(() => false), marque: false };
    let pas = null;          // pas en cours : { type, ... }

    const c = CP.cadre(zone, {
      badge: 'MODULE 2 · MANIPULATION',
      titre: 'Retrouver les liens',
      contexte: BULLE.info('Dix situations, dans l\'ordre que tu veux : <b>placer</b> un élément d\'après sa configuration, retrouver la <b>configuration</b> ou les <b>électrons de valence</b> d\'après la case, trouver l\'<b>ion</b> en comptant les cases.', 'À quoi sert cette page'),
      aria: 'Situation',
      peTel: '[data-a="peTel"]',
      onglets: [{ id: 'situation', nom: 'Situation', html: `
        <div class="cp-sit-tete"><div class="cp-defis-puces cp-sit-puces" role="tablist" aria-label="Situations">${SITUATIONS.map((s, i) => `<button type="button" role="tab" class="cp-puce" data-sit="${i}" aria-selected="false" aria-label="Situation ${i + 1}">${i + 1}</button>`).join('')}</div><span data-a="peTel"></span></div>
        <p class="cp-sit-num" data-a="num"></p>
        <div class="cp-sit-acquis" data-a="acquis"></div>
        <p class="cp-sit-consigne" data-a="consigne"></p>
        <div class="cp-sit-zone" data-a="zone"></div>
        <div class="cp-sit-retour" data-a="retour" aria-live="polite"></div>
        <div class="er-actions cp-sit-suite"><span class="cp-sit-aide" data-a="aide" hidden><button type="button" class="btn-small">Afficher la réponse</button></span><span data-a="suite"></span></div>
        <div class="cp-sit-revois">${CP.revois(['atome'])}</div>` }],
    });
    const $ = c.$;
    const T = CP.tableau(c.tableau, {
      contenu: 'vide',
      surToucher: (z, b) => { if (pas && pas.surCase) pas.surCase(z, b); },
      surFantome: l => { if (pas && pas.surFantome) pas.surFantome(l); },
    });
    zone.querySelectorAll('[data-sit]').forEach(b => { b.onclick = () => situation(+b.dataset.sit); });
    $('aide').querySelector('button').onclick = () => { if (pas && pas.montrer) { pas.vue = true; pas.montrer(); } };

    /* ----- Retours ----- */
    function retour(h, type) {
      const r = $('retour');
      if (!h) { r.innerHTML = ''; return; }
      const cls = type === 'refus' || type === 'ko' ? 'callout-danger' : type === 'ok' ? 'callout-success' : 'callout';
      r.innerHTML = `<div class="${cls} cp-sit-msg">${h}</div>`;
    }
    function erreur(h) {
      pas.erreurs++;
      retour(`<b class="er-ko">Ce n'est pas ça.</b> ${h}${pas.erreurs >= 2 ? '<br><span class="er-petit">Corrige ta réponse, ou affiche la réponse.</span>' : ''}`, 'ko');
      if (pas.erreurs >= 2) $('aide').hidden = false;
    }
    function refus(h) { retour(h, 'refus'); }
    // pas réussi : résumé dans les acquis, puis le pas suivant (ou la fin de la situation)
    function reussi(resume, explication) {
      const vue = pas.vue;
      $('aide').hidden = true;
      $('acquis').insertAdjacentHTML('beforeend', `<p>${vue ? '→' : '✓'} ${resume}</p>`);
      const suite = pas.suite;
      pas = null;
      if (suite) {
        retour(`<b class="${vue ? '' : 'er-ok'}">${vue ? 'Réponse.' : 'Juste !'}</b> ${explication || ''}`, vue ? 'info' : 'ok');
        suite();
      } else finSituation(vue, explication);
    }

    /* ----- Une situation ----- */
    function situation(i) {
      st.n = i;
      const s = SITUATIONS[i];
      if (window.DragDrop) DragDrop.cleanupGhosts();
      zone.querySelectorAll('[data-sit]').forEach((b, k) => {
        b.setAttribute('aria-selected', k === i ? 'true' : 'false');
        b.classList.toggle('cp-fait', st.faites[k]);
        b.setAttribute('aria-label', `Situation ${k + 1}${st.faites[k] ? ', réussie' : ''}`);
      });
      $('num').innerHTML = `Situation ${i + 1} / ${SITUATIONS.length} · <b>${TITRES[s.type]}</b>`;
      $('acquis').innerHTML = '';
      retour('');
      $('aide').hidden = true;
      $('suite').innerHTML = `<button type="button" class="btn-small" data-a="passer">${i < SITUATIONS.length - 1 ? 'Situation suivante →' : 'Revenir à la situation 1'}</button>`;
      $('passer').onclick = () => situation((i + 1) % SITUATIONS.length);
      T.choisir(null); T.cible(null); T.effacerFleches(); T.fantomes(false); T.familles([]);
      ({ placer: sitPlacer, config: sitConfig, valence: sitValence, ion: sitIon })[s.type](s.Z);
    }
    function finSituation(vue, explication) {
      st.faites[st.n] = true;
      const b = zone.querySelector(`[data-sit="${st.n}"]`);
      b.classList.add('cp-fait');
      b.setAttribute('aria-label', `Situation ${st.n + 1}, réussie`);
      $('consigne').innerHTML = '';
      $('zone').innerHTML = '';
      const tout = st.faites.every(Boolean);
      retour(`<b class="${vue ? '' : 'er-ok'}">${vue ? 'Réponse.' : 'Juste !'}</b> ${explication || ''}${tout ? '<br><b>Toutes les situations sont faites.</b>' : ''}`, vue ? 'info' : 'ok');
      const prochaine = st.faites.findIndex((f, k) => !f && k > st.n), autre = st.faites.indexOf(false);
      const k = prochaine >= 0 ? prochaine : autre;
      $('suite').innerHTML = k >= 0 ? '<button type="button" class="btn-primary" data-a="passer">Situation suivante →</button>'
        : '<a class="btn-primary" style="text-decoration:none" href="module_3_questions.html">Module 3 : défis →</a>';
      if (k >= 0) $('passer').onclick = () => situation(k);
      if (tout && !st.marque) { st.marque = true; SOM.marquer({ fait: true }); }
    }
    function nouveauPas(o) { pas = Object.assign({ erreurs: 0, vue: false }, o); $('aide').hidden = true; }

    /* ----- 1 à 4 : élément d'après la configuration (classification fournie) ----- */
    function sitPlacer(Z) {
      T.contenu('symboles');
      const e = ATOME.element(Z), p = CP.position(Z);
      $('consigne').innerHTML = 'Quel est l\'élément qui a cette configuration électronique ? Glisse la carte sur sa case de la classification (ou touche la carte, puis la case).';
      $('zone').innerHTML = `<button type="button" class="cp-carte" aria-label="Carte : ${ATOME.configTexte(Z, ' ')}">${ATOME.configHTML(Z)}</button>`;
      const carte = $('zone').querySelector('.cp-carte');
      let prise = false;
      const prendre = on => { prise = on; carte.classList.toggle('cp-carte-prise', on); };
      function poser(z) {
        if (!pas || pas.type !== 'placer') return;
        prendre(false);
        const q = CP.position(z);
        if (z === Z) {
          T.ecrire(Z, `<b class="cp-sym">${e.sym}</b><span class="cp-val">${CP.valHTML(Z)}</span>`);
          T.choisir(Z);
          reussi(`${e.sym} : ligne ${p.ligne}, colonne ${p.col}`, `Couche externe n = ${p.ligne} → <b>ligne ${p.ligne}</b> ; ${pl(CP.valenceCase(Z), 'électron')} de valence → <b>colonne ${p.col}</b> : c'est ${le(Z)}, <b>${e.sym}</b>.`);
          return;
        }
        erreur(q.ligne !== p.ligne ? diagLigne(Z, q.ligne) : diagColonne(Z, q.col));
      }
      nouveauPas({
        type: 'placer',
        surCase: z => poser(z),
        montrer: () => poser(Z),
      });
      if (window.DragDrop) {
        DragDrop.enable(carte, {
          zoneSelector: '.cp-c',
          dragOverClass: 'cp-survol',
          onDrop(item, z, ev) {
            if (z) { poser(+z.dataset.z); return; }
            // simple appui (relâché sur la carte) : la carte est prise, il reste à toucher la case
            const r = carte.getBoundingClientRect();
            if (ev && ev.clientX >= r.left && ev.clientX <= r.right && ev.clientY >= r.top && ev.clientY <= r.bottom) {
              prendre(!prise);
              if (prise) retour('Touche maintenant la case où va la carte.', 'info');
            }
          },
        });
      } else carte.onclick = () => prendre(!prise);
    }
    /* ----- 5 : configuration d'après la case ----- */
    function sitConfig(Z) {
      T.contenu('symboles');
      T.cible(Z);
      const p = CP.position(Z), v = CP.valenceCase(Z), e = ATOME.element(Z);
      $('consigne').innerHTML = `Écris la configuration électronique de l'élément de la case surlignée (${e.sym}).`;
      $('zone').innerHTML = '<div data-a="comp"></div><div class="er-actions"><button type="button" class="btn-primary" data-a="ok">Valider</button></div>';
      const comp = ATOME.composeur($('comp'), { aria: 'Ta configuration électronique', onChange: () => { if (pas && !pas.vue) retour(''); } });
      function valider() {
        if (!pas) return;
        const s = comp.valeur();
        const r = ATOME.verifierConfig(s, Z, { texteTotal: () => null });
        if (r.code && r.code !== 'total') { if (r.code === 'vide') { retour(r.diag, 'info'); return; } erreur(r.diag); return; }
        const n = ATOME.derniereCouche(s), val = ATOME.valence(s);
        if (n !== p.ligne) { erreur(`La case est dans la ligne ${p.ligne} : la couche externe est n = ${p.ligne}. Ta configuration finit par la couche n = ${n}.`); return; }
        if (val !== v) { erreur(`La case est dans la colonne ${p.col} : ${pl(v, 'électron')} de valence${p.col > 2 ? ` (${p.col} ${MOINS} 10)` : ''}. Ta couche n = ${n} en contient ${val}.`); return; }
        if (r.code) { erreur(r.diag); return; }
        comp.bloquer(true);
        $('ok').disabled = true;
        reussi(`Configuration : ${ATOME.configHTML(Z)}`, `Ligne ${p.ligne} → couche externe n = ${p.ligne} ; colonne ${p.col} → ${pl(v, 'électron')} de valence : ${ATOME.configHTML(Z, { entourer: true })}.`);
      }
      $('ok').onclick = valider;
      nouveauPas({
        type: 'config',
        montrer: () => { comp.fixer(ATOME.config(Z)); comp.bloquer(true); $('ok').disabled = true; reussi(`Configuration : ${ATOME.configHTML(Z)}`, `${ATOME.configHTML(Z, { entourer: true })} : couche externe n = ${p.ligne}, ${pl(v, 'électron')} de valence.`); },
      });
    }

    /* ----- 6 et 7 : électrons de valence d'après la case ----- */
    function sitValence(Z) {
      T.contenu('symboles');
      T.cible(Z);
      const p = CP.position(Z), v = CP.valenceCase(Z), e = ATOME.element(Z);
      $('consigne').innerHTML = `Combien d'électrons de valence a l'élément de la case surlignée (${e.sym}) ?`;
      $('zone').innerHTML = `<div class="cp-nb" role="group" aria-label="Nombre d'électrons de valence">${[1, 2, 3, 4, 5, 6, 7, 8].map(k => `<button type="button" class="btn-secondary" data-k="${k}">${k}</button>`).join('')}</div>`;
      const expl = `Colonne ${p.col}${p.col > 2 ? ` → ${p.col} ${MOINS} 10` : ''} = <b>${v}</b> électrons de valence (${ATOME.configHTML(Z, { entourer: true })}).`;
      nouveauPas({
        type: 'valence',
        montrer: () => { $('zone').querySelectorAll('[data-k]').forEach(b => { b.disabled = true; if (+b.dataset.k === v) b.classList.add('juste'); }); reussi(`${v} électrons de valence`, expl); },
      });
      $('zone').querySelectorAll('[data-k]').forEach(b => {
        b.onclick = () => {
          if (!pas) return;
          const k = +b.dataset.k;
          if (k === v) { b.classList.add('juste'); $('zone').querySelectorAll('[data-k]').forEach(x => { x.disabled = true; }); reussi(`${v} électrons de valence`, expl); return; }
          b.classList.add('faux'); b.disabled = true;
          erreur(diagValence(Z, k));
        };
      });
    }

    /* ----- 8 à 10 : ion d'après la position ----- */
    function sitIon(Z) {
      T.contenu('symboles');
      T.cible(Z);
      T.fantomes(true, true);
      const i = CP.ion(Z), e = ATOME.element(Z), p = CP.position(Z);
      const chemin = [{ z: Z }];
      let sens = null;
      $('consigne').innerHTML = `Touche les cases une à une, depuis ${e.sym}, jusqu'au gaz noble le plus proche (dernière colonne).`;
      $('zone').innerHTML = `<p class="cp-sauts" data-a="sauts" aria-live="polite"></p><div class="er-actions"><button type="button" class="btn-small" data-a="effacer">↺ Effacer les sauts</button></div>`;
      const dessiner = () => {
        T.arcs(chemin.length > 1 ? chemin : null, { sens: sens || 'droite' });
        T.fantomes(true, true);
        $('sauts').innerHTML = chemin.length > 1 ? `${pl(chemin.length - 1, 'case')} vers la ${sens}` : 'Aucun saut pour l\'instant.';
      };
      $('effacer').onclick = () => { chemin.length = 1; sens = null; dessiner(); retour(''); };
      // la case voisine dans un sens donné (ou le gaz noble écrit à gauche de la ligne)
      function voisin(t, s) {
        if (t.fantome) return null;
        const q = CP.position(t.z);
        if (s === 'droite') return q.rang < 8 ? { z: CP.aLaPlace(q.ligne, CP.COLS[q.rang]) } : null;
        return q.rang > 1 ? { z: CP.aLaPlace(q.ligne, CP.COLS[q.rang - 2]) } : { fantome: q.ligne };
      }
      const pareil = (a, b) => !!a && !!b && (a.z ? a.z === b.z : a.fantome === b.fantome);
      function toucher(t) {
        if (!pas || pas.type !== 'chemin') return;
        const der = chemin[chemin.length - 1];
        const d = voisin(der, 'droite'), g = voisin(der, 'gauche');
        let s = pareil(t, d) ? 'droite' : pareil(t, g) ? 'gauche' : null;
        if (!s) {
          if (t.z === der.z) return;
          refus(`Une case à la fois : touche une case voisine de ${der.z ? ATOME.element(der.z).sym : 'la précédente'}.`);
          return;
        }
        if (sens && s !== sens) { refus(`Continue dans le même sens (vers la ${sens}) jusqu'au gaz noble.`); return; }
        if (!sens && s !== i.sens) {
          refus(`Le gaz noble le plus proche est vers la ${i.sens} (${pl(i.n, 'case')}) ; vers la ${s}, il faudrait ${pl(8 - i.n, 'case')}.`);
          return;
        }
        sens = s;
        chemin.push(t);
        retour('');
        dessiner();
        if (chemin.length - 1 === i.n) {
          reussi(`${pl(i.n, 'case')} vers la ${i.sens}`, `${pl(i.n, 'case')} vers la ${i.sens} : ${e.sym} ${i.sens === 'droite' ? 'gagne' : 'perd'} ${pl(i.n, 'électron')}.`);
        }
      }
      nouveauPas({
        type: 'chemin',
        surCase: z => toucher({ z }),
        surFantome: l => toucher({ fantome: l }),
        montrer: () => { chemin.length = 1; chemin.push(...i.chemin); sens = i.sens; dessiner(); reussi(`${pl(i.n, 'case')} vers la ${i.sens}`, `${pl(i.n, 'case')} vers la ${i.sens} : ${e.sym} ${i.sens === 'droite' ? 'gagne' : 'perd'} ${pl(i.n, 'électron')}.`); },
        suite: () => pasFormule(Z),
      });
      dessiner();
    }
    // formule de l'ion : quatre formules (erreurs classiques)
    function pasFormule(Z) {
      const i = CP.ion(Z), e = ATOME.element(Z), v = CP.valenceCase(Z), gaz = ATOME.element(i.gaz);
      const qs = [i.q, -i.q, i.sens === 'droite' ? v : -(8 - v), i.q > 0 ? i.q + 1 : i.q - 1];
      const uniques = qs.filter((q, k) => q && qs.indexOf(q) === k);
      while (uniques.length < 4) { const q = i.q > 0 ? uniques[uniques.length - 1] + 1 : uniques[uniques.length - 1] - 1; if (uniques.indexOf(q) < 0) uniques.push(q); }
      $('consigne').innerHTML = 'Quelle est la formule de l\'ion formé ?';
      $('zone').innerHTML = `<div class="ph-choix cp-choix-sym">${CP.melanger(uniques).map(q => `<button type="button" class="btn-secondary" data-q="${q}">${ATOME.formuleIon(e.sym, q)}</button>`).join('')}</div>`;
      const nomI = CP.nomIon(Z);
      const expl = `${ATOME.formuleIon(e.sym, i.q)}${nomI ? ` (${nomI})` : ''} : ${pl(i.n, 'électron')} ${i.sens === 'droite' ? 'gagné' : 'perdu'}${i.n > 1 ? 's' : ''}, même configuration que ${gaz.sym}.`;
      nouveauPas({
        type: 'formule',
        montrer: () => { $('zone').querySelectorAll('[data-q]').forEach(b => { b.disabled = true; if (+b.dataset.q === i.q) b.classList.add('juste'); }); reussi(`Ion ${ATOME.formuleIon(e.sym, i.q)}`, expl); },
      });
      $('zone').querySelectorAll('[data-q]').forEach(b => {
        b.onclick = () => {
          if (!pas) return;
          const q = +b.dataset.q;
          if (q === i.q) { b.classList.add('juste'); $('zone').querySelectorAll('[data-q]').forEach(x => { x.disabled = true; }); reussi(`Ion ${ATOME.formuleIon(e.sym, i.q)}`, expl); return; }
          b.classList.add('faux'); b.disabled = true;
          erreur(diagIon(Z, q));
        };
      });
    }

    situation(0);
    CP.manipEnCours = { st, T, cadre: c, situation, pas: () => pas };          // utile pour vérifier l'application
    return CP.manipEnCours;
  }

  Object.assign(CP, { manipLiens, SITUATIONS, diagLigne, diagColonne, diagValence, diagIon });
})();
