/* ============================================================
   Moteur de l'application « Chapitre 5 : Flux et transferts thermiques »
   (Terminale STI2D ; même moteur de questions que « Cinématique » et
   « Chapitre 2 : Piles et accumulateurs » ; navigation commune
   assets/sommaire.js, cours avec assets/cours.js)

   TT.fmt, TT.cs, TT.sci, TT.lire      écriture et lecture des nombres (virgule)
   TT.o, TT.fq.choix, TT.fq.nombre     fabriques d'options et de parties de question
   TT.PARTIES                          parties de question :
       'choix'    boutons à choisir
       'nombre'   valeur numérique (avec bouton ±)
       'gabarit'  expression à trous
       'sci'      écriture scientifique a × 10ⁿ
       'schema'   étiquettes à glisser sur un schéma (assets/dragdrop.js)
       'perso'    outil propre : p.monter(zone, api) → { montrer() }
   TT.question(zone, q, cb, mode)      question en plusieurs parties (série, exercice, cours)
   TT.serie(opts)                      série de questions notée sur 20
   TT.fig(dessin)                      figure dessinée à la largeur disponible
   TT.outil(monter)                    outil interactif placé dans du HTML (énoncé d'un « À toi »)
   TT.echelles(o)                      échelles Kelvin et Celsius côte à côte (SVG)
   TT.modes()                          les trois modes de transfert thermique (SVG)
   TT.paroi(o), TT.slot(id)            schéma d'une paroi en couches (HTML), cases à remplir
   TT.partieSens(o)                    partie : sens du transfert thermique à travers la paroi
   TT.partieParoi(o), TT.paroiExplo(o) paroi réglable : e, matériau, S, températures → R et Φ
   TT.MATERIAUX                        conductivités thermiques des matériaux des exercices
   TT.menu(cle), TT.accueil(zone)      navigation commune (SOM) avec le plan de l'application

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

  // Choix parmi des boutons : p.options [{ id, label }], p.bonne (un id, ou une liste d'ids si plusieurs
  // réponses sont justes), p.notes[id] (remarque ajoutée à « Juste ! »), p.indice ou p.indices[id], p.colonne
  function pChoix(zone, p, api) {
    const box = el('div', 'ph-choix' + (p.colonne ? ' ph-choix-col' : ''));
    zone.appendChild(box);
    const opts = p.melanger === false ? p.options : melanger(p.options);
    const bonnes = [].concat(p.bonne);
    const bs = opts.map(o => {
      const b = el('button', 'btn-secondary', o.label);
      b.type = 'button';
      b.dataset.id = o.id;
      box.appendChild(b);
      b.onclick = () => {
        if (api.fini() || b.disabled) return;
        if (bonnes.includes(o.id)) {
          b.classList.add('juste');
          bs.forEach(x => { x.b.disabled = true; });
          api.reussi(false, p.notes && p.notes[o.id]);
        } else {
          b.classList.add('faux'); b.disabled = true;
          api.erreur((p.indices && p.indices[o.id]) || p.indice || '');
        }
      };
      return { b, o };
    });
    return { montrer() { bs.forEach(({ b, o }) => { b.disabled = true; if (bonnes.includes(o.id)) b.classList.add('juste'); }); } };
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

  // Valeur numérique : p.label, p.valeur, p.tol (écart absolu) ou p.rel (écart relatif), p.unite, p.diag(v), p.indice,
  // p.aussi [{ valeur, note }] : autres réponses justes, avec la remarque ajoutée à « Juste ! »
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
      // autre réponse juste (par ex. un flux négatif compté dans l'autre sens)
      const autre = (p.aussi || []).find(a => juste(v, Object.assign({}, p, { valeur: a.valeur })));
      if (autre) { ch.desactiver(true); bVal.fermer(); api.reussi(false, autre.note); return; }
      api.erreur((p.diag && p.diag(v)) || p.indice || 'Vérifie ton calcul.');
      secouer(d);
    }
    bVal.onclick = valider;
    return { montrer() { ch.input.value = affichage(p); ch.desactiver(true); bVal.fermer(); } };
  }

  // Expression à trous : p.label, p.morceaux = [texte HTML | { v, tol, rel, aria }], p.diag(valeurs)
  function pGabarit(zone, p, api) {
    const d = el('div', 'ph-valeur tt-gab');
    if (p.label) d.appendChild(el('span', 'ph-lab', p.label));
    // chaque case forme un groupe insécable avec le texte qui la suit (et le texte d'ouverture
    // avec la première case) : sur un petit écran, la ligne ne se coupe qu'entre deux groupes
    const champs = [];
    let grp = el('span', 'tt-gab-grp');
    d.appendChild(grp);
    p.morceaux.forEach(m => {
      if (typeof m === 'string') { grp.appendChild(el('span', 'tt-gab-txt', m)); return; }
      if (champs.length) { grp = el('span', 'tt-gab-grp'); d.appendChild(grp); }
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
     p.schema : HTML du schéma, avec des cases TT.slot(id)
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
     réponse » disponible tout de suite. TT.tout reste vrai ensuite :
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
      window.TT.partieEnCours = p;          // partie en cours (utile pour vérifier l'application)
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
    if (mode === 'cours' && window.TT.tout) inst.deplier();
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
      window.TT.questionEnCours = q;          // question en cours (utile pour vérifier l'application)
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
     TT.fig(dessin) renvoie un emplacement HTML ; dès qu'il est dans la
     page, dessin(W) y est appelé avec la largeur disponible W (et de
     nouveau quand la largeur change) : les textes gardent leur taille
     et restent lisibles sur un téléphone. Plusieurs figures par page.
     ============================================================ */
  const DESSINS = new Map();
  let nFig = 0, nMotif = 0;
  function fig(dessin, cls) {
    const k = String(++nFig);
    DESSINS.set(k, dessin);
    return `<div class="tt-fig${cls ? ' ' + cls : ''}" data-fig="${k}"></div>`;
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
    const l = racine.matches && racine.matches('.tt-fig[data-fig]') ? [racine] : [];
    racine.querySelectorAll('.tt-fig[data-fig]').forEach(x => l.push(x));
    l.forEach(x => { const f = DESSINS.get(x.dataset.fig); if (f) monter(x, f); });
  }
  new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(chercher))).observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener('DOMContentLoaded', () => chercher(document.body));

  /* ============================================================
     OUTILS INTERACTIFS PLACÉS DANS DU HTML
     TT.outil(monter) renvoie un emplacement HTML ; dès qu'il est dans la
     page (énoncé d'un « À toi », contexte d'un exercice…), monter(div)
     y construit l'outil, une seule fois. Plusieurs outils par page.
     ============================================================ */
  const OUTILS = new Map();
  let nOutil = 0;
  function outil(f) {
    const k = String(++nOutil);
    OUTILS.set(k, f);
    return `<div class="tt-outil" data-outil="${k}"></div>`;
  }
  function chercherOutils(racine) {
    if (!racine || !racine.querySelectorAll) return;
    const l = racine.matches && racine.matches('.tt-outil[data-outil]') ? [racine] : [];
    racine.querySelectorAll('.tt-outil[data-outil]').forEach(x => l.push(x));
    l.forEach(x => {
      if (x.dataset.monte) return;
      const f = OUTILS.get(x.dataset.outil);
      if (f) { x.dataset.monte = '1'; f(x); }
    });
  }
  new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(chercherOutils))).observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener('DOMContentLoaded', () => chercherOutils(document.body));

  /* ============================================================
     MATÉRIAUX : conductivités thermiques λ des énoncés (W·m⁻¹·K⁻¹)
     motif : texture de la couche sur les schémas (voir tt.css)
     ============================================================ */
  const MATERIAUX = {
    beton: { nom: 'béton', lam: 1.28, motif: 'beton' },
    brique: { nom: 'brique', lam: 1.15, motif: 'brique' },
    verre: { nom: 'verre', lam: 1, motif: 'verre' },
    glace: { nom: 'glace', lam: 2.2, motif: 'glace' },
    platre: { nom: 'plâtre', lam: 0.35, motif: 'platre' },
    pin: { nom: 'bois de pin', lam: 0.15, motif: 'bois' },
    neige: { nom: 'neige', lam: 0.1, motif: 'neige' },
    laine: { nom: 'laine de verre', lam: 0.04, motif: 'isolant' },
    poly: { nom: 'polystyrène', lam: 0.03, motif: 'isolant' },
    air: { nom: 'air immobile', lam: 0.025, motif: 'air' },
  };

  /* ============================================================
     ÉCHELLES DE TEMPÉRATURE (SVG à la largeur disponible)
     Deux axes gradués côte à côte : T en kelvins, θ en degrés Celsius.
     o.marque = θ (°C) : repère supplémentaire mis en valeur (facultatif)
     ============================================================ */
  function echelles(o) {
    o = o || {};
    const reperes = [[-273, 'zéro absolu'], [-196, 'l\'azote liquide bout'], [0, 'l\'eau gèle'], [100, 'l\'eau bout']];
    if (o.marque != null && !reperes.some(r => r[0] === o.marque)) reperes.push([o.marque, o.nomMarque || '', true]);
    return fig(W => {
      const L = Math.min(W, 460), x0 = (W - L) / 2, xK = x0 + 74, xC = x0 + L - 92, h = 300, haut = 46, bas = 20;
      const y = t => haut + (100 - t) / 373 * (h - haut - bas);
      let s = `<text x="${xK}" y="22" text-anchor="middle" class="tt-ech-titre">T (K)</text><text x="${xC}" y="22" text-anchor="middle" class="tt-ech-titre">θ (°C)</text>`;
      s += `<line x1="${xK}" y1="${haut - 12}" x2="${xK}" y2="${h - bas + 6}" class="tt-ech-axe"/><line x1="${xC}" y1="${haut - 12}" x2="${xC}" y2="${h - bas + 6}" class="tt-ech-axe"/>`;
      s += `<path d="M${xK - 5},${haut - 6} L${xK},${haut - 16} L${xK + 5},${haut - 6} Z M${xC - 5},${haut - 6} L${xC},${haut - 16} L${xC + 5},${haut - 6} Z" class="tt-ech-pointe"/>`;
      reperes.forEach(([t, nom, fort]) => {
        const yy = y(t);
        s += `<line x1="${xK}" y1="${yy}" x2="${xC}" y2="${yy}" class="${fort ? 'tt-ech-marque' : 'tt-ech-lien'}"/>`;
        s += `<line x1="${xK - 6}" y1="${yy}" x2="${xK + 6}" y2="${yy}" class="tt-ech-axe"/><line x1="${xC - 6}" y1="${yy}" x2="${xC + 6}" y2="${yy}" class="tt-ech-axe"/>`;
        s += `<text x="${xK - 10}" y="${yy + 5}" text-anchor="end" class="tt-ech-val${fort ? ' fort' : ''}">${fmt(t + 273)} K</text>`;
        s += `<text x="${xC + 10}" y="${yy + 5}" class="tt-ech-val${fort ? ' fort' : ''}">${fmt(t)} °C</text>`;
        if (nom) s += `<text x="${(xK + xC) / 2}" y="${yy - 6}" text-anchor="middle" class="tt-ech-nom">${nom}</text>`;
      });
      return `<svg viewBox="0 0 ${W} ${h}" width="${W}" height="${h}" role="img" aria-label="Échelles Kelvin et Celsius côte à côte : 0 K = −273 °C ; 273 K = 0 °C ; 373 K = 100 °C">${s}</svg>`;
    });
  }

  /* ============================================================
     LES TROIS MODES DE TRANSFERT THERMIQUE (SVG)
     conduction (tige chauffée tenue à la main), convection (air chaud
     qui monte au-dessus d'un radiateur), rayonnement (Soleil, feu).
     Trois cases côte à côte sur un écran large, l'une sous l'autre sinon.
     ============================================================ */
  // petite pointe de flèche en (x, y), orientée selon l'angle a (degrés, 0 = vers la droite)
  function pointe(x, y, a, cls) {
    const r = a * Math.PI / 180, c = Math.cos(r), s = Math.sin(r), L = 9, l = 4.5;
    const p = [[x, y], [x - L * c - l * s, y - L * s + l * c], [x - L * c + l * s, y - L * s - l * c]];
    return `<polygon points="${p.map(q => q.map(v => v.toFixed(1)).join(',')).join(' ')}" class="${cls || 'tt-md-pointe'}"/>`;
  }
  // poing fermé vu de côté (pouce en haut, plis des doigts), avec son nom dessous
  const main = (x, y) => `<g class="tt-md-main"><rect x="${x}" y="${y}" width="34" height="26" rx="11"/><ellipse cx="${x + 13}" cy="${y + 2}" rx="11" ry="5"/>` +
    `<path d="M${x + 14},${y + 10} h16 M${x + 14},${y + 15} h17 M${x + 14},${y + 20} h15"/></g><text x="${x + 17}" y="${y + 42}" text-anchor="middle" class="tt-md-mot">main</text>`;
  const flamme = (x, y) => `<path d="M${x},${y} C${x - 13},${y - 14} ${x - 6},${y - 26} ${x},${y - 38} C${x + 6},${y - 26} ${x + 13},${y - 14} ${x},${y} Z" class="tt-md-flamme"/><path d="M${x},${y - 3} C${x - 6},${y - 10} ${x - 3},${y - 17} ${x},${y - 22} C${x + 3},${y - 17} ${x + 6},${y - 10} ${x},${y - 3} Z" class="tt-md-flamme2"/>`;
  function modes() {
    const cases = [
      { t: 'Conduction', d: ['dans un solide,', 'de proche en proche'], s:
        `<rect x="26" y="62" width="128" height="10" rx="3" class="tt-md-tige"/>${flamme(40, 112)}<rect x="31" y="112" width="18" height="14" rx="2" class="tt-md-bloc"/>${main(148, 54)}` +
        [62, 92, 122].map(x => `<line x1="${x}" y1="48" x2="${x + 20}" y2="48" class="tt-md-fl"/>${pointe(x + 22, 48, 0)}`).join('') },
      { t: 'Convection', d: ['déplacement d\'un fluide', '(l\'air chaud monte)'], s:
        `<rect x="34" y="100" width="66" height="30" rx="4" class="tt-md-bloc"/>${[44, 56, 68, 80, 90].map(x => `<line x1="${x}" y1="104" x2="${x}" y2="126" class="tt-md-trait"/>`).join('')}` +
        `<path d="M58,94 C54,60 62,34 96,30 C130,26 152,46 150,82" class="tt-md-fl"/>${pointe(150, 86, 92)}` +
        `<path d="M150,96 C148,122 128,134 108,130" class="tt-md-fl tirets"/>${pointe(104, 129, 190)}` +
        `<text x="96" y="22" text-anchor="middle" class="tt-md-mot">air chaud</text><text x="160" y="118" class="tt-md-mot">froid</text>` },
      { t: 'Rayonnement', d: ['sans support matériel', '(Soleil, feu)'], s:
        `<circle cx="42" cy="66" r="17" class="tt-md-soleil"/>${Array.from({ length: 8 }, (_, k) => { const a = k * Math.PI / 4; return `<line x1="${42 + 22 * Math.cos(a)}" y1="${66 + 22 * Math.sin(a)}" x2="${42 + 30 * Math.cos(a)}" y2="${66 + 30 * Math.sin(a)}" class="tt-md-trait"/>`; }).join('')}` +
        [44, 66, 88].map(y => { let d = `M80,${y}`; for (let x = 80; x < 136; x += 4) d += ` L${x + 4},${(y + 4 * Math.sin((x + 4 - 80) / 28 * 2 * Math.PI)).toFixed(1)}`; return `<path d="${d}" class="tt-md-fl"/>${pointe(142, y, 0)}`; }).join('') + main(150, 54) },
    ];
    return fig(W => {
      const large = W >= 540, n = cases.length;
      const vw = large ? 600 : 200, vh = large ? 196 : 588;
      const larg = large ? W : Math.min(W, 300), haut = Math.round(larg * vh / vw);
      const g = cases.map((c, k) => `<g transform="translate(${large ? k * 200 : 0},${large ? 0 : k * 196})">${c.s}` +
        `<text x="100" y="156" text-anchor="middle" class="tt-md-t">${c.t}</text>${c.d.map((l, i) => `<text x="100" y="${173 + i * 14}" text-anchor="middle" class="tt-md-d">${l}</text>`).join('')}</g>`).join('');
      return `<svg viewBox="0 0 ${vw} ${vh}" width="${larg}" height="${haut}" role="img" aria-label="Les trois modes de transfert thermique : conduction dans une tige chauffée, convection de l'air au-dessus d'un radiateur, rayonnement du Soleil">${g}</svg>`;
    }, 'tt-fig-modes');
  }

  /* ============================================================
     SCHÉMA D'UNE PAROI EN COUCHES (HTML, voir tt.css)
       côté 1 | couche 1 | couche 2 | … | côté 2
               e, λ, R     e, λ, R
       S, R totale, Φ (flèche du flux, du chaud vers le froid)
     Sur un écran étroit, le schéma se met à la verticale : côté 1 en haut.
     o = { couches: [{ nom, motif, e, lam, R, ind }], cotes: [{ nom, T, Tnom }, { … }],
           S, R, phi, sens: 1 (du côté 1 vers le côté 2) | 2 (l'inverse) | absent, aria }
     Les valeurs sont du HTML : TT.val('20 cm'), TT.slot('e1') (case à remplir), TT.inc().
     ============================================================ */
  const slot = id => `<span class="sc-slot" data-slot="${id}"><span class="sc-slot-ph">?</span></span>`;
  const val = t => `<span class="sc-val">${t}</span>`;
  const inc = () => '<span class="sc-val inconnue">?</span>';
  function paroi(o) {
    const ligne = (nom, h) => (h ? `<div class="sc-ligne"><span class="sc-nom">${nom}</span>${h}</div>` : '');
    const cote = (c, k) => `<div class="tt-pa-cote tt-pa-cote${k}"><p class="tt-pa-t">${c.nom}</p>${ligne(c.Tnom || 'T =', c.T)}</div>`;
    const couches = o.couches.map((c, i) => {
      const ind = c.ind || String(i + 1);
      return `<div class="tt-pa-c"><div class="tt-pa-motif m-${c.motif || 'beton'}" aria-hidden="true"></div>
        <div class="tt-pa-info"><p class="tt-pa-nom">${c.nom}</p>${ligne(`e<sub>${ind}</sub> =`, c.e)}${ligne(`λ<sub>${ind}</sub> =`, c.lam)}${ligne(`R<sub>${ind}</sub> =`, c.R)}</div></div>`;
    }).join('');
    const sens = o.sens === 1 ? ' s1' : o.sens === 2 ? ' s2' : '';
    const flux = o.phi || o.sens ? `<div class="tt-pa-flux${sens}"><span class="tt-pa-fl" aria-hidden="true"></span>${ligne('Φ =', o.phi || '')}</div>` : '';
    const lam = o.couches.some(c => c.lam) ? '<p class="tt-pa-leg">λ en W·m<sup>−1</sup>·K<sup>−1</sup></p>' : '';
    return `<div class="tt-pa" role="group" aria-label="${o.aria || 'Schéma de la paroi en couches, avec les données de l\'énoncé'}">
      <div class="tt-pa-in" style="--n:${o.couches.length}">${cote(o.cotes[0], 1)}${couches}${cote(o.cotes[1], 2)}${flux}</div>
      <div class="tt-pa-bas">${ligne('S =', o.S)}${ligne('R =', o.R)}</div>${lam}
    </div>`;
  }

  /* Partie de question : sens du transfert thermique à travers la paroi.
     o = { q, cotes: ['l\'intérieur (19 °C)', 'l\'extérieur (5 °C)'], bon: 1 (du côté 1 vers le côté 2) | 2, schema (options de paroi pour la réponse), solution } */
  // « de » devant un nom : « de l'intérieur », « du local », « des pièces »
  const de = x => (/^le /.test(x) ? 'du ' + x.slice(3) : /^les /.test(x) ? 'des ' + x.slice(4) : 'de ' + x);
  /* Flux compté dans l'autre sens. En STI2D, on donne le flux positif et son sens à part ; un flux
     négatif n'est pas faux pour autant : il va dans le sens contraire de celui où on le compte.
     compte : sens où l'élève a compté le flux (« de l'intérieur vers l'extérieur ») ;
     reel : sens réel du transfert (« de l'extérieur vers l'intérieur »). Remarques ajoutées à « Juste ! ». */
  const noteFluxNeg = (compte, reel) => `Ton flux négatif est juste aussi : il est compté ${compte}, et le signe «&nbsp;−&nbsp;» indique qu'il va en réalité dans le sens contraire, ${reel}. En STI2D, on préfère le donner positif, ${reel}.`;
  const noteDTNeg = (compte, reel) => `C'est juste aussi si tu comptes le flux ${compte} : ΔT et Φ sont alors négatifs, et le flux va en réalité ${reel}. En STI2D, on préfère ΔT = T<sub>chaud</sub> − T<sub>froid</sub>, positif.`;
  function partieSens(o) {
    const [a, b] = o.cotes;
    return { type: 'choix', q: o.q || 'Dans quel sens se fait le transfert thermique à travers la paroi ?', melanger: false, colonne: true,
      options: [{ id: '1', label: `${de(a)} vers ${b}` }, { id: '2', label: `${de(b)} vers ${a}` }, { id: '0', label: 'il n\'y a pas de transfert à travers une paroi isolée' }],
      bonne: String(o.bon || 1),
      indices: { [o.bon === 2 ? '1' : '2']: 'Le transfert thermique va <b>toujours du chaud vers le froid</b>.', 0: 'Une paroi isolée ralentit le transfert thermique, elle ne l\'arrête jamais complètement.' },
      solution: (o.solution || `<p>Le transfert thermique va du chaud vers le froid : ${de(o.bon === 2 ? b : a)} vers ${o.bon === 2 ? a : b}.</p>`) + (o.schema ? paroi(Object.assign({}, o.schema, { sens: o.bon || 1 })) : '') };
  }

  /* ============================================================
     SCHÉMA DE PAROI À COMPLÉTER (partie 'schema') : l'élève place les
     données de l'énoncé (e et λ de chaque couche, températures des deux
     côtés, S) ; les résistances et le flux restent des inconnues « ? ».
     d = { couches: [{ nom, motif, e: '20 cm', lam: 1.28, lamLab: '1,28' (facultatif) }],
           cotes: [{ nom: 'intérieur', T: 20 }, { nom: 'extérieur', T: −5 }] (T absente : pas de case), S: 12 (m²), Slab: '2,0 m²' (facultatif),
           intrus: [{ label, indice }] (étiquettes en trop, facultatif) }
     TT.schemaParoi(d, q) → partie 'schema' (q, schema, etiquettes, solution)
     TT.paroiRemplie(d, o) → schéma rempli (o.R : résistances [R₁, R₂…, R], o.phi, o.sens)
     Deux cases de même valeur (deux verres de 4 mm…) acceptent l'une ou l'autre étiquette.
     ============================================================ */
  const labT = T => `${fmt(T)} °C`, labS = S => `${fmt(S)} m<sup>2</sup>`;
  function schemaParoi(d, q) {
    const cases = [];
    d.couches.forEach((c, i) => {
      cases.push({ id: 'e' + (i + 1), label: c.e, indice: `L'épaisseur de la couche « ${c.nom} » se place sous cette couche, avec « e<sub>${i + 1}</sub> ».` });
      cases.push({ id: 'l' + (i + 1), label: c.lamLab || fmt(c.lam), indice: `La conductivité thermique de la couche « ${c.nom} » se place sous cette couche, avec « λ<sub>${i + 1}</sub> ».` });
    });
    d.cotes.forEach((c, k) => { if (c.T != null) cases.push({ id: 'T' + (k + 1), label: labT(c.T), indice: `${labT(c.T)} est la température du côté ${c.nom}.` }); });
    cases.push({ id: 'S', label: d.Slab || labS(d.S), indice: 'La surface est la même pour toutes les couches : elle se place sous la paroi.' });
    const etiquettes = cases.map(x => {
      const memes = cases.filter(y => y.label === x.label);
      return { id: x.id, label: x.label, cible: memes.map(y => y.id), indice: memes.length > 1 ? `Il y a ${memes.length} cases pour « ${x.label} » : regarde l'énoncé.` : x.indice };
    }).concat((d.intrus || []).map((x, k) => ({ id: 'x' + k, label: x.label, cible: null, indice: x.indice })));
    const schema = paroi({
      couches: d.couches.map((c, i) => ({ nom: c.nom, motif: c.motif, e: slot('e' + (i + 1)), lam: slot('l' + (i + 1)), R: inc() })),
      cotes: d.cotes.map((c, k) => ({ nom: c.nom, T: c.T == null ? '' : slot('T' + (k + 1)) })), S: slot('S'), R: inc(), phi: d.cotes.some(c => c.T == null) ? '' : inc(),
    });
    return { type: 'schema', titrePalette: 'Données de l\'énoncé', schema, etiquettes,
      q: q || 'Place les données de l\'énoncé sur le schéma de la paroi (les cases « ? » restées vides sont les inconnues).',
      solution: `<p>${d.couches.map((c, i) => `${c.nom} : e<sub>${i + 1}</sub> = ${c.e}, λ<sub>${i + 1}</sub> = ${c.lamLab || fmt(c.lam)}`).join(' ; ')} ; S = ${d.Slab || labS(d.S)} pour toutes les couches.</p>` };
  }
  function paroiRemplie(d, o) {
    o = o || {};
    const R = o.R || [];
    return paroi({
      couches: d.couches.map((c, i) => ({ nom: c.nom, motif: c.motif, e: val(c.e), lam: val(c.lamLab || fmt(c.lam)), R: R[i] ? val(R[i]) : inc() })),
      cotes: d.cotes.map(c => ({ nom: c.nom, T: c.T == null ? '' : val(labT(c.T)) })), S: val(d.Slab || labS(d.S)), R: R[d.couches.length] ? val(R[d.couches.length]) : inc(),
      phi: o.phi ? val(o.phi) : d.cotes.some(c => c.T == null) ? '' : inc(), sens: o.sens, aria: o.aria,
    });
  }

  /* ============================================================
     PAROI RÉGLABLE (exploration, ou partie 'perso' avec un objectif)
     On règle l'épaisseur e, le matériau (λ), la surface S et les deux
     températures ; R = e / (λ S) et Φ = ΔT / R s'affichent. La flèche
     du flux va du chaud vers le froid, son épaisseur est proportionnelle
     à Φ. Plusieurs exemplaires possibles dans la page.
     o = { e (m), mat, S (m²), Ti, Te (°C), mats: [clés de MATERIAUX], fixe: ['e', 'mat', 'S', 'T'],
           cible(etat) → vrai si l'objectif est atteint, diag(etat), montre: { … } (état de la réponse) }
     api (partie de question) : null pour un outil d'exploration seul (TT.outil).
     ============================================================ */
  function paroiExplo(zone, o, api) {
    const mats = o.mats || ['beton', 'brique', 'platre', 'pin', 'laine', 'poly'];
    const fixe = o.fixe || [];
    const et = { e: o.e || 0.2, mat: o.mat || mats[0], S: o.S || 10, Ti: o.Ti == null ? 19 : o.Ti, Te: o.Te == null ? 5 : o.Te };
    let fige = false, k = null, largeur = 0;
    const calc = () => {
      const lam = MATERIAUX[et.mat].lam, R = et.e / (lam * et.S), dT = Math.abs(et.Ti - et.Te);
      return { lam, R, dT, phi: dT / R };
    };
    k = 14 / Math.max(calc().phi, 1e-9);      // épaisseur de la flèche au départ : 14 px
    const d = el('div', 'tt-ex');
    const reglage = (cle, nom) => fixe.indexOf(cle === 'Ti' || cle === 'Te' ? 'T' : cle) !== -1 ? '' : `<div class="tt-ex-b"><span class="tt-ex-nom">${nom}</span>
      <button type="button" class="tt-ex-pas" data-k="${cle}" data-p="-1" aria-label="${nom} : diminuer">−</button>
      <output class="tt-ex-v" data-v="${cle}"></output>
      <button type="button" class="tt-ex-pas" data-k="${cle}" data-p="1" aria-label="${nom} : augmenter">+</button></div>`;
    d.innerHTML = `<div class="tt-ex-fig"></div><div class="tt-ex-res" aria-live="polite"></div>
      <div class="tt-ex-cmd">${reglage('e', 'Épaisseur e')}${reglage('S', 'Surface S')}${reglage('Ti', 'Intérieur')}${reglage('Te', 'Extérieur')}</div>
      ${fixe.indexOf('mat') !== -1 ? '' : `<div class="tt-ex-mats" role="group" aria-label="Matériau de la paroi">${mats.map(m => `<button type="button" class="tt-ex-mat" data-m="${m}">${MATERIAUX[m].nom}<small>λ = ${fmt(MATERIAUX[m].lam)}</small></button>`).join('')}</div>`}`;
    zone.appendChild(d);
    const figZ = d.querySelector('.tt-ex-fig'), res = d.querySelector('.tt-ex-res');
    const bVal = api && o.cible ? boutonValider(zone) : null;
    // pas des réglages (e en cm de 1 à 50 cm ; S de 1 à 40 m² ; températures de −20 à 40 °C)
    const pas = {
      e: p => { const cm = Math.round(et.e * 100); et.e = Math.max(1, Math.min(50, cm + p)) / 100; },
      S: p => { et.S = Math.max(1, Math.min(40, et.S + p)); },
      Ti: p => { et.Ti = Math.max(-20, Math.min(40, et.Ti + p)); },
      Te: p => { et.Te = Math.max(-20, Math.min(40, et.Te + p)); },
    };
    function dessiner() {
      const W = Math.round(figZ.clientWidth) || 320;
      largeur = W;
      const c = calc(), H = 156, mid = 82;
      const ep = 10 + et.e * 100 / 50 * Math.max(60, W - 210);       // largeur du mur à l'écran (proportionnelle à e)
      const xm = (W - ep) / 2;
      const chaudG = et.Ti >= et.Te;
      // le mur est dessiné par-dessus la flèche (un peu transparent) : le flux le traverse
      const mur = `<rect x="${xm}" y="18" width="${ep}" height="${H - 46}" class="tt-ex-mur m-${MATERIAUX[et.mat].motif}"/>`;
      let s = `<text x="${xm + ep / 2}" y="${H - 12}" text-anchor="middle" class="tt-ex-t">${MATERIAUX[et.mat].nom} · e = ${fmt(Math.round(et.e * 100))} cm</text>`;
      s += `<text x="10" y="30" class="tt-ex-t">intérieur</text><text x="10" y="50" class="tt-ex-tv">${fmt(et.Ti)} °C</text>`;
      s += `<text x="${W - 10}" y="30" text-anchor="end" class="tt-ex-t">extérieur</text><text x="${W - 10}" y="50" text-anchor="end" class="tt-ex-tv">${fmt(et.Te)} °C</text>`;
      if (c.dT > 0) {
        const w = c.phi * k, trop = w > 44, ww = Math.max(1.5, Math.min(44, w));
        const x1 = chaudG ? 16 : W - 16, x2 = chaudG ? W - 16 - ww : 16 + ww, sg = chaudG ? 1 : -1;
        s += `<line x1="${x1}" y1="${mid}" x2="${x2}" y2="${mid}" class="tt-ex-flux" stroke-width="${ww}"/>`;
        const lp = Math.max(14, ww * 1.2), hp = Math.max(9, ww * .95 + 6);
        s += `<polygon points="${x2},${mid - hp} ${x2 + sg * lp},${mid} ${x2},${mid + hp}" class="tt-ex-pointe"/>`;
        s += `<text x="${chaudG ? 10 : W - 10}" y="${mid + Math.max(ww / 2, 8) + 18}" text-anchor="${chaudG ? 'start' : 'end'}" class="tt-ex-t2">Φ${trop ? ' (flèche limitée)' : ''}</text>`;
      } else s += `<text x="${W / 2}" y="${mid + 5}" text-anchor="middle" class="tt-ex-t">mêmes températures : pas de transfert</text>`;
      s += mur;
      figZ.innerHTML = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Paroi de ${MATERIAUX[et.mat].nom}, épaisseur ${fmt(Math.round(et.e * 100))} cm ; flux thermique ${chaudG ? 'de l\'intérieur vers l\'extérieur' : 'de l\'extérieur vers l\'intérieur'}">${s}</svg>`;
      const v = (cle, t) => { const x = d.querySelector(`[data-v="${cle}"]`); if (x) x.innerHTML = t; };
      v('e', `${fmt(Math.round(et.e * 100))} cm`); v('S', `${fmt(et.S)} m<sup>2</sup>`); v('Ti', `${fmt(et.Ti)} °C`); v('Te', `${fmt(et.Te)} °C`);
      d.querySelectorAll('.tt-ex-mat').forEach(b => { const on = b.dataset.m === et.mat; b.classList.toggle('actif', on); b.setAttribute('aria-pressed', on ? 'true' : 'false'); });
      res.innerHTML = `<span>λ = <b>${fmt(c.lam)}</b> W·m<sup>−1</sup>·K<sup>−1</sup></span><span>R = ${fr('e', 'λ × S')} = <b>${cs(c.R, 3)}</b> K·W<sup>−1</sup></span>` +
        `<span>ΔT = <b>${fmt(c.dT)}</b> K</span><span>Φ = ${fr('ΔT', 'R')} = <b>${c.dT ? cs(c.phi, 3) : 0}</b> W</span>`;
    }
    d.querySelectorAll('.tt-ex-pas').forEach(b => {
      b.onclick = () => {
        if (fige || (api && api.fini())) return;
        pas[b.dataset.k](+b.dataset.p);
        if (api) api.effacer();
        dessiner();
      };
    });
    d.querySelectorAll('.tt-ex-mat').forEach(b => {
      b.onclick = () => {
        if (fige || (api && api.fini())) return;
        et.mat = b.dataset.m;
        if (api) api.effacer();
        dessiner();
      };
    });
    if (window.ResizeObserver) new ResizeObserver(() => { if (Math.round(figZ.clientWidth) !== largeur) dessiner(); }).observe(figZ);
    dessiner();
    function figer() {
      fige = true;
      d.querySelectorAll('button').forEach(b => { b.disabled = true; });
      if (bVal) bVal.fermer();
      dessiner();
    }
    if (bVal) {
      bVal.onclick = () => {
        if (fige || api.fini()) return;
        const c = Object.assign({}, et, calc());
        if (o.cible(c)) { figer(); api.reussi(); return; }
        api.erreur(o.diag ? o.diag(c) : 'Ce n\'est pas encore le résultat demandé.');
        secouer(figZ);
      };
    }
    return { montrer() { if (o.montre) Object.assign(et, o.montre); figer(); }, etat: et };
  }
  // partie 'perso' avec un objectif à atteindre en réglant la paroi
  function partieParoi(o) {
    return { type: 'perso', q: o.q, solution: o.solution, monter: (zone, api) => paroiExplo(zone, o, api) };
  }
  // outil d'exploration seul, à placer dans l'énoncé d'un « À toi »
  const outilParoi = o => outil(div => paroiExplo(div, o || {}, null));

  /* ============================================================
     PLAN DE L'APPLICATION ET NAVIGATION (voir assets/sommaire.js)
     ============================================================ */
  const PLAN = [
    { n: 1, titre: 'Température et modes de transfert', desc: 'Kelvin et degré Celsius, conduction, convection, rayonnement, sens du transfert', fiche: 'fiche_1',
      parties: [{ nom: 'Température et modes de transfert', cours: 'module_1_cours', questions: 'module_1_questions' }] },
    { n: 2, titre: 'Flux thermique', desc: 'Le flux est une puissance : Φ = Q / Δt comme P = E / Δt ; Q = Φ × Δt comme E = P × Δt', fiche: 'fiche_2',
      parties: [{ nom: 'Flux thermique', cours: 'module_2_cours', questions: 'module_2_questions' }] },
    { n: 3, titre: 'Résistance thermique d\'une paroi', desc: 'Φ = ΔT / R<sub>th</sub> et R<sub>th</sub> = e / (λ × S)', fiche: 'fiche_3',
      parties: [{ nom: 'Résistance thermique d\'une paroi', cours: 'module_3_cours', questions: 'module_3_questions' }] },
    { n: 4, titre: 'Parois composées', desc: 'Couches accolées : R = R<sub>1</sub> + R<sub>2</sub> + R<sub>3</sub>, double vitrage, isolation', fiche: 'fiche_4',
      parties: [{ nom: 'Parois composées', cours: 'module_4_cours', questions: 'module_4_questions' }] },
    { n: 5, titre: 'Exercices du manuel', desc: 'Exercices 6 à 8 et 13 à 19 (p. 74-77), guidés pas à pas', exercices: 'module_5', exNom: 'Exercices 6 à 19', nbEx: 10 },
  ];
  window.SOM.init({ nom: 'Chapitre 5 : Flux et transferts thermiques', id: 'transferts-thermiques', cleEx: 'transferts-thermiques-exercices', plan: PLAN });
  const menu = cle => window.SOM.menu(cle);
  const accueil = zone => window.SOM.accueil(zone);
  const marquer = info => window.SOM.marquer(info);

  window.TT = Object.assign(window.TT || {}, {
    MOINS, fmt, cs, sci, lire, proche, fr, unite, o, fq, el, secouer, melanger, hasard, entre, champ, PARTIES,
    question, serie, confettis, fig, monter, outil, echelles, modes, MATERIAUX, slot, val, inc, paroi, partieSens, noteFluxNeg, noteDTNeg, schemaParoi, paroiRemplie,
    paroiExplo, partieParoi, outilParoi, PLAN, menu, accueil, marquer,
  });
})();
