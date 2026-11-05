/* ============================================================
   Moteur de l'application « Chapitre 16 : Acides et bases »
   (Terminale STI2D ; moteur de questions repris de « Chapitre 15 :
   Oxydoréduction (piles et accumulateurs) » ; navigation commune
   assets/sommaire.js, cours avec assets/cours.js, schéma de la méthode
   avec assets/schema-methode.js, glisser-déposer avec assets/dragdrop.js)

   AB.fmt, AB.cs, AB.sci, AB.lire          écriture et lecture des nombres (virgule)
   AB.o, AB.fq.choix, AB.fq.nombre         fabriques d'options et de parties de question
   AB.PARTIES                              parties de question : 'choix', 'nombre', 'gabarit', 'sci',
                                           'grille' (un choix par ligne), 'perso' (p.monter(zone, api) → { montrer() })
   AB.versCours(p)                         une de ces parties dans un cours (assets/cours.js)
   AB.question(zone, q, cb, mode)          question en plusieurs parties (série, exercice)
   AB.serie(opts)                          série de questions notée sur 20
   AB.figure(dessin)                       figure dessinée à la largeur disponible : dessin(W) → HTML

   Propre au chapitre 16 :
     AB.esp(pre, h, post, q), AB.f(e)      espèce : formule écrite avec son nombre de H et sa charge
     AB.conj(e, s)                         espèce conjuguée : s = −1 (on enlève H⁺), +1 (on ajoute H⁺)
     AB.CP                                 couples acide / base (acide a, base b, noms)
     AB.couple, demi, demiInv, equation    écritures : couple, demi-équation, réaction entre deux espèces
     AB.partieConjugue(def, opts)          outil « perso » : construire l'espèce conjuguée avec + H⁺ / − H⁺
     AB.partieGamma(def, opts)             outil « perso » : règle du gamma (toucher les réactifs, γ dessiné,
                                           équation à compléter par glisser-déposer)
     AB.gammaFig(haut, bas, reactifs)      règle du gamma déjà tracée (cours, corrections)
     AB.figEchelle(o), AB.figSurvie(o)     figures SVG : échelle pH / [H₃O⁺], échelle de survie (ex. 9)
     AB.pHde(c), AB.Hde(pH), diagPH, diagH pH ↔ [H₃O⁺] et diagnostics (signe − oublié, log et 10ˣ confondus)
     AB.diagNm, diagNcV, diagRel, diagMasse, diagV   diagnostics des calculs de quantités de matière
     AB.methode(def)                       méthode pas à pas : schéma à compléter, n, relation, n, grandeur
   AB.menu(cle), AB.accueil(zone)          navigation commune (SOM) avec le plan de l'application

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
  // écart relatif (pas d'écart absolu : les concentrations du chapitre valent souvent 10⁻⁶ mol/L ou moins)
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

  // Expression à trous : p.label, p.morceaux = [texte HTML | { v, tol, rel, aria, signe (false : pas de bouton ±) }], p.diag(valeurs)
  function pGabarit(zone, p, api) {
    const d = el('div', 'ph-valeur ab-gab');
    if (p.label) d.appendChild(el('span', 'ph-lab', p.label));
    // chaque case forme un groupe insécable avec le texte qui la suit : sur un petit écran,
    // la ligne ne se coupe qu'entre deux groupes
    const champs = [];
    let grp = el('span', 'ab-gab-grp');
    d.appendChild(grp);
    p.morceaux.forEach(m => {
      if (typeof m === 'string') { grp.appendChild(el('span', 'ab-gab-txt', m)); return; }
      if (champs.length) { grp = el('span', 'ab-gab-grp'); d.appendChild(grp); }
      const c = champ({ petit: true, signe: m.signe, aria: m.aria || 'Nombre à compléter' });
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
    const g = el('div', 'ab-grille');
    g.innerHTML = p.lignes.map(l => `<div class="ab-grille-l" data-l="${l.id}">
        <div class="ab-grille-nom">${l.label}</div>
        <div class="ab-grille-ch" role="group" aria-label="${String(l.label).replace(/<[^>]+>/g, '').replace(/"/g, '')}">
          ${p.options.map(o => `<button type="button" class="ab-grille-b" data-o="${o.id}" aria-pressed="false">${o.label}</button>`).join('')}</div>
        <div class="ab-grille-apres" hidden></div></div>`).join('');
    zone.appendChild(g);
    const lignes = Array.from(g.querySelectorAll('.ab-grille-l'));
    const choisi = {};
    lignes.forEach(L => {
      L.querySelectorAll('.ab-grille-b').forEach(b => {
        b.onclick = () => {
          if (api.fini() || b.disabled) return;
          choisi[L.dataset.l] = b.dataset.o;
          L.querySelectorAll('.ab-grille-b').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
          L.classList.remove('ok', 'ko');
          api.effacer();
        };
      });
    });
    const bVal = boutonValider(zone);
    function terminer() {
      lignes.forEach((L, k) => {
        L.classList.remove('ko'); L.classList.add('ok');
        L.querySelectorAll('.ab-grille-b').forEach(b => { b.disabled = true; });
        const a = L.querySelector('.ab-grille-apres');
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
        lignes.forEach((L, k) => L.querySelectorAll('.ab-grille-b').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.o === p.lignes[k].bonne))));
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
      window.AB.partieEnCours = p;          // partie en cours (utile pour vérifier l'application)
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
        const titre = vue ? (mode === 'exercice' ? 'Correction' : 'Réponse') : (erreursIci ? 'C\'est juste.' : 'Juste !');
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
        <div class="cle" style="margin:14px 0"><p><b class="cle-titre">Barème</b> · ${opts.nombre || 10} questions, notées sur 20 :</p>
          <ul class="er-liste"><li><b>2 points</b> si tout est juste du premier coup ;</li><li><b>1 point</b> si tu y arrives après au moins une erreur ;</li><li><b>0 point</b> si tu affiches la réponse.</li></ul></div>
        <button type="button" class="btn-primary" data-a="go">Commencer →</button></div>`;
      app.querySelector('[data-a="go"]').onclick = demarrer;
      window.scrollTo(0, 0);
    }
    function demarrer() { qs = opts.questions(); idx = 0; score = 0; recap = []; afficher(); }

    function afficher() {
      if (idx >= qs.length) return fin();
      const q = qs[idx];
      window.AB.questionEnCours = q;          // question en cours (utile pour vérifier l'application)
      app.innerHTML = `<div class="er-card"><span class="er-badge">${opts.badge}</span><h2 class="er-titre">${opts.titre}</h2>
          <p class="er-meta">Question ${idx + 1}/${qs.length} · Score : <b data-a="score">${pts(score)}</b></p>
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
      app.innerHTML = `<div class="er-card er-fin"><span class="er-badge">${opts.badge}</span><h2 class="er-titre">Série terminée !</h2>
        ${score === max ? '<p class="er-trophee">🏆 Sans-faute !</p>' : ''}
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
    return `<div class="ab-fig${cls ? ' ' + cls : ''}" data-fig="${k}"></div>`;
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
    const l = racine.matches && racine.matches('.ab-fig[data-fig]') ? [racine] : [];
    racine.querySelectorAll('.ab-fig[data-fig]').forEach(x => l.push(x));
    l.forEach(x => { const f = FIGS.get(x.dataset.fig); if (f) monterFig(x, f); });
  }

  new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(n => chercherFigs(n)))).observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener('DOMContentLoaded', () => chercherFigs(document.body));



  /* ============================================================
     PROPRE AU CHAPITRE 16
     ============================================================ */
  const ESP = ' ';                                              // espace insécable (unités)
  const H = 'H<sup>+</sup>', H3O = 'H<sub>3</sub>O<sup>+</sup>', EAU = 'H<sub>2</sub>O', HO = 'HO<sup>−</sup>';
  const CH = '[H<sub>3</sub>O<sup>+</sup>]';
  const UNITE = { M: 'g·mol<sup>−1</sup>', c: 'mol·L<sup>−1</sup>', m3: 'm<sup>3</sup>' };
  const texte = h => String(h).replace(/<[^>]*>/g, '');          // nom lisible (aria-label)
  const egal = (a, b, r) => b !== 0 && Math.abs(a - b) <= (r || .02) * Math.abs(b);
  // couleurs des figures SVG (attributs de présentation, comme les constantes VEC.C de Cinématique)
  const COUL = { INK: '#16181d', INK2: '#55585f', INK3: '#8d8f94', ACC: '#0a7d57', ACCI: '#075c40', CLE: '#e2f1ea', FILET: '#dfdbd2', FOND: '#f3f1ec' };

  /* ---------- Espèces : formule avec son nombre de H et sa charge ----------
     pre + H (nombre h) + post, charge q : CH₃COOH = esp('CH<sub>3</sub>COO', 1, '', 0),
     H₂O = esp('', 2, 'O', 0), NH₄⁺ = esp('N', 4, '', 1), HPO₄²⁻ = esp('', 1, 'PO<sub>4</sub>', −2) */
  const esp = (pre, h, post, q) => ({ pre, h, post: post || '', q: q || 0 });
  const nbH = h => (h <= 0 ? '' : h === 1 ? 'H' : `H<sub>${h}</sub>`);
  const charge = q => (q === 0 ? '' : `<sup>${Math.abs(q) === 1 ? '' : Math.abs(q)}${q > 0 ? '+' : '−'}</sup>`);
  const f = e => e.pre + nbH(e.h) + e.post + charge(e.q);
  // espèce conjuguée : s = −1 (l'acide libère H⁺ : un H de moins, charge −1), +1 (la base capte H⁺)
  const conj = (e, s) => esp(e.pre, e.h + s, e.post, e.q + s);
  const meme = (a, b) => f(a) === f(b);

  /* ---------- Couples acide / base ----------
     a : l'acide, b : la base conjuguée (un H⁺ de moins) ; nomA, nomB : noms (facultatifs) */
  const CP = {};
  [
    ['H3O', '', 3, 'O', 1, 'ion oxonium', 'eau'],
    ['EAU', '', 2, 'O', 0, 'eau', 'ion hydroxyde'],
    ['ACE', 'CH<sub>3</sub>COO', 1, '', 0, 'acide éthanoïque', 'ion éthanoate'],
    ['NH4', 'N', 4, '', 1, 'ion ammonium', 'ammoniac'],
    ['MET', 'HCOO', 1, '', 0, 'acide méthanoïque', 'ion méthanoate'],
    ['HF', '', 1, 'F', 0, 'acide fluorhydrique', 'ion fluorure'],
    ['HNO3', '', 1, 'NO<sub>3</sub>', 0, 'acide nitrique', 'ion nitrate'],
    ['H3PO4', '', 3, 'PO<sub>4</sub>', 0, 'acide phosphorique', 'ion dihydrogénophosphate'],
    ['H2PO4', '', 2, 'PO<sub>4</sub>', -1, 'ion dihydrogénophosphate', 'ion hydrogénophosphate'],
    ['HPO4', '', 1, 'PO<sub>4</sub>', -2, 'ion hydrogénophosphate', 'ion phosphate'],
    ['MA', 'CH<sub>3</sub>N', 3, '', 1, 'ion méthylammonium', 'méthylamine'],
    ['HIO3', '', 1, 'IO<sub>3</sub>', 0, 'acide iodique', 'ion iodate'],
    ['OXA', 'C<sub>2</sub>', 4, 'O<sub>4</sub>', 0, '', ''],
    ['H2CO3', '', 2, 'CO<sub>3</sub>', 0, 'acide carbonique', 'ion hydrogénocarbonate'],
    ['HCO3', '', 1, 'CO<sub>3</sub>', -1, 'ion hydrogénocarbonate', 'ion carbonate'],
    ['SULF', 'NH<sub>2</sub>SO<sub>3</sub>', 1, '', 0, 'acide sulfamique', 'ion sulfamate'],
    ['ASP', 'C<sub>9</sub>', 8, 'O<sub>4</sub>', 0, 'aspirine', 'ion acétylsalicylate'],
    ['HCL', '', 1, 'Cl', 0, 'chlorure d\'hydrogène', 'ion chlorure'],
    ['HCLO', '', 1, 'ClO', 0, 'acide hypochloreux', 'ion hypochlorite'],
  ].forEach(([k, pre, h, post, q, nomA, nomB]) => {
    const a = esp(pre, h, post, q);
    CP[k] = { k, a, b: conj(a, -1), nomA, nomB };
  });
  // nom d'une espèce (premier couple où elle apparaît), sinon sa formule
  function nomDe(e) {
    for (const k in CP) {
      if (meme(CP[k].a, e) && CP[k].nomA) return CP[k].nomA;
      if (meme(CP[k].b, e) && CP[k].nomB) return CP[k].nomB;
    }
    return f(e);
  }

  /* ---------- Écritures ---------- */
  const couple = c => `${f(c.a)} / ${f(c.b)}`;
  const demi = c => `${f(c.a)} = ${f(c.b)} + ${H}`;              // demi-équation : l'acide à gauche
  const demiInv = c => `${f(c.b)} + ${H} = ${f(c.a)}`;           // écrite à l'envers (ex. 7.2)
  // deux espèces additionnées : deux fois la même s'écrit « 2 X »
  const somme = (x, y) => (meme(x, y) ? `2 ${f(x)}` : `${f(x)} + ${f(y)}`);
  /* Réaction entre l'acide du couple ca et la base du couple cb (chacun devient son conjugué)
     baseDabord : la base est écrite en premier (comme dans l'énoncé) */
  function equation(ca, cb, baseDabord) {
    const R = baseDabord ? [cb.b, ca.a] : [ca.a, cb.b];
    const P = baseDabord ? [cb.a, ca.b] : [ca.b, cb.a];
    return { reactifs: R, produits: P, texte: `${somme(R[0], R[1])} → ${somme(P[0], P[1])}` };
  }

  /* ============================================================
     OUTIL « CONSTRUIRE L'ESPÈCE CONJUGUÉE » (partie perso)
     def.lignes [{ depart, cible (espèces), label (HTML) }] : une ligne par espèce,
     validées ensemble (méthode directe : l'acide et la base à la fois).
     Les boutons − H⁺ / + H⁺ changent le nombre de H et la charge : pas de clavier.
     ============================================================ */
  function monterConjugue(zone, def, api) {
    const box = el('div', 'ab-conj');
    const etats = def.lignes.map(l => ({ l, e: Object.assign({}, l.depart) }));
    box.innerHTML = etats.map((s, i) => `<div class="ab-conj-l" data-i="${i}">
        ${s.l.label ? `<p class="ab-conj-t">${s.l.label}</p>` : ''}
        <div class="ab-conj-ligne"><span class="ab-conj-dep">${f(s.l.depart)}</span><span class="ab-conj-fl" aria-hidden="true">→</span>
          <span class="ab-conj-f" aria-live="polite">${f(s.e)}</span></div>
        <div class="ab-conj-b">
          <button type="button" class="btn-secondary" data-s="-1" aria-label="Enlever un H+">− H<sup>+</sup></button>
          <button type="button" class="btn-secondary" data-s="1" aria-label="Ajouter un H+">+ H<sup>+</sup></button>
          <button type="button" class="btn-small" data-s="0" aria-label="Revenir à l'espèce de départ">↺ Départ</button></div></div>`).join('');
    zone.appendChild(box);
    const L = Array.from(box.querySelectorAll('.ab-conj-l'));
    const bVal = boutonValider(zone);
    let fini = false;
    function rendre(i) {
      const s = etats[i], l = L[i], dh = s.e.h - s.l.depart.h;
      l.querySelector('.ab-conj-f').innerHTML = f(s.e);
      l.querySelector('[data-s="-1"]').disabled = fini || s.e.h <= 0 || dh <= -3;
      l.querySelector('[data-s="1"]').disabled = fini || dh >= 3;
      l.querySelector('[data-s="0"]').disabled = fini || dh === 0;
    }
    L.forEach((l, i) => {
      l.querySelectorAll('button').forEach(b => {
        b.onclick = () => {
          if (fini || api.fini() || b.disabled) return;
          const s = +b.dataset.s;
          etats[i].e = s === 0 ? Object.assign({}, etats[i].l.depart) : conj(etats[i].e, s);
          l.classList.remove('ok', 'ko');
          api.effacer();
          rendre(i);
        };
      });
      rendre(i);
    });
    // diagnostic d'une ligne fausse
    function diag(s) {
      const att = s.l.cible.h - s.l.depart.h, fait = s.e.h - s.l.depart.h, X = f(s.l.depart);
      const acide = att < 0;
      if (fait === 0) return `${X} n'a pas changé : ${acide ? `l'acide ${X} <b>libère</b> un H<sup>+</sup>, enlève-le` : `la base ${X} <b>capte</b> un H<sup>+</sup>, ajoute-le`}.`;
      if (Math.sign(fait) !== Math.sign(att)) {
        return acide ? `${X} est un acide : il <b>libère</b> un H<sup>+</sup>. On <b>enlève</b> donc un H<sup>+</sup> (un H de moins, et la charge baisse de 1).`
          : `${X} est une base : elle <b>capte</b> un H<sup>+</sup>. On <b>ajoute</b> donc un H<sup>+</sup> (un H de plus, et la charge augmente de 1).`;
      }
      return `Un acide et sa base conjuguée ne diffèrent que d'<b>un seul</b> H<sup>+</sup>. Reviens au départ et ${acide ? 'enlève' : 'ajoute'} un seul H<sup>+</sup>.`;
    }
    function terminer() {
      fini = true;
      L.forEach((l, i) => { l.classList.remove('ko'); l.classList.add('ok'); rendre(i); });
      bVal.fermer();
    }
    bVal.onclick = () => {
      if (fini || api.fini()) return;
      const fausses = [];
      etats.forEach((s, i) => {
        const ok = meme(s.e, s.l.cible);
        L[i].classList.toggle('ok', ok); L[i].classList.toggle('ko', !ok);
        if (!ok) fausses.push(s);
      });
      if (!fausses.length) { terminer(); api.reussi(); return; }
      api.erreur(fausses.map(diag).join('<br>'));
      secouer(box);
    };
    return { montrer() { etats.forEach(s => { s.e = Object.assign({}, s.l.cible); }); terminer(); } };
  }
  const partieConjugue = (def, opts) => Object.assign({ type: 'perso', monter: (z, api) => monterConjugue(z, def, api) }, opts);

  /* ============================================================
     RÈGLE DU GAMMA γ
     Les deux couples sont écrits l'un sous l'autre (acide / base) ;
     positions : a1, b1 (couple du haut), a2, b2 (couple du bas).
     On entoure les deux réactifs, pris en diagonale ; le tracé en γ part
     du réactif du haut, fait sa boucle sous le couple du haut et finit
     par une flèche sur ce que devient ce réactif (comme dans le cours).
     ============================================================ */
  let nGam = 0;
  const POS = ['a1', 'b1', 'a2', 'b2'];
  const autreDuCouple = p => ({ a1: 'b1', b1: 'a1', a2: 'b2', b2: 'a2' })[p];
  function grilleGamma(haut, bas, interactif) {
    const id = 'abg' + (++nGam);
    const E = { a1: haut.a, b1: haut.b, a2: bas.a, b2: bas.b };
    const tag = interactif ? 'button' : 'span';
    const cell = p => `<${tag}${interactif ? ' type="button" aria-pressed="false"' : ''} class="ab-gam-e ab-gam-${p[0]}" data-p="${p}">${f(E[p])}</${tag}>`;
    const div = el('div', 'ab-gam');
    div.innerHTML = `<div class="ab-gam-g">${cell('a1')}<span class="ab-gam-sl">/</span>${cell('b1')}${cell('a2')}<span class="ab-gam-sl">/</span>${cell('b2')}
      <svg class="ab-gam-svg" aria-hidden="true"><defs><marker id="${id}-m" markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="12" refX="9" refY="6" orient="auto">
        <path d="M1 1 L10 6 L1 11" fill="none" stroke="${COUL.ACC}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></marker></defs><g></g></svg></div>`;
    const g = div.querySelector('.ab-gam-g'), svg = div.querySelector('svg'), calque = svg.querySelector('g');
    let reactifs = null;
    // dessine les ellipses autour des réactifs et le tracé en γ (recalculé si la largeur change)
    function dessiner() {
      if (!reactifs) { calque.innerHTML = ''; return; }
      const r0 = g.getBoundingClientRect();
      if (!r0.width) return;
      svg.setAttribute('width', r0.width); svg.setAttribute('height', r0.height);
      svg.setAttribute('viewBox', `0 0 ${r0.width} ${r0.height}`);
      const B = p => {
        const r = g.querySelector(`[data-p="${p}"]`).getBoundingClientRect();
        return { x: r.left - r0.left + r.width / 2, y: r.top - r0.top + r.height / 2, w: r.width, h: r.height };
      };
      let s = reactifs.map(p => { const b = B(p); return `<ellipse cx="${b.x}" cy="${b.y}" rx="${b.w / 2 + 6}" ry="${b.h / 2 + 2}" fill="none" stroke="${COUL.ACC}" stroke-width="2.2"/>`; }).join('');
      const pH = reactifs.find(p => p[1] === '1'), T = B(pH), T2 = B(autreDuCouple(pH));
      const sl = g.querySelectorAll('.ab-gam-sl'), rs = sl[0].getBoundingClientRect(), rs2 = sl[1].getBoundingClientRect();
      const xs = rs.left - r0.left + rs.width / 2;
      // bas de la ligne du haut, haut de la ligne du bas : le γ se croise entre les deux, sa boucle descend jusqu'au couple du bas
      const yb = Math.max(T.y + T.h / 2, T2.y + T2.h / 2), yt = rs2.top - r0.top + rs2.height * .2, gap = Math.max(20, yt - yb);
      const dir = Math.sign(T2.x - T.x);
      const P0 = { x: T.x + dir * T.w * 0.25, y: T.y + T.h / 2 + 2 }, P3 = { x: T2.x - dir * T2.w * 0.25, y: T2.y + T2.h / 2 + 3 };
      const X = { x: xs, y: yb + gap * 0.42 };
      const unit = (a, b) => { const dx = b.x - a.x, dy = b.y - a.y, n = Math.hypot(dx, dy) || 1; return { x: dx / n, y: dy / n }; };
      const u1 = unit(P0, X), u2 = unit(P3, X), Lg = Math.max(8, gap * 0.24 / Math.max(.35, (u1.y + u2.y) / 2));
      const A = { x: X.x + u1.x * Lg, y: X.y + u1.y * Lg }, A2 = { x: X.x + u2.x * Lg, y: X.y + u2.y * Lg };
      const k = Lg * 1.2, c1 = { x: A.x + u1.x * k, y: A.y + u1.y * k }, c2 = { x: A2.x + u2.x * k, y: A2.y + u2.y * k };
      const p = v => `${v.x.toFixed(1)} ${v.y.toFixed(1)}`;
      s += `<path d="M${p(P0)} L${p(A)} C${p(c1)} ${p(c2)} ${p(A2)} L${p(P3)}" fill="none" stroke="${COUL.ACC}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" marker-end="url(#${id}-m)"/>`;
      calque.innerHTML = s;
    }
    if (window.ResizeObserver) new ResizeObserver(dessiner).observe(g); else addEventListener('resize', dessiner);
    return {
      div, E,
      bouton: p => g.querySelector(`[data-p="${p}"]`),
      tracer(r) { reactifs = r; dessiner(); requestAnimationFrame(dessiner); },
    };
  }

  // règle du gamma déjà tracée (cours, fiches, corrections) : emplacement monté à l'insertion dans la page
  const GAMS = new Map();
  let nGamFig = 0;
  function gammaFig(haut, bas, reactifs) {
    const k = String(++nGamFig);
    GAMS.set(k, { haut, bas, reactifs });
    const aria = `Règle du gamma : ${texte(couple(haut))} écrit au-dessus de ${texte(couple(bas))} ; les réactifs entourés sont ${reactifs.map(p => texte(f({ a1: haut.a, b1: haut.b, a2: bas.a, b2: bas.b }[p]))).join(' et ')}.`;
    return `<div class="ab-gam-fig" data-gk="${k}" role="img" aria-label="${aria.replace(/"/g, '&quot;')}"></div>`;
  }
  function chercherGammas(racine) {
    if (!racine || !racine.querySelectorAll) return;
    const l = racine.matches && racine.matches('.ab-gam-fig[data-gk]') ? [racine] : [];
    racine.querySelectorAll('.ab-gam-fig[data-gk]').forEach(x => l.push(x));
    l.forEach(x => {
      if (x.dataset.monte) return;
      const d = GAMS.get(x.dataset.gk);
      if (!d) return;
      x.dataset.monte = '1';
      const G = grilleGamma(d.haut, d.bas, false);
      x.appendChild(G.div);
      G.tracer(d.reactifs);
    });
  }
  new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(n => chercherGammas(n)))).observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener('DOMContentLoaded', () => chercherGammas(document.body));

  /* OUTIL « RÈGLE DU GAMMA » (partie perso)
     def.haut, def.bas  couples écrits l'un sous l'autre
     def.reactifs       positions des deux réactifs, ex. ['b1', 'a2']
     def.equation       false : seulement entourer les réactifs (sinon : puis compléter l'équation)
     L'élève touche les deux réactifs ; le γ se dessine ; il complète ensuite
     l'équation en glissant les espèces (ou en touchant une espèce puis une case). */
  function monterGamma(zone, def, api) {
    const box = el('div', 'ab-gamma');
    zone.appendChild(box);
    const consigne = el('p', 'ab-gam-cons', 'Touche les deux réactifs dans les couples écrits l\'un sous l\'autre.');
    box.appendChild(consigne);
    const G = grilleGamma(def.haut, def.bas, true), E = G.E;
    box.appendChild(G.div);
    const R = def.reactifs, sgn = p => (p[0] === 'a' ? -1 : 1);
    const P = R.map(p => conj(E[p], sgn(p)));                     // ce que devient chaque réactif
    let choisis = [], etape = 1, fini = false;
    const N = p => f(E[p]);

    // ---------- étape 1 : toucher les deux réactifs ----------
    POS.forEach(p => {
      const b = G.bouton(p);
      b.onclick = () => {
        if (fini || etape !== 1 || api.fini()) return;
        api.effacer();
        POS.forEach(q => G.bouton(q).classList.remove('ko'));
        if (choisis.includes(p)) choisis = choisis.filter(q => q !== p);
        else choisis.push(p);
        POS.forEach(q => G.bouton(q).setAttribute('aria-pressed', String(choisis.includes(q))));
        if (choisis.length === 2) verifier();
      };
    });
    function verifier() {
      const [x, y] = choisis, juste = R.every(p => choisis.includes(p));
      if (juste) { reactifsTrouves(); return; }
      let h;
      if (x[0] === 'a' && y[0] === 'a') h = `${N(x)} et ${N(y)} sont deux acides : <b>deux acides ne réagissent pas ensemble</b>. Un acide donne son H<sup>+</sup> à une base.`;
      else if (x[0] === 'b' && y[0] === 'b') h = `${N(x)} et ${N(y)} sont deux bases : <b>deux bases ne réagissent pas ensemble</b>. Une base capte le H<sup>+</sup> d'un acide.`;
      else if (x[1] === y[1]) h = `${N(x)} et ${N(y)} forment un même couple : <b>le réactif d'un couple devient son conjugué</b>, ils ne réagissent pas ensemble. Les deux réactifs sont dans deux couples différents, en diagonale.`;
      else h = `Ce ne sont pas les réactifs de la réaction : elle a lieu entre ${N(R[0])} et ${N(R[1])}.`;
      choisis.forEach(q => G.bouton(q).classList.add('ko'));
      api.erreur(h);
      secouer(G.div);
      choisis = [];
      POS.forEach(q => G.bouton(q).setAttribute('aria-pressed', 'false'));
    }
    function reactifsTrouves() {
      etape = 2;
      POS.forEach(q => { const b = G.bouton(q); b.disabled = true; b.classList.remove('ko'); b.setAttribute('aria-pressed', String(R.includes(q))); });
      G.div.classList.add('ab-gam-fait');
      G.tracer(R);
      consigne.innerHTML = `Les réactifs sont entourés : ${N(R[0])} devient ${f(P[0])}, ${N(R[1])} devient ${f(P[1])}.`;
      if (def.equation === false) { fini = true; api.reussi(); return; }
      api.message('✓ Réactifs trouvés. Complète maintenant l\'équation de la réaction.');
      monterEquation();
    }

    // ---------- étape 2 : compléter l'équation ----------
    let eq = null;
    function monterEquation() {
      const cles = [];
      const chips = [];
      POS.forEach(p => { const k = N(p); if (!cles.includes(k)) { cles.push(k); chips.push({ k, h: k }); } });
      chips.push({ k: 'H+', h: H });
      eq = el('div', 'ab-eqc');
      eq.innerHTML = `<div class="ab-eqc-pal"><p class="ab-eqc-t">Espèces <span>· glisse-les dans l'équation, ou touche une espèce puis une case (touche une case remplie pour la vider)</span></p>
          <div class="ab-eqc-liste">${melanger(chips).map(c => `<button type="button" class="ab-eqc-chip" data-k="${c.k.replace(/"/g, '&quot;')}"><span>${c.h}</span></button>`).join('')}</div></div>
        <div class="ab-eqc-ligne" role="group" aria-label="Équation à compléter">
          <button type="button" class="ab-eqc-case" data-c="0" aria-label="Premier réactif"></button><span class="ab-eqc-s">+</span>
          <button type="button" class="ab-eqc-case" data-c="1" aria-label="Second réactif"></button><span class="ab-eqc-fl">→</span>
          <button type="button" class="ab-eqc-case" data-c="2" aria-label="Premier produit"></button><span class="ab-eqc-s">+</span>
          <button type="button" class="ab-eqc-case" data-c="3" aria-label="Second produit"></button></div>`;
      box.appendChild(eq);
      const cases = Array.from(eq.querySelectorAll('.ab-eqc-case'));
      const lesChips = Array.from(eq.querySelectorAll('.ab-eqc-chip'));
      const act = el('div', 'er-actions ph-actions-partie', '<button type="button" class="btn-primary">Valider l\'équation</button>');
      box.appendChild(act);
      let choisie = null;
      const choisir = c => {
        if (choisie) choisie.classList.remove('ab-choisie');
        choisie = c;
        if (c) c.classList.add('ab-choisie');
        eq.classList.toggle('ab-en-choix', !!c);
      };
      const remplir = (cs, k) => {
        cs.dataset.k = k || '';
        cs.innerHTML = k ? (k === 'H+' ? H : k) : '';
        cs.classList.toggle('plein', !!k);
        cases.forEach(x => x.classList.remove('ok', 'ko'));
        api.effacer();
      };
      lesChips.forEach(c => {
        let x0 = 0, y0 = 0;
        c.addEventListener('pointerdown', e => { x0 = e.clientX; y0 = e.clientY; }, true);
        window.DragDrop.enable(c, {
          zoneSelector: '.ab-eqc-case', dragOverClass: 'ab-over',
          onDrop: (item, z, e) => {
            if (fini) return;
            // simple appui : sélection de l'espèce
            if (Math.hypot(e.clientX - x0, e.clientY - y0) < 8) { choisir(choisie === item ? null : item); return; }
            choisir(null);
            if (z && eq.contains(z)) remplir(z, item.dataset.k);
          },
        });
        // clavier (Entrée, Espace) : sélection
        c.addEventListener('click', e => { if (e.detail === 0 && !fini) choisir(choisie === c ? null : c); });
      });
      cases.forEach(cs => {
        cs.onclick = () => {
          if (fini) return;
          if (choisie) { remplir(cs, choisie.dataset.k); choisir(null); return; }
          if (cs.dataset.k) remplir(cs, '');
        };
      });
      const tri = t => t.slice().sort().join('|');
      act.querySelector('button').onclick = () => {
        if (fini || api.fini()) return;
        const v = cases.map(c => c.dataset.k || '');
        if (v.some(x => !x)) { secouer(eq); api.message('Complète les quatre cases de l\'équation.'); return; }
        const okR = tri(v.slice(0, 2)) === tri(R.map(N)), okP = tri(v.slice(2)) === tri(P.map(f));
        cases.forEach((c, i) => { const ok = i < 2 ? okR : okP; c.classList.toggle('ok', ok); c.classList.toggle('ko', !ok); });
        if (okR && okP) { finEquation(); api.reussi(); return; }
        const acides = [N('a1'), N('a2')], bases = [N('b1'), N('b2')];
        let h;
        if (v.includes('H+')) h = 'H<sup>+</sup> ne s\'écrit pas dans l\'équation de la réaction : il passe directement de l\'acide à la base.';
        else if (!okR) {
          const [x, y] = v;
          if (acides.includes(x) && acides.includes(y) && !(bases.includes(x) && bases.includes(y))) h = '<b>Deux acides ne réagissent pas ensemble.</b> Les réactifs sont les deux espèces entourées : un acide et une base.';
          else if (bases.includes(x) && bases.includes(y) && !(acides.includes(x) && acides.includes(y))) h = '<b>Deux bases ne réagissent pas ensemble.</b> Les réactifs sont les deux espèces entourées : un acide et une base.';
          else h = `Les réactifs, à gauche de la flèche, sont les deux espèces entourées : ${N(R[0])} et ${N(R[1])}.`;
        } else {
          h = `<b>Le réactif d'un couple devient son conjugué</b> : ${N(R[0])} devient ${f(P[0])} et ${N(R[1])} devient ${f(P[1])}. Les produits sont les deux espèces non entourées.`;
        }
        api.erreur(h);
        secouer(eq);
      };
      function finEquation() {
        fini = true;
        choisir(null);
        eq.classList.add('ab-eqc-fini');
        act.remove();
      }
      eq.montrer = () => {
        remplir(cases[0], N(R[0])); remplir(cases[1], N(R[1])); remplir(cases[2], f(P[0])); remplir(cases[3], f(P[1]));
        cases.forEach(c => c.classList.add('ok'));
        finEquation();
      };
    }
    return {
      montrer() {
        if (etape === 1) {
          choisis = R.slice();
          if (def.equation === false) { fini = true; etape = 2; POS.forEach(q => { G.bouton(q).disabled = true; G.bouton(q).classList.remove('ko'); }); G.tracer(R); return; }
          reactifsTrouves();
          api.effacer();
        }
        if (eq && eq.montrer) eq.montrer();
      },
    };
  }
  const partieGamma = (def, opts) => Object.assign({ type: 'perso', monter: (z, api) => monterGamma(z, def, api) }, opts);

  /* ============================================================
     pH ET CONCENTRATION EN IONS OXONIUM
     ============================================================ */
  const pHde = c => -Math.log10(c);
  const Hde = ph => Math.pow(10, -ph);
  // diagnostic d'un pH calculé à partir de [H3O+] = c
  function diagPH(v, c) {
    const ph = pHde(c);
    if (Math.abs(v + ph) < .06) return `Tu as oublié le signe − : pH = −log(${CH}). Le log d'une concentration inférieure à 1 est négatif ; le pH, lui, est positif.`;
    if (Math.abs(v + Math.log(c)) < .06 || Math.abs(v - Math.log(c)) < .06) return 'Tu as utilisé la touche ln : le pH se calcule avec <b>log</b> (logarithme décimal).';
    if (Math.abs(v - Math.pow(10, -c)) < .01 || Math.abs(v - Math.pow(10, c)) < .01) return `Tu as utilisé 10<sup>x</sup> : pour passer de ${CH} au pH, c'est la touche <b>log</b> (10<sup>x</sup> sert dans l'autre sens).`;
    return `pH = −log(${CH}) = −log(${sci(c, 2)}) : tape « −log( » puis la concentration, et arrondis à une décimale.`;
  }
  // diagnostic d'une concentration [H3O+] calculée à partir du pH
  function diagH(v, ph) {
    if (egal(v, Math.pow(10, ph), .04)) return `Tu as oublié le signe − : ${CH} = 10<sup>−pH</sup> = 10<sup>−${fmt(ph)}</sup>.`;
    if (Math.abs(Math.abs(v) - Math.abs(Math.log10(ph))) < .01) return `Tu as utilisé log : pour revenir à ${CH}, on applique <b>10<sup>x</sup></b>, la réciproque de log.`;
    if (egal(v, Math.exp(-ph), .04)) return 'Tu as utilisé e<sup>x</sup> : c\'est la touche <b>10<sup>x</sup></b>.';
    return `${CH} = 10<sup>−pH</sup> = 10<sup>−${fmt(ph)}</sup> : touche 10<sup>x</sup> de la calculatrice, sans oublier le signe −.`;
  }
  // nature d'une solution d'après son pH (à 25 °C)
  const nature = ph => (ph < 7 ? 'acide' : ph > 7 ? 'basique' : 'neutre');

  /* ---------- Échelle de pH (et de [H3O+]) ----------
     o.conc     true : deuxième axe, [H3O+] de 10⁰ à 10⁻¹⁴ mol/L
     o.fleches  true : sens de variation (« [H3O+] augmente », « pH augmente »)
     o.points   [{ pH, label }] : solutions placées sur l'échelle */
  function svgTxt(html, taille) {
    const t = taille || 14, d = Math.round(t * .38);
    return String(html).replace(/<sup>(.*?)<\/sup>/g, `<tspan dy="-${d}" font-size="${Math.round(t * .7)}">$1</tspan><tspan dy="${d}">​</tspan>`)
      .replace(/<sub>(.*?)<\/sub>/g, `<tspan dy="${d}" font-size="${Math.round(t * .7)}">$1</tspan><tspan dy="-${d}">​</tspan>`)
      .replace(/<(?!\/?tspan)[^>]+>/g, '');
  }
  const T = (x, y, h, o) => `<text x="${x}" y="${y}" text-anchor="${(o && o.a) || 'middle'}" font-size="${(o && o.s) || 13}" font-weight="${(o && o.w) || 600}" fill="${(o && o.c) || COUL.INK}">${svgTxt(h, (o && o.s) || 13)}</text>`;
  function figEchelle(o) {
    o = o || {};
    return figure(W => {
      const w = Math.max(300, W), m = 26, x = p => m + p / 14 * (w - 2 * m), pas = w < 520 ? 2 : 1, petit = w < 420 ? 11 : 12;
      const pts = o.points || [], sept = pts.some(pt => pt.pH === 7);
      const yA = (pts.length ? 46 : 28);                            // axe du pH
      let s = '';
      // bande acide / basique au-dessus de l'axe, trait du neutre à 7
      s += `<rect x="${x(0)}" y="${yA - 12}" width="${x(7) - x(0)}" height="12" fill="${COUL.CLE}"/><rect x="${x(7)}" y="${yA - 12}" width="${x(14) - x(7)}" height="12" fill="${COUL.FOND}"/>`;
      s += `<line x1="${x(7)}" y1="${yA - 16}" x2="${x(7)}" y2="${yA + 4}" stroke="${COUL.INK}" stroke-width="2.5"/>`;
      if (!sept) s += T(x(7), yA - 20, 'neutre', { s: petit, w: 700, c: COUL.INK2 });
      // axe du pH et graduations
      s += `<line x1="${x(0)}" y1="${yA}" x2="${x(14)}" y2="${yA}" stroke="${COUL.INK}" stroke-width="2"/>`;
      for (let p = 0; p <= 14; p++) {
        s += `<line x1="${x(p)}" y1="${yA - 4}" x2="${x(p)}" y2="${yA + 4}" stroke="${COUL.INK}" stroke-width="1.5"/>`;
        if (p % pas === 0 || p === 7) s += T(x(p), yA + 18, String(p), { s: petit });
      }
      s += T(2, yA - 3, 'pH', { a: 'start', s: petit, w: 800 });
      // nature de la solution, sous les graduations
      s += T(x(3.5), yA + 36, 'solution acide', { s: petit, w: 700, c: COUL.ACCI }) + T(x(10.5), yA + 36, 'solution basique', { s: petit, w: 700, c: COUL.INK2 });
      let y = yA + 40;
      if (o.conc) {
        const yC = yA + 74;
        s += `<line x1="${x(0)}" y1="${yC}" x2="${x(14)}" y2="${yC}" stroke="${COUL.INK}" stroke-width="2"/>`;
        for (let p = 0; p <= 14; p++) {
          s += `<line x1="${x(p)}" y1="${yC - 4}" x2="${x(p)}" y2="${yC + 4}" stroke="${COUL.INK}" stroke-width="1.5"/>`;
          if (p % pas === 0) s += T(x(p), yC + 20, p === 0 ? '1' : `10<sup>−${p}</sup>`, { s: petit });
          s += `<line x1="${x(p)}" y1="${yA + 42}" x2="${x(p)}" y2="${yC - 6}" stroke="${COUL.FILET}" stroke-width="1" stroke-dasharray="3 3"/>`;
        }
        s += T(x(14), yC + 40, `${CH} en mol·L<sup>−1</sup>`, { a: 'end', s: petit, w: 700, c: COUL.INK2 });
        y = yC + 42;
      }
      if (o.fleches) {
        const yF = y + 22, id = 'abe' + Math.round(Math.random() * 1e9);
        s += `<defs><marker id="${id}" markerUnits="userSpaceOnUse" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="${COUL.ACC}"/></marker></defs>`;
        s += `<line x1="${x(6.4)}" y1="${yF}" x2="${x(0.6)}" y2="${yF}" stroke="${COUL.ACC}" stroke-width="2.5" marker-end="url(#${id})"/>` + T(x(3.5), yF - 7, `${CH} augmente`, { s: petit, w: 700, c: COUL.ACCI });
        s += `<line x1="${x(7.6)}" y1="${yF}" x2="${x(13.4)}" y2="${yF}" stroke="${COUL.ACC}" stroke-width="2.5" marker-end="url(#${id})"/>` + T(x(10.5), yF - 7, 'pH augmente', { s: petit, w: 700, c: COUL.ACCI });
        y = yF + 8;
      }
      pts.forEach(pt => {
        s += `<line x1="${x(pt.pH)}" y1="${yA}" x2="${x(pt.pH)}" y2="${yA - 26}" stroke="${COUL.ACC}" stroke-width="1.5"/><circle cx="${x(pt.pH)}" cy="${yA}" r="5" fill="${COUL.ACC}"/>`;
        s += T(Math.min(w - 30, Math.max(30, x(pt.pH))), yA - 31, pt.label, { s: petit, w: 700, c: COUL.ACCI });
      });
      const Ht = y + 6;
      const aria = o.aria || `Échelle de pH de 0 à 14 : solution acide pour un pH inférieur à 7, neutre à 7, basique au-dessus de 7${pts.length ? ' ; ' + pts.map(pt => `${pt.label} : pH ${fmt(pt.pH)}`).join(', ') : ''}${o.conc ? ' ; en dessous, la concentration en ions oxonium, de 1 à 10 puissance −14 mol par litre : quand le pH augmente de 1, elle est divisée par 10' : ''}.`;
      return `<svg viewBox="0 0 ${w} ${Ht}" width="${w}" height="${Ht}" class="ab-svg" role="img" aria-label="${aria.replace(/"/g, '&quot;')}">${s}</svg>`;
    }, 'ab-fig-echelle');
  }

  /* ---------- Échelle de survie des espèces aquatiques (exercice 9 p. 201) ----------
     barres jusqu'au pH où l'espèce disparaît ; axe de 7,5 (à gauche) à 3,5 (à droite), comme dans le manuel */
  const SURVIE = [
    { t: 'Mort des crustacés, des gastéropodes et d\'autres mollusques', fin: 5.9, qui: 'les crevettes (crustacés)' },
    { t: 'Mort des saumons, des ombles chevaliers et des gardons', fin: 5.7, qui: 'les saumons' },
    { t: 'Mort des insectes sensibles, du phytoplancton et du zooplancton sensibles', fin: 5.7, qui: 'les insectes sensibles' },
    { t: 'Mort des corégones et des lavarets', fin: 5.5, qui: 'les corégones' },
    { t: 'Mort des perches et des brochets', fin: 5.0, qui: 'les brochets' },
    { t: 'Mort des anguilles et des ombles de fontaine', fin: 4.4, qui: 'les anguilles' },
  ];
  function figSurvie(o) {
    o = o || {};
    const barres = o.barres || SURVIE;
    return figure(W => {
      const w = Math.max(300, W), g = 14, d = 14, x = p => g + (7.5 - p) / 4 * (w - g - d);
      const yA = 34, rang = 44, y0 = yA + 22;
      const H = y0 + barres.length * rang + 6;
      let s = '';
      // quadrillage tous les 0,5 et graduations tous les 0,1
      for (let k = 0; k <= 40; k++) {
        const p = 7.5 - k / 10, X = x(p).toFixed(1), maj = k % 5 === 0;
        s += `<line x1="${X}" y1="${yA - (maj ? 6 : 3)}" x2="${X}" y2="${yA}" stroke="${COUL.INK}" stroke-width="${maj ? 1.5 : 1}"/>`;
        if (maj) {
          s += `<line x1="${X}" y1="${yA}" x2="${X}" y2="${H - 4}" stroke="${COUL.FILET}" stroke-width="1" stroke-dasharray="3 3"/>`;
          if (w >= 420 || k % 10 === 0) s += T(X, yA - 10, fmt(p, 1), { s: 12 });
        }
      }
      s += `<line x1="${x(7.5)}" y1="${yA}" x2="${x(3.5)}" y2="${yA}" stroke="${COUL.INK}" stroke-width="2"/>` + T(2, 12, 'pH', { a: 'start', s: 12, w: 800 });
      // seuils du manuel : 6,5 et 5
      [6.5, 5].forEach(p => { s += `<line x1="${x(p)}" y1="${yA}" x2="${x(p)}" y2="${H - 4}" stroke="${COUL.INK2}" stroke-width="1.5" stroke-dasharray="6 4"/>`; });
      barres.forEach((b, i) => {
        const y = y0 + i * rang;
        s += T(x(7.5) + 4, y + 2, b.t, { a: 'start', s: w < 420 ? 11 : 12, w: 600 });
        s += `<rect x="${x(7.5)}" y="${y + 8}" width="${x(b.fin) - x(7.5)}" height="20" fill="${COUL.CLE}" stroke="${COUL.ACC}" stroke-width="1"/>`;
        s += `<line x1="${x(b.fin)}" y1="${y + 5}" x2="${x(b.fin)}" y2="${y + 31}" stroke="${COUL.ACC}" stroke-width="3"/>`;
      });
      const aria = 'Échelle de survie : ' + barres.map(b => `${b.t.toLowerCase()} quand le pH descend en dessous de ${fmt(b.fin, 1)}`).join(' ; ') + '. Les dommages apparaissent sous un pH de 6,5 ; toute forme de vie « normale » disparaît sous un pH de 5.';
      return `<svg viewBox="0 0 ${w} ${H}" width="${w}" height="${H}" class="ab-svg" role="img" aria-label="${aria.replace(/"/g, '&quot;')}">${s}</svg>
        <p class="ab-fig-note">Pointillés : les dommages apparaissent lorsque le pH descend en dessous de 6,5 ; toute forme de vie « normale » disparaît à un pH inférieur à 5. Graduations tous les 0,1.</p>`;
    }, 'ab-fig-survie');
  }

  /* ============================================================
     QUANTITÉS DE MATIÈRE : diagnostics des erreurs classiques
     ============================================================ */
  const ecrire = v => (Math.abs(v) < 0.01 || Math.abs(v) >= 1e5 ? sci(v, 2) : fmt(v));
  // n = m / M
  function diagNm(v, m, M) {
    if (egal(v, m * M)) return `Tu as multiplié : n = m / M (la masse divisée par la masse molaire). Les unités le rappellent : M en ${UNITE.M}, ce sont des grammes <b>par</b> mole.`;
    if (egal(v, M / m)) return 'Tu as inversé la division : n = m / M, la masse en haut.';
    return `n = m / M = ${fmt(m)} / ${fmt(M)}.`;
  }
  // n = c × V (V en L) ; Vd = { v, u } : le volume tel qu'il est donné (mL, m³), s'il faut le convertir
  function diagNcV(v, c, V, Vd) {
    if (Vd && Vd.u !== 'L' && egal(v, c * Vd.v)) return `Le volume doit être en litres : ${fmt(Vd.v)} ${Vd.u} = ${fmt(V)} L${Vd.u === UNITE.m3 ? ' (1 m<sup>3</sup> = 1 000 L)' : ''}.`;
    if (egal(v, c / V) || (Vd && egal(v, c / Vd.v))) return 'n = c × V : on <b>multiplie</b> la concentration par le volume.';
    return `n = c × V = ${ecrire(c)} × ${fmt(V)}, avec V en litres.`;
  }
  // relation stœchiométrique : nB = nA × b / a
  function diagRel(v, nA, a, b, fA, fB) {
    if (a !== b && egal(v, nA * a / b)) return `Tu as inversé les nombres stœchiométriques : ${fr(`n(${fB})`, b)} = ${fr(`n(${fA})`, a)}, donc n(${fB}) = ${b === 1 ? '' : b + ' × '}n(${fA})${a === 1 ? '' : ' / ' + a}.`;
    if (a !== b && egal(v, nA)) return `Tu as oublié les nombres stœchiométriques : il y a ${a} devant ${fA} et ${b} devant ${fB} dans l'équation.`;
    return `Utilise la relation ${fr(`n(${fA})`, a)} = ${fr(`n(${fB})`, b)}.`;
  }
  // m = n × M
  function diagMasse(v, n, M) {
    if (egal(v, n / M)) return 'm = n × M : on <b>multiplie</b> la quantité de matière par la masse molaire.';
    if (egal(v, n)) return 'Ça, c\'est la quantité de matière (en mol). Multiplie-la par la masse molaire pour avoir la masse.';
    return `m = n × M = ${ecrire(n)} × ${fmt(M)}.`;
  }
  // V = n / c (en L)
  function diagV(v, n, c) {
    if (egal(v, n * c)) return 'V = n / c : on <b>divise</b> la quantité de matière par la concentration.';
    if (egal(v, c / n)) return 'Tu as inversé la division : V = n / c, la quantité de matière en haut.';
    if (egal(v, n / c * 1000)) return 'Le volume est demandé en litres : ne convertis pas en mL ici.';
    return `V = n / c = ${ecrire(n)} / ${ecrire(c)}.`;
  }

  /* ============================================================
     MÉTHODE « QUANTITÉS DE MATIÈRE » PAS À PAS (module 4, exercices)
     Même méthode qu'au chapitre 14 (schéma de assets/schema-methode.js) :
     données placées sur le schéma → n de l'espèce connue → relation
     stœchiométrique → n de l'espèce cherchée → grandeur demandée.
     def.especes  [{ f, coef, nom }] dans l'ordre de l'équation ; def.produits
     def.depart   { k, m, M } | { k, c, V } | { k, pH, V } | { k, H, V } | { k, n, nTxt } : la donnée
                  V en L ; Vd = { v, u } : le volume tel que l'énoncé le donne (mL, m³), à convertir
     def.cible    { k, quoi: 'n' | 'm' | 'V', M, c } (absent : seulement n de l'espèce connue)
     def.cs       chiffres significatifs des réponses (2 par défaut)
     def.sans     parties à ne pas poser, parmi 'schema', 'H', 'nA', 'relation', 'nB', 'res'
     def.q        questions propres : { schema, H, nA, relation, nB, res }
     Renvoie { H, nA, nB, res, ecr, schema (HTML rempli), parties }
     ============================================================ */
  function methode(def) {
    const E = def.especes, d = def.depart, c = def.cible || null, A = E[d.k], B = c ? E[c.k] : null;
    const n0 = def.cs || 2, sans = def.sans || [], qs = def.q || {};
    const prod = def.produits != null ? def.produits : Math.ceil(E.length / 2);
    const ecr = v => (Math.abs(v) < 0.01 || Math.abs(v) >= 1e5 ? sci(v, n0) : cs(v, n0));
    const typeD = d.m != null ? 'm' : d.pH != null ? 'pH' : d.H != null ? 'H' : d.c != null ? 'c' : 'n';
    // [H3O+] arrondie comme dans les corrections (10⁻⁵·⁶ ≈ 2,5 × 10⁻⁶ mol/L), puis n = [H3O+] × V
    const Hc = typeD === 'pH' ? +Hde(d.pH).toPrecision(n0) : d.H;
    const nA = typeD === 'm' ? d.m / d.M : typeD === 'c' ? d.c * d.V : (typeD === 'pH' || typeD === 'H') ? Hc * d.V : d.n;
    const a = A.coef, b = B ? B.coef : 1;
    const nB = B ? nA * b / a : null;
    const res = !c ? null : c.quoi === 'm' ? nB * c.M : c.quoi === 'V' ? nB / c.c : nB;
    const verbe = k => (k < prod ? 'consommé' : 'formé');
    const nom = X => X.nom || texte(X.f);
    const Vtxt = d.Vd ? `${fmt(d.Vd.v)} ${d.Vd.u}` : `${fmt(d.V)} L`;
    const conv = d.Vd && d.Vd.u !== 'L' ? `<p>V = ${Vtxt} = ${fmt(d.V)} L${d.Vd.u === UNITE.m3 ? ' (1 m<sup>3</sup> = 1 000 L)' : ''}.</p>` : '';

    // données de l'énoncé : étiquettes à placer sur le schéma
    const et = [];
    const etiq = (id, label, indice) => et.push({ id, label, cible: id, indice });
    const donneesD = [];
    let nLab = 'n = m / M';
    if (typeD === 'm') {
      donneesD.push([`m(${A.f})`, '#m'], [`M(${A.f})`, '#M']);
      etiq('m', `${fmt(d.m)} g`, `La masse de ${nom(A)} se place en haut de la colonne de ${A.f}.`);
      etiq('M', `${fmt(d.M)} ${UNITE.M}`, `${fmt(d.M)} ${UNITE.M} est la masse molaire de ${nom(A)} : colonne de ${A.f}, avec sa masse.`);
    } else if (typeD === 'c') {
      donneesD.push([`c(${A.f})`, '#c'], ['V', '#V']);
      etiq('c', `${ecrire(d.c)} ${UNITE.c}`, `La concentration est celle de ${A.f} : colonne de ${A.f}.`);
      etiq('V', Vtxt, `Le volume est celui de la solution de ${A.f} : colonne de ${A.f}, avec sa concentration.`);
      nLab = 'n = c × V';
    } else if (typeD === 'pH') {
      donneesD.push(['pH', '#pH'], [`${CH} = 10<sup>−pH</sup>`, '?'], ['V', '#V']);
      etiq('pH', `pH = ${fmt(d.pH)}`, `Le pH donne la concentration en ions ${H3O} : colonne de ${A.f}.`);
      etiq('V', Vtxt, `Le volume est celui de la solution où se trouvent les ions ${H3O} : colonne de ${A.f}.`);
      nLab = `n = ${CH} × V`;
    } else if (typeD === 'H') {
      donneesD.push([CH, '#H'], ['V', '#V']);
      etiq('H', `${ecrire(d.H)} ${UNITE.c}`, `C'est la concentration en ions ${H3O} : colonne de ${H3O}.`);
      etiq('V', Vtxt, `Le volume est celui de la solution où se trouvent les ions ${H3O} : colonne de ${A.f}.`);
      nLab = `n = ${CH} × V`;
    } else {
      etiq('n', d.nTxt || `${ecr(d.n)} mol`, `La quantité de matière connue est celle de ${A.f} : place-la dans sa colonne.`);
    }
    const sch = { especes: E, produits: prod, autres: def.autres,
      depart: { k: d.k, donnees: donneesD, n: typeD === 'n' ? [`n(${A.f})`, '#n'] : [nLab, '?'] } };
    if (c) sch.cible = { k: c.k, n: '?' };
    else sch.relations = false;
    if (c && c.quoi === 'm') {
      sch.cible.grandeur = ['m = n × M', '?'];
      sch.cible.donnees = [[`M(${B.f})`, '#MB']];
      etiq('MB', `${fmt(c.M)} ${UNITE.M}`, `${fmt(c.M)} ${UNITE.M} est la masse molaire de ${nom(B)} : elle sert à la fin, dans la colonne de ${B.f}.`);
    } else if (c && c.quoi === 'V') {
      sch.cible.grandeur = ['V = n / c', '?'];
      sch.cible.donnees = [[`c(${B.f})`, '#cB']];
      etiq('cB', `${ecrire(c.c)} ${UNITE.c}`, `Cette concentration est celle de la solution de ${B.f} à verser : colonne de ${B.f}.`);
    }
    // le même schéma, rempli (correction)
    const val = id => (et.find(e => e.id === id) || {}).label;
    const remplir = x => (typeof x === 'string' && x[0] === '#' ? val(x.slice(1)) : x);
    const plein = JSON.parse(JSON.stringify(sch));
    plein.especes = E;
    plein.depart.donnees = plein.depart.donnees.map(([l, x]) => [l, x === '?' ? `${sci(Hc, n0)} ${UNITE.c}` : remplir(x)]);
    plein.depart.n = [plein.depart.n[0], typeD === 'n' ? remplir(plein.depart.n[1]) : `${ecr(nA)} mol`];
    if (c) {
      plein.cible.n = `${ecr(nB)} mol`;
      if (plein.cible.donnees) plein.cible.donnees = plein.cible.donnees.map(([l, x]) => [l, remplir(x)]);
      if (plein.cible.grandeur) plein.cible.grandeur = [plein.cible.grandeur[0], c.quoi === 'V' ? `${ecr(res)} L` : `${ecr(res)} g`];
    }
    const schemaPlein = window.SCHM.schema(plein);

    const parties = [];
    const num = (v, label, unite, q, diag, solution) => (Math.abs(v) < 0.01 || Math.abs(v) >= 1e5
      ? { type: 'sci', q, label, valeur: v, unite, rel: .03, cs: n0, diag, solution, correction: solution }
      : { type: 'nombre', q, label, valeur: v, unite, rel: .03, signe: false, cs: n0, affiche: cs(v, n0), diag, solution, correction: solution });
    if (!sans.includes('schema')) {
      const sol = `<p>Chaque donnée se place dans la colonne de son espèce.</p>${schemaPlein}`;
      parties.push(window.SCHM.partieDonnees({ schema: sch, etiquettes: et }, {
        q: qs.schema || 'Place les données de l\'énoncé sur le schéma de la méthode. Les « ? » sont les grandeurs à calculer.',
        solution: sol, correction: sol }));
    }
    if (typeD === 'pH' && !sans.includes('H')) {
      const sol = `<p class="ph-calc">${CH} = 10<sup>−pH</sup> = 10<sup>−${fmt(d.pH)}</sup> ≈ <span class="c">${sci(Hc, n0)} ${UNITE.c}</span></p>`;
      parties.push({ type: 'sci', q: qs.H || `Calcule la concentration en ions ${H3O} (${n0} chiffres significatifs).`, label: `${CH} =`, valeur: Hde(d.pH), unite: UNITE.c,
        rel: .03, cs: n0, diag: v => diagH(v, d.pH), solution: sol, correction: sol });
    }
    if (typeD !== 'n' && !sans.includes('nA')) {
      const calc = typeD === 'm' ? `n(${A.f}) = ${fr(`m(${A.f})`, `M(${A.f})`)} = ${fr(`${fmt(d.m)} g`, `${fmt(d.M)} ${UNITE.M}`)} ≈ <span class="c">${ecr(nA)} mol</span>`
        : typeD === 'c' ? `n(${A.f}) = c × V = ${ecrire(d.c)} ${UNITE.c} × ${fmt(d.V)} L ≈ <span class="c">${ecr(nA)} mol</span>`
          : `n(${A.f}) = ${CH} × V = ${sci(Hc, n0)} ${UNITE.c} × ${fmt(d.V)} L ≈ <span class="c">${ecr(nA)} mol</span>`;
      parties.push(num(nA, `n(${A.f}) =`, 'mol', qs.nA || `Calcule la quantité de matière de ${A.f}${c ? ' ' + verbe(d.k) : ''}${conv ? ' (V en litres)' : ''}.`,
        v => (typeD === 'm' ? diagNm(v, d.m, d.M) : diagNcV(v, typeD === 'c' ? d.c : Hc, d.V, d.Vd)),
        `${conv}<p class="ph-calc">${calc}</p>`));
    }
    if (c && !sans.includes('relation')) parties.push(window.SCHM.choixRelation({ especes: E, depart: d, cible: c }, qs.relation ? { q: qs.relation } : {}));
    if (c && !sans.includes('nB')) {
      const calc = `${fr(`n(${A.f})`, a)} = ${fr(`n(${B.f})`, b)} donc n(${B.f}) = ${b === 1 ? '' : b + ' × '}${a === 1 ? `n(${A.f})` : fr(`n(${A.f})`, a)} = ${b === 1 ? '' : b + ' × '}${a === 1 ? ecr(nA) : fr(ecr(nA), a)} ≈ <span class="c">${ecr(nB)} mol</span>`;
      parties.push(num(nB, `n(${B.f}) =`, 'mol', qs.nB || `Calcule la quantité de matière de ${B.f} ${verbe(c.k)}.`,
        v => diagRel(v, nA, a, b, A.f, B.f), `<p class="ph-calc">${calc}</p>`));
    }
    if (c && c.quoi !== 'n' && !sans.includes('res')) {
      if (c.quoi === 'm') {
        parties.push(num(res, `m(${B.f}) =`, 'g', qs.res || `Calcule la masse de ${nom(B)} ${verbe(c.k)}.`,
          v => diagMasse(v, nB, c.M),
          `<p class="ph-calc">m(${B.f}) = n(${B.f}) × M(${B.f}) = ${ecr(nB)} mol × ${fmt(c.M)} ${UNITE.M} ≈ <span class="c">${ecr(res)} g</span></p>`));
      } else {
        parties.push(num(res, 'V =', 'L', qs.res || `Calcule le volume de solution à verser, en litres.`,
          v => diagV(v, nB, c.c),
          `<p class="ph-calc">V = ${fr(`n(${B.f})`, `c(${B.f})`)} = ${fr(`${ecr(nB)} mol`, `${ecrire(c.c)} ${UNITE.c}`)} ≈ <span class="c">${ecr(res)} L</span>${res < 1 ? ` = ${cs(res * 1000, n0)} mL` : ''}</p>`));
      }
    }
    return { H: Hc, nA, nB, res, ecr, schema: schemaPlein, parties, etiquettes: et };
  }

  /* ---------- Équations des calculs de quantités de matière (module 4, exercices) ----------
     espèces dans l'ordre de l'équation : { f, coef, nom } ; les produits commencent au rang 2 */
  const CACO3 = 'CaCO<sub>3</sub>', CO2 = 'CO<sub>2</sub>', CA2 = 'Ca<sup>2+</sup>', HCO3 = 'HCO<sub>3</sub><sup>−</sup>';
  const EQS = {
    // acide AH + H2O → A⁻ + H3O⁺ : l'acide forme autant d'ions oxonium qu'il est consommé
    acideEau: c => [{ f: f(c.a), coef: 1, nom: c.nomA }, { f: EAU, coef: 1, nom: 'eau' }, { f: f(c.b), coef: 1, nom: c.nomB }, { f: H3O, coef: 1, nom: 'ions oxonium' }],
    // détartrage (ex. 17) : CaCO3 + 2 H3O⁺ → CO2 + 3 H2O + Ca²⁺
    detartrage: () => [{ f: CACO3, coef: 1, nom: 'carbonate de calcium' }, { f: H3O, coef: 2, nom: 'ions oxonium' }, { f: CO2, coef: 1, nom: 'dioxyde de carbone' },
      { f: EAU, coef: 3, nom: 'eau' }, { f: CA2, coef: 1, nom: 'ions calcium' }],
    // sujet de bac (maraîcher) : CaCO3 + H3O⁺ → Ca²⁺ + HCO3⁻ + H2O
    calcaire: () => [{ f: CACO3, coef: 1, nom: 'carbonate de calcium' }, { f: H3O, coef: 1, nom: 'ions oxonium' }, { f: CA2, coef: 1, nom: 'ions calcium' },
      { f: HCO3, coef: 1, nom: 'ions hydrogénocarbonate' }, { f: EAU, coef: 1, nom: 'eau' }],
    // neutralisation : H3O⁺ + HO⁻ → 2 H2O
    neutralisation: () => [{ f: H3O, coef: 1, nom: 'ions oxonium' }, { f: HO, coef: 1, nom: 'ions hydroxyde' }, { f: EAU, coef: 2, nom: 'eau' }],
  };
  // équation écrite à partir de ces espèces
  const eqTexte = (E, prod) => E.slice(0, prod).map(e => (e.coef > 1 ? e.coef + ' ' : '') + e.f).join(' + ') + ' → ' + E.slice(prod).map(e => (e.coef > 1 ? e.coef + ' ' : '') + e.f).join(' + ');

  /* ============================================================
     PLAN DE L'APPLICATION ET NAVIGATION (voir assets/sommaire.js)
     ============================================================ */
  const PLAN = [
    { n: 1, titre: 'Acides, bases et couples', desc: 'Acide et base, couple acide / base et demi-équation, espèce conjuguée, ampholyte', fiche: 'fiche_1',
      parties: [{ nom: 'Acides, bases et couples', cours: 'module_1_cours', questions: 'module_1_questions' }] },
    { n: 2, titre: 'Réactions acido-basiques', desc: 'Transfert d\'un H<sup>+</sup> de l\'acide d\'un couple à la base d\'un autre, règle du gamma γ, couples d\'une réaction', fiche: 'fiche_2',
      parties: [{ nom: 'Réactions acido-basiques', cours: 'module_2_cours', questions: 'module_2_questions' }] },
    { n: 3, titre: 'Le pH', desc: 'pH-mètre et échelle de pH, pH = −log([H<sub>3</sub>O<sup>+</sup>]) et [H<sub>3</sub>O<sup>+</sup>] = 10<sup>−pH</sup>, évolution du pH', fiche: 'fiche_3',
      sousModules: true,
      parties: [
        { nom: 'Mesure et définition du pH', slug: 'definition', cours: 'module_3a_cours', noms: { cours: 'Cours : mesure et définition du pH' } },
        { nom: 'Du pH à [H₃O⁺]', slug: 'reciproque', cours: 'module_3b_cours', noms: { cours: 'Cours : du pH à [H₃O⁺]' } },
        { nom: 'Évolution du pH', slug: 'evolution', cours: 'module_3c_cours', noms: { cours: 'Cours : évolution du pH' } },
        { nom: 'Le pH', questions: 'module_3_questions' }] },
    { n: 4, titre: 'Quantités de matière', desc: 'n = m / M, n = c × V, n(H<sub>3</sub>O<sup>+</sup>) = [H<sub>3</sub>O<sup>+</sup>] × V, relations stœchiométriques, schéma de la méthode', fiche: 'fiche_4',
      parties: [{ nom: 'Quantités de matière', cours: 'module_4_cours', questions: 'module_4_questions' }] },
    { n: 5, titre: 'Exercices', desc: 'Exercices 7 à 20 de la feuille, sujet de bac (maraîcher) et extrait de bac (carottes de glace)', exercices: 'module_5', exNom: 'Exercices de la feuille', nbEx: 10 },
  ];
  window.SOM.init({ nom: 'Chapitre 16 : Acides et bases', id: 'acides-bases', cleEx: 'acides-bases-exercices', plan: PLAN });
  const menu = cle => window.SOM.menu(cle);
  const accueil = zone => window.SOM.accueil(zone);
  const marquer = info => window.SOM.marquer(info);

  window.AB = Object.assign(window.AB || {}, {
    MOINS, fmt, cs, sci, lire, proche, fr, o, fq, el, secouer, melanger, hasard, entre, champ, boutonValider, PARTIES, versCours,
    question, serie, confettis, figure,
    ESP, H, H3O, EAU, HO, CH, UNITE, COUL, texte, egal, esp, f, conj, meme, CP, nomDe, couple, demi, demiInv, somme, equation,
    partieConjugue, monterConjugue, partieGamma, monterGamma, gammaFig, grilleGamma,
    pHde, Hde, diagPH, diagH, nature, svgTxt, figEchelle, figSurvie, SURVIE,
    ecrire, diagNm, diagNcV, diagRel, diagMasse, diagV, methode, EQS, eqTexte, CACO3, CO2, CA2, HCO3,
    PLAN, menu, accueil, marquer,
  });
})();
