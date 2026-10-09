/* ============================================================
   Outils de l'application « Avancement d'une réaction »
     AV.fmt / AV.lire      écriture et lecture des nombres (virgule, × 10ⁿ)
     AV.Simulation         la réaction a lieu x fois : réacteur (molécules)
                           et histogramme qui évoluent en direct
     AV.Exercice           tableau d'avancement à compléter, étape par étape
                           (cours guidé) ou d'un coup (entraînement)
     AV.frise              frise de l'avancement : un « mur » par réactif
     AV.entrainement       10 questions notées sur 20
     AV.tableauHTML        tableau d'avancement complet (exemple traité d'un cours)
     AV.partieExercice     tableau guidé (AV.Exercice) dans un « À toi » (assets/cours.js)
     AV.partieValeurs      valeurs saisies avec les champs de l'application dans un « À toi »
                           (puissances de 10 : nombre au clavier, exposant avec les flèches)
     AV.menu, AV.accueil   sommaire de l'application et accueil (assets/sommaire.js)
   Formules et dessins des molécules : assets/molecules.js
   ============================================================ */
(function () {
  'use strict';

  const { formuleHTML: fH, molecule, selecteur } = window.MOL;
  const COUL = ['#2952c8', '#d9730d', '#0a7d57', '#5a3fc4', '#c2255c'];

  /* ============================================================
     NOMBRES
     ============================================================ */
  const net = v => Math.round(v * 1e10) / 1e10;          // supprime les erreurs d'arrondi (0,1 + 0,2)
  const moins = s => String(s).replace('-', '−');

  // Écriture scientifique avec 2 chiffres significatifs : 6,0 × 10⁻³
  function puissance(v) {
    if (net(v) === 0) return '0';
    let e = Math.floor(Math.log10(Math.abs(v)));
    let m = +(v / Math.pow(10, e)).toFixed(1);
    if (Math.abs(m) >= 10) { m = +(m / 10).toFixed(1); e++; }
    return `${moins(m.toFixed(1).replace('.', ','))}&nbsp;×&nbsp;10<sup>${moins(e)}</sup>`;
  }
  function fmt(v, mode) {
    v = net(v);
    if (mode === 'puissance') return puissance(v);
    return moins(String(+v.toFixed(6)).replace('.', ','));
  }
  // Lecture d'une saisie : virgule ou point, espaces ignorés ; NaN si ce n'est pas un nombre
  function lire(s) {
    s = String(s == null ? '' : s).trim().replace(/\s/g, '').replace(',', '.').replace('−', '-');
    return /^-?(\d+\.?\d*|\.\d+)$/.test(s) ? parseFloat(s) : NaN;
  }
  // Égalité à 0,6 % près (2 chiffres significatifs)
  const egal = (a, b) => isFinite(a) && Math.abs(a - b) <= 1e-12 + 0.006 * Math.abs(b);

  /* ============================================================
     CHAMPS DE SAISIE
     entier    : flèches ▲▼ (molécules)
     decimal   : clavier numérique (mol)
     puissance : mantisse au clavier, exposant avec les flèches
     ============================================================ */
  function champ(mode, opts) {
    opts = opts || {};
    const el = document.createElement('span');
    el.className = 'av-champ av-champ-' + mode;
    const change = () => { el.classList.remove('ok', 'ko'); if (opts.onChange) opts.onChange(); };
    let api;
    if (mode === 'entier') {
      const sel = selecteur({ valeur: 0, min: 0, max: 99, label: opts.label || '', onChange: change });
      el.appendChild(sel.el);
      api = { valeur: () => sel.valeur, fixer: v => sel.fixer(Math.round(v)), activer: b => sel.activer(b), vide: () => false };
    } else {
      el.innerHTML = `<input type="text" inputmode="decimal" autocomplete="off" spellcheck="false" class="av-input" aria-label="${opts.label || 'valeur'}">` +
        (mode === 'puissance' ? '<span class="av-dix">× 10</span><span class="av-exp"></span>' : '');
      const inp = el.querySelector('input');
      inp.addEventListener('input', change);
      inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); inp.blur(); } });
      let exp = null;
      if (mode === 'puissance') {
        exp = selecteur({ valeur: 0, min: -12, max: 12, label: "l'exposant", onChange: change });
        el.querySelector('.av-exp').appendChild(exp.el);
      }
      api = {
        valeur: () => lire(inp.value) * (exp ? Math.pow(10, exp.valeur) : 1),
        fixer: v => {
          v = net(v);
          if (!exp) { inp.value = fmt(v).replace('−', '-'); return; }
          if (v === 0) { inp.value = '0'; exp.fixer(0); return; }
          let e = Math.floor(Math.log10(Math.abs(v)));
          let m = +(v / Math.pow(10, e)).toFixed(1);
          if (Math.abs(m) >= 10) { m = +(m / 10).toFixed(1); e++; }
          inp.value = m.toFixed(1).replace('.', ',');
          exp.fixer(e);
        },
        activer: b => { inp.disabled = !b; if (exp) exp.activer(b); },
        vide: () => inp.value.trim() === '',
      };
    }
    api.el = el;
    api.marquer = ok => { el.classList.toggle('ok', ok === true); el.classList.toggle('ko', ok === false); };
    return api;
  }

  // Signe (− ou +) et nombre devant x : « 4 [−|+] [2] x »
  function expression(opts) {
    const el = document.createElement('span');
    el.className = 'av-expr';
    el.innerHTML = (opts.avant ? `<span class="av-expr-n0">${opts.avant}</span>` : '') +
      `<span class="av-signes" role="group" aria-label="signe"><button type="button" data-s="−" aria-label="moins">−</button><button type="button" data-s="+" aria-label="plus">+</button></span>` +
      `<span class="av-expr-sel"></span><span class="av-expr-x">${opts.x || 'x'}</span>`;
    let signe = '', actif = true;
    const sel = selecteur({ valeur: 1, min: 1, max: 12, label: 'le nombre devant x', onChange: () => { el.classList.remove('ok', 'ko'); if (opts.onChange) opts.onChange(); } });
    el.querySelector('.av-expr-sel').appendChild(sel.el);
    const boutons = [...el.querySelectorAll('[data-s]')];
    const afficher = () => boutons.forEach(b => b.classList.toggle('choisi', b.dataset.s === signe));
    boutons.forEach(b => b.addEventListener('click', () => {
      if (!actif) return;
      signe = b.dataset.s; afficher(); el.classList.remove('ok', 'ko');
      if (opts.onChange) opts.onChange();
    }));
    return {
      el,
      valeur: () => ({ signe, coef: sel.valeur }),
      fixer: v => { signe = v.signe; sel.fixer(v.coef); afficher(); },
      activer: b => { actif = b; sel.activer(b); boutons.forEach(x => { x.disabled = !b; }); },
      marquer: ok => { el.classList.toggle('ok', ok === true); el.classList.toggle('ko', ok === false); },
    };
  }

  /* ============================================================
     RÉACTION : grandeurs calculées
     q = { r: ['CH4','O2'], p: ['CO2','H2O'], c: [1,2,1,2], n0: [3,4,0,0] }
     ============================================================ */
  function calculer(q) {
    const esp = q.r.concat(q.p), nR = q.r.length;
    const xm = q.r.map((_, k) => net(q.n0[k] / q.c[k]));
    const xmax = Math.min(...xm);
    const L = xm.indexOf(xmax);
    const nf = esp.map((_, k) => net(q.n0[k] + (k < nR ? -1 : 1) * q.c[k] * xmax));
    return { esp, nR, xm, xmax, L, nf, signe: k => (k < nR ? '−' : '+') };
  }
  const coefX = c => (c > 1 ? c : '');
  function equationHTML(q) {
    const esp = q.r.concat(q.p), nR = q.r.length;
    return esp.map((f, k) => (q.c[k] > 1 ? `<span class="av-c">${q.c[k]}</span>&nbsp;` : '') + fH(f))
      .reduce((s, t, k) => s + (k === 0 ? '' : k === nR ? ' → ' : ' + ') + t, '');
  }
  const liste = l => (l.length > 1 ? l.slice(0, -1).join(', ') + ' et ' + l[l.length - 1] : l.join(''));

  /* ============================================================
     FRISE DE L'AVANCEMENT
     murs = [{ v, nom, couleur }] ; x = position actuelle du curseur
     ============================================================ */
  function frise(el, murs, x, mode) {
    const W = 560, H = 150, g = 26, d = 30, y = 86;
    const vmax = Math.max(...murs.map(m => m.v));
    const pas = pasAxe(vmax * 1.25);
    const XM = Math.ceil(vmax * 1.2 / pas) * pas;
    const X = v => g + v / XM * (W - g - d);
    let s = `<line x1="${g}" x2="${W - d + 10}" y1="${y}" y2="${y}" stroke="#16181d" stroke-width="2"/><path d="M${W - d + 16},${y} l-9,-5 v10 z" fill="#16181d"/>`;
    for (let v = 0; v <= XM + 1e-9; v += pas) {
      s += `<line x1="${X(v)}" x2="${X(v)}" y1="${y - 5}" y2="${y + 5}" stroke="#16181d" stroke-width="2"/>` +
        `<text x="${X(v)}" y="${y + 22}" font-size="13" text-anchor="middle">${texteSVG(v, mode)}</text>`;
    }
    s += `<text x="${W - d + 14}" y="${y + 42}" font-size="13" font-weight="700" text-anchor="end">avancement x</text>`;
    // murs : la plus petite valeur en premier pour que les étiquettes ne se chevauchent pas
    murs.slice().sort((a, b) => a.v - b.v).forEach((m, i) => {
      const hy = i % 2 ? 66 : 50;
      s += `<rect x="${X(m.v) - 4}" y="${y - hy}" width="8" height="${hy}" rx="3" fill="${m.couleur}"/>` +
        `<text x="${X(m.v)}" y="${y - hy - 7}" font-size="13" font-weight="800" fill="${m.couleur}" text-anchor="middle">${m.nom} épuisé</text>`;
    });
    if (x > 0) {
      s += `<rect x="${g}" y="${y - 7}" width="${Math.max(0, X(x) - g)}" height="14" rx="7" fill="#0a7d57" opacity=".85"/>`;
    }
    s += `<circle cx="${X(x)}" cy="${y}" r="9" fill="#0a7d57" stroke="#fff" stroke-width="3"/>`;
    const vmin = Math.min(...murs.map(m => m.v));
    if (x >= vmin - 1e-9) {
      s += `<text x="${X(vmin)}" y="${y + 60}" font-size="14" font-weight="800" text-anchor="middle" fill="#075c40">x<tspan font-size="10" dy="4">max</tspan><tspan dy="-4"> = ${texteSVG(vmin, mode)}</tspan></text>`;
    }
    el.innerHTML = `<svg viewBox="0 0 ${W} ${H + 12}" role="img" aria-label="frise de l'avancement">${s}</svg>`;
  }
  // Formule en texte simple (pour le SVG) : indices et charges en caractères Unicode
  function texteUni(f) {
    const BAS = '₀₁₂₃₄₅₆₇₈₉', HAUT = { 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹', '+': '⁺', '−': '⁻' };
    return fH(f).replace(/<sub>(.*?)<\/sub>/g, (m, d) => d.split('').map(x => BAS[x]).join(''))
      .replace(/<sup>(.*?)<\/sup>/g, (m, d) => d.split('').map(x => HAUT[x] || x).join(''));
  }
  function pasAxe(v) {
    const p = Math.pow(10, Math.floor(Math.log10(v)));
    const r = v / p;
    return (r <= 2 ? .5 : r <= 5 ? 1 : 2) * p;
  }
  function texteSVG(v, mode) {
    if (mode !== 'puissance' || net(v) === 0) return fmt(v);
    return puissance(v).replace(/<sup>(.*?)<\/sup>/, '<tspan font-size="9" dy="-6">$1</tspan>');
  }
  // Animation du curseur de 0 à xmax
  function animerFrise(el, murs, mode, fin) {
    const xmax = Math.min(...murs.map(m => m.v));
    let t0 = null;
    const duree = 1200;
    function pas(t) {
      if (t0 === null) t0 = t;
      const a = Math.min(1, (t - t0) / duree);
      frise(el, murs, xmax * (1 - Math.pow(1 - a, 2)), mode);
      if (a < 1) requestAnimationFrame(pas); else if (fin) fin();
    }
    requestAnimationFrame(pas);
  }

  /* ============================================================
     SIMULATION : la réaction a lieu x fois
     A : réacteur (molécules qui disparaissent / apparaissent)
     B : histogramme en direct
     cfg = { r, p, c, n0, onEtape(x), onFin(x), verrou: true, compteur: x => 'x = ' + x }
     ============================================================ */
  function Simulation(el, cfg) {
    this.el = el; this.cfg = cfg;
    this.x = 0; this.occupe = false; this.verrou = !!cfg.verrou;
    this.construire();
  }
  Simulation.prototype.esp = function () { return this.cfg.r.concat(this.cfg.p); };
  Simulation.prototype.n = function (k, x) {
    const c = this.cfg;
    return c.n0[k] + (k < c.r.length ? -1 : 1) * c.c[k] * (x == null ? this.x : x);
  };
  // nombre de fois que la réaction peut avoir lieu (molécules entières)
  Simulation.prototype.xFin = function () {
    const c = this.cfg;
    return Math.min(...c.r.map((_, k) => Math.floor(c.n0[k] / c.c[k])));
  };
  Simulation.prototype.construire = function () {
    const moi = this, c = this.cfg;
    this.el.classList.add('av-sim');
    this.el.innerHTML = `
      <div class="av-sim-cmd">
        <button type="button" class="btn-small av-sim-moins" aria-label="Revenir d'une étape">◀</button>
        <span class="av-sim-x">x = 0</span>
        <button type="button" class="btn-primary av-sim-plus">La réaction a lieu une fois ▶</button>
        <button type="button" class="btn-small av-sim-raz" aria-label="Recommencer">↺</button>
      </div>
      <div class="av-sim-vues">
        <div class="av-rea">
          <div class="av-rea-zone"><p class="av-rea-titre">RÉACTIFS</p><div class="av-rea-mols" data-z="r"></div><div class="av-rea-cpt" data-z="cr"></div></div>
          <div class="av-rea-fleche">→</div>
          <div class="av-rea-zone"><p class="av-rea-titre">PRODUITS</p><div class="av-rea-mols" data-z="p"></div><div class="av-rea-cpt" data-z="cp"></div></div>
        </div>
        <div class="av-histo-bloc"><div class="av-histo" data-z="h"></div><div class="av-histo-noms" data-z="hn"></div></div>
      </div>
      <div class="av-sim-msg"></div>`;
    const $ = s => this.el.querySelector(s);
    this.$ = $;
    $('.av-sim-plus').addEventListener('click', () => moi.avancer());
    $('.av-sim-moins').addEventListener('click', () => moi.reculer());
    $('.av-sim-raz').addEventListener('click', () => moi.recommencer());
    this.dessiner(); this.maj();
  };
  Simulation.prototype.molHTML = function (k, cls) {
    return `<span class="av-mol ${cls || ''}" data-k="${k}">${molecule(this.esp()[k])}</span>`;
  };
  Simulation.prototype.dessiner = function () {
    const c = this.cfg, nR = c.r.length;
    this.$('[data-z="r"]').innerHTML = c.r.map((_, k) => this.molHTML(k).repeat(Math.max(0, this.n(k)))).join('');
    this.$('[data-z="p"]').innerHTML = c.p.map((_, j) => this.molHTML(j + nR).repeat(Math.max(0, this.n(j + nR)))).join('');
  };
  Simulation.prototype.maj = function () {
    const c = this.cfg, nR = c.r.length, fin = this.x >= this.xFin();
    const $ = this.$;
    $('.av-sim-x').innerHTML = (c.compteur || (x => `x = ${x}`))(this.x);
    $('.av-sim-plus').disabled = fin || this.occupe || this.verrou;
    $('.av-sim-moins').disabled = this.x === 0 || this.occupe || this.verrou;
    $('.av-sim-raz').disabled = this.verrou;
    this.el.classList.toggle('av-sim-verrou', this.verrou);
    const cpt = k => `<span class="${k < nR && this.n(k) < c.c[k] ? 'manque' : ''}">${this.n(k)} ${fH(this.esp()[k])}</span>`;
    $('[data-z="cr"]').innerHTML = c.r.map((_, k) => cpt(k)).join('');
    $('[data-z="cp"]').innerHTML = c.p.map((_, j) => cpt(j + nR)).join('');
    this.histo();
    const msg = $('.av-sim-msg');
    if (this.verrou) msg.innerHTML = '';
    else if (fin) {
      // réactifs qui manquent pour que la réaction ait lieu une fois de plus
      const lim = c.r.map((_, k) => k).filter(k => this.n(k) < c.c[k]);
      const manque = k => (this.n(k) === 0 ? `il n'y a plus de ${fH(c.r[k])}` : `il faudrait ${c.c[k]} ${fH(c.r[k])}, il n'en reste que ${this.n(k)}`);
      const noms = lim.map(k => `<b>${fH(c.r[k])}</b>`);
      const tousNuls = c.r.every((_, k) => this.n(k) === 0);
      msg.innerHTML = `<div class="callout-danger er-retour"><p><b class="er-ko">La réaction s'arrête</b> : ${lim.map(manque).join(' et ')}.</p>` +
        (lim.length > 1
          ? `<p>${noms.slice(0, -1).join(', ')} et ${noms[noms.length - 1]} sont épuisés en même temps : ${lim.length > 2 ? 'ils sont tous' : 'les deux sont'} <b>réactifs limitants</b>. La réaction a eu lieu ${this.x} fois.</p>` +
            (tousNuls ? `<p>Il ne reste aucun réactif : on dit que les réactifs ont été introduits dans les <b>proportions stœchiométriques</b>.</p>` : '')
          : `<p>${noms[0]} est le <b>réactif limitant</b>. La réaction a eu lieu ${this.x} fois.</p>`) + '</div>';
    } else if (this.x > 0) {
      msg.innerHTML = `<p class="av-guide">À chaque fois : ${c.r.map((f, k) => `<b>−${c.c[k]}</b> ${fH(f)}`).join(', ')} ; ${c.p.map((f, j) => `<b>+${c.c[j + nR]}</b> ${fH(f)}`).join(', ')}.</p>`;
    } else msg.innerHTML = '';
  };
  Simulation.prototype.histo = function () {
    const c = this.cfg, nR = c.r.length, esp = this.esp();
    const max = Math.max(1, ...esp.map((_, k) => Math.max(this.n(k, 0), this.n(k, this.xFin()))));
    const H = 170, u = H / max;
    let s = '';
    esp.forEach((f, k) => {
      if (k === nR) s += '<div class="av-histo-sep"></div>';
      const v = this.n(k), manque = k < nR && v < c.c[k] && this.x >= this.xFin();
      s += `<div class="av-histo-col${manque ? ' manque' : ''}"><span class="av-histo-val">${v}</span>` +
        `<div class="av-histo-barre" style="height:${v * u}px;background-color:${COUL[k % COUL.length]};--u:${u}px"></div></div>`;
    });
    this.$('[data-z="h"]').innerHTML = s;
    this.$('[data-z="hn"]').innerHTML = esp.map((f, k) => (k === nR ? '<span class="av-histo-sep-nom"></span>' : '') +
      `<span style="color:${COUL[k % COUL.length]}">${fH(f)}</span>`).join('');
  };
  Simulation.prototype.avancer = function () {
    if (this.occupe || this.verrou || this.x >= this.xFin()) return;
    const moi = this, c = this.cfg, nR = c.r.length;
    const jeton = this.jeton = (this.jeton || 0) + 1;     // animation annulée si on recommence entre-temps
    this.occupe = true; this.maj();
    // les molécules qui vont réagir sont entourées, puis disparaissent
    const choisies = [];
    c.r.forEach((_, k) => {
      [...this.$('[data-z="r"]').querySelectorAll(`.av-mol[data-k="${k}"]`)].slice(-c.c[k])
        .forEach(m => { m.classList.add('choisie'); choisies.push(m); });
    });
    setTimeout(() => {
      if (jeton !== moi.jeton) return;
      choisies.forEach(m => m.classList.add('partie'));
      setTimeout(() => {
        if (jeton !== moi.jeton) return;
        choisies.forEach(m => m.remove());
        const zp = moi.$('[data-z="p"]');
        zp.querySelectorAll('.arrive').forEach(m => m.classList.remove('arrive'));
        c.p.forEach((_, j) => {
          const k = j + nR, der = [...zp.querySelectorAll(`.av-mol[data-k="${k}"]`)].pop();
          const html = moi.molHTML(k, 'arrive').repeat(c.c[k]);
          const suivant = [...zp.querySelectorAll('.av-mol')].find(m => +m.dataset.k > k);
          if (der) der.insertAdjacentHTML('afterend', html);
          else if (suivant) suivant.insertAdjacentHTML('beforebegin', html);
          else zp.insertAdjacentHTML('beforeend', html);
        });
        moi.x++; moi.occupe = false; moi.maj();
        if (c.onEtape) c.onEtape(moi.x);
        if (moi.x >= moi.xFin() && c.onFin) c.onFin(moi.x);
      }, 320);
    }, 520);
  };
  Simulation.prototype.reculer = function () {
    if (this.occupe || this.verrou || this.x === 0) return;
    this.x--; this.dessiner(); this.maj();
    if (this.cfg.onEtape) this.cfg.onEtape(this.x);
  };
  Simulation.prototype.recommencer = function (n0) {
    this.jeton = (this.jeton || 0) + 1; this.occupe = false;
    if (n0) this.cfg.n0 = n0.slice();
    this.x = 0; this.dessiner(); this.maj();
    if (this.cfg.onEtape) this.cfg.onEtape(0);
  };
  Simulation.prototype.deverrouiller = function () { this.verrou = false; this.maj(); };
  Simulation.prototype.changer = function (q) {
    this.jeton = (this.jeton || 0) + 1; this.occupe = false;
    Object.assign(this.cfg, { r: q.r, p: q.p, c: q.c, n0: q.n0.slice() });
    this.x = 0; this.dessiner(); this.maj();
  };

  /* ============================================================
     EXERCICE : TABLEAU D'AVANCEMENT
     cfg = {
       r, p, c, n0,                 réaction et quantités initiales
       unite: 'mol',                « molécules » ou « mol »
       mode: 'decimal',             entier | decimal | puissance
       guide: true,                 étape par étape avec aides ; false : tout d'un coup (évaluation)
       etapes: ['initial','pont','cours','hyp','concl','final'],
                                    'ratio' à la place du tableau pour « sans tableau »
       molecules: false,            dessins des molécules en tête de colonne
       frise: false,                frise de l'avancement à l'étape de conclusion
       sansTableau: false,
       onFini(erreurs, reponseVue)
     }
     ============================================================ */
  function Exercice(el, cfg) {
    this.el = el;
    this.cfg = Object.assign({ unite: 'mol', mode: 'decimal', guide: true, etapes: ['initial', 'cours', 'hyp', 'concl', 'final'] }, cfg);
    this.k = calculer(this.cfg);
    this.cases = {};               // contenu des cases du tableau : cases['cours-2'] = '4 − 2x'
    this.erreurs = 0; this.vue = false;
    this.construire();
  }

  // Définition des étapes : saisies, vérification, solution, aperçu dans le tableau
  Exercice.prototype.ETAPES = {
    initial: {
      titre: 'État initial',
      consigne: g => g ? 'Recopie les quantités initiales. Les produits ne sont pas encore formés.' : 'État initial',
      saisies(ex) {
        return ex.k.esp.map((f, k) => ({ lab: fH(f), w: champ(ex.cfg.mode, { label: 'quantité initiale de ' + f, onChange: () => ex.apercu('initial') }) }));
      },
      juste: (ex, k, w) => egal(w.valeur(), ex.cfg.n0[k]),
      solution: (ex, k, w) => w.fixer(ex.cfg.n0[k]),
      texte: (ex, k, w) => (w.vide && w.vide() ? '…' : isFinite(w.valeur()) ? fmt(w.valeur(), ex.cfg.mode) : '?'),
      aide: () => "Recopie les quantités données dans l'énoncé. Au départ, il n'y a pas encore de produits : leur quantité est 0.",
    },
    pont: {
      titre: 'À chaque fois que la réaction a lieu',
      consigne: () => 'Combien de molécules disparaissent (−) ou apparaissent (+) à chaque fois que la réaction a lieu ?',
      saisies(ex) {
        return ex.k.esp.map((f, k) => ({ lab: fH(f), w: expression({ x: fH(f), onChange: () => ex.apercu('pont') }) }));
      },
      juste: (ex, k, w) => { const v = w.valeur(); return v.signe === ex.k.signe(k) && v.coef === ex.cfg.c[k]; },
      solution: (ex, k, w) => w.fixer({ signe: ex.k.signe(k), coef: ex.cfg.c[k] }),
      texte: (ex, k, w) => { const v = w.valeur(); return `${v.signe || '?'}${v.coef} ${fH(ex.k.esp[k])}`; },
      aide: () => 'Les réactifs disparaissent (signe −), les produits apparaissent (signe +). Le nombre de molécules est le nombre stœchiométrique.',
    },
    cours: {
      titre: 'État en cours (avancement x)',
      consigne: g => g ? 'Complète la ligne « en cours » : choisis le signe et le nombre devant x.' : 'État en cours',
      saisies(ex) {
        return ex.k.esp.map((f, k) => ({ lab: fH(f), w: expression({ avant: fmt(ex.cfg.n0[k], ex.cfg.mode), onChange: () => ex.apercu('cours') }) }));
      },
      juste: (ex, k, w) => { const v = w.valeur(); return v.signe === ex.k.signe(k) && v.coef === ex.cfg.c[k]; },
      solution: (ex, k, w) => w.fixer({ signe: ex.k.signe(k), coef: ex.cfg.c[k] }),
      texte: (ex, k, w) => { const v = w.valeur(); return `${fmt(ex.cfg.n0[k], ex.cfg.mode)} ${v.signe || '?'} ${coefX(v.coef)}x`; },
      aide: () => "Pour un réactif : n initial <b>−</b> nombre stœchiométrique × x. Pour un produit : n initial <b>+</b> nombre stœchiométrique × x.",
    },
    hyp: {
      titre: 'Les deux hypothèses',
      consigne: g => g ? 'Pour chaque réactif, suppose qu\'il est le réactif limitant : sa quantité finale est nulle. Calcule x<sub>max</sub>.' : 'Hypothèses',
      saisies(ex) {
        return ex.cfg.r.map((f, k) => ({ lab: fH(f), w: champ(ex.cfg.mode, { label: 'xmax si ' + f + ' est limitant' }), hyp: true }));
      },
      juste: (ex, k, w) => egal(w.valeur(), ex.k.xm[k]),
      solution: (ex, k, w) => w.fixer(ex.k.xm[k]),
      aide: () => "Si ce réactif est limitant, il est épuisé : n initial − nombre stœchiométrique × x<sub>max</sub> = 0, donc x<sub>max</sub> = n initial ÷ nombre stœchiométrique.",
    },
    ratio: {
      // sansFormule : la formule n'est plus rappelée (fin de l'entraînement du module 7)
      titre: ex => (ex.cfg.sansFormule ? 'Pour chaque réactif : valeur de x pour laquelle il serait épuisé' : 'Pour chaque réactif : n<sub>i</sub> ÷ nombre stœchiométrique'),
      consigne: g => g ? 'Calcule, pour chaque réactif, sa quantité initiale divisée par son nombre stœchiométrique.' : 'Rapports n<sub>i</sub> ÷ nombre stœchiométrique',
      saisies(ex) {
        return ex.cfg.r.map((f, k) => ({ lab: fH(f), w: champ(ex.cfg.mode, { label: 'rapport pour ' + f }), ratio: true }));
      },
      juste: (ex, k, w) => egal(w.valeur(), ex.k.xm[k]),
      solution: (ex, k, w) => w.fixer(ex.k.xm[k]),
      aide: () => "Divise la quantité initiale du réactif par son nombre stœchiométrique (le nombre devant sa formule).",
    },
    concl: {
      titre: 'Conclusion',
      consigne: g => g ? 'Quel est le réactif limitant ? Quelle est la valeur de x<sub>max</sub> ?' : 'Réactif limitant et x<sub>max</sub>',
      saisies(ex) {
        return [{ lab: 'Réactif limitant', w: choix(ex.cfg.r.map(fH), () => ex.apercu('concl')), limitant: true },
          { lab: 'x<sub>max</sub>', w: champ(ex.cfg.mode, { label: 'xmax', onChange: () => ex.apercu('concl') }) }];
      },
      juste: (ex, k, w) => (k === 0 ? w.valeur() === ex.k.L : egal(w.valeur(), ex.k.xmax)),
      solution: (ex, k, w) => w.fixer(k === 0 ? ex.k.L : ex.k.xmax),
      aide: () => "La réaction s'arrête dès qu'un réactif est épuisé : on garde la <b>plus petite</b> valeur de x<sub>max</sub>. Le réactif correspondant est le réactif limitant.",
    },
    final: {
      titre: 'État final',
      consigne: g => g ? 'Calcule les quantités à l\'état final en remplaçant x par x<sub>max</sub>.' : 'État final',
      saisies(ex) {
        return ex.k.esp.map((f, k) => ({ lab: fH(f), w: champ(ex.cfg.mode, { label: 'quantité finale de ' + f, onChange: () => ex.apercu('final') }), final: true }));
      },
      juste: (ex, k, w) => egal(w.valeur(), ex.k.nf[k]),
      solution: (ex, k, w) => w.fixer(ex.k.nf[k]),
      texte: (ex, k, w) => (w.vide && w.vide() ? '…' : isFinite(w.valeur()) ? fmt(w.valeur(), ex.cfg.mode) : '?'),
      aide: () => "Réactif : n final = n initial − nombre stœchiométrique × x<sub>max</sub>. Produit : n final = n initial + nombre stœchiométrique × x<sub>max</sub>. Le réactif limitant finit à 0.",
    },
  };

  // Choix du réactif limitant (boutons)
  function choix(noms, onChange) {
    const el = document.createElement('span');
    el.className = 'av-choix';
    el.innerHTML = noms.map((n, i) => `<button type="button" data-i="${i}">${n}</button>`).join('');
    let v = -1, actif = true;
    const bs = [...el.querySelectorAll('button')];
    const afficher = () => bs.forEach(b => b.classList.toggle('choisi', +b.dataset.i === v));
    bs.forEach(b => b.addEventListener('click', () => { if (!actif) return; v = +b.dataset.i; afficher(); el.classList.remove('ok', 'ko'); if (onChange) onChange(); }));
    return {
      el, valeur: () => v, fixer: i => { v = i; afficher(); },
      activer: b => { actif = b; bs.forEach(x => { x.disabled = !b; }); },
      marquer: ok => { el.classList.toggle('ok', ok === true); el.classList.toggle('ko', ok === false); },
    };
  }

  Exercice.prototype.construire = function () {
    const c = this.cfg;
    this.el.classList.add('av-ex');
    this.el.innerHTML = (c.sansTableau ? '' : `<div class="av-tab-wrap"><div data-x="tab"></div></div>`) +
      `<div data-x="etapes"></div><div data-x="bas"></div>`;
    this.zones = {};
    this.saisies = {};
    if (c.guide) {
      this.etape = 0;
      this.ouvrirEtape(0);
    } else {
      c.etapes.forEach(id => this.ouvrirEtape(c.etapes.indexOf(id)));
      this.actionsEvaluation();
    }
    this.dessinerTableau();
  };

  Exercice.prototype.titre = function (id) {
    const t = this.ETAPES[id].titre;
    return typeof t === 'function' ? t(this) : t;
  };

  // Ouvre une étape : titre, consigne, saisies, et en mode guidé le bouton « Vérifier »
  Exercice.prototype.ouvrirEtape = function (i) {
    const moi = this, c = this.cfg, id = c.etapes[i], E = this.ETAPES[id];
    const z = document.createElement('section');
    z.className = 'av-etape';
    z.dataset.etape = id;
    z.innerHTML = `<h4 class="av-etape-titre"><span class="av-etape-num">${i + 1}</span><span>${this.titre(id)}</span></h4>
      ${c.guide ? `<p class="av-consigne">${E.consigne(true)}</p>` : ''}
      <div class="av-saisies" data-x="saisies"></div><div data-x="frise"></div><div data-x="retour"></div><div class="er-actions" data-x="actions"></div>`;
    this.el.querySelector('[data-x="etapes"]').appendChild(z);
    this.zones[id] = z;
    const liste = E.saisies(this);
    this.saisies[id] = liste;
    const zs = z.querySelector('[data-x="saisies"]');
    liste.forEach((s, k) => {
      const l = document.createElement('div');
      l.className = 'av-saisie' + (s.hyp || s.ratio ? ' av-saisie-carte' : '');
      if (s.hyp) {
        const f = c.r[k], n0 = fmt(c.n0[k], c.mode);
        l.innerHTML = `<p class="av-hyp-t">Hypothèse ${k + 1}</p><p class="av-hyp-q">Si ${s.lab} est le réactif limitant :</p>` +
          (c.guide ? `<p class="av-hyp-calc">${n0} − ${coefX(c.c[k])}x<sub>max</sub> = 0</p>` : '') +
          `<p class="av-hyp-r"><span>x<sub>max</sub> =</span><span data-x="w"></span>${c.unite === 'mol' ? '<span>mol</span>' : ''}</p>`;
      } else if (s.ratio) {
        l.innerHTML = `<p class="av-hyp-q">${s.lab}</p><p class="av-hyp-r"><span>${c.sansFormule ? 'x =' : `n<sub>i</sub> ÷ ${c.c[k]} = ` +
          (c.guide ? `${fmt(c.n0[k], c.mode)} ÷ ${c.c[k]} = ` : '')}</span><span data-x="w"></span>${c.unite === 'mol' ? '<span>mol</span>' : ''}</p>`;
      } else if (s.final && c.guide) {
        const k2 = k, sg = this.k.signe(k2);
        l.innerHTML = `<span class="av-lab">${s.lab}</span><span class="av-calc">${fmt(c.n0[k2], c.mode)} ${sg} ${c.c[k2] > 1 ? c.c[k2] + ' × ' : ''}${fmt(this.k.xmax, c.mode)} =</span><span data-x="w"></span>`;
      } else {
        l.innerHTML = `<span class="av-lab">${s.lab}</span><span data-x="w"></span>`;
      }
      l.querySelector('[data-x="w"]').replaceWith(s.w.el);
      zs.appendChild(l);
    });
    if (id === 'concl' && c.frise) {
      this.murs = c.r.map((f, k) => ({ v: this.k.xm[k], nom: texteUni(f), couleur: COUL[k] }));
      frise(z.querySelector('[data-x="frise"]'), this.murs, 0, c.mode);
      z.querySelector('[data-x="frise"]').insertAdjacentHTML('afterbegin', '<p class="av-frise-legende">Chaque réactif dresse un mur à la valeur de x où il serait épuisé.</p>');
    }
    if (c.guide) {
      const act = z.querySelector('[data-x="actions"]');
      act.innerHTML = `<button type="button" class="btn-primary" data-x="verifier">Vérifier</button>`;
      act.querySelector('[data-x="verifier"]').onclick = () => moi.verifierEtape(id);
      z.dataset.erreurs = 0;
    }
  };

  // Vérifie une étape ; renvoie true si tout est juste
  Exercice.prototype.controler = function (id) {
    const E = this.ETAPES[id];
    let ok = true;
    this.saisies[id].forEach((s, k) => {
      const j = E.juste(this, k, s.w);
      s.w.marquer(j);
      if (!j) ok = false;
    });
    return ok;
  };
  Exercice.prototype.figer = function (id, solution) {
    const E = this.ETAPES[id];
    this.saisies[id].forEach((s, k) => {
      if (solution) { E.solution(this, k, s.w); s.w.marquer(true); }
      s.w.activer(false);
    });
    this.apercu(id, true);
  };

  Exercice.prototype.verifierEtape = function (id) {
    const moi = this, z = this.zones[id], E = this.ETAPES[id];
    const ret = z.querySelector('[data-x="retour"]'), act = z.querySelector('[data-x="actions"]');
    if (this.fini) return;
    if (this.controler(id)) {
      z.dataset.faite = 1;
      this.figer(id);
      ret.innerHTML = `<div class="callout-success er-retour"><p><b class="er-ok">C'est juste !</b>${this.messageReussite(id)}</p></div>`;
      act.innerHTML = '';
      this.suite(id);
      return;
    }
    const n = +z.dataset.erreurs + 1;
    z.dataset.erreurs = n;
    this.erreurs++;
    ret.innerHTML = `<div class="callout-danger er-retour"><p><b class="er-ko">Pas tout à fait.</b> Les cases en rouge sont à corriger.</p><p>${E.aide(this)}</p></div>`;
    if (n >= 2 && !act.querySelector('[data-x="voir"]')) {
      act.insertAdjacentHTML('beforeend', '<button type="button" class="btn-secondary" data-x="voir">Afficher la réponse</button>');
      act.querySelector('[data-x="voir"]').onclick = () => {
        if (moi.fini) return;
        moi.vue = true;
        z.dataset.faite = 1;
        moi.figer(id, true);
        ret.innerHTML = `<div class="callout er-retour"><p><b>Voici la réponse.</b>${moi.messageReussite(id)}</p></div>`;
        act.innerHTML = '';
        moi.suite(id);
      };
    }
    z.querySelector('[data-x="saisies"]').classList.remove('er-secoue'); void z.offsetWidth;
    z.querySelector('[data-x="saisies"]').classList.add('er-secoue');
  };

  // Phrase d'explication après une étape réussie
  Exercice.prototype.messageReussite = function (id) {
    const c = this.cfg, k = this.k, u = c.unite === 'mol' ? ' mol' : '';
    if (id === 'concl') {
      return ` La plus petite valeur est x<sub>max</sub> = ${fmt(k.xmax, c.mode)}${u} : le réactif limitant est <b>${fH(c.r[k.L])}</b>.`;
    }
    if (id === 'final') return ` Le réactif limitant ${fH(c.r[k.L])} est entièrement consommé.`;
    return '';
  };

  // Étape suivante (mode guidé), frise animée après la conclusion
  Exercice.prototype.suite = function (id) {
    const moi = this, c = this.cfg, i = c.etapes.indexOf(id);
    const apres = () => {
      if (moi.fini) return;                       // tout a été affiché entre-temps (toutMontrer)
      if (i + 1 < c.etapes.length) {
        moi.ouvrirEtape(i + 1);
        moi.dessinerTableau();
        const z = moi.zones[c.etapes[i + 1]];
        if (z.scrollIntoView) setTimeout(() => z.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 50);
      } else if (c.onFini) c.onFini(moi.erreurs, moi.vue);
    };
    if (id === 'concl' && c.frise) animerFrise(this.zones.concl.querySelector('[data-x="frise"]'), this.murs, c.mode, () => {
      if (moi.fini) return;
      // la frise est redessinée à chaque image : l'ancienne légende a disparu, on met la nouvelle
      moi.zones.concl.querySelector('[data-x="frise"]').insertAdjacentHTML('afterbegin', '<p class="av-frise-legende">L\'avancement part de 0 et s\'arrête au premier mur rencontré : c\'est x<sub>max</sub>.</p>');
      apres();
    });
    else apres();
  };

  // Mode guidé : affiche d'un coup la réponse de toutes les étapes qui restent
  // (« Afficher la réponse » d'un « À toi » de cours). Les étapes déjà réussies ne changent pas.
  Exercice.prototype.toutMontrer = function () {
    if (this.fini) return;
    this.fini = true; this.vue = true;
    const c = this.cfg;
    c.etapes.forEach((id, i) => {
      if (!this.zones[id]) this.ouvrirEtape(i);
      const z = this.zones[id];
      if (id === 'concl' && c.frise) {
        const f = z.querySelector('[data-x="frise"]');
        frise(f, this.murs, this.k.xmax, c.mode);
        f.insertAdjacentHTML('afterbegin', '<p class="av-frise-legende">L\'avancement part de 0 et s\'arrête au premier mur rencontré : c\'est x<sub>max</sub>.</p>');
      }
      if (z.dataset.faite) return;
      z.dataset.faite = 1;
      this.figer(id, true);
      z.querySelector('[data-x="retour"]').innerHTML = `<div class="callout er-retour"><p><b>Voici la réponse.</b>${this.messageReussite(id)}</p></div>`;
      z.querySelector('[data-x="actions"]').innerHTML = '';
    });
    this.dessinerTableau();
  };

  // Mode évaluation : un seul bouton « Valider » pour tout le tableau
  Exercice.prototype.actionsEvaluation = function () {
    const moi = this, c = this.cfg, bas = this.el.querySelector('[data-x="bas"]');
    bas.innerHTML = `<div data-x="retour"></div><div class="er-actions"><button type="button" class="btn-primary" data-x="valider">Valider</button>
      <button type="button" class="btn-secondary" data-x="voir">Afficher la réponse</button></div>`;
    const ret = bas.querySelector('[data-x="retour"]');
    bas.querySelector('[data-x="valider"]').onclick = () => {
      if (moi.fini) return;
      const faux = c.etapes.filter(id => !moi.controler(id));
      if (!faux.length) {
        moi.fini = true;
        c.etapes.forEach(id => moi.figer(id));
        bas.querySelector('.er-actions').innerHTML = '';
        if (c.onFini) c.onFini(moi.erreurs, false, ret);
        return;
      }
      moi.erreurs++;
      ret.innerHTML = `<div class="callout-danger er-retour"><p><b class="er-ko">Pas encore.</b> À corriger : ${liste(faux.map(id => moi.titre(id).toLowerCase()))}.</p>` +
        faux.map(id => `<p>• ${moi.ETAPES[id].aide(moi)}</p>`).join('') + '</div>';
    };
    bas.querySelector('[data-x="voir"]').onclick = () => {
      if (moi.fini) return;
      moi.fini = true; moi.vue = true;
      c.etapes.forEach(id => moi.figer(id, true));
      bas.querySelector('.er-actions').innerHTML = '';
      if (c.onFini) c.onFini(moi.erreurs, true, ret);
    };
  };

  // Mise à jour d'une ligne du tableau à partir des saisies
  Exercice.prototype.apercu = function (id, fige) {
    const E = this.ETAPES[id], c = this.cfg, k = this.k, ligne = { initial: 'initial', pont: 'pont', cours: 'cours', final: 'final' }[id];
    if (ligne && E.texte) {
      this.saisies[id].forEach((s, j) => {
        let t = E.texte(this, j, s.w);
        if (fige && id === 'final' && c.mode !== 'puissance') {
          t = (c.n0[j] || k.signe(j) === '−' ? `${fmt(c.n0[j], c.mode)} ${k.signe(j)} ` : '') + `${c.c[j] > 1 ? c.c[j] + ' × ' : ''}${fmt(k.xmax, c.mode)} = <b>${fmt(k.nf[j], c.mode)}</b>`;
          if (!c.n0[j] && c.c[j] === 1 && k.signe(j) === '+') t = `<b>${fmt(k.nf[j], c.mode)}</b>`;
        }
        this.cases[ligne + '-' + j] = { t, fige: !!fige };
      });
    }
    if (id === 'concl' && fige) this.cases.xmax = fmt(k.xmax, c.mode);
    this.dessinerTableau();
  };

  Exercice.prototype.dessinerTableau = function () {
    if (this.cfg.sansTableau) return;
    const c = this.cfg, k = this.k, esp = k.esp, guide = c.guide;
    const ouvert = id => !c.etapes.includes(id) || this.saisies[id];
    // contenu d'une case : saisie de l'élève, ou valeur donnée si l'étape n'est pas demandée
    const cas = (ligne, j, donne) => {
      if (!c.etapes.includes(ligne)) return donne;
      const v = this.cases[ligne + '-' + j];
      if (!this.saisies[ligne]) return '';
      return v ? `<span class="${v.fige ? 'fige' : 'brouillon'}">${v.t}</span>` : '<span class="vide">…</span>';
    };
    const tete = `<tr><th>État</th><th><span class="av-long">Avancement</span><span class="av-court">Av.</span></th>${enteteEspeces(c, c.molecules)}</tr>`;
    let corps = `<tr><td class="etat">initial</td><td class="x">0</td>${esp.map((_, j) => `<td>${cas('initial', j, fmt(c.n0[j], c.mode))}</td>`).join('')}</tr>`;
    if (c.etapes.includes('pont') && ouvert('pont')) {
      corps += `<tr class="pont"><td class="etat">à chaque fois</td><td class="x">+1</td>${esp.map((_, j) => `<td>${cas('pont', j, '')}</td>`).join('')}</tr>`;
    }
    if (ouvert('cours')) corps += `<tr><td class="etat">en cours</td><td class="x">x</td>${esp.map((_, j) => `<td>${cas('cours', j, `${fmt(c.n0[j], c.mode)} ${k.signe(j)} ${coefX(c.c[j])}x`)}</td>`).join('')}</tr>`;
    if (!guide || this.saisies.final || this.saisies.hyp || this.saisies.concl) {
      corps += `<tr class="final"><td class="etat">final</td><td class="x">x<sub>max</sub>${this.cases.xmax ? ' = ' + this.cases.xmax : ''}</td>${esp.map((_, j) => `<td>${cas('final', j, '')}</td>`).join('')}</tr>`;
    }
    const t = this.el.querySelector('[data-x="tab"]');
    t.innerHTML = `<table class="av-tab"><thead>${tete}</thead><tbody>${corps}</tbody></table>` +
      `<p class="av-tab-unite">en ${c.unite === 'mol' ? 'mol' : 'nombre de molécules'}</p>`;
  };

  // En-tête du tableau : l'équation de la réaction, avec « + » et « → » entre les colonnes
  function enteteEspeces(q, molecules) {
    const esp = q.r.concat(q.p), nR = q.r.length;
    return esp.map((f, j) => {
      const op = j === 0 ? '' : j === nR ? 'av-op av-op-fleche' : 'av-op av-op-plus';
      return `<th class="av-esp ${op}">${molecules ? `<div class="av-tete-mol">${molecule(f)}</div>` : ''}<span class="av-esp-f">${(q.c[j] > 1 ? q.c[j] + '&nbsp;' : '') + fH(f)}</span></th>`;
    }).join('');
  }

  /* ============================================================
     ENTRAÎNEMENT NOTÉ : 10 questions, 2 points chacune
     opts = { app, badge, titre, intro, questions: () => [q…], suite: { href, label },
              exercice: {…options AV.Exercice} ou fonction (n° de question) → options,
              note: n° → texte affiché au-dessus de la question (facultatif) }
     chaque q = { nom, r, p, c, n0, mode }
     ============================================================ */
  function entrainement(opts) {
    const app = opts.app;
    let qs = [], idx = 0, score = 0, recap = [];
    function entete() {
      return `<div class="er-card"><span class="er-badge">${opts.badge}</span><h2 class="er-titre">${opts.titre}</h2>
        <p class="er-meta">Question ${idx + 1}/${qs.length} · Score : <b data-a="score">${score} pt${score > 1 ? 's' : ''}</b></p>
        <div class="progress-bar"><div class="progress-fill" style="width:${Math.round(idx / qs.length * 100)}%"></div></div></div>`;
    }
    function intro() {
      app.innerHTML = `<div class="er-card"><span class="er-badge">${opts.badge}</span><h2 class="er-titre">${opts.titre}</h2>${opts.intro}
        <div class="cle" style="margin:14px 0"><p><b class="cle-titre">Barème</b> · 10 questions de difficulté croissante, notées sur 20 :</p>
          <ul class="er-liste"><li><b>2 points</b> si tout est juste du premier coup ;</li><li><b>1 point</b> si tu y arrives après au moins une erreur ;</li><li><b>0 point</b> si tu affiches la réponse.</li></ul></div>
        <button type="button" class="btn-primary" data-a="go">Commencer →</button></div>`;
      app.querySelector('[data-a="go"]').onclick = demarrer;
    }
    function demarrer() { qs = opts.questions(); idx = 0; score = 0; recap = []; afficher(); }
    function afficher() {
      if (idx >= qs.length) return fin();
      const q = qs[idx];
      window.AV.question = q;                 // question en cours (utile pour vérifier l'application)
      app.innerHTML = entete() + `<div class="er-card">
        <p class="er-q-nom">${q.nom}</p>
        <p class="av-equation">${equationHTML(q)}</p>
        ${opts.note && opts.note(idx) ? `<p class="av-guide">${opts.note(idx)}</p>` : ''}
        <p class="er-consigne">${opts.enonce ? opts.enonce(q) : enonce(q)}</p>
        <div data-a="ex"></div><div class="er-actions" data-a="suite"></div></div>`;
      window.scrollTo(0, 0);
      const options = typeof opts.exercice === 'function' ? opts.exercice(idx) : opts.exercice;
      new Exercice(app.querySelector('[data-a="ex"]'), Object.assign({}, options, {
        r: q.r, p: q.p, c: q.c, n0: q.n0, mode: q.mode, unite: 'mol', guide: false,
        onFini: (erreurs, vue, ret) => {
          const p = vue ? 0 : erreurs ? 1 : 2;
          score += p; recap.push({ n: idx + 1, p });
          app.querySelector('[data-a="score"]').textContent = score + ' pt' + (score > 1 ? 's' : '');
          const K = calculer(q);
          ret.innerHTML = vue
            ? `<div class="callout er-retour"><p><b>Réponse affichée :</b> 0 point. Réactif limitant : ${fH(q.r[K.L])}, x<sub>max</sub> = ${fmt(K.xmax, q.mode)} mol.</p></div>`
            : `<div class="callout-success er-retour"><p><b class="er-ok">${erreurs ? 'C\'est juste !' : 'Bravo, tout est juste du premier coup !'}</b> +${p} point${p > 1 ? 's' : ''}</p><p>Réactif limitant : ${fH(q.r[K.L])}, x<sub>max</sub> = ${fmt(K.xmax, q.mode)} mol.</p></div>`;
          const s = app.querySelector('[data-a="suite"]'), der = idx === qs.length - 1;
          s.innerHTML = `<button type="button" class="btn-primary" disabled>${der ? 'Voir mon score →' : 'Question suivante →'}</button>`;
          const b = s.querySelector('button');
          setTimeout(() => { b.disabled = false; }, 450);
          b.onclick = () => { idx++; afficher(); };
        },
      }));
    }
    function enonce(q) {
      return `On mélange ${liste(q.r.map((f, k) => `${fmt(q.n0[k], q.mode)} mol de ${fH(f)}`))}. Complète le tableau d'avancement.`;
    }
    function fin() {
      const max = qs.length * 2, pct = Math.round(score / max * 100);
      window.SOM.marquer({ note: Math.round(score / max * 20 * 2) / 2 });   // meilleure note sur 20 (sommaire, accueil)
      const msg = score === max ? 'Tu maîtrises le tableau d\'avancement.' : pct >= 70 ? 'Très bien ! Encore un peu d\'entraînement pour le sans-faute.'
        : pct >= 50 ? 'Pas mal ! Recommence : les questions changent à chaque fois.' : 'Continue à t\'entraîner. Tu peux revoir les modules précédents.';
      app.innerHTML = `<div class="er-card er-fin"><span class="er-badge">${opts.badge}</span><h2 class="er-titre">Entraînement terminé !</h2>
        ${score === max ? '<p class="er-trophee">🏆 Sans-faute !</p>' : ''}
        <div class="er-score">${score} / ${max}</div><p class="er-score-pct">${pct} %</p><p class="er-contexte">${msg}</p>
        <div class="er-recap">${recap.map(r => `<div class="${r.p === 2 ? 'ok' : r.p === 1 ? 'moyen' : 'ko'}">Q${r.n}<b>${r.p}/2</b></div>`).join('')}</div>
        <div class="er-actions" style="justify-content:center"><button type="button" class="btn-secondary" data-a="re">↺ Recommencer avec d'autres questions</button>
        ${opts.suite ? `<a class="btn-primary" style="text-decoration:none" href="${opts.suite.href}">${opts.suite.label}</a>` : ''}</div></div>`;
      app.querySelector('[data-a="re"]').onclick = demarrer;
      window.scrollTo(0, 0);
      if (score === max) confettis();
    }
    intro();
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

  /* ============================================================
     OUTILS DES COURS PAR ÉTAPES (moteur commun assets/cours.js)
     ============================================================ */

  // Contenu d'une case de la ligne « état final » : calcul détaillé (sauf en puissances de 10)
  function caseFinale(q, K, j, mode) {
    if (mode === 'puissance') return `<b>${fmt(K.nf[j], mode)}</b>`;
    if (!q.n0[j] && q.c[j] === 1 && K.signe(j) === '+') return `<b>${fmt(K.nf[j], mode)}</b>`;
    return (q.n0[j] || K.signe(j) === '−' ? `${fmt(q.n0[j], mode)} ${K.signe(j)} ` : '') +
      `${q.c[j] > 1 ? q.c[j] + ' × ' : ''}${fmt(K.xmax, mode)} = <b>${fmt(K.nf[j], mode)}</b>`;
  }

  // Tableau d'avancement complet, déjà rempli (exemple traité)
  // o = { unite: 'molécules' | 'mol', mode, pont: ligne « à chaque fois », molecules: dessins en tête }
  function tableauHTML(q, o) {
    o = o || {};
    const K = calculer(q), mode = o.mode || 'decimal', f = v => fmt(v, mode);
    const tete = `<tr><th>État</th><th><span class="av-long">Avancement</span><span class="av-court">Av.</span></th>${enteteEspeces(q, o.molecules)}</tr>`;
    let corps = `<tr><td class="etat">initial</td><td class="x">0</td>${K.esp.map((_, j) => `<td>${f(q.n0[j])}</td>`).join('')}</tr>`;
    if (o.pont) corps += `<tr class="pont"><td class="etat">à chaque fois</td><td class="x">+1</td>${K.esp.map((s, j) => `<td>${K.signe(j)}${q.c[j]} ${fH(s)}</td>`).join('')}</tr>`;
    corps += `<tr><td class="etat">en cours</td><td class="x">x</td>${K.esp.map((_, j) => `<td>${f(q.n0[j])} ${K.signe(j)} ${coefX(q.c[j])}x</td>`).join('')}</tr>`;
    corps += `<tr class="final"><td class="etat">final</td><td class="x">x<sub>max</sub> = ${f(K.xmax)}</td>${K.esp.map((_, j) => `<td>${caseFinale(q, K, j, mode)}</td>`).join('')}</tr>`;
    return `<div class="av-tab-wrap"><table class="av-tab"><thead>${tete}</thead><tbody>${corps}</tbody></table>` +
      `<p class="av-tab-unite">en ${o.unite === 'mol' ? 'mol' : 'nombre de molécules'}</p></div>`;
  }

  // Bilan d'un tableau : réactif limitant, x_max et état final (solution d'un « À toi »)
  function bilanHTML(q, mode, unite) {
    const K = calculer(q), u = unite === 'mol' ? ' mol' : '';
    return `<p>Réactif limitant : <b>${fH(q.r[K.L])}</b> ; x<sub>max</sub> = ${fmt(K.xmax, mode)}${u}.</p>` +
      `<p>État final : ${K.esp.map((s, j) => `${fH(s)} : ${fmt(K.nf[j], mode)}`).join(' ; ')}${unite === 'mol' ? ' (en mol)' : ' (en molécules)'}.</p>`;
  }

  // Tableau guidé étape par étape dans un « À toi » : partie « perso » du moteur de cours.
  // cfg = options de AV.Exercice (r, p, c, n0, unite, mode, etapes, molecules, frise, sansTableau)
  // L'exercice garde ses propres aides ; « Afficher la réponse » du cours remplit tout ce qui reste.
  function partieExercice(cfg, q) {
    return {
      type: 'perso', q,
      solution: bilanHTML(cfg, cfg.mode, cfg.unite),
      monter(zone, api) {
        const ex = new Exercice(zone, Object.assign({}, cfg, {
          guide: true,
          onFini: (erreurs, vue) => {
            if (api.fini()) return;
            if (erreurs || vue) api.compterErreur();     // « C'est juste. » plutôt que « Juste ! »
            api.reussi();
          },
        }));
        return { montrer() { ex.toutMontrer(); } };
      },
    };
  }

  // Une ou plusieurs valeurs saisies avec les champs de l'application (« perso » du moteur de cours)
  // cfg = { mode: 'puissance' | 'decimal' | 'entier', champs: [{ lab, valeur, unite, aria }],
  //         diag(valeurs, justes) → diagnostic, q, solution }
  function partieValeurs(cfg) {
    return {
      type: 'perso', q: cfg.q, solution: cfg.solution,
      monter(zone, api) {
        const box = document.createElement('div');
        box.className = 'av-saisies';
        const ws = cfg.champs.map(ch => {
          const l = document.createElement('div');
          l.className = 'av-saisie';
          l.innerHTML = `${ch.lab ? `<span class="av-lab">${ch.lab}</span>` : ''}<span data-x="w"></span>${ch.unite ? `<span class="av-unite">${ch.unite}</span>` : ''}`;
          const w = champ(cfg.mode, { label: ch.aria || 'valeur', onChange: () => api.effacer() });
          l.querySelector('[data-x="w"]').replaceWith(w.el);
          box.appendChild(l);
          return w;
        });
        zone.appendChild(box);
        const act = document.createElement('div');
        act.className = 'er-actions crs-actions-partie';
        act.innerHTML = '<button type="button" class="btn-primary">Valider</button>';
        zone.appendChild(act);
        const fermer = () => { ws.forEach(w => w.activer(false)); act.remove(); };
        function valider() {
          if (api.fini()) return;
          const vs = ws.map(w => w.valeur());
          if (ws.some((w, k) => w.vide() || !isFinite(vs[k]))) {
            api.message(ws.length > 1 ? 'Complète toutes les cases (avec un nombre).' : 'Écris un nombre (avec une virgule si besoin).');
            return;
          }
          const ok = vs.map((v, k) => egal(v, cfg.champs[k].valeur));
          ws.forEach((w, k) => w.marquer(ok[k]));
          if (ok.every(Boolean)) { fermer(); api.reussi(); return; }
          const nb = ok.filter(o => !o).length;
          api.erreur((ws.length > 1 ? (nb > 1 ? 'Les cases en rouge sont fausses. ' : 'La case en rouge est fausse. ') : '') +
            ((cfg.diag && cfg.diag(vs, ok)) || 'Vérifie ton calcul.'));
          if (window.COURS) window.COURS.secouer(box);
        }
        act.querySelector('button').onclick = valider;
        // Entrée = Valider
        box.querySelectorAll('input').forEach(i => i.addEventListener('keydown', e => { if (e.key === 'Enter') valider(); }));
        return { montrer() { ws.forEach((w, k) => { w.fixer(cfg.champs[k].valeur); w.marquer(true); }); fermer(); } };
      },
    };
  }

  /* ---------- Plan de l'application et navigation (voir assets/sommaire.js) ---------- */
  const PLAN = [
    { n: 1, titre: 'Les nombres stœchiométriques en action', desc: 'Seconde · des molécules réagissent pas à pas, le réactif limitant', fiche: 'fiche_1',
      parties: [{ nom: 'Les nombres stœchiométriques en action', cours: 'module_1' }] },
    { n: 2, titre: 'Le tableau d\'avancement', desc: 'Seconde · l\'avancement x, le tableau ligne par ligne, x<sub>max</sub>', fiche: 'fiche_2',
      parties: [{ nom: 'Le tableau d\'avancement', cours: 'module_2' }] },
    { n: 3, titre: 'Des molécules aux moles', desc: 'Seconde · le même tableau en mol, nombres entiers puis décimaux', fiche: 'fiche_3',
      parties: [{ nom: 'Des molécules aux moles', cours: 'module_3' }] },
    { n: 4, titre: 'Entraînement', desc: 'Seconde · 10 tableaux d\'avancement notés sur 20',
      parties: [{ nom: 'Entraînement', entrainement: 'module_4' }] },
    { n: 5, titre: 'Avec des puissances de 10', desc: 'Première · quantités comme 6,0 × 10<sup>−3</sup> mol, réactions entre ions', fiche: 'fiche_5',
      parties: [{ nom: 'Avec des puissances de 10', cours: 'module_5' }] },
    { n: 6, titre: 'Entraînement', desc: 'Première · 10 tableaux avec des puissances de 10, notés sur 20',
      parties: [{ nom: 'Entraînement', entrainement: 'module_6' }] },
    { n: 7, titre: 'Aller plus loin : sans tableau', desc: 'Première · n<sub>initial</sub> ÷ nombre stœchiométrique, puis l\'état final', fiche: 'fiche_7',
      parties: [{ nom: 'Sans tableau', cours: 'module_7', entrainement: 'module_7_entrainement' }] },
  ];
  window.SOM.init({ nom: 'Avancement d\'une réaction', id: 'avancement-reaction', plan: PLAN });
  const menu = cle => window.SOM.menu(cle);
  const accueil = zone => window.SOM.accueil(zone);

  // Tirage aléatoire sans remise
  function melanger(t) {
    const a = t.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }

  window.AV = {
    fmt, lire, egal, puissance, champ, expression, calculer, equationHTML, enteteEspeces, frise, animerFrise, texteUni,
    Simulation, Exercice, entrainement, confettis, menu, accueil, PLAN, melanger, COUL,
    tableauHTML, bilanHTML, partieExercice, partieValeurs,
  };
})();
