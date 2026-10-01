/* ============================================================
   En-tête illustré des applications (design « Chambre à bulles »)

   Chaque <header class="app-hero" data-dessin="…"> reçoit une image
   dessinée en canvas, dans la couleur de la matière, qui descend
   moins vite que la page (parallaxe). Les en-têtes ajoutés plus tard
   par l'application (écran d'accueil régénéré) sont pris en charge.

   Dessins disponibles (attribut data-dessin) :
     log        papier logarithmique (puissances de 10)
     regle      règles graduées avec préfixes (conversions)
     graphique  papier millimétré, droites et points de mesure
     noyaux     noyaux radioactifs et courbe N(t)
     puissance  tension et intensité déphasées, puissance instantanée
     fractions  disques et barres partagés
     molecules  modèles moléculaires en boules
     formules:physique | formules:redox | formules:pile | formules:algebre
   ============================================================ */
(function () {
  'use strict';

  const F = 0.4;                                   // l'image défile à 60 % de la vitesse de la page
  const reduit = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Générateur pseudo-aléatoire reproductible (même image à chaque chargement) */
  function graine(seed) {
    return function () {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function trait(ctx, x1, y1, x2, y2) { ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); }
  function courbe(ctx, f, x0, x1) {
    ctx.beginPath();
    for (let x = x0; x <= x1; x += 3) x === x0 ? ctx.moveTo(x, f(x)) : ctx.lineTo(x, f(x));
    ctx.stroke();
  }
  const police = () => getComputedStyle(document.body).fontFamily;

  // Listes de formules pour le dessin « formules »
  const FORMULES = {
    physique: ['U = R × I', 'P = U × I', 'v = d / t', 'ρ = m / V', 'E = P × Δt', 'F = m × a', 'Ep = m g h',
               'Ec = ½ m v²', 'n = m / M', 'C = n / V', 'λ = c / f', 'P = F / S', 'Q = m c ΔT', 'W = F × d'],
    redox:    ['Cu²⁺ + 2e⁻ = Cu', 'Fe = Fe²⁺ + 2e⁻', 'Zn = Zn²⁺ + 2e⁻', 'Ag⁺ + e⁻ = Ag', 'Ox + n e⁻ = Red',
               'MnO₄⁻ + 8H⁺ + 5e⁻ = Mn²⁺ + 4H₂O', 'I₂ + 2e⁻ = 2I⁻', 'Al = Al³⁺ + 3e⁻', 'O₂ + 4H⁺ + 4e⁻ = 2H₂O'],
    pile:     ['Zn | Zn²⁺ ‖ Cu²⁺ | Cu', 'Zn = Zn²⁺ + 2e⁻', 'Cu²⁺ + 2e⁻ = Cu', 'anode (−)', 'cathode (+)', 'pont salin',
               'e⁻ →', 'I', 'COM', 'Zn + Cu²⁺ → Zn²⁺ + Cu', 'oxydation', 'réduction'],
    algebre:  ['2x + 3 = 7', 'x = 2', '3(x − 1) = 12', '5x = 20', 'x − 4 = 9', '7 = 2x − 5', '4x + 1 = 3x + 6',
               'x / 3 = 5', '−2x = 8', 'x = −4', 'ax + b = 0', 'x = −b / a']
  };

  const dessins = {
    // Papier logarithmique : les puissances de 10 sont régulièrement espacées
    log(ctx, w, h, c) {
      const decade = Math.max(150, Math.min(240, w / 6)), x0 = w * .06, y0 = h * .6;
      ctx.strokeStyle = c; ctx.fillStyle = c; ctx.lineWidth = 1;
      for (let n = -1; n * decade < w + decade; n++) for (let k = 1; k < 10; k++) {
        const x = x0 + (n + Math.log10(k)) * decade;
        ctx.globalAlpha = k === 1 ? .28 : .1; trait(ctx, x, 0, x, h);
      }
      for (let n = -1; n * decade < h + decade; n++) for (let k = 1; k < 10; k++) {
        const y = y0 - (n + Math.log10(k)) * decade;
        ctx.globalAlpha = k === 1 ? .28 : .1; trait(ctx, 0, y, w, y);
      }
      ctx.globalAlpha = .7;
      for (let n = 0; n * decade < w; n++) {
        const x = x0 + n * decade;
        ctx.font = `600 13px ${police()}`; ctx.fillText('10', x + 5, 36);
        ctx.font = `600 9px ${police()}`; ctx.fillText(String(n - 3).replace('-', '−'), x + 21, 28);
      }
      ctx.lineWidth = 2.5;
      [[.5, .15, .8], [1, -.4, .55], [2, -1.6, .35]].forEach(([p, b, a]) => {
        ctx.globalAlpha = a;
        trait(ctx, x0 - decade, y0 - (b - p) * decade, x0 + 12 * decade, y0 - (b + 11 * p) * decade);
      });
    },

    // Règles graduées superposées, avec les préfixes du Système international
    regle(ctx, w, h, c) {
      const prefixes = ['k', 'h', 'da', '', 'd', 'c', 'm'];
      ctx.strokeStyle = c; ctx.fillStyle = c; ctx.lineWidth = 1.2;
      const pas = Math.max(9, w / 150);
      for (let r = 0, y = 34; y < h; r++, y += 92) {
        const dx = (r % 3) * pas * 3.3;
        ctx.globalAlpha = .45; trait(ctx, 0, y, w, y);
        for (let i = 0, x = -dx; x < w; i++, x += pas) {
          const haut = i % 10 === 0 ? 26 : i % 5 === 0 ? 17 : 10;
          ctx.globalAlpha = i % 10 === 0 ? .6 : .35; trait(ctx, x, y, x, y + haut);
          if (i % 10 === 0) {
            ctx.globalAlpha = .7; ctx.font = `600 12px ${police()}`;
            ctx.fillText((i / 10 % prefixes.length === 0 && r % 2 ? '1 ' : '') + prefixes[(i / 10 + r) % prefixes.length] + 'm', x + 4, y + 40);
          }
        }
      }
    },

    // Papier millimétré, droites passant par l'origine et points de mesure
    graphique(ctx, w, h, c, rnd) {
      const p = 22;
      ctx.strokeStyle = c; ctx.lineWidth = 1;
      for (let i = 0, x = 0; x <= w; x += p, i++) { ctx.globalAlpha = i % 5 ? .07 : .16; trait(ctx, x, 0, x, h); }
      for (let i = 0, y = 0; y <= h; y += p, i++) { ctx.globalAlpha = i % 5 ? .07 : .16; trait(ctx, 0, y, w, y); }
      const x0 = w * .45, y0 = h * .7;
      ctx.globalAlpha = .6; ctx.lineWidth = 2; trait(ctx, x0, 0, x0, y0); trait(ctx, x0, y0, w, y0);
      [[.35, .8], [.7, .45], [1.4, .3]].forEach(([k, a]) => {
        ctx.globalAlpha = a; ctx.lineWidth = 2.5; trait(ctx, x0, y0, w, y0 - (w - x0) * k);
        ctx.lineWidth = 2;
        for (let x = x0 + 60; x < w; x += 70) {
          const y = y0 - (x - x0) * k + (rnd() - .5) * 10, d = 6;
          if (y < 0) break;
          trait(ctx, x - d, y - d, x + d, y + d); trait(ctx, x - d, y + d, x + d, y - d);
        }
      });
    },

    // Noyaux qui se désintègrent au fil du temps (gauche → droite) et courbe N(t)
    noyaux(ctx, w, h, c, rnd) {
      const pas = 24, tau = w * .3;
      ctx.strokeStyle = c; ctx.fillStyle = c; ctx.lineWidth = 1.2;
      for (let j = 0, y = pas / 2; y < h; y += pas, j++) for (let x = pas / 2 + (j % 2) * pas / 2; x < w; x += pas) {
        ctx.beginPath(); ctx.arc(x, y, 4.5, 0, 7);
        if (rnd() < 1 - Math.exp(-x / tau)) { ctx.globalAlpha = .22; ctx.stroke(); }
        else { ctx.globalAlpha = .45; ctx.fill(); }
      }
      const N = x => h * .06 + h * .6 * (1 - Math.exp(-x / tau));
      ctx.globalAlpha = .85; ctx.strokeStyle = '#fff'; ctx.lineWidth = 9; courbe(ctx, N, 0, w);
      ctx.globalAlpha = 1; ctx.strokeStyle = c; ctx.lineWidth = 3; courbe(ctx, N, 0, w);
    },

    // Tension et intensité déphasées (en haut), puissance instantanée p = u × i (en bas)
    puissance(ctx, w, h, c) {
      const p = 22;
      ctx.strokeStyle = c; ctx.fillStyle = c; ctx.lineWidth = 1;
      for (let i = 0, x = 0; x <= w; x += p, i++) { ctx.globalAlpha = i % 5 ? .06 : .14; trait(ctx, x, 0, x, h); }
      for (let i = 0, y = 0; y <= h; y += p, i++) { ctx.globalAlpha = i % 5 ? .06 : .14; trait(ctx, 0, y, w, y); }
      const per = Math.max(240, w / 4.5), om = 2 * Math.PI / per, phi = .9;
      // u et i autour de la ligne yu
      const yu = h * .3, A = h * .17;
      ctx.globalAlpha = .35; ctx.lineWidth = 1.5; trait(ctx, 0, yu, w, yu);
      ctx.globalAlpha = .75; ctx.lineWidth = 2.5; courbe(ctx, x => yu - A * Math.sin(om * x), 0, w);
      ctx.globalAlpha = .4; courbe(ctx, x => yu - A * .6 * Math.sin(om * x - phi), 0, w);
      // p = u × i : aires positives (foncées) et négatives (claires)
      const yp = h * .74, B = h * .2, f = x => Math.sin(om * x) * Math.sin(om * x - phi);
      ctx.globalAlpha = .35; ctx.lineWidth = 1.5; trait(ctx, 0, yp, w, yp);
      [[v => Math.max(v, 0), .22], [v => Math.min(v, 0), .09]].forEach(([g, a]) => {
        ctx.beginPath(); ctx.moveTo(0, yp);
        for (let x = 0; x <= w; x += 3) ctx.lineTo(x, yp - B * g(f(x)));
        ctx.lineTo(w, yp); ctx.closePath(); ctx.globalAlpha = a; ctx.fill();
      });
      ctx.globalAlpha = .7; ctx.lineWidth = 2.5; courbe(ctx, x => yp - B * f(x), 0, w);
    },

    // Disques et barres partagés en fractions
    fractions(ctx, w, h, c, rnd) {
      const pasX = 130, pasY = 140, R = 40;
      ctx.strokeStyle = c; ctx.fillStyle = c; ctx.lineWidth = 1.8;
      for (let gy = 0; gy * pasY < h + pasY; gy++) for (let gx = 0; gx * pasX < w + pasX; gx++) {
        const cx = gx * pasX + (gy % 2) * pasX / 2, cy = pasY / 2 + gy * pasY;
        const n = 2 + Math.floor(rnd() * 7), k = 1 + Math.floor(rnd() * (n - 1));
        if ((gx + gy) % 3 === 1) {
          const L = 100, hb = 30, xg = cx - L / 2;
          for (let i = 0; i < n; i++) {
            ctx.beginPath(); ctx.rect(xg + i * L / n, cy - hb / 2, L / n, hb);
            if (i < k) { ctx.globalAlpha = .25; ctx.fill(); }
            ctx.globalAlpha = .55; ctx.stroke();
          }
        } else {
          for (let i = 0; i < n; i++) {
            const a1 = -Math.PI / 2 + i * 2 * Math.PI / n;
            ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, R, a1, a1 + 2 * Math.PI / n); ctx.closePath();
            if (i < k) { ctx.globalAlpha = .25; ctx.fill(); }
            ctx.globalAlpha = .55; ctx.stroke();
          }
        }
      }
    },

    // Modèles moléculaires en boules (eau, dioxyde de carbone, méthane, dioxygène, ammoniac)
    molecules(ctx, w, h, c, rnd) {
      const modeles = [
        [[0, 0, 15], [-17, 12, 10], [17, 12, 10]],                                   // H2O
        [[-24, 0, 14], [0, 0, 14], [24, 0, 14]],                                     // CO2
        [[0, 0, 15], [0, -21, 10], [21, 0, 10], [0, 21, 10], [-21, 0, 10]],          // CH4
        [[-11, 0, 14], [11, 0, 14]],                                                  // O2
        [[0, 0, 15], [-19, 11, 10], [19, 11, 10], [0, -21, 10]],                      // NH3
      ];
      ctx.strokeStyle = c; ctx.fillStyle = c; ctx.lineWidth = 1.5;
      for (let ligne = 0, y = 45; y < h + 50; y += 100, ligne++) {
        for (let x = 40 + (ligne % 2) * 70 - rnd() * 30; x < w + 50; x += 135 + rnd() * 30) {
          const m = modeles[Math.floor(rnd() * modeles.length)], a = rnd() * 6.28, k = .85 + rnd() * .45;
          const ca = Math.cos(a), sa = Math.sin(a), alpha = .5 + rnd() * .5;
          // petites boules d'abord : les grosses passent devant
          m.slice().sort((p, q) => p[2] - q[2]).forEach(([mx, my, r]) => {
            ctx.beginPath(); ctx.arc(x + k * (mx * ca - my * sa), y + k * (mx * sa + my * ca), r * k, 0, 7);
            ctx.globalAlpha = (r > 12 ? .26 : .12) * alpha; ctx.fill();
            ctx.globalAlpha = .55 * alpha; ctx.stroke();
          });
        }
      }
    },

    // Formules écrites en quinconce, plus ou moins marquées
    formules(ctx, w, h, c, rnd, liste) {
      const f = FORMULES[liste] || FORMULES.physique;
      ctx.fillStyle = c; ctx.textBaseline = 'middle';
      let i = 0;
      for (let y = 30, ligne = 0; y < h; y += 58, ligne++) {
        let x = -rnd() * 160 - (ligne % 2) * 80;
        while (x < w) {
          const t = f[i++ % f.length], taille = 16 + Math.floor(rnd() * 3) * 5;
          ctx.font = `${taille > 20 ? 600 : 500} ${taille}px ${police()}`;
          ctx.globalAlpha = .1 + rnd() * .3;
          ctx.fillText(t, x, y + (rnd() - .5) * 10);
          x += ctx.measureText(t).width + 48 + rnd() * 60;
        }
      }
    }
  };

  /* ---------- Dessin et parallaxe ---------- */
  function peindre(hero) {
    const cv = hero.querySelector('canvas');
    const hb = hero.offsetHeight;
    if (!cv || !hb) return;                         // en-tête masqué : on dessinera plus tard
    cv.style.height = (hb * (1 + (reduit ? 0 : F))) + 'px';
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const w = cv.clientWidth, h = cv.clientHeight;
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
    const ctx = cv.getContext('2d');
    ctx.scale(dpr, dpr);
    const st = getComputedStyle(hero);
    ctx.fillStyle = st.getPropertyValue('--paper').trim() || '#f3f1ec'; ctx.fillRect(0, 0, w, h);
    const [nom, option] = (hero.dataset.dessin || 'graphique').split(':');
    (dessins[nom] || dessins.graphique)(ctx, w, h, st.getPropertyValue('--accent').trim() || '#2952c8', graine(7), option);
    ctx.globalAlpha = 1;
    hero.dataset.peint = innerWidth + 'x' + hb;
  }

  function deplacer(hero) {
    if (reduit) return;
    const r = hero.getBoundingClientRect();
    if (r.bottom < 0 || r.top > innerHeight) return;
    const cv = hero.querySelector('canvas');
    if (cv) cv.style.transform = `translate3d(0, ${Math.max(0, -r.top) * F}px, 0)`;
  }

  const heros = () => document.querySelectorAll('.app-hero');
  function toutPeindre(force) {
    heros().forEach(hero => {
      if (force || hero.dataset.peint !== innerWidth + 'x' + hero.offsetHeight) peindre(hero);
      deplacer(hero);
    });
  }

  function demarrer() {
    toutPeindre(true);
    let attente = false;
    addEventListener('scroll', () => {
      if (!attente) { attente = true; requestAnimationFrame(() => { heros().forEach(deplacer); attente = false; }); }
    }, { passive: true });
    addEventListener('resize', () => toutPeindre(false));
    if (document.fonts) document.fonts.ready.then(() => toutPeindre(true));
    // en-tête ajouté, masqué puis réaffiché par l'application : on (re)dessine si besoin
    // (on ignore les modifications faites par ce script sur les canvas eux-mêmes)
    new MutationObserver(recs => {
      if (recs.every(r => r.target.tagName === 'CANVAS')) return;
      requestAnimationFrame(() => toutPeindre(false));
    })
      .observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'class'] });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', demarrer);
  else demarrer();
})();
