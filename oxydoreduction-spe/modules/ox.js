/* ============================================================
   Moteur de l'application « Oxydoréduction » (1re et terminale
   spécialité ; même moteur de questions que « Cinématique » et
   « Chapitre 9 : Statique des fluides » ; navigation commune
   assets/sommaire.js, cours avec assets/cours.js)

   OX.fmt, OX.lire, OX.proche          écriture et lecture des nombres (virgule)
   OX.o, OX.fq.choix, OX.fq.nombre      fabriques d'options et de parties de question
   OX.PARTIES                           parties de question : 'choix', 'nombre',
                                        'grille' (un choix par ligne), 'perso' (p.monter(zone, api) → { montrer() })
   OX.versCours(p)                      une de ces parties dans un cours (assets/cours.js)
   OX.question(zone, q, cb, mode)       question en plusieurs parties (série)
   OX.serie(opts)                       série de questions notée sur 20
   OX.confettis()                       pluie de confettis (sans-faute)

   Propre à l'oxydoréduction :
     OX.COUPLES                         couples oxydant / réducteur (formules de MOL)
     OX.h(f), OX.couple(c)              formule HTML ; couple écrit « Ox / Red »
     OX.charge(n)                       charge écrite avec son signe : +7, −2, 0
   OX.menu(cle), OX.accueil(zone)       navigation commune (SOM) avec le plan de l'application

   L'outil d'équilibrage d'une demi-équation est dans demi.js (DEMI),
   l'écriture des réactions dans reaction.js (REAC). Les styles des
   cartes, boutons et écrans de fin viennent de
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
      const neg = s[0] === '-';
      if (neg) s = s.slice(1);
      let [e, d] = s.split('.');
      e = e.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
      return (neg ? MOINS : '') + (d ? e + ',' + d : e);
    }
    const s = (Math.abs(v) < Math.pow(10, -dec) / 2 ? 0 : v).toFixed(dec);
    return s.replace('-', MOINS).replace('.', ',');
  }
  // lecture d'une saisie : « 2,3 », « −0,5 », « +7 »
  function lire(s) {
    const t = String(s == null ? '' : s).trim().replace(/[\s  ]/g, '').replace(',', '.').replace(/[−–]/g, '-');
    return /^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i.test(t) ? parseFloat(t) : NaN;
  }
  const proche = (a, b, rel) => Math.abs(a - b) <= (rel == null ? .01 : rel) * Math.abs(b) + 1e-12;

  // fabriques de parties de question (cours, séries)
  const o = (id, label) => ({ id, label });
  const fq = {
    choix: (q, options, bonne, opts) => Object.assign({ type: 'choix', q, options, bonne, colonne: options.some(x => x.label.replace(/<[^>]+>/g, '').length > 24) }, opts),
    nombre: (q, label, valeur, unite, opts) => Object.assign({ type: 'nombre', q, label, valeur, unite, tol: 0 }, opts),
  };

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
      <input type="text" class="ph-champ" inputmode="${opts.signe === false ? 'numeric' : 'decimal'}" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="${opts.aria || 'Réponse'}">`;
    const input = d.querySelector('input'), pm = d.querySelector('.ph-pm');
    if (pm) {
      pm.addEventListener('click', () => {
        if (input.disabled) return;
        const v = input.value.trim();
        input.value = /^[-−]/.test(v) ? v.replace(/^[-−]\s*/, '') : MOINS + v.replace(/^\+/, '');
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
     api.reussi() · api.erreur(indice) · api.compterErreur() · api.effacer() · api.message(h) · api.fini()
     ============================================================ */

  // Choix parmi des boutons : p.options [{ id, label }], p.bonne, p.indice ou p.indices[id], p.colonne
  function pChoix(zone, p, api) {
    const box = el('div', 'ph-choix' + (p.colonne ? ' ph-choix-col' : ''));
    zone.appendChild(box);
    const opts = p.melanger === false ? p.options : melanger(p.options);
    const bs = opts.map(x => {
      const b = el('button', 'btn-secondary', x.label);
      b.type = 'button';
      b.dataset.id = x.id;
      box.appendChild(b);
      b.onclick = () => {
        if (api.fini() || b.disabled) return;
        if (x.id === p.bonne) {
          b.classList.add('juste');
          bs.forEach(y => { y.b.disabled = true; });
          api.reussi();
        } else {
          b.classList.add('faux'); b.disabled = true;
          api.erreur((p.indices && p.indices[x.id]) || p.indice || '');
        }
      };
      return { b, o: x };
    });
    return { montrer() { bs.forEach(({ b, o: x }) => { b.disabled = true; if (x.id === p.bonne) b.classList.add('juste'); }); } };
  }

  // Bouton « Valider » d'une partie (disparaît une fois la partie terminée)
  function boutonValider(zone) {
    const a = el('div', 'er-actions ph-actions-partie', '<button type="button" class="btn-primary">Valider</button>');
    zone.appendChild(a);
    const b = a.querySelector('button');
    b.fermer = () => { b.disabled = true; a.remove(); };
    return b;
  }
  function juste(v, p) {
    if (p.tol != null) return Math.abs(v - p.valeur) <= p.tol + 1e-12;
    return proche(v, p.valeur, p.rel == null ? .005 : p.rel);
  }
  // valeur affichée par « Afficher la réponse » (charge : avec son signe)
  function affichage(p) {
    if (p.affiche) return p.affiche;
    if (p.dec != null) return fmt(p.valeur, p.dec);
    return fmt(p.valeur);
  }

  // Valeur numérique : p.label, p.valeur, p.tol (écart absolu, 0 par défaut) ou p.rel, p.unite, p.diag(v), p.indice, p.signe
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
      if (isNaN(v)) { secouer(d); api.message('Écris un nombre entier (avec le signe − s\'il est négatif).'); return; }
      if (juste(v, p)) { ch.desactiver(true); bVal.fermer(); api.reussi(); return; }
      api.erreur((p.diag && p.diag(v)) || p.indice || 'Vérifie ton calcul.');
      secouer(d);
    }
    bVal.onclick = valider;
    return { montrer() { ch.input.value = affichage(p); ch.desactiver(true); bVal.fermer(); } };
  }

  /* Grille de choix : une ligne par élément, un choix par ligne, toutes validées ensemble
     p.lignes [{ id, label (HTML), bonne (id d'option), indices { id d'option: diagnostic }, apres (HTML affiché une fois réussi) }]
     p.options [{ id, label }] : les mêmes pour chaque ligne */
  function pGrille(zone, p, api) {
    const g = el('div', 'ph-grille');
    g.innerHTML = p.lignes.map(l => `<div class="ph-grille-l" data-l="${l.id}">
        <div class="ph-grille-nom">${l.label}</div>
        <div class="ph-grille-ch" role="group" aria-label="${String(l.label).replace(/<[^>]+>/g, '').replace(/"/g, '')}">
          ${p.options.map(x => `<button type="button" class="ph-grille-b" data-o="${x.id}" aria-pressed="false">${x.label}</button>`).join('')}</div>
        <div class="ph-grille-apres" hidden></div></div>`).join('');
    zone.appendChild(g);
    const lignes = Array.from(g.querySelectorAll('.ph-grille-l'));
    const choisi = {};
    lignes.forEach(L => {
      L.querySelectorAll('.ph-grille-b').forEach(b => {
        b.onclick = () => {
          if (api.fini() || b.disabled) return;
          choisi[L.dataset.l] = b.dataset.o;
          L.querySelectorAll('.ph-grille-b').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
          L.classList.remove('ok', 'ko');
          api.effacer();
        };
      });
    });
    const bVal = boutonValider(zone);
    function terminer() {
      lignes.forEach((L, k) => {
        L.classList.remove('ko'); L.classList.add('ok');
        L.querySelectorAll('.ph-grille-b').forEach(b => { b.disabled = true; });
        const a = L.querySelector('.ph-grille-apres');
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
        (ind.length ? '<br>' + ind.map(t => '☛ ' + t).join('<br>') : ''));
      secouer(g);
    };
    return {
      montrer() {
        lignes.forEach((L, k) => L.querySelectorAll('.ph-grille-b').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.o === p.lignes[k].bonne))));
        terminer();
      },
    };
  }

  // Outil propre à l'application : p.monter(zone, api) → { montrer() }
  function pPerso(zone, p, api) {
    const ctx = p.monter(zone, api) || {};
    return { montrer() { if (ctx.montrer) ctx.montrer(); } };
  }

  const PARTIES = { choix: pChoix, nombre: pNombre, grille: pGrille, perso: pPerso };
  // une partie de ce moteur dans un cours (assets/cours.js) : elle y devient un outil « perso »
  const versCours = p => ({ type: 'perso', q: p.q, solution: p.solution, aide: p.aide, orig: p, monter: (zone, api) => PARTIES[p.type](zone, p, api) });

  /* ============================================================
     UNE QUESTION : parties successives
     q = { parties: [p] } ; p = { type, q (texte), figure(zone), solution (HTML affiché après), … }
     Bouton « Afficher la réponse » (0 point pour la question).
     cb.fin(points) : 2 sans erreur, 1 après au moins une erreur (ou une aide payante), 0 si une réponse est affichée
     ============================================================ */
  function question(zone, q, cb) {
    const etat = { erreurs: 0, vue: false, fini: false, details: [] };
    const n = q.parties.length;
    let rendues = 0, finies = 0;
    function partie() {
      const p = q.parties[rendues++];
      window.OX.partieEnCours = p;          // partie en cours (utile pour vérifier l'application)
      const d = el('div', 'ph-partie', `${p.q ? `<div class="ph-partie-q">${p.q}</div>` : ''}<div class="ph-partie-fig"></div><div class="ph-partie-zone"></div><div class="ph-partie-retour"></div>
        <div class="ph-partie-aide"><button type="button" class="btn-small">Afficher la réponse</button></div>`);
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
          ret.innerHTML = `<div class="callout-danger er-retour"><p><b class="er-ko">Ce n'est pas ça.</b> ${h || ''}</p>${erreursIci >= 2 ? '<p class="er-petit">Corrige ta réponse, ou affiche la réponse (0 point pour cette question).</p>' : ''}</div>`;
        },
        reussi(silencieux, note) { terminer(false, silencieux, note); },
      };
      window.OX.apiEnCours = api;           // (idem)
      const ctx = PARTIES[p.type](d.querySelector('.ph-partie-zone'), p, api);
      bRep.onclick = () => { if (finie) return; ctx.montrer(); etat.vue = true; terminer(true); };
      function terminer(vue, silencieux, note) {
        if (finie) return;
        finie = true;
        aide.remove();
        etat.details.push({ vue, erreurs: erreursIci });
        const titre = vue ? 'Réponse' : (erreursIci ? 'C\'est juste.' : 'Juste !');
        const sol = p.solution;
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
     opts = { app, badge, titre, intro, bareme (HTML ajouté au barème), questions: () => [q], revoir, suite }
     q = { theme, consigne, enonce, figure(zone), parties, bilan }
     ============================================================ */
  function serie(opts) {
    const app = opts.app;
    let qs = [], idx = 0, score = 0, recap = [];
    const pts = v => `${v} pt${v > 1 ? 's' : ''}`;

    function intro() {
      app.innerHTML = `<div class="er-card"><span class="er-badge">${opts.badge}</span><h2 class="er-titre">${opts.titre}</h2>${opts.intro || ''}
        <div class="cle" style="margin:14px 0"><p><b class="cle-titre">Barème</b> · ${opts.nombre || 10} questions, notées sur 20 :</p>
          <ul class="er-liste"><li><b>2 points</b> si tout est juste du premier coup${opts.aidesPayantes ? ', sans afficher les aides' : ''} ;</li><li><b>1 point</b> si tu y arrives après au moins une erreur${opts.aidesPayantes ? ' ou en affichant les aides' : ''} ;</li><li><b>0 point</b> si tu affiches la réponse.</li></ul>${opts.bareme || ''}</div>
        <button type="button" class="btn-primary" data-a="go">Commencer →</button></div>`;
      app.querySelector('[data-a="go"]').onclick = demarrer;
      window.scrollTo(0, 0);
    }
    function demarrer() { qs = opts.questions(); idx = 0; score = 0; recap = []; afficher(); }

    function afficher() {
      if (idx >= qs.length) return fin();
      const q = qs[idx];
      window.OX.questionEnCours = q;          // question en cours (utile pour vérifier l'application)
      window.DragDrop && window.DragDrop.cleanupGhosts();
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
          const titre = p === 2 ? 'Bravo, juste du premier coup !' : p === 1 ? 'C\'est juste, après au moins une erreur ou une aide.' : 'La réponse a été affichée.';
          app.querySelector('[data-a="retour"]').innerHTML = `<div class="${p ? 'callout-success' : 'callout'} er-retour ph-bilan"><p><b class="${p ? 'er-ok' : ''}">${titre}</b> +${pts(p)}</p>${q.bilan ? `<p>${q.bilan}</p>` : ''}</div>`;
          const s = app.querySelector('[data-a="suite"]'), der = idx === qs.length - 1;
          s.innerHTML = `<button type="button" class="btn-primary" disabled>${der ? 'Voir mon score →' : 'Question suivante →'}</button>`;
          const b = s.querySelector('button');
          setTimeout(() => { b.disabled = false; }, 450);
          b.onclick = () => { idx++; afficher(); };
          setTimeout(() => s.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 80);
        },
      });
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
    const col = ['#0a7d57', '#16a34a', '#e8890c', '#d61f69', '#2952c8'];
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
     PROPRE À L'OXYDORÉDUCTION
     ============================================================ */
  // Couples oxydant / réducteur (formules lues par assets/molecules.js, charge après ^)
  const COUPLES = {
    MnO4: { ox: 'MnO4^-', red: 'Mn^2+' },
    Cr2O7: { ox: 'Cr2O7^2-', red: 'Cr^3+' },
    I2: { ox: 'I2', red: 'I^-' },
    S4O6: { ox: 'S4O6^2-', red: 'S2O3^2-' },
    SO4: { ox: 'SO4^2-', red: 'SO2' },
    NO3: { ox: 'NO3^-', red: 'NO' },
    NO3b: { ox: 'NO3^-', red: 'NO2' },
    CO2: { ox: 'CO2', red: 'H2C2O4' },
    H2O2: { ox: 'H2O2', red: 'H2O' },
    O2: { ox: 'O2', red: 'H2O2' },
    O2e: { ox: 'O2', red: 'H2O' },
    H: { ox: 'H^+', red: 'H2' },
    IO3: { ox: 'IO3^-', red: 'I2' },
    ClO: { ox: 'ClO^-', red: 'Cl2' },
    Cl2: { ox: 'Cl2', red: 'Cl^-' },
    Br2: { ox: 'Br2', red: 'Br^-' },
    Fe3: { ox: 'Fe^3+', red: 'Fe^2+' },
    Fe: { ox: 'Fe^2+', red: 'Fe' },
    Cu: { ox: 'Cu^2+', red: 'Cu' },
    Zn: { ox: 'Zn^2+', red: 'Zn' },
    Ag: { ox: 'Ag^+', red: 'Ag' },
    Al: { ox: 'Al^3+', red: 'Al' },
    Pb: { ox: 'Pb^2+', red: 'Pb' },
    Sn: { ox: 'Sn^4+', red: 'Sn^2+' },
    Ac: { ox: 'CH3COOH', red: 'CH3CH2OH' },
    Ald: { ox: 'CH3CHO', red: 'CH3CH2OH' },
  };
  const h = f => window.MOL.formuleHTML(f);
  const couple = c => `${h(c.ox)} / ${h(c.red)}`;
  const charge = n => (n > 0 ? '+' + n : n < 0 ? MOINS + -n : '0');

  /* ============================================================
     PLAN DE L'APPLICATION ET NAVIGATION (voir assets/sommaire.js)
     ============================================================ */
  const PLAN = [
    { n: 1, titre: 'Oxydants, réducteurs et couples', desc: 'Oxydant, réducteur, couple Ox / Red, oxydation et réduction, réaction entre un oxydant et un réducteur', fiche: 'fiche_1',
      parties: [{ nom: 'Oxydants, réducteurs et couples', cours: 'module_1_cours', questions: 'module_1_questions' }] },
    { n: 2, titre: 'Équilibrer une demi-équation', desc: 'Les éléments, O avec H<sub>2</sub>O, H avec H<sup>+</sup>, les charges avec les électrons', fiche: 'fiche_2',
      parties: [{ nom: 'La méthode en 4 étapes', slug: 'methode', cours: 'module_2a_cours' },
        { nom: 'Les électrons : test et entraînement', slug: 'electrons', cours: 'module_2b_cours', questions: 'module_2_questions' }] },
    { n: 3, titre: 'Écrire l\'équation d\'une réaction', desc: 'Deux demi-équations, orienter, égaliser les électrons, additionner et simplifier', fiche: 'fiche_3',
      parties: [{ nom: 'Écrire l\'équation d\'une réaction', cours: 'module_3_cours', questions: 'module_3_questions' }] },
    { n: 4, titre: 'Entraînement : écrire les réactions', desc: 'Les deux demi-équations puis l\'équation de la réaction, l\'aide diminue au fil des 10 réactions',
      parties: [{ nom: 'Écrire les réactions', entrainement: 'module_4' }] },
  ];
  window.SOM.init({ nom: 'Oxydoréduction', id: 'oxydoreduction-spe', plan: PLAN });
  const menu = cle => window.SOM.menu(cle);
  const accueil = zone => window.SOM.accueil(zone);
  const marquer = info => window.SOM.marquer(info);

  window.OX = Object.assign(window.OX || {}, {
    MOINS, fmt, lire, proche, o, fq, el, secouer, melanger, hasard, entre, champ, boutonValider, PARTIES, versCours,
    question, serie, confettis,
    COUPLES, h, couple, charge,
    PLAN, menu, accueil, marquer,
  });
})();
