/* ============================================================
   Moteur de l'application « Chapitre 6 : Principe fondamental de la
   dynamique » (Terminale STI2D ; même moteur de questions que
   « Cinématique » et « Chapitre 2 : Piles et accumulateurs » ;
   navigation commune assets/sommaire.js, cours avec assets/cours.js)

   PFD.fmt, PFD.cs, PFD.sci, PFD.lire   écriture et lecture des nombres (virgule)
   PFD.o, PFD.fq.choix, PFD.fq.nombre   fabriques d'options et de parties de question
   PFD.PARTIES                          parties de question : 'choix', 'nombre', 'gabarit',
                                        'sci', 'schema', 'perso' (p.monter(zone, api) → { montrer() })
   PFD.question(zone, q, cb, mode)      question en plusieurs parties (série, exercice, cours)
   PFD.serie(opts)                      série de questions notée sur 20
   PFD.outil(monter)                    outil interactif placé dans du HTML
   PFD.V(n, s), PFD.nomV(clé)           noms de vecteurs (flèche au-dessus) : <span class="vec-nom">P</span>, <span class="vec-nom">R</span>ₙ, <span class="vec-nom">f</span>, <span class="vec-nom">T</span>…
   PFD.scene(s, o), PFD.sceneRemplie(s) dessin d'une situation (SVG), avec ses forces
   PFD.bilan(s)                         bilan des forces en quatre étapes (situations : modules/situations.js)
   PFD.chrono(o)                        chronophotographie animée (uniforme, accéléré, décéléré)
   PFD.partieResultante(o), PFD.partieAcc(o)
                                        tracer Σ <span class="vec-nom">F</span> puis <span class="vec-nom">a</span> dans un quadrillage
                                        (repère de cinematique/modules/vecteurs.js, à charger avant)
   PFD.menu(cle), PFD.accueil(zone)     navigation commune (SOM) avec le plan de l'application

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
    const d = el('div', 'ph-valeur pfd-gab');
    if (p.label) d.appendChild(el('span', 'ph-lab', p.label));
    // chaque case forme un groupe insécable avec le texte qui la suit (et le texte d'ouverture
    // avec la première case) : sur un petit écran, la ligne ne se coupe qu'entre deux groupes
    const champs = [];
    let grp = el('span', 'pfd-gab-grp');
    d.appendChild(grp);
    p.morceaux.forEach(m => {
      if (typeof m === 'string') { grp.appendChild(el('span', 'pfd-gab-txt', m)); return; }
      if (champs.length) { grp = el('span', 'pfd-gab-grp'); d.appendChild(grp); }
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
     p.schema : HTML du schéma, avec des cases PFD.slot(id)
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
     réponse » disponible tout de suite. PFD.tout reste vrai ensuite :
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
      window.PFD.partieEnCours = p;          // partie en cours (utile pour vérifier l'application)
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
    if (mode === 'cours' && window.PFD.tout) inst.deplier();
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
      window.PFD.questionEnCours = q;          // question en cours (utile pour vérifier l'application)
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
     PFD.fig(dessin) renvoie un emplacement HTML ; dès qu'il est dans la
     page, dessin(W) y est appelé avec la largeur disponible W (et de
     nouveau quand la largeur change) : les textes gardent leur taille
     et restent lisibles sur un téléphone. Plusieurs figures par page.
     ============================================================ */
  const DESSINS = new Map();
  let nFig = 0, nMotif = 0;
  function fig(dessin, cls) {
    const k = String(++nFig);
    DESSINS.set(k, dessin);
    return `<div class="pfd-fig${cls ? ' ' + cls : ''}" data-fig="${k}"></div>`;
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
    const l = racine.matches && racine.matches('.pfd-fig[data-fig]') ? [racine] : [];
    racine.querySelectorAll('.pfd-fig[data-fig]').forEach(x => l.push(x));
    l.forEach(x => { const f = DESSINS.get(x.dataset.fig); if (f) monter(x, f); });
  }
  new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(chercher))).observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener('DOMContentLoaded', () => chercher(document.body));

  /* ============================================================
     OUTILS INTERACTIFS PLACÉS DANS DU HTML
     PFD.outil(monter) renvoie un emplacement HTML ; dès qu'il est dans la
     page, monter(div) y construit l'outil, une seule fois.
     ============================================================ */
  const OUTILS = new Map();
  let nOutil = 0;
  function outil(f) {
    const k = String(++nOutil);
    OUTILS.set(k, f);
    return `<div class="pfd-outil" data-outil="${k}"></div>`;
  }
  function chercherOutils(racine) {
    if (!racine || !racine.querySelectorAll) return;
    const l = racine.matches && racine.matches('.pfd-outil[data-outil]') ? [racine] : [];
    racine.querySelectorAll('.pfd-outil[data-outil]').forEach(x => l.push(x));
    l.forEach(x => {
      if (x.dataset.monte) return;
      const f = OUTILS.get(x.dataset.outil);
      if (f) { x.dataset.monte = '1'; f(x); }
    });
  }
  new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(chercherOutils))).observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener('DOMContentLoaded', () => chercherOutils(document.body));
  const cap = t => t.charAt(0).toUpperCase() + t.slice(1);

  /* ============================================================
     NOMS DES VECTEURS FORCES (HTML et SVG)
     ============================================================ */
  const V = (n, s) => `<span class="vec-nom">${n}</span>${s ? `<sub>${s}</sub>` : ''}`;
  const NOMS = { P: ['P'], RN: ['R', 'N'], R: ['R'], f: ['f'], T: ['T'], FA: ['F', 'A'], Fm: ['F', 'm'], Fmag: ['F', 'mag'], Felec: ['F', 'élec'], Fpied: ['F', 'pied'], F: ['F'] };
  const nomV = k => V(...NOMS[k]);
  // ce que désigne chaque nom (diagnostic d'un nom mal choisi)
  const SENS_NOM = {
    P: `${nomV('P')} est le <b>poids</b> : la force exercée par la Terre.`,
    RN: `${nomV('RN')} est la <b>réaction normale</b> du support, perpendiculaire au support (N comme normale).`,
    R: `${nomV('R')} est la <b>réaction</b> du support (<span class="vec-nom">R</span> = <span class="vec-nom">R</span><sub>N</sub> + <span class="vec-nom">f</span>).`,
    f: `${nomV('f')} désigne les <b>frottements</b>.`,
    T: `${nomV('T')} est la <b>tension</b> d'un fil, d'un ressort ou d'une corde.`,
    FA: `${nomV('FA')} est la <b>poussée d'Archimède</b> exercée par un fluide, verticale vers le haut.`,
    Fm: `${nomV('Fm')} est la <b>force motrice</b>.`,
    Fmag: `${nomV('Fmag')} est la force <b>magnétique</b> exercée par un aimant.`,
    Felec: `${nomV('Felec')} est la force <b>électrique</b> exercée par un objet chargé.`,
    Fpied: `${nomV('Fpied')} est la force exercée par le <b>pied</b>.`,
    F: `${nomV('F')} est une force quelconque (ici, celle de la corde).`,
  };
  // nom en SVG (lettre, indice, petite flèche au-dessus) ; x : centre, y : ligne de base
  function nomSVG(k, x, y, cls) {
    const [p, s] = NOMS[k];
    const wp = p.length * 9.5, ws = s ? s.length * 6.6 : 0, x0 = x - (wp + ws) / 2;
    const ya = y - 15, x2 = x0 + Math.max(wp, 9) + 1;
    return `<g class="pfd-nom${cls ? ' ' + cls : ''}"><text x="${x0.toFixed(1)}" y="${y.toFixed(1)}">${p}${s ? `<tspan dy="4" font-size="10.5">${s}</tspan>` : ''}</text>` +
      `<path d="M${(x0 + 1).toFixed(1)},${ya.toFixed(1)} H${x2.toFixed(1)} M${(x2 - 3).toFixed(1)},${(ya - 2.6).toFixed(1)} L${x2.toFixed(1)},${ya.toFixed(1)} L${(x2 - 3).toFixed(1)},${(ya + 2.6).toFixed(1)}"/></g>`;
  }

  /* ============================================================
     DIRECTIONS (angles en degrés, 0 = vers la droite, 90 = vers le haut)
     ============================================================ */
  const DIRS8 = [[135, '↖'], [90, '↑'], [45, '↗'], [180, '←'], null, [0, '→'], [225, '↙'], [270, '↓'], [315, '↘']];
  const DIR_TXT = { 0: 'horizontale, vers la droite', 45: 'oblique, vers le haut et la droite', 90: 'verticale, vers le haut', 135: 'oblique, vers le haut et la gauche',
    180: 'horizontale, vers la gauche', 225: 'oblique, vers le bas et la gauche', 270: 'verticale, vers le bas', 315: 'oblique, vers le bas et la droite' };
  const ecartAngle = (a, b) => Math.abs((((a - b) % 360) + 540) % 360 - 180);
  function texteDir(s, ang) {
    const sp = (s.speciales || []).find(x => ecartAngle(x.ang, ang) < 2);
    if (sp) return sp.label;
    return DIR_TXT[((Math.round(ang / 45) * 45) % 360 + 360) % 360];
  }

  /* ============================================================
     SCÈNE D'UNE SITUATION (SVG, repère 360 × 256 ; dessins entre y = 0 et 240,
     la marge du bas garde lisibles les noms des forces dirigées vers le bas)
     s = { dessin (SVG), points: { G: [x, y], A: […] }, nomsPts, titre, lf (longueur des flèches) }
     o = { forces: [{ pt, ang, nom, num, etat ('ok', 'ko', 'actif') }], points (cliquables), actif (point choisi) }
     ============================================================ */
  const LF = 58, HS = 256;                        // longueur des flèches (sans souci d'échelle), hauteur du dessin
  function fleche(x, y, ang, cls, dec, lf) {
    const r = ang * Math.PI / 180, c = Math.cos(r), s = -Math.sin(r), L = lf || LF;
    const x1 = x - s * dec, y1 = y + c * dec, x2 = x1 + L * c, y2 = y1 + L * s, bx = x2 - 11 * c, by = y2 - 11 * s;
    const f = v => v.toFixed(1);
    return { svg: `<g class="pfd-f${cls ? ' ' + cls : ''}"><line x1="${f(x1)}" y1="${f(y1)}" x2="${f(bx)}" y2="${f(by)}"/><path d="M${f(x2)},${f(y2)} L${f(bx - 5.5 * s)},${f(by + 5.5 * c)} L${f(bx + 5.5 * s)},${f(by - 5.5 * c)} Z"/></g>`, x2, y2, c, s };
  }
  function scene(s, o) {
    o = o || {};
    const fs = o.forces || [];
    let g = s.dessin;
    fs.forEach((f, i) => {
      if (!f || f.pt == null || f.ang == null) return;
      // deux flèches identiques (même point, même direction) sont écartées l'une de l'autre
      const avant = fs.slice(0, i).filter(x => x && x.pt === f.pt && x.ang != null && ecartAngle(x.ang, f.ang) < 2).length;
      const meme = fs.filter(x => x && x.pt === f.pt && x.ang != null && ecartAngle(x.ang, f.ang) < 2).length;
      const dec = meme > 1 ? (avant - (meme - 1) / 2) * 12 : 0;
      const p = s.points[f.pt], a = fleche(p[0], p[1], f.ang, f.etat, dec, s.lf);
      g += a.svg;
      const lx = a.x2 + a.c * 15 - a.s * 9, ly = a.y2 + a.s * 15 + a.c * 9;
      if (f.nom) g += nomSVG(f.nom, lx, ly + 6, f.etat);
      else if (f.num) g += `<g class="pfd-num${f.etat ? ' ' + f.etat : ''}"><circle cx="${lx.toFixed(1)}" cy="${ly.toFixed(1)}" r="8.5"/><text x="${lx.toFixed(1)}" y="${(ly + 4).toFixed(1)}" text-anchor="middle">${f.num}</text></g>`;
    });
    Object.keys(s.points).forEach(id => {
      const [x, y] = s.points[id];
      if (!o.points && !(o.marques || []).includes(id)) return;
      g += `<circle cx="${x}" cy="${y}" r="4.5" class="pfd-pt-m${o.actif === id ? ' actif' : ''}"/><text x="${x + 8}" y="${y - 7}" class="pfd-pt-t">${id}</text>`;
      if (o.points) g += `<circle cx="${x}" cy="${y}" r="20" class="pfd-poignee" data-pt="${id}"/>`;
    });
    return `<svg viewBox="0 0 360 ${HS}" class="pfd-sc" role="img" aria-label="${o.aria || s.titre}">${g}</svg>`;
  }

  /* ============================================================
     BILAN DES FORCES : une situation en quatre étapes (+ compensation)
     PFD.bilan(s) → { enonce, parties } : question pour PFD.question ou COURS
       1. qui agit sur le système ? (acteurs à sélectionner, distracteurs)
       2. à distance ou de contact ?
       3. tracé : point de départ (centre G ou point de contact), direction et sens
          (8 directions, + directions propres : perpendiculaire au support, le long du fil…)
       4. nom de chaque vecteur
       5. les forces se compensent-elles ? (si s.comp)
     Toutes les parties partagent l'état de la situation (plusieurs exemplaires possibles).
     Format d'une situation : voir modules/situations.js.
     ============================================================ */
  const MANQUE = 'Il manque un acteur : cherche d\'abord les actions à distance (la Terre attire toujours le système), puis <b>chaque objet qui touche</b> le système.';
  function partieActeurs(s) {
    return { type: 'perso', q: `1. Qui agit sur le système (${s.systeme}) ? Sélectionne <b>tous</b> les acteurs, puis valide.`,
      solution: `<p>${s.acteurs.map(a => `${cap(a.nom)} : ${a.pourquoi}`).join(' ; ')}.</p>`,
      monter(zone, api) {
        const cands = melanger(s.acteurs.concat(s.distracteurs || []));
        const d = el('div', 'pfd-acts');
        d.innerHTML = cands.map(a => `<button type="button" class="pfd-act" data-id="${a.id}" aria-pressed="false">${cap(a.nom)}</button>`).join('');
        zone.appendChild(d);
        const bVal = boutonValider(zone);
        let fige = false;
        d.querySelectorAll('.pfd-act').forEach(b => {
          b.onclick = () => {
            if (fige || api.fini()) return;
            b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
            b.classList.remove('ko');
            api.effacer();
          };
        });
        function figer() {
          fige = true;
          d.querySelectorAll('.pfd-act').forEach(b => {
            const bon = s.acteurs.some(a => a.id === b.dataset.id);
            b.disabled = true; b.classList.remove('ko'); b.classList.toggle('ok', bon); b.setAttribute('aria-pressed', bon ? 'true' : 'false');
          });
          bVal.fermer();
        }
        bVal.onclick = () => {
          if (fige || api.fini()) return;
          const c = new Set(Array.from(d.querySelectorAll('.pfd-act[aria-pressed="true"]')).map(b => b.dataset.id));
          if (!c.size) { secouer(d); api.message('Touche les acteurs qui agissent sur le système, puis valide.'); return; }
          const intrus = (s.distracteurs || []).filter(x => c.has(x.id)), manque = s.acteurs.filter(a => !c.has(a.id));
          if (!intrus.length && !manque.length) { figer(); api.reussi(); return; }
          intrus.forEach(x => d.querySelector(`[data-id="${x.id}"]`).classList.add('ko'));
          api.erreur('<br>' + intrus.map(x => '☛ ' + x.diag).concat(manque.length ? ['☛ ' + (manque[0].manque || MANQUE)] : []).join('<br>'));
          secouer(d);
        };
        return { montrer: figer };
      } };
  }
  const typeDe = (s, a) => s.forces.find(f => f.acteur === a.id).type;
  function partieTypes(s) {
    return { type: 'perso', q: '2. Chaque acteur agit-il <b>à distance</b> ou <b>par contact</b> ?',
      solution: `<p>${s.acteurs.map(a => `${cap(a.nom)} : ${typeDe(s, a) === 'distance' ? 'à distance' : 'contact'}`).join(' ; ')}.</p>`,
      monter(zone, api) {
        const d = el('div', 'pfd-types');
        d.innerHTML = s.acteurs.map(a => `<div class="pfd-type" data-id="${a.id}"><span class="pfd-type-nom">${cap(a.nom)}</span>
          <span class="pfd-type-b" role="group" aria-label="${cap(a.nom)}"><button type="button" data-v="distance" aria-pressed="false">à distance</button><button type="button" data-v="contact" aria-pressed="false">de contact</button></span></div>`).join('');
        zone.appendChild(d);
        const bVal = boutonValider(zone);
        let fige = false;
        d.querySelectorAll('.pfd-type-b button').forEach(b => {
          b.onclick = () => {
            if (fige || api.fini()) return;
            b.parentElement.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x === b ? 'true' : 'false'));
            b.closest('.pfd-type').classList.remove('ko');
            api.effacer();
          };
        });
        function figer() {
          fige = true;
          d.querySelectorAll('.pfd-type').forEach(r => {
            const a = s.acteurs.find(x => x.id === r.dataset.id);
            r.classList.remove('ko'); r.classList.add('ok');
            r.querySelectorAll('button').forEach(b => { b.disabled = true; b.setAttribute('aria-pressed', b.dataset.v === typeDe(s, a) ? 'true' : 'false'); });
          });
          bVal.fermer();
        }
        bVal.onclick = () => {
          if (fige || api.fini()) return;
          const rangs = Array.from(d.querySelectorAll('.pfd-type'));
          if (rangs.some(r => !r.querySelector('[aria-pressed="true"]'))) { secouer(d); api.message('Choisis « à distance » ou « de contact » pour chaque acteur.'); return; }
          const faux = rangs.filter(r => r.querySelector('[aria-pressed="true"]').dataset.v !== typeDe(s, s.acteurs.find(x => x.id === r.dataset.id)));
          if (!faux.length) { figer(); api.reussi(); return; }
          faux.forEach(r => r.classList.add('ko'));
          api.erreur('<br>' + faux.map(r => {
            const a = s.acteurs.find(x => x.id === r.dataset.id);
            return '☛ ' + (typeDe(s, a) === 'distance' ? `${cap(a.nom)} agit <b>sans toucher</b> ${s.systeme} : c'est une action à distance.` : `${cap(a.nom)} <b>touche</b> ${s.systeme} : c'est une action de contact.`);
          }).join('<br>'));
          secouer(d);
        };
        return { montrer: figer };
      } };
  }
  // diagnostics du tracé
  function diagPt(f) {
    return f.type === 'distance' ? 'une force à distance part du <b>centre</b> du système, le point G.' : (f.diagPt || `une force de contact part du <b>point de contact</b> (${f.pts.join(' ou ')}).`);
  }
  function diagDir(f, ang) {
    return (ecartAngle(f.angs[0], ang) > 176 ? 'la direction est bonne, mais le <b>sens</b> est inversé. ' : '') + f.diagDir;
  }
  function partieTrace(s, st) {
    const lieu = p => (p === 'G' ? 'le centre G' : 'le point ' + p);
    return { type: 'perso', q: '3. Trace chaque force : choisis son <b>point de départ</b>, puis sa <b>direction</b> et son <b>sens</b> (sans souci d\'échelle).',
      solution: `<p>${s.forces.map((f, i) => `${i + 1}. ${cap(f.lib)} : depuis ${lieu(f.pts[0])}${f.pts.length > 1 ? ` (ou ${f.pts.slice(1).map(lieu).join(', ')})` : ''}, ${texteDir(s, f.angs[0])}`).join(' ;<br>')}.</p>`,
      monter(zone, api) {
        const pos = st.pos;
        let sel = 0, fige = false, drag = null;
        const d = el('div', 'pfd-tr');
        d.innerHTML = `<div class="vec-chips pfd-tr-chips" role="group" aria-label="Force à tracer">${s.forces.map((f, i) => `<button type="button" class="vec-chip" data-i="${i}">${i + 1}. ${cap(f.lib)}</button>`).join('')}</div>
          <div class="pfd-sc-cadre pfd-tr-fig"></div>
          <p class="pfd-tr-etape" aria-live="polite"></p>
          <div class="pfd-tr-pts" role="group" aria-label="Point de départ">${Object.keys(s.points).map(id => `<button type="button" class="pfd-pt" data-pt="${id}" aria-pressed="false"><b>${id}</b> ${s.nomsPts[id]}</button>`).join('')}</div>
          <div class="pfd-tr-dirs"><div class="pfd-pad" role="group" aria-label="Direction et sens">${DIRS8.map(x => (x ? `<button type="button" data-a="${x[0]}" aria-label="${DIR_TXT[x[0]]}" title="${DIR_TXT[x[0]]}">${x[1]}</button>` : '<span aria-hidden="true"></span>')).join('')}</div>
          ${(s.speciales || []).length ? `<div class="pfd-spec">${s.speciales.map(x => `<button type="button" data-a="${x.ang}">${x.label}</button>`).join('')}</div>` : ''}</div>`;
        zone.appendChild(d);
        const figZ = d.querySelector('.pfd-tr-fig'), etape = d.querySelector('.pfd-tr-etape');
        const bVal = boutonValider(zone);
        const verrou = i => fige || pos[i].ok;
        function dessiner() {
          figZ.innerHTML = scene(s, { forces: pos.map((p, i) => ({ pt: p.pt, ang: p.ang, num: i + 1, etat: p.etat || (i === sel && !fige ? 'actif' : '') })),
            points: !fige, actif: pos[sel] && pos[sel].pt, aria: `${s.titre} : forces tracées` });
          d.querySelectorAll('.pfd-tr-chips .vec-chip').forEach(c => {
            const i = +c.dataset.i, p = pos[i];
            c.classList.toggle('actif', i === sel && !fige); c.classList.toggle('place', p.pt != null && p.ang != null);
            c.classList.toggle('ok', p.etat === 'ok'); c.classList.toggle('ko', p.etat === 'ko'); c.setAttribute('aria-pressed', i === sel ? 'true' : 'false');
          });
          d.querySelectorAll('.pfd-pt').forEach(b => { b.setAttribute('aria-pressed', pos[sel].pt === b.dataset.pt ? 'true' : 'false'); b.disabled = verrou(sel); });
          d.querySelectorAll('.pfd-tr-dirs button').forEach(b => { b.disabled = verrou(sel); b.classList.toggle('choisi', pos[sel].ang != null && ecartAngle(+b.dataset.a, pos[sel].ang) < 1); });
          etape.innerHTML = fige ? '' : pos[sel].ok ? `La force ${sel + 1} est juste. Choisis une autre force au-dessus du dessin.`
            : pos[sel].pt == null ? `<b>Force ${sel + 1}</b> : touche son point de départ, sur le dessin ou ci-dessous.`
            : `<b>Force ${sel + 1}</b> : choisis sa direction et son sens avec les flèches (ou fais glisser depuis le point).`;
        }
        const suivante = () => { const k = pos.findIndex((p, i) => i > sel && (p.pt == null || p.ang == null)); if (k >= 0) sel = k; };
        d.querySelectorAll('.pfd-tr-chips .vec-chip').forEach(c => { c.onclick = () => { if (fige) return; sel = +c.dataset.i; dessiner(); }; });
        function poserPoint(id) {
          if (verrou(sel) || api.fini()) return;
          pos[sel].pt = id; pos[sel].etat = '';
          api.effacer(); dessiner();
        }
        d.querySelectorAll('.pfd-pt').forEach(b => { b.onclick = () => poserPoint(b.dataset.pt); });
        d.querySelectorAll('.pfd-tr-dirs button').forEach(b => {
          b.onclick = () => {
            if (verrou(sel) || api.fini()) return;
            if (pos[sel].pt == null) { etape.innerHTML = `Choisis d'abord le <b>point de départ</b> de la force ${sel + 1}.`; secouer(d.querySelector('.pfd-tr-pts')); return; }
            pos[sel].ang = +b.dataset.a; pos[sel].etat = '';
            api.effacer(); suivante(); dessiner();
          };
        });
        // glisser depuis un point : la pointe suit le doigt (ou la souris), aimantée sur les directions proposées
        const angles = DIRS8.filter(Boolean).map(x => x[0]).concat((s.speciales || []).map(x => x.ang));
        const coord = e => { const r = figZ.querySelector('svg').getBoundingClientRect(); return [(e.clientX - r.left) * 360 / r.width, (e.clientY - r.top) * HS / r.height]; };
        figZ.addEventListener('touchstart', e => { if (e.target.closest && e.target.closest('.pfd-poignee')) e.preventDefault(); }, { passive: false });
        figZ.addEventListener('pointerdown', e => {
          const h = e.target.closest && e.target.closest('.pfd-poignee');
          if (!h || drag || verrou(sel) || api.fini()) return;
          e.preventDefault();
          poserPoint(h.dataset.pt);
          drag = { id: e.pointerId, bouge: false };
          try { figZ.setPointerCapture(e.pointerId); } catch (_) { /* rien */ }
        });
        figZ.addEventListener('pointermove', e => {
          if (!drag || e.pointerId !== drag.id) return;
          const [x, y] = coord(e), [px, py] = s.points[pos[sel].pt];
          if (Math.hypot(x - px, y - py) < 16) return;
          const brut = Math.atan2(py - y, x - px) * 180 / Math.PI;
          const a = angles.reduce((m, v) => (ecartAngle(v, brut) < ecartAngle(m, brut) ? v : m), angles[0]);
          if (pos[sel].ang == null || ecartAngle(pos[sel].ang, a) > .5) { pos[sel].ang = a; pos[sel].etat = ''; drag.bouge = true; api.effacer(); dessiner(); }
        });
        const finDrag = e => {
          if (!drag || e.pointerId !== drag.id) return;
          const bouge = drag.bouge;
          drag = null;
          if (bouge) { suivante(); dessiner(); }
        };
        ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(t => figZ.addEventListener(t, finDrag));
        dessiner();
        bVal.onclick = () => {
          if (fige || api.fini()) return;
          const manque = pos.findIndex(p => p.pt == null || p.ang == null);
          if (manque >= 0) { sel = manque; dessiner(); secouer(figZ); api.message(`Trace d'abord la force ${manque + 1} : ${s.forces[manque].lib}.`); return; }
          const msgs = [];
          s.forces.forEach((f, i) => {
            const p = pos[i];
            if (p.ok) return;
            const okPt = f.pts.indexOf(p.pt) !== -1, okAng = f.angs.some(a => ecartAngle(a, p.ang) < 3);
            if (okPt && okAng) { p.ok = true; p.etat = 'ok'; return; }
            p.etat = 'ko';
            msgs.push(`☛ <b>Force ${i + 1}</b> (${f.lib}) : ${!okPt ? diagPt(f) : diagDir(f, p.ang)}`);
          });
          if (!msgs.length) { fige = true; dessiner(); bVal.fermer(); api.reussi(); return; }
          sel = pos.findIndex(p => !p.ok);
          dessiner();
          api.erreur('<br>' + msgs.join('<br>'));
          secouer(figZ);
        };
        return { montrer() { s.forces.forEach((f, i) => Object.assign(pos[i], { pt: f.pts[0], ang: f.angs[0], ok: true, etat: 'ok' })); fige = true; dessiner(); bVal.fermer(); } };
      } };
  }
  function partieNoms(s, st) {
    const cands = s.nomsProposes;
    return { type: 'perso', q: '4. Donne le <b>nom</b> de chaque vecteur force.',
      solution: `<p>${s.forces.map((f, i) => `${i + 1}. ${cap(f.lib)} : ${nomV(f.noms[0])}`).join(' ; ')}.</p>`,
      monter(zone, api) {
        const d = el('div', 'pfd-noms');
        d.innerHTML = `<div class="pfd-sc-cadre pfd-noms-fig"></div>` + s.forces.map((f, i) => `<div class="pfd-nom-l" data-i="${i}"><span class="pfd-nom-lib">${i + 1}. ${cap(f.lib)}</span>
          <span class="pfd-nom-ch" role="group" aria-label="Nom de la force ${i + 1}">${cands.map(k => `<button type="button" data-k="${k}" aria-pressed="false">${nomV(k)}</button>`).join('')}</span></div>`).join('');
        zone.appendChild(d);
        const figZ = d.querySelector('.pfd-noms-fig');
        const bVal = boutonValider(zone);
        let fige = false;
        const dessiner = () => {
          figZ.innerHTML = scene(s, { forces: s.forces.map((f, i) => ({ pt: st.pos[i].pt || f.pts[0], ang: st.pos[i].ang == null ? f.angs[0] : st.pos[i].ang, num: i + 1, nom: st.noms[i], etat: st.noms[i] ? 'ok' : '' })),
            marques: Object.keys(s.points), aria: `${s.titre} : forces à nommer` });
        };
        d.querySelectorAll('.pfd-nom-ch button').forEach(b => {
          b.onclick = () => {
            if (fige || api.fini()) return;
            b.parentElement.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x === b ? 'true' : 'false'));
            b.closest('.pfd-nom-l').classList.remove('ko');
            api.effacer();
          };
        });
        function figer() {
          fige = true;
          d.querySelectorAll('.pfd-nom-l').forEach(r => {
            const i = +r.dataset.i, f = s.forces[i];
            st.noms[i] = f.noms[0];
            r.classList.remove('ko'); r.classList.add('ok');
            r.querySelectorAll('button').forEach(b => { b.disabled = true; b.setAttribute('aria-pressed', b.dataset.k === f.noms[0] ? 'true' : 'false'); });
          });
          dessiner(); bVal.fermer();
        }
        bVal.onclick = () => {
          if (fige || api.fini()) return;
          const rangs = Array.from(d.querySelectorAll('.pfd-nom-l'));
          if (rangs.some(r => !r.querySelector('[aria-pressed="true"]'))) { secouer(d); api.message('Choisis un nom pour chaque force.'); return; }
          const faux = rangs.filter(r => s.forces[+r.dataset.i].noms.indexOf(r.querySelector('[aria-pressed="true"]').dataset.k) === -1);
          if (!faux.length) {
            // les noms choisis restent affichés (<span class="vec-nom">R</span> accepté pour <span class="vec-nom">R</span>ₙ sans frottement…)
            rangs.forEach(r => { st.noms[+r.dataset.i] = r.querySelector('[aria-pressed="true"]').dataset.k; });
            fige = true;
            rangs.forEach(r => { r.classList.add('ok'); r.querySelectorAll('button').forEach(b => { b.disabled = true; }); });
            dessiner(); bVal.fermer(); api.reussi(); return;
          }
          faux.forEach(r => r.classList.add('ko'));
          api.erreur('<br>' + faux.map(r => {
            const f = s.forces[+r.dataset.i], k = r.querySelector('[aria-pressed="true"]').dataset.k;
            return `☛ <b>Force ${+r.dataset.i + 1}</b> : ${SENS_NOM[k]} ${f.indNom || ''}`;
          }).join('<br>'));
          secouer(d);
        };
        dessiner();
        return { montrer: figer };
      } };
  }
  function partieComp(s) {
    const autre = s.comp.bonne === 'oui' ? 'non' : 'oui';
    return { type: 'choix', q: `5. ${s.comp.q || 'Ces forces se compensent-elles ?'}`, melanger: false, colonne: true,
      options: [{ id: 'oui', label: 'oui : leur somme est nulle' }, { id: 'non', label: 'non : leur somme n\'est pas nulle' }], bonne: s.comp.bonne,
      indices: { [autre]: s.comp.indice }, solution: `<p>${s.comp.expl}</p>` };
  }
  function bilan(s) {
    const st = { pos: s.forces.map(() => ({ pt: null, ang: null, etat: '', ok: false })), noms: s.forces.map(() => null) };
    const parties = [partieActeurs(s), partieTypes(s), partieTrace(s, st), partieNoms(s, st)];
    if (s.comp) parties.push(partieComp(s));
    return { enonce: `${s.enonce ? `<p>${s.enonce}</p>` : ''}<div class="pfd-sc-cadre">${scene(s, { aria: s.titre })}</div>`, parties };
  }
  // scène avec toutes ses forces tracées et nommées (exemples, fiches, corrections)
  const sceneRemplie = (s, o) => scene(s, Object.assign({ forces: s.forces.map(f => ({ pt: f.pts[0], ang: f.angs[0], nom: f.noms[0] })), marques: Object.keys(s.points), aria: `${s.titre} : bilan des forces` }, o));

  /* ============================================================
     CHRONOPHOTOGRAPHIE (SVG) : positions successives d'un mobile à
     intervalles de temps égaux, de gauche à droite. Animée (un point
     après l'autre, « ↺ Rejouer ») sauf o.anim = false ou mouvement réduit.
     o = { type: 'uniforme' | 'accelere' | 'decelere', n, pos: [fractions de 0 à 1], titre }
     ============================================================ */
  function positions(type, n) {
    return Array.from({ length: n }, (_, k) => {
      const x = k / (n - 1);
      return type === 'uniforme' ? x : type === 'accelere' ? x * x : 1 - (1 - x) * (1 - x);
    });
  }
  function chrono(o) {
    o = o || {};
    return outil(div => {
      const ps = o.pos || positions(o.type, o.n || 9);
      div.classList.add('pfd-chrono');
      div.innerHTML = `${o.titre ? `<p class="pfd-chrono-t">${o.titre}</p>` : ''}<div class="pfd-chrono-l"><svg viewBox="0 0 360 40" role="img" aria-label="Chronophotographie : positions successives à intervalles de temps égaux"></svg>
        ${o.anim === false ? '' : '<button type="button" class="btn-small pfd-rejouer" aria-label="Rejouer l\'animation">↺</button>'}</div>`;
      const svg = div.querySelector('svg'), bt = div.querySelector('.pfd-rejouer');
      let minuteur = null;
      const dessiner = k => {
        svg.innerHTML = `<line x1="14" y1="20" x2="346" y2="20" class="pfd-chrono-axe"/>` +
          ps.slice(0, k).map((p, i) => `<circle cx="${(18 + p * 324).toFixed(1)}" cy="20" r="${i === k - 1 && k < ps.length ? 6.5 : 5}" class="pfd-chrono-pt"/>`).join('');
      };
      const jouer = () => {
        clearInterval(minuteur);
        if (o.anim === false || matchMedia('(prefers-reduced-motion: reduce)').matches) { dessiner(ps.length); return; }
        let k = 0;
        dessiner(0);
        minuteur = setInterval(() => { dessiner(++k); if (k >= ps.length) clearInterval(minuteur); }, 320);
      };
      if (bt) bt.onclick = jouer;
      jouer();
    });
  }

  /* ============================================================
     RÉSULTANTE ET ACCÉLÉRATION DANS UN QUADRILLAGE
     (repère et tracé de vecteurs de cinematique/modules/vecteurs.js, objet VEC)
     PFD.partieResultante(o) : les forces sont dessinées depuis G ; l'élève
       trace Σ <span class="vec-nom">F</span> depuis G (1 carreau = o.echelle N), pointe glissable + flèches.
     PFD.partieAcc(o) : Σ <span class="vec-nom">F</span> est dessinée ; l'élève trace <span class="vec-nom">a</span> depuis G, même
       direction et même sens (sans souci d'échelle : toute longueur convient).
     o = { forces: [{ nom: 'F_1', coord: [0, 2] }], somme: [x, y] (facultatif), etendue, echelle, q, solution }
     ============================================================ */
  const somme = fs => fs.reduce((s, f) => [s[0] + f.coord[0], s[1] + f.coord[1]], [0, 0]);
  function repere(zone, o, aTracer) {
    const E = o.etendue || 5;
    return new window.VEC.Repere(zone, { xmin: -E, xmax: E, ymin: -E, ymax: E, axes: false, unitaires: false, mode: 'mixte',
      points: [{ nom: 'G', x: 0, y: 0, dx: -10, dy: 16 }], aria: o.aria || 'Quadrillage : forces appliquées au point G',
      vecteurs: o.forces.map(f => ({ nom: f.nom, dep: [0, 0], coord: f.coord, fixe: true, coul: window.VEC.C.encre2, nomPos: f.nomPos })).concat([aTracer]) });
  }
  function partieResultante(o) {
    const S = o.somme || somme(o.forces), ech = o.echelle || 1;
    return { type: 'perso', q: o.q || 'Trace la résultante Σ <span class="vec-nom">F</span> depuis le point G (glisse la pointe, ou utilise les flèches), puis valide.', solution: o.solution,
      monter(zone, api) {
        const rep = repere(zone, o, { nom: 'ΣF', dep: [0, 0], coord: S, valeur: { k: ech, unite: 'N', dec: 1 } });
        const bVal = boutonValider(zone);
        bVal.onclick = () => {
          if (api.fini()) return;
          const v = rep.vs[rep.vs.length - 1];
          if (!v.fin) { api.message('Trace d\'abord la résultante depuis G.'); return; }
          const r = rep.verifier()[0];
          if (r.code === 'ok') { bVal.fermer(); api.reussi(); return; }
          const d = [v.fin[0], v.fin[1]];
          const partielle = o.forces.length > 1 && o.forces.some((f, i) => { const sans = somme(o.forces.filter((_, k) => k !== i)); return sans[0] === d[0] && sans[1] === d[1]; });
          api.erreur(d[0] === -S[0] && d[1] === -S[1] ? 'Le sens est inversé.'
            : partielle ? 'Il manque une force : additionne <b>toutes</b> les forces.'
            : 'Mets les flèches bout à bout : la résultante va de G à l\'extrémité de la dernière flèche. Deux forces opposées se soustraient ; deux forces perpendiculaires donnent la diagonale du rectangle.');
        };
        return { montrer() { rep.montrer(); bVal.fermer(); } };
      } };
  }
  function partieAcc(o) {
    const S = o.somme || somme(o.forces);
    return { type: 'perso', q: o.q || 'Trace le vecteur accélération <span class="vec-nom">a</span> depuis G (sans souci d\'échelle), puis valide.', solution: o.solution,
      monter(zone, api) {
        const fs = o.forces.concat([{ nom: 'ΣF', coord: S }]);
        const rep = repere(zone, Object.assign({}, o, { forces: fs }), { nom: 'a', dep: [0, 0], coord: S });
        const bVal = boutonValider(zone);
        bVal.onclick = () => {
          if (api.fini()) return;
          const v = rep.vs[rep.vs.length - 1];
          if (!v.fin) { api.message('Trace d\'abord <span class="vec-nom">a</span> depuis G.'); return; }
          const d = v.fin, croix = d[0] * S[1] - d[1] * S[0], scal = d[0] * S[0] + d[1] * S[1];
          if (croix === 0 && scal > 0) { v.etat = 'ok'; v.bloque = true; rep.verrou = true; rep.dessiner(); bVal.fermer(); api.reussi(); return; }
          v.etat = 'ko'; rep.dessiner();
          api.erreur(croix === 0 ? 'La direction est bonne, mais le <b>sens</b> est inversé : <span class="vec-nom">a</span> a le même sens que Σ <span class="vec-nom">F</span>.' : '<span class="vec-nom">a</span> a la <b>même direction</b> et le <b>même sens</b> que Σ <span class="vec-nom">F</span> (sa longueur n\'a pas d\'importance ici).');
        };
        return { montrer() { rep.montrer(); bVal.fermer(); } };
      } };
  }

  /* ============================================================
     PLAN DE L'APPLICATION ET NAVIGATION (voir assets/sommaire.js)
     ============================================================ */
  const PLAN = [
    { n: 1, titre: 'Référentiel et nature du mouvement', desc: 'Référentiel galiléen, mouvement uniforme, accéléré ou décéléré', fiche: 'fiche_1',
      parties: [{ nom: 'Référentiel et nature du mouvement', cours: 'module_1_cours', questions: 'module_1_questions' }] },
    { n: 2, titre: 'Faire un bilan des forces', desc: 'Forces à distance et de contact, poids, réaction du support, forces qui se compensent', fiche: 'fiche_2',
      parties: [{ nom: 'Faire un bilan des forces', simulation: 'module_2_simulation', cours: 'module_2_cours', questions: 'module_2_questions', noms: { simulation: 'Atelier : bilan des forces' } }] },
    { n: 3, titre: 'Accélération', desc: 'a = dv/dt ; a = Δv / Δt en m·s<sup>−2</sup>', fiche: 'fiche_3',
      parties: [{ nom: 'Accélération', cours: 'module_3_cours', questions: 'module_3_questions' }] },
    { n: 4, titre: 'Principe fondamental de la dynamique', desc: 'Σ <span class="vec-nom">F</span> = m <span class="vec-nom">a</span>, principe d\'inertie, résultante des forces', fiche: 'fiche_4',
      parties: [{ nom: 'Principe fondamental de la dynamique', cours: 'module_4_cours', questions: 'module_4_questions' }] },
    { n: 5, titre: 'Exercices', desc: 'Exercices 1, 2, 3 et 5 à 19 de la feuille (p. 84-87), guidés pas à pas', exercices: 'module_5', exNom: 'Exercices 1 à 19', nbEx: 11 },
  ];
  window.SOM.init({ nom: 'Chapitre 6 : Principe fondamental de la dynamique', id: 'principe-dynamique', cleEx: 'principe-dynamique-exercices', plan: PLAN });
  const menu = cle => window.SOM.menu(cle);
  const accueil = zone => window.SOM.accueil(zone);
  const marquer = info => window.SOM.marquer(info);

  window.PFD = Object.assign(window.PFD || {}, {
    MOINS, fmt, cs, sci, lire, proche, fr, unite, o, fq, el, secouer, melanger, hasard, entre, champ, PARTIES,
    question, serie, confettis, fig, monter, outil, cap, V, NOMS, nomV, nomSVG, DIR_TXT, texteDir, ecartAngle, scene, sceneRemplie, bilan,
    positions, chrono, somme, partieResultante, partieAcc, PLAN, menu, accueil, marquer,
  });
})();
