/* ============================================================
   Travail d'une force — le simulateur (un seul écran)
   À charger après tf.js et scenes.js.

   À gauche : le simulateur. En haut, les boutons des sections (ordre conseillé
   1 → 5, mais tout est accessible à tout moment) :
     1. Expression du travail : quatre personnages tirent le wagon en même temps
        (barres et travail de chacun), puis une seule personne : W proportionnel
        à F, à AB (mesures au lancer, graphique), puis à cos α (valeurs
        particulières, cercle trigonométrique, graphique aux axes choisis) ;
        choix de la formule ;
     2. Chemins : les quatre trajets d'energie-cinetique et un tracé libre ;
     3. Poids : piste de ski et deux chemins imaginaires (vertical puis
        horizontal, horizontal puis vertical) : W(P⃗) = m g h, signe de h ;
     4. Défis (et exercices de calcul avec diagnostics) ;
     5. Bilan ;
     Simulateur libre : une seule force, tous les réglages.
   La valeur du travail s'affiche en gros sous la barre « énergie transmise »,
   quand on lance le déplacement (la formule n'est pas affichée).
   À droite : les questions de la section, qui s'enchaînent et défilent.
   Angles toujours en degrés. Sections terminées mémorisées (localStorage).
   API de test : TF.S (état), TF.regler(objet, forcer), TF.ouvrir(id), TF.appliquer(cfg).
   ============================================================ */
(function () {
  'use strict';
  const TF = window.TF;
  const { fmt, joules, deg, cosd, nature, vec, NB } = TF;
  const G = 9.81;                                        // intensité de la pesanteur (N/kg)
  const reduit = TF.reduit();
  const borne = (v, a, b) => Math.max(a, Math.min(b, v));
  const W_ = n => `W<sub>AB</sub>(${vec(n)})`;
  const zA_ = '<i>z</i><sub>A</sub>', zB_ = '<i>z</i><sub>B</sub>';

  /* ---------- État ---------- */
  const S = {
    section: null, scene: 'wagon4',
    F: 10, AB: 1, alpha: 0, pos: 0,
    libres: { F: true, AB: true, alpha: true, m: true, zA: true, zB: true },
    alphaBornes: [-180, 180],
    ch: { trajet: 1, libre: null, trace: null, avance: 0, faits: {} },
    po: { m: 80, zA: 130, zB: 30, chemin: 'ski', avance: 0, faits: {} },
    arrive: false,                                       // le déplacement est terminé : W définitif
    dernier: null,                                       // dernier déplacement terminé
    series: { F: [], AB: [], alpha: [] },                // mesures des graphiques (section 1)
    lancers: [],                                         // simulateur libre : derniers lancers
  };
  TF.S = S;
  const Wforce = () => S.F * S.AB * cosd(S.alpha);
  const Wpoids = () => S.po.m * G * (S.po.zA - S.po.zB);
  const auLancer = [];                                   // fonctions appelées à la fin de chaque déplacement

  /* ---------- Sections ---------- */
  const SECTIONS = [
    { id: 'expression', n: 1, nom: 'Expression du travail' },
    { id: 'chemins', n: 2, nom: 'Chemins' },
    { id: 'poids', n: 3, nom: 'Poids' },
    { id: 'defis', n: 4, nom: 'Défis' },
    { id: 'bilan', n: 5, nom: 'Bilan' },
    { id: 'libre', nom: 'Simulateur libre' },
  ];
  const CLE = 'travail-force-sections';
  const FAITS = new Set();
  try { (JSON.parse(localStorage.getItem(CLE)) || []).forEach(x => FAITS.add(x)); } catch (e) { /* pas de stockage */ }
  function marquerFait(id) {
    FAITS.add(id);
    try { localStorage.setItem(CLE, JSON.stringify([...FAITS])); } catch (e) { /* pas de stockage */ }
    majNav();
  }
  const conseillee = () => (SECTIONS.find(s => s.n && !FAITS.has(s.id)) || {}).id;

  /* ---------- Écran ---------- */
  const zone = document.getElementById('tf-zone');
  zone.innerHTML = `<div class="tf-sim">
      <div class="er-card tf-scene">
        <nav class="tf-nav" aria-label="Sections du simulateur">${SECTIONS.map(s => `<button type="button" class="tf-nav-b" data-sec="${s.id}">
          <span class="tf-nav-n" aria-hidden="true">${s.n || '▶'}</span><span class="tf-nav-t">${s.nom}</span><span class="tf-nav-e" aria-hidden="true"></span></button>`).join('')}</nav>
        <div class="tf-fig" data-a="fig"></div>
        <div class="tf-mesure" data-a="mesure"></div>
        <div class="tf-bas" data-a="bas"></div>
        <div class="tf-msg" data-a="msg" aria-live="polite"></div>
      </div>
      <aside class="er-card tf-panneau" aria-label="Questions">
        <h2 class="tf-p-titre" data-a="titre"></h2>
        <div class="tf-p-corps" data-a="corps">${SECTIONS.map(s => `<section class="tf-sec" data-s="${s.id}" hidden></section>`).join('')}</div>
      </aside>
    </div>`;
  const $ = a => zone.querySelector(`[data-a="${a}"]`);
  const fig = $('fig'), bas = $('bas'), corps = $('corps');
  const secEl = id => zone.querySelector(`[data-s="${id}"]`);
  function message(h, type) {
    const m = $('msg');
    m.innerHTML = h ? `<div class="${type === 'refus' ? 'callout-danger' : 'callout-accent'} tf-msg-in">${h}</div>` : '';
  }
  function majNav() {
    const cons = conseillee();
    zone.querySelectorAll('[data-sec]').forEach(b => {
      const id = b.dataset.sec, s = SECTIONS.find(x => x.id === id);
      b.classList.toggle('fait', FAITS.has(id));
      b.classList.toggle('conseil', id === cons && id !== S.section);
      if (id === S.section) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current');
      b.querySelector('.tf-nav-e').textContent = FAITS.has(id) ? '✓' : '';
      b.setAttribute('aria-label', `${s.n ? s.n + '. ' : ''}${s.nom}${FAITS.has(id) ? ', terminée' : id === cons ? ', conseillée' : ''}`);
    });
  }

  /* ---------- Réglages de la scène pour une section ou une partie ----------
     cfg = { scene, valeurs (au premier affichage), fixe (toujours), libres ('tout' ou liste),
             alpha: [min, max] } */
  const TOUT = { scene: 'force', libres: 'tout' };
  const SEC = {};
  SECTIONS.forEach(s => { SEC[s.id] = { cfg: TOUT, construit: false }; });
  function poser(v) {
    if (!v) return;
    if (v.F != null) S.F = borne(Math.round(v.F), 0, 20);
    if (v.AB != null) S.AB = borne(Math.round(v.AB * 10) / 10, 0, 2);
    if (v.alpha != null) S.alpha = bornerAlpha(v.alpha);
    if (v.ch) Object.assign(S.ch, v.ch);
    if (v.po) {
      const av = clePoids();
      Object.assign(S.po, v.po);
      if (clePoids() !== av) S.po.faits = {};
    }
  }
  function appliquer(cfg, premiere) {
    arreter(true);
    S.scene = cfg.scene;
    Object.keys(S.libres).forEach(k => { S.libres[k] = cfg.libres === 'tout' || (cfg.libres || []).includes(k); });
    S.alphaBornes = cfg.alpha || [-180, 180];
    if (premiere) poser(cfg.valeurs);
    poser(cfg.fixe);
    S.alpha = bornerAlpha(S.alpha);
    message('');
    rendreBas();
    rendreMesure();
    rendre();
  }
  TF.appliquer = cfg => appliquer(cfg, true);
  // angle dans les bornes de la partie (0° à 180° pour le graphique W = f(α))
  function bornerAlpha(a) {
    a = TF.normal(Math.round(a));
    const [mi, ma] = S.alphaBornes;
    if (a >= mi && a <= ma) return a;
    if (mi === 0 && ma === 180) return a < -90 ? 180 : 0;
    return borne(a, mi, ma);
  }
  const clePoids = () => `${S.po.m}|${S.po.zA}|${S.po.zB}`;

  function ouvrir(id) {
    arreter(true);
    S.section = id;
    const s = SECTIONS.find(x => x.id === id);
    $('titre').textContent = (s.n ? s.n + '. ' : '') + s.nom;
    zone.querySelectorAll('[data-s]').forEach(x => { x.hidden = x.dataset.s !== id; });
    corps.scrollTop = 0;
    if (!SEC[id].construit) { SEC[id].construit = true; CONSTRUIRE[id](secEl(id)); }
    appliquer(SEC[id].cfg, false);
    if (id === 'bilan') marquerFait('bilan');
    majNav();
  }
  TF.ouvrir = ouvrir;

  /* ---------- Mesure : barre « énergie transmise » et valeur de W ---------- */
  const barre = id => `<span class="tf-jauge-barre"><span class="tf-jauge-rempli" data-a="${id}"></span><span class="tf-jauge-zero"></span></span>`;
  const QUI = { force: 'au wagon', chemins: 'à l\'objet', poids: 'au skieur' };
  function rendreMesure() {
    const m = $('mesure');
    if (S.scene === 'wagon4') {
      m.innerHTML = `<p class="tf-m-titre">Énergie transmise au wagon par chaque personnage</p><div class="tf-m4s">${TF.PERSOS4.map(p => `<div class="tf-m4"><span class="tf-m4-n">${vec('F')}<sub>${p.n}</sub></span>${barre('j' + p.n)}<b class="tf-m4-v" data-a="v${p.n}"></b></div>`).join('')}</div>`;
    } else {
      const t = S.scene === 'poids' ? 'Énergie transmise au skieur par son poids' : `Énergie transmise ${QUI[S.scene]}`;
      m.innerHTML = `<div class="tf-jauge"><span class="tf-jauge-t">${t}</span>${barre('j')}</div>
        <p class="tf-w" data-a="wl"><span class="tf-w-nom">${S.scene === 'poids' ? W_('P') : W_('F')} =</span> <b class="tf-w-v" data-a="wv"></b><span class="tf-w-nat" data-a="wnat"></span></p>`;
    }
    majMesure();
  }
  // travail déjà transmis, à l'endroit où en est le déplacement
  function partiel() {
    if (S.scene === 'force') return S.F * cosd(S.alpha) * S.pos;
    if (S.scene === 'chemins') { const pts = TF.cheminPts(S); return pts ? 10 * TF.surChemin(pts, S.ch.avance).x : 0; }
    if (S.scene === 'poids') return S.po.m * G * (S.po.zA - TF.surChemin(TF.pistePts(S), S.po.avance).y);
    return 0;
  }
  const enCours = () => (S.scene === 'chemins' ? S.ch.avance : S.scene === 'poids' ? S.po.avance : S.pos) > 0;
  function remplir(id, w, max) {
    const r = $(id);
    if (!r) return;
    const p = max ? Math.min(1, Math.abs(w) / max) * 50 : 0;
    r.style.width = p + '%';
    r.style.left = w < 0 ? (50 - p) + '%' : '50%';
    r.classList.toggle('neg', w < -1e-9);
  }
  function majMesure() {
    if (S.scene === 'wagon4') {
      TF.PERSOS4.forEach(p => { const w = 10 * cosd(p.a) * S.pos, v = $('v' + p.n); remplir('j' + p.n, w, 10); if (v) v.innerHTML = joules(w); });
      return;
    }
    const w = partiel(), max = S.scene === 'force' ? 40 : S.scene === 'chemins' ? 12.5 : S.po.m * G * 150;
    remplir('j', w, max);
    const v = $('wv'), n = $('wnat'), l = $('wl');
    if (!v) return;
    v.innerHTML = joules(w);
    l.classList.toggle('tf-w-attente', !enCours());
    const qui = QUI[S.scene], agent = S.scene === 'poids' ? 'le poids' : 'la force';
    n.innerHTML = !enCours() ? `${S.scene === 'chemins' ? 'choisis un trajet' : 'lance le ' + (S.scene === 'poids' ? 'skieur' : 'wagon')} pour mesurer le travail`
      : !S.arrive ? 'en route…'
      : w > 1e-9 ? `travail <b>moteur</b> : ${agent} a fourni ${joules(w)} d'énergie ${qui}`
      : w < -1e-9 ? `travail <b>résistant</b> : ${agent} a retiré ${joules(-w)} d'énergie ${qui}`
      : `travail <b>nul</b> : ${agent} n'a transmis aucune énergie ${qui}`;
  }

  /* ---------- Commandes sous la figure ---------- */
  const NOMS = { F: 'F', AB: 'AB', alpha: 'α', m: 'm', zA: zA_, zB: zB_ };
  const UNITES = { F: 'N', AB: 'm', alpha: '°', m: 'kg', zA: 'm', zB: 'm' };
  function reglage(id, min, max, pas) {
    const fixe = !S.libres[id];
    return `<label class="tf-reglage${fixe ? ' tf-fixe' : ''}"><span class="tf-reglage-l"><span>${NOMS[id]} (${UNITES[id]})</span><b data-v="${id}"></b></span>
      <input type="range" data-r="${id}" min="${min}" max="${max}" step="${pas}"${fixe ? ' disabled' : ''} aria-label="${NOMS[id].replace(/<[^>]+>/g, '')} en ${UNITES[id] === '°' ? 'degrés' : UNITES[id]}${fixe ? ' (fixé)' : ''}"></label>`;
  }
  const tourner = () => `<span class="tf-tourner" role="group" aria-label="Tourner la force">${[-15, -1, 1, 15].map(d => `<button type="button" class="btn-secondary" data-tour="${d}" aria-label="Tourner la force de ${d > 0 ? 'plus' : 'moins'} ${Math.abs(d)} degré${Math.abs(d) > 1 ? 's' : ''}">${d > 0 ? '+' : '−'}${Math.abs(d)}°</button>`).join('')}</span>`;
  const anim = () => `<span class="tf-anim"><button type="button" class="btn-primary tf-lire" data-act="lire">▶ Lancer</button><button type="button" class="btn-secondary" data-act="re" aria-label="Revenir au départ">↺</button></span>`;
  function rendreBas() {
    if (S.scene === 'force') {
      bas.innerHTML = `<div class="tf-reglages">${reglage('F', 0, 20, 1)}${reglage('AB', 0, 2, 0.1)}${reglage('alpha', S.alphaBornes[0], S.alphaBornes[1], 1)}</div>
        <div class="tf-ctrl">${S.libres.alpha ? tourner() : ''}${anim()}</div>`;
    } else if (S.scene === 'wagon4') {
      bas.innerHTML = `<div class="tf-ctrl">${anim()}</div>`;
    } else if (S.scene === 'chemins') {
      bas.innerHTML = `<div class="tf-ctrl"><span class="tf-seg" role="group" aria-label="Trajet de A à B">${TF.TRAJETS.map(t => `<button type="button" data-trajet="${t.n}">Trajet ${t.n}</button>`).join('')}<button type="button" data-trajet="libre">Tracé libre</button></span>${anim()}</div>`;
    } else {
      bas.innerHTML = `<div class="tf-ctrl"><span class="tf-seg" role="group" aria-label="Chemin du skieur">${TF.PISTES.map(p => `<button type="button" data-piste="${p.id}"><span class="tf-o-long">${p.nom}</span><span class="tf-o-court" aria-hidden="true">${p.court}</span></button>`).join('')}</span></div>
        <div class="tf-ctrl"><div class="tf-reglages">${reglage('m', 40, 120, 5)}${reglage('zA', 0, 150, 10)}${reglage('zB', 0, 150, 10)}</div>${anim()}</div>`;
    }
    majCurseurs();
  }
  function majCurseurs() {
    const val = { F: [S.F, S.F + NB + 'N'], AB: [S.AB, fmt(S.AB, 1) + NB + 'm'], alpha: [S.alpha, deg(S.alpha)], m: [S.po.m, S.po.m + NB + 'kg'], zA: [S.po.zA, S.po.zA + NB + 'm'], zB: [S.po.zB, S.po.zB + NB + 'm'] };
    bas.querySelectorAll('[data-r]').forEach(r => { const v = val[r.dataset.r]; if (v && document.activeElement !== r) r.value = v[0]; });
    bas.querySelectorAll('[data-v]').forEach(b => { const v = val[b.dataset.v]; if (v) b.textContent = v[1] + (S.libres[b.dataset.v] ? '' : ' (fixé)'); });
    bas.querySelectorAll('[data-trajet]').forEach(b => { b.setAttribute('aria-pressed', String(String(S.ch.trajet) === b.dataset.trajet)); b.classList.toggle('fait', S.ch.faits[b.dataset.trajet] != null); });
    bas.querySelectorAll('[data-piste]').forEach(b => { b.setAttribute('aria-pressed', String(S.po.chemin === b.dataset.piste)); b.classList.toggle('fait', S.po.faits[b.dataset.piste] != null); });
    majBoutonLire();
  }

  /* ---------- Changements d'état (curseurs, poignées) ---------- */
  function regler(n, forcer) {
    const ok = k => forcer || S.libres[k];
    if (n.F != null && ok('F')) S.F = borne(Math.round(n.F), 0, 20);
    if (n.AB != null && ok('AB')) S.AB = borne(Math.round(n.AB * 10) / 10, 0, 2);
    if (n.alpha != null && ok('alpha')) S.alpha = bornerAlpha(n.alpha);
    if (n.po) {
      const av = clePoids();
      if (n.po.m != null && ok('m')) S.po.m = borne(Math.round(n.po.m / 5) * 5, 40, 120);
      if (n.po.zA != null && ok('zA')) S.po.zA = borne(Math.round(n.po.zA / 10) * 10, 0, 150);
      if (n.po.zB != null && ok('zB')) S.po.zB = borne(Math.round(n.po.zB / 10) * 10, 0, 150);
      if (n.po.chemin) S.po.chemin = n.po.chemin;
      if (clePoids() !== av) S.po.faits = {};                 // nouveaux réglages : les chemins sont à refaire
    }
    if (n.ch && n.ch.trajet) S.ch.trajet = n.ch.trajet;
    arreter(true);
    message('');
    majCurseurs();
    rendre();
  }
  TF.regler = regler;

  /* ---------- Animation du déplacement ---------- */
  const A = { joue: false, u: 0, raf: 0, t: 0 };
  function longueur() {
    if (S.scene === 'force') return S.AB;
    if (S.scene === 'wagon4') return 1;
    const pts = S.scene === 'chemins' ? TF.cheminPts(S) : TF.pistePts(S);
    return pts ? TF.longueur(pts) : 0;
  }
  // position pour la fraction u du temps (le wagon accélère ou ralentit selon W)
  function placer() {
    if (S.scene === 'force') {
      const max = S.F * S.AB, k = max ? 0.45 * Wforce() / max : 0;
      S.pos = S.AB * ((1 - k) * A.u + k * A.u * A.u);
    } else if (S.scene === 'wagon4') S.pos = A.u;
    else if (S.scene === 'chemins') S.ch.avance = longueur() * A.u;
    else S.po.avance = longueur() * A.u;
  }
  function arreter(remettre) {
    if (A.raf) cancelAnimationFrame(A.raf);
    A.raf = 0; A.joue = false;
    if (remettre) { A.u = 0; S.pos = 0; S.ch.avance = 0; S.po.avance = 0; S.arrive = false; }
    majBoutonLire();
  }
  function majBoutonLire() {
    const b = bas.querySelector('[data-act="lire"]');
    if (b) b.textContent = A.joue ? '❚❚ Pause' : A.u > 0 && A.u < 1 ? '▶ Reprendre' : '▶ Lancer';
  }
  function possible() {
    if (S.scene === 'force' && S.AB <= 0) { message('Écarte B de A pour que le wagon se déplace.', 'refus'); return false; }
    if (S.scene === 'chemins' && !TF.cheminPts(S)) { message('Trace d\'abord ton chemin de A à B sur la figure.', 'refus'); return false; }
    return true;
  }
  function lire() {
    if (A.joue) { arreter(); return; }
    if (!possible()) return;
    if (A.u >= 1) { A.u = 0; S.arrive = false; }
    message('');
    if (reduit) { A.u = 1; placer(); rendre(); finir(); return; }   // mouvement réduit : arrivée directe
    A.joue = true; A.t = performance.now();
    majBoutonLire();
    const L = longueur();
    const duree = S.scene === 'force' ? 1.2 + 0.8 * S.AB : S.scene === 'wagon4' ? 2.2 : S.scene === 'chemins' ? 1 + L / 0.6 : 4;
    const boucle = now => {
      const dt = Math.min(0.1, (now - A.t) / 1000); A.t = now;
      A.u = Math.min(1, A.u + dt / duree);
      placer(); dessiner(); majMesure();
      if (A.u >= 1) { A.raf = 0; A.joue = false; finir(); return; }
      A.raf = requestAnimationFrame(boucle);
    };
    A.raf = requestAnimationFrame(boucle);
  }
  // fin du déplacement : W définitif, mémorisé pour les questions et les défis
  function finir() {
    S.arrive = true;
    const d = { scene: S.scene, section: S.section };
    if (S.scene === 'force') Object.assign(d, { F: S.F, AB: S.AB, alpha: S.alpha, W: Wforce() });
    else if (S.scene === 'wagon4') d.W = TF.PERSOS4.map(p => 10 * cosd(p.a));
    else if (S.scene === 'chemins') { d.trajet = S.ch.trajet; d.W = 10; S.ch.faits[S.ch.trajet] = 10; }
    else { Object.assign(d, { chemin: S.po.chemin, m: S.po.m, zA: S.po.zA, zB: S.po.zB, W: Wpoids() }); S.po.faits[S.po.chemin] = d.W; }
    S.dernier = d;
    if (S.section === 'expression' && S.scene === 'force') noterSerie(d);
    if (S.scene === 'force' && S.section === 'libre') { S.lancers.unshift(d); S.lancers = S.lancers.slice(0, 6); majLancers(); }
    majCurseurs();
    rendre();
    auLancer.forEach(f => f(d));
    verifierDefis(d);
  }
  // mesure rangée dans la série du graphique de la partie en cours (un seul réglage libre)
  function noterSerie(d) {
    const k = ['F', 'AB', 'alpha'].filter(x => S.libres[x]);
    if (k.length !== 1) return;
    const x = d[k[0]], s = S.series[k[0]], i = s.findIndex(p => p[0] === x);
    if (i >= 0) s[i] = [x, d.W]; else s.push([x, d.W]);
    s.sort((a, b) => a[0] - b[0]);
  }

  /* ---------- Dessin de la figure ---------- */
  let taille = [0, 0], geo = null;
  function dessiner() {
    const W = Math.round(fig.clientWidth), H = Math.round(fig.clientHeight);
    if (!W || !H) return;
    taille = [W, H];
    const r = S.scene === 'chemins' ? TF.dessinChemins(S, W, H) : S.scene === 'poids' ? TF.dessinPoids(S, W, H) : TF.dessinWagon(S, W, H);
    fig.innerHTML = r.svg;
    geo = r.geo;
    fig.classList.toggle('tf-dessin', S.scene === 'chemins' && S.ch.trajet === 'libre');
  }
  function rendre() { dessiner(); majMesure(); majCurseurs(); }

  /* ---------- Événements : commandes ---------- */
  bas.addEventListener('input', e => {
    const r = e.target.closest('[data-r]');
    if (!r) return;
    const v = +r.value, k = r.dataset.r;
    if (k === 'F' || k === 'AB' || k === 'alpha') regler({ [k]: v });
    else regler({ po: { [k]: v } });
  });
  bas.addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.tour) regler({ alpha: S.alpha + +b.dataset.tour, F: S.F || 10 });
    else if (b.dataset.trajet) {
      const t = b.dataset.trajet === 'libre' ? 'libre' : +b.dataset.trajet;
      if (t === 'libre') { S.ch.libre = null; S.ch.trace = null; }
      regler({ ch: { trajet: t } });
      if (t !== 'libre') lire();                         // un trajet choisi est parcouru tout de suite
    } else if (b.dataset.piste) { regler({ po: { chemin: b.dataset.piste } }); lire(); }
    else if (b.dataset.act === 'lire') lire();
    else if (b.dataset.act === 're') { arreter(true); message(''); rendre(); }
  });
  zone.querySelector('.tf-nav').addEventListener('click', e => { const b = e.target.closest('[data-sec]'); if (b) ouvrir(b.dataset.sec); });
  corps.addEventListener('click', e => { const b = e.target.closest('[data-aller]'); if (b) ouvrir(b.dataset.aller); });

  /* ---------- Événements : figure (glisser la force, B, A ; tracé libre) ---------- */
  let prise = null;
  const point = e => { const r = fig.querySelector('svg').getBoundingClientRect(); return [(e.clientX - r.left) * taille[0] / r.width, (e.clientY - r.top) * taille[1] / r.height]; };
  // angle « aimanté » : attiré par les angles remarquables à moins de 3°
  const REMARQUABLES = [0, 30, 45, 60, 90, 120, 135, 150, 180, -30, -45, -60, -90, -120, -135, -150, -180];
  const aimanter = a => { const m = REMARQUABLES.find(x => Math.abs(a - x) <= 3); return m != null ? m : Math.round(a); };
  fig.addEventListener('pointerdown', e => {
    if (!geo || A.joue) return;
    const cible = e.target.closest && e.target.closest('[data-p]');
    const [px, py] = point(e);
    if (cible) { e.preventDefault(); prise = cible.dataset.p; fig.setPointerCapture(e.pointerId); fig.classList.add('glisse'); return; }
    // tracé libre : on part de A
    if (S.scene === 'chemins' && S.ch.trajet === 'libre') {
      if (Math.hypot(px - geo.X(0), py - geo.Y(0)) > 34) { message('Pose le doigt (ou la souris) sur le point A pour commencer le tracé.', 'refus'); return; }
      e.preventDefault();
      arreter(true);
      prise = 'trace';
      S.ch.libre = null; S.ch.trace = [[0, 0]];
      fig.setPointerCapture(e.pointerId);
      message('');
      rendre();
    }
  });
  fig.addEventListener('pointermove', e => {
    if (!prise || !geo) return;
    const [px, py] = point(e);
    if (prise === 'fleche') {
      const a = aimanter(Math.atan2(geo.oy - py, px - geo.ox) * 180 / Math.PI);
      if (bornerAlpha(a) !== S.alpha) regler({ alpha: a });
    } else if (prise === 'B' && S.scene === 'force') {
      const AB = borne(Math.round((px - geo.xA) / geo.ppm * 10) / 10, 0, 2);
      if (AB !== S.AB) regler({ AB });
    } else if (prise === 'A' || prise === 'B') {
      const z = borne(Math.round(geo.Zi(py) / 10) * 10, 0, 150), k = prise === 'A' ? 'zA' : 'zB';
      if (z !== S.po[k]) regler({ po: { [k]: z } });
    } else if (prise === 'trace') {
      const d = S.ch.trace[S.ch.trace.length - 1], [x0, x1, y0, y1] = TF.BORNES_CH;
      const q = [borne(geo.Xi(px), x0, x1), borne(geo.Yi(py), y0, y1)];
      if (Math.hypot(geo.X(q[0]) - geo.X(d[0]), geo.Y(q[1]) - geo.Y(d[1])) >= 8) { S.ch.trace.push(q); dessiner(); }
    }
  });
  const lacher = () => {
    if (prise === 'trace') {
      const t = S.ch.trace, d = t[t.length - 1];
      prise = null;
      if (Math.hypot(geo.X(d[0]) - geo.X(1), geo.Y(d[1]) - geo.Y(0)) <= 34 && t.length >= 3) {
        t[t.length - 1] = [1, 0];
        S.ch.libre = t; S.ch.trace = null;
        rendre();
        lire();                                          // le chemin tracé est parcouru tout de suite
      } else { message('Termine ton tracé sur le point B (recommence en partant de A).', 'refus'); rendre(); }
      return;
    }
    prise = null;
    fig.classList.remove('glisse');
  };
  fig.addEventListener('pointerup', lacher);
  fig.addEventListener('pointercancel', lacher);
  const suivre = () => { const W = Math.round(fig.clientWidth), H = Math.round(fig.clientHeight); if (W && H && (W !== taille[0] || H !== taille[1])) dessiner(); };
  if (window.ResizeObserver) new ResizeObserver(suivre).observe(fig); else addEventListener('resize', suivre);

  /* ============================================================
     OUTILS DES QUESTIONS
     ============================================================ */
  const prochain = (v, x, t) => Math.abs(v - x) <= Math.abs(x) * (t || 0.01) + 1e-9;
  // suite de questions d'une section, avec les réglages de la scène pour chaque partie
  function lancerSuite(id, z, parties, fin) {
    const d = TF.el('div', 'tf-suite');
    z.appendChild(d);
    TF.suite(d, parties, {
      defile: corps,
      surPartie: p => { if (p.scene) { SEC[id].cfg = p.scene; if (S.section === id) appliquer(p.scene, true); } },
      fin: () => {
        marquerFait(id);
        const n = conseillee(), s = SECTIONS.find(x => x.id === n);
        const f = TF.el('div', 'tf-partie');
        f.innerHTML = `<div class="callout-success tf-msg-in tf-fin"><p><b>Section terminée ✓</b>${fin ? ' ' + fin : ''}</p>${s ? `<button type="button" class="btn-primary" data-aller="${s.id}">Suite conseillée${NB}: ${s.n}. ${s.nom} →</button>` : ''}</div>`;
        d.appendChild(f);
        TF.amener(f);
      },
    });
  }
  // partie « manipulation » : se valide toute seule à la fin d'un déplacement
  function partieManip(o) {
    return { type: 'perso', scene: o.scene, enonce: o.enonce, monter(z, api) {
      if (o.html) z.innerHTML = o.html;
      const maj = () => { if (o.maj) o.maj(z); if (!api.fait() && o.ok()) api.reussi(typeof o.conclu === 'function' ? o.conclu() : o.conclu); };
      auLancer.push(d => { if (!api.fait() && d.section === o.section) maj(); });
      maj();
    } };
  }
  const calcIcone = '<span class="calc-icone" role="img" aria-label="À calculer à la calculatrice" title="À calculer à la calculatrice"></span>';
  // diagnostics d'un calcul de W = F × AB × cos α
  function diagW(v, F, AB, a) {
    const w = F * AB * cosd(a), proche = (x, y) => Math.abs(x - y) <= Math.max(0.02, Math.abs(y) * 0.01);
    if (a !== 0 && proche(v, F * AB)) return 'Tu as oublié cos α : W = F × AB × cos α, pas F × AB.';
    if (!proche(w, F * AB * Math.cos(a)) && proche(v, F * AB * Math.cos(a))) return `${fmt(Math.cos(a), 2)} au lieu de ${fmt(cosd(a), 2)} pour cos α : ta calculatrice est en <b>radians</b>, passe-la en <b>degrés</b>.`;
    if (Math.abs(a) !== 90 && proche(v, F * AB * Math.abs(Math.sin(TF.rad(a))))) return 'Tu as pris l\'angle par rapport à la verticale (ou sin α) : α est l\'angle entre la force et le déplacement, et on prend cos α.';
    if (w !== 0 && proche(v, -w)) return `Le signe : ${Math.abs(a) < 90 ? 'α < 90°, cos α > 0 : le travail est moteur, positif' : 'α > 90°, cos α < 0 : le travail est résistant, négatif'}.`;
    return `Écris W = F × AB × cos α, puis remplace : ${fmt(F)} × ${fmt(AB, AB < 10 ? 1 : 0)} × cos ${deg(a)}.`;
  }

  /* ============================================================
     1. EXPRESSION DU TRAVAIL
     ============================================================ */
  const REP = {
    c: '« C\'est moi le plus efficace ! »', d: '« Je fais ce que je peux ! »',
    a: '« Je résisterai ! »', b: '« Je ne sers à rien. »',
  };
  const F_ = n => `${vec('F')}<sub>${n}</sub>`;
  // graphiques des séries F, AB et α (mesures faites en lançant le wagon)
  const SERIES = {
    F: { x: 'F', g: { xMin: 0, xMax: 20, xPas: 5, xNom: 'F (N)', yMax: 20 }, n: 4, aria: 'W en fonction de F',
      reste: n => `${n} mesure${n > 1 ? 's' : ''} avec des valeurs de F différentes (il en faut au moins 4).` },
    AB: { x: 'AB', g: { xMin: 0, xMax: 2, xPas: 0.5, xNom: 'AB (m)', yMax: 20, dec: 1 }, n: 4, aria: 'W en fonction de AB',
      reste: n => `${n} mesure${n > 1 ? 's' : ''} avec des valeurs de AB différentes (il en faut au moins 4).` },
    alpha: { x: 'α', g: { xMin: 0, xMax: 180, xPas: 30, xNom: 'α (°)', yMax: 10, neg: true }, aria: 'W en fonction de α',
      reste: n => `${n} mesure${n > 1 ? 's' : ''} : il en faut au moins 6, avec un angle proche de 0°, un proche de 90° et un proche de 180°.` },
  };
  const serieOk = k => {
    const p = S.series[k].filter(q => q[0] > 0 || k === 'alpha');
    if (k !== 'alpha') return p.length >= 4;
    return p.length >= 6 && p.some(q => q[0] <= 10) && p.some(q => q[0] >= 80 && q[0] <= 100) && p.some(q => q[0] >= 170);
  };
  function partieSerie(k, scene, enonce, conclu) {
    const D = SERIES[k];
    return partieManip({ section: 'expression', scene, enonce,
      html: `<svg class="tf-graphe" data-g role="img"></svg><p class="tf-petit" data-n></p>`,
      maj: z => { TF.graphe(z.querySelector('[data-g]'), Object.assign({ pts: S.series[k], aria: D.aria }, D.g)); z.querySelector('[data-n]').innerHTML = serieOk(k) ? '' : D.reste(S.series[k].filter(q => q[0] > 0 || k === 'alpha').length); },
      ok: () => serieOk(k), conclu });
  }
  // valeurs particulières de α et cercle trigonométrique
  const PART = [0, 60, 90, 120, 180];
  const mesureA = a => { const p = S.series.alpha.find(q => q[0] === a); return p ? p[1] : null; };
  const rapport = w => fmt(w / 10, 2).replace(/,?0+$/, '').replace(/^−?0$/, '0');
  function tableParticuliers() {
    return `<div class="tf-defile"><table class="tf-tab tf-part"><tbody>
      <tr><th>α</th>${PART.map(a => `<td>${a}°</td>`).join('')}</tr>
      <tr><th>W (J)</th>${PART.map(a => { const w = mesureA(a); return `<td>${w == null ? '…' : fmt(w, 1).replace(/,0$/, '')}</td>`; }).join('')}</tr>
      <tr><th>W${NB}/${NB}(F${NB}×${NB}AB)</th>${PART.map(a => { const w = mesureA(a); return `<td class="tf-case-w">${w == null ? '…' : rapport(w)}</td>`; }).join('')}</tr></tbody></table></div>`;
  }
  function cercleTrigo() {
    const cx = 128, cy = 104, R = 80, f = v => v.toFixed(1);
    let g = `<circle cx="${cx}" cy="${cy}" r="${R}" class="tf-ct-cercle"/>`;
    g += `<line x1="${cx - R - 22}" y1="${cy}" x2="${cx + R + 30}" y2="${cy}" class="tf-axe"/><path d="M${cx + R + 34},${cy} l-8,-4 v8 Z" class="tf-axe-p"/>`;
    g += `<line x1="${cx}" y1="${cy + R + 14}" x2="${cx}" y2="${cy - R - 18}" class="tf-axe"/><path d="M${cx},${cy - R - 22} l-4,8 h8 Z" class="tf-axe-p"/>`;
    g += `<text x="${cx + R + 34}" y="${cy + 18}" text-anchor="end" class="tf-ct-axe">cos α</text><text x="${cx - 8}" y="${cy - R - 12}" text-anchor="end" class="tf-ct-axe">sin α</text>`;
    [-1, -0.5, 0.5, 1].forEach(v => {
      g += `<line x1="${f(cx + v * R)}" y1="${cy - 3}" x2="${f(cx + v * R)}" y2="${cy + 3}" class="tf-axe"/><text x="${f(cx + v * R)}" y="${cy + 15}" text-anchor="middle" class="tf-grad">${fmt(v, v % 1 ? 1 : 0)}</text>`;
      g += `<line x1="${cx - 3}" y1="${f(cy - v * R)}" x2="${cx + 3}" y2="${f(cy - v * R)}" class="tf-axe"/><text x="${cx - 6}" y="${f(cy - v * R + 4)}" text-anchor="end" class="tf-grad">${fmt(v, v % 1 ? 1 : 0)}</text>`;
    });
    PART.forEach(a => {
      const x = cx + R * cosd(a), y = cy - R * TF.sind(a);
      if (a % 180) g += `<line x1="${f(x)}" y1="${f(y)}" x2="${f(x)}" y2="${cy}" class="tf-ct-proj"/><line x1="${f(x)}" y1="${f(y)}" x2="${cx}" y2="${f(y)}" class="tf-ct-proj"/>`;
      g += `<line x1="${cx}" y1="${cy}" x2="${f(x)}" y2="${f(y)}" class="tf-ct-rayon"/><circle cx="${f(x)}" cy="${f(y)}" r="4.5" class="tf-pt"/>`;
      const lx = cx + (R + 15) * cosd(a), ly = cy - (R + 13) * TF.sind(a);
      g += `<text x="${f(lx + (a === 0 ? 4 : a === 180 ? -4 : a === 90 ? 16 : 0))}" y="${f(ly + (a % 180 ? 4 : -7))}" text-anchor="${a === 0 ? 'start' : a === 180 ? 'end' : 'middle'}" class="tf-ct-a">${a}°</text>`;
    });
    return `<svg viewBox="0 0 260 206" class="tf-cercle" role="img" aria-label="Cercle trigonométrique : points pour 0°, 60°, 90°, 120° et 180° ; cos α se lit sur l'axe horizontal, sin α sur l'axe vertical">${g}</svg>`;
  }
  const FONCTIONS = {
    a: { nom: 'α (°)', f: a => a, g: { xMin: 0, xMax: 180, xPas: 30 } },
    cos: { nom: 'cos α', f: a => cosd(a), g: { xMin: -1, xMax: 1, xPas: 0.5, dec: 1 } },
    sin: { nom: 'sin α', f: a => TF.sind(a), g: { xMin: -1, xMax: 1, xPas: 0.5, dec: 1 } },
    cos2: { nom: 'cos² α', f: a => cosd(a) * cosd(a), g: { xMin: -1, xMax: 1, xPas: 0.5, dec: 1 } },
    lin: { nom: '1 − α / 90°', f: a => 1 - a / 90, g: { xMin: -1, xMax: 1, xPas: 0.5, dec: 1 } },
  };
  function partieAxes() {
    return { type: 'perso', enonce: '<p><b>Vérifie avec un graphique.</b> Choisis la grandeur en abscisse : cherche celle qui donne une <b>droite qui passe par l\'origine</b> (proportionnalité). Les points sont toutes tes mesures.</p>',
      monter(z, api) {
        z.innerHTML = `<label class="tf-axes">Abscisse${NB}: <select class="tf-trou" data-a="axeX">${Object.keys(FONCTIONS).map(k => `<option value="${k}">${FONCTIONS[k].nom}</option>`).join('')}</select> ; ordonnée${NB}: W (J)</label>
          <svg class="tf-graphe" data-g role="img"></svg>
          <div class="tf-q-actions"><button type="button" class="btn-primary" data-ok>C'est une droite qui passe par l'origine</button></div><div data-r aria-live="polite"></div>`;
        const s = z.querySelector('select'), svg = z.querySelector('[data-g]'), r = z.querySelector('[data-r]');
        let err = 0;
        const tracer = () => {
          const F = FONCTIONS[s.value];
          TF.graphe(svg, Object.assign({ pts: S.series.alpha.map(p => [F.f(p[0]), p[1]]), xNom: F.nom, yMax: 10, neg: true, aria: `W en fonction de ${F.nom}`, droite: api.fait() && s.value === 'cos' ? 10 : null }, F.g));
          if (!api.fait()) r.innerHTML = '';
        };
        s.onchange = tracer;
        tracer();
        z.querySelector('[data-ok]').onclick = () => {
          if (api.fait()) return;
          if (s.value === 'cos') {
            s.disabled = true; z.querySelector('[data-ok]').disabled = true; r.innerHTML = '';
            api.reussi(`Avec cos α en abscisse, les points sont sur une droite qui passe par l'origine : <b>W est proportionnel à cos α</b>. Ici, le coefficient directeur vaut F × AB = 10 × 1 = 10 J.`);
            tracer();
            return;
          }
          err++;
          const diag = { a: 'C\'est le graphique précédent : W n\'est pas proportionnel à α.', sin: 'Pour sin α = 0, il y a deux points (0° et 180°) : W = 10 J et W = −10 J. Ce n\'est pas une droite.',
            cos2: 'cos² α est toujours positif : les points de 0° et de 180° (W = 10 J et W = −10 J) sont à la même abscisse.', lin: 'Les points forment une courbe en S, pas une droite : regarde les points de 60° et de 120°.' }[s.value];
          r.innerHTML = `<div class="callout-danger tf-msg-in"><b>Ce n'est pas ça.</b> ${diag}${err >= 2 ? ' Essaie la fonction que tu as choisie avec le cercle.' : ''}</div>`;
          TF.amener(r);
        };
      } };
  }
  const SC_F = { scene: 'force', valeurs: { F: 5 }, fixe: { AB: 1, alpha: 0 }, libres: ['F'] };
  const SC_AB = { scene: 'force', valeurs: { AB: 0.5 }, fixe: { F: 10, alpha: 0 }, libres: ['AB'] };
  const SC_A = { scene: 'force', valeurs: { alpha: 0 }, fixe: { F: 10, AB: 1 }, libres: ['alpha'], alpha: [0, 180] };
  const PARTIES_EXPRESSION = [
    { type: 'grille', liste: true, scene: { scene: 'wagon4' },
      enonce: '<p>Le wagon roule sur des rails, de <b>A</b> vers <b>B</b> ; il ne peut pas quitter les rails. Quatre personnages le tirent en même temps, avec des forces de <b>même valeur</b> (10 N), dans des directions différentes. Le dessin est vu de dessus.</p><p><b>Que dit chaque personnage ?</b></p>',
      options: Object.keys(REP).map(k => [k, REP[k]]),
      lignes: [
        { label: `Personnage 1 (${F_(1)})`, bonne: 'c', indice: `${F_(1)} tire exactement dans le <b>sens du déplacement</b>.` },
        { label: `Personnage 2 (${F_(2)})`, bonne: 'd', indice: `${F_(2)} tire <b>en biais</b>, un peu vers l'avant.` },
        { label: `Personnage 3 (${F_(3)})`, bonne: 'a', indice: `${F_(3)} tire vers l'<b>arrière</b> : il s'oppose au déplacement.` },
        { label: `Personnage 4 (${F_(4)})`, bonne: 'b', indice: `${F_(4)} tire <b>perpendiculairement</b> aux rails, or le wagon ne peut pas aller sur le côté.` },
      ],
      solution: `${F_(1)} : ${REP.c} ${F_(2)} : ${REP.d} ${F_(3)} : ${REP.a} ${F_(4)} : ${REP.b}` },
    partieManip({ section: 'expression', enonce: '<p><b>Lance le wagon</b> (bouton ▶ Lancer, sous la figure). Pendant le déplacement de A à B, chaque barre montre l\'<b>énergie</b> que le personnage transmet au wagon.</p>',
      ok: () => S.dernier && S.dernier.scene === 'wagon4',
      conclu: `L'énergie transmise par une force au cours d'un déplacement s'appelle le <b>travail</b> de la force, noté W. <b>Travail = énergie transmise.</b>` }),
    { type: 'choix', enonce: '<p>Le travail est une <b>énergie</b>. Quelle est son unité (lis les barres) ?</p>',
      options: [['J', 'le joule (J)'], ['N', 'le newton (N)'], ['W', 'le watt (W)'], ['m', 'le mètre (m)']], bonne: 'J',
      indices: { N: 'Le newton est l\'unité des <b>forces</b>. Le travail est une <b>énergie</b>.', W: 'Le watt est l\'unité des <b>puissances</b> (attention : le travail se note W, mais ce n\'est pas son unité).', m: 'Le mètre est l\'unité des longueurs. Le travail est une <b>énergie</b>.' },
      solution: '<b>Travail = énergie = joules (J)</b>, comme toutes les énergies.' },
    { type: 'grille', enonce: '<p>Un travail est <b>moteur</b> si la force <b>fournit</b> de l\'énergie au wagon (W > 0), <b>résistant</b> si elle lui en <b>retire</b> (W < 0), <b>nul</b> si W = 0. Choisis pour chaque personnage.</p>',
      options: [['m', 'moteur'], ['r', 'résistant'], ['n', 'nul']],
      lignes: [
        { label: `${F_(1)} <span class="tf-gl-d">tire dans le sens du déplacement</span>`, bonne: 'm', indice: 'Il aide le wagon à avancer : il lui fournit de l\'énergie (W > 0).' },
        { label: `${F_(2)} <span class="tf-gl-d">tire en biais, vers l'avant</span>`, bonne: 'm', indice: `${F_(2)} tire un peu vers l'avant : une partie de son effort fait avancer le wagon (W > 0).` },
        { label: `${F_(3)} <span class="tf-gl-d">tire vers l'arrière</span>`, bonne: 'r', indice: `${F_(3)} tire à l'opposé du déplacement : il freine le wagon, il lui retire de l'énergie (W < 0).` },
        { label: `${F_(4)} <span class="tf-gl-d">tire perpendiculairement aux rails</span>`, bonne: 'n', indice: `${F_(4)} tire sur le côté : sa force ne fait ni avancer ni reculer le wagon (W = 0).` },
      ],
      solution: 'Une force qui aide le déplacement a un travail <b>moteur</b> (W > 0) ; une force qui s\'y oppose, un travail <b>résistant</b> (W < 0) ; une force perpendiculaire au déplacement, un travail <b>nul</b>.' },
    { type: 'choix', enonce: '<p>Les quatre forces ont la même valeur. Quel personnage transmet le <b>plus d\'énergie</b> au wagon (le plus grand travail) ?</p>',
      options: [1, 2, 3, 4].map(n => [n, `Personnage ${n}`]), bonne: 1,
      indices: { 2: `${F_(2)} tire en biais : seule une partie de sa force sert à faire avancer le wagon.`, 3: `${F_(3)} freine le wagon : son travail est résistant.`, 4: `${F_(4)} ne sert à rien : son travail est nul.` },
      solution: `${F_(1)} tire exactement dans le sens du déplacement : toute sa force sert à faire avancer le wagon. Son travail est le plus grand.` },
    { type: 'texte', html: '<div class="callout-accent tf-msg-in">Le travail dépend de la <b>direction</b> de la force par rapport au déplacement (l\'angle α). Dépend-il aussi de la <b>valeur F</b> de la force et de la <b>longueur AB</b> du déplacement ? Une seule personne tire maintenant le wagon : à toi de mesurer.</div>' },
    partieSerie('F', SC_F, '<p><b>W et la valeur F de la force.</b> AB = 1,0 m et α = 0° restent fixés. Règle F (curseur), puis <b>lance le wagon</b> : le point (F ; W) se place sur le graphique. Recommence avec d\'autres valeurs de F.</p>'),
    { type: 'choix', enonce: '<p>Que montre le graphique W = f(F) ?</p>',
      options: [['prop', 'Les points sont sur une droite qui passe par l\'origine : W est proportionnel à F'], ['aug', 'W augmente avec F, mais n\'est pas proportionnel à F'], ['non', 'W ne dépend pas de F']], bonne: 'prop',
      indices: { aug: 'Regarde bien : les points sont alignés avec l\'origine (F = 0, W = 0). C\'est la définition de la proportionnalité.', non: 'W change quand F change : regarde les points.' },
      solution: 'Quand F double, W double : <b>W est proportionnel à F</b>.' },
    partieSerie('AB', SC_AB, '<p><b>W et la longueur AB du déplacement.</b> F = 10 N et α = 0° restent fixés. Règle AB (curseur, ou fais glisser le point B), puis <b>lance le wagon</b>. Recommence avec d\'autres valeurs de AB.</p>'),
    { type: 'choix', enonce: '<p>Que montre le graphique W = f(AB) ?</p>',
      options: [['prop', 'Les points sont sur une droite qui passe par l\'origine : W est proportionnel à AB'], ['inv', 'W diminue quand AB augmente'], ['non', 'W ne dépend pas de AB']], bonne: 'prop',
      indices: { inv: 'Regarde le graphique : W augmente avec AB.', non: 'W change quand AB change : regarde les points.' },
      solution: 'Quand AB double, W double : <b>W est proportionnel à AB</b>.' },
    partieSerie('alpha', SC_A, '<p><b>W et l\'angle α.</b> F = 10 N et AB = 1,0 m restent fixés. Règle α entre 0° et 180° (curseur, boutons ±, ou fais tourner la flèche), puis <b>lance le wagon</b>. Fais au moins 6 mesures.</p>'),
    { type: 'choix', enonce: '<p>W est-il proportionnel à α ?</p>',
      options: [['non', 'Non : les points ne sont pas sur une droite qui passe par l\'origine'], ['oui', 'Oui : W change quand α change']], bonne: 'non',
      indices: { oui: 'W change avec α, mais cela ne suffit pas : pour α = 0°, W n\'est pas nul, et W diminue quand α augmente. Les points ne sont pas sur une droite qui passe par l\'origine.' },
      solution: 'W est <b>maximal pour α = 0°</b>, <b>nul pour 90°</b>, <b>négatif et minimal pour 180°</b> : W n\'est pas proportionnel à α.' },
    partieManip({ section: 'expression', enonce: '<p><b>Quelques valeurs particulières.</b> Règle α sur chacune des valeurs du tableau et lance le wagon : la case se remplit (les mesures déjà faites y sont déjà). Ici, F × AB = 10 × 1 = 10 J.</p>',
      html: '<div data-t></div>', maj: z => { z.querySelector('[data-t]').innerHTML = tableParticuliers(); },
      ok: () => PART.every(a => mesureA(a) != null) }),
    () => ({ type: 'choix', enonce: `<p>Compare la dernière ligne du tableau avec le <b>cercle trigonométrique</b> : cos α se lit sur l'axe horizontal, sin α sur l'axe vertical.</p>${tableParticuliers()}${cercleTrigo()}<p>Quelle fonction de α prend les <b>mêmes valeurs</b> que W / (F × AB) ?</p>`,
      options: [['cos', 'cos α'], ['sin', 'sin α'], ['cos2', 'cos² α'], ['lin', '1 − α / 90°']], bonne: 'cos',
      indices: { sin: 'Sur le cercle, sin α se lit sur l\'axe vertical : sin 0° = 0, alors que W / (F × AB) = 1 pour α = 0°.',
        cos2: 'cos² α est un carré : il est toujours positif. Or W / (F × AB) est négatif pour α > 90°.',
        lin: 'Bien vu : 1 − α / 90° donne aussi 1 à 0°, 0 à 90° et −1 à 180°. Mais à 60°, elle donne 1 − 60 / 90 ≈ 0,33, alors que W / (F × AB) = 0,5. Sur le cercle, quelle grandeur vaut 0,5 pour 60° ?' },
      solution: 'Sur le cercle, cos 0° = 1, cos 60° = 0,5, cos 90° = 0, cos 120° = −0,5 et cos 180° = −1 : ce sont les valeurs de W / (F × AB).' }),
    partieAxes(),
    { type: 'choix', scene: TOUT,
      enonce: '<p>Tu as trouvé que W est <b>proportionnel à F</b>, <b>proportionnel à AB</b> et <b>proportionnel à cos α</b>. Quelle est l\'expression du travail ?</p>',
      options: [['a', 'W = F × AB'], ['b', 'W = F + AB + cos α'], ['c', 'W = F × AB × cos α'], ['d', 'W = F × AB / cos α'], ['e', 'W = F × AB × sin α']], bonne: 'c',
      indices: { a: 'Avec F × AB, W serait le même pour tous les angles : il manque la dépendance en cos α.', b: 'Une somme n\'est pas proportionnelle à chaque terme : si F double, F + AB + cos α ne double pas.',
        d: 'W est proportionnel à cos α : on multiplie par cos α, on ne divise pas.', e: 'Avec sin α, le travail serait nul à 0°. Or W est maximal à 0°.' },
      solution: `${W_('F')} = F × AB × cos α : F en newtons, AB en mètres, W en <b>joules</b>.` },
    { type: 'texte', html: `<div class="cle tf-cle"><p class="tf-formule">${W_('F')} = F × AB × cos α</p><p>Le travail est une <b>énergie</b> : 1 J = 1 N × 1 m. α est l'angle entre ${vec('F')} et le déplacement ${vec('AB')}, <b>en degrés</b>.</p></div>` },
    { type: 'nombre', enonce: `<p>Vérifie avec ta calculatrice, réglée en <b>degrés</b> : F = 10 N, AB = 1,0 m et α = 40°. Calcule ${W_('F')} (3 chiffres significatifs), puis compare avec le simulateur.</p>`,
      label: 'W =', unite: 'J', calc: true, valeur: 10 * Math.cos(TF.rad(40)), tol: 0.01, affiche: '7,66', diag: v => diagW(v, 10, 1, 40),
      solution: `${W_('F')} = 10 × 1,0 × cos 40° ≈ 7,66 J : c'est la valeur du simulateur.`, regler: () => regler({ F: 10, AB: 1, alpha: 40 }, true) },
  ];

  /* ============================================================
     2. CHEMINS
     ============================================================ */
  const tableTrajets = () => `<div class="tf-defile"><table class="tf-tab tf-mesures"><thead><tr><th>Trajet</th>${TF.TRAJETS.map(t => `<th>${t.n}</th>`).join('')}<th>libre</th></tr></thead>
    <tbody><tr><th>W (J)</th>${TF.TRAJETS.map(t => `<td>${S.ch.faits[t.n] != null ? fmt(S.ch.faits[t.n], 1) : '…'}</td>`).join('')}<td>${S.ch.faits.libre != null ? fmt(S.ch.faits.libre, 1) : '…'}</td></tr></tbody></table></div>`;
  const PARTIES_CHEMINS = [
    partieManip({ section: 'chemins', scene: { scene: 'chemins', valeurs: { ch: { trajet: 1 } } },
      enonce: `<p>La force ${vec('F')} reste la même pendant tout le trajet : <b>F = 10 N</b>, horizontale, dirigée vers B (α = 0° par rapport à ${vec('AB')}). AB = 1 m. On va de A à B par quatre trajets différents : <b>appuie sur un trajet</b> pour le parcourir. Fais les quatre trajets.</p>`,
      html: '<div data-t></div>', maj: z => { z.querySelector('[data-t]').innerHTML = tableTrajets(); },
      ok: () => [1, 2, 3, 4].every(n => S.ch.faits[n] != null) }),
    { type: 'choix', enonce: '<p>Que remarques-tu ?</p>',
      options: [['ok', 'Le travail est le même pour les quatre trajets : il ne dépend pas du chemin suivi'], ['long', 'Plus le trajet est long, plus le travail est grand'], ['court', 'Le trajet direct (le plus court) donne le plus grand travail']], bonne: 'ok',
      indices: { long: 'Regarde le tableau : le trajet 4 est le plus long, et pourtant W = 10 J comme les autres.', court: 'Regarde le tableau : le trajet 1 donne W = 10 J, comme les autres.' },
      solution: 'Tous les trajets donnent W = 10 J : pour une force constante, le travail <b>ne dépend pas du chemin suivi</b>, seulement des points A et B.' },
    { type: 'grille', enonce: '<p>Refais le <b>trajet 3</b> en regardant le texte au-dessus de la figure. Pour chaque partie du trajet, quel est l\'angle entre la force et le déplacement, et que devient le travail ?</p>',
      options: [['0', 'α = 0° : W augmente'], ['90', 'α = 90° : W ne change pas'], ['180', 'α = 180° : W diminue']],
      lignes: [
        { label: 'Partie 1 <span class="tf-gl-d">déplacement vertical vers le haut</span>', bonne: '90', indice: 'La force est horizontale et le déplacement vertical : ils sont perpendiculaires.' },
        { label: 'Partie 2 <span class="tf-gl-d">déplacement horizontal, vers la droite</span>', bonne: '0', indice: 'Ici le déplacement est horizontal, vers la droite, comme la force : même direction, même sens.' },
        { label: 'Partie 3 <span class="tf-gl-d">déplacement vertical vers le bas</span>', bonne: '90', indice: 'Le déplacement vers le bas est perpendiculaire à la force horizontale (pas opposé).' },
      ],
      solution: 'Seule la partie horizontale apporte du travail : W = 0 + 10 J + 0 = 10 J, comme sur le trajet direct.',
      regler: () => { regler({ ch: { trajet: 3 } }); lire(); }, reglerNom: 'Refaire le trajet 3' },
    partieManip({ section: 'chemins', enonce: '<p><b>À toi de tracer un chemin.</b> Appuie sur « Tracé libre », pose le doigt (ou la souris) sur A et trace un chemin, aussi tordu que tu veux, jusqu\'à B.</p>',
      html: '<div data-t></div>', maj: z => { z.querySelector('[data-t]').innerHTML = tableTrajets(); },
      ok: () => S.ch.faits.libre != null,
      conclu: 'Ton chemin donne lui aussi W = 10 J : les parties où le travail augmente et celles où il diminue se compensent.' }),
    { type: 'texte', html: '<div class="cle tf-cle"><p>Pour une <b>force constante</b>, le travail <b>ne dépend pas du chemin suivi</b> : il ne dépend que des points de départ A et d\'arrivée B.</p></div>' },
  ];

  /* ============================================================
     3. POIDS
     ============================================================ */
  const NOM_PISTE = id => TF.PISTES.find(p => p.id === id).nom;
  const tablePistes = () => `<table class="tf-tab tf-mesures"><thead><tr><th>Chemin</th><th>W(${vec('P')})</th></tr></thead><tbody>${TF.PISTES.map(p => `<tr><td>${p.nom}</td><td>${S.po.faits[p.id] != null ? joules(S.po.faits[p.id]) : '…'}</td></tr>`).join('')}</tbody></table>`;
  const SC_PO = { scene: 'poids', valeurs: { po: { chemin: 'ski' } }, fixe: { po: { m: 80, zA: 130, zB: 30 } }, libres: [] };
  const P_SKI = 80 * G, W_SKI = 80 * G * 100;
  const PARTIES_POIDS = [
    partieManip({ section: 'poids', scene: SC_PO,
      enonce: `<p>Le skieur (m = 80 kg) descend la piste de A (${zA_} = 130 m) à B (${zB_} = 30 m). Son poids ${vec('P')} est une force <b>constante</b> : verticale, vers le bas. <b>Lance le skieur</b> sur la piste de ski : le travail de son poids s'affiche.</p>`,
      ok: () => S.po.faits.ski != null }),
    { type: 'choix', enonce: '<p>Relance le skieur en regardant la barre « énergie transmise ». Quand le skieur <b>remonte une bosse</b>, son poids :</p>',
      options: [['r', 'lui retire de l\'énergie : travail résistant'], ['m', 'lui fournit de l\'énergie : travail moteur'], ['n', 'ne travaille pas']], bonne: 'r',
      indices: { m: 'Regarde la barre pendant que le skieur monte une bosse : elle diminue.', n: 'Regarde la barre pendant que le skieur monte une bosse : elle change.' },
      solution: 'Dans les descentes, le travail du poids est moteur ; dans les montées, il est résistant.' },
    partieManip({ section: 'poids', enonce: '<p>Le poids est une force constante : comme dans la section Chemins, essaie d\'autres chemins de A à B. Parcours les deux <b>chemins imaginaires</b> : « Vertical puis horizontal » et « Horizontal puis vertical ».</p>',
      html: '<div data-t></div>', maj: z => { z.querySelector('[data-t]').innerHTML = tablePistes(); },
      ok: () => S.po.faits.vh != null && S.po.faits.hv != null }),
    { type: 'choix', enonce: '<p>Que remarques-tu ?</p>',
      options: [['meme', 'Le travail du poids est le même par les trois chemins'], ['ski', 'La piste de ski donne le plus grand travail'], ['vh', 'Les chemins imaginaires donnent un travail plus petit']], bonne: 'meme',
      indices: { ski: 'Regarde le tableau : les trois chemins donnent la même valeur.', vh: 'Regarde le tableau : les trois chemins donnent la même valeur.' },
      solution: 'Le poids est une force constante : son travail <b>ne dépend pas du chemin suivi</b>. On peut donc le calculer sur le chemin le plus simple.' },
    { type: 'grille', enonce: `<p>Sur le chemin « <b>Vertical puis horizontal</b> », quel est l'angle entre ${vec('P')} (vers le bas) et le déplacement, pour chaque partie ?</p>`,
      options: [['0', 'α = 0°'], ['90', 'α = 90°'], ['180', 'α = 180°']],
      lignes: [
        { label: 'Partie 1 <span class="tf-gl-d">verticale, vers le bas</span>', bonne: '0', indice: `${vec('P')} et le déplacement sont tous les deux vers le bas : même direction, même sens.` },
        { label: 'Partie 2 <span class="tf-gl-d">horizontale</span>', bonne: '90', indice: `${vec('P')} est vertical, le déplacement horizontal : ils sont perpendiculaires.` },
      ],
      solution: `Sur la partie horizontale, ${vec('P')} est perpendiculaire au déplacement : <b>W = 0</b>. Tout le travail se fait sur la partie verticale, où α = 0° : W = P × h, avec h la hauteur descendue. Le calcul est très simple.`,
      regler: () => { regler({ po: { chemin: 'vh' } }); lire(); }, reglerNom: 'Refaire ce chemin' },
    { type: 'nombre', enonce: `<p>Calcule la valeur du poids du skieur : P = m × g, avec m = 80 kg et g = 9,81 N/kg (3 chiffres significatifs).</p>`,
      label: 'P =', unite: 'N', calc: true, valeur: P_SKI, rel: 0.004, affiche: '785',
      diag: v => (prochain(v, 80) ? 'C\'est la masse : multiplie par g = 9,81 N/kg.' : prochain(v, 80 / G, 0.02) ? 'On multiplie par g, on ne divise pas : P = m × g.' : 'P = m × g = 80 × 9,81.'),
      solution: 'P = 80 × 9,81 ≈ 785 N.' },
    { type: 'nombre', enonce: `<p>Sur la partie verticale, le skieur descend de h = ${zA_} − ${zB_} = 130 − 30 = 100 m, avec α = 0°. Calcule le travail du poids W = P × h (3 chiffres significatifs).</p>`,
      label: 'W =', unite: 'J', calc: true, valeur: W_SKI, rel: 0.004, affiche: '7,85 × 10^4',
      diag: v => (prochain(v, P_SKI) || prochain(v, 785) ? 'C\'est le poids P : multiplie par la hauteur h = 100 m.' : prochain(v, -W_SKI) ? 'Le skieur descend : le poids l\'aide, le travail est moteur, positif.' : prochain(v, 8000) ? 'Le poids vaut P = m × g ≈ 785 N, pas 80 N.' : 'W = P × h = 785 × 100.'),
      solution: () => `W = 785 × 100 ≈ 7,85 × 10<sup>4</sup> J : c'est bien la valeur du simulateur (${joules(W_SKI)}).` },
    { type: 'choix', enonce: '<p>Pour une descente de hauteur h, le travail du poids s\'écrit donc :</p>',
      options: [['mgh', 'W = m × g × h'], ['mhg', 'W = m × h / g'], ['mg_h', 'W = m × g / h'], ['plus', 'W = m + g + h']], bonne: 'mgh',
      indices: { mhg: 'W = P × h et P = m × g : on multiplie par g.', mg_h: 'W = P × h : on multiplie par la hauteur, on ne divise pas.', plus: 'W = P × h et P = m × g : ce sont des produits.' },
      solution: 'W = P × h = m × g × h.' },
    partieManip({ section: 'poids', scene: { scene: 'poids', libres: ['m', 'zA', 'zB'] },
      enonce: `<p>Fais maintenant <b>remonter</b> le skieur (tiré par le téléski) : règle ${zB_} plus haut que ${zA_} (curseurs, ou fais glisser A et B), puis lance-le.</p>`,
      ok: () => S.dernier && S.dernier.scene === 'poids' && S.dernier.zB > S.dernier.zA }),
    { type: 'choix', enonce: `<p>Pendant la montée, sur une partie verticale, ${vec('P')} (vers le bas) et le déplacement (vers le haut) font un angle de 180°. Le travail du poids est :</p>`,
      options: [['r', 'résistant : W = −m × g × (hauteur montée)'], ['m', 'moteur : W = m × g × (hauteur montée)'], ['n', 'nul']], bonne: 'r',
      indices: { m: 'Le poids est vers le bas et le skieur monte : le poids s\'oppose au déplacement.', n: 'Le déplacement vertical n\'est pas perpendiculaire au poids : il est opposé.' },
      solution: 'Le poids s\'oppose à la montée : il retire de l\'énergie au skieur, le travail est <b>résistant</b> (négatif).' },
    { type: 'choix', enonce: '<p>Pour garder une seule relation W(P⃗) = m × g × h dans les deux cas, on définit <b>h = <i>z</i><sub>A</sub> − <i>z</i><sub>B</sub></b> (altitude de départ moins altitude d\'arrivée). Alors :</p>',
      options: [['ok', 'h > 0 quand on descend, h < 0 quand on monte'], ['inv', 'h > 0 quand on monte, h < 0 quand on descend'], ['pos', 'h est toujours positif']], bonne: 'ok',
      indices: { inv: `En descente, le départ est plus haut que l'arrivée : ${zA_} > ${zB_}, donc ${zA_} − ${zB_} > 0.`, pos: `En montée, ${zA_} < ${zB_} : ${zA_} − ${zB_} est négatif.` },
      solution: `h = ${zA_} − ${zB_} est <b>positif quand on descend</b> et <b>négatif quand on monte</b> : W = m g h a le bon signe dans les deux cas.` },
    { type: 'grille', enonce: '<p>Relie chaque situation à la nature du travail du poids.</p>',
      options: [['m', 'moteur'], ['r', 'résistant'], ['n', 'nul']],
      lignes: [
        { label: 'Le skieur descend <span class="tf-gl-d">h > 0, W > 0</span>', bonne: 'm', indice: 'W > 0 : le poids fournit de l\'énergie, le travail est moteur.' },
        { label: 'Le skieur monte <span class="tf-gl-d">h < 0, W < 0</span>', bonne: 'r', indice: 'W < 0 : le poids retire de l\'énergie, le travail est résistant.' },
        { label: 'Il arrive à la même altitude <span class="tf-gl-d">h = 0</span>', bonne: 'n', indice: 'h = 0 donc W = 0, quel que soit le chemin.' },
      ],
      solution: 'Descente : travail moteur ; montée : travail résistant ; même altitude : travail nul.' },
    { type: 'texte', html: `<div class="cle tf-cle"><p class="tf-formule">${W_('P')} = m × g × h, avec h = ${zA_} − ${zB_}</p><p><b>En pratique :</b> calcule m × g × (hauteur), puis mets le signe : <b>+ si l'objet descend</b> (travail moteur), <b>− s'il monte</b> (travail résistant).</p></div>` },
    { type: 'nombre', enonce: '<p>Une randonneuse de 60 kg <b>monte</b> de 500 m d\'altitude. Calcule le travail de son poids (g = 9,81 N/kg, 3 chiffres significatifs).</p>',
      label: 'W =', unite: 'J', calc: true, valeur: -60 * G * 500, rel: 0.006, affiche: '−2,94 × 10^5',
      diag: v => (prochain(v, 60 * G * 500) ? 'Elle <b>monte</b> : h = <i>z</i><sub>A</sub> − <i>z</i><sub>B</sub> = −500 m. Ne compte pas h positivement pour une montée : le travail est résistant, négatif.' : prochain(Math.abs(v), 30000) ? 'Le poids vaut P = m × g : multiplie aussi par g.' : 'W = m × g × h = 60 × 9,81 × (−500).'),
      solution: `${W_('P')} = 60 × 9,81 × (−500) ≈ −2,94 × 10<sup>5</sup> J : travail résistant.` },
  ];

  /* ============================================================
     4. DÉFIS ET EXERCICES
     ============================================================ */
  const libreV = v => ({ scene: 'force', valeurs: v, libres: 'tout' });
  const poidsV = v => ({ scene: 'poids', valeurs: { po: v }, libres: 'tout' });
  function preparer(cfg) { SEC.defis.cfg = cfg; appliquer(cfg, true); }
  const ref = {};                                       // situations de départ des défis « double W »
  const fixerRef = k => { ref[k] = { F: S.F, AB: S.AB, alpha: S.alpha, W: Wforce() }; };
  const refTxt = k => (ref[k] ? ` Départ : F = ${ref[k].F} N, AB = ${fmt(ref[k].AB, 1)} m, α = ${deg(ref[k].alpha)}, W = ${joules(ref[k].W)}.` : ' Appuie d\'abord sur « Essayer ».');
  const fo = d => d.scene === 'force' && d.F > 0 && d.AB > 0;
  const DEFIS = [
    { t: `Rends le travail de ${vec('F')} <b>nul</b> sans mettre F ni AB à zéro, puis lance le wagon.`, cfg: libreV({ F: 10, AB: 1.5, alpha: 30 }), ok: d => fo(d) && Math.abs(d.W) < 1e-9 },
    { t: 'Pour F = 12 N et AB = 1,5 m, obtiens le <b>plus grand travail</b> possible, puis lance le wagon.', cfg: libreV({ F: 12, AB: 1.5, alpha: 120 }), ok: d => fo(d) && d.F === 12 && d.AB === 1.5 && d.alpha === 0 },
    { t: 'Obtiens un <b>travail résistant</b> : la force doit retirer de l\'énergie au wagon.', cfg: libreV({ F: 10, AB: 1, alpha: 60 }), ok: d => fo(d) && d.W < -1e-9 },
    { t: () => `<b>Double W</b> en ne changeant que F, puis lance le wagon.${refTxt('F')}`, cfg: libreV({ F: 6, AB: 0.8, alpha: 30 }), apres: () => fixerRef('F'),
      ok: d => ref.F && fo(d) && d.AB === ref.F.AB && d.alpha === ref.F.alpha && d.F === 2 * ref.F.F },
    { t: () => `<b>Double W</b> en ne changeant que AB, puis lance le wagon.${refTxt('AB')}`, cfg: libreV({ F: 10, AB: 0.6, alpha: 45 }), apres: () => fixerRef('AB'),
      ok: d => ref.AB && fo(d) && d.F === ref.AB.F && d.alpha === ref.AB.alpha && Math.abs(d.AB - 2 * ref.AB.AB) < 1e-9 },
    { t: 'Trouve un angle α pour lequel <b>W = F × AB / 2</b>, puis lance le wagon.', cfg: libreV({ F: 10, AB: 1, alpha: 0 }), ok: d => fo(d) && Math.abs(cosd(d.alpha) - 0.5) < 1e-9 },
    { t: 'Obtiens <b>W = −F × AB</b> : le travail le plus résistant possible.', cfg: libreV({ F: 8, AB: 1.2, alpha: 90 }), ok: d => fo(d) && cosd(d.alpha) === -1 },
    { t: `Poids : le skieur (80 kg) <b>descend de 120 m</b>. Règle ${zA_} et ${zB_}, puis lance-le.`, cfg: poidsV({ chemin: 'ski', m: 80, zA: 150, zB: 60 }), ok: d => d.scene === 'poids' && d.m === 80 && d.zA - d.zB === 120 },
    { t: `Poids : règle ${zA_} = ${zB_} et lance le skieur sur la piste : malgré les bosses, le travail de son poids est <b>nul</b>.`, cfg: poidsV({ chemin: 'ski', zA: 100, zB: 40 }), ok: d => d.scene === 'poids' && d.chemin === 'ski' && d.zA === d.zB },
    { t: 'Poids : fais <b>monter</b> le skieur : le travail de son poids devient résistant.', cfg: poidsV({ chemin: 'ski', zA: 120, zB: 20 }), ok: d => d.scene === 'poids' && d.zB > d.zA },
    { t: 'Chemins : <b>trace toi-même</b> un chemin de A à B, le plus long possible, et parcours-le.', cfg: { scene: 'chemins', valeurs: { ch: { trajet: 'libre', libre: null } } }, ok: d => d.scene === 'chemins' && d.trajet === 'libre' },
  ];
  const defisFaits = DEFIS.map(() => false);
  function rendreDefis() {
    const z = secEl('defis').querySelector('[data-a="vDefis"]');
    if (!z) return;
    z.innerHTML = `<ol class="tf-defis">${DEFIS.map((d, i) => `<li class="tf-defi${defisFaits[i] ? ' fait' : ''}"><span class="tf-defi-n" aria-hidden="true">${defisFaits[i] ? '✓' : i + 1}</span>
      <p class="tf-defi-t">${defisFaits[i] ? '<b class="tf-ok">Réussi' + NB + ':</b> ' : ''}${typeof d.t === 'function' ? d.t() : d.t}</p>${defisFaits[i] ? '' : `<button type="button" class="btn-small" data-essayer="${i}">Essayer</button>`}</li>`).join('')}</ol>
      ${defisFaits.every(Boolean) ? '<div class="callout-success tf-msg-in">Tous les défis sont réussis. Ouvre le Bilan pour retenir l\'essentiel.</div>' : ''}`;
  }
  function verifierDefis(d) {
    if (d.section !== 'defis' && d.section !== 'libre') return;
    let nouveau = false;
    DEFIS.forEach((x, i) => { if (!defisFaits[i] && x.ok(d)) { defisFaits[i] = true; nouveau = true; } });
    if (nouveau) {
      rendreDefis();
      if (defisFaits.every(Boolean)) marquerFait('defis');
    }
  }
  const luge = `<svg viewBox="0 0 220 96" class="tf-q-fig" role="img" aria-label="Luge tirée sur un sol horizontal ; la corde fait 60 degrés avec la verticale">
      <line x1="6" y1="78" x2="214" y2="78" class="tf-sc-sol"/><rect x="40" y="62" width="50" height="12" rx="3" class="tf-sc-sys"/>
      <line x1="90" y1="66" x2="${(90 + 70 * Math.cos(Math.PI / 6)).toFixed(1)}" y2="${(66 - 70 * Math.sin(Math.PI / 6)).toFixed(1)}" stroke="#b35c00" stroke-width="3"/>
      <line x1="90" y1="66" x2="90" y2="8" class="tf-sc-ref"/><path d="M90,40 A26,26 0 0 1 ${(90 + 26 * Math.cos(Math.PI / 6)).toFixed(1)},${(66 - 26 * Math.sin(Math.PI / 6)).toFixed(1)}" class="tf-sc-arc"/>
      <text x="100" y="32" class="tf-sc-alpha">60°</text>${TF.fleche(150, 88, 0, 50, '#55585f', 2).svg}<text x="150" y="70" class="tf-sc-txt">déplacement</text></svg>`;
  const EXERCICES = [
    { type: 'choix', enonce: '<p>Quelle est l\'unité du travail d\'une force ?</p>',
      options: [['J', 'le joule (J)'], ['N', 'le newton (N)'], ['W', 'le watt (W)'], ['Nm', 'le newton par mètre']], bonne: 'J',
      indices: { N: 'Le newton est l\'unité des <b>forces</b>. Le travail est une <b>énergie</b>.', W: 'Le watt est l\'unité des <b>puissances</b> (le travail se note W, mais ce n\'est pas son unité).', Nm: 'W = F × AB : on <b>multiplie</b> des newtons par des mètres, ce qui donne des joules.' },
      solution: 'Le travail est une énergie : il s\'exprime en joules (1 J = 1 N × 1 m).' },
    { type: 'nombre', enonce: `<p>F = 10 N, AB = 1,0 m et α = 40°. Calcule ${W_('F')} (3 chiffres significatifs).</p>`, label: 'W =', unite: 'J', calc: true,
      valeur: 10 * Math.cos(TF.rad(40)), tol: 0.01, affiche: '7,66', diag: v => diagW(v, 10, 1, 40),
      solution: `${W_('F')} = F × AB × cos α = 10 × 1,0 × cos 40° ≈ 7,66 J.`, regler: () => preparer(libreV({ F: 10, AB: 1, alpha: 40 })) },
    { type: 'nombre', enonce: '<p>Calcule cos 30° à la calculatrice (2 décimales).</p>', label: 'cos 30° =', unite: '', calc: true, valeur: Math.cos(TF.rad(30)), tol: 0.006, affiche: '0,87',
      diag: v => (Math.abs(v - Math.cos(30)) < 0.01 ? '0,15 au lieu de 0,87 : ta calculatrice est en <b>radians</b>, passe-la en <b>degrés</b>.' : Math.abs(v - 0.5) < 0.01 ? '0,5, c\'est cos 60° (ou sin 30°) : tape bien cos(30).' : 'Vérifie que ta calculatrice est en degrés, puis tape cos(30).'),
      solution: 'cos 30° ≈ 0,87 (calculatrice en degrés).' },
    { type: 'phrase', enonce: '<p>Complète la phrase.</p>',
      morceaux: ['Pour α = 90°, cos α = ', { options: ['0', '1', '−1'], bonne: '0', indices: { 1: 'cos 0° = 1 ; cos 90° = 0.', '−1': 'cos 180° = −1 ; cos 90° = 0.' } },
        ' : la force est ', { options: ['perpendiculaire', 'parallèle', 'opposée'], bonne: 'perpendiculaire', indices: { parallèle: 'Une force parallèle au déplacement fait un angle de 0° (ou 180°).', opposée: 'Une force opposée au déplacement fait un angle de 180°.' } },
        ' au déplacement, et son travail est ', { options: ['nul', 'moteur', 'résistant'], bonne: 'nul', indices: { moteur: 'cos 90° = 0, donc W = F × AB × 0.', résistant: 'cos 90° = 0, donc W = F × AB × 0.' } }, '.'],
      solution: 'cos 90° = 0 : une force perpendiculaire au déplacement ne travaille pas (W = 0).', regler: () => preparer(libreV({ alpha: 90, F: S.F || 10 })) },
    { type: 'choix', enonce: '<p>Deux personnes tirent un wagon avec des forces de même valeur : la première dans le sens du déplacement, la seconde en biais (α = 40°). Le travail de la seconde est :</p>',
      options: [['petit', 'plus petit que celui de la première'], ['grand', 'plus grand'], ['meme', 'le même'], ['nul', 'nul']], bonne: 'petit',
      indices: { grand: 'cos 40° ≈ 0,77 < cos 0° = 1 : seule une partie de sa force fait avancer le wagon.', meme: 'Les forces ont la même valeur, mais pas le même angle : cos 40° ≠ cos 0°.', nul: 'Elle tire un peu vers l\'avant : α = 40° < 90°, son travail est moteur.' },
      solution: 'W₂ = F × AB × cos 40° ≈ 0,77 × F × AB : plus petit que W₁ = F × AB.', regler: () => preparer(libreV({ alpha: 40, F: 10, AB: 1 })), reglerNom: 'Voir le wagon' },
    { type: 'nombre', enonce: `${luge}<p>Un enfant tire sa luge sur 15 m, sur un sol horizontal, avec une force de 40 N. La corde fait un angle de <b>60° avec la verticale</b>. Calcule le travail de cette force (3 chiffres significatifs).</p>`,
      label: 'W =', unite: 'J', calc: true, valeur: 40 * 15 * Math.cos(TF.rad(30)), rel: 0.005, affiche: '520',
      diag: v => (prochain(v, 300) ? '60° est l\'angle avec la <b>verticale</b>. α est l\'angle entre la force et le déplacement (horizontal) : α = 90° − 60° = 30°.' : diagW(v, 40, 15, 30)),
      solution: 'α = 90° − 60° = 30° ; W = 40 × 15 × cos 30° ≈ 520 J.' },
    { type: 'nombre', enonce: '<p>Un skieur de masse 80 kg descend une piste : son altitude diminue de 120 m. Calcule le travail de son poids (g = 9,81 N/kg, 3 chiffres significatifs).</p>',
      label: 'W =', unite: 'J', calc: true, valeur: 80 * G * 120, rel: 0.006, affiche: '9,42 × 10^4',
      diag: v => (prochain(v, -80 * G * 120) ? 'Il <b>descend</b> : h = <i>z</i><sub>A</sub> − <i>z</i><sub>B</sub> = +120 m, le travail du poids est moteur, positif.' : prochain(v, 9600) ? 'Le poids vaut P = m × g : multiplie aussi par g = 9,81 N/kg.' : prochain(v, 80 * G) ? 'Tu as calculé le poids P = m g ; multiplie par la hauteur h = 120 m.' : 'W = m × g × h = 80 × 9,81 × 120.'),
      solution: `${W_('P')} = m g h = 80 × 9,81 × 120 ≈ 9,42 × 10<sup>4</sup> J (moteur).`, regler: () => preparer(poidsV({ chemin: 'ski', m: 80, zA: 150, zB: 30 })) },
    { type: 'nombre', enonce: '<p>Une randonneuse de 60 kg <b>monte</b> de 500 m d\'altitude. Calcule le travail de son poids (g = 9,81 N/kg, 3 chiffres significatifs).</p>',
      label: 'W =', unite: 'J', calc: true, valeur: -60 * G * 500, rel: 0.006, affiche: '−2,94 × 10^5',
      diag: v => (prochain(v, 60 * G * 500) ? 'Elle <b>monte</b> : h = <i>z</i><sub>A</sub> − <i>z</i><sub>B</sub> = −500 m. Ne compte pas h positivement pour une montée : le travail est résistant, négatif.' : prochain(Math.abs(v), 30000) ? 'Le poids vaut P = m × g : multiplie aussi par g.' : 'W = m × g × h = 60 × 9,81 × (−500).'),
      solution: `${W_('P')} = 60 × 9,81 × (−500) ≈ −2,94 × 10<sup>5</sup> J (résistant).` },
    { type: 'choix', enonce: '<p>Une valise de 20 kg roule sur 50 m dans un couloir horizontal. Le travail de son poids vaut :</p>',
      options: [['0', '0 J'], ['p', '9,81 × 10<sup>3</sup> J'], ['m', '−9,81 × 10<sup>3</sup> J'], ['1000', '1,0 × 10<sup>3</sup> J']], bonne: '0',
      indices: { p: 'Tu as calculé m × g × 50 : mais 50 m est un déplacement horizontal. Le poids est vertical, perpendiculaire au déplacement.', m: 'L\'altitude ne change pas : il n\'y a ni montée ni descente.', 1000: 'W = m g h, et h = 0.' },
      solution: `${vec('P')} est perpendiculaire au déplacement horizontal (h = 0) : W = 0.` },
    { type: 'choix', enonce: `<p>Pour aller de A à B, un chemin droit et un chemin long et sinueux. ${vec('F')} est constante. Sur quel chemin son travail est-il le plus grand ?</p>`,
      options: [['meme', 'le même sur les deux'], ['long', 'sur le chemin long'], ['droit', 'sur le chemin droit']], bonne: 'meme',
      indices: { long: 'Le chemin long a des portions où la force travaille positivement et d\'autres négativement : la somme est la même.', droit: 'Essaie dans la section Chemins : tous les chemins donnent le même travail.' },
      solution: 'Pour une force constante, W = F × AB × cos α ne dépend que de A et B, pas du chemin suivi.', regler: () => preparer({ scene: 'chemins', valeurs: { ch: { trajet: 2 } } }), reglerNom: 'Voir les chemins' },
    { type: 'nombre', enonce: '<p>Un remorqueur tire un pétrolier avec une force constante de 100 kN sur 2,0 km ; le câble fait un angle de 20° avec le déplacement. Calcule le travail de la force (2 chiffres significatifs).</p>',
      label: 'W =', unite: 'J', calc: true, valeur: 100e3 * 2000 * Math.cos(TF.rad(20)), rel: 0.03, affiche: '1,9 × 10^8',
      diag: v => (prochain(v, 100e3 * 2 * Math.cos(TF.rad(20)), 0.03) || prochain(v, 100 * 2000 * Math.cos(TF.rad(20)), 0.03) || prochain(v, 100 * 2 * Math.cos(TF.rad(20)), 0.03)
        ? 'Convertis d\'abord : F = 100 kN = 100 × 10<sup>3</sup> N et AB = 2,0 km = 2,0 × 10<sup>3</sup> m.' : diagW(v, 100e3, 2000, 20)),
      solution: 'W = 100 × 10<sup>3</sup> × 2,0 × 10<sup>3</sup> × cos 20° ≈ 1,9 × 10<sup>8</sup> J.' },
    { type: 'phrase', enonce: '<p>Complète la phrase.</p>',
      morceaux: ['Le travail est résistant (W < 0) quand α est compris entre ', { options: ['0°', '90°', '180°'], bonne: '90°', indices: { '0°': 'Entre 0° et 90°, cos α > 0 : le travail est moteur.' } },
        ' et ', { options: ['0°', '90°', '180°'], bonne: '180°' }, ' : cos α est alors ', { options: ['positif', 'nul', 'négatif'], bonne: 'négatif', indices: { positif: 'cos 120° = −0,5 : regarde le cercle trigonométrique.', nul: 'cos α n\'est nul que pour 90°.' } }, '.'],
      solution: 'Pour 90° < α ≤ 180°, cos α < 0 : W < 0, travail résistant.' },
    { type: 'choix', enonce: '<p>La Lune tourne autour de la Terre sur un cercle, à vitesse constante. La force d\'attraction de la Terre, dirigée vers le centre du cercle :</p>',
      options: [['nul', 'ne travaille pas'], ['moteur', 'a un travail moteur'], ['res', 'a un travail résistant']], bonne: 'nul',
      indices: { moteur: 'À chaque instant, la force (vers le centre) est perpendiculaire au déplacement (tangent au cercle) : cos 90° = 0.', res: 'À chaque instant, la force (vers le centre) est perpendiculaire au déplacement (tangent au cercle) : cos 90° = 0.' },
      solution: 'La force est perpendiculaire au déplacement à chaque instant : son travail est nul (la vitesse ne change pas).' },
  ];
  function construireDefis(z) {
    z.innerHTML = `<div class="tf-seg tf-seg-plein" role="group" aria-label="Défis ou exercices"><button type="button" data-vue="defis" aria-pressed="true">Défis</button><button type="button" data-vue="exos" aria-pressed="false">Exercices</button></div>
      <p class="tf-petit" data-a="dIntro">Chaque défi se coche tout seul quand tu as lancé le déplacement qui le réussit. « Essayer » prépare le simulateur.</p>
      <div data-a="vDefis"></div><div data-a="vExos" hidden></div>`;
    rendreDefis();
    z.addEventListener('click', e => {
      const b = e.target.closest('button');
      if (!b) return;
      if (b.dataset.essayer) { const d = DEFIS[+b.dataset.essayer]; preparer(d.cfg); if (d.apres) d.apres(); rendreDefis(); }
      else if (b.dataset.vue) {
        z.querySelectorAll('[data-vue]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
        z.querySelector('[data-a="vDefis"]').hidden = b.dataset.vue !== 'defis';
        z.querySelector('[data-a="dIntro"]').hidden = b.dataset.vue !== 'defis';
        z.querySelector('[data-a="vExos"]').hidden = b.dataset.vue !== 'exos';
      }
    });
    // exercices : pastilles Q1…Qn et l'exercice choisi
    const v = z.querySelector('[data-a="vExos"]');
    v.innerHTML = `<div class="tf-puces" role="tablist" aria-label="Exercices">${EXERCICES.map((q, i) => `<button type="button" role="tab" class="tf-puce" data-q="${i}" aria-selected="${i === 0}" aria-label="Exercice ${i + 1}">${i + 1}</button>`).join('')}</div><div data-a="qZone"></div>`;
    const qz = v.querySelector('[data-a="qZone"]'), puces = Array.from(v.querySelectorAll('[data-q]'));
    EXERCICES.forEach((q, i) => {
      const d = document.createElement('div');
      d.hidden = i !== 0;
      qz.appendChild(d);
      TF.question(d, Object.assign({}, q, { surReussite: () => { puces[i].classList.add('fait'); puces[i].setAttribute('aria-label', `Exercice ${i + 1}, réussi`); } }));
    });
    puces.forEach((p, i) => { p.onclick = () => { puces.forEach((x, k) => x.setAttribute('aria-selected', String(k === i))); Array.from(qz.children).forEach((x, k) => { x.hidden = k !== i; }); p.scrollIntoView({ block: 'nearest', inline: 'nearest' }); }; });
  }

  /* ============================================================
     5. BILAN ET SIMULATEUR LIBRE
     ============================================================ */
  function construireBilan(z) {
    z.innerHTML = `<div class="tf-bilan">
      <div class="cle"><p><b class="cle-titre">Travail = énergie.</b> Le travail ${W_('F')} d'une force constante ${vec('F')} est l'<b>énergie</b> qu'elle transmet au système au cours du déplacement de A à B. Il s'exprime en <b>joules (J)</b> : 1 J = 1 N × 1 m.</p></div>
      <div class="cle"><p class="tf-formule">${W_('F')} = F × AB × cos α</p>
        <p>F en N, AB en m ; α : angle entre ${vec('F')} et ${vec('AB')}, <b>en degrés</b> (calculatrice en degrés). W est proportionnel à F, à AB et à cos α.</p></div>
      <div class="cle"><p><b class="cle-titre">Signe du travail.</b></p>
        <p>α < 90° : W > 0, travail <b>moteur</b> : la force fournit de l'énergie (maximal pour α = 0°) ;</p>
        <p>α = 90° : W = 0, travail <b>nul</b> : la force est perpendiculaire au déplacement ;</p>
        <p>α > 90° : W < 0, travail <b>résistant</b> : la force retire de l'énergie (minimal pour α = 180°).</p></div>
      <div class="cle"><p><b class="cle-titre">Chemin suivi.</b> Pour une force constante, le travail <b>ne dépend pas du chemin suivi</b> : seulement des points A et B.</p></div>
      <div class="cle"><p><b class="cle-titre">Travail du poids.</b></p><p class="tf-formule">${W_('P')} = m × g × h, avec h = ${zA_} − ${zB_}</p>
        <p>h > 0 quand l'objet descend : travail <b>moteur</b> ; h < 0 quand il monte : travail <b>résistant</b>. En pratique : m × g × (hauteur), avec <b>+ si ça descend</b> et <b>− si ça monte</b>.</p></div>
    </div>`;
  }
  function majLancers() {
    const t = secEl('libre').querySelector('[data-a="lancers"]');
    if (!t) return;
    t.innerHTML = S.lancers.length ? `<thead><tr><th>F</th><th>AB</th><th>α</th><th>W</th></tr></thead><tbody>${S.lancers.map(d => `<tr><td>${d.F} N</td><td>${fmt(d.AB, 1)} m</td><td>${deg(d.alpha)}</td><td class="tf-case-w">${joules(d.W)}</td></tr>`).join('')}</tbody>`
      : '<tbody><tr><td>Lance le wagon : tes mesures s\'inscrivent ici.</td></tr></tbody>';
  }
  function construireLibre(z) {
    z.innerHTML = `<p class="tf-petit">Une seule force tire le wagon. Règle F, AB et α (curseurs, boutons ±, pointe de ${vec('F')} ou point B), puis <b>lance le wagon</b> : le travail de la force, c'est-à-dire l'énergie qu'elle transmet au wagon, s'affiche sous la barre.</p>
      <p class="tf-lab">Tes derniers lancers</p><table class="tf-tab tf-mesures" data-a="lancers"></table>`;
    majLancers();
  }
  const CONSTRUIRE = {
    expression: z => lancerSuite('expression', z, PARTIES_EXPRESSION, `Tu as trouvé l'expression du travail : ${W_('F')} = F × AB × cos α.`),
    chemins: z => lancerSuite('chemins', z, PARTIES_CHEMINS, 'Le travail d\'une force constante ne dépend pas du chemin suivi.'),
    poids: z => lancerSuite('poids', z, PARTIES_POIDS, `${W_('P')} = m g h, avec h > 0 en descente et h < 0 en montée.`),
    defis: construireDefis,
    bilan: construireBilan,
    libre: construireLibre,
  };

  /* ---------- Départ ---------- */
  ouvrir('expression');
  setTimeout(rendre, 0);
})();
