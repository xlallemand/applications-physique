/* ============================================================
   Maquette du futur outil MONTAGE (application « Réaliser un montage électrique »)
   Design seulement : dessin de la table de montage (vue de dessus) et du schéma
   normalisé, fils souples, bornes, multimètre, générateur, états (lampe allumée,
   moteur qui tourne, DEL…). Aucune règle de montage, aucun calcul : les états
   sont fixés par les pages de la maquette.

   API (objet global MAQ) :
     MAQ.table(zone, scene, options)     dessine une table de montage dans zone (div)
       scene = { W, H, materiel: [{ id, type, x, y, ...état }], fils: [['G.plus', 'A.10A'], …] }
         types : generateur { tension }, multimetre { position, affiche }, resistance { valeur },
                 lampe { allumee }, interrupteur { ferme }, del { allumee }, moteur { tourne: 0 | 1 | −1 }
       options = { rendu: 'plat' | 'relief', libre: true (tirer et retirer des fils),
                   reglage: 'molette' | 'cadran', onChange(scene) }
       → { scene, redessiner(), enCours(de, x, y), refus(borne, html), effacerMessage(), detruire() }
     MAQ.schema(zone, schema, options)   dessine un schéma normalisé
       schema = { vb: [l, h], dipoles: [{ id, type, x, y, rot, valeur, ouvert }], fils: [{ id, pts }],
                  noeuds: [{ id, x, y }], intensites: [{ nom, x, y, dir }], tensions: [{ nom, x1, y1, x2, y2, cote }] }
       options = { boucle: [ids], branches: [ids], choisis: [ids], allumes: [ids], com: true, libre: true }
       → { maj(options) }
     MAQ.POSITIONS                       positions du sélecteur du multimètre
     MAQ.libellePosition(id)             « A ⎓ · 10 A »
   ============================================================ */
(function () {
  'use strict';

  const NS = 'http://www.w3.org/2000/svg';
  const fr = v => String(v).replace('.', ',').replace('-', '−');

  /* ---------- Dégradés partagés (une seule fois par page) ---------- */
  // Les couleurs viennent des variables du thème (classes mt-s-… sur les arrêts).
  function defs() {
    if (document.getElementById('mt-defs')) return;
    const s = document.createElementNS(NS, 'svg');
    s.id = 'mt-defs'; s.setAttribute('aria-hidden', 'true');
    s.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
    s.innerHTML = `<defs>
      <linearGradient id="mt-g-boitier" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" class="mt-s-sheet"/><stop offset=".6" class="mt-s-paper2"/><stop offset="1" class="mt-s-paper3"/></linearGradient>
      <linearGradient id="mt-g-plaque" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" class="mt-s-paper"/><stop offset="1" class="mt-s-paper3"/></linearGradient>
      <linearGradient id="mt-g-etui" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" class="mt-s-ink3"/><stop offset=".5" class="mt-s-ink2"/><stop offset="1" class="mt-s-ink"/></linearGradient>
      <linearGradient id="mt-g-ecran" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" class="mt-s-paper"/><stop offset="1" class="mt-s-paper3"/></linearGradient>
      <linearGradient id="mt-g-corps" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" class="mt-s-sheet"/><stop offset=".45" class="mt-s-paper2"/><stop offset="1" class="mt-s-ink3"/></linearGradient>
      <linearGradient id="mt-g-levier" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" class="mt-s-sheet"/><stop offset="1" class="mt-s-ink3"/></linearGradient>
      <radialGradient id="mt-g-metal" cx=".35" cy=".3" r=".75">
        <stop offset="0" class="mt-s-sheet"/><stop offset=".55" class="mt-s-paper3"/><stop offset="1" class="mt-s-ink3"/></radialGradient>
      <radialGradient id="mt-g-bouton" cx=".38" cy=".32" r=".8">
        <stop offset="0" class="mt-s-sheet"/><stop offset=".7" class="mt-s-paper2"/><stop offset="1" class="mt-s-paper3"/></radialGradient>
      <radialGradient id="mt-g-verre" cx=".36" cy=".32" r=".75">
        <stop offset="0" class="mt-s-sheet"/><stop offset=".6" class="mt-s-sheet"/><stop offset="1" class="mt-s-paper3"/></radialGradient>
      <radialGradient id="mt-g-moteur" cx=".4" cy=".35" r=".75">
        <stop offset="0" class="mt-s-paper"/><stop offset=".7" class="mt-s-paper3"/><stop offset="1" class="mt-s-ink3"/></radialGradient>
      <radialGradient id="mt-g-halo" cx=".5" cy=".5" r=".5">
        <stop offset="0" class="mt-s-cle" stop-opacity="1"/><stop offset=".55" class="mt-s-cle" stop-opacity=".9"/><stop offset="1" class="mt-s-cle" stop-opacity="0"/></radialGradient>
      <radialGradient id="mt-g-del" cx=".4" cy=".35" r=".7">
        <stop offset="0" class="mt-s-sheet"/><stop offset=".45" class="mt-s-accent"/><stop offset="1" class="mt-s-accentink"/></radialGradient>
      <radialGradient id="mt-g-deloff" cx=".4" cy=".35" r=".7">
        <stop offset="0" class="mt-s-sheet"/><stop offset=".6" class="mt-s-paper2"/><stop offset="1" class="mt-s-paper3"/></radialGradient>
    </defs>`;
    document.body.prepend(s);
  }

  /* ---------- Afficheur à 7 segments ---------- */
  // segments allumés pour chaque caractère
  const SEG = { '0': 'abcdef', '1': 'bc', '2': 'abged', '3': 'abgcd', '4': 'fgbc', '5': 'afgcd', '6': 'afgedc',
                '7': 'abc', '8': 'abcdefg', '9': 'abcdfg', '-': 'g', ' ': '', 'L': 'fed' };
  // un chiffre de hauteur h en (x, y) ; on = segments allumés
  function chiffre(x, y, h, on, point) {
    const w = h * .54, t = h * .13, m = t * .55, hh = h / 2;
    const r = (id, rx, ry, rw, rh) =>
      `<rect class="${on.includes(id) ? 'mt-seg' : 'mt-seg-off'}" x="${(x + rx).toFixed(1)}" y="${(y + ry).toFixed(1)}" width="${rw.toFixed(1)}" height="${rh.toFixed(1)}" rx="${(t / 2).toFixed(1)}"/>`;
    let s = r('a', m, 0, w - 2 * m, t) + r('g', m, hh - t / 2, w - 2 * m, t) + r('d', m, h - t, w - 2 * m, t)
          + r('f', 0, m, t, hh - m - t * .2) + r('b', w - t, m, t, hh - m - t * .2)
          + r('e', 0, hh + t * .2, t, hh - m - t * .2) + r('c', w - t, hh + t * .2, t, hh - m - t * .2);
    if (point !== undefined) s += `<circle class="${point ? 'mt-seg' : 'mt-seg-off'}" cx="${(x + w + h * .1).toFixed(1)}" cy="${(y + h - t / 2).toFixed(1)}" r="${(t * .6).toFixed(1)}"/>`;
    return s;
  }
  // texte « -16.3 » sur n cases de chiffres, aligné à droite, en (x, y) ; signe moins à gauche
  function afficheur(x, y, h, txt, n, signe) {
    txt = String(txt == null ? '' : txt);
    const neg = txt.startsWith('-');
    if (neg) txt = txt.slice(1);
    const cases = [];
    for (const c of txt) {
      if (c === '.' && cases.length) cases[cases.length - 1].p = true;
      else cases.push({ c, p: false });
    }
    while (cases.length < n) cases.unshift({ c: ' ', p: false });
    const pas = h * .54 + h * .26;
    let s = `<g transform="skewX(-7) translate(${(y * .12).toFixed(1)} 0)">`;
    if (signe) s += `<rect class="${neg ? 'mt-seg' : 'mt-seg-off'}" x="${x - h * .42}" y="${y + h / 2 - h * .065}" width="${h * .3}" height="${h * .13}" rx="${h * .06}"/>`;
    cases.slice(-n).forEach((k, i) => { s += chiffre(x + i * pas, y, h, SEG[k.c] || '', i < n - 1 ? k.p : undefined); });
    return s + '</g>';
  }

  /* ---------- Sélecteur du multimètre ---------- */
  // positions dans l'ordre des aiguilles d'une montre, à partir de OFF (en haut) ; 20 crans de 18°
  const POSITIONS = [
    { id: 'OFF', zone: 'OFF', lab: 'OFF' },
    { id: 'V600', zone: 'V⎓', lab: '600', cal: '600 V' }, { id: 'V200', zone: 'V⎓', lab: '200', cal: '200 V' },
    { id: 'V20', zone: 'V⎓', lab: '20', cal: '20 V' }, { id: 'V2', zone: 'V⎓', lab: '2', cal: '2 V' },
    { id: 'V200m', zone: 'V⎓', lab: '200m', cal: '200 mV' },
    { id: 'VAC600', zone: 'V∼', lab: '600', cal: '600 V' }, { id: 'VAC200', zone: 'V∼', lab: '200', cal: '200 V' },
    { id: 'AAC10', zone: 'A∼', lab: '10A', cal: '10 A' }, { id: 'AAC200m', zone: 'A∼', lab: '200m', cal: '200 mA' },
    { id: 'A10', zone: 'A⎓', lab: '10A', cal: '10 A' }, { id: 'A200m', zone: 'A⎓', lab: '200m', cal: '200 mA' },
    { id: 'A20m', zone: 'A⎓', lab: '20m', cal: '20 mA' }, { id: 'A2m', zone: 'A⎓', lab: '2m', cal: '2 mA' },
    { id: 'O200', zone: 'Ω', lab: '200', cal: '200 Ω' }, { id: 'O2k', zone: 'Ω', lab: '2k', cal: '2 kΩ' },
    { id: 'O20k', zone: 'Ω', lab: '20k', cal: '20 kΩ' }, { id: 'O200k', zone: 'Ω', lab: '200k', cal: '200 kΩ' },
    { id: 'O2M', zone: 'Ω', lab: '2M', cal: '2 MΩ' },
  ];
  POSITIONS.forEach((p, i) => { p.ang = i * 18; });
  const ZONES = ['V⎓', 'V∼', 'A∼', 'A⎓', 'Ω'];
  const posDe = id => POSITIONS.find(p => p.id === id) || POSITIONS[0];
  const libellePosition = id => { const p = posDe(id); return p.id === 'OFF' ? 'Arrêt (OFF)' : `${p.zone} · ${p.cal}`; };
  const pol = (cx, cy, r, ang) => [cx + r * Math.sin(ang * Math.PI / 180), cy - r * Math.cos(ang * Math.PI / 180)];

  // cadran : centre (cx, cy), bouton de rayon rb, étiquettes au rayon re ; taille de police f
  function cadran(cx, cy, rb, re, rz, f, pos, grand) {
    const p = posDe(pos);
    let s = `<circle class="mt-cadran" cx="${cx}" cy="${cy}" r="${re + f * 1.6}"/>`;
    POSITIONS.forEach(q => {
      const [x, y] = pol(cx, cy, re, q.ang), [tx, ty] = pol(cx, cy, rb + f * .55, q.ang);
      s += `<circle class="mt-cran" cx="${tx.toFixed(1)}" cy="${ty.toFixed(1)}" r="${(f * .17).toFixed(2)}"/>`;
      s += `<text class="mt-pos${q.id === p.id ? ' ici' : ''}" x="${x.toFixed(1)}" y="${(y + f * .35).toFixed(1)}" font-size="${f}" text-anchor="middle">${q.lab}</text>`;
      if (grand) s += `<circle class="mt-cible-pos" data-pos="${q.id}" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${grand}"/>`;
    });
    // nom de chaque zone, au milieu de ses positions, et arc qui regroupe ses calibres
    ZONES.forEach(z => {
      const qs = POSITIONS.filter(q => q.zone === z), a = qs.reduce((m, q) => m + q.ang, 0) / qs.length;
      const a1 = qs[0].ang - 6, a2 = qs[qs.length - 1].ang + 6, ra = re + f * 1.4;
      const [x1, y1] = pol(cx, cy, ra, a1), [x2, y2] = pol(cx, cy, ra, a2);
      s += `<path class="mt-arc-zone${z === p.zone ? ' ici' : ''}" d="M${x1.toFixed(1)} ${y1.toFixed(1)} A${ra} ${ra} 0 0 1 ${x2.toFixed(1)} ${y2.toFixed(1)}"/>`;
      const [x, y] = pol(cx, cy, rz, a);
      s += `<text class="mt-zone${z === p.zone ? ' ici' : ''}" x="${x.toFixed(1)}" y="${(y + f * .45).toFixed(1)}" font-size="${(f * 1.25).toFixed(1)}" text-anchor="middle">${z}</text>`;
    });
    // bouton rotatif : barre et index pointé vers la position choisie
    s += `<g class="mt-bouton-rot" transform="rotate(${p.ang} ${cx} ${cy})">
      <circle class="mt-bouton" cx="${cx}" cy="${cy}" r="${rb}"/>
      <rect class="mt-bouton-barre" x="${cx - rb * .3}" y="${cy - rb * .92}" width="${rb * .6}" height="${rb * 1.84}" rx="${rb * .3}"/>
      <path class="mt-bouton-index" d="M${cx} ${cy - rb * .98} l${-rb * .2} ${rb * .34} h${rb * .4} z"/>
    </g>`;
    return s;
  }

  /* ---------- Bornes ---------- */
  // genre : plus (cerclée accent), moins (cerclée encre), entree (multimètre, accent), com (encre), neutre
  function borneDessin(b) {
    return `<g class="mt-borne mt-b-${b.genre}">
      <circle class="mt-b-anneau" cx="${b.x}" cy="${b.y}" r="11"/>
      <circle class="mt-b-douille" cx="${b.x}" cy="${b.y}" r="8"/>
      <circle class="mt-b-trou" cx="${b.x}" cy="${b.y}" r="3.3"/>
    </g>`;
  }

  /* ---------- Matériel (coordonnées locales, origine en haut à gauche) ---------- */
  // chaque fonction renvoie { w, h, svg, bornes: { nom: { x, y, genre } }, zones: { nom: { x, y, r } } }
  const MAT = {
    generateur(o) {
      const w = 180, h = 124, t = o.tension == null ? 0 : o.tension;
      const ang = -135 + 270 * Math.min(1, Math.max(0, Math.abs(t) / 12));
      const txt = Math.abs(t) >= 10 ? t.toFixed(1) : t.toFixed(2);
      return { w, h, svg: `
        <rect class="mt-boitier" x="0" y="0" width="${w}" height="${h}" rx="12"/>
        <rect class="mt-chant" x="2" y="${h - 7}" width="${w - 4}" height="5" rx="2.5"/>
        <text class="mt-marque" x="14" y="17">ALIMENTATION</text>
        <text class="mt-marque" x="${w - 14}" y="17" text-anchor="end">0 – 12 V ⎓</text>
        <rect class="mt-ecran-gen" x="14" y="25" width="90" height="40" rx="6"/>
        ${afficheur(24, 32, 25, txt, 3, true)}
        <text class="mt-ecran-unite" x="96" y="58" text-anchor="end">V</text>
        <g class="mt-bouton-gen">
          <circle class="mt-bouton-jupe" cx="143" cy="46" r="22"/>
          <circle class="mt-bouton" cx="143" cy="46" r="17"/>
          <line class="mt-bouton-trait" x1="143" y1="46" x2="${(143 + 13 * Math.sin(ang * Math.PI / 180)).toFixed(1)}" y2="${(46 - 13 * Math.cos(ang * Math.PI / 180)).toFixed(1)}"/>
        </g>
        <text class="mt-marque" x="143" y="80" text-anchor="middle">TENSION</text>
        <text class="mt-signe" x="40" y="105" text-anchor="middle">+</text>
        <text class="mt-signe" x="140" y="105" text-anchor="middle">−</text>`,
        bornes: { plus: { x: 62, y: 100, genre: 'plus' }, moins: { x: 118, y: 100, genre: 'moins' } },
        zones: { bouton: { x: 143, y: 46, r: 24 } } };
    },

    multimetre(o) {
      const w = 170, h = 262;
      return { w, h, svg: `
        <rect class="mt-etui" x="0" y="0" width="${w}" height="${h}" rx="20"/>
        <rect class="mt-face" x="8" y="8" width="${w - 16}" height="${h - 16}" rx="13"/>
        <rect class="mt-ecran" x="20" y="18" width="130" height="48" rx="6"/>
        ${afficheur(40, 27, 30, o.position === 'OFF' ? '' : (o.affiche == null ? '0.00' : o.affiche), 4, true)}
        ${cadran(85, 142, 24, 48, 65, 6.5, o.position || 'OFF')}
        <text class="mt-b-nom" x="19" y="216" text-anchor="middle">10A</text>
        <text class="mt-b-nom" x="63" y="216" text-anchor="middle">mA</text>
        <rect class="mt-com-cadre" x="91" y="206" width="32" height="13" rx="3"/>
        <text class="mt-b-nom" x="107" y="216" text-anchor="middle">COM</text>
        <text class="mt-b-nom" x="151" y="216" text-anchor="middle">VΩ</text>`,
        bornes: { '10A': { x: 19, y: 236, genre: 'entree' }, mA: { x: 63, y: 236, genre: 'entree' },
                  COM: { x: 107, y: 236, genre: 'com' }, V: { x: 151, y: 236, genre: 'entree' } },
        zones: { selecteur: { x: 85, y: 142, r: 40 } } };
    },

    // plaquette commune aux dipôles à deux bornes (largeur 112) ; h : hauteur, yb : hauteur des bornes
    _plaquette(h, yb, dedans, extra) {
      return { w: 112, h, svg: `
        <rect class="mt-plaque" x="0" y="0" width="112" height="${h}" rx="9"/>
        ${dedans}`,
        bornes: { 1: { x: 24, y: yb, genre: 'neutre' }, 2: { x: 88, y: yb, genre: 'neutre' } }, zones: extra || {} };
    },

    resistance(o) {
      return MAT._plaquette(76, 54, `
        <path class="mt-piste" d="M24 54 V26 H34 M88 54 V26 H78"/>
        <rect class="mt-corps" x="33" y="19" width="46" height="14" rx="6"/>
        <rect class="mt-anneau-r" x="41" y="19" width="3" height="14"/>
        <rect class="mt-anneau-r" x="48" y="19" width="3" height="14"/>
        <rect class="mt-anneau-r" x="55" y="19" width="3" height="14"/>
        <rect class="mt-anneau-r" x="68" y="19" width="3" height="14"/>
        <text class="mt-valeur" x="56" y="58" text-anchor="middle">${o.valeur || ''}</text>`);
    },

    lampe(o) {
      return MAT._plaquette(76, 54, `
        <path class="mt-piste" d="M24 54 V26 H36 M88 54 V26 H76"/>
        ${o.allumee ? '<circle class="mt-halo" cx="56" cy="26" r="40"/>' : ''}
        <circle class="mt-douille-lampe" cx="56" cy="26" r="19"/>
        <circle class="mt-verre${o.allumee ? ' allume' : ''}" cx="56" cy="26" r="14"/>
        <path class="mt-filament${o.allumee ? ' allume' : ''}" d="M49 29 l2.4 -6 l2.4 6 l2.4 -6 l2.4 6 l2.4 -6 l2.4 6"/>`);
    },

    interrupteur(o) {
      const a = o.ferme ? 0 : -22;
      return MAT._plaquette(76, 54, `
        <path class="mt-piste" d="M24 54 V28 H30 M88 54 V28 H82"/>
        <rect class="mt-contact" x="74" y="21" width="12" height="14" rx="3"/>
        <circle class="mt-pivot" cx="30" cy="28" r="6"/>
        <g transform="rotate(${a} 30 28)">
          <rect class="mt-lame" x="28" y="24.5" width="52" height="7" rx="3.5"/>
          <circle class="mt-manette" cx="80" cy="28" r="7"/>
        </g>
        <circle class="mt-rivet" cx="30" cy="28" r="2.4"/>`,
        { levier: { x: 62, y: 22, r: 24 } });
    },

    del(o) {
      return MAT._plaquette(76, 54, `
        <path class="mt-piste" d="M24 54 V28 H48 M88 54 V28 H64"/>
        ${o.allumee ? '<circle class="mt-halo" cx="56" cy="28" r="26"/>' : ''}
        <circle class="mt-del-collerette" cx="56" cy="28" r="10"/>
        <circle class="mt-del${o.allumee ? ' allume' : ''}" cx="56" cy="28" r="8"/>
        <text class="mt-signe-petit" x="8" y="42" text-anchor="middle">+</text>
        <text class="mt-marque" x="56" y="58" text-anchor="middle">DEL</text>`);
    },

    moteur(o) {
      const sens = o.tourne > 0 ? ' tourne' : o.tourne < 0 ? ' tourne inverse' : '';
      return Object.assign(MAT._plaquette(98, 76, `
        <path class="mt-piste" d="M24 76 V40 H34 M88 76 V40 H78"/>
        <circle class="mt-moteur" cx="56" cy="38" r="21"/>
        <g transform="translate(56 38)"><g class="mt-helice${sens}">
          <path class="mt-pale" d="M0 -3 C 6 -12, 5 -28, 0 -31 C -5 -28, -6 -12, 0 -3 Z"/>
          <path class="mt-pale" transform="rotate(120)" d="M0 -3 C 6 -12, 5 -28, 0 -31 C -5 -28, -6 -12, 0 -3 Z"/>
          <path class="mt-pale" transform="rotate(240)" d="M0 -3 C 6 -12, 5 -28, 0 -31 C -5 -28, -6 -12, 0 -3 Z"/>
          <circle class="mt-moyeu" r="5"/>
        </g></g>
        ${o.tourne ? `<path class="mt-sens" d="${o.tourne > 0 ? 'M 86 18 A 34 34 0 0 1 92 40' : 'M 26 18 A 34 34 0 0 0 20 40'}" marker-end="url(#mt-fl-sens)"/>` : ''}`));
    },
  };

  /* ---------- Fils souples ---------- */
  // Un fil est une courbe de Bézier entre deux bornes. On essaie plusieurs formes (arrondi d'un côté
  // ou de l'autre, fil qui pend vers l'avant de la table, fil qui contourne par un côté) et on garde
  // celle qui passe le moins sur les appareils et près des autres bornes.
  const bez = (a, c, b, t) => {
    const u = 1 - t;
    return { x: u * u * u * a.x + 3 * u * u * t * c[0] + 3 * u * t * t * c[2] + t * t * t * b.x,
             y: u * u * u * a.y + 3 * u * u * t * c[1] + 3 * u * t * t * c[3] + t * t * t * b.y };
  };
  function candidats(a, b) {
    const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1, nx = -dy / d, ny = dx / d, l = [];
    [.1, .25, .45].forEach(k => [1, -1].forEach(sg => {
      const bo = sg * Math.min(90, 6 + d * k);
      l.push([a.x + dx * .2 + nx * bo, a.y + dy * .2 + ny * bo, a.x + dx * .8 + nx * bo, a.y + dy * .8 + ny * bo]);
    }));
    [30, 60, 100].forEach(h => { const Y = Math.max(a.y, b.y) + h; l.push([a.x + dx * .1, Y, b.x - dx * .1, Y]); });
    [30, 60].forEach(h => {
      const X1 = Math.min(a.x, b.x) - h, X2 = Math.max(a.x, b.x) + h;
      l.push([X1, a.y + dy * .1, X1, b.y - dy * .1], [X2, a.y + dy * .1, X2, b.y - dy * .1]);
    });
    return l;
  }
  function cout(a, b, c, ctx) {
    let p0 = a, len = 0, dedans = 0, hors = 0, pres = 0;
    for (let i = 1; i <= 32; i++) {
      const p = bez(a, c, b, i / 32), sl = Math.hypot(p.x - p0.x, p.y - p0.y);
      len += sl;
      if (Math.hypot(p.x - a.x, p.y - a.y) > 16 && Math.hypot(p.x - b.x, p.y - b.y) > 16) {
        const o = ctx.obst.find(q => p.x > q.x + 3 && p.x < q.x + q.w - 3 && p.y > q.y + 3 && p.y < q.y + q.h - 3);
        if (o) dedans += sl * o.poids;
        if (ctx.bornes.some(q => Math.hypot(q.x - p.x, q.y - p.y) < 13)) pres += sl;
      }
      if (p.x < 4 || p.x > ctx.W - 4 || p.y < 4 || p.y > ctx.H - 4) hors += sl;
      p0 = p;
    }
    return dedans + pres * 6 + hors * 8 + len * .3;
  }
  // forme retenue : { d (chemin SVG), m (milieu du fil) } ; sans ctx, un simple arrondi
  function tracerFil(a, b, ctx) {
    const l = candidats(a, b);
    let c = l[0];
    if (ctx) { let best = Infinity; l.forEach(k => { const v = cout(a, b, k, ctx); if (v < best) { best = v; c = k; } }); }
    const f = v => v.toFixed(1);
    return { d: `M${f(a.x)} ${f(a.y)} C${f(c[0])} ${f(c[1])} ${f(c[2])} ${f(c[3])} ${f(b.x)} ${f(b.y)}`, m: bez(a, c, b, .5) };
  }
  const cheminFil = (a, b, ctx) => tracerFil(a, b, ctx).d;
  const fiche = (p, cls) => `<circle class="mt-fiche ${cls || ''}" cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="7.5"/><circle class="mt-fiche-c" cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="2.6"/>`;

  /* ---------- Table de montage ---------- */
  function table(zone, scene, opt) {
    defs();
    opt = Object.assign({ rendu: 'relief', libre: false, reglage: 'molette', onChange: null }, opt || {});
    const st = { choisiFil: -1, depart: null, drag: null, survol: null, message: null, reglage: null };
    zone.classList.add('mt-table');
    zone.innerHTML = '<svg class="mt-svg" role="img" aria-label="Table de montage vue de dessus"></svg><div class="mt-calque"></div>';
    const svg = zone.querySelector('svg'), calque = zone.querySelector('.mt-calque');

    // position absolue d'une borne « G.plus » sur la table, avec le décalage des fiches empilées
    const mat = id => scene.materiel.find(m => m.id === id);
    const desc = m => MAT[m.type](m);
    function borneAbs(ref) {
      const [id, b] = ref.split('.'), m = mat(id);
      const d = desc(m), p = d.bornes[b];
      return { x: m.x + p.x, y: m.y + p.y, genre: p.genre, ref };
    }
    function toutesBornes() {
      const l = [];
      scene.materiel.forEach(m => { Object.keys(desc(m).bornes).forEach(b => l.push(borneAbs(m.id + '.' + b))); });
      return l;
    }
    // extrémité du k-ième fil branché sur une borne : les fiches s'empilent
    function bout(ref, k) { const p = borneAbs(ref); return { x: p.x + k * 5, y: p.y - k * 6 }; }

    function dessiner() {
      const W = scene.W, H = scene.H;
      svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
      svg.setAttribute('class', 'mt-svg mt-rendu-' + opt.rendu);
      let s = `<defs><marker id="mt-fl-sens" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" class="mt-sens-pointe"/></marker></defs>`;
      s += `<rect class="mt-plateau" x="0" y="0" width="${W}" height="${H}" rx="14"/>`;
      // matériel
      scene.materiel.forEach(m => {
        const d = desc(m);
        s += `<g class="mt-mat mt-${m.type}" data-mat="${m.id}" transform="translate(${m.x} ${m.y})">${d.svg}`;
        Object.values(d.bornes).forEach(b => { s += borneDessin(b); });
        s += '</g>';
      });
      // fils posés (avec fiches empilées)
      const compte = {};
      const bouts = scene.fils.map(([a, b]) => {
        const ka = compte[a] = (compte[a] || 0) + 1, kb = compte[b] = (compte[b] || 0) + 1;
        return [bout(a, ka - 1), bout(b, kb - 1)];
      });
      // obstacles : le matériel ; bornes à éviter
      const ctx = { W, H, bornes: toutesBornes(),
        obst: scene.materiel.map(m => { const d = desc(m);
          // passer sur un afficheur est bien pire que passer sur une plaquette
          return { x: m.x, y: m.y, w: d.w, h: d.h, poids: { multimetre: 6, generateur: 5 }[m.type] || 1.5 }; }) };
      const traces = bouts.map(([pa, pb]) => tracerFil(pa, pb, ctx));
      bouts.forEach(([pa, pb], i) => {
        const d = traces[i].d;
        s += `<g class="mt-fil${i === st.choisiFil ? ' choisi' : ''}">
          <path class="mt-cable-halo" d="${d}"/><path class="mt-cable" d="${d}"/><path class="mt-cable-reflet" d="${d}"/>
          ${fiche(pa)}${fiche(pb)}</g>`;
      });
      // fil en cours de tracé
      if (st.drag) {
        const pa = st.drag.de, pb = st.drag.vers;
        s += `<g class="mt-fil mt-fil-encours"><path class="mt-cable" d="${cheminFil(pa, pb)}"/>${fiche(pb, 'mt-fiche-encours')}</g>`;
      }
      // zones sensibles : fils, commandes, puis bornes (au-dessus de tout)
      if (opt.libre) {
        traces.forEach((t, i) => { s += `<path class="mt-cible-fil" data-fil="${i}" d="${t.d}"/>`; });
        scene.materiel.forEach(m => {
          const d = desc(m);
          Object.entries(d.zones).forEach(([nom, z]) => {
            s += `<circle class="mt-cible-cmd" data-cmd="${m.id}.${nom}" cx="${m.x + z.x}" cy="${m.y + z.y}" r="${z.r}"/>`;
          });
        });
      }
      toutesBornes().forEach(b => {
        const cls = (st.depart === b.ref ? ' depart' : '') + (st.survol === b.ref ? ' survol' : '') + (st.message && st.message.borne === b.ref ? ' refusee' : '');
        s += `<circle class="mt-cible${cls}" data-borne="${b.ref}" cx="${b.x}" cy="${b.y}" r="22"/>`;
      });
      svg.innerHTML = s;
      dessinerCalque(traces);
    }

    // éléments HTML posés sur la table (pourcentages de la taille de la table)
    const pc = (v, t) => (100 * v / t).toFixed(3) + '%';
    function dessinerCalque(traces) {
      let h = '';
      if (st.choisiFil >= 0 && traces[st.choisiFil]) {
        const m = traces[st.choisiFil].m;
        h += `<button type="button" class="mt-retirer" style="left:${pc(m.x, scene.W)};top:${pc(m.y, scene.H)}">Retirer ce fil</button>`;
      }
      if (st.message && st.message.mode === 'bulle') {
        const b = borneAbs(st.message.borne), bas = b.y < scene.H * .55;
        h += `<div class="mt-bulle callout-danger ${bas ? 'mt-bulle-bas' : 'mt-bulle-haut'}" role="alert"
                style="--x:${pc(b.x, scene.W)};top:${pc(bas ? b.y + 26 : b.y - 26, scene.H)}">${st.message.html}</div>`;
      }
      if (st.reglage) h += reglageHTML();
      calque.innerHTML = h;
      // bulle : la garder dans la largeur de la table
      const bu = calque.querySelector('.mt-bulle');
      if (bu) {
        const L = zone.clientWidth, x = parseFloat(bu.style.getPropertyValue('--x')) / 100 * L, lb = bu.offsetWidth;
        const g = Math.max(4, Math.min(L - lb - 4, x - lb / 2));
        bu.style.left = g + 'px';
        bu.style.setProperty('--fx', (x - g) + 'px');
      }
      const rg = calque.querySelector('.mt-reglage');
      if (rg && !rg.classList.contains('mt-reglage-cadran')) {
        const L = zone.clientWidth, x = parseFloat(rg.dataset.x) / 100 * L, lr = rg.offsetWidth;
        rg.style.left = Math.max(4, Math.min(L - lr - 4, x - lr / 2)) + 'px';
      }
    }

    /* --- réglage du multimètre et du générateur --- */
    function reglageHTML() {
      const r = st.reglage, m = mat(r.id), dm = desc(m);
      // barre de réglage sous l'appareil (elle ne cache ni l'écran ni le bouton), au-dessus s'il n'y a pas la place
      const haut = m.y + dm.h + 62 > scene.H ? `${pc(m.y - 6, scene.H)};transform:translateY(-100%)` : pc(m.y + dm.h + 6, scene.H);
      if (m.type === 'generateur') {
        const z = dm.zones.bouton;
        return `<div class="mt-reglage" data-x="${pc(m.x + z.x, scene.W)}" style="top:${haut}">
          <button type="button" class="mt-rg-bt" data-gen="-1" aria-label="Baisser de 1 V">−1</button>
          <button type="button" class="mt-rg-bt" data-gen="-0.1" aria-label="Baisser de 0,1 V">−0,1</button>
          <span class="mt-rg-val">${fr(m.tension.toFixed(2))} V</span>
          <button type="button" class="mt-rg-bt" data-gen="0.1" aria-label="Monter de 0,1 V">+0,1</button>
          <button type="button" class="mt-rg-bt" data-gen="1" aria-label="Monter de 1 V">+1</button>
          <button type="button" class="mt-rg-fermer" aria-label="Fermer">✕</button></div>`;
      }
      const z = dm.zones.selecteur;
      if (opt.reglage === 'molette') {
        return `<div class="mt-reglage" data-x="${pc(m.x + z.x, scene.W)}" style="top:${haut}">
          <button type="button" class="mt-rg-bt mt-rg-rond" data-cran="-1" aria-label="Tourner d'un cran vers la gauche">⟲</button>
          <span class="mt-rg-val">${libellePosition(m.position)}</span>
          <button type="button" class="mt-rg-bt mt-rg-rond" data-cran="1" aria-label="Tourner d'un cran vers la droite">⟳</button>
          <button type="button" class="mt-rg-fermer" aria-label="Fermer">✕</button></div>`;
      }
      // cadran agrandi : toutes les positions en grand, à toucher
      return `<div class="mt-reglage mt-reglage-cadran" role="dialog" aria-label="Sélecteur du multimètre">
        <div class="mt-rg-tete"><svg class="mt-rg-ecran" viewBox="0 0 130 48" aria-hidden="true"><rect class="mt-ecran" x="0" y="0" width="130" height="48" rx="6"/>${afficheur(20, 9, 30, m.position === 'OFF' ? '' : (m.affiche == null ? '0.00' : m.affiche), 4, true)}</svg>
          <b>Sélecteur du multimètre</b><span>${libellePosition(m.position)}</span></div>
        <svg viewBox="0 0 300 300" class="mt-rg-svg">${cadran(150, 150, 46, 104, 136, 13, m.position, 21)}</svg>
        <button type="button" class="btn-primary mt-rg-ok">OK</button></div>`;
    }

    /* --- gestes : tirer un fil (glisser ou deux appuis), retirer un fil, commandes --- */
    function point(ev) {
      const p = svg.createSVGPoint(); p.x = ev.clientX; p.y = ev.clientY;
      const q = p.matrixTransform(svg.getScreenCTM().inverse());
      return { x: q.x, y: q.y };
    }
    function bornePres(p, rmax) {
      let best = null, dmin = rmax;
      toutesBornes().forEach(b => { const d = Math.hypot(b.x - p.x, b.y - p.y); if (d < dmin) { dmin = d; best = b; } });
      return best;
    }
    function poser(a, b) {
      if (a === b) return;
      if (!scene.fils.some(f => (f[0] === a && f[1] === b) || (f[0] === b && f[1] === a))) scene.fils.push([a, b]);
      if (opt.onChange) opt.onChange(scene, { pose: [a, b] });
    }

    if (opt.libre) {
      svg.addEventListener('pointerdown', ev => {
        const t = ev.target;
        st.finBorne = false;
        if (t.dataset.borne) {
          ev.preventDefault();
          st.choisiFil = -1; st.reglage = null;
          const b = borneAbs(t.dataset.borne);
          st.drag = { id: ev.pointerId, ref: b.ref, de: b, vers: { x: b.x, y: b.y }, x0: ev.clientX, y0: ev.clientY, bouge: false };
          try { svg.setPointerCapture(ev.pointerId); } catch (e) { /* rien */ }
          dessiner();
        }
      });
      svg.addEventListener('pointermove', ev => {
        if (!st.drag || ev.pointerId !== st.drag.id) return;
        if (Math.hypot(ev.clientX - st.drag.x0, ev.clientY - st.drag.y0) > 8) st.drag.bouge = true;
        if (!st.drag.bouge) return;
        const p = point(ev), b = bornePres(p, 24);
        st.survol = b && b.ref !== st.drag.ref ? b.ref : null;
        st.drag.vers = st.survol ? { x: b.x, y: b.y } : p;
        dessiner();
      });
      const fin = ev => {
        if (!st.drag || ev.pointerId !== st.drag.id) return;
        const d = st.drag; st.drag = null; st.survol = null;
        st.finBorne = true;            // le « click » qui suit ce geste ne doit rien annuler
        if (d.bouge) {
          const b = bornePres(point(ev), 26);
          if (b && b.ref !== d.ref) poser(d.ref, b.ref);
          st.depart = null;
        } else if (st.depart && st.depart !== d.ref) {         // deuxième appui : borne d'arrivée
          poser(st.depart, d.ref); st.depart = null;
        } else st.depart = st.depart === d.ref ? null : d.ref;  // premier appui : borne de départ
        dessiner();
      };
      svg.addEventListener('pointerup', fin);
      svg.addEventListener('pointercancel', ev => { if (st.drag && ev.pointerId === st.drag.id) { st.drag = null; st.survol = null; dessiner(); } });
      svg.addEventListener('click', ev => {
        const t = ev.target;
        if (st.finBorne) { st.finBorne = false; return; }
        if (t.dataset.fil != null) { st.choisiFil = st.choisiFil === +t.dataset.fil ? -1 : +t.dataset.fil; st.depart = null; st.reglage = null; dessiner(); return; }
        if (t.dataset.cmd) {
          const [id, nom] = t.dataset.cmd.split('.'), m = mat(id);
          st.choisiFil = -1; st.depart = null;
          if (nom === 'levier') { m.ferme = !m.ferme; st.reglage = null; if (opt.onChange) opt.onChange(scene, { levier: id }); }
          else st.reglage = st.reglage && st.reglage.id === id ? null : { id };
          dessiner(); return;
        }
        if (!t.dataset.borne && (st.choisiFil >= 0 || st.depart || st.reglage)) { st.choisiFil = -1; st.depart = null; st.reglage = null; dessiner(); }
      });
      calque.addEventListener('click', ev => {
        const t = ev.target.closest('button, [data-pos]');
        if (!t) return;
        if (t.classList.contains('mt-retirer')) { scene.fils.splice(st.choisiFil, 1); st.choisiFil = -1; if (opt.onChange) opt.onChange(scene, { retire: true }); }
        else if (t.classList.contains('mt-rg-fermer') || t.classList.contains('mt-rg-ok')) st.reglage = null;
        else if (t.dataset.gen) { const m = mat(st.reglage.id); m.tension = Math.round(Math.min(12, Math.max(0, m.tension + +t.dataset.gen)) * 100) / 100; }
        else if (t.dataset.cran) {
          const m = mat(st.reglage.id), i = POSITIONS.indexOf(posDe(m.position));
          m.position = POSITIONS[(i + +t.dataset.cran + POSITIONS.length) % POSITIONS.length].id;
        } else if (t.dataset.pos) mat(st.reglage.id).position = t.dataset.pos;
        if (opt.onChange) opt.onChange(scene, { reglage: true });
        dessiner();
      });
      document.addEventListener('keydown', ev => { if (ev.key === 'Escape' && (st.reglage || st.depart || st.choisiFil >= 0)) { st.reglage = null; st.depart = null; st.choisiFil = -1; dessiner(); } });
    }

    let largeur = 0;
    const ro = new ResizeObserver(() => { if (zone.clientWidth !== largeur) { largeur = zone.clientWidth; dessiner(); } });
    ro.observe(zone);
    dessiner();

    return {
      scene,
      redessiner(nouvelle) { if (nouvelle) scene = nouvelle; this.scene = scene; dessiner(); },
      options(o) { Object.assign(opt, o); dessiner(); },
      // fil en cours de tracé (pour montrer l'état), de la borne « de » jusqu'au point (x, y)
      enCours(de, x, y) { st.drag = de ? { id: -1, ref: de, de: borneAbs(de), vers: { x, y }, bouge: true } : null; st.depart = de || null; dessiner(); },
      refus(borne, html, mode) { st.message = borne ? { borne, html, mode: mode || 'bulle' } : null; dessiner(); },
      reglage(id) { st.reglage = id ? { id } : null; dessiner(); },
      choisirFil(i) { st.choisiFil = i; dessiner(); },
      detruire() { ro.disconnect(); zone.innerHTML = ''; },
    };
  }

  /* ---------- Schéma normalisé ---------- */
  // symbole centré en (0, 0), horizontal, bornes en (−L, 0) et (L, 0) ; renvoie [svg, L]
  function symbole(d) {
    const up = t => `<text class="ms-lettre" transform="rotate(${-(d.rot || 0)})" x="0" y="0.5" dy=".35em" text-anchor="middle">${t}</text>`;
    switch (d.type) {
      case 'generateur': return [`<circle class="ms-trait ms-fond" r="12"/>${up('G')}`, 12];
      case 'amperemetre': return [`<circle class="ms-trait ms-fond" r="11"/>${up('A')}`, 11];
      case 'voltmetre': return [`<circle class="ms-trait ms-fond" r="11"/>${up('V')}`, 11];
      case 'moteur': return [`<circle class="ms-trait ms-fond" r="11"/>${up('M')}`, 11];
      case 'lampe': return [`${d.allumee ? '<circle class="ms-halo" r="17"/>' : ''}<circle class="ms-trait ms-fond" r="10"/><path class="ms-trait" d="M-7.1 -7.1 L7.1 7.1 M-7.1 7.1 L7.1 -7.1"/>`, 10];
      case 'resistance': {
        const v = d.valeur ? `<text class="ms-valeur" transform="rotate(${-(d.rot || 0)})" x="0" y="0" dy=".35em" text-anchor="middle">${d.valeur}</text>` : '';
        return [`<rect class="ms-trait ms-fond" x="-21" y="-8" width="42" height="16"/>${v}`, 21];
      }
      // contact fixe à droite (petit trait) ; lame levée (ouvert) ou couchée sur le contact (fermé)
      case 'interrupteur': return [(d.ouvert === false
        ? '<path class="ms-trait" d="M-14 0 L-10 0 L11 -3.2"/>'
        : '<path class="ms-trait" d="M-14 0 L-10 0 L9 -11"/>')
        + '<path class="ms-trait" d="M10 0 H14 M10 0 V-4"/><circle class="ms-pt" cx="-10" r="1.8"/>', 14];
      case 'del': return [`<path class="ms-trait ms-fond" d="M-7 -8 L-7 8 L7 0 Z"/><path class="ms-trait" d="M-12 0 H-7 M7 -8 V8 M7 0 H12"/>
        <path class="ms-trait ms-fin" d="M1 -10 L7 -16 M5 -7 L11 -13"/><path class="ms-pointe" d="M7 -16 l-4 1 l3 3 z M11 -13 l-4 1 l3 3 z"/>`, 12];
      default: return ['', 10];
    }
  }

  function schema(zone, sc, opt) {
    opt = Object.assign({ boucle: [], branches: [], choisis: [], allumes: [], com: false, libre: false }, opt || {});
    zone.classList.add('ms-schema');
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('class', 'ms-svg'); svg.setAttribute('role', 'img'); svg.setAttribute('aria-label', 'Schéma normalisé du circuit');
    zone.innerHTML = ''; zone.appendChild(svg);
    const a = (l, id) => l.includes(id);

    function dessiner() {
      const [W, H] = sc.vb;
      svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
      let fond = '', haut = '', cibles = '';
      const pts = p => p.map(q => q.join(',')).join(' ');
      // surlignage de la boucle principale (sous le schéma)
      sc.fils.forEach(f => { if (a(opt.boucle, f.id)) fond += `<polyline class="ms-boucle" points="${pts(f.pts)}"/>`; });
      sc.dipoles.forEach(d => {
        if (!a(opt.boucle, d.id)) return;
        const [, L] = symbole(d);
        fond += `<g transform="translate(${d.x} ${d.y}) rotate(${d.rot || 0})"><path class="ms-boucle" d="M${-L - 2} 0 H${L + 2}"/></g>`;
      });
      // fils
      sc.fils.forEach(f => {
        const cls = a(opt.choisis, f.id) ? ' choisi' : a(opt.branches, f.id) ? ' branche' : '';
        haut += `<polyline class="ms-fil${cls}" points="${pts(f.pts)}"/>`;
        if (opt.libre) cibles += `<polyline class="ms-cible" data-el="${f.id}" points="${pts(f.pts)}"/>`;
      });
      // dipôles
      sc.dipoles.forEach(d => {
        const [s] = symbole(d);
        const cls = a(opt.choisis, d.id) ? ' choisi' : a(opt.branches, d.id) ? ' branche' : '';
        haut += `<g class="ms-dipole${cls}" transform="translate(${d.x} ${d.y}) rotate(${d.rot || 0})">${s}</g>`;
        // + et − du générateur ; COM des appareils de mesure (option)
        const r = (d.rot || 0) * Math.PI / 180, rp = (lx, ly) => [d.x + lx * Math.cos(r) - ly * Math.sin(r), d.y + lx * Math.sin(r) + ly * Math.cos(r)];
        if (d.type === 'generateur') {
          const s1 = d.inverse ? -1 : 1;
          const [px, py] = rp(-15 * s1, -15), [mx, my] = rp(15 * s1, -15);
          haut += `<text class="ms-signe" x="${px.toFixed(1)}" y="${py.toFixed(1)}" dy=".35em" text-anchor="middle">+</text>`
                + `<text class="ms-signe" x="${mx.toFixed(1)}" y="${my.toFixed(1)}" dy=".35em" text-anchor="middle">−</text>`;
        }
        if (opt.com && d.com) {
          const [cx, cy] = rp(d.com * 15, 13);
          haut += `<text class="ms-com" x="${cx.toFixed(1)}" y="${cy.toFixed(1)}" dy=".35em" text-anchor="middle">COM</text>`;
        }
        if (opt.libre) {
          const [, L] = symbole(d);
          cibles += `<g transform="translate(${d.x} ${d.y}) rotate(${d.rot || 0})"><rect class="ms-cible-d" data-el="${d.id}" x="${-L - 4}" y="-14" width="${2 * L + 8}" height="28"/></g>`;
        }
      });
      // nœuds
      (sc.noeuds || []).forEach(n => {
        haut += a(opt.allumes, n.id)
          ? `<circle class="ms-noeud-halo" cx="${n.x}" cy="${n.y}" r="8"/><circle class="ms-noeud allume" cx="${n.x}" cy="${n.y}" r="3.6"/>`
          : `<circle class="ms-noeud" cx="${n.x}" cy="${n.y}" r="3.4"/>`;
      });
      // intensités : pointe de flèche sur le fil et nom
      (sc.intensites || []).forEach(i => {
        const R = { bas: 90, haut: -90, droite: 0, gauche: 180 }[i.dir] || 0;
        haut += `<g transform="translate(${i.x} ${i.y}) rotate(${R})"><path class="ms-pointe" d="M4 0 L-4 -4 L-4 4 Z"/></g>`;
        const [lx, ly] = i.dir === 'bas' || i.dir === 'haut' ? [i.x + (i.cote === 'droite' ? 10 : -10), i.y] : [i.x, i.y - 10];
        haut += `<text class="ms-nom" x="${lx}" y="${ly}" dy=".35em" text-anchor="${i.dir === 'bas' || i.dir === 'haut' ? (i.cote === 'droite' ? 'start' : 'end') : 'middle'}">${nomHTML(i.nom)}</text>`;
      });
      // tensions : flèche à côté du dipôle et nom
      (sc.tensions || []).forEach(u => {
        const dx = u.x2 - u.x1, dy = u.y2 - u.y1, d = Math.hypot(dx, dy), ux = dx / d, uy = dy / d;
        haut += `<path class="ms-tension" d="M${u.x1} ${u.y1} L${(u.x2 - ux * 5).toFixed(1)} ${(u.y2 - uy * 5).toFixed(1)}"/>`
              + `<path class="ms-pointe" d="M${u.x2} ${u.y2} l${(-ux * 7 - uy * 3.5).toFixed(1)} ${(-uy * 7 + ux * 3.5).toFixed(1)} l${(uy * 7).toFixed(1)} ${(-ux * 7).toFixed(1)} z"/>`;
        const mx = (u.x1 + u.x2) / 2, my = (u.y1 + u.y2) / 2;
        const [lx, ly, an] = Math.abs(dx) > Math.abs(dy) ? [mx, my + (u.cote === 'bas' ? 11 : -9), 'middle'] : [mx + (u.cote === 'droite' ? 7 : -7), my, u.cote === 'droite' ? 'start' : 'end'];
        haut += `<text class="ms-nom" x="${lx}" y="${ly}" dy=".35em" text-anchor="${an}">${nomHTML(u.nom)}</text>`;
      });
      svg.innerHTML = fond + haut + cibles;
    }
    // « U_390 » → U avec indice
    const nomHTML = n => n.replace(/_(\w+)/, '<tspan class="ms-ind" dy="3">$1</tspan>');

    if (opt.libre) {
      svg.addEventListener('click', ev => {
        const id = ev.target.dataset && ev.target.dataset.el;
        if (!id) return;
        const i = opt.choisis.indexOf(id);
        if (i >= 0) opt.choisis.splice(i, 1); else opt.choisis.push(id);
        dessiner();
        if (opt.onChoix) opt.onChoix(opt.choisis.slice());
      });
    }
    dessiner();
    return { maj(o) { Object.assign(opt, o); dessiner(); }, svg };
  }

  window.MAQ = { table, schema, POSITIONS, libellePosition, cheminFil };
})();
