/* ============================================================
   Modulation d'amplitude et de fréquence : simulateur et figures

   Moteur (objet global MOD) de l'application « Chapitre 19 : Ondes
   électromagnétiques ». Calcul en JavaScript pur, figures en SVG,
   aucune bibliothèque, aucun fetch, aucune animation. Couleurs par
   classes CSS (oem.css) : courbes --accent, quadrillage --paper-3.

   Échelles pédagogiques : temps en ms, fréquences en kHz
   (modulant f_m ≈ 1 kHz, porteuse F ≈ 20 kHz).

   Un réglage (« e ») : { fm (kHz), Um (V), F (kHz), forme ('sinus' | 'son') }
     modulant  u(t) = Um × sin(2π fm t)   (ou un son à 3 harmoniques de même amplitude max Um,
                                          calculé avec FOURIER.valeur quand assets/fourier.js est chargé)
     porteuse  p(t) = Ap × sin(2π F t)    (Ap = 1 V)
     AM        s(t) = Ap × (1 + u(t) / U0) × sin(2π F t)    taux de modulation m = Um / U0 (U0 = 1 V)
     FM        fréquence instantanée F + k × u(t), k = KF × F : excursion ΔF = KF × F × Um

   MOD.modulant(e, t), MOD.valeur(type, e, t)     valeurs (t en ms) ; type : 'modulant' | 'porteuse' | 'am' | 'fm'
   MOD.derive(e)                                  m, ΔF, f_h, bande occupée, raies du spectre AM…
   MOD.svgSignal(type, e, o)                      un graphique (texte SVG)
       o = { W, H, tmax (2 ms), titre, axeT (graduations du temps), enveloppe (AM), reperes (FM),
             ymax, aria }
   MOD.svgSpectre(e, o)                           spectre du signal modulé en AM (raies)
       o = { W, H, modulant (raies du modulant près de 0), bande (accolade « bande occupée »),
             station2 (écart des porteuses en kHz, ou null), fmax, aria }
   MOD.svgRaies(o)                                spectre quelconque : o = { W, H, raies [{ f, a, cls }], fmax, pasF,
                                                  etiqF, amax, pasA, etiqA, titreF, titreA, aria }
   MOD.accolade(xa, xb, y, texte)                 accolade horizontale légendée (bande occupée…)
   MOD.svgCourbe(o)                               courbe quelconque : o = { W, H, f(t), tmin, tmax, pasT, etiqT,
                                                  ymin, ymax, pasY, etiqY, titreT, titreY, aria }
   MOD.monter(zone, opts)                         simulateur (plusieurs exemplaires possibles) :
       trois graphiques empilés sur le même axe des temps (modulant, porteuse, modulé),
       gros boutons AM / FM et « Comparer », curseurs f_m, U_m, F, forme du modulant,
       spectre AM avec la bande occupée et une deuxième station (brouillage).
       opts = { mode, forme, fm, Um, F, comparer, spectre (bool), station2 (bool), ecart,
                commandes (bool), ordres (bool : encadré des ordres de grandeur réels) }
       → instance { el, etat(), regler(r, silencieux), surChange(f) }
   ============================================================ */
(function () {
  'use strict';

  const MOINS = '−';
  const AP = 1;            // amplitude de la porteuse (V)
  const U0 = 1;            // tension ajoutée au modulant en AM (V) : m = Um / U0
  const KF = 0.4;          // excursion FM : ΔF = KF × F × Um
  const TMAX = 2;          // fenêtre de temps des graphiques (ms)
  const SON = [1, .5, .35];   // amplitudes relatives des harmoniques du « son » (rangs 1 à 3)

  /* ---------- nombres ---------- */
  // nombre écrit à la française : 2,3 ; −0,5 ; 1 000
  function fmt(v, dec) {
    if (dec != null) {
      const s = (Math.abs(v) < Math.pow(10, -dec) / 2 ? 0 : v).toFixed(dec);
      return s.replace('-', MOINS).replace('.', ',');
    }
    let s = String(+(Math.round(v * 1e9) / 1e9).toPrecision(6));
    const neg = s[0] === '-';
    if (neg) s = s.slice(1);
    let [a, d] = s.split('.');
    a = a.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return (neg ? MOINS : '') + (d ? a + ',' + d : a);
  }
  const r1 = v => Math.round(v * 10) / 10;         // coordonnée SVG arrondie au dixième
  const echapper = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  let nSvg = 0;                                    // identifiants uniques (motifs de hachures)

  /* ============================================================
     SIGNAUX (t en ms, fréquences en kHz)
     ============================================================ */
  // somme des harmoniques du « son » (sans amplitude) ; FOURIER (chapitre 17) si chargé
  function sonBrut(fm, t) {
    if (window.FOURIER && window.FOURIER.valeur) return window.FOURIER.valeur({ f1: fm * 1000, a0: 0, a: SON }, t / 1000);
    return SON.reduce((s, a, i) => s + a * Math.sin(2 * Math.PI * (i + 1) * fm * t), 0);
  }
  // maximum de |somme| sur une période (normalisation du son)
  const NORME = (() => {
    let m = 0;
    for (let k = 0; k < 4000; k++) {
      const x = k / 4000;
      m = Math.max(m, Math.abs(SON.reduce((s, a, i) => s + a * Math.sin(2 * Math.PI * (i + 1) * x), 0)));
    }
    return m;
  })();
  function modulant(e, t) {
    if (e.forme === 'son') return e.Um * sonBrut(e.fm, t) / NORME;
    return e.Um * Math.sin(2 * Math.PI * e.fm * t);
  }
  const porteuse = (e, t) => AP * Math.sin(2 * Math.PI * e.F * t);
  const am = (e, t) => AP * (1 + modulant(e, t) / U0) * Math.sin(2 * Math.PI * e.F * t);

  // échantillons d'un signal sur [0, tmax] ; FM : phase intégrée pas à pas (méthode des trapèzes)
  function echantillons(type, e, tmax, n) {
    const pts = [];
    if (type === 'fm') {
      const k = KF * e.F;
      let phi = 0, fPrec = e.F + k * modulant(e, 0);
      for (let i = 0; i <= n; i++) {
        const t = tmax * i / n;
        if (i) {
          const f = e.F + k * modulant(e, t);
          phi += Math.PI * (f + fPrec) * (tmax / n);
          fPrec = f;
        }
        pts.push([t, AP * Math.sin(phi)]);
      }
      return pts;
    }
    const f = type === 'modulant' ? modulant : type === 'porteuse' ? porteuse : am;
    for (let i = 0; i <= n; i++) { const t = tmax * i / n; pts.push([t, f(e, t)]); }
    return pts;
  }
  function valeur(type, e, t) {
    if (type === 'fm') { const p = echantillons('fm', e, t, Math.max(50, Math.ceil(t * e.F * 40))); return p[p.length - 1][1]; }
    return (type === 'modulant' ? modulant : type === 'porteuse' ? porteuse : am)(e, t);
  }

  // grandeurs déduites d'un réglage : m, ΔF, plus haute fréquence du modulant, raies du spectre AM
  function derive(e) {
    const rangs = e.forme === 'son' ? SON.map((a, i) => ({ n: i + 1, a: e.Um * a / NORME })) : [{ n: 1, a: e.Um }];
    const fh = e.fm * rangs[rangs.length - 1].n, fb = e.fm;
    const lat = [];
    rangs.forEach(r => {
      const a = AP * (r.a / U0) / 2;                  // raies latérales : m × aₙ / 2
      lat.push({ f: e.F - r.n * e.fm, a, cote: 'inf' }, { f: e.F + r.n * e.fm, a, cote: 'sup' });
    });
    return {
      m: e.Um / U0, dF: KF * e.F * e.Um, fh, fb, bande: 2 * fh, de: e.F - fh, a: e.F + fh,
      surmod: e.Um / U0 > 1 + 1e-9, rangs, laterales: lat, ratio: e.F / e.fm,
    };
  }

  /* ============================================================
     GRAPHIQUES
     ============================================================ */
  // pas de graduation « joli » (1, 2, 2,5 ou 5 × 10ᵏ) pour environ n intervalles
  function pasJoli(etendue, n) {
    const brut = etendue / n, p = Math.pow(10, Math.floor(Math.log10(brut))), r = brut / p;
    return (r <= 1 ? 1 : r <= 2 ? 2 : r <= 2.5 ? 2.5 : r <= 5 ? 5 : 10) * p;
  }
  const multiples = (a, b, pas) => { const l = []; for (let v = Math.ceil(a / pas - 1e-9) * pas; v <= b + 1e-9; v += pas) l.push(+v.toFixed(9)); return l; };

  // repère : quadrillage, axes, graduations ; renvoie { X, Y, svg, x0, x1, y0, y1 }
  function repere(o) {
    const W = o.W, H = o.H, mg = o.mg != null ? o.mg : 40, md = o.md != null ? o.md : 12;
    const mh = o.mh != null ? o.mh : 22, mb = o.mb != null ? o.mb : (o.axeT === false ? 8 : 24);
    const x0 = mg, x1 = W - md, y0 = mh, y1 = H - mb;
    const X = t => x0 + (t - o.tmin) / (o.tmax - o.tmin) * (x1 - x0);
    const Y = v => y1 - (v - o.ymin) / (o.ymax - o.ymin) * (y1 - y0);
    let s = '';
    multiples(o.tmin, o.tmax, o.pasT).forEach(t => { s += `<line class="mod-grille" x1="${r1(X(t))}" y1="${y0}" x2="${r1(X(t))}" y2="${y1}"/>`; });
    multiples(o.ymin, o.ymax, o.pasY).forEach(v => { s += `<line class="mod-grille" x1="${x0}" y1="${r1(Y(v))}" x2="${x1}" y2="${r1(Y(v))}"/>`; });
    // axe du temps à l'ordonnée 0 (ou en bas), axe vertical à gauche
    const yAxe = o.ymin < 0 && o.ymax > 0 ? Y(0) : y1;
    s += `<line class="mod-axe" x1="${x0}" y1="${r1(yAxe)}" x2="${x1 + 4}" y2="${r1(yAxe)}"/><path class="mod-pointe" d="M${x1 + 9},${r1(yAxe)} l-7,-3.5 v7 z"/>`;
    s += `<line class="mod-axe" x1="${x0}" y1="${y1}" x2="${x0}" y2="${y0 - 6}"/><path class="mod-pointe" d="M${x0},${y0 - 11} l-3.5,7 h7 z"/>`;
    (o.etiqY || []).forEach(v => { s += `<text class="mod-txt" x="${x0 - 6}" y="${r1(Y(v) + 4)}" text-anchor="end">${fmt(v)}</text>`; });
    if (o.axeT !== false) {
      (o.etiqT || []).filter(t => !o.titreT || t < o.tmax - 1e-9).forEach(t => { s += `<text class="mod-txt" x="${r1(X(t))}" y="${y1 + 16}" text-anchor="middle">${fmt(t)}</text>`; });
      if (o.titreT) s += `<text class="mod-txt mod-titre-axe" x="${x1 + 8}" y="${y1 + 16}" text-anchor="end">${o.titreT}</text>`;
    }
    if (o.titre) s += `<text class="mod-titre" x="${x0 + 8}" y="${y0 - 6}">${o.titre}</text>`;
    return { X, Y, svg: s, x0, x1, y0, y1, yAxe };
  }
  const chemin = (pts, X, Y) => 'M' + pts.map(([t, v]) => `${r1(X(t))},${r1(Y(v))}`).join('L');
  const svgOuvrir = (W, H, aria, cls) => `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" class="mod-svg${cls ? ' ' + cls : ''}" role="img" aria-label="${echapper(aria || 'Graphique')}">`;

  const TITRES = { modulant: 'Signal modulant u(t)', porteuse: 'Porteuse p(t)', am: 'Signal modulé s(t) : modulation d\'amplitude (AM)', fm: 'Signal modulé s(t) : modulation de fréquence (FM)' };
  const TITRES_COURTS = { modulant: 'Modulant u(t)', porteuse: 'Porteuse p(t)', am: 'Modulé s(t) : AM', fm: 'Modulé s(t) : FM' };

  // instants du premier maximum et du premier minimum du modulant (repères FM)
  function extremes(e) {
    const T = 1 / e.fm;
    let tM = 0, tm = 0, vM = -Infinity, vm = Infinity;
    for (let k = 0; k <= 800; k++) { const t = T * k / 800, v = modulant(e, t); if (v > vM) { vM = v; tM = t; } if (v < vm) { vm = v; tm = t; } }
    return { tM, tm };
  }

  // un graphique : type 'modulant' | 'porteuse' | 'am' | 'fm'
  function svgSignal(type, e, o) {
    o = o || {};
    const W = Math.max(240, Math.round(o.W || 640)), tmax = o.tmax || TMAX;
    // le signal AM monte jusqu'à 2,2 V : graphique plus haut, même échelle verticale que les autres
    const H = o.H || (type === 'am' && !o.ymax ? (W < 480 ? 170 : 196) : (W < 480 ? 116 : 132));
    // échelle fixe (±2,5 V en AM) : quand U_m change, on voit l'amplitude changer
    const ymax = o.ymax || (type === 'am' ? 2.5 : 1.5);
    const g = repere({ W, H, tmin: 0, tmax, pasT: tmax / 8, etiqT: o.axeT === false ? [] : multiples(0, tmax, W < 420 ? tmax / 4 : tmax / 8).filter(t => t > 0),
      axeT: o.axeT, titreT: 't (ms)', ymin: -ymax, ymax, pasY: .5, etiqY: [-1, 0, 1].concat(ymax >= 2 ? [-2, 2] : []),
      titre: o.titre != null ? o.titre : (W < 480 ? TITRES_COURTS : TITRES)[type] });
    const n = Math.min(3000, Math.max(600, Math.round(tmax * (type === 'modulant' ? 2 : e.F * (type === 'fm' ? 1.5 : 1)) * 30)));
    let s = svgOuvrir(W, H, o.aria || TITRES[type], o.cls) + g.svg;
    // repères FM : modulant haut → oscillations resserrées ; modulant bas → écartées
    if (o.reperes && (type === 'fm' || type === 'modulant') && e.Um > 0) {
      const x = extremes(e), w = (g.X(.1 / e.fm) - g.X(0));
      [[x.tM, type === 'fm' ? 'resserrées' : 'haut'], [x.tm, type === 'fm' ? 'écartées' : 'bas']].forEach(([t, lab]) => {
        if (t > tmax) return;
        const xx = g.X(t);
        if (type === 'fm') s += `<rect class="mod-zone" x="${r1(xx - w)}" y="${g.y0}" width="${r1(2 * w)}" height="${g.y1 - g.y0}"/>`;
        s += `<line class="mod-repere" x1="${r1(xx)}" y1="${g.y0}" x2="${r1(xx)}" y2="${g.y1}"/>`;
        s += `<text class="mod-txt-repere" x="${r1(xx)}" y="${g.y0 + 12}" text-anchor="middle">${lab}</text>`;
      });
    }
    if (o.enveloppe && type === 'am') {
      const env = echantillons('modulant', e, tmax, 300).map(([t, u]) => [t, AP * (1 + u / U0)]);
      s += `<path class="mod-env" d="${chemin(env, g.X, g.Y)}"/><path class="mod-env" d="${chemin(env.map(([t, v]) => [t, -v]), g.X, g.Y)}"/>`;
    }
    s += `<path class="mod-courbe${type === 'modulant' ? ' mod-courbe-mod' : ''}" d="${chemin(echantillons(type, e, tmax, n), g.X, g.Y)}"/>`;
    return s + '</svg>';
  }

  // spectre quelconque en raies
  function svgRaies(o) {
    const W = Math.max(240, Math.round(o.W || 640)), H = o.H || 200, haut = o.haut || 0;
    const mg = o.mg || 46, md = 16, mh = 26 + haut, mb = 30;
    const x0 = mg, x1 = W - md - 24, y0 = mh, y1 = H - mb;
    const X = f => x0 + f / o.fmax * (x1 - x0), Y = a => y1 - a / o.amax * (y1 - y0);
    let s = svgOuvrir(W, H, o.aria || 'Spectre', o.cls);
    multiples(0, o.fmax, o.pasF).forEach(f => { s += `<line class="mod-grille" x1="${r1(X(f))}" y1="${y0}" x2="${r1(X(f))}" y2="${y1}"/>`; });
    multiples(0, o.amax, o.pasA).forEach(a => { s += `<line class="mod-grille" x1="${x0}" y1="${r1(Y(a))}" x2="${x1}" y2="${r1(Y(a))}"/>`; });
    s += o.avant ? o.avant({ X, Y, x0, x1, y0, y1 }) : '';
    s += `<line class="mod-axe" x1="${x0}" y1="${y1}" x2="${x1 + 14}" y2="${y1}"/><path class="mod-pointe" d="M${x1 + 19},${y1} l-7,-3.5 v7 z"/>`;
    s += `<line class="mod-axe" x1="${x0}" y1="${y1}" x2="${x0}" y2="${y0 - 8}"/><path class="mod-pointe" d="M${x0},${y0 - 13} l-3.5,7 h7 z"/>`;
    (o.etiqF || multiples(0, o.fmax, o.pasF)).forEach(f => { s += `<text class="mod-txt" x="${r1(X(f))}" y="${y1 + 16}" text-anchor="middle">${fmt(f)}</text>`; });
    (o.etiqA || []).forEach(a => { s += `<text class="mod-txt" x="${x0 - 6}" y="${r1(Y(a) + 4)}" text-anchor="end">${fmt(a)}</text>`; });
    if (o.titreF) s += `<text class="mod-txt mod-titre-axe" x="${x1 + 20}" y="${y1 + 28}" text-anchor="end">${o.titreF}</text>`;
    if (o.titreA) s += `<text class="mod-txt mod-titre-axe" x="${x0 + 8}" y="${y0 - 6}">${o.titreA}</text>`;
    (o.raies || []).forEach(r => {
      if (r.f < 0 || r.f > o.fmax + 1e-9) return;
      s += `<line class="mod-raie${r.cls ? ' ' + r.cls : ''}" x1="${r1(X(r.f))}" y1="${y1}" x2="${r1(X(r.f))}" y2="${r1(Y(r.a))}"/>`;
      if (r.nom) s += `<text class="mod-txt-raie" x="${r1(X(r.f))}" y="${r1(Y(r.a) - 6)}" text-anchor="middle">${r.nom}</text>`;
    });
    s += o.apres ? o.apres({ X, Y, x0, x1, y0, y1 }) : '';
    return s + '</svg>';
  }

  // courbe quelconque y = f(t) (documents des exercices)
  function svgCourbe(o) {
    const W = Math.max(240, Math.round(o.W || 640)), H = o.H || 220;
    const g = repere({ W, H, tmin: o.tmin || 0, tmax: o.tmax, pasT: o.pasT, etiqT: o.etiqT, titreT: o.titreT, ymin: o.ymin, ymax: o.ymax, pasY: o.pasY, etiqY: o.etiqY,
      titre: o.titreY, mg: o.mg || 44, mh: 26 });
    const n = o.n || 1500, pts = [];
    for (let i = 0; i <= n; i++) { const t = (o.tmin || 0) + (o.tmax - (o.tmin || 0)) * i / n; pts.push([t, o.f(t)]); }
    return svgOuvrir(W, H, o.aria) + g.svg + `<path class="mod-courbe" d="${chemin(pts, g.X, g.Y)}"/></svg>`;
  }

  // accolade horizontale de xa à xb au niveau y, ouverte vers le bas, texte au-dessus
  function accolade(xa, xb, y, texte, cls) {
    const m = (xa + xb) / 2;
    return `<path class="mod-acc${cls ? ' ' + cls : ''}" d="M${r1(xa)},${r1(y + 6)} V${r1(y)} H${r1(xb)} V${r1(y + 6)} M${r1(m)},${r1(y)} V${r1(y - 5)}"/>` +
      (texte ? `<text class="mod-txt-acc${cls ? ' ' + cls : ''}" x="${r1(m)}" y="${r1(y - 9)}" text-anchor="middle">${texte}</text>` : '');
  }

  // spectre du signal modulé en AM (et du modulant près de 0 Hz)
  function svgSpectre(e, o) {
    o = o || {};
    const d = derive(e), W = Math.max(240, Math.round(o.W || 640)), etroit = W < 520;
    const F2 = o.station2 != null ? e.F + o.station2 : null;
    const fmax = o.fmax || Math.ceil((Math.max(e.F, F2 || 0) + d.fh) * 1.12 / 5) * 5;
    const raies = [];
    if (o.modulant !== false) d.rangs.forEach(r => raies.push({ f: r.n * e.fm, a: r.a, cls: 'mod-raie-mod' }));
    raies.push({ f: e.F, a: AP, cls: 'mod-raie-p' });
    d.laterales.forEach(l => { if (l.a > 1e-6) raies.push({ f: l.f, a: l.a }); });
    if (F2 != null) {
      raies.push({ f: F2, a: AP, cls: 'mod-raie-2' });
      d.laterales.forEach(l => { if (l.a > 1e-6) raies.push({ f: l.f - e.F + F2, a: l.a, cls: 'mod-raie-2' }); });
    }
    const pasF = fmax <= 30 ? 1 : fmax <= 60 ? 2 : 5, pasEt = etroit ? (fmax <= 30 ? 5 : 10) : 5;
    const idH = 'mod-hach-' + (++nSvg);
    const chev = F2 != null ? [Math.max(d.de, F2 - d.fh), Math.min(d.a, F2 + d.fh)] : null;
    const chevauche = chev && chev[1] - chev[0] > 1e-9;
    return svgRaies({
      W, H: o.H || (etroit ? 230 : 250), fmax, pasF, etiqF: multiples(0, fmax, pasEt), amax: 1.4, pasA: .25, etiqA: [0, .5, 1], haut: 34,
      titreF: 'f (kHz)', titreA: 'Amplitude (V)', raies, cls: 'mod-svg-spectre',
      aria: o.aria || `Spectre du signal modulé en AM : porteuse à ${fmt(e.F)} kHz, raies latérales de ${fmt(d.de)} à ${fmt(d.a)} kHz, bande occupée ${fmt(d.bande)} kHz`,
      avant: g => {
        let s = `<defs><pattern id="${idH}" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line class="mod-hach" x1="0" y1="0" x2="0" y2="7"/></pattern></defs>`;
        // bande occupée (fond), zone de chevauchement hachurée
        if (e.Um > 0) s += `<rect class="mod-bande" x="${r1(g.X(d.de))}" y="${g.y0}" width="${r1(g.X(d.a) - g.X(d.de))}" height="${g.y1 - g.y0}"/>`;
        if (F2 != null) s += `<rect class="mod-bande mod-bande-2" x="${r1(g.X(F2 - d.fh))}" y="${g.y0}" width="${r1(g.X(F2 + d.fh) - g.X(F2 - d.fh))}" height="${g.y1 - g.y0}"/>`;
        if (chevauche) s += `<rect fill="url(#${idH})" class="mod-chev" x="${r1(g.X(chev[0]))}" y="${g.y0}" width="${r1(Math.max(2, g.X(chev[1]) - g.X(chev[0])))}" height="${g.y1 - g.y0}"/>`;
        return s;
      },
      apres: g => {
        let s = '';
        const yA = g.y0 - 16;
        if (o.bande !== false && e.Um > 0) s += accolade(g.X(d.de), g.X(d.a), yA, `bande occupée : 2 f<tspan dy="3" font-size="0.75em">h</tspan><tspan dy="-3"> = ${fmt(d.bande)} kHz</tspan>`);
        // bandes latérales (sauf avec une deuxième station : la figure resterait chargée)
        if (o.laterales !== false && F2 == null && d.laterales.some(l => l.a > 1e-6) && g.X(e.F) - g.X(d.de) >= 28) {
          const yL = g.Y(.62);
          s += `<text class="mod-txt mod-txt-bl" x="${r1((g.X(d.de) + g.X(e.F)) / 2)}" y="${r1(yL)}" text-anchor="middle">BLI</text>`;
          s += `<text class="mod-txt mod-txt-bl" x="${r1((g.X(d.a) + g.X(e.F)) / 2)}" y="${r1(yL)}" text-anchor="middle">BLS</text>`;
        }
        s += `<text class="mod-txt-raie" x="${r1(g.X(e.F))}" y="${r1(g.Y(AP) - 6)}" text-anchor="middle">F</text>`;
        if (F2 != null) {
          s += `<text class="mod-txt-raie mod-txt-2" x="${r1(g.X(F2))}" y="${r1(g.Y(AP) - 6)}" text-anchor="middle">F<tspan dy="3" font-size="0.75em">2</tspan></text>`;
          if (chevauche) s += `<text class="mod-txt-brouillage" x="${r1((g.X(chev[0]) + g.X(chev[1])) / 2)}" y="${r1(g.Y(.18))}" text-anchor="middle">brouillage</text>`;
        }
        if (o.modulant !== false && e.Um > 0) s += `<text class="mod-txt mod-txt-bl" x="${r1(g.X(e.fm * d.rangs.length / 2 + e.fm / 2))}" y="${r1(g.Y(Math.max(...d.rangs.map(r => r.a)) + .12))}" text-anchor="${etroit ? 'start' : 'middle'}">modulant</text>`;
        return s;
      },
    });
  }

  /* ============================================================
     SIMULATEUR
     ============================================================ */
  const PAR_DEFAUT = { mode: 'am', forme: 'sinus', fm: 1, Um: .6, F: 20, comparer: false, station2: false, ecart: 8 };
  const borne = (v, a, b) => Math.min(b, Math.max(a, v));
  const arrondi = (v, pas) => Math.round(v / pas) * pas;

  function monter(zone, opts) {
    opts = Object.assign({ spectre: true, commandes: true, ordres: true }, opts || {});
    const e = {};
    Object.keys(PAR_DEFAUT).forEach(k => { e[k] = opts[k] != null ? opts[k] : PAR_DEFAUT[k]; });
    const ecouteurs = [];
    const d = document.createElement('div');
    d.className = 'mod-simu';
    d.innerHTML = `
      <div class="mod-modes" role="group" aria-label="Type de modulation">
        <button type="button" class="mod-mode" data-mode="am" aria-pressed="false"><b>AM</b><span>modulation d'amplitude</span></button>
        <button type="button" class="mod-mode" data-mode="fm" aria-pressed="false"><b>FM</b><span>modulation de fréquence</span></button>
        <button type="button" class="btn-secondary mod-comparer" aria-pressed="false">Comparer AM et FM</button>
      </div>
      <div class="mod-bloc mod-graphes"><div class="mod-g" data-g="modulant"></div><div class="mod-g" data-g="porteuse"></div>
        <div class="mod-cote"><div class="mod-g" data-g="m1"></div><div class="mod-g" data-g="m2"></div></div></div>
      <div class="mod-alerte" hidden><b>Surmodulation (m &gt; 1).</b> L'enveloppe du signal modulé ne suit plus le modulant : l'information est déformée.</div>
      <div class="mod-reglages">
        <div class="mod-forme" role="group" aria-label="Forme du signal modulant"><span class="mod-petit-t">Signal modulant</span>
          <button type="button" class="mod-pill" data-forme="sinus" aria-pressed="false">Sinusoïde</button>
          <button type="button" class="mod-pill" data-forme="son" aria-pressed="false">Son (3 harmoniques)</button></div>
        <label class="mod-reglage"><span class="mod-reglage-nom" data-n="fm"></span><input type="range" data-r="fm" min="0.5" max="1.5" step="0.1" aria-label="Fréquence du modulant f_m, en kHz"></label>
        <label class="mod-reglage"><span class="mod-reglage-nom" data-n="Um"></span><input type="range" data-r="Um" min="0" max="1.2" step="0.05" aria-label="Amplitude du modulant U_m, en volts"></label>
        <label class="mod-reglage"><span class="mod-reglage-nom" data-n="F"></span><input type="range" data-r="F" min="10" max="30" step="1" aria-label="Fréquence de la porteuse F, en kHz"></label>
      </div>
      <div class="mod-bloc mod-spectre">
        <p class="mod-petit-t">Spectre du signal modulé (AM)</p>
        <div class="mod-sp"></div>
        <p class="mod-lecture"></p>
        <div class="mod-st2"><label class="mod-case"><input type="checkbox" data-c="station2"><span>Afficher une deuxième station (porteuse F<sub>2</sub>)</span></label>
          <label class="mod-reglage" data-ecart><span class="mod-reglage-nom" data-n="ecart"></span><input type="range" data-r="ecart" min="2" max="14" step="1" aria-label="Écart entre les porteuses, en kHz"></label></div>
        <p class="mod-fm-note" hidden>En FM, le spectre est plus étendu et plus compliqué : on étudie ici celui de la modulation d'amplitude. Passe en AM pour le voir.</p>
      </div>
      <div class="callout mod-ordres"><p><b>Ordres de grandeur réels.</b> Voix et musique : de 20 Hz à 20 kHz. Porteuses : vers 200 kHz pour les grandes ondes (AM), vers 100 MHz pour la radio FM. Ici, les fréquences sont réduites (f<sub>m</sub> ≈ 1 kHz, F ≈ 20 kHz) pour que l'on voie les oscillations de la porteuse.</p></div>`;
    zone.appendChild(d);
    const $ = s => d.querySelector(s);
    if (!opts.commandes) $('.mod-reglages').hidden = true;
    if (!opts.spectre) $('.mod-spectre').hidden = true;
    if (!opts.ordres) $('.mod-ordres').hidden = true;
    if (opts.modes === false) $('.mod-modes').hidden = true;

    // contraintes : F / fm entre 10 et 40 (lisible), F entre 10 et 30 kHz
    function contraindre() {
      e.fm = borne(arrondi(e.fm, .1), .5, 1.5);
      e.Um = borne(arrondi(e.Um, .05), 0, 1.2);
      e.F = borne(Math.round(borne(e.F, 10 * e.fm, 40 * e.fm)), 10, 30);
      if (e.F < 10 * e.fm - 1e-9) e.F = Math.ceil(10 * e.fm);
      e.ecart = borne(Math.round(e.ecart), 2, 14);
      e.fm = +e.fm.toFixed(2); e.Um = +e.Um.toFixed(2);
    }
    let largeur = 0;
    function dessiner() {
      const gs = $('.mod-graphes'), W = Math.round(gs.clientWidth) || 600;
      largeur = W;
      const cote = e.comparer && W >= 720, Wm = cote ? Math.floor((W - 12) / 2) : W;
      $('.mod-cote').classList.toggle('deux', cote);
      $('[data-g="modulant"]').innerHTML = svgSignal('modulant', e, { W, reperes: e.mode === 'fm' && !e.comparer, axeT: false });
      $('[data-g="porteuse"]').innerHTML = svgSignal('porteuse', e, { W, axeT: false });
      const m1 = e.comparer ? 'am' : e.mode, m2 = e.comparer ? 'fm' : null;
      $('[data-g="m1"]').innerHTML = svgSignal(m1, e, { W: Wm, enveloppe: true, reperes: m1 === 'fm' });
      $('[data-g="m2"]').innerHTML = m2 ? svgSignal(m2, e, { W: Wm, reperes: true }) : '';
      $('[data-g="m2"]').hidden = !m2;
      if (opts.spectre) {
        const sp = $('.mod-sp'), fmMode = e.mode === 'fm' && !e.comparer;
        sp.hidden = fmMode; $('.mod-lecture').hidden = fmMode; $('.mod-st2').hidden = fmMode; $('.mod-fm-note').hidden = !fmMode;
        if (!fmMode) sp.innerHTML = svgSpectre(e, { W: Math.round(sp.clientWidth) || W, station2: e.station2 ? e.ecart : null });
      }
    }
    function majTextes() {
      const dd = derive(e);
      d.querySelectorAll('.mod-mode').forEach(b => b.setAttribute('aria-pressed', String(!e.comparer && b.dataset.mode === e.mode)));
      $('.mod-comparer').setAttribute('aria-pressed', String(e.comparer));
      $('.mod-comparer').textContent = e.comparer ? 'Comparaison AM / FM affichée' : 'Comparer AM et FM';
      d.querySelectorAll('[data-forme]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.forme === e.forme)));
      d.querySelectorAll('input[type="range"]').forEach(i => { i.value = e[i.dataset.r]; });
      $('[data-c="station2"]').checked = e.station2;
      $('[data-ecart]').hidden = !e.station2;
      $('[data-n="fm"]').innerHTML = `Fréquence du modulant : <b>f<sub>m</sub> = ${fmt(e.fm, 1)} kHz</b>`;
      const fm = e.mode === 'fm' || e.comparer, amv = e.mode === 'am' || e.comparer;
      $('[data-n="Um"]').innerHTML = `Amplitude du modulant : <b>U<sub>m</sub> = ${fmt(e.Um, 2)} V</b>` +
        (amv ? ` · taux de modulation <b>m = ${fmt(dd.m, 2)}</b>` : '') + (fm ? ` · excursion <b>ΔF = ${fmt(dd.dF, 1)} kHz</b>` : '');
      $('[data-n="F"]').innerHTML = `Fréquence de la porteuse : <b>F = ${fmt(e.F)} kHz</b> <span class="mod-ratio">(F / f<sub>m</sub> = ${fmt(+(e.F / e.fm).toFixed(1))})</span>`;
      $('[data-n="ecart"]').innerHTML = `Écart entre les porteuses : <b>F<sub>2</sub> − F = ${fmt(e.ecart)} kHz</b>`;
      $('.mod-alerte').hidden = !(dd.surmod && (e.mode === 'am' || e.comparer));
      const raies = e.forme === 'son' ? `F − 3f<sub>m</sub> … F + 3f<sub>m</sub>` : `F − f<sub>m</sub> = ${fmt(e.F - e.fm)} kHz et F + f<sub>m</sub> = ${fmt(e.F + e.fm)} kHz`;
      let lec = `Porteuse à F = ${fmt(e.F)} kHz ; raies latérales : ${raies}. Plus haute fréquence du modulant : f<sub>h</sub> = ${fmt(dd.fh)} kHz. <b>Bande occupée = 2 f<sub>h</sub> = ${fmt(dd.bande)} kHz</b>, de ${fmt(dd.de)} à ${fmt(dd.a)} kHz.`;
      if (e.Um === 0) lec = `Sans modulant, il ne reste que la raie de la porteuse, à F = ${fmt(e.F)} kHz : aucune information n'est transmise.`;
      if (e.station2 && e.Um > 0) lec += e.ecart < dd.bande - 1e-9 ? ` <b>Les deux bandes se chevauchent (hachures) : brouillage.</b> Il faut un écart d'au moins ${fmt(dd.bande)} kHz.`
        : ' Les deux bandes ne se chevauchent pas : pas de brouillage.';
      $('.mod-lecture').innerHTML = lec;
    }
    function changer(silencieux) {
      contraindre(); majTextes(); dessiner();
      if (!silencieux) ecouteurs.forEach(f => f(etat()));
    }
    function etat() {
      const dd = derive(e);
      return Object.assign({}, e, { m: dd.m, dF: dd.dF, fh: dd.fh, bande: dd.bande, surmod: dd.surmod, chevauche: e.station2 && e.Um > 0 && e.ecart < dd.bande - 1e-9 });
    }
    // commandes
    d.querySelectorAll('.mod-mode').forEach(b => { b.onclick = () => { e.mode = b.dataset.mode; e.comparer = false; changer(); }; });
    $('.mod-comparer').onclick = () => { e.comparer = !e.comparer; changer(); };
    d.querySelectorAll('[data-forme]').forEach(b => { b.onclick = () => { e.forme = b.dataset.forme; changer(); }; });
    d.querySelectorAll('input[type="range"]').forEach(i => { i.addEventListener('input', () => { e[i.dataset.r] = +i.value; changer(); }); });
    $('[data-c="station2"]').addEventListener('change', ev => { e.station2 = ev.target.checked; changer(); });
    // largeur disponible : on redessine quand elle change (rotation du téléphone…)
    const gs = $('.mod-graphes');
    if (window.ResizeObserver) new ResizeObserver(() => { if (Math.round(gs.clientWidth) !== largeur) dessiner(); }).observe(gs);
    else addEventListener('resize', dessiner);
    changer(true);
    return {
      el: d,
      etat,
      regler(r, silencieux) { Object.keys(r || {}).forEach(k => { if (k in e) e[k] = r[k]; }); changer(silencieux); },
      surChange(f) { ecouteurs.push(f); },
    };
  }

  window.MOD = { AP, U0, KF, TMAX, SON, fmt, modulant, valeur, derive, echantillons, svgSignal, svgSpectre, svgRaies, svgCourbe, accolade, pasJoli, multiples, monter };
})();
