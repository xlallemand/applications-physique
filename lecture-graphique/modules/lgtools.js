/* ============================================================
   Outils de l'application « Lecture graphique »

   Fournit :
   - le tracé des graphiques (SVG dont l'unité est le millimètre
     « papier » : la règle et le graphique sont dans le même SVG,
     les mesures sont donc identiques sur tous les écrans)
   - la règle virtuelle (on la fait glisser pour placer son 0,
     puis on fait glisser le curseur ; lecture au mm, loupe)
   - les étiquettes à glisser-déposer (mesures, valeurs, unités)
   - le déroulé d'une question : tableau de proportionnalité,
     calcul (produit en croix), division par le nombre de périodes
   ============================================================ */

(function () {
  'use strict';

  const NS = 'http://www.w3.org/2000/svg';
  const W = 180, H = 112;                 // taille du graphique (mm papier)
  const L = 160;                          // longueur graduée de la règle (mm)
  const TOL = 1.5;                        // tolérance de mesure (mm)
  const ORANGE = '#e8890c', ROSE = '#d61f69';

  /* ---------- Nombres ---------- */
  function fmt(x, dec) {
    if (dec === undefined) dec = 2;
    let s = (Math.round(x * Math.pow(10, dec)) / Math.pow(10, dec)).toFixed(dec);
    if (s.indexOf('.') !== -1) s = s.replace(/0+$/, '').replace(/\.$/, '');
    return s.replace('.', ',').replace('-', '−');
  }
  // arrondi à n chiffres significatifs
  function fmtSig(x, n) {
    if (!x) return '0';
    const dec = Math.max(0, n - 1 - Math.floor(Math.log10(Math.abs(x))));
    return fmt(x, dec);
  }
  function lireNombre(s) {
    const t = String(s).trim().replace(/\s/g, '').replace(',', '.').replace('−', '-');
    if (!/^-?\d*\.?\d+$/.test(t)) return NaN;
    return parseFloat(t);
  }

  /* Symbole avec indice : « U_max » → U<sub>max</sub> (HTML) ou tspan (SVG) */
  function symH(s) { const i = s.indexOf('_'); return i < 0 ? s : s.slice(0, i) + '<sub>' + s.slice(i + 1) + '</sub>'; }
  function symS(s) { const i = s.indexOf('_'); return i < 0 ? s : s.slice(0, i) + `<tspan dy="1.2" font-size="3.2">${s.slice(i + 1)}</tspan>`; }

  /* ============================================================
     GRAPHIQUE
     ============================================================ */
  function repere(def) {
    const P = { x0: 16, x1: 170, yTop: 10, yBot: 96 };
    const ax = def.axeX, ay = def.axeY;
    const mmX = (P.x1 - P.x0) / (ax.max - ax.min);
    const mmY = (P.yBot - P.yTop) / (ay.max - ay.min);
    return {
      P: P, mmX: mmX, mmY: mmY,
      sx: function (v) { return P.x0 + (v - ax.min) * mmX; },
      sy: function (v) { return P.yBot - (v - ay.min) * mmY; },
    };
  }

  /* Formes de signaux périodiques (u : temps en nombre de périodes ;
     valeur entre -1 et 1) */
  const frac = u => u - Math.floor(u);
  const gauss = (v, c, l) => Math.exp(-Math.pow((v - c) / l, 2));
  const FORMES = {
    sinus: u => Math.sin(2 * Math.PI * u),
    triangle: u => 4 * Math.abs(frac(u - 0.25) - 0.5) - 1,
    carre: (u, s) => frac(u) < ((s && s.rc) || 0.5) ? 1 : -1,     // rc : rapport cyclique
    dent: u => 2 * frac(u) - 1,
    // son d'instrument : fondamental + harmoniques
    complexe: u => (Math.sin(2 * Math.PI * u) + 0.55 * Math.sin(4 * Math.PI * u + 0.9) + 0.3 * Math.sin(6 * Math.PI * u + 2.1)) / 1.45,
    // électrocardiogramme : ondes P, QRS et T
    ecg: u => { const v = frac(u); return 0.12 * gauss(v, 0.1, 0.03) - 0.12 * gauss(v, 0.265, 0.01) + gauss(v, 0.3, 0.013) - 0.2 * gauss(v, 0.335, 0.012) + 0.25 * gauss(v, 0.55, 0.05); },
  };
  /* Fonction tracée : signal périodique (def.signal) ou courbe quelconque (def.f) */
  function fonction(def) {
    if (def.f) return def.f;
    const s = def.signal, g = FORMES[s.forme] || FORMES.sinus;
    return t => (s.decal || 0) + s.ampl * g((t - (s.phase || 0)) / s.periode, s);
  }
  // extremums sur la zone visible (échantillonnage fin)
  function extremums(def, f) {
    const ax = def.axeX;
    let mx = -Infinity, mn = Infinity, tMx = ax.min;
    for (let i = 0; i <= 4000; i++) {
      const t = ax.min + (ax.max - ax.min) * i / 4000, v = f(t);
      if (v > mx) { mx = v; tMx = t; }
      if (v < mn) mn = v;
    }
    return { max: mx, min: mn, tMax: tMx };
  }
  // abscisse où la courbe (monotone) atteint y0, par dichotomie
  function abscissePour(def, f, y0) {
    let a = def.axeX.min, b = def.axeX.max;
    const croiss = f(b) > f(a);
    for (let i = 0; i < 60; i++) {
      const m = (a + b) / 2;
      if ((f(m) < y0) === croiss) a = m; else b = m;
    }
    return (a + b) / 2;
  }
  // position (en fraction de période) du premier maximum (signe = 1) ou
  // minimum (signe = -1) d'un motif : points faciles à repérer
  function phaseMax(def, signe) {
    const g = FORMES[def.signal.forme] || FORMES.sinus, k = signe || 1;
    let best = -Infinity, uB = 0;
    for (let i = 0; i < 1000; i++) { const v = k * g(i / 1000, def.signal); if (v > best + 1e-9) { best = v; uB = i / 1000; } }
    return uB;
  }
  // première date ≥ min où se trouve ce point remarquable
  function premierPoint(def, u) {
    const s = def.signal;
    let t = (s.phase || 0) + u * s.periode;
    while (t - s.periode >= def.axeX.min) t -= s.periode;
    while (t < def.axeX.min + s.periode * 0.03) t += s.periode;
    return t;
  }

  /* ---------- Analyse de la question : axe mesuré, distances attendues ---------- */
  function analyser(def, R) {
    const f = fonction(def), g = def.grandeur;
    const A = { f: f, type: def.type };
    if (def.type === 'periode') {
      const T = def.signal.periode, Tmm = T * R.mmX;
      const dispo = Math.min(L, (def.axeX.max - def.axeX.min) * R.mmX);
      A.axe = def.axeX; A.mm = R.mmX; A.exact = T;
      // toutes les mesures de n périodes tenant sous la règle sont acceptées
      const nLim = Math.max(1, Math.floor((dispo - 1) / Tmm));
      A.liste = [];
      for (let n = 1; n <= nLim; n++) A.liste.push({ n: n, mm: n * Tmm });
      // nombre conseillé : le plus grand, entre deux maximums ou deux minimums
      A.nMax = 1;
      [1, -1].forEach(k => {
        const t0 = premierPoint(def, phaseMax(def, k));
        const n = Math.min(nLim, Math.floor((def.axeX.max - t0) / T + 1e-9));
        if (n > A.nMax) { A.nMax = n; A.tDepart = t0; }
      });
      if (!A.tDepart) A.tDepart = premierPoint(def, phaseMax(def, 1));
    } else if (def.type === 'max') {
      const e = extremums(def, f);
      A.axe = def.axeY; A.mm = R.mmY; A.exact = e.max; A.tMax = e.tMax;
      A.liste = [{ n: 1, mm: e.max * R.mmY }]; A.nMax = 1;
    } else if (def.type === 'amplitude') {
      const e = extremums(def, f), amp = (e.max - e.min) / 2;
      A.axe = def.axeY; A.mm = R.mmY; A.exact = amp; A.moy = (e.max + e.min) / 2; A.tMax = e.tMax; A.min = e.min;
      A.liste = [{ n: 1, mm: amp * R.mmY }, { n: 2, mm: 2 * amp * R.mmY }]; A.nMax = 2;
    } else if (def.type === 'lectureY') {
      A.axe = def.axeY; A.mm = R.mmY; A.exact = f(def.x0);
      A.liste = [{ n: 1, mm: A.exact * R.mmY }]; A.nMax = 1;
    } else if (def.type === 'lectureX') {
      A.axe = def.axeX; A.mm = R.mmX; A.exact = abscissePour(def, f, def.y0);
      A.liste = [{ n: 1, mm: (A.exact - def.axeX.min) * R.mmX }]; A.nMax = 1;
    }
    // textes par défaut selon le type de question
    const D = {
      periode: { ligne: cap(g.noms || 'périodes').replace(/s$/, '(s)').replace(/s d'/, "(s) d'"),
        erreur: `Ta mesure ne correspond pas à une ou plusieurs ${g.noms || 'périodes'} : place le 0 de la règle et le curseur sur deux points équivalents du signal (par exemple deux maximums).` },
      max: { ligne: 'Maximum', erreur: "Ta mesure ne correspond pas à la valeur maximale : mesure verticalement la distance entre l'axe des abscisses (valeur 0) et le point le plus haut de la courbe." },
      amplitude: { ligne: 'Amplitude', erreur: "Ta mesure ne correspond pas à l'amplitude : mesure verticalement l'écart entre le minimum et le maximum du signal (crête à crête), ou entre la valeur moyenne et le maximum." },
      lectureY: { ligne: 'Point', erreur: "Ta mesure ne correspond pas au point repéré : mesure verticalement la distance entre l'axe des abscisses (valeur 0) et le point." },
      lectureX: { ligne: 'Point', erreur: "Ta mesure ne correspond pas au point repéré : mesure horizontalement la distance entre l'axe des ordonnées (valeur 0) et le point." },
    }[def.type];
    A.ligne = g.ligne || D.ligne;
    A.erreur = g.erreurMesure || D.erreur;
    return A;
  }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  function dessinerGraphe(def, R, A) {
    const P = R.P, ax = def.axeX, ay = def.axeY;
    const nX = Math.round((ax.max - ax.min) / ax.pas), nY = Math.round((ay.max - ay.min) / ay.pas);
    let h = '';
    // quadrillage aux graduations
    for (let i = 0; i <= nX; i++) { const x = R.sx(ax.min + i * ax.pas); h += `<line x1="${x}" y1="${P.yTop}" x2="${x}" y2="${P.yBot}" stroke="#e6e3dc" stroke-width=".3"/>`; }
    for (let i = 0; i <= nY; i++) { const y = R.sy(ay.min + i * ay.pas); h += `<line x1="${P.x0}" y1="${y}" x2="${P.x1}" y2="${y}" stroke="#e6e3dc" stroke-width=".3"/>`; }
    // axes (l'axe des abscisses passe par 0 s'il est visible)
    const yAxe = (ay.min <= 0 && ay.max >= 0) ? R.sy(0) : P.yBot;
    h += `<line x1="${P.x0}" y1="${yAxe}" x2="${P.x1 + 5}" y2="${yAxe}" stroke="#16181d" stroke-width=".5"/>`;
    h += `<path d="M${P.x1 + 6},${yAxe} l-2.4,-1.2 v2.4z" fill="#16181d"/>`;
    h += `<line x1="${P.x0}" y1="${P.yBot}" x2="${P.x0}" y2="${P.yTop - 5}" stroke="#16181d" stroke-width=".5"/>`;
    h += `<path d="M${P.x0},${P.yTop - 6} l-1.2,2.4 h2.4z" fill="#16181d"/>`;
    // graduations et valeurs
    for (let i = 0; i <= nX; i++) {
      const v = ax.min + i * ax.pas, x = R.sx(v);
      h += `<line x1="${x}" y1="${yAxe - 1.2}" x2="${x}" y2="${yAxe + 1.2}" stroke="#16181d" stroke-width=".4"/>`;
      h += `<text x="${x}" y="${P.yBot + 5.5}" font-size="3.8" text-anchor="middle" fill="#55585f">${fmt(v, 4)}</text>`;
    }
    for (let i = 0; i <= nY; i++) {
      const v = ay.min + i * ay.pas, y = R.sy(v);
      h += `<line x1="${P.x0 - 1.2}" y1="${y}" x2="${P.x0 + 1.2}" y2="${y}" stroke="#16181d" stroke-width=".4"/>`;
      h += `<text x="${P.x0 - 2}" y="${y + 1.3}" font-size="3.8" text-anchor="end" fill="#55585f">${fmt(v, 4)}</text>`;
    }
    h += `<text x="${P.x1 + 6}" y="${P.yBot + 11}" font-size="4" text-anchor="end" font-weight="700" fill="#16181d">${ax.nom} (${ax.unite})</text>`;
    h += `<text x="${P.x0 + 2.5}" y="${P.yTop - 3}" font-size="4" font-weight="700" fill="#16181d">${ay.nom} (${ay.unite})</text>`;
    // courbe (rognée au cadre)
    const f = A.f;
    let d = '';
    for (let i = 0; i <= 1000; i++) {
      const t = ax.min + (ax.max - ax.min) * i / 1000;
      const y = Math.max(P.yTop - 4, Math.min(P.yBot, R.sy(f(t))));
      d += (i ? 'L' : 'M') + R.sx(t).toFixed(2) + ',' + y.toFixed(2);
    }
    h += `<path d="${d}" fill="none" stroke="var(--accent)" stroke-width=".75" stroke-linejoin="round"/>`;
    h += reperageCible(def, R, A);
    return h;
  }

  /* ---------- Repère orange de la grandeur à mesurer ---------- */
  function fleche(x1, y1, x2, y2) {
    // double flèche orange entre deux points
    const lg = Math.hypot(x2 - x1, y2 - y1), ux = (x2 - x1) / lg, uy = (y2 - y1) / lg, px = -uy, py = ux;
    const pointe = (x, y, s) => `M${x},${y} l${s * 2.2 * ux + 1.2 * px},${s * 2.2 * uy + 1.2 * py} l${-2.4 * px},${-2.4 * py}z`;
    return `<line x1="${x1 + ux * 1.5}" y1="${y1 + uy * 1.5}" x2="${x2 - ux * 1.5}" y2="${y2 - uy * 1.5}" stroke="${ORANGE}" stroke-width=".7"/>
      <path d="${pointe(x1, y1, 1)} ${pointe(x2, y2, -1)}" fill="${ORANGE}"/>`;
  }
  const tirets = (x1, y1, x2, y2) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${ORANGE}" stroke-width=".35" stroke-dasharray="1,.8"/>`;
  function etiq(x, y, txt, ancre) {
    const w = Math.max(6, txt.replace(/<[^>]+>/g, '').length * 2.6 + 2.4);
    const x0 = ancre === 'start' ? x : (ancre === 'end' ? x - w : x - w / 2);
    return `<rect x="${x0}" y="${y - 3.9}" width="${w}" height="5" rx="1" fill="#fff" opacity=".9"/>
      <text x="${x0 + w / 2}" y="${y}" font-size="4.2" font-weight="800" text-anchor="middle" fill="#9a5305">${txt}</text>`;
  }
  function reperageCible(def, R, A) {
    const P = R.P, f = A.f, sym = symS(def.grandeur.symbole);
    let h = '';
    if (def.type === 'periode') {
      const s = def.signal;
      // premier motif entier visible, repéré entre deux points équivalents
      const tA = premierPoint(def, phaseMax(def)), tB = tA + s.periode;
      const yRef = R.sy(f(tA + 1e-6)), yF = Math.max(P.yTop - 2, yRef - 5);
      const xA = R.sx(tA), xB = R.sx(tB);
      h += tirets(xA, yRef, xA, yF - 2) + tirets(xB, yRef, xB, yF - 2) + fleche(xA, yF, xB, yF);
      h += etiq((xA + xB) / 2, yF - 1.4, sym);
    } else if (def.type === 'max') {
      const x = R.sx(A.tMax), y0 = R.sy(0), y1 = R.sy(A.exact);
      h += tirets(P.x0, y1, x, y1) + fleche(x, y0, x, y1) + etiq(x + 2, (y0 + y1) / 2 + 1.5, sym, 'start');
    } else if (def.type === 'amplitude') {
      const x = R.sx(A.tMax), ym = R.sy(A.moy), y1 = R.sy(A.moy + A.exact);
      h += `<line x1="${P.x0}" y1="${ym}" x2="${P.x1}" y2="${ym}" stroke="${ORANGE}" stroke-width=".35" stroke-dasharray="2.5,1.5"/>`;
      // niveaux du maximum et du minimum, pour mesurer l'écart crête à crête
      h += tirets(P.x0, y1, P.x1, y1) + tirets(P.x0, R.sy(A.min), P.x1, R.sy(A.min));
      h += `<text x="${P.x1}" y="${ym - 1.2}" font-size="3" text-anchor="end" fill="#9a5305">valeur moyenne</text>`;
      h += fleche(x, ym, x, y1) + etiq(x + 2, (ym + y1) / 2 + 1.5, sym, 'start');
    } else if (def.type === 'lectureY') {
      const x = R.sx(def.x0), y0 = R.sy(0), y1 = R.sy(A.exact);
      h += tirets(x, y0, x, y1) + tirets(x, y1, P.x0, y1);
      h += `<circle cx="${x}" cy="${y1}" r="1.3" fill="${ORANGE}" stroke="#fff" stroke-width=".4"/>`;
      h += etiq(P.x0 + 1.5, y1 - 1.4, sym + ' = ?', 'start');
    } else if (def.type === 'lectureX') {
      const x = R.sx(A.exact), y = R.sy(def.y0), yAxe = (def.axeY.min <= 0) ? R.sy(0) : P.yBot;
      h += tirets(P.x0, y, x, y) + tirets(x, y, x, yAxe);
      h += `<circle cx="${x}" cy="${y}" r="1.3" fill="${ORANGE}" stroke="#fff" stroke-width=".4"/>`;
      h += etiq(x + 1.5, yAxe - 1.6, sym + ' = ?', 'start');
    }
    return `<g pointer-events="none">${h}</g>`;
  }

  /* Plus grande distance d'échelle mesurable sur l'axe utilisé */
  function echelleMax(axe, mm) {
    let k = Math.round((axe.max - axe.min) / axe.pas);
    while (k > 1 && k * axe.pas * mm > L) k--;
    return { mm: k * axe.pas * mm, de: axe.min, a: axe.min + k * axe.pas };
  }

  /* ============================================================
     RÈGLE VIRTUELLE
     ============================================================ */
  function corpsRegle() {
    let c = `<rect x="-4" y="0" width="${L + 8}" height="13" rx="1.2" fill="rgba(255,236,150,.6)" stroke="#b8a55a" stroke-width=".3"/>`;
    for (let mm = 0; mm <= L; mm++) {
      const l = mm % 10 === 0 ? 4.5 : (mm % 5 === 0 ? 3.2 : 2);
      c += `<line x1="${mm}" y1="0" x2="${mm}" y2="${l}" stroke="#3a3522" stroke-width="${mm % 10 ? .15 : .25}"/>`;
      if (mm % 10 === 0) c += `<text x="${mm}" y="8.4" font-size="3" text-anchor="middle" fill="#3a3522">${mm / 10}</text>`;
    }
    return c + `<text x="${L + 2}" y="11.8" font-size="2.2" text-anchor="end" fill="#8a7b3a">cm</text>`;
  }

  function creerRegle(svg, onChange) {
    const st = { ox: 22, oy: 74, rot: 0, cur: 50, sel: 'regle', drag: null };
    const outil = svg.querySelector('.lg-outil');
    const loupeG = svg.querySelector('.lg-loupe');

    const corps = corpsRegle();                       // construit une seule fois

    outil.innerHTML = `<g class="lg-r">
        <rect class="lg-r-bande" x="0" y="-1.8" width="0" height="1.8" fill="${ROSE}" opacity=".7"/>
        <g class="lg-r-corps lg-grip">${corps}<rect class="lg-r-sel" x="-4" y="0" width="${L + 8}" height="13" rx="1.2" fill="none" stroke="var(--accent)" stroke-width=".6"/></g>
        <g class="lg-r-cur lg-grip">
          <rect x="-5" y="-7" width="10" height="21" fill="transparent"/>
          <line x1="0" y1="-5" x2="0" y2="13" stroke="#16181d" stroke-width=".35"/>
          <path d="M0,-1.8 l-1.6,-2.6 h3.2z" fill="#16181d"/>
          <circle class="lg-r-bouton" cx="0" cy="10.2" r="2.4" fill="#16181d" stroke="#fff" stroke-width=".5"/>
        </g>
        <g class="lg-r-etiq" pointer-events="none"><rect x="-8" y="-3.2" width="16" height="4.8" rx="1" fill="#fff" stroke="${ROSE}" stroke-width=".35"/>
          <text x="0" y=".4" font-size="3.3" font-weight="800" text-anchor="middle" fill="${ROSE}"></text></g>
      </g>`;
    const gR = outil.querySelector('.lg-r'), bande = outil.querySelector('.lg-r-bande');
    const gCorps = outil.querySelector('.lg-r-corps'), gCur = outil.querySelector('.lg-r-cur');
    const gEtiq = outil.querySelector('.lg-r-etiq'), tEtiq = gEtiq.querySelector('text');
    const selRect = outil.querySelector('.lg-r-sel'), bouton = outil.querySelector('.lg-r-bouton');

    // loupe (×3) : réutilise la scène avec <use>
    const K = 3, RL = 16;
    loupeG.innerHTML = `<g class="lg-l-pos"><g clip-path="url(#lgClipLoupe)">
        <rect x="${-RL}" y="${-RL}" width="${2 * RL}" height="${2 * RL}" fill="#fff"/>
        <use class="lg-l-use" href="#lgScene" xlink:href="#lgScene"/></g>
        <circle r="${RL}" fill="none" stroke="#16181d" stroke-width=".6"/>
        <line x1="-2" y1="0" x2="2" y2="0" stroke="${ROSE}" stroke-width=".2"/><line x1="0" y1="-2" x2="0" y2="2" stroke="${ROSE}" stroke-width=".2"/></g>`;
    const lPos = loupeG.querySelector('.lg-l-pos'), lUse = loupeG.querySelector('.lg-l-use');
    loupeG.style.display = 'none';

    function borner() {
      st.ox = Math.max(1, Math.min(W - 1, st.ox));
      st.oy = Math.max(1, Math.min(H - 1, st.oy));
    }
    function dessiner() {
      borner();
      // le curseur reste dans le graphique (sinon il deviendrait inattrapable)
      const curMax = st.rot === 0 ? W - 2 - st.ox : st.oy - 2;
      st.cur = Math.max(0, Math.min(st.cur, Math.floor(curMax)));
      gR.setAttribute('transform', `translate(${st.ox},${st.oy}) rotate(${st.rot})`);
      gCur.setAttribute('transform', `translate(${st.cur},0)`);
      bande.setAttribute('width', st.cur);
      gEtiq.setAttribute('transform', `translate(${Math.max(8, st.cur / 2)},-4.2) rotate(${-st.rot})`);
      tEtiq.textContent = fmt(st.cur / 10, 1) + ' cm';
      selRect.style.display = st.sel === 'regle' ? '' : 'none';
      bouton.setAttribute('fill', st.sel === 'curseur' ? 'var(--accent)' : '#16181d');
      if (onChange) onChange(st.cur);
    }
    const rad = () => st.rot * Math.PI / 180;
    function versSvg(e) {
      const m = svg.getScreenCTM();
      return { x: (e.clientX - m.e) / m.a, y: (e.clientY - m.f) / m.d };
    }
    function pointCurseur() { return { x: st.ox + st.cur * Math.cos(rad()), y: st.oy + st.cur * Math.sin(rad()) }; }
    function loupe(f) {
      let cx = f.x, cy = f.y - 27;
      if (cy < RL + 1) cy = f.y + 27;
      cx = Math.max(RL + 1, Math.min(W - RL - 1, cx));
      lPos.setAttribute('transform', `translate(${cx},${cy})`);
      lUse.setAttribute('transform', `scale(${K}) translate(${-f.x},${-f.y})`);
      loupeG.style.display = '';
    }

    function debut(e, quoi) {
      if (st.drag || (e.pointerType === 'mouse' && e.button !== 0)) return;
      e.preventDefault();
      const p = versSvg(e);
      st.sel = quoi;
      st.drag = { quoi: quoi, pid: e.pointerId, dx: p.x - st.ox, dy: p.y - st.oy };
      dessiner();
      loupe(quoi === 'curseur' ? pointCurseur() : { x: st.ox, y: st.oy });
    }
    function bouger(e) {
      if (!st.drag || e.pointerId !== st.drag.pid) return;
      e.preventDefault();
      const p = versSvg(e);
      if (st.drag.quoi === 'curseur') {
        // le curseur se cale sur les graduations (1 mm) : lecture à la règle
        const proj = (p.x - st.ox) * Math.cos(rad()) + (p.y - st.oy) * Math.sin(rad());
        st.cur = Math.max(0, Math.min(L, Math.round(proj)));
      } else {
        st.ox = p.x - st.drag.dx; st.oy = p.y - st.drag.dy;
      }
      dessiner();
      loupe(st.drag.quoi === 'curseur' ? pointCurseur() : { x: st.ox, y: st.oy });
    }
    function fin(e) {
      if (!st.drag || e.pointerId !== st.drag.pid) return;
      st.drag = null;
      loupeG.style.display = 'none';
    }
    gCorps.addEventListener('pointerdown', e => debut(e, 'regle'));
    gCur.addEventListener('pointerdown', e => debut(e, 'curseur'));
    // empêche le défilement / zoom de la page quand le doigt est sur la règle
    // (touch-action n'est pas pris en compte partout sur les éléments SVG)
    [gCorps, gCur].forEach(g => {
      g.addEventListener('touchstart', e => e.preventDefault(), { passive: false });
      g.addEventListener('touchmove', e => e.preventDefault(), { passive: false });
    });
    window.addEventListener('pointermove', bouger, { passive: false });
    window.addEventListener('pointerup', fin);
    window.addEventListener('pointercancel', fin);

    // réglage fin : la règle avance de 0,2 mm, le curseur de 1 mm
    function ajuster(dx, dy) {
      if (st.sel === 'curseur') {
        const s = st.rot === 0 ? dx : -dy;
        st.cur = Math.max(0, Math.min(L, st.cur + s));
      } else {
        st.ox += dx * 0.2; st.oy += dy * 0.2;
      }
      dessiner();
    }
    function clavier(e) {
      const tag = (e.target && e.target.tagName) || '';
      if (tag === 'INPUT' || tag === 'TEXTAREA' || !document.body.contains(svg)) return;
      const dir = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
      if (!dir) return;
      // flèches actives seulement quand le graphique est visible à l'écran
      const r = svg.getBoundingClientRect();
      if (r.bottom < 0 || r.top > window.innerHeight) return;
      e.preventDefault();
      ajuster(dir[0], dir[1]);
    }
    window.addEventListener('keydown', clavier);

    function tourner() {
      // rotation autour du centre de la règle
      const c = st.rot === 0 ? { x: st.ox + L / 2, y: st.oy + 6.5 } : { x: st.ox + 6.5, y: st.oy - L / 2 };
      st.rot = st.rot === 0 ? -90 : 0;
      if (st.rot === 0) { st.ox = c.x - L / 2; st.oy = c.y - 6.5; } else { st.ox = c.x - 6.5; st.oy = c.y + L / 2; }
      st.sel = 'regle';
      dessiner();
    }
    // boutons ◀ ▶ : le long de la règle (▼ ▲ quand elle est verticale)
    function pas(s) { if (st.rot === 0) ajuster(s, 0); else ajuster(0, -s); }

    function detruire() {
      window.removeEventListener('pointermove', bouger);
      window.removeEventListener('pointerup', fin);
      window.removeEventListener('pointercancel', fin);
      window.removeEventListener('keydown', clavier);
    }

    dessiner();
    return { st: st, tourner: tourner, pas: pas, lecture: () => st.cur, detruire: detruire, vertical: () => st.rot !== 0 };
  }

  function svgGraphique(def, R, A) {
    return `<svg class="lg-svg" viewBox="0 0 ${W} ${H}" xmlns="${NS}" xmlns:xlink="http://www.w3.org/1999/xlink">
      <defs><clipPath id="lgClipLoupe"><circle cx="0" cy="0" r="16"/></clipPath></defs>
      <g id="lgScene"><rect x="0" y="0" width="${W}" height="${H}" fill="#fff"/>
        <g class="lg-graphe">${dessinerGraphe(def, R, A)}</g>
        <g class="lg-outil"></g></g>
      <g class="lg-loupe" pointer-events="none"></g>
    </svg>`;
  }

  /* Barre de contrôle + graphique avec règle interactive (questions et bac à sable) */
  function htmlOutils() {
    return `<p class="lg-aide-regle">Fais glisser la <b>règle</b> (partie jaune) pour placer son <b>0</b> sur un repère, puis le <b>curseur</b> (●) jusqu'au second. ◀ ▶ (ou les flèches du clavier) affinent la position du dernier élément touché.<span class="lg-paysage"> 📱 Tourne ton téléphone pour agrandir le graphique.</span></p>
      <div class="lg-outils">
        <button type="button" class="btn-small" data-a="tourner">↻ Tourner</button>
        <button type="button" class="btn-small lg-fin" data-a="moins" aria-label="Reculer">◀</button>
        <button type="button" class="btn-small lg-fin" data-a="plus" aria-label="Avancer">▶</button>
        <span class="lg-lecture">Lecture : <span data-a="lecture"></span></span>
      </div>`;
  }
  function brancherOutils(root) {
    const $ = a => root.querySelector(`[data-a="${a}"]`);
    const regle = creerRegle(root.querySelector('.lg-svg'), cur => { $('lecture').textContent = fmt(cur / 10, 1) + ' cm'; });
    const moins = $('moins'), plus = $('plus');
    $('tourner').onclick = () => {
      regle.tourner();
      moins.textContent = regle.vertical() ? '▼' : '◀'; plus.textContent = regle.vertical() ? '▲' : '▶';
    };
    moins.onclick = () => regle.pas(-1);
    plus.onclick = () => regle.pas(1);
    return regle;
  }

  /* Bac à sable (cours) : graphique + règle, sans tableau */
  function bacASable(root, def) {
    const R = repere(def), A = analyser(def, R);
    root.innerHTML = htmlOutils() + `<div class="lg-graph-box">${svgGraphique(def, R, A)}</div>`;
    return brancherOutils(root);
  }

  /* Figure statique (cours) : graphique et règle(s) déjà placée(s).
     regles : [{ ox, oy, rot, cur }] en mm papier */
  function figure(def, regles, sansCible) {
    const R = repere(def), A = analyser(def, R);
    const graphe = sansCible ? dessinerGraphe(Object.assign({}, def, { type: '_' }), R, A) : dessinerGraphe(def, R, A);
    const rg = (regles || []).map(r => `<g transform="translate(${r.ox},${r.oy}) rotate(${r.rot || 0})">
        <rect x="0" y="-1.8" width="${r.cur}" height="1.8" fill="${ROSE}" opacity=".7"/>${corpsRegle()}
        <line x1="${r.cur}" y1="-5" x2="${r.cur}" y2="13" stroke="#16181d" stroke-width=".35"/>
        <path d="M${r.cur},-1.8 l-1.6,-2.6 h3.2z" fill="#16181d"/><circle cx="${r.cur}" cy="10.2" r="2.4" fill="#16181d" stroke="#fff" stroke-width=".5"/>
        <g transform="translate(${Math.max(8, r.cur / 2)},-4.2) rotate(${-(r.rot || 0)})"><rect x="-8" y="-3.2" width="16" height="4.8" rx="1" fill="#fff" stroke="${ROSE}" stroke-width=".35"/>
        <text x="0" y=".4" font-size="3.3" font-weight="800" text-anchor="middle" fill="${ROSE}">${fmt(r.cur / 10, 1)} cm</text></g></g>`).join('');
    return `<div class="lg-graph-box lg-figure"><svg viewBox="0 0 ${W} ${H}" xmlns="${NS}"><rect width="${W}" height="${H}" fill="#fff"/>${graphe}${rg}</svg></div>`;
  }

  /* ============================================================
     ÉTIQUETTES À GLISSER-DÉPOSER
     ============================================================ */
  let nChip = 0;
  function etiquette(label, data, cls) {
    const d = data || {};
    const attrs = Object.keys(d).map(k => `data-${k}="${String(d[k]).replace(/"/g, '&quot;')}"`).join(' ');
    return `<button type="button" class="lg-chip ${cls || ''}" data-cid="c${++nChip}" ${attrs}>${label}</button>`;
  }
  function caseVide(nom, cls) {
    return `<span class="lg-slot ${cls || ''}" data-slot="${nom}"><span class="lg-slot-ph">?</span></span>`;
  }

  /* Rend les étiquettes de root déplaçables entre cases et palettes.
     Une étiquette rendue à une palette retourne dans SA palette d'origine
     (data-home) ; une case déjà occupée renvoie son occupante chez elle. */
  /* Défilement vertical automatique pendant un glisser : quand le doigt
     (ou la souris) approche du haut ou du bas de l'écran, la page défile,
     pour atteindre une case qui n'est pas visible (utile sur smartphone). */
  const autoDefil = { y: -1, raf: null };
  function suivreY(e) { autoDefil.y = e.clientY; }
  function defilerTick() {
    const h = window.innerHeight, y = autoDefil.y, haut = 60 + 50, bas = 60;
    let dy = 0;
    if (y >= 0 && y < haut) dy = -Math.min(16, Math.ceil((haut - y) / 4));
    else if (y > h - bas) dy = Math.min(16, Math.ceil((y - (h - bas)) / 4));
    if (dy) window.scrollBy(0, dy);
    autoDefil.raf = requestAnimationFrame(defilerTick);
  }
  function debutDefil(e) {
    autoDefil.y = -1;
    window.addEventListener('pointermove', suivreY);
    if (!autoDefil.raf) autoDefil.raf = requestAnimationFrame(defilerTick);
  }
  function finDefil() {
    window.removeEventListener('pointermove', suivreY);
    if (autoDefil.raf) cancelAnimationFrame(autoDefil.raf);
    autoDefil.raf = null;
  }

  function moteurEtiquettes(root, onChange) {
    function chez(chip) { return root.querySelector('#' + chip.dataset.home) || root.querySelector('.lg-palette'); }
    function remettrePh(slot) {
      if (slot && slot.classList.contains('lg-slot') && !slot.querySelector('.lg-chip') && !slot.querySelector('.lg-slot-ph')) {
        slot.insertAdjacentHTML('afterbegin', '<span class="lg-slot-ph">?</span>');
      }
    }
    function brancher(chip) {
      if (chip.dataset.branche === '1') return;
      chip.dataset.branche = '1';
      DragDrop.enable(chip, {
        zoneSelector: '.lg-slot, .lg-palette',
        dragOverClass: 'lg-slot-over',
        onStart: debutDefil,
        onCancel: finDefil,
        onDrop: (item, zone) => {
          finDefil();
          if (!zone || !root.contains(zone)) return;
          const ancien = item.parentElement;
          if (zone === ancien) return;
          if (zone.classList.contains('lg-slot')) {
            const occ = zone.querySelector('.lg-chip');
            if (occ && occ !== item) chez(occ).appendChild(occ);
            const ph = zone.querySelector('.lg-slot-ph');
            if (ph) ph.remove();
            zone.appendChild(item);
          } else {
            chez(item).appendChild(item);
          }
          remettrePh(ancien);
          root.querySelectorAll('.lg-slot').forEach(s => s.classList.remove('lg-slot-ok', 'lg-slot-bad'));
          majVides();
          if (onChange) onChange();
        },
      });
    }
    function majVides() {
      root.querySelectorAll('.lg-palette').forEach(p => {
        const v = p.querySelector('.lg-palette-vide');
        if (v) v.style.display = p.querySelector('.lg-chip') ? 'none' : '';
      });
    }
    function tout() { root.querySelectorAll('.lg-chip').forEach(brancher); majVides(); }
    if (window.DragDrop) DragDrop.cleanupGhosts();
    tout();
    return {
      ajouter: tout,
      dans: nom => { const s = root.querySelector(`.lg-slot[data-slot="${nom}"]`); return s ? s.querySelector('.lg-chip') : null; },
      marquer: (nom, ok) => {
        const s = root.querySelector(`.lg-slot[data-slot="${nom}"]`);
        if (s) { s.classList.toggle('lg-slot-ok', ok); s.classList.toggle('lg-slot-bad', !ok); }
      },
    };
  }

  /* ============================================================
     DÉROULÉ D'UNE QUESTION
     opts : { onFini(points, max), onPasser() }
     ============================================================ */
  function poserQuestion(root, def, opts) {
    opts = opts || {};
    const R = repere(def);
    const A = analyser(def, R);
    const ax = A.axe, g = def.grandeur, sym = symH(g.symbole);
    const unitesAxe = def.unites || ['cm', 'mm', def.axeX.unite, def.axeY.unite].filter((u, i, t) => t.indexOf(u) === i);
    const pts = { tableau: 1, calcul: 1, unite: 1 };
    let res = {};                                     // résultats des étapes

    // case du tableau : saisie au clavier ou au pavé numérique
    const saisie = (id, ph) => `<input type="text" id="${id}" class="lg-input lg-cell" inputmode="decimal" autocomplete="off" placeholder="${ph}" onfocus="numpadFocus(this.id)" ontouchstart="numpadFocus(this.id)">`;

    root.innerHTML = `
      <p class="lg-contexte">${def.contexte}</p>
      <div class="lg-cible"><span class="lg-cible-icone">?</span><div>${def.cible}</div></div>
      ${htmlOutils()}
      <div class="lg-graph-box">${svgGraphique(def, R, A)}</div>

      <div class="lg-etape" data-etape="1">
        <h3 class="lg-etape-titre">Étape 1 · Tableau de proportionnalité</h3>
        <div class="lg-palette lg-palette-ligne" id="lgPalUni"><span class="lg-palette-titre">Unités :</span>${unitesAxe.map(u => etiquette(u, { type: 'unite', u: u, home: 'lgPalUni' }, 'lg-chip-unite')).join('')}</div>
        <div class="lg-table-wrap"><table class="lg-table">
          <colgroup><col class="lg-col-titre"><col><col></colgroup>
          <thead><tr><th></th><th>Distance<br>${caseVide('uD', 'lg-slot-unite')}</th><th>${ax.libelle}<br>${caseVide('uV', 'lg-slot-unite')}</th></tr></thead>
          <tbody>
            <tr><th>Échelle</th><td>${saisie('lgED', 'mesure')}</td><td>${saisie('lgEV', 'valeur')}</td></tr>
            <tr><th>${A.ligne}</th><td>${saisie('lgMD', 'mesure')}</td><td class="lg-inconnue">?</td></tr>
          </tbody>
        </table></div>
        ${window.numpadWidget ? numpadWidget() : ''}
        <div class="lg-actions">
          <button type="button" class="btn-small" data-a="passer">Passer →</button>
          <button type="button" class="btn-primary" data-a="verif1">Vérifier le tableau</button>
        </div>
        <div data-a="msg1"></div>
      </div>
      <div data-a="suite"></div>`;

    const $ = a => root.querySelector(`[data-a="${a}"]`);
    const regle = brancherOutils(root);

    const eng1 = moteurEtiquettes(root.querySelector('[data-etape="1"]'));
    const cases = { eD: root.querySelector('#lgED'), eV: root.querySelector('#lgEV'), mD: root.querySelector('#lgMD') };
    Object.keys(cases).forEach(k => {
      cases[k].addEventListener('input', () => cases[k].classList.remove('is-ok', 'is-ko'));
      cases[k].addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); $('verif1').click(); } });
    });
    function marquerCase(k, ok) { cases[k].classList.toggle('is-ok', ok); cases[k].classList.toggle('is-ko', !ok); }
    $('passer').onclick = () => { regle.detruire(); if (opts.onPasser) opts.onPasser(); };

    /* ----- Vérification du tableau ----- */
    let fait1 = false;
    $('verif1').onclick = () => {
      if (fait1) return;
      const u = { uD: eng1.dans('uD'), uV: eng1.dans('uV') };
      const v = { eD: lireNombre(cases.eD.value), eV: lireNombre(cases.eV.value), mD: lireNombre(cases.mD.value) };
      const err = [];
      const okUD = !!(u.uD && u.uD.dataset.u === 'cm');
      eng1.marquer('uD', okUD);
      if (!okUD) err.push('Unité des distances : dans quelle unité est graduée ta règle ?');
      const okUV = !!(u.uV && u.uV.dataset.u === ax.unite);
      eng1.marquer('uV', okUV);
      if (!okUV) err.push(`Unité de la 2<sup>e</sup> colonne : regarde l'unité indiquée au bout de l'axe « ${ax.nom} ».`);

      // échelle : la distance (cm) et la valeur doivent se correspondre
      let okED = v.eD > 0, okEV = v.eV > 0;
      if (!okED) err.push('Échelle, distance : écris la distance lue sur la règle, en cm (par exemple 12,5).');
      if (!okEV) err.push("Échelle, valeur : écris l'écart entre les deux graduations où tu as placé le 0 et le curseur.");
      if (okED && okEV && Math.abs(v.eD * 10 - v.eV * A.mm) > TOL) {
        okED = okEV = false;
        const p = ax.pas;
        err.push(`La distance et la valeur de l'échelle ne correspondent pas. Le 0 de la règle et le curseur doivent être sur deux graduations de l'axe, et la valeur est l'écart entre ces graduations (par exemple, de ${fmt(ax.min + p, 3)} à ${fmt(ax.min + 5 * p, 3)} ${ax.unite}, l'écart est ${fmt(4 * p, 3)} ${ax.unite}).`);
      }
      marquerCase('eD', okED); marquerCase('eV', okEV);

      // mesure de la grandeur
      let okMD = v.mD > 0, trouve = null;
      if (okMD) {
        trouve = A.liste.find(x => Math.abs(v.mD * 10 - x.mm) <= TOL) || null;
        if (!trouve) { okMD = false; err.push(A.erreur); }
      } else err.push('Ligne « ' + A.ligne + ' » : écris la distance mesurée pour la grandeur recherchée, en cm.');
      marquerCase('mD', okMD);

      const msg = $('msg1');
      if (err.length) {
        pts.tableau = 0;
        msg.innerHTML = `<div class="lg-msg lg-msg-ko">Le tableau n'est pas encore correct :<ul>${err.map(e => `<li>${e}</li>`).join('')}</ul></div>`;
        return;
      }
      fait1 = true;
      $('verif1').disabled = true; $('passer').style.display = 'none';
      Object.keys(cases).forEach(k => { cases[k].readOnly = true; });
      root.querySelectorAll('[data-etape="1"] .np-section').forEach(n => n.remove());
      res = { a: v.eD, b: v.eV, c: v.mD, n: trouve.n };
      msg.innerHTML = `<div class="lg-msg lg-msg-ok">✓ Tableau correct !</div>` + conseils(v.eD * 10, trouve.n);
      etape2();
    };

    /* Conseils de précision (informatifs, non bloquants) */
    function conseils(eMm, n) {
      const out = [];
      const em = echelleMax(ax, A.mm);
      if (eMm < 0.6 * em.mm) {
        out.push(`Pour l'échelle, tu as mesuré ${fmt(eMm / 10, 1)} cm. Tu pouvais mesurer jusqu'à ${fmt(em.mm / 10, 1)} cm (de ${fmt(em.de, 3)} à ${fmt(em.a, 3)} ${ax.unite}) : plus la distance mesurée est grande, moins l'erreur de lecture (environ 1 mm) compte.`);
      }
      if (def.type === 'periode' && n < A.nMax) {
        const nom = g.nom || 'période', noms = g.noms || 'périodes';
        out.push(`Tu as mesuré ${n === 1 ? 'une seule ' + nom : n + ' ' + noms}. On peut en mesurer jusqu'à ${A.nMax} sur ce graphique : en mesurant plusieurs ${noms} puis en divisant par leur nombre, l'erreur de lecture est divisée d'autant.`);
      }
      if (def.type === 'amplitude' && n === 1) {
        out.push("Mesure plutôt l'écart entre le minimum et le maximum (crête à crête), puis divise par 2 : la distance mesurée est deux fois plus grande, l'erreur de lecture compte deux fois moins.");
      }
      return out.map(t => `<div class="lg-info"><span class="lg-info-icone">💡</span><div><b>Pour être plus précis :</b> ${t}</div></div>`).join('');
    }

    /* ----- Étape 2 : le calcul ----- */
    function etape2() {
      const n = res.n;
      const nom = n > 1 ? `${n}${sym}` : sym;
      const u2 = def.unitesCalcul || ['cm', ax.unite, `${ax.unite}/cm`, `cm/${ax.unite}`];
      const div = document.createElement('div');
      div.className = 'lg-etape';
      div.innerHTML = `
        <h3 class="lg-etape-titre">Étape 2 · Le calcul</h3>
        <p>Glisse les valeurs du tableau dans le produit en croix. Le résultat s'affiche automatiquement : choisis ensuite son unité.</p>
        <div class="lg-palettes">
          <div class="lg-palette" id="lgPal2"><span class="lg-palette-titre">Valeurs du tableau</span>
            ${etiquette(fmt(res.a, 2) + ' cm', { id: 'a', v: res.a, home: 'lgPal2' })}
            ${etiquette(fmt(res.b, 4) + ' ' + ax.unite, { id: 'b', v: res.b, home: 'lgPal2' })}
            ${etiquette(fmt(res.c, 2) + ' cm', { id: 'c', v: res.c, home: 'lgPal2' })}</div>
          <div class="lg-palette" id="lgPal2u"><span class="lg-palette-titre">Unités</span>
            ${u2.map(u => etiquette(u, { type: 'unite', u: u, home: 'lgPal2u' }, 'lg-chip-unite')).join('')}</div>
        </div>
        <div class="lg-formule"><span>${nom} =</span>
          <span class="lg-frac"><span class="lg-frac-haut">${caseVide('n1')} × ${caseVide('n2')}</span><span class="lg-frac-ligne"></span>${caseVide('d')}</span>
          <span class="lg-egal">= <span class="lg-live" data-a="live2">?</span>${caseVide('u', 'lg-slot-unite')}</span></div>
        <div class="lg-actions"><button type="button" class="btn-primary" data-a="verif2">Vérifier le calcul</button></div>
        <div data-a="msg2"></div>`;
      $('suite').appendChild(div);
      const eng2 = moteurEtiquettes(div, () => {
        const v = ['n1', 'n2', 'd'].map(s => eng2.dans(s));
        const live = div.querySelector('[data-a="live2"]');
        if (v.every(x => x && x.dataset.v)) {
          live.textContent = fmtSig(+v[0].dataset.v * +v[1].dataset.v / +v[2].dataset.v, 3);
          live.classList.add('ok');
        } else { live.textContent = '?'; live.classList.remove('ok'); }
      });
      let fait2 = false;
      div.querySelector('[data-a="verif2"]').onclick = () => {
        if (fait2) return;
        const id = s => { const x = eng2.dans(s); return x ? x.dataset.id : null; };
        const num = [id('n1'), id('n2')];
        const okN = num.indexOf('b') !== -1 && num.indexOf('c') !== -1;
        eng2.marquer('n1', okN && (num[0] === 'b' || num[0] === 'c'));
        eng2.marquer('n2', okN && (num[1] === 'b' || num[1] === 'c'));
        const okD = id('d') === 'a';
        eng2.marquer('d', okD);
        const cu = eng2.dans('u');
        const okU = !!(cu && cu.dataset.u === ax.unite);
        eng2.marquer('u', okU);
        const err = [];
        if (!okN || !okD) { pts.calcul = 0; err.push('Produit en croix : on multiplie les deux valeurs reliées en diagonale à « ? », puis on divise par la troisième.'); }
        if (!okU) { pts.unite = 0; err.push(`Unité : le résultat est une valeur de la colonne « ${ax.libelle} ».`); }
        const msg = div.querySelector('[data-a="msg2"]');
        if (err.length) { msg.innerHTML = `<div class="lg-msg lg-msg-ko">Pas encore :<ul>${err.map(e => `<li>${e}</li>`).join('')}</ul></div>`; return; }
        fait2 = true;
        div.querySelector('[data-a="verif2"]').disabled = true;
        res.r2 = res.c * res.b / res.a;
        msg.innerHTML = `<div class="lg-msg lg-msg-ok">✓ Calcul correct : ${nom} = ${fmtSig(res.r2, 3)} ${ax.unite}</div>`;
        if (res.n > 1) etape3(); else finir(res.r2);
      };
    }

    /* ----- Étape 3 : diviser par le nombre de périodes (saisi au pavé) ----- */
    function etape3() {
      const n = res.n;
      const amp = def.type === 'amplitude';
      const T3 = amp
        ? { titre: "Étape 3 · L'amplitude", texte: `Tu as mesuré l'écart entre le minimum et le maximum (crête à crête). Combien de fois contient-il l'amplitude ${sym} ? Divise par ce nombre.`,
            erreur: "Pas encore : l'écart crête à crête va du minimum au maximum, soit une amplitude sous la valeur moyenne et une au-dessus." }
        : { titre: `Étape 3 · Une seule ${g.nom || 'période'}`, texte: `Tu as mesuré plusieurs ${g.noms || 'périodes'}. Pour trouver ${sym}, divise par le nombre de ${g.noms || 'périodes'} mesurées.`,
            erreur: `Pas encore : combien de ${g.noms || 'périodes'} y a-t-il entre le 0 de ta règle et le curseur ?` };
      const div = document.createElement('div');
      div.className = 'lg-etape';
      div.innerHTML = `
        <h3 class="lg-etape-titre">${T3.titre}</h3>
        <p>${T3.texte}</p>
        <div class="lg-formule"><span>${sym} =</span>
          <span class="lg-frac"><span class="lg-frac-val">${fmtSig(res.r2, 3)} ${ax.unite}</span><span class="lg-frac-ligne" style="min-width:90px"></span>
            <input type="text" id="lgN" class="lg-input lg-cell" inputmode="numeric" autocomplete="off" placeholder="?" onfocus="numpadFocus(this.id)" ontouchstart="numpadFocus(this.id)"></span>
          <span class="lg-egal">= <span class="lg-live" data-a="live3">?</span> ${ax.unite}</span></div>
        ${window.numpadWidget ? numpadWidget(false, { decimal: false }) : ''}
        <div class="lg-actions"><button type="button" class="btn-primary" data-a="verif3">Vérifier</button></div>
        <div data-a="msg3"></div>`;
      $('suite').appendChild(div);
      const inN = div.querySelector('#lgN'), live = div.querySelector('[data-a="live3"]');
      inN.addEventListener('input', () => {
        inN.classList.remove('is-ok', 'is-ko');
        const k = lireNombre(inN.value);
        if (k > 0) { live.textContent = fmtSig(res.r2 / k, 3); live.classList.add('ok'); }
        else { live.textContent = '?'; live.classList.remove('ok'); }
      });
      let fait3 = false;
      function verifier3() {
        if (fait3) return;
        const ok = lireNombre(inN.value) === n;
        inN.classList.toggle('is-ok', ok); inN.classList.toggle('is-ko', !ok);
        const msg = div.querySelector('[data-a="msg3"]');
        if (!ok) {
          pts.calcul = 0;
          msg.innerHTML = `<div class="lg-msg lg-msg-ko">${T3.erreur}</div>`;
          return;
        }
        fait3 = true;
        inN.readOnly = true;
        div.querySelectorAll('.np-section').forEach(x => x.remove());
        msg.innerHTML = `<div class="lg-msg lg-msg-ok">✓ Division correcte !</div>`;
        div.querySelector('[data-a="verif3"]').disabled = true;
        finir(res.r2 / n);
      }
      div.querySelector('[data-a="verif3"]').onclick = verifier3;
      inN.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); verifier3(); } });
    }

    /* ----- Résultat final ----- */
    function finir(val) {
      regle.detruire();
      const exact = A.exact;
      const ecart = Math.abs(val - exact) / exact * 100;
      const total = pts.tableau + pts.calcul + pts.unite;
      const div = document.createElement('div');
      div.className = 'lg-resultat';
      div.innerHTML = `<div>Résultat : <span class="lg-resultat-valeur">${sym} ≈ ${fmtSig(val, 3)} ${ax.unite}</span></div>
        <div style="margin-top:4px;color:var(--ink-2);font-size:.92rem">Valeur utilisée pour tracer le graphique : ${fmtSig(exact, 3)} ${ax.unite} (écart : ${fmt(ecart, 1)} %).</div>
        <div style="margin-top:4px;font-weight:700">Points : ${total} / 3</div>`;
      $('suite').appendChild(div);
      const act = document.createElement('div');
      act.className = 'lg-actions';
      act.innerHTML = `<button type="button" class="btn-primary">Question suivante →</button>`;
      act.querySelector('button').onclick = () => { if (opts.onSuivant) opts.onSuivant(); };
      $('suite').appendChild(act);
      if (opts.onFini) opts.onFini(total, 3);
    }

    return { detruire: () => regle.detruire() };
  }

  /* ============================================================
     ENTRAÎNEMENT : enchaînement des questions, score, écran de fin
     opts : { app, badge, titre, intro, bank, suite: { href, label } }
     ============================================================ */
  function lancerQuiz(opts) {
    const app = opts.app, bank = opts.bank, MAXQ = 3;
    let idx = 0, score = 0, recap = [], question = null;
    function entete() {
      const pct = Math.round(idx / bank.length * 100);
      return `<div class="lg-card">
          <span class="lg-badge">${opts.badge}</span>
          <h2 class="lg-titre">${opts.titre}</h2>
          <p class="lg-meta">Question ${idx + 1}/${bank.length} · Score : <b>${score} pt${score > 1 ? 's' : ''}</b></p>
          <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
          <div style="margin-top:12px">${window.numpadToggleBar ? numpadToggleBar() : ''}</div>
        </div>`;
    }
    function intro() {
      app.innerHTML = `<div class="lg-card">
          <span class="lg-badge">${opts.badge}</span>
          <h2 class="lg-titre">${opts.titre}</h2>
          ${opts.intro}
          <p class="lg-contexte">Chaque question rapporte <b>3 points</b> (tableau, calcul, unité) si tout est juste du premier coup.</p>
          <button type="button" class="btn-primary" data-a="go">Commencer →</button>
        </div>`;
      app.querySelector('[data-a="go"]').onclick = demarrer;
    }
    function demarrer() { idx = 0; score = 0; recap = []; afficher(); }
    function afficher() {
      if (question) { question.detruire(); question = null; }
      if (idx >= bank.length) return fin();
      app.innerHTML = entete() + `<div class="lg-card" data-a="q"></div>`;
      window.scrollTo(0, 0);
      question = poserQuestion(app.querySelector('[data-a="q"]'), bank[idx], {
        onFini: p => { score += p; recap.push({ n: idx + 1, p: p }); app.querySelector('.lg-meta b').textContent = score + ' pt' + (score > 1 ? 's' : ''); },
        onSuivant: () => { idx++; afficher(); },
        onPasser: () => { recap.push({ n: idx + 1, p: 0 }); idx++; afficher(); },
      });
    }
    function fin() {
      const max = bank.length * MAXQ, pct = Math.round(score / max * 100);
      if (score === max) confettis();
      app.innerHTML = `<div class="lg-card" style="text-align:center">
          <h2 class="lg-titre">Entraînement terminé !</h2>
          ${score === max ? '<p style="font-weight:800;color:var(--accent-ink)">🏆 Sans-faute !</p>' : ''}
          <p class="lg-contexte">Score : ${score} / ${max} points (${pct} %)</p>
          <div class="lg-actions" style="justify-content:center">
            <button type="button" class="btn-secondary" data-a="re">↺ Recommencer</button>
            ${opts.suite ? `<a class="btn-primary" style="text-decoration:none;margin-left:0" href="${opts.suite.href}">${opts.suite.label}</a>` : ''}
          </div>
          <div class="lg-recap">${recap.map(r => `<div>Q${r.n}<b>${r.p}/${MAXQ}</b></div>`).join('')}</div>
        </div>`;
      app.querySelector('[data-a="re"]').onclick = demarrer;
      window.scrollTo(0, 0);
    }
    intro();
  }

  /* ---------- Confettis (sans-faute) ---------- */
  function confettis() {
    const col = ['#2952c8', '#16a34a', '#e8890c', '#d61f69', '#06b6d4'];
    for (let i = 0; i < 70; i++) {
      const el = document.createElement('div');
      el.className = 'lg-confetti';
      el.style.left = (Math.random() * 100) + 'vw';
      el.style.background = col[i % col.length];
      el.style.animationDuration = (2.2 + Math.random() * 1.6) + 's';
      el.style.animationDelay = (Math.random() * 0.8) + 's';
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 4800);
    }
  }

  window.LG = {
    fmt: fmt, fmtSig: fmtSig, lireNombre: lireNombre, repere: repere, analyser: analyser,
    poserQuestion: poserQuestion, lancerQuiz: lancerQuiz, bacASable: bacASable, figure: figure, confettis: confettis,
  };
})();
