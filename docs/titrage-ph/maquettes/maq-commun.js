/* ============================================================
   Maquettes « TP : titrage pH-métrique du Destop » : outils communs
   (espace de noms TPHM, seulement pour les maquettes de l'étape 1 ;
   ce qui sera retenu passera dans titrage-ph/modules/tph.js)

   TPHM.init(cle, { passer })      sommaire (vrai PLAN de l'application), boutons
                                   « Données du TP » et « Passer cette partie → » de l'en-tête
   TPHM.choix(id, libelle, options, defaut, rappel)
                                   choix d'une variante de la maquette (barre « Maquette »),
                                   gardé dans le navigateur ; rappel(valeur) à chaque changement
   TPHM.donnees()                  ouvre le panneau « Données du TP »
   TPHM.tp() / TPHM.tpEcrire(o)    ce que l'élève a fait (clé « maquette-tph-tp »)
   TPHM.prise()                    prise d'essai en cours { veq, decalage, mesures: [[v en dixièmes, pH]] }
   TPHM.nouvellePrise()            nouveau tirage, mesures effacées
   TPHM.modele(veq)                modèle TITRAGE.chimie du TP (HCl 0,100 mol·L⁻¹ / 10,0 mL de S₀)
   TPHM.mesuresAuto(prise)         mesures de « Passer cette partie » (comme le tableau du TP)
   TPHM.champ({ aria, signe })     champ numérique ± → { el, input, valeur(), desactiver(b) }
   TPHM.lire(texte)                nombre écrit à la française (virgule ou point, − ou -)
   TPHM.retour(zone, ok, html)     encadré « Juste ! » / « Ce n'est pas ça. »
   TPHM.qcm(zone, choix, rappel)   boutons de choix ; choix = [{ html, juste, diag }]
   TPHM.menu(bouton, options, rappel)   petit menu de choix sous un bouton (trous, zones)
   TPHM.placeur(o)                 étiquettes à placer dans des cases : toucher l'étiquette puis la case, ou glisser
   TPHM.copierRegressi(mesures, zoneMsg)   copie « V;pH » au format CSV pour Regressi
   TPHM.defiler(el)                amène el à l'écran (téléphone), sans remonter
   ============================================================ */
(function () {
  'use strict';

  const NB = ' ';
  const fmt = (x, d) => TITRAGE.outils.fmt(x, d);

  /* ---------- plan de l'application (le vrai, §3 du prompt) ---------- */
  const PLAN = [
    { n: 1, titre: 'Préparer le titrage', desc: 'Dilution, montage, réaction de titrage', sousModules: true,
      parties: [
        { nom: 'Diluer 20 fois le Destop', entrainement: 'module_1a_dilution', noms: { entrainement: 'Diluer 20 fois le Destop' } },
        { nom: 'Schéma du montage', entrainement: 'module_1b_montage', noms: { entrainement: 'Schéma du montage' } },
        { nom: 'Réaction et équivalence', entrainement: 'module_1c_reaction', noms: { entrainement: 'Réaction et équivalence' } }] },
    { n: 2, titre: 'Réaliser le titrage', desc: 'Simulateur de titrage pH-métrique',
      parties: [{ nom: 'Simulateur de titrage', simulation: 'module_2_titrage', noms: { simulation: 'Simulateur de titrage' } }] },
    { n: 3, titre: 'Exploiter le titrage', desc: 'Volume équivalent, titre massique', sousModules: true, fiche: 'fiche_3',
      parties: [
        { nom: 'Repérer le volume équivalent', slug: 'tangentes', entrainement: 'module_3a_equivalence', noms: { entrainement: 'Repérer le volume équivalent' } },
        { nom: 'Calculer le titre massique', entrainement: 'module_3b_titre', noms: { entrainement: 'Calculer le titre massique' } }] },
    { n: 4, titre: 'Valider le résultat', desc: 'Incertitudes et compatibilité',
      parties: [{ nom: 'Incertitudes et compatibilité', entrainement: 'module_4_incertitudes', noms: { entrainement: 'Incertitudes et compatibilité' } }] },
  ];

  /* ---------- stockage (toujours dans un try/catch) ---------- */
  const CLE = 'maquette-tph-tp';
  function tp() { try { return JSON.parse(localStorage.getItem(CLE)) || {}; } catch (e) { return memoire; } }
  let memoire = {};
  function tpEcrire(o) {
    const t = Object.assign(tp(), o);
    memoire = t;
    try { localStorage.setItem(CLE, JSON.stringify(t)); } catch (e) { /* sans stockage : la page en cours marche */ }
    return t;
  }

  /* ---------- prise d'essai (Veq tiré, jamais affiché) ---------- */
  function nouvellePrise() {
    const p = TITRAGE.chimie.priseEssai({ moyenne: 9.0, ecartType: 0.4 });
    const prise = { veq: p.veq, decalage: p.decalage, mesures: [] };
    tpEcrire({ prise });
    return prise;
  }
  function prise() { const t = tp(); return t.prise && isFinite(t.prise.veq) ? t.prise : nouvellePrise(); }

  // titrage du TP : 10,0 mL de S₀ (Na⁺ + HO⁻) par l'acide chlorhydrique (H₃O⁺ + Cl⁻) à 0,100 mol·L⁻¹
  function modele(veq) {
    return TITRAGE.chimie.creer({
      titrant: { c: 0.100, ions: { 'H3O+': 1, 'Cl-': 1 } },
      titre: { V: 10.0, ions: { 'Na+': 1, 'HO-': 1 } },
      reaction: { type: 'acide-base', a: 1, b: 1, A: 'H3O+', B: 'HO-', produits: { H2O: 2 },
        titrant: { acide: true, fort: true }, titreAB: { acide: false, fort: true } },
      veq,
    });
  }
  function mesuresAuto(pr) {
    const m = modele(pr.veq);
    return TITRAGE.outils.auto(pr.veq, 16).map(v => [Math.round(v * 10), TITRAGE.chimie.lecturePH(m.pH(v), pr.decalage)]);
  }

  /* ---------- en-tête et sommaire ---------- */
  function init(cle, o) {
    o = o || {};
    SOM.init({ nom: 'TP : titrage pH-métrique du Destop', id: 'maquette-tph', plan: PLAN });
    SOM.menu(cle);
    // liens du sommaire : portail du dépôt ; fiche Regressi (étape 2) → présentation des maquettes
    document.querySelectorAll('#app-nav a[href]').forEach(a => {
      const h = a.getAttribute('href');
      if (h === '../../index.html') a.setAttribute('href', '../../../../index.html');
      else if (/^fiche_3/.test(h)) a.setAttribute('href', '../index.html#regressi');
    });
    const bD = document.querySelector('[data-donnees]');
    if (bD) bD.addEventListener('click', donnees);
    const bP = document.querySelector('[data-passer]');
    if (bP && o.passer) bP.addEventListener('click', o.passer);
    // bouton « Maquette · variantes » : ouvre / ferme le panneau des choix (état gardé)
    const bM = document.querySelector('[data-maq]'), barre = document.querySelector('.maq-bar');
    if (bM && barre) {
      const ouvrir = b => {
        barre.classList.toggle('ouvert', b); bM.setAttribute('aria-expanded', b);
        try { localStorage.setItem('maquette-tph-panneau', b ? '1' : '0'); } catch (e) { /* rien */ }
      };
      let ouvert = true;
      try { ouvert = localStorage.getItem('maquette-tph-panneau') !== '0'; } catch (e) { /* rien */ }
      ouvrir(ouvert && window.innerWidth >= 900);
      bM.addEventListener('click', () => ouvrir(!barre.classList.contains('ouvert')));
      const x = document.createElement('button');
      x.type = 'button'; x.className = 'btn-small'; x.textContent = 'Fermer ce panneau';
      x.style.alignSelf = 'flex-end';
      x.addEventListener('click', () => { ouvrir(false); bM.focus(); });
      barre.appendChild(x);
    }
  }

  /* ---------- choix de variante (barre « Maquette ») ---------- */
  function choix(id, libelle, options, defaut, rappel) {
    const barre = document.querySelector('.maq-bar');
    const fermer = barre.querySelector(':scope > .btn-small');
    const cleS = 'maquette-tph-choix-' + id;
    let v = defaut;
    try { v = localStorage.getItem(cleS) || defaut; } catch (e) { /* rien */ }
    if (!options.some(op => op.v === v)) v = defaut;
    const d = document.createElement('div');
    d.className = 'maq-choix';
    d.innerHTML = `<span class="maq-choix-l">${libelle}</span>` + options.map(op =>
      `<button type="button" data-v="${op.v}" aria-pressed="${op.v === v}"><span class="maq-lettre">${op.l}</span>${op.t}</button>`).join('');
    barre.insertBefore(d, fermer);
    d.addEventListener('click', e => {
      const b = e.target.closest('button');
      if (!b) return;
      v = b.dataset.v;
      d.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x === b));
      try { localStorage.setItem(cleS, v); } catch (err) { /* rien */ }
      rappel(v);
    });
    return v;
  }

  /* ---------- panneau « Données du TP » (✕, Échap, voile) ---------- */
  function donnees() {
    const voile = document.createElement('div');
    voile.className = 'tph-voile';
    voile.innerHTML = `<div class="tph-panneau" role="dialog" aria-modal="true" aria-label="Données du TP">
      <button type="button" class="tph-panneau-x" aria-label="Fermer">✕</button>
      <h3>Données du TP</h3>
      <p>Un déboucheur de canalisations est une solution concentrée d'<b>hydroxyde de sodium</b> (soude${NB}: Na<sup>+</sup> + HO<sup>−</sup>). Solution S${NB}: Destop liquide pur. Le Destop gel porte «${NB}solution d'hydroxyde de sodium à 20${NB}%${NB}», le Destop liquide généralement «${NB}à 10${NB}%${NB}» ; notre bouteille ne porte pas d'indication.</p>
      <div class="tph-donnees-g">
        <div><h4>Titre massique</h4><p>t = <span class="tph-fr"><span>m<sub>NaOH</sub></span><span>m<sub>solution</sub></span></span></p>
          <p>ρ<sub>Destop</sub> = 1,2 kg·L<sup>−1</sup> ; M<sub>NaOH</sub> = 40 g·mol<sup>−1</sup></p></div>
        <div><h4>Dilution et titrage</h4><p>Le dosage se fait sur une solution S<sub>0</sub> <b>diluée 20 fois</b>. On titre V<sub>B</sub> = 10,0 mL de S<sub>0</sub> par l'acide chlorhydrique (H<sub>3</sub>O<sup>+</sup> + Cl<sup>−</sup>), c<sub>A</sub> = 0,100 mol·L<sup>−1</sup>, suivi au pH-mètre.</p></div>
        <div><h4>Matériel disponible</h4><ul><li>béchers autant que nécessaire</li><li>fioles jaugées de 50,0 mL et 100,0 mL</li><li>burette graduée</li><li>pipettes jaugées de 5,0 mL et 10,0 mL avec poire à pipeter</li><li>agitateur magnétique ; pH-mètre</li><li>acide chlorhydrique à 0,100 mol·L<sup>−1</sup> ; solution S</li></ul></div>
        <div><h4>Validité d'un résultat (type A)</h4>
          <p>t̄ = <span class="tph-fr"><span>1</span><span>n</span></span> Σ t<sub>i</sub> ; σ = √[ <span class="tph-fr"><span>1</span><span>n − 1</span></span> Σ (t<sub>i</sub> − t̄)<sup>2</sup> ]</p>
          <p>u(t) = <span class="tph-fr"><span>σ</span><span>√n</span></span> ; compatible avec t<sub>ref</sub> si <span class="tph-fr"><span>|t̄ − t<sub>ref</sub>|</span><span>u(t)</span></span> ≤ 2</p></div>
      </div></div>`;
    document.body.appendChild(voile);
    const avant = document.activeElement;
    const fermer = () => { voile.remove(); document.removeEventListener('keydown', clavier); if (avant) avant.focus(); };
    const clavier = e => { if (e.key === 'Escape') fermer(); };
    document.addEventListener('keydown', clavier);
    voile.addEventListener('click', e => { if (e.target === voile) fermer(); });
    voile.querySelector('.tph-panneau-x').addEventListener('click', fermer);
    voile.querySelector('.tph-panneau-x').focus();
  }

  /* ---------- saisie d'un nombre ---------- */
  const surOrdi = () => window.matchMedia && window.matchMedia('(hover: hover)').matches;
  function champ(o) {
    o = o || {};
    const d = document.createElement('span');
    d.className = 'tph-champ-box';
    d.innerHTML = `${o.signe === false ? '' : '<button type="button" class="tph-pm" aria-label="Changer le signe" title="Changer le signe">±</button>'}
      <input type="text" class="tph-champ" inputmode="decimal" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="${o.aria || 'Réponse'}">`;
    const input = d.querySelector('input'), pm = d.querySelector('.tph-pm');
    if (pm) pm.addEventListener('click', () => {
      const t = input.value.trim();
      input.value = /^[−-]/.test(t) ? t.replace(/^[−-]\s*/, '') : '−' + t;
      if (surOrdi()) input.focus();               // pas de clavier qui masque la question sur téléphone
    });
    return { el: d, input, valeur: () => lire(input.value), desactiver(b) { input.disabled = b; if (pm) pm.disabled = b; } };
  }
  function lire(t) {
    const s = String(t).trim().replace(/\s| | /g, '').replace(',', '.').replace('−', '-');
    if (!/^-?\d*\.?\d+$|^-?\d+\.$/.test(s)) return NaN;
    return parseFloat(s);
  }

  /* ---------- retours ---------- */
  function retour(zone, ok, html) {
    zone.innerHTML = `<div class="${ok ? 'callout-success' : 'callout-danger'} tph-retour" role="status"><b>${ok === 'apres' ? 'C’est juste.' : ok ? 'Juste !' : 'Ce n’est pas ça.'}</b>${html || ''}</div>`;
    defiler(zone);
  }
  function defiler(el) {
    if (!el) return;
    requestAnimationFrame(() => el.scrollIntoView({ block: 'nearest', behavior: 'smooth' }));
  }

  /* ---------- QCM ---------- */
  function qcm(zone, liste, rappel) {
    const d = document.createElement('div');
    d.className = 'tph-qcm';
    d.innerHTML = liste.map((c, i) => `<button type="button" data-i="${i}">${c.html}</button>`).join('');
    zone.appendChild(d);
    const ret = document.createElement('div');
    zone.appendChild(ret);
    let erreurs = 0;
    d.addEventListener('click', e => {
      const b = e.target.closest('button');
      if (!b || b.disabled) return;
      const c = liste[+b.dataset.i];
      d.querySelectorAll('button').forEach(x => x.classList.remove('ko'));
      if (c.juste) {
        b.classList.add('ok');
        d.querySelectorAll('button').forEach(x => { x.disabled = true; });
        retour(ret, erreurs ? 'apres' : true, c.diag ? ' ' + c.diag : '');
        rappel && rappel(true);
      } else {
        erreurs++;
        b.classList.add('ko');
        retour(ret, false, ' ' + (c.diag || ''));
      }
    });
    return { el: d, montrer() { const i = liste.findIndex(c => c.juste); d.querySelector(`[data-i="${i}"]`).click(); } };
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
    // au-dessus du bouton s'il n'y a pas la place en dessous
    if (r.bottom + m.offsetHeight + 8 > window.innerHeight && r.top > m.offsetHeight + 8) y = window.scrollY + r.top - m.offsetHeight - 4;
    m.style.left = Math.max(8, x) + 'px';
    m.style.top = y + 'px';
    bouton.setAttribute('aria-expanded', 'true');
    menuOuvert = { m, b: bouton };
    m.addEventListener('click', e => {
      const b = e.target.closest('button');
      if (!b) return;
      const o = options[+b.dataset.i];
      fermerMenu();
      rappel(o);
    });
    setTimeout(() => document.addEventListener('pointerdown', horsMenu, true));
    document.addEventListener('keydown', echapMenu);
    m.querySelector('button').focus();
  }

  /* ---------- étiquettes à placer dans des cases ----------
     o = { etiquettes: [{ id, html }], reserve: élément, selecteurCible: '.tph-case',
           copie: false (vrai : l'étiquette reste dans la réserve, on pose une copie),
           glisser: true, toucher: true,
           poser(id, cible), retirer(cible) }
     Toucher l'étiquette (elle se met en valeur) puis toucher la case ; ou la glisser sur la case.
     Toucher une case remplie, sans étiquette choisie : l'étiquette revient dans la réserve. */
  function placeur(o) {
    let choisie = null;
    const parId = {};
    function choisir(b) {
      if (choisie) choisie.setAttribute('aria-pressed', 'false');
      choisie = b && b !== choisie ? b : null;
      if (choisie) choisie.setAttribute('aria-pressed', 'true');
      document.querySelectorAll(o.selecteurCible).forEach(c => c.classList.toggle('cible', !!choisie && !c.classList.contains('ok')));
    }
    function creerEtiq(e) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'tph-etiq' + (o.glisser === false ? ' touche' : '');
      b.dataset.id = e.id;
      b.innerHTML = `<span>${e.html}</span>`;
      b.setAttribute('aria-pressed', 'false');
      if (o.glisser !== false && window.DragDrop) {
        let x0 = 0, y0 = 0;
        b.addEventListener('pointerdown', ev => { x0 = ev.clientX; y0 = ev.clientY; });
        DragDrop.enable(b, {
          zoneSelector: o.selecteurCible,
          onDrop: (it, zone, ev) => {
            const bouge = Math.hypot(ev.clientX - x0, ev.clientY - y0) > 6;
            if (zone && bouge) { choisir(null); poserDans(e.id, zone); }
            else if (!bouge) choisir(b);              // simple appui : on choisit l'étiquette
          },
        });
        // clavier (Entrée, Espace) : click sans pointeur
        b.addEventListener('click', ev => { if (ev.detail === 0) choisir(b); });
      } else {
        b.addEventListener('click', () => choisir(b));
      }
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
      o.poser(id, cible);
      document.querySelectorAll(o.selecteurCible).forEach(c => c.classList.remove('cible'));
    }
    // délégation : toucher une case
    document.addEventListener('click', ev => {
      const c = ev.target.closest(o.selecteurCible);
      if (!c || (o.racine && !o.racine.contains(c)) || c.classList.contains('ok')) return;
      if (choisie) { const id = choisie.dataset.id; choisir(null); poserDans(id, c); }
      else if (c.dataset.pose) {
        const id = c.dataset.pose;
        delete c.dataset.pose;
        if (!o.copie && parId[id]) parId[id].hidden = false;
        o.retirer && o.retirer(c, id);
      }
    });
    return { poser: poserDans, etiquette: id => parId[id], deselectionner: () => choisir(null),
      ajouter(e) { o.reserve.appendChild(creerEtiq(e)); } };
  }

  /* ---------- copie pour Regressi : CSV, point-virgule, virgule décimale ---------- */
  function texteRegressi(mesures) {
    return 'V;pH\n' + mesures.map(([d, p]) => fmt(d / 10).replace(/ /g, '') + ';' + fmt(p, 2)).join('\n') + '\n';
  }
  function copierRegressi(mesures, zone) {
    const texte = texteRegressi(mesures);
    const reussi = () => { zone.innerHTML = `<p class="ttr-msg ok">Mesures copiées. Dans Regressi${NB}: Fichier → Nouveau → Presse-papier.</p>`; };
    const zoneTexte = () => {
      zone.innerHTML = `<p class="ttr-msg">Copie-le (Ctrl + C)${NB}:</p><textarea class="ttr-copie-zone" readonly></textarea>`;
      const ta = zone.querySelector('textarea');
      ta.value = texte; ta.focus(); ta.select();
    };
    const repli = () => {
      try {
        const ta = document.createElement('textarea');
        ta.value = texte; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
        document.body.appendChild(ta); ta.select();
        const ok = document.execCommand('copy');
        ta.remove();
        ok ? reussi() : zoneTexte();
      } catch (e) { zoneTexte(); }
    };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(texte).then(reussi, repli);
    else repli();
    return texte;
  }

  window.TPHM = { PLAN, init, choix, donnees, tp, tpEcrire, prise, nouvellePrise, modele, mesuresAuto,
    champ, lire, retour, qcm, menu, fermerMenu, placeur, copierRegressi, texteRegressi, defiler, fmt, NB };
})();
