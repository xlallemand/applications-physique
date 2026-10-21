/* ============================================================
   Moteur de l'application « Chapitre 9 : Statique des fluides »
   (Terminale STI2D ; même moteur de questions que « Cinématique » et
   « Chapitre 8 : Mouvements de rotation » ; navigation commune
   assets/sommaire.js, cours avec assets/cours.js, glisser-déposer
   assets/dragdrop.js)

   SF.fmt, SF.cs, SF.sci, SF.lire      écriture et lecture des nombres (virgule)
   SF.o, SF.fq.choix, SF.fq.nombre      fabriques d'options et de parties de question
   SF.PARTIES                           parties de question : 'choix', 'nombre', 'gabarit', 'sci',
                                        'schema' (étiquettes à glisser, cases inconnues laissées vides),
                                        'grille' (un choix par ligne), 'perso' (p.monter(zone, api) → { montrer() })
   SF.versCours(p)                      une de ces parties dans un cours (assets/cours.js)
   SF.question(zone, q, cb, mode)       question en plusieurs parties (série, exercice)
   SF.serie(opts)                       série de questions notée sur 20

   Propre au chapitre 9 :
     SF.P(s), SF.pa(v, c)               P avec indice ; pression écrite « 1,2 × 10⁵ Pa »
     SF.dessin(type, o)                 dessin SVG seul : 'chateau', 'combles', 'piscine', 'reservoir',
                                        'barometre', 'chalet', 'cric', 'molecules', 'axe', 'vase'
     SF.schemaFig(type, o, carts)       schéma rempli (cours, fiches) : cartouches avec les valeurs
     SF.partieSchema(o)                 partie 'schema' : placer « point haut », « point bas », les
                                        pressions connues et h ; la case d'une inconnue reste vide
     SF.choixFormule(o)                 partie 'choix' : P_bas = P_haut + ρ g h, P_haut = …, h = …
     SF.diagHydro(o)                    diagnostics des erreurs classiques du principe fondamental
     SF.partieSurfaces(o)               tableau de conversion des surfaces : placer la virgule
   SF.menu(cle), SF.accueil(zone)       navigation commune (SOM) avec le plan de l'application

   Les styles des cartes, boutons et écrans de fin viennent de
   equilibrer-reactions/modules/er.css (même présentation).
   ============================================================ */
(function () {
  'use strict';

  const MOINS = '−';

  /* ============================================================
     NOMBRES
     ============================================================ */
  // nombre écrit à la française : 2,3 ; −0,30 ; 1 000
  function fmt(v, dec) {
    if (dec == null) {
      const r = Math.round(v * 1e9) / 1e9;
      let s = String(+r.toPrecision(6));
      if (/e/.test(s)) return sci(v, 3);
      const neg = s[0] === '-';
      if (neg) s = s.slice(1);
      let [e, d] = s.split('.');
      e = e.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
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
  // écriture scientifique avec c chiffres significatifs : 5,9 × 10⁵
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

  // fabriques de parties de question (cours, séries, exercices)
  const o = (id, label) => ({ id, label });
  const fq = {
    choix: (q, options, bonne, opts) => Object.assign({ type: 'choix', q, options, bonne, colonne: options.some(x => x.label.replace(/<[^>]+>/g, '').length > 24) }, opts),
    nombre: (q, label, valeur, unite, opts) => Object.assign({ type: 'nombre', q, label, valeur, unite }, opts),
    sci: (q, label, valeur, unite, opts) => Object.assign({ type: 'sci', q, label, valeur, unite }, opts),
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
     api.reussi() · api.erreur(indice) · api.effacer() · api.message(h) · api.fini()
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
    // la valeur affichée par « Afficher la réponse » (arrondie) est toujours acceptée
    if (p.affiche != null && proche(v, lire(p.affiche), 1e-6)) return true;
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
    const d = el('div', 'ph-valeur sf-gab');
    if (p.label) d.appendChild(el('span', 'ph-lab', p.label));
    // chaque case forme un groupe insécable avec le texte qui la suit : sur un petit écran,
    // la ligne ne se coupe qu'entre deux groupes
    const champs = [];
    let grp = el('span', 'sf-gab-grp');
    d.appendChild(grp);
    p.morceaux.forEach(m => {
      if (typeof m === 'string') { grp.appendChild(el('span', 'sf-gab-txt', m)); return; }
      if (champs.length) { grp = el('span', 'sf-gab-grp'); d.appendChild(grp); }
      const c = champ({ petit: true, aria: m.aria || 'Nombre à compléter' });
      c.m = m; champs.push(c); grp.appendChild(c.el);
    });
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
      if (vals.some(isNaN)) { secouer(d); api.message('Complète toutes les cases.'); return; }
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
      // juste : assez proche, ou bien arrondi au nombre de chiffres significatifs demandé
      if (proche(v, p.valeur, p.rel == null ? .03 : p.rel) || (p.cs && proche(v, +(+p.valeur).toPrecision(p.cs), 1e-6))) { a.desactiver(true); n.desactiver(true); bVal.fermer(); api.reussi(); return; }
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
     p.schema : HTML du schéma, avec des cases SF.slot(id)
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
      slots.forEach(s => { s.tabIndex = -1; if (estInconnue(s)) s.classList.add('sf-inconnue'); });
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
        api.message(`Il reste ${videsATort.length} cases à remplir : seule la case de l'inconnue reste vide.`);
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
      if (videsATort.length) phr.push('la case vide en rouge n\'est pas une inconnue : sa valeur est connue, place-la');
      const txt = phr.join(' ; ');
      api.erreur(txt.charAt(0).toUpperCase() + txt.slice(1) + '.' + (indices.length ? '<br>' + indices.map(t => '☛ ' + t).join('<br>') : ''));
      secouer(d.querySelector('.sf-sch') || d);
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
     p.lignes [{ id, label (HTML), bonne (id d'option), indices { id d'option: diagnostic }, apres (HTML affiché une fois réussi) }]
     p.options [{ id, label }] : les mêmes pour chaque ligne ; p.diag(fausses) → diagnostic d'ensemble (facultatif) */
  function pGrille(zone, p, api) {
    const g = el('div', 'sf-grille');
    g.innerHTML = p.lignes.map(l => `<div class="sf-grille-l" data-l="${l.id}">
        <div class="sf-grille-nom">${l.label}</div>
        <div class="sf-grille-ch" role="group" aria-label="${String(l.label).replace(/<[^>]+>/g, '').replace(/"/g, '')}">
          ${p.options.map(o => `<button type="button" class="sf-grille-b" data-o="${o.id}" aria-pressed="false">${o.label}</button>`).join('')}</div>
        <div class="sf-grille-apres" hidden></div></div>`).join('');
    zone.appendChild(g);
    const lignes = Array.from(g.querySelectorAll('.sf-grille-l'));
    const choisi = {};
    lignes.forEach(L => {
      L.querySelectorAll('.sf-grille-b').forEach(b => {
        b.onclick = () => {
          if (api.fini() || b.disabled) return;
          choisi[L.dataset.l] = b.dataset.o;
          L.querySelectorAll('.sf-grille-b').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
          L.classList.remove('ok', 'ko');
          api.effacer();
        };
      });
    });
    const bVal = boutonValider(zone);
    function terminer() {
      lignes.forEach((L, k) => {
        L.classList.remove('ko'); L.classList.add('ok');
        L.querySelectorAll('.sf-grille-b').forEach(b => { b.disabled = true; });
        const a = L.querySelector('.sf-grille-apres');
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
        lignes.forEach((L, k) => L.querySelectorAll('.sf-grille-b').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.o === p.lignes[k].bonne))));
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
     UNE QUESTION : parties successives
     q = { parties: [p] } ; p = { type, q (texte), figure(zone), solution (HTML affiché après), … }
     mode : 'serie'    bouton « Afficher la réponse » (0 point pour la question)
            'exercice' bouton « Voir la correction » toujours disponible
     cb.fin(points) : 2 sans erreur, 1 après au moins une erreur, 0 si une réponse est affichée
     ============================================================ */
  function question(zone, q, cb, mode) {
    mode = mode || 'serie';
    const etat = { erreurs: 0, vue: false, fini: false, details: [] };
    const n = q.parties.length;
    let rendues = 0, finies = 0;
    const libAide = mode === 'exercice' ? 'Voir la correction' : 'Afficher la réponse';
    function partie() {
      const p = q.parties[rendues++];
      window.SF.partieEnCours = p;          // partie en cours (utile pour vérifier l'application)
      const d = el('div', 'ph-partie', `${p.q ? `<div class="ph-partie-q">${p.q}</div>` : ''}<div class="ph-partie-fig"></div><div class="ph-partie-zone"></div><div class="ph-partie-retour"></div>
        <div class="ph-partie-aide"><button type="button" class="btn-small">${libAide}</button></div>`);
      zone.appendChild(d);
      if (p.figure) p.figure(d.querySelector('.ph-partie-fig'));
      const ret = d.querySelector('.ph-partie-retour'), aide = d.querySelector('.ph-partie-aide'), bRep = aide.querySelector('button');
      let finie = false, erreursIci = 0;
      const api = {
        fini: () => finie || etat.fini,
        effacer() { if (!finie) ret.innerHTML = ''; },
        message(h) { if (!finie) ret.innerHTML = `<p class="ph-msg">${h}</p>`; },
        compterErreur() { etat.erreurs++; erreursIci++; },
        erreur(h) {
          api.compterErreur();
          ret.innerHTML = `<div class="callout-danger er-retour"><p><b class="er-ko">Ce n'est pas ça.</b> ${h || ''}</p>${erreursIci >= 2 ? `<p class="er-petit">Corrige ta réponse, ou ${mode === 'exercice' ? 'regarde la correction' : 'affiche la réponse'} (0 point pour cette ${mode === 'exercice' ? 'partie' : 'question'}).</p>` : ''}</div>`;
        },
        reussi(silencieux, note) { terminer(false, silencieux, note); },
      };
      const ctx = PARTIES[p.type](d.querySelector('.ph-partie-zone'), p, api);
      bRep.onclick = () => { if (finie) return; ctx.montrer(); etat.vue = true; terminer(true); };
      function terminer(vue, silencieux, note) {
        finie = true;
        aide.remove();
        etat.details.push({ vue, erreurs: erreursIci });
        const titre = vue ? (mode === 'exercice' ? 'Correction' : 'Réponse') : (erreursIci ? 'C\'est juste.' : 'Juste !');
        const sol = p.solution || p.correction;
        if (sol || vue || (note && typeof note === 'string')) {
          ret.innerHTML = `<div class="${vue ? 'callout' : 'callout-success'} er-retour ph-solution"><p><b class="${vue ? '' : 'er-ok'}">${titre}</b>${typeof note === 'string' ? ' ' + note : ''}</p>${sol ? `<div>${sol}</div>` : ''}</div>`;
        } else if (!silencieux) {
          ret.innerHTML = '<p class="ph-ok">✓ Juste</p>';
        } else ret.innerHTML = '';
        finies++;
        if (finies < n) {
          if (rendues < n) {
            partie();
            const s = zone.lastElementChild;
            setTimeout(() => s.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 80);
          }
        } else {
          etat.fini = true;
          cb.fin(etat.vue ? 0 : etat.erreurs ? 1 : 2, etat);
        }
      }
    }
    partie();
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
      window.SF.questionEnCours = q;          // question en cours (utile pour vérifier l'application)
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

  // case vide d'un schéma, où glisser une étiquette (partie 'schema')
  const slot = id => `<span class="sc-slot" data-slot="${id}"><span class="sc-slot-ph">?</span></span>`;
  const f1 = v => (+v).toFixed(1);

  /* ============================================================
     PROPRE AU CHAPITRE 9 : écritures
     ============================================================ */
  // P avec un indice : P('bas') → P_bas ; pression en Pa en écriture scientifique
  const P = s => `P<sub>${s}</sub>`;
  const PATM = 'P<sub>atm</sub>';
  const pa = (v, c) => `${sci(v, c || 2)} Pa`;

  /* ============================================================
     DESSINS (SVG) : couleurs par les classes sf-* de sf.css
     Chaque dessin renvoie { W, H, svg (contenu), carts: { id: [x, y] } } :
     carts donne la place (coin haut gauche, coordonnées du dessin) des
     cartouches d'un schéma à compléter, à côté de chaque point.
     ============================================================ */
  // flèche de (x1, y1) à (x2, y2) ; t : taille de la pointe ; cls : classe (couleur, épaisseur)
  function fl(x1, y1, x2, y2, cls, t) {
    t = t || 11;
    const a = Math.atan2(y2 - y1, x2 - x1), c = Math.cos(a), s = Math.sin(a), bx = x2 - t * c, by = y2 - t * s, l = t * .48;
    return `<g class="${cls || 'sf-f'}"><line x1="${f1(x1)}" y1="${f1(y1)}" x2="${f1(bx + c)}" y2="${f1(by + s)}"/>` +
      `<path d="M${f1(x2)},${f1(y2)} L${f1(bx - l * s)},${f1(by + l * c)} L${f1(bx + l * s)},${f1(by - l * c)} Z"/></g>`;
  }
  // double flèche de cote (distance verticale ou oblique) entre deux points
  function cote(x1, y1, x2, y2, cls) {
    return fl((x1 + x2) / 2, (y1 + y2) / 2, x1, y1, cls || 'sf-cote', 8) + fl((x1 + x2) / 2, (y1 + y2) / 2, x2, y2, cls || 'sf-cote', 8);
  }
  // point repéré par une croix et sa lettre (dx, dy : place de la lettre par rapport à la croix)
  function croix(x, y, lettre, dx, dy) {
    const r = 5.5;
    return `<g class="sf-pt"><line x1="${f1(x - r)}" y1="${f1(y - r)}" x2="${f1(x + r)}" y2="${f1(y + r)}"/><line x1="${f1(x - r)}" y1="${f1(y + r)}" x2="${f1(x + r)}" y2="${f1(y - r)}"/></g>` +
      (lettre ? `<text class="sf-t-pt" x="${f1(x + (dx == null ? 10 : dx))}" y="${f1(y + (dy == null ? -8 : dy))}">${lettre}</text>` : '');
  }
  const txt = (x, y, t, cls, ancre) => `<text class="${cls || 'sf-t'}" x="${f1(x)}" y="${f1(y)}"${ancre ? ` text-anchor="${ancre}"` : ''}>${t}</text>`;
  const ligne = (x1, y1, x2, y2, cls) => `<line class="${cls}" x1="${f1(x1)}" y1="${f1(y1)}" x2="${f1(x2)}" y2="${f1(y2)}"/>`;
  // cote verticale avec ses lignes de rappel ; nom écrit à gauche (ancre 'end') ou à droite
  // (g.cache : nom masqué quand un cartouche « h = » est posé sur le dessin, voir sf.css)
  function coteV(x, y1, y2, nom, cote_) {
    const g = cote_ || {};
    return ligne(g.de1 == null ? x - 14 : g.de1, y1, x + 8, y1, 'sf-niveau') + ligne(g.de2 == null ? x - 14 : g.de2, y2, x + 8, y2, 'sf-niveau') +
      cote(x, y1, x, y2) + (nom ? txt(g.droite ? x + 9 : x - 9, (y1 + y2) / 2 + 5, nom, 'sf-t-h' + (g.cache ? ' sf-cote-nom' : ''), g.droite ? 'start' : 'end') : '');
  }
  // petite ligne de renvoi d'un point vers son cartouche
  const renvoi = (x1, y1, x2, y2) => ligne(x1, y1, x2, y2, 'sf-renvoi');
  // (seulement quand des cartouches sont posés sur le dessin)
  const rv = (o, ...a) => o.avecCartes ? renvoi(...a) : '';
  // tuyau rempli d'eau (deux traits superposés)
  const tuyau = d => `<path class="sf-tuyau" d="${d}"/><path class="sf-tuyau-eau" d="${d}"/>`;
  // maison : murs (x, y, l, h), toit et porte
  function maison(x, y, l, h, toit) {
    const t = toit || h * .55;
    return `<rect class="sf-maison" x="${x}" y="${y}" width="${l}" height="${h}"/>` +
      `<path class="sf-toit" d="M${x - 10},${y} L${x + l / 2},${y - t} L${x + l + 10},${y} Z"/>`;
  }

  const DESSINS = {
    // Château d'eau et maison : C à la surface de l'eau du château, M à l'arrivée de la maison
    chateau(o) {
      const W = 560, H = 330, yS = 78, yM = 290;
      let s = `<rect class="sf-terre" x="0" y="300" width="${W}" height="30"/>${ligne(0, 300, W, 300, 'sf-sol')}`;
      s += tuyau('M90,150 V314 H405 V292');
      s += `<rect class="sf-pilier" x="76" y="148" width="28" height="152"/>`;
      s += `<path class="sf-eau" d="M43,${yS} L137,${yS} L125,150 L55,150 Z"/>${ligne(43, yS, 137, yS, 'sf-surface')}`;
      s += `<path class="sf-paroi" d="M38,52 L58,152 L122,152 L142,52"/>`;
      s += maison(350, 205, 120, 95, 55) + `<rect class="sf-porte" x="425" y="258" width="22" height="42"/>`;
      s += croix(90, yS, 'C', -24, -8) + croix(405, yM, 'M', 9, -6) + rv(o, 397, yM - 3, 300, 236);
      if (o.h !== false) s += ligne(137, yS, 528, yS, 'sf-niveau') + coteV(536, yS, yM, o.h || 'h', { de1: 528, de2: 412, cache: o.cartH });
      return { W, H, svg: s, carts: { C: [150, 18], M: [168, 168], h: [392, 92] }, aria: 'Château d\'eau relié à une maison : point C à la surface de l\'eau du château, point M à l\'arrivée d\'eau de la maison, hauteur h entre les deux' };
    },
    // Maison et combles : A à l'arrivée d'eau (réducteur de pression), C dans les combles
    combles(o) {
      const W = 560, H = 330, yC = 108, yA = 285;
      let s = `<rect class="sf-terre" x="0" y="300" width="${W}" height="30"/>${ligne(0, 300, W, 300, 'sf-sol')}`;
      s += maison(200, 130, 180, 170, 90) + ligne(200, 130, 380, 130, 'sf-plancher');
      s += tuyau(`M150,${yA} H290 V${yC + 2}`);
      s += `<rect class="sf-reducteur" x="214" y="${yA - 9}" width="18" height="18"/>${ligne(214, yA - 9, 232, yA + 9, 'sf-reducteur-x')}${ligne(214, yA + 9, 232, yA - 9, 'sf-reducteur-x')}`;
      s += txt(186, 321, 'arrivée d\'eau', 'sf-t', 'middle');
      s += croix(250, yA, 'A', -4, -12) + croix(290, yC, 'C', 10, -6);
      s += rv(o, 300, yC, 390, 75) + rv(o, 258, yA, 390, 250);
      if (o.h !== false) s += coteV(140, yC, yA, o.h || 'h', { de1: 130, de2: 130, droite: true, cache: o.cartH }) + ligne(130, yC, 282, yC, 'sf-niveau');
      return { W, H, svg: s, carts: { C: [392, 30], A: [392, 196], h: [8, 168] }, aria: 'Maison : point A à l\'arrivée d\'eau, après le réducteur de pression ; point C dans les combles, plus haut ; hauteur h entre les deux' };
    },
    // Piscine ou cuve : A à la surface libre, B au fond (ou à la profondeur o.yB, entre 0 et 1)
    piscine(o) {
      const W = 560, H = 340, yS = 122, yF = 318, yB = o.yB == null ? yF : yS + (yF - yS) * o.yB;
      let s = `<rect class="sf-terre" x="0" y="110" width="40" height="${H - 110}"/><rect class="sf-terre" x="400" y="110" width="${W - 400}" height="${H - 110}"/>`;
      s += `<rect class="sf-terre" x="0" y="320" width="${W}" height="20"/>`;
      s += `<rect class="sf-eau${o.liquide === 'huile' ? ' sf-huile' : ''}" x="40" y="${yS}" width="360" height="${yF - yS + 2}"/>${ligne(40, yS, 400, yS, 'sf-surface')}`;
      s += `<path class="sf-paroi" d="M40,110 V320 H400 V110"/>${ligne(0, 110, 40, 110, 'sf-sol')}${ligne(400, 110, W, 110, 'sf-sol')}`;
      if (o.nomLiquide) s += txt(320, 300, o.nomLiquide, 'sf-t-liq', 'middle');
      s += croix(150, yS, 'A', -26, -6) + croix(150, yB, 'B', 10, -8);
      s += rv(o, 160, yS - 3, 212, 70) + rv(o, 160, yB - 2, 192, Math.min(yB, 260));
      if (o.h !== false) s += coteV(420, yS, yB, o.h || 'h', { de1: 405, de2: yB === yF ? 405 : 160, droite: true, cache: o.cartH });
      return { W, H, svg: s, carts: { A: [214, 4], B: [192, yB === yF ? 196 : Math.max(150, Math.min(220, yB - 50))], h: [432, Math.round((yS + yB) / 2 - 22)] },
        aria: `${o.nomLiquide ? 'Bassin rempli de ' + o.nomLiquide : 'Piscine'} : point A à la surface libre, point B ${yB === yF ? 'au fond' : 'sous la surface'}, hauteur h entre les deux` };
    },
    // Réservoir avec deux liquides : S surface libre, I interface, F fond ; o.etape 1 (S–I) ou 2 (I–F)
    reservoir(o) {
      const W = 560, H = 360, yS = 70, yI = 160, yF = 338, x0 = 150, x1 = 370;
      let s = `<rect class="sf-huile" x="${x0}" y="${yS}" width="${x1 - x0}" height="${yI - yS}"/><rect class="sf-eau" x="${x0}" y="${yI}" width="${x1 - x0}" height="${yF - yI + 2}"/>`;
      s += ligne(x0, yS, x1, yS, 'sf-surface') + ligne(x0, yI, x1, yI, 'sf-interface');
      if (o.etape === 1) s += `<rect class="sf-actif" x="${x0 + 3}" y="${yS + 3}" width="${x1 - x0 - 6}" height="${yI - yS - 6}"/>`;
      if (o.etape === 2) s += `<rect class="sf-actif" x="${x0 + 3}" y="${yI + 3}" width="${x1 - x0 - 6}" height="${yF - yI - 6}"/>`;
      s += `<path class="sf-paroi" d="M${x0},28 V${yF + 2} H${x1} V28"/>`;
      s += txt(260, 124, o.liq1 || 'huile : ρ<tspan dy="4" font-size="10">1</tspan><tspan dy="-4"> = 800 kg·m</tspan><tspan dy="-6" font-size="10">−3</tspan>', 'sf-t-liq', 'middle');
      s += txt(260, 262, o.liq2 || 'eau : ρ<tspan dy="4" font-size="10">2</tspan><tspan dy="-4"> = 1 000 kg·m</tspan><tspan dy="-6" font-size="10">−3</tspan>', 'sf-t-liq', 'middle');
      s += croix(260, yS, 'S', 10, -8) + croix(260, yI, 'I', 10, -8) + croix(260, yF - 2, 'F', 10, -8);
      if (o.etape !== 2) s += rv(o, 272, yS, 388, 46);
      s += rv(o, 272, yI, 388, o.etape === 2 ? 150 : 165);
      if (o.etape !== 1) s += rv(o, 272, yF - 4, 388, 300);
      s += coteV(125, yS, yI, o.h1 || 'h<tspan dy="4" font-size="10">1</tspan>', { de1: 115, de2: 115, cache: o.cartH && o.etape === 1 });
      s += coteV(125, yI, yF, o.h2 || 'h<tspan dy="4" font-size="10">2</tspan>', { de1: 115, de2: 115, cache: o.cartH && o.etape === 2 });
      return { W, H, svg: s, carts: { S: [390, 2], I: [390, o.etape === 2 ? 108 : 120], F: [390, 252], h: [2, o.etape === 2 ? 226 : 92] },
        aria: 'Réservoir : huile au-dessus de l\'eau ; S à la surface libre, I à l\'interface entre les deux liquides, F au fond ; h₁ hauteur d\'huile, h₂ hauteur d\'eau' };
    },
    // Baromètre de Torricelli : A en haut de la colonne de mercure (vide au-dessus), B dans le tube au niveau de la cuve, C à la surface de la cuve
    barometre(o) {
      const W = 560, H = 340, yA = 84, yB = 250;
      let s = `<rect class="sf-mercure" x="120" y="${yB}" width="320" height="70"/>${ligne(120, yB, 440, yB, 'sf-surface-hg')}`;
      s += `<path class="sf-paroi" d="M120,226 V320 H440 V226"/>`;
      s += `<rect class="sf-vide" x="302" y="34" width="26" height="${yA - 34}"/><rect class="sf-mercure" x="302" y="${yA}" width="26" height="${300 - yA}"/>`;
      s += `<path class="sf-tube" d="M300,302 V44 A15,15 0 0 1 330,44 V302"/>`;
      s += txt(338, 50, 'vide', 'sf-t');
      s += croix(315, yA, 'A', 12, 4) + croix(315, yB, 'B', 12, -8) + (o.sansC ? '' : croix(190, yB, 'C', -4, -12));
      s += rv(o, 304, yA, 268, 64) + rv(o, 304, yB - 2, 268, 186);
      if (o.h !== false) s += coteV(352, yA, yB, o.h || 'h', { de1: 330, de2: 330, droite: true, cache: o.cartH });
      return { W, H, svg: s, carts: { A: [102, 18], B: [102, 128], C: [2, 150], h: [366, 142] },
        aria: 'Baromètre de Torricelli : tube retourné dans une cuve de mercure ; vide en haut du tube ; A en haut de la colonne de mercure, B dans le tube au niveau de la surface de la cuve, C à la surface de la cuve ; h hauteur de la colonne' };
    },
    // Chalet de l'exercice 20 : cuve (S surface libre, F fond) en haut de la pente, R rez-de-chaussée, E étage
    chalet(o) {
      const W = 560, H = 360, pts = o.points || [];
      let s = `<path class="sf-terre" d="M0,106 L160,106 L330,300 L${W},300 L${W},${H} L0,${H} Z"/><path class="sf-sol" d="M0,106 L160,106 L330,300 L${W},300" fill="none"/>`;
      s += maison(360, 175, 140, 125, 55) + ligne(360, 237, 500, 237, 'sf-plancher');
      s += tuyau('M140,98 H172 L338,290 H385 V215 H420');
      s += `<rect class="sf-eau" x="42" y="56" width="106" height="48"/>${ligne(42, 56, 148, 56, 'sf-surface')}<path class="sf-paroi" d="M40,40 V106 H150 V40"/>`;
      s += txt(95, 126, 'cuve à 860 m', 'sf-t', 'middle') + txt(552, 320, 'rez-de-chaussée à 800 m', 'sf-t', 'end');
      s += croix(95, 56, 'S', -30, -6) + croix(95, 101, 'F', -28, -2) + croix(385, 290, 'R', -22, -8) + croix(420, 215, 'E', 10, -8);
      s += rv(o, 104, 100, 176, 82);
      if (pts.indexOf('R') !== -1) s += rv(o, 377, 292, 226, 286);
      if (pts.indexOf('E') !== -1) s += rv(o, 428, 210, 446, 112);
      if (o.h !== false) {
        const yb = pts.indexOf('E') !== -1 ? 215 : 290;
        s += ligne(150, 101, W - 14, 101, 'sf-niveau') + coteV(W - 22, 101, yb, o.h || 'h', { de1: W - 14, de2: pts.indexOf('E') !== -1 ? 428 : 393, cache: o.cartH });
      }
      return { W, H, svg: s, carts: { F: [176, 8], R: [60, 228], E: [376, 6], h: [218, 126] },
        aria: 'Cuve en haut de la pente (S surface libre, F fond de la cuve), reliée au chalet plus bas (R rez-de-chaussée, E étage)' };
    },
    // Cric hydraulique : petit piston (A, surface S₁, force F₁), grand piston (B, surface S₂, force F₂), à la même altitude
    cric(o) {
      const W = 560, H = 300, yP = 160;
      let s = `<path class="sf-huile" d="M92,${yP} H128 V236 H302 V${yP} H458 V256 H92 Z"/>`;
      s += `<path class="sf-paroi" d="M90,52 V258 H460 V112 M300,112 V234 H130 V52"/>`;
      s += `<rect class="sf-piston" x="92" y="${yP - 16}" width="36" height="16"/>${ligne(110, yP - 16, 110, 60, 'sf-tige')}`;
      s += `<rect class="sf-piston" x="302" y="${yP - 20}" width="156" height="20"/><rect class="sf-charge" x="330" y="${yP - 78}" width="100" height="58" rx="6"/>`;
      s += txt(380, yP - 44, o.charge || 'charge', 'sf-t', 'middle');
      s += fl(110, 64, 110, yP - 20, 'sf-f') + txt(140, 100, 'F<tspan dy="4" font-size="11">1</tspan>', 'sf-t-f');
      s += fl(380, yP - 2, 380, yP - 98, 'sf-f') + txt(388, yP - 104, 'F<tspan dy="4" font-size="10">2</tspan>', 'sf-t-f');
      s += croix(110, yP + 12, 'A', 9, 22) + croix(380, yP + 12, 'B', 10, 22) + ligne(118, yP + 12, 372, yP + 12, 'sf-niveau');
      s += txt(215, yP + 6, 'même altitude', 'sf-t', 'middle');
      s += txt(110, 280, o.s1 || 'petit piston : S<tspan dy="4" font-size="10">1</tspan>', 'sf-t', 'middle') + txt(380, 280, o.s2 || 'grand piston : S<tspan dy="4" font-size="10">2</tspan>', 'sf-t', 'middle');
      return { W, H, svg: s, carts: {}, aria: 'Cric hydraulique : une force F₁ pousse le petit piston ; l\'huile transmet la pression jusqu\'au grand piston qui soulève la charge avec une force F₂ ; A et B à la même altitude' };
    },
    // Molécules d'un gaz enfermé : agitation, chocs sur les parois, force pressante perpendiculaire à la paroi
    molecules() {
      const W = 560, H = 230, M = [[90, 70, 30], [150, 160, -50], [210, 90, 120], [260, 175, 20], [300, 60, -140], [350, 130, 70], [400, 185, -100], [440, 80, 160], [130, 115, -170], [380, 60, 40], [230, 140, -80], [470, 150, -20]];
      let s = `<rect class="sf-gaz" x="50" y="30" width="460" height="180" rx="6"/>`;
      M.forEach(([x, y, a]) => {
        const r = a * Math.PI / 180;
        s += `<circle class="sf-mol" cx="${x}" cy="${y}" r="7"/>` + fl(x + 9 * Math.cos(r), y - 9 * Math.sin(r), x + 30 * Math.cos(r), y - 30 * Math.sin(r), 'sf-f-v', 7);
      });
      // chocs sur les parois : forces pressantes perpendiculaires
      [[510, 70, 550, 70], [510, 160, 550, 160], [180, 210, 180, 248], [360, 210, 360, 248], [50, 120, 10, 120], [270, 30, 270, -8]].forEach(([x1, y1, x2, y2]) => { s += fl(x1, y1, x2, y2, 'sf-f'); });
      return { W, H: H + 40, svg: `<g transform="translate(0,14)">${s}</g>`, carts: {}, aria: 'Gaz enfermé dans un récipient : les molécules s\'agitent dans tous les sens ; leurs chocs sur les parois exercent des forces pressantes, perpendiculaires aux parois' };
    },
    // Axe des pressions : 0 (vide), P_atm, P_abs ; P_rel = P_abs − P_atm
    axe(o) {
      const W = 560, H = 160, x0 = 40, xa = 220, xp = 480, y = 46;
      let s = fl(20, y, 545, y, 'sf-axe-p', 10);
      [[x0, '0 Pa', 'vide'], [xa, 'P<tspan dy="4" font-size="10">atm</tspan>', 'air ambiant'], [xp, 'P<tspan dy="4" font-size="10">abs</tspan>', o.quoi || 'pneu']].forEach(([x, t, d]) => {
        s += ligne(x, y - 8, x, y + 8, 'sf-grad') + txt(x, y - 16, t, 'sf-t-pt', 'middle') + txt(x, y + 26, d, 'sf-t', 'middle');
      });
      s += fl(x0, 112, xp, 112, 'sf-f-abs', 9) + txt((x0 + xp) / 2, 104, 'pression absolue (par rapport au vide)', 'sf-t-a', 'middle');
      s += fl(xa, 148, xp, 148, 'sf-f', 9) + txt((xa + xp) / 2, 140, 'pression relative', 'sf-t-r', 'middle');
      s += ligne(xa, y + 34, xa, 152, 'sf-niveau') + ligne(xp, y + 34, xp, 152, 'sf-niveau') + ligne(x0, y + 34, x0, 116, 'sf-niveau');
      return { W, H: H, svg: s, carts: {}, aria: 'Axe des pressions : 0 Pa dans le vide, puis la pression atmosphérique, puis la pression absolue du pneu ; la pression relative va de la pression atmosphérique à la pression absolue' };
    },
    // Vase de forme quelconque : A et B à la même altitude, C plus bas
    vase() {
      const W = 560, H = 250, yS = 50, yAB = 130, yC = 186;
      let s = `<path class="sf-eau" d="M60,${yS} H220 V100 H420 V${yS} H500 V230 H60 Z"/>${ligne(60, yS, 220, yS, 'sf-surface')}${ligne(420, yS, 500, yS, 'sf-surface')}`;
      s += `<path class="sf-paroi" d="M60,24 V232 H500 V24 M420,24 V98 H222 V24"/>`;
      s += croix(140, yAB, 'A', 10, -8) + croix(460, yAB, 'B', 10, -8) + croix(300, yC, 'C', 10, -8) + ligne(150, yAB, 450, yAB, 'sf-niveau');
      s += txt(300, yAB - 6, 'même altitude : P<tspan dy="4" font-size="10">A</tspan><tspan dy="-4"> = P</tspan><tspan dy="4" font-size="10">B</tspan>', 'sf-t-a', 'middle');
      s += txt(300, yC + 30, 'plus bas : P<tspan dy="4" font-size="10">C</tspan><tspan dy="-4"> &gt; P</tspan><tspan dy="4" font-size="10">A</tspan>', 'sf-t-a', 'middle');
      return { W, H: H + 8, svg: s, carts: {}, aria: 'Récipient de forme quelconque rempli d\'eau : A et B à la même altitude ont la même pression ; C, plus bas, a une pression plus grande' };
    },
  };

  // dessin seul (figure d'un cours, d'une fiche ou d'un énoncé)
  function dessin(type, o) {
    const d = DESSINS[type](o || {});
    return `<svg viewBox="0 0 ${d.W} ${d.H}" class="sf-dessin" role="img" aria-label="${d.aria}">${d.svg}</svg>`;
  }

  /* Cartouches d'un schéma : un par point, plus celui de h.
     c = { pt: 'C', desc: 'surface de l'eau', role, p } ou { h: true, nom: 'h', v }
     role, p, v : HTML d'une valeur écrite, null → case vide (slot), '?' → inconnue */
  const ROLES = { haut: 'point haut', bas: 'point bas' };
  function cartouche(c, d) {
    const [x, y] = d.carts[c.h ? (c.cle || 'h') : c.pt] || [0, 0];
    const pos = `left:${(x / d.W * 100).toFixed(2)}%;top:${(y / d.H * 100).toFixed(2)}%`;
    const val = (v, id) => v == null ? slot(id) : v === '?' ? '<span class="sc-val inconnue">?</span>' : `<span class="sc-val">${v}</span>`;
    if (c.h) {
      return `<div class="sf-cart sf-cart-h" style="${pos}"><div class="sf-cart-l"><span class="sc-nom">${c.nom || 'h'} =</span>${val(c.v, c.cle || 'h')}</div></div>`;
    }
    return `<div class="sf-cart" style="${pos}">
        <div class="sf-cart-l"><span class="sf-lettre">${c.pt}</span>${c.desc ? `<span class="sf-cart-desc">${c.desc}</span>` : ''}</div>
        <div class="sf-cart-l">${val(c.role == null ? null : ROLES[c.role] || c.role, c.pt + '-role')}</div>
        <div class="sf-cart-l"><span class="sc-nom">${P(c.pt)} =</span>${val(c.p, c.pt + '-p')}</div>
      </div>`;
  }
  function schemaHTML(type, o, carts) {
    const d = DESSINS[type](Object.assign({ avecCartes: true }, o));
    return `<div class="sf-sch-cadre"><div class="sf-sch">
        <svg viewBox="0 0 ${d.W} ${d.H}" class="sf-dessin" role="img" aria-label="${d.aria}">${d.svg}</svg>
        <div class="sf-carts">${carts.map(c => cartouche(c, d)).join('')}</div></div></div>`;
  }
  // schéma rempli : les valeurs sont écrites dans les cartouches (cours, fiches, corrections)
  const schemaFig = (type, o, carts) => schemaHTML(type, Object.assign({ cartH: carts.some(c => c.h) }, o), carts);

  /* Partie « schéma à compléter » (méthode du professeur) :
     o = { type, dessin (options du dessin), q, solution,
           points: [{ pt, desc, role: 'haut' | 'bas', p: étiquette de la pression connue (HTML) ou null si inconnue,
                      indiceVide (si la case est laissée vide à tort) }],
           h: { nom, label (étiquette) ou null si inconnue, indiceVide },
           intrus: [{ label, indice }] }
     L'élève place « point haut », « point bas », les pressions connues et h ; la case
     de l'inconnue reste vide. */
  function partieSchema(o) {
    const etiquettes = [], inconnues = [], indicesCases = {};
    o.points.forEach(pt => {
      etiquettes.push({ id: 'r-' + pt.pt, label: ROLES[pt.role], cible: o.points.filter(x => x.role === pt.role).map(x => x.pt + '-role'),
        indice: pt.role === 'haut' ? 'Le point haut est le plus haut des deux (le moins profond).' : 'Le point bas est le plus bas des deux (le plus profond).' });
      if (pt.p) {
        etiquettes.push({ id: 'p-' + pt.pt, label: pt.p, cible: pt.pt + '-p', indice: pt.indice });
        if (pt.indiceVide) indicesCases[pt.pt + '-p'] = pt.indiceVide;
      } else inconnues.push(pt.pt + '-p');
    });
    // deux étiquettes « point haut » identiques ne servent à rien : une seule par rôle
    const vus = {};
    const uniques = etiquettes.filter(e => { if (!/^r-/.test(e.id)) return true; const k = e.label; if (vus[k]) return false; vus[k] = true; return true; });
    const cleH = o.h && o.h.cle || 'h';
    if (o.h && o.h.label) {
      uniques.push({ id: 'h', label: o.h.label, cible: cleH, indice: o.h.indice });
      if (o.h.indiceVide) indicesCases[cleH] = o.h.indiceVide;
    } else if (o.h) inconnues.push(cleH);
    (o.intrus || []).forEach((x, k) => uniques.push({ id: 'x' + k, label: x.label, cible: null, indice: x.indice }));
    const carts = o.points.map(pt => ({ pt: pt.pt, desc: pt.desc, role: null, p: null }));
    if (o.h) carts.push({ h: true, nom: o.h.nom || 'h', cle: cleH, v: null });
    return {
      type: 'schema', q: o.q || 'Repère sur le schéma le <b>point haut</b> et le <b>point bas</b>, puis place les valeurs connues. Laisse vide la case de l\'inconnue.',
      schema: schemaHTML(o.type, Object.assign({ cartH: !!o.h }, o.dessin), carts),
      etiquettes: uniques, inconnues, indicesCases, solution: o.solution,
      indiceInconnue: 'Cette valeur n\'est pas donnée par l\'énoncé : sa case reste vide (c\'est l\'inconnue).',
    };
  }

  /* Choix de la formule : o = { haut: 'C', bas: 'M', cherche: 'bas' | 'haut' | 'h', rho (HTML, ρ par défaut), q, solution } */
  function choixFormule(o) {
    const Ph = P(o.haut), Pb = P(o.bas), r = o.rho || 'ρ';
    const F = { bas: `${Pb} = ${Ph} + ${r} × g × h`, haut: `${Ph} = ${Pb} − ${r} × g × h`, h: `h = ${fr(`${Pb} − ${Ph}`, `${r} × g`)}` };
    const nom = { bas: Pb, haut: Ph, h: 'h' };
    const indices = {};
    Object.keys(F).forEach(k => {
      if (k !== o.cherche) indices[k] = `Cette formule donne ${nom[k]}, que tu connais déjà : l'inconnue (la case vide du schéma) est ${nom[o.cherche]}.`;
    });
    return {
      type: 'choix', q: o.q || 'Quelle formule utilises-tu pour calculer l\'inconnue ?', options: Object.keys(F).map(k => ({ id: k, label: F[k] })),
      bonne: o.cherche, melanger: false, colonne: true, indices,
      solution: o.solution || `<p>L'inconnue est ${nom[o.cherche]} : ${F[o.cherche]}.</p>`,
    };
  }

  /* Diagnostics des erreurs classiques avec P_bas = P_haut + ρ g h
     o = { cherche: 'bas' | 'haut' | 'h', Ph, Pb, rho, g, h (m), hcm (h donnée en cm), bar (pression donnée en bar), surface (P_haut = P_atm) } */
  function diagHydro(o) {
    const rgh = o.rho * o.g * (o.h || 0);
    const pr = (a, b) => b !== 0 && proche(a, b, .02);
    return v => {
      if (o.cherche === 'bas') {
        if (pr(v, rgh)) return `Tu as calculé ρ × g × h seulement : ajoute la pression du point haut${o.surface ? ' (P<sub>atm</sub> à la surface libre)' : ''}.`;
        if (pr(v, o.Ph - rgh)) return 'Le point bas est le plus profond : sa pression est la plus grande. On <b>ajoute</b> ρ × g × h.';
        if (pr(v, o.Ph + o.rho * o.h)) return 'Tu as oublié g dans ρ × g × h.';
        if (o.hcm && pr(v, o.Ph + rgh * 100)) return 'h doit être en <b>mètres</b> : convertis les cm en m.';
        if (o.bar && pr(v, o.Ph / 1e5 + rgh)) return 'Convertis d\'abord la pression en pascals : 1 bar = 10<sup>5</sup> Pa.';
        if (pr(v, o.Ph)) return 'C\'est la pression du point haut : ajoute ρ × g × h.';
        return `P<sub>bas</sub> = P<sub>haut</sub> + ρ × g × h, avec les pressions en Pa et h en m.`;
      }
      if (o.cherche === 'haut') {
        if (pr(v, o.Pb + rgh)) return 'Le point haut est le moins profond : sa pression est plus petite. On <b>retire</b> ρ × g × h.';
        if (pr(v, rgh)) return 'Tu as calculé ρ × g × h seulement : P<sub>haut</sub> = P<sub>bas</sub> − ρ × g × h.';
        if (pr(v, o.Pb - o.rho * o.h)) return 'Tu as oublié g dans ρ × g × h.';
        if (o.bar && (pr(v, o.Pb / 1e5 - rgh) || v < 0)) return 'Convertis d\'abord la pression en pascals : 1 bar = 10<sup>5</sup> Pa.';
        if (pr(v, o.Pb)) return 'C\'est la pression du point bas : retire ρ × g × h.';
        return `P<sub>haut</sub> = P<sub>bas</sub> − ρ × g × h, avec les pressions en Pa et h en m.`;
      }
      const dP = o.Pb - o.Ph;
      if (pr(v, o.Pb / (o.rho * o.g))) return 'Tu as oublié de retirer la pression du point haut : h = (P<sub>bas</sub> − P<sub>haut</sub>) / (ρ × g).';
      if (pr(v, dP / o.rho)) return 'Tu as oublié g au dénominateur.';
      if (pr(v, dP / (o.rho * o.g) * 100)) return 'h est demandée en mètres (pas en cm).';
      if (pr(v, (o.Pb + o.Ph) / (o.rho * o.g))) return 'On fait la <b>différence</b> des pressions : P<sub>bas</sub> − P<sub>haut</sub>.';
      if (o.bar && pr(v, (o.Pb / 1e5 - o.Ph / 1e5) / (o.rho * o.g))) return 'Convertis d\'abord les pressions en pascals : 1 bar = 10<sup>5</sup> Pa.';
      return 'h = (P<sub>bas</sub> − P<sub>haut</sub>) / (ρ × g), avec les pressions en Pa.';
    };
  }

  /* ============================================================
     TABLEAU DE CONVERSION DES SURFACES (partie 'perso')
     Chaque unité de surface occupe deux colonnes. Le nombre est écrit
     dans le tableau (son chiffre des unités dans la 2ᵉ colonne de
     l'unité de départ) ; l'élève touche la colonne après laquelle
     se place la virgule pour l'unité demandée, puis valide.
     o = { valeur: '30' (texte, virgule possible), de: 'cm2', vers: 'm2', unites (facultatif), q, solution }
     ============================================================ */
  const UNITES_S = [['km2', 'km²'], ['hm2', 'hm²'], ['dam2', 'dam²'], ['m2', 'm²'], ['dm2', 'dm²'], ['cm2', 'cm²'], ['mm2', 'mm²']];
  const nomS = id => (UNITES_S.find(u => u[0] === id) || [id, id])[1];
  // lecture du tableau : chiffres (cellules) et place de la virgule (après la cellule fin) → texte « 0,003 »
  function lireCellules(cells, fin) {
    const pleins = cells.map((c, k) => c === '' ? -1 : k).filter(k => k >= 0);
    const deb = Math.min(pleins[0], fin), der = Math.max(pleins[pleins.length - 1], fin);
    let ent = '', dec = '';
    for (let k = deb; k <= der; k++) { const c = cells[k] === '' ? '0' : cells[k]; if (k <= fin) ent += c; else dec += c; }
    ent = ent.replace(/^0+(?=\d)/, '');
    dec = dec.replace(/0+$/, '');
    return (ent || '0').replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + (dec ? ',' + dec : '');
  }
  function surfaces(zone, o, api) {
    const [ent, dec] = String(o.valeur).split(',');
    // colonnes du tableau : de m² à mm² par défaut, élargies aux unités de départ et d'arrivée,
    // et assez de colonnes pour tous les chiffres du nombre
    const ids = UNITES_S.map(u => u[0]), base = o.unites || ['m2', 'dm2', 'cm2', 'mm2'];
    const iDe = ids.indexOf(o.de), iVers = ids.indexOf(o.vers);
    let i0 = Math.min(ids.indexOf(base[0]), iDe, iVers), i1 = Math.max(ids.indexOf(base[base.length - 1]), iDe, iVers);
    while (2 * (iDe - i0) + 2 < ent.length && i0 > 0) i0--;
    while (2 * (i1 - iDe) < (dec || '').length && i1 < ids.length - 1) i1++;
    const unites = ids.slice(i0, i1 + 1);
    const n = 2 * unites.length, finDe = 2 * unites.indexOf(o.de) + 1, finVers = 2 * unites.indexOf(o.vers) + 1;
    const cells = Array(n).fill('');
    ent.split('').reverse().forEach((c, k) => { if (finDe - k >= 0) cells[finDe - k] = c; });
    (dec || '').split('').forEach((c, k) => { if (finDe + 1 + k < n) cells[finDe + 1 + k] = c; });
    const d = el('div', 'sf-tabs');
    d.innerHTML = `<div class="sf-defile"><table class="sf-tabs-t">
        <tr>${unites.map(u => `<th colspan="2">${nomS(u)}</th>`).join('')}</tr>
        <tr>${cells.map((c, k) => `<td><button type="button" class="sf-tabs-c${k % 2 ? ' fin-u' : ''}${k === finDe ? ' depart' : ''}" data-k="${k}" aria-label="Virgule après la ${k % 2 ? '2ᵉ' : '1ʳᵉ'} colonne des ${nomS(unites[k >> 1])}">${c}</button></td>`).join('')}</tr>
      </table></div>
      <p class="sf-tabs-lect" aria-live="polite">Virgule de départ : après les ${nomS(o.de)} (trait pointillé). Touche la colonne après laquelle tu places la virgule pour avoir des ${nomS(o.vers)}.</p>`;
    zone.appendChild(d);
    const bs = Array.from(d.querySelectorAll('.sf-tabs-c')), lect = d.querySelector('.sf-tabs-lect');
    const bVal = boutonValider(zone);
    let choix = -1, fini = false;
    // affichage : virgule choisie, et zéros complétés une fois la réponse juste
    function rendre(zeros) {
      const pleins = cells.map((x, j) => x === '' ? -1 : j).filter(j => j >= 0);
      const deb = Math.min(pleins[0], choix), der = Math.max(pleins[pleins.length - 1], choix);
      bs.forEach((b, k) => {
        b.classList.toggle('virgule', k === choix);
        // zéros ajoutés entre les chiffres et la virgule (et le 0 des unités)
        const z = zeros && cells[k] === '' && k >= deb && k <= der;
        b.textContent = z ? '0' : cells[k];
        b.classList.toggle('zero', z);
      });
    }
    bs.forEach(b => {
      b.onclick = () => {
        if (fini || api.fini()) return;
        choix = +b.dataset.k;
        rendre(false);
        lect.textContent = `Virgule placée après la ${choix % 2 ? '2ᵉ' : '1ʳᵉ'} colonne des ${nomS(unites[choix >> 1])}.`;
        api.effacer();
      };
    });
    function terminer() {
      fini = true;
      rendre(true);
      bs.forEach(b => { b.disabled = true; });
      const ecart = finVers - finDe;
      lect.innerHTML = `<b>${o.valeur} ${nomS(o.de)} = ${lireCellules(cells, finVers)} ${nomS(o.vers)}</b> : la virgule s'est déplacée de ${Math.abs(ecart)} colonne${Math.abs(ecart) > 1 ? 's' : ''} ${ecart < 0 ? 'vers la gauche' : 'vers la droite'}, soit × 10<sup>${String(ecart).replace('-', MOINS)}</sup>.`;
      bVal.fermer();
    }
    bVal.onclick = () => {
      if (fini || api.fini()) return;
      if (choix < 0) { secouer(d); api.message('Touche d\'abord la colonne après laquelle tu places la virgule.'); return; }
      if (choix === finVers) { choix = finVers; terminer(); api.reussi(); return; }
      let ind;
      if (choix % 2 === 0) ind = 'Une unité de surface occupe <b>deux colonnes</b> : la virgule se place après la 2ᵉ colonne de l\'unité voulue.';
      else if (choix === finDe) ind = `La virgule est encore après les ${nomS(o.de)} : déplace-la jusqu'aux ${nomS(o.vers)}.`;
      else if (choix === finDe + (finVers - finDe) / 2) ind = 'Tu as compté une colonne par unité, comme pour des longueurs. En surface, chaque unité occupe <b>deux colonnes</b>.';
      else ind = `La virgule se place après la colonne des <b>${nomS(o.vers)}</b>.`;
      api.erreur(ind);
      secouer(d);
    };
    return { montrer() { choix = finVers; terminer(); } };
  }
  const partieSurfaces = o => ({ type: 'perso', q: o.q || `Convertis ${o.valeur} ${nomS(o.de)} en ${nomS(o.vers)} : place la virgule dans le tableau.`, solution: o.solution, o, monter: (zone, api) => surfaces(zone, o, api) });

  /* ============================================================
     PLAN DE L'APPLICATION ET NAVIGATION (voir assets/sommaire.js)
     ============================================================ */
  const PLAN = [
    { n: 1, titre: 'Pression et force pressante', desc: 'Origine de la pression, P = F / S, Pa, bar et hPa, surfaces en m²', fiche: 'fiche_1',
      parties: [{ nom: 'Pression et force pressante', cours: 'module_1_cours', questions: 'module_1_questions' }] },
    { n: 2, titre: 'Pression absolue et pression relative', desc: 'Par rapport au vide ou à l\'air ambiant : P<sub>rel</sub> = P<sub>abs</sub> − P<sub>atm</sub>', fiche: 'fiche_2',
      parties: [{ nom: 'Pression absolue et pression relative', cours: 'module_2_cours', questions: 'module_2_questions' }] },
    { n: 3, titre: 'Principe fondamental de l\'hydrostatique', desc: 'P<sub>bas</sub> = P<sub>haut</sub> + ρ g h ; point haut et point bas repérés sur un schéma', fiche: 'fiche_3',
      parties: [{ nom: 'Le principe', slug: 'principe', cours: 'module_3a_cours' },
        { nom: 'La méthode du schéma', slug: 'methode', cours: 'module_3b_cours', questions: 'module_3_questions' }] },
    { n: 4, titre: 'Presse, cric hydraulique et baromètre', desc: 'Transmission de la pression, F₂ = P × S₂, baromètre de Torricelli', fiche: 'fiche_4',
      parties: [{ nom: 'Presse, cric et baromètre', cours: 'module_4_cours', questions: 'module_4_questions' }] },
    { n: 5, titre: 'Exercices', desc: 'Exercices 7, 8, 11, 14, 21, 18, 15, 22 et 20 de la feuille, guidés pas à pas', exercices: 'module_5', exNom: 'Exercices de la feuille', nbEx: 9 },
  ];
  window.SOM.init({ nom: 'Chapitre 9 : Statique des fluides', id: 'statique-fluides', cleEx: 'statique-fluides-exercices', plan: PLAN });
  const menu = cle => window.SOM.menu(cle);
  const accueil = zone => window.SOM.accueil(zone);
  const marquer = info => window.SOM.marquer(info);

  window.SF = Object.assign(window.SF || {}, {
    MOINS, fmt, cs, sci, lire, proche, fr, o, fq, el, secouer, melanger, hasard, entre, champ, boutonValider, PARTIES, versCours,
    question, serie, confettis, slot, fl, cote, croix,
    P, PATM, pa, dessin, schemaFig, partieSchema, choixFormule, diagHydro, partieSurfaces, lireCellules,
    PLAN, menu, accueil, marquer,
  });
})();
