/* ============================================================
   Moteur de l'application « Énergie et travail » (Terminale spécialité).
   Moteur de questions repris de « Mouvement dans un champ uniforme »
   (champ-uniforme/modules/cu.js, lui-même issu de cinematique/modules/cin.js) ;
   schéma du théorème de l'énergie cinétique et parties 'schema' / 'grille'
   repris de « Théorème de l'énergie cinétique » (energie-cinetique/modules/ec.js) ;
   navigation commune assets/sommaire.js, cours avec assets/cours.js.

   NOMBRES ET QUESTIONS
   ET.fmt, ET.cs, ET.sci, ET.lire, ET.proche  écriture et lecture des nombres (virgule)
   ET.o, ET.fq.choix, ET.fq.nombre             fabriques d'options et de parties de question
   ET.PARTIES                                  parties : 'choix', 'nombre' (p.calc : icône calculatrice),
                                               'gabarit' (expression à trous), 'sci', 'schema' (étiquettes
                                               à glisser sur un schéma), 'grille' (un choix par ligne), 'perso'
   ET.versCours(p)                             une de ces parties dans un cours (assets/cours.js)
   ET.question(zone, q, cb, mode)              question en plusieurs parties (série, exercice)
   ET.serie(opts)                              série de 10 questions notée sur 20
   ET.fig(dessin), ET.outil(monter)            figure dessinée à la largeur disponible, outil placé dans du HTML

   ÉCRITURES
   ET.V(n, s)                 nom de vecteur (flèche au-dessus), indice hors de la flèche
   ET.col(a, b), ET.sys(…)    coordonnées en colonne, système avec accolade
   ET.fr(h, b), ET.rac(x)     fraction sur deux étages, racine carrée (signe relié à la barre)
   ET.newton(sys, F, a, proj) phrase de la seconde loi de Newton ; ET.integ(…) intégration rédigée
   ET.W(clé, d)               travail d'une force : W_AB(F⃗) ; ET.nomV(clé) nom de la force
   ET.CALC                    icône calculatrice (après l'unité d'un champ)
   ET.MS, ET.MS2, ET.VM       unités m·s⁻¹, m·s⁻², V·m⁻¹ ; ET.E_CH, ET.M_P, ET.M_E constantes

   FIGURES SVG (couleurs : attributs de présentation, comme VEC.C)
   ET.COUL                    { v, a, E (champ), F (force), traj, Ec, Epp, Em, perte (énergies) }
   ET.COULF                   couleurs des forces (poids, réaction, frottements, force motrice)
   ET.fl, ET.nom, ET.txt, ET.svg   flèche, nom de vecteur, texte, cadre de figure
   ET.condo(o)                condensateur plan horizontal ; ET.courbes(o) graphique de fonctions du temps
   ET.schemaMvt(o, vals)      schéma du théorème de l'énergie cinétique (A, B, forces, données)
   ET.partieDonnees(o, d, opts)  placer les données de l'énoncé sur ce schéma (glisser-déposer)
   ET.partieAngles(o, opts)   angle α de chaque force avec le déplacement, puis chaque travail
   ET.partieEquation(o, opts) choisir le théorème écrit pour la situation

   NAVIGATION
   ET.PLAN, ET.menu(cle), ET.accueil(zone)

   Les styles des cartes, boutons et écrans de fin viennent de
   equilibrer-reactions/modules/er.css ; ceux des questions, des
   écritures et des schémas de et.css.
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

  // icône calculatrice après l'unité (p.calc : valeur qui se calcule à la calculatrice, charte §7)
  const CALC = '<span class="calc-icone" role="img" aria-label="À calculer à la calculatrice" title="À calculer à la calculatrice"></span>';
  // Valeur numérique : p.label, p.valeur, p.tol (écart absolu) ou p.rel (écart relatif), p.unite, p.calc, p.diag(v), p.indice
  function pNombre(zone, p, api) {
    const d = el('div', 'ph-valeur');
    if (p.label) d.appendChild(el('span', 'ph-lab', p.label));
    const ch = champ({ signe: p.signe });
    d.appendChild(ch.el);
    if (p.unite) d.appendChild(el('span', 'ph-unite', p.unite));
    if (p.calc) d.insertAdjacentHTML('beforeend', CALC);
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
    const d = el('div', 'ph-valeur et-gab');
    if (p.label) d.appendChild(el('span', 'ph-lab', p.label));
    // chaque case forme un groupe insécable avec le texte qui la suit (et le texte d'ouverture
    // avec la première case) : sur un petit écran, la ligne ne se coupe qu'entre deux groupes
    const champs = [];
    let grp = el('span', 'et-gab-grp');
    d.appendChild(grp);
    p.morceaux.forEach(m => {
      if (typeof m === 'string') { grp.appendChild(el('span', 'et-gab-txt', m)); return; }
      if (champs.length) { grp = el('span', 'et-gab-grp'); d.appendChild(grp); }
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

  // Écriture scientifique a × 10ⁿ : p.label, p.valeur, p.unite, p.calc, p.rel (écart relatif, 3 % par défaut), p.cs, p.diag(v)
  function pSci(zone, p, api) {
    const d = el('div', 'ph-valeur');
    if (p.label) d.appendChild(el('span', 'ph-lab', p.label));
    const s = el('span', 'ph-sci'), a = champ({ petit: true, aria: 'Nombre devant la puissance de 10' }), n = champ({ petit: true, aria: 'Exposant de la puissance de 10' });
    n.el.classList.add('ph-exposant');
    s.appendChild(a.el); s.appendChild(el('span', 'ph-x10', '× 10')); s.appendChild(n.el);
    d.appendChild(s);
    if (p.unite) d.appendChild(el('span', 'ph-unite', p.unite));
    if (p.calc) d.insertAdjacentHTML('beforeend', CALC);
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

    // Outil propre à l'application : p.monter(zone, api) → { montrer() }
  function pPerso(zone, p, api) {
    const ctx = p.monter(zone, api) || {};
    return { montrer() { if (ctx.montrer) ctx.montrer(); } };
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
     p.schema : HTML du schéma, avec des cases ET.slot(id)
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
    const g = el('div', 'et-grille');
    g.innerHTML = p.lignes.map(l => `<div class="et-grille-l" data-l="${l.id}">
        <div class="et-grille-nom">${l.label}</div>
        <div class="et-grille-ch" role="group" aria-label="${String(l.label).replace(/<[^>]+>/g, '').replace(/"/g, '')}">
          ${p.options.map(o => `<button type="button" class="et-grille-b" data-o="${o.id}" aria-pressed="false">${o.label}</button>`).join('')}</div>
        <div class="et-grille-apres" hidden></div></div>`).join('');
    zone.appendChild(g);
    const lignes = Array.from(g.querySelectorAll('.et-grille-l'));
    const choisi = {};
    lignes.forEach(L => {
      L.querySelectorAll('.et-grille-b').forEach(b => {
        b.onclick = () => {
          if (api.fini() || b.disabled) return;
          choisi[L.dataset.l] = b.dataset.o;
          L.querySelectorAll('.et-grille-b').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
          L.classList.remove('ok', 'ko');
          api.effacer();
        };
      });
    });
    const bVal = boutonValider(zone);
    function terminer() {
      lignes.forEach((L, k) => {
        L.classList.remove('ko'); L.classList.add('ok');
        L.querySelectorAll('.et-grille-b').forEach(b => { b.disabled = true; });
        const a = L.querySelector('.et-grille-apres');
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
        lignes.forEach((L, k) => L.querySelectorAll('.et-grille-b').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.o === p.lignes[k].bonne))));
        terminer();
      },
    };
  }

  const PARTIES = { choix: pChoix, nombre: pNombre, gabarit: pGabarit, sci: pSci, schema: pSchema, grille: pGrille, perso: pPerso };
  // une partie de ce moteur dans un cours (assets/cours.js) : elle y devient un outil « perso »
  const versCours = p => ({ type: 'perso', q: p.q, solution: p.solution || p.correction, aide: p.aide, monter: (zone, api) => PARTIES[p.type](zone, p, api) });

  /* ============================================================
     « AFFICHER TOUT LE COURS »
     Les questions et les « À toi » en cours s'inscrivent ici. Quand
     l'élève demande tout le cours, chacun « se déplie » : toutes ses
     parties sont affichées d'un coup, avec le bouton « Afficher la
     réponse » disponible tout de suite. ET.tout reste vrai ensuite :
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
      window.ET.partieEnCours = p;          // partie en cours (utile pour vérifier l'application)
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
        const titre = vue ? (mode === 'exercice' ? 'Correction' : 'Réponse') : (erreursIci ? 'C\'est juste.' : 'Juste !');
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
    if (mode === 'cours' && window.ET.tout) inst.deplier();
  }

  /* ============================================================
     SÉRIE DE QUESTIONS NOTÉE SUR 20
     opts = { app, badge, titre, intro, questions: niv => [q], revoir, suite, niveaux }
     q = { theme, consigne, enonce, figure(zone), parties, bilan }
     opts.niveaux = [{ id, nom }] (facultatif) : un bouton par niveau à la place
     de « Commencer » ; questions(niv) reçoit l'id du niveau choisi.
     ============================================================ */
  function serie(opts) {
    const app = opts.app;
    let qs = [], idx = 0, score = 0, recap = [], niv = null;
    const nomNiv = () => (opts.niveaux.find(n => n.id === niv) || {}).nom;
    const pts = v => `${v} pt${v > 1 ? 's' : ''}`;

    function intro() {
      app.innerHTML = `<div class="er-card"><span class="er-badge">${opts.badge}</span><h2 class="er-titre">${opts.titre}</h2>${opts.intro || ''}
        <div class="cle" style="margin:14px 0"><p><b class="cle-titre">Barème</b> · ${opts.nombre || 10} questions, notées sur 20 :</p>
          <ul class="er-liste"><li><b>2 points</b> si tout est juste du premier coup ;</li><li><b>1 point</b> si tu y arrives après au moins une erreur ;</li><li><b>0 point</b> si tu affiches la réponse.</li></ul></div>
        ${opts.niveaux ? `<p><b>Choisis ton niveau :</b></p><div class="er-actions bf-niveaux">${opts.niveaux.map(n => `<button type="button" class="btn-primary" data-niv="${n.id}">${n.nom} →</button>`).join('')}</div>`
          : '<button type="button" class="btn-primary" data-a="go">Commencer →</button>'}</div>`;
      if (opts.niveaux) app.querySelectorAll('[data-niv]').forEach(b => { b.onclick = () => { niv = b.dataset.niv; demarrer(); }; });
      else app.querySelector('[data-a="go"]').onclick = demarrer;
      window.scrollTo(0, 0);
    }
    function demarrer() { qs = opts.questions(niv); idx = 0; score = 0; recap = []; afficher(); }

    function afficher() {
      if (idx >= qs.length) return fin();
      const q = qs[idx];
      window.ET.questionEnCours = q;          // question en cours (utile pour vérifier l'application)
      app.innerHTML = `<div class="er-card"><span class="er-badge">${opts.badge}</span><h2 class="er-titre">${opts.titre}</h2>
          <p class="er-meta">Question ${idx + 1}/${qs.length}${niv ? ` · Niveau ${nomNiv()}` : ''} · Score : <b data-a="score">${pts(score)}</b></p>
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
          const titre = p === 2 ? 'Bravo, juste du premier coup !' : p === 1 ? 'C\'est juste, après au moins une erreur.' : 'La réponse a été affichée.';
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
      const msg = score === max ? 'Tout est juste : bravo !' : pct >= 70 ? 'Très bien ! Encore un peu d\'entraînement pour le sans-faute.'
        : pct >= 50 ? 'Pas mal ! Recommence pour progresser : les questions changent à chaque fois.' : 'Continue à t\'entraîner : relis le cours, puis recommence.';
      app.innerHTML = `<div class="er-card er-fin"><span class="er-badge">${opts.badge}</span><h2 class="er-titre">Série terminée !</h2>${niv ? `<p class="er-meta">Niveau ${nomNiv()}</p>` : ''}
        ${score === max ? '<p class="er-trophee">🏆 Sans-faute !</p>' : ''}
        <div class="er-score">${fmt(note)} / 20</div><p class="er-score-pct">${pct} %</p><p class="er-contexte">${msg}</p>
        <div class="er-recap">${recap.map(r => `<div class="${r.p === 2 ? 'ok' : r.p === 1 ? 'moyen' : 'ko'}">Q${r.n}<b>${r.p}/2</b></div>`).join('')}</div>
        <div class="er-actions" style="justify-content:center"><button type="button" class="btn-secondary" data-a="re">↺ Recommencer avec d'autres questions</button>
        ${niv ? '<button type="button" class="btn-secondary" data-a="niv">Changer de niveau</button>' : ''}
        ${opts.revoir ? `<a class="btn-secondary" style="text-decoration:none" href="${opts.revoir.href}">${opts.revoir.label}</a>` : ''}
        ${opts.suite ? `<a class="btn-primary" style="text-decoration:none" href="${opts.suite.href}">${opts.suite.label}</a>` : ''}</div></div>`;
      app.querySelector('[data-a="re"]').onclick = demarrer;
      if (niv) app.querySelector('[data-a="niv"]').onclick = intro;
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
     ET.fig(dessin) renvoie un emplacement HTML ; dès qu'il est dans la
     page, dessin(W) y est appelé avec la largeur disponible W (et de
     nouveau quand la largeur change) : les textes gardent leur taille
     et restent lisibles sur un téléphone. Plusieurs figures par page.
     ============================================================ */
  const DESSINS = new Map();
  let nFig = 0, nMotif = 0;
  function fig(dessin, cls) {
    const k = String(++nFig);
    DESSINS.set(k, dessin);
    return `<div class="et-fig${cls ? ' ' + cls : ''}" data-fig="${k}"></div>`;
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
    const l = racine.matches && racine.matches('.et-fig[data-fig]') ? [racine] : [];
    racine.querySelectorAll('.et-fig[data-fig]').forEach(x => l.push(x));
    l.forEach(x => { const f = DESSINS.get(x.dataset.fig); if (f) monter(x, f); });
  }
  new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(chercher))).observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener('DOMContentLoaded', () => chercher(document.body));

  /* ============================================================
     OUTILS INTERACTIFS PLACÉS DANS DU HTML
     ET.outil(monter) renvoie un emplacement HTML ; dès qu'il est dans la
     page, monter(div) y construit l'outil, une seule fois.
     ============================================================ */
  const OUTILS = new Map();
  let nOutil = 0;
  function outil(f) {
    const k = String(++nOutil);
    OUTILS.set(k, f);
    return `<div class="et-outil" data-outil="${k}"></div>`;
  }
  function chercherOutils(racine) {
    if (!racine || !racine.querySelectorAll) return;
    const l = racine.matches && racine.matches('.et-outil[data-outil]') ? [racine] : [];
    racine.querySelectorAll('.et-outil[data-outil]').forEach(x => l.push(x));
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
     ÉCRITURES
     ============================================================ */
  const V = (n, s) => `<span class="vet-nom">${n}</span>${s ? `<sub>${s}</sub>` : ''}`;
  const NUL = V('0');
  const col = (a, b) => `<span class="vcol"><span>${a}</span><span>${b}</span></span>`;
  // système avec une accolade à sa hauteur : sys('x(t) = 3t + 2', 'y(t) = 0', …)
  const ACC = '<span class="et-acc" aria-hidden="true"><svg viewBox="0 0 10 8"><path d="M10,1 Q5,1 5,8"/></svg><i></i>' +
    '<svg viewBox="0 0 10 14"><path d="M5,0 Q5,7 0,7 Q5,7 5,14"/></svg><i></i><svg viewBox="0 0 10 8"><path d="M5,0 Q5,7 10,7"/></svg></span>';
  const sys = (...l) => `<span class="et-sys">${ACC}<span class="et-sys-l">${l.map(x => `<span>${x}</span>`).join('')}</span></span>`;
  // racine carrée écrite avec sa barre : le signe (SVG étiré) prend la hauteur du contenu (une fraction
  // comprise) et rejoint la barre posée juste au-dessus du contenu (même dessin que energie-cinetique)
  const rac = x => '<span class="racine"><span class="racine-signe"><span class="racine-lu">√</span>' +
    '<svg viewBox="0 0 10 100" preserveAspectRatio="none" aria-hidden="true"><path d="M0,62 L2.6,55 L5.6,99 L10,0" vector-effect="non-scaling-stroke"/></svg></span>' +
    `<span class="racine-sous">${x}</span></span>`;

  /* ---------- rédaction des résolutions (cours, fiches, corrections) ---------- */
  // seconde loi de Newton, toujours la même phrase : newton('la balle', 'm g⃗', 'g⃗', ['a<sub>x</sub>(t) = 0', 'a<sub>y</sub>(t) = −g'])
  const newton = (systeme, forces, a, proj) => `Dans le référentiel terrestre supposé galiléen, pour ${systeme} de masse constante, d'après la seconde loi de Newton, <span class="et-nobr">m ${V('a')} = Σ ${V('F', 'ext')}</span>` +
    (forces ? ` = ${forces}` : '') + (a ? ` donc ${V('a')} = ${a}` : '') + (proj ? `, soit en projetant sur les axes : ${sys(...proj)}` : '.');
  // une intégration rédigée comme dans la correction de l'exercice 1 : primitives, « avec, à t = 0, » constantes, « soit » résultat
  // quoi : 'v' (on intègre l'accélération) ou 'p' (on intègre la vitesse)
  const integ = (quoi, prim, cst, res) => `<div class="et-integ"><p>En intégrant ${quoi === 'v' ? 'l\'accélération, on obtient la vitesse' : 'la vitesse, on obtient la position'} :</p>` +
    `<div class="et-integ-l">${S1(prim)}<span class="et-integ-m">avec, à t = 0,</span>${S1(cst)}<span class="et-integ-m">soit</span>${S1(res)}</div></div>`;
  const S1 = l => (l.length > 1 ? sys(...l) : `<span>${l[0]}</span>`);   // une seule coordonnée : pas d'accolade
  // conditions initiales, à placer à côté du schéma : ci({ v: ['v<sub>0</sub> cos α', 'v<sub>0</sub> sin α'], p: ['0', 'h'], ax: ['x', 'y'], vNom })
  const ci = o => {
    const ax = o.ax || ['x', 'y'], nul = o.v.every(x => x === '0');
    if (ax.length === 1) return `<div class="et-ci"><p class="et-ci-t">Conditions initiales (t = 0)</p><p>v<sub>${ax[0]}</sub>(0) = ${o.v[0]}</p><p>${ax[0]}(0) = ${o.p[0]}</p></div>`;
    return `<div class="et-ci"><p class="et-ci-t">Conditions initiales (t = 0)</p>` +
      `<p>${V('v')}(0) = ${nul ? V('0') : (o.vNom || V('v', '0'))} ${col(`v<sub>${ax[0]}</sub>(0) = ${o.v[0]}`, `v<sub>${ax[1]}</sub>(0) = ${o.v[1]}`)}</p>` +
      `<p>${V('OM')}(0) ${col(`${ax[0]}(0) = ${o.p[0]}`, `${ax[1]}(0) = ${o.p[1]}`)}</p></div>`;
  };
  // schéma de la situation et conditions initiales côte à côte
  const figCI = (fig, c) => `<div class="et-fig-ci">${fig}${c}</div>`;
  // une étape de la méthode de résolution, numérotée (n de 1 à 6)
  const etapeM = (n, titre, html) => `<div class="et-me"><span class="et-me-n">${n}</span><p class="et-me-t">${titre}</p><div class="et-me-c">${html}</div></div>`;
  // étape 6 : le point du schéma et sa traduction dans une équation établie
  const trad = (lieu, eq) => `<p class="et-trad"><span class="et-trad-l">${lieu}</span><span class="et-trad-f" aria-hidden="true">→</span><span class="et-trad-e">${eq}</span></p>`;
  // aide (indice) de l'étape 6, dans les questions et les exercices
  const aide6 = (lieu, eq) => `Regarde sur le schéma où se trouve ${lieu}, puis traduis-le dans l'une des équations établies (vitesse ou position) : ${eq}.`;
  const MS = 'm·s<sup>−1</sup>', MS2 = 'm·s<sup>−2</sup>', VM = 'V·m<sup>−1</sup>';
  // constantes (valeurs du cours et des exercices)
  const E_CH = 1.60e-19, M_P = 1.67e-27, M_E = 9.11e-31;

  /* ============================================================
     PETITES FIGURES SVG
     ============================================================ */
  const ENCRE = '#16181d', ENCRE2 = '#55585f', ENCRE3 = '#8d8f94';
  // énergies : E_c orange, E_pp bleu pétrole, E_m violet (accent), énergie perdue par frottements ocre
  const COUL = { v: '#c2570c', a: '#2952c8', E: '#0e7490', F: '#b0177f', traj: '#5a3fc4', grille: '#dcd7e8', Ec: '#c2570c', Epp: '#0e7490', Em: '#5a3fc4', perte: '#8a6a00' };
  const f1 = v => (Math.round(v * 10) / 10).toString();
  const POLICE = 'Hanken Grotesk, Arial, sans-serif';
  // flèche de (x1, y1) à (x2, y2) ; o.ep (épaisseur), o.lt (longueur de la pointe), o.tirets
  function fl(x1, y1, x2, y2, coul, o) {
    o = o || {};
    const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy);
    if (L < 1) return '';
    const ux = dx / L, uy = dy / L, lt = Math.min(o.lt || 10, L * .6), lw = lt * .45, bx = x2 - ux * lt, by = y2 - uy * lt;
    return `<line x1="${f1(x1)}" y1="${f1(y1)}" x2="${f1(bx + ux)}" y2="${f1(by + uy)}" stroke="${coul || ENCRE}" stroke-width="${o.ep || 2.2}" stroke-linecap="round"${o.tirets ? ' stroke-dasharray="5 4"' : ''}/>` +
      `<path d="M${f1(x2)},${f1(y2)} L${f1(bx - uy * lw)},${f1(by + ux * lw)} L${f1(bx + uy * lw)},${f1(by - ux * lw)} Z" fill="${coul || ENCRE}"/>`;
  }
  // nom d'un vecteur centré en x : lettre, indice, petite flèche au-dessus de la lettre
  function nom(x, y, n, s, coul, o) {
    o = o || {};
    const t = o.t || 14, wl = n.length * t * .62, ws = s ? s.length * t * .45 : 0, x0 = x - (wl + ws) / 2, c = coul || ENCRE;
    return `<g fill="${c}" stroke="none"><text x="${f1(x0)}" y="${f1(y)}" font-size="${t}" font-weight="800" font-family="${POLICE}">${n}${s ? `<tspan dy="${f1(t * .3)}" font-size="${f1(t * .68)}">${s}</tspan>` : ''}</text>` +
      `<path d="M${f1(x0 + 1)},${f1(y - t * .9)} h${f1(wl)} m-3,-2.5 l3,2.5 l-3,2.5" fill="none" stroke="${c}" stroke-width="1.2"/></g>`;
  }
  const txt = (x, y, t, o) => { o = o || {}; return `<text x="${f1(x)}" y="${f1(y)}" font-size="${o.t || 12}" font-weight="${o.g || 600}" fill="${o.c || ENCRE2}" text-anchor="${o.a || 'start'}" font-family="${POLICE}">${t}</text>`; };
  const svg = (w, h, contenu, aria, cls) => `<div class="et-fig-cadre"><svg viewBox="0 0 ${w} ${h}" class="et-figure${cls ? ' ' + cls : ''}" style="max-width:${Math.round(w * 1.3)}px" role="img" aria-label="${aria}">${contenu}</svg></div>`;

  /* ---------- Condensateur plan horizontal ----------
     o = { haut: '+' ou '−' (signe de l'armature du haut), E (true : flèches de E⃗), U (true : flèche de U),
           q: 1 | −1 | 0 (particule entrant en O), ang (angle de v⃗₀, degrés), traj (true), a (true : a⃗ ou F⃗ dessinée),
           nomA, nomB (noms des armatures), axes (repère x, z d'origine O), W, H, aria } */
  function condo(o) {
    o = Object.assign({ haut: '+', E: true, U: true, q: 0, ang: 0, traj: true, W: 340, H: 170 }, o);
    const yh = 28, yb = o.H - 28, x0 = 40, x1 = o.W - 50, ym = (yh + yb) / 2, haut = o.haut === '+';
    let c = '';
    [[yh, haut ? '+' : '−'], [yb, haut ? '−' : '+']].forEach(([y, sg]) => {
      c += `<rect x="${x0}" y="${y - 3}" width="${x1 - x0}" height="6" rx="2" fill="#ebe8e1" stroke="${ENCRE2}" stroke-width="1.2"/>`;
      for (let x = x0 + 22; x < x1; x += 52) c += txt(x, y < ym ? y - 8 : y + 18, sg, { g: 800, c: ENCRE, t: 15, a: 'middle' });
    });
    if (o.nomA) c += txt(x1 + 6, yh + 4, o.nomA, { g: 700, c: ENCRE2, t: 11 });
    if (o.nomB) c += txt(x1 + 6, yb + 4, o.nomB, { g: 700, c: ENCRE2, t: 11 });
    // champ : de l'armature + vers l'armature −
    if (o.E) {
      const xe = x1 - 34, d = haut ? 1 : -1;
      c += fl(xe, ym - 30 * d, xe, ym + 30 * d, COUL.E, { ep: 2.2 }) + nom(xe + 14, ym + 4, 'E', '', COUL.E, { t: 14 });
    }
    // tension : la flèche de U pointe vers la borne +
    if (o.U) {
      const xu = o.W - 20, d = haut ? -1 : 1;
      c += fl(xu, ym - (yb - yh) / 2 * d + 4 * d, xu, ym + (yb - yh) / 2 * d - 4 * d, ENCRE, { ep: 1.6, lt: 8 }) + txt(xu + 6, ym + 4, 'U', { g: 800, c: ENCRE, t: 13 });
    }
    // particule entrant en O, vecteur vitesse initiale, trajectoire parabolique
    // repère (o.axes) : axe x parallèle aux armatures, axe z vers le haut, origine O au point d'entrée
    if (o.axes) c += fl(x0, ym, x1 + 36, ym, ENCRE3, { ep: 1.1, lt: 7 }) + txt(x1 + 34, ym + 14, 'x', { g: 800, c: ENCRE, t: 12, a: 'end' }) +
      fl(x0, ym, x0, yh + 10, ENCRE3, { ep: 1.1, lt: 7 }) + txt(x0 - 6, yh + 20, 'z', { g: 800, c: ENCRE, t: 12, a: 'end' });
    if (o.q) {
      c += txt(x0 - 6, ym + 4, 'O', { g: 800, c: ENCRE, t: 12, a: 'end' });
      const ar = o.ang * Math.PI / 180, bas = (o.q > 0) === haut;           // accélération vers le bas ?
      if (o.traj) {
        const k = 46 / Math.pow(x1 - x0 - 30, 2) * (o.ang ? 2.6 : 1);
        let d = `M${x0},${ym}`, x = 0, y = ym, touche = false;
        const Lp = x1 - x0, zx = X => ym - Math.tan(ar) * X + (bas ? 1 : -1) * k * X * X;
        for (x = 3; x <= Lp; x += 3) {
          y = zx(x);
          if (y < yh + 4 || y > yb - 4) { y = Math.max(yh + 4, Math.min(yb - 4, y)); d += `L${f1(x0 + x)},${f1(y)}`; touche = true; break; }
          d += `L${f1(x0 + x)},${f1(y)}`;
        }
        // sortie : mouvement rectiligne uniforme (tangente au point de sortie)
        if (!touche) { const pente = -Math.tan(ar) + (bas ? 2 : -2) * k * Lp; d += `L${f1(x1 + 18)},${f1(zx(Lp) + pente * 18)}`; }
        c += `<path d="${d}" fill="none" stroke="${COUL.traj}" stroke-width="2.2" stroke-dasharray="6 4"/>`;
      }
      c += `<circle cx="${x0}" cy="${ym}" r="5" fill="${o.q > 0 ? '#fff' : ENCRE}" stroke="${ENCRE}" stroke-width="1.6"/>` + txt(x0, ym + 3.5, o.q > 0 ? '+' : '−', { g: 800, c: o.q > 0 ? ENCRE : '#fff', t: 9, a: 'middle' });
      c += fl(x0 + 6 * Math.cos(ar), ym - 6 * Math.sin(ar), x0 + 48 * Math.cos(ar), ym - 48 * Math.sin(ar), COUL.v, { ep: 2.2 }) + nom(x0 + 48 * Math.cos(ar) + 6, ym - 48 * Math.sin(ar) - 6, 'v', '0', COUL.v, { t: 13 });
      if (o.a) c += fl(x0 + 70, ym, x0 + 70, ym + (bas ? 34 : -34), COUL.F, { ep: 2.2 }) + nom(x0 + 84, ym + (bas ? 28 : -18), o.a === 'F' ? 'F' : 'a', '', COUL.F, { t: 13 });
    }
    return svg(o.W, o.H, c, o.aria || `Condensateur plan : armature du haut chargée ${haut ? 'positivement' : 'négativement'} ; le champ électrique va de l'armature positive vers l'armature négative ; la flèche de la tension U pointe vers l'armature positive`, 'et-fig-condo');
  }

  /* ---------- Graphique de fonctions du temps ----------
     o = { tmax, ymin, ymax, pasT, pasY, series: [{ f, coul, nom }], nomX ('t (s)'), nomY, W, H, aria, points: [[t, y, texte]] } */
  function courbes(o) {
    o = Object.assign({ W: 320, H: 180, nomX: 't (s)', nomY: '' }, o);
    const g = 40, d = 26, h = 22, b = 26;
    const X = t => g + t / o.tmax * (o.W - g - d), Y = y => h + (o.ymax - y) / (o.ymax - o.ymin) * (o.H - h - b);
    let c = '';
    for (let t = 0; t <= o.tmax + 1e-9; t += o.pasT) c += `<line x1="${f1(X(t))}" y1="${f1(Y(o.ymin))}" x2="${f1(X(t))}" y2="${f1(Y(o.ymax))}" stroke="${COUL.grille}" stroke-dasharray="3 3"/>` + txt(X(t), Y(Math.max(o.ymin, 0)) + 14, fmt(+t.toFixed(6)), { t: 10, a: 'middle' });
    for (let y = Math.ceil(o.ymin / o.pasY) * o.pasY; y <= o.ymax + 1e-9; y += o.pasY) c += `<line x1="${f1(X(0))}" y1="${f1(Y(y))}" x2="${f1(X(o.tmax))}" y2="${f1(Y(y))}" stroke="${COUL.grille}" stroke-dasharray="3 3"/>` + (Math.abs(y) > 1e-9 ? txt(X(0) - 5, Y(y) + 4, fmt(+y.toFixed(6)), { t: 10, a: 'end' }) : '');
    c += fl(X(0), Y(Math.max(o.ymin, 0)), o.W - 8, Y(Math.max(o.ymin, 0)), ENCRE, { ep: 1.3, lt: 7 }) + fl(X(0), Y(o.ymin), X(0), 6, ENCRE, { ep: 1.3, lt: 7 });
    c += txt(o.W - 8, Y(Math.max(o.ymin, 0)) - 6, o.nomX, { g: 700, c: ENCRE, t: 11, a: 'end' }) + txt(X(0) + 6, 13, o.nomY, { g: 700, c: ENCRE, t: 11 });
    o.series.forEach(s => {
      let p = '';
      for (let k = 0; k <= 80; k++) { const t = o.tmax * k / 80, y = s.f(t); if (y < o.ymin - 1e-9 || y > o.ymax + 1e-9) continue; p += `${p ? 'L' : 'M'}${f1(X(t))},${f1(Y(y))}`; }
      c += `<path d="${p}" fill="none" stroke="${s.coul || COUL.traj}" stroke-width="2.4"/>`;
      if (s.nom) { const t = s.tNom == null ? o.tmax * .72 : s.tNom; c += txt(X(t) + 4, Y(s.f(t)) - 7, s.nom, { g: 800, c: s.coul || COUL.traj, t: 11 }); }
    });
    (o.points || []).forEach(([t, y, n]) => { c += `<circle cx="${f1(X(t))}" cy="${f1(Y(y))}" r="3.5" fill="${ENCRE}"/>` + (n ? txt(X(t) + 6, Y(y) - 6, n, { g: 700, c: ENCRE, t: 11 }) : ''); });
    return svg(o.W, o.H, c, o.aria || 'Graphique en fonction du temps', 'et-fig-courbe');
  }

  // case vide d'un schéma, où glisser une étiquette (partie 'schema')
  const slot = id => `<span class="sc-slot" data-slot="${id}"><span class="sc-slot-ph">?</span></span>`;
  const o_ = (id, label) => ({ id, label });

  /* ============================================================
     NOMS DES FORCES (HTML et SVG), FLÈCHES
     Mêmes couleurs que dans « Chapitre 6 » : le poids est toujours
     orange, la réaction du support bleue, les frottements roses…
     (attributs de présentation des SVG, comme VEC.C)
     ============================================================ */
  const NOMS = { P: ['P'], RN: ['R', 'N'], R: ['R'], N: ['N'], f: ['f'], Fm: ['F', 'm'], F: ['F'] };
  const nomV = k => V(...NOMS[k]);
  // travail d'une force : W_AB(F⃗)
  const W = (k, d) => `W<sub>${d || 'AB'}</sub>(${nomV(k)})`;
  const COULF = { P: '#d9480f', RN: '#1971c2', R: '#1971c2', N: '#1971c2', f: '#c2255c', Fm: '#b35c00', F: '#b35c00', port: '#5c940d' };

  // flèche d'origine (x, y), d'angle ang (degrés, 0 vers la droite, 90 vers le haut), de longueur L
  function fleche(x, y, ang, L, coul, cls) {
    const r = ang * Math.PI / 180, c = Math.cos(r), s = -Math.sin(r);
    const x2 = x + L * c, y2 = y + L * s, bx = x2 - 11 * c, by = y2 - 11 * s;
    return { svg: `<g class="et-f${cls ? ' ' + cls : ''}"${coul ? ` style="color:${coul}"` : ''}><line x1="${f1(x)}" y1="${f1(y)}" x2="${f1(bx)}" y2="${f1(by)}"/><path d="M${f1(x2)},${f1(y2)} L${f1(bx - 5.5 * s)},${f1(by + 5.5 * c)} L${f1(bx + 5.5 * s)},${f1(by - 5.5 * c)} Z"/></g>`, x2, y2, c, s };
  }
  // nom d'une force en SVG (lettre, indice, petite flèche au-dessus) ; x : centre, y : ligne de base
  function nomSVG(k, x, y, coul) {
    const [p, s] = NOMS[k] || [k];
    const wp = p.length * 9.5, ws = s ? s.length * 6.6 : 0, x0 = x - (wp + ws) / 2;
    const ya = y - 15, x2 = x0 + Math.max(wp, 9) + 1;
    return `<g class="et-nom"${coul ? ` style="color:${coul}"` : ''}><text x="${f1(x0)}" y="${f1(y)}">${p}${s ? `<tspan dy="4" font-size="10.5">${s}</tspan>` : ''}</text>` +
      `<path d="M${f1(x0 + 1)},${f1(ya)} H${f1(x2)} M${f1(x2 - 3)},${f1(ya - 2.6)} L${f1(x2)},${f1(ya)} L${f1(x2 - 3)},${f1(ya + 2.6)}"/></g>`;
  }
  // force et son nom, au-delà de la pointe
  function force(k, x, y, ang, L) {
    const a = fleche(x, y, ang, L, COULF[k]);
    const lx = a.x2 + a.c * 14 + (Math.abs(a.c) < .2 ? 13 : 0), ly = a.y2 + a.s * 14 + (Math.abs(a.s) < .2 ? -2 : 6);
    return a.svg + nomSVG(k, lx, ly, COULF[k]);
  }

  /* ============================================================
     SCHÉMA DU THÉORÈME DE L'ÉNERGIE CINÉTIQUE
     ET.schemaMvt(o, vals)
       o = { sens: 'droite' (déplacement horizontal de A vers B) | 'bas' (chute de A vers B)
                   | 'haut' (lancer vers le haut, de A jusqu'au sommet B),
             objet: 'voiture' | 'camion' | 'pierre' | 'bloc' | 'pomme' | 'balle',
             forces: ['P', 'RN', 'f', 'Fm'] (clés de NOMS), d: 'AB' | 'h' | 'ℓ' (nom de la distance),
             angles: true (angles α marqués : schéma d'un exemple traité), aria }
       vals = { m, vA, vB, d } : HTML de chaque case ; '#clé' → case vide (ET.slot), '?' → grandeur cherchée
     Déplacement horizontal : les données au-dessus du dessin (A à gauche, B à droite),
     la distance en dessous. Déplacement vertical : les données à droite du dessin.
     ============================================================ */
  const DESC_F = {
    P: 'le poids, vertical vers le bas', RN: 'la réaction normale du support, perpendiculaire au support',
    R: 'la réaction de la route, perpendiculaire à la route', N: 'la réaction de la glace, perpendiculaire à la glace',
    f: 'les frottements, opposés au mouvement', Fm: 'la force motrice, vers l\'avant',
  };
  const nomD = o => o.d || (o.sens === 'droite' ? 'AB' : 'h');
  // angle entre la force k et le déplacement
  function angleDe(o, k) {
    if (o.sens === 'droite') return k === 'f' ? 180 : k === 'Fm' ? 0 : 90;
    return k === 'P' ? (o.sens === 'bas' ? 0 : 180) : 90;
  }
  // l'objet dessiné, posé en x sur le sol (déplacement horizontal) ; renvoie le dessin et son centre G
  function objetH(type, x, sol) {
    if (type === 'voiture') return { G: [x, sol - 19], svg: `<g class="et-sc-sys"><path d="M${x - 31},${sol - 8} v-12 q0,-5 5,-5 h11 l9,-10 h19 l10,10 h8 q4,0 4,5 v12 Z"/>` +
      `<path class="et-sc-vitre" d="M${x - 12},${sol - 26} l7,-7 h7 v7 Z M${x + 5},${sol - 26} v-7 h8 l7,7 Z"/></g>` +
      `<circle cx="${x - 18}" cy="${sol - 6}" r="6" class="et-sc-roue"/><circle cx="${x + 18}" cy="${sol - 6}" r="6" class="et-sc-roue"/>` };
    if (type === 'camion') return { G: [x, sol - 21], svg: `<g class="et-sc-sys"><rect x="${x - 40}" y="${sol - 38}" width="56" height="30" rx="2"/><path d="M${x + 19},${sol - 8} v-22 h12 l9,10 v12 Z"/>` +
      `<path class="et-sc-vitre" d="M${x + 23},${sol - 27} h7 l6,7 h-13 Z"/></g>` +
      `<circle cx="${x - 30}" cy="${sol - 6}" r="6" class="et-sc-roue"/><circle cx="${x - 16}" cy="${sol - 6}" r="6" class="et-sc-roue"/><circle cx="${x + 30}" cy="${sol - 6}" r="6" class="et-sc-roue"/>` };
    if (type === 'pierre') return { G: [x, sol - 11], svg: `<path class="et-sc-sys" d="M${x - 22},${sol} h44 q4,0 4,-5 v-8 q0,-7 -7,-7 h-38 q-7,0 -7,7 v8 q0,5 4,5 Z"/>` +
      `<path class="et-sc-anse" d="M${x - 8},${sol - 20} v-6 h20"/>` };
    return { G: [x, sol - 15], svg: `<rect x="${x - 26}" y="${sol - 30}" width="52" height="30" rx="3" class="et-sc-sys"/>` };
  }
  // une ligne de données « nom = valeur »
  function ligneDonnee(nom, v) {
    if (v == null) return '';
    const h = String(v)[0] === '#' ? slot(String(v).slice(1)) : v === '?' ? '<span class="sc-val inconnue">?</span>' : `<span class="sc-val">${v}</span>`;
    return `<div class="sc-ligne"><span class="sc-nom">${nom} =</span>${h}</div>`;
  }
  function schemaMvt(o, vals) {
    vals = vals || {};
    const fs = o.forces || ['P'], d = nomD(o), vides = Object.keys(vals).some(k => String(vals[k])[0] === '#');
    const role = vides ? 'role="group"' : 'role="img"';
    const aria = o.aria || `Schéma : le système va de A à B ; forces ${fs.map(k => DESC_F[k]).join(', ')}`;
    let g = '';
    if (o.sens === 'droite') {
      // sol, A et B, déplacement de A vers B ; le système en A et ses forces
      const sol = 112, xA = 90, xB = 270, ob = objetH(o.objet, xA, sol), [gx, gy] = ob.G;
      g += `<line x1="14" y1="${sol}" x2="346" y2="${sol}" class="et-sc-sol"/>`;
      g += `<line x1="${xA}" y1="${sol}" x2="${xB - 10}" y2="${sol}" class="et-sc-dep"/><path d="M${xB},${sol} l-11,-5 v10 Z" class="et-sc-dep-p"/>`;
      g += `<text x="${(xA + xB) / 2 + 24}" y="${sol + 18}" text-anchor="middle" class="et-sc-txt">déplacement</text>`;
      // A et B sous le sol, un peu à gauche de leur repère (le nom du poids s'écrit à droite de sa flèche)
      [[xA, 'A'], [xB, 'B']].forEach(([x, n]) => { g += `<line x1="${x}" y1="${sol - 5}" x2="${x}" y2="${sol + 5}" class="et-sc-marque"/><text x="${x - 12}" y="${sol + 20}" text-anchor="middle" class="et-sc-pt">${n}</text>`; });
      g += ob.svg;
      if (o.angles) {
        // direction du déplacement (référence des angles), puis arcs : 180° pour f⃗, angle droit pour les forces verticales
        g += `<line x1="${gx}" y1="${gy}" x2="${gx + 54}" y2="${gy}" class="et-sc-ref"/>`;
        if (fs.includes('f')) g += `<path d="M${gx + 15},${gy} A15,15 0 0 0 ${gx - 15},${gy}" class="et-sc-arc"/><text x="${gx - 16}" y="${gy - 30}" text-anchor="end" class="et-sc-alpha">α = 180°</text>`;
        if (fs.some(k => ['P', 'RN', 'R', 'N'].includes(k))) g += `<path d="M${gx + 8},${gy} v-8 h-8" class="et-sc-arc"/>`;
      }
      const ANG = { P: 270, RN: 90, R: 90, N: 90, f: 180, Fm: 0 };
      fs.forEach(k => { g += force(k, gx, gy, ANG[k], ['f', 'Fm'].includes(k) ? 52 : k === 'P' ? 36 : 42); });
      if (o.angles && fs.includes('Fm')) g += `<text x="${gx + 36}" y="${gy - 10}" text-anchor="middle" class="et-sc-alpha">α = 0°</text>`;
      return `<div class="et-sch et-sch-h" ${role} aria-label="${aria}">
        <div class="et-sch-haut"><div class="et-sch-col"><p class="et-sch-pt">A : départ</p>${ligneDonnee('m', vals.m)}${ligneDonnee('v<sub>A</sub>', vals.vA)}</div>
          <div class="et-sch-col"><p class="et-sch-pt">B : arrivée</p>${ligneDonnee('v<sub>B</sub>', vals.vB)}</div></div>
        <svg viewBox="0 0 360 148" class="et-sc" aria-hidden="true">${g}</svg>
        <div class="et-sch-bas">${ligneDonnee(d, vals.d)}</div></div>`;
    }
    // déplacement vertical : chute (A en haut) ou lancer vers le haut (A en bas, B au sommet)
    const bas = o.sens === 'bas', yH = 30, yB = bas ? 204 : 182, yA = bas ? yH : yB, yBpt = bas ? yB : yH, x = 82;
    g += `<line x1="${x}" y1="${yA}" x2="${x}" y2="${yBpt + (bas ? -10 : 10)}" class="et-sc-dep"/><path d="M${x},${yBpt} l-5,${bas ? -11 : 11} h10 Z" class="et-sc-dep-p"/>`;
    g += `<line x1="22" y1="${yH}" x2="22" y2="${yB}" class="et-sc-cote"/><path d="M22,${yH} l-4,8 h8 Z M22,${yB} l-4,-8 h8 Z" class="et-sc-cote-p"/>`;
    g += `<text x="30" y="${(yH + yB) / 2 + 4}" class="et-sc-pt">${d}</text>`;
    if (bas) g += `<line x1="40" y1="${yB}" x2="140" y2="${yB}" class="et-sc-sol"/>`;
    // noms des points à gauche de la trajectoire (au-dessus du sol pour B dans une chute)
    [[yA, 'A'], [yBpt, 'B']].forEach(([y, n]) => { g += `<line x1="${x - 5}" y1="${y}" x2="${x + 5}" y2="${y}" class="et-sc-marque"/><text x="${x - 20}" y="${y + (bas && n === 'B' ? -6 : 5)}" text-anchor="middle" class="et-sc-pt">${n}</text>`; });
    g += o.objet === 'pomme'
      ? `<circle cx="${x}" cy="${yA}" r="10" class="et-sc-sys"/><path d="M${x},${yA - 10} q2,-6 7,-7" class="et-sc-anse"/>`
      : `<circle cx="${x}" cy="${yA}" r="9" class="et-sc-sys"/>`;
    g += force('P', x, yA, 270, 46);
    if (o.angles) g += `<text x="${x + 14}" y="${yA + 38}" class="et-sc-alpha">α = ${bas ? 0 : 180}°</text>`;
    const haut = bas ? ['A : départ', 'v<sub>A</sub>', vals.vA] : ['B : sommet (arrivée)', 'v<sub>B</sub>', vals.vB];
    const dessous = bas ? ['B : arrivée', 'v<sub>B</sub>', vals.vB] : ['A : départ', 'v<sub>A</sub>', vals.vA];
    return `<div class="et-sch et-sch-v" ${role} aria-label="${aria}">
      <svg viewBox="0 0 150 244" class="et-sc" aria-hidden="true">${g}</svg>
      <div class="et-sch-droite">
        <div class="et-sch-col"><p class="et-sch-pt">${haut[0]}</p>${ligneDonnee(haut[1], haut[2])}</div>
        <div class="et-sch-col">${ligneDonnee('m', vals.m)}${ligneDonnee(d, vals.d)}</div>
        <div class="et-sch-col"><p class="et-sch-pt">${dessous[0]}</p>${ligneDonnee(dessous[1], dessous[2])}</div>
      </div></div>`;
  }

  // Placer les données de l'énoncé sur le schéma
  // d = { m, vA, vB, d } : texte de chaque étiquette ('?' : grandeur cherchée) ; opts = { q, intrus: [{ label, indice }], solution }
  function partieDonnees(o, d, opts) {
    opts = opts || {};
    const nd = nomD(o);
    const IND = {
      m: 'La masse est celle du système : en kg (ou en g, à convertir).',
      vA: 'v<sub>A</sub> est la vitesse au <b>départ</b>, en A. « Lâchée », « démarre » : v<sub>A</sub> = 0.',
      vB: 'v<sub>B</sub> est la vitesse à l\'<b>arrivée</b>, en B. « S\'arrête », « s\'immobilise », « au sommet » : v<sub>B</sub> = 0.',
      d: `${nd} est la ${nd === 'h' ? 'hauteur' : 'distance'} parcourue entre A et B, en mètres.`,
    };
    const cles = ['m', 'vA', 'vB', 'd'].filter(k => d[k] != null);
    const etiquettes = cles.map(k => ({ id: k, label: d[k] === '?' ? '?<span class="et-replique"> (on la cherche)</span>' : d[k], cible: k,
      indice: d[k] === '?' ? 'Le « ? » se place sur la grandeur que l\'on cherche.' : IND[k] }))
      .concat((opts.intrus || []).map((x, i) => ({ id: 'intrus' + i, label: x.label, cible: null, indice: x.indice })));
    const vals = {};
    cles.forEach(k => { vals[k] = '#' + k; });
    return { type: 'schema', q: opts.q || 'Fais le schéma : place les données de l\'énoncé (le « ? » sur la grandeur que l\'on cherche).',
      titrePalette: 'Données de l\'énoncé', schema: schemaMvt(o, vals), etiquettes, solution: opts.solution, correction: opts.correction };
  }

  // expression du travail de la force k (« 0 car ⊥ », « f × AB × (−1) »)
  function exprTravail(o, k) {
    const d = nomD(o), a = angleDe(o, k), w = W(k);
    if (a === 90) return `${w} = 0 car ${nomV(k)} ⊥ au déplacement`;
    if (k === 'P') return a === 0 ? `${w} = P × ${d} × cos 0° = m × g × ${d}` : `${w} = P × ${d} × cos 180° = −m × g × ${d}`;
    const F = k === 'Fm' ? 'F<sub>m</sub>' : k;
    return a === 0 ? `${w} = ${F} × ${d} × cos 0° = ${F} × ${d} × 1` : `${w} = ${F} × ${d} × cos 180° = ${F} × ${d} × (−1)`;
  }
  // Angle α de chaque force avec le déplacement, puis l'expression de chaque travail
  function partieAngles(o, opts) {
    opts = opts || {};
    const vertical = o.sens !== 'droite';
    const lignes = (o.forces || ['P']).map(k => {
      const bon = angleDe(o, k), ind = {};
      [0, 90, 180].filter(a => a !== bon).forEach(a => {
        ind[a] = k === 'f' ? 'Les frottements s\'opposent au mouvement : <span class="vet-nom">f</span> est dans le sens <b>contraire</b> du déplacement (α = 180°).'
          : k === 'Fm' ? 'La force motrice fait avancer le système : elle est dans le <b>même sens</b> que le déplacement (α = 0°).'
          : k === 'P' && vertical ? (a === 90 ? 'Le déplacement est vertical, comme le poids : ils ne sont pas perpendiculaires.'
            : bon === 0 ? 'Le système descend et le poids est dirigé vers le bas : <b>même sens</b> (α = 0°).' : 'Le système monte et le poids est dirigé vers le bas : sens <b>contraires</b> (α = 180°).')
          : k === 'P' ? 'Le poids est vertical et le déplacement horizontal : ils sont <b>perpendiculaires</b> (α = 90°).'
          : 'La réaction est perpendiculaire au support, donc au déplacement (α = 90°).';
      });
      return { id: k, label: `${nomV(k)} <span class="et-grille-desc">${DESC_F[k]}</span>`, bonne: String(bon), indices: ind, apres: `<p class="et-expr">${exprTravail(o, k)}</p>` };
    });
    return { type: 'grille', q: opts.q || 'Pour chaque force, choisis l\'angle α entre la force et le déplacement A → B.',
      options: [o_('0', 'α = 0°'), o_('90', 'α = 90°'), o_('180', 'α = 180°')], lignes,
      solution: opts.solution || '<p>Une force perpendiculaire au déplacement ne travaille pas : W = 0, sans calcul. Pour α = 180°, cos α = −1.</p>',
      correction: opts.correction };
  }
  // Choisir le théorème écrit pour la situation (avec les travaux remplacés)
  function membreDroit(o, variante) {
    const d = nomD(o), fs = o.forces || ['P'];
    const sansF = !fs.includes('f');
    const t = fs.map(k => {
      if (o.sens !== 'droite') {
        if (variante === 'perp') return 'm × g';
        const pos = o.sens === 'bas' ? variante !== 'signe' : variante === 'signe';
        return pos ? `m × g × ${d}` : `−m × g × ${d}`;
      }
      if (k === 'f') return variante === 'signe' ? `f × ${d}` : `f × ${d} × (−1)`;
      if (k === 'Fm') return variante === 'signe' && sansF ? `F<sub>m</sub> × ${d} × (−1)` : `F<sub>m</sub> × ${d} × 1`;
      if (k === 'P' && variante === 'perp') return `m × g × ${d}`;
      return '0';
    });
    return t.join(' + ').replace(/\+ −/g, '− ');
  }
  function partieEquation(o, opts) {
    opts = opts || {};
    const G = '½ m v<sub>B</sub><sup>2</sup> − ½ m v<sub>A</sub><sup>2</sup>', Ginv = '½ m v<sub>A</sub><sup>2</sup> − ½ m v<sub>B</sub><sup>2</sup>';
    const vertical = o.sens !== 'droite';
    return { type: 'choix', colonne: true, q: opts.q || 'Écris le théorème de l\'énergie cinétique pour cette situation : quelle égalité est juste ?',
      options: [o_('ok', `${G} = ${membreDroit(o)}`), o_('inv', `${Ginv} = ${membreDroit(o)}`), o_('signe', `${G} = ${membreDroit(o, 'signe')}`), o_('perp', `${G} = ${membreDroit(o, 'perp')}`)],
      bonne: 'ok',
      indices: {
        inv: 'ΔE<sub>c</sub> = E<sub>c</sub>(B) − E<sub>c</sub>(A) : l\'état <b>final</b> moins l\'état <b>initial</b>.',
        signe: vertical ? 'Regarde l\'angle entre le poids et le déplacement : même sens, W = m g h ; sens contraires, W = −m g h.' : 'Pour α = 180°, cos α = −1 : le travail des frottements est <b>négatif</b>.',
        perp: vertical ? 'Le travail du poids est P × h = m × g × h : il faut multiplier par la hauteur.' : 'Le poids est perpendiculaire au déplacement : son travail est <b>nul</b>.',
      },
      solution: opts.solution, correction: opts.correction };
  }



  /* ============================================================
     PLAN DE L'APPLICATION ET NAVIGATION (voir assets/sommaire.js)
     ============================================================ */
  const PLAN = [
    { n: 1, titre: 'Travail d\'une force', desc: 'À savoir faire : calculer W<sub>AB</sub>(<span class="vec-nom">F</span>) = F × AB × cos α (angle en degrés), dire si le travail est moteur, résistant ou nul, et utiliser le travail du poids (m g h) et celui d\'une force électrique (q U)', fiche: 'fiche_1',
      // le simulateur (application « Travail d'une force », page externe ↗) en tête, cinq sous-modules de cours, puis les questions et la fiche
      sousModules: true,
      parties: [
        { nom: 'Simulateur', externe: { app: 'travail-force', page: 'index', nom: 'Simulateur : travail d\'une force', appNom: 'Travail d\'une force' } },
        { nom: 'Définition et formule', slug: 'formule', cours: 'module_1a_cours', noms: { cours: 'Cours : définition et formule' } },
        { nom: 'Travail moteur, résistant ou nul', slug: 'signe', cours: 'module_1b_cours', noms: { cours: 'Cours : travail moteur, résistant ou nul' } },
        { nom: 'Travail du poids', slug: 'poids', cours: 'module_1c_cours', noms: { cours: 'Cours : travail du poids' } },
        { nom: 'Travail d\'une force électrique', slug: 'electrique', cours: 'module_1d_cours', noms: { cours: 'Cours : travail d\'une force électrique' } },
        { nom: 'Force perpendiculaire au mouvement', slug: 'perpendiculaire', cours: 'module_1e_cours', noms: { cours: 'Cours : force perpendiculaire au mouvement' } },
        { nom: 'Travail d\'une force', questions: 'module_1_questions' }] },
    { n: 2, titre: 'Théorème de l\'énergie cinétique', desc: 'E<sub>c</sub> = ½ m v², Δ<sub>AB</sub>E<sub>c</sub> = ΣW<sub>AB</sub>, méthode avec schéma : chute, lancer vers le haut, distance d\'arrêt, accélérateur linéaire', fiche: 'fiche_2',
      sousModules: true,
      parties: [
        { nom: 'Énergie cinétique', slug: 'energie-cinetique', cours: 'module_2a_cours', noms: { cours: 'Cours : énergie cinétique' } },
        { nom: 'Énoncé du théorème', slug: 'enonce', cours: 'module_2b_cours', noms: { cours: 'Cours : énoncé du théorème' } },
        { nom: 'Utilisation dans le champ de pesanteur', slug: 'pesanteur', cours: 'module_2c_cours', noms: { cours: 'Cours : utilisation dans le champ de pesanteur' } },
        { nom: 'Accélérateur linéaire', slug: 'accelerateur', cours: 'module_2d_cours', noms: { cours: 'Cours : accélérateur linéaire' } },
        { nom: 'Théorème de l\'énergie cinétique', questions: 'module_2_questions' }] },
    { n: 3, titre: 'Énergie mécanique', desc: 'E<sub>m</sub> = E<sub>c</sub> + E<sub>pp</sub>, E<sub>pp</sub> = m g z, conservation sans frottements, énergie perdue par frottements', fiche: 'fiche_3',
      sousModules: true,
      parties: [
        { nom: 'Énergie potentielle et énergie mécanique', slug: 'energies', cours: 'module_3a_cours', noms: { cours: 'Cours : énergie potentielle et énergie mécanique' } },
        { nom: 'Conservation de l\'énergie mécanique', slug: 'conservation', cours: 'module_3b_cours', noms: { cours: 'Cours : conservation de l\'énergie mécanique' } },
        { nom: 'Frottements', slug: 'frottements', cours: 'module_3c_cours', noms: { cours: 'Cours : frottements et énergie perdue' } },
        { nom: 'Énergie mécanique', simulation: 'module_3_simulation', questions: 'module_3_questions', noms: { simulation: 'Simulateur : énergies d\'un skieur et d\'une balle' } }] },
    { n: 4, titre: 'Exercices', desc: 'Les exercices 1 à 9 de la feuille, guidés pas à pas, dont « Un accélérateur au service de l\'art »', exercices: 'module_4', exNom: 'Exercices 1 à 9', nbEx: 9 },
  ];
  window.SOM.init({ nom: 'Énergie et travail', id: 'energie-travail', cleEx: 'energie-travail-exercices', plan: PLAN });
  const menu = cle => window.SOM.menu(cle);
  const accueil = zone => window.SOM.accueil(zone);

  window.ET = Object.assign(window.ET || {}, {
    MOINS, fmt, cs, sci, lire, proche, fr, unite, o, fq, el, secouer, melanger, hasard, entre, champ, PARTIES, versCours, boutonValider, CALC,
    question, serie, confettis, fig, monter, outil, cap,
    V, NUL, col, sys, rac, newton, integ, ci, figCI, etapeM, trad, aide6, MS, MS2, VM, E_CH, M_P, M_E,
    ENCRE, ENCRE2, ENCRE3, COUL, fl, nom, txt, svg, condo, courbes,
    slot, NOMS, nomV, W, COULF, fleche, nomSVG, force, schemaMvt, partieDonnees, partieAngles, partieEquation, angleDe, exprTravail,
    PLAN, menu, accueil,
  });
})();
