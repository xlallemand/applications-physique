/* ============================================================
   Module 3 : simulateur de réfraction (simulation)
   RF.simulateur(zone)
   - deux milieux au choix (air, eau, verre, plexiglas, milieu inconnu), surface horizontale ;
   - source glissée sur un cercle autour de I, ou boutons − 1° / + 1° ; rapporteur gradué autour de I ;
   - rayons incident, réfracté, réfléchi (case à cocher), angles et valeurs affichés ;
   - réflexion totale (hors programme) : au-delà de l'angle limite, plus de rayon réfracté,
     rayon réfléchi intense et bulle ⓘ « Hors programme » à côté de la figure.
   Déroulé guidé : i₁ = 0°, i₁ qui augmente, air → eau puis eau → air, rayon réfléchi,
   mesures air → plexiglas (tableau), graphique sin(i₁) en fonction de sin(i₂), défi « milieu inconnu ».
   ============================================================ */
(function () {
  'use strict';

  const V = OPT.V, fmt = RF.fmt, nH = RF.nHTML, iH = RF.iHTML, sinD = RF.sinD;
  const RS = 175;                                  // rayon du cercle de la source et longueur des rayons
  const TP = [0, 10, 20, 30, 40, 50, 60, 80];      // valeurs de i₁ du tableau de mesures
  const BULLE_TOTALE = '<b>Hors programme.</b> Au-delà de cet angle, il n\'y a plus de rayon réfracté : toute la lumière est réfléchie (réflexion totale).';

  function simulateur(zone) {
    // indice du milieu inconnu : tiré entre 1,30 et 1,70
    const nInconnu = Math.round((1.3 + Math.random() * 0.4) * 100) / 100;
    const milieu = id => (id === 'inconnu' ? Object.assign({}, RF.MILIEUX.inconnu, { n: nInconnu }) : RF.MILIEUX[id]);
    const etat = { m1: 'air', m2: 'eau', i1: 40, refl: false, masquerI2: false };
    const opts = ['air', 'eau', 'verre', 'plexi', 'inconnu'].map(id => `<option value="${id}">${RF.MILIEUX[id].nom}</option>`).join('');

    zone.innerHTML = `<div class="er-card">
      <div class="rf-manip">
        <div class="rf-manip-fig">
          <div class="rf-sim-reglages">
            <label>Milieu 1 (en haut)<select class="rf-select" data-a="m1">${opts}</select></label>
            <label>Milieu 2 (en bas)<select class="rf-select" data-a="m2">${opts}</select></label>
          </div>
          <div class="rf-fig" style="margin-top:10px"></div>
          <div class="rf-ligne-cmd" style="margin-top:10px"><span data-a="fl"></span>
            <label class="rf-coche"><input type="checkbox" data-a="refl"> Rayon réfléchi</label></div>
          <div class="rf-mesures" aria-live="polite" data-a="mes"></div>
          <div data-a="bulle"></div>
        </div>
        <div class="rf-manip-panneau"><ol class="rf-deroule" data-a="deroule"></ol><div data-a="fin"></div></div>
      </div></div>`;
    const $ = a => zone.querySelector(`[data-a="${a}"]`);
    $('m1').value = etat.m1; $('m2').value = etat.m2;
    const S = OPT.scene(zone.querySelector('.rf-fig'), { aria: 'Simulateur : rayon lumineux qui passe du milieu 1 au milieu 2' });

    /* ----- Calcul et dessin ----- */
    function calcul() {
      const m1 = milieu(etat.m1), m2 = milieu(etat.m2);
      const r = OPT.refracter(m1.n, m2.n, etat.i1);
      return { m1, m2, totale: !!r.totale, i2: r.totale ? null : r.i2 };
    }
    function dessiner() {
      const c = calcul();
      ['fond', 'milieux', 'deco', 'rayons', 'arcs', 'textes'].forEach(n => S.vider(n));
      S.poly('milieux', [[-200, 0], [200, 0], [200, 200], [-200, 200]], 'opt-milieu opt-fond-' + c.m1.fond);
      S.poly('milieux', [[-200, 0], [200, 0], [200, -200], [-200, -200]], 'opt-milieu opt-fond-' + c.m2.fond);
      S.rapporteur('deco', [0, 0], 150, { zero: 90 });
      S.ligne('deco', [-200, 0], [200, 0], 'opt-surface');
      S.ligne('deco', [0, 196], [0, -196], 'opt-normale');
      const nTxt = m => (m.id === 'inconnu' ? `${nH('inconnu')} = ?` : `${nH(m.sym)} = ${fmt(m.n, 2)}`);
      S.texte('textes', [-192, 186], `<b>${c.m1.nom}</b>`, { ancre: 'start', taille: 13 });
      S.texte('textes', [-192, 169], nTxt(c.m1), { ancre: 'start', taille: 12 });
      S.texte('textes', [-192, -169], `<b>${c.m2.nom}</b>`, { ancre: 'start', taille: 13 });
      S.texte('textes', [-192, -186], nTxt(c.m2), { ancre: 'start', taille: 12 });
      const src = V.mul(V.dir(90 + etat.i1), RS);
      // source (lampe) et rayon incident
      S.rayon('rayons', src, [0, 0], { fleche: 1 });
      if (c.totale) S.rayon('rayons', [0, 0], V.mul(V.dir(90 - etat.i1), RS), { fleche: 1, cls: 'opt-intense' });
      else {
        S.rayon('rayons', [0, 0], V.mul(V.dir(-90 + c.i2), RS), { fleche: 1 });
        if (etat.refl) S.rayon('rayons', [0, 0], V.mul(V.dir(90 - etat.i1), RS), { fleche: 1, cls: 'opt-faible' });
      }
      // arcs d'angle
      if (etat.i1 > 0) {
        S.arc('arcs', [0, 0], 90, 90 + etat.i1, 46, 'opt-arc-pose');
        S.texte('textes', V.mul(V.dir(90 + etat.i1 / 2), 60), iH(1), { taille: 13 });
        if (!c.totale && c.i2 > 0.5) {
          S.arc('arcs', [0, 0], -90, -90 + c.i2, 46, 'opt-arc-pose');
          S.texte('textes', V.mul(V.dir(-90 + c.i2 / 2), 60), iH(2), { taille: 13 });
        }
        if (etat.refl || c.totale) S.arc('arcs', [0, 0], 90, 90 - etat.i1, 34, 'opt-arc');
      }
      S.cercle('textes', [0, 0], 3.5, 'opt-point');
      // lampe sur la poignée
      S.cercle('deco', src, 8, 'opt-lampe');
      // valeurs
      const i2T = c.totale ? 'pas de rayon réfracté' : etat.masquerI2 ? 'lis-le sur le rapporteur' : `${fmt(c.i2, 1)}°`;
      $('mes').innerHTML = `<span>${iH(1)} = <b>${etat.i1}°</b></span><span>${iH(2)} : <b>${i2T}</b></span>${etat.refl || c.totale ? `<span>angle de réflexion = <b>${etat.i1}°</b></span>` : ''}`;
      $('bulle').innerHTML = c.totale ? `<p class="rf-fig-bulle">Plus de rayon réfracté : réflexion totale ${BULLE.info(BULLE_TOTALE, 'Réflexion totale (hors programme)')}</p>` : '';
      verifier();
    }

    /* ----- Commandes ----- */
    const pv = OPT.pivot(S, {
      centre: [0, 0], angle: 90 + etat.i1, rayon: RS, pas: 1, aria: 'Source de lumière : faire varier l\'angle d\'incidence',
      contraindre: a => 90 + Math.max(0, Math.min(89, Math.round(OPT.ecart(a, 90)))),
      surChange: a => { etat.i1 = Math.round(a - 90); dessiner(); },
    });
    OPT.fleches($('fl'), { moins: () => pv.regler(pv.angle() - 1), plus: () => pv.regler(pv.angle() + 1), symboles: ['− 1°', '+ 1°'], aria: ['Diminuer i₁ de 1°', 'Augmenter i₁ de 1°'] });
    $('m1').onchange = () => { etat.m1 = $('m1').value; dessiner(); };
    $('m2').onchange = () => { etat.m2 = $('m2').value; dessiner(); };
    $('refl').onchange = () => { etat.refl = $('refl').checked; dessiner(); };

    /* ----- Déroulé guidé ----- */
    const ETAPES = [
      { t: `Règle ${iH(1)} = 0° : observe le rayon réfracté.` },
      { t: `Augmente ${iH(1)} : que fait ${iH(2)} ?` },
      { t: `Choisis air (milieu 1) et eau (milieu 2), puis eau et air : compare ${iH(1)} et ${iH(2)}.` },
      { t: 'Coche « rayon réfléchi » : compare l\'angle de réflexion et ' + iH(1) + '.' },
      { t: `Mesures : choisis air et plexiglas, règle ${iH(1)} et lis ${iH(2)} sur le rapporteur, au degré près.` },
      { t: `Trace la droite sin(${iH(1)}) en fonction de sin(${iH(2)}).` },
      { t: 'Défi : choisis air et milieu inconnu ; mesure, puis calcule l\'indice du milieu inconnu.' },
    ];
    const ol = $('deroule');
    ol.innerHTML = ETAPES.map(e => `<li><span>${e.t}</span><div class="rf-li-zone"></div></li>`).join('');
    const lis = Array.from(ol.children);
    let k = 0, sous = 0, depart = null, mesures = [], ligneTP = 0;
    const zoneK = () => lis[k].querySelector('.rf-li-zone');
    function marquer() { lis.forEach((li, i) => { li.classList.toggle('fait', i < k); li.classList.toggle('ici', i === k); li.classList.toggle('avenir', i > k); }); }
    function passer(texte) {
      if (texte) zoneK().insertAdjacentHTML('beforeend', `<p class="rf-li-aide">✓ ${texte}</p>`);
      k++; sous = 0; depart = null;
      marquer();
      if (k < ETAPES.length) { entrer(); RF.amener(lis[k], 0.7); }
      else fin();
    }
    // question à choix dans l'étape en cours
    function choix(q, options, bonne, diags, ok) {
      const z = zoneK(), d = RF.el('div');
      z.appendChild(d);
      RF.question(d, { parties: [{ type: 'choix', q, options, bonne, indices: diags, melanger: false }] }, { fin: () => ok() }, 'manip');
      RF.defiler(d);
    }
    function entrer() {
      etat.masquerI2 = k === 4 || k === 6;
      if (k === 4) tableau();
      if (k === 5) graphique();
      if (k === 6) defi();
      dessiner();
    }
    // vérifie l'état de la manipulation pour l'étape en cours
    function verifier() {
      const c = calcul();
      if (k === 0 && etat.i1 === 0) passer(`${iH(1)} = 0° donne ${iH(2)} = 0° : le rayon n'est pas dévié.`);
      else if (k === 1) {
        if (depart === null) depart = etat.i1;
        if (sous === 0 && Math.abs(etat.i1 - depart) >= 20) {
          sous = 1;
          choix(`Quand ${iH(1)} augmente, ${iH(2)} :`, [{ id: 'aug', label: 'augmente' }, { id: 'dim', label: 'diminue' }, { id: 'cst', label: 'ne change pas' }], 'aug',
            { dim: `Regarde le rayon réfracté quand tu augmentes ${iH(1)} : il s'écarte de la normale.`, cst: `Fais varier ${iH(1)} et regarde la valeur de ${iH(2)} : elle change.` },
            () => passer(`Quand ${iH(1)} augmente, ${iH(2)} augmente aussi.`));
        }
      } else if (k === 2) {
        if (sous === 0 && etat.m1 === 'air' && etat.m2 === 'eau' && etat.i1 > 0) {
          sous = 1;
          choix(`De l'air vers l'eau, ${iH(2)} est :`, [{ id: 'pp', label: `plus petit que ${iH(1)}` }, { id: 'pg', label: `plus grand que ${iH(1)}` }, { id: 'eg', label: `égal à ${iH(1)}` }], 'pp',
            { pg: `Compare les valeurs : ${nH('eau')} > ${nH('air')}, le rayon réfracté se rapproche de la normale.`, eg: 'Compare les valeurs affichées : le rayon change de direction.' },
            () => { sous = 2; zoneK().insertAdjacentHTML('beforeend', `<p class="rf-li-aide">Maintenant, choisis eau (milieu 1) et air (milieu 2).</p>`); dessiner(); });
        } else if (sous === 2 && etat.m1 === 'eau' && etat.m2 === 'air' && etat.i1 > 0 && !c.totale) {
          sous = 3;
          choix(`De l'eau vers l'air, ${iH(2)} est :`, [{ id: 'pp', label: `plus petit que ${iH(1)}` }, { id: 'pg', label: `plus grand que ${iH(1)}` }, { id: 'eg', label: `égal à ${iH(1)}` }], 'pg',
            { pp: `Compare les valeurs : ${nH('eau')} > ${nH('air')}, le rayon réfracté s'éloigne de la normale.`, eg: 'Compare les valeurs affichées : le rayon change de direction.' },
            () => passer(`Air → eau : ${iH(2)} < ${iH(1)} (le rayon se rapproche de la normale) ; eau → air : ${iH(2)} > ${iH(1)} (il s'en éloigne).`));
        }
      } else if (k === 3 && sous === 0 && etat.refl && etat.i1 > 0) {
        sous = 1;
        choix(`L'angle de réflexion est :`, [{ id: 'eg', label: `égal à ${iH(1)}` }, { id: 'pg', label: `plus grand que ${iH(1)}` }, { id: 'pp', label: `plus petit que ${iH(1)}` }], 'eg',
          { pg: 'Compare les valeurs affichées : l\'angle de réflexion et l\'angle d\'incidence sont égaux.', pp: 'Compare les valeurs affichées : l\'angle de réflexion et l\'angle d\'incidence sont égaux.' },
          () => passer(`Loi de Descartes pour la réflexion : l'angle de réflexion est égal à l'angle d'incidence (on l'écrit ${iH(1)} = ${iH(2)}).`));
      } else if (k === 4) majTableau();
      else if (k === 6) majDefi();
    }

    /* ----- Étape 5 : tableau de mesures ----- */
    let tab = null;
    function tableau() {
      const z = zoneK();
      z.innerHTML = `<p class="rf-li-aide" data-a="tp-msg"></p><div class="ph-defile"><table class="ph-tableau"><thead><tr><th>${iH(1)} (°)</th><th>${iH(2)} (°)</th><th>sin(${iH(1)})</th><th>sin(${iH(2)})</th></tr></thead>
        <tbody>${TP.map((a, j) => `<tr data-j="${j}"><td>${a}</td><td><input type="text" class="ph-champ" inputmode="decimal" autocomplete="off" spellcheck="false" aria-label="${'i2 pour i1 = ' + a + '°'}" disabled></td><td data-c="s1"></td><td data-c="s2"></td></tr>`).join('')}</tbody></table></div>
        <div class="er-actions"><button type="button" class="btn-primary" data-a="tp-ok">Valider la mesure</button></div><div data-a="tp-ret" aria-live="polite"></div>`;
      tab = z;
      z.querySelector('[data-a="tp-ok"]').onclick = validerMesure;
      z.querySelectorAll('input').forEach(i => i.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); validerMesure(); } }));
      majTableau();
    }
    function majTableau() {
      if (!tab) return;
      const msg = tab.querySelector('[data-a="tp-msg"]');
      const bonMilieu = etat.m1 === 'air' && etat.m2 === 'plexi';
      const a = TP[ligneTP];
      tab.querySelectorAll('tr[data-j]').forEach(tr => tr.classList.toggle('rf-ligne-ici', +tr.dataset.j === ligneTP));
      const inp = tab.querySelector(`tr[data-j="${ligneTP}"] input`);
      const pret = bonMilieu && etat.i1 === a;
      if (inp) inp.disabled = !pret;
      msg.innerHTML = !bonMilieu ? 'Choisis air (milieu 1) et plexiglas (milieu 2).' : etat.i1 !== a ? `Règle ${iH(1)} = ${a}° (glisse la source, ou − 1° / + 1°).` : `Lis ${iH(2)} sur le rapporteur et écris-le dans le tableau.`;
    }
    let errMesure = 0;
    function validerMesure() {
      const ret = tab.querySelector('[data-a="tp-ret"]');
      const a = TP[ligneTP], inp = tab.querySelector(`tr[data-j="${ligneTP}"] input`);
      if (!(etat.m1 === 'air' && etat.m2 === 'plexi') || etat.i1 !== a) { majTableau(); ret.innerHTML = `<p class="ph-msg">${tab.querySelector('[data-a="tp-msg"]').innerHTML}</p>`; return; }
      const v = RF.lire(inp.value);
      if (isNaN(v)) { ret.innerHTML = '<p class="ph-msg">Écris un nombre entier de degrés.</p>'; return; }
      const i2 = calcul().i2;
      let diag = null;
      if (Math.abs(v - i2) <= 1) diag = null;
      else if (a > 0 && Math.abs(v - (90 - i2)) <= 1.5) diag = 'Les angles se mesurent depuis la normale, pas depuis la surface : la graduation 0 est sur la normale.';
      else if (a > 0 && Math.abs(v - a) <= 1) diag = `Tu as recopié ${iH(1)} : lis l'angle du rayon réfracté, sous la surface.`;
      else diag = `Lis ${iH(2)} entre la normale (graduation 0) et le rayon réfracté, sous la surface, au degré près.`;
      if (diag) {
        errMesure++;
        ret.innerHTML = `<div class="callout-danger er-retour"><p><b class="er-ko">Ce n'est pas ça.</b> ${diag}</p>${errMesure >= 2 ? `<p class="er-petit">Le rayon réfracté passe à ${Math.round(i2)}° de la normale.</p>` : ''}</div>`;
        return;
      }
      errMesure = 0;
      ret.innerHTML = '';
      mesures.push({ i1: a, i2: v });
      inp.disabled = true;
      const tr = tab.querySelector(`tr[data-j="${ligneTP}"]`);
      tr.querySelector('[data-c="s1"]').textContent = fmt(sinD(a), 3);
      tr.querySelector('[data-c="s2"]').textContent = fmt(sinD(v), 3);
      ligneTP++;
      if (ligneTP >= TP.length) {
        tab.querySelector('[data-a="tp-ok"]').parentNode.remove();
        tab.querySelector('[data-a="tp-msg"]').innerHTML = 'Toutes les mesures sont faites.';
        passer(`Tableau rempli : quand ${iH(1)} augmente, ${iH(2)} augmente aussi.`);
      } else majTableau();
      // la ligne suivante reste à l'écran
      RF.defiler(tab.querySelector(`tr[data-j="${Math.min(ligneTP, TP.length - 1)}"]`) || tab);
    }

    /* ----- Étape 6 : graphique sin(i₁) en fonction de sin(i₂), droite qui passe par l'origine ----- */
    function graphique() {
      const z = zoneK();
      const W = 360, H = 300, x0 = 46, y0 = 262, kx = 290 / 0.8, ky = 240 / 1;     // 0 à 0,8 en abscisse, 0 à 1 en ordonnée
      const px = (x, y) => [x0 + x * kx, y0 - y * ky];
      let pente = 1.0;
      z.innerHTML = `<div class="rf-graphe"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Graphique de sin(i1) en fonction de sin(i2)"></svg></div>
        <div class="rf-ligne-cmd"><span data-a="g-fl"></span><span class="rf-val">Coefficient directeur : <b data-a="g-k"></b></span></div>
        <p class="rf-li-aide">Fais tourner la droite (glisse sa poignée, ou ± 0,01) pour qu'elle passe au plus près de tous les points : autant au-dessus qu'au-dessous.</p>
        <div class="er-actions"><button type="button" class="btn-primary" data-a="g-ok">Valider la droite</button></div><div data-a="g-ret" aria-live="polite"></div>`;
      const svg = z.querySelector('svg');
      const el = (t, a) => { const e = OPT.svgEl(t, a, svg); return e; };
      for (let x = 0; x <= 0.8 + 1e-9; x += 0.1) { const [a] = px(x, 0); el('line', { x1: a, y1: y0, x2: a, y2: y0 - ky, class: 'rf-g-grille' }); el('text', { x: a, y: y0 + 16, 'text-anchor': 'middle', class: 'rf-g-txt' }).textContent = fmt(+x.toFixed(1)); }
      for (let y = 0; y <= 1 + 1e-9; y += 0.1) { const [, b] = px(0, y); el('line', { x1: x0, y1: b, x2: x0 + 0.8 * kx, y2: b, class: 'rf-g-grille' }); el('text', { x: x0 - 6, y: b + 4, 'text-anchor': 'end', class: 'rf-g-txt' }).textContent = fmt(+y.toFixed(1)); }
      el('line', { x1: x0, y1: y0, x2: x0 + 0.8 * kx + 4, y2: y0, class: 'rf-g-axe' });
      el('line', { x1: x0, y1: y0, x2: x0, y2: y0 - ky - 4, class: 'rf-g-axe' });
      OPT.svgTexte(el('text', { x: x0 + 0.8 * kx, y: y0 + 32, 'text-anchor': 'end', class: 'rf-g-nom' }), `sin(i<sub>2</sub>)`);
      OPT.svgTexte(el('text', { x: x0 + 4, y: 14, 'text-anchor': 'start', class: 'rf-g-nom' }), `sin(i<sub>1</sub>)`);
      // points de mesure en « + », non reliés
      mesures.forEach(m => {
        const [a, b] = px(sinD(m.i2), sinD(m.i1));
        el('line', { x1: a - 5, y1: b, x2: a + 5, y2: b, class: 'rf-g-plus' });
        el('line', { x1: a, y1: b - 5, x2: a, y2: b + 5, class: 'rf-g-plus' });
      });
      const droite = el('line', { x1: x0, y1: y0, class: 'rf-g-droite' });
      const g = el('g', { class: 'opt-poignee', tabindex: '0', role: 'slider', 'aria-label': 'Poignée de la droite' });
      const zt = OPT.svgEl('circle', { r: 22, class: 'opt-poignee-zone' }, g), pt = OPT.svgEl('circle', { r: 7, class: 'opt-poignee-point' }, g);
      function placer() {
        // extrémité : bord du cadre (x = 0,8 ou y = 1)
        const xf = Math.min(0.8, 1 / pente), [a, b] = px(xf, pente * xf);
        droite.setAttribute('x2', a); droite.setAttribute('y2', b);
        const xh = xf * 0.92, [ha, hb] = px(xh, pente * xh);
        [zt, pt].forEach(c => { c.setAttribute('cx', ha); c.setAttribute('cy', hb); });
        z.querySelector('[data-a="g-k"]').textContent = fmt(pente, 2);
      }
      const regler = v => { pente = Math.max(0.5, Math.min(3, Math.round(v * 100) / 100)); placer(); z.querySelector('[data-a="g-ret"]').innerHTML = ''; };
      // glisser la poignée (souris ou doigt)
      const point = e => { const m = svg.getScreenCTM(), q = svg.createSVGPoint(); q.x = e.clientX; q.y = e.clientY; const r = q.matrixTransform(m.inverse()); return [(r.x - x0) / kx, (y0 - r.y) / ky]; };
      let id = null, fige = false;
      g.addEventListener('touchstart', e => { if (!fige && e.cancelable) e.preventDefault(); }, { passive: false });
      g.addEventListener('pointerdown', e => { if (fige) return; id = e.pointerId; try { g.setPointerCapture(id); } catch (er) { /* ignoré */ } e.preventDefault(); });
      const suivre = e => { const [x, y] = point(e); if (x > 0.02) regler(y / x); };
      g.addEventListener('pointermove', e => { if (e.pointerId === id) suivre(e); });
      g.addEventListener('pointerup', e => { if (e.pointerId === id) { suivre(e); id = null; } });
      g.addEventListener('pointercancel', () => { id = null; });
      g.addEventListener('keydown', e => { const d = { ArrowUp: 0.01, ArrowRight: 0.01, ArrowDown: -0.01, ArrowLeft: -0.01 }[e.key]; if (d && !fige) { e.preventDefault(); regler(pente + d); } });
      OPT.fleches(z.querySelector('[data-a="g-fl"]'), { moins: () => { if (!fige) regler(pente - 0.01); }, plus: () => { if (!fige) regler(pente + 0.01); }, symboles: ['− 0,01', '+ 0,01'], aria: ['Diminuer le coefficient directeur de 0,01', 'Augmenter le coefficient directeur de 0,01'] });
      placer();
      // droite de meilleur ajustement passant par l'origine (moindres carrés)
      const sxy = mesures.reduce((s, m) => s + sinD(m.i2) * sinD(m.i1), 0), sxx = mesures.reduce((s, m) => s + sinD(m.i2) ** 2, 0);
      const kOpt = sxx ? sxy / sxx : 1.51;
      let err = 0;
      z.querySelector('[data-a="g-ok"]').onclick = () => {
        if (fige) return;
        const ret = z.querySelector('[data-a="g-ret"]');
        if (Math.abs(pente - kOpt) <= 0.03) {
          fige = true; g.style.display = 'none';
          z.querySelectorAll('[data-a="g-fl"] button, [data-a="g-ok"]').forEach(b => { b.disabled = true; });
          ret.innerHTML = '';
          passer(`La droite passe par l'origine : sin(${iH(1)}) est proportionnel à sin(${iH(2)}). Son coefficient directeur vaut environ ${fmt(pente, 2)} : c'est l'indice du plexiglas, ${nH('plexi')} ≈ 1,5, car ${nH('air')} × sin(${iH(1)}) = ${nH('plexi')} × sin(${iH(2)}) avec ${nH('air')} = 1,00.`);
          return;
        }
        err++;
        ret.innerHTML = `<div class="callout-danger er-retour"><p><b class="er-ko">Ce n'est pas ça.</b> ${pente > kOpt ? 'La droite est trop raide : la plupart des points sont en dessous.' : 'La droite n\'est pas assez raide : la plupart des points sont au-dessus.'}</p>${err >= 2 ? `<p class="er-petit">Un coefficient directeur proche de ${fmt(kOpt, 2)} convient.</p>` : ''}</div>`;
      };
    }

    /* ----- Étape 7 : défi, milieu inconnu ----- */
    let defiZ = null;
    function defi() {
      const z = zoneK();
      defiZ = z;
      z.innerHTML = `<p class="rf-li-aide" data-a="d-msg"></p><div data-a="d-q"></div>`;
      majDefi();
    }
    function majDefi() {
      if (!defiZ || defiZ.dataset.pret) { if (defiZ) defiZ.querySelector('[data-a="d-msg"]').innerHTML = etat.m1 === 'air' && etat.m2 === 'inconnu' ? '' : 'Garde air (milieu 1) et milieu inconnu (milieu 2).'; return; }
      const ok = etat.m1 === 'air' && etat.m2 === 'inconnu';
      defiZ.querySelector('[data-a="d-msg"]').innerHTML = ok ? '' : 'Choisis air (milieu 1) et milieu inconnu (milieu 2).';
      if (!ok) return;
      defiZ.dataset.pret = '1';
      const q = {
        parties: [{
          type: 'nombre', q: `Règle un angle ${iH(1)} (au moins 30°), lis ${iH(2)} sur le rapporteur, puis calcule l'indice du milieu inconnu (3 chiffres significatifs).`,
          label: `${nH('inconnu')} = ${RF.fr(`${nH('air')} × sin(${iH(1)})`, `sin(${iH(2)})`)} =`, calc: true, focus: false,
          verifier(v) {
            const c = calcul();
            if (!(etat.m1 === 'air' && etat.m2 === 'inconnu')) return { format: 'Choisis air (milieu 1) et milieu inconnu (milieu 2).' };
            if (etat.i1 < 30) return { format: `Règle ${iH(1)} sur au moins 30° : la mesure sera plus précise.` };
            // lecture de i₂ au degré près : intervalle des indices possibles
            const nA = sinD(etat.i1) / sinD(c.i2 + 1), nB = sinD(etat.i1) / sinD(Math.max(1, c.i2 - 1));
            if (v >= nA - 0.01 && v <= nB + 0.01) return { ok: true };
            if (v < 1) return { diag: 'Un indice de réfraction est toujours supérieur ou égal à 1 : tu as peut-être renversé la fraction.' };
            if (Math.abs(v - etat.i1 / c.i2) <= 0.05) return { diag: `Il manque le sinus : divise sin(${iH(1)}) par sin(${iH(2)}), pas les angles.` };
            return { diag: `Calcule ${nH('air')} × sin(${iH(1)}) ÷ sin(${iH(2)}), avec ${iH(1)} = ${etat.i1}° et ${iH(2)} lu sur le rapporteur, calculatrice en degrés.` };
          },
          remplir(i) { i.value = fmt(nInconnu, 2); },
          solution: () => `Le milieu inconnu a pour indice <b>${nH('inconnu')} = ${fmt(nInconnu, 2)}</b>.`,
        }],
      };
      RF.question(defiZ.querySelector('[data-a="d-q"]'), q, { fin: () => passer() }, 'manip');
    }

    /* ----- Bilan ----- */
    function fin() {
      SOM.marquer({ fait: true });
      $('fin').innerHTML = `<div class="cle rf-bilan"><p><b class="cle-titre">Bilan.</b> Un rayon perpendiculaire à la surface n'est pas dévié. Quand ${iH(1)} augmente, ${iH(2)} augmente.</p>
          <p>Vers un milieu plus réfringent (indice plus grand), le rayon se rapproche de la normale ; vers un milieu moins réfringent, il s'en éloigne.</p>
          <p>sin(${iH(1)}) et sin(${iH(2)}) sont proportionnels : ${nH(1)} × sin(${iH(1)}) = ${nH(2)} × sin(${iH(2)}). Pour la réflexion, l'angle de réflexion est égal à ${iH(1)}.</p></div>
        ${RF.revois(['proportionnalite', 'lecture'])}
        <div class="er-actions"><button type="button" class="btn-secondary" data-a="re">↺ Recommencer</button>
          <a class="btn-primary" style="text-decoration:none" href="module_4_questions.html">Module 4 : calculer un angle ou un indice →</a></div>`;
      $('fin').querySelector('[data-a="re"]').onclick = () => simulateur(zone);
      RF.defiler($('fin'));
    }

    marquer();
    entrer();
    // pour vérifier l'application
    RF.simEnCours = { etat, regler: a => pv.regler(90 + a), calcul, nInconnu, choisir(m1, m2) { $('m1').value = m1; $('m2').value = m2; etat.m1 = m1; etat.m2 = m2; dessiner(); }, etape: () => k };
  }

  RF.simulateur = simulateur;
})();
