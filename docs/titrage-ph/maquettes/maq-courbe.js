/* ============================================================
   Maquettes : courbe pH = f(V), tableau de valeurs, outils de repérage
   (sera TITRAGE.courbe et TITRAGE.tableau dans assets/titrage.js)

   TPHM.courbe(zone, { xMax: 20, derivee: null | 'droite' | 'dessous' })
     → { el, svg, maj(mesures), afficherDerivee(b), donnees(), geo(), conv,
         couche(nom), surRedessin(fn), actif(b) }
     mesures = [[V en dixièmes de mL, pH]] ; repère redessiné à la taille du conteneur
     (une unité du SVG = un pixel : la géométrie des tangentes se fait « comme sur papier »).
   TPHM.tableau(zone, { horizontal }) → { maj(mesures) }   tableau en petit, dernière valeur visible
   TPHM.tangentes(courbe, o) : méthode des tangentes semi-automatique (5 étapes)
   TPHM.deriveeOutil(courbe, o) : extrémum de la dérivée
   ============================================================ */
(function () {
  'use strict';
  const NB = ' ';
  const fmt = (x, d) => TITRAGE.outils.fmt(x, d);
  const NS = 'http://www.w3.org/2000/svg';
  const mk = (tag, attrs, parent) => {
    const e = document.createElementNS(NS, tag);
    for (const a in attrs) e.setAttribute(a, attrs[a]);
    if (parent) parent.appendChild(e);
    return e;
  };

  /* ============================================================
     Repère et courbe
     ============================================================ */
  function courbe(zone, o) {
    o = Object.assign({ xMax: 20, derivee: null }, o || {});
    const el = document.createElement('div');
    el.className = 'ttr-courbe';
    el.innerHTML = `<svg role="img" aria-label="Courbe pH en fonction du volume versé"></svg>`;
    zone.appendChild(el);
    const svg = el.querySelector('svg');
    let mesures = [], derVisible = false, rappels = [];
    let G = null;          // géométrie courante
    const couches = {};

    // données triées : V (mL), pH ; spline monotone ; dérivée « Regressi »
    function donnees() {
      const m = mesures.slice().sort((a, b) => a[0] - b[0]);
      const V = m.map(x => x[0] / 10), P = m.map(x => x[1]);
      const D = TITRAGE.outils.derivee(V, P);
      return { V, P, D, s: V.length >= 2 ? TITRAGE.outils.monotone(V, P) : null };
    }

    function geo() {
      const W = Math.max(200, el.clientWidth), H = Math.max(160, el.clientHeight);
      const d = donnees();
      const vmax = Math.max(o.xMax, Math.ceil((d.V[d.V.length - 1] || 0) / 2) * 2);
      const droite = o.derivee === 'droite' && derVisible ? 46 : 14;
      const g = { W, H, xmin: 0, xmax: vmax, x0: 40, x1: W - droite, haut: [] };
      const bas = H - 30;
      if (o.derivee === 'dessous' && derVisible) {
        const hp = Math.round((bas - 12) * 0.58);
        g.haut = [{ y0: 12 + hp - 8, y1: 12, min: 0, max: 14 }, { y0: bas, y1: 12 + hp + 18, min: 0, max: 0 }];
      } else g.haut = [{ y0: bas, y1: 12, min: 0, max: 14 }];
      g.kx = (g.x1 - g.x0) / (g.xmax - g.xmin);
      g.X = v => g.x0 + (v - g.xmin) * g.kx;
      g.Xi = x => g.xmin + (x - g.x0) / g.kx;
      const p = g.haut[0];
      g.ky = (p.y0 - p.y1) / (p.max - p.min);
      g.Y = v => p.y0 - (v - p.min) * g.ky;
      g.Yi = y => p.min + (p.y0 - y) / g.ky;
      // échelle de la dérivée (à droite ou en dessous)
      if (derVisible && d.D.length) {
        const dmin = Math.min(0, ...d.D.filter(isFinite)), dmax = Math.max(0, ...d.D.filter(isFinite));
        const pas = pasGrad((dmax - dmin) || 1);
        const lo = Math.floor(dmin * 1.05 / pas) * pas, hi = Math.ceil(dmax * 1.05 / pas) * pas || pas;
        const q = o.derivee === 'dessous' ? g.haut[1] : g.haut[0];
        g.d = { min: lo, max: hi, pas, y0: q.y0, y1: q.y1 };
        g.kd = (q.y0 - q.y1) / (hi - lo);
        g.Yd = v => q.y0 - (v - lo) * g.kd;
        g.Ydi = y => lo + (q.y0 - y) / g.kd;
      }
      return g;
    }
    function pasGrad(etendue) {
      const brut = etendue / 6, p10 = Math.pow(10, Math.floor(Math.log10(brut)));
      return [1, 2, 5, 10].map(k => k * p10).find(k => k >= brut);
    }

    function dessiner() {
      G = geo();
      const g = G;
      svg.setAttribute('viewBox', `0 0 ${g.W} ${g.H}`);
      svg.innerHTML = '';
      const fond = mk('g', {}, svg);
      // quadrillage et axes du pH
      const p = g.haut[0];
      for (let v = 0; v <= g.xmax; v += 1) {
        mk('line', { class: 'ttr-grille', x1: g.X(v), x2: g.X(v), y1: p.y0, y2: p.y1, 'stroke-opacity': v % 2 ? .55 : 1 }, fond);
        if (v % 2 === 0) mk('text', { class: 'ttr-gradu', x: g.X(v), y: (g.haut[1] || p).y0 + 15, 'text-anchor': 'middle' }, fond).textContent = v;
      }
      for (let y = 0; y <= 14; y += 1) {
        mk('line', { class: 'ttr-grille', x1: g.x0, x2: g.x1, y1: g.Y(y), y2: g.Y(y), 'stroke-opacity': y % 2 ? .55 : 1 }, fond);
        if (y % 2 === 0) mk('text', { class: 'ttr-gradu', x: g.x0 - 6, y: g.Y(y) + 4, 'text-anchor': 'end' }, fond).textContent = y;
      }
      mk('line', { class: 'ttr-axe', x1: g.x0, x2: g.x1 + 6, y1: p.y0, y2: p.y0 }, fond);
      mk('line', { class: 'ttr-axe', x1: g.x0, x2: g.x0, y1: p.y0, y2: p.y1 - 6 }, fond);
      mk('path', { class: 'ttr-fleche', d: `M${g.x1 + 10} ${p.y0} l-7 -4 v8 z` }, fond);
      mk('path', { class: 'ttr-fleche', d: `M${g.x0} ${p.y1 - 10} l-4 7 h8 z` }, fond);
      mk('text', { class: 'ttr-axe-nom', x: g.x0 + 6, y: p.y1 + 2 }, fond).textContent = 'pH';
      mk('text', { class: 'ttr-axe-nom', x: g.x1, y: (g.haut[1] || p).y0 - 6, 'text-anchor': 'end' }, fond).textContent = 'V (mL)';

      // axe de la dérivée (à droite, ou repère du dessous)
      if (g.d) {
        const q = g.d;
        if (o.derivee === 'dessous') {
          for (let v = 0; v <= g.xmax; v += 1) mk('line', { class: 'ttr-grille', x1: g.X(v), x2: g.X(v), y1: q.y0, y2: q.y1, 'stroke-opacity': v % 2 ? .55 : 1 }, fond);
          for (let y = q.min; y <= q.max + 1e-9; y += q.pas) {
            mk('line', { class: 'ttr-grille', x1: g.x0, x2: g.x1, y1: g.Yd(y), y2: g.Yd(y) }, fond);
            mk('text', { class: 'ttr-gradu', x: g.x0 - 6, y: g.Yd(y) + 4, 'text-anchor': 'end' }, fond).textContent = fmt(+y.toPrecision(6));
          }
          mk('line', { class: 'ttr-axe', x1: g.x0, x2: g.x1 + 6, y1: g.Yd(0), y2: g.Yd(0) }, fond);
          mk('line', { class: 'ttr-axe', x1: g.x0, x2: g.x0, y1: q.y0, y2: q.y1 - 4 }, fond);
          mk('line', { class: 'ttr-axe', x1: g.x0, x2: g.x1, y1: q.y0, y2: q.y0, 'stroke-opacity': .25 }, fond);
          mk('text', { class: 'ttr-axe-nom', x: g.x0 + 6, y: q.y1 + 4 }, fond).textContent = 'dpH/dV (mL⁻¹)';
        } else {
          mk('line', { class: 'ttr-axe', x1: g.x1, x2: g.x1, y1: q.y0, y2: q.y1 - 4, stroke: 'var(--ink-2)' }, fond);
          for (let y = q.min; y <= q.max + 1e-9; y += q.pas) {
            mk('line', { class: 'ttr-axe', x1: g.x1, x2: g.x1 + 4, y1: g.Yd(y), y2: g.Yd(y) }, fond);
            mk('text', { class: 'ttr-gradu', x: g.x1 + 7, y: g.Yd(y) + 4 }, fond).textContent = fmt(+y.toPrecision(6));
          }
          mk('line', { class: 'ttr-der', x1: g.x0, x2: g.x1, y1: g.Yd(0), y2: g.Yd(0), 'stroke-width': 1, 'stroke-dasharray': '1 3' }, fond);
          mk('text', { class: 'ttr-axe-nom', x: g.x1 - 4, y: q.y1 + 2, 'text-anchor': 'end', fill: 'var(--ink-2)' }, fond).textContent = 'dpH/dV (mL⁻¹)';
        }
      }

      // découpe : rien ne dépasse du repère
      const clipId = 'ttr-clip-' + Math.random().toString(36).slice(2, 8);
      const defs = mk('defs', {}, svg);
      const cp = mk('clipPath', { id: clipId }, defs);
      mk('rect', { x: g.x0, y: 4, width: g.x1 - g.x0, height: (g.haut[1] || p).y0 - 4 }, cp);
      couches.donnees = mk('g', { 'clip-path': `url(#${clipId})` }, svg);
      couches.outils = mk('g', { 'clip-path': `url(#${clipId})` }, svg);
      couches.dessus = mk('g', {}, svg);
      const d = donnees();
      // courbe lissée (interpolation monotone) puis points
      if (d.s && d.V.length >= 2) {
        let path = '';
        const a = g.X(d.V[0]), b = g.X(d.V[d.V.length - 1]);
        for (let x = a; x <= b + 0.5; x += 2) { const v = g.Xi(Math.min(x, b)); path += (path ? 'L' : 'M') + x.toFixed(1) + ' ' + g.Y(d.s.f(v)).toFixed(1); }
        mk('path', { class: 'ttr-lisse', d: path }, couches.donnees);
      }
      d.V.forEach((v, i) => mk('circle', { class: 'ttr-pt', cx: g.X(v), cy: g.Y(d.P[i]), r: 2.8 }, couches.donnees));
      if (g.d) {
        let path = '';
        d.V.forEach((v, i) => { if (isFinite(d.D[i])) path += (path ? 'L' : 'M') + g.X(v).toFixed(1) + ' ' + g.Yd(d.D[i]).toFixed(1); });
        mk('path', { class: 'ttr-der', d: path }, couches.donnees);
        d.V.forEach((v, i) => { if (isFinite(d.D[i])) mk('circle', { class: 'ttr-pt-der', cx: g.X(v), cy: g.Yd(d.D[i]), r: 2.4 }, couches.donnees); });
      }
      rappels.forEach(f => f(G));
    }

    const ro = new ResizeObserver(() => dessiner());
    ro.observe(el);
    return {
      el, svg,
      maj(m) { mesures = m.slice(); dessiner(); },
      afficherDerivee(b) { derVisible = b; dessiner(); },
      derivee: () => derVisible,
      donnees, geo: () => G || geo(),
      couche: n => couches[n],
      surRedessin(f) { rappels.push(f); },
      actif(b) { el.classList.toggle('actif', b); },
      // position du pointeur en unités du SVG (= pixels du conteneur)
      point(ev) { const r = svg.getBoundingClientRect(); return { x: (ev.clientX - r.left) * (G.W / r.width), y: (ev.clientY - r.top) * (G.H / r.height) }; },
      mk,
    };
  }

  /* ============================================================
     Tableau de valeurs en petit
     ============================================================ */
  function tableau(zone, o) {
    o = o || {};
    const boite = document.createElement('div');
    boite.className = 'ttr-tab-boite';
    zone.appendChild(boite);
    function maj(mesures) {
      const m = mesures.slice().sort((a, b) => a[0] - b[0]);
      const dernier = mesures.length ? mesures[mesures.length - 1][0] : null;
      if (!m.length) { boite.innerHTML = `<p class="ttr-tab-vide">Aucune mesure</p>`; return; }
      if (o.horizontal) {
        boite.innerHTML = `<table class="ttr-tab ttr-tab-h"><tbody>
          <tr><th>V (mL)</th>${m.map(x => `<td class="${x[0] === dernier ? 'dernier' : ''}">${fmt(x[0] / 10)}</td>`).join('')}</tr>
          <tr><th>pH</th>${m.map(x => `<td class="${x[0] === dernier ? 'dernier' : ''}">${fmt(x[1], 2)}</td>`).join('')}</tr></tbody></table>`;
        const td = boite.querySelector('td.dernier');
        if (td) boite.scrollLeft = td.offsetLeft - boite.clientWidth + td.offsetWidth + 20;
      } else {
        boite.innerHTML = `<table class="ttr-tab"><thead><tr><th>V (mL)</th><th>pH</th></tr></thead><tbody>
          ${m.map(x => `<tr class="${x[0] === dernier ? 'dernier' : ''}"><td>${fmt(x[0] / 10)}</td><td>${fmt(x[1], 2)}</td></tr>`).join('')}</tbody></table>`;
        const tr = boite.querySelector('tr.dernier');
        if (tr) boite.scrollTop = tr.offsetTop - boite.clientHeight + tr.offsetHeight + 4;
      }
    }
    maj([]);
    return { el: boite, maj };
  }

  /* ============================================================
     Glisser une droite, une poignée (Pointer Events : souris, doigt, stylet)
     ============================================================ */
  function glisser(C, cible, debut, bouge, fin) {
    cible.addEventListener('pointerdown', ev => {
      if (ev.pointerType === 'mouse' && ev.button !== 0) return;
      if (!debut(C.point(ev), ev)) return;
      ev.preventDefault(); ev.stopPropagation();
      try { cible.setPointerCapture(ev.pointerId); } catch (e) { /* rien */ }
      const mv = e2 => { if (e2.pointerId === ev.pointerId) bouge(C.point(e2), e2); };
      const up = e2 => {
        if (e2.pointerId !== ev.pointerId) return;
        cible.removeEventListener('pointermove', mv); cible.removeEventListener('pointerup', up); cible.removeEventListener('pointercancel', up);
        fin && fin(C.point(e2), e2);
      };
      cible.addEventListener('pointermove', mv); cible.addEventListener('pointerup', up); cible.addEventListener('pointercancel', up);
    });
  }

  /* ============================================================
     Méthode des tangentes, semi-automatique
     o = { deplacement: 'direct' | 'poignee' | 'fleches', aimant: true, etapes: 'consigne' | 'liste',
           panneau: élément (consigne, boutons, champ), fini(veqEleve) }
     État gardé en coordonnées des données (V, pH) : un redimensionnement ne perd rien
     (parallèles et milieux se conservent par changement d'échelle des axes).
     ============================================================ */
  const CONSIGNES = [
    'Pose ton doigt (ou la souris) sur la courbe, sur l’arrondi avant le saut, et fais-le glisser : la tangente suit. Relâche quand elle touche bien l’arrondi.',
    'Fais glisser la parallèle jusqu’à ce qu’elle soit tangente à l’autre arrondi, puis « Valider la position ».',
    'Voici une perpendiculaire aux deux tangentes : fais-la glisser où tu veux. Son milieu est marqué.',
    'Fais glisser la troisième droite, parallèle aux deux tangentes, jusqu’au milieu de la perpendiculaire.',
    'E est le point d’équivalence. Lis son abscisse sur l’axe des V et écris V<sub>eq</sub>.',
  ];
  const TITRES = ['1re tangente sur l’arrondi', 'Parallèle tangente à l’autre arrondi', 'Perpendiculaire et son milieu', 'Parallèle passant par le milieu', 'Lire V<sub>eq</sub>'];

  function tangentes(C, o) {
    o = Object.assign({ deplacement: 'poignee', aimant: true, etapes: 'consigne' }, o || {});
    const P = o.panneau;
    let etape = 0;
    // état (données) : T1 = { v } (point de contact) ; d2, t, d3 : en fractions de d* (sans unité) pour survivre au redimensionnement
    const S = { v1: null, v1essai: null, d2: null, tA: null, d3: null, E: null };
    let erreurs2 = 0;

    P.innerHTML = `
      ${o.etapes === 'liste' ? `<ol class="tph-deroule">${TITRES.map(t => `<li>${t}</li>`).join('')}</ol>` : ''}
      <p class="tph-consigne" data-r="consigne"></p>
      <div class="tph-actions" data-r="boutons"></div>
      <div data-r="retour"></div>
      <div data-r="saisie"></div>`;
    const R = n => P.querySelector(`[data-r="${n}"]`);

    // ---------- géométrie en pixels ----------
    function geom() {
      const g = C.geo(), d = C.donnees();
      if (!d.s) return null;
      const f = v => d.s.f(v), df = v => d.s.df(v);
      // point de saut : pente la plus forte (en valeur absolue)
      let vJ = d.V[0], best = 0;
      for (let v = d.V[0]; v <= d.V[d.V.length - 1]; v += 0.02) { const s = Math.abs(df(v)); if (s > best) { best = s; vJ = v; } }
      return { g, d, f, df, vJ, dfMax: best };
    }
    function droiteT1(G, v) {
      const g = G.g;
      const Pp = { x: g.X(v), y: g.Y(G.f(v)) };
      let u = { x: g.kx, y: -G.df(v) * g.ky };
      const n0 = Math.hypot(u.x, u.y); u = { x: u.x / n0, y: u.y / n0 };
      const n = { x: -u.y, y: u.x };
      return { P: Pp, u, n };
    }
    // distance signée (pixels) des points de la courbe à T1, et position de la parallèle tangente à l'autre arrondi :
    // on cherche de l'autre côté du saut le point de la courbe le plus éloigné de T1
    function autreTangente(G, T, v1) {
      const g = G.g, dist = v => T.n.x * (g.X(v) - T.P.x) + T.n.y * (g.Y(G.f(v)) - T.P.y);
      const V = G.d.V, apres = (v1 != null ? v1 : S.v1) <= G.vJ;
      const a = apres ? G.vJ : V[0], b = apres ? V[V.length - 1] : G.vJ;
      let best = 0, vB = G.vJ;
      for (let v = a; v <= b; v += 0.01) { const s = dist(v); if (Math.abs(s) > Math.abs(best)) { best = s; vB = v; } }
      return { dEtoile: best || 1, v2: vB, dist };
    }
    // droite longue (tracée dans tout le repère)
    function trait(T, d, cls) {
      const L = 4000, cx = T.P.x + d * T.n.x, cy = T.P.y + d * T.n.y;
      return C.mk('line', { class: 'ttr-droite ' + (cls || ''), x1: cx - L * T.u.x, y1: cy - L * T.u.y, x2: cx + L * T.u.x, y2: cy + L * T.u.y });
    }
    // point de la droite (T, d) le plus proche du centre du repère, gardé à l'intérieur : place de la poignée
    function pointPoignee(G, T, d, bias) {
      const g = G.g, cx = T.P.x + d * T.n.x, cy = T.P.y + d * T.n.y;
      const mx = (g.x0 + g.x1) / 2 + (bias || 0), my = (g.haut[0].y0 + g.haut[0].y1) / 2;
      let t = (mx - cx) * T.u.x + (my - cy) * T.u.y;
      const pt = t2 => ({ x: cx + t2 * T.u.x, y: cy + t2 * T.u.y });
      const dedans = q => q.x > g.x0 + 12 && q.x < g.x1 - 12 && q.y > g.haut[0].y1 + 12 && q.y < g.haut[0].y0 - 12;
      for (let k = 0; k < 400 && !dedans(pt(t)); k++) t += (k % 2 ? 1 : -1) * k * 2;
      return pt(t);
    }
    function poignee(couche, q, nom) {
      const gr = C.mk('g', { 'data-poignee': nom }, couche);
      C.mk('circle', { class: 'ttr-poignee-zone', cx: q.x, cy: q.y, r: 24 }, gr);
      C.mk('circle', { class: 'ttr-poignee', cx: q.x, cy: q.y, r: 9 }, gr);
      return gr;
    }

    // ---------- rendu de tout ce qui est construit ----------
    function rendu() {
      const cO = C.couche('outils'), cD = C.couche('dessus');
      if (!cO) return;
      cO.innerHTML = ''; cD.querySelectorAll('[data-t]').forEach(x => x.remove());
      const G = geom();
      if (!G) return;
      const v1 = S.v1 != null ? S.v1 : S.v1essai;
      if (v1 == null) return;
      const T = droiteT1(G, v1);
      cO.appendChild(trait(T, 0, S.v1 == null ? 'essai' : ''));
      C.mk('circle', { class: 'ttr-milieu', cx: T.P.x, cy: T.P.y, r: 3.5 }, cO);
      if (S.v1 == null) return;
      const A = autreTangente(G, T), dE = A.dEtoile;
      if (S.d2 != null) {
        const d2 = S.d2 * dE;
        cO.appendChild(trait(T, d2, etape === 1 ? 'mobile' : ''));
        if (etape === 1) {
          const gp = C.mk('g', { 'data-t': 1 }, cD);
          if (o.deplacement !== 'direct') poignee(gp, pointPoignee(G, T, d2, 60), 'd2');
        }
      }
      if (S.tA != null) {
        // perpendiculaire : extrémités sur T1 et T2, milieu marqué
        const t = S.tA * Math.abs(dE);
        const A1 = { x: T.P.x + t * T.u.x, y: T.P.y + t * T.u.y };
        const B1 = { x: A1.x + dE * T.n.x, y: A1.y + dE * T.n.y };
        const M = { x: (A1.x + B1.x) / 2, y: (A1.y + B1.y) / 2 };
        C.mk('line', { class: 'ttr-perp', x1: A1.x, y1: A1.y, x2: B1.x, y2: B1.y }, cO);
        // petites marques de longueurs égales
        [[A1, M], [M, B1]].forEach(([a, b]) => {
          const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
          C.mk('line', { class: 'ttr-marque', x1: mx - 5 * T.u.x, y1: my - 5 * T.u.y, x2: mx + 5 * T.u.x, y2: my + 5 * T.u.y }, cO);
        });
        C.mk('circle', { class: 'ttr-milieu', cx: M.x, cy: M.y, r: 4 }, cO);
        // angle droit en A1
        const s = 8, c1 = { x: A1.x + s * T.u.x, y: A1.y + s * T.u.y }, c2 = { x: A1.x + s * Math.sign(dE) * T.n.x, y: A1.y + s * Math.sign(dE) * T.n.y };
        C.mk('path', { class: 'ttr-fin', d: `M${c1.x} ${c1.y} L${c1.x + c2.x - A1.x} ${c1.y + c2.y - A1.y} L${c2.x} ${c2.y}` }, cO);
        if (etape === 2 && o.deplacement !== 'direct') poignee(C.mk('g', { 'data-t': 1 }, cD), M, 'perp');
      }
      if (S.d3 != null) {
        const d3 = S.d3 * dE;
        cO.appendChild(trait(T, d3, etape === 3 ? 'mobile' : ''));
        if (etape === 3 && o.deplacement !== 'direct') poignee(C.mk('g', { 'data-t': 1 }, cD), pointPoignee(G, T, d3, -60), 'd3');
      }
      if (S.E != null) {
        const g = G.g, x = g.X(S.E), y = g.Y(G.f(S.E));
        C.mk('line', { class: 'ttr-lecture', x1: x, y1: y, x2: x, y2: g.haut[0].y0 }, cO);
        C.mk('circle', { class: 'ttr-E', cx: x, cy: y, r: 5.5, 'data-t': 1 }, cD);
        C.mk('text', { class: 'ttr-E-txt', x: x + 8, y: y - 8, 'data-t': 1 }, cD).textContent = 'E';
      }
    }
    C.surRedessin(() => rendu());

    // ---------- interactions ----------
    const svg = C.svg;
    let prise = null;   // ce qui est saisi : 't1', 'd2', 'perp', 'd3'
    function quoiSaisir(p) {
      const G = geom(); if (!G) return null;
      if (etape === 0) return 't1';
      const T = droiteT1(G, S.v1), A = autreTangente(G, T), dE = A.dEtoile;
      const distLigne = d => Math.abs(T.n.x * (p.x - T.P.x) + T.n.y * (p.y - T.P.y) - d);
      if (o.deplacement === 'direct') {
        if (etape === 1 && distLigne(S.d2 * dE) < 22) return 'd2';
        if (etape === 3 && distLigne(S.d3 * dE) < 22) return 'd3';
        if (etape === 2) {
          // près du segment perpendiculaire
          const t = S.tA * Math.abs(dE), along = (p.x - T.P.x) * T.u.x + (p.y - T.P.y) * T.u.y;
          const dn = T.n.x * (p.x - T.P.x) + T.n.y * (p.y - T.P.y);
          if (Math.abs(along - t) < 22 && dn * Math.sign(dE) > -22 && dn * Math.sign(dE) < Math.abs(dE) + 22) return 'perp';
        }
        return null;
      }
      return null;   // poignée : saisie par sa cible (data-poignee)
    }
    let depart = null;
    function commencer(p, ev) {
      if (etape > 3) return false;
      let q = null;
      const gp = ev.target.closest && ev.target.closest('[data-poignee]');
      if (gp) q = gp.getAttribute('data-poignee');
      else q = quoiSaisir(p);
      if (!q) return false;
      prise = q;
      const G = geom(), T = S.v1 != null ? droiteT1(G, S.v1) : null;
      depart = { p, d2: S.d2, tA: S.tA, d3: S.d3, T, dE: T ? autreTangente(G, T).dEtoile : 0 };
      if (q === 't1') { S.v1essai = C.geo().Xi(p.x); bornerT1(); rendu(); }
      return true;
    }
    function bornerT1() { const d = C.donnees(); S.v1essai = Math.max(d.V[0], Math.min(d.V[d.V.length - 1], S.v1essai)); }
    function deplacer(p) {
      if (!prise) return;
      if (prise === 't1') { S.v1essai = C.geo().Xi(p.x); bornerT1(); rendu(); return; }
      const { T, dE } = depart;
      const dn = (p.x - depart.p.x) * T.n.x + (p.y - depart.p.y) * T.n.y;     // déplacement perpendiculaire aux tangentes
      const du = (p.x - depart.p.x) * T.u.x + (p.y - depart.p.y) * T.u.y;     // déplacement le long des tangentes
      if (prise === 'd2') { S.d2 = depart.d2 + dn / dE; aimanter('d2', dE); }
      if (prise === 'perp') S.tA = depart.tA + du / Math.abs(dE);
      if (prise === 'd3') { S.d3 = depart.d3 + dn / dE; aimanter('d3', dE); }
      rendu();
    }
    function aimanter(cle, dE) {
      if (!o.aimant) return;
      const cible = cle === 'd2' ? 1 : 0.5, seuil = cle === 'd2' ? 6 : 8;
      if (Math.abs((S[cle] - cible) * dE) < seuil) S[cle] = cible;
    }
    function finir() {
      const q = prise; prise = null;
      if (q === 't1') poserT1();
      if (q === 'd3') verifierD3();
    }
    glisser(C, svg, commencer, deplacer, finir);

    // ---------- étapes ----------
    function poserT1() {
      const G = geom(); const v = S.v1essai;
      // inclinaison de la tangente à l'écran (degrés) : le saut est presque vertical, les plateaux presque horizontaux
      const angle = Math.atan(Math.abs(G.df(v)) * G.g.ky / G.g.kx) * 180 / Math.PI;
      const ret = R('retour');
      if (angle > 80) { S.v1essai = null; rendu(); TPHM.retour(ret, false, ' Tu es dans le saut de pH\u00a0: pose la tangente sur l\u2019arrondi, juste avant le saut.'); return; }
      if (Math.abs(v - G.vJ) > 3.5 || angle < 12) { S.v1essai = null; rendu(); TPHM.retour(ret, false, ' Rapproche-toi du saut\u00a0: la tangente doit toucher l\u2019arrondi, là où la courbe se courbe.'); return; }
      ret.innerHTML = '';
      S.v1 = v; S.v1essai = null; S.d2 = 1.45;
      aller(1);
    }
    function validerD2() {
      const G = geom(), T = droiteT1(G, S.v1), dE = autreTangente(G, T).dEtoile;
      const ecart = (S.d2 - 1) * Math.abs(dE);   // > 0 : trop loin ; < 0 : coupe la courbe
      const ret = R('retour');
      if (Math.abs(ecart) <= 3) { S.d2 = 1; erreurs2 = 0; ret.innerHTML = ''; S.tA = tPerpDefaut(G, T, dE); aller(2); return; }
      erreurs2++;
      TPHM.retour(ret, false, ecart < 0 ? ' Elle coupe la courbe : éloigne-la.' : ' Elle ne touche pas la courbe : rapproche-la.');
    }
    function tPerpDefaut(G, T, dE) {
      // la perpendiculaire passe d'abord près du saut
      const g = G.g, J = { x: g.X(G.vJ), y: g.Y(G.f(G.vJ)) };
      return ((J.x - T.P.x) * T.u.x + (J.y - T.P.y) * T.u.y) / Math.abs(dE);
    }
    function verifierD3() {
      const G = geom(), T = droiteT1(G, S.v1), A = autreTangente(G, T), dE = A.dEtoile;
      const ret = R('retour');
      if (Math.abs((S.d3 - 0.5) * dE) <= 3) {
        S.d3 = 0.5; ret.innerHTML = '';
        // E : intersection de la 3e droite avec la courbe, entre les deux points de contact
        const a = Math.min(S.v1, A.v2), b = Math.max(S.v1, A.v2), cible = dE / 2;
        let vE = null, prev = A.dist(a) - cible;
        for (let v = a + 0.005; v <= b; v += 0.005) { const s = A.dist(v) - cible; if (Math.sign(s) !== Math.sign(prev)) { vE = v; break; } prev = s; }
        S.E = vE != null ? vE : G.vJ;
        aller(4);
      } else TPHM.retour(ret, false, ' Amène-la jusqu’au milieu de la perpendiculaire (le point marqué).');
    }

    function aller(n) {
      etape = n;
      C.actif(n <= 3);
      const cons = R('consigne');
      cons.innerHTML = `<b>${n + 1}.</b> ${CONSIGNES[n]}`;
      P.querySelectorAll('.tph-deroule li').forEach((li, i) => { li.className = i < n ? 'fait' : i === n ? 'ici' : ''; });
      const bt = R('boutons');
      bt.innerHTML = '';
      const ajouter = (txt, cls, f) => { const b = document.createElement('button'); b.type = 'button'; b.className = cls; b.innerHTML = txt; b.addEventListener('click', f); bt.appendChild(b); return b; };
      if (o.deplacement === 'fleches' && (n === 1 || n === 2 || n === 3)) fleches(bt, n);
      if (n === 1) ajouter('Valider la position', 'btn-primary', validerD2);
      if (n === 2) ajouter('Continuer →', 'btn-primary', () => { S.d3 = 0.12; aller(3); });
      if (n >= 1) ajouter('Reprendre la 1re tangente', 'btn-small', () => { Object.assign(S, { v1: null, d2: null, tA: null, d3: null, E: null }); R('saisie').innerHTML = ''; aller(0); });
      if (n >= 1) ajouter('Tout effacer', 'btn-small', () => { Object.assign(S, { v1: null, d2: null, tA: null, d3: null, E: null }); R('saisie').innerHTML = ''; R('retour').innerHTML = ''; aller(0); });
      if (n === 4) saisieVeq();
      rendu();
      TPHM.defiler(cons);
    }
    // boutons fléchés : déplacent la droite (ou la perpendiculaire) d'un pixel, appui long = en continu
    function fleches(bt, n) {
      const d = document.createElement('span');
      d.className = 'tph-fleches';
      const G = geom(), T = droiteT1(G, S.v1), dE = autreTangente(G, T).dEtoile;
      const cle = n === 1 ? 'd2' : n === 3 ? 'd3' : 'tA';
      // sens d'affichage : vers le haut / le bas de l'écran pour les parallèles, gauche / droite pour la perpendiculaire
      const libs = n === 2 ? [['◀', -1], ['▶', 1]] : [['▲', -1], ['▼', 1]];
      libs.forEach(([lib, s]) => {
        const b = document.createElement('button');
        b.type = 'button'; b.className = 'btn-secondary'; b.textContent = lib;
        b.setAttribute('aria-label', n === 2 ? (s < 0 ? 'Vers la gauche' : 'Vers la droite') : (s < 0 ? 'Vers le haut' : 'Vers le bas'));
        let rep = null;
        const pas = () => {
          if (cle === 'tA') S.tA += s * Math.sign(T.u.x || 1) * 2 / Math.abs(dE);
          else {
            // un pixel vers le haut ou le bas de l'écran ; l'aimant n'agit pas quand on quitte la bonne position
            const sensEcran = Math.sign(T.n.y) || 1, avant = S[cle];
            S[cle] += s * sensEcran * 1 / dE;
            if (avant !== (cle === 'd2' ? 1 : 0.5)) aimanter(cle, dE);
          }
          rendu();
        };
        // appui long : la droite avance en continu, de plus en plus vite
        let t0 = 0, attente = null;
        const boucle = () => { const n = Date.now() - t0 > 1200 ? 3 : 1; for (let i = 0; i < n; i++) pas(); rep = setTimeout(boucle, 45); };
        b.addEventListener('pointerdown', ev => { ev.preventDefault(); pas(); t0 = Date.now(); attente = setTimeout(boucle, 320); });
        const stop = () => {
          clearTimeout(attente); attente = null;
          if (rep) clearTimeout(rep);
          if (rep !== null || t0) { rep = null; t0 = 0; if (cle === 'd3') verifierD3(); }
        };
        ['pointerup', 'pointerleave', 'pointercancel'].forEach(t => b.addEventListener(t, stop));
        b.addEventListener('click', ev => { if (ev.detail === 0) { pas(); if (cle === 'd3') verifierD3(); } });
        d.appendChild(b);
      });
      bt.appendChild(d);
    }
    function saisieVeq() {
      const z = R('saisie');
      z.innerHTML = `<div class="tph-valeur"><span class="tph-lab">V<sub>eq</sub> =</span><span data-r="ch"></span><span class="tph-unite">mL</span>
        <button type="button" class="btn-primary tph-btn" data-r="ok">Valider</button></div><div data-r="ret2"></div>`;
      const ch = TPHM.champ({ aria: 'Volume équivalent en mL', signe: false });
      z.querySelector('[data-r="ch"]').appendChild(ch.el);
      let err = 0;
      z.querySelector('[data-r="ok"]').addEventListener('click', () => {
        const v = ch.valeur(), r = z.querySelector('[data-r="ret2"]');
        if (!isFinite(v)) { r.innerHTML = `<p class="tph-petit">Écris un nombre (avec une virgule si besoin).</p>`; return; }
        if (Math.abs(v - S.E) <= 0.1 + 1e-9) {
          ch.desactiver(true);
          TPHM.retour(r, err ? 'apres' : true, ` E a pour abscisse V<sub>eq</sub> ≈ ${fmt(S.E, 1)} mL. C'est la valeur retenue pour la suite.`);
          o.fini && o.fini(v);
        } else {
          err++;
          TPHM.retour(r, false, ` Lis l'abscisse du point E, au pied du trait en pointillés (au dixième de mL).` +
            (err >= 2 ? ` <button type="button" class="btn-small" data-r="rep">Afficher la réponse</button>` : ''));
          const rep = r.querySelector('[data-r="rep"]');
          if (rep) rep.addEventListener('click', () => { ch.input.value = fmt(S.E, 1); ch.desactiver(true); r.innerHTML = `<div class="callout tph-retour"><b>Réponse.</b> V<sub>eq</sub> ≈ ${fmt(S.E, 1)} mL.</div>`; o.fini && o.fini(+S.E.toFixed(1)); });
        }
      });
    }
    aller(0);
    // pour les tests automatiques : état et géométrie
    C.el.__tph = { S, etape: () => etape, info() { const G = geom(), T = droiteT1(G, S.v1 != null ? S.v1 : G.vJ - 1), A = autreTangente(G, T); return { T, dE: A.dEtoile, vJ: G.vJ, X: G.g.X, Y: G.g.Y, f: G.f }; } };
    return { recommencer: () => aller(0) };
  }

  /* ============================================================
     Courbe dérivée : extrémum
     o = { pointer: 'toucher' | 'reticule', panneau, fini(veq) }
     ============================================================ */
  function deriveeOutil(C, o) {
    o = Object.assign({ pointer: 'toucher' }, o || {});
    const P = o.panneau;
    P.innerHTML = `<p class="tph-consigne" data-r="consigne"><b>1.</b> Trace la dérivée dpH/dV, calculée comme dans Regressi.</p>
      <div class="tph-actions" data-r="boutons"><button type="button" class="btn-primary tph-btn" data-r="tracer">Tracer la dérivée dpH/dV</button></div>
      <div data-r="retour"></div><div data-r="saisie"></div><p class="tph-petit" data-r="remarque" hidden></p>`;
    const R = n => P.querySelector(`[data-r="${n}"]`);
    let etape = 0, vTrait = null, kMin = -1;
    function rendu() {
      const cD = C.couche('dessus'), cO = C.couche('outils');
      if (!cD) return;
      cO.innerHTML = ''; cD.querySelectorAll('[data-t]').forEach(x => x.remove());
      if (vTrait == null) return;
      const g = C.geo(), x = g.X(vTrait), yb = (g.haut[1] || g.haut[0]).y0;
      C.mk('line', { class: 'ttr-lecture', x1: x, x2: x, y1: g.haut[0].y1, y2: yb }, cO);
      if (o.pointer === 'reticule') {
        // réticule : trait vertical à glisser, lecture des coordonnées (comme le réticule libre de Regressi)
        const gr = C.mk('g', { 'data-t': 1, 'data-poignee': 'ret' }, cD);
        C.mk('rect', { class: 'ttr-poignee-zone', x: x - 22, y: g.haut[0].y1, width: 44, height: yb - g.haut[0].y1 }, gr);
        C.mk('circle', { class: 'ttr-poignee', cx: x, cy: yb - 14, r: 9 }, gr);
        const d = C.donnees();
        const vy = d.s ? d.s.f(vTrait) : 0;
        const txt = `V = ${fmt(vTrait, 2)} mL`;
        const lx = Math.min(x + 10, g.x1 - 120);
        C.mk('rect', { class: 'ttr-bulle-fond', x: lx, y: g.haut[0].y1 + 4, width: 112, height: 22, rx: 6, 'data-t': 1 }, cD);
        C.mk('text', { class: 'ttr-bulle-txt', x: lx + 8, y: g.haut[0].y1 + 19, 'data-t': 1 }, cD).textContent = txt;
      } else if (kMin >= 0) {
        const d = C.donnees(), k = d.V.indexOf(vTrait);
        if (k >= 0 && g.Yd) C.mk('circle', { class: 'ttr-E', cx: x, cy: g.Yd(d.D[k]), r: 5, 'data-t': 1 }, cD);
      }
    }
    C.surRedessin(rendu);
    R('tracer').addEventListener('click', () => {
      C.afficherDerivee(true);
      const d = C.donnees();
      kMin = TITRAGE.outils.extremum(d.V, d.D, -1);
      etape = 1;
      R('boutons').innerHTML = '';
      if (o.pointer === 'reticule') {
        vTrait = d.V[0] + (d.V[d.V.length - 1] - d.V[0]) * 0.25;
        R('consigne').innerHTML = `<b>2.</b> Fais glisser le réticule jusqu'à l'extrémum de la courbe dérivée, lis V et écris V<sub>eq</sub>.`;
        C.actif(true);
        saisie();
      } else {
        R('consigne').innerHTML = `<b>2.</b> Touche l'extrémum de la courbe dérivée.`;
        C.actif(true);
      }
      rendu();
    });
    // pointer : toucher (aimanté au point le plus proche) ou glisser le réticule
    glisser(C, C.svg, (p, ev) => {
      if (etape !== 1) return false;
      return true;   // réticule : un appui n'importe où le déplace ; toucher : on pointe
    }, p => {
      if (o.pointer === 'reticule') { const g = C.geo(), d = C.donnees(); vTrait = Math.max(d.V[0], Math.min(d.V[d.V.length - 1], g.Xi(p.x))); rendu(); }
    }, p => {
      if (o.pointer === 'reticule') return;
      const g = C.geo(), d = C.donnees(), v = g.Xi(p.x);
      let k = 0; d.V.forEach((x, i) => { if (Math.abs(x - v) < Math.abs(d.V[k] - v)) k = i; });
      vTrait = d.V[k];
      rendu();
      const ret = R('retour');
      if (Math.abs(k - kMin) <= 0) {
        ret.innerHTML = '';
        R('consigne').innerHTML = `<b>3.</b> Le trait passe par le minimum de la dérivée. Lis V sur l'axe et écris V<sub>eq</sub>.`;
        saisie();
      } else {
        TPHM.retour(ret, false, ` Le volume équivalent est à l'extrémum de la dérivée : ici le pH diminue, la dérivée est négative, cherche son <b>minimum</b>.`);
      }
    });
    function saisie() {
      const z = R('saisie');
      if (z.innerHTML) return;
      z.innerHTML = `<div class="tph-valeur"><span class="tph-lab">V<sub>eq</sub> =</span><span data-r="ch"></span><span class="tph-unite">mL</span>
        <button type="button" class="btn-primary tph-btn" data-r="ok">Valider</button></div><div data-r="ret2"></div>`;
      const ch = TPHM.champ({ aria: 'Volume équivalent en mL', signe: false });
      z.querySelector('[data-r="ch"]').appendChild(ch.el);
      let err = 0;
      z.querySelector('[data-r="ok"]').addEventListener('click', () => {
        const d = C.donnees(), vMin = d.V[kMin], v = ch.valeur(), r = z.querySelector('[data-r="ret2"]');
        if (!isFinite(v)) { r.innerHTML = `<p class="tph-petit">Écris un nombre (avec une virgule si besoin).</p>`; return; }
        if (Math.abs(v - vMin) <= 0.1 + 1e-9) {
          ch.desactiver(true); etape = 2; C.actif(false);
          TPHM.retour(r, err ? 'apres' : true, ` Le minimum de la dérivée est à V = ${fmt(vMin)} mL.`);
          // précision : pas des mesures près du saut
          const pas = Math.min(d.V[kMin + 1] - d.V[kMin], d.V[kMin] - d.V[kMin - 1] || 99);
          const rq = R('remarque');
          rq.hidden = false;
          rq.innerHTML = `Remarque${NB}: la précision dépend du pas des mesures près du saut. Pas de 1 mL${NB}: V<sub>eq</sub> connu à ± 0,5 mL environ${NB}; pas de 0,2 mL${NB}: à ± 0,1 mL. Ici, le pas est de ${fmt(+pas.toFixed(1))} mL.`;
          o.fini && o.fini(v);
        } else {
          err++;
          const pres = Math.abs(v - vMin) > 0.8 && d.D[d.V.findIndex(x => Math.abs(x - v) < 0.15)] > 0;
          TPHM.retour(r, false, pres ? ` Ce point n'est pas un minimum : ici la dérivée est négative, cherche son <b>minimum</b>.` : ` Lis l'abscisse du minimum de la dérivée (au dixième de mL).`);
        }
      });
    }
  }

  Object.assign(window.TPHM, { courbe, tableau, tangentes, deriveeOutil });
})();
