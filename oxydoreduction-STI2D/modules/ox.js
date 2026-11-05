/* ============================================================
   Moteur de l'application « Chapitre 15 : Oxydoréduction (piles et
   accumulateurs) » (Terminale STI2D ; moteur de questions repris de
   « Chapitre 13 : Énergie nucléaire » ; navigation commune
   assets/sommaire.js, cours avec assets/cours.js, schéma de la méthode
   avec assets/schema-methode.js, schéma de la pile avec pile/pile.js)

   OX.fmt, OX.cs, OX.sci, OX.lire          écriture et lecture des nombres (virgule)
   OX.o, OX.fq.choix, OX.fq.nombre         fabriques d'options et de parties de question
   OX.PARTIES                              parties de question : 'choix', 'nombre', 'gabarit', 'sci',
                                           'grille' (un choix par ligne), 'perso' (p.monter(zone, api) → { montrer() })
   OX.versCours(p)                         une de ces parties dans un cours (assets/cours.js)
   OX.question(zone, q, cb, mode)          question en plusieurs parties (série, exercice)
   OX.serie(opts)                          série de questions notée sur 20

   Propre au chapitre 15 :
     OX.CP, demi, reduc, oxyd, couple      couples oxydant / réducteur (masses molaires des éléments)
     OX.REACTIONS, OX.reaction(cle)        réactions entre deux couples : nombres stœchiométriques,
                                           espèces dans l'ordre de l'équation, équation écrite
     OX.equation(reactifs, produits)       équation écrite : [[k, formule], …]
     OX.figPile(o)                         schéma d'une pile annoté (SVG)
     OX.chaine(etapes)                     chaîne énergétique (réservoirs, convertisseurs, transferts)
     OX.diagNm, diagNcV, diagRel, diagMasse, diagC   diagnostics des erreurs classiques des calculs
     OX.methode(def)                       méthode pas à pas : schéma à compléter, n, relation, n, grandeur
   OX.menu(cle), OX.accueil(zone)          navigation commune (SOM) avec le plan de l'application

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

  // Expression à trous : p.label, p.morceaux = [texte HTML | { v, tol, rel, aria, signe (false : pas de bouton ±) }], p.diag(valeurs)
  function pGabarit(zone, p, api) {
    const d = el('div', 'ph-valeur ox-gab');
    if (p.label) d.appendChild(el('span', 'ph-lab', p.label));
    // chaque case forme un groupe insécable avec le texte qui la suit : sur un petit écran,
    // la ligne ne se coupe qu'entre deux groupes
    const champs = [];
    let grp = el('span', 'ox-gab-grp');
    d.appendChild(grp);
    p.morceaux.forEach(m => {
      if (typeof m === 'string') { grp.appendChild(el('span', 'ox-gab-txt', m)); return; }
      if (champs.length) { grp = el('span', 'ox-gab-grp'); d.appendChild(grp); }
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
    const g = el('div', 'ox-grille');
    g.innerHTML = p.lignes.map(l => `<div class="ox-grille-l" data-l="${l.id}">
        <div class="ox-grille-nom">${l.label}</div>
        <div class="ox-grille-ch" role="group" aria-label="${String(l.label).replace(/<[^>]+>/g, '').replace(/"/g, '')}">
          ${p.options.map(o => `<button type="button" class="ox-grille-b" data-o="${o.id}" aria-pressed="false">${o.label}</button>`).join('')}</div>
        <div class="ox-grille-apres" hidden></div></div>`).join('');
    zone.appendChild(g);
    const lignes = Array.from(g.querySelectorAll('.ox-grille-l'));
    const choisi = {};
    lignes.forEach(L => {
      L.querySelectorAll('.ox-grille-b').forEach(b => {
        b.onclick = () => {
          if (api.fini() || b.disabled) return;
          choisi[L.dataset.l] = b.dataset.o;
          L.querySelectorAll('.ox-grille-b').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
          L.classList.remove('ok', 'ko');
          api.effacer();
        };
      });
    });
    const bVal = boutonValider(zone);
    function terminer() {
      lignes.forEach((L, k) => {
        L.classList.remove('ko'); L.classList.add('ok');
        L.querySelectorAll('.ox-grille-b').forEach(b => { b.disabled = true; });
        const a = L.querySelector('.ox-grille-apres');
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
        lignes.forEach((L, k) => L.querySelectorAll('.ox-grille-b').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.o === p.lignes[k].bonne))));
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
      window.OX.partieEnCours = p;          // partie en cours (utile pour vérifier l'application)
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
      window.OX.questionEnCours = q;          // question en cours (utile pour vérifier l'application)
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
    return `<div class="ox-fig${cls ? ' ' + cls : ''}" data-fig="${k}"></div>`;
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
    const l = racine.matches && racine.matches('.ox-fig[data-fig]') ? [racine] : [];
    racine.querySelectorAll('.ox-fig[data-fig]').forEach(x => l.push(x));
    l.forEach(x => { const f = FIGS.get(x.dataset.fig); if (f) monterFig(x, f); });
  }

  new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(n => chercherFigs(n)))).observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener('DOMContentLoaded', () => chercherFigs(document.body));



  /* ============================================================
     PROPRE AU CHAPITRE 15
     ============================================================ */
  const ESP = ' ';                                              // espace insécable (unités)
  const ELEC = 'e<sup>−</sup>';
  const nE = n => (n === 1 ? '' : n + ' ') + ELEC;              // « 2 e⁻ », « e⁻ » (on n'écrit pas 1)
  const kE = (k, s) => (k === 1 ? '' : k + ' ') + s;            // nombre stœchiométrique devant une espèce
  const sPl = n => (n > 1 ? 's' : '');
  const texte = h => String(h).replace(/<[^>]*>/g, '');          // nom lisible (aria-label)
  const charge = q => (q === 0 ? '0' : q + '+');
  const R = s => `<span class="ox-reactif">${s}</span>`;        // réactif repéré dans une demi-équation
  const gcd = (a, b) => (b === 0 ? a : gcd(b, a % b));
  const lcm = (a, b) => a * b / gcd(a, b);
  const egal = (a, b, r) => b !== 0 && Math.abs(a - b) <= (r || .02) * Math.abs(b);

  /* ---------- Couples oxydant / réducteur ----------
     n : électrons échangés ; qo, qr : charges ; el : élément ; M : masse molaire de l'élément (g/mol),
     celle de l'ion est la même (la masse des électrons est négligeable) ;
     solide : la forme réduite est un métal (sinon les deux formes sont des ions en solution) */
  const CP = {
    Ag:  { ox: 'Ag<sup>+</sup>',  red: 'Ag',              n: 1, qo: 1, qr: 0, el: 'Ag', M: 108,  nom: 'argent',    solide: true },
    Fe3: { ox: 'Fe<sup>3+</sup>', red: 'Fe<sup>2+</sup>', n: 1, qo: 3, qr: 2, el: 'Fe', M: 55.8, nom: 'fer',       solide: false },
    Cu:  { ox: 'Cu<sup>2+</sup>', red: 'Cu',              n: 2, qo: 2, qr: 0, el: 'Cu', M: 63.5, nom: 'cuivre',    solide: true },
    Pb:  { ox: 'Pb<sup>2+</sup>', red: 'Pb',              n: 2, qo: 2, qr: 0, el: 'Pb', M: 207,  nom: 'plomb',     solide: true },
    Ni:  { ox: 'Ni<sup>2+</sup>', red: 'Ni',              n: 2, qo: 2, qr: 0, el: 'Ni', M: 58.7, nom: 'nickel',    solide: true },
    Fe:  { ox: 'Fe<sup>2+</sup>', red: 'Fe',              n: 2, qo: 2, qr: 0, el: 'Fe', M: 55.8, nom: 'fer',       solide: true },
    Zn:  { ox: 'Zn<sup>2+</sup>', red: 'Zn',              n: 2, qo: 2, qr: 0, el: 'Zn', M: 65.4, nom: 'zinc',      solide: true },
    Sn:  { ox: 'Sn<sup>4+</sup>', red: 'Sn<sup>2+</sup>', n: 2, qo: 4, qr: 2, el: 'Sn', M: 119,  nom: 'étain',     solide: false },
    Al:  { ox: 'Al<sup>3+</sup>', red: 'Al',              n: 3, qo: 3, qr: 0, el: 'Al', M: 27.0, nom: 'aluminium', solide: true },
    Cr:  { ox: 'Cr<sup>3+</sup>', red: 'Cr',              n: 3, qo: 3, qr: 0, el: 'Cr', M: 52.0, nom: 'chrome',    solide: true },
    I:   { ox: 'I<sub>2</sub>',   red: 'I<sup>−</sup>',   n: 2, demi: 'I<sub>2</sub> + 2 e<sup>−</sup> = 2 I<sup>−</sup>', el: 'I', M: 127, nom: 'iode', solide: false },
  };
  const demi = c => c.demi || `${c.ox} + ${nE(c.n)} = ${c.red}`;   // demi-équation du couple
  const reduc = c => `${c.ox} + ${nE(c.n)} → ${c.red}`;             // lue à l'endroit : réduction
  const oxyd = c => `${c.red} → ${c.ox} + ${nE(c.n)}`;              // lue à l'envers : oxydation
  const couple = c => `${c.ox} / ${c.red}`;

  // équation écrite : reactifs et produits = [[k, formule], …]
  const equation = (g, d) => `${g.map(([k, f]) => kE(k, f)).join(' + ')} → ${d.map(([k, f]) => kE(k, f)).join(' + ')}`;

  /* ---------- Réactions entre deux couples (métaux et ions des séries) ----------
     [couple dont l'oxydant réagit, couple dont le réducteur réagit] */
  const REACTIONS = [['Cu', 'Fe'], ['Cu', 'Zn'], ['Ag', 'Cu'], ['Ag', 'Zn'], ['Ag', 'Fe'], ['Cu', 'Al'],
    ['Fe3', 'Cu'], ['Fe3', 'Zn'], ['Ag', 'Al'], ['Fe', 'Al'], ['Fe', 'Zn']];
  // espèce d'une équation : formule, nombre stœchiométrique, couple, forme (ox / red), métal ou ion en solution
  function reaction(ka, kb) {
    const a = CP[ka], b = CP[kb], L = lcm(a.n, b.n), m1 = L / a.n, m2 = L / b.n;
    const esp = (cp, forme, coef) => ({ f: cp[forme], coef, cp, forme, metal: forme === 'red' && cp.solide, M: cp.M,
      nom: forme === 'red' && cp.solide ? cp.nom : `ions ${texte(cp[forme])}` });
    const especes = [esp(a, 'ox', m1), esp(b, 'red', m2), esp(a, 'red', m1), esp(b, 'ox', m2)];
    return { a, b, ka, kb, L, m1, m2, especes, produits: 2,
      equation: equation([[m1, a.ox], [m2, b.red]], [[m1, a.red], [m2, b.ox]]) };
  }

  /* ---------- Diagnostics des erreurs classiques des calculs de quantités de matière ---------- */
  // n = m / M
  function diagNm(v, m, M) {
    if (egal(v, m * M)) return 'Tu as multiplié : n = m / M (la masse divisée par la masse molaire). Les unités le rappellent : M en g/mol, c\'est des grammes <b>par</b> mole.';
    if (egal(v, M / m)) return 'Tu as inversé la division : n = m / M, la masse en haut.';
    return `n = m / M = ${fmt(m)} / ${fmt(M)}.`;
  }
  // n = c × V (V en L)
  function diagNcV(v, c, VmL) {
    if (egal(v, c * VmL)) return `Le volume doit être en litres : V = ${fmt(VmL)} mL = ${fmt(VmL / 1000)} L.`;
    if (egal(v, c / (VmL / 1000)) || egal(v, c / VmL)) return 'n = c × V : on multiplie la concentration par le volume (en litres).';
    return `n = c × V, avec V en litres : V = ${fmt(VmL / 1000)} L.`;
  }
  // relation stœchiométrique : nB = nA × b / a
  function diagRel(v, nA, a, b, fA, fB) {
    if (a !== b && egal(v, nA * a / b)) return `Tu as inversé les nombres stœchiométriques : ${fr(`n(${fB})`, b)} = ${fr(`n(${fA})`, a)}, donc n(${fB}) = ${b === 1 ? '' : b + ' × '}n(${fA})${a === 1 ? '' : ' / ' + a}.`;
    if (a !== b && egal(v, nA)) return `Tu as oublié les nombres stœchiométriques : il y a ${a} devant ${fA} et ${b} devant ${fB} dans l'équation.`;
    return `Utilise la relation ${fr(`n(${fA})`, a)} = ${fr(`n(${fB})`, b)}.`;
  }
  // m = n × M
  function diagMasse(v, n, M) {
    if (egal(v, n / M)) return 'm = n × M : on multiplie la quantité de matière par la masse molaire.';
    if (egal(v, n)) return 'Ça, c\'est la quantité de matière (en mol). Multiplie-la par la masse molaire pour avoir la masse.';
    return `m = n × M = ${fmt(n)} × ${fmt(M)}.`;
  }
  // c = n / V (V en L)
  function diagC(v, n, VmL) {
    if (egal(v, n / VmL)) return `Le volume doit être en litres : V = ${fmt(VmL)} mL = ${fmt(VmL / 1000)} L.`;
    if (egal(v, n * VmL / 1000) || egal(v, n * VmL)) return 'c = n / V : on divise la quantité de matière par le volume (en litres).';
    return `c = n / V, avec V en litres : V = ${fmt(VmL / 1000)} L.`;
  }

  /* ============================================================
     FIGURES
     ============================================================ */
  // texte HTML (Zn<sup>2+</sup>, e<sup>−</sup>, H<sub>2</sub>) écrit dans un <text> SVG avec des <tspan>
  function svgTxt(html, taille) {
    const t = taille || 14, d = Math.round(t * .38);
    return String(html).replace(/<sup>(.*?)<\/sup>/g, `<tspan dy="-${d}" font-size="${Math.round(t * .7)}">$1</tspan><tspan dy="${d}">​</tspan>`)
      .replace(/<sub>(.*?)<\/sub>/g, `<tspan dy="${d}" font-size="${Math.round(t * .7)}">$1</tspan><tspan dy="-${d}">​</tspan>`)
      .replace(/<(?!\/?tspan)[^>]+>/g, '');
  }
  let nFigPile = 0;
  /* Schéma d'une pile annoté
     o.g, o.d      couples des demi-piles gauche et droite (clés de CP, métal / ion du métal)
     o.anode       'g' ou 'd' : demi-pile où le métal est oxydé (borne −)
     o.appareil    'V' (voltmètre) ou 'A' (ampèremètre), avec sa borne COM côté −
     o.voir        ce qui est dessiné : { pol, e, I, ions, roles, demi } (tout par défaut) */
  function figPile(o) {
    const id = 'oxp' + (++nFigPile);
    const v = Object.assign({ pol: true, e: true, I: true, ions: true, roles: true, demi: true, com: true }, o.voir || {});
    const G = CP[o.g], D = CP[o.d], anG = o.anode === 'g';
    const A = anG ? G : D, C = anG ? D : G;
    const H = v.demi ? 372 : (v.roles ? 318 : 300);
    const INK = '#16181d', INK2 = '#55585f', ACC = '#0a7d57', ACCI = '#075c40', GRIS = '#8d8f94';
    const xg = 150, xd = 490, yFil = 46;
    const t = (x, y, h, opt) => `<text x="${x}" y="${y}" text-anchor="${(opt && opt.a) || 'middle'}" font-size="${(opt && opt.s) || 14}" font-weight="${(opt && opt.w) || 700}" fill="${(opt && opt.c) || INK}">${svgTxt(h, (opt && opt.s) || 14)}</text>`;
    const fl = (x1, y1, x2, y2, col, m) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${col}" stroke-width="2.5" marker-end="url(#${id}-${m})"/>`;
    const signe = (x, y, s) => `<circle cx="${x}" cy="${y}" r="11" fill="#fff" stroke="${INK}" stroke-width="1.5"/>${t(x, y + 5, s, { s: 16, w: 800 })}`;
    let s = `<defs>
      <marker id="${id}-a" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="10" refX="10" refY="5" orient="auto"><path d="M0 0 L11 5 L0 10 z" fill="${ACC}"/></marker>
      <marker id="${id}-i" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="10" refX="10" refY="5" orient="auto"><path d="M0 0 L11 5 L0 10 z" fill="${INK}"/></marker>
      <marker id="${id}-p" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="10" refX="10" refY="5" orient="auto"><path d="M0 0 L11 5 L0 10 z" fill="${INK2}"/></marker></defs>`;
    // béchers et solutions
    [[70, G], [410, D]].forEach(([x]) => {
      s += `<rect x="${x}" y="186" width="160" height="96" fill="#e2f1ea"/>`;
      s += `<path d="M${x} 150 V282 H${x + 160} V150" fill="none" stroke="${INK}" stroke-width="2"/>`;
    });
    // pont salin
    s += `<path d="M212 236 V128 H428 V236" fill="none" stroke="#dfdbd2" stroke-width="14"/>
      <path d="M205 236 V121 H435 V236 M219 236 V135 H421 V236" fill="none" stroke="${GRIS}" stroke-width="1.5"/>`;
    s += t(320, 158, 'pont salin', { s: 12, w: 600, c: INK2 });
    // électrodes et fils
    [xg, xd].forEach(x => { s += `<rect x="${x - 9}" y="96" width="18" height="150" rx="2" fill="#c9c4b9" stroke="${INK}" stroke-width="1.5"/>`; });
    s += `<path d="M${xg} 96 V${yFil} H296 M344 ${yFil} H${xd} V96" fill="none" stroke="${INK}" stroke-width="2"/>`;
    s += `<circle cx="320" cy="${yFil}" r="24" fill="#fff" stroke="${INK}" stroke-width="2"/>${t(320, yFil + 6, o.appareil || 'V', { s: 18, w: 800 })}`;
    if (v.com) s += t(anG ? 290 : 350, yFil + 17, 'COM', { s: 11, w: 700, c: INK2, a: anG ? 'end' : 'start' });
    // espèces : métal (électrode) et ion (solution)
    s += t(xg - 18, 128, G.red, { a: 'end' }) + t(xd + 18, 128, D.red, { a: 'start' });
    s += t(xg - 30, 266, G.ox, { a: 'end' }) + t(xd + 30, 266, D.ox, { a: 'start' });
    // polarités : le − à l'anode (le métal y est oxydé)
    if (v.pol) s += signe(xg - 30, 86, anG ? '−' : '+') + signe(xd + 30, 86, anG ? '+' : '−');
    // électrons : ils partent de l'anode (−) et arrivent à la cathode (+)
    if (v.e) {
      const xa = anG ? xg : xd, xc = anG ? xd : xg;
      s += fl(xa, 88, xa, 58, ACC, 'a') + fl(xc, 58, xc, 88, ACC, 'a');
      s += t(xa + (anG ? 16 : -16), 78, ELEC, { a: anG ? 'start' : 'end', c: ACCI }) + t(xc + (anG ? -16 : 16), 78, ELEC, { a: anG ? 'end' : 'start', c: ACCI });
    }
    // courant : du + vers le − dans le circuit extérieur
    if (v.I) {
      // de la borne + vers la borne −, sur les deux fils du haut
      const seg = anG ? [[408, 378], [238, 208]] : [[232, 262], [402, 432]];
      seg.forEach(([a, b]) => { s += fl(a, yFil, b, yFil, INK, 'i'); });
      s += t(anG ? 393 : 247, yFil - 10, 'I', { s: 14, w: 800 }) + t(anG ? 223 : 417, yFil - 10, 'I', { s: 14, w: 800 });
    }
    // ions du pont salin : anions vers l'anode (même sens que les e⁻), cations vers la cathode (même sens que I)
    if (v.ions) {
      const vers = (x1, x2) => fl(x1, 106, x2, 106, INK2, 'p');
      if (anG) { s += vers(310, 240) + vers(330, 400); s += t(275, 98, 'anions', { s: 12, c: INK2 }) + t(365, 98, 'cations', { s: 12, c: INK2 }); }
      else { s += vers(310, 240) + vers(330, 400); s += t(275, 98, 'cations', { s: 12, c: INK2 }) + t(365, 98, 'anions', { s: 12, c: INK2 }); }
    }
    // anode et cathode, demi-équations dans le sens de fonctionnement
    if (v.roles) {
      s += t(xg, 304, anG ? 'anode (−)' : 'cathode (+)', { s: 13, c: ACCI }) + t(xd, 304, anG ? 'cathode (+)' : 'anode (−)', { s: 13, c: ACCI });
    }
    if (v.demi) {
      const eqA = `${A.red} = ${A.ox} + ${nE(A.n)}`, eqC = `${C.ox} + ${nE(C.n)} = ${C.red}`;
      s += t(xg, 330, anG ? eqA : eqC, { s: 13, w: 600 }) + t(xd, 330, anG ? eqC : eqA, { s: 13, w: 600 });
      s += t(xg, 352, anG ? 'oxydation' : 'réduction', { s: 12, w: 500, c: INK2 }) + t(xd, 352, anG ? 'réduction' : 'oxydation', { s: 12, w: 500, c: INK2 });
    }
    const aria = o.aria || `Schéma de la pile ${texte(A.red)} / ${texte(C.red)} : l'électrode de ${A.nom} est l'anode (borne −), celle de ${C.nom} la cathode (borne +) ; les électrons vont de ${A.nom} vers ${C.nom} dans les fils, le courant en sens inverse ; dans le pont salin, les anions vont vers l'anode et les cations vers la cathode.`;
    return `<div class="ox-figure"><svg viewBox="0 0 640 ${H}" class="ox-svg" role="img" aria-label="${aria.replace(/"/g, '&quot;')}">${s}</svg></div>`;
  }

  /* Chaîne énergétique : etapes = ['Réactifs', 'énergie chimique', 'Batterie', 'énergie électrique', 'Appareil']
     (cases et transferts alternés ; une valeur '#id' laisse un emplacement vide pour une étiquette) */
  function chaine(etapes, aria) {
    const c = x => (String(x)[0] === '#' ? `<span class="ox-ch-vide" data-slot="${String(x).slice(1)}">?</span>` : x);
    return `<div class="ox-chaine" role="img" aria-label="${(aria || etapes.map(texte).join(', puis ')).replace(/"/g, '&quot;')}">${etapes.map((e, k) => (k % 2 === 0
      ? `<span class="ox-ch-b">${c(e)}</span>` : `<span class="ox-ch-f"><span>${c(e)}</span></span>`)).join('')}</div>`;
  }
  const CHAINES = {
    decharge: ['Réactifs', 'énergie chimique', 'Batterie', 'énergie électrique', 'Appareil'],
    charge: ['Chargeur', 'énergie électrique', 'Batterie', 'énergie chimique', 'Réactifs'],
  };


  /* ============================================================
     MÉTHODE « QUANTITÉS DE MATIÈRE » PAS À PAS (module 3, exercices)
     Les parties suivent le schéma de assets/schema-methode.js :
     données placées sur le schéma → n de l'espèce connue → relation
     stœchiométrique → n de l'espèce cherchée → grandeur demandée.
     def.especes  [{ f, coef, nom, M }] dans l'ordre de l'équation ; def.produits ; def.signe ('→' ou '=')
     def.depart   { k, m, M } | { k, c, V (mL) } | { k, n } | { k, Q } : la donnée de l'énoncé
     def.cible    { k, quoi: 'm' | 'c' | 'n' | 'Q', M, V (mL) } : ce qu'on cherche
     def.autres   colonnes en pointillés ; def.cs : chiffres significatifs des réponses (3 par défaut)
     def.sans     parties à ne pas poser, parmi 'schema', 'nA', 'relation', 'nB', 'res'
     def.q        questions propres : { schema, nA, relation, nB, res }
     Renvoie { nA, nB, res, ecr (écriture d'un résultat), schema (HTML rempli), parties }
     ============================================================ */
  const FARADAY = 96500;
  const UNITE = { M: 'g·mol<sup>−1</sup>', c: 'mol·L<sup>−1</sup>', F: 'C·mol<sup>−1</sup>' };
  function methode(def) {
    const E = def.especes, d = def.depart, c = def.cible, A = E[d.k], B = E[c.k], a = A.coef, b = B.coef;
    const n0 = def.cs || 3, sans = def.sans || [], qs = def.q || {};
    const prod = def.produits != null ? def.produits : Math.ceil(E.length / 2);
    // écriture d'un résultat : écriture scientifique pour les petits et les grands nombres
    const ecr = v => (Math.abs(v) < 0.01 || Math.abs(v) >= 1e5 ? sci(v, n0) : cs(v, n0));
    const typeD = d.m != null ? 'm' : d.c != null ? 'c' : d.Q != null ? 'Q' : 'n';
    const nA = typeD === 'm' ? d.m / d.M : typeD === 'c' ? d.c * d.V / 1000 : typeD === 'Q' ? d.Q / FARADAY : d.n;
    const nB = nA * b / a;
    const res = c.quoi === 'm' ? nB * c.M : c.quoi === 'c' ? nB / (c.V / 1000) : c.quoi === 'Q' ? nB * FARADAY : nB;
    const verbe = k => (k < prod ? 'consommé' : 'formé');
    const nom = X => X.nom || texte(X.f);

    // données de l'énoncé : étiquettes à placer sur le schéma (valeur et unité)
    const et = [];
    const etiq = (id, label, indice) => et.push({ id, label, cible: id, indice });
    const donneesD = [];
    if (typeD === 'm') {
      donneesD.push([`m(${A.f})`, '#m'], [`M(${A.f})`, '#M']);
      etiq('m', `${fmt(d.m)} g`, `La masse de ${nom(A)} se place en haut de la colonne de ${A.f}.`);
      etiq('M', `${fmt(d.M)} ${UNITE.M}`, `${fmt(d.M)} ${UNITE.M} est la masse molaire de ${nom(A)} : colonne de ${A.f}, avec sa masse.`);
    } else if (typeD === 'c') {
      donneesD.push([`c(${A.f})`, '#c'], ['V', '#V']);
      etiq('c', `${fmt(d.c)} ${UNITE.c}`, `La concentration est celle de la solution de ${A.f} : colonne de ${A.f}.`);
      etiq('V', `${fmt(d.V)} mL`, `Le volume est celui de la solution de ${A.f} : colonne de ${A.f}, avec sa concentration.`);
    } else if (typeD === 'Q') {
      donneesD.push(['Q', '#Q'], ['F', '#F']);
      etiq('Q', `${fmt(d.Q)} C`, `La charge électrique est portée par les électrons : colonne de ${A.f}.`);
      etiq('F', `${fmt(FARADAY)} ${UNITE.F}`, `F, la charge d'une mole d'électrons, sert à passer de Q à n(${A.f}) : même colonne.`);
    } else {
      etiq('n', d.nTxt || `${ecr(d.n)} mol`, `La quantité de matière connue est celle de ${A.f} : place-la dans sa colonne.`);
    }
    const sch = { especes: E, produits: prod, signe: def.signe, autres: def.autres,
      depart: { k: d.k, donnees: donneesD, n: typeD === 'n' ? [`n(${A.f})`, '#n'] : [typeD === 'm' ? 'n = m / M' : typeD === 'c' ? 'n = c × V' : 'n = Q / F', '?'] },
      cible: { k: c.k, n: '?' } };
    if (c.quoi === 'm') {
      sch.cible.grandeur = ['m = n × M', '?'];
      sch.cible.donnees = [[`M(${B.f})`, '#MB']];
      etiq('MB', `${fmt(c.M)} ${UNITE.M}`, `${fmt(c.M)} ${UNITE.M} est la masse molaire de ${nom(B)} : elle sert à la fin, dans la colonne de ${B.f}.`);
    } else if (c.quoi === 'c') {
      sch.cible.grandeur = [c.V === d.V ? 'c = n / V (même V)' : 'c = n / V', '?'];
      if (c.V !== d.V) {
        sch.cible.donnees = [['V', '#VB']];
        etiq('VB', `${fmt(c.V)} mL`, `Ce volume est celui où se trouve ${B.f} : colonne de ${B.f}.`);
      }
    } else if (c.quoi === 'Q') {
      sch.cible.grandeur = ['Q = n × F', '?'];
    }
    // le même schéma, rempli (correction)
    const val = id => (et.find(e => e.id === id) || {}).label;
    const plein = JSON.parse(JSON.stringify(sch));
    plein.especes = E;
    const remplir = x => (typeof x === 'string' && x[0] === '#' ? val(x.slice(1)) : x);
    plein.depart.donnees = plein.depart.donnees.map(([l, x]) => [l, remplir(x)]);
    plein.depart.n = [plein.depart.n[0], typeD === 'n' ? remplir(plein.depart.n[1]) : `${ecr(nA)} mol`];
    plein.cible.n = `${ecr(nB)} mol`;
    if (plein.cible.donnees) plein.cible.donnees = plein.cible.donnees.map(([l, x]) => [l, remplir(x)]);
    const uRes = { m: 'g', c: UNITE.c, Q: 'C', n: 'mol' }[c.quoi];
    if (plein.cible.grandeur) plein.cible.grandeur = [plein.cible.grandeur[0], `${ecr(res)} ${uRes}`];
    const schemaPlein = window.SCHM.schema(plein);

    const parties = [];
    const num = (v, label, unite, q, diag, solution) => ({ type: 'nombre', q, label, valeur: v, unite, rel: .02, signe: false, cs: n0, affiche: cs(v, n0), diag, solution, correction: solution });
    if (!sans.includes('schema')) {
      parties.push(window.SCHM.partieDonnees({ schema: sch, etiquettes: et }, {
        q: qs.schema || 'Place les données de l\'énoncé sur le schéma de la méthode. Les « ? » sont les grandeurs à calculer.',
        solution: `<p>Chaque donnée se place dans la colonne de son espèce.</p>${schemaPlein}`, correction: `<p>Chaque donnée se place dans la colonne de son espèce.</p>${schemaPlein}` }));
    }
    if (typeD !== 'n' && !sans.includes('nA')) {
      const calc = typeD === 'm' ? `n(${A.f}) = ${fr(`m(${A.f})`, `M(${A.f})`)} = ${fr(`${fmt(d.m)} g`, `${fmt(d.M)} ${UNITE.M}`)} = <span class="c">${ecr(nA)} mol</span>`
        : typeD === 'c' ? `n(${A.f}) = c × V = ${fmt(d.c)} ${UNITE.c} × ${fmt(d.V / 1000)} L = <span class="c">${ecr(nA)} mol</span>`
          : `n(${A.f}) = ${fr('Q', 'F')} = ${fr(`${fmt(d.Q)} C`, `${fmt(FARADAY)} ${UNITE.F}`)} = <span class="c">${ecr(nA)} mol</span>`;
      parties.push(num(nA, `n(${A.f}) =`, 'mol', qs.nA || `Calcule la quantité de matière de ${A.f} ${verbe(d.k)}${typeD === 'c' ? ' (V en litres)' : ''}.`,
        v => (typeD === 'm' ? diagNm(v, d.m, d.M) : typeD === 'c' ? diagNcV(v, d.c, d.V)
          : egal(v, d.Q * FARADAY) ? 'n = Q / F : on divise la charge par F.' : `n = Q / F = ${fmt(d.Q)} / ${fmt(FARADAY)}.`),
        `${typeD === 'c' ? `<p>V = ${fmt(d.V)} mL = ${fmt(d.V / 1000)} L.</p>` : ''}<p class="ph-calc">${calc}</p>`));
    }
    if (!sans.includes('relation')) parties.push(window.SCHM.choixRelation({ especes: E, depart: d, cible: c }, qs.relation ? { q: qs.relation } : {}));
    if (!sans.includes('nB')) {
      const calc = `${fr(`n(${B.f})`, b)} = ${fr(`n(${A.f})`, a)} donc n(${B.f}) = ${b === 1 ? '' : b + ' × '}${a === 1 ? `n(${A.f})` : fr(`n(${A.f})`, a)} = ${b === 1 ? '' : b + ' × '}${a === 1 ? ecr(nA) : fr(ecr(nA), a)} = <span class="c">${ecr(nB)} mol</span>`;
      parties.push(num(nB, `n(${B.f}) =`, 'mol', qs.nB || `Calcule la quantité de matière de ${B.f} ${verbe(c.k)}.`,
        v => diagRel(v, nA, a, b, A.f, B.f), `<p class="ph-calc">${calc}</p>`));
    }
    if (c.quoi !== 'n' && !sans.includes('res')) {
      if (c.quoi === 'm') {
        parties.push(num(res, `m(${B.f}) =`, 'g', qs.res || `Calcule la masse de ${nom(B)} ${verbe(c.k)}.`,
          v => (d.M && d.M !== c.M && egal(v, nB * d.M) ? `Tu as pris la masse molaire de ${nom(A)} : prends celle de ${nom(B)}, M(${B.f}) = ${fmt(c.M)} ${UNITE.M}.` : diagMasse(v, nB, c.M)),
          `<p class="ph-calc">m(${B.f}) = n(${B.f}) × M(${B.f}) = ${ecr(nB)} mol × ${fmt(c.M)} ${UNITE.M} = <span class="c">${ecr(res)} g</span></p>`));
      } else if (c.quoi === 'c') {
        parties.push(num(res, `c(${B.f}) =`, UNITE.c, qs.res || `Calcule la concentration de ${B.f} (V en litres).`,
          v => diagC(v, nB, c.V),
          `<p class="ph-calc">c(${B.f}) = ${fr(`n(${B.f})`, 'V')} = ${fr(`${ecr(nB)} mol`, `${fmt(c.V / 1000)} L`)} = <span class="c">${ecr(res)} ${UNITE.c}</span></p>`));
      } else {
        parties.push(num(res, 'Q =', 'C', qs.res || 'Calcule la charge électrique Q qui a circulé.',
          v => (egal(v, nB / FARADAY) ? 'Q = n(e<sup>−</sup>) × F : on multiplie par F.' : egal(v, nB) ? 'Ça, c\'est n(e<sup>−</sup>). Multiplie-le par F = 96 500 C·mol<sup>−1</sup>.' : `Q = n(e<sup>−</sup>) × F = ${ecr(nB)} × ${fmt(FARADAY)}.`),
          `<p class="ph-calc">Q = n(${B.f}) × F = ${ecr(nB)} mol × ${fmt(FARADAY)} ${UNITE.F} = <span class="c">${ecr(res)} C</span></p>`));
      }
    }
    return { nA, nB, res, ecr, schema: schemaPlein, parties, etiquettes: et };
  }

  /* ============================================================
     PLAN DE L'APPLICATION ET NAVIGATION (voir assets/sommaire.js)
     ============================================================ */
  const PLAN = [
    { n: 1, titre: 'Oxydants et réducteurs', desc: 'Oxydant, réducteur, couple et demi-équation, oxydation et réduction', fiche: 'fiche_1',
      parties: [{ nom: 'Oxydants et réducteurs', cours: 'module_1_cours', questions: 'module_1_questions' }] },
    { n: 2, titre: 'Écrire une réaction d\'oxydoréduction', desc: 'Qui réagit avec qui, orienter, égaliser les électrons, additionner ; avec H<sup>+</sup> et H<sub>2</sub>O, dismutation', fiche: 'fiche_2',
      parties: [{ nom: 'Écrire une réaction', cours: 'module_2_cours', entrainement: 'module_2_reactions', noms: { entrainement: 'Entraînement : 20 réactions' } }] },
    { n: 3, titre: 'Quantités de matière consommées ou produites', desc: 'n = m / M, n = c × V, relations stœchiométriques, schéma de la méthode, électrons et charge Q = n(e<sup>−</sup>) × F', fiche: 'fiche_3',
      sousModules: true,
      parties: [
        { nom: 'Quantités consommées ou produites', slug: 'quantites', cours: 'module_3a_cours', noms: { cours: 'Cours : quantités consommées ou produites' } },
        { nom: 'Électrons échangés et charge', slug: 'electrons', cours: 'module_3b_cours', noms: { cours: 'Cours : électrons échangés et charge' } },
        { nom: 'Quantités de matière', questions: 'module_3_questions' }] },
    { n: 4, titre: 'Piles, accumulateurs, capacité et énergie', desc: 'Pile, batterie, pile à combustible, chaînes énergétiques, Q = I × Δt, E = Q × U', fiche: 'fiche_4',
      parties: [{ nom: 'Piles et accumulateurs', cours: 'module_4_cours', questions: 'module_4_questions' }] },
    { n: 5, titre: 'Schéma de fonctionnement d\'une pile', desc: 'Anode et cathode, électrons dans les fils, ions dans le pont salin, sens de I et des e<sup>−</sup>, équation de la pile', fiche: 'fiche_5',
      parties: [{ nom: 'Schéma d\'une pile', cours: 'module_5_cours', entrainement: 'module_5_pile', noms: { entrainement: 'Entraînement : schéma d\'une pile' } }] },
    { n: 6, titre: 'Exercices', desc: 'Exercices 1 à 11 de la feuille : réactions, quantités de matière, piles, pile à combustible, accumulateur', exercices: 'module_6', exNom: 'Exercices 1 à 11', nbEx: 11 },
  ];
  window.SOM.init({ nom: 'Chapitre 15 : Oxydoréduction (piles et accumulateurs)', id: 'oxydoreduction-STI2D', cleEx: 'oxydoreduction-STI2D-exercices', plan: PLAN });
  const menu = cle => window.SOM.menu(cle);
  const accueil = zone => window.SOM.accueil(zone);
  const marquer = info => window.SOM.marquer(info);

  window.OX = Object.assign(window.OX || {}, {
    MOINS, fmt, cs, sci, lire, proche, fr, o, fq, el, secouer, melanger, hasard, entre, champ, boutonValider, PARTIES, versCours,
    question, serie, confettis, figure,
    ESP, ELEC, nE, kE, sPl, texte, charge, R, gcd, lcm, egal, CP, demi, reduc, oxyd, couple, equation, REACTIONS, reaction,
    diagNm, diagNcV, diagRel, diagMasse, diagC, svgTxt, figPile, chaine, CHAINES, FARADAY, UNITE, methode,
    PLAN, menu, accueil, marquer,
  });
})();
