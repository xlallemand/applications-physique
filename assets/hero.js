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
     transport  pylônes et lignes à haute tension, tension sinusoïdale
     cinematique  chronophotographies (positions successives) et vecteurs vitesse
     wagon      wagon tiré sur des rails par des cordes à différents angles (travail d'une force)
     rotation   engrenages, arcs de cercle et sens de rotation (mouvements de rotation)
     fluides    château d'eau et niveaux, hauteur h, forces pressantes sur les parois (statique des fluides)
     lumiere    soleil, rayons ondulés (photons) et panneau photovoltaïque incliné (énergie transportée par la lumière)
     spectre    signal périodique non sinusoïdal en haut, raies de son spectre en dessous (spectre d'un signal, ondes sonores)
     antenne    pylône d'antenne relais qui émet des ondes, onde modulée en amplitude (ondes électromagnétiques)
     fractions  disques et barres partagés
     molecules  modèles moléculaires en boules
     topologique  formules topologiques en zigzag, avec quelques OH, =O, NH₂, Cl, comme écrites au tableau (nomenclature)
     formules:physique | formules:redox | formules:pile | formules:combustion | formules:ph | formules:algebre
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
    combustion: ['CH₄ + 2 O₂ → CO₂ + 2 H₂O', 'n = m / M', 'm = n × M', 'E = PC × m', 'C₃H₈ + 5 O₂ → 3 CO₂ + 4 H₂O',
               'M(CO₂) = 44 g/mol', 'n / a = n / b', 'PC en MJ/kg', 'C₂H₆O + 3 O₂ → 2 CO₂ + 3 H₂O', 'M(H₂O) = 18 g/mol'],
    ph:       ['pH = −log([H₃O⁺] / c°)', '[H₃O⁺] = c° × 10⁻ᵖᴴ', 'log(10ᵃ) = a', '10ˡᵒᵍ ᵃ = a', 'log(a × b) = log a + log b',
               'log(a / b) = log a − log b', 'log(aⁿ) = n log a', 'c° = 1 mol·L⁻¹', 'log 1 = 0', 'pH = 2,3', 'pH = 7,0', 'log 10 = 1'],
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

    // Spectres de raies (bandes traversées de raies) et étoiles
    topologique(ctx, w, h, c, rnd) {
      const L = 24, cx = L * Math.cos(Math.PI / 6), cy = L / 2;
      ctx.strokeStyle = c; ctx.fillStyle = c; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      const f = police();
      // trait un peu tremblé, comme à la craie
      const main = (x1, y1, x2, y2) => { ctx.beginPath(); ctx.moveTo(x1 + (rnd() - .5), y1 + (rnd() - .5)); ctx.quadraticCurveTo((x1 + x2) / 2 + (rnd() - .5) * 1.6, (y1 + y2) / 2 + (rnd() - .5) * 1.6, x2 + (rnd() - .5), y2 + (rnd() - .5)); ctx.stroke(); };
      // étiquette d'atome (indice plus petit et plus bas : NH₂)
      const etiq = (t, x, y) => {
        const m = t.match(/^([A-Za-z]+)(\d?)$/);
        ctx.font = `600 14px ${f}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        const w1 = ctx.measureText(m[1]).width;
        ctx.fillText(m[1], x + (m[2] ? -3 : 0), y);
        if (m[2]) { ctx.font = `600 10px ${f}`; ctx.fillText(m[2], x - 3 + w1 / 2 + 3, y + 5); }
      };
      for (let ligne = 0, y0 = 42; y0 < h + 40; y0 += 92, ligne++) {
        for (let x0 = 16 + (ligne % 2) * 70 - rnd() * 24; x0 < w + 30; x0 += 175 + rnd() * 55) {
          ctx.globalAlpha = .4 + rnd() * .35; ctx.lineWidth = 1.6;
          const n = 3 + Math.floor(rnd() * 4);
          let s = rnd() < .5 ? 1 : -1;
          const pts = [[x0, y0]];
          for (let k = 0; k < n; k++) { const [x, y] = pts[k]; pts.push([x + cx, y - s * cy]); s = -s; }
          for (let k = 0; k < n; k++) main(pts[k][0], pts[k][1], pts[k + 1][0], pts[k + 1][1]);
          // double liaison : second trait à l'intérieur de l'angle
          if (rnd() < .35) {
            const k = 1 + Math.floor(rnd() * (n - 2)), [x1, y1] = pts[k], [x2, y2] = pts[k + 1], [xp, yp] = pts[k - 1];
            // décalé vers l'intérieur de l'angle (côté du sommet précédent), un peu plus court
            let nx = -(y2 - y1) / L, ny = (x2 - x1) / L;
            if ((xp - (x1 + x2) / 2) * nx + (yp - (y1 + y2) / 2) * ny < 0) { nx = -nx; ny = -ny; }
            const ux = (x2 - x1) / L, uy = (y2 - y1) / L;
            main(x1 + 5 * nx + 4 * ux, y1 + 5 * ny + 4 * uy, x2 + 5 * nx - 4 * ux, y2 + 5 * ny - 4 * uy);
          }
          // ramification sur un sommet intérieur
          if (n > 3 && rnd() < .65) {
            const k = 1 + Math.floor(rnd() * (n - 2)), [x, y] = pts[k], haut = y < pts[k - 1][1] ? -1 : 1;
            main(x, y, x, y + haut * L);
          }
          // groupe en bout de chaîne : OH, NH₂, Cl, ou =O sur l'avant-dernier sommet
          const g = ['OH', 'O', 'NH2', 'Cl', 'OH', 'O'][Math.floor(rnd() * 6)];
          const [xe, ye] = pts[n];
          if (g === 'O') {
            const [xa, ya] = pts[n - 1], haut = ya < pts[n - 2][1] ? -1 : 1;
            main(xa - 2.5, ya, xa - 2.5, ya + haut * (L - 7)); main(xa + 2.5, ya, xa + 2.5, ya + haut * (L - 7));
            etiq('O', xa, ya + haut * (L + 2));
          } else {
            const xg = xe + cx, yg = ye - s * cy;
            main(xe, ye, xg - cx * .3, yg + s * cy * .3);
            etiq(g, xg + 6, yg);
          }
        }
      }
    },
    spectres(ctx, w, h, c, rnd) {
      ctx.fillStyle = c; ctx.strokeStyle = c;
      for (let y = 22, ligne = 0; y < h; y += 62, ligne++) {
        const x0 = -rnd() * 120, larg = w + 160;
        ctx.globalAlpha = .07; ctx.fillRect(x0, y, larg, 26);
        ctx.globalAlpha = .35; ctx.lineWidth = 1; ctx.strokeRect(x0 + .5, y + .5, larg, 26);
        for (let x = x0 + 10 + rnd() * 40; x < w; x += 12 + rnd() * 70) {
          ctx.globalAlpha = .2 + rnd() * .5;
          ctx.fillRect(x, y, 2 + Math.floor(rnd() * 2), 26);
        }
      }
      // étoiles à quatre branches
      for (let i = 0; i < Math.round(w / 90); i++) {
        const x = rnd() * w, y = rnd() * h, r = 4 + rnd() * 7;
        ctx.globalAlpha = .35 + rnd() * .4;
        ctx.beginPath();
        ctx.moveTo(x, y - r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.quadraticCurveTo(x, y, x, y + r);
        ctx.quadraticCurveTo(x, y, x - r, y); ctx.quadraticCurveTo(x, y, x, y - r); ctx.fill();
      }
    },

    // Pylônes à haute tension reliés par des câbles (chaînette), tension sinusoïdale en fond
    transport(ctx, w, h, c) {
      const p = 24;
      ctx.strokeStyle = c; ctx.fillStyle = c; ctx.lineWidth = 1;
      for (let i = 0, x = 0; x <= w; x += p, i++) { ctx.globalAlpha = i % 5 ? .05 : .12; trait(ctx, x, 0, x, h); }
      for (let i = 0, y = 0; y <= h; y += p, i++) { ctx.globalAlpha = i % 5 ? .05 : .12; trait(ctx, 0, y, w, y); }
      // tension sinusoïdale, très légère
      ctx.globalAlpha = .18; ctx.lineWidth = 2.5;
      const per = Math.max(260, w / 4);
      courbe(ctx, x => h * .3 - h * .12 * Math.sin(2 * Math.PI * x / per), 0, w);
      // pylône : treillis vu de face, deux consoles portant les câbles ; renvoie les points d'accroche
      function pylone(x, base, H, a) {
        const L = H * .16, haut = base - H;
        ctx.globalAlpha = a; ctx.lineWidth = 2;
        trait(ctx, x - L, base, x - L * .25, haut); trait(ctx, x + L, base, x + L * .25, haut);
        ctx.lineWidth = 1;
        for (let k = 0; k < 7; k++) {
          const y1 = base - k * H / 7, y2 = base - (k + 1) * H / 7;
          const e1 = L - (L * .75) * k / 7, e2 = L - (L * .75) * (k + 1) / 7;
          trait(ctx, x - e1, y1, x + e2, y2); trait(ctx, x + e1, y1, x - e2, y2);
        }
        const c1 = haut + H * .12, c2 = haut + H * .32;
        ctx.lineWidth = 2;
        trait(ctx, x - L * 1.6, c1, x + L * 1.6, c1); trait(ctx, x - L * 2, c2, x + L * 2, c2);
        trait(ctx, x - L * .25, haut, x, haut - H * .08); trait(ctx, x + L * .25, haut, x, haut - H * .08);
        return [[x - L * 1.5, c1], [x + L * 1.5, c1], [x - L * 1.9, c2], [x + L * 1.9, c2]];
      }
      const ecart = Math.max(260, w / 3.6), H = h * .62, base = h * 1.02;
      const pts = [];
      for (let x = ecart * .35, k = 0; x < w + ecart; x += ecart, k++) pts.push(pylone(x, base - (k % 2) * h * .04, H, .42));
      // câbles : chaînettes entre deux pylônes voisins
      ctx.lineWidth = 1.5; ctx.globalAlpha = .38;
      for (let k = 0; k + 1 < pts.length; k++) for (let j = 0; j < 4; j++) {
        const [x1, y1] = pts[k][j], [x2, y2] = pts[k + 1][j], f = ecart * .07;
        ctx.beginPath(); ctx.moveTo(x1, y1);
        ctx.quadraticCurveTo((x1 + x2) / 2, (y1 + y2) / 2 + 2 * f, x2, y2); ctx.stroke();
      }
    },

    // Chronophotographies : positions successives d'un projectile et d'un point
    // en mouvement circulaire, avec quelques vecteurs vitesse tangents
    cinematique(ctx, w, h, c) {
      const p = 26;
      ctx.strokeStyle = c; ctx.fillStyle = c; ctx.lineWidth = 1;
      for (let x = 0, i = 0; x <= w; x += p, i++) { ctx.globalAlpha = i % 5 ? .06 : .13; trait(ctx, x, 0, x, h); }
      for (let y = 0, i = 0; y <= h; y += p, i++) { ctx.globalAlpha = i % 5 ? .06 : .13; trait(ctx, 0, y, w, y); }
      function fleche(x, y, dx, dy, a) {
        const L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L, t = 10;
        ctx.globalAlpha = a; ctx.lineWidth = 2.5; trait(ctx, x, y, x + dx - ux * 4, y + dy - uy * 4);
        ctx.beginPath(); ctx.moveTo(x + dx, y + dy);
        ctx.lineTo(x + dx - ux * t - uy * t * .45, y + dy - uy * t + ux * t * .45);
        ctx.lineTo(x + dx - ux * t + uy * t * .45, y + dy - uy * t - ux * t * .45); ctx.closePath(); ctx.fill();
      }
      // projectiles : x = v0x t, y = v0y t − g t² / 2
      [[w * .5, h * .92, 95, -150, .55, 1], [w * .6, h * .95, 120, -110, .32, .8]].forEach(([x0, y0, vx, vy, a, k]) => {
        const g = 60, dt = .5 * k, n = Math.ceil((2 * -vy / g) / dt) + 2;
        for (let i = 0; i < n; i++) {
          const t = i * dt, x = x0 + vx * t * k * 1.6, y = y0 + (vy * t + g * t * t / 2) * k * 1.6;
          if (x > w + 10) break;
          ctx.globalAlpha = a; ctx.beginPath(); ctx.arc(x, y, 3.2, 0, 7); ctx.fill();
          // vecteur vitesse tangent, long d'un demi-intervalle : il ne rejoint pas la position suivante
          const e = dt * k * 1.6 * .5;
          if (i === 2 || i === Math.floor(n / 2) || i === n - 3) fleche(x, y, vx * e, (vy + g * t) * e, a * .9);
        }
      });
      // mouvement circulaire : vecteur vitesse tangent, accélération vers le centre
      const cx = w * .84, cy = h * .32, r = Math.min(110, h * .24);
      for (let i = 0; i < 16; i++) {
        const a = i * Math.PI / 8, x = cx + r * Math.cos(a), y = cy + r * Math.sin(a);
        ctx.globalAlpha = .4; ctx.beginPath(); ctx.arc(x, y, 3, 0, 7); ctx.fill();
      }
      const a0 = -Math.PI / 4, xm = cx + r * Math.cos(a0), ym = cy + r * Math.sin(a0);
      fleche(xm, ym, 60 * Math.sin(a0), -60 * Math.cos(a0), .6);
      fleche(xm, ym, -r * .5 * Math.cos(a0), -r * .5 * Math.sin(a0), .45);
      ctx.globalAlpha = .35; ctx.beginPath(); ctx.arc(cx, cy, 3, 0, 7); ctx.fill();
    },

    // Wagon sur des rails, tiré par des cordes à différents angles (forces et angle α),
    // formule du travail en filigrane
    wagon(ctx, w, h, c) {
      const p = 26;
      ctx.strokeStyle = c; ctx.fillStyle = c; ctx.lineWidth = 1;
      for (let x = 0, i = 0; x <= w; x += p, i++) { ctx.globalAlpha = i % 5 ? .05 : .11; trait(ctx, x, 0, x, h); }
      for (let y = 0, i = 0; y <= h; y += p, i++) { ctx.globalAlpha = i % 5 ? .05 : .11; trait(ctx, 0, y, w, y); }
      function fleche(x, y, ang, L, a) {
        const r = ang * Math.PI / 180, ux = Math.cos(r), uy = -Math.sin(r), t = 11;
        const x2 = x + L * ux, y2 = y + L * uy;
        ctx.globalAlpha = a; ctx.lineWidth = 3; trait(ctx, x, y, x2 - ux * 5, y2 - uy * 5);
        ctx.beginPath(); ctx.moveTo(x2, y2);
        ctx.lineTo(x2 - ux * t - uy * t * .45, y2 - uy * t + ux * t * .45);
        ctx.lineTo(x2 - ux * t + uy * t * .45, y2 - uy * t - ux * t * .45); ctx.closePath(); ctx.fill();
      }
      // rails et traverses
      const yR = h * .56;
      for (let x = 4; x < w; x += 24) { ctx.globalAlpha = .14; ctx.lineWidth = 6; trait(ctx, x, yR - 5, x, yR + 19); }
      ctx.globalAlpha = .4; ctx.lineWidth = 2.5; trait(ctx, 0, yR, w, yR); trait(ctx, 0, yR + 14, w, yR + 14);
      // wagons : caisse, fenêtres, roues
      function wagon(x, a) {
        const L = 150, H = 62, y = yR - H - 10;
        ctx.globalAlpha = a; ctx.lineWidth = 2.5; ctx.strokeRect(x, y, L, H);
        ctx.lineWidth = 1.5;
        for (let k = 0; k < 4; k++) ctx.strokeRect(x + 12 + k * 34, y + 12, 24, 20);
        ctx.lineWidth = 2.5;
        [x + 30, x + L - 30].forEach(xr => { ctx.beginPath(); ctx.arc(xr, yR - 4, 9, 0, 7); ctx.stroke(); });
        return [x + L, y + H / 2];
      }
      wagon(w * .1, .25);
      const [xf, yf] = wagon(w * .52, .5);
      // forces : dans le sens du déplacement, en biais, perpendiculaire ; arc de l'angle α
      fleche(xf, yf, 0, 120, .55);
      fleche(xf, yf - 12, 35, 110, .4);
      fleche(xf - 75, yR - 72, 90, 70, .3);
      ctx.globalAlpha = .45; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(xf, yf - 12, 54, -35 * Math.PI / 180, 0); ctx.stroke();
      ctx.font = `600 22px ${police()}`; ctx.fillText('α', xf + 62, yf - 26);
      // formules en filigrane
      ctx.font = `600 20px ${police()}`; ctx.globalAlpha = .22;
      ctx.fillText('W = F × AB × cos α', w * .06, h * .2);
      ctx.fillText('ΔEc = Σ W', w * .7, h * .16);
      ctx.font = `500 17px ${police()}`; ctx.globalAlpha = .16;
      ctx.fillText('Ec = ½ m v²', w * .36, h * .1);
    },

    // Engrenages qui s'entraînent, arcs de cercle avec leur sens de rotation, angle θ ;
    // formules du chapitre en filigrane
    rotation(ctx, w, h, c) {
      const p = 26;
      ctx.strokeStyle = c; ctx.fillStyle = c; ctx.lineWidth = 1;
      for (let x = 0, i = 0; x <= w; x += p, i++) { ctx.globalAlpha = i % 5 ? .05 : .11; trait(ctx, x, 0, x, h); }
      for (let y = 0, i = 0; y <= h; y += p, i++) { ctx.globalAlpha = i % 5 ? .05 : .11; trait(ctx, 0, y, w, y); }
      // roue dentée de centre (cx, cy), rayon r, n dents, tournée de a0
      function engrenage(cx, cy, r, n, a0, a) {
        const d = r * .16, pas = 2 * Math.PI / n;
        ctx.globalAlpha = a; ctx.lineWidth = 2.5; ctx.beginPath();
        for (let k = 0; k < n; k++) {
          const t = a0 + k * pas, pt = (rr, aa) => [cx + rr * Math.cos(aa), cy + rr * Math.sin(aa)];
          [[r - d, t], [r - d, t + pas * .2], [r + d, t + pas * .3], [r + d, t + pas * .55], [r - d, t + pas * .65]].forEach(([rr, aa], j) => {
            const [x, y] = pt(rr, aa);
            if (k === 0 && j === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
          });
        }
        ctx.closePath(); ctx.stroke();
        ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(cx, cy, r * .55, 0, 7); ctx.stroke();
        ctx.beginPath(); ctx.arc(cx, cy, r * .12, 0, 7); ctx.stroke();
        for (let k = 0; k < 4; k++) { const t = a0 + k * Math.PI / 2; trait(ctx, cx + r * .12 * Math.cos(t), cy + r * .12 * Math.sin(t), cx + r * .55 * Math.cos(t), cy + r * .55 * Math.sin(t)); }
      }
      // flèche courbe : arc de centre (cx, cy), de a1 à a2 (radians, sens du canvas), pointe au bout
      function arcFleche(cx, cy, r, a1, a2, a) {
        ctx.globalAlpha = a; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.arc(cx, cy, r, a1, a2, a2 < a1); ctx.stroke();
        const s = a2 > a1 ? 1 : -1, x = cx + r * Math.cos(a2), y = cy + r * Math.sin(a2), tx = -Math.sin(a2) * s, ty = Math.cos(a2) * s, t = 11;
        ctx.beginPath(); ctx.moveTo(x + tx * 4, y + ty * 4);
        ctx.lineTo(x - tx * t - ty * t * .45, y - ty * t + tx * t * .45);
        ctx.lineTo(x - tx * t + ty * t * .45, y - ty * t - tx * t * .45); ctx.closePath(); ctx.fill();
      }
      const r1 = Math.min(110, h * .3), x1 = w * .72, y1 = h * .42, r2 = r1 * .62, x2 = x1 + (r1 + r2) * .97, y2 = y1 + r1 * .35;
      engrenage(x1, y1, r1, 18, .1, .4);
      engrenage(x2 - (r1 + r2) * .02, y2, r2, 11, .25, .3);
      arcFleche(x1, y1, r1 * 1.35, -2.6, -1.7, .45);
      arcFleche(x2, y2, r2 * 1.45, 1.2, .2, .35);
      // cercle, rayon et angle θ (à gauche)
      const cx = w * .22, cy = h * .55, R = Math.min(120, h * .34);
      ctx.globalAlpha = .3; ctx.lineWidth = 2; ctx.setLineDash([6, 6]); ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.stroke(); ctx.setLineDash([]);
      ctx.globalAlpha = .45; trait(ctx, cx, cy, cx + R, cy); trait(ctx, cx, cy, cx + R * Math.cos(-1), cy + R * Math.sin(-1));
      ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(cx, cy, R, -1, 0); ctx.stroke();
      ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, cy, 34, -1, 0); ctx.stroke();
      ctx.font = `600 22px ${police()}`; ctx.fillText('θ', cx + 42, cy - 14);
      // formules en filigrane
      ctx.font = `600 20px ${police()}`; ctx.globalAlpha = .22;
      ctx.fillText('ω = θ / Δt', w * .38, h * .2);
      ctx.fillText('M = F × d', w * .46, h * .86);
      ctx.font = `500 17px ${police()}`; ctx.globalAlpha = .16;
      ctx.fillText('v = R × ω', w * .05, h * .14);
      ctx.fillText('1 tr/min = 2π rad / 60 s', w * .4, h * .5);
    },

    // Château d'eau relié à une maison, niveaux de l'eau en pointillés et hauteur h,
    // récipient avec les forces pressantes perpendiculaires aux parois ; formules en filigrane
    fluides(ctx, w, h, c, rnd) {
      const p = 26;
      ctx.strokeStyle = c; ctx.fillStyle = c; ctx.lineWidth = 1;
      for (let x = 0, i = 0; x <= w; x += p, i++) { ctx.globalAlpha = i % 5 ? .05 : .11; trait(ctx, x, 0, x, h); }
      for (let y = 0, i = 0; y <= h; y += p, i++) { ctx.globalAlpha = i % 5 ? .05 : .11; trait(ctx, 0, y, w, y); }
      function fleche(x, y, dx, dy, a) {
        const L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L, t = 10;
        ctx.globalAlpha = a; ctx.lineWidth = 2.5; trait(ctx, x, y, x + dx - ux * 4, y + dy - uy * 4);
        ctx.beginPath(); ctx.moveTo(x + dx, y + dy);
        ctx.lineTo(x + dx - ux * t - uy * t * .45, y + dy - uy * t + ux * t * .45);
        ctx.lineTo(x + dx - ux * t + uy * t * .45, y + dy - uy * t - ux * t * .45); ctx.closePath(); ctx.fill();
      }
      // sol, château d'eau (cuve évasée sur un pilier) et maison
      const k = Math.min(1.1, h / 440), sol = h * .66, xc = w * .74, yS = sol - 210 * k;
      ctx.globalAlpha = .35; ctx.lineWidth = 2; trait(ctx, 0, sol, w, sol);
      ctx.globalAlpha = .14; ctx.beginPath(); ctx.moveTo(xc - 46 * k, yS); ctx.lineTo(xc + 46 * k, yS); ctx.lineTo(xc + 36 * k, yS + 70 * k); ctx.lineTo(xc - 36 * k, yS + 70 * k); ctx.closePath(); ctx.fill();
      ctx.globalAlpha = .5; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(xc - 52 * k, yS - 18 * k); ctx.lineTo(xc - 36 * k, yS + 72 * k); ctx.lineTo(xc + 36 * k, yS + 72 * k); ctx.lineTo(xc + 52 * k, yS - 18 * k); ctx.stroke();
      ctx.strokeRect(xc - 12 * k, yS + 72 * k, 24 * k, sol - yS - 72 * k);
      const xm = xc + 150 * k, ym = sol - 60 * k;
      ctx.globalAlpha = .4; ctx.strokeRect(xm - 45 * k, ym, 90 * k, 60 * k);
      ctx.beginPath(); ctx.moveTo(xm - 55 * k, ym); ctx.lineTo(xm, ym - 40 * k); ctx.lineTo(xm + 55 * k, ym); ctx.stroke();
      ctx.lineWidth = 3; ctx.globalAlpha = .3; ctx.beginPath(); ctx.moveTo(xc, yS + 72 * k); ctx.lineTo(xc, sol + 8); ctx.lineTo(xm, sol + 8); ctx.lineTo(xm, sol - 8); ctx.stroke();
      // niveaux en pointillés et cote h entre la surface et l'arrivée d'eau
      ctx.lineWidth = 1.5; ctx.setLineDash([7, 6]); ctx.globalAlpha = .35;
      trait(ctx, xc + 52 * k, yS, xm + 95 * k, yS); trait(ctx, xm, sol - 8, xm + 95 * k, sol - 8); ctx.setLineDash([]);
      fleche(xm + 85 * k, (yS + sol) / 2, 0, -(sol - yS) / 2 + 4, .5); fleche(xm + 85 * k, (yS + sol) / 2, 0, (sol - yS) / 2 - 12, .5);
      ctx.font = `600 22px ${police()}`; ctx.globalAlpha = .45; ctx.fillText('h', xm + 93 * k, (yS + sol) / 2 + 8);
      // récipient rempli de liquide : bulles et forces pressantes perpendiculaires aux parois
      const x0 = w * .05, x1 = w * .2, y0 = h * .14, y1 = h * .56;
      ctx.globalAlpha = .1; ctx.fillRect(x0, y0 + 20, x1 - x0, y1 - y0 - 20);
      ctx.globalAlpha = .45; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0, y1); ctx.lineTo(x1, y1); ctx.lineTo(x1, y0); ctx.stroke();
      ctx.lineWidth = 1.5; trait(ctx, x0, y0 + 20, x1, y0 + 20);
      for (let i = 0; i < 4; i++) {
        const y = y0 + 50 + i * (y1 - y0 - 60) / 3, L = 18 + i * 12;
        fleche(x1, y, L, 0, .35); fleche(x0, y, -L, 0, .35);
      }
      fleche((x0 + x1) / 2, y1, 0, 52, .4);
      for (let i = 0; i < 14; i++) {
        ctx.globalAlpha = .18 + rnd() * .2; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(x0 + 12 + rnd() * (x1 - x0 - 24), y0 + 34 + rnd() * (y1 - y0 - 44), 2 + rnd() * 4, 0, 7); ctx.stroke();
      }
      // formules en filigrane
      ctx.font = `600 20px ${police()}`; ctx.globalAlpha = .22;
      ctx.fillText('P = F / S', w * .3, h * .1);
      ctx.fillText('Pbas = Phaut + ρ g h', w * .44, h * .58);
      ctx.font = `500 17px ${police()}`; ctx.globalAlpha = .16;
      ctx.fillText('1 bar = 10⁵ Pa', w * .5, h * .24);
      ctx.fillText('Prel = Pabs − Patm', w * .26, h * .7);
    },

    // Soleil et ses rayons, photons (traits ondulés) qui tombent sur un panneau
    // photovoltaïque incliné ; formules en filigrane
    lumiere(ctx, w, h, c, rnd) {
      const p = 26;
      ctx.strokeStyle = c; ctx.fillStyle = c; ctx.lineWidth = 1;
      for (let x = 0, i = 0; x <= w; x += p, i++) { ctx.globalAlpha = i % 5 ? .04 : .09; trait(ctx, x, 0, x, h); }
      for (let y = 0, i = 0; y <= h; y += p, i++) { ctx.globalAlpha = i % 5 ? .04 : .09; trait(ctx, 0, y, w, y); }
      const k = Math.min(1.1, h / 440);
      // soleil : disque et rayons
      const xs = w * .86, ys = h * .2, r = 46 * k;
      ctx.globalAlpha = .16; ctx.beginPath(); ctx.arc(xs, ys, r, 0, 7); ctx.fill();
      ctx.globalAlpha = .5; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(xs, ys, r, 0, 7); ctx.stroke();
      for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; ctx.globalAlpha = .4; trait(ctx, xs + (r + 10) * Math.cos(a), ys + (r + 10) * Math.sin(a), xs + (r + 26 * k) * Math.cos(a), ys + (r + 26 * k) * Math.sin(a)); }
      // panneau incliné : cadre et cellules
      const x0 = w * .5, y0 = h * .66, L = 260 * k, Hp = 110 * k, dx = 70 * k;
      const P = (u, v) => [x0 + u * L + v * dx, y0 - v * Hp + u * 18 * k];
      ctx.globalAlpha = .12; ctx.beginPath(); ctx.moveTo(...P(0, 0)); ctx.lineTo(...P(1, 0)); ctx.lineTo(...P(1, 1)); ctx.lineTo(...P(0, 1)); ctx.closePath(); ctx.fill();
      ctx.globalAlpha = .45; ctx.lineWidth = 2.5; ctx.stroke();
      ctx.lineWidth = 1.2; ctx.globalAlpha = .3;
      for (let i = 1; i < 6; i++) trait(ctx, ...P(i / 6, 0), ...P(i / 6, 1));
      for (let j = 1; j < 3; j++) trait(ctx, ...P(0, j / 3), ...P(1, j / 3));
      ctx.lineWidth = 2.5; ctx.globalAlpha = .35; trait(ctx, ...P(.3, 0), P(.3, 0)[0], h * .9); trait(ctx, ...P(.8, 0), P(.8, 0)[0], h * .9);
      // photons : traits ondulés du soleil vers le panneau
      function onde(x1, y1, x2, y2, a) {
        const n = 60, Lx = x2 - x1, Ly = y2 - y1, Ln = Math.hypot(Lx, Ly), ux = Lx / Ln, uy = Ly / Ln;
        ctx.globalAlpha = a; ctx.lineWidth = 2; ctx.beginPath();
        for (let i = 0; i <= n; i++) { const t = i / n, v = 7 * Math.sin(t * Math.PI * 2 * 5); const x = x1 + t * Lx - v * uy, y = y1 + t * Ly + v * ux; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
        ctx.stroke();
        const t = 11; ctx.beginPath(); ctx.moveTo(x2, y2); ctx.lineTo(x2 - ux * t - uy * t * .45, y2 - uy * t + ux * t * .45); ctx.lineTo(x2 - ux * t + uy * t * .45, y2 - uy * t - ux * t * .45); ctx.closePath(); ctx.fill();
      }
      [[.25, .35], [.45, .6], [.65, .45], [.85, .7]].forEach(([u, v], i) => { const [x, y] = P(u, v); onde(xs - r * .8, ys + r * .5, x, y - 6, .3 + i * .05); });
      // photon et électron arraché (effet photoélectrique)
      ctx.globalAlpha = .4; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(w * .3, h * .5, 9, 0, 7); ctx.stroke();
      trait(ctx, w * .3 - 5, h * .5, w * .3 + 5, h * .5);
      onde(w * .06, h * .2, w * .28, h * .46, .3);
      // formules en filigrane
      ctx.font = `600 20px ${police()}`; ctx.globalAlpha = .22;
      ctx.fillText('E = h × f', w * .06, h * .78);
      ctx.fillText('λ = c / f', w * .38, h * .12);
      ctx.font = `500 17px ${police()}`; ctx.globalAlpha = .16;
      ctx.fillText('P = U × I', w * .06, h * .9);
      ctx.fillText('Q = m c (Tf − Ti)', w * .4, h * .3);
      ctx.fillText('r = Pu / Pa', w * .62, h * .92);
    },

    // Signal périodique non sinusoïdal (somme d'harmoniques) en haut, raies de son spectre en dessous
    spectre(ctx, w, h, c) {
      const p = 24;
      ctx.strokeStyle = c; ctx.fillStyle = c; ctx.lineWidth = 1;
      for (let x = 0, i = 0; x <= w; x += p, i++) { ctx.globalAlpha = i % 5 ? .05 : .11; trait(ctx, x, 0, x, h); }
      for (let y = 0, i = 0; y <= h; y += p, i++) { ctx.globalAlpha = i % 5 ? .05 : .11; trait(ctx, 0, y, w, y); }
      // signal : fondamental et harmoniques (amplitudes de l'exemple du cours), harmoniques en fin trait
      // (seule la partie haute du canevas est visible : il est plus haut que l'en-tête pour la parallaxe)
      const A = [1.5, 1, .67, .17], per = Math.max(230, w / 4.2), om = 2 * Math.PI / per, ys = h * .2, k = h * .052;
      const s = x => A.reduce((S, a, i) => S + a * Math.sin((i + 1) * om * x), 0);
      ctx.globalAlpha = .3; ctx.lineWidth = 1.5; trait(ctx, 0, ys, w, ys);
      A.forEach((a, i) => { ctx.globalAlpha = .16; ctx.lineWidth = 1.3; courbe(ctx, x => ys - k * a * Math.sin((i + 1) * om * x), 0, w); });
      ctx.globalAlpha = .75; ctx.lineWidth = 2.6; courbe(ctx, x => ys - k * s(x), 0, w);
      // spectre : axe des fréquences et raies verticales à f1, 2 f1, 3 f1…
      const yb = h * .57, x0 = w * .08, pas = Math.max(70, Math.min(140, w / 11)), H = h * .17;
      ctx.globalAlpha = .45; ctx.lineWidth = 1.5; trait(ctx, x0, yb, w, yb); trait(ctx, x0, yb, x0, yb - H * 1.25);
      const raies = [.62, 1, .66, .45, .11, .3, .22, .08, .16, .12, .05, .09];
      raies.forEach((a, i) => {
        const x = x0 + (i + 1) * pas;
        if (x > w - 10) return;
        ctx.globalAlpha = .6; ctx.lineWidth = 4; trait(ctx, x, yb, x, yb - H * a);
        ctx.globalAlpha = .35; ctx.font = `600 13px ${police()}`; ctx.fillText(i ? `${i + 1}f₁` : 'f₁', x - 8, yb + 17);
      });
      ctx.globalAlpha = .6; ctx.lineWidth = 6; trait(ctx, x0 + 2, yb, x0 + 2, yb - H * .5);
      // formules en filigrane
      ctx.font = `600 19px ${police()}`; ctx.globalAlpha = .2;
      ctx.fillText('fₙ = n × f₁', w * .7, h * .37);
      ctx.fillText('ω = 2πf', w * .05, h * .37);
      ctx.font = `500 16px ${police()}`; ctx.globalAlpha = .15;
      ctx.fillText('s(t) = a₀ + Σ aₙ sin(n ω t)', w * .36, h * .4);
      ctx.fillText('f = 1 / T', w * .86, h * .05);
    },

    // Pylône d'antenne relais qui émet des ondes (arcs), onde modulée en amplitude qui traverse l'en-tête
    antenne(ctx, w, h, c) {
      const p = 24;
      ctx.strokeStyle = c; ctx.fillStyle = c; ctx.lineWidth = 1;
      for (let x = 0, i = 0; x <= w; x += p, i++) { ctx.globalAlpha = i % 5 ? .05 : .11; trait(ctx, x, 0, x, h); }
      for (let y = 0, i = 0; y <= h; y += p, i++) { ctx.globalAlpha = i % 5 ? .05 : .11; trait(ctx, 0, y, w, y); }
      // onde modulée en amplitude : porteuse rapide, enveloppe (le signal modulant) en pointillés
      // (seule la partie haute du canevas est visible : il est plus haut que l'en-tête pour la parallaxe)
      const ys = h * .17, A = h * .06, per = Math.max(260, w / 3.4), por = 13;
      const env = x => 1 + .7 * Math.sin(2 * Math.PI * x / per);
      ctx.globalAlpha = .38; ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let x = 0; x <= w; x++) { const y = ys - A * env(x) * Math.sin(2 * Math.PI * x / por); x ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
      ctx.stroke();
      ctx.globalAlpha = .32; ctx.lineWidth = 1.4; ctx.setLineDash([6, 5]);
      courbe(ctx, x => ys - A * env(x), 0, w); courbe(ctx, x => ys + A * env(x), 0, w);
      ctx.setLineDash([]);
      // pylône à droite : treillis, puis arcs d'ondes émis par l'antenne au sommet
      const xm = w * .84, yb = h * .66, yt = h * .3, lb = Math.min(70, w * .06), lt = 8;
      ctx.globalAlpha = .5; ctx.lineWidth = 2;
      trait(ctx, xm - lb, yb, xm - lt, yt); trait(ctx, xm + lb, yb, xm + lt, yt);
      ctx.lineWidth = 1.2;
      for (let k = 0; k < 7; k++) {
        const y1 = yb - (yb - yt) * k / 7, y2 = yb - (yb - yt) * (k + 1) / 7;
        const l1 = lb - (lb - lt) * k / 7, l2 = lb - (lb - lt) * (k + 1) / 7;
        trait(ctx, xm - l1, y1, xm + l2, y2); trait(ctx, xm + l1, y1, xm - l2, y2); trait(ctx, xm - l2, y2, xm + l2, y2);
      }
      ctx.lineWidth = 3; trait(ctx, xm, yt, xm, yt - h * .07);
      ctx.lineWidth = 1.8;
      [26, 50, 76, 104].forEach((r, i) => {
        ctx.globalAlpha = .5 - i * .1;
        ctx.beginPath(); ctx.arc(xm, yt - h * .07, r, -Math.PI * .85, -Math.PI * .58); ctx.stroke();
        ctx.beginPath(); ctx.arc(xm, yt - h * .07, r, -Math.PI * .42, -Math.PI * .15); ctx.stroke();
      });
      // formules en filigrane
      ctx.font = `600 19px ${police()}`; ctx.globalAlpha = .2;
      ctx.fillText('λ = c / f', w * .06, h * .4);
      ctx.fillText('L = λ / 2', w * .55, h * .44);
      ctx.font = `500 16px ${police()}`; ctx.globalAlpha = .15;
      ctx.fillText('c = 3,00 × 10⁸ m·s⁻¹', w * .3, h * .52);
      ctx.fillText('bande occupée = 2 fₕ', w * .62, h * .06);
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
