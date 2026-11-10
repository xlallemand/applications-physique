/* ============================================================
   TP : titrage pH-métrique du Destop — moteur de l'application (espace de noms TPH)

   TPH.init(cle, { passer })         sommaire, boutons « Données du TP » et « Passer cette partie → »
   TPH.donnees()                     panneau « Données du TP » (✕, Échap, voile), comme le sujet du TP
   TPH.tp() / TPH.tpEcrire(o)        ce que l'élève a fait : localStorage « titrage-ph-tp »
                                     { prise: { veq, decalage, mesures }, veqEleve, titre, groupes }
   TPH.prise() / TPH.nouvellePrise() prise d'essai en cours (Veq tiré, jamais affiché)
   TPH.config(prise)                 configuration de TITRAGE.creer pour le TP
   TPH.modele(veq) / TPH.mesuresAuto(prise) / TPH.mesures()
   TPH.veqEleve()                    Veq retenu au module 3 (sinon extrémum de la dérivée des mesures)
   TPH.qcm(zone, choix, rappel)      boutons de choix ; choix = [{ html, juste, diag, avert }]
   TPH.menu(bouton, options, rappel) petit menu de choix sous un bouton
   TPH.placeur(o)                    étiquettes à placer : toucher l'étiquette puis la case, ou glisser
   TPH.materiel(zone, o)             cartes du matériel de dilution
   TPH.schema(zone, o)               schéma du montage à compléter + appareil de mesure
   TPH.phrase(zone, o) / TPH.equation(zone, o)   morceaux à toucher dans l'ordre
   TPH.calcul(zone, o)               formule à choisir, valeurs à placer, calcul automatique
   TPH.fr, TPH.rac, TPH.abs, TPH.somme, TPH.cs, TPH.CALC   écritures mathématiques
   ============================================================ */
(function () {
  'use strict';

  const NB = ' ';
  const fmt = (x, d) => TITRAGE.outils.fmt(x, d);
  const UI = TITRAGE.ui;

  /* ---------- plan de l'application ---------- */
  const PLAN = [
    { n: 1, titre: 'Préparer le titrage', desc: 'Dilution, schéma du montage, réaction de titrage', sousModules: true,
      parties: [
        { nom: 'Diluer 20 fois le Destop', entrainement: 'module_1a_dilution', noms: { entrainement: 'Diluer 20 fois le Destop' } },
        { nom: 'Montage et réaction de titrage', entrainement: 'module_1b_montage', noms: { entrainement: 'Montage et réaction de titrage' } }] },
    { n: 2, titre: 'Réaliser le titrage', desc: 'Simulateur de titrage pH-métrique',
      parties: [{ nom: 'Simulateur de titrage', simulation: 'module_2_titrage', noms: { simulation: 'Simulateur de titrage' } }] },
    { n: 3, titre: 'Exploiter le titrage', desc: 'Volume équivalent, Regressi, titre massique', sousModules: true,
      parties: [
        { nom: 'Repérer le volume équivalent', entrainement: 'module_3a_equivalence', noms: { entrainement: 'Repérer le volume équivalent' } },
        { nom: 'Le faire avec Regressi', cours: 'module_3b_regressi', noms: { cours: 'Le faire avec Regressi' } },
        { nom: 'Calculer le titre massique', entrainement: 'module_3c_titre', noms: { entrainement: 'Calculer le titre massique' } }] },
    { n: 4, titre: 'Valider le résultat', desc: 'Incertitudes et compatibilité',
      parties: [{ nom: 'Incertitudes et compatibilité', entrainement: 'module_4_incertitudes', noms: { entrainement: 'Incertitudes et compatibilité' } }] },
  ];
  SOM.init({ nom: 'TP' + NB + ': titrage pH-métrique du Destop', id: 'titrage-ph', plan: PLAN });

  /* ---------- ce que l'élève a fait (toujours dans un try/catch) ---------- */
  const CLE = 'titrage-ph-tp';
  let memoire = {};
  function tp() { try { return JSON.parse(localStorage.getItem(CLE)) || memoire; } catch (e) { return memoire; } }
  function tpEcrire(o) {
    const t = Object.assign(tp(), o);
    memoire = t;
    try { localStorage.setItem(CLE, JSON.stringify(t)); } catch (e) { /* sans stockage : la page en cours marche */ }
    return t;
  }

  /* ---------- le titrage du TP : 10,0 mL de S₀ (Na⁺ + HO⁻) par HCl à 0,100 mol·L⁻¹ ---------- */
  const VEQ = { moyenne: 9.0, ecartType: 0.4 };     // bouteille à 6,0 % : Veq théorique 9,00 mL
  const CHIMIE = {
    titrant: { c: 0.100, ions: { 'H3O+': 1, 'Cl-': 1 } },
    titre: { V: 10.0, ions: { 'Na+': 1, 'HO-': 1 } },
    reaction: { type: 'acide-base', a: 1, b: 1, A: 'H3O+', B: 'HO-', produits: { H2O: 2 },
      titrant: { acide: true, fort: true }, titreAB: { acide: false, fort: true } },
  };
  function nouvellePrise() {
    const p = TITRAGE.chimie.priseEssai(VEQ);
    const prise = { veq: p.veq, decalage: p.decalage, mesures: [] };
    tpEcrire({ prise });
    return prise;
  }
  function prise() { const t = tp(); return t.prise && isFinite(t.prise.veq) ? t.prise : nouvellePrise(); }
  function modele(veq) { return TITRAGE.chimie.creer(Object.assign({ veq }, CHIMIE)); }
  function mesuresAuto(pr) {
    const m = modele(pr.veq);
    return TITRAGE.outils.auto(pr.veq, 16).map(v => [Math.round(v * 10), TITRAGE.chimie.lecturePH(m.pH(v), pr.decalage)]);
  }
  // mesures pour le module 3 : celles de l'élève, sinon une série toute faite (comme « Passer »)
  function mesures() {
    const pr = prise();
    if (pr.mesures && pr.mesures.length >= 5) return { liste: pr.mesures, auto: false };
    pr.mesures = mesuresAuto(pr);
    tpEcrire({ prise: pr });
    return { liste: pr.mesures, auto: true };
  }
  function config(pr) {
    return Object.assign({
      suivi: 'ph', veq: VEQ, prise: pr, pas: [1, 0.2, 0.1], vMax: 25, xMax: 20,
      textes: { burette: ['H₃O⁺ + Cl⁻', 'c_A = 0,100 mol·L⁻¹'], becher: ['S₀' + NB + ': Na⁺ + HO⁻', 'V_B = 10,0 mL'] },
    }, CHIMIE);
  }
  // Veq retenu : celui de l'élève (module 3), sinon l'extrémum de la dérivée de ses mesures, arrondi à 0,1 mL
  function veqDerivee(liste) {
    const m = liste.slice().sort((a, b) => a[0] - b[0]);
    const V = m.map(x => x[0] / 10), P = m.map(x => x[1]);
    return Math.round(V[TITRAGE.outils.extremum(V, TITRAGE.outils.derivee(V, P), -1)] * 10) / 10;
  }
  function veqEleve() {
    const t = tp();
    if (isFinite(t.veqEleve)) return t.veqEleve;
    return veqDerivee(mesures().liste);
  }

  /* ---------- en-tête : sommaire, « Données du TP », « Passer cette partie » ---------- */
  function init(cle, o) {
    o = o || {};
    SOM.menu(cle);
    const bD = document.querySelector('[data-donnees]');
    if (bD) bD.addEventListener('click', donnees);
    const bP = document.querySelector('[data-passer]');
    if (bP && o.passer) bP.addEventListener('click', o.passer);
  }

  /* ---------- écritures mathématiques ---------- */
  const fr = (a, b) => `<span class="tph-frac"><span>${a}</span><span>${b}</span></span>`;
  // racine : le signe est dessiné en SVG et rejoint la barre du dessus, quelle que soit la hauteur
  const rac = x => `<span class="tph-racine"><svg class="tph-racine-s" viewBox="0 0 12 30" preserveAspectRatio="none" aria-hidden="true"><path d="M0.5 18 L3.5 15.5 L7 29 L12 0.8"/></svg><span class="tph-racine-c">${x}</span></span>`;
  const abs = x => `<span class="tph-abs">${x}</span>`;
  const somme = (haut, bas) => `<span class="tph-somme"><small>${haut}</small><span>Σ</span><small>${bas}</small></span>`;
  const CALC = '<span class="calc-icone" role="img" aria-label="À calculer à la calculatrice" title="À calculer à la calculatrice"></span>';
  // nombre avec n chiffres significatifs, à la française, en écriture scientifique si besoin
  function cs(x, n) {
    if (!isFinite(x)) return '';
    if (x === 0) return '0';
    const e = Math.floor(Math.log10(Math.abs(x)));
    if (e < -1 || e >= 4) {
      let m = +(x / Math.pow(10, e)).toFixed(n - 1), e2 = e;
      if (Math.abs(m) >= 10) { m /= 10; e2++; }
      return `${fmt(m, n - 1)} × 10<sup>${String(e2).replace('-', '−')}</sup>`;
    }
    const dec = Math.max(0, n - 1 - e);
    return fmt(+x.toFixed(dec), dec);
  }

  /* ---------- panneau « Données du TP » (comme le sujet du TP) ---------- */
  function donnees() {
    const voile = document.createElement('div');
    voile.className = 'tph-voile';
    voile.innerHTML = `<div class="tph-panneau" role="dialog" aria-modal="true" aria-label="Données du TP">
      <button type="button" class="tph-panneau-x" aria-label="Fermer">✕</button>
      <h3>Données du TP</h3>
      <h4>I. Contexte</h4>
      <p>Un déboucheur de canalisations est une solution concentrée d'hydroxyde de sodium (ou soude${NB}: Na<sup>+</sup>, HO<sup>−</sup>).
        On dispose au bureau professeur d'une bouteille de Destop liquide, appelée solution S.
        Le but du TP est de vérifier l'indication portée sur l'étiquette donnant le titre massique en hydroxyde de sodium.</p>
      <p>Remarques${NB}:</p>
      <ul><li>Les étiquettes de Destop Gel portent l'indication «${NB}solution d'hydroxyde de sodium à 20${NB}%${NB}».</li>
        <li>Les bouteilles de Destop liquide portent généralement l'indication «${NB}solution d'hydroxyde de sodium à 10${NB}%${NB}».</li>
        <li>Notre bouteille de Destop liquide ne porte pas d'indication sur son titre massique.</li></ul>
      <h4>II. Données</h4>
      <h5>Titre massique</h5>
      <p>L'étiquette indique le titre massique, c'est-à-dire le pourcentage massique d'hydroxyde de sodium${NB}: ${fr('m<sub>NaOH</sub>', 'm<sub>solution</sub>')}</p>
      <h5>Masse volumique du Destop</h5>
      <p>ρ<sub>destop</sub> = 1,2 kg·L<sup>−1</sup></p>
      <h5>Masse molaire</h5>
      <p>La masse molaire de l'hydroxyde de sodium est M<sub>NaOH</sub> = 40 g·mol<sup>−1</sup></p>
      <h5>Validité d'un résultat</h5>
      <p>Lorsqu'on effectue n fois une mesure, l'incertitude est de type A et peut se calculer grâce à l'écart-type.
        Ici, soit t le titre massique mesuré par titrage par les n différents groupes, on a${NB}:</p>
      <ul class="tph-donnees-inc">
        <li>t̄ est la moyenne des valeurs t<sub>i</sub> de tous les groupes${NB}:
          <p class="tph-formule-c">t̄ = ${fr('1', 'n')} ${somme('n', 'i = 1')} t<sub>i</sub></p></li>
        <li>L'écart-type représente l'écart entre ces valeurs et la moyenne${NB}:
          <p class="tph-formule-c">σ = ${rac(`${fr('1', 'n − 1')} ${somme('n', 'i = 1')} (t<sub>i</sub> − t̄)<sup>2</sup>`)}</p></li>
        <li>L'incertitude sur la mesure de t est alors
          <p class="tph-formule-c">u(t) = ${fr('σ', '√n')}</p></li>
        <li>La mesure est compatible avec une valeur de référence t<sub>ref</sub> si on a
          <p class="tph-formule-c">${fr(abs('t̄ − t<sub>ref</sub>'), 'u(t)')} ≤ 2</p></li></ul>
      <h5>Dilution</h5>
      <p>La concentration en ions hydroxyde (HO<sup>−</sup>) du Destop est trop grande pour que cette solution soit analysée directement.
        C'est pourquoi le dosage s'effectuera sur une solution diluée 20 fois de Destop. On notera S<sub>0</sub> cette solution diluée.</p>
      <h5>Matériel disponible</h5>
      <ul><li>béchers autant que nécessaire</li><li>fioles jaugées de 50,0 mL et 100,0 mL</li><li>burette graduée</li>
        <li>pipettes jaugées de 5,0 mL et 10,0 mL avec poire à pipeter</li><li>agitateur magnétique</li><li>pH-mètre</li>
        <li>Solutions${NB}: acide chlorhydrique (H<sub>3</sub>O<sup>+</sup> + Cl<sup>−</sup>) à la concentration c<sub>A</sub> = 0,100 mol·L<sup>−1</sup>${NB}; solution S${NB}: Destop liquide pur</li></ul>
      <h5>Titrage</h5>
      <p>On titre V<sub>B</sub> = 10,0 mL de S<sub>0</sub> par l'acide chlorhydrique, en suivant le pH au pH-mètre.</p>
      </div>`;
    document.body.appendChild(voile);
    const avant = document.activeElement;
    const fermer = () => { voile.remove(); document.removeEventListener('keydown', clavier); if (avant) avant.focus(); };
    const clavier = e => { if (e.key === 'Escape') fermer(); };
    document.addEventListener('keydown', clavier);
    voile.addEventListener('click', e => { if (e.target === voile) fermer(); });
    voile.querySelector('.tph-panneau-x').addEventListener('click', fermer);
    voile.querySelector('.tph-panneau-x').focus();
  }

  /* ---------- QCM ----------
     choix = [{ html, juste, diag, avert }] : avert = juste, mais avec un avertissement */
  function qcm(zone, liste, rappel) {
    const d = document.createElement('div');
    d.className = 'tph-qcm';
    d.innerHTML = liste.map((c, i) => `<button type="button" data-i="${i}"><span>${c.html}</span></button>`).join('');
    zone.appendChild(d);
    const ret = document.createElement('div');
    zone.appendChild(ret);
    let erreurs = 0;
    function choisir(i, affichee) {
      const c = liste[i], b = d.querySelector(`[data-i="${i}"]`);
      d.querySelectorAll('button').forEach(x => x.classList.remove('ko'));
      if (c.juste) {
        b.classList.add('ok');
        d.querySelectorAll('button').forEach(x => { x.disabled = true; });
        if (affichee) ret.innerHTML = `<div class="callout tph-retour"><b>Réponse.</b> ${c.diag || ''}</div>`;
        else UI.retour(ret, erreurs ? 'apres' : true, c.diag ? ' ' + c.diag : '');
        if (c.avert) ret.insertAdjacentHTML('beforeend', `<div class="callout-accent tph-retour tph-avert"><b>Attention${NB}!</b> ${c.avert}</div>`);
        rappel && rappel(c);
      } else {
        erreurs++;
        b.classList.add('ko');
        UI.retour(ret, false, ' ' + (c.diag || '') + (erreurs >= 2 ? ' <button type="button" class="btn-small" data-rep>Afficher la réponse</button>' : ''));
        const rep = ret.querySelector('[data-rep]');
        if (rep) rep.addEventListener('click', () => choisir(liste.findIndex(x => x.juste && !x.avert), true));
      }
    }
    d.addEventListener('click', e => { const b = e.target.closest('button'); if (b && !b.disabled) choisir(+b.dataset.i); });
    return { el: d, montrer() { if (!d.querySelector('button.ok')) { erreurs = 0; choisir(liste.findIndex(c => c.juste && !c.avert)); } } };
  }

  /* ---------- petit menu de choix sous un bouton ---------- */
  let menuOuvert = null;
  function fermerMenu() {
    if (!menuOuvert) return;
    menuOuvert.m.remove();
    menuOuvert.b.setAttribute('aria-expanded', 'false');
    document.removeEventListener('pointerdown', horsMenu, true);
    document.removeEventListener('keydown', echapMenu);
    menuOuvert = null;
  }
  function horsMenu(e) { if (menuOuvert && !menuOuvert.m.contains(e.target) && e.target !== menuOuvert.b) fermerMenu(); }
  function echapMenu(e) { if (e.key === 'Escape') { const b = menuOuvert.b; fermerMenu(); b.focus(); } }
  function menu(bouton, options, rappel) {
    if (menuOuvert && menuOuvert.b === bouton) { fermerMenu(); return; }
    fermerMenu();
    const m = document.createElement('div');
    m.className = 'tph-menu';
    m.setAttribute('role', 'menu');
    m.innerHTML = options.map((o, i) => `<button type="button" role="menuitem" data-i="${i}">${o.html}</button>`).join('');
    document.body.appendChild(m);
    const r = bouton.getBoundingClientRect();
    const x = Math.min(window.scrollX + r.left, window.scrollX + document.documentElement.clientWidth - m.offsetWidth - 8);
    let y = window.scrollY + r.bottom + 4;
    if (r.bottom + m.offsetHeight + 8 > window.innerHeight && r.top > m.offsetHeight + 8) y = window.scrollY + r.top - m.offsetHeight - 4;
    m.style.left = Math.max(8, x) + 'px';
    m.style.top = y + 'px';
    bouton.setAttribute('aria-expanded', 'true');
    menuOuvert = { m, b: bouton };
    m.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; const o = options[+b.dataset.i]; fermerMenu(); rappel(o); });
    setTimeout(() => document.addEventListener('pointerdown', horsMenu, true));
    document.addEventListener('keydown', echapMenu);
    m.querySelector('button').focus();
  }

  /* ---------- étiquettes à placer dans des cases ----------
     o = { etiquettes: [{ id, html }], reserve, selecteurCible, racine, copie (l'étiquette reste dans la réserve),
           poser(id, cible), retirer(cible, id) }
     Toucher l'étiquette (elle se met en valeur) puis la case ; ou la glisser sur la case.
     Toucher une case remplie, sans étiquette choisie : l'étiquette revient dans la réserve. */
  function placeur(o) {
    let choisie = null;
    const parId = {};
    const cibles = () => (o.racine || document).querySelectorAll(o.selecteurCible);
    function choisir(b) {
      if (choisie) choisie.setAttribute('aria-pressed', 'false');
      choisie = b && b !== choisie ? b : null;
      if (choisie) choisie.setAttribute('aria-pressed', 'true');
      cibles().forEach(c => c.classList.toggle('cible', !!choisie && !c.classList.contains('ok')));
    }
    function creerEtiq(e) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'tph-etiq';
      b.dataset.id = e.id;
      b.innerHTML = `<span>${e.html}</span>`;
      b.setAttribute('aria-pressed', 'false');
      if (window.DragDrop) {
        let x0 = 0, y0 = 0;
        b.addEventListener('pointerdown', ev => { x0 = ev.clientX; y0 = ev.clientY; });
        DragDrop.enable(b, {
          zoneSelector: o.selecteurCible,
          onDrop: (it, zone, ev) => {
            const bouge = Math.hypot(ev.clientX - x0, ev.clientY - y0) > 6;
            if (zone && bouge && (!o.racine || o.racine.contains(zone))) { choisir(null); poserDans(e.id, zone); }
            else if (!bouge) choisir(b);              // simple appui : on choisit l'étiquette
          },
        });
        b.addEventListener('click', ev => { if (ev.detail === 0) choisir(b); });   // clavier
      } else b.addEventListener('click', () => choisir(b));
      parId[e.id] = b;
      return b;
    }
    o.etiquettes.forEach(e => o.reserve.appendChild(creerEtiq(e)));
    function poserDans(id, cible) {
      if (cible.classList.contains('ok')) return;
      const ancien = cible.dataset.pose;
      if (ancien && !o.copie && parId[ancien]) parId[ancien].hidden = false;
      cible.dataset.pose = id;
      if (!o.copie) parId[id].hidden = true;
      cibles().forEach(c => c.classList.remove('cible'));
      o.poser(id, cible);
    }
    (o.racine || document).addEventListener('click', ev => {
      const c = ev.target.closest(o.selecteurCible);
      if (!c || c.classList.contains('ok')) return;
      if (choisie) { const id = choisie.dataset.id; choisir(null); poserDans(id, c); }
      else if (c.dataset.pose) {
        const id = c.dataset.pose;
        delete c.dataset.pose;
        if (!o.copie && parId[id]) parId[id].hidden = false;
        o.retirer && o.retirer(c, id);
      }
    });
    return { poser: poserDans, etiquette: id => parId[id], deselectionner: () => choisir(null), ajouter(e) { o.reserve.appendChild(creerEtiq(e)); } };
  }

  /* ============================================================
     Module 1a : matériel de dilution (cartes ; facteur affiché après validation)
     ============================================================ */
  const MATERIEL = [
    { id: 'becher', nom: 'béchers' },
    { id: 'fiole50', nom: 'fiole jaugée 50,0 mL', fiole: 50 },
    { id: 'fiole100', nom: 'fiole jaugée 100,0 mL', fiole: 100 },
    { id: 'burette', nom: 'burette graduée' },
    { id: 'pipette5', nom: 'pipette jaugée 5,0 mL', pipette: 5 },
    { id: 'pipette10', nom: 'pipette jaugée 10,0 mL', pipette: 10 },
    { id: 'agitateur', nom: 'agitateur magnétique' },
    { id: 'phmetre', nom: 'pH-mètre' },
  ];
  function materiel(zone, o) {
    o = o || {};
    const choix = new Set();
    zone.innerHTML = `<div class="tph-cartes-mat" data-r="mat">${MATERIEL.map(m => `<button type="button" class="tph-carte-mat" data-id="${m.id}" aria-pressed="false">
        <svg viewBox="0 0 80 120" aria-hidden="true">${TITRAGE.verrerie(m.id)}</svg><span>${m.nom}</span></button>`).join('')}</div>
      <div class="tph-actions"><button type="button" class="btn-primary tph-btn" data-r="valider">Valider le matériel</button>
        <p class="tph-facteur" data-r="facteur" aria-live="polite"></p></div>
      <div data-r="retour"></div>`;
    const R = n => zone.querySelector(`[data-r="${n}"]`);
    const mat = R('mat');
    const basculer = el => {
      const id = el.dataset.id;
      if (choix.has(id)) choix.delete(id); else choix.add(id);
      el.setAttribute('aria-pressed', choix.has(id));
      R('retour').innerHTML = ''; R('facteur').innerHTML = '';
    };
    mat.addEventListener('click', e => { const el = e.target.closest('[data-id]'); if (el && !R('valider').disabled) basculer(el); });
    const pris = () => MATERIEL.filter(m => choix.has(m.id));
    // facteur obtenu (après validation) : F = Vfiole / Vpipette
    function facteur() {
      const f = pris().filter(m => m.fiole), p = pris().filter(m => m.pipette);
      R('facteur').innerHTML = f.length === 1 && p.length === 1
        ? `F = ${fr(fmt(f[0].fiole, 1), fmt(p[0].pipette, 1))} = <span>${fmt(f[0].fiole / p[0].pipette)}</span>` : '';
    }
    let erreurs = 0;
    R('valider').addEventListener('click', () => {
      const P = pris(), f = P.filter(m => m.fiole), p = P.filter(m => m.pipette), ids = P.map(m => m.id);
      let diag = null;
      if (ids.includes('phmetre') || ids.includes('agitateur')) diag = 'Le pH-mètre et l’agitateur magnétique ne servent pas à la dilution.';
      else if (ids.includes('burette') || !p.length) diag = 'Pour prélever un volume précis, on utilise une pipette jaugée.';
      else if (!f.length) diag = 'Le volume final doit être précis' + NB + ': fiole jaugée.';
      else if (f.length > 1 || p.length > 1) diag = 'Choisis une seule pipette jaugée et une seule fiole jaugée.';
      else {
        const F = f[0].fiole / p[0].pipette;
        if (F !== 20) diag = `F = ${fmt(F)}${NB}: la solution ne serait diluée que ${fmt(F)} fois.`;
      }
      facteur();
      if (diag) { erreurs++; UI.retour(R('retour'), false, ' ' + diag); return; }
      UI.retour(R('retour'), erreurs ? 'apres' : true, ' La pipette jaugée de 5,0 mL et la fiole jaugée de 100,0 mL donnent F = 20.' +
        (ids.includes('becher') ? ' Le bécher sert à verser un peu de Destop pour le prélever à la pipette.' : ''));
      R('valider').disabled = true;
      mat.classList.add('fini');
      o.fini && o.fini({ fiole: f[0].fiole, pipette: p[0].pipette });
    });
    // « Passer cette partie » : le bon matériel, validé
    return { remplir() {
      if (R('valider').disabled) return;
      mat.querySelectorAll('[data-id]').forEach(el => { if (choix.has(el.dataset.id) !== ['pipette5', 'fiole100'].includes(el.dataset.id)) basculer(el); });
      erreurs = 0; R('valider').click();
    } };
  }

  /* ============================================================
     Module 1b : schéma du montage à compléter
     ============================================================ */
  const ETIQ = {
    hcl:  { html: 'H₃O⁺ + Cl⁻ (acide chlorhydrique)', zone: 'bur_esp', cat: 'esp' },
    soude:{ html: 'S₀' + NB + ': Na⁺ + HO⁻', zone: 'bec_esp', cat: 'esp' },
    ca:   { html: 'c<sub>A</sub> = 0,100 mol·L⁻¹', zone: 'bur_c', cat: 'c' },
    cb:   { html: 'c<sub>B</sub> inconnue', zone: 'bec_c', cat: 'c' },
    veq:  { html: 'V<sub>eq</sub> (volume versé à la burette graduée)', zone: 'bur_v', cat: 'v' },
    vb:   { html: 'V<sub>B</sub> = 10,0 mL à la pipette jaugée', zone: 'bec_v', cat: 'v' },
    agit: { html: 'agitation', zone: 'agit', cat: 'agit' },
  };
  const CAT_ZONE = { bur_esp: 'esp', bec_esp: 'esp', bur_c: 'c', bec_c: 'c', bur_v: 'v', bec_v: 'v', agit: 'agit' };
  function diagEtiquette(id, zone) {
    const e = ETIQ[id], cz = CAT_ZONE[zone];
    if (e.cat !== cz) return { esp: 'Cette zone attend les espèces de la solution.', c: 'Cette zone attend une concentration.', v: 'Cette zone attend un volume.', agit: 'Sous le bécher' + NB + ': l’agitateur magnétique.' }[cz];
    if (e.cat === 'esp') return 'La burette contient la solution titrante, de concentration connue' + NB + '; le bécher, la solution titrée, prélevée à la pipette jaugée.';
    if (e.cat === 'c') return 'c<sub>A</sub> est connue' + NB + ': c’est la concentration de la solution titrante, dans la burette. c<sub>B</sub> est inconnue' + NB + ': c’est la solution titrée, dans le bécher.';
    if (e.cat === 'v') return 'V<sub>B</sub> est prélevé à la pipette jaugée et versé dans le bécher' + NB + '; V<sub>eq</sub> est le volume versé par la burette graduée.';
    return '';
  }
  const APPAREILS = [
    { id: 'ph', html: 'pH-mètre' },
    { id: 'conductimetre', html: 'conductimètre', diag: 'On suit ici le pH, pas la conductivité.' },
    { id: 'indicateur', html: 'quelques gouttes d’indicateur coloré', diag: 'Un indicateur repère l’équivalence par un changement de couleur, sans mesure' + NB + ': on ne pourrait pas tracer de courbe.' },
  ];
  function schema(zone, o) {
    o = o || {};
    zone.innerHTML = `<div class="tph-schema">
        <div class="tph-schema-fig" data-r="fig"></div>
        <div class="tph-schema-cote" data-r="cote">
          <p class="tph-etape-t"><span class="tph-num">1</span>Complète le schéma du montage.</p>
          <p class="ttr-consigne">Touche une étiquette puis la zone où elle va (ou fais-la glisser). Les trois zones du haut décrivent la burette, les trois du bas le bécher. Place aussi l’appareil de mesure.</p>
          <div class="tph-reserve"><p class="tph-reserve-t">Étiquettes</p><div class="tph-etiquettes" data-r="reserve"></div></div>
          <div class="tph-reserve"><p class="tph-reserve-t">Appareil de mesure</p><div class="tph-etiquettes" data-r="appareils"></div></div>
          <div class="tph-actions"><button type="button" class="btn-primary tph-btn" data-r="verifier">Vérifier le schéma</button></div>
          <div data-r="retour"></div>
        </div></div>`;
    const R = n => zone.querySelector(`[data-r="${n}"]`);
    const M = TITRAGE.montage(R('fig'), { style: 'epure', aCompleter: true });
    const zones = M.zones;
    let appareilOk = false, erreurs = 0, fini = false;
    const remplir = (z, id) => { z.classList.add('pleine'); z.classList.remove('ko'); z.dataset.pose = id; z.innerHTML = `<span>${ETIQ[id].html}</span>`; };
    const vider = z => { z.classList.remove('pleine', 'ko'); delete z.dataset.pose; z.innerHTML = `<span class="ttr-zone-vide">${z.dataset.attente ? z.dataset.attente + NB + '?' : '?'}</span>`; };
    for (const id in zones) if (id !== 'app') zones[id].classList.add('tph-z-etiq');
    zones.app.classList.add('tph-z-app');
    placeur({
      etiquettes: Object.keys(ETIQ).map(k => ({ id: k, html: ETIQ[k].html })).sort(() => Math.random() - 0.5),
      reserve: R('reserve'), selecteurCible: '.tph-z-etiq', racine: zone,
      poser: (id, c) => { remplir(c, id); R('retour').innerHTML = ''; }, retirer: c => vider(c),
    });
    // appareil de mesure : choisir la carte, puis toucher la zone (ou glisser)
    placeur({
      etiquettes: APPAREILS.map(a => ({ id: a.id, html: a.html })), reserve: R('appareils'), selecteurCible: '.tph-z-app', racine: zone,
      poser: (id, c) => {
        const a = APPAREILS.find(x => x.id === id);
        if (a.diag) { erreurs++; delete c.dataset.pose; R('appareils').querySelector(`[data-id="${id}"]`).hidden = false; UI.retour(R('retour'), false, ' ' + a.diag); return; }
        poserPH();
        R('retour').innerHTML = '';
        verifierFin();
      },
    });
    function poserPH() {
      appareilOk = true;
      zones.app.classList.add('ok'); zones.app.hidden = true;
      M.poserAppareil('ph');
      M.el.querySelector('[data-r="cadre-app"]').remove();
      R('appareils').closest('.tph-reserve').hidden = true;
    }
    function verifierFin() {
      const toutes = Object.keys(zones).filter(z => z !== 'app').every(z => zones[z].classList.contains('ok'));
      if (toutes && appareilOk && !fini) {
        fini = true;
        R('verifier').hidden = true;
        UI.retour(R('retour'), erreurs ? 'apres' : true, ' Le schéma est complet.');
        o.fini && o.fini();
      }
    }
    R('verifier').addEventListener('click', () => {
      const ids = Object.keys(zones).filter(z => z !== 'app');
      if (ids.some(z => !zones[z].dataset.pose)) { UI.retour(R('retour'), false, ' Complète toutes les zones en pointillés.'); return; }
      let diag = null;
      ids.forEach(z => {
        const id = zones[z].dataset.pose;
        if (ETIQ[id].zone === z) { zones[z].classList.add('ok'); zones[z].classList.remove('pleine', 'ko'); }
        else { zones[z].classList.add('ko'); if (!diag) diag = diagEtiquette(id, z); }
      });
      if (diag) { erreurs++; UI.retour(R('retour'), false, ' ' + diag); return; }
      if (!appareilOk) { UI.retour(R('retour'), 'apres', ' Les étiquettes sont bien placées. Place maintenant l’appareil de mesure.'); return; }
      verifierFin();
    });
    // « Passer cette partie » : tout est placé juste
    return { montage: M, cote: R('cote'), remplir() {
      if (fini) return;
      for (const z in zones) if (z !== 'app' && !zones[z].classList.contains('ok')) remplir(zones[z], Object.keys(ETIQ).find(k => ETIQ[k].zone === z));
      R('reserve').querySelectorAll('.tph-etiq').forEach(b => { b.hidden = true; });
      if (!appareilOk) poserPH();
      erreurs = 0; R('verifier').click();
    } };
  }

  /* ============================================================
     Phrase et équation : morceaux à toucher dans l'ordre
     ============================================================ */
  function constructeur(zone, o) {
    // o = { morceaux: [{ id, html }], vide, lire(ids) → diag | null, solution, rendu(suite, parId), fini }
    zone.innerHTML = `<div class="tph-phrase vide" data-r="phrase"></div>
      <div class="tph-etiquettes" data-r="pool" style="margin-top:8px"></div>
      <div class="tph-actions"><button type="button" class="btn-primary tph-btn" data-r="valider">Valider</button>
        <button type="button" class="btn-small" data-r="effacer">Effacer</button></div>
      <div data-r="retour"></div>`;
    const R = n => zone.querySelector(`[data-r="${n}"]`);
    const ph = R('phrase'), pool = R('pool');
    ph.dataset.vide = o.vide;
    let suite = [], erreurs = 0, fini = false;
    const parId = Object.fromEntries(o.morceaux.map(m => [m.id, m]));
    const majPhrase = () => {
      ph.classList.toggle('vide', !suite.length);
      ph.classList.remove('ok', 'ko');
      ph.innerHTML = o.rendu ? o.rendu(suite, parId) : suite.map((id, i) => `<button type="button" class="tph-etiq touche" data-i="${i}"><span>${parId[id].html}</span></button>`).join('');
      pool.querySelectorAll('[data-id]').forEach(b => { b.disabled = suite.includes(b.dataset.id); });
    };
    pool.innerHTML = o.morceaux.slice().sort(() => Math.random() - 0.5).map(m => `<button type="button" class="tph-etiq touche" data-id="${m.id}"><span>${m.html}</span></button>`).join('');
    pool.addEventListener('click', e => { const b = e.target.closest('[data-id]'); if (!b || b.disabled || fini) return; suite.push(b.dataset.id); R('retour').innerHTML = ''; majPhrase(); });
    ph.addEventListener('click', e => { const b = e.target.closest('[data-i]'); if (!b || fini) return; suite.splice(+b.dataset.i, 1); majPhrase(); });
    R('effacer').addEventListener('click', () => { if (fini) return; suite = []; majPhrase(); });
    majPhrase();
    R('valider').addEventListener('click', () => {
      if (fini) return;
      if (!suite.length) { UI.retour(R('retour'), false, ' Touche les morceaux dans l’ordre pour écrire ta réponse.'); return; }
      const diag = o.lire(suite);
      if (diag) {
        erreurs++;
        ph.classList.add('ko');
        UI.retour(R('retour'), false, ' ' + diag + (erreurs >= 2 ? ' <button type="button" class="btn-small" data-r="rep">Afficher la réponse</button>' : ''));
        const rep = R('retour').querySelector('[data-r="rep"]');
        if (rep) rep.addEventListener('click', () => terminer(true));
        return;
      }
      terminer(false);
    });
    function terminer(affichee) {
      if (fini) return;
      fini = true;
      ph.className = 'tph-phrase ok';
      ph.innerHTML = o.solution;
      zone.querySelectorAll('[data-r="pool"], [data-r="valider"], [data-r="effacer"]').forEach(x => { x.hidden = true; });
      if (affichee) R('retour').innerHTML = `<div class="callout tph-retour"><b>Réponse.</b> ${o.solution}</div>`;
      else UI.retour(R('retour'), erreurs ? 'apres' : true, o.bravo ? ' ' + o.bravo : '');
      o.fini && o.fini();
    }
    return { remplir() { erreurs = 0; terminer(false); } };
  }

  // « On trace le pH en fonction du volume V d'acide versé. »
  function phrase(zone, o) {
    o = o || {};
    const M = [
      { id: 'trace', html: 'On trace' }, { id: 'ph', html: 'le pH' }, { id: 'fdu', html: 'en fonction du' }, { id: 'v', html: 'volume V d’acide versé' },
      { id: 'leV', html: 'le volume V' }, { id: 'fdupH', html: 'en fonction du pH' }, { id: 'sigma', html: 'la conductivité σ' },
      { id: 'veq', html: 'le volume équivalent V<sub>eq</sub>' }, { id: 'vb', html: 'le volume V<sub>B</sub> de S₀' },
    ];
    const lire = ids => {
      if (ids.join(' ') === 'trace ph fdu v') return null;
      if (ids.includes('sigma')) return 'On suit ici le pH avec un pH-mètre, pas la conductivité.';
      if (ids.includes('veq') || ids.includes('vb')) return 'Le pH est mesuré pour chaque volume V versé' + NB + ': ni V<sub>eq</sub> (un seul volume), ni V<sub>B</sub> (le volume de S₀ dans le bécher).';
      if (ids.includes('fdupH') || (ids.includes('leV') && !ids.includes('ph')) || (ids.indexOf('v') > -1 && ids.indexOf('v') < ids.indexOf('ph')))
        return 'On trace y en fonction de x' + NB + ': le pH en ordonnée, V en abscisse.';
      return 'Remets les morceaux dans l’ordre' + NB + ': «' + NB + 'On trace … en fonction du …' + NB + '».';
    };
    return constructeur(zone, { morceaux: M, vide: 'Touche les morceaux de phrase dans l’ordre', lire,
      solution: 'On trace le pH en fonction du volume V d’acide versé.', fini: o.fini });
  }

  // H₃O⁺ + HO⁻ → 2 H₂O
  function equation(zone, o) {
    o = o || {};
    const M = [{ id: 'h3o', html: 'H₃O⁺' }, { id: 'ho', html: 'HO⁻' }, { id: 'na', html: 'Na⁺' }, { id: 'cl', html: 'Cl⁻' },
      { id: 'h2o', html: 'H₂O' }, { id: '2h2o', html: '2 H₂O' }, { id: 'fl', html: '→' }];
    const lire = ids => {
      const k = ids.indexOf('fl');
      if (k < 0) return 'Sépare les réactifs et les produits par la flèche «' + NB + '→' + NB + '».';
      const reac = ids.slice(0, k), prod = ids.slice(k + 1);
      if (ids.some(x => x === 'na' || x === 'cl')) return 'Na⁺ et Cl⁻ ne réagissent pas' + NB + ': ce sont des ions spectateurs.';
      if (reac.slice().sort().join(' ') !== 'h3o ho') return 'Les réactifs sont l’ion H₃O⁺ apporté par la burette et l’ion HO⁻ présent dans le bécher.';
      if (prod.join(' ') === 'h2o') return 'Compte les H et les O' + NB + ': H₃O⁺ + HO⁻ contient 4 H et 2 O.';
      if (prod.join(' ') !== '2h2o') return 'La réaction forme de l’eau' + NB + ': compte les H et les O.';
      return null;
    };
    return constructeur(zone, {
      morceaux: M, vide: 'Touche les réactifs, puis →, puis les produits', lire,
      // les « + » se placent tout seuls entre deux espèces du même côté
      rendu: (suite, parId) => suite.map((id, i) => `${i > 0 && id !== 'fl' && suite[i - 1] !== 'fl' ? '<span class="tph-phrase-fixe">+</span>' : ''}<button type="button" class="tph-etiq touche" data-i="${i}"><span>${parId[id].html}</span></button>`).join(''),
      solution: 'H₃O⁺ + HO⁻ → 2 H₂O', fini: o.fini,
    });
  }

  /* ============================================================
     Outil de calcul : formule à choisir, valeurs à placer, calcul automatique
     TPH.calcul(zone, {
       mode: 'cartes' | 'ligne',      une grandeur à la fois ; ou toutes les grandeurs en lignes
       valeurs: [{ id, html, sym, val, v }],   étiquettes : html (étiquette), sym (diagnostics),
                                               val (écrit dans la case), v (nombre ou liste)
       grandeurs: [{ id, nom, tete,          tete : début de ligne à la place de « nom = »
         prelim: [{ q, cartes: [{ html, juste, diag }] }],   étapes littérales avant la formule (titre massique)
         formules: [{ html, juste, diag, cases: [ids], gabarit(cases) }],   une seule formule juste et imposee : pas de choix
         imposee,                     la formule juste est donnée (après prelim)
         libres: [[i, j]],            cases dont l'ordre n'a pas d'importance (t_i − t̄ ou t̄ − t_i)
         detail(vals, ids) → html     calcul détaillé, affiché tout seul avant le résultat
         calc(vals) → nombre, resultat(x) → html, etiquette(x) → html,
         diagCase(attendu, pose) → diag | null, solution(vals, x) → html, apres(x, zone, suite) }],
       fini(resultats) }) → { remplir(), res }
     La formule littérale reste écrite pendant l'application numérique.
     ============================================================ */
  function calcul(zone, o) {
    o = Object.assign({ mode: 'cartes' }, o);
    const valeurs = {};
    o.valeurs.forEach(v => { valeurs[v.id] = v; });
    const res = {}, faits = {};
    let k = 0;
    zone.innerHTML = `<div class="tph-calc tph-calc-${o.mode}">
        <div class="tph-chaine" data-r="chaine"></div>
        <div data-r="etape"></div>
        <div data-r="retour"></div>
        <div class="tph-reserve"><p class="tph-reserve-t">Valeurs à placer</p><div class="tph-etiquettes" data-r="reserve"></div></div>
      </div>`;
    const R = n => zone.querySelector(`[data-r="${n}"]`);
    const pl = placeur({
      etiquettes: o.valeurs.map(v => ({ id: v.id, html: v.html })), reserve: R('reserve'), selecteurCible: '.tph-case', racine: zone, copie: true,
      poser: (id, c) => { c.classList.add('pleine'); c.classList.remove('ko'); c.innerHTML = `<span>${valeurs[id].val || valeurs[id].html}</span>`; R('retour').innerHTML = ''; verifierCases(); },
      retirer: c => { c.classList.remove('pleine', 'ko'); c.innerHTML = '<span>?</span>'; },
    });
    const juste = g => g.formules.find(f => f.juste);
    const tete = g => g.tete != null ? g.tete : `${g.nom} =`;          // début de ligne : « c0 = » (ou texte propre)
    // ligne d'une grandeur faite (repliée) : nom = formule littérale = résultat
    function ligneFaite(g) {
      return `<span class="tph-calc-n">${tete(g)}</span> ${juste(g).html} = <span class="tph-res">${g.resultat(res[g.id])}</span>`;
    }
    function chaine() {
      const ch = R('chaine');
      if (o.mode === 'ligne') {
        ch.innerHTML = o.grandeurs.map((g, i) => `<div class="tph-chaine-l ${i < k ? 'fait' : i === k ? 'ici' : 'avenir'}">
          <div class="tph-calc-l" data-r="l${i}">${i < k ? ligneFaite(g) : i === k ? '' : `<span class="tph-calc-n">${tete(g)}</span> <span class="tph-petit">à calculer ensuite</span>`}</div></div>`).join('');
      } else ch.innerHTML = o.grandeurs.slice(0, k).map(g => `<p class="tph-resume">✓ ${tete(g)} ${juste(g).html} = <span class="tph-res">${g.resultat(res[g.id])}</span></p>`).join('');
    }
    let courante = null, formule = null, erreurs = 0;
    const zoneEtape = () => o.mode === 'ligne' ? R('l' + k) : R('etape');
    function etape() {
      chaine();
      if (o.mode !== 'ligne') R('etape').innerHTML = '';
      if (k >= o.grandeurs.length) { o.fini && o.fini(res); return; }
      courante = o.grandeurs[k]; formule = null; erreurs = 0;
      const z = zoneEtape();
      z.innerHTML = `${o.mode === 'ligne' ? '' : `<p class="tph-etape-t"><span class="tph-num">${k + 1}</span>${courante.titre || `Choisis la formule de ${courante.nom}, puis place les valeurs.`}</p>`}<div data-r="prelim"></div><div data-r="choix"></div>`;
      if (courante.prelim) prelim(0); else cartes();
      UI.defiler(z);
    }
    // étapes littérales (titre massique) : une question, des cartes ; la ligne juste s'ajoute
    function prelim(i) {
      const z = zoneEtape(), P = courante.prelim;
      if (i >= P.length) { cartes(); return; }
      const e = P[i], pz = z.querySelector('[data-r="choix"]');
      pz.innerHTML = `<p class="tph-q">${e.q}</p><div class="tph-formules">${e.cartes.map((c, j) => ({ c, j })).sort(() => Math.random() - 0.5)
        .map(x => `<button type="button" class="tph-formule" data-j="${x.j}"><span>${x.c.html}</span></button>`).join('')}</div>`;
      pz.querySelector('.tph-formules').addEventListener('click', ev => {
        const b = ev.target.closest('[data-j]');
        if (!b) return;
        const c = e.cartes[+b.dataset.j];
        if (!c.juste) { b.classList.add('ko'); UI.retour(R('retour'), false, ' ' + c.diag); return; }
        R('retour').innerHTML = '';
        z.querySelector('[data-r="prelim"]').insertAdjacentHTML('beforeend', `<p class="tph-calc-l tph-prelim-l">${c.html}</p>`);
        prelim(i + 1);
      });
      UI.defiler(pz);
    }
    function cartes() {
      const g = courante, z = zoneEtape(), cz = z.querySelector('[data-r="choix"]');
      if (g.imposee) { choisirFormule(juste(g)); return; }
      const cs_ = g.formules.map((f, i) => ({ f, i })).sort(() => Math.random() - 0.5);
      cz.innerHTML = `${o.mode === 'ligne' ? `<span class="tph-calc-n">${tete(g)}</span>` : ''}<div class="tph-formules">${cs_.map(c => `<button type="button" class="tph-formule" data-f="${c.i}"><span>${o.mode === 'ligne' ? '' : tete(g) + ' '}${c.f.html}</span></button>`).join('')}</div>`;
      cz.querySelector('.tph-formules').addEventListener('click', e => {
        const b = e.target.closest('[data-f]');
        if (!b || formule) return;
        const f = g.formules[+b.dataset.f];
        if (!f.juste) { erreurs++; b.classList.add('ko'); UI.retour(R('retour'), false, ' ' + f.diag); return; }
        choisirFormule(f);
      });
    }
    // formule choisie : la formule littérale reste écrite, suivie des cases à remplir
    function choisirFormule(f) {
      formule = f;
      R('retour').innerHTML = '';
      const z = zoneEtape(), cz = z.querySelector('[data-r="choix"]');
      cz.innerHTML = `<div class="tph-calc-l"><span class="tph-calc-n">${tete(courante)}</span> ${f.html} = ${f.gabarit(f.cases.map((c, i) => `<button type="button" class="tph-case" data-c="${i}"><span>?</span></button>`))}<span data-r="res"></span></div>`;
      UI.defiler(cz);
    }
    function verifierCases() {
      const cases = [...zone.querySelectorAll('.tph-case')];
      if (!formule || !cases.length || cases.some(c => !c.dataset.pose)) return;
      const att = formule.cases.slice(), pose = cases.map(c => c.dataset.pose);
      // cases dont l'ordre est libre : on accepte la permutation
      (courante.libres || []).forEach(grp => {
        const a = grp.map(i => att[i]).sort().join('|'), p = grp.map(i => pose[i]).sort().join('|');
        if (a === p) grp.forEach(i => { att[i] = pose[i]; });
      });
      let diag = null;
      cases.forEach((c, i) => {
        if (att[i] === pose[i]) { c.classList.add('ok'); c.classList.remove('pleine'); }
        else { c.classList.add('ko'); if (!diag) diag = (courante.diagCase && courante.diagCase(att[i], pose[i])) || `Ici, il faut ${valeurs[att[i]].sym || valeurs[att[i]].html}.`; }
      });
      if (diag) { erreurs++; UI.retour(R('retour'), false, ' ' + diag); return; }
      terminerGrandeur(pose, erreurs ? 'apres' : true);
    }
    function terminerGrandeur(ids, ok) {
      const g = courante;
      const vals = formule.cases.map(c => valeurs[c].v);        // ordre de la formule (le calcul n'en dépend pas)
      const x = g.calc(vals);
      res[g.id] = x;
      faits[g.id] = { ids, vals: ids.map(id => valeurs[id].v) };
      const zr = zoneEtape().querySelector('[data-r="res"]');
      // calcul détaillé (tout seul), puis le résultat
      zr.innerHTML = `${g.detail ? ` <span class="tph-detail">= ${g.detail(faits[g.id].vals, ids)}</span>` : ''} = <span class="tph-res">${g.resultat(x)}</span> ${CALC}`;
      UI.retour(R('retour'), ok, g.solution ? ' ' + g.solution(vals, x) : '');
      if (g.etiquette) {
        const e = { id: g.id, html: g.etiquette(x), sym: g.nom, val: g.resultat(x), v: x };
        valeurs[e.id] = e;
        pl.ajouter(e);
      }
      const suite = () => { R('retour').innerHTML = ''; k++; etape(); };
      if (g.apres) g.apres(x, R('retour'), suite);
      else {
        const b = document.createElement('button');
        b.type = 'button'; b.className = 'btn-primary tph-btn'; b.textContent = k + 1 < o.grandeurs.length ? 'Continuer →' : 'Terminer';
        b.style.marginTop = '8px';
        b.addEventListener('click', suite);
        R('retour').appendChild(b);
        UI.defiler(b);
      }
    }
    etape();
    // « Passer cette partie » : tout se calcule avec les bonnes formules et les bonnes valeurs
    return { res, remplir() {
      while (k < o.grandeurs.length) {
        const g = o.grandeurs[k], f = juste(g);
        res[g.id] = g.calc(f.cases.map(c => valeurs[c].v));
        faits[g.id] = { ids: f.cases.slice(), vals: f.cases.map(c => valeurs[c].v) };
        if (g.etiquette) { const e = { id: g.id, html: g.etiquette(res[g.id]), sym: g.nom, val: g.resultat(res[g.id]), v: res[g.id] }; valeurs[e.id] = e; pl.ajouter(e); }
        if (g.passer) g.passer(res[g.id]);
        k++;
      }
      R('retour').innerHTML = '';
      etape();
    } };
  }

  window.TPH = { PLAN, init, donnees, tp, tpEcrire, prise, nouvellePrise, modele, mesuresAuto, mesures, config, veqEleve, veqDerivee,
    qcm, menu, fermerMenu, placeur, materiel, schema, phrase, equation, calcul, fr, rac, abs, somme, cs, CALC, fmt, NB };
})();
