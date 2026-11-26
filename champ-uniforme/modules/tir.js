/* ============================================================
   Simulateur « tir dans le champ de pesanteur » (module 3, page sur un écran)

   CU.simTir(zone) : v₀, α, h, g (Terre, Lune, Mars, comète 67P) et l'objet
   lancé se règlent à tout moment ; la trajectoire (parabole) est recalculée
   en direct ; la balle se lance (Lecture / Pause, Pas à pas, vitesse,
   ↺ Recommencer) avec ses vecteurs v⃗ (orange) et a⃗ = g⃗ (bleu), en un point
   ou en plusieurs (option) ; t, x, y, vₓ, v_y s'affichent en continu.
   Équations horaires et équation de la trajectoire écrites avec les valeurs
   (bande au-dessus de la figure) ; courbes vₓ(t), v_y(t), x(t), y(t)
   (onglet « Courbes ») ; cible : panier de basket ou but de football.
   Défis « À essayer », dans n'importe quel ordre (cochés tout seuls) :
   panier, sous la barre, portée maximale (45° pour h = 0), v_y nulle au
   sommet, vₓ constante, bille et plume. Bilan ouvrable à tout moment.
   prefers-reduced-motion : pas d'animation automatique, avance par étapes.
   ============================================================ */
(function () {
  'use strict';
  const CU = window.CU;
  const { fmt, cs, fl, nom, txt, COUL, ENCRE, ENCRE2, ENCRE3, V, MS, MS2 } = CU;
  const reduit = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const rad = d => d * Math.PI / 180;
  const ASTRES = [{ id: 'terre', nom: 'Terre', g: 9.81 }, { id: 'lune', nom: 'Lune', g: 1.62 }, { id: 'mars', nom: 'Mars', g: 3.71 }, { id: 'comete', nom: 'Comète 67P', g: 2e-4 }];
  const OBJETS = [{ id: 'bille', nom: 'bille (5 g)' }, { id: 'plume', nom: 'plume (0,1 g)' }, { id: 'boulet', nom: 'boulet (5 kg)' }];
  // cibles : panier (cercle à 3,0 m, à 4,6 m du lanceur), but (barre transversale à 2,44 m, à 16 m)
  const CIBLES = { aucune: null, panier: { x: 4.6, y: 3.0 }, but: { x: 16, y: 2.44 } };
  // nombre écrit avec 3 chiffres significatifs au plus (petits nombres : écriture scientifique)
  const n3 = v => (Math.abs(v) < 1e-3 && v !== 0 ? CU.sci(v, 2) : fmt(+v.toPrecision(3)));

  function simTir(zone) {
    const st = { v0: 8, al: 50, h: 2, astre: 'terre', objet: 'bille', cible: 'panier', t: 0, joue: false, vit: 1, plusieurs: false, courbe: 'y', lances: [] };
    const c = CU.cadre(zone, {
      badge: 'MODULE 3 · SIMULATEUR', titre: 'Tir dans le champ de pesanteur',
      bande: '<div class="cu-eqs" data-a="eqs"></div>',
      bas: `<div class="cu-anim-ctrl"><button type="button" class="btn-primary cu-lire" data-a="lire">▶ Lancer</button><button type="button" class="btn-secondary" data-a="pas">Pas à pas</button>
          <button type="button" class="btn-secondary" data-a="re">↺ Recommencer</button>
          <span class="cu-seg" role="group" aria-label="Vitesse de l'animation">${[0.5, 1, 2].map(v => `<button type="button" data-vit="${v}" aria-pressed="${v === 1}">× ${fmt(v)}</button>`).join('')}</span></div>
        <p class="cu-valeurs" data-a="val" aria-live="off"></p>`,
      onglets: [{ id: 'reg', nom: 'Réglages', sections: ['reg'] }, { id: 'courbes', nom: 'Courbes', sections: ['courbes'] }, { id: 'defis', nom: 'Défis', sections: ['defis'] }, { id: 'bilan', nom: 'Bilan', sections: ['bilan'] }],
      sections: [
        { id: 'reg', html: `<div class="cu-reglages">${CU.reglage({ id: 'v0', nom: 'v<sub>0</sub> (m·s<sup>−1</sup>)', min: 0, max: 20, pas: .5, val: st.v0, aria: 'Vitesse initiale' })}${CU.reglage({ id: 'al', nom: 'α (°)', min: -30, max: 90, pas: 1, val: st.al, aria: 'Angle de tir' })}
            ${CU.reglage({ id: 'h', nom: 'h (m)', min: 0, max: 10, pas: .5, val: st.h, aria: 'Hauteur de départ' })}</div>
            <p class="cu-lab">Champ de pesanteur</p><div class="cu-seg" role="group" aria-label="Astre">${ASTRES.map(a => `<button type="button" data-astre="${a.id}" aria-pressed="${a.id === st.astre}">${a.nom}</button>`).join('')}</div>
            <p class="cu-lab">Objet lancé (sans air)</p><div class="cu-seg" role="group" aria-label="Objet">${OBJETS.map(a => `<button type="button" data-objet="${a.id}" aria-pressed="${a.id === st.objet}">${a.nom}</button>`).join('')}</div>
            <p class="cu-lab">Cible</p><div class="cu-seg" role="group" aria-label="Cible">${[['aucune', 'aucune'], ['panier', 'panier'], ['but', 'but']].map(([k, n]) => `<button type="button" data-cible="${k}" aria-pressed="${k === st.cible}">${n}</button>`).join('')}</div>
            <label class="cu-cocher"><input type="checkbox" data-a="plusieurs"> Vecteurs en plusieurs points</label>` },
        { id: 'courbes', html: `<div class="cu-seg" role="group" aria-label="Courbe affichée">${[['x', 'x(t)'], ['y', 'y(t)'], ['vx', 'v<sub>x</sub>(t)'], ['vy', 'v<sub>y</sub>(t)']].map(([k, n]) => `<button type="button" data-courbe="${k}" aria-pressed="${k === st.courbe}">${n}</button>`).join('')}</div>
            <svg class="cu-mini" data-a="graphe" viewBox="0 0 300 170" role="img" aria-label="Courbe en fonction du temps, avec la date actuelle"></svg><p class="cu-petit" data-a="grTxt"></p>` },
        { id: 'defis', html: '<div data-a="defis"></div>' },
        { id: 'bilan', html: `<div class="cu-bilan"><div class="cle"><p>Chute libre : ${V('a')} = ${V('g')}, la même pour tous les objets (la masse ne joue aucun rôle sans air).</p></div>
            <div class="cle"><p>x(t) = (v<sub>0</sub> cos α) t : v<sub>x</sub> est <b>constante</b> ; y(t) = −½ g t² + (v<sub>0</sub> sin α) t + h ; trajectoire : parabole, dans le plan vertical de ${V('v', '0')}.</p></div>
            <div class="cle"><p>Au sommet, v<sub>y</sub> = 0. Pour h = 0, la portée est maximale pour α = 45°.</p></div>
            <div class="cle"><p>Plus g est faible (Lune, Mars, comète), plus le vol est long et haut.</p></div></div>` },
      ],
      surOnglet: id => { if (id === 'bilan') window.SOM.marquer({ fait: true }); if (id === 'courbes') { courbe(); verifier(); } },
    });
    const $ = c.$;
    const g = () => ASTRES.find(a => a.id === st.astre).g;

    /* ---------- Modèle ---------- */
    function modele() {
      const a = rad(st.al), vx = st.v0 * Math.cos(a), vy = st.v0 * Math.sin(a), G = g();
      const tc = (vy + Math.sqrt(vy * vy + 2 * G * st.h)) / G || 0;
      return { vx, vy, G, tc, pos: t => [vx * t, st.h + vy * t - G * t * t / 2], vit: t => [vx, vy - G * t] };
    }
    // durée de l'animation : temps réel, ou comprimé à 4 s pour un vol long
    const facteur = m => Math.max(1, m.tc / 4);

    /* ---------- Dessin ---------- */
    let geo = null;
    function dessiner() {
      const m = modele(), r = c.fig.getBoundingClientRect(), W = Math.max(240, r.width), H = Math.max(150, r.height);
      const cb = CIBLES[st.cible];
      let X = Math.max(m.vx * m.tc, cb && st.astre === 'terre' ? cb.x + 1 : 0, 1), Y = Math.max(st.h + (m.vy > 0 ? m.vy * m.vy / (2 * m.G) : 0), cb && st.astre === 'terre' ? cb.y + .5 : 0, 1);
      const mg = { g: 40, d: 18, h: 16, b: 30 };
      const s = Math.min((W - mg.g - mg.d) / (X * 1.05), (H - mg.h - mg.b) / (Y * 1.1));
      const px = x => mg.g + x * s, py = y => H - mg.b - y * s;
      geo = { s, px, py };
      let d = `<rect width="${W}" height="${H}" fill="#fff"/>`;
      // graduations (pas de 1, 2 ou 5 × 10ⁿ m)
      const brut = 60 / s, p10 = Math.pow(10, Math.floor(Math.log10(brut))), pas = [1, 2, 5, 10].map(k => k * p10).find(k => k >= brut);
      for (let x = 0; px(x) <= W - 4; x += pas) d += `<line x1="${px(x)}" y1="${py(0)}" x2="${px(x)}" y2="${mg.h}" stroke="${COUL.grille}" stroke-dasharray="3 3"/>` + txt(px(x), py(0) + 14, n3(x), { t: 10, a: 'middle' });
      for (let y = pas; py(y) >= mg.h; y += pas) d += `<line x1="${px(0)}" y1="${py(y)}" x2="${W - 4}" y2="${py(y)}" stroke="${COUL.grille}" stroke-dasharray="3 3"/>` + txt(px(0) - 4, py(y) + 4, n3(y), { t: 10, a: 'end' });
      d += `<line x1="0" y1="${py(0)}" x2="${W}" y2="${py(0)}" stroke="${ENCRE2}" stroke-width="1.6"/>` + fl(px(0), py(0), px(0), mg.h - 6, ENCRE, { ep: 1.2, lt: 7 }) + txt(px(0) + 6, mg.h + 4, 'y (m)', { g: 700, c: ENCRE, t: 11 }) + txt(W - 6, py(0) + 26, 'x (m)', { g: 700, c: ENCRE, t: 11, a: 'end' });
      // cible
      if (cb && st.astre === 'terre') {
        if (st.cible === 'panier') d += `<line x1="${px(cb.x + .23)}" y1="${py(cb.y)}" x2="${px(cb.x + .23)}" y2="${py(cb.y + 1.05)}" stroke="${ENCRE2}" stroke-width="3"/><line x1="${px(cb.x + .23)}" y1="${py(cb.y + .1)}" x2="${px(cb.x + .23)}" y2="${py(0)}" stroke="${ENCRE3}" stroke-width="2"/>` +
          `<line x1="${px(cb.x - .23)}" y1="${py(cb.y)}" x2="${px(cb.x + .23)}" y2="${py(cb.y)}" stroke="#c2570c" stroke-width="3"/>` + txt(px(cb.x), py(cb.y) - 8, 'panier (3,0 m)', { t: 10, a: 'middle' });
        else d += `<line x1="${px(cb.x)}" y1="${py(0)}" x2="${px(cb.x)}" y2="${py(cb.y)}" stroke="${ENCRE2}" stroke-width="3"/><circle cx="${px(cb.x)}" cy="${py(cb.y)}" r="4" fill="${ENCRE2}"/>` + txt(px(cb.x), py(cb.y) - 8, 'barre (2,44 m)', { t: 10, a: 'middle' });
      }
      // trajectoire complète en pointillés, partie parcourue en trait plein
      let tr = '', fait = '';
      for (let k = 0; k <= 80; k++) { const t = m.tc * k / 80, p = m.pos(t); tr += `${k ? 'L' : 'M'}${px(p[0]).toFixed(1)},${py(p[1]).toFixed(1)}`; if (t <= st.t) fait += `${k ? 'L' : 'M'}${px(p[0]).toFixed(1)},${py(p[1]).toFixed(1)}`; }
      d += `<path d="${tr}" fill="none" stroke="${COUL.traj}" stroke-width="1.6" stroke-dasharray="5 4" opacity=".7"/>`;
      if (fait) d += `<path d="${fait}L${px(m.pos(st.t)[0]).toFixed(1)},${py(m.pos(st.t)[1]).toFixed(1)}" fill="none" stroke="${COUL.traj}" stroke-width="2.6"/>`;
      // vecteurs : v⃗ (1 m·s⁻¹ ↔ kv px) et a⃗ = g⃗ (longueur fixe)
      const kv = Math.min(5, 70 / Math.max(st.v0, 1));
      const vecs = t => {
        const p = m.pos(t), v = m.vit(t), x = px(p[0]), y = py(p[1]);
        return fl(x, y, x + v[0] * kv, y - v[1] * kv, COUL.v, { ep: 2.2, lt: 8 }) + fl(x, y, x, y + 30, COUL.a, { ep: 2, lt: 7 });
      };
      if (st.plusieurs) for (let k = 0; k <= 4; k++) d += vecs(m.tc * k / 4 * .999);
      const p = m.pos(st.t), v = m.vit(st.t);
      d += vecs(st.t) + nom(px(p[0]) + v[0] * kv + 10, py(p[1]) - v[1] * kv - 4, 'v', '', COUL.v, { t: 13 }) + nom(px(p[0]) + 12, py(p[1]) + 30, 'a', '', COUL.a, { t: 13 });
      const rb = st.objet === 'boulet' ? 8 : st.objet === 'plume' ? 5 : 6;
      d += st.objet === 'plume' ? `<path d="M${px(p[0]) - 8},${py(p[1]) + 4} Q${px(p[0])},${py(p[1]) - 10} ${px(p[0]) + 8},${py(p[1]) - 4} Q${px(p[0])},${py(p[1]) + 2} ${px(p[0]) - 8},${py(p[1]) + 4}Z" fill="#fff" stroke="${ENCRE}" stroke-width="1.5"/>`
        : `<circle cx="${px(p[0])}" cy="${py(p[1])}" r="${rb}" fill="${st.objet === 'boulet' ? ENCRE2 : '#fff'}" stroke="${ENCRE}" stroke-width="1.6"/>`;
      if (!c.fig.querySelector('svg')) c.fig.innerHTML = '<svg class="cu-sim-svg" role="img" aria-label="Trajectoire du projectile dans le champ de pesanteur, avec ses vecteurs vitesse et accélération"></svg>';
      const sv = c.fig.querySelector('svg');
      sv.setAttribute('viewBox', `0 0 ${W} ${H}`);
      sv.innerHTML = d;
      valeurs(m);
    }
    function valeurs(m) {
      const p = m.pos(st.t), v = m.vit(st.t);
      $('val').innerHTML = `t = <b>${n3(st.t)} s</b> · x = <b>${n3(p[0])} m</b> · y = <b>${n3(Math.max(0, p[1]))} m</b> · v<sub>x</sub> = <b>${n3(v[0])}</b> · v<sub>y</sub> = <b>${n3(v[1])}</b> m·s<sup>−1</sup>` +
        (facteur(m) > 1.01 ? ` <span class="cu-petit">(animation accélérée × ${n3(facteur(m))})</span>` : '');
      const vx = m.vx, vy = m.vy, G = m.G, sg = k => (k < 0 ? ' − ' : ' + ');
      const k2 = G / (2 * vx * vx);
      $('eqs').innerHTML = `x(t) = ${n3(vx)} t &nbsp;·&nbsp; y(t) = −${n3(G / 2)} t<sup>2</sup>${sg(vy)}${n3(Math.abs(vy))} t + ${n3(st.h)}` +
        (Math.abs(vx) > 1e-9 ? ` &nbsp;·&nbsp; trajectoire : y = −${n3(k2)} x<sup>2</sup>${sg(vy / vx)}${n3(Math.abs(vy / vx))} x + ${n3(st.h)}` : ' &nbsp;·&nbsp; tir vertical : x = 0');
    }
    function courbe() {
      const m = modele(), sv = $('graphe'), W = 300, H = 170, mg = 34;
      const f = { x: t => m.pos(t)[0], y: t => m.pos(t)[1], vx: () => m.vx, vy: t => m.vit(t)[1] }[st.courbe];
      let ymin = 0, ymax = 0;
      for (let k = 0; k <= 40; k++) { const y = f(m.tc * k / 40); ymin = Math.min(ymin, y); ymax = Math.max(ymax, y); }
      if (ymax - ymin < 1e-9) ymax = ymin + 1;
      const T = Math.max(m.tc, 1e-6), X = t => mg + t / T * (W - mg - 10), Y = y => 12 + (ymax - y) / (ymax - ymin) * (H - 40);
      let d = `<line x1="${mg}" y1="${Y(0)}" x2="${W - 6}" y2="${Y(0)}" stroke="${ENCRE}" stroke-width="1.2"/><line x1="${mg}" y1="${Y(ymin)}" x2="${mg}" y2="6" stroke="${ENCRE}" stroke-width="1.2"/>`;
      [ymin, ymax].forEach(y => { if (Math.abs(y) > 1e-9) d += txt(mg - 4, Y(y) + 4, n3(y), { t: 10, a: 'end' }) + `<line x1="${mg - 3}" y1="${Y(y)}" x2="${W - 6}" y2="${Y(y)}" stroke="${COUL.grille}" stroke-dasharray="3 3"/>`; });
      d += txt(X(T), Y(0) + 14, n3(T), { t: 10, a: 'middle' }) + txt(W - 6, Y(0) - 5, 't (s)', { t: 10, a: 'end', c: ENCRE, g: 700 });
      let p = '';
      for (let k = 0; k <= 60; k++) { const t = T * k / 60; p += `${k ? 'L' : 'M'}${X(t).toFixed(1)},${Y(f(t)).toFixed(1)}`; }
      d += `<path d="${p}" fill="none" stroke="${COUL.traj}" stroke-width="2.4"/><circle cx="${X(Math.min(st.t, T))}" cy="${Y(f(Math.min(st.t, T)))}" r="4" fill="${COUL.v}"/>`;
      sv.innerHTML = d;
      const unite = st.courbe[0] === 'v' ? 'm·s<sup>−1</sup>' : 'm';
      $('grTxt').innerHTML = { x: 'x(t) = (v<sub>0</sub> cos α) t : une droite.', y: 'y(t) : une parabole (le sommet correspond à v<sub>y</sub> = 0).', vx: 'v<sub>x</sub>(t) = v<sub>0</sub> cos α : constante.', vy: 'v<sub>y</sub>(t) = −g t + v<sub>0</sub> sin α : droite de pente −g.' }[st.courbe] + ` Ordonnées en ${unite}.`;
    }

    /* ---------- Animation ---------- */
    let rafId = null, dernier = 0;
    function majBoutons() { $('lire').textContent = st.joue ? '❚❚ Pause' : st.t > 0 && st.t < modele().tc ? '▶ Reprendre' : '▶ Lancer'; }
    function arreter() { st.joue = false; if (rafId) cancelAnimationFrame(rafId); rafId = null; majBoutons(); }
    function finVol(m) {
      st.t = m.tc; arreter();
      st.lances.push({ v0: st.v0, al: st.al, h: st.h, astre: st.astre, objet: st.objet });
      c.message(`Arrivée au sol après ${n3(m.tc)} s, à x = ${n3(m.vx * m.tc)} m.`, 'info');
    }
    function boucle(ts) {
      const m = modele();
      const dt = Math.min(.05, (ts - dernier) / 1000) * st.vit * facteur(m);
      dernier = ts;
      st.t = Math.min(m.tc, st.t + dt);
      dessiner();
      if (st.t >= m.tc) { finVol(m); dessiner(); verifier(); return; }
      rafId = requestAnimationFrame(boucle);
    }
    function lancer() {
      const m = modele();
      if (st.joue) { arreter(); verifier(); return; }
      if (st.t >= m.tc) st.t = 0;
      c.message('');
      if (reduit) { pas(); return; }
      st.joue = true; majBoutons(); dernier = performance.now(); rafId = requestAnimationFrame(boucle);
    }
    function pas() {
      const m = modele();
      arreter();
      if (st.t >= m.tc) st.t = 0;
      st.t = Math.min(m.tc, st.t + m.tc / 20);
      if (st.t >= m.tc) finVol(m);
      dessiner(); verifier(); majBoutons();
    }
    function recommencer() { arreter(); st.t = 0; c.message(''); dessiner(); verifier(); }
    $('lire').onclick = lancer; $('pas').onclick = pas; $('re').onclick = recommencer;
    zone.querySelectorAll('[data-vit]').forEach(b => { b.onclick = () => { st.vit = +b.dataset.vit; zone.querySelectorAll('[data-vit]').forEach(x => x.setAttribute('aria-pressed', x === b)); }; });

    /* ---------- Réglages ---------- */
    function regler(k, v) {
      st[k] = v; arreter(); st.t = 0;
      const i = zone.querySelector(`[data-r="${k}"]`); if (i && +i.value !== v) i.value = v;
      majReglages(); dessiner(); if (c.zone.querySelector('[data-s="courbes"].actif')) courbe(); verifier(); c.message('');
    }
    function majReglages() {
      zone.querySelector('[data-v="v0"]').textContent = fmt(st.v0);
      zone.querySelector('[data-v="al"]').textContent = String(st.al).replace('-', '−');
      zone.querySelector('[data-v="h"]').textContent = fmt(st.h);
      zone.querySelectorAll('[data-astre]').forEach(b => b.setAttribute('aria-pressed', b.dataset.astre === st.astre));
      zone.querySelectorAll('[data-objet]').forEach(b => b.setAttribute('aria-pressed', b.dataset.objet === st.objet));
      zone.querySelectorAll('[data-cible]').forEach(b => b.setAttribute('aria-pressed', b.dataset.cible === st.cible));
      zone.querySelectorAll('[data-courbe]').forEach(b => b.setAttribute('aria-pressed', b.dataset.courbe === st.courbe));
    }
    zone.querySelectorAll('[data-r]').forEach(i => { i.addEventListener('input', () => regler(i.dataset.r, +i.value)); });
    zone.querySelectorAll('[data-astre]').forEach(b => { b.onclick = () => regler('astre', b.dataset.astre); });
    zone.querySelectorAll('[data-objet]').forEach(b => { b.onclick = () => regler('objet', b.dataset.objet); });
    zone.querySelectorAll('[data-cible]').forEach(b => { b.onclick = () => regler('cible', b.dataset.cible); });
    zone.querySelectorAll('[data-courbe]').forEach(b => { b.onclick = () => { st.courbe = b.dataset.courbe; majReglages(); courbe(); verifier(); }; });
    $('plusieurs').onchange = () => { st.plusieurs = $('plusieurs').checked; dessiner(); };

    /* ---------- Défis ---------- */
    const prep = (o, onglet) => () => { Object.keys(o).forEach(k => { st[k] = o[k]; const i = zone.querySelector(`[data-r="${k}"]`); if (i) i.value = o[k]; }); arreter(); st.t = 0; majReglages(); dessiner(); verifier(); c.message(''); if (onglet) c.onglet(onglet); else if (c.tel()) c.onglet('reg'); };
    // passage de la balle à une abscisse x : hauteur (null si elle est retombée avant)
    const hauteurEn = (m, x) => { if (m.vx <= 0) return null; const t = x / m.vx; return t <= m.tc ? m.pos(t)[1] : null; };
    const terre = () => st.astre === 'terre';
    const defis = CU.defis($('defis'), [
      { t: 'Mets le ballon dans le <b>panier</b> (cercle à 3,0 m de haut, à 4,6 m) : règle v<sub>0</sub> et α, puis lance.', preparer: prep({ cible: 'panier', astre: 'terre', h: 2, v0: 7, al: 60 }),
        ok: () => { const m = modele(), y = hauteurEn(m, 4.6), t = 4.6 / m.vx; return terre() && st.t >= m.tc && y != null && Math.abs(y - 3) < .2 && m.vit(t)[1] < 0; } },
      { t: 'Fais passer le ballon <b>sous la barre</b> du but (2,44 m, à 16 m), sans qu\'il touche le sol avant : lance-le.', preparer: prep({ cible: 'but', astre: 'terre', h: 0, v0: 16, al: 35 }),
        ok: () => { const m = modele(), y = hauteurEn(m, 16); return terre() && st.t >= m.tc && y != null && y > .2 && y < 2.44; } },
      { t: 'Avec h = 0, trouve l\'angle qui donne la <b>portée maximale</b>, puis lance.', preparer: prep({ cible: 'aucune', h: 0, v0: 12, al: 30 }),
        ok: () => st.h === 0 && st.al === 45 && st.v0 > 0 && st.t >= modele().tc },
      { t: 'Mets l\'animation en <b>pause au sommet</b> : vérifie que v<sub>y</sub> y est nulle (à 0,3 m·s<sup>−1</sup> près).', preparer: prep({ cible: 'aucune', astre: 'terre', h: 2, v0: 10, al: 60 }),
        ok: () => { const m = modele(); return !st.joue && st.t > 0 && st.t < m.tc && m.vy > 1 && Math.abs(m.vit(st.t)[1]) <= .3; } },
      { t: 'Montre que <b>v<sub>x</sub> reste constante</b> : affiche la courbe v<sub>x</sub>(t) (onglet « Courbes »).', preparer: () => { st.courbe = 'vx'; majReglages(); c.onglet('courbes'); courbe(); verifier(); },
        ok: () => st.courbe === 'vx' && !!c.zone.querySelector('[data-s="courbes"].actif') },
      { t: 'Lance une <b>bille</b> puis une <b>plume</b> avec les mêmes réglages (sans air) : compare leurs mouvements.', preparer: prep({ objet: 'plume' }),
        ok: () => st.lances.some(a => a.objet === 'bille' && st.lances.some(b => b.objet === 'plume' && b.v0 === a.v0 && b.al === a.al && b.h === a.h && b.astre === a.astre)) },
    ], { bilan: '<b>Tous les défis sont réussis !</b> Ouvre le « Bilan ».', surReussite: () => { if (c.tel()) setTimeout(() => c.onglet('defis'), 0); } });
    function verifier() { defis.verifier(); }

    const redim = () => dessiner();
    if (window.ResizeObserver) new ResizeObserver(redim).observe(c.fig); else addEventListener('resize', redim);
    majReglages(); dessiner(); majBoutons();
    if (reduit) $('lire').textContent = '▶ Étape suivante';
    CU.simTirEtat = st;               // (utile pour vérifier l'application)
  }

  CU.simTir = simTir;
})();
