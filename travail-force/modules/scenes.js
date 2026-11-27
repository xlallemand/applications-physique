/* ============================================================
   Travail d'une force — dessins des scènes (à charger après tf.js)

   TF.dessinWagon(S, W, H)    wagon sur ses rails, vu de dessus, tiré de A vers B :
                              S.scene 'force'  : une personne, force F⃗ d'angle α
                                                 (la force et la direction du déplacement
                                                 se croisent au centre du wagon) ;
                              S.scene 'wagon4' : quatre personnages tirent en même temps
                              poignées : pointe de F⃗ (α), point B (AB)
   TF.dessinChemins(S, W, H)  F⃗ constante (10 N, horizontale, vers B), AB = 1 m ;
                              trajets 1 à 4 d'energie-cinetique et tracé libre
   TF.dessinPoids(S, W, H)    profil (altitude z) : piste de ski de A à B, et deux chemins
                              imaginaires (vertical puis horizontal, horizontal puis vertical)
   Chacun renvoie { svg, geo, info } ; geo sert à convertir les coordonnées du pointeur,
   info : ce qui se passe sur la portion en cours (texte).

   TF.PERSOS4                 les quatre personnages (angle de leur corde)
   TF.TRAJETS, TF.cheminPts(S)      trajets de A à B (coordonnées en m)
   TF.PISTES, TF.pistePts(S)        chemins du skieur (x en m, z en m)
   TF.portions(pts), TF.surChemin(pts, s)
   ============================================================ */
(function () {
  'use strict';
  const TF = window.TF;
  const { fmt, deg } = TF;
  const f1 = v => (+v).toFixed(1);
  const borne = (v, a, b) => Math.max(a, Math.min(b, v));
  // couleurs des forces (attributs de présentation, comme energie-cinetique/ et bilan-forces/)
  const COUL = { F: '#b35c00', P: '#d9480f' };
  TF.COUL = COUL;

  /* ---------- Briques de dessin ---------- */
  // flèche d'origine (x, y), d'angle ang (degrés, 0 vers la droite, 90 vers le haut), de longueur L
  function fleche(x, y, ang, L, coul, ep) {
    const r = ang * Math.PI / 180, c = Math.cos(r), s = -Math.sin(r);
    const x2 = x + L * c, y2 = y + L * s, t = Math.min(12, L * 0.6), bx = x2 - t * c, by = y2 - t * s, la = t * 0.5;
    return { svg: `<g style="color:${coul}"><line x1="${f1(x)}" y1="${f1(y)}" x2="${f1(bx)}" y2="${f1(by)}" stroke="currentColor" stroke-width="${ep || 3.4}" stroke-linecap="round"/><path d="M${f1(x2)},${f1(y2)} L${f1(bx - la * s)},${f1(by + la * c)} L${f1(bx + la * s)},${f1(by - la * c)} Z" fill="currentColor"/></g>`, x2, y2, c, s };
  }
  // petite flèche fine de (x1, y1) à (x2, y2), classe CSS
  function trait(x1, y1, x2, y2, cls) {
    const a = Math.atan2(y2 - y1, x2 - x1), c = Math.cos(a), s = Math.sin(a), bx = x2 - 8 * c, by = y2 - 8 * s;
    return `<g class="${cls}"><line x1="${f1(x1)}" y1="${f1(y1)}" x2="${f1(bx)}" y2="${f1(by)}"/><path d="M${f1(x2)},${f1(y2)} L${f1(bx - 4 * s)},${f1(by + 4 * c)} L${f1(bx + 4 * s)},${f1(by - 4 * c)} Z"/></g>`;
  }
  // nom de vecteur en SVG (lettres, indice, flèche au-dessus) ; x : centre, y : ligne de base
  function nomSVG(p, ind, x, y, coul, taille) {
    const t = taille || 16, wp = p.length * t * 0.6, wi = ind ? String(ind).length * t * 0.42 : 0, x0 = x - (wp + wi) / 2;
    const ya = y - t * 0.95, x2 = x0 + Math.max(wp, t * 0.6) + 1;
    return `<g class="tf-nom" style="color:${coul || 'currentColor'}"><text x="${f1(x0)}" y="${f1(y)}" font-size="${t}">${p}${ind ? `<tspan dy="${f1(t * 0.25)}" font-size="${f1(t * 0.66)}">${ind}</tspan>` : ''}</text>` +
      `<path d="M${f1(x0 + 1)},${f1(ya)} H${f1(x2)} M${f1(x2 - 3.2)},${f1(ya - 2.8)} L${f1(x2)},${f1(ya)} L${f1(x2 - 3.2)},${f1(ya + 2.8)}"/></g>`;
  }
  // arc de l'angle α entre la direction de référence ref (degrés) et la force (ref + a), rayon R
  function arcAngle(x, y, ref, a, R) {
    if (Math.abs(a) < 0.5) return '';
    const r0 = ref * Math.PI / 180, r1 = (ref + a) * Math.PI / 180;
    const big = Math.abs(a) > 180 ? 1 : 0, sweep = a > 0 ? 0 : 1;
    return `<path d="M${f1(x + R * Math.cos(r0))},${f1(y - R * Math.sin(r0))} A${R},${R} 0 ${big} ${sweep} ${f1(x + R * Math.cos(r1))},${f1(y - R * Math.sin(r1))}" class="tf-sc-arc"/>`;
  }
  // bonhomme vu de dessus qui tire une corde : mains en (hx, hy), corps dans la direction (ux, uy)
  function bonhomme(hx, hy, ux, uy, cls, sc) {
    sc = sc || 1;
    const px = hx + ux * 15 * sc, py = hy + uy * 15 * sc, nx = -uy, ny = ux;
    // épaules perpendiculaires à la corde, tête au centre, bras vers les mains
    const e1 = [px + nx * 9 * sc, py + ny * 9 * sc], e2 = [px - nx * 9 * sc, py - ny * 9 * sc];
    return `<g class="${cls || 'tf-perso'}"><line x1="${f1(e1[0])}" y1="${f1(e1[1])}" x2="${f1(e2[0])}" y2="${f1(e2[1])}"/>` +
      `<line x1="${f1(e1[0])}" y1="${f1(e1[1])}" x2="${f1(hx)}" y2="${f1(hy)}"/><line x1="${f1(e2[0])}" y1="${f1(e2[1])}" x2="${f1(hx)}" y2="${f1(hy)}"/>` +
      `<circle cx="${f1(px + ux * 2 * sc)}" cy="${f1(py + uy * 2 * sc)}" r="${f1(7 * sc)}"/></g>`;
  }
  // « α = 40° » sur la bissectrice de l'angle ; au-dessus de la flèche pour un petit angle
  function texteAngle(x, y, ref, a, d) {
    d = d || 52;
    // petit angle : de l'autre côté de la direction du déplacement (loin de la personne qui tire)
    if (Math.abs(a) < 45) return `<text x="${f1(x + 44)}" y="${f1(y + (a >= 0 ? 24 : -12))}" text-anchor="middle" class="tf-sc-alpha">α = ${deg(a)}</text>`;
    const r = (ref + a / 2) * Math.PI / 180;
    return `<text x="${f1(x + d * Math.cos(r))}" y="${f1(y - d * Math.sin(r) + 5)}" text-anchor="middle" class="tf-sc-alpha">α = ${deg(a)}</text>`;
  }
  const svgDe = (W, H, g, label) => `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" class="tf-svg" role="img" aria-label="${label}">${g}</svg>`;

  /* ============================================================
     LE WAGON (vu de dessus)
     ============================================================ */
  // les quatre personnages : angle de leur corde par rapport au déplacement
  const PERSOS4 = [{ n: 1, a: 0 }, { n: 2, a: 40 }, { n: 3, a: 180 }, { n: 4, a: -90 }];
  TF.PERSOS4 = PERSOS4;
  function geoWagon(W, H, quatre) {
    const sc = borne(Math.min(W / 540, H / 270), 0.62, 1.4);              // échelle du wagon et des personnes
    const Lmax = borne(Math.min(H / 2 - 32 * sc - 4, W * 0.22), 34, 200);   // longueur de la flèche pour 20 N
    const marge = Lmax + 36 * sc + 8;
    const ppm = Math.max(30, (W - 2 * marge) / (quatre ? 1 : 2));            // pixels par mètre (AB jusqu'à 2 m)
    return { W, H, sc, Lmax, kF: Lmax / 20, ppm, xA: marge, yG: Math.round(H / 2) };
  }
  function dessinWagon(S, W, H) {
    const quatre = S.scene === 'wagon4', geo = geoWagon(W, H, quatre), { sc, Lmax, kF, ppm, xA, yG } = geo;
    const AB = quatre ? 1 : S.AB, xB = xA + AB * ppm, x = xA + S.pos * ppm;
    let g = '';
    // rails et traverses
    for (let t = 8; t < W - 4; t += 14) g += `<line x1="${t}" y1="${f1(yG - 15 * sc)}" x2="${t}" y2="${f1(yG + 15 * sc)}" class="tf-w-traverse"/>`;
    g += `<line x1="4" y1="${f1(yG - 9 * sc)}" x2="${W - 4}" y2="${f1(yG - 9 * sc)}" class="tf-w-rail"/><line x1="4" y1="${f1(yG + 9 * sc)}" x2="${W - 4}" y2="${f1(yG + 9 * sc)}" class="tf-w-rail"/>`;
    // A et B : repères en travers des rails
    const yl = yG + 20 * sc + 22;
    g += `<line x1="${f1(xA)}" y1="${f1(yG - 20 * sc)}" x2="${f1(xA)}" y2="${f1(yG + 20 * sc)}" class="tf-w-repere"/><line x1="${f1(xB)}" y1="${f1(yG - 20 * sc)}" x2="${f1(xB)}" y2="${f1(yG + 20 * sc)}" class="tf-w-repere"/>`;
    g += `<text x="${f1(xA - 6)}" y="${f1(yl)}" text-anchor="end" class="tf-sc-pt">A</text><text x="${f1(xB + 6)}" y="${f1(yl)}" class="tf-sc-pt">B</text>`;
    if (xB - xA > 150 && !quatre) g += `<text x="${f1((xA + xB) / 2)}" y="${f1(yl + 16)}" text-anchor="middle" class="tf-sc-txt">AB = ${fmt(AB, 1)} m</text>`;
    // le wagon
    const hw = 24 * sc, hh = 14 * sc;
    g += `<rect x="${f1(x - hw)}" y="${f1(yG - hh)}" width="${f1(2 * hw)}" height="${f1(2 * hh)}" rx="6" class="tf-w-wagon"/><rect x="${f1(x - hw + 8 * sc)}" y="${f1(yG - hh + 7 * sc)}" width="${f1(2 * hw - 16 * sc)}" height="${f1(2 * hh - 14 * sc)}" rx="3" class="tf-w-toit"/>`;
    // direction du déplacement : elle passe par le centre du wagon (quatre personnages : sous les rails)
    if (quatre) g += trait(xA + 12, yl - 5, xB - 12, yl - 5, 'tf-w-depl') + `<text x="${f1((xA + xB) / 2)}" y="${f1(yl + 12)}" text-anchor="middle" class="tf-sc-txt">déplacement</text>`;
    else {
      g += trait(x, yG, x + Math.max(Lmax, 60) + 26, yG, 'tf-w-depl');
      if (W >= 440) g += `<text x="${f1(x + Math.max(Lmax, 60) + 26)}" y="${f1(yG + 9 * sc + 14)}" text-anchor="end" class="tf-sc-txt tf-sc-halo">déplacement</text>`;
    }
    // les forces (une ou quatre), avec les personnes au bout des cordes
    const forces = quatre ? PERSOS4.map(p => ({ a: p.a, L: Lmax * 0.75, n: p.n })) : (S.F > 0 ? [{ a: S.alpha, L: S.F * kF, n: '' }] : []);
    forces.forEach(f => {
      const fl = fleche(x, yG, f.a, f.L, COUL.F);
      const hx = fl.x2 + fl.c * 5, hy = fl.y2 + fl.s * 5;
      g += `<line x1="${f1(x)}" y1="${f1(yG)}" x2="${f1(hx)}" y2="${f1(hy)}" class="tf-w-corde"/>` + bonhomme(hx, hy, fl.c, fl.s, 'tf-perso', sc * 0.9);
      g += fl.svg;
      // nom de la force à côté de la flèche, hors de l'angle α (côté opposé à la direction du déplacement)
      const r = f.a * Math.PI / 180, sg = f.a >= 0 ? 1 : -1;
      const nx = -sg * Math.sin(r), ny = -sg * Math.cos(r);
      const mx = x + fl.c * f.L * 0.72 + nx * 15, my = yG + fl.s * f.L * 0.72 + ny * 15 + 6;
      g += nomSVG('F', f.n, mx, my, COUL.F, 16);
      if (quatre) g += `<text x="${f1(hx + fl.c * 34 * sc)}" y="${f1(hy + fl.s * 34 * sc + 5)}" text-anchor="middle" class="tf-w-num">${f.n}</text>`;
    });
    // angle α entre la force et le déplacement, au centre du wagon
    if (!quatre && S.F > 0) {
      g += arcAngle(x, yG, 0, S.alpha, 28);
      g += texteAngle(x, yG, 0, S.alpha, 56);
      const fl = fleche(x, yG, S.alpha, S.F * kF, COUL.F);
      geo.tip = [fl.x2, fl.y2];
      if (S.libres.alpha) g += `<circle cx="${f1(fl.x2)}" cy="${f1(fl.y2)}" r="21" class="tf-poignee" data-p="fleche"><title>Fais tourner la force</title></circle>`;
    }
    // point B (à faire glisser pour changer AB)
    if (!quatre) {
      g += `<circle cx="${f1(xB)}" cy="${yG}" r="6.5" class="tf-pt-b"/>`;
      if (S.libres.AB) g += `<circle cx="${f1(xB)}" cy="${yG}" r="22" class="tf-poignee" data-p="B"><title>Fais glisser B</title></circle>`;
    }
    geo.ox = x; geo.oy = yG; geo.xB = xB;
    const label = quatre ? 'Wagon vu de dessus, tiré de A vers B par quatre personnages : le 1 dans le sens du déplacement, le 2 en biais vers l\'avant, le 3 vers l\'arrière, le 4 perpendiculairement aux rails'
      : `Wagon vu de dessus tiré de A vers B par une force de ${S.F} N faisant un angle de ${S.alpha} degrés avec le déplacement ; AB = ${fmt(AB, 1)} m`;
    return { svg: svgDe(W, H, g, label), geo };
  }

  /* ---------- Chemins et portions ---------- */
  function portions(pts) {
    const r = [];
    for (let i = 1; i < pts.length; i++) {
      const dx = pts[i][0] - pts[i - 1][0], dy = pts[i][1] - pts[i - 1][1], l = Math.hypot(dx, dy);
      if (l > 1e-9) r.push({ dx, dy, l, ang: Math.atan2(dy, dx) * 180 / Math.PI });
    }
    return r;
  }
  const longueur = pts => portions(pts).reduce((s, p) => s + p.l, 0);
  // position et portion en cours après une longueur s parcourue
  function surChemin(pts, s) {
    let reste = s;
    for (let i = 1; i < pts.length; i++) {
      const [x0, y0] = pts[i - 1], [x1, y1] = pts[i], L = Math.hypot(x1 - x0, y1 - y0);
      if (reste <= L + 1e-12 || i === pts.length - 1) { const u = L ? Math.min(1, reste / L) : 1; return { x: x0 + u * (x1 - x0), y: y0 + u * (y1 - y0), i: i - 1, dx: x1 - x0, dy: y1 - y0 }; }
      reste -= L;
    }
    return { x: pts[0][0], y: pts[0][1], i: 0, dx: 1, dy: 0 };
  }
  // ce que fait le travail sur une portion (angle entre la force et le déplacement)
  function texteAngleW(ang) {
    const a = Math.round(Math.abs(ang));
    if (a === 90) return 'α = 90° : la force est perpendiculaire au déplacement, W ne change pas';
    if (a === 0) return 'α = 0° : la force est dans le sens du déplacement, W augmente';
    if (a === 180) return 'α = 180° : la force est opposée au déplacement, W diminue';
    return `α ≈ ${a}° : ${a < 90 ? 'W augmente, moins vite qu\'à 0°' : 'W diminue'}`;
  }

  /* ============================================================
     LES TRAJETS (force constante 10 N, horizontale, vers B ; AB = 1 m)
     les quatre trajets d'energie-cinetique et le tracé libre
     ============================================================ */
  const TRAJETS = [
    { n: 1, nom: 'droit', pts: [[0, 0], [1, 0]] },
    { n: 2, nom: 'en zigzag', pts: [[0, 0], [0.25, 0.3], [0.5, 0], [0.75, 0.3], [1, 0]] },
    { n: 3, nom: 'monter, aller à l\'horizontale, descendre', pts: [[0, 0], [0, 0.5], [1, 0.5], [1, 0]] },
    { n: 4, nom: 'un détour', pts: [[0, 0], [-0.25, 0], [-0.25, -0.35], [1.25, -0.35], [1.25, 0], [1, 0]] },
  ];
  const BORNES_CH = [-0.36, 1.5, -0.46, 0.62];
  function cheminPts(S) {
    if (S.ch.trajet === 'libre') return S.ch.libre && S.ch.libre.length > 1 ? S.ch.libre : null;
    return TRAJETS[S.ch.trajet - 1].pts;
  }
  function geoChemins(W, H) {
    const [x0, x1, y0, y1] = BORNES_CH, m = 10, haut = 26;
    const k = Math.min((W - 2 * m) / (x1 - x0), (H - haut - m) / (y1 - y0));
    const ox = (W - k * (x1 - x0)) / 2 - k * x0, oy = haut + (H - haut - m - k * (y1 - y0)) / 2 + k * y1;
    return { W, H, k, X: x => ox + k * x, Y: y => oy - k * y, Xi: px => (px - ox) / k, Yi: py => (oy - py) / k, bornes: BORNES_CH };
  }
  function dessinChemins(S, W, H) {
    const geo = geoChemins(W, H), { k, X, Y } = geo, ch = S.ch;
    let g = '';
    // quadrillage : 10 cm
    const [x0, x1, y0, y1] = geo.bornes;
    for (let x = Math.ceil(x0 * 10) / 10; x <= x1 + 1e-9; x += 0.1) g += `<line x1="${f1(X(x))}" y1="${f1(Y(y0))}" x2="${f1(X(x))}" y2="${f1(Y(y1))}" class="tf-grille"/>`;
    for (let y = Math.ceil(y0 * 10) / 10; y <= y1 + 1e-9; y += 0.1) g += `<line x1="${f1(X(x0))}" y1="${f1(Y(y))}" x2="${f1(X(x1))}" y2="${f1(Y(y))}" class="tf-grille"/>`;
    // les autres trajets, en gris, avec leur numéro
    TRAJETS.forEach(t => {
      if (t.n === ch.trajet) return;
      g += `<polyline points="${t.pts.map(q => f1(X(q[0])) + ',' + f1(Y(q[1]))).join(' ')}" class="tf-ch-autre"/>`;
    });
    const pts = cheminPts(S);
    let info = '';
    if (pts) {
      const pos = surChemin(pts, ch.avance);
      g += `<polyline points="${pts.map(q => f1(X(q[0])) + ',' + f1(Y(q[1]))).join(' ')}" class="tf-ch-trajet"/>`;
      if (ch.avance > 0) {
        const faits = pts.slice(0, pos.i + 1).concat([[pos.x, pos.y]]);
        g += `<polyline points="${faits.map(q => f1(X(q[0])) + ',' + f1(Y(q[1]))).join(' ')}" class="tf-ch-fait"/>`;
        if (ch.avance < longueur(pts) - 1e-9) info = texteAngleW(Math.atan2(pos.dy, pos.dx) * 180 / Math.PI);
      }
    }
    if (ch.trace && ch.trace.length > 1) g += `<polyline points="${ch.trace.map(q => f1(X(q[0])) + ',' + f1(Y(q[1]))).join(' ')}" class="tf-ch-trace"/>`;
    // numéros des trajets prédéfinis
    [[1, 0.5, 0.03], [2, 0.25, 0.33], [3, 0.5, 0.53], [4, 0.5, -0.32]].forEach(([n, x, y]) => {
      g += `<text x="${f1(X(x))}" y="${f1(Y(y) - 4)}" text-anchor="middle" class="tf-ch-num${n === ch.trajet ? ' actif' : ''}">${n}</text>`;
    });
    // A et B
    g += `<circle cx="${f1(X(0))}" cy="${f1(Y(0))}" r="6" class="tf-sc-point"/><text x="${f1(X(0) - 10)}" y="${f1(Y(0) + 6)}" text-anchor="end" class="tf-sc-pt">A</text>`;
    g += `<circle cx="${f1(X(1))}" cy="${f1(Y(0))}" r="6" class="tf-sc-point"/><text x="${f1(X(1) + 10)}" y="${f1(Y(0) + 6)}" class="tf-sc-pt">B</text>`;
    // le mobile et la force constante
    const p = pts ? surChemin(pts, ch.avance) : { x: 0, y: 0 }, mx = X(p.x), my = Y(p.y);
    g += `<circle cx="${f1(mx)}" cy="${f1(my)}" r="9" class="tf-ch-mobile"/>`;
    const a = fleche(mx, my, 0, Math.min(0.3 * k, 120), COUL.F);
    g += a.svg + nomSVG('F', '', a.x2 + 14, my + 6, COUL.F, 16);
    if (ch.trajet === 'libre' && !ch.libre && !(ch.trace && ch.trace.length)) info = 'Pose le doigt (ou la souris) sur A et trace ton chemin jusqu\'à B.';
    if (info) g += `<text x="${f1(W / 2)}" y="17" text-anchor="middle" class="tf-sc-info">${info}</text>`;
    geo.mobile = [mx, my];
    const nom = ch.trajet === 'libre' ? 'tracé libre' : `trajet ${ch.trajet} (${TRAJETS[ch.trajet - 1].nom})`;
    return { svg: svgDe(W, H, g, `De A à B par le ${nom} ; la force F de 10 N est horizontale, vers B`), geo };
  }

  /* ============================================================
     LE TRAVAIL DU POIDS (vu de profil)
     x de 0 à 200 m ; A en x = 10 m (altitude z_A), B en x = 190 m (z_B)
     ============================================================ */
  const PISTES = [
    { id: 'ski', nom: 'Piste de ski', court: 'Piste' },
    { id: 'vh', nom: 'Vertical puis horizontal', court: 'Vert. puis horiz.' },
    { id: 'hv', nom: 'Horizontal puis vertical', court: 'Horiz. puis vert.' },
  ];
  const XA = 10, XB = 190, ZMAX = 160;
  function pistePts(S, id) {
    const { zA, zB } = S.po;
    id = id || S.po.chemin;
    if (id === 'vh') return [[XA, zA], [XA, zB], [XB, zB]];
    if (id === 'hv') return [[XA, zA], [XB, zA], [XB, zB]];
    // piste : pente régulière et trois bosses ; celle du milieu est plus haute
    // pour que le skieur remonte nettement (travail résistant sur la montée)
    const p = [], n = 90;
    for (let i = 0; i <= n; i++) {
      const u = i / n, x = XA + (XB - XA) * u;
      const haut = 15 * (1 - 0.3 * u) + 32 * Math.exp(-Math.pow((u - 0.5) / 0.12, 2));
      const z = zA + (zB - zA) * u + haut * Math.pow(Math.sin(3 * Math.PI * u), 2);
      p.push([x, borne(z, 0, ZMAX)]);
    }
    return p;
  }
  function geoPoids(W, H) {
    const mg = 46, md = 22, mh = 30, mb = 24;
    const kx = (W - mg - md) / 200, kz = (H - mh - mb) / ZMAX;
    return { W, H, kx, kz, X: x => mg + x * kx, Z: z => H - mb - z * kz, Xi: px => (px - mg) / kx, Zi: py => (H - mb - py) / kz };
  }
  function dessinPoids(S, W, H) {
    const geo = geoPoids(W, H), { X, Z } = geo, po = S.po;
    let g = '';
    // axe des altitudes et quadrillage (20 m)
    for (let z = 0; z <= ZMAX; z += 20) {
      g += `<line x1="${f1(X(0))}" y1="${f1(Z(z))}" x2="${f1(X(200))}" y2="${f1(Z(z))}" class="tf-grille"/>`;
      g += `<text x="${f1(X(0) - 6)}" y="${f1(Z(z) + 4)}" text-anchor="end" class="tf-grad">${z}</text>`;
    }
    g += `<line x1="${f1(X(0))}" y1="${f1(Z(0))}" x2="${f1(X(0))}" y2="${f1(Z(ZMAX) - 10)}" class="tf-axe"/><path d="M${f1(X(0))},${f1(Z(ZMAX) - 16)} l-4,8 h8 Z" class="tf-axe-p"/>`;
    g += `<text x="${f1(X(0) + 8)}" y="${f1(Z(ZMAX) - 6)}" class="tf-nom-axe">z (m)</text>`;
    g += `<line x1="${f1(X(0))}" y1="${f1(Z(0))}" x2="${f1(X(200))}" y2="${f1(Z(0))}" class="tf-sc-sol"/>`;
    // la piste (neige) et les deux chemins imaginaires
    const ski = pistePts(S, 'ski');
    g += `<path d="M${f1(X(ski[0][0]))},${f1(Z(0))} ${ski.map(q => 'L' + f1(X(q[0])) + ',' + f1(Z(q[1]))).join(' ')} L${f1(X(ski[ski.length - 1][0]))},${f1(Z(0))} Z" class="tf-po-relief"/>`;
    g += `<polyline points="${ski.map(q => f1(X(q[0])) + ',' + f1(Z(q[1]))).join(' ')}" class="tf-po-piste"/>`;
    ['vh', 'hv'].forEach(id => { if (id !== po.chemin) g += `<polyline points="${pistePts(S, id).map(q => f1(X(q[0])) + ',' + f1(Z(q[1]))).join(' ')}" class="tf-po-imag"/>`; });
    const pts = pistePts(S);
    let info = '';
    g += `<polyline points="${pts.map(q => f1(X(q[0])) + ',' + f1(Z(q[1]))).join(' ')}" class="tf-ch-trajet"/>`;
    const pos = surChemin(pts, po.avance);
    if (po.avance > 0) {
      const faits = pts.slice(0, pos.i + 1).concat([[pos.x, pos.y]]);
      g += `<polyline points="${faits.map(q => f1(X(q[0])) + ',' + f1(Z(q[1]))).join(' ')}" class="tf-ch-fait"/>`;
      if (po.avance < longueur(pts) - 1e-9) {
        if (po.chemin === 'ski') info = Math.abs(pos.dy) < 1e-6 ? 'Le skieur reste à la même altitude : W ne change pas' : pos.dy < 0 ? 'Le skieur descend : W augmente' : 'Le skieur remonte : W diminue';
        else info = texteAngleW(Math.abs(pos.dy) < 1e-9 ? 90 : pos.dy < 0 ? 0 : 180);
      }
    }
    // A et B (poignées : glisser verticalement pour changer l'altitude)
    [['A', XA, po.zA], ['B', XB, po.zB]].forEach(([n, x, z]) => {
      g += `<line x1="${f1(X(x))}" y1="${f1(Z(z))}" x2="${f1(X(0))}" y2="${f1(Z(z))}" class="tf-sc-repere"/>`;
      g += `<circle cx="${f1(X(x))}" cy="${f1(Z(z))}" r="7" class="tf-pt-b"/><text x="${f1(X(x) + (n === 'A' ? -12 : 12))}" y="${f1(Z(z) - 9)}" text-anchor="middle" class="tf-sc-pt">${n}</text>`;
      g += `<text x="${f1(X(x) + (n === 'A' ? 14 : -14))}" y="${f1(Z(z) + (z > 140 ? 18 : -10))}" text-anchor="${n === 'A' ? 'start' : 'end'}" class="tf-sc-txt">z<tspan dy="3" font-size="9">${n}</tspan><tspan dy="-3"> = ${z} m</tspan></text>`;
    });
    // le skieur et son poids
    const mx = X(pos.x), my = Z(pos.y);
    g += `<circle cx="${f1(mx)}" cy="${f1(my - 9)}" r="9" class="tf-ch-mobile"/><text x="${f1(mx)}" y="${f1(my - 5.5)}" text-anchor="middle" class="tf-po-m">m</text>`;
    const a = fleche(mx, my - 9, -90, 44, COUL.P);
    g += a.svg + nomSVG('P', '', mx - 16, my + 30, COUL.P, 16);
    if (info) g += `<text x="${f1(W / 2 + 10)}" y="17" text-anchor="middle" class="tf-sc-info">${info}</text>`;
    // poignées de A et B en dernier (au-dessus du skieur et de son poids)
    [['A', XA, po.zA], ['B', XB, po.zB]].forEach(([n, x, z]) => {
      if (S.libres['z' + n]) g += `<circle cx="${f1(X(x))}" cy="${f1(Z(z))}" r="22" class="tf-poignee tf-poignee-v" data-p="${n}"><title>Fais glisser ${n} vers le haut ou vers le bas</title></circle>`;
    });
    const nom = PISTES.find(p => p.id === po.chemin).nom.toLowerCase();
    return { svg: svgDe(W, H, g, `Skieur de masse ${po.m} kg allant de A (altitude ${po.zA} m) à B (altitude ${po.zB} m) ; chemin : ${nom}`), geo };
  }

  // angle ramené entre −180° et 180°
  TF.normal = a => { let b = ((a + 180) % 360 + 360) % 360 - 180; if (Math.abs(b + 180) < 1e-9 && a > 0) b = 180; return Math.round(b * 1e6) / 1e6; };
  Object.assign(TF, { dessinWagon, dessinChemins, dessinPoids, TRAJETS, cheminPts, PISTES, pistePts, portions, longueur, surChemin, XA, XB, ZMAX, fleche, nomSVG, BORNES_CH });
})();
