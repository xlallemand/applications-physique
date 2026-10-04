/* ============================================================
   Figures de l'application « Cinématique » (SVG)

   FIG.chrono(opts)        chronophotographie : positions successives d'un point
   FIG.referentiels()      Soleil, Terre et les trois référentiels
   FIG.train(n)            balle lâchée dans un train, vue dans les deux référentiels
   FIG.velo()              valve d'une roue de vélo dans les deux référentiels
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

  window.FIG = { svg, point, chrono, referentiels, train, velo, decomp, directions, trigoCoord, diagTrigo, trigo };
})();
