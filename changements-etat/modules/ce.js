/* ============================================================
   Moteur de l'application « Chapitre 11 : Changements d'état et
   transferts thermiques » (Terminale STI2D ; même moteur de questions
   que « Chapitre 10 : Énergie transportée par la lumière » ;
   navigation commune assets/sommaire.js, cours avec assets/cours.js,
   glisser-déposer assets/dragdrop.js)

   CE.fmt, CE.cs, CE.sci, CE.lire      écriture et lecture des nombres (virgule)
   CE.o, CE.fq.choix, CE.fq.nombre      fabriques d'options et de parties de question
   CE.PARTIES                           parties de question : 'choix', 'nombre', 'gabarit', 'sci',
                                        'schema' (étiquettes à glisser), 'grille' (un choix par ligne),
                                        'perso' (p.monter(zone, api) → { montrer() })
   CE.versCours(p)                      une de ces parties dans un cours (assets/cours.js), avec sa figure
   CE.question(zone, q, cb, mode)       question en plusieurs parties (série, exercice)
   CE.serie(opts)                       série de questions notée sur 20

   Propre au chapitre 11 :
     CE.dessin(type, o)                 dessins : 'transitions', 'micro', 'liaisonH', 'filet', 'palier', 'pac', 'circuit'
     CE.schemaPose(type, o, cases)      dessin avec des cases où glisser des étiquettes (pac, circuit)
     CE.chaineEnergie(o)                chaîne énergétique (résistance chauffante)
     CE.figDiag(o), CE.partieDiag(o)    diagramme d'état de l'eau, schématique : figure (point, flèche
                                        de chauffage à pression constante), outil « placer le point puis dire l'état »
     CE.etatDiag(T, P), CE.croisements  état lu sur le diagramme ; croisements d'une flèche avec les courbes
     CE.figPT(nom, o), CE.COURBES       courbes P(T) de vaporisation à axes réguliers : 'r22', 'eau'
     Schéma des étapes (module 5 et exercices) :
       CE.probleme(def)                 problème : corps, masse, état et température de départ et d'arrivée
       CE.hasardProbleme(niveau)        problème tiré au hasard (1, 2, 3 étapes ou plus, 4 : refroidissement)
       CE.etapes(pb, o)                 toutes les parties de la méthode : construire le schéma (bulles),
                                        nature des flèches, formule + donnée + Qᵢ de chaque flèche,
                                        somme Q = ΣQᵢ, énergie reçue ou cédée
       CE.partieConstruire, CE.partieNature, CE.partieFleche, CE.partieSomme, CE.partieSens
       CE.schemaPb(pb, o), CE.chaineHTML(pb, bulles, o)   dessin du schéma (horizontal ; vertical
                                        sur un écran étroit, comme SCH.chaine de transport-electricite)
   CE.menu(cle), CE.accueil(zone)       navigation commune (SOM) avec le plan de l'application

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
    const d = el('div', 'ph-valeur ce-gab');
    if (p.label) d.appendChild(el('span', 'ph-lab', p.label));
    // chaque case forme un groupe insécable avec le texte qui la suit : sur un petit écran,
    // la ligne ne se coupe qu'entre deux groupes
    const champs = [];
    let grp = el('span', 'ce-gab-grp');
    d.appendChild(grp);
    p.morceaux.forEach(m => {
      if (typeof m === 'string') { grp.appendChild(el('span', 'ce-gab-txt', m)); return; }
      if (champs.length) { grp = el('span', 'ce-gab-grp'); d.appendChild(grp); }
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
     p.schema : HTML du schéma, avec des cases CE.slot(id)
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
      slots.forEach(s => { s.tabIndex = -1; if (estInconnue(s)) s.classList.add('ce-inconnue'); });
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
      secouer(d.querySelector('.ce-sch') || d);
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
    const g = el('div', 'ce-grille');
    g.innerHTML = p.lignes.map(l => `<div class="ce-grille-l" data-l="${l.id}">
        <div class="ce-grille-nom">${l.label}</div>
        <div class="ce-grille-ch" role="group" aria-label="${String(l.label).replace(/<[^>]+>/g, '').replace(/"/g, '')}">
          ${p.options.map(o => `<button type="button" class="ce-grille-b" data-o="${o.id}" aria-pressed="false">${o.label}</button>`).join('')}</div>
        <div class="ce-grille-apres" hidden></div></div>`).join('');
    zone.appendChild(g);
    const lignes = Array.from(g.querySelectorAll('.ce-grille-l'));
    const choisi = {};
    lignes.forEach(L => {
      L.querySelectorAll('.ce-grille-b').forEach(b => {
        b.onclick = () => {
          if (api.fini() || b.disabled) return;
          choisi[L.dataset.l] = b.dataset.o;
          L.querySelectorAll('.ce-grille-b').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
          L.classList.remove('ok', 'ko');
          api.effacer();
        };
      });
    });
    const bVal = boutonValider(zone);
    function terminer() {
      lignes.forEach((L, k) => {
        L.classList.remove('ko'); L.classList.add('ok');
        L.querySelectorAll('.ce-grille-b').forEach(b => { b.disabled = true; });
        const a = L.querySelector('.ce-grille-apres');
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
        lignes.forEach((L, k) => L.querySelectorAll('.ce-grille-b').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.o === p.lignes[k].bonne))));
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
  // une partie de ce moteur dans un cours (assets/cours.js) : elle y devient un outil « perso »,
  // avec sa figure (dessinée quand la partie apparaît, par ex. le schéma des étapes déjà rempli)
  const versCours = p => ({ type: 'perso', get q() { return p.q; }, solution: p.solution || p.correction, aide: p.aide, orig: p,
    monter: (zone, api) => {
      if (p.figure) { const f = el('div', 'ph-partie-fig'); zone.appendChild(f); p.figure(f); }
      return PARTIES[p.type](zone, p, api);
    } });

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
      window.CE.partieEnCours = p;          // partie en cours (utile pour vérifier l'application)
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
      window.CE.questionEnCours = q;          // question en cours (utile pour vérifier l'application)
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
     PROPRE AU CHAPITRE 11
     ============================================================ */
  const ESP = ' ';                                             // espace insécable (unités)
  const UC = 'J·kg<sup>−1</sup>·K<sup>−1</sup>', UCk = 'kJ·kg<sup>−1</sup>·K<sup>−1</sup>';
  const UL = 'J·kg<sup>−1</sup>', ULk = 'kJ·kg<sup>−1</sup>';
  const deg = t => fmt(t) + ESP + '°C';                        // « −23 °C »
  const par = t => (t < 0 ? `(${fmt(t)})` : fmt(t));           // nombre négatif entre parenthèses
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);

  /* ---------- SVG ---------- */
  const txt = (x, y, t, cls, ancre) => `<text class="${cls || 'ce-t'}" x="${f1(x)}" y="${f1(y)}"${ancre ? ` text-anchor="${ancre}"` : ''}>${t}</text>`;
  const ligne = (x1, y1, x2, y2, cls) => `<line class="${cls}" x1="${f1(x1)}" y1="${f1(y1)}" x2="${f1(x2)}" y2="${f1(y2)}"/>`;
  // flèche de (x1, y1) à (x2, y2) ; t : taille de la pointe ; cls : classe (couleur, épaisseur)
  function fl(x1, y1, x2, y2, cls, t) {
    t = t || 11;
    const a = Math.atan2(y2 - y1, x2 - x1), c = Math.cos(a), s = Math.sin(a), bx = x2 - t * c, by = y2 - t * s, l = t * .48;
    return `<g class="${cls || 'ce-f'}"><line x1="${f1(x1)}" y1="${f1(y1)}" x2="${f1(bx + c)}" y2="${f1(by + s)}"/>` +
      `<path d="M${f1(x2)},${f1(y2)} L${f1(bx - l * s)},${f1(by + l * c)} L${f1(bx + l * s)},${f1(by - l * c)} Z"/></g>`;
  }
  // dessin à sa taille naturelle au plus (jamais agrandi)
  const svg = (W, H, contenu, aria, cls) => `<svg viewBox="0 0 ${W} ${H}" class="${cls || 'ce-dessin'}" style="max-width:${W}px" role="img" aria-label="${aria}">${contenu}</svg>`;

  /* Figures dessinées à la largeur disponible (cours, fiches, énoncés) : un emplacement
     est rendu dans la page, puis dessiné (et redessiné si la largeur change). */
  const FIGS = new Map();
  let nFig = 0;
  function figure(dessin, cls) {
    const k = String(++nFig);
    FIGS.set(k, dessin);
    return `<div class="ce-fig${cls ? ' ' + cls : ''}" data-fig="${k}"></div>`;
  }
  function monterFig(div, dessin) {
    if (div.dataset.monte) return;
    div.dataset.monte = '1';
    let largeur = 0;
    const tracerIci = () => {
      const W = Math.min(600, Math.round(div.clientWidth));
      if (!W || W === largeur) return;
      largeur = W;
      div.innerHTML = dessin(W);
    };
    if (window.ResizeObserver) new ResizeObserver(tracerIci).observe(div); else addEventListener('resize', tracerIci);
    tracerIci();
  }
  function chercherFigs(racine) {
    if (!racine || !racine.querySelectorAll) return;
    const l = racine.matches && racine.matches('.ce-fig[data-fig]') ? [racine] : [];
    racine.querySelectorAll('.ce-fig[data-fig]').forEach(x => l.push(x));
    l.forEach(x => { const f = FIGS.get(x.dataset.fig); if (f) monterFig(x, f); });
  }

  /* Schémas en ligne (schéma des étapes, chaîne énergétique) : à l'horizontale si la place
     le permet, sinon à la verticale (classe « vert ») ; comme SCH.chaine de transport-electricite */
  const ajuster = c => { const s = c.firstElementChild; if (s && s.dataset.min) s.classList.toggle('vert', c.clientWidth < +s.dataset.min); };
  const tailles = typeof ResizeObserver === 'function' ? new ResizeObserver(l => l.forEach(e => ajuster(e.target))) : null;
  function surveiller(racine) {
    if (!racine || !racine.querySelectorAll) return;
    const l = racine.matches && racine.matches('.ce-ligne-cont') ? [racine] : [];
    racine.querySelectorAll('.ce-ligne-cont').forEach(x => l.push(x));
    l.forEach(c => {
      ajuster(c);
      if (c.dataset.vu) return;
      c.dataset.vu = '1';
      if (tailles) tailles.observe(c);
    });
  }
  new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(n => { chercherFigs(n); surveiller(n); }))).observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener('DOMContentLoaded', () => { chercherFigs(document.body); surveiller(document.body); });

  /* ============================================================
     DESSINS (SVG) : couleurs par les classes ce-* de ce.css
     ============================================================ */
  // molécule d'eau : O en (x, y), deux H à 11 px, angle a (degrés) de la bissectrice
  function molEau(x, y, a) {
    const r = Math.PI / 180, h = k => [x + 11 * Math.cos((a + k * 52) * r), y + 11 * Math.sin((a + k * 52) * r)];
    const [h1, h2] = [h(-1), h(1)];
    return `<circle cx="${f1(h1[0])}" cy="${f1(h1[1])}" r="4.6" class="ce-h"/><circle cx="${f1(h2[0])}" cy="${f1(h2[1])}" r="4.6" class="ce-h"/><circle cx="${f1(x)}" cy="${f1(y)}" r="8" class="ce-o"/>`;
  }
  // positions des molécules : solide (rangées régulières), liquide (serrées, en désordre), gaz (éloignées)
  const MICRO = {
    s: [[28, 30, 90], [68, 30, -90], [108, 30, 90], [148, 30, -90], [48, 64, -90], [88, 64, 90], [128, 64, -90], [28, 98, 90], [68, 98, -90], [108, 98, 90], [148, 98, -90], [48, 132, -90], [88, 132, 90], [128, 132, -90]],
    l: [[34, 70, 20], [62, 52, 140], [92, 74, -60], [58, 96, 200], [122, 58, 80], [118, 96, -150], [150, 80, 10], [86, 120, 60], [40, 128, -100], [146, 122, 170], [100, 38, 250], [30, 40, 300]],
    g: [[30, 32, 30], [140, 28, 200], [88, 78, -70], [36, 126, 120], [150, 118, -20]],
  };
  const NOM_ETAT = { s: 'solide', l: 'liquide', g: 'gazeux' };

  const DESSINS = {
    // les six changements d'état entre solide, liquide et gaz
    transitions() {
      const W = 520, H = 290;
      const boite = (x, y, t) => `<rect x="${x - 58}" y="${y - 20}" width="116" height="40" rx="12" class="ce-boite"/>` + txt(x, y + 6, t, 'ce-t-b', 'middle');
      let s = boite(90, 50, 'SOLIDE') + boite(430, 50, 'LIQUIDE') + boite(260, 250, 'GAZ');
      s += fl(158, 40, 362, 40, 'ce-f-tr') + fl(362, 60, 158, 60, 'ce-f-tr');
      s += fl(110.5, 81, 214.5, 231, 'ce-f-tr') + fl(229.5, 221, 125.5, 71, 'ce-f-tr');
      s += fl(394.6, 71, 290.6, 221, 'ce-f-tr') + fl(305.4, 231, 409.4, 81, 'ce-f-tr');
      s += txt(260, 28, 'fusion', 'ce-t-a', 'middle') + txt(260, 82, 'solidification', 'ce-t-a', 'middle');
      s += txt(122, 186, 'sublimation', 'ce-t-a', 'end') + txt(170, 120, 'condensation', 'ce-t-a');
      s += txt(330, 150, 'vaporisation', 'ce-t-a', 'end') + txt(398, 186, 'liquéfaction', 'ce-t-a');
      return { W, H, svg: s, aria: 'Les six changements d\'état : fusion du solide au liquide, solidification du liquide au solide, vaporisation du liquide au gaz, liquéfaction du gaz au liquide, sublimation du solide au gaz, condensation du gaz au solide' };
    },
    // représentations microscopiques : o.ordre (ex. ['l', 's', 'g']), o.numeros (1, 2, 3), o.noms (nom de l'état)
    micro(o) {
      const ordre = o.ordre || ['s', 'l', 'g'], W = ordre.length * 196 - 16, H = o.noms || o.numeros ? 190 : 162;
      let s = '';
      ordre.forEach((e, k) => {
        const x0 = k * 196;
        s += `<rect x="${x0 + 1}" y="1" width="178" height="160" rx="14" class="ce-cadre"/>`;
        s += `<g transform="translate(${x0 + 1},1)">${MICRO[e].map(([x, y, a]) => molEau(x, y, a)).join('')}</g>`;
        if (o.numeros) s += `<g class="ce-num-d"><circle cx="${x0 + 90}" cy="176" r="12"/>${txt(x0 + 90, 181, k + 1, '', 'middle')}</g>`;
        else if (o.noms) s += txt(x0 + 90, 182, 'état ' + NOM_ETAT[e], 'ce-t-a', 'middle');
      });
      return { W, H, svg: s, aria: 'Représentations microscopiques de l\'eau : ' + ordre.map((e, k) => (o.numeros ? `${k + 1}, ` : '') + {
        s: 'molécules serrées et rangées régulièrement', l: 'molécules serrées, en désordre', g: 'molécules très éloignées les unes des autres' }[e]).join(' ; ') };
    },
    /* liaison hydrogène (exercice 7) : o.rep = 1 (bonne : H d'une molécule – O d'une autre),
       2 (H – H de deux molécules), 3 (H – H d'une même molécule) ; o.legende : noms des liaisons */
    liaisonH(o) {
      const rep = o.rep || 1, W = 260, H = 168;
      const A = (x, y, t, cls) => txt(x, y, t, cls || 'ce-t-at', 'middle');
      const d = (x, y, t) => txt(x, y, t, 'ce-t-d', 'middle');
      const liaison = (x1, y1, x2, y2) => ligne(x1, y1, x2, y2, 'ce-cov');
      let s = '';
      if (rep === 3) {
        s += A(130, 62, 'O') + d(130, 40, '2δ<tspan dy="-5" font-size="9">−</tspan>');
        s += liaison(122, 68, 98, 96) + liaison(138, 68, 162, 96);
        s += A(92, 112, 'H') + A(168, 112, 'H') + d(78, 130, 'δ<tspan dy="-5" font-size="9">+</tspan>') + d(182, 130, 'δ<tspan dy="-5" font-size="9">+</tspan>');
        s += ligne(102, 106, 158, 106, 'ce-hbond');
      } else {
        // molécule de gauche
        s += A(70, 62, 'O') + d(70, 40, '2δ<tspan dy="-5" font-size="9">−</tspan>');
        s += liaison(62, 68, 40, 94) + liaison(78, 68, 100, 94);
        s += A(34, 110, 'H') + A(106, 110, 'H') + d(20, 128, 'δ<tspan dy="-5" font-size="9">+</tspan>') + d(108, 132, 'δ<tspan dy="-5" font-size="9">+</tspan>');
        if (rep === 1) {
          // molécule de droite, son O vers le H de gauche
          s += A(178, 124, 'O') + d(160, 146, '2δ<tspan dy="-5" font-size="9">−</tspan>');
          s += liaison(186, 114, 208, 86) + liaison(184, 132, 214, 148);
          s += A(214, 80, 'H') + A(222, 160, 'H') + d(234, 70, 'δ<tspan dy="-5" font-size="9">+</tspan>') + d(240, 150, 'δ<tspan dy="-5" font-size="9">+</tspan>');
          s += ligne(116, 110, 168, 120, 'ce-hbond');
          if (o.legende) s += fl(126, 150, 140, 120, 'ce-f-fin', 7) + txt(100, 163, 'liaison hydrogène', 'ce-t-l', 'middle');
        } else {
          // molécule de droite tournée : un de ses H face au H de gauche
          s += A(206, 92, 'O') + d(226, 76, '2δ<tspan dy="-5" font-size="9">−</tspan>');
          s += liaison(198, 99, 176, 118) + liaison(212, 100, 226, 128);
          s += A(170, 134, 'H') + A(230, 144, 'H') + d(160, 152, 'δ<tspan dy="-5" font-size="9">+</tspan>') + d(244, 158, 'δ<tspan dy="-5" font-size="9">+</tspan>');
          s += ligne(116, 112, 160, 128, 'ce-hbond');
        }
      }
      if (o.numero) s += `<g class="ce-num-d"><circle cx="16" cy="16" r="12"/>${txt(16, 21, rep, '', 'middle')}</g>`;
      return { W, H, svg: s, aria: rep === 1 ? 'Deux molécules d\'eau : un atome H (δ+) d\'une molécule est relié en pointillés à l\'atome O (2δ−) de l\'autre molécule'
        : rep === 2 ? 'Deux molécules d\'eau : un atome H (δ+) d\'une molécule est relié en pointillés à un atome H (δ+) de l\'autre molécule'
          : 'Une molécule d\'eau : ses deux atomes H (δ+) sont reliés en pointillés' };
    },
    // expérience : un filet d'eau est dévié par une règle électrisée par frottement
    filet() {
      const W = 300, H = 220;
      let s = `<rect x="40" y="14" width="74" height="18" rx="5" class="ce-robinet"/><rect x="92" y="30" width="18" height="16" rx="3" class="ce-robinet"/>`;
      s += `<path d="M101,46 V206" class="ce-filet-droit"/>`;
      s += `<path d="M101,46 C101,110 112,150 150,204" class="ce-filet"/>`;
      s += `<rect x="176" y="108" width="20" height="104" rx="4" transform="rotate(-8 186 160)" class="ce-regle"/>`;
      for (let k = 0; k < 4; k++) s += txt(186 - k * 3.4, 130 + k * 22, '−', 'ce-t-ch', 'middle');
      s += txt(206, 100, 'règle frottée', 'ce-t-l') + txt(24, 120, 'filet', 'ce-t-l') + txt(24, 136, 'd\'eau', 'ce-t-l');
      s += txt(84, 216, 'sans la règle', 'ce-t-p', 'end');
      return { W, H, svg: s, aria: 'Un filet d\'eau qui coule d\'un robinet se courbe vers une règle électrisée par frottement, au lieu de tomber verticalement' };
    },
    /* courbe de chauffage de l'eau T(t) : paliers à 0 °C et 100 °C ; o.etapes : flèches Q₁ … Q₅ du schéma ;
       o.sans : sans les noms des états */
    palier(o) {
      const W = 560, H = 270, x0 = 52, y0 = 232, Y = T => y0 - (T + 30) * 1.3, X = t => x0 + t * 50;
      const pts = [[0, -20], [1.2, 0], [3.4, 0], [5, 100], [8.6, 100], [9.4, 120]];
      let s = ligne(x0, Y(0), X(3.4), Y(0), 'ce-repere') + ligne(x0, Y(100), X(8.6), Y(100), 'ce-repere');
      s += ligne(x0, y0, W - 14, y0, 'ph-axe') + ligne(x0, y0, x0, 12, 'ph-axe');
      s += `<path d="M${W - 8},${y0} l-9,-4.5 v9 Z M${x0},6 l-4.5,9 h9 Z" class="ph-fleche"/>`;
      s += txt(W - 12, y0 + 22, 'temps', 'ph-axe-nom', 'end') + txt(x0 + 8, 14, 'T (°C)', 'ph-axe-nom');
      s += txt(x0 - 7, Y(0) + 4, '0', 'ph-graduation', 'end') + txt(x0 - 7, Y(100) + 4, '100', 'ph-graduation', 'end') + txt(x0 - 7, Y(-20) + 4, '−20', 'ph-graduation', 'end');
      s += `<path d="${pts.map((p, k) => (k ? 'L' : 'M') + f1(X(p[0])) + ',' + f1(Y(p[1]))).join('')}" class="ce-courbe"/>`;
      if (!o.sans) {
        s += txt(X(.2), Y(-2), 'glace', 'ce-t-l') + txt(X(2.3), Y(0) - 10, 'glace + eau', 'ce-t-l', 'middle');
        s += txt(X(3.9) - 8, Y(55), 'eau', 'ce-t-l', 'end') + txt(X(6.8), Y(100) - 10, 'eau + vapeur', 'ce-t-l', 'middle');
        s += txt(X(9.1), Y(120) - 8, 'vapeur', 'ce-t-l', 'middle');
        if (!o.etapes) s += txt(X(2.3), Y(0) + 20, 'fusion', 'ce-t-p', 'middle') + txt(X(6.8), Y(100) + 20, 'ébullition', 'ce-t-p', 'middle');
      }
      if (o.etapes) {
        // une étiquette Q par segment : à droite des montées, sous les paliers
        const m = [[X(.75) + 22, Y(-10) + 8], [X(2.3), Y(0) + 22], [X(4.2) + 24, Y(50) + 8], [X(6.8), Y(100) + 22], [X(9) + 22, Y(110) + 8]];
        m.forEach(([x, y], k) => { s += `<g class="ce-num-q"><rect x="${f1(x - 15)}" y="${f1(y - 11)}" width="30" height="22" rx="11"/>${txt(x, y + 5, `Q<tspan dy="4" font-size="10">${k + 1}</tspan>`, '', 'middle')}</g>`; });
      }
      return { W, H, svg: s, aria: 'Courbe de chauffage de l\'eau : la température de la glace monte de −20 °C à 0 °C, reste à 0 °C pendant la fusion (palier), monte de 0 à 100 °C, reste à 100 °C pendant l\'ébullition (palier), puis la vapeur dépasse 100 °C' };
    },
    /* pompe à chaleur (exercice 17) : o.vide → cases à remplir (cases 1 à 6) */
    pac(o) {
      const W = 460, H = 340;
      let s = '';
      const rond = (x, y, t1, t2) => `<circle cx="${x}" cy="${y}" r="44" class="ce-boite"/>` + (o.vide ? '' : txt(x, y - 2, t1, 'ce-t-b2', 'middle') + txt(x, y + 15, t2, 'ce-t-b2', 'middle'));
      s += rond(160, 52, 'Air', 'extérieur') + rond(160, 288, 'Eau du', 'bassin') + rond(370, 170, 'Réseau', 'électrique');
      s += `<rect x="112" y="136" width="96" height="68" rx="12" class="ce-pac"/>` + txt(160, 166, 'Fluide', 'ce-t-pac', 'middle') + txt(160, 184, 'de la PAC', 'ce-t-pac', 'middle');
      s += fl(160, 98, 160, 134, 'ce-f') + fl(160, 206, 160, 242, 'ce-f') + fl(324, 170, 212, 170, 'ce-f');
      if (!o.vide) s += txt(176, 122, 'Q<tspan dy="4" font-size="11">f</tspan>', 'ce-t-n') + txt(176, 230, 'Q<tspan dy="4" font-size="11">c</tspan>', 'ce-t-n') + txt(262, 158, 'W<tspan dy="4" font-size="11">e</tspan>', 'ce-t-n', 'middle');
      else [[160, 52, 1], [370, 170, 2], [160, 288, 3], [206, 114, 4], [268, 202, 5], [206, 228, 6]].forEach(([x, y, n]) => { s += `<g class="ce-pose-num"><circle cx="${x}" cy="${y}" r="14"/>${txt(x, y + 5, n, '', 'middle')}</g>`; });
      return { W, H, svg: s, cases: { air: [160, 52, 1], res: [370, 170, 2], eau: [160, 288, 3], qf: [206, 114, 4], we: [268, 202, 5], qc: [206, 228, 6] },
        aria: o.vide ? 'Schéma de la pompe à chaleur à compléter : trois cercles vides (1 en haut, 2 à droite, 3 en bas) reliés au fluide de la PAC par trois flèches (4 vers le fluide depuis le haut, 5 vers le fluide depuis la droite, 6 du fluide vers le bas)'
          : 'Pompe à chaleur : l\'air extérieur cède Q f au fluide de la PAC, le réseau électrique lui fournit W e, le fluide cède Q c à l\'eau du bassin' };
    },
    /* circuit du dégivrage (bac blanc) : batterie 28,0 V, M₁ sur le fil du haut, résistance R, M₂ en dérivation ;
       o.com : bornes COM dessinées ; o.vide : emplacements numérotés des bornes (1 à 4) */
    circuit(o) {
      const W = 520, H = 236, yh = 46, yb = 206, xB = 84, xR = 330, xM = 466;
      let s = `<path d="M${xB},112 V${yh} H${xM} V${yb} H${xB} V130" class="ce-fil"/><path d="M${xR},${yh} V96 M${xR},156 V${yb}" class="ce-fil"/>`;
      s += `<circle cx="${xR}" cy="${yh}" r="4" class="ce-noeud"/><circle cx="${xR}" cy="${yb}" r="4" class="ce-noeud"/>`;
      // batterie : grande plaque (+) en haut, petite plaque épaisse (−) en bas
      s += ligne(xB - 22, 112, xB + 22, 112, 'ce-plaque') + ligne(xB - 10, 128, xB + 10, 128, 'ce-plaque-e');
      s += txt(xB + 22, 104, '+', 'ce-t-a') + txt(xB + 22, 146, '−', 'ce-t-a');
      s += fl(38, 176, 38, 64, 'ce-f-fin', 9) + txt(40, 54, '28,0 V', 'ce-t', 'middle');
      s += fl(xB, 88, xB, 64, 'ce-f-fin', 9) + txt(xB - 8, 80, 'I', 'ce-t-a', 'end');
      // résistance, tension U, intensité I
      s += `<rect x="${xR - 12}" y="96" width="24" height="60" class="ce-app"/>` + txt(xR, 131, 'R', 'ce-t-a', 'middle');
      s += fl(xR - 30, 152, xR - 30, 98, 'ce-f-fin', 9) + txt(xR - 38, 130, 'U', 'ce-t-a', 'end');
      s += fl(xR, 58, xR, 82, 'ce-f-fin', 9) + txt(xR + 8, 76, 'I', 'ce-t-a');
      // appareils M₁ et M₂
      s += ligne(216, yh, 264, yh, 'ce-fil-cache') + `<circle cx="240" cy="${yh}" r="24" class="ce-app"/>` + txt(240, yh + 6, 'M<tspan dy="4" font-size="11">1</tspan>', 'ce-t-app', 'middle');
      s += ligne(xM, 96, xM, 144, 'ce-fil-cache') + `<circle cx="${xM}" cy="120" r="24" class="ce-app"/>` + txt(xM, 126, 'M<tspan dy="4" font-size="11">2</tspan>', 'ce-t-app', 'middle');
      // bornes
      [[216, yh], [264, yh], [xM, 96], [xM, 144]].forEach(([x, y]) => { s += `<circle cx="${x}" cy="${y}" r="3.6" class="ce-borne"/>`; });
      if (o.com) s += txt(268, yh - 10, 'COM', 'ce-t-com') + txt(xM - 8, 162, 'COM', 'ce-t-com', 'end');
      if (o.vide) [[196, 92, 1], [284, 92, 2], [404, 88, 3], [404, 152, 4]].forEach(([x, y, n]) => { s += `<g class="ce-pose-num"><circle cx="${x}" cy="${y}" r="14"/>${txt(x, y + 5, n, '', 'middle')}</g>`; });
      return { W, H, svg: s, cases: { b1: [196, 92, 1], b2: [284, 92, 2], b3: [404, 88, 3], b4: [404, 152, 4] },
        aria: 'Circuit du dégivrage : la batterie de 28,0 V (+ en haut) alimente la résistance R ; l\'appareil M1 est sur le fil du haut, en série ; l\'appareil M2 est branché entre le fil du haut et le fil du bas, en dérivation' +
          (o.com ? ' ; borne COM de M1 à droite, borne COM de M2 en bas' : '') + (o.vide ? ' ; emplacements des bornes : 1 à gauche de M1, 2 à droite de M1, 3 en haut de M2, 4 en bas de M2' : '') };
    },
  };
  function dessin(type, o) {
    const d = DESSINS[type](o || {});
    return svg(d.W, d.H, d.svg, d.aria, 'ce-dessin ce-d-' + type);
  }
  // dessin avec des cases posées dessus ; sur un écran étroit, les cases passent sous le dessin, repérées par leur numéro
  function schemaPose(type, o, contenus) {
    const d = DESSINS[type](Object.assign({ vide: true }, o));
    return `<div class="ce-pose-cadre"><div class="ce-pose ce-pose-${type}" style="max-width:${d.W}px">${svg(d.W, d.H, d.svg, d.aria, 'ce-dessin')}
      <div class="ce-pose-cases">${Object.keys(contenus).map(id => {
        const [x, y, n] = d.cases[id];
        return `<div class="ce-pose-case" style="left:${(x / d.W * 100).toFixed(2)}%;top:${(y / d.H * 100).toFixed(2)}%"><span class="ce-num">${n}</span>${contenus[id]}</div>`;
      }).join('')}</div></div></div>`;
  }

  /* ============================================================
     SCHÉMA ÉNERGÉTIQUE (bac blanc : résistance chauffante)
     o = { entree, conv, sortie } : texte, ou { slot: id } pour une case où glisser une étiquette
     ============================================================ */
  const ENERGIES = { electrique: 'énergie électrique', thermique: 'énergie thermique', lumineuse: 'énergie lumineuse', mecanique: 'énergie mécanique', chimique: 'énergie chimique' };
  const FLECHE = '<svg viewBox="0 0 40 16" aria-hidden="true"><line x1="1" y1="8" x2="29" y2="8"/><path d="M39,8 L27,1.5 L27,14.5 Z"/></svg>';
  const valCh = v => (v && v.slot ? slot(v.slot) : `<span class="ce-ch-v">${v}</span>`);
  function chaineEnergie(o) {
    return `<div class="ce-ligne-cont"><div class="ce-ch" data-min="470" role="group" aria-label="Chaîne énergétique de la résistance chauffante">
      <div class="ce-ch-b"><span class="ce-ch-nom">Énergie reçue</span>${valCh(o.entree)}</div><div class="ce-ch-fl">${FLECHE}</div>
      <div class="ce-ch-conv">${valCh(o.conv)}</div><div class="ce-ch-fl">${FLECHE}</div>
      <div class="ce-ch-b"><span class="ce-ch-nom">Énergie fournie</span>${valCh(o.sortie)}</div></div></div>`;
  }

  /* ============================================================
     DIAGRAMME D'ÉTAT DE L'EAU (P, T), SCHÉMATIQUE COMME CELUI DU COURS
     Échelles non respectées : les axes sont étirés de façon régulière (fonctions
     monotones), et seules les valeurs particulières sont graduées. Les courbes
     passent par le point triple (0,01 °C ; 0,006 bar), par (0 °C ; 1 bar) et
     (100 °C ; 1 bar), et par le point critique (374 °C ; 221 bar, soit 218 atm).
     Les points proposés aux élèves ont été vérifiés par un script : l'état lu sur
     ce diagramme est le même que l'état réel de l'eau, loin des courbes.
     ============================================================ */
  // courbe lisse passant par des points (interpolation d'Hermite monotone, « PCHIP »)
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
      return (2 * s3 - 3 * s2 + 1) * y[i] + (s3 - 2 * s2 + s) * h[i] * m[i] + (-2 * s3 + 3 * s2) * y[i + 1] + (s3 - s2) * h[i] * m[i + 1];
    };
  }
  const L10 = Math.log10;
  const XU = pchip([[-60, 0], [-20, .12], [0, .22], [50, .36], [100, .50], [150, .60], [200, .68], [300, .82], [374, .92], [420, 1]]);
  const YLOG = pchip([[-4, .02], [-3, .06], [L10(.006117), .14], [L10(.06), .25], [0, .45], [L10(2), .55], [1, .66], [L10(220.6), .90], [L10(400), 1]]);
  const yP = P => (P <= 1e-4 ? P / 1e-4 * .02 : YLOG(L10(P)));
  const TP = [XU(.01), yP(.006117)], CP = [XU(374), yP(220.6)];
  // courbe de vaporisation : réelle jusqu'à 100 °C (0,12 bar à 50 °C), puis presque droite jusqu'au point critique
  // (comme dans le cours : à 120 °C et 2 bar, l'eau est nettement liquide)
  const VAP = pchip([TP, [XU(50), yP(.1235)], [XU(100), yP(1.013)], CP]);
  const SUB = pchip([[-60, 1.081e-5], [-50, 3.938e-5], [-40, 1.284e-4], [-30, 3.801e-4], [-20, 1.032e-3], [-10, 2.599e-3], [-5, 4.017e-3], [.01, 6.117e-3]].map(([T, P]) => [XU(T), yP(P)]));
  // courbe de fusion : presque verticale, légèrement penchée vers la gauche en haut
  const FUS = v => TP[0] - .02 * Math.pow(Math.max(0, v - TP[1]), 2) / Math.pow(1 - TP[1], 2);
  // état lu sur le diagramme : 's', 'l' ou 'g'
  function etatDiag(T, P) {
    const u = XU(T), v = yP(P);
    if (v >= TP[1] && u < FUS(v)) return 's';
    if (v < TP[1] && u < TP[0]) return v > SUB(u) ? 's' : 'g';
    if (u > CP[0]) return 'g';
    return v > VAP(u) ? 'l' : 'g';
  }
  // valeurs proposées pour placer un point (boutons − / + et glisser)
  const T_LISTE = [-60, -40, -20, -10, 0, 10, 20, 50, 80, 100, 120, 150, 200, 250, 300, 350, 400];
  const P_LISTE = [0.0001, 0.001, 0.003, 0.006, 0.01, 0.03, 0.06, 0.1, 0.5, 1, 2, 5, 10, 20, 50, 100, 221, 300];
  const fmtP = P => fmt(P) + ESP + 'bar';
  const NOMS_EAU = { s: 'solide', l: 'liquide', g: 'gaz' };

  // recherche par dichotomie de u tel que f(u) = v sur [a, b] (f croissante)
  function inverse(f, v, a, b) {
    for (let k = 0; k < 50; k++) { const m = (a + b) / 2; if (f(m) < v) a = m; else b = m; }
    return (a + b) / 2;
  }
  // croisements d'une flèche horizontale (pression P, de T1 à T2) avec les courbes : [{ u, type }]
  function croisements(P, T1, T2) {
    const v = yP(P), u1 = Math.min(XU(T1), XU(T2)), u2 = Math.max(XU(T1), XU(T2)), c = [];
    if (v >= TP[1]) c.push({ u: FUS(v), type: 'fus' });
    if (v >= TP[1] && v <= CP[1]) c.push({ u: inverse(VAP, v, TP[0], CP[0]), type: 'vap' });
    if (v < TP[1]) c.push({ u: inverse(SUB, v, 0, TP[0]), type: 'sub' });
    return c.filter(x => x.u > u1 && x.u < u2).sort((a, b) => (T2 > T1 ? a.u - b.u : b.u - a.u));
  }

  function geoDiag(W) {
    const H = Math.round(Math.min(440, Math.max(300, W * .74)));
    const g = 68, d = 14, h = 18, b = 36, L = W - g - d, Hh = H - h - b;
    return { W, H, g, d, h, b, L, Hh, xu: u => g + u * L, yv: v => h + Hh - v * Hh, X: T => g + XU(T) * L, Y: P => h + Hh - yP(P) * Hh };
  }
  // tracé d'une courbe v = f(u) ou u = f(v) en pixels
  function chemin(pts) { return pts.map((p, k) => (k ? 'L' : 'M') + f1(p[0]) + ',' + f1(p[1])).join(''); }
  function courbesDiag(G) {
    const sub = [], vap = [], fus = [];
    for (let k = 0; k <= 40; k++) { const u = TP[0] * k / 40; sub.push([G.xu(u), G.yv(SUB(u))]); }
    for (let k = 0; k <= 80; k++) { const u = TP[0] + (CP[0] - TP[0]) * k / 80; vap.push([G.xu(u), G.yv(VAP(u))]); }
    for (let k = 0; k <= 30; k++) { const v = TP[1] + (1 - TP[1]) * k / 30; fus.push([G.xu(FUS(v)), G.yv(v)]); }
    return { sub, vap, fus };
  }
  // contour d'une zone ('s', 'l', 'g') en pixels
  function zoneDiag(G, e, C) {
    const haut = G.yv(1), bas = G.yv(0), gauche = G.xu(0), droite = G.xu(1);
    if (e === 's') return chemin([[gauche, bas]].concat(C.sub, C.fus, [[gauche, haut]])) + 'Z';
    if (e === 'l') return chemin(C.fus.concat([[G.xu(CP[0]), haut]], C.vap.slice().reverse())) + 'Z';
    return chemin([[gauche, bas]].concat(C.sub, C.vap, [[G.xu(CP[0]), haut], [droite, haut], [droite, bas]])) + 'Z';
  }
  /* SVG du diagramme : o = { noms (zones nommées, true par défaut), zone ('s'|'l'|'g' : zone mise en valeur),
     point: { T, P } (avec repères), fleche: { P, T1, T2, etiquettes: [textes aux croisements] },
     reperes (1 bar, 0 °C, 100 °C : true par défaut), mobile (point déplaçable) } */
  function svgDiag(G, o) {
    o = o || {};
    const C = courbesDiag(G);
    let s = '';
    if (o.zone) s += `<path d="${zoneDiag(G, o.zone, C)}" class="ce-zone"/>`;
    const x0 = G.xu(0), y0 = G.yv(0);
    // repères : 1 bar, 0 °C et 100 °C ; point triple
    if (o.reperes !== false) {
      const y1 = G.Y(1.013), xf = G.xu(FUS(yP(1.013))), xv = G.X(100), yt = G.yv(TP[1]), xt = G.xu(TP[0]);
      s += `<path d="M${f1(x0)},${f1(y1)} H${f1(xv)} M${f1(xf)},${f1(y1)} V${f1(y0)} M${f1(xv)},${f1(y1)} V${f1(y0)} M${f1(x0)},${f1(yt)} H${f1(xt)} V${f1(y0)}" class="ce-repere"/>`;
      // (une graduation trop proche d'une valeur du point est masquée)
      const libreY = y => !o.point || Math.abs(G.Y(o.point.P) - y) > 16, libreX = x => !o.point || Math.abs(G.X(o.point.T) - x) > 30;
      // (o.livre : comme la figure du manuel, pression en kPa, sans les températures)
      if (libreY(y1)) s += txt(x0 - 6, y1 + 4, o.livre ? '101,3' : '1 bar', 'ph-graduation', 'end');
      if (!o.livre) {
        if (libreY(yt)) s += txt(x0 - 6, yt + 4, '0,006 bar', 'ph-graduation', 'end');
        if (libreX(xf)) s += txt(xf, y0 + 17, '0', 'ph-graduation', 'middle');
        if (libreX(xv)) s += txt(xv, y0 + 17, '100', 'ph-graduation', 'middle');
      }
    }
    s += `<path d="${chemin(C.sub)}" class="ce-courbe"/><path d="${chemin(C.vap)}" class="ce-courbe"/><path d="${chemin(C.fus)}" class="ce-courbe"/>`;
    // axes
    s += ligne(x0, y0, G.xu(1) + 6, y0, 'ph-axe') + ligne(x0, y0, x0, G.yv(1) - 6, 'ph-axe');
    s += `<path d="M${f1(G.xu(1) + 12)},${f1(y0)} l-9,-4.5 v9 Z M${f1(x0)},${f1(G.yv(1) - 12)} l-4.5,9 h9 Z" class="ph-fleche"/>`;
    s += txt(G.W - 4, G.H - 4, o.livre ? 'température (K)' : 'température (°C)', 'ph-axe-nom', 'end') + txt(x0 + 8, G.yv(1) + 6, o.livre ? 'pression (kPa)' : 'pression (bar)', 'ph-axe-nom');
    // points triple et critique
    s += `<circle cx="${f1(G.xu(TP[0]))}" cy="${f1(G.yv(TP[1]))}" r="4.5" class="ce-pt-fixe"/><circle cx="${f1(G.xu(CP[0]))}" cy="${f1(G.yv(CP[1]))}" r="4.5" class="ce-pt-fixe"/>`;
    s += txt(G.xu(TP[0]) + 8, G.yv(TP[1]) + 16, 'point triple', 'ce-t-pt');
    s += txt(G.xu(CP[0]) + 2, G.yv(CP[1]) - (o.livre ? 9 : 24), 'point critique', 'ce-t-pt', 'end') + (o.livre ? '' : txt(G.xu(CP[0]) + 2, G.yv(CP[1]) - 9, '(374 °C ; 221 bar)', 'ce-t-p', 'end'));
    // noms des zones
    if (o.noms !== false) {
      // (écran étroit : noms plus petits, « solide » tient entre l'axe et la courbe de fusion)
      const cz = G.W < 440 ? 'ce-t-zone petit' : 'ce-t-zone';
      s += txt(G.xu(.105), G.yv(.62), 'solide', cz, 'middle') + txt(G.xu(.40), G.yv(.74), 'liquide', cz, 'middle') + txt(G.xu(.74), G.yv(.34), 'gaz', cz, 'middle');
    }
    // flèche horizontale : chauffage (ou refroidissement) à pression constante
    if (o.fleche) {
      const f = o.fleche, y = G.Y(f.P);
      s += fl(G.X(f.T1), y, G.X(f.T2), y, 'ce-f-chauffe', 12);
      croisements(f.P, f.T1, f.T2).forEach((c, k) => {
        s += `<circle cx="${f1(G.xu(c.u))}" cy="${f1(y)}" r="5.5" class="ce-pt-crois"/>`;
        if (f.etiquettes && f.etiquettes[k]) s += txt(G.xu(c.u) + (c.type === 'fus' ? -6 : 6), y - 10, f.etiquettes[k], 'ce-t-crois', c.type === 'fus' ? 'end' : 'start');
      });
      if (f.nom) s += txt(G.X(f.T1), y + 18, fmtP(f.P), 'ce-t-p', f.T2 > f.T1 ? 'start' : 'end');
    }
    // numéros des cases posées sur le diagramme (écran étroit : les cases passent dessous)
    (o.nums || []).forEach(([u, v, n]) => { s += `<g class="ce-pose-num"><circle cx="${f1(G.xu(u))}" cy="${f1(G.yv(v))}" r="14"/>${txt(G.xu(u), G.yv(v) + 5, n, '', 'middle')}</g>`; });
    // points nommés (exemples du cours) : o.points = [{ T, P, nom }]
    (o.points || []).forEach(q => {
      const x = G.X(q.T), y = G.Y(q.P);
      s += `<path d="M${f1(x0)},${f1(y)} H${f1(x)} V${f1(y0)}" class="ce-lecture ce-lecture-fine"/><circle cx="${f1(x)}" cy="${f1(y)}" r="6" class="ce-pt"/>` +
        txt(x + 9, y - 7, q.nom, 'ce-t-crois');
    });
    // point (T, P) et ses repères
    if (o.point) {
      const x = G.X(o.point.T), y = G.Y(o.point.P);
      s += `<path d="M${f1(x0)},${f1(y)} H${f1(x)} V${f1(y0)}" class="ce-lecture"/>`;
      s += txt(x, y0 + 17, fmt(o.point.T), 'ce-t-val', 'middle') + txt(x0 - 6, y + 4, fmtP(o.point.P), 'ce-t-val', 'end');
      if (o.mobile) s += `<circle cx="${f1(x)}" cy="${f1(y)}" r="22" class="ce-poignee"/>`;
      s += `<circle cx="${f1(x)}" cy="${f1(y)}" r="7.5" class="ce-pt${o.mobile ? ' mobile' : ''}"/>`;
    }
    const aria = 'Diagramme d\'état de l\'eau, schématique : zones solide (à gauche), liquide (en haut, au milieu) et gaz (en bas à droite), séparées par les courbes de sublimation, de fusion et de vaporisation qui se rejoignent au point triple ; la courbe de vaporisation s\'arrête au point critique' +
      (o.point ? `. Point placé à ${fmt(o.point.T)} °C et ${fmt(o.point.P)} bar` : '') + (o.points ? '. Points ' + o.points.map(q => `${q.nom} (${fmt(q.T)} °C ; ${fmt(q.P)} bar)`).join(', ') : '') + (o.fleche ? `. Flèche horizontale à ${fmt(o.fleche.P)} bar, de ${fmt(o.fleche.T1)} °C à ${fmt(o.fleche.T2)} °C` : '');
    return `<svg viewBox="0 0 ${G.W} ${G.H}" class="ce-diag" role="img" aria-label="${aria}">${s}</svg>`;
  }
  const figDiag = o => figure(W => svgDiag(geoDiag(W), o), 'ce-fig-diag');
  // diagramme (largeur fixe) avec des cases posées dans les zones : contenus = { s, l, g } (exercice 10)
  const ZONES = { s: [.10, .62, 1], l: [.40, .74, 2], g: [.74, .34, 3] };
  function schemaDiag(contenus, o) {
    const G = geoDiag(520), ids = Object.keys(contenus);
    return `<div class="ce-pose-cadre"><div class="ce-pose">${svgDiag(G, Object.assign({ noms: false, nums: ids.map(id => ZONES[id]) }, o))}
      <div class="ce-pose-cases">${ids.map(id => {
        const [u, v, n] = ZONES[id];
        return `<div class="ce-pose-case" style="left:${(G.xu(u) / G.W * 100).toFixed(2)}%;top:${(G.yv(v) / G.H * 100).toFixed(2)}%"><span class="ce-num">${n}</span>${contenus[id]}</div>`;
      }).join('')}</div></div></div>`;
  }

  /* Outil : placer un point (T, P) sur le diagramme, puis dire l'état de l'eau.
     o = { T, P (point demandé), placer (false : point déjà placé), q, solution } */
  function outilDiag(zone, o, api) {
    const plus = (l, v) => l.indexOf(v);
    const iT0 = plus(T_LISTE, o.T), iP0 = plus(P_LISTE, o.P);
    let iT = o.placer === false ? iT0 : plus(T_LISTE, iT0 === plus(T_LISTE, 20) && iP0 === plus(P_LISTE, 1) ? 50 : 20), iP = o.placer === false ? iP0 : plus(P_LISTE, 1);
    let choix = null, fini = false, montre = false, G = null;
    const bonne = etatDiag(o.T, o.P);
    const d = el('div', 'ce-dg');
    d.innerHTML = `<div class="ce-dg-fig"></div>
      ${o.placer === false ? '' : `<div class="ce-dg-reg">
        <div class="ce-dg-l"><span class="ce-dg-lab">T</span><button type="button" class="ce-dg-b" data-a="t-" aria-label="Température plus basse">−</button><span class="ce-dg-v" data-v="t"></span><button type="button" class="ce-dg-b" data-a="t+" aria-label="Température plus haute">+</button></div>
        <div class="ce-dg-l"><span class="ce-dg-lab">P</span><button type="button" class="ce-dg-b" data-a="p-" aria-label="Pression plus basse">−</button><span class="ce-dg-v" data-v="p"></span><button type="button" class="ce-dg-b" data-a="p+" aria-label="Pression plus haute">+</button></div>
        <p class="ce-dg-aide">Fais glisser le point ●, ou règle T et P avec les boutons.</p></div>`}
      <p class="ce-dg-q">Dans quel état est l'eau en ce point ?</p>
      <div class="ce-dg-etats" role="group" aria-label="État de l'eau">${['s', 'l', 'g'].map(e => `<button type="button" class="ce-tg" data-e="${e}" aria-pressed="false">${NOMS_EAU[e]}</button>`).join('')}</div>
      <p class="ce-dg-res" hidden></p>`;
    zone.appendChild(d);
    const fig = d.querySelector('.ce-dg-fig');
    function dessiner() {
      const W = Math.min(600, Math.round(fig.clientWidth));
      if (!W) return;
      G = geoDiag(W);
      fig.innerHTML = svgDiag(G, { point: { T: T_LISTE[iT], P: P_LISTE[iP] }, mobile: !fini && o.placer !== false, zone: montre ? bonne : null, noms: true });
      const vt = d.querySelector('[data-v="t"]'), vp = d.querySelector('[data-v="p"]');
      if (vt) { vt.textContent = deg(T_LISTE[iT]); vp.textContent = fmtP(P_LISTE[iP]); }
    }
    if (window.ResizeObserver) new ResizeObserver(dessiner).observe(fig); else addEventListener('resize', dessiner);
    dessiner();
    function bouger(dT, dP) {
      if (fini) return;
      iT = Math.max(0, Math.min(T_LISTE.length - 1, iT + dT));
      iP = Math.max(0, Math.min(P_LISTE.length - 1, iP + dP));
      api.effacer();
      dessiner();
    }
    d.querySelectorAll('.ce-dg-b').forEach(b => {
      b.onclick = () => bouger(b.dataset.a === 't-' ? -1 : b.dataset.a === 't+' ? 1 : 0, b.dataset.a === 'p-' ? -1 : b.dataset.a === 'p+' ? 1 : 0);
    });
    // glisser le point (souris, doigt) : il se pose sur la valeur proposée la plus proche
    if (o.placer !== false) {
      let glisse = false;
      const viser = e => {
        const r = fig.querySelector('svg').getBoundingClientRect(), k = G.W / r.width;
        const x = (e.clientX - r.left) * k, y = (e.clientY - r.top) * k;
        let bt = 0, bp = 0;
        T_LISTE.forEach((T, j) => { if (Math.abs(G.X(T) - x) < Math.abs(G.X(T_LISTE[bt]) - x)) bt = j; });
        P_LISTE.forEach((P, j) => { if (Math.abs(G.Y(P) - y) < Math.abs(G.Y(P_LISTE[bp]) - y)) bp = j; });
        if (bt !== iT || bp !== iP) { iT = bt; iP = bp; api.effacer(); dessiner(); }
      };
      fig.addEventListener('pointerdown', e => {
        if (fini || !e.target.closest('.ce-poignee, .ce-pt')) return;
        glisse = true;
        try { fig.setPointerCapture(e.pointerId); } catch (x) { /* rien */ }
        e.preventDefault();
      });
      fig.addEventListener('pointermove', e => { if (glisse) viser(e); });
      const fin = () => { glisse = false; };
      fig.addEventListener('pointerup', fin);
      fig.addEventListener('pointercancel', fin);
    }
    const bE = Array.from(d.querySelectorAll('.ce-dg-etats .ce-tg'));
    bE.forEach(b => {
      b.onclick = () => {
        if (fini) return;
        choix = b.dataset.e;
        bE.forEach(x => x.setAttribute('aria-pressed', String(x === b)));
        api.effacer();
      };
    });
    const bVal = boutonValider(zone);
    function reveler() {
      fini = true; montre = true;
      bE.forEach(x => { x.disabled = true; x.setAttribute('aria-pressed', String(x.dataset.e === bonne)); });
      d.querySelectorAll('.ce-dg-b').forEach(x => { x.disabled = true; });
      const r = d.querySelector('.ce-dg-res');
      r.innerHTML = `À ${deg(o.T)} et ${fmtP(o.P)}, l'eau est à l'état <b>${NOM_ETAT[bonne]}</b>.`;
      r.hidden = false;
      bVal.fermer();
      dessiner();
    }
    const DIAG = {
      'l-g': 'Le point est <b>sous</b> la courbe de vaporisation : la pression est trop faible, l\'eau s\'est vaporisée.',
      'g-l': 'Le point est <b>au-dessus</b> de la courbe de vaporisation : à cette pression, l\'eau ne bout pas encore à cette température.',
      's-l': 'Le point est à <b>droite</b> de la courbe de fusion (vers 0 °C) : la glace a fondu.',
      'l-s': 'Le point est à <b>gauche</b> de la courbe de fusion, du côté des basses températures.',
      's-g': 'Le point est <b>sous</b> la courbe de sublimation (en bas à gauche) : à pression très faible, la glace se sublime.',
      'g-s': 'Le point est <b>au-dessus</b> de la courbe de sublimation et à gauche de la courbe de fusion : ce n\'est pas la zone gaz.',
    };
    bVal.onclick = () => {
      if (fini || api.fini()) return;
      if (iT !== iT0 || iP !== iP0) {
        api.erreur(`Place d'abord le point en T = ${deg(o.T)} et P = ${fmtP(o.P)} (il est en T = ${deg(T_LISTE[iT])} et P = ${fmtP(P_LISTE[iP])}).` +
          (iT === iT0 ? ' Règle la pression.' : iP === iP0 ? ' Règle la température.' : ''));
        secouer(fig);
        return;
      }
      if (!choix) { api.message('Choisis l\'état de l\'eau en ce point.'); return; }
      if (choix !== bonne) { api.erreur(DIAG[choix + '-' + bonne] || ''); secouer(d.querySelector('.ce-dg-etats')); return; }
      reveler();
      api.reussi();
    };
    return { montrer() { iT = iT0; iP = iP0; reveler(); } };
  }
  const OU_EST = {
    s: 'à gauche de la courbe de fusion et au-dessus de la courbe de sublimation : zone <b>solide</b>',
    l: 'entre la courbe de fusion et la courbe de vaporisation : zone <b>liquide</b>',
    g: 'sous la courbe de vaporisation (et de sublimation) : zone <b>gaz</b>',
  };
  function partieDiag(o) {
    const sol = o.solution || `<p>Le point (${deg(o.T)} ; ${fmtP(o.P)}) est ${OU_EST[etatDiag(o.T, o.P)]}.</p>`;
    return { type: 'perso', q: o.q || `Place le point T = ${deg(o.T)}, P = ${fmtP(o.P)} sur le diagramme, puis dis dans quel état est l'eau.`,
      solution: sol, correction: sol, o, monter: (zone, api) => outilDiag(zone, o, api) };
  }

  /* ============================================================
     COURBES P(T) DE VAPORISATION (axes réguliers)
     def = { f(T) → P, deb, fin (températures de début et de fin du tracé),
             t: { min, max, pas, sous }, p: { max, pas, sous }, noms: [axe T, axe P], aria }
     ============================================================ */
  // pression de vapeur saturante de l'eau (bar), formule de l'IAPWS (IF97)
  function psatEau(Tc) {
    const T = Tc + 273.15, n = [0.11670521452767e4, -0.72421316703206e6, -0.17073846940092e2, 0.12020824702470e5, -0.32325550322333e7, 0.14915108613530e2, -0.48232657361591e4, 0.40511340542057e6, -0.23855557567849, 0.65017534844798e3];
    const th = T + n[8] / (T - n[9]), A = th * th + n[0] * th + n[1], B = n[2] * th * th + n[3] * th + n[4], C = n[5] * th * th + n[6] * th + n[7];
    return Math.pow(2 * C / (-B + Math.sqrt(B * B - 4 * A * C)), 4) * 10;
  }
  const COURBES = {
    // fluide R22 (exercice 15) : pression relative nulle à −40 °C, 8 bar à 20 °C
    r22: { f: T => 1.2546 * (Math.exp(.033305 * (T + 40)) - 1), deb: -40, fin: 25, t: { min: -45, max: 30, pas: 10, sous: 5 }, p: { max: 11, pas: 2, sous: 1 },
      noms: ['Température (°C)', 'Pression relative (bar)'], aria: 'Relation pression-température du R22 : la pression relative de vaporisation vaut 0 à −40 °C, environ 3,5 bar à 0 °C et 8 bar à 20 °C ; elle augmente de plus en plus vite' },
    // eau : température d'ébullition selon la pression
    eau: { f: psatEau, deb: 20, fin: 142, t: { min: 20, max: 145, pas: 20, sous: 10 }, p: { max: 4, pas: .5, sous: .25 },
      noms: ['Température (°C)', 'Pression (bar)'], aria: 'Courbe de vaporisation de l\'eau : pression de 0,02 bar à 20 °C, 0,5 bar vers 81 °C, 1 bar à 100 °C, 2 bar vers 120 °C, 3,6 bar à 140 °C' },
  };
  // température de vaporisation à la pression P (lecture « à l'envers »)
  const tVap = (def, P) => inverse(def.f, P, def.deb, def.fin);
  function geoPT(def, W) {
    const H = Math.round(Math.min(380, Math.max(250, W * .62)));
    const g = 46, d = 18, h = 30, b = 42, L = W - g - d, Hh = H - h - b;
    return { W, H, g, h, L, Hh, X: T => g + (T - def.t.min) / (def.t.max - def.t.min) * L, Y: P => h + Hh - P / def.p.max * Hh };
  }
  /* o = { lecture: { T } ou { P } (repères en pointillés jusqu'aux axes), valeur (valeur lue écrite sur l'axe) } */
  function svgPT(def, W, o) {
    o = o || {};
    const G = geoPT(def, W), { X, Y, g, h, L, Hh } = G;
    let s = '';
    const multiple = (v, p) => Math.abs(v / p - Math.round(v / p)) < 1e-6;
    for (let T = Math.ceil(def.t.min / def.t.sous) * def.t.sous; T <= def.t.max + 1e-9; T += def.t.sous) s += ligne(X(T), h, X(T), h + Hh, multiple(T, def.t.pas) ? 'ph-grille' : 'ce-sous-grille');
    for (let P = 0; P <= def.p.max + 1e-9; P += def.p.sous) s += ligne(g, Y(P), g + L, Y(P), multiple(P, def.p.pas) ? 'ph-grille' : 'ce-sous-grille');
    const serre = L / ((def.t.max - def.t.min) / def.t.pas) < 40;
    for (let T = Math.ceil(def.t.min / def.t.pas) * def.t.pas, k = 0; T <= def.t.max + 1e-9; T += def.t.pas, k++) if (!serre || k % 2 === 0) s += txt(X(T), h + Hh + 18, fmt(T), 'ph-graduation', 'middle');
    for (let P = 0; P <= def.p.max + 1e-9; P += def.p.pas) s += txt(g - 7, Y(P) + 4, fmt(+P.toFixed(6)), 'ph-graduation', 'end');
    s += ligne(g, Y(0), g + L + 8, Y(0), 'ph-axe') + ligne(g, h + Hh, g, h - 12, 'ph-axe');
    s += `<path d="M${f1(g + L + 14)},${f1(Y(0))} l-9,-4.5 v9 Z M${f1(g)},${h - 18} l-4.5,9 h9 Z" class="ph-fleche"/>`;
    s += txt(g + L + 4, G.H - 6, def.noms[0], 'ph-axe-nom', 'end') + txt(g + 8, h - 10, def.noms[1], 'ph-axe-nom');
    let p = '';
    for (let k = 0; k <= 200; k++) { const T = def.deb + (def.fin - def.deb) * k / 200, P = def.f(T); if (P > def.p.max) break; p += (p ? 'L' : 'M') + f1(X(T)) + ',' + f1(Y(P)); }
    s += `<path d="${p}" class="ph-courbe"/>`;
    if (o.lecture) {
      const T = o.lecture.T != null ? o.lecture.T : tVap(def, o.lecture.P), P = o.lecture.P != null ? o.lecture.P : def.f(T);
      s += `<path d="M${f1(g)},${f1(Y(P))} H${f1(X(T))} V${f1(Y(0))}" class="ph-lecture" fill="none"/><circle cx="${f1(X(T))}" cy="${f1(Y(P))}" r="5" class="ph-point"/>`;
      if (o.valeur) s += txt(X(T), Y(0) - 6, fmt(Math.round(T)), 'ce-t-val', 'middle') + txt(g + 4, Y(P) - 6, fmt(+P.toFixed(2)), 'ce-t-val');
    }
    return `<svg viewBox="0 0 ${G.W} ${G.H}" class="ph-graphe ce-pt-graphe" role="img" aria-label="${def.aria}">${s}</svg>`;
  }
  const figPT = (nom, o) => figure(W => svgPT(COURBES[nom], W, o), 'ce-fig-pt');

  /* ============================================================
     SCHÉMA DES ÉTAPES
     Un problème : un corps pur passe d'un état (ei, ti) à un état (ef, tf).
     On dessine une bulle par état (état physique et température), une flèche par
     étape (Q₁, Q₂…) : changement de température (Q = m c ΔT) ou changement d'état
     à température fixe (Q = m L). Puis Q = Q₁ + Q₂ + …
     ============================================================ */
  const RANG = { s: 0, l: 1, g: 2 }, ETATS = ['s', 'l', 'g'];
  const NOMS_TRANS = { temp: 'changement de température', fus: 'fusion', sol: 'solidification', vap: 'vaporisation', liq: 'liquéfaction' };
  /* corps purs : noms dans les bulles, noms dans les phrases, températures de changement d'état,
     données (c en J·kg⁻¹·K⁻¹, L en J·kg⁻¹ ; k : écrite en kJ dans l'énoncé) */
  const CORPS = {
    eau: { noms: { s: 'glace', l: 'eau', g: 'gaz' }, etats: { s: 'glace (solide)', l: 'eau liquide', g: 'vapeur (gaz)' },
      le: { s: 'la glace', l: 'l\'eau liquide', g: 'la vapeur d\'eau' }, pron: { s: 'la', l: 'la', g: 'la' },
      de: { s: 'de glace', l: 'd\'eau liquide', g: 'de vapeur d\'eau' }, du: { s: 'de la glace', l: 'de l\'eau liquide', g: 'de la vapeur d\'eau' },
      fus: 0, vap: 100, donnees: [
        { id: 'cs', html: 'c<sub>glace</sub> = 2 090 ' + UC, type: 'c', etat: 's', v: 2090 },
        { id: 'cl', html: 'c<sub>eau</sub> = 4 180 ' + UC, type: 'c', etat: 'l', v: 4180 },
        { id: 'cg', html: 'c<sub>vapeur</sub> = 2 010 ' + UC, type: 'c', etat: 'g', v: 2010 },
        { id: 'Lf', html: 'L<sub>fus</sub> = 334 ' + ULk, type: 'L', trans: 'fus', v: 334e3, k: true },
        { id: 'Lv', html: 'L<sub>vap</sub> = 2 257 ' + ULk, type: 'L', trans: 'vap', v: 2257e3, k: true }] },
    ethanol: { noms: { l: 'liquide', g: 'gaz' }, etats: { l: 'liquide', g: 'gaz' },
      le: { l: 'l\'éthanol liquide', g: 'l\'éthanol gazeux' }, pron: { l: 'le', g: 'le' },
      de: { l: 'd\'éthanol liquide', g: 'd\'éthanol gazeux' }, du: { l: 'de l\'éthanol liquide', g: 'de l\'éthanol gazeux' },
      vap: 78, donnees: [
        { id: 'cl', html: 'c<sub>liquide</sub> = 2 440 ' + UC, type: 'c', etat: 'l', v: 2440 },
        { id: 'cg', html: 'c<sub>gaz</sub> = 1 420 ' + UC, type: 'c', etat: 'g', v: 1420 },
        { id: 'Lv', html: 'L<sub>vap</sub> = 855 ' + ULk, type: 'L', trans: 'vap', v: 855e3, k: true }] },
    r22: { noms: { l: 'liquide', g: 'gaz' }, etats: { l: 'liquide', g: 'gaz' }, pression: '18 bar',
      le: { l: 'le R22 liquide', g: 'le R22 gazeux' }, pron: { l: 'le', g: 'le' },
      de: { l: 'de fluide R22 liquide', g: 'de fluide R22 gazeux' }, du: { l: 'du R22 liquide', g: 'du R22 gazeux' },
      vap: 49, donnees: [
        { id: 'Lv', html: 'L<sub>vap</sub> = 233,7 ' + ULk, type: 'L', trans: 'vap', v: 233.7e3, k: true },
        { id: 'cl', html: 'c<sub>liq</sub> = 1,257 ' + UCk, type: 'c', etat: 'l', v: 1257, k: true },
        { id: 'cg', html: 'c<sub>gaz</sub> = 0,662 ' + UCk, type: 'c', etat: 'g', v: 662, k: true }] },
    alu: { noms: { s: 'solide', l: 'liquide' }, etats: { s: 'solide', l: 'liquide' },
      le: { s: 'l\'aluminium solide', l: 'l\'aluminium liquide' }, pron: { s: 'le', l: 'le' },
      de: { s: 'd\'aluminium solide', l: 'd\'aluminium liquide' }, du: { s: 'de l\'aluminium solide', l: 'de l\'aluminium liquide' },
      fus: 660, donnees: [
        { id: 'cs', html: 'c<sub>solide</sub> = 897 ' + UC, type: 'c', etat: 's', v: 897 },
        { id: 'cl', html: 'c<sub>liquide</sub> = 1 180 ' + UC, type: 'c', etat: 'l', v: 1180 },
        { id: 'Lf', html: 'L<sub>fus</sub> = 397 ' + ULk, type: 'L', trans: 'fus', v: 397e3, k: true }] },
  };
  const NOM_CORPS = { eau: 'l\'eau', ethanol: 'l\'éthanol', r22: 'le fluide R22', alu: 'l\'aluminium' };

  /* Problème : def = { corps (clé de CORPS), m (kg), mTxt (« 250 g »), ei, ti, ef, tf,
     donnees (facultatif : données de l'énoncé, même format), nomQ ('Q' ou 'E'), enonce (HTML, facultatif) } */
  function probleme(def) {
    const C = CORPS[def.corps];
    const pb = Object.assign({}, C, { nomQ: 'Q', trouves: [] }, def);
    pb.donnees = def.donnees || C.donnees;
    pb.c = {}; pb.L = {};
    pb.donnees.forEach(x => { if (x.type === 'c') pb.c[x.etat] = x.v; else pb.L[x.trans] = x.v; });
    // masse en kg : 250 g → 0,250 kg (mêmes chiffres significatifs que l'énoncé)
    pb.mKg = pb.mKg || (pb.mTxt && / g$/.test(pb.mTxt) ? fmt(pb.m, 3) + ESP + 'kg' : pb.mTxt || fmt(pb.m) + ESP + 'kg');
    pb.mTxt = pb.mTxt || pb.mKg;
    pb.sens = RANG[pb.ef] > RANG[pb.ei] || (pb.ef === pb.ei && pb.tf > pb.ti) ? 1 : -1;
    pb.bulles = chaineCanon(pb);
    pb.etapes = pb.bulles.slice(1).map((b, k) => etapeDe(pb, pb.bulles[k], b, k));
    pb.Q = pb.etapes.reduce((s, e) => s + e.Q, 0);
    if (!pb.enonce) pb.enonce = enonceProbleme(pb);
    return pb;
  }
  // température du changement d'état entre deux états voisins
  const tChangement = (pb, a, b) => (RANG[a] + RANG[b] === 1 ? pb.fus : pb.vap);
  // bulles du schéma juste (une bulle de plus par changement de température ou d'état)
  function chaineCanon(pb) {
    const b = [{ e: pb.ei, t: pb.ti }];
    let e = pb.ei, t = pb.ti;
    while (e !== pb.ef) {
      const e2 = ETATS[RANG[e] + pb.sens], tc = tChangement(pb, e, e2);
      if (t !== tc) b.push({ e, t: tc });
      b.push({ e: e2, t: tc });
      e = e2; t = tc;
    }
    if (t !== pb.tf) b.push({ e, t: pb.tf });
    return b;
  }
  const natureDe = (a, b) => (a.e === b.e ? 'temp' : { sl: 'fus', ls: 'sol', lg: 'vap', gl: 'liq' }[a.e + b.e] || 'saut');
  // une étape (flèche) : nature, donnée à utiliser, énergie Q
  function etapeDe(pb, a, b, k) {
    const n = natureDe(a, b);
    if (n === 'temp') return { k, a, b, n, donnee: pb.donnees.find(x => x.type === 'c' && x.etat === a.e).id, Q: pb.m * pb.c[a.e] * (b.t - a.t) };
    const tr = n === 'fus' || n === 'sol' ? 'fus' : 'vap';
    return { k, a, b, n, tr, donnee: pb.donnees.find(x => x.type === 'L' && x.trans === tr).id, Q: (n === 'fus' || n === 'vap' ? 1 : -1) * pb.m * pb.L[tr] };
  }
  const nomQ = (pb, k) => `${pb.nomQ}<sub>${k + 1}</sub>`;
  const bulleTxt = (pb, b) => `${pb.noms[b.e]} ${deg(b.t)}`;
  const pressionTxt = pb => (pb.pression ? ` à ${pb.pression}` : ' à la pression atmosphérique');
  function enonceProbleme(pb) {
    const v = pb.sens > 0 ? 'On chauffe' : 'On refroidit';
    let h = `<p>${v} ${pb.mTxt} ${pb.de[pb.ei]} à ${deg(pb.ti)} jusqu'à obtenir ${pb.du[pb.ef]} à ${deg(pb.tf)}${pb.pression ? `, à la pression de ${pb.pression}` : ''}.</p>`;
    const tc = [];
    if (pb.fus != null && (pb.noms.s && pb.noms.l)) tc.push(`fusion à ${deg(pb.fus)}`);
    if (pb.vap != null) tc.push(`${pb.pression ? 'vaporisation' : 'ébullition'} à ${deg(pb.vap)}`);
    h += `<p class="ph-donnees">Données : ${pb.donnees.map(x => x.html).join(' ; ')}.<br>Changements d'état${pressionTxt(pb)} : ${tc.join(', ')}.</p>`;
    return h;
  }

  /* ---------- Dessin du schéma : bulles et flèches ----------
     o = { edit (bulles = boutons), sel (bulle choisie), ko (bulle fausse), actif (flèche en cours),
           valeurs (énergies trouvées, une par flèche), masse (m dans la première bulle, true par défaut) } */
  function chaineHTML(pb, bulles, o) {
    o = o || {};
    let h = '';
    bulles.forEach((b, k) => {
      if (k) {
        const v = o.valeurs && o.valeurs[k - 1];
        h += `<div class="ce-sf${o.actif === k - 1 ? ' actif' : ''}"><span class="ce-sf-nom">${nomQ(pb, k - 1)}</span><span class="ce-sf-fl">${FLECHE}</span>` +
          `<span class="ce-sf-val">${v != null ? sci(v, 3) + ESP + 'J' : ''}</span></div>`;
      }
      const tete = `${pb.pression ? pb.pression + ', ' : ''}${b.t == null ? '? °C' : deg(b.t)}`;
      const dedans = `<span class="ce-sb-e">${b.e == null ? '?' : pb.noms[b.e]}</span>${k === 0 && o.masse !== false ? `<span class="ce-sb-m">m = ${pb.mKg}</span>` : ''}`;
      const cls = `ce-sb ce-sb-${b.e || 'x'}${o.sel === k ? ' sel' : ''}${o.ko === k ? ' ko' : ''}`;
      h += `<div class="ce-sb-col"><span class="ce-sb-t">${tete}</span>${o.edit
        ? `<button type="button" class="${cls}" data-k="${k}" aria-label="Bulle ${k + 1} : ${b.e == null ? 'état à choisir' : pb.noms[b.e]}, ${b.t == null ? 'température à choisir' : deg(b.t)}">${dedans}</button>`
        : `<div class="${cls}">${dedans}</div>`}</div>`;
    });
    const min = bulles.length * 112 + (bulles.length - 1) * 74 + 8;
    const aria = 'Schéma des étapes : ' + bulles.map(b => (b.e == null ? '?' : pb.noms[b.e]) + ' à ' + (b.t == null ? '?' : fmt(b.t)) + ' °C').join(', puis ');
    return `<div class="ce-ligne-cont"><div class="ce-sch" data-min="${min}" role="${o.edit ? 'group' : 'img'}" aria-label="${aria}">${h}</div></div>`;
  }
  // schéma juste du problème, avec les énergies déjà trouvées
  const schemaPb = (pb, o) => chaineHTML(pb, pb.bulles, Object.assign({ valeurs: pb.trouves }, o));

  /* ---------- Diagnostic d'un schéma construit par l'élève ----------
     renvoie null (juste), { message } (incomplet, sans erreur comptée) ou { k, erreur } (bulle k fausse) */
  function diagChaine(pb, bulles) {
    const n = bulles.length, vide = bulles.findIndex(b => b.e == null || b.t == null);
    if (vide >= 0) return { message: `Choisis l'état et la température de la bulle ${vide + 1}.` };
    const b0 = bulles[0];
    if (b0.e !== pb.ei || b0.t !== pb.ti) return { k: 0, erreur: `La première bulle est l'état de départ de l'énoncé : ${bulleTxt(pb, { e: pb.ei, t: pb.ti })}.` };
    if (n === 1) return { message: `Ajoute des bulles jusqu'à l'état final : ${bulleTxt(pb, { e: pb.ef, t: pb.tf })}.` };
    const P = pressionTxt(pb);
    for (let k = 1; k < n; k++) {
      const a = bulles[k - 1], b = bulles[k], i = k, j = k + 1;
      if (a.e === b.e && a.t === b.t) return { k, erreur: `Les bulles ${i} et ${j} sont identiques : retire la bulle ${j}.` };
      if (a.e !== b.e && a.t !== b.t) return { k, erreur: `Entre les bulles ${i} et ${j}, l'état change : la température doit rester la même (un changement d'état se fait à température fixe).` };
      if (a.e !== b.e && Math.abs(RANG[a.e] - RANG[b.e]) === 2) {
        return { k, erreur: `Entre les bulles ${i} et ${j}, ${pb.le[a.e]} passe directement à l'état ${NOM_ETAT[b.e]} : ${P.trim()}, il faut d'abord ${a.e === 's' ? 'une fusion' : 'une liquéfaction'} (bulle « ${pb.noms.l} » entre les deux).` };
      }
      const dir = a.e === b.e ? Math.sign(b.t - a.t) : Math.sign(RANG[b.e] - RANG[a.e]);
      if (dir !== pb.sens) return { k, erreur: `Entre les bulles ${i} et ${j}, on ${dir > 0 ? 'chauffe' : 'refroidit'} : ici, on ${pb.sens > 0 ? 'chauffe' : 'refroidit'} du début à la fin, la transformation va dans un seul sens.` };
      if (a.e !== b.e) {
        const tc = tChangement(pb, a.e, b.e);
        if (a.t !== tc) return { k, erreur: `La ${NOMS_TRANS[natureDe(a, b)]} se fait à ${deg(tc)}${P}, pas à ${deg(a.t)} : il faut d'abord ${a.t < tc ? 'chauffer' : 'refroidir'} ${pb.le[a.e]} jusqu'à ${deg(tc)}.` };
      }
      // l'état de la bulle j est-il possible à sa température ?
      if (b.e === 's' && pb.fus != null && b.t > pb.fus) return { k, erreur: `${cap(pb.le.s)} ne peut pas dépasser ${deg(pb.fus)} : il faut d'abord ${pb.pron.s} faire fondre.` };
      if (b.e === 'l' && pb.vap != null && b.t > pb.vap) return { k, erreur: `${cap(pb.le.l)} ne dépasse pas ${deg(pb.vap)}${P} : il faut d'abord ${pb.pron.l} vaporiser.` };
      if (b.e === 'l' && pb.fus != null && pb.noms.s && b.t < pb.fus) return { k, erreur: `${cap(pb.le.l)} ne descend pas sous ${deg(pb.fus)} : il faut d'abord ${pb.pron.l} solidifier.` };
      if (b.e === 'g' && pb.vap != null && b.t < pb.vap) return { k, erreur: `${cap(pb.le.g)} ne descend pas sous ${deg(pb.vap)}${P} : il faut d'abord ${pb.pron.g} liquéfier.` };
      if (k >= 2 && bulles[k - 2].e === a.e && a.e === b.e) return { k: k - 1, erreur: `Les bulles ${k - 1}, ${i} et ${j} sont toutes « ${pb.noms[a.e]} » : un seul changement de température suffit, retire la bulle ${i}.` };
    }
    const der = bulles[n - 1];
    if (der.e !== pb.ef || der.t !== pb.tf) return { k: n - 1, erreur: `Le schéma se termine par l'état final de l'énoncé : ${bulleTxt(pb, { e: pb.ef, t: pb.tf })}.` };
    const can = pb.bulles;
    if (can.length !== n || can.some((b, k) => b.e !== bulles[k].e || b.t !== bulles[k].t)) return { k: 0, erreur: 'Compare ton schéma avec l\'énoncé : une bulle par état, de l\'état de départ à l\'état final.' };
    return null;
  }

  /* ---------- Outil 1 : construire le schéma (bulles) ---------- */
  function construire(zone, o, api) {
    const pb = o.pb;
    let bulles = [{ e: null, t: null }], sel = 0, fini = false, ko = -1;
    // températures proposées : celles de l'énoncé et des changements d'état (au moins trois : sinon, 20 °C en plus)
    const temps = [pb.ti, pb.tf, pb.fus, pb.vap].filter((t, k, l) => t != null && l.indexOf(t) === k && !(k === 2 && !pb.noms.s));
    if (temps.length < 3 && temps.indexOf(20) < 0) temps.push(20);
    temps.sort((a, b) => a - b);
    const etats = ETATS.filter(e => pb.noms[e]);
    const d = el('div', 'ce-bt');
    d.innerHTML = '<div class="ce-bt-sch"></div><div class="ce-ed"></div>';
    zone.appendChild(d);
    const zs = d.querySelector('.ce-bt-sch'), ze = d.querySelector('.ce-ed');
    const bVal = boutonValider(zone);
    function rendre() {
      zs.innerHTML = chaineHTML(pb, bulles, { edit: !fini, sel: fini ? -1 : sel, ko: fini ? -1 : ko });
      if (fini) { ze.innerHTML = ''; ze.hidden = true; return; }
      zs.querySelectorAll('button.ce-sb').forEach(b => { b.onclick = () => { sel = +b.dataset.k; rendre(); }; });
      const b = bulles[sel];
      ze.innerHTML = `<p class="ce-ed-t">Bulle ${sel + 1}${sel === 0 ? ' : état de départ' : ''}</p>
        <div class="ce-ed-l"><span class="ce-ed-lab">État</span><div class="ce-ed-ch">${etats.map(e => `<button type="button" class="ce-tg" data-e="${e}" aria-pressed="${b.e === e}">${pb.etats[e]}</button>`).join('')}</div></div>
        <div class="ce-ed-l"><span class="ce-ed-lab">Température</span><div class="ce-ed-ch">${temps.map(t => `<button type="button" class="ce-tg" data-t="${t}" aria-pressed="${b.t === t}">${deg(t)}</button>`).join('')}</div></div>
        <div class="ce-ed-act">${bulles.length < 7 ? '<button type="button" class="btn-small" data-a="plus">＋ Ajouter une bulle</button>' : ''}${bulles.length > 1 ? '<button type="button" class="btn-small" data-a="moins">Retirer la dernière bulle</button>' : ''}</div>`;
      ze.querySelectorAll('[data-e]').forEach(x => { x.onclick = () => { b.e = x.dataset.e; ko = -1; api.effacer(); rendre(); }; });
      ze.querySelectorAll('[data-t]').forEach(x => { x.onclick = () => { b.t = +x.dataset.t; ko = -1; api.effacer(); rendre(); }; });
      const plus = ze.querySelector('[data-a="plus"]'), moins = ze.querySelector('[data-a="moins"]');
      if (plus) plus.onclick = () => { bulles.push({ e: null, t: null }); sel = bulles.length - 1; ko = -1; api.effacer(); rendre(); };
      if (moins) moins.onclick = () => { bulles.pop(); sel = Math.min(sel, bulles.length - 1); ko = -1; api.effacer(); rendre(); };
    }
    rendre();
    bVal.onclick = () => {
      if (fini || api.fini()) return;
      const r = diagChaine(pb, bulles);
      if (r && r.message) { secouer(zs); api.message(r.message); return; }
      if (r) { ko = r.k; sel = r.k; rendre(); api.erreur(r.erreur); secouer(zs); return; }
      fini = true; bVal.fermer(); rendre(); api.reussi();
    };
    return { montrer() { bulles = pb.bulles.map(b => Object.assign({}, b)); fini = true; bVal.fermer(); rendre(); } };
  }
  const partieConstruire = (pb, o) => Object.assign({ type: 'perso', pb,
    q: 'Construis le schéma des étapes : une bulle par état (état physique et température), de l\'état de départ à l\'état final. Touche une bulle pour la modifier.',
    solution: `<p>${pb.bulles.map(b => bulleTxt(pb, b)).join(' → ')} : ${pb.etapes.length} étape${pb.etapes.length > 1 ? 's' : ''}.</p>`,
    monter: (zone, api) => construire(zone, { pb }, api) }, o);

  /* ---------- Outil 2 : nature de chaque flèche (grille) ---------- */
  function partieNature(pb, o) {
    const ids = ['temp', 'fus', 'sol', 'vap', 'liq'];
    const lignes = pb.etapes.map(et => {
      const indices = {};
      ids.forEach(x => {
        if (x === et.n) return;
        indices[x] = et.n === 'temp' ? `${nomQ(pb, et.k)} : l'état ne change pas (${pb.noms[et.a.e]}), seule la température varie.`
          : x === 'temp' ? `${nomQ(pb, et.k)} : l'état change (${pb.noms[et.a.e]} → ${pb.noms[et.b.e]}) à température fixe.`
            : `${nomQ(pb, et.k)} : ${NOM_ETAT[et.a.e]} → ${NOM_ETAT[et.b.e]}, c'est une ${NOMS_TRANS[et.n]}.`;
      });
      return { id: 'f' + et.k, label: `${nomQ(pb, et.k)} : ${bulleTxt(pb, et.a)} → ${bulleTxt(pb, et.b)}`, bonne: et.n, indices };
    });
    return Object.assign({ type: 'grille', q: 'Pour chaque flèche : changement de température, ou changement d\'état (lequel) ?',
      options: ids.map(x => ({ id: x, label: NOMS_TRANS[x] })), lignes,
      figure: z => { z.innerHTML = schemaPb(pb); },
      solution: `<p>${pb.etapes.map(et => `${nomQ(pb, et.k)} : ${NOMS_TRANS[et.n]}`).join(' ; ')}.</p>` }, o);
  }

  /* ---------- Outil 3 : une flèche : formule, donnée, calcul de Qᵢ ---------- */
  function calculEtape(pb, et, aff) {
    const dn = pb.donnees.find(x => x.id === et.donnee), Qn = nomQ(pb, et.k), m = pb.mKg.split(ESP)[0];
    const sym = dn.html.split(' = ')[0];  // « c<sub>glace</sub> », « L<sub>fus</sub> »
    // donnée écrite en kJ dans l'énoncé : convertie en J (× 10³)
    const val = dn.k ? `${fmt(dn.v / 1000)} × 10<sup>3</sup>` : fmt(dn.v);
    if (et.n === 'temp') {
      return `<p class="ph-calc">${Qn} = m × ${sym} × (T<sub>f</sub> − T<sub>i</sub>) = ${m} × ${val} × (${fmt(et.b.t)} − ${par(et.a.t)})</p>` +
        `<p class="ph-calc">${Qn} ${aff ? '≈' : '='} <span class="c">${sci(et.Q, 3)} J</span></p>`;
    }
    const neg = et.n === 'sol' || et.n === 'liq';
    return `<p class="ph-calc">${Qn} = m × ${neg ? `(−${sym})` : sym} = ${m} × ${neg ? `(−${val})` : val}</p><p class="ph-calc">${Qn} ${aff ? '≈' : '='} <span class="c">${sci(et.Q, 3)} J</span></p>` +
      (neg ? `<p>Pour une ${NOMS_TRANS[et.n]}, L = −${sym} : le système cède de l'énergie.</p>` : '');
  }
  function outilFleche(zone, o, api) {
    const pb = o.pb, et = pb.etapes[o.k], Qn = nomQ(pb, o.k);
    const dn = id => pb.donnees.find(x => x.id === id);
    let f = null, dsel = null, fini = false;
    const d = el('div', 'ce-fq');
    d.innerHTML = `<p class="ce-fq-t"><b>${Qn}</b> : ${bulleTxt(pb, et.a)} → ${bulleTxt(pb, et.b)}</p>
      <div class="ce-fq-l"><span class="ce-fq-lab">Formule</span><div class="ce-fq-ch" data-g="f">
        <button type="button" class="ce-tg" data-f="c" aria-pressed="false">${Qn} = m × c × (T<sub>f</sub> − T<sub>i</sub>)</button>
        <button type="button" class="ce-tg" data-f="L" aria-pressed="false">${Qn} = m × L</button></div></div>
      <div class="ce-fq-l"><span class="ce-fq-lab">Donnée</span><div class="ce-fq-ch" data-g="d">${pb.donnees.map(x => `<button type="button" class="ce-tg" data-d="${x.id}" aria-pressed="false">${x.html}</button>`).join('')}</div></div>`;
    const v = el('div', 'ph-valeur ce-fq-v');
    v.appendChild(el('span', 'ph-lab', `${Qn} =`));
    const s = el('span', 'ph-sci'), a = champ({ petit: true, aria: 'Nombre devant la puissance de 10' }), n = champ({ petit: true, aria: 'Exposant de la puissance de 10' });
    n.el.classList.add('ph-exposant');
    s.appendChild(a.el); s.appendChild(el('span', 'ph-x10', '× 10')); s.appendChild(n.el);
    v.appendChild(s); v.appendChild(el('span', 'ph-unite', 'J'));
    d.appendChild(v);
    zone.appendChild(d);
    const bF = Array.from(d.querySelectorAll('[data-f]')), bD = Array.from(d.querySelectorAll('[data-d]'));
    bF.forEach(b => { b.onclick = () => { if (fini) return; f = b.dataset.f; bF.forEach(x => x.setAttribute('aria-pressed', String(x === b))); api.effacer(); }; });
    bD.forEach(b => { b.onclick = () => { if (fini) return; dsel = b.dataset.d; bD.forEach(x => x.setAttribute('aria-pressed', String(x === b))); api.effacer(); }; });
    [a, n].forEach(c => {
      c.input.addEventListener('input', () => api.effacer());
      c.input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); valider(); } });
    });
    const bVal = boutonValider(zone);
    const bonF = et.n === 'temp' ? 'c' : 'L';
    function diagValeur(x) {
      const Q = et.Q, dd = dn(et.donnee);
      if (proche(x, -Q, .01)) {
        if (et.n === 'temp') {
          const dT = et.b.t - et.a.t;
          return `${dT > 0 ? 'La température monte' : 'La température baisse'} : T<sub>f</sub> − T<sub>i</sub> = ${fmt(et.b.t)} − ${par(et.a.t)} = ${fmt(dT)} °C, donc ${Qn} ${dT > 0 ? '> 0' : '< 0'}.`;
        }
        return et.n === 'fus' || et.n === 'vap' ? `Pour une ${NOMS_TRANS[et.n]}, le système reçoit de l'énergie : L > 0, donc ${Qn} > 0.`
          : `Pour une ${NOMS_TRANS[et.n]}, L = −L<sub>${et.tr}</sub> : ${Qn} est négative (le système cède de l'énergie).`;
      }
      if (/g$/.test(pb.mTxt) && !/kg$/.test(pb.mTxt) && proche(x, Q * 1000, .01)) return `La masse doit être en kg : ${pb.mTxt} = ${pb.mKg}.`;
      if (proche(x, Q / 1000, .01) || proche(x, -Q / 1000, .01)) return dd.k ? `Convertis la donnée en J : ${dd.html} = ${dd.html.split(' = ')[1].replace(/^([\d ,]+) k/, (m0, nb) => `${nb.trim()} × 10<sup>3</sup> `)}.` : `Donne ${Qn} en joules (J).`;
      if (et.n === 'temp' && (proche(x, pb.m * pb.c[et.a.e] * et.b.t, .01) || proche(x, pb.m * pb.c[et.a.e] * et.a.t, .01))) return `C'est l'écart de température qui compte : T<sub>f</sub> − T<sub>i</sub> = ${fmt(et.b.t)} − ${par(et.a.t)} = ${fmt(et.b.t - et.a.t)} °C.`;
      if (et.n === 'temp') return `${Qn} = m × c × (T<sub>f</sub> − T<sub>i</sub>) avec m en kg, c en J·kg<sup>−1</sup>·K<sup>−1</sup> et T<sub>f</sub> − T<sub>i</sub> = ${fmt(et.b.t)} − ${par(et.a.t)}.`;
      return `${Qn} = m × ${et.n === 'sol' || et.n === 'liq' ? '(−L)' : 'L'} avec m en kg et L en J·kg<sup>−1</sup>.`;
    }
    function terminer() {
      fini = true;
      bF.forEach(x => { x.disabled = true; x.setAttribute('aria-pressed', String(x.dataset.f === bonF)); });
      bD.forEach(x => { x.disabled = true; x.setAttribute('aria-pressed', String(x.dataset.d === et.donnee)); });
      a.desactiver(true); n.desactiver(true); bVal.fermer();
      pb.trouves[o.k] = et.Q;
    }
    function valider() {
      if (fini || api.fini()) return;
      if (!f || !dsel) { api.message('Choisis la formule et la donnée de cette flèche.'); return; }
      const va = lire(a.input.value), vn = lire(n.input.value);
      if (isNaN(va)) { secouer(v); api.message(`Écris ${Qn} : le nombre devant la puissance de 10.`); return; }
      if (isNaN(vn) || !Number.isInteger(vn)) { secouer(v); api.message('Écris l\'exposant de la puissance de 10 (un nombre entier).'); return; }
      if (f !== bonF) {
        api.erreur(bonF === 'c' ? `Entre ces deux bulles, l'état ne change pas (${pb.noms[et.a.e]}) : seule la température varie, la formule utilise c et l'écart de température.`
          : `Entre ces deux bulles, la température ne change pas (ΔT = 0) : c'est une ${NOMS_TRANS[et.n]}, la formule utilise la chaleur latente L.`);
        secouer(d.querySelector('[data-g="f"]'));
        return;
      }
      const ch = dn(dsel);
      if (dsel !== et.donnee) {
        api.erreur(et.n === 'temp'
          ? (ch.type === 'L' ? 'Pour un changement de température, il faut une capacité thermique massique c, pas une chaleur latente.'
            : `C'est ${pb.le[et.a.e]} qui change de température : prends la capacité thermique massique de cet état.`)
          : (ch.type === 'c' ? 'Pour un changement d\'état, il faut une chaleur latente L, pas une capacité thermique massique.'
            : `C'est une ${NOMS_TRANS[et.n]} : prends la chaleur latente de ${et.tr === 'fus' ? 'fusion' : 'vaporisation'}.`));
        secouer(d.querySelector('[data-g="d"]'));
        return;
      }
      const x = va * Math.pow(10, vn);
      if (proche(x, et.Q, .01) || proche(x, +et.Q.toPrecision(3), 1e-6)) { terminer(); api.reussi(); return; }
      api.erreur(diagValeur(x));
      secouer(v);
    }
    bVal.onclick = valider;
    return {
      montrer() {
        let e = Math.floor(Math.log10(Math.abs(et.Q)) + 1e-12), m = +(et.Q / Math.pow(10, e)).toFixed(2);
        if (Math.abs(m) >= 10) { m /= 10; e++; }
        a.input.value = fmt(m, 2); n.input.value = String(e).replace('-', MOINS);
        terminer();
      },
    };
  }
  const partieFleche = (pb, k, o) => Object.assign({ type: 'perso', pb, k,
    q: `Flèche ${nomQ(pb, k)} : choisis la formule et la donnée, puis calcule ${nomQ(pb, k)} (3 chiffres significatifs, signe compris).`,
    figure: z => { z.innerHTML = schemaPb(pb, { actif: k }); },
    solution: calculEtape(pb, pb.etapes[k], true), monter: (zone, api) => outilFleche(zone, { pb, k }, api) }, o);

  /* ---------- Outil 4 : énergie totale et interprétation ---------- */
  function partieSomme(pb, o) {
    const Qs = pb.etapes.map(e => e.Q), abs = Qs.reduce((s, x) => s + Math.abs(x), 0), Qn = pb.nomQ;
    const nom = pb.etapes.map(e => nomQ(pb, e.k)).join(' + ');
    return Object.assign({ type: 'sci', q: `Calcule l'énergie totale ${Qn} = ${nom} (3 chiffres significatifs).`, label: `${Qn} =`, valeur: pb.Q, unite: 'J', cs: 3, rel: .01,
      figure: z => { z.innerHTML = schemaPb(pb); },
      diag: v => (Qs.some(x => x < 0) && Qs.some(x => x > 0) && proche(v, abs, .01) ? 'Additionne les énergies avec leur signe : une énergie négative se retranche.'
        : Qs.some((x, k) => proche(v, pb.Q - x, .01)) ? `Il manque une flèche : ${Qn} = ${nom}.`
          : `${Qn} = ${nom}, chaque énergie avec son signe.`),
      solution: `<p class="ph-calc">${Qn} = ${nom}</p><p class="ph-calc">${Qn} = ${Qs.map(x => sci(x, 3)).join(' + ').replace(/\+ −/g, '− ')} ≈ <span class="c">${sci(pb.Q, 3)} J</span></p>` }, o);
  }
  function partieSens(pb, o) {
    const Qn = pb.nomQ, recoit = pb.Q > 0;
    return Object.assign({ type: 'choix', q: `D'après le signe de ${Qn}, le système (${NOM_CORPS[pb.corps] || 'le corps'}) reçoit-il ou cède-t-il de l'énergie ?`,
      options: [{ id: 'r', label: 'il reçoit de l\'énergie' }, { id: 'c', label: 'il cède de l\'énergie' }], bonne: recoit ? 'r' : 'c', melanger: false,
      indices: { r: `${Qn} < 0 : l'énergie est cédée au milieu extérieur.`, c: `${Qn} > 0 : l'énergie est reçue par le système.` },
      solution: `<p>${Qn} ${recoit ? '> 0 : le système <b>reçoit</b>' : '< 0 : le système <b>cède</b>'} ${sci(Math.abs(pb.Q), 3)} J${recoit ? '' : ' au milieu extérieur'}.</p>` }, o);
  }
  // toute la méthode : construire, nature, chaque flèche, somme, interprétation ; o.sans : parties à ne pas poser
  function etapes(pb, o) {
    o = o || {};
    const sans = o.sans || [];
    const l = [];
    if (sans.indexOf('construire') < 0) l.push(partieConstruire(pb));
    if (sans.indexOf('nature') < 0) l.push(partieNature(pb));
    pb.etapes.forEach((e, k) => l.push(partieFleche(pb, k)));
    if (pb.etapes.length > 1 && sans.indexOf('somme') < 0) l.push(partieSomme(pb));
    if (sans.indexOf('sens') < 0) l.push(partieSens(pb));
    return l;
  }

  /* ---------- Problèmes tirés au hasard (entraînement, séries) ----------
     niveau 1 : une étape ; 2 : deux étapes ; 3 : trois étapes ou plus ; 4 : refroidissement */
  function hasardProbleme(niveau) {
    niveau = niveau || hasard([1, 2, 3, 4]);
    const M = [[0.25, '250 g'], [0.5, '500 g'], [0.2, '200 g'], [0.8, '800 g'], [1.5, '1,5 kg'], [2, '2,0 kg']];
    const L = {
      1: [() => ({ corps: 'eau', ei: 'l', ti: hasard([10, 15, 20]), ef: 'l', tf: hasard([40, 60, 80]) }),
        () => ({ corps: 'eau', ei: 's', ti: 0, ef: 'l', tf: 0 }),
        () => ({ corps: 'eau', ei: 'l', ti: 100, ef: 'g', tf: 100 }),
        () => ({ corps: 'eau', ei: 's', ti: hasard([-30, -20, -15]), ef: 's', tf: hasard([-5, 0]) }),
        () => ({ corps: 'ethanol', ei: 'l', ti: hasard([15, 20, 25]), ef: 'l', tf: hasard([50, 60, 70]) }),
        () => ({ corps: 'ethanol', ei: 'l', ti: 78, ef: 'g', tf: 78 }),
        () => ({ corps: 'eau', ei: 'l', ti: 0, ef: 's', tf: 0 }),
        () => ({ corps: 'alu', ei: 'l', ti: 660, ef: 's', tf: 660 })],
      2: [() => ({ corps: 'eau', ei: 's', ti: hasard([-25, -20, -15, -10, -5]), ef: 'l', tf: 0 }),
        () => ({ corps: 'eau', ei: 's', ti: 0, ef: 'l', tf: hasard([10, 20, 30, 40]) }),
        () => ({ corps: 'eau', ei: 'l', ti: hasard([20, 40, 60, 80]), ef: 'g', tf: 100 }),
        () => ({ corps: 'ethanol', ei: 'l', ti: hasard([10, 20, 25]), ef: 'g', tf: 78 }),
        () => ({ corps: 'alu', ei: 's', ti: hasard([20, 25]), ef: 'l', tf: 660 })],
      3: [() => ({ corps: 'eau', ei: 's', ti: hasard([-30, -20, -18, -10]), ef: 'g', tf: 100 }),
        () => ({ corps: 'eau', ei: 's', ti: hasard([-20, -15, -10]), ef: 'l', tf: hasard([20, 30, 50]) }),
        () => ({ corps: 'eau', ei: 's', ti: hasard([-20, -10]), ef: 'g', tf: hasard([110, 120]) }),
        () => ({ corps: 'eau', ei: 'l', ti: hasard([20, 50]), ef: 'g', tf: hasard([110, 120, 130]) })],
      4: [() => ({ corps: 'r22', ei: 'g', ti: hasard([60, 65, 70, 75]), ef: 'l', tf: hasard([25, 30, 35]) }),
        () => ({ corps: 'eau', ei: 'l', ti: hasard([15, 20, 25]), ef: 's', tf: hasard([-18, -10, -5]) }),
        () => ({ corps: 'eau', ei: 'g', ti: hasard([105, 110, 120]), ef: 'l', tf: hasard([40, 60, 80]) }),
        () => ({ corps: 'ethanol', ei: 'g', ti: hasard([90, 100]), ef: 'l', tf: hasard([20, 30]) })],
    };
    const def = hasard(L[niveau])();
    const m = def.corps === 'r22' ? [2, '2,0 kg'] : hasard(M);
    return probleme(Object.assign({ m: m[0], mTxt: m[1] }, def));
  }

  /* ---------- Problèmes des exercices (exemples du module 5, exercices du module 6) ----------
     Données de l'énoncé, telles quelles (le manuel donne c_glace = 1 970 et c_vapeur = 2 090 pour
     l'exercice 14 ; le sujet de bac blanc écrit c_el = 418, valeur fausse et inutilisée : 4 180). */
  const PROBLEMES = {
    ex14: () => probleme({ corps: 'eau', m: .25, mTxt: '250 g', ei: 's', ti: -23, ef: 'g', tf: 100, donnees: [
      { id: 'cl', html: 'c<sub>eau liquide</sub> = 4 180 ' + UC, type: 'c', etat: 'l', v: 4180 },
      { id: 'cg', html: 'c<sub>eau vapeur</sub> = 2 090 ' + UC, type: 'c', etat: 'g', v: 2090 },
      { id: 'cs', html: 'c<sub>glace</sub> = 1 970 ' + UC, type: 'c', etat: 's', v: 1970 },
      { id: 'Lv', html: 'L<sub>vap</sub> = 2 257 ' + ULk, type: 'L', trans: 'vap', v: 2257e3, k: true },
      { id: 'Lf', html: 'L<sub>fus</sub> = 334 ' + ULk, type: 'L', trans: 'fus', v: 334e3, k: true }] }),
    ex15: () => probleme({ corps: 'r22', m: 2, mTxt: '2,00 kg', ei: 'g', ti: 70, ef: 'l', tf: 30, donnees: [
      { id: 'Lv', html: 'L = 233,7 ' + ULk + ' (vaporisation)', type: 'L', trans: 'vap', v: 233.7e3, k: true },
      { id: 'cl', html: 'c<sub>liq</sub> = 1,257 ' + UCk, type: 'c', etat: 'l', v: 1257, k: true },
      { id: 'cg', html: 'c<sub>gaz</sub> = 0,662 ' + UCk, type: 'c', etat: 'g', v: 662, k: true }] }),
    bac: () => probleme({ corps: 'eau', m: 2.3, mTxt: '2,3 kg', ei: 's', ti: -10, ef: 'l', tf: 0, nomQ: 'E', donnees: [
      { id: 'cl', html: 'c<sub>el</sub> = 4 180 ' + UC, type: 'c', etat: 'l', v: 4180 },
      { id: 'cs', html: 'c<sub>es</sub> = 2 090 ' + UC, type: 'c', etat: 's', v: 2090 },
      { id: 'Lf', html: 'L<sub>fusion</sub> = 333 ' + ULk, type: 'L', trans: 'fus', v: 333e3, k: true }] }),
  };
  // problème avec toutes ses énergies affichées sur le schéma (exemples)
  const resolu = pb => { pb.trouves = pb.etapes.map(e => e.Q); return pb; };

  /* ============================================================
     PLAN DE L'APPLICATION ET NAVIGATION (voir assets/sommaire.js)
     ============================================================ */
  const PLAN = [
    { n: 1, titre: 'États de la matière et liaison hydrogène', desc: 'Trois états, six changements d\'état, chaleurs latentes, liaison hydrogène', fiche: 'fiche_1',
      parties: [{ nom: 'États de la matière', cours: 'module_1_cours', questions: 'module_1_questions' }] },
    { n: 2, titre: 'Diagramme d\'état (P, T)', desc: 'Zones, point triple, point critique, état d\'une espèce, température de changement d\'état et pression', fiche: 'fiche_2',
      sousModules: true,
      parties: [
        { nom: 'Lire le diagramme d\'état', slug: 'diagramme', cours: 'module_2a_cours', noms: { cours: 'Cours : lire le diagramme d\'état' } },
        { nom: 'Changement d\'état et pression', slug: 'pression', cours: 'module_2b_cours', noms: { cours: 'Cours : changement d\'état et pression' } },
        { nom: 'Diagramme d\'état', questions: 'module_2_questions' }] },
    { n: 3, titre: 'Énergie et changement de température', desc: 'Q = m × c × (T<sub>f</sub> − T<sub>i</sub>), c selon l\'état, énergie reçue ou cédée', fiche: 'fiche_3',
      parties: [{ nom: 'Changement de température', cours: 'module_3_cours', questions: 'module_3_questions' }] },
    { n: 4, titre: 'Énergie et changement d\'état', desc: 'Q = m × L, température constante, signe de L', fiche: 'fiche_4',
      parties: [{ nom: 'Changement d\'état', cours: 'module_4_cours', questions: 'module_4_questions' }] },
    { n: 5, titre: 'La méthode du schéma des étapes', desc: 'Bulles et flèches, Q = m c ΔT ou Q = m L pour chaque flèche, Q = Q<sub>1</sub> + Q<sub>2</sub> + …', fiche: 'fiche_5',
      sousModules: true,
      parties: [
        { nom: 'Une ou deux étapes', slug: 'deux', cours: 'module_5a_cours', noms: { cours: 'Cours : une ou deux étapes' } },
        { nom: 'Plusieurs étapes', slug: 'plusieurs', cours: 'module_5b_cours', noms: { cours: 'Cours : plusieurs étapes, refroidissement' } },
        { nom: 'Entraînement', entrainement: 'module_5_entrainement', noms: { entrainement: 'Entraînement : problèmes au hasard' } },
        { nom: 'Schéma des étapes', questions: 'module_5_questions' }] },
    { n: 6, titre: 'Exercices', desc: 'Exercices 13, 14, 10, 15, 7, 8 et 17 de la feuille, exercice de bac blanc « Dégivrage »', exercices: 'module_6', exNom: 'Exercices de la feuille', nbEx: 8 },
  ];
  window.SOM.init({ nom: 'Chapitre 11 : Changements d\'état et transferts thermiques', id: 'changements-etat', cleEx: 'changements-etat-exercices', plan: PLAN });
  const menu = cle => window.SOM.menu(cle);
  const accueil = zone => window.SOM.accueil(zone);
  const marquer = info => window.SOM.marquer(info);

  window.CE = Object.assign(window.CE || {}, {
    MOINS, fmt, cs, sci, lire, proche, fr, o, fq, el, secouer, melanger, hasard, entre, champ, boutonValider, PARTIES, versCours,
    question, serie, confettis, slot, fl, pchip,
    ESP, UC, UCk, UL, ULk, deg, par, figure, dessin, schemaPose, ENERGIES, chaineEnergie,
    XU, yP, etatDiag, croisements, T_LISTE, P_LISTE, fmtP, figDiag, partieDiag, svgDiag, geoDiag, schemaDiag,
    COURBES, psatEau, tVap, figPT,
    CORPS, NOMS_TRANS, NOM_ETAT, probleme, chaineCanon, diagChaine, chaineHTML, schemaPb, nomQ, bulleTxt, calculEtape,
    partieConstruire, partieNature, partieFleche, partieSomme, partieSens, etapes, hasardProbleme, PROBLEMES, resolu,
    PLAN, menu, accueil, marquer,
  });
})();
