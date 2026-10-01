/* ============================================================
   Outils de l'application « Équilibrer une réaction »
     ER.analyser      formule brute → nombre de chaque atome
                      (indices, parenthèses : Cu(OH)2, CH2=C(CH3)2…)
     ER.formuleHTML   formule avec indices en <sub>
     ER.molecule      dessin SVG d'une molécule en boules colorées
     ER.boules        atomes d'une espèce, en boules regroupées par molécule
     ER.selecteur     sélecteur de nombre : flèche +1 au-dessus, −1 au-dessous
     ER.Reaction      réaction interactive (sélecteurs, formules, dessins)
     ER.verifier      réaction équilibrée ? plus petits entiers ?
     ER.calculHTML    calcul détaillé du nombre d'atomes (explications)
     ER.Comptage      compter les atomes d'une espèce (modules 1 et 2)
     ER.indice        indice pour équilibrer (premier élément non conservé)
     ER.interrupteur  interrupteur « Afficher les molécules et les atomes »
     ER.entrainement  entraînement noté sur 20 (modules 3 et 4)
     ER.menu          bandeau et menu communs aux modules
     ER.confettis     pluie de confettis (sans-faute)
   ============================================================ */
(function () {
  'use strict';

  /* ---------- Éléments : couleur de la boule (code couleur des modèles moléculaires),
     rayon (px) et couleur du symbole écrit dans la boule ---------- */
  const ELEMENTS = {
    H:  { c: '#f4f3ef', r: 8,  t: '#55585f', bord: '#b3afa6' },
    C:  { c: '#33363d', r: 11, t: '#ffffff' },
    O:  { c: '#e0352b', r: 11, t: '#ffffff' },
    N:  { c: '#3b5bdb', r: 11, t: '#ffffff' },
    Cl: { c: '#2f9e44', r: 12, t: '#ffffff' },
    S:  { c: '#f2c21b', r: 12, t: '#16181d' },
    Na: { c: '#7b4fc9', r: 12, t: '#ffffff' },
    K:  { c: '#9c36b5', r: 13, t: '#ffffff' },
    Li: { c: '#b197fc', r: 11, t: '#16181d' },
    Mg: { c: '#66a80f', r: 12, t: '#ffffff' },
    Ca: { c: '#868e96', r: 13, t: '#ffffff' },
    Al: { c: '#a5a1b8', r: 12, t: '#16181d' },
    Fe: { c: '#c8641e', r: 12, t: '#ffffff' },
    Cu: { c: '#b5651d', r: 12, t: '#ffffff' },
    Zn: { c: '#748ffc', r: 12, t: '#ffffff' },
    Ag: { c: '#ced4da', r: 12, t: '#16181d' },
    Pb: { c: '#495057', r: 13, t: '#ffffff' },
    P:  { c: '#f76707', r: 12, t: '#ffffff' },
    Si: { c: '#d2b48c', r: 12, t: '#16181d' },
    Br: { c: '#a61e4d', r: 12, t: '#ffffff' },
    I:  { c: '#862e9c', r: 13, t: '#ffffff' },
    F:  { c: '#8ce99a', r: 10, t: '#16181d' },
  };
  const elt = s => ELEMENTS[s] || { c: '#adb5bd', r: 12, t: '#16181d' };

  /* ============================================================
     ANALYSE D'UNE FORMULE
     Un indice porte sur ce qui est juste avant lui : un atome,
     ou toute la parenthèse qui le précède.
     Renvoie [{ el: 'H', n: 2 }, …] dans l'ordre d'apparition.
     ============================================================ */
  function analyser(formule) {
    const f = formule.replace(/[=≡·\-\s]/g, '');      // liaisons des formules semi-développées
    let i = 0;
    const nombre = () => {
      let s = '';
      while (i < f.length && /\d/.test(f[i])) s += f[i++];
      return s ? parseInt(s, 10) : 1;
    };
    function groupe() {
      const res = [];
      const ajouter = (el, n) => {
        const t = res.find(a => a.el === el);
        if (t) t.n += n; else res.push({ el, n });
      };
      while (i < f.length && f[i] !== ')') {
        if (f[i] === '(') {
          i++;
          const sous = groupe();
          i++;                                        // parenthèse fermante
          const n = nombre();
          sous.forEach(a => ajouter(a.el, a.n * n));
        } else {
          const m = /^[A-Z][a-z]?/.exec(f.slice(i));
          if (!m) { i++; continue; }
          i += m[0].length;
          ajouter(m[0], nombre());
        }
      }
      return res;
    }
    return groupe();
  }
  // nombre d'atomes de l'élément el dans une molécule
  const nb = (formule, el) => (analyser(formule).find(a => a.el === el) || { n: 0 }).n;

  // Formule avec indices : CH4 → CH<sub>4</sub>
  const formuleHTML = f => f.replace(/(\d+)/g, '<sub>$1</sub>');

  /* ============================================================
     DESSIN D'UNE MOLÉCULE
     La structure est décrite par une chaîne de type SMILES avec
     tous les atomes : « C(H)(H)(H)H » (méthane), « O(H)H » (eau),
     « C(H)(H)(H)C(H)(H)O(H) » (éthanol)… Une parenthèse ouvre une
     ramification. Sans description, la structure est déduite de
     la formule (atome central entouré, ou amas compact).
     ============================================================ */
  const STRUCTURES = {
    H2: 'HH', O2: 'OO', N2: 'NN', Cl2: 'ClCl', Br2: 'BrBr', I2: 'II', F2: 'FF',
    H2O: 'O(H)H', H2O2: 'HOOH', H2S: 'S(H)H',
    CO2: 'C(O)O', CO: 'CO', SO2: 'S(O)O', SO3: 'S(O)(O)O', NO: 'NO', NO2: 'N(O)O', N2O4: 'N(O)(O)N(O)O', O3: 'O(O)O',
    CH4: 'C(H)(H)(H)H', NH3: 'N(H)(H)H', HCl: 'HCl', HBr: 'HBr', HI: 'HI', HF: 'HF',
    C2H6: 'C(H)(H)(H)C(H)(H)H', C3H8: 'C(H)(H)(H)C(H)(H)C(H)(H)H',
    C4H10: 'C(H)(H)(H)C(H)(H)C(H)(H)C(H)(H)H',
    C2H4: 'C(H)(H)C(H)H', C2H2: 'C(H)C(H)', C3H6: 'C(H)(H)C(H)C(H)(H)H',
    CH4O: 'C(H)(H)(H)O(H)', CH3OH: 'C(H)(H)(H)O(H)',
    C2H6O: 'C(H)(H)(H)C(H)(H)O(H)', C2H5OH: 'C(H)(H)(H)C(H)(H)O(H)',
    NaOH: 'NaOH', KOH: 'KOH', LiOH: 'LiOH', HCN: 'C(H)N',
    CCl4: 'C(Cl)(Cl)(Cl)Cl', SiCl4: 'Si(Cl)(Cl)(Cl)Cl', CH3Cl: 'C(H)(H)(H)Cl', CH2Cl2: 'C(H)(H)(Cl)Cl',
    'Cu(OH)2': 'Cu(O(H))O(H)', 'Ca(OH)2': 'Ca(O(H))O(H)', 'Mg(OH)2': 'Mg(O(H))O(H)', 'Zn(OH)2': 'Zn(O(H))O(H)',
    'Fe(OH)2': 'Fe(O(H))O(H)', 'Fe(OH)3': 'Fe(O(H))(O(H))O(H)', 'Al(OH)3': 'Al(O(H))(O(H))O(H)',
    H2SO4: 'S(O)(O)(OH)OH', H3PO4: 'P(O)(OH)(OH)OH', Na2SO4: 'S(O)(O)(ONa)ONa',
    CaCO3: 'CaOC(O)O', Na2CO3: 'NaOC(O)ONa', NaHCO3: 'NaOC(O)OH', KClO3: 'KOCl(O)O',
    KNO3: 'KON(O)O', AgNO3: 'AgON(O)O', HNO3: 'HON(O)O',
    Fe2O3: 'Fe(O)OFeO', Al2O3: 'Al(O)OAlO', Na2O: 'NaONa', Li2O: 'LiOLi', FeS2: 'SFeS',
    'CH2=C(CH3)2': 'C(H)(H)C(C(H)(H)H)C(H)(H)H',
    'CH3-CH(CH3)-CH3': 'C(H)(H)(H)C(H)(C(H)(H)H)C(H)(H)H',
    'CH3-CH2-OH': 'C(H)(H)(H)C(H)(H)O(H)',
  };
  const COUDES = ['O', 'S', 'N'];                 // atome à deux voisins : molécule coudée (H2O, SO2…)

  // Lit une description « SMILES » : liste d'atomes et de liaisons
  function lireStructure(s) {
    const atomes = [], liaisons = [], pile = [];
    let courant = -1, i = 0;
    while (i < s.length) {
      const ch = s[i];
      if (ch === '(') { pile.push(courant); i++; continue; }
      if (ch === ')') { courant = pile.pop(); i++; continue; }
      const m = /^[A-Z][a-z]?/.exec(s.slice(i));
      if (!m) { i++; continue; }
      atomes.push(m[0]);
      const k = atomes.length - 1;
      if (courant >= 0) liaisons.push([courant, k]);
      courant = k;
      i += m[0].length;
    }
    return { atomes, liaisons };
  }

  // Structure déduite de la formule quand elle n'est pas décrite
  function structureAuto(formule) {
    const comp = analyser(formule);
    const total = comp.reduce((s, a) => s + a.n, 0);
    if (total <= 2) return comp.map(a => a.el.repeat(a.n)).join('');
    // M(XY)n : atome central et groupes identiques (hydroxydes…)
    const m = /^([A-Z][a-z]?)\(([A-Za-z0-9]+)\)(\d+)$/.exec(formule);
    if (m) {
      // groupe : premier atome lié à tous les autres (OH → O–H, NO3 → N entouré de 3 O)
      const g = [];
      analyser(m[2]).forEach(a => { for (let k = 0; k < a.n; k++) g.push(a.el); });
      const branche = g[0] + g.slice(1).map((e, j) => j < g.length - 2 ? '(' + e + ')' : e).join('');
      return m[1] + ('(' + branche + ')').repeat(+m[3] - 1) + branche;
    }
    // un seul atome d'un élément (autre que H) : atome central entouré des autres
    const centraux = comp.filter(a => a.n === 1 && a.el !== 'H');
    if (centraux.length === 1 && total <= 7) {
      const autres = [];
      comp.forEach(a => { if (a !== centraux[0]) for (let k = 0; k < a.n; k++) autres.push(a.el); });
      return centraux[0].el + autres.slice(0, -1).map(e => '(' + e + ')').join('') + autres[autres.length - 1];
    }
    return null;                                    // amas compact
  }

  // Position des atomes (en px) à partir de la structure
  function placer(st) {
    const n = st.atomes.length;
    const vois = st.atomes.map(() => []);
    st.liaisons.forEach(([a, b]) => { vois[a].push(b); vois[b].push(a); });
    const lourd = k => st.atomes[k] !== 'H';
    const dist = (a, b) => (elt(st.atomes[a]).r + elt(st.atomes[b]).r) * 0.8;
    // racine : le centre de la molécule (atome le moins éloigné de tous les autres),
    // puis celui qui a le plus de voisins en cas d'égalité
    const excentricite = k => {
      const d = new Array(n).fill(-1), f = [k];
      d[k] = 0;
      while (f.length) { const a = f.shift(); vois[a].forEach(b => { if (d[b] < 0) { d[b] = d[a] + 1; f.push(b); } }); }
      return Math.max(...d);
    };
    const ex = st.atomes.map((_, k) => excentricite(k));
    let racine = 0;
    for (let k = 1; k < n; k++) {
      if (ex[k] < ex[racine] || (ex[k] === ex[racine] && vois[k].length > vois[racine].length)) racine = k;
    }
    const pos = new Array(n);
    pos[racine] = { x: 0, y: 0 };
    const deg = Math.PI / 180;
    const trier = l => l.slice().sort((a, b) => lourd(b) - lourd(a));
    // directions des voisins de la racine
    const v0 = trier(vois[racine]), k0 = v0.length;
    let dirs;
    if (k0 === 2 && COUDES.includes(st.atomes[racine])) dirs = [90 + 52, 90 - 52];
    else if (k0 === 2) dirs = [0, 180];
    else if (k0 === 4) dirs = [0, 180, 90, 270];
    else dirs = v0.map((_, j) => j * 360 / k0);
    const file = [];
    v0.forEach((v, j) => file.push({ k: v, p: racine, d: dirs[j], prof: 1 }));
    while (file.length) {
      const { k, p, d, prof } = file.shift();
      const L = dist(k, p);
      pos[k] = { x: pos[p].x + L * Math.cos(d * deg), y: pos[p].y + L * Math.sin(d * deg) };
      const enf = trier(vois[k].filter(v => v !== p)), m = enf.length;
      let ds = [];
      if (m === 1) ds = [COUDES.includes(st.atomes[k]) ? d + (prof % 2 ? -60 : 60) : d];
      else if (m === 2) ds = [d - 60, d + 60];
      else if (m === 3 && enf.every(v => !lourd(v)) && vois[p].filter(lourd).length >= 3) ds = [d, d - 62, d + 62];   // CH3 d'une ramification : en éventail
      else if (m === 3) ds = [d, d - 90, d + 90];
      else if (m > 3) ds = enf.map((_, j) => d - 90 + j * 180 / (m - 1));
      enf.forEach((v, j) => file.push({ k: v, p: k, d: ds[j], prof: prof + 1 }));
    }
    return pos;
  }

  // Amas compact (réseau hexagonal) quand la structure n'est pas connue
  function amas(formule) {
    const atomes = [];
    analyser(formule).slice().sort((a, b) => (a.el === 'H') - (b.el === 'H'))
      .forEach(a => { for (let k = 0; k < a.n; k++) atomes.push(a.el); });
    const R = 18, sites = [];
    for (let q = -4; q <= 4; q++) for (let r = -4; r <= 4; r++) {
      const x = R * (q + r / 2), y = R * r * Math.sqrt(3) / 2;
      sites.push({ x, y, d: Math.hypot(x, y * 1.15) + q * 0.01 + r * 0.001 });
    }
    sites.sort((a, b) => a.d - b.d);
    return { atomes, pos: atomes.map((_, k) => ({ x: sites[k].x, y: sites[k].y })) };
  }

  // Une boule : disque coloré, reflet, symbole de l'élément
  function boule(el, x, y, r) {
    const e = elt(el), f = el.length > 1 ? r * 0.78 : r * 0.92;
    return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}" fill="${e.c}" stroke="${e.bord || 'rgba(0,0,0,.28)'}" stroke-width="1"/>` +
      `<circle cx="${(x - r * 0.35).toFixed(1)}" cy="${(y - r * 0.38).toFixed(1)}" r="${(r * 0.3).toFixed(1)}" fill="#fff" opacity=".35"/>` +
      `<text x="${x.toFixed(1)}" y="${(y + f * 0.36).toFixed(1)}" font-size="${f.toFixed(1)}" fill="${e.t}" text-anchor="middle" font-weight="700">${el}</text>`;
  }

  const cacheMol = {};
  function molecule(formule) {
    if (cacheMol[formule]) return cacheMol[formule];
    let atomes, pos;
    const desc = STRUCTURES[formule] || structureAuto(formule);
    if (desc) { const st = lireStructure(desc); atomes = st.atomes; pos = placer(st); }
    else ({ atomes, pos } = amas(formule));
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    atomes.forEach((a, k) => {
      const r = elt(a).r;
      x0 = Math.min(x0, pos[k].x - r); x1 = Math.max(x1, pos[k].x + r);
      y0 = Math.min(y0, pos[k].y - r); y1 = Math.max(y1, pos[k].y + r);
    });
    const m = 1.5, w = x1 - x0 + 2 * m, h = y1 - y0 + 2 * m;
    let s = '';
    // les petits atomes (H) d'abord : le symbole des atomes plus gros reste lisible
    atomes.map((a, k) => k).sort((a, b) => elt(atomes[a]).r - elt(atomes[b]).r)
      .forEach(k => { s += boule(atomes[k], pos[k].x - x0 + m, pos[k].y - y0 + m, elt(atomes[k]).r); });
    // taille affichée proportionnelle à --er-k (plus petite sur smartphone, voir er.css)
    return (cacheMol[formule] = `<svg class="er-mol" viewBox="0 0 ${w.toFixed(1)} ${h.toFixed(1)}" style="width:calc(var(--er-k) * ${w.toFixed(1)}px);height:calc(var(--er-k) * ${h.toFixed(1)}px)" role="img" aria-label="molécule ${formule}">${s}</svg>`);
  }

  /* ---------- Atomes d'une espèce : une ligne par élément,
     une petite grappe de boules par molécule (2 H2O → ●● ●●) ---------- */
  function boules(formule, coef) {
    return analyser(formule).map(a => {
      const b = bouleHTML(a.el);
      const grappe = `<span class="er-grappe">${b.repeat(a.n)}</span>`;
      return `<div class="er-ligne-at">${grappe.repeat(coef)}</div>`;
    }).join('');
  }

  /* ============================================================
     SÉLECTEUR DE NOMBRE
     Flèche du haut : +1, flèche du bas : −1. Valeur entière ≥ min.
     Un appui long fait défiler les valeurs (de plus en plus vite).
     opts : { valeur, min, max, label, onChange(v) }
     ============================================================ */
  const CHEVRON_HAUT = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 15l7-7 7 7" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const CHEVRON_BAS = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 9l7 7 7-7" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  function selecteur(opts) {
    const min = opts.min == null ? 1 : opts.min, max = opts.max == null ? 30 : opts.max;
    let v = opts.valeur == null ? min : opts.valeur, actif = true;
    const el = document.createElement('div');
    el.className = 'er-sel';
    el.innerHTML = `<button type="button" class="er-sel-plus" aria-label="Augmenter${opts.label ? ' ' + opts.label : ''} de 1">${CHEVRON_HAUT}</button>` +
      `<output class="er-sel-val" aria-live="polite"></output>` +
      `<button type="button" class="er-sel-moins" aria-label="Diminuer${opts.label ? ' ' + opts.label : ''} de 1">${CHEVRON_BAS}</button>`;
    const bPlus = el.querySelector('.er-sel-plus'), bMoins = el.querySelector('.er-sel-moins'), out = el.querySelector('output');
    function afficher() {
      out.textContent = v;
      bPlus.disabled = !actif || v >= max;
      bMoins.disabled = !actif || v <= min;
    }
    function changer(dv) {
      const nv = Math.min(max, Math.max(min, v + dv));
      if (nv === v || !actif) return false;
      v = nv; afficher();
      if (opts.onChange) opts.onChange(v);
      return true;
    }
    appuiRepete(bPlus, () => changer(1));
    appuiRepete(bMoins, () => changer(-1));
    afficher();
    return {
      el,
      get valeur() { return v; },
      fixer(nv) { v = Math.min(max, Math.max(min, nv)); afficher(); },
      activer(b) { actif = b; el.classList.toggle('er-sel-off', !b); afficher(); },
    };
  }

  // Appui sur un bouton : une action au relâchement (comme un clic), ou une
  // répétition si on garde le doigt / la souris appuyé. Un défilement de la page
  // commencé sur le bouton (pointercancel) ne modifie pas la valeur.
  function appuiRepete(btn, action) {
    let t1 = null, t2 = null, repete = false, id = null;
    const stop = () => { clearTimeout(t1); clearInterval(t2); t1 = t2 = null; id = null; btn.classList.remove('appui'); };
    btn.addEventListener('pointerdown', e => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      if (btn.disabled) return;
      stop();
      id = e.pointerId; repete = false;
      btn.classList.add('appui');
      try { btn.setPointerCapture(e.pointerId); } catch (_) { /* rien */ }
      t1 = setTimeout(() => {
        repete = true;
        let n = 0;
        if (!action()) return stop();
        t2 = setInterval(() => {
          if (!action()) return stop();
          if (++n === 8) { clearInterval(t2); t2 = setInterval(() => { if (!action()) stop(); }, 55); }
        }, 140);
      }, 450);
    });
    btn.addEventListener('pointerup', e => {
      if (e.pointerId !== id) return;
      const r = btn.getBoundingClientRect();
      const dedans = e.clientX >= r.left - 8 && e.clientX <= r.right + 8 && e.clientY >= r.top - 8 && e.clientY <= r.bottom + 8;
      if (!repete && dedans) action();
      stop();
    });
    btn.addEventListener('pointercancel', stop);
    btn.addEventListener('lostpointercapture', () => { if (id !== null) stop(); });
    // clavier (Entrée, Espace) : le clic est déclenché sans pointeur (detail = 0)
    btn.addEventListener('click', e => { if (e.detail === 0) action(); });
    btn.addEventListener('contextmenu', e => e.preventDefault());
  }

  /* ============================================================
     RÉACTION INTERACTIVE
     cfg = {
       reactifs: ['CH4', 'O2'], produits: ['CO2', 'H2O'],
       coefs: [1, 1, 1, 1],        valeurs de départ
       max: 30,
       comptes: true,              nombre de chaque atome écrit sous la formule (« 4 H »)
       detail: false,              écrit aussi le calcul (« 2 × 2 = 4 H »)
       dessins: true,              molécules et atomes en boules sous la formule
       selecteurs: true,           false : nombres fixes, sans flèches (le nombre 1 n'est pas écrit)
       onChange(coefs)
     }
     produits peut être vide : une ou plusieurs espèces seules, sans flèche.
     ============================================================ */
  function Reaction(el, cfg) {
    this.el = el;
    this.cfg = Object.assign({ comptes: false, detail: false, dessins: false, max: 30, selecteurs: true }, cfg);
    this.especes = cfg.reactifs.concat(cfg.produits);
    this.coefs = (cfg.coefs || this.especes.map(() => 1)).slice();
    this.construire();
  }

  Reaction.prototype.construire = function () {
    const moi = this, c = this.cfg, nR = c.reactifs.length;
    this.el.innerHTML = '';
    this.el.classList.add('er-reaction');
    const membres = [document.createElement('div'), document.createElement('div')];
    membres.forEach(m => { m.className = 'er-membre'; });
    this.sels = []; this.zones = [];
    this.especes.forEach((f, k) => {
      // le signe « + » (ou la flèche) est groupé avec l'espèce qui le suit :
      // sur un écran étroit, il passe à la ligne avec elle
      const m = document.createElement('div');
      m.className = 'er-groupe';
      membres[k < nR ? 0 : 1].appendChild(m);
      if (k === nR) m.insertAdjacentHTML('beforeend', '<div class="er-op er-fleche">→</div>');
      else if (k !== 0) m.insertAdjacentHTML('beforeend', '<div class="er-op">+</div>');
      const b = document.createElement('div');
      b.className = 'er-espece';
      b.innerHTML = `<div class="er-tete"><span class="er-sel-place"></span><span class="er-formule">${formuleHTML(f)}</span></div>` +
        `<div class="er-comptes"></div><div class="er-dessin"></div>`;
      if (c.selecteurs) {
        const sel = selecteur({
          valeur: moi.coefs[k], min: 1, max: c.max, label: 'le nombre stœchiométrique de ' + f,
          onChange: v => { moi.coefs[k] = v; moi.majEspece(k); if (c.onChange) c.onChange(moi.coefs.slice()); },
        });
        b.querySelector('.er-sel-place').replaceWith(sel.el);
        moi.sels.push(sel);
      } else {
        b.classList.add('er-espece-fixe');
        b.querySelector('.er-sel-place').outerHTML = moi.coefs[k] > 1 ? `<span class="er-coef-fixe">${moi.coefs[k]}</span>` : '';
      }
      m.appendChild(b);
      moi.zones.push(b);
    });
    this.el.appendChild(membres[0]);
    if (c.produits.length) this.el.appendChild(membres[1]);
    this.especes.forEach((_, k) => moi.majEspece(k));
  };

  Reaction.prototype.majEspece = function (k) {
    const f = this.especes[k], coef = this.coefs[k], z = this.zones[k], c = this.cfg;
    const cpt = z.querySelector('.er-comptes'), des = z.querySelector('.er-dessin');
    cpt.classList.toggle('hidden', !c.comptes);
    if (c.comptes) {
      cpt.innerHTML = analyser(f).map(a => `<div class="er-compte" data-el="${a.el}">` +
        (c.detail ? `<span class="er-calc">${coef} × ${a.n} = </span>` : '') +
        `<b>${coef * a.n}</b>&nbsp;${a.el}</div>`).join('');
    }
    des.classList.toggle('hidden', !c.dessins);
    if (c.dessins) {
      des.innerHTML = `<div class="er-mols">${molecule(f).repeat(coef)}</div><div class="er-atomes">${boules(f, coef)}</div>`;
    }
  };

  Reaction.prototype.options = function (o) {
    Object.assign(this.cfg, o);
    this.especes.forEach((_, k) => this.majEspece(k));
  };
  Reaction.prototype.fixer = function (coefs) {
    this.coefs = coefs.slice();
    this.sels.forEach((s, k) => s.fixer(coefs[k]));
    this.especes.forEach((_, k) => this.majEspece(k));
  };
  Reaction.prototype.activer = function (b) { this.sels.forEach(s => s.activer(b)); };

  Reaction.prototype.verifier = function () { return verifier(this.cfg.reactifs, this.cfg.produits, this.coefs); };

  // Bilan : nombre de chaque atome côté réactifs et côté produits
  Reaction.prototype.bilan = function () { return bilan(this.cfg.reactifs, this.cfg.produits, this.coefs); };

  function bilan(reactifs, produits, coefs) {
    const ordre = [], R = {}, P = {};
    reactifs.concat(produits).forEach((f, k) => {
      analyser(f).forEach(a => {
        if (!ordre.includes(a.el)) ordre.push(a.el);
        const cote = k < reactifs.length ? R : P;
        cote[a.el] = (cote[a.el] || 0) + coefs[k] * a.n;
      });
    });
    return ordre.map(el => ({ el, r: R[el] || 0, p: P[el] || 0 }));
  }

  // Réaction équilibrée ? avec les plus petits entiers ? éléments non conservés
  const pgcd = (a, b) => (b ? pgcd(b, a % b) : a);
  function verifier(reactifs, produits, coefs) {
    const b = bilan(reactifs, produits, coefs);
    const faux = b.filter(e => e.r !== e.p).map(e => e.el);
    return { bilan: b, faux, equilibree: faux.length === 0, minimale: coefs.reduce(pgcd) === 1 };
  }

  // Tableau bilan : nombre de chaque atome dans les réactifs et dans les produits
  function bilanHTML(b, opts) {
    opts = opts || {};
    return `<table class="er-bilan"><thead><tr><th>Atomes</th><th>Réactifs</th><th>Produits</th><th></th></tr></thead><tbody>` +
      b.map(e => {
        const ok = e.r === e.p;
        return `<tr class="${ok ? 'ok' : 'ko'}"><td><span class="er-bilan-el">${opts.boule === false ? '' : bouleHTML(e.el)}${e.el}</span></td>` +
          `<td><b>${e.r}</b> ${e.el}</td><td><b>${e.p}</b> ${e.el}</td><td class="er-bilan-signe">${ok ? '✓' : '✗'}</td></tr>`;
      }).join('') + '</tbody></table>';
  }
  function bouleHTML(el) {
    const e = elt(el);
    return `<span class="er-at${el === 'H' ? ' er-at-h' : ''}${el.length > 1 ? ' er-at-2' : ''}" style="background:${e.c};color:${e.t}${e.bord ? ';box-shadow:inset 0 0 0 1px ' + e.bord : ''}">${el}</span>`;
  }

  // Écriture d'une équation : « CH4 + 2 O2 → CO2 + 2 H2O » (le nombre 1 n'est pas écrit)
  function equationHTML(reactifs, produits, coefs) {
    const t = (f, k) => (coefs[k] > 1 ? `<span class="er-eq-c">${coefs[k]}</span>&nbsp;` : '') + formuleHTML(f);
    return reactifs.map((f, k) => t(f, k)).join(' + ') + ' → ' + produits.map((f, k) => t(f, k + reactifs.length)).join(' + ');
  }

  // Tirage aléatoire sans remise
  function melanger(t) {
    const a = t.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }

  /* ============================================================
     DÉTAIL DU COMPTAGE (explications)
     Pour chaque élément : la liste des endroits où il apparaît,
     avec son indice et l'indice de la parenthèse qui l'entoure.
     Cu(OH)2 → O : [{ n: 1, m: 2, grp: '(OH)2' }]
     ============================================================ */
  function detailler(formule) {
    const f = formule.replace(/[=≡·\-\s]/g, '');
    const res = [];
    const ajouter = (el, t) => {
      let e = res.find(a => a.el === el);
      if (!e) res.push(e = { el, termes: [] });
      e.termes.push(t);
    };
    let i = 0;
    while (i < f.length) {
      if (f[i] === '(') {
        // parenthèse : on lit son contenu et l'indice qui la suit
        const fin = f.indexOf(')', i);
        const dedans = f.slice(i + 1, fin);
        let j = fin + 1, s = '';
        while (j < f.length && /\d/.test(f[j])) s += f[j++];
        const m = s ? +s : 1;
        analyser(dedans).forEach(a => ajouter(a.el, { n: a.n, m, grp: '(' + dedans + ')' + s }));
        i = j;
      } else {
        const mm = /^([A-Z][a-z]?)(\d*)/.exec(f.slice(i));
        if (!mm) { i++; continue; }
        ajouter(mm[1], { n: mm[2] ? +mm[2] : 1, m: 1 });
        i += mm[0].length;
      }
    }
    return res;
  }

  // Calcul écrit pour un élément : « 2 × (2 + 2 × 3) = 16 »
  function calculHTML(formule, coef, el) {
    const d = detailler(formule).find(a => a.el === el);
    if (!d) return '0';
    const par = d.termes.reduce((s, t) => s + t.n * t.m, 0);
    const termes = d.termes.map(t => (t.m > 1 ? `${t.m} × ${t.n}` : `${t.n}`));
    let expr = termes.join(' + ');
    const simple = termes.length === 1 && d.termes[0].m === 1;
    if (coef > 1) expr = `${coef} × ` + (simple ? expr : `(${expr})`);
    if (simple && coef === 1) return par === 1 ? 'pas d\'indice → 1' : `indice ${par} → ${par}`;
    return `${expr} = ${coef * par}`;
  }

  /* ============================================================
     ENTRAÎNEMENT NOTÉ (modules 3 et 4)
     opts = {
       app, badge, titre, intro,
       groupes: BANQUE.faciles,    sous-groupes de difficulté croissante
       aide: 5,                    nombre de questions avec l'interrupteur « dessins »
       suite: { href, label },     lien proposé à la fin
     }
     2 points si juste du premier coup, 1 point après au moins une erreur,
     0 point si la réponse est affichée. Note sur 20.
     ============================================================ */
  function entrainement(opts) {
    const app = opts.app, aide = opts.aide || 0;
    let questions = [], idx = 0, score = 0, recap = [], dessins = false;
    const total = () => questions.length * 2;

    function tirer() {
      questions = [];
      opts.groupes.forEach(g => { questions = questions.concat(melanger(g.reactions).slice(0, g.tirage)); });
    }
    function entete() {
      const pct = Math.round(idx / questions.length * 100);
      return `<div class="er-card">
          <span class="er-badge">${opts.badge}</span>
          <h2 class="er-titre">${opts.titre}</h2>
          <p class="er-meta">Question ${idx + 1}/${questions.length} · Score : <b data-a="score">${score} pt${score > 1 ? 's' : ''}</b></p>
          <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
        </div>`;
    }
    function intro() {
      app.innerHTML = `<div class="er-card">
          <span class="er-badge">${opts.badge}</span>
          <h2 class="er-titre">${opts.titre}</h2>
          ${opts.intro}
          <div class="cle" style="margin:14px 0">
            <p><b class="cle-titre">Barème</b> · 10 réactions, de difficulté croissante, notées sur 20 :</p>
            <ul class="er-liste">
              <li><b>2 points</b> si la réaction est équilibrée du premier coup ;</li>
              <li><b>1 point</b> si tu y arrives après au moins une erreur ;</li>
              <li><b>0 point</b> si tu affiches la réponse.</li>
            </ul>
          </div>
          <button type="button" class="btn-primary" data-a="go">Commencer →</button>
        </div>`;
      app.querySelector('[data-a="go"]').onclick = demarrer;
    }
    function demarrer() { tirer(); idx = 0; score = 0; recap = []; afficher(); }

    function afficher() {
      if (idx >= questions.length) return fin();
      const q = questions[idx], avecAide = idx < aide;
      let erreur = false, fini = false;
      app.innerHTML = entete() + `<div class="er-card" data-a="q">
          <p class="er-q-nom">${q.nom}</p>
          <p class="er-consigne">Équilibre la réaction en ajustant les nombres stœchiométriques.</p>
          ${avecAide ? '<div data-a="switch"></div>' : (aide && idx === aide ? `<p class="er-note">À partir de cette question, il n'y a plus d'aide dessinée : compte les atomes avec le calcul <b>nombre stœchiométrique × indice</b>.</p>` : '')}
          <div data-a="reaction"></div>
          <div data-a="retour"></div>
          <div class="er-actions" data-a="actions">
            <button type="button" class="btn-primary" data-a="valider">Valider</button>
            <button type="button" class="btn-secondary" data-a="reponse">Afficher la réponse</button>
          </div>
        </div>`;
      window.scrollTo(0, 0);
      const $ = a => app.querySelector(`[data-a="${a}"]`);
      const reaction = new Reaction($('reaction'), {
        reactifs: q.r, produits: q.p, dessins: avecAide && dessins,
        onChange: () => { if (!fini) $('retour').innerHTML = ''; },
      });
      if (avecAide) {
        $('switch').replaceWith(interrupteur(dessins, b => { dessins = b; reaction.options({ dessins }); },
          `aide pour les ${aide} premières questions`));
      }

      function terminer(points, html) {
        fini = true;
        reaction.activer(false);
        score += points;
        recap.push({ n: idx + 1, p: points });
        $('score').textContent = score + ' pt' + (score > 1 ? 's' : '');
        $('retour').innerHTML = html;
        const der = idx === questions.length - 1;
        $('actions').innerHTML = `<button type="button" class="btn-primary" data-a="suivant" disabled>${der ? 'Voir mon score →' : 'Question suivante →'}</button>`;
        // court délai : un double-clic sur « Valider » ne fait pas passer la question sans la lire
        setTimeout(() => { const b = $('suivant'); if (b) b.disabled = false; }, 450);
        $('suivant').onclick = () => { idx++; afficher(); };
      }

      $('valider').onclick = () => {
        if (fini) return;
        const v = reaction.verifier();
        const eq = equationHTML(q.r, q.p, reaction.coefs);
        if (v.equilibree && v.minimale) {
          const p = erreur ? 1 : 2;
          terminer(p, `<div class="callout-success er-retour"><p><b class="er-ok">${erreur ? 'C\'est juste !' : 'Bravo, juste du premier coup !'}</b> +${p} point${p > 1 ? 's' : ''}</p>
            <p class="er-eq">${eq}</p></div>`);
          return;
        }
        const premiere = !erreur;
        erreur = true;
        let msg;
        if (v.equilibree) {
          const g = reaction.coefs.reduce(pgcd);
          msg = `<p><b class="er-ko">La réaction est équilibrée, mais ce ne sont pas les plus petits nombres entiers possibles.</b></p>
            <p>Tous tes nombres stœchiométriques peuvent être divisés par ${g}.</p>`;
        } else {
          const liste = v.faux.map(e => `<b>${e}</b>`).join(', ').replace(/, ([^,]*)$/, ' et $1');
          msg = `<p><b class="er-ko">Pas encore équilibrée.</b> Les atomes ${v.faux.length > 1 ? 'des éléments' : 'de l\'élément'} ${liste} ne sont pas aussi nombreux dans les réactifs que dans les produits.</p>
            <p>Compte-les de chaque côté de la flèche : nombre stœchiométrique × indice.</p>`;
        }
        if (premiere) msg += `<p class="er-petit">Corrige ta réponse : cette question peut encore rapporter 1 point.</p>`;
        $('retour').innerHTML = `<div class="callout-danger er-retour">${msg}</div>`;
        $('reaction').classList.remove('er-secoue'); void $('reaction').offsetWidth; $('reaction').classList.add('er-secoue');
      };
      $('reponse').onclick = () => {
        if (fini) return;
        reaction.fixer(q.c);
        terminer(0, `<div class="callout er-retour"><p><b>Réponse :</b> 0 point pour cette question.</p>
          <p class="er-eq">${equationHTML(q.r, q.p, q.c)}</p></div>`);
      };
    }

    function fin() {
      const max = total(), pct = Math.round(score / max * 100);
      let msg;
      if (score === max) msg = 'Tu sais équilibrer ces réactions.';
      else if (pct >= 70) msg = 'Très bien ! Encore un peu d\'entraînement pour le sans-faute.';
      else if (pct >= 50) msg = 'Pas mal ! Recommence pour progresser : les réactions changent à chaque fois.';
      else msg = 'Continue à t\'entraîner. Tu peux revoir le module 1 pour la méthode.';
      app.innerHTML = `<div class="er-card er-fin">
          <span class="er-badge">${opts.badge}</span>
          <h2 class="er-titre">Entraînement terminé !</h2>
          ${score === max ? '<p class="er-trophee">🏆 Sans-faute !</p>' : ''}
          <div class="er-score">${score} / ${max}</div>
          <p class="er-score-pct">${pct} %</p>
          <p class="er-contexte">${msg}</p>
          <div class="er-recap">${recap.map(r => `<div class="${r.p === 2 ? 'ok' : r.p === 1 ? 'moyen' : 'ko'}">Q${r.n}<b>${r.p}/2</b></div>`).join('')}</div>
          <div class="er-actions" style="justify-content:center">
            <button type="button" class="btn-secondary" data-a="re">↺ Recommencer avec d'autres réactions</button>
            ${opts.suite ? `<a class="btn-primary" style="text-decoration:none" href="${opts.suite.href}">${opts.suite.label}</a>` : ''}
          </div>
        </div>`;
      app.querySelector('[data-a="re"]').onclick = demarrer;
      window.scrollTo(0, 0);
      if (score === max) confettis();
    }

    intro();
  }

  /* ============================================================
     INTERRUPTEUR « Afficher les molécules et les atomes »
     ============================================================ */
  function interrupteur(coche, onChange, sousTitre) {
    const l = document.createElement('label');
    l.className = 'er-switch-bar';
    l.innerHTML = `<span class="np-pref-label">Afficher les molécules et les atomes${sousTitre ? ` <small>${sousTitre}</small>` : ''}</span>
      <span class="np-switch"><input type="checkbox" ${coche ? 'checked' : ''}><span class="np-slider"></span></span>`;
    l.querySelector('input').addEventListener('change', e => onChange(e.target.checked));
    return l;
  }

  /* ============================================================
     COMPTER LES ATOMES D'UNE ESPÈCE (modules 1 et 2)
     L'élève règle, pour chaque élément, le nombre d'atomes avec
     les flèches ; la réponse se lit « 4 H ».
     cfg = {
       formule, coef,
       dessins: false,            état initial de l'interrupteur
       regle: '…',                rappel donné après la 1re erreur
       resolu: false,             affiche directement la réponse (retour en arrière)
       valeurs: [1, 1],           valeurs de départ des flèches (retour du module 2)
       onValeurs(valeurs),        appelé à chaque réglage
       onReussi(nbErreurs)
     }
     ============================================================ */
  function Comptage(el, cfg) {
    const coef = cfg.coef || 1, f = cfg.formule, comp = analyser(f);
    let erreurs = 0, fini = false;
    el.classList.add('er-cpt');
    el.innerHTML = `<div data-c="switch"></div>
      <div data-c="espece"></div>
      <p class="er-cpt-q">Nombre d'atomes de chaque élément :</p>
      <div class="er-reps" data-c="reps"></div>
      <div data-c="retour"></div>
      <div class="er-actions" data-c="actions"><button type="button" class="btn-primary" data-c="verifier">Vérifier</button></div>`;
    const $ = a => el.querySelector(`[data-c="${a}"]`);
    const esp = new Reaction($('espece'), { reactifs: [f], produits: [], coefs: [coef], selecteurs: false, dessins: !!cfg.dessins });
    $('switch').replaceWith(interrupteur(!!cfg.dessins, b => esp.options({ dessins: b })));
    let sels = [];
    sels = comp.map((a, k) => {
      const box = document.createElement('div');
      box.className = 'er-rep';
      const sel = selecteur({
        valeur: (cfg.valeurs && cfg.valeurs[k]) || 1, min: 1, max: 60, label: "le nombre d'atomes de " + a.el,
        onChange: () => {
          box.classList.remove('ok', 'ko');
          if (!fini) $('retour').innerHTML = '';
          if (cfg.onValeurs) cfg.onValeurs(sels.map(x => x.sel.valeur));
        },
      });
      box.appendChild(sel.el);
      box.insertAdjacentHTML('beforeend', `<span class="er-rep-el">${a.el}</span>`);
      $('reps').appendChild(box);
      return { sel, box, el: a.el, n: coef * a.n };
    });
    const calculs = liste => liste.map(x => `<li><b>${x.el}</b> : ${calculHTML(f, coef, x.el)} atome${x.n > 1 ? 's' : ''}</li>`).join('');
    function reussir(silencieux) {
      fini = true;
      sels.forEach(x => { x.sel.fixer(x.n); x.sel.activer(false); x.box.classList.remove('ko'); x.box.classList.add('ok'); });
      $('actions').innerHTML = '';
      $('retour').innerHTML = `<div class="callout-success er-retour"><p><b class="er-ok">${silencieux ? 'Réponse' : 'Bravo !'}</b></p><ul class="er-calculs">${calculs(sels)}</ul></div>`;
    }
    $('verifier').onclick = () => {
      if (fini) return;
      const faux = sels.filter(x => x.sel.valeur !== x.n);
      sels.forEach(x => { x.box.classList.toggle('ok', x.sel.valeur === x.n); x.box.classList.toggle('ko', x.sel.valeur !== x.n); });
      if (!faux.length) { reussir(); if (cfg.onReussi) cfg.onReussi(erreurs); return; }
      erreurs++;
      const noms = faux.map(x => `<b>${x.el}</b>`).join(', ').replace(/, ([^,]*)$/, ' et $1');
      let html = `<p><b class="er-ko">Pas tout à fait.</b> Vérifie le nombre d'atomes de ${noms}.</p>`;
      if (erreurs === 1) html += cfg.regle ? `<p>${cfg.regle}</p>` : '';
      else html += `<p>Voici le calcul :</p><ul class="er-calculs">${calculs(faux)}</ul><p class="er-petit">Règle les flèches sur ces valeurs, puis vérifie.</p>`;
      $('retour').innerHTML = `<div class="callout-danger er-retour">${html}</div>`;
      $('reps').classList.remove('er-secoue'); void $('reps').offsetWidth; $('reps').classList.add('er-secoue');
    };
    if (cfg.resolu) reussir(true);
  }

  /* ============================================================
     INDICE pour équilibrer (module 1) : premier élément non conservé,
     dans l'ordre conseillé par la méthode
     ============================================================ */
  function indice(reactifs, produits, coefs, ordre) {
    const v = verifier(reactifs, produits, coefs);
    if (v.equilibree && v.minimale) return { ok: true, html: '' };
    if (v.equilibree) {
      return { ok: false, html: `L'équation est équilibrée, mais il faut les <b>plus petits nombres entiers possibles</b> : tous tes nombres peuvent être divisés par ${coefs.reduce(pgcd)}.` };
    }
    const el = (ordre || v.faux).find(e => v.faux.includes(e)) || v.faux[0];
    const b = v.bilan.find(x => x.el === el);
    const cote = b.r > b.p ? produits : reactifs;
    const especes = cote.filter(f => nb(f, el) > 0).map(f => `<b>${formuleHTML(f)}</b>`).join(' ou ');
    return {
      ok: false,
      html: `Atomes de <b>${el}</b> : ${b.r} dans les réactifs, ${b.p} dans les produits. ` +
        `Il en manque ${b.r > b.p ? 'dans les produits' : 'dans les réactifs'} : augmente le nombre stœchiométrique devant ${especes}.`,
    };
  }

  /* ---------- Bandeau et menu communs aux modules ---------- */
  const MODULES = [
    { key: 'module_1', label: 'Module 1 : Comment équilibrer une réaction' },
    { key: 'module_2', label: 'Module 2 : Compter les atomes' },
    { key: 'module_3', label: 'Module 3 : Réactions faciles' },
    { key: 'module_4', label: 'Module 4 : Réactions moins faciles' },
  ];
  function menu(cle) {
    const n = window.AppNav.init({
      appName: 'Équilibrer une réaction', portalHref: '../../index.html', portalLabel: 'Toutes les applications',
      onHome: () => { window.location.href = '../index.html'; },
      onNavigate: key => { window.location.href = key + '.html'; },
      groups: [{ title: 'Modules', items: MODULES }],
    });
    n.setActive(cle);
    n.setTitle((MODULES.find(m => m.key === cle) || {}).label || null);
    return n;
  }

  /* ---------- Confettis (sans-faute) ---------- */
  function confettis() {
    const col = ['#0a7d57', '#16a34a', '#e8890c', '#d61f69', '#2952c8'];
    for (let i = 0; i < 70; i++) {
      const el = document.createElement('div');
      el.className = 'er-confetti';
      el.style.left = (Math.random() * 100) + 'vw';
      el.style.background = col[i % col.length];
      el.style.animationDuration = (2.2 + Math.random() * 1.6) + 's';
      el.style.animationDelay = (Math.random() * 0.8) + 's';
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 4800);
    }
  }

  window.ER = {
    ELEMENTS, analyser, nb, formuleHTML, molecule, boules, bouleHTML, selecteur, Reaction, bilan, verifier, bilanHTML,
    equationHTML, melanger, detailler, calculHTML, entrainement, menu, confettis, interrupteur, Comptage, indice,
  };
})();
