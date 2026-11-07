/* ============================================================
   Moteur de l'application « Chromatographie sur couche mince »
   (Chimie · Seconde ; moteur de questions repris de « Cinématique »,
   navigation commune assets/sommaire.js, plaques et cuve avec l'outil
   CCM de modules/ccm.js, glisser-déposer avec assets/dragdrop.js)

   CC.fmt, CC.lire, CC.sci, CC.fr         écriture et lecture des nombres (virgule)
   CC.PARTIES                             parties de question : 'choix', 'perso' (p.monter(zone, api) → { montrer() })
   CC.question(zone, q, cb, mode)         question en plusieurs parties
   CC.serie(opts)                         série de questions notée sur 20

   Outils communs aux modules (chacun peut exister en plusieurs exemplaires) :
   CC.chromato(zone, situation, o)        chromatogramme à lire : on touche les taches, des pointillés
                                          relient celles de même hauteur → { plaque, montrer(cles), effacer() }
     situation = { depots: [{ nom, especes, sujet, pronom, contient, pas, hauteur }], refs: [i], legende }
   CC.phrase(zone, o)                     conclusion construite avec des expressions à piocher
     o = { situation, q: { type: 'pur' | 'contient' | 'tache' | 'nombre' | 'constituants', depot, ref, espece },
           ('constituants' : identifier toutes les espèces du dépôt, en touchant plusieurs espèces)
           montrer(cles), onReussi(texte), onErreur(diag), onMessage(texte) } → { montrer() }
   CC.enonce(q, situation)                texte de la question (« Le dépôt M est-il un corps pur ? »)
   CC.verifier(choix, q, situation)       { format } | { diag, cles } | { ok, texte } (sans affichage)
   CC.reponse(q, situation)               phrase attendue
   CC.legende(zone, o)                    légender le schéma du dispositif (étiquettes à glisser ou à toucher)
     o = { onReussi(), onErreur(diag), onPose(), entete, pied } → { montrer() }
       entete / pied : code HTML placé au-dessus et au-dessous des étiquettes (à côté du schéma)
   ============================================================ */
(function () {
  'use strict';

  /* ---------- Plan de l'application (sommaire, accueil, progression) ---------- */
  const PLAN = [
    { n: 1, titre: 'Réaliser une CCM', desc: 'Les gestes dans l\'ordre, du trait de dépôt au chromatogramme',
      parties: [{ nom: 'Réaliser une CCM', simulation: 'module_1_simulation', noms: { simulation: 'Animation : réaliser une CCM' } }] },
    { n: 2, titre: 'Lire un chromatogramme', desc: 'Corps pur ou mélange, espèces identifiées, en justifiant toujours ; pour aller plus loin : le rapport frontal',
      sousModules: true,
      parties: [
        { nom: 'Lire un chromatogramme', entrainement: 'module_2_manip', noms: { entrainement: 'Manipulation : lire un chromatogramme' } },
        { nom: 'Le rapport frontal', entrainement: 'module_2_rf', noms: { entrainement: 'Pour aller plus loin : le rapport frontal' } }] },
    { n: 3, titre: 'Entraînement', desc: 'Série notée sur 20 : chromatogrammes, schéma légendé, principe',
      parties: [{ nom: 'Entraînement', questions: 'module_3_questions', noms: { questions: 'Entraînement' } }] },
  ];
  SOM.init({ nom: 'Chromatographie sur couche mince', id: 'chromatographie', plan: PLAN });

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
    const s = (Math.abs(v) < Math.pow(10, -dec) / 2 ? 0 : v).toFixed(dec);
    return s.replace('-', MOINS).replace('.', ',');
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
  const defiler = e => setTimeout(() => e && e.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 80);

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
  // Outil propre à l'application : p.monter(zone, api) → { montrer() }
  function pPerso(zone, p, api) {
    const ctx = p.monter(zone, api) || {};
    return { montrer() { if (ctx.montrer) ctx.montrer(); } };
  }
  const PARTIES = { choix: pChoix, perso: pPerso };

  /* ============================================================
     UNE QUESTION : parties successives
     q = { parties: [p] } ; p = { type, q (texte), figure(zone), solution (HTML affiché après), … }
     mode 'serie' : bouton « Afficher la réponse » (0 point pour la question)
     cb.fin(points) : 2 sans erreur, 1 après au moins une erreur, 0 si une réponse est affichée
     Plusieurs parties : une seule affichée à la fois ; une partie finie garde son retour,
     puis « Suite → » l'efface et la partie suivante prend sa place.
     ============================================================ */
  function question(zone, q, cb) {
    const etat = { erreurs: 0, vue: false, fini: false };
    const n = q.parties.length;
    let rendues = 0, finies = 0;
    function partie() {
      const p = q.parties[rendues++];
      const d = el('div', 'ph-partie', `${n > 1 ? `<p class="ph-partie-num">Question ${rendues} / ${n}</p>` : ''}${p.q ? `<div class="ph-partie-q">${p.q}</div>` : ''}<div class="ph-partie-fig"></div><div class="ph-partie-zone"></div><div class="ph-partie-retour" aria-live="polite"></div>
        <div class="ph-partie-aide"><button type="button" class="btn-small">Afficher la réponse</button></div>`);
      zone.appendChild(d);
      if (p.figure) p.figure(d.querySelector('.ph-partie-fig'));
      const ret = d.querySelector('.ph-partie-retour'), aide = d.querySelector('.ph-partie-aide'), bRep = aide.querySelector('button');
      let finie = false, erreursIci = 0;
      const api = {
        fini: () => finie || etat.fini,
        effacer() { if (!finie) ret.innerHTML = ''; },
        message(h) { if (!finie) ret.innerHTML = `<p class="ph-msg">${h}</p>`; },
        erreur(h) {
          etat.erreurs++; erreursIci++;
          ret.innerHTML = `<div class="callout-danger er-retour"><p><b class="er-ko">Ce n'est pas ça.</b> ${h || ''}</p>${erreursIci >= 2 ? '<p class="er-petit">Corrige ta réponse, ou affiche la réponse (0 point pour cette question).</p>' : ''}</div>`;
          defiler(ret);
        },
        reussi(silencieux, note) { terminer(false, silencieux, note); },
      };
      const ctx = PARTIES[p.type](d.querySelector('.ph-partie-zone'), p, api);
      // « Afficher la réponse » sur la rangée des boutons de l'outil, quand il en a une (place gagnée)
      const rangee = d.querySelector('.ph-partie-zone .er-actions');
      if (rangee) { rangee.appendChild(bRep); bRep.classList.add('ph-rep-rangee'); aide.hidden = true; }
      bRep.onclick = () => { if (finie) return; ctx.montrer(); etat.vue = true; terminer(true); };
      function terminer(vue, silencieux, note) {
        finie = true;
        aide.remove(); bRep.remove();
        const titre = vue ? 'Réponse' : (erreursIci ? 'C\'est juste.' : 'Juste !');
        const sol = p.solution;
        if (sol || vue || note) {
          ret.innerHTML = `<div class="${vue ? 'callout' : 'callout-success'} er-retour ph-solution"><p><b class="${vue ? '' : 'er-ok'}">${titre}</b>${note ? ' ' + note : ''}</p>${sol ? `<div>${sol}</div>` : ''}</div>`;
        } else if (!silencieux) {
          ret.innerHTML = '<p class="ph-ok">✓ Juste</p>';
        } else ret.innerHTML = '';
        finies++;
        if (finies < n) {
          // la partie suivante remplace celle-ci, une fois son retour lu
          if (rendues < n) {
            const a = el('div', 'er-actions ph-partie-suite', '<button type="button" class="btn-primary">Suite →</button>');
            d.appendChild(a);
            const b = a.querySelector('button');
            b.onclick = () => { d.remove(); partie(); defiler(zone); };
            defiler(a);
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
      window.CC.questionEnCours = q;          // question en cours (utile pour vérifier l'application)
      // en-tête compact ; question à chromatogramme : énoncé et figure à gauche, sous-question à droite
      const tete = `${q.theme ? `<p class="er-q-nom">${q.theme}</p>` : ''}${q.consigne ? `<div class="er-consigne">${q.consigne}</div>` : ''}${q.enonce ? `<div class="ph-enonce">${q.enonce}</div>` : ''}`;
      const droite = '<div data-a="parties"></div><div data-a="retour"></div><div class="er-actions" data-a="suite"></div>';
      app.innerHTML = `<div class="er-card ph-tete"><div class="cc-tete"><span class="er-badge">${opts.badge}</span><h2 class="er-titre">${opts.titre}</h2>
            <p class="er-meta">Question ${idx + 1}/${qs.length} · Score : <b data-a="score">${pts(score)}</b></p></div>
          <div class="progress-bar"><div class="progress-fill" style="width:${Math.round(idx / qs.length * 100)}%"></div></div></div>
        <div class="er-card ph-question">${q.figure
          ? `<div class="ph-cote"><div class="ph-cote-g">${tete}<div data-a="fig"></div></div><div class="ph-cote-d">${droite}</div></div>`
          : `${tete}<div data-a="fig"></div>${droite}`}</div>`;
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
          defiler(s);
        },
      });
    }

    function fin() {
      const max = qs.length * 2, note = Math.round(score / max * 20 * 2) / 2, pct = Math.round(score / max * 100);
      SOM.marquer({ note });
      const msg = score === max ? 'Tout est juste : bravo !' : pct >= 70 ? 'Très bien ! Encore un peu d\'entraînement pour le sans-faute.'
        : pct >= 50 ? 'Pas mal ! Recommence pour progresser : les questions changent à chaque fois.' : 'Continue à t\'entraîner : refais la manipulation du module 2, puis recommence.';
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

  /* ============================================================
     CHROMATOGRAMME À LIRE
     On touche une tache pour la choisir (un second appui la retire) :
     les taches choisies de même hauteur sont reliées par des pointillés.
     ============================================================ */
  // formes d'un dépôt dans les phrases : sujet, pronom, et, comme référence, contient / pas / hauteur
  function formes(d) {
    if (d.sujet) return d;
    const s = d.especes.length === 1 && CCM.ESPECES[d.especes[0]];
    if (s && s.le) {
      const cap = s.le[0].toUpperCase() + s.le.slice(1);
      return Object.assign({ sujet: cap, pronom: s.g === 'f' ? 'elle' : 'il', contient: s.du, pas: s.de, hauteur: s.le }, d);
    }
    return Object.assign({ sujet: d.nom, pronom: 'il', contient: `l'espèce ${d.nom}`, pas: `l'espèce ${d.nom}`, hauteur: d.nom, fictif: true }, d);
  }
  // texte de la question posée sur un dépôt
  function enonce(q, sit) {
    const D = fo(sit, q.depot), P = D.pronom, sujet = D.fictif ? `le dépôt ${D.nom}` : D.sujet[0].toLowerCase() + D.sujet.slice(1);
    const Sujet = sujet[0].toUpperCase() + sujet.slice(1);
    if (q.type === 'pur') return `${Sujet} est-${P} un corps pur ?`;
    if (q.type === 'contient') return `${Sujet} contient-${P} ${fo(sit, q.ref).contient} ?`;
    if (q.type === 'tache') return `Quelle espèce donne la tache entourée (dépôt ${D.nom}) ?`;
    if (q.type === 'constituants') return `Identifie toutes les espèces que contient ${sujet}.`;
    return `Combien d'espèces ${sujet} contient-${P} ?`;
  }
  const fo = (sit, i) => formes(sit.depots[i]);

  function chromato(zone, sit, o) {
    o = o || {};
    zone.innerHTML = `<div class="cc-fig cc-fig-lire"></div>${sit.legende ? `<ul class="cc-legende-noms">${sit.depots.map(d => `<li><b>${d.nom}</b> : ${d.legende}</li>`).join('')}</ul>` : ''}`;
    const sel = new Set();
    const p = CCM.plaque(zone.querySelector('.cc-fig'), {
      depots: sit.depots, hauteur: sit.hauteur || 8, interactif: true, pointilles: 'selection', marque: o.marque || null,
      aria: 'Chromatogramme : dépôts ' + sit.depots.map(d => d.nom).join(', ') + '. Touche une tache pour la choisir.',
    });
    p.toucherTache(t => {
      if (sel.has(t.cle)) sel.delete(t.cle); else sel.add(t.cle);
      p.maj({ selection: Array.from(sel) });
      if (o.onTouche) o.onTouche(t, sel);
    });
    return {
      plaque: p,
      montrer(cles) { sel.clear(); (cles || []).forEach(c => sel.add(c)); p.maj({ selection: Array.from(sel) }); },
      effacer() { sel.clear(); p.maj({ selection: [] }); },
      marquer(cle) { p.maj({ marque: cle }); },
    };
  }

  /* ============================================================
     CONCLUSION AVEC DES EXPRESSIONS À PIOCHER
     Une phrase : conclusion, « car », justification.
     Expressions : { g: 'c' | 'car' | 'j', k, r (référence), n }
     ============================================================ */
  // texte d'une expression pour le dépôt d (indice) de la situation
  function texte(x, sit, d, ctx) {
    const D = fo(sit, d), R = x.r != null ? fo(sit, x.r) : null, P = D.pronom;
    switch (x.k) {
      case 'pur': return `${D.sujet} est un corps pur`;
      case 'melange': return `${D.sujet} est un mélange`;
      case 'contient': return `${D.sujet} contient ${R.contient}`;
      case 'pasContient': return `${D.sujet} ne contient pas ${R.pas}`;
      case 'inconnue': return `${D.sujet} contient une espèce non identifiée`;
      case 'auMoins': return `${D.sujet} contient au moins ${x.n} espèces`;
      case 'exact': return `${D.sujet} contient ${x.n} espèces`;
      case 'car': return 'car';
      case 'une': return `${P} ne donne qu'une seule tache`;
      case 'plusieurs': return `${P} donne plusieurs taches`;
      case 'n': return `${P} donne ${x.n} taches`;
      case 'meme': return `${P} donne une tache à la même hauteur que ${R.hauteur}`;
      case 'pasMeme': return `${P} ne donne pas de tache à la même hauteur que ${R.hauteur}`;
      case 'aucune': return 'aucune référence ne donne de tache à cette hauteur';
      // identifier toutes les espèces (ctx.une : une seule espèce non identifiée dans la phrase)
      case 'esp': return R.contient;
      case 'inc1': return 'une espèce non identifiée';
      case 'incN': return 'plusieurs espèces non identifiées';
      case 'memes': return `${P} donne des taches aux mêmes hauteurs que ces espèces de référence`;
      case 'autres': return `aucune référence ne donne de tache à la hauteur de ${ctx && ctx.une ? 'son autre tache' : 'ses autres taches'}`;
    }
    return '';
  }
  const C = (k, o) => Object.assign({ g: 'c', k }, o), J = (k, o) => Object.assign({ g: 'j', k }, o);
  const egal = (a, b) => a && b && a.k === b.k && (a.r == null ? null : a.r) === (b.r == null ? null : b.r) && (a.n || 0) === (b.n || 0);

  // analyse du dépôt de la question : nombre de taches, références présentes, référence d'une tache
  function analyse(q, sit) {
    const refs = sit.refs.filter(i => i !== q.depot);
    const a = CCM.analyser([sit.depots[q.depot]], refs.map(i => sit.depots[i]))[0];
    const presentes = a.constituants.map(i => refs[i]);
    const refDe = h => refs.find(i => CCM.hauteursDe(sit.depots[i]).some(x => Math.abs(x - h) < 1e-6));
    // taches qu'aucune référence n'explique : nombre et clés
    const d = sit.depots[q.depot], vues = [];
    const clesInc = d.especes.filter(s => {
      const h = CCM.hauteur(s);
      if (vues.some(x => Math.abs(x - h) < 1e-6) || !a.inconnues.some(x => Math.abs(x - h) < 1e-6)) return false;
      vues.push(h); return true;
    }).map(s => q.depot + '|' + s);
    return { nb: a.nbTaches, presentes, refs, refDe, inconnues: a.inconnues.length, clesInc };
  }
  // conclusion et justification attendues
  function attendu(q, sit) {
    const a = analyse(q, sit);
    if (q.type === 'pur') return a.nb === 1 ? [C('pur'), J('une')] : [C('melange'), J('plusieurs')];
    if (q.type === 'contient') return a.presentes.includes(q.ref) ? [C('contient', { r: q.ref }), J('meme', { r: q.ref })] : [C('pasContient', { r: q.ref }), J('pasMeme', { r: q.ref })];
    if (q.type === 'tache') {
      const m = a.refDe(CCM.hauteur(q.espece));
      return m != null ? [C('contient', { r: m }), J('meme', { r: m })] : [C('inconnue'), J('aucune')];
    }
    if (q.type === 'constituants') return attenduListe(q, sit);
    return [C('auMoins', { n: a.nb }), J('n', { n: a.nb })];
  }
  // phrase attendue complète (liste d'expressions), pour tous les types de questions
  function attenduListe(q, sit) {
    if (q.type !== 'constituants') { const [c, j] = attendu(q, sit); return [c, CAR(), j]; }
    const a = analyse(q, sit), n = a.inconnues;
    return a.refs.filter(r => a.presentes.includes(r)).map(r => C('esp', { r }))
      .concat(n ? [C(n > 1 ? 'incN' : 'inc1')] : [], [CAR(), J('memes')], n ? [J('autres')] : []);
  }
  const CAR = () => ({ g: 'car', k: 'car' });
  // justifications qui prouvent une conclusion (juste)
  function prouve(c, j, a) {
    switch (c.k) {
      case 'pur': return j.k === 'une';
      case 'melange': return j.k === 'plusieurs' || (j.k === 'n' && j.n === a.nb);
      case 'contient': return j.k === 'meme' && j.r === c.r;
      case 'pasContient': return j.k === 'pasMeme' && j.r === c.r;
      case 'inconnue': return j.k === 'aucune';
      case 'auMoins': return j.k === 'n' && j.n === a.nb;
    }
    return false;
  }
  const RAISON = {
    pur: 'un corps pur se reconnaît à sa seule tache.',
    melange: 'un mélange se reconnaît à ses plusieurs taches.',
    contient: 'une espèce de référence est présente quand le dépôt donne une tache à la même hauteur que la sienne.',
    pasContient: 'une espèce de référence est absente quand le dépôt ne donne aucune tache à la même hauteur que la sienne.',
    inconnue: 'une espèce n\'est pas identifiée quand aucune référence ne donne de tache à cette hauteur.',
    auMoins: 'on compte les taches du dépôt.',
  };

  // expressions proposées pour une question (bonnes et erreurs classiques)
  function pioche(q, sit) {
    const a = analyse(q, sit), r = q.ref, autres = a.refs;
    let cs, js;
    if (q.type === 'pur') {
      cs = [C('pur'), C('melange'), C('contient', { r: autres[0] })];
      js = [J('une'), J('plusieurs'), J('meme', { r: autres[0] })];
      if (a.nb > 1) js.push(J('n', { n: a.nb }));
    } else if (q.type === 'contient') {
      cs = [C('contient', { r }), C('pasContient', { r }), C('pur'), C('melange')];
      js = [J('meme', { r }), J('pasMeme', { r }), J('une'), J('plusieurs')];
    } else if (q.type === 'tache') {
      // la bonne référence (s'il y en a une) et au plus deux autres : pas plus de 3 références proposées
      const m = a.refDe(CCM.hauteur(q.espece));
      const refs = (m != null ? [m] : []).concat(melanger(autres.filter(i => i !== m))).slice(0, 3).sort((x, y) => x - y);
      cs = refs.map(i => C('contient', { r: i })).concat([C('inconnue')]);
      js = refs.map(i => J('meme', { r: i })).concat([J('aucune')]);
    } else if (q.type === 'constituants') {
      // toutes les références, dans l'ordre de la plaque, puis les espèces non identifiées
      cs = autres.map(i => C('esp', { r: i })).concat([C('inc1'), C('incN')]);
      js = [J('memes'), J('autres'), J('plusieurs')];
      return { cs, js: melanger(js) };
    } else {
      cs = [C('exact', { n: a.nb }), C('auMoins', { n: a.nb }), C('melange')];
      js = [J('n', { n: a.nb }), J('plusieurs'), J('une')];
    }
    return { cs: melanger(cs), js: melanger(js) };
  }

  // cles des taches à mettre en évidence (dépôt et référence) après une erreur
  function cles(sit, d, r) {
    const l = sit.depots[d].especes.map(s => d + '|' + s);
    if (r != null) sit.depots[r].especes.forEach(s => l.push(r + '|' + s));
    return l;
  }

  // vérifie la phrase (liste d'expressions)
  function verifier(choix, q, sit) {
    if (q.type === 'constituants') return verifierTout(choix, q, sit);
    const D = fo(sit, q.depot), nom = D.sujet, a = analyse(q, sit);
    const cs = choix.filter(x => x.g === 'c'), js = choix.filter(x => x.g === 'j'), cars = choix.filter(x => x.g === 'car');
    if (!choix.length) return { format: 'Touche des expressions pour écrire ta phrase.' };
    if (!cs.length) return { format: 'Commence par ta conclusion : une expression de la première ligne.' };
    if (cs.length > 1 || js.length > 1 || cars.length > 1) return { format: 'Une seule conclusion et une seule justification : « conclusion car justification ». Efface et recommence.' };
    if (choix[0].g !== 'c' || (cars.length && choix[1].g !== 'car') || (js.length && choix[choix.length - 1].g !== 'j') || (js.length && !cars.length)) {
      return { format: 'Dans l\'ordre : la conclusion, puis « car », puis la justification. Efface et recommence.' };
    }
    const c = cs[0], j = js[0];
    const [cA] = attendu(q, sit);
    // la conclusion répond-elle à la question ?
    const types = { pur: ['pur', 'melange'], contient: ['contient', 'pasContient'], tache: ['contient', 'inconnue'], nombre: ['auMoins', 'exact'] }[q.type];
    if (!types.includes(c.k) || (q.type === 'contient' && c.r !== q.ref)) {
      const h = q.type === 'pur' ? `dis si ${nom} est un corps pur ou un mélange.`
        : q.type === 'contient' ? `dis si ${nom} contient ${fo(sit, q.ref).contient} ou non.`
        : q.type === 'tache' ? 'dis quelle espèce donne la tache entourée.' : `dis combien d'espèces ${nom} contient au moins.`;
      return { diag: `Ta phrase ne répond pas à la question : ${h}` };
    }
    // la conclusion est-elle juste ?
    if (!egal(c, cA)) {
      if (q.type === 'pur') return c.k === 'pur'
        ? { diag: `${nom} donne ${a.nb} taches : un corps pur n'en donne qu'une seule, c'est un mélange.` }
        : { diag: `${nom} ne donne qu'une seule tache : c'est un corps pur.` };
      if (q.type === 'contient') {
        const R = fo(sit, q.ref);
        return c.k === 'contient'
          ? { diag: `Aucune tache de ${nom} n'est à la même hauteur que celle de ${R.hauteur} : les pointillés ne relient rien.`, cles: cles(sit, q.depot, q.ref) }
          : { diag: `${nom} donne une tache à la même hauteur que ${R.hauteur} : les pointillés les relient.`, cles: cles(sit, q.depot, q.ref) };
      }
      if (q.type === 'tache') {
        if (c.k === 'inconnue') return { diag: `La tache de ${fo(sit, cA.r).hauteur} est à la même hauteur que la tache entourée : cette espèce est identifiée.`, cles: [q.depot + '|' + q.espece].concat(cles(sit, cA.r)) };
        if (cA.k === 'inconnue') return { diag: 'Aucune référence ne donne de tache à cette hauteur : cette espèce n\'est pas identifiée.', cles: [q.depot + '|' + q.espece].concat(cles(sit, c.r)) };
        return { diag: `La tache entourée n'est pas à la même hauteur que celle de ${fo(sit, c.r).hauteur} : les pointillés ne les relient pas.`, cles: [q.depot + '|' + q.espece].concat(cles(sit, c.r)) };
      }
      if (c.k === 'exact') return { diag: `Deux espèces peuvent monter à la même hauteur : on écrit <b>au moins</b> ${a.nb} espèces.` };
      return { diag: `Compte les taches de ${nom} : il y en a ${a.nb}.` };
    }
    // la conclusion est justifiée ?
    if (!j) return { diag: 'Justifie toujours : ajoute « car » et ce que montre le chromatogramme.' };
    if (!prouve(c, j, a)) return { diag: `Ta conclusion est juste, mais cette justification ne la prouve pas : ${RAISON[c.k]}` };
    return { ok: true, texte: phraseDe([c, { g: 'car', k: 'car' }, j], sit, q.depot) };
  }
  // identifier toutes les espèces : liste des espèces (références présentes, espèces non identifiées), puis justifications
  function verifierTout(choix, q, sit) {
    const D = fo(sit, q.depot), nom = D.sujet, P = D.pronom, a = analyse(q, sit), n = a.inconnues;
    const es = choix.filter(x => x.g === 'c'), js = choix.filter(x => x.g === 'j');
    if (!es.length) return { format: 'Touche les espèces que contient le dépôt : une ou plusieurs expressions de la première ligne.' };
    const choisies = es.filter(x => x.k === 'esp').map(x => x.r), inc = es.find(x => x.k !== 'esp');
    const faux = choisies.find(r => !a.presentes.includes(r));
    if (faux != null) {
      const R = fo(sit, faux);
      return { diag: `Aucune tache de ${nom} n'est à la même hauteur que celle de ${R.hauteur} : les pointillés ne relient rien, ${P} ne contient pas ${R.pas}.`, cles: cles(sit, q.depot, faux) };
    }
    const manque = a.presentes.find(r => !choisies.includes(r));
    if (manque != null) return { diag: `Il manque une espèce : ${nom} donne aussi une tache à la même hauteur que ${fo(sit, manque).hauteur}.`, cles: cles(sit, q.depot, manque) };
    if (inc && !n) return { diag: `Chaque tache de ${nom} est à la même hauteur qu'une tache de référence : toutes ses espèces sont identifiées.`, cles: cles(sit, q.depot) };
    if (!inc && n) return { diag: `${n > 1 ? 'Des taches' : 'Une tache'} de ${nom} ${n > 1 ? 'ne sont' : 'n\'est'} à la hauteur d'aucune référence : ${P} contient aussi ${n > 1 ? 'des espèces non identifiées' : 'une espèce non identifiée'}.`, cles: a.clesInc };
    if (inc && (inc.k === 'incN') !== (n > 1)) return { diag: n > 1 ? `${n} taches de ${nom} ne sont à la hauteur d'aucune référence : écris « plusieurs espèces non identifiées ».` : `Une seule tache de ${nom} n'est à la hauteur d'aucune référence : écris « une espèce non identifiée ».`, cles: a.clesInc };
    if (!js.length) return { diag: 'Justifie toujours : ajoute « car » et ce que montre le chromatogramme.' };
    const jm = js.some(x => x.k === 'memes'), ja = js.some(x => x.k === 'autres');
    if (js.some(x => x.k === 'plusieurs')) return { diag: `« ${P} donne plusieurs taches » montre seulement que ${nom} est un mélange : enlève cette justification.` };
    if (!jm) return { diag: `Ta liste est juste, mais justifie-la : ${RAISON.contient}` };
    if (n && !ja) return { diag: `Justifie aussi ${n > 1 ? 'les espèces non identifiées' : 'l\'espèce non identifiée'} : ${RAISON.inconnue}`, cles: a.clesInc };
    if (!n && ja) return { diag: 'Toutes les taches sont à la hauteur d\'une référence : enlève « aucune référence ne donne de tache… ».' };
    return { ok: true, texte: phraseTout(choix, sit, q.depot) };
  }
  // phrase « identifier toutes les espèces » : « M contient A, C et une espèce non identifiée car …, et … »
  function phraseTout(l, sit, d) {
    const es = l.filter(x => x.g === 'c'), js = l.filter(x => x.g === 'j'), ctx = { une: es.some(x => x.k === 'inc1') };
    const liste = t => (t.length < 2 ? t.join('') : t.slice(0, -1).join(', ') + ' et ' + t[t.length - 1]);
    let t = es.length ? `${fo(sit, d).sujet} contient ${liste(es.map(x => texte(x, sit, d)))}` : '';
    if (l.some(x => x.g === 'car')) t += ' car';
    if (js.length) t += ' ' + js.map(x => texte(x, sit, d, ctx)).join(', et ');
    return t ? t[0].toUpperCase() + t.slice(1) + '.' : '';
  }
  function phraseDe(l, sit, d) {
    const t = l.map(x => texte(x, sit, d)).join(' ');
    return t ? t[0].toUpperCase() + t.slice(1) + '.' : '';
  }
  const reponse = (q, sit) => (q.type === 'constituants' ? phraseTout : phraseDe)(attenduListe(q, sit), sit, q.depot);

  function phrase(zone, o) {
    const sit = o.situation, q = o.q, choix = [], tout = q.type === 'constituants';
    const { cs, js } = pioche(q, sit);
    const pil = (x, i) => `<button type="button" class="btn-secondary cc-pilule" data-g="${x.g}" data-i="${i}"${tout && x.g !== 'car' ? ' aria-pressed="false"' : ''}>${texte(x, sit, q.depot)}</button>`;
    zone.innerHTML = `<div class="callout cc-phrase" aria-live="polite"></div>
      <div class="cc-pioche">
        <div class="cc-pioche-g"><p class="cc-pioche-t">${tout ? 'Espèces (une ou plusieurs)' : 'Conclusion'}</p><div class="cc-pilules">${cs.map(pil).join('')}</div></div>
        <div class="cc-pioche-g"><p class="cc-pioche-t">Liaison</p><div class="cc-pilules">${pil({ g: 'car', k: 'car' }, 0)}</div></div>
        <div class="cc-pioche-g"><p class="cc-pioche-t">Justification</p><div class="cc-pilules">${js.map(pil).join('')}</div></div>
      </div>
      <div class="er-actions cc-phrase-actions"><button type="button" class="btn-secondary" data-a="eff">Effacer</button><button type="button" class="btn-primary" data-a="ver">Vérifier</button></div>`;
    const boite = zone.querySelector('.cc-phrase');
    let fini = false;
    function maj() {
      const t = (tout ? phraseTout : phraseDe)(choix, sit, q.depot);
      boite.innerHTML = choix.length ? `<p>${t.replace(/\.$/, choix[choix.length - 1].g === 'j' ? '.' : ' …')}</p>`
        : `<p class="cc-phrase-vide">${tout ? 'Touche les espèces, puis « car », puis la justification (une ou deux).'
          : 'Touche la conclusion, puis « car », puis la justification.'}</p>`;
      if (tout) zone.querySelectorAll('.cc-pilule[aria-pressed]').forEach(b => {
        const x = (b.dataset.g === 'c' ? cs : js)[+b.dataset.i];
        b.setAttribute('aria-pressed', choix.includes(x));
      });
    }
    // identifier toutes les espèces : chaque expression se touche une fois (un second appui l'enlève),
    // les espèces avant « car », les justifications après
    function toucherTout(g, x) {
      const i = choix.indexOf(x), car = choix.some(y => y.g === 'car');
      if (g === 'car') { if (!car) { if (!choix.length) return 'Commence par les espèces que contient le dépôt.'; choix.push(CAR()); } return ''; }
      if (i >= 0) { choix.splice(i, 1); if (g === 'c' && !choix.some(y => y.g === 'c')) choix.length = 0; return ''; }
      if (g === 'c' && car) return 'Les espèces s\'écrivent avant « car » : touche « Effacer » pour changer la liste.';
      if (g === 'j' && !car) return 'Ajoute d\'abord « car », puis la justification.';
      if (g === 'c') choix.splice(choix.filter(y => y.g === 'c').length, 0, x); else choix.push(x);
      return '';
    }
    zone.querySelectorAll('.cc-pilule').forEach(b => {
      b.onclick = () => {
        if (fini) return;
        const g = b.dataset.g, i = +b.dataset.i, x = g === 'c' ? cs[i] : g === 'j' ? js[i] : CAR();
        let m = '';
        if (tout) m = toucherTout(g, x); else choix.push(x);
        if (o.onMessage) o.onMessage(m);
        maj();
      };
    });
    zone.querySelector('[data-a="eff"]').onclick = () => { if (fini) return; choix.length = 0; if (o.onMessage) o.onMessage(''); maj(); };
    zone.querySelector('[data-a="ver"]').onclick = () => {
      if (fini) return;
      const r = verifier(choix, q, sit);
      if (r.format) { secouer(boite); if (o.onMessage) o.onMessage(r.format); return; }
      if (r.diag) { if (r.cles && o.montrer) o.montrer(r.cles); secouer(boite); if (o.onErreur) o.onErreur(r.diag); return; }
      fermer();
      boite.classList.add('ok');
      if (o.onReussi) o.onReussi(r.texte);
    };
    function fermer() { fini = true; zone.querySelectorAll('button').forEach(b => { b.disabled = true; }); }
    maj();
    return {
      montrer() {
        const l = attenduListe(q, sit), c = l[0];
        choix.length = 0;
        l.forEach(x => choix.push(tout ? (x.g === 'c' ? cs : x.g === 'j' ? js : [x]).find(y => egal(y, x)) || x : x));
        maj(); fermer();
        if (o.montrer) {
          o.montrer(q.type === 'contient' ? cles(sit, q.depot, q.ref) : q.type === 'tache' && c.r != null ? [q.depot + '|' + q.espece].concat(cles(sit, c.r))
            : tout ? analyse(q, sit).presentes.reduce((t, r) => t.concat(cles(sit, r)), cles(sit, q.depot)) : []);
        }
      },
    };
  }

  /* ============================================================
     LÉGENDER LE SCHÉMA DU DISPOSITIF
     Étiquettes à glisser sur les numéros, ou à toucher puis toucher le numéro.
     ============================================================ */
  const LEGENDES = [
    { id: 'couvercle', t: 'couvercle', diag: 'Le couvercle ferme la cuve, en haut : l\'éluant est toxique et s\'évapore.' },
    { id: 'cuve', t: 'cuve à élution', diag: 'La cuve à élution est le récipient en verre qui contient l\'éluant et la plaque.' },
    { id: 'phase', t: 'phase stationnaire', diag: 'La phase stationnaire est la plaque de silice : elle ne bouge pas, l\'éluant monte dedans.' },
    { id: 'front', t: 'front de l\'éluant', diag: 'Le front de l\'éluant est la limite atteinte par l\'éluant, en haut de la partie mouillée de la plaque.' },
    { id: 'depots', t: 'dépôts', diag: 'Les dépôts sont les petites taches déposées sur le trait de dépôt, au début.' },
    { id: 'trait', t: 'trait de dépôt', diag: 'Le trait de dépôt est le trait au crayon, en bas de la plaque, sur lequel on fait les dépôts.' },
    { id: 'eluant', t: 'éluant (phase mobile)', diag: 'L\'éluant (phase mobile) est le liquide au fond de la cuve : il monte dans la plaque.' },
  ];
  function legende(zone, o) {
    o = o || {};
    const places = {};
    let choisie = null, fini = false;
    const ordre = melanger(LEGENDES);
    zone.innerHTML = `<div class="cc-leg">
        <div class="cc-fig cc-leg-fig"></div>
        <div class="cc-leg-cote">${o.entete || ''}
          <p class="cc-leg-aide">Glisse chaque étiquette sur son numéro, ou touche l'étiquette puis le numéro.</p>
          <div class="cc-leg-etiq">${ordre.map(l => `<button type="button" class="btn-secondary cc-etiq" data-id="${l.id}">${l.t}</button>`).join('')}</div>
          <ol class="cc-leg-cases">${LEGENDES.map((l, i) => `<li><button type="button" class="cc-leg-case" data-id="${l.id}" aria-label="Numéro ${i + 1}"><span class="cc-leg-num">${i + 1}</span><span class="cc-leg-t">…</span></button></li>`).join('')}</ol>
          ${o.pied || ''}
        </div></div>`;
    // le dispositif : cuve fermée, élution commencée, numéros reliés aux éléments
    const depots = [{ nom: '', especes: ['A'] }, { nom: '', especes: ['C'] }, { nom: '', especes: ['A', 'C'] }];
    CCM.animation(zone.querySelector('.cc-leg-fig'), {
      depots, largeur: 4, front: 3.2, niveau: .5, couvercle: true, noms: false, marges: { g: .2, d: 1.5 },
      aria: 'Schéma du dispositif de chromatographie, avec 7 numéros à légender',
      calque(g) {
        const k = g.k, c = g.cuve, P = g.px, Y = g.py;
        const gx = c.x - 1.15 * k, dx = c.x + c.w + 1.15 * k;
        const xd = 1;   // premier dépôt (cm depuis le bord gauche de la plaque)
        const pins = [
          [gx, c.y - .14 * k, c.x + .5 * k, c.y - .14 * k],                // 1 couvercle
          [dx, c.y + 1.2 * k, c.x + c.w, c.y + 1.2 * k],                   // 2 cuve à élution
          [dx, Y(6.6), P(3.4), Y(6.6)],                                     // 3 phase stationnaire
          [dx, Y(3.2), P(3.7), Y(3.2)],                                     // 4 front de l'éluant
          [gx, Y(1) - 1.3 * k, P(xd), Y(1) - .12 * k],                      // 5 dépôts
          [gx, Y(1) + .5 * k, P(.3), Y(1)],                                 // 6 trait de dépôt
          [dx, Y(.25), c.x + c.w - .4 * k, Y(.25)],                         // 7 éluant
        ];
        let s = depots.map((d, i) => `<circle class="ccm-cercle-depot" cx="${P(i + 1)}" cy="${Y(1)}" r="${.13 * k}"/>`).join('');
        pins.forEach(([x, y, tx, ty], i) => {
          s += `<line class="cc-pin-trait" x1="${x}" y1="${y}" x2="${tx}" y2="${ty}"/><circle class="cc-pin-bout" cx="${tx}" cy="${ty}" r="2.4"/>
            <circle class="cc-pin" cx="${x}" cy="${y}" r="${.4 * k}"/><text class="cc-pin-t" x="${x}" y="${y + .15 * k}" font-size="${.42 * k}">${i + 1}</text>`;
        });
        return s;
      },
    });
    const etiqs = Array.from(zone.querySelectorAll('.cc-etiq'));
    function choisir(b) {
      if (b.glisse) { b.glisse = false; return; }     // clic qui suit un glisser : ignoré
      if (fini || b.disabled) return;
      choisie = choisie === b ? null : b;
      etiqs.forEach(x => x.classList.toggle('choisie', x === choisie));
    }
    function poser(b, caseEl) {
      if (fini || !b || b.disabled) return;
      const id = b.dataset.id, cible = caseEl.dataset.id;
      if (places[cible]) return;
      if (id === cible) {
        places[cible] = true;
        caseEl.classList.add('pose');
        caseEl.querySelector('.cc-leg-t').textContent = b.textContent;
        b.disabled = true; b.classList.remove('choisie'); b.classList.add('posee');
        choisie = null;
        if (o.onPose) o.onPose();
        if (LEGENDES.every(l => places[l.id])) { fini = true; if (o.onReussi) o.onReussi(); }
      } else {
        secouer(caseEl);
        if (o.onErreur) o.onErreur(`Pas au numéro ${LEGENDES.findIndex(l => l.id === cible) + 1}. ${LEGENDES.find(l => l.id === id).diag}`);
      }
    }
    etiqs.forEach(b => {
      b.onclick = () => choisir(b);
      if (window.DragDrop) DragDrop.enable(b, { zoneSelector: '.cc-leg-case', dragOverClass: 'survol', onDrop: (item, z) => { if (z && zone.contains(z)) { item.glisse = true; setTimeout(() => { item.glisse = false; }, 400); poser(item, z); } } });
    });
    zone.querySelectorAll('.cc-leg-case').forEach(c => { c.onclick = () => { if (choisie) poser(choisie, c); }; });
    return {
      montrer() {
        fini = true;
        zone.querySelectorAll('.cc-leg-case').forEach(c => { c.classList.add('pose'); c.querySelector('.cc-leg-t').textContent = LEGENDES.find(l => l.id === c.dataset.id).t; c.disabled = true; });
        etiqs.forEach(b => { b.disabled = true; b.classList.add('posee'); });
      },
    };
  }

  window.CC = { PLAN, MOINS, fmt, sci, lire, fr, el, secouer, melanger, hasard, entre, defiler, PARTIES, question, serie, confettis,
    formes, enonce, chromato, phrase, verifier, reponse, attendu, attenduListe, analyse, texte, legende, LEGENDES };
})();
