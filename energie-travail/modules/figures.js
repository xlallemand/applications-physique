/* ============================================================
   Figures SVG de l'application « Énergie et travail »
   (cours, fiches, séries, exercices). Chargé après et.js.

   ET.figTravail(o)    force F⃗ et déplacement AB⃗ : o = { alpha (°, sens trigo), F (true : nom), nom ('F'),
                       ref : 'AB' (angle repéré sur AB⃗, défaut) ou 'BA' (angle repéré sur la direction opposée,
                       exemple du cours : 30° avec −AB⃗), arc (texte de l'angle), W, H }
   ET.CERCLE           cercle trigonométrique : cos 0° = 1, cos 90° = 0, cos 180° = −1
   ET.figPetrolier()   pétrolier remorqué : câble à 20° de l'horizontale
   ET.figSignes(cas)   petite figure du tableau moteur / résistant / nul ('m', 'r', 'n')
   ET.figDecomp(sens)  travail du poids : trajet quelconque A → B décomposé en A → C → B ('descend' | 'monte')
   ET.figCondoW()      condensateur : chemin A → C → B, force qE⃗, L (démonstration de W = qU)
   ET.figAcc(o)        condensateur aux armatures verticales (accélérateur) : o = { q: 1 | −1, v0 (vitesse initiale), d ('L') }
   ET.figPerp(k)       force toujours perpendiculaire : 'sat' (satellite), 'pendule', 'coussin' (table à coussin d'air)
   ET.figBalcon(o)     balle sur un balcon à 3 m : o = { origine: 'sol' | 'balcon' }
   ET.figEnergies(o)   E_c, E_pp, E_m en fonction du temps (lancer de balle) : o = { frott (perte en J), Em0, W, H }
   ET.figPente(o)      pente de dénivelé h (skieur, tremplin) : o = { sens, A, B, txt }
   ============================================================ */
(function () {
  'use strict';
  const ET = window.ET;
  const { fl, nom, txt, svg, force, COUL, COULF, ENCRE, ENCRE2, ENCRE3, fmt } = ET;
  const f1 = v => (Math.round(v * 10) / 10).toString();
  const rad = d => d * Math.PI / 180;
  const pt = (x, y) => `<circle cx="${f1(x)}" cy="${f1(y)}" r="3.8" fill="${ENCRE}"/>`;
  // déplacement en tirets (accent), de (x1, y1) à (x2, y2)
  const dep = (x1, y1, x2, y2) => fl(x1, y1, x2, y2, COUL.traj, { ep: 2.2, tirets: true, lt: 10 });

  /* ---------- Force et déplacement ---------- */
  function figTravail(o) {
    o = Object.assign({ alpha: 30, nom: 'F', ref: 'AB', W: 320, H: 150 }, o);
    const xA = o.ref === 'BA' ? 120 : 60, xB = 280, y = 108, a = o.alpha;
    let g = dep(xA, y, xB, y) + pt(xA, y) + pt(xB, y);
    g += txt(xA - 4, y + 22, 'A', { g: 800, c: ENCRE, t: 14, a: 'middle' }) + txt(xB, y + 22, 'B', { g: 800, c: ENCRE, t: 14, a: 'middle' });
    g += nom((xA + xB) / 2 + 20, y + 24, 'AB', '', COUL.traj, { t: 13 });
    const L = 88, r = rad(a), x2 = xA + L * Math.cos(r), y2 = y - L * Math.sin(r);
    g += fl(xA, y, x2, y2, COULF.F, { ep: 2.8, lt: 12 }) + nom(x2 + (Math.cos(r) < -.2 ? -12 : 12), y2 - 6, o.nom, '', COULF.F, { t: 15 });
    // angle : repéré depuis AB⃗ (ou depuis la direction opposée, en pointillés)
    const R = 30;
    if (o.ref === 'BA') {
      g += `<line x1="${xA}" y1="${y}" x2="${xA - 60}" y2="${y}" stroke="${ENCRE3}" stroke-width="1.3" stroke-dasharray="4 4"/>`;
      const b = rad(180 - a);
      g += `<path d="M${xA - R},${y} A${R},${R} 0 0 1 ${f1(xA + R * Math.cos(r))},${f1(y - R * Math.sin(r))}" fill="none" stroke="${ENCRE}" stroke-width="1.4"/>` +
        txt(xA - R - 6, y - 14, `${fmt(180 - a)}°`, { g: 800, c: ENCRE, t: 12, a: 'end' });
      g += `<path d="M${xA + 18},${y} A18,18 0 0 0 ${f1(xA + 18 * Math.cos(r))},${f1(y - 18 * Math.sin(r))}" fill="none" stroke="${COUL.traj}" stroke-width="1.4" stroke-dasharray="3 2"/>` +
        txt(xA + 22, y - 22, `α = ${fmt(a)}°`, { g: 800, c: COUL.traj, t: 12 });
      void b;
    } else if (a !== 0) {
      g += `<path d="M${xA + R},${y} A${R},${R} 0 0 ${a > 0 ? 0 : 1} ${f1(xA + R * Math.cos(r))},${f1(y - R * Math.sin(r))}" fill="none" stroke="${ENCRE}" stroke-width="1.4"/>` +
        txt(xA + (R + 14) * Math.cos(r / 2), y - (R + 14) * Math.sin(r / 2) + 5, o.arc || 'α', { g: 800, c: ENCRE, t: 13, a: 'middle' });
    }
    return svg(o.W, o.H, g, o.aria || `Le solide va de A à B ; la force F fait un angle ${o.ref === 'BA' ? 'de ' + (180 - a) + '° avec la direction opposée au déplacement, soit α = ' + a + '°' : 'α avec le déplacement'}`);
  }

  // cercle trigonométrique : cos 0° = 1, cos 90° = 0, cos 180° = −1
  const CERCLE = svg(300, 150, `<line x1="40" y1="80" x2="262" y2="80" stroke="${ENCRE2}" stroke-width="1.4"/>` + fl(250, 80, 270, 80, ENCRE2, { ep: 1.4, lt: 8 }) + txt(272, 72, 'cos α', { t: 11 }) +
    `<line x1="150" y1="14" x2="150" y2="146" stroke="${ENCRE3}" stroke-width="1.2"/><circle cx="150" cy="80" r="56" fill="none" stroke="${ENCRE}" stroke-width="1.4"/>` +
    pt(206, 80) + pt(150, 24) + pt(94, 80) + txt(212, 70, 'α = 0°', { g: 800, c: ENCRE, t: 12 }) + txt(158, 20, 'α = 90°', { g: 800, c: ENCRE, t: 12 }) + txt(88, 70, 'α = 180°', { g: 800, c: ENCRE, t: 12, a: 'end' }) +
    txt(206, 98, '1', { g: 700, c: COUL.traj, t: 12, a: 'middle' }) + txt(158, 98, '0', { g: 700, c: COUL.traj, t: 12 }) + txt(94, 98, '−1', { g: 700, c: COUL.traj, t: 12, a: 'middle' }),
  'Cercle trigonométrique : cos 0° = 1, cos 90° = 0, cos 180° = −1');

  /* ---------- Exemple 2 : pétrolier remorqué ---------- */
  function figPetrolier() {
    let g = `<path d="M150,70 h-8 v-14 h-16 v14 h-8 v-6 h-10 v6 H44 l14,26 H170 l10,-20 Z" fill="#ebe8e1" stroke="${ENCRE2}" stroke-width="1.5"/>`;
    g += `<path d="M0,98 Q20,92 40,98 T80,98 T120,98 T160,98 T200,98 T240,98 T280,98 T320,98" fill="none" stroke="${ENCRE3}" stroke-width="1.3"/>`;
    const x0 = 176, y0 = 78, a = rad(20);
    g += `<line x1="${x0}" y1="${y0}" x2="${x0 + 130 * Math.cos(a)}" y2="${y0 - 130 * Math.sin(a)}" stroke="${ENCRE2}" stroke-width="1.2"/>`;
    g += fl(x0, y0, x0 + 80 * Math.cos(a), y0 - 80 * Math.sin(a), COULF.F, { ep: 2.8, lt: 12 }) + nom(x0 + 70, y0 - 40, 'F', '', COULF.F, { t: 15 });
    g += `<line x1="${x0}" y1="${y0}" x2="${x0 + 80}" y2="${y0}" stroke="${ENCRE3}" stroke-dasharray="4 4"/><path d="M${x0 + 34},${y0} A34,34 0 0 0 ${f1(x0 + 34 * Math.cos(a))},${f1(y0 - 34 * Math.sin(a))}" fill="none" stroke="${ENCRE}" stroke-width="1.4"/>` +
      txt(x0 + 44, y0 - 4, '20°', { g: 800, c: ENCRE, t: 12 });
    g += dep(60, 124, 250, 124) + pt(60, 124) + pt(250, 124) + txt(60, 142, 'A', { g: 800, c: ENCRE, t: 13, a: 'middle' }) + txt(250, 142, 'B', { g: 800, c: ENCRE, t: 13, a: 'middle' }) + txt(155, 142, 'AB = 2,0 km', { t: 11, a: 'middle' });
    return svg(330, 150, g, 'Pétrolier remorqué par un câble : la force F du câble fait un angle de 20° avec l\'horizontale, le déplacement AB est horizontal');
  }

  /* ---------- Tableau moteur / résistant / nul : une petite figure par cas ---------- */
  function figSignes(cas) {
    const a = { m: 35, r: 125, n: 90 }[cas];
    return figTravail({ alpha: a, W: 220, H: 130, aria: { m: 'Force qui fait un angle aigu avec le déplacement', r: 'Force qui fait un angle obtus avec le déplacement', n: 'Force perpendiculaire au déplacement' }[cas] });
  }

  /* ---------- Travail du poids : décomposition du trajet ---------- */
  function figDecomp(sens) {
    const monte = sens === 'monte', W = 340, H = 190;
    const A = monte ? [90, 150] : [120, 40], B = monte ? [280, 40] : [290, 150], C = monte ? [280, 150] : [120, 150];
    let g = fl(30, 176, 30, 14, ENCRE, { ep: 1.2, lt: 7 }) + txt(38, 20, 'z', { g: 800, c: ENCRE, t: 13 });
    // trajet réel quelconque (courbe), puis trajet A → C → B
    g += `<path d="M${A[0]},${A[1]} C${A[0] + 90},${A[1] + (monte ? -150 : -40)} ${B[0] - 120},${B[1] + (monte ? 110 : -120)} ${B[0]},${B[1]}" fill="none" stroke="${ENCRE3}" stroke-width="1.6"/>`;
    g += txt(monte ? 150 : 200, monte ? 70 : 52, 'trajet suivi', { t: 10, a: 'middle', c: ENCRE3 });
    g += dep(A[0], A[1], C[0], C[1]) + dep(C[0], C[1], B[0], B[1]);
    const cote = { A: monte ? -1 : -1, B: 1, C: monte ? 1 : -1 };
    [[A, 'A'], [B, 'B'], [C, 'C']].forEach(([p, n]) => { g += pt(p[0], p[1]) + txt(p[0] + cote[n] * 10, p[1] + (n === 'C' ? 16 : 5), n, { g: 800, c: ENCRE, t: 14, a: cote[n] > 0 ? 'start' : 'end' }); });
    // poids le long de la portion verticale (à côté du segment) et sur la portion horizontale
    const xv = monte ? C[0] + 26 : A[0] - 30, ym = (A[1] + B[1]) / 2;
    g += fl(xv, ym - 24, xv, ym + 16, COULF.P, { ep: 2.6 }) + nom(xv + (monte ? 14 : -14), ym + 2, 'P', '', COULF.P, { t: 13 });
    g += txt(monte ? C[0] - 8 : xv - 18, ym + 4, monte ? 'α = 180°' : 'α = 0°', { g: 800, c: ENCRE, t: 11, a: 'end' });
    const xh = (A[0] + B[0]) / 2 + 20, yh = 150;
    g += fl(xh, yh + 2, xh, yh + 32, COULF.P, { ep: 2.6 }) + nom(xh + 14, yh + 28, 'P', '', COULF.P, { t: 13 });
    g += txt(xh - 12, yh + 26, 'α = 90° : W = 0', { g: 800, c: ENCRE, t: 11, a: 'end' });
    return svg(W, H, g, monte ? 'L\'objet monte de A à B : trajet décomposé en A vers C horizontal (poids perpendiculaire, travail nul), puis C vers B vertical vers le haut (poids opposé au déplacement)'
      : 'L\'objet descend de A à B : trajet décomposé en A vers C vertical vers le bas (poids dans le sens du déplacement), puis C vers B horizontal (poids perpendiculaire, travail nul)');
  }

  /* ---------- Condensateur : chemin A → C → B (démonstration de W = qU) ---------- */
  function figCondoW() {
    const yh = 30, yb = 150, xa = 90;
    let g = '';
    [[yh, '+'], [yb, '−']].forEach(([y, s]) => {
      g += `<rect x="30" y="${y - 3}" width="250" height="6" rx="2" fill="#ebe8e1" stroke="${ENCRE2}" stroke-width="1.2"/>`;
      for (let x = 50; x < 280; x += 54) g += txt(x, y < 90 ? y - 8 : y + 18, s, { g: 800, c: ENCRE, t: 14, a: 'middle' });
    });
    g += fl(250, 60, 250, 116, COUL.E, { ep: 2.2 }) + nom(266, 92, 'E', '', COUL.E, { t: 14 });
    g += `<path d="M${xa},${yh} Q${xa + 30},${yb - 30} 190,${yb}" fill="none" stroke="${ENCRE3}" stroke-width="1.6"/>`;
    g += dep(xa, yh, xa, yb) + dep(xa, yb, 190, yb);
    g += pt(xa, yh) + pt(xa, yb) + pt(190, yb) + txt(xa - 8, yh + 16, 'A', { g: 800, c: ENCRE, t: 13, a: 'end' }) + txt(xa - 8, yb - 6, 'C', { g: 800, c: ENCRE, t: 13, a: 'end' }) + txt(196, yb - 6, 'B', { g: 800, c: ENCRE, t: 13 });
    g += fl(xa + 14, 60, xa + 14, 100, COUL.F, { ep: 2.2 }) + txt(xa + 22, 88, 'q', { g: 800, c: COUL.F, t: 13 }) + nom(xa + 36, 88, 'E', '', COUL.F, { t: 13 });
    g += `<line x1="16" y1="${yh}" x2="16" y2="${yb}" stroke="${ENCRE2}"/><path d="M12,${yh + 7} l4,-7 l4,7 M12,${yb - 7} l4,7 l4,-7" fill="none" stroke="${ENCRE2}"/>` + txt(8, 94, 'L', { g: 800, c: ENCRE, t: 13, a: 'end' });
    return svg(300, 172, g, 'Condensateur plan : armature positive en haut, négative en bas, champ E vers le bas ; la particule positive va de A à B ; chemin A vers C vertical (force qE dans le sens du déplacement), puis C vers B horizontal (force perpendiculaire)');
  }

  /* ---------- Condensateur aux armatures verticales (accélérateur linéaire) ----------
     o = { q: 1 (particule positive, + à gauche) | −1 (électron, − à gauche), v0 (true : vitesse initiale), d ('L') } */
  function figAcc(o) {
    o = Object.assign({ q: 1, d: 'L', v0: false }, o);
    const xa = 70, xb = 250, ym = 86, pos = o.q > 0;
    let s = '';
    [[xa, pos ? '+' : '−'], [xb, pos ? '−' : '+']].forEach(([x, sg]) => {
      s += `<rect x="${x - 3}" y="20" width="6" height="56" rx="2" fill="#ebe8e1" stroke="${ENCRE2}"/><rect x="${x - 3}" y="96" width="6" height="56" rx="2" fill="#ebe8e1" stroke="${ENCRE2}"/>`;
      for (let y = 34; y < 150; y += 34) if (Math.abs(y - 86) > 20) s += txt(x + (x === xa ? -14 : 14), y + 4, sg, { g: 800, c: ENCRE, t: 14, a: 'middle' });
    });
    s += fl(xa, ym, 300, ym, ENCRE, { ep: 1.2, lt: 7 }) + txt(300, ym - 8, 'x', { g: 800, c: ENCRE, t: 12, a: 'end' }) + txt(xa - 8, ym + 18, 'O', { g: 800, c: ENCRE, t: 12, a: 'end' }) + txt(xb + 8, ym + 18, 'B', { g: 800, c: ENCRE, t: 12 });
    // champ : de + vers − ; force : vers la droite (la particule est accélérée)
    s += pos ? fl(120, 40, 200, 40, COUL.E, { ep: 2.2 }) + nom(160, 30, 'E', '', COUL.E) : fl(200, 40, 120, 40, COUL.E, { ep: 2.2 }) + nom(160, 30, 'E', '', COUL.E);
    s += `<circle cx="${xa}" cy="${ym}" r="5" fill="${pos ? '#fff' : ENCRE}" stroke="${ENCRE}" stroke-width="1.6"/>` + fl(84, 122, 134, 122, COUL.F, { ep: 2.2 }) + nom(110, 142, 'F', 'él', COUL.F, { t: 13 });
    if (o.v0) s += fl(xa + 6, ym - 14, xa + 50, ym - 14, COUL.v, { ep: 2.2 }) + nom(xa + 40, ym - 22, 'v', '0', COUL.v, { t: 13 });
    s += `<line x1="${xa}" y1="164" x2="${xb}" y2="164" stroke="${ENCRE2}"/><line x1="${xa}" y1="158" x2="${xa}" y2="170" stroke="${ENCRE2}"/><line x1="${xb}" y1="158" x2="${xb}" y2="170" stroke="${ENCRE2}"/>` + txt(160, 180, o.d, { g: 800, c: ENCRE, t: 12, a: 'middle' });
    return svg(320, 188, s, `Condensateur aux armatures verticales distantes de ${o.d} : ${pos ? 'la particule positive part de O, sur l\'armature +' : 'l\'électron entre en O, du côté de l\'armature −'} ; la force électrique la pousse vers B${pos ? ', dans le sens du champ' : ', dans le sens opposé au champ'}`);
  }

  /* ---------- Forces toujours perpendiculaires au mouvement ---------- */
  function figPerp(k) {
    let g = '';
    if (k === 'sat') {
      g += `<circle cx="80" cy="80" r="56" fill="none" stroke="${ENCRE3}" stroke-dasharray="5 4"/><circle cx="80" cy="80" r="16" fill="#ebe8e1" stroke="${ENCRE2}"/>` + txt(80, 84, 'Terre', { t: 9, a: 'middle' });
      const x = 80 + 56 * Math.cos(rad(45)), y = 80 - 56 * Math.sin(rad(45));
      g += `<rect x="${f1(x - 5)}" y="${f1(y - 5)}" width="10" height="10" fill="${ENCRE2}"/>` + fl(x, y, x - 26, y + 26, COUL.F, { ep: 2.2 }) + nom(x - 30, y + 12, 'F', 'T/S', COUL.F, { t: 12 });
      g += fl(x, y, x + 32, y + 32, COUL.v, { ep: 2.2 }) + nom(x + 34, y + 22, 'v', '', COUL.v, { t: 12 });
      return svg(170, 160, g, 'Satellite en orbite circulaire : la force d\'attraction de la Terre est dirigée vers le centre, perpendiculaire à la vitesse');
    }
    if (k === 'pendule') {
      g += `<line x1="40" y1="14" x2="130" y2="14" stroke="${ENCRE}" stroke-width="2"/>`;
      for (let x = 46; x < 130; x += 10) g += `<line x1="${x}" y1="14" x2="${x - 6}" y2="6" stroke="${ENCRE3}"/>`;
      const a = rad(30), x = 85 + 100 * Math.sin(a), y = 14 + 100 * Math.cos(a);
      g += `<path d="M${f1(85 - 100 * Math.sin(a))},${f1(y)} A100,100 0 0 0 ${f1(x)},${f1(y)}" fill="none" stroke="${ENCRE3}" stroke-dasharray="5 4"/>`;
      g += `<line x1="85" y1="14" x2="${f1(x)}" y2="${f1(y)}" stroke="${ENCRE2}" stroke-width="1.4"/><circle cx="${f1(x)}" cy="${f1(y)}" r="7" fill="#fff" stroke="${ENCRE}" stroke-width="1.6"/>`;
      g += fl(x, y, x - 30 * Math.sin(a), y - 30 * Math.cos(a), COUL.F, { ep: 2.2 }) + nom(x - 26, y - 34, 'T', '', COUL.F, { t: 12 });
      g += fl(x, y, x + 30 * Math.cos(a), y - 30 * Math.sin(a), COUL.v, { ep: 2.2 }) + nom(x + 32, y - 18, 'v', '', COUL.v, { t: 12 });
      return svg(170, 140, g, 'Pendule : la tension du fil est dirigée vers le point d\'attache, perpendiculaire à la vitesse');
    }
    g += `<line x1="10" y1="110" x2="200" y2="110" stroke="${ENCRE2}" stroke-width="1.6"/><rect x="70" y="72" width="50" height="38" rx="3" fill="#ebe8e1" stroke="${ENCRE2}"/>`;
    g += force('RN', 95, 91, 90, 54) + force('P', 95, 91, 270, 54);
    g += fl(130, 64, 186, 64, COUL.v, { ep: 2.2 }) + nom(176, 56, 'v', '', COUL.v, { t: 12 });
    return svg(210, 160, g, 'Mobile sur coussin d\'air, mouvement horizontal : la réaction de la table et le poids sont verticaux, perpendiculaires au mouvement');
  }

  /* ---------- Balle sur un balcon : deux choix d'origine des altitudes ---------- */
  function figBalcon(o) {
    o = Object.assign({ origine: 'sol' }, o);
    const sol = 150, yb = sol - 90;
    let g = `<line x1="10" y1="${sol}" x2="200" y2="${sol}" stroke="${ENCRE2}" stroke-width="1.6"/><path d="M60,${sol} V60 L100,30 L140,60 V${sol}" fill="#fff" stroke="${ENCRE2}" stroke-width="1.5"/>`;
    g += `<rect x="140" y="${yb}" width="26" height="12" fill="none" stroke="${ENCRE2}"/><circle cx="156" cy="${yb - 5}" r="5" fill="${COUL.Epp}"/>`;
    const y0 = o.origine === 'sol' ? sol : yb;
    g += fl(30, sol + 6, 30, 16, ENCRE, { ep: 1.2, lt: 7 }) + txt(38, 22, 'z', { g: 800, c: ENCRE, t: 13 }) + txt(24, y0 + 4, '0', { g: 800, c: ENCRE, t: 12, a: 'end' });
    if (o.origine !== 'sol') g += `<line x1="30" y1="${yb}" x2="176" y2="${yb}" stroke="${ENCRE3}" stroke-dasharray="4 4"/>` + txt(24, sol + 4, '−3', { g: 700, c: ENCRE2, t: 11, a: 'end' });
    else g += txt(24, yb + 4, '3', { g: 700, c: ENCRE2, t: 11, a: 'end' }) + `<line x1="27" y1="${yb}" x2="33" y2="${yb}" stroke="${ENCRE}"/>`;
    return svg(210, 170, g, o.origine === 'sol' ? 'Balle sur un balcon à 3 m du sol ; origine des altitudes au sol' : 'Balle sur un balcon à 3 m du sol ; origine des altitudes au niveau du balcon, le sol est à −3 m');
  }

  /* ---------- Énergies en fonction du temps (lancer de balle) ----------
     o = { frott : énergie perdue en tout (0 : sans frottements), Em0, W, H, aria } */
  function figEnergies(o) {
    o = Object.assign({ frott: 0, Em0: 20, W: 330, H: 190 }, o);
    const T = 1, Epp = t => (o.Em0 - 8) * 4 * t * (1 - t) * (1 - o.frott / o.Em0 * .3 * t), Em = t => o.Em0 - o.frott * t, Ec = t => Em(t) - Epp(t);
    return ET.courbes({ tmax: T, ymin: 0, ymax: o.Em0 + 4, pasT: .2, pasY: 5, W: o.W, H: o.H, nomY: 'E (J)', series: [
      { f: Em, coul: COUL.Em, nom: 'E<tspan dy="3" font-size="8">m</tspan>', tNom: .08 },
      { f: Ec, coul: COUL.Ec, nom: 'E<tspan dy="3" font-size="8">c</tspan>', tNom: .82 },
      { f: Epp, coul: COUL.Epp, nom: 'E<tspan dy="3" font-size="8">pp</tspan>', tNom: .3 }],
      aria: o.aria || (o.frott ? 'Énergies d\'une balle lancée avec frottements : l\'énergie mécanique diminue' : 'Énergies d\'une balle lancée sans frottements : l\'énergie mécanique reste constante, l\'énergie cinétique et l\'énergie potentielle s\'échangent') });
  }

  /* ---------- Pente (piste, tremplin) de dénivelé h ----------
     o = { A ('A'), B ('B'), h ('h'), aria, vB (nom de la vitesse en B) } */
  function figPente(o) {
    o = Object.assign({ A: 'A', B: 'B', h: 'h' }, o);
    let g = `<path d="M40,30 C110,40 150,150 230,140 L300,128" fill="none" stroke="${ENCRE}" stroke-width="2.4"/>`;
    g += `<line x1="22" y1="30" x2="22" y2="140" stroke="${ENCRE2}"/><path d="M18,37 l4,-7 l4,7 M18,133 l4,7 l4,-7" fill="none" stroke="${ENCRE2}"/>` + txt(14, 90, o.h, { g: 800, c: ENCRE, t: 13, a: 'end' });
    g += `<line x1="22" y1="140" x2="300" y2="140" stroke="${ENCRE3}" stroke-dasharray="4 4"/>`;
    g += pt(40, 30) + txt(48, 24, o.A, { g: 800, c: ENCRE, t: 13 }) + pt(230, 140) + txt(230, 158, o.B, { g: 800, c: ENCRE, t: 13, a: 'middle' });
    if (o.vB) g += fl(230, 140, 286, 130, COUL.v, { ep: 2.2 }) + nom(276, 120, 'v', o.vB, COUL.v, { t: 13 });
    return svg(310, 168, g, o.aria || 'Piste qui descend de A à B, de dénivelé h');
  }

  Object.assign(ET, { figTravail, CERCLE, figPetrolier, figSignes, figDecomp, figCondoW, figAcc, figPerp, figBalcon, figEnergies, figPente });
})();
