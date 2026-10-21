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
   PFD.couleurs(noms)                   une couleur différente pour chaque force d'un dessin
   PFD.scene(s, o), PFD.sceneRemplie(s) dessin d'une situation (SVG), avec ses forces (flèches superposées décalées)
   PFD.diagramme(sys, objets), PFD.diagrammeDe(s, etat)
                                        diagramme objet-action (SVG)
   PFD.bilan(s, opts)                   bilan des forces étape par étape (situations : modules/situations.js),
                                        méthode du diagramme objet-action : actions à distance, objets qui
                                        touchent le système, force de l'air négligeable ou non, puis tracé
                                        des forces sur le schéma, noms, compensation
   PFD.infoForces()                     infographie : forces à distance, forces de contact
   PFD.chrono(o)                        chronophotographie animée (trajectoire rectiligne, circulaire ou
                                        curviligne ; mouvement uniforme, accéléré, décéléré)
   PFD.partieMouvement(o)               décrire un mouvement en deux mots (trajectoire, puis vitesse)
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
  // F⃗archi : poussée d'Archimède (eau, huile, air…) ; F⃗air : force de l'air (ses frottements)
  const NOMS = { P: ['P'], RN: ['R', 'N'], R: ['R'], f: ['f'], T: ['T'], Farchi: ['F', 'archi'], Fair: ['F', 'air'], Fm: ['F', 'm'], Fmag: ['F', 'mag'], Felec: ['F', 'élec'], Fpied: ['F', 'pied'], F: ['F'] };
  const nomV = k => V(...NOMS[k]);
  // ce que désigne chaque nom (diagnostic d'un nom mal choisi)
  const SENS_NOM = {
    P: `${nomV('P')} est le <b>poids</b> : la force exercée par la Terre.`,
    RN: `${nomV('RN')} est la <b>réaction normale</b> du support, perpendiculaire au support (N comme normale).`,
    R: `${nomV('R')} est la <b>réaction</b> du support (<span class="vec-nom">R</span> = <span class="vec-nom">R</span><sub>N</sub> + <span class="vec-nom">f</span>).`,
    f: `${nomV('f')} désigne les <b>frottements</b>.`,
    T: `${nomV('T')} est la <b>tension</b> d'un fil, d'un ressort ou d'une corde.`,
    Farchi: `${nomV('Farchi')} est la <b>poussée d'Archimède</b> exercée par un fluide (eau, huile, air…), verticale vers le haut.`,
    Fair: `${nomV('Fair')} est la force exercée par l'<b>air</b> (ses frottements).`,
    Fm: `${nomV('Fm')} est la <b>force motrice</b>.`,
    Fmag: `${nomV('Fmag')} est la force <b>magnétique</b> exercée par un aimant.`,
    Felec: `${nomV('Felec')} est la force <b>électrique</b> exercée par un objet chargé.`,
    Fpied: `${nomV('Fpied')} est la force exercée par le <b>pied</b>.`,
    F: `${nomV('F')} est une force quelconque (ici, celle de la corde).`,
  };
  // largeur d'un nom en SVG
  const largeurNom = k => { const [p, s] = NOMS[k]; return p.length * 9.5 + (s ? s.length * 6.6 : 0); };
  // nom en SVG (lettre, indice, petite flèche au-dessus) ; x : centre, y : ligne de base ; coul : couleur de la force
  function nomSVG(k, x, y, cls, coul) {
    const [p, s] = NOMS[k];
    const wp = p.length * 9.5, ws = s ? s.length * 6.6 : 0, x0 = x - (wp + ws) / 2;
    const ya = y - 15, x2 = x0 + Math.max(wp, 9) + 1;
    return `<g class="pfd-nom${cls ? ' ' + cls : ''}"${coul ? ` style="color:${coul}"` : ''}><text x="${x0.toFixed(1)}" y="${y.toFixed(1)}">${p}${s ? `<tspan dy="4" font-size="10.5">${s}</tspan>` : ''}</text>` +
      `<path d="M${(x0 + 1).toFixed(1)},${ya.toFixed(1)} H${x2.toFixed(1)} M${(x2 - 3).toFixed(1)},${(ya - 2.6).toFixed(1)} L${x2.toFixed(1)},${ya.toFixed(1)} L${(x2 - 3).toFixed(1)},${(ya + 2.6).toFixed(1)}"/></g>`;
  }

  /* ============================================================
     COULEURS DES VECTEURS FORCES : une couleur différente pour chaque
     force d'un même dessin (attributs de présentation des SVG, comme
     VEC.C). La couleur suit le nom de la force (le poids est toujours
     orange, la réaction du support bleue…) ; si deux forces d'un même
     dessin ont la même couleur, la seconde prend une couleur libre.
     ============================================================ */
  const COUL = { P: '#d9480f', RN: '#1971c2', R: '#1971c2', f: '#c2255c', T: '#5c940d', Farchi: '#0b7285', Fair: '#1098ad',
    Fm: '#b35c00', F: '#b35c00', Fpied: '#5c940d', Fmag: '#862e9c', Felec: '#862e9c' };
  const COUL_LIBRES = ['#5c940d', '#862e9c', '#b35c00', '#c2255c', '#1971c2', '#0b7285', '#d9480f', '#1098ad'];
  const COUL_QUAD = ['#d9480f', '#1971c2', '#5c940d', '#862e9c'];      // F⃗₁, F⃗₂… dans le quadrillage
  function couleurs(noms) {
    const res = noms.map(() => null), prises = [];
    // d'abord la couleur propre à chaque nom, puis une couleur libre pour les doublons
    noms.forEach((k, i) => { const c = COUL[k]; if (c && prises.indexOf(c) === -1) { res[i] = c; prises.push(c); } });
    noms.forEach((k, i) => {
      if (res[i]) return;
      res[i] = COUL_LIBRES.find(x => prises.indexOf(x) === -1) || COUL_LIBRES[0];
      prises.push(res[i]);
    });
    return res;
  }
  const couleursForces = fs => couleurs(fs.map(f => f.noms[0]));

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
     o = { forces: [{ pt, ang, nom, num, etat ('ok', 'ko', 'actif'), coul, cote, L }], points (cliquables), actif (point choisi) }
     L : longueur propre d'une flèche (sinon s.lf) : des forces qui se compensent ont
     des longueurs qui s'équilibrent (ex. F⃗archi = P⃗ + T⃗ en longueur).
     Chaque force a sa couleur (coul) ; l'état d'un tracé se lit sur sa pastille
     numérotée (verte si juste, rouge si faux) et une flèche fausse est en tirets.
     ============================================================ */
  const LF = 58, HS = 256;                        // longueur des flèches (sans souci d'échelle), hauteur du dessin
  function fleche(x, y, ang, cls, dec, lf, coul) {
    const r = ang * Math.PI / 180, c = Math.cos(r), s = -Math.sin(r), L = lf || LF;
    const x1 = x - s * dec, y1 = y + c * dec, x2 = x1 + L * c, y2 = y1 + L * s, bx = x2 - 11 * c, by = y2 - 11 * s;
    const f = v => v.toFixed(1);
    return { svg: `<g class="pfd-f${cls ? ' ' + cls : ''}"${coul ? ` style="color:${coul}"` : ''}><line x1="${f(x1)}" y1="${f(y1)}" x2="${f(bx)}" y2="${f(by)}"/><path d="M${f(x2)},${f(y2)} L${f(bx - 5.5 * s)},${f(by + 5.5 * c)} L${f(bx + 5.5 * s)},${f(by - 5.5 * c)} Z"/></g>`, x2, y2, c, s };
  }
  // Deux flèches qui se superposeraient (sur la même droite, segments qui se recouvrent) :
  // on les écarte toutes les deux de 2 px perpendiculairement, chacune d'un côté, pour qu'on
  // voie les deux (le nom d'une flèche décalée s'écrit du côté de son décalage).
  // a, b : { x, y, c, s, L } (départ, direction unitaire, longueur) ; ea, eb : décalages
  function recouvre(a, ea, b, eb) {
    if (Math.abs(a.c * b.s - a.s * b.c) > .06) return false;              // pas parallèles
    const meme = a.c * b.c + a.s * b.s > 0;                               // même sens : les pointes se gênent
    const ax = a.x - a.s * ea, ay = a.y + a.c * ea, bx = b.x - b.s * eb, by = b.y + b.c * eb;
    if (Math.abs((bx - ax) * -a.s + (by - ay) * a.c) >= (meme ? 11 : 5)) return false;
    // recouvrement des deux segments, projetés sur la direction de a
    const t1 = (bx - ax) * a.c + (by - ay) * a.s, t2 = t1 + b.L * (b.c * a.c + b.s * a.s);
    return Math.min(a.L, Math.max(t1, t2)) - Math.max(0, Math.min(t1, t2)) > 3;
  }
  const ECART = 2;                                 // décalage de chaque flèche superposée (px)
  function decalages(geo) {
    const dec = geo.map(() => 0);
    // groupes de flèches qui se recouvrent (de proche en proche)
    const groupe = geo.map((_, i) => i);
    const chef = i => (groupe[i] === i ? i : (groupe[i] = chef(groupe[i])));
    geo.forEach((a, i) => {
      if (!a) return;
      for (let j = 0; j < i; j++) if (geo[j] && recouvre(geo[j], 0, a, 0)) groupe[chef(i)] = chef(j);
    });
    const groupes = {};
    geo.forEach((a, i) => { if (a) (groupes[chef(i)] = groupes[chef(i)] || []).push(i); });
    Object.keys(groupes).forEach(k => {
      const g = groupes[k];
      if (g.length < 2) return;
      // repère du groupe : la première flèche ; n = (−s, c), côté vers lequel une flèche est décalée
      const r = geo[g[0]], pos = i => (geo[i].x - r.x) * -r.s + (geo[i].y - r.y) * r.c;
      // les flèches déjà un peu écartées gardent leur ordre ; à égalité, la première du côté +
      g.slice().sort((i, j) => pos(j) - pos(i) || i - j).forEach((i, k) => {
        const e = ECART * (g.length - 1 - 2 * k);
        // une flèche de sens opposé à la première a sa normale inversée
        dec[i] = geo[i].c * r.c + geo[i].s * r.s > 0 ? e : -e;
      });
    });
    return dec;
  }
  function scene(s, o) {
    o = o || {};
    const fs = o.forces || [];
    const geo = fs.map(f => {
      if (!f || f.pt == null || f.ang == null) return null;
      const r = f.ang * Math.PI / 180, p = s.points[f.pt];
      return { x: p[0], y: p[1], c: Math.cos(r), s: -Math.sin(r), L: f.L || s.lf || LF };
    });
    const dec = decalages(geo);
    let g = s.dessin;
    fs.forEach((f, i) => {
      if (!geo[i]) return;
      const p = s.points[f.pt], a = fleche(p[0], p[1], f.ang, f.etat, dec[i], f.L || s.lf, f.coul);
      g += a.svg;
      // nom au-delà de la pointe, sur le côté ; une flèche décalée a son nom du côté du décalage
      // (f.cote = −1 : nom de l'autre côté, quand il gênerait un autre nom) ; une flèche
      // verticale décalée écarte son nom de toute sa demi-largeur, pour qu'il ne tombe pas
      // sur la flèche voisine, plus longue (F⃗archi et f⃗ de la goutte)
      const ecart = f.nom && dec[i] && Math.abs(a.s) > .7 ? Math.max(9, 5 + largeurNom(f.nom) / 2) : 9;
      const cote = (f.cote || (dec[i] < 0 ? -1 : 1)) * ecart;
      const lx = a.x2 + a.c * 15 - a.s * cote, ly = a.y2 + a.s * 15 + a.c * cote;
      if (f.nom) g += nomSVG(f.nom, lx, ly + 6, f.etat, f.coul);
      else if (f.num) g += `<g class="pfd-num${f.etat ? ' ' + f.etat : ''}"${!f.etat && f.coul ? ` style="color:${f.coul}"` : ''}><circle cx="${lx.toFixed(1)}" cy="${ly.toFixed(1)}" r="8.5"/><text x="${lx.toFixed(1)}" y="${(ly + 4).toFixed(1)}" text-anchor="middle">${f.num}</text></g>`;
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
     DIAGRAMME OBJET-ACTION (SVG, repère 360 × 200)
     Le système au centre ; autour, chaque objet qui agit sur lui, relié
     par un trait en pointillés (action à distance) ou plein (action de
     contact) ; trait barré : force négligeable. Le nom des forces est
     écrit près du trait, dans la couleur de leur vecteur. Un objet donne
     une force ; quand on la décompose (<span class="vec-nom">R</span> = <span class="vec-nom">R</span>ₙ + <span class="vec-nom">f</span>), ses composantes sont
     reliées par « + ».
     PFD.diagramme(sys, objets, o)
       objets : [{ nom, type ('distance' | 'contact' | null : pas encore choisi),
                   neglige, forces: [{ nom (clé de NOMS), coul }], note }]
       placement : le premier objet (la Terre) en haut à droite, les trois
       suivants en bas, les autres en haut à gauche
     PFD.diagrammeDe(s, etat) : celui d'une situation ; etat (pendant le bilan) :
       { bulles() : [{ a (acteur, distracteur ou action à distance absente), type }] dessinées par l'élève,
         air: null (pas encore dit) | true | false, noms: [clé du nom choisi, par force] }
     ============================================================ */
  const HD = 200;
  const court = t => t.replace(/^(la |le |les |l'|l’)/i, '');
  const lgTexte = t => t.length * 7.5;                       // largeur d'un texte de 13 px, gras
  function diagramme(sys, objets, o) {
    o = o || {};
    const f1 = v => v.toFixed(1);
    const S = { x: 180, y: 100, rx: Math.min(112, lgTexte(sys) / 2 + 18), ry: 20 };
    const haut = [], bas = [];
    objets.forEach((ob, i) => { if (i === 0) haut.push(ob); else if (bas.length < 3) bas.push(ob); else haut.unshift(ob); });
    const XH = [[], [280], [80, 280]], XB = [[], [180], [92, 268], [62, 180, 298]];
    const pl = haut.map((ob, k) => ({ ob, x: XH[haut.length][k], y: 32, max: 150 }))
      .concat(bas.map((ob, k) => ({ ob, x: XB[bas.length][k], y: 170, max: bas.length === 3 ? 114 : 160 })));
    // point du bord d'une ellipse, dans la direction (dx, dy)
    const bord = (e, dx, dy) => { const l = Math.hypot(dx, dy), ux = dx / l, uy = dy / l, t = 1 / Math.hypot(ux / e.rx, uy / e.ry); return [e.x + t * ux, e.y + t * uy]; };
    // nom dans une bulle (resserré s'il est trop long)
    const texte = (e, t) => `<text x="${e.x}" y="${e.y + 4.5}" text-anchor="middle" class="pfd-do-t"${lgTexte(t) > 2 * e.rx - 14 ? ` textLength="${(2 * e.rx - 16).toFixed(0)}" lengthAdjust="spacingAndGlyphs"` : ''}>${t}</text>`;
    let traits = '', bulles = `<ellipse cx="${S.x}" cy="${S.y}" rx="${f1(S.rx)}" ry="${S.ry}" class="pfd-do-sys"/>${texte(S, sys)}`, noms = '';
    // étendue horizontale du dessin : le cadre est resserré autour (texte plus grand à l'écran)
    let xmin = S.x - S.rx, xmax = S.x + S.rx;
    const etendre = (a, b) => { xmin = Math.min(xmin, a); xmax = Math.max(xmax, b); };
    pl.forEach(p => {
      const ob = p.ob, e = { x: p.x, y: p.y, rx: Math.min(p.max / 2, lgTexte(ob.nom) / 2 + 13), ry: 16 };
      etendre(e.x - e.rx, e.x + e.rx);
      bulles += `<ellipse cx="${e.x}" cy="${e.y}" rx="${f1(e.rx)}" ry="${e.ry}" class="pfd-do-obj"/>${texte(e, ob.nom)}`;
      const [x1, y1] = bord(S, e.x - S.x, e.y - S.y), [x2, y2] = bord(e, S.x - e.x, S.y - e.y);
      traits += `<line x1="${f1(x1)}" y1="${f1(y1)}" x2="${f1(x2)}" y2="${f1(y2)}" class="pfd-do-l${ob.type === 'distance' ? ' dist' : ob.type === 'contact' ? '' : ' vide'}"/>`;
      // milieu du trait, direction du trait (ux, uy) et normale tournée vers l'extérieur (nx, ny)
      const mx = (x1 + x2) / 2, my = (y1 + y2) / 2, l = Math.hypot(x2 - x1, y2 - y1), ux = (x2 - x1) / l, uy = (y2 - y1) / l;
      let nx = -uy, ny = ux;
      // côté des noms : vers l'extérieur pour les objets du bas, au-dessus du trait pour ceux du haut
      if (e.y < S.y ? ny > 0 : (nx * (e.x - S.x) < 0 || (Math.abs(e.x - S.x) < 1 && nx < 0))) { nx = -nx; ny = -ny; }
      const ancre = nx > .3 ? 'start' : nx < -.3 ? 'end' : 'middle';
      if (ob.neglige) {
        // trait barré : un petit trait en travers (à 60° du trait), et le mot « négligeable »
        const vx = ux * .5 - uy * .866, vy = ux * .866 + uy * .5;
        traits += `<line x1="${f1(mx - 11 * vx)}" y1="${f1(my - 11 * vy)}" x2="${f1(mx + 11 * vx)}" y2="${f1(my + 11 * vy)}" class="pfd-do-barre"/>`;
        const xn = mx + nx * 13;
        noms += `<text x="${f1(xn)}" y="${f1(my + ny * 13 + 4)}" text-anchor="${ancre}" class="pfd-do-neg">négligeable</text>`;
        etendre(ancre === 'start' ? xn : ancre === 'end' ? xn - 70 : xn - 35, ancre === 'start' ? xn + 70 : ancre === 'end' ? xn : xn + 35);
      }
      // noms des forces, en ligne à côté du milieu du trait (un nom répété n'est écrit qu'une fois)
      // (la note, « (frottements) », suit les noms sur la même ligne)
      const fs = (ob.forces || []).filter((fo, k, l) => l.findIndex(x => x.nom === fo.nom) === k);
      if (!fs.length) return;
      const larg = fs.map(fo => largeurNom(fo.nom)), lnote = ob.note ? ob.note.length * 6.4 + 6 : 0, PLUS = 18;
      const tot = larg.reduce((a, b) => a + b, 0) + PLUS * (fs.length - 1) + lnote;
      let x = mx + nx * 12 - (ancre === 'end' ? tot : ancre === 'middle' ? tot / 2 : 0);
      etendre(x, x + tot);
      const yb = my + ny * 12 + (ny < -.3 ? 3 : ny > .3 ? 19 : 6);
      fs.forEach((fo, k) => {
        noms += nomSVG(fo.nom, x + larg[k] / 2, yb, '', fo.coul);
        x += larg[k];
        if (k < fs.length - 1) { noms += `<text x="${f1(x + PLUS / 2)}" y="${f1(yb)}" text-anchor="middle" class="pfd-do-plus">+</text>`; x += PLUS; }
      });
      if (ob.note) noms += `<text x="${f1(x + 6)}" y="${f1(yb)}" class="pfd-do-neg">${ob.note}</text>`;
    });
    const aria = o.aria || `Diagramme objet-action du système ${sys} : ` + objets.map(ob => `${ob.nom}, ${ob.type === 'distance' ? 'action à distance' : ob.type === 'contact' ? 'action de contact' : 'type à choisir'}${ob.neglige ? ', force négligeable' : ''}`).join(' ; ');
    // o.cadre = [x0, x1] : cadre imposé (diagrammes côte à côte, à la même échelle)
    const x0 = o.cadre ? o.cadre[0] : Math.max(0, Math.floor(xmin - 8)), x1 = o.cadre ? o.cadre[1] : Math.min(360, Math.ceil(xmax + 8));
    return `<svg viewBox="${x0} 0 ${x1 - x0} ${HD}" class="pfd-do" style="max-width:${Math.round(440 * (x1 - x0) / 360)}px" role="img" aria-label="${aria}">${traits}${bulles}${noms}</svg>`;
  }
  // type d'action d'un acteur (l'air agit toujours par contact, même quand sa force est négligée)
  const typeDe = (s, a) => a.type || (s.forces.find(f => f.acteur === a.id) || {}).type || 'contact';
  // les trois actions à distance possibles (la Terre toujours, plus rarement un aimant ou un objet électrisé)
  const DIST = [
    { id: 'terre', label: 'la Terre (le poids)', court: 'Terre', manque: 'La Terre attire <b>toujours</b> le système : n\'oublie pas le poids.' },
    { id: 'aimant', label: 'un aimant (force magnétique)', court: 'aimant', intrus: 'Aucun aimant n\'agit ici : pas de force magnétique.' },
    { id: 'charge', label: 'un objet électrisé (force électrique)', court: 'objet électrisé', intrus: 'Aucun objet électrisé (frotté) ici : pas de force électrique.' },
  ];
  // sorte d'une action à distance, d'après le nom de sa force
  function sorteDist(s, a) {
    const n = (s.forces.find(f => f.acteur === a.id) || { noms: [] }).noms;
    return n.indexOf('Fmag') !== -1 ? 'aimant' : n.indexOf('Felec') !== -1 ? 'charge' : 'terre';
  }
  function diagrammeDe(s, etat, o) {
    const cols = couleursForces(s.forces);
    // pendant le bilan : seulement les bulles déjà dessinées par l'élève
    const bulles = etat ? etat.bulles() : s.acteurs.map(a => ({ a, type: typeDe(s, a) }));
    const objets = bulles.map(({ a, type }) => {
      const forces = [];
      s.forces.forEach((f, i) => {
        if (f.acteur !== a.id) return;
        const k = etat ? etat.noms[i] : f.noms[0];
        if (k) forces.push({ nom: k, coul: cols[i] });
      });
      const neglige = a.id === 'air' && !!s.air && s.air.neglige && (!etat || etat.air != null);
      return { nom: a.court || court(a.nom), type, neglige, forces,
        note: a.id === 'air' && forces.length && s.air && s.air.cause === 'frottements' ? '(frottements)' : '' };
    });
    return diagramme(s.sysCourt || court(s.systeme), objets, o);
  }
  // diagrammes de plusieurs situations affichées côte à côte : même cadre, donc même échelle
  function diagrammesDe(liste) {
    const cadres = liste.map(s => diagrammeDe(s).match(/viewBox="([\d.]+) 0 ([\d.]+)/)).map(m => [+m[1], +m[1] + +m[2]]);
    const cadre = [Math.min(...cadres.map(c => c[0])), Math.max(...cadres.map(c => c[1]))];
    return liste.map(s => diagrammeDe(s, null, { cadre }));
  }

  /* ============================================================
     BILAN DES FORCES : une situation, étape par étape
     PFD.bilan(s, opts) → { enonce, parties } : question pour PFD.question ou COURS
     Méthode du diagramme objet-action : on dessine d'abord le diagramme, bulle par bulle,
     puis les forces sur le schéma.
       1. les actions à distance : parmi les trois possibles (la Terre, toujours ; un aimant ;
          un objet électrisé), lesquelles ? (trait en pointillés)
       2. une bulle pour chaque objet qui touche le système, l'air compris (distracteurs) ;
          chacun donne une force (trait plein)
       3. l'air touche le système : peut-on négliger sa force ? (si l'air est un acteur ; trait barré)
       4. tracé sur le schéma : point de départ (centre G ou point de contact), direction et sens
          (8 directions, + directions propres : perpendiculaire au support, le long du fil…)
       5. nom de chaque vecteur (écrit aussi sur le diagramme)
       6. les forces se compensent-elles ? (si s.comp)
     opts.jusqua : 'diagramme' (étapes 1 à 3), 'trace' (1 à 4), 'noms' (1 à 5) ; sinon tout.
     Toutes les parties partagent l'état de la situation (plusieurs exemplaires
     possibles) ; le diagramme se dessine au fil des choix et suit l'élève : il
     s'affiche dans la dernière étape commencée (celui d'une étape finie est masqué
     quand la suivante apparaît).
     Format d'une situation : voir modules/situations.js.
     ============================================================ */
  const MANQUE = 'Il manque un objet : cherche <b>chaque objet qui touche</b> le système (l\'air aussi).';
  // diagramme objet-action d'une étape : il remplace celui des étapes déjà finies
  function figDo(zone, st) {
    const fig = el('div', 'pfd-do-cadre');
    zone.appendChild(fig);
    st.figs.forEach(f => { if (f.dataset.fini) f.hidden = true; });
    st.figs.push(fig);
    return fig;
  }
  // boutons à cocher (actions à distance, objets qui touchent) : ids sélectionnés, dans l'ordre des appuis
  function boutonsActs(zone, liste, choisis, api, quand) {
    const d = el('div', 'pfd-acts');
    d.innerHTML = liste.map(a => `<button type="button" class="pfd-act" data-id="${a.id}" aria-pressed="false">${cap(a.label || a.nom)}</button>`).join('');
    zone.appendChild(d);
    d.querySelectorAll('.pfd-act').forEach(b => {
      b.onclick = () => {
        if (b.disabled || api.fini()) return;
        const oui = b.getAttribute('aria-pressed') !== 'true', k = choisis.indexOf(b.dataset.id);
        b.setAttribute('aria-pressed', oui ? 'true' : 'false');
        if (oui && k === -1) choisis.push(b.dataset.id);
        if (!oui && k !== -1) choisis.splice(k, 1);
        b.classList.remove('ko');
        api.effacer();
        quand();
      };
    });
    // réponse connue : les bons boutons en vert, tout est figé
    d.figer = bons => d.querySelectorAll('.pfd-act').forEach(b => {
      const bon = bons.indexOf(b.dataset.id) !== -1;
      b.disabled = true; b.classList.remove('ko'); b.classList.toggle('ok', bon); b.setAttribute('aria-pressed', bon ? 'true' : 'false');
    });
    return d;
  }
  // 1. les actions à distance : il n'y en a que trois possibles
  function partieDistance(s, st, distants) {
    const presentes = distants.map(a => sorteDist(s, a));
    return { type: 'perso', q: `Dessine le <b>diagramme objet-action</b>. D'abord les actions <b>à distance</b> : il n'y en a que trois possibles. Lesquelles s'exercent sur ${s.systeme} ? Sélectionne-les, puis valide.`,
      solution: `<p>${distants.map(a => `${cap(a.nom)} : ${a.pourquoi}`).join(' ; ')}. Dans le diagramme : trait en <b>pointillés</b>.</p>`,
      monter(zone, api) {
        const fig = figDo(zone, st);
        const d = boutonsActs(zone, DIST, st.dist, api, st.maj);
        const bVal = boutonValider(zone);
        function figer() {
          st.distOk = true; fig.dataset.fini = '1';
          d.figer(presentes); bVal.fermer(); st.maj();
        }
        bVal.onclick = () => {
          if (st.distOk || api.fini()) return;
          if (!st.dist.length) { secouer(d); api.message('Touche les actions à distance qui s\'exercent sur le système, puis valide.'); return; }
          const intrus = st.dist.filter(k => presentes.indexOf(k) === -1), manque = presentes.filter(k => st.dist.indexOf(k) === -1);
          if (!intrus.length && !manque.length) { figer(); api.reussi(); return; }
          intrus.forEach(k => d.querySelector(`[data-id="${k}"]`).classList.add('ko'));
          api.erreur('<br>' + intrus.map(k => '☛ ' + DIST.find(x => x.id === k).intrus)
            .concat(manque.map(k => '☛ ' + (distants.find(a => sorteDist(s, a) === k).manque || DIST.find(x => x.id === k).manque))).join('<br>'));
          secouer(d);
        };
        st.maj();
        return { montrer: figer };
      } };
  }
  // 2. une bulle pour chaque objet qui touche le système : chacun donne une force
  function partieContact(s, st, contacts) {
    return { type: 'perso', q: `Puis les actions <b>de contact</b> : une bulle pour <b>chaque objet qui touche</b> ${s.systeme}. Chacun donne une force. Sélectionne-les, puis valide.`,
      solution: `<p>${contacts.length ? contacts.map(a => `${cap(a.nom)} : ${a.pourquoi}`).join(' ; ') + '. Dans le diagramme : trait <b>plein</b>.' : 'Aucun objet ne touche le système.'}</p>`,
      monter(zone, api) {
        const fig = figDo(zone, st);
        const cands = melanger(contacts.concat(s.distracteurs || []));
        const d = boutonsActs(zone, cands, st.contacts, api, st.maj);
        const bVal = boutonValider(zone);
        function figer() {
          st.contactOk = true; fig.dataset.fini = '1';
          d.figer(contacts.map(a => a.id)); bVal.fermer(); st.maj();
        }
        bVal.onclick = () => {
          if (st.contactOk || api.fini()) return;
          if (!st.contacts.length && contacts.length) { secouer(d); api.message('Touche les objets qui touchent le système, puis valide.'); return; }
          const intrus = (s.distracteurs || []).filter(x => st.contacts.indexOf(x.id) !== -1), manque = contacts.filter(a => st.contacts.indexOf(a.id) === -1);
          if (!intrus.length && !manque.length) { figer(); api.reussi(); return; }
          intrus.forEach(x => d.querySelector(`[data-id="${x.id}"]`).classList.add('ko'));
          api.erreur('<br>' + intrus.map(x => '☛ ' + x.diag).concat(manque.length ? ['☛ ' + (manque[0].manque || MANQUE)] : []).join('<br>'));
          secouer(d);
        };
        st.maj();
        return { montrer: figer };
      } };
  }
  // L'air touche le système : peut-on négliger sa force ?
  // s.air = { neglige, cause ('frottements' | 'archi', si elle n'est pas négligeable), raison, indice }
  const REGLE_AIR = 'On néglige la force de l\'air, sauf si ses <b>frottements</b> ne sont pas négligeables (grande vitesse, grande surface : parachute…) ou si sa <b>poussée d\'Archimède</b> ne l\'est pas (objet très léger pour son volume : montgolfière, ballon d\'hélium).';
  const OPTS_AIR = [{ id: 'oui', label: 'oui : on la néglige' }, { id: 'frottements', label: 'non : les frottements de l\'air ne sont pas négligeables' },
    { id: 'archi', label: 'non : la poussée d\'Archimède de l\'air n\'est pas négligeable' }];
  const bonneAir = a => (a.neglige ? 'oui' : a.cause);
  function partieAir(s, st) {
    const bonne = bonneAir(s.air);
    return { type: 'perso', q: 'L\'air touche le système : peut-on <b>négliger</b> sa force ? (Si oui, son trait est barré.)', solution: `<p>${s.air.raison}</p>`,
      monter(zone, api) {
        const fig = figDo(zone, st);
        const box = el('div', 'ph-choix ph-choix-col');
        zone.appendChild(box);
        let fige = false;
        const bs = OPTS_AIR.map(x => {
          const b = el('button', 'btn-secondary', x.label);
          b.type = 'button';
          box.appendChild(b);
          b.onclick = () => {
            if (fige || api.fini() || b.disabled) return;
            if (x.id === bonne) { figer(); api.reussi(); return; }
            b.classList.add('faux'); b.disabled = true;
            api.erreur(s.air.indice || REGLE_AIR);
          };
          return { b, x };
        });
        // réponse connue : les diagrammes affichés barrent le trait de l'air si sa force est négligeable
        function figer() {
          fige = true; fig.dataset.fini = '1';
          bs.forEach(({ b, x }) => { b.disabled = true; if (x.id === bonne) b.classList.add('juste'); });
          st.air = s.air.neglige;
          st.maj();
        }
        st.maj();
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
    const cols = couleursForces(s.forces);
    return { type: 'perso', q: `Dessine maintenant sur le schéma les forces du diagramme : pour chacune, choisis son <b>point de départ</b>, puis sa <b>direction</b> et son <b>sens</b> (sans souci d'échelle).${s.air && s.air.neglige ? ' La force de l\'air est négligée : on ne la dessine pas.' : ''}`,
      solution: `<p>${s.forces.map((f, i) => `${i + 1}. ${cap(f.lib)} : depuis ${lieu(f.pts[0])}${f.pts.length > 1 ? ` (ou ${f.pts.slice(1).map(lieu).join(', ')})` : ''}, ${texteDir(s, f.angs[0])}`).join(' ;<br>')}.</p>`,
      monter(zone, api) {
        const pos = st.pos;
        let sel = 0, fige = false, drag = null;
        const doFig = figDo(zone, st);
        const d = el('div', 'pfd-tr');
        d.innerHTML = `<div class="vec-chips pfd-tr-chips" role="group" aria-label="Force à tracer">${s.forces.map((f, i) => `<button type="button" class="vec-chip" data-i="${i}"><span class="pfd-tr-pastille" style="background:${cols[i]}" aria-hidden="true"></span>${i + 1}. ${cap(f.lib)}</button>`).join('')}</div>
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
          figZ.innerHTML = scene(s, { forces: pos.map((p, i) => ({ pt: p.pt, ang: p.ang, num: i + 1, coul: cols[i], cote: s.forces[i].cote, L: s.forces[i].L, etat: p.etat || (i === sel && !fige ? 'actif' : '') })),
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
          if (!msgs.length) { fige = true; doFig.dataset.fini = '1'; dessiner(); bVal.fermer(); st.maj(); api.reussi(); return; }
          sel = pos.findIndex(p => !p.ok);
          dessiner();
          api.erreur('<br>' + msgs.join('<br>'));
          secouer(figZ);
        };
        st.maj();
        return { montrer() { s.forces.forEach((f, i) => Object.assign(pos[i], { pt: f.pts[0], ang: f.angs[0], ok: true, etat: 'ok' })); fige = true; doFig.dataset.fini = '1'; dessiner(); bVal.fermer(); st.maj(); } };
      } };
  }
  function partieNoms(s, st) {
    const cands = s.nomsProposes, cols = couleursForces(s.forces);
    return { type: 'perso', q: 'Donne le <b>nom</b> de chaque vecteur force (il s\'écrit aussi sur le diagramme objet-action).',
      solution: `<p>${s.forces.map((f, i) => `${i + 1}. ${cap(f.lib)} : ${nomV(f.noms[0])}`).join(' ; ')}.</p>`,
      monter(zone, api) {
        const d = el('div', 'pfd-noms');
        d.innerHTML = `<div class="pfd-noms-figs"><div class="pfd-do-cadre pfd-noms-do"></div><div class="pfd-sc-cadre pfd-noms-fig"></div></div>` + s.forces.map((f, i) => `<div class="pfd-nom-l" data-i="${i}"><span class="pfd-nom-lib"><span class="pfd-tr-pastille" style="background:${cols[i]}" aria-hidden="true"></span>${i + 1}. ${cap(f.lib)}</span>
          <span class="pfd-nom-ch" role="group" aria-label="Nom de la force ${i + 1}">${cands.map(k => `<button type="button" data-k="${k}" aria-pressed="false">${nomV(k)}</button>`).join('')}</span></div>`).join('');
        zone.appendChild(d);
        const doZ = d.querySelector('.pfd-noms-do'), figZ = d.querySelector('.pfd-noms-fig');
        st.figs.forEach(f => { if (f.dataset.fini) f.hidden = true; });
        st.figs.push(doZ);
        const bVal = boutonValider(zone);
        let fige = false;
        // le diagramme et le dessin montrent les noms choisis, dans la couleur de chaque force
        const dessiner = () => {
          doZ.innerHTML = diagrammeDe(s, st);
          figZ.innerHTML = scene(s, { forces: s.forces.map((f, i) => ({ pt: st.pos[i].pt || f.pts[0], ang: st.pos[i].ang == null ? f.angs[0] : st.pos[i].ang, num: i + 1, nom: st.noms[i], coul: cols[i], cote: f.cote, L: f.L })),
            marques: Object.keys(s.points), aria: `${s.titre} : forces à nommer` });
        };
        st.ecoute.push(dessiner);
        d.querySelectorAll('.pfd-nom-ch button').forEach(b => {
          b.onclick = () => {
            if (fige || api.fini()) return;
            b.parentElement.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x === b ? 'true' : 'false'));
            const r = b.closest('.pfd-nom-l');
            r.classList.remove('ko');
            st.noms[+r.dataset.i] = b.dataset.k;
            api.effacer();
            st.maj();
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
          bVal.fermer(); st.maj();
        }
        bVal.onclick = () => {
          if (fige || api.fini()) return;
          const rangs = Array.from(d.querySelectorAll('.pfd-nom-l'));
          if (rangs.some(r => !r.querySelector('[aria-pressed="true"]'))) { secouer(d); api.message('Choisis un nom pour chaque force.'); return; }
          const faux = rangs.filter(r => s.forces[+r.dataset.i].noms.indexOf(r.querySelector('[aria-pressed="true"]').dataset.k) === -1);
          if (!faux.length) {
            // les noms choisis restent affichés (<span class="vec-nom">R</span> accepté pour <span class="vec-nom">R</span>ₙ sans frottement…)
            fige = true;
            rangs.forEach(r => { r.classList.add('ok'); r.querySelectorAll('button').forEach(b => { b.disabled = true; }); });
            bVal.fermer(); st.maj(); api.reussi(); return;
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
    return { type: 'choix', q: s.comp.q || 'Ces forces se compensent-elles ?', melanger: false, colonne: true,
      options: [{ id: 'oui', label: 'oui : leur somme est nulle' }, { id: 'non', label: 'non : leur somme n\'est pas nulle' }], bonne: s.comp.bonne,
      indices: { [autre]: s.comp.indice }, solution: `<p>${s.comp.expl}</p>` };
  }
  function bilan(s, opts) {
    opts = opts || {};
    const distants = s.acteurs.filter(a => typeDe(s, a) === 'distance'), contacts = s.acteurs.filter(a => typeDe(s, a) !== 'distance');
    const objets = contacts.concat(s.distracteurs || []);
    // état partagé : actions à distance et objets choisis, réponse sur l'air, tracés et noms ; diagrammes à redessiner
    const st = { dist: [], contacts: [], distOk: false, contactOk: false, air: null, pos: s.forces.map(() => ({ pt: null, ang: null, etat: '', ok: false })),
      noms: s.forces.map(() => null), figs: [], ecoute: [] };
    // bulles dessinées : les actions à distance (une sorte choisie sans acteur : bulle de l'élève), puis les objets qui touchent
    st.bulles = () => (st.distOk ? distants : DIST.filter(k => st.dist.indexOf(k.id) !== -1).map(k => distants.find(a => sorteDist(s, a) === k.id) || { id: '_' + k.id, nom: k.court }))
      .map(a => ({ a, type: 'distance' }))
      .concat((st.contactOk ? contacts : st.contacts.map(id => objets.find(x => x.id === id))).map(a => ({ a, type: 'contact' })));
    st.maj = () => { st.figs.forEach(f => { f.innerHTML = diagrammeDe(s, st); }); st.ecoute.forEach(f => f()); };
    const jusqua = opts.jusqua || 'tout';
    const parties = [partieDistance(s, st, distants)];
    if (objets.length) parties.push(partieContact(s, st, contacts));
    if (s.air) parties.push(partieAir(s, st));
    if (jusqua !== 'diagramme') parties.push(partieTrace(s, st));
    if (jusqua === 'noms' || jusqua === 'tout') parties.push(partieNoms(s, st));
    if (jusqua === 'tout' && s.comp) parties.push(partieComp(s));
    parties.forEach((p, k) => { p.q = `${k + 1}. ${p.q}`; });
    return { enonce: `${s.enonce ? `<p>${s.enonce}</p>` : ''}${s.dessin ? `<div class="pfd-sc-cadre">${scene(s, { aria: s.titre })}</div>` : ''}`, parties };
  }
  // scène avec toutes ses forces tracées et nommées (exemples, fiches, corrections)
  const sceneRemplie = (s, o) => {
    const cols = couleursForces(s.forces);
    return scene(s, Object.assign({ forces: s.forces.map((f, i) => ({ pt: f.pts[0], ang: f.angs[0], nom: f.noms[0], coul: cols[i], cote: f.cote, L: f.L })), marques: Object.keys(s.points), aria: `${s.titre} : bilan des forces` }, o));
  };

  /* ============================================================
     INFOGRAPHIE « forces à distance, forces de contact »
     PFD.infoForces() → HTML : deux colonnes (une seule sur téléphone),
     dans l'ordre de la méthode : d'abord les forces à distance (trois
     possibles, flèche depuis le centre, pointillés dans le diagramme
     objet-action), puis les forces de contact (chaque objet qui touche,
     l'air compris ; flèche depuis le point de contact, trait plein).
     ============================================================ */
  function infoForces() {
    // petit dessin : un bloc posé sur un support, une force depuis le centre G ou depuis le point de contact A
    const bloc = dist => `<svg viewBox="0 0 150 104" class="pfd-info-sc" role="img" aria-label="${dist ? 'Force à distance : la flèche part du centre G' : 'Force de contact : la flèche part du point de contact A'}">
        <line x1="12" y1="66" x2="138" y2="66" class="pfd-sc-sol"/>${[24, 40, 56, 72, 88, 104, 120, 136].map(x => `<line x1="${x}" y1="67" x2="${x - 7}" y2="74" class="pfd-sc-hach"/>`).join('')}
        <rect x="48" y="36" width="54" height="30" class="pfd-sc-sys"/>
        ${dist ? fleche(75, 51, 270, '', 0, 46, COUL.P).svg + '<circle cx="75" cy="51" r="3.5" class="pfd-pt-m"/><text x="81" y="47" class="pfd-pt-t">G</text>'
    : fleche(75, 66, 90, '', 0, 52, COUL.RN).svg + '<circle cx="75" cy="66" r="3.5" class="pfd-pt-m"/><text x="81" y="82" class="pfd-pt-t">A</text>'}</svg>`;
    // petit diagramme objet-action : un objet relié au système
    const mini = (obj, dist) => `<svg viewBox="0 0 170 38" class="pfd-info-do" role="img" aria-label="Diagramme objet-action : ${obj} relié au système par un trait ${dist ? 'en pointillés' : 'plein'}">
        <line x1="58" y1="19" x2="104" y2="19" class="pfd-do-l${dist ? ' dist' : ''}"/>
        <ellipse cx="32" cy="19" rx="28" ry="14" class="pfd-do-obj"/><text x="32" y="23" text-anchor="middle" class="pfd-do-t">${obj}</text>
        <ellipse cx="134" cy="19" rx="32" ry="15" class="pfd-do-sys"/><text x="134" y="23" text-anchor="middle" class="pfd-do-t">système</text></svg>`;
    // icônes des trois forces à distance
    const ic = {
      terre: '<svg viewBox="0 0 32 32" class="pfd-info-ic" aria-hidden="true"><circle cx="16" cy="16" r="12" class="pfd-sc-sys"/><ellipse cx="16" cy="16" rx="5.5" ry="12" class="pfd-info-trait"/><line x1="4" y1="16" x2="28" y2="16" class="pfd-info-trait"/></svg>',
      aimant: '<svg viewBox="0 0 32 32" class="pfd-info-ic" aria-hidden="true"><rect x="2" y="10" width="28" height="12" class="pfd-sc-obj"/><line x1="16" y1="10" x2="16" y2="22" class="pfd-info-trait"/><text x="9" y="20" text-anchor="middle" class="pfd-info-ict">N</text><text x="23" y="20" text-anchor="middle" class="pfd-info-ict">S</text></svg>',
      charges: '<svg viewBox="0 0 32 32" class="pfd-info-ic" aria-hidden="true"><circle cx="9" cy="16" r="7" class="pfd-sc-obj"/><circle cx="23" cy="16" r="7" class="pfd-sc-obj"/><text x="9" y="20.5" text-anchor="middle" class="pfd-info-ict">+</text><text x="23" y="20" text-anchor="middle" class="pfd-info-ict">−</text></svg>',
    };
    return `<div class="pfd-info">
      <section class="pfd-info-c" aria-label="D'abord les forces à distance">
        <p class="pfd-info-t"><span class="pfd-info-n">1</span><span>D'abord : les forces <b>à distance</b></span></p>
        <p class="pfd-info-s">Il n'y en a que <b>trois</b> possibles :</p>
        <ul class="pfd-info-l">
          <li>${ic.terre}<span><b>le poids</b> ${nomV('P')}<small>exercé par la Terre (toujours)</small></span></li>
          <li>${ic.aimant}<span><b>la force magnétique</b> ${nomV('Fmag')}<small>s'il y a des aimants</small></span></li>
          <li>${ic.charges}<span><b>la force électrique</b> ${nomV('Felec')}<small>s'il y a des charges + ou −</small></span></li></ul>
        <div class="pfd-info-fig">${bloc(true)}<p>La flèche part du <b>centre</b> G du système.</p></div>
        <div class="pfd-info-fig">${mini('Terre', true)}<p>Diagramme objet-action : trait en <b>pointillés</b>.</p></div>
      </section>
      <section class="pfd-info-c" aria-label="Puis les forces de contact">
        <p class="pfd-info-t"><span class="pfd-info-n">2</span><span>Puis : les forces <b>de contact</b></span></p>
        <p class="pfd-info-s"><b>Chaque objet qui touche</b> le système exerce une force :</p>
        <ul class="pfd-info-chips"><li>le support (sol, table…)</li><li>un fil, une corde, un ressort</li><li>une main, un pied</li><li>un liquide (eau, huile…)</li><li><b>l'air</b>, toujours</li></ul>
        <div class="pfd-info-fig">${bloc(false)}<p>La flèche part du <b>point de contact</b> A.</p></div>
        <div class="pfd-info-fig">${mini('sol', false)}<p>Diagramme objet-action : trait <b>plein</b>.</p></div>
      </section>
    </div>`;
  }

  /* ============================================================
     CHRONOPHOTOGRAPHIE (SVG) : positions successives d'un mobile à
     intervalles de temps égaux, sur une trajectoire rectiligne (de gauche
     à droite), circulaire ou curviligne (le départ est marqué). Animée
     (un point après l'autre, « ↺ Rejouer ») sauf o.anim = false ou
     mouvement réduit.
     o = { traj: 'rectiligne' | 'circulaire' | 'curviligne', type: 'uniforme' | 'accelere' | 'decelere',
           n, pos: [fractions de la longueur parcourue, de 0 à 1], titre }
     ============================================================ */
  function positions(type, n) {
    return Array.from({ length: n }, (_, k) => {
      const x = k / (n - 1);
      return type === 'uniforme' ? x : type === 'accelere' ? x * x : 1 - (1 - x) * (1 - x);
    });
  }
  // trajectoires : point de paramètre u (0 à 1), hauteur du dessin, place du mot « départ »
  const bez = (a, b, c, d, u) => (1 - u) * (1 - u) * (1 - u) * a + 3 * (1 - u) * (1 - u) * u * b + 3 * (1 - u) * u * u * c + u * u * u * d;
  const TRAJETS = {
    rectiligne: { h: 40, pt: u => [18 + u * 324, 20] },
    circulaire: { h: 150, dep: [-10, 4, 'end'], pt: u => { const a = (200 - u * 300) * Math.PI / 180; return [180 + 64 * Math.cos(a), 78 - 64 * Math.sin(a)]; } },
    curviligne: { h: 150, dep: [0, 20, 'start'], pt: u => [bez(20, 120, 240, 340, u), bez(118, -70, 240, 30, u)] },
  };
  // trajectoire échantillonnée, puis points placés à des fractions de sa longueur
  function surTrajet(T, fractions) {
    const N = 400, ech = [], cum = [0];
    for (let k = 0; k <= N; k++) ech.push(T.pt(k / N));
    for (let k = 1; k <= N; k++) cum.push(cum[k - 1] + Math.hypot(ech[k][0] - ech[k - 1][0], ech[k][1] - ech[k - 1][1]));
    const L = cum[N];
    return fractions.map(f => {
      const l = f * L;
      let k = 1;
      while (k < N && cum[k] < l) k++;
      const t = (l - cum[k - 1]) / ((cum[k] - cum[k - 1]) || 1);
      return [ech[k - 1][0] + t * (ech[k][0] - ech[k - 1][0]), ech[k - 1][1] + t * (ech[k][1] - ech[k - 1][1])];
    });
  }
  function chrono(o) {
    o = o || {};
    return outil(div => {
      const traj = o.traj || 'rectiligne', T = TRAJETS[traj], ps = surTrajet(T, o.pos || positions(o.type, o.n || (traj === 'rectiligne' ? 9 : 10)));
      const fond = traj === 'rectiligne' ? '<line x1="14" y1="20" x2="346" y2="20" class="pfd-chrono-axe"/>'
        : `<polyline points="${Array.from({ length: 81 }, (_, k) => T.pt(k / 80).map(v => v.toFixed(1)).join(',')).join(' ')}" class="pfd-chrono-axe trajet"/>`;
      const dep = T.dep ? `<text x="${(ps[0][0] + T.dep[0]).toFixed(1)}" y="${(ps[0][1] + T.dep[1]).toFixed(1)}" text-anchor="${T.dep[2]}" class="pfd-chrono-dep">départ</text>` : '';
      div.classList.add('pfd-chrono');
      div.innerHTML = `${o.titre ? `<p class="pfd-chrono-t">${o.titre}</p>` : ''}<div class="pfd-chrono-l${traj === 'rectiligne' ? '' : ' haut'}"><svg viewBox="0 0 360 ${T.h}" role="img" aria-label="Chronophotographie : positions successives à intervalles de temps égaux"></svg>
        ${o.anim === false ? '' : '<button type="button" class="btn-small pfd-rejouer" aria-label="Rejouer l\'animation">↺</button>'}</div>`;
      const svg = div.querySelector('svg'), bt = div.querySelector('.pfd-rejouer');
      let minuteur = null;
      const dessiner = k => {
        svg.innerHTML = fond + dep + ps.slice(0, k).map((p, i) => `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="${i === k - 1 && k < ps.length ? 6.5 : 5}" class="pfd-chrono-pt"/>`).join('');
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
     DÉCRIRE UN MOUVEMENT EN DEUX MOTS : la trajectoire (rectiligne,
     circulaire ou curviligne), puis la vitesse (uniforme, accéléré,
     décéléré ou ralenti : ces deux derniers mots veulent dire la même chose).
     PFD.partieMouvement({ traj, vit ('uniforme' | 'accelere' | 'decelere'), q,
       ind: { traj, vit } (diagnostics propres à une situation décrite par un texte) })
       → partie 'perso' (cours, séries, exercices)
     ============================================================ */
  const MOTS_TRAJ = [['rectiligne', 'rectiligne'], ['circulaire', 'circulaire'], ['curviligne', 'curviligne']];
  const MOTS_VIT = [['uniforme', 'uniforme'], ['accelere', 'accéléré'], ['decelere', 'décéléré'], ['ralenti', 'ralenti']];
  const motVit = v => ({ uniforme: 'uniforme', accelere: 'accéléré', decelere: 'décéléré (ou ralenti)' })[v];
  const SENS_TRAJ = { rectiligne: 'la trajectoire est une <b>droite</b>', circulaire: 'la trajectoire est un <b>cercle</b> (ou un arc de cercle)', curviligne: 'la trajectoire est une <b>courbe</b> quelconque' };
  const SENS_VIT = { uniforme: 'la vitesse est <b>constante</b> (positions régulièrement espacées)', accelere: 'la vitesse <b>augmente</b> (positions de plus en plus espacées)', decelere: 'la vitesse <b>diminue</b> (positions de moins en moins espacées)' };
  // diagnostic ciblé d'un mot mal choisi, d'après une chronophotographie
  function diagTraj(choisi, bon) {
    if (bon === 'rectiligne') return 'Les positions sont <b>alignées</b> : la trajectoire est une droite.';
    if (choisi === 'rectiligne') return 'Les positions ne sont pas alignées sur une droite.';
    return bon === 'circulaire' ? 'Les positions sont sur un <b>cercle</b> : on dit circulaire (curviligne, c\'est pour une courbe quelconque).'
      : 'La courbe n\'est pas un cercle : sa courbure change. On dit curviligne.';
  }
  function diagVit(choisi, bon) {
    if (bon === 'uniforme') return 'Les écarts entre deux positions successives sont <b>égaux</b> : la vitesse ne change pas.';
    if (choisi === 'uniforme') return 'Les écarts entre deux positions successives ne sont pas égaux : la vitesse change.';
    return bon === 'accelere' ? 'Les écarts entre deux positions successives <b>augmentent</b> : le mobile va de plus en plus vite.'
      : 'Les écarts entre deux positions successives <b>diminuent</b> : le mobile va de moins en moins vite.';
  }
  function partieMouvement(o) {
    const ind = o.ind || {};
    const okVit = v => v === o.vit || (o.vit === 'decelere' && v === 'ralenti');
    return { type: 'perso', q: o.q || 'Décris le mouvement avec <b>deux mots</b> : la trajectoire, puis la vitesse.',
      solution: o.solution || `<p>Mouvement <b>${o.traj} ${motVit(o.vit)}</b> : ${SENS_TRAJ[o.traj]} et ${SENS_VIT[o.vit]}.</p>`,
      monter(zone, api) {
        const d = el('div', 'pfd-mvt');
        const ligne = (k, titre, mots) => `<div class="pfd-type pfd-mvt-l" data-k="${k}"><span class="pfd-type-nom">${titre}</span>
          <span class="pfd-type-b pfd-mvt-b" role="group" aria-label="${titre.replace(/<[^>]+>/g, '')}">${mots.map(([id, t]) => `<button type="button" data-v="${id}" aria-pressed="false">${t}</button>`).join('')}</span></div>`;
        d.innerHTML = ligne('traj', '1<sup>er</sup> mot : la trajectoire', MOTS_TRAJ) + ligne('vit', '2<sup>e</sup> mot : la vitesse', MOTS_VIT) + '<p class="pfd-mvt-res" aria-live="polite"></p>';
        zone.appendChild(d);
        const bVal = boutonValider(zone);
        const choix = { traj: null, vit: null }, res = d.querySelector('.pfd-mvt-res');
        let fige = false;
        const lib = (k, v) => (k === 'traj' ? MOTS_TRAJ : MOTS_VIT).find(x => x[0] === v)[1];
        const maj = () => { res.innerHTML = `Mouvement <b>${choix.traj ? lib('traj', choix.traj) : '…'}</b> <b>${choix.vit ? lib('vit', choix.vit) : '…'}</b>`; };
        d.querySelectorAll('.pfd-mvt-b button').forEach(b => {
          b.onclick = () => {
            if (fige || api.fini()) return;
            const l = b.closest('.pfd-mvt-l');
            l.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x === b ? 'true' : 'false'));
            l.classList.remove('ko');
            choix[l.dataset.k] = b.dataset.v;
            maj(); api.effacer();
          };
        });
        function figer(montrer) {
          fige = true;
          if (montrer) { choix.traj = o.traj; if (!okVit(choix.vit)) choix.vit = o.vit; }
          d.querySelectorAll('.pfd-mvt-l').forEach(l => {
            l.classList.remove('ko'); l.classList.add('ok');
            l.querySelectorAll('button').forEach(b => { b.disabled = true; b.setAttribute('aria-pressed', b.dataset.v === choix[l.dataset.k] ? 'true' : 'false'); });
          });
          maj(); bVal.fermer();
        }
        bVal.onclick = () => {
          if (fige || api.fini()) return;
          if (!choix.traj || !choix.vit) { secouer(d); api.message('Choisis un mot pour la trajectoire <b>et</b> un mot pour la vitesse.'); return; }
          const okT = choix.traj === o.traj, okV = okVit(choix.vit);
          if (okT && okV) { figer(false); api.reussi(); return; }
          const msgs = [];
          if (!okT) { d.querySelector('[data-k="traj"]').classList.add('ko'); msgs.push('☛ <b>Trajectoire</b> : ' + (ind.traj || diagTraj(choix.traj, o.traj))); }
          if (!okV) { d.querySelector('[data-k="vit"]').classList.add('ko'); msgs.push('☛ <b>Vitesse</b> : ' + (ind.vit || diagVit(choix.vit === 'ralenti' ? 'decelere' : choix.vit, o.vit))); }
          api.erreur('<br>' + msgs.join('<br>'));
          secouer(d);
        };
        maj();
        return { montrer: () => figer(true) };
      } };
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
      // une couleur par force (Σ F⃗, déjà tracée, en noir)
      vecteurs: o.forces.map((f, i) => ({ nom: f.nom, dep: [0, 0], coord: f.coord, fixe: true, coul: f.nom === 'ΣF' ? window.VEC.C.encre : COUL_QUAD[i % COUL_QUAD.length], nomPos: f.nomPos })).concat([aTracer]) });
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
    { n: 1, titre: 'Référentiel et nature du mouvement', desc: 'Référentiel galiléen, décrire un mouvement en deux mots (trajectoire, vitesse)', fiche: 'fiche_1',
      parties: [{ nom: 'Référentiel et nature du mouvement', cours: 'module_1_cours', questions: 'module_1_questions' }] },
    { n: 2, titre: 'Faire un bilan des forces', desc: 'Forces à distance et de contact, diagramme objet-action, force de l\'air, poids, réaction du support, forces qui se compensent', fiche: 'fiche_2',
      // six sous-modules de cours, puis l'atelier (page « exemple » : entre les cours et les questions), les questions et la fiche
      sousModules: true,
      parties: [
        { nom: 'Forces à distance, forces de contact', slug: 'distance', cours: 'module_2a_cours', noms: { cours: 'Cours : forces à distance, forces de contact' } },
        { nom: 'Méthode du diagramme objet-action', slug: 'diagramme', cours: 'module_2b_cours', noms: { cours: 'Cours : méthode du diagramme objet-action' } },
        { nom: 'Force de l\'air', slug: 'air', cours: 'module_2c_cours', noms: { cours: 'Cours : force de l\'air' } },
        { nom: 'Poids', slug: 'poids', cours: 'module_2d_cours', noms: { cours: 'Cours : poids' } },
        { nom: 'Réaction du support', slug: 'reaction', cours: 'module_2e_cours', noms: { cours: 'Cours : réaction du support' } },
        { nom: 'Forces qui se compensent', slug: 'compensation', cours: 'module_2f_cours', noms: { cours: 'Cours : forces qui se compensent' } },
        { nom: 'Bilan des forces', exemple: 'module_2_simulation', questions: 'module_2_questions', noms: { exemple: 'Atelier : bilan des forces' } }] },
    { n: 3, titre: 'Accélération', desc: 'a = dv/dt ; a = Δv / Δt en m·s<sup>−2</sup>', fiche: 'fiche_3',
      // cinq sous-modules de cours, puis les questions et la fiche
      sousModules: true,
      parties: [
        { nom: 'Définition de l\'accélération', slug: 'definition', cours: 'module_3a_cours', noms: { cours: 'Cours : définition de l\'accélération' } },
        { nom: 'Dériver la vitesse', slug: 'derivee', cours: 'module_3b_cours', noms: { cours: 'Cours : dériver la vitesse' } },
        { nom: 'Vitesse constante', slug: 'constante', cours: 'module_3c_cours', noms: { cours: 'Cours : vitesse constante' } },
        { nom: 'Accélération constante', slug: 'delta', cours: 'module_3d_cours', noms: { cours: 'Cours : accélération constante' } },
        { nom: 'Accélération et forces', slug: 'forces', cours: 'module_3e_cours', noms: { cours: 'Cours : accélération et forces' } },
        { nom: 'Accélération', questions: 'module_3_questions' }] },
    { n: 4, titre: 'Principe fondamental de la dynamique', desc: 'Σ <span class="vec-nom">F</span> = m <span class="vec-nom">a</span>, principe d\'inertie, résultante des forces', fiche: 'fiche_4',
      // quatre sous-modules de cours, puis les questions et la fiche
      sousModules: true,
      parties: [
        { nom: 'Principe fondamental de la dynamique', slug: 'pfd', cours: 'module_4a_cours', noms: { cours: 'Cours : principe fondamental de la dynamique' } },
        { nom: 'Principe d\'inertie', slug: 'inertie', cours: 'module_4b_cours', noms: { cours: 'Cours : principe d\'inertie' } },
        { nom: 'Résultante des forces et accélération', slug: 'direction', cours: 'module_4c_cours', noms: { cours: 'Cours : résultante des forces et accélération' } },
        { nom: 'Méthode type', slug: 'methode', cours: 'module_4d_cours', noms: { cours: 'Cours : méthode type' } },
        { nom: 'Principe fondamental de la dynamique', questions: 'module_4_questions' }] },
    { n: 5, titre: 'Exercices', desc: 'Exercices 1, 2, 3 et 5 à 19 de la feuille (p. 84-87), guidés pas à pas', exercices: 'module_5', exNom: 'Exercices 1 à 19', nbEx: 11 },
  ];
  window.SOM.init({ nom: 'Chapitre 6 : Principe fondamental de la dynamique', id: 'principe-dynamique', cleEx: 'principe-dynamique-exercices', plan: PLAN });
  const menu = cle => window.SOM.menu(cle);
  const accueil = zone => window.SOM.accueil(zone);
  const marquer = info => window.SOM.marquer(info);

  window.PFD = Object.assign(window.PFD || {}, {
    MOINS, fmt, cs, sci, lire, proche, fr, unite, o, fq, el, secouer, melanger, hasard, entre, champ, PARTIES,
    question, serie, confettis, fig, monter, outil, cap, V, NOMS, nomV, nomSVG, DIR_TXT, texteDir, ecartAngle, scene, sceneRemplie, bilan,
    COUL, COUL_LIBRES, couleurs, couleursForces, court, diagramme, diagrammeDe, diagrammesDe, typeDe, DIST, sorteDist, REGLE_AIR, OPTS_AIR, bonneAir, infoForces,
    positions, chrono, partieMouvement, MOTS_VIT, motVit, somme, partieResultante, partieAcc, PLAN, menu, accueil, marquer,
  });
})();
