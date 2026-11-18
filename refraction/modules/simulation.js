/* ============================================================
   Module 2 : simulateur, le lien entre i₁ et i₂ (refaire le TP)
   RF.simulateur(zone)
   Montage du TP : la lampe, à gauche, envoie un rayon horizontal vers le centre I d'un disque gradué ;
   un demi-cylindre (plexiglas, eau dans une cuve, verre ou matériau inconnu) est posé sur le disque,
   sa face plane passe par I. On fait tourner le disque (poignée ou ◀ ▶) : i₁ change ; i₂ se lit sur
   les graduations du disque (le rayon réfracté sort du demi-cylindre sans être dévié).
   Milieu 1 : toujours l'air (l'extérieur).
   Déroulé guidé (une étape à la fois, les réponses précédentes ne restent pas affichées) :
     1. découvrir le montage (i₁ augmente → i₂ augmente ; i₁ = 0° : pas de déviation) ;
     2. mesures avec le plexiglas (tableau i₁ / i₂, i₂ lu sur le disque) ;
     3. graphique i₁ en fonction de i₂ : pas proportionnel ;
     4. graphique aux axes choisis (i, i², cos i, sin i) : sin(i₁) proportionnel à sin(i₂) ;
     5. droite qui passe par l'origine, relation sin(i₁) = k × sin(i₂), k appelé indice n ;
     6. milieu inconnu : mesurer, calculer son indice ;
     7. généraliser : choisir la relation n₁ × sin(i₁) = n₂ × sin(i₂).
   ============================================================ */
(function () {
  'use strict';

  const V = OPT.V, fmt = RF.fmt, nH = RF.nHTML, iH = RF.iHTML, sinD = RF.sinD, ecart = OPT.ecart;
  const RAD = Math.PI / 180;
  const LW = 480, LH = 400;                         // figure rectangulaire (unités)
  const RD = 172;                                   // rayon du disque gradué
  const RC = 116;                                   // rayon du demi-cylindre
  const XL = -204;                                  // sortie de la lampe
  const TP = [0, 10, 20, 30, 40, 50, 60, 80];       // valeurs de i₁ du tableau de mesures
  const MIL2 = { plexi: 'plexiglas', eau: 'eau (cuve)', verre: 'verre', inconnu: 'milieu inconnu' };
  // grandeurs proposées pour les axes du graphique (étape 4)
  const GRANDEURS = {
    i: { nom: s => iH(s), f: a => a, unite: ' (°)' },
    carre: { nom: s => `${iH(s)}<sup>2</sup>`, f: a => a * a, unite: ' (°²)' },
    cos: { nom: s => `cos(${iH(s)})`, f: a => Math.cos(a * RAD), unite: '' },
    sin: { nom: s => `sin(${iH(s)})`, f: a => Math.sin(a * RAD), unite: '' },
  };

  // pas « rond » d'un axe (1, 2, 2,5 ou 5 × 10ⁿ) pour environ 5 graduations
  function pasRond(max) {
    const brut = max / 5, p = Math.pow(10, Math.floor(Math.log10(brut)));
    return [1, 2, 2.5, 5, 10].map(k => k * p).find(x => x >= brut - 1e-12);
  }

  /* ---------- Graphique simple : points « + » non reliés, axes depuis l'origine ----------
     o = { pts: [[x, y]], xNom, yNom (HTML), aria } → { svg, px(x, y), xMax, yMax, kx, ky, x0, y0 } */
  function graphe(z, o) {
    const W = 360, H = 300, x0 = 54, y0 = 256, lx = 284, ly = 226;
    const mx = Math.max(1e-9, ...o.pts.map(p => p[0])), my = Math.max(1e-9, ...o.pts.map(p => p[1]));
    const sx = pasRond(mx), sy = pasRond(my);
    const xMax = Math.ceil(mx / sx - 1e-9) * sx, yMax = Math.ceil(my / sy - 1e-9) * sy;
    const kx = lx / xMax, ky = ly / yMax;
    const px = (x, y) => [x0 + x * kx, y0 - y * ky];
    z.innerHTML = `<div class="rf-graphe"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${o.aria || 'Graphique'}"></svg></div>`;
    const svg = z.querySelector('svg');
    const el = (t, a) => OPT.svgEl(t, a, svg);
    const txt = v => fmt(+v.toPrecision(6));
    for (let x = 0; x <= xMax + 1e-9; x += sx) { const [a] = px(x, 0); el('line', { x1: a, y1: y0, x2: a, y2: y0 - ly, class: 'rf-g-grille' }); el('text', { x: a, y: y0 + 16, 'text-anchor': 'middle', class: 'rf-g-txt' }).textContent = txt(x); }
    for (let y = 0; y <= yMax + 1e-9; y += sy) { const [, b] = px(0, y); el('line', { x1: x0, y1: b, x2: x0 + lx, y2: b, class: 'rf-g-grille' }); el('text', { x: x0 - 6, y: b + 4, 'text-anchor': 'end', class: 'rf-g-txt' }).textContent = txt(y); }
    el('line', { x1: x0, y1: y0, x2: x0 + lx + 4, y2: y0, class: 'rf-g-axe' });
    el('line', { x1: x0, y1: y0, x2: x0, y2: y0 - ly - 4, class: 'rf-g-axe' });
    OPT.svgTexte(el('text', { x: x0 + lx, y: y0 + 34, 'text-anchor': 'end', class: 'rf-g-nom' }), o.xNom);
    OPT.svgTexte(el('text', { x: x0 - 40, y: 14, 'text-anchor': 'start', class: 'rf-g-nom' }), o.yNom);
    o.pts.forEach(p => {
      const [a, b] = px(p[0], p[1]);
      el('line', { x1: a - 5, y1: b, x2: a + 5, y2: b, class: 'rf-g-plus' });
      el('line', { x1: a, y1: b - 5, x2: a, y2: b + 5, class: 'rf-g-plus' });
    });
    return { svg, el, px, xMax, yMax, kx, ky, x0, y0 };
  }

  function simulateur(zone) {
    // indice du milieu inconnu : tiré entre 1,30 et 1,70
    const nInconnu = Math.round((1.3 + Math.random() * 0.4) * 100) / 100;
    const milieu = id => (id === 'inconnu' ? Object.assign({}, RF.MILIEUX.inconnu, { n: nInconnu }) : RF.MILIEUX[id]);
    // th : rotation du disque (degrés) ; i₁ = |th|
    const etat = { m2: 'plexi', th: 25, masquerI2: false };
    const opts = Object.keys(MIL2).map(id => `<option value="${id}">${MIL2[id]}</option>`).join('');

    zone.innerHTML = `<div class="er-card">
      <div class="rf-manip rf-manip-sim">
        <div class="rf-manip-fig">
          <div class="rf-sim-reglages">
            <p class="rf-sim-m1"><span>Milieu 1 (l'extérieur)</span><b>air</b></p>
            <label>Milieu 2 (le demi-cylindre)<select class="rf-select" data-a="m2">${opts}</select></label>
          </div>
          <div class="rf-fig rf-fig-disque" style="margin-top:10px"></div>
          <div class="rf-ligne-cmd" style="margin-top:10px"><span class="rf-cmd-t">Tourner le disque</span><span data-a="fl"></span></div>
          <div class="rf-mesures" aria-live="polite" data-a="mes"></div>
        </div>
        <div class="rf-manip-panneau"><ol class="rf-deroule rf-deroule-court" data-a="deroule"></ol><div class="rf-etape" data-a="etape"></div></div>
      </div></div>`;
    const $ = a => zone.querySelector(`[data-a="${a}"]`);
    $('m2').value = etat.m2;
    const S = OPT.scene(zone.querySelector('.rf-fig'), { largeur: LW, hauteur: LH, aria: 'Simulateur : lampe, disque gradué et demi-cylindre ; le rayon passe de l\'air au demi-cylindre' });

    /* ----- Calcul et dessin ----- */
    function calcul() {
      const m2 = milieu(etat.m2), i1 = Math.abs(etat.th);
      const r = OPT.devier([1, 0], V.dir(etat.th), 1, m2.n);
      return { m2, i1, i2: r.i2, t: r.refracte };
    }
    function dessiner() {
      const c = calcul(), th = etat.th;
      ['fond', 'milieux', 'deco', 'rayons', 'arcs', 'textes'].forEach(n => S.vider(n));
      // lampe sur son banc, à gauche
      S.poly('fond', [[-236, -24], [XL, -24], [XL, 24], [-236, 24]], 'rf-lampe-boite');
      S.texte('textes', [-220, -40], 'lampe', { taille: 12, cls: 'rf-g-txt' });
      S.texte('textes', [-224, 186], 'air', { cls: 'opt-milieu-nom' });
      // disque gradué (il tourne avec le demi-cylindre)
      S.cercle('milieux', [0, 0], RD, 'rf-disque');
      const demi = OPT.demiDisque([0, 0], RC, th, 48);
      S.poly('milieux', demi, 'opt-milieu ' + (c.m2.id === 'eau' ? 'opt-fond-papier' : 'opt-fond-papier2'));
      S.rapporteur('deco', [0, 0], RD, { zero: th, taille: 10 });
      S.ligne('deco', V.mul(V.dir(th + 90), RD), V.mul(V.dir(th - 90), RD), 'rf-axe');
      S.ligne('deco', V.mul(V.dir(th), RD), V.mul(V.dir(th + 180), RD), 'opt-normale');
      S.poly('deco', demi, 'opt-bord', { fill: 'none' });
      S.ligne('deco', V.mul(V.dir(th + 90), RC), V.mul(V.dir(th - 90), RC), 'opt-surface');
      // nom du milieu 2, du côté du demi-cylindre sans rayon
      S.texte('milieux', V.mul(V.dir(th + (th >= 0 ? 50 : -50)), 70), MIL2[c.m2.id].replace(' (cuve)', ''), { cls: 'opt-milieu-nom', taille: 12 });
      // rayons : incident (fixe), réfracté dans le demi-cylindre, puis dans l'air sans déviation (il sort suivant un rayon du disque)
      S.rayon('rayons', [XL, 0], [0, 0], { fleche: 1 });
      S.rayon('rayons', [0, 0], V.mul(c.t, RC), { fleche: 1 });
      S.rayon('rayons', V.mul(c.t, RC), V.mul(c.t, RD + 16), {});
      // arcs d'angle
      if (c.i1 > 0) {
        S.arc('arcs', [0, 0], 180, 180 + th, 44, 'opt-arc-pose');
        S.etiquette('textes', V.mul(V.dir(180 + th / 2), 60), iH(1), { taille: 13 });
        if (c.i2 > 0.5) {
          const aT = V.angle(c.t);
          S.arc('arcs', [0, 0], th, aT, 44, 'opt-arc-pose');
          S.etiquette('textes', V.mul(V.dir(th + ecart(aT, th) / 2), 60), iH(2), { taille: 13 });
        }
      }
      S.cercle('textes', [0, 0], 3.5, 'opt-point');
      S.texte('textes', [-12, 14], '<b>I</b>', { taille: 14 });
      const i2T = etat.masquerI2 ? 'lis-le sur le disque' : `${fmt(c.i2, 1)}°`;
      $('mes').innerHTML = `<span>${iH(1)} (angle d'incidence) = <b>${c.i1}°</b></span><span>${iH(2)} (angle de réfraction) : <b>${i2T}</b></span>`;
      verifier();
    }

    /* ----- Commandes : tourner le disque ----- */
    const pv = OPT.pivot(S, {
      centre: [0, 0], angle: 90 + etat.th, rayon: RD, pas: 1, aria: 'Poignée du disque gradué : le faire tourner pour changer l\'angle d\'incidence',
      contraindre: a => 90 + Math.max(-85, Math.min(85, Math.round(ecart(a, 90)))),
      surChange: a => { etat.th = Math.round(a - 90); dessiner(); },
    });
    OPT.fleches($('fl'), { moins: () => pv.regler(pv.angle() - 1), plus: () => pv.regler(pv.angle() + 1), symboles: ['↻ 1°', '↺ 1°'], aria: ['Tourner le disque de 1° dans le sens des aiguilles d\'une montre', 'Tourner le disque de 1° dans l\'autre sens'] });
    $('m2').onchange = () => { etat.m2 = $('m2').value; dessiner(); };

    /* ----- Déroulé guidé : une étape à la fois ----- */
    const ETAPES = [
      { t: 'Découvre le montage', entrer: decouvrir },
      { t: 'Mesures avec le plexiglas', entrer: tableau },
      { t: `Graphique : ${iH(1)} en fonction de ${iH(2)}`, entrer: grapheAngles },
      { t: 'Chercher une relation de proportionnalité', entrer: grapheChoix },
      { t: 'Le coefficient de proportionnalité', entrer: coefficient },
      { t: 'Le milieu inconnu', entrer: defi },
      { t: 'Généraliser : deux milieux quelconques', entrer: generaliser },
    ];
    const ol = $('deroule');
    ol.innerHTML = ETAPES.map(e => `<li><span>${e.t}</span></li>`).join('');
    const lis = Array.from(ol.children);
    let k = 0, sous = 0, depart = null, mesures = [], kOpt = 1.51, pente = 1;
    let verif = null;                              // vérification propre à l'étape en cours (après chaque réglage)
    const $e = $('etape');
    function marquer() { lis.forEach((li, i) => { li.classList.toggle('fait', i < k); li.classList.toggle('ici', i === k); li.classList.toggle('avenir', i > k); }); }
    function entrer() {
      sous = 0; depart = null; verif = null;
      etat.masquerI2 = false;
      marquer();
      $e.innerHTML = `<h4 class="rf-etape-titre">${k + 1}. ${ETAPES[k].t}</h4><div class="rf-etape-corps"></div>`;
      ETAPES[k].entrer($e.querySelector('.rf-etape-corps'));
      dessiner();
      if (k > 0) RF.amener(RF.surOrdi() ? zone.querySelector('.rf-manip') : $e, 0.4);
    }
    // conclusion de l'étape, puis « Suite → » (l'étape suivante remplace celle-ci)
    function conclure(texte) {
      verif = null;
      const d = RF.el('div', 'rf-conclusion', `<div class="callout-success er-retour"><p><b class="er-ok">Bilan de l'étape.</b> ${texte}</p></div>
        <div class="er-actions"><button type="button" class="btn-primary">${k < ETAPES.length - 1 ? 'Suite →' : 'Voir le bilan →'}</button></div>`);
      $e.appendChild(d);
      d.querySelector('button').onclick = () => { k++; if (k < ETAPES.length) entrer(); else fin(); };
      RF.defiler(d);
    }
    // question à choix dans l'étape en cours
    function choix(z, q, options, bonne, diags, ok, sol) {
      const d = RF.el('div');
      z.appendChild(d);
      RF.question(d, { parties: [{ type: 'choix', q, options, bonne, indices: diags, melanger: false, colonne: true, solution: sol }] }, { fin: () => ok() }, 'manip');
      RF.defiler(d);
    }
    function verifier() { if (verif) verif(calcul()); }

    /* ----- 1. Découvrir le montage ----- */
    function decouvrir(z) {
      z.innerHTML = `<p class="rf-li-aide">La lampe envoie un rayon horizontal vers le centre I du disque gradué. La face plane du demi-cylindre passe par I ; la normale est la ligne pointillée qui passe par les graduations 0.</p>
        <p class="rf-li-aide" data-a="d-msg">Fais tourner le disque (glisse la poignée, ou ↻ ↺) : observe l'angle d'incidence ${iH(1)} et l'angle de réfraction ${iH(2)}.</p><div data-a="d-q"></div>`;
      verif = c => {
        if (depart === null) depart = c.i1;
        if (sous === 0 && Math.abs(c.i1 - depart) >= 20) {
          sous = 1;
          choix(z.querySelector('[data-a="d-q"]'), `Quand ${iH(1)} augmente, ${iH(2)} :`, [{ id: 'aug', label: 'augmente' }, { id: 'dim', label: 'diminue' }, { id: 'cst', label: 'ne change pas' }], 'aug',
            { dim: `Augmente ${iH(1)} et regarde le rayon réfracté : il s'écarte de la normale.`, cst: `Fais varier ${iH(1)} et regarde la valeur de ${iH(2)} : elle change.` },
            () => { sous = 2; z.querySelector('[data-a="d-msg"]').innerHTML = `Règle maintenant ${iH(1)} = 0°.`; verifier(); });
        } else if (sous === 2 && c.i1 === 0) {
          sous = 3;
          conclure(`Quand ${iH(1)} augmente, ${iH(2)} augmente aussi. Pour ${iH(1)} = 0°, ${iH(2)} = 0° : le rayon qui arrive perpendiculairement à la surface n'est pas dévié.`);
        }
      };
    }

    /* ----- 2. Tableau de mesures (plexiglas) ----- */
    function tableau(z) {
      etat.masquerI2 = true;
      let ligne = 0, err = 0;
      mesures = [];
      z.innerHTML = `<p class="rf-li-aide" data-a="tp-msg"></p><div class="ph-defile"><table class="ph-tableau"><thead><tr><th>${iH(1)} (°)</th><th>${iH(2)} (°)</th></tr></thead>
        <tbody>${TP.map((a, j) => `<tr data-j="${j}"><td>${a}</td><td><input type="text" class="ph-champ" inputmode="decimal" autocomplete="off" spellcheck="false" aria-label="i2 pour i1 = ${a}°" disabled></td></tr>`).join('')}</tbody></table></div>
        <div class="er-actions"><button type="button" class="btn-primary" data-a="tp-ok">Valider la mesure</button></div><div data-a="tp-ret" aria-live="polite"></div>`;
      const msg = z.querySelector('[data-a="tp-msg"]'), ret = z.querySelector('[data-a="tp-ret"]');
      function maj(c) {
        const a = TP[ligne], bon = etat.m2 === 'plexi';
        z.querySelectorAll('tr[data-j]').forEach(tr => tr.classList.toggle('rf-ligne-ici', +tr.dataset.j === ligne));
        const inp = z.querySelector(`tr[data-j="${ligne}"] input`);
        if (inp) inp.disabled = !(bon && c.i1 === a);
        msg.innerHTML = !bon ? 'Choisis le plexiglas (milieu 2).' : c.i1 !== a ? `Tourne le disque pour avoir ${iH(1)} = ${a}°.` : `Lis ${iH(2)} sur les graduations du disque (au degré près) et écris-le dans le tableau.`;
      }
      verif = maj;
      function valider() {
        const c = calcul(), a = TP[ligne], inp = z.querySelector(`tr[data-j="${ligne}"] input`);
        if (etat.m2 !== 'plexi' || c.i1 !== a) { maj(c); ret.innerHTML = `<p class="ph-msg">${msg.innerHTML}</p>`; return; }
        const v = RF.lire(inp.value);
        if (isNaN(v)) { ret.innerHTML = '<p class="ph-msg">Écris un nombre entier de degrés.</p>'; return; }
        let diag = null;
        if (Math.abs(v - c.i2) <= 1) diag = null;
        else if (a > 0 && Math.abs(v - (90 - c.i2)) <= 1.5) diag = 'Les angles se mesurent depuis la normale (graduation 0), pas depuis la surface.';
        else if (a > 0 && Math.abs(v - a) <= 1) diag = `Tu as recopié ${iH(1)} : lis l'angle du rayon réfracté, dans le demi-cylindre.`;
        else diag = `Lis ${iH(2)} entre la normale (graduation 0) et le rayon réfracté, au degré près.`;
        if (diag) {
          err++;
          ret.innerHTML = `<div class="callout-danger er-retour"><p><b class="er-ko">Ce n'est pas ça.</b> ${diag}</p>${err >= 2 ? `<p class="er-petit">Le rayon réfracté passe à ${Math.round(c.i2)}° de la normale.</p>` : ''}</div>`;
          return;
        }
        err = 0; ret.innerHTML = '';
        mesures.push({ i1: a, i2: v });
        inp.disabled = true;
        ligne++;
        if (ligne >= TP.length) {
          z.querySelector('[data-a="tp-ok"]').parentNode.remove();
          msg.innerHTML = 'Toutes les mesures sont faites.';
          etat.masquerI2 = false; dessiner();
          conclure(`Quand ${iH(1)} augmente, ${iH(2)} augmente aussi ; ${iH(2)} est toujours plus petit que ${iH(1)}.`);
        } else { maj(c); RF.defiler(z.querySelector(`tr[data-j="${ligne}"]`)); }
      }
      z.querySelector('[data-a="tp-ok"]').onclick = valider;
      z.querySelectorAll('input').forEach(i => i.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); valider(); } }));
    }
    // mesures de secours (étape atteinte sans tableau : vérification de l'application)
    const lesMesures = () => (mesures.length ? mesures : TP.map(a => ({ i1: a, i2: Math.round(OPT.refracter(1, RF.MILIEUX.plexi.n, a).i2) })));

    /* ----- 3. Graphique i₁ en fonction de i₂ ----- */
    function grapheAngles(z) {
      const m = lesMesures();
      z.innerHTML = '<div data-a="g"></div><p class="rf-li-aide">La droite en pointillés passe par l\'origine et par le point mesuré pour i<sub>1</sub> = 10°.</p><div data-a="g-q"></div>';
      const G = graphe(z.querySelector('[data-a="g"]'), { pts: m.map(p => [p.i2, p.i1]), xNom: `${iH(2)} (°)`, yNom: `${iH(1)} (°)`, aria: 'Graphique de i1 en fonction de i2' });
      const p10 = m.find(p => p.i1 === 10) || m[1];
      const kp = p10.i1 / p10.i2, xf = Math.min(G.xMax, G.yMax / kp), [a, b] = G.px(xf, kp * xf);
      G.el('line', { x1: G.x0, y1: G.y0, x2: a, y2: b, class: 'rf-g-guide' });
      choix(z.querySelector('[data-a="g-q"]'), `${iH(1)} est-il proportionnel à ${iH(2)} ?`,
        [{ id: 'non', label: 'Non : les points ne sont pas sur une droite qui passe par l\'origine.' }, { id: 'oui', label: `Oui : quand ${iH(2)} augmente, ${iH(1)} augmente aussi.` }], 'non',
        { oui: 'Les deux augmentent ensemble, mais cela ne suffit pas : pour qu\'il y ait proportionnalité, les points doivent être sur une droite qui passe par l\'origine. Regarde les derniers points : ils s\'écartent de la droite.' },
        () => conclure(`Les points ne sont pas alignés sur une droite qui passe par l'origine : ${iH(1)} n'est pas proportionnel à ${iH(2)}.`));
    }

    /* ----- 4. Graphique avec les grandeurs choisies ----- */
    function grapheChoix(z) {
      const m = lesMesures();
      const sel = (cote, s) => `<select class="rf-select" data-a="${cote}">${Object.keys(GRANDEURS).map(g => `<option value="${g}">${GRANDEURS[g].nom(s).replace(/<sub>(\d)<\/sub>/g, (x, d) => '₀₁₂'[+d]).replace('<sup>2</sup>', '²')}</option>`).join('')}</select>`;
      z.innerHTML = `<p class="rf-li-aide">Choisis la grandeur de chaque axe : cherche celles qui donnent une <b>droite qui passe par l'origine</b> (proportionnalité).</p>
        <div class="rf-sim-reglages rf-axes"><label>Axe des abscisses${sel('gx', '2')}</label><label>Axe des ordonnées${sel('gy', '1')}</label></div>
        <div data-a="g"></div><div class="er-actions"><button type="button" class="btn-primary" data-a="g-ok">C'est une droite qui passe par l'origine</button></div><div data-a="g-ret" aria-live="polite"></div>`;
      const gx = z.querySelector('[data-a="gx"]'), gy = z.querySelector('[data-a="gy"]'), ret = z.querySelector('[data-a="g-ret"]');
      let err = 0, fini = false;
      function tracer() {
        const X = GRANDEURS[gx.value], Y = GRANDEURS[gy.value];
        graphe(z.querySelector('[data-a="g"]'), { pts: m.map(p => [X.f(p.i2), Y.f(p.i1)]), xNom: X.nom('2') + X.unite, yNom: Y.nom('1') + Y.unite, aria: 'Graphique des grandeurs choisies' });
        if (!fini) ret.innerHTML = '';
      }
      gx.onchange = tracer; gy.onchange = tracer;
      tracer();
      z.querySelector('[data-a="g-ok"]').onclick = () => {
        if (fini) return;
        const x = gx.value, y = gy.value;
        if (x === 'sin' && y === 'sin') {
          fini = true; gx.disabled = true; gy.disabled = true;
          z.querySelector('[data-a="g-ok"]').disabled = true; ret.innerHTML = '';
          conclure(`sin(${iH(1)}) en fonction de sin(${iH(2)}) donne une droite qui passe par l'origine : <b>sin(${iH(1)}) est proportionnel à sin(${iH(2)})</b>.`);
          return;
        }
        err++;
        let diag;
        if (x === 'i' && y === 'i') diag = 'C\'est le graphique précédent : les points ne sont pas sur une droite qui passe par l\'origine.';
        else if (x === 'cos' || y === 'cos') diag = 'Avec un cosinus, les points ne passent pas par l\'origine : cos(0°) = 1.';
        else if (x === y) diag = 'Les points sont sur une courbe, pas sur une droite.';
        else diag = 'Les points ne sont pas alignés sur une droite qui passe par l\'origine. Essaie la même fonction pour les deux angles.';
        ret.innerHTML = `<div class="callout-danger er-retour"><p><b class="er-ko">Ce n'est pas ça.</b> ${diag}</p>${err >= 3 ? '<p class="er-petit">Essaie sin(i<sub>2</sub>) en abscisse et sin(i<sub>1</sub>) en ordonnée.</p>' : ''}</div>`;
        RF.defiler(ret);
      };
    }

    /* ----- 5. Coefficient directeur et relation sin(i₁) = n × sin(i₂) ----- */
    function coefficient(z) {
      const m = lesMesures();
      const pts = m.map(p => [sinD(p.i2), sinD(p.i1)]);
      // droite de meilleur ajustement passant par l'origine (moindres carrés)
      const sxy = pts.reduce((s, p) => s + p[0] * p[1], 0), sxx = pts.reduce((s, p) => s + p[0] * p[0], 0);
      kOpt = sxx ? sxy / sxx : 1.51;
      pente = 1;
      z.innerHTML = `<div data-a="g"></div>
        <div class="rf-ligne-cmd"><span data-a="g-fl"></span><span class="rf-val">Coefficient directeur : <b data-a="g-k"></b></span></div>
        <p class="rf-li-aide">Fais tourner la droite (glisse sa poignée, ou ± 0,01) pour qu'elle passe au plus près de tous les points : autant au-dessus qu'au-dessous.</p>
        <div class="er-actions"><button type="button" class="btn-primary" data-a="g-ok">Valider la droite</button></div><div data-a="g-ret" aria-live="polite"></div><div data-a="rel"></div>`;
      const G = graphe(z.querySelector('[data-a="g"]'), { pts, xNom: `sin(${iH(2)})`, yNom: `sin(${iH(1)})`, aria: 'Graphique de sin(i1) en fonction de sin(i2)' });
      const { svg, el, px } = G;
      const droite = el('line', { x1: G.x0, y1: G.y0, class: 'rf-g-droite' });
      const g = el('g', { class: 'opt-poignee', tabindex: '0', role: 'slider', 'aria-label': 'Poignée de la droite' });
      const zt = OPT.svgEl('circle', { r: 22, class: 'opt-poignee-zone' }, g), pt = OPT.svgEl('circle', { r: 7, class: 'opt-poignee-point' }, g);
      function placer() {
        const xf = Math.min(G.xMax, G.yMax / pente), [a, b] = px(xf, pente * xf);
        droite.setAttribute('x2', a); droite.setAttribute('y2', b);
        const xh = xf * 0.92, [ha, hb] = px(xh, pente * xh);
        [zt, pt].forEach(c => { c.setAttribute('cx', ha); c.setAttribute('cy', hb); });
        z.querySelector('[data-a="g-k"]').textContent = fmt(pente, 2);
      }
      let fige = false, err = 0;
      const regler = v => { if (fige) return; pente = Math.max(0.5, Math.min(3, Math.round(v * 100) / 100)); placer(); z.querySelector('[data-a="g-ret"]').innerHTML = ''; };
      // glisser la poignée (souris ou doigt)
      const point = e => { const mm = svg.getScreenCTM(), q = svg.createSVGPoint(); q.x = e.clientX; q.y = e.clientY; const r = q.matrixTransform(mm.inverse()); return [(r.x - G.x0) / G.kx, (G.y0 - r.y) / G.ky]; };
      let id = null;
      g.addEventListener('touchstart', e => { if (!fige && e.cancelable) e.preventDefault(); }, { passive: false });
      g.addEventListener('pointerdown', e => { if (fige) return; id = e.pointerId; try { g.setPointerCapture(id); } catch (er) { /* ignoré */ } e.preventDefault(); });
      const suivre = e => { const [x, y] = point(e); if (x > 0.02) regler(y / x); };
      g.addEventListener('pointermove', e => { if (e.pointerId === id) suivre(e); });
      g.addEventListener('pointerup', e => { if (e.pointerId === id) { suivre(e); id = null; } });
      g.addEventListener('pointercancel', () => { id = null; });
      g.addEventListener('keydown', e => { const d = { ArrowUp: 0.01, ArrowRight: 0.01, ArrowDown: -0.01, ArrowLeft: -0.01 }[e.key]; if (d) { e.preventDefault(); regler(pente + d); } });
      OPT.fleches(z.querySelector('[data-a="g-fl"]'), { moins: () => regler(pente - 0.01), plus: () => regler(pente + 0.01), symboles: ['− 0,01', '+ 0,01'], aria: ['Diminuer le coefficient directeur de 0,01', 'Augmenter le coefficient directeur de 0,01'] });
      placer();
      z.querySelector('[data-a="g-ok"]').onclick = () => {
        if (fige) return;
        const ret = z.querySelector('[data-a="g-ret"]');
        if (Math.abs(pente - kOpt) <= 0.03) {
          fige = true; g.style.display = 'none';
          z.querySelectorAll('[data-a="g-fl"] button, [data-a="g-ok"]').forEach(b => { b.disabled = true; });
          ret.innerHTML = `<p class="ph-ok">✓ La droite passe par l'origine, son coefficient directeur vaut ${fmt(pente, 2)}.</p>`;
          relation(z.querySelector('[data-a="rel"]'));
          return;
        }
        err++;
        ret.innerHTML = `<div class="callout-danger er-retour"><p><b class="er-ko">Ce n'est pas ça.</b> ${pente > kOpt ? 'La droite est trop raide : la plupart des points sont en dessous.' : 'La droite n\'est pas assez raide : la plupart des points sont au-dessus.'}</p>${err >= 2 ? `<p class="er-petit">Un coefficient directeur proche de ${fmt(kOpt, 2)} convient.</p>` : ''}</div>`;
      };
    }
    // relation de proportionnalité sin(i₁) = k × sin(i₂)
    function relation(z) {
      const q = { parties: [{
        type: 'nombre', q: 'Écris la relation de proportionnalité entre sin(i<sub>1</sub>) et sin(i<sub>2</sub>), avec le coefficient directeur de ta droite.',
        label: `sin(${iH(1)}) =`, unite: `× sin(${iH(2)})`, focus: false,
        verifier(v) {
          if (Math.abs(v - pente) <= 0.011 || Math.abs(v - kOpt) <= 0.03) return { ok: true };
          if (Math.abs(v - 1 / pente) <= 0.02) return { diag: `C'est l'inverse : sin(${iH(1)}) est sur l'axe des ordonnées, sin(${iH(1)}) = coefficient directeur × sin(${iH(2)}).` };
          return { diag: `Le coefficient directeur de ta droite vaut ${fmt(pente, 2)} : sin(${iH(1)}) = ${fmt(pente, 2)} × sin(${iH(2)}).` };
        },
        remplir(i) { i.value = fmt(pente, 2); },
        solution: () => `sin(${iH(1)}) = ${fmt(pente, 2)} × sin(${iH(2)})`,
      }] };
      RF.question(z, q, { fin: () => conclure(`sin(${iH(1)}) = ${fmt(pente, 2)} × sin(${iH(2)}). On choisit d'appeler ce coefficient de proportionnalité <b>n</b>, l'<b>indice de réfraction</b> du milieu : sin(${iH(1)}) = n × sin(${iH(2)}), avec ${nH('plexi')} ≈ ${fmt(RF.MILIEUX.plexi.n, 2)} pour le plexiglas.`) }, 'manip');
      RF.defiler(z);
    }

    /* ----- 6. Le milieu inconnu ----- */
    function defi(z) {
      etat.masquerI2 = true;
      z.innerHTML = `<p class="rf-li-aide" data-a="d-msg"></p><div data-a="d-q"></div>`;
      const msg = z.querySelector('[data-a="d-msg"]');
      let pose = false;
      verif = () => {
        const ok = etat.m2 === 'inconnu';
        msg.innerHTML = ok ? '' : 'Choisis le milieu inconnu (milieu 2).';
        if (!ok || pose) return;
        pose = true;
        const q = { parties: [{
          type: 'nombre', q: `Règle un angle ${iH(1)} d'au moins 30°, lis ${iH(2)} sur le disque, puis calcule l'indice du milieu inconnu (3 chiffres significatifs).`,
          label: `${nH('inconnu')} = ${RF.fr(`sin(${iH(1)})`, `sin(${iH(2)})`)} =`, calc: true, focus: false,
          aide: `Avec l'air, sin(${iH(1)}) = n × sin(${iH(2)}) : on divise sin(${iH(1)}) par sin(${iH(2)}). Calculatrice en degrés.`,
          avant: zz => RF.aideDegres(zz),
          verifier(v) {
            const c = calcul();
            if (etat.m2 !== 'inconnu') return { format: 'Choisis le milieu inconnu (milieu 2).' };
            if (c.i1 < 30) return { format: `Règle ${iH(1)} sur au moins 30° : la mesure sera plus précise.` };
            // lecture de i₂ au degré près : intervalle des indices possibles
            const nA = sinD(c.i1) / sinD(c.i2 + 1), nB = sinD(c.i1) / sinD(Math.max(1, c.i2 - 1));
            if (v >= nA - 0.01 && v <= nB + 0.01) return { ok: true };
            if (v < 1) return { diag: 'Un indice de réfraction est toujours supérieur ou égal à 1 : tu as peut-être renversé la fraction.' };
            if (Math.abs(v - c.i1 / c.i2) <= 0.05) return { diag: `Il manque le sinus : divise sin(${iH(1)}) par sin(${iH(2)}), pas les angles.` };
            return { diag: `Calcule sin(${iH(1)}) ÷ sin(${iH(2)}), avec ${iH(1)} = ${c.i1}° et ${iH(2)} lu sur le disque, calculatrice en degrés.` };
          },
          remplir(i) { i.value = fmt(nInconnu, 2); },
          solution: () => `Le milieu inconnu a pour indice <b>${nH('inconnu')} = ${fmt(nInconnu, 2)}</b>.`,
        }] };
        RF.question(z.querySelector('[data-a="d-q"]'), q, { fin: () => { etat.masquerI2 = false; dessiner(); conclure(`En mesurant ${iH(1)} et ${iH(2)}, on trouve l'indice d'un milieu : ${nH('inconnu')} = sin(${iH(1)}) / sin(${iH(2)}) ≈ ${fmt(nInconnu, 2)}.`); } }, 'manip');
      };
    }

    /* ----- 7. Généraliser : deux milieux quelconques ----- */
    function generaliser(z) {
      z.innerHTML = `<p class="rf-li-aide">On donne aussi un indice à l'air : ${nH('air')} = 1,00. Quand la lumière passe d'un milieu 1 d'indice ${nH(1)} à un milieu 2 d'indice ${nH(2)}, quelle relation est juste ?</p><div data-a="g-q"></div>`;
      const sym = 'Si on échange les milieux 1 et 2 (la lumière peut faire le chemin inverse), la relation doit rester la même : n<sub>1</sub> va donc avec sin(i<sub>1</sub>), comme n<sub>2</sub> avec sin(i<sub>2</sub>).';
      const d = RF.el('div');
      z.querySelector('[data-a="g-q"]').appendChild(d);
      RF.question(d, { parties: [{
        type: 'choix', q: 'La relation entre les deux milieux :', colonne: true,
        options: [
          { id: 'ok', label: `${nH(1)} × sin(${iH(1)}) = ${nH(2)} × sin(${iH(2)})` },
          { id: 'inv', label: `${nH(2)} × sin(${iH(1)}) = ${nH(1)} × sin(${iH(2)})` },
          { id: 'prod', label: `sin(${iH(1)}) = ${nH(1)} × ${nH(2)} × sin(${iH(2)})` },
          { id: 'sans', label: `sin(${iH(1)}) = ${nH(2)} × sin(${iH(2)})` },
        ],
        bonne: 'ok',
        indices: {
          inv: `Avec l'air, on a trouvé sin(${iH(1)}) = n × sin(${iH(2)}) : l'indice du milieu 2 est du même côté que sin(${iH(2)}), comme vu précédemment. Ici, ${nH(2)} est du côté de sin(${iH(1)}).`,
          prod: `${nH(2)} est bien du même côté que sin(${iH(2)}), comme vu précédemment. ${sym}`,
          sans: `C'est la relation trouvée quand le milieu 1 est l'air (${nH('air')} = 1,00). Si le milieu 1 n'est pas de l'air, son indice compte aussi. ${sym}`,
        },
      }] }, { fin: () => conclure(`C'est la <b>loi de Snell-Descartes</b> pour la réfraction : <b>${nH(1)} × sin(${iH(1)}) = ${nH(2)} × sin(${iH(2)})</b>. Avec l'air comme milieu 1 (${nH('air')} = 1,00), on retrouve sin(${iH(1)}) = ${nH(2)} × sin(${iH(2)}).`) }, 'manip');
    }

    /* ----- Bilan ----- */
    function fin() {
      k = ETAPES.length; marquer();
      SOM.marquer({ fait: true });
      $e.innerHTML = `<div class="cle rf-bilan"><p><b class="cle-titre">Bilan.</b> Un rayon perpendiculaire à la surface n'est pas dévié. Quand ${iH(1)} augmente, ${iH(2)} augmente, mais ${iH(1)} n'est pas proportionnel à ${iH(2)}.</p>
          <p>De l'air vers un milieu transparent : sin(${iH(1)}) = n × sin(${iH(2)}) ; n est l'<b>indice de réfraction</b> du milieu (${nH('air')} = 1,00).</p>
          <p>Entre deux milieux quelconques : <b>${nH(1)} × sin(${iH(1)}) = ${nH(2)} × sin(${iH(2)})</b> (loi de Snell-Descartes).</p></div>
        ${RF.revois(['proportionnalite'])}
        <div class="er-actions"><button type="button" class="btn-secondary" data-a="re">↺ Recommencer</button>
          <a class="btn-primary" style="text-decoration:none" href="module_3a_cours.html">Module 3 : la loi de Descartes →</a></div>`;
      $e.querySelector('[data-a="re"]').onclick = () => simulateur(zone);
      RF.defiler($e);
    }

    entrer();
    // pour vérifier l'application
    RF.simEnCours = {
      etat, calcul, nInconnu, etape: () => k, mesures: () => mesures, kOpt: () => kOpt,
      regler: a => pv.regler(90 + a),
      choisir(m2) { $('m2').value = m2; etat.m2 = m2; dessiner(); },
    };
  }

  RF.simulateur = simulateur;
})();
