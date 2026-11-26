/* ============================================================
   Simulateur « déviation dans un condensateur » (module 4, page sur un écran)

   CU.simDeviation(zone) : tension U, polarité (armature du haut + ou −),
   distance L entre les armatures, longueur ℓ des armatures, particule
   (électron, proton, particule α, ion Na⁺), vitesse d'entrée v₀ (échelle
   logarithmique) et angle α se règlent à tout moment. La trajectoire est
   recalculée en direct : parabole entre les armatures (a = qE / m, poids
   négligé), choc sur une armature ou sortie, puis mouvement rectiligne
   uniforme. Valeurs en continu : E = U / L, F = |q| E, P = m g, F / P,
   a (et a / g : l'analogie avec la chute libre), durée de traversée,
   déviation à la sortie.
   Défis « À essayer » (n'importe quel ordre, cochés tout seuls) : faire
   sortir l'électron sans toucher, inverser la déviation, vérifier que le
   poids est négligeable (U = 0), trouver la masse de l'électron à partir
   d'une déviation mesurée (exercice 14 : champ de saisie dans « Valeurs »).
   ============================================================ */
(function () {
  'use strict';
  const CU = window.CU;
  const { fmt, cs, sci, fl, nom, txt, COUL, ENCRE, ENCRE2, ENCRE3, V } = CU;
  const G = 9.81;
  const PARTS = [
    { id: 'e', nom: 'électron', q: -1, m: CU.M_E, mTxt: '9,11 × 10<sup>−31</sup> kg' },
    { id: 'p', nom: 'proton', q: 1, m: CU.M_P, mTxt: '1,67 × 10<sup>−27</sup> kg' },
    { id: 'alpha', nom: 'particule α', q: 2, m: 6.64e-27, mTxt: '6,64 × 10<sup>−27</sup> kg' },
    { id: 'na', nom: 'ion Na<sup>+</sup>', q: 1, m: 3.82e-26, mTxt: '3,82 × 10<sup>−26</sup> kg' },
  ];
  // nombre court : écriture scientifique hors de [0,01 ; 10 000[
  const nb = (v, c) => (v === 0 ? '0' : Math.abs(v) >= 1e4 || Math.abs(v) < 1e-2 ? sci(v, c || 2) : cs(v, c || 2));

  function simDeviation(zone) {
    const st = { U: 400, haut: '+', L: 4, l: 10, part: 'p', lv: 6, al: 0, signes: {} };
    const c = CU.cadre(zone, {
      badge: 'MODULE 4 · SIMULATEUR', titre: 'Déviation dans un condensateur',
      bande: '<p class="cu-eqs" data-a="analogie"></p>',
      bas: '<p class="cu-valeurs" data-a="resume" aria-live="polite"></p>',
      onglets: [{ id: 'reg', nom: 'Réglages', sections: ['reg'] }, { id: 'val', nom: 'Valeurs', sections: ['val'] }, { id: 'defis', nom: 'Défis', sections: ['defis'] }, { id: 'bilan', nom: 'Bilan', sections: ['bilan'] }],
      sections: [
        { id: 'reg', html: `<div class="cu-reglages">${CU.reglage({ id: 'U', nom: 'U (V)', min: 0, max: 2000, pas: 10, val: st.U, aria: 'Tension' })}${CU.reglage({ id: 'L', nom: 'L (cm)', min: 1, max: 8, pas: .5, val: st.L, aria: 'Distance entre les armatures' })}
            ${CU.reglage({ id: 'l', nom: 'ℓ (cm)', min: 2, max: 15, pas: .5, val: st.l, aria: 'Longueur des armatures' })}${CU.reglage({ id: 'al', nom: 'α (°)', min: -30, max: 30, pas: 1, val: st.al, aria: 'Angle de la vitesse d\'entrée' })}</div>
            ${CU.reglage({ id: 'lv', nom: 'v<sub>0</sub> (m·s<sup>−1</sup>)', min: 4, max: 8, pas: .01, val: st.lv, aria: 'Vitesse d\'entrée, échelle logarithmique' })}
            <p class="cu-lab">Armature du haut</p><div class="cu-seg" role="group" aria-label="Polarité">${['+', '−'].map(s => `<button type="button" data-haut="${s}" aria-pressed="${s === st.haut}">${s === '+' ? '+ (positive)' : '− (négative)'}</button>`).join('')}</div>
            <p class="cu-lab">Particule</p><div class="cu-seg" role="group" aria-label="Particule">${PARTS.map(p => `<button type="button" data-part="${p.id}" aria-pressed="${p.id === st.part}">${p.nom}</button>`).join('')}</div>` },
        { id: 'val', html: `<div class="cu-valeurs" data-a="valeurs"></div>
            <div class="cle cu-masse"><p><b>Masse de l'électron</b> (exercice 14) : à partir de la déviation mesurée, m = e U ℓ<sup>2</sup> / (2 L v<sub>0</sub><sup>2</sup> z<sub>S</sub>).</p>
              <p class="cu-at-champs">m = <span data-a="chM"></span> × 10<sup>−31</sup> kg <button type="button" class="btn-small" data-a="okM">Vérifier</button></p><p class="cu-petit" data-a="msgM" aria-live="polite"></p></div>` },
        { id: 'defis', html: '<div data-a="defis"></div>' },
        { id: 'bilan', html: `<div class="cu-bilan"><div class="cle"><p>Entre les armatures : ${V('E')} uniforme, de + vers −, E = U / L ; ${V('F', 'él')} = q ${V('E')} ; le poids est négligeable (F / P de l'ordre de 10<sup>12</sup> et plus).</p></div>
            <div class="cle"><p>${V('a')} = q ${V('E')} / m est constante : trajectoire parabolique, comme une chute libre où g serait remplacé par qE / m. q > 0 : déviation vers l'armature − ; q < 0 : vers l'armature +.</p></div>
            <div class="cle"><p>Sortie : le point S est au bout des armatures, x(t<sub>S</sub>) = ℓ donne t<sub>S</sub>, puis z<sub>S</sub> = z(t<sub>S</sub>) ; ensuite, plus aucune force : mouvement rectiligne uniforme.</p></div></div>` },
      ],
      surOnglet: id => { if (id === 'bilan') window.SOM.marquer({ fait: true }); },
    });
    const $ = c.$;
    const champM = CU.champ({ signe: false, petit: true, aria: 'Masse de l\'électron, en 10 puissance moins 31 kg' });
    $('chM').appendChild(champM.el);
    const part = () => PARTS.find(p => p.id === st.part);

    /* ---------- Modèle (unités SI ; z vers le haut, entrée en O au milieu) ---------- */
    function modele() {
      const p = part(), q = p.q * CU.E_CH, L = st.L / 100, l = st.l / 100, v0 = Math.pow(10, st.lv), a0 = st.al * Math.PI / 180;
      const E = st.U / L, sensE = st.haut === '+' ? -1 : 1;            // E⃗ vers le bas si l'armature du haut est +
      const az = q * E * sensE / p.m, vx = v0 * Math.cos(a0), vz0 = v0 * Math.sin(a0);
      const z = t => vz0 * t + az * t * t / 2;
      // instant du choc sur une armature (|z| = L/2), s'il a lieu avant la sortie
      const tl = l / vx;
      let tChoc = null;
      [L / 2, -L / 2].forEach(zp => {
        const A = az / 2, B = vz0, C = -zp;
        let ts = [];
        if (Math.abs(A) < 1e-30) { if (Math.abs(B) > 1e-30) ts = [-C / B]; } else { const D = B * B - 4 * A * C; if (D >= 0) ts = [(-B - Math.sqrt(D)) / (2 * A), (-B + Math.sqrt(D)) / (2 * A)]; }
        ts.filter(t => t > 1e-15 && t <= tl).forEach(t => { if (tChoc == null || t < tChoc) tChoc = t; });
      });
      const zP = -G * tl * tl / 2;                                        // déviation due au poids seul pendant la traversée
      return { p, q, L, l, v0, E, az, vx, vz0, z, tl, tChoc, zS: tChoc == null ? z(tl) : null, vzS: vz0 + az * tl, F: Math.abs(q) * E, P: p.m * G, zP, sensE };
    }

    /* ---------- Dessin ---------- */
    function dessiner() {
      const m = modele(), r = c.fig.getBoundingClientRect(), W = Math.max(240, r.width), H = Math.max(150, r.height);
      const Xw = m.l * 1.45, Zw = m.L * 1.5, mg = 26;
      const s = Math.min((W - 2 * mg) / Xw, (H - 2 * mg) / Zw);
      const x0 = mg + 14, zc = H / 2, px = x => x0 + x * s, pz = z => zc - z * s;
      let d = `<rect width="${W}" height="${H}" fill="#fff"/>`;
      const haut = st.haut === '+';
      [[m.L / 2, haut ? '+' : '−', -1], [-m.L / 2, haut ? '−' : '+', 1]].forEach(([z, sg, k]) => {
        d += `<rect x="${px(0)}" y="${pz(z) - (k < 0 ? 6 : 0)}" width="${m.l * s}" height="6" rx="2" fill="#ebe8e1" stroke="${ENCRE2}"/>`;
        if (st.U > 0) for (let i = 0; i < 6; i++) d += txt(px(m.l * (i + .5) / 6), pz(z) + (k < 0 ? -10 : 20), sg, { g: 800, c: ENCRE, t: 14, a: 'middle' });
      });
      // champ (si U ≠ 0) et flèche de U (vers l'armature +)
      if (st.U > 0) {
        const xe = px(m.l * .85), dz = Math.min(m.L * s * .3, 40) * (haut ? 1 : -1);
        d += fl(xe, zc - dz, xe, zc + dz, COUL.E, { ep: 2.2 }) + nom(xe + 14, zc + 4, 'E', '', COUL.E, { t: 13 });
        const xu = Math.min(W - 70, px(m.l) + 44), h2 = m.L * s / 2 - 6;
        d += fl(xu, zc + (haut ? h2 : -h2), xu, zc - (haut ? h2 : -h2), ENCRE, { ep: 1.4, lt: 7 }) + txt(xu + 6, zc + 4, `U = ${fmt(st.U)} V`, { g: 800, c: ENCRE, t: 11 });
      }
      d += `<line x1="${px(-.1 * m.l)}" y1="${zc}" x2="${W - 4}" y2="${zc}" stroke="${ENCRE3}" stroke-dasharray="3 4"/>` + txt(px(0) - 6, zc + 14, 'O', { g: 800, c: ENCRE, t: 12, a: 'end' });
      // trajectoire : parabole jusqu'au choc ou à la sortie, puis droite
      const tf = m.tChoc != null ? m.tChoc : m.tl;
      let tr = `M${px(0)},${pz(0)}`;
      for (let k = 1; k <= 80; k++) { const t = tf * k / 80; tr += `L${px(m.vx * t).toFixed(1)},${pz(m.z(t)).toFixed(1)}`; }
      if (m.tChoc == null) {
        const xFin = (W - 6 - x0) / s, t2 = (xFin - m.l) / m.vx, zFin = m.zS + m.vzS * t2;
        tr += `L${px(xFin).toFixed(1)},${pz(Math.max(-H, Math.min(H, zFin))).toFixed(1)}`;
      }
      d += `<path d="${tr}" fill="none" stroke="${COUL.traj}" stroke-width="2.4"/>`;
      if (m.tChoc != null) { const xc = px(m.vx * m.tChoc), zc2 = pz(m.z(m.tChoc)); d += `<path d="M${xc - 6},${zc2 - 6}l12,12m0,-12l-12,12" stroke="${ENCRE}" stroke-width="2.4"/>`; }
      else d += `<circle cx="${px(m.l)}" cy="${pz(m.zS)}" r="3.5" fill="${ENCRE}"/>` + txt(px(m.l) + 6, pz(m.zS) + (m.zS > 0 ? -6 : 14), 'S', { g: 800, c: ENCRE, t: 12 });
      // particule à l'entrée et sa vitesse
      d += `<circle cx="${px(0)}" cy="${zc}" r="6" fill="${m.p.q > 0 ? '#fff' : ENCRE}" stroke="${ENCRE}" stroke-width="1.6"/>` + txt(px(0), zc + 3.5, m.p.q > 0 ? '+' : '−', { g: 800, c: m.p.q > 0 ? ENCRE : '#fff', t: 10, a: 'middle' });
      const a0 = st.al * Math.PI / 180;
      d += fl(px(0) - 46 * Math.cos(a0), zc + 46 * Math.sin(a0), px(0) - 8 * Math.cos(a0), zc + 8 * Math.sin(a0), COUL.v, { ep: 2.2 }) + nom(px(0) - 34, zc - 12, 'v', '0', COUL.v, { t: 12 });
      if (!c.fig.querySelector('svg')) c.fig.innerHTML = '<svg class="cu-sim-svg" role="img" aria-label="Condensateur plan et trajectoire de la particule chargée"></svg>';
      const sv = c.fig.querySelector('svg');
      sv.setAttribute('viewBox', `0 0 ${W} ${H}`);
      sv.innerHTML = d;
      textes(m);
    }
    function textes(m) {
      const vers = m.az === 0 ? 'pas de déviation' : m.az > 0 ? 'déviée vers le haut' : 'déviée vers le bas';
      $('resume').innerHTML = `${m.p.nom[0].toUpperCase() + m.p.nom.slice(1)} (q = ${m.p.q > 0 ? (m.p.q === 2 ? '2e' : 'e') : '−e'}), v<sub>0</sub> = <b>${sci(m.v0, 2)} m·s<sup>−1</sup></b> : ${vers} ; ` +
        (m.tChoc != null ? `<b>elle heurte l'armature ${m.z(m.tChoc) > 0 ? 'du haut' : 'du bas'}</b> à x = ${cs(m.vx * m.tChoc * 100, 2)} cm.` : `elle sort en S avec z<sub>S</sub> = <b>${cs(m.zS * 1000, 3)} mm</b>.`);
      $('analogie').innerHTML = `Comme une chute libre où g serait remplacé par |q|E / m = <b>${nb(Math.abs(m.az))} m·s<sup>−2</sup></b>, soit ${nb(Math.abs(m.az) / G)} fois g. z(x) = ${m.az > 0 ? '+' : m.az < 0 ? '−' : ''}${nb(Math.abs(m.az) / (2 * m.vx * m.vx))} x<sup>2</sup>${st.al ? ` ${st.al > 0 ? '+' : '−'} ${cs(Math.abs(Math.tan(st.al * Math.PI / 180)), 3)} x` : ''} (en m)`;
      $('valeurs').innerHTML = `<p>E = U / L = <b>${nb(m.E)} V·m<sup>−1</sup></b></p><p>F<sub>él</sub> = |q| E = <b>${nb(m.F)} N</b></p><p>P = m g = <b>${nb(m.P)} N</b> (m = ${m.p.mTxt})</p>
        <p>F<sub>él</sub> / P = <b>${m.F ? nb(m.F / m.P, 1) : '0'}</b></p><p>a = |q| E / m = <b>${nb(Math.abs(m.az))} m·s<sup>−2</sup></b></p><p>durée de traversée : <b>${nb(m.tl)} s</b></p>
        <p>déviation due au poids seul pendant la traversée : ${nb(Math.abs(m.zP))} m</p>`;
    }

    /* ---------- Réglages ---------- */
    function majReglages() {
      zone.querySelector('[data-v="U"]').textContent = fmt(st.U);
      zone.querySelector('[data-v="L"]').textContent = fmt(st.L);
      zone.querySelector('[data-v="l"]').textContent = fmt(st.l);
      zone.querySelector('[data-v="al"]').textContent = String(st.al).replace('-', '−');
      zone.querySelector('[data-v="lv"]').innerHTML = sci(Math.pow(10, st.lv), 2);
      zone.querySelectorAll('[data-haut]').forEach(b => b.setAttribute('aria-pressed', b.dataset.haut === st.haut));
      zone.querySelectorAll('[data-part]').forEach(b => b.setAttribute('aria-pressed', b.dataset.part === st.part));
    }
    function regler(k, v) {
      st[k] = v;
      const i = zone.querySelector(`[data-r="${k}"]`); if (i && +i.value !== v) i.value = v;
      majReglages(); dessiner(); verifier();
    }
    zone.querySelectorAll('[data-r]').forEach(i => { i.addEventListener('input', () => regler(i.dataset.r, +i.value)); });
    zone.querySelectorAll('[data-haut]').forEach(b => { b.onclick = () => regler('haut', b.dataset.haut); });
    zone.querySelectorAll('[data-part]').forEach(b => { b.onclick = () => regler('part', b.dataset.part); });

    /* ---------- Masse de l'électron (exercice 14) ---------- */
    let masseOk = false;
    const situation14 = () => st.part === 'e' && st.U === 400 && st.L === 4 && st.l === 10 && Math.abs(Math.pow(10, st.lv) - 2.5e7) < .02e7 && st.al === 0;
    $('okM').onclick = () => {
      const v = CU.lire(champM.input.value);
      if (isNaN(v)) { $('msgM').textContent = 'Écris un nombre (avec une virgule si besoin).'; return; }
      if (!situation14()) { $('msgM').innerHTML = 'Prépare d\'abord la situation de l\'exercice 14 (défi 4, bouton « Essayer ») : U = 400 V, L = 4,0 cm, ℓ = 10 cm, v<sub>0</sub> = 2,5 × 10<sup>7</sup> m·s<sup>−1</sup>.'; return; }
      if (Math.abs(v - 9.11) <= .25) { masseOk = true; $('msgM').innerHTML = '<b class="cu-ok">Juste !</b> m = e U ℓ<sup>2</sup> / (2 L v<sub>0</sub><sup>2</sup> z<sub>S</sub>) ≈ 9,1 × 10<sup>−31</sup> kg, proche de la valeur admise aujourd\'hui (9,11 × 10<sup>−31</sup> kg).'; verifier(); return; }
      $('msgM').innerHTML = Math.abs(v - 9.11 * 1e3) < 300 ? 'Attention aux unités : z<sub>S</sub> en mètres (14 mm = 1,4 × 10<sup>−2</sup> m).' : 'Ce n\'est pas ça : lis z<sub>S</sub> (en m) et utilise m = e U ℓ<sup>2</sup> / (2 L v<sub>0</sub><sup>2</sup> z<sub>S</sub>), toutes les longueurs en mètres.';
    };

    /* ---------- Défis ---------- */
    const prep = o => () => { Object.keys(o).forEach(k => { st[k] = o[k]; const i = zone.querySelector(`[data-r="${k}"]`); if (i) i.value = o[k]; }); majReglages(); dessiner(); verifier(); if (c.tel()) c.onglet('reg'); };
    const defis = CU.defis($('defis'), [
      { t: 'Fais <b>sortir l\'électron sans qu\'il touche</b> une armature, avec une déviation d\'au moins un quart de L / 2 (règle U ou v<sub>0</sub>).', preparer: prep({ part: 'e', U: 1500, L: 3, l: 12, lv: 7, al: 0, haut: '+' }),
        ok: () => { const m = modele(); return st.part === 'e' && m.tChoc == null && Math.abs(m.zS) >= m.L / 8; } },
      { t: '<b>Inverse la déviation</b> d\'une même particule : observe-la déviée vers le haut, puis vers le bas.', preparer: prep({ part: 'p', U: 800, L: 4, l: 8, lv: 6, al: 0 }),
        ok: () => { const s = st.signes[st.part] || {}; return s.h && s.b; } },
      { t: 'Vérifie que le <b>poids est négligeable</b> : mets U = 0 et regarde la déviation due au poids seul (onglet « Valeurs »).', preparer: prep({ part: 'e', U: 200 }),
        ok: () => st.U === 0 },
      { t: '<b>Masse de l\'électron</b> (exercice 14) : avec la déviation z<sub>S</sub> mesurée, calcule m (onglet « Valeurs »).', preparer: () => { prep({ part: 'e', U: 400, L: 4, l: 10, lv: Math.log10(2.5e7), al: 0, haut: '+' })(); c.onglet('val'); },
        ok: () => masseOk },
    ], { bilan: '<b>Tous les défis sont réussis !</b> Ouvre le « Bilan ».', surReussite: () => { if (c.tel()) setTimeout(() => c.onglet('defis'), 0); } });
    function verifier() {
      const m = modele();
      if (st.U > 0 && Math.abs(m.az) > 0) { const s = st.signes[st.part] = st.signes[st.part] || {}; s[m.az > 0 ? 'h' : 'b'] = true; }
      defis.verifier();
    }

    const redim = () => dessiner();
    if (window.ResizeObserver) new ResizeObserver(redim).observe(c.fig); else addEventListener('resize', redim);
    majReglages(); dessiner(); verifier();
    CU.simDevEtat = st;               // (utile pour vérifier l'application)
  }

  CU.simDeviation = simDeviation;
})();
