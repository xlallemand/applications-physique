/* ============================================================
   Coordonnées d'un vecteur dans un repère (module 2 de l'application
   « Mouvement dans un champ uniforme ») : figures et questions
   tirées au hasard, pour le cours et la série.

   CU.coord.gen(type)      situation tirée au hasard ; type :
                           'axe'     vecteur porté par un axe (pas d'angle)
                           'angleH'  angle α repéré par rapport à l'horizontale
                           'angleV'  angle α repéré par rapport à la verticale
                           'incline' repère incliné (plan incliné d'angle β), vecteur vertical (g⃗, P⃗)
                                     ou parallèle à la pente
                           Le repère varie : axes x et y ou x et z, sens de chaque axe,
                           vecteur placé à l'origine ou ailleurs.
   CU.coord.fig(s)         schéma SVG de la situation (repère, vecteur, angle)
   CU.coord.parties(s)     deux parties 'choix' (une par axe), expressions littérales
   CU.coord.partiesNum(s)  deux parties 'nombre' (valeurs numériques, signe compris)
   CU.coord.solution(s)    correction rédigée (projection, signe)
   Les parties ont le format commun de cours.js et de CU.question.
   ============================================================ */
(function () {
  'use strict';
  const CU = window.CU;
  const { o, fmt, cs, hasard, col, svg, fl, nom, txt, COUL, ENCRE, ENCRE2, ENCRE3 } = CU;
  const rad = d => d * Math.PI / 180;
  // vecteurs possibles : lettre, indice, nom de la valeur, unité, couleur, ordre de grandeur numérique
  const VECS = [
    { n: 'v', s: '0', N: 'v<sub>0</sub>', u: 'm·s<sup>−1</sup>', c: COUL.v, val: [5.0, 8.0, 12, 20] },
    { n: 'v', s: 'A', N: 'v<sub>A</sub>', u: 'm·s<sup>−1</sup>', c: COUL.v, val: [3.0, 6.0, 15] },
    { n: 'E', s: '', N: 'E', u: 'V·m<sup>−1</sup>', c: COUL.E, val: [200, 500, 1500] },
    { n: 'F', s: '', N: 'F', u: 'N', c: COUL.F, val: [2.0, 4.0, 50] },
    { n: 'a', s: '', N: 'a', u: 'm·s<sup>−2</sup>', c: COUL.a, val: [2.0, 4.0, 6.0] },
  ];
  const VERT = [{ n: 'g', s: '', N: 'g', u: 'm·s<sup>−2</sup>', c: COUL.a, val: [9.81] }, { n: 'P', s: '', N: 'P', u: 'N', c: COUL.F, val: [2.0, 5.0, 12] }];
  const nomV = v => `<span class="vec-nom">${v.n}</span>${v.s ? `<sub>${v.s}</sub>` : ''}`;

  /* ---------- tirage d'une situation ----------
     s = { type, vec, ax: [nom1, nom2], sx, sy (sens des axes : +1 droite / haut), beta (repère incliné),
           desc (sens du vecteur), ang (α ou β, degrés), ref ('h' ou 'v'), dh, dv (sens horizontal et vertical
           du vecteur : ±1), loin (vecteur hors de l'origine), coords: [[signe, terme], …] } */
  function gen(type, fixe) {
    const s = { type, ax: hasard([['x', 'y'], ['x', 'y'], ['x', 'z']]), sx: hasard([1, 1, -1]), sy: hasard([1, 1, -1]), loin: Math.random() < .5 };
    if (type === 'incline') {
      Object.assign(s, { ax: ['x', 'y'], beta: hasard([20, 25, 30, 35]), angNom: 'β',
        desc: hasard([1, -1]),            // axe 1 vers le bas de la pente (+1) ou vers le haut (−1)
        pente: hasard([1, -1]),           // la pente descend vers la droite (+1) ou vers la gauche (−1)
        long: Math.random() < .3,         // vecteur parallèle à la pente (sinon vertical, vers le bas)
        vdesc: hasard([1, -1]) });        // vecteur parallèle : vers le bas (+1) ou le haut (−1) de la pente
      s.vec = s.long ? hasard(VECS.filter(v => v.n !== 'E')) : hasard(VERT);
    } else if (type === 'axe') {
      s.vec = hasard(VECS.concat(VERT));
      s.dir = s.vec.n === 'g' || s.vec.n === 'P' ? 'b' : hasard(['g', 'd', 'h', 'b']);   // gauche, droite, haut, bas
      s.angNom = hasard(['α', 'θ']);                                                    // pour les options « cos » et « sin » (pièges)
    } else {
      Object.assign(s, { vec: hasard(VECS), angNom: hasard(['α', 'α', 'θ']), ang: hasard([20, 25, 30, 35, 40, 50, 60]), ref: type === 'angleH' ? 'h' : 'v', dh: hasard([1, 1, -1]), dv: hasard([1, 1, -1]) });
    }
    Object.assign(s, fixe || {});
    if (typeof s.vec === 'string') s.vec = VECS.concat(VERT).find(v => v.n + v.s === s.vec);
    // coordonnées : [signe, terme], terme : 'N' (valeur), 'cos', 'sin', '0'
    if (type === 'incline') s.coords = s.long ? [[s.vdesc * s.desc, 'N'], [1, '0']] : [[s.desc, 'sin'], [-1, 'cos']];
    else if (type === 'axe') {
      const H = s.dir === 'd' ? 1 : s.dir === 'g' ? -1 : 0, Vt = s.dir === 'h' ? 1 : s.dir === 'b' ? -1 : 0;
      s.coords = [[H * s.sx || 1, H ? 'N' : '0'], [Vt * s.sy || 1, Vt ? 'N' : '0']];
    } else s.coords = [[s.dh * s.sx, s.ref === 'h' ? 'cos' : 'sin'], [s.dv * s.sy, s.ref === 'h' ? 'sin' : 'cos']];   // horizontale de référence : cos sur l'axe horizontal
    return s;
  }

  /* ---------- écritures ---------- */
  const ecrire = (s, c) => (c[1] === '0' ? '0' : `${c[0] < 0 ? '−' : ''}${s.vec.N}${c[1] === 'N' ? '' : ` ${c[1]} ${s.angNom}`}`);
  const valeur = (s, c, N, ang) => (c[1] === '0' ? 0 : c[0] * N * (c[1] === 'N' ? 1 : c[1] === 'cos' ? Math.cos(rad(ang)) : Math.sin(rad(ang))));

  /* ---------- schéma ---------- */
  function fig(s) {
    const W = 320, H = s.type === 'incline' ? 250 : 210;
    let c = '';
    let L = 80;
    if (s.type === 'incline') {
      // plan incliné : sol incliné d'angle β, petit bloc, repère lié à la pente
      const b = rad(s.beta), p = s.pente, ux = p * Math.cos(b), uy = Math.sin(b);   // vecteur unitaire « vers le bas de la pente » (écran)
      const xa = p > 0 ? 24 : W - 24, ya = 66, xb = xa + ux * 290, yb = ya + uy * 290;
      c += `<line x1="${xa}" y1="${ya}" x2="${xb.toFixed(1)}" y2="${yb.toFixed(1)}" stroke="${ENCRE2}" stroke-width="2"/>`;
      c += `<line x1="${xb.toFixed(1)}" y1="${yb.toFixed(1)}" x2="${(xb - p * 120).toFixed(1)}" y2="${yb.toFixed(1)}" stroke="${ENCRE3}" stroke-dasharray="4 3"/>`;
      c += `<path d="M${(xb - p * 46).toFixed(1)},${yb.toFixed(1)} A46,46 0 0 ${p > 0 ? 1 : 0} ${(xb - ux * 46).toFixed(1)},${(yb - uy * 46).toFixed(1)}" fill="none" stroke="${ENCRE2}"/>` +
        txt(xb - p * 60, yb - 6, 'β', { g: 700, c: ENCRE2, t: 12, a: 'middle' });
      // solide posé sur la pente ; repère lié à la pente, d'origine O au centre du solide
      const N = [p > 0 ? Math.sin(b) : -Math.sin(b), -Math.cos(b)];      // normale à la pente, vers le haut
      const xm = xa + ux * 130, ym = ya + uy * 130;
      c += `<rect x="-16" y="-28" width="32" height="28" fill="#ebe8e1" stroke="${ENCRE2}" transform="translate(${xm.toFixed(1)},${ym.toFixed(1)}) rotate(${(p * s.beta).toFixed(1)})"/>`;
      const ox = xm + N[0] * 30, oy = ym + N[1] * 30, d1 = [ux * s.desc, uy * s.desc];
      c += fl(ox, oy, ox + d1[0] * 90, oy + d1[1] * 90, ENCRE, { ep: 1.3, lt: 7 }) + txt(ox + d1[0] * 100 + N[0] * 10, oy + d1[1] * 100 + N[1] * 10 + 4, s.ax[0], { g: 800, c: ENCRE, t: 13, a: 'middle' });
      c += fl(ox, oy, ox + N[0] * 64, oy + N[1] * 64, ENCRE, { ep: 1.3, lt: 7 }) + txt(ox + N[0] * 74, oy + N[1] * 74 + 4, s.ax[1], { g: 800, c: ENCRE, t: 13, a: 'middle' });
      c += txt(ox - d1[0] * 14 + N[0] * 10, oy - d1[1] * 14 + N[1] * 10 + 4, 'O', { g: 800, c: ENCRE, t: 12, a: 'middle' });
      // vecteur : vertical vers le bas depuis O (avec le prolongement de l'axe perpendiculaire), ou parallèle à la pente, au-dessus du solide
      if (s.long) { const cx = ox + N[0] * 34, cy = oy + N[1] * 34, d = [ux * s.vdesc, uy * s.vdesc]; c += `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="3" fill="${ENCRE}"/>` + fl(cx, cy, cx + d[0] * 70, cy + d[1] * 70, s.vec.c, { ep: 2.6 }) + nom(cx + d[0] * 50 + N[0] * 16, cy + d[1] * 50 + N[1] * 16 + 4, s.vec.n, s.vec.s, s.vec.c, { t: 14 }); }
      else c += `<line x1="${ox.toFixed(1)}" y1="${oy.toFixed(1)}" x2="${(ox - N[0] * 80).toFixed(1)}" y2="${(oy - N[1] * 80).toFixed(1)}" stroke="${ENCRE3}" stroke-dasharray="3 3"/>` + fl(ox, oy, ox, oy + 86, s.vec.c, { ep: 2.6 }) + nom(ox + p * 14, oy + 80, s.vec.n, s.vec.s, s.vec.c, { t: 14 }) +
        `<path d="M${ox.toFixed(1)},${(oy + 44).toFixed(1)} A44,44 0 0 ${p > 0 ? 1 : 0} ${(ox - N[0] * 44).toFixed(1)},${(oy - N[1] * 44).toFixed(1)}" fill="none" stroke="${ENCRE2}"/>` + txt(ox - N[0] * 25 + p * 2, oy + 56, 'β', { g: 700, c: ENCRE2, t: 11, a: 'middle' });
      return svg(W, H, c, `Plan incliné d'un angle bêta ; axe ${s.ax[0]} parallèle à la pente, vers le ${s.desc > 0 ? 'bas' : 'haut'} de la pente ; axe ${s.ax[1]} perpendiculaire à la pente ; vecteur ${s.long ? 'parallèle à la pente, vers le ' + (s.vdesc > 0 ? 'bas' : 'haut') : 'vertical, vers le bas'}`, 'cu-fig-coord');
    }
    // repère droit : axe 1 horizontal (sens sx), axe 2 vertical (sens sy) ; vecteur à l'origine (repère au centre)
    // ou ailleurs (repère dans un coin, vecteur de l'autre côté)
    const ox = s.loin ? (s.sx > 0 ? 40 : W - 40) : W / 2, oy = s.loin ? (s.sy > 0 ? H - 30 : 30) : H / 2, LA = s.loin ? 100 : 78;
    c += fl(ox, oy, ox + s.sx * LA, oy, ENCRE, { ep: 1.3, lt: 7 }) + txt(ox + s.sx * (LA + 9), oy + 4, s.ax[0], { g: 800, c: ENCRE, t: 13, a: 'middle' });
    c += fl(ox, oy, ox, oy - s.sy * LA, ENCRE, { ep: 1.3, lt: 7 }) + txt(ox + 12, oy - s.sy * (LA + 2) + 4, s.ax[1], { g: 800, c: ENCRE, t: 13, a: 'middle' });
    c += txt(ox - s.sx * 12, oy + s.sy * 14 + 4, 'O', { g: 800, c: ENCRE, t: 12, a: 'middle' });
    const px = s.loin ? (s.sx > 0 ? 215 : W - 215) : ox, py = s.loin ? H / 2 : oy;
    if (!s.loin) L = 70;
    let dx, dy;
    if (s.type === 'axe') { dx = s.dir === 'd' ? 1 : s.dir === 'g' ? -1 : 0; dy = s.dir === 'h' ? -1 : s.dir === 'b' ? 1 : 0; }
    else {
      const a = rad(s.ang), h = s.ref === 'h' ? Math.cos(a) : Math.sin(a), v = s.ref === 'h' ? Math.sin(a) : Math.cos(a);
      dx = s.dh * h; dy = -s.dv * v;
    }
    if (s.loin) c += `<circle cx="${px}" cy="${py}" r="3" fill="${ENCRE}"/>`;
    if (s.type !== 'axe') {
      // droite de référence (horizontale ou verticale) et arc de l'angle
      const a = rad(s.ang);
      if (s.ref === 'h') c += `<line x1="${px}" y1="${py}" x2="${px + s.dh * 64}" y2="${py}" stroke="${ENCRE3}" stroke-dasharray="4 3"/>`;
      else c += `<line x1="${px}" y1="${py}" x2="${px}" y2="${py - s.dv * 64}" stroke="${ENCRE3}" stroke-dasharray="4 3"/>`;
      const r = 30, a0 = s.ref === 'h' ? [px + s.dh * r, py] : [px, py - s.dv * r], a1 = [px + dx * r, py + dy * r];
      const balaye = (a0[0] - px) * (a1[1] - py) - (a0[1] - py) * (a1[0] - px) > 0 ? 1 : 0;
      c += `<path d="M${a0[0].toFixed(1)},${a0[1].toFixed(1)} A${r},${r} 0 0 ${balaye} ${a1[0].toFixed(1)},${a1[1].toFixed(1)}" fill="none" stroke="${ENCRE2}" stroke-width="1.2"/>`;
      const bx = (a0[0] + a1[0]) / 2 - px, by = (a0[1] + a1[1]) / 2 - py, bl = Math.hypot(bx, by) || 1;
      c += txt(px + bx / bl * (r + 11), py + by / bl * (r + 11) + 4, s.angNom, { g: 700, c: ENCRE2, t: 12, a: 'middle' });
    }
    c += fl(px, py, px + dx * L, py + dy * L, s.vec.c, { ep: 2.6 });
    // nom du vecteur, décalé perpendiculairement à la flèche
    const mx = px + dx * L * .62, my = py + dy * L * .62, nx = -dy, ny = dx;
    // côté du nom : à l'opposé de la droite de référence de l'angle (sinon le nom chevauche l'angle)
    const ref = s.type === 'axe' ? null : s.ref === 'h' ? [s.dh, 0] : [0, -s.dv];
    const cote = ref ? (nx * ref[0] + ny * ref[1] > 0 ? -1 : 1) : 1;
    c += nom(mx + nx * 16 * cote, my + ny * 16 * cote + 5, s.vec.n, s.vec.s, s.vec.c, { t: 14 });
    const sens = s.type === 'axe' ? { d: 'vers la droite', g: 'vers la gauche', h: 'vers le haut', b: 'vers le bas' }[s.dir] : `faisant l'angle ${s.angNom} avec la ${s.ref === 'h' ? 'horizontale' : 'verticale'}, ${s.dh > 0 ? 'vers la droite' : 'vers la gauche'} et ${s.dv > 0 ? 'vers le haut' : 'vers le bas'}`;
    return svg(W, H, c, `Repère : axe ${s.ax[0]} horizontal vers la ${s.sx > 0 ? 'droite' : 'gauche'}, axe ${s.ax[1]} vertical vers le ${s.sy > 0 ? 'haut' : 'bas'} ; vecteur ${sens}${s.loin ? ', placé loin de l\'origine' : ', placé à l\'origine'}`, 'cu-fig-coord');
  }

  /* ---------- corrections ---------- */
  function solution(s) {
    const c = s.coords, v = nomV(s.vec), N = s.vec.N;
    let t = '';
    if (s.type === 'axe') {
      const k = c[0][1] === 'N' ? 0 : 1;
      t = `<p>${v} est porté par l'axe ${s.ax[k]} : sa coordonnée sur l'autre axe est nulle. Il est ${c[k][0] > 0 ? 'dans le même sens' : 'de sens opposé à'} ${c[k][0] > 0 ? 'que l\'axe' : 'l\'axe'} ${s.ax[k]} : coordonnée ${c[k][0] > 0 ? '' : '−'}${N}.</p>`;
    } else if (s.type === 'incline') {
      t = s.long ? `<p>${v} est parallèle à la pente, donc porté par l'axe ${s.ax[0]} ; il est ${c[0][0] > 0 ? 'dans le sens' : 'de sens opposé'} de cet axe.</p>`
        : `<p>${v} est vertical. L'angle entre ${v} et l'axe ${s.ax[1]} (perpendiculaire à la pente) vaut β : la projection sur ${s.ax[1]} est le côté adjacent (${N} cos β), celle sur ${s.ax[0]} le côté opposé (${N} sin β). ${v} pointe ${c[0][0] > 0 ? 'vers le bas de la pente, dans le sens' : 'vers le bas de la pente, en sens opposé'} de l'axe ${s.ax[0]}, et vers la pente, en sens opposé de l'axe ${s.ax[1]}.</p>`;
    } else {
      t = `<p>L'angle ${s.angNom} est repéré par rapport à la <b>${s.ref === 'h' ? 'horizontale' : 'verticale'}</b> : la projection sur l'axe ${s.ref === 'h' ? 'horizontal' : 'vertical'} est le côté adjacent (${N} cos ${s.angNom}), celle sur l'axe ${s.ref === 'h' ? 'vertical' : 'horizontal'} le côté opposé (${N} sin ${s.angNom}).</p>
        <p>Signes : ${v} va ${s.dh > 0 ? 'vers la droite' : 'vers la gauche'}, l'axe ${s.ax[0]} ${s.sx > 0 ? 'vers la droite' : 'vers la gauche'} (${c[0][0] > 0 ? '+' : '−'}) ; ${v} va ${s.dv > 0 ? 'vers le haut' : 'vers le bas'}, l'axe ${s.ax[1]} ${s.sy > 0 ? 'vers le haut' : 'vers le bas'} (${c[1][0] > 0 ? '+' : '−'}).</p>`;
    }
    t += `<p>${v} ${col(ecrire(s, c[0]), ecrire(s, c[1]))} dans le repère (O ; ${s.ax[0]}, ${s.ax[1]})${s.loin ? '. L\'endroit où le vecteur est dessiné ne change rien à ses coordonnées.' : '.'}</p>`;
    return t;
  }

  /* ---------- parties de question ---------- */
  // options littérales : 0, ±N, ±N cos, ±N sin
  function options(s) {
    const termes = [[1, '0']];
    [1, -1].forEach(k => ['N', 'cos', 'sin'].forEach(f => termes.push([k, f])));
    return termes.map(t => o(`${t[0]}${t[1]}`, ecrire(s, t)));
  }
  const id = c => `${c[1] === '0' ? 1 : c[0]}${c[1]}`;
  function parties(s) {
    const v = nomV(s.vec), sol = solution(s);
    return [0, 1].map(k => ({ type: 'choix', q: `Coordonnée de ${v} sur l'axe ${s.ax[k]} :`, options: options(s), bonne: id(s.coords[k]), colonne: false, melanger: false,
      indice: aideCoord(s, k), solution: sol, correction: sol }));
  }
  function aideCoord(s, k) {
    if (s.type === 'axe') return `Le vecteur est-il porté par l'axe ${s.ax[k]} ? Si oui, compare son sens avec celui de l'axe ; sinon, la coordonnée est nulle.`;
    if (s.type === 'incline') return s.long ? 'Le vecteur est parallèle à la pente : il est porté par un seul axe.' : `Trace le triangle rectangle : l'angle entre le vecteur vertical et l'axe perpendiculaire à la pente vaut β. Puis compare les sens.`;
    return `Trace le triangle rectangle : le côté adjacent à ${s.angNom} donne cos ${s.angNom}, le côté opposé sin ${s.angNom}. Puis compare le sens du vecteur et celui de l'axe ${s.ax[k]}.`;
  }
  // valeurs numériques
  function partiesNum(s) {
    const N = hasard(s.vec.val), ang = s.type === 'incline' ? s.beta : s.ang, v = nomV(s.vec);
    const vals = s.coords.map(c => valeur(s, c, N, ang || 0));
    const donnees = `${s.vec.N} = ${Number.isInteger(N) && N < 10 ? fmt(N) + ',0' : fmt(N)} ${s.vec.u}${ang ? ` ; ${s.angNom} = ${ang}°` : ''}`;
    const sol = solution(s) + `<p>${vals.map((x, k) => `${ecrire(s, s.coords[k])} = ${cs(x, 3)} ${s.vec.u}`).join(' ; ')}</p>`;
    return { donnees, parties: [0, 1].map(k => ({ type: 'nombre', q: `Coordonnée de ${v} sur l'axe ${s.ax[k]} (3 chiffres significatifs) :`, label: `${s.ax[k]} :`, valeur: vals[k], rel: .01, tol: vals[k] === 0 ? 1e-9 : undefined, unite: s.vec.u + (vals[k] && s.coords[k][1] !== 'N' ? CU.CALC : ''),
      diag: x => (Math.abs(x + vals[k]) < 1e-6 * Math.max(1, Math.abs(N)) + .01 * Math.abs(vals[k]) && vals[k] ? 'Le signe est faux : compare le sens du vecteur et celui de l\'axe.' : aideCoord(s, k)), solution: sol, correction: sol })) };
  }

  CU.coord = { gen, fig, parties, partiesNum, solution, ecrire, nomV };
})();
