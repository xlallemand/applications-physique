/* ============================================================
   Moteur de l'application « Chapitre 2 : Piles et accumulateurs »
   (Terminale STI2D ; même moteur de questions que « Cinématique »
   et « Chapitre 1 : Énergie et puissance » ; navigation commune
   assets/sommaire.js, cours avec assets/cours.js)

   PA2.fmt, PA2.cs, PA2.sci, PA2.lire   écriture et lecture des nombres (virgule)
   PA2.o, PA2.fq.choix, PA2.fq.nombre   fabriques d'options et de parties de question
   PA2.PARTIES                          parties de question :
       'choix'    boutons à choisir
       'nombre'   valeur numérique (avec bouton ±)
       'gabarit'  expression à trous
       'sci'      écriture scientifique a × 10ⁿ
       'schema'   étiquettes à glisser sur un schéma
       'perso'    outil propre : p.monter(zone, api) → { montrer() }
   PA2.question(zone, q, cb, mode)      question en plusieurs parties (série, exercice, cours)
   PA2.serie(opts)                      série de questions notée sur 20
   PA2.fig(dessin)                      figure dessinée à la largeur disponible
   PA2.conv(o), PA2.slot(id)            schéma de conversion d'énergie (HTML)
   PA2.chaine(etapes)                   chaîne de conversion (blocs et flèches nommées)
   PA2.partieTableau(o)                 tableau de proportionnalité à remplir
   PA2.partieAssemblage(o)              assembler des cellules en série et en dérivation
   PA2.batterie(o)                      dessin d'une batterie (étiquette, cellules à compter)
   PA2.TECHNOS, PA2.tableauTechnos()    technologies d'accumulateurs (doc. 2 de l'activité 2)
   PA2.menu(cle), PA2.accueil(zone)     navigation commune (SOM) avec le plan de l'application

   Préfixe pa2 (et non pa, déjà pris par « Puissance active »).
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
    const d = el('div', 'ph-valeur pa2-gab');
    if (p.label) d.appendChild(el('span', 'ph-lab', p.label));
    // chaque case forme un groupe insécable avec le texte qui la suit (et le texte d'ouverture
    // avec la première case) : sur un petit écran, la ligne ne se coupe qu'entre deux groupes
    const champs = [];
    let grp = el('span', 'pa2-gab-grp');
    d.appendChild(grp);
    p.morceaux.forEach(m => {
      if (typeof m === 'string') { grp.appendChild(el('span', 'pa2-gab-txt', m)); return; }
      if (champs.length) { grp = el('span', 'pa2-gab-grp'); d.appendChild(grp); }
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
     p.schema : HTML du schéma, avec des cases PA2.slot(id)
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

    // Outil propre à l'application : p.monter(zone, api) → { montrer() }
  function pPerso(zone, p, api) {
    const ctx = p.monter(zone, api) || {};
    return { montrer() { if (ctx.montrer) ctx.montrer(); } };
  }

  const PARTIES = { choix: pChoix, nombre: pNombre, gabarit: pGabarit, sci: pSci, schema: pSchema, perso: pPerso };

  /* ============================================================
     « AFFICHER TOUT LE COURS »
     Les questions et les « À toi » en cours s'inscrivent ici. Quand
     l'élève demande tout le cours, chacun « se déplie » : toutes ses
     parties sont affichées d'un coup, avec le bouton « Afficher la
     réponse » disponible tout de suite. PA2.tout reste vrai ensuite :
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
      window.PA2.partieEnCours = p;          // partie en cours (utile pour vérifier l'application)
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
    if (mode === 'cours' && window.PA2.tout) inst.deplier();
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
      window.PA2.questionEnCours = q;          // question en cours (utile pour vérifier l'application)
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
     PA2.fig(dessin) renvoie un emplacement HTML ; dès qu'il est dans la
     page, dessin(W) y est appelé avec la largeur disponible W (et de
     nouveau quand la largeur change) : les textes gardent leur taille
     et restent lisibles sur un téléphone. Plusieurs figures par page.
     ============================================================ */
  const DESSINS = new Map();
  let nFig = 0, nMotif = 0;
  function fig(dessin, cls) {
    const k = String(++nFig);
    DESSINS.set(k, dessin);
    return `<div class="pa2-fig${cls ? ' ' + cls : ''}" data-fig="${k}"></div>`;
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
    const l = racine.matches && racine.matches('.pa2-fig[data-fig]') ? [racine] : [];
    racine.querySelectorAll('.pa2-fig[data-fig]').forEach(x => l.push(x));
    l.forEach(x => { const f = DESSINS.get(x.dataset.fig); if (f) monter(x, f); });
  }
  new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(chercher))).observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener('DOMContentLoaded', () => chercher(document.body));

  /* ============================================================
     SCHÉMA DE CONVERSION D'ÉNERGIE (HTML, voir pa2.css)
       apportée ──▶ [ appareil (η) ] ──▶ utile
                           │
                           ▼ perdue
     o = { appareil, eta, grandeur ('Énergie' ou 'Puissance'),
           a, u, p : { f (forme d'énergie), v (valeur) } en HTML : texte, PA2.slot(id) ou PA2.inc() }
     En ligne sur un écran large, à la verticale sur un téléphone.
     ============================================================ */
  const slot = id => `<span class="sc-slot" data-slot="${id}"><span class="sc-slot-ph">?</span></span>`;
  const val = t => `<span class="sc-val">${t}</span>`;
  const inc = () => '<span class="sc-val inconnue">?</span>';
  function conv(o) {
    const gr = o.grandeur || 'Énergie';
    const z = (cle, nom, x) => `<div class="pa2-cv-z pa2-cv-${cle}"><p class="pa2-cv-t">${gr} ${nom}</p>` +
      `${x && x.f ? `<div class="pa2-cv-f">${x.f}</div>` : ''}${x && x.v ? `<div class="pa2-cv-v">${x.v}</div>` : ''}</div>`;
    return `<div class="pa2-cv" role="group" aria-label="Schéma de conversion d'énergie : ${gr.toLowerCase()} apportée, ${o.appareil.replace(/<[^>]+>/g, '')}, ${gr.toLowerCase()} utile et ${gr.toLowerCase()} perdue">
      ${z('a', 'apportée', o.a)}
      <div class="pa2-cv-fl pa2-cv-fa" aria-hidden="true"></div>
      <div class="pa2-cv-ap"><b>${o.appareil}</b>${o.eta ? `<div class="pa2-cv-eta">${o.eta}</div>` : ''}</div>
      <div class="pa2-cv-fl pa2-cv-fu" aria-hidden="true"></div>
      ${z('u', 'utile', o.u)}
      <div class="pa2-cv-fl pa2-cv-fp" aria-hidden="true"></div>
      ${z('p', 'perdue', o.p)}
    </div>`;
  }


  /* ============================================================
     CHAÎNE DE CONVERSION (HTML) : blocs reliés par des flèches nommées
     PA2.chaine(['espèces chimiques', { fl: 'énergie chimique' }, 'pile', { fl: 'énergie électrique' }, 'moteur'])
     Un élément { fl } est une flèche, avec son nom au-dessus (texte ou PA2.slot(id)).
     En ligne sur un écran large, à la verticale sur un téléphone.
     ============================================================ */
  function chaine(etapes, aria) {
    return `<div class="pa2-ch" role="group" aria-label="${aria || 'Chaîne de conversion d\'énergie'}">${etapes.map(e => (typeof e === 'object'
      ? `<div class="pa2-ch-fl"><span class="pa2-ch-nom">${e.fl}</span><span class="pa2-ch-tr" aria-hidden="true"></span></div>`
      : `<div class="pa2-ch-bloc">${e}</div>`)).join('')}</div>`;
  }

  /* ============================================================
     TABLEAU DE PROPORTIONNALITÉ À REMPLIR (partie 'perso')
     Les unités sont en tête de ligne, comme dans les corrections :
         Wh | 130 | ?
         kg |  1  | 0,020
     o = { lignes: [[unité, case, case], [unité, case, case]],
           case : nombre (écrit), '?' (l'inconnue, calculée ensuite)
                  ou { v, tol, rel } (case à remplir par l'élève),
           diag(valeurs) → diagnostic, q, solution }
     ============================================================ */
  function partieTableau(o) {
    const cases = [];
    o.lignes.forEach(l => l.slice(1).forEach(c => { if (c && typeof c === 'object') cases.push(c.v); }));
    return { type: 'perso', cases, q: o.q || 'Complète le tableau de proportionnalité (les unités sont en tête de ligne).', solution: o.solution,
      monter: (zone, api) => tableauProp(zone, o, api) };
  }
  function tableauProp(zone, o, api) {
    const d = el('div', 'pa2-prop');
    const tab = el('table', 'pa2-prop-tab'), champs = [];
    o.lignes.forEach(l => {
      const tr = document.createElement('tr');
      tr.appendChild(el('th', null, l[0]));
      l.slice(1).forEach(c => {
        const td = document.createElement('td');
        if (c === '?') { td.className = 'pa2-prop-inc'; td.textContent = '?'; }
        else if (c && typeof c === 'object') {
          const ch = champ({ petit: true, signe: false, aria: `Case de la ligne ${l[0].replace(/<[^>]+>/g, '')}` });
          ch.m = c; champs.push(ch); td.appendChild(ch.el);
        } else td.textContent = fmt(c);
        tr.appendChild(td);
      });
      tab.appendChild(tr);
    });
    const defile = el('div', 'pa2-defile');
    defile.appendChild(tab);
    d.appendChild(defile);
    zone.appendChild(d);
    const bVal = boutonValider(zone);
    champs.forEach(c => {
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
      if (vals.some(isNaN)) { secouer(d); api.message('Complète toutes les cases du tableau.'); return; }
      const oks = champs.map((c, k) => juste(vals[k], { valeur: c.m.v, tol: c.m.tol, rel: c.m.rel }));
      if (oks.every(Boolean)) { champs.forEach(c => c.desactiver(true)); bVal.fermer(); api.reussi(); return; }
      champs.forEach((c, k) => c.el.classList.toggle('ko', !oks[k]));
      api.erreur((o.diag && o.diag(vals)) || (oks.filter(x => !x).length > 1 ? 'Les cases en rouge sont fausses.' : 'La case en rouge est fausse.') + ' Chaque nombre va dans la ligne de son unité.');
      secouer(d);
    }
    bVal.onclick = valider;
    return { montrer() { champs.forEach(c => { c.input.value = fmt(c.m.v); c.el.classList.remove('ko'); c.desactiver(true); }); bVal.fermer(); } };
  }

  /* ============================================================
     ASSEMBLAGE DE CELLULES (partie 'perso')
     L'élève choisit le nombre de cellules en série dans chaque branche
     et le nombre de branches en dérivation ; la tension, la capacité et
     l'énergie de l'assemblage s'affichent. Il valide quand il obtient la
     tension et la capacité demandées. Plusieurs exemplaires possibles.
     o = { U, Q (une cellule, V et Ah), cible: { U, Q }, s0, d0 (départ), sMax, dMax, q, solution }
     ============================================================ */
  function partieAssemblage(o) {
    return { type: 'perso', assemblage: o, q: o.q || `Assemble des cellules (${fmt(o.U)} V ; ${fmt(o.Q)} Ah) pour obtenir une batterie de <b>${fmt(o.cible.U)} V</b> et <b>${fmt(o.cible.Q)} Ah</b>.`,
      solution: o.solution || `<p>${fmt(o.cible.U / o.U)} cellule${o.cible.U / o.U > 1 ? 's' : ''} en série (${fmt(o.cible.U / o.U)} × ${fmt(o.U)} V = ${fmt(o.cible.U)} V) dans chaque branche, et ${fmt(o.cible.Q / o.Q)} branche${o.cible.Q / o.Q > 1 ? 's' : ''} en dérivation (${fmt(o.cible.Q / o.Q)} × ${fmt(o.Q)} Ah = ${fmt(o.cible.Q)} Ah).</p>`,
      monter: (zone, api) => assemblage(zone, o, api) };
  }
  function assemblage(zone, o, api) {
    const sMax = o.sMax || 6, dMax = o.dMax || 4;
    let s = o.s0 || 1, n = o.d0 || 1, fige = false, largeur = 0;
    const d = el('div', 'pa2-as');
    const reglage = (k, nom) => `<div class="pa2-as-b"><span class="pa2-as-nom">${nom}</span>
      <button type="button" class="pa2-as-pas" data-k="${k}" data-p="-1" aria-label="${nom} : un de moins">−</button>
      <output class="pa2-as-v" data-v="${k}"></output>
      <button type="button" class="pa2-as-pas" data-k="${k}" data-p="1" aria-label="${nom} : un de plus">+</button></div>`;
    d.innerHTML = `<div class="pa2-as-cmd">${reglage('s', 'Cellules en série')}${reglage('d', 'Branches en dérivation')}</div>
      <div class="pa2-as-fig"></div><div class="pa2-as-res" aria-live="polite"></div>`;
    zone.appendChild(d);
    const figZ = d.querySelector('.pa2-as-fig'), res = d.querySelector('.pa2-as-res');
    const bVal = boutonValider(zone);
    function dessiner() {
      const W = Math.round(figZ.clientWidth) || 300;
      largeur = W;
      // dimensions d'une cellule et des branches, à la largeur disponible
      const pas = Math.min(74, (W - 70) / s), cw = pas - 16, ch = 30, hb = 52, x0 = 34, H = n * hb + 22;
      const x1 = x0 + s * pas + 8;
      let t = '';
      for (let b = 0; b < n; b++) {
        const y = 22 + b * hb + ch / 2;
        t += `<line x1="${x0}" y1="${y}" x2="${x1}" y2="${y}" class="pa2-as-fil"/>`;
        for (let k = 0; k < s; k++) {
          const x = x0 + 8 + k * pas;
          t += `<rect x="${x}" y="${y - ch / 2}" width="${cw}" height="${ch}" rx="6" class="pa2-as-cel"/>` +
            `<rect x="${x + cw}" y="${y - 6}" width="4" height="12" rx="1" class="pa2-as-borne"/>` +
            (cw > 40 ? `<text x="${x + cw / 2}" y="${y + 4.5}" text-anchor="middle" class="pa2-as-t">${fmt(o.U)} V</text>` : '');
        }
      }
      // fils de dérivation à gauche et à droite, bornes de la batterie
      const yh = 22 + ch / 2, yb = 22 + (n - 1) * hb + ch / 2;
      t += `<line x1="${x0}" y1="${yh}" x2="${x0}" y2="${yb}" class="pa2-as-fil"/><line x1="${x1}" y1="${yh}" x2="${x1}" y2="${yb}" class="pa2-as-fil"/>`;
      t += `<line x1="${x0}" y1="${(yh + yb) / 2}" x2="10" y2="${(yh + yb) / 2}" class="pa2-as-fil"/><line x1="${x1}" y1="${(yh + yb) / 2}" x2="${x1 + 20}" y2="${(yh + yb) / 2}" class="pa2-as-fil"/>`;
      t += `<text x="8" y="${(yh + yb) / 2 - 8}" class="pa2-as-pol">−</text><text x="${x1 + 12}" y="${(yh + yb) / 2 - 8}" class="pa2-as-pol">+</text>`;
      figZ.innerHTML = `<svg viewBox="0 0 ${Math.max(W, x1 + 30)} ${H}" width="${Math.max(W, x1 + 30)}" height="${H}" role="img" aria-label="${n} branche${n > 1 ? 's' : ''} en dérivation de ${s} cellule${s > 1 ? 's' : ''} en série">${t}</svg>`;
      d.querySelector('[data-v="s"]').textContent = s;
      d.querySelector('[data-v="d"]').textContent = n;
      const U = s * o.U, Q = n * o.Q;
      res.innerHTML = `<span><b>${s * n}</b> cellule${s * n > 1 ? 's' : ''}</span><span>U = ${s} × ${fmt(o.U)} = <b>${fmt(U)} V</b></span>` +
        `<span>Q = ${n} × ${fmt(o.Q)} = <b>${fmt(Q)} Ah</b></span><span>E = U × Q = <b>${fmt(+(U * Q).toPrecision(4))} Wh</b></span>`;
    }
    d.querySelectorAll('.pa2-as-pas').forEach(b => {
      b.onclick = () => {
        if (fige || api.fini()) return;
        const p = +b.dataset.p;
        if (b.dataset.k === 's') s = Math.max(1, Math.min(sMax, s + p)); else n = Math.max(1, Math.min(dMax, n + p));
        api.effacer();
        dessiner();
      };
    });
    if (window.ResizeObserver) new ResizeObserver(() => { if (Math.round(figZ.clientWidth) !== largeur) dessiner(); }).observe(figZ);
    dessiner();
    function figer() { fige = true; d.querySelectorAll('.pa2-as-pas').forEach(b => { b.disabled = true; }); bVal.fermer(); dessiner(); }
    bVal.onclick = () => {
      if (fige || api.fini()) return;
      const okU = proche(s * o.U, o.cible.U, .001), okQ = proche(n * o.Q, o.cible.Q, .001);
      if (okU && okQ) { figer(); api.reussi(); return; }
      let m;
      if (proche(n * o.U, o.cible.U, .001) && proche(s * o.Q, o.cible.Q, .001)) m = 'Tu as inversé : en <b>série</b>, les tensions s\'additionnent ; en <b>dérivation</b>, les capacités s\'additionnent.';
      else if (okU) m = `La tension est bonne. Pour changer la capacité, change le nombre de <b>branches en dérivation</b> : Q = nombre de branches × ${fmt(o.Q)} Ah.`;
      else if (okQ) m = `La capacité est bonne. La tension se règle avec le nombre de cellules <b>en série</b> : U = nombre de cellules × ${fmt(o.U)} V.`;
      else m = `En série, les tensions s'additionnent (U = nombre de cellules en série × ${fmt(o.U)} V) ; en dérivation, les capacités s'additionnent (Q = nombre de branches × ${fmt(o.Q)} Ah).`;
      api.erreur(m);
      secouer(figZ);
    };
    return { montrer() { s = Math.round(o.cible.U / o.U); n = Math.round(o.cible.Q / o.Q); figer(); } };
  }

  /* ============================================================
     DESSINS DE BATTERIES (SVG à la largeur disponible)
     PA2.batterie({ lignes: ['80 Ah · 12 V'], cellules: 0 })   batterie vue de face (voiture)
     PA2.batterie({ lignes: ['Li-ion', '40 V · 40 Ah'], cellules: 11 })
         cellules > 0 : vue de dessus des cellules reliées en série, à compter
     ============================================================ */
  function batterie(o) {
    return fig(W => {
      const n = o.cellules || 0, larg = Math.min(W - 16, n ? 560 : 300), x = (W - larg) / 2;
      let s = '', y = 14;
      if (n) {
        // dessus de la batterie : cellules en série, bornes reliées deux à deux
        const pas = (larg - 24) / n, r = Math.min(13, pas / 2 - 3), hTop = 4 * r + 44;
        s += `<rect x="${x}" y="${y}" width="${larg}" height="${hTop}" rx="10" class="pa2-b-dessus"/>`;
        for (let k = 0; k < n; k++) {
          const cx = x + 12 + pas * (k + .5);
          s += `<rect x="${cx - pas / 2 + 3}" y="${y + 10}" width="${pas - 6}" height="${hTop - 20}" rx="6" class="pa2-b-cel"/>`;
          s += `<circle cx="${cx}" cy="${y + 10 + r + 6}" r="${r * .55}" class="pa2-b-borne"/><circle cx="${cx}" cy="${y + hTop - 10 - r - 6}" r="${r * .55}" class="pa2-b-borne"/>`;
          if (k < n - 1) s += `<path d="M${cx},${y + (k % 2 ? hTop - 10 - r - 6 : 10 + r + 6)} L${cx + pas},${y + (k % 2 ? hTop - 10 - r - 6 : 10 + r + 6)}" class="pa2-b-pont"/>`;
        }
        y += hTop;
      } else {
        // couvercle et deux bornes
        s += `<rect x="${x + larg * .12}" y="${y}" width="${larg * .12}" height="14" rx="3" class="pa2-b-borne"/><rect x="${x + larg * .76}" y="${y}" width="${larg * .12}" height="14" rx="3" class="pa2-b-borne"/>`;
        s += `<text x="${x + larg * .18}" y="${y - 2}" text-anchor="middle" class="pa2-b-pol">−</text><text x="${x + larg * .82}" y="${y - 2}" text-anchor="middle" class="pa2-b-pol">+</text>`;
        y += 14;
        s += `<rect x="${x}" y="${y}" width="${larg}" height="24" rx="6" class="pa2-b-dessus"/>`;
        y += 24;
      }
      const hFace = 30 + o.lignes.length * 22;
      s += `<rect x="${x}" y="${y}" width="${larg}" height="${hFace}" rx="8" class="pa2-b-face"/>`;
      s += `<rect x="${x + larg * .2}" y="${y + 10}" width="${larg * .6}" height="${hFace - 20}" rx="6" class="pa2-b-etiq"/>`;
      o.lignes.forEach((l, i) => { s += `<text x="${x + larg / 2}" y="${y + 33 + i * 22}" text-anchor="middle" class="pa2-b-t">${l}</text>`; });
      const H = y + hFace + 8;
      return `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" class="pa2-batt" role="img" aria-label="${o.aria || 'Batterie : ' + o.lignes.join(', ')}">${s}</svg>`;
    }, 'pa2-fig-batt');
  }

  /* ============================================================
     TECHNOLOGIES D'ACCUMULATEURS (doc. 2 de l'activité 2 p. 37)
     Li-ion : le manuel indique 1 500 - 2 500 Wh·kg⁻¹, valeur fausse d'un
     facteur 10 (coquille) ; on utilise 150 - 250 Wh·kg⁻¹.
     ============================================================ */
  const TECHNOS = [
    { nom: 'Plomb-acide', em: [30, 50], fem: 2.1, cycles: '400 - 1 200', usage: 'voitures thermiques, alimentations électriques de secours' },
    { nom: 'Ni-Cd', em: [45, 80], fem: 1.2, cycles: '2 000', usage: 'usages industriels : très fiable, longue durée de vie (12 à 15 ans) ; cadmium polluant et toxique' },
    { nom: 'Ni-MH', em: [60, 110], fem: 1.2, cycles: '1 500', usage: 'appareils portables, voitures hybrides' },
    { nom: 'Li-ion', em: [150, 250], fem: 3.6, cycles: '500 - 1 000', usage: 'électronique portable, voitures électriques' },
  ];
  const NOTE_LIION = 'Le manuel indique 1 500 - 2 500 Wh·kg<sup>−1</sup> pour le Li-ion : c\'est une coquille (un facteur 10). Les accumulateurs Li-ion stockent en réalité 150 à 250 Wh·kg<sup>−1</sup>.';
  // tableau comparatif (usages : true pour ajouter la colonne des usages)
  function tableauTechnos(usages) {
    return `<div class="ph-defile"><table class="ph-tableau pa2-technos"><tr><th>Type d'accumulateur</th><th>Énergie massique (Wh·kg<sup>−1</sup>)</th><th>f.é.m. (V)</th><th>Nombre de cycles de charge</th>${usages ? '<th>Utilisation</th>' : ''}</tr>
      ${TECHNOS.map(t => `<tr><td><b>${t.nom}</b></td><td>${t.em[0]} - ${t.em[1]}${t.nom === 'Li-ion' ? ' *' : ''}</td><td>${fmt(t.fem)}</td><td>${t.cycles}</td>${usages ? `<td class="pa2-usage">${t.usage}</td>` : ''}</tr>`).join('')}</table></div>
      <p class="pa2-note">* ${NOTE_LIION}</p>`;
  }

  /* ============================================================
     PLAN DE L'APPLICATION ET NAVIGATION (voir assets/sommaire.js)
     ============================================================ */
  const PLAN = [
    { n: 1, titre: 'Pile ou accumulateur', desc: 'Conversion d\'énergie, réversibilité, tension à vide, capacité, technologies', fiche: 'fiche_1',
      parties: [{ nom: 'Pile ou accumulateur', cours: 'module_1_cours', questions: 'module_1_questions' }] },
    { n: 2, titre: 'Capacité et énergie disponible', desc: 'Q = I × Δt, E = U × Q en Wh ou en J', fiche: 'fiche_2',
      parties: [{ nom: 'Capacité et énergie disponible', cours: 'module_2_cours', questions: 'module_2_questions' }] },
    { n: 3, titre: 'Énergies massique et volumique', desc: 'E<sub>m</sub> = E / m, E<sub>V</sub> = E / V, tableau de proportionnalité', fiche: 'fiche_3',
      parties: [{ nom: 'Énergies massique et volumique', cours: 'module_3_cours', questions: 'module_3_questions' }] },
    { n: 4, titre: 'Branchements', desc: 'En série les tensions s\'additionnent, en dérivation les capacités', fiche: 'fiche_4',
      parties: [{ nom: 'Branchements', cours: 'module_4_cours', questions: 'module_4_questions' }] },
    { n: 5, titre: 'Exercices du manuel', desc: 'Exercices 7, 10, 11 et 14 (p. 40-41) et activité 2 (p. 37)', exercices: 'module_5', exNom: 'Exercices 7 à 14 et activité 2', nbEx: 5 },
  ];
  window.SOM.init({ nom: 'Chapitre 2 : Piles et accumulateurs', id: 'piles-accumulateurs', cleEx: 'piles-accumulateurs-exercices', plan: PLAN });
  const menu = cle => window.SOM.menu(cle);
  const accueil = zone => window.SOM.accueil(zone);
  const marquer = info => window.SOM.marquer(info);

  window.PA2 = Object.assign(window.PA2 || {}, {
    MOINS, fmt, cs, sci, lire, proche, fr, unite, o, fq, el, secouer, melanger, hasard, entre, champ, PARTIES,
    question, serie, confettis, fig, monter, slot, val, inc, conv, chaine, partieTableau, partieAssemblage, batterie, TECHNOS, NOTE_LIION, tableauTechnos,
    PLAN, menu, accueil, marquer,
  });
})();
