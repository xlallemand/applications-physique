/* ============================================================
   Moteur de l'application « Chapitre 18 : Ondes sonores »
   (Terminale STI2D ; même moteur de questions que « Chapitre 17 :
   Spectre d'un signal périodique » et « Cinématique » ; navigation
   commune assets/sommaire.js, cours avec assets/cours.js ; signal,
   spectre et simulateur : assets/fourier.js ; son, notes et
   instruments : modules/son.js)

   OS.fmt, OS.cs, OS.sci, OS.lire     écriture et lecture des nombres (virgule)
   OS.o, OS.fq.choix, OS.fq.nombre    fabriques d'options et de parties de question
   OS.PARTIES                         parties de question : 'choix', 'nombre', 'gabarit', 'sci',
                                      'grille' (un choix par ligne), 'schema' (étiquettes à glisser
                                      dans les cases d'un schéma, OS.slot(id)), 'perso' (p.monter(zone, api) → { montrer() })
   OS.versCours(p)                    une de ces parties dans un cours (assets/cours.js)
   OS.question(zone, q, cb, mode)     question en plusieurs parties (série, exercice, simulation)
   OS.serie(opts)                     série de questions notée sur 20
   OS.fig(dessin), OS.outil(monter)   figure dessinée à la largeur disponible, outil placé dans du HTML
   OS.figSignal(spec, o), OS.figSpectre(raies, o), OS.raiesSon(f1, a)
                                      signal u(t) et spectre d'un son (FOURIER.svgSignal / svgSpectre)
   OS.spectreAuHasard(o)              spectre tiré au hasard, lisible sur la grille
   OS.partieMesure(o)                 outil « mesurer une période » (partie 'perso') : deux curseurs
   OS.niveau(I), OS.intensite(L)      L = 10 log(I / I0) et I = I0 × 10^(L/10), I0 = 10⁻¹² W·m⁻²
   OS.svgLog(o)                       graphique dont l'axe des fréquences est en échelle logarithmique
   OS.svgAudiogramme(o), OS.seuil(f), OS.douleur(f), OS.estAudible(f, L)
                                      courbe de sensibilité de l'oreille (seuils, zones)
   OS.partieAudiogramme(o)            outil « audiogramme » (partie 'perso') : placer un point (f, L)
                                      par glisser-déposer puis dire s'il est audible, ou lire un point
   OS.svgDistance(), OS.svgParoi(o), OS.schemaParoi()
                                      intensité et distance (A, 4A, 9A), onde qui frappe une paroi
   OS.menu(cle), OS.accueil(zone)     navigation commune (SOM) avec le plan de l'application

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
      // milliers séparés par une espace insécable : 1 000 ne se coupe pas en fin de ligne
      e = e.replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0');
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
  const proche = (a, b, rel) => Math.abs(a - b) <= (rel == null ? .01 : rel) * Math.abs(b) + (b === 0 ? 1e-12 : Math.abs(b) * 1e-12);

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
     api.reussi(silencieux, note, sansDefiler) · api.erreur(indice) · api.effacer() · api.message(h) · api.fini()
     (sansDefiler : la partie suivante apparaît sans que la page défile jusqu'à elle)
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
    const d = el('div', 'ph-valeur os-gab');
    if (p.label) d.appendChild(el('span', 'ph-lab', p.label));
    // chaque case forme un groupe insécable avec le texte qui la suit (et le texte d'ouverture
    // avec la première case) : sur un petit écran, la ligne ne se coupe qu'entre deux groupes
    const champs = [];
    let grp = el('span', 'os-gab-grp');
    d.appendChild(grp);
    p.morceaux.forEach(m => {
      if (typeof m === 'string') { grp.appendChild(el('span', 'os-gab-txt', m)); return; }
      if (champs.length) { grp = el('span', 'os-gab-grp'); d.appendChild(grp); }
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


  /* Grille de choix : une ligne par élément, un choix par ligne, toutes validées ensemble
     (« Entoure l'adjectif qui convient », angle α de chaque force…)
     p.lignes [{ id, label (HTML), bonne (id d'option), indices { id d'option: diagnostic }, apres (HTML affiché une fois réussi) }]
     p.options [{ id, label }] : les mêmes pour chaque ligne ; p.diag(fausses) → diagnostic d'ensemble (facultatif) */
  function pGrille(zone, p, api) {
    const g = el('div', 'os-grille');
    g.innerHTML = p.lignes.map(l => `<div class="os-grille-l" data-l="${l.id}">
        <div class="os-grille-nom">${l.label}</div>
        <div class="os-grille-ch" role="group" aria-label="${String(l.label).replace(/<[^>]+>/g, '').replace(/"/g, '')}">
          ${p.options.map(o => `<button type="button" class="os-grille-b" data-o="${o.id}" aria-pressed="false">${o.label}</button>`).join('')}</div>
        <div class="os-grille-apres" hidden></div></div>`).join('');
    zone.appendChild(g);
    const lignes = Array.from(g.querySelectorAll('.os-grille-l'));
    const choisi = {};
    lignes.forEach(L => {
      L.querySelectorAll('.os-grille-b').forEach(b => {
        b.onclick = () => {
          if (api.fini() || b.disabled) return;
          choisi[L.dataset.l] = b.dataset.o;
          L.querySelectorAll('.os-grille-b').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
          L.classList.remove('ok', 'ko');
          api.effacer();
        };
      });
    });
    const bVal = boutonValider(zone);
    function terminer() {
      lignes.forEach((L, k) => {
        L.classList.remove('ko'); L.classList.add('ok');
        L.querySelectorAll('.os-grille-b').forEach(b => { b.disabled = true; });
        const a = L.querySelector('.os-grille-apres');
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
        lignes.forEach((L, k) => L.querySelectorAll('.os-grille-b').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.o === p.lignes[k].bonne))));
        terminer();
      },
    };
  }

  // Outil propre à l'application : p.monter(zone, api) → { montrer() }
  function pPerso(zone, p, api) {
    const ctx = p.monter(zone, api) || {};
    return { montrer() { if (ctx.montrer) ctx.montrer(); } };
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
     p.schema : HTML du schéma, avec des cases OS.slot(id)
     p.etiquettes : [{ id, label, cible (id de case ou liste d'ids, null pour un intrus), indice }]
     p.inconnues : ids des cases qui doivent rester vides (les inconnues) ; sans p.inconnues,
                   toutes les cases doivent être remplies
     p.indicesCases : { id de case : diagnostic quand cette case est laissée vide à tort }
     Les étiquettes « intruses » (cible null) restent dans la palette.
     Au doigt : on touche une étiquette, puis une case. */
  function pSchema(zone, p, api) {
    const inconnues = p.inconnues || null;
    const d = el('div', 'sc-exo');
    d.innerHTML = `<div class="sc-palette"><p class="sc-palette-t">${p.titrePalette || 'Étiquettes à placer'} <span>· fais-les glisser sur le schéma, ou touche une étiquette puis une case</span></p>
        <div class="sc-palette-liste">${melanger(p.etiquettes).map(e => `<button type="button" class="sc-chip" data-id="${e.id}"><span>${e.label}</span></button>`).join('')}</div></div>
      ${p.schema}`;
    zone.appendChild(d);
    const palette = d.querySelector('.sc-palette-liste');
    const chips = Array.from(d.querySelectorAll('.sc-chip'));
    const slots = Array.from(d.querySelectorAll('.sc-slot'));
    const etiq = id => p.etiquettes.find(e => e.id === id);
    const cibles = c => [].concat(etiq(c.dataset.id).cible || []);
    const estInconnue = s => !!inconnues && inconnues.indexOf(s.dataset.slot) !== -1;
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
      slots.forEach(s => { s.tabIndex = -1; if (estInconnue(s)) s.classList.add('os-inconnue'); });
      d.classList.add('sc-fini');
      bVal.fermer();
    }
    bVal.onclick = () => {
      if (fini || api.fini()) return;
      const placees = chips.filter(c => c.parentElement.classList.contains('sc-slot'));
      if (!inconnues) {
        const reste = slots.filter(s => !s.querySelector('.sc-chip')).length;
        if (reste) {
          secouer(d.querySelector('.sc-palette'));
          api.message(`Remplis toutes les cases du schéma (il en reste ${reste}).`);
          return;
        }
      } else if (!placees.length) {
        secouer(d.querySelector('.sc-palette'));
        api.message('Fais glisser les étiquettes dans les cases du schéma (laisse vide la case de l\'inconnue).');
        return;
      }
      // plusieurs cases encore vides : le schéma n'est pas fini (pas d'erreur comptée) ;
      // une seule case vide à tort : l'élève a pris une valeur connue pour l'inconnue (erreur)
      const videsATort = inconnues ? slots.filter(s => !s.querySelector('.sc-chip') && !estInconnue(s)) : [];
      if (videsATort.length >= 2) {
        secouer(d.querySelector('.sc-palette'));
        api.message(`Il reste ${videsATort.length} cases à remplir : seule la case de l'inconnue reste vide.`);
        return;
      }
      // étiquettes mal placées, puis case laissée vide à tort (ce n'est pas une inconnue)
      const fausses = [];
      placees.forEach(c => {
        const s = c.parentElement, ok = cibles(c).indexOf(s.dataset.slot) !== -1;
        s.classList.toggle('ok', ok); s.classList.toggle('ko', !ok);
        if (!ok) fausses.push(c);
      });
      videsATort.forEach(s => s.classList.add('ko'));
      if (!fausses.length && !videsATort.length) { terminer(); api.reussi(); return; }
      const indices = fausses.map(c => etiq(c.dataset.id).indice || (c.parentElement && estInconnue(c.parentElement) ? p.indiceInconnue : '')).filter(Boolean)
        .concat(videsATort.map(s => (p.indicesCases && p.indicesCases[s.dataset.slot]) || '').filter(Boolean));
      const phr = [];
      if (fausses.length) phr.push(`${fausses.length > 1 ? `${fausses.length} étiquettes sont mal placées` : 'Une étiquette est mal placée'} (case rouge)`);
      if (videsATort.length) phr.push('la case vide en rouge n\'est pas une inconnue : sa valeur est connue, place-la');
      const txt = phr.join(' ; ');
      api.erreur(txt.charAt(0).toUpperCase() + txt.slice(1) + '.' + (indices.length ? '<br>' + indices.map(t => '☛ ' + t).join('<br>') : ''));
      secouer(d.querySelector('.os-sch') || d);
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

  const PARTIES = { choix: pChoix, nombre: pNombre, gabarit: pGabarit, sci: pSci, grille: pGrille, schema: pSchema, perso: pPerso };
  // une partie de ce moteur dans un cours (assets/cours.js) : elle y devient un outil « perso »
  const versCours = p => ({ type: 'perso', q: p.q, solution: p.solution || p.correction, aide: p.aide, monter: (zone, api) => PARTIES[p.type](zone, p, api) });

  /* ============================================================
     « AFFICHER TOUT LE COURS »
     Les questions et les « À toi » en cours s'inscrivent ici. Quand
     l'élève demande tout le cours, chacun « se déplie » : toutes ses
     parties sont affichées d'un coup, avec le bouton « Afficher la
     réponse » disponible tout de suite. OS.tout reste vrai ensuite :
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
      window.OS.partieEnCours = p;          // partie en cours (utile pour vérifier l'application)
      const d = el('div', 'ph-partie', `${p.q ? `<div class="ph-partie-q">${p.q}</div>` : ''}<div class="ph-partie-fig"></div><div class="ph-partie-zone"></div><div class="ph-partie-retour"></div>
        <div class="ph-partie-aide${mode === 'cours' && !deplie && !p.aide ? ' hidden' : ''}"><button type="button" class="btn-small">${libAide}</button></div>`);
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
        reussi(silencieux, note, sansDefiler) { terminer(false, silencieux, note, sansDefiler); },
      };
      const ctx = PARTIES[p.type](d.querySelector('.ph-partie-zone'), p, api);
      p.ctx = ctx;
      bRep.onclick = () => { if (finie) return; ctx.montrer(); etat.vue = true; terminer(true); };
      function terminer(vue, silencieux, note, sansDefiler) {
        if (finie) return;
        finie = true;
        aide.remove();
        etat.details.push({ vue, erreurs: erreursIci });
        const titre = vue ? (mode === 'exercice' ? 'Correction' : 'Réponse') : (erreursIci ? 'C\'est juste.' : 'Juste !');
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
            if (!sansDefiler) setTimeout(() => s.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 80);
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
    if (mode === 'cours' && window.OS.tout) inst.deplier();
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
        <div class="cle" style="margin:14px 0"><p><b class="cle-titre">Barème</b> · ${opts.nombre || 10} questions, notées sur 20 :</p>
          <ul class="er-liste"><li><b>2 points</b> si tout est juste du premier coup ;</li><li><b>1 point</b> si tu y arrives après au moins une erreur ;</li><li><b>0 point</b> si tu affiches la réponse.</li></ul></div>
        <button type="button" class="btn-primary" data-a="go">Commencer →</button></div>`;
      app.querySelector('[data-a="go"]').onclick = demarrer;
      window.scrollTo(0, 0);
    }
    function demarrer() { qs = opts.questions(); idx = 0; score = 0; recap = []; afficher(); }

    function afficher() {
      if (idx >= qs.length) return fin();
      const q = qs[idx];
      window.OS.questionEnCours = q;          // question en cours (utile pour vérifier l'application)
      app.innerHTML = `<div class="er-card"><span class="er-badge">${opts.badge}</span><h2 class="er-titre">${opts.titre}</h2>
          <p class="er-meta">Question ${idx + 1}/${qs.length} · Score : <b data-a="score">${pts(score)}</b></p>
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
          const titre = p === 2 ? 'Bravo, juste du premier coup !' : p === 1 ? 'C\'est juste, après au moins une erreur.' : 'La réponse a été affichée.';
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
      const msg = score === max ? 'Tout est juste : bravo !' : pct >= 70 ? 'Très bien ! Encore un peu d\'entraînement pour le sans-faute.'
        : pct >= 50 ? 'Pas mal ! Recommence pour progresser : les questions changent à chaque fois.' : 'Continue à t\'entraîner : relis le cours, puis recommence.';
      app.innerHTML = `<div class="er-card er-fin"><span class="er-badge">${opts.badge}</span><h2 class="er-titre">Série terminée !</h2>
        ${score === max ? '<p class="er-trophee">🏆 Sans-faute !</p>' : ''}
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
     OS.fig(dessin) renvoie un emplacement HTML ; dès qu'il est dans la
     page, dessin(W) y est appelé avec la largeur disponible W (et de
     nouveau quand la largeur change) : les textes gardent leur taille
     et restent lisibles sur un téléphone. Plusieurs figures par page.
     ============================================================ */
  const DESSINS = new Map();
  let nFig = 0, nMotif = 0;
  function fig(dessin, cls) {
    const k = String(++nFig);
    DESSINS.set(k, dessin);
    return `<div class="os-fig${cls ? ' ' + cls : ''}" data-fig="${k}"></div>`;
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
    const l = racine.matches && racine.matches('.os-fig[data-fig]') ? [racine] : [];
    racine.querySelectorAll('.os-fig[data-fig]').forEach(x => l.push(x));
    l.forEach(x => { const f = DESSINS.get(x.dataset.fig); if (f) monter(x, f); });
  }
  new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(chercher))).observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener('DOMContentLoaded', () => chercher(document.body));

  /* ============================================================
     OUTILS INTERACTIFS PLACÉS DANS DU HTML
     OS.outil(monter) renvoie un emplacement HTML ; dès qu'il est dans la
     page, monter(div) y construit l'outil, une seule fois.
     ============================================================ */
  const OUTILS = new Map();
  let nOutil = 0;
  function outil(f) {
    const k = String(++nOutil);
    OUTILS.set(k, f);
    return `<div class="os-outil" data-outil="${k}"></div>`;
  }
  function chercherOutils(racine) {
    if (!racine || !racine.querySelectorAll) return;
    const l = racine.matches && racine.matches('.os-outil[data-outil]') ? [racine] : [];
    racine.querySelectorAll('.os-outil[data-outil]').forEach(x => l.push(x));
    l.forEach(x => {
      if (x.dataset.monte) return;
      const f = OUTILS.get(x.dataset.outil);
      if (f) { x.dataset.monte = '1'; f(x); }
    });
  }
  new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(chercherOutils))).observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener('DOMContentLoaded', () => chercherOutils(document.body));
  const cap = t => t.charAt(0).toUpperCase() + t.slice(1);

  // racine carrée écrite avec sa barre : √200 ; le signe (SVG étiré) prend la hauteur du contenu
  // (une fraction comprise) et rejoint la barre posée juste au-dessus du contenu
  const rac = x => '<span class="racine"><span class="racine-signe"><span class="racine-lu">√</span>' +
    '<svg viewBox="0 0 10 100" preserveAspectRatio="none" aria-hidden="true"><path d="M0,62 L2.6,55 L5.6,99 L10,0" vector-effect="non-scaling-stroke"/></svg></span>' +
    `<span class="racine-sous">${x}</span></span>`;

  /* ============================================================
     SIGNAL ET SPECTRE D'UN SON (assets/fourier.js) À LA LARGEUR DISPONIBLE
     ============================================================ */
  const F = () => window.FOURIER;
  const borne = (v, a, b) => Math.max(a, Math.min(b, v));
  // v fait-il partie de la liste l ? (comparaison tolérante pour les décimaux)
  const dans = (l, v) => l.some(x => Math.abs(x - v) < 1e-6 * Math.max(1, Math.abs(v)));
  const figSignal = (spec, o) => fig(W => F().svgSignal(spec, Object.assign({}, o, { W: Math.min(W, (o && o.Wmax) || 720) })));
  // o.etiqFEtroit : fréquences écrites à la place de o.etiqF sur un écran étroit (moins de 420 px)
  const figSpectre = (liste, o) => fig(W => {
    const w = Math.min(W, (o && o.Wmax) || 720);
    return F().svgSpectre(liste, Object.assign({}, o, { W: w }, o && o.etiqFEtroit && w < 420 ? { etiqF: o.etiqFEtroit } : {}));
  });
  // raies d'un son : fondamental f1 et amplitudes a1, a2… (un son n'a pas de composante continue)
  const raiesSon = (f1, a) => F().raies({ f1, a0: 0, a });

  /* ============================================================
     SPECTRE TIRÉ AU HASARD, LISIBLE SUR LA GRILLE
     f1 multiple de 50 Hz ; une ligne verticale toutes les f1 / 2 ;
     amplitudes multiples de 0,5 V (ou de 100 mV).
     o = { f1s, rangs (liste imposée), a0 (true : composante continue ; un son n'en a pas),
           mV (bool), libres (true : fondamental pas forcément haut) }
     → { f1, a0, a, raies, opts (options de FOURIER.svgSpectre), gF, gA, unite }
     ============================================================ */
  function spectreAuHasard(o) {
    o = o || {};
    const f1 = hasard(o.f1s || [100, 150, 200, 250, 300, 400, 500]);
    let rangs = o.rangs;
    if (!rangs) {
      const nmax = entre(4, 7), milieu = melanger(Array.from({ length: nmax - 2 }, (_, i) => i + 2)).slice(0, entre(1, 3));
      rangs = [1].concat(milieu, [nmax]).sort((x, y) => x - y);
    }
    const mV = o.mV != null ? o.mV : Math.random() < .35, gA = mV ? 100 : .5, unite = mV ? 'mV' : 'V';
    const a = Array(Math.max(...rangs)).fill(0);
    rangs.forEach(n => { a[n - 1] = entre(1, 8) * gA; });
    if (!o.libres) a[0] = Math.max(a[0], 4 * gA);                 // fondamental bien visible
    const a0 = o.a0 === true ? entre(1, 6) * gA : 0;
    const nmax = Math.max(...rangs), fmax = (nmax + 1) * f1, gF = f1 / 2;
    const L = [100, 150, 200, 250, 300, 400, 500, 600, 750, 1000, 1500, 2000, 2500, 3000].find(c => c % gF === 0 && fmax / c <= 6) || f1;
    const max = Math.max(a0, ...a), pasEtiq = mV ? (max > 800 ? 400 : 200) : 1;
    const amax = Math.ceil((max + gA / 2) / pasEtiq) * pasEtiq;
    const etiqA = Array.from({ length: Math.round(amax / pasEtiq) + 1 }, (_, k) => +(k * pasEtiq).toFixed(6));
    const etiqF = Array.from({ length: Math.floor(fmax / L) + 1 }, (_, k) => k * L);
    const spec = { f1, a0, a };
    return { f1, a0, a, unite, gF, gA, spec, raies: F().raies(spec), opts: { fmax, pasF: gF, etiqF, amax, pasA: gA, etiqA, unite } };
  }

  /* ============================================================
     OUTIL « MESURER UNE PÉRIODE » (partie 'perso', repris du chapitre 17)
     Deux curseurs à faire glisser sur le signal (au doigt, à la souris)
     pour encadrer n périodes ; la durée s'affiche, l'élève écrit n.
     o = { spec, tmax, pasT, ymin, ymax, pasY, nom, unite, minN (2), q, solution,
           res (objet rempli avec { dt, n } quand c'est réussi) }
     ============================================================ */
  // instant du premier sommet du signal (le plus haut point de la première période), en ms
  function premierSommet(spec) {
    const T = 1000 / spec.f1;
    let tm = 0, vm = -Infinity;
    for (let k = 0; k <= 2000; k++) { const t = T * k / 2000, v = F().valeur(spec, t / 1000); if (v > vm) { vm = v; tm = t; } }
    return tm;
  }
  function partieMesure(o) {
    const spec = o.spec, T = 1000 / spec.f1, minN = o.minN || 2, res = o.res || {};
    return {
      type: 'perso', aide: o.aide,
      q: o.q || `Fais glisser les deux curseurs pour encadrer <b>plusieurs périodes</b> (au moins ${minN}), en les plaçant sur deux points identiques du signal (deux sommets les plus hauts, par exemple). Écris ensuite le nombre n de périodes encadrées.`,
      solution: o.solution,
      monter(zone, api) {
        const d = el('div', 'os-mesure');
        zone.appendChild(d);
        const sim = F().monter(d, { spectre: false, commandes: false, predefinis: false, cases: false, legende: false, mesure: true,
          f1: spec.f1, a0: spec.a0 || 0, a: spec.a, tmax: o.tmax, pasT: o.pasT, ymin: o.ymin, ymax: o.ymax, pasY: o.pasY, nom: o.nom || 'u', unite: o.unite || 'V', titreY: o.titreY });
        sim.surChange(() => api.effacer());
        const v = el('div', 'os-mesure-n');
        v.innerHTML = '<span class="ph-lab">Nombre de périodes entre les curseurs : n =</span>';
        const cn = champ({ signe: false, aria: 'Nombre de périodes encadrées' });
        v.appendChild(cn.el);
        d.appendChild(v);
        const bVal = boutonValider(d);
        cn.input.addEventListener('input', () => api.effacer());
        cn.input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); valider(); } });
        function valider() {
          if (api.fini()) return;
          const n = lire(cn.input.value), e = sim.etat(), dt = Math.abs(e.t2 - e.t1);
          if (isNaN(n) || n < 1 || !Number.isInteger(n)) { secouer(v); api.message('Écris le nombre de périodes encadrées (un nombre entier).'); return; }
          // tolérance : deux pas de déplacement des curseurs, ou 1,5 % de la durée mesurée
          const tmaxAxe = F().axesSignal(spec, { tmax: o.tmax }).tmax, tol = Math.max(2 * F().pasJoli(tmaxAxe, 100), .015 * n * T);
          const k = dt / T;
          if (Math.abs(dt - n * T) <= tol) {
            if (n < minN) { api.erreur(`C'est juste, mais encadre au moins <b>${minN} périodes</b> : la mesure est plus précise.`); return; }
            res.dt = dt; res.n = n;
            cn.desactiver(true); bVal.fermer(); api.reussi();
            return;
          }
          api.erreur(Math.abs(k - Math.round(k)) * T <= tol && Math.round(k) >= 1
            ? `Tes curseurs encadrent ${Math.round(k)} période${Math.round(k) > 1 ? 's' : ''}, pas ${n}. Compte les motifs qui se répètent entre les curseurs.`
            : 'Tes curseurs n\'encadrent pas un nombre entier de périodes : place-les sur deux points <b>identiques</b> du signal (deux sommets les plus hauts, par exemple).');
          secouer(v);
        }
        bVal.onclick = valider;
        return {
          montrer() {
            // curseurs sur deux sommets séparés du plus grand nombre de périodes possible
            const t1 = premierSommet(spec), tmax = o.tmax || 3 * T, n = Math.max(minN, Math.floor((tmax - t1) / T + 1e-9));
            sim.regler({ t1: Math.round(t1 * 100) / 100, t2: Math.round((t1 + n * T) * 100) / 100 }, true);
            cn.input.value = String(n); cn.desactiver(true); bVal.fermer();
            res.dt = n * T; res.n = n;
          },
        };
      },
    };
  }

  /* ============================================================
     NIVEAU SONORE
     L = 10 log(I / I0) (en dB) ; I = I0 × 10^(L/10) (en W·m⁻²) ; I0 = 10⁻¹² W·m⁻²
     ============================================================ */
  const I0 = 1e-12;
  const niveau = I => 10 * Math.log10(I / I0);
  const intensite = L => I0 * Math.pow(10, L / 10);

  /* ============================================================
     GRAPHIQUE À AXE DES FRÉQUENCES LOGARITHMIQUE
     (audiogramme, perte auditive, atténuation d'une paroi, bouchons d'oreilles)
     o = { W, H, fmin, fmax, ymin, ymax, pasY, etiqY, inverse (axe vertical vers le bas),
           titreY (SVG), titreF, etiqF (fréquences écrites), ml (marge gauche),
           courbes: [{ pts: [[f, y]…], cls, droit (ligne brisée), label, lf, ly, dy, ancre, clsT }],
           ellipses: [{ lf, y, rf (en décades), ry, cls, label }],
           points: [{ f, y, label, cls, dx, dy, ancre }], reperes: [{ f } | { y }] (lignes de lecture),
           textes: [{ f, y, t, cls, ancre }], extra(g) (SVG ajouté), aria }
     ============================================================ */
  // traits verticaux : 1, 2, … 9 × 10ᵏ entre fmin et fmax
  function lignesF(fmin, fmax) {
    const l = [];
    for (let k = 0; k <= 5; k++) for (let m = 1; m <= 9; m++) { const f = m * Math.pow(10, k); if (f >= fmin * .999 && f <= fmax * 1.001) l.push(f); }
    return l;
  }
  function geomLog(o) {
    const x0 = o.ml || 50, x1 = o.W - 18, y0 = 30, y1 = o.H - 46;
    const a = Math.log10(o.fmin), b = Math.log10(o.fmax), kY = (y1 - y0) / (o.ymax - o.ymin);
    return {
      W: o.W, H: o.H, x0, x1, y0, y1,
      X: f => x0 + (Math.log10(f) - a) / (b - a) * (x1 - x0),
      Fx: x => Math.pow(10, a + (x - x0) / (x1 - x0) * (b - a)),
      Y: v => (o.inverse ? y0 + (v - o.ymin) * kY : y1 - (v - o.ymin) * kY),
      Vy: y => (o.inverse ? o.ymin + (y - y0) / kY : o.ymin + (y1 - y) / kY),
      decade: (x1 - x0) / (b - a),
    };
  }
  // interpolation linéaire en log f dans une table [[f, y]…]
  function interpLog(t, f) {
    if (f <= t[0][0]) return t[0][1];
    for (let i = 1; i < t.length; i++) {
      if (f <= t[i][0]) {
        const u = (Math.log10(f) - Math.log10(t[i - 1][0])) / (Math.log10(t[i][0]) - Math.log10(t[i - 1][0]));
        return t[i - 1][1] + u * (t[i][1] - t[i - 1][1]);
      }
    }
    return t[t.length - 1][1];
  }
  // courbe lisse (Catmull-Rom) passant par des points de l'écran
  function lisse(p) {
    const r = v => v.toFixed(1);
    let d = `M${r(p[0][0])},${r(p[0][1])}`;
    for (let i = 0; i < p.length - 1; i++) {
      const p0 = p[i - 1] || p[i], p1 = p[i], p2 = p[i + 1], p3 = p[i + 2] || p2;
      d += `C${r(p1[0] + (p2[0] - p0[0]) / 6)},${r(p1[1] + (p2[1] - p0[1]) / 6)} ${r(p2[0] - (p3[0] - p1[0]) / 6)},${r(p2[1] - (p3[1] - p1[1]) / 6)} ${r(p2[0])},${r(p2[1])}`;
    }
    return d;
  }
  let nClipLog = 0;
  function svgLog(o) {
    o = Object.assign({ H: 280, ml: 50 }, o);
    const g = geomLog(o), s = [], id = 'os-clip-' + (++nClipLog);
    const fmtF = f => fmt(f);
    // traits verticaux (décades en trait plein) et fréquences écrites
    const etiqF = o.etiqF || (g.decade >= 150 ? lignesF(o.fmin, o.fmax).filter(f => [1, 2, 5].indexOf(Math.round(f / Math.pow(10, Math.floor(Math.log10(f) + 1e-9)))) !== -1)
      : lignesF(o.fmin, o.fmax).filter(f => Math.round(f / Math.pow(10, Math.floor(Math.log10(f) + 1e-9))) === 1));
    lignesF(o.fmin, o.fmax).forEach(f => {
      const x = g.X(f), dec = Math.abs(Math.log10(f) - Math.round(Math.log10(f))) < 1e-9;
      if (x > g.x0 + .5) s.push(`<line class="${dec ? 'os-grille-dec' : 'fo-grille'}" x1="${x}" y1="${g.y0}" x2="${x}" y2="${g.y1}"/>`);
      s.push(`<line class="fo-axe" x1="${x}" y1="${g.y1}" x2="${x}" y2="${g.y1 + 4}"/>`);
    });
    // sur un écran étroit (décades seules), la première fréquence est écrite aussi
    if (!o.etiqF && g.decade < 150 && lignesF(o.fmin, o.fmin).length && !dans(etiqF, o.fmin)) etiqF.unshift(o.fmin);
    etiqF.forEach(f => s.push(`<text class="fo-txt" x="${g.X(f)}" y="${g.y1 + 17}" text-anchor="middle">${fmtF(f)}</text>`));
    // traits horizontaux
    for (let v = o.ymin; v <= o.ymax + 1e-9; v += o.pasY) {
      const y = g.Y(v);
      if (Math.abs(v - (o.inverse ? o.ymax : o.ymin)) > 1e-9) s.push(`<line class="fo-grille" x1="${g.x0}" y1="${y}" x2="${g.x1}" y2="${y}"/>`);
      if (!o.etiqY || dans(o.etiqY, v)) s.push(`<text class="fo-txt" x="${g.x0 - 6}" y="${y + 4}" text-anchor="end">${fmt(v)}</text>`);
    }
    // axes et titres
    s.push(`<line class="fo-axe" x1="${g.x0}" y1="${g.y1}" x2="${g.x1 + 4}" y2="${g.y1}"/><path class="fo-pointe" d="M${g.x1 + 12},${g.y1}L${g.x1 + 3},${g.y1 - 4.5}L${g.x1 + 3},${g.y1 + 4.5}Z"/>`);
    s.push(o.inverse
      ? `<line class="fo-axe" x1="${g.x0}" y1="${g.y0 - 10}" x2="${g.x0}" y2="${g.y1 + 6}"/><path class="fo-pointe" d="M${g.x0},${g.y1 + 14}L${g.x0 - 4.5},${g.y1 + 5}L${g.x0 + 4.5},${g.y1 + 5}Z"/>`
      : `<line class="fo-axe" x1="${g.x0}" y1="${g.y1}" x2="${g.x0}" y2="${g.y0 - 14}"/><path class="fo-pointe" d="M${g.x0},${g.y0 - 22}L${g.x0 - 4.5},${g.y0 - 13}L${g.x0 + 4.5},${g.y0 - 13}Z"/>`);
    s.push(`<text class="fo-titre" x="${g.x0 + 9}" y="${g.y0 - 12}">${o.titreY || ''}</text>`);
    s.push(`<text class="fo-titre" x="${g.x1 + 4}" y="${g.y1 + 36}" text-anchor="end">${o.titreF || 'f (en Hz) · échelle logarithmique'}</text>`);
    // contenu limité à la zone du graphique
    s.push(`<clipPath id="${id}"><rect x="${g.x0}" y="${g.y0 - 2}" width="${g.x1 - g.x0}" height="${g.y1 - g.y0 + 4}"/></clipPath><g clip-path="url(#${id})">`);
    (o.ellipses || []).forEach(e => {
      const p = [];
      for (let k = 0; k < 64; k++) { const t = k / 64 * 2 * Math.PI; p.push([g.X(Math.pow(10, e.lf + e.rf * Math.cos(t))), g.Y(e.y + e.ry * Math.sin(t))]); }
      s.push(`<path class="${e.cls || 'os-zone'}" d="M${p.map(q => q[0].toFixed(1) + ',' + q[1].toFixed(1)).join('L')}Z"/>`);
    });
    (o.reperes || []).forEach(r => {
      if (r.f != null) s.push(`<line class="os-repere" x1="${g.X(r.f)}" y1="${g.y0}" x2="${g.X(r.f)}" y2="${g.y1}"/>`);
      if (r.y != null) s.push(`<line class="os-repere" x1="${g.x0}" y1="${g.Y(r.y)}" x2="${g.x1}" y2="${g.Y(r.y)}"/>`);
    });
    // courbe lisse, ou ligne brisée (c.droit) comme sur un audiogramme médical
    (o.courbes || []).forEach(c => {
      const p = c.pts.map(([f, v]) => [g.X(f), g.Y(v)]);
      s.push(`<path class="${c.cls || 'os-courbe'}" d="${c.droit ? 'M' + p.map(q => q[0].toFixed(1) + ',' + q[1].toFixed(1)).join('L') : lisse(p)}"/>`);
    });
    s.push('</g>');
    // étiquettes des zones, des courbes, textes et points
    (o.ellipses || []).forEach(e => { if (e.label) s.push(`<text class="os-txt-zone" x="${g.X(Math.pow(10, e.lf + (e.dlf || 0)))}" y="${g.Y(e.y + (e.dy || 0)) + 4}" text-anchor="middle">${e.label}</text>`); });
    (o.courbes || []).forEach(c => {
      if (!c.label) return;
      const y = c.ly != null ? c.ly : interpLog(c.pts, c.lf);
      s.push(`<text class="os-txt-courbe${c.clsT ? ' ' + c.clsT : ''}" x="${g.X(c.lf)}" y="${g.Y(y) + (c.dy || -6)}" text-anchor="${c.ancre || 'middle'}">${c.label}</text>`);
    });
    (o.textes || []).forEach(t => s.push(`<text class="${t.cls || 'os-txt-zone'}" x="${g.X(t.f)}" y="${g.Y(t.y)}" text-anchor="${t.ancre || 'middle'}">${t.t}</text>`));
    (o.points || []).forEach(p => {
      const x = g.X(p.f), y = g.Y(p.y);
      s.push(`<circle class="${p.cls || 'os-pt'}" cx="${x}" cy="${y}" r="6"/>`);
      if (p.label) s.push(`<text class="os-txt-pt" x="${x + (p.dx != null ? p.dx : 10)}" y="${y + (p.dy != null ? p.dy : -8)}" text-anchor="${p.ancre || 'start'}">${p.label}</text>`);
    });
    if (o.extra) s.push(o.extra(g));
    return `<svg class="fo-svg os-log" viewBox="0 0 ${o.W} ${o.H}" width="${o.W}" height="${o.H}" role="img" aria-label="${o.aria || 'Graphique en fonction de la fréquence (échelle logarithmique)'}">${s.join('')}</svg>`;
  }

  /* ============================================================
     AUDIOGRAMME (courbe de sensibilité de l'oreille)
     Fréquences de 20 Hz à 20 kHz en échelle logarithmique, niveau
     sonore L de −10 à 140 dB. Valeurs usuelles des manuels : le seuil
     d'audibilité vaut 0 dB à 1 000 Hz, environ 27 dB à 100 Hz et
     −5 dB vers 3 000-4 000 Hz (100 Hz et 20 dB : inaudible ;
     4 000 Hz et 20 dB : audible).
     ============================================================ */
  const SEUIL = [[20, 74], [30, 59], [50, 43], [70, 34], [100, 27], [150, 20], [200, 15], [300, 10], [500, 5], [700, 2], [1000, 0], [1500, -1],
    [2000, -2], [3000, -5], [4000, -5], [5000, -3], [6000, 0], [8000, 9], [10000, 13], [12000, 17], [15000, 28], [18000, 52], [20000, 72]];
  // seuil de la douleur d'après la courbe du cours (≈ 128 dB vers 100 Hz, 122 dB à 1 000 Hz, ≈ 116 dB vers 3 000-4 000 Hz)
  const DOULEUR = [[20, 129], [100, 128], [300, 126], [1000, 122], [2000, 118], [3000, 116], [4000, 116], [5000, 118], [7000, 124], [10000, 128], [20000, 133]];
  const seuil = f => interpLog(SEUIL, f);
  const douleur = f => interpLog(DOULEUR, f);
  const estAudible = (f, L) => L > seuil(f);
  const OPTS_AUDIO = { fmin: 20, fmax: 20000, ymin: -10, ymax: 140, pasY: 10, etiqY: [0, 20, 40, 60, 80, 100, 120, 140], titreY: 'L (en dB)', titreF: 'f (en Hz) · échelle logarithmique' };
  // o : options de svgLog en plus (W, H, points, reperes…), zones (false : sans les zones), etiquettes (false : sans les noms)
  function svgAudiogramme(o) {
    o = o || {};
    const noms = o.etiquettes !== false;
    const ellipses = o.zones === false ? [] : [
      { lf: Math.log10(900), rf: 1.15, y: 60, ry: 38, cls: 'os-zone', label: noms ? 'musique' : '', dlf: .05, dy: 27 },
      { lf: 3, rf: .6, y: 50, ry: 16, cls: 'os-zone os-zone-forte', label: noms ? 'conversation' : '' },
    ];
    return svgLog(Object.assign({}, OPTS_AUDIO, {
      H: 300, ellipses,
      courbes: [
        { pts: SEUIL, cls: 'os-c-seuil', label: noms ? 'seuil d\'audibilité' : '', lf: 1000, ly: 7, dy: 0 },
        { pts: DOULEUR, cls: 'os-c-douleur', label: noms ? 'seuil de la douleur' : '', lf: 1000, dy: -8 },
      ],
      textes: noms && o.textes !== false ? [{ f: 32, y: 16, t: 'inaudible', cls: 'os-txt-zone os-txt-pale', ancre: 'middle' }, { f: 45, y: 95, t: 'audible', cls: 'os-txt-zone os-txt-pale' }] : [],
      aria: 'Audiogramme : seuil d\'audibilité et seuil de la douleur en fonction de la fréquence, zones de la conversation et de la musique',
    }, o));
  }
  // fréquences des traits verticaux de l'audiogramme (sur lesquels on place les points)
  const LIGNES = lignesF(20, 20000);
  // lecture « comme sur une échelle régulière » d'une fréquence placée sur l'échelle logarithmique
  function lectureLineaire(f) {
    const a = Math.pow(10, Math.floor(Math.log10(f) + 1e-9)), u = Math.log10(f / a);
    return a + u * 9 * a;
  }
  const fmtHz = f => `${fmt(f)} Hz`;

  /* ============================================================
     OUTIL « AUDIOGRAMME » (partie 'perso', cours et séries)
     mode 'placer' : l'élève fait glisser un point (ou utilise les flèches)
       jusqu'à (f, L), puis dit si le son est audible ou inaudible ;
     mode 'lire' : un point est placé, l'élève écrit sa fréquence et son niveau.
     o = { mode, f (sur un trait vertical), L (multiple de 5 dB), q, solution }
     ============================================================ */
  function partieAudiogramme(o) {
    const mode = o.mode || 'placer', f = o.f, L = o.L, aud = estAudible(f, L);
    const solution = o.solution || (mode === 'placer'
      ? `<p>Le point (${fmtHz(f)} ; ${fmt(L)} dB) est ${aud ? '<b>au-dessus</b>' : '<b>en dessous</b>'} du seuil d'audibilité : le son est <b>${aud ? 'audible' : 'inaudible'}</b>.</p>`
      : `<p>Le point est sur le trait de ${fmtHz(f)} et à L = ${fmt(L)} dB.</p>`);
    return {
      type: 'perso', solution,
      q: o.q || (mode === 'placer'
        ? `Place le son de fréquence <b>f = ${fmtHz(f)}</b> et de niveau <b>L = ${fmt(L)} dB</b> : fais glisser le point (ou utilise les flèches). Valide, puis dis s'il est audible.`
        : 'Lis la fréquence et le niveau sonore du point placé sur l\'audiogramme.'),
      monter(zone, api) {
        const d = el('div', 'os-ag');
        d.innerHTML = `<div class="os-ag-fig"></div><p class="os-ag-lect" aria-live="polite"></p>
          ${mode === 'placer' ? `<div class="os-ag-fleches" role="group" aria-label="Déplacer le point">
            <button type="button" class="os-fl" data-d="g" aria-label="Fréquence plus basse (trait précédent)">←</button>
            <button type="button" class="os-fl" data-d="d" aria-label="Fréquence plus haute (trait suivant)">→</button>
            <button type="button" class="os-fl" data-d="h" aria-label="Niveau plus élevé (+ 5 dB)">↑</button>
            <button type="button" class="os-fl" data-d="b" aria-label="Niveau plus faible (− 5 dB)">↓</button></div>` : ''}`;
        zone.appendChild(d);
        const zf = d.querySelector('.os-ag-fig'), lect = d.querySelector('.os-ag-lect');
        const pt = { i: LIGNES.indexOf(1000), L: 60 };
        let W = 0, g = null, phase = 1, glisse = null;
        const fp = () => LIGNES[pt.i];
        function dessiner() {
          W = Math.min(680, Math.round(zf.clientWidth || zone.clientWidth || 600));
          const H = W < 480 ? 290 : 320, base = { W, H };
          const svgO = Object.assign(base, mode === 'lire' || phase > 1
            ? { points: [{ f: mode === 'lire' ? f : fp(), y: mode === 'lire' ? L : pt.L, cls: 'os-pt' }], reperes: mode === 'lire' ? [] : [{ f: fp() }, { y: pt.L }] }
            : { reperes: [{ f: fp() }, { y: pt.L }] });
          g = geomLog(Object.assign({}, OPTS_AUDIO, base));
          let svg = svgAudiogramme(svgO);
          if (mode === 'placer' && phase === 1) {
            const x = g.X(fp()), y = g.Y(pt.L);
            svg = svg.replace('</svg>', `<g class="fo-tire os-ag-tire" data-pt="1"><circle cx="${x}" cy="${y}" r="24" fill="transparent"/><circle class="os-pt-mobile" cx="${x}" cy="${y}" r="9"/></g></svg>`);
          }
          zf.innerHTML = svg;
          if (mode === 'placer') lect.innerHTML = `Ton point : <b>f = ${fmtHz(fp())}</b> ; <b>L = ${fmt(pt.L)} dB</b>`;
        }
        const point = e => {
          const svg = zf.querySelector('svg'), r = svg.getBoundingClientRect(), k = (+svg.getAttribute('width')) / r.width;
          return { x: (e.clientX - r.left) * k, y: (e.clientY - r.top) * k };
        };
        function bouger(e) {
          const p = point(e), fv = g.Fx(p.x);
          // trait vertical le plus proche (en échelle logarithmique) et niveau arrondi à 5 dB
          let best = 0;
          LIGNES.forEach((x, k) => { if (Math.abs(Math.log10(x / fv)) < Math.abs(Math.log10(LIGNES[best] / fv))) best = k; });
          pt.i = best; pt.L = borne(Math.round(g.Vy(p.y) / 5) * 5, -10, 140);
          api.effacer(); dessiner();
        }
        if (mode === 'placer') {
          zf.addEventListener('pointerdown', e => {
            if (phase > 1 || api.fini() || !e.target.closest('[data-pt]')) return;
            e.preventDefault(); glisse = e.pointerId; zf.setPointerCapture(e.pointerId);
          });
          zf.addEventListener('pointermove', e => { if (glisse === e.pointerId) bouger(e); });
          const fin = e => { if (glisse === e.pointerId) glisse = null; };
          zf.addEventListener('pointerup', fin); zf.addEventListener('pointercancel', fin);
          d.querySelectorAll('.os-fl').forEach(b => {
            b.onclick = () => {
              if (phase > 1 || api.fini()) return;
              const k = b.dataset.d;
              if (k === 'g') pt.i = Math.max(0, pt.i - 1);
              if (k === 'd') pt.i = Math.min(LIGNES.length - 1, pt.i + 1);
              if (k === 'h') pt.L = Math.min(140, pt.L + 5);
              if (k === 'b') pt.L = Math.max(-10, pt.L - 5);
              api.effacer(); dessiner();
            };
          });
        }
        if (window.ResizeObserver) new ResizeObserver(() => { if (Math.round(zf.clientWidth) !== W) dessiner(); }).observe(zf);
        dessiner();

        // mode « lire » : fréquence et niveau du point
        if (mode === 'lire') {
          const v = el('div', 'ph-valeur');
          v.innerHTML = '<span class="ph-lab">f =</span>';
          const cf = champ({ signe: false, aria: 'Fréquence du point, en hertz' }), cl = champ({ aria: 'Niveau sonore du point, en décibels' });
          v.appendChild(cf.el); v.appendChild(el('span', 'ph-unite', 'Hz ;')); v.appendChild(el('span', 'ph-lab', 'L =')); v.appendChild(cl.el); v.appendChild(el('span', 'ph-unite', 'dB'));
          d.appendChild(v);
          const bVal = boutonValider(d);
          [cf, cl].forEach(c => { c.input.addEventListener('input', () => api.effacer()); c.input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); valider(); } }); });
          function valider() {
            if (api.fini()) return;
            const vf = lire(cf.input.value), vl = lire(cl.input.value);
            if (isNaN(vf) || isNaN(vl)) { secouer(v); api.message('Écris la fréquence et le niveau sonore (des nombres).'); return; }
            const okF = proche(vf, f, .03), okL = Math.abs(vl - L) <= 2;
            cf.el.classList.toggle('ko', !okF); cl.el.classList.toggle('ko', !okL);
            if (okF && okL) { cf.desactiver(true); cl.desactiver(true); bVal.fermer(); api.reussi(); return; }
            const m = [];
            if (!okF) {
              const a = Math.pow(10, Math.floor(Math.log10(f) + 1e-9));
              m.push(proche(vf, lectureLineaire(f), .12) && !proche(vf, f, .1)
                ? `Tu as lu la fréquence comme sur une échelle régulière. L'échelle est <b>logarithmique</b> : entre ${fmtHz(a)} et ${fmtHz(10 * a)}, les traits valent ${fmt(2 * a)}, ${fmt(3 * a)}, ${fmt(4 * a)}… et se resserrent vers la droite. Compte les traits depuis ${fmtHz(a)}.`
                : `Fréquence : descends du point jusqu'à l'axe et compte les traits depuis la graduation écrite la plus proche (entre ${fmtHz(a)} et ${fmtHz(10 * a)}, un trait tous les ${fmtHz(a)}).`);
            }
            if (!okL) m.push('Niveau : va du point jusqu\'à l\'axe vertical (un trait tous les 10 dB).');
            api.erreur(m.join('<br>'));
            secouer(v);
          }
          bVal.onclick = valider;
          return { montrer() { cf.input.value = fmt(f); cl.input.value = fmt(L); cf.desactiver(true); cl.desactiver(true); bVal.fermer(); } };
        }

        // mode « placer » : 1. placer le point ; 2. audible ou inaudible ?
        const bVal = boutonValider(d);
        let ch = null;
        function phase2() {
          phase = 2; dessiner();
          d.querySelector('.os-ag-fleches').hidden = true;
          ch = el('div', 'os-ag-ch');
          ch.innerHTML = `<p class="ph-partie-q" style="margin:10px 0 8px !important">Ce son est-il audible ?</p>
            <div class="ph-choix"><button type="button" class="btn-secondary" data-r="1">Audible</button><button type="button" class="btn-secondary" data-r="0">Inaudible</button></div>`;
          d.appendChild(ch);
          ch.querySelectorAll('button').forEach(b => {
            b.onclick = () => {
              if (api.fini() || b.disabled) return;
              if ((b.dataset.r === '1') === aud) { b.classList.add('juste'); ch.querySelectorAll('button').forEach(x => { x.disabled = true; }); phase = 3; api.reussi(); return; }
              b.classList.add('faux'); b.disabled = true;
              api.erreur(aud ? 'Ton point est <b>au-dessus</b> de la courbe du seuil d\'audibilité (et sous le seuil de la douleur) : l\'oreille entend ce son.'
                : 'Ton point est <b>en dessous</b> de la courbe du seuil d\'audibilité : le son est trop faible pour être entendu à cette fréquence.');
            };
          });
          setTimeout(() => ch.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 60);
        }
        bVal.onclick = () => {
          if (api.fini() || phase > 1) return;
          const okF = fp() === f, okL = pt.L === L;
          if (okF && okL) { bVal.fermer(); api.effacer(); phase2(); return; }
          const m = [];
          if (!okF) {
            const a = Math.pow(10, Math.floor(Math.log10(f) + 1e-9));
            m.push(`Fréquence : ton point est à ${fmtHz(fp())}. L'échelle est <b>logarithmique</b> : entre ${fmtHz(a)} et ${fmtHz(10 * a)}, les traits valent ${fmt(2 * a)}, ${fmt(3 * a)}, ${fmt(4 * a)}… et se resserrent vers la droite. Compte-les à partir de ${fmtHz(a)}.`);
          }
          if (!okL) m.push(`Niveau : ton point est à ${fmt(pt.L)} dB, il faut ${fmt(L)} dB (un trait tous les 10 dB ; les flèches ↑ ↓ font des pas de 5 dB).`);
          api.erreur(m.join('<br>'));
          secouer(zf);
        };
        return {
          montrer() {
            if (phase === 1) { pt.i = LIGNES.indexOf(f); pt.L = L; bVal.fermer(); phase2(); }
            if (ch) ch.querySelectorAll('button').forEach(b => { b.disabled = true; if ((b.dataset.r === '1') === aud) b.classList.add('juste'); });
            phase = 3;
          },
        };
      },
    };
  }

  /* ============================================================
     INTENSITÉ ET DISTANCE : la même puissance se répartit sur A, 4A, 9A
     à r, 2r, 3r de la source (SVG à la largeur de son conteneur)
     ============================================================ */
  function svgDistance() {
    const S = [40, 130], s = [];
    const cote = k => 40 * k, X = k => 40 + 140 * k;
    // rayons issus de la source vers les coins du plus grand carré
    [-1, 1].forEach(sg => s.push(`<line class="os-rayon" x1="${S[0]}" y1="${S[1]}" x2="${X(3) + 30}" y2="${S[1] + sg * (cote(3) / 2) * (X(3) + 30 - S[0]) / (X(3) - S[0])}"/>`));
    [1, 2, 3].forEach(k => {
      const x = X(k), c = cote(k), y = S[1] - c / 2;
      // carré vu de face, partagé en k × k cases d'aire A
      s.push(`<rect class="os-carre" x="${x - c / 2 * .35}" y="${y}" width="${c * .35}" height="${c}"/>`);
      for (let i = 1; i < k; i++) s.push(`<line class="os-case" x1="${x - c / 2 * .35}" y1="${y + 40 * i}" x2="${x + c / 2 * .35}" y2="${y + 40 * i}"/>`);
      for (let i = 1; i < k; i++) s.push(`<line class="os-case" x1="${x - c / 2 * .35 + c * .35 * i / k}" y1="${y}" x2="${x - c / 2 * .35 + c * .35 * i / k}" y2="${y + c}"/>`);
      s.push(`<text class="os-txt-fig" x="${x}" y="${y - 8}" text-anchor="middle">${k === 1 ? 'A' : k * k + 'A'}</text>`);
      s.push(`<line class="os-cote" x1="${S[0]}" y1="${252 - 22 * (3 - k) - 4}" x2="${x}" y2="${252 - 22 * (3 - k) - 4}"/><line class="os-cote" x1="${x}" y1="${252 - 22 * (3 - k) - 10}" x2="${x}" y2="${252 - 22 * (3 - k) + 2}"/>`);
      s.push(`<text class="os-txt-fig" x="${(S[0] + x) / 2 + 30}" y="${252 - 22 * (3 - k) - 8}" text-anchor="middle">${k === 1 ? 'r' : k + 'r'}</text>`);
    });
    s.push(`<circle class="os-source" cx="${S[0]}" cy="${S[1]}" r="9"/><text class="os-txt-fig" x="${S[0]}" y="${S[1] - 16}" text-anchor="middle">S</text>`);
    return `<svg class="os-svg" viewBox="0 0 560 262" role="img" aria-label="La puissance de la source S traverse une surface A à la distance r, 4A à 2r et 9A à 3r">${s.join('')}</svg>`;
  }

  /* ============================================================
     ONDE QUI FRAPPE UNE PAROI : incidente, réfléchie, transmise, absorbée
     o = { noms (true : mots écrits ; sinon numéros 1 à 4) }
     ============================================================ */
  // I avec le nom en indice (décalage dy, compris par tous les navigateurs), comme sur la figure du cours
  const indiceI = n => `I<tspan dy="5" font-size="78%">${n}</tspan>`;
  const NOMS_PAROI = { inc: indiceI('incidente'), ref: indiceI('réfléchie'), tra: indiceI('transmise'), abs: indiceI('absorbée') };
  function svgParoi(o) {
    o = o || {};
    const s = [], lab = (k, n, x, y, anc) => (o.noms
      ? `<text class="os-txt-fig" x="${x}" y="${y}" text-anchor="${anc || 'middle'}">${NOMS_PAROI[k]}</text>`
      : `<circle class="os-num-c" cx="${x}" cy="${y - 7}" r="17"/><text class="os-num-t" x="${x}" y="${y}" text-anchor="middle">${n}</text>`);
    // paroi hachurée
    const idc = 'os-paroi-' + (++nClipLog);
    s.push(`<rect class="os-paroi" x="262" y="18" width="76" height="214" rx="4"/><clipPath id="${idc}"><rect x="262" y="18" width="76" height="214" rx="4"/></clipPath><g clip-path="url(#${idc})">`);
    for (let k = -8; k < 12; k++) s.push(`<line class="os-hachure" x1="${262 + k * 18}" y1="232" x2="${262 + k * 18 + 76}" y2="18"/>`);
    s.push('</g>');
    s.push('<rect class="os-paroi-bord" x="262" y="18" width="76" height="214" rx="4"/>');
    // flèches : incidente (épaisse), réfléchie, transmise (fine), énergie absorbée dans la paroi
    const fl = (x1, y1, x2, y2, ep) => {
      const a = Math.atan2(y2 - y1, x2 - x1), L = 10 + ep * 1.6, l = 6 + ep;
      const bx = x2 - L * Math.cos(a), by = y2 - L * Math.sin(a);
      return `<line class="os-fleche" x1="${x1}" y1="${y1}" x2="${bx}" y2="${by}" stroke-width="${ep}"/><path class="os-fleche-p" d="M${x2},${y2}L${bx - l * Math.sin(a)},${by + l * Math.cos(a)}L${bx + l * Math.sin(a)},${by - l * Math.cos(a)}Z"/>`;
    };
    s.push(fl(30, 52, 258, 116, 7));
    s.push(fl(258, 140, 52, 206, 4));
    s.push(fl(342, 126, 566, 170, 2.2));
    s.push('<path class="os-ondule" d="M282,96 q6,-8 12,0 t12,0 t12,0 t12,0"/><path class="os-ondule" d="M282,160 q6,-8 12,0 t12,0 t12,0 t12,0"/>');
    s.push(lab('inc', 1, 116, 56, 'middle'));
    s.push(lab('ref', 2, 116, 222, 'middle'));
    s.push(lab('tra', 3, 470, 132, 'middle'));
    s.push(lab('abs', 4, 300, 206, 'middle'));
    s.push('<text class="os-txt-pale" x="300" y="13" text-anchor="middle" font-size="16">paroi</text>');
    return `<svg class="os-svg os-svg-paroi" viewBox="0 0 600 250" role="img" aria-label="Une onde sonore frappe une paroi : une partie est réfléchie, une partie absorbée par la paroi, une partie transmise de l'autre côté">${s.join('')}</svg>`;
  }
  const slot = id => `<span class="sc-slot" data-slot="${id}"><span class="sc-slot-ph">?</span></span>`;
  // schéma de la paroi à compléter : figure numérotée et une case par numéro
  const schemaParoi = () => `<div class="os-sch">${svgParoi()}<div class="os-paroi-cases">
      <span class="os-paroi-l"><span class="os-num">1</span>${slot('inc')}</span>
      <span class="os-paroi-l"><span class="os-num">2</span>${slot('ref')}</span>
      <span class="os-paroi-l"><span class="os-num">3</span>${slot('tra')}</span>
      <span class="os-paroi-l"><span class="os-num">4</span>${slot('abs')}</span></div></div>`;
  const ETIQ_PAROI = [
    { id: 'inc', label: 'incidente', cible: 'inc', indice: 'L\'onde <b>incidente</b> est celle qui arrive sur la paroi (la plus épaisse : toute l\'énergie).' },
    { id: 'ref', label: 'réfléchie', cible: 'ref', indice: 'L\'onde <b>réfléchie</b> repart du même côté que l\'onde incidente, comme un écho.' },
    { id: 'tra', label: 'transmise', cible: 'tra', indice: 'L\'onde <b>transmise</b> traverse la paroi : elle continue de l\'autre côté, plus faible.' },
    { id: 'abs', label: 'absorbée', cible: 'abs', indice: 'L\'énergie <b>absorbée</b> reste dans la paroi (elle la chauffe très légèrement).' },
  ];
  const partieParoi = (q, solution) => ({ type: 'schema', q: q || 'Fais glisser chaque mot dans la case du numéro qui convient (ou touche un mot, puis une case).',
    schema: schemaParoi(), etiquettes: ETIQ_PAROI, titrePalette: 'Mots à placer', solution });

  /* ============================================================
     ATTÉNUATION D'UNE PAROI EN FONCTION DE LA FRÉQUENCE (cours et séries)
     Courbes simplifiées de deux vitrages : le simple vitrage isole un peu
     mieux vers 150-250 Hz, les deux se valent vers 400 Hz, le double
     vitrage est bien meilleur au-dessus.
     ============================================================ */
  const VITRAGES = {
    simple: { nom: 'simple vitrage', pts: [[100, 20], [160, 22], [250, 25], [400, 27], [630, 29], [1000, 31], [1600, 33], [2500, 29], [4000, 33], [5000, 36]] },
    double: { nom: 'double vitrage', pts: [[100, 21], [160, 17], [250, 20], [400, 27], [630, 33], [1000, 38], [1600, 41], [2500, 43], [4000, 45], [5000, 46]] },
  };
  // o : options de svgLog en plus (W, H, reperes…)
  const svgVitrages = o => svgLog(Object.assign({ fmin: 100, fmax: 5000, ymin: 0, ymax: 50, pasY: 5, etiqY: [0, 10, 20, 30, 40, 50], H: 260,
    titreY: 'Atténuation A (en dB)', etiqF: [100, 200, 500, 1000, 2000, 5000],
    courbes: [{ pts: VITRAGES.simple.pts, cls: 'os-courbe-2', label: 'simple vitrage', lf: 2500, dy: 18, clsT: 'encre' },
      { pts: VITRAGES.double.pts, cls: 'os-courbe', label: 'double vitrage', lf: 1300, dy: -10 }],
    aria: 'Atténuation du simple et du double vitrage en fonction de la fréquence (échelle logarithmique)' }, o));

  /* ============================================================
     PERTE AUDITIVE (audiogramme médical) : perte en dB (vers le bas)
     aux fréquences d'octave 125 Hz à 8 000 Hz, échelle logarithmique
     o = options de svgLog (W, H, courbes, points…)
     ============================================================ */
  const OCTAVES = [125, 250, 500, 1000, 2000, 4000, 8000];
  const svgPerte = o => svgLog(Object.assign({ fmin: 100, fmax: 10000, ymin: 0, ymax: 80, pasY: 10, inverse: true, H: 270, etiqF: OCTAVES,
    titreY: 'Perte auditive (en dB)', aria: 'Perte auditive en fonction de la fréquence (échelle logarithmique) ; la perte augmente vers le bas' }, o));

  /* ============================================================
     SUJET DE BAC « ÉTUDE DU SON D'UN VIOLON » (Polynésie 2022)
     Documents redessinés d'après le sujet :
     doc. 1 : signal du violon (de −0,6 à 0,4 V sur 20 ms), série de
       Fourier ajustée sur le chronogramme du sujet (amplitudes et
       phases) : sommets à 1,17 ms et 19,42 ms, 7 motifs en 18,25 ms,
       T ≈ 2,6 ms, f ≈ 384 Hz ;
     doc. 2 : spectre du violon, pics A ≈ 390 Hz (0,098 V),
       B ≈ 770 Hz (0,139 V), C ≈ 1 160 Hz (0,012 V), puis deux petits
       pics vers 1 555 et 1 945 Hz (positions de la correction pour A, B, C) ;
     doc. 3 : spectre du son du microcontrôleur (en V, valeurs de l'ordre
       de 10⁻³ V) : grands pics à 390, 810 et 1 200 Hz, petits pics voisins.
     ============================================================ */
  const BAC = {
    signal: { f1: 7 / 18.25e-3, a0: 0, a: [.186, .282, .029, .029, .009, .023, .018, .01], phi: [-2.43, 2.38, 1.43, -1.77, -1.98, 1.87, .65, -.32] },
    // nom ' ' : pic sans lettre sur le document
    violon: [{ f: 390, a: .098, nom: 'A' }, { f: 770, a: .139, nom: 'B' }, { f: 1160, a: .0115, nom: 'C' }, { f: 1555, a: .0135, nom: ' ' }, { f: 1945, a: .004, nom: ' ' }],
    micro: [{ f: 360, a: .000225 }, { f: 390, a: .00112 }, { f: 420, a: .00072 }, { f: 810, a: .00109 }, { f: 1140, a: .00015 }, { f: 1168, a: .00034 },
      { f: 1200, a: .000615 }, { f: 1262, a: .000095 }, { f: 1950, a: .000215 }, { f: 1985, a: .000205 }],
    optsViolon: { unite: 'V', titreA: 'Amplitude de la tension (en V)', amax: .15, gradA: [0, .02, .04, .06, .08, .1, .12, .14], fmax: 2000, pasF: 50,
      etiqF: [0, 250, 500, 750, 1000, 1250, 1500, 1750, 2000], etiqFEtroit: [0, 500, 1000, 1500, 2000], Wmax: 560, H: 210, etiquettes: true,
      aria: 'Spectre d\'amplitude de l\'enregistrement du violon : pics A, B et C' },
    optsMicro: { unite: 'V', titreA: 'Amplitude de la tension (en V)', amax: .0012, gradA: [0, .0002, .0004, .0006, .0008, .001], fmax: 2000, pasF: 50,
      etiqF: [0, 250, 500, 750, 1000, 1250, 1500, 1750, 2000], etiqFEtroit: [0, 500, 1000, 1500, 2000], Wmax: 560, H: 210,
      aria: 'Spectre d\'amplitude du son produit par le microcontrôleur' },
  };

  /* ============================================================
     PLAN DE L'APPLICATION ET NAVIGATION (voir assets/sommaire.js)
     ============================================================ */
  const PLAN = [
    { n: 1, titre: 'L\'onde sonore', desc: 'Onde mécanique, compressions et dilatations de l\'air, vitesse du son', fiche: 'fiche_1',
      parties: [{ nom: 'L\'onde sonore', cours: 'module_1_cours', questions: 'module_1_questions' }] },
    { n: 2, titre: 'Son pur, son complexe', desc: 'Spectre d\'un son, hauteur (note) et timbre, mesure de la fréquence', fiche: 'fiche_2',
      parties: [{ nom: 'Son pur, son complexe', simulation: 'module_2_simulation', cours: 'module_2_cours', questions: 'module_2_questions', noms: { simulation: 'Simulateur : notes et instruments' } }] },
    { n: 3, titre: 'Intensité et niveau sonores', desc: 'Intensité I en W·m<sup>−2</sup>, niveau L = 10 log(I / I<sub>0</sub>) en dB, les intensités s\'additionnent', fiche: 'fiche_3',
      // deux sous-modules de cours, puis une seule série de questions et la fiche
      sousModules: true,
      parties: [
        { nom: 'Niveau sonore', slug: 'niveau', cours: 'module_3a_cours', noms: { cours: 'Cours : niveau sonore' } },
        { nom: 'Additionner des sons', slug: 'addition', cours: 'module_3b_cours', noms: { cours: 'Cours : additionner des sons' } },
        { nom: 'Intensité et niveau sonores', questions: 'module_3_questions' }] },
    { n: 4, titre: 'Audiogramme et atténuation', desc: 'Seuil d\'audibilité, seuil de la douleur, échelle logarithmique, perte d\'auditivité, atténuation par une paroi', fiche: 'fiche_4',
      sousModules: true,
      parties: [
        { nom: 'L\'audiogramme', slug: 'audiogramme', cours: 'module_4a_cours', noms: { cours: 'Cours : l\'audiogramme' } },
        { nom: 'Atténuation par une paroi', slug: 'attenuation', cours: 'module_4b_cours', noms: { cours: 'Cours : atténuation par une paroi' } },
        { nom: 'Audiogramme et atténuation', questions: 'module_4_questions' }] },
    { n: 5, titre: 'Exercices', desc: 'Exercices 6, 8, 10, 11, 17 et 16 du manuel, exercice A (audiogramme et bouchons), sujet de bac (violon)', exercices: 'module_5', exNom: 'Exercices 6 à 17, A et bac', nbEx: 8 },
  ];
  window.SOM.init({ nom: 'Chapitre 18 : Ondes sonores', id: 'ondes-sonores', cleEx: 'ondes-sonores-exercices', plan: PLAN });
  const menu = cle => window.SOM.menu(cle);
  const accueil = zone => window.SOM.accueil(zone);
  const marquer = info => window.SOM.marquer(info);

  window.OS = Object.assign(window.OS || {}, {
    MOINS, fmt, cs, sci, lire, proche, fr, rac, unite, o, fq, el, secouer, melanger, hasard, entre, champ, boutonValider, PARTIES, versCours,
    question, serie, confettis, fig, monter, outil, cap,
    figSignal, figSpectre, raiesSon, spectreAuHasard, premierSommet, partieMesure,
    I0, niveau, intensite, lignesF, geomLog, interpLog, svgLog, SEUIL, DOULEUR, seuil, douleur, estAudible, OPTS_AUDIO, svgAudiogramme, LIGNES, lectureLineaire, fmtHz, partieAudiogramme,
    svgDistance, NOMS_PAROI, svgParoi, slot, schemaParoi, ETIQ_PAROI, partieParoi, VITRAGES, svgVitrages, OCTAVES, svgPerte, BAC,
    PLAN, menu, accueil, marquer,
  });
})();
