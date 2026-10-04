/* ============================================================
   Moteur de dessin des vecteurs dans un repère
   (application « Cinématique »)

   VEC.nomHTML('A'), VEC.nomHTML('u_x')   nom d'un vecteur avec sa flèche
   VEC.colHTML(a, b)                      coordonnées en colonne
   VEC.ijHTML(a, b, ['i', 'j'])           écriture a i + b j
   new VEC.Repere(zone, opts)             repère quadrillé, vecteurs à lire ou à tracer

   opts = {
     xmin, xmax, ymin, ymax   étendue du repère (−6 à 6 par défaut)
     axes, graduations, grille (true par défaut)
     unitaires: ['i', 'j']    noms des vecteurs unitaires dessinés en O (false : aucun)
     mode: 'mixte'            on glisse la pointe depuis le point de départ,
                              les boutons fléchés l'ajustent d'un carreau
           'glisser' | 'toucher' | 'aucun' (dessin seul)
     vecteurs: [{ nom, dep: [x, y], coord: [a, b], etiquette (HTML de la liste),
                  fixe (vecteur seulement affiché), coul, pointille, nomPos: [dx, dy] }]
     points: [{ nom, x, y }]  points nommés (petite croix)
     extra(g), dessus(g)      dessins SVG supplémentaires, sous / sur les vecteurs
     onChange()               appelé quand un vecteur change
   }

   Le dessin est en SVG, à l'échelle 1 (1 unité = 1 pixel) : il est
   recalculé quand la largeur disponible change, pour garder un
   quadrillage et des graduations lisibles sur smartphone.
   ============================================================ */
(function () {
  'use strict';

  const MOINS = '−';
  const nb = n => (n < 0 ? MOINS : '') + String(+Math.abs(n).toFixed(6)).replace('.', ',');
  const egal = (a, b) => !!a && !!b && a[0] === b[0] && a[1] === b[1];

  // couleurs (attributs de présentation : le même dessin sert à la loupe)
  const C = { encre: '#16181d', encre2: '#55585f', encre3: '#8d8f94', grille: '#dcd7e8', ok: '#16a34a', ko: '#dc2626', vert: '#0a7d57', orange: '#c2570c', bleu: '#2952c8' };
  function accent() {
    const s = getComputedStyle(document.documentElement);
    return { a: s.getPropertyValue('--accent').trim() || '#5a3fc4', ai: s.getPropertyValue('--accent-ink').trim() || '#3f2a93' };
  }

  /* ============================================================
     ÉCRITURES HTML
     ============================================================ */
  // nom de vecteur surmonté d'une flèche ; l'indice reste hors de la flèche (u⃗ₓ)
  function nomHTML(nom) {
    const [p, s] = String(nom).split('_');
    return `<span class="vec-nom">${p}</span>${s ? `<sub>${s}</sub>` : ''}`;
  }
  function colHTML(a, b) {
    return `<span class="vcol"><span>${typeof a === 'number' ? nb(a) : a}</span><span>${typeof b === 'number' ? nb(b) : b}</span></span>`;
  }
  // a i + b j (coefficients 1 et −1 non écrits, termes nuls omis)
  function ijHTML(a, b, u) {
    u = u || ['i', 'j'];
    function terme(c, n, premier) {
      if (c === 0) return '';
      const signe = c < 0 ? (premier ? MOINS : ` ${MOINS} `) : (premier ? '' : ' + ');
      return signe + (Math.abs(c) === 1 ? '' : nb(Math.abs(c)) + '\u202f') + nomHTML(n);
    }
    if (!a && !b) return nomHTML('0');
    const t1 = terme(a, u[0], true);
    return t1 + terme(b, u[1], !t1);
  }

  /* ============================================================
     PETITS DESSINS SVG
     ============================================================ */
  function trait(x1, y1, x2, y2, coul, ep, extra) {
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${coul}" stroke-width="${ep}"${extra || ''}/>`;
  }
  function pointille(x1, y1, x2, y2, coul, ep) {
    return trait(x1, y1, x2, y2, coul || C.encre2, ep || 1.5, ' stroke-dasharray="5 4"');
  }
  // flèche de (x1, y1) à (x2, y2), pointe triangulaire
  function fleche(x1, y1, x2, y2, coul, ep, lt, tirets) {
    const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy);
    if (L < 1) return '';
    const ux = dx / L, uy = dy / L;
    lt = Math.min(lt || 13, L * .55);
    const lw = lt * .42, bx = x2 - ux * lt, by = y2 - uy * lt;
    return trait(x1, y1, bx + ux * 2, by + uy * 2, coul, ep, ` stroke-linecap="round"${tirets ? ' stroke-dasharray="6 4"' : ''}`) +
      `<path d="M${x2},${y2} L${bx - uy * lw},${by + ux * lw} L${bx + uy * lw},${by - ux * lw} Z" fill="${coul}" stroke="${coul}" stroke-width="1" stroke-linejoin="round"/>`;
  }
  // largeur approchée d'un texte (police sans empattement)
  function largeur(txt, t) {
    let w = 0;
    for (const ch of String(txt)) w += (/[ijlI1,. ]/.test(ch) ? .3 : /[a-z]/.test(ch) ? .55 : .64) * t;
    return w;
  }
  // nom de vecteur en SVG, centré en x, y = ligne de base, flèche au-dessus
  function nomSVG(nom, x, y, t, coul) {
    const [p, s] = String(nom).split('_');
    const wp = largeur(p, t), ws = s ? largeur(s, t * .7) : 0;
    const x0 = x - (wp + ws) / 2, ya = y - t * .95;
    const x1 = x0 + t * .05, x2 = x0 + Math.max(wp, t * .5) + t * .05, h = t * .2;
    return `<text x="${x0}" y="${y}" font-size="${t}" font-weight="700" fill="${coul}" stroke="#fff" stroke-width="3" paint-order="stroke">${p}${s ? `<tspan font-size="${t * .7}" dy="${t * .28}">${s}</tspan>` : ''}</text>` +
      `<path d="M${x1},${ya} H${x2} M${x2 - h},${ya - h * .8} L${x2},${ya} L${x2 - h},${ya + h * .8}" fill="none" stroke="${coul}" stroke-width="${Math.max(1.3, t * .09)}" stroke-linecap="round" stroke-linejoin="round"/>`;
  }
  // texte avec un liseré blanc (lisible sur le quadrillage)
  function texte(x, y, txt, t, coul, ancre, gras) {
    return `<text x="${x}" y="${y}" font-size="${t}" font-weight="${gras || 700}" fill="${coul}" text-anchor="${ancre || 'middle'}" stroke="#fff" stroke-width="3.5" paint-order="stroke">${txt}</text>`;
  }
  // arc d'angle de centre (cx, cy), rayon r (px), de a1 à a2 (degrés, sens trigonométrique)
  function arc(cx, cy, r, a1, a2, coul, label, t) {
    const rad = a => a * Math.PI / 180;
    const p = a => [cx + r * Math.cos(rad(a)), cy - r * Math.sin(rad(a))];
    const [x1, y1] = p(a1), [x2, y2] = p(a2), grand = Math.abs(a2 - a1) > 180 ? 1 : 0, sens = a2 > a1 ? 0 : 1;
    let s = `<path d="M${x1},${y1} A${r},${r} 0 ${grand} ${sens} ${x2},${y2}" fill="none" stroke="${coul}" stroke-width="2"/>`;
    if (label) {
      const am = (a1 + a2) / 2, rl = r + (t || 14) * .9;
      s += texte(cx + rl * Math.cos(rad(am)), cy - rl * Math.sin(rad(am)) + (t || 14) * .35, label, t || 14, coul);
    }
    return s;
  }

  /* ============================================================
     DIAGNOSTIC D'UN TRACÉ OU D'UNE LECTURE
     d : coordonnées données par l'élève, a : coordonnées attendues
     ============================================================ */
  function diagnostic(d, a) {
    if (!d) return 'vide';
    if (egal(d, a)) return 'ok';
    if (a[0] !== a[1] && egal(d, [a[1], a[0]])) return 'inverse';
    if (a[0] && egal(d, [-a[0], a[1]])) return 'signeX';
    if (a[1] && egal(d, [a[0], -a[1]])) return 'signeY';
    if (a[0] && a[1] && egal(d, [-a[0], -a[1]])) return 'signes';
    if (d[0] === a[0]) return 'y';
    if (d[1] === a[1]) return 'x';
    return 'autre';
  }
  function message(code, u) {
    u = u || ['i', 'j'];
    const ui = nomHTML(u[0]), uj = nomHTML(u[1]);
    return {
      vide: 'pas encore tracé.',
      inverse: `tu as inversé les coordonnées. La 1<sup>re</sup> donne le déplacement horizontal (selon ${ui}), la 2<sup>de</sup> le déplacement vertical (selon ${uj}).`,
      signeX: 'le déplacement horizontal est dans le mauvais sens : coordonnée positive vers la droite, négative vers la gauche.',
      signeY: 'le déplacement vertical est dans le mauvais sens : coordonnée positive vers le haut, négative vers le bas.',
      signes: 'les deux déplacements sont dans le mauvais sens (positif : vers la droite et vers le haut).',
      y: 'le déplacement horizontal est juste, pas le déplacement vertical : compte les carreaux verticalement.',
      x: 'le déplacement vertical est juste, pas le déplacement horizontal : compte les carreaux horizontalement.',
      autre: 'compte les carreaux depuis le point de départ : d\'abord horizontalement (1<sup>re</sup> coordonnée), puis verticalement (2<sup>de</sup>).',
    }[code] || '';
  }

  /* ============================================================
     REPÈRE
     ============================================================ */
  function Repere(zone, opts) {
    this.o = Object.assign({ xmin: -6, xmax: 6, ymin: -6, ymax: 6, axes: true, graduations: true, grille: true, unitaires: ['i', 'j'],
      mode: 'mixte', vecteurs: [], points: [], largeurMax: 560, uMax: 44, uMin: 14 }, opts);
    this.vs = this.o.vecteurs.map(v => Object.assign({ fin: null, etat: null, bloque: false }, v));
    this.sel = this.vs.findIndex(v => !v.fixe);
    this.drag = null;
    this.verrou = this.o.mode === 'aucun';
    this.couleurs = accent();

    const aTracer = this.vs.filter(v => !v.fixe).length;
    const actif = this.o.mode !== 'aucun' && aTracer > 0;
    const pad = actif && (this.o.mode === 'toucher' || this.o.mode === 'mixte');
    const b = document.createElement('div');
    b.className = 'vec-bloc' + (actif ? '' : ' vec-fixe');
    b.innerHTML = `${actif && (aTracer > 1 || this.o.liste) ? '<div class="vec-chips" role="group" aria-label="Vecteur à tracer"></div>' : ''}
      <div class="vec-cadre"><svg class="vec-svg mode-${this.o.mode}"${actif ? ' tabindex="0"' : ''} role="img" aria-label="${this.o.aria || 'Repère quadrillé'}"></svg>
        ${actif ? '<div class="vec-loupe hidden" aria-hidden="true"><svg></svg></div>' : ''}</div>
      ${pad ? `<div class="vec-pad" role="group" aria-label="Déplacer la pointe d'un carreau">
        <button type="button" data-d="h" aria-label="Pointe un carreau vers le haut">↑</button>
        <button type="button" data-d="g" aria-label="Pointe un carreau vers la gauche">←</button>
        <button type="button" data-d="b" aria-label="Pointe un carreau vers le bas">↓</button>
        <button type="button" data-d="d" aria-label="Pointe un carreau vers la droite">→</button></div>` : ''}
      ${actif ? '<p class="vec-astuce" aria-live="polite"></p>' : ''}`;
    zone.appendChild(b);
    this.bloc = b;
    this.cadre = b.querySelector('.vec-cadre');
    this.svg = b.querySelector('.vec-svg');
    this.loupeEl = b.querySelector('.vec-loupe');
    this.astuce = b.querySelector('.vec-astuce');
    this.chips = b.querySelector('.vec-chips');

    if (this.chips) {
      this.vs.forEach((v, i) => {
        if (v.fixe) return;
        const c = document.createElement('button');
        c.type = 'button';
        c.className = 'vec-chip';
        c.dataset.i = i;
        c.innerHTML = `<span>${v.etiquette || nomHTML(v.nom)}</span>`;
        c.onclick = () => { if (this.vs[i].bloque || this.verrou) return; this.sel = i; this.dire(''); this.dessiner(); };
        this.chips.appendChild(c);
      });
    }
    if (actif) {
      if (this.o.mode === 'glisser' || this.o.mode === 'mixte') this.activerGlisser();
      if (this.o.mode === 'toucher') this.activerToucher();
      if (pad) this.activerPad();
      this.activerClavier();
    }

    // nouveau dessin quand la largeur disponible change (rotation de l'écran…)
    const redim = () => {
      const w = this.cadre.clientWidth;
      if (w && w !== this.largeurVue && !this.drag) { this.largeurVue = w; this.dessiner(); }
    };
    if (window.ResizeObserver) new ResizeObserver(redim).observe(this.cadre);
    else addEventListener('resize', redim);
    this.largeurVue = this.cadre.clientWidth;
    this.dessiner();
  }

  /* ---------- Géométrie : taille des carreaux selon la largeur ---------- */
  Repere.prototype.geo = function () {
    const o = this.o, nx = o.xmax - o.xmin, ny = o.ymax - o.ymin;
    const m = o.axes ? { g: 10, d: 22, h: 24, b: 10 } : { g: 8, d: 8, h: 8, b: 8 };
    const dispo = Math.min(this.cadre.clientWidth || 320, o.largeurMax);
    const u = Math.max(o.uMin, Math.min(o.uMax, Math.floor((dispo - m.g - m.d) / nx)));
    const W = m.g + m.d + u * nx, H = m.h + m.b + u * ny;
    return { u, W, H, m, px: x => m.g + (x - o.xmin) * u, py: y => m.h + (o.ymax - y) * u };
  };

  Repere.prototype.couleur = function (v, i) {
    if (v.etat === 'ok') return C.ok;
    if (v.etat === 'ko') return C.ko;
    if (v.fixe) return v.coul || C.encre;
    return i === this.sel && !this.verrou ? this.couleurs.ai : C.encre2;
  };

  /* ---------- Dessin complet (sans les poignées : il sert aussi à la loupe) ---------- */
  Repere.prototype.scene = function () {
    const o = this.o, g = this.g, { u, W, H, px, py } = g;
    const ac = this.couleurs;
    let s = `<rect x="0" y="0" width="${W}" height="${H}" fill="#fff"/>`;
    // quadrillage
    if (o.grille) {
      for (let x = o.xmin; x <= o.xmax; x++) s += trait(px(x), py(o.ymin), px(x), py(o.ymax), C.grille, 1);
      for (let y = o.ymin; y <= o.ymax; y++) s += trait(px(o.xmin), py(y), px(o.xmax), py(y), C.grille, 1);
    }
    // axes (placés en 0, ou sur le bord si 0 n'est pas dans le repère)
    const X0 = px(Math.min(Math.max(0, o.xmin), o.xmax)), Y0 = py(Math.min(Math.max(0, o.ymin), o.ymax));
    const tg = Math.max(10, Math.min(13, Math.round(u * .45)));
    const tn = Math.max(12, Math.min(16, Math.round(u * .55)));
    Object.assign(g, { X0, Y0, tg, tn });
    if (o.axes) {
      s += fleche(px(o.xmin), Y0, px(o.xmax) + 16, Y0, C.encre, 1.6, 9);
      s += fleche(X0, py(o.ymin), X0, py(o.ymax) - 16, C.encre, 1.6, 9);
      if (o.graduations) {
        const grad = (x, y, txt, ancre) => `<text x="${x}" y="${y}" font-size="${tg}" font-weight="600" fill="${C.encre2}" text-anchor="${ancre}" stroke="#fff" stroke-width="3" paint-order="stroke">${txt}</text>`;
        for (let x = o.xmin; x <= o.xmax; x++) if (x) s += grad(px(x), Y0 + tg + 2, nb(x), 'middle');
        for (let y = o.ymin; y <= o.ymax; y++) if (y) s += grad(X0 - 4, py(y) + tg * .36, nb(y), 'end');
      }
      s += `<text x="${X0 - 4}" y="${Y0 + tg + 2}" font-size="${tg}" font-weight="600" fill="${C.encre2}" text-anchor="end">O</text>`;
      s += `<text x="${px(o.xmax) + 14}" y="${Y0 - 8}" font-size="${tg + 2}" font-weight="700" fill="${C.encre}" text-anchor="end">${o.nomX || 'x'}</text>`;
      s += `<text x="${X0 + 8}" y="${py(o.ymax) - 10}" font-size="${tg + 2}" font-weight="700" fill="${C.encre}">${o.nomY || 'y'}</text>`;
    }
    // vecteurs unitaires en O
    if (o.unitaires) {
      const tu = u < 30 ? 12 : tn;
      s += fleche(px(0), py(0), px(1), py(0), ac.a, 3, Math.min(10, u * .4));
      s += fleche(px(0), py(0), px(0), py(1), ac.a, 3, Math.min(10, u * .4));
      // i sous l'axe des abscisses, j à droite de l'axe des ordonnées (les graduations sont de l'autre côté)
      s += nomSVG(o.unitaires[0], px(.45), py(0) + tu * 1.15 + 2, tu, ac.a);
      s += nomSVG(o.unitaires[1], px(0) + 6 + largeur(o.unitaires[1].replace('_', ''), tu) / 2, py(.5) + tu * .45, tu, ac.a);
    }
    if (o.extra) s += o.extra(g, this);
    // points nommés
    (o.points || []).forEach(p => {
      const x = px(p.x), y = py(p.y), k = 5;
      s += trait(x - k, y - k, x + k, y + k, p.coul || C.encre, 2) + trait(x - k, y + k, x + k, y - k, p.coul || C.encre, 2);
      if (p.nom) s += texte(x + (p.dx == null ? -10 : p.dx), y + (p.dy == null ? -8 : p.dy), p.nom, tn, p.coul || C.encre);
    });
    // vecteurs
    const ep = Math.max(2.5, Math.min(3.5, u * .1)), lt = Math.max(9, Math.min(14, u * .5));
    g.ep = ep; g.lt = lt;
    this.vs.forEach((v, i) => {
      const coul = this.couleur(v, i);
      if (v.fixe) {
        const x1 = px(v.dep[0]), y1 = py(v.dep[1]), x2 = px(v.dep[0] + v.coord[0]), y2 = py(v.dep[1] + v.coord[1]);
        s += fleche(x1, y1, x2, y2, coul, ep, lt, v.pointille);
        if (v.nom) {
          // nom à gauche du milieu de la flèche (ou à la position demandée)
          const L = Math.hypot(x2 - x1, y2 - y1) || 1, nx = (y2 - y1) / L, ny = -(x2 - x1) / L;
          const d = v.nomPos ? [v.nomPos[0] * u, -v.nomPos[1] * u] : [nx * 14, ny * 14];
          s += nomSVG(v.nom, (x1 + x2) / 2 + d[0], (y1 + y2) / 2 + d[1] + tn * .4, tn, coul);
        }
        return;
      }
      const x0 = px(v.dep[0]), y0 = py(v.dep[1]);
      const place = v.fin && !egal(v.fin, v.dep);
      if (i === this.sel && !this.verrou && !v.bloque) {
        // vecteur en cours : halo sur la pointe (ou anneau qui pulse sur le point de départ)
        if (place) s += `<circle cx="${px(v.fin[0])}" cy="${py(v.fin[1])}" r="${Math.max(11, u * .48)}" fill="${ac.a}" fill-opacity=".14"/>`;
        else s += `<circle class="vec-anneau" cx="${x0}" cy="${y0}" r="8" fill="none" stroke="${ac.a}" stroke-width="2"/>`;
      }
      if (place) s += fleche(x0, y0, px(v.fin[0]), py(v.fin[1]), coul, ep, lt);
      s += `<circle cx="${x0}" cy="${y0}" r="${place ? 3.5 : 4.5}" fill="${coul}"/>`;
      if (v.nom) {
        // nom près du point de départ, du côté opposé à la flèche, hors des graduations
        let cands = [[-11, -10], [11, -10], [-11, 12], [11, 12]];
        if (place) {
          const dx = px(v.fin[0]) - x0, dy = py(v.fin[1]) - y0, L = Math.hypot(dx, dy), a = dx / L, b = dy / L, k = 15;
          cands = [[-a * k, -b * k], [(-a - b) * k * .75, (-b + a) * k * .75], [(-a + b) * k * .75, (-b - a) * k * .75], [-b * k, a * k], [b * k, -a * k]];
        }
        const [lx, ly] = this.placeNom(x0, y0, cands, largeur(v.nom.replace('_', ''), tn), tn);
        s += nomSVG(v.nom, lx, ly + tn * .38, tn, coul);
      }
    });
    if (o.dessus) s += o.dessus(g, this);
    return s;
  };

  // première position (centre du nom) qui ne chevauche pas les graduations des axes
  Repere.prototype.placeNom = function (x0, y0, cands, w, t) {
    const g = this.g, o = this.o, wg = largeur('−6', g.tg);
    const libre = (cx, cy) => {
      if (!o.axes || !o.graduations) return true;
      const x1 = cx - w / 2 - 2, x2 = cx + w / 2 + 2, y1 = cy - t * .95, y2 = cy + t * .55;
      const bandeX = y2 > g.Y0 + 2 && y1 < g.Y0 + g.tg + 5 && x2 > g.px(o.xmin) - 8 && x1 < g.px(o.xmax) + 8;
      const bandeY = x2 > g.X0 - 5 - wg && x1 < g.X0 - 1 && y2 > g.py(o.ymax) - 8 && y1 < g.py(o.ymin) + 8;
      return !bandeX && !bandeY;
    };
    const c = cands.find(([ox, oy]) => libre(x0 + ox, y0 + oy)) || cands[0];
    return [x0 + c[0], y0 + c[1]];
  };

  // poignées (glisser) : zones de prise invisibles au départ et à la pointe
  Repere.prototype.poignees = function () {
    if ((this.o.mode !== 'glisser' && this.o.mode !== 'mixte') || this.verrou) return '';
    const { u, px, py } = this.g, R = Math.max(20, u * .8);
    let s = '';
    this.vs.forEach((v, i) => {
      if (v.fixe || v.bloque) return;
      s += `<circle class="vec-poignee" data-i="${i}" data-b="dep" cx="${px(v.dep[0])}" cy="${py(v.dep[1])}" r="${R}" fill="#000" fill-opacity="0"/>`;
    });
    this.vs.forEach((v, i) => {
      if (v.fixe || v.bloque || !v.fin) return;
      s += `<circle class="vec-poignee" data-i="${i}" data-b="fin" cx="${px(v.fin[0])}" cy="${py(v.fin[1])}" r="${R}" fill="#000" fill-opacity="0"/>`;
    });
    return s;
  };

  Repere.prototype.dessiner = function () {
    this.g = this.geo();
    const { W, H } = this.g;
    this.svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    this.svg.setAttribute('width', W);
    this.svg.setAttribute('height', H);
    // deux calques : le dessin, puis les poignées (gardées pendant un glisser :
    // l'élément touché ne doit pas disparaître sous le doigt)
    if (!this.gScene) {
      this.svg.innerHTML = '<g></g><g></g>';
      this.gScene = this.svg.children[0];
      this.gPrises = this.svg.children[1];
    }
    this.sceneTxt = this.scene();
    this.gScene.innerHTML = this.sceneTxt;
    if (!this.drag) this.gPrises.innerHTML = this.poignees();
    this.majChips();
    const pad = this.bloc.querySelector('.vec-pad');
    if (pad) pad.querySelectorAll('button').forEach(bt => { bt.disabled = this.verrou; });
  };

  Repere.prototype.majChips = function () {
    if (!this.chips) return;
    this.chips.querySelectorAll('.vec-chip').forEach(c => {
      const i = +c.dataset.i, v = this.vs[i];
      c.classList.toggle('actif', i === this.sel && !this.verrou && !v.bloque);
      c.classList.toggle('place', !!v.fin);
      c.classList.toggle('ok', v.etat === 'ok');
      c.classList.toggle('ko', v.etat === 'ko');
      c.setAttribute('aria-pressed', i === this.sel ? 'true' : 'false');
    });
  };

  Repere.prototype.dire = function (h) { if (this.astuce) this.astuce.innerHTML = h || ''; };

  /* ---------- Conversions pointeur → repère ---------- */
  Repere.prototype.point = function (e) {
    const r = this.svg.getBoundingClientRect();
    return { x: (e.clientX - r.left) * this.g.W / r.width, y: (e.clientY - r.top) * this.g.H / r.height };
  };
  Repere.prototype.noeud = function (p) {
    const o = this.o, g = this.g;
    const x = Math.round(o.xmin + (p.x - g.m.g) / g.u), y = Math.round(o.ymax - (p.y - g.m.h) / g.u);
    return [Math.min(o.xmax, Math.max(o.xmin, x)), Math.min(o.ymax, Math.max(o.ymin, y))];
  };
  // nouvelle pointe du vecteur en cours (vecteur nul = pas tracé)
  Repere.prototype.poser = function (n) {
    const v = this.vs[this.sel];
    if (!v || v.bloque || this.verrou) return false;
    const f = egal(n, v.dep) ? null : n;
    if (egal(f, v.fin) || (!f && !v.fin)) return false;
    v.fin = f; v.etat = null;
    this.dessiner();
    if (this.o.onChange) this.o.onChange(this);
    return true;
  };

  /* ---------- Glisser la pointe ---------- */
  Repere.prototype.activerGlisser = function () {
    const svg = this.svg;
    // iOS : empêche le défilement de la page quand le geste commence sur une poignée
    svg.addEventListener('touchstart', e => { if (e.target.closest && e.target.closest('.vec-poignee')) e.preventDefault(); }, { passive: false });
    svg.addEventListener('touchmove', e => { if (this.drag) e.preventDefault(); }, { passive: false });
    svg.addEventListener('pointerdown', e => {
      // un seul geste à la fois (un deuxième doigt est ignoré)
      if (this.drag || this.verrou || (e.pointerType === 'mouse' && e.button !== 0)) return;
      const h = e.target.closest && e.target.closest('.vec-poignee');
      if (!h) return;
      e.preventDefault();
      // plusieurs poignées peuvent se chevaucher : on prend la plus proche
      // (priorité au vecteur choisi dans la liste, puis à la pointe)
      const p = this.point(e);
      let best = null, dmin = Infinity;
      svg.querySelectorAll('.vec-poignee').forEach(c => {
        const d = Math.hypot(+c.getAttribute('cx') - p.x, +c.getAttribute('cy') - p.y) - (c.dataset.b === 'fin' ? 3 : 0) - (+c.dataset.i === this.sel ? 6 : 0);
        if (d < dmin) { dmin = d; best = c; }
      });
      this.sel = +best.dataset.i;
      this.drag = { id: e.pointerId, type: e.pointerType };
      try { svg.setPointerCapture(e.pointerId); } catch (_) { /* rien */ }
      svg.classList.add('glisse');
      this.dire('');
      this.dessiner();
      if (e.pointerType !== 'mouse') this.montrerLoupe(e);
    });
    svg.addEventListener('pointermove', e => {
      if (!this.drag || e.pointerId !== this.drag.id) return;
      e.preventDefault();
      this.poser(this.noeud(this.point(e)));
      if (this.drag.type !== 'mouse') this.montrerLoupe(e);
    });
    // appui hors des poignées (sans glisser) : on rappelle le geste
    this.finGlisse = 0;
    svg.addEventListener('click', e => {
      if (this.verrou || Date.now() - this.finGlisse < 500) return;
      if (e.target.closest && e.target.closest('.vec-poignee')) return;
      const v = this.vs[this.sel];
      if (v && !v.bloque) this.dire(`Pour tracer ${nomHTML(v.nom)}, pose le doigt (ou la souris) sur son point de départ et glisse jusqu'à l'arrivée${this.o.mode === 'mixte' ? ', ou utilise les flèches' : ''}.`);
    });
    const fin = e => {
      if (!this.drag || e.pointerId !== this.drag.id) return;
      this.drag = null;
      this.finGlisse = Date.now();
      svg.classList.remove('glisse');
      this.loupeEl.classList.add('hidden');
      this.dessiner();
    };
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(t => svg.addEventListener(t, fin));
  };

  // loupe au-dessus du doigt : le doigt cache la pointe sur un écran tactile
  Repere.prototype.montrerLoupe = function (e) {
    const v = this.vs[this.sel], g = this.g, L = this.loupeEl, T = 124;
    const b = v.fin || v.dep, cx = g.px(b[0]), cy = g.py(b[1]), z = Math.max(62, g.u * 2.8);
    const s = L.querySelector('svg');
    s.setAttribute('viewBox', `${cx - z / 2} ${cy - z / 2} ${z} ${z}`);
    if (this.loupeTxt !== this.sceneTxt) { s.innerHTML = this.sceneTxt; this.loupeTxt = this.sceneTxt; }
    const r = this.cadre.getBoundingClientRect();
    let x = e.clientX - T / 2, y = e.clientY - T - 44;
    if (y < 64) {                                       // pas de place au-dessus : à côté du doigt
      y = e.clientY - T / 2;
      x = e.clientX < innerWidth / 2 ? e.clientX + 48 : e.clientX - 48 - T;
    }
    x = Math.max(4, Math.min(innerWidth - T - 4, x));
    L.style.left = (x - r.left) + 'px';
    L.style.top = (y - r.top) + 'px';
    L.classList.remove('hidden');
  };

  /* ---------- Toucher le nœud d'arrivée ---------- */
  Repere.prototype.activerToucher = function () {
    this.svg.addEventListener('click', e => {
      if (this.verrou) return;
      const v = this.vs[this.sel];
      if (!v) return;
      if (v.bloque) { this.dire('Ce vecteur est juste. Choisis un autre vecteur dans la liste.'); return; }
      this.dire('');
      this.poser(this.noeud(this.point(e)));
      if (matchMedia('(hover: hover)').matches) this.svg.focus({ preventScroll: true });
    });
  };
  /* ---------- Boutons fléchés : la pointe avance d'un carreau ---------- */
  Repere.prototype.activerPad = function () {
    this.bloc.querySelectorAll('.vec-pad button').forEach(bt => {
      bt.onclick = () => { const d = { h: [0, 1], b: [0, -1], g: [-1, 0], d: [1, 0] }[bt.dataset.d]; this.deplacer(d[0], d[1]); };
    });
  };
  Repere.prototype.deplacer = function (dx, dy) {
    const v = this.vs[this.sel];
    if (!v || this.verrou) return;
    if (v.bloque) { this.dire('Ce vecteur est juste. Choisis un autre vecteur dans la liste.'); return; }
    const b = v.fin || v.dep, o = this.o;
    const n = [b[0] + dx, b[1] + dy];
    if (n[0] < o.xmin || n[0] > o.xmax || n[1] < o.ymin || n[1] > o.ymax) { this.dire('La pointe est au bord du quadrillage.'); return; }
    this.dire('');
    this.poser(n);
  };
  // clavier (ordinateur) : touches fléchées
  Repere.prototype.activerClavier = function () {
    this.svg.addEventListener('keydown', e => {
      const d = { ArrowUp: [0, 1], ArrowDown: [0, -1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] }[e.key];
      if (!d || this.sel < 0 || this.verrou) return;
      e.preventDefault();
      this.deplacer(d[0], d[1]);
    });
  };

  /* ---------- Vérification ---------- */
  // renvoie [{ i, v, code }] pour les vecteurs à tracer ; les vecteurs justes sont bloqués
  Repere.prototype.verifier = function () {
    const res = [];
    this.vs.forEach((v, i) => {
      if (v.fixe) return;
      const code = diagnostic(v.fin && [v.fin[0] - v.dep[0], v.fin[1] - v.dep[1]], v.coord);
      v.etat = code === 'vide' ? null : code === 'ok' ? 'ok' : 'ko';
      if (code === 'ok') v.bloque = true;
      res.push({ i, v, code });
    });
    if (res.every(r => r.code === 'ok')) this.verrou = true;
    else this.sel = res.find(r => r.code !== 'ok').i;       // vecteur suivant à corriger
    this.dire('');
    this.dessiner();
    return res;
  };
  // affiche la bonne réponse et bloque le repère
  Repere.prototype.montrer = function () {
    this.vs.forEach(v => {
      if (v.fixe) return;
      if (v.etat !== 'ok') { v.fin = [v.dep[0] + v.coord[0], v.dep[1] + v.coord[1]]; v.etat = null; }
      v.bloque = true;
    });
    this.verrou = true;
    this.dire('');
    this.dessiner();
  };
  Repere.prototype.recommencer = function () {
    this.vs.forEach(v => { if (!v.fixe) { v.fin = null; v.etat = null; v.bloque = false; } });
    this.verrou = this.o.mode === 'aucun';
    this.sel = this.vs.findIndex(v => !v.fixe);
    this.dire('');
    this.dessiner();
  };

  window.VEC = { nomHTML, colHTML, ijHTML, nb, egal, Repere, diagnostic, message, fleche, pointille, nomSVG, texte, arc, trait, largeur, C };
})();
