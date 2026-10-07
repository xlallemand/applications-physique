/* ============================================================
   Moteur de l'application « Transport et distribution de l'électricité »
   (Terminale STI2D ; même moteur que l'application « Cinématique »)

   TE.fmt, TE.lire             écriture et lecture des nombres (virgule)
   TE.unite(v, 'V')             valeur avec préfixe : 20 kV, 6,5 mA
   TE.o, TE.fq.choix, TE.fq.nombre   fabriques d'options et de parties de question
   TE.PARTIES                   parties de question :
       'choix'    boutons à choisir
       'nombre'   valeur numérique (avec bouton ±)
       'gabarit'  expression à trous (ex. : □ × □)
       'sci'      écriture scientifique a × 10ⁿ
       'schema'   valeurs à glisser sur un schéma (voir schemas.js)
   TE.question(zone, q, cb)     question en plusieurs parties
   TE.serie(opts)               série de questions notée sur 20
   TE.decouverte(zone, qs)      questions guidées à côté d'une simulation (sans points)
   TE.aToi(zone, items, fin)    « À toi » dans les cours : il faut réussir pour continuer
   TE.Cours                     cours par étapes (une étape réussie fait apparaître la suivante)
   TE.menu(cle)                 sommaire de toute l'application (navigation d'une page)
   TE.accueil(zone)             accueil : une ligne dépliable par module

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
    const d = el('div', 'ph-valeur te-gabarit');
    if (p.label) d.appendChild(el('span', 'ph-lab', p.label));
    // chaque case forme un groupe insécable avec le texte qui la suit (et le texte d'ouverture
    // avec la première case) : sur un petit écran, la ligne ne se coupe qu'entre deux groupes
    const champs = [];
    let grp = el('span', 'te-g-grp');
    d.appendChild(grp);
    p.morceaux.forEach(m => {
      if (typeof m === 'string') { grp.appendChild(el('span', 'te-g-txt', m)); return; }
      if (champs.length) { grp = el('span', 'te-g-grp'); d.appendChild(grp); }
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
     p.schema : HTML du schéma, avec des cases SCH.slot(id)
     p.etiquettes : [{ id, label, cible (id de case ou liste d'ids), indice }]
     Toutes les étiquettes doivent être placées ; les cases restantes sont les inconnues.
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
    const cibles = c => [].concat(etiq(c.dataset.id).cible);
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
      const reste = palette.querySelectorAll('.sc-chip').length;
      if (reste) {
        secouer(d.querySelector('.sc-palette'));
        api.message(`Place toutes les valeurs sur le schéma (il en reste ${reste}).`);
        return;
      }
      const fausses = [];
      chips.forEach(c => {
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
        chips.forEach(c => {
          const s = slots.find(x => x.dataset.slot === cibles(c)[0] && !x.querySelector('.sc-chip')) || slots.find(x => x.dataset.slot === cibles(c)[0]);
          placer(c, s);
          s.classList.add('ok');
        });
        terminer();
      },
    };
  }

  const PARTIES = { choix: pChoix, nombre: pNombre, gabarit: pGabarit, sci: pSci, schema: pSchema };

  /* ============================================================
     « AFFICHER TOUT LE COURS »
     Les questions et les « À toi » en cours s'inscrivent ici. Quand
     l'élève demande tout le cours, chacun « se déplie » : toutes ses
     parties sont affichées d'un coup, avec le bouton « Afficher la
     réponse » disponible tout de suite. TE.tout reste vrai ensuite :
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
      window.TE.partieEnCours = p;          // partie en cours (utile pour vérifier l'application)
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
    if (mode === 'cours' && window.TE.tout) inst.deplier();
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
      window.TE.questionEnCours = q;          // question en cours (utile pour vérifier l'application)
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
      marquer({ note });
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

  /* ============================================================
     DÉCOUVERTE GUIDÉE (page de simulation)
     Questions successives posées à côté d'une simulation : il faut
     manipuler, observer, puis choisir la bonne réponse. Sans points.
     TE.decouverte(zone, questions, { fin })
     questions = [{
       texte, consigne,                   énoncé, encadré « ☛ » facultatif
       choix: [{ t, ok, pourquoi }],      réponses (pourquoi : diagnostic de l'erreur)
       prealable: () => msg | null,       manipulation à faire avant de répondre
       bravo,                             explication quand c'est juste (HTML ou fonction)
       resume,                            ce qu'il faut retenir (liste « Ce que tu as trouvé »)
       avant(), apres()                   actions à l'affichage / après la bonne réponse
     }]
     ============================================================ */
  function decouverte(zone, questions, options) {
    options = options || {};
    let n = 0;
    const faites = [];
    const valeur = v => (typeof v === 'function' ? v() : v);

    function afficher() {
      const q = questions[n], total = questions.length;
      if (q.avant) q.avant();
      // les réponses sont mélangées (sauf q.melanger === false) ; k garde l'indice d'origine
      const ordre = q.melanger === false ? q.choix.map((c, k) => k) : melanger(q.choix.map((c, k) => k));
      zone.innerHTML = `
        <div class="er-card te-dq">
          <div class="te-dq-tete">
            <span class="te-dq-num">Question ${n + 1} / ${total}</span>
            <div class="progress-bar"><div class="progress-fill" style="width:${Math.round(n / total * 100)}%"></div></div>
          </div>
          <p class="te-dq-texte">${valeur(q.texte)}</p>
          ${q.consigne ? `<div class="te-dq-consigne"><span>${valeur(q.consigne)}</span></div>` : ''}
          <div class="te-dq-choix">${ordre.map(k => `<button type="button" class="btn-secondary" data-k="${k}">${q.choix[k].t}</button>`).join('')}</div>
          <div class="te-dq-actions"><button type="button" class="btn-primary te-dq-valider" disabled>Valider</button></div>
          <div class="te-dq-retour" aria-live="polite"></div>
        </div>
        ${parcours()}`;
      const boutons = zone.querySelectorAll('.te-dq-choix button');
      const valider = zone.querySelector('.te-dq-valider');
      const retour = zone.querySelector('.te-dq-retour');
      let choisi = null, erreurs = 0;

      boutons.forEach(b => b.addEventListener('click', () => {
        boutons.forEach(x => x.classList.remove('choisi'));
        b.classList.add('choisi');
        choisi = +b.dataset.k;
        valider.disabled = false;
        retour.innerHTML = '';
      }));

      valider.addEventListener('click', () => {
        // la manipulation demandée n'est pas faite : on le dit, sans compter d'erreur
        const manque = q.prealable ? q.prealable() : null;
        if (manque) {
          retour.innerHTML = `<div class="callout-accent"><b>Avant de répondre :</b> ${manque}</div>`;
          secouer(retour);
          return;
        }
        const c = q.choix[choisi], b = zone.querySelector(`.te-dq-choix button[data-k="${choisi}"]`);
        b.classList.remove('choisi');
        if (!c.ok) {
          erreurs++;
          b.classList.add('opt-wrong');
          b.disabled = true; choisi = null; valider.disabled = true;
          retour.innerHTML = `<div class="callout-danger"><p><b>Ce n'est pas ça.</b> ${valeur(c.pourquoi) || 'Observe à nouveau la simulation et réessaie.'}</p></div>`;
          secouer(retour);
          return;
        }
        b.classList.add('opt-correct');
        boutons.forEach(x => { x.disabled = true; });
        const bravo = valeur(q.bravo);
        retour.innerHTML = `<div class="callout-success"><p><b>${erreurs ? 'C\'est juste.' : 'Juste !'}</b> ${bravo}</p></div>`;
        faites.push({ resume: valeur(q.resume), bravo });
        if (q.apres) q.apres();
        const fin = n === questions.length - 1;
        valider.outerHTML = `<button type="button" class="btn-primary te-dq-suivant">${fin ? 'Voir le bilan →' : 'Question suivante →'}</button>`;
        const suiv = zone.querySelector('.te-dq-suivant');
        // évite le double appui : la question suivante n'accepte un clic qu'après un court délai
        suiv.disabled = true;
        setTimeout(() => { suiv.disabled = false; }, 450);
        suiv.addEventListener('click', () => {
          n++;
          if (n < questions.length) afficher(); else terminer();
          const r = zone.getBoundingClientRect();
          if (r.top < 60 || r.top > innerHeight - 120) scrollTo({ top: scrollY + r.top - 76, behavior: 'smooth' });
        });
        retour.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      });
    }

    // questions déjà réussies : ce qu'il faut retenir, repliable
    function parcours() {
      if (!faites.length) return '';
      return `<details class="te-dq-parcours er-card"${options.parcoursOuvert ? ' open' : ''}>
        <summary>Ce que tu as trouvé (${faites.length})</summary>
        <ol>${faites.map((f, k) => `<li><b>${k + 1}.</b> ${f.resume || ''}</li>`).join('')}</ol>
      </details>`;
    }

    function terminer() {
      zone.innerHTML = parcours();
      if (options.fin) options.fin();
    }

    afficher();
    return { etape: () => n };
  }

  /* ============================================================
     « À TOI » DANS LES COURS
     Une suite de petites questions sans points ; onFini() quand
     toutes sont réussies (ou leur réponse affichée).
     items = [{ titre, enonce, figure(zone), parties: [p] }]
     ============================================================ */
  function aToi(zone, items, onFini, titre) {
    const box = el('div', 'ph-atoi');
    box.innerHTML = `<div class="ph-atoi-tete"><p class="ph-atoi-t">${titre || 'À toi'}</p></div>`;
    zone.appendChild(box);
    let i = 0, deplie = false, termine = false;
    // « Afficher tout le cours » : toutes les questions restantes, puis la suite du cours
    const inst = {
      deplier() {
        if (deplie) return;
        deplie = true;
        while (i < items.length) rendre(i++);
        finir();
      },
    };
    function finir() {
      if (termine) return;
      termine = true;
      vivants.delete(inst);
      if (onFini) onFini();
    }
    function rendre(k) {
      const it = items[k];
      const d = el('div', 'ph-atoi-q', `${it.titre ? `<p class="ph-atoi-titre">${it.titre}</p>` : ''}${it.enonce ? `<div class="ph-enonce">${it.enonce}</div>` : ''}<div class="ph-atoi-fig"></div><div></div>`);
      box.appendChild(d);
      if (it.figure) it.figure(d.querySelector('.ph-atoi-fig'));
      question(d.lastElementChild, it, { fin() { if (!deplie) suivant(); } }, 'cours');
      if (k > 0 && !deplie) setTimeout(() => d.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 80);
    }
    function suivant() {
      if (i >= items.length) { finir(); return; }
      rendre(i++);
    }
    vivants.add(inst);
    suivant();
    if (window.TE.tout) inst.deplier();
    return box;
  }

  /* ============================================================
     COURS PAR ÉTAPES
     const cours = new TE.Cours(zone, [ (c) => { … }, … ]);
     Chaque étape reçoit l'objet cours et construit sa carte avec
     cours.carte(titre), cours.ajouter(carte, html), puis appelle
     cours.continuer(carte) pour proposer l'étape suivante.
     ============================================================ */
  function Cours(zone, etapes) {
    this.zone = zone; this.etapes = etapes; this.n = 0; this.attente = null; this.bouton = null;
    vivants.add(this);
    this.lancer(0);
    this.boutonTout();
  }
  Cours.prototype.carte = function (titre) {
    const c = el('section', 'er-card er-etape');
    c.innerHTML = `<h3 class="cours-titre">${titre}</h3>`;
    this.zone.appendChild(c);
    return c;
  };
  Cours.prototype.ajouter = function (parent, html) {
    const d = el('div', null, html);
    parent.appendChild(d);
    return d;
  };
  Cours.prototype.lancer = function (n) {
    this.n = n;
    const c = this.etapes[n](this);
    if (n === this.etapes.length - 1) { this.toutEstAffiche(); marquer({ fait: true }); }
    return c;
  };
  // bouton « Continuer » : affiche l'étape suivante et la fait défiler à l'écran
  // (quand tout le cours est affiché, l'étape suivante apparaît directement)
  Cours.prototype.continuer = function (parent, texte) {
    if (this.n + 1 >= this.etapes.length) return;
    if (window.TE.tout) { this.lancer(this.n + 1); return; }
    const d = this.ajouter(parent, `<div class="er-suite"><button type="button" class="btn-primary">${texte || 'Continuer →'}</button></div>`);
    this.attente = d;
    d.querySelector('button').onclick = () => this.suivante(true);
  };
  Cours.prototype.suivante = function (defiler) {
    const d = this.attente;
    if (!d) return;
    this.attente = null;
    d.remove();
    if (defiler) {
      // évite qu'un double appui sur « Continuer » réponde à l'étape suivante
      this.zone.style.pointerEvents = 'none';
      setTimeout(() => { this.zone.style.pointerEvents = ''; }, 400);
    }
    const c = this.lancer(this.n + 1);
    if (c && defiler) setTimeout(() => c.scrollIntoView({ behavior: 'smooth', block: 'start' }), 30);
  };
  Cours.prototype.deplier = function () { this.suivante(false); };

  // bouton « Afficher tout le cours », dans le premier « À toi », près de la première question
  Cours.prototype.boutonTout = function () {
    const tete = this.zone.querySelector('.ph-atoi-tete');
    if (!tete) return;
    const b = el('button', 'btn-small te-tout', 'Afficher tout le cours');
    b.type = 'button';
    b.title = 'Affiche toutes les parties du cours sans avoir à répondre aux questions (tu peux toujours y répondre)';
    tete.appendChild(b);
    this.bouton = b;
    if (this.n === this.etapes.length - 1) this.toutEstAffiche();
    b.onclick = () => this.toutAfficher();
  };
  Cours.prototype.toutAfficher = function () {
    const b = this.bouton;
    if (!b || b.disabled) return;
    // la position de la page ne bouge pas : on garde le bouton au même endroit à l'écran
    const avant = b.getBoundingClientRect().top;
    window.TE.tout = true;
    Array.from(vivants).forEach(x => x.deplier());
    this.toutEstAffiche();
    window.scrollBy(0, b.getBoundingClientRect().top - avant);
  };
  Cours.prototype.toutEstAffiche = function () {
    if (!this.bouton) return;
    this.bouton.disabled = true;
    this.bouton.textContent = 'Tout le cours est affiché';
  };

  /* ============================================================
     PLAN DE L'APPLICATION, PROGRESSION ET NAVIGATION

     Sommaire de toute l'application : modules → parties → pages (Cours, Questions, Fiche).
     Le module et la partie de la page en cours sont dépliés, la page en cours est encadrée.
     Un clic sur un module ou une partie le déplie sur place (sans changer de page) ;
     les pages sont des liens ordinaires. La fiche d'un module s'ouvre à la partie choisie
     (ancre #slug dans la page de la fiche).
       ordinateur : sommaire toujours ouvert dans une colonne à gauche (pas de bandeau) ;
       téléphone  : bandeau « où suis-je » ; un appui déroule le sommaire sous le bandeau.
     ============================================================ */
  const PLAN = [
    { n: 1, titre: 'Pertes par effet Joule', desc: 'Puissance perdue dans les lignes, rôle du facteur de puissance', fiche: 'fiche_1',
      parties: [{ nom: 'Pertes par effet Joule', cours: 'module_1_cours', questions: 'module_1_questions' }] },
    { n: 2, titre: 'Le transformateur', desc: 'Simulation, rapport de transformation, intérêt pour le transport', fiche: 'fiche_2',
      parties: [
        { nom: 'Manipuler un transformateur', slug: 'simulation', simulation: 'module_2_simulation' },
        { nom: 'Propriétés du transformateur', slug: 'proprietes', cours: 'module_2_cours', questions: 'module_2_questions' },
      ] },
    { n: 3, titre: 'Risque électrique', desc: 'Disjoncteurs, disjoncteur différentiel, mise à la terre', fiche: 'fiche_3',
      parties: [{ nom: 'Risque électrique', cours: 'module_3_cours', questions: 'module_3_questions' }] },
    { n: 4, titre: 'Puissance et transport en exercices', desc: 'Transformateurs et charge avec facteur de puissance : méthode, exemples, exercices', fiche: 'fiche_4',
      exercices: 'module_4_exercices', exNom: 'Exercices', nbEx: 14,
      parties: [{ nom: 'Méthode et exemples', slug: 'methode', cours: 'module_4_cours' }] },
  ];

  /* ---------- Progression (gardée dans le navigateur) ---------- */
  const CLE_PROG = 'transport-electricite-progression', CLE_EX = 'transport-electricite-exercices';
  function lireProg() { try { return JSON.parse(localStorage.getItem(CLE_PROG)) || {}; } catch (e) { return {}; } }
  function ecrireProg(p) { try { localStorage.setItem(CLE_PROG, JSON.stringify(p)); } catch (e) { /* stockage indisponible : rien à faire */ } }
  function lireExercices() { try { return JSON.parse(localStorage.getItem(CLE_EX)) || {}; } catch (e) { return {}; } }
  const cleDePage = () => (location.pathname.split('/').pop() || '').replace(/\.html$/, '');
  // info = { fait: true } quand un cours est terminé, { note } pour la note sur 20 d'une série (on garde la meilleure)
  function marquer(info) {
    const p = lireProg(), cle = cleDePage();
    p.pages = p.pages || {};
    const a = p.pages[cle] || {};
    if (info.fait) a.fait = true;
    if (info.note != null) a.note = Math.max(a.note == null ? 0 : a.note, info.note);
    p.pages[cle] = a;
    ecrireProg(p);
  }
  // pages d'une partie, dans l'ordre : Simulation, Cours, Questions (celles que la partie possède)
  const ONGLETS = ['simulation', 'cours', 'questions'];
  const pagesPartie = pt => ONGLETS.filter(o => pt[o]);
  // une simulation ou un cours est fait quand il est terminé ; une série quand elle a une note
  const pageFaite = (pt, o, pages) => { const a = pages[pt[o]] || {}; return o === 'questions' ? a.note != null : !!a.fait; };
  const partieFaite = (pt, pages) => pagesPartie(pt).every(o => pageFaite(pt, o, pages));

  /* ---------- Où se trouve-t-on ? ---------- */
  function situer(cle) {
    for (const m of PLAN) {
      if (m.exercices === cle) return { m, onglet: 'exercices' };
      if (m.fiche === cle) {
        const h = location.hash.slice(1), i = Math.max(0, m.parties.findIndex(p => p.slug === h));
        return { m, i, p: m.parties[i], onglet: 'fiche' };
      }
      for (let i = 0; i < m.parties.length; i++) {
        const o = pagesPartie(m.parties[i]).find(x => m.parties[i][x] === cle);
        if (o) return { m, i, p: m.parties[i], onglet: o };
      }
    }
    return null;
  }
  // adresse d'un onglet d'une partie (pre : dossier des pages, vide dans modules/)
  function lien(m, p, onglet, pre) {
    pre = pre || '';
    if (onglet === 'fiche') return pre + m.fiche + '.html' + (p && p.slug ? '#' + p.slug : '');
    if (onglet === 'exercices') return pre + m.exercices + '.html';
    return pre + p[onglet] + '.html';
  }
  function libelle(cle) {
    const s = situer(cle);
    if (!s) return '';
    if (s.onglet === 'exercices') return `Module ${s.m.n} · Exercices`;
    const quoi = NOMS_PAGES[s.onglet];
    return s.m.parties.length > 1 && s.onglet !== 'fiche' ? `Module ${s.m.n} · ${s.p.nom} · ${quoi}` : `Module ${s.m.n} · ${quoi}`;
  }

  /* ---------- Avancement d'un module (sommaire et accueil) ---------- */
  // une page par simulation, cours et série ; les exercices comptent chacun pour un
  const totalModule = m => m.parties.reduce((n, pt) => n + pagesPartie(pt).length, 0) + (m.exercices ? m.nbEx : 0);
  const faitModule = (m, pages, ex) => m.parties.reduce((n, pt) => n + pagesPartie(pt).filter(o => pageFaite(pt, o, pages)).length, 0) +
    (m.exercices ? Math.min(m.nbEx, Object.keys(ex).length) : 0);

  /* ---------- Sommaire de toute l'application ---------- */
  const NOMS_PAGES = { simulation: 'Simulation', cours: 'Cours', questions: 'Questions', fiche: 'Fiche récapitulative', exercices: 'Exercices' };
  const ICONES = { simulation: '▸', cours: 'C', questions: 'Q', fiche: '≡', exercices: '#' };
  const chev = '<span class="te-chev" aria-hidden="true">›</span>';
  const feuille = (href, ic, lib, etat, ici) =>
    `<a class="te-page${ici ? ' ici' : ''}" href="${href}"${ici ? ' aria-current="page"' : ''}><span class="ic" aria-hidden="true">${ic}</span>${lib}${etat ? `<em>${etat}</em>` : ''}</a>`;
  // les pages d'une partie : Simulation (✓), Cours (✓), Questions (meilleure note), puis la Fiche du module
  function feuilles(m, p, s, pages) {
    const ici = o => s.m === m && s.p === p && s.onglet === o;
    const etat = o => { const a = pages[p[o]] || {}; return o === 'questions' ? (a.note != null ? fmt(a.note) + '/20' : '') : (a.fait ? '✓' : ''); };
    return pagesPartie(p).map(o => feuille(lien(m, p, o), ICONES[o], NOMS_PAGES[o], etat(o), ici(o))).join('') +
      (m.fiche ? feuille(lien(m, p, 'fiche'), ICONES.fiche, 'Fiche', '', ici('fiche')) : '');
  }
  const feuilleEx = (m, s) => feuille(m.exercices + '.html', ICONES.exercices, m.exNom, '', s.m === m && s.onglet === 'exercices');
  function sommaire(s, pages, ex) {
    return PLAN.map(m => {
      const ici = s.m === m, n = faitModule(m, pages, ex), t = totalModule(m), fini = n === t;
      let enfants;
      if (m.parties.length === 1) enfants = `<div class="te-spages">${feuilles(m, m.parties[0], s, pages)}${m.exercices ? feuilleEx(m, s) : ''}</div>`;
      else enfants = m.parties.map((p, i) => {
        const pici = ici && s.p === p, id = `te-s${m.n}-${i}`;
        return `<button type="button" class="te-spt${pici ? ' ici' : ''}" aria-expanded="${pici}" aria-controls="${id}">${partieFaite(p, pages) ? '<span class="te-v" aria-label="terminé">✓</span>' : ''}${p.nom}${chev}</button>` +
          `<div class="te-spages" id="${id}"${pici ? '' : ' hidden'}>${feuilles(m, p, s, pages)}</div>`;
      }).join('') + (m.exercices ? `<div class="te-spages">${feuilleEx(m, s)}</div>` : '');
      return `<div class="te-smod${ici ? ' ici' : ''}"><button type="button" class="te-sligne" aria-expanded="${ici}" aria-controls="te-s${m.n}">` +
        `<span class="te-snum${fini ? ' fait' : ''}">${fini ? '✓' : m.n}</span><span class="te-st">${m.titre}</span><span class="te-sn">${n}/${t}</span>${chev}</button>` +
        `<div class="te-senf" id="te-s${m.n}"${ici ? '' : ' hidden'}>${enfants}</div></div>`;
    }).join('');
  }

  /* ---------- Navigation d'une page ---------- */
  function menu(cle) {
    const racine = document.getElementById('app-nav');
    if (!racine) return;
    const html = document.documentElement;
    // accueil de l'application : bandeau avec le lien vers le portail des applications
    if (cle === 'accueil') {
      racine.innerHTML = '<div class="app-topbar"><a class="te-pilule" href="../index.html"><span aria-hidden="true">←</span><span class="te-court">Applications</span><span class="te-long">Toutes les applications</span></a>' +
        '<div class="app-topbar-title"><span class="app-name">Transport de l\'électricité</span></div></div><div class="app-topbar-spacer"></div>';
      return;
    }
    if (!situer(cle)) return;
    const prog = lireProg();
    prog.derniere = cle; ecrireProg(prog);                       // pour « Reprendre » sur l'accueil
    html.classList.add('te-nav');
    const ouvrir = oui => {
      html.classList.toggle('te-som-ouvert', oui);
      const b = racine.querySelector('.te-ou');
      if (b) { b.setAttribute('aria-expanded', oui); b.querySelector('.te-ou-chev').textContent = oui ? '▴' : '▾'; }
    };
    // (re)construit le bandeau et le sommaire ; sur une fiche, la partie dépend de l'ancre
    function rendre() {
      const s = situer(cle), pages = lireProg().pages || {}, ex = lireExercices();
      const multi = s.m.parties && s.m.parties.length > 1;
      const ou = s.onglet === 'exercices' || s.onglet === 'fiche' || !multi ? NOMS_PAGES[s.onglet] : `${s.p.nom} · ${NOMS_PAGES[s.onglet]}`;
      racine.innerHTML =
        `<div class="te-barre"><button type="button" class="te-ou" aria-expanded="false" aria-controls="te-som" aria-label="Sommaire : module ${s.m.n}, ${ou}">` +
        `<span class="te-snum">${s.m.n}</span><span class="te-ou-t"><small>${s.m.titre}</small><b>${ou}</b></span><span class="te-ou-chev" aria-hidden="true">▾</span></button></div>` +
        '<div class="te-barre-esp"></div><div class="te-voile"></div>' +
        `<aside class="te-som" id="te-som" aria-label="Sommaire"><div class="te-som-tete"><a class="te-som-app" href="../index.html">Transport de l'électricité</a>` +
        '<a class="te-pilule" href="../index.html"><span aria-hidden="true">⌂</span>Accueil</a></div>' +
        `<p class="te-som-lab">Sommaire</p><nav class="te-som-arbre" aria-label="Modules">${sommaire(s, pages, ex)}</nav></aside>`;
      // déplier / replier un module ou une partie sur place
      racine.querySelectorAll('.te-sligne, .te-spt').forEach(b => b.addEventListener('click', () => {
        const oui = b.getAttribute('aria-expanded') !== 'true';
        b.setAttribute('aria-expanded', oui);
        document.getElementById(b.getAttribute('aria-controls')).hidden = !oui;
      }));
      racine.querySelector('.te-ou').addEventListener('click', () => ouvrir(!html.classList.contains('te-som-ouvert')));
      racine.querySelector('.te-voile').addEventListener('click', () => ouvrir(false));
      // un lien vers une autre partie de la même fiche ne recharge pas la page : on referme
      racine.querySelectorAll('.te-page').forEach(a => a.addEventListener('click', () => ouvrir(false)));
      // ordinateur : la page en cours visible dans la colonne
      const ici = racine.querySelector('.te-page.ici'), col = racine.querySelector('.te-som');
      if (ici && col.scrollHeight > col.clientHeight) col.scrollTop = ici.offsetTop - col.clientHeight / 2;
    }
    rendre();
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && html.classList.contains('te-som-ouvert')) ouvrir(false); });
    const s = situer(cle);
    if (s.onglet !== 'fiche') return;
    // fiche : la partie choisie est donnée par l'ancre de la page (#vitesse…)
    // (les figures de la fiche se dessinent après le premier défilement : on recale la page sur l'ancre)
    if (location.hash.length > 1) {
      const aller = () => { const e = document.getElementById(location.hash.slice(1)); if (e) e.scrollIntoView(); };
      addEventListener('load', () => { aller(); setTimeout(aller, 250); });
    }
    addEventListener('hashchange', () => { rendre(); ouvrir(false); });
  }

  /* ---------- Accueil : une ligne dépliable par module ---------- */
  function accueil(zone) {
    const prog = lireProg(), pages = prog.pages || {}, ex = lireExercices();
    const derniere = prog.derniere && situer(prog.derniere) ? prog.derniere : null;
    const total = totalModule, fait = m => faitModule(m, pages, ex);
    const ouvert = derniere ? situer(derniere).m.n : (PLAN.find(m => fait(m) < total(m)) || PLAN[0]).n;
    const bt = (cle, txt, cls) => `<a class="te-bt${cls ? ' ' + cls : ''}" href="modules/${cle}.html">${txt}</a>`;
    // bouton d'une page d'une partie : Simulation ✓, Cours ✓, Questions 14/20
    const btPage = (pt, o) => {
      const a = pages[pt[o]] || {}, fini = pageFaite(pt, o, pages);
      const etat = o === 'questions' ? (a.note != null ? ` <span class="te-sc">${fmt(a.note)}/20</span>` : '') : (fini ? ' ✓' : '');
      return bt(pt[o], NOMS_PAGES[o] + etat, (fini ? 'fait ' : '') + (derniere === pt[o] ? 'ici' : ''));
    };
    const module = m => {
      const n = fait(m), t = total(m), termine = n === t, ouv = m.n === ouvert;
      const multi = m.parties.length > 1;
      const btFiche = m.fiche ? bt(m.fiche, multi ? 'Fiche récapitulative' : 'Fiche', derniere === m.fiche ? 'ici' : '') : '';
      const btEx = m.exercices ? bt(m.exercices, m.exNom + ' →', 'noir') : '';
      // module à une seule partie : tout dans la même carte ; sinon une carte par partie, puis la fiche
      const corps = `<div class="te-grille${multi ? ' deux' : ''}">` + m.parties.map(pt =>
        `<div class="te-partie">${multi || m.exercices ? `<span class="te-partie-nom${partieFaite(pt, pages) ? ' ok' : ''}">${pt.nom}</span>` : ''}<div class="te-actions">${pagesPartie(pt).map(o => btPage(pt, o)).join('')}${multi ? '' : btFiche}</div></div>`).join('') +
        `</div>${multi && btFiche ? `<div class="te-actions">${btFiche}</div>` : ''}${btEx ? `<div class="te-actions">${btEx}</div>` : ''}`;
      return `<div class="te-module"><button class="te-ligne" type="button" id="te-b${m.n}" aria-expanded="${ouv}" aria-controls="te-m${m.n}">` +
        `<span class="te-badge${termine ? ' fait' : ''}">${termine ? '✓' : m.n}</span>` +
        `<span class="te-ligne-t">${m.titre}<small>${m.desc}</small></span><span class="te-ligne-n">${n}/${t}</span><span class="te-chev" aria-hidden="true">›</span></button>` +
        `<div class="te-ouvert" id="te-m${m.n}" role="region" aria-labelledby="te-b${m.n}"${ouv ? '' : ' hidden'}>${corps}</div></div>`;
    };
    zone.innerHTML = (derniere ? `<a class="te-reprendre" href="modules/${derniere}.html"><small>Reprendre</small><b>${libelle(derniere)} →</b></a>` : '') +
      `<div class="te-modules">${PLAN.map(module).join('')}</div>`;
    // un seul module déplié à la fois
    const lignes = zone.querySelectorAll('.te-ligne');
    lignes.forEach(b => b.addEventListener('click', () => {
      const ouvrir = b.getAttribute('aria-expanded') !== 'true';
      lignes.forEach(x => { x.setAttribute('aria-expanded', 'false'); document.getElementById(x.getAttribute('aria-controls')).hidden = true; });
      if (ouvrir) {
        b.setAttribute('aria-expanded', 'true');
        document.getElementById(b.getAttribute('aria-controls')).hidden = false;
        setTimeout(() => b.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 30);
      }
    }));
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

  window.TE = Object.assign(window.TE || {}, {
    MOINS, fmt, cs, sci, lire, proche, fr, unite, o, fq, el, secouer, melanger, hasard, entre, champ, PARTIES,
    question, serie, decouverte, aToi, Cours, menu, accueil, PLAN, marquer, confettis,
  });
})();
