/* ============================================================
   Banc d'optique — interface (objet global BO)
   Une seule page : barre d'outils (choix de la manipulation, composants à
   ajouter), vues rapprochées au-dessus de la lampe et de chaque écran, banc
   sur toute la largeur, barre du composant sélectionné, panneau du TP.
   Le calcul optique est dans bo-optique.js (BO_OPT), les TP dans tp.js.

   Composants : voir bo-optique.js ; en plus
     nom (nom imposé, sinon L₁, M₁, E₁… dans l'ordre de création),
     mystere (focale cachée), revele, verrou: { f, D, suppr } (réglages imposés par un TP).

   API pour les TP (tp.js) :
     BO.TP[id] = { titre, menu, banc, faisceau (case « Faisceau » cochée au départ),
                   montage() → [composants], etapes: [{ titre, rendre(api) }] }
     BO.demarrer(racine)                 construit la page
     BO.composants()                     composants du banc
     BO.ajouter(c, x) / BO.supprimer(c) / BO.placer(c, x) / BO.changer()
     BO.analyse()                        dernière analyse (BO_OPT.analyser)
     BO.cible(c)                         image reçue par un écran ou par la plaque (c : la lampe)
     BO.nom(c)                           nom affiché (L₁, E₂…)
     BO.boite                            focales et diamètres de la boîte de TP
     BO.fmt(v, d)                        nombre à la française
   ============================================================ */
(function () {
  'use strict';
  const O = window.BO_OPT;

  /* ---------- Boîte de TP ---------- */
  const BOITE = {
    cv: [5, 10, 12.5, 15, 20, 25, 30, 50, 100],      // distances focales des lentilles (cm)
    miroir: [5, 10, 15, 20, 25],                     // miroirs concaves et convexes (cm)
    D: [2, 3, 4, 6, 8],                              // diamètres (cm)
    AB: [0.5, 1, 1.5, 2, 3],                         // tailles de la lettre F (cm)
  };
  const BANCS = [100, 150, 200];
  const ZOOMS = [1, 1.5, 2, 3, 4];
  const TYPES = {
    lampe: { nom: 'Lampe et objet', court: 'Lampe' },
    cv: { nom: 'Lentille convergente', court: 'Converg.' },
    dv: { nom: 'Lentille divergente', court: 'Diverg.' },
    plan: { nom: 'Miroir plan', court: 'Plan' },
    concave: { nom: 'Miroir concave', court: 'Concave' },
    convexe: { nom: 'Miroir convexe', court: 'Convexe' },
    ecran: { nom: 'Écran', court: 'Écran' },
  };
  const PALETTE = ['lampe', 'cv', 'dv', 'plan', 'concave', 'convexe', 'ecran'];
  const MIROIRS = ['plan', 'concave', 'convexe'], COURBES = ['concave', 'convexe'];
  // icônes de la palette (SVG 24 × 24)
  const ICONES = {
    lampe: '<rect x="2" y="6" width="12" height="12" rx="2" class="bo-i-encre"/><rect x="15" y="7" width="3" height="10" class="bo-i-plein"/>',
    cv: '<path d="M12 3 Q18 12 12 21 Q6 12 12 3 Z" class="bo-i-plein"/>',
    dv: '<path d="M7 3 L17 3 Q12 12 17 21 L7 21 Q12 12 7 3 Z" class="bo-i-plein"/>',
    plan: '<line x1="10" y1="3" x2="10" y2="21" class="bo-i-trait" stroke-width="3"/><path d="M12 7l4-3M12 12l4-3M12 17l4-3M12 22l4-3" class="bo-i-trait" stroke-width="1"/>',
    concave: '<path d="M9 3 Q17 12 9 21" class="bo-i-trait" stroke-width="3"/>',      // bords tournés vers la lumière (à gauche)
    convexe: '<path d="M15 3 Q7 12 15 21" class="bo-i-trait" stroke-width="3"/>',
    ecran: '<rect x="9" y="3" width="6" height="18" class="bo-i-trait bo-i-blanc"/>',
  };

  /* ---------- Outils ---------- */
  const IND = '₀₁₂₃₄₅₆₇₈₉';
  const indice = n => String(n).split('').map(d => IND[+d] || d).join('');
  // nombre à la française : virgule, moins typographique
  function fmt(v, d) {
    if (d == null) d = 1;
    const s = (Math.abs(v) < Math.pow(10, -d) / 2 ? 0 : v).toFixed(d);
    return s.replace('-', '−').replace('.', ',');
  }
  // focale sans zéro inutile : 12,5 ; 10 ; −20
  const fmtF = v => fmt(v, Number.isInteger(v) ? 0 : 1);
  const r1 = v => Math.round(v * 10) / 10;                     // au millimètre
  function el(tag, cls, html) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }
  const echapper = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  // couleurs du thème (variables CSS) pour les vues dessinées dans un canvas
  let COUL = null;
  function couleurs() {
    if (COUL) return COUL;
    const st = getComputedStyle(document.documentElement);
    const lire = n => st.getPropertyValue(n).trim() || '#888888';
    const rgb = h => { const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(h); return m ? [1, 2, 3].map(i => parseInt(m[i], 16)) : [90, 63, 196]; };
    COUL = { paper: lire('--paper'), paper3: lire('--paper-3'), ink2: lire('--ink-2'), ink3: lire('--ink-3'), accent: lire('--accent'), accentRGB: rgb(lire('--accent')), font: lire('--font-sans') };
    return COUL;
  }

  /* ---------- État ---------- */
  // traces : rayons de construction imposés par un TP (fonction → [{ pts, cls }]), ou null
  const etat = { L: 100, comps: [], sel: null, rayons: false, faisceau: false, traces: null, zoom: 1, mode: 'libre', prochainId: 1 };
  let ana = null;                         // dernière analyse optique
  const ecouteurs = new Set();            // rappels après chaque changement (vérifications des TP)
  let D = {};                             // éléments de la page
  let court = false;                      // petit écran en hauteur (téléphone en paysage)

  /* ---------- Noms des composants ---------- */
  function nom(c) {
    if (c.nom) return c.nom;
    if (c.type === 'lampe') return 'Objet';
    const FAM = { cv: 'L', dv: 'L', plan: 'M', concave: 'M', convexe: 'M', ecran: 'E' };
    const fam = FAM[c.type];
    const memes = etat.comps.filter(o => !o.nom && FAM[o.type] === fam).sort((a, b) => a.id - b.id);
    return fam + indice(memes.indexOf(c) + 1);
  }
  // nom et réglage écrits au-dessus du composant
  function etiquette(c) {
    const n = nom(c);
    if (c.type === 'cv' || c.type === 'dv') return `${n} · f′ =${c.mystere && !c.revele ? ' ?' : ' ' + fmtF(c.f) + ' cm'}`;
    if (c.type === 'concave') return `${n} · concave, f = ${fmtF(c.f)} cm`;
    if (c.type === 'convexe') return `${n} · convexe, f = ${fmtF(c.f)} cm`;
    if (c.type === 'plan') return `${n} · plan`;
    if (c.type === 'ecran') {
      const e = ana && ana.els.find(x => x.c === c);
      return n + (c.retire ? ' (retiré)' : e && e.decale ? ' (décalé)' : '');
    }
    return n;
  }

  /* ---------- Encombrement : deux composants ne se chevauchent pas ---------- */
  function etendue(c, x) {
    if (c.type === 'lampe') return [x - 1, x + 0.5];
    return [x - 0.5, x + 0.5];
  }
  const xMax = () => etat.L;
  function libre(c, x) {
    const [a, b] = etendue(c, x);
    return etat.comps.every(o => {
      if (o === c) return true;
      const [p, q] = etendue(o, o.x);
      return b <= p + 1e-9 || a >= q - 1e-9;
    });
  }
  // position libre la plus proche de x (au millimètre), dans le banc
  function procheLibre(c, x) {
    x = Math.min(xMax(c), Math.max(0, r1(x)));
    for (let k = 0; k <= etat.L * 10; k++) {
      for (const s of [1, -1]) {
        const v = r1(x + s * k / 10);
        if (v >= 0 && v <= xMax(c) && libre(c, v)) return v;
      }
    }
    return null;
  }
  function placer(c, x) {
    const v = procheLibre(c, x);
    if (v != null) c.x = v;
  }

  /* ---------- Composants ---------- */
  function creer(type, o) {
    const c = Object.assign({ id: etat.prochainId++, type, x: 0 }, o || {});
    if (type === 'lampe' && c.AB == null) c.AB = 2;
    if (type === 'cv' && c.f == null) c.f = 10;
    if (type === 'dv' && c.f == null) c.f = -10;
    if (COURBES.includes(type) && c.f == null) c.f = 10;
    if ((type === 'cv' || type === 'dv' || MIROIRS.includes(type)) && c.D == null) c.D = 4;
    if (c.mystere && c.f == null) c.f = focaleMystere(type);
    return c;
  }
  function focaleMystere(type) {
    const v = BOITE.cv.slice(1, 6)[Math.floor(Math.random() * 5)];   // 10 à 25 cm
    return type === 'dv' ? -v : v;
  }
  function ajouter(c, x) {
    if (typeof c === 'string') c = creer(c);
    else if (c.id == null) c = creer(c.type, c);
    if (c.type === 'lampe' && etat.comps.some(o => o.type === 'lampe')) return null;   // une seule lampe
    etat.comps.push(c);
    let v = procheLibre(c, x == null ? positionLibre(c) : x);
    if (v == null) { etat.comps.pop(); return null; }
    c.x = v;
    return c;
  }
  // premier endroit libre : après le dernier composant, sinon n'importe où
  function positionLibre(c) {
    const xs = etat.comps.filter(o => o !== c).map(o => etendue(o, o.x)[1]);
    const apres = xs.length ? Math.max(...xs) + 10 : 10;
    return apres <= xMax(c) ? apres : etat.L / 2;
  }
  function supprimer(c) {
    etat.comps = etat.comps.filter(o => o !== c);
    if (etat.sel === c.id) etat.sel = null;
  }
  const choisi = () => etat.comps.find(c => c.id === etat.sel) || null;

  /* ---------- Changement : nouvelle analyse, dessin, vérifications des TP ---------- */
  let attente = false, sale = true;
  // analyse optique à jour (recalculée seulement si le banc a changé)
  function aJour() {
    if (sale || !ana) { ana = O.analyser(etat.comps, etat.L); sale = false; }
    return ana;
  }
  function changer() {
    sale = true;
    if (attente) return;
    attente = true;
    requestAnimationFrame(() => { attente = false; maintenant(); });
  }
  function maintenant() {
    sale = true;
    aJour();
    dessinerBanc();
    dessinerVues();
    barreSel();
    ecouteurs.forEach(f => { try { f(); } catch (e) { console.error(e); } });
  }
  function cible(c) {
    return aJour().cibles.find(t => t.comp === c) || null;
  }

  /* ============================================================
     CONSTRUCTION DE LA PAGE
     ============================================================ */
  function demarrer(racine) {
    racine.innerHTML = `
      <div class="bo-outils" role="toolbar" aria-label="Manipulation et composants">
        <label class="bo-choix-tp"><span class="bo-cache-t">Manipulation</span>
          <span class="bo-sel"><select class="bo-select" data-a="tp" aria-label="Manipulation">${Object.keys(BO.TP).map(k => `<option value="${k}">${BO.TP[k].menu}</option>`).join('')}</select></span></label>
        <span class="bo-sep" aria-hidden="true"></span>
        <span class="bo-ajout-t">Ajouter :</span>
        <div class="bo-palette">${PALETTE.map(t => `<button type="button" class="bo-ajout" data-type="${t}" aria-label="Ajouter : ${TYPES[t].nom}" title="Clique pour ajouter, ou glisse sur le banc"><svg viewBox="0 0 24 24" aria-hidden="true">${ICONES[t]}</svg><span class="bo-long">${TYPES[t].nom}</span><span class="bo-court">${TYPES[t].court}</span></button>`).join('')}</div>
        <div class="bo-place-reglages"></div>
      </div>
      <div class="bo-scene" data-a="scene">
        <div class="bo-plateau" data-a="plateau">
          <div class="bo-vues" data-a="vues"></div>
          <svg class="bo-banc" data-a="banc" role="img" aria-label="Banc d'optique"></svg>
        </div>
      </div>
      <div class="bo-selbar">
        <div class="bo-sel-info" data-a="selInfo" aria-live="polite"></div>
        <div class="bo-reglages" data-a="reglages">
          <label class="bo-lab">Banc <span class="bo-sel"><select class="bo-select" data-a="banc-l" aria-label="Longueur du banc">${BANCS.map(l => `<option value="${l}">${fmt(l / 100, l % 100 ? 1 : 0)} m</option>`).join('')}</select></span></label>
          <span class="bo-lab">Zoom <button type="button" class="bo-mini" data-a="zMoins" aria-label="Réduire le zoom">−</button><span class="bo-zoom-v" data-a="zoomV">× 1</span><button type="button" class="bo-mini" data-a="zPlus" aria-label="Agrandir le zoom">+</button></span>
          <label class="bo-coche"><input type="checkbox" data-a="faisceau"> Faisceau</label>
          <label class="bo-coche"><input type="checkbox" data-a="rayons"> Rayons</label>
        </div>
      </div>
      <section class="bo-tp" data-a="tpZone" hidden aria-label="Manipulation guidée"></section>
      <div class="bo-loupe" data-a="loupe" hidden role="dialog" aria-modal="true" aria-label="Vue agrandie">
        <div class="bo-loupe-fond" data-a="loupeFond"></div>
        <div class="bo-loupe-boite"><div class="bo-loupe-tete"><div class="bo-vue-cap" data-a="loupeCap"></div><button type="button" class="bo-mini" data-a="loupeX" aria-label="Fermer la vue agrandie">✕</button></div><canvas data-a="loupeCv"></canvas></div>
      </div>
      <div class="bo-fantome" data-a="fantome" hidden aria-hidden="true"></div>`;
    D = { racine };
    racine.querySelectorAll('[data-a]').forEach(e => { D[e.dataset.a] = e; });

    // choix de la manipulation
    D.tp.addEventListener('change', () => choisirMode(D.tp.value, true));
    // longueur du banc, zoom, rayons
    D['banc-l'].addEventListener('change', () => { regleBanc(+D['banc-l'].value); changer(); });
    D.zMoins.addEventListener('click', () => zoomer(-1));
    D.zPlus.addEventListener('click', () => zoomer(1));
    D.rayons.addEventListener('change', () => { etat.rayons = D.rayons.checked; changer(); });
    D.faisceau.addEventListener('change', () => { etat.faisceau = D.faisceau.checked; changer(); });
    // palette : clic pour ajouter, ou glisser-déposer sur le banc
    racine.querySelectorAll('.bo-ajout').forEach(b => paletteGlisser(b));
    // banc : sélection et glissement des composants
    bancGlisser();
    // loupe
    D.loupeX.addEventListener('click', fermerLoupe);
    D.loupeCap.addEventListener('click', ev => { const b = ev.target.closest('[data-z]'); if (b && loupeCle != null) zoomVue(loupeCle, +b.dataset.z); });
    D.loupeFond.addEventListener('click', fermerLoupe);
    // clavier : flèches pour déplacer le composant choisi, Suppr pour l'enlever
    document.addEventListener('keydown', clavier);
    // mise en page à la taille de l'écran
    addEventListener('resize', () => { miseEnPage(); maintenant(); });
    const mq = matchMedia('(max-height: 520px)');
    court = mq.matches;
    mq.addEventListener ? mq.addEventListener('change', () => { court = mq.matches; tpReplie = court; miseEnPage(); tpRendreTete(); maintenant(); }) : null;
    tpReplie = court;
    // manipulation demandée dans l'adresse (#conjugaison…)
    const h = location.hash.replace('#', '');
    choisirMode(BO.TP[h] ? h : 'libre', false);
    addEventListener('hashchange', () => { const k = location.hash.replace('#', ''); if (BO.TP[k] && k !== etat.mode) choisirMode(k, false); });
  }

  // longueur du banc : les composants trop loin sont ramenés sur le banc
  function regleBanc(L) {
    etat.L = L;
    D['banc-l'].value = String(L);
    etat.comps.slice().sort((a, b) => b.x - a.x).forEach(c => { if (c.x > xMax(c)) placer(c, xMax(c)); });
  }
  function zoomer(s) {
    const i = Math.max(0, Math.min(ZOOMS.length - 1, ZOOMS.indexOf(etat.zoom) + s));
    const sc = D.scene, centre = (sc.scrollLeft + sc.clientWidth / 2) / Math.max(1, sc.scrollWidth);
    etat.zoom = ZOOMS[i];
    miseEnPage();
    maintenant();
    // garder au centre le composant choisi, sinon le même endroit du banc
    const c = choisi();
    sc.scrollLeft = c ? xPx(c.x) - sc.clientWidth / 2 : centre * sc.scrollWidth - sc.clientWidth / 2;
  }

  /* ---------- Mise en page : hauteur des vues et du banc ---------- */
  let G = { W: 1000, Hb: 180, T: 176, ML: 64, MR: 44 };
  function miseEnPage() {
    // réglages du banc : dans la barre d'outils sur téléphone (une seule rangée de commandes)
    const place = court ? D.racine.querySelector('.bo-place-reglages') : D.racine.querySelector('.bo-selbar');
    if (D.reglages.parentNode !== place) place.appendChild(D.reglages);
    D.racine.classList.toggle('bo-petit', court);
    const sc = D.scene;
    const pad = court ? 16 : 32;                                 // marges intérieures de la scène
    const H = sc.clientHeight, W0 = sc.clientWidth - pad;
    const cap = court ? 34 : 44;
    // hauteur du banc entre HbMin et HbMax ; les vues prennent le reste (taille T entre Tmin et Tmax)
    const HbMax = court ? 150 : 300, HbMin = court ? 112 : 170, Tmin = court ? 60 : 96, Tmax = court ? 150 : 240;
    const T = Math.round(Math.max(Tmin, Math.min(Tmax, H - HbMin - cap - 14)));
    const Hb = Math.round(Math.max(court ? 100 : 120, Math.min(HbMax, H - T - cap - 14)));
    const W = Math.round(W0 * etat.zoom);
    G = { W, Hb, T, cap, ML: 64, MR: 44, vuesH: Math.max(T + cap + 10, H - Hb) };
    D.plateau.style.width = W + 'px';
    D.vues.style.height = G.vuesH + 'px';
    D.banc.setAttribute('width', W);
    D.banc.setAttribute('height', G.Hb);
    D.banc.setAttribute('viewBox', `0 0 ${W} ${G.Hb}`);
    D.zoomV.textContent = '× ' + fmtF(etat.zoom);
    D.zMoins.disabled = etat.zoom === ZOOMS[0];
    D.zPlus.disabled = etat.zoom === ZOOMS[ZOOMS.length - 1];
  }
  const K = () => (G.W - G.ML - G.MR) / etat.L;               // pixels par cm le long du banc
  const xPx = x => G.ML + x * K();

  /* ============================================================
     DESSIN DU BANC (SVG)
     ============================================================ */
  // demi-hauteur (cm) à dessiner : la plus grande lentille ou le plus grand miroir, la lettre F ;
  // les écrans ont cette hauteur. Les hauteurs sont agrandies autant que la place le permet.
  function geometrie() {
    const yRail = G.Hb - 44;
    let E = 2.5;
    for (const c of etat.comps) {
      if (c.D) E = Math.max(E, c.D / 2 + 0.3);
      if (c.type === 'lampe') E = Math.max(E, c.AB + 0.6);
    }
    // place des noms au-dessus (une ligne sur téléphone, deux sinon) et pied sous les composants
    const haut = court ? 24 : 46, pied = court ? 10 : 18;
    const KY = Math.max(2.5, Math.min(30, (yRail - haut - pied) / (2 * E + 0.2)));
    const YA = yRail - pied - E * KY;
    return { yRail, KY, YA, E };
  }
  function dessinerBanc() {
    const { yRail, KY, YA, E } = geometrie();
    const k = K(), X = xPx, L = etat.L;
    const Y = y => YA - y * KY;
    const lim = E + 0.6, clip = v => Math.max(-lim, Math.min(lim, v));
    const pts = t => t.map(p => `${X(p[0]).toFixed(1)},${Y(clip(p[1])).toFixed(1)}`).join(' ');
    const s = [];
    // rail gradué
    s.push(`<rect x="${X(0) - 12}" y="${yRail}" width="${L * k + 24}" height="10" rx="2" class="s-rail"/>`);
    const pasN = k * 10 >= 34 ? 10 : 20;
    for (let c = 0; c <= L; c++) {
      const g = c % 10 === 0 ? 9 : c % 5 === 0 ? 6 : 3;
      if (k < 3 && c % 5) continue;
      s.push(`<line x1="${X(c)}" y1="${yRail + 10}" x2="${X(c)}" y2="${yRail + 10 + g}" class="s-grad"/>`);
      if (c % pasN === 0) s.push(`<text x="${X(c)}" y="${yRail + 33}" class="s-grad-t">${c}</text>`);
    }
    s.push(`<text x="${X(L) + 24}" y="${yRail + 33}" class="s-grad-t">cm</text>`);
    s.push(`<line x1="${X(0) - 12}" y1="${YA}" x2="${X(L) + 12}" y2="${YA}" class="s-axe"/>`);
    // faisceau lumineux (case « Faisceau »)
    if (etat.faisceau) for (const f of O.faisceau(ana.els, ana.lampe, L)) {
      const haut = f.tr.map(t => `${X(t[0]).toFixed(1)},${Y(clip(t[2])).toFixed(1)}`);
      const bas = f.tr.slice().reverse().map(t => `${X(t[0]).toFixed(1)},${Y(clip(t[1])).toFixed(1)}`);
      s.push(`<polygon points="${haut.concat(bas).join(' ')}" class="s-faisceau"/>`);
    }
    // rayons particuliers issus de B et foyers (case « Rayons »)
    if (etat.rayons) {
      for (const r of O.rayons(ana.els, ana.lampe, L)) s.push(`<polyline points="${pts(r.pts)}" class="s-rayon"/>`);
      for (const c of etat.comps) {
        if (!(c.type === 'cv' || c.type === 'dv' || COURBES.includes(c.type)) || (c.mystere && !c.revele)) continue;
        const ind = nom(c).slice(1);
        // miroir concave : foyer devant le miroir ; convexe : foyer (virtuel) derrière
        const fs = c.type === 'concave' ? [[c.x - c.f, 'F' + ind]] : c.type === 'convexe' ? [[c.x + c.f, 'F' + ind]]
          : [[c.x - c.f, 'F' + ind], [c.x + c.f, 'F′' + ind]];
        for (const [xf, t] of fs) {
          if (xf < 0 || xf > L) continue;
          s.push(`<circle cx="${X(xf)}" cy="${YA}" r="3" class="s-foyer"/><text x="${X(xf)}" y="${YA + 17}" class="s-foyer-t">${t}</text>`);
        }
      }
    }
    // rayons de construction imposés par le TP (cercle oculaire…)
    if (etat.traces) for (const t of etat.traces()) s.push(`<polyline points="${pts(t.pts)}" class="${t.cls || 's-rayon'}"/>`);
    if (etat.rayons || etat.traces) {
      const kh = KY / k;
      if (Math.abs(kh - 1) > 0.05) s.push(`<text x="${G.W - 8}" y="14" class="s-note">Hauteurs × ${fmt(kh, 1)}</text>`);
    }
    // composants, puis noms (sur deux rangées si deux noms se touchent), poignées
    const noms = [], rangs = [];
    const tries = etat.comps.slice().sort((a, b) => a.x - b.x);
    for (const c of tries) {
      const x = X(c.x), sel = c.id === etat.sel;
      const hD = (c.D || 4) / 2 * KY, HE = E * KY;
      let haut = YA - hD, bas = YA + hD, forme = '';
      if (c.type === 'lampe') {
        const hp = Math.max(26, (c.AB + 0.4) * KY);           // plaque de la lanterne
        haut = YA - hp - 4; bas = YA + hp + 4;
        const yb = Y(c.AB);
        forme = `<rect x="${x - 46}" y="${YA - hp - 4}" width="40" height="${2 * hp + 8}" rx="5" class="s-lampe"/><rect x="${x - 6}" y="${YA - hp}" width="6" height="${2 * hp}" class="s-plaque"/>
          <line x1="${x + 2}" y1="${YA}" x2="${x + 2}" y2="${yb + 7}" class="s-objet"/><path d="M ${x + 2} ${yb} L ${x - 3} ${yb + 9} L ${x + 7} ${yb + 9} Z" class="s-objet-p"/>`;
        if (etat.rayons) forme += `<text x="${x + 9}" y="${YA + 13}" class="s-lettre">A</text><text x="${x + 9}" y="${yb + 4}" class="s-lettre">B</text>`;
      } else if (c.type === 'cv' || c.type === 'dv') {
        const e = Math.min(11, 3.5 + hD * 0.12);
        forme = c.type === 'cv'
          ? `<path d="M ${x} ${YA - hD} Q ${x + 2 * e} ${YA} ${x} ${YA + hD} Q ${x - 2 * e} ${YA} ${x} ${YA - hD} Z" class="s-lentille"/>`
          : `<path d="M ${x - e} ${YA - hD} L ${x + e} ${YA - hD} Q ${x - e + 3} ${YA} ${x + e} ${YA + hD} L ${x - e} ${YA + hD} Q ${x + e - 3} ${YA} ${x - e} ${YA - hD} Z" class="s-lentille"/>`;
      } else if (MIROIRS.includes(c.type)) {
        // face réfléchissante à gauche (vers la lumière), hachures derrière ;
        // concave : bords tournés vers la lumière ; convexe : centre tourné vers la lumière
        const cb = c.type === 'concave' ? -7 : c.type === 'convexe' ? 7 : 0;
        forme = `<path d="M ${x + cb} ${YA - hD} Q ${x - cb} ${YA} ${x + cb} ${YA + hD}" class="s-miroir"/>`;
        for (let yy = -hD + 3; yy < hD; yy += 6) {
          const dx = cb * Math.pow(yy / hD, 2);
          forme += `<line x1="${x + 2 + dx}" y1="${YA + yy}" x2="${x + 8 + dx}" y2="${YA + yy - 5}" class="s-hachure"/>`;
        }
      } else if (c.type === 'ecran') {
        haut = YA - HE; bas = YA + HE;
        forme = `<rect x="${x - 3}" y="${YA - HE}" width="6" height="${2 * HE}" class="s-ecran${c.retire ? ' retire' : ''}"/>`;
      }
      s.push(`<g class="s-comp">${c.type === 'lampe' ? `<line x1="${x - 26}" y1="${bas}" x2="${x - 26}" y2="${yRail}" class="s-tige"/>`
        : `<line x1="${x}" y1="${bas}" x2="${x}" y2="${yRail}" class="s-tige"/>`}${forme}</g>`);
      // nom et position au-dessus
      const xn = c.type === 'lampe' ? x - 26 : x, t1 = etiquette(c), t2 = fmt(c.x) + ' cm';
      const larg = (court ? nom(c).length + t2.length + 3 : Math.max(t1.length, t2.length)) * 6.6 + 10;
      let rang = 0;
      while (rangs[rang] != null && rangs[rang] > xn - larg / 2) rang++;
      rangs[rang] = xn + larg / 2;
      const yh = haut - 8 - rang * (court ? 16 : 30);
      // sur téléphone, une seule ligne : nom et position (la focale est dans la barre du composant)
      noms.push(court ? `<text x="${xn}" y="${yh}" class="s-nom${sel ? ' sel' : ''}">${echapper(nom(c))} · <tspan class="s-pos">${t2}</tspan></text>`
        : `<text x="${xn}" y="${yh - 14}" class="s-nom${sel ? ' sel' : ''}">${echapper(t1)}</text><text x="${xn}" y="${yh}" class="s-pos">${t2}</text>`);
      // zone à saisir pour glisser (large, pour le doigt) et poignée sur le rail
      const xp = xn, lz = 30;
      noms.push(`<g class="s-prise${sel ? ' sel' : ''}" data-id="${c.id}" tabindex="0" role="slider" aria-label="${echapper(nom(c))} : ${TYPES[c.type].nom.toLowerCase()}, position" aria-valuemin="0" aria-valuemax="${L}" aria-valuenow="${c.x}" aria-valuetext="${fmt(c.x)} cm">
        ${sel ? `<rect x="${xp - lz / 2}" y="${yh - 30}" width="${lz}" height="${yRail - yh + 48}" rx="10" class="s-sel"/>` : ''}
        <rect x="${xp - lz / 2}" y="${yh - 30}" width="${lz}" height="${yRail - yh + 48}" class="s-zone"/>
        <rect x="${xp - 9}" y="${yRail - 7}" width="18" height="7" rx="2" class="s-cavalier"/>
        <circle cx="${xp}" cy="${yRail + 5}" r="9" class="s-poignee"/></g>`);
    }
    // repère « focus » conservé d'un dessin à l'autre
    const focusId = document.activeElement && document.activeElement.closest && document.activeElement.closest('.s-prise') ? document.activeElement.closest('.s-prise').dataset.id : null;
    D.banc.innerHTML = s.join('') + noms.join('');
    if (focusId) { const f = D.banc.querySelector(`.s-prise[data-id="${focusId}"]`); if (f) f.focus({ preventScroll: true }); }
  }

  /* ---------- Glisser les composants le long du banc ---------- */
  function bancGlisser() {
    let prise = null;
    const xCm = ev => (ev.clientX - D.banc.getBoundingClientRect().left - G.ML) / K();
    D.banc.addEventListener('pointerdown', ev => {
      const g = ev.target.closest('.s-prise');
      if (!g) { if (etat.sel != null) { etat.sel = null; changer(); } return; }
      const c = etat.comps.find(o => o.id === +g.dataset.id);
      if (!c) return;
      ev.preventDefault();
      etat.sel = c.id;
      prise = { c, dx: xCm(ev) - c.x, id: ev.pointerId };
      try { D.plateau.setPointerCapture(ev.pointerId); } catch (e) { /* rien */ }
      changer();
    });
    // au doigt : saisir un composant ne fait pas défiler le banc
    D.banc.addEventListener('touchstart', ev => { if (ev.target.closest('.s-prise')) ev.preventDefault(); }, { passive: false });
    D.plateau.addEventListener('pointermove', ev => {
      if (!prise || ev.pointerId !== prise.id) return;
      placer(prise.c, xCm(ev) - prise.dx);
      changer();
    });
    const fin = ev => { if (prise && ev.pointerId === prise.id) prise = null; };
    D.plateau.addEventListener('pointerup', fin);
    D.plateau.addEventListener('pointercancel', fin);
    // le clavier sur une poignée (focus) choisit aussi le composant
    D.banc.addEventListener('focusin', ev => {
      const g = ev.target.closest('.s-prise');
      if (g && etat.sel !== +g.dataset.id) { etat.sel = +g.dataset.id; changer(); }
    });
  }
  function clavier(ev) {
    if (ev.target.closest && ev.target.closest('input, select, textarea')) return;
    if (ev.key === 'Escape' && !D.loupe.hidden) { fermerLoupe(); return; }
    const c = choisi();
    if (!c) return;
    if (ev.key === 'ArrowLeft' || ev.key === 'ArrowRight') {
      ev.preventDefault();
      deplacer(c, (ev.key === 'ArrowRight' ? 1 : -1) * (ev.shiftKey ? 1 : 0.1));
    } else if ((ev.key === 'Delete' || ev.key === 'Backspace') && !(c.verrou && c.verrou.suppr) && ev.target.closest && ev.target.closest('.s-prise')) {
      ev.preventDefault();
      supprimer(c); changer();
    }
  }
  // déplacement fin (± 1 mm, ± 1 cm) : saute par-dessus un composant voisin si besoin
  function deplacer(c, d) {
    let v = r1(c.x + d);
    v = Math.min(xMax(c), Math.max(0, v));
    for (let i = 0; i < etat.L * 10 && !libre(c, v); i++) v = r1(v + (d > 0 ? 0.1 : -0.1));
    if (v >= 0 && v <= xMax(c) && libre(c, v)) c.x = v;
    changer();
  }

  /* ---------- Palette : clic pour ajouter, glisser-déposer sur le banc ---------- */
  function paletteGlisser(b) {
    const type = b.dataset.type;
    let dep = null;
    b.addEventListener('pointerdown', ev => {
      if (b.disabled) return;
      dep = { x: ev.clientX, y: ev.clientY, id: ev.pointerId, glisse: false };
      try { b.setPointerCapture(ev.pointerId); } catch (e) { /* rien */ }
    });
    b.addEventListener('pointermove', ev => {
      if (!dep || ev.pointerId !== dep.id) return;
      if (!dep.glisse && Math.hypot(ev.clientX - dep.x, ev.clientY - dep.y) > 6) {
        dep.glisse = true;
        D.fantome.innerHTML = `<svg viewBox="0 0 24 24">${ICONES[type]}</svg>${TYPES[type].nom}`;
        D.fantome.hidden = false;
      }
      if (dep.glisse) { D.fantome.style.left = ev.clientX + 'px'; D.fantome.style.top = ev.clientY + 'px'; }
    });
    b.addEventListener('pointerup', ev => {
      if (!dep || ev.pointerId !== dep.id) return;
      const glisse = dep.glisse;
      dep = null;
      D.fantome.hidden = true;
      if (!glisse) { nouveau(type, null); return; }
      // déposé au-dessus du banc ?
      const r = D.scene.getBoundingClientRect();
      if (ev.clientX >= r.left && ev.clientX <= r.right && ev.clientY >= r.top && ev.clientY <= r.bottom) {
        nouveau(type, (ev.clientX - D.banc.getBoundingClientRect().left - G.ML) / K());
      }
    });
    b.addEventListener('pointercancel', () => { dep = null; D.fantome.hidden = true; });
    // clavier : Entrée / Espace (le clic de la souris passe par pointerup)
    b.addEventListener('keydown', ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); nouveau(type, null); } });
  }
  function nouveau(type, x) {
    const c = ajouter(type, x);
    if (c) { etat.sel = c.id; changer(); }
  }

  /* ============================================================
     BARRE DU COMPOSANT SÉLECTIONNÉ
     ============================================================ */
  let selRendu = '';
  function barreSel() {
    // palette : une seule lampe
    D.racine.querySelectorAll('.bo-ajout[data-type="lampe"]').forEach(b => { b.disabled = etat.comps.some(c => c.type === 'lampe'); b.title = b.disabled ? 'Une seule lampe sur le banc' : 'Clique pour ajouter, ou glisse sur le banc'; });
    D.racine.classList.toggle('bo-a-sel', !!choisi());
    const c = choisi();
    // ne reconstruire la barre que si son contenu change (garde le focus des listes)
    const cle = c ? JSON.stringify([c.id, c.x, c.f, c.D, c.AB, c.retire, c.mystere, c.revele, nom(c)]) : 'vide';
    if (cle === selRendu) return;
    selRendu = cle;
    const z = D.selInfo;
    if (!c) { z.innerHTML = '<span class="bo-aide-t">Clique sur un composant pour le régler, ou glisse-le le long du banc.</span>'; return; }
    const v = c.verrou || {};
    const opt = (liste, val, f) => liste.map(x => `<option value="${x}"${x === val ? ' selected' : ''}>${f(x)}</option>`).join('');
    let h = `<span class="bo-pastille" aria-hidden="true">${echapper(nom(c).replace(/ .*/, '').slice(0, 3))}</span>
      <span class="bo-sel-nom">${TYPES[c.type].nom}</span><span class="bo-sel-pos">${fmt(c.x)} cm</span>
      <span class="bo-pas" role="group" aria-label="Déplacer"><button type="button" class="bo-mini" data-d="-1">−1 cm</button><button type="button" class="bo-mini" data-d="-0.1">−1 mm</button><button type="button" class="bo-mini" data-d="0.1">+1 mm</button><button type="button" class="bo-mini" data-d="1">+1 cm</button></span>`;
    if (c.type === 'cv' || c.type === 'dv') {
      const sg = c.type === 'dv' ? -1 : 1;
      if (v.f) h += `<span class="bo-lab">f′ = ${fmtF(c.f)} cm <span class="bo-discret">(imposée)</span></span>`;
      else if (c.mystere && !c.revele) h += `<span class="bo-lab">f′ = ?</span><button type="button" class="bo-mini" data-a2="reveler">Révéler</button>`;
      else h += `<label class="bo-lab">f′ <span class="bo-sel"><select class="bo-select" data-a2="f" aria-label="Distance focale">${opt(BOITE.cv.map(x => sg * x), c.f, x => fmtF(x) + ' cm')}<option value="mystere">? (mystère)</option></select></span></label>${c.mystere ? '<span class="bo-discret">révélée</span>' : ''}`;
    } else if (COURBES.includes(c.type)) {
      h += `<label class="bo-lab">f <span class="bo-sel"><select class="bo-select" data-a2="f" aria-label="Distance focale du miroir">${opt(BOITE.miroir, c.f, x => fmtF(x) + ' cm')}</select></span></label>`;
    } else if (c.type === 'lampe') {
      h += `<label class="bo-lab">AB <span class="bo-sel"><select class="bo-select" data-a2="AB" aria-label="Taille de la lettre F">${opt(BOITE.AB, c.AB, x => fmt(x) + ' cm')}</select></span></label>`;
    } else if (c.type === 'ecran') {
      h += `<button type="button" class="bo-mini${c.retire ? ' on' : ''}" data-a2="retire" aria-pressed="${!!c.retire}">${c.retire ? 'Remettre dans le faisceau' : 'Retirer du faisceau'}</button>`;
    }
    if ((c.type === 'cv' || c.type === 'dv' || MIROIRS.includes(c.type)) && !v.D) {
      h += `<label class="bo-lab">Ø <span class="bo-sel"><select class="bo-select" data-a2="D" aria-label="Diamètre">${opt(BOITE.D, c.D, x => x + ' cm')}</select></span></label>`;
    }
    if (!v.suppr) h += `<button type="button" class="bo-mini" data-a2="suppr">Supprimer</button>`;
    if (court) h += `<button type="button" class="bo-mini" data-a2="fermer" aria-label="Fermer les réglages du composant">✕</button>`;
    z.innerHTML = h;
    z.querySelectorAll('[data-d]').forEach(b => b.addEventListener('click', () => deplacer(c, +b.dataset.d)));
    const a = n => z.querySelector(`[data-a2="${n}"]`);
    if (a('f')) a('f').addEventListener('change', e => {
      if (e.target.value === 'mystere') { c.mystere = true; c.revele = false; c.f = focaleMystere(c.type); }
      else { c.f = +e.target.value; c.mystere = false; c.revele = false; }
      changer();
    });
    if (a('reveler')) a('reveler').addEventListener('click', () => { c.revele = true; changer(); });
    if (a('AB')) a('AB').addEventListener('change', e => { c.AB = +e.target.value; changer(); });
    if (a('D')) a('D').addEventListener('change', e => { c.D = +e.target.value; changer(); });
    if (a('retire')) a('retire').addEventListener('click', () => { c.retire = !c.retire; changer(); });
    if (a('suppr')) a('suppr').addEventListener('click', () => { supprimer(c); changer(); });
    if (a('fermer')) a('fermer').addEventListener('click', () => { etat.sel = null; changer(); });
  }

  /* ============================================================
     VUES RAPPROCHÉES (canvas) : plaque de la lanterne, écrans
     ============================================================ */
  const vues = new Map();                 // clé → { div, cv, cap }
  let loupeCle = null;
  // échelle de chaque vue : demi-largeur visible (cm), réglée à la main (boutons − et +)
  const CHAMPS = [0.5, 1, 2, 3, 5, 8, 12];
  const echelles = new Map();             // clé → indice dans CHAMPS (3 cm par défaut)
  const champDe = cle => CHAMPS[echelles.has(cle) ? echelles.get(cle) : 3];
  function zoomVue(cle, s) {
    const i = echelles.has(cle) ? echelles.get(cle) : 3;
    echelles.set(cle, Math.max(0, Math.min(CHAMPS.length - 1, i + s)));
    changer();
  }

  // contenu d'une vue : sources de lumière (lettre F et ses images) et textes
  function contenuVue(t, cle) {
    const c = t.comp, lampe = ana.lampe;
    const AB = lampe ? lampe.AB : 2;
    const sources = [];
    const image = { m: t.m, c0: t.c0, w: t.w, I: Math.pow(t.T / 0.3, 2), AB };
    let titre, etatT, ok = false;
    if (t.el.k === 'plaque') {
      sources.push({ m: 1, c0: 0, w: 0, I: 1, AB });
      if (t.lumiere) sources.push(image);
      titre = (t.lumiere ? 'Plaque de la lanterne' : 'Objet') + ` · ${fmt(c.x)} cm`;
      etatT = t.lumiere ? (t.nette ? '✓ image renvoyée nette' : 'image renvoyée floue') : `lettre F, AB = ${fmt(AB)} cm`;
      ok = t.lumiere && t.nette;
    } else {
      if (t.lumiere) sources.push(image);
      titre = `Écran ${nom(c)} · ${fmt(c.x)} cm`;
      etatT = t.lumiere ? (t.nette ? '✓ image nette' : 'image floue') : 'pas de lumière';
      ok = t.lumiere && t.nette;
    }
    return { sources, titre, etatT, ok, champ: champDe(cle), cle };
  }
  function contenuRetire(c, cle) {
    return { sources: [], titre: `Écran ${nom(c)} · ${fmt(c.x)} cm`, etatT: 'retiré du faisceau', ok: false, champ: champDe(cle), cle };
  }
  // titre de la vue (nom, position, état de l'image) et boutons de l'échelle
  const legende = ct => `<b>${echapper(ct.titre)}</b><span class="bo-vue-l2"><span class="bo-vue-etat${ct.ok ? ' ok' : ''}">${ct.etatT}</span>
    <span class="bo-vue-z"><button type="button" data-z="1" aria-label="Voir une plus grande partie de l'écran"${ct.champ === CHAMPS[CHAMPS.length - 1] ? ' disabled' : ''}>−</button><button type="button" data-z="-1" aria-label="Agrandir l'image dans la vue"${ct.champ === CHAMPS[0] ? ' disabled' : ''}>+</button></span></span>`;

  function dessinerVues() {
    const liste = [];
    for (const t of ana.cibles) liste.push({ cle: t.comp.id + '', x: t.comp.x, contenu: contenuVue(t, t.comp.id + '') });
    for (const c of etat.comps) if (c.type === 'ecran' && c.retire) liste.push({ cle: c.id + '', x: c.x, contenu: contenuRetire(c, c.id + '') });
    liste.sort((a, b) => a.x - b.x);
    // retirer les vues des composants disparus
    for (const [k, v] of vues) if (!liste.some(l => l.cle === k)) { v.div.remove(); vues.delete(k); }
    // placement : centrées sur leur composant, écartées si elles se chevauchent, dans le banc
    const T = G.T, l = T, gap = 8, Wv = G.W;
    const pos = liste.map(v => Math.max(0, Math.min(Wv - l, xPx(v.x) - l / 2)));
    for (let i = 1; i < pos.length; i++) pos[i] = Math.max(pos[i], pos[i - 1] + l + gap);
    for (let i = pos.length - 1; i >= 0; i--) {
      const lim = i === pos.length - 1 ? Wv - l : pos[i + 1] - l - gap;
      if (pos[i] > lim) pos[i] = Math.max(0, lim);
    }
    liste.forEach((v, i) => {
      let o = vues.get(v.cle);
      if (!o) {
        const div = el('div', 'bo-vue');
        div.innerHTML = `<div class="bo-vue-cap"></div><button type="button" class="bo-vue-bt" aria-label="Agrandir la vue"><canvas></canvas></button><span class="bo-vue-pointe" aria-hidden="true"></span>`;
        D.vues.appendChild(div);
        o = { div, cv: div.querySelector('canvas'), cap: div.querySelector('.bo-vue-cap'), pointe: div.querySelector('.bo-vue-pointe') };
        div.querySelector('.bo-vue-bt').addEventListener('click', () => ouvrirLoupe(v.cle));
        // boutons − et + de l'échelle (la légende est réécrite à chaque dessin)
        div.querySelector('.bo-vue-cap').addEventListener('click', ev => { const b = ev.target.closest('[data-z]'); if (b) zoomVue(v.cle, +b.dataset.z); });
        vues.set(v.cle, o);
      }
      o.contenu = v.contenu;
      o.div.style.left = pos[i] + 'px';
      o.div.style.top = Math.max(0, G.vuesH - T - G.cap - 12) + 'px';
      o.div.style.width = T + 'px';
      o.cap.style.height = G.cap + 'px';
      const lg = legende(v.contenu);
      if (o.lg !== lg) { o.cap.innerHTML = lg; o.lg = lg; }
      o.div.querySelector('.bo-vue-bt').setAttribute('aria-label', `Agrandir la vue : ${v.contenu.titre}, ${v.contenu.etatT}`);
      o.pointe.style.left = Math.max(4, Math.min(T - 18, xPx(v.x) - pos[i] - 7)) + 'px';
      dessinerVue(o.cv, T, v.contenu);
    });
    if (loupeCle != null) majLoupe();
  }

  /* ---------- Calcul de l'image : lettre F (trois rectangles) agrandie de m,
     chaque point étalé en une tache de diamètre w (convolution par un disque) ---------- */
  const NG0 = 128;                                  // grille de calcul NG × NG (plus fine pour la loupe)
  function rectsF(h) {
    const t = 0.17 * h, w = 0.62 * h;
    return [[0, t, 0, h], [t, w, h - t, h], [t, 0.78 * w, 0.45 * h, 0.45 * h + t]];
  }
  function intensites(contenu, NG) {
    const champ = contenu.champ, s = 2 * champ / NG, I = new Float32Array(NG * NG);
    for (const src of contenu.sources) {
      let m = src.m;
      if (Math.abs(m) < 1e-3) m = m < 0 ? -1e-3 : 1e-3;
      const B = new Float32Array(NG * NG);
      const val = src.I / (m * m);                  // éclairement de l'image nette (∝ 1 / m²)
      let j0 = NG, j1 = -1, i0 = NG, i1 = -1, flux = 0;
      for (const [x1, x2, y1, y2] of rectsF(src.AB)) {
        const za = Math.min(m * x1, m * x2), zb = Math.max(m * x1, m * x2);
        const ya = src.c0 + Math.min(m * y1, m * y2), yb = src.c0 + Math.max(m * y1, m * y2);
        const ia = Math.max(0, Math.floor((za + champ) / s)), ib = Math.min(NG - 1, Math.floor((zb + champ) / s));
        const ja = Math.max(0, Math.floor((champ - yb) / s)), jb = Math.min(NG - 1, Math.floor((champ - ya) / s));
        for (let j = ja; j <= jb; j++) {
          const yh = champ - j * s, yl = yh - s, dy = Math.min(yh, yb) - Math.max(yl, ya);
          if (dy <= 0) continue;
          for (let i = ia; i <= ib; i++) {
            const zl = -champ + i * s, zh = zl + s, dz = Math.min(zh, zb) - Math.max(zl, za);
            if (dz <= 0) continue;
            const v = dz * dy / (s * s) * val;
            B[j * NG + i] += v; flux += v;
            if (j < j0) j0 = j; if (j > j1) j1 = j; if (i < i0) i0 = i; if (i > i1) i1 = i;
          }
        }
      }
      if (j1 < 0) continue;
      const r = src.w / 2 / s;                      // rayon de la tache, en cases
      if (r < 0.6) { for (let k = 0; k < B.length; k++) I[k] += B[k]; continue; }
      if (r > NG * 0.6) {
        // tache bien plus grande que la vue : éclairage presque uniforme
        const v = flux / (Math.PI * r * r);
        const cj = (j0 + j1) / 2, ci = (i0 + i1) / 2;
        for (let j = 0; j < NG; j++) for (let i = 0; i < NG; i++) if ((j - cj) ** 2 + (i - ci) ** 2 <= r * r) I[j * NG + i] += v;
        continue;
      }
      // convolution par un disque : sommes cumulées par ligne
      const R = Math.floor(r), P = new Float32Array(NG * (NG + 1));
      for (let j = j0; j <= j1; j++) { let a = 0; for (let i = 0; i < NG; i++) { a += B[j * NG + i]; P[j * (NG + 1) + i + 1] = a; } }
      const demi = [];
      let nk = 0;
      for (let dj = -R; dj <= R; dj++) { const hh = Math.floor(Math.sqrt(Math.max(0, r * r - dj * dj))); demi.push(hh); nk += 2 * hh + 1; }
      const ja = Math.max(0, j0 - R), jb = Math.min(NG - 1, j1 + R), ia = Math.max(0, i0 - R), ib = Math.min(NG - 1, i1 + R);
      for (let j = ja; j <= jb; j++) {
        for (let i = ia; i <= ib; i++) {
          let a = 0;
          for (let dj = -R; dj <= R; dj++) {
            const jj = j + dj;
            if (jj < j0 || jj > j1) continue;
            const hh = demi[dj + R], g = Math.max(0, i - hh), d = Math.min(NG - 1, i + hh);
            a += P[jj * (NG + 1) + d + 1] - P[jj * (NG + 1) + g];
          }
          I[j * NG + i] += a / nk;
        }
      }
    }
    return I;
  }

  const tampon = document.createElement('canvas');
  function dessinerVue(cv, T, contenu) {
    const NG = T > 300 ? 256 : NG0;
    if (tampon.width !== NG) tampon.width = tampon.height = NG;
    const C = couleurs(), dpr = window.devicePixelRatio || 1;
    const px = Math.round(T * dpr);
    if (cv.width !== px) { cv.width = cv.height = px; cv.style.width = cv.style.height = T + 'px'; }
    const ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // fond : l'écran (ou la plaque) dans la pénombre
    ctx.fillStyle = C.paper; ctx.fillRect(0, 0, T, T);
    if (contenu.sources.length) {
      const I = intensites(contenu, NG);
      const tc = tampon.getContext('2d'), img = tc.createImageData(NG, NG), d = img.data, [r, g, b] = C.accentRGB;
      for (let k = 0; k < I.length; k++) {
        const a = I[k] > 0 ? 1 - Math.exp(-2.5 * Math.pow(I[k], 0.6)) : 0;
        d[4 * k] = r; d[4 * k + 1] = g; d[4 * k + 2] = b; d[4 * k + 3] = Math.round(255 * a);
      }
      tc.putImageData(img, 0, 0);
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(tampon, 0, 0, T, T);
    }
    // axe optique et règle graduée (0 sur l'axe)
    const champ = contenu.champ, S = T / (2 * champ), xr = Math.max(24, T * 0.15);
    ctx.strokeStyle = C.ink3; ctx.lineWidth = 1; ctx.setLineDash([3, 3]);
    ctx.beginPath(); ctx.moveTo(xr, T / 2); ctx.lineTo(T, T / 2); ctx.stroke();
    ctx.setLineDash([]); ctx.strokeStyle = C.ink2;
    ctx.beginPath(); ctx.moveTo(xr, 0); ctx.lineTo(xr, T); ctx.stroke();
    // graduations lisibles : au moins 3 px entre deux traits, 16 px entre deux nombres (nombres décimaux si besoin)
    const pas = [0.1, 0.2, 0.5, 1].find(v => v * S >= 3) || 1;
    const pasN = [0.1, 0.2, 0.5, 1, 2, 5].find(v => v * S >= 16) || 10;
    const decN = pasN < 1 ? 1 : 0, multiple = (v, q) => Math.abs(v / q - Math.round(v / q)) < 1e-6;
    ctx.fillStyle = C.ink2; ctx.font = `${Math.max(9, Math.min(13, Math.round(T / 18)))}px ${C.font}`; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    const n = Math.round(champ / pas);
    for (let k = -n; k <= n; k++) {
      const v = k * pas, y = T / 2 - v * S;
      const nombre = multiple(v, pasN), demi = multiple(v, pasN / 2);
      const lg = nombre ? 8 : demi ? 5 : 2.5;
      ctx.beginPath(); ctx.moveTo(xr, y); ctx.lineTo(xr + lg, y); ctx.stroke();
      if (nombre && Math.abs(v) < champ - 0.01 && y > 16) ctx.fillText(fmt(Math.abs(v), decN), xr - 3, y);
    }
    ctx.textBaseline = 'top'; ctx.textAlign = 'left'; ctx.fillText('cm', xr + 10, 3);
  }

  /* ---------- Loupe : une vue agrandie, mise à jour en direct ---------- */
  function ouvrirLoupe(cle) {
    loupeCle = cle;
    D.loupe.hidden = false;
    majLoupe();
    D.loupeX.focus();
  }
  function fermerLoupe() {
    const cle = loupeCle;
    loupeCle = null;
    D.loupe.hidden = true;
    const o = vues.get(cle);
    if (o) o.div.querySelector('button').focus();
  }
  function majLoupe() {
    const o = vues.get(loupeCle);
    if (!o) { fermerLoupe(); return; }
    const T = Math.round(Math.min(innerWidth * 0.86, innerHeight * 0.8 - 60, 520));
    D.loupeCap.innerHTML = o.cap.innerHTML;
    dessinerVue(D.loupeCv, T, o.contenu);
  }

  /* ============================================================
     MANIPULATIONS : banc libre et TP guidés (panneau du bas)
     ============================================================ */
  const libreSauve = { comps: null, L: 100 };
  let tpEtape = 0, tpFaites = new Set(), tpReplie = false, ecouteursEtape = [];

  function choisirMode(mode, parUtilisateur) {
    // le banc libre est gardé quand on passe à un TP
    if (etat.mode === 'libre' && parUtilisateur) { libreSauve.comps = etat.comps; libreSauve.L = etat.L; }
    etat.mode = mode;
    D.tp.value = mode;
    if (parUtilisateur || location.hash.replace('#', '') !== mode) history.replaceState(null, '', mode === 'libre' ? location.pathname + location.search : '#' + mode);
    const def = BO.TP[mode];
    etat.sel = null;
    if (mode === 'libre' && libreSauve.comps) { etat.comps = libreSauve.comps; regleBanc(libreSauve.L); }
    else montage(def);
    tpEtape = 0; tpFaites = new Set();
    D.tpZone.hidden = !def.etapes;
    miseEnPage();
    if (def.etapes) tpRendre();
    maintenant();
    D.scene.scrollLeft = 0;
  }
  function montage(def) {
    etat.comps = [];
    etat.prochainId = 1;
    etat.traces = null;
    // case « Faisceau » : cochée au départ seulement si le TP le demande
    etat.faisceau = !!def.faisceau;
    D.faisceau.checked = etat.faisceau;
    regleBanc(def.banc || 100);
    for (const c of def.montage()) {
      const cc = creer(c.type, c);
      etat.comps.push(cc);
    }
  }

  /* ---------- Panneau du TP ---------- */
  function tpRendre() {
    const def = BO.TP[etat.mode];
    ecouteursEtape.forEach(f => ecouteurs.delete(f));
    ecouteursEtape = [];
    etat.traces = null;                   // les tracés de construction appartiennent à une étape
    D.tpZone.innerHTML = `<div class="bo-tp-tete" data-a3="tete"></div>
      <div class="bo-tp-corps" data-a3="corps"><div class="bo-tp-col" data-a3="g"></div><div class="bo-tp-col" data-a3="d"></div></div>`;
    D.tpZone.classList.toggle('replie', tpReplie);
    tpRendreTete();
    const g = D.tpZone.querySelector('[data-a3="g"]'), d = D.tpZone.querySelector('[data-a3="d"]');
    const et = def.etapes[tpEtape];
    g.innerHTML = `<h3 class="bo-tp-h">${tpEtape + 1}. ${et.titre}</h3>`;
    et.rendre(apiEtape(g, d));
  }
  function tpRendreTete() {
    const def = BO.TP[etat.mode];
    if (!def || !def.etapes) return;
    const t = D.tpZone.querySelector('[data-a3="tete"]');
    if (!t) return;
    const n = def.etapes.length;
    t.innerHTML = `<span class="bo-tp-titre">${def.titre}</span>
      <span class="bo-tp-court">Étape ${tpEtape + 1} / ${n} · ${def.etapes[tpEtape].titre}</span>
      <span class="bo-etapes" role="list">${def.etapes.map((e, i) => `<button type="button" role="listitem" class="bo-etape${i === tpEtape ? ' cours' : tpFaites.has(i) ? ' fait' : ''}" data-i="${i}"${i === tpEtape ? ' aria-current="step"' : ''}><span>${tpFaites.has(i) && i !== tpEtape ? '✓' : i + 1}</span>${e.titre}</button>`).join('')}</span>
      <span class="bo-tp-bt"><button type="button" class="bo-mini" data-a3="refaire" title="Remettre le montage de départ et revenir à l'étape 1">↺ Recommencer</button>
      <button type="button" class="bo-mini" data-a3="plier" aria-expanded="${!tpReplie}">${tpReplie ? '▴ Ouvrir le TP' : '▾ Replier'}</button></span>`;
    t.querySelectorAll('.bo-etape').forEach(b => b.addEventListener('click', () => { tpEtape = +b.dataset.i; tpReplie = false; tpRendre(); miseEnPage(); maintenant(); }));
    t.querySelector('[data-a3="refaire"]').addEventListener('click', () => { montage(def); etat.sel = null; tpEtape = 0; tpFaites = new Set(); tpRendre(); maintenant(); });
    t.querySelector('[data-a3="plier"]').addEventListener('click', () => {
      tpReplie = !tpReplie;
      D.tpZone.classList.toggle('replie', tpReplie);
      tpRendreTete();
      miseEnPage(); maintenant();
    });
  }
  function tpSuivante() {
    const def = BO.TP[etat.mode];
    tpFaites.add(tpEtape);
    if (tpEtape < def.etapes.length - 1) tpEtape++;
    tpRendre();
    maintenant();
  }

  // outils donnés à chaque étape
  function apiEtape(g, d) {
    const surChange = f => { ecouteurs.add(f); ecouteursEtape.push(f); };
    const api = {
      g, d, fmt, fmtF, el, nom, cible,
      comps: () => etat.comps,
      trouver: f => etat.comps.find(f) || null,
      ajouter(c, x) { const n = ajouter(c, x); changer(); return n; },
      supprimer(c) { supprimer(c); changer(); },
      placer(c, x) { placer(c, x); changer(); },
      choisir(c) { etat.sel = c ? c.id : null; changer(); },
      changer,
      surChange,
      // une question (moteur commun assets/cours.js) ; fin() quand toutes ses parties sont faites
      question(zone, q, fin) {
        q.parties.forEach(reponseDefaut);
        const z = el('div', 'bo-q');
        zone.appendChild(z);
        COURS.question(z, q, { fin() { if (fin) fin(); } });
        defiler(z);
        return z;
      },
      // partie « manipulation » : réussie dès que test() est vrai sur le banc
      // o = { q, attente, test, ok(), montrer(), solution }
      manip(o) {
        return {
          type: 'perso', q: o.q, aide: true,
          get solution() { return o.solution || '<p>Montage réalisé : regarde le banc et les vues.</p>'; },
          monter(zone, apiP) {
            const p = el('p', 'bo-attente', '<span class="bo-pt" aria-hidden="true"></span>' + (o.attente || 'En attente de ta manipulation sur le banc…'));
            zone.appendChild(p);
            let fini = false;
            const verif = () => {
              if (fini || apiP.fini()) return;
              if (o.test()) { fini = true; ecouteurs.delete(verif); p.remove(); if (o.ok) o.ok(); apiP.reussi(o.note); }
            };
            surChange(verif);
            setTimeout(verif, 0);
            return { montrer() { fini = true; ecouteurs.delete(verif); p.remove(); if (o.montrer) o.montrer(); if (o.ok) o.ok(); changer(); } };
          },
        };
      },
      // bouton de fin d'étape
      continuer(zone, texte) {
        const def = BO.TP[etat.mode];
        const der = tpEtape === def.etapes.length - 1;
        const a = el('div', 'er-actions bo-suite');
        if (der) {
          a.innerHTML = '<button type="button" class="btn-secondary">↺ Recommencer le TP</button><button type="button" class="btn-primary">Banc libre →</button>';
          a.children[0].addEventListener('click', () => { montage(def); tpEtape = 0; tpFaites = new Set(); tpRendre(); maintenant(); });
          a.children[1].addEventListener('click', () => { tpFaites.add(tpEtape); choisirMode('libre', true); });
          tpFaites.add(tpEtape); tpRendreTete();
        } else {
          a.innerHTML = `<button type="button" class="btn-primary">${texte || 'Étape suivante →'}</button>`;
          a.children[0].addEventListener('click', () => { a.style.pointerEvents = 'none'; tpSuivante(); });
        }
        zone.appendChild(a);
        defiler(a);
      },
      // rayons de construction dessinés sur le banc pendant l'étape : f() → [{ pts: [[x, y]…], cls }], ou null
      traces(f) { etat.traces = f; changer(); },
      bloc(zone, html, cls) { const b = el('div', cls || 'bo-bloc', html); zone.appendChild(b); defiler(b); return b; },
    };
    return api;
  }
  // réponse écrite dans l'encadré « Réponse » quand la partie n'a pas de solution rédigée
  // (« Afficher la réponse » ne laisse jamais un encadré vide)
  function reponseDefaut(p) {
    if (Object.getOwnPropertyDescriptor(p, 'solution') || p.type === 'perso') return;
    const sans = h => String(h || '').replace(/<span class="calc-icone"[^>]*><\/span>/g, '').trim();
    Object.defineProperty(p, 'solution', {
      enumerable: true,
      get() {
        if (p.type === 'choix') {
          const bonnes = [].concat(p.bonne);
          return `<p>${p.options.filter(o => bonnes.includes(o.id)).map(o => o.label).join(' ; ')}</p>`;
        }
        if (p.type === 'nombre') {
          const dec = p.tol != null ? Math.max(0, Math.ceil(-Math.log10(2 * p.tol) - 1e-9)) : null;
          const v = dec == null ? COURS.fmt(+p.valeur.toPrecision(3)) : fmt(p.valeur, dec);
          return `<p>${p.label ? sans(p.label) + ' ' : ''}${v}${sans(p.unite) ? ' ' + sans(p.unite) : ''}</p>`;
        }
        return '';
      },
    });
  }

  // amener à l'écran ce qui vient d'apparaître dans le panneau (sans faire défiler la page)
  function defiler(e) {
    setTimeout(() => {
      const col = e.closest('.bo-tp-col');
      if (!col) return;
      const r = e.getBoundingClientRect(), rc = col.getBoundingClientRect();
      if (r.bottom > rc.bottom) col.scrollTop += r.bottom - rc.bottom + 8;
      else if (r.top < rc.top) col.scrollTop -= rc.top - r.top + 8;
    }, 90);
  }

  window.BO = {
    TP: {}, boite: BOITE, fmt, fmtF, nom, indice,
    demarrer, composants: () => etat.comps, ajouter: (c, x) => ajouter(c, x), supprimer, placer, changer,
    analyse: aJour, cible, etat,
  };
})();
