/* ============================================================
   Équations de l'application « pH »

   Manipulation d'une équation par glisser-déposer, avec les mêmes
   éléments que l'application « Équations en physique » :
     - tuiles des grandeurs (déplacer, cliquer pour supprimer),
     - barre de fraction ··· / ··· à glisser sur un membre,
     - outils ×(−1), 10ˣ et log à glisser sur UN membre à la fois
       (une opération se fait toujours sur les deux membres),
     - dénominateur à glisser de l'autre côté (il multiplie),
     - ⇄ pour inverser le sens de l'équation,
     - « Vérifier l'étape » : l'équation est testée avec des valeurs
       numériques ; chaque étape juste s'ajoute à l'historique.

   Modèle d'un membre :
     produit  { k:'p', neg, f:[facteur…] }    signe − éventuel devant
     facteur  { k:'s', t:[tuile…] }            case de tuiles (produit de grandeurs)
              { k:'f', num, den, croix }       fraction (num et den sont des produits)
              { k:'fn', fn:'log'|'p10', x }    fonction (contenu figé)
     tuile    { id, label, v }                 v : valeur d'une constante (1, 10, 2…)

   PH.EQ.{T, S, P, F, FN}   constructeurs
   PH.EQ.statique(n)        écriture « mathématique » d'un membre (HTML)
   PH.EQ.ligne(L, R)        équation écrite (HTML)
   PH.demo(zone, cfg)       démonstration visuelle étape par étape (cours)
   new PH.Editeur(zone, cfg) éditeur par glisser-déposer
   ============================================================ */
(function () {
  'use strict';

  const MOINS = '−';
  const cloner = o => JSON.parse(JSON.stringify(o));

  /* ---------- Constructeurs ---------- */
  const T = (id, label, v) => (v == null ? { id, label } : { id, label, v });
  const S = (...t) => ({ k: 's', t: t.map(x => Object.assign({}, x)) });
  const P = (f, neg) => ({ k: 'p', neg: !!neg, f: Array.isArray(f) ? f : [f] });
  const enP = n => (n.k === 'p' ? n : P([n]));
  const F = (num, den) => ({ k: 'f', num: enP(num), den: enP(den) });
  const FN = (fn, x) => ({ k: 'fn', fn, x: enP(x) });
  const UN = T('one', '1', 1);

  /* ============================================================
     ÉCRITURE STATIQUE (historique, démonstrations, énoncés)
     ============================================================ */
  function contientFrac(n) {
    if (n.k === 'f') return true;
    if (n.k === 'p') return n.f.some(contientFrac);
    return false;
  }
  function statique(n, inline) {
    switch (n.k) {
      case 'p':
        return (n.neg ? '<span class="m-moins">−</span>' : '') +
          (n.f.length ? n.f.map(x => statique(x, inline)).join('<span class="m-x">×</span>') : '<span class="m-vide">…</span>');
      case 's':
        return n.t.length ? n.t.map(t => `<span class="m-v">${t.label}</span>`).join('<span class="m-x">×</span>') : '<span class="m-vide">…</span>';
      case 'f': {
        if (inline) {
          const par = p => p.neg || p.f.length > 1 || (p.f[0] && p.f[0].k === 's' && p.f[0].t.length > 1);
          const a = statique(n.num, true), b = statique(n.den, true);
          return `${par(n.num) ? `(${a})` : a}<span class="m-slash">/</span>${par(n.den) ? `(${b})` : b}`;
        }
        return `<span class="m-frac"><span class="m-num">${statique(n.num)}</span><span class="m-den">${statique(n.den)}</span></span>`;
      }
      case 'fn': {
        if (n.fn === 'log') {
          const g = !inline && contientFrac(n.x) ? ' grand' : '';
          return `<span class="m-fn">log</span><span class="m-par${g}">(</span>${statique(n.x, inline)}<span class="m-par${g}">)</span>`;
        }
        return `<span class="m-p10">10<sup class="m-exp">${statique(n.x, true)}</sup></span>`;
      }
    }
    return '';
  }
  const ligne = (L, R) => `<span class="m-ligne"><span class="m-expr">${statique(L)}</span><span class="m-egal">=</span><span class="m-expr">${statique(R)}</span></span>`;

  /* ============================================================
     DÉMONSTRATION ÉTAPE PAR ÉTAPE (cours)
     cfg.etapes = [{ L, R }, { op: '×(−1)' | null, centre: 'texte', texte, L, R }, …]
       op     : opération appliquée aux DEUX membres (flèches de chaque côté)
       centre : remarque au centre (⇄, simplification…)
       texte  : explication sous la ligne
     cfg.onFini() quand la dernière étape est affichée ; cfg.tout : tout afficher d'un coup
     ============================================================ */
  const FLECHE_G = '<svg viewBox="0 0 60 46" class="dm-svg" aria-hidden="true"><path d="M46,4 Q12,10 16,38" fill="none" stroke="currentColor" stroke-width="4.5" stroke-linecap="round"/><path d="M16,38 L7,26 M16,38 L25,29" fill="none" stroke="currentColor" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const FLECHE_D = FLECHE_G.replace('class="dm-svg"', 'class="dm-svg dm-svg-d"');
  function demo(zone, cfg) {
    const box = document.createElement('div');
    box.className = 'dm';
    box.innerHTML = '<div class="dm-grille"></div><div class="dm-actions"></div>';
    zone.appendChild(box);
    const g = box.querySelector('.dm-grille'), act = box.querySelector('.dm-actions');
    let i = 0;
    function lignes(e, premiere) {
      let h = '';
      if (!premiere) {
        if (e.op) h += `<div class="dm-op dm-new"><span class="dm-op-g"><b>${e.op}</b>${FLECHE_G}</span><span></span><span class="dm-op-d">${FLECHE_D}<b>${e.op}</b></span></div>`;
        if (e.centre) h += `<div class="dm-centre dm-new">${e.centre}</div>`;
      }
      h += `<div class="dm-l dm-new${e.final ? ' dm-final' : ''}"><span class="dm-g">${statique(e.L)}</span><span class="dm-eq">=</span><span class="dm-d">${statique(e.R)}</span></div>`;
      if (e.texte) h += `<div class="dm-texte dm-new">${e.texte}</div>`;
      return h;
    }
    function montrer(n) {
      g.querySelectorAll('.dm-new').forEach(x => x.classList.remove('dm-new'));
      g.insertAdjacentHTML('beforeend', lignes(cfg.etapes[n], n === 0));
    }
    function bouton() {
      act.innerHTML = '';
      if (i >= cfg.etapes.length - 1) { if (cfg.onFini) cfg.onFini(); return; }
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'btn-secondary';
      b.textContent = i === 0 ? 'Voir la première étape ↓' : 'Étape suivante ↓';
      b.onclick = () => { i++; montrer(i); bouton(); };
      act.appendChild(b);
    }
    montrer(0);
    if (cfg.tout) { while (i < cfg.etapes.length - 1) { i++; montrer(i); } g.querySelectorAll('.dm-new').forEach(x => x.classList.remove('dm-new')); }
    bouton();
    return box;
  }

  /* ============================================================
     ÉDITEUR PAR GLISSER-DÉPOSER
     cfg = {
       tuiles: [T(…)],                  grandeurs disponibles (palette si absentes de l'équation)
       gauche: () => P(…), droite: () => P(…),
       cible: 'c',                       grandeur à isoler (à gauche, seule)
       valeurs: () => ({ id: valeur }),  valeurs de test des grandeurs
       outils: ['neg', 'p10', 'log', 'frac'],
       aides: ['…', '…'],                coups de pouce, un par étape attendue
       solution: [{ L, R, op, centre }], étapes de la correction (affichée par montrerSolution)
       onErreur(), onResolu(nbErreurs)
     }
     ============================================================ */
  const NOMS_OUTILS = { neg: '×(−1)', p10: '10<sup>x</sup>', log: 'log', frac: 'la barre de fraction' };

  function Editeur(zone, cfg) {
    this.zone = zone;
    this.cfg = Object.assign({ outils: ['neg', 'p10', 'log', 'frac'] }, cfg);
    this.erreurs = 0;
    this.construire();
    this.recommencer();
  }

  Editeur.prototype.construire = function () {
    const moi = this;
    this.zone.innerHTML = `<div class="eq-ed">
      <div class="eq-ed-haut"><span class="eq-ed-t">Résolution</span><button type="button" class="eq-raz">↺ Recommencer</button></div>
      <div class="eq-hist"></div>
      <div class="eq-travail">
        <div class="eq-zone"></div>
        <p class="eq-pal-t">Glisse les éléments et les outils sur l'équation</p>
        <div class="eq-pal"></div>
        <div class="eq-ed-actions">
          <button type="button" class="btn-primary eq-verif">✓ Vérifier l'étape</button>
          ${this.cfg.aides ? '<button type="button" class="btn-small eq-aide">Un coup de pouce ?</button>' : ''}
        </div>
        <div class="eq-retour"></div>
      </div>
      <div class="eq-fin hidden"></div>
    </div>`;
    const $ = s => this.zone.querySelector(s);
    this.el = { hist: $('.eq-hist'), travail: $('.eq-travail'), zone: $('.eq-zone'), pal: $('.eq-pal'), retour: $('.eq-retour'), fin: $('.eq-fin'), raz: $('.eq-raz') };
    this.el.raz.onclick = () => { if (!moi.fini) moi.recommencer(); };
    $('.eq-verif').onclick = () => moi.verifier();
    const aide = $('.eq-aide');
    if (aide) aide.onclick = () => moi.coupDePouce();
  };

  Editeur.prototype.recommencer = function () {
    if (window.DragDrop) window.DragDrop.cleanupGhosts();
    this.etat = { L: this.cfg.gauche(), R: this.cfg.droite() };
    this.historique = [];
    this.outilsDepuis = { L: {}, R: {} };
    this.fini = false;
    this.message('');
    this.rafraichir();
    this.dessinerHistorique();
  };

  /* ---------- Accès aux nœuds par chemin : 'L', 'L.0', 'R.0.den.0'… ---------- */
  Editeur.prototype.noeud = function (chemin) {
    const parts = chemin.split('.');
    let n = this.etat[parts[0]];
    for (let i = 1; i < parts.length && n; i++) {
      const q = parts[i];
      if (n.k === 'p') n = n.f[+q];
      else if (n.k === 'f') n = n[q];
      else if (n.k === 'fn') n = n.x;
      else return null;
    }
    return n;
  };
  const parentDe = chemin => chemin.slice(0, chemin.lastIndexOf('.'));
  const dernier = chemin => chemin.slice(chemin.lastIndexOf('.') + 1);
  // chemin d'un objet du modèle (recherche dans l'arbre)
  Editeur.prototype.cheminDe = function (obj) {
    function chercher(n, ch) {
      if (n === obj) return ch;
      if (n.k === 'p') { for (let i = 0; i < n.f.length; i++) { const r = chercher(n.f[i], ch + '.' + i); if (r) return r; } }
      if (n.k === 'f') return chercher(n.num, ch + '.num') || chercher(n.den, ch + '.den');
      return null;
    }
    return chercher(this.etat.L, 'L') || chercher(this.etat.R, 'R');
  };

  /* ============================================================
     AFFICHAGE
     ============================================================ */
  Editeur.prototype.rendu = function (n, ch) {
    if (n.k === 'p') {
      let h = n.neg ? '<span class="eq-moins">−</span>' : '';
      const prem = n.f[0], der = n.f[n.f.length - 1];
      if (prem && prem.k !== 's') h += `<span class="insert-zone" data-path="${ch}" data-ou="debut"></span>`;
      h += n.f.map((x, i) => (i ? '<span class="mult-sign">×</span>' : '') + this.rendu(x, ch + '.' + i)).join('');
      if (der && der.k !== 's') h += `<span class="insert-zone" data-path="${ch}" data-ou="fin"></span>`;
      return `<span class="eq-prod">${h}</span>`;
    }
    if (n.k === 's') {
      const t = n.t.map((x, i) => (i ? '<span class="mult-sign">×</span>' : '') +
        `<span class="eq-tile" data-path="${ch}" data-idx="${i}"><span class="eq-lab">${x.label}</span><span class="tile-del" role="button" aria-label="Supprimer">✕</span></span>`).join('');
      return `<span class="slot-simple" data-path="${ch}">${t || '<span class="slot-placeholder">…</span>'}</span>`;
    }
    if (n.k === 'f') {
      const denUn = n.den.f.length === 1 && n.den.f[0].k === 's' && n.den.f[0].t.length === 1 && n.den.f[0].t[0].id === 'one';
      const denVide = n.den.f.length === 1 && n.den.f[0].k === 's' && n.den.f[0].t.length === 0;
      const croix = denUn || (denVide && n.croix);
      const deplacable = !denUn && !denVide;
      return `<span class="frac-wrap">
          <span class="frac-num-wrap">${this.rendu(n.num, ch + '.num')}</span>
          <span class="frac-line"></span>
          <span class="frac-den-wrap${deplacable ? ' den-draggable' : ''}" data-frac="${ch}">
            ${croix ? `<span class="frac-del" role="button" aria-label="Supprimer le dénominateur" data-frac="${ch}">✕</span>` : ''}
            ${this.rendu(n.den, ch + '.den')}
          </span>
        </span>`;
    }
    if (n.k === 'fn') return `<span class="fn-bloc">${statique(n)}</span>`;
    return '';
  };

  Editeur.prototype.rafraichir = function () {
    const moi = this, z = this.el.zone;
    if (window.DragDrop) window.DragDrop.cleanupGhosts();
    z.innerHTML = `<div class="eq-row">
        <div class="eq-side" data-side="L">${this.rendu(this.etat.L, 'L')}</div>
        <div class="eq-sign">=</div>
        <div class="eq-side" data-side="R">${this.rendu(this.etat.R, 'R')}</div>
      </div>
      <button type="button" class="flip-btn" title="Inverser le sens de l'équation" aria-label="Inverser le sens de l'équation">⇄</button>`;
    z.querySelector('.flip-btn').onclick = () => moi.inverser();
    // tuiles : glisser pour déplacer, toucher (tuile ou croix ✕) pour supprimer.
    // La croix ne bloque pas le glisser : sur un petit écran, le doigt la couvre souvent.
    const tuileDe = t => { const obj = t && moi.noeud(t.dataset.path); return obj ? { obj, tuile: obj.t[+t.dataset.idx] } : null; };
    z.querySelectorAll('.eq-tile').forEach(t => {
      if (t.closest('.den-draggable')) return;
      const x = tuileDe(t);
      if (!x || !x.tuile) return;
      moi.glisser(t, { type: 'tuile', s: x.obj, tuile: x.tuile }, () => moi.supprimer(x.obj, x.tuile));
    });
    // dénominateur entier : se glisse de l'autre côté ; toucher une de ses tuiles la supprime
    z.querySelectorAll('.den-draggable').forEach(d => {
      moi.glisser(d, { type: 'den', frac: moi.noeud(d.dataset.frac) }, cible => {
        const x = tuileDe(cible && cible.closest('.eq-tile'));
        if (x && x.tuile) moi.supprimer(x.obj, x.tuile);
      });
    });
    z.querySelectorAll('.frac-del').forEach(x => {
      x.addEventListener('pointerdown', e => e.stopPropagation());
      x.addEventListener('click', e => { e.stopPropagation(); moi.supprimerDen(moi.noeud(x.dataset.frac)); });
    });
    this.palette();
  };

  Editeur.prototype.palette = function () {
    const moi = this, pal = this.el.pal;
    pal.innerHTML = '';
    const present = id => this.compter(id) > 0;
    const tuiles = (this.cfg.tuiles || []).filter(t => !present(t.id)).concat(this.cfg.un === false ? [] : [UN]);
    tuiles.forEach(t => {
      const e = document.createElement('span');
      e.className = 'palette-tile';
      e.innerHTML = t.label;
      pal.appendChild(e);
      moi.glisser(e, { type: 'nouvelle', tuile: t });
    });
    this.cfg.outils.forEach(o => {
      const e = document.createElement('span');
      e.className = 'palette-tile func-tool' + (o === 'frac' ? ' palette-frac' : '');
      e.dataset.outil = o;
      e.innerHTML = o === 'frac' ? '<span class="dots">···</span><span class="frac-line"></span><span class="dots">···</span>' : NOMS_OUTILS[o];
      e.title = o === 'frac' ? 'Barre de fraction' : 'Appliquer ' + e.textContent + ' à un membre';
      pal.appendChild(e);
      moi.glisser(e, { type: 'outil', outil: o });
    });
  };

  Editeur.prototype.compter = function (id) {
    function c(n) {
      if (n.k === 's') return n.t.filter(t => t.id === id).length;
      if (n.k === 'p') return n.f.reduce((s, x) => s + c(x), 0);
      if (n.k === 'f') return c(n.num) + c(n.den);
      if (n.k === 'fn') return c(n.x);
      return 0;
    }
    return c(this.etat.L) + c(this.etat.R);
  };

  /* ============================================================
     GLISSER-DÉPOSER (assets/dragdrop.js : souris, doigt, stylet)
     ============================================================ */
  const ZONES = {
    tuile: '.eq-tile, .slot-simple, .insert-zone, .eq-side',
    nouvelle: '.eq-tile, .slot-simple, .insert-zone, .eq-side',
    den: '.eq-side',
    frac: '.slot-simple, .eq-side',
    outil: '.eq-side',
  };
  Editeur.prototype.glisser = function (e, data, auToucher) {
    const moi = this;
    let x0 = 0, y0 = 0, cible = null;
    e.addEventListener('pointerdown', ev => { x0 = ev.clientX; y0 = ev.clientY; cible = ev.target; });
    const sel = data.type === 'outil' ? (data.outil === 'frac' ? ZONES.frac : ZONES.outil) : ZONES[data.type];
    window.DragDrop.enable(e, {
      zoneSelector: sel,
      dragOverClass: 'drag-over',
      onStart: () => { moi.zone.classList.add('eq-glisse-' + (data.type === 'outil' ? (data.outil === 'frac' ? 'frac' : 'outil') : data.type)); },
      onDrop: (item, zone, ev) => {
        moi.zone.classList.remove('eq-glisse-tuile', 'eq-glisse-nouvelle', 'eq-glisse-den', 'eq-glisse-frac', 'eq-glisse-outil');
        if (moi.fini) return;
        const bouge = Math.hypot(ev.clientX - x0, ev.clientY - y0) > 8;
        if (!bouge) { if (auToucher) auToucher(cible); return; }
        if (zone) moi.deposer(data, zone);
      },
      onCancel: () => { moi.zone.classList.remove('eq-glisse-tuile', 'eq-glisse-nouvelle', 'eq-glisse-den', 'eq-glisse-frac', 'eq-glisse-outil'); },
    });
  };

  Editeur.prototype.deposer = function (data, zone) {
    if (data.type === 'tuile' || data.type === 'nouvelle') return this.deposerTuile(data, zone);
    const cote = zone.closest('.eq-side') && zone.closest('.eq-side').dataset.side;
    if (data.type === 'den') return this.deplacerDen(data.frac, cote);
    if (data.outil === 'frac') return this.outilFraction(zone);
    if (!cote) return;
    if (data.outil === 'neg') this.outilMoins(cote);
    else this.outilFonction(data.outil, cote);
  };

  // Dépôt d'une tuile (déplacée ou prise dans la palette)
  Editeur.prototype.deposerTuile = function (data, zone) {
    const tuile = data.type === 'tuile' ? data.tuile : Object.assign({}, data.tuile);
    let dest = null, ou = null;
    if (zone.matches('.insert-zone')) { dest = this.noeud(zone.dataset.path); ou = zone.dataset.ou; }
    else if (zone.closest('.slot-simple')) dest = this.noeud(zone.closest('.slot-simple').dataset.path);
    else if (zone.matches('.eq-side')) {
      const m = this.etat[zone.dataset.side];
      const der = m.f[m.f.length - 1];
      if (der && der.k === 's') dest = der; else { dest = m; ou = 'fin'; }
    }
    if (!dest) return;
    if (data.type === 'tuile' && dest === data.s) { this.rafraichir(); return; }   // reposée au même endroit
    // ajout d'abord, puis retrait de la tuile d'origine (les objets gardent leur identité)
    if (dest.k === 's') dest.t.push(tuile);
    else if (ou === 'debut') dest.f.unshift(S(tuile));
    else dest.f.push(S(tuile));
    if (data.type === 'tuile') this.retirer(data.s, data.tuile);
    this.rafraichir();
  };

  Editeur.prototype.supprimer = function (s, tuile) {
    if (this.fini) return;
    this.retirer(s, tuile);
    this.rafraichir();
  };

  // Retire une tuile de sa case ; case vidée : elle disparaît d'un produit,
  // un dénominateur vide garde une croix pour être supprimé (le 1 retiré le supprime)
  Editeur.prototype.retirer = function (s, tuile) {
    const i = s.t.indexOf(tuile);
    if (i < 0) return;
    s.t.splice(i, 1);
    if (s.t.length) return;
    const ch = this.cheminDe(s);
    if (!ch) return;
    const prodCh = parentDe(ch), prod = this.noeud(prodCh);
    if (prod.f.length > 1) { prod.f.splice(+dernier(ch), 1); return; }
    if (dernier(prodCh) === 'den') {
      const fracCh = parentDe(prodCh), frac = this.noeud(fracCh);
      if (tuile.id === 'one') this.effondrer(frac); else frac.croix = true;
    }
  };

  // Remplace une fraction par son numérateur
  Editeur.prototype.effondrer = function (frac) {
    const ch = this.cheminDe(frac);
    if (!ch) return;
    const prod = this.noeud(parentDe(ch)), i = +dernier(ch);
    prod.f.splice(i, 1, ...frac.num.f);
    if (frac.num.neg) prod.neg = !prod.neg;
    this.nettoyer(prod);
  };
  Editeur.prototype.nettoyer = function (prod) {
    if (prod.f.length > 1) prod.f = prod.f.filter(x => !(x.k === 's' && x.t.length === 0));
  };

  Editeur.prototype.supprimerDen = function (frac) {
    if (this.fini || !frac) return;
    this.effondrer(frac);
    this.rafraichir();
  };

  // Le dénominateur passe de l'autre côté : il multiplie l'autre membre
  Editeur.prototype.deplacerDen = function (frac, coteDest) {
    if (!frac || !coteDest) return;
    const ch = this.cheminDe(frac);
    if (!ch || ch[0] === coteDest) { this.rafraichir(); return; }
    const dest = this.etat[coteDest], den = cloner(frac.den);
    if (den.neg) dest.neg = !dest.neg;
    if (dest.f.length === 1 && dest.f[0].k === 's' && dest.f[0].t.length && den.f.every(x => x.k === 's')) {
      den.f.forEach(x => { dest.f[0].t.push(...x.t); });
    } else {
      dest.f.unshift(...den.f);
      this.nettoyer(dest);
    }
    this.effondrer(frac);
    this.noterOutil(coteDest, 'den');
    this.rafraichir();
  };

  // Barre de fraction : sur une case (elle devient numérateur) ou sur tout un membre
  Editeur.prototype.outilFraction = function (zone) {
    const slot = zone.closest('.slot-simple');
    if (slot) {
      const ch = slot.dataset.path, s = this.noeud(ch), prod = this.noeud(parentDe(ch));
      const f = F(P([s]), P([S()]));
      f.croix = true;
      prod.f[+dernier(ch)] = f;
    } else {
      const side = zone.closest('.eq-side');
      if (!side) return;
      const m = this.etat[side.dataset.side];
      const f = F(P(m.f), P([S()]));
      f.croix = true;
      this.etat[side.dataset.side] = P([f], m.neg);
    }
    this.rafraichir();
  };

  Editeur.prototype.noterOutil = function (cote, o) {
    const d = this.outilsDepuis[cote];
    d[o] = (d[o] || 0) + 1;
  };

  Editeur.prototype.outilMoins = function (cote) {
    this.etat[cote].neg = !this.etat[cote].neg;
    this.noterOutil(cote, 'neg');
    this.rafraichir();
  };

  function contientFn(n, fn) {
    if (n.k === 'fn') return n.fn === fn || contientFn(n.x, fn);
    if (n.k === 'p') return n.f.some(x => contientFn(x, fn));
    if (n.k === 'f') return contientFn(n.num, fn) || contientFn(n.den, fn);
    return false;
  }
  function contientId(n, id) {
    if (n.k === 's') return n.t.some(t => t.id === id);
    if (n.k === 'p') return n.f.some(x => contientId(x, id));
    if (n.k === 'f') return contientId(n.num, id) || contientId(n.den, id);
    if (n.k === 'fn') return contientId(n.x, id);
    return false;
  }

  // 10ˣ ou log sur un membre : annule la fonction réciproque si elle est seule,
  // sinon l'enveloppe ; refusé si la fonction à annuler n'est pas isolée
  Editeur.prototype.outilFonction = function (fn, cote) {
    const inv = fn === 'p10' ? 'log' : 'p10', m = this.etat[cote];
    const nomInv = inv === 'log' ? 'log' : '10<sup>x</sup>', nomFn = NOMS_OUTILS[fn];
    if (!m.neg && m.f.length === 1 && m.f[0].k === 'fn' && m.f[0].fn === inv) {
      this.etat[cote] = cloner(m.f[0].x);
    } else if (contientFn(m, inv) && (!this.cfg.cible || contientId(m, this.cfg.cible))) {
      let pourquoi;
      if (m.neg && m.f.length === 1) pourquoi = `il y a un signe ${MOINS} devant ${nomInv} : enlève-le d'abord avec l'outil ×(−1), sur les deux membres.`;
      else if (m.f.length > 1) pourquoi = `${nomInv} est multiplié par autre chose : fais d'abord passer les autres facteurs de l'autre côté.`;
      else pourquoi = `${nomInv} est dans une fraction : fais d'abord passer le dénominateur de l'autre côté.`;
      this.message(`<b class="er-ko">Pas encore :</b> ${nomFn} n'annule ${nomInv} que s'il est <b>seul</b> dans son membre. Ici, ${pourquoi}`, 'ko');
      return;
    } else {
      this.etat[cote] = P([FN(fn, m)]);
    }
    this.noterOutil(cote, fn);
    this.rafraichir();
  };

  Editeur.prototype.inverser = function () {
    if (this.fini) return;
    const t = this.etat.L;
    this.etat.L = this.etat.R; this.etat.R = t;
    const o = this.outilsDepuis.L;
    this.outilsDepuis.L = this.outilsDepuis.R; this.outilsDepuis.R = o;
    this.rafraichir();
  };

  /* ============================================================
     VÉRIFICATION D'UNE ÉTAPE
     ============================================================ */
  function valeur(n, v) {
    switch (n.k) {
      case 'p': {
        if (!n.f.length) return NaN;
        let r = n.neg ? -1 : 1;
        for (const x of n.f) r *= valeur(x, v);
        return r;
      }
      case 's':
        if (!n.t.length) return NaN;
        return n.t.reduce((r, t) => r * (t.v != null ? t.v : v[t.id]), 1);
      case 'f': return valeur(n.num, v) / valeur(n.den, v);
      case 'fn': {
        const x = valeur(n.x, v);
        return n.fn === 'log' ? (x > 0 ? Math.log10(x) : NaN) : Math.pow(10, x);
      }
    }
    return NaN;
  }
  function vide(n) {
    if (n.k === 's') return n.t.length === 0;
    if (n.k === 'p') return n.f.length === 0 || n.f.some(vide);
    if (n.k === 'f') return vide(n.num) || vide(n.den);
    return false;
  }
  // fonction appliquée à elle-même (log(log(…)) ou 10^(10^(…))) : mauvais outil réciproque
  function fnDouble(n) {
    if (n.k === 'fn') {
      const x = n.x;
      if (!x.neg && x.f.length === 1 && x.f[0].k === 'fn' && x.f[0].fn === n.fn) return n.fn;
      return fnDouble(x);
    }
    if (n.k === 'p') { for (const x of n.f) { const r = fnDouble(x); if (r) return r; } }
    if (n.k === 'f') return fnDouble(n.num) || fnDouble(n.den);
    return null;
  }
  // seule la grandeur cherchée, sans signe ni autre facteur
  function seule(m, id) {
    return !m.neg && m.f.length === 1 && m.f[0].k === 's' && m.f[0].t.length === 1 && m.f[0].t[0].id === id;
  }

  Editeur.prototype.message = function (h, type) {
    this.el.retour.innerHTML = h ? `<div class="${type === 'ok' ? 'callout-success' : type === 'ko' ? 'callout-danger' : 'callout'} er-retour">${h}</div>` : '';
  };

  Editeur.prototype.verifier = function () {
    if (this.fini) return;
    const { L, R } = this.etat;
    if (vide(L) || vide(R)) {
      this.message('<b class="er-ko">Il reste une case vide.</b> Complète-la, ou supprime le dénominateur vide avec sa croix ✕.', 'ko');
      return;
    }
    // rien n'a changé depuis la dernière étape validée
    const prec = this.historique.length ? this.historique[this.historique.length - 1] : { L: this.cfg.gauche(), R: this.cfg.droite() };
    if (JSON.stringify(prec) === JSON.stringify(this.etat)) {
      this.message('Rien n\'a changé depuis la dernière étape : fais d\'abord une opération (glisse un outil ou une grandeur), puis vérifie.');
      return;
    }
    let juste = true, impossible = false;
    for (let i = 0; i < 6 && juste; i++) {
      const v = this.cfg.valeurs();
      const a = valeur(L, v), b = valeur(R, v);
      if (!isFinite(a) || !isFinite(b)) impossible = true;
      if (!isFinite(a) || !isFinite(b) || Math.abs(a - b) > 1e-7 * Math.max(1, Math.abs(a), Math.abs(b))) juste = false;
    }
    if (!juste) {
      this.erreurs++;
      if (this.cfg.onErreur) this.cfg.onErreur();
      // opération faite sur un seul des deux membres ?
      const dL = this.outilsDepuis.L, dR = this.outilsDepuis.R;
      const seul = ['neg', 'p10', 'log'].find(o => ((dL[o] || 0) + (dR[o] || 0)) % 2 === 1 || (dL[o] || 0) % 2 !== (dR[o] || 0) % 2);
      let h = '<b class="er-ko">Cette équation n\'est pas juste.</b> ';
      const double = fnDouble(L) || fnDouble(R);
      if (double) h += `Tu as appliqué ${NOMS_OUTILS[double]} à ${double === 'log' ? 'un log' : 'une puissance de 10'} : pour annuler ${double === 'log' ? 'log' : '10<sup>x</sup>'}, il faut sa <b>fonction réciproque</b>, ${double === 'log' ? '10<sup>x</sup>' : 'log'}. Recommence l'étape avec le bon outil.`;
      else if (seul) h += `Tu as appliqué <b>${NOMS_OUTILS[seul]}</b> à un seul membre : une opération se fait toujours sur <b>les deux membres</b> de l'égalité. Glisse aussi l'outil sur l'autre membre.`;
      else if (impossible) h += 'Elle contient le log d\'un nombre négatif (ou une division par zéro), ce qui n\'existe pas. Vérifie tes opérations, ou recommence l\'étape.';
      else h += this.cfg.indice || 'Ce qui multiplie d\'un côté passe de l\'autre côté en divisant (et inversement). Vérifie tes déplacements, ou recommence l\'étape.';
      this.message(h, 'ko');
      secouer(this.el.zone);
      return;
    }
    this.historique.push(cloner(this.etat));
    this.outilsDepuis = { L: {}, R: {} };
    this.dessinerHistorique();
    const c = this.cfg.cible, uns = this.compter('one');
    if (seule(L, c) && !contientId(R, c) && uns === 0) return this.resolu();
    let h;
    if (seule(R, c) && !contientId(L, c)) h = 'Il ne reste plus qu\'à inverser le sens de l\'équation avec ⇄' + (uns ? ', puis à retirer les 1 inutiles.' : '.');
    else if (seule(L, c) && uns) h = 'Retire les 1 inutiles (touche-les pour les supprimer).';
    else h = 'Continue.';
    this.message(`<b class="er-ok">✓ Étape juste.</b> ${h}`, 'ok');
    this.etat = cloner(this.etat);
    this.rafraichir();
  };

  Editeur.prototype.dessinerHistorique = function () {
    const dep = { L: this.cfg.gauche(), R: this.cfg.droite() };
    this.el.hist.innerHTML = `<div class="eq-hist-l"><span class="eq-hist-n">Départ</span>${ligne(dep.L, dep.R)}</div>` +
      this.historique.map((e, i) => `<div class="eq-hist-l"><span class="eq-hist-n">Étape ${i + 1}</span>${ligne(e.L, e.R)}<span class="eq-hist-ok">✓</span></div>`).join('');
  };

  Editeur.prototype.resolu = function () {
    this.fini = true;
    this.el.travail.classList.add('hidden');
    this.el.raz.classList.add('hidden');
    this.el.fin.classList.remove('hidden');
    const e = this.etat;
    this.el.fin.innerHTML = `<div class="callout-success er-retour"><p><b class="er-ok">Bravo, l'équation est résolue !</b></p><p class="eq-fin-eq">${ligne(e.L, e.R)}</p></div>`;
    if (this.cfg.onResolu) this.cfg.onResolu(this.erreurs);
  };

  Editeur.prototype.coupDePouce = function () {
    const a = this.cfg.aides;
    if (!a || this.fini) return;
    const k = Math.min(this.historique.length, a.length - 1);
    this.message(`<b>Coup de pouce :</b> ${a[k]}`);
  };

  // Correction : les étapes de la solution, sous forme de démonstration
  Editeur.prototype.montrerSolution = function () {
    this.fini = true;
    if (window.DragDrop) window.DragDrop.cleanupGhosts();
    this.el.travail.classList.add('hidden');
    this.el.raz.classList.add('hidden');
    this.el.hist.classList.add('hidden');
    this.el.fin.classList.remove('hidden');
    this.el.fin.innerHTML = '';
    if (this.cfg.solution) demo(this.el.fin, { etapes: this.cfg.solution, tout: true });
  };

  function secouer(e) { e.classList.remove('er-secoue'); void e.offsetWidth; e.classList.add('er-secoue'); }

  window.PH = window.PH || {};
  window.PH.EQ = { T, S, P, F, FN, UN, statique, ligne, valeur };
  window.PH.demo = demo;
  window.PH.Editeur = Editeur;
})();
