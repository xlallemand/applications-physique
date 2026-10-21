/* ============================================================
   Moteur de l'application « Chapitre 1 : Énergie et puissance »
   (Terminale STI2D ; même moteur de questions que « Cinématique »
   et « Transport et distribution de l'électricité » ; navigation
   commune assets/sommaire.js, cours avec assets/cours.js)

   EP.fmt, EP.cs, EP.sci, EP.lire   écriture et lecture des nombres (virgule)
   EP.unite(v, 'W')                 valeur avec préfixe : 1,2 kW ; 54 mW
   EP.o, EP.fq.choix, EP.fq.nombre  fabriques d'options et de parties de question
   EP.PARTIES                       parties de question :
       'choix'    boutons à choisir
       'nombre'   valeur numérique (avec bouton ±)
       'gabarit'  expression à trous (ex. : P(t) = □ t + □)
       'sci'      écriture scientifique a × 10ⁿ
       'schema'   étiquettes à glisser sur un schéma (schéma de conversion)
       'perso'    outil propre : p.monter(zone, api) → { montrer() }
   EP.question(zone, q, cb, mode)   question en plusieurs parties (série, exercice, cours)
   EP.serie(opts)                   série de questions notée sur 20
   EP.fig(dessin)                   figure dessinée à la largeur disponible
   EP.graphe(o), EP.tracer(o, W)    graphiques P(t), E(t), I(t) avec aires hachurées
   EP.aireSous(pts, a, b)           aire sous une courbe affine par morceaux
   EP.partieAire(o)                 outil « aire sous la courbe » (intervalle à régler)
   EP.conv(o), EP.slot(id)          schéma de conversion d'énergie (HTML)
   EP.diagramme(o)                  diagramme énergétique (flèches proportionnelles)
   EP.step(zone)                    station de transfert d'énergie par pompage (activité 1)
   EP.menu(cle), EP.accueil(zone)   navigation commune (SOM) avec le plan de l'application

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
    const d = el('div', 'ph-valeur ep-gab');
    if (p.label) d.appendChild(el('span', 'ph-lab', p.label));
    // chaque case forme un groupe insécable avec le texte qui la suit (et le texte d'ouverture
    // avec la première case) : sur un petit écran, la ligne ne se coupe qu'entre deux groupes
    const champs = [];
    let grp = el('span', 'ep-gab-grp');
    d.appendChild(grp);
    p.morceaux.forEach(m => {
      if (typeof m === 'string') { grp.appendChild(el('span', 'ep-gab-txt', m)); return; }
      if (champs.length) { grp = el('span', 'ep-gab-grp'); d.appendChild(grp); }
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
     p.schema : HTML du schéma, avec des cases EP.slot(id)
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
     réponse » disponible tout de suite. EP.tout reste vrai ensuite :
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
      window.EP.partieEnCours = p;          // partie en cours (utile pour vérifier l'application)
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
    if (mode === 'cours' && window.EP.tout) inst.deplier();
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
      window.EP.questionEnCours = q;          // question en cours (utile pour vérifier l'application)
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
     EP.fig(dessin) renvoie un emplacement HTML ; dès qu'il est dans la
     page, dessin(W) y est appelé avec la largeur disponible W (et de
     nouveau quand la largeur change) : les textes gardent leur taille
     et restent lisibles sur un téléphone. Plusieurs figures par page.
     ============================================================ */
  const DESSINS = new Map();
  let nFig = 0, nMotif = 0;
  function fig(dessin, cls) {
    const k = String(++nFig);
    DESSINS.set(k, dessin);
    return `<div class="ep-fig${cls ? ' ' + cls : ''}" data-fig="${k}"></div>`;
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
    const l = racine.matches && racine.matches('.ep-fig[data-fig]') ? [racine] : [];
    racine.querySelectorAll('.ep-fig[data-fig]').forEach(x => l.push(x));
    l.forEach(x => { const f = DESSINS.get(x.dataset.fig); if (f) monter(x, f); });
  }
  new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(chercher))).observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener('DOMContentLoaded', () => chercher(document.body));

  /* ============================================================
     GRAPHIQUES : une grandeur en fonction du temps
     (courbes affines par morceaux : créneaux, rampes, triangles…)
     o = {
       xmin (0), xmax, ymin (0), ymax, pasX, pasY   grille
       gradX, gradY                                  pas des nombres (pasX, pasY par défaut)
       nomX, nomY                                    « t (s) », « P (W) »
       fmtY(v)                                       écriture des graduations verticales (ex. « 400 × 180 »)
       courbes: [[[x, y], …]]                        un saut vertical : deux points de même x
       aires: [{ de, a, k, motif } | { pts, motif }] sous la courbe k, de a à b, ou polygone ; motif 1, 2, 3 ou 4
       traits: [[x1, y1, x2, y2]]                    pointillés
       cotes: [{ x1, y1, x2, y2, t, pos }]           double flèche (horizontale ou verticale) et son texte
       textes: [{ x, y, t, ancre, dx, dy }]          textes posés sur le graphique
       points: [[x, y]], ratio, hMin, hMax, mg (marge gauche), mh (marge haute), aria
       calque(G)                                     SVG ajouté par-dessus (outils interactifs)
     }
     ============================================================ */
  // valeur d'une courbe en x (cote > 0 : limite à droite d'un saut ; cote < 0 : à gauche)
  function valeur(pts, x, cote) {
    for (let i = 0; i < pts.length - 1; i++) {
      const [x1, y1] = pts[i], [x2, y2] = pts[i + 1];
      if (x2 - x1 < 1e-12) {                                   // saut vertical en x1
        if (Math.abs(x - x1) < 1e-9) return cote > 0 ? y2 : y1;
        continue;
      }
      if (x >= x1 - 1e-9 && x <= x2 + 1e-9) {
        if (Math.abs(x - x2) < 1e-9 && cote > 0 && i + 2 < pts.length && Math.abs(pts[i + 2][0] - x2) < 1e-9) return pts[i + 2][1];
        return y1 + (y2 - y1) * (x - x1) / (x2 - x1);
      }
    }
    return 0;
  }
  // polygone compris entre la courbe et l'axe des temps, de a à b
  function sousCourbe(pts, a, b) {
    const P = [[a, 0], [a, valeur(pts, a, 1)]];
    pts.forEach(([x, y]) => { if (x > a + 1e-9 && x < b - 1e-9) P.push([x, y]); });
    P.push([b, valeur(pts, b, -1)], [b, 0]);
    return P;
  }
  // aire (positive) d'un polygone : formule du lacet
  function airePoly(P) {
    let s = 0;
    P.forEach(([x, y], i) => { const [x2, y2] = P[(i + 1) % P.length]; s += x * y2 - x2 * y; });
    return Math.abs(s) / 2;
  }
  const aireSous = (pts, a, b) => airePoly(sousCourbe(pts, a, b));
  const pasDe = (a, b, p) => { const t = []; for (let v = Math.ceil(a / p - 1e-9) * p; v <= b + 1e-9; v += p) t.push(+v.toFixed(9)); return t; };

  // motifs de hachures (identifiants uniques : plusieurs graphiques par page)
  function motifs(id) {
    const m = (k, rot, l) => `<pattern id="${id}-${k}" patternUnits="userSpaceOnUse" width="8" height="8" patternTransform="rotate(${rot})">` +
      `<rect width="8" height="8" class="ep-m-fond${k}"/>${l ? `<line x1="0" y1="0" x2="0" y2="8" class="ep-m-l${k}"/>` : ''}</pattern>`;
    return `<defs>${m(1, 45, 1)}${m(2, -45, 1)}${m(3, 0, 1)}${m(4, 0, 0)}</defs>`;
  }

  function tracer(o, W) {
    o = Object.assign({ xmin: 0, ymin: 0, ratio: .52, hMin: 210, hMax: 330, mg: 54, mh: 30 }, o);
    const H = Math.round(Math.min(o.hMax, Math.max(o.hMin, W * o.ratio)));
    // une cote posée sur l'axe des temps (durée Δt) se dessine sous les graduations
    const coteBas = c => Math.abs(c.y1 - c.y2) < 1e-9 && Math.abs(c.y1 - Math.max(o.ymin, Math.min(0, o.ymax))) < 1e-9;
    const m = { g: o.mg, d: 22, h: o.mh, b: (o.cotes || []).some(coteBas) ? 52 : 30 };
    const L = W - m.g - m.d, HH = H - m.h - m.b;
    const px = x => +(m.g + (x - o.xmin) / (o.xmax - o.xmin) * L).toFixed(1);
    const py = y => +(m.h + (o.ymax - y) / (o.ymax - o.ymin) * HH).toFixed(1);
    const xDe = X => o.xmin + (X - m.g) / L * (o.xmax - o.xmin);
    const X0 = px(Math.max(o.xmin, Math.min(0, o.xmax))), Y0 = py(Math.max(o.ymin, Math.min(0, o.ymax)));
    const id = 'ep-motif' + (++nMotif);
    let s = motifs(id);
    // grille
    pasDe(o.xmin, o.xmax, o.pasX).forEach(x => { s += `<line x1="${px(x)}" y1="${py(o.ymin)}" x2="${px(x)}" y2="${py(o.ymax)}" class="ep-g-grille"/>`; });
    pasDe(o.ymin, o.ymax, o.pasY).forEach(y => { s += `<line x1="${px(o.xmin)}" y1="${py(y)}" x2="${px(o.xmax)}" y2="${py(y)}" class="ep-g-grille"/>`; });
    // aires hachurées (sous les courbes)
    (o.aires || []).forEach(a => {
      const P = a.pts || sousCourbe(o.courbes[a.k || 0], a.de, a.a);
      s += `<polygon points="${P.map(([x, y]) => px(x) + ',' + py(y)).join(' ')}" fill="url(#${id}-${a.motif || 1})" class="ep-g-aire"/>`;
    });
    // axes et flèches
    s += `<line x1="${px(o.xmin)}" y1="${Y0}" x2="${px(o.xmax) + 12}" y2="${Y0}" class="ep-g-axe"/><path d="M${px(o.xmax) + 18},${Y0} l-9,-4.5 v9 z" class="ep-g-fleche"/>`;
    s += `<line x1="${X0}" y1="${py(o.ymin)}" x2="${X0}" y2="${py(o.ymax) - 12}" class="ep-g-axe"/><path d="M${X0},${py(o.ymax) - 18} l-4.5,9 h9 z" class="ep-g-fleche"/>`;
    // graduations (un nombre sur deux si elles sont trop serrées)
    let gx = o.gradX || o.pasX, gy = o.gradY || o.pasY;
    while (px(o.xmin + gx) - px(o.xmin) < 34) gx *= 2;
    while (py(o.ymin) - py(o.ymin + gy) < 18) gy *= 2;
    pasDe(o.xmin, o.xmax, gx).forEach(x => { if (Math.abs(x) > 1e-9) s += `<text x="${px(x)}" y="${Y0 + 17}" text-anchor="middle" class="ep-g-grad">${fmt(x)}</text>`; });
    pasDe(o.ymin, o.ymax, gy).forEach(y => { if (Math.abs(y) > 1e-9) s += `<text x="${X0 - 6}" y="${py(y) + 4}" text-anchor="end" class="ep-g-grad">${o.fmtY ? o.fmtY(y) : fmt(y)}</text>`; });
    // zéro : dans le coin si l'axe des temps est en bas, sur l'axe vertical sinon
    s += o.ymin < 0 ? `<text x="${X0 - 6}" y="${Y0 + 4}" text-anchor="end" class="ep-g-grad">0</text>` : `<text x="${X0 - 6}" y="${Y0 + 17}" text-anchor="end" class="ep-g-grad">0</text>`;
    // noms des axes
    s += `<text x="${px(o.xmax) + 16}" y="${Y0 - 9}" text-anchor="end" class="ep-g-nom">${o.nomX || 't (s)'}</text>`;
    s += `<text x="${X0 - (o.decalNomY || 8)}" y="${py(o.ymax) - 16}" text-anchor="end" class="ep-g-nom">${o.nomY || ''}</text>`;
    // pointillés
    (o.traits || []).forEach(([x1, y1, x2, y2]) => { s += `<line x1="${px(x1)}" y1="${py(y1)}" x2="${px(x2)}" y2="${py(y2)}" class="ep-g-trait"/>`; });
    // courbes
    (o.courbes || []).forEach(pts => { s += `<polyline points="${pts.map(([x, y]) => px(x) + ',' + py(y)).join(' ')}" class="ep-g-courbe"/>`; });
    (o.points || []).forEach(([x, y]) => { s += `<circle cx="${px(x)}" cy="${py(y)}" r="4.5" class="ep-g-point"/>`; });
    // cotes : doubles flèches avec leur texte
    (o.cotes || []).forEach(c => {
      const bas = coteBas(c), x1 = px(c.x1), y1 = py(c.y1) + (bas ? 28 : 0), x2 = px(c.x2), y2 = py(c.y2) + (bas ? 28 : 0);
      if (Math.abs(y1 - y2) < .5) {
        const a = Math.min(x1, x2), b = Math.max(x1, x2);
        s += `<line x1="${a + 2}" y1="${y1}" x2="${b - 2}" y2="${y1}" class="ep-g-cote"/><path d="M${a},${y1} l8,-4 v8 z M${b},${y1} l-8,-4 v8 z" class="ep-g-cote-f"/>`;
        s += `<text x="${(a + b) / 2}" y="${c.pos === 'dessus' ? y1 - 7 : y1 + 17}" text-anchor="middle" class="ep-g-cote-t">${c.t || ''}</text>`;
      } else {
        const a = Math.min(y1, y2), b = Math.max(y1, y2);
        s += `<line x1="${x1}" y1="${a + 2}" x2="${x1}" y2="${b - 2}" class="ep-g-cote"/><path d="M${x1},${a} l-4,8 h8 z M${x1},${b} l-4,-8 h8 z" class="ep-g-cote-f"/>`;
        s += `<text x="${c.pos === 'gauche' ? x1 - 7 : x1 + 7}" y="${(a + b) / 2 + 5}" text-anchor="${c.pos === 'gauche' ? 'end' : 'start'}" class="ep-g-cote-t">${c.t || ''}</text>`;
      }
    });
    (o.textes || []).forEach(t => { s += `<text x="${px(t.x) + (t.dx || 0)}" y="${py(t.y) + (t.dy || 0)}" text-anchor="${t.ancre || 'middle'}" class="ep-g-texte">${t.t}</text>`; });
    const G = { W, H, px, py, xDe, X0, Y0, m, o };
    if (o.calque) s += o.calque(G);
    return Object.assign(G, { contenu: s, svg: `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" class="ep-graphe" role="img" aria-label="${o.aria || 'Graphique'}">${s}</svg>` });
  }
  // graphique à placer dans une page (HTML) : il se dessine à la largeur disponible
  const graphe = (o, cls) => fig(W => tracer(o, W).svg, cls);

  /* ============================================================
     OUTIL « AIRE SOUS LA COURBE » (partie 'perso' des cours et des séries)
     L'élève règle les deux bornes de l'intervalle (poignées à glisser au
     doigt ou à la souris, ou boutons ◀ ▶), voit l'aire hachurée, puis
     valide : l'intervalle doit être celui demandé. Plusieurs exemplaires
     possibles dans une page (aucun identifiant fixe, aucun état global).
     o = { g (options du graphique, une seule courbe), de, a (intervalle demandé),
           pas (déplacement des bornes, g.pasX par défaut), t1, t2 (bornes au départ),
           ut (unité du temps, « s »), decoupe: [{ pts, motif }] (découpage montré une fois réussi),
           q (question), solution }
     ============================================================ */
  function partieAire(o) {
    const ut = o.ut || 's';
    return { type: 'perso', aire: o, q: o.q || `Règle le début et la fin de l'intervalle : de t = ${fmt(o.de)} ${ut} à t = ${fmt(o.a)} ${ut}. L'aire sous la courbe se hachure.`,
      solution: o.solution || `<p>Intervalle de t = ${fmt(o.de)} ${ut} à t = ${fmt(o.a)} ${ut}.</p>`, monter: (zone, api) => outilAire(zone, o, api) };
  }
  function outilAire(zone, o, api) {
    const g = Object.assign({ mh: 40, decalNomY: 18 }, o.g), pas = o.pas || g.pasX, ut = o.ut || 's';
    const xmin = g.xmin || 0, xmax = g.xmax;
    let t1 = o.t1 != null ? o.t1 : xmin, t2 = o.t2 != null ? o.t2 : xmin + pas, fige = false, glisse = 0, ech = null, largeur = 0;
    const d = el('div', 'ep-aire');
    const bornesHTML = k => `<div class="ep-aire-b"><span class="ep-aire-nom">${k === 1 ? 'Début' : 'Fin'} t<sub>${k}</sub></span>
      <button type="button" class="ep-aire-pas" data-b="${k}" data-s="-1" aria-label="${k === 1 ? 'Reculer le début' : 'Reculer la fin'}">◀</button>
      <output class="ep-aire-v" data-v="${k}"></output>
      <button type="button" class="ep-aire-pas" data-b="${k}" data-s="1" aria-label="${k === 1 ? 'Avancer le début' : 'Avancer la fin'}">▶</button></div>`;
    d.innerHTML = `<div class="ep-aire-g"><svg role="img" aria-label="${g.aria || 'Graphique'} ; intervalle réglable"></svg></div>
      <p class="ep-aire-aide">Fais glisser les poignées <b>1</b> et <b>2</b>, ou utilise les flèches.</p>
      <div class="ep-aire-cmd">${bornesHTML(1)}${bornesHTML(2)}</div>`;
    zone.appendChild(d);
    const svg = d.querySelector('svg'), boite = d.querySelector('.ep-aire-g');
    const bVal = boutonValider(zone);
    // bornes : trait vertical en pointillés et poignée numérotée en haut du graphique
    function bornes(G) {
      return [[t1, 1], [t2, 2]].map(([t, k]) => {
        const x = G.px(t), yh = G.m.h - 16;
        return `<line x1="${x}" y1="${yh}" x2="${x}" y2="${G.Y0}" class="ep-borne"/>` +
          `<g class="ep-poignee${fige ? ' fige' : ''}" data-h="${k}"><circle cx="${x}" cy="${yh}" r="22" class="ep-poignee-zone"/>` +
          `<circle cx="${x}" cy="${yh}" r="12" class="ep-poignee-rond"/><text x="${x}" y="${yh + 4.5}" text-anchor="middle" class="ep-poignee-t">${k}</text></g>`;
      }).join('');
    }
    function dessiner() {
      const W = Math.round(boite.clientWidth);
      if (!W) return;
      largeur = W;
      const a = Math.min(t1, t2), b = Math.max(t1, t2);
      const aires = fige && o.decoupe ? o.decoupe : (b > a ? [{ de: a, a: b, motif: 1 }] : []);
      ech = tracer(Object.assign({}, g, { aires, calque: bornes }), W);
      svg.setAttribute('viewBox', `0 0 ${W} ${ech.H}`);
      svg.setAttribute('width', W); svg.setAttribute('height', ech.H);
      svg.innerHTML = ech.contenu;
      d.querySelector('[data-v="1"]').textContent = `t₁ = ${fmt(t1)} ${ut}`;
      d.querySelector('[data-v="2"]').textContent = `t₂ = ${fmt(t2)} ${ut}`;
    }
    const caler = t => Math.max(xmin, Math.min(xmax, Math.round((t - xmin) / pas) * pas + xmin));
    function bouger(k, t) {
      if (fige || api.fini()) return;
      t = +caler(t).toFixed(9);
      if (k === 1) { if (t === t1) return; t1 = t; } else { if (t === t2) return; t2 = t; }
      api.effacer();
      dessiner();
    }
    // glisser une poignée (le graphique garde le défilement vertical de la page : touch-action: pan-y)
    svg.addEventListener('pointerdown', e => {
      if (fige || api.fini()) return;
      const h = e.target.closest('[data-h]');
      if (!h) return;
      glisse = +h.dataset.h;
      try { svg.setPointerCapture(e.pointerId); } catch (err) { /* rien */ }
      e.preventDefault();
    });
    svg.addEventListener('pointermove', e => {
      if (!glisse || !ech) return;
      const r = svg.getBoundingClientRect();
      bouger(glisse, ech.xDe((e.clientX - r.left) * largeur / r.width));
    });
    const lacher = () => { glisse = 0; };
    svg.addEventListener('pointerup', lacher);
    svg.addEventListener('pointercancel', lacher);
    d.querySelectorAll('.ep-aire-pas').forEach(b => {
      b.onclick = () => { const k = +b.dataset.b; bouger(k, (k === 1 ? t1 : t2) + (+b.dataset.s) * pas); };
    });
    if (window.ResizeObserver) new ResizeObserver(() => { if (Math.round(boite.clientWidth) !== largeur) dessiner(); }).observe(boite);
    dessiner();
    function figer() {
      fige = true;
      d.classList.add('fige');
      d.querySelectorAll('.ep-aire-pas').forEach(b => { b.disabled = true; });
      bVal.fermer();
      dessiner();
    }
    bVal.onclick = () => {
      if (fige || api.fini()) return;
      const a = Math.min(t1, t2), b = Math.max(t1, t2);
      const okA = Math.abs(a - o.de) < 1e-9, okB = Math.abs(b - o.a) < 1e-9;
      if (okA && okB) { t1 = a; t2 = b; figer(); api.reussi(); return; }
      if (a === b) { secouer(boite); api.message('Écarte les deux poignées : l\'intervalle est vide.'); return; }
      const msg = [];
      if (!okA) msg.push(`le <b>début</b> de l'intervalle doit être à t = ${fmt(o.de)} ${ut} (tu as mis ${fmt(a)} ${ut})`);
      if (!okB) msg.push(`la <b>fin</b> de l'intervalle doit être à t = ${fmt(o.a)} ${ut} (tu as mis ${fmt(b)} ${ut})`);
      api.erreur(msg.join(' ; ').replace(/^l/, 'L') + '. Lis les dates sous l\'axe des temps.');
      secouer(boite);
    };
    return { montrer() { t1 = o.de; t2 = o.a; figer(); } };
  }

  /* ============================================================
     SCHÉMA DE CONVERSION D'ÉNERGIE (HTML, voir ep.css)
       apportée ──▶ [ appareil (η) ] ──▶ utile
                           │
                           ▼ perdue
     o = { appareil, eta, grandeur ('Énergie' ou 'Puissance'),
           a, u, p : { f (forme d'énergie), v (valeur) } en HTML : texte, EP.slot(id) ou EP.inc() }
     En ligne sur un écran large, à la verticale sur un téléphone.
     ============================================================ */
  const slot = id => `<span class="sc-slot" data-slot="${id}"><span class="sc-slot-ph">?</span></span>`;
  const val = t => `<span class="sc-val">${t}</span>`;
  const inc = () => '<span class="sc-val inconnue">?</span>';
  function conv(o) {
    const gr = o.grandeur || 'Énergie';
    const z = (cle, nom, x) => `<div class="ep-cv-z ep-cv-${cle}"><p class="ep-cv-t">${gr} ${nom}</p>` +
      `${x && x.f ? `<div class="ep-cv-f">${x.f}</div>` : ''}${x && x.v ? `<div class="ep-cv-v">${x.v}</div>` : ''}</div>`;
    return `<div class="ep-cv" role="group" aria-label="Schéma de conversion d'énergie : ${gr.toLowerCase()} apportée, ${o.appareil.replace(/<[^>]+>/g, '')}, ${gr.toLowerCase()} utile et ${gr.toLowerCase()} perdue">
      ${z('a', 'apportée', o.a)}
      <div class="ep-cv-fl ep-cv-fa" aria-hidden="true"></div>
      <div class="ep-cv-ap"><b>${o.appareil}</b>${o.eta ? `<div class="ep-cv-eta">${o.eta}</div>` : ''}</div>
      <div class="ep-cv-fl ep-cv-fu" aria-hidden="true"></div>
      ${z('u', 'utile', o.u)}
      <div class="ep-cv-fl ep-cv-fp" aria-hidden="true"></div>
      ${z('p', 'perdue', o.p)}
    </div>`;
  }

  /* ============================================================
     DIAGRAMME ÉNERGÉTIQUE (SVG) : flèches de largeur proportionnelle
     o = { entree: { t, v, k }, appareil, sorties: [{ t, v, k }, { t, v, k }], aria }
       t : nom de l'énergie, v : valeur écrite (« 60 J » ou « ? »), k : valeur numérique (largeur)
     ============================================================ */
  function diagramme(o) {
    return fig(W => {
      const H = 252, cy = 140;
      const kmax = Math.max(o.entree.k, ...o.sorties.map(s => s.k));
      const ep = k => 5 + 26 * k / kmax;
      // nom de l'appareil sur deux lignes au plus, dans un cadre ajusté au texte
      const mots = String(o.appareil).split(' '), coupe = mots.length > 1 ? Math.ceil(mots.length / 2) : 1;
      const lignes = mots.length > 1 ? [mots.slice(0, coupe).join(' '), mots.slice(coupe).join(' ')] : [o.appareil];
      const bw = Math.max(90, Math.max(...lignes.map(l => l.length)) * 7.4 + 22), bh = 60;
      const cx = Math.max(bw / 2 + 92, W * .48), xg = cx - bw / 2, xd = cx + bw / 2;
      // flèche horizontale épaisse de x1 à x2 (pointe à droite)
      const fleche = (x1, x2, y, e) => `<path d="M${x1},${y - e / 2} H${x2 - 12} V${y - e / 2 - 6} L${x2},${y} L${x2 - 12},${y + e / 2 + 6} V${y + e / 2} H${x1} Z" class="ep-d-fleche"/>`;
      // étiquette sur trois lignes : « Énergie », la forme, la valeur ; y0 : ligne du haut
      const etiq = (x, y0, s, ancre) => {
        const m = s.t.split(' '), l = [m[0], m.slice(1).join(' ')].filter(Boolean);
        return l.map((t, i) => `<text x="${x}" y="${y0 + i * 15}" text-anchor="${ancre}" class="ep-d-t">${t}</text>`).join('') +
          `<text x="${x}" y="${y0 + l.length * 15 + 2}" text-anchor="${ancre}" class="ep-d-v">(${s.v})</text>`;
      };
      const eE = ep(o.entree.k), s1 = o.sorties[0], s2 = o.sorties[1], e1 = ep(s1.k), e2 = ep(s2.k);
      const y1 = cy - 34, y2 = cy + 34;
      let s = fleche(6, xg + 2, cy, eE) + etiq(6, cy - eE / 2 - 44, o.entree, 'start');
      s += fleche(xd - 2, W - 6, y1, e1) + etiq(W - 6, y1 - e1 / 2 - 44, s1, 'end');
      s += fleche(xd - 2, W - 6, y2, e2) + etiq(W - 6, y2 + e2 / 2 + 20, s2, 'end');
      s += `<rect x="${xg}" y="${cy - bh / 2}" width="${bw}" height="${bh}" rx="14" class="ep-d-app"/>`;
      lignes.forEach((l, i) => { s += `<text x="${cx}" y="${cy + 5 + (i - (lignes.length - 1) / 2) * 17}" text-anchor="middle" class="ep-d-nom">${l}</text>`; });
      return `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" class="ep-diag" role="img" aria-label="${o.aria || `Diagramme énergétique : ${o.entree.t} ${o.entree.v} vers ${o.appareil}, ${s1.t} ${s1.v}, ${s2.t} ${s2.v}`}">${s}</svg>`;
    }, 'ep-fig-diag');
  }

  /* ============================================================
     STATION DE TRANSFERT D'ÉNERGIE PAR POMPAGE (activité 1 p. 24)
     EP.step(zone) : illustration (SVG à la largeur disponible) et choix
     du mode : turbinage (l'eau descend, on produit de l'électricité) ou
     pompage (on consomme de l'électricité pour remonter l'eau).
     Renvoie { mode() } ; zone reçoit l'événement 'ep-mode' à chaque changement.
     ============================================================ */
  function step(zone) {
    let mode = 'turbinage';
    zone.innerHTML = `<div class="ep-step">
        <div class="ep-step-modes" role="group" aria-label="Mode de fonctionnement">
          <button type="button" class="btn-secondary" data-m="turbinage" aria-pressed="true">Turbinage</button>
          <button type="button" class="btn-secondary" data-m="pompage" aria-pressed="false">Pompage</button>
        </div>
        <div class="ep-step-fig"></div>
        <p class="ep-step-txt" aria-live="polite"></p>
      </div>`;
    const figZone = zone.querySelector('.ep-step-fig'), txt = zone.querySelector('.ep-step-txt');
    let largeur = 0;
    function dessiner() {
      const W = Math.round(figZone.clientWidth);
      if (!W) return;
      largeur = W;
      const petit = W < 520, H = petit ? 300 : 320, T = mode === 'turbinage';
      // relief : bassin supérieur en haut à gauche, pente, usine au pied de la pente, bassin inférieur à droite
      const yh = 100, yb = H - 70, xh = W * .17, xb = W * .83, lh = Math.min(70, W * .14), lb = Math.min(76, W * .14);
      const xs1 = xh + lh + 4, xu = W * .6, xs2 = xu - 52;
      let s = `<path d="M0,${yh} L${xh - lh},${yh} Q${xh},${yh + 30} ${xh + lh},${yh} L${xs1},${yh} L${xs2},${yb} L${xb - lb},${yb} Q${xb},${yb + 30} ${xb + lb},${yb} L${W},${yb} L${W},${H} L0,${H} Z" class="ep-s-sol"/>`;
      s += `<path d="M${xh - lh + 3},${yh} Q${xh},${yh + 30} ${xh + lh - 3},${yh} Z" class="ep-s-eau"/>`;
      s += `<path d="M${xb - lb + 3},${yb} Q${xb},${yb + 30} ${xb + lb - 3},${yb} Z" class="ep-s-eau"/>`;
      // conduite forcée : du fond du bassin supérieur à l'usine, puis de l'usine au bassin inférieur
      const c1 = `M${xh + lh * .45},${yh + 10} L${xs1 + 2},${yh + 16} L${xs2 + 2},${yb + 12} L${xu - 40},${yb - 12}`;
      const c2 = `M${xu + 40},${yb - 12} L${xb - lb * .5},${yb + 10}`;
      [c1, c2].forEach(c => { s += `<path d="${c}" class="ep-s-tube"/><path d="${c}" class="ep-s-flux${T ? '' : ' inverse'}"/>`; });
      // usine (machines réversibles)
      s += `<rect x="${xu - 42}" y="${yb - 42}" width="84" height="44" rx="8" class="ep-s-usine"/>`;
      s += `<text x="${xu}" y="${yb - 24}" text-anchor="middle" class="ep-s-usine-t">${T ? 'turbine +' : 'moteur +'}</text><text x="${xu}" y="${yb - 9}" text-anchor="middle" class="ep-s-usine-t">${T ? 'alternateur' : 'pompe'}</text>`;
      // ligne électrique vers le réseau ; la flèche indique le sens de l'énergie électrique
      const yl = 46, xl = W - 12, xm = (xu + xl) / 2, lf = Math.min(60, (xl - xu) * .45);
      s += `<path d="M${xu},${yb - 42} L${xu},${yl} L${xl},${yl}" class="ep-s-ligne"/><circle cx="${xl}" cy="${yl}" r="4" class="ep-s-elec-f"/>`;
      s += `<text x="${xl}" y="${yl - 12}" text-anchor="end" class="ep-s-t">réseau électrique</text>`;
      s += T ? `<path d="M${xm - lf / 2},${yl + 18} h${lf - 10}" class="ep-s-elec"/><path d="M${xm + lf / 2},${yl + 18} l-11,-6 v12 z" class="ep-s-elec-f"/>`
        : `<path d="M${xm + lf / 2},${yl + 18} h-${lf - 10}" class="ep-s-elec"/><path d="M${xm - lf / 2},${yl + 18} l11,-6 v12 z" class="ep-s-elec-f"/>`;
      s += `<text x="${xl}" y="${yl + 42}" text-anchor="end" class="ep-s-t2">${T ? 'électricité produite' : 'électricité consommée'}</text>`;
      // altitudes et noms des bassins
      s += `<text x="${Math.max(6, xh - lh)}" y="${yh - 26}" class="ep-s-t">Bassin supérieur</text><text x="${Math.max(6, xh - lh)}" y="${yh - 10}" class="ep-s-v">z = 1 590 m</text>`;
      s += `<text x="${Math.min(W - 6, xb + lb)}" y="${yb + 40}" text-anchor="end" class="ep-s-t">Bassin inférieur</text><text x="${Math.min(W - 6, xb + lb)}" y="${yb + 56}" text-anchor="end" class="ep-s-v">z = 770 m</text>`;
      // débit, dans la montagne sous la pente
      const mx = (xs1 + xs2) / 2 - 16, my = (yh + yb) / 2 + 40;
      s += `<text x="${mx}" y="${my}" text-anchor="end" class="ep-s-v">${T ? '216' : '135'} m³/s</text>`;
      s += `<text x="${mx}" y="${my + 16}" text-anchor="end" class="ep-s-t2">${T ? 'l\'eau descend' : 'l\'eau remonte'}</text>`;
      figZone.innerHTML = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" class="ep-s-svg" role="img" aria-label="Station de pompage en ${mode} : ${T ? 'l\'eau descend du bassin supérieur (1 590 m) vers le bassin inférieur (770 m) en traversant l\'usine, qui envoie de l\'électricité sur le réseau' : 'l\'usine prend de l\'électricité sur le réseau pour remonter l\'eau du bassin inférieur (770 m) vers le bassin supérieur (1 590 m)'}">${s}</svg>`;
    }
    function changer(m) {
      mode = m;
      zone.querySelectorAll('[data-m]').forEach(b => b.setAttribute('aria-pressed', b.dataset.m === m));
      txt.innerHTML = m === 'turbinage'
        ? '<b>Turbinage.</b> L\'eau descend du bassin supérieur vers le bassin inférieur (débit : 216 m³ par seconde). Elle fait tourner une <b>turbine</b> reliée à un <b>alternateur</b>, qui envoie de l\'énergie électrique sur le réseau.'
        : '<b>Pompage.</b> Les 8 <b>pompes</b> (150 MW chacune) prennent de l\'énergie électrique sur le réseau pour remonter l\'eau du bassin inférieur vers le bassin supérieur (débit : 135 m³ par seconde).';
      largeur = 0;
      dessiner();
      zone.dispatchEvent(new CustomEvent('ep-mode', { detail: m }));
    }
    zone.querySelectorAll('[data-m]').forEach(b => { b.onclick = () => changer(b.dataset.m); });
    if (window.ResizeObserver) new ResizeObserver(() => { if (Math.round(figZone.clientWidth) !== largeur) dessiner(); }).observe(figZone);
    changer('turbinage');
    return { mode: () => mode };
  }

  /* ============================================================
     PLAN DE L'APPLICATION ET NAVIGATION (voir assets/sommaire.js)
     ============================================================ */
  const PLAN = [
    { n: 1, titre: 'Rendement et schéma de conversion', desc: 'Formes d\'énergie, schéma de conversion, rendement η = P<sub>u</sub> / P<sub>a</sub>', fiche: 'fiche_1',
      parties: [{ nom: 'Rendement et schéma de conversion', simulation: 'module_1_simulation', cours: 'module_1_cours', questions: 'module_1_questions', noms: { simulation: 'Activité : la STEP' } }] },
    { n: 2, titre: 'Puissance moyenne et instantanée', desc: 'P = E / Δt ; la puissance instantanée est la dérivée de l\'énergie', fiche: 'fiche_2',
      parties: [{ nom: 'Puissance moyenne et instantanée', cours: 'module_2_cours', questions: 'module_2_questions' }] },
    { n: 3, titre: 'Calcul de l\'énergie', desc: 'E = P × Δt, aire sous la courbe P(t), autonomie', fiche: 'fiche_3',
      parties: [{ nom: 'Calcul de l\'énergie', cours: 'module_3_cours', questions: 'module_3_questions' }] },
    { n: 4, titre: 'Exercices du manuel', desc: 'Les exercices 7 à 16 (p. 30 à 32), guidés pas à pas', exercices: 'module_4', exNom: 'Exercices 7 à 16', nbEx: 10 },
  ];
  window.SOM.init({ nom: 'Chapitre 1 : Énergie et puissance', id: 'energie-puissance', cleEx: 'energie-puissance-exercices', plan: PLAN });
  const menu = cle => window.SOM.menu(cle);
  const accueil = zone => window.SOM.accueil(zone);
  const marquer = info => window.SOM.marquer(info);

  window.EP = Object.assign(window.EP || {}, {
    MOINS, fmt, cs, sci, lire, proche, fr, unite, o, fq, el, secouer, melanger, hasard, entre, champ, PARTIES,
    question, serie, confettis, fig, monter, tracer, graphe, valeur, sousCourbe, airePoly, aireSous, partieAire,
    slot, val, inc, conv, diagramme, step, PLAN, menu, accueil, marquer,
  });
})();
