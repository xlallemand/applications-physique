/* ============================================================
   OPT : rayons lumineux (optique géométrique), outil partagé
   Créé pour « Réfraction et loi de Snell-Descartes » (refraction/),
   pensé pour être étendu par « Image par une lentille convergente »
   (lentilles/ : lentille mince, axe optique, foyers, rayons particuliers).

   La GÉOMÉTRIE (vecteurs, réfraction, tracé d'un rayon à travers des
   milieux) est séparée du RENDU (scène SVG) et des ÉLÉMENTS MANIPULABLES
   (poignées, cibles, étiquettes). Plusieurs scènes par page, aucun id fixe,
   aucun état global. Aucun texte propre à une application : les textes et
   les diagnostics sont fournis par l'application.

   Repère : coordonnées « mathématiques » en unités de la scène, origine au
   centre, x vers la droite, y vers le HAUT ; angles en DEGRÉS, comptés depuis
   l'axe des x dans le sens trigonométrique.

   ---------- Géométrie ----------
   OPT.V                         vecteurs : add, sub, mul, dot, cross, len, norm, dir(a), angle(v), rot(v, a), perp(v)
   OPT.refracter(n1, n2, i1)     → { i2, sin } ou { totale: true } (loi de Descartes, angles en degrés)
   OPT.reflechir(i1)             → angle de réflexion (= i1)
   OPT.limite(n1, n2)            → angle limite (degrés) si n1 > n2, sinon null
   OPT.devier(d, N, n1, n2)      → { i1, i2, refracte, reflechi } ou { i1, totale: true, reflechi }
                                    d : direction unitaire du rayon incident ; N : normale (sens quelconque)
   OPT.tracer(P, d, objets, o)   tracé d'un rayon à travers des polygones d'indice donné :
                                    objets = [{ sommets: [[x, y]…], n }], o = { n0: 1 (milieu extérieur),
                                    longueur: 1000, rebonds: 8 }
                                    → { segments: [{ a, b, n }], interfaces: [{ P, N, n1, n2, i1, i2, totale }] }
   OPT.dansPolygone(p, sommets)  point dans un polygone
   OPT.demiPlan(poly, P, N)      partie du polygone du côté de N (droite passant par P, normale N)
   OPT.demiDisque(C, r, a, k)    sommets d'un demi-disque (face plane passant par C, côté de la direction a)
   OPT.distSegment(p, a, b)      distance d'un point à un segment

   ---------- Rendu : OPT.scene(zone, options) ----------
   options = { taille: 400 (côté du carré en unités), largeur, hauteur (figure rectangulaire), aria: 'description de la figure',
               milieux: [{ nom, n, sommets, fond: 'feuille' | 'papier' | 'papier2', etiquette: [x, y] }],
               dioptre: { type: 'plan' | 'demiCylindre' | 'prisme', angle, I, sommets }   (facultatif)
               rayons: [{ a, b, fleche: 1 | −1 | 0, cls }]                                   (facultatif) }
   → scène S :
     S.svg, S.taille, S.I (point d'incidence du dioptre plan), S.normale (direction de la normale, degrés)
     S.calque(nom)                 groupe SVG : 'fond', 'milieux', 'deco', 'rayons', 'arcs', 'cibles', 'textes', 'poignees'
     S.vider(nom)                  vide un calque
     S.poly(calque, sommets, cls), S.ligne(calque, a, b, cls), S.cercle(calque, c, r, cls)
     S.rayon(calque, a, b, { fleche, cls, couleur, largeur })    rayon avec flèche au milieu (1 : de a vers b)
     S.arc(calque, C, a1, a2, r, cls)                              arc d'angle (le plus court de a1 à a2)
     S.angleDroit(calque, C, a1, a2, cote, cls)                    marque d'angle droit
     S.texte(calque, p, html, { cls, ancre, taille })              texte (accepte <sub>, <sup>, <b>)
     S.rapporteur(calque, C, r, { zero, pas })                     rapporteur gradué (degrés depuis la direction zero)
     S.milieu(m)                                                   dessine un milieu (polygone + nom)
     S.echelle()                   pixels par unité ; S.u(px) : longueur en unités pour px pixels
     S.point(evt)                  coordonnées d'un événement de pointeur
     S.plusProche(evt, cibles, seuilPx)   cible la plus proche : cibles = [{ id, p } | { id, a, b } | { id, zone(p) }]
     S.surRedim(fn)                appelée quand la largeur affichée change (poignées de 44 px)
     S.maj(etat)                   redessine les rayons d'options.rayons (etat.rayons)

   ---------- Éléments manipulables ----------
   OPT.pivot(S, { centre, angle, rayon, pas, contraindre(a), surChange(a), surFin(a), aria })
       poignée qui tourne autour de centre (glisser à la souris ou au doigt) ;
       → { angle(), regler(a), verrouiller(), deverrouiller(), el }
   OPT.fleches(conteneur, { moins, plus, aria: ['…', '…'], symboles: ['◀', '▶'] })   boutons de 58 × 50 px
   OPT.surAppui(el, fn)          appui bref (souris ou doigt) : fn(evt), deux appuis rapides comptent pour deux
   OPT.cible(S, p, surToucher)   point à toucher (zone sensible de 44 px de diamètre) → { retirer() }
   OPT.etiquettes(S, bac, { items: [{ id, html }], cibles: () => [...], surDepot(id, cible, evt) → true si acceptée,
                             seuilPx: 34, surSelection(id) })
       étiquettes à glisser sur la figure (souris, doigt) ou à toucher puis toucher la cible (deux appuis) ;
       → { retirer(id), remettre(id), selection(), vider() }
   OPT.svgTexte(el, html)        remplit un <text> SVG avec des <tspan> (indices, exposants, gras)

   Styles : assets/optique.css (classes opt-). Couleurs : variables de assets/theme.css
   par les classes ; couleurs calculées (spectre) en attributs de présentation.

   Exemple :
     const S = OPT.scene(zone, { milieux: [{ nom: 'air', n: 1, sommets: haut, fond: 'feuille' },
                                           { nom: 'eau', n: 1.33, sommets: bas, fond: 'papier' }] });
     S.ligne('deco', [-200, 0], [200, 0], 'opt-surface');
     const r = OPT.refracter(1, 1.33, 30);    // { i2: 22.08… }
   ============================================================ */
(function () {
  'use strict';

  const RAD = Math.PI / 180;
  const NS = 'http://www.w3.org/2000/svg';

  /* ============================================================
     VECTEURS
     ============================================================ */
  const V = {
    add: (a, b) => [a[0] + b[0], a[1] + b[1]],
    sub: (a, b) => [a[0] - b[0], a[1] - b[1]],
    mul: (a, k) => [a[0] * k, a[1] * k],
    dot: (a, b) => a[0] * b[0] + a[1] * b[1],
    cross: (a, b) => a[0] * b[1] - a[1] * b[0],
    len: a => Math.hypot(a[0], a[1]),
    norm: a => { const l = Math.hypot(a[0], a[1]) || 1; return [a[0] / l, a[1] / l]; },
    dir: a => [Math.cos(a * RAD), Math.sin(a * RAD)],
    angle: v => Math.atan2(v[1], v[0]) / RAD,
    rot: (v, a) => { const c = Math.cos(a * RAD), s = Math.sin(a * RAD); return [v[0] * c - v[1] * s, v[0] * s + v[1] * c]; },
    perp: v => [-v[1], v[0]],
  };
  // écart entre deux directions, ramené dans ]−180 ; 180]
  function ecart(a, b) { let d = ((a - b) % 360 + 360) % 360; if (d > 180) d -= 360; return d; }

  /* ============================================================
     LOIS DE DESCARTES
     ============================================================ */
  function refracter(n1, n2, i1) {
    const s = n1 * Math.sin(i1 * RAD) / n2;
    if (s > 1 + 1e-12) return { totale: true };
    return { i2: Math.asin(Math.min(1, s)) / RAD, sin: s };
  }
  const reflechir = i1 => i1;
  const limite = (n1, n2) => (n1 > n2 ? Math.asin(n2 / n1) / RAD : null);

  // Réfraction vectorielle : d direction incidente (unitaire), N normale (sens quelconque)
  function devier(d, N, n1, n2) {
    d = V.norm(d);
    let nn = V.norm(N), c = -V.dot(d, nn);
    if (c < 0) { nn = V.mul(nn, -1); c = -c; }               // nn pointe vers le milieu d'incidence
    c = Math.min(1, c);
    const i1 = Math.acos(c) / RAD;
    const reflechi = V.norm(V.add(d, V.mul(nn, 2 * c)));
    const eta = n1 / n2, k = 1 - eta * eta * (1 - c * c);
    if (k < -1e-12) return { i1, totale: true, reflechi };
    const refracte = V.norm(V.add(V.mul(d, eta), V.mul(nn, eta * c - Math.sqrt(Math.max(0, k)))));
    return { i1, i2: Math.asin(Math.min(1, eta * Math.sqrt(1 - c * c))) / RAD, refracte, reflechi };
  }

  /* ============================================================
     POLYGONES
     ============================================================ */
  function dansPolygone(p, s) {
    let dedans = false;
    for (let i = 0, j = s.length - 1; i < s.length; j = i++) {
      const [xi, yi] = s[i], [xj, yj] = s[j];
      if ((yi > p[1]) !== (yj > p[1]) && p[0] < (xj - xi) * (p[1] - yi) / (yj - yi) + xi) dedans = !dedans;
    }
    return dedans;
  }
  // Sutherland-Hodgman : partie de poly telle que (p − P)·N ≥ 0
  function demiPlan(poly, P, N) {
    const out = [], f = p => V.dot(V.sub(p, P), N);
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i], b = poly[(i + 1) % poly.length], fa = f(a), fb = f(b);
      if (fa >= 0) out.push(a);
      if ((fa >= 0) !== (fb >= 0)) { const t = fa / (fa - fb); out.push(V.add(a, V.mul(V.sub(b, a), t))); }
    }
    return out;
  }
  function demiDisque(C, r, a, k) {
    k = k || 48;
    const s = [];
    for (let j = 0; j <= k; j++) s.push(V.add(C, V.mul(V.dir(a - 90 + 180 * j / k), r)));
    return s;
  }
  function distSegment(p, a, b) {
    const ab = V.sub(b, a), t = Math.max(0, Math.min(1, V.dot(V.sub(p, a), ab) / (V.dot(ab, ab) || 1)));
    return V.len(V.sub(p, V.add(a, V.mul(ab, t))));
  }
  // intersection du rayon P + t d (t > 0) avec le segment [a, b] → t ou null
  function interSegment(P, d, a, b) {
    const e = V.sub(b, a), den = V.cross(d, e);
    if (Math.abs(den) < 1e-12) return null;
    const w = V.sub(a, P), t = V.cross(w, e) / den, u = V.cross(w, d) / den;
    return t > 1e-7 && u >= -1e-9 && u <= 1 + 1e-9 ? t : null;
  }

  /* ============================================================
     TRACÉ D'UN RAYON À TRAVERS DES MILIEUX (polygones)
     ============================================================ */
  function tracer(P, d, objets, o) {
    o = o || {};
    const n0 = o.n0 || 1, L = o.longueur || 1000, max = o.rebonds || 8;
    // indice au point p : le dernier objet qui le contient, sinon le milieu extérieur
    const indice = p => { for (let k = objets.length - 1; k >= 0; k--) if (dansPolygone(p, objets[k].sommets)) return objets[k].n; return n0; };
    let dir = V.norm(d), nCur = indice(V.add(P, V.mul(dir, 1e-6)));
    const segments = [], interfaces = [];
    for (let k = 0; k <= max; k++) {
      let best = null;
      objets.forEach(ob => {
        const s = ob.sommets;
        for (let i = 0; i < s.length; i++) {
          const a = s[i], b = s[(i + 1) % s.length], t = interSegment(P, dir, a, b);
          if (t != null && (!best || t < best.t)) best = { t, a, b };
        }
      });
      if (!best || k === max) { segments.push({ a: P, b: V.add(P, V.mul(dir, L)), n: nCur }); break; }
      const Q = V.add(P, V.mul(dir, best.t));
      segments.push({ a: P, b: Q, n: nCur });
      const N = V.perp(V.norm(V.sub(best.b, best.a)));
      const n2 = indice(V.add(Q, V.mul(dir, 1e-5)));
      const r = devier(dir, N, nCur, n2);
      interfaces.push({ P: Q, N, n1: nCur, n2, i1: r.i1, i2: r.i2, totale: !!r.totale });
      if (r.totale) dir = r.reflechi;
      else { dir = r.refracte; nCur = n2; }
      P = Q;
    }
    return { segments, interfaces };
  }

  /* ============================================================
     RENDU SVG
     ============================================================ */
  function svgEl(tag, attrs, parent) {
    const e = document.createElementNS(NS, tag);
    if (attrs) Object.keys(attrs).forEach(k => { if (attrs[k] != null) e.setAttribute(k, attrs[k]); });
    if (parent) parent.appendChild(e);
    return e;
  }
  // texte SVG avec indices, exposants et gras : « n<sub>air</sub> = 1,00 »
  function svgTexte(t, html) {
    while (t.firstChild) t.removeChild(t.firstChild);
    const lignes = String(html).split(/<br\s*\/?>/i);
    lignes.forEach((ligne, li) => {
      const morceaux = ligne.split(/(<\/?(?:sub|sup|b)>)/i);
      let mode = '', gras = false, premier = true;
      morceaux.forEach(m => {
        const l = m.toLowerCase();
        if (l === '<sub>' || l === '<sup>') { mode = l.slice(1, 4); return; }
        if (l === '</sub>' || l === '</sup>') { mode = ''; return; }
        if (l === '<b>') { gras = true; return; }
        if (l === '</b>') { gras = false; return; }
        if (!m) return;
        const ts = svgEl('tspan', null, t);
        if (premier && li > 0) { ts.setAttribute('x', t.getAttribute('x')); ts.setAttribute('dy', '1.2em'); }
        premier = false;
        if (mode) { ts.setAttribute('class', 'opt-' + mode); ts.setAttribute('baseline-shift', mode === 'sub' ? '-25%' : '40%'); ts.setAttribute('font-size', '72%'); }
        if (gras) ts.setAttribute('font-weight', '800');
        ts.textContent = m.replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
        // après un indice, l'espace qui suit reprend la ligne de base
      });
    });
    return t;
  }

  function scene(zone, opts) {
    opts = opts || {};
    // carré de côté taille, ou rectangle largeur × hauteur (origine au centre)
    const T = opts.taille || 400, W = opts.largeur || T, H = opts.hauteur || T, hw = W / 2, hh = H / 2;
    const svg = svgEl('svg', { viewBox: `${-hw} ${-hh} ${W} ${H}`, class: 'opt-svg', role: 'img', 'aria-label': opts.aria || 'Figure' });
    zone.appendChild(svg);
    const noms = ['fond', 'milieux', 'deco', 'rayons', 'arcs', 'cibles', 'textes', 'poignees'];
    const calques = {};
    noms.forEach(n => { calques[n] = svgEl('g', { class: 'opt-c-' + n }, svg); });
    const P = p => [p[0], -p[1]];                     // repère mathématique → SVG
    const cal = c => (typeof c === 'string' ? calques[c] : c);
    const redims = [];

    const S = {
      svg, taille: T, largeur: W, hauteur: H, calques,
      calque: n => calques[n],
      vider(n) { const g = cal(n); while (g.firstChild) g.removeChild(g.firstChild); },
      echelle() { const w = svg.getBoundingClientRect().width; return w > 0 ? w / W : 1; },
      u(px) { return px / S.echelle(); },
      point(evt) {
        const m = svg.getScreenCTM();
        if (!m) return [0, 0];
        const pt = svg.createSVGPoint();
        pt.x = evt.clientX; pt.y = evt.clientY;
        const q = pt.matrixTransform(m.inverse());
        return [q.x, -q.y];
      },
      poly(c, s, cls, attrs) {
        return svgEl('polygon', Object.assign({ points: s.map(p => P(p).join(',')).join(' '), class: cls || '' }, attrs || {}), cal(c));
      },
      ligne(c, a, b, cls, attrs) {
        const [x1, y1] = P(a), [x2, y2] = P(b);
        return svgEl('line', Object.assign({ x1, y1, x2, y2, class: cls || '' }, attrs || {}), cal(c));
      },
      cercle(c, p, r, cls, attrs) {
        const [cx, cy] = P(p);
        return svgEl('circle', Object.assign({ cx, cy, r, class: cls || '' }, attrs || {}), cal(c));
      },
      // rayon : trait + flèche au milieu (fleche 1 : de a vers b ; −1 : de b vers a ; 0 : sans flèche)
      rayon(c, a, b, o) {
        o = o || {};
        const g = svgEl('g', { class: 'opt-rayon ' + (o.cls || '') }, cal(c));
        const att = {};
        if (o.couleur) att.stroke = o.couleur;
        if (o.largeur) att['stroke-width'] = o.largeur;
        if (o.opacite != null) att['stroke-opacity'] = o.opacite;
        S.ligne(g, a, b, 'opt-rayon-trait', att);
        if (o.fleche) {
          const m = V.mul(V.add(a, b), 0.5), d = V.norm(V.mul(V.sub(b, a), o.fleche)), q = V.perp(d), k = o.tailleFleche || 9;
          const pts = [V.add(m, V.mul(d, k * 0.7)), V.add(V.sub(m, V.mul(d, k * 0.6)), V.mul(q, k * 0.6)), V.sub(V.sub(m, V.mul(d, k * 0.6)), V.mul(q, k * 0.6))];
          const f = S.poly(g, pts, 'opt-rayon-fleche');
          if (o.couleur) f.setAttribute('fill', o.couleur);
        }
        return g;
      },
      // arc de cercle de centre C, de la direction a1 à la direction a2 (le plus court), rayon r
      arc(c, C, a1, a2, r, cls) {
        const d = ecart(a2, a1);
        const A = V.add(C, V.mul(V.dir(a1), r)), B = V.add(C, V.mul(V.dir(a1 + d), r));
        const [x1, y1] = P(A), [x2, y2] = P(B);
        // en SVG (y vers le bas), un angle croissant en math tourne dans le sens négatif
        return svgEl('path', { d: `M${x1} ${y1} A${r} ${r} 0 0 ${d > 0 ? 0 : 1} ${x2} ${y2}`, class: cls || 'opt-arc' }, cal(c));
      },
      angleDroit(c, C, a1, a2, cote, cls) {
        cote = cote || 12;
        const u = V.mul(V.dir(a1), cote), v = V.mul(V.dir(a2), cote);
        const pts = [V.add(C, u), V.add(C, V.add(u, v)), V.add(C, v)].map(p => P(p).join(',')).join(' ');
        return svgEl('polyline', { points: pts, class: cls || 'opt-droit' }, cal(c));
      },
      texte(c, p, html, o) {
        o = o || {};
        const [x, y] = P(p);
        const t = svgEl('text', { x, y, class: 'opt-texte ' + (o.cls || ''), 'text-anchor': o.ancre || 'middle', 'dominant-baseline': 'central' }, cal(c));
        if (o.taille) t.style.fontSize = o.taille + 'px';        // style : l'emporte sur la classe
        if (o.couleur) t.setAttribute('fill', o.couleur);
        svgTexte(t, html);
        return t;
      },
      // texte sur un fond blanc arrondi (étiquette posée)
      etiquette(c, p, html, o) {
        o = o || {};
        const g = svgEl('g', { class: 'opt-etiq ' + (o.cls || '') }, cal(c));
        const r = svgEl('rect', { class: 'opt-etiq-fond', rx: 7, ry: 7 }, g);
        const t = S.texte(g, p, html, { ancre: o.ancre, taille: o.taille, cls: 'opt-etiq-txt' });
        // dimension du fond d'après le texte (après insertion dans la page)
        try {
          const b = t.getBBox();
          if (b.width) {
            r.setAttribute('x', b.x - 5); r.setAttribute('y', b.y - 2); r.setAttribute('width', b.width + 10); r.setAttribute('height', b.height + 4);
            // l'étiquette reste entière dans la figure
            const m = 2, dx = Math.max(0, -hw + m - (b.x - 5)) - Math.max(0, b.x + b.width + 5 - (hw - m));
            const dy = Math.max(0, -hh + m - (b.y - 2)) - Math.max(0, b.y + b.height + 2 - (hh - m));
            if (dx || dy) g.setAttribute('transform', `translate(${dx} ${dy})`);
          } else r.remove();
        } catch (e) { r.remove(); }
        return g;
      },
      // rapporteur gradué de centre C, rayon r ; graduations en degrés depuis la direction zero
      rapporteur(c, C, r, o) {
        o = o || {};
        const g = svgEl('g', { class: 'opt-rapporteur' }, cal(c));
        const zero = o.zero != null ? o.zero : 90;
        S.cercle(g, C, r, 'opt-rap-cercle');
        for (let a = 0; a < 360; a++) {
          const k = a % 10 === 0 ? 12 : a % 5 === 0 ? 8 : 4;
          const d = V.dir(zero + a);
          S.ligne(g, V.add(C, V.mul(d, r)), V.add(C, V.mul(d, r - k)), a % 10 === 0 ? 'opt-rap-g10' : 'opt-rap-g');
        }
        // nombres : de 0 à 90 de part et d'autre de la direction zero et de son opposée
        for (let a = 0; a < 360; a += 10) {
          const v = a <= 90 ? a : a <= 180 ? 180 - a : a <= 270 ? a - 180 : 360 - a;
          S.texte(g, V.add(C, V.mul(V.dir(zero + a), r - 21)), String(v), { cls: 'opt-rap-n', taille: o.taille || 10 });
        }
        return g;
      },
      milieu(m) {
        const cls = 'opt-milieu opt-fond-' + (m.fond || 'feuille');
        const p = S.poly('milieux', m.sommets, cls);
        if (m.etiquette) S.texte('milieux', m.etiquette, m.nom, { cls: 'opt-milieu-nom' });
        return p;
      },
      plusProche(evt, cibles, seuilPx) {
        const p = S.point(evt), k = S.echelle();
        let best = null;
        cibles.forEach(c => {
          let d;
          if (c.zone) d = c.zone(p) ? 0 : Infinity;
          else if (c.a) d = distSegment(p, c.a, c.b) * k;
          else d = V.len(V.sub(p, c.p)) * k;
          // une zone (milieu) ne l'emporte que si aucun point ni trait n'est sous le doigt
          if (c.zone && d === 0) d = (seuilPx || 30) * 0.99;
          if (d <= (seuilPx || 30) && (!best || d < best.d)) best = { d, c };
        });
        return best ? best.c : null;
      },
      surRedim(fn) { redims.push(fn); },
      maj(etat) {
        S.vider('rayons');
        ((etat && etat.rayons) || opts.rayons || []).forEach(r => S.rayon('rayons', r.a, r.b, r));
      },
    };
    // largeur affichée qui change : poignées et cibles gardent 44 px
    let largeur = 0;
    const verifier = () => { const w = svg.getBoundingClientRect().width; if (w && Math.abs(w - largeur) > 1) { largeur = w; redims.forEach(f => f()); } };
    if (window.ResizeObserver) new ResizeObserver(verifier).observe(svg);
    else addEventListener('resize', verifier);

    // milieux et dioptre décrits dans les options
    (opts.milieux || []).forEach(m => S.milieu(m));
    if (opts.dioptre && opts.dioptre.I) {
      S.I = opts.dioptre.I;
      S.normale = (opts.dioptre.angle || 0) + 90;
    }
    if (opts.rayons) S.maj();
    return S;
  }

  /* ============================================================
     ÉLÉMENTS MANIPULABLES
     ============================================================ */
  // Poignée qui tourne autour d'un centre (glisser) ; les flèches s'ajoutent avec OPT.fleches
  function pivot(S, o) {
    let angle = o.angle || 0, verrou = false;
    const g = svgEl('g', { class: 'opt-poignee', tabindex: '0', role: 'slider', 'aria-label': o.aria || 'Poignée à faire tourner' }, S.calque('poignees'));
    const zoneT = svgEl('circle', { class: 'opt-poignee-zone' }, g);
    const point = svgEl('circle', { class: 'opt-poignee-point' }, g);
    const contraindre = o.contraindre || (a => a);
    function placer() {
      const p = V.add(o.centre, V.mul(V.dir(angle), o.rayon));
      [zoneT, point].forEach(c => { c.setAttribute('cx', p[0]); c.setAttribute('cy', -p[1]); });
      zoneT.setAttribute('r', S.u(24));
      point.setAttribute('r', Math.max(S.u(9), 6));
      g.setAttribute('aria-valuenow', Math.round(angle));
    }
    function regler(a, fin) {
      angle = contraindre(a);
      placer();
      if (o.surChange) o.surChange(angle);
      if (fin && o.surFin) o.surFin(angle);
    }
    let id = null;
    // au doigt : la page ne défile pas quand on saisit la poignée (touch-action n'agit pas partout dans un SVG)
    g.addEventListener('touchstart', e => { if (!verrou && e.cancelable) e.preventDefault(); }, { passive: false });
    g.addEventListener('pointerdown', e => {
      if (verrou) return;
      id = e.pointerId;
      try { g.setPointerCapture(id); } catch (er) { /* ignoré */ }
      g.classList.add('opt-saisie');
      e.preventDefault(); e.stopPropagation();
    });
    // angle de la poignée sous le pointeur
    function suivre(e) {
      const p = S.point(e), v = V.sub(p, o.centre);
      if (V.len(v) < 1) return;
      let a = V.angle(v);
      if (o.pas) a = Math.round(a / o.pas) * o.pas;
      // continuité autour de ±180°
      a = angle + ecart(a, angle);
      regler(a);
    }
    g.addEventListener('pointermove', e => { if (e.pointerId === id) suivre(e); });
    const finir = e => {
      if (e.pointerId !== id) return;
      // le dernier déplacement peut arriver seulement avec le relâchement
      if (e.type === 'pointerup') suivre(e);
      id = null; g.classList.remove('opt-saisie');
      if (o.surFin) o.surFin(angle);
    };
    g.addEventListener('pointerup', finir);
    g.addEventListener('pointercancel', finir);
    g.addEventListener('click', e => e.stopPropagation());
    g.addEventListener('keydown', e => {
      if (verrou) return;
      const k = { ArrowLeft: 1, ArrowUp: 1, ArrowRight: -1, ArrowDown: -1 }[e.key];
      if (k) { e.preventDefault(); regler(angle + k * (o.pas || 1), true); }
    });
    S.surRedim(placer);
    placer();
    return {
      el: g,
      angle: () => angle,
      regler: a => regler(a, true),
      verrouiller() { verrou = true; g.classList.add('opt-verrou'); },
      deverrouiller() { verrou = false; g.classList.remove('opt-verrou'); },
      masquer(oui) { g.style.display = oui ? 'none' : ''; },
    };
  }

  // Boutons fléchés (58 × 50 px) : complément du glisser au doigt fin
  function fleches(conteneur, o) {
    const sym = o.symboles || ['◀', '▶'], aria = o.aria || ['Moins', 'Plus'];
    const box = document.createElement('div');
    box.className = 'opt-fleches';
    [[sym[0], aria[0], o.moins], [sym[1], aria[1], o.plus]].forEach(([s, a, f]) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'btn-secondary opt-fl'; b.textContent = s; b.setAttribute('aria-label', a);
      b.onclick = () => { if (!b.disabled) f(); };
      box.appendChild(b);
    });
    conteneur.appendChild(box);
    return { el: box, activer(oui) { box.querySelectorAll('button').forEach(b => { b.disabled = !oui; }); } };
  }

  // Appui bref sur un élément (souris ou doigt), sans attendre l'événement click : deux appuis
  // rapprochés au même endroit comptent pour deux (pas de double-appui avalé par le navigateur)
  function surAppui(el, fn) {
    let d = null;
    el.addEventListener('pointerdown', e => { d = { x: e.clientX, y: e.clientY, t: Date.now(), id: e.pointerId }; });
    el.addEventListener('pointerup', e => {
      if (!d || e.pointerId !== d.id) return;
      const ok = Math.hypot(e.clientX - d.x, e.clientY - d.y) < 12 && Date.now() - d.t < 800;
      d = null;
      if (ok) fn(e);
    });
    el.addEventListener('pointercancel', () => { d = null; });
  }

  // Point à toucher : zone sensible de 44 px de diamètre au moins
  function cible(S, p, surToucher) {
    const c = svgEl('circle', { class: 'opt-cible', cx: p[0], cy: -p[1] }, S.calque('cibles'));
    const placer = () => c.setAttribute('r', S.u(22));
    S.surRedim(placer); placer();
    c.addEventListener('click', e => { e.stopPropagation(); surToucher(e); });
    return { el: c, retirer() { c.remove(); } };
  }

  // Étiquettes à déposer sur la figure : glisser, ou toucher l'étiquette puis toucher la cible
  function etiquettes(S, bac, o) {
    let choisie = null;
    const puces = {};
    const seuil = o.seuilPx || 34;
    function choisir(id) {
      choisie = id;
      Object.keys(puces).forEach(k => puces[k].classList.toggle('opt-choisie', k === id));
      S.svg.classList.toggle('opt-attente', !!id);
      if (o.surSelection) o.surSelection(id);
    }
    function deposer(id, evt) {
      const c = S.plusProche(evt, o.cibles(), seuil);
      choisir(null);
      if (!c) return false;
      const ok = o.surDepot(id, c, evt);
      if (ok) puces[id].hidden = true;
      return ok;
    }
    o.items.forEach(it => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'opt-puce'; b.innerHTML = it.html; b.dataset.id = it.id;
      bac.appendChild(b);
      puces[it.id] = b;
      if (window.DragDrop) {
        DragDrop.enable(b, {
          zoneSelector: '.opt-svg',
          onDrop(item, zone, evt) {
            if (zone === S.svg) { deposer(it.id, evt); return; }
            // simple appui sur l'étiquette (sans glisser) : elle est choisie, il reste à toucher la cible
            const r = b.getBoundingClientRect();
            if (evt.clientX >= r.left && evt.clientX <= r.right && evt.clientY >= r.top && evt.clientY <= r.bottom) choisir(choisie === it.id ? null : it.id);
          },
        });
      } else b.onclick = () => choisir(choisie === it.id ? null : it.id);
    });
    // deuxième appui : sur la figure
    S.svg.addEventListener('click', e => {
      if (!choisie) return;
      e.stopImmediatePropagation();
      deposer(choisie, e);
    }, true);
    return {
      retirer(id) { if (puces[id]) puces[id].hidden = true; },
      remettre(id) { if (puces[id]) puces[id].hidden = false; },
      selection: () => choisie,
      annuler() { choisir(null); },
      vider() { choisir(null); Object.keys(puces).forEach(k => puces[k].remove()); },
    };
  }

  window.OPT = {
    V, ecart, refracter, reflechir, limite, devier, tracer, dansPolygone, demiPlan, demiDisque, distSegment,
    scene, pivot, fleches, cible, etiquettes, surAppui, svgTexte, svgEl,
  };
})();
