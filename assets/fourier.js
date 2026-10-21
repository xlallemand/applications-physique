/* ============================================================
   Synthèse de Fourier : simulateur et figures (signal, spectre)

   Moteur commun (objet global FOURIER) de l'application « Chapitre 17 :
   Spectre d'un signal périodique », écrit pour être réutilisé tel quel
   (chapitre 18, items 'perso' des cours). À charger avec
   assets/fourier.css. Calcul en JavaScript pur, figures en SVG, aucune
   bibliothèque, aucun fetch. Pas d'animation (prefers-reduced-motion
   respecté d'office).

   Un signal (« spec ») : { f1 (Hz), a0, a: [a1, a2, …] }
     s(t) = a0 + Σ aₙ × sin(n × 2π f1 × t)   (toutes les phases sont nulles)

   FOURIER.valeur(spec, t)        s(t), t en secondes
   FOURIER.raies(spec, opts)      raies du spectre [{ f, a, n }] (la raie à 0 Hz si a0 ≠ 0,
                                  puis les harmoniques d'amplitude non nulle ; opts.zeros : toutes)
   FOURIER.svgSignal(spec, o)     graphique s(t) en SVG (texte HTML)
       o = { W (largeur en px), H, tmax (ms), pasT, etiqT, ymin, ymax, pasY, etiqY, nom ('u'), unite ('V'),
             titreY (SVG), harmoniques (bool), somme (false : sans la courbe de la somme), ideale ('creneau' | 'scie' | null), moyenne (bool),
             cible (spec, en gris), surligne (rang n, 0 pour a0), mesure ({ t1, t2, label, poignees }),
             aria }
   FOURIER.svgSpectre(raies, o)   spectre en raies verticales fines (SVG, texte HTML)
       raies = [{ f (Hz), a, n, nom (SVG), coul }]
       o = { W, H, fmax, pasF, gradF (liste des lignes verticales), etiqF (graduations écrites, toutes par défaut),
             uniteF ('Hz' | 'kHz'), titreF, titreBas (false : titre de l'axe au-dessus de l'axe, à droite), amax, pasA, gradA, etiqA,
             unite ('V'), titreA (SVG), etiquettes (bool), epais, bande ([fa, fb]), aria }
   FOURIER.monter(zone, opts)     simulateur interactif (plusieurs exemplaires possibles) :
       signal u(t) au-dessus, spectre en dessous (même largeur) ; curseurs f1 et a0 ;
       raies à faire glisser (poignée en haut de chaque raie) ; réglage précis au clavier ;
       signaux prédéfinis ; options (harmoniques séparés, forme idéale, valeur moyenne,
       curseurs de mesure) ; toucher une raie ou la légende met l'harmonique en valeur.
       opts = { N (10), f1, a0, a, amax (2), ymax, nom, unite, commandes, predefinis, legende, cases
                (true ou liste parmi 'harmoniques', 'ideale', 'moyenne', 'mesure'), mesure (bool :
                curseurs affichés au départ), signal, spectre, tmax, pasT, ymin, Hs, Hf, aria }
       → instance { el, etat(), regler(r, silencieux), charger(nom), surChange(f), periode(), valeur(t) }
       regler accepte f1, a0, a (liste, ou objet { rang: valeur }), amax, ymax, forme, harmoniques,
       ideale, moyenne, mesure, t1, t2, sel, surligne, cible (spec ou null), bande ([fa, fb] ou null)
   FOURIER.geomSignal, geomSpectre, geomSpectreDe(raies, o), axesSignal
                                  géométrie des graphiques (outils qui s'y superposent)
   FOURIER.PREDEFINIS             signaux prédéfinis : sinus, creneau, scie, cours, ex6, zero
   FOURIER.COUL                   couleurs des harmoniques (attributs de présentation SVG, comme VEC.C)
   FOURIER.fmt, pasJoli, plafondJoli, sub   écriture des nombres, graduations, indice en SVG
   ============================================================ */
(function () {
  'use strict';

  const MOINS = '−';
  // couleurs des harmoniques 1 à 10 et de la composante continue (attributs de présentation SVG)
  const COUL = {
    harm: ['#d9480f', '#1971c2', '#c2255c', '#0c8599', '#b35c00', '#9c36b5', '#a61e4d', '#e67700', '#495057', '#3b5bdb'],
    a0: '#55585f',
  };
  const coulDe = n => (n === 0 ? COUL.a0 : COUL.harm[(n - 1) % COUL.harm.length]);

  /* ============================================================
     NOMBRES ET GRADUATIONS
     ============================================================ */
  // nombre écrit à la française : 2,3 ; −0,30 ; 1 000 (dec : nombre de décimales imposé)
  function fmt(v, dec) {
    if (dec != null) {
      const s = (Math.abs(v) < Math.pow(10, -dec) / 2 ? 0 : v).toFixed(dec);
      return s.replace('-', MOINS).replace('.', ',');
    }
    let s = String(+(Math.round(v * 1e9) / 1e9).toPrecision(6));
    const neg = s[0] === '-';
    if (neg) s = s.slice(1);
    let [e, d] = s.split('.');
    e = e.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return (neg ? MOINS : '') + (d ? e + ',' + d : e);
  }
  // lecture d'une saisie : « 0,75 », « −1 »
  function lire(s) {
    const t = String(s == null ? '' : s).trim().replace(/[\s  ]/g, '').replace(',', '.').replace(/[−–]/g, '-');
    return /^[-+]?(\d+\.?\d*|\.\d+)$/.test(t) ? parseFloat(t) : NaN;
  }
  // pas de graduation « joli » (1, 2, 2,5 ou 5 × 10ᵏ) pour environ n intervalles
  function pasJoli(etendue, n) {
    const brut = etendue / n, p = Math.pow(10, Math.floor(Math.log10(brut))), r = brut / p;
    return (r <= 1 ? 1 : r <= 2 ? 2 : r <= 2.5 ? 2.5 : r <= 5 ? 5 : 10) * p;
  }
  // plus petite valeur « jolie » (1 ; 1,2 ; 1,5 ; 2 ; 2,5 ; 3 ; 4 ; 5 ; 6 ; 8 × 10ᵏ) supérieure ou égale à v
  function plafondJoli(v) {
    const p = Math.pow(10, Math.floor(Math.log10(v))), r = v / p;
    const m = [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10].find(x => x >= r - 1e-9);
    return +(m * p).toPrecision(6);
  }
  const estJoli = v => {
    const p = Math.pow(10, Math.floor(Math.log10(v) + 1e-9)), r = Math.round(v / p * 1e6) / 1e6;
    return [1, 2, 2.5, 5].indexOf(r) !== -1;
  };
  // pas qui partage exactement l'étendue en un nombre « raisonnable » d'intervalles
  function pasExact(etendue, essais) {
    for (const n of essais) { const p = etendue / n; if (estJoli(p)) return +p.toPrecision(6); }
    return pasJoli(etendue, essais[0]);
  }
  const pasTemps = tmax => pasExact(tmax, [10, 12, 8, 6, 15, 5, 20, 4]);
  const pasDemi = Y => pasExact(Y, [4, 5, 6, 8, 3, 2]);
  const etiq = v => fmt(Math.round(v * 1e6) / 1e6);
  // v fait-il partie de la liste l (graduations écrites) ? (comparaison tolérante pour les décimaux)
  const dans = (l, v) => l.some(x => Math.abs(x - v) < 1e-6 * Math.max(1, Math.abs(v)));
  const borne = (v, a, b) => Math.max(a, Math.min(b, v));

  // texte SVG avec indice : sub('a', 3) → a₃ ; suite : texte qui suit, sur la ligne de base
  const sub = (b, i, suite) => `${b}<tspan dy="3.5" font-size="0.75em">${i}</tspan>${suite ? `<tspan dy="-3.5">${suite}</tspan>` : ''}`;

  /* ============================================================
     CALCUL
     ============================================================ */
  // s(t) = a0 + Σ aₙ sin(2π n f1 t), t en secondes
  function valeur(spec, t) {
    let s = spec.a0 || 0;
    const w = 2 * Math.PI * spec.f1 * t;
    (spec.a || []).forEach((a, i) => { if (a) s += a * Math.sin((i + 1) * w); });
    return s;
  }
  // une seule composante : n = 0 → a0 ; n ≥ 1 → aₙ sin(2π n f1 t)
  const composante = (spec, n, t) => (n === 0 ? spec.a0 || 0 : (spec.a[n - 1] || 0) * Math.sin(2 * Math.PI * n * spec.f1 * t));
  // forme idéale dont la série approche : créneau (aₙ = 4A/(nπ), n impair) ou dent de scie (aₙ = 2A/(nπ))
  function ideale(spec, forme, t) {
    const a1 = spec.a[0] || 0, u = ((spec.f1 * t) % 1 + 1) % 1;
    if (forme === 'creneau') return (spec.a0 || 0) + a1 * Math.PI / 4 * (u < .5 ? 1 : -1);
    return (spec.a0 || 0) + a1 * Math.PI / 2 * (1 - 2 * u);
  }
  // raies du spectre (la raie à 0 Hz a pour hauteur |a0|)
  function raies(spec, opts) {
    opts = opts || {};
    const l = [];
    if (spec.a0 || opts.zeros) l.push({ f: 0, a: Math.abs(spec.a0 || 0), n: 0 });
    (spec.a || []).forEach((a, i) => { if (a || opts.zeros) l.push({ f: (i + 1) * spec.f1, a, n: i + 1 }); });
    return l;
  }
  // valeurs extrêmes du signal (échantillonné sur une période)
  function extremes(spec) {
    let mn = Infinity, mx = -Infinity;
    for (let k = 0; k <= 800; k++) { const v = valeur(spec, k / 800 / spec.f1); if (v < mn) mn = v; if (v > mx) mx = v; }
    return { mn, mx };
  }

  /* ============================================================
     GRAPHIQUE DU SIGNAL
     ============================================================ */
  let nClip = 0;
  function geomSignal(W, H, tmax, ymin, ymax, ml) {
    const x0 = ml, x1 = W - 16, y0 = 28, y1 = H - 44;
    return {
      W, H, x0, x1, y0, y1, tmax, ymin, ymax,
      X: t => x0 + t / tmax * (x1 - x0),
      Y: v => y0 + (ymax - v) / (ymax - ymin) * (y1 - y0),
      T: x => (x - x0) / (x1 - x0) * tmax,
    };
  }
  // réglages d'axes du signal à partir des options (tmax, bornes verticales symétriques)
  function axesSignal(spec, o) {
    const tmax = o.tmax || plafondJoli(3000 / spec.f1 * .999);
    let ymin = o.ymin, ymax = o.ymax;
    if (ymin == null) {
      let Y = ymax || 4;
      const e = extremes(spec);
      let ext = Math.max(Math.abs(e.mn), Math.abs(e.mx));
      if (o.cible) { const c = extremes(o.cible); ext = Math.max(ext, Math.abs(c.mn), Math.abs(c.mx)); }
      if (ext > Y * .98) Y = plafondJoli(ext * 1.04);
      ymin = -Y; ymax = Y;
    }
    return { tmax, pasT: o.pasT || pasTemps(tmax), ymin, ymax, pasY: o.pasY || pasDemi(Math.max(Math.abs(ymin), ymax)) };
  }
  // tracé d'une fonction du temps (t en ms) en chemin SVG
  function chemin(g, f, n) {
    let d = '';
    for (let i = 0; i <= n; i++) {
      const t = g.tmax * i / n;
      d += (i ? 'L' : 'M') + g.X(t).toFixed(1) + ',' + g.Y(f(t)).toFixed(1);
    }
    return d;
  }
  // forme idéale tracée avec ses fronts verticaux
  function cheminIdeal(g, spec, forme) {
    const T = 1000 / spec.f1, a0 = spec.a0 || 0, a1 = spec.a[0] || 0;
    let d = '';
    for (let k = 0; k * T < g.tmax; k++) {
      const t0 = k * T;
      if (forme === 'creneau') {
        const A = a1 * Math.PI / 4;
        d += `${k ? 'L' : 'M'}${g.X(t0).toFixed(1)},${g.Y(a0 + A).toFixed(1)}L${g.X(Math.min(t0 + T / 2, g.tmax)).toFixed(1)},${g.Y(a0 + A).toFixed(1)}`;
        if (t0 + T / 2 < g.tmax) d += `L${g.X(t0 + T / 2).toFixed(1)},${g.Y(a0 - A).toFixed(1)}L${g.X(Math.min(t0 + T, g.tmax)).toFixed(1)},${g.Y(a0 - A).toFixed(1)}`;
      } else {
        const A = a1 * Math.PI / 2, t1 = Math.min(t0 + T, g.tmax);
        d += `${k ? 'L' : 'M'}${g.X(t0).toFixed(1)},${g.Y(a0 + A).toFixed(1)}L${g.X(t1).toFixed(1)},${g.Y(a0 + A - 2 * A * (t1 - t0) / T).toFixed(1)}`;
      }
    }
    return d;
  }
  // flèche (pointe) au bout d'un axe
  const pointe = (x, y, dir) => (dir === 'haut'
    ? `<path class="fo-pointe" d="M${x},${y - 8}L${x - 4.5},${y + 1}L${x + 4.5},${y + 1}Z"/>`
    : `<path class="fo-pointe" d="M${x + 8},${y}L${x - 1},${y - 4.5}L${x - 1},${y + 4.5}Z"/>`);

  function svgSignal(spec, o) {
    o = Object.assign({ H: 230, nom: 'u', unite: 'V', ml: 46 }, o);
    const ax = axesSignal(spec, o);
    // le titre de l'axe des temps, sous les graduations, ajoute 16 px à la hauteur o.H
    const g = geomSignal(o.W, o.H + 16, ax.tmax, ax.ymin, ax.ymax, o.ml);
    const id = 'fo-clip-' + (++nClip), n = Math.max(300, Math.round((g.x1 - g.x0) * 1.6));
    const s = [];
    // quadrillage en pointillés et graduations
    const kT = Math.round(ax.tmax / ax.pasT), sautT = Math.max(1, Math.ceil(34 / ((g.x1 - g.x0) / kT)));
    for (let k = 0; k <= kT; k++) {
      const x = g.X(k * ax.pasT);
      if (k) s.push(`<line class="fo-grille" x1="${x}" y1="${g.y0}" x2="${x}" y2="${g.y1}"/>`);
      if (o.etiqT ? dans(o.etiqT, k * ax.pasT) : k % sautT === 0 && k) s.push(`<text class="fo-txt" x="${x}" y="${g.y1 + 17}" text-anchor="middle">${etiq(k * ax.pasT)}</text>`);
    }
    const kmin = Math.ceil(ax.ymin / ax.pasY - 1e-9), kmax = Math.floor(ax.ymax / ax.pasY + 1e-9);
    const sautY = Math.max(1, Math.ceil(16 / ((g.y1 - g.y0) / (kmax - kmin))));
    for (let k = kmin; k <= kmax; k++) {
      const y = g.Y(k * ax.pasY);
      if (k) s.push(`<line class="fo-grille" x1="${g.x0}" y1="${y}" x2="${g.x1}" y2="${y}"/>`);
      if (o.etiqY ? dans(o.etiqY, k * ax.pasY) : k % sautY === 0) s.push(`<text class="fo-txt" x="${g.x0 - 6}" y="${y + 4}" text-anchor="end">${etiq(k * ax.pasY)}</text>`);
    }
    // axes : temps (sur la ligne 0 si elle est visible) et ordonnées
    const yAxe = ax.ymin <= 0 && ax.ymax >= 0 ? g.Y(0) : g.y1;
    s.push(`<line class="fo-axe" x1="${g.x0}" y1="${yAxe}" x2="${g.x1 + 4}" y2="${yAxe}"/>${pointe(g.x1 + 4, yAxe, 'droite')}`);
    s.push(`<line class="fo-axe" x1="${g.x0}" y1="${g.y1}" x2="${g.x0}" y2="${g.y0 - 14}"/>${pointe(g.x0, g.y0 - 14, 'haut')}`);
    s.push(`<text class="fo-titre" x="${g.x0 + 9}" y="${g.y0 - 12}">${o.titreY || `${o.nom}(t) (en ${o.unite})`}</text>`);
    // titre de l'axe des temps sous les graduations (il ne cache pas la courbe)
    s.push(`<text class="fo-titre" x="${g.x1 + 4}" y="${g.y1 + 34}" text-anchor="end">t (en ms)</text>`);
    // courbes, limitées à la zone du graphique
    s.push(`<clipPath id="${id}"><rect x="${g.x0}" y="${g.y0 - 2}" width="${g.x1 - g.x0}" height="${g.y1 - g.y0 + 4}"/></clipPath><g clip-path="url(#${id})">`);
    const ms = t => t / 1000;
    if (o.cible) s.push(`<path class="fo-cible" d="${chemin(g, t => valeur(o.cible, ms(t)), n)}"/>`);
    if (o.ideale && spec.a[0]) s.push(`<path class="fo-ideale" d="${cheminIdeal(g, spec, o.ideale)}"/>`);
    const sur = o.surligne;
    if (o.harmoniques) {
      if (spec.a0) s.push(`<path d="${chemin(g, () => spec.a0, 2)}" fill="none" stroke="${COUL.a0}" stroke-width="1.4" opacity="${sur != null ? .3 : .9}"/>`);
      spec.a.forEach((a, i) => {
        if (a && i + 1 !== sur) s.push(`<path d="${chemin(g, t => composante(spec, i + 1, ms(t)), n)}" fill="none" stroke="${coulDe(i + 1)}" stroke-width="1.4" opacity="${sur != null ? .3 : .95}"/>`);
      });
    }
    if (o.moyenne) {
      s.push(`<line class="fo-moyenne" x1="${g.x0}" y1="${g.Y(spec.a0 || 0)}" x2="${g.x1}" y2="${g.Y(spec.a0 || 0)}"/>`);
    }
    if (o.somme !== false) s.push(`<path class="fo-courbe" d="${chemin(g, t => valeur(spec, ms(t)), n)}"/>`);
    // harmonique mis en valeur (raie touchée dans le spectre ou dans la légende)
    if (sur != null && (sur === 0 ? spec.a0 : spec.a[sur - 1])) {
      s.push(`<path d="${chemin(g, t => composante(spec, sur, ms(t)), sur === 0 ? 2 : n)}" fill="none" stroke="${coulDe(sur)}" stroke-width="3"/>`);
    }
    s.push('</g>');
    if (o.moyenne) s.push(`<text class="fo-txt fo-txt-moy" x="${g.x0 + 6}" y="${g.Y(spec.a0 || 0) - 6}">valeur moyenne = ${sub('a', 0, ` = ${fmt(spec.a0 || 0)} ${o.unite}`)}</text>`);
    if (o.mesure) s.push(svgMesure(g, o.mesure));
    return `<svg class="fo-svg" viewBox="0 0 ${o.W} ${g.H}" width="${o.W}" height="${g.H}" role="img" aria-label="${o.aria || `Graphique de ${o.nom}(t) en fonction du temps, de 0 à ${etiq(ax.tmax)} ms`}">${s.join('')}</svg>`;
  }

  // deux curseurs verticaux et la durée qui les sépare (flèche double et étiquette)
  function svgMesure(g, m) {
    const xa = g.X(Math.min(m.t1, m.t2)), xb = g.X(Math.max(m.t1, m.t2)), y = g.y0 + 12;
    let s = `<line class="fo-mes" x1="${g.X(m.t1)}" y1="${g.y0}" x2="${g.X(m.t1)}" y2="${g.y1}"/><line class="fo-mes" x1="${g.X(m.t2)}" y1="${g.y0}" x2="${g.X(m.t2)}" y2="${g.y1}"/>`;
    if (xb - xa > 14) {
      s += `<line class="fo-mes-fl" x1="${xa + 2}" y1="${y}" x2="${xb - 2}" y2="${y}"/>` +
        `<path class="fo-mes-pt" d="M${xa + 1},${y}L${xa + 9},${y - 4}L${xa + 9},${y + 4}Z"/><path class="fo-mes-pt" d="M${xb - 1},${y}L${xb - 9},${y - 4}L${xb - 9},${y + 4}Z"/>`;
    }
    const lab = m.label != null ? m.label : `Δt = ${fmt(Math.abs(m.t2 - m.t1), m.dec)} ms`;
    if (lab) s += `<text class="fo-mes-txt" x="${(xa + xb) / 2}" y="${y - 6}" text-anchor="middle">${lab}</text>`;
    if (m.poignees) {
      [1, 2].forEach(k => {
        const x = g.X(m['t' + k]);
        s += `<g class="fo-tire" data-mes="${k}"><rect x="${x - 16}" y="${g.y0}" width="32" height="${g.y1 - g.y0}" fill="transparent"/>` +
          `<rect class="fo-mes-poignee" x="${x - 9}" y="${g.y1 - 30}" width="18" height="26" rx="9"/>` +
          `<line class="fo-mes-grip" x1="${x - 3}" y1="${g.y1 - 22}" x2="${x - 3}" y2="${g.y1 - 12}"/><line class="fo-mes-grip" x1="${x + 3}" y1="${g.y1 - 22}" x2="${x + 3}" y2="${g.y1 - 12}"/></g>`;
      });
    }
    return s;
  }

  /* ============================================================
     SPECTRE
     ============================================================ */
  function geomSpectre(W, H, fmax, amax, mb) {
    const x0 = 50, x1 = W - 18, y0 = 30, y1 = H - (mb || 30);
    return {
      W, H, x0, x1, y0, y1, fmax, amax,
      X: f => x0 + f / fmax * (x1 - x0),
      Y: a => y1 - a / amax * (y1 - y0),
      A: y => (y1 - y) / (y1 - y0) * amax,
    };
  }
  // géométrie exacte d'un spectre dessiné par svgSpectre avec les mêmes options (outils qui s'y superposent) ;
  // le titre de l'axe des fréquences, sous les graduations, ajoute 16 px à la hauteur o.H
  function geomSpectreDe(liste, o) {
    o = Object.assign({ H: 200 }, o);
    const fmax = o.fmax || plafondJoli(Math.max(...liste.map(r => r.f)) * 1.15 || 100);
    const amax = o.amax || plafondJoli(Math.max(...liste.map(r => r.a)) * 1.1 || 1);
    const bas = o.titreBas !== false;
    return Object.assign(geomSpectre(o.W, o.H + (bas ? 16 : 0), fmax, amax, bas ? 46 : 30), { bas });
  }
  function svgSpectre(liste, o) {
    o = Object.assign({ H: 200, unite: 'V', uniteF: 'Hz', epais: 3 }, o);
    const g = geomSpectreDe(liste, o), fmax = g.fmax, amax = g.amax, bas = g.bas;
    const kF = o.uniteF === 'kHz' ? 1000 : 1;
    const s = [];
    // bande passante (zone grisée)
    if (o.bande) {
      const xa = g.X(borne(o.bande[0], 0, fmax)), xb = g.X(borne(o.bande[1], 0, fmax));
      s.push(`<rect class="fo-bande" x="${xa}" y="${g.y0}" width="${Math.max(0, xb - xa)}" height="${g.y1 - g.y0}"/>`);
      if (xb - xa > 60) s.push(`<text class="fo-txt fo-txt-bande" x="${(xa + xb) / 2}" y="${g.y0 + 13}" text-anchor="middle">bande passante</text>`);
    }
    // graduations verticales
    const pasA = o.pasA || pasExact(amax, [4, 5, 8, 10, 6, 3]);
    const gradA = o.gradA || Array.from({ length: Math.round(amax / pasA) + 1 }, (_, k) => k * pasA);
    gradA.forEach(a => {
      const y = g.Y(a);
      if (a) s.push(`<line class="fo-grille" x1="${g.x0}" y1="${y}" x2="${g.x1}" y2="${y}"/>`);
      if (!o.etiqA || dans(o.etiqA, a)) s.push(`<text class="fo-txt" x="${g.x0 - 6}" y="${y + 4}" text-anchor="end">${etiq(a)}</text>`);
    });
    // graduations horizontales (en Hz ou en kHz)
    const pasF = o.pasF || pasJoli(fmax, Math.max(3, Math.min(7, Math.floor((g.x1 - g.x0) / 60))));
    const gradF = o.gradF || Array.from({ length: Math.floor(fmax / pasF + 1e-9) + 1 }, (_, k) => k * pasF);
    gradF.forEach(f => {
      const x = g.X(f);
      if (f) s.push(`<line class="fo-grille" x1="${x}" y1="${g.y0}" x2="${x}" y2="${g.y1}"/>`);
      s.push(`<line class="fo-axe" x1="${x}" y1="${g.y1}" x2="${x}" y2="${g.y1 + 4}"/>`);
      if (!o.etiqF || dans(o.etiqF, f)) s.push(`<text class="fo-txt" x="${x}" y="${g.y1 + 17}" text-anchor="middle">${etiq(f / kF)}</text>`);
    });
    s.push(`<line class="fo-axe" x1="${g.x0}" y1="${g.y1}" x2="${g.x1 + 4}" y2="${g.y1}"/>${pointe(g.x1 + 4, g.y1, 'droite')}`);
    s.push(`<line class="fo-axe" x1="${g.x0}" y1="${g.y1}" x2="${g.x0}" y2="${g.y0 - 14}"/>${pointe(g.x0, g.y0 - 14, 'haut')}`);
    s.push(`<text class="fo-titre" x="${g.x0 + 9}" y="${g.y0 - 12}">${o.titreA || sub('a', 'n', o.unite ? ` (en ${o.unite})` : '')}</text>`);
    s.push(`<text class="fo-titre" x="${g.x1 + 4}" y="${bas ? g.y1 + 36 : g.y1 - 8}" text-anchor="end">${o.titreF || `Fréquence (en ${o.uniteF})`}</text>`);
    // raies verticales fines
    liste.forEach(r => {
      if (r.f > fmax * 1.001 || !r.a) return;
      const x = g.X(r.f), coul = r.coul ? ` stroke="${r.coul}"` : '';
      s.push(`<line class="fo-raie" x1="${x}" y1="${g.y1}" x2="${x}" y2="${g.Y(Math.min(r.a, amax))}" stroke-width="${r.f ? o.epais : o.epais + 2.5}"${coul}/>`);
      if (o.etiquettes) s.push(`<text class="fo-txt fo-txt-raie" x="${r.f ? x : x + 5}" y="${g.Y(Math.min(r.a, amax)) - 6}" text-anchor="${r.f ? 'middle' : 'start'}">${r.nom || sub('a', r.n)}</text>`);
    });
    return `<svg class="fo-svg" viewBox="0 0 ${o.W} ${g.H}" width="${o.W}" height="${g.H}" role="img" aria-label="${o.aria || 'Spectre en amplitude : raies verticales en fonction de la fréquence'}">${s.join('')}</svg>`;
  }

  /* ============================================================
     SIGNAUX PRÉDÉFINIS
     ============================================================ */
  const r2 = v => Math.round(v * 100) / 100;
  const PREDEFINIS = {
    sinus: { label: 'Sinusoïde pure', a0: 0, a: [1], forme: null },
    creneau: { label: 'Créneau', a0: 0, a: Array.from({ length: 10 }, (_, i) => ((i + 1) % 2 ? r2(4 / ((i + 1) * Math.PI)) : 0)), forme: 'creneau' },
    scie: { label: 'Dent de scie', a0: 0, a: Array.from({ length: 10 }, (_, i) => r2(2 / ((i + 1) * Math.PI))), forme: 'scie' },
    cours: { label: 'Exemple du cours', f1: 150, a0: 1, a: [1.5, 1, .67, .17], forme: null },
    ex6: { label: 'Exercice 6', f1: 200, a0: 0, a: [.5, .75, 0, 0, 1], forme: null },
    zero: { label: 'Tout à zéro', a0: 0, a: [], forme: null },
  };

  /* ============================================================
     SIMULATEUR INTERACTIF
     ============================================================ */
  function el(tag, cls, html) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }
  const nomH = n => `a<sub>${n}</sub>`;
  const LIB_CASES = {
    harmoniques: 'Afficher les harmoniques séparément',
    ideale: 'Afficher la forme idéale',
    moyenne: 'Afficher la valeur moyenne',
    mesure: 'Curseurs de mesure',
  };

  function monter(zone, opts) {
    const o = Object.assign({ N: 10, f1: 200, a0: 0, a: [], amax: 2, nom: 'u', unite: 'V', commandes: true, predefinis: true, cases: true,
      signal: true, spectre: true, Hs: null, Hf: null }, opts);
    const remplir = l => Array.from({ length: o.N }, (_, i) => +(l && l[i]) || 0);
    const etat = {
      f1: o.f1, a0: o.a0, a: remplir(o.a), amax: o.amax, ymax: o.ymax || null, forme: o.forme || null,
      harmoniques: !!o.harmoniques, ideale: !!o.ideale, moyenne: !!o.moyenne, mesure: !!o.mesure, t1: o.t1 == null ? null : o.t1, t2: o.t2 == null ? null : o.t2,
      sel: 1, surligne: false, cible: o.cible || null, bande: o.bande || null,
    };
    const cases = o.cases === true ? ['harmoniques', 'ideale', 'moyenne', 'mesure'] : (o.cases || []);
    const ecouteurs = [];
    let gelF = null, survol = null, glisse = null;
    const racine = el('div', 'fo-simu');
    racine.innerHTML = `
      ${o.signal ? `<div class="fo-bloc"><div class="fo-g" data-a="gs"></div><p class="fo-lect-mes" data-a="lm" aria-live="polite" hidden></p>
        ${o.legende === false ? '' : `<div class="fo-legende" data-a="leg" aria-label="Composantes du signal : touche-en une pour la mettre en valeur"></div>`}</div>` : ''}
      ${o.spectre ? `<div class="fo-bloc"><div class="fo-g fo-g-spectre" data-a="gf"></div>
        <p class="fo-lecture" data-a="lec" aria-live="polite"></p>
        ${o.commandes ? `<div class="fo-fin">
          <span class="fo-fin-t">Réglage précis</span>
          <span class="fo-fin-l"><button type="button" class="fo-mini" data-a="prec" aria-label="Raie précédente">◀</button>
          <label class="fo-fin-champ"><span data-a="finNom"></span> =
            <input type="text" class="fo-champ" inputmode="decimal" autocomplete="off" autocapitalize="off" spellcheck="false" data-a="finVal" aria-label="Amplitude de la raie choisie">
            <span>${o.unite}</span></label>
          <button type="button" class="fo-mini" data-a="suiv" aria-label="Raie suivante">▶</button></span>
          <span class="fo-fin-l"><button type="button" class="fo-mini" data-a="moins" aria-label="Diminuer de 0,05">−</button>
          <button type="button" class="fo-mini" data-a="plus" aria-label="Augmenter de 0,05">+</button></span>
        </div>` : ''}</div>` : ''}
      ${o.commandes ? `<div class="fo-reglages">
        <label class="fo-reglage"><span class="fo-reglage-nom">Fondamental f<sub>1</sub> = <b data-a="vf1"></b></span>
          <input type="range" min="50" max="1000" step="10" data-r="f1" aria-label="Fréquence du fondamental f1, en hertz"></label>
        <label class="fo-reglage"><span class="fo-reglage-nom">Composante continue a<sub>0</sub> = <b data-a="va0"></b></span>
          <input type="range" min="-2" max="2" step="0.1" data-r="a0" aria-label="Composante continue a0, en ${o.unite === 'V' ? 'volts' : o.unite}"></label>
      </div>` : ''}
      ${o.predefinis ? `<div class="fo-predef"><p class="fo-petit-t">Signaux prédéfinis</p><div class="fo-predef-l">
        ${Object.keys(PREDEFINIS).map(k => `<button type="button" class="btn-secondary" data-p="${k}">${PREDEFINIS[k].label}</button>`).join('')}</div></div>` : ''}
      ${cases.length ? `<div class="fo-options">${cases.map(k => `<label class="fo-case"><input type="checkbox" data-c="${k}"><span data-lib="${k}">${LIB_CASES[k]}</span></label>`).join('')}</div>` : ''}`;
    zone.appendChild(racine);
    const $ = a => racine.querySelector(`[data-a="${a}"]`);
    const gs = $('gs'), gf = $('gf');

    const spec = () => ({ f1: etat.f1, a0: etat.a0, a: etat.a });
    const periode = () => 1000 / etat.f1;           // en ms
    const fmaxFitte = () => (o.N + .6) * etat.f1;
    const fmaxAff = () => gelF || fmaxFitte();
    const largeur = d => Math.max(240, Math.round(d.clientWidth || zone.clientWidth || 600));
    const hauteur = (h, W) => h || (W < 520 ? 205 : 235);
    // axes du signal (les mêmes pour le dessin et pour le glisser des curseurs)
    function axes() { return axesSignal(spec(), { tmax: o.tmax, pasT: o.pasT, ymin: o.ymin, ymax: etat.ymax || (o.ymin == null ? etat.amax * 2 : o.ymax), pasY: o.pasY, cible: etat.cible }); }
    const pasMes = tmax => pasJoli(tmax, 100);
    const decMes = tmax => Math.max(0, -Math.floor(Math.log10(pasMes(tmax)) + 1e-9));
    function placerCurseurs(tmax) {
      const p = pasMes(tmax), arr = v => +(Math.round(v / p) * p).toFixed(6);
      if (etat.t1 == null || etat.t1 > tmax) etat.t1 = arr(tmax * .1);
      if (etat.t2 == null || etat.t2 > tmax) etat.t2 = arr(tmax * .55);
    }

    /* ---------- dessin ---------- */
    function dessinerSignal() {
      if (!gs) return;
      const W = largeur(gs), ax = axes();
      if (etat.mesure) placerCurseurs(ax.tmax);
      gs.innerHTML = svgSignal(spec(), {
        W, H: hauteur(o.Hs, W), tmax: ax.tmax, pasT: ax.pasT, ymin: ax.ymin, ymax: ax.ymax, pasY: ax.pasY, nom: o.nom, unite: o.unite, titreY: o.titreY,
        harmoniques: etat.harmoniques, ideale: etat.ideale && etat.forme, moyenne: etat.moyenne, cible: etat.cible,
        surligne: etat.surligne ? etat.sel : null,
        mesure: etat.mesure ? { t1: etat.t1, t2: etat.t2, dec: decMes(ax.tmax), poignees: true } : null,
      });
      const lm = $('lm');
      if (lm) {
        lm.hidden = !etat.mesure;
        if (etat.mesure) {
          const d = decMes(ax.tmax);
          lm.innerHTML = `Curseurs : t<sub>1</sub> = ${fmt(Math.min(etat.t1, etat.t2), d)} ms ; t<sub>2</sub> = ${fmt(Math.max(etat.t1, etat.t2), d)} ms ; durée entre les curseurs <b>Δt = ${fmt(Math.abs(etat.t2 - etat.t1), d)} ms</b>`;
        }
      }
      // légende : une pastille par composante non nulle (la toucher met la composante en valeur)
      const leg = $('leg');
      if (leg) {
        const l = raies(spec());
        leg.innerHTML = l.length ? l.map(r => `<button type="button" class="fo-leg${etat.surligne && etat.sel === r.n ? ' actif' : ''}" data-n="${r.n}" aria-pressed="${etat.surligne && etat.sel === r.n}">
            <svg width="18" height="10" aria-hidden="true"><line x1="1" y1="5" x2="17" y2="5" stroke="${coulDe(r.n)}" stroke-width="3"/></svg><span>${nomH(r.n)} · ${etiq(r.f)} Hz</span></button>`).join('')
          : '<span class="fo-leg-vide">Toutes les amplitudes sont nulles : le signal est nul.</span>';
      }
    }
    function dessinerSpectre() {
      if (!gf) return;
      const W = largeur(gf), H = o.Hf || (W < 520 ? 195 : 215), fmax = fmaxAff();
      const g = geomSpectreDe([], { W, H, fmax, amax: etat.amax });
      const coulR = n => (etat.harmoniques || (etat.surligne && etat.sel === n) ? coulDe(n) : null);
      const liste = raies(spec(), { zeros: true }).map(r => Object.assign(r, { coul: coulR(r.n) }));
      let svg = svgSpectre(liste, { W, H, fmax, amax: etat.amax, unite: o.unite, etiquettes: false, bande: etat.bande, aria: 'Spectre du signal : fais glisser la poignée en haut d\'une raie pour régler son amplitude' });
      // ajouts interactifs : étiquettes, colonnes à toucher, poignées
      const esp = (g.X(etat.f1) - g.X(0));
      const s = [], dessous = [];
      liste.forEach(r => {
        if (r.f > fmax * 1.001) return;
        const x = g.X(r.f), y = g.Y(Math.min(r.a, etat.amax)), choisie = etat.sel === r.n;
        const w = Math.max(24, Math.min(esp, 70));
        s.push(`<rect data-col="${r.n}" x="${r.n ? x - w / 2 : x - Math.min(w / 2, 24)}" y="${g.y0}" width="${r.n ? w : Math.min(w / 2, 24) + w / 2}" height="${g.y1 - g.y0 + 24}" fill="transparent"/>`);
        if (choisie) dessous.push(`<line class="fo-raie-choix" x1="${x}" y1="${g.y1}" x2="${x}" y2="${r.a ? y : g.y1}"/>`);
        if (r.a || choisie || esp >= 34) s.push(`<text class="fo-txt fo-txt-raie${r.a ? '' : ' nul'}${choisie ? ' choisie' : ''}" x="${r.n ? x : x + 7}" y="${(r.a ? y : g.y1) - (r.n ? 14 : 6)}" text-anchor="${r.n ? 'middle' : 'start'}">${sub('a', r.n)}</text>`);
        if (r.n && o.commandes) {
          s.push(`<g class="fo-tire" data-poignee="${r.n}"><rect x="${x - w / 2}" y="${y - 22}" width="${w}" height="44" fill="transparent"/>` +
            `<circle class="fo-poignee${r.a ? '' : ' nul'}" cx="${x}" cy="${y}" r="7"${r.a && coulR(r.n) ? ` stroke="${coulR(r.n)}"` : ''}/></g>`);
        }
      });
      // la raie choisie est soulignée sous le dessin ; étiquettes et poignées par-dessus
      svg = svg.replace(/^(<svg[^>]*>)/, '$1' + dessous.join(''));
      gf.innerHTML = svg.replace('</svg>', s.join('') + '</svg>');
      gf.dataset.g = JSON.stringify({ x0: g.x0, x1: g.x1, y0: g.y0, y1: g.y1, W });
    }
    // texte de lecture d'une raie : f₃ = 3 × f₁ = 450 Hz ; a₃ = 0,67 V
    function texteRaie(n) {
      if (n === 0) return `f = 0 Hz : <b>composante continue</b> ${nomH(0)} = ${fmt(etat.a0)} ${o.unite} (valeur moyenne du signal)`;
      const a = etat.a[n - 1];
      if (n === 1) return `f<sub>1</sub> = ${fmt(etat.f1)} Hz : <b>fondamental</b> ; ${nomH(1)} = ${fmt(a)} ${o.unite}`;
      return `f<sub>${n}</sub> = ${n} × f<sub>1</sub> = ${n} × ${fmt(etat.f1)} = ${fmt(n * etat.f1)} Hz : <b>harmonique de rang ${n}</b> ; ${nomH(n)} = ${fmt(a)} ${o.unite}`;
    }
    function majTextes() {
      const lec = $('lec');
      if (lec) lec.innerHTML = texteRaie(survol != null ? survol : etat.sel);
      const vf1 = $('vf1'), va0 = $('va0');
      if (vf1) vf1.textContent = `${fmt(etat.f1)} Hz`;
      if (va0) va0.textContent = `${fmt(etat.a0)} ${o.unite}`;
      const fN = $('finNom'), fV = $('finVal');
      if (fN) fN.innerHTML = nomH(etat.sel);
      if (fV && document.activeElement !== fV) fV.value = fmt(etat.sel ? etat.a[etat.sel - 1] : etat.a0);
      racine.querySelectorAll('input[data-r]').forEach(i => { i.value = etat[i.dataset.r]; });
      racine.querySelectorAll('input[data-c]').forEach(i => {
        const k = i.dataset.c;
        i.checked = !!etat[k];
        if (k === 'ideale') {
          i.disabled = !etat.forme;
          racine.querySelector('[data-lib="ideale"]').textContent = etat.forme ? `Afficher la forme idéale (${etat.forme === 'creneau' ? 'créneau' : 'dent de scie'})` : 'Afficher la forme idéale (charge le créneau ou la dent de scie)';
        }
      });
    }
    function dessiner() { dessinerSignal(); dessinerSpectre(); majTextes(); }
    function signaler() { const e = copie(); ecouteurs.forEach(f => f(e)); }
    function copie() { return JSON.parse(JSON.stringify(etat)); }

    /* ---------- réglages ---------- */
    function regler(r, silencieux) {
      r = r || {};
      if (r.predef) { charger(r.predef, true); }
      ['f1', 'a0', 'amax', 'ymax', 'forme', 'harmoniques', 'ideale', 'moyenne', 'mesure', 't1', 't2', 'sel', 'surligne', 'cible', 'bande'].forEach(k => { if (k in r) etat[k] = r[k]; });
      if ('f1' in r) gelF = null;
      if (Array.isArray(r.a)) etat.a = remplir(r.a);
      else if (r.a) Object.keys(r.a).forEach(n => { etat.a[n - 1] = +r.a[n]; });
      if ('amax' in r && !('ymax' in r)) etat.ymax = null;
      dessiner();
      if (!silencieux) signaler();
    }
    function charger(nom, sansDessin) {
      const p = PREDEFINIS[nom];
      if (!p) return;
      etat.a0 = p.a0; etat.a = remplir(p.a); etat.forme = p.forme;
      if (p.f1) etat.f1 = p.f1;
      if (!p.forme) etat.ideale = false;
      gelF = null;
      if (!sansDessin) { dessiner(); signaler(); }
    }
    const pas = n => (n === 0 ? .1 : .05);
    function fixerAmpl(n, v, quant) {
      if (n === 0) etat.a0 = Math.round(borne(v, -2, 2) * 100) / 100;
      else {
        if (quant) v = Math.round(v / .05) * .05;
        etat.a[n - 1] = Math.round(borne(v, 0, etat.amax) * 100) / 100;
      }
    }

    /* ---------- événements : spectre (glisser une raie, toucher une raie) ---------- */
    function point(e, div) {
      const svg = div.querySelector('svg'), r = svg.getBoundingClientRect(), k = (+svg.getAttribute('width')) / r.width;
      return { x: (e.clientX - r.left) * k, y: (e.clientY - r.top) * k };
    }
    if (gf) {
      gf.addEventListener('pointerdown', e => {
        const p = e.target.closest('[data-poignee]'), c = e.target.closest('[data-col]');
        if (p && o.commandes) {
          e.preventDefault();
          glisse = { type: 'raie', n: +p.dataset.poignee, id: e.pointerId };
          gf.setPointerCapture(e.pointerId);
          etat.sel = glisse.n; etat.surligne = true;
          bouger(e);
        } else if (c) glisse = { type: 'clic', n: +c.dataset.col, x: e.clientX, y: e.clientY, id: e.pointerId };
      });
      const bouger = e => {
        if (!glisse || glisse.type !== 'raie' || e.pointerId !== glisse.id) return;
        const g = JSON.parse(gf.dataset.g), pt = point(e, gf);
        fixerAmpl(glisse.n, (g.y1 - pt.y) / (g.y1 - g.y0) * etat.amax, true);
        dessiner(); signaler();
      };
      gf.addEventListener('pointermove', e => {
        if (glisse) { bouger(e); return; }
        if (e.pointerType !== 'mouse') return;
        const c = e.target.closest('[data-col]'), n = c ? +c.dataset.col : null;
        if (n !== survol) { survol = n; majTextes(); }
      });
      const fin = e => {
        if (!glisse || e.pointerId !== glisse.id) return;
        // simple appui sur une colonne : la raie est choisie (et mise en valeur, ou plus si on la retouche)
        if (glisse.type === 'clic' && Math.hypot(e.clientX - glisse.x, e.clientY - glisse.y) < 10) {
          if (etat.sel === glisse.n) etat.surligne = !etat.surligne; else { etat.sel = glisse.n; etat.surligne = true; }
          dessiner(); signaler();
        }
        glisse = null;
      };
      gf.addEventListener('pointerup', fin);
      gf.addEventListener('pointercancel', () => { glisse = null; });
      gf.addEventListener('pointerleave', () => { if (survol != null) { survol = null; majTextes(); } });
    }
    /* ---------- événements : curseurs de mesure sur le signal ---------- */
    if (gs) {
      gs.addEventListener('pointerdown', e => {
        const m = e.target.closest('[data-mes]');
        if (!m) return;
        e.preventDefault();
        glisse = { type: 'mes', k: m.dataset.mes, id: e.pointerId };
        gs.setPointerCapture(e.pointerId);
      });
      gs.addEventListener('pointermove', e => {
        if (!glisse || glisse.type !== 'mes' || e.pointerId !== glisse.id) return;
        const ax = axes(), W = largeur(gs), g = geomSignal(W, 0, ax.tmax, ax.ymin, ax.ymax, 46), pt = point(e, gs), p = pasMes(ax.tmax);
        etat['t' + glisse.k] = +borne(Math.round(g.T(pt.x) / p) * p, 0, ax.tmax).toFixed(6);
        dessinerSignal(); signaler();
      });
      const fin = () => { glisse = null; };
      gs.addEventListener('pointerup', fin);
      gs.addEventListener('pointercancel', fin);
    }
    const leg = $('leg');
    if (leg) leg.addEventListener('click', e => {
      const b = e.target.closest('.fo-leg');
      if (!b) return;
      const n = +b.dataset.n;
      if (etat.sel === n && etat.surligne) etat.surligne = false; else { etat.sel = n; etat.surligne = true; }
      dessiner(); signaler();
    });
    /* ---------- événements : curseurs, réglage précis, boutons, cases ---------- */
    racine.querySelectorAll('input[data-r]').forEach(i => {
      i.addEventListener('input', () => {
        const k = i.dataset.r, v = parseFloat(i.value);
        // pendant le réglage de f1, l'axe des fréquences reste fixe : on voit les raies se déplacer
        if (k === 'f1' && gelF == null) gelF = fmaxFitte();
        etat[k] = k === 'a0' ? Math.round(v * 10) / 10 : v;
        dessiner(); signaler();
      });
      i.addEventListener('change', () => { if (i.dataset.r === 'f1') { gelF = null; dessiner(); } });
    });
    const fV = $('finVal');
    if (fV) {
      const valider = () => {
        const v = lire(fV.value);
        if (!isNaN(v)) { fixerAmpl(etat.sel, v); dessiner(); signaler(); }
        fV.value = fmt(etat.sel ? etat.a[etat.sel - 1] : etat.a0);
      };
      fV.addEventListener('change', valider);
      fV.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); valider(); fV.blur(); } });
      const changerSel = d => { etat.sel = (etat.sel + d + o.N + 1) % (o.N + 1); etat.surligne = true; dessiner(); signaler(); };
      $('prec').onclick = () => changerSel(-1);
      $('suiv').onclick = () => changerSel(1);
      $('moins').onclick = () => { const n = etat.sel; fixerAmpl(n, (n ? etat.a[n - 1] : etat.a0) - pas(n)); dessiner(); signaler(); };
      $('plus').onclick = () => { const n = etat.sel; fixerAmpl(n, (n ? etat.a[n - 1] : etat.a0) + pas(n)); dessiner(); signaler(); };
    }
    racine.querySelectorAll('[data-p]').forEach(b => { b.onclick = () => charger(b.dataset.p); });
    racine.querySelectorAll('input[data-c]').forEach(i => {
      i.addEventListener('change', () => { etat[i.dataset.c] = i.checked; dessiner(); signaler(); });
    });

    // redessin à la largeur disponible (rotation du téléphone…)
    let largeurVue = 0;
    const suivre = () => { const w = racine.clientWidth; if (w && w !== largeurVue) { largeurVue = w; dessiner(); } };
    if (window.ResizeObserver) new ResizeObserver(suivre).observe(racine); else addEventListener('resize', suivre);
    dessiner();

    return {
      el: racine,
      etat: copie,
      regler,
      charger: nom => charger(nom),
      surChange(f) { ecouteurs.push(f); },
      periode,
      valeur: t => valeur(spec(), t),
    };
  }

  window.FOURIER = { COUL, coulDe, fmt, lire, pasJoli, plafondJoli, sub, valeur, raies, extremes, geomSignal, geomSpectre, geomSpectreDe, axesSignal, svgSignal, svgSpectre, monter, PREDEFINIS };
})();
