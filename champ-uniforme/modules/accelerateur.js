/* ============================================================
   Animation « accélérateur linéaire » (module 5, page sur un écran)

   CU.simAccelerateur(zone) : une suite de N condensateurs accolés (grilles
   percées) reliés à un générateur dont la polarité peut s'inverser. Les
   signes + et − des grilles, le sens de E⃗ dans chaque condensateur (flèches)
   et la flèche de U (vers la grille +) s'affichent en continu ; chaque
   inversion fait clignoter les signes (sauf « moins d'animations ») et
   s'ajoute au compteur.
   Trois modes :
     « Inversion au bon moment » : la polarité s'inverse quand la particule
       change de condensateur ; condensateurs de même largeur L ;
     « Sans inversion » : la polarité ne change jamais ; la particule est
       accélérée, puis freinée, et repart en arrière (elle oscille) ;
     « Fréquence fixe » : le générateur inverse la polarité toutes les
       demi-périodes, à la fréquence f réglée ; les condensateurs
       s'allongent (conçus pour une fréquence f₀ à trouver), comme dans un
       vrai accélérateur ; mal synchronisée, la particule arrive quand le
       champ est dans le mauvais sens.
   Réglages : U, nombre d'étages, particule (proton, électron), polarité de
   départ, L, mode, fréquence ; Lecture / Pause, Pas à pas (jusqu'au
   prochain événement), ↺ Recommencer, vitesse. Onglet « Vitesse » : v(t)
   et v après chaque étage, comparée à la vitesse attendue : n étages de tension U
   accélèrent comme un seul condensateur de tension nU (non relativiste).
   Défis : atteindre une vitesse donnée, accélérer un électron (autre
   polarité), vitesse indépendante de L, sans inversion, synchronisation.
   prefers-reduced-motion : pas d'animation automatique, avance par étapes.
   Le mouvement est calculé pas à pas (accélération constante sur chaque
   pas, en unités SI) ; le temps est ralenti pour l'animation.
   ============================================================ */
(function () {
  'use strict';
  const CU = window.CU;
  const { fmt, cs, sci, fl, nom, txt, COUL, ENCRE, ENCRE2, ENCRE3, V } = CU;
  const reduit = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const PARTS = { p: { nom: 'proton', q: CU.E_CH, m: CU.M_P }, e: { nom: 'électron', q: -CU.E_CH, m: CU.M_E } };
  const MODES = [['sync', 'Inversion au bon moment'], ['sans', 'Sans inversion'], ['freq', 'Fréquence fixe']];
  const nb = v => (v === 0 ? '0' : sci(v, 3));
  // écriture scientifique en texte simple (dans un SVG) : 4,38 × 10⁶
  const EXP = { '-': '⁻', '−': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
  const sciTxt = v => { const e = Math.floor(Math.log10(Math.abs(v))); return `${cs(v / Math.pow(10, e), 2)} × 10${String(e).split('').map(ch => EXP[ch]).join('')}`; };

  function simAccelerateur(zone) {
    const st = { U: 10, N: 5, part: 'p', pol: '+', L: 10, mode: 'sync', fr: 0.85, vit: 1, joue: false, essais: [], recul: false };
    let sim = null;
    const c = CU.cadre(zone, {
      badge: 'MODULE 5 · ANIMATION', titre: 'Accélérateur linéaire',
      bande: '<p class="cu-eqs" data-a="etat" aria-live="polite"></p>',
      bas: `<div class="cu-anim-ctrl"><button type="button" class="btn-primary cu-lire" data-a="lire">▶ Lecture</button><button type="button" class="btn-secondary" data-a="pas">Pas à pas</button>
          <button type="button" class="btn-secondary" data-a="re">↺ Recommencer</button>
          <span class="cu-seg" role="group" aria-label="Vitesse de l'animation">${[0.5, 1, 2].map(v => `<button type="button" data-vit="${v}" aria-pressed="${v === 1}">× ${fmt(v)}</button>`).join('')}</span></div>`,
      onglets: [{ id: 'reg', nom: 'Réglages', sections: ['reg'] }, { id: 'vit', nom: 'Vitesse', sections: ['vit'] }, { id: 'defis', nom: 'Défis', sections: ['defis'] }, { id: 'bilan', nom: 'Bilan', sections: ['bilan'] }],
      sections: [
        { id: 'reg', html: `<div class="cu-seg" role="group" aria-label="Mode">${MODES.map(([k, n]) => `<button type="button" data-mode="${k}" aria-pressed="${k === st.mode}">${n}</button>`).join('')}</div>
            <div class="cu-reglages">${CU.reglage({ id: 'U', nom: 'U (kV)', min: 1, max: 20, pas: 1, val: st.U, aria: 'Tension de chaque étage, en kilovolts' })}${CU.reglage({ id: 'N', nom: 'étages', min: 1, max: 8, pas: 1, val: st.N, aria: 'Nombre d\'étages' })}
            ${CU.reglage({ id: 'L', nom: 'L (cm)', min: 2, max: 20, pas: 1, val: st.L, aria: 'Largeur d\'un condensateur (le premier, en fréquence fixe)' })}<div data-a="regF">${CU.reglage({ id: 'fr', nom: 'f (MHz)', min: 0.5, max: 1.5, pas: .01, val: st.fr, aria: 'Fréquence d\'inversion de la polarité' })}</div></div>
            <p class="cu-lab">Particule</p><div class="cu-seg" role="group" aria-label="Particule">${Object.keys(PARTS).map(k => `<button type="button" data-part="${k}" aria-pressed="${k === st.part}">${PARTS[k].nom}</button>`).join('')}</div>
            <p class="cu-lab">Première grille au départ</p><div class="cu-seg" role="group" aria-label="Polarité de départ">${['+', '−'].map(s => `<button type="button" data-pol="${s}" aria-pressed="${s === st.pol}">${s}</button>`).join('')}</div>
            <p class="cu-petit" data-a="regTxt"></p>` },
        { id: 'vit', html: `<svg class="cu-mini" data-a="graphe" viewBox="0 0 300 150" role="img" aria-label="Vitesse de la particule en fonction du temps"></svg><div class="cu-defile" data-a="tab"></div>` },
        { id: 'defis', html: '<div data-a="defis"></div>' },
        { id: 'bilan', html: `<div class="cu-bilan"><div class="cle"><p>Dans chaque condensateur, la particule est accélérée si la force q${V('E')} est dans le sens du mouvement : il faut <b>inverser la polarité chaque fois qu'elle change de condensateur</b>.</p></div>
            <div class="cle"><p>Sans inversion, elle est freinée dans le condensateur suivant et repart en arrière.</p></div>
            <div class="cle"><p>Chaque étage apporte la même énergie qU : après n étages, la particule a la vitesse que lui donnerait un seul condensateur de tension n U, qui ne dépend pas de L. Un électron (q = −e) demande la polarité inverse de celle du proton.</p></div>
            <div class="cle"><p>Avec un générateur de fréquence fixe, les étages s'allongent (la particule va de plus en plus vite) pour que chaque traversée dure une demi-période.</p></div></div>` },
      ],
      surOnglet: id => { if (id === 'bilan') window.SOM.marquer({ fait: true }); if (id === 'vit') graphe(); },
    });
    const $ = c.$;
    const P = () => PARTS[st.part];

    /* ---------- Géométrie et modèle ---------- */
    // vitesse théorique après n étages (non relativiste)
    const vTh = n => Math.sqrt(2 * n * Math.abs(P().q) * st.U * 1e3 / P().m);
    function nouvelleSim() {
      const L0 = st.L / 100, v1 = vTh(1);
      const T0 = 4 * L0 / v1;                                   // période pour laquelle les étages sont conçus (fréquence fixe)
      const Ls = [];
      for (let k = 0; k < st.N; k++) Ls.push(st.mode === 'freq' ? (vTh(k) + vTh(k + 1)) / 2 * T0 / 2 : L0);
      const X = [0];
      Ls.forEach(l => X.push(X[X.length - 1] + l));
      const s0 = st.pol === '+' ? 1 : -1;
      // sans inversion, la particule part du repos au quart du premier condensateur : elle ne peut pas
      // remonter jusqu'à la troisième grille (au même potentiel que la première) et oscille
      sim = { Ls, X, T0, f0: 1 / T0, tau: 2 * L0 / v1, x: st.mode === 'sans' ? L0 / 4 : 0, v: 0, t: 0, sigma: s0, s0, flips: 0, k: 0, fin: null, hist: [[0, 0]], etages: [], vmin: 0, dernierFlash: -1 };
      // fréquence affichée : f₀ × (réglage relatif) ; le curseur règle f en MHz autour de f₀
      majReglages();
    }
    // le curseur règle f entre 0,5 f₀ et 1,5 f₀ (f₀ n'est pas affichée : elle est à trouver)
    const freq = () => st.fr * sim.f0;
    const gapDe = x => { if (x < 0 || x >= sim.X[st.N]) return -1; let k = 0; while (x >= sim.X[k + 1]) k++; return k; };
    // signe de la grille k (+1 : +) et champ dans l'étage k (positif : vers la droite)
    const signeGrille = k => sim.sigma * (k % 2 === 0 ? 1 : -1);
    const champ = k => signeGrille(k) * st.U * 1e3 / sim.Ls[k];

    function avancer(dtTot) {
      if (sim.fin) return [];
      const ev = [], dt = sim.tau / 500, q = P().q, m = P().m;
      let reste = dtTot;
      while (reste > 1e-30 && !sim.fin) {
        const h = Math.min(dt, reste);
        reste -= h;
        // polarité imposée par le générateur à fréquence fixe
        if (st.mode === 'freq') {
          const s = Math.floor(2 * freq() * sim.t) % 2 === 0 ? sim.s0 : -sim.s0;
          if (s !== sim.sigma) { sim.sigma = s; sim.flips++; ev.push('inv'); }
        }
        const k = gapDe(sim.x), a = k >= 0 ? q * champ(k) / m : 0;
        sim.x += sim.v * h + a * h * h / 2; sim.v += a * h; sim.t += h;
        sim.vmin = Math.min(sim.vmin, sim.v);
        if (sim.v < 0 && st.mode === 'sans') st.recul = true;
        const k2 = gapDe(sim.x);
        if (k2 !== k) {
          if (k >= 0 && (k2 > k || sim.x >= sim.X[st.N]) && sim.etages.length === k) { sim.etages.push(sim.v); ev.push('etage'); }
          // inversion au bon moment : dès que la particule entre dans un nouvel étage
          if (st.mode === 'sync' && k2 >= 0 && q * champ(k2) < 0) { sim.sigma = -sim.sigma; sim.flips++; ev.push('inv'); }
        }
        if (sim.x >= sim.X[st.N]) { sim.fin = 'sortie'; ev.push('fin'); }
        else if (sim.x < 0 && sim.v <= 0) { sim.fin = 'recul'; ev.push('fin'); }
        else if (sim.t > (st.mode === 'freq' ? (st.N + 6) * sim.T0 : (st.N + 8) * sim.tau * 2)) { sim.fin = 'temps'; ev.push('fin'); }
        if (ev.length && (ev.includes('etage') || ev.includes('fin'))) { sim.hist.push([sim.t, sim.v]); }
      }
      if (sim.hist.length < 2 || sim.t - sim.hist[sim.hist.length - 1][0] > sim.tau / 20) sim.hist.push([sim.t, sim.v]);
      if (sim.fin) terminer();
      return ev;
    }
    function terminer() {
      arreter();
      const vN = vTh(st.N);
      if (sim.fin === 'sortie') {
        st.essais.push({ part: st.part, U: st.U, N: st.N, L: st.L, mode: st.mode, v: sim.v, ratio: sim.v / vN });
        c.message(`Sortie après ${st.N} étage${st.N > 1 ? 's' : ''} : v = <b>${nb(sim.v)} m·s<sup>−1</sup></b> ; vitesse attendue (un seul condensateur de tension ${st.N} U) : ${nb(vN)} m·s<sup>−1</sup>.`, sim.v > .98 * vN ? 'ok' : 'info');
      } else if (sim.fin === 'recul') c.message(`La particule est repoussée vers l'arrière : le champ du premier condensateur n'est pas dans le bon sens pour ${st.part === 'e' ? 'un électron (charge négative)' : 'un proton'}. Change la polarité de départ.`, 'refus');
      else c.message(st.mode === 'sans' ? 'Sans inversion : accélérée dans le premier condensateur, freinée dans le deuxième, elle repart en arrière et oscille.' : 'La particule n\'est pas sortie : l\'inversion tombe au mauvais moment (règle la fréquence).', 'info');
      verifier();
    }

    /* ---------- Dessin ---------- */
    let flashJusqua = 0;
    function dessiner(flash) {
      // inversion : les signes sont mis en valeur (couleur, taille) pendant 0,7 s
      if (flash) flashJusqua = performance.now() + 700;
      const vif = performance.now() < flashJusqua;
      const r = c.fig.getBoundingClientRect(), W = Math.max(260, r.width), H = Math.max(160, r.height);
      const XN = sim.X[st.N], gauche = 48, droite = 30, s = (W - gauche - droite) / (XN * 1.08);
      const px = x => gauche + x * s, ya = H * .4, hG = Math.min(H * .3, 130), yBusA = ya + hG + 26, yBusB = yBusA + 14;
      let d = `<rect width="${W}" height="${H}" fill="#fff"/>`;
      d += `<line x1="8" y1="${ya}" x2="${W - 8}" y2="${ya}" stroke="${ENCRE3}" stroke-dasharray="3 4"/>`;
      // grilles (trouées au milieu), signes, liaisons au générateur
      let signes = '';
      for (let k = 0; k <= st.N; k++) {
        const x = px(sim.X[k]), sg = signeGrille(k) > 0 ? '+' : '−';
        d += `<line x1="${x}" y1="${ya - hG}" x2="${x}" y2="${ya - 7}" stroke="${ENCRE2}" stroke-width="3"/><line x1="${x}" y1="${ya + 7}" x2="${x}" y2="${ya + hG}" stroke="${ENCRE2}" stroke-width="3"/>`;
        d += `<line x1="${x}" y1="${ya + hG}" x2="${x}" y2="${k % 2 === 0 ? yBusA : yBusB}" stroke="${ENCRE3}" stroke-width="1.2"/><circle cx="${x}" cy="${k % 2 === 0 ? yBusA : yBusB}" r="2" fill="${ENCRE3}"/>`;
        signes += txt(x, ya - hG - 6, sg, { g: 800, c: vif ? COUL.v : ENCRE, t: vif ? 19 : 15, a: 'middle' });
      }
      d += `<line x1="${px(0)}" y1="${yBusA}" x2="${px(sim.X[st.N - (st.N % 2)])}" y2="${yBusA}" stroke="${ENCRE3}" stroke-width="1.2"/>`;
      if (st.N >= 1) d += `<line x1="22" y1="${yBusB}" x2="${px(sim.X[st.N - ((st.N + 1) % 2)])}" y2="${yBusB}" stroke="${ENCRE3}" stroke-width="1.2"/>`;
      // générateur : bornes reliées aux grilles paires (A) et impaires (B)
      const gA = signeGrille(0) > 0 ? '+' : '−', gB = gA === '+' ? '−' : '+';
      d += `<line x1="22" y1="${yBusA}" x2="${px(0)}" y2="${yBusA}" stroke="${ENCRE3}" stroke-width="1.2"/><rect x="6" y="${yBusA - 22}" width="32" height="${yBusB - yBusA + 30}" rx="6" fill="#fff" stroke="${ENCRE}" stroke-width="1.4"/>`;
      signes += txt(16, yBusA + 4, gA, { g: 800, c: ENCRE, t: 12, a: 'middle' }) + txt(16, yBusB + 4, gB, { g: 800, c: ENCRE, t: 12, a: 'middle' });
      d += signes;
      // dans chaque étage : sens de E⃗ et flèche de U (vers la grille +)
      for (let k = 0; k < st.N; k++) {
        const xa = px(sim.X[k]), xb = px(sim.X[k + 1]), xm = (xa + xb) / 2, larg = Math.min(26, (xb - xa) * .3), dir = signeGrille(k) > 0 ? 1 : -1;
        d += fl(xm - larg * dir, ya - hG * .55, xm + larg * dir, ya - hG * .55, COUL.E, { ep: 2, lt: 7 });
        if (k === 0 || xb - xa > 46) d += nom(xm, ya - hG * .55 - 8, 'E', '', COUL.E, { t: 12 });
        d += fl(xm + larg * dir, ya + hG * .6, xm - larg * dir, ya + hG * .6, ENCRE2, { ep: 1.2, lt: 6 });
        if (k === 0) d += txt(xm, ya + hG * .6 + 14, 'U', { g: 800, c: ENCRE2, t: 11, a: 'middle' });
        if (xb - xa > 24) d += txt(xm, ya + hG * .92, `C${k + 1}`, { g: 700, c: ENCRE3, t: 11, a: 'middle' });
      }
      // particule et sa vitesse
      const xp = px(sim.x), pos = P().q > 0;
      if (Math.abs(sim.v) > 1) { const lv = Math.max(-60, Math.min(60, sim.v / vTh(Math.max(st.N, 1)) * 60)); d += fl(xp, ya - 16, xp + lv, ya - 16, COUL.v, { ep: 2.2, lt: 7 }); }
      d += `<circle cx="${xp}" cy="${ya}" r="7" fill="${pos ? '#fff' : ENCRE}" stroke="${ENCRE}" stroke-width="1.8"/>` + txt(xp, ya + 4, pos ? '+' : '−', { g: 800, c: pos ? ENCRE : '#fff', t: 11, a: 'middle' });
      if (!c.fig.querySelector('svg')) c.fig.innerHTML = '<svg class="cu-sim-svg" role="img" aria-label="Accélérateur linéaire : grilles chargées + et −, champ dans chaque condensateur, particule, générateur"></svg>';
      const sv = c.fig.querySelector('svg');
      sv.setAttribute('viewBox', `0 0 ${W} ${H}`);
      sv.innerHTML = d;
      etat();
    }
    function etat() {
      const k = gapDe(sim.x), mode = MODES.find(m => m[0] === st.mode)[1];
      $('etat').innerHTML = `<b>${mode}</b> · inversions de polarité : <b${performance.now() < flashJusqua ? ' class="cu-vif"' : ''}>${sim.flips}</b> · ${k >= 0 ? `étage <b>${k + 1}/${st.N}</b>` : sim.x >= sim.X[st.N] ? 'sortie' : 'hors de l\'accélérateur'} · v = <b>${nb(Math.abs(sim.v))} m·s<sup>−1</sup></b>${sim.v < 0 ? ' (vers l\'arrière)' : ''} · t = ${nb(sim.t)} s`;
    }
    function graphe() {
      const sv = $('graphe'), W = 300, H = 150, mg = 40, h = sim.hist, vN = vTh(st.N);
      const T = Math.max(sim.t, sim.tau), vmax = Math.max(vN, ...h.map(p => Math.abs(p[1]))) * 1.08, vmin = Math.min(0, ...h.map(p => p[1]));
      const X = t => mg + t / T * (W - mg - 8), Y = v => 10 + (vmax - v) / (vmax - vmin) * (H - 34);
      let d = `<line x1="${mg}" y1="${Y(0)}" x2="${W - 4}" y2="${Y(0)}" stroke="${ENCRE}" stroke-width="1.2"/><line x1="${mg}" y1="${Y(vmin)}" x2="${mg}" y2="4" stroke="${ENCRE}" stroke-width="1.2"/>`;
      for (let n = 1; n <= st.N; n++) d += `<line x1="${mg}" y1="${Y(vTh(n))}" x2="${W - 4}" y2="${Y(vTh(n))}" stroke="${COUL.grille}" stroke-dasharray="3 3"/>`;
      d += txt(mg + 4, Y(vN) - 4, `attendue : ${sciTxt(vN)} m·s⁻¹`, { t: 9 });
      d += txt(W - 4, Y(0) + 12, 't', { t: 10, a: 'end', g: 700, c: ENCRE }) + txt(mg + 4, 12, 'v', { t: 10, g: 700, c: ENCRE });
      d += `<path d="${h.map((p, i) => `${i ? 'L' : 'M'}${X(p[0]).toFixed(1)},${Y(p[1]).toFixed(1)}`).join('')}" fill="none" stroke="${COUL.traj}" stroke-width="2.2"/>`;
      sv.innerHTML = d;
      $('tab').innerHTML = `<table class="cu-tableau-v"><thead><tr><th>étage n</th><th>v mesurée (m·s<sup>−1</sup>)</th><th>v attendue (tension n U)</th></tr></thead><tbody>${Array.from({ length: st.N }, (_, i) => `<tr><td>${i + 1}</td><td>${sim.etages[i] != null ? nb(sim.etages[i]) : '…'}</td><td>${nb(vTh(i + 1))}</td></tr>`).join('')}</tbody></table>`;
    }

    /* ---------- Animation ---------- */
    let raf = null, dernier = 0;
    function majBoutons() { $('lire').textContent = reduit ? '▶ Étape suivante' : st.joue ? '❚❚ Pause' : sim && sim.t > 0 && !sim.fin ? '▶ Reprendre' : '▶ Lecture'; }
    function arreter() { st.joue = false; if (raf) cancelAnimationFrame(raf); raf = null; majBoutons(); }
    // à × 1, la traversée du premier étage dure 2 s à l'écran
    const echelle = () => (st.mode === 'freq' ? sim.T0 / 2 : sim.tau) / 2;
    function boucle(ts) {
      const dtr = Math.min(.05, (ts - dernier) / 1000);
      dernier = ts;
      const ev = avancer(dtr * st.vit * echelle());
      dessiner(ev.includes('inv'));
      if (c.zone.querySelector('[data-s="vit"].actif')) graphe();
      if (!sim.fin && st.joue) raf = requestAnimationFrame(boucle);
    }
    function lecture() {
      if (reduit) { pasAPas(); return; }
      if (st.joue) { arreter(); return; }
      if (sim.fin) nouvelleSim();
      c.message('');
      st.joue = true; majBoutons(); dernier = performance.now(); raf = requestAnimationFrame(boucle);
    }
    // jusqu'au prochain événement : changement d'étage, inversion ou fin
    function pasAPas() {
      arreter();
      if (sim.fin) { nouvelleSim(); c.message(''); }
      let ev = [], garde = 0;
      while (!ev.length && garde++ < 400) ev = avancer(echelle() / 20);
      dessiner(ev.includes('inv')); graphe(); majBoutons();
      if (flashJusqua) setTimeout(() => dessiner(), 750);
    }
    function recommencer() { arreter(); nouvelleSim(); c.message(''); dessiner(); graphe(); verifier(); }
    $('lire').onclick = lecture; $('pas').onclick = pasAPas; $('re').onclick = recommencer;
    zone.querySelectorAll('[data-vit]').forEach(b => { b.onclick = () => { st.vit = +b.dataset.vit; zone.querySelectorAll('[data-vit]').forEach(x => x.setAttribute('aria-pressed', x === b)); }; });

    /* ---------- Réglages ---------- */
    function majReglages() {
      zone.querySelector('[data-v="U"]').textContent = fmt(st.U);
      zone.querySelector('[data-v="N"]').textContent = st.N;
      zone.querySelector('[data-v="L"]').textContent = fmt(st.L);
      zone.querySelector('[data-v="fr"]').textContent = sim ? cs(st.fr * sim.f0 / 1e6, 3) : '';
      $('regF').hidden = st.mode !== 'freq';
      zone.querySelectorAll('[data-mode]').forEach(b => b.setAttribute('aria-pressed', b.dataset.mode === st.mode));
      zone.querySelectorAll('[data-part]').forEach(b => b.setAttribute('aria-pressed', b.dataset.part === st.part));
      zone.querySelectorAll('[data-pol]').forEach(b => b.setAttribute('aria-pressed', b.dataset.pol === st.pol));
      $('regTxt').innerHTML = st.mode === 'freq' ? `Étages conçus pour une fréquence f<sub>0</sub> à trouver ; ici f = ${sim ? cs(st.fr * sim.f0 / 1e6, 3) : ''} MHz. La largeur L est celle du premier étage.` : st.mode === 'sans' ? 'La polarité ne change jamais. La particule part du repos au quart du premier condensateur.' : 'La polarité s\'inverse quand la particule change de condensateur.';
    }
    function regler(k, v) {
      st[k] = v;
      const i = zone.querySelector(`[data-r="${k}"]`); if (i && +i.value !== v) i.value = v;
      arreter(); nouvelleSim(); c.message(''); dessiner(); graphe(); verifier();
    }
    zone.querySelectorAll('[data-r]').forEach(i => { i.addEventListener('input', () => regler(i.dataset.r, +i.value)); });
    zone.querySelectorAll('[data-mode]').forEach(b => { b.onclick = () => regler('mode', b.dataset.mode); });
    zone.querySelectorAll('[data-part]').forEach(b => { b.onclick = () => regler('part', b.dataset.part); });
    zone.querySelectorAll('[data-pol]').forEach(b => { b.onclick = () => regler('pol', b.dataset.pol); });

    /* ---------- Défis ---------- */
    const prep = o => () => { Object.keys(o).forEach(k => { st[k] = o[k]; const i = zone.querySelector(`[data-r="${k}"]`); if (i) i.value = o[k]; }); arreter(); nouvelleSim(); c.message(''); dessiner(); graphe(); verifier(); if (c.tel()) c.onglet('reg'); };
    const sortie = f => st.essais.some(f);
    const defis = CU.defis($('defis'), [
      { t: 'Fais sortir un <b>proton</b> à plus de <b>3,0 × 10<sup>6</sup> m·s<sup>−1</sup></b> (règle U et le nombre d\'étages, puis lance).', preparer: prep({ part: 'p', pol: '+', mode: 'sync', U: 5, N: 3 }),
        ok: () => sortie(e => e.part === 'p' && e.v >= 3e6) },
      { t: 'Accélère un <b>électron</b> jusqu\'à la sortie. Pourquoi demande-t-il l\'autre polarité ?', preparer: prep({ part: 'e', pol: '+', mode: 'sync' }),
        ok: () => sortie(e => e.part === 'e' && e.ratio > .98) },
      { t: 'Montre que la vitesse de sortie <b>ne dépend pas de L</b> : deux lancers complets avec des L différents, mêmes U, étages et particule.', preparer: prep({ mode: 'sync', pol: '+', part: 'p', L: 5 }),
        ok: () => st.essais.some(a => a.mode === 'sync' && st.essais.some(b => b.mode === 'sync' && b.part === a.part && b.U === a.U && b.N === a.N && b.L !== a.L && Math.abs(b.v / a.v - 1) < .01)) },
      { t: 'Mode <b>sans inversion</b> : lance et observe ce qui arrive à la particule dans le deuxième condensateur.', preparer: prep({ mode: 'sans', pol: '+', part: 'p', N: 3 }),
        ok: () => st.recul },
      { t: 'Mode <b>fréquence fixe</b> : règle f pour que la particule sorte avec la vitesse maximale, celle que donnerait un seul condensateur de tension N U (à 2 % près).', preparer: prep({ mode: 'freq', pol: '+', part: 'p', fr: 0.85 }),
        ok: () => sortie(e => e.mode === 'freq' && e.ratio > .98) },
    ], { bilan: '<b>Tous les défis sont réussis !</b> Ouvre le « Bilan ».', surReussite: () => { if (c.tel()) setTimeout(() => c.onglet('defis'), 0); } });
    function verifier() { defis.verifier(); }

    const redim = () => { if (sim) dessiner(); };
    if (window.ResizeObserver) new ResizeObserver(redim).observe(c.fig); else addEventListener('resize', redim);
    nouvelleSim(); dessiner(); graphe(); majBoutons(); verifier();
    CU.simAccEtat = { st, sim: () => sim, avancer, vTh };   // (utile pour vérifier l'application)
  }

  CU.simAccelerateur = simAccelerateur;
})();
