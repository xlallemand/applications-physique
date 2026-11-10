/* ============================================================
   TITRAGE : simulateur de titrage partagé entre applications
   (titrages pH-métriques, conductimétriques et colorimétriques).

   Cette première partie est le MODÈLE CHIMIQUE, sans DOM : il se
   charge aussi dans Node (tests). Les dessins (montage, courbe,
   tableau) viendront s'ajouter sur le même espace de noms.

   TITRAGE.chimie.creer(config) → modèle d'une prise d'essai
     config = {
       titrant: { c, ions: { 'H3O+': 1, 'Cl-': 1 } },           solution de la burette (c en mol·L⁻¹)
       titre:   { V, ions: { 'Na+': 1, 'HO-': 1 } },            solution du bécher (V en mL, c déduite de Veq)
       reaction: {
         type: 'acide-base' | 'oxydoreduction',
         a: 1, b: 1,                     coefficients de l'espèce titrante (A) et de l'espèce titrée (B)
         A: 'H3O+', B: 'HO-',            espèces qui réagissent
         produits: { 'H2O': 2 },         produits (coefficients), ions compris (ex. { 'CH3COO-': 1 })
         // acide-base : nature des deux solutions pour le calcul du pH
         titrant: { acide: true, fort: true },   ou { acide: true, pKa: 4.76 } pour un acide faible
         titreAB: { acide: false, fort: true },  base forte ; { acide: false, pKa: 9.25 } base faible
         couleurs: { 'MnO4-': 'permanganate' }   espèces colorées (titrage colorimétrique sans indicateur)
       },
       veq: 9.00,                        volume équivalent de cette prise d'essai (mL)
       eauAjoutee: 0,                    mL d'eau distillée ajoutés au bécher (conductimétrie)
       indicateur: null,                 'heliantine' | 'BBT' | 'phenolphtaleine'
     }
     → {
       cTitre                       concentration de la solution titrée (mol·L⁻¹) : c = c_titrant × a/b… (voir code)
       composition(V)               { Vtot (mL), n: { espèce: mol }, x (avancement) }
       pH(V)                        pH exact (électroneutralité, dichotomie sur [H₃O⁺])
       sigma(V, unite)              conductivité (unite : 'mS/m' par défaut, 'S/m', 'mS/cm', 'µS/cm')
       couleur(V)                   { r, g, b, a } de la solution du bécher (indicateur ou espèce colorée)
     }

   TITRAGE.chimie.tirerVeq(moyenne, ecartType)   Veq gaussien, borné à ± 3 écarts-types (mL)
   TITRAGE.chimie.veqGroupe(moyenne, ecartType)   Veq « d'un autre groupe » : même loi, arrondi à 0,05 mL
   TITRAGE.chimie.priseEssai({ moyenne, ecartType })  { veq, decalage } : tirage d'une prise d'essai
                                                   (décalage d'étalonnage du pH-mètre, ± 0,05)
   TITRAGE.chimie.lecturePH(pHvrai, decalage)     affichage du pH-mètre : décalage + bruit ± 0,01, arrondi à 0,01
   TITRAGE.chimie.LAMBDA                          conductivités ioniques molaires (S·m²·mol⁻¹)
   TITRAGE.chimie.INDICATEURS                     zones de virage et couleurs

   TITRAGE.outils (sans DOM) :
     derivee(xs, ys)                dérivée comme Regressi : (yᵢ₊₁ − yᵢ₋₁) / (xᵢ₊₁ − xᵢ₋₁), extrémités décentrées
     monotone(xs, ys)               interpolation monotone de Fritsch-Carlson → { f(x), df(x) }
     extremum(xs, ds, signe)        indice du minimum (signe −1) ou du maximum (signe +1)
     fmt(x, dec)                    nombre à la française (virgule, espace fine des milliers)
     auto(veq, vFin)                volumes de « Passer cette partie » (pas de 1 mL, 0,2 mL près du saut)
   ============================================================ */
(function (racine) {
  'use strict';

  const KE = 1e-14;

  /* ---------- Conductivités ioniques molaires λ (S·m²·mol⁻¹, 25 °C) ----------
     Valeurs du cours pour Na⁺, HO⁻, CH₃COO⁻ ; les autres : tables usuelles. */
  const LAMBDA = {
    'H3O+':   35.0e-3,
    'HO-':    20.0e-3,   // cours : 20 × 10⁻³
    'Na+':     5.0e-3,   // cours : 5,0 × 10⁻³
    'Cl-':     7.6e-3,
    'K+':      7.4e-3,
    'NH4+':    7.4e-3,
    'CH3COO-': 4.1e-3,   // cours : 4,1 × 10⁻³
    'MnO4-':   6.1e-3,
    'Mn2+':   10.7e-3,   // ion 2+ : λ de l'ion (2 × λ(½ Mn²⁺))
    'Fe2+':   10.8e-3,
    'Fe3+':   20.4e-3,
    'SO4 2-': 16.0e-3,
  };

  /* ---------- Indicateurs colorés (cours, chapitre 6 p. 4) ----------
     Couleurs des solutions : constantes (exception de la charte pour les solutions colorées). */
  const INDICATEURS = {
    heliantine:      { nom: 'hélianthine',     bas: 3.1, haut: 4.4,  acide: [214, 40, 40, 0.55],  base: [240, 200, 40, 0.55] },
    BBT:             { nom: 'BBT',             bas: 6.0, haut: 7.6,  acide: [235, 205, 40, 0.55], base: [40, 90, 210, 0.55] },
    phenolphtaleine: { nom: 'phénolphtaléine', bas: 8.2, haut: 10.0, acide: [255, 255, 255, 0],   base: [225, 40, 150, 0.55] },
  };
  // espèces colorées (couleur à 1 mmol·L⁻¹ environ ; l'opacité suit la concentration)
  const ESPECES_COLOREES = {
    'MnO4-': { rgb: [120, 30, 150], cRef: 2e-4 },   // violet, rose pâle très dilué
    'I2':    { rgb: [190, 120, 20], cRef: 2e-3 },   // jaune-brun
  };
  const EAU = { r: 220, g: 236, b: 245, a: 0.35 };   // solution incolore : léger bleu d'eau

  /* ---------- Tirages aléatoires ---------- */
  function gauss() {
    // Box-Muller
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }
  function tirerVeq(moyenne, ecartType) {
    const g = Math.max(-3, Math.min(3, gauss()));
    return moyenne + g * ecartType;
  }
  function veqGroupe(moyenne, ecartType) {
    return Math.round(tirerVeq(moyenne, ecartType) / 0.05) * 0.05;
  }
  function priseEssai(o) {
    o = o || {};
    return {
      veq: tirerVeq(o.moyenne != null ? o.moyenne : 9.0, o.ecartType != null ? o.ecartType : 0.4),
      decalage: (Math.random() * 2 - 1) * 0.05,
    };
  }
  // ce qu'affiche le pH-mètre : décalage d'étalonnage + petit bruit (± 0,01), à 0,01 près
  function lecturePH(pHvrai, decalage) {
    const bruit = Math.round((Math.random() * 2 - 1)) * 0.01;   // −0,01 ; 0 ; +0,01
    const v = pHvrai + (decalage || 0) + bruit;
    return Math.round(Math.max(0, Math.min(14, v)) * 100) / 100;
  }

  /* ---------- Modèle d'une prise d'essai ---------- */
  function creer(cfg) {
    const R = cfg.reaction;
    const a = R.a || 1, b = R.b || 1;
    const cT = cfg.titrant.c;
    const VB = cfg.titre.V;                                    // mL
    const eau = cfg.eauAjoutee || 0;                           // mL
    // à l'équivalence : n(B) / b = n(A) / a  →  c_titré = (b / a) × c_titrant × Veq / VB
    // (avec n(espèce titrée) = c × coefficient de l'espèce dans la solution)
    const coefA = cfg.titrant.ions[R.A] || 1, coefB = cfg.titre.ions[R.B] || 1;
    const cTitre = (b / a) * cT * coefA * cfg.veq / (VB * coefB);

    // composition du bécher après V mL versés : réaction totale, avancement limité par le réactif en défaut
    function composition(V) {
      const n = {};
      const ajouter = (esp, q) => { n[esp] = (n[esp] || 0) + q; };
      for (const esp in cfg.titre.ions) ajouter(esp, cTitre * cfg.titre.ions[esp] * VB * 1e-3);
      for (const esp in cfg.titrant.ions) ajouter(esp, cT * cfg.titrant.ions[esp] * V * 1e-3);
      const x = Math.max(0, Math.min((n[R.A] || 0) / a, (n[R.B] || 0) / b));
      n[R.A] = Math.max(0, (n[R.A] || 0) - a * x);
      n[R.B] = Math.max(0, (n[R.B] || 0) - b * x);
      for (const esp in (R.produits || {})) ajouter(esp, R.produits[esp] * x);
      return { Vtot: VB + V + eau, n, x };
    }

    /* pH exact : électroneutralité
       h + [cations] = Ke/h + [anions], avec pour chaque solution :
       acide fort (HCl)      : C apporté en anions (Cl⁻) ;
       base forte (NaOH)     : C apporté en cations (Na⁺) ;
       acide faible HA       : [A⁻] = C·Ka / (Ka + h) en anions ;
       base faible B         : [BH⁺] = C·h / (Ka + h) en cations.
       f(h) est croissante : dichotomie sur log h. */
    function pH(V) {
      if (R.type !== 'acide-base') return NaN;
      const Vt = (VB + V + eau) * 1e-3;                         // L
      const cTit = cT * V * 1e-3 / Vt;                           // titrant apporté (mol·L⁻¹)
      const cTre = cTitre * VB * 1e-3 / Vt;                      // titré apporté
      const termes = [[R.titrant, cTit], [R.titreAB, cTre]];
      function f(h) {
        let s = h - KE / h;
        for (const [nat, C] of termes) {
          if (!nat || !C) continue;
          if (nat.fort) s += nat.acide ? -C : C;
          else {
            const Ka = Math.pow(10, -nat.pKa);
            s += nat.acide ? -C * Ka / (Ka + h) : C * h / (Ka + h);
          }
        }
        return s;
      }
      let lo = -16, hi = 2;                                      // log10 h
      for (let i = 0; i < 80; i++) {
        const m = (lo + hi) / 2;
        if (f(Math.pow(10, m)) > 0) hi = m; else lo = m;
      }
      return -(lo + hi) / 2;
    }

    // conductivité σ = Σ λᵢ [Xᵢ], [Xᵢ] en mol·m⁻³
    function sigma(V, unite) {
      const c = composition(V);
      let s = 0;
      for (const esp in c.n) if (LAMBDA[esp]) s += LAMBDA[esp] * (c.n[esp] / (c.Vtot * 1e-3)) * 1e3;   // S·m⁻¹
      const k = { 'S/m': 1, 'mS/m': 1e3, 'mS/cm': 10, 'µS/cm': 1e4 }[unite || 'mS/m'];
      return s * k;
    }

    // couleur de la solution du bécher : indicateur coloré (pH), ou espèces colorées (concentration)
    function couleur(V) {
      if (cfg.indicateur) {
        const ind = INDICATEURS[cfg.indicateur];
        const p = pH(V);
        const t = Math.max(0, Math.min(1, (p - ind.bas) / (ind.haut - ind.bas)));
        // teinte mélangée dans la zone de virage ; une forme incolore (opacité 0) prend la teinte de l'autre
        const ac = ind.acide[3] ? ind.acide : [ind.base[0], ind.base[1], ind.base[2], 0];
        const ba = ind.base[3] ? ind.base : [ind.acide[0], ind.acide[1], ind.acide[2], 0];
        const mel = i => ac[i] + (ba[i] - ac[i]) * t;
        if (mel(3) < 0.08) return { ...EAU };                   // pratiquement incolore
        return { r: Math.round(mel(0)), g: Math.round(mel(1)), b: Math.round(mel(2)), a: Math.max(EAU.a, mel(3)) };
      }
      const c = composition(V);
      for (const esp in ESPECES_COLOREES) {
        const q = c.n[esp];
        if (q > 1e-12) {
          const e = ESPECES_COLOREES[esp];
          const conc = q / (c.Vtot * 1e-3);
          const al = Math.min(0.85, EAU.a + 0.6 * Math.min(1, conc / e.cRef));
          return { r: e.rgb[0], g: e.rgb[1], b: e.rgb[2], a: al };
        }
      }
      return { ...EAU };
    }

    return { cTitre, VB, eau, composition, pH, sigma, couleur, veq: cfg.veq };
  }

  /* ============================================================
     Outils numériques (sans DOM)
     ============================================================ */

  // dérivée « comme Regressi » : différences centrées, décentrées aux deux bouts
  function derivee(xs, ys) {
    const n = xs.length, d = new Array(n).fill(NaN);
    if (n < 2) return d;
    for (let i = 0; i < n; i++) {
      const i0 = Math.max(0, i - 1), i1 = Math.min(n - 1, i + 1);
      d[i] = (ys[i1] - ys[i0]) / (xs[i1] - xs[i0]);
    }
    return d;
  }

  // interpolation cubique monotone de Fritsch-Carlson : aucune oscillation dans le saut
  function monotone(xs, ys) {
    const n = xs.length;
    const dx = [], m = [], t = new Array(n).fill(0);
    for (let i = 0; i < n - 1; i++) { dx[i] = xs[i + 1] - xs[i]; m[i] = (ys[i + 1] - ys[i]) / dx[i]; }
    if (n === 1) return { f: () => ys[0], df: () => 0 };
    t[0] = m[0]; t[n - 1] = m[n - 2];
    for (let i = 1; i < n - 1; i++) t[i] = m[i - 1] * m[i] <= 0 ? 0 : (m[i - 1] + m[i]) / 2;
    for (let i = 0; i < n - 1; i++) {
      if (m[i] === 0) { t[i] = 0; t[i + 1] = 0; continue; }
      const al = t[i] / m[i], be = t[i + 1] / m[i], s = al * al + be * be;
      if (s > 9) { const k = 3 / Math.sqrt(s); t[i] = k * al * m[i]; t[i + 1] = k * be * m[i]; }
    }
    function seg(x) {
      let i = 0;
      if (x <= xs[0]) i = 0; else if (x >= xs[n - 1]) i = n - 2;
      else { let lo = 0, hi = n - 1; while (hi - lo > 1) { const k = (lo + hi) >> 1; if (xs[k] <= x) lo = k; else hi = k; } i = lo; }
      return i;
    }
    function f(x) {
      const i = seg(x), h = dx[i], u = (x - xs[i]) / h;
      const h00 = 2 * u ** 3 - 3 * u ** 2 + 1, h10 = u ** 3 - 2 * u ** 2 + u, h01 = -2 * u ** 3 + 3 * u ** 2, h11 = u ** 3 - u ** 2;
      return h00 * ys[i] + h10 * h * t[i] + h01 * ys[i + 1] + h11 * h * t[i + 1];
    }
    function df(x) {
      const i = seg(x), h = dx[i], u = (x - xs[i]) / h;
      const d00 = 6 * u ** 2 - 6 * u, d10 = 3 * u ** 2 - 4 * u + 1, d01 = -6 * u ** 2 + 6 * u, d11 = 3 * u ** 2 - 2 * u;
      return (d00 * ys[i] + d01 * ys[i + 1]) / h + d10 * t[i] + d11 * t[i + 1];
    }
    return { f, df };
  }

  function extremum(xs, ds, signe) {
    let k = -1;
    for (let i = 0; i < ds.length; i++) if (isFinite(ds[i]) && (k < 0 || signe * ds[i] > signe * ds[k])) k = i;
    return k;
  }

  // nombre à la française : virgule décimale, espace fine insécable des milliers, moins typographique
  function fmt(x, dec) {
    if (!isFinite(x)) return '';
    let s = dec == null ? String(+x.toPrecision(12)) : x.toFixed(dec);
    s = s.replace('-', '−');
    const [e, d] = s.split('.');
    const ent = e.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return d != null ? ent + ',' + d : ent;
  }

  // volumes de « Passer cette partie » (comme le tableau du TP) : en dixièmes de mL entiers
  function auto(veq, vFin) {
    vFin = vFin || 16;
    const d1 = Math.max(0, Math.floor(veq - 2)), d2 = Math.ceil(veq + 2);
    const L = [];
    for (let v = 0; v <= d1 * 10; v += 10) L.push(v);
    for (let v = d1 * 10 + 2; v <= d2 * 10; v += 2) L.push(v);
    for (let v = d2 * 10 + 10; v <= vFin * 10; v += 10) L.push(v);
    if (L[L.length - 1] !== vFin * 10) L.push(vFin * 10);
    return L.map(d => d / 10);
  }

  const TITRAGE = racine.TITRAGE || {};
  TITRAGE.chimie = { creer, tirerVeq, veqGroupe, priseEssai, lecturePH, LAMBDA, INDICATEURS, ESPECES_COLOREES };
  TITRAGE.outils = { derivee, monotone, extremum, fmt, auto };
  racine.TITRAGE = TITRAGE;
  if (typeof module !== 'undefined' && module.exports) module.exports = TITRAGE;
})(typeof window !== 'undefined' ? window : globalThis);
