/* ============================================================
   Outils des modules 3 et 4 de « Puissance active »

   Les cours par étapes et les questions notées utilisent le moteur
   de l'application « pH » (ph/modules/ph.js : PH.Cours, PH.aToi,
   PH.serie, PH.question) ; la règle et les graphiques utilisent le
   moteur de l'application « Lecture graphique »
   (lecture-graphique/modules/lgtools.js : LG.figure, LG.bacASable).

     PA.defPhi(o)            graphique u(t), i(t) déphasées (format LG)
     PA.figPhi(o, opts)      figure statique (HTML), règles éventuelles
     PA.reglesPhi(o)         règles posées pour mesurer T et Δt
     PA.tabProp(o)           tableau de proportionnalité durée ↔ angle
     PA.cercle(zone)         cercle trigonométrique animé (1 période = 1 tour)
     PA.schema(c)            schéma de conversion d'énergie (HTML)
     PA.slot(nom)            case vide du schéma (glisser-déposer)

   Parties de question ajoutées à PH.PARTIES :
     'choixFig'   QCM précédé d'une figure (p.figure)
     'mesurePhi'  mesure de T et Δt à la règle, calcul de φ
     'schema'     étiquettes à glisser sur le schéma de conversion
   ============================================================ */
(function () {
  'use strict';

  const { fmt, el, secouer, melanger, lire } = window.PH;
  const PA = window.PA;
  const C_U = PA.COUL.u, C_I = PA.COUL.i;
  const ORANGE = '#9a5305';

  /* ============================================================
     GRAPHIQUE u(t), i(t)
     o = { T, dt, tu, Um, Im, tmax, pasT, ymax, pasY, uniteI, regle, noms, annoter(R, o) }
       T  : période (ms) ;  tu : date d'un sommet de u (ms)
       dt : décalage (ms) ; dt > 0 : i atteint son sommet avant u (i en avance)
     ============================================================ */
  function defPhi(o) {
    const w = 2 * Math.PI / o.T;
    const u = t => o.Um * Math.cos(w * (t - o.tu));
    const i = t => o.Im * Math.cos(w * (t - o.tu + o.dt));
    return {
      type: 'libre',
      axeX: { min: 0, max: o.tmax, pas: o.pasT, nom: 't', unite: 'ms', libelle: 'Durée' },
      axeY: { min: -o.ymax, max: o.ymax, pas: o.pasY || 1, nom: 'u', unite: 'V' },
      titreY: `<tspan fill="${C_I}">i (en ${o.uniteI || 'mA'})</tspan><tspan dx="4" fill="${C_U}">u (en V)</tspan>`,
      courbes: [{ f: u, couleur: C_U }, { f: i, couleur: C_I }],
      annotations: R => nomsCourbes(R, o) + (o.annoter ? o.annoter(R, o) : ''),
      regle: o.regle,
    };
  }

  // dates des sommets d'une courbe visibles sur le graphique (sommet en t0 + k T)
  function sommets(o, t0) {
    const L = [];
    let t = t0 - Math.ceil(t0 / o.T + 1) * o.T;
    for (; t <= o.tmax + 1e-9; t += o.T) if (t >= -1e-9) L.push(t);
    return L;
  }

  // noms « u(t) » et « i(t) » écrits près d'un sommet de chaque courbe
  function nomsCourbes(R, o) {
    const a = o.tmax * 0.1, b = o.tmax * 0.86;
    const su = sommets(o, o.tu).filter(t => t >= a && t <= b);
    const si = sommets(o, o.tu - o.dt).filter(t => t >= a && t <= b);
    // o.noms = { u, i } : dates des sommets qui portent les noms (pour éviter les autres annotations)
    const tu = o.noms ? o.noms.u : su[0] !== undefined ? su[0] : o.tu;
    const ti = o.noms ? o.noms.i : si.length ? si[si.length - 1] : o.tu - o.dt;
    return texte(R.sx(tu) + 2.2, R.sy(o.Um) - 1.6, 'u(t)', C_U) + texte(R.sx(ti) + 2.2, R.sy(o.Im) - 1.6, 'i(t)', C_I);
  }

  // texte sur fond blanc, en mm papier
  function texte(x, y, t, couleur, ancre, taille) {
    return `<text x="${x}" y="${y}" font-size="${taille || 4.2}" font-weight="800" text-anchor="${ancre || 'start'}" fill="${couleur}"
      stroke="#fff" stroke-width="1.2" stroke-linejoin="round" paint-order="stroke">${t}</text>`;
  }
  // double flèche horizontale de x1 à x2 (mm papier) avec un texte au-dessus (ou en dessous)
  function flecheH(x1, x2, y, couleur, t, dessous) {
    const p = (x, s) => `M${x},${y} l${s * 2.2},-1.2 v2.4z`;
    return `<line x1="${x1 + 1}" y1="${y}" x2="${x2 - 1}" y2="${y}" stroke="${couleur}" stroke-width=".55"/>
      <path d="${p(x1, 1)} ${p(x2, -1)}" fill="${couleur}"/>` +
      (t ? texte((x1 + x2) / 2, dessous ? y + 4.6 : y - 1.6, t, couleur, 'middle', 3.8) : '');
  }
  const tirets = (x, y1, y2, couleur) =>
    `<line x1="${x}" y1="${y1}" x2="${x}" y2="${y2}" stroke="${couleur || '#16181d'}" stroke-width=".4" stroke-dasharray="1.2,1"/>`;

  /* Règles posées pour mesurer T (entre deux sommets de u) et Δt (entre le sommet
     de la courbe en avance et le sommet suivant de l'autre courbe) : format LG.figure */
  function reglesPhi(o) {
    const R = LG.repere(defPhi(o));
    const su = sommets(o, o.tu).filter(t => t + o.T <= o.tmax);
    const tT = su[0];
    const avance = o.dt > 0 ? o.tu - o.dt : o.tu;             // sommet de la courbe en avance
    const d = Math.abs(o.dt);
    const sa = sommets(o, avance).filter(t => t + d <= o.tmax);
    const tA = sa[Math.min(1, sa.length - 1)];
    const yHaut = R.sy(Math.max(o.Um, o.Im));
    return {
      R, tT, tA, d,
      T: { ox: R.sx(tT), oy: R.sy(o.Um), rot: 0, cur: o.T * R.mmX },
      dt: { ox: R.sx(tA), oy: yHaut, rot: 0, cur: d * R.mmX },
    };
  }

  /* Figure statique : opts = { regles: ['T', 'dt'], reperes: true (tirets aux sommets mesurés) } */
  function figPhi(o, opts) {
    opts = opts || {};
    const rg = opts.regles && opts.regles.length ? reglesPhi(o) : null;
    const o2 = Object.assign({}, o);
    if (rg && opts.reperes !== false) {
      // tirets verticaux aux sommets mesurés, pour voir où la règle commence et finit
      o2.annoter = (R, oo) => {
        let s = o.annoter ? o.annoter(R, oo) : '';
        if (opts.regles.indexOf('T') !== -1) [rg.tT, rg.tT + o.T].forEach(t => { s += tirets(R.sx(t), R.P.yTop, R.P.yBot, C_U); });
        if (opts.regles.indexOf('dt') !== -1) [rg.tA, rg.tA + rg.d].forEach((t, k) => { s += tirets(R.sx(t), R.P.yTop, R.P.yBot, (k === 0) === (o.dt > 0) ? C_I : C_U); });
        return s;
      };
    }
    return LG.figure(defPhi(o2), rg ? opts.regles.map(k => rg[k]) : []);
  }

  /* ============================================================
     TABLEAU DE PROPORTIONNALITÉ (durée ↔ angle), écrit en colonnes
     o = { unite: 'ms' | 'cm', T, dt, phi } : textes des cases
     ============================================================ */
  function tabProp(o) {
    const grandeur = o.unite === 'cm' ? 'Distance' : 'Durée';
    return `<div class="lg-table-wrap"><table class="lg-table pa-prop">
      <colgroup><col class="lg-col-titre"><col><col></colgroup>
      <thead><tr><th></th><th>${grandeur} (${o.unite || 'ms'})</th><th>Angle (rad)</th></tr></thead>
      <tbody>
        <tr><th>Période</th><td>${o.T}</td><td>2π</td></tr>
        <tr><th>Décalage</th><td>${o.dt}</td><td class="${o.phiConnu ? '' : 'lg-inconnue'}">${o.phi || 'φ'}</td></tr>
      </tbody></table></div>`;
  }

  /* ============================================================
     CERCLE TRIGONOMÉTRIQUE ANIMÉ
     Un point tourne sur le cercle pendant que la courbe se trace :
     au bout d'une période T, il a fait un tour complet (2π rad).
     ============================================================ */
  function cercle(zone) {
    const T = 20, CX = 118, CY = 130, RC = 88, X0 = 296, X1 = 640;
    const px = t => X0 + t / T * (X1 - X0), py = v => CY - RC * v;
    // repères du cercle et du graphique
    let s = `<line x1="${CX - RC - 14}" y1="${CY}" x2="${CX + RC + 14}" y2="${CY}" class="pa-c-axe"/>
      <line x1="${CX}" y1="${CY - RC - 14}" x2="${CX}" y2="${CY + RC + 14}" class="pa-c-axe"/>
      <circle cx="${CX}" cy="${CY}" r="${RC}" class="pa-c-cercle"/>
      <text x="${CX + RC - 8}" y="${CY + 28}" class="pa-c-angle pa-c-zero" text-anchor="end">0 et 2π</text>
      <text x="${CX + 8}" y="${CY - RC - 8}" class="pa-c-angle">π/2</text>
      <text x="${CX - RC - 8}" y="${CY - 8}" class="pa-c-angle" text-anchor="end">π</text>
      <text x="${CX + 8}" y="${CY + RC + 22}" class="pa-c-angle">3π/2</text>
      <line x1="${X0}" y1="${CY}" x2="${X1 + 14}" y2="${CY}" class="pa-c-axe"/>
      <path d="M${X1 + 16},${CY} l-9,-5 v10z" class="pa-c-fleche"/>
      <line x1="${X0}" y1="${CY - RC - 12}" x2="${X0}" y2="${CY + RC + 12}" class="pa-c-axe"/>
      <text x="${X1 + 14}" y="${CY - 12}" class="pa-c-grad" text-anchor="end">t (ms)</text>`;
    [0, 5, 10, 15, 20].forEach(t => {
      s += `<line x1="${px(t)}" y1="${CY - RC}" x2="${px(t)}" y2="${CY + RC}" class="pa-c-grille"/>
        <text x="${px(t)}" y="${CY + RC + 24}" class="pa-c-grad" text-anchor="middle">${t}</text>`;
    });
    // période T repérée sous le graphique
    s += `<line x1="${px(0)}" y1="${CY + RC + 58}" x2="${px(T)}" y2="${CY + RC + 58}" class="pa-c-T"/>
      <path d="M${px(0)},${CY + RC + 58} l8,-5 v10z M${px(T)},${CY + RC + 58} l-8,-5 v10z" class="pa-c-Tf"/>
      <text x="${px(T / 2)}" y="${CY + RC + 50}" class="pa-c-Tt" text-anchor="middle">T = 20 ms ↔ un tour (2π rad)</text>`;
    // courbe complète, en clair
    let d = '';
    for (let k = 0; k <= 200; k++) d += (k ? 'L' : 'M') + px(T * k / 200).toFixed(1) + ',' + py(Math.sin(2 * Math.PI * k / 200)).toFixed(1);
    s += `<path d="${d}" class="pa-c-fantome"/>`;

    zone.innerHTML = `<div class="pa-cercle">
        <svg viewBox="0 0 670 290" class="pa-cercle-svg" role="img" aria-label="Point tournant sur un cercle trigonométrique et courbe sinusoïdale correspondante">${s}<g data-c="dyn"></g></svg>
        <div class="pa-range-ligne">
          <button type="button" class="btn-small pa-fin" data-c="anim" aria-label="Animer">▶</button>
          <input type="range" class="pa-range" min="0" max="200" step="1" value="0" aria-label="Date t, de 0 à 20 ms">
        </div>
        <p class="pa-cercle-txt" data-c="txt" aria-live="polite"></p>
      </div>`;
    const dyn = zone.querySelector('[data-c="dyn"]'), txt = zone.querySelector('[data-c="txt"]');
    const range = zone.querySelector('input'), bAnim = zone.querySelector('[data-c="anim"]');
    const NOMS = { 0: ['0', ''], 50: ['π/2', 'un quart de tour'], 100: ['π', 'un demi-tour'], 150: ['3π/2', 'trois quarts de tour'], 200: ['2π', 'un tour complet : le point revient à son point de départ, la courbe reprend la même valeur'] };
    const FR = { 0: '0', 50: 'T/4', 100: 'T/2', 150: '3T/4', 200: 'T' };
    function dessiner() {
      const k = +range.value, t = k / 10, th = 2 * Math.PI * t / T;
      const mx = CX + RC * Math.cos(th), my = CY - RC * Math.sin(th);
      // arc parcouru (de l'angle 0 à θ)
      let arc = '';
      if (k >= 200) arc = `<circle cx="${CX}" cy="${CY}" r="${RC}" class="pa-c-arc"/>`;
      else if (k > 0) arc = `<path d="M${CX + RC},${CY} A${RC},${RC} 0 ${th > Math.PI ? 1 : 0} 0 ${mx.toFixed(1)},${my.toFixed(1)}" class="pa-c-arc"/>`;
      let tr = '';
      for (let j = 0; j <= k; j++) tr += (j ? 'L' : 'M') + px(j / 10).toFixed(1) + ',' + py(Math.sin(2 * Math.PI * j / 200)).toFixed(1);
      dyn.innerHTML = `${arc}<path d="${tr}" class="pa-c-trace"/>
        <line x1="${CX}" y1="${CY}" x2="${mx.toFixed(1)}" y2="${my.toFixed(1)}" class="pa-c-rayon"/>
        <line x1="${mx.toFixed(1)}" y1="${my.toFixed(1)}" x2="${px(t).toFixed(1)}" y2="${my.toFixed(1)}" class="pa-c-lien"/>
        <circle cx="${mx.toFixed(1)}" cy="${my.toFixed(1)}" r="8" class="pa-c-point"/>
        <circle cx="${px(t).toFixed(1)}" cy="${my.toFixed(1)}" r="7" class="pa-c-point"/>`;
      const nom = NOMS[k];
      txt.innerHTML = nom
        ? `t = ${FR[k]}${k ? ` = ${fmt(t)} ms` : ''} → angle parcouru : <b>${nom[0]} rad</b>${nom[1] ? ` (${nom[1]})` : ''}`
        : `t = ${fmt(t, 1)} ms → angle parcouru : <b>${fmt(th, 2)} rad</b>`;
    }
    let anim = null;
    function arreter() { cancelAnimationFrame(anim); anim = null; bAnim.textContent = '▶'; }
    bAnim.addEventListener('click', () => {
      if (anim) { arreter(); return; }
      if (+range.value >= 200) range.value = 0;
      bAnim.textContent = '❚❚';
      const v0 = +range.value, debut = performance.now();
      const pas = now => {
        const v = Math.min(200, v0 + (now - debut) / 25);       // 5 s pour un tour complet
        range.value = Math.round(v);
        dessiner();
        if (v < 200) anim = requestAnimationFrame(pas); else arreter();
      };
      anim = requestAnimationFrame(pas);
    });
    PA.curseurTactile(range);
    range.addEventListener('input', () => { if (anim) arreter(); dessiner(); });
    dessiner();
  }

  /* ============================================================
     SCHÉMA DE CONVERSION D'ÉNERGIE
     c = { A, B, K, eta, D, E } : contenus (HTML) des emplacements
       A   ligne avant le compteur (puissance apparente S, U_eff, I_eff)
       B   ligne entre le compteur et l'appareil (puissance active P)
       K   facteur de puissance (sous la ligne)
       eta rendement, dans l'appareil
       D   sortie utile (puissance utile P_u)
       E   pertes (puissance perdue)
     Disposition horizontale, verticale sur téléphone (pa.css).
     ============================================================ */
  function schema(c, cls) {
    c = c || {};
    return `<div class="sc ${cls || ''}">
      <div class="sc-z sc-la">${c.A || ''}</div>
      <div class="sc-fl sc-fa" aria-hidden="true"></div>
      <div class="sc-bloc sc-cp">compteur</div>
      <div class="sc-z sc-lb">${c.B || ''}</div>
      <div class="sc-fl sc-fb" aria-hidden="true"></div>
      <div class="sc-z sc-kk">${c.K || ''}</div>
      <div class="sc-bloc sc-ap">appareil${c.eta ? `<div class="sc-eta">${c.eta}</div>` : '<div class="sc-eta">(η)</div>'}</div>
      <div class="sc-z sc-lu">${c.D || ''}</div>
      <div class="sc-fl sc-fu" aria-hidden="true"></div>
      <div class="sc-fl sc-fp" aria-hidden="true"></div>
      <div class="sc-z sc-lp">${c.E || ''}</div>
    </div>`;
  }
  // contenu du cours : nom et relation de chaque puissance
  const SCHEMA_COURS = {
    A: '<p class="sc-t">Puissance apparente</p><p class="sc-f">S = U<sub>eff</sub> × I<sub>eff</sub></p>',
    B: '<p class="sc-t">Puissance active</p><p class="sc-f">P = U<sub>eff</sub> × I<sub>eff</sub> × cos φ</p>',
    K: '<p class="sc-k">Facteur de puissance : <span>k = cos φ = P / S</span></p>',
    D: '<p class="sc-t">Puissance utile</p><p class="sc-f">P<sub>u</sub> = η × P</p>',
    E: '<p class="sc-t">Puissance perdue</p><p class="sc-f">P<sub>perdue</sub> = P − P<sub>u</sub></p>',
  };
  const slot = nom => `<span class="sc-slot" data-slot="${nom}"><span class="sc-slot-ph">?</span></span>`;
  const ligne = (nom, s) => `<div class="sc-ligne"><span class="sc-nom">${nom}</span>${slot(s)}</div>`;
  // schéma dont les cases portent le nom des grandeurs (placer les données d'un énoncé)
  const SCHEMA_DONNEES = {
    A: ligne('S =', 'S') + ligne('U<sub>eff</sub> =', 'U') + ligne('I<sub>eff</sub> =', 'I'),
    B: ligne('P =', 'P'),
    K: ligne('φ =', 'phi') + ligne('k = cos φ =', 'k'),
    eta: ligne('η =', 'eta'),
    D: ligne('P<sub>u</sub> =', 'Pu'),
    E: ligne('P<sub>perdue</sub> =', 'Pp'),
  };
  // schéma avec une case à chaque emplacement (placer les puissances)
  const SCHEMA_POSITIONS = { A: slot('A'), B: slot('B'), K: slot('K'), D: slot('D'), E: slot('E') };
  // étiquettes : les puissances et le facteur de puissance, à placer sur le schéma
  const ETIQ_NOMS = [
    { id: 'S', label: 'Puissance apparente S', cible: 'A', indice: 'La puissance apparente S = U<sub>eff</sub> × I<sub>eff</sub> est du côté du réseau, avant le compteur.' },
    { id: 'P', label: 'Puissance active P', cible: 'B', indice: 'La puissance active P est celle que reçoit l\'appareil : entre le compteur et l\'appareil.' },
    { id: 'k', label: 'Facteur de puissance k', cible: 'K', indice: 'Le facteur de puissance k = P / S se place avec la puissance active, entre le compteur et l\'appareil.' },
    { id: 'Pu', label: 'Puissance utile P<sub>u</sub>', cible: 'D', indice: 'La puissance utile sort de l\'appareil : c\'est ce qu\'on attend de lui.' },
    { id: 'Pp', label: 'Puissance perdue P<sub>perdue</sub>', cible: 'E', indice: 'La puissance perdue sort aussi de l\'appareil, à côté de la puissance utile.' },
  ];
  // étiquettes : les relations de chaque puissance
  const ETIQ_RELATIONS = [
    { id: 'S', label: 'U<sub>eff</sub> × I<sub>eff</sub>', cible: 'A', indice: 'U<sub>eff</sub> × I<sub>eff</sub> est la puissance apparente S, avant le compteur.' },
    { id: 'P', label: 'U<sub>eff</sub> × I<sub>eff</sub> × cos φ', cible: 'B', indice: 'U<sub>eff</sub> × I<sub>eff</sub> × cos φ est la puissance active P, entre le compteur et l\'appareil.' },
    { id: 'k', label: 'P / S', cible: 'K', indice: 'P / S est le facteur de puissance k = cos φ.' },
    { id: 'Pu', label: 'η × P', cible: 'D', indice: 'η × P est la puissance utile.' },
    { id: 'Pp', label: 'P − P<sub>u</sub>', cible: 'E', indice: 'P − P<sub>u</sub> est la puissance perdue.' },
  ];

  // schéma rempli avec les données d'un énoncé : v = { S, U, I, P, phi, k, eta, Pu, Pp } ('?' : grandeur cherchée)
  function schemaValeurs(v) {
    const L = (nom, k) => v[k] === undefined ? '' :
      `<div class="sc-ligne"><span class="sc-nom">${nom}</span><span class="sc-val${v[k] === '?' ? ' inconnue' : ''}">${v[k]}</span></div>`;
    return schema({
      A: L('S =', 'S') + L('U<sub>eff</sub> =', 'U') + L('I<sub>eff</sub> =', 'I'), B: L('P =', 'P'),
      K: L('φ =', 'phi') + L('k = cos φ =', 'k'), eta: L('η =', 'eta'), D: L('P<sub>u</sub> =', 'Pu'), E: L('P<sub>perdue</sub> =', 'Pp'),
    });
  }
  // schéma dont un emplacement est remplacé par « ? » (reconnaître la puissance qui s'y trouve)
  function schemaQuestion(pos) {
    const c = { A: '<p class="sc-t">Puissance apparente</p>', B: '<p class="sc-t">Puissance active</p>', D: '<p class="sc-t">Puissance utile</p>', E: '<p class="sc-t">Puissance perdue</p>' };
    c[pos] = '<span class="sc-question">?</span>';
    return schema(c);
  }
  // plaque signalétique d'un appareil : lignes de texte
  const plaque = (titre, lignes) => `<div class="pa-plaque"><p class="pa-plaque-t">${titre}</p>${lignes.map(l => `<p>${l}</p>`).join('')}</div>`;

  /* ============================================================
     DÉFILEMENT AUTOMATIQUE PENDANT UN GLISSER (comme lgtools.js) :
     près du haut ou du bas de l'écran, la page défile
     ============================================================ */
  const defil = { y: -1, raf: null };
  function suivreY(e) { defil.y = e.clientY; }
  function tick() {
    const h = innerHeight, y = defil.y, haut = 110, bas = 60;
    let dy = 0;
    if (y >= 0 && y < haut) dy = -Math.min(16, Math.ceil((haut - y) / 4));
    else if (y > h - bas) dy = Math.min(16, Math.ceil((y - (h - bas)) / 4));
    if (dy) scrollBy(0, dy);
    defil.raf = requestAnimationFrame(tick);
  }
  function debutDefil() {
    defil.y = -1;
    addEventListener('pointermove', suivreY);
    if (!defil.raf) defil.raf = requestAnimationFrame(tick);
  }
  function finDefil() {
    removeEventListener('pointermove', suivreY);
    if (defil.raf) cancelAnimationFrame(defil.raf);
    defil.raf = null;
  }

  /* ============================================================
     PARTIES DE QUESTION (s'ajoutent à celles de ph.js)
     ============================================================ */

  // QCM précédé d'une figure
  function pChoixFig(zone, p, api) {
    zone.appendChild(el('div', 'pa-fig', p.figure));
    return window.PH.PARTIES.choix(zone, p, api);
  }

  // Bouton « Valider » d'une partie (même présentation que ph.js)
  function boutonValider(zone) {
    const a = el('div', 'er-actions ph-actions-partie', '<button type="button" class="btn-primary">Valider</button>');
    zone.appendChild(a);
    const b = a.querySelector('button');
    b.fermer = () => { b.disabled = true; a.remove(); };
    return b;
  }

  /* Mesure du déphasage à la règle : p.o = paramètres du graphique (defPhi).
     L'élève mesure T et Δt en cm, puis calcule φ = 2π × Δt / T. */
  const TOL = 2;                                       // écart accepté sur chaque mesure (mm)
  function pMesurePhi(zone, p, api) {
    const o = p.o, def = defPhi(o), R = LG.repere(def);
    const Tmm = o.T * R.mmX, dmm = Math.abs(o.dt) * R.mmX, phiVrai = 2 * Math.PI * dmm / Tmm;
    const d = el('div', 'pa-mesure-phi');
    const champ = (x, aria) => `<input type="text" class="lg-input lg-cell" data-x="${x}" inputmode="decimal" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="cm" aria-label="${aria}">`;
    d.innerHTML = `<div class="pa-regle" data-x="graphe"></div>
      <div class="pa-mesure-calc">
        <div class="lg-table-wrap"><table class="lg-table pa-prop">
          <colgroup><col class="lg-col-titre"><col><col></colgroup>
          <thead><tr><th></th><th>Distance mesurée (cm)</th><th>Angle (rad)</th></tr></thead>
          <tbody>
            <tr><th>Période T</th><td>${champ('T', 'Période T mesurée, en cm')}</td><td>2π</td></tr>
            <tr><th>Décalage Δt</th><td>${champ('dt', 'Décalage Δt mesuré, en cm')}</td><td class="lg-inconnue">φ</td></tr>
          </tbody></table></div>
        <div class="ph-valeur pa-phi-ligne"><span class="ph-lab">φ = 2π × Δt / T =</span>
          <input type="text" class="lg-input pa-phi-champ" data-x="phi" inputmode="decimal" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Déphasage φ, en radians">
          <span class="ph-unite">rad</span></div>
      </div>
      <div class="pa-correction" data-x="correction"></div>`;
    zone.appendChild(d);
    const regle = LG.bacASable(d.querySelector('[data-x="graphe"]'), def);
    const ch = { T: d.querySelector('[data-x="T"]'), dt: d.querySelector('[data-x="dt"]'), phi: d.querySelector('[data-x="phi"]') };
    const bVal = boutonValider(zone);
    Object.keys(ch).forEach(k => {
      ch[k].addEventListener('input', () => { ch[k].classList.remove('is-ok', 'is-ko'); api.effacer(); });
      ch[k].addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); valider(); } });
    });
    const marquer = (k, ok) => { ch[k].classList.toggle('is-ok', ok); ch[k].classList.toggle('is-ko', !ok); };
    // unité éventuellement tapée après le nombre (« 6,8 cm », « 1,02 rad ») : ignorée
    const sansUnite = s => String(s).replace(/\s*(cm|rad)\s*$/i, '');
    const decimales = s => { const m = sansUnite(s).replace(/\s/g, '').match(/[.,](\d+)$/); return m ? m[1].length : 0; };

    function valider() {
      if (api.fini()) return;
      const T = lire(sansUnite(ch.T.value)), dt = lire(sansUnite(ch.dt.value)), phi = lire(sansUnite(ch.phi.value));
      if ([T, dt, phi].some(v => isNaN(v))) {
        secouer(d.querySelector('.pa-mesure-calc'));
        api.message('Complète les trois cases : T et Δt mesurés à la règle (en cm), puis φ (en rad).');
        return;
      }
      const err = [];
      // période : une seule, entre deux sommets voisins de la même courbe
      const okT = Math.abs(T * 10 - Tmm) <= TOL;
      if (!okT) {
        if (Math.abs(T * 10 - 2 * Tmm) <= 2 * TOL) err.push('T : tu as mesuré <b>deux</b> périodes. Mesure une seule période (ou divise ta mesure par 2).');
        else if (Math.abs(T * 10 - Tmm / 2) <= TOL) err.push('T : tu as mesuré une <b>demi</b>-période. Il faut aller d\'un sommet au sommet <b>suivant</b> de la même courbe.');
        else err.push('T : place le 0 de la règle sur un sommet d\'une courbe et le curseur sur le sommet suivant de la <b>même</b> courbe.');
      }
      // décalage : entre deux sommets voisins (un de chaque courbe)
      const okDt = Math.abs(dt * 10 - dmm) <= TOL;
      if (!okDt) {
        if (Math.abs(dt * 10 - (Tmm - dmm)) <= TOL) err.push('Δt : tu as pris deux sommets trop éloignés. Prends un sommet de i et le sommet de u <b>le plus proche</b>.');
        else if (Math.abs(dt * 10 - Tmm) <= TOL) err.push('Δt : tu as mesuré une période. Δt est le décalage entre un sommet de i et le sommet de u le plus proche.');
        else err.push('Δt : place le 0 de la règle sur un sommet de i et le curseur sur le sommet de u le plus proche (ou l\'inverse).');
      }
      marquer('T', okT); marquer('dt', okDt);
      // φ : calculé avec les mesures de l'élève (ou les valeurs exactes)
      let okPhi = false;
      if (T > 0 && dt > 0) {
        const phiE = 2 * Math.PI * dt / T;
        okPhi = Math.abs(phi - phiE) <= .02 || Math.abs(phi - phiVrai) <= .02;
        if (!okPhi) {
          if (Math.abs(phi - 360 * dt / T) < 1) err.push('φ : tu as calculé un angle en <b>degrés</b>. En radians, une période correspond à <b>2π</b> rad : φ = 2π × Δt / T.');
          else if (Math.abs(phi - dt / T) < .01) err.push('φ : tu as oublié de multiplier par 2π : φ = 2π × Δt / T.');
          else if (Math.abs(phi - 2 * Math.PI * T / dt) < .1) err.push('φ : tu as inversé T et Δt. Le produit en croix donne φ = 2π × Δt / T.');
          else if (Math.abs(phi - Math.PI * dt / T) < .02) err.push('φ : une période correspond à <b>2π</b> rad, pas à π : φ = 2π × Δt / T.');
          else if (Math.abs(phi - phiE) < .07 && decimales(ch.phi.value) < 2) err.push(`φ : arrondis au centième (deux chiffres après la virgule) : 2π × ${fmt(dt)} / ${fmt(T)} ≈ ${fmt(phiE, 2)}.`);
          else err.push(`φ : avec tes mesures, calcule φ = 2π × Δt / T = 2π × ${fmt(dt)} / ${fmt(T)}.`);
        }
      }
      marquer('phi', okPhi);
      if (!err.length) {
        regle.detruire();
        Object.keys(ch).forEach(k => { ch[k].readOnly = true; });
        bVal.fermer();
        api.reussi();
        return;
      }
      api.erreur(err.join('<br>'));
      secouer(d.querySelector('.pa-mesure-calc'));
    }
    bVal.onclick = valider;
    return {
      montrer() {
        const Tc = Math.round(Tmm) / 10, dc = Math.round(dmm) / 10;
        ch.T.value = fmt(Tc, 1); ch.dt.value = fmt(dc, 1); ch.phi.value = fmt(2 * Math.PI * dc / Tc, 2);
        Object.keys(ch).forEach(k => { ch[k].readOnly = true; marquer(k, true); });
        bVal.fermer();
        regle.detruire();
        d.querySelector('[data-x="correction"]').innerHTML = `<p class="pa-correction-t">Les mesures à la règle :</p>
          <div class="pa-correction-figs"><div>${figPhi(o, { regles: ['T'] })}<p>Période T (entre deux sommets de u)</p></div>
          <div>${figPhi(o, { regles: ['dt'] })}<p>Décalage Δt (entre deux sommets voisins)</p></div></div>`;
      },
    };
  }
  // texte de la correction d'une mesure (solution de la partie)
  function solutionPhi(o) {
    const R = LG.repere(defPhi(o)), Tc = Math.round(o.T * R.mmX) / 10, dc = Math.round(Math.abs(o.dt) * R.mmX) / 10;
    return `<p>T ≈ ${fmt(Tc, 1)} cm et Δt ≈ ${fmt(dc, 1)} cm (à 1 ou 2 mm près), donc :</p>
      <p class="ph-calc">φ = 2π × Δt / T ≈ 2π × ${fmt(dc, 1)} / ${fmt(Tc, 1)} ≈ <span class="c">${fmt(2 * Math.PI * dc / Tc, 2)} rad</span></p>`;
  }

  /* Glisser-déposer sur le schéma de conversion.
     p.contenus : contenus du schéma (PA.SCHEMA_DONNEES, PA.SCHEMA_POSITIONS…)
     p.etiquettes : [{ id, label, cible (nom de case ou liste), indice }]
     Toutes les étiquettes doivent être placées ; les cases restantes sont les inconnues. */
  function pSchema(zone, p, api) {
    const d = el('div', 'sc-exo');
    d.innerHTML = `<div class="sc-palette"><p class="sc-palette-t">${p.titrePalette || 'Étiquettes à placer'} <span>· fais-les glisser sur le schéma, ou touche une étiquette puis une case</span></p>
        <div class="sc-palette-liste">${melanger(p.etiquettes).map(e => `<button type="button" class="sc-chip" data-id="${e.id}"><span>${e.label}</span></button>`).join('')}</div></div>
      ${schema(p.contenus, p.classe)}`;
    zone.appendChild(d);
    const palette = d.querySelector('.sc-palette-liste');
    const chips = Array.from(d.querySelectorAll('.sc-chip'));
    const slots = Array.from(d.querySelectorAll('.sc-slot'));
    const etiq = id => p.etiquettes.find(e => e.id === id);
    const cibles = c => [].concat(etiq(c.dataset.id).cible);
    const bVal = boutonValider(zone);
    let choisie = null, fini = false;

    function choisir(c) {
      if (choisie) choisie.classList.remove('sc-choisie');
      choisie = c;
      if (c) c.classList.add('sc-choisie');
      d.classList.toggle('sc-en-choix', !!c);
    }
    function remettrePh(s) {
      if (s && s.classList.contains('sc-slot') && !s.querySelector('.sc-chip') && !s.querySelector('.sc-slot-ph')) s.insertAdjacentHTML('afterbegin', '<span class="sc-slot-ph">?</span>');
    }
    // place une étiquette dans une case (l'occupante retourne dans la palette) ou dans la palette
    function placer(c, cible) {
      const ancien = c.parentElement;
      if (cible === ancien) return;
      if (cible.classList.contains('sc-slot')) {
        const occ = cible.querySelector('.sc-chip');
        if (occ) palette.appendChild(occ);
        const ph = cible.querySelector('.sc-slot-ph');
        if (ph) ph.remove();
        cible.appendChild(c);
      } else palette.appendChild(c);
      remettrePh(ancien);
      slots.forEach(s => s.classList.remove('ok', 'ko'));
      d.querySelector('.sc-palette').classList.toggle('vide', !palette.querySelector('.sc-chip'));
      api.effacer();
    }
    chips.forEach(c => {
      let x0 = 0, y0 = 0;
      c.addEventListener('pointerdown', e => { x0 = e.clientX; y0 = e.clientY; }, true);
      window.DragDrop.enable(c, {
        zoneSelector: '.sc-slot, .sc-palette',
        dragOverClass: 'sc-over',
        onStart: debutDefil,
        onCancel: finDefil,
        onDrop: (item, z, e) => {
          finDefil();
          if (fini) return;
          // simple appui (sans glisser) : sélection, ou dépôt de l'étiquette déjà choisie dans cette case
          if (Math.hypot(e.clientX - x0, e.clientY - y0) < 8) {
            if (choisie === item) { choisir(null); return; }
            if (choisie && item.parentElement.classList.contains('sc-slot')) { placer(choisie, item.parentElement); choisir(null); return; }
            choisir(item);
            return;
          }
          choisir(null);
          if (!z || !d.contains(z)) return;
          placer(item, z.classList.contains('sc-palette') ? palette : z);
        },
      });
      // clavier (Entrée, Espace) : sélection. Pas d'écoute de « click » : après un appui
      // au doigt, certains navigateurs envoient un click impossible à distinguer du clavier
      c.addEventListener('keydown', e => {
        if ((e.key === 'Enter' || e.key === ' ') && !fini) { e.preventDefault(); choisir(choisie === c ? null : c); }
      });
    });
    slots.forEach(s => {
      s.addEventListener('click', e => {
        if (fini || !choisie || e.target.closest('.sc-chip')) return;
        placer(choisie, s); choisir(null);
      });
      // au clavier : Tab jusqu'à la case, puis Entrée
      s.tabIndex = 0;
      s.addEventListener('keydown', e => {
        if ((e.key === 'Enter' || e.key === ' ') && e.target === s && choisie && !fini) { e.preventDefault(); placer(choisie, s); choisir(null); }
      });
    });
    d.querySelector('.sc-palette').addEventListener('click', e => {
      if (fini || !choisie || e.target.closest('.sc-chip')) return;
      placer(choisie, palette); choisir(null);
    });

    function terminer() {
      fini = true;
      choisir(null);
      chips.forEach(c => { c.style.pointerEvents = 'none'; c.tabIndex = -1; });
      slots.forEach(s => { s.tabIndex = -1; });
      d.classList.add('sc-fini');
      bVal.fermer();
    }
    bVal.onclick = () => {
      if (fini || api.fini()) return;
      const reste = palette.querySelectorAll('.sc-chip').length;
      if (reste) {
        secouer(d.querySelector('.sc-palette'));
        api.message(`Place toutes les étiquettes sur le schéma (il en reste ${reste}).`);
        return;
      }
      const fausses = [];
      chips.forEach(c => {
        const s = c.parentElement, ok = cibles(c).indexOf(s.dataset.slot) !== -1;
        s.classList.toggle('ok', ok); s.classList.toggle('ko', !ok);
        if (!ok) fausses.push(c);
      });
      if (!fausses.length) { terminer(); api.reussi(); return; }
      const indices = fausses.map(c => etiq(c.dataset.id).indice).filter(Boolean);
      api.erreur(`${fausses.length > 1 ? `${fausses.length} étiquettes sont mal placées` : 'Une étiquette est mal placée'} (case rouge).` +
        (indices.length ? '<br>' + indices.map(t => '☛ ' + t).join('<br>') : ''));
      secouer(d.querySelector('.sc'));
    };
    return {
      montrer() {
        chips.forEach(c => {
          const s = slots.find(x => x.dataset.slot === cibles(c)[0]);
          placer(c, s);
          s.classList.add('ok');
        });
        terminer();
      },
    };
  }

  Object.assign(window.PH.PARTIES, { choixFig: pChoixFig, mesurePhi: pMesurePhi, schema: pSchema });
  Object.assign(PA, {
    defPhi, figPhi, reglesPhi, sommets, flecheH, tirets, texte, tabProp, cercle, solutionPhi,
    schema, slot, SCHEMA_COURS, SCHEMA_DONNEES, SCHEMA_POSITIONS, schemaValeurs, schemaQuestion, plaque,
    ETIQ_NOMS, ETIQ_RELATIONS,
  });
})();
