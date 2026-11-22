/* ============================================================
   Calcul numérique — écriture des nombres et saisie au pavé (objet CN.N)
   ------------------------------------------------------------
   Rôle :
     - écriture française des nombres (virgule, espace insécable des milliers,
       moins typographique), écriture a × 10ⁿ en HTML ;
     - calculs sûrs sur les décimaux (arrondi à n chiffres significatifs,
       décomposition a × 10ⁿ, comparaison avec tolérance relative) ;
     - champ de saisie d'un nombre « a × 10ⁿ » sans clavier du téléphone :
       un pavé à l'écran (chiffres, virgule, −, ×10ⁿ, effacer, valider) ;
       sur ordinateur, le clavier marche aussi (4,5e-3, 4,5*10^-3, 10^3).
   API :
     CN.N.hasard(liste), CN.N.entre(a, b), CN.N.melanger(liste)
     CN.N.nb(x)            « 3 200 », « 0,0045 » (écriture décimale, jamais 1e-9)
     CN.N.ent(n)           entier avec le moins typographique
     CN.N.p10(n)           « 10<sup>n</sup> »
     CN.N.ecr(a, n)        « a × 10<sup>n</sup> » (ou a seul si n = 0 et sans10)
     CN.N.sci(x, cs)       écriture scientifique de x (cs chiffres significatifs, facultatif)
     CN.N.arrondi(x, cs)   x arrondi à cs chiffres significatifs (nombre)
     CN.N.txtCS(x, cs)     x écrit avec exactement cs chiffres significatifs (décimal, zéros gardés)
     CN.N.decompose(x)     { a, n } avec 1 ≤ a < 10
     CN.N.egal(a, b, rel)  égalité à la tolérance relative rel près (1e-9 par défaut)
     CN.N.compteCS(texte)  chiffres significatifs d'un nombre écrit (« 0,0450 » → 3)
     new CN.N.Champ(opts)  champ de saisie : { el, lire(), vider(), touche(k), fin(), entier }
     CN.N.pave(cible)      pavé à l'écran, qui écrit dans cible.champ (élément)
   ============================================================ */
(function () {
  'use strict';
  const CN = window.CN = window.CN || {};
  const NB = ' ', MOINS = '−';

  /* ---------- Hasard ---------- */
  const hasard = l => l[Math.floor(Math.random() * l.length)];
  const entre = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  function melanger(l) {
    const r = l.slice();
    for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; }
    return r;
  }

  /* ---------- Écriture ---------- */
  const ent = n => String(n).replace('-', MOINS);
  const p10 = n => '10<sup>' + ent(n) + '</sup>';
  // écriture décimale d'un nombre, sans notation « e » : chiffres et position de la virgule
  function chiffres(x) {
    // 12 chiffres significatifs au plus : efface les restes des calculs en virgule flottante
    const t = Math.abs(x).toPrecision(12);
    const m = /^(\d)(?:\.(\d+))?(?:e([+-]\d+))?$/.exec(t);
    let d, e;
    if (m) { d = m[1] + (m[2] || ''); e = m[3] ? parseInt(m[3], 10) : 0; }
    else {                                   // forme « 123.456 » (sans e)
      const [i, f] = t.split('.');
      const brut = (i + (f || '')).replace(/^0+/, '');
      d = brut; e = i.replace(/^0+/, '').length - 1;
      if (!i.replace(/^0+/, '').length) e = -((f || '').match(/^0*/)[0].length + 1);
    }
    d = d.replace(/0+$/, '') || '0';
    return { d, e };                          // x = 0,d × 10^(e+1) : premier chiffre au rang 10^e
  }
  // groupe les chiffres par 3 (espace insécable)
  const grouper = s => s.replace(/\B(?=(\d{3})+(?!\d))/g, NB);
  function nb(x) {
    if (x === 0) return '0';
    const s = x < 0 ? MOINS : '';
    const { d, e } = chiffres(x);
    let ent0, dec;
    if (e >= 0) {
      ent0 = d.slice(0, e + 1).padEnd(e + 1, '0');
      dec = d.slice(e + 1);
    } else {
      ent0 = '0';
      dec = '0'.repeat(-e - 1) + d;
    }
    // partie décimale groupée par 3 quand elle est longue (0,000 405)
    if (dec.length > 4) dec = dec.replace(/(\d{3})(?=\d)/g, '$1' + NB);
    return s + grouper(ent0) + (dec ? ',' + dec : '');
  }
  function ecr(a, n, sans10) {
    if (n === 0 && sans10) return nb(a);
    return nb(a) + ' × ' + p10(n);
  }
  function decompose(x) {
    if (x === 0) return { a: 0, n: 0 };
    let n = Math.floor(Math.log10(Math.abs(x)));
    let a = +(x / Math.pow(10, n)).toPrecision(12);
    if (Math.abs(a) >= 10) { a = +(a / 10).toPrecision(12); n++; }
    if (Math.abs(a) < 1) { a = +(a * 10).toPrecision(12); n--; }
    return { a, n };
  }
  const arrondi = (x, cs) => +(+x).toPrecision(cs);
  // x avec exactement cs chiffres significatifs, en écriture décimale (zéros finaux gardés)
  function txtCS(x, cs) {
    const r = arrondi(x, cs), { n } = decompose(r);
    const decs = Math.max(0, cs - 1 - n);
    let t = Math.abs(r).toFixed(decs);
    let [i, f] = t.split('.');
    if (f && f.length > 4) f = f.replace(/(\d{3})(?=\d)/g, '$1' + NB);
    return (r < 0 ? MOINS : '') + grouper(i) + (f ? ',' + f : '');
  }
  // écriture scientifique ; cs : chiffres significatifs gardés (zéros finaux compris)
  function sci(x, cs) {
    const v = cs ? arrondi(x, cs) : x;
    const { a, n } = decompose(v);
    const ta = cs ? (() => { const t = Math.abs(a).toFixed(Math.max(0, cs - 1)); return (a < 0 ? MOINS : '') + t.replace('.', ','); })() : nb(a);
    return ta + ' × ' + p10(n);
  }
  const egal = (a, b, rel) => {
    rel = rel == null ? 1e-9 : rel;
    if (b === 0) return Math.abs(a) < 1e-12;
    return Math.abs(a - b) <= rel * Math.abs(b) + 1e-15;
  };
  // chiffres significatifs d'une mantisse écrite (« 0,0450 » → 3 ; « 4 500 » → 4)
  function compteCS(t) {
    const s = String(t).replace(/[^\d,.]/g, '').replace('.', ',');
    const ch = s.replace(',', '').replace(/^0+/, '');
    return ch.length;
  }

  /* =====================================================================
     Champ de saisie « a × 10ⁿ »
     Le nombre est fait de deux zones : la mantisse (m) et l'exposant (e, null sans × 10ⁿ).
     On écrit toujours à la fin de la zone en cours ; ⌫ efface dans l'ordre inverse.
     Une mantisse vide avec un exposant vaut 1 : « 10ⁿ ».
     ===================================================================== */
  function Champ(opts) {
    opts = opts || {};
    this.entier = !!opts.entier;           // exposant ou nombre entier seul : ni virgule ni × 10ⁿ
    this.m = ''; this.e = null; this.zone = 'm'; this.actif = true;
    this.surValider = opts.surValider || function () {};
    this.surChange = opts.surChange || function () {};
    const el = this.el = document.createElement('span');
    el.className = 'cn-champ' + (this.entier ? ' cn-champ-ent' : '');
    el.tabIndex = 0;
    el.setAttribute('role', 'textbox');
    el.setAttribute('aria-label', opts.label || 'Ta réponse');
    // sur un écran tactile, le champ n'ouvre jamais le clavier du téléphone : on écrit avec le pavé
    el.setAttribute('inputmode', 'none');
    el.addEventListener('keydown', ev => this.clavier(ev));
    this.dessiner();
  }
  Champ.prototype.dessiner = function () {
    const vide = !this.m && this.e === null;
    let h;
    const m = this.m.replace('-', MOINS);
    if (vide) h = '<span class="cn-c-m cn-vide' + (this.zone === 'm' ? ' cn-ici' : '') + '">?</span>';
    else {
      h = this.e === null || this.m ? '<span class="cn-c-m' + (this.zone === 'm' ? ' cn-ici' : '') + '">' + m + '</span>' : '';
      if (this.e !== null) {
        h += (this.m ? '<span class="cn-c-x"> × </span>' : '') + '<span class="cn-c-10">10</span><sup class="cn-c-e' + (this.zone === 'e' ? ' cn-ici' : '') + (this.e === '' ? ' cn-vide' : '') + '">' +
          (this.e === '' ? '□' : this.e.replace('-', MOINS)) + '</sup>';
      }
    }
    this.el.innerHTML = h;
    this.el.setAttribute('aria-label', 'Ta réponse : ' + (vide ? 'vide' : this.texte()));
  };
  // texte lisible de la saisie (aria-label, diagnostics)
  Champ.prototype.texte = function () {
    const m = this.m.replace('-', MOINS);
    if (this.e === null) return m;
    return (this.m ? m + ' × ' : '') + '10 puissance ' + (this.e ? this.e.replace('-', MOINS) : '(exposant à écrire)');
  };
  Champ.prototype.touche = function (k) {
    if (!this.actif) return;
    const z = this.zone;
    let t = z === 'm' ? this.m : this.e;
    if (/^\d$/.test(k)) {
      if (z === 'e' && t.replace('-', '').length >= 3) return;
      if (z === 'm' && t.replace(/[-,]/g, '').length >= 14) return;
      t += k;
    } else if (k === ',') {
      if (this.entier || z === 'e' || t.indexOf(',') >= 0) return;
      t = (t === '' || t === '-' ? t + '0' : t) + ',';
    } else if (k === '-') {
      t = t.charAt(0) === '-' ? t.slice(1) : '-' + t;
    } else if (k === 'p10') {
      if (this.entier) return;
      if (this.e === null) { this.e = ''; }
      this.zone = 'e';
      this.dessiner(); this.surChange();
      return;
    } else if (k === 'eff') {
      if (z === 'e') {
        if (t === '') { this.e = null; this.zone = 'm'; this.dessiner(); this.surChange(); return; }
        t = t.slice(0, -1);
      } else t = t.slice(0, -1);
    } else if (k === 'vider') {
      this.m = ''; this.e = null; this.zone = 'm'; this.dessiner(); this.surChange(); return;
    } else if (k === 'valider') { this.surValider(); return; }
    else return;
    if (z === 'm') this.m = t; else this.e = t;
    this.dessiner(); this.surChange();
  };
  // clavier de l'ordinateur
  Champ.prototype.clavier = function (ev) {
    if (!this.actif || ev.ctrlKey || ev.metaKey || ev.altKey) return;
    const k = ev.key;
    let t = null;
    if (/^\d$/.test(k)) t = k;
    else if (k === ',' || k === '.') t = ',';
    else if (k === '-' || k === '−' || k === '_') t = '-';
    else if (k === 'e' || k === 'E' || k === '*' || k === 'x' || k === '×') t = 'p10';
    else if (k === '^') {
      // « 10^3 » : le 10 tapé est la base de la puissance, pas une mantisse
      if (this.e === null && (this.m === '10' || this.m === '-10')) this.m = this.m === '10' ? '' : '-';
      t = 'p10';
    }
    else if (k === 'Backspace') t = 'eff';
    else if (k === 'Delete' || k === 'Escape') t = 'vider';
    else if (k === 'Enter') t = 'valider';
    else if (k === 'ArrowLeft') { if (this.zone === 'e') { this.zone = 'm'; this.dessiner(); } ev.preventDefault(); return; }
    else if (k === 'ArrowRight' || k === 'ArrowUp') { if (this.e !== null) { this.zone = 'e'; this.dessiner(); } ev.preventDefault(); return; }
    if (t === null) return;
    ev.preventDefault();
    this.touche(t);
  };
  /* Lecture : { vide } | { erreur: message de format } | { v, m, e, cs, sci, dec }
     v valeur ; e exposant (null sans 10ⁿ) ; cs chiffres significatifs écrits (csMin : sans les zéros
     finaux d'un entier, qui peuvent compter ou non) ;
     sci : écriture scientifique (1 ≤ |a| < 10) ; dec : écriture décimale (sans 10ⁿ) */
  Champ.prototype.lire = function () {
    let m = this.m;
    if (!m && this.e === null) return { vide: true, erreur: 'Écris ta réponse avec le pavé.' };
    if (this.e === '' || this.e === '-') return { erreur: 'Écris l’exposant de la puissance de 10.' };
    if (m === '-' && this.e === null) return { erreur: 'Écris un nombre après le signe −.' };
    let neg = false;
    if (m.charAt(0) === '-') { neg = true; m = m.slice(1); }
    if (m.slice(-1) === ',') m = m.slice(0, -1);
    const a = m === '' ? 1 : parseFloat(m.replace(',', '.'));
    if (isNaN(a)) return { erreur: 'Écris un nombre (avec une virgule si besoin).' };
    const e = this.e === null ? null : parseInt(this.e, 10);
    const sa = neg ? -a : a;
    const v = e === null ? sa : +(sa * Math.pow(10, e)).toPrecision(14);
    const cs = m === '' ? 1 : Math.max(1, compteCS(m));
    // entier sans virgule terminé par des zéros (« 4 500 ») : ces zéros peuvent compter ou non
    const csMin = m === '' ? 1 : m.indexOf(',') < 0 ? Math.max(1, compteCS(m.replace(/0+$/, '') || '0')) : cs;
    const sciOk = e !== null ? (a >= 1 && a < 10) : (Math.abs(sa) >= 1 && Math.abs(sa) < 10);
    return { v, m: (neg ? '-' : '') + m, mant: sa, e, cs, csMin, sci: sciOk, dec: e === null };
  };
  Champ.prototype.vider = function () { this.touche('vider'); };
  Champ.prototype.fin = function () { this.actif = false; this.el.classList.add('cn-fige'); this.el.tabIndex = -1; };

  /* ---------- Pavé à l'écran ---------- */
  // [clé, libellé accessible, contenu]
  const TOUCHES = [
    ['7'], ['8'], ['9'], ['eff', 'Effacer', '⌫'],
    ['4'], ['5'], ['6'], ['p10', 'Fois 10 puissance', '×10<sup>n</sup>'],
    ['1'], ['2'], ['3'], ['-', 'Signe moins', MOINS],
    ['0'], [',', 'Virgule', ','], ['vider', 'Tout effacer', 'C'], ['valider', 'Valider', 'Valider']
  ];
  function pave(cible) {
    const p = document.createElement('div');
    p.className = 'cn-pave';
    p.setAttribute('role', 'group');
    p.setAttribute('aria-label', 'Pavé de saisie');
    const bts = [];
    TOUCHES.forEach(t => {
      const k = t[0];
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'cn-t' + (k === 'valider' ? ' cn-t-ok' : k === 'p10' ? ' cn-t-p10' : /^\d$/.test(k) || k === ',' ? '' : ' cn-t-nav');
      b.innerHTML = t[2] || k;
      b.dataset.k = k;
      if (t[1]) { b.setAttribute('aria-label', t[1]); b.title = t[1]; }
      // le pavé ne prend pas le focus : le champ le garde (clavier de l'ordinateur toujours actif)
      b.addEventListener('mousedown', e => e.preventDefault());
      b.addEventListener('click', () => {
        const c = cible.champ;
        if (!c) return;
        c.touche(k);
        if (k !== 'valider' && matchMedia('(hover: hover)').matches && c.actif && c.el.isConnected) c.el.focus({ preventScroll: true });
      });
      bts.push(b);
      p.appendChild(b);
    });
    // nombre entier (exposant seul) : virgule et × 10ⁿ inutiles
    p.majChamp = () => {
      const c = cible.champ, ent0 = !!(c && c.entier);
      bts.forEach(b => { if (b.dataset.k === ',' || b.dataset.k === 'p10') b.disabled = ent0; });
    };
    return p;
  }

  CN.N = { hasard, entre, melanger, nb, ent, p10, ecr, sci, arrondi, txtCS, decompose, egal, compteCS, Champ, pave, NB, MOINS };
})();
