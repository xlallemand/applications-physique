/* ============================================================
   Éditeur d'équation : isoler une grandeur en manipulant l'équation
   par glisser-déposer, étape par étape (même principe que l'application
   « Équations en physique » ; application « Chapitre 7 : Théorème de
   l'énergie cinétique » ; à charger après ec.js et assets/dragdrop.js)

   EC.editeurEquation(zone, cfg, api) → { montrer() }
     Partie 'perso' d'un cours (assets/cours.js) : api = { reussi, erreur, message, effacer, fini }.
     cfg = {
       tuiles: { Ec: 'E<sub>c</sub>', m: 'm', v: 'v', deux: '2' },   noms affichés des grandeurs
       gauche: { num: ['Ec'] },                                         équation de départ : un membre =
       droite: { num: ['m', 'v²'], den: ['deux'] },                       num (au-dessus), den (en dessous, facultatif),
                                                                           rac (true : sous une racine carrée) ;
                                                                           'v²' : la grandeur v au carré
       cible: 'v',                                                      grandeur à isoler (à gauche, seule)
       etapes: [{ gauche, droite }, …],                                 étapes de la correction (« Afficher la réponse »)
     }
   Manipulations :
     - glisser une grandeur d'une case à une autre (numérateur ou dénominateur, à gauche ou à droite) ;
       un numérateur vidé devient 1, un dénominateur vidé disparaît ;
     - glisser l'outil « fraction » sur un membre : il reçoit un dénominateur (vide, à remplir) ;
     - glisser l'outil « √ » sur un membre : la racine carrée annule le carré d'une grandeur seule
       (√(v²) = v), sinon elle s'applique à tout le membre ;
     - ⇄ : inverser le sens de l'équation ; ↺ Recommencer : équation de départ.
   « Vérifier l'étape » : l'équation doit rester juste (même relation entre les grandeurs que
   l'équation de départ, à un exposant près pour les deux membres) ; une étape juste est gardée
   dans la liste des étapes. C'est réussi quand la grandeur cherchée est seule à gauche.
   Plusieurs éditeurs peuvent exister dans la même page (aucun id fixe).
   ============================================================ */
(function () {
  'use strict';

  const { el } = window.EC;

  /* ---------- Équation : construction, copie, affichage ---------- */
  // 'v²' → { id: 'v', carre: true } ; 'un' : le nombre 1
  const tuile = s => ({ id: s.replace('²', ''), carre: /²$/.test(s) });
  const membre = m => ({ num: (m.num || []).map(tuile), den: m.den ? m.den.map(tuile) : null, rac: !!m.rac });
  const equation = e => ({ gauche: membre(e.gauche), droite: membre(e.droite) });
  const copie = e => JSON.parse(JSON.stringify(e));
  // écriture sans ordre des grandeurs (m × v² et v² × m : même équation)
  const forme = e => JSON.stringify(['gauche', 'droite'].map(k => {
    const m = e[k], ids = t => t.map(u => u.id + (u.carre ? '²' : '')).sort();
    return [ids(m.num), m.den ? ids(m.den) : null, m.rac];
  }));

  // signe √ étiré à la hauteur du contenu (voir .racine dans ec.css)
  const SIGNE_RAC = '<span class="racine-signe"><span class="racine-lu">√</span><svg viewBox="0 0 10 100" preserveAspectRatio="none" aria-hidden="true">' +
    '<path d="M0,62 L2.6,55 L5.6,99 L10,0" vector-effect="non-scaling-stroke"/></svg></span>';

  // une case (numérateur ou dénominateur) ; z : 'gauche.num'… (null : équation écrite, non manipulable) ;
  // le nom de la grandeur est dans un span (indice et exposant à leur place dans la tuile flexible)
  function htmlCase(tuiles, noms, z) {
    const t = tuiles.map((u, i) => (i ? '<span class="eqe-fois">×</span>' : '') +
      `<span class="eqe-tuile${u.id === 'un' ? ' un' : ''}"${z && u.id !== 'un' ? ` data-z="${z}" data-i="${i}"` : ''}><span>${u.id === 'un' ? '1' : noms[u.id]}${u.carre ? '<sup>2</sup>' : ''}</span></span>`).join('');
    return `<div class="eqe-case${tuiles.length ? '' : ' vide'}"${z ? ` data-z="${z}"` : ''}>${t || '<span class="eqe-vide">…</span>'}` +
      (z && !tuiles.length && z.endsWith('.den') ? '<button type="button" class="eqe-suppr" aria-label="Supprimer le dénominateur vide">✕</button>' : '') + '</div>';
  }
  function htmlMembre(m, noms, cote) {
    const z = k => (cote ? cote + '.' + k : null);
    let h = m.den ? `<div class="eqe-frac">${htmlCase(m.num, noms, z('num'))}<span class="eqe-barre-frac"></span>${htmlCase(m.den, noms, z('den'))}</div>`
      : htmlCase(m.num, noms, z('num'));
    if (m.rac) h = `<span class="racine eqe-rac">${SIGNE_RAC}<span class="racine-sous">${h}</span></span>`;
    return `<div class="eqe-membre"${cote ? ` data-cote="${cote}"` : ''}>${h}</div>`;
  }
  // équation écrite (liste des étapes)
  const htmlEquation = (e, noms) => `<div class="eqe-ligne">${htmlMembre(e.gauche, noms)}<span class="eqe-egal">=</span>${htmlMembre(e.droite, noms)}</div>`;

  /* ---------- Relation entre les grandeurs ---------- */
  // exposant de chaque grandeur : gauche − droite (numérateur +, dénominateur −, carré × 2, racine × ½)
  function exposants(e) {
    const x = {};
    [['gauche', 1], ['droite', -1]].forEach(([cote, s]) => {
      const m = e[cote], k = s * (m.rac ? .5 : 1);
      const ajoute = (u, sg) => { if (u.id !== 'un') x[u.id] = (x[u.id] || 0) + sg * k * (u.carre ? 2 : 1); };
      m.num.forEach(u => ajoute(u, 1));
      (m.den || []).forEach(u => ajoute(u, -1));
    });
    return x;
  }
  // rapport de chaque grandeur à l'équation de départ (l'équation reste juste si tous les rapports sont égaux)
  function rapports(e, depart) {
    const x = exposants(e), x0 = exposants(depart), r = {};
    Object.keys(x0).forEach(id => { r[id] = (x[id] || 0) / x0[id]; });
    return r;
  }
  const egaux = (a, b) => Math.abs(a - b) < 1e-9;

  /* ---------- L'éditeur ---------- */
  let nb = 0;
  function editeurEquation(hote, cfg, api) {
    const n = ++nb, noms = Object.assign({ un: '1' }, cfg.tuiles), depart = equation(cfg);
    let etat = copie(depart), etapes = [copie(depart)], fige = false;
    const nomCible = noms[cfg.cible];

    if (window.DragDrop) DragDrop.cleanupGhosts();
    hote.innerHTML = `<div class="eqe" data-eqe="${n}">
      <div class="eqe-tete"><p class="eqe-t">Étapes</p><button type="button" class="btn-small eqe-recommencer">↺ Recommencer</button></div>
      <ol class="eqe-histo"></ol>
      <div class="eqe-travail">
        <div class="eqe-zone"></div>
        <p class="eqe-t">Glisse les outils sur un membre de l'équation</p>
        <div class="eqe-palette"></div>
        <div class="er-actions crs-actions-partie"><button type="button" class="btn-primary eqe-verifier">Vérifier l'étape</button></div>
      </div>
    </div>`;
    const racine = hote.firstElementChild, zone = racine.querySelector('.eqe-zone'), histo = racine.querySelector('.eqe-histo');
    const dans = sel => `[data-eqe="${n}"] ${sel}`;
    racine.querySelector('.eqe-recommencer').addEventListener('click', recommencer);
    racine.querySelector('.eqe-verifier').addEventListener('click', verifier);

    /* ---- affichage ---- */
    function rendreHisto() {
      histo.innerHTML = etapes.map(e => `<li>${htmlEquation(e, noms)}</li>`).join('');
    }
    function rendre() {
      if (window.DragDrop) DragDrop.cleanupGhosts();
      zone.innerHTML = htmlMembre(etat.gauche, noms, 'gauche') + '<span class="eqe-egal">=</span>' + htmlMembre(etat.droite, noms, 'droite') +
        '<button type="button" class="eqe-inverser" title="Inverser le sens de l\'équation" aria-label="Inverser le sens de l\'équation">⇄</button>';
      if (fige) return;
      // grandeurs : glisser vers une autre case
      zone.querySelectorAll('.eqe-tuile[data-z]').forEach(t => {
        const z = t.dataset.z, i = +t.dataset.i;
        DragDrop.enable(t, { zoneSelector: dans('.eqe-zone .eqe-case'), dragOverClass: 'drag-over',
          onDrop: (item, cible) => { if (cible) deplacer(z, i, cible.dataset.z); } });
      });
      zone.querySelectorAll('.eqe-suppr').forEach(b => b.addEventListener('click', () => {
        const m = etat[b.closest('.eqe-membre').dataset.cote];
        m.den = null; api.effacer(); rendre();
      }));
      zone.querySelector('.eqe-inverser').addEventListener('click', () => {
        [etat.gauche, etat.droite] = [etat.droite, etat.gauche]; api.effacer(); rendre();
      });
    }
    // outils de la palette : fraction et racine carrée, à déposer sur un membre
    function palette() {
      const pal = racine.querySelector('.eqe-palette');
      pal.innerHTML = '<div class="eqe-outil eqe-outil-frac" title="Fraction" aria-label="Outil fraction"><span>···</span><span class="eqe-barre-frac"></span><span>···</span></div>' +
        `<div class="eqe-outil" title="Racine carrée" aria-label="Outil racine carrée"><span class="racine">${SIGNE_RAC}<span class="racine-sous">&nbsp;&nbsp;&nbsp;</span></span></div>`;
      const [frac, rac] = pal.children;
      DragDrop.enable(frac, { zoneSelector: dans('.eqe-zone .eqe-membre'), dragOverClass: 'drag-over',
        onDrop: (item, m) => { if (m) fraction(m.dataset.cote); } });
      DragDrop.enable(rac, { zoneSelector: dans('.eqe-zone .eqe-membre'), dragOverClass: 'drag-over',
        onDrop: (item, m) => { if (m) racineCarree(m.dataset.cote); } });
    }

    /* ---- manipulations ---- */
    const caseDe = z => { const [cote, k] = z.split('.'); return etat[cote][k]; };
    function deplacer(de, i, vers) {
      if (fige || de === vers) return;
      const src = caseDe(de), dst = caseDe(vers), [u] = src.splice(i, 1);
      if (!u) return;
      // un 1 seul au numérateur s'efface quand une grandeur arrive
      if (dst.length === 1 && dst[0].id === 'un') dst.length = 0;
      // un nombre se place devant les grandeurs (2 × Ec)
      if (/^[\d,]+$/.test(noms[u.id])) dst.unshift(u); else dst.push(u);
      // numérateur vidé : 1 ; dénominateur vidé : il disparaît
      const [cote, k] = de.split('.');
      if (!src.length) { if (k === 'num') src.push({ id: 'un', carre: false }); else etat[cote].den = null; }
      api.effacer();
      rendre();
    }
    function fraction(cote) {
      if (fige) return;
      const m = etat[cote];
      if (m.den) { api.message('Ce membre est déjà une fraction : glisse une grandeur dans son dénominateur.'); return; }
      m.den = [];
      api.effacer();
      rendre();
    }
    function racineCarree(cote) {
      if (fige) return;
      const m = etat[cote], tout = m.num.concat(m.den || []).filter(u => u.id !== 'un');
      if (m.rac) { api.message('Ce membre est déjà sous une racine carrée.'); return; }
      if (!m.den && m.num.length === 1 && m.num[0].carre) m.num[0].carre = false;       // √(v²) = v
      else if (tout.some(u => u.carre)) {
        const u = tout.find(x => x.carre);
        api.message(`Pour rester simple, la racine carrée ne s'utilise que sur ${noms[u.id]}<sup>2</sup> seul : fais d'abord passer de l'autre côté ce qui l'accompagne.`);
        return;
      } else m.rac = true;
      api.effacer();
      rendre();
    }
    function recommencer() {
      if (fige) return;
      etat = copie(depart); etapes = [copie(depart)];
      api.effacer();
      rendreHisto(); rendre();
    }

    /* ---- vérification d'une étape ---- */
    const seule = (m, id) => !m.rac && !m.den && m.num.length === 1 && m.num[0].id === id;
    const contient = (m, id) => m.num.concat(m.den || []).some(u => u.id === id);
    function diagnostic() {
      if (etat.gauche.den && !etat.gauche.den.length || etat.droite.den && !etat.droite.den.length)
        return 'Un dénominateur est vide : glisse une grandeur dedans, ou supprime-le avec sa croix ✕.';
      const r = rapports(etat, depart), ids = Object.keys(r), vals = ids.map(id => r[id]);
      // la racine appliquée à un seul membre : les rapports valent 1 et ½
      if (vals.some(v => egaux(v, 1)) && vals.some(v => egaux(v, .5)) || vals.some(v => egaux(v, -1)) && vals.some(v => egaux(v, -.5)))
        return 'La racine carrée a été appliquée à un seul membre : applique-la aux deux membres, sinon l\'égalité n\'est plus vraie.';
      // grandeur passée de l'autre côté sans changer d'étage : rapport de signe contraire à la majorité
      const plus = vals.filter(v => v > 0).length, ref = plus >= vals.length - plus ? 1 : -1;
      const fausse = ids.find(id => Math.sign(r[id]) !== ref);
      if (fausse) return `${noms[fausse]} a changé de côté sans changer d'étage : ce qui multiplie d'un côté (en haut) passe de l'autre côté en divisant (en bas), et inversement.`;
      return 'L\'équation n\'est plus juste : clique sur ↺ Recommencer.';
    }
    function verifier() {
      if (fige || api.fini()) return;
      const r = rapports(etat, depart), vals = Object.values(r);
      const juste = !(etat.gauche.den && !etat.gauche.den.length) && !(etat.droite.den && !etat.droite.den.length) &&
        vals.every(v => egaux(v, vals[0]) && !egaux(v, 0));
      if (!juste) { api.erreur(diagnostic()); return; }
      if (forme(etat) === forme(etapes[etapes.length - 1])) {
        api.message('Fais d\'abord une manipulation : glisse une grandeur de l\'autre côté du signe =, ou un outil sur un membre.');
        return;
      }
      etapes.push(copie(etat));
      rendreHisto();
      const g = etat.gauche, d = etat.droite, c = cfg.cible;
      if (seule(g, c) && !g.num[0].carre && !contient(d, c)) { terminer(); api.reussi(); return; }
      const m = contient(g, c) ? g : d, avec = m.num.concat(m.den || []).filter(u => u.id !== c && u.id !== 'un').map(u => noms[u.id]);
      const carre = m.num.concat(m.den || []).some(u => u.id === c && u.carre);
      let msg = 'Étape juste, continue !';
      if (seule(d, c) && !d.num[0].carre) msg = `Étape juste. ${nomCible} est seule : inverse le sens de l'équation avec ⇄.`;
      else if (!m.rac && !m.den && m.num.length === 1 && m.num[0].id === c) msg = `Étape juste. Il reste à supprimer le carré : glisse l'outil √ sur chaque membre de l'équation.`;
      else if (avec.length) msg = `Étape juste. Continue : fais passer de l'autre côté ce qui accompagne ${nomCible}${carre ? '<sup>2</sup>' : ''} (${avec.join(', ')}).`;
      api.message(`<span class="eqe-ok">✓ ${msg}</span>`);
    }
    function terminer() {
      fige = true;
      racine.classList.add('eqe-fige');
      rendre();
    }

    rendreHisto();
    rendre();
    palette();
    racine.eqe = { etat: () => etat, verifier, deplacer, fraction, racineCarree };   // (utile pour vérifier l'application)
    // « Afficher la réponse » : les étapes de la correction
    return { montrer() {
      etapes = [copie(depart)].concat((cfg.etapes || []).map(equation));
      etat = copie(etapes[etapes.length - 1]);
      rendreHisto();
      terminer();
    } };
  }

  Object.assign(window.EC, { editeurEquation });
})();
