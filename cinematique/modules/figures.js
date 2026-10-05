/* ============================================================
   Figures de l'application « Cinématique » (SVG)

   FIG.chrono(opts)        chronophotographie : positions successives d'un point
   FIG.referentiels()      Soleil, Terre et les trois référentiels
   FIG.train(n)            balle lâchée dans un train, vue dans les deux référentiels
   FIG.velo()              valve d'une roue de vélo dans les deux référentiels
   FIG.trigo(opts)         vecteur, angle et triangle rectangle (trigonométrie)
   FIG.frenet(opts)        mouvement circulaire et repère de Frenet
   FIG.ballon(zone, opts)  ballon lancé : vecteur position (et vitesse), animé
   ============================================================ */
(function () {
  'use strict';

  const V = window.VEC, C = V.C;
  const acc = () => getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#5a3fc4';
  const svg = (w, h, contenu, aria, cls) => `<svg viewBox="0 0 ${w} ${h}" class="${cls || 'cin-fig'}" role="img" aria-label="${aria || ''}" style="max-width:${w}px">${contenu}</svg>`;
  const point = (x, y, r, coul, creux) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}" fill="${creux ? '#fff' : coul}" stroke="${coul}" stroke-width="${creux ? 2 : 0}"/>`;

  /* ---------- Chronophotographie ----------
     opts = { forme: 'droite' | 'oblique' | 'cercle' | 'parabole' | 'courbe',
              vitesse: 'uniforme' | 'accelere' | 'ralenti', n, sens: 1 | -1 } */
  const CHEMINS = {
    droite: t => [30 + 250 * t, 60],
    oblique: t => [40 + 230 * t, 100 - 70 * t],
    cercle: t => { const a = (200 - 300 * t) * Math.PI / 180; return [150 + 62 * Math.cos(a), 78 - 62 * Math.sin(a)]; },
    parabole: t => [30 + 250 * t, 120 - 360 * t * (1 - t)],
    courbe: t => [30 + 250 * t, 80 - 38 * Math.sin(t * Math.PI * 1.6)],
  };
  const HAUTEUR = { droite: 110, oblique: 130, cercle: 156, parabole: 140, courbe: 140 };
  function chrono(o) {
    o = Object.assign({ forme: 'droite', vitesse: 'uniforme', n: 8, sens: 1 }, o);
    const P0 = CHEMINS[o.forme], P = o.sens === 1 ? P0 : t => P0(1 - t);
    // abscisse curviligne : positions régulières le long du chemin
    const N = 400, L = [0];
    let prec = P(0);
    for (let i = 1; i <= N; i++) { const q = P(i / N); L.push(L[i - 1] + Math.hypot(q[0] - prec[0], q[1] - prec[1])); prec = q; }
    const tDe = s => { const cible = s * L[N]; let i = 0; while (i < N && L[i + 1] < cible) i++; const f = (cible - L[i]) / ((L[i + 1] - L[i]) || 1); return (i + f) / N; };
    // accéléré : écarts 3, 5, 7… (mouvement commencé avant la première position), ralenti : l'inverse
    const m = o.n - 1, acc = x => ((x * m + 1) ** 2 - 1) / ((m + 1) ** 2 - 1);
    const loi = { uniforme: x => x, accelere: acc, ralenti: x => 1 - acc(1 - x) }[o.vitesse];
    const c = o.coul || C.encre;
    let s = '';
    const pts = [];
    for (let i = 0; i < o.n; i++) pts.push(P(tDe(loi(i / (o.n - 1)))));
    pts.forEach((q, i) => { s += point(q[0], q[1], i === 0 ? 4.5 : 4, c, i === 0); });
    // sens du mouvement : flèche après le dernier point
    const a = pts[o.n - 2], b = pts[o.n - 1], d = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    const ux = (b[0] - a[0]) / d, uy = (b[1] - a[1]) / d;
    s += V.fleche(b[0] + ux * 10, b[1] + uy * 10, b[0] + ux * 34, b[1] + uy * 34, C.encre3, 2, 8);
    // « départ » avant la première position, du côté opposé au mouvement
    const e = Math.hypot(pts[1][0] - pts[0][0], pts[1][1] - pts[0][1]) || 1, vx = (pts[1][0] - pts[0][0]) / e, vy = (pts[1][1] - pts[0][1]) / e;
    const lx = pts[0][0] - vx * 26, ly = pts[0][1] - vy * 18;
    s += V.texte(lx, ly + 4, 'départ', 11, C.encre3, Math.abs(vx) > .5 ? (vx > 0 ? 'end' : 'start') : 'middle', 600);
    return svg(310, HAUTEUR[o.forme], s, 'Chronophotographie : positions successives à intervalles de temps égaux', o.cls);
  }

  /* ---------- Les trois référentiels ---------- */
  function referentiels() {
    const A = acc(), c = C.encre;
    let s = '';
    s += '<ellipse cx="210" cy="132" rx="180" ry="62" fill="none" stroke="#c9c4b9" stroke-width="1.5"/>';
    // Soleil et référentiel héliocentrique
    s += '<circle cx="210" cy="132" r="22" fill="#fde9b5" stroke="#e0a526" stroke-width="2"/>';
    s += V.fleche(210, 132, 300, 132, A, 2.5, 10) + V.fleche(210, 132, 210, 48, A, 2.5, 10) + V.fleche(210, 132, 158, 176, A, 2.5, 10, true);
    s += V.texte(210, 168, 'Soleil', 12, c);
    s += V.texte(312, 128, 'étoile', 11, C.encre2, 'start', 600) + V.texte(312, 141, 'fixe 1', 11, C.encre2, 'start', 600);
    s += V.texte(210, 30, 'étoile fixe 2', 11, C.encre2) + V.texte(130, 196, 'étoile fixe 3', 11, C.encre2);
    // Terre, référentiel géocentrique (axes parallèles) et terrestre (lié au sol)
    const tx = 330, ty = 178;
    s += `<circle cx="${tx}" cy="${ty}" r="15" fill="#d6e6f7" stroke="#2952c8" stroke-width="2"/>`;
    s += V.fleche(tx, ty, tx + 42, ty, C.bleu, 2.2, 8) + V.fleche(tx, ty, tx, ty - 42, C.bleu, 2.2, 8) + V.fleche(tx, ty, tx - 26, ty + 22, C.bleu, 2.2, 8, true);
    const sx = tx - 10, sy = ty - 11;
    s += V.fleche(sx, sy, sx - 26, sy - 20, C.orange, 2.2, 7) + V.fleche(sx, sy, sx + 18, sy - 26, C.orange, 2.2, 7);
    s += V.texte(tx + 22, ty + 32, 'Terre', 12, c);
    // légende
    s += `<rect x="12" y="240" width="12" height="4" fill="${A}"/>` + V.texte(30, 246, 'héliocentrique', 12, A, 'start');
    s += `<rect x="150" y="240" width="12" height="4" fill="${C.bleu}"/>` + V.texte(168, 246, 'géocentrique', 12, C.bleu, 'start');
    s += `<rect x="280" y="240" width="12" height="4" fill="${C.orange}"/>` + V.texte(298, 246, 'terrestre', 12, C.orange, 'start');
    return svg(420, 256, s, 'Les référentiels héliocentrique, géocentrique et terrestre');
  }

  /* ---------- Balle lâchée dans un train qui roule ----------
     n positions affichées (0 à 6), pour l'animation */
  function train(n) {
    const ys = [0, 1, 2, 3, 4, 5, 6].map(i => 26 + 3.4 * ((i + 1) * (i + 1) - 1));
    // référentiel du train : la balle tombe verticalement
    let a = '<rect x="20" y="10" width="140" height="180" rx="10" fill="#f6f4ef" stroke="#c9c4b9" stroke-width="1.5"/>';
    a += '<rect x="34" y="24" width="112" height="70" rx="6" fill="#e8f1fa" stroke="#c9c4b9"/>';
    for (let i = 0; i < n; i++) a += point(90, ys[i], 4.5, C.encre, i === 0);
    // référentiel terrestre : le train avance, la trajectoire est une parabole
    const dx = 24, xs = [0, 1, 2, 3, 4, 5, 6].map(i => 40 + dx * i);
    const k = Math.max(0, n - 1);
    let b = `<g opacity=".55"><rect x="${xs[k] - 30}" y="10" width="60" height="180" rx="8" fill="none" stroke="#c9c4b9" stroke-width="1.5" stroke-dasharray="5 4"/></g>`;
    b += '<line x1="0" y1="196" x2="220" y2="196" stroke="#8d8f94" stroke-width="2"/>';
    for (let i = 0; i < n; i++) b += point(xs[i], ys[i], 4.5, C.encre, i === 0);
    if (n > 1) b += V.fleche(xs[k] - 26, 205, xs[k] + 26, 205, C.encre3, 2, 8);
    return `<div class="cin-deux">
      <div><p>Référentiel lié au train</p>${svg(180, 200, a, 'Dans le train : la balle tombe en ligne droite')}</div>
      <div><p>Référentiel terrestre (lié à la vache)</p>${svg(220, 212, b, 'Depuis le sol : la balle décrit une parabole')}</div></div>`;
  }

  /* ---------- Valve d'une roue de vélo ---------- */
  function velo() {
    const A = acc(), r = 30;
    // référentiel du vélo : un cercle autour du moyeu
    let a = `<circle cx="80" cy="70" r="${r}" fill="none" stroke="#c9c4b9" stroke-width="10"/>`;
    for (let i = 0; i < 12; i++) { const t = i * Math.PI / 6; a += point(80 + r * Math.cos(t), 70 - r * Math.sin(t), 3.5, A); }
    a += point(80, 70, 3, C.encre);
    // référentiel terrestre : une courbe en arches (cycloïde)
    let b = '<line x1="0" y1="112" x2="300" y2="112" stroke="#8d8f94" stroke-width="2"/>', d = '';
    for (let i = 0; i <= 200; i++) { const t = i / 200 * 4 * Math.PI * .98; const x = 14 + 20 * (t - Math.sin(t)), y = 112 - 20 * (1 - Math.cos(t)); d += (i ? 'L' : 'M') + x.toFixed(1) + ',' + y.toFixed(1); }
    b += `<path d="${d}" fill="none" stroke="#c9c4b9" stroke-width="1.5" stroke-dasharray="4 4"/>`;
    for (let i = 0; i <= 24; i++) { const t = i / 24 * 4 * Math.PI * .98; b += point(14 + 20 * (t - Math.sin(t)), 112 - 20 * (1 - Math.cos(t)), 3.5, A); }
    return `<div class="cin-deux">
      <div><p>Référentiel lié au vélo</p>${svg(160, 140, a, 'La valve décrit un cercle autour du moyeu')}</div>
      <div><p>Référentiel terrestre</p>${svg(300, 124, b, 'La valve décrit une courbe en arches')}</div></div>`;
  }

  /* ---------- Décomposition d'un vecteur en déplacements horizontal et vertical ----------
     à passer dans opts.extra d'un repère : FIG.decomp([x0, y0], [a, b], etape)
     etape : 1 = horizontal seul, 2 = horizontal et vertical */
  function decomp(dep, c, etape) {
    return g => {
      const A = getComputedStyle(document.documentElement).getPropertyValue('--accent-ink').trim() || '#3f2a93';
      const x0 = g.px(dep[0]), y0 = g.py(dep[1]), x1 = g.px(dep[0] + c[0]), y1 = g.py(dep[1] + c[1]);
      const t = g.tg + 2, sg = v => (v > 0 ? '+' : '−') + Math.abs(v);
      let s = '';
      if (c[0] && etape !== 0) {
        s += V.fleche(x0, y0, x1, y0, A, 2, 8, true);
        s += V.texte((x0 + x1) / 2, c[1] > 0 ? y0 + t + 3 : y0 - 6, sg(c[0]), t, A);
      }
      if (c[1] && (etape == null || etape >= 2)) {
        s += V.fleche(x1, y0, x1, y1, A, 2, 8, true);
        s += V.texte(c[0] >= 0 ? x1 + 6 : x1 - 6, (y0 + y1) / 2 + t * .35, sg(c[1]), t, A, c[0] >= 0 ? 'start' : 'end');
      }
      return s;
    };
  }

  /* ---------- Trigonométrie : vecteur partant de O, angle α avec un axe ----------
     opts = { V, ang (degrés), axe: 'x' | 'y', quad: 1 à 4, nom, unite,
              cotes: 'noms' | 'formules' | 'valeurs' | null, L (longueur dessinée) } */
  // direction du vecteur (degrés, sens trigonométrique) et demi-axe de référence
  function directions(ang, axe, quad) {
    const t = axe === 'x' ? [ang, 180 - ang, 180 + ang, -ang][quad - 1] : [90 - ang, 90 + ang, 270 - ang, 270 + ang][quad - 1];
    const ref = axe === 'x' ? (quad === 1 || quad === 4 ? 0 : 180) : (quad <= 2 ? 90 : 270);
    return { t, ref };
  }
  // coordonnées exactes du vecteur
  function trigoCoord(V, ang, axe, quad) {
    const t = directions(ang, axe, quad).t * Math.PI / 180;
    return [V * Math.cos(t), V * Math.sin(t)];
  }
  // erreurs fréquentes sur les coordonnées (v = [x, y] proposé)
  function diagTrigo(v, V, ang, axe, quad) {
    const [x, y] = trigoCoord(V, ang, axe, quad), pr = (a, b) => Math.abs(Math.abs(a) - Math.abs(b)) < .06 + .01 * Math.abs(b);
    const cos = V * Math.cos(ang * Math.PI / 180), sin = V * Math.sin(ang * Math.PI / 180);
    const adjX = axe === 'x';
    if (pr(v[0], x) && pr(v[1], y)) return 'Les longueurs sont justes, mais pas les signes : regarde dans quel sens pointe le vecteur (vers la gauche : x négatif ; vers le bas : y négatif).';
    if (pr(v[0], y) && pr(v[1], x)) return `Tu as inversé cos et sin. L'angle α est mesuré à partir de l'axe des ${axe} : le côté adjacent à α est sur l'axe des ${axe}, c'est lui qui vaut V × cos α.`;
    const rc = V * Math.cos(ang), rs = V * Math.sin(ang);
    if ((pr(v[0], rc) || pr(v[0], rs)) && (pr(v[1], rc) || pr(v[1], rs))) return 'Ta calculatrice est en mode radians : passe-la en mode <b>degrés</b>.';
    if (Math.abs(v[0]) > V + .1 || Math.abs(v[1]) > V + .1) return 'Une coordonnée ne peut pas être plus grande que le module du vecteur : multiplie V par cos α ou sin α (ils sont plus petits que 1).';
    if (pr(adjX ? v[0] : v[1], cos) && !pr(adjX ? v[1] : v[0], sin)) return `Le côté adjacent est juste ; le côté opposé vaut V × sin α.`;
    if (pr(adjX ? v[1] : v[0], sin) && !pr(adjX ? v[0] : v[1], cos)) return `Le côté opposé est juste ; le côté adjacent vaut V × cos α.`;
    return null;
  }
  function trigo(o) {
    o = Object.assign({ V: 5, ang: 30, axe: 'x', quad: 1, nom: 'v', unite: '', cotes: 'noms', L: 104 }, o);
    const W = 300, H = 270, cx = 150, cy = 135, A = acc();
    const Ai = getComputedStyle(document.documentElement).getPropertyValue('--accent-ink').trim() || '#3f2a93';
    const { t, ref } = directions(o.ang, o.axe, o.quad), rad = t * Math.PI / 180;
    const ex = cx + o.L * Math.cos(rad), ey = cy - o.L * Math.sin(rad);
    let s = '';
    // axes
    s += V.fleche(14, cy, W - 10, cy, C.encre, 1.5, 9) + V.fleche(cx, H - 10, cx, 12, C.encre, 1.5, 9);
    // « O » dans le quadrant opposé au vecteur
    const oq = [[-7, 15, 'end'], [7, 15, 'start'], [7, -6, 'start'], [-7, -6, 'end']][o.quad - 1];
    s += V.texte(W - 14, cy - 8, 'x', 13, C.encre, 'end') + V.texte(cx + 9, 22, 'y', 13, C.encre, 'start') + V.texte(cx + oq[0], cy + oq[1], 'O', 12, C.encre2, oq[2], 600);
    // triangle rectangle : pied sur l'axe de référence
    const fx = o.axe === 'x' ? ex : cx, fy = o.axe === 'x' ? cy : ey;
    const cAdj = C.vert, cOpp = C.orange;
    s += `<line x1="${cx}" y1="${cy}" x2="${fx}" y2="${fy}" stroke="${cAdj}" stroke-width="5" stroke-linecap="round" opacity=".8"/>`;
    s += `<line x1="${fx}" y1="${fy}" x2="${ex}" y2="${ey}" stroke="${cOpp}" stroke-width="5" stroke-linecap="round" opacity=".8"/>`;
    // angle droit au pied
    const k = 9, sx = Math.sign(cx - fx) || 1, sy = Math.sign(ey - fy) || 1;
    if (o.axe === 'x') s += `<path d="M${fx + sx * k},${fy} V${fy + sy * k} H${fx}" fill="none" stroke="${C.encre2}" stroke-width="1.3"/>`;
    else { const sx2 = Math.sign(ex - fx) || 1, sy2 = Math.sign(cy - fy) || 1; s += `<path d="M${fx + sx2 * k},${fy} V${fy + sy2 * k} H${fx}" fill="none" stroke="${C.encre2}" stroke-width="1.3"/>`; }
    // vecteur
    s += V.fleche(cx, cy, ex, ey, Ai, 3.2, 13);
    s += V.arc(cx, cy, 34, ref, ref + ((t - ref + 540) % 360 - 180), Ai, 'α', 15);
    // nom au milieu de la flèche, du côté opposé au triangle
    const mx = (cx + ex) / 2, my = (cy + ey) / 2, nx = -(ey - cy) / o.L, ny = (ex - cx) / o.L;
    const sgn = Math.hypot(mx + nx * 10 - fx, my + ny * 10 - fy) > Math.hypot(mx - nx * 10 - fx, my - ny * 10 - fy) ? 1 : -1;
    s += V.nomSVG(o.nom, mx + sgn * nx * 17, my + sgn * ny * 17 + 6, 16, Ai);
    // cotes
    if (o.cotes) {
      const cosT = o.cotes === 'noms' ? 'adjacent' : o.cotes === 'formules' ? `${o.Vnom || 'V'} × cos α` : o.valAdj;
      const sinT = o.cotes === 'noms' ? 'opposé' : o.cotes === 'formules' ? `${o.Vnom || 'V'} × sin α` : o.valOpp;
      const mA = [(cx + fx) / 2, (cy + fy) / 2], mO = [(fx + ex) / 2, (fy + ey) / 2];
      if (o.axe === 'x') {
        s += V.texte(mA[0], cy + (ey < cy ? 18 : -9), cosT, 12.5, cAdj);
        s += V.texte(fx + (ex > cx ? 6 : -6), mO[1] + 4, sinT, 12.5, cOpp, ex > cx ? 'start' : 'end');
      } else {
        s += V.texte(cx + (ex > cx ? -7 : 7), mA[1] + 4, cosT, 12.5, cAdj, ex > cx ? 'end' : 'start');
        s += V.texte(mO[0], fy + (ey < cy ? -8 : 18), sinT, 12.5, cOpp);
      }
    }
    const unite = (o.unite || '').replace(/<sup>[−-]1<\/sup>/g, '⁻¹').replace(/<sup>[−-]2<\/sup>/g, '⁻²').replace(/<[^>]+>/g, '');
    if (o.legende !== false) s += V.texte(10, H - 8, `${o.nomV || o.nom.replace('_', '')} = ${o.Vtxt || window.CIN.fmt(o.V)}${unite ? ' ' + unite : ''} ; α = ${o.ang}°`, 13, C.encre, 'start');
    return svg(W, H, s, 'Vecteur partant de O, angle α avec un axe');
  }

  /* ---------- Mouvement circulaire et repère de Frenet ----------
     opts = { theta (degrés), sens: 1 (sens trigonométrique) ou −1, r (px),
              ut, un, om, rayon (booléens), v (longueur en px), at, an (px), traces (positions) } */
  function frenet(o) {
    o = Object.assign({ theta: 40, sens: 1, r: 110, ut: true, un: true, om: false, rayon: true, v: 0, at: 0, an: 0, traces: 0, W: 360, H: 340, U: 50 }, o);
    const cx = o.W / 2, cy = o.H / 2, A = acc(), Ai = getComputedStyle(document.documentElement).getPropertyValue('--accent-ink').trim() || '#3f2a93';
    const th = o.theta * Math.PI / 180, mx = cx + o.r * Math.cos(th), my = cy - o.r * Math.sin(th);
    const tx = -Math.sin(th) * o.sens, ty = -Math.cos(th) * o.sens;      // tangente (écran), sens du mouvement
    const nx = -Math.cos(th), ny = Math.sin(th);                         // normale vers le centre (écran)
    let s = `<circle cx="${cx}" cy="${cy}" r="${o.r}" fill="none" stroke="#c9c4b9" stroke-width="2"/>`;
    for (let k = 1; k <= o.traces; k++) {                                // positions précédentes (chronophotographie)
      const a = th - o.sens * k * .32; s += point(cx + o.r * Math.cos(a), cy - o.r * Math.sin(a), 3, '#8d8f94');
    }
    s += point(cx, cy, 3.5, C.encre) + V.texte(cx - 9, cy + 16, 'O', 13, C.encre, 'end');
    if (o.rayon && !o.om) s += V.pointille(cx, cy, mx, my, C.encre3, 1.4) + V.texte((cx + mx) / 2 - tx * 12, (cy + my) / 2 - ty * 12 + 5, 'r', 14, C.encre2);
    // sens du mouvement sur le cercle
    const af = th + o.sens * 2.2, ax = cx + (o.r + 12) * Math.cos(af), ay = cy - (o.r + 12) * Math.sin(af);
    s += V.fleche(ax, ay, ax - Math.sin(af) * o.sens * 16, ay - Math.cos(af) * o.sens * 16, C.encre3, 2, 7);
    if (o.om) s += V.fleche(cx, cy, mx, my, C.encre, 2.5, 11) + V.nomSVG('OM', (cx + mx) / 2 - tx * 20, (cy + my) / 2 - ty * 20 + 6, 14, C.encre);
    if (o.an || o.at) {
      const ex = mx + tx * o.at + nx * o.an, ey = my + ty * o.at + ny * o.an;
      if (o.at && o.an) s += V.pointille(mx, my, mx + tx * o.at, my + ty * o.at, C.vert, 1.5) + V.pointille(mx + tx * o.at, my + ty * o.at, ex, ey, C.vert, 1.5) + V.pointille(mx, my, mx + nx * o.an, my + ny * o.an, C.vert, 1.5) + V.pointille(mx + nx * o.an, my + ny * o.an, ex, ey, C.vert, 1.5);
      s += V.fleche(mx, my, ex, ey, C.vert, 3, 12) + V.nomSVG('a', ex + (ex - mx) / Math.hypot(ex - mx, ey - my) * 13, ey + (ey - my) / Math.hypot(ex - mx, ey - my) * 13 + 5, 15, C.vert);
    }
    if (o.v) s += V.fleche(mx, my, mx + tx * o.v, my + ty * o.v, '#dc2626', 3, 12) + V.nomSVG('v', mx + tx * (o.v + 13) - nx * 4, my + ty * (o.v + 13) - ny * 4 + 5, 15, '#dc2626');
    if (o.ut) s += V.fleche(mx, my, mx + tx * o.U, my + ty * o.U, Ai, 2.6, 9) + V.nomSVG('u_t', mx + tx * (o.U + 10) - nx * 14, my + ty * (o.U + 10) - ny * 14 + 5, 14, Ai);
    if (o.un) s += V.fleche(mx, my, mx + nx * o.U, my + ny * o.U, Ai, 2.6, 9) + V.nomSVG('u_n', mx + nx * o.U + tx * 16, my + ny * o.U + ty * 16 + 5, 14, Ai);
    // angle droit entre les deux vecteurs unitaires
    if (o.ut && o.un) { const k = 9; s += `<path d="M${mx + tx * k},${my + ty * k} L${mx + tx * k + nx * k},${my + ty * k + ny * k} L${mx + nx * k},${my + ny * k}" fill="none" stroke="${Ai}" stroke-width="1.2"/>`; }
    s += point(mx, my, 5, C.encre) + V.texte(mx - nx * 14 - tx * 8, my - ny * 14 - ty * 8 + 5, 'M', 14, C.encre);
    return svg(o.W, o.H, s, 'Mouvement circulaire et repère de Frenet');
  }

  /* ---------- Ballon lancé : x = 2t, y = −t² + 4t (module 4) ----------
     figure animée (curseur t) : trajectoire, point M, vecteur position et projections ;
     opts.vitesse : vecteur vitesse (tangent : il ne rejoint jamais un autre point de la trajectoire) */
  function ballon(zone, opts) {
    opts = opts || {};
    const X = t => 2 * t, Y = t => -t * t + 4 * t, VX = () => 2, VY = t => -2 * t + 4;
    const fmt = window.CIN.fmt, M = window.CIN.MOINS, I = V.nomHTML('i'), J = V.nomHTML('j'), MS = `m·s<sup>${M}1</sup>`;
    const G = window.CIN.graphe({ xmin: 0, xmax: 9, ymin: 0, ymax: 5, w: 600, h: 360, nomX: 'x (m)', nomY: 'y (m)', m: { g: 34, d: 40, h: 26, b: 30 } });
    const A = getComputedStyle(document.documentElement).getPropertyValue('--accent-ink').trim() || '#3f2a93';
    const id = 'bt' + Math.random().toString(36).slice(2, 7);
    zone.innerHTML = opts.fixe != null ? '<div data-f></div>' : `<div data-f></div><div class="cin-curseur"><label for="${id}">t</label><input type="range" id="${id}" min="0" max="40" value="10" aria-label="Date t"></div><p class="cin-lecture" data-l></p>`;
    const f = zone.querySelector('[data-f]'), l = zone.querySelector('[data-l]'), cur = zone.querySelector('input');
    let traj = '';
    for (let k = 0; k <= 40; k++) traj += `<circle cx="${G.px(X(k / 10))}" cy="${G.py(Y(k / 10))}" r="2" fill="#c9c4b9"/>`;
    function maj() {
      const t = cur ? +cur.value / 10 : opts.fixe, x = X(t), y = Y(t), px = G.px(x), py = G.py(y);
      let s = traj;
      s += V.pointille(px, py, px, G.py(0), C.vert, 1.6) + V.pointille(px, py, G.px(0), py, C.orange, 1.6);
      s += V.texte(px, G.py(0) + 28, 'x(t)', 13, C.vert) + V.texte(G.px(0) + 4, py - 6, 'y(t)', 13, C.orange, 'start');
      s += V.fleche(G.px(0), G.py(0), px, py, A, 3, 12);
      if (x > .6) s += V.nomSVG('OM', (G.px(0) + px) / 2 - 14, (G.py(0) + py) / 2 - 4, 15, A);
      if (opts.vitesse) {
        // assez long pour que la pointe s'écarte nettement de la trajectoire
        const k = 36, vx = VX(t) * k, vy = VY(t) * k;
        s += V.fleche(px, py, px + vx, py - vy, '#dc2626', 3, 12);
        s += V.nomSVG('v', px + vx + 12, py - vy - 4, 15, '#dc2626');
      }
      s += `<circle cx="${px}" cy="${py}" r="5.5" fill="${C.encre}"/>` + V.texte(px + 10, py + 18, 'M', 14, C.encre, 'start');
      f.innerHTML = G.svg(s, 'Trajectoire du point M, vecteur position' + (opts.vitesse ? ' et vecteur vitesse' : ''));
      if (l) l.innerHTML = `t = ${fmt(t, 1)} s : x = ${fmt(x, 1)} m ; y = ${fmt(y, 1)} m ; ${V.nomHTML('OM')} = ${fmt(x, 1)} ${I} + ${fmt(y, 1)} ${J}` +
        (opts.vitesse ? `<br><span style="color:#dc2626">v<sub>x</sub> = ${fmt(VX(t), 1)} ${MS} ; v<sub>y</sub> = ${fmt(VY(t), 1)} ${MS}</span>` : '');
    }
    if (cur) cur.addEventListener('input', maj);
    maj();
  }

  /* ============================================================
     FIGURES DES EXERCICES (module 6)
     ============================================================ */
  // petit graphique d'une grandeur en fonction du temps (exercice 9)
  function miniGraphe(type, nomY) {
    const W = 170, H = 120, x0 = 26, y0 = type === 'a-negatif' ? 40 : 100, A = acc();
    let s = V.fleche(x0, H - 8, x0, 8, C.encre, 1.5, 7) + V.fleche(x0 - 4, y0, W - 6, y0, C.encre, 1.5, 7);
    s += V.texte(x0 + 6, 16, nomY, 11, C.encre, 'start') + V.texte(W - 8, y0 + (type === 'a-negatif' ? -6 : 14), 't (s)', 11, C.encre, 'end');
    const ligne = (x1, y1, x2, y2) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${A}" stroke-width="3" stroke-linecap="round"/>`;
    if (type === 'v-croissant' || type === 'x-droite') s += ligne(x0, y0, W - 30, 24);
    if (type === 'v-constant') s += ligne(x0, 56, W - 20, 56);
    if (type === 'v-decroissant') s += ligne(x0, 30, W - 26, 92);
    if (type === 'a-negatif') s += ligne(x0, 80, W - 20, 80);
    if (type === 'x-courbe') { let d = ''; for (let i = 0; i <= 30; i++) { const t = i / 30; d += (i ? 'L' : 'M') + (x0 + t * 70).toFixed(1) + ',' + (y0 - 85 * t * t).toFixed(1); } s += `<path d="${d}" fill="none" stroke="${A}" stroke-width="3" stroke-linecap="round"/>`; }
    return svg(W, H, s, 'Graphique en fonction du temps', 'cin-fig');
  }

  // piste de saut à ski (exercice 10) ; correction : vecteurs accélération
  function skieur(correction) {
    const cx = 300, cy = 128, r = 72, b = 45 * Math.PI / 180;
    const T = [cx - r * Math.sin(b), cy + r * Math.cos(b)], u = [Math.cos(b), Math.sin(b)];
    const P = k => [T[0] - u[0] * k, T[1] - u[1] * k];
    const A = P(210), B = P(140), Cc = P(60), D = [cx, cy + r], E = [cx + r * Math.sin(.6), cy + r * Math.cos(.6)];
    let s = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#8d8f94" stroke-width="1.3"/>` + point(cx, cy, 3, C.encre2) + V.trait(cx, cy, cx - r * .8, cy - r * .55, '#8d8f94', 1.3);
    let d = `M${A[0] - u[0] * 20},${A[1] - u[1] * 20} L${T[0]},${T[1]} A${r},${r} 0 0 0 ${E[0] + 12},${E[1] - 8}`;
    s += `<path d="${d}" fill="none" stroke="#e8b923" stroke-width="3"/>`;
    [[A, 'A'], [B, 'B'], [Cc, 'C'], [D, 'D'], [E, 'E']].forEach(([p, n]) => { s += point(p[0], p[1], 4.5, C.encre) + V.texte(p[0] + (n === 'E' ? 12 : -12), p[1] + (n === 'D' || n === 'E' ? 20 : 16), n, 14, C.encre); });
    if (correction) {
      [A, B, Cc].forEach(p => { s += V.fleche(p[0], p[1], p[0] + u[0] * 30, p[1] + u[1] * 30, '#dc2626', 2.6, 9); });
      [D, E].forEach(p => { const L = Math.hypot(cx - p[0], cy - p[1]); s += V.fleche(p[0], p[1], p[0] + (cx - p[0]) / L * 34, p[1] + (cy - p[1]) / L * 34, '#dc2626', 2.6, 9); });
    }
    return svg(400, 226, s, 'Piste de saut à ski : partie rectiligne puis portion de cercle');
  }

  // exercice 12 : trajectoire, vecteur vitesse (rouge) et accélération (vert)
  function ex12(l) {
    const W = 230, H = 92, rouge = '#dc2626', vert = '#16a34a';
    let s = '', P;
    const arc = () => { s += `<path d="M20,70 Q115,-10 210,70" fill="none" stroke="${C.encre}" stroke-width="1.6"/>`; P = [115, 30]; };
    const droite = () => { s += V.trait(10, 50, 220, 50, C.encre, 1.6); P = [115, 50]; };
    const vec = (dx, dy, coul, nom) => V.fleche(P[0], P[1], P[0] + dx, P[1] + dy, coul, 2.6, 9) + V.nomSVG(nom, P[0] + dx * 1.18 + (dx >= 0 ? 6 : -6), P[1] + dy * 1.18 + 5, 13, coul);
    if (l === 'A') { arc(); s += vec(36, 48, rouge, 'v') + vec(-52, 34, vert, 'a'); }
    if (l === 'B') { arc(); s += vec(60, 0, rouge, 'v') + vec(-44, -24, vert, 'a'); }
    if (l === 'C') { droite(); s += vec(52, 0, rouge, 'v') + vec(-56, 0, vert, 'a'); }
    if (l === 'D') { droite(); s += vec(60, 0, rouge, 'v') + vec(-14, 34, vert, 'a'); }
    if (l === 'E') { arc(); s += vec(64, 0, rouge, 'v') + vec(-18, 42, vert, 'a'); }
    if (l === 'F') { arc(); s += V.fleche(P[0], P[1], P[0] + 64, P[1], rouge, 2.6, 9) + V.nomSVG('v', P[0] + 80, P[1] + 5, 13, rouge) + V.fleche(P[0], P[1], P[0] + 36, P[1], vert, 3.2, 9) + V.nomSVG('a', P[0] + 30, P[1] - 10, 13, vert); }
    s += point(P[0], P[1], 4, C.encre);
    return svg(W, H, s, 'Trajectoire, vecteur vitesse et vecteur accélération');
  }

  // exercice 15 : vitesse de chute d'un parachutiste
  function parachute() {
    const G = window.CIN.graphe({ xmin: 0, xmax: 400, ymin: 0, ymax: 60, w: 600, h: 300, pasX: 50, pasY: 10, nomX: 't (s)', nomY: 'v (m·s⁻¹)', m: { g: 40, d: 30, h: 26, b: 30 }, taille: 12 });
    const pts = [[0, 0], [4, 50], [50, 50], [55, 6], [345, 6], [356, 0]];
    const d = pts.map((p, i) => (i ? 'L' : 'M') + G.px(p[0]).toFixed(1) + ',' + G.py(p[1]).toFixed(1)).join('');
    return G.svg(`<path d="${d}" fill="none" stroke="#e8b923" stroke-width="3" stroke-linejoin="round"/>`, 'Vitesse du parachutiste en fonction du temps');
  }

  // exercice 16 : positions successives d'une nacelle de grande roue
  function grandeRoue(correction) {
    const W = 340, H = 320, cx = 160, cy = 165, R = 110, n = 11, pas = 2 * Math.PI / n, cm = R / 4.1;
    let s = '';
    const P = k => [cx + R * Math.cos(k * pas), cy - R * Math.sin(k * pas)];
    for (let k = 0; k < n; k++) {
      const [x, y] = P(k);
      s += V.trait(x - 9, y, x + 9, y, C.encre, 1.2) + V.trait(x, y - 9, x, y + 9, C.encre, 1.2) + point(x, y, 2.6, C.encre);
      if (k < 3) s += V.texte(x + 14, y + (k ? -6 : 5), `A${k + 1}`, 13, C.encre, 'start');
    }
    s += V.trait(W - 20 - 5 * cm / 5, H - 22, W - 20, H - 22, C.encre, 2) + point(W - 20 - cm, H - 22, 2.5, C.encre) + point(W - 20, H - 22, 2.5, C.encre) + V.texte(W - 20 - cm / 2, H - 30, '5 m', 12, C.encre);
    if (correction) {
      const vt = k => [-Math.sin(k * pas), -Math.cos(k * pas)], L = 1.15 * cm;   // échelle 1 cm ↔ 1 m/s
      [1, 2].forEach(k => { const [x, y] = P(k), t = vt(k); s += V.fleche(x, y, x + t[0] * L, y + t[1] * L, '#dc2626', 2.4, 8) + V.nomSVG(`v_${k + 1}`, x + t[0] * L - 2, y + t[1] * L - 12, 13, '#dc2626'); });
      const [x2, y2] = P(1), t2 = vt(1), t3 = vt(2), dv = [t3[0] - t2[0], t3[1] - t2[1]];
      s += V.fleche(x2, y2, x2 + dv[0] * L, y2 + dv[1] * L, '#2952c8', 2.4, 8) + V.texte(x2 + dv[0] * L - 6, y2 + dv[1] * L + 16, 'Δv', 12, '#2952c8', 'end');
    }
    return svg(W, H, s, 'Positions successives d\'une nacelle de grande roue');
  }

  window.FIG = { svg, point, chrono, referentiels, train, velo, decomp, directions, trigoCoord, diagTrigo, trigo, frenet, ballon, miniGraphe, skieur, ex12, parachute, grandeRoue };
})();
