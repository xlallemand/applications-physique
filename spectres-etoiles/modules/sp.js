/* ============================================================
   Dessin des spectres — application « Spectres et étoiles »

   SP.spectre(conteneur, options)   spectre dessiné dans un canvas
       options = {
         fond: 'noir' | 'continu',      fond noir (émission de raies) ou fond coloré
         T: 5500,                        température du corps chauffé (°C) ; null = lumière blanche
         rendu: 'realiste' | 'coupure',  luminosité selon la température ou bande qui s'arrête net
         emission: [[λ, intensité]],     raies colorées (fond noir)
         absorption: [[λ, noirceur]],    raies noires (0 à 1)
         bandes: [[λa, λb, noirceur]],   bandes d'absorption larges
         hauteur: 44, axe: true          hauteur du spectre (px), graduation en nm
       }
       → { canvas, maj(options), x(λ), lambda(x) }
   SP.profil(conteneur, options)    courbe d'intensité et échelle de température
   SP.couleurEtoile(T)              couleur d'une étoile à la température T (°C)
   SP.ELEMENTS                      raies d'émission des éléments (nm)
   ============================================================ */
(function () {
  'use strict';

  const L0 = 400, L1 = 800;          // domaine affiché (nm)
  const PAD = 16;                    // marge à gauche et à droite du spectre (px)
  const C2 = 1.4388e7;               // constante de la loi de Planck h·c/k (nm·K)
  const WIEN = 2.898e6;              // constante de Wien (nm·K)
  const K = 273.15;

  /* ---------- Couleur d'une longueur d'onde (approximation usuelle) ---------- */
  function rgb(l) {
    let r = 0, g = 0, b = 0;
    if (l < 440) { r = (440 - l) / 60; b = 1; }
    else if (l < 490) { g = (l - 440) / 50; b = 1; }
    else if (l < 510) { g = 1; b = (510 - l) / 20; }
    else if (l < 580) { r = (l - 510) / 70; g = 1; }
    else if (l < 645) { r = 1; g = (645 - l) / 65; }
    else r = 1;
    // l'œil est moins sensible aux extrémités du visible
    let f = 1;
    if (l < 420) f = .45 + .55 * (l - 380) / 40;
    else if (l > 700) f = Math.max(.4, .4 + .6 * (780 - l) / 80);
    return [r, g, b].map(c => Math.round(255 * Math.pow(Math.max(0, c * f), .8)));
  }

  /* ---------- Fond continu d'un corps chauffé (loi de Planck) ---------- */
  const planck = (l, TK) => 1 / (Math.pow(l / 1000, 5) * Math.expm1(C2 / (l * TK)));
  // luminosité relative (0 à 1) à la longueur d'onde l, pour une température T en °C
  function continu(l, T, rendu) {
    if (T == null) return 1;                                   // lumière blanche
    const TK = T + K, lm = Math.min(Math.max(WIEN / TK, L0), L1);
    const r = planck(l, TK) / planck(lm, TK);
    if (rendu === 'coupure') return Math.min(1, Math.max(0, (r - .06) / .06));
    return Math.pow(r, .5);
  }
  // 1 dans la bande [a, b], décroît sur 12 nm de part et d'autre
  const bord = (l, a, b) => (l >= a && l <= b ? 1 : Math.max(0, 1 - Math.min(Math.abs(l - a), Math.abs(l - b)) / 12));

  function police() {
    return getComputedStyle(document.body).fontFamily || 'sans-serif';
  }

  /* ---------- Spectre ---------- */
  function dessiner(cv, o, w) {
    const dpr = window.devicePixelRatio || 1, h = o.hauteur || 44, ha = o.axe === false ? 0 : 24;
    cv.width = Math.round(w * dpr); cv.height = Math.round((h + ha) * dpr);
    cv.style.height = (h + ha) + 'px';
    const ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h + ha);
    const lw = w - 2 * PAD, X = l => PAD + (l - L0) / (L1 - L0) * lw;

    // fond : noir, ou continu colonne par colonne
    if (o.fond === 'noir') { ctx.fillStyle = '#000'; ctx.fillRect(PAD, 0, lw, h); }
    else {
      const n = Math.ceil(lw * dpr);
      for (let i = 0; i < n; i++) {
        const l = L0 + (i + .5) / n * (L1 - L0);
        let v = continu(l, o.T, o.rendu);
        (o.bandes || []).forEach(([a, b, f]) => { v *= 1 - f * bord(l, a, b); });
        const c = rgb(l);
        ctx.fillStyle = `rgb(${c[0] * v | 0},${c[1] * v | 0},${c[2] * v | 0})`;
        ctx.fillRect(PAD + i / dpr, 0, 1.6 / dpr, h);
      }
    }

    // raies (au moins 2 px de large)
    const larg = Math.max(2, 1.3 * lw / (L1 - L0));
    (o.absorption || []).forEach(([l, f]) => {
      ctx.fillStyle = `rgba(0,0,0,${f})`;
      ctx.fillRect(X(l) - larg / 2, 0, larg, h);
    });
    (o.emission || []).forEach(([l, f]) => {
      const c = rgb(l).map(v => Math.round(v * (.35 + .65 * f)));
      ctx.save();
      ctx.shadowColor = `rgb(${c})`; ctx.shadowBlur = 5;
      ctx.fillStyle = `rgb(${c})`;
      ctx.fillRect(X(l) - larg / 2, 0, larg, h);
      ctx.restore();
    });

    // aide visuelle : début du spectre côté violet (trait blanc en pointillés)
    if (o.repere && o.repere > L0 + 2) {
      ctx.save(); ctx.setLineDash([4, 3]); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(X(o.repere), 2); ctx.lineTo(X(o.repere), h - 2); ctx.stroke(); ctx.restore();
    }

    // cadre
    ctx.strokeStyle = 'rgba(22,24,29,.35)'; ctx.lineWidth = 1;
    ctx.strokeRect(PAD - .5, .5, lw + 1, h - 1);

    // graduation en nm
    if (ha) {
      ctx.fillStyle = '#55585f'; ctx.strokeStyle = '#8d8f94';
      ctx.font = `600 11px ${police()}`; ctx.textBaseline = 'top';
      for (let l = L0; l <= L1; l += 50) {
        const x = Math.round(X(l)) + .5, grand = l % 100 === 0;
        ctx.beginPath(); ctx.moveTo(x, h); ctx.lineTo(x, h + (grand ? 6 : 4)); ctx.stroke();
        if (grand) {
          const t = l === L1 ? '800 nm' : String(l);
          ctx.textAlign = l === L1 ? 'right' : 'center';
          ctx.fillText(t, l === L1 ? w - 1 : x, h + 8);
        }
      }
      // aide visuelle : triangles sous les raies noires
      ctx.fillStyle = '#5a3fc4';
      (o.marques || []).forEach(l => {
        const x = X(l);
        ctx.beginPath(); ctx.moveTo(x, h + 1); ctx.lineTo(x - 4, h + 8); ctx.lineTo(x + 4, h + 8); ctx.fill();
      });
    }
  }

  // longueur d'onde à partir de laquelle le spectre d'un corps chauffé devient visible côté violet
  function debutVisible(T) {
    for (let l = L0; l <= L1; l++) if (continu(l, T) >= .3) return l;
    return L1;
  }

  function spectre(el, o) {
    const cv = document.createElement('canvas');
    cv.className = 'sp-canvas';
    el.appendChild(cv);
    let opts = Object.assign({}, o), w = 0;
    const tracer = force => {
      const nw = el.clientWidth;
      if (nw > 0 && (force || nw !== w)) { w = nw; dessiner(cv, opts, w); }
    };
    if (window.ResizeObserver) new ResizeObserver(() => tracer(false)).observe(el);
    else window.addEventListener('resize', () => tracer(false));
    tracer(true);
    return {
      canvas: cv,
      options: () => opts,
      maj(n) { opts = Object.assign({}, opts, n); tracer(true); },
      // position (px, dans le conteneur) d'une longueur d'onde, et l'inverse
      x: l => PAD + (l - L0) / (L1 - L0) * (el.clientWidth - 2 * PAD),
      lambda: x => L0 + (x - PAD) / (el.clientWidth - 2 * PAD) * (L1 - L0),
    };
  }

  /* ---------- Profil d'intensité et échelle de température ----------
     options = { T, max: true (repère du maximum), echelle: true (échelle en °C) }  */
  const P0 = 200, P1 = 1500;                         // domaine du profil (nm)
  const milliers = t => String(t).replace(/(\d)(\d{3})$/, '$1\u202f$2');
  function dessinerProfil(cv, o, w) {
    const dpr = window.devicePixelRatio || 1, hc = 150, hb = o.echelle === false ? 34 : 78, H = hc + hb;
    cv.width = Math.round(w * dpr); cv.height = Math.round(H * dpr); cv.style.height = H + 'px';
    const ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, H);
    const g = 22, d = 14, lw = w - g - d, X = l => g + (l - P0) / (P1 - P0) * lw;
    const f = police();

    // bande du visible, colorée, sous la courbe
    for (let l = L0; l < L1; l += 2) {
      const c = rgb(l);
      ctx.fillStyle = `rgba(${c},.28)`;
      ctx.fillRect(X(l), 8, X(l + 2) - X(l) + .6, hc - 8);
    }
    ctx.fillStyle = '#8d8f94'; ctx.font = `700 10px ${f}`; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillText('visible', X(600), 10);
    const etroit = lw < 480;
    ctx.textAlign = 'left'; ctx.fillText(etroit ? 'UV' : 'ultraviolet', X(P0) + 4, 10);
    ctx.textAlign = 'right'; ctx.fillText('infrarouge', X(P1) - 2, 10);

    // courbe normalisée
    const TK = o.T + K, lm = WIEN / TK, pm = planck(Math.max(lm, P0), TK);
    const Y = v => hc - 4 - v * (hc - 30);
    ctx.beginPath();
    for (let i = 0; i <= lw; i++) {
      const l = P0 + i / lw * (P1 - P0), y = Y(planck(l, TK) / pm);
      i ? ctx.lineTo(g + i, y) : ctx.moveTo(g + i, y);
    }
    ctx.strokeStyle = '#16181d'; ctx.lineWidth = 2.5; ctx.stroke();

    // axes
    ctx.strokeStyle = '#16181d'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(g, 4); ctx.lineTo(g, hc); ctx.lineTo(g + lw, hc); ctx.stroke();
    ctx.save(); ctx.translate(10, hc / 2); ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = '#55585f'; ctx.font = `700 10px ${f}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('intensité', 0, 0); ctx.restore();

    // graduation en nm
    ctx.fillStyle = '#55585f'; ctx.font = `600 11px ${f}`; ctx.textBaseline = 'top';
    for (let l = 250; l <= P1; l += 250) {
      const x = Math.round(X(l)) + .5, grand = l % 500 === 0;
      ctx.beginPath(); ctx.moveTo(x, hc); ctx.lineTo(x, hc + (grand ? 6 : 4)); ctx.stroke();
      if (!grand) continue;
      ctx.textAlign = l === P1 ? 'right' : 'center';
      ctx.fillText(l === P1 ? '1500 nm' : String(l), l === P1 ? w - 2 : x, hc + 7);
    }

    // échelle de température : la position du maximum donne directement T
    if (o.echelle !== false) {
      const ye = hc + 44;
      ctx.fillStyle = '#3f2a93'; ctx.font = `800 10px ${f}`; ctx.textAlign = 'left';
      ctx.fillText('TEMPÉRATURE (°C) SI LE MAXIMUM EST ICI', g, ye - 13);
      ctx.strokeStyle = '#5a3fc4'; ctx.lineWidth = 2;
      const grad = etroit ? [2000, 2500, 3000, 4000, 6000] : [2000, 2500, 3000, 4000, 5000, 6000, 8000, 10000];
      ctx.beginPath(); ctx.moveTo(X(WIEN / (grad[grad.length - 1] + K)), ye); ctx.lineTo(g + lw, ye); ctx.stroke();
      ctx.font = `700 11px ${f}`; ctx.fillStyle = '#3f2a93';
      grad.forEach(t => {
        const x = Math.round(X(WIEN / (t + K))) + .5;
        ctx.beginPath(); ctx.moveTo(x, ye - 4); ctx.lineTo(x, ye + 4); ctx.stroke();
        ctx.textAlign = 'center';
        ctx.fillText(milliers(t), x, ye + 7);
      });
    }

    // repère du maximum
    if (o.max !== false && lm >= P0 && lm <= P1) {
      const x = X(lm), y = Y(1);
      ctx.setLineDash([4, 4]); ctx.strokeStyle = '#5a3fc4'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, o.echelle === false ? hc : hc + 44); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#5a3fc4'; ctx.beginPath(); ctx.arc(x, y, 5, 0, 7); ctx.fill();
    }
  }
  function profil(el, o) {
    const cv = document.createElement('canvas');
    cv.className = 'sp-canvas';
    el.appendChild(cv);
    let opts = Object.assign({}, o), w = 0;
    const tracer = force => {
      const nw = el.clientWidth;
      if (nw > 0 && (force || nw !== w)) { w = nw; dessinerProfil(cv, opts, w); }
    };
    if (window.ResizeObserver) new ResizeObserver(() => tracer(false)).observe(el);
    else window.addEventListener('resize', () => tracer(false));
    tracer(true);
    return { canvas: cv, maj(n) { opts = Object.assign({}, opts, n); tracer(true); } };
  }

  /* ---------- Couleur apparente d'une étoile (corps noir) ---------- */
  const TEINTES = [
    [1000, [255, 56, 0]], [1500, [255, 109, 0]], [2000, [255, 137, 18]], [2500, [255, 161, 72]], [3000, [255, 180, 107]],
    [3500, [255, 195, 138]], [4000, [255, 206, 166]], [4500, [255, 217, 188]], [5000, [255, 225, 206]], [5500, [255, 234, 217]],
    [6000, [255, 243, 239]], [6500, [255, 249, 253]], [7000, [243, 242, 255]], [8000, [227, 233, 255]], [10000, [207, 218, 255]],
    [15000, [181, 201, 255]], [20000, [168, 192, 255]], [30000, [159, 184, 255]], [40000, [155, 181, 255]],
  ];
  function couleurEtoile(T) {
    const TK = T + K;
    if (TK <= TEINTES[0][0]) return `rgb(${TEINTES[0][1]})`;
    for (let i = 1; i < TEINTES.length; i++) {
      if (TK <= TEINTES[i][0]) {
        const [a, ca] = TEINTES[i - 1], [b, cb] = TEINTES[i], u = (TK - a) / (b - a);
        return `rgb(${ca.map((v, k) => Math.round(v + u * (cb[k] - v)))})`;
      }
    }
    return `rgb(${TEINTES[TEINTES.length - 1][1]})`;
  }

  /* ---------- Raies d'émission (λ en nm, intensité relative) ---------- */
  const ELEMENTS = {
    H:  { nom: 'Hydrogène', raies: [[410.2, .5], [434.0, .6], [486.1, .8], [656.3, 1]] },
    He: { nom: 'Hélium', raies: [[447.1, .6], [471.3, .3], [492.2, .4], [501.6, .6], [587.6, 1], [667.8, .6], [706.5, .5]] },
    Na: { nom: 'Sodium', raies: [[568.8, .3], [589.0, 1], [589.6, .9], [616.1, .3]] },
    Mg: { nom: 'Magnésium', raies: [[470.3, .3], [516.7, .6], [517.3, .8], [518.4, 1], [552.8, .5]] },
    Ca: { nom: 'Calcium', raies: [[422.7, 1], [443.5, .4], [445.5, .5], [558.9, .4], [612.2, .6], [616.2, .6], [643.9, .6]] },
    Fe: { nom: 'Fer', raies: [[404.6, .6], [426.0, .5], [430.8, .6], [438.4, .8], [440.5, .6], [495.7, .4], [527.0, .7], [532.8, .6], [537.1, .5]] },
    Hg: { nom: 'Mercure', raies: [[404.7, .6], [435.8, .9], [546.1, 1], [577.0, .6], [579.1, .6]] },
    Li: { nom: 'Lithium', raies: [[460.3, .3], [610.4, .5], [670.8, 1]] },
    K:  { nom: 'Potassium', raies: [[404.4, .4], [766.5, 1], [769.9, .8]] },
    Ba: { nom: 'Baryum', raies: [[455.4, 1], [493.4, .7], [553.5, .9], [614.2, .5], [649.7, .5]] },
    Ne: { nom: 'Néon', raies: [[585.2, .8], [588.2, .4], [603.0, .4], [607.4, .5], [614.3, .7], [616.4, .4], [621.7, .4], [626.6, .5], [633.4, .6], [638.3, .6], [640.2, 1], [650.7, .7], [659.9, .5], [692.9, .6], [703.2, .8]] },
  };

  window.SP = { L0, L1, PAD, rgb, continu, debutVisible, spectre, profil, couleurEtoile, ELEMENTS, WIEN, K };
})();
