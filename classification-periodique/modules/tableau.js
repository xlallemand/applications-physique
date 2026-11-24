/* ============================================================
   Tableau périodique simplifié (Z = 1 à 20) de l'application
   « Classification périodique » : données de position, ion et liaisons
   lus sur le tableau, dessin du tableau et des flèches de case en case.
   Données des éléments : outil ATOME (assets/atome.js).

   ---------- Données ----------
   CP.COLS                    [1, 2, 13, 14, 15, 16, 17, 18] : colonnes du tableau simplifié
   CP.position(Z)             { ligne, col, rang } ; rang : place dans la ligne (1 à 8, He : 8)
   CP.aLaPlace(ligne, col)    Z de l'élément de cette case, ou null
   CP.valenceCase(Z)          électrons de valence lus sur le tableau (colonnes 1, 2 → 1, 2 ;
                              13 à 18 → 3 à 8 ; He : 2)
   CP.ion(Z)                  ion lu en comptant les cases jusqu'à la dernière colonne :
                              { type: 'stable' } (gaz noble), { type: 'H', q: 1 } (cas à part),
                              { type: 'egal', n: 4 } (C, Si : 4 cases de chaque côté),
                              { type: 'ion', sens: 'droite' | 'gauche', n, q, gaz (Z du gaz noble), chemin }
                              chemin : cases traversées ({ z } ou { fantome: ligne } : gaz noble de la ligne
                              précédente, écrit à gauche de la ligne)
   CP.nomIon(Z)               'ion sodium'… (null pour B) ; CP.ionAConnaitre(Z) : H⁺, Na⁺, K⁺, Ca²⁺, Mg²⁺, F⁻, Cl⁻
   CP.liaisons(Z)             { type: 'liaisons', valence, gagner, liaisons, doublets, gaz, regle }
                              (H, C, N, O, F, Si, P, S, Cl) ; { type: 'metal' } ; { type: 'bore' } ; { type: 'stable' }
   CP.FAMILLES                { alcalins, 'halogènes', 'gaz nobles' } : { nom, Z: […], col }
   CP.nom(Z)                  nom avec une majuscule ; CP.de(Z) : « du sodium », « de l'oxygène »
   CP.valHTML(Z)              électrons de la couche externe : « …3s<sup>2</sup> 3p<sup>4</sup> » (Z ⩽ 18)
   CP.atomeLiaisons(sym, nL, nD)  SVG : l'atome avec ses liaisons (traits) et ses doublets non liants
   CP.doublets(k)             « 2 doublets non liants », « aucun doublet non liant »

   ---------- Dessin ----------
   CP.tableau(zone, opts) → api
     opts.contenu   'complet' (Z, symbole, couche externe ; défaut), 'symboles' (symbole seul), 'vide'
     opts.surToucher(Z, case)        une case d'élément est touchée
     opts.surFantome(ligne)          le gaz noble écrit à gauche d'une ligne est touché (fantômes en boutons)
     opts.min, opts.max              taille d'une case (46 à 84 px par défaut) ; le tableau défile dans son
                                     conteneur s'il ne tient pas en largeur
   api :
     cellule(Z)                      bouton de la case
     choisir(Z | null)               case touchée (fond --cle-bg), ligne et colonne repérées
     cible(Z | null)                 case surlignée (manipulation)
     contenu(mode)                   change ce qui est écrit dans les cases
     ecrire(Z, html)                 écrit dans une case (carte posée)
     familles([clé])                 cadres épais --accent et nom écrit
     fleches(Z, { anime })           flèches de case en case jusqu'à la dernière colonne (ion)
     arcs(liste, { sens, anime })    flèches entre des cases données (liste de cibles { z } / { fantome })
     effacerFleches()
     fantomes(on, boutons)           gaz nobles écrits à gauche des lignes 2 à 4 (boutons à toucher si demandé)
     ajuster()                       recalcul de la taille des cases (fait tout seul au redimensionnement)
   ============================================================ */
(function () {
  'use strict';

  const MOINS = '−';
  const NS = 'http://www.w3.org/2000/svg';
  const COLS = [1, 2, 13, 14, 15, 16, 17, 18];
  const GAZ = [2, 10, 18];
  const pl2 = (k, mot) => `${k} ${mot}${k > 1 ? 's' : ''}`;
  // « 1 doublet non liant », « 2 doublets non liants », « aucun doublet non liant »
  const doublets = k => (!k ? 'aucun doublet non liant' : k > 1 ? `${k} doublets non liants` : '1 doublet non liant');

  /* ============================================================
     DONNÉES
     ============================================================ */
  function position(Z) {
    if (Z === 1) return { ligne: 1, rang: 1, col: 1 };
    if (Z === 2) return { ligne: 1, rang: 8, col: 18 };          // He : dernière colonne
    let ligne, rang;
    if (Z <= 10) { ligne = 2; rang = Z - 2; } else if (Z <= 18) { ligne = 3; rang = Z - 10; } else { ligne = 4; rang = Z - 18; }
    return { ligne, rang, col: COLS[rang - 1] };
  }
  function aLaPlace(ligne, col) {
    for (let z = 1; z <= 20; z++) { const p = position(z); if (p.ligne === ligne && p.col === col) return z; }
    return null;
  }
  const valenceCase = Z => (Z === 2 ? 2 : position(Z).rang);

  // ion lu sur le tableau : compter les cases jusqu'à la dernière colonne
  function ion(Z) {
    if (GAZ.indexOf(Z) >= 0) return { type: 'stable' };
    if (Z === 1) return { type: 'H', q: 1 };
    const p = position(Z), d = 8 - p.rang, g = p.rang;
    if (d === g) return { type: 'egal', n: d };
    if (d < g) {
      const chemin = COLS.slice(p.rang).map(c => ({ z: aLaPlace(p.ligne, c) }));
      return { type: 'ion', sens: 'droite', n: d, q: -d, gaz: Z + d, chemin };
    }
    const chemin = COLS.slice(0, p.rang - 1).reverse().map(c => ({ z: aLaPlace(p.ligne, c) }));
    chemin.push({ fantome: p.ligne });
    return { type: 'ion', sens: 'gauche', n: g, q: g, gaz: Z - g, chemin };
  }
  const NOMS_IONS = { 1: 'ion hydrogène', 3: 'ion lithium', 4: 'ion béryllium', 7: 'ion nitrure', 8: 'ion oxyde', 9: 'ion fluorure',
    11: 'ion sodium', 12: 'ion magnésium', 13: 'ion aluminium', 15: 'ion phosphure', 16: 'ion sulfure', 17: 'ion chlorure', 19: 'ion potassium', 20: 'ion calcium' };
  const A_CONNAITRE = [1, 11, 19, 20, 12, 9, 17];
  const nomIon = Z => NOMS_IONS[Z] || null;
  const ionAConnaitre = Z => A_CONNAITRE.indexOf(Z) >= 0;

  // nombre de liaisons : électrons à gagner pour avoir la configuration d'un gaz noble
  function liaisons(Z) {
    const e = ATOME.element(Z);
    if (GAZ.indexOf(Z) >= 0) return { type: 'stable' };
    if (Z === 5) return { type: 'bore' };
    if (e.liaisons == null) return { type: 'metal' };
    const v = valenceCase(Z);
    return { type: 'liaisons', valence: v, gagner: e.liaisons, liaisons: e.liaisons, doublets: e.doubletsNonLiants,
      gaz: Z === 1 ? 2 : Z + e.liaisons, regle: Z === 1 ? 'duet' : 'octet' };
  }

  const FAMILLES = {
    alcalins: { nom: 'alcalins', Z: [3, 11, 19], col: 1 },
    'halogènes': { nom: 'halogènes', Z: [9, 17], col: 17 },
    'gaz nobles': { nom: 'gaz nobles', Z: [2, 10, 18], col: 18 },
  };

  const nom = Z => { const n = ATOME.element(Z).nom; return n[0].toUpperCase() + n.slice(1); };
  const de = Z => { const n = ATOME.element(Z).nom; return /^[aeéèêiouyh]/i.test(n) ? 'de l\'' + n : 'du ' + n; };
  // électrons de la couche externe, écrits dans la case
  function valHTML(Z) {
    if (Z > 18) return '';
    const c = ATOME.config(Z), n = ATOME.derniereCouche(c);
    const ext = c.filter(t => ATOME.couche(t[0]) === n).map(t => `${t[0]}<sup>${t[1]}</sup>`).join(' ');
    return (n > 1 ? '…' : '') + ext;
  }

  /* ---------- L'atome et ses liaisons (comme –Ō–) ---------- */
  // liaisons (traits vers l'extérieur) et doublets non liants (traits contre le symbole)
  function atomeLiaisons(sym, nL, nD) {
    const dirs = { d: [1, 0], g: [-1, 0], b: [0, 1], h: [0, -1] };
    const ordreL = ['g', 'd', 'b', 'h'], ordreD = ['h', 'b', 'd', 'g'];
    const L = ordreL.slice(0, nL), D = ordreD.filter(k => L.indexOf(k) < 0).slice(0, nD);
    let h = '';
    L.forEach(k => { const [x, y] = dirs[k]; h += `<line x1="${x * 19}" y1="${y * 21}" x2="${x * 50}" y2="${y * 50}" class="cp-at-l"/>`; });
    D.forEach(k => {
      const [x, y] = dirs[k];
      // trait du doublet, perpendiculaire à la direction, tout près du symbole
      if (x) h += `<line x1="${x * 18}" y1="-9" x2="${x * 18}" y2="9" class="cp-at-d"/>`;
      else h += `<line x1="-10" y1="${y * 21}" x2="10" y2="${y * 21}" class="cp-at-d"/>`;
    });
    return `<svg class="cp-at" viewBox="-56 -56 112 112" role="img" aria-label="${sym} : ${pl2(nL, 'liaison')}${nD ? ` et ${doublets(nD)}` : ''}">${h}<text y="9" text-anchor="middle" class="cp-at-s">${sym}</text></svg>`;
  }

  /* ============================================================
     DESSIN DU TABLEAU
     Grille : colonne des lignes, colonnes 1 et 2, écart des 10 colonnes cachées, colonnes 13 à 18.
     ============================================================ */
  const gCol = c => (c <= 2 ? c + 1 : c - 13 + 5);     // colonne de la grille

  function svgEl(tag, attrs, parent) {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) if (attrs[k] != null) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  const reduit = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const r1 = v => Math.round(v * 10) / 10;

  function tableau(zone, opts) {
    opts = Object.assign({ contenu: 'complet', min: 46, max: 84 }, opts || {});
    const st = { choisi: null, cible: null, familles: [], arcs: null, fantomes: false, fantBoutons: false, ecrit: {}, contenu: opts.contenu };

    // en-têtes, cases, écart des colonnes cachées
    let h = '<span class="cp-tab-coin" style="grid-row:1;grid-column:1"></span>';
    COLS.forEach(c => { h += `<span class="cp-tab-num" data-col="${c}" style="grid-row:1;grid-column:${gCol(c)}">${c}</span>`; });
    h += '<span class="cp-tab-gap" style="grid-row:2 / span 4;grid-column:4"><span>10 colonnes cachées</span></span>';
    for (let l = 1; l <= 4; l++) {
      h += `<span class="cp-tab-lig" data-ligne="${l}" style="grid-row:${l + 1};grid-column:1"><b>${l}</b><small>n = ${l}</small></span>`;
      COLS.forEach(c => {
        const z = aLaPlace(l, c), pos = `grid-row:${l + 1};grid-column:${gCol(c)}`;
        if (z) h += `<button type="button" class="cp-c" data-z="${z}" data-ligne="${l}" data-col="${c}" style="${pos}"></button>`;
        else if (l === 4) h += `<span class="cp-c-vide" style="${pos}" aria-hidden="true"></span>`;
      });
    }
    zone.innerHTML = `<div class="cp-tab-defile"><div class="cp-tab" role="group" aria-label="Tableau périodique simplifié, Z = 1 à 20">${h}
      <svg class="cp-tab-svg" aria-hidden="true"><g data-g="fam"></g><g data-g="arcs"></g></svg><div class="cp-tab-calque"></div></div></div>`;
    const defile = zone.querySelector('.cp-tab-defile'), grille = zone.querySelector('.cp-tab');
    const svg = grille.querySelector('svg'), gFam = svg.querySelector('[data-g="fam"]'), gArcs = svg.querySelector('[data-g="arcs"]');
    const calque = grille.querySelector('.cp-tab-calque');
    const cellule = Z => grille.querySelector(`.cp-c[data-z="${Z}"]`);

    /* ----- Contenu des cases ----- */
    function remplir() {
      grille.querySelectorAll('.cp-c').forEach(b => {
        const z = +b.dataset.z, e = ATOME.element(z), p = position(z);
        let txt;
        if (st.ecrit[z] != null) txt = st.ecrit[z];
        else if (st.contenu === 'vide') txt = '';
        else if (st.contenu === 'symboles') txt = `<b class="cp-sym">${e.sym}</b>`;
        else txt = `<small class="cp-z">${z}</small><b class="cp-sym">${e.sym}</b><span class="cp-val">${valHTML(z)}</span>`;
        b.innerHTML = txt;
        const lu = st.contenu === 'vide' && st.ecrit[z] == null ? `case vide, ligne ${p.ligne}, colonne ${p.col}`
          : `${nom(z)}${st.contenu === 'complet' ? `, Z = ${z}` : ''}, ligne ${p.ligne}, colonne ${p.col}`;
        b.setAttribute('aria-label', lu);
      });
    }

    /* ----- Taille des cases : tout le tableau dans la place disponible ----- */
    function ajuster() {
      const tel = matchMedia('(max-width: 899px)').matches;
      const L = tel ? 40 : 48, G = tel ? 22 : 26, gap = tel ? 3 : 4, bas = 26;
      grille.style.setProperty('--cp-l', L + 'px');
      grille.style.setProperty('--cp-g', G + 'px');
      grille.style.setProperty('--cp-gap', gap + 'px');
      const W = defile.clientWidth - 8, H = defile.clientHeight - 8;
      let s = Math.floor((W - L - G - 9 * gap) / 8);
      if (H > 40) s = Math.min(s, Math.floor((H - 20 - bas - 4 * gap - 8) / 4));
      s = Math.max(opts.min, Math.min(opts.max, s));
      grille.style.setProperty('--cp-c', s + 'px');
      redessiner();
    }

    /* ----- Repères : case touchée, case surlignée ----- */
    function choisir(Z) {
      st.choisi = Z;
      grille.querySelectorAll('.cp-c').forEach(b => {
        const on = +b.dataset.z === Z;
        b.classList.toggle('cp-choisi', on);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      const p = Z ? position(Z) : null;
      grille.querySelectorAll('.cp-tab-lig').forEach(e => e.classList.toggle('cp-repere', !!p && +e.dataset.ligne === p.ligne));
      grille.querySelectorAll('.cp-tab-num').forEach(e => e.classList.toggle('cp-repere', !!p && +e.dataset.col === p.col));
      if (Z) voir([{ z: Z }]);
    }
    // le tableau défile dans son conteneur (téléphone) : les cases données sont amenées à l'écran
    function voir(liste) {
      if (defile.scrollWidth <= defile.clientWidth + 1) return;
      const bs = liste.map(boite), x0 = Math.min(...bs.map(b => b.x)) + grille.offsetLeft - 6, x1 = Math.max(...bs.map(b => b.x + b.w)) + grille.offsetLeft + 6;
      if (x0 >= defile.scrollLeft && x1 <= defile.scrollLeft + defile.clientWidth) return;
      const cible = x1 - x0 > defile.clientWidth ? x0 : x1 > defile.scrollLeft + defile.clientWidth ? x1 - defile.clientWidth : x0;
      defile.scrollTo({ left: Math.max(0, cible), behavior: reduit() ? 'auto' : 'smooth' });
    }
    function cible(Z) {
      st.cible = Z;
      grille.querySelectorAll('.cp-c').forEach(b => b.classList.toggle('cp-cible', +b.dataset.z === Z));
    }

    /* ----- Géométrie (coordonnées dans la grille) ----- */
    function boite(t) {
      let e;
      if (t.z) e = cellule(t.z);
      else e = grille.querySelector(`.cp-tab-lig[data-ligne="${t.fantome}"]`);
      return { x: e.offsetLeft, y: e.offsetTop, w: e.offsetWidth, h: e.offsetHeight };
    }

    /* ----- Familles : cadre épais et nom écrit ----- */
    function dessinerFamilles() {
      while (gFam.firstChild) gFam.removeChild(gFam.firstChild);
      calque.querySelectorAll('.cp-fam-nom').forEach(e => e.remove());
      st.familles.forEach(k => {
        const f = FAMILLES[k], bs = f.Z.map(z => boite({ z }));
        const x0 = Math.min(...bs.map(b => b.x)) - 4, y0 = Math.min(...bs.map(b => b.y)) - 4;
        const x1 = Math.max(...bs.map(b => b.x + b.w)) + 4, y1 = Math.max(...bs.map(b => b.y + b.h)) + 4;
        svgEl('rect', { x: x0, y: y0, width: x1 - x0, height: y1 - y0, rx: 12, class: 'cp-fam-cadre' }, gFam);
        const n = document.createElement('span');
        n.className = 'cp-fam-nom';
        n.textContent = f.nom;
        n.style.left = ((x0 + x1) / 2) + 'px';
        n.style.top = y1 + 'px';
        calque.appendChild(n);
      });
    }
    function familles(liste) { st.familles = (liste || []).slice(); dessinerFamilles(); }

    /* ----- Gaz nobles écrits à gauche des lignes 2 à 4 (fin de la ligne précédente) ----- */
    function dessinerFantomes() {
      calque.querySelectorAll('.cp-fant').forEach(e => e.remove());
      const lignes = [];
      if (st.fantomes) lignes.push(2, 3, 4);
      else if (st.arcs) st.arcs.liste.forEach(t => { if (t.fantome) lignes.push(t.fantome); });
      lignes.forEach(l => {
        const b = boite({ fantome: l }), g = ATOME.element(GAZ[l - 2]);
        const e = document.createElement(st.fantBoutons ? 'button' : 'span');
        if (st.fantBoutons) { e.type = 'button'; e.dataset.fant = l; }
        e.className = 'cp-fant';
        e.innerHTML = `<b>${g.sym}</b>`;
        e.setAttribute('aria-label', `${nom(g.Z)}, gaz noble de la fin de la ligne ${l - 1}`);
        Object.assign(e.style, { left: b.x + 'px', top: b.y + 'px', width: b.w + 'px', height: b.h + 'px' });
        calque.appendChild(e);
      });
    }
    function fantomes(on, boutons) { st.fantomes = !!on; st.fantBoutons = !!boutons; dessinerFantomes(); }

    /* ----- Flèches courbes de case en case ----- */
    // une flèche de a vers b (au-dessus des cases vers la droite, en dessous vers la gauche), numérotée
    function arc(a, b, sens, num, anime, delai, s) {
      const A = boite(a), B = boite(b);
      const x1 = A.x + A.w / 2, x2 = B.x + B.w / 2, dir = x2 > x1 ? 1 : -1;
      const haut = sens === 'droite';
      const y = haut ? Math.min(A.y, B.y) + s * 0.17 : Math.max(A.y + A.h, B.y + B.h) - s * 0.17;
      const k = Math.max(s * 0.3, Math.min(s * 0.62, Math.abs(x2 - x1) * 0.3)) * (haut ? -1 : 1);
      const xa = x1 + dir * s * 0.12, xb = x2 - dir * s * 0.12;      // départ et arrivée un peu dans les cases
      const cx = (xa + xb) / 2, cy = y + 2 * k;
      const g = svgEl('g', { class: 'cp-arc' }, gArcs);
      const p = svgEl('path', { d: `M${r1(xa)} ${r1(y)} Q${r1(cx)} ${r1(cy)} ${r1(xb)} ${r1(y)}`, class: 'cp-arc-t' }, g);
      // pointe de la flèche, dans la direction de la tangente à l'arrivée
      const tx = xb - cx, ty = y - cy, tn = Math.hypot(tx, ty) || 1, ux = tx / tn, uy = ty / tn, L = 9, W = 5.5;
      svgEl('path', { d: `M${r1(xb)} ${r1(y)} L${r1(xb - ux * L - uy * W)} ${r1(y - uy * L + ux * W)} L${r1(xb - ux * L + uy * W)} ${r1(y - uy * L - ux * W)} Z`, class: 'cp-arc-p' }, g);
      // numéro du saut au sommet de la flèche
      const mx = (xa + xb) / 2, my = y + k;
      const n = svgEl('g', { class: 'cp-arc-n', transform: `translate(${r1(mx)} ${r1(my)})` }, g);
      svgEl('circle', { r: 9 }, n);
      svgEl('text', { y: 4, 'text-anchor': 'middle' }, n).textContent = String(num);
      if (anime && !reduit() && p.getTotalLength && g.animate) {
        const len = p.getTotalLength();
        p.style.strokeDasharray = len;
        p.animate([{ strokeDashoffset: len }, { strokeDashoffset: 0 }], { duration: 380, delay: delai, fill: 'backwards', easing: 'ease-out' });
        Array.from(g.children).slice(1).forEach(e => e.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 160, delay: delai + 300, fill: 'backwards' }));
      }
    }
    function dessinerArcs(anime) {
      while (gArcs.firstChild) gArcs.removeChild(gArcs.firstChild);
      dessinerFantomes();
      if (!st.arcs) return;
      const s = parseFloat(grille.style.getPropertyValue('--cp-c')) || 56;
      const l = st.arcs.liste;
      for (let i = 1; i < l.length; i++) arc(l[i - 1], l[i], st.arcs.sens, i, anime, (i - 1) * 480, s);
    }
    // liste : cibles successives, la première est la case de départ
    function arcs(liste, o) {
      o = o || {};
      st.arcs = liste && liste.length ? { liste: liste.slice(), sens: o.sens || 'droite' } : null;
      dessinerArcs(!!o.anime);
    }
    function fleches(Z, o) {
      const i = ion(Z);
      if (i.type !== 'ion') { arcs(null); return 0; }
      arcs([{ z: Z }].concat(i.chemin), { sens: i.sens, anime: o && o.anime });
      voir([{ z: Z }].concat(i.chemin));
      return reduit() || !(o && o.anime) ? 0 : (i.n - 1) * 480 + 460;     // durée de l'animation (ms)
    }
    function redessiner() {
      // la grille a sa taille : le calque SVG la couvre
      svg.setAttribute('width', grille.offsetWidth);
      svg.setAttribute('height', grille.offsetHeight);
      dessinerFamilles();
      dessinerArcs(false);
    }

    /* ----- Toucher ----- */
    grille.addEventListener('click', ev => {
      const f = ev.target.closest('.cp-fant[data-fant]');
      if (f) { if (opts.surFantome) opts.surFantome(+f.dataset.fant); return; }
      const b = ev.target.closest('.cp-c');
      if (b && opts.surToucher) opts.surToucher(+b.dataset.z, b);
    });

    remplir();
    ajuster();
    if (window.ResizeObserver) new ResizeObserver(() => ajuster()).observe(defile);
    else addEventListener('resize', ajuster);

    return {
      el: grille, defile, cellule, choisir, cible, familles, fleches, arcs, fantomes, ajuster, voir,
      effacerFleches() { arcs(null); },
      contenu(m) { st.contenu = m; st.ecrit = {}; remplir(); },
      ecrire(Z, html) { if (html == null) delete st.ecrit[Z]; else st.ecrit[Z] = html; remplir(); },
      etat: () => st,
    };
  }

  Object.assign(window.CP, {
    COLS, position, aLaPlace, valenceCase, ion, nomIon, ionAConnaitre, liaisons, FAMILLES, nom, de, valHTML, atomeLiaisons, doublets, tableau,
  });
})();
