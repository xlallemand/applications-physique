/* ============================================================
   Outils de l'application « Équilibrer une réaction »
     ER.analyser      formule brute → nombre de chaque atome
                      (indices, parenthèses : Cu(OH)2, CH2=C(CH3)2…)
     ER.formuleHTML   formule avec indices en <sub>
     ER.molecule      dessin SVG d'une molécule en boules colorées
     ER.boules        atomes d'une espèce, en boules regroupées par molécule
     ER.selecteur     sélecteur de nombre : flèche +1 au-dessus, −1 au-dessous
     ER.Reaction      réaction interactive (sélecteurs, formules, dessins)
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
    const m = /^([A-Z][a-z]?)\(([A-Za-z]+)\)(\d+)$/.exec(formule);
    if (m) {
      const g = lireStructure(m[2]).atomes;
      const branche = g.length > 1 ? g[0] + '(' + g.slice(1).join(')(') + ')' : g[0];
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
    // racine : l'atome qui a le plus de voisins (le premier en cas d'égalité)
    let racine = 0;
    for (let k = 1; k < n; k++) if (vois[k].length > vois[racine].length) racine = k;
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
      const e = elt(a.el);
      const b = `<span class="er-at${a.el === 'H' ? ' er-at-h' : ''}${a.el.length > 1 ? ' er-at-2' : ''}" style="background:${e.c};color:${e.t}${e.bord ? ';box-shadow:inset 0 0 0 1px ' + e.bord : ''}">${a.el}</span>`;
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
       onChange(coefs)
     }
     ============================================================ */
  function Reaction(el, cfg) {
    this.el = el;
    this.cfg = Object.assign({ comptes: false, detail: false, dessins: false, max: 30 }, cfg);
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
      const m = membres[k < nR ? 0 : 1];
      if (k !== 0 && k !== nR) m.insertAdjacentHTML('beforeend', '<div class="er-op">+</div>');
      const b = document.createElement('div');
      b.className = 'er-espece';
      b.innerHTML = `<div class="er-tete"><span class="er-sel-place"></span><span class="er-formule">${formuleHTML(f)}</span></div>` +
        `<div class="er-comptes"></div><div class="er-dessin"></div>`;
      const sel = selecteur({
        valeur: moi.coefs[k], min: 1, max: c.max, label: 'le nombre stœchiométrique de ' + f,
        onChange: v => { moi.coefs[k] = v; moi.majEspece(k); if (c.onChange) c.onChange(moi.coefs.slice()); },
      });
      b.querySelector('.er-sel-place').replaceWith(sel.el);
      m.appendChild(b);
      moi.sels.push(sel); moi.zones.push(b);
    });
    // la flèche commence le membre des produits : sur un écran étroit, elle passe à la ligne avec eux
    membres[1].insertAdjacentHTML('afterbegin', '<div class="er-op er-fleche">→</div>');
    this.el.appendChild(membres[0]);
    this.el.appendChild(membres[1]);
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
    ELEMENTS, analyser, nb, formuleHTML, molecule, boules, selecteur, Reaction, bilan, confettis,
  };
})();
