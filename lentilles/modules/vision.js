/* ============================================================
   Module 3, sous-module B : voir net, accommoder, corriger (simulation sur une seule page)
   LT.simulateurVision(zone)
   Inspiré de « Corrections de la vision » (G. Tulloue) : objet A à déplacer (ou à l'infini),
   œil normal, myope ou hypermétrope (moyen ou fort : œil trop long ou trop court), âge
   (presbytie : l'amplitude d'accommodation diminue), accommodation à la main ou réflexe
   (bouton « Accommoder »), lunettes dont on règle la vergence.
   Vue : œil en 3D coupé dans le plan horizontal qui contient l'axe optique (on voit l'intérieur),
   cornée, iris, cristallin (plus épais quand il accommode), rétine, nerf optique, lunettes
   stylisées ; faisceau issu de A ; en médaillon, l'image reçue par la rétine, nette ou floue.

   Modèle (œil réduit, vergences en δ, longueurs en mm) :
     cristallin en x = 0, rétine en x = L (17 mm × 1,05 ou 1,10 pour un œil myope, × 0,95 ou 0,90
     pour un œil hypermétrope) ; vergence de l'œil au repos V0 = 1000 / 17 ; accommodation a ∈ [0, A(âge)] ;
     verre de lunettes à 16 mm devant le cristallin. Image nette si |écart de vergence| ≤ 0,25 δ.
   « À essayer » : quatre défis cochés automatiquement ; tous réussis → page faite (SOM.marquer).
   ============================================================ */
(function () {
  'use strict';

  const fmt = LT.fmt, RAD = Math.PI / 180;

  /* ---------- Modèle optique ---------- */
  const L0 = 17;                                   // cristallin → rétine, œil normal (mm)
  const V0 = 1000 / L0;                            // vergence de l'œil au repos (δ)
  const E_LUN = 16;                                // verre de lunettes devant le cristallin (mm)
  const PUP = 2.2;                                 // demi-ouverture de la pupille (mm)
  const NET = 0.25;                                // écart de vergence toléré pour une image nette (δ)
  const LONGUEUR = { normal: { moyen: 1, fort: 1 }, myope: { moyen: 1.05, fort: 1.10 }, hyper: { moyen: 0.95, fort: 0.90 } };
  const AGES = { 20: 10, 40: 4, 60: 1, 80: 0.5 };  // âge → amplitude d'accommodation (δ)
  const DIST = [0.10, 0.15, 0.20, 0.25, 0.33, 0.5, 0.75, 1, 1.5, 2, 3, 5, 10, Infinity];   // m
  const texteDist = D => (D === Infinity ? 'à l\'infini' : D < 1 ? `à ${Math.round(D * 100)} cm` : `à ${fmt(D)} m`);

  /* ---------- Projection 3D (orthographique) : x axe optique, y vers le haut, z vers l'observateur ----------
     L'œil est coupé par le plan vertical z = 0 qui contient l'axe optique ; la moitié z > 0 est enlevée.
     Lacet et tangage légers (on voit un peu l'avant et le dessus), puis roulis pour que l'axe reste horizontal. */
  const PSI = 24 * RAD, PHI = 14 * RAD, U = 10;   // lacet, tangage, unités SVG par mm
  const cps = Math.cos(PSI), sps = Math.sin(PSI), cph = Math.cos(PHI), sph = Math.sin(PHI);
  function P0(p) {
    const x1 = p[0] * cps + p[2] * sps, z1 = -p[0] * sps + p[2] * cps;
    return [x1, -(p[1] * cph - z1 * sph)];
  }
  const AX = P0([1, 0, 0]), ROL = -Math.atan2(AX[1], AX[0]), cr = Math.cos(ROL), sr = Math.sin(ROL);
  function P(p) { const q = P0(p); return [(q[0] * cr - q[1] * sr) * U, (q[0] * sr + q[1] * cr) * U]; }
  const n1 = v => Math.round(v * 10) / 10;
  const chemin = (pts, ferme) => pts.map((q, i) => (i ? 'L' : 'M') + n1(q[0]) + ' ' + n1(q[1])).join('') + (ferme ? 'Z' : '');
  // enveloppe convexe (chaîne monotone) des points projetés
  function enveloppe(pts) {
    const p = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    const bas = [], haut = [];
    p.forEach(q => { while (bas.length > 1 && cr(bas[bas.length - 2], bas[bas.length - 1], q) <= 0) bas.pop(); bas.push(q); });
    for (let i = p.length - 1; i >= 0; i--) { const q = p[i]; while (haut.length > 1 && cr(haut[haut.length - 2], haut[haut.length - 1], q) <= 0) haut.pop(); haut.push(q); }
    return bas.slice(0, -1).concat(haut.slice(0, -1));
  }
  // points d'un ellipsoïde (centre c, demi-axes r) ; moitie : seulement z ≤ 0 (la moitié avant est enlevée)
  function ellipsoide(c, r, moitie) {
    const pts = [];
    for (let t = 0; t <= 180; t += 10) for (let f = 0; f < 360; f += 10) {
      const z = r[2] * Math.cos(t * RAD);
      if (moitie && z > 1e-9) continue;
      pts.push(P([c[0] + r[0] * Math.sin(t * RAD) * Math.cos(f * RAD), c[1] + r[1] * Math.sin(t * RAD) * Math.sin(f * RAD), c[2] + z]));
    }
    return pts;
  }
  // courbe dans le plan de coupe z = 0 : ellipse de centre (cx, cy), demi-axes (rx, ry), angles en degrés
  function coupe(cx, cy, rx, ry, a0, a1, pas) {
    const pts = [];
    for (let a = a0; a <= a1 + 1e-9; a += pas || 5) pts.push(P([cx + rx * Math.cos(a * RAD), cy + ry * Math.sin(a * RAD), 0]));
    return pts;
  }
  // cercle dans un plan x = constante (iris, verre de lunettes), angles θ : y = r cos θ, z = r sin θ
  function cercleX(x, r, a0, a1, pas) {
    const pts = [];
    for (let a = a0; a <= a1 + 1e-9; a += pas || 6) pts.push(P([x, r * Math.cos(a * RAD), r * Math.sin(a * RAD)]));
    return pts;
  }

  let compteur = 0;

  function simulateurVision(zone) {
    const id = ++compteur;
    const etat = { defaut: 'normal', niveau: 'moyen', age: 20, i: DIST.length - 1, a: 0, lun: false, Vg: 0 };
    const L = () => L0 * LONGUEUR[etat.defaut][etat.niveau];
    const A = () => AGES[etat.age];

    // vergences (δ) : lumière qui arrive sur le cristallin, image, écart avec la rétine
    function optique() {
      const D = DIST[etat.i], e = E_LUN / 1000, Vg = etat.lun ? etat.Vg : 0;
      let Varr;
      if (etat.lun) { const V1 = (D === Infinity ? 0 : -1 / (D - e)) + Vg; Varr = V1 / (1 - e * V1); }
      else Varr = D === Infinity ? 0 : -1 / D;
      const Voeil = V0 + etat.a, Vimg = Varr + Voeil, Vret = 1000 / L();
      return { D, Vg, Varr, Voeil, Vimg, Vret, dV: Vimg - Vret, nette: Math.abs(Vimg - Vret) <= NET + 1e-9,
        xi: Vimg > 0 ? 1000 / Vimg : Infinity, aMieux: Math.max(0, Math.min(A(), Vret - Varr - V0)) };
    }
    // zone de vision nette (distances en m comptées depuis l'œil) : du punctum proximum au punctum remotum
    function zoneNette() {
      const e = E_LUN / 1000, Vret = 1000 / L();
      const distance = (Varr, loin) => {
        // vergence à l'arrivée sur l'œil → distance de l'objet (Infinity, ou null si aucun objet réel)
        let Vo;
        if (etat.lun) { const V1 = Varr / (1 + e * Varr); Vo = V1 - etat.Vg; }
        else Vo = Varr;
        if (loin ? Math.abs(Vo) <= NET + 1e-9 : Math.abs(Vo) < 1e-6) return Infinity;   // punctum remotum : à la tolérance de netteté près
        if (Vo > 0) return null;                           // il faudrait un objet « au-delà de l'infini »
        return -1 / Vo + (etat.lun ? e : 0);
      };
      return { loin: distance(Vret - V0, true), pres: distance(Vret - V0 - A(), false) };
    }

    zone.innerHTML = `<div class="lt-vis">
      <div class="er-card lt-vis-tete">
        <div class="lt-entete-l"><span class="er-badge">MODULE 3 · SIMULATION</span><h2 class="er-titre">Voir net : accommoder, corriger</h2></div>
        <span data-plein></span>
      </div>
      <div class="lt-vis-corps">
        <div class="er-card lt-vis-scene">
          <div class="lt-vis-svg" data-a="scene"></div>
          <figure class="lt-vis-medaillon"><figcaption>Image sur la rétine (renversée)</figcaption><div data-a="ret"></div><p data-a="retT"></p></figure>
          <p class="lt-vis-etat" data-a="etat" aria-live="polite"></p>
          <div class="lt-vis-defis-pc" data-a="defisPC"></div>
        </div>
        <aside class="er-card lt-vis-panneau" aria-label="Réglages">
          <div class="lt-vis-onglets" role="tablist">
            <button type="button" role="tab" data-o="oeil" aria-selected="true">L'œil</button>
            <button type="button" role="tab" data-o="voir" aria-selected="false">Regarder</button>
            <button type="button" role="tab" data-o="lun" aria-selected="false">Lunettes</button>
            <button type="button" role="tab" data-o="defis" aria-selected="false">À essayer</button>
          </div>
          <section class="lt-vis-bloc" data-s="oeil">
            <p class="lt-vis-lab lt-vis-titre">L'œil</p>
            <div class="lt-vis-seg" role="group" aria-label="Défaut de l'œil">
              <button type="button" data-d="normal">Normal</button><button type="button" data-d="myope">Myope</button><button type="button" data-d="hyper">Hypermétrope</button>
            </div>
            <div class="lt-vis-seg lt-vis-seg-p" role="group" aria-label="Importance du défaut" data-a="niveau">
              <button type="button" data-n="moyen">Défaut moyen</button><button type="button" data-n="fort">Défaut fort</button>
            </div>
            <p class="lt-vis-lab">Âge <small>(presbytie : le cristallin durcit)</small></p>
            <div class="lt-vis-seg" role="group" aria-label="Âge">${Object.keys(AGES).map(a => `<button type="button" data-g="${a}">${a} ans</button>`).join('')}</div>
            <p class="lt-vis-info" data-a="zone"></p>
          </section>
          <section class="lt-vis-bloc" data-s="voir">
            <p class="lt-vis-lab">Objet A : <b data-a="dT"></b></p>
            <div class="lt-vis-ligne"><input type="range" min="0" max="${DIST.length - 1}" step="1" data-a="d" aria-label="Distance de l'objet">
              <button type="button" class="btn-small" data-a="inf">À l'infini</button></div>
            <p class="lt-vis-lab">Accommodation : <b data-a="aT"></b></p>
            <div class="lt-vis-ligne"><input type="range" min="0" max="100" step="1" data-a="a" aria-label="Accommodation du cristallin">
              <button type="button" class="btn-small" data-a="acc">Accommoder</button></div>
            <p class="lt-vis-info" data-a="foc"></p>
          </section>
          <section class="lt-vis-bloc" data-s="lun">
            <p class="lt-vis-lab lt-vis-titre">Lunettes</p>
            <button type="button" class="btn-secondary lt-vis-lun" data-a="lun" aria-pressed="false">Mettre les lunettes</button>
            <p class="lt-vis-lab">Verres : <b data-a="gT"></b></p>
            <input type="range" min="-32" max="32" step="1" data-a="g" aria-label="Vergence des verres">
            <div class="lt-vis-graduation" aria-hidden="true"><span>−8 δ</span><span>divergents · 0 · convergents</span><span>+8 δ</span></div>
          </section>
          <section class="lt-vis-bloc lt-vis-bloc-defis" data-s="defis">
            <p class="lt-vis-lab lt-vis-titre">À essayer</p>
            <ol class="lt-vis-defis" data-a="defis"></ol>
          </section>
        </aside>
      </div></div>`;
    const $ = a => zone.querySelector(`[data-a="${a}"]`);

    /* ---------- Scène 3D ---------- */
    const NS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('class', 'lt-vis-3d'); svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', 'Œil en trois dimensions coupé dans le plan de l\'axe optique : cornée, iris, cristallin, rétine ; faisceau de lumière issu de l\'objet A ; lunettes');
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    // dégradés (couleurs du thème)
    const grad = (type, gid, attrs, stops) => `<${type} id="${gid}-${id}" ${attrs}>${stops.map(([o, c, op]) => `<stop offset="${o}" style="stop-color:var(${c});stop-opacity:${op == null ? 1 : op}"/>`).join('')}</${type}>`;
    svg.innerHTML = `<defs>
      ${grad('radialGradient', 'lt-sclere', 'cx="35%" cy="30%" r="80%"', [[0, '--sheet'], [0.6, '--paper'], [1, '--paper-3']])}
      ${grad('linearGradient', 'lt-vitre', 'x1="0" y1="0" x2="1" y2="0"', [[0, '--cle-bg', 0.55], [0.55, '--paper-2', 0.9], [1, '--danger-bg']])}
      ${grad('radialGradient', 'lt-crist', 'cx="40%" cy="35%" r="75%"', [[0, '--sheet', 0.9], [1, '--cle-line', 0.85]])}
      ${grad('radialGradient', 'lt-iris', 'cx="50%" cy="50%" r="60%"', [[0, '--orga-ram-3'], [1, '--accent-ink']])}
      ${grad('radialGradient', 'lt-verre', 'cx="40%" cy="35%" r="70%"', [[0, '--sheet', 0.35], [1, '--cle-line', 0.55]])}
      ${grad('radialGradient', 'lt-ombre', 'cx="50%" cy="50%" r="50%"', [[0, '--ink', 0.18], [1, '--ink', 0]])}
    </defs><g data-a="g3d"></g>`;
    $('scene').appendChild(svg);
    const g3d = svg.querySelector('[data-a="g3d"]');
    const url = n => `url(#${n}-${id})`;

    function dessiner(o) {
      const Lr = L(), rx = (Lr + 5.6) / 2 + 0.3, xc = Lr + 0.3 - rx, R = 11.6, EP = 0.7;   // globe (mm), épaisseur de la paroi
      const out = [];
      const path = (d, cls, extra) => out.push(`<path d="${d}" class="${cls}"${extra || ''}/>`);
      const texte = (p, t, cls, ancre) => out.push(`<text x="${n1(p[0])}" y="${n1(p[1])}" class="${cls}" text-anchor="${ancre || 'middle'}">${t}</text>`);
      // position affichée de l'objet (les distances ne sont pas à l'échelle)
      const D = o.D, xo = D === Infinity ? null : -(21 + 7.5 * Math.log10(D / 0.1));
      const xg = -E_LUN, xGauche = -42, rv = 8.5;

      // ombre portée sous l'œil
      const ombre = P([xc, -R - 1.5, 0]);
      out.push(`<ellipse cx="${n1(ombre[0])}" cy="${n1(ombre[1] + 10)}" rx="${n1(rx * U * 1.05)}" ry="${n1(R * U * 0.22)}" fill="${url('lt-ombre')}"/>`);
      // axe optique, hors de l'œil
      path(chemin([P([xGauche, 0, 0]), P([-6.3, 0, 0])]), 'lt-vis-axe');
      // branche des lunettes, côté éloigné (cachée en partie par l'œil)
      if (etat.lun) path(chemin([P([xg, 2.5, -rv]), P([xg + 2, 3, -rv - 1.5]), P([Lr + 12, 3, -rv - 2.5]), P([Lr + 15, -2, -rv - 2.5])]), 'lt-vis-monture lt-vis-branche');
      // nerf optique (moitié arrière d'un cylindre derrière l'œil)
      const nerf = [];
      for (let x = Lr - 0.5; x <= Lr + 9; x += 1.5) for (let a = 180; a <= 360; a += 15) nerf.push(P([x, 1.8 * Math.cos(a * RAD), 1.8 * Math.sin(a * RAD)]));
      path(chemin(enveloppe(nerf), true), 'lt-vis-nerf');
      // globe : moitié arrière (sclérotique) vue de l'extérieur, puis l'intérieur, puis la paroi coupée
      path(chemin(enveloppe(ellipsoide([xc, 0, 0], [rx, R, R], true)), true), 'lt-vis-globe', ` fill="${url('lt-sclere')}"`);
      path(chemin(coupe(xc, 0, rx - EP, R - EP, 0, 360), true), 'lt-vis-coupe', ` fill="${url('lt-vitre')}"`);
      path(chemin(coupe(xc, 0, rx, R, 0, 360), true) + chemin(coupe(xc, 0, rx - EP, R - EP, 0, 360).reverse(), true), 'lt-vis-paroi', ' fill-rule="evenodd"');
      // rétine : fond de l'œil (le long de la paroi, côté arrière)
      path(chemin(coupe(xc, 0, rx - EP - 0.25, R - EP - 0.25, -64, 64, 3)), 'lt-vis-retine');
      // iris (moitié arrière d'un anneau, plan x = −2,6) et sa coupe
      const xi = -2.6;
      path(chemin(cercleX(xi, 6, 180, 360).concat(cercleX(xi, PUP + 0.1, 180, 360).reverse()), true), 'lt-vis-iris', ` fill="${url('lt-iris')}"`);
      [1, -1].forEach(s => path(chemin([P([xi - 0.25, s * (PUP + 0.1), 0]), P([xi - 0.25, s * 6, 0]), P([xi + 0.25, s * 6, 0]), P([xi + 0.25, s * (PUP + 0.1), 0])], true), 'lt-vis-iris-coupe'));
      // cristallin : moitié arrière en relief, et sa coupe (plus épais quand il accommode)
      const ep = 1.75 + 0.07 * etat.a;
      path(chemin(enveloppe(ellipsoide([0, 0, 0], [ep, 4.4, 4.4], true)), true), 'lt-vis-crist', ` fill="${url('lt-crist')}"`);
      path(chemin(coupe(0, 0, ep, 4.4, 0, 360), true), 'lt-vis-crist-coupe');
      // muscles ciliaires (au-dessus et au-dessous du cristallin) : contractés quand l'œil accommode
      [-1, 1].forEach(s => path(chemin(coupe(0, s * 5.4, 0.9, 0.75, 0, 360, 30), true), 'lt-vis-muscle' + (etat.a > 0.05 ? ' lt-vis-muscle-on' : '') + (anim ? ' lt-vis-muscle-anim' : '')));
      // cornée : calotte sphérique en avant (rayon 7,6 mm, sommet en x = −6,2), moitié arrière et coupe
      const cornee = [], profil = [];
      for (let u = 0; u <= 1.0001; u += 0.1) for (let f = 180; f <= 360; f += 15) {
        const r = 5.8 * u, x = -6.2 + (7.6 - Math.sqrt(7.6 * 7.6 - r * r));
        cornee.push(P([x, r * Math.cos(f * RAD), r * Math.sin(f * RAD)]));
      }
      for (let r = -5.8; r <= 5.8001; r += 0.4) profil.push(P([-6.2 + (7.6 - Math.sqrt(7.6 * 7.6 - r * r)), r, 0]));
      path(chemin(enveloppe(cornee), true), 'lt-vis-cornee');
      path(chemin(profil), 'lt-vis-cornee-coupe');
      // axe optique, dans l'œil
      path(chemin([P([-6.3, 0, 0]), P([Lr - EP, 0, 0])]), 'lt-vis-axe');

      // faisceau issu de A, dans le plan de coupe : bords (± pupille) et rayon central
      const Vg = o.Vg, bords = [-PUP, PUP];
      // hauteur sur le verre du rayon qui arrive à la hauteur y sur le cristallin
      const yVerre = y => {
        if (!etat.lun) return null;
        const fac = (D === Infinity ? 1 : 1 + E_LUN / (D * 1000 - E_LUN)) - E_LUN * Vg / 1000;
        return y / fac;
      };
      const avant = bords.map(y => {
        const g = yVerre(y), dep = xo === null ? [xGauche, g === null ? y : g, 0] : [xo, 0, 0];
        return (g === null ? [dep, [0, y, 0]] : [dep, [xg, g, 0], [0, y, 0]]).map(P);
      });
      path(chemin(avant[0].concat(avant[1].slice().reverse()), true), 'lt-vis-faisceau');
      avant.forEach(r => path(chemin(r), 'lt-vis-rayon'));
      path(chemin([P([xo === null ? xGauche : xo, 0, 0]), P([0, 0, 0])]), 'lt-vis-rayon lt-vis-rayon-c');
      // dans l'œil : cristallin → (image A′) → rétine
      const xFin = Lr - EP - 0.3, yr = y => y - y * o.Vimg / 1000 * xFin;
      if (o.xi < xFin) {
        const I = P([o.xi, 0, 0]);
        path(chemin([P([0, -PUP, 0]), I, P([0, PUP, 0])], true), 'lt-vis-faisceau');
        path(chemin([I, P([xFin, yr(-PUP), 0]), P([xFin, yr(PUP), 0])], true), 'lt-vis-faisceau');
      } else path(chemin([P([0, -PUP, 0]), P([xFin, yr(-PUP), 0]), P([xFin, yr(PUP), 0]), P([0, PUP, 0])], true), 'lt-vis-faisceau');
      bords.forEach(y => path(chemin([P([0, y, 0]), P([xFin, yr(y), 0])]), 'lt-vis-rayon'));
      path(chemin([P([0, 0, 0]), P([xFin, 0, 0])]), 'lt-vis-rayon lt-vis-rayon-c');
      // tache de lumière sur la rétine, et point image A′ s'il est dans l'œil
      const h1 = Math.min(yr(-PUP), yr(PUP)) - 0.15, h2 = Math.max(yr(-PUP), yr(PUP)) + 0.15;
      path(chemin([P([xFin + 0.1, h1, 0]), P([xFin + 0.1, h2, 0])]), 'lt-vis-tache' + (o.nette ? ' lt-vis-tache-nette' : ''));
      if (o.xi < xFin - 0.4) { const I = P([o.xi, 0, 0]); out.push(`<circle cx="${n1(I[0])}" cy="${n1(I[1])}" r="5" class="lt-vis-pt"/>`); texte([I[0], I[1] - 12], 'A′', 'lt-vis-nom'); }

      // lunettes stylisées : verre (plus épais au bord s'il est divergent, au centre s'il est convergent), monture, pont
      if (etat.lun) {
        path(chemin(cercleX(xg, rv, 0, 360), true), 'lt-vis-verre', ` fill="${url('lt-verre')}"`);
        if (Vg < -0.01) path(chemin(cercleX(xg, rv - 1.2, 0, 360), true), 'lt-vis-verre-bord');
        if (Vg > 0.01) path(chemin(cercleX(xg, 3, 0, 360), true), 'lt-vis-verre-centre');
        path(chemin(cercleX(xg, rv, 0, 360), true), 'lt-vis-monture');
        path(chemin([P([xg, 2.5, rv]), P([xg - 1, 3.6, rv + 3]), P([xg, 3, rv + 6])]), 'lt-vis-monture');
        texte(P([xg, -rv - 3.6, 0]), `${Vg > 0 ? '+' : Vg < 0 ? '−' : ''}${fmt(Math.abs(Vg), 2)} δ`, 'lt-vis-nom');
      }

      // objet A (flèche verticale) ou objet à l'infini
      if (xo !== null) {
        const a = P([xo, 0, 0]), b = P([xo, 6, 0]);
        path(chemin([a, b]), 'lt-vis-objet');
        path(`M${n1(b[0])} ${n1(b[1] - 14)}l-10 22h20z`, 'lt-vis-objet-p');
        texte([a[0], a[1] + 30], 'A', 'lt-vis-nom');
        texte([b[0], b[1] - 24], `objet ${texteDist(D)}`, 'lt-vis-txt');
      } else {
        texte(P([xGauche, 4.6, 0]), 'objet A à l\'infini :', 'lt-vis-txt', 'start');
        texte(P([xGauche, 3.2, 0]), 'rayons parallèles', 'lt-vis-txt', 'start');
      }

      // noms des parties de l'œil
      const lien = (p, q, t, ancre) => { path(chemin([p, q]), 'lt-vis-lien'); texte([q[0], q[1] + (q[1] > p[1] ? 24 : -8)], t, 'lt-vis-txt', ancre); };
      lien(P([0.5, -3.6, 0]), P([3, -15, 0]), 'cristallin');
      lien(P([xc + rx - EP - 0.6, -6, 0]), P([xc + rx + 2, -15, 0]), 'rétine');
      lien(P([xi, -5, 0]), P([-6, -15, 0]), 'iris', 'end');
      lien(P([-6, 3.5, 0]), P([-9, 12, 0]), 'cornée', 'end');
      lien(P([0, 5.6, 0]), P([2, 14, 0]), 'muscles ciliaires', 'start');
      g3d.innerHTML = out.join('');
      // cadre fixe (le dessin ne saute pas quand on règle)
      const c1 = P([xGauche - 1.5, 0, 0]), c2 = P([L0 * 1.1 + 12.5, 0, 0]);
      const haut = P([0, 17, 0])[1], bas = P([0, -18.5, 0])[1];
      svg.setAttribute('viewBox', `${n1(c1[0])} ${n1(haut)} ${n1(c2[0] - c1[0])} ${n1(bas - haut)}`);
    }

    /* ---------- Médaillon : image reçue par la rétine (renversée), nette ou floue ---------- */
    const rs = OPT.scene($('ret'), { largeur: 120, hauteur: 110, aria: 'Image de l\'objet sur la rétine, nette ou floue' });
    rs.poly('fond', [[-60, -55], [60, -55], [60, 55], [-60, 55]], 'lt-vis-ret-fond');
    const defs = OPT.svgEl('defs', null, rs.svg);
    const filtre = OPT.svgEl('filter', { id: 'lt-flou-vis-' + id, filterUnits: 'userSpaceOnUse', x: -60, y: -55, width: 120, height: 110 }, defs);
    const flou = OPT.svgEl('feGaussianBlur', { stdDeviation: 0 }, filtre);
    const gImg = OPT.svgEl('g', { filter: `url(#lt-flou-vis-${id})` }, rs.calque('rayons'));
    LT.lettre(gImg, 0, -34, 68, true, 'lt-lettre');

    /* ---------- Commandes ---------- */
    let anim = null;
    const $d = $('d'), $a = $('a'), $g = $('g');
    $d.value = etat.i; $g.value = 0;
    $d.oninput = () => { etat.i = +$d.value; maj(); };
    $('inf').onclick = () => { etat.i = DIST.length - 1; $d.value = etat.i; maj(); };
    $a.oninput = () => { arreter(); etat.a = +$a.value / 100 * A(); maj(); };
    $g.oninput = () => { etat.Vg = +$g.value / 4; maj(); };
    $('lun').onclick = () => { etat.lun = !etat.lun; maj(); };
    zone.querySelectorAll('[data-d]').forEach(b => { b.onclick = () => { etat.defaut = b.dataset.d; maj(); }; });
    zone.querySelectorAll('[data-n]').forEach(b => { b.onclick = () => { etat.niveau = b.dataset.n; maj(); }; });
    zone.querySelectorAll('[data-g]').forEach(b => { b.onclick = () => { etat.age = +b.dataset.g; etat.a = Math.min(etat.a, A()); maj(); }; });
    // accommodation réflexe : le cristallin se déforme en une seconde vers le meilleur réglage possible
    function arreter() { if (anim) { cancelAnimationFrame(anim.r); anim = null; } }
    $('acc').onclick = () => {
      arreter();
      const de = etat.a, vers = optique().aMieux, t0 = performance.now(), duree = 900;
      anim = { r: 0 };
      const pas = t => {
        const k = Math.min(1, (t - t0) / duree), e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
        etat.a = de + (vers - de) * e;
        if (k >= 1) { etat.a = vers; anim = null; maj(); return; }
        maj(); anim.r = requestAnimationFrame(pas);
      };
      anim.r = requestAnimationFrame(pas);
    };
    // onglets (téléphone) : un seul bloc de réglages visible à la fois
    const onglets = zone.querySelectorAll('[data-o]');
    function onglet(o) {
      onglets.forEach(b => b.setAttribute('aria-selected', b.dataset.o === o ? 'true' : 'false'));
      zone.querySelectorAll('[data-s]').forEach(s => s.classList.toggle('lt-vis-actif', s.dataset.s === o));
    }
    onglets.forEach(b => { b.onclick = () => onglet(b.dataset.o); });
    onglet('oeil');

    /* ---------- Défis ---------- */
    const DEFIS = [
      { t: 'Œil normal de 20 ans, objet à 25 cm : accommode pour voir net.',
        ok: o => etat.defaut === 'normal' && etat.age === 20 && !etat.lun && Math.abs(o.D - 0.25) < 1e-9 && o.nette && etat.a > 0.5 },
      { t: 'Œil myope : trouve les verres qui donnent une image nette d\'un objet à l\'infini, cristallin au repos.',
        ok: o => etat.defaut === 'myope' && etat.lun && o.D === Infinity && o.nette && etat.a < 0.05 },
      { t: 'Œil hypermétrope : trouve les verres qui donnent une image nette d\'un objet à l\'infini, cristallin au repos.',
        ok: o => etat.defaut === 'hyper' && etat.lun && o.D === Infinity && o.nette && etat.a < 0.05 },
      { t: 'Œil normal de 60 ans : trouve des lunettes pour lire à 25 cm.',
        ok: o => etat.defaut === 'normal' && etat.age === 60 && etat.lun && Math.abs(o.D - 0.25) < 1e-9 && o.nette },
    ];
    const faits = DEFIS.map(() => false);
    $('defis').innerHTML = DEFIS.map(d => `<li><span class="lt-vis-coche" aria-hidden="true"></span><span>${d.t}</span></li>`).join('');
    const lis = Array.from($('defis').children);
    let marque = false;

    /* ---------- Mise à jour ---------- */
    function maj() {
      const o = optique();
      zone.querySelectorAll('[data-d]').forEach(b => b.setAttribute('aria-pressed', b.dataset.d === etat.defaut ? 'true' : 'false'));
      zone.querySelectorAll('[data-n]').forEach(b => b.setAttribute('aria-pressed', b.dataset.n === etat.niveau ? 'true' : 'false'));
      zone.querySelectorAll('[data-g]').forEach(b => b.setAttribute('aria-pressed', +b.dataset.g === etat.age ? 'true' : 'false'));
      $('niveau').hidden = etat.defaut === 'normal';
      $d.value = etat.i; $g.value = Math.round(etat.Vg * 4);
      $('dT').textContent = texteDist(o.D);
      $a.value = Math.round(etat.a / A() * 100);
      $('aT').textContent = etat.a < 0.05 ? 'cristallin au repos' : etat.a > A() - 0.05 ? 'au maximum' : `${Math.round(etat.a / A() * 100)} %`;
      $('foc').innerHTML = `Distance focale de l'œil : <b>${fmt(1000 / o.Voeil, 1)} mm</b>${etat.a < 0.05 ? ' (au repos)' : ''} ; rétine à ${fmt(L(), 1)} mm du cristallin.`;
      $('lun').textContent = etat.lun ? 'Enlever les lunettes' : 'Mettre les lunettes';
      $('lun').setAttribute('aria-pressed', etat.lun ? 'true' : 'false');
      $g.disabled = !etat.lun;
      $('gT').textContent = !etat.lun ? 'pas de lunettes' : Math.abs(etat.Vg) < 0.01 ? '0 δ (sans effet)'
        : `${etat.Vg > 0 ? '+' : '−'}${fmt(Math.abs(etat.Vg), 2)} δ (${etat.Vg > 0 ? 'convergents' : 'divergents'})`;
      // zone de vision nette
      const z = zoneNette(), td = d => (d === Infinity ? 'l\'infini' : d < 1 ? `${Math.round(d * 100)} cm` : `${fmt(Math.round(d * 10) / 10)} m`);
      let zt;
      if (z.pres === null) zt = 'Cet œil ne voit net <b>aucun objet</b>, même en accommodant au maximum.';
      else if (z.loin === null) zt = `Vision nette de <b>${td(z.pres)}</b> à <b>l'infini</b>, mais pour voir loin, l'œil doit déjà accommoder.`;
      else zt = `Vision nette de <b>${td(z.pres)}</b> à <b>${td(z.loin)}</b>.`;
      $('zone').innerHTML = zt;
      // état de l'image
      const nom = { normal: 'Œil normal', myope: 'Œil myope', hyper: 'Œil hypermétrope' }[etat.defaut] + (etat.defaut === 'normal' ? '' : etat.niveau === 'fort' ? ' (fort)' : ' (moyen)');
      const ou = o.nette ? '<b class="lt-vis-ok">Image nette sur la rétine.</b>'
        : o.dV > 0 ? '<b class="lt-vis-ko">Image floue</b> : elle se forme <b>en avant</b> de la rétine.'
        : '<b class="lt-vis-ko">Image floue</b> : elle se formerait <b>en arrière</b> de la rétine.';
      $('etat').innerHTML = `${nom}, ${etat.age} ans${etat.lun ? ', avec lunettes' : ''} · objet ${texteDist(o.D)} · ${ou}`;
      $('retT').textContent = o.nette ? 'nette' : 'floue';
      $('retT').className = o.nette ? 'lt-vis-ok' : 'lt-vis-ko';
      const s = o.nette ? 0 : Math.min(12, 1.4 + 2.2 * Math.abs(o.dV));
      flou.setAttribute('stdDeviation', String(Math.round(s * 100) / 100));
      dessiner(o);
      // défis
      DEFIS.forEach((d, i) => { if (!faits[i] && d.ok(o)) faits[i] = true; lis[i].classList.toggle('lt-vis-fait', faits[i]); });
      if (!marque && faits.every(Boolean)) { marque = true; SOM.marquer({ fait: true }); }
    }
    // « À essayer » : sous l'œil sur ordinateur, dans un onglet sur téléphone
    const mq = matchMedia('(max-width: 899px)'), $defis = zone.querySelector('[data-s="defis"]');
    function placerDefis() { (mq.matches ? zone.querySelector('.lt-vis-panneau') : $('defisPC')).appendChild($defis); }
    if (mq.addEventListener) mq.addEventListener('change', placerDefis); else mq.addListener(placerDefis);
    placerDefis();
    maj();
    if (window.ResizeObserver) new ResizeObserver(() => dessiner(optique())).observe($('scene'));
    LT.visionEnCours = { etat, optique, zoneNette, maj, faits, L, A, DIST };   // utile pour vérifier l'application
    return LT.visionEnCours;
  }

  Object.assign(LT, { simulateurVision });
})();
