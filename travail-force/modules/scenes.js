/* ============================================================
   Travail d'une force — dessins des trois scènes (à charger après tf.js)

   TF.dessinForce(S, W, H)    chariot (vu de côté) ou wagon sur ses rails
                              (vu de dessus, cinq personnages) tiré de A vers B
                              par F⃗ faisant l'angle α avec AB⃗ ; projection de F⃗
                              sur le déplacement, angle α écrit en degrés ;
                              poignées : pointe de F⃗, point B, personnages
   TF.dessinChemins(S, W, H)  F⃗ constante, A et B fixes, chemin choisi (droit,
                              escalier, arc, zigzag, tracé libre) découpé en portions
   TF.dessinPoids(S, W, H)    profil (altitude z) : toboggan, piste de ski,
                              escalier ou tracé libre de A (z_A) à B (z_B) ;
                              décomposition en déplacements horizontaux et verticaux
   Chacun renvoie { svg, geo } ; geo sert à convertir les coordonnées du pointeur.

   TF.PERSOS                  personnages du wagon (angle de leur corde)
   TF.CHEMINS, TF.cheminPts(S)      chemins de A à B (coordonnées en m)
   TF.TRAJETS, TF.trajetPts(S)      trajets du poids (x en m, z en m)
   TF.portions(pts)           portions successives { dx, dy, l, ang }
   ============================================================ */
(function () {
  'use strict';
  const TF = window.TF;
  const { fmt, deg, cosd, NB } = TF;
  const f1 = v => (+v).toFixed(1);
  // couleurs des forces (attributs de présentation, comme energie-cinetique/ et bilan-forces/)
  const COUL = { F: '#b35c00', P: '#d9480f' };
  TF.COUL = COUL;

  /* ---------- Briques de dessin ---------- */
  // flèche d'origine (x, y), d'angle ang (degrés, 0 vers la droite, 90 vers le haut), de longueur L
  function fleche(x, y, ang, L, coul, ep) {
    const r = ang * Math.PI / 180, c = Math.cos(r), s = -Math.sin(r);
    const x2 = x + L * c, y2 = y + L * s, t = Math.min(12, L * 0.6), bx = x2 - t * c, by = y2 - t * s, la = t * 0.5;
    return { svg: `<g style="color:${coul}"><line x1="${f1(x)}" y1="${f1(y)}" x2="${f1(bx)}" y2="${f1(by)}" stroke="currentColor" stroke-width="${ep || 3.2}" stroke-linecap="round"/><path d="M${f1(x2)},${f1(y2)} L${f1(bx - la * s)},${f1(by + la * c)} L${f1(bx + la * s)},${f1(by - la * c)} Z" fill="currentColor"/></g>`, x2, y2, c, s };
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
  // bonhomme qui tire une corde : mains en (hx, hy), corps penché dans la direction (ux, uy)
  function bonhomme(hx, hy, ux, uy, cls, sc) {
    if (sc && sc !== 1) return `<g transform="translate(${f1(hx)} ${f1(hy)}) scale(${sc.toFixed(3)}) translate(${f1(-hx)} ${f1(-hy)})">${bonhomme(hx, hy, ux, uy, cls)}</g>`;
    const px = hx + ux * 12, py = hy + uy * 12;
    const cou = [px + ux * 6, py - 10], tete = [px + ux * 8, py - 21], hanche = [px - ux * 2, py + 8];
    return `<g class="${cls || 'tf-perso'}"><line x1="${f1(cou[0])}" y1="${f1(cou[1])}" x2="${f1(hanche[0])}" y2="${f1(hanche[1])}"/>` +
      `<line x1="${f1(hanche[0])}" y1="${f1(hanche[1])}" x2="${f1(hanche[0] - 7 - ux * 3)}" y2="${f1(hanche[1] + 15)}"/><line x1="${f1(hanche[0])}" y1="${f1(hanche[1])}" x2="${f1(hanche[0] + 7 - ux * 3)}" y2="${f1(hanche[1] + 15)}"/>` +
      `<line x1="${f1(cou[0])}" y1="${f1(cou[1] + 3)}" x2="${f1(hx)}" y2="${f1(hy)}"/><circle cx="${f1(tete[0])}" cy="${f1(tete[1])}" r="7"/></g>`;
  }
  // « α = 40° » sur la bissectrice de l'angle ; au-dessus de la flèche pour un petit angle
  function texteAngle(x, y, ref, a) {
    if (Math.abs(a) < 25) {
      const r = ref * Math.PI / 180;
      return `<text x="${f1(x + 56 * Math.cos(r) + 22 * Math.sin(r))}" y="${f1(y - 56 * Math.sin(r) - 22 * Math.cos(r))}" text-anchor="middle" class="tf-sc-alpha">α = ${deg(a)}</text>`;
    }
    const r = (ref + a / 2) * Math.PI / 180;
    return `<text x="${f1(x + 48 * Math.cos(r))}" y="${f1(y - 48 * Math.sin(r) + 5)}" text-anchor="middle" class="tf-sc-alpha">α = ${deg(a)}</text>`;
  }
  const svgDe = (W, H, g, label) => `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" class="tf-svg" role="img" aria-label="${label}">${g}</svg>`;

  /* ============================================================
     SCÈNE 1 : LA FORCE ET LE DÉPLACEMENT (chariot ou wagon)
     ============================================================ */
  // personnages du wagon : angle de leur corde par rapport au déplacement (vu de dessus)
  const PERSOS = [
    { n: 1, a: 0, dit: '« C\'est moi le plus efficace' + NB + '! »' },
    { n: 2, a: 40, dit: '« Je fais ce que je peux' + NB + '! »' },
    { n: 3, a: -45, dit: '« Je fais ce que je peux' + NB + '! »' },
    { n: 4, a: 180, dit: '« Je résisterai' + NB + '! »' },
    { n: 5, a: -90, dit: '« Je ne sers à rien. »' },
  ];
  TF.PERSOS = PERSOS;
  const persoDe = a => PERSOS.find(p => p.a === a);
  TF.persoDe = persoDe;

  function geoForce(W, H, wagon) {
    const Lmax = Math.max(46, Math.min(170, H * 0.32, W * 0.17));
    const sc = Math.max(0.6, Math.min(1, W / 700, H / 380));     // échelle du wagon et des personnages
    const mg = Lmax + (wagon ? 60 * sc : 36), ppm = Math.max(50, (W - 2 * mg) / 2);
    const yG = wagon ? Math.round(H * 0.46) : Math.round(Math.max(Lmax + 22, H * 0.48));
    return { W, H, Lmax, kF: Lmax / 20, mg, ppm, yG, xA: mg, sc };
  }
  function dessinForce(S, W, H) {
    const wagon = S.objet === 'wagon', geo = geoForce(W, H, wagon), { Lmax, kF, ppm, yG, xA, sc } = geo;
    const { F, AB, alpha } = S, xB = xA + AB * ppm, x = xA + S.pos * ppm;
    let g = '';
    let ox = x, oy = yG;                                 // origine de la force
    if (!wagon) {
      // sol, A, B, vecteur déplacement AB⃗
      const sol = yG + 21;
      g += `<line x1="8" y1="${sol}" x2="${W - 8}" y2="${sol}" class="tf-sc-sol"/>`;
      for (let t = 14; t < W - 8; t += 16) g += `<line x1="${t}" y1="${sol + 1}" x2="${t - 7}" y2="${sol + 8}" class="tf-sc-hach"/>`;
      const yv = sol + 26;
      if (AB > 0) g += trait(xA, yv, xB, yv, 'tf-sc-ab') + nomSVG('AB', '', (xA + xB) / 2, yv - 7, '#55585f', 14);
      g += `<line x1="${f1(xA)}" y1="${sol - 6}" x2="${f1(xA)}" y2="${yv + 6}" class="tf-sc-repere"/><line x1="${f1(xB)}" y1="${sol - 6}" x2="${f1(xB)}" y2="${yv + 6}" class="tf-sc-repere"/>`;
      g += `<text x="${f1(xA)}" y="${yv + 24}" text-anchor="middle" class="tf-sc-pt">A</text><text x="${f1(xB)}" y="${yv + 24}" text-anchor="middle" class="tf-sc-pt">B</text>`;
      if (xB - xA > 110) g += `<text x="${f1((xA + xB) / 2)}" y="${yv + 22}" text-anchor="middle" class="tf-sc-txt">AB = ${fmt(AB, 1)} m</text>`;
      // le chariot
      g += `<rect x="${f1(x - 27)}" y="${yG - 14}" width="54" height="28" rx="5" class="tf-sc-sys"/>` +
        `<circle cx="${f1(x - 15)}" cy="${sol - 6}" r="6" class="tf-sc-roue"/><circle cx="${f1(x + 15)}" cy="${sol - 6}" r="6" class="tf-sc-roue"/>`;
    } else {
      // rails vus de dessus, traverses, A, B, AB⃗
      const yr = yG;
      for (let t = 10; t < W - 6; t += 14) g += `<line x1="${t}" y1="${yr - 16}" x2="${t}" y2="${yr + 16}" class="tf-w-traverse"/>`;
      g += `<line x1="6" y1="${yr - 10}" x2="${W - 6}" y2="${yr - 10}" class="tf-w-rail"/><line x1="6" y1="${yr + 10}" x2="${W - 6}" y2="${yr + 10}" class="tf-w-rail"/>`;
      const yv = yr + Math.min(H * 0.42, Lmax + 60);
      if (AB > 0) g += trait(xA, yv, xB, yv, 'tf-sc-ab') + nomSVG('AB', '', (xA + xB) / 2, yv - 7, '#55585f', 14);
      g += `<line x1="${f1(xA)}" y1="${yr}" x2="${f1(xA)}" y2="${yv + 6}" class="tf-sc-repere"/><line x1="${f1(xB)}" y1="${yr}" x2="${f1(xB)}" y2="${yv + 6}" class="tf-sc-repere"/>`;
      g += `<text x="${f1(xA)}" y="${yv + 24}" text-anchor="middle" class="tf-sc-pt">A</text><text x="${f1(xB)}" y="${yv + 24}" text-anchor="middle" class="tf-sc-pt">B</text>`;
      if (xB - xA > 110) g += `<text x="${f1((xA + xB) / 2)}" y="${yv + 22}" text-anchor="middle" class="tf-sc-txt">AB = ${fmt(AB, 1)} m</text>`;
      if (W >= 520) g += `<text x="10" y="18" class="tf-sc-txt">Vu de dessus : le wagon ne peut pas quitter les rails.</text>`;
      // personnages au repos (cliquables), sauf celui qui tire
      const hw = 46 * sc, hh = 24 * sc, bord = a => { const r = a * Math.PI / 180, c = Math.cos(r), s = Math.sin(r); const t = Math.min(Math.abs(c) > 1e-6 ? hw / Math.abs(c) : 1e9, Math.abs(s) > 1e-6 ? hh / Math.abs(s) : 1e9); return [x + t * c, yr - t * s]; };
      const actif = F > 0 ? persoDe(alpha) : null;
      PERSOS.forEach(p => {
        if (actif && actif.n === p.n) return;
        const [bx, by] = bord(p.a), r = p.a * Math.PI / 180, ux = Math.cos(r), uy = -Math.sin(r), L = Lmax * 0.62;
        const hx = bx + ux * L, hy = by + uy * L;
        g += `<g class="tf-w-repos" data-p="perso" data-n="${p.n}"><line x1="${f1(bx)}" y1="${f1(by)}" x2="${f1(hx)}" y2="${f1(hy)}" class="tf-w-corde-repos"/>${bonhomme(hx, hy, ux, uy, 'tf-perso tf-perso-repos', sc)}` +
          `<text x="${f1(hx + ux * 30 * sc)}" y="${f1(hy + uy * 30 * sc + 5)}" text-anchor="middle" class="tf-w-num">${p.n}</text>` +
          `<circle cx="${f1(hx + ux * 12)}" cy="${f1(hy + uy * 12 - 4)}" r="24" class="tf-poignee tf-poignee-perso"><title>Faire tirer le personnage ${p.n}</title></circle></g>`;
      });
      // le wagon
      g += `<rect x="${f1(x - hw)}" y="${f1(yr - hh)}" width="${f1(2 * hw)}" height="${f1(2 * hh)}" rx="6" class="tf-w-wagon"/><rect x="${f1(x - hw + 9 * sc)}" y="${f1(yr - hh + 8 * sc)}" width="${f1(2 * hw - 18 * sc)}" height="${f1(2 * hh - 16 * sc)}" rx="3" class="tf-w-toit"/>`;
      if (F > 0) [ox, oy] = bord(alpha);
      geo.bord = bord;
    }
    // direction du déplacement (référence de l'angle), arc et valeur de α
    g += `<line x1="${f1(ox)}" y1="${f1(oy)}" x2="${f1(ox + Lmax + 18)}" y2="${f1(oy)}" class="tf-sc-ref"/>`;
    if (F > 0 && alpha !== 0) g += arcAngle(ox, oy, 0, alpha, 26);
    // projection de F⃗ sur le déplacement (pointillés) : F × cos α
    const c = cosd(alpha), Lp = F * kF * c;
    if (F > 0 && c !== 0 && Math.abs(c) !== 1) {
      const r = alpha * Math.PI / 180, tx = ox + F * kF * Math.cos(r), ty = oy - F * kF * Math.sin(r);
      g += `<line x1="${f1(tx)}" y1="${f1(ty)}" x2="${f1(ox + Lp)}" y2="${f1(oy)}" class="tf-sc-perp"/>`;
      g += `<line x1="${f1(ox)}" y1="${f1(oy)}" x2="${f1(ox + Lp)}" y2="${f1(oy)}" class="tf-sc-proj"/>`;
    }
    // la force (et le personnage qui tire, pour le wagon)
    if (F > 0) {
      const a = fleche(ox, oy, alpha, F * kF, COUL.F);
      if (wagon) {
        g += `<line x1="${f1(ox)}" y1="${f1(oy)}" x2="${f1(a.x2)}" y2="${f1(a.y2)}" class="tf-w-corde"/>`;
        g += bonhomme(a.x2 + a.c * 4, a.y2 + a.s * 4, a.c, a.s, 'tf-perso', sc);
      }
      g += a.svg;
      const p = wagon ? persoDe(alpha) : null;
      const d = wagon ? 44 * sc : 18, lx = a.x2 + a.c * d + (Math.abs(a.c) < 0.3 ? 16 : 0), ly = a.y2 + a.s * d + 6;
      g += nomSVG('F', p ? p.n : '', lx, ly, COUL.F, 17);
      g += `<circle cx="${f1(a.x2)}" cy="${f1(a.y2)}" r="20" class="tf-poignee" data-p="fleche"><title>Fais tourner la force</title></circle>`;
      geo.tip = [a.x2, a.y2];
    }
    // valeur de α écrite près de l'arc
    if (F > 0) g += texteAngle(ox, oy, 0, alpha);
    // poignée du point B
    const yB = wagon ? yG : yG + 21;
    g += `<circle cx="${f1(xB)}" cy="${yB}" r="7" class="tf-pt-b"/><circle cx="${f1(xB)}" cy="${yB}" r="22" class="tf-poignee" data-p="B"><title>Fais glisser B</title></circle>`;
    geo.ox = ox; geo.oy = oy; geo.xB = xB; geo.yB = yB;
    const label = `${wagon ? 'Wagon vu de dessus' : 'Chariot'} tiré de A vers B par une force de ${F} N faisant un angle de ${alpha} degrés avec le déplacement ; AB = ${fmt(AB, 1)} m`;
    return { svg: svgDe(W, H, g, label), geo };
  }

  /* ============================================================
     SCÈNE 2 : LE CHEMIN SUIVI (F⃗ constante)
     A (0 ; 0), B (1,2 m ; 0) : AB = 1,2 m, horizontal ; l'angle α de F⃗
     avec AB⃗ est aussi son angle avec l'horizontale
     ============================================================ */
  const B_CH = [1.2, 0];
  const CHEMINS = [
    { id: 'droit', nom: 'Droit' },
    { id: 'escalier', nom: 'Escalier' },
    { id: 'arc', nom: 'Arc' },
    { id: 'zigzag', nom: 'Zigzag' },
    { id: 'libre', nom: 'Tracé libre' },
  ];
  function cheminPts(S) {
    const [bx, by] = B_CH;
    switch (S.ch.chemin) {
      // escalier : deux marches qui montent, un palier, deux marches qui descendent
      case 'escalier': return [[0, 0], [0, 0.2], [0.3, 0.2], [0.3, 0.4], [0.9, 0.4], [0.9, 0.2], [1.2, 0.2], [1.2, 0]];
      case 'arc': {
        // arc bombé au-dessus de [AB], 16 portions
        const p = [], n = 16;
        for (let i = 0; i <= n; i++) { const u = i / n; p.push([bx * u, by * u + 0.5 * Math.sin(Math.PI * u)]); }
        return p;
      }
      case 'zigzag': return [[0, 0], [0.2, 0.4], [0.4, -0.15], [0.6, 0.4], [0.8, -0.15], [1.0, 0.4], [1.2, 0]];
      case 'libre': return S.ch.libre && S.ch.libre.length > 1 ? S.ch.libre : null;
      default: return [[0, 0], [bx, by]];
    }
  }
  function portions(pts) {
    const r = [];
    for (let i = 1; i < pts.length; i++) {
      const dx = pts[i][0] - pts[i - 1][0], dy = pts[i][1] - pts[i - 1][1], l = Math.hypot(dx, dy);
      if (l > 1e-9) r.push({ dx, dy, l, ang: Math.atan2(dy, dx) * 180 / Math.PI });
    }
    return r;
  }
  // position et indice de portion après une longueur s parcourue
  function surChemin(pts, s) {
    let reste = s;
    for (let i = 1; i < pts.length; i++) {
      const [x0, y0] = pts[i - 1], [x1, y1] = pts[i], L = Math.hypot(x1 - x0, y1 - y0);
      if (reste <= L + 1e-12 || i === pts.length - 1) { const u = L ? Math.min(1, reste / L) : 1; return { x: x0 + u * (x1 - x0), y: y0 + u * (y1 - y0), i: i - 1 }; }
      reste -= L;
    }
    return { x: pts[0][0], y: pts[0][1], i: 0 };
  }
  TF.surChemin = surChemin;
  function geoChemins(W, H) {
    const x0 = -0.2, x1 = 1.4, y0 = -0.3, y1 = 0.7, m = 14;
    const k = Math.min((W - 2 * m) / (x1 - x0), (H - 2 * m - 18) / (y1 - y0));
    const ox = (W - k * (x1 - x0)) / 2 - k * x0, oy = (H + k * (y1 - y0)) / 2 + k * y0 + 8;
    return { W, H, k, X: x => ox + k * x, Y: y => oy - k * y, Xi: px => (px - ox) / k, Yi: py => (oy - py) / k, kF: Math.min(0.5 * k, 160) / 20, bornes: [x0, x1, y0, y1] };
  }
  function dessinChemins(S, W, H) {
    const geo = geoChemins(W, H), { k, X, Y, kF } = geo, ch = S.ch;
    let g = '';
    // quadrillage : 10 cm
    const [x0, x1, y0, y1] = geo.bornes;
    for (let x = Math.ceil(x0 * 10) / 10; x <= x1 + 1e-9; x += 0.1) g += `<line x1="${f1(X(x))}" y1="${f1(Y(y0))}" x2="${f1(X(x))}" y2="${f1(Y(y1))}" class="tf-grille"/>`;
    for (let y = Math.ceil(y0 * 10) / 10; y <= y1 + 1e-9; y += 0.1) g += `<line x1="${f1(X(x0))}" y1="${f1(Y(y))}" x2="${f1(X(x1))}" y2="${f1(Y(y))}" class="tf-grille"/>`;
    g += `<text x="${f1(X(x0) + 4)}" y="${f1(Y(y1) + 14)}" class="tf-sc-txt">1 carreau = 10 cm</text>`;
    // les chemins prédéfinis, en gris ; le chemin choisi par-dessus
    CHEMINS.forEach(c => {
      if (c.id === 'libre' || c.id === ch.chemin) return;
      const p = cheminPts({ ch: { chemin: c.id } });
      g += `<polyline points="${p.map(q => f1(X(q[0])) + ',' + f1(Y(q[1]))).join(' ')}" class="tf-ch-autre"/>`;
    });
    // AB⃗
    g += trait(X(0), Y(0), X(B_CH[0]), Y(B_CH[1]), 'tf-sc-ab tf-ch-ab');
    const pts = cheminPts(S);
    if (pts) {
      const por = portions(pts), pos = surChemin(pts, ch.avance);
      g += `<polyline points="${pts.map(q => f1(X(q[0])) + ',' + f1(Y(q[1]))).join(' ')}" class="tf-ch-trajet"/>`;
      // portion parcourue (trait épais)
      if (ch.avance > 0) {
        const faits = pts.slice(0, pos.i + 1).concat([[pos.x, pos.y]]);
        g += `<polyline points="${faits.map(q => f1(X(q[0])) + ',' + f1(Y(q[1]))).join(' ')}" class="tf-ch-fait"/>`;
      }
      // séparations des portions (sauf l'arc et le tracé libre, très découpés)
      if (por.length <= 8) pts.slice(1, -1).forEach(q => { g += `<circle cx="${f1(X(q[0]))}" cy="${f1(Y(q[1]))}" r="3.5" class="tf-ch-noeud"/>`; });
    }
    if (ch.trace && ch.trace.length > 1) g += `<polyline points="${ch.trace.map(q => f1(X(q[0])) + ',' + f1(Y(q[1]))).join(' ')}" class="tf-ch-trace"/>`;
    // A et B
    g += `<circle cx="${f1(X(0))}" cy="${f1(Y(0))}" r="6" class="tf-sc-point"/><text x="${f1(X(0) - 10)}" y="${f1(Y(0) + 22)}" class="tf-sc-pt">A</text>`;
    g += `<circle cx="${f1(X(B_CH[0]))}" cy="${f1(Y(B_CH[1]))}" r="6" class="tf-sc-point"/><text x="${f1(X(B_CH[0]) + 10)}" y="${f1(Y(B_CH[1]) + 6)}" class="tf-sc-pt">B</text>`;
    g += nomSVG('AB', '', X(B_CH[0] * 0.5), Y(0) + 22, '#55585f', 14);
    // le mobile et la force (constante)
    const p = pts ? surChemin(pts, ch.avance) : { x: 0, y: 0, i: 0 }, mx = X(p.x), my = Y(p.y);
    const angAB = Math.atan2(B_CH[1], B_CH[0]) * 180 / Math.PI;
    g += `<line x1="${f1(mx)}" y1="${f1(my)}" x2="${f1(mx + 0.34 * k * Math.cos(angAB * Math.PI / 180))}" y2="${f1(my - 0.34 * k * Math.sin(angAB * Math.PI / 180))}" class="tf-sc-ref"/>`;
    const alphaAB = TF.normal(ch.phi - angAB);
    if (ch.F > 0 && alphaAB !== 0) g += arcAngle(mx, my, angAB, alphaAB, 24);
    g += `<circle cx="${f1(mx)}" cy="${f1(my)}" r="9" class="tf-ch-mobile"/>`;
    if (ch.F > 0) {
      const a = fleche(mx, my, ch.phi, ch.F * kF, COUL.F);
      g += a.svg + nomSVG('F', '', a.x2 + a.c * 16 + (Math.abs(a.c) < 0.3 ? 14 : 0), a.y2 + a.s * 16 + 6, COUL.F, 17);
      g += texteAngle(mx, my, angAB, alphaAB);
      if (!ch.anim && ch.avance === 0) g += `<circle cx="${f1(a.x2)}" cy="${f1(a.y2)}" r="20" class="tf-poignee" data-p="fleche"><title>Fais tourner la force</title></circle>`;
    }
    // portion en cours : angle entre F⃗ et la portion
    if (pts && ch.avance > 0 && ch.F > 0) {
      const por = portions(pts)[Math.min(p.i, portions(pts).length - 1)];
      if (por) {
        const al = Math.round(Math.abs(TF.normal(ch.phi - por.ang)));
        g += `<text x="${f1(mx)}" y="${f1(my + 30)}" text-anchor="middle" class="tf-sc-info">portion ${p.i + 1} : angle ${al}°${al === 90 ? ', W = 0' : ''}</text>`;
      }
    }
    if (ch.chemin === 'libre' && !ch.libre && !(ch.trace && ch.trace.length)) g += `<text x="${f1(X(0.6))}" y="${f1(Y(-0.24))}" text-anchor="middle" class="tf-sc-info">Pose le doigt (ou la souris) sur A et trace ton chemin jusqu'à B.</text>`;
    geo.mobile = [mx, my];
    return { svg: svgDe(W, H, g, `Chemin ${ch.chemin} de A à B ; force constante de ${ch.F} N`), geo };
  }

  /* ============================================================
     SCÈNE 3 : LE TRAVAIL DU POIDS (vu de profil)
     x de 0 à 200 m ; A en x = 10 m (altitude z_A), B en x = 190 m (z_B)
     ============================================================ */
  const TRAJETS = [
    { id: 'toboggan', nom: 'Toboggan' },
    { id: 'ski', nom: 'Piste de ski' },
    { id: 'escalier', nom: 'Escalier' },
    { id: 'libre', nom: 'Tracé libre' },
  ];
  const XA = 10, XB = 190, ZMAX = 160;
  function trajetPts(S) {
    const { zA, zB, trajet } = S.po, p = [];
    if (trajet === 'libre') return S.po.libre && S.po.libre.length > 1 ? S.po.libre : null;
    if (trajet === 'escalier') {
      const xs = [50, 90, 130, 170];
      p.push([XA, zA]);
      xs.forEach((x, i) => { const z0 = zA + (zB - zA) * i / 4, z1 = zA + (zB - zA) * (i + 1) / 4; p.push([x, z0], [x, z1]); });
      p.push([XB, zB]);
      return p;
    }
    const n = 48;
    for (let i = 0; i <= n; i++) {
      const u = i / n, x = XA + (XB - XA) * u;
      let z;
      if (trajet === 'ski') z = zA + (zB - zA) * u + 16 * Math.pow(Math.sin(3 * Math.PI * u), 2) * (1 - 0.3 * u);
      else z = zB + (zA - zB) * (1 + Math.cos(Math.PI * u)) / 2;
      p.push([x, Math.min(ZMAX, z)]);
    }
    return p;
  }
  // décomposition d'un trajet en marches : horizontales (W = 0) et verticales (W = ± m g Δz)
  function marches(pts, n) {
    if (!pts) return [];
    const r = [];
    if (S_escalier(pts)) return portions(pts).map((q, i) => ({ x0: pts[i][0], z0: pts[i][1], x1: pts[i + 1][0], z1: pts[i + 1][1] }));
    // n marches : on suit les variations d'altitude du trajet
    const step = Math.max(1, Math.floor((pts.length - 1) / n));
    let prev = pts[0];
    for (let i = step; i < pts.length; i += step) {
      const q = i >= pts.length - step ? pts[pts.length - 1] : pts[i];
      r.push({ x0: prev[0], z0: prev[1], x1: q[0], z1: prev[1] }, { x0: q[0], z0: prev[1], x1: q[0], z1: q[1] });
      prev = q;
      if (q === pts[pts.length - 1]) break;
    }
    return r;
  }
  const S_escalier = pts => pts.every((q, i) => i === 0 || q[0] === pts[i - 1][0] || q[1] === pts[i - 1][1]);
  function geoPoids(W, H) {
    const mg = 52, md = 26, mh = 30, mb = 30;
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
    g += `<text x="${f1(X(0) + 8)}" y="${f1(Z(ZMAX) - 4)}" class="tf-nom-axe">z (m)</text>`;
    g += `<line x1="${f1(X(0))}" y1="${f1(Z(0))}" x2="${f1(X(200))}" y2="${f1(Z(0))}" class="tf-sc-sol"/>`;
    const pts = trajetPts(S);
    if (pts) {
      // relief sous le trajet (sauf tracé libre)
      if (po.trajet !== 'libre') g += `<path d="M${f1(X(pts[0][0]))},${f1(Z(0))} ${pts.map(q => 'L' + f1(X(q[0])) + ',' + f1(Z(q[1]))).join(' ')} L${f1(X(pts[pts.length - 1][0]))},${f1(Z(0))} Z" class="tf-po-relief"/>`;
      g += `<polyline points="${pts.map(q => f1(X(q[0])) + ',' + f1(Z(q[1]))).join(' ')}" class="tf-ch-trajet"/>`;
      // décomposition en déplacements horizontaux et verticaux
      if (po.decompose) {
        marches(pts, 8).forEach(m => {
          const hor = m.z0 === m.z1;
          if (Math.abs(m.x1 - m.x0) < 1e-9 && Math.abs(m.z1 - m.z0) < 1e-9) return;
          g += `<line x1="${f1(X(m.x0))}" y1="${f1(Z(m.z0))}" x2="${f1(X(m.x1))}" y2="${f1(Z(m.z1))}" class="${hor ? 'tf-po-hor' : 'tf-po-ver'}"/>`;
        });
        // légende : en haut à gauche, ou en bas si A est haut
        const lx = X(22), ly = po.zA > 110 ? Z(0) - 34 : Z(ZMAX) + 4;
        g += `<g class="tf-po-leg"><line x1="${f1(lx)}" y1="${f1(ly)}" x2="${f1(lx + 22)}" y2="${f1(ly)}" class="tf-po-hor"/><text x="${f1(lx + 28)}" y="${f1(ly + 4)}" class="tf-sc-txt">horizontal : W = 0</text>` +
          `<line x1="${f1(lx)}" y1="${f1(ly + 16)}" x2="${f1(lx + 22)}" y2="${f1(ly + 16)}" class="tf-po-ver"/><text x="${f1(lx + 28)}" y="${f1(ly + 20)}" class="tf-sc-txt">vertical : W = ± m g Δz</text></g>`;
      }
      if (po.avance > 0) {
        const pos = surChemin(pts.map(q => [q[0], q[1]]), po.avance);
        const faits = pts.slice(0, pos.i + 1).concat([[pos.x, pos.y]]);
        g += `<polyline points="${faits.map(q => f1(X(q[0])) + ',' + f1(Z(q[1]))).join(' ')}" class="tf-ch-fait"/>`;
      }
    }
    if (po.trace && po.trace.length > 1) g += `<polyline points="${po.trace.map(q => f1(X(q[0])) + ',' + f1(Z(q[1]))).join(' ')}" class="tf-ch-trace"/>`;
    // A et B (poignées : glisser verticalement pour changer l'altitude)
    [['A', XA, po.zA], ['B', XB, po.zB]].forEach(([n, x, z]) => {
      g += `<line x1="${f1(X(x))}" y1="${f1(Z(z))}" x2="${f1(X(0))}" y2="${f1(Z(z))}" class="tf-sc-repere"/>`;
      g += `<circle cx="${f1(X(x))}" cy="${f1(Z(z))}" r="7" class="tf-pt-b"/><text x="${f1(X(x) + (n === 'A' ? -14 : 14))}" y="${f1(Z(z) - 8)}" text-anchor="middle" class="tf-sc-pt">${n}</text>`;
      g += `<text x="${f1(X(x) + (n === 'A' ? 16 : -16))}" y="${f1(Z(z) - 12)}" text-anchor="${n === 'A' ? 'start' : 'end'}" class="tf-sc-txt">z<tspan dy="3" font-size="9">${n}</tspan><tspan dy="-3"> = ${z} m</tspan></text>`;
      if (po.trajet !== 'libre' || !po.trace) g += `<circle cx="${f1(X(x))}" cy="${f1(Z(z))}" r="22" class="tf-poignee tf-poignee-v" data-p="${n}"><title>Fais glisser ${n} vers le haut ou vers le bas</title></circle>`;
    });
    // le skieur (ou l'objet) et son poids
    const p = pts ? surChemin(pts, po.avance) : { x: XA, y: po.zA }, mx = X(p.x), my = Z(p.y);
    g += `<circle cx="${f1(mx)}" cy="${f1(my - 9)}" r="9" class="tf-ch-mobile"/><text x="${f1(mx)}" y="${f1(my - 5)}" text-anchor="middle" class="tf-po-m">m</text>`;
    const a = fleche(mx, my - 9, -90, 46, COUL.P);
    g += a.svg + nomSVG('P', '', mx - 16, my + 34, COUL.P, 16);
    if (po.trajet === 'libre' && !po.libre && !(po.trace && po.trace.length)) g += `<text x="${f1(X(100))}" y="${f1(Z(ZMAX) + 2)}" text-anchor="middle" class="tf-sc-info">Pose le doigt (ou la souris) sur A et trace le trajet jusqu'à B.</text>`;
    return { svg: svgDe(W, H, g, `Trajet ${po.trajet} de A (altitude ${po.zA} m) à B (altitude ${po.zB} m) ; objet de masse ${po.m} kg`), geo };
  }

  // angle ramené entre −180° et 180°
  TF.normal = a => { let b = ((a + 180) % 360 + 360) % 360 - 180; if (Math.abs(b + 180) < 1e-9 && a > 0) b = 180; return Math.round(b * 1e6) / 1e6; };
  Object.assign(TF, { dessinForce, dessinChemins, dessinPoids, CHEMINS, cheminPts, portions, TRAJETS, trajetPts, marches, B_CH, XA, XB, ZMAX, fleche, nomSVG });
})();
