/* ============================================================
   Moteur de l'application « Chapitre 8 : Mouvements de rotation »
   (Terminale STI2D ; même moteur de questions que « Cinématique » et
   « Chapitre 7 : Théorème de l'énergie cinétique » ; navigation
   commune assets/sommaire.js, cours avec assets/cours.js)

   ROT.fmt, ROT.cs, ROT.sci, ROT.lire   écriture et lecture des nombres (virgule)
   ROT.o, ROT.fq.choix, ROT.fq.nombre   fabriques d'options et de parties de question
   ROT.PARTIES                          parties de question : 'choix', 'nombre', 'gabarit', 'sci',
                                        'schema' (étiquettes à glisser), 'grille' (un choix par ligne),
                                        'perso' (p.monter(zone, api) → { montrer() })
   ROT.versCours(p)                     une de ces parties dans un cours (assets/cours.js)
   ROT.question(zone, q, cb, mode)      question en plusieurs parties (série, exercice)
   ROT.serie(opts)                      série de questions notée sur 20
   ROT.fig(dessin), ROT.outil(monter)   figure dessinée à la largeur disponible, outil placé dans du HTML
   ROT.V(n, s)                          nom de vecteur (flèche au-dessus)

   Figures (SVG) : ROT.figArc(), ROT.figManege(), ROT.figChrono(), ROT.figVolant(o),
                   ROT.figCouple(), ROT.figOblique(o), ROT.figBarre(o), ROT.figBarriere(o), ROT.figCle(o)
   Outils interactifs (parties 'perso', plusieurs exemplaires possibles dans une page) :
     ROT.disque(zone, o) / ROT.partieDisque(o)       disque qui tourne : ω, R, Δt réglés ; θ, T, f, v lus
     ROT.partieFraction(o)                           conversion tr/min ↔ rad/s écrite en fraction, étape par étape
     ROT.cle(zone, o) / ROT.partieCle(o)             clé tournant autour de O : point d'application et
                                                     orientation de F⃗ ; droite d'action, bras de levier d, M = F × d
   Caractéristiques T(n) :
     ROT.pchip(points)                               courbe lisse passant par des points (extremums aux points)
     ROT.intersection(f, g, a, b)                    abscisse où f et g se croisent (dichotomie)
     ROT.grapheFig(def)                              graphique (une ou deux courbes, repères, lectures)
     ROT.partiePoint(def, o)                         placer le point de fonctionnement (glisser, flèches)
     ROT.partieEtiquettes(def, o)                    nommer les grandeurs repérées sur une caractéristique
   ROT.menu(cle), ROT.accueil(zone)                  navigation commune (SOM) avec le plan de l'application

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
    const d = el('div', 'ph-valeur rot-gab');
    if (p.label) d.appendChild(el('span', 'ph-lab', p.label));
    // chaque case forme un groupe insécable avec le texte qui la suit (et le texte d'ouverture
    // avec la première case) : sur un petit écran, la ligne ne se coupe qu'entre deux groupes
    const champs = [];
    let grp = el('span', 'rot-gab-grp');
    d.appendChild(grp);
    p.morceaux.forEach(m => {
      if (typeof m === 'string') { grp.appendChild(el('span', 'rot-gab-txt', m)); return; }
      if (champs.length) { grp = el('span', 'rot-gab-grp'); d.appendChild(grp); }
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
     p.schema : HTML du schéma, avec des cases ROT.slot(id)
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
    const g = el('div', 'rot-grille');
    g.innerHTML = p.lignes.map(l => `<div class="rot-grille-l" data-l="${l.id}">
        <div class="rot-grille-nom">${l.label}</div>
        <div class="rot-grille-ch" role="group" aria-label="${String(l.label).replace(/<[^>]+>/g, '').replace(/"/g, '')}">
          ${p.options.map(o => `<button type="button" class="rot-grille-b" data-o="${o.id}" aria-pressed="false">${o.label}</button>`).join('')}</div>
        <div class="rot-grille-apres" hidden></div></div>`).join('');
    zone.appendChild(g);
    const lignes = Array.from(g.querySelectorAll('.rot-grille-l'));
    const choisi = {};
    lignes.forEach(L => {
      L.querySelectorAll('.rot-grille-b').forEach(b => {
        b.onclick = () => {
          if (api.fini() || b.disabled) return;
          choisi[L.dataset.l] = b.dataset.o;
          L.querySelectorAll('.rot-grille-b').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
          L.classList.remove('ok', 'ko');
          api.effacer();
        };
      });
    });
    const bVal = boutonValider(zone);
    function terminer() {
      lignes.forEach((L, k) => {
        L.classList.remove('ko'); L.classList.add('ok');
        L.querySelectorAll('.rot-grille-b').forEach(b => { b.disabled = true; });
        const a = L.querySelector('.rot-grille-apres');
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
        lignes.forEach((L, k) => L.querySelectorAll('.rot-grille-b').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.o === p.lignes[k].bonne))));
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
  const versCours = p => ({ type: 'perso', q: p.q, solution: p.solution || p.correction, aide: p.aide, orig: p, monter: (zone, api) => PARTIES[p.type](zone, p, api) });

  /* ============================================================
     « AFFICHER TOUT LE COURS »
     Les questions et les « À toi » en cours s'inscrivent ici. Quand
     l'élève demande tout le cours, chacun « se déplie » : toutes ses
     parties sont affichées d'un coup, avec le bouton « Afficher la
     réponse » disponible tout de suite. ROT.tout reste vrai ensuite :
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
      window.ROT.partieEnCours = p;          // partie en cours (utile pour vérifier l'application)
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
    if (mode === 'cours' && window.ROT.tout) inst.deplier();
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
      window.ROT.questionEnCours = q;          // question en cours (utile pour vérifier l'application)
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
     ROT.fig(dessin) renvoie un emplacement HTML ; dès qu'il est dans la
     page, dessin(W) y est appelé avec la largeur disponible W (et de
     nouveau quand la largeur change) : les textes gardent leur taille
     et restent lisibles sur un téléphone. Plusieurs figures par page.
     ============================================================ */
  const DESSINS = new Map();
  let nFig = 0, nMotif = 0;
  function fig(dessin, cls) {
    const k = String(++nFig);
    DESSINS.set(k, dessin);
    return `<div class="rot-fig${cls ? ' ' + cls : ''}" data-fig="${k}"></div>`;
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
    const l = racine.matches && racine.matches('.rot-fig[data-fig]') ? [racine] : [];
    racine.querySelectorAll('.rot-fig[data-fig]').forEach(x => l.push(x));
    l.forEach(x => { const f = DESSINS.get(x.dataset.fig); if (f) monter(x, f); });
  }
  new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(chercher))).observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener('DOMContentLoaded', () => chercher(document.body));

  /* ============================================================
     OUTILS INTERACTIFS PLACÉS DANS DU HTML
     ROT.outil(monter) renvoie un emplacement HTML ; dès qu'il est dans la
     page, monter(div) y construit l'outil, une seule fois.
     ============================================================ */
  const OUTILS = new Map();
  let nOutil = 0;
  function outil(f) {
    const k = String(++nOutil);
    OUTILS.set(k, f);
    return `<div class="rot-outil" data-outil="${k}"></div>`;
  }
  function chercherOutils(racine) {
    if (!racine || !racine.querySelectorAll) return;
    const l = racine.matches && racine.matches('.rot-outil[data-outil]') ? [racine] : [];
    racine.querySelectorAll('.rot-outil[data-outil]').forEach(x => l.push(x));
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
     PROPRE AU CHAPITRE 8 : écritures, petites flèches SVG
     (les couleurs des dessins viennent des classes rot-* de rot.css)
     ============================================================ */
  const DEUX_PI = 2 * Math.PI;
  const rad = d => d * Math.PI / 180;
  // nom de vecteur surmonté d'une flèche : V('F', '1') → F⃗₁
  const V = (n, s) => `<span class="vec-nom">${n}</span>${s ? `<sub>${s}</sub>` : ''}`;
  const reduit = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

  // flèche de (x1, y1) à (x2, y2) ; t : taille de la pointe ; cls : classe (couleur, épaisseur)
  function fl(x1, y1, x2, y2, cls, t) {
    t = t || 11;
    const a = Math.atan2(y2 - y1, x2 - x1), c = Math.cos(a), s = Math.sin(a), bx = x2 - t * c, by = y2 - t * s, l = t * .48;
    return `<g class="${cls || 'rot-f'}"><line x1="${f1(x1)}" y1="${f1(y1)}" x2="${f1(bx + c)}" y2="${f1(by + s)}"/>` +
      `<path d="M${f1(x2)},${f1(y2)} L${f1(bx - l * s)},${f1(by + l * c)} L${f1(bx + l * s)},${f1(by - l * c)} Z"/></g>`;
  }
  // double flèche de cote (distance) entre deux points
  function cote(x1, y1, x2, y2, cls) {
    return fl((x1 + x2) / 2, (y1 + y2) / 2, x1, y1, cls || 'rot-cote', 8) + fl((x1 + x2) / 2, (y1 + y2) / 2, x2, y2, cls || 'rot-cote', 8);
  }
  // nom de vecteur en SVG (lettre, indice, petite flèche au-dessus) ; x : centre, y : ligne de base
  function nomSVG(p, x, y, ind, cls) {
    const wp = p.replace(/<[^>]+>/g, '').length * 9.5, ws = ind ? String(ind).length * 6.6 : 0, x0 = x - (wp + ws) / 2;
    const ya = y - 15, x2 = x0 + Math.max(wp, 9) + 1;
    return `<g class="${cls || 'rot-nom'}"><text x="${f1(x0)}" y="${f1(y)}">${p}${ind ? `<tspan dy="4" font-size="10.5">${ind}</tspan>` : ''}</text>` +
      `<path d="M${f1(x0 + 1)},${f1(ya)} H${f1(x2)} M${f1(x2 - 3)},${f1(ya - 2.6)} L${f1(x2)},${f1(ya)} L${f1(x2 - 3)},${f1(ya + 2.6)}"/></g>`;
  }
  // arc de cercle de centre (cx, cy), de rayon r, de l'angle a1 à a2 (degrés, sens trigonométrique, y vers le haut)
  function arc(cx, cy, r, a1, a2) {
    const x1 = cx + r * Math.cos(rad(a1)), y1 = cy - r * Math.sin(rad(a1)), x2 = cx + r * Math.cos(rad(a2)), y2 = cy - r * Math.sin(rad(a2));
    const grand = Math.abs(a2 - a1) > 180 ? 1 : 0, sens = a2 > a1 ? 0 : 1;
    return `M${f1(x1)},${f1(y1)} A${r},${r} 0 ${grand} ${sens} ${f1(x2)},${f1(y2)}`;
  }
  // flèche courbe (sens de rotation) : arc de a1 à a2, pointe au bout (a2)
  function arcFleche(cx, cy, r, a1, a2, cls) {
    const x2 = cx + r * Math.cos(rad(a2)), y2 = cy - r * Math.sin(rad(a2));
    const dir = a2 > a1 ? 1 : -1, at = rad(a2), tx = -Math.sin(at) * dir, ty = -Math.cos(at) * dir;
    const t = 9, bx = x2 - t * tx, by = y2 - t * ty, l = t * .5;
    // l'arc s'arrête à la base de la pointe
    return `<g class="${cls || 'rot-sens'}"><path d="${arc(cx, cy, r, a1, a2 - dir * (t * .8 / r) * 180 / Math.PI)}" fill="none"/>` +
      `<path d="M${f1(x2)},${f1(y2)} L${f1(bx - l * ty)},${f1(by + l * tx)} L${f1(bx + l * ty)},${f1(by - l * tx)} Z" class="rot-sens-p"/></g>`;
  }
  const svg = (vb, aria, contenu, cls) => `<svg viewBox="${vb}" class="rot-doc${cls ? ' ' + cls : ''}" role="img" aria-label="${aria}">${contenu}</svg>`;

  /* ============================================================
     FIGURES DU COURS ET DES EXERCICES
     ============================================================ */
  // Un point M d'un solide en rotation autour de O : positions à t et à t + Δt, angle θ, vitesse v⃗ tangente
  function figArc() {
    const cx = 150, cy = 130, R = 92, a1 = 15, a2 = 80;
    const P = a => [cx + R * Math.cos(rad(a)), cy - R * Math.sin(rad(a))];
    const [x1, y1] = P(a1), [x2, y2] = P(a2);
    let g = `<circle cx="${cx}" cy="${cy}" r="${R}" class="rot-traj"/>`;
    g += `<path d="${arc(cx, cy, R, a1, a2)}" class="rot-arc-parcouru"/>`;
    g += `<line x1="${cx}" y1="${cy}" x2="${f1(x1)}" y2="${f1(y1)}" class="rot-rayon"/><line x1="${cx}" y1="${cy}" x2="${f1(x2)}" y2="${f1(y2)}" class="rot-rayon"/>`;
    g += `<path d="${arc(cx, cy, 30, a1, a2)}" class="rot-angle"/><text x="${f1(cx + 44 * Math.cos(rad(47)))}" y="${f1(cy - 44 * Math.sin(rad(47)) + 5)}" class="rot-t-grec" text-anchor="middle">θ</text>`;
    // rayon R écrit le long de OM (position à t)
    g += `<text x="${f1(cx + 52 * Math.cos(rad(a1)) + 4)}" y="${f1(cy - 52 * Math.sin(rad(a1)) + 18)}" class="rot-t-pt">R</text>`;
    // vitesse tangente en M (à t + Δt), dans le sens du mouvement
    const tx = -Math.sin(rad(a2)), ty = -Math.cos(rad(a2));
    g += fl(x2, y2, x2 + 62 * tx, y2 + 62 * ty, 'rot-f rot-f-v') + nomSVG('v', x2 + 62 * tx - 4, y2 + 62 * ty - 10, '', 'rot-nom rot-nom-v');
    g += `<circle cx="${f1(x1)}" cy="${f1(y1)}" r="5" class="rot-pt"/><circle cx="${f1(x2)}" cy="${f1(y2)}" r="5" class="rot-pt"/>`;
    g += `<text x="${f1(x1 + 10)}" y="${f1(y1 + 5)}" class="rot-t-pt">M</text><text x="${f1(x1 + 26)}" y="${f1(y1 + 5)}" class="rot-t">(date t)</text>`;
    g += `<text x="${f1(x2 + 8)}" y="${f1(y2 - 12)}" class="rot-t-pt">M</text><text x="${f1(x2 + 24)}" y="${f1(y2 - 12)}" class="rot-t">(date t + Δt)</text>`;
    g += `<circle cx="${cx}" cy="${cy}" r="4" class="rot-pt"/><text x="${cx - 14}" y="${cy + 18}" class="rot-t-pt">O</text>`;
    g += `<text x="${cx}" y="${cy + R + 22}" text-anchor="middle" class="rot-t">trajectoire : cercle de centre O, de rayon R</text>`;
    return svg('0 -6 340 256', 'Cercle de centre O et de rayon R ; le point M passe de sa position à la date t à sa position à la date t plus delta t ; le rayon a tourné de l\'angle thêta ; la vitesse v est tangente au cercle', g);
  }

  // Exercice 9 : manège de 10 m de diamètre (vu de dessus), enfant à 3 m de l'axe
  function figManege() {
    const cx = 130, cy = 116, R = 96, r3 = R * 3 / 5;
    let g = `<circle cx="${cx}" cy="${cy}" r="${R}" class="rot-disque"/>`;
    for (let k = 0; k < 8; k++) g += `<line x1="${cx}" y1="${cy}" x2="${f1(cx + R * Math.cos(rad(k * 45)))}" y2="${f1(cy - R * Math.sin(rad(k * 45)))}" class="rot-rayon-fin"/>`;
    g += cote(cx - R, cy + R + 16, cx + R, cy + R + 16) + `<text x="${cx}" y="${cy + R + 34}" text-anchor="middle" class="rot-t-pt">10 m</text>`;
    g += `<line x1="${cx}" y1="${cy}" x2="${f1(cx + r3 * Math.cos(rad(40)))}" y2="${f1(cy - r3 * Math.sin(rad(40)))}" class="rot-bras"/>`;
    g += `<circle cx="${f1(cx + r3 * Math.cos(rad(40)))}" cy="${f1(cy - r3 * Math.sin(rad(40)))}" r="8" class="rot-enfant"/>`;
    g += `<text x="${f1(cx + r3 * Math.cos(rad(40)) + 12)}" y="${f1(cy - r3 * Math.sin(rad(40)) - 6)}" class="rot-t-pt">enfant</text>`;
    g += `<text x="${f1(cx + 30 * Math.cos(rad(40)) + 6)}" y="${f1(cy - 30 * Math.sin(rad(40)) + 16)}" class="rot-t-pt">3 m</text>`;
    g += `<circle cx="${cx}" cy="${cy}" r="5" class="rot-pt"/>` + arcFleche(cx, cy, R + 10, 200, 250);
    g += `<text x="${cx - 12}" y="${cy + 20}" class="rot-t">axe</text>`;
    return svg('0 0 260 262', 'Manège vu de dessus, de diamètre 10 mètres ; un enfant est assis à 3 mètres de l\'axe', g, 'rot-doc-petit');
  }

  // Exercice 8 : positions successives A1 à A5 sur un demi-cercle de centre O (intervalles τ = 20 ms)
  function figChrono() {
    const cx = 170, cy = 150, R = 120;
    let g = `<path d="${arc(cx, cy, R, 180, 0)}" class="rot-traj-plein"/><line x1="${cx - R}" y1="${cy}" x2="${cx + R}" y2="${cy}" class="rot-rayon-fin"/>`;
    [180, 135, 90, 45, 0].forEach((a, i) => {
      const x = cx + R * Math.cos(rad(a)), y = cy - R * Math.sin(rad(a));
      const lx = x + 18 * Math.cos(rad(a)), ly = y - 18 * Math.sin(rad(a)) + 5;
      g += `<circle cx="${f1(x)}" cy="${f1(y)}" r="5" class="rot-pt"/><text x="${f1(lx + (a === 180 ? -4 : a === 0 ? 4 : 0))}" y="${f1(a === 180 || a === 0 ? y + 22 : ly)}" text-anchor="middle" class="rot-t-pt">A<tspan dy="4" font-size="10.5">${i + 1}</tspan></text>`;
    });
    g += `<circle cx="${cx}" cy="${cy}" r="4" class="rot-pt"/><text x="${cx}" y="${cy + 22}" text-anchor="middle" class="rot-t-pt">O</text>`;
    return svg('0 0 340 180', 'Demi-cercle de centre O : les positions A1, A2, A3, A4 et A5 sont régulièrement espacées, de A1 à gauche à A5 à droite', g, 'rot-doc-petit');
  }

  // Volant de diamètre 30 cm : une force tangente en haut (o.couple : et une force opposée en bas)
  function figVolant(o) {
    o = o || {};
    const cx = 150, cy = 120, R = 76;
    let g = `<circle cx="${cx}" cy="${cy}" r="${R}" class="rot-volant"/><circle cx="${cx}" cy="${cy}" r="${R - 9}" class="rot-volant-int"/>`;
    [90, 210, 330].forEach(a => { g += `<line x1="${cx}" y1="${cy}" x2="${f1(cx + (R - 9) * Math.cos(rad(a)))}" y2="${f1(cy - (R - 9) * Math.sin(rad(a)))}" class="rot-rayon-epais"/>`; });
    g += `<circle cx="${cx}" cy="${cy}" r="14" class="rot-moyeu"/><circle cx="${cx}" cy="${cy}" r="3.5" class="rot-pt"/>`;
    // force en haut, vers la gauche ; droite d'action horizontale
    g += `<line x1="10" y1="${cy - R}" x2="290" y2="${cy - R}" class="rot-action"/>`;
    g += fl(cx, cy - R, cx - 72, cy - R, 'rot-f') + nomSVG('F', cx - 54, cy - R - 10, o.couple ? '1' : '');
    if (o.couple) {
      g += `<line x1="10" y1="${cy + R}" x2="290" y2="${cy + R}" class="rot-action"/>`;
      g += fl(cx, cy + R, cx + 72, cy + R, 'rot-f') + nomSVG('F', cx + 56, cy + R + 26, '2');
      g += cote(262, cy - R, 262, cy + R) + `<text x="270" y="${cy + 5}" class="rot-t-pt">D = 30 cm</text>`;
    } else {
      g += `<line x1="${cx}" y1="${cy}" x2="${cx + R + 30}" y2="${cy}" class="rot-ref"/>`;
      g += cote(cx + R + 22, cy - R, cx + R + 22, cy) + `<text x="${cx + R + 30}" y="${cy - R / 2 + 5}" class="rot-t-pt">d = 15 cm</text>`;
      g += `<text x="${cx + R + 30}" y="${cy - R / 2 + 22}" class="rot-t">(rayon)</text>`;
    }
    g += `<text x="${cx}" y="${cy + 34}" text-anchor="middle" class="rot-t-pt">O</text>`;
    g += arcFleche(cx, cy, R + 16, 120, 170);
    const aria = o.couple ? 'Volant de diamètre 30 centimètres ; deux forces opposées, tangentes au volant, en haut et en bas ; leurs droites d\'action sont distantes de D égal 30 centimètres'
      : 'Volant de diamètre 30 centimètres ; une force tangente au volant en haut ; le bras de levier d est le rayon, 15 centimètres';
    return svg('0 0 340 250', aria, g, 'rot-doc-petit');
  }

  // Couple de forces : deux forces opposées, droites d'action parallèles distantes de D
  function figCouple() {
    const xa = 90, xb = 250, cy = 110;
    let g = `<line x1="${xa}" y1="34" x2="${xa}" y2="200" class="rot-action"/><line x1="${xb}" y1="34" x2="${xb}" y2="200" class="rot-action"/>`;
    g += `<line x1="${xa}" y1="${cy}" x2="${xb}" y2="${cy}" class="rot-barre-fine"/>`;
    g += fl(xa, cy, xa, cy + 74, 'rot-f') + nomSVG('F', xa - 18, cy + 64);
    g += fl(xb, cy, xb, cy - 74, 'rot-f') + `<text x="${xb + 12}" y="${cy - 52}" class="rot-t-moins">−</text>` + nomSVG('F', xb + 30, cy - 52);
    g += `<circle cx="${(xa + xb) / 2}" cy="${cy}" r="6" class="rot-axe"/><text x="${(xa + xb) / 2}" y="${cy + 26}" text-anchor="middle" class="rot-t">axe de rotation</text>`;
    g += cote(xa, 46, xb, 46) + `<text x="${(xa + xb) / 2}" y="40" text-anchor="middle" class="rot-t-pt">D</text>`;
    g += `<text x="${xa - 6}" y="24" text-anchor="middle" class="rot-t">droite d'action</text><text x="${xb + 6}" y="24" text-anchor="middle" class="rot-t">droite d'action</text>`;
    return svg('0 0 340 214', 'Couple de forces : deux forces de même intensité, de directions parallèles et de sens opposés ; leurs droites d\'action sont distantes de D ; l\'axe de rotation est entre les deux', g, 'rot-doc-petit');
  }

  // Clé inclinée de α au-dessus de l'horizontale, force verticale vers le bas en A :
  // bras de levier d = OH = OA × cos α. o = { alpha (degrés), OA ('35 cm'), F ('F'), d ('d'), valD }
  function figOblique(o) {
    o = o || {};
    const al = o.alpha == null ? 25 : o.alpha, ox = 300, oy = 168, L = 210;
    const ax = ox - L * Math.cos(rad(al)), ay = oy - L * Math.sin(rad(al));
    let g = `<line x1="${f1(ax)}" y1="${oy}" x2="${ox + 24}" y2="${oy}" class="rot-ref"/>`;
    // droite d'action verticale passant par A ; angle droit en H
    g += `<line x1="${f1(ax)}" y1="8" x2="${f1(ax)}" y2="${oy + 22}" class="rot-action"/>`;
    g += `<path d="M${f1(ax)},${oy - 10} h10 v10" class="rot-equerre"/>`;
    g += `<line x1="${f1(ax)}" y1="${f1(ay)}" x2="${ox}" y2="${oy}" class="rot-cle-trait"/>`;
    g += `<polygon points="${[0, 60, 120, 180, 240, 300].map(a => `${f1(ox + 13 * Math.cos(rad(a)))},${f1(oy - 13 * Math.sin(rad(a)))}`).join(' ')}" class="rot-ecrou"/><circle cx="${ox}" cy="${oy}" r="3.5" class="rot-pt"/>`;
    g += `<path d="${arc(ox, oy, 46, 180 - al, 180)}" class="rot-angle"/>`;
    g += `<text x="${f1(ox - 62)}" y="${f1(oy - 8)}" text-anchor="end" class="rot-t-grec">α = ${fmt(al)}°</text>`;
    g += fl(ax, ay, ax, ay + 62, 'rot-f') + nomSVG(o.F || 'F', ax - 18, ay + 52);
    g += `<circle cx="${f1(ax)}" cy="${f1(ay)}" r="4" class="rot-pt"/><text x="${f1(ax + 8)}" y="${f1(ay - 8)}" class="rot-t-pt">A</text>`;
    g += `<text x="${f1((ax + ox) / 2 + 12)}" y="${f1((ay + oy) / 2 - 12)}" text-anchor="middle" class="rot-t-pt">${o.OA || 'OA'}</text>`;
    g += `<text x="${f1(ax - 16)}" y="${oy + 5}" class="rot-t-pt">H</text><text x="${ox + 6}" y="${oy + 26}" class="rot-t-pt">O</text>`;
    g += cote(ax, oy + 16, ox, oy + 16, 'rot-cote rot-cote-d') + `<text x="${f1((ax + ox) / 2)}" y="${oy + 34}" text-anchor="middle" class="rot-t-d">${o.d || 'd'}</text>`;
    return svg('0 0 340 214', `Clé de longueur OA inclinée de ${fmt(al)} degrés au-dessus de l'horizontale ; force verticale vers le bas en A ; H est sur l'horizontale passant par O, à la verticale de A ; le bras de levier est d égal OH`, g, 'rot-doc-petit');
  }

  // Barre (clé en croix, tire-bouchon, clé à bougie) d'axe O au milieu ; force vers le bas à gauche,
  // force vers le haut à droite. o = { gauche: ['F', '1'], droite: ['F', '2'], moinsD (« − » devant le nom de droite), ptG: 'A', ptD: 'B', long: '40 cm', titre, aria }
  function figBarre(o) {
    o = o || {};
    const xa = 60, xb = 280, cy = 98, cx = (xa + xb) / 2;
    let g = `<rect x="${xa - 6}" y="${cy - 7}" width="${xb - xa + 12}" height="14" rx="7" class="rot-barre"/>`;
    g += `<circle cx="${cx}" cy="${cy}" r="12" class="rot-moyeu"/><circle cx="${cx}" cy="${cy}" r="3.5" class="rot-pt"/><text x="${cx}" y="${cy - 18}" text-anchor="middle" class="rot-t-pt">O</text>`;
    const [pg, ig] = o.gauche || ['F', '1'], [pd, id] = o.droite || ['F', '2'];
    g += fl(xa, cy, xa, cy + 72, 'rot-f') + nomSVG(pg, xa - 22, cy + 62, ig);
    g += fl(xb, cy, xb, cy - 72, 'rot-f') + nomSVG(pd, xb + 26, cy - 50, id) + (o.moinsD ? `<text x="${xb + 9}" y="${cy - 50}" class="rot-t-moins">−</text>` : '');
    if (o.ptG) g += `<text x="${xa - 2}" y="${cy - 14}" text-anchor="end" class="rot-t-pt">${o.ptG}</text>`;
    if (o.ptD) g += `<text x="${xb + 4}" y="${cy + 26}" class="rot-t-pt">${o.ptD}</text>`;
    g += cote(xa, cy + 92, xb, cy + 92) + `<text x="${cx}" y="${cy + 86}" text-anchor="middle" class="rot-t-pt">${o.long || ''}</text>`;
    if (o.titre) g += `<text x="${cx}" y="18" text-anchor="middle" class="rot-t">${o.titre}</text>`;
    return svg('0 0 340 206', o.aria || 'Barre tournant autour de son milieu O ; une force vers le bas à une extrémité et une force vers le haut à l\'autre', g, 'rot-doc-petit');
  }

  // Exercice 15 : barrière de parking mobile autour de O, centre de gravité G à 1,2 m ; o.poids : P⃗ dessiné
  function figBarriere(o) {
    o = o || {};
    const ox = 62, oy = 96, k = 70, xg = ox + 1.2 * k, xf = ox + 3.4 * k, R = xf - ox + 8;
    let g = `<rect x="${ox - 26}" y="${oy - 22}" width="44" height="44" rx="6" class="rot-socle"/><rect x="${ox - 8}" y="${oy + 22}" width="16" height="70" class="rot-socle"/>`;
    g += `<line x1="10" y1="${oy + 92}" x2="350" y2="${oy + 92}" class="rot-sol"/>`;
    // barrière rayée
    for (let x = ox, i = 0; x < xf; x += 22, i++) g += `<rect x="${x}" y="${oy - 6}" width="${Math.min(22, xf - x)}" height="12" class="${i % 2 ? 'rot-raye-b' : 'rot-raye-a'}"/>`;
    g += `<rect x="${ox}" y="${oy - 6}" width="${xf - ox}" height="12" class="rot-barriere"/>`;
    g += `<text x="${ox - 4}" y="${oy + 5}" text-anchor="middle" class="rot-t-pt">×</text><text x="${ox - 14}" y="${oy - 28}" class="rot-t-pt">O</text>`;
    g += `<text x="${xg}" y="${oy + 5}" text-anchor="middle" class="rot-t-pt">×</text><text x="${xg}" y="${oy - 12}" text-anchor="middle" class="rot-t-pt">G</text>`;
    g += `<text x="${ox + 26}" y="${oy - 30}" class="rot-t">moteur</text>`;
    g += cote(ox, oy + 18, xg, oy + 18) + `<text x="${(ox + xg) / 2}" y="${oy + 34}" text-anchor="middle" class="rot-t-pt">1,2 m</text>`;
    // sens 1 : l'extrémité descend (sens des aiguilles d'une montre) ; sens 2 : elle monte
    const bout = a => [ox + R * Math.cos(rad(a)), oy - R * Math.sin(rad(a))];
    g += arcFleche(ox, oy, R, 4, 18, 'rot-sens rot-sens-fort') + `<text x="${f1(bout(18)[0] - 12)}" y="${f1(bout(18)[1] + 4)}" text-anchor="end" class="rot-t-pt">sens 2</text>`;
    g += arcFleche(ox, oy, R, -4, -18, 'rot-sens rot-sens-fort') + `<text x="${f1(bout(-18)[0] - 12)}" y="${f1(bout(-18)[1] + 6)}" text-anchor="end" class="rot-t-pt">sens 1</text>`;
    if (o.poids) g += fl(xg, oy, xg, oy + 64, 'rot-f') + nomSVG('P', xg + 18, oy + 64);
    return svg('0 0 360 200', 'Barrière de parking horizontale, mobile autour de l\'axe O ; son centre de gravité G est à 1,2 mètre de O ; sens 1 : l\'extrémité descend ; sens 2 : l\'extrémité monte' + (o.poids ? ' ; le poids P est vertical vers le bas, appliqué en G' : ''), g, 'rot-doc-petit');
  }

  /* ============================================================
     DISQUE QUI TOURNE (module 1)
     ROT.disque(zone, o) : outil libre ; ROT.partieDisque(o) : partie « perso »
     o = { omega (rad/s), R (m), dt (s), fixe: { omega, R, dt } (réglages masqués),
           cible: { verif(st) → diagnostic HTML ou null, montrer: { omega, R, dt } } }
     Le disque a tourné de θ = ω × Δt depuis le départ ; le point P est à la distance R de l'axe.
     ▶ fait avancer Δt en temps réel (pas d'animation si prefers-reduced-motion).
     ============================================================ */
  function reglageHTML(cle, nom, min, max, pas, val) {
    return `<label class="rot-reglage" data-r="${cle}"><span class="rot-reglage-nom">${nom} = <b data-v="${cle}"></b></span>
      <input type="range" min="${min}" max="${max}" step="${pas}" value="${val}" aria-label="${nom.replace(/<[^>]+>/g, '')}"></label>`;
  }
  function disque(zone, o, api) {
    o = o || {};
    const st = { omega: o.omega == null ? 1.6 : o.omega, R: o.R == null ? .3 : o.R, dt: o.dt == null ? 2 : o.dt };
    const fixe = o.fixe || {};
    let fini = false, joue = false, t0 = 0, raf = null;
    const d = el('div', 'rot-disque-outil');
    d.innerHTML = `<div class="rot-disque-scene"><svg viewBox="0 0 280 280" class="rot-disque-svg" role="img" aria-label="Disque en rotation autour de son axe O ; le point P est à la distance R de l'axe"><g data-a="scene"></g></svg>
        <div class="rot-disque-lect" aria-live="polite"></div></div>
      <div class="rot-reglages">
        ${fixe.omega ? '' : reglageHTML('omega', 'ω (rad/s)', .1, 10, .05, st.omega)}
        ${fixe.R ? '' : reglageHTML('R', 'R (m)', .05, .5, .05, st.R)}
        ${fixe.dt ? '' : reglageHTML('dt', 'Δt (s)', 0, 10, .1, st.dt)}
      </div>
      <div class="rot-boutons">${reduit() ? '' : '<button type="button" class="btn-small" data-a="jouer">▶ Faire tourner</button>'}
        <button type="button" class="btn-small" data-a="zero">↺ Δt = 0</button></div>`;
    zone.appendChild(d);
    const scene = d.querySelector('[data-a="scene"]'), lect = d.querySelector('.rot-disque-lect');
    const bJouer = d.querySelector('[data-a="jouer"]'), bZero = d.querySelector('[data-a="zero"]');
    const entrees = {};
    d.querySelectorAll('.rot-reglage').forEach(r => {
      const k = r.dataset.r, inp = r.querySelector('input');
      entrees[k] = inp;
      inp.addEventListener('input', () => { st[k] = +inp.value; if (k === 'dt') arreter(); dessiner(); if (api) api.effacer(); });
    });
    function dessiner() {
      const cx = 140, cy = 140, Rd = 118, k = Rd / .5;
      const th = st.omega * st.dt, reste = th % DEUX_PI, tours = th / DEUX_PI;
      let g = `<circle cx="${cx}" cy="${cy}" r="${Rd}" class="rot-disque"/>`;
      // angle balayé depuis le départ (secteur) ; tours complets : disque entier teinté
      if (tours >= 1) g += `<circle cx="${cx}" cy="${cy}" r="${Rd}" class="rot-secteur"/>`;
      if (reste > 1e-3) {
        const x = cx + Rd * Math.cos(reste), y = cy - Rd * Math.sin(reste);
        g += `<path d="M${cx},${cy} L${cx + Rd},${cy} A${Rd},${Rd} 0 ${reste > Math.PI ? 1 : 0} 0 ${f1(x)},${f1(y)} Z" class="rot-secteur"/>`;
      }
      // rayons du disque, qui tournent avec lui
      for (let i = 0; i < 6; i++) {
        const a = th + i * Math.PI / 3;
        g += `<line x1="${cx}" y1="${cy}" x2="${f1(cx + Rd * Math.cos(a))}" y2="${f1(cy - Rd * Math.sin(a))}" class="rot-rayon-fin"/>`;
      }
      // repère de départ
      g += `<line x1="${cx}" y1="${cy}" x2="${cx + Rd + 10}" y2="${cy}" class="rot-depart"/><text x="${cx + Rd - 2}" y="${cy + 16}" text-anchor="end" class="rot-t">départ</text>`;
      // le point P, à la distance R, et sa vitesse (tangente, dans le sens de rotation)
      const r = st.R * k, px = cx + r * Math.cos(th), py = cy - r * Math.sin(th);
      g += `<line x1="${cx}" y1="${cy}" x2="${f1(px)}" y2="${f1(py)}" class="rot-bras"/>`;
      const v = st.R * st.omega, Lv = Math.min(110, 14 * v + 10);
      g += fl(px, py, px - Lv * Math.sin(th), py - Lv * Math.cos(th), 'rot-f rot-f-v', 9);
      g += `<circle cx="${f1(px)}" cy="${f1(py)}" r="6" class="rot-pt-p"/>`;
      g += `<text x="${f1(px + 10 * Math.cos(th) + 4)}" y="${f1(py - 10 * Math.sin(th) + 14)}" class="rot-t-pt">P</text>`;
      if (th > .05) g += `<path d="${arc(cx, cy, 26, 0, Math.min(reste || DEUX_PI, DEUX_PI - .01) * 180 / Math.PI)}" class="rot-angle"/>`;
      g += `<circle cx="${cx}" cy="${cy}" r="5" class="rot-pt"/><text x="${cx - 16}" y="${cy - 8}" class="rot-t-pt">O</text>`;
      scene.innerHTML = g;
      // lectures
      const T = DEUX_PI / st.omega;
      Object.keys(entrees).forEach(k2 => { d.querySelector(`[data-v="${k2}"]`).textContent = k2 === 'dt' ? fmt(st.dt, 1) : fmt(st[k2], 2); });
      lect.innerHTML = `<p>θ = ω × Δt = ${fmt(st.omega, 2)} × ${fmt(st.dt, 1)} = <b>${fmt(th, 2)} rad</b> <span class="rot-gris">(${fmt(tours, 2)} tour${tours >= 2 ? 's' : ''})</span></p>
        <p>T = 2π / ω = <b>${fmt(T, 2)} s</b> · f = 1 / T = <b>${fmt(1 / T, 3)} Hz</b></p>
        <p>v = R × ω = ${fmt(st.R, 2)} × ${fmt(st.omega, 2)} = <b>${fmt(v, 3)} m/s</b></p>`;
    }
    // ▶ : Δt avance en temps réel (jusqu'à 10 s)
    function boucle(t) {
      if (!joue) return;
      if (!document.contains(d)) { arreter(); return; }
      st.dt = Math.min(10, st.dt + (t - t0) / 1000);
      t0 = t;
      if (entrees.dt) entrees.dt.value = st.dt;
      dessiner();
      if (st.dt >= 10) { arreter(); return; }
      raf = requestAnimationFrame(boucle);
    }
    function arreter() {
      joue = false;
      if (raf) cancelAnimationFrame(raf);
      raf = null;
      if (bJouer) bJouer.textContent = '▶ Faire tourner';
    }
    if (bJouer) bJouer.onclick = () => {
      if (fini) return;
      if (joue) { arreter(); return; }
      if (st.dt >= 10) st.dt = 0;
      joue = true; bJouer.textContent = '⏸ Pause';
      t0 = performance.now();
      raf = requestAnimationFrame(boucle);
    };
    bZero.onclick = () => { if (fini) return; arreter(); st.dt = 0; if (entrees.dt) entrees.dt.value = 0; dessiner(); };
    dessiner();
    // partie « perso » : bouton Valider, diagnostic de o.cible.verif
    if (!api || !o.cible) return { st };
    const bVal = boutonValider(zone);
    function verrouiller() {
      fini = true; arreter();
      Object.values(entrees).forEach(i => { i.disabled = true; });
      if (bJouer) bJouer.disabled = true;
      bZero.disabled = true;
      bVal.fermer();
    }
    bVal.onclick = () => {
      if (fini || api.fini()) return;
      const diag = o.cible.verif(st);
      if (!diag) { verrouiller(); api.reussi(); return; }
      api.erreur(diag); secouer(d.querySelector('.rot-reglages'));
    };
    return {
      montrer() {
        Object.assign(st, o.cible.montrer);
        Object.keys(entrees).forEach(k => { entrees[k].value = st[k]; });
        dessiner(); verrouiller();
      },
    };
  }
  // (outil et o : utiles pour vérifier l'application)
  const partieDisque = o => ({ type: 'perso', q: o.q, solution: o.solution, outil: 'disque', o, monter: (zone, api) => disque(zone, o, api) });

  /* ============================================================
     CONVERSION tr/min ↔ rad/s ÉCRITE EN FRACTION (module 2)
     ROT.partieFraction({ sens: 'trmin' (tr/min → rad/s) | 'rads' (rad/s → tr/min), valeur, q, solution })
     Trois lignes à compléter l'une après l'autre, unités écrites à chaque étape :
       1500 tr/min = 1500 tours / 1 min = 1500 × 2π rad / 60 s ≈ 157 rad/s
       25 rad/s = 25 rad / 1 s = (25 / 2π tours) / (1 / 60 min) = 25 × 60 / (2π) tr/min ≈ 239 tr/min
     Jetons d'une ligne : texte HTML | { n: id } (case) | { c: id } (bouton 2π / π / 360) | { fr: [haut, bas] }
     ============================================================ */
  const FACTEURS = ['2π', 'π', '360'];
  function lignesFraction(o) {
    const N = o.valeur, S = fmt(N), pr = (x, y) => proche(x, y, .015);
    const facteur = (k, verbe) => (k === 'π' ? `1 tour = <b>2π</b> rad (π rad, c'est un demi-tour) : on ${verbe} par 2π.`
      : k === '360' ? `360 est le nombre de <b>degrés</b> dans un tour ; en radians, 1 tour = 2π rad : on ${verbe} par 2π.` : '');
    if (o.sens === 'trmin') {
      const w = N * DEUX_PI / 60;
      return [
        { debut: `${S} tr/min =`, jetons: [{ fr: [[{ n: 'a' }, ' tours'], [{ n: 'b' }, ' min']] }], v: { a: N, b: 1 },
          diag: x => (x.a === 1 && x.b === N ? 'Le nombre de tours va en haut (numérateur), la durée de 1 min en bas (dénominateur).'
            : x.a !== N ? `En haut : le nombre de tours, ${S}.` : 'En bas : la durée, 1 min.') },
        { debut: '=', jetons: [{ fr: [[{ n: 'c' }, ' × ', { c: 'k' }, ' rad'], [{ n: 'd' }, ' s']] }], v: { c: N, k: '2π', d: 60 },
          diag: x => facteur(x.k, 'multiplie') || (pr(x.d, 1 / 60) ? '1 min = 60 s (et non 1/60 s) : en bas, on écrit 60 s.'
            : x.d !== 60 ? '1 min = <b>60 s</b> : en bas, on écrit 60 s.' : `En haut : ${S} tours = ${S} × 2π rad.`) },
        { debut: '≈', jetons: [{ n: 'e', rel: .01, aff: cs(w, 3) }, ' rad/s'], v: { e: w },
          diag: x => (pr(x.e, N * DEUX_PI * 60) ? 'Les 60 s sont en bas : on <b>divise</b> par 60.'
            : pr(x.e, N * Math.PI / 60) ? 'Un tour vaut 2π rad, pas π.'
            : pr(x.e, N / 60) ? 'N\'oublie pas de multiplier par 2π.'
            : pr(x.e, N * 60 / DEUX_PI) ? `C'est l'inverse : calcule ${S} × 2π ÷ 60.`
            : pr(x.e, N * 6) ? '360 donne des degrés : on veut des radians (2π).'
            : pr(x.e, N * 60) ? 'Les 60 s sont en bas : on <b>divise</b> par 60 (et on multiplie par 2π).'
            : `Calcule ${S} × 2π ÷ 60 à la calculatrice (touche π).`) },
      ];
    }
    const n = N * 60 / DEUX_PI;
    return [
      { debut: `${S} rad/s =`, jetons: [{ fr: [[{ n: 'a' }, ' rad'], [{ n: 'b' }, ' s']] }], v: { a: N, b: 1 },
        diag: x => (x.a === 1 && x.b === N ? 'Les radians vont en haut (numérateur), la durée de 1 s en bas (dénominateur).'
          : x.a !== N ? `En haut : ${S} rad.` : 'En bas : la durée, 1 s.') },
      { debut: '=', jetons: [{ fr: [[{ n: 'c' }, ' / ', { c: 'k' }, ' tours'], ['1 / ', { n: 'd' }, ' min']] }], v: { c: N, k: '2π', d: 60 },
        diag: x => facteur(x.k, 'divise') || (x.d === 1 ? '1 s = 1 / 60 min : en bas, on écrit 1 / 60 min.'
          : x.d !== 60 ? '1 min = 60 s, donc 1 s = 1 / <b>60</b> min.' : `En haut : ${S} rad = ${S} / 2π tours.`) },
      { debut: `= ${S} × 60 / (2π) tr/min ≈`, jetons: [{ n: 'e', rel: .01, aff: fmt(Math.round(n)) }, ' tr/min'], v: { e: n },
        diag: x => (pr(x.e, N / DEUX_PI / 60) ? 'Diviser par 1/60, c\'est <b>multiplier</b> par 60.'
          : pr(x.e, N * DEUX_PI * 60) || pr(x.e, N * DEUX_PI / 60) ? 'Un tour = 2π rad : on <b>divise</b> par 2π.'
          : pr(x.e, N * 60 / Math.PI) ? 'Un tour vaut 2π rad, pas π.'
          : pr(x.e, N * 60) ? 'N\'oublie pas de diviser par 2π.'
          : `Calcule ${S} × 60 ÷ (2π) à la calculatrice.`) },
    ];
  }
  function monterFraction(zone, o, api) {
    const lignes = lignesFraction(o);
    const box = el('div', 'rot-frac');
    zone.appendChild(box);
    let i = 0, fini = false, bVal = null, courante = null;
    // HTML des jetons ; les cases et boutons sont créés ensuite
    const html = t => t.map(j => (typeof j === 'string' ? `<span class="rot-frac-txt">${j}</span>`
      : j.n ? `<span data-case="${j.n}"></span>`
      : j.c ? `<button type="button" class="rot-cycle" data-cycle="${j.c}" aria-label="Facteur : touche pour changer (2π, π ou 360)">?</button>`
      : `<span class="fr"><span>${html(j.fr[0])}</span><span>${html(j.fr[1])}</span></span>`)).join('');
    const cases = t => t.reduce((l, j) => l.concat(j.n ? [j] : j.fr ? cases(j.fr[0]).concat(cases(j.fr[1])) : []), []);
    function rendre(k) {
      const L = lignes[k], d = el('div', 'rot-frac-ligne');
      d.innerHTML = `<span class="rot-frac-debut">${L.debut}</span>${html(L.jetons)}`;
      box.appendChild(d);
      L.champs = {};
      cases(L.jetons).forEach(j => {
        const c = champ({ petit: true, signe: false, aria: 'Nombre à compléter' });
        c.j = j; L.champs[j.n] = c;
        d.querySelector(`[data-case="${j.n}"]`).replaceWith(c.el);
        c.input.addEventListener('input', () => { api.effacer(); c.el.classList.remove('ko'); });
        c.input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); valider(); } });
      });
      L.cycles = {};
      d.querySelectorAll('.rot-cycle').forEach(b => {
        L.cycles[b.dataset.cycle] = b;
        b.onclick = () => {
          if (fini || b.disabled) return;
          const k2 = FACTEURS.indexOf(b.textContent);
          b.textContent = FACTEURS[(k2 + 1) % FACTEURS.length];
          b.classList.remove('ko'); api.effacer();
        };
      });
      L.el = d;
      courante = L;
      return d;
    }
    function verrouiller(L) {
      Object.values(L.champs).forEach(c => c.desactiver(true));
      Object.values(L.cycles).forEach(b => { b.disabled = true; });
      L.el.classList.add('ok');
    }
    function valider() {
      if (fini || api.fini()) return;
      const L = courante, x = {}, oks = {};
      for (const k of Object.keys(L.champs)) {
        x[k] = lire(L.champs[k].input.value);
        if (isNaN(x[k])) { secouer(L.el); api.message('Complète toutes les cases (avec un nombre).'); return; }
      }
      for (const k of Object.keys(L.cycles)) {
        x[k] = L.cycles[k].textContent;
        if (x[k] === '?') { secouer(L.el); api.message('Touche le bouton « ? » pour choisir le facteur (2π, π ou 360).'); return; }
      }
      Object.keys(L.champs).forEach(k => { const j = L.champs[k].j; oks[k] = j.rel ? proche(x[k], L.v[k], j.rel) : Math.abs(x[k] - L.v[k]) < 1e-9; });
      Object.keys(L.cycles).forEach(k => { oks[k] = x[k] === L.v[k]; });
      if (Object.values(oks).every(Boolean)) {
        verrouiller(L);
        if (++i < lignes.length) {
          const d = rendre(i);
          setTimeout(() => d.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 80);
          return;
        }
        fini = true; bVal.fermer(); api.reussi();
        return;
      }
      Object.keys(L.champs).forEach(k => L.champs[k].el.classList.toggle('ko', !oks[k]));
      Object.keys(L.cycles).forEach(k => L.cycles[k].classList.toggle('ko', !oks[k]));
      api.erreur(L.diag(x)); secouer(L.el);
    }
    rendre(0);
    bVal = boutonValider(zone);
    bVal.onclick = valider;
    return {
      montrer() {
        // toutes les lignes, complétées
        while (true) {
          const L = courante;
          Object.keys(L.champs).forEach(k => { L.champs[k].input.value = L.champs[k].j.aff || fmt(L.v[k]); L.champs[k].el.classList.remove('ko'); });
          Object.keys(L.cycles).forEach(k => { L.cycles[k].textContent = L.v[k]; L.cycles[k].classList.remove('ko'); });
          verrouiller(L);
          if (++i >= lignes.length) break;
          rendre(i);
        }
        fini = true; bVal.fermer();
      },
    };
  }
  const partieFraction = o => ({ type: 'perso', q: o.q, solution: o.solution, outil: 'fraction', o, monter: (zone, api) => monterFraction(zone, o, api) });

  /* ============================================================
     CLÉ TOURNANT AUTOUR DE O (module 3) : moment d'une force
     ROT.cle(zone, o) : outil libre ; ROT.partieCle(o) : partie « perso »
     o = { L (longueur de la clé, m ; 0,40), a (OA, m), beta (angle de F⃗ avec la clé, degrés), F (N),
           cible: { verif(st) → diagnostic HTML ou null, montrer: { a, beta } } }
     On fait glisser le point d'application A (le long de la clé) et la pointe de F⃗ (orientation),
     ou on utilise les boutons. La droite d'action (pointillés), le bras de levier d (perpendiculaire
     tracée depuis O, avec l'équerre) et M = F × d s'affichent en direct.
     ROT.figCle(o) : la même clé, dessinée sans interaction (figures, exercices).
     ============================================================ */
  const CLE = { W: 400, H: 270, ox: 64, oy: 138, k: 560, Lf: 86 };
  // bras de levier : distance de O à la droite d'action (passant par A, de direction β)
  const brasLevier = (a, beta) => Math.abs(a * Math.sin(rad(beta)));
  function sceneCle(st, o) {
    const { ox, oy, k, Lf } = CLE, L = o.L || .4;
    const X = x => ox + k * x, Y = y => oy - k * y;
    const ax = X(st.a), ay = oy, u = [Math.cos(rad(st.beta)), Math.sin(rad(st.beta))];
    const tx = ax + Lf * u[0], ty = ay - Lf * u[1];
    const d = brasLevier(st.a, st.beta), s = Math.sin(rad(st.beta));
    let g = '';
    // droite d'action (pointillés), prolongée de part et d'autre
    g += `<line x1="${f1(ax - 700 * u[0])}" y1="${f1(ay + 700 * u[1])}" x2="${f1(ax + 700 * u[0])}" y2="${f1(ay - 700 * u[1])}" class="rot-action"/>`;
    // la clé : manche gradué, tête autour de l'écrou O
    g += `<rect x="${ox}" y="${oy - 10}" width="${f1(k * L + 12)}" height="20" rx="10" class="rot-cle"/>`;
    g += `<circle cx="${ox}" cy="${oy}" r="26" class="rot-cle"/>`;
    g += `<polygon points="${[0, 60, 120, 180, 240, 300].map(a => `${f1(ox + 14 * Math.cos(rad(a + 30)))},${f1(oy - 14 * Math.sin(rad(a + 30)))}`).join(' ')}" class="rot-ecrou"/>`;
    for (let c = 5; c <= L * 100 + 1e-9; c += 5) {
      const x = X(c / 100);
      g += `<line x1="${f1(x)}" y1="${oy + (c % 10 ? 4 : 1)}" x2="${f1(x)}" y2="${oy + 10}" class="rot-grad"/>`;
      if (c % 10 === 0) g += `<text x="${f1(x)}" y="${oy + 26}" text-anchor="middle" class="rot-t-grad">${c} cm</text>`;
    }
    // bras de levier : OH perpendiculaire à la droite d'action, équerre en H
    if (d > .003) {
      const hx = st.a * s * s, hy = -st.a * s * u[0];       // H = a sinβ (sinβ, −cosβ) (en m)
      const HX = X(hx), HY = Y(hy);
      g += `<line x1="${ox}" y1="${oy}" x2="${f1(HX)}" y2="${f1(HY)}" class="rot-bras"/>`;
      // équerre : petit carré construit sur la droite d'action et sur HO
      const n = [(ox - HX), (oy - HY)], ln = Math.hypot(n[0], n[1]) || 1, e = 10;
      const nx = n[0] / ln * e, ny = n[1] / ln * e, ux = u[0] * e * (u[0] * (ax - HX) - u[1] * (ay - HY) >= 0 ? 1 : -1), uy = -u[1] * e * (u[0] * (ax - HX) - u[1] * (ay - HY) >= 0 ? 1 : -1);
      g += `<path d="M${f1(HX + nx)},${f1(HY + ny)} L${f1(HX + nx + ux)},${f1(HY + ny + uy)} L${f1(HX + ux)},${f1(HY + uy)}" class="rot-equerre"/>`;
      g += `<circle cx="${f1(HX)}" cy="${f1(HY)}" r="3.5" class="rot-pt-h"/>`;
      // nom « d » : au-dessus de la clé si OH est le long de la clé, sinon du côté opposé à la force
      const mx = (ox + HX) / 2, my = (oy + HY) / 2;
      let px = -(HY - oy) / ln, py = (HX - ox) / ln;
      if (px * u[0] - py * u[1] > 0) { px = -px; py = -py; }
      g += Math.abs(HY - oy) < 3 ? `<text x="${f1(mx)}" y="${oy - 16}" text-anchor="middle" class="rot-t-d">d</text>`
        : `<text x="${f1(mx + 14 * px)}" y="${f1(my + 14 * py + 5)}" text-anchor="middle" class="rot-t-d">d</text>`;
      // sens de rotation autour de O (trigonométrique si sin β > 0)
      g += arcFleche(ox, oy, 40, s > 0 ? 150 : 250, s > 0 ? 230 : 170, 'rot-sens');
    }
    // la force F⃗ en A
    g += fl(ax, ay, tx, ty, 'rot-f', 13);
    g += nomSVG('F', tx + 18 * u[0] + (Math.abs(u[0]) < .3 ? 14 : 0), ty - 18 * u[1] + 6);
    g += `<circle cx="${f1(ax)}" cy="${oy}" r="7" class="rot-pt-a"/>`;
    // nom du point A du côté opposé à la force (pour ne pas la recouvrir)
    g += u[0] < -.3 ? `<text x="${f1(ax + 10)}" y="${oy - 15}" class="rot-t-pt">A</text>` : `<text x="${f1(ax - 10)}" y="${oy - 15}" class="rot-t-pt" text-anchor="end">A</text>`;
    g += `<circle cx="${ox}" cy="${oy}" r="3.5" class="rot-pt"/><text x="${ox - 10}" y="${oy - 30}" class="rot-t-pt" text-anchor="middle">O</text>`;
    if (o.interactif) {
      g += `<circle cx="${f1(ax)}" cy="${oy}" r="22" class="rot-poignee" data-p="A"/>`;
      g += `<circle cx="${f1(tx)}" cy="${f1(ty)}" r="22" class="rot-poignee" data-p="F"/>`;
    }
    return g;
  }
  function figCle(o) {
    o = Object.assign({ L: .4, a: .2, beta: 90 }, o);
    return `<svg viewBox="0 0 ${CLE.W} ${CLE.H}" class="rot-doc rot-cle-svg" role="img" aria-label="${o.aria || `Clé tournant autour de O ; force appliquée en A, à ${fmt(o.a * 100)} cm de O`}">${sceneCle(o, o)}</svg>`;
  }
  function cle(zone, o, api) {
    o = Object.assign({ L: .4, a: .1, beta: 120, F: 20 }, o);
    const st = { a: o.a, beta: o.beta };
    let fini = false, prise = null;
    const d = el('div', 'rot-cle-outil');
    d.innerHTML = `<div class="rot-cle-scene"><svg viewBox="0 0 ${CLE.W} ${CLE.H}" class="rot-cle-svg rot-cle-actif" role="group" aria-label="Clé tournant autour de O : fais glisser le point A le long de la clé et la pointe de la force pour l'orienter"><g data-a="scene"></g></svg></div>
      <div class="rot-cle-lect" aria-live="polite"></div>
      <div class="rot-boutons rot-cle-boutons">
        <button type="button" class="btn-secondary" data-a="a-" aria-label="Rapprocher A de l'axe">← A</button>
        <button type="button" class="btn-secondary" data-a="a+" aria-label="Éloigner A de l'axe">A →</button>
        <button type="button" class="btn-secondary" data-a="b+" aria-label="Tourner la force dans le sens inverse des aiguilles d'une montre">↺ F</button>
        <button type="button" class="btn-secondary" data-a="b-" aria-label="Tourner la force dans le sens des aiguilles d'une montre">↻ F</button></div>`;
    zone.appendChild(d);
    const svgEl = d.querySelector('svg'), scene = svgEl.querySelector('[data-a="scene"]'), lect = d.querySelector('.rot-cle-lect');
    const L = o.L;
    function dessiner() {
      scene.innerHTML = sceneCle(st, Object.assign({}, o, { interactif: !fini }));
      const dd = brasLevier(st.a, st.beta), M = o.F * dd, s = Math.sin(rad(st.beta));
      lect.innerHTML = `<p>OA = <b>${fmt(st.a * 100, 0)} cm</b> · bras de levier d = <b>${fmt(dd * 100, 1)} cm</b> = ${fmt(dd, 3)} m</p>
        <p class="rot-cle-m">M = F × d = ${fmt(o.F)} N × ${fmt(dd, 3)} m = <b>${fmt(M, 2)} N·m</b></p>
        <p class="rot-gris">${dd <= .003 ? 'La droite d\'action passe par l\'axe O : d = 0, donc M = 0. La force ne fait pas tourner la clé.'
          : `La clé tourne dans le sens ${s > 0 ? '↺ (inverse des aiguilles d\'une montre)' : '↻ (des aiguilles d\'une montre)'}.`}</p>`;
      if (api) api.effacer();
    }
    const norm = b => ((Math.round(b / 5) * 5) % 360 + 360) % 360;
    d.querySelectorAll('.rot-cle-boutons button').forEach(b => {
      b.onclick = () => {
        if (fini) return;
        const t = b.dataset.a;
        if (t === 'a-') st.a = Math.max(.02, +(st.a - .01).toFixed(2));
        if (t === 'a+') st.a = Math.min(L, +(st.a + .01).toFixed(2));
        if (t === 'b+') st.beta = norm(st.beta + 5);
        if (t === 'b-') st.beta = norm(st.beta - 5);
        dessiner();
      };
    });
    // glisser : coordonnées du pointeur dans le repère de la clé (m)
    function monde(e) {
      const r = svgEl.getBoundingClientRect(), sx = CLE.W / r.width;
      const X = (e.clientX - r.left) * sx, Y = (e.clientY - r.top) * sx;
      return [(X - CLE.ox) / CLE.k, (CLE.oy - Y) / CLE.k];
    }
    // doigt posé sur une poignée : pas de défilement de la page (touch-action n'est pas appliqué aux formes SVG)
    svgEl.addEventListener('touchstart', e => { if (!fini && e.target.closest && e.target.closest('.rot-poignee')) e.preventDefault(); }, { passive: false });
    svgEl.addEventListener('pointerdown', e => {
      const p = e.target.closest && e.target.closest('.rot-poignee');
      if (!p || fini) return;
      e.preventDefault();
      prise = p.dataset.p;
      svgEl.setPointerCapture(e.pointerId);
      svgEl.classList.add('glisse');
    });
    // position du pointeur pendant le glisser (et au lâcher : le dernier déplacement n'est pas toujours transmis)
    function suivre(e) {
      if (!prise) return;
      const [x, y] = monde(e);
      if (prise === 'A') st.a = Math.min(L, Math.max(.02, Math.round(x * 100) / 100));
      else {
        const b = Math.atan2(y, x - st.a) * 180 / Math.PI;
        if (Math.hypot(x - st.a, y) > .03) st.beta = norm(b);
      }
      dessiner();
    }
    svgEl.addEventListener('pointermove', suivre);
    const lacher = () => { prise = null; svgEl.classList.remove('glisse'); };
    svgEl.addEventListener('pointerup', e => { suivre(e); lacher(); });
    svgEl.addEventListener('pointercancel', lacher);
    dessiner();
    if (!api || !o.cible) return { st };
    const bVal = boutonValider(zone);
    function verrouiller() {
      fini = true;
      d.querySelectorAll('.rot-cle-boutons button').forEach(b => { b.disabled = true; });
      svgEl.classList.remove('rot-cle-actif');
      bVal.fermer();
      dessiner();
    }
    bVal.onclick = () => {
      if (fini || api.fini()) return;
      const diag = o.cible.verif({ a: st.a, beta: st.beta, d: brasLevier(st.a, st.beta), M: o.F * brasLevier(st.a, st.beta), L, F: o.F });
      if (!diag) { verrouiller(); api.reussi(); return; }
      api.erreur(diag); secouer(svgEl);
    };
    return { montrer() { Object.assign(st, o.cible.montrer); verrouiller(); } };
  }
  const partieCle = o => ({ type: 'perso', q: o.q, solution: o.solution, outil: 'cle', o, monter: (zone, api) => cle(zone, o, api) });

  /* ============================================================
     CARACTÉRISTIQUES T(n) (module 4)
     def = { x: { max, pas, sous, nom }, y: { max, pas, sous, nom } (nom : texte SVG de l'axe),
             courbes: [{ f, de, a, cls: 'moteur' | 'charge', etiq: { x, y, texte, ancre } }],
             reperes: [{ x, y, lettre }], zone: { de, a, lettre }, lectures: [{ x, y, tx, ty }],
             points: [[x, y]], aria }
     ============================================================ */
  // courbe lisse passant par les points (interpolation d'Hermite monotone, « PCHIP » :
  // pas de dépassement, les extremums sont aux points donnés)
  function pchip(pts) {
    const n = pts.length, x = pts.map(p => p[0]), y = pts.map(p => p[1]), h = [], dl = [], m = [];
    for (let i = 0; i < n - 1; i++) { h[i] = x[i + 1] - x[i]; dl[i] = (y[i + 1] - y[i]) / h[i]; }
    m[0] = dl[0]; m[n - 1] = dl[n - 2];
    for (let i = 1; i < n - 1; i++) {
      if (dl[i - 1] * dl[i] <= 0) m[i] = 0;
      else { const w1 = 2 * h[i] + h[i - 1], w2 = h[i] + 2 * h[i - 1]; m[i] = (w1 + w2) / (w1 / dl[i - 1] + w2 / dl[i]); }
    }
    return t => {
      let i = 0;
      while (i < n - 2 && t > x[i + 1]) i++;
      const s = (t - x[i]) / h[i], s2 = s * s, s3 = s2 * s;
      return (2 * s3 - 3 * s2 + 1) * y[i] + (s3 - 2 * s2 + s) * h[i] * m[i] + (-2 * s3 + 3 * s2) * y[i + 1] + (s3 - s2) * h[i] * m[i + 1];
    };
  }
  // abscisse où f et g se croisent entre a et b (f − g change de signe)
  function intersection(f, g, a, b) {
    let fa = f(a) - g(a);
    for (let k = 0; k < 60; k++) {
      const c = (a + b) / 2, fc = f(c) - g(c);
      if (fa * fc <= 0) b = c; else { a = c; fa = fc; }
    }
    return (a + b) / 2;
  }
  function geom(def, W) {
    const H = Math.round(Math.min(380, Math.max(240, W * .64)));
    const g = 50, d = 18, h = 30, b = 46, L = W - g - d, Hh = H - h - b;
    return { W, H, g, d, h, b, L, Hh,
      X: v => g + v / def.x.max * L, Y: v => h + Hh - v / def.y.max * Hh,
      invX: px => (px - g) / L * def.x.max, invY: py => (h + Hh - py) / Hh * def.y.max };
  }
  function svgGraphe(def, G) {
    const { X, Y, g, h, L, Hh, W, H } = G;
    let s = '';
    // sous-quadrillage et quadrillage
    const lignes = (axe, f) => { for (let v = 0; v <= axe.max + 1e-9; v += axe.sous || axe.pas) f(v, Math.abs(v / axe.pas - Math.round(v / axe.pas)) < 1e-6); };
    lignes(def.x, (v, maj) => { s += `<line x1="${f1(X(v))}" y1="${h}" x2="${f1(X(v))}" y2="${h + Hh}" class="${maj ? 'rot-quad' : 'rot-sous-quad'}"/>`; });
    lignes(def.y, (v, maj) => { s += `<line x1="${g}" y1="${f1(Y(v))}" x2="${g + L}" y2="${f1(Y(v))}" class="${maj ? 'rot-quad' : 'rot-sous-quad'}"/>`; });
    // graduations
    let i = 0;
    // graduations trop serrées (téléphone) : une sur deux
    const serre = L / (def.x.max / def.x.pas) < 58;
    for (let v = 0; v <= def.x.max + 1e-9; v += def.x.pas, i++) if (!serre || i % 2 === 0) s += `<text x="${f1(X(v))}" y="${h + Hh + 18}" text-anchor="middle" class="ph-graduation">${fmt(v)}</text>`;
    for (let v = 0; v <= def.y.max + 1e-9; v += def.y.pas) s += `<text x="${g - 7}" y="${f1(Y(v) + 4)}" text-anchor="end" class="ph-graduation">${fmt(v)}</text>`;
    // axes et noms
    s += `<line x1="${g}" y1="${h + Hh}" x2="${g + L + 6}" y2="${h + Hh}" class="ph-axe"/><line x1="${g}" y1="${h + Hh}" x2="${g}" y2="${h - 10}" class="ph-axe"/>`;
    s += `<path d="M${g + L + 12},${h + Hh} l-9,-4.5 v9 Z M${g},${h - 16} l-4.5,9 h9 Z" class="ph-fleche"/>`;
    s += `<text x="${g + L}" y="${H - 6}" text-anchor="end" class="ph-axe-nom">${def.x.nom}</text>`;
    s += `<text x="${g + 8}" y="${h - 8}" class="ph-axe-nom">${def.y.nom}</text>`;
    // zone utile : crochet le long de l'axe des abscisses et portion de courbe surlignée (def.zone.f) ;
    // la lettre est à gauche du milieu de cette portion
    if (def.zone) {
      const z = def.zone, x1 = X(z.de), x2 = X(z.a), y = h + Hh - 7;
      s += `<path d="M${f1(x1)},${y + 5} V${y} H${f1(x2)} V${y + 5}" class="rot-zone"/>`;
      if (z.f) {
        let p = '';
        for (let k = 0; k <= 30; k++) { const x = z.de + (z.a - z.de) * k / 30; p += (k ? 'L' : 'M') + f1(X(x)) + ',' + f1(Y(Math.max(0, z.f(x)))); }
        s += `<path d="${p}" class="rot-zone-c"/>`;
      }
      if (z.lettre) { const xm = (z.de + z.a) / 2; s += lettreSVG(X(xm) - 24, z.f ? Y(z.f(xm)) : y - 16, z.lettre); }
    }
    // courbes (coupées hors du cadre)
    (def.courbes || []).forEach(c => {
      const a = c.de || 0, z = c.a == null ? def.x.max : c.a, N = 300;
      let p = '', dedans = false;
      for (let k = 0; k <= N; k++) {
        const x = a + (z - a) * k / N, y = c.f(x);
        if (y < -1e-6 || y > def.y.max * 1.001) { dedans = false; continue; }
        p += (dedans ? 'L' : 'M') + f1(X(x)) + ',' + f1(Y(y));
        dedans = true;
      }
      s += `<path d="${p}" class="rot-c-${c.cls || 'moteur'}"/>`;
      if (c.etiq) s += `<text x="${f1(X(c.etiq.x))}" y="${f1(Y(c.etiq.y))}" text-anchor="${c.etiq.ancre || 'start'}" class="rot-t-${c.cls || 'moteur'}">${c.etiq.texte}</text>`;
    });
    // lectures (pointillés vers les axes) et points
    (def.lectures || []).forEach(l => {
      s += `<path d="M${f1(X(l.x))},${h + Hh} V${f1(Y(l.y))} H${g}" class="ph-lecture" fill="none"/><circle cx="${f1(X(l.x))}" cy="${f1(Y(l.y))}" r="5" class="ph-point"/>`;
      if (l.tx) s += `<text x="${f1(X(l.x))}" y="${h + Hh - 6}" text-anchor="middle" class="rot-t-lect">${l.tx}</text>`;
      if (l.ty) s += `<text x="${g + 6}" y="${f1(Y(l.y) - 6)}" class="rot-t-lect">${l.ty}</text>`;
    });
    (def.points || []).forEach(([x, y]) => { s += `<circle cx="${f1(X(x))}" cy="${f1(Y(y))}" r="5" class="ph-point"/>`; });
    (def.reperes || []).forEach(r => {
      s += `<circle cx="${f1(X(r.x))}" cy="${f1(Y(r.y))}" r="5.5" class="ph-point"/>`;
      s += lettreSVG(X(r.x) + (r.dx == null ? 16 : r.dx), Y(r.y) + (r.dy == null ? -16 : r.dy), r.lettre);
    });
    return s;
  }
  // lettre de repère dans une pastille
  const lettreSVG = (x, y, l) => `<g class="rot-lettre"><circle cx="${f1(x)}" cy="${f1(y)}" r="11"/><text x="${f1(x)}" y="${f1(y + 4.5)}" text-anchor="middle">${l}</text></g>`;
  // graphique dessiné à la largeur disponible
  function grapheFig(def) {
    return fig(W_ => {
      const G = geom(def, Math.min(W_, 640));
      return `<svg viewBox="0 0 ${G.W} ${G.H}" width="${G.W}" class="ph-graphe" role="img" aria-label="${def.aria || 'Caractéristique'}">${svgGraphe(def, G)}</svg>`;
    });
  }

  /* Placer le point de fonctionnement : ROT.partiePoint(def, o)
     o = { q, cible: [x, y], tol: [tx, ty], depart: [x, y], moteur: f, charge: g, solution }
     Le point se fait glisser (au doigt ou à la souris) ou se déplace avec les flèches ;
     les pointillés vers les axes le suivent. On ne lit pas de valeur : c'est l'élève qui lit. */
  function partiePoint(def, o) {
    return {
      type: 'perso', q: o.q || 'Place le point de fonctionnement : fais glisser le point ● (ou utilise les flèches), puis valide.', solution: o.solution, outil: 'point', def, o,
      monter(zone, api) {
        const st = { x: o.depart[0], y: o.depart[1] };
        const px = def.x.sous / 5, py = def.y.sous / 5;
        let fini = false, G = null, prise = false, tape = null;
        const d = el('div', 'rot-pt-outil');
        d.innerHTML = `<div class="rot-pt-graphe"></div>
          <div class="rot-pad" role="group" aria-label="Déplacer le point">
            <button type="button" data-d="h" aria-label="Monter le point">↑</button><button type="button" data-d="g" aria-label="Déplacer le point vers la gauche">←</button>
            <button type="button" data-d="b" aria-label="Descendre le point">↓</button><button type="button" data-d="d" aria-label="Déplacer le point vers la droite">→</button></div>`;
        zone.appendChild(d);
        const box = d.querySelector('.rot-pt-graphe');
        const mobile = () => {
          const X = G.X(st.x), Y = G.Y(st.y);
          return `<path d="M${f1(X)},${G.h + G.Hh} V${f1(Y)} H${G.g}" class="ph-lecture" fill="none"/>` +
            `<circle cx="${f1(X)}" cy="${f1(Y)}" r="8" class="rot-pt-mobile${fini ? ' fini' : ''}"/>` +
            (fini ? '' : `<circle cx="${f1(X)}" cy="${f1(Y)}" r="24" class="rot-poignee"/>`);
        };
        let largeur = 0;
        function tracer() {
          const W = Math.min(Math.round(box.clientWidth), 640);
          if (!W) return;
          largeur = W;
          G = geom(def, W);
          box.innerHTML = `<svg viewBox="0 0 ${G.W} ${G.H}" width="${G.W}" class="ph-graphe rot-pt-svg" role="group" aria-label="${def.aria || 'Caractéristiques'} ; point à placer">${svgGraphe(def, G)}<g data-a="mobile">${mobile()}</g></svg>`;
        }
        const maj = () => { const m = box.querySelector('[data-a="mobile"]'); if (m) m.innerHTML = mobile(); api.effacer(); };
        const borner = () => {
          st.x = Math.min(def.x.max, Math.max(0, Math.round(st.x / px) * px));
          st.y = Math.min(def.y.max, Math.max(0, Math.round(st.y / py) * py));
        };
        if (window.ResizeObserver) new ResizeObserver(() => { if (Math.min(Math.round(box.clientWidth), 640) !== largeur) tracer(); }).observe(box);
        tracer();
        const pos = e => {
          const s = box.querySelector('svg'), r = s.getBoundingClientRect(), k = G.W / r.width;
          return [G.invX((e.clientX - r.left) * k), G.invY((e.clientY - r.top) * k)];
        };
        // doigt posé sur la poignée : pas de défilement de la page (touch-action n'est pas appliqué aux formes SVG)
        box.addEventListener('touchstart', e => { if (!fini && e.target.closest && e.target.closest('.rot-poignee')) e.preventDefault(); }, { passive: false });
        box.addEventListener('pointerdown', e => {
          if (fini || !G) return;
          if (e.target.closest('.rot-poignee')) {
            e.preventDefault(); prise = true;
            box.querySelector('svg').setPointerCapture(e.pointerId);
          } else tape = [e.clientX, e.clientY];
        });
        box.addEventListener('pointermove', e => {
          if (!prise) return;
          [st.x, st.y] = pos(e); borner(); maj();
        });
        box.addEventListener('pointerup', e => {
          // fin du glisser : dernière position (le dernier déplacement n'est pas toujours transmis)
          if (prise) { [st.x, st.y] = pos(e); borner(); maj(); }
          // simple appui sur le graphique : le point y va
          if (!prise && tape && Math.hypot(e.clientX - tape[0], e.clientY - tape[1]) < 8 && !fini) {
            const [x, y] = pos(e);
            if (x >= 0 && x <= def.x.max && y >= 0 && y <= def.y.max) { st.x = x; st.y = y; borner(); maj(); }
          }
          prise = false; tape = null;
        });
        box.addEventListener('pointercancel', () => { prise = false; tape = null; });
        d.querySelectorAll('.rot-pad button').forEach(b => {
          b.onclick = () => {
            if (fini) return;
            const k = b.dataset.d;
            if (k === 'h') st.y += py; if (k === 'b') st.y -= py; if (k === 'g') st.x -= px; if (k === 'd') st.x += px;
            borner(); maj();
          };
        });
        const bVal = boutonValider(zone);
        function verrouiller() {
          fini = true;
          d.querySelectorAll('.rot-pad button').forEach(b => { b.disabled = true; });
          d.classList.add('fini');
          bVal.fermer();
          const m = box.querySelector('[data-a="mobile"]'); if (m) m.innerHTML = mobile();
        }
        bVal.onclick = () => {
          if (fini || api.fini()) return;
          const [cx, cy] = o.cible, [tx, ty] = o.tol;
          if (Math.abs(st.x - cx) <= tx && Math.abs(st.y - cy) <= ty) { verrouiller(); api.reussi(); return; }
          const surM = o.moteur && Math.abs(st.y - o.moteur(st.x)) <= ty, surC = o.charge && Math.abs(st.y - o.charge(st.x)) <= ty;
          api.erreur(surM && !surC ? 'Ton point est sur la caractéristique du <b>moteur</b>, mais pas sur celle de la <b>charge</b> : le point de fonctionnement est sur les deux courbes à la fois.'
            : surC && !surM ? 'Ton point est sur la caractéristique de la <b>charge</b>, mais pas sur celle du <b>moteur</b> : le point de fonctionnement est sur les deux courbes à la fois.'
            : 'Le point de fonctionnement est à l\'<b>intersection</b> des deux caractéristiques : place ton point là où les deux courbes se croisent.');
          secouer(box);
        };
        return { montrer() { st.x = o.cible[0]; st.y = o.cible[1]; verrouiller(); } };
      },
    };
  }

  // Nommer les grandeurs repérées par des lettres sur une caractéristique (étiquettes à glisser)
  // def : graphique avec def.reperes et def.zone ; o = { q, noms: { lettre: 'texte de l'étiquette' }, intrus: [{ label, indice }], indices: { lettre }, solution }
  function partieEtiquettes(def, o) {
    const lettres = Object.keys(o.noms);
    return {
      type: 'schema', q: o.q, titrePalette: 'Grandeurs à placer', solution: o.solution, correction: o.solution,
      schema: `<div class="rot-carac">${grapheFig(def)}<div class="rot-carac-cases">${lettres.map(l => `<div class="rot-carac-l">${lettreSVGhtml(l)}${slot(l)}</div>`).join('')}</div></div>`,
      etiquettes: lettres.map(l => ({ id: l, label: o.noms[l], cible: l, indice: (o.indices || {})[l] }))
        .concat((o.intrus || []).map((x, i) => ({ id: 'intrus' + i, label: x.label, cible: null, indice: x.indice }))),
    };
  }
  const lettreSVGhtml = l => `<span class="rot-lettre-h">${l}</span>`;

  /* ============================================================
     PLAN DE L'APPLICATION ET NAVIGATION (voir assets/sommaire.js)
     ============================================================ */
  const PLAN = [
    { n: 1, titre: 'Vitesse angulaire', desc: 'ω = θ / Δt, v = R × ω, période et fréquence, angle balayé', fiche: 'fiche_1',
      parties: [{ nom: 'Vitesse angulaire', cours: 'module_1_cours', questions: 'module_1_questions' }] },
    { n: 2, titre: 'Convertir tr/min et rad/s', desc: '1 tour = 2π rad et 1 min = 60 s : la méthode de la fraction', fiche: 'fiche_2',
      parties: [{ nom: 'Convertir tr/min et rad/s', cours: 'module_2_cours', questions: 'module_2_questions' }] },
    { n: 3, titre: 'Moment d\'une force et couple', desc: 'M = F × d, bras de levier, force oblique, couple de forces M = F × D', fiche: 'fiche_3',
      parties: [{ nom: 'Moment d\'une force', slug: 'moment', cours: 'module_3a_cours' },
        { nom: 'Couple de forces', slug: 'couple', cours: 'module_3b_cours', questions: 'module_3_questions' }] },
    { n: 4, titre: 'Caractéristique d\'un moteur', desc: 'Couple maximal, fréquence à vide, zone utile, point de fonctionnement', fiche: 'fiche_4',
      parties: [{ nom: 'Caractéristique d\'un moteur', cours: 'module_4_cours', questions: 'module_4_questions' }] },
    { n: 5, titre: 'Exercices', desc: 'Exercices 9, 8, 12, 11, 1, 2, 15, 16 et 17 de la feuille, guidés pas à pas', exercices: 'module_5', exNom: 'Exercices de la feuille', nbEx: 9 },
  ];
  window.SOM.init({ nom: 'Chapitre 8 : Mouvements de rotation', id: 'mouvements-rotation', cleEx: 'mouvements-rotation-exercices', plan: PLAN });
  const menu = cle_ => window.SOM.menu(cle_);
  const accueil = zone => window.SOM.accueil(zone);
  const marquer = info => window.SOM.marquer(info);

  window.ROT = Object.assign(window.ROT || {}, {
    MOINS, fmt, cs, sci, lire, proche, fr, rac, unite, o, fq, el, secouer, melanger, hasard, entre, champ, boutonValider, PARTIES, versCours,
    question, serie, confettis, fig, monter, outil, cap, slot, V, DEUX_PI, rad, fl, cote, nomSVG, arc, arcFleche,
    figArc, figManege, figChrono, figVolant, figCouple, figOblique, figBarre, figBarriere, figCle,
    disque, partieDisque, lignesFraction, partieFraction, cle, partieCle, brasLevier,
    pchip, intersection, geom, grapheFig, partiePoint, partieEtiquettes,
    PLAN, menu, accueil, marquer,
  });
})();
