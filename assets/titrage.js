/* ============================================================
   TITRAGE : simulateur de titrage partagé entre applications
   (titrages pH-métriques, conductimétriques et colorimétriques).

   Cette première partie est le MODÈLE CHIMIQUE, sans DOM : il se
   charge aussi dans Node (tests). La partie dessin (montage, courbe,
   tableau, simulateur, outils de repérage) est à la fin du fichier,
   sur le même espace de noms (navigateur seulement).

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


/* ============================================================
   TITRAGE : PARTIE DESSIN (navigateur seulement)

   TITRAGE.verrerie(id)            dessin SVG (boîte 80 × 120, posé en y = 112) d'un objet du labo :
                                   'becher', 'fiole50', 'fiole100', 'burette', 'pipette5', 'pipette10',
                                   'agitateur', 'phmetre'
   TITRAGE.montage(zone, o)        schéma du montage → { el, maj(etat), zones, poserAppareil(type) }
     o = { style: 'epure' | 'realiste', appareil: 'ph' | 'conductimetre' | 'indicateur' | null,
           textes: { burette: [l1, l2], becher: [l1, l2] } | null,   textes écrits à côté (« c_A » : indice)
           aCompleter: false }      zones HTML vides à compléter, dans deux cadres reliés à la burette et au bécher
     etat = { V (mL versés), affichage (texte de l'appareil), couleur { r, g, b, a }, goutte (animation) }
   TITRAGE.courbe(zone, o)         repère y = f(V), points, courbe lissée, dérivée → API (voir plus bas)
     o = { xMax: 20, y: { nom: 'pH', min: 0, max: 14, pas: 1 }, derivee: 'droite' | 'dessous' | null }
   TITRAGE.tableau(zone, o)        tableau de valeurs en petit, dernière mesure visible → { maj(mesures) }
     o = { colonnes: ['V (mL)', 'pH'], dec: 2 }
   TITRAGE.regressi.texte(mesures, noms)        « V;pH » puis une ligne par mesure (CSV, virgule décimale)
   TITRAGE.regressi.copier(mesures, zone, noms) copie dans le presse-papier, message dans zone
   TITRAGE.creer(zone, config)     simulateur complet (montage + commandes + courbe + tableau)
     → { verser(dixiemes), mesures(), prise(), recommencer(confirme), remplirAuto(volumes), veqTire(), courbe, montage }
   TITRAGE.tangentes(courbe, o)    méthode des tangentes semi-automatique (5 étapes)
   TITRAGE.deriveeOutil(courbe, o) extrémum de la courbe dérivée (toucher ou réticule)
   TITRAGE.ui                      { retour, champ, lire, defiler } : petits outils d'interface communs

   Mesures : [[V en dixièmes de mL (entier), valeur mesurée]].
   Tout peut exister en plusieurs exemplaires dans une page (pas d'id fixe, pas d'état global).
   Couleurs : variables du thème ; exceptions (comme VEC.C) : couleurs des solutions, du verre
   et du métal du dessin réaliste, en constantes commentées.
   ============================================================ */
(function () {
  'use strict';
  if (typeof document === 'undefined') return;
  const T = window.TITRAGE;
  const NB = ' ';
  const fmt = (x, d) => T.outils.fmt(x, d);
  const NS = 'http://www.w3.org/2000/svg';
  const mk = (tag, attrs, parent) => {
    const e = document.createElementNS(NS, tag);
    for (const a in attrs) e.setAttribute(a, attrs[a]);
    if (parent) parent.appendChild(e);
    return e;
  };
  let nb = 0;      // identifiants uniques (dégradés, découpes) : plusieurs dessins dans la page

  /* ============================================================
     Petits outils d'interface
     ============================================================ */
  function defiler(el) {
    if (!el) return;
    requestAnimationFrame(() => el.scrollIntoView({ block: 'nearest', behavior: 'smooth' }));
  }
  // encadré « Juste ! » / « C'est juste. » / « Ce n'est pas ça. » ; ok = true | 'apres' | false
  function retour(zone, ok, html) {
    zone.innerHTML = `<div class="${ok ? 'callout-success' : 'callout-danger'} ttr-retour" role="status"><b>${ok === 'apres' ? 'C’est juste.' : ok ? 'Juste' + NB + '!' : 'Ce n’est pas ça.'}</b>${html || ''}</div>`;
    defiler(zone);
  }
  function lire(t) {
    const s = String(t).trim().replace(/[\s  ]/g, '').replace(',', '.').replace('−', '-');
    if (!/^-?\d*\.?\d+$|^-?\d+\.$/.test(s)) return NaN;
    return parseFloat(s);
  }
  const surOrdi = () => window.matchMedia && window.matchMedia('(hover: hover)').matches;
  // champ numérique de la charte : bouton ±, clavier décimal, 16 px au moins
  function champ(o) {
    o = o || {};
    const d = document.createElement('span');
    d.className = 'ttr-champ-box';
    d.innerHTML = `${o.signe === false ? '' : '<button type="button" class="ttr-pm" aria-label="Changer le signe" title="Changer le signe">±</button>'}
      <input type="text" class="ttr-champ" inputmode="decimal" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="${o.aria || 'Réponse'}">`;
    const input = d.querySelector('input'), pm = d.querySelector('.ttr-pm');
    if (pm) pm.addEventListener('click', () => {
      const t = input.value.trim();
      input.value = /^[−-]/.test(t) ? t.replace(/^[−-]\s*/, '') : '−' + t;
      if (surOrdi()) input.focus();               // pas de clavier qui masque la question sur téléphone
    });
    return { el: d, input, valeur: () => lire(input.value), desactiver(b) { input.disabled = b; if (pm) pm.disabled = b; } };
  }
  // texte SVG : « c_A » ou « V_eq » → indice (tspan)
  function svgTexte(s) {
    return String(s).replace(/_(\{([^}]*)\}|([A-Za-z0-9]+))/g, (m, a, b, c) => `<tspan baseline-shift="sub" font-size="72%">${b || c}</tspan>`);
  }

  /* ============================================================
     Verrerie et appareils (cartes de matériel), boîte 80 × 120
     ============================================================ */
  const V_TRAIT = 'stroke="var(--ink)" stroke-width="1.5" fill="var(--sheet)" stroke-linejoin="round"';
  const V_FIN = 'stroke="var(--ink)" stroke-width="1" fill="none" stroke-linecap="round"';
  const V_SOL = 'fill="rgba(170,205,230,.6)" stroke="none"';              // eau, solution incolore
  const V_REFLET = 'stroke="#ffffff" stroke-width="1.6" stroke-linecap="round" opacity=".9" fill="none"';
  // silhouette symétrique : profil gauche en segments cubiques [p0, p1, p2, p3], le côté droit est son miroir (x → 80 − x)
  const f2 = x => +x.toFixed(2);
  const seg = (a, b) => [a, [a[0] + (b[0] - a[0]) / 3, a[1] + (b[1] - a[1]) / 3], [a[0] + 2 * (b[0] - a[0]) / 3, a[1] + 2 * (b[1] - a[1]) / 3], b];   // droite
  const miroir = p => [80 - p[0], p[1]];
  const bez = (s, t) => [0, 1].map(i => (1 - t) ** 3 * s[0][i] + 3 * (1 - t) ** 2 * t * s[1][i] + 3 * (1 - t) * t * t * s[2][i] + t ** 3 * s[3][i]);
  function contour(prof, yHaut) {
    let d = `M${prof[0][0][0]} ${yHaut} V${prof[0][0][1]}`;
    prof.forEach(s => { d += ` C${s[1].map(f2)} ${s[2].map(f2)} ${s[3].map(f2)}`; });
    [...prof].reverse().forEach(s => { const m = [s[2], s[1], s[0]].map(miroir); d += ` C${m[0].map(f2)} ${m[1].map(f2)} ${m[2].map(f2)}`; });
    return d + ` V${yHaut} Z`;
  }
  // liquide : profil échantillonné sous le niveau yL, un peu à l'intérieur de la paroi
  function liquide(prof, yL) {
    const pts = [], bas = [];
    prof.forEach(s => { for (let i = 0; i <= 24; i++) pts.push(bez(s, i / 24)); });
    pts.forEach((p, i) => {
      const q = pts[i - 1];
      if (p[1] < yL) return;
      if (!bas.length && q) { const t = (yL - q[1]) / (p[1] - q[1]); bas.push([q[0] + t * (p[0] - q[0]), yL]); }
      bas.push(p);
    });
    const g = bas.map(p => [p[0] + 1.2, Math.min(p[1], 110.6)]);
    return `<path d="M${g.concat(g.slice().reverse().map(miroir)).map(p => p.map(f2).join(' ')).join(' L')} Z" ${V_SOL}/>`;
  }
  function pipette(V, gros) {
    // poire à pipeter, tube avec le trait de jauge, réservoir cylindrique étroit à raccords courts, pointe effilée
    const r = gros ? 6 : 4.6, h = gros ? 44 : 34, y0 = gros ? 40 : 42, t = 38.3;
    const prof = [seg([t, 33], [t, y0]),
      [[t, y0], [t, y0 + 2], [40 - r, y0 + 2.5], [40 - r, y0 + 5]],
      seg([40 - r, y0 + 5], [40 - r, y0 + h - 5]),
      [[40 - r, y0 + h - 5], [40 - r, y0 + h - 2.5], [t, y0 + h - 2], [t, y0 + h]],
      seg([t, y0 + h], [t, 104]), seg([t, 104], [39.6, 116]), seg([39.6, 116], [40, 116])];
    return `<path d="M40 2 c-7 0 -9 5 -9 9 c0 5 4 8 6 9 v5 h6 v-5 c2 -1 6 -4 6 -9 c0 -4 -2 -9 -9 -9 z" fill="var(--paper-3)" stroke="var(--ink-2)" stroke-width="1.3"/>
      <path d="${contour(prof, 25)}" ${V_TRAIT}/>
      <line x1="36.6" x2="43.4" y1="33" y2="33" stroke="var(--ink)" stroke-width="1.3"/>
      <text x="${45 + r}" y="${y0 + h / 2 + 3}" style="font:800 8.5px var(--font-sans)" fill="var(--ink)">${V}</text>`;
  }
  function fiole(V, grand) {
    // bouchon, long col avec le trait de jauge, panse en cône tronqué (épaule presque vive), fond plat large
    const w = grand ? 26 : 20, yb = grand ? 56 : 66, yL = grand ? 86 : 92, yh = grand ? 11 : 25;
    const prof = [
      [[36.5, yb], [36.5, yb + 1], [36.3, yb + 1.6], [35.9, yb + 2.4]],
      seg([35.9, yb + 2.4], [40 - w + 1.5, 106]),
      [[40 - w + 1.5, 106], [40 - w, 110], [40 - w + 1.5, 112], [40 - w + 5, 112]],
      seg([40 - w + 5, 112], [40, 112])];
    return `<rect x="35.5" y="${grand ? 4 : 18}" width="9" height="7" rx="2" fill="var(--paper-3)" stroke="var(--ink-2)" stroke-width="1.2"/>
      <path d="${contour(prof, yh)}" fill="var(--sheet)"/>${liquide(prof, yL)}
      <path d="${contour(prof, yh)}" ${V_TRAIT.replace('fill="var(--sheet)"', 'fill="none"')}/>
      <line x1="34.6" x2="45.4" y1="${grand ? 30 : 40}" y2="${grand ? 30 : 40}" stroke="var(--ink)" stroke-width="1.3"/>
      <text x="40" y="${grand ? 99 : 102}" text-anchor="middle" style="font:800 ${grand ? 9.5 : 8.5}px var(--font-sans)" fill="var(--ink)">${V}</text>`;
  }
  const VERRERIE = {
    becher: `<path d="M18.5 78 V106 c0 3 1.5 4.5 4.5 4.5 h34 c3 0 4.5 -1.5 4.5 -4.5 V78 Z" ${V_SOL}/>
      <path d="M11 41 q6 0 6 5 V106 c0 4 2 6 6 6 h34 c4 0 6 -2 6 -6 V46 q0 -2 2 -3" stroke="var(--ink)" stroke-width="1.5" fill="none" stroke-linejoin="round"/>
      <path d="M50 58 h8 M53 68 h5 M50 78 h8 M53 88 h5 M50 98 h8" ${V_FIN}/><line x1="23" y1="52" x2="23" y2="100" ${V_REFLET}/>`,
    fiole50: fiole('50 mL', false),
    fiole100: fiole('100 mL', true),
    pipette5: pipette('5 mL', false),
    pipette10: pipette('10 mL', true),
    burette: (() => {
      let g = '';
      for (let i = 0; i <= 16; i++) g += `<line x1="37.6" x2="${i % 4 === 0 ? 42 : 40}" y1="${12 + i * 4.6}" y2="${12 + i * 4.6}" stroke="var(--ink)" stroke-width=".8"/>`;
      return `<path d="M35 3 h10 M36.2 3 V92 l2.6 6 h2.4 l2.6 -6 V3" ${V_TRAIT}/>${g}
        <rect x="37.6" y="40" width="4.8" height="51" fill="rgba(170,205,230,.6)"/>
        <rect x="35.5" y="98" width="9" height="7" rx="2" fill="var(--paper-2)" stroke="var(--ink)" stroke-width="1.3"/>
        <rect x="24" y="100" width="32" height="3.4" rx="1.7" fill="var(--ink-2)"/>
        <path d="M38.8 105 L39.6 116 h.8 L41.2 105" ${V_TRAIT}/>`;
    })(),
    agitateur: `<rect x="8" y="84" width="64" height="28" rx="4" fill="var(--paper)" stroke="var(--ink)" stroke-width="1.5"/>
      <circle cx="60" cy="98" r="5.5" fill="var(--sheet)" stroke="var(--ink)" stroke-width="1.3"/><line x1="60" y1="98" x2="60" y2="93" stroke="var(--ink)" stroke-width="1.3"/>
      <rect x="18" y="94" width="24" height="5" rx="2.5" fill="var(--paper-3)"/><rect x="22" y="78" width="20" height="5" rx="2.5" fill="var(--ink)"/>`,
    phmetre: `<rect x="4" y="66" width="52" height="46" rx="5" fill="var(--paper)" stroke="var(--ink)" stroke-width="1.5"/>
      <rect x="10" y="72" width="40" height="17" rx="2" fill="var(--ink)"/><text x="46" y="85" text-anchor="end" style="font:800 11px var(--font-sans)" fill="var(--sheet)">7,00</text>
      <rect x="11" y="96" width="9" height="5" rx="2" fill="var(--ink-2)"/><rect x="24" y="96" width="9" height="5" rx="2" fill="var(--ink-2)"/>
      <path d="M54 72 C62 72 70 50 70 26" stroke="var(--ink-2)" stroke-width="1.8" fill="none"/>
      ${sondePH(70, 14, .62, 'carte')}`,
  };
  function verrerie(id) { return VERRERIE[id] || ''; }

  // sonde de pH combinée : capuchon, corps, tige de verre, bulbe ; (x, y) = haut du capuchon, k = échelle
  function sondePH(x, y, k, style) {
    const real = style === 'realiste';
    const corps = real ? 'fill="#eceae5" stroke="#5f646c" stroke-width="1.2"' : 'fill="var(--sheet)" stroke="var(--ink)" stroke-width="1.4"';
    const verre = real ? 'fill="#eef4f8" stroke="#5f646c" stroke-width="1.1"' : 'fill="var(--sheet)" stroke="var(--ink)" stroke-width="1.3"';
    const s = v => v * k;
    return `<g transform="translate(${x} ${y})">
      <rect x="${s(-5.5)}" y="0" width="${s(11)}" height="${s(11)}" rx="${s(2)}" fill="${real ? '#3a3e45' : 'var(--ink)'}"/>
      <rect x="${s(-4.5)}" y="${s(11)}" width="${s(9)}" height="${s(58)}" rx="${s(2)}" ${corps}/>
      <line x1="${s(-4.5)}" x2="${s(4.5)}" y1="${s(46)}" y2="${s(46)}" stroke="${real ? '#5f646c' : 'var(--ink)'}" stroke-width="1"/>
      <path d="M${s(-2.5)} ${s(69)} V${s(80)} a${s(4.5)} ${s(4.5)} 0 1 0 ${s(5)} 0 V${s(69)} Z" ${verre}/>
      <circle cx="0" cy="${s(84)}" r="${s(1.6)}" fill="${real ? '#c9d6de' : 'var(--paper-3)'}"/>
      <line x1="${s(-2)}" x2="${s(-2)}" y1="${s(14)}" y2="${s(42)}" ${V_REFLET}/>
    </g>`;
  }

  /* ============================================================
     Montage de titrage (SVG, viewBox 320 × 400)
     burette graduée : graduation 0 en y = 30, 25 mL en y = 230 (8 unités par mL)
     ============================================================ */
  // couleurs de présentation du dessin réaliste (constantes, comme VEC.C) : verre, métal, plastique, écran
  const C = {
    verre1: '#f4f8fb', verre2: '#d9e4eb', metal1: '#d3d6db', metal2: '#8e939b', metal3: '#5f646c',
    plastique: '#eceae5', plastique2: '#d0ccc4', bouton: '#55585f', ecran: '#1f2a24', ecranTxt: '#b8f5d2', burette: '#e3eef6',
    eau: { r: 220, g: 236, b: 245, a: 0.35 },
  };
  const Y0 = 30, PX = 8;
  const yBur = V => Y0 + PX * V;
  const ySol = Vt => 338 - (8 + Math.min(45, Vt) * 0.95);      // surface de la solution du bécher (volume total en mL)

  function montage(zone, o) {
    o = Object.assign({ style: 'epure', appareil: 'ph', textes: null, aCompleter: false }, o || {});
    const k = ++nb, real = o.style === 'realiste';
    const el = document.createElement('div');
    el.className = 'ttr-montage' + (real ? ' ttr-realiste' : '');
    const g = id => `url(#ttr${k}-${id})`;
    // attributs selon le style
    const A = {
      verre: real ? `fill="${g('verre')}" fill-opacity=".6" stroke="${C.metal2}" stroke-width="1.3"` : 'class="ttr-verre"',
      trait: real ? `fill="none" stroke="${C.metal2}" stroke-width="1.6"` : 'class="ttr-trait"',
      // paroi de verre d'un récipient : on voit le liquide à travers
      paroi: real ? `fill="${g('verre')}" fill-opacity=".35" stroke="${C.metal2}" stroke-width="1.4"` : 'class="ttr-trait"',
      metal: real ? `fill="${g('metal')}"` : 'class="ttr-support"',
      plast: real ? `fill="${g('plast')}" stroke="${C.plastique2}"` : 'class="ttr-appareil"',
    };
    const defs = real ? `<defs>
      <linearGradient id="ttr${k}-metal" x1="0" x2="1"><stop offset="0" stop-color="${C.metal2}"/><stop offset=".45" stop-color="${C.metal1}"/><stop offset="1" stop-color="${C.metal3}"/></linearGradient>
      <linearGradient id="ttr${k}-socle" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.metal1}"/><stop offset="1" stop-color="${C.metal3}"/></linearGradient>
      <linearGradient id="ttr${k}-verre" x1="0" x2="1"><stop offset="0" stop-color="${C.verre2}"/><stop offset=".3" stop-color="${C.verre1}"/><stop offset=".8" stop-color="${C.verre1}"/><stop offset="1" stop-color="${C.verre2}"/></linearGradient>
      <linearGradient id="ttr${k}-plast" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.plastique}"/><stop offset="1" stop-color="${C.plastique2}"/></linearGradient>
      <linearGradient id="ttr${k}-sol" x1="0" x2="1"><stop offset="0" stop-color="#000" stop-opacity=".10"/><stop offset=".35" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".12"/></linearGradient>
    </defs>` : '';

    // ---------- potence et pince ----------
    const potence = `
      <rect x="4" y="364" width="196" height="11" rx="${real ? 3 : 0}" ${real ? `fill="${g('socle')}"` : 'class="ttr-support"'}/>
      <rect x="27" y="6" width="7" height="358" rx="2" ${A.metal}/>
      <rect x="22" y="164" width="16" height="12" rx="2" ${real ? `fill="${C.metal3}"` : 'class="ttr-support"'}/>
      <rect x="34" y="168" width="80" height="4.5" rx="2" ${A.metal}/>
      <path d="M113 163 h26 a3 3 0 0 1 3 3 v8 a3 3 0 0 1 -3 3 h-26 a3 3 0 0 1 -3 -3 v-8 a3 3 0 0 1 3 -3 z" ${real ? `fill="${C.metal3}" fill-opacity=".85"` : 'class="ttr-support"'}/>
      <circle cx="146" cy="170" r="3.4" ${real ? `fill="${C.bouton}"` : 'class="ttr-support"'}/>`;

    // ---------- burette graduée : tube, graduations, robinet, pointe ----------
    let grad = '';
    for (let v = 0; v <= 25; v += 0.5) {
      const y = yBur(v), ent = Number.isInteger(v), cinq = v % 5 === 0;
      grad += `<line class="ttr-grad" x1="119" y1="${y}" x2="${cinq ? 129 : ent ? 126 : 123}" y2="${y}"/>`;
      if (cinq) grad += `<text class="ttr-grad-txt" x="114" y="${y + 3}" text-anchor="end">${v}</text>`;
    }
    const burette = `
      <path d="M115 10 L118 14 M137 10 L134 14" ${A.trait}/>
      <rect data-r="liq-bur" x="119" y="${Y0}" width="14" height="${240 - Y0}" fill="${C.burette}"/>
      <path data-r="menisque" d="" fill="${C.burette}" stroke="var(--accent-ink)" stroke-width="1.4"/>
      <path d="M118 12 V240 L123.5 250 h5 L134 240 V12" ${A.paroi}/>
      ${real ? '<line x1="121.5" y1="18" x2="121.5" y2="236" stroke="#ffffff" stroke-width="2.2" opacity=".85"/>' : ''}
      ${grad}
      <rect x="120.5" y="250" width="11" height="12" rx="2.5" ${real ? `fill="${C.plastique}" stroke="${C.metal3}"` : 'class="ttr-verre"'}/>
      <rect x="106" y="254" width="35" height="4.5" rx="2.25" ${real ? `fill="${C.bouton}"` : 'fill="var(--ink)"'}/>
      <circle cx="106" cy="256.2" r="3.6" ${real ? `fill="${C.bouton}"` : 'fill="var(--ink)"'}/>
      <path d="M123.6 262 L125.3 278 h1.4 L128.4 262" ${A.verre}/>
      <circle class="ttr-goutte" data-r="goutte" cx="126" cy="282" r="2.6"/>`;

    // ---------- bécher, solution, barreau aimanté, agitateur magnétique ----------
    const becher = `
      <rect x="72" y="340" width="110" height="24" rx="${real ? 5 : 2}" ${A.plast}/>
      <circle cx="166" cy="352" r="5.5" ${real ? `fill="${C.bouton}"` : 'class="ttr-verre"'}/>
      <line x1="166" y1="352" x2="166" y2="347" stroke="${real ? '#ffffff' : 'var(--ink)'}" stroke-width="1.3"/>
      <rect x="84" y="344" width="44" height="4" rx="2" ${real ? `fill="${C.plastique2}"` : 'fill="var(--paper-3)"'}/>
      <path data-r="sol" d="" stroke="none"/>
      ${real ? `<path data-r="sol-reflet" d="" fill="${g('sol')}"/>` : ''}
      <rect class="ttr-barreau" data-r="barreau" x="116" y="330" width="20" height="5" rx="2.5"/>
      <path d="M90 264 c2 0 4 2 4 4 V336 a4 4 0 0 0 4 4 H156 a4 4 0 0 0 4 -4 V266" ${A.paroi}/>
      <path d="M144 288 h10 M148 300 h6 M144 312 h10" ${real ? `stroke="${C.metal3}" stroke-width=".9"` : 'class="ttr-fin"'}/>
      ${real ? '<line x1="99" y1="272" x2="99" y2="330" stroke="#ffffff" stroke-width="3" stroke-linecap="round" opacity=".8"/>' : ''}`;

    el.innerHTML = `<svg viewBox="0 0 320 400" role="img" aria-label="Schéma du montage de titrage" preserveAspectRatio="xMidYMid meet">${defs}
      <g data-r="cadres"></g>${potence}${becher}${burette}
      <g data-r="appareil"></g>
      <g data-r="textes"></g>
    </svg>`;
    zone.appendChild(el);
    const R = n => el.querySelector(`[data-r="${n}"]`);

    // ---------- appareil de mesure ----------
    function dessinAppareil(type) {
      if (!type) return '';
      if (type === 'indicateur') return `
        <path d="M206 226 l0 -26 a6 6 0 0 1 12 0 l0 26 l-4 10 l-4 0 Z" ${real ? `fill="${C.plastique}" stroke="${C.metal3}"` : 'class="ttr-verre"'}/>
        <circle cx="212" cy="244" r="2.5" fill="var(--accent)"/>
        <text class="ttr-txt-2" x="226" y="218">quelques gouttes</text><text class="ttr-txt-2" x="226" y="231">d'indicateur coloré</text>`;
      const ph = type === 'ph';
      // sonde de pH (capuchon juste au-dessus du bécher) ou cellule de conductimétrie, câble vers l'appareil
      const capteur = ph ? sondePH(150, 246, 0.95, o.style)
        : `<rect x="145.5" y="246" width="9" height="11" rx="2" fill="${real ? '#3a3e45' : 'var(--ink)'}"/>
           <rect x="146" y="257" width="8" height="58" rx="2" ${real ? `fill="${C.plastique}" stroke="${C.metal3}"` : 'class="ttr-verre"'}/>
           <rect x="143" y="310" width="14" height="16" rx="1.5" fill="none" stroke="var(--ink)" stroke-width="1.4"/>
           <line x1="146" y1="312" x2="146" y2="324" stroke="var(--ink)" stroke-width="1.6"/><line x1="154" y1="312" x2="154" y2="324" stroke="var(--ink)" stroke-width="1.6"/>`;
      return `<path class="ttr-cable" d="M155 251 C 174 251, 186 296, 198 318"/>
        ${capteur}
        <rect x="196" y="292" width="116" height="74" rx="${real ? 9 : 4}" ${A.plast}/>
        <rect x="204" y="300" width="100" height="34" rx="4" ${real ? `fill="${C.ecran}"` : 'class="ttr-ecran"'}/>
        <text x="210" y="312" style="font:700 9px var(--font-sans)" fill="${real ? C.ecranTxt : 'var(--sheet)'}">${ph ? 'pH' : 'σ (mS/m)'}</text>
        <text data-r="aff" x="298" y="329" text-anchor="end" style="font:800 17px var(--font-sans);font-variant-numeric:tabular-nums" fill="${real ? C.ecranTxt : 'var(--sheet)'}"></text>
        <rect x="206" y="343" width="14" height="7" rx="3" ${real ? `fill="${C.bouton}"` : 'fill="var(--ink-2)"'}/><rect x="224" y="343" width="14" height="7" rx="3" ${real ? `fill="${C.bouton}"` : 'fill="var(--ink-2)"'}/>
        <text class="ttr-ecran-lab" x="${ph ? 276 : 281}" y="352" text-anchor="middle"${ph ? '' : ' style="font-size:9.5px"'}>${ph ? 'pH-mètre' : 'conductimètre'}</text>`;
    }
    function poserAppareil(type) {
      R('appareil').innerHTML = dessinAppareil(type);
      o.appareil = type;
      maj();
    }

    // ---------- textes à côté de la burette et du bécher ----------
    const ligne = (x1, y1, x2, y2, cls) => `<line class="${cls || 'ttr-fin'}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
    if (o.textes && !o.aCompleter) {
      const tb = o.textes.burette || [], tc = o.textes.becher || [];
      R('textes').innerHTML = `
        ${ligne(134, 62, 152, 62)}
        <text class="ttr-txt" x="156" y="48">${svgTexte(tb[0] || '')}</text>
        <text class="ttr-txt-2" x="156" y="68">${svgTexte(tb[1] || '')}</text>
        <text class="ttr-acc" data-r="V" x="156" y="96">V = 0,0 mL</text>
        ${ligne(162, 268, 170, 214)}
        <text class="ttr-txt" x="170" y="186">${svgTexte(tc[0] || '')}</text>
        <text class="ttr-txt-2" x="170" y="206">${svgTexte(tc[1] || '')}</text>
        <text class="ttr-txt-2" x="10" y="392">agitation</text>${ligne(56, 383, 78, 364)}`;
    } else if (!o.aCompleter) {
      R('textes').innerHTML = `<text class="ttr-acc" data-r="V" x="156" y="60">V = 0,0 mL</text>`;
    }

    // ---------- zones à compléter : deux cadres reliés à la burette et au bécher ----------
    const zones = {};
    if (o.aCompleter) {
      R('cadres').innerHTML = `
        <rect class="ttr-cadre" x="152" y="14" width="166" height="102" rx="10"/>
        ${ligne(134, 65, 152, 65, 'ttr-relie')}<circle class="ttr-relie-pt" cx="134" cy="65" r="3.5"/>
        <rect class="ttr-cadre" x="152" y="124" width="166" height="102" rx="10"/>
        ${ligne(166, 226, 160, 270, 'ttr-relie')}<circle class="ttr-relie-pt" cx="160" cy="270" r="3.5"/>
        ${ligne(60, 380, 80, 364, 'ttr-relie')}
        <rect x="192" y="288" width="124" height="82" rx="10" fill="none" stroke="var(--line-strong)" stroke-width="2" stroke-dasharray="6 4" data-r="cadre-app"/>`;
      const pos = {
        bur_esp: [157, 31], bur_c: [157, 65], bur_v: [157, 99],
        bec_esp: [157, 141], bec_c: [157, 175], bec_v: [157, 209],
        agit: [4, 390], app: [198, 329],
      };
      const attente = { bur_esp: 'espèces', bec_esp: 'espèces', bur_c: 'concentration', bec_c: 'concentration', bur_v: 'volume', bec_v: 'volume', agit: '', app: 'appareil de mesure' };
      for (const id in pos) {
        const z = document.createElement('button');
        z.type = 'button';
        z.className = 'ttr-zone';
        z.dataset.zone = id;
        z.dataset.attente = attente[id];
        z.style.left = (pos[id][0] / 320 * 100) + '%';
        z.style.top = (pos[id][1] / 400 * 100) + '%';
        z.style.width = (id === 'app' ? 112 : id === 'agit' ? 96 : 156) / 320 * 100 + '%';
        z.setAttribute('aria-label', 'Zone à compléter' + (attente[id] ? NB + ': ' + attente[id] : ''));
        z.innerHTML = `<span class="ttr-zone-vide">${attente[id] ? attente[id] + NB + '?' : '?'}</span>`;
        el.appendChild(z);
        zones[id] = z;
      }
    }

    // ---------- état : niveau de la burette, solution du bécher, affichage ----------
    let etat = { V: 0, affichage: '', couleur: C.eau, agitation: true };
    function maj(e) {
      etat = Object.assign(etat, e || {});
      const V = Math.max(0, Math.min(25, etat.V));
      const yL = yBur(V);
      const liq = R('liq-bur');
      liq.setAttribute('y', yL + 2); liq.setAttribute('height', Math.max(0, 240 - yL - 2));
      // ménisque : surface creuse, le bas du ménisque est sur la graduation
      R('menisque').setAttribute('d', `M119 ${yL - 2} Q126 ${yL + 2.6} 133 ${yL - 2} V${yL + 3} H119 Z`);
      const ys = ySol((o.volumeBecher || 10) + etat.V);
      const c = etat.couleur || C.eau;
      const d = `M95 ${ys} L159 ${ys} L159 335 Q159 339 155 339 L99 339 Q95 339 95 335 Z`;
      const sol = R('sol');
      sol.setAttribute('d', d);
      sol.setAttribute('fill', `rgba(${c.r},${c.g},${c.b},${c.a})`);
      if (R('sol-reflet')) R('sol-reflet').setAttribute('d', d);
      const tV = R('V');
      if (tV) tV.textContent = 'V = ' + fmt(etat.V, 1) + ' mL';
      const aff = R('aff');
      if (aff) aff.textContent = etat.affichage || '';
      R('barreau').classList.toggle('ttr-tourne', etat.agitation !== false);
      if (e && e.goutte) {
        const gt = R('goutte');
        gt.classList.remove('tombe'); void gt.getBBox(); gt.classList.add('tombe');
      }
    }
    if (!o.aCompleter) poserAppareil(o.appareil); else maj();
    return { el, maj, zones, poserAppareil };
  }

  /* ============================================================
     Repère et courbe y = f(V)
     API : { el, svg, maj(mesures), afficherDerivee(b), derivee(), donnees(), geo(), couche(nom),
             surRedessin(fn), actif(b), point(ev), mk, y }
     Une unité du SVG = un pixel du conteneur : la géométrie des tangentes se fait « comme sur papier ».
     ============================================================ */
  function courbe(zone, o) {
    o = Object.assign({ xMax: 20, derivee: null }, o || {});
    const Y = Object.assign({ nom: 'pH', min: 0, max: 14, pas: 1 }, o.y || {});
    const el = document.createElement('div');
    el.className = 'ttr-courbe';
    el.innerHTML = `<svg role="img" aria-label="Courbe ${Y.nom} en fonction du volume versé"></svg>`;
    zone.appendChild(el);
    const svg = el.querySelector('svg');
    let mesures = [], derVisible = false;
    const rappels = [];
    let G = null;
    const couches = {};
    const clipId = 'ttr-clip-' + (++nb);

    // données triées (V en mL), courbe lissée (monotone), dérivée « comme Regressi »
    function donnees() {
      const m = mesures.slice().sort((a, b) => a[0] - b[0]);
      const V = m.map(x => x[0] / 10), P = m.map(x => x[1]);
      const D = T.outils.derivee(V, P);
      return { V, P, D, s: V.length >= 2 ? T.outils.monotone(V, P) : null };
    }
    function pasGrad(etendue) {
      const brut = etendue / 6, p10 = Math.pow(10, Math.floor(Math.log10(brut)));
      return [1, 2, 5, 10].map(q => q * p10).find(q => q >= brut);
    }
    function geo() {
      const W = Math.max(200, el.clientWidth), H = Math.max(160, el.clientHeight);
      const d = donnees();
      const vmax = Math.max(o.xMax, Math.ceil((d.V[d.V.length - 1] || 0) / 2) * 2);
      const droite = o.derivee === 'droite' && derVisible ? 46 : 14;
      const g = { W, H, xmin: 0, xmax: vmax, x0: 40, x1: W - droite, haut: [] };
      const bas = H - 30;
      if (o.derivee === 'dessous' && derVisible) {
        const hp = Math.round((bas - 12) * 0.58);
        g.haut = [{ y0: 12 + hp - 8, y1: 12, min: Y.min, max: Y.max }, { y0: bas, y1: 12 + hp + 18 }];
      } else g.haut = [{ y0: bas, y1: 12, min: Y.min, max: Y.max }];
      g.kx = (g.x1 - g.x0) / (g.xmax - g.xmin);
      g.X = v => g.x0 + (v - g.xmin) * g.kx;
      g.Xi = x => g.xmin + (x - g.x0) / g.kx;
      const p = g.haut[0];
      g.ky = (p.y0 - p.y1) / (p.max - p.min);
      g.Y = v => p.y0 - (v - p.min) * g.ky;
      g.Yi = y => p.min + (p.y0 - y) / g.ky;
      if (derVisible && d.D.length) {
        const f = d.D.filter(isFinite);
        const dmin = Math.min(0, ...f), dmax = Math.max(0, ...f);
        const pas = pasGrad((dmax - dmin) || 1);
        const lo = Math.floor(dmin * 1.05 / pas) * pas, hi = Math.ceil(dmax * 1.05 / pas) * pas || pas;
        const q = o.derivee === 'dessous' ? g.haut[1] : g.haut[0];
        g.d = { min: lo, max: hi, pas, y0: q.y0, y1: q.y1 };
        g.kd = (q.y0 - q.y1) / (hi - lo);
        g.Yd = v => q.y0 - (v - lo) * g.kd;
        g.Ydi = y => lo + (q.y0 - y) / g.kd;
      }
      return g;
    }

    function dessiner() {
      G = geo();
      const g = G;
      svg.setAttribute('viewBox', `0 0 ${g.W} ${g.H}`);
      svg.innerHTML = '';
      const fond = mk('g', {}, svg);
      const p = g.haut[0], bas = (g.haut[1] || p).y0;
      // quadrillage en pointillés, graduations, axes
      for (let v = 0; v <= g.xmax; v += 1) {
        mk('line', { class: 'ttr-grille', x1: g.X(v), x2: g.X(v), y1: p.y0, y2: p.y1, 'stroke-opacity': v % 2 ? .55 : 1 }, fond);
        if (v % 2 === 0) mk('text', { class: 'ttr-gradu', x: g.X(v), y: bas + 15, 'text-anchor': 'middle' }, fond).textContent = v;
      }
      const nbY = Math.round((Y.max - Y.min) / Y.pas);
      for (let i = 0; i <= nbY; i++) {
        const y = Y.min + i * Y.pas;
        mk('line', { class: 'ttr-grille', x1: g.x0, x2: g.x1, y1: g.Y(y), y2: g.Y(y), 'stroke-opacity': i % 2 ? .55 : 1 }, fond);
        if (i % 2 === 0) mk('text', { class: 'ttr-gradu', x: g.x0 - 6, y: g.Y(y) + 4, 'text-anchor': 'end' }, fond).textContent = fmt(+y.toPrecision(6));
      }
      mk('line', { class: 'ttr-axe', x1: g.x0, x2: g.x1 + 6, y1: p.y0, y2: p.y0 }, fond);
      mk('line', { class: 'ttr-axe', x1: g.x0, x2: g.x0, y1: p.y0, y2: p.y1 - 6 }, fond);
      mk('path', { class: 'ttr-fleche', d: `M${g.x1 + 10} ${p.y0} l-7 -4 v8 z` }, fond);
      mk('path', { class: 'ttr-fleche', d: `M${g.x0} ${p.y1 - 10} l-4 7 h8 z` }, fond);
      mk('text', { class: 'ttr-axe-nom', x: g.x0 + 6, y: p.y1 + 2 }, fond).textContent = Y.nom;
      mk('text', { class: 'ttr-axe-nom', x: g.x1, y: bas - 6, 'text-anchor': 'end' }, fond).textContent = 'V (mL)';
      const nomD = `d${Y.court || Y.nom}/dV (mL⁻¹)`;
      if (g.d) {
        const q = g.d;
        if (o.derivee === 'dessous') {
          for (let v = 0; v <= g.xmax; v += 1) mk('line', { class: 'ttr-grille', x1: g.X(v), x2: g.X(v), y1: q.y0, y2: q.y1, 'stroke-opacity': v % 2 ? .55 : 1 }, fond);
          for (let y = q.min; y <= q.max + 1e-9; y += q.pas) {
            mk('line', { class: 'ttr-grille', x1: g.x0, x2: g.x1, y1: g.Yd(y), y2: g.Yd(y) }, fond);
            mk('text', { class: 'ttr-gradu', x: g.x0 - 6, y: g.Yd(y) + 4, 'text-anchor': 'end' }, fond).textContent = fmt(+y.toPrecision(6));
          }
          mk('line', { class: 'ttr-axe', x1: g.x0, x2: g.x1 + 6, y1: g.Yd(0), y2: g.Yd(0) }, fond);
          mk('line', { class: 'ttr-axe', x1: g.x0, x2: g.x0, y1: q.y0, y2: q.y1 - 4 }, fond);
          mk('text', { class: 'ttr-axe-nom', x: g.x0 + 6, y: q.y1 + 4 }, fond).textContent = nomD;
        } else {
          // second axe, à droite
          mk('line', { class: 'ttr-axe ttr-axe-d', x1: g.x1, x2: g.x1, y1: q.y0, y2: q.y1 - 4 }, fond);
          for (let y = q.min; y <= q.max + 1e-9; y += q.pas) {
            mk('line', { class: 'ttr-axe ttr-axe-d', x1: g.x1, x2: g.x1 + 4, y1: g.Yd(y), y2: g.Yd(y) }, fond);
            mk('text', { class: 'ttr-gradu', x: g.x1 + 7, y: g.Yd(y) + 4 }, fond).textContent = fmt(+y.toPrecision(6));
          }
          mk('line', { class: 'ttr-der', x1: g.x0, x2: g.x1, y1: g.Yd(0), y2: g.Yd(0), 'stroke-width': 1, 'stroke-dasharray': '1 3' }, fond);
          mk('text', { class: 'ttr-axe-nom ttr-axe-nom-d', x: g.x1 - 4, y: q.y1 + 2, 'text-anchor': 'end' }, fond).textContent = nomD;
        }
      }
      // rien ne dépasse du repère
      const defs = mk('defs', {}, svg);
      const cp = mk('clipPath', { id: clipId }, defs);
      mk('rect', { x: g.x0, y: 4, width: g.x1 - g.x0, height: bas - 4 }, cp);
      couches.donnees = mk('g', { 'clip-path': `url(#${clipId})` }, svg);
      couches.outils = mk('g', { 'clip-path': `url(#${clipId})` }, svg);
      couches.dessus = mk('g', {}, svg);
      const d = donnees();
      if (d.s && d.V.length >= 2) {
        let path = '';
        const a = g.X(d.V[0]), b = g.X(d.V[d.V.length - 1]);
        for (let x = a; x <= b + 0.5; x += 2) { const v = g.Xi(Math.min(x, b)); path += (path ? 'L' : 'M') + x.toFixed(1) + ' ' + g.Y(d.s.f(v)).toFixed(1); }
        mk('path', { class: 'ttr-lisse', d: path }, couches.donnees);
      }
      d.V.forEach((v, i) => mk('circle', { class: 'ttr-pt', cx: g.X(v), cy: g.Y(d.P[i]), r: 2.8 }, couches.donnees));
      if (g.d) {
        let path = '';
        d.V.forEach((v, i) => { if (isFinite(d.D[i])) path += (path ? 'L' : 'M') + g.X(v).toFixed(1) + ' ' + g.Yd(d.D[i]).toFixed(1); });
        mk('path', { class: 'ttr-der', d: path }, couches.donnees);
        d.V.forEach((v, i) => { if (isFinite(d.D[i])) mk('circle', { class: 'ttr-pt-der', cx: g.X(v), cy: g.Yd(d.D[i]), r: 2.4 }, couches.donnees); });
      }
      rappels.forEach(f => f(G));
    }

    if (window.ResizeObserver) new ResizeObserver(() => dessiner()).observe(el);
    else window.addEventListener('resize', dessiner);
    return {
      el, svg, mk, y: Y,
      maj(m) { mesures = m.slice(); dessiner(); },
      afficherDerivee(b) { derVisible = b; dessiner(); },
      derivee: () => derVisible,
      donnees, geo: () => G || geo(),
      couche: n => couches[n],
      surRedessin(f) { rappels.push(f); },
      actif(b) { el.classList.toggle('actif', b); },
      // position du pointeur en unités du SVG (= pixels du conteneur)
      point(ev) { const r = svg.getBoundingClientRect(); const gg = G || geo(); return { x: (ev.clientX - r.left) * (gg.W / r.width), y: (ev.clientY - r.top) * (gg.H / r.height) }; },
    };
  }

  /* ============================================================
     Tableau de valeurs en petit (dernière mesure mise en valeur et visible)
     ============================================================ */
  function tableau(zone, o) {
    o = Object.assign({ colonnes: ['V (mL)', 'pH'], dec: 2 }, o || {});
    const boite = document.createElement('div');
    boite.className = 'ttr-tab-boite';
    zone.appendChild(boite);
    function maj(mesures) {
      const m = mesures.slice().sort((a, b) => a[0] - b[0]);
      const dernier = mesures.length ? mesures[mesures.length - 1][0] : null;
      if (!m.length) { boite.innerHTML = `<p class="ttr-tab-vide">Aucune mesure</p>`; return; }
      boite.innerHTML = `<table class="ttr-tab"><thead><tr>${o.colonnes.map(c => `<th>${c}</th>`).join('')}</tr></thead><tbody>
        ${m.map(x => `<tr class="${x[0] === dernier ? 'dernier' : ''}"><td>${fmt(x[0] / 10)}</td><td>${fmt(x[1], o.dec)}</td></tr>`).join('')}</tbody></table>`;
      const tr = boite.querySelector('tr.dernier');
      if (tr) boite.scrollTop = tr.offsetTop - boite.clientHeight + tr.offsetHeight + 4;
    }
    maj([]);
    return { el: boite, maj };
  }

  /* ============================================================
     Regressi : texte au format CSV (point-virgule, virgule décimale) et copie
     ============================================================ */
  const regressi = {
    texte(mesures, noms, dec) {
      noms = noms || ['V', 'pH'];
      const m = mesures.slice().sort((a, b) => a[0] - b[0]);
      return noms.join(';') + '\n' + m.map(([d, p]) => fmt(d / 10).replace(/[\s  ]/g, '') + ';' + fmt(p, dec == null ? 2 : dec).replace(/[\s  ]/g, '')).join('\n') + '\n';
    },
    copier(mesures, zone, noms, dec) {
      const texte = regressi.texte(mesures, noms, dec);
      const reussi = () => { zone.innerHTML = `<p class="ttr-msg ok">Mesures copiées. Dans Regressi${NB}: Fichier → Nouveau → Presse-papier.</p>`; };
      const zoneTexte = () => {
        zone.innerHTML = `<p class="ttr-msg">Copie-le (Ctrl + C)${NB}:</p><textarea class="ttr-copie-zone" readonly></textarea>`;
        const ta = zone.querySelector('textarea');
        ta.value = texte; ta.focus(); ta.select();
      };
      const repli = () => {
        try {
          const ta = document.createElement('textarea');
          ta.value = texte; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
          document.body.appendChild(ta); ta.select();
          const ok = document.execCommand('copy');
          ta.remove();
          ok ? reussi() : zoneTexte();
        } catch (e) { zoneTexte(); }
      };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(texte).then(reussi, repli);
      else repli();
      defiler(zone);
      return texte;
    },
  };

  /* ============================================================
     Simulateur de titrage : montage + commandes + courbe + tableau
     config (voir l'en-tête du fichier pour la chimie) :
       suivi: 'ph' | 'conductimetrie' | 'colorimetrie',
       titrant: { c, ions }, titre: { V, ions }, reaction, eauAjoutee, indicateur,
       veq: { moyenne, ecartType },        loi du volume équivalent de chaque prise d'essai
       prise: { veq, decalage, mesures },  prise d'essai en cours (gardée par l'application), sinon tirée
       textes: { burette, becher },        textes du montage (« c_A » : indice)
       style: 'realiste' | 'epure', commandes: 'boutons' | 'pastilles', pas: [1, 0.2, 0.1], vMax: 25, xMax: 20,
       consigne: html,                     consigne au-dessus des commandes
       unite: 'mS/m',                      conductimétrie
       lienRegressi: url,                  bouton « Le faire avec Regressi » (nouvelle fenêtre)
       etat(prise) → { ok, ko, html }      message sous les commandes (ok : fin du titrage ; ko : encadré rouge et « Recommencer » mis en avant)
       onMesure(prise), onRecommencer(prise)
     ============================================================ */
  function creer(zone, cfg) {
    cfg = Object.assign({ suivi: 'ph', pas: [1, 0.2, 0.1], vMax: 25, xMax: 20, style: 'realiste', commandes: 'boutons', unite: 'mS/m',
      veq: { moyenne: 9.0, ecartType: 0.4 } }, cfg || {});
    const suivi = cfg.suivi;
    const nouvellePrise = () => { const p = T.chimie.priseEssai(cfg.veq); return { veq: p.veq, decalage: p.decalage, mesures: [] }; };
    let pr = cfg.prise && isFinite(cfg.prise.veq) ? cfg.prise : nouvellePrise();
    if (!Array.isArray(pr.mesures)) pr.mesures = [];
    const modeleDe = veq => T.chimie.creer({ titrant: cfg.titrant, titre: cfg.titre, reaction: cfg.reaction, veq,
      eauAjoutee: cfg.eauAjoutee, indicateur: cfg.indicateur });
    let modele = modeleDe(pr.veq);
    // ce qu'affiche l'appareil pour V mL versés (null : pas d'appareil)
    function lecture(V) {
      if (suivi === 'ph') return T.chimie.lecturePH(modele.pH(V), pr.decalage);
      if (suivi === 'conductimetrie') {
        const s = modele.sigma(V, cfg.unite) * (1 + pr.decalage * 0.4) * (1 + (Math.random() * 2 - 1) * 0.004);
        return Math.round(s * 10) / 10;
      }
      return null;
    }
    const avecMesure = suivi !== 'colorimetrie';
    if (avecMesure && !pr.mesures.length) pr.mesures.push([0, lecture(0)]);
    const DIX = cfg.pas.map(p => Math.round(p * 10));
    const V_MAX = Math.round(cfg.vMax * 10);
    let vCol = 0;          // colorimétrie : volume versé (dixièmes), sans mesure

    zone.innerHTML = `<div class="ttr-sim ttr-sim-${avecMesure ? 'trois' : 'seul'}">
        <div class="ttr-sim-montage" data-r="montage"></div>
        ${cfg.consigne ? `<p class="ttr-consigne ttr-sim-consigne">${cfg.consigne}</p>` : ''}
        <div class="ttr-sim-cmd">
          <div class="ttr-cmd" data-r="commandes"></div>
          <div class="ttr-msg" data-r="msg" role="status"></div>
        </div>
        ${avecMesure ? `<div class="ttr-sim-courbe"><div class="ttr-sim-c" data-r="courbe"></div>
          <div class="ttr-boutons">
            <button type="button" class="btn-small" data-r="copier">Copier les mesures pour Regressi</button>
            ${cfg.lienRegressi ? `<a class="btn-small" href="${cfg.lienRegressi}" target="_blank" rel="noopener">Le faire avec Regressi</a>` : ''}
            <button type="button" class="btn-small" data-r="recommencer">Recommencer (nouvelle prise d’essai)</button></div>
          <div data-r="copie"></div></div>
        <div class="ttr-sim-tab" data-r="tab"></div>` : `<div class="ttr-boutons"><button type="button" class="btn-small" data-r="recommencer">Recommencer (nouvelle prise d’essai)</button></div>`}
      </div>`;
    const R = n => zone.querySelector(`[data-r="${n}"]`);
    const appareil = suivi === 'ph' ? 'ph' : suivi === 'conductimetrie' ? 'conductimetre' : null;
    const M = montage(R('montage'), { style: cfg.style, appareil, textes: cfg.textes });
    let Cb = null, Tb = null;
    // axe des ordonnées : pH de 0 à 14 ; conductivité de 0 à un peu plus que la plus grande valeur attendue
    let yAxe = { nom: 'pH', min: 0, max: 14, pas: 1 };
    if (suivi === 'conductimetrie') {
      let mx = 0;
      for (let v = 0; v <= cfg.xMax; v += 0.5) mx = Math.max(mx, modele.sigma(v, cfg.unite));
      const brut = mx / 7, p10 = Math.pow(10, Math.floor(Math.log10(brut)));
      const pasY = [1, 2, 5, 10].map(q => q * p10).find(q => q >= brut);
      yAxe = { nom: 'σ (' + cfg.unite.replace('/m', '·m⁻¹').replace('/cm', '·cm⁻¹') + ')', court: 'σ', min: 0, max: Math.ceil(mx * 1.1 / pasY) * pasY, pas: pasY };
    }
    if (avecMesure) {
      Cb = courbe(R('courbe'), { xMax: cfg.xMax, y: yAxe });
      Tb = tableau(R('tab'), { colonnes: ['V (mL)', suivi === 'ph' ? 'pH' : 'σ (' + cfg.unite + ')'], dec: suivi === 'ph' ? 2 : 1 });
    }

    // ---------- commandes de versement ----------
    const cmd = R('commandes');
    let pas = DIX[0];
    if (cfg.commandes === 'pastilles') {
      cmd.innerHTML = `<div class="ttr-pas" role="group" aria-label="Volume à verser">${DIX.map(p => `<button type="button" class="ttr-pastille" data-pas="${p}" aria-pressed="${p === pas}">${fmt(p / 10)} mL</button>`).join('')}</div>
        <div class="ttr-verser"><button type="button" class="btn-primary" data-r="verser">Verser</button><span class="ttr-lecture-v" data-r="lecV"></span></div>`;
      cmd.querySelectorAll('[data-pas]').forEach(b => b.addEventListener('click', () => {
        pas = +b.dataset.pas;
        cmd.querySelectorAll('[data-pas]').forEach(x => x.setAttribute('aria-pressed', x === b));
      }));
      R('verser').addEventListener('click', () => verser(pas));
    } else {
      cmd.innerHTML = `<div class="ttr-verser">${DIX.map(p => `<button type="button" class="btn-secondary ttr-verser-direct" data-v="${p}">Verser ${fmt(p / 10)}${NB}mL</button>`).join('')}</div>
        <span class="ttr-lecture-v" data-r="lecV"></span>`;
      cmd.querySelectorAll('[data-v]').forEach(b => b.addEventListener('click', () => verser(+b.dataset.v)));
    }

    const vAct = () => avecMesure ? pr.mesures.reduce((m, x) => Math.max(m, x[0]), 0) : vCol;
    function afficher(goutte) {
      const v = vAct(), dern = avecMesure ? pr.mesures.find(x => x[0] === v) : null;
      M.maj({ V: v / 10, affichage: dern ? fmt(dern[1], suivi === 'ph' ? 2 : 1) : '', couleur: modele.couleur(v / 10), goutte });
      R('lecV').textContent = 'V = ' + fmt(v / 10, 1) + ' mL';
      if (Cb) { Cb.maj(pr.mesures); Tb.maj(pr.mesures); }
      const msg = R('msg');
      let ko = false;
      if (v >= V_MAX) { msg.className = 'ttr-msg'; msg.textContent = `La burette est vide (${fmt(cfg.vMax)} mL).`; }
      else if (cfg.etat) {
        const e = cfg.etat(pr, v);
        ko = !!(e && e.ko);
        msg.className = 'ttr-msg' + (e && e.ok ? ' ok' : ko ? ' ko' : '');
        msg.innerHTML = e ? e.html : '';
      }
      else { msg.className = 'ttr-msg'; msg.textContent = ''; }
      // état « ko » (erreur à corriger en recommençant) : bouton « Recommencer » mis en avant
      R('recommencer').classList.toggle('ttr-avant', ko);
    }
    function verser(d) {
      const v = vAct();
      if (v + d > V_MAX) { R('msg').textContent = `La burette ne contient que ${fmt(cfg.vMax)} mL.`; return; }
      const nv = v + d;
      if (avecMesure) pr.mesures.push([nv, lecture(nv / 10)]); else vCol = nv;
      cfg.onMesure && cfg.onMesure(pr);
      afficher(true);
    }
    // « Passer cette partie » : une série de mesures toute faite (comme le tableau du TP)
    function remplirAuto(volumes) {
      const L = volumes || T.outils.auto(pr.veq, cfg.vFin || 16);
      pr.mesures = L.map(v => [Math.round(v * 10), lecture(v)]);
      cfg.onMesure && cfg.onMesure(pr);
      afficher(false);
    }
    function recommencer() {
      pr = nouvellePrise();
      modele = modeleDe(pr.veq);
      vCol = 0;
      if (avecMesure) pr.mesures.push([0, lecture(0)]);
      cfg.onRecommencer && cfg.onRecommencer(pr);
      R('copie') && (R('copie').innerHTML = '');
      afficher(false);
    }
    // recommencer : confirmation sur place si des mesures existent
    R('recommencer').addEventListener('click', ev => {
      const b = ev.currentTarget;
      if ((pr.mesures.length > 1 || vCol > 0) && !b.dataset.confirme) {
        b.dataset.confirme = '1';
        b.textContent = 'Effacer tes mesures et refaire une prise d’essai' + NB + '? Oui';
        setTimeout(() => { delete b.dataset.confirme; b.textContent = 'Recommencer (nouvelle prise d’essai)'; }, 4000);
        return;
      }
      delete b.dataset.confirme;
      b.textContent = 'Recommencer (nouvelle prise d’essai)';
      recommencer();
    });
    if (R('copier')) R('copier').addEventListener('click', () => regressi.copier(pr.mesures, R('copie'), ['V', suivi === 'ph' ? 'pH' : 'sigma'], suivi === 'ph' ? 2 : 1));
    afficher(false);
    return { verser, remplirAuto, recommencer, mesures: () => pr.mesures, prise: () => pr, veqTire: () => pr.veq, courbe: Cb, montage: M, modele: () => modele };
  }

  /* ============================================================
     Glisser (Pointer Events : souris, doigt, stylet)
     ============================================================ */
  function glisser(Cb, cible, debut, bouge, fin) {
    cible.addEventListener('pointerdown', ev => {
      if (ev.pointerType === 'mouse' && ev.button !== 0) return;
      if (!debut(Cb.point(ev), ev)) return;
      ev.preventDefault(); ev.stopPropagation();
      try { cible.setPointerCapture(ev.pointerId); } catch (e) { /* rien */ }
      const mv = e2 => { if (e2.pointerId === ev.pointerId) bouge(Cb.point(e2), e2); };
      const up = e2 => {
        if (e2.pointerId !== ev.pointerId) return;
        cible.removeEventListener('pointermove', mv); cible.removeEventListener('pointerup', up); cible.removeEventListener('pointercancel', up);
        fin && fin(Cb.point(e2), e2);
      };
      cible.addEventListener('pointermove', mv); cible.addEventListener('pointerup', up); cible.addEventListener('pointercancel', up);
    });
  }

  // champ « V_eq = … mL » + Valider ; ok(v) → true si juste ; rappels de réussite et d'erreur
  function saisieVeq(z, o) {
    z.innerHTML = `<div class="ttr-valeur"><span class="ttr-lab">V<sub>eq</sub> =</span><span data-r="ch"></span><span class="ttr-unite">mL</span>
      <button type="button" class="btn-primary ttr-btn" data-r="ok">Valider</button></div><div data-r="ret2"></div>`;
    const ch = champ({ aria: 'Volume équivalent en mL', signe: false });
    z.querySelector('[data-r="ch"]').appendChild(ch.el);
    let err = 0;
    z.querySelector('[data-r="ok"]').addEventListener('click', () => {
      const v = ch.valeur(), r = z.querySelector('[data-r="ret2"]');
      if (!isFinite(v)) { r.innerHTML = `<p class="ttr-petit">Écris un nombre (avec une virgule si besoin).</p>`; return; }
      if (Math.abs(v - o.cible()) <= 0.1 + 1e-9) {
        ch.desactiver(true);
        z.querySelector('[data-r="ok"]').hidden = true;
        retour(r, err ? 'apres' : true, ' ' + o.bravo());
        o.fini && o.fini(v);
      } else {
        err++;
        retour(r, false, ' ' + o.diag(v) + (err >= 2 ? ` <button type="button" class="btn-small" data-r="rep">Afficher la réponse</button>` : ''));
        const rep = r.querySelector('[data-r="rep"]');
        if (rep) rep.addEventListener('click', () => {
          const c = Math.round(o.cible() * 10) / 10;
          ch.input.value = fmt(c, 1); ch.desactiver(true); z.querySelector('[data-r="ok"]').hidden = true;
          r.innerHTML = `<div class="callout ttr-retour"><b>Réponse.</b> V<sub>eq</sub> ≈ ${fmt(c, 1)} mL.</div>`;
          o.fini && o.fini(c);
        });
      }
    });
    return { remplir(v) { ch.input.value = fmt(v, 1); ch.desactiver(true); z.querySelector('[data-r="ok"]').hidden = true; } };
  }

  /* ============================================================
     Méthode des tangentes, semi-automatique
     o = { deplacement: 'direct' | 'poignee' | 'fleches', aimant: true, etapes: 'consigne' | 'liste',
           panneau: élément (consigne, boutons, champ), fini(veqEleve) }
     État gardé en coordonnées sans dimension : un redimensionnement ne perd rien.
     Refus de la 1re tangente : droite à plus de 80° à l'écran (dans le saut),
     à moins de 12° ou à plus de 3,5 mL du saut (trop loin).
     ============================================================ */
  const CONSIGNES = [
    'Pose ton doigt (ou la souris) sur la courbe, sur l’arrondi avant le saut, et fais-le glisser${NB}: la tangente suit. Relâche quand elle touche bien l’arrondi.',
    'Fais glisser la parallèle jusqu’à ce qu’elle soit tangente à l’autre arrondi, puis «${NB}Valider la position${NB}».',
    'Voici une perpendiculaire aux deux tangentes${NB}: fais-la glisser où tu veux le long des tangentes. Son milieu est marqué.',
    'Fais glisser la troisième droite, parallèle aux deux tangentes, jusqu’au milieu de la perpendiculaire.',
    'E est le point d’équivalence. Lis son abscisse sur l’axe des V et écris V<sub>eq</sub>.',
  ].map(t => t.replace(/\$\{NB\}/g, NB));
  const TITRES = ['1re tangente sur l’arrondi', 'Parallèle tangente à l’autre arrondi', 'Perpendiculaire et son milieu', 'Parallèle passant par le milieu', 'Lire V<sub>eq</sub>'];

  function tangentes(Cb, o) {
    o = Object.assign({ deplacement: 'direct', aimant: true, etapes: 'consigne' }, o || {});
    const P = o.panneau;
    let etape = 0;
    const S = { v1: null, v1essai: null, d2: null, tA: null, d3: null, E: null };
    P.innerHTML = `
      ${o.etapes === 'liste' ? `<ol class="ttr-deroule">${TITRES.map(t => `<li>${t}</li>`).join('')}</ol>` : ''}
      <p class="ttr-consigne" data-r="consigne"></p>
      <div class="ttr-actions" data-r="boutons"></div>
      <div data-r="retour"></div>
      <div data-r="saisie"></div>`;
    const R = n => P.querySelector(`[data-r="${n}"]`);

    // ---------- géométrie en pixels ----------
    function geom() {
      const g = Cb.geo(), d = Cb.donnees();
      if (!d.s) return null;
      const f = v => d.s.f(v), df = v => d.s.df(v);
      let vJ = d.V[0], best = 0;              // point du saut : pente la plus forte
      for (let v = d.V[0]; v <= d.V[d.V.length - 1]; v += 0.02) { const s = Math.abs(df(v)); if (s > best) { best = s; vJ = v; } }
      return { g, d, f, df, vJ };
    }
    function droiteT1(G, v) {
      const g = G.g;
      const Pp = { x: g.X(v), y: g.Y(G.f(v)) };
      let u = { x: g.kx, y: -G.df(v) * g.ky };
      const n0 = Math.hypot(u.x, u.y); u = { x: u.x / n0, y: u.y / n0 };
      return { P: Pp, u, n: { x: -u.y, y: u.x } };
    }
    // parallèle tangente à l'autre arrondi : point de la courbe le plus éloigné de T1, de l'autre côté du saut
    function autreTangente(G, Tg, v1) {
      const g = G.g, dist = v => Tg.n.x * (g.X(v) - Tg.P.x) + Tg.n.y * (g.Y(G.f(v)) - Tg.P.y);
      const V = G.d.V, apres = (v1 != null ? v1 : S.v1) <= G.vJ;
      const a = apres ? G.vJ : V[0], b = apres ? V[V.length - 1] : G.vJ;
      let best = 0, vB = G.vJ;
      for (let v = a; v <= b; v += 0.01) { const s = dist(v); if (Math.abs(s) > Math.abs(best)) { best = s; vB = v; } }
      return { dEtoile: best || 1, v2: vB, dist };
    }
    function trait(Tg, d, cls) {
      const L = 4000, cx = Tg.P.x + d * Tg.n.x, cy = Tg.P.y + d * Tg.n.y;
      return Cb.mk('line', { class: 'ttr-droite ' + (cls || ''), x1: cx - L * Tg.u.x, y1: cy - L * Tg.u.y, x2: cx + L * Tg.u.x, y2: cy + L * Tg.u.y });
    }
    function pointPoignee(G, Tg, d, bias) {
      const g = G.g, cx = Tg.P.x + d * Tg.n.x, cy = Tg.P.y + d * Tg.n.y;
      const mx = (g.x0 + g.x1) / 2 + (bias || 0), my = (g.haut[0].y0 + g.haut[0].y1) / 2;
      let t = (mx - cx) * Tg.u.x + (my - cy) * Tg.u.y;
      const pt = t2 => ({ x: cx + t2 * Tg.u.x, y: cy + t2 * Tg.u.y });
      const dedans = q => q.x > g.x0 + 12 && q.x < g.x1 - 12 && q.y > g.haut[0].y1 + 12 && q.y < g.haut[0].y0 - 12;
      for (let i = 0; i < 400 && !dedans(pt(t)); i++) t += (i % 2 ? 1 : -1) * i * 2;
      return pt(t);
    }
    function poignee(couche, q, nom) {
      const gr = Cb.mk('g', { 'data-poignee': nom }, couche);
      Cb.mk('circle', { class: 'ttr-poignee-zone', cx: q.x, cy: q.y, r: 24 }, gr);
      Cb.mk('circle', { class: 'ttr-poignee', cx: q.x, cy: q.y, r: 9 }, gr);
      return gr;
    }

    // ---------- rendu de tout ce qui est construit ----------
    function rendu() {
      const cO = Cb.couche('outils'), cD = Cb.couche('dessus');
      if (!cO) return;
      cO.innerHTML = ''; cD.querySelectorAll('[data-t]').forEach(x => x.remove());
      const G = geom();
      if (!G) return;
      const v1 = S.v1 != null ? S.v1 : S.v1essai;
      if (v1 == null) return;
      const Tg = droiteT1(G, v1);
      cO.appendChild(trait(Tg, 0, S.v1 == null ? 'essai' : ''));
      Cb.mk('circle', { class: 'ttr-milieu', cx: Tg.P.x, cy: Tg.P.y, r: 3.5 }, cO);
      if (S.v1 == null) return;
      const A = autreTangente(G, Tg), dE = A.dEtoile;
      if (S.d2 != null) {
        const d2 = S.d2 * dE;
        cO.appendChild(trait(Tg, d2, etape === 1 ? 'mobile' : ''));
        if (etape === 1 && o.deplacement !== 'direct') poignee(Cb.mk('g', { 'data-t': 1 }, cD), pointPoignee(G, Tg, d2, 60), 'd2');
      }
      if (S.tA != null) {
        const t = S.tA * Math.abs(dE);
        const A1 = { x: Tg.P.x + t * Tg.u.x, y: Tg.P.y + t * Tg.u.y };
        const B1 = { x: A1.x + dE * Tg.n.x, y: A1.y + dE * Tg.n.y };
        const Mi = { x: (A1.x + B1.x) / 2, y: (A1.y + B1.y) / 2 };
        Cb.mk('line', { class: 'ttr-perp' + (etape === 2 ? ' mobile' : ''), x1: A1.x, y1: A1.y, x2: B1.x, y2: B1.y }, cO);
        [[A1, Mi], [Mi, B1]].forEach(([a, b]) => {           // petites marques de longueurs égales
          const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
          Cb.mk('line', { class: 'ttr-marque', x1: mx - 5 * Tg.u.x, y1: my - 5 * Tg.u.y, x2: mx + 5 * Tg.u.x, y2: my + 5 * Tg.u.y }, cO);
        });
        Cb.mk('circle', { class: 'ttr-milieu', cx: Mi.x, cy: Mi.y, r: 4 }, cO);
        const s = 8, c1 = { x: A1.x + s * Tg.u.x, y: A1.y + s * Tg.u.y }, c2 = { x: A1.x + s * Math.sign(dE) * Tg.n.x, y: A1.y + s * Math.sign(dE) * Tg.n.y };
        Cb.mk('path', { class: 'ttr-fin', d: `M${c1.x} ${c1.y} L${c1.x + c2.x - A1.x} ${c1.y + c2.y - A1.y} L${c2.x} ${c2.y}` }, cO);
        if (etape === 2 && o.deplacement !== 'direct') poignee(Cb.mk('g', { 'data-t': 1 }, cD), Mi, 'perp');
      }
      if (S.d3 != null) {
        const d3 = S.d3 * dE;
        cO.appendChild(trait(Tg, d3, etape === 3 ? 'mobile' : ''));
        if (etape === 3 && o.deplacement !== 'direct') poignee(Cb.mk('g', { 'data-t': 1 }, cD), pointPoignee(G, Tg, d3, -60), 'd3');
      }
      if (S.E != null) {
        const g = G.g, x = g.X(S.E), y = g.Y(G.f(S.E));
        Cb.mk('line', { class: 'ttr-lecture', x1: x, y1: y, x2: x, y2: g.haut[0].y0 }, cO);
        Cb.mk('circle', { class: 'ttr-E', cx: x, cy: y, r: 5.5, 'data-t': 1 }, cD);
        Cb.mk('text', { class: 'ttr-E-txt', x: x + 8, y: y - 8, 'data-t': 1 }, cD).textContent = 'E';
      }
    }
    Cb.surRedessin(() => rendu());

    // ---------- interactions ----------
    let prise = null, depart = null;
    function quoiSaisir(p) {
      const G = geom(); if (!G) return null;
      if (etape === 0) return 't1';
      if (o.deplacement !== 'direct') return null;   // poignée : saisie par sa cible (data-poignee)
      const Tg = droiteT1(G, S.v1), dE = autreTangente(G, Tg).dEtoile;
      const distLigne = d => Math.abs(Tg.n.x * (p.x - Tg.P.x) + Tg.n.y * (p.y - Tg.P.y) - d);
      // cible de 44 px autour de la droite à déplacer
      if (etape === 1 && distLigne(S.d2 * dE) < 22) return 'd2';
      if (etape === 3 && distLigne(S.d3 * dE) < 22) return 'd3';
      if (etape === 2) {
        const t = S.tA * Math.abs(dE), along = (p.x - Tg.P.x) * Tg.u.x + (p.y - Tg.P.y) * Tg.u.y;
        const dn = Tg.n.x * (p.x - Tg.P.x) + Tg.n.y * (p.y - Tg.P.y);
        if (Math.abs(along - t) < 22 && dn * Math.sign(dE) > -22 && dn * Math.sign(dE) < Math.abs(dE) + 22) return 'perp';
      }
      return null;
    }
    function commencer(p, ev) {
      if (etape > 3) return false;
      const gp = ev.target.closest && ev.target.closest('[data-poignee]');
      const q = gp ? gp.getAttribute('data-poignee') : quoiSaisir(p);
      if (!q) return false;
      prise = q;
      const G = geom(), Tg = S.v1 != null ? droiteT1(G, S.v1) : null;
      depart = { p, d2: S.d2, tA: S.tA, d3: S.d3, Tg, dE: Tg ? autreTangente(G, Tg).dEtoile : 0 };
      if (q === 't1') { S.v1essai = Cb.geo().Xi(p.x); bornerT1(); rendu(); }
      return true;
    }
    function bornerT1() { const d = Cb.donnees(); S.v1essai = Math.max(d.V[0], Math.min(d.V[d.V.length - 1], S.v1essai)); }
    function deplacer(p) {
      if (!prise) return;
      if (prise === 't1') { S.v1essai = Cb.geo().Xi(p.x); bornerT1(); rendu(); return; }
      const { Tg, dE } = depart;
      const dn = (p.x - depart.p.x) * Tg.n.x + (p.y - depart.p.y) * Tg.n.y;     // perpendiculaire aux tangentes
      const du = (p.x - depart.p.x) * Tg.u.x + (p.y - depart.p.y) * Tg.u.y;     // le long des tangentes
      if (prise === 'd2') { S.d2 = depart.d2 + dn / dE; aimanter('d2', dE); }
      if (prise === 'perp') S.tA = depart.tA + du / Math.abs(dE);
      if (prise === 'd3') { S.d3 = depart.d3 + dn / dE; aimanter('d3', dE); }
      rendu();
    }
    // aimantation : à 6 px de la bonne position pour la parallèle, à 8 px du milieu pour la 3e droite
    function aimanter(cle, dE) {
      if (!o.aimant) return;
      const cible = cle === 'd2' ? 1 : 0.5, seuil = cle === 'd2' ? 6 : 8;
      if (Math.abs((S[cle] - cible) * dE) < seuil) S[cle] = cible;
    }
    function finir() {
      const q = prise; prise = null;
      if (q === 't1') poserT1();
      if (q === 'd3') verifierD3();
    }
    glisser(Cb, Cb.svg, commencer, deplacer, finir);

    // ---------- étapes ----------
    function poserT1() {
      const G = geom(), v = S.v1essai;
      const angle = Math.atan(Math.abs(G.df(v)) * G.g.ky / G.g.kx) * 180 / Math.PI;   // inclinaison à l'écran
      const ret = R('retour');
      if (angle > 80) { S.v1essai = null; rendu(); retour(ret, false, ' Tu es dans le saut de pH' + NB + ': pose la tangente sur l’arrondi, juste avant le saut.'); return; }
      if (Math.abs(v - G.vJ) > 3.5 || angle < 12) { S.v1essai = null; rendu(); retour(ret, false, ' Rapproche-toi du saut' + NB + ': la tangente doit toucher l’arrondi, là où la courbe se courbe.'); return; }
      ret.innerHTML = '';
      S.v1 = v; S.v1essai = null; S.d2 = 1.45;
      aller(1);
    }
    function validerD2() {
      const G = geom(), Tg = droiteT1(G, S.v1), dE = autreTangente(G, Tg).dEtoile;
      const ecart = (S.d2 - 1) * Math.abs(dE);   // > 0 : trop loin ; < 0 : coupe la courbe
      const ret = R('retour');
      if (Math.abs(ecart) <= 3) {
        S.d2 = 1; ret.innerHTML = '';
        const g = G.g, J = { x: g.X(G.vJ), y: g.Y(G.f(G.vJ)) };   // la perpendiculaire passe d'abord près du saut
        S.tA = ((J.x - Tg.P.x) * Tg.u.x + (J.y - Tg.P.y) * Tg.u.y) / Math.abs(dE);
        aller(2); return;
      }
      retour(ret, false, ecart < 0 ? ' Elle coupe la courbe' + NB + ': éloigne-la.' : ' Elle ne touche pas la courbe' + NB + ': rapproche-la.');
    }
    function verifierD3() {
      const G = geom(), Tg = droiteT1(G, S.v1), A = autreTangente(G, Tg), dE = A.dEtoile;
      const ret = R('retour');
      if (Math.abs((S.d3 - 0.5) * dE) <= 3) {
        S.d3 = 0.5; ret.innerHTML = '';
        // E : intersection de la 3e droite avec la courbe, entre les deux points de contact
        const a = Math.min(S.v1, A.v2), b = Math.max(S.v1, A.v2), cible = dE / 2;
        let vE = null, prev = A.dist(a) - cible;
        for (let v = a + 0.005; v <= b; v += 0.005) { const s = A.dist(v) - cible; if (Math.sign(s) !== Math.sign(prev)) { vE = v; break; } prev = s; }
        S.E = vE != null ? vE : G.vJ;
        aller(4);
      } else retour(ret, false, ' Amène-la jusqu’au milieu de la perpendiculaire (le point marqué).');
    }
    function effacer() { Object.assign(S, { v1: null, v1essai: null, d2: null, tA: null, d3: null, E: null }); R('saisie').innerHTML = ''; R('retour').innerHTML = ''; aller(0); }
    function aller(n) {
      etape = n;
      Cb.actif(n <= 3);
      const cons = R('consigne');
      cons.innerHTML = `<b>${n + 1}.</b> ${CONSIGNES[n]}`;
      P.querySelectorAll('.ttr-deroule li').forEach((li, i) => { li.className = i < n ? 'fait' : i === n ? 'ici' : ''; });
      const bt = R('boutons');
      bt.innerHTML = '';
      const ajouter = (txt, cls, f) => { const b = document.createElement('button'); b.type = 'button'; b.className = cls; b.innerHTML = txt; b.addEventListener('click', f); bt.appendChild(b); return b; };
      if (o.deplacement === 'fleches' && n >= 1 && n <= 3) fleches(bt, n);
      if (n === 1) ajouter('Valider la position', 'btn-primary ttr-btn', validerD2);
      if (n === 2) ajouter('Continuer →', 'btn-primary ttr-btn', () => { S.d3 = 0.12; aller(3); });
      if (n >= 1) ajouter('Reprendre la 1re tangente', 'btn-small', effacer);
      if (n === 4) saisieVeq(R('saisie'), {
        cible: () => S.E,
        bravo: () => `E a pour abscisse V<sub>eq</sub> ≈ ${fmt(S.E, 1)} mL.`,
        diag: () => 'Lis l’abscisse du point E, au pied du trait en pointillés (au dixième de mL).',
        fini: v => o.fini && o.fini(v),
      });
      rendu();
      defiler(cons);
    }
    // boutons fléchés (variante « fleches ») : un pixel par appui, en continu si on reste appuyé
    function fleches(bt, n) {
      const d = document.createElement('span');
      d.className = 'ttr-fleches';
      const G = geom(), Tg = droiteT1(G, S.v1), dE = autreTangente(G, Tg).dEtoile;
      const cle = n === 1 ? 'd2' : n === 3 ? 'd3' : 'tA';
      (n === 2 ? [['◀', -1], ['▶', 1]] : [['▲', -1], ['▼', 1]]).forEach(([lib, s]) => {
        const b = document.createElement('button');
        b.type = 'button'; b.className = 'btn-secondary'; b.textContent = lib;
        b.setAttribute('aria-label', n === 2 ? (s < 0 ? 'Vers la gauche' : 'Vers la droite') : (s < 0 ? 'Vers le haut' : 'Vers le bas'));
        let rep = null, t0 = 0, attente = null;
        const pas1 = () => {
          if (cle === 'tA') S.tA += s * Math.sign(Tg.u.x || 1) * 2 / Math.abs(dE);
          else { const avant = S[cle]; S[cle] += s * (Math.sign(Tg.n.y) || 1) / dE; if (avant !== (cle === 'd2' ? 1 : 0.5)) aimanter(cle, dE); }
          rendu();
        };
        const boucle = () => { const k = Date.now() - t0 > 1200 ? 3 : 1; for (let i = 0; i < k; i++) pas1(); rep = setTimeout(boucle, 45); };
        b.addEventListener('pointerdown', ev => { ev.preventDefault(); pas1(); t0 = Date.now(); attente = setTimeout(boucle, 320); });
        const stop = () => { clearTimeout(attente); if (rep) clearTimeout(rep); if (rep !== null || t0) { rep = null; t0 = 0; if (cle === 'd3') verifierD3(); } };
        ['pointerup', 'pointerleave', 'pointercancel'].forEach(t => b.addEventListener(t, stop));
        b.addEventListener('click', ev => { if (ev.detail === 0) { pas1(); if (cle === 'd3') verifierD3(); } });
        d.appendChild(b);
      });
      bt.appendChild(d);
    }
    aller(0);
    // pour les tests automatiques : état et géométrie
    Cb.el.__ttr = { S, etape: () => etape, info() { const G = geom(), Tg = droiteT1(G, S.v1 != null ? S.v1 : G.vJ - 1), A = autreTangente(G, Tg); return { Tg, dE: A.dEtoile, vJ: G.vJ, X: G.g.X, Y: G.g.Y, f: G.f }; } };
    return { effacer };
  }

  /* ============================================================
     Courbe dérivée : extrémum (minimum ici, le pH diminue)
     o = { pointer: 'toucher' | 'reticule', panneau, fini(veq) }
     ============================================================ */
  function deriveeOutil(Cb, o) {
    o = Object.assign({ pointer: 'reticule' }, o || {});
    const P = o.panneau, nomY = Cb.y.court || Cb.y.nom;
    P.innerHTML = `<p class="ttr-consigne" data-r="consigne"><b>1.</b> Trace la dérivée d${nomY}/dV, calculée comme dans Regressi.</p>
      <div class="ttr-actions" data-r="boutons"><button type="button" class="btn-primary ttr-btn" data-r="tracer">Tracer la dérivée d${nomY}/dV</button></div>
      <div data-r="retour"></div><div data-r="saisie"></div><p class="ttr-petit" data-r="remarque" hidden></p>`;
    const R = n => P.querySelector(`[data-r="${n}"]`);
    let etape = 0, vTrait = null, kMin = -1;
    function rendu() {
      const cD = Cb.couche('dessus'), cO = Cb.couche('outils');
      if (!cD) return;
      cO.innerHTML = ''; cD.querySelectorAll('[data-t]').forEach(x => x.remove());
      if (vTrait == null) return;
      const g = Cb.geo(), x = g.X(vTrait), yb = (g.haut[1] || g.haut[0]).y0;
      Cb.mk('line', { class: 'ttr-lecture', x1: x, x2: x, y1: g.haut[0].y1, y2: yb }, cO);
      if (o.pointer === 'reticule') {
        // réticule à glisser, lecture de V (comme le réticule libre de Regressi)
        const gr = Cb.mk('g', { 'data-t': 1, 'data-poignee': 'ret' }, cD);
        Cb.mk('rect', { class: 'ttr-poignee-zone', x: x - 22, y: g.haut[0].y1, width: 44, height: yb - g.haut[0].y1 }, gr);
        Cb.mk('circle', { class: 'ttr-poignee', cx: x, cy: yb - 14, r: 9 }, gr);
        const lx = Math.min(x + 10, g.x1 - 120);
        Cb.mk('rect', { class: 'ttr-bulle-fond', x: lx, y: g.haut[0].y1 + 4, width: 112, height: 22, rx: 6, 'data-t': 1 }, cD);
        Cb.mk('text', { class: 'ttr-bulle-txt', x: lx + 8, y: g.haut[0].y1 + 19, 'data-t': 1 }, cD).textContent = `V = ${fmt(vTrait, 2)} mL`;
      } else if (kMin >= 0) {
        const d = Cb.donnees(), k = d.V.indexOf(vTrait);
        if (k >= 0 && g.Yd) Cb.mk('circle', { class: 'ttr-E', cx: x, cy: g.Yd(d.D[k]), r: 5, 'data-t': 1 }, cD);
      }
    }
    Cb.surRedessin(rendu);
    let saisie = null;
    const vMin = () => Cb.donnees().V[kMin];
    function ouvrirSaisie() {
      if (saisie) return;
      saisie = saisieVeq(R('saisie'), {
        cible: vMin,
        bravo: () => `Le minimum de la dérivée est à V = ${fmt(vMin())} mL.`,
        diag: v => {
          const d = Cb.donnees(), i = d.V.findIndex(x => Math.abs(x - v) < 0.15);
          return i >= 0 && d.D[i] > 0 && Math.abs(v - vMin()) > 0.8
            ? `Ce point n’est pas un minimum${NB}: ici la dérivée est négative, cherche son <b>minimum</b>.`
            : 'Lis l’abscisse du minimum de la dérivée (au dixième de mL).';
        },
        fini: v => {
          etape = 2; Cb.actif(false);
          const d = Cb.donnees();
          const pas = Math.min(d.V[kMin + 1] - d.V[kMin] || 99, d.V[kMin] - d.V[kMin - 1] || 99);
          const rq = R('remarque');
          rq.hidden = false;
          rq.innerHTML = `Remarque${NB}: la précision dépend du pas des mesures près du saut. Pas de 1 mL${NB}: V<sub>eq</sub> connu à ± 0,5 mL environ${NB}; pas de 0,2 mL${NB}: à ± 0,1 mL. Ici, le pas est de ${fmt(+pas.toFixed(1))} mL.`;
          o.fini && o.fini(v);
        },
      });
    }
    function tracer() {
      Cb.afficherDerivee(true);
      const d = Cb.donnees();
      kMin = T.outils.extremum(d.V, d.D, -1);
      etape = 1;
      R('boutons').innerHTML = '';
      Cb.actif(true);
      if (o.pointer === 'reticule') {
        vTrait = d.V[0] + (d.V[d.V.length - 1] - d.V[0]) * 0.25;
        R('consigne').innerHTML = `<b>2.</b> Fais glisser le réticule jusqu’à l’extrémum de la courbe dérivée, lis V et écris V<sub>eq</sub>.`;
        ouvrirSaisie();
      } else R('consigne').innerHTML = `<b>2.</b> Touche l’extrémum de la courbe dérivée.`;
      rendu();
      defiler(R('consigne'));
    }
    R('tracer').addEventListener('click', tracer);
    glisser(Cb, Cb.svg, () => etape === 1, p => {
      if (o.pointer !== 'reticule') return;
      const g = Cb.geo(), d = Cb.donnees();
      vTrait = Math.max(d.V[0], Math.min(d.V[d.V.length - 1], g.Xi(p.x)));
      rendu();
    }, p => {
      const g = Cb.geo(), d = Cb.donnees();
      if (o.pointer === 'reticule') { vTrait = Math.max(d.V[0], Math.min(d.V[d.V.length - 1], g.Xi(p.x))); rendu(); return; }
      const v = g.Xi(p.x);
      let k = 0; d.V.forEach((x, i) => { if (Math.abs(x - v) < Math.abs(d.V[k] - v)) k = i; });
      vTrait = d.V[k];
      rendu();
      const ret = R('retour');
      if (k === kMin) {
        ret.innerHTML = '';
        R('consigne').innerHTML = `<b>3.</b> Le trait passe par le minimum de la dérivée. Lis V sur l’axe et écris V<sub>eq</sub>.`;
        ouvrirSaisie();
      } else retour(ret, false, ` Le volume équivalent est à l’extrémum de la dérivée${NB}: ici le pH diminue, la dérivée est négative, cherche son <b>minimum</b>.`);
    });
    return { tracer, vMin: () => (kMin >= 0 ? vMin() : null) };
  }

  Object.assign(T, { verrerie, montage, courbe, tableau, regressi, creer, tangentes, deriveeOutil, sondePH,
    ui: { retour, champ, lire, defiler, svgTexte } });
})();
