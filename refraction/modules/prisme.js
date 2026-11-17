/* ============================================================
   Module 5 : dispersion de la lumière par un prisme
   RF.nPrisme(λ)            indice du prisme (loi de Cauchy n = A + B / λ², ajustée sur
                            n = 1,609 à 700 nm et n = 1,673 à 450 nm ; calcul interne, jamais montré)
   RF.simPrisme(zone)       simulation : prisme sur une table, source blanche ou monochromatique
                            (rouge 650 nm, vert 530 nm, bleu 450 nm), écran ; prisme à tourner,
                            source à déplacer, normales et angles aux deux faces
   RF.manipPrisme(zone)     manipulation guidée : le prisme ABC rectangle en C (A = 30,0°),
                            normale en J, i₁, loi de Descartes pour le bleu puis pour le rouge
   ============================================================ */
(function () {
  'use strict';

  const V = OPT.V, fmt = RF.fmt, nH = RF.nHTML, iH = RF.iHTML;
  // loi de Cauchy ajustée sur les deux valeurs (λ en nm)
  const L_R = 700, L_B = 450, N_R = 1.609, N_B = 1.673;
  const B_C = (N_B - N_R) / (1 / (L_B * L_B) - 1 / (L_R * L_R)), A_C = N_R - B_C / (L_R * L_R);
  const nPrisme = l => A_C + B_C / (l * l);
  // couleur d'une radiation (SP.rgb de spectres-etoiles), en attribut de présentation
  const couleur = l => `rgb(${SP.rgb(l).join(',')})`;

  /* ============================================================
     SIMULATION
     ============================================================ */
  const LW = 560, LH = 400;                    // figure rectangulaire (unités)
  const XS = -250, XE = 250;                   // abscisses de la source et de l'écran
  const BETA = 25;                              // direction du pinceau (degrés)
  const SOURCES = { blanche: { nom: 'lumière blanche' }, rouge: { nom: 'rouge (650 nm)', l: 650 }, verte: { nom: 'verte (530 nm)', l: 530 }, bleue: { nom: 'bleue (450 nm)', l: 450 } };

  function simPrisme(zone) {
    const etat = { source: 'blanche', ys: -49, rot: 0, normales: false };
    const C = [-40, 10], R = 150 / Math.sqrt(3);          // centre et rayon du cercle circonscrit (côté 150)
    const sommets = () => [90, 210, 330].map(a => V.add(C, V.mul(V.dir(a + etat.rot), R)));

    zone.innerHTML = `<div class="er-card">
      <div class="rf-sim-reglages">
        <label>Source<select class="rf-select" data-a="src">${Object.keys(SOURCES).map(k => `<option value="${k}">${SOURCES[k].nom}</option>`).join('')}</select></label>
        <label class="rf-coche"><input type="checkbox" data-a="nor"> Normales et angles</label>
      </div>
      <div class="rf-fig rf-fig-large" style="margin-top:10px"></div>
      <div class="rf-ligne-cmd rf-prisme-cmd" style="margin-top:10px">
        <span class="rf-cmd-g"><span class="rf-cmd-t">Prisme</span><span data-a="rot"></span></span>
        <span class="rf-cmd-g"><span class="rf-cmd-t">Source</span><span data-a="src-fl"></span></span>
      </div>
      <div class="rf-mesures" data-a="mes" aria-live="polite"></div>
      <ol class="rf-deroule" data-a="deroule" style="margin-top:14px"></ol><div data-a="fin"></div></div>`;
    const $ = a => zone.querySelector(`[data-a="${a}"]`);
    const S = OPT.scene(zone.querySelector('.rf-fig'), { largeur: LW, hauteur: LH, aria: 'Prisme éclairé par une source, et écran' });
    let traces = [];                                     // rayons tracés : { l, segments, interfaces, impact }

    function tracer() {
      const P0 = [XS, etat.ys], d = V.dir(BETA), tri = sommets();
      const ls = etat.source === 'blanche' ? Array.from({ length: 81 }, (_, i) => 400 + 5 * i) : [SOURCES[etat.source].l];
      traces = ls.map(l => {
        const t = OPT.tracer(P0, d, [{ sommets: tri, n: nPrisme(l) }], { longueur: 900 });
        // impact sur l'écran (x = XE) du dernier segment
        const sg = t.segments[t.segments.length - 1];
        let impact = null;
        if (sg.b[0] > XE && sg.a[0] < XE) { const k = (XE - sg.a[0]) / (sg.b[0] - sg.a[0]); const y = sg.a[1] + k * (sg.b[1] - sg.a[1]); if (Math.abs(y) < LH / 2 - 10) impact = [XE, y]; }
        return { l, segments: t.segments, interfaces: t.interfaces, impact };
      });
    }
    // un segment coupé à l'écran
    const couper = (a, b) => (b[0] > XE ? [a, V.add(a, V.mul(V.sub(b, a), (XE - a[0]) / (b[0] - a[0])))] : [a, b]);

    function dessiner() {
      tracer();
      ['fond', 'milieux', 'deco', 'rayons', 'arcs', 'textes'].forEach(n => S.vider(n));
      S.poly('fond', [[-LW / 2, -LH / 2], [LW / 2, -LH / 2], [LW / 2, LH / 2], [-LW / 2, LH / 2]], 'rf-table');
      S.texte('fond', [-LW / 2 + 12, LH / 2 - 16], 'table (vue de dessus)', { ancre: 'start', cls: 'rf-g-txt', taille: 14 });
      const tri = sommets();
      S.poly('milieux', tri, 'rf-prisme-verre');
      S.texte('textes', C, 'prisme', { taille: 15, cls: 'rf-g-txt' });
      // écran
      S.ligne('deco', [XE, -LH / 2 + 10], [XE, LH / 2 - 60], 'rf-ecran');
      S.texte('textes', [XE - 4, LH / 2 - 46], 'écran', { ancre: 'end', taille: 16 });
      // source (lampe)
      S.cercle('deco', [XS, etat.ys], 10, 'opt-lampe');
      for (let k = 0; k < 8; k++) { const v = V.dir(k * 45); S.ligne('deco', V.add([XS, etat.ys], V.mul(v, 13)), V.add([XS, etat.ys], V.mul(v, 18)), 'opt-lampe-rayon'); }
      // rayons : pinceau incident (blanc ou coloré), puis un rayon par radiation
      const blanc = etat.source === 'blanche';
      const t0 = traces[0], s0 = t0.segments[0];
      const inc = couper(s0.a, s0.b);
      S.rayon('rayons', inc[0], inc[1], blanc ? { fleche: 1, cls: 'rf-blanc' } : { fleche: 1, couleur: couleur(t0.l), largeur: 3 });
      traces.forEach(t => t.segments.slice(1).forEach((sg, j) => {
        const [a, b] = couper(sg.a, sg.b);
        S.rayon('rayons', a, b, { couleur: couleur(t.l), largeur: blanc ? 1.3 : 3, opacite: blanc ? 0.85 : 1, fleche: !blanc && j === t.segments.length - 2 ? 1 : 0 });
      }));
      // spectre sur l'écran : bandes entre impacts voisins (lumière blanche) ou tache
      const imp = traces.filter(t => t.impact);
      if (blanc) {
        for (let k = 0; k + 1 < imp.length; k++) {
          const a = imp[k], b = imp[k + 1];
          if (Math.abs(a.impact[1] - b.impact[1]) > 30) continue;
          S.ligne('deco', [XE + 6, a.impact[1]], [XE + 6, b.impact[1]], '', { stroke: couleur((a.l + b.l) / 2), 'stroke-width': 9 });
        }
      } else if (imp[0]) S.cercle('deco', [XE + 6, imp[0].impact[1]], 6, '', { fill: couleur(imp[0].l) });
      // normales et angles aux deux faces (radiation verte, ou celle de la source)
      const ref = blanc ? traces[26] : traces[0];
      let txt = '';
      if (etat.normales && ref) {
        ref.interfaces.slice(0, 2).forEach((it, k) => {
          const d0 = V.norm(V.sub(ref.segments[k].b, ref.segments[k].a)), d1 = V.norm(V.sub(ref.segments[k + 1].b, ref.segments[k + 1].a));
          const nIn = V.dot(d0, it.N) < 0 ? it.N : V.mul(it.N, -1);
          S.ligne('deco', V.add(it.P, V.mul(nIn, 48)), V.sub(it.P, V.mul(nIn, 48)), 'opt-normale');
          S.arc('arcs', it.P, V.angle(V.mul(d0, -1)), V.angle(nIn), 26, 'opt-arc-pose');
          if (!it.totale) S.arc('arcs', it.P, V.angle(d1), V.angle(V.mul(nIn, -1)), 26, 'opt-arc-pose');
          txt += `<span>${k === 0 ? 'Entrée' : 'Sortie'} : ${fmt(it.i1, 0)}° ${it.totale ? '(réflexion totale)' : `→ ${fmt(it.i2, 0)}°`}</span>`;
        });
      }
      $('mes').innerHTML = txt || `<span>Source : <b>${SOURCES[etat.source].nom}</b></span>`;
      verifier();
    }

    /* ----- Commandes : tourner le prisme, déplacer la source ----- */
    const pv = OPT.pivot(S, { centre: C, angle: 90, rayon: R, pas: 1, aria: 'Sommet du prisme : tourner le prisme',
      contraindre: a => 90 + Math.max(-40, Math.min(40, Math.round(OPT.ecart(a, 90)))),
      surChange: a => { etat.rot = a - 90; dessiner(); } });
    OPT.fleches($('rot'), { moins: () => pv.regler(pv.angle() - 1), plus: () => pv.regler(pv.angle() + 1), symboles: ['↻ 1°', '↺ 1°'], aria: ['Tourner le prisme de 1° dans le sens des aiguilles d\'une montre', 'Tourner le prisme de 1° dans l\'autre sens'] });
    const bouger = dy => { etat.ys = Math.max(-170, Math.min(120, etat.ys + dy)); placerLampe(); dessiner(); };
    OPT.fleches($('src-fl'), { moins: () => bouger(-5), plus: () => bouger(5), symboles: ['↓', '↑'], aria: ['Descendre la source', 'Monter la source'] });
    // la source se glisse aussi (verticalement)
    const lampe = OPT.svgEl('g', { class: 'opt-poignee', tabindex: '0', role: 'slider', 'aria-label': 'Source : glisser vers le haut ou le bas' }, S.calque('poignees'));
    const lz = OPT.svgEl('circle', { class: 'opt-poignee-zone' }, lampe), lp = OPT.svgEl('circle', { class: 'opt-poignee-point' }, lampe);
    function placerLampe() { [lz, lp].forEach(c => { c.setAttribute('cx', XS); c.setAttribute('cy', -etat.ys); }); lz.setAttribute('r', S.u(24)); lp.setAttribute('r', 6); }
    S.surRedim(placerLampe); placerLampe();
    let idL = null;
    lampe.addEventListener('touchstart', e => { if (e.cancelable) e.preventDefault(); }, { passive: false });
    lampe.addEventListener('pointerdown', e => { idL = e.pointerId; try { lampe.setPointerCapture(idL); } catch (er) { /* ignoré */ } e.preventDefault(); });
    const suivreL = e => { const y = S.point(e)[1]; etat.ys = Math.max(-170, Math.min(120, Math.round(y))); placerLampe(); dessiner(); };
    lampe.addEventListener('pointermove', e => { if (e.pointerId === idL) suivreL(e); });
    lampe.addEventListener('pointerup', e => { if (e.pointerId === idL) { suivreL(e); idL = null; } });
    lampe.addEventListener('pointercancel', () => { idL = null; });
    lampe.addEventListener('keydown', e => { const d = { ArrowUp: 5, ArrowDown: -5 }[e.key]; if (d) { e.preventDefault(); bouger(d); } });
    $('src').onchange = () => { etat.source = $('src').value; dessiner(); };
    $('nor').onchange = () => { etat.normales = $('nor').checked; dessiner(); };

    /* ----- Toucher un rayon (étape 2) ----- */
    let toucherActif = false, errTouche = 0;
    OPT.surAppui(S.svg, ev => {
      if (!toucherActif) return;
      const z = zoneK();
      if (etat.source !== 'blanche') { z.querySelector('[data-a="t-ret"]').innerHTML = '<p class="ph-msg">Choisis la lumière blanche.</p>'; return; }
      // rayons après le prisme
      const cibles = traces.filter(t => t.segments.length > 1).map(t => { const sg = t.segments[t.segments.length - 1], [a, b] = couper(sg.a, sg.b); return { id: t.l, a, b }; });
      const c = S.plusProche(ev, cibles, 16);
      if (!c) return;
      const ret = z.querySelector('[data-a="t-ret"]');
      if (c.id <= 470) { toucherActif = false; passer(`Juste : le rayon le plus dévié est le bleu-violet (petite longueur d'onde λ = ${c.id} nm).`); return; }
      errTouche++;
      ret.innerHTML = `<div class="callout-danger er-retour"><p><b class="er-ko">Ce n'est pas ça.</b> ${c.id >= 600 ? 'Ce rayon est rouge : c\'est le moins dévié. Compare la direction de chaque rayon avec celle de la lumière qui arrive sur le prisme.' : 'Cherche le rayon qui s\'écarte le plus de la direction de la lumière qui arrive sur le prisme.'}</p>${errTouche >= 2 ? '<p class="er-petit">C\'est le rayon du bord du pinceau, du côté du bleu et du violet.</p>' : ''}</div>`;
    });

    /* ----- Déroulé guidé ----- */
    const ETAPES = [
      'Lumière blanche : observe ce qui se forme sur l\'écran.',
      'Touche le rayon le plus dévié.',
      'Choisis une source de lumière monochromatique (rouge, verte ou bleue).',
      'La lumière est réfractée deux fois : affiche les normales et les angles.',
    ];
    const ol = $('deroule');
    ol.innerHTML = ETAPES.map(t => `<li><span>${t}</span><div class="rf-li-zone"></div></li>`).join('');
    const lis = Array.from(ol.children);
    let k = 0, sous = 0;
    const zoneK = () => lis[k].querySelector('.rf-li-zone');
    function marquer() { lis.forEach((li, i) => { li.classList.toggle('fait', i < k); li.classList.toggle('ici', i === k); li.classList.toggle('avenir', i > k); }); }
    function passer(texte) {
      if (texte) zoneK().insertAdjacentHTML('beforeend', `<p class="rf-li-aide">✓ ${texte}</p>`);
      k++; sous = 0; marquer();
      if (k === 1) { toucherActif = true; zoneK().innerHTML = '<p class="rf-li-aide">Touche un des rayons colorés, après le prisme.</p><div data-a="t-ret" aria-live="polite"></div>'; }
      if (k < ETAPES.length) { verifier(); RF.amener(lis[k], 0.75); } else fin();
    }
    function choix(q, options, bonne, diags, ok) {
      const d = RF.el('div');
      zoneK().appendChild(d);
      RF.question(d, { parties: [{ type: 'choix', q, options, bonne, indices: diags, melanger: false, colonne: true }] }, { fin: () => ok() }, 'manip');
      RF.defiler(d);
    }
    function verifier() {
      if (!lis || !lis.length) return;
      const nb = traces.filter(t => t.impact).length;
      if (k === 0 && sous === 0 && etat.source === 'blanche' && nb >= 40) {
        sous = 1;
        choix('Sur l\'écran, on observe :', [{ id: 'c', label: 'un spectre continu, du rouge au violet' }, { id: 't', label: 'une tache blanche' }, { id: 'r', label: 'quelques raies colorées sur un fond noir' }], 'c',
          { t: 'Regarde l\'écran : la lumière blanche est décomposée en couleurs.', r: 'Les couleurs se suivent sans interruption, du rouge au violet : le spectre est continu.' },
          () => passer('La lumière blanche est décomposée par le prisme : on obtient son spectre, continu de 400 nm à 800 nm. C\'est la dispersion.'));
      } else if (k === 0 && sous === 0) {
        zoneK().innerHTML = `<p class="rf-li-aide">${etat.source !== 'blanche' ? 'Choisis la lumière blanche.' : 'Tourne le prisme ou déplace la source pour que la lumière arrive sur l\'écran.'}</p>`;
      } else if (k === 2 && sous === 0 && etat.source !== 'blanche') {
        sous = 1;
        choix('La lumière monochromatique est-elle décomposée par le prisme ?', [{ id: 'n', label: 'Non : une seule tache, de la couleur de la source' }, { id: 'o', label: 'Oui : un spectre se forme sur l\'écran' }], 'n',
          { o: 'Regarde l\'écran : il n\'y a qu\'une tache, de la couleur de la source.' },
          () => passer(`Une lumière monochromatique ne peut pas être décomposée : elle est caractérisée par sa longueur d'onde λ dans le vide ou dans l'air (en m, souvent en nm : 1 nm = 10<sup>−9</sup> m). La lumière blanche est polychromatique.`));
      } else if (k === 3 && etat.normales) {
        passer('La lumière est réfractée à l\'entrée puis à la sortie du prisme : la séparation des couleurs est accentuée.');
      }
    }
    function fin() {
      SOM.marquer({ fait: true });
      $('fin').innerHTML = `<div class="cle rf-bilan" style="margin-top:14px"><p><b class="cle-titre">Bilan.</b> Le prisme <b>décompose</b> la lumière blanche (polychromatique) en un spectre continu, de 400 nm à 800 nm : c'est la <b>dispersion</b>.</p>
          <p>L'indice du prisme dépend de la longueur d'onde : les radiations <b>bleues</b> (petite λ) sont plus déviées que les <b>rouges</b>. Une lumière <b>monochromatique</b> n'est pas décomposée.</p></div>
        ${RF.revois(['spectres'])}
        <div class="er-actions"><button type="button" class="btn-secondary" data-a="re">↺ Recommencer</button>
          <a class="btn-primary" style="text-decoration:none" href="module_5_manip.html">Manipulation : les rayons bleu et rouge →</a></div>`;
      $('fin').querySelector('[data-a="re"]').onclick = () => simPrisme(zone);
      RF.defiler($('fin'));
    }
    marquer();
    dessiner();
    // pour vérifier l'application
    RF.prismeEnCours = { etat, traces: () => traces, dessiner, tourner: a => pv.regler(90 + a), etape: () => k, ecran: p => p };
  }

  /* ============================================================
     MANIPULATION GUIDÉE : le prisme ABC rectangle en C, A = 30,0°
     ============================================================ */
  const S30 = 0.5, C30 = Math.sqrt(3) / 2, D = 90;
  const SIT_PRISME = {
    id: 'prisme30', titre: 'Le prisme ABC', texte: 'Un rayon de lumière blanche arrive perpendiculairement en I sur la face AC du prisme, et rencontre la face AB en J.',
    m1: 'verre', m2: 'air', type: 'prisme', alpha: -60, n2: 30, sens: -1, i1: 30, refracte: false, reflechi: false, source: 'lampe', nomPoint: 'J',
    triangle: [[-D, D * C30 / S30], [D * S30, -D * C30], [-D, -D * C30]], entree: [-D, 0], externe: [-168, 0],
    lettres: [[[-D - 14, D * C30 / S30 + 4], 'A'], [[D * S30 + 14, -D * C30 - 6], 'B'], [[-D - 14, -D * C30 - 6], 'C'], [[-D - 12, 14], 'I']],
  };
  const JETONS = ['n:b', 'n:r', 'n:air', 's:1', 's:2b', 's:2r', 'a:1', 'a:2b', 'a:2r', 'x', '='];

  function manipPrisme(zone) {
    zone.innerHTML = '';
    const carte = RF.el('div', 'er-card');
    const ETAPES = [
      'Trace la <b>normale</b> en J, sur la face AB.',
      'Place l\'angle d\'incidence <b>i<sub>1</sub></b> en J.',
      'Trouve la valeur de <b>i<sub>1</sub></b>.',
      `Pour le <b>bleu</b> : écris la loi de Descartes, puis calcule ${iH('2b')}.`,
      `Pour le <b>rouge</b> : écris la loi de Descartes, puis calcule ${iH('2r')}.`,
      'Compare les deux rayons.',
    ];
    carte.innerHTML = `<div class="rf-sit-tete"><h3 class="rf-sit-titre">${SIT_PRISME.titre}</h3></div>
      <div class="rf-manip">
        <div class="rf-manip-fig"><p class="rf-fig-t">${SIT_PRISME.texte}</p><div class="rf-fig"></div><div class="rf-cmd-zone"></div></div>
        <div class="rf-manip-panneau">
          <div class="rf-donnees"><p><b>Données :</b> angle au sommet A = 30,0° ; prisme en verre flint : ${nH('b')} = 1,673 pour le bleu, ${nH('r')} = 1,609 pour le rouge ; ${nH('air')} = 1,00.</p></div>
          <ol class="rf-deroule">${ETAPES.map(t => `<li><span>${t}</span><div class="rf-li-zone"></div></li>`).join('')}</ol><div data-a="fin"></div></div>
      </div>`;
    zone.appendChild(carte);
    const lis = Array.from(carte.querySelectorAll('.rf-deroule li'));
    let k = 0;
    const marquer = () => lis.forEach((li, i) => { li.classList.toggle('fait', i < k); li.classList.toggle('ici', i === k); li.classList.toggle('avenir', i > k); });
    marquer();
    const sc = RF.schema(carte.querySelector('.rf-fig'), carte.querySelector('.rf-cmd-zone'), SIT_PRISME, {
      pas: ['normale', 'angles'], anglesAPlacer: ['i1'], sansRefracte: true, milieuxPlaces: false, etiqRayons: {},
      surEtape(n) { k = n; marquer(); },
      surFin() { k = 2; marquer(); suite(); },
    });
    const zoneK = () => lis[k].querySelector('.rf-li-zone');
    function suivant() { k++; marquer(); RF.amener(lis[Math.min(k, lis.length - 1)], 0.7); }
    // questions dans l'étape en cours, en parties successives
    function poser(parties, ok) {
      const d = RF.el('div');
      zoneK().appendChild(d);
      RF.question(d, { parties }, { fin: () => ok() }, 'manip');
      RF.defiler(d);
    }
    function suite() {
      // 3. valeur de i₁
      poser([{
        type: 'choix', q: `Que vaut l'angle d'incidence ${iH(1)} en J ?`, melanger: false,
        options: [{ id: '30', label: '30,0°' }, { id: '60', label: '60,0°' }, { id: '90', label: '90,0°' }], bonne: '30',
        indices: { 60: 'L\'angle se mesure depuis la normale : 60° est l\'angle entre le rayon et la face AB.', 90: '90° est l\'angle entre la normale et la face AB ; ' + iH(1) + ' est entre la normale et le rayon incident.' },
        solution: `La normale en J fait avec le rayon le même angle que la face AB avec la face AC : ${iH(1)} = 30,0°.`,
      }], () => { suivant(); bleu(); });
    }
    const commun = { m1: 'verre', m2: 'air', i1: 30, dec: 1, inconnue: 's2', csAngle: 3, sansExpression: true, jetons: JETONS, le1: 'le verre', le2: 'l\'air',
      diagEchange: 'La lumière sort du verre : le milieu 1 est le verre.' };
    function bleu() {
      poser(RF.partiesCalcul(Object.assign({}, commun, { n1: N_B, sym1m: 'b', sym2: '2b' })), () => { suivant(); rouge(); });
    }
    function rouge() {
      poser(RF.partiesCalcul(Object.assign({}, commun, { n1: N_R, sym1m: 'r', sym2: '2r' })), () => { suivant(); comparer(); });
    }
    function comparer() {
      // les deux rayons se tracent à la sortie, en J
      sc.e.extra = (S, g) => {
        [[N_B, 450, '2b'], [N_R, 700, '2r']].forEach(([n, l, s]) => {
          const r = OPT.devier(g.d, g.N2, n, 1), fin = V.mul(r.refracte, 170);
          S.rayon('rayons', g.I, fin, { fleche: 1, couleur: couleur(l), largeur: 3 });
          S.texte('textes', V.mul(r.refracte, 182), iH(s), { taille: 13 });
        });
      };
      sc.redessiner();
      poser([
        { type: 'choix', q: 'Quel est le rayon le plus dévié ?', melanger: false,
          options: [{ id: 'b', label: 'le rayon bleu' }, { id: 'r', label: 'le rayon rouge' }, { id: 'e', label: 'les deux sont déviés de la même façon' }], bonne: 'b',
          indices: { r: `${iH('2b')} = 56,8° et ${iH('2r')} = 53,6° : le rayon bleu s'écarte davantage de la direction du rayon incident.`, e: `Compare ${iH('2b')} = 56,8° et ${iH('2r')} = 53,6° : ils sont différents.` },
          solution: `${iH('2b')} = 56,8° > ${iH('2r')} = 53,6° : le bleu est le plus dévié.` },
        { type: 'choix', q: 'Comment s\'appelle ce phénomène ?', melanger: false,
          options: [{ id: 'd', label: 'la dispersion' }, { id: 'r', label: 'la réflexion' }, { id: 'f', label: 'la diffraction' }], bonne: 'd',
          indices: { r: 'La lumière traverse le prisme : elle n\'est pas renvoyée par une surface.', f: 'Les couleurs sont séparées parce que l\'indice du verre dépend de la longueur d\'onde.' },
          solution: 'La séparation des radiations par le prisme est la <b>dispersion</b>.' },
      ], fin);
    }
    function fin() {
      k = lis.length; marquer();
      SOM.marquer({ fait: true });
      const f = carte.querySelector('[data-a="fin"]');
      f.innerHTML = `<div class="cle rf-bilan" style="margin-top:12px"><p><b class="cle-titre">Bilan.</b> L'indice du verre dépend de la longueur d'onde : ${nH('b')} > ${nH('r')}. Les radiations <b>bleues</b> (petite λ) sont plus déviées que les <b>rouges</b> : c'est la <b>dispersion</b>.</p></div>
        <div class="er-actions"><button type="button" class="btn-secondary" data-a="re">↺ Recommencer</button>
          <a class="btn-primary" style="text-decoration:none" href="../index.html">Retour à l'accueil</a></div>`;
      f.querySelector('[data-a="re"]').onclick = () => manipPrisme(zone);
      RF.defiler(f);
    }
  }

  Object.assign(RF, { nPrisme, simPrisme, manipPrisme, SIT_PRISME });
})();
