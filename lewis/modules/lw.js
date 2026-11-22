/* ============================================================
   Moteur de l'application « Schémas de Lewis »
   (Chimie · Seconde ; moteur de questions repris de « Classification périodique »,
   navigation commune assets/sommaire.js, éléments avec l'outil ATOME de assets/atome.js,
   schémas : modules/lw-schema.js, outils des modules : lw-atomes.js, lw-outils.js)

   LW.fmt(v, dec), LW.lire(s), LW.el(tag, cls, html), LW.melanger(t), LW.hasard(t), LW.tirer(t, k)
   LW.defiler(e), LW.amener(e), LW.surOrdi(), LW.revois(liste)
   LW.PARTIES                       parties de question :
     'choix'  : p.options [{ id, label }], p.bonne, p.indices[id] ou p.indice, p.colonne
     'nombre' : p.label, p.unite, p.verifier(v, texte) → { ok } | { diag } | { format } ; p.remplir(input)
     'champs' : p.champs [{ id, label, unite, bonne }], p.verifier(vals) → { ok } | { diag, faux: [id] } ;
                plusieurs nombres entiers validés ensemble (cases fausses en rouge)
     'perso'  : p.monter(zone, api) → { montrer() } ; api.reussi(), api.erreur(diag), api.message(h)
   LW.question(zone, q, cb, mode)   question en parties successives ; mode 'serie' ou 'manip'
   LW.serie(opts)                   série de 10 questions notée sur 20
   LW.cadre(zone, cfg)              page sur un seul écran : zone de travail à gauche, panneau à droite
                                    (onglets sur téléphone)
   LW.situations(c, liste, opts)    situations au choix (pastilles), « Situation suivante → », page faite
   LW.confettis()
   ============================================================ */
(function () {
  'use strict';

  /* ---------- Plan de l'application (sommaire, accueil, progression) ---------- */
  const PLAN = [
    { n: 1, titre: 'De l\'atome à la molécule', desc: 'Électrons de valence, liaisons à former et doublets non liants de chaque atome, puis relier les traits libres pour construire la molécule',
      parties: [{ nom: 'De l\'atome à la molécule', entrainement: 'module_1_manip', noms: { entrainement: 'Manipulation : de l\'atome à la molécule' } }] },
    { n: 2, titre: 'Ce schéma est-il juste ?', desc: 'Compter les doublets liants et non liants autour de chaque atome, règles du duet et de l\'octet, conclure',
      parties: [{ nom: 'Ce schéma est-il juste ?', entrainement: 'module_2_manip', noms: { entrainement: 'Manipulation : ce schéma est-il juste ?' } }] },
    { n: 3, titre: 'Compléter un schéma', desc: 'Ajouter les doublets non liants ou la liaison double ou triple qui manquent, puis vérifier atome par atome',
      parties: [{ nom: 'Compléter un schéma', entrainement: 'module_3_manip', noms: { entrainement: 'Manipulation : compléter un schéma' } }] },
    { n: 4, titre: 'Entraînement', desc: 'Série notée sur 20 : construire, vérifier et compléter des schémas de Lewis',
      parties: [{ nom: 'Entraînement', questions: 'module_4_questions', noms: { questions: 'Entraînement' } }] },
  ];
  SOM.init({ nom: 'Schémas de Lewis', id: 'lewis', plan: PLAN });

  const MOINS = '−';

  /* ============================================================
     NOMBRES
     ============================================================ */
  // nombre écrit à la française : 2,3 ; −0,30 ; 1 000 (dec : nombre de décimales imposé)
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
  // lecture d'une saisie : « 2,3 », « −0,5 », « 22.1 »
  function lire(s) {
    const t = String(s == null ? '' : s).trim().replace(/[\s  ]/g, '').replace(/[−–]/g, '-').replace(',', '.');
    return /^[-+]?(\d+\.?\d*|\.\d+)$/.test(t) ? parseFloat(t) : NaN;
  }

  /* ============================================================
     OUTILS
     ============================================================ */
  function el(tag, cls, html) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }
  function melanger(t) {
    const a = t.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }
  const hasard = t => t[Math.floor(Math.random() * t.length)];
  const tirer = (t, k) => melanger(t).slice(0, k);
  const defiler = e => setTimeout(() => e && e.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 80);
  const surOrdi = () => matchMedia('(hover: hover)').matches;
  // amène le haut de e à l'écran (sous le bandeau du sommaire) s'il n'y est pas : on n'a jamais
  // à remonter dans la page pour répondre à la question suivante
  function amener(e, haut) {
    setTimeout(() => {
      if (!e) return;
      const r = e.getBoundingClientRect();
      if (r.top >= 62 && r.top <= innerHeight * (haut || 0.6)) return;
      const doux = !matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollBy({ top: r.top - 72, behavior: doux ? 'smooth' : 'auto' });
    }, 120);
  }

  /* ============================================================
     PARTIES DE QUESTION
     Chaque partie reçoit (zone, p, api) et renvoie { montrer() }.
     ============================================================ */
  // Choix parmi des boutons : p.options [{ id, label }], p.bonne, p.indice ou p.indices[id], p.colonne
  function pChoix(zone, p, api) {
    const box = el('div', 'ph-choix' + (p.colonne ? ' ph-choix-col' : '') + (p.grand ? ' lw-choix-grand' : ''));
    zone.appendChild(box);
    const opts = p.melanger === false ? p.options : melanger(p.options);
    const bs = opts.map(o => {
      const b = el('button', 'btn-secondary', o.label);
      b.type = 'button'; b.dataset.id = o.id;
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

  // icône calculatrice (assets/theme.css) : valeur à calculer à la calculatrice
  const CALC = '<span class="calc-icone" role="img" aria-label="À calculer à la calculatrice" title="À calculer à la calculatrice"></span>';

  // champ de saisie avec bouton ± (le clavier numérique des téléphones n'a pas toujours de « − »)
  function champ(o) {
    o = o || {};
    const d = el('span', 'ph-champ-box' + (o.petit ? ' petit' : ''));
    d.innerHTML = `${o.signe ? '<button type="button" class="ph-pm" aria-label="Changer le signe">±</button>' : ''}<input type="text" class="ph-champ" inputmode="${o.entier ? 'numeric' : 'decimal'}" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="${o.aria || 'Réponse'}">`;
    const input = d.querySelector('input'), pm = d.querySelector('.ph-pm');
    if (pm) pm.addEventListener('click', () => {
      if (input.disabled) return;
      const v = input.value.trim();
      input.value = /^[-−]/.test(v) ? v.replace(/^[-−]\s*/, '') : MOINS + v;
      input.dispatchEvent(new Event('input'));
      if (surOrdi()) input.focus();
    });
    return { el: d, input, desactiver(b) { input.disabled = b; if (pm) pm.disabled = b; } };
  }

  // Saisie d'un nombre : p.verifier(v, texte) → { ok } | { diag } | { format } ; p.remplir(input) : réponse affichée
  function pNombre(zone, p, api) {
    const c = champ({ entier: p.entier, signe: p.signe, aria: p.aria || p.label });
    const box = el('div', 'lw-saisie');
    const l = el('div', 'lw-saisie-l', p.label ? `<span class="lw-saisie-t">${p.label}</span>` : '');
    l.appendChild(c.el);
    if (p.unite) l.appendChild(el('span', 'lw-unite', p.unite));
    if (p.calc) l.insertAdjacentHTML('beforeend', CALC);
    box.appendChild(l);
    box.insertAdjacentHTML('beforeend', '<div class="er-actions"><button type="button" class="btn-primary" data-a="ok">Valider</button></div>');
    zone.appendChild(box);
    function valider() {
      if (api.fini()) return;
      const v = lire(c.input.value);
      if (isNaN(v)) { api.message(p.entier ? 'Écris un nombre entier.' : 'Écris un nombre (avec une virgule si besoin).'); return; }
      const r = p.verifier(v, c.input.value) || {};
      if (r.format) { api.message(r.format); return; }
      if (r.ok) { c.desactiver(true); box.querySelector('[data-a="ok"]').disabled = true; api.reussi(); }
      else api.erreur(r.diag || '');
    }
    box.querySelector('[data-a="ok"]').onclick = valider;
    c.input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); valider(); } });
    c.input.addEventListener('input', () => api.effacer());
    if (surOrdi() && p.focus !== false) setTimeout(() => c.input.focus({ preventScroll: true }), 50);
    return {
      montrer() {
        c.desactiver(true); box.querySelector('[data-a="ok"]').disabled = true;
        if (p.remplir) p.remplir(c.input);
      },
    };
  }

  // Plusieurs nombres entiers validés ensemble : p.champs [{ id, label, unite, bonne }],
  // p.verifier(vals) → { ok } | { diag, faux: [id] } (par défaut : comparaison avec bonne)
  function pChamps(zone, p, api) {
    const box = el('div', 'lw-champs' + (p.ligne ? ' lw-champs-ligne' : ''));
    const cs = {};
    p.champs.forEach(f => {
      const c = champ({ entier: true, petit: true, aria: f.aria || f.label.replace(/<[^>]+>/g, '') });
      const l = el('label', 'lw-champ-l', `<span class="lw-champ-t">${f.label}</span>`);
      l.appendChild(c.el);
      if (f.unite) l.appendChild(el('span', 'lw-unite', f.unite));
      box.appendChild(l);
      cs[f.id] = c;
      c.input.addEventListener('input', () => { c.el.classList.remove('ko'); api.effacer(); });
      c.input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); valider(); } });
    });
    zone.appendChild(box);
    const act = el('div', 'er-actions', '<button type="button" class="btn-primary">Valider</button>');
    zone.appendChild(act);
    function valider() {
      if (api.fini()) return;
      const vals = {};
      for (const f of p.champs) {
        const v = lire(cs[f.id].input.value);
        if (isNaN(v) || !Number.isInteger(v)) { api.message(`Écris un nombre entier dans chaque case (${f.label.replace(/<[^>]+>/g, '')}).`); return; }
        vals[f.id] = v;
      }
      let r = p.verifier ? p.verifier(vals) : null;
      if (!r) {
        const faux = p.champs.filter(f => vals[f.id] !== f.bonne).map(f => f.id);
        r = faux.length ? { diag: '', faux } : { ok: true };
      }
      p.champs.forEach(f => cs[f.id].el.classList.toggle('ko', !!(r.faux && r.faux.indexOf(f.id) >= 0)));
      if (r.ok) { Object.values(cs).forEach(c => c.desactiver(true)); act.querySelector('button').disabled = true; api.reussi(); }
      else api.erreur(r.diag || '');
    }
    act.querySelector('button').onclick = valider;
    if (surOrdi()) setTimeout(() => cs[p.champs[0].id].input.focus({ preventScroll: true }), 50);
    return {
      montrer() {
        p.champs.forEach(f => { cs[f.id].input.value = String(f.bonne).replace('-', MOINS); cs[f.id].el.classList.remove('ko'); cs[f.id].desactiver(true); });
        act.querySelector('button').disabled = true;
      },
    };
  }

  // Outil propre à l'application : p.monter(zone, api) → { montrer() }
  function pPerso(zone, p, api) {
    const ctx = p.monter(zone, api) || {};
    return { montrer() { if (ctx.montrer) ctx.montrer(); } };
  }
  const PARTIES = { choix: pChoix, nombre: pNombre, champs: pChamps, perso: pPerso };

  /* ============================================================
     UNE QUESTION : parties successives
     q = { parties: [p] } ; p = { type, q (texte), figure(zone), solution (HTML affiché après), … }
     cb.fin(points) : 2 sans erreur, 1 après au moins une erreur, 0 si une réponse est affichée
     mode 'serie' : « Afficher la réponse » toujours là (0 point pour la question) ;
     mode 'manip' : proposé après deux erreurs sur la même partie.
     ============================================================ */
  function question(zone, q, cb, mode) {
    mode = mode || 'serie';
    const etat = { erreurs: 0, vue: false, fini: false };
    const n = q.parties.length;
    let rendues = 0, finies = 0;
    function partie() {
      const p = q.parties[rendues++];
      const num = n > 1 && mode === 'serie' ? `<p class="ph-partie-num">Question ${rendues} / ${n}</p>` : '';
      const d = el('div', 'ph-partie', `${num}${p.q ? `<div class="ph-partie-q">${p.q}</div>` : ''}<div class="ph-partie-fig"></div><div class="ph-partie-zone"></div><div class="ph-partie-retour" aria-live="polite"></div>
        <div class="ph-partie-aide"${mode === 'manip' ? ' hidden' : ''}><button type="button" class="btn-small">Afficher la réponse</button></div>`);
      zone.appendChild(d);
      if (p.figure) p.figure(d.querySelector('.ph-partie-fig'));
      const ret = d.querySelector('.ph-partie-retour'), aide = d.querySelector('.ph-partie-aide'), bRep = aide.querySelector('button');
      let finie = false, erreursIci = 0;
      const api = {
        fini: () => finie || etat.fini,
        effacer() { if (!finie) ret.innerHTML = ''; },
        message(h) { if (!finie) { ret.innerHTML = `<p class="ph-msg">${h}</p>`; defiler(ret); } },
        erreur(h) {
          etat.erreurs++; erreursIci++;
          const fin = mode === 'serie' ? 'Corrige ta réponse, ou affiche la réponse (0 point pour cette question).' : 'Corrige ta réponse, ou affiche la réponse.';
          ret.innerHTML = `<div class="callout-danger er-retour"><p><b class="er-ko">Ce n'est pas ça.</b> ${h || ''}</p>${erreursIci >= 2 ? `<p class="er-petit">${fin}</p>` : ''}</div>`;
          if (mode === 'manip' && erreursIci >= 2) aide.hidden = false;
          defiler(ret);
        },
        reussi(silencieux, note) { terminer(false, silencieux, note); },
      };
      const ctx = PARTIES[p.type](d.querySelector('.ph-partie-zone'), p, api);
      bRep.onclick = () => { if (finie) return; ctx.montrer(); etat.vue = true; terminer(true); };
      function terminer(vue, silencieux, note) {
        finie = true;
        aide.remove();
        const titre = vue ? 'Réponse' : (erreursIci ? 'C\'est juste.' : 'Juste !');
        const sol = p.solution;
        if (sol || vue || note) {
          ret.innerHTML = `<div class="${vue ? 'callout' : 'callout-success'} er-retour ph-solution"><p><b class="${vue ? '' : 'er-ok'}">${titre}</b>${note ? ' ' + note : ''}</p>${sol ? `<div>${typeof sol === 'function' ? sol() : sol}</div>` : ''}</div>`;
        } else if (!silencieux) {
          ret.innerHTML = '<p class="ph-ok">✓ Juste</p>';
        } else ret.innerHTML = '';
        finies++;
        if (cb.partie) cb.partie(finies - 1, vue);
        if (finies < n) {
          if (mode === 'serie') {
            // la partie suivante remplace celle-ci, une fois son retour lu
            const a = el('div', 'er-actions ph-partie-suite', '<button type="button" class="btn-primary">Suite →</button>');
            d.appendChild(a);
            a.querySelector('button').onclick = () => { d.remove(); partie(); amener(zone, 0.5); };
            defiler(a);
          } else { partie(); defiler(zone.lastElementChild); }
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
     q = { theme, consigne, enonce, parties, bilan }
     ============================================================ */
  function serie(opts) {
    const app = opts.app;
    let qs = [], idx = 0, score = 0, recap = [];
    const pts = v => `${v} pt${v > 1 ? 's' : ''}`;

    function intro() {
      app.innerHTML = `<div class="er-card"><span class="er-badge">${opts.badge}</span><h2 class="er-titre">${opts.titre}</h2>${opts.intro || ''}
        <div class="cle" style="margin:14px 0"><p><b class="cle-titre">Barème</b> · 10 questions, notées sur 20 :</p>
          <ul class="er-liste"><li><b>2 points</b> si tout est juste du premier coup ;</li><li><b>1 point</b> si tu y arrives après au moins une erreur ;</li><li><b>0 point</b> si tu affiches la réponse.</li></ul></div>
        <button type="button" class="btn-primary" data-a="go">Commencer →</button></div>`;
      app.querySelector('[data-a="go"]').onclick = demarrer;
      window.scrollTo(0, 0);
    }
    function demarrer() { qs = opts.questions(); idx = 0; score = 0; recap = []; afficher(); }

    function afficher() {
      if (idx >= qs.length) return fin();
      const q = qs[idx];
      window.LW.questionEnCours = q;          // question en cours (utile pour vérifier l'application)
      if (window.DragDrop) DragDrop.cleanupGhosts();
      app.innerHTML = `<div class="er-card ph-tete"><div class="lw-tete"><span class="er-badge">${opts.badge}</span><h2 class="er-titre">${opts.titre}</h2>
            <p class="er-meta">Question ${idx + 1}/${qs.length} · Score : <b data-a="score">${pts(score)}</b></p></div>
          <div class="progress-bar"><div class="progress-fill" style="width:${Math.round(idx / qs.length * 100)}%"></div></div></div>
        <div class="er-card ph-question">${q.theme ? `<p class="er-q-nom">${q.theme}</p>` : ''}${q.consigne ? `<div class="er-consigne">${q.consigne}</div>` : ''}
          ${q.enonce ? `<div class="ph-enonce">${q.enonce}</div>` : ''}<div data-a="parties"></div>
          <div data-a="retour"></div><div class="er-actions" data-a="suite"></div></div>`;
      window.scrollTo(0, 0);
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
          defiler(s);
        },
      }, 'serie');
    }

    function fin() {
      const max = qs.length * 2, note = Math.round(score / max * 20 * 2) / 2, pct = Math.round(score / max * 100);
      SOM.marquer({ note });
      const msg = score === max ? 'Tout est juste : bravo !' : pct >= 70 ? 'Très bien ! Encore un peu d\'entraînement pour le sans-faute.'
        : pct >= 50 ? 'Pas mal ! Recommence pour progresser : les questions changent à chaque fois.' : 'Continue à t\'entraîner : recommence, les questions changent à chaque fois.';
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
     PAGE SUR UN SEUL ÉCRAN (modules 1 à 3)
     cadre(zone, cfg) : en-tête (badge, titre, bulle de contexte, plein écran) ; scène : bande de
     commandes, zone de travail (schéma), message ; panneau à droite (en-tête fixe, rubriques en onglets).
     Téléphone : zone de travail en haut, panneau dessous, un onglet à la fois.
     cfg = { badge, titre, contexte (HTML court, à côté du titre), bande (HTML), entete (HTML),
             onglets: [{ id, nom, titre, html, tel, toujours }], peTel (sélecteur), surOnglet(id) }
       onglet { tel: true }      : onglet du téléphone seulement (sur ordinateur, son contenu est ailleurs)
       onglet { toujours: true } : sur ordinateur, toujours affiché sous les rubriques (« À essayer ») ;
                                   sur téléphone, un onglet comme les autres
       un élément marqué data-tel="<id d'onglet>" passe dans cet onglet sur téléphone
       peTel : élément qui reçoit le bouton plein écran sur téléphone (par défaut, la barre des onglets)
     → { $(a), zone, onglet(id), actif(), message(html, type), travail (zone de travail), estTel() }
     ============================================================ */
  function cadre(zone, cfg) {
    const ong = cfg.onglets;
    zone.innerHTML = `<div class="lw-sim">
      <div class="er-card lw-sim-tete">
        <div class="lw-sim-titre"><span class="er-badge">${cfg.badge}</span><h2 class="er-titre">${cfg.titre}</h2>${cfg.contexte || ''}</div>
        <span data-plein></span>
      </div>
      <div class="lw-sim-corps">
        <div class="er-card lw-sim-scene">
          <div class="lw-sim-bande" data-a="bande">${cfg.bande || ''}</div>
          <div class="lw-sim-travail" data-a="travail"></div>
          <div class="lw-sim-msg" data-a="msg" aria-live="polite"></div>
        </div>
        <aside class="er-card lw-sim-panneau" aria-label="${cfg.aria || 'Panneau'}">
          ${cfg.entete ? `<div class="lw-sim-entete">${cfg.entete}</div>` : ''}
          <div class="lw-sim-onglets" role="tablist">${ong.map(o => `<button type="button" role="tab" data-o="${o.id}" class="${o.tel || o.toujours ? 'lw-o-tel' : 'lw-o-ordi'}" aria-selected="false">${o.nom}</button>`).join('')}</div>
          ${ong.map(o => `<section class="lw-sim-bloc${o.tel ? ' lw-sim-tel' : ''}${o.toujours ? ' lw-sim-toujours' : ''}" data-s="${o.id}">${o.titre ? `<p class="lw-sim-lab lw-sim-bloc-t">${o.titre}</p>` : ''}${o.html}</section>`).join('')}
        </aside>
      </div></div>`;
    const $ = a => zone.querySelector(`[data-a="${a}"]`);
    const mq = matchMedia('(max-width: 899px)');
    const barre = zone.querySelector('.lw-sim-onglets');
    const boutons = Array.from(zone.querySelectorAll('[data-o]'));
    // rubriques de l'ordinateur (ni téléphone seul, ni toujours affichées)
    const rubriques = ong.filter(o => !o.tel && !o.toujours).map(o => o.id);
    let actif = null;
    function onglet(o, silencieux) {
      actif = o;
      boutons.forEach(b => b.setAttribute('aria-selected', b.dataset.o === o ? 'true' : 'false'));
      zone.querySelectorAll('[data-s]').forEach(s => s.classList.toggle('lw-sim-actif', s.dataset.s === o));
      if (!silencieux && cfg.surOnglet) cfg.surOnglet(o);
    }
    boutons.forEach(b => { b.onclick = () => onglet(b.dataset.o); });
    // éléments qui changent de place entre ordinateur et téléphone (chacun garde sa place d'origine)
    const garder = e => {
      const place = document.createComment('place');
      e.parentNode.insertBefore(place, e);
      return { el: e, parent: e.parentNode, place };
    };
    const tels = Array.from(zone.querySelectorAll('[data-tel]')).map(garder);
    function placer() {
      const tel = mq.matches;
      tels.forEach(t => t.parent.insertBefore(t.el, t.place));
      if (tel) tels.forEach(t => zone.querySelector(`[data-s="${t.el.dataset.tel}"]`).appendChild(t.el));
      // barre d'onglets : cachée s'il y a moins de deux onglets à montrer
      const visibles = tel ? ong.length : rubriques.length;
      barre.classList.toggle('lw-cache', visibles < 2);
      // sur ordinateur, l'onglet actif est toujours une rubrique
      if (!tel && rubriques.length && rubriques.indexOf(actif) < 0) onglet(rubriques[0], true);
      if (!rubriques.length && !actif) onglet(ong[0].id, true);
      // bouton plein écran : dans l'en-tête sur ordinateur, au bout des onglets (ou à la place prévue) sur téléphone
      const pe = zone.querySelector('.pe-bouton');
      if (pe) {
        const telPlace = (cfg.peTel && zone.querySelector(cfg.peTel)) || barre;
        (tel ? telPlace : zone.querySelector('.lw-sim-tete')).appendChild(pe);
      }
    }
    onglet(ong[0].id, true);
    setTimeout(placer, 0);          // une fois le bouton plein écran posé (PLEIN.bouton() après la page)
    if (mq.addEventListener) mq.addEventListener('change', placer); else mq.addListener(placer);
    placer();
    // message sous la zone de travail : refus expliqué, information, réussite
    function message(h, type) {
      const m = $('msg');
      if (!h) { m.innerHTML = ''; return; }
      const cls = type === 'refus' ? 'callout-danger' : type === 'ok' ? 'callout-success' : 'callout-accent';
      m.innerHTML = `<div class="${cls} lw-sim-msg-in">${h}</div>`;
    }
    return { $, zone, onglet, actif: () => actif, message, travail: $('travail'), estTel: () => mq.matches };
  }

  /* ---------- Liens « Revois… » vers d'autres applications (nouvelle fenêtre) ---------- */
  const APPLIS = {
    classif: { href: '../../classification-periodique/index.html', texte: 'Revois les électrons de valence dans la classification' },
    atome: { href: '../../atome-ions/index.html', texte: 'Revois la configuration électronique' },
  };
  function revois(liste) {
    return `<p class="lw-revois">${liste.map(k => `<a href="${APPLIS[k].href}" target="_blank" rel="noopener">${APPLIS[k].texte} ↗</a>`).join('')}</p>`;
  }

  /* ---------- Situations au choix (manipulations guidées) ----------
     boite : élément qui reçoit les pastilles ; liste : [{ label (HTML court), aria }]
     opts = { aller(i) (affiche la situation i), suite: { href, label } (après la dernière) }
     → { aller(i), faite(i), suivante() (HTML du bouton « Situation suivante → »), n(), faites }
     Toutes faites → page marquée faite (SOM.marquer). */
  function situations(boite, liste, opts) {
    const faites = liste.map(() => false);
    let n = 0, marque = false;
    boite.innerHTML = liste.map((s, i) => `<button type="button" role="tab" class="lw-puce${s.large ? ' lw-puce-l' : ''}" data-sit="${i}" aria-selected="false" aria-label="${s.aria || 'Situation ' + (i + 1)}">${s.label || i + 1}</button>`).join('');
    const puces = Array.from(boite.querySelectorAll('[data-sit]'));
    puces.forEach(b => { b.onclick = () => aller(+b.dataset.sit); });
    function maj() {
      puces.forEach((b, k) => {
        b.setAttribute('aria-selected', k === n ? 'true' : 'false');
        b.classList.toggle('lw-fait', faites[k]);
        b.setAttribute('aria-label', `${liste[k].aria || 'Situation ' + (k + 1)}${faites[k] ? ', réussie' : ''}`);
      });
    }
    function aller(i) { n = i; if (window.DragDrop) DragDrop.cleanupGhosts(); maj(); opts.aller(i); }
    function faite(i) {
      faites[i] = true; maj();
      if (faites.every(Boolean) && !marque) { marque = true; SOM.marquer({ fait: true }); }
    }
    // bouton vers la prochaine situation pas encore faite (ou vers la page suivante)
    function suivante(principal) {
      const k = faites.findIndex((f, j) => !f && j > n), autre = faites.indexOf(false);
      const c = k >= 0 ? k : autre >= 0 && autre !== n ? autre : -1;
      if (c < 0 && faites.every(Boolean) && opts.suite) {
        const a = document.createElement('a');
        a.className = 'btn-primary'; a.style.textDecoration = 'none'; a.href = opts.suite.href; a.textContent = opts.suite.label;
        return a;
      }
      const b = document.createElement('button');
      b.type = 'button'; b.className = principal ? 'btn-primary' : 'btn-small';
      const cible = c >= 0 ? c : (n + 1) % liste.length;
      b.textContent = 'Situation suivante →';
      b.onclick = () => aller(cible);
      return b;
    }
    return { aller, faite, suivante, n: () => n, faites, tout: () => faites.every(Boolean) };
  }

  window.LW = {
    PLAN, CALC, fmt, lire, el, melanger, hasard, tirer, defiler, amener, surOrdi, revois,
    PARTIES, question, serie, confettis, cadre, situations, MOINS,
  };
})();
