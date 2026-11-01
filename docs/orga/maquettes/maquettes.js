/* ============================================================
   Maquettes du moteur ORGA (étape 1) — script propre aux maquettes
     MAQ.nav(cle)          barre de navigation entre les maquettes
     MAQ.A, MAQ.B, MAQ.C   trois façons d'ajouter un atome dans l'éditeur ORGA.editeur
                           (seule différence entre dessin-a, dessin-b et dessin-c)
     MAQ.page(zones, mode) éditeur + tâches communes (les mêmes sur les trois maquettes)
   ============================================================ */
(function () {
  'use strict';
  const G = ORGA.geo;
  const r1 = x => Math.round(x * 10) / 10;

  /* ---------- Navigation ---------- */
  const PAGES = [
    ['index', 'index.html', '← Présentation'],
    ['rendu', 'rendu.html', 'Rendu'],
    ['A', 'dessin-a.html', 'A · Emplacements'],
    ['B', 'dessin-b.html', 'B · Flèches'],
    ['C', 'dessin-c.html', 'C · Glisser'],
    ['conversion', 'conversion.html', 'Conversion'],
  ];
  function nav(cle) {
    const z = document.getElementById('nav');
    if (z) z.innerHTML = PAGES.map(([k, h, t]) => `<a href="${h}"${k === cle ? ' aria-current="page"' : ''}>${t}</a>`).join('');
  }

  /* ---------- Emplacements libres autour de l'atome choisi (A, et C après un appui court) ---------- */
  function emplacements(ed, sc, petit) {
    if (ed.sel == null || !sc.px[ed.sel]) return '';
    const pref = ed.prefere(ed.sel);
    let h = '';
    for (const d of ed.libres(ed.sel)) {
      const c = d.cible != null ? sc.px[d.cible] : ed.px(d.q), p = d.a === pref;
      if (d.cible != null) h += `<circle class="orga-empl orga-empl-fermer" cx="${r1(c.x)}" cy="${r1(c.y)}" r="${petit ? 15 : 19}"/>`;
      else {
        const r = petit ? (p ? 8 : 6) : (p ? 14 : 12);
        h += `<circle class="orga-empl${p ? ' orga-empl-pref' : ''}" cx="${r1(c.x)}" cy="${r1(c.y)}" r="${r}"/>`;
        if (!petit && (ed.el !== 'C' || ed.ec !== 'topo')) h += `<text class="orga-empl-t" x="${r1(c.x)}" y="${r1(c.y + 4.5)}" text-anchor="middle">${ed.el}</text>`;
      }
      h += `<circle class="orga-cible" data-cible="e${d.a}" cx="${r1(c.x)}" cy="${r1(c.y)}" r="22"/>`;
    }
    return h;
  }
  const clicEmplacement = (ed, cible) => {
    if (cible.type !== 'empl' || ed.sel == null) return false;
    ed.ajouter(ed.sel, +cible.v);
    return true;
  };

  /* ---------- A « Emplacements » ----------
     On touche un atome : des emplacements libres apparaissent autour (celui qui continue
     le zigzag est mis en valeur) ; on touche un emplacement : l'atome y est ajouté. */
  const A = {
    nom: 'A',
    calque: (ed, sc) => emplacements(ed, sc, false),
    clic: clicEmplacement,
  };

  /* ---------- B « Flèches » ----------
     Pavé de flèches sous le dessin (4 directions en semi-développée, 6 en topologique,
     plus « suite du zigzag ») ; il agit sur l'atome sélectionné, qui reste le dernier ajouté. */
  const fleche = a => `<svg viewBox="-13 -13 26 26" width="26" height="26" aria-hidden="true"><g transform="rotate(${-a})"><line x1="-9" y1="0" x2="8" y2="0"/><path d="M2 -6 L8.5 0 L2 6"/></g></svg>`;
  const NOM_DIR = { 0: 'à droite', 30: 'en haut à droite', 90: 'en haut', 150: 'en haut à gauche', 180: 'à gauche', 210: 'en bas à gauche', 270: 'en bas', 330: 'en bas à droite' };
  // place des boutons dans la grille 3 colonnes
  const GRILLE = {
    semi: [[90, 1, 2], [180, 2, 1], [270, 2, 2], [0, 2, 3]],
    topo: [[150, 1, 1], [90, 1, 2], [30, 1, 3], [210, 2, 1], [270, 2, 2], [330, 2, 3]],
  };
  const B = {
    nom: 'B',
    installer(ed) {
      const z = ed.racine.querySelector('.orga-ed-mode');
      z.innerHTML = '<div class="maq-pad" role="group" aria-label="Ajouter un atome dans une direction"></div>';
      z.addEventListener('click', ev => {
        const b = ev.target.closest('[data-dir]');
        if (!b || b.disabled) return;
        if (ed.outil !== 'dessin') { ed.outil = 'dessin'; }
        const a = b.dataset.dir === 'suite' ? ed.prefere(ed.sel) : +b.dataset.dir;
        if (a != null) ed.ajouter(ed.sel, a);
      });
    },
    // la place de « Suite » est montrée en pointillés
    calque(ed, sc) {
      if (ed.sel == null) return '';
      const a = ed.prefere(ed.sel), d = ed.libres(ed.sel).find(x => x.a === a);
      if (!d) return '';
      const c = d.cible != null ? sc.px[d.cible] : ed.px(d.q), p = sc.px[ed.sel];
      return `<line class="orga-fantome" x1="${r1(p.x)}" y1="${r1(p.y)}" x2="${r1(c.x)}" y2="${r1(c.y)}"/><circle class="orga-empl" cx="${r1(c.x)}" cy="${r1(c.y)}" r="7"/>`;
    },
    apres(ed) {
      const pad = ed.racine.querySelector('.maq-pad');
      const g = GRILLE[ed.ec === 'topo' ? 'topo' : 'semi'];
      const libres = new Set(ed.libres(ed.sel).map(d => d.a));
      const actif = ed.outil === 'dessin';
      pad.innerHTML = g.map(([a, l, c]) => `<button type="button" data-dir="${a}" style="grid-row:${l};grid-column:${c}" aria-label="Ajouter ${ed.el} ${NOM_DIR[a]}"${libres.has(a) && actif ? '' : ' disabled'}>${fleche(a)}</button>`).join('') +
        `<button type="button" class="maq-suite" data-dir="suite" style="grid-row:3"${libres.size && actif ? '' : ' disabled'}>⟿ ${ed.ec === 'topo' ? 'Suite du zigzag' : 'Suite'}</button>`;
    },
  };

  /* ---------- C « Glisser » ----------
     On tire un trait depuis un atome : il s'aimante à la direction permise la plus proche ;
     au lâcher, un nouvel atome. Un appui court sur un atome montre ses emplacements voisins :
     les toucher fait pareil. */
  const C = {
    nom: 'C',
    installer(ed) {
      ed.racine.classList.add('maq-glisser');
      const svg = ed.svg;
      let g = null;
      const fantome = () => {
        const cal = svg.querySelector('.orga-calque');
        if (!cal) return;
        cal.querySelectorAll('.maq-fantome').forEach(x => x.remove());
        if (!g || g.a == null) return;
        const d = ed.libres(g.i).find(x => x.a === g.a);
        if (!d) return;
        const p = ed.sc.px[g.i], c = d.cible != null ? ed.sc.px[d.cible] : ed.px(d.q);
        const el = ed.el !== 'C' || ed.ec !== 'topo' ? `<text class="orga-empl-t" x="${r1(c.x)}" y="${r1(c.y + 4.5)}" text-anchor="middle">${ed.el}</text>` : '';
        cal.insertAdjacentHTML('beforeend', `<g class="maq-fantome"><line class="orga-fantome" x1="${r1(p.x)}" y1="${r1(p.y)}" x2="${r1(c.x)}" y2="${r1(c.y)}"/><circle class="orga-fantome-at" cx="${r1(c.x)}" cy="${r1(c.y)}" r="${d.cible != null ? 18 : 12}"/>${el}</g>`);
      };
      svg.addEventListener('pointerdown', ev => {
        if (ed.outil !== 'dessin' || (ev.pointerType === 'mouse' && ev.button !== 0)) return;
        const c = ed.cibleDe(ev.target);
        if (c.type !== 'atome') return;
        g = { i: +c.v, id: ev.pointerId, a: null, bouge: false };
      });
      svg.addEventListener('pointermove', ev => {
        if (!g || ev.pointerId !== g.id) return;
        const p = ORGA.versSVG(svg, ev), c = ed.sc.px[g.i];
        const dx = p.x - c.x, dy = p.y - c.y, L = Math.hypot(dx, dy);
        if (L < 14) { if (g.a != null) { g.a = null; fantome(); } return; }
        // le glisser commence : le pointeur est capturé (pas avant, pour qu'un appui court reste un clic sur l'atome)
        if (!g.bouge) { try { svg.setPointerCapture(ev.pointerId); } catch (e) { /* rien */ } }
        g.bouge = true;
        const ang = G.n360(Math.atan2(-dy, dx) * 180 / Math.PI);
        let best = null;
        for (const d of ed.libres(g.i)) if (!best || G.ecart(d.a, ang) < G.ecart(best.a, ang)) best = d;
        const a = best && G.ecart(best.a, ang) < 50 ? best.a : null;
        if (a !== g.a) { g.a = a; fantome(); }
      });
      const fin = ev => {
        if (!g || ev.pointerId !== g.id) return;
        const { i, a, bouge } = g;
        g = null;
        if (bouge) ed.ignorerClic = Date.now();
        if (a != null) ed.ajouter(i, a);
        else if (bouge) ed.rendre();
      };
      svg.addEventListener('pointerup', fin);
      svg.addEventListener('pointercancel', ev => { if (g && ev.pointerId === g.id) { g = null; ed.rendre(); } });
      // iOS : pas de défilement de la page pendant le glisser
      svg.addEventListener('touchmove', ev => { if (g) ev.preventDefault(); }, { passive: false });
    },
    calque: (ed, sc) => emplacements(ed, sc, true),
    clic: clicEmplacement,
  };

  /* ---------- Page d'une maquette de dessin : éditeur + tâches ---------- */
  const CIBLES = {
    mp: ORGA.lire('CC(C)CCC'),
    pentene: ORGA.lire('CC=CC(C)C'),
    pentanone: ORGA.lire('CCCC(C)=O'),
  };
  const TACHES = [
    { id: 1, html: 'Dessine le <b>2-méthylpentane</b> en semi-développée, <b>H à compléter</b>.', prep: { ecriture: 'semi', hydrogenes: 'eleve' } },
    { id: 2, html: 'Regarde-le en <b>topologique</b> et en <b>développée</b>.' },
    { id: 3, html: 'Dessine en topologique le <b>4-méthylpent-2-ène</b>, puis la <b>pentan-2-one</b>.', prep: { ecriture: 'topo', hydrogenes: 'auto' } },
    { id: 4, html: 'Ajoute un <b>OH</b>, puis un <b>Cl</b>.' },
    { id: 5, html: 'Refais tout <b>au doigt</b>, sur téléphone.', manuel: true },
  ];

  function page(zones, mode) {
    const etat = { 1: false, 2: false, 3: false, 4: false, 5: false, vuTopo: false, vuDev: false, pentene: false, pentanone: false, gestes: 0 };
    zones.taches.innerHTML = `<ol class="maq-taches">${TACHES.map(t => `<li data-t="${t.id}"><span class="maq-t-txt">${t.html}<br><span class="maq-sous"></span></span>
      ${t.prep ? `<button type="button" class="btn-small" data-prep="${t.id}">Préparer</button>` : ''}
      ${t.manuel ? `<label class="maq-interr"><input type="checkbox" data-manuel="${t.id}"> Fait</label>` : ''}</li>`).join('')}</ol>`;

    const ed = ORGA.editeur(zones.editeur, { ecriture: 'semi', hydrogenes: 'auto', ajout: mode, surChange: verifier });
    zones.editeur.insertAdjacentHTML('beforeend', '<p class="maq-gestes">Gestes depuis le dernier « Tout effacer » : <b>0</b></p>');
    const compteur = zones.editeur.querySelector('.maq-gestes b');
    // un geste = un appui (relâché) sur le dessin ou sur un bouton de l'éditeur
    ed.racine.addEventListener('pointerup', ev => {
      if (ev.target.closest('.orga-ed-effacer')) etat.gestes = -1;
      if (ev.target.closest('svg, button')) { etat.gestes++; compteur.textContent = Math.max(0, etat.gestes); }
    });

    function verifier() {
      const m = ed.mol, ec = ed.ec;
      const estMP = ORGA.meme(m, CIBLES.mp);
      if (ec === 'semi' && ed.hydro === 'eleve' && estMP && ed.hJustes()) etat[1] = true;
      if (estMP && ec === 'topo') etat.vuTopo = true;
      if (estMP && ec === 'developpee') etat.vuDev = true;
      if (etat.vuTopo && etat.vuDev) etat[2] = true;
      if (ec === 'topo' && ORGA.meme(m, CIBLES.pentene)) etat.pentene = true;
      if (ec === 'topo' && ORGA.meme(m, CIBLES.pentanone)) etat.pentanone = true;
      if (etat.pentene && etat.pentanone) etat[3] = true;
      const oh = m.atomes.some((a, i) => a.el === 'O' && ORGA.nbH(m, i) === 1 && ORGA.somme(m, i) === 1);
      if (oh && m.atomes.some(a => a.el === 'Cl')) etat[4] = true;
      afficher();
    }
    function afficher() {
      zones.taches.querySelectorAll('[data-t]').forEach(li => {
        const t = +li.dataset.t;
        li.classList.toggle('fait', !!etat[t]);
        const sous = li.querySelector('.maq-sous');
        if (t === 2) sous.innerHTML = `topologique ${etat.vuTopo ? '<b class="ok">✓</b>' : '…'} · développée ${etat.vuDev ? '<b class="ok">✓</b>' : '…'}`;
        if (t === 3) sous.innerHTML = `4-méthylpent-2-ène ${etat.pentene ? '<b class="ok">✓</b>' : '…'} · pentan-2-one ${etat.pentanone ? '<b class="ok">✓</b>' : '…'}`;
      });
    }
    zones.taches.addEventListener('click', ev => {
      const b = ev.target.closest('[data-prep]');
      if (!b) return;
      const t = TACHES.find(x => x.id === +b.dataset.prep);
      ed.charger('C', t.prep);
      etat.gestes = 0; compteur.textContent = 0;
      zones.editeur.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    });
    zones.taches.addEventListener('change', ev => {
      const c = ev.target.closest('[data-manuel]');
      if (c) { etat[+c.dataset.manuel] = c.checked; afficher(); }
    });
    afficher();
    return ed;
  }

  window.MAQ = { nav, A, B, C, page, emplacements };
})();
