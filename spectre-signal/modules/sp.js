/* ============================================================
   Moteur de l'application « Chapitre 17 : Spectre d'un signal
   périodique » (Terminale STI2D ; même moteur de questions que
   « Cinématique » et « Chapitre 7 : Théorème de l'énergie
   cinétique » ; navigation commune assets/sommaire.js, cours avec
   assets/cours.js ; signal, spectre et simulateur : assets/fourier.js)

   SP.fmt, SP.cs, SP.sci, SP.lire     écriture et lecture des nombres (virgule)
   SP.o, SP.fq.choix, SP.fq.nombre    fabriques d'options et de parties de question
   SP.PARTIES                         parties de question : 'choix', 'nombre', 'gabarit', 'sci',
                                      'grille' (un choix par ligne), 'perso' (p.monter(zone, api) → { montrer() })
   SP.versCours(p)                    une de ces parties dans un cours (assets/cours.js)
   SP.question(zone, q, cb, mode)     question en plusieurs parties (série, exercice, activité)
   SP.serie(opts)                     série de questions notée sur 20
   SP.fig(dessin), SP.outil(monter)   figure dessinée à la largeur disponible, outil placé dans du HTML
   SP.figSignal(spec, o), SP.figSpectre(raies, o)
                                      signal u(t) et spectre (FOURIER.svgSignal / svgSpectre) à la largeur disponible
   SP.COURS_EX                        spectre de l'exemple du cours (f1 = 150 Hz, a0 = 1 000 mV…)
   SP.SPEC, SP.DOCS                   signaux et spectres des exercices (redessinés en SVG)
   SP.partieLireSpectre(o)            outil « lire un spectre » (partie 'perso') : l'élève touche une raie,
                                      écrit sa fréquence et son amplitude, puis son rang
   SP.partieMesure(o)                 outil « mesurer une période » (partie 'perso') : deux curseurs à faire
                                      glisser sur le signal pour encadrer n périodes, choix de n
   SP.spectreAuHasard(o)              spectre tiré au hasard, lisible sur la grille
   SP.partieSimu(o)                   petit simulateur dans une question (partie 'perso') : réussie quand
                                      l'état du simulateur remplit les conditions données
   SP.menu(cle), SP.accueil(zone)     navigation commune (SOM) avec le plan de l'application

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
    const d = el('div', 'ph-valeur sp-gab');
    if (p.label) d.appendChild(el('span', 'ph-lab', p.label));
    // chaque case forme un groupe insécable avec le texte qui la suit (et le texte d'ouverture
    // avec la première case) : sur un petit écran, la ligne ne se coupe qu'entre deux groupes
    const champs = [];
    let grp = el('span', 'sp-gab-grp');
    d.appendChild(grp);
    p.morceaux.forEach(m => {
      if (typeof m === 'string') { grp.appendChild(el('span', 'sp-gab-txt', m)); return; }
      if (champs.length) { grp = el('span', 'sp-gab-grp'); d.appendChild(grp); }
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


  /* Grille de choix : une ligne par élément, un choix par ligne, toutes validées ensemble
     (« Entoure l'adjectif qui convient », angle α de chaque force…)
     p.lignes [{ id, label (HTML), bonne (id d'option), indices { id d'option: diagnostic }, apres (HTML affiché une fois réussi) }]
     p.options [{ id, label }] : les mêmes pour chaque ligne ; p.diag(fausses) → diagnostic d'ensemble (facultatif) */
  function pGrille(zone, p, api) {
    const g = el('div', 'sp-grille');
    g.innerHTML = p.lignes.map(l => `<div class="sp-grille-l" data-l="${l.id}">
        <div class="sp-grille-nom">${l.label}</div>
        <div class="sp-grille-ch" role="group" aria-label="${String(l.label).replace(/<[^>]+>/g, '').replace(/"/g, '')}">
          ${p.options.map(o => `<button type="button" class="sp-grille-b" data-o="${o.id}" aria-pressed="false">${o.label}</button>`).join('')}</div>
        <div class="sp-grille-apres" hidden></div></div>`).join('');
    zone.appendChild(g);
    const lignes = Array.from(g.querySelectorAll('.sp-grille-l'));
    const choisi = {};
    lignes.forEach(L => {
      L.querySelectorAll('.sp-grille-b').forEach(b => {
        b.onclick = () => {
          if (api.fini() || b.disabled) return;
          choisi[L.dataset.l] = b.dataset.o;
          L.querySelectorAll('.sp-grille-b').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
          L.classList.remove('ok', 'ko');
          api.effacer();
        };
      });
    });
    const bVal = boutonValider(zone);
    function terminer() {
      lignes.forEach((L, k) => {
        L.classList.remove('ko'); L.classList.add('ok');
        L.querySelectorAll('.sp-grille-b').forEach(b => { b.disabled = true; });
        const a = L.querySelector('.sp-grille-apres');
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
        lignes.forEach((L, k) => L.querySelectorAll('.sp-grille-b').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.o === p.lignes[k].bonne))));
        terminer();
      },
    };
  }

  // Outil propre à l'application : p.monter(zone, api) → { montrer() }
  function pPerso(zone, p, api) {
    const ctx = p.monter(zone, api) || {};
    return { montrer() { if (ctx.montrer) ctx.montrer(); } };
  }

  const PARTIES = { choix: pChoix, nombre: pNombre, gabarit: pGabarit, sci: pSci, grille: pGrille, perso: pPerso };
  // une partie de ce moteur dans un cours (assets/cours.js) : elle y devient un outil « perso »
  const versCours = p => ({ type: 'perso', q: p.q, solution: p.solution || p.correction, aide: p.aide, monter: (zone, api) => PARTIES[p.type](zone, p, api) });

  /* ============================================================
     « AFFICHER TOUT LE COURS »
     Les questions et les « À toi » en cours s'inscrivent ici. Quand
     l'élève demande tout le cours, chacun « se déplie » : toutes ses
     parties sont affichées d'un coup, avec le bouton « Afficher la
     réponse » disponible tout de suite. SP.tout reste vrai ensuite :
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
      window.SP.partieEnCours = p;          // partie en cours (utile pour vérifier l'application)
      const d = el('div', 'ph-partie', `${p.q ? `<div class="ph-partie-q">${p.q}</div>` : ''}<div class="ph-partie-fig"></div><div class="ph-partie-zone"></div><div class="ph-partie-retour"></div>
        <div class="ph-partie-aide${mode === 'cours' && !deplie && !p.aide ? ' hidden' : ''}"><button type="button" class="btn-small">${libAide}</button></div>`);
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
        if (finie) return;
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
    if (mode === 'cours' && window.SP.tout) inst.deplier();
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
      window.SP.questionEnCours = q;          // question en cours (utile pour vérifier l'application)
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
     SP.fig(dessin) renvoie un emplacement HTML ; dès qu'il est dans la
     page, dessin(W) y est appelé avec la largeur disponible W (et de
     nouveau quand la largeur change) : les textes gardent leur taille
     et restent lisibles sur un téléphone. Plusieurs figures par page.
     ============================================================ */
  const DESSINS = new Map();
  let nFig = 0, nMotif = 0;
  function fig(dessin, cls) {
    const k = String(++nFig);
    DESSINS.set(k, dessin);
    return `<div class="sp-fig${cls ? ' ' + cls : ''}" data-fig="${k}"></div>`;
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
    const l = racine.matches && racine.matches('.sp-fig[data-fig]') ? [racine] : [];
    racine.querySelectorAll('.sp-fig[data-fig]').forEach(x => l.push(x));
    l.forEach(x => { const f = DESSINS.get(x.dataset.fig); if (f) monter(x, f); });
  }
  new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(chercher))).observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener('DOMContentLoaded', () => chercher(document.body));

  /* ============================================================
     OUTILS INTERACTIFS PLACÉS DANS DU HTML
     SP.outil(monter) renvoie un emplacement HTML ; dès qu'il est dans la
     page, monter(div) y construit l'outil, une seule fois.
     ============================================================ */
  const OUTILS = new Map();
  let nOutil = 0;
  function outil(f) {
    const k = String(++nOutil);
    OUTILS.set(k, f);
    return `<div class="sp-outil" data-outil="${k}"></div>`;
  }
  function chercherOutils(racine) {
    if (!racine || !racine.querySelectorAll) return;
    const l = racine.matches && racine.matches('.sp-outil[data-outil]') ? [racine] : [];
    racine.querySelectorAll('.sp-outil[data-outil]').forEach(x => l.push(x));
    l.forEach(x => {
      if (x.dataset.monte) return;
      const f = OUTILS.get(x.dataset.outil);
      if (f) { x.dataset.monte = '1'; f(x); }
    });
  }
  new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(chercherOutils))).observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener('DOMContentLoaded', () => chercherOutils(document.body));
  const cap = t => t.charAt(0).toUpperCase() + t.slice(1);

  // racine carrée écrite avec sa barre : √200 ; le signe (SVG étiré) prend la hauteur du contenu
  // (une fraction comprise) et rejoint la barre posée juste au-dessus du contenu
  const rac = x => '<span class="racine"><span class="racine-signe"><span class="racine-lu">√</span>' +
    '<svg viewBox="0 0 10 100" preserveAspectRatio="none" aria-hidden="true"><path d="M0,62 L2.6,55 L5.6,99 L10,0" vector-effect="non-scaling-stroke"/></svg></span>' +
    `<span class="racine-sous">${x}</span></span>`;

  /* ============================================================
     SIGNAL ET SPECTRE (assets/fourier.js) À LA LARGEUR DISPONIBLE
     ============================================================ */
  const F = () => window.FOURIER;
  const figSignal = (spec, o) => fig(W => F().svgSignal(spec, Object.assign({}, o, { W: Math.min(W, (o && o.Wmax) || 720) })));
  const figSpectre = (liste, o) => fig(W => F().svgSpectre(liste, Object.assign({}, o, { W: Math.min(W, (o && o.Wmax) || 720) })));
  // exemple du cours : spectre en mV (a0 = 1 000 mV, f1 = 150 Hz…) ; le signal est calculé à partir de ce spectre
  const COURS_EX = { f1: 150, a0: 1, a: [1.5, 1, .67, .17] };
  const COURS_RAIES_MV = () => F().raies(COURS_EX).map(r => Object.assign({}, r, { a: Math.round(r.a * 1000) }));
  const COURS_OPTS_SPECTRE = { unite: 'mV', amax: 1500, pasA: 250, fmax: 650, pasF: 50, etiqF: [100, 200, 300, 400, 500, 600], etiquettes: true };
  const COURS_OPTS_SIGNAL = { tmax: 50, pasT: 5, ymin: -2, ymax: 4, pasY: 1, nom: 's', unite: 'V' };

  /* ============================================================
     DOCUMENTS DES EXERCICES (redessinés en SVG, mêmes graduations
     que le manuel, quadrillage parfois plus fin pour la lecture)
     SPEC : signaux (en V) ; DOCS : spectres { raies, opts } et signaux { spec, opts }
     ============================================================ */
  const raiesDe = l => l.map(([f, a, nom]) => ({ f, a, nom }));
  const SPEC = {
    ex6: { f1: 200, a0: 0, a: [.5, .75, 0, 0, 1] },
    ex13: { f1: 300, a0: 0, a: [4, 1.5, 1, 1] },
    ex14: { f1: 50, a0: 0, a: [1, 0, .86, 0, .81, 0, .72] },
  };
  const DOCS = {
    ex9: { raies: raiesDe([[0, 2], [50, 8], [100, 11], [200, 5], [250, 15], [300, 1], [400, 7]]),
      opts: { unite: 'V', amax: 16, pasA: 1, etiqA: [0, 1, 5, 10], fmax: 450, pasF: 25, etiqF: [50, 200, 400], titreF: 'f (Hz)', titreA: '<tspan>a</tspan><tspan dy="3.5" font-size="0.75em">n</tspan><tspan dy="-3.5"> (V)</tspan>', H: 250,
        aria: 'Spectre de u(t) : raies à 0, 50, 100, 200, 250, 300 et 400 Hz' } },
    ex6Signal: { spec: SPEC.ex6, opts: { tmax: 10.5, pasT: .5, etiqT: [2.5, 5, 7.5, 10], ymin: -1.75, ymax: 1.75, pasY: .25, etiqY: [-1.5, -1, -.5, 0, .5, 1, 1.5], nom: 'u', unite: 'V', titreY: 'u (en V)', aria: 'Signal u(t) de l\'exercice 6, de 0 à 10 ms' } },
    ex6: { raies: raiesDe([[200, 500], [400, 750], [1000, 1000]]),
      opts: { unite: 'mV', amax: 1050, pasA: 100, etiqA: [0, 200, 400, 600, 800, 1000], fmax: 1350, pasF: 50, etiqF: [250, 500, 750, 1000, 1250], aria: 'Spectre de l\'exercice 6 : raies à 200, 400 et 1 000 Hz' } },
    ex11: { raies: raiesDe([[100, .9], [300, .4], [500, .6], [700, .2], [900, .75], [1100, .45], [1300, .1]]),
      opts: { unite: 'V', amax: 1.05, pasA: .1, etiqA: [0, .1, .5, 1], fmax: 1500, pasF: 100, etiqF: [100, 500, 1000], titreA: 'a (en V)', titreF: 'f (en Hz)', H: 230,
        aria: 'Spectre de l\'exercice 11 : raies à 100, 300, 500, 700, 900, 1 100 et 1 300 Hz' } },
    ex12Guitare: { raies: raiesDe([[440, 120], [880, 115], [1760, 115], [2200, 25], [3080, 30]]),
      opts: { unite: 'mV', uniteF: 'kHz', amax: 135, pasA: 25, fmax: 4300, pasF: 250, etiqF: [500, 1000, 1500, 2000, 2500, 3000, 3500, 4000],
        titreA: '<tspan>S</tspan><tspan dy="3.5" font-size="0.75em">amplitude</tspan><tspan dy="-3.5"> (en mV)</tspan>', titreF: 'Fréquence (en kHz)', aria: 'Spectre de la guitare folk' } },
    ex12Orgue: { raies: raiesDe([[440, 210], [880, 220]]),
      opts: { unite: 'mV', uniteF: 'kHz', amax: 260, pasA: 50, fmax: 1850, pasF: 125, etiqF: [250, 500, 750, 1000, 1250, 1500, 1750],
        titreA: '<tspan>S</tspan><tspan dy="3.5" font-size="0.75em">amplitude</tspan><tspan dy="-3.5"> (en mV)</tspan>', titreF: 'Fréquence (en kHz)', aria: 'Spectre de l\'orgue' } },
    ex13Signal: { spec: SPEC.ex13, opts: { tmax: 10, pasT: .5, etiqT: [1, 2, 3, 4, 5, 6, 7, 8, 9], ymin: -6.25, ymax: 6.25, pasY: 1.25, etiqY: [-5, -2.5, 0, 2.5, 5], nom: 'u', unite: 'V', titreY: 'Amplitude (V)', aria: 'Enregistrement du son du moteur de la Porsche 911, de 0 à 10 ms' } },
    ex13: { raies: raiesDe([[300, 4], [600, 1.5], [900, 1], [1200, 1]]),
      opts: { unite: 'V', amax: 4.5, pasA: .5, etiqA: [0, .5, 1, 1.5, 2, 2.5, 3, 3.5, 4], fmax: 1400, pasF: 50, etiqF: [0, 250, 500, 750, 1000, 1250], titreA: 'Amplitude (V)', titreF: 'Fréquence (Hz)', aria: 'Spectre du son émis par le moteur de la Porsche 911' } },
    ex14: { raies: raiesDe([[50, 100, '100 %'], [150, 86, '86 %'], [250, 81, '81 %'], [350, 72, '72 %']]),
      opts: { unite: '%', amax: 110, pasA: 10, etiqA: [0, 20, 40, 60, 80, 100], fmax: 420, pasF: 50, etiqF: [50, 150, 250, 350], titreA: '(%)', titreF: 'f (Hz)', etiquettes: true,
        aria: 'Spectre d\'amplitude du courant : raies à 50, 150, 250 et 350 Hz' } },
  };

  /* ============================================================
     SPECTRE TIRÉ AU HASARD, LISIBLE SUR LA GRILLE
     f1 multiple de 50 Hz ; une ligne verticale toutes les f1 / 2 ;
     amplitudes multiples de 0,5 V (ou de 100 mV).
     o = { f1s, rangs (liste imposée), a0 (false : pas de composante continue), mV (bool) }
     → { f1, a0, a, raies, opts (options de FOURIER.svgSpectre), gF, gA, unite }
     ============================================================ */
  function spectreAuHasard(o) {
    o = o || {};
    const f1 = hasard(o.f1s || [50, 100, 150, 200, 250, 300, 400, 500]);
    let rangs = o.rangs;
    if (!rangs) {
      const nmax = entre(4, 7), milieu = melanger(Array.from({ length: nmax - 2 }, (_, i) => i + 2)).slice(0, entre(1, 3));
      rangs = [1].concat(milieu, [nmax]).sort((x, y) => x - y);
    }
    const mV = o.mV != null ? o.mV : Math.random() < .35, gA = mV ? 100 : .5, unite = mV ? 'mV' : 'V';
    const a = Array(Math.max(...rangs)).fill(0);
    rangs.forEach(n => { a[n - 1] = entre(1, 8) * gA; });
    if (!o.libres) a[0] = Math.max(a[0], 4 * gA);                 // fondamental bien visible
    const a0 = o.a0 === false ? 0 : (o.a0 === true || Math.random() < .5 ? entre(1, 6) * gA : 0);
    const nmax = Math.max(...rangs), fmax = (nmax + 1) * f1, gF = f1 / 2;
    const L = [100, 150, 200, 250, 300, 400, 500, 600, 750, 1000, 1500, 2000, 2500, 3000].find(c => c % gF === 0 && fmax / c <= 6) || f1;
    const max = Math.max(a0, ...a), pasEtiq = mV ? (max > 800 ? 400 : 200) : 1;
    const amax = Math.ceil((max + gA / 2) / pasEtiq) * pasEtiq;
    const etiqA = Array.from({ length: Math.round(amax / pasEtiq) + 1 }, (_, k) => +(k * pasEtiq).toFixed(6));
    const etiqF = Array.from({ length: Math.floor(fmax / L) + 1 }, (_, k) => k * L);
    const spec = { f1, a0, a };
    return { f1, a0, a, unite, gF, gA, spec, raies: F().raies(spec), opts: { fmax, pasF: gF, etiqF, amax, pasA: gA, etiqA, unite } };
  }

  /* ============================================================
     OUTIL « LIRE UN SPECTRE » (partie 'perso', cours et séries)
     L'élève touche une raie ; il écrit sa fréquence et son amplitude,
     puis (mode 'harmonique') son rang.
     o = { mode: 'fondamental' | 'harmonique', sp (spectreAuHasard), q, solution }
     ============================================================ */
  function partieLireSpectre(o) {
    const sp = o.sp || spectreAuHasard(), mode = o.mode || 'harmonique';
    const U = sp.unite, nomF = n => `f<sub>${n}</sub>`, nomA = n => `a<sub>${n}</sub>`;
    const solution = o.solution || (mode === 'fondamental'
      ? `<p>Le fondamental est la première raie après 0 Hz : ${nomF(1)} = ${fmt(sp.f1)} Hz, ${nomA(1)} = ${fmt(sp.a[0])} ${U}.${sp.a0 ? ` La raie à 0 Hz (${fmt(sp.a0)} ${U}) est la composante continue a<sub>0</sub>.` : ''}</p>`
      : `<p>Le fondamental est à ${nomF(1)} = ${fmt(sp.f1)} Hz. Le rang d'une raie est n = f<sub>n</sub> / ${nomF(1)}.</p>`);
    return {
      type: 'perso', q: o.q || (mode === 'fondamental'
        ? 'Touche la raie du <b>fondamental</b>, puis écris sa fréquence et son amplitude.'
        : 'Touche un <b>harmonique</b> (une raie plus à droite que le fondamental), écris sa fréquence et son amplitude, puis son rang.'),
      solution,
      monter(zone, api) {
        const d = el('div', 'sp-lire');
        d.innerHTML = `<div class="sp-lire-fig"></div><p class="sp-lire-choix">Touche une raie du spectre.</p>`;
        zone.appendChild(d);
        const zf = d.querySelector('.sp-lire-fig'), txt = d.querySelector('.sp-lire-choix');
        let choix = null, phase = 1, W = 0;
        const raie = () => sp.raies[choix];
        function dessiner() {
          W = Math.min(640, Math.round(zf.clientWidth || zone.clientWidth || 600));
          const H = W < 480 ? 190 : 205, g = F().geomSpectreDe(sp.raies, Object.assign({ W, H }, sp.opts));
          let svg = F().svgSpectre(sp.raies, Object.assign({ W, H, aria: 'Spectre : touche une raie pour la choisir' }, sp.opts));
          const esp = (g.X(sp.f1) - g.X(0)) * .9, w = Math.max(26, Math.min(esp, 60));
          const sous = choix != null ? `<line class="sp-raie-choisie" x1="${g.X(raie().f)}" y1="${g.y1}" x2="${g.X(raie().f)}" y2="${g.Y(raie().a)}"/>` : '';
          const cols = sp.raies.map((r, i) => `<rect data-raie="${i}" x="${g.X(r.f) - (r.f ? w / 2 : Math.min(w / 2, 22))}" y="${g.y0 - 10}" width="${r.f ? w : Math.min(w / 2, 22) + w / 2}" height="${g.y1 - g.y0 + 26}" fill="transparent"><title>Raie à choisir</title></rect>`).join('');
          zf.innerHTML = svg.replace(/^(<svg[^>]*>)/, '$1' + sous).replace('</svg>', cols + '</svg>');
        }
        zf.addEventListener('click', e => {
          const r = e.target.closest('[data-raie]');
          if (!r || phase > 1 || api.fini()) return;
          choix = +r.dataset.raie;
          txt.innerHTML = `Raie choisie : la <b>${choix + 1}<sup>e</sup></b> en partant de la gauche (surlignée). Lis sa fréquence et son amplitude.`;
          api.effacer();
          dessiner();
        });
        if (window.ResizeObserver) new ResizeObserver(() => { if (Math.round(zf.clientWidth) !== W) dessiner(); }).observe(zf);
        dessiner();
        // champs : fréquence et amplitude, puis rang
        const v = el('div', 'ph-valeur');
        v.innerHTML = '<span class="ph-lab">f =</span>';
        const cf = champ({ signe: false, aria: 'Fréquence de la raie, en hertz' }), ca = champ({ signe: false, aria: `Amplitude de la raie, en ${U}` });
        v.appendChild(cf.el); v.appendChild(el('span', 'ph-unite', 'Hz ;')); v.appendChild(el('span', 'ph-lab', 'a =')); v.appendChild(ca.el); v.appendChild(el('span', 'ph-unite', U));
        d.appendChild(v);
        const bVal = boutonValider(d);
        [cf, ca].forEach(c => { c.input.addEventListener('input', () => api.effacer()); c.input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); valider1(); } }); });
        let cn = null, bVal2 = null;
        function valider1() {
          if (api.fini() || phase > 1) return;
          if (choix == null) { secouer(zf); api.message('Touche d\'abord une raie du spectre.'); return; }
          const r = raie();
          if (mode === 'fondamental' && r.n !== 1) {
            api.erreur(r.n === 0 ? 'La raie à 0 Hz est la <b>composante continue</b> a<sub>0</sub>, pas le fondamental. Le fondamental est la première raie <b>après</b> 0 Hz.'
              : 'Le fondamental est la raie de <b>plus basse fréquence</b> (la première après 0 Hz) : prends une raie plus à gauche.');
            return;
          }
          if (mode === 'harmonique' && r.n < 2) {
            api.erreur(r.n === 0 ? 'La raie à 0 Hz est la <b>composante continue</b>, pas un harmonique.' : 'Cette raie est le <b>fondamental</b> (rang 1) : choisis une raie plus à droite.');
            return;
          }
          const vf = lire(cf.input.value), va = lire(ca.input.value);
          if (isNaN(vf) || isNaN(va)) { secouer(v); api.message('Écris la fréquence et l\'amplitude (des nombres).'); return; }
          const okF = Math.abs(vf - r.f) <= sp.gF / 4 + 1e-9, okA = Math.abs(va - r.a) <= sp.gA / 4 + 1e-9;
          cf.el.classList.toggle('ko', !okF); ca.el.classList.toggle('ko', !okA);
          if (!okF || !okA) {
            const msg = [];
            if (!okF) msg.push(proche(vf, r.a, .01) && !proche(r.a, r.f) ? 'Tu as écrit l\'amplitude à la place de la fréquence : la fréquence se lit sur l\'axe <b>horizontal</b>.'
              : `Fréquence : descends de la raie jusqu'à l'axe horizontal. Une ligne verticale du quadrillage tous les ${fmt(sp.gF)} Hz.`);
            if (!okA) msg.push(`Amplitude : va du haut de la raie jusqu'à l'axe vertical. Une ligne horizontale du quadrillage tous les ${fmt(sp.gA)} ${U}.`);
            api.erreur(msg.join('<br>'));
            secouer(v);
            return;
          }
          cf.desactiver(true); ca.desactiver(true); bVal.fermer();
          if (mode === 'fondamental') { phase = 3; api.reussi(); return; }
          phase = 2; api.effacer();
          // phase 2 : le rang de l'harmonique
          const v2 = el('div', 'ph-valeur');
          v2.innerHTML = `<p class="ph-partie-q" style="width:100%;margin:12px 0 4px !important">Quel est le rang n de cet harmonique ? (Lis d'abord la fréquence ${nomF(1)} du fondamental.)</p><span class="ph-lab">n =</span>`;
          cn = champ({ signe: false, aria: 'Rang de l\'harmonique' });
          v2.appendChild(cn.el);
          d.appendChild(v2);
          bVal2 = boutonValider(d);
          cn.input.addEventListener('input', () => api.effacer());
          cn.input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); valider2(); } });
          bVal2.onclick = valider2;
          setTimeout(() => v2.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 60);
        }
        function valider2() {
          if (api.fini()) return;
          const r = raie(), vn = lire(cn.input.value);
          if (isNaN(vn)) { secouer(cn.el); api.message('Écris le rang (un nombre entier).'); return; }
          if (vn === r.n) { cn.desactiver(true); bVal2.fermer(); phase = 3; api.reussi(); return; }
          const k = sp.raies.filter(x => x.f && x.f <= r.f).length;
          api.erreur(vn === k && k !== r.n ? `Le rang n'est pas la position de la raie sur le dessin (des harmoniques peuvent manquer) : le rang est f<sub>n</sub> / ${nomF(1)}.`
            : vn === r.n - 1 ? `Le fondamental est le rang 1 (la raie à 0 Hz ne compte pas) : le rang est f<sub>n</sub> / ${nomF(1)}.`
            : `Le rang est f<sub>n</sub> / ${nomF(1)} : divise la fréquence de la raie par celle du fondamental.`);
          secouer(cn.el);
        }
        bVal.onclick = valider1;
        return {
          montrer() {
            if (phase === 3) return;
            if (phase === 1) {
              if (choix == null || (mode === 'fondamental' ? raie().n !== 1 : raie().n < 2)) choix = sp.raies.findIndex(r => (mode === 'fondamental' ? r.n === 1 : r.n >= 2));
              dessiner();
              const r = raie();
              txt.innerHTML = `Raie choisie : ${r.n === 1 ? 'le fondamental' : `l'harmonique de rang ${r.n}`}.`;
              cf.input.value = fmt(r.f); ca.input.value = fmt(r.a);
              cf.el.classList.remove('ko'); ca.el.classList.remove('ko');
              cf.desactiver(true); ca.desactiver(true); bVal.fermer();
              if (mode === 'fondamental') { phase = 3; return; }
              phase = 1.5;
              const v2 = el('div', 'ph-valeur', '<span class="ph-lab">n =</span>');
              cn = champ({ signe: false }); v2.appendChild(cn.el); d.appendChild(v2);
            }
            if (cn) { cn.input.value = String(raie().n); cn.desactiver(true); }
            if (bVal2) bVal2.fermer();
            phase = 3;
          },
        };
      },
    };
  }

  /* ============================================================
     OUTIL « MESURER UNE PÉRIODE » (partie 'perso')
     Deux curseurs à faire glisser sur le signal (au doigt, à la souris)
     pour encadrer n périodes ; la durée s'affiche, l'élève écrit n.
     o = { spec, tmax, pasT, ymin, ymax, pasY, nom, unite, minN (2), q, solution,
           res (objet rempli avec { dt, n } quand c'est réussi) }
     ============================================================ */
  // instant du premier sommet du signal (le plus haut point de la première période), en ms
  function premierSommet(spec) {
    const T = 1000 / spec.f1;
    let tm = 0, vm = -Infinity;
    for (let k = 0; k <= 2000; k++) { const t = T * k / 2000, v = F().valeur(spec, t / 1000); if (v > vm) { vm = v; tm = t; } }
    return tm;
  }
  function partieMesure(o) {
    const spec = o.spec, T = 1000 / spec.f1, minN = o.minN || 2, res = o.res || {};
    return {
      type: 'perso', aide: o.aide,
      q: o.q || `Fais glisser les deux curseurs pour encadrer <b>plusieurs périodes</b> (au moins ${minN}), en les plaçant sur deux points identiques du signal (deux sommets, par exemple). Écris ensuite le nombre n de périodes encadrées.`,
      solution: o.solution,
      monter(zone, api) {
        const d = el('div', 'sp-mesure');
        zone.appendChild(d);
        const sim = F().monter(d, { spectre: false, commandes: false, predefinis: false, cases: false, legende: false, mesure: true,
          f1: spec.f1, a0: spec.a0, a: spec.a, tmax: o.tmax, pasT: o.pasT, ymin: o.ymin, ymax: o.ymax, pasY: o.pasY, nom: o.nom || 'u', unite: o.unite || 'V', titreY: o.titreY });
        sim.surChange(() => api.effacer());
        const v = el('div', 'sp-mesure-n');
        v.innerHTML = '<span class="ph-lab">Nombre de périodes entre les curseurs : n =</span>';
        const cn = champ({ signe: false, aria: 'Nombre de périodes encadrées' });
        v.appendChild(cn.el);
        d.appendChild(v);
        const bVal = boutonValider(d);
        cn.input.addEventListener('input', () => api.effacer());
        cn.input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); valider(); } });
        function valider() {
          if (api.fini()) return;
          const n = lire(cn.input.value), e = sim.etat(), dt = Math.abs(e.t2 - e.t1);
          if (isNaN(n) || n < 1 || !Number.isInteger(n)) { secouer(v); api.message('Écris le nombre de périodes encadrées (un nombre entier).'); return; }
          // tolérance : deux pas de déplacement des curseurs, ou 1,5 % de la durée mesurée
          const tmaxAxe = F().axesSignal(spec, { tmax: o.tmax }).tmax, tol = Math.max(2 * F().pasJoli(tmaxAxe, 100), .015 * n * T);
          const k = dt / T;
          if (Math.abs(dt - n * T) <= tol) {
            if (n < minN) { api.erreur(`C'est juste, mais encadre au moins <b>${minN} périodes</b> : la mesure est plus précise.`); return; }
            res.dt = dt; res.n = n;
            cn.desactiver(true); bVal.fermer(); api.reussi();
            return;
          }
          api.erreur(Math.abs(k - Math.round(k)) * T <= tol && Math.round(k) >= 1
            ? `Tes curseurs encadrent ${Math.round(k)} période${Math.round(k) > 1 ? 's' : ''}, pas ${n}. Compte les motifs qui se répètent entre les curseurs.`
            : 'Tes curseurs n\'encadrent pas un nombre entier de périodes : place-les sur deux points <b>identiques</b> du signal (deux sommets les plus hauts, par exemple).');
          secouer(v);
        }
        bVal.onclick = valider;
        return {
          montrer() {
            // curseurs sur deux sommets séparés du plus grand nombre de périodes possible
            const t1 = premierSommet(spec), tmax = o.tmax || 3 * T, n = Math.max(minN, Math.floor((tmax - t1) / T + 1e-9));
            sim.regler({ t1: Math.round(t1 * 100) / 100, t2: Math.round((t1 + n * T) * 100) / 100 }, true);
            cn.input.value = String(n); cn.desactiver(true); bVal.fermer();
            res.dt = n * T; res.n = n;
          },
        };
      },
    };
  }

  /* ============================================================
     PETIT SIMULATEUR DANS UNE QUESTION (partie 'perso')
     Un exemplaire de FOURIER.monter dans la partie ; la partie est réussie
     quand toutes les conditions sont remplies (affichées en direct).
     o = { q, sim (options de FOURIER.monter), conditions(e) → [[texte, juste], …],
           regl (réglage montré par « Afficher la réponse »), solution }
     ============================================================ */
  function partieSimu(o) {
    return {
      type: 'perso', aide: true, q: o.q, solution: o.solution,
      monter(zone, api) {
        const d = el('div', 'sp-mini-sim');
        zone.appendChild(d);
        const sim = F().monter(d, Object.assign({ predefinis: false }, o.sim));
        const p = el('div', 'sp-etat');
        zone.appendChild(p);
        let fini = false;
        const afficher = e => {
          const l = o.conditions(e);
          p.innerHTML = l.map(([t, ok]) => `<span class="${ok ? 'ok' : ''}">${t}</span>`).join('');
          return l.every(x => x[1]);
        };
        sim.surChange(e => { if (!fini && afficher(e) && !api.fini()) { fini = true; api.reussi(); } });
        afficher(sim.etat());
        return { montrer() { fini = true; sim.regler(o.regl); afficher(sim.etat()); } };
      },
    };
  }

  /* ============================================================
     PLAN DE L'APPLICATION ET NAVIGATION (voir assets/sommaire.js)
     ============================================================ */
  const PLAN = [
    { n: 1, titre: 'Analyse de Fourier', desc: 'Somme de sinusoïdes, composante continue a<sub>0</sub>, pulsation ω = 2πf, harmoniques f<sub>n</sub> = n × f<sub>1</sub>', fiche: 'fiche_1',
      parties: [{ nom: 'Analyse de Fourier', simulation: 'module_1_simulation', cours: 'module_1_cours', questions: 'module_1_questions', noms: { simulation: 'Simulateur : synthèse de Fourier' } }] },
    { n: 2, titre: 'Le spectre', desc: 'Raie à 0 Hz, fondamental, harmoniques, amplitudes et rang d\'une raie', fiche: 'fiche_2',
      // deux sous-modules de cours, puis une seule série de questions et la fiche
      sousModules: true,
      parties: [
        { nom: 'Lire un spectre', slug: 'lire', cours: 'module_2a_cours', noms: { cours: 'Cours : lire un spectre' } },
        { nom: 'Rang d\'un harmonique', slug: 'rang', cours: 'module_2b_cours', noms: { cours: 'Cours : rang d\'un harmonique' } },
        { nom: 'Le spectre', questions: 'module_2_questions' }] },
    { n: 3, titre: 'Exploiter les graphiques', desc: 'Période mesurée sur plusieurs périodes, f = 1 / T, intervalle de fréquences, bande passante', fiche: 'fiche_3',
      sousModules: true,
      parties: [
        { nom: 'Fréquence d\'un signal', slug: 'frequence', cours: 'module_3a_cours', noms: { cours: 'Cours : fréquence d\'un signal' } },
        { nom: 'Bande passante', slug: 'bande', cours: 'module_3b_cours', noms: { cours: 'Cours : bande passante' } },
        { nom: 'Exploiter les graphiques', questions: 'module_3_questions' }] },
    { n: 4, titre: 'Exercices', desc: 'Exercices 9, 6, 11, 12, 13 et 14 du manuel, guidés pas à pas', exercices: 'module_4', exNom: 'Exercices 6 à 14', nbEx: 6 },
  ];
  window.SOM.init({ nom: 'Chapitre 17 : Spectre d\'un signal périodique', id: 'spectre-signal', cleEx: 'spectre-signal-exercices', plan: PLAN });
  const menu = cle => window.SOM.menu(cle);
  const accueil = zone => window.SOM.accueil(zone);
  const marquer = info => window.SOM.marquer(info);

  window.SP = Object.assign(window.SP || {}, {
    MOINS, fmt, cs, sci, lire, proche, fr, rac, unite, o, fq, el, secouer, melanger, hasard, entre, champ, boutonValider, PARTIES, versCours,
    question, serie, confettis, fig, monter, outil, cap,
    figSignal, figSpectre, SPEC, DOCS, COURS_EX, COURS_RAIES_MV, COURS_OPTS_SPECTRE, COURS_OPTS_SIGNAL, spectreAuHasard, partieLireSpectre, premierSommet, partieMesure, partieSimu,
    PLAN, menu, accueil, marquer,
  });
})();
