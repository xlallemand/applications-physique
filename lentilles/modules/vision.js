/* ============================================================
   Module 3, sous-module B : voir net, accommoder, corriger (simulation sur une seule page)
   LT.simulateurVision(zone)
   Inspiré de « Corrections de la vision » (G. Tulloue) : objet A à déplacer (ou à l'infini),
   œil normal, myope ou hypermétrope (moyen ou fort : œil trop long ou trop court), âge
   (presbytie : l'amplitude d'accommodation diminue), accommodation à la main ou réflexe
   (bouton « Accommoder »), lunettes dont on règle la vergence.
   Vue : œil vu de côté, coupé dans le plan vertical qui contient l'axe optique : cornée, iris,
   cristallin (bombé quand il accommode, contour au repos en pointillé), muscles ciliaires et fibres,
   rétine, nerf optique ; lunettes en profil ; faisceau issu de A, prolongé en pointillé jusqu'à A′
   quand l'image se forme derrière la rétine (écart exagéré) ; sous la rétine, l'image qu'elle reçoit.

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
  const AMAX = AGES[20];                           // échelle de la barre d'accommodation (la même à tout âge)
  const DIST = [0.10, 0.15, 0.20, 0.25, 0.33, 0.5, 0.75, 1, 1.5, 2, 3, 5, 10, Infinity];   // m
  // position affichée de l'objet (mm, les distances ne sont pas à l'échelle) et réciproque
  const xObjet = D => -(21 + 6 * Math.log10(D / 0.1));
  const distObjet = x => 0.1 * Math.pow(10, (-x - 21) / 6);
  const texteDist = D => (D === Infinity ? 'à l\'infini' : D < 1 ? `à ${Math.round(D * 100)} cm` : `à ${fmt(D)} m`);

  /* ---------- Vue de côté (coupe dans le plan vertical qui contient l'axe optique) ----------
     x : axe optique (mm, cristallin en x = 0), y : vers le haut ; U unités SVG par mm. */
  const U = 10;
  const P = p => [p[0] * U, -p[1] * U];
  const n1 = v => Math.round(v * 10) / 10;
  const chemin = (pts, ferme) => pts.map((q, i) => (i ? 'L' : 'M') + n1(q[0]) + ' ' + n1(q[1])).join('') + (ferme ? 'Z' : '');
  // arc d'ellipse de centre (cx, cy), demi-axes (rx, ry), angles en degrés (points en mm)
  function arc(cx, cy, rx, ry, a0, a1, pas) {
    const pts = [], n = Math.max(2, Math.ceil(Math.abs(a1 - a0) / (pas || 4)));
    for (let k = 0; k <= n; k++) { const a = (a0 + (a1 - a0) * k / n) * RAD; pts.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]); }
    return pts;
  }
  // hauteur où la cornée (cercle de centre (c0, 0), rayon rc) rejoint la sclérotique (ellipse (xc, 0), rx, ry)
  function limbe(c0, rc, xc, rx, ry) {
    const ec = y => (c0 - Math.sqrt(rc * rc - y * y)) - (xc - rx * Math.sqrt(1 - y * y / (ry * ry)));
    let lo = 0.5, hi = Math.min(rc, ry) - 0.01;
    for (let k = 0; k < 40; k++) { const m = (lo + hi) / 2; if (ec(lo) * ec(m) <= 0) hi = m; else lo = m; }
    return (lo + hi) / 2;
  }
  // contour de l'œil : arc de cornée (à l'avant) puis arc de sclérotique (le reste), en mm
  function contourOeil(c0, rc, xc, rx, ry) {
    const yl = limbe(c0, rc, xc, rx, ry), al = Math.asin(yl / rc) / RAD;
    const as = Math.atan2(yl / ry, (c0 - Math.sqrt(rc * rc - yl * yl) - xc) / rx) / RAD;   // angle du limbe sur l'ellipse (≈ 120°)
    return arc(c0, 0, rc, rc, 180 + al, 180 - al, 3).concat(arc(xc, 0, rx, ry, as, -as, 4));
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
            <p class="lt-vis-lab">Objet A : <b data-a="dT"></b> <small>(à déplacer aussi sur le dessin)</small></p>
            <div class="lt-vis-ligne"><input type="range" min="0" max="${DIST.length - 1}" step="1" data-a="d" aria-label="Distance de l'objet">
              <button type="button" class="btn-small" data-a="inf">À l'infini</button></div>
            <p class="lt-vis-lab">Accommodation : <b data-a="aT"></b></p>
            <div class="lt-vis-ligne"><div class="lt-vis-acc-zone">
                <input type="range" min="0" max="100" step="1" data-a="a" class="lt-vis-acc" aria-label="Accommodation du cristallin">
                <div class="lt-vis-acc-grad" aria-hidden="true"><span data-a="aLim"></span></div></div>
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

    /* ---------- Scène : œil vu de côté, coupé dans le plan de l'axe optique ---------- */
    const NS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('class', 'lt-vis-3d'); svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', 'Œil vu de côté, coupé dans le plan de l\'axe optique : cornée, iris, cristallin, muscles ciliaires, rétine ; faisceau de lumière issu de l\'objet A ; lunettes ; sous la rétine, l\'image qu\'elle reçoit');
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    // médaillon « image sur la rétine » (mm) : sous le fond de l'œil
    const MED = { x: L0 - 5, y: -13, l: 10, h: 8.5 };
    const mx = MED.x * U, my = -MED.y * U, ml = MED.l * U, mh = MED.h * U;
    // dégradés (couleurs du thème)
    const grad = (type, gid, attrs, stops) => `<${type} id="${gid}-${id}" ${attrs}>${stops.map(([o, c, op]) => `<stop offset="${o}" style="stop-color:var(${c});stop-opacity:${op == null ? 1 : op}"/>`).join('')}</${type}>`;
    svg.innerHTML = `<defs>
      ${grad('radialGradient', 'lt-sclere', 'cx="35%" cy="30%" r="80%"', [[0, '--sheet'], [0.6, '--paper'], [1, '--paper-3']])}
      ${grad('linearGradient', 'lt-vitre', 'x1="0" y1="0" x2="1" y2="0"', [[0, '--cle-bg', 0.55], [0.55, '--paper-2', 0.9], [1, '--danger-bg']])}
      ${grad('radialGradient', 'lt-crist', 'cx="40%" cy="35%" r="75%"', [[0, '--sheet', 0.9], [1, '--cle-line', 0.85]])}
      ${grad('linearGradient', 'lt-iris', 'x1="0" y1="0" x2="0" y2="1"', [[0, '--orga-ram-3'], [1, '--accent-ink']])}
      ${grad('linearGradient', 'lt-verre', 'x1="0" y1="0" x2="0" y2="1"', [[0, '--cle-line', 0.55], [0.45, '--sheet', 0.9], [1, '--cle-line', 0.55]])}
      <clipPath id="lt-med-clip-${id}"><rect x="${mx}" y="${my}" width="${ml}" height="${mh}" rx="10"/></clipPath>
      <filter id="lt-flou-vis-${id}" filterUnits="userSpaceOnUse" x="${mx}" y="${my}" width="${ml}" height="${mh}"><feGaussianBlur stdDeviation="0"/></filter>
    </defs><g data-a="g3d"></g>
    <rect data-a="prise" class="lt-vis-prise" x="${-38.5 * U}" y="${-12.5 * U}" width="${20 * U}" height="${17 * U}"/>
    <g class="lt-vis-med">
      <rect x="${mx}" y="${my}" width="${ml}" height="${mh}" rx="10" class="lt-vis-ret-fond"/>
      <g clip-path="url(#lt-med-clip-${id})"><g data-a="lettre" filter="url(#lt-flou-vis-${id})"></g></g>
      <rect x="${mx}" y="${my}" width="${ml}" height="${mh}" rx="10" class="lt-vis-med-cadre"/>
      <text x="${mx + ml / 2}" y="${my + mh + 26}" class="lt-vis-txt" text-anchor="middle">Sur la rétine : <tspan data-a="retT"></tspan></text>
    </g>`;
    $('scene').appendChild(svg);
    const g3d = svg.querySelector('[data-a="g3d"]');
    const flou = svg.querySelector('feGaussianBlur');
    LT.lettre(svg.querySelector('[data-a="lettre"]'), mx + ml / 2 - 2, my + mh / 2 - 31, 62, true, 'lt-lettre');
    const url = n => `url(#${n}-${id})`;

    function dessiner(o) {
      const Lr = L(), rx = (Lr + 5.6) / 2 + 0.3, xc = Lr + 0.3 - rx, R = 11.6, EP = 0.7;   // globe (mm), épaisseur de la paroi
      const C0 = 0.4, RC = 7.8, EC = 0.55;                                                // cornée : centre, rayon, épaisseur (mm)
      const out = [];
      const path = (pts, cls, extra, ferme) => out.push(`<path d="${chemin(pts.map(P), ferme !== false)}" class="${cls}"${extra || ''}/>`);
      const ligne = (pts, cls) => path(pts, cls, '', false);
      const texte = (p, t, cls, ancre) => { const q = P(p); out.push(`<text x="${n1(q[0])}" y="${n1(q[1])}" class="${cls}" text-anchor="${ancre || 'middle'}">${t}</text>`); };
      const paroi = y => xc - (rx - EP) * Math.sqrt(Math.max(0, 1 - y * y / ((R - EP) * (R - EP))));   // face interne, côté avant
      const yParoi = x => (R - EP) * Math.sqrt(Math.max(0, 1 - (x - xc) * (x - xc) / ((rx - EP) * (rx - EP))));
      const D = o.D, xo = D === Infinity ? null : xObjet(D);
      const xg = -E_LUN, xGauche = -37.5, rv = 8.5, Vg = o.Vg;

      // verre de lunettes en profil (ménisque) : plus épais au centre s'il est convergent, au bord s'il est divergent
      const t = Math.min(1, Math.abs(Vg) / 8);
      const ec = Vg >= 0 ? 0.5 + 2.8 * t : 0.45, eb = Vg >= 0 ? 0.45 : 0.5 + 2.8 * t;   // épaisseurs au centre et au bord (exagérées)
      const SF = 1.6, SB = SF + eb - ec;                                                // flèches des faces avant et arrière
      const xAv = y => xg - ec / 2 + SF * (y / rv) * (y / rv), xAr = y => xg + ec / 2 + SB * (y / rv) * (y / rv);

      // axe optique, hors de l'œil
      ligne([[xGauche, 0], [-7.5, 0]], 'lt-vis-axe');
      // branche des lunettes : passe derrière l'œil jusqu'à l'oreille
      if (etat.lun) {
        const q = (x, y) => P([x, y]).map(n1).join(' ');
        // de la charnière à l'oreille, puis le crochet qui épouse l'arrière de l'oreille
        out.push(`<path d="M${q(xAr(rv) - 0.2, rv - 0.4)}C${q(xAr(rv) + 3, rv - 0.6)} ${q(-9, 7.2)} ${q(-6, 7.2)}L${q(Lr + 9, 7.2)}`
          + `C${q(Lr + 12.5, 7.2)} ${q(Lr + 14.6, 6.2)} ${q(Lr + 14.6, 4.2)}C${q(Lr + 14.6, 2.4)} ${q(Lr + 13.6, 1.2)} ${q(Lr + 12.4, 0.8)}" class="lt-vis-monture lt-vis-branche"/>`);
      }
      // nerf optique
      path([[Lr - 1, -1], [Lr + 9, -1.4], [Lr + 9, -4.6], [Lr - 1, -4.4]], 'lt-vis-nerf');
      // globe : sclérotique (contour complet), intérieur (humeurs), cornée transparente
      path(contourOeil(C0, RC, xc, rx, R), 'lt-vis-globe', ` fill="${url('lt-sclere')}"`);
      path(contourOeil(C0, RC - EC, xc, rx - EP, R - EP), 'lt-vis-coupe', ` fill="${url('lt-vitre')}"`);
      const yl = limbe(C0, RC, xc, rx, R), yli = limbe(C0, RC - EC, xc, rx - EP, R - EP);
      const al = Math.asin(yl / RC) / RAD, ali = Math.asin(yli / (RC - EC)) / RAD;
      path(arc(C0, 0, RC, RC, 180 + al, 180 - al, 3).concat(arc(C0, 0, RC - EC, RC - EC, 180 - ali, 180 + ali, 3)), 'lt-vis-cornee');
      // rétine : fond de l'œil
      ligne(arc(xc, 0, rx - EP - 0.25, R - EP - 0.25, -64, 64, 3), 'lt-vis-retine');

      // cristallin : plus bombé quand il accommode (déformation exagérée pour la voir) ; contour au repos en pointillé
      const k = Math.pow(Math.max(0, etat.a) / 10, 0.75);
      const lentille = (av, ar, h) => arc(0, 0, ar, h, -90, 90, 6).concat(arc(0, 0, av, h, 90, 270, 6));
      const hC = 4.6 - 0.7 * k, eAv = 1.1 + 1.3 * k, eAr = 1.6 + 1.6 * k;
      path(lentille(eAv, eAr, hC), 'lt-vis-crist-coupe', ` fill="${url('lt-crist')}"`);
      if (k > 0.03) path(lentille(1.1, 1.6, 4.6), 'lt-vis-fantome');
      // muscles ciliaires (anneau autour du cristallin, en haut et en bas de la coupe) et fibres qui tiennent le cristallin :
      // au repos le muscle est relâché et les fibres sont tendues ; en accommodant, il se contracte et les fibres se relâchent
      const xi = -2.9;
      [1, -1].forEach(s => {
        const pointe = [0.1, s * (7.1 - 1.1 * k)], ep = 1.3 + 0.8 * k;
        const m = [[xi + 0.5, s * yParoi(xi + 0.5)], [pointe[0] - ep, s * (Math.abs(pointe[1]) + 0.5)], pointe, [pointe[0] + ep, s * (Math.abs(pointe[1]) + 0.9)], [2.3, s * yParoi(2.3)]];
        path(m, 'lt-vis-muscle' + (etat.a > 0.05 ? ' lt-vis-muscle-on' : '') + (anim ? ' lt-vis-muscle-anim' : ''));
        [-0.9, -0.3, 0.3, 0.9].forEach(dx => {
          const de = [pointe[0] + dx * 0.6, pointe[1] - s * 0.1], vers = [dx * 1.1, s * (hC - 0.15)];
          const mi = [(de[0] + vers[0]) / 2 + 0.7 * k * (dx < 0 ? -1 : 1), (de[1] + vers[1]) / 2 - s * 0.5 * k];
          out.push(`<path d="M${P(de).map(n1).join(' ')}Q${P(mi).map(n1).join(' ')} ${P(vers).map(n1).join(' ')}" class="lt-vis-zonule"/>`);
        });
        // iris : coupe d'un anneau, de la pupille à la paroi
        path([[xi - 0.3, s * (PUP + 0.1)], [xi - 0.3, s * yParoi(xi - 0.3)], [xi + 0.3, s * yParoi(xi + 0.3)], [xi + 0.3, s * (PUP + 0.1)]], 'lt-vis-iris', ` fill="${url('lt-iris')}"`);
      });
      // axe optique, dans l'œil
      ligne([[-7.5, 0], [Lr - EP, 0]], 'lt-vis-axe');

      // faisceau issu de A, jusqu'au cristallin : bords (± pupille) et rayon central
      const bords = [-PUP, PUP];
      // hauteur sur le verre du rayon qui arrive à la hauteur y sur le cristallin
      const yVerre = y => {
        if (!etat.lun) return null;
        const fac = (D === Infinity ? 1 : 1 + E_LUN / (D * 1000 - E_LUN)) - E_LUN * Vg / 1000;
        return y / fac;
      };
      const avant = bords.map(y => {
        const g = yVerre(y), dep = xo === null ? [xGauche, g === null ? y : g] : [xo, 0];
        return g === null ? [dep, [0, y]] : [dep, [xAv(g), g], [xAr(g), g], [0, y]];
      });
      path(avant[0].concat(avant[1].slice().reverse()), 'lt-vis-faisceau');
      avant.forEach(r => ligne(r, 'lt-vis-rayon'));
      ligne([[xo === null ? xGauche : xo, 0], [0, 0]], 'lt-vis-rayon lt-vis-rayon-c');
      // dans l'œil : cristallin → rétine ; l'image A′ derrière la rétine est éloignée davantage (×3, au plus 13 mm) pour la voir ;
      // image nette : A′ dessiné sur la rétine
      const xFin = Lr - EP - 0.3;
      const ecart = Math.min(o.xi, 1e4) - Lr;   // position de l'image par rapport à la rétine du modèle (mm)
      const xA = o.nette ? xFin : ecart < 0 ? xFin + ecart : xFin + 13 * Math.tanh(3 * ecart / 13);
      const yr = y => y * (1 - xFin / xA);     // hauteur sur la rétine du rayon parti de la hauteur y sur le cristallin
      if (xA < xFin) {
        path([[0, -PUP], [xA, 0], [0, PUP]], 'lt-vis-faisceau');
        path([[xA, 0], [xFin, yr(-PUP)], [xFin, yr(PUP)]], 'lt-vis-faisceau');
      } else path([[0, -PUP], [xFin, yr(-PUP)], [xFin, yr(PUP)], [0, PUP]], 'lt-vis-faisceau');
      bords.forEach(y => ligne([[0, y], [xFin, yr(y)]], 'lt-vis-rayon'));
      ligne([[0, 0], [xFin, 0]], 'lt-vis-rayon lt-vis-rayon-c');
      // au-delà de la rétine : prolongement en pointillé jusqu'à A′
      if (xA > xFin + 0.05) bords.forEach(y => ligne([[xFin, yr(y)], [xA, 0]], 'lt-vis-rayon lt-vis-rayon-p'));
      // tache de lumière sur la rétine, et point image A′
      const h1 = Math.min(yr(-PUP), yr(PUP)) - 0.15, h2 = Math.max(yr(-PUP), yr(PUP)) + 0.15;
      ligne([[xFin + 0.1, h1], [xFin + 0.1, h2]], 'lt-vis-tache' + (o.nette ? ' lt-vis-tache-nette' : ''));
      const I = P([xA, 0]);
      out.push(`<circle cx="${n1(I[0])}" cy="${n1(I[1])}" r="5" class="lt-vis-pt"/>`);
      if (!o.nette) texte([xA < xFin ? xA - 0.4 : xA, 0.9], 'A′', 'lt-vis-nom', xA < xFin ? 'end' : 'middle');

      // lunettes : verre en profil (ménisque), monture en haut et en bas, vergence
      if (etat.lun) {
        const ys = arc(0, 0, 1, rv, -90, 90, 10).map(q => q[1]);
        path(ys.map(y => [xAv(y), y]).concat(ys.slice().reverse().map(y => [xAr(y), y])), 'lt-vis-verre', ` fill="${url('lt-verre')}"`);
        [1, -1].forEach(s => path([[xAv(rv) - 0.4, s * (rv - 0.5)], [xAv(rv) - 0.4, s * (rv + 0.6)], [xAr(rv) + 0.4, s * (rv + 0.6)], [xAr(rv) + 0.4, s * (rv - 0.5)]], 'lt-vis-cercle'));
        texte([xg, -rv - 3.2], `${Vg > 0 ? '+' : Vg < 0 ? '−' : ''}${fmt(Math.abs(Vg), 2)} δ`, 'lt-vis-nom');
        texte([xg, -rv - 5.6], Vg > 0.01 ? 'convergent' : Vg < -0.01 ? 'divergent' : 'sans effet', 'lt-vis-txt');
      }

      // objet A (flèche verticale) ou objet à l'infini
      if (xo !== null) {
        ligne([[xo, 0], [xo, 6]], 'lt-vis-objet');
        const b = P([xo, 6]);
        out.push(`<path d="M${n1(b[0])} ${n1(b[1] - 14)}l-10 22h20z" class="lt-vis-objet-p"/>`);
        texte([xo, -3], 'A', 'lt-vis-nom');
        texte([xo, 8.6], `objet ${texteDist(D)}`, 'lt-vis-txt');
      } else {
        texte([xGauche, 13.2], 'objet A à l\'infini :', 'lt-vis-txt', 'start');
        texte([xGauche, 11.4], 'rayons parallèles', 'lt-vis-txt', 'start');
      }

      // noms des parties de l'œil
      const lien = (p, q, nom, ancre) => { ligne([p, q], 'lt-vis-lien'); texte([q[0], q[1] + (q[1] > p[1] ? 0.6 : -2.4)], nom, 'lt-vis-txt', ancre); };
      lien([0.6, -3.4], [3, -14.6], 'cristallin');
      lien([xc + (rx - EP) * Math.cos(-38 * RAD), (R - EP) * Math.sin(-38 * RAD)], [Lr + 3.2, -9], 'rétine', 'start');
      lien([xi, -5.4], [-6, -14.6], 'iris', 'end');
      lien([-7.2, 3.5], [-9.5, 11.6], 'cornée', 'end');
      lien([0.1, 7.6], [1.5, 12.6], 'muscles ciliaires', 'start');
      g3d.innerHTML = out.join('');
      // cadre fixe (le dessin ne saute pas quand on règle)
      const x1 = (xGauche - 1.5) * U, x2 = (L0 * 1.1 + 15.5) * U, y1 = -15.2 * U, y2 = 25.2 * U;
      svg.setAttribute('viewBox', `${n1(x1)} ${n1(y1)} ${n1(x2 - x1)} ${n1(y2 - y1)}`);
    }

    /* ---------- Commandes ---------- */
    let anim = null;
    const $d = $('d'), $a = $('a'), $g = $('g');
    $d.value = etat.i; $g.value = 0;
    $d.oninput = () => { etat.i = +$d.value; maj(); };
    $('inf').onclick = () => { etat.i = DIST.length - 1; $d.value = etat.i; maj(); };
    // la barre va de 0 à AMAX (maximum à 20 ans) ; au-delà de l'amplitude de l'âge, partie grisée inaccessible
    const aLimite = () => Math.round(A() / AMAX * 100);
    $a.oninput = () => { arreter(); if (+$a.value > aLimite()) $a.value = aLimite(); etat.a = +$a.value / 100 * AMAX; maj(); };
    // objet A déplacé sur le dessin (souris ou doigt) : position la plus proche de la liste ; tout à gauche, à l'infini
    const prise = svg.querySelector('[data-a="prise"]');
    let doigt = null;
    function placerObjet(ev) {
      const pt = svg.createSVGPoint(); pt.x = ev.clientX; pt.y = ev.clientY;
      const x = pt.matrixTransform(svg.getScreenCTM().inverse()).x / U;
      let i = DIST.length - 1;
      if (x > xObjet(DIST[DIST.length - 2]) - 2.5) {
        const D = distObjet(x);
        let mieux = Infinity;
        DIST.forEach((d, k) => { const e = Math.abs(Math.log(d / D)); if (d !== Infinity && e < mieux) { mieux = e; i = k; } });
      }
      if (i !== etat.i) { etat.i = i; maj(); }
    }
    prise.addEventListener('pointerdown', ev => {
      ev.preventDefault(); doigt = ev.pointerId;
      try { prise.setPointerCapture(ev.pointerId); } catch (e) { /* capture indisponible */ }
      prise.classList.add('lt-vis-prise-on'); placerObjet(ev);
    });
    prise.addEventListener('pointermove', ev => { if (ev.pointerId === doigt) placerObjet(ev); });
    const lacher = ev => { if (ev.pointerId === doigt) { doigt = null; prise.classList.remove('lt-vis-prise-on'); } };
    prise.addEventListener('pointerup', lacher); prise.addEventListener('pointercancel', lacher);
    $g.oninput = () => { etat.Vg = +$g.value / 4; maj(); };
    $('lun').onclick = () => { etat.lun = !etat.lun; maj(); };
    zone.querySelectorAll('[data-d]').forEach(b => { b.onclick = () => { etat.defaut = b.dataset.d; maj(); }; });
    zone.querySelectorAll('[data-n]').forEach(b => { b.onclick = () => { etat.niveau = b.dataset.n; maj(); }; });
    zone.querySelectorAll('[data-g]').forEach(b => { b.onclick = () => { arreter(); etat.age = +b.dataset.g; etat.a = Math.min(etat.a, A()); maj(); }; });
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
      const lim = aLimite();
      $a.value = Math.round(etat.a / AMAX * 100);
      $a.style.setProperty('--v', $a.value / 100);
      $a.style.setProperty('--fin', lim >= 100 ? '100%' : `calc(11px + (100% - 22px) * ${lim / 100})`);
      $a.setAttribute('aria-valuetext', etat.a < 0.05 ? 'au repos' : `${$a.value} %, limite à ${lim} % à ${etat.age} ans`);
      $('aT').textContent = etat.a < 0.05 ? 'cristallin au repos' : etat.a > A() - 0.05 ? `au maximum à ${etat.age} ans` : `${$a.value} %`;
      const $lim = $('aLim');
      $lim.textContent = etat.age === 20 ? 'maximum à 20 ans' : `limite à ${etat.age} ans`;
      $lim.style.setProperty('--m', lim / 100);
      $lim.classList.toggle('lt-vis-acc-g', lim < 50);
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
      const retT = svg.querySelector('[data-a="retT"]');
      retT.textContent = o.nette ? 'nette' : 'floue';
      retT.setAttribute('class', o.nette ? 'lt-vis-ok' : 'lt-vis-ko');
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
    LT.visionEnCours = { etat, optique, zoneNette, maj, faits, L, A, DIST };   // utile pour vérifier l'application
    return LT.visionEnCours;
  }

  Object.assign(LT, { simulateurVision });
})();
