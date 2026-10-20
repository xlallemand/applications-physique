/* ============================================================
   Moteur de l'application « Chapitre 10 : Énergie transportée par
   la lumière » (Terminale STI2D ; même moteur de questions que
   « Cinématique » et « Chapitre 9 : Statique des fluides » ;
   navigation commune assets/sommaire.js, cours avec assets/cours.js,
   glisser-déposer assets/dragdrop.js)

   EL.fmt, EL.cs, EL.sci, EL.lire      écriture et lecture des nombres (virgule)
   EL.o, EL.fq.choix, EL.fq.nombre      fabriques d'options et de parties de question
   EL.PARTIES                           parties de question : 'choix', 'nombre', 'gabarit', 'sci',
                                        'schema' (étiquettes à glisser), 'grille' (un choix par ligne),
                                        'perso' (p.monter(zone, api) → { montrer() })
   EL.versCours(p)                      une de ces parties dans un cours (assets/cours.js)
   EL.question(zone, q, cb, mode)       question en plusieurs parties (série, exercice, activité 'cours')
   EL.serie(opts)                       série de questions notée sur 20

   Propre au chapitre 10 :
     EL.H, EL.C, EL.EV                  h = 6,63 × 10⁻³⁴ J·s ; c = 3,00 × 10⁸ m·s⁻¹ ; 1 eV = 1,602 × 10⁻¹⁹ J
     EL.domaine(λ), EL.idDomaine(λ)     domaine d'une onde électromagnétique (λ en m)
     EL.optionsDomaine()                options d'un QCM « domaine »
     EL.couleurLambda(nm), EL.nomCouleur(nm)  couleur d'un photon visible (attribut SVG) et son nom
     EL.spectre()                       spectre électromagnétique (SVG)
     EL.chaine(o), EL.partieChaine(o)   schéma énergétique (rempli, ou étiquettes à glisser)
     EL.figNiveaux(o), EL.partieNiveaux(o)  niveaux d'énergie d'un atome : figure, outil (transitions)
     EL.carac(nom), EL.caracEchelle(…)  caractéristiques I(U) de panneaux photovoltaïques
     EL.figCarac(def, o), EL.partiePanneau(o)  caractéristique I(U) : figure, outil du rectangle P = U × I
     EL.figPU(def, o)                   courbe P(U) d'un panneau
     EL.circuit(o), EL.partieCircuit(o) circuit de mesure de la caractéristique (rempli, ou appareils à placer)
     EL.dessin(type, o)                 dessins : 'maison', 'photoelectrique', 'capteurs'
   EL.menu(cle), EL.accueil(zone)       navigation commune (SOM) avec le plan de l'application

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
  const proche = (a, b, rel) => Math.abs(a - b) <= (rel == null ? .01 : rel) * Math.abs(b) + 1e-12;

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
    const d = el('div', 'ph-valeur el-gab');
    if (p.label) d.appendChild(el('span', 'ph-lab', p.label));
    // chaque case forme un groupe insécable avec le texte qui la suit : sur un petit écran,
    // la ligne ne se coupe qu'entre deux groupes
    const champs = [];
    let grp = el('span', 'el-gab-grp');
    d.appendChild(grp);
    p.morceaux.forEach(m => {
      if (typeof m === 'string') { grp.appendChild(el('span', 'el-gab-txt', m)); return; }
      if (champs.length) { grp = el('span', 'el-gab-grp'); d.appendChild(grp); }
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
      slots.forEach(s => { s.tabIndex = -1; if (estInconnue(s)) s.classList.add('el-inconnue'); });
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
      secouer(d.querySelector('.el-sch') || d);
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
    const g = el('div', 'el-grille');
    g.innerHTML = p.lignes.map(l => `<div class="el-grille-l" data-l="${l.id}">
        <div class="el-grille-nom">${l.label}</div>
        <div class="el-grille-ch" role="group" aria-label="${String(l.label).replace(/<[^>]+>/g, '').replace(/"/g, '')}">
          ${p.options.map(o => `<button type="button" class="el-grille-b" data-o="${o.id}" aria-pressed="false">${o.label}</button>`).join('')}</div>
        <div class="el-grille-apres" hidden></div></div>`).join('');
    zone.appendChild(g);
    const lignes = Array.from(g.querySelectorAll('.el-grille-l'));
    const choisi = {};
    lignes.forEach(L => {
      L.querySelectorAll('.el-grille-b').forEach(b => {
        b.onclick = () => {
          if (api.fini() || b.disabled) return;
          choisi[L.dataset.l] = b.dataset.o;
          L.querySelectorAll('.el-grille-b').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
          L.classList.remove('ok', 'ko');
          api.effacer();
        };
      });
    });
    const bVal = boutonValider(zone);
    function terminer() {
      lignes.forEach((L, k) => {
        L.classList.remove('ko'); L.classList.add('ok');
        L.querySelectorAll('.el-grille-b').forEach(b => { b.disabled = true; });
        const a = L.querySelector('.el-grille-apres');
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
        lignes.forEach((L, k) => L.querySelectorAll('.el-grille-b').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.o === p.lignes[k].bonne))));
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
            'cours'    activité sans points : « Afficher la réponse » après une erreur
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
      window.EL.partieEnCours = p;          // partie en cours (utile pour vérifier l'application)
      const d = el('div', 'ph-partie', `${p.q ? `<div class="ph-partie-q">${p.q}</div>` : ''}<div class="ph-partie-fig"></div><div class="ph-partie-zone"></div><div class="ph-partie-retour"></div>
        <div class="ph-partie-aide${mode === 'cours' && !p.aide ? ' hidden' : ''}"><button type="button" class="btn-small">${libAide}</button></div>`);
      zone.appendChild(d);
      if (p.figure) p.figure(d.querySelector('.ph-partie-fig'));
      const ret = d.querySelector('.ph-partie-retour'), aide = d.querySelector('.ph-partie-aide'), bRep = aide.querySelector('button');
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
      window.EL.questionEnCours = q;          // question en cours (utile pour vérifier l'application)
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
     PROPRE AU CHAPITRE 10 : constantes, domaines, couleurs
     ============================================================ */
  const H = 6.63e-34, C = 3.00e8, EV = 1.602e-19;
  const ESP = ' ';                                             // espace insécable (unités)

  // domaines des ondes électromagnétiques (λ en m, bornes supérieures)
  const DOMAINES = [
    { id: 'gamma', nom: 'rayons γ', max: 1e-11 },
    { id: 'X', nom: 'rayons X', max: 1e-8 },
    { id: 'UV', nom: 'ultraviolet (UV)', max: 4e-7 },
    { id: 'visible', nom: 'lumière visible', max: 8e-7 },
    { id: 'IR', nom: 'infrarouge (IR)', max: 1e-3 },
    { id: 'micro', nom: 'micro-ondes (ondes hertziennes)', max: 1 },
    { id: 'radio', nom: 'ondes radio (ondes hertziennes)', max: Infinity },
  ];
  const domaine = lam => DOMAINES.find(d => lam < d.max);
  // pour les QCM : micro-ondes et ondes radio forment les ondes hertziennes
  const idDomaine = lam => { const d = domaine(lam).id; return d === 'micro' || d === 'radio' ? 'hertz' : d; };
  const optionsDomaine = () => [o('gamma', 'rayons γ'), o('X', 'rayons X'), o('UV', 'ultraviolet (UV)'), o('visible', 'visible'),
    o('IR', 'infrarouge (IR)'), o('hertz', 'ondes hertziennes (micro-ondes, radio)')];
  const NOMS_DOM = { gamma: 'rayons γ', X: 'rayons X', UV: 'ultraviolet', visible: 'visible', IR: 'infrarouge', hertz: 'ondes hertziennes' };

  // couleur d'un photon visible (λ en nm), en attribut SVG (comme VEC.C) ; gris hors du visible
  const GRIS = '#8d8f94';
  function couleurLambda(nm) {
    if (nm < 380 || nm > 800) return GRIS;
    let r = 0, g = 0, b = 0;
    if (nm < 440) { r = (440 - nm) / 60; b = 1; } else if (nm < 490) { g = (nm - 440) / 50; b = 1; }
    else if (nm < 510) { g = 1; b = (510 - nm) / 20; } else if (nm < 580) { r = (nm - 510) / 70; g = 1; }
    else if (nm < 645) { r = 1; g = (645 - nm) / 65; } else r = 1;
    // foncée pour rester lisible sur fond blanc (le jaune surtout)
    const k = nm > 540 && nm < 600 ? .72 : .86, h2 = v => Math.round(v * k * 255).toString(16).padStart(2, '0');
    return '#' + h2(r) + h2(g) + h2(b);
  }
  function nomCouleur(nm) {
    return nm < 450 ? 'violet' : nm < 490 ? 'bleu' : nm < 560 ? 'vert' : nm < 590 ? 'jaune' : nm < 620 ? 'orange' : 'rouge';
  }

  // textes SVG : indice et puissance de 10 (tspan)
  const ind = s => `<tspan dy="4" font-size="10">${s}</tspan><tspan dy="-4"></tspan>`;
  const p10 = e => `10<tspan dy="-7" font-size="10">${String(e).replace('-', MOINS)}</tspan><tspan dy="7"></tspan>`;
  const txt = (x, y, t, cls, ancre) => `<text class="${cls || 'el-t'}" x="${f1(x)}" y="${f1(y)}"${ancre ? ` text-anchor="${ancre}"` : ''}>${t}</text>`;
  const ligne = (x1, y1, x2, y2, cls) => `<line class="${cls}" x1="${f1(x1)}" y1="${f1(y1)}" x2="${f1(x2)}" y2="${f1(y2)}"/>`;
  // flèche de (x1, y1) à (x2, y2) ; t : taille de la pointe ; cls : classe (couleur, épaisseur)
  function fl(x1, y1, x2, y2, cls, t) {
    t = t || 11;
    const a = Math.atan2(y2 - y1, x2 - x1), c = Math.cos(a), s = Math.sin(a), bx = x2 - t * c, by = y2 - t * s, l = t * .48;
    return `<g class="${cls || 'el-f'}"><line x1="${f1(x1)}" y1="${f1(y1)}" x2="${f1(bx + c)}" y2="${f1(by + s)}"/>` +
      `<path d="M${f1(x2)},${f1(y2)} L${f1(bx - l * s)},${f1(by + l * c)} L${f1(bx + l * s)},${f1(by - l * c)} Z"/></g>`;
  }
  // onde (photon) : ligne ondulée de (x1, y) à (x2, y) terminée par une pointe, couleur en attribut
  function onde(x1, x2, y, couleur, cls) {
    let d = '';
    const n = 48, L = x2 - 10 - x1;
    for (let k = 0; k <= n; k++) { const t = k / n; d += (k ? 'L' : 'M') + f1(x1 + t * L) + ',' + f1(y + 6 * Math.sin(t * Math.PI * 2 * 3.5)); }
    return `<g class="${cls || 'el-onde'}"><path d="${d}" fill="none" stroke="${couleur}" stroke-width="2.6" stroke-linecap="round"/>` +
      `<path d="M${f1(x2)},${f1(y)} L${f1(x2 - 11)},${f1(y - 5.5)} L${f1(x2 - 11)},${f1(y + 5.5)} Z" fill="${couleur}"/></g>`;
  }

  /* ============================================================
     SPECTRE ÉLECTROMAGNÉTIQUE (cases de même largeur, bornes écrites)
     ============================================================ */
  let nSpectre = 0;
  function spectre() {
    const id = 'el-arc-' + (++nSpectre);
    const W = 700, x0 = 64, w = 87, yB = 62, hB = 46;
    const cases = ['rayons γ', 'rayons X', 'UV', 'visible', 'IR', 'micro-ondes', 'radio'];
    const lam = [p10(-11) + ' m', p10(-8) + ' m', '400 nm', '800 nm', '1 mm', '1 m'];
    const fr_ = ['3 × ' + p10(19), '3 × ' + p10(16), '7,5 × ' + p10(14), '3,75 × ' + p10(14), '3 × ' + p10(11), '3 × ' + p10(8)];
    let s = `<defs><linearGradient id="${id}" x1="0" x2="1" y1="0" y2="0">` +
      [400, 450, 490, 530, 570, 600, 640, 700, 800].map(nm => `<stop offset="${((nm - 400) / 400).toFixed(3)}" stop-color="${couleurLambda(nm)}"/>`).join('') + '</linearGradient></defs>';
    s += fl(x0 + 140, 14, x0 + 470, 14, 'el-f-fin', 9) + txt(x0 + 480, 19, 'λ augmente', 'el-t-a');
    cases.forEach((c, k) => {
      const x = x0 + k * w;
      s += `<rect x="${x}" y="${yB}" width="${w}" height="${hB}" class="${k === 3 ? '' : k % 2 ? 'el-sp-c2' : 'el-sp-c'}"${k === 3 ? ` fill="url(#${id})"` : ''}/>`;
      s += txt(x + w / 2, yB + 28, c, k === 3 ? 'el-t-vis' : 'el-t-sp', 'middle');
    });
    s += `<rect x="${x0}" y="${yB}" width="${7 * w}" height="${hB}" class="el-sp-cadre"/>`;
    lam.forEach((t, k) => {
      const x = x0 + (k + 1) * w;
      s += ligne(x, yB - 8, x, yB + hB + 8, 'el-sp-borne') + txt(x, yB - 13, t, 'el-t-b', 'middle') + txt(x, yB + hB + 22, fr_[k], 'el-t-b', 'middle');
    });
    s += txt(x0 - 4, yB - 13, 'λ :', 'el-t-b', 'end') + txt(x0 - 4, yB + hB + 22, 'f (Hz) :', 'el-t-b', 'end');
    // ondes hertziennes : micro-ondes et radio
    const xa = x0 + 5 * w + 6, xb = x0 + 7 * w - 6, yH = yB + hB + 38;
    s += `<path d="M${xa},${yH - 6} V${yH} H${xb} V${yH - 6}" class="el-accolade"/>` + txt((xa + xb) / 2, yH + 17, 'ondes hertziennes', 'el-t-a', 'middle');
    s += fl(x0 + 470, yH + 38, x0 + 140, yH + 38, 'el-f-fin', 9) + txt(x0 + 305, yH + 58, 'f et l\'énergie E des photons augmentent', 'el-t-a', 'middle');
    return `<div class="el-defile"><svg viewBox="0 0 ${W} ${yH + 66}" class="el-spectre" role="img" aria-label="Spectre électromagnétique, des longueurs d'onde les plus courtes aux plus longues : rayons gamma (moins de 10 puissance −11 m), rayons X (jusqu'à 10 puissance −8 m), ultraviolet (jusqu'à 400 nm), visible (400 à 800 nm), infrarouge (jusqu'à 1 mm), micro-ondes (jusqu'à 1 m), ondes radio. Micro-ondes et radio forment les ondes hertziennes. La fréquence et l'énergie des photons augmentent quand la longueur d'onde diminue.">${s}</svg></div>`;
  }

  /* ============================================================
     SCHÉMA ÉNERGÉTIQUE
     o = { entree, conv, sorties: [..], pertes, noms: { entree, sortie, pertes } }
     chaque valeur : texte (HTML) déjà écrit, ou { slot: id } pour une case où glisser une étiquette.
     Sur un écran étroit, le schéma se met à la verticale (assets : el.css).
     ============================================================ */
  const ENERGIES = { solaire: 'solaire', thermique: 'thermique', electrique: 'électrique', chimique: 'chimique', mecanique: 'mécanique', lumineuse: 'lumineuse' };
  const FLECHE = '<svg viewBox="0 0 40 16" aria-hidden="true"><line x1="1" y1="8" x2="29" y2="8"/><path d="M39,8 L27,1.5 L27,14.5 Z"/></svg>';
  function val(v) {
    if (v && v.slot) return slot(v.slot);
    return `<span class="el-ch-v">${v}</span>`;
  }
  function chaine(o) {
    const n = Object.assign({ entree: 'Énergie reçue', sortie: o.sorties.length > 1 ? 'Énergies fournies' : 'Énergie utile', pertes: 'Énergie perdue' }, o.noms);
    return `<div class="el-ch-cadre"><div class="el-ch${o.pertes ? '' : ' sans-pertes'}" role="group" aria-label="Schéma énergétique">
        <div class="el-ch-b el-ch-in"><span class="el-ch-nom">${n.entree}</span>${val(o.entree)}</div>
        <div class="el-fl el-fl-1">${FLECHE}</div>
        <div class="el-ch-conv">${val(o.conv)}</div>
        <div class="el-fl el-fl-2">${FLECHE}</div>
        <div class="el-ch-b el-ch-out"><span class="el-ch-nom">${n.sortie}</span>${o.sorties.map(val).join('<span class="el-ch-et">et</span>')}</div>
        ${o.pertes ? `<div class="el-fl el-fl-p">${FLECHE}</div><div class="el-ch-b el-ch-pe"><span class="el-ch-nom">${n.pertes}</span>${val(o.pertes)}</div>` : ''}
      </div></div>`;
  }
  /* Schéma énergétique à compléter (partie 'schema') :
     o = { conv: nom du convertisseur (écrit), ou convOptions: [{ id, label }] + convBonne (case à remplir),
           entree: id d'énergie, sorties: [ids], pertes: id (facultatif), intrus: [ids],
           indices: { id d'énergie ou de convertisseur: diagnostic si l'étiquette est mal placée }, noms, q, solution } */
  function partieChaine(o) {
    const att = { in: [o.entree], pe: o.pertes ? [o.pertes] : [] };
    o.sorties.forEach((e, k) => { att['out' + k] = [e]; });
    // une étiquette par case à remplir ; une même énergie peut aller dans plusieurs cases
    const etiquettes = [];
    Object.keys(att).forEach(sl => att[sl].forEach(e => {
      const cibles = Object.keys(att).filter(s => att[s].indexOf(e) !== -1);
      etiquettes.push({ id: e + '-' + sl, label: ENERGIES[e], cible: cibles, indice: (o.indices || {})[e] });
    }));
    (o.intrus || []).forEach(e => etiquettes.push({ id: e + '-x', label: ENERGIES[e], cible: null, indice: (o.indices || {})[e] }));
    let conv = o.conv;
    if (o.convOptions) {
      conv = { slot: 'conv' };
      o.convOptions.forEach(c => etiquettes.push({ id: 'c-' + c.id, label: c.label, cible: c.id === o.convBonne ? 'conv' : null, indice: (o.indices || {})[c.id] }));
    }
    const schema = chaine({ entree: { slot: 'in' }, conv, sorties: o.sorties.map((e, k) => ({ slot: 'out' + k })), pertes: o.pertes ? { slot: 'pe' } : null, noms: o.noms });
    const rempli = chaine({ entree: ENERGIES[o.entree], conv: o.convOptions ? o.convOptions.find(c => c.id === o.convBonne).label : o.conv,
      sorties: o.sorties.map(e => ENERGIES[e]), pertes: o.pertes ? ENERGIES[o.pertes] : null, noms: o.noms });
    return { type: 'schema', titrePalette: o.titrePalette || 'Énergies', q: o.q || 'Complète le schéma énergétique : fais glisser les étiquettes dans les cases.',
      schema, etiquettes, solution: (o.solution || '') + (o.sansRempli ? '' : rempli), correction: (o.solution || '') + (o.sansRempli ? '' : rempli) };
  }

  /* ============================================================
     NIVEAUX D'ÉNERGIE D'UN ATOME
     niveaux : [{ nom: 'E₁', e: −13,6 (eV) }, …] du plus bas au plus haut
     ============================================================ */
  const HYDROGENE = [{ nom: 'E<sub>1</sub>', s: '1', e: -13.6 }, { nom: 'E<sub>2</sub>', s: '2', e: -3.40 }, { nom: 'E<sub>3</sub>', s: '3', e: -1.51 }];
  // une transition de i vers j : énergie, fréquence, longueur d'onde, domaine
  function transition(niv, i, j) {
    const dE = Math.abs(niv[j].e - niv[i].e), J = dE * EV, f = J / H, lam = C / f;
    return { i, j, sens: j > i ? 'absorption' : 'emission', dE, J, f, lam, nm: lam * 1e9, dom: domaine(lam), coul: couleurLambda(lam * 1e9) };
  }
  // géométrie et SVG du diagramme ; et = { el: niveau de l'électron, t: transition affichée }
  function geoNiv(niv) {
    const emin = niv[0].e, emax = niv[niv.length - 1].e;
    return { W: 420, H: 250, y: e => 222 - (e - emin) / (emax - emin) * 172 };
  }
  function svgNiveaux(niv, et, o) {
    o = o || {};
    const G = geoNiv(niv), xe = 165;
    let s = fl(40, 236, 40, 14, 'el-f-axe', 9) + txt(48, 20, 'E (eV)', 'el-t-a');
    niv.forEach((n, k) => {
      const y = G.y(n.e);
      s += `<g class="el-niv${o.cliquable ? ' cliquable' : ''}" data-k="${k}">${ligne(70, y, 262, y, 'el-niv-l')}` +
        txt(270, y + 5, `E${ind(n.s)} = ${n.e === 0 ? '0' : cs(n.e, 3)} eV`, 'el-t-niv') +
        (o.cliquable ? `<rect x="62" y="${f1(y - 16)}" width="350" height="32" class="el-niv-zone"/>` : '') + '</g>';
    });
    const t = et.t;
    if (t) {
      const y1 = G.y(niv[t.i].e), y2 = G.y(niv[t.j].e), ym = (y1 + y2) / 2;
      s += fl(xe, y1, xe, y2 + (t.sens === 'absorption' ? 7 : -7), 'el-f-trans', 10);
      s += t.sens === 'absorption' ? onde(78, 152, ym, t.coul, 'el-onde el-onde-in') + txt(112, ym - 13, 'h f', 'el-t-hf', 'middle')
        : onde(178, 256, ym, t.coul, 'el-onde el-onde-out') + txt(214, ym - 13, 'h f', 'el-t-hf', 'middle');
    }
    if (et.el != null) s += `<circle cx="${xe}" cy="${f1(G.y(niv[et.el].e))}" r="7" class="el-electron" data-a="electron"/>`;
    return s;
  }
  // figure : o = { niveaux, de, vers, sansPhoton } ; l'électron est sur le niveau d'arrivée
  function figNiveaux(o) {
    const niv = o.niveaux || HYDROGENE, t = o.de != null ? transition(niv, o.de, o.vers) : null;
    const et = { el: o.de != null ? o.vers : (o.electron == null ? 0 : o.electron), t: o.sansPhoton ? null : t };
    const aria = t ? `Niveaux d'énergie ; ${t.sens === 'absorption' ? 'absorption d\'un photon : l\'électron monte' : 'émission d\'un photon : l\'électron descend'} du niveau ${niv[t.i].s} au niveau ${niv[t.j].s}` : 'Niveaux d\'énergie d\'un atome';
    return `<svg viewBox="0 0 420 250" class="el-dessin el-niv-svg" role="img" aria-label="${aria}">${svgNiveaux(niv, et, o)}</svg>`;
  }
  // phrase qui décrit une transition (unités, chiffres significatifs)
  function texteTransition(niv, t) {
    const a = niv[Math.max(t.i, t.j)], b = niv[Math.min(t.i, t.j)];
    const vis = t.dom.id === 'visible' ? `lumière visible, <b>${nomCouleur(t.nm)}</b>` : `<b>${t.dom.nom}</b>`;
    return `<p><b>${t.sens === 'absorption' ? 'Absorption' : 'Émission'}</b> : l'électron passe de E${ind_h(niv[t.i].s)} à E${ind_h(niv[t.j].s)} ; il ${t.sens === 'absorption' ? 'gagne' : 'perd'} ` +
      `ΔE = E${ind_h(a.s)} − E${ind_h(b.s)} = ${fmt(t.dE, 2)} eV = ${sci(t.J, 3)} J.</p>` +
      `<p>Photon ${t.sens === 'absorption' ? 'absorbé' : 'émis'} : f = ΔE / h = ${sci(t.f, 3)} Hz ; λ = c / f = ${t.nm < 2000 ? fmt(Math.round(t.nm)) + ' nm' : sci(t.lam, 3) + ' m'} : ${vis}.</p>`;
  }
  const ind_h = s => `<sub>${s}</sub>`;

  /* Outil « niveaux d'énergie » (partie 'perso') : l'élève touche un niveau, l'électron y passe ;
     le photon absorbé (il arrive) ou émis (il part) est dessiné à la couleur de sa longueur d'onde,
     et ΔE, f, λ, le domaine s'affichent.
     o = { niveaux, depart (niveau de départ de l'électron, 0 par défaut),
           but: { sens: 'emission' | 'absorption', test(t) → vrai si la transition convient, diag(t) → diagnostic },
           libre: true (pas de but : réussi quand l'élève a fait une absorption et une émission), q, solution, montrer: [i, j] } */
  function niveaux(zone, o, api) {
    const niv = o.niveaux || HYDROGENE;
    const et = { el: o.depart || 0, t: null };
    let fini = false;
    const vus = { absorption: false, emission: false };
    const d = el('div', 'el-niv-outil');
    d.innerHTML = `<div class="el-niv-scene"><svg viewBox="0 0 420 250" class="el-dessin el-niv-svg" role="group" aria-label="Niveaux d'énergie de l'atome ; touche un niveau pour y faire passer l'électron"></svg></div>
      <div class="el-niv-boutons" role="group" aria-label="Faire passer l'électron sur un niveau"><span>Faire passer l'électron sur :</span>
        ${niv.map((n, k) => `<button type="button" class="btn-secondary" data-k="${k}">${n.nom}</button>`).join('')}</div>
      <div class="el-niv-lect" aria-live="polite"><p>L'électron est sur le niveau ${niv[et.el].nom}. Touche un autre niveau.</p></div>`;
    zone.appendChild(d);
    const svg = d.querySelector('svg'), lect = d.querySelector('.el-niv-lect');
    function rendre(ancien) {
      svg.innerHTML = svgNiveaux(niv, et, { cliquable: !fini });
      d.querySelectorAll('.el-niv-boutons button').forEach(b => { b.disabled = fini || +b.dataset.k === et.el; });
      // l'électron part de l'ancien niveau (animation coupée si l'élève préfère moins de mouvement, voir el.css)
      const e = svg.querySelector('[data-a="electron"]');
      if (e && ancien != null && ancien !== et.el) {
        const G = geoNiv(niv), dy = G.y(niv[ancien].e) - G.y(niv[et.el].e);
        e.style.transform = `translateY(${f1(dy)}px)`;
        e.classList.add(et.t && et.t.sens === 'absorption' ? 'apres-photon' : 'avant-photon');
        requestAnimationFrame(() => requestAnimationFrame(() => { e.style.transform = ''; }));
      }
    }
    function aller(k) {
      if (fini || api.fini() || k === et.el) return;
      const ancien = et.el;
      et.t = transition(niv, ancien, k);
      et.el = k;
      vus[et.t.sens] = true;
      rendre(ancien);
      lect.innerHTML = texteTransition(niv, et.t);
      api.effacer();
      if (o.libre) {
        if (vus.absorption && vus.emission) { terminer(); api.reussi(); }
        else lect.insertAdjacentHTML('beforeend', `<p class="el-gris">Essaie maintenant une ${vus.absorption ? 'émission (fais descendre l\'électron)' : 'absorption (fais monter l\'électron)'}.</p>`);
        return;
      }
      const b = o.but;
      if (!b) return;
      // une transition dans l'autre sens prépare la suivante : pas d'erreur comptée
      if (b.sens && et.t.sens !== b.sens) {
        api.message(b.sens === 'emission' ? 'L\'électron monte : c\'est une absorption. Pour <b>émettre</b> un photon, il doit <b>descendre</b>.' : 'L\'électron descend : c\'est une émission. Pour <b>absorber</b> un photon, il doit <b>monter</b>.');
        return;
      }
      if (b.test(et.t)) { terminer(); api.reussi(); return; }
      api.erreur(b.diag ? b.diag(et.t) : 'Ce photon ne convient pas : essaie une autre transition.');
    }
    function terminer() { fini = true; rendre(); }
    svg.addEventListener('click', e => { const g = e.target.closest && e.target.closest('.el-niv'); if (g) aller(+g.dataset.k); });
    d.querySelectorAll('.el-niv-boutons button').forEach(b => { b.onclick = () => aller(+b.dataset.k); });
    rendre();
    return {
      montrer() {
        if (o.montrer) {
          et.el = o.montrer[0];
          const ancien = et.el;
          et.t = transition(niv, o.montrer[0], o.montrer[1]); et.el = o.montrer[1];
          lect.innerHTML = texteTransition(niv, et.t);
          fini = true; rendre(ancien);
        } else terminer();
      },
    };
  }
  const partieNiveaux = o => ({ type: 'perso', q: o.q, solution: o.solution, correction: o.solution, aide: o.aide, o, monter: (zone, api) => niveaux(zone, o, api) });

  /* ============================================================
     CARACTÉRISTIQUES I(U) DE PANNEAUX PHOTOVOLTAÏQUES
     def = { pts: [[U, I], …] (courbe lisse passant par ces points, dernier point : tension à vide),
             u: { max, pas, sous }, i: { max, pas, sous }, p: { max, pas } (courbe P(U)), titre, aria }
     ============================================================ */
  // courbe lisse passant par les points (interpolation d'Hermite monotone, « PCHIP »)
  function pchip(pts) {
    const n = pts.length, x = pts.map(p => p[0]), y = pts.map(p => p[1]), h = [], dl = [], m = [];
    for (let i = 0; i < n - 1; i++) { h[i] = x[i + 1] - x[i]; dl[i] = (y[i + 1] - y[i]) / h[i]; }
    m[0] = dl[0]; m[n - 1] = dl[n - 2];
    for (let i = 1; i < n - 1; i++) {
      if (dl[i - 1] * dl[i] <= 0) m[i] = 0;
      else { const w1 = 2 * h[i] + h[i - 1], w2 = h[i] + 2 * h[i - 1]; m[i] = (w1 + w2) / (w1 / dl[i - 1] + w2 / dl[i]); }
    }
    return t => {
      if (t <= x[0]) return y[0];
      if (t >= x[n - 1]) return y[n - 1];
      let i = 0;
      while (i < n - 2 && t > x[i + 1]) i++;
      const s = (t - x[i]) / h[i], s2 = s * s, s3 = s2 * s;
      return Math.max(0, (2 * s3 - 3 * s2 + 1) * y[i] + (s3 - 2 * s2 + s) * h[i] * m[i] + (-2 * s3 + 3 * s2) * y[i + 1] + (s3 - s2) * h[i] * m[i + 1]);
    };
  }
  // fonctions de la caractéristique : I(U), tension à vide, point de puissance maximale
  function preparer(def) {
    if (def.f) return def;
    def.f = pchip(def.pts);
    def.uv = def.pts[def.pts.length - 1][0];
    let m = [0, 0, 0];
    for (let k = 0; k <= 4000; k++) { const u = def.uv * k / 4000, p = u * def.f(u); if (p > m[2]) m = [u, def.f(u), p]; }
    def.mpp = { u: m[0], i: m[1], p: m[2] };
    return def;
  }
  // forme de la caractéristique du module TE2200 (exercice 15) : point de puissance maximale (29,7 V ; 7,5 A)
  const FORME = [[0, 7.9], [10, 7.82], [20, 7.72], [27, 7.62], [29.7, 7.5], [30.5, 7.15], [32, 6.0], [34.5, 2.8], [36.3, 0]];
  const FORME_MPP = [29.82, 7.479];                          // calculé (script) pour la forme ci-dessus
  const CARACS = {
    // caractéristique du cours (éclairement 500 W·m⁻²) : U_nominal ≈ 18 V, I_nominal ≈ 0,52 A, tension à vide 22 V
    cours: { pts: [[0, 0.6], [10, 0.585], [15, 0.565], [18, 0.52], [19, 0.46], [20.5, 0.28], [22, 0]],
      u: { max: 25, pas: 5, sous: 1 }, i: { max: 0.7, pas: 0.1, sous: 0.05 }, p: { max: 10, pas: 2 }, titre: '500 W·m⁻²',
      aria: 'Caractéristique I(U) d\'un panneau éclairé à 500 W par m² : l\'intensité reste proche de 0,6 A puis chute vers 18 V et s\'annule à 22 V' },
    // module TE2200 (exercice 15 p. 131), éclairement 1,00 kW·m⁻² à 25 °C
    te2200: { pts: FORME, u: { max: 40, pas: 5, sous: 1 }, i: { max: 9, pas: 1, sous: 0.5 }, p: { max: 250, pas: 50 }, titre: 'TE2200 · 1,00 kW·m⁻² à 25 °C',
      aria: 'Caractéristique I(U) du module TE2200 : l\'intensité reste proche de 8 A puis chute après 30 V et s\'annule vers 36 V' },
  };
  const carac = nom => preparer(Object.assign({}, CARACS[nom], { pts: CARACS[nom].pts.slice() }));
  // caractéristique de même forme, mise à l'échelle pour que le point de puissance maximale soit (um, im)
  function caracEchelle(um, im, axes) {
    const su = um / FORME_MPP[0], si = im / FORME_MPP[1];
    return preparer(Object.assign({ pts: FORME.map(([u, i]) => [u * su, i * si]),
      aria: `Caractéristique I(U) d'un panneau : l'intensité reste presque constante puis chute et s'annule vers ${fmt(Math.round(36.3 * su))} V` }, axes));
  }

  // géométrie d'un graphique (largeur W) ; ax = { x: { max, pas, sous }, y: { max, pas, sous } }
  function geom(ax, W, Hmin, Hmax, ratio) {
    const H = Math.round(Math.min(Hmax, Math.max(Hmin, W * ratio)));
    const g = 50, d = 22, h = 30, b = 44, L = W - g - d, Hh = H - h - b;
    return { W, H, g, d, h, b, L, Hh, X: v => g + v / ax.x.max * L, Y: v => h + Hh - v / ax.y.max * Hh, invX: px => (px - g) / L * ax.x.max };
  }
  // quadrillage, graduations et axes
  function axes(ax, G, noms) {
    const { X, Y, g, h, L, Hh, H } = G;
    let s = '';
    const lignes = (a, f) => { const st = a.sous || a.pas; for (let k = 0; k * st <= a.max + 1e-9; k++) { const v = k * st; f(v, Math.abs(v / a.pas - Math.round(v / a.pas)) < 1e-6); } };
    lignes(ax.x, (v, maj) => { s += ligne(X(v), h, X(v), h + Hh, maj ? 'el-quad' : 'el-sous-quad'); });
    lignes(ax.y, (v, maj) => { s += ligne(g, Y(v), g + L, Y(v), maj ? 'el-quad' : 'el-sous-quad'); });
    const serre = L / (ax.x.max / ax.x.pas) < 46;
    for (let k = 0, v = 0; v <= ax.x.max + 1e-9; k++, v = k * ax.x.pas) if (!serre || k % 2 === 0) s += txt(X(v), h + Hh + 18, fmt(v), 'ph-graduation', 'middle');
    for (let k = 0, v = 0; v <= ax.y.max + 1e-9; k++, v = k * ax.y.pas) s += txt(g - 7, Y(v) + 4, fmt(+v.toFixed(6)), 'ph-graduation', 'end');
    s += ligne(g, h + Hh, g + L + 8, h + Hh, 'ph-axe') + ligne(g, h + Hh, g, h - 10, 'ph-axe');
    s += `<path d="M${g + L + 14},${h + Hh} l-9,-4.5 v9 Z M${g},${h - 16} l-4.5,9 h9 Z" class="ph-fleche"/>`;
    s += txt(g + L + 4, H - 6, noms[0], 'ph-axe-nom', 'end') + txt(g + 8, h - 8, noms[1], 'ph-axe-nom');
    return s;
  }
  // tracé d'une fonction (coupé hors du cadre)
  function trace(f, a, b, G, ymax, cls) {
    let p = '';
    for (let k = 0; k <= 300; k++) { const x = a + (b - a) * k / 300, y = f(x); p += (k ? 'L' : 'M') + f1(G.X(x)) + ',' + f1(G.Y(Math.min(ymax, Math.max(0, y)))); }
    return `<path d="${p}" class="${cls}"/>`;
  }
  const axIU = def => ({ x: def.u, y: def.i });
  const axPU = def => ({ x: def.u, y: { max: def.p.max, pas: def.p.pas, sous: def.p.pas / 2 } });

  /* Figures dessinées à la largeur disponible (cours, fiches, énoncés) : un emplacement
     est rendu dans la page, puis dessiné (et redessiné si la largeur change). */
  const FIGS = new Map();
  let nFig = 0;
  function figure(dessin, cls) {
    const k = String(++nFig);
    FIGS.set(k, dessin);
    return `<div class="el-fig${cls ? ' ' + cls : ''}" data-fig="${k}"></div>`;
  }
  function monterFig(div, dessin) {
    if (div.dataset.monte) return;
    div.dataset.monte = '1';
    let largeur = 0;
    const tracerIci = () => {
      const W = Math.min(640, Math.round(div.clientWidth));
      if (!W || W === largeur) return;
      largeur = W;
      div.innerHTML = dessin(W);
    };
    if (window.ResizeObserver) new ResizeObserver(tracerIci).observe(div); else addEventListener('resize', tracerIci);
    tracerIci();
  }
  function chercherFigs(racine) {
    if (!racine || !racine.querySelectorAll) return;
    const l = racine.matches && racine.matches('.el-fig[data-fig]') ? [racine] : [];
    racine.querySelectorAll('.el-fig[data-fig]').forEach(x => l.push(x));
    l.forEach(x => { const f = FIGS.get(x.dataset.fig); if (f) monterFig(x, f); });
  }
  new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(chercherFigs))).observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener('DOMContentLoaded', () => chercherFigs(document.body));

  // contenu SVG d'une caractéristique I(U) ; o = { point: U (point de fonctionnement repéré), rect: true, vide: true (tension à vide repérée) }
  function svgCarac(def, G, o) {
    o = o || {};
    let s = axes(axIU(def), G, ['U (V)', 'I (A)']) + trace(def.f, 0, def.uv, G, def.i.max, 'el-c');
    if (def.titre) s += txt(G.g + G.L - 4, G.h + 14, def.titre, 'el-t-titre', 'end');
    if (o.point != null) {
      const u = o.point, i = def.f(u), x = G.X(u), y = G.Y(i);
      if (o.rect) s += `<rect x="${G.g}" y="${f1(y)}" width="${f1(x - G.g)}" height="${f1(G.h + G.Hh - y)}" class="el-rect"/>`;
      s += `<path d="M${f1(x)},${G.h + G.Hh} V${f1(y)} H${G.g}" class="ph-lecture" fill="none"/><circle cx="${f1(x)}" cy="${f1(y)}" r="5.5" class="ph-point"/>`;
      // étiquette à droite du point, ou à gauche s'il est près du bord droit
      if (o.etiq) s += x > G.W - 180 ? txt(x - 10, y - 12, o.etiq, 'el-t-lect', 'end') : txt(x + 8, y - 10, o.etiq, 'el-t-lect');
    }
    if (o.vide) s += `<circle cx="${f1(G.X(def.uv))}" cy="${f1(G.Y(0))}" r="5.5" class="ph-point"/>` + txt(Math.min(G.X(def.uv), G.W - 52), G.Y(0) - 12, 'tension à vide', 'el-t-lect', 'middle');
    return s;
  }
  function figCarac(def, o) {
    preparer(def);
    return figure(W => { const G = geom(axIU(def), W, 230, 340, .6); return `<svg viewBox="0 0 ${G.W} ${G.H}" width="${G.W}" class="ph-graphe" role="img" aria-label="${def.aria || 'Caractéristique I(U)'}">${svgCarac(def, G, o)}</svg>`; });
  }
  // courbe P(U) ; o = { point: U (repéré), sommet: true (P max repérée) }
  function svgPU(def, G, o) {
    o = o || {};
    let s = axes(axPU(def), G, ['U (V)', 'P (W)']) + trace(u => u * def.f(u), 0, def.uv, G, def.p.max, 'el-c-p');
    if (o.sommet) {
      const m = def.mpp, x = G.X(m.u), y = G.Y(m.p);
      s += `<path d="M${f1(x)},${G.h + G.Hh} V${f1(y)} H${G.g}" class="ph-lecture" fill="none"/><circle cx="${f1(x)}" cy="${f1(y)}" r="5.5" class="ph-point"/>` + txt(G.g + 6, y - 7, 'P<tspan dy="4" font-size="10">max</tspan>', 'el-t-lect');
    }
    if (o.point != null) {
      const u = o.point, p = u * def.f(u), x = G.X(u), y = G.Y(p);
      s += ligne(x, G.h + G.Hh, x, y, 'ph-lecture') + `<circle cx="${f1(x)}" cy="${f1(y)}" r="5.5" class="ph-point"/>`;
    }
    return s;
  }
  function figPU(def, o) {
    preparer(def);
    return figure(W => { const G = geom(axPU(def), W, 180, 280, .45); return `<svg viewBox="0 0 ${G.W} ${G.H}" width="${G.W}" class="ph-graphe" role="img" aria-label="Courbe P(U) du panneau : la puissance augmente avec U, passe par un maximum puis s'annule à la tension à vide">${svgPU(def, G, o)}</svg>`; });
  }

  /* Outil du rectangle (partie 'perso') : le point glisse sur la caractéristique I(U) (au doigt, à la
     souris ou avec les flèches) ; le rectangle O-U-I-point est dessiné, son aire vaut P = U × I.
     o = { def, depart (U), afficheP (P en direct, vrai par défaut), mini (courbe P(U) en dessous, vrai par défaut),
           tolU (écart accepté sur U, 5 % de la tension à vide par défaut), q, solution } */
  function panneau(zone, o, api) {
    const def = preparer(o.def), afficheP = o.afficheP !== false, mini = o.mini !== false;
    const tol = o.tolU || def.uv * .05, pas = o.pas || def.u.max / 80;
    const st = { u: o.depart == null ? def.uv * .3 : o.depart };
    let fini = false, G = null, G2 = null, prise = false, tape = null, largeur = 0;
    const d = el('div', 'el-pan-outil');
    d.innerHTML = `<div class="el-pan-graphe"></div>
      <div class="el-pan-lect" aria-live="polite"></div>
      ${mini ? '<div class="el-pan-mini"></div>' : ''}
      <div class="el-pan-pad" role="group" aria-label="Déplacer le point sur la caractéristique">
        <button type="button" data-d="-1" aria-label="Déplacer le point vers la gauche (U plus petite)">←</button><button type="button" data-d="1" aria-label="Déplacer le point vers la droite (U plus grande)">→</button></div>`;
    zone.appendChild(d);
    const box = d.querySelector('.el-pan-graphe'), boxP = d.querySelector('.el-pan-mini'), lect = d.querySelector('.el-pan-lect');
    const mobile = () => {
      const u = st.u, i = def.f(u), x = G.X(u), y = G.Y(i);
      return `<rect x="${G.g}" y="${f1(y)}" width="${f1(x - G.g)}" height="${f1(G.h + G.Hh - y)}" class="el-rect"/>` +
        (afficheP && x - G.g > 70 && G.h + G.Hh - y > 34 ? txt((G.g + x) / 2, (y + G.h + G.Hh) / 2 + 5, 'P = U × I', 'el-t-rect', 'middle') : '') +
        `<path d="M${f1(x)},${G.h + G.Hh} V${f1(y)} H${G.g}" class="ph-lecture" fill="none"/>` +
        `<circle cx="${f1(x)}" cy="${f1(y)}" r="8" class="el-pt-mobile${fini ? ' fini' : ''}"/>` +
        (fini ? '' : `<circle cx="${f1(x)}" cy="${f1(y)}" r="24" class="el-poignee"/>`);
    };
    const mobileP = () => {
      const u = st.u, p = u * def.f(u), x = G2.X(u), y = G2.Y(p);
      return ligne(x, G2.h + G2.Hh, x, y, 'ph-lecture') + `<circle cx="${f1(x)}" cy="${f1(y)}" r="6" class="el-pt-mobile${fini ? ' fini' : ''}"/>`;
    };
    function lecture() {
      const u = st.u, i = def.f(u);
      lect.innerHTML = afficheP ? `U = <b>${fmt(u, 1)} V</b> · I = <b>${fmt(i, i < 2 ? 3 : 2)} A</b> · P = U × I = <b>${fmt(u * i, u * i < 20 ? 2 : 0)} W</b>`
        : '<span class="el-gris">Fais glisser le point : le rectangle grisé a pour aire P = U × I.</span>';
    }
    function tracer() {
      const W = Math.min(Math.round(box.clientWidth), 640);
      if (!W) return;
      largeur = W;
      G = geom(axIU(def), W, 230, 340, .6);
      box.innerHTML = `<svg viewBox="0 0 ${G.W} ${G.H}" width="${G.W}" class="ph-graphe el-pan-svg" role="group" aria-label="${def.aria || 'Caractéristique I(U)'} ; point à déplacer sur la courbe">${svgCarac(def, G)}<g data-a="mobile">${mobile()}</g></svg>`;
      if (boxP) {
        G2 = geom(axPU(def), W, 150, 220, .34);
        boxP.innerHTML = `<svg viewBox="0 0 ${G2.W} ${G2.H}" width="${G2.W}" class="ph-graphe" role="img" aria-label="Courbe P(U) correspondante : le point suit la position choisie">${svgPU(def, G2)}<g data-a="mobileP">${mobileP()}</g></svg>`;
      }
      lecture();
    }
    const maj = () => {
      const m = box.querySelector('[data-a="mobile"]'); if (m) m.innerHTML = mobile();
      const mp = boxP && boxP.querySelector('[data-a="mobileP"]'); if (mp) mp.innerHTML = mobileP();
      lecture(); api.effacer();
    };
    const borner = () => { st.u = Math.min(def.uv, Math.max(0, Math.round(st.u / (pas / 5)) * (pas / 5))); };
    if (window.ResizeObserver) new ResizeObserver(() => { if (Math.min(Math.round(box.clientWidth), 640) !== largeur) tracer(); }).observe(box);
    tracer();
    const posU = e => { const s = box.querySelector('svg'), r = s.getBoundingClientRect(); return G.invX((e.clientX - r.left) * G.W / r.width); };
    // doigt posé sur la poignée : pas de défilement de la page (touch-action n'est pas appliqué aux formes SVG)
    box.addEventListener('touchstart', e => { if (!fini && e.target.closest && e.target.closest('.el-poignee')) e.preventDefault(); }, { passive: false });
    box.addEventListener('pointerdown', e => {
      if (fini || !G) return;
      if (e.target.closest('.el-poignee')) { e.preventDefault(); prise = true; box.classList.add('glisse'); box.querySelector('svg').setPointerCapture(e.pointerId); }
      else tape = [e.clientX, e.clientY];
    });
    box.addEventListener('pointermove', e => { if (!prise) return; st.u = posU(e); borner(); maj(); });
    box.addEventListener('pointerup', e => {
      if (prise) { st.u = posU(e); borner(); maj(); }
      // simple appui sur le graphique : le point va à cette tension
      if (!prise && tape && Math.hypot(e.clientX - tape[0], e.clientY - tape[1]) < 8 && !fini) {
        const u = posU(e);
        if (u >= 0 && u <= def.u.max) { st.u = u; borner(); maj(); }
      }
      prise = false; tape = null; box.classList.remove('glisse');
    });
    box.addEventListener('pointercancel', () => { prise = false; tape = null; box.classList.remove('glisse'); });
    d.querySelectorAll('.el-pan-pad button').forEach(b => { b.onclick = () => { if (fini) return; st.u += +b.dataset.d * pas; borner(); maj(); }; });
    const bVal = boutonValider(zone);
    function verrouiller() {
      fini = true;
      d.classList.add('fini');
      d.querySelectorAll('.el-pan-pad button').forEach(b => { b.disabled = true; });
      bVal.fermer();
      maj();
      if (afficheP) lect.innerHTML = `Point de fonctionnement : U ≈ <b>${fmt(st.u, 1)} V</b>, I ≈ <b>${fmt(def.f(st.u), def.f(st.u) < 2 ? 2 : 1)} A</b> ; P<sub>max</sub> = U × I ≈ <b>${fmt(st.u * def.f(st.u), st.u * def.f(st.u) < 20 ? 1 : 0)} W</b>`;
    }
    bVal.onclick = () => {
      if (fini || api.fini()) return;
      const ecart = st.u - def.mpp.u;
      if (Math.abs(ecart) <= tol) { verrouiller(); api.reussi(); return; }
      api.erreur(ecart < 0
        ? (st.u < def.mpp.u * .6 ? 'Ton rectangle est haut mais <b>étroit</b> : U est trop petite. Vers la droite, I ne diminue presque pas et U augmente : l\'aire P = U × I grandit encore.'
          : 'Tu peux encore aller un peu vers la droite : I diminue à peine et U augmente, le rectangle grandit encore.')
        : (def.f(st.u) < def.mpp.i * .6 ? 'Tu as dépassé le coude : I s\'effondre, le rectangle est large mais <b>aplati</b>. Reviens vers la gauche.'
          : 'Un peu trop à droite : après le coude, I chute vite et le rectangle perd de la hauteur. Reviens légèrement vers la gauche.'));
      secouer(box);
    };
    return { montrer() { st.u = def.mpp.u; verrouiller(); } };
  }
  const partiePanneau = o => ({ type: 'perso', q: o.q || 'Fais glisser le point ● sur la caractéristique (ou utilise les flèches) jusqu\'au point de fonctionnement, puis valide.', solution: o.solution, correction: o.solution, o, monter: (zone, api) => panneau(zone, o, api) });

  /* ============================================================
     CIRCUIT DE MESURE DE LA CARACTÉRISTIQUE
     panneau, voltmètre en dérivation (case 1), ampèremètre en série (case 2), résistance variable (case 3)
     ============================================================ */
  const APPAREILS = { V: 'voltmètre', A: 'ampèremètre', R: 'résistance variable' };
  function circuitSVG(rempli) {
    const W = 470, H = 290, yh = 56, yb = 250, xP = 82, xV = 200, xA = 310, xR = 410;
    let s = '';
    // fils
    const yR1 = rempli ? 110 : 131, yR2 = rempli ? 196 : 175;
    s += `<path d="M${xP},120 V${yh} H${xR} V${yR1} M${xR},${yR2} V${yb} H${xP} V182" class="el-fil"/>`;
    s += `<path d="M${xV},${yh} V128 M${xV},172 V${yb}" class="el-fil"/>`;
    s += `<circle cx="${xV}" cy="${yh}" r="4.5" class="el-noeud"/><circle cx="${xV}" cy="${yb}" r="4.5" class="el-noeud"/>`;
    // panneau photovoltaïque : rectangle à cellules, éclairé
    s += `<rect x="${xP - 30}" y="120" width="60" height="62" rx="4" class="el-panneau"/>`;
    for (let k = 1; k < 3; k++) s += ligne(xP - 30 + k * 20, 120, xP - 30 + k * 20, 182, 'el-panneau-l');
    s += ligne(xP - 30, 151, xP + 30, 151, 'el-panneau-l');
    s += fl(xP - 76, 112, xP - 40, 134, 'el-f-fin', 8) + fl(xP - 76, 136, xP - 40, 158, 'el-f-fin', 8);
    s += txt(xP + 10, 204, 'panneau', 'el-t');
    if (rempli) {
      s += `<circle cx="${xV}" cy="150" r="22" class="el-app"/>` + txt(xV, 157, 'V', 'el-t-app', 'middle');
      s += ligne(xA - 50, yh, xA + 50, yh, 'el-fil-cache') + `<circle cx="${xA}" cy="${yh}" r="22" class="el-app"/>` + txt(xA, yh + 7, 'A', 'el-t-app', 'middle');
      s += `<rect x="${xR - 12}" y="110" width="24" height="86" class="el-app"/>` + fl(xR - 26, 186, xR + 24, 118, 'el-f-res', 9);
      s += txt(xV + 28, 128, 'voltmètre', 'el-t') + txt(xA, yh - 30, 'ampèremètre', 'el-t', 'middle') + txt(xR - 22, 232, 'résistance variable', 'el-t', 'end');
    } else {
      // emplacements vides, numérotés
      s += `<rect x="${xV - 24}" y="128" width="48" height="44" rx="10" class="el-vide"/>`;
      s += ligne(xA - 50, yh, xA + 50, yh, 'el-fil-cache') + `<rect x="${xA - 26}" y="${yh - 22}" width="52" height="44" rx="10" class="el-vide"/>`;
      s += `<rect x="${xR - 24}" y="131" width="48" height="44" rx="10" class="el-vide"/>`;
      [[xV, 150, 1], [xA, yh, 2], [xR, 153, 3]].forEach(([x, y, n]) => { s += `<g class="el-pose-num"><circle cx="${x}" cy="${y}" r="15"/>${txt(x, y + 6, n, '', 'middle')}</g>`; });
    }
    return { W, H, svg: s, cases: { c1: [xV, 150, 1], c2: [xA, yh, 2], c3: [xR, 153, 3] },
      aria: rempli ? 'Circuit de mesure : le panneau alimente une résistance variable ; un ampèremètre est en série dans le circuit, un voltmètre est branché en dérivation aux bornes du panneau'
        : 'Circuit à compléter : panneau photovoltaïque ; emplacement 1 entre les deux fils, aux bornes du panneau ; emplacement 2 sur le fil du haut ; emplacement 3 sur la branche de droite' };
  }
  function circuit() {
    const d = circuitSVG(true);
    return `<svg viewBox="0 0 ${d.W} ${d.H}" class="el-dessin el-circuit" role="img" aria-label="${d.aria}">${d.svg}</svg>`;
  }
  // dessin avec des cases posées dessus ; sur un écran étroit, les cases passent sous le dessin, repérées par leur numéro
  function schemaPose(d, contenus) {
    return `<div class="el-pose-cadre"><div class="el-pose"><svg viewBox="0 0 ${d.W} ${d.H}" class="el-dessin" role="img" aria-label="${d.aria}">${d.svg}</svg>
      <div class="el-pose-cases">${Object.keys(contenus).map(id => {
        const [x, y, n] = d.cases[id];
        return `<div class="el-pose-case" style="left:${(x / d.W * 100).toFixed(2)}%;top:${(y / d.H * 100).toFixed(2)}%"><span class="el-num">${n}</span>${contenus[id]}</div>`;
      }).join('')}</div></div></div>`;
  }
  // partie 'schema' : placer les trois appareils (et un intrus)
  function partieCircuit(o) {
    o = o || {};
    const d = circuitSVG(false);
    return { type: 'schema', titrePalette: 'Appareils', q: o.q || 'Complète le circuit qui permet de tracer la caractéristique du panneau : fais glisser chaque appareil à sa place.',
      schema: schemaPose(d, { c1: slot('c1'), c2: slot('c2'), c3: slot('c3') }),
      etiquettes: [
        { id: 'V', label: APPAREILS.V, cible: 'c1', indice: 'Le voltmètre mesure la tension <b>aux bornes</b> du panneau : il se branche en <b>dérivation</b>, entre les deux fils.' },
        { id: 'A', label: APPAREILS.A, cible: 'c2', indice: 'L\'ampèremètre mesure le courant qui <b>traverse</b> le circuit : il se branche en <b>série</b>, sur un fil.' },
        { id: 'R', label: APPAREILS.R, cible: 'c3', indice: 'La résistance variable est la charge du panneau : en la faisant varier, on obtient les différents points (U ; I).' },
        { id: 'G', label: 'générateur', cible: null, indice: 'Pas de générateur : c\'est le panneau éclairé qui fournit l\'énergie électrique.' },
      ],
      solution: (o.solution || '<p>Le <b>voltmètre</b> est en <b>dérivation</b> aux bornes du panneau, l\'<b>ampèremètre</b> en <b>série</b> ; on fait varier la <b>résistance</b> pour obtenir chaque point (U ; I).</p>') + circuit() };
  }

  /* ============================================================
     DESSINS (SVG) : couleurs par les classes el-* de el.css
     ============================================================ */
  const DESSINS = {
    // Maison à très faible consommation (activité, doc. 1) : énergies en GJ par an
    maison() {
      const W = 600, H = 396, sol = 304;
      let s = `<rect x="0" y="${sol}" width="${W}" height="${H - sol}" class="el-terre"/>${ligne(0, sol, W, sol, 'el-sol')}`;
      // soleil au-dessus du toit
      s += `<circle cx="300" cy="32" r="18" class="el-soleil"/>`;
      for (let k = 0; k < 10; k++) { const a = k * Math.PI / 5; s += ligne(300 + 24 * Math.cos(a), 32 + 24 * Math.sin(a), 300 + 32 * Math.cos(a), 32 + 32 * Math.sin(a), 'el-rayon'); }
      // maison : murs, toit, panneaux sur les deux pentes
      s += `<rect x="150" y="170" width="300" height="${sol - 170}" class="el-mur"/><path d="M130,170 L300,100 L470,170 Z" class="el-toit"/>`;
      s += ligne(166, 150, 266, 109, 'el-pv') + ligne(360, 118, 428, 146, 'el-pv');
      s += txt(160, 128, 'photovoltaïque 40 m²', 'el-t', 'end') + txt(440, 128, 'capteur hybride 8 m²', 'el-t');
      // énergie solaire reçue
      s += fl(286, 58, 222, 122, 'el-f-sol', 11) + txt(238, 84, '217', 'el-t-n', 'end') + fl(314, 58, 390, 124, 'el-f-sol', 11) + txt(362, 84, '36', 'el-t-n');
      // boîtes
      const boite = (x, y, w, t) => `<rect x="${x}" y="${y}" width="${w}" height="30" rx="8" class="el-boite"/>` + txt(x + w / 2, y + 20, t, 'el-t-b2', 'middle');
      s += boite(10, 196, 112, 'réseau électrique') + boite(290, 182, 140, 'lumières, appareils') + boite(170, 248, 60, 'PAC') + boite(250, 248, 82, 'chauffage') + boite(350, 248, 86, 'eau chaude');
      // énergie électrique (trait plein) : panneaux → 14 GJ, dont 7 vers le réseau et 7 pour la maison
      s += `<path d="M236,122 V165 M394,138 V160 H236" class="el-e-elec" fill="none"/>` + txt(244, 158, '14', 'el-t-n');
      s += `<path d="M236,160 V211 H132" class="el-e-elec" fill="none"/>` + fl(140, 211, 124, 211, 'el-f-elec', 10) + txt(186, 204, '7', 'el-t-n', 'middle');
      s += `<path d="M236,197 H280" class="el-e-elec" fill="none"/>` + fl(272, 197, 288, 197, 'el-f-elec', 10) + txt(262, 190, '7', 'el-t-n', 'middle');
      // réseau → PAC (8) et → lumières (9)
      s += `<path d="M50,226 V263 H160" class="el-e-elec" fill="none"/>` + fl(152, 263, 168, 263, 'el-f-elec', 10) + txt(110, 256, '8', 'el-t-n', 'middle');
      s += `<path d="M90,226 V232 H300 V224" class="el-e-elec" fill="none"/>` + fl(300, 230, 300, 214, 'el-f-elec', 10) + txt(200, 226, '9', 'el-t-n', 'middle');
      // énergie thermique (tirets) : hybride → eau chaude (11), géothermie → PAC (19), PAC → chauffage (25)
      s += `<path d="M428,150 H464 V263 H446" class="el-e-th" fill="none"/>` + fl(450, 263, 438, 263, 'el-f-th', 10) + txt(472, 214, '11', 'el-t-n');
      s += `<path d="M150,358 H200 V296" class="el-e-th" fill="none"/>` + fl(200, 298, 200, 280, 'el-f-th', 10) + txt(210, 334, '19', 'el-t-n');
      s += fl(231, 263, 249, 263, 'el-f-th', 9) + txt(240, 297, '25', 'el-t-n', 'middle');
      // capteur géothermique enterré
      s += `<path d="M40,322 H150 C162,322 162,334 150,334 H40 C28,334 28,346 40,346 H150 C162,346 162,358 150,358" class="el-geo" fill="none"/>`;
      s += txt(96, 384, 'capteur géothermique', 'el-t', 'middle');
      // légende
      s += `<g transform="translate(14,14)">${ligne(0, 6, 34, 6, 'el-e-sol')}${txt(42, 11, 'énergie solaire', 'el-t')}${ligne(0, 28, 34, 28, 'el-e-elec')}${txt(42, 33, 'énergie électrique', 'el-t')}${ligne(0, 50, 34, 50, 'el-e-th')}${txt(42, 55, 'énergie thermique', 'el-t')}</g>`;
      s += txt(588, 20, 'énergies en GJ', 'el-t-a', 'end') + txt(588, 38, '(10⁹ J) par an', 'el-t-a', 'end');
      return { W, H, svg: s, aria: 'Bilan énergétique annuel d\'une maison à très faible consommation, en gigajoules : les panneaux photovoltaïques (40 m²) reçoivent 217 GJ d\'énergie solaire, le capteur hybride (8 m²) 36 GJ ; ensemble, ils fournissent 14 GJ d\'énergie électrique (7 vers le réseau, 7 pour les lumières et appareils) ; le capteur hybride fournit aussi 11 GJ d\'énergie thermique pour l\'eau chaude ; le capteur géothermique enterré fournit 19 GJ d\'énergie thermique à la pompe à chaleur (PAC), alimentée aussi par 8 GJ d\'électricité du réseau ; la PAC fournit 25 GJ pour le chauffage ; le réseau fournit encore 9 GJ aux lumières et appareils' };
    },
    // Effet photoélectrique : photons qui arrivent sur un matériau, électrons arrachés
    photoelectrique() {
      const W = 520, H = 256;
      let s = `<rect x="40" y="170" width="440" height="56" rx="6" class="el-materiau"/>` + txt(476, 248, 'matériau', 'el-t', 'end');
      [[60, 30, 150, 160], [120, 30, 210, 160], [180, 30, 270, 160]].forEach(([x1, y1, x2, y2]) => {
        let d = '';
        const n = 40, L = Math.hypot(x2 - x1, y2 - y1) - 12, a = Math.atan2(y2 - y1, x2 - x1);
        for (let k = 0; k <= n; k++) { const t = k / n, u = t * L, v = 6 * Math.sin(t * Math.PI * 7); d += (k ? 'L' : 'M') + f1(x1 + u * Math.cos(a) - v * Math.sin(a)) + ',' + f1(y1 + u * Math.sin(a) + v * Math.cos(a)); }
        s += `<path d="${d}" class="el-photon" fill="none"/>` + fl(x2 - 14 * Math.cos(a), y2 - 14 * Math.sin(a), x2, y2, 'el-f-photon', 11);
      });
      s += txt(70, 22, 'photons (onde électromagnétique)', 'el-t-a');
      [[90, 196], [170, 210], [250, 192], [330, 208], [400, 194], [440, 212]].forEach(([x, y]) => { s += `<circle cx="${x}" cy="${y}" r="9" class="el-e-moins"/>` + txt(x, y + 4.5, '−', 'el-t-e', 'middle'); });
      s += fl(300, 166, 350, 74, 'el-f-elec', 11) + fl(360, 166, 430, 90, 'el-f-elec', 11);
      s += `<circle cx="356" cy="62" r="9" class="el-e-moins"/>${txt(356, 66.5, '−', 'el-t-e', 'middle')}<circle cx="438" cy="80" r="9" class="el-e-moins"/>${txt(438, 84.5, '−', 'el-t-e', 'middle')}`;
      s += txt(400, 40, 'électrons arrachés', 'el-t-a', 'middle');
      return { W, H, svg: s, aria: 'Effet photoélectrique : des photons arrivent sur un matériau et en arrachent des électrons' };
    },
    // Capteurs du toit (exercices) : panneau solaire thermique, fluide caloporteur, ballon d'eau chaude
    capteurs() {
      const W = 520, H = 236, sol = 206;
      let s = `<rect x="0" y="${sol}" width="${W}" height="${H - sol}" class="el-terre"/>${ligne(0, sol, W, sol, 'el-sol')}`;
      s += `<circle cx="50" cy="40" r="20" class="el-soleil"/>`;
      // panneau incliné vers le soleil, cellules
      s += `<path d="M150,186 L300,106 L314,118 L164,198 Z" class="el-capteur"/>`;
      for (let k = 1; k < 6; k++) s += ligne(150 + 25 * k, 186 - 13.3 * k, 164 + 25 * k, 198 - 13.3 * k, 'el-panneau-l');
      s += fl(74, 58, 196, 142, 'el-f-sol', 11) + fl(80, 74, 236, 128, 'el-f-sol', 11) + txt(112, 50, 'énergie lumineuse', 'el-t');
      // circuit du fluide caloporteur jusqu'au ballon d'eau
      s += `<path d="M308,112 V80 H436 V100 M157,192 V200 H436 V196" class="el-tuyau" fill="none"/>`;
      s += `<rect x="400" y="100" width="72" height="96" rx="20" class="el-ballon"/>` + txt(436, 146, 'ballon', 'el-t', 'middle') + txt(436, 162, 'd\'eau', 'el-t', 'middle');
      s += txt(372, 72, 'fluide caloporteur', 'el-t', 'middle') + txt(214, 226, 'panneau solaire thermique', 'el-t', 'middle');
      return { W, H, svg: s, aria: 'Panneau solaire thermique : un fluide caloporteur se réchauffe dans le panneau éclairé par le Soleil et cède son énergie à l\'eau d\'un ballon' };
    },
  };
  function dessin(type, o) {
    const d = DESSINS[type](o || {});
    return `<svg viewBox="0 0 ${d.W} ${d.H}" class="el-dessin" role="img" aria-label="${d.aria}">${d.svg}</svg>`;
  }

  /* ============================================================
     PLAN DE L'APPLICATION ET NAVIGATION (voir assets/sommaire.js)
     ============================================================ */
  const PLAN = [
    { n: 1, titre: 'Récupérer l\'énergie lumineuse', desc: 'Conversions photothermique et photovoltaïque, schémas énergétiques, rendement', fiche: 'fiche_1',
      parties: [{ nom: 'Capteurs et rendement', simulation: 'module_1_simulation', cours: 'module_1_cours', questions: 'module_1_questions', noms: { simulation: 'Activité : capteurs hybrides' } }] },
    { n: 2, titre: 'Conversion photothermique', desc: 'Q = m × c × (T<sub>f</sub> − T<sub>i</sub>), élévation de température, débits', fiche: 'fiche_2',
      parties: [{ nom: 'Conversion photothermique', cours: 'module_2_cours', questions: 'module_2_questions' }] },
    { n: 3, titre: 'Ondes et photons', desc: 'λ = c / f, spectre électromagnétique, photon E = h f, niveaux d\'énergie', fiche: 'fiche_3',
      parties: [{ nom: 'Fréquence et longueur d\'onde', slug: 'ondes', cours: 'module_3a_cours' },
        { nom: 'Photons et niveaux d\'énergie', slug: 'photons', simulation: 'module_3b_simulation', cours: 'module_3b_cours', questions: 'module_3_questions', noms: { simulation: 'Activité : effet photoélectrique' } }] },
    { n: 4, titre: 'Panneau photovoltaïque et puissance solaire', desc: 'Caractéristique I(U), point de fonctionnement, P<sub>reçue</sub> = irradiance × S', fiche: 'fiche_4',
      parties: [{ nom: 'Panneau et puissance solaire', cours: 'module_4_cours', questions: 'module_4_questions' }] },
    { n: 5, titre: 'Exercices', desc: 'Exercices 7, 8, 14, 10 et 15 de la feuille, guidés pas à pas', exercices: 'module_5', exNom: 'Exercices de la feuille', nbEx: 5 },
  ];
  window.SOM.init({ nom: 'Chapitre 10 : Énergie transportée par la lumière', id: 'energie-lumiere', cleEx: 'energie-lumiere-exercices', plan: PLAN });
  const menu = cle => window.SOM.menu(cle);
  const accueil = zone => window.SOM.accueil(zone);
  const marquer = info => window.SOM.marquer(info);

  window.EL = Object.assign(window.EL || {}, {
    MOINS, fmt, cs, sci, lire, proche, fr, o, fq, el, secouer, melanger, hasard, entre, champ, boutonValider, PARTIES, versCours,
    question, serie, confettis, slot, fl,
    H, C, EV, ESP, DOMAINES, domaine, idDomaine, optionsDomaine, NOMS_DOM, couleurLambda, nomCouleur, spectre,
    ENERGIES, chaine, partieChaine,
    HYDROGENE, transition, figNiveaux, partieNiveaux, texteTransition,
    pchip, preparer, carac, caracEchelle, figCarac, figPU, partiePanneau, figure,
    APPAREILS, circuit, partieCircuit, dessin,
    PLAN, menu, accueil, marquer,
  });
})();
