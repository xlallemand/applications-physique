/* ============================================================
   Maquette du dessin d'en-tête « circuit » (à ajouter ensuite dans assets/hero.js)
   Schéma normalisé en traits fins (générateur, résistances, ampèremètre,
   voltmètre en dérivation, nœuds), et à côté le même circuit recopié sur une
   table avec des fils souples ; des points lumineux circulent lentement le
   long de la boucle. Parallaxe comme les autres en-têtes.
   Avec prefers-reduced-motion : image fixe, sans mouvement.
   Seule différence avec les dessins existants : une petite boucle d'animation
   (les points), qui ne tourne que lorsque l'en-tête est visible.
   ============================================================ */
(function () {
  'use strict';
  const F = 0.4;
  const reduit = matchMedia('(prefers-reduced-motion: reduce)').matches;

  function trait(ctx, x1, y1, x2, y2) { ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); }

  // longueur et point à l'abscisse s d'une ligne brisée
  function ligne(pts) {
    const seg = []; let L = 0;
    for (let i = 1; i < pts.length; i++) { const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(l); L += l; }
    return { L, at(s) {
      s = ((s % L) + L) % L;
      for (let i = 0; i < seg.length; i++) {
        if (s <= seg[i]) { const k = s / seg[i]; return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * k, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * k]; }
        s -= seg[i];
      }
      return pts[pts.length - 1];
    } };
  }
  // points d'une courbe de Bézier (fil souple)
  function bezier(a, c1, c2, b, n) {
    const l = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n, u = 1 - t;
      l.push([u * u * u * a[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * b[0],
              u * u * u * a[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * b[1]]);
    }
    return l;
  }

  // dessin fixe ; renvoie les deux boucles que suivent les points lumineux
  function circuit(ctx, w, h, c) {
    const hb = h / (1 + F);                         // hauteur visible de l'en-tête
    const p = 26;
    ctx.strokeStyle = c; ctx.fillStyle = c; ctx.lineWidth = 1;
    for (let x = 0, i = 0; x <= w; x += p, i++) { ctx.globalAlpha = i % 5 ? .05 : .11; trait(ctx, x, 0, x, h); }
    for (let y = 0, i = 0; y <= h; y += p, i++) { ctx.globalAlpha = i % 5 ? .05 : .11; trait(ctx, 0, y, w, y); }

    // ---- schéma normalisé : générateur en haut, ampèremètre à gauche, deux résistances en bas, voltmètre en dérivation ----
    const k = Math.min(1, w / 1100);
    const x0 = w * (w < 700 ? .5 : .46), x1 = x0 + 230 * k + 60, y0 = hb * .2, y1 = hb * .62;
    const r = 13, xm = (x0 + x1) / 2;
    ctx.globalAlpha = .42; ctx.lineWidth = 1.6;
    // fils (avec les trous des dipôles)
    trait(ctx, x0, y0, xm - r, y0); trait(ctx, xm + r, y0, x1, y0);
    const ya = (y0 + y1) / 2;
    trait(ctx, x0, y0, x0, ya - r); trait(ctx, x0, ya + r, x0, y1);
    const ra1 = x0 + (x1 - x0) * .3, ra2 = x0 + (x1 - x0) * .7, lr = 22;
    trait(ctx, x0, y1, ra1 - lr, y1); trait(ctx, ra1 + lr, y1, ra2 - lr, y1); trait(ctx, ra2 + lr, y1, x1, y1); trait(ctx, x1, y1, x1, y0);
    // générateur, ampèremètre
    ctx.beginPath(); ctx.arc(xm, y0, r, 0, 7); ctx.stroke();
    ctx.beginPath(); ctx.arc(x0, ya, r, 0, 7); ctx.stroke();
    ctx.font = `700 13px ${getComputedStyle(document.body).fontFamily}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('G', xm, y0 + 1); ctx.fillText('A', x0, ya + 1);
    ctx.fillText('+', xm - 18, y0 - 16); ctx.fillText('−', xm + 18, y0 - 16);
    // résistances
    ctx.strokeRect(ra1 - lr, y1 - 8, 2 * lr, 16); ctx.strokeRect(ra2 - lr, y1 - 8, 2 * lr, 16);
    // voltmètre en dérivation sur la première résistance, deux nœuds
    const yv = y1 + hb * .16, n1 = ra1 - lr - 14, n2 = ra1 + lr + 14;
    trait(ctx, n1, y1, n1, yv); trait(ctx, n2, y1, n2, yv); trait(ctx, n1, yv, ra1 - r, yv); trait(ctx, ra1 + r, yv, n2, yv);
    ctx.beginPath(); ctx.arc(ra1, yv, r, 0, 7); ctx.stroke(); ctx.fillText('V', ra1, yv + 1);
    [[n1, y1], [n2, y1]].forEach(([x, y]) => { ctx.beginPath(); ctx.arc(x, y, 3.4, 0, 7); ctx.fill(); });
    // flèche de tension
    ctx.lineWidth = 1.2; trait(ctx, ra1 + lr, y1 - 18, ra1 - lr + 6, y1 - 18);
    ctx.beginPath(); ctx.moveTo(ra1 - lr, y1 - 18); ctx.lineTo(ra1 - lr + 8, y1 - 22); ctx.lineTo(ra1 - lr + 8, y1 - 14); ctx.fill();
    const boucle1 = ligne([[xm - r, y0], [x0, y0], [x0, y1], [x1, y1], [x1, y0], [xm + r, y0]]);

    // ---- la table : le même circuit avec du vrai matériel, en traits fins ----
    const t0 = x1 + 70 * k + 40;
    const rect = (x, y, l, H, a) => { ctx.globalAlpha = a; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, l, H, 8) : ctx.rect(x, y, l, H); ctx.stroke(); };
    ctx.lineWidth = 1.4;
    // générateur (écran, bouton, bornes)
    const gx = t0 + 70, gy = hb * .1;
    rect(gx, gy, 120, 68, .4); rect(gx + 10, gy + 10, 52, 24, .3);
    ctx.beginPath(); ctx.arc(gx + 92, gy + 24, 12, 0, 7); ctx.stroke();
    const gp = [gx + 40, gy + 54], gm = [gx + 80, gy + 54];
    // multimètre (écran, cadran, bornes), à gauche sous le générateur
    const mx = t0, my = hb * .36;
    rect(mx, my, 64, 100, .4); rect(mx + 8, my + 8, 48, 20, .3);
    ctx.beginPath(); ctx.arc(mx + 32, my + 54, 16, 0, 7); ctx.stroke();
    const m10 = [mx + 12, my + 88], mc = [mx + 40, my + 88];
    // deux résistances sur leur plaquette
    const p1x = t0 + 96, p2x = t0 + 176, py = hb * .62;
    rect(p1x, py, 64, 36, .4); rect(p2x, py, 64, 36, .4);
    rect(p1x + 18, py + 7, 28, 9, .35); rect(p2x + 18, py + 7, 28, 9, .35);
    const r1a = [p1x + 12, py + 26], r1b = [p1x + 52, py + 26], r2a = [p2x + 12, py + 26], r2b = [p2x + 52, py + 26];
    // bornes
    ctx.globalAlpha = .5;
    [gp, gm, m10, mc, r1a, r1b, r2a, r2b].forEach(([x, y]) => { ctx.beginPath(); ctx.arc(x, y, 4.5, 0, 7); ctx.stroke(); });
    // fils souples dans l'ordre de la boucle : + → 10A (par-dessous le multimètre), COM → R1, R1 → R2, R2 → −
    const fils = [
      bezier(gp, [gp[0] - 6, m10[1] + 60], [m10[0] - 4, m10[1] + 50], m10, 40),
      bezier(mc, [mc[0] + 4, mc[1] + 34], [r1a[0] - 16, r1a[1] + 34], r1a, 40),
      bezier(r1b, [r1b[0] + 6, r1b[1] + 26], [r2a[0] - 6, r2a[1] + 26], r2a, 30),
      bezier(r2b, [r2b[0] + 30, r2b[1] + 16], [gm[0] + 70, gm[1] + 40], gm, 40),
    ];
    ctx.globalAlpha = .38; ctx.lineWidth = 2.2;
    fils.forEach(l => { ctx.beginPath(); l.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke(); });
    // boucle de la table : les fils et la traversée des dipôles
    const pts = [].concat(fils[0], [mc], fils[1], [r1b], fils[2], [r2b], fils[3], [gp]);
    return [boucle1, ligne(pts)];
  }

  // points lumineux qui circulent le long des boucles
  function points(ctx, boucles, c, t) {
    ctx.fillStyle = c;
    boucles.forEach((b, j) => {
      const n = Math.max(4, Math.round(b.L / 70)), v = 16;
      for (let i = 0; i < n; i++) {
        const [x, y] = b.at(i * b.L / n + t * v + j * 20);
        ctx.globalAlpha = .12; ctx.beginPath(); ctx.arc(x, y, 8, 0, 7); ctx.fill();
        ctx.globalAlpha = .7; ctx.beginPath(); ctx.arc(x, y, 2.6, 0, 7); ctx.fill();
      }
    });
    ctx.globalAlpha = 1;
  }

  function demarrer(hero) {
    const cv = hero.querySelector('canvas');
    let fond = null, boucles = null, c = '#5a3fc4', w = 0, h = 0, dpr = 1;
    function peindre() {
      const hb = hero.offsetHeight;
      if (!hb) return;
      cv.style.height = (hb * (1 + (reduit ? 0 : F))) + 'px';
      dpr = Math.min(devicePixelRatio || 1, 2);
      w = cv.clientWidth; h = cv.clientHeight;
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
      fond = document.createElement('canvas'); fond.width = cv.width; fond.height = cv.height;
      const f = fond.getContext('2d'); f.scale(dpr, dpr);
      const st = getComputedStyle(hero);
      f.fillStyle = st.getPropertyValue('--paper').trim() || '#f3f1ec'; f.fillRect(0, 0, w, h);
      c = st.getPropertyValue('--accent').trim() || c;
      boucles = circuit(f, w, h, c);
      image(0);
    }
    function image(t) {
      const ctx = cv.getContext('2d');
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(fond, 0, 0);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      points(ctx, boucles, c, t);
    }
    function deplacer() {
      if (reduit) return;
      const r = hero.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) return;
      cv.style.transform = `translate3d(0, ${Math.max(0, -r.top) * F}px, 0)`;
    }
    peindre();
    addEventListener('resize', peindre);
    addEventListener('scroll', () => requestAnimationFrame(deplacer), { passive: true });
    if (document.fonts) document.fonts.ready.then(peindre);
    if (reduit) return;
    // animation seulement quand l'en-tête est visible
    const t0 = performance.now();
    (function boucle(now) {
      const r = hero.getBoundingClientRect();
      if (fond && r.bottom > 0 && r.top < innerHeight) image((now - t0) / 1000);
      requestAnimationFrame(boucle);
    })(t0);
  }

  function init() { document.querySelectorAll('.app-hero[data-dessin="circuit"]').forEach(demarrer); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
