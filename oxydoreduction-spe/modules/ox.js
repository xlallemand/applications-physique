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
     OX.M1                              couples simples et petites écritures des cours du module 1
     OX.DEUX_COUPLES                    réactions dont un réactif appartient à deux couples
     OX.methodeExpress()                la méthode en une infographie (HTML)
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
  const proche = (a, b, rel) => Math.abs(a - b) <= (rel == null ? .01 : rel) * Math.abs(b) + (b === 0 ? 1e-12 : Math.abs(b) * 1e-12);

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

  /* ---------- Cours du module 1 : couples sans H+ ni H2O (formules HTML) ---------- */
  // n : électrons échangés ; qo, qr : charges de l'oxydant et du réducteur
  // (fonction : assets/molecules.js doit être chargé)
  const couplesSimples = () => ({
    Ag:  { ox: h('Ag^+'),  red: 'Ag',       n: 1, qo: 1, qr: 0 },
    Fe3: { ox: h('Fe^3+'), red: h('Fe^2+'), n: 1, qo: 3, qr: 2 },
    Cu:  { ox: h('Cu^2+'), red: 'Cu',       n: 2, qo: 2, qr: 0 },
    Pb:  { ox: h('Pb^2+'), red: 'Pb',       n: 2, qo: 2, qr: 0 },
    Ni:  { ox: h('Ni^2+'), red: 'Ni',       n: 2, qo: 2, qr: 0 },
    Fe:  { ox: h('Fe^2+'), red: 'Fe',       n: 2, qo: 2, qr: 0 },
    Zn:  { ox: h('Zn^2+'), red: 'Zn',       n: 2, qo: 2, qr: 0 },
    Sn:  { ox: h('Sn^4+'), red: h('Sn^2+'), n: 2, qo: 4, qr: 2 },
    Al:  { ox: h('Al^3+'), red: 'Al',       n: 3, qo: 3, qr: 0 },
    Cr:  { ox: h('Cr^3+'), red: 'Cr',       n: 3, qo: 3, qr: 0 },
  });
  const nE = n => (n === 1 ? '' : n + '&nbsp;') + 'e<sup>−</sup>';         // « 2 e⁻ », « e⁻ » (1 ne s'écrit pas)
  const M1 = {
    couples: couplesSimples, nE,
    sPl: n => (n > 1 ? 's' : ''),
    charge: v => (v === 0 ? '0' : v + '+'),                                  // charge d'un ion positif : 2+, 0
    calc: x => `<p class="crs-calc">${x}</p>`,
    demi: c => `${c.ox} + ${nE(c.n)} = ${c.red}`,                            // demi-équation du couple
    reduc: c => `${c.ox} + ${nE(c.n)} → ${c.red}`,                           // lue à l'endroit : réduction (flèche : cours 1c seulement)
    oxyd: c => `${c.red} → ${c.ox} + ${nE(c.n)}`,                            // lue à l'envers : oxydation (idem)
    couple: c => `${c.ox} / ${c.red}`,
    // question « oxydant ou réducteur ? » ; capte : l'espèce X capte des électrons
    choixRole: (X, capte) => ({ type: 'choix', q: `${X} est :`, melanger: false,
      options: [{ id: 'ox', label: 'un oxydant' }, { id: 'red', label: 'un réducteur' }], bonne: capte ? 'ox' : 'red',
      indices: {
        red: `${X} <b>capte</b> des électrons : c'est ce que fait un oxydant. Un réducteur, lui, en cède.`,
        ox: `${X} <b>cède</b> des électrons : c'est ce que fait un réducteur. Un oxydant, lui, en capte.` },
      solution: `<p>${X} ${capte ? 'capte' : 'cède'} des électrons : c'est un <b>${capte ? 'oxydant' : 'réducteur'}</b>.</p>` }),
  };

  /* ---------- Méthode express : toute la méthode en une infographie ----------
     (module 4, « Méthode express », et début du cours du module 3) ;
     renvoie le HTML (assets/molecules.js doit être chargé) */
  function methodeExpress() {
    const H2O = 'H<sub>2</sub>O', HP = 'H<sup>+</sup>', EL = 'e<sup>−</sup>';
    const Mn = h('MnO4^-'), Mn2 = h('Mn^2+'), Fe2 = h('Fe^2+'), Fe3 = h('Fe^3+');
    const c = s => `<span class="c">${s}</span>`;                       // terme ajouté à cette étape
    const ent = s => `<span class="ox-entoure">${s}</span>`;             // réactif entouré
    const barre = s => `<span class="ox-barre-e">${s}</span>`;           // terme simplifié
    // une étape numérotée : règle en gras, exemple dessous
    const etape = (n, regle, ex) => `<li class="ox-info-e"><span class="ox-info-n" aria-hidden="true">${n}</span><p class="ox-info-r">${regle}</p><div class="ox-info-x">${ex}</div></li>`;
    const tete = (n, titre, sous) => `<div class="ox-info-tete"><b aria-hidden="true">${n}</b><h3>${titre}<small>${sous}</small></h3></div>`;
    const fleche = '<div class="ox-info-fl" aria-hidden="true">↓</div>';
    return `<div class="ox-info">
  <section class="ox-info-bloc">
    ${tete('A', 'Les mots', 'Oxydant, réducteur, couple, réduction, oxydation')}
    <div class="ox-info-mots">
      <div class="ox-info-tuile"><b>Oxydant</b>capte des électrons : ${Mn}, ${h('Cu^2+')}, ${Fe3}…</div>
      <div class="ox-info-tuile"><b>Réducteur</b>cède des électrons : ${Fe2}, Zn, ${h('I^-')}…</div>
      <div class="ox-info-tuile"><b>Couple Ox / Red</b>Ox + n ${EL} = Red<br><small>les électrons du côté de l'oxydant</small></div>
      <div class="ox-info-tuile ox-info-sens"><b>Réduction et oxydation</b>
        <div class="ox-info-sch">
          <p class="ox-info-def"><b>Oxydation</b>formation de l'oxydant</p>
          <div class="ox-info-dem">
            <span class="ox-info-lab">réduction</span>
            <span class="ox-info-ar ox-info-ar-d" aria-hidden="true"></span>
            <span class="ox-info-eq">Ox + n ${EL} = Red</span>
            <span class="ox-info-ar ox-info-ar-g" aria-hidden="true"></span>
            <span class="ox-info-lab">oxydation</span>
          </div>
          <p class="ox-info-def"><b>Réduction</b>formation du réducteur</p>
        </div>
      </div>
    </div>
  </section>
  ${fleche}
  <section class="ox-info-bloc">
    ${tete('B', 'Écrire la demi-équation d\'un couple', `4 étapes, sur le couple ${Mn} / ${Mn2}`)}
    <ol class="ox-info-etapes">
      ${etape(1, 'Oxydant à gauche, réducteur à droite. Équilibrer les éléments autres que O et H <small>(un nombre devant l\'espèce, jamais un indice)</small>', `${Mn} = ${Mn2} &nbsp;<small>(1 Mn de chaque côté)</small>`)}
      ${etape(2, `Équilibrer O : ajouter ${H2O} du côté où il en manque`, `${Mn} = ${Mn2} + ${c(`4&nbsp;${H2O}`)}`)}
      ${etape(3, `Équilibrer H : ajouter ${HP} du côté où il en manque <small>(une molécule ${H2O} contient 2 H)</small>`, `${Mn} + ${c(`8&nbsp;${HP}`)} = ${Mn2} + 4&nbsp;${H2O}`)}
      ${etape(4, `Équilibrer les charges : ajouter ${EL} du côté où la charge est la plus grande <small>(+7 contre +2 : 5 ${EL})</small>`, `${Mn} + 8&nbsp;${HP} + ${c(`5&nbsp;${EL}`)} = ${Mn2} + 4&nbsp;${H2O}`)}
    </ol>
  </section>
  ${fleche}
  <section class="ox-info-bloc">
    ${tete('C', 'Écrire l\'équation de la réaction', `3 étapes, réaction entre ${Mn} et ${Fe2}`)}
    <ol class="ox-info-etapes">
      ${etape(1, 'Entourer les réactifs dans les couples, puis écrire les deux demi-équations dans le bon sens : le réactif à gauche du signe =',
        `${ent(Mn)} / ${Mn2} &nbsp; et &nbsp; ${Fe3} / ${ent(Fe2)}<br>${Mn} + 8&nbsp;${HP} + 5&nbsp;${EL} = ${Mn2} + 4&nbsp;${H2O} &nbsp;<small>(réduction)</small><br>${Fe2} = ${Fe3} + ${EL} &nbsp;<small>(oxydation)</small>`)}
      ${etape(2, 'Multiplier pour que les deux demi-équations échangent le même nombre d\'électrons', `1 × ( … 5&nbsp;${EL} … ) &nbsp; et &nbsp; ${c('5 ×')} ( ${Fe2} = ${Fe3} + ${EL} )`)}
      ${etape(3, `Additionner, puis simplifier les électrons (et les ${HP}, ${H2O} présents des deux côtés)`,
        `${Mn} + 5&nbsp;${Fe2} + 8&nbsp;${HP} + ${barre(`5&nbsp;${EL}`)} → ${Mn2} + 5&nbsp;${Fe3} + 4&nbsp;${H2O} + ${barre(`5&nbsp;${EL}`)}`)}
    </ol>
    <p class="ox-info-fin">${Mn} + 5&nbsp;${Fe2} + 8&nbsp;${HP} → ${Mn2} + 5&nbsp;${Fe3} + 4&nbsp;${H2O}</p>
  </section>
  ${fleche}
  <section class="ox-info-bloc">
    ${tete('!', 'Les pièges', 'à vérifier avant de valider')}
    <ul class="ox-info-pieges">
      <li>Ne jamais changer un indice : ${h('Cr2O7^2-')} reste ${h('Cr2O7^2-')}.</li>
      <li>Une molécule ${H2O} contient 2 atomes H.</li>
      <li>Un électron porte la charge −1 : une charge négative compte en moins.</li>
      <li>Multiplier <b>toute</b> la demi-équation, pas seulement une espèce.</li>
      <li>Aucun électron dans l'équation de la réaction.</li>
      <li>À la fin : autant d'atomes de chaque élément et la même charge de chaque côté.</li>
    </ul>
  </section>
</div>`;
  }

  /* ---------- Réactions dont un réactif appartient à deux couples ----------
     (oxydant dans l'un, réducteur dans l'autre : il faut le prendre dans le bon couple)
     p : [couple dont l'oxydant réagit, couple dont le réducteur réagit] ;
     x : 0 si ce réactif est l'oxydant de p[0], 1 s'il est le réducteur de p[1] ;
     leurre : son autre couple, où il joue l'autre rôle */
  const DEUX_COUPLES = [
    { p: ['MnO4', 'O2'], x: 1, leurre: 'H2O2' },        // H2O2 réducteur (O2 / H2O2), pas oxydant (H2O2 / H2O)
    { p: ['Cr2O7', 'O2'], x: 1, leurre: 'H2O2' },
    { p: ['H2O2', 'Fe3'], x: 0, leurre: 'O2' },         // H2O2 oxydant (H2O2 / H2O), pas réducteur (O2 / H2O2)
    { p: ['H2O2', 'I2'], x: 0, leurre: 'O2' },
    { p: ['MnO4', 'Fe3'], x: 1, leurre: 'Fe' },         // Fe2+ réducteur (Fe3+ / Fe2+), pas oxydant (Fe2+ / Fe)
    { p: ['Cr2O7', 'Fe3'], x: 1, leurre: 'Fe' },
    { p: ['Fe', 'Zn'], x: 0, leurre: 'Fe3' },           // Fe2+ oxydant (Fe2+ / Fe), pas réducteur (Fe3+ / Fe2+)
    { p: ['Fe', 'Al'], x: 0, leurre: 'Fe3' },
    { p: ['I2', 'S4O6'], x: 0, leurre: 'IO3' },         // I2 oxydant (I2 / I−), pas réducteur (IO3− / I2)
    { p: ['Cl2', 'Fe3'], x: 0, leurre: 'ClO' },         // Cl2 oxydant (Cl2 / Cl−), pas réducteur (ClO− / Cl2)
  ];

  /* ============================================================
     PLAN DE L'APPLICATION ET NAVIGATION (voir assets/sommaire.js)
     ============================================================ */
  // deux progressions : toute l'application (modules 1 à 4), ou la progression rapide
  // (module 4 : méthode express en une infographie, puis l'entraînement)
  const PLAN = [
    { n: 1, titre: 'Oxydants, réducteurs et couples', desc: 'Oxydant, réducteur, couple Ox / Red, oxydation et réduction, réaction entre un oxydant et un réducteur', fiche: 'fiche_1',
      // quatre sous-modules de cours, puis les questions et la fiche
      sousModules: true,
      parties: [
        { nom: 'Oxydant et réducteur', slug: 'oxred', cours: 'module_1a_cours', noms: { cours: 'Cours : oxydant et réducteur' } },
        { nom: 'Couple et demi-équation', slug: 'couple', cours: 'module_1b_cours', noms: { cours: 'Cours : couple et demi-équation' } },
        { nom: 'Oxydation et réduction', slug: 'oxydation', cours: 'module_1c_cours', noms: { cours: 'Cours : oxydation et réduction' } },
        { nom: 'Réaction entre un oxydant et un réducteur', slug: 'reaction', cours: 'module_1d_cours', noms: { cours: 'Cours : réaction entre un oxydant et un réducteur' } },
        { nom: 'Oxydants, réducteurs et couples', questions: 'module_1_questions' }] },
    { n: 2, titre: 'Équilibrer une demi-équation', desc: 'La méthode en 4 étapes : les éléments, O avec H<sub>2</sub>O, H avec H<sup>+</sup>, les charges avec les électrons', fiche: 'fiche_2',
      // deux sous-modules de cours, puis les questions et la fiche
      sousModules: true,
      parties: [
        { nom: 'La méthode en 4 étapes', slug: 'methode', cours: 'module_2a_cours', noms: { cours: 'Cours : la méthode en 4 étapes' } },
        { nom: 'Équilibrer les charges', slug: 'charges', cours: 'module_2b_cours', noms: { cours: 'Cours : équilibrer les charges' } },
        { nom: 'Équilibrer une demi-équation', questions: 'module_2_questions' }] },
    { n: 3, titre: 'Écrire l\'équation d\'une réaction', desc: 'Les demi-équations dans le bon sens, égaliser les électrons, additionner et simplifier', fiche: 'fiche_3',
      parties: [{ nom: 'Écrire l\'équation d\'une réaction', cours: 'module_3_cours', questions: 'module_3_questions' }] },
    { n: 4, titre: 'Écrire les réactions', desc: 'La méthode express en une infographie (progression rapide), puis 10 réactions : l\'aide diminue',
      parties: [{ nom: 'Écrire les réactions', cours: 'module_4_cours', entrainement: 'module_4', noms: { cours: 'Méthode express' } }] },
  ];
  window.SOM.init({ nom: 'Oxydoréduction', id: 'oxydoreduction-spe', plan: PLAN, flashcards: true });
  const menu = cle => window.SOM.menu(cle);
  const accueil = zone => window.SOM.accueil(zone);
  const marquer = info => window.SOM.marquer(info);

  window.OX = Object.assign(window.OX || {}, {
    MOINS, fmt, lire, proche, o, fq, el, secouer, melanger, hasard, entre, champ, boutonValider, PARTIES, versCours,
    question, serie, confettis,
    COUPLES, h, couple, charge, M1, DEUX_COUPLES, methodeExpress,
    PLAN, menu, accueil, marquer,
  });
})();
