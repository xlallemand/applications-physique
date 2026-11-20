/* ============================================================
   Banc d'optique — moteur optique (objet global BO_OPT)
   Optique géométrique paraxiale, sans aucun dessin.

   Unités : centimètres. x : abscisse le long du banc (la lumière part de la
   lampe vers les x croissants) ; y : hauteur au-dessus de l'axe optique ;
   u : pente du rayon (dy par cm parcouru dans le sens de propagation).

   Composants (données de l'application) :
     { id, type: 'lampe' | 'cv' | 'dv' | 'plan' | 'concave' | 'convexe' | 'ecran',
       x, f (focale en cm, négative pour une divergente ; miroirs : valeur positive), D (diamètre), AB (lampe),
       retire (écran retiré du faisceau) }
   Éléments optiques (déduits des composants, voir elements()) :
     { x, k: 'plaque' | 'lentille' | 'miroir' | 'ecran', f, D, c (composant), decale }
     – la lampe donne la PLAQUE (l'objet) : elle reçoit la lumière qui revient vers la lanterne ;
     – miroir concave : focale f ; miroir convexe : focale −f (il fait diverger la lumière) ;
     – un écran placé entre la lampe et un miroir est « décalé » (petit écran hors de l'axe) :
       il laisse passer la lumière à l'aller et reçoit celle qui revient.

   Tracé d'un rayon : propagation en ligne droite, lentille mince u ← u − y/f,
   miroir : demi-tour (un miroir courbe agit en plus comme une lentille de focale f ou −f).
   Une monture (|y| > D/2) arrête le rayon ; un écran, la plaque ou la rétine le reçoivent.

   API :
     BO_OPT.elements(comps)               éléments optiques
     BO_OPT.tracer(els, x0, y, u, o)      → { pts: [[x, y]…], fin: élément | 'monture' | null, y, u, sens }
                                             o = { xMin, xMax, sansMonture }
     BO_OPT.analyser(comps, L)            → { els, lampe, cibles: [cible] }
        cible = { el, comp, lumiere, m, c0, w, T, nette, delta }
          m : grandissement (lettre vue sur l'écran), c0 : décalage de l'image de A,
          w : diamètre de la tache d'un point (flou), T : part de la lumière reçue,
          nette : image nette, delta : déplacement de l'écran (en x) qui la rendrait nette
     BO_OPT.faisceau(els, lampe, L)       enveloppes du faisceau : [{ sens, tr: [[x, ymin, ymax]…] }]
     BO_OPT.rayons(els, lampe, L)         rayons particuliers issus de B : [{ h, pts }]
   ============================================================ */
(function () {
  'use strict';

  const CONE = 0.25;                    // demi-ouverture (pente) du cône d'éclairage de la lanterne
  const N_PENTES = 241;                 // rayons par point de l'objet pour les images
  const PENTES = Array.from({ length: N_PENTES }, (_, i) => -CONE + 2 * CONE * i / (N_PENTES - 1));
  const PENTES_F = Array.from({ length: 121 }, (_, i) => -CONE + 2 * CONE * i / 120);   // faisceau
  const NET_W = 0.04;                   // tache ≤ 0,4 mm : image nette
  const NET_X = 0.06;                   // ou écran à moins de 0,6 mm du plan de l'image

  /* ---------- Éléments optiques ---------- */
  function elements(comps) {
    const lampe = comps.find(c => c.type === 'lampe');
    const miroirs = comps.filter(c => c.type === 'plan' || c.type === 'concave' || c.type === 'convexe');
    const els = [];
    for (const c of comps) {
      if (c.type === 'lampe') els.push({ x: c.x, k: 'plaque', c });
      else if (c.type === 'cv' || c.type === 'dv') els.push({ x: c.x, k: 'lentille', f: c.f, D: c.D, c });
      else if (c.type === 'plan') els.push({ x: c.x, k: 'miroir', f: Infinity, D: c.D, c });
      else if (c.type === 'concave') els.push({ x: c.x, k: 'miroir', f: c.f, D: c.D, c });
      else if (c.type === 'convexe') els.push({ x: c.x, k: 'miroir', f: -c.f, D: c.D, c });
      else if (c.type === 'ecran' && !c.retire) {
        // écran entre la lampe et un miroir : décalé, il ne coupe pas la lumière à l'aller
        const decale = !!lampe && lampe.x < c.x && miroirs.some(m => m.x > c.x);
        els.push({ x: c.x, k: 'ecran', c, decale });
      }
    }
    return els;
  }

  /* ---------- Tracé d'un rayon ---------- */
  function tracer(els, x0, y, u, o) {
    o = o || {};
    const xMin = o.xMin == null ? -1e4 : o.xMin, xMax = o.xMax == null ? 1e4 : o.xMax;
    let x = x0, sens = 1;
    const pts = [[x, y]];
    for (let n = 0; n < 24; n++) {
      // élément suivant dans le sens de propagation
      let suiv = null, dmin = Infinity;
      for (const e of els) {
        if (e.k === 'plaque' && sens > 0) continue;            // la lanterne n'arrête que la lumière qui revient
        if (e.k === 'ecran' && e.decale && sens > 0) continue; // écran décalé : transparent à l'aller
        const d = (e.x - x) * sens;
        if (d > 1e-9 && d < dmin) { dmin = d; suiv = e; }
      }
      if (!suiv) {
        const xb = sens > 0 ? xMax : xMin;
        if ((xb - x) * sens > 0) { y += u * (xb - x) * sens; x = xb; pts.push([x, y]); }
        return { pts, fin: null, y, u, sens };
      }
      y += u * dmin; x = suiv.x; pts.push([x, y]);
      if (suiv.k === 'ecran' || suiv.k === 'plaque') return { pts, fin: suiv, y, u, sens };
      if (!o.sansMonture && Math.abs(y) > suiv.D / 2) return { pts, fin: 'monture', el: suiv, y, u, sens };
      if (suiv.k === 'lentille') u -= y / suiv.f;
      else if (suiv.k === 'miroir') { if (isFinite(suiv.f)) u -= y / suiv.f; sens = -sens; }
    }
    return { pts, fin: null, y, u, sens };
  }

  // tache d'un point de l'objet (hauteur h) sur un élément récepteur
  function tache(els, x0, h, cible) {
    let min = Infinity, max = -Infinity, n = 0, sens = 1;
    for (const u of PENTES) {
      const r = tracer(els, x0, h, u);
      if (r.fin === cible) { if (r.y < min) min = r.y; if (r.y > max) max = r.y; n++; sens = r.sens; }
    }
    return n ? { min, max, c: (min + max) / 2, w: max - min, n, T: n / N_PENTES, sens } : null;
  }

  /* ---------- Images sur les écrans, la rétine et la plaque ---------- */
  function analyser(comps, L) {
    const els = elements(comps);
    const lampe = comps.find(c => c.type === 'lampe');
    const cibles = [];
    for (const e of els) {
      if (e.k !== 'ecran' && e.k !== 'plaque') continue;
      const ci = { el: e, comp: e.c, lumiere: false, nette: false, m: 0, c0: 0, w: 0, T: 0, delta: null };
      cibles.push(ci);
      if (!lampe) continue;
      const AB = lampe.AB;
      // trois points de l'objet : A (sur l'axe), milieu et B (haut de la lettre)
      const hs = [0, AB / 2, AB], ts = hs.map(h => tache(els, lampe.x, h, e));
      const ok = hs.map((h, i) => ({ h, t: ts[i] })).filter(p => p.t);
      if (!ok.length) continue;
      ci.lumiere = true;
      ci.T = ok[0].t.T;
      ci.w = Math.max(...ok.map(p => p.t.w));
      // grandissement : pente des centres des taches ; sinon, coefficient de la matrice de transfert
      const r1 = tracer(els, lampe.x, 1e-3, 0, { sansMonture: true });
      const mABCD = r1.fin === e ? r1.y / 1e-3 : 0;
      if (ok.length >= 2) { const a = ok[0], b = ok[ok.length - 1]; ci.m = (b.t.c - a.t.c) / (b.h - a.h); ci.c0 = a.t.c - ci.m * a.h; }
      else { ci.m = mABCD; ci.c0 = ok[0].t.c - ci.m * ok[0].h; }
      // plan de l'image : rayon issu de A, sans monture → y = B·u, pente D·u à l'arrivée
      const r2 = tracer(els, lampe.x, 0, 1e-3, { sansMonture: true });
      if (r2.fin === e && Math.abs(r2.u) > 1e-9) {
        const d = -r2.y / r2.u;                                // à parcourir dans le sens de propagation
        ci.delta = d * r2.sens;
      }
      ci.nette = ci.w <= NET_W || (ci.delta != null && Math.abs(ci.delta) <= NET_X);
    }
    return { els, lampe, cibles };
  }

  /* ---------- Faisceau lumineux : enveloppe des rayons issus de A, du milieu et de B ---------- */
  function faisceau(els, lampe, L) {
    if (!lampe) return [];
    const pas = 0.25, tranches = { 1: new Map(), '-1': new Map() };
    for (const h of [0, lampe.AB / 2, lampe.AB]) for (const u of PENTES_F) {
      const r = tracer(els, lampe.x, h, u, { xMin: 0, xMax: L });
      // un rayon arrêté par la première monture rencontrée ne fait pas partie du faisceau utile
      if (r.fin === 'monture' && r.pts.length <= 2) continue;
      let sens = 1;
      for (let i = 0; i + 1 < r.pts.length; i++) {
        const [xa, ya] = r.pts[i], [xb, yb] = r.pts[i + 1];
        if (xb === xa) continue;
        sens = xb > xa ? 1 : -1;
        const T = tranches[sens];
        const k0 = Math.ceil(Math.min(xa, xb) / pas - 1e-9), k1 = Math.floor(Math.max(xa, xb) / pas + 1e-9);
        for (let k = k0; k <= k1; k++) {
          const xx = k * pas, yy = ya + (yb - ya) * (xx - xa) / (xb - xa);
          const t = T.get(k);
          if (t) { if (yy < t[1]) t[1] = yy; if (yy > t[2]) t[2] = yy; } else T.set(k, [xx, yy, yy]);
        }
      }
    }
    const res = [];
    for (const s of [1, -1]) {
      const tr = [...tranches[s].values()].sort((a, b) => a[0] - b[0]);
      // morceaux continus (pas de trou de plus d'une tranche)
      let morceau = [];
      for (const t of tr) {
        if (morceau.length && t[0] - morceau[morceau.length - 1][0] > pas * 1.5) { res.push({ sens: s, tr: morceau }); morceau = []; }
        morceau.push(t);
      }
      if (morceau.length > 1) res.push({ sens: s, tr: morceau });
    }
    return res;
  }

  /* ---------- Rayons particuliers issus de B, par rapport au premier élément rencontré :
     parallèle à l'axe, passant par son centre, passant par son foyer objet (lentille).
     Ce sont des rayons de construction : les montures ne les arrêtent pas. ---------- */
  function rayons(els, lampe, L) {
    if (!lampe) return [];
    const devant = els.filter(e => e.k !== 'plaque' && e.x > lampe.x + 1e-9 && !(e.k === 'ecran' && e.decale)).sort((a, b) => a.x - b.x);
    const p = devant[0], d = p ? p.x - lampe.x : 20;
    const AB = lampe.AB, pentes = [0, -AB / d];
    if (p && p.k === 'lentille') {
      const xF = p.x - p.f;                                    // foyer objet du premier élément
      if (Math.abs(xF - lampe.x) > 0.5) pentes.push(AB / (lampe.x - xF));
    }
    return pentes.map(u => ({ h: AB, pts: tracer(els, lampe.x, AB, u, { xMin: 0, xMax: L, sansMonture: true }).pts }));
  }

  window.BO_OPT = { CONE, elements, tracer, tache, analyser, faisceau, rayons };
})();
