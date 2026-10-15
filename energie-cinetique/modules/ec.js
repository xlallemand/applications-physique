/* ============================================================
   Moteur de l'application « Chapitre 7 : Théorème de l'énergie
   cinétique » (Terminale STI2D ; même moteur de questions que
   « Cinématique » et « Chapitre 6 : Principe fondamental de la
   dynamique » ; navigation commune assets/sommaire.js, cours avec
   assets/cours.js ; simulateur du travail d'une force : travail.js)

   EC.fmt, EC.cs, EC.sci, EC.lire     écriture et lecture des nombres (virgule)
   EC.o, EC.fq.choix, EC.fq.nombre    fabriques d'options et de parties de question
   EC.PARTIES                         parties de question : 'choix', 'nombre', 'gabarit', 'sci',
                                      'schema' (étiquettes à glisser), 'grille' (un choix par ligne),
                                      'perso' (p.monter(zone, api) → { montrer() })
   EC.versCours(p)                    une de ces parties dans un cours (assets/cours.js)
   EC.question(zone, q, cb, mode)     question en plusieurs parties (série, exercice, activité)
   EC.serie(opts)                     série de questions notée sur 20
   EC.fig(dessin), EC.outil(monter)   figure dessinée à la largeur disponible, outil placé dans du HTML
   EC.V(n, s), EC.nomV(clé), EC.W(clé) noms de vecteurs (flèche au-dessus) et de travaux : W<sub>AB</sub>(F⃗)
   EC.fleche, EC.nomSVG, EC.COUL      flèches et noms des forces en SVG (couleurs du chapitre 6)
   EC.schemaMvt(o, vals)              schéma du théorème de l'énergie cinétique : système, forces,
                                      A, B, déplacement ; cases à remplir (EC.slot) ou valeurs
   EC.partieDonnees(o, d, opts)       placer les données de l'énoncé sur ce schéma (glisser-déposer)
   EC.partieAngles(o, opts)           angle α de chaque force avec le déplacement, puis expression de
                                      chaque travail (« 0 car ⊥ », « f × AB × (−1) »)
   EC.partieEquation(o, opts)         choisir le théorème écrit pour la situation
   EC.figAile(), EC.figMaitreCouple(), EC.figFormes(), EC.grapheTrainee(o)
                                      documents de l'activité sur la traînée (SVG)
   EC.figFrottement(), EC.figTravail(o), EC.figPente(o)
                                      figures du cours (frottements solides, travail, travail du poids)
   EC.menu(cle), EC.accueil(zone)     navigation commune (SOM) avec le plan de l'application

   Les styles des cartes, boutons et écrans de fin viennent de
   equilibrer-reactions/modules/er.css (même présentation).
   ============================================================ */
(function () {
  'use strict';

  const MOINS = '−';

  /* ============================================================
     NOMBRES
     ============================================================ */
  // nombre écrit à la française : 2,3 ; −0,30 ; 1 000
  function fmt(v, dec) {
    if (dec == null) {
      const r = Math.round(v * 1e9) / 1e9;
      let s = String(+r.toPrecision(6));
      if (/e/.test(s)) return sci(v, 3);
      const neg = s[0] === '-';
      if (neg) s = s.slice(1);
      let [e, d] = s.split('.');
      e = e.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
      return (neg ? MOINS : '') + (d ? e + ',' + d : e);
    }
    let s = (Math.abs(v) < Math.pow(10, -dec) / 2 ? 0 : v).toFixed(dec);
    return s.replace('-', MOINS).replace('.', ',');
  }
  // n chiffres significatifs, zéros finaux gardés : 4,70 ; −0,107
  function cs(v, n) {
    const e = Math.floor(Math.log10(Math.abs(v) || 1));
    if (e >= n) return fmt(Math.round(v));
    return v.toPrecision(n).replace('-', MOINS).replace('.', ',');
  }
  function sci(v, c) {
    if (v === 0) return '0';
    let e = Math.floor(Math.log10(Math.abs(v)) + 1e-12), m = +(v / Math.pow(10, e)).toFixed((c || 2) - 1);
    if (Math.abs(m) >= 10) { m /= 10; e++; }
    return `${fmt(m, (c || 2) - 1)} × 10<sup>${String(e).replace('-', MOINS)}</sup>`;
  }
  // lecture d'une saisie : « 2,3 », « −0,5 »
  function lire(s) {
    const t = String(s == null ? '' : s).trim().replace(/[\s  ]/g, '').replace(',', '.').replace(/[−–]/g, '-');
    return /^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i.test(t) ? parseFloat(t) : NaN;
  }
  const proche = (a, b, rel) => Math.abs(a - b) <= (rel == null ? .01 : rel) * Math.abs(b) + 1e-12;

  // valeur avec un préfixe d'unité : unite(20000, 'V') → « 20 kV » ; unite(0.0065, 'A') → « 6,5 mA »
  // n : nombre de chiffres significatifs au plus (3 par défaut)
  function unite(v, u, n) {
    const P = [[1e9, 'G'], [1e6, 'M'], [1e3, 'k'], [1, ''], [1e-3, 'm']];
    const a = Math.abs(v), [f, pre] = P.find(([x]) => a >= x * .9995) || P[P.length - 1];
    return `${fmt(+(v / f).toPrecision(n || 3))} ${pre}${u}`;
  }
  // fabriques de parties de question (cours, séries, exercices)
  const o = (id, label) => ({ id, label });
  const fq = {
    choix: (q, options, bonne, opts) => Object.assign({ type: 'choix', q, options, bonne, colonne: options.some(x => x.label.length > 24) }, opts),
    nombre: (q, label, valeur, unite, opts) => Object.assign({ type: 'nombre', q, label, valeur, unite }, opts),
  };

  // fraction écrite sur deux étages
  const fr = (h, b) => `<span class="fr"><span>${h}</span><span>${b}</span></span>`;

  /* ============================================================
     OUTILS
     ============================================================ */
  function el(tag, cls, html) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }
  function secouer(e) { if (!e) return; e.classList.remove('er-secoue'); void e.offsetWidth; e.classList.add('er-secoue'); }
  function melanger(t) {
    const a = t.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }
  const hasard = t => t[Math.floor(Math.random() * t.length)];
  const entre = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const surOrdi = () => matchMedia('(hover: hover)').matches;

  // Champ de saisie d'un nombre, avec un bouton ± (le pavé numérique
  // des smartphones n'a pas toujours de touche « − »)
  function champ(opts) {
    opts = opts || {};
    const d = el('span', 'ph-champ-box' + (opts.petit ? ' petit' : ''));
    d.innerHTML = `${opts.signe === false ? '' : `<button type="button" class="ph-pm" aria-label="Changer le signe" title="Changer le signe">±</button>`}
      <input type="text" class="ph-champ" inputmode="decimal" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="${opts.aria || 'Réponse'}">`;
    const input = d.querySelector('input'), pm = d.querySelector('.ph-pm');
    if (pm) {
      pm.addEventListener('click', () => {
        if (input.disabled) return;
        const v = input.value.trim();
        input.value = /^[-−]/.test(v) ? v.replace(/^[-−]\s*/, '') : MOINS + v;
        input.dispatchEvent(new Event('input'));
        // pas de focus sur smartphone : le clavier masquerait la question
        if (surOrdi()) input.focus();
      });
    }
    return { el: d, input, desactiver(b) { input.disabled = b; if (pm) pm.disabled = b; } };
  }

  /* ============================================================
     PARTIES DE QUESTION
     Chaque partie reçoit (zone, p, api) et renvoie { montrer() }.
     api.reussi(silencieux, note) · api.erreur(indice) · api.effacer() · api.message(h) · api.fini()
     ============================================================ */

  // Choix parmi des boutons : p.options [{ id, label }], p.bonne, p.indice ou p.indices[id], p.colonne
  function pChoix(zone, p, api) {
    const box = el('div', 'ph-choix' + (p.colonne ? ' ph-choix-col' : ''));
    zone.appendChild(box);
    const opts = p.melanger === false ? p.options : melanger(p.options);
    const bs = opts.map(o => {
      const b = el('button', 'btn-secondary', o.label);
      b.type = 'button';
      b.dataset.id = o.id;
      box.appendChild(b);
      b.onclick = () => {
        if (api.fini() || b.disabled) return;
        if (o.id === p.bonne) {
          b.classList.add('juste');
          bs.forEach(x => { x.b.disabled = true; });
          api.reussi();
        } else {
          b.classList.add('faux'); b.disabled = true;
          api.erreur((p.indices && p.indices[o.id]) || p.indice || '');
        }
      };
      return { b, o };
    });
    return { montrer() { bs.forEach(({ b, o }) => { b.disabled = true; if (o.id === p.bonne) b.classList.add('juste'); }); } };
  }

  // Bouton « Valider » d'une partie
  function boutonValider(zone) {
    const a = el('div', 'er-actions ph-actions-partie', '<button type="button" class="btn-primary">Valider</button>');
    zone.appendChild(a);
    const b = a.querySelector('button');
    // une fois la partie terminée, le bouton disparaît
    b.fermer = () => { b.disabled = true; a.remove(); };
    return b;
  }
  function juste(v, p) {
    if (p.tol != null) return Math.abs(v - p.valeur) <= p.tol + 1e-12;
    return proche(v, p.valeur, p.rel == null ? .005 : p.rel);
  }
  // valeur affichée par « Afficher la réponse »
  function affichage(p) {
    if (p.affiche) return p.affiche;
    if (p.cs) return cs(p.valeur, p.cs);
    if (p.dec != null) return fmt(p.valeur, p.dec);
    if (p.tol != null && p.tol >= 1e-4) return fmt(p.valeur, Math.max(0, Math.ceil(-Math.log10(2 * p.tol) - 1e-9)));
    return fmt(p.valeur);
  }

  // Valeur numérique : p.label, p.valeur, p.tol (écart absolu) ou p.rel (écart relatif), p.unite, p.diag(v), p.indice
  function pNombre(zone, p, api) {
    const d = el('div', 'ph-valeur');
    if (p.label) d.appendChild(el('span', 'ph-lab', p.label));
    const ch = champ({ signe: p.signe });
    d.appendChild(ch.el);
    if (p.unite) d.appendChild(el('span', 'ph-unite', p.unite));
    zone.appendChild(d);
    const bVal = boutonValider(zone);
    ch.input.addEventListener('input', () => api.effacer());
    ch.input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); valider(); } });
    function valider() {
      if (api.fini()) return;
      const v = lire(ch.input.value);
      if (isNaN(v)) { secouer(d); api.message('Écris un nombre (avec une virgule si besoin).'); return; }
      if (juste(v, p)) { ch.desactiver(true); bVal.fermer(); api.reussi(); return; }
      api.erreur((p.diag && p.diag(v)) || p.indice || 'Vérifie ton calcul.');
      secouer(d);
    }
    bVal.onclick = valider;
    return { montrer() { ch.input.value = affichage(p); ch.desactiver(true); bVal.fermer(); } };
  }

  // Expression à trous : p.label, p.morceaux = [texte HTML | { v, tol, rel, aria }], p.diag(valeurs)
  function pGabarit(zone, p, api) {
    const d = el('div', 'ph-valeur ec-gab');
    if (p.label) d.appendChild(el('span', 'ph-lab', p.label));
    // chaque case forme un groupe insécable avec le texte qui la suit (et le texte d'ouverture
    // avec la première case) : sur un petit écran, la ligne ne se coupe qu'entre deux groupes
    const champs = [];
    let grp = el('span', 'ec-gab-grp');
    d.appendChild(grp);
    p.morceaux.forEach(m => {
      if (typeof m === 'string') { grp.appendChild(el('span', 'ec-gab-txt', m)); return; }
      if (champs.length) { grp = el('span', 'ec-gab-grp'); d.appendChild(grp); }
      const c = champ({ petit: true, aria: m.aria || 'Nombre à compléter' });
      c.m = m; champs.push(c); grp.appendChild(c.el);
    });
    zone.appendChild(d);
    const bVal = boutonValider(zone);
    champs.forEach((c, k) => {
      c.input.addEventListener('input', () => { api.effacer(); c.el.classList.remove('ko'); });
      c.input.addEventListener('keydown', e => {
        if (e.key !== 'Enter') return;
        e.preventDefault();
        const vide = champs.find(x => x.input.value.trim() === '');
        if (vide) vide.input.focus(); else valider();
      });
    });
    function valider() {
      if (api.fini()) return;
      const vals = champs.map(c => lire(c.input.value));
      if (vals.some(isNaN)) { secouer(d); api.message('Complète toutes les cases (écris 0 si le terme n\'existe pas).'); return; }
      const oks = champs.map((c, k) => juste(vals[k], { valeur: c.m.v, tol: c.m.tol == null ? (c.m.rel == null ? 1e-9 : null) : c.m.tol, rel: c.m.rel }));
      if (oks.every(Boolean)) { champs.forEach(c => c.desactiver(true)); bVal.fermer(); api.reussi(); return; }
      champs.forEach((c, k) => c.el.classList.toggle('ko', !oks[k]));
      api.erreur((p.diag && p.diag(vals)) || p.indice || (oks.filter(x => !x).length > 1 ? 'Les cases en rouge sont fausses.' : 'La case en rouge est fausse.'));
      secouer(d);
    }
    bVal.onclick = valider;
    return {
      montrer() {
        champs.forEach(c => { c.input.value = c.m.affiche || fmt(c.m.v); c.el.classList.remove('ko'); c.desactiver(true); });
        bVal.fermer();
      },
    };
  }

  // Écriture scientifique a × 10ⁿ : p.label, p.valeur, p.unite, p.rel (écart relatif, 3 % par défaut), p.cs, p.diag(v)
  function pSci(zone, p, api) {
    const d = el('div', 'ph-valeur');
    if (p.label) d.appendChild(el('span', 'ph-lab', p.label));
    const s = el('span', 'ph-sci'), a = champ({ petit: true, aria: 'Nombre devant la puissance de 10' }), n = champ({ petit: true, aria: 'Exposant de la puissance de 10' });
    n.el.classList.add('ph-exposant');
    s.appendChild(a.el); s.appendChild(el('span', 'ph-x10', '× 10')); s.appendChild(n.el);
    d.appendChild(s);
    if (p.unite) d.appendChild(el('span', 'ph-unite', p.unite));
    zone.appendChild(d);
    const bVal = boutonValider(zone);
    [a, n].forEach(c => {
      c.input.addEventListener('input', () => api.effacer());
      c.input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); valider(); } });
    });
    function valider() {
      if (api.fini()) return;
      const va = lire(a.input.value), vn = lire(n.input.value);
      if (isNaN(va)) { secouer(d); api.message('Écris le nombre devant la puissance de 10.'); return; }
      if (isNaN(vn) || !Number.isInteger(vn)) { secouer(d); api.message('Écris l\'exposant de la puissance de 10 (un nombre entier).'); return; }
      const v = va * Math.pow(10, vn);
      if (proche(v, p.valeur, p.rel == null ? .03 : p.rel)) { a.desactiver(true); n.desactiver(true); bVal.fermer(); api.reussi(); return; }
      api.erreur((p.diag && p.diag(v)) || p.indice || 'Vérifie ton calcul.');
      secouer(d);
    }
    bVal.onclick = valider;
    return {
      montrer() {
        let e = Math.floor(Math.log10(Math.abs(p.valeur)) + 1e-12), m = +(p.valeur / Math.pow(10, e)).toFixed((p.cs || 2) - 1);
        if (Math.abs(m) >= 10) { m /= 10; e++; }
        a.input.value = fmt(m, (p.cs || 2) - 1); n.input.value = String(e).replace('-', MOINS);
        a.desactiver(true); n.desactiver(true); bVal.fermer();
      },
    };
  }

  /* ---------- Défilement automatique pendant un glisser : près du haut ou du bas de l'écran, la page défile ---------- */
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

  /* Étiquettes à glisser sur un schéma (assets/dragdrop.js) :
     p.schema : HTML du schéma, avec des cases EC.slot(id)
     p.etiquettes : [{ id, label, cible (id de case ou liste d'ids, null pour un intrus), indice }]
     Toutes les cases doivent être remplies ; les étiquettes « intruses » (cible null)
     restent dans la palette.
     Au doigt : on touche une étiquette, puis une case. */
  function pSchema(zone, p, api) {
    const d = el('div', 'sc-exo');
    d.innerHTML = `<div class="sc-palette"><p class="sc-palette-t">${p.titrePalette || 'Valeurs à placer'} <span>· fais-les glisser sur le schéma, ou touche une étiquette puis une case</span></p>
        <div class="sc-palette-liste">${melanger(p.etiquettes).map(e => `<button type="button" class="sc-chip" data-id="${e.id}"><span>${e.label}</span></button>`).join('')}</div></div>
      ${p.schema}`;
    zone.appendChild(d);
    const palette = d.querySelector('.sc-palette-liste');
    const chips = Array.from(d.querySelectorAll('.sc-chip'));
    const slots = Array.from(d.querySelectorAll('.sc-slot'));
    const etiq = id => p.etiquettes.find(e => e.id === id);
    const cibles = c => [].concat(etiq(c.dataset.id).cible || []);
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
      // clavier (Entrée, Espace) : sélection
      c.addEventListener('keydown', e => {
        if ((e.key === 'Enter' || e.key === ' ') && !fini) { e.preventDefault(); choisir(choisie === c ? null : c); }
      });
    });
    slots.forEach(s => {
      s.addEventListener('click', e => {
        if (fini || !choisie || e.target.closest('.sc-chip')) return;
        placer(choisie, s); choisir(null);
      });
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
      const reste = slots.filter(s => !s.querySelector('.sc-chip')).length;
      if (reste) {
        secouer(d.querySelector('.sc-palette'));
        api.message(`Remplis toutes les cases du schéma (il en reste ${reste}).`);
        return;
      }
      const fausses = [];
      chips.filter(c => c.parentElement.classList.contains('sc-slot')).forEach(c => {
        const s = c.parentElement, ok = cibles(c).indexOf(s.dataset.slot) !== -1;
        s.classList.toggle('ok', ok); s.classList.toggle('ko', !ok);
        if (!ok) fausses.push(c);
      });
      if (!fausses.length) { terminer(); api.reussi(); return; }
      const indices = fausses.map(c => etiq(c.dataset.id).indice).filter(Boolean);
      api.erreur(`${fausses.length > 1 ? `${fausses.length} valeurs sont mal placées` : 'Une valeur est mal placée'} (case rouge).` +
        (indices.length ? '<br>' + indices.map(t => '☛ ' + t).join('<br>') : ''));
      secouer(d.querySelector('.sch') || d);
    };
    return {
      montrer() {
        // les intrus retournent dans la palette, chaque étiquette juste va dans sa case
        chips.forEach(c => { if (!cibles(c).length) placer(c, palette); });
        chips.filter(c => cibles(c).length).forEach(c => {
          const s = slots.find(x => cibles(c).indexOf(x.dataset.slot) !== -1 && !x.querySelector('.sc-chip')) || slots.find(x => x.dataset.slot === cibles(c)[0]);
          placer(c, s);
          s.classList.add('ok');
        });
        terminer();
      },
    };
  }

  /* Grille de choix : une ligne par élément, un choix par ligne, toutes validées ensemble
     (« Entoure l'adjectif qui convient », angle α de chaque force…)
     p.lignes [{ id, label (HTML), bonne (id d'option), indices { id d'option: diagnostic }, apres (HTML affiché une fois réussi) }]
     p.options [{ id, label }] : les mêmes pour chaque ligne ; p.diag(fausses) → diagnostic d'ensemble (facultatif) */
  function pGrille(zone, p, api) {
    const g = el('div', 'ec-grille');
    g.innerHTML = p.lignes.map(l => `<div class="ec-grille-l" data-l="${l.id}">
        <div class="ec-grille-nom">${l.label}</div>
        <div class="ec-grille-ch" role="group" aria-label="${String(l.label).replace(/<[^>]+>/g, '').replace(/"/g, '')}">
          ${p.options.map(o => `<button type="button" class="ec-grille-b" data-o="${o.id}" aria-pressed="false">${o.label}</button>`).join('')}</div>
        <div class="ec-grille-apres" hidden></div></div>`).join('');
    zone.appendChild(g);
    const lignes = Array.from(g.querySelectorAll('.ec-grille-l'));
    const choisi = {};
    lignes.forEach(L => {
      L.querySelectorAll('.ec-grille-b').forEach(b => {
        b.onclick = () => {
          if (api.fini() || b.disabled) return;
          choisi[L.dataset.l] = b.dataset.o;
          L.querySelectorAll('.ec-grille-b').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
          L.classList.remove('ok', 'ko');
          api.effacer();
        };
      });
    });
    const bVal = boutonValider(zone);
    function terminer() {
      lignes.forEach((L, k) => {
        L.classList.remove('ko'); L.classList.add('ok');
        L.querySelectorAll('.ec-grille-b').forEach(b => { b.disabled = true; });
        const a = L.querySelector('.ec-grille-apres');
        if (p.lignes[k].apres) { a.innerHTML = p.lignes[k].apres; a.hidden = false; }
      });
      bVal.fermer();
    }
    bVal.onclick = () => {
      if (api.fini()) return;
      const manque = p.lignes.filter(l => !choisi[l.id]).length;
      if (manque) { secouer(g); api.message(`Fais un choix sur chaque ligne (il en manque ${manque}).`); return; }
      const fausses = p.lignes.filter(l => choisi[l.id] !== l.bonne);
      lignes.forEach((L, k) => { const ok = choisi[p.lignes[k].id] === p.lignes[k].bonne; L.classList.toggle('ok', ok); L.classList.toggle('ko', !ok); });
      if (!fausses.length) { terminer(); api.reussi(); return; }
      const ind = fausses.map(l => (l.indices && l.indices[choisi[l.id]]) || l.indice).filter(Boolean);
      api.erreur(`${fausses.length > 1 ? `${fausses.length} lignes sont fausses` : 'Une ligne est fausse'} (en rouge).` +
        ((p.diag && p.diag(fausses)) ? ' ' + p.diag(fausses) : '') + (ind.length ? '<br>' + ind.map(t => '☛ ' + t).join('<br>') : ''));
      secouer(g);
    };
    return {
      montrer() {
        lignes.forEach((L, k) => L.querySelectorAll('.ec-grille-b').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.o === p.lignes[k].bonne))));
        terminer();
      },
    };
  }

  // Outil propre à l'application : p.monter(zone, api) → { montrer() }
  function pPerso(zone, p, api) {
    const ctx = p.monter(zone, api) || {};
    return { montrer() { if (ctx.montrer) ctx.montrer(); } };
  }

  const PARTIES = { choix: pChoix, nombre: pNombre, gabarit: pGabarit, sci: pSci, schema: pSchema, grille: pGrille, perso: pPerso };
  // une partie de ce moteur dans un cours (assets/cours.js) : elle y devient un outil « perso »
  const versCours = p => ({ type: 'perso', q: p.q, solution: p.solution || p.correction, aide: p.aide, monter: (zone, api) => PARTIES[p.type](zone, p, api) });

  /* ============================================================
     « AFFICHER TOUT LE COURS »
     Les questions et les « À toi » en cours s'inscrivent ici. Quand
     l'élève demande tout le cours, chacun « se déplie » : toutes ses
     parties sont affichées d'un coup, avec le bouton « Afficher la
     réponse » disponible tout de suite. EC.tout reste vrai ensuite :
     les nouvelles questions s'affichent directement dépliées.
     ============================================================ */
  const vivants = new Set();

  /* ============================================================
     UNE QUESTION : parties successives
     q = { parties: [p] } ; p = { type, q (texte), figure(zone), solution (HTML affiché après), … }
     mode : 'serie'    bouton « Afficher la réponse » (0 point pour la question)
            'exercice' bouton « Voir la correction » toujours disponible
            'cours'    « Afficher la réponse » proposé après une erreur
                       (ou tout de suite quand tout le cours est affiché)
     cb.fin(points) : 2 sans erreur, 1 après au moins une erreur, 0 si une réponse est affichée
     ============================================================ */
  function question(zone, q, cb, mode) {
    mode = mode || 'serie';
    const etat = { erreurs: 0, vue: false, fini: false, details: [] };
    const n = q.parties.length, aides = [];
    let rendues = 0, finies = 0, deplie = false;
    const libAide = mode === 'exercice' ? 'Voir la correction' : 'Afficher la réponse';
    // « Afficher tout le cours » : les parties restantes apparaissent d'un coup
    const inst = {
      deplier() {
        if (deplie) return;
        deplie = true;
        aides.forEach(a => a.classList.remove('hidden'));
        while (rendues < n) partie();
      },
    };
    function partie() {
      const p = q.parties[rendues++];
      window.EC.partieEnCours = p;          // partie en cours (utile pour vérifier l'application)
      const d = el('div', 'ph-partie', `${p.q ? `<div class="ph-partie-q">${p.q}</div>` : ''}<div class="ph-partie-fig"></div><div class="ph-partie-zone"></div><div class="ph-partie-retour"></div>
        <div class="ph-partie-aide${mode === 'cours' && !deplie ? ' hidden' : ''}"><button type="button" class="btn-small">${libAide}</button></div>`);
      zone.appendChild(d);
      if (p.figure) p.figure(d.querySelector('.ph-partie-fig'));
      const ret = d.querySelector('.ph-partie-retour'), aide = d.querySelector('.ph-partie-aide'), bRep = aide.querySelector('button');
      aides.push(aide);
      let finie = false, erreursIci = 0;
      const api = {
        fini: () => finie || etat.fini,
        effacer() { if (!finie) ret.innerHTML = ''; },
        message(h) { if (!finie) ret.innerHTML = `<p class="ph-msg">${h}</p>`; },
        compterErreur() { etat.erreurs++; erreursIci++; aide.classList.remove('hidden'); },
        erreur(h) {
          api.compterErreur();
          ret.innerHTML = `<div class="callout-danger er-retour"><p><b class="er-ko">Ce n'est pas ça.</b> ${h || ''}</p>${erreursIci >= 2 && mode !== 'cours' ? `<p class="er-petit">Corrige ta réponse, ou ${mode === 'exercice' ? 'regarde la correction' : 'affiche la réponse'} (0 point pour cette ${mode === 'exercice' ? 'partie' : 'question'}).</p>` : ''}</div>`;
        },
        reussi(silencieux, note) { terminer(false, silencieux, note); },
      };
      const ctx = PARTIES[p.type](d.querySelector('.ph-partie-zone'), p, api);
      p.ctx = ctx;
      bRep.onclick = () => { if (finie) return; ctx.montrer(); etat.vue = true; terminer(true); };
      function terminer(vue, silencieux, note) {
        finie = true;
        aide.remove();
        etat.details.push({ vue, erreurs: erreursIci });
        const titre = vue ? (mode === 'exercice' ? 'Correction' : 'Réponse') : (erreursIci ? 'C\'est juste.' : 'Juste !');
        const sol = p.solution || p.correction;
        if (sol || vue || note) {
          ret.innerHTML = `<div class="${vue ? 'callout' : 'callout-success'} er-retour ph-solution"><p><b class="${vue ? '' : 'er-ok'}">${titre}</b>${note ? ' ' + note : ''}</p>${sol ? `<div>${sol}</div>` : ''}</div>`;
        } else if (!silencieux) {
          ret.innerHTML = '<p class="ph-ok">✓ Juste</p>';
        } else ret.innerHTML = '';
        finies++;
        if (finies < n) {
          // partie suivante (déjà affichée si tout le cours est déplié)
          if (!deplie && rendues < n) {
            partie();
            const s = zone.lastElementChild;
            setTimeout(() => s.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 80);
          }
        } else {
          etat.fini = true;
          vivants.delete(inst);
          cb.fin(etat.vue ? 0 : etat.erreurs ? 1 : 2, etat);
        }
      }
    }
    if (mode === 'cours') vivants.add(inst);
    partie();
    if (mode === 'cours' && window.EC.tout) inst.deplier();
  }

  /* ============================================================
     SÉRIE DE QUESTIONS NOTÉE SUR 20
     opts = { app, badge, titre, intro, questions: () => [q], revoir, suite }
     q = { theme, consigne, enonce, figure(zone), parties, bilan }
     ============================================================ */
  function serie(opts) {
    const app = opts.app;
    let qs = [], idx = 0, score = 0, recap = [];
    const pts = v => `${v} pt${v > 1 ? 's' : ''}`;

    function intro() {
      app.innerHTML = `<div class="er-card"><span class="er-badge">${opts.badge}</span><h2 class="er-titre">${opts.titre}</h2>${opts.intro || ''}
        <div class="cle" style="margin:14px 0"><p><b class="cle-titre">Barème</b> · ${opts.nombre || 10} questions, notées sur 20 :</p>
          <ul class="er-liste"><li><b>2 points</b> si tout est juste du premier coup ;</li><li><b>1 point</b> si tu y arrives après au moins une erreur ;</li><li><b>0 point</b> si tu affiches la réponse.</li></ul></div>
        <button type="button" class="btn-primary" data-a="go">Commencer →</button></div>`;
      app.querySelector('[data-a="go"]').onclick = demarrer;
      window.scrollTo(0, 0);
    }
    function demarrer() { qs = opts.questions(); idx = 0; score = 0; recap = []; afficher(); }

    function afficher() {
      if (idx >= qs.length) return fin();
      const q = qs[idx];
      window.EC.questionEnCours = q;          // question en cours (utile pour vérifier l'application)
      app.innerHTML = `<div class="er-card"><span class="er-badge">${opts.badge}</span><h2 class="er-titre">${opts.titre}</h2>
          <p class="er-meta">Question ${idx + 1}/${qs.length} · Score : <b data-a="score">${pts(score)}</b></p>
          <div class="progress-bar"><div class="progress-fill" style="width:${Math.round(idx / qs.length * 100)}%"></div></div></div>
        <div class="er-card ph-question">
          ${q.theme ? `<p class="er-q-nom">${q.theme}</p>` : ''}
          ${q.consigne ? `<div class="er-consigne">${q.consigne}</div>` : ''}
          ${q.enonce ? `<div class="ph-enonce">${q.enonce}</div>` : ''}
          <div data-a="fig"></div>
          <div data-a="parties"></div>
          <div data-a="retour"></div>
          <div class="er-actions" data-a="suite"></div>
        </div>`;
      window.scrollTo(0, 0);
      if (q.figure) q.figure(app.querySelector('[data-a="fig"]'));
      // évite qu'un double appui sur « Question suivante » réponde à la nouvelle question
      app.style.pointerEvents = 'none';
      setTimeout(() => { app.style.pointerEvents = ''; }, 350);
      question(app.querySelector('[data-a="parties"]'), q, {
        fin(p) {
          score += p; recap.push({ n: idx + 1, p });
          app.querySelector('[data-a="score"]').textContent = pts(score);
          const titre = p === 2 ? 'Bravo, juste du premier coup !' : p === 1 ? 'C\'est juste, après au moins une erreur.' : 'La réponse a été affichée.';
          app.querySelector('[data-a="retour"]').innerHTML = `<div class="${p ? 'callout-success' : 'callout'} er-retour ph-bilan"><p><b class="${p ? 'er-ok' : ''}">${titre}</b> +${pts(p)}</p>${q.bilan ? `<p>${q.bilan}</p>` : ''}</div>`;
          const s = app.querySelector('[data-a="suite"]'), der = idx === qs.length - 1;
          s.innerHTML = `<button type="button" class="btn-primary" disabled>${der ? 'Voir mon score →' : 'Question suivante →'}</button>`;
          const b = s.querySelector('button');
          setTimeout(() => { b.disabled = false; }, 450);
          b.onclick = () => { idx++; afficher(); };
          setTimeout(() => s.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 80);
        },
      }, 'serie');
    }

    function fin() {
      const max = qs.length * 2, note = Math.round(score / max * 20 * 2) / 2, pct = Math.round(score / max * 100);
      window.SOM.marquer({ note });                                 // meilleure note sur 20 (sommaire, accueil)
      const msg = score === max ? 'Tout est juste : bravo !' : pct >= 70 ? 'Très bien ! Encore un peu d\'entraînement pour le sans-faute.'
        : pct >= 50 ? 'Pas mal ! Recommence pour progresser : les questions changent à chaque fois.' : 'Continue à t\'entraîner : relis le cours, puis recommence.';
      app.innerHTML = `<div class="er-card er-fin"><span class="er-badge">${opts.badge}</span><h2 class="er-titre">Série terminée !</h2>
        ${score === max ? '<p class="er-trophee">🏆 Sans-faute !</p>' : ''}
        <div class="er-score">${fmt(note)} / 20</div><p class="er-score-pct">${pct} %</p><p class="er-contexte">${msg}</p>
        <div class="er-recap">${recap.map(r => `<div class="${r.p === 2 ? 'ok' : r.p === 1 ? 'moyen' : 'ko'}">Q${r.n}<b>${r.p}/2</b></div>`).join('')}</div>
        <div class="er-actions" style="justify-content:center"><button type="button" class="btn-secondary" data-a="re">↺ Recommencer avec d'autres questions</button>
        ${opts.revoir ? `<a class="btn-secondary" style="text-decoration:none" href="${opts.revoir.href}">${opts.revoir.label}</a>` : ''}
        ${opts.suite ? `<a class="btn-primary" style="text-decoration:none" href="${opts.suite.href}">${opts.suite.label}</a>` : ''}</div></div>`;
      app.querySelector('[data-a="re"]').onclick = demarrer;
      window.scrollTo(0, 0);
      if (score === max) confettis();
    }
    intro();
  }


  /* ---------- Confettis (sans-faute) ---------- */
  function confettis() {
    const col = ['#5a3fc4', '#16a34a', '#e8890c', '#d61f69', '#2952c8'];
    for (let i = 0; i < 70; i++) {
      const e = document.createElement('div');
      e.className = 'er-confetti';
      e.style.left = (Math.random() * 100) + 'vw';
      e.style.background = col[i % col.length];
      e.style.animationDuration = (2.2 + Math.random() * 1.6) + 's';
      e.style.animationDelay = (Math.random() * 0.8) + 's';
      document.body.appendChild(e);
      setTimeout(() => e.remove(), 4800);
    }
  }


  /* ============================================================
     FIGURES À LA LARGEUR DISPONIBLE
     EC.fig(dessin) renvoie un emplacement HTML ; dès qu'il est dans la
     page, dessin(W) y est appelé avec la largeur disponible W (et de
     nouveau quand la largeur change) : les textes gardent leur taille
     et restent lisibles sur un téléphone. Plusieurs figures par page.
     ============================================================ */
  const DESSINS = new Map();
  let nFig = 0, nMotif = 0;
  function fig(dessin, cls) {
    const k = String(++nFig);
    DESSINS.set(k, dessin);
    return `<div class="ec-fig${cls ? ' ' + cls : ''}" data-fig="${k}"></div>`;
  }
  // dessine dans div et suit les changements de largeur (rotation du téléphone…)
  function monter(div, dessin) {
    if (div.dataset.monte) return;
    div.dataset.monte = '1';
    let largeur = 0;
    const tracerIci = () => {
      const W = Math.round(div.clientWidth);
      if (!W || W === largeur) return;
      largeur = W;
      div.innerHTML = dessin(W);
    };
    if (window.ResizeObserver) new ResizeObserver(tracerIci).observe(div); else addEventListener('resize', tracerIci);
    tracerIci();
  }
  // les emplacements ajoutés à la page (cours, questions, exercices) sont dessinés tout seuls
  function chercher(racine) {
    if (!racine || !racine.querySelectorAll) return;
    const l = racine.matches && racine.matches('.ec-fig[data-fig]') ? [racine] : [];
    racine.querySelectorAll('.ec-fig[data-fig]').forEach(x => l.push(x));
    l.forEach(x => { const f = DESSINS.get(x.dataset.fig); if (f) monter(x, f); });
  }
  new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(chercher))).observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener('DOMContentLoaded', () => chercher(document.body));

  /* ============================================================
     OUTILS INTERACTIFS PLACÉS DANS DU HTML
     EC.outil(monter) renvoie un emplacement HTML ; dès qu'il est dans la
     page, monter(div) y construit l'outil, une seule fois.
     ============================================================ */
  const OUTILS = new Map();
  let nOutil = 0;
  function outil(f) {
    const k = String(++nOutil);
    OUTILS.set(k, f);
    return `<div class="ec-outil" data-outil="${k}"></div>`;
  }
  function chercherOutils(racine) {
    if (!racine || !racine.querySelectorAll) return;
    const l = racine.matches && racine.matches('.ec-outil[data-outil]') ? [racine] : [];
    racine.querySelectorAll('.ec-outil[data-outil]').forEach(x => l.push(x));
    l.forEach(x => {
      if (x.dataset.monte) return;
      const f = OUTILS.get(x.dataset.outil);
      if (f) { x.dataset.monte = '1'; f(x); }
    });
  }
  new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(chercherOutils))).observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener('DOMContentLoaded', () => chercherOutils(document.body));
  const cap = t => t.charAt(0).toUpperCase() + t.slice(1);

  // racine carrée écrite avec sa barre : √200
  const rac = x => `<span class="racine">√<span>${x}</span></span>`;
  // case vide d'un schéma, où glisser une étiquette (partie 'schema')
  const slot = id => `<span class="sc-slot" data-slot="${id}"><span class="sc-slot-ph">?</span></span>`;
  const f1 = v => (+v).toFixed(1);
  const o_ = (id, label) => ({ id, label });

  /* ============================================================
     NOMS DES FORCES (HTML et SVG), FLÈCHES
     Mêmes couleurs que dans « Chapitre 6 » : le poids est toujours
     orange, la réaction du support bleue, les frottements roses…
     (attributs de présentation des SVG, comme VEC.C)
     ============================================================ */
  const V = (n, s) => `<span class="vec-nom">${n}</span>${s ? `<sub>${s}</sub>` : ''}`;
  const NOMS = { P: ['P'], RN: ['R', 'N'], R: ['R'], N: ['N'], f: ['f'], Fm: ['F', 'm'], F: ['F'] };
  const nomV = k => V(...NOMS[k]);
  // travail d'une force : W_AB(F⃗)
  const W = (k, d) => `W<sub>${d || 'AB'}</sub>(${nomV(k)})`;
  const COUL = { P: '#d9480f', RN: '#1971c2', R: '#1971c2', N: '#1971c2', f: '#c2255c', Fm: '#b35c00', F: '#b35c00', port: '#5c940d' };

  // flèche d'origine (x, y), d'angle ang (degrés, 0 vers la droite, 90 vers le haut), de longueur L
  function fleche(x, y, ang, L, coul, cls) {
    const r = ang * Math.PI / 180, c = Math.cos(r), s = -Math.sin(r);
    const x2 = x + L * c, y2 = y + L * s, bx = x2 - 11 * c, by = y2 - 11 * s;
    return { svg: `<g class="ec-f${cls ? ' ' + cls : ''}"${coul ? ` style="color:${coul}"` : ''}><line x1="${f1(x)}" y1="${f1(y)}" x2="${f1(bx)}" y2="${f1(by)}"/><path d="M${f1(x2)},${f1(y2)} L${f1(bx - 5.5 * s)},${f1(by + 5.5 * c)} L${f1(bx + 5.5 * s)},${f1(by - 5.5 * c)} Z"/></g>`, x2, y2, c, s };
  }
  // nom d'une force en SVG (lettre, indice, petite flèche au-dessus) ; x : centre, y : ligne de base
  function nomSVG(k, x, y, coul) {
    const [p, s] = NOMS[k] || [k];
    const wp = p.length * 9.5, ws = s ? s.length * 6.6 : 0, x0 = x - (wp + ws) / 2;
    const ya = y - 15, x2 = x0 + Math.max(wp, 9) + 1;
    return `<g class="ec-nom"${coul ? ` style="color:${coul}"` : ''}><text x="${f1(x0)}" y="${f1(y)}">${p}${s ? `<tspan dy="4" font-size="10.5">${s}</tspan>` : ''}</text>` +
      `<path d="M${f1(x0 + 1)},${f1(ya)} H${f1(x2)} M${f1(x2 - 3)},${f1(ya - 2.6)} L${f1(x2)},${f1(ya)} L${f1(x2 - 3)},${f1(ya + 2.6)}"/></g>`;
  }
  // force et son nom, au-delà de la pointe
  function force(k, x, y, ang, L) {
    const a = fleche(x, y, ang, L, COUL[k]);
    const lx = a.x2 + a.c * 14 + (Math.abs(a.c) < .2 ? 13 : 0), ly = a.y2 + a.s * 14 + (Math.abs(a.s) < .2 ? -2 : 6);
    return a.svg + nomSVG(k, lx, ly, COUL[k]);
  }

  /* ============================================================
     SCHÉMA DU THÉORÈME DE L'ÉNERGIE CINÉTIQUE
     EC.schemaMvt(o, vals)
       o = { sens: 'droite' (déplacement horizontal de A vers B) | 'bas' (chute de A vers B)
                   | 'haut' (lancer vers le haut, de A jusqu'au sommet B),
             objet: 'voiture' | 'camion' | 'pierre' | 'bloc' | 'pomme' | 'balle',
             forces: ['P', 'RN', 'f', 'Fm'] (clés de NOMS), d: 'AB' | 'h' | 'ℓ' (nom de la distance),
             angles: true (angles α marqués : schéma d'un exemple traité), aria }
       vals = { m, vA, vB, d } : HTML de chaque case ; '#clé' → case vide (EC.slot), '?' → grandeur cherchée
     Déplacement horizontal : les données au-dessus du dessin (A à gauche, B à droite),
     la distance en dessous. Déplacement vertical : les données à droite du dessin.
     ============================================================ */
  const DESC_F = {
    P: 'le poids, vertical vers le bas', RN: 'la réaction normale du support, perpendiculaire au support',
    R: 'la réaction de la route, perpendiculaire à la route', N: 'la réaction de la glace, perpendiculaire à la glace',
    f: 'les frottements, opposés au mouvement', Fm: 'la force motrice, vers l\'avant',
  };
  const nomD = o => o.d || (o.sens === 'droite' ? 'AB' : 'h');
  // angle entre la force k et le déplacement
  function angleDe(o, k) {
    if (o.sens === 'droite') return k === 'f' ? 180 : k === 'Fm' ? 0 : 90;
    return k === 'P' ? (o.sens === 'bas' ? 0 : 180) : 90;
  }
  // l'objet dessiné, posé en x sur le sol (déplacement horizontal) ; renvoie le dessin et son centre G
  function objetH(type, x, sol) {
    if (type === 'voiture') return { G: [x, sol - 19], svg: `<g class="ec-sc-sys"><path d="M${x - 31},${sol - 8} v-12 q0,-5 5,-5 h11 l9,-10 h19 l10,10 h8 q4,0 4,5 v12 Z"/>` +
      `<path class="ec-sc-vitre" d="M${x - 12},${sol - 26} l7,-7 h7 v7 Z M${x + 5},${sol - 26} v-7 h8 l7,7 Z"/></g>` +
      `<circle cx="${x - 18}" cy="${sol - 6}" r="6" class="ec-sc-roue"/><circle cx="${x + 18}" cy="${sol - 6}" r="6" class="ec-sc-roue"/>` };
    if (type === 'camion') return { G: [x, sol - 21], svg: `<g class="ec-sc-sys"><rect x="${x - 40}" y="${sol - 38}" width="56" height="30" rx="2"/><path d="M${x + 19},${sol - 8} v-22 h12 l9,10 v12 Z"/>` +
      `<path class="ec-sc-vitre" d="M${x + 23},${sol - 27} h7 l6,7 h-13 Z"/></g>` +
      `<circle cx="${x - 30}" cy="${sol - 6}" r="6" class="ec-sc-roue"/><circle cx="${x - 16}" cy="${sol - 6}" r="6" class="ec-sc-roue"/><circle cx="${x + 30}" cy="${sol - 6}" r="6" class="ec-sc-roue"/>` };
    if (type === 'pierre') return { G: [x, sol - 11], svg: `<path class="ec-sc-sys" d="M${x - 22},${sol} h44 q4,0 4,-5 v-8 q0,-7 -7,-7 h-38 q-7,0 -7,7 v8 q0,5 4,5 Z"/>` +
      `<path class="ec-sc-anse" d="M${x - 8},${sol - 20} v-6 h20"/>` };
    return { G: [x, sol - 15], svg: `<rect x="${x - 26}" y="${sol - 30}" width="52" height="30" rx="3" class="ec-sc-sys"/>` };
  }
  // une ligne de données « nom = valeur »
  function ligneDonnee(nom, v) {
    if (v == null) return '';
    const h = String(v)[0] === '#' ? slot(String(v).slice(1)) : v === '?' ? '<span class="sc-val inconnue">?</span>' : `<span class="sc-val">${v}</span>`;
    return `<div class="sc-ligne"><span class="sc-nom">${nom} =</span>${h}</div>`;
  }
  function schemaMvt(o, vals) {
    vals = vals || {};
    const fs = o.forces || ['P'], d = nomD(o), vides = Object.keys(vals).some(k => String(vals[k])[0] === '#');
    const role = vides ? 'role="group"' : 'role="img"';
    const aria = o.aria || `Schéma : le système va de A à B ; forces ${fs.map(k => DESC_F[k]).join(', ')}`;
    let g = '';
    if (o.sens === 'droite') {
      // sol, A et B, déplacement de A vers B ; le système en A et ses forces
      const sol = 112, xA = 90, xB = 270, ob = objetH(o.objet, xA, sol), [gx, gy] = ob.G;
      g += `<line x1="14" y1="${sol}" x2="346" y2="${sol}" class="ec-sc-sol"/>`;
      g += `<line x1="${xA}" y1="${sol}" x2="${xB - 10}" y2="${sol}" class="ec-sc-dep"/><path d="M${xB},${sol} l-11,-5 v10 Z" class="ec-sc-dep-p"/>`;
      g += `<text x="${(xA + xB) / 2 + 24}" y="${sol + 18}" text-anchor="middle" class="ec-sc-txt">déplacement</text>`;
      // A et B sous le sol, un peu à gauche de leur repère (le nom du poids s'écrit à droite de sa flèche)
      [[xA, 'A'], [xB, 'B']].forEach(([x, n]) => { g += `<line x1="${x}" y1="${sol - 5}" x2="${x}" y2="${sol + 5}" class="ec-sc-marque"/><text x="${x - 12}" y="${sol + 20}" text-anchor="middle" class="ec-sc-pt">${n}</text>`; });
      g += ob.svg;
      if (o.angles) {
        // direction du déplacement (référence des angles), puis arcs : 180° pour f⃗, angle droit pour les forces verticales
        g += `<line x1="${gx}" y1="${gy}" x2="${gx + 54}" y2="${gy}" class="ec-sc-ref"/>`;
        if (fs.includes('f')) g += `<path d="M${gx + 15},${gy} A15,15 0 0 0 ${gx - 15},${gy}" class="ec-sc-arc"/><text x="${gx - 16}" y="${gy - 30}" text-anchor="end" class="ec-sc-alpha">α = 180°</text>`;
        if (fs.some(k => ['P', 'RN', 'R', 'N'].includes(k))) g += `<path d="M${gx + 8},${gy} v-8 h-8" class="ec-sc-arc"/>`;
      }
      const ANG = { P: 270, RN: 90, R: 90, N: 90, f: 180, Fm: 0 };
      fs.forEach(k => { g += force(k, gx, gy, ANG[k], ['f', 'Fm'].includes(k) ? 52 : k === 'P' ? 36 : 42); });
      if (o.angles && fs.includes('Fm')) g += `<text x="${gx + 36}" y="${gy - 10}" text-anchor="middle" class="ec-sc-alpha">α = 0°</text>`;
      return `<div class="ec-sch ec-sch-h" ${role} aria-label="${aria}">
        <div class="ec-sch-haut"><div class="ec-sch-col"><p class="ec-sch-pt">A : départ</p>${ligneDonnee('m', vals.m)}${ligneDonnee('v<sub>A</sub>', vals.vA)}</div>
          <div class="ec-sch-col"><p class="ec-sch-pt">B : arrivée</p>${ligneDonnee('v<sub>B</sub>', vals.vB)}</div></div>
        <svg viewBox="0 0 360 148" class="ec-sc" aria-hidden="true">${g}</svg>
        <div class="ec-sch-bas">${ligneDonnee(d, vals.d)}</div></div>`;
    }
    // déplacement vertical : chute (A en haut) ou lancer vers le haut (A en bas, B au sommet)
    const bas = o.sens === 'bas', yH = 30, yB = bas ? 204 : 182, yA = bas ? yH : yB, yBpt = bas ? yB : yH, x = 82;
    g += `<line x1="${x}" y1="${yA}" x2="${x}" y2="${yBpt + (bas ? -10 : 10)}" class="ec-sc-dep"/><path d="M${x},${yBpt} l-5,${bas ? -11 : 11} h10 Z" class="ec-sc-dep-p"/>`;
    g += `<line x1="22" y1="${yH}" x2="22" y2="${yB}" class="ec-sc-cote"/><path d="M22,${yH} l-4,8 h8 Z M22,${yB} l-4,-8 h8 Z" class="ec-sc-cote-p"/>`;
    g += `<text x="30" y="${(yH + yB) / 2 + 4}" class="ec-sc-pt">${d}</text>`;
    if (bas) g += `<line x1="40" y1="${yB}" x2="140" y2="${yB}" class="ec-sc-sol"/>`;
    // noms des points à gauche de la trajectoire (au-dessus du sol pour B dans une chute)
    [[yA, 'A'], [yBpt, 'B']].forEach(([y, n]) => { g += `<line x1="${x - 5}" y1="${y}" x2="${x + 5}" y2="${y}" class="ec-sc-marque"/><text x="${x - 20}" y="${y + (bas && n === 'B' ? -6 : 5)}" text-anchor="middle" class="ec-sc-pt">${n}</text>`; });
    g += o.objet === 'pomme'
      ? `<circle cx="${x}" cy="${yA}" r="10" class="ec-sc-sys"/><path d="M${x},${yA - 10} q2,-6 7,-7" class="ec-sc-anse"/>`
      : `<circle cx="${x}" cy="${yA}" r="9" class="ec-sc-sys"/>`;
    g += force('P', x, yA, 270, 46);
    if (o.angles) g += `<text x="${x + 14}" y="${yA + 38}" class="ec-sc-alpha">α = ${bas ? 0 : 180}°</text>`;
    const haut = bas ? ['A : départ', 'v<sub>A</sub>', vals.vA] : ['B : sommet (arrivée)', 'v<sub>B</sub>', vals.vB];
    const dessous = bas ? ['B : arrivée', 'v<sub>B</sub>', vals.vB] : ['A : départ', 'v<sub>A</sub>', vals.vA];
    return `<div class="ec-sch ec-sch-v" ${role} aria-label="${aria}">
      <svg viewBox="0 0 150 244" class="ec-sc" aria-hidden="true">${g}</svg>
      <div class="ec-sch-droite">
        <div class="ec-sch-col"><p class="ec-sch-pt">${haut[0]}</p>${ligneDonnee(haut[1], haut[2])}</div>
        <div class="ec-sch-col">${ligneDonnee('m', vals.m)}${ligneDonnee(d, vals.d)}</div>
        <div class="ec-sch-col"><p class="ec-sch-pt">${dessous[0]}</p>${ligneDonnee(dessous[1], dessous[2])}</div>
      </div></div>`;
  }

  // Placer les données de l'énoncé sur le schéma
  // d = { m, vA, vB, d } : texte de chaque étiquette ('?' : grandeur cherchée) ; opts = { q, intrus: [{ label, indice }], solution }
  function partieDonnees(o, d, opts) {
    opts = opts || {};
    const nd = nomD(o);
    const IND = {
      m: 'La masse est celle du système : en kg (ou en g, à convertir).',
      vA: 'v<sub>A</sub> est la vitesse au <b>départ</b>, en A. « Lâchée », « démarre » : v<sub>A</sub> = 0.',
      vB: 'v<sub>B</sub> est la vitesse à l\'<b>arrivée</b>, en B. « S\'arrête », « s\'immobilise », « au sommet » : v<sub>B</sub> = 0.',
      d: `${nd} est la ${nd === 'h' ? 'hauteur' : 'distance'} parcourue entre A et B, en mètres.`,
    };
    const cles = ['m', 'vA', 'vB', 'd'].filter(k => d[k] != null);
    const etiquettes = cles.map(k => ({ id: k, label: d[k] === '?' ? '?<span class="ec-replique"> (on la cherche)</span>' : d[k], cible: k,
      indice: d[k] === '?' ? 'Le « ? » se place sur la grandeur que l\'on cherche.' : IND[k] }))
      .concat((opts.intrus || []).map((x, i) => ({ id: 'intrus' + i, label: x.label, cible: null, indice: x.indice })));
    const vals = {};
    cles.forEach(k => { vals[k] = '#' + k; });
    return { type: 'schema', q: opts.q || 'Fais le schéma : place les données de l\'énoncé (le « ? » sur la grandeur que l\'on cherche).',
      titrePalette: 'Données de l\'énoncé', schema: schemaMvt(o, vals), etiquettes, solution: opts.solution, correction: opts.correction };
  }

  // expression du travail de la force k (« 0 car ⊥ », « f × AB × (−1) »)
  function exprTravail(o, k) {
    const d = nomD(o), a = angleDe(o, k), w = W(k);
    if (a === 90) return `${w} = 0 car ${nomV(k)} ⊥ au déplacement`;
    if (k === 'P') return a === 0 ? `${w} = P × ${d} × cos 0° = m × g × ${d}` : `${w} = P × ${d} × cos 180° = −m × g × ${d}`;
    const F = k === 'Fm' ? 'F<sub>m</sub>' : k;
    return a === 0 ? `${w} = ${F} × ${d} × cos 0° = ${F} × ${d} × 1` : `${w} = ${F} × ${d} × cos 180° = ${F} × ${d} × (−1)`;
  }
  // Angle α de chaque force avec le déplacement, puis l'expression de chaque travail
  function partieAngles(o, opts) {
    opts = opts || {};
    const vertical = o.sens !== 'droite';
    const lignes = (o.forces || ['P']).map(k => {
      const bon = angleDe(o, k), ind = {};
      [0, 90, 180].filter(a => a !== bon).forEach(a => {
        ind[a] = k === 'f' ? 'Les frottements s\'opposent au mouvement : <span class="vec-nom">f</span> est dans le sens <b>contraire</b> du déplacement (α = 180°).'
          : k === 'Fm' ? 'La force motrice fait avancer le système : elle est dans le <b>même sens</b> que le déplacement (α = 0°).'
          : k === 'P' && vertical ? (a === 90 ? 'Le déplacement est vertical, comme le poids : ils ne sont pas perpendiculaires.'
            : bon === 0 ? 'Le système descend et le poids est dirigé vers le bas : <b>même sens</b> (α = 0°).' : 'Le système monte et le poids est dirigé vers le bas : sens <b>contraires</b> (α = 180°).')
          : k === 'P' ? 'Le poids est vertical et le déplacement horizontal : ils sont <b>perpendiculaires</b> (α = 90°).'
          : 'La réaction est perpendiculaire au support, donc au déplacement (α = 90°).';
      });
      return { id: k, label: `${nomV(k)} <span class="ec-grille-desc">${DESC_F[k]}</span>`, bonne: String(bon), indices: ind, apres: `<p class="ec-expr">${exprTravail(o, k)}</p>` };
    });
    return { type: 'grille', q: opts.q || 'Pour chaque force, choisis l\'angle α entre la force et le déplacement A → B.',
      options: [o_('0', 'α = 0°'), o_('90', 'α = 90°'), o_('180', 'α = 180°')], lignes,
      solution: opts.solution || '<p>Une force perpendiculaire au déplacement ne travaille pas : W = 0, sans calcul. Pour α = 180°, cos α = −1.</p>',
      correction: opts.correction };
  }
  // Choisir le théorème écrit pour la situation (avec les travaux remplacés)
  function membreDroit(o, variante) {
    const d = nomD(o), fs = o.forces || ['P'];
    const sansF = !fs.includes('f');
    const t = fs.map(k => {
      if (o.sens !== 'droite') {
        if (variante === 'perp') return 'm × g';
        const pos = o.sens === 'bas' ? variante !== 'signe' : variante === 'signe';
        return pos ? `m × g × ${d}` : `−m × g × ${d}`;
      }
      if (k === 'f') return variante === 'signe' ? `f × ${d}` : `f × ${d} × (−1)`;
      if (k === 'Fm') return variante === 'signe' && sansF ? `F<sub>m</sub> × ${d} × (−1)` : `F<sub>m</sub> × ${d} × 1`;
      if (k === 'P' && variante === 'perp') return `m × g × ${d}`;
      return '0';
    });
    return t.join(' + ').replace(/\+ −/g, '− ');
  }
  function partieEquation(o, opts) {
    opts = opts || {};
    const G = '½ m v<sub>B</sub><sup>2</sup> − ½ m v<sub>A</sub><sup>2</sup>', Ginv = '½ m v<sub>A</sub><sup>2</sup> − ½ m v<sub>B</sub><sup>2</sup>';
    const vertical = o.sens !== 'droite';
    return { type: 'choix', colonne: true, q: opts.q || 'Écris le théorème de l\'énergie cinétique pour cette situation : quelle égalité est juste ?',
      options: [o_('ok', `${G} = ${membreDroit(o)}`), o_('inv', `${Ginv} = ${membreDroit(o)}`), o_('signe', `${G} = ${membreDroit(o, 'signe')}`), o_('perp', `${G} = ${membreDroit(o, 'perp')}`)],
      bonne: 'ok',
      indices: {
        inv: 'ΔE<sub>c</sub> = E<sub>c</sub>(B) − E<sub>c</sub>(A) : l\'état <b>final</b> moins l\'état <b>initial</b>.',
        signe: vertical ? 'Regarde l\'angle entre le poids et le déplacement : même sens, W = m g h ; sens contraires, W = −m g h.' : 'Pour α = 180°, cos α = −1 : le travail des frottements est <b>négatif</b>.',
        perp: vertical ? 'Le travail du poids est P × h = m × g × h : il faut multiplier par la hauteur.' : 'Le poids est perpendiculaire au déplacement : son travail est <b>nul</b>.',
      },
      solution: opts.solution, correction: opts.correction };
  }

  /* ============================================================
     DOCUMENTS DE L'ACTIVITÉ « FORCE DE RÉSISTANCE AÉRODYNAMIQUE »
     (SVG à taille fixe, mis à l'échelle de la carte)
     ============================================================ */
  // petite flèche (traits fins) de (x1, y1) à (x2, y2)
  function trait(x1, y1, x2, y2, cls) {
    const a = Math.atan2(y2 - y1, x2 - x1), c = Math.cos(a), s = Math.sin(a), bx = x2 - 7 * c, by = y2 - 7 * s;
    return `<g class="${cls || 'ec-tr'}"><line x1="${f1(x1)}" y1="${f1(y1)}" x2="${f1(bx)}" y2="${f1(by)}"/><path d="M${f1(x2)},${f1(y2)} L${f1(bx - 3.5 * s)},${f1(by + 3.5 * c)} L${f1(bx + 3.5 * s)},${f1(by - 3.5 * c)} Z"/></g>`;
  }
  // doc. 2 : traînée et portance sur une aile (l'avion va vers la droite, l'air glisse vers la gauche)
  function figAile() {
    let g = '';
    // filets d'air : rapides au-dessus (longues flèches), lents en dessous (courtes)
    [[40, 44], [130, 44], [220, 44], [40, 58], [130, 58], [220, 58]].forEach(([x, y]) => { g += trait(x + 80, y, x, y, 'ec-tr ec-tr-air'); });
    [[60, 168], [150, 168], [240, 168]].forEach(([x, y]) => { g += trait(x + 40, y, x, y, 'ec-tr ec-tr-air'); });
    g += `<text x="306" y="56" class="ec-sc-txt">air rapide</text><text x="290" y="172" class="ec-sc-txt">air lent</text>`;
    // pression : faible au-dessus (petites flèches vers le bas), forte en dessous (grandes flèches vers le haut)
    [130, 160, 190, 220, 250].forEach(x => { g += trait(x, 74, x, 86 + (x > 200 ? -2 : 2), 'ec-tr ec-tr-p'); });
    [130, 160, 190, 220, 250].forEach(x => { g += trait(x, 152, x, 126, 'ec-tr ec-tr-p'); });
    // l'aile : bord d'attaque arrondi à droite, bord de fuite pointu à gauche
    g += `<path d="M100,116 C150,92 220,82 262,90 Q292,98 284,111 Q260,120 210,120 C160,120 130,119 100,116 Z" class="ec-sc-aile"/>`;
    g += `<text x="200" y="110" text-anchor="middle" class="ec-sc-txt" style="font-weight:800">aile</text>`;
    // portance (vers le haut) et traînée (vers l'arrière)
    g += fleche(196, 92, 90, 62, COUL.port).svg + `<text x="206" y="36" class="ec-sc-lbl" style="fill:${COUL.port}">portance</text>`;
    g += fleche(100, 116, 180, 70, COUL.f).svg + `<text x="30" y="106" class="ec-sc-lbl" style="fill:${COUL.f}">traînée</text>`;
    g += trait(300, 196, 360, 196, 'ec-tr ec-tr-mvt') + `<text x="296" y="200" text-anchor="end" class="ec-sc-txt">sens de déplacement de l'avion</text>`;
    return `<svg viewBox="0 0 380 210" class="ec-doc" role="img" aria-label="Aile d'avion : l'air passe vite au-dessus et lentement en dessous ; la pression est plus forte en dessous ; la portance est vers le haut, la traînée vers l'arrière">${g}</svg>`;
  }
  // doc. 3 : le maître-couple, surface de l'avion vue de face
  function figMaitreCouple() {
    let g = '';
    // vue de profil : l'air arrive de face (l'avion va vers la droite)
    g += `<path d="M20,70 Q20,60 34,60 L120,58 Q140,58 150,66 Q140,74 120,74 L34,76 Q20,76 20,70 Z" class="ec-sc-avion"/>`;
    g += `<path d="M30,60 L22,40 L34,40 L46,60 Z M70,66 L88,92 L100,92 L90,66 Z" class="ec-sc-avion"/>`;
    [52, 66, 80].forEach(y => { g += trait(196, y, 162, y, 'ec-tr ec-tr-air'); });
    g += `<text x="85" y="114" text-anchor="middle" class="ec-sc-txt">vue de profil</text>`;
    // vue de face : surface exposée à l'air (en couleur)
    g += `<g class="ec-sc-face"><ellipse cx="290" cy="70" rx="15" ry="15"/><path d="M220,74 L360,74 L360,80 L220,80 Z M286,30 L294,30 L294,56 L286,56 Z M262,58 L318,58 L318,62 L262,62 Z"/></g>`;
    g += `<text x="290" y="108" text-anchor="middle" class="ec-sc-txt">vue de face :</text><text x="290" y="124" text-anchor="middle" class="ec-sc-txt" style="font-weight:800">maître-couple S</text>`;
    return `<svg viewBox="0 0 380 132" class="ec-doc" role="img" aria-label="Avion vu de profil, puis vu de face : la surface vue de face est le maître-couple S">${g}</svg>`;
  }
  // doc. 4 : coefficients de traînée Cx de quelques formes (l'air arrive de la gauche)
  function figFormes() {
    const cx = (x, y, nom, v) => `<text x="${x}" y="${y}" text-anchor="middle" class="ec-sc-txt" style="font-weight:700">${nom}</text>` +
      `<text x="${x}" y="${y + 15}" text-anchor="middle" class="ec-sc-txt">C<tspan dy="3" font-size="8">x</tspan><tspan dy="-3"> = ${v}</tspan></text>`;
    let g = trait(8, 22, 54, 22, 'ec-tr ec-tr-mvt') + '<text x="10" y="14" class="ec-sc-txt">air</text>';
    g += `<circle cx="90" cy="58" r="24" class="ec-sc-forme"/>` + cx(90, 100, 'sphère', '0,47');
    g += `<rect x="168" y="34" width="48" height="48" class="ec-sc-forme"/>` + cx(192, 100, 'cube', '1,05');
    g += `<path d="M314,34 A24,24 0 0 0 314,82 Z" class="ec-sc-forme"/>` + cx(302, 100, 'demi-sphère', '0,42');
    g += `<path d="M66,156 Q66,136 90,136 Q130,138 176,156 Q130,174 90,176 Q66,176 66,156 Z" class="ec-sc-forme"/>` + cx(120, 196, 'corps profilé', '0,04');
    g += `<path d="M236,168 Q236,140 264,140 Q300,144 340,168 Z" class="ec-sc-forme"/>` + cx(288, 196, 'corps semi-profilé', '0,09');
    return `<svg viewBox="0 0 380 216" class="ec-doc" role="img" aria-label="Coefficients de traînée : sphère 0,47 ; cube 1,05 ; demi-sphère 0,42 ; corps profilé 0,04 ; corps semi-profilé 0,09">${g}</svg>`;
  }
  // doc. 5 : traînée d'un corps profilé (S = 900 m²) en fonction de la vitesse, points de mesure et courbe
  // (valeurs lues sur le document : F ≈ 0,0271 × v² en kN) ; o.lectures : vitesses dont on trace la lecture
  const K_TRAINEE = 0.0271;
  function grapheTrainee(o) {
    o = o || {};
    return fig(W_ => {
      const W = Math.min(W_, 560), H = Math.round(Math.min(330, Math.max(230, W * .66)));
      const g0 = 54, d0 = 14, h0 = 20, b0 = 40, L = W - g0 - d0, Hh = H - h0 - b0;
      const X = v => g0 + v / 240 * L, Y = F => h0 + Hh - F / 1800 * Hh;
      const etroit = W < 420;
      let s = '';
      for (let v = 0; v <= 240; v += 20) {
        s += `<line x1="${f1(X(v))}" y1="${h0}" x2="${f1(X(v))}" y2="${h0 + Hh}" class="ph-grille"/>`;
        if (!etroit || v % 40 === 0) s += `<text x="${f1(X(v))}" y="${h0 + Hh + 17}" text-anchor="middle" class="ph-graduation">${v}</text>`;
      }
      for (let F = 0; F <= 1800; F += 200) {
        s += `<line x1="${g0}" y1="${f1(Y(F))}" x2="${g0 + L}" y2="${f1(Y(F))}" class="ph-grille"/>`;
        if (!etroit || F % 400 === 0) s += `<text x="${g0 - 6}" y="${f1(Y(F) + 4)}" text-anchor="end" class="ph-graduation">${fmt(F)}</text>`;
      }
      s += `<line x1="${g0}" y1="${h0 + Hh}" x2="${g0 + L}" y2="${h0 + Hh}" class="ph-axe"/><line x1="${g0}" y1="${h0}" x2="${g0}" y2="${h0 + Hh}" class="ph-axe"/>`;
      s += `<text x="${g0 + L}" y="${H - 4}" text-anchor="end" class="ph-axe-nom">v (m·s<tspan dy="-5" font-size="10">−1</tspan><tspan dy="5">)</tspan></text>`;
      s += `<text x="${g0 + 4}" y="${h0 - 6}" class="ph-axe-nom">F<tspan dy="3" font-size="10">traînée</tspan><tspan dy="-3"> (kN)</tspan></text>`;
      let d = '';
      for (let v = 0; v <= 240; v += 4) d += (v ? ' L' : 'M') + f1(X(v)) + ',' + f1(Y(K_TRAINEE * v * v));
      s += `<path d="${d}" class="ph-courbe"/>`;
      for (let v = 0; v <= 240; v += 20) s += `<circle cx="${f1(X(v))}" cy="${f1(Y(K_TRAINEE * v * v))}" r="3.4" class="ph-point"/>`;
      (o.lectures || []).forEach(v => {
        const F = K_TRAINEE * v * v;
        s += `<path d="M${f1(X(v))},${h0 + Hh} V${f1(Y(F))} H${g0}" class="ph-lecture" fill="none"/>`;
      });
      return `<svg viewBox="0 0 ${W} ${H}" width="${W}" class="ph-graphe" role="img" aria-label="Traînée d'un corps profilé en fonction de la vitesse : la courbe monte de plus en plus vite (parabole), de 0 à environ 1 560 kN pour 240 m/s">${s}</svg>`;
    });
  }

  /* ============================================================
     FIGURES DU COURS
     ============================================================ */
  // frottements solides : R⃗ = R⃗N + f⃗ (le bloc glisse vers la droite)
  function figFrottement() {
    let g = `<line x1="20" y1="120" x2="300" y2="120" class="ec-sc-sol"/>`;
    for (let x = 28; x < 300; x += 14) g += `<line x1="${x}" y1="121" x2="${x - 8}" y2="130" class="ec-sc-hach"/>`;
    g += `<rect x="120" y="86" width="80" height="34" rx="3" class="ec-sc-sys"/>`;
    g += trait(214, 96, 270, 96, 'ec-tr ec-tr-mvt') + '<text x="242" y="88" text-anchor="middle" class="ec-sc-txt">mouvement</text>';
    // R⃗ = R⃗N + f⃗ : diagonale du parallélogramme
    g += `<path d="M160,48 H116 V120" class="ec-sc-para"/>`;
    g += force('RN', 160, 120, 90, 72) + force('f', 160, 120, 180, 44);
    const ang = 180 - Math.atan2(72, 44) * 180 / Math.PI, L = Math.hypot(72, 44);
    g += fleche(160, 120, ang, L, '#1c3782').svg + nomSVG('R', 104, 44, '#1c3782');
    return `<svg viewBox="0 0 320 140" class="ec-doc ec-doc-petit" role="img" aria-label="Bloc qui glisse vers la droite : réaction normale verticale vers le haut, frottements vers la gauche, réaction R, somme des deux, oblique vers le haut et la gauche">${g}</svg>`;
  }
  // travail d'une force : solide qui va de A à B, force F⃗ faisant l'angle α avec AB⃗
  // o = { alpha (degrés, 30 par défaut), nom ('F'), legende }
  function figTravail(o) {
    o = o || {};
    const a = o.alpha == null ? 30 : o.alpha, xA = 60, xB = 280, y = 112;
    let g = `<line x1="${xA}" y1="${y}" x2="${xB - 10}" y2="${y}" class="ec-sc-dep"/><path d="M${xB},${y} l-11,-5 v10 Z" class="ec-sc-dep-p"/>`;
    g += `<circle cx="${xA}" cy="${y}" r="4" class="ec-sc-point"/><circle cx="${xB}" cy="${y}" r="4" class="ec-sc-point"/>`;
    g += `<text x="${xA - 6}" y="${y + 22}" class="ec-sc-pt">A</text><text x="${xB - 6}" y="${y + 22}" class="ec-sc-pt">B</text>`;
    g += `<text x="${(xA + xB) / 2}" y="${y + 22}" text-anchor="middle" class="ec-sc-txt">déplacement AB</text>`;
    const r = a * Math.PI / 180, R = 34;
    if (a !== 0) g += `<path d="M${xA + R},${y} A${R},${R} 0 0 ${a > 0 ? 0 : 1} ${f1(xA + R * Math.cos(r))},${f1(y - R * Math.sin(r))}" class="ec-sc-arc"/>` +
      `<text x="${f1(xA + (R + 12) * Math.cos(r / 2))}" y="${f1(y - (R + 12) * Math.sin(r / 2) + 5)}" text-anchor="middle" class="ec-sc-alpha">α</text>`;
    g += force(o.nom || 'F', xA, y, a, 92);
    return `<svg viewBox="0 0 320 140" class="ec-doc ec-doc-petit" role="img" aria-label="Le solide va de A à B ; la force F fait un angle alpha avec le déplacement">${g}</svg>`;
  }
  // travail du poids sur une pente : o = { sens: 'descend' | 'monte' }
  // A est le départ : en haut pour une descente, en bas pour une montée
  function figPente(o) {
    o = o || {};
    const monte = o.sens === 'monte', H = [64, 40], Bs = [300, 140];
    const dep = monte ? Bs : H, arr = monte ? H : Bs;
    let g = `<line x1="16" y1="140" x2="324" y2="140" class="ec-sc-sol"/><line x1="${H[0]}" y1="${H[1]}" x2="${Bs[0]}" y2="${Bs[1]}" class="ec-sc-pente"/>`;
    g += `<line x1="36" y1="40" x2="36" y2="140" class="ec-sc-cote"/><path d="M36,40 l-4,8 h8 Z M36,140 l-4,-8 h8 Z" class="ec-sc-cote-p"/><text x="20" y="96" class="ec-sc-pt">h</text>`;
    g += `<line x1="36" y1="40" x2="${H[0]}" y2="40" class="ec-sc-ref"/>`;
    // le solide au départ, son poids ; le déplacement le long de la pente (au-dessus)
    const ang = Math.atan2(Bs[1] - H[1], Bs[0] - H[0]) * 180 / Math.PI, [x, y] = monte ? [272, 118] : [92, 42];
    g += `<rect x="${x - 15}" y="${y - 12}" width="30" height="20" rx="3" class="ec-sc-sys" transform="rotate(${f1(ang)} ${x} ${y})"/>`;
    g += monte ? trait(238, 92, 128, 46, 'ec-tr ec-tr-mvt') : trait(118, 44, 228, 90, 'ec-tr ec-tr-mvt');
    g += `<text x="${dep[0] + (monte ? 8 : -6)}" y="${dep[1] + (monte ? 18 : -10)}" class="ec-sc-pt" text-anchor="${monte ? 'start' : 'end'}">A</text>`;
    g += `<text x="${arr[0] + (monte ? -6 : 8)}" y="${arr[1] + (monte ? -10 : 18)}" class="ec-sc-pt" text-anchor="${monte ? 'end' : 'start'}">B</text>`;
    g += `<text x="196" y="118" class="ec-sc-pt" text-anchor="middle">AB</text>`;
    g += force('P', x, y - 2, 270, 40);
    g += `<text x="170" y="162" class="ec-sc-txt" text-anchor="middle">AB : longueur de la pente ; h : dénivelé</text>`;
    return `<svg viewBox="0 0 340 170" class="ec-doc ec-doc-petit" role="img" aria-label="Pente de hauteur h ; le solide ${monte ? 'monte' : 'descend'} de A vers B ; le poids est vertical vers le bas">${g}</svg>`;
  }

  /* ============================================================
     PLAN DE L'APPLICATION ET NAVIGATION (voir assets/sommaire.js)
     ============================================================ */
  const PLAN = [
    { n: 1, titre: 'Forces de frottement', desc: 'Frottements solides, traînée f<sub>x</sub> = ½ ρ v² S C<sub>x</sub>, portance', fiche: 'fiche_1',
      parties: [{ nom: 'Forces de frottement', simulation: 'module_1_simulation', cours: 'module_1_cours', questions: 'module_1_questions', noms: { simulation: 'Activité : la traînée' } }] },
    { n: 2, titre: 'Travail d\'une force', desc: 'W<sub>AB</sub>(<span class="vec-nom">F</span>) = F × AB × cos α ; travail moteur, résistant ou nul ; travail du poids', fiche: 'fiche_2',
      parties: [{ nom: 'Travail d\'une force', simulation: 'module_2_simulation', cours: 'module_2_cours', questions: 'module_2_questions', noms: { simulation: 'Simulateur : travail d\'une force' } }] },
    { n: 3, titre: 'Énergie cinétique', desc: 'E<sub>c</sub> = ½ m v², vitesse en m/s', fiche: 'fiche_3',
      parties: [{ nom: 'Énergie cinétique', cours: 'module_3_cours', questions: 'module_3_questions' }] },
    { n: 4, titre: 'Théorème de l\'énergie cinétique', desc: 'ΔE<sub>c</sub> = Σ W, méthode avec schéma : chute, freinage, démarrage', fiche: 'fiche_4',
      parties: [{ nom: 'Énoncé et chute', slug: 'chute', cours: 'module_4a_cours', questions: 'module_4a_questions' },
        { nom: 'Freinage et démarrage', slug: 'freinage', cours: 'module_4b_cours', questions: 'module_4b_questions' }] },
    { n: 5, titre: 'Exercices', desc: 'Exercices 18 et 19 p. 98, guidés pas à pas', exercices: 'module_5', exNom: 'Exercices 18 et 19', nbEx: 2 },
  ];
  window.SOM.init({ nom: 'Chapitre 7 : Théorème de l\'énergie cinétique', id: 'energie-cinetique', cleEx: 'energie-cinetique-exercices', plan: PLAN });
  const menu = cle => window.SOM.menu(cle);
  const accueil = zone => window.SOM.accueil(zone);
  const marquer = info => window.SOM.marquer(info);

  window.EC = Object.assign(window.EC || {}, {
    MOINS, fmt, cs, sci, lire, proche, fr, rac, unite, o, fq, el, secouer, melanger, hasard, entre, champ, boutonValider, PARTIES, versCours,
    question, serie, confettis, fig, monter, outil, cap, slot, V, NOMS, nomV, W, COUL, fleche, nomSVG, force, trait,
    DESC_F, angleDe, schemaMvt, partieDonnees, exprTravail, partieAngles, partieEquation,
    figAile, figMaitreCouple, figFormes, K_TRAINEE, grapheTrainee, figFrottement, figTravail, figPente,
    PLAN, menu, accueil, marquer,
  });
})();
