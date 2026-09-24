/* ============================================================
   Thème « Chambre à bulles » : en-tête illustré des applications
   Image de fond dessinée en canvas, qui descend moins vite que
   la page (parallaxe).

   Utilisation :
     <header class="app-hero" id="mainHeader" data-dessin="log">
       <canvas aria-hidden="true"></canvas> ...
     </header>
     <script src="theme-chambre-a-bulles.js"></script>
   ============================================================ */
(function () {
  'use strict';

  const F = 0.4;                                   // l'image défile à 60 % de la vitesse de la page
  const reduit = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Dessins disponibles ---------- */
  const dessins = {
    // Papier logarithmique (décades) : les puissances de 10 sont régulièrement espacées
    log(ctx, w, h, c) {
      const decade = Math.max(150, Math.min(240, w / 6));   // largeur d'une décade en px
      ctx.strokeStyle = c; ctx.fillStyle = c; ctx.lineWidth = 1;
      const x0 = w * .06, y0 = h * .6;                       // origine (dans la partie visible au départ)
      // lignes verticales et horizontales : log10(k × 10^n), k = 1…9
      for (let n = -1; n * decade < w + decade; n++) for (let k = 1; k < 10; k++) {
        const x = x0 + (n + Math.log10(k)) * decade;
        ctx.globalAlpha = k === 1 ? .28 : .1; trait(ctx, x, 0, x, h);
      }
      for (let n = -1; n * decade < h + decade; n++) for (let k = 1; k < 10; k++) {
        const y = y0 - (n + Math.log10(k)) * decade;
        ctx.globalAlpha = k === 1 ? .28 : .1; trait(ctx, 0, y, w, y);
      }
      // graduations 10^n en haut de l'image (loin du titre)
      const police = getComputedStyle(document.body).fontFamily, yg = 36;
      ctx.globalAlpha = .7;
      for (let n = 0; n * decade < w; n++) {
        const x = x0 + n * decade;
        ctx.font = `600 13px ${police}`; ctx.fillText('10', x + 5, yg);
        ctx.font = `600 9px ${police}`;  ctx.fillText(String(n - 3).replace('-', '−'), x + 21, yg - 8);
      }
      // lois de puissance : des droites sur papier logarithmique
      ctx.lineWidth = 2.5;
      [[.5, .15, .8], [1, -.4, .55], [2, -1.6, .35]].forEach(([pente, b, a]) => {
        ctx.globalAlpha = a;
        trait(ctx, x0 - decade, y0 - (b - pente) * decade, x0 + 12 * decade, y0 - (b + 11 * pente) * decade);
      });
      ctx.globalAlpha = 1;
    }
  };

  function trait(ctx, x1, y1, x2, y2) { ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); }

  function peindre(hero) {
    const cv = hero.querySelector('canvas');
    const hb = hero.offsetHeight;
    if (!hb) return;                                 // en-tête masqué (cours, entraînement)
    cv.style.height = (hb * (1 + (reduit ? 0 : F))) + 'px';
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const w = cv.clientWidth, h = cv.clientHeight;
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
    const ctx = cv.getContext('2d');
    ctx.scale(dpr, dpr);
    const st = getComputedStyle(hero);
    ctx.fillStyle = st.getPropertyValue('--paper').trim(); ctx.fillRect(0, 0, w, h);
    dessins[hero.dataset.dessin || 'log'](ctx, w, h, st.getPropertyValue('--accent').trim());
    hero.dataset.largeur = innerWidth;
  }

  function deplacer(hero) {
    if (reduit) return;
    const r = hero.getBoundingClientRect();
    if (r.bottom < 0 || r.top > innerHeight) return;
    hero.querySelector('canvas').style.transform = `translate3d(0, ${Math.max(0, -r.top) * F}px, 0)`;
  }

  window.HeroChambre = {
    init(hero) {
      peindre(hero); deplacer(hero);
      let attente = false;
      addEventListener('scroll', () => {
        if (!attente) { attente = true; requestAnimationFrame(() => { deplacer(hero); attente = false; }); }
      }, { passive: true });
      addEventListener('resize', () => { if (+hero.dataset.largeur !== innerWidth) peindre(hero); deplacer(hero); });
      document.fonts && document.fonts.ready.then(() => peindre(hero));
      // l'en-tête est masqué puis réaffiché lors des changements d'écran : on redessine au retour
      new MutationObserver(() => { if (hero.offsetHeight && !hero.querySelector('canvas').width) peindre(hero); })
        .observe(hero, { attributes: true, attributeFilter: ['style'] });
    }
  };
})();
