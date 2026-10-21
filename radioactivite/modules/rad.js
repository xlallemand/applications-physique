/* ============================================================
   Moteur de l'application « Chapitre 12 : Radioactivité »
   (Terminale STI2D ; même moteur de questions que « Chapitre 11 :
   Changements d'état et transferts thermiques » ; navigation commune
   assets/sommaire.js, cours avec assets/cours.js)

   RAD.fmt, RAD.cs, RAD.sci, RAD.lire     écriture et lecture des nombres (virgule)
   RAD.o, RAD.fq.choix, RAD.fq.nombre      fabriques d'options et de parties de question
   RAD.PARTIES                             parties de question : 'choix', 'nombre', 'gabarit', 'sci',
                                           'grille' (un choix par ligne), 'perso' (p.monter(zone, api) → { montrer() })
   RAD.versCours(p)                        une de ces parties dans un cours (assets/cours.js)
   RAD.question(zone, q, cb, mode)         question en plusieurs parties (série, exercice, activité)
   RAD.serie(opts)                         série de questions notée sur 20
   RAD.figure(dessin)                      figure dessinée à la largeur disponible : dessin(W) → SVG

   Propre au chapitre 12 :
     RAD.ELEMENTS, symboleDe, nomDe, zDe   extrait de la classification (Z = 1 à 100)
     RAD.nuc(A, Z, X), RAD.equation(g, d)  écriture d'un noyau ᴬ_Z X et d'une équation de désintégration
     RAD.PARTICULES, RAD.NOYAUX            particules α, β⁻, β⁺ ; noyaux radioactifs réels (questions au hasard)
     RAD.desintegration(pere, type)        noyau fils et particule émise (conservation de A et de Z)
     RAD.partieEquation(def, opts)         outil : équation à trous (A, Z par conservation, puis
                                           l'élément d'après Z dans un extrait de la classification)
     RAD.partieTableau(lignes, opts)       outil : tableau des isotopes (ex. 7), une ligne à la fois
     RAD.figCourbe(def)                    courbe de décroissance N(t), A(t) ou m(t) (SVG)
     RAD.partieLecture(def, opts)          outil : lire t½ (ou une date) sur la courbe en trois gestes :
                                           placer la valeur sur l'axe, aller à la courbe, lire la date
                                           (repris des lectures en pointillés de lecture-graphique/modules/lgtools.js)
   RAD.menu(cle), RAD.accueil(zone)        navigation commune (SOM) avec le plan de l'application

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
    const d = el('div', 'ph-valeur rad-gab');
    if (p.label) d.appendChild(el('span', 'ph-lab', p.label));
    // chaque case forme un groupe insécable avec le texte qui la suit : sur un petit écran,
    // la ligne ne se coupe qu'entre deux groupes
    const champs = [];
    let grp = el('span', 'rad-gab-grp');
    d.appendChild(grp);
    p.morceaux.forEach(m => {
      if (typeof m === 'string') { grp.appendChild(el('span', 'rad-gab-txt', m)); return; }
      if (champs.length) { grp = el('span', 'rad-gab-grp'); d.appendChild(grp); }
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
    const g = el('div', 'rad-grille');
    g.innerHTML = p.lignes.map(l => `<div class="rad-grille-l" data-l="${l.id}">
        <div class="rad-grille-nom">${l.label}</div>
        <div class="rad-grille-ch" role="group" aria-label="${String(l.label).replace(/<[^>]+>/g, '').replace(/"/g, '')}">
          ${p.options.map(o => `<button type="button" class="rad-grille-b" data-o="${o.id}" aria-pressed="false">${o.label}</button>`).join('')}</div>
        <div class="rad-grille-apres" hidden></div></div>`).join('');
    zone.appendChild(g);
    const lignes = Array.from(g.querySelectorAll('.rad-grille-l'));
    const choisi = {};
    lignes.forEach(L => {
      L.querySelectorAll('.rad-grille-b').forEach(b => {
        b.onclick = () => {
          if (api.fini() || b.disabled) return;
          choisi[L.dataset.l] = b.dataset.o;
          L.querySelectorAll('.rad-grille-b').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
          L.classList.remove('ok', 'ko');
          api.effacer();
        };
      });
    });
    const bVal = boutonValider(zone);
    function terminer() {
      lignes.forEach((L, k) => {
        L.classList.remove('ko'); L.classList.add('ok');
        L.querySelectorAll('.rad-grille-b').forEach(b => { b.disabled = true; });
        const a = L.querySelector('.rad-grille-apres');
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
        lignes.forEach((L, k) => L.querySelectorAll('.rad-grille-b').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.o === p.lignes[k].bonne))));
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
      window.RAD.partieEnCours = p;          // partie en cours (utile pour vérifier l'application)
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
      window.RAD.questionEnCours = q;          // question en cours (utile pour vérifier l'application)
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
    return `<div class="rad-fig${cls ? ' ' + cls : ''}" data-fig="${k}"></div>`;
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
    const l = racine.matches && racine.matches('.rad-fig[data-fig]') ? [racine] : [];
    racine.querySelectorAll('.rad-fig[data-fig]').forEach(x => l.push(x));
    l.forEach(x => { const f = FIGS.get(x.dataset.fig); if (f) monterFig(x, f); });
  }

  new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(n => chercherFigs(n)))).observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener('DOMContentLoaded', () => chercherFigs(document.body));

  /* ============================================================
     PROPRE AU CHAPITRE 12
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
  const zDe = s => ELEMENTS.findIndex(e => e && e[0] === s);

  /* ---------- Écriture d'un noyau ᴬ_Z X et d'une équation ---------- */
  // A au-dessus de Z, à gauche du symbole ; A, Z et X peuvent être du HTML (case à compléter)
  const nuc = (A, Z, s) => `<span class="rad-nuc"><span class="rad-az"><span>${A}</span><span>${typeof Z === 'number' ? signe(Z) : Z}</span></span><span class="rad-s">${s}</span></span>`;
  // particules émises
  const PARTICULES = {
    alpha: { A: 4, Z: 2, s: 'He', nom: 'noyau d\'hélium', type: 'α' },
    moins: { A: 0, Z: -1, s: 'e', nom: 'électron', type: 'β<sup>−</sup>' },
    plus: { A: 0, Z: 1, s: 'e', nom: 'positron (positon)', type: 'β<sup>+</sup>' },
  };
  const n = (A, Z, s) => ({ A, Z, s: s || symboleDe(Z) });
  const nucDe = x => (typeof x === 'string' ? `<span class="rad-s">${x}</span>` : nuc(x.A, x.Z, x.s));        // 'γ' : rayonnement
  // équation : listes de noyaux (ou 'γ') à gauche et à droite de la flèche
  const equation = (g, d) => `<span class="rad-eq">${g.map(nucDe).join('<span class="rad-plus">+</span>')}<span class="rad-fl">→</span>${d.map(nucDe).join('<span class="rad-plus">+</span>')}</span>`;
  // type de la particule émise (clé de PARTICULES) d'après A, Z et le symbole
  const typeDe = x => (x.s === 'He' ? 'alpha' : x.s === 'e' ? (x.Z < 0 ? 'moins' : 'plus') : null);

  /* ---------- Noyaux radioactifs réels pour les questions tirées au hasard ---------- */
  const NOYAUX = {
    alpha: [n(238, 92), n(235, 92), n(226, 88), n(222, 86), n(210, 84), n(241, 95), n(239, 94), n(232, 90), n(218, 84)],
    moins: [n(14, 6), n(32, 15), n(60, 27), n(137, 55), n(131, 53), n(90, 38), n(3, 1), n(99, 42), n(40, 19)],
    plus: [n(15, 8), n(11, 6), n(13, 7), n(18, 9), n(22, 11), n(30, 15), n(12, 7), n(53, 27)],
  };
  // désintégration d'un noyau père : { pere, fils, part, type, ordre (particule écrite en premier ou non) }
  function desintegration(pere, type, ordre) {
    const p = PARTICULES[type];
    const A = pere.A - p.A, Z = pere.Z - p.Z;
    return { pere, fils: n(A, Z), part: n(p.A, p.Z, p.s), type, ordre: ordre == null ? Math.random() < .5 : ordre };
  }
  const droiteDe = d => (d.ordre ? [d.part, d.fils] : [d.fils, d.part]);
  const equationDe = d => equation([d.pere], droiteDe(d));

  /* ============================================================
     OUTIL : ÉQUATION DE DÉSINTÉGRATION À TROUS
     def = { g: [noyau…], d: [noyau…] } ; noyau = { A, Z, s, inc } où inc contient
     'A', 'Z' et/ou 's' : les nombres et le symbole à trouver.
     1. l'élève complète les nombres par conservation (« la somme des A à droite doit valoir … ») ;
     2. il trouve l'élément d'après Z dans un extrait de la classification
        (ou la particule d'après A et Z).
     ============================================================ */
  function outilEquation(zone, def, api) {
    const box = el('div', 'rad-eqd');
    const cotes = { g: def.g, d: def.d };
    const cases = [];
    let symbole = null;                       // noyau dont le symbole est à trouver
    const ligne = el('div', 'rad-eqd-l');
    const morceaux = [];
    ['g', 'd'].forEach(c => {
      cotes[c].forEach((x, i) => {
        if (i) morceaux.push('<span class="rad-plus">+</span>');
        if (x === 'γ') { morceaux.push('<span class="rad-s">γ</span>'); return; }
        const inc = x.inc || '';
        const A = inc.includes('A') ? `<span data-c="${c}${i}A"></span>` : x.A;
        const Z = inc.includes('Z') ? `<span data-c="${c}${i}Z"></span>` : signe(x.Z);
        if (inc.includes('s')) symbole = x;
        morceaux.push(nuc(A, Z, inc.includes('s') ? '<span class="rad-trou">?</span>' : x.s));
      });
      if (c === 'g') morceaux.push('<span class="rad-fl">→</span>');
    });
    ligne.innerHTML = `<span class="rad-eq">${morceaux.join('')}</span>`;
    box.appendChild(ligne);
    zone.appendChild(box);
    // champs des nombres à trouver
    ligne.querySelectorAll('[data-c]').forEach(s => {
      const c = s.dataset.c[0], i = +s.dataset.c[1], k = s.dataset.c[2];
      const ch = champ({ petit: true, signe: k === 'Z', aria: (k === 'A' ? 'Nombre de nucléons A' : 'Numéro atomique Z') });
      s.replaceWith(ch.el);
      ch.input.addEventListener('input', () => { api.effacer(); ch.el.classList.remove('ko'); });
      ch.input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); valider(); } });
      cases.push({ x: cotes[c][i], c, k, ch });
    });
    const suite = el('div', 'rad-eqd-suite');
    box.appendChild(suite);
    let bVal = null, phase = cases.length ? 1 : 2;
    const somme = (c, k, vals) => cotes[c].reduce((s, x) => {
      if (x === 'γ') return s;
      const ca = cases.find(u => u.x === x && u.k === k);
      return s + (ca ? vals.get(ca) : x[k]);
    }, 0);
    // une somme de nombres écrite : 4 + 231
    const sommeTxt = (c, k, vals) => cotes[c].filter(x => x !== 'γ').map(x => { const ca = cases.find(u => u.x === x && u.k === k); return ca ? vals.get(ca) : x[k]; })
      .map((v, j) => (j && v < 0 ? `(${signe(v)})` : signe(v))).join(' + ');

    function valider() {
      if (api.fini() || phase !== 1) return;
      const vals = new Map();
      for (const ca of cases) {
        const v = lire(ca.ch.input.value);
        if (isNaN(v) || !Number.isInteger(v)) { secouer(ligne); api.message('Complète chaque case avec un nombre entier.'); return; }
        vals.set(ca, v);
      }
      const ok = cases.map(ca => vals.get(ca) === ca.x[ca.k]);
      if (ok.every(Boolean)) {
        cases.forEach(ca => { ca.ch.desactiver(true); ca.ch.el.classList.remove('ko'); });
        if (bVal) bVal.fermer();
        phase = 2;
        if (symbole) choisir(); else api.reussi();
        return;
      }
      cases.forEach((ca, j) => ca.ch.el.classList.toggle('ko', !ok[j]));
      // diagnostic : A et Z inversés, puis somme des A, puis somme des Z
      const inv = cases.find(ca => ca.k === 'A' && vals.get(ca) === ca.x.Z && cases.some(u => u.x === ca.x && u.k === 'Z' && vals.get(u) === ca.x.A));
      let h;
      if (inv) h = 'Tu as inversé A et Z : A, en haut, est le nombre de <b>nucléons</b> ; Z, en bas, le nombre de <b>protons</b>.';
      else {
        for (const k of ['A', 'Z']) {
          const faux = cases.find((ca, j) => ca.k === k && !ok[j]);
          if (!faux) continue;
          const ici = faux.c, autre = ici === 'g' ? 'd' : 'g', nomCote = ici === 'g' ? 'à gauche' : 'à droite', nomAutre = ici === 'g' ? 'à droite' : 'à gauche';
          const voulu = somme(autre, k, vals), obtenu = somme(ici, k, vals);
          h = `Conservation de ${k === 'A' ? 'A (nombre de nucléons)' : 'Z (nombre de charge)'} : la somme des ${k} ${nomCote} doit valoir <b>${signe(voulu)}</b>, comme ${nomAutre}. Avec tes nombres, elle vaut ${sommeTxt(ici, k, vals)} = ${signe(obtenu)}.`;
          if (k === 'Z' && cotes[ici].some(x => x !== 'γ' && x.s === 'e')) h += ' Attention au signe : l\'électron compte pour Z = −1, le positron pour Z = +1.';
          break;
        }
      }
      api.erreur(h || 'Vérifie tes nombres.');
      secouer(ligne);
    }
    if (cases.length) { bVal = boutonValider(suite); bVal.onclick = valider; }

    // 2. le symbole : particule d'après A et Z, ou élément d'après Z (extrait de la classification)
    let grille = null;
    function choisir() {
      const x = symbole, part = typeDe(x);
      grille = el('div', 'rad-choixs');
      if (part) {
        grille.innerHTML = `<p class="rad-choixs-t">Quelle particule a A = ${x.A} et Z = ${signe(x.Z)} ?</p><div class="ph-choix">${
          Object.keys(PARTICULES).map(k => `<button type="button" class="btn-secondary" data-k="${k}">${nucDe(PARTICULES[k])}&nbsp; ${PARTICULES[k].nom}</button>`).join('')}</div>`;
      } else {
        // extrait de 12 éléments consécutifs contenant Z (à une place au hasard)
        const nb = 12, debut = Math.max(1, Math.min(ELEMENTS.length - nb, x.Z - entre(2, nb - 3)));
        let cases12 = '';
        for (let z = debut; z < debut + nb; z++) cases12 += `<button type="button" class="rad-elt" data-z="${z}" aria-label="${nomDe(z)}, Z = ${z}"><span class="rad-elt-z">${z}</span><span class="rad-elt-s">${symboleDe(z)}</span><span class="rad-elt-n">${nomDe(z)}</span></button>`;
        grille.innerHTML = `<p class="rad-choixs-t">Extrait de la classification : trouve l'élément de numéro atomique Z = ${x.Z}.</p><div class="rad-elts">${cases12}</div>`;
      }
      suite.appendChild(grille);
      grille.querySelectorAll('button').forEach(b => {
        b.onclick = () => {
          if (api.fini() || b.disabled) return;
          const juste = part ? b.dataset.k === part : +b.dataset.z === x.Z;
          if (juste) { b.classList.add('juste'); remplir(); api.reussi(); return; }
          b.classList.add('faux'); b.disabled = true;
          if (part) {
            const p = PARTICULES[b.dataset.k];
            api.erreur(`${nucDe(p)} a A = ${p.A} et Z = ${signe(p.Z)}. Compare avec les nombres trouvés : A = ${x.A} et Z = ${signe(x.Z)}.`);
          } else api.erreur(`${cap(nomDe(+b.dataset.z))} a pour numéro atomique Z = ${b.dataset.z}. C'est Z (le nombre de protons) qui fixe l'élément : cherche Z = ${x.Z}.`);
        };
      });
      setTimeout(() => grille.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 80);
    }
    function remplir() {
      const t = ligne.querySelector('.rad-trou');
      if (t) { t.textContent = symbole.s; t.classList.add('trouve'); }
      if (grille) grille.querySelectorAll('button').forEach(b => { b.disabled = true; });
    }
    if (phase === 2) choisir();
    return {
      montrer() {
        cases.forEach(ca => { ca.ch.input.value = signe(ca.x[ca.k]); ca.ch.desactiver(true); ca.ch.el.classList.remove('ko'); });
        if (bVal) bVal.fermer();
        if (symbole) {
          if (!grille) choisir();
          const part = typeDe(symbole);
          const b = grille.querySelector(part ? `[data-k="${part}"]` : `[data-z="${symbole.Z}"]`);
          if (b) b.classList.add('juste');
          remplir();
        }
      },
    };
  }
  const partieEquation = (def, opts) => Object.assign({ type: 'perso', outil: 'equation', def, monter: (z, api) => outilEquation(z, def, api) }, opts);

  /* ============================================================
     OUTIL : TABLEAU DES ISOTOPES (exercice 7), une ligne à la fois
     lignes = [{ A, Z, surnom, inc }] ; inc contient les cases à remplir :
       'n' nom (élément à choisir), 's' symbole (élément à choisir), 'Z', 'A', 'N' (neutrons)
     opts.elements : symboles proposés dans les listes (par défaut ceux du tableau)
     ============================================================ */
  function outilTableau(zone, lignes, api, opts) {
    opts = opts || {};
    const elts = opts.elements || Array.from(new Set(lignes.map(l => symboleDe(l.Z))));
    const nomComplet = l => `${cap(nomDe(l.Z))} ${l.A}${l.surnom ? ` (${l.surnom})` : ''}`;
    const box = el('div', 'rad-tabi');
    box.innerHTML = `<div class="rad-defile"><table class="rad-tab rad-tab-iso"><thead><tr><th>Nom de l'isotope</th><th>Symbole</th><th>Protons Z</th><th>Nucléons A</th><th>Neutrons</th></tr></thead><tbody></tbody></table></div>`;
    zone.appendChild(box);
    const tb = box.querySelector('tbody');
    const bVal = boutonValider(box);
    let k = 0, ctx = null;
    // ligne écrite (remplie)
    // intitulés des colonnes, repris dans chaque case (sur un écran étroit, une ligne devient une fiche verticale)
    const LAB = { n: 'Nom de l\'isotope', s: 'Symbole', Z: 'Protons Z', A: 'Nucléons A', N: 'Neutrons' };
    const ligneFaite = l => `<tr class="faite"><th data-lab="${LAB.n}">${nomComplet(l)}</th><td data-lab="${LAB.s}">${nuc(l.A, l.Z, symboleDe(l.Z))}</td><td data-lab="${LAB.Z}">${l.Z}</td><td data-lab="${LAB.A}">${l.A}</td><td data-lab="${LAB.N}">${l.A - l.Z}</td></tr>`;
    const select = (quoi, aria) => `<select class="rad-select" data-q="${quoi}" aria-label="${aria}"><option value="">…</option>${
      elts.map(s => `<option value="${s}">${quoi === 'n' ? cap(nomDe(zDe(s))) : s}</option>`).join('')}</select>`;
    function afficher() {
      const l = lignes[k], inc = l.inc || '';
      const tr = el('tr', 'active');
      const cell = (c, html) => `<td data-k="${c}" data-lab="${LAB[c]}">${html}</td>`;
      // A et Z affichés dans le nom et le symbole : valeur connue, ou celle tapée par l'élève
      tr.innerHTML = `<th data-k="n" data-lab="${LAB.n}">${inc.includes('n') ? `${select('n', 'Nom de l\'élément')} <span class="rad-miroir" data-m="A">${inc.includes('A') ? '…' : l.A}</span>` : nomComplet(l)}</th>
        ${cell('s', inc.includes('s') ? `<span class="rad-sym-choix">${nuc(`<span class="rad-miroir" data-m="A">${inc.includes('A') ? '…' : l.A}</span>`, `<span class="rad-miroir" data-m="Z">${inc.includes('Z') ? '…' : l.Z}</span>`, select('s', 'Symbole de l\'élément'))}</span>` : nuc(l.A, l.Z, symboleDe(l.Z)))}
        ${cell('Z', inc.includes('Z') ? '<span data-ch="Z"></span>' : l.Z)}${cell('A', inc.includes('A') ? '<span data-ch="A"></span>' : l.A)}${cell('N', inc.includes('N') ? '<span data-ch="N"></span>' : l.A - l.Z)}`;
      tb.appendChild(tr);
      const chs = {};
      tr.querySelectorAll('[data-ch]').forEach(s => {
        const q = s.dataset.ch, c = champ({ petit: true, signe: false, aria: { Z: 'Nombre de protons Z', A: 'Nombre de nucléons A', N: 'Nombre de neutrons' }[q] });
        s.replaceWith(c.el);
        chs[q] = c;
        c.input.addEventListener('input', () => {
          api.effacer(); c.el.closest('td').classList.remove('ko');
          tr.querySelectorAll(`[data-m="${q}"]`).forEach(m => { m.textContent = c.input.value.trim() || '…'; });
        });
        c.input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); valider(); } });
      });
      tr.querySelectorAll('select').forEach(s => s.addEventListener('change', () => { api.effacer(); s.closest('td, th').classList.remove('ko'); }));
      ctx = { l, tr, chs };
    }
    function valider() {
      if (api.fini() || !ctx) return;
      const { l, tr, chs } = ctx, inc = l.inc || '';
      const v = {};
      for (const q of Object.keys(chs)) {
        v[q] = lire(chs[q].input.value);
        if (isNaN(v[q])) { secouer(tr); api.message('Complète toutes les cases de la ligne.'); return; }
      }
      const sels = {};
      tr.querySelectorAll('select').forEach(s => { sels[s.dataset.q] = s.value; });
      if (Object.values(sels).some(x => !x)) { secouer(tr); api.message('Choisis l\'élément dans la liste.'); return; }
      const attendu = { Z: l.Z, A: l.A, N: l.A - l.Z };
      const faux = [];
      Object.keys(v).forEach(q => { if (v[q] !== attendu[q]) faux.push(q); });
      Object.keys(sels).forEach(q => { if (sels[q] !== symboleDe(l.Z)) faux.push(q); });
      tr.querySelectorAll('td, th').forEach(c => c.classList.toggle('ko', faux.includes(c.dataset.k)));
      if (!faux.length) {
        tr.replaceWith(el('tbody', null, ligneFaite(l)).firstElementChild);
        k++;
        if (k < lignes.length) { afficher(); api.effacer(); api.message('✓ Ligne juste. Passe à la ligne suivante.'); } else { bVal.fermer(); api.reussi(); }
        return;
      }
      // diagnostics ciblés
      const d = [];
      if (faux.includes('N')) d.push(v.N === l.A + l.Z ? 'Neutrons = A − Z (nucléons moins protons), pas A + Z.' : v.N === l.A ? 'A compte tous les nucléons : pour les seuls neutrons, retire les Z protons.' : 'Nombre de neutrons = A − Z.');
      if (faux.includes('A')) d.push(inc.includes('N') ? 'A est écrit dans le nom de l\'isotope (oxygène 16 : A = 16) et en haut du symbole.' : 'A = nombre de protons + nombre de neutrons.');
      if (faux.includes('Z')) d.push('Z est fixé par l\'élément : tous les isotopes d\'un même élément ont le même Z.');
      if (faux.includes('n') || faux.includes('s')) d.push(`C'est Z qui fixe l'élément${inc.includes('Z') ? '' : ` : cherche celui de numéro atomique Z = ${l.Z}`}${opts.donnees ? ' (voir les données)' : ''}.`);
      api.erreur(`${faux.length > 1 ? 'Les cases en rouge sont fausses.' : 'La case en rouge est fausse.'} ${d.join(' ')}`);
      secouer(tr);
    }
    bVal.onclick = valider;
    afficher();
    return {
      montrer() {
        tb.innerHTML = lignes.map(ligneFaite).join('');
        k = lignes.length; ctx = null;
        bVal.fermer();
      },
    };
  }
  const partieTableau = (lignes, opts) => Object.assign({ type: 'perso', outil: 'tableau', lignes, monter: (z, api) => outilTableau(z, lignes, api, opts) }, opts);

  /* ============================================================
     GRAPHIQUES : courbe de décroissance (N, A ou m en fonction de t)
     def = {
       f: t => valeur,                          courbe (décroissante)
       x: { max, pas, fin, titre, etiq },       axe des temps : graduations (pas), pas fin du curseur, nom avec l'unité,
                                                étiquettes propres (facultatif : etiq(v) → texte SVG)
       y: { max, pas, fin, titre, etiq },       axe vertical
       grilleFine: true,                        quadrillage fin (lecture précise), au pas x.grille / y.grille (par défaut le pas fin)
       points: [[t, v]…],                        points de mesure (croix), facultatif
       reperes: [{ y, t, txt, txtT }…],          lectures en pointillés (valeur y → courbe → t), facultatif
       courbes: [{ f, txt }…],                   autres courbes, facultatif
     }
     ============================================================ */
  function geo(W, def) {
    const H = Math.round(Math.max(230, Math.min(340, W * .62)));
    const m = { g: def.margeG || 54, d: 14, h: 34, b: 44 };
    const x0 = def.x.min || 0, y0 = def.y.min || 0;
    const L = W - m.g - m.d, Hh = H - m.h - m.b;
    return {
      W, H, m,
      px: v => m.g + (v - x0) / (def.x.max - x0) * L,
      py: v => H - m.b - (v - y0) / (def.y.max - y0) * Hh,
      vx: X => x0 + (X - m.g) / L * (def.x.max - x0),
      vy: Y => y0 + (H - m.b - Y) / Hh * (def.y.max - y0),
    };
  }
  const nb1 = v => +(+v).toPrecision(10);                       // évite 0,30000000004
  // abscisse où la courbe (décroissante) vaut y, par dichotomie
  function tPour(def, y, f) {
    f = f || def.f;
    let a = def.x.min || 0, b = def.x.max * 4;
    for (let i = 0; i < 80; i++) { const c = (a + b) / 2; if (f(c) > y) a = c; else b = c; }
    return (a + b) / 2;
  }
  // fond du graphique : quadrillage, axes, graduations, noms des axes, courbe(s), points
  function svgFond(G, def) {
    const { W, H, m, px, py } = G, x = def.x, y = def.y, x0 = x.min || 0, y0 = y.min || 0;
    let s = '';
    const nx = Math.round((x.max - x0) / x.pas), ny = Math.round((y.max - y0) / y.pas);
    // quadrillage fin (pas fin) puis principal
    if (def.grilleFine) {
      const gx = x.grille || x.fin, gy = y.grille || y.fin;
      for (let v = x0; v <= x.max + 1e-9; v += gx) s += `<line x1="${f1(px(v))}" y1="${f1(py(y0))}" x2="${f1(px(v))}" y2="${f1(py(y.max))}" class="rad-grille-fine"/>`;
      for (let v = y0; v <= y.max + 1e-9; v += gy) s += `<line x1="${f1(px(x0))}" y1="${f1(py(v))}" x2="${f1(px(x.max))}" y2="${f1(py(v))}" class="rad-grille-fine"/>`;
    }
    for (let i = 1; i <= nx; i++) s += `<line x1="${f1(px(x0 + i * x.pas))}" y1="${f1(py(y0))}" x2="${f1(px(x0 + i * x.pas))}" y2="${f1(py(y.max))}" class="rad-grille"/>`;
    for (let i = 1; i <= ny; i++) s += `<line x1="${f1(px(x0))}" y1="${f1(py(y0 + i * y.pas))}" x2="${f1(px(x.max))}" y2="${f1(py(y0 + i * y.pas))}" class="rad-grille"/>`;
    // graduations : une étiquette sur k si la place manque
    const kx = Math.max(1, Math.ceil(34 / (px(x0 + x.pas) - px(x0)))), ky = Math.max(1, Math.ceil(18 / (py(y0) - py(y0 + y.pas))));
    // étiquettes : nombres, ou texte propre à la figure (x.etiq(v), y.etiq(v) : '' pour aucune)
    const ex = x.etiq || (v => fmt(nb1(v))), ey = y.etiq || (v => fmt(nb1(v)));
    for (let i = 0; i <= nx; i += kx) s += `<text x="${f1(px(x0 + i * x.pas))}" y="${f1(py(y0) + 17)}" text-anchor="middle" class="rad-grad">${ex(nb1(x0 + i * x.pas))}</text>`;
    for (let i = 0; i <= ny; i += ky) s += `<text x="${f1(px(x0) - 6)}" y="${f1(py(y0 + i * y.pas) + 4)}" text-anchor="end" class="rad-grad">${ey(nb1(y0 + i * y.pas))}</text>`;
    // axes et flèches
    s += `<line x1="${f1(px(x0))}" y1="${f1(py(y0))}" x2="${W - 4}" y2="${f1(py(y0))}" class="rad-axe"/><path d="M${W - 2},${f1(py(y0))} l-8,-4 v8 z" class="rad-fleche"/>`;
    s += `<line x1="${f1(px(x0))}" y1="${f1(py(y0))}" x2="${f1(px(x0))}" y2="${m.h - 14}" class="rad-axe"/><path d="M${f1(px(x0))},${m.h - 16} l-4,8 h8 z" class="rad-fleche"/>`;
    s += `<text x="${W - 4}" y="${H - 6}" text-anchor="end" class="rad-axe-nom">${x.titre}</text>`;
    s += `<text x="${f1(px(x0) + 8)}" y="${m.h - 8}" class="rad-axe-nom">${y.titre}</text>`;
    // courbe(s), rognée(s) au cadre
    const trace = (f, cls) => {
      let d = '';
      for (let i = 0; i <= 300; i++) {
        const t = x0 + (x.max - x0) * i / 300, v = Math.max(y0, Math.min(y.max, f(t)));
        d += (i ? 'L' : 'M') + f1(px(t)) + ',' + f1(py(v));
      }
      return `<path d="${d}" class="${cls}"/>`;
    };
    if (def.f) s += trace(def.f, 'rad-courbe');
    (def.courbes || []).forEach(c => { s += trace(c.f, 'rad-courbe2'); if (c.txt) s += `<text x="${f1(px(c.tx))}" y="${f1(py(c.f(c.tx)) - 8)}" text-anchor="middle" class="rad-txt">${c.txt}</text>`; });
    (def.points || []).forEach(([t, v]) => { const X = px(t), Y = py(v); s += `<path d="M${f1(X - 5)},${f1(Y)} h10 M${f1(X)},${f1(Y - 5)} v10" class="rad-croix"/>`; });
    // lectures en pointillés : niveau y → courbe → axe des temps
    (def.reperes || []).forEach(r => {
      const t = r.t != null ? r.t : tPour(def, r.y), X = px(t), Y = py(r.y);
      s += `<line x1="${f1(px(x0))}" y1="${f1(Y)}" x2="${f1(X)}" y2="${f1(Y)}" class="rad-lecture"/><line x1="${f1(X)}" y1="${f1(Y)}" x2="${f1(X)}" y2="${f1(py(y0))}" class="rad-lecture"/>`;
      s += `<circle cx="${f1(X)}" cy="${f1(Y)}" r="4" class="rad-point"/>`;
      if (r.txt) s += `<text x="${f1(px(x0) + 6)}" y="${f1(Y - 6)}" class="rad-txt">${r.txt}</text>`;
      if (r.txtT) s += `<text x="${f1(X + 5)}" y="${f1(py(y0) - 7)}" class="rad-txt">${r.txtT}</text>`;
    });
    return s;
  }
  const svgGraphe = (G, def, contenu, aria) => `<svg viewBox="0 0 ${G.W} ${G.H}" width="${G.W}" height="${G.H}" class="rad-graphe" role="img" aria-label="${aria || 'Courbe de décroissance'}">${svgFond(G, def)}${contenu || ''}</svg>`;
  // figure statique, dessinée à la largeur disponible
  const figCourbe = (def, aria) => figure(W => svgGraphe(geo(Math.max(280, W), def), def, '', aria), 'rad-fig-graphe');

  /* ============================================================
     OUTIL : LIRE UNE DURÉE SUR LA COURBE (demi-vie, âge d'un échantillon)
     def (comme un graphique) + {
       mode: 'demi' | 'valeur',      'demi' : placer N₀/2 ; 'valeur' : placer la valeur donnée (def.cible)
       y0: valeur initiale, sym: 'N' (nom de la grandeur, pour N₀/2), cible,
       rep: { label: 't<sub>1/2</sub> =', unite: 's', facteur: 1, tol }   réponse attendue = t lu × facteur
     }
     1. placer la valeur sur l'axe vertical (glisser la poignée ou ▲ ▼) ;
     2. glisser le point jusqu'à la courbe (ou ◀ ▶) ;
     3. lire la date sur l'axe des temps et l'écrire.
     ============================================================ */
  function outilLecture(zone, def, api) {
    const mode = def.mode || 'demi', sym = def.sym || 'N';
    const cible = mode === 'demi' ? def.y0 / 2 : def.cible;
    const tc = tPour(def, cible);
    const rep = Object.assign({ label: mode === 'demi' ? 't<sub>1/2</sub> =' : 't =', unite: '', facteur: 1 }, def.rep);
    const yNom = mode === 'demi' ? `${sym}<tspan dy="4" font-size="10">0</tspan><tspan dy="-4">/2</tspan>` : `${sym}`;
    const st = { phase: 1, y: def.y.max * .85, t: def.x.min || 0, drag: null };
    st.y = Math.round(st.y / def.y.fin) * def.y.fin;
    const box = el('div', 'rad-lect');
    box.innerHTML = `<p class="rad-lect-consigne"></p><div class="rad-lect-fig"></div>
      <div class="rad-lect-bas"><span class="rad-lect-val" aria-live="polite"></span><span class="rad-lect-fl"></span></div><div class="rad-lect-rep"></div>`;
    zone.appendChild(box);
    const figz = box.querySelector('.rad-lect-fig'), consigne = box.querySelector('.rad-lect-consigne'), val = box.querySelector('.rad-lect-val'), fls = box.querySelector('.rad-lect-fl'), repz = box.querySelector('.rad-lect-rep');
    let G = null, svg = null, dyn = null, largeur = 0;
    const yTxt = v => `${sym} = ${fmt(nb1(v))}`;
    function dessiner() {
      const W = Math.max(280, Math.min(640, Math.round(figz.clientWidth || 600)));
      if (W === largeur && svg) return majDyn();
      largeur = W;
      G = geo(W, def);
      figz.innerHTML = svgGraphe(G, def, '<g class="rad-dyn"></g>', 'Courbe de décroissance : place la valeur, puis va jusqu\'à la courbe');
      svg = figz.querySelector('svg'); dyn = svg.querySelector('.rad-dyn');
      brancher();
      majDyn();
    }
    // partie mobile : niveau, point, lecture
    function majDyn() {
      if (!dyn) return;
      const { px, py } = G, x0 = def.x.min || 0, y0 = def.y.min || 0;
      const Y = py(st.y);
      let s = `<line x1="${f1(px(x0))}" y1="${f1(Y)}" x2="${f1(st.phase === 1 ? px(def.x.max) : px(st.t))}" y2="${f1(Y)}" class="rad-lecture${st.phase === 1 ? ' guide' : ''}"/>`;
      if (st.phase >= 3) s += `<line x1="${f1(px(st.t))}" y1="${f1(Y)}" x2="${f1(px(st.t))}" y2="${f1(py(y0))}" class="rad-lecture"/><circle cx="${f1(px(st.t))}" cy="${f1(py(y0))}" r="4" class="rad-point"/>`;
      if (st.phase >= 2) s += `<text x="${f1(px(x0) + 6)}" y="${f1(Y - 7)}" class="rad-txt">${mode === 'demi' ? yNom : `${sym} = ${fmt(nb1(cible))}`}</text>`;
      if (st.phase === 1) s += `<circle cx="${f1(px(x0))}" cy="${f1(Y)}" r="9" class="rad-poignee-v"/><circle cx="${f1(px(x0))}" cy="${f1(Y)}" r="24" class="rad-prise" data-p="y"/>`;
      else if (st.phase === 2) s += `<circle cx="${f1(px(st.t))}" cy="${f1(Y)}" r="9" class="rad-poignee-v"/><circle cx="${f1(px(st.t))}" cy="${f1(Y)}" r="24" class="rad-prise" data-p="t"/>`;
      else s += `<circle cx="${f1(px(st.t))}" cy="${f1(Y)}" r="5" class="rad-point"/>`;
      dyn.innerHTML = s;
      val.innerHTML = st.phase === 1 ? yTxt(st.y) : st.phase === 2 ? `t = ${fmt(nb1(st.t))}` : '';
    }
    function brancher() {
      // iOS : pas de défilement de la page quand le geste commence sur une poignée
      svg.addEventListener('touchstart', e => { if (e.target.closest && e.target.closest('.rad-prise')) e.preventDefault(); }, { passive: false });
      svg.addEventListener('touchmove', e => { if (st.drag) e.preventDefault(); }, { passive: false });
      svg.addEventListener('pointerdown', e => {
        if (st.drag || api.fini() || (e.pointerType === 'mouse' && e.button !== 0)) return;
        const h = e.target.closest && e.target.closest('.rad-prise');
        if (!h) return;
        e.preventDefault();
        st.drag = { id: e.pointerId };
        try { svg.setPointerCapture(e.pointerId); } catch (_) { /* rien */ }
        svg.classList.add('glisse');
      });
      svg.addEventListener('pointermove', e => {
        if (!st.drag || e.pointerId !== st.drag.id) return;
        e.preventDefault();
        const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY;
        const q = p.matrixTransform(svg.getScreenCTM().inverse());
        if (st.phase === 1) poserY(G.vy(q.y)); else if (st.phase === 2) poserT(G.vx(q.x));
      });
      const fin = e => { if (!st.drag || e.pointerId !== st.drag.id) return; st.drag = null; svg.classList.remove('glisse'); };
      ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(t => svg.addEventListener(t, fin));
    }
    const borne = (v, a, b) => Math.max(a, Math.min(b, v));
    function poserY(v) { st.y = borne(Math.round(v / def.y.fin) * def.y.fin, def.y.min || 0, def.y.max); api.effacer(); majDyn(); }
    function poserT(v) { st.t = borne(Math.round(v / def.x.fin) * def.x.fin, def.x.min || 0, def.x.max); api.effacer(); majDyn(); }
    // boutons fléchés (indispensables au doigt) et « Valider » de chaque étape
    function boutons() {
      fls.innerHTML = st.phase === 1
        ? '<button type="button" class="rad-fl-b" data-d="1" aria-label="Monter">▲</button><button type="button" class="rad-fl-b" data-d="-1" aria-label="Descendre">▼</button>'
        : st.phase === 2 ? '<button type="button" class="rad-fl-b" data-d="-1" aria-label="Vers la gauche">◀</button><button type="button" class="rad-fl-b" data-d="1" aria-label="Vers la droite">▶</button>' : '';
      fls.querySelectorAll('button').forEach(b => {
        b.onclick = () => {
          if (api.fini()) return;
          const d = +b.dataset.d;
          if (st.phase === 1) poserY(st.y + d * def.y.fin); else poserT(st.t + d * def.x.fin);
        };
      });
    }
    let bVal = null;
    function etape() {
      if (bVal) bVal.fermer();
      boutons();
      if (st.phase === 1) consigne.innerHTML = mode === 'demi'
        ? `<b>1.</b> Lis la valeur initiale ${sym}<sub>0</sub> (à t = 0), puis place <b>${sym}<sub>0</sub>/2</b> sur l'axe vertical : glisse la poignée ou utilise ▲ ▼.`
        : `<b>1.</b> Place la valeur <b>${def.cibleTxt || fmt(cible)}</b> sur l'axe vertical : glisse la poignée ou utilise ▲ ▼.`;
      else if (st.phase === 2) consigne.innerHTML = '<b>2.</b> Reporte sur la courbe : glisse le point vers la droite jusqu\'à la courbe (ou ◀ ▶).';
      else consigne.innerHTML = '<b>3.</b> Reporte sur l\'axe des temps et lis la date.';
      if (st.phase < 3) {
        bVal = boutonValider(repz);
        bVal.onclick = validerEtape;
      } else {
        // 3. lecture de la date
        const d = el('div', 'ph-valeur');
        d.innerHTML = `<span class="ph-lab">${rep.label}</span>`;
        const ch = champ({ signe: false, aria: 'Date lue sur l\'axe des temps' });
        d.appendChild(ch.el);
        if (rep.unite) d.appendChild(el('span', 'ph-unite', rep.unite));
        repz.appendChild(d);
        bVal = boutonValider(repz);
        const lireT = () => {
          if (api.fini()) return;
          const v = lire(ch.input.value);
          if (isNaN(v)) { secouer(d); api.message('Écris un nombre (avec une virgule si besoin).'); return; }
          const attendu = tc * rep.facteur, tol = (rep.tol != null ? rep.tol : def.x.fin * .6) * rep.facteur;
          if (Math.abs(v - attendu) <= tol) { ch.desactiver(true); bVal.fermer(); api.reussi(); return; }
          let h;
          if (Math.abs(v - cible) < 1e-9 * Math.max(1, cible) || Math.abs(v - cible * rep.facteur) < 1e-9 * Math.max(1, cible)) h = 'Ça, c\'est la valeur sur l\'axe vertical : la date se lit sur l\'axe des temps (horizontal).';
          else if (rep.facteur !== 1 && Math.abs(v - tc) <= tol / rep.facteur) h = `Attention à l'unité de l'axe des temps : ${def.x.titre}. Convertis en ${rep.unite}.`;
          else if (mode === 'demi' && Math.abs(v - 2 * attendu) <= 2 * tol) h = `C'est la date où il reste ${sym}<sub>0</sub>/4 (deux demi-vies) : relis la date sous le point.`;
          else h = 'Lis la graduation sous le point, sur l\'axe des temps (compte les carreaux entre deux valeurs écrites).';
          api.erreur(h);
          secouer(d);
        };
        bVal.onclick = lireT;
        ch.input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); lireT(); } });
        ch.input.addEventListener('input', () => api.effacer());
      }
      majDyn();
    }
    function validerEtape() {
      if (api.fini()) return;
      if (st.phase === 1) {
        if (Math.abs(st.y - cible) <= def.y.fin / 2 + 1e-9) { st.phase = 2; st.y = cible; api.effacer(); etape(); return; }
        let h;
        if (mode === 'valeur') h = `Place la valeur de l'énoncé, ${def.cibleTxt || fmt(cible)}, en t'aidant des graduations de l'axe vertical (${def.y.titre}).`;
        else if (Math.abs(st.y - def.y0) <= def.y.fin / 2) h = `C'est la valeur initiale ${sym}<sub>0</sub> : divise-la par 2.`;
        else if (Math.abs(st.y - def.y0 / 4) <= def.y.fin / 2) h = `Tu as divisé ${sym}<sub>0</sub> par 4 : pour une demi-vie, on divise par 2.`;
        else h = `Lis d'abord ${sym}<sub>0</sub>, la valeur de la courbe à t = 0, puis divise-la par 2.`;
        api.erreur(h);
        secouer(figz);
        return;
      }
      if (Math.abs(st.t - tc) <= def.x.fin * .75) { st.phase = 3; st.t = tc; api.effacer(); etape(); return; }
      api.erreur(st.t < tc ? 'Le point n\'est pas encore sur la courbe : continue vers la droite.' : 'Tu as dépassé la courbe : reviens vers la gauche.');
      secouer(figz);
    }
    if (window.ResizeObserver) new ResizeObserver(dessiner).observe(figz); else addEventListener('resize', dessiner);
    dessiner();
    etape();
    return {
      montrer() {
        st.phase = 3; st.y = cible; st.t = tc;
        if (bVal) bVal.fermer();
        fls.innerHTML = '';
        consigne.innerHTML = '';
        repz.innerHTML = `<p class="ph-calc">${rep.label} ${fmt(nb1(+(tc * rep.facteur).toPrecision(3)))}${rep.unite ? ESP + rep.unite : ''}</p>`;
        majDyn();
      },
    };
  }
  const partieLecture = (def, opts) => Object.assign({ type: 'perso', outil: 'lecture', def, monter: (z, api) => outilLecture(z, def, api) }, opts);

  /* ============================================================
     PLAN DE L'APPLICATION ET NAVIGATION (voir assets/sommaire.js)
     ============================================================ */
  const PLAN = [
    { n: 1, titre: 'Noyau et radioactivité', desc: 'Radioactivité naturelle et artificielle, symbole <sup>A</sup><sub>Z</sub>X d\'un noyau, isotopes', fiche: 'fiche_1',
      parties: [{ nom: 'Noyau et radioactivité', simulation: 'module_1_simulation', cours: 'module_1_cours', questions: 'module_1_questions', noms: { simulation: 'Activité : qu\'est-ce que la radioactivité ?' } }] },
    { n: 2, titre: 'Types de radioactivité et équations', desc: 'α, β<sup>−</sup>, β<sup>+</sup>, particule émise, conservation de A et de Z, rayonnement γ', fiche: 'fiche_2',
      sousModules: true,
      parties: [
        { nom: 'Les trois types de radioactivité', slug: 'types', cours: 'module_2a_cours', noms: { cours: 'Cours : les trois types de radioactivité' } },
        { nom: 'Équations de désintégration', slug: 'equations', cours: 'module_2b_cours', noms: { cours: 'Cours : équations de désintégration' } },
        { nom: 'Types et équations', questions: 'module_2_questions' }] },
    { n: 3, titre: 'Activité d\'un échantillon', desc: 'Désintégrations par seconde, becquerel, A = −dN/dt, conversions', fiche: 'fiche_3',
      parties: [{ nom: 'Activité', cours: 'module_3_cours', questions: 'module_3_questions' }] },
    { n: 4, titre: 'Demi-vie', desc: 'Définition, N<sub>0</sub>/2<sup>n</sup>, lecture graphique de t<sub>1/2</sub>, âge d\'un échantillon', fiche: 'fiche_4',
      sousModules: true,
      parties: [
        { nom: 'La demi-vie', slug: 'definition', cours: 'module_4a_cours', noms: { cours: 'Cours : la demi-vie' } },
        { nom: 'Lecture graphique', slug: 'graphique', cours: 'module_4b_cours', noms: { cours: 'Cours : lire une demi-vie sur un graphique' } },
        { nom: 'Demi-vie', questions: 'module_4_questions' }] },
    { n: 5, titre: 'Décroissance exponentielle et calcul de t', desc: 'N(t) = N<sub>0</sub> e<sup>−λt</sup>, A(t) = A<sub>0</sub> e<sup>−λt</sup>, isoler t avec ln', fiche: 'fiche_5',
      sousModules: true,
      parties: [
        { nom: 'La loi de décroissance', slug: 'loi', cours: 'module_5a_cours', noms: { cours: 'Cours : la loi de décroissance' } },
        { nom: 'Isoler t', slug: 'isoler', cours: 'module_5b_cours', noms: { cours: 'Cours : isoler t avec ln' } },
        { nom: 'Calculer t', slug: 'calcul', cours: 'module_5c_cours', noms: { cours: 'Cours : calculer t' } },
        { nom: 'Décroissance exponentielle', questions: 'module_5_questions' }] },
    { n: 6, titre: 'Exercices', desc: 'Exercices 7, 1, 2, 10, 11, 6 et 16 de la feuille, sujet de bac (cobalt 60), exercices 17, 18 et 19', exercices: 'module_6', exNom: 'Exercices de la feuille', nbEx: 11 },
  ];
  window.SOM.init({ nom: 'Chapitre 12 : Radioactivité', id: 'radioactivite', cleEx: 'radioactivite-exercices', plan: PLAN });
  const menu = cle => window.SOM.menu(cle);
  const accueil = zone => window.SOM.accueil(zone);
  const marquer = info => window.SOM.marquer(info);

  window.RAD = Object.assign(window.RAD || {}, {
    MOINS, fmt, cs, sci, lire, proche, fr, o, fq, el, secouer, melanger, hasard, entre, champ, boutonValider, PARTIES, versCours,
    question, serie, confettis, figure,
    ESP, signe, cap, ELEMENTS, symboleDe, nomDe, zDe, nuc, n, nucDe, equation, PARTICULES, typeDe, NOYAUX, desintegration, droiteDe, equationDe,
    outilEquation, partieEquation, outilTableau, partieTableau, geo, tPour, svgGraphe, figCourbe, outilLecture, partieLecture,
    PLAN, menu, accueil, marquer,
  });
})();
