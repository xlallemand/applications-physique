/* ============================================================
   Maquettes du module 1 : outils de « Préparer le titrage »
   TPHM.materiel(zone, { mode: 'paillasse' | 'cartes', direct: true, fini(choix) })
       matériel de dilution à choisir ; facteur affiché en direct ou non
   TPHM.schema(zone, { mode: 'reserve' | 'zone', style, fini() })
       schéma du montage à compléter (étiquettes) + appareil de mesure à placer
   TPHM.phrase(zone, { mode: 'morceaux' | 'trous', fini() })
       « On trace le pH en fonction du volume V d'acide versé. »
   TPHM.equation(zone, { mode: 'morceaux' | 'trous', fini() })
       H₃O⁺ + HO⁻ → 2 H₂O
   Chaque outil peut exister en plusieurs exemplaires dans la page (pas d'id, pas d'état global).
   ============================================================ */
(function () {
  'use strict';
  const NB = ' ';

  /* ============================================================
     Matériel de dilution
     ============================================================ */
  // dessins (boîte de 80 × 120, base posée en y = 112), traits à l'encre, verre blanc
  const T = 'stroke="var(--ink)" stroke-width="1.6" fill="var(--sheet)" stroke-linejoin="round"';
  const L = 'stroke="var(--ink)" stroke-width="1.2" fill="none"';
  const SOL = 'fill="rgba(170,205,230,.55)" stroke="none"';
  const DESSINS = {
    becher: `<path d="M18 46 l4 4 v62 h36 v-64" ${T}/><path d="M23 82 v29 h34 v-29 z" ${SOL}/><path d="M50 60 h8 M50 72 h8 M50 84 h8 M50 96 h8" ${L}/>`,
    fiole50: `<path d="M36 40 v28 c-14 6 -18 16 -18 26 c0 12 8 18 22 18 c14 0 22 -6 22 -18 c0 -10 -4 -20 -18 -26 v-28 z" ${T}/><path d="M33 52 h14" stroke="var(--ink)" stroke-width="1.6"/><text x="40" y="100" text-anchor="middle" style="font:800 9px var(--font-sans)" fill="var(--ink)">50 mL</text>`,
    fiole100: `<path d="M35 18 v38 c-18 8 -24 22 -24 34 c0 16 10 22 29 22 c19 0 29 -6 29 -22 c0 -12 -6 -26 -24 -34 v-38 z" ${T}/><path d="M32 32 h16" stroke="var(--ink)" stroke-width="1.6"/><text x="40" y="96" text-anchor="middle" style="font:800 10px var(--font-sans)" fill="var(--ink)">100 mL</text>`,
    burette: `<rect x="36" y="4" width="8" height="94" ${T}/><path d="M36 14 h4 M36 24 h4 M36 34 h6 M36 44 h4 M36 54 h4 M36 64 h6 M36 74 h4 M36 84 h4" ${L}/><rect x="30" y="98" width="20" height="5" rx="2" ${T}/><path d="M38 103 l2 9 l2 -9" ${T}/>`,
    pipette5: `<circle cx="40" cy="12" r="9" fill="var(--paper-3)" stroke="var(--ink)" stroke-width="1.4"/><path d="M38.5 21 v26 c-4 2 -5 6 -5 10 c0 4 1 8 5 10 v42 l1.5 3 l1.5 -3 v-42 c4 -2 5 -6 5 -10 c0 -4 -1 -8 -5 -10 v-26 z" ${T}/><path d="M36 32 h8" stroke="var(--ink)" stroke-width="1.6"/><text x="52" y="60" style="font:800 9px var(--font-sans)" fill="var(--ink)">5 mL</text>`,
    pipette10: `<circle cx="40" cy="12" r="9" fill="var(--paper-3)" stroke="var(--ink)" stroke-width="1.4"/><path d="M38.5 21 v20 c-7 3 -9 8 -9 14 c0 6 2 11 9 14 v40 l1.5 3 l1.5 -3 v-40 c7 -3 9 -8 9 -14 c0 -6 -2 -11 -9 -14 v-20 z" ${T}/><path d="M36 30 h8" stroke="var(--ink)" stroke-width="1.6"/><text x="52" y="58" style="font:800 9px var(--font-sans)" fill="var(--ink)">10 mL</text>`,
    agitateur: `<rect x="8" y="84" width="64" height="28" rx="4" fill="var(--paper)" stroke="var(--ink)" stroke-width="1.6"/><circle cx="60" cy="98" r="5" ${T}/><rect x="22" y="78" width="22" height="5" rx="2.5" fill="var(--ink)"/>`,
    phmetre: `<rect x="6" y="64" width="54" height="48" rx="5" fill="var(--paper)" stroke="var(--ink)" stroke-width="1.6"/><rect x="12" y="70" width="42" height="18" rx="2" fill="var(--ink)"/><text x="50" y="84" text-anchor="end" style="font:800 11px var(--font-sans)" fill="var(--sheet)">7,00</text><path d="M58 76 c12 -6 14 -30 14 -46" stroke="var(--ink-2)" stroke-width="2" fill="none"/><rect x="69" y="18" width="6" height="40" rx="3" ${T}/>`,
  };
  const MATERIEL = [
    { id: 'becher', nom: ['béchers'] },
    { id: 'fiole50', nom: ['fiole jaugée', '50,0 mL'], fiole: 50 },
    { id: 'fiole100', nom: ['fiole jaugée', '100,0 mL'], fiole: 100 },
    { id: 'burette', nom: ['burette', 'graduée'] },
    { id: 'pipette5', nom: ['pipette jaugée', '5,0 mL'], pipette: 5 },
    { id: 'pipette10', nom: ['pipette jaugée', '10,0 mL'], pipette: 10 },
    { id: 'agitateur', nom: ['agitateur', 'magnétique'] },
    { id: 'phmetre', nom: ['pH-mètre'] },
  ];
  const v1 = x => TITRAGE.outils.fmt(x, 1);

  function materiel(zone, o) {
    o = Object.assign({ mode: 'paillasse', direct: true }, o || {});
    const choix = new Set();
    zone.innerHTML = `<div data-r="mat"></div>
      <p class="tph-facteur" data-r="facteur" aria-live="polite"></p>
      <div class="tph-actions"><button type="button" class="btn-primary" data-r="valider">Valider le matériel</button></div>
      <div data-r="retour"></div>`;
    const R = n => zone.querySelector(`[data-r="${n}"]`);
    const mat = R('mat');
    if (o.mode === 'paillasse') {
      // paillasse dessinée : deux rangées de quatre objets ; chaque objet est un bouton
      const cases = MATERIEL.map((m, i) => {
        const x = (i % 4) * 90, y = Math.floor(i / 4) * 162;
        return `<g class="tph-objet" role="button" tabindex="0" aria-pressed="false" data-id="${m.id}" aria-label="${m.nom.join(' ')}" transform="translate(${x} ${y})">
          <rect class="fond" x="3" y="2" width="84" height="156" rx="12"/>
          <g transform="translate(5 4)">${DESSINS[m.id]}</g>
          <rect x="3" y="118" width="84" height="3" fill="var(--paper-3)"/>
          ${m.nom.map((t, k) => `<text class="tph-objet-nom" x="45" y="${136 + k * 13}" text-anchor="middle">${t}</text>`).join('')}
        </g>`;
      }).join('');
      mat.className = 'tph-paillasse';
      mat.innerHTML = `<svg viewBox="0 0 360 324" role="group" aria-label="Matériel disponible sur la paillasse">${cases}</svg>`;
    } else {
      mat.className = 'tph-cartes-mat';
      mat.innerHTML = MATERIEL.map(m => `<button type="button" class="tph-carte-mat" data-id="${m.id}" aria-pressed="false">
        <svg viewBox="0 0 80 120" aria-hidden="true">${DESSINS[m.id]}</svg><span>${m.nom.join(' ')}</span></button>`).join('');
    }
    const basculer = el => {
      const id = el.dataset.id;
      if (choix.has(id)) choix.delete(id); else choix.add(id);
      el.setAttribute('aria-pressed', choix.has(id));
      el.classList.toggle('choisi', choix.has(id));
      R('retour').innerHTML = '';
      facteur(o.direct);
    };
    mat.addEventListener('click', e => { const el = e.target.closest('[data-id]'); if (el) basculer(el); });
    mat.addEventListener('keydown', e => { const el = e.target.closest('.tph-objet'); if (el && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); basculer(el); } });

    const pris = () => MATERIEL.filter(m => choix.has(m.id));
    function facteur(montrer) {
      const f = pris().filter(m => m.fiole), p = pris().filter(m => m.pipette);
      R('facteur').innerHTML = montrer && f.length === 1 && p.length === 1
        ? `F = <span class="tph-fr"><span>${v1(f[0].fiole)}</span><span>${v1(p[0].pipette)}</span></span> = <span>${TITRAGE.outils.fmt(f[0].fiole / p[0].pipette)}</span>` : '';
    }
    let erreurs = 0;
    R('valider').addEventListener('click', () => {
      const P = pris(), f = P.filter(m => m.fiole), p = P.filter(m => m.pipette), ids = P.map(m => m.id);
      let diag = null;
      if (ids.includes('phmetre') || ids.includes('agitateur')) diag = `Le pH-mètre et l'agitateur magnétique ne servent pas à la dilution.`;
      else if (ids.includes('burette') || (ids.includes('becher') && !p.length)) diag = 'Pour prélever un volume précis, on utilise une pipette jaugée.';
      else if (!p.length) diag = 'Pour prélever un volume précis, on utilise une pipette jaugée.';
      else if (!f.length) diag = 'Le volume final doit être précis : fiole jaugée.';
      else if (f.length > 1 || p.length > 1) diag = 'Choisis une seule pipette jaugée et une seule fiole jaugée.';
      else {
        const F = f[0].fiole / p[0].pipette;
        if (F !== 20) diag = `F = ${TITRAGE.outils.fmt(F)} : la solution ne serait diluée que ${TITRAGE.outils.fmt(F)} fois.`;
      }
      facteur(true);
      if (diag) { erreurs++; TPHM.retour(R('retour'), false, ' ' + diag); return; }
      TPHM.retour(R('retour'), erreurs ? 'apres' : true, ` F = 100,0 / 5,0 = 20.`);
      R('valider').disabled = true;
      mat.style.pointerEvents = 'none';
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
     Schéma du montage à compléter
     ============================================================ */
  const ETIQ = {
    hcl:  { html: 'H₃O⁺ + Cl⁻ (acide chlorhydrique)', zone: 'bur_esp', cat: 'esp' },
    soude:{ html: 'S₀${NB}: Na⁺ + HO⁻', zone: 'bec_esp', cat: 'esp' },
    ca:   { html: 'c<sub>A</sub> = 0,100 mol·L⁻¹', zone: 'bur_c', cat: 'c' },
    cb:   { html: 'c<sub>B</sub> inconnue', zone: 'bec_c', cat: 'c' },
    veq:  { html: 'V<sub>eq</sub> (volume versé à la burette graduée)', zone: 'bur_v', cat: 'v' },
    vb:   { html: 'V<sub>B</sub> = 10,0 mL à la pipette jaugée', zone: 'bec_v', cat: 'v' },
    agit: { html: 'agitation', zone: 'agit', cat: 'agit' },
  };
  for (const k in ETIQ) ETIQ[k].html = ETIQ[k].html.replace('${NB}', NB);
  // variante « toucher la zone » : choix proposés pour chaque zone (prompt §5.2)
  const PAR_ZONE = {
    bur_esp: [{ id: 'hcl' }, { id: 'soude', html: 'Na⁺ + HO⁻ (S₀)' }],
    bur_c: [{ id: 'ca' }, { id: 'cb' }],
    bur_v: [{ id: 'veq' }, { id: 'vb', html: 'V<sub>B</sub> = 10,0 mL' }],
    bec_esp: [{ id: 'soude' }, { id: 'hcl', html: 'H₃O⁺ + Cl⁻' }],
    bec_c: [{ id: 'cb' }, { id: 'ca' }],
    bec_v: [{ id: 'vb' }, { id: 'veq', html: 'V<sub>eq</sub>' }],
    agit: [{ id: 'agit' }],
  };
  const CAT_ZONE = { bur_esp: 'esp', bec_esp: 'esp', bur_c: 'c', bec_c: 'c', bur_v: 'v', bec_v: 'v', agit: 'agit' };
  function diagEtiquette(id, zone) {
    const e = ETIQ[id], cz = CAT_ZONE[zone];
    if (e.cat !== cz) return { esp: 'Cette zone attend les espèces de la solution.', c: 'Cette zone attend une concentration.', v: 'Cette zone attend un volume.', agit: 'Sous le bécher : l’agitateur magnétique.' }[cz];
    if (e.cat === 'esp') return 'La burette contient la solution titrante, de concentration connue ; le bécher, la solution titrée, prélevée à la pipette jaugée.';
    if (e.cat === 'c') return 'c<sub>A</sub> est connue : c’est la concentration de la solution titrante, dans la burette. c<sub>B</sub> est inconnue : c’est la solution titrée, dans le bécher.';
    if (e.cat === 'v') return 'V<sub>B</sub> est prélevé à la pipette jaugée et versé dans le bécher ; V<sub>eq</sub> est le volume versé par la burette graduée.';
    return '';
  }
  const APPAREILS = [
    { id: 'ph', html: 'pH-mètre' },
    { id: 'conductimetre', html: 'conductimètre', diag: 'On suit ici le pH, pas la conductivité.' },
    { id: 'indicateur', html: 'quelques gouttes d’indicateur coloré', diag: 'Un indicateur repère l’équivalence par un changement de couleur, sans mesure : on ne pourrait pas tracer de courbe.' },
  ];

  function schema(zone, o) {
    o = Object.assign({ mode: 'reserve', style: 'epure' }, o || {});
    zone.innerHTML = `<div class="tph-schema">
        <div class="tph-schema-fig" data-r="fig"></div>
        <div class="tph-schema-cote">
          <p class="tph-consigne" data-r="consigne">${o.mode === 'reserve'
            ? 'Complète le schéma : touche une étiquette puis la zone où elle va (ou fais-la glisser). Place aussi l’appareil de mesure.'
            : 'Complète le schéma : touche une zone en pointillés et choisis ce qu’il faut y écrire. Place aussi l’appareil de mesure.'}</p>
          ${o.mode === 'reserve' ? '<div class="tph-reserve"><p class="tph-reserve-t">Étiquettes</p><div class="tph-etiquettes" data-r="reserve"></div></div>' : ''}
          <div class="tph-reserve"><p class="tph-reserve-t">Appareil de mesure</p><div class="tph-etiquettes" data-r="appareils"></div></div>
          <div class="tph-actions"><button type="button" class="btn-primary" data-r="verifier">Vérifier le schéma</button></div>
          <div data-r="retour"></div>
        </div></div>`;
    const R = n => zone.querySelector(`[data-r="${n}"]`);
    const M = TPHM.montage(R('fig'), { style: o.style, aCompleter: true });
    const zones = M.zones;
    let appareilOk = false, erreurs = 0;
    const remplir = (z, id, html) => {
      z.classList.add('pleine'); z.classList.remove('ko');
      z.dataset.pose = id;
      z.innerHTML = `<span>${html || ETIQ[id].html}</span>`;
    };
    const vider = z => { z.classList.remove('pleine', 'ko'); delete z.dataset.pose; z.innerHTML = '<span class="ttr-zone-vide">?</span>'; };
    for (const id in zones) if (id !== 'app') zones[id].classList.add('tph-z-etiq');
    zones.app.classList.add('tph-z-app');
    zones.app.innerHTML = '<span class="ttr-zone-vide">appareil de mesure ?</span>';

    if (o.mode === 'reserve') {
      TPHM.placeur({
        etiquettes: Object.keys(ETIQ).map(k => ({ id: k, html: ETIQ[k].html })).sort(() => Math.random() - 0.5),
        reserve: R('reserve'), selecteurCible: '.tph-z-etiq', racine: zone,
        poser: (id, c) => remplir(c, id), retirer: c => vider(c),
      });
    } else {
      for (const id in zones) if (id !== 'app') zones[id].addEventListener('click', () => {
        if (zones[id].classList.contains('ok')) return;
        TPHM.menu(zones[id], PAR_ZONE[id].map(c => ({ id: c.id, html: c.html || ETIQ[c.id].html })).sort(() => Math.random() - 0.5),
          c => { remplir(zones[id], c.id, c.html); R('retour').innerHTML = ''; });
      });
    }
    // appareil de mesure : choisir la carte, puis toucher la zone (ou glisser)
    TPHM.placeur({
      etiquettes: APPAREILS.map(a => ({ id: a.id, html: a.html })), reserve: R('appareils'), selecteurCible: '.tph-z-app', racine: zone,
      poser: (id, c) => {
        const a = APPAREILS.find(x => x.id === id);
        if (a.diag) { erreurs++; delete c.dataset.pose; R('appareils').querySelector(`[data-id="${id}"]`).hidden = false; TPHM.retour(R('retour'), false, ' ' + a.diag); return; }
        appareilOk = true;
        c.classList.add('ok'); c.hidden = true;
        M.poserAppareil('ph');
        R('appareils').closest('.tph-reserve').hidden = true;
        R('retour').innerHTML = '';
        verifierFin();
      },
    });
    function verifierFin() {
      const toutes = Object.keys(zones).filter(z => z !== 'app').every(z => zones[z].classList.contains('ok'));
      if (toutes && appareilOk) {
        R('verifier').hidden = true;
        TPHM.retour(R('retour'), erreurs ? 'apres' : true, ' Le schéma est complet.');
        o.fini && o.fini();
      }
    }
    R('verifier').addEventListener('click', () => {
      const ids = Object.keys(zones).filter(z => z !== 'app');
      if (ids.some(z => !zones[z].dataset.pose)) { TPHM.retour(R('retour'), false, ' Complète toutes les zones en pointillés.'); return; }
      let diag = null;
      ids.forEach(z => {
        const id = zones[z].dataset.pose;
        if (ETIQ[id].zone === z) { zones[z].classList.add('ok'); zones[z].classList.remove('pleine', 'ko'); zones[z].innerHTML = `<span>${ETIQ[id].html}</span>`; }
        else { zones[z].classList.add('ko'); if (!diag) diag = diagEtiquette(id, z); }
      });
      if (diag) { erreurs++; TPHM.retour(R('retour'), false, ' ' + diag); return; }
      if (!appareilOk) { TPHM.retour(R('retour'), 'apres', ' Les étiquettes sont bien placées. Place maintenant l’appareil de mesure.'); return; }
      verifierFin();
    });
    // « Passer cette partie » : tout est placé juste
    return { montage: M, remplir() {
      for (const z in zones) if (z !== 'app' && !zones[z].classList.contains('ok')) remplir(zones[z], Object.keys(ETIQ).find(k => ETIQ[k].zone === z));
      if (R('reserve')) R('reserve').querySelectorAll('.tph-etiq').forEach(b => { b.hidden = true; });
      if (!appareilOk) { appareilOk = true; zones.app.hidden = true; M.poserAppareil('ph'); R('appareils').closest('.tph-reserve').hidden = true; }
      erreurs = 0; R('verifier').click();
    } };
  }

  /* ============================================================
     Phrase et équation à construire (morceaux à toucher, ou trous)
     ============================================================ */
  function constructeur(zone, o) {
    // o = { morceaux: [{ id, html }], trous: [[ids…], …], gabarit(trousHTML) → html, lire(ids) → diag | null, solution, mode, vide, fini }
    zone.innerHTML = `<div data-r="phrase"></div>
      ${o.mode === 'morceaux' ? '<div class="tph-etiquettes" data-r="pool" style="margin-top:8px"></div>' : ''}
      <div class="tph-actions"><button type="button" class="btn-primary" data-r="valider">Valider</button>
        <button type="button" class="btn-small" data-r="effacer">Effacer</button></div>
      <div data-r="retour"></div>`;
    const R = n => zone.querySelector(`[data-r="${n}"]`);
    const ph = R('phrase');
    let suite = [], erreurs = 0, fini = false;
    const parId = Object.fromEntries(o.morceaux.map(m => [m.id, m]));
    if (o.mode === 'morceaux') {
      ph.className = 'tph-phrase vide';
      ph.dataset.vide = o.vide;
      const pool = R('pool');
      const majPhrase = () => {
        ph.classList.toggle('vide', !suite.length);
        ph.classList.remove('ok', 'ko');
        ph.innerHTML = o.rendu ? o.rendu(suite, parId) : suite.map((id, i) => `<button type="button" class="tph-etiq touche" data-i="${i}"><span>${parId[id].html}</span></button>`).join('');
        pool.querySelectorAll('[data-id]').forEach(b => { b.disabled = !o.reutilisable && suite.includes(b.dataset.id); });
      };
      pool.innerHTML = o.morceaux.slice().sort(() => Math.random() - 0.5).map(m => `<button type="button" class="tph-etiq touche" data-id="${m.id}"><span>${m.html}</span></button>`).join('');
      pool.addEventListener('click', e => { const b = e.target.closest('[data-id]'); if (!b || b.disabled || fini) return; suite.push(b.dataset.id); R('retour').innerHTML = ''; majPhrase(); });
      ph.addEventListener('click', e => { const b = e.target.closest('[data-i]'); if (!b || fini) return; suite.splice(+b.dataset.i, 1); majPhrase(); });
      R('effacer').addEventListener('click', () => { if (fini) return; suite = []; majPhrase(); });
      majPhrase();
    } else {
      ph.className = 'tph-phrase';
      ph.innerHTML = o.gabarit(o.trous.map((t, i) => `<button type="button" class="tph-trou" data-t="${i}" aria-expanded="false" aria-label="Trou ${i + 1} : choisir">…</button>`));
      suite = o.trous.map(() => null);
      ph.querySelectorAll('[data-t]').forEach(b => b.addEventListener('click', () => {
        if (fini) return;
        const i = +b.dataset.t;
        TPHM.menu(b, o.trous[i].map(id => ({ id, html: parId[id].html })), c => {
          suite[i] = c.id; b.innerHTML = `<span>${c.html}</span>`; b.classList.add('rempli'); b.classList.remove('ok', 'ko'); R('retour').innerHTML = '';
        });
      }));
      R('effacer').addEventListener('click', () => { if (fini) return; suite = suite.map(() => null); ph.querySelectorAll('[data-t]').forEach(b => { b.textContent = '…'; b.className = 'tph-trou'; }); });
    }
    R('valider').addEventListener('click', () => {
      if (fini) return;
      if (o.mode === 'trous' && suite.some(x => !x)) { TPHM.retour(R('retour'), false, ' Remplis tous les trous.'); return; }
      if (!suite.length) { TPHM.retour(R('retour'), false, ' Touche les morceaux dans l’ordre pour écrire ta réponse.'); return; }
      const diag = o.lire(suite.filter(Boolean));
      if (diag) {
        erreurs++;
        ph.classList.add('ko');
        TPHM.retour(R('retour'), false, ' ' + diag + (erreurs >= 2 ? ' <button type="button" class="btn-small" data-r="rep">Afficher la réponse</button>' : ''));
        const rep = R('retour').querySelector('[data-r="rep"]');
        if (rep) rep.addEventListener('click', () => terminer(true));
        return;
      }
      terminer(false);
    });
    zone.__remplir = () => { if (!fini) { erreurs = 0; terminer(false); } };
    function terminer(affichee) {
      fini = true;
      ph.className = 'tph-phrase ok';
      ph.innerHTML = o.solution;
      zone.querySelectorAll('[data-r="pool"], [data-r="valider"], [data-r="effacer"]').forEach(x => { x.hidden = true; });
      if (affichee) R('retour').innerHTML = `<div class="callout tph-retour"><b>Réponse.</b> ${o.solution}</div>`;
      else TPHM.retour(R('retour'), erreurs ? 'apres' : true, o.bravo ? ' ' + o.bravo : '');
      o.fini && o.fini();
    }
  }

  // « On trace le pH en fonction du volume V d'acide versé. »
  function phrase(zone, o) {
    o = Object.assign({ mode: 'morceaux' }, o || {});
    const M = [
      { id: 'trace', html: 'On trace' }, { id: 'ph', html: 'le pH' }, { id: 'fdu', html: 'en fonction du' }, { id: 'v', html: 'volume V d’acide versé' },
      { id: 'leV', html: 'le volume V' }, { id: 'fdupH', html: 'en fonction du pH' }, { id: 'sigma', html: 'la conductivité σ' },
      { id: 'veq', html: 'le volume équivalent V<sub>eq</sub>' }, { id: 'vb', html: 'le volume V<sub>B</sub> de S₀' },
      // trous : formes adaptées à « en fonction du … »
      { id: 't2ph', html: 'pH' }, { id: 't2veq', html: 'volume équivalent V<sub>eq</sub>' }, { id: 't2vb', html: 'volume V<sub>B</sub> de S₀' },
    ];
    const lire = ids => {
      const s = ids.join(' ');
      if (s === 'trace ph fdu v' || s === 'ph v') return null;
      if (ids.includes('sigma')) return 'On suit ici le pH avec un pH-mètre, pas la conductivité.';
      if (ids.includes('veq') || ids.includes('vb') || ids.includes('t2veq') || ids.includes('t2vb')) return 'Le pH est mesuré pour chaque volume V versé : ni V<sub>eq</sub> (un seul volume), ni V<sub>B</sub> (le volume de S₀ dans le bécher).';
      if (ids.includes('fdupH') || ids.includes('t2ph') || (ids.includes('leV') && !ids.includes('ph')) || ids.indexOf('v') > -1 && ids.indexOf('v') < ids.indexOf('ph')) return 'On trace y en fonction de x : le pH en ordonnée, V en abscisse.';
      return 'Remets les morceaux dans l’ordre : « On trace … en fonction du … ».';
    };
    constructeur(zone, {
      mode: o.mode, morceaux: o.mode === 'morceaux' ? M.filter(m => !m.id.startsWith('t2')) : M,
      vide: 'Touche les morceaux de phrase dans l’ordre',
      trous: [['ph', 'leV', 'sigma', 'veq'], ['v', 't2ph', 't2veq', 't2vb']],
      gabarit: t => `<span class="tph-phrase-fixe">On trace</span> ${t[0]} <span class="tph-phrase-fixe">en fonction du</span> ${t[1]}<span class="tph-phrase-fixe">.</span>`,
      lire, solution: 'On trace le pH en fonction du volume V d’acide versé.', fini: o.fini,
    });
  }

  // H₃O⁺ + HO⁻ → 2 H₂O
  function equation(zone, o) {
    o = Object.assign({ mode: 'morceaux' }, o || {});
    const M = [{ id: 'h3o', html: 'H₃O⁺' }, { id: 'ho', html: 'HO⁻' }, { id: 'na', html: 'Na⁺' }, { id: 'cl', html: 'Cl⁻' },
      { id: 'h2o', html: 'H₂O' }, { id: '2h2o', html: '2 H₂O' }, { id: 'fl', html: '→' }];
    const lire = ids => {
      const k = ids.indexOf('fl');
      const reac = o.mode === 'morceaux' ? (k < 0 ? ids : ids.slice(0, k)) : ids.slice(0, 2);
      const prod = o.mode === 'morceaux' ? (k < 0 ? [] : ids.slice(k + 1)) : ids.slice(2);
      if (o.mode === 'morceaux' && k < 0) return 'Sépare les réactifs et les produits par la flèche « → ».';
      if ([...reac, ...prod].some(x => x === 'na' || x === 'cl')) return 'Na⁺ et Cl⁻ ne réagissent pas : ce sont des ions spectateurs.';
      const r = reac.slice().sort().join(' ');
      if (r !== 'h3o ho') return 'Les réactifs sont l’ion H₃O⁺ apporté par la burette et l’ion HO⁻ présent dans le bécher.';
      if (prod.join(' ') === 'h2o' || prod.join(' ') === 'h2o h2o' && o.mode === 'trous') return 'Compte les H et les O : H₃O⁺ + HO⁻ contient 4 H et 2 O.';
      if (prod.join(' ') !== '2h2o') return 'La réaction forme de l’eau : compte les H et les O.';
      return null;
    };
    constructeur(zone, {
      mode: o.mode, morceaux: o.mode === 'morceaux' ? M : M.filter(m => m.id !== 'fl'),
      reutilisable: false, vide: 'Touche les réactifs, puis →, puis les produits',
      // les « + » se placent tout seuls entre deux espèces du même côté
      rendu: (suite, parId) => suite.map((id, i) => `${i > 0 && id !== 'fl' && suite[i - 1] !== 'fl' ? '<span class="tph-phrase-fixe">+</span>' : ''}<button type="button" class="tph-etiq touche" data-i="${i}"><span>${parId[id].html}</span></button>`).join(''),
      trous: [['h3o', 'ho', 'na', 'cl', 'h2o', '2h2o'], ['h3o', 'ho', 'na', 'cl', 'h2o', '2h2o'], ['h3o', 'ho', 'na', 'cl', 'h2o', '2h2o']],
      gabarit: t => `${t[0]} <span class="tph-phrase-fixe">+</span> ${t[1]} <span class="tph-phrase-fixe">→</span> ${t[2]}`,
      lire, solution: 'H₃O⁺ + HO⁻ → 2 H₂O', fini: o.fini,
    });
  }

  Object.assign(window.TPHM, { materiel, schema, phrase, equation });
})();
