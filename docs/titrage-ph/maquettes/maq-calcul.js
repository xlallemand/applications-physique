/* ============================================================
   Maquettes : outil de calcul « formule à choisir, valeurs à placer »
   (modules 3b et 4 ; sera dans titrage-ph/modules/tph.js)

   TPHM.calcul(zone, {
     mode: 'cartes' | 'ligne',     une grandeur à la fois (cartes de formules, puis cases) ;
                                    ou toutes les grandeurs en lignes, formule et valeurs sur la même ligne
     valeurs: [{ id, html, sym, val, v }],                 étiquettes de départ : html (étiquette), sym (symbole, pour les
                                                           diagnostics), val (valeur et unité, écrite dans la case), v (nombre)
     grandeurs: [{ id, nom, formules: [{ html, juste, diag, cases: [ids], gabarit(cases) }],
                   calc(vals) → nombre, resultat(x) → html (avec unité), etiquette(x) → html,
                   diagCase(attendu, pose) → diag | null, solution(vals, x) → html, apres(x, zone) }],
     fini(resultats),
   }) → { remplir() }
   Une étiquette se place en la touchant puis en touchant la case, ou en la glissant ;
   dès que les cases sont remplies, le calcul se fait tout seul ; le résultat devient une étiquette.
   ============================================================ */
(function () {
  'use strict';
  const NB = ' ';
  const CALC = '<span class="calc-icone" role="img" aria-label="À calculer à la calculatrice" title="À calculer à la calculatrice"></span>';

  // nombre avec cs chiffres significatifs, à la française, en écriture scientifique si besoin
  function cs(x, n) {
    if (!isFinite(x)) return '';
    if (x === 0) return '0';
    const e = Math.floor(Math.log10(Math.abs(x)));
    if (e < -1 || e >= 4) {
      const m = x / Math.pow(10, e);
      return `${TITRAGE.outils.fmt(+m.toFixed(n - 1), n - 1)} × 10<sup>${String(e).replace('-', '−')}</sup>`;
    }
    const dec = Math.max(0, n - 1 - e);
    return TITRAGE.outils.fmt(+x.toFixed(dec), dec);
  }

  function calcul(zone, o) {
    o = Object.assign({ mode: 'cartes' }, o || {});
    const valeurs = {};
    o.valeurs.forEach(v => { valeurs[v.id] = v; });
    const res = {};
    let k = 0;
    zone.innerHTML = `<div class="tph-calc tph-calc-${o.mode}">
        <div class="tph-chaine" data-r="chaine"></div>
        <div data-r="etape"></div>
        <div class="tph-reserve"><p class="tph-reserve-t">Valeurs à placer</p><div class="tph-etiquettes" data-r="reserve"></div></div>
        <div data-r="retour"></div>
      </div>`;
    const R = n => zone.querySelector(`[data-r="${n}"]`);
    const pl = TPHM.placeur({
      etiquettes: o.valeurs.map(v => ({ id: v.id, html: v.html })), reserve: R('reserve'), selecteurCible: '.tph-case', racine: zone, copie: true,
      poser: (id, c) => { c.classList.add('pleine'); c.classList.remove('ko'); c.innerHTML = `<span>${valeurs[id].val || valeurs[id].html}</span>`; verifierCases(); },
      retirer: c => { c.classList.remove('pleine', 'ko'); c.innerHTML = '<span>?</span>'; },
    });

    // lignes de la chaîne de calcul (mode « ligne » : toutes les grandeurs ; mode « cartes » : les grandeurs faites)
    function chaine() {
      const ch = R('chaine');
      if (o.mode === 'ligne') {
        ch.innerHTML = o.grandeurs.map((g, i) => `<div class="tph-chaine-l ${i < k ? '' : i === k ? 'ici' : 'avenir'}" data-g="${i}">
          <span class="tph-chaine-g"><span>${g.nom}</span></span><div class="tph-calc-l" data-r="l${i}">${i < k ? ligneFaite(g) : i === k ? '' : '<span class="tph-petit">à calculer ensuite</span>'}</div></div>`).join('');
      } else ch.innerHTML = o.grandeurs.slice(0, k).map(g => `<p class="tph-resume">✓ ${g.nom} = <span class="tph-res">${g.resultat(res[g.id])}</span></p>`).join('');   // une ligne courte par grandeur faite
    }
    const ligneFaite = g => `<span>${g.nom} =</span> ${g.formules.find(f => f.juste).gabarit(g.formules.find(f => f.juste).cases.map(c => valeurs[c].val || valeurs[c].html))} = <span class="tph-res">${g.resultat(res[g.id])}</span>`;

    let courante = null, formule = null, erreurs = 0;
    function etape() {
      chaine();
      const z = o.mode === 'ligne' ? R('l' + k) : R('etape');
      if (o.mode !== 'ligne') R('etape').innerHTML = '';
      if (k >= o.grandeurs.length) { R('etape').innerHTML = ''; o.fini && o.fini(res); return; }
      const g = courante = o.grandeurs[k];
      formule = null; erreurs = 0;
      const cartes = g.formules.map((f, i) => ({ f, i })).sort(() => Math.random() - 0.5);
      z.innerHTML = `${o.mode === 'ligne' ? '' : `<p class="tph-etape-t"><span class="tph-num">${k + 1}</span>Choisis la formule de ${g.nom}, puis place les valeurs.</p>`}
        <div class="tph-formules" data-r="cartes">${cartes.map(c => `<button type="button" class="tph-formule" data-f="${c.i}"><span>${g.nom} = ${c.f.html}</span></button>`).join('')}</div>`;
      z.querySelector('[data-r="cartes"]').addEventListener('click', e => {
        const b = e.target.closest('[data-f]');
        if (!b || formule) return;
        const f = g.formules[+b.dataset.f];
        if (!f.juste) { erreurs++; b.classList.add('ko'); TPHM.retour(R('retour'), false, ' ' + f.diag); return; }
        formule = f;
        R('retour').innerHTML = '';
        z.querySelector('[data-r="cartes"]').outerHTML = `<div class="tph-calc-l"><span>${g.nom} =</span> ${f.gabarit(f.cases.map((c, i) => `<button type="button" class="tph-case" data-c="${i}"><span>?</span></button>`))}<span data-r="res"></span></div>`;
        TPHM.defiler(R('reserve'));
      });
      TPHM.defiler(z);
    }
    function verifierCases() {
      const cs_ = [...zone.querySelectorAll('.tph-case')];
      if (!formule || cs_.some(c => !c.dataset.pose)) return;
      let diag = null;
      cs_.forEach((c, i) => {
        const att = formule.cases[i], pose = c.dataset.pose;
        if (att === pose) { c.classList.add('ok'); c.classList.remove('pleine'); }
        else { c.classList.add('ko'); if (!diag) diag = (courante.diagCase && courante.diagCase(att, pose)) || `Ici, il faut ${valeurs[att].sym || valeurs[att].html}.`; }
      });
      if (diag) { erreurs++; TPHM.retour(R('retour'), false, ' ' + diag); return; }
      // calcul automatique
      const vals = formule.cases.map(c => valeurs[c].v);
      const x = courante.calc(vals);
      res[courante.id] = x;
      const zr = zone.querySelector('[data-r="res"]');
      zr.innerHTML = ` = <span class="tph-res">${courante.resultat(x)}</span> ${CALC}`;
      TPHM.retour(R('retour'), erreurs ? 'apres' : true, courante.solution ? ' ' + courante.solution(vals, x) : '');
      // le résultat devient une étiquette pour la suite
      if (courante.etiquette) {
        const e = { id: courante.id, html: courante.etiquette(x), sym: courante.nom, val: courante.resultat(x), v: x };
        valeurs[e.id] = e;
        pl.ajouter(e);
      }
      const suite = () => { k++; etape(); };
      if (courante.apres) courante.apres(x, R('retour'), suite);
      else {
        const b = document.createElement('button');
        b.type = 'button'; b.className = 'btn-primary tph-btn'; b.textContent = k + 1 < o.grandeurs.length ? 'Continuer →' : 'Terminer';
        b.style.marginTop = '8px';
        b.addEventListener('click', () => { R('retour').innerHTML = ''; suite(); });
        R('retour').appendChild(b);
        TPHM.defiler(b);
      }
    }
    etape();
    // « Passer cette partie » : tout se calcule avec les bonnes formules et les bonnes valeurs
    return { remplir() {
      while (k < o.grandeurs.length) {
        const g = o.grandeurs[k], f = g.formules.find(x => x.juste);
        res[g.id] = g.calc(f.cases.map(c => valeurs[c].v));
        if (g.etiquette) { const e = { id: g.id, html: g.etiquette(res[g.id]), sym: g.nom, val: g.resultat(res[g.id]), v: res[g.id] }; valeurs[e.id] = e; pl.ajouter(e); }
        if (g.passer) g.passer(res[g.id]);
        k++;
      }
      R('retour').innerHTML = '';
      etape();
    }, valeurs, res };
  }

  // fraction, racine, valeur absolue (HTML)
  const fr = (a, b) => `<span class="tph-frac"><span>${a}</span><span>${b}</span></span>`;
  const rac = x => `<span class="tph-racine"><span>√</span><span>${x}</span></span>`;
  const abs = x => `<span class="tph-abs">${x}</span>`;

  Object.assign(window.TPHM, { calcul, cs, fr, rac, abs, CALC });
})();
