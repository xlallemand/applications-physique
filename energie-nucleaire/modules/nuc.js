/* ============================================================
   Moteur de l'application « Chapitre 13 : Énergie nucléaire »
   (Terminale STI2D ; même moteur de questions que « Chapitre 12 :
   Radioactivité » ; navigation commune assets/sommaire.js, cours avec
   assets/cours.js)

   NUC.fmt, NUC.cs, NUC.sci, NUC.lire     écriture et lecture des nombres (virgule)
   NUC.o, NUC.fq.choix, NUC.fq.nombre      fabriques d'options et de parties de question
   NUC.PARTIES                             parties de question : 'choix', 'nombre', 'gabarit', 'sci',
                                           'grille' (un choix par ligne), 'perso' (p.monter(zone, api) → { montrer() })
   NUC.versCours(p)                        une de ces parties dans un cours (assets/cours.js) ; à utiliser pour
                                           les nombres très petits (10⁻²⁷ kg, 10⁻¹³ J) : la tolérance de NUC est
                                           purement relative
   NUC.question(zone, q, cb, mode)         question en plusieurs parties (série, exercice)
   NUC.serie(opts)                         série de questions notée sur 20
   NUC.figure(dessin)                      figure dessinée à la largeur disponible : dessin(W) → SVG

   Propre au chapitre 13 :
     NUC.ELEMENTS, symboleDe, nomDe        extrait de la classification (Z = 1 à 100)
     NUC.noyau(A, Z, X), NUC.esp(A, Z, X, k), NUC.equation(g, d)
                                           écriture d'un noyau ᴬ_Z X, d'une espèce (coefficient k) et d'une équation
     NUC.analyse(g, d), NUC.partieClasse   fission, fusion ou radioactivité α, β⁻, β⁺ (méthode du professeur :
                                           le plus grand nombre de nucléons, à gauche ou à droite ; un seul réactif)
     NUC.partieReaction(def, opts)         outil : équation à trous (A, Z, nombre x de neutrons, élément d'après Z
                                           ou particule), puis repérer le plus grand A et classer la réaction
     NUC.masse('3,902170e-25')             masse écrite comme dans l'énoncé (valeur, texte, dernier chiffre)
     NUC.partieDefaut(def, opts)           outil : tableau du défaut de masse (réactifs | produits, coefficient ×
                                           masse, neutrons simplifiés, somme de chaque colonne, Δm)
     NUC.diagE, diagMeV, diagJ, diagKg, diagN, diagEtot, diagPetrole, diagActivite
                                           diagnostics des erreurs classiques des calculs d'énergie
     NUC.figFission(), NUC.figFusion()     figures du cours (SVG)
   NUC.menu(cle), NUC.accueil(zone)        navigation commune (SOM) avec le plan de l'application

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
  // écart relatif (pas d'écart absolu : les grandeurs du chapitre valent souvent 10⁻¹³ J ou 10⁻²⁷ kg)
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
    const d = el('div', 'ph-valeur nuc-gab');
    if (p.label) d.appendChild(el('span', 'ph-lab', p.label));
    // chaque case forme un groupe insécable avec le texte qui la suit : sur un petit écran,
    // la ligne ne se coupe qu'entre deux groupes
    const champs = [];
    let grp = el('span', 'nuc-gab-grp');
    d.appendChild(grp);
    p.morceaux.forEach(m => {
      if (typeof m === 'string') { grp.appendChild(el('span', 'nuc-gab-txt', m)); return; }
      if (champs.length) { grp = el('span', 'nuc-gab-grp'); d.appendChild(grp); }
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

  /* Grille de choix : une ligne par élément, un choix par ligne, toutes validées ensemble
     p.lignes [{ id, label (HTML), bonne (id d'option), indices { id d'option: diagnostic }, apres (HTML affiché une fois réussi) }]
     p.options [{ id, label }] : les mêmes pour chaque ligne ; p.diag(fausses) → diagnostic d'ensemble (facultatif) */
  function pGrille(zone, p, api) {
    const g = el('div', 'nuc-grille');
    g.innerHTML = p.lignes.map(l => `<div class="nuc-grille-l" data-l="${l.id}">
        <div class="nuc-grille-nom">${l.label}</div>
        <div class="nuc-grille-ch" role="group" aria-label="${String(l.label).replace(/<[^>]+>/g, '').replace(/"/g, '')}">
          ${p.options.map(o => `<button type="button" class="nuc-grille-b" data-o="${o.id}" aria-pressed="false">${o.label}</button>`).join('')}</div>
        <div class="nuc-grille-apres" hidden></div></div>`).join('');
    zone.appendChild(g);
    const lignes = Array.from(g.querySelectorAll('.nuc-grille-l'));
    const choisi = {};
    lignes.forEach(L => {
      L.querySelectorAll('.nuc-grille-b').forEach(b => {
        b.onclick = () => {
          if (api.fini() || b.disabled) return;
          choisi[L.dataset.l] = b.dataset.o;
          L.querySelectorAll('.nuc-grille-b').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
          L.classList.remove('ok', 'ko');
          api.effacer();
        };
      });
    });
    const bVal = boutonValider(zone);
    function terminer() {
      lignes.forEach((L, k) => {
        L.classList.remove('ko'); L.classList.add('ok');
        L.querySelectorAll('.nuc-grille-b').forEach(b => { b.disabled = true; });
        const a = L.querySelector('.nuc-grille-apres');
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
        lignes.forEach((L, k) => L.querySelectorAll('.nuc-grille-b').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.o === p.lignes[k].bonne))));
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
      window.NUC.partieEnCours = p;          // partie en cours (utile pour vérifier l'application)
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
      window.NUC.questionEnCours = q;          // question en cours (utile pour vérifier l'application)
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

  const f1 = v => (+v).toFixed(1);

  /* Figures dessinées à la largeur disponible (cours, fiches, énoncés) : un emplacement
     est rendu dans la page, puis dessiné (et redessiné si la largeur change). */
  const FIGS = new Map();
  let nFig = 0;
  function figure(dessin, cls) {
    const k = String(++nFig);
    FIGS.set(k, dessin);
    return `<div class="nuc-fig${cls ? ' ' + cls : ''}" data-fig="${k}"></div>`;
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
    const l = racine.matches && racine.matches('.nuc-fig[data-fig]') ? [racine] : [];
    racine.querySelectorAll('.nuc-fig[data-fig]').forEach(x => l.push(x));
    l.forEach(x => { const f = FIGS.get(x.dataset.fig); if (f) monterFig(x, f); });
  }

  new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(n => chercherFigs(n)))).observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener('DOMContentLoaded', () => chercherFigs(document.body));


  /* ============================================================
     PROPRE AU CHAPITRE 13
     ============================================================ */
  const ESP = ' ';                                             // espace insécable (unités)
  const signe = v => String(v).replace('-', MOINS);            // −1 avec le moins typographique
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);

  /* ---------- Classification périodique (extrait jusqu'à Z = 100) : [symbole, nom] ---------- */
  const ELEMENTS = [null,
    ['H', 'hydrogène'], ['He', 'hélium'], ['Li', 'lithium'], ['Be', 'béryllium'], ['B', 'bore'], ['C', 'carbone'], ['N', 'azote'], ['O', 'oxygène'],
    ['F', 'fluor'], ['Ne', 'néon'], ['Na', 'sodium'], ['Mg', 'magnésium'], ['Al', 'aluminium'], ['Si', 'silicium'], ['P', 'phosphore'], ['S', 'soufre'],
    ['Cl', 'chlore'], ['Ar', 'argon'], ['K', 'potassium'], ['Ca', 'calcium'], ['Sc', 'scandium'], ['Ti', 'titane'], ['V', 'vanadium'], ['Cr', 'chrome'],
    ['Mn', 'manganèse'], ['Fe', 'fer'], ['Co', 'cobalt'], ['Ni', 'nickel'], ['Cu', 'cuivre'], ['Zn', 'zinc'], ['Ga', 'gallium'], ['Ge', 'germanium'],
    ['As', 'arsenic'], ['Se', 'sélénium'], ['Br', 'brome'], ['Kr', 'krypton'], ['Rb', 'rubidium'], ['Sr', 'strontium'], ['Y', 'yttrium'], ['Zr', 'zirconium'],
    ['Nb', 'niobium'], ['Mo', 'molybdène'], ['Tc', 'technétium'], ['Ru', 'ruthénium'], ['Rh', 'rhodium'], ['Pd', 'palladium'], ['Ag', 'argent'], ['Cd', 'cadmium'],
    ['In', 'indium'], ['Sn', 'étain'], ['Sb', 'antimoine'], ['Te', 'tellure'], ['I', 'iode'], ['Xe', 'xénon'], ['Cs', 'césium'], ['Ba', 'baryum'],
    ['La', 'lanthane'], ['Ce', 'cérium'], ['Pr', 'praséodyme'], ['Nd', 'néodyme'], ['Pm', 'prométhium'], ['Sm', 'samarium'], ['Eu', 'europium'], ['Gd', 'gadolinium'],
    ['Tb', 'terbium'], ['Dy', 'dysprosium'], ['Ho', 'holmium'], ['Er', 'erbium'], ['Tm', 'thulium'], ['Yb', 'ytterbium'], ['Lu', 'lutécium'], ['Hf', 'hafnium'],
    ['Ta', 'tantale'], ['W', 'tungstène'], ['Re', 'rhénium'], ['Os', 'osmium'], ['Ir', 'iridium'], ['Pt', 'platine'], ['Au', 'or'], ['Hg', 'mercure'],
    ['Tl', 'thallium'], ['Pb', 'plomb'], ['Bi', 'bismuth'], ['Po', 'polonium'], ['At', 'astate'], ['Rn', 'radon'], ['Fr', 'francium'], ['Ra', 'radium'],
    ['Ac', 'actinium'], ['Th', 'thorium'], ['Pa', 'protactinium'], ['U', 'uranium'], ['Np', 'neptunium'], ['Pu', 'plutonium'], ['Am', 'américium'], ['Cm', 'curium'],
    ['Bk', 'berkélium'], ['Cf', 'californium'], ['Es', 'einsteinium'], ['Fm', 'fermium']];
  const symboleDe = Z => ELEMENTS[Z][0];
  const nomDe = Z => ELEMENTS[Z][1];

  /* ---------- Écriture d'un noyau, d'une espèce et d'une équation ---------- */
  // noyau ᴬ_Z X : A au-dessus de Z, à gauche du symbole ; A, Z et X peuvent être du HTML (case à compléter)
  const noyau = (A, Z, s) => `<span class="nuc-noyau"><span class="nuc-az"><span>${A}</span><span>${typeof Z === 'number' ? signe(Z) : Z}</span></span><span class="nuc-s">${s}</span></span>`;
  // espèce d'une équation : { A, Z, s, k (coefficient), inc (cases à trouver : 'A', 'Z', 's', 'k') }
  const esp = (A, Z, s, k) => ({ A, Z, s: s || symboleDe(Z), k: k || 1 });
  const neutron = k => esp(1, 0, 'n', k);
  const electron = () => esp(0, -1, 'e');
  const positron = () => esp(0, 1, 'e');
  const helium = () => esp(4, 2, 'He');
  const trou = (x, inc) => Object.assign({}, x, { inc });          // la même espèce, avec des cases à trouver
  const coef = k => (typeof k === 'string' || k > 1 ? `<span class="nuc-k">${k}</span>` : '');          // 'x' : coefficient inconnu
  // coefficient et noyau restent ensemble quand l'équation passe à la ligne
  const ecrire = x => (typeof x === 'string' ? `<span class="nuc-s">${x}</span>` : `<span class="nuc-esp">${coef(x.k)}${noyau(x.A, x.Z, x.s)}</span>`);    // 'γ' : rayonnement
  const PLUS = '<span class="nuc-plus">+</span>', FLECHE = '<span class="nuc-fl">→</span>';
  // équation : listes d'espèces (ou 'γ') à gauche et à droite de la flèche
  const equation = (g, d) => `<span class="nuc-eq">${g.map(ecrire).join(PLUS)}${FLECHE}${d.map(ecrire).join(PLUS)}</span>`;
  // « m(²³⁵₉₂U) »
  const mDe = x => `m(${noyau(x.A, x.Z, x.s)})`;
  const lisible = h => `<span class="nuc-lisible">${h}</span>`;

  /* ---------- Particules ---------- */
  const PARTICULES = {
    n: { A: 1, Z: 0, s: 'n', nom: 'neutron' },
    moins: { A: 0, Z: -1, s: 'e', nom: 'électron' },
    plus: { A: 0, Z: 1, s: 'e', nom: 'positron (positon)' },
    alpha: { A: 4, Z: 2, s: 'He', nom: 'noyau d\'hélium' },
  };
  // particule (clé de PARTICULES) d'après le symbole, sinon null (un élément)
  const particuleDe = x => (x.s === 'n' ? 'n' : x.s === 'e' ? (x.Z < 0 ? 'moins' : 'plus') : null);

  /* ============================================================
     FISSION, FUSION OU RADIOACTIVITÉ ? (méthode du professeur)
     1. repérer le plus grand nombre de nucléons A ;
     2. à gauche : fission (un gros noyau donne des noyaux plus petits) ;
     3. à droite : fusion (des petits noyaux en donnent un plus gros) ;
     4. le même à gauche et à droite : radioactivité.
     Un seul réactif : radioactivité (une fission demande le neutron en plus du noyau).
     ============================================================ */
  const lesNoyaux = l => l.filter(x => x !== 'γ');
  function analyse(g, d) {
    const G = lesNoyaux(g), D = lesNoyaux(d);
    const reactifs = G.reduce((s, x) => s + x.k, 0);
    const maxG = Math.max(...G.map(x => x.A)), maxD = Math.max(...D.map(x => x.A));
    let type;
    if (reactifs === 1) { const e = D.find(x => x.s === 'e'); type = e ? particuleDe(e) : 'alpha'; }
    else type = maxG > maxD ? 'fission' : 'fusion';
    return { type, reactifs, maxG, maxD, max: Math.max(maxG, maxD) };
  }
  const TYPES = [o('fission', 'Fission'), o('fusion', 'Fusion'), o('alpha', 'Radioactivité α'), o('moins', 'Radioactivité β<sup>−</sup>'), o('plus', 'Radioactivité β<sup>+</sup>')];
  const RADIO = ['alpha', 'moins', 'plus'];
  const NOM_TYPE = { fission: 'fission', fusion: 'fusion', alpha: 'radioactivité α', moins: 'radioactivité β<sup>−</sup>', plus: 'radioactivité β<sup>+</sup>' };
  const IND_PART = {
    alpha: `Radioactivité α : le noyau émet un noyau d'hélium ${lisible(noyau(4, 2, 'He'))}. Regarde la particule émise.`,
    moins: `Radioactivité β<sup>−</sup> : le noyau émet un électron ${lisible(noyau(0, -1, 'e'))} (−1 en bas). Regarde la particule émise.`,
    plus: `Radioactivité β<sup>+</sup> : le noyau émet un positron ${lisible(noyau(0, 1, 'e'))} (+1 en bas). Regarde la particule émise.`,
  };
  // diagnostic de chaque mauvais choix
  function indicesClasse(a) {
    const ind = {};
    const cote = a.maxG > a.maxD ? 'à gauche' : a.maxD > a.maxG ? 'à droite' : 'des deux côtés';
    if (RADIO.includes(a.type)) {
      ind.fission = 'Un seul réactif : ce n\'est pas une fission. Pour une fission, il faut deux réactifs : le neutron qui percute un gros noyau.';
      ind.fusion = 'Un seul noyau à gauche : rien ne fusionne. Un noyau seul qui se transforme en émettant une particule, c\'est une radioactivité.';
      RADIO.forEach(t => { if (t !== a.type) ind[t] = IND_PART[t]; });
    } else {
      RADIO.forEach(t => { ind[t] = `Il y a ${a.reactifs} noyaux à gauche : ce n'est pas une radioactivité (un noyau seul se désintègre).`; });
      if (a.type === 'fission') ind.fusion = `Le plus grand nombre de nucléons (${a.max}) est ${cote} : pour une fusion, il serait à droite (des petits noyaux en donnent un plus gros).`;
      else ind.fission = `Le plus grand nombre de nucléons (${a.max}) est ${cote} : pour une fission, il serait à gauche (un gros noyau se scinde en noyaux plus petits).`;
    }
    return ind;
  }
  // justification rédigée
  function explication(a) {
    if (a.type === 'fission') return `Le plus grand nombre de nucléons, ${a.max}, est à gauche : un gros noyau donne des noyaux plus petits. C'est une <b>fission</b>.`;
    if (a.type === 'fusion') return `Le plus grand nombre de nucléons, ${a.max}, est à droite : des petits noyaux en donnent un plus gros. C'est une <b>fusion</b>.`;
    const debut = a.maxG > a.maxD ? `Le plus grand nombre de nucléons, ${a.max}, est à gauche, mais il n'y a qu'un seul réactif : ce n'est pas une fission.`
      : `Le plus grand nombre de nucléons, ${a.max}, est le même à gauche et à droite.`;
    const p = PARTICULES[a.type];
    return `${debut} Un noyau seul se désintègre en émettant un ${p.nom} ${lisible(noyau(p.A, p.Z, p.s))} : c'est une <b>${NOM_TYPE[a.type]}</b>.`;
  }
  // partie « Quelle est la nature de cette transformation ? »
  const partieClasse = (g, d, opts) => {
    const a = analyse(g, d);
    return Object.assign({ type: 'choix', q: 'Fission, fusion ou radioactivité ?', options: TYPES, bonne: a.type, melanger: false, indices: indicesClasse(a), solution: `<p>${explication(a)}</p>` }, opts);
  };

  /* ============================================================
     OUTIL : RÉACTION NUCLÉAIRE À COMPLÉTER, PUIS À CLASSER
     def = { g: [espèce…], d: [espèce…], reperer, classer }
       espèce = { A, Z, s, k, inc } ; inc contient 'A', 'Z', 's', 'k' : les cases à trouver
     1. les nombres (A, Z, nombre x de neutrons) par conservation de A et de Z ;
     2. le symbole : l'élément d'après Z (extrait de la classification),
        ou la particule d'après A et Z ;
     3. (reperer) entourer le plus grand nombre de nucléons, comme le professeur ;
     4. (classer) fission, fusion ou radioactivité α, β⁻, β⁺.
     ============================================================ */
  function outilReaction(zone, def, api) {
    const cotes = { g: def.g, d: def.d };
    const a = analyse(def.g, def.d);
    const box = el('div', 'nuc-eqd');
    const ligne = el('div', 'nuc-eqd-l');
    const suite = el('div', 'nuc-eqd-suite');
    box.appendChild(ligne); box.appendChild(suite);
    zone.appendChild(box);
    const cases = [];
    let symbole = null;

    // équation avec ses cases (A, Z, coefficient) et le symbole à trouver
    ligne.innerHTML = `<span class="nuc-eq">${['g', 'd'].map(c => cotes[c].map((x, i) => {
      if (x === 'γ') return ecrire(x);
      const inc = x.inc || '';
      const k = inc.includes('k') ? `<span data-c="${c}|${i}|k"></span>` : coef(x.k);
      const A = inc.includes('A') ? `<span data-c="${c}|${i}|A"></span>` : x.A;
      const Z = inc.includes('Z') ? `<span data-c="${c}|${i}|Z"></span>` : signe(x.Z);
      if (inc.includes('s')) symbole = x;
      return `<span class="nuc-esp">${k}${noyau(A, Z, inc.includes('s') ? '<span class="nuc-trou">?</span>' : x.s)}</span>`;
    }).join(PLUS)).join(FLECHE)}</span>`;
    ligne.querySelectorAll('[data-c]').forEach(s => {
      const [c, i, q] = s.dataset.c.split('|');
      const ch = champ({ petit: true, signe: q === 'Z', aria: { A: 'Nombre de nucléons A', Z: 'Numéro atomique Z', k: 'Coefficient x' }[q] });
      ch.el.classList.add('nuc-case-' + q);
      s.replaceWith(ch.el);
      ch.input.addEventListener('input', () => { api.effacer(); ch.el.classList.remove('ko'); });
      ch.input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); valider(); } });
      cases.push({ x: cotes[c][+i], c, q, ch });
    });

    // étapes de l'outil, dans l'ordre
    const etapes = [];
    if (cases.length) etapes.push('nombres');
    if (symbole) etapes.push('symbole');
    if (def.reperer) etapes.push('reperer');
    if (def.classer) etapes.push('classer');
    let phase = null, bVal = null, grille = null, consigneRep = null, ctxClasse = null;
    const faites = new Set();
    function suivante() {
      // première étape : pas de défilement (l'outil vient d'être affiché, par exemple par « Afficher tout le cours »)
      const debut = !phase;
      if (phase) faites.add(phase);
      phase = etapes.find(e => !faites.has(e)) || 'fin';
      if (phase === 'symbole') choisir();
      else if (phase === 'reperer') reperer();
      else if (phase === 'classer') classer();
      else if (phase === 'fin') { api.reussi(); return; }
      if (!debut && phase !== 'nombres') setTimeout(() => { const s = suite.lastElementChild; if (s) s.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, 80);
    }

    /* 1. les nombres, par conservation de A et de Z */
    const val = (x, q, vals) => { const ca = cases.find(u => u.x === x && u.q === q); return ca ? vals.get(ca) : x[q]; };
    const somme = (c, q, vals) => lesNoyaux(cotes[c]).reduce((s, x) => s + val(x, 'k', vals) * val(x, q, vals), 0);
    // la somme écrite : 94 + 140 + 2 × 1
    const sommeTxt = (c, q, vals) => lesNoyaux(cotes[c]).map((x, j) => {
      const k = val(x, 'k', vals), v = val(x, q, vals), vt = v < 0 ? `(${signe(v)})` : String(v);
      return k > 1 || (x.inc || '').includes('k') ? `${k} × ${vt}` : (j && v < 0 ? vt : signe(v));
    }).join(' + ');
    const nomCote = c => (c === 'g' ? 'à gauche' : 'à droite');
    // « 1 + 235 = 236 », ou « 60 » s'il n'y a qu'un terme
    const ecrSomme = (c, q, vals, gras) => {
      const t = sommeTxt(c, q, vals), v = signe(somme(c, q, vals)), vb = gras ? `<b>${v}</b>` : v;
      return /[+×]/.test(t) ? `${t} = ${vb}` : vb;
    };
    function valider() {
      if (api.fini() || phase !== 'nombres') return;
      const vals = new Map();
      for (const ca of cases) {
        const v = lire(ca.ch.input.value);
        if (isNaN(v) || !Number.isInteger(v)) { secouer(ligne); api.message('Complète chaque case avec un nombre entier.'); return; }
        vals.set(ca, v);
      }
      const ok = cases.map(ca => vals.get(ca) === ca.x[ca.q]);
      if (ok.every(Boolean)) {
        cases.forEach(ca => { ca.ch.desactiver(true); ca.ch.el.classList.remove('ko'); });
        if (bVal) bVal.fermer();
        suivante();
        return;
      }
      cases.forEach((ca, j) => ca.ch.el.classList.toggle('ko', !ok[j]));
      api.erreur(diagnostic(vals, ok));
      secouer(ligne);
    }
    function diagnostic(vals, ok) {
      // A et Z inversés
      if (cases.some(ca => ca.q === 'A' && vals.get(ca) === ca.x.Z && cases.some(u => u.x === ca.x && u.q === 'Z' && vals.get(u) === ca.x.A))) {
        return 'Tu as inversé A et Z : A, en haut, est le nombre de <b>nucléons</b> ; Z, en bas, le nombre de <b>protons</b>.';
      }
      const faux = q => cases.find((ca, j) => ca.q === q && !ok[j]);
      const fA = faux('k') || faux('A'), fZ = faux('Z');
      const neutrons = c => lesNoyaux(cotes[c]).filter(x => x.s === 'n' && !(x.inc || '').includes('k')).reduce((s, x) => s + x.k, 0);
      if (fA) {
        const ici = fA.c, autre = ici === 'g' ? 'd' : 'g';
        const voulu = somme(autre, 'A', vals), obtenu = somme(ici, 'A', vals);
        let h = `Conservation de A (nombre de nucléons) : la somme des A ${nomCote(autre)} vaut ${ecrSomme(autre, 'A', vals, true)} ; ${nomCote(ici)}, avec tes nombres, elle vaut ${ecrSomme(ici, 'A', vals)}.`;
        if (neutrons(autre) && obtenu === voulu - neutrons(autre)) h += ` N'oublie pas ${neutrons(autre) > 1 ? 'les neutrons' : 'le neutron'} ${nomCote(autre)} : chaque neutron compte pour 1 nucléon.`;
        else if (fA.q === 'k') h += fA.x.s === 'n' ? ' Chaque neutron compte pour A = 1 : x neutrons comptent pour x × 1.' : ` Chaque noyau ${lisible(noyau(fA.x.A, fA.x.Z, fA.x.s))} compte pour A = ${fA.x.A} : x noyaux comptent pour x × ${fA.x.A}.`;
        return h;
      }
      if (fZ) {
        const ici = fZ.c, autre = ici === 'g' ? 'd' : 'g';
        let h = `Conservation de Z (nombre de charge) : la somme des Z ${nomCote(autre)} vaut ${ecrSomme(autre, 'Z', vals, true)} ; ${nomCote(ici)}, avec tes nombres, elle vaut ${ecrSomme(ici, 'Z', vals)}.`;
        if (lesNoyaux(def.g.concat(def.d)).some(x => x.s === 'n')) h += ' Le neutron compte pour Z = 0 (aucun proton).';
        if (lesNoyaux(def.g.concat(def.d)).some(x => x.s === 'e')) h += ' Attention au signe : l\'électron compte pour Z = −1, le positron pour Z = +1.';
        return h;
      }
      return 'Vérifie tes nombres.';
    }

    /* 2. le symbole : particule d'après A et Z, ou élément d'après Z (extrait de la classification) */
    function choisir() {
      const x = symbole, part = particuleDe(x);
      grille = el('div', 'nuc-choixs');
      if (part) {
        grille.innerHTML = `<p class="nuc-choixs-t">Quelle particule a A = ${x.A} et Z = ${signe(x.Z)} ?</p><div class="ph-choix">${
          Object.keys(PARTICULES).map(k => `<button type="button" class="btn-secondary" data-k="${k}">${lisible(noyau(PARTICULES[k].A, PARTICULES[k].Z, PARTICULES[k].s))}&nbsp; ${PARTICULES[k].nom}</button>`).join('')}</div>`;
      } else {
        // extrait de 12 éléments consécutifs contenant Z (à une place au hasard)
        const nb = 12, debut = Math.max(1, Math.min(ELEMENTS.length - nb, x.Z - entre(2, nb - 3)));
        let cs12 = '';
        for (let z = debut; z < debut + nb; z++) cs12 += `<button type="button" class="nuc-elt" data-z="${z}" aria-label="${nomDe(z)}, Z = ${z}"><span class="nuc-elt-z">${z}</span><span class="nuc-elt-s">${symboleDe(z)}</span><span class="nuc-elt-n">${nomDe(z)}</span></button>`;
        grille.innerHTML = `<p class="nuc-choixs-t">Extrait de la classification : trouve l'élément de numéro atomique Z = ${x.Z}.</p><div class="nuc-elts">${cs12}</div>`;
      }
      suite.appendChild(grille);
      grille.querySelectorAll('button').forEach(b => {
        b.onclick = () => {
          if (api.fini() || b.disabled || phase !== 'symbole') return;
          const bon = part ? b.dataset.k === part : +b.dataset.z === x.Z;
          if (bon) { b.classList.add('juste'); remplir(); suivante(); return; }
          b.classList.add('faux'); b.disabled = true;
          if (part) {
            const p = PARTICULES[b.dataset.k];
            api.erreur(`${lisible(noyau(p.A, p.Z, p.s))} a A = ${p.A} et Z = ${signe(p.Z)}. Compare avec les nombres trouvés : A = ${x.A} et Z = ${signe(x.Z)}.`);
          } else api.erreur(`${cap(nomDe(+b.dataset.z))} a pour numéro atomique Z = ${b.dataset.z}. C'est Z (le nombre de protons) qui fixe l'élément : cherche Z = ${x.Z}.`);
        };
      });
    }
    function remplir() {
      const t = ligne.querySelector('.nuc-trou');
      if (t) { t.textContent = symbole.s; t.classList.add('trouve'); }
      if (grille) grille.querySelectorAll('button').forEach(b => { b.disabled = true; });
    }

    /* 3. entourer le plus grand nombre de nucléons : chaque A devient un bouton */
    function reperer() {
      ligne.innerHTML = `<span class="nuc-eq">${['g', 'd'].map(c => cotes[c].map(x => (x === 'γ' ? ecrire(x)
        : `<span class="nuc-esp">${coef(x.k)}${noyau(`<button type="button" class="nuc-a-b" data-a="${x.A}" aria-label="A = ${x.A}">${x.A}</button>`, x.Z, x.s)}</span>`)).join(PLUS)).join(FLECHE)}</span>`;
      ligne.classList.add('reperer');
      consigneRep = el('p', 'nuc-choixs-t', 'Repère le plus grand nombre de nucléons A : touche-le dans l\'équation.');
      suite.appendChild(consigneRep);
      ligne.querySelectorAll('.nuc-a-b').forEach(b => {
        b.onclick = () => {
          if (api.fini() || phase !== 'reperer' || b.disabled) return;
          if (+b.dataset.a === a.max) { entourer(); suivante(); return; }
          b.classList.add('faux');
          api.erreur(`${b.dataset.a} n'est pas le plus grand : compare les nombres du haut (A) de tous les noyaux, à gauche et à droite de la flèche.`);
        };
      });
    }
    function entourer() {
      ligne.querySelectorAll('.nuc-a-b').forEach(b => { b.disabled = true; b.classList.remove('faux'); if (+b.dataset.a === a.max) b.classList.add('entoure'); });
      if (consigneRep) consigneRep.innerHTML = `Le plus grand nombre de nucléons, <b>${a.max}</b>, est ${a.maxG > a.maxD ? '<b>à gauche</b>' : a.maxD > a.maxG ? '<b>à droite</b>' : '<b>le même à gauche et à droite</b>'}${a.reactifs === 1 ? ', avec <b>un seul réactif</b>' : ''}.`;
    }

    /* 4. fission, fusion ou radioactivité */
    function classer() {
      const p = partieClasse(def.g, def.d);
      const z = el('div', 'nuc-classe');
      z.innerHTML = '<p class="nuc-choixs-t">Fission, fusion ou radioactivité ?</p><div></div><p class="nuc-explic" hidden></p>';
      suite.appendChild(z);
      const expl = z.querySelector('.nuc-explic');
      const montrerExpl = () => { expl.innerHTML = explication(a); expl.hidden = false; };
      ctxClasse = PARTIES.choix(z.querySelector('div'), p, {
        fini: () => api.fini() || phase !== 'classer',
        erreur: h => api.erreur(h),
        reussi: () => { montrerExpl(); suivante(); },
      });
      ctxClasse.expl = montrerExpl;
    }

    if (cases.length) { bVal = boutonValider(suite); bVal.onclick = valider; }
    suivante();
    return {
      montrer() {
        cases.forEach(ca => { ca.ch.input.value = signe(ca.x[ca.q]); ca.ch.desactiver(true); ca.ch.el.classList.remove('ko'); });
        if (bVal) bVal.fermer();
        if (symbole) {
          if (!grille) choisir();
          const b = grille.querySelector(particuleDe(symbole) ? `[data-k="${particuleDe(symbole)}"]` : `[data-z="${symbole.Z}"]`);
          if (b) b.classList.add('juste');
          remplir();
        }
        if (def.reperer) { if (!consigneRep) reperer(); entourer(); }
        if (def.classer) { if (!ctxClasse) classer(); ctxClasse.montrer(); ctxClasse.expl(); }
        phase = 'fin';
      },
    };
  }
  // correction rédigée d'une équation à trous : une ligne par loi de conservation utilisée,
  // « A : 1 + 235 = 94 + 140 + x × 1, donc x = 2 », puis l'élément ou la particule trouvés
  function redaction(g, d) {
    const tous = lesNoyaux(g.concat(d)), inc = x => x.inc || '';
    const terme = (x, q) => {
      const k = inc(x).includes('k') ? 'x' : x.k, v = inc(x).includes(q) ? q : (x[q] < 0 ? `(${signe(x[q])})` : x[q]);
      return k === 1 ? String(v) : (k === 'x' ? `x × ${v}` : `${k} × ${v}`);
    };
    const cote = (l, q) => lesNoyaux(l).map(x => terme(x, q)).join(' + ');
    const h = [];
    const inconnueA = tous.find(x => inc(x).includes('k') || inc(x).includes('A'));
    if (inconnueA) {
      const nomI = inc(inconnueA).includes('k') ? 'x' : 'A', v = nomI === 'x' ? inconnueA.k : inconnueA.A;
      h.push(`A : ${cote(g, 'A')} = ${cote(d, 'A')}, donc ${nomI} = <span class="c">${v}</span>`);
    }
    const inconnueZ = tous.find(x => inc(x).includes('Z'));
    if (inconnueZ) h.push(`Z : ${cote(g, 'Z')} = ${cote(d, 'Z')}, donc Z = <span class="c">${signe(inconnueZ.Z)}</span>`);
    const sym = tous.find(x => inc(x).includes('s'));
    let fin = '';
    if (sym) {
      const p = particuleDe(sym);
      fin = p ? `<p>A = ${sym.A} et Z = ${signe(sym.Z)} : c'est un ${PARTICULES[p].nom} ${lisible(noyau(sym.A, sym.Z, sym.s))}.</p>`
        : `<p>Z = ${sym.Z} : c'est l'élément ${nomDe(sym.Z)}, ${lisible(noyau(sym.A, sym.Z, sym.s))}.</p>`;
    }
    const sans = l => l.map(x => (x === 'γ' ? x : Object.assign({}, x, { inc: '' })));
    return h.map(t => `<p class="ph-calc">${t}</p>`).join('') + fin + `<p class="ph-calc">${lisible(equation(sans(g), sans(d)))}</p>`;
  }
  const partieReaction = (def, opts) => Object.assign({ type: 'perso', outil: 'reaction', def, monter: (z, api) => outilReaction(z, def, api) }, opts);

  /* ============================================================
     MASSES ET NOMBRES DES CALCULS
     ============================================================ */
  // masse écrite comme dans l'énoncé : '3,902170e-25' → { v, t: '3,902170 × 10⁻²⁵', p: 1e-31 (dernier chiffre) } ;
  // '234,99332' (en u) → { v, t: '234,99332', p: 1e-5 }
  function masse(s) {
    const [mant, ex] = String(s).split('e');
    const dec = (mant.split(',')[1] || '').length, e = ex ? +ex : 0;
    return { v: parseFloat(mant.replace(',', '.')) * Math.pow(10, e), t: ex ? `${mant} × 10<sup>${signe(e)}</sup>` : mant, p: Math.pow(10, e - dec) };
  }
  // valeur écrite au chiffre près p (somme de masses) : en écriture scientifique (kg) ou décimale (u)
  function ecrireP(v, p, scient) {
    if (!scient) return fmt(v, Math.max(0, Math.round(-Math.log10(p))));
    const e = Math.floor(Math.log10(Math.abs(v)) + 1e-12), d = Math.max(0, Math.round(e - Math.log10(p)));
    return `${fmt(v / Math.pow(10, e), d)} × 10<sup>${signe(e)}</sup>`;
  }
  // écriture scientifique avec au plus c chiffres significatifs, sans zéros inutiles : −9,6 × 10⁻³⁰
  function sciCourt(v, c) {
    let e = Math.floor(Math.log10(Math.abs(v)) + 1e-12), m = +(v / Math.pow(10, e)).toFixed((c || 4) - 1);
    if (Math.abs(m) >= 10) { m /= 10; e++; }
    return `${fmt(m)} × 10<sup>${signe(e)}</sup>`;
  }

  /* ============================================================
     OUTIL : TABLEAU DU DÉFAUT DE MASSE
     def = { g: [{ x: espèce, m: masse(…) }], d: [ … ], unite: 'kg' | 'u', etapes }
       etapes : parmi 'coefs' (coefficient de chaque ligne), 'simplifier' (neutrons des deux côtés),
                'sommes' (somme de chaque colonne, en u seulement), 'dm' (défaut de masse) ;
                par défaut ['coefs', 'simplifier', 'dm'] en kg, ['coefs', 'sommes', 'dm'] en u.
     Une colonne par côté de l'équation (réactifs, produits), une ligne par espèce :
     coefficient × masse ; somme de chaque colonne ; Δm = m produits − m réactifs.
     ============================================================ */
  function outilDefaut(zone, def, api) {
    const U = def.unite || 'kg', enKg = U === 'kg';
    const etapesDem = def.etapes || (enKg ? ['coefs', 'simplifier', 'dm'] : ['coefs', 'sommes', 'dm']);
    const cols = { g: def.g, d: def.d };
    // chiffre le plus fin des masses d'une colonne : la somme est écrite avec tous ses chiffres (comme à la calculatrice)
    const prec = l => l.reduce((p, x) => Math.min(p, x.m.p), 1);
    const S = { g: def.g.reduce((s, l) => s + l.x.k * l.m.v, 0), d: def.d.reduce((s, l) => s + l.x.k * l.m.v, 0) };
    const P = { g: prec(def.g), d: prec(def.d) };
    const dm = S.d - S.g;
    // espèce présente des deux côtés (les neutrons d'une fission)
    const meme = (u, v) => u.A === v.A && u.Z === v.Z && u.s === v.s;
    const double = def.d.find(l => def.g.some(m => meme(m.x, l.x)));
    const doubleG = double ? def.g.find(m => meme(m.x, double.x)) : null;
    const etapes = etapesDem.filter(e => (e === 'simplifier' ? !!double : e === 'sommes' ? !enKg : true));
    const ecrireS = (v, p) => ecrireP(v, p, enKg);
    const box = el('div', 'nuc-tdm-box');
    const colonne = (c, titre) => `<div class="nuc-tdm-col"><p class="nuc-tdm-t">${titre}</p>${cols[c].map((l, i) => `
        <div class="nuc-tdm-l">
          <div class="nuc-tdm-esp">${etapes.includes('coefs') ? `<span data-k="${c}|${i}"></span>` : `<span class="nuc-tdm-k">${l.x.k}</span>`}<span class="nuc-tdm-x">×</span><span>${mDe(l.x)}</span></div>
          <div class="nuc-tdm-m">${mDe(l.x)} = ${l.m.t}${ESP}${U}</div>
          <div class="nuc-tdm-p" hidden></div>
        </div>`).join('')}
        <div class="nuc-tdm-somme"><span class="nuc-tdm-sl">m<sub>${c === 'g' ? 'réactifs' : 'produits'}</sub> =</span> <span class="nuc-tdm-sv" data-s="${c}">…</span></div></div>`;
    box.innerHTML = `<div class="nuc-tdm-eq nuc-lisible">${equation(def.g.map(l => l.x), def.d.map(l => l.x))}</div>
      <div class="nuc-tdm">${colonne('g', 'Réactifs')}${colonne('d', 'Produits')}</div>
      <div class="nuc-tdm-suite"></div>`;
    zone.appendChild(box);
    const suite = box.querySelector('.nuc-tdm-suite');
    const lignes = Array.from(box.querySelectorAll('.nuc-tdm-l'));
    let phase = null, bVal = null;
    const faites = new Set();
    const champsK = [];
    box.querySelectorAll('[data-k]').forEach(s => {
      const [c, i] = s.dataset.k.split('|');
      const ch = champ({ petit: true, signe: false, aria: 'Coefficient' });
      s.replaceWith(ch.el);
      ch.input.addEventListener('input', () => { api.effacer(); ch.el.classList.remove('ko'); });
      ch.input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); if (bVal) bVal.onclick(); } });
      champsK.push({ l: cols[c][+i], ch });
    });

    // lignes « coefficient × masse = … » une fois les coefficients connus
    function produits() {
      let j = 0;
      ['g', 'd'].forEach(c => cols[c].forEach(l => {
        const p = lignes[j++].querySelector('.nuc-tdm-p');
        // coefficient 1 : la masse de la ligne au-dessus suffit
        if (l.x.k > 1) { p.innerHTML = `${l.x.k} × ${l.m.t} = <b>${ecrireS(l.x.k * l.m.v, l.m.p)}</b>${ESP}${U}`; p.hidden = false; }
      }));
    }
    function sommes() {
      ['g', 'd'].forEach(c => { box.querySelector(`[data-s="${c}"]`).innerHTML = `<b>${ecrireS(S[c], P[c])}</b>${ESP}${U}`; });
    }
    // expression simplifiée : Δm = m(Sr) + m(Xe) + 2 × m(n) − m(U)
    function expression() {
      const kd = double ? double.x.k - doubleG.x.k : 0;
      const plus = def.d.filter(l => l !== double).map(l => (l.x.k > 1 ? `${l.x.k} × ` : '') + mDe(l.x));
      if (double && kd > 0) plus.push((kd > 1 ? `${kd} × ` : '') + mDe(double.x));
      const moins = def.g.filter(l => l !== doubleG).map(l => (l.x.k > 1 ? `${l.x.k} × ` : '') + mDe(l.x));
      return `Δm = ${plus.join(' + ')} − ${moins.join(' − ')}`;
    }
    function suivante() {
      const debut = !phase;                 // première étape : pas de défilement
      if (phase) faites.add(phase);
      if (bVal) { bVal.fermer(); bVal = null; }
      phase = etapes.find(e => !faites.has(e)) || 'fin';
      if (phase === 'fin') { resultat(); api.reussi(); return; }
      ({ coefs: etapeCoefs, simplifier: etapeSimplifier, sommes: etapeSommes, dm: etapeDm })[phase]();
      if (!debut && phase !== 'coefs') setTimeout(() => { const s = suite.lastElementChild; if (s) s.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, 80);
    }

    /* 1. coefficients */
    function etapeCoefs() {
      bVal = boutonValider(suite);
      bVal.onclick = () => {
        if (api.fini() || phase !== 'coefs') return;
        const vs = champsK.map(c => lire(c.ch.input.value));
        if (vs.some(v => isNaN(v) || !Number.isInteger(v))) { secouer(box); api.message('Écris le coefficient de chaque ligne (1 s\'il n\'y a pas de nombre devant l\'espèce).'); return; }
        const ok = champsK.map((c, j) => vs[j] === c.l.x.k);
        champsK.forEach((c, j) => c.ch.el.classList.toggle('ko', !ok[j]));
        if (ok.every(Boolean)) { champsK.forEach(c => c.ch.desactiver(true)); produits(); suivante(); return; }
        const f = champsK.find((c, j) => !ok[j]);
        api.erreur(f.l.x.k > 1 ? `Le coefficient est le nombre écrit devant l'espèce dans l'équation : ${f.l.x.k} ${lisible(noyau(f.l.x.A, f.l.x.Z, f.l.x.s))}, donc ${f.l.x.k} × ${mDe(f.l.x)}.`
          : 'Quand aucun nombre n\'est écrit devant l\'espèce, son coefficient est 1.');
        secouer(box);
      };
    }

    /* 2. neutrons des deux côtés : ils se simplifient en partie */
    let simpl = null;
    function etapeSimplifier() {
      const kd = double.x.k, kg = doubleG.x.k, att = kd - kg;
      simpl = el('div', 'nuc-tdm-etape');
      simpl.innerHTML = `<p>${cap(PARTICULES[particuleDe(double.x)] ? PARTICULES[particuleDe(double.x)].nom + 's' : 'noyaux')} des deux côtés : ${kd} × ${mDe(double.x)} dans les produits, ${kg} × ${mDe(double.x)} dans les réactifs. Dans Δm = m<sub>produits</sub> − m<sub>réactifs</sub>, combien de ${mDe(double.x)} reste-t-il ?</p>
        <div class="ph-valeur"><span class="ph-lab">Δm contient</span><span data-ch></span><span class="ph-unite">× ${mDe(double.x)}</span></div><p class="nuc-tdm-expr" hidden></p>`;
      suite.appendChild(simpl);
      const ch = champ({ petit: true, aria: 'Nombre de masses du neutron dans Δm' });
      simpl.querySelector('[data-ch]').replaceWith(ch.el);
      simpl.ch = ch;
      ch.input.addEventListener('input', () => api.effacer());
      ch.input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); bVal.onclick(); } });
      bVal = boutonValider(suite);
      bVal.onclick = () => {
        if (api.fini() || phase !== 'simplifier') return;
        const v = lire(ch.input.value);
        if (isNaN(v) || !Number.isInteger(v)) { secouer(simpl); api.message('Écris un nombre entier.'); return; }
        if (v === att) { ch.desactiver(true); montrerExpr(); suivante(); return; }
        api.erreur(v === kd + kg ? `Δm = m<sub>produits</sub> − m<sub>réactifs</sub> : on soustrait ${mDe(double.x)} des réactifs, ${kd} − ${kg}.`
          : v === kd ? `Retire aussi ${kg > 1 ? `les ${kg}` : 'celui'} des réactifs : ${kd} − ${kg}.`
          : v === -att ? `Δm = produits − réactifs : ${kd} − ${kg}, pas l'inverse.` : `Produits moins réactifs : ${kd} − ${kg}.`);
        secouer(simpl);
      };
    }
    function montrerExpr() { const e = simpl.querySelector('.nuc-tdm-expr'); e.innerHTML = expression(); e.hidden = false; }

    /* 3. somme de chaque colonne (en u) */
    let som = null;
    function etapeSommes() {
      som = { g: champ({ petit: false, signe: false, aria: 'Masse des réactifs' }), d: champ({ petit: false, signe: false, aria: 'Masse des produits' }) };
      ['g', 'd'].forEach(c => {
        const s = box.querySelector(`[data-s="${c}"]`);
        s.innerHTML = '';
        s.appendChild(som[c].el); s.appendChild(el('span', 'nuc-tdm-u', ESP + U));
        som[c].input.addEventListener('input', () => { api.effacer(); som[c].el.classList.remove('ko'); });
        som[c].input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); bVal.onclick(); } });
      });
      const t = el('p', 'nuc-choixs-t', 'Additionne chaque colonne (coefficient × masse), puis Valider.');
      suite.appendChild(t);
      bVal = boutonValider(suite);
      bVal.onclick = () => {
        if (api.fini() || phase !== 'sommes') return;
        const v = { g: lire(som.g.input.value), d: lire(som.d.input.value) };
        if (isNaN(v.g) || isNaN(v.d)) { secouer(box); api.message('Écris la somme de chaque colonne.'); return; }
        const ok = { g: Math.abs(v.g - S.g) <= P.g * 2 + 1e-12, d: Math.abs(v.d - S.d) <= P.d * 2 + 1e-12 };
        ['g', 'd'].forEach(c => som[c].el.classList.toggle('ko', !ok[c]));
        if (ok.g && ok.d) { ['g', 'd'].forEach(c => som[c].desactiver(true)); suivante(); return; }
        const c = ok.g ? 'd' : 'g', sans = cols[c].reduce((s, l) => s + l.m.v, 0);
        api.erreur(Math.abs(v[c] - sans) <= P[c] * 2 + 1e-12 ? 'N\'oublie pas les coefficients : chaque masse est multipliée par son coefficient avant d\'additionner.'
          : `Additionne les lignes de la colonne des ${c === 'g' ? 'réactifs' : 'produits'} (coefficient × masse).`);
        secouer(box);
      };
    }

    /* 4. le défaut de masse */
    let chDm = null;
    function etapeDm() {
      const d = el('div', 'nuc-tdm-etape');
      d.innerHTML = `<p class="nuc-tdm-f">Δm = m<sub>produits</sub> − m<sub>réactifs</sub></p><div class="ph-valeur"><span class="ph-lab">Δm =</span><span data-ch></span><span class="ph-unite">${U}</span></div>`;
      suite.appendChild(d);
      const zc = d.querySelector('[data-ch]');
      if (enKg) {
        // écriture scientifique a × 10ⁿ
        const s = el('span', 'ph-sci'), a = champ({ petit: true, aria: 'Nombre devant la puissance de 10' }), n = champ({ petit: true, aria: 'Exposant de la puissance de 10' });
        n.el.classList.add('ph-exposant');
        s.appendChild(a.el); s.appendChild(el('span', 'ph-x10', '× 10')); s.appendChild(n.el);
        zc.replaceWith(s);
        chDm = { a, n, lireV() { const va = lire(a.input.value), vn = lire(n.input.value); return isNaN(va) || isNaN(vn) || !Number.isInteger(vn) ? NaN : va * Math.pow(10, vn); },
          desactiver() { a.desactiver(true); n.desactiver(true); } };
        [a, n].forEach(c => { c.input.addEventListener('input', () => api.effacer()); c.input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); bVal.onclick(); } }); });
      } else {
        const c = champ({ aria: 'Défaut de masse en u' });
        zc.replaceWith(c.el);
        chDm = { c, lireV: () => lire(c.input.value), desactiver() { c.desactiver(true); } };
        c.input.addEventListener('input', () => api.effacer());
        c.input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); bVal.onclick(); } });
      }
      bVal = boutonValider(suite);
      bVal.onclick = () => {
        if (api.fini() || phase !== 'dm') return;
        const v = chDm.lireV();
        if (isNaN(v)) { secouer(d); api.message(enKg ? 'Écris Δm en écriture scientifique : le nombre, puis l\'exposant (entier, avec ± s\'il est négatif).' : 'Écris un nombre (avec une virgule).'); return; }
        if (proche(v, dm, enKg ? .01 : .005)) { chDm.desactiver(); suivante(); return; }
        api.erreur(diagDm(v));
        secouer(d);
      };
    }
    // diagnostic du défaut de masse
    function diagDm(v) {
      const sansCoef = def.d.reduce((s, l) => s + l.m.v, 0) - def.g.reduce((s, l) => s + l.m.v, 0);
      const sansNg = doubleG ? dm + doubleG.x.k * doubleG.m.v : null;
      if (proche(v, -dm, .01)) return 'Tu as calculé m<sub>réactifs</sub> − m<sub>produits</sub>. C\'est l\'inverse : Δm = m<sub>produits</sub> − m<sub>réactifs</sub>, qui est négatif ici (de la masse disparaît).';
      if (Math.abs(sansCoef - dm) > Math.abs(dm) * .01 && proche(v, sansCoef, .01)) return 'Tu as oublié un coefficient : multiplie chaque masse par le nombre écrit devant l\'espèce (par exemple 2 × m(n)).';
      if (sansNg != null && proche(v, sansNg, .01)) return `Tu as oublié ${mDe(doubleG.x)} des réactifs : il faut le retirer (le neutron qui percute le noyau).`;
      if (enKg && proche(v, dm / 1.660539e-27, .01)) return 'Les masses sont en kg : Δm aussi.';
      if (!enKg && proche(v, dm * 1.660539e-27, .01)) return 'Les masses sont en u : donne Δm en u (la conversion en kg vient ensuite).';
      if (v * dm > 0) { const k = Math.log10(v / dm); if (Math.abs(k - Math.round(k)) < .005) return 'Vérifie la puissance de 10.'; }
      return 'Fais la somme de chaque colonne (coefficient × masse), puis la différence : produits moins réactifs.';
    }
    // bilan : sommes et Δm écrits dans le tableau
    function resultat() {
      sommes();
      if (!suite.querySelector('.nuc-tdm-res')) {
        const r = el('p', 'nuc-tdm-res');
        r.innerHTML = `Δm = ${ecrireS(S.d, P.d)} − ${ecrireS(S.g, P.g)} = <b>${enKg ? sciCourt(dm, 5) : fmt(dm, Math.round(-Math.log10(Math.min(P.g, P.d))))}${ESP}${U}</b>. Δm est négatif : la masse des produits est plus petite que celle des réactifs.`;
        suite.appendChild(r);
      }
    }
    if (!etapes.includes('coefs')) produits();
    suivante();
    return {
      montrer() {
        champsK.forEach(c => { c.ch.input.value = String(c.l.x.k); c.ch.desactiver(true); c.ch.el.classList.remove('ko'); });
        produits();
        if (double && etapes.includes('simplifier')) {
          if (!simpl) { phase = 'simplifier'; etapeSimplifier(); }
          simpl.ch.input.value = signe(double.x.k - doubleG.x.k); simpl.ch.desactiver(true); montrerExpr();
        }
        if (etapes.includes('dm')) {
          if (!chDm) { phase = 'dm'; etapeDm(); }
          if (enKg) {
            let e = Math.floor(Math.log10(Math.abs(dm)) + 1e-12), m = +(dm / Math.pow(10, e)).toFixed(4);
            if (Math.abs(m) >= 10) { m /= 10; e++; }
            chDm.a.input.value = fmt(m); chDm.n.input.value = signe(e);
          } else chDm.c.input.value = fmt(dm, Math.round(-Math.log10(Math.min(P.g, P.d))));
          chDm.desactiver();
        }
        if (bVal) { bVal.fermer(); bVal = null; }
        phase = 'fin';
        resultat();
      },
    };
  }
  // le même tableau déjà rempli, sans saisie (exemples du cours, fiches)
  function tableauDefaut(def) {
    const z = el('div', 'nuc-tdm-statique');
    const ctx = outilDefaut(z, def, { fini: () => false, effacer() {}, message() {}, erreur() {}, reussi() {} });
    ctx.montrer();
    z.querySelectorAll('.ph-sci').forEach(s => {
      const [a, n] = s.querySelectorAll('input');
      s.replaceWith(el('b', null, `${a.value} × 10<sup>${n.value}</sup>`));
    });
    z.querySelectorAll('.ph-champ-box').forEach(b => b.replaceWith(el('b', 'nuc-tdm-k', b.querySelector('input').value)));
    z.querySelectorAll('.er-actions').forEach(b => b.remove());
    return z.innerHTML;
  }
  const partieDefaut = (def, opts) => Object.assign({ type: 'perso', outil: 'defaut', def, monter: (z, api) => outilDefaut(z, def, api) }, opts);

  /* ============================================================
     DIAGNOSTICS DES CALCULS (énergie, conversions, échantillon)
     ============================================================ */
  const C = 3.00e8, C_EXACT = 299792458, MEV = 1.60e-13, EV = 1.602177e-19, U_KG = 1.660539e-27, PC = 42e6;
  const egal = (a, b, r) => b !== 0 && Math.abs(a - b) <= (r || .02) * Math.abs(b);
  // seule la puissance de 10 est fausse
  const decale = (v, b) => {
    if (!v || !b || v * b < 0) return false;
    const k = Math.log10(v / b);
    return Math.abs(k - Math.round(k)) < .01 && Math.round(k) !== 0;
  };
  // E = |Δm| × c²
  function diagE(v, dm, c) {
    const E = Math.abs(dm) * c * c;
    if (v < 0 && egal(-v, E)) return 'E = |Δm| × c² : on prend la valeur absolue de Δm. L\'énergie libérée est positive.';
    if (egal(Math.abs(v), Math.abs(dm) * c)) return 'Tu n\'as pas élevé c au carré : E = |Δm| × c².';
    if (egal(Math.abs(v), Math.abs(dm) * c * c / 1.660539e-27) || egal(Math.abs(v), Math.abs(dm) / 1.660539e-27 * c * c)) return 'Δm doit être en kg.';
    if (decale(Math.abs(v), E)) return 'Vérifie la puissance de 10 : Δm en kg, c en m·s<sup>−1</sup>, (10<sup>8</sup>)<sup>2</sup> = 10<sup>16</sup>.';
    return 'E = |Δm| × c², avec Δm en kg et c en m·s<sup>−1</sup>.';
  }
  // J → MeV
  function diagMeV(v, EJ) {
    if (egal(v, EJ / EV) || egal(v, EJ / MEV * 1e6)) return 'Ça, c\'est l\'énergie en eV. 1 MeV = 10<sup>6</sup> eV : divise encore par 10<sup>6</sup>.';
    if (egal(v, EJ * MEV) || egal(v, EJ * EV)) return 'Pour passer des joules aux MeV, on divise par 1,60 × 10<sup>−13</sup> J (1 MeV = 1,60 × 10<sup>−13</sup> J) : on ne multiplie pas.';
    if (decale(v, EJ / MEV)) return 'Vérifie la puissance de 10 : 1 MeV = 1,60 × 10<sup>−13</sup> J.';
    return 'E (en MeV) = E (en J) / 1,60 × 10<sup>−13</sup>.';
  }
  // MeV → J
  function diagJ(v, EM) {
    if (egal(v, EM / MEV)) return 'Des MeV aux joules, on multiplie par 1,60 × 10<sup>−13</sup> : on ne divise pas.';
    if (egal(v, EM * EV)) return 'Ça, c\'est la conversion des eV : 1 MeV = 10<sup>6</sup> eV = 1,60 × 10<sup>−13</sup> J.';
    if (decale(v, EM * MEV)) return 'Vérifie la puissance de 10 : 1 MeV = 1,60 × 10<sup>−13</sup> J.';
    return 'E (en J) = E (en MeV) × 1,60 × 10<sup>−13</sup>.';
  }
  // u → kg
  function diagKg(v, mu) {
    if (egal(Math.abs(v), Math.abs(mu) / U_KG)) return 'On multiplie par 1,660539 × 10<sup>−27</sup> kg (la masse de 1 u), on ne divise pas.';
    if (v * mu < 0) return 'Garde le signe de Δm : il est négatif.';
    if (decale(v, mu * U_KG)) return 'Vérifie la puissance de 10 : 1 u = 1,660539 × 10<sup>−27</sup> kg.';
    return 'm (en kg) = m (en u) × 1,660539 × 10<sup>−27</sup>.';
  }
  // N = m / m(1 noyau), m de l'échantillon en g (écrite mt dans l'énoncé), m1 en kg
  function diagN(v, mg, m1, mt) {
    const N = mg * 1e-3 / m1;
    const enKg = mt && / g$/.test(mt) ? mt.replace(/ g$/, ' × 10<sup>−3</sup> kg') : `${sci(mg * 1e-3, 3)} kg`;
    if (egal(v, N * 1e3)) return `Convertis d'abord la masse de l'échantillon en kg : ${mt || fmt(mg) + ' g'} = ${enKg}. Les deux masses doivent être dans la même unité.`;
    if (egal(v, 1 / N) || egal(v, 1e-3 / N)) return 'N = m / m(1 noyau) : la masse de l\'échantillon divisée par la masse d\'un noyau, pas l\'inverse.';
    if (decale(v, N)) return 'Vérifie la puissance de 10 (les deux masses en kg).';
    return 'N = m / m(1 noyau), avec les deux masses en kg.';
  }
  // E = N × E(1 noyau)
  function diagEtot(v, N, E1) {
    if (egal(v, N / E1) || egal(v, E1 / N)) return 'On multiplie : E = N × E(1 réaction). Chaque noyau libère la même énergie.';
    if (decale(v, N * E1)) return 'Vérifie la puissance de 10 : 10<sup>a</sup> × 10<sup>b</sup> = 10<sup>a + b</sup>.';
    return 'E = N × E(1 réaction).';
  }
  // m(pétrole) = E / PC, PC = 42 MJ·kg⁻¹
  function diagPetrole(v, E) {
    const m = E / PC;
    if (egal(v, E / 42)) return 'PC = 42 MJ·kg<sup>−1</sup> = 42 × 10<sup>6</sup> J·kg<sup>−1</sup> : convertis les MJ en J.';
    if (egal(v, E * PC) || egal(v, PC / E)) return 'm = E / PC : on divise l\'énergie par le pouvoir calorifique.';
    if (egal(v, m / 1000)) return 'Ça, c\'est en tonnes : la réponse est demandée en kg (1 t = 1 000 kg).';
    if (decale(v, m)) return 'Vérifie la puissance de 10 : 42 MJ = 42 × 10<sup>6</sup> J.';
    return 'm = E / PC : 1 kg de pétrole libère 42 × 10<sup>6</sup> J.';
  }
  // activité = P / E(1 désintégration)
  function diagActivite(v, P, E1) {
    if (egal(v, E1 / P)) return 'A = P / E(1 désintégration) : la puissance divisée par l\'énergie d\'une désintégration, pas l\'inverse.';
    if (egal(v, P * E1)) return 'On divise : chaque seconde, la source libère P joules, et chaque désintégration en libère E.';
    if (decale(v, P / E1)) return 'Vérifie la puissance de 10.';
    return 'Nombre de désintégrations par seconde = P / E(1 désintégration).';
  }

  /* ============================================================
     FIGURES : fission, fusion (dessinées à la largeur disponible)
     ============================================================ */
  // amas de nucléons disposés en tournesol : nP protons (pleins), nN neutrons (cerclés)
  function amas(cx, cy, nP, nN, r) {
    const n = nP + nN;
    let s = '';
    for (let i = n - 1; i >= 0; i--) {
      const rho = r * .98 * Math.sqrt(i + .5), th = i * 2.39996;
      const proton = Math.floor((i + 1) * nP / n) > Math.floor(i * nP / n);
      s += `<circle cx="${f1(cx + rho * Math.cos(th))}" cy="${f1(cy + rho * Math.sin(th))}" r="${r}" class="${proton ? 'nuc-proton' : 'nuc-neutron'}"/>`;
    }
    return s;
  }
  const rayonAmas = (n, r) => r * .98 * Math.sqrt(n) + r;
  // flèche de (x1, y1) à (x2, y2)
  function fleche(x1, y1, x2, y2, cls) {
    const a = Math.atan2(y2 - y1, x2 - x1), L = 9, l = 4.5;
    const bx = x2 - L * Math.cos(a), by = y2 - L * Math.sin(a);
    return `<line x1="${f1(x1)}" y1="${f1(y1)}" x2="${f1(bx)}" y2="${f1(by)}" class="nuc-fig-fl${cls ? ' ' + cls : ''}"/><path d="M${f1(x2)},${f1(y2)} L${f1(bx - l * Math.sin(a))},${f1(by + l * Math.cos(a))} L${f1(bx + l * Math.sin(a))},${f1(by - l * Math.cos(a))} Z" class="nuc-fig-pointe${cls ? ' ' + cls : ''}"/>`;
  }
  // éclat « énergie »
  function eclat(cx, cy, R, r, avecTexte) {
    let d = '';
    for (let i = 0; i < 20; i++) { const a = i * Math.PI / 10, q = i % 2 ? r : R; d += (i ? 'L' : 'M') + f1(cx + q * Math.cos(a)) + ',' + f1(cy + q * Math.sin(a)); }
    return `<path d="${d}Z" class="nuc-energie"/>${avecTexte ? `<text x="${cx}" y="${cy + 4}" text-anchor="middle" class="nuc-fig-e">énergie</text>` : ''}`;
  }
  const txt = (x, y, t, cls, ancre) => `<text x="${f1(x)}" y="${f1(y)}" text-anchor="${ancre || 'middle'}" class="${cls || 'nuc-fig-t'}">${t}</text>`;
  const svgFig = (w, h, contenu, aria) => `<svg viewBox="0 0 ${w} ${h}" class="nuc-svg" role="img" aria-label="${aria}">${contenu}</svg>`;
  // fission : n + ²³⁵U → ⁹⁴Sr + ¹⁴⁰Xe + 2 n + énergie
  function dessinFission() {
    const r = 4.4;
    let s = '';
    s += `<circle cx="22" cy="112" r="6" class="nuc-neutron"/>` + txt(22, 96, 'neutron') + fleche(32, 112, 66, 112);
    s += amas(112, 112, 18, 24, r) + txt(112, 112 + rayonAmas(42, r) + 14, 'uranium 235');
    s += fleche(152, 112, 192, 112);
    s += eclat(296, 112, 34, 20, true);
    s += amas(232, 48, 7, 9, r) + txt(232, 48 + rayonAmas(16, r) + 13, 'strontium 94');
    s += amas(232, 176, 10, 14, r) + txt(232, 176 + rayonAmas(24, r) + 13, 'xénon 140');
    s += fleche(326, 92, 366, 66) + `<circle cx="376" cy="60" r="6" class="nuc-neutron"/>`;
    s += fleche(326, 132, 366, 158) + `<circle cx="376" cy="164" r="6" class="nuc-neutron"/>` + txt(376, 116, 'neutrons');
    return svgFig(400, 228, s, 'Fission : un neutron percute un noyau d\'uranium 235, qui se scinde en strontium 94 et xénon 140 en libérant deux neutrons et de l\'énergie');
  }
  // fusion : ²H + ³H → ⁴He + n + énergie
  function dessinFusion() {
    const r = 7;
    let s = '';
    s += amas(42, 48, 1, 1, r) + txt(42, 84, 'deutérium');
    s += amas(42, 152, 1, 2, r) + txt(42, 190, 'tritium');
    s += fleche(70, 60, 150, 92) + fleche(70, 140, 150, 112);
    s += eclat(196, 102, 46, 28, false) + amas(196, 102, 2, 2, r) + txt(196, 40, 'énergie', 'nuc-fig-e') + txt(196, 170, 'hélium 4');
    s += fleche(246, 102, 334, 102) + `<circle cx="352" cy="102" r="7" class="nuc-neutron"/>` + txt(352, 132, 'neutron libre');
    return svgFig(400, 200, s, 'Fusion : un noyau de deutérium et un noyau de tritium s\'associent en un noyau d\'hélium 4, en libérant un neutron et de l\'énergie');
  }
  // légende commune
  const legende = '<p class="nuc-legende"><span class="nuc-leg nuc-leg-p"></span> proton <span class="nuc-leg nuc-leg-n"></span> neutron</p>';
  const figFission = () => `<div class="nuc-figure">${dessinFission()}${legende}</div>`;
  const figFusion = () => `<div class="nuc-figure">${dessinFusion()}${legende}</div>`;

  /* ============================================================
     PLAN DE L'APPLICATION ET NAVIGATION (voir assets/sommaire.js)
     ============================================================ */
  const PLAN = [
    { n: 1, titre: 'Fission, fusion ou radioactivité ?', desc: 'Fission, fusion, reconnaître une réaction d\'après son équation, compléter une équation (A, Z, x)', fiche: 'fiche_1',
      sousModules: true,
      parties: [
        { nom: 'Fission et fusion', slug: 'reconnaitre', cours: 'module_1a_cours', noms: { cours: 'Cours : fission et fusion' } },
        { nom: 'Compléter une équation', slug: 'completer', cours: 'module_1b_cours', noms: { cours: 'Cours : compléter une équation' } },
        { nom: 'Fission, fusion ou radioactivité', questions: 'module_1_questions' }] },
    { n: 2, titre: 'Défaut de masse et énergie libérée', desc: 'Δm = m<sub>produits</sub> − m<sub>réactifs</sub>, tableau du défaut de masse, masses en u, E = |Δm| × c², joules et MeV', fiche: 'fiche_2',
      sousModules: true,
      parties: [
        { nom: 'Le défaut de masse', slug: 'defaut', cours: 'module_2a_cours', noms: { cours: 'Cours : le défaut de masse' } },
        { nom: 'L\'énergie libérée', slug: 'energie', cours: 'module_2b_cours', noms: { cours: 'Cours : l\'énergie libérée' } },
        { nom: 'Défaut de masse et énergie', questions: 'module_2_questions' }] },
    { n: 3, titre: 'Énergie d\'un échantillon', desc: 'Nombre de noyaux, énergie de m grammes de combustible, masse de pétrole équivalente, activité', fiche: 'fiche_3',
      sousModules: true,
      parties: [
        { nom: 'Nombre de noyaux et énergie', slug: 'echantillon', cours: 'module_3a_cours', noms: { cours: 'Cours : énergie d\'un échantillon' } },
        { nom: 'Pétrole et activité', slug: 'comparaison', cours: 'module_3b_cours', noms: { cours: 'Cours : comparaison avec le pétrole, activité' } },
        { nom: 'Énergie d\'un échantillon', questions: 'module_3_questions' }] },
    { n: 4, titre: 'Exercices', desc: 'Exercices 1 à 7 de la feuille : réactions, défaut de masse, énergie libérée, bombe H, sonde New Horizons', exercices: 'module_4', exNom: 'Exercices de la feuille', nbEx: 7 },
  ];
  window.SOM.init({ nom: 'Chapitre 13 : Énergie nucléaire', id: 'energie-nucleaire', cleEx: 'energie-nucleaire-exercices', plan: PLAN });
  const menu = cle => window.SOM.menu(cle);
  const accueil = zone => window.SOM.accueil(zone);
  const marquer = info => window.SOM.marquer(info);

  window.NUC = Object.assign(window.NUC || {}, {
    MOINS, fmt, cs, sci, lire, proche, fr, o, fq, el, secouer, melanger, hasard, entre, champ, boutonValider, PARTIES, versCours,
    question, serie, confettis, figure,
    ESP, signe, cap, ELEMENTS, symboleDe, nomDe, noyau, esp, neutron, electron, positron, helium, trou, equation, mDe, lisible, PARTICULES, particuleDe,
    analyse, TYPES, indicesClasse, explication, partieClasse, outilReaction, partieReaction, redaction,
    masse, ecrireP, sciCourt, outilDefaut, partieDefaut, tableauDefaut,
    C, C_EXACT, MEV, EV, U_KG, PC, egal, decale, diagE, diagMeV, diagJ, diagKg, diagN, diagEtot, diagPetrole, diagActivite,
    figFission, figFusion, fleche, eclat, amas, txt, svgFig,
    PLAN, menu, accueil, marquer,
  });
})();
