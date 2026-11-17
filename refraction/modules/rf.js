/* ============================================================
   Moteur de l'application « Réfraction et loi de Snell-Descartes »
   (Physique · Seconde ; moteur de questions repris de « Cinématique »
   via « Période et fréquence d'un signal », navigation commune
   assets/sommaire.js, figures avec l'outil OPT de assets/optique.js)

   RF.fmt(v, dec), RF.lire(s), RF.cs(s), RF.court(v, c), RF.fr(h, b)   écriture et lecture des nombres
   RF.el(tag, cls, html), RF.melanger(t), RF.hasard(t), RF.defiler(e), RF.amener(e), RF.surOrdi()
   RF.MILIEUX                       milieux : nom, indice n, symbole de l'indice, fond de la figure
   RF.JETONS                        étiquettes des écritures (n_air, sin(i₁), ×, =…) : RF.jeton(id) → HTML
   RF.PARTIES                       parties de question :
     'choix'  : p.options [{ id, label }], p.bonne, p.indices[id] ou p.indice, p.colonne
     'nombre' : p.label, p.unite, p.verifier(v, texte) → { ok } | { diag } | { format } ;
                p.calc : icône calculatrice ; p.avant(zone) : contenu sous le champ (calculatrice à l'écran)
     'ecriture' : étiquettes à placer dans des cases (RF.ecriture)
     'perso'  : p.monter(zone, api) → { montrer() } ; api.reussi(), api.erreur(diag)
   RF.question(zone, q, cb, mode)   question en parties successives ; mode 'serie' ou 'manip'
   RF.serie(opts)                   série de 10 questions notée sur 20
   RF.ecriture(zone, o)             cases à remplir avec des étiquettes (loi de Descartes, fraction)
   RF.partiesCalcul(c)              parties « loi », « expression littérale », « valeur du sinus », « angle ou indice »
     c = { m1, m2, i1, i2, inconnue: 's2' | 's1' | 'n2', n1, n2, sym1, sym2 (angles), etapes }
   RF.revois(liste)                 liens « Revois… » vers d'autres applications (nouvelle fenêtre)
   RF.confettis()
   ============================================================ */
(function () {
  'use strict';

  /* ---------- Plan de l'application (sommaire, accueil, progression) ---------- */
  const PLAN = [
    { n: 1, titre: 'Placer les éléments du schéma', desc: 'Point d\'incidence, normale, rayons, angles i₁ et i₂, milieux',
      parties: [{ nom: 'Placer les éléments du schéma', entrainement: 'module_1_manip', noms: { entrainement: 'Manipulation : placer les éléments du schéma' } }] },
    { n: 2, titre: 'Écrire la loi de Descartes', desc: 'Adapter les notations, isoler la grandeur cherchée, calculer sin(i₂) puis l\'angle',
      parties: [{ nom: 'Écrire la loi de Descartes', entrainement: 'module_2_manip', noms: { entrainement: 'Manipulation : écrire la loi de Descartes' } }] },
    { n: 3, titre: 'Simulateur de réfraction', desc: 'Faire varier i₁, comparer i₁ et i₂, mesurer et tracer sin(i₁) en fonction de sin(i₂)',
      parties: [{ nom: 'Simulateur de réfraction', simulation: 'module_3_simulation', noms: { simulation: 'Simulateur : réfraction et réflexion' } }] },
    { n: 4, titre: 'Calculer un angle ou un indice', desc: 'Série notée sur 20 : schéma, loi, expression littérale, calcul',
      parties: [{ nom: 'Calculer un angle ou un indice', questions: 'module_4_questions', noms: { questions: 'Entraînement' } }] },
    { n: 5, titre: 'Dispersion de la lumière par un prisme', desc: 'Lumière blanche et monochromatique, le bleu plus dévié que le rouge',
      parties: [{ nom: 'Dispersion par un prisme', simulation: 'module_5_simulation', entrainement: 'module_5_manip',
                  noms: { simulation: 'Simulateur : dispersion par un prisme', entrainement: 'Manipulation : les rayons bleu et rouge' } }] },
  ];
  SOM.init({ nom: 'Réfraction et loi de Snell-Descartes', id: 'refraction', plan: PLAN });

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
  // nombre avec c chiffres significatifs, écrit simplement (22,1 ; 0,376 ; 33)
  function sig(v, c) {
    if (!v) return '0';
    const dec = Math.max(0, c - 1 - Math.floor(Math.log10(Math.abs(v)) + 1e-12));
    // un 5 exact en dernière position s'arrondit au-dessus (0,8365 → 0,837)
    return fmt(v * (1 + 1e-12), dec);
  }
  const court = (v, c) => fmt(+v.toPrecision(c || 3));
  // lecture d'une saisie : « 2,3 », « −0,5 », « 22.1 »
  function lire(s) {
    const t = String(s == null ? '' : s).trim().replace(/[\s  ]/g, '').replace(/[−–]/g, '-').replace(',', '.');
    return /^[-+]?(\d+\.?\d*|\.\d+)$/.test(t) ? parseFloat(t) : NaN;
  }
  // nombre de chiffres significatifs d'une saisie (« 0,376 » → 3 ; « 22,1 » → 3 ; « 33 » → 2)
  function cs(s) {
    let t = String(s).trim().replace(/[\s  ]/g, '').replace(/[−–+-]/g, '').replace(',', '.');
    if (!/^\d*\.?\d*$/.test(t)) return 0;
    t = t.replace('.', '').replace(/^0+/, '');
    return t.length || 1;
  }
  // la saisie t est-elle la valeur exacte arrondie avec moins de chiffres significatifs que demandé ?
  function tropCourt(v, t, exact, csDemande) {
    const n = cs(t);
    return exact !== 0 && n < csDemande && Math.abs(v - +exact.toPrecision(n)) <= 1e-9 * Math.max(1, Math.abs(v));
  }
  const fr = (h, b) => `<span class="fr"><span>${h}</span><span>${b}</span></span>`;
  const RAD = Math.PI / 180;
  const sinD = a => Math.sin(a * RAD);
  const asinD = x => Math.asin(x) / RAD;

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

  // liens « Revois… » vers d'autres applications (nouvelle fenêtre)
  const APPLIS = {
    spectres: { href: '../../spectres-etoiles/index.html', texte: 'Revois les spectres' },
    proportionnalite: { href: '../../proportionnalite/index.html', texte: 'Revois la proportionnalité' },
    equations: { href: '../../equations-en-physique/index.html', texte: 'Revois comment isoler une grandeur' },
    lecture: { href: '../../lecture-graphique/index.html', texte: 'Revois la lecture graphique' },
  };
  function revois(liste) {
    return `<p class="rf-revois">${liste.map(k => `<a href="${APPLIS[k].href}" target="_blank" rel="noopener">${APPLIS[k].texte} ↗</a>`).join('')}</p>`;
  }

  /* ============================================================
     MILIEUX ET ÉTIQUETTES DES ÉCRITURES
     ============================================================ */
  const MILIEUX = {
    air: { id: 'air', nom: 'air', n: 1.00, sym: 'air', fond: 'feuille', le: 'l\'air' },
    eau: { id: 'eau', nom: 'eau', n: 1.33, sym: 'eau', fond: 'papier', le: 'l\'eau' },
    verre: { id: 'verre', nom: 'verre', n: 1.50, sym: 'verre', fond: 'papier2', le: 'le verre' },
    plexi: { id: 'plexi', nom: 'plexiglas', n: 1.51, sym: 'plexi', fond: 'papier2', le: 'le plexiglas' },
    inconnu: { id: 'inconnu', nom: 'milieu inconnu', court: 'inconnu', n: 1.45, sym: 'inconnu', fond: 'papier', le: 'le milieu inconnu' },
  };
  const nHTML = sym => `n<sub>${sym}</sub>`;
  const iHTML = s => `i<sub>${s}</sub>`;
  // jetons : 'n:air' (indice), 'n1', 'n2' (notations générales), 's:1' (sin(i₁)), 'a:1' (i₁), 'x', '='
  function jeton(id) {
    if (id === 'x') return '×';
    if (id === '=') return '=';
    if (id === 'n1' || id === 'n2') return `n<sub>${id[1]}</sub>`;
    const [t, v] = id.split(':');
    if (t === 'n') return nHTML(v);
    if (t === 's') return `sin(${iHTML(v)})`;
    if (t === 'a') return iHTML(v);
    return id;
  }
  // texte d'un jeton pour un SVG ou un message (même écriture)
  const ecrire = ids => ids.map(jeton).join(' ');

  /* ============================================================
     PARTIES DE QUESTION
     Chaque partie reçoit (zone, p, api) et renvoie { montrer() }.
     ============================================================ */
  // Choix parmi des boutons : p.options [{ id, label }], p.bonne, p.indice ou p.indices[id], p.colonne
  function pChoix(zone, p, api) {
    const box = el('div', 'ph-choix' + (p.colonne ? ' ph-choix-col' : '') + (p.figures ? ' rf-choix-fig' : ''));
    zone.appendChild(box);
    const opts = p.melanger === false ? p.options : melanger(p.options);
    const bs = opts.map(o => {
      const b = el('button', 'btn-secondary', o.label);
      b.type = 'button'; b.dataset.id = o.id;
      box.appendChild(b);
      if (o.figure) o.figure(b);
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

  // Saisie d'un nombre : champ, unité, icône calculatrice ; p.avant(zone) : contenu sous le champ
  // p.verifier(v, texte) → { ok } | { diag } | { format } ; p.remplir(input) : réponse affichée
  function pNombre(zone, p, api) {
    const fin = (p.unite ? `<span class="rf-unite">${p.unite}</span>` : '') + (p.calc ? CALC : '');
    const box = el('div', 'rf-saisie', `<div class="rf-saisie-l">${p.label ? `<span class="rf-saisie-t">${p.label}</span>` : ''}
        <input type="text" class="ph-champ" inputmode="decimal" autocomplete="off" spellcheck="false" aria-label="${p.aria || 'Réponse'}">${fin}</div>
      <div class="rf-saisie-plus"></div>
      <div class="er-actions"><button type="button" class="btn-primary" data-a="ok">Valider</button></div>
      ${p.aide ? `<p class="rf-aide-saisie">${p.aide}</p>` : ''}`);
    zone.appendChild(box);
    const input = box.querySelector('input');
    if (p.avant) p.avant(box.querySelector('.rf-saisie-plus'), input);
    function valider() {
      if (api.fini()) return;
      const v = lire(input.value);
      if (isNaN(v)) { api.message('Écris un nombre (avec une virgule si besoin).'); return; }
      const r = p.verifier(v, input.value) || {};
      if (r.format) { api.message(r.format); return; }
      if (r.ok) { input.disabled = true; box.querySelectorAll('button').forEach(b => { b.disabled = true; }); api.reussi(); }
      else api.erreur(r.diag || '');
    }
    box.querySelector('[data-a="ok"]').onclick = valider;
    input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); valider(); } });
    if (surOrdi() && p.focus !== false) setTimeout(() => input.focus({ preventScroll: true }), 50);
    return {
      montrer() {
        input.disabled = true;
        box.querySelectorAll('button').forEach(b => { b.disabled = true; });
        if (p.remplir) p.remplir(input);
      },
    };
  }
  // Étiquettes à placer dans des cases (voir ecriture)
  function pEcriture(zone, p, api) { return ecriture(zone, p, api); }
  // Outil propre à l'application : p.monter(zone, api) → { montrer() }
  function pPerso(zone, p, api) {
    const ctx = p.monter(zone, api) || {};
    return { montrer() { if (ctx.montrer) ctx.montrer(); } };
  }
  const PARTIES = { choix: pChoix, nombre: pNombre, ecriture: pEcriture, perso: pPerso };

  /* ============================================================
     UNE QUESTION : parties successives
     q = { parties: [p] } ; p = { type, q (texte), figure(zone), solution (HTML affiché après), … }
     cb.fin(points) : 2 sans erreur, 1 après au moins une erreur, 0 si une réponse est affichée
     cb.partie(i) : appelée quand la partie i est réussie (déroulé guidé)
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
      window.RF.questionEnCours = q;          // question en cours (utile pour vérifier l'application)
      app.innerHTML = `<div class="er-card ph-tete"><div class="rf-tete"><span class="er-badge">${opts.badge}</span><h2 class="er-titre">${opts.titre}</h2>
            <p class="er-meta">Question ${idx + 1}/${qs.length} · Score : <b data-a="score">${pts(score)}</b></p></div>
          <div class="progress-bar"><div class="progress-fill" style="width:${Math.round(idx / qs.length * 100)}%"></div></div></div>
        <div class="er-card ph-question">${q.theme ? `<p class="er-q-nom">${q.theme}</p>` : ''}${q.consigne ? `<div class="er-consigne">${q.consigne}</div>` : ''}
          <div class="rf-q-corps">${q.figure ? '<div class="rf-q-fig"></div>' : ''}<div class="rf-q-texte">${q.enonce ? `<div class="ph-enonce">${q.enonce}</div>` : ''}<div data-a="parties"></div></div></div>
          <div data-a="retour"></div><div class="er-actions" data-a="suite"></div></div>`;
      if (q.figure) q.figure(app.querySelector('.rf-q-fig'));
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
        : pct >= 50 ? 'Pas mal ! Recommence pour progresser : les questions changent à chaque fois.' : 'Continue à t\'entraîner : refais les manipulations des modules 1 et 2, puis recommence.';
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
     ÉCRITURE AVEC DES ÉTIQUETTES (loi de Descartes, expression littérale)
     o = { jetons: [ids], forme: 'loi' (7 cases en ligne) | 'fraction' (gauche = num / den),
           gauche: HTML du membre de gauche (fraction), cases: 7 | 3 (par ligne de la fraction),
           verifier(lecture) → { ok } | { diag } | { format }, reponse: [ids] | { num, den } }
     lecture : tableau d'ids (null pour une case vide) ou { num, den }.
     Une étiquette se glisse dans une case, ou se touche : elle va dans la case choisie
     (encadrée ; par défaut la première case vide). Toucher une case remplie la vide.
     ============================================================ */
  function ecriture(zone, o, api) {
    const nb = o.cases || (o.forme === 'fraction' ? 3 : 7);
    const ligne = k => `<span class="rf-cases" data-l="${k}">${Array.from({ length: nb }, (_, i) => `<button type="button" class="rf-case" data-i="${i}" aria-label="Case ${i + 1}"></button>`).join('')}</span>`;
    const box = el('div', 'rf-ecr', `<div class="rf-ecr-l">${o.forme === 'fraction'
        ? `<span class="rf-ecr-g">${o.gauche} =</span><span class="rf-ecr-fr">${ligne('num')}<span class="rf-ecr-barre"></span>${ligne('den')}</span>`
        : ligne('loi')}</div>
      <div class="rf-palette" aria-label="Étiquettes"></div>
      <div class="er-actions"><button type="button" class="btn-primary" data-a="ok">Valider</button><button type="button" class="btn-small" data-a="eff">Effacer</button></div>
      <p class="rf-aide-saisie">Glisse les étiquettes dans les cases, ou touche une étiquette : elle va dans la case encadrée. Touche une case remplie pour la vider.</p>`);
    zone.appendChild(box);
    const cases = Array.from(box.querySelectorAll('.rf-case'));
    const contenu = new Map();             // case → id du jeton
    let active = cases[0], fige = false;
    function marquer() { cases.forEach(c => c.classList.toggle('rf-active', c === active && !fige)); }
    function poser(c, id) {
      if (fige) return;
      contenu.set(c, id);
      c.innerHTML = jeton(id);
      c.classList.add('rf-pleine');
      // case suivante : la première vide après celle-ci, sinon la première vide
      const i = cases.indexOf(c);
      active = cases.slice(i + 1).find(x => !contenu.get(x)) || cases.find(x => !contenu.get(x)) || c;
      marquer();
      if (api) api.effacer();
    }
    function vider(c) { contenu.delete(c); c.innerHTML = ''; c.classList.remove('rf-pleine'); }
    cases.forEach(c => {
      c.onclick = () => {
        if (fige) return;
        if (contenu.get(c)) vider(c);
        active = c; marquer();
      };
    });
    const pal = box.querySelector('.rf-palette');
    o.jetons.forEach(id => {
      const b = el('button', 'rf-jeton' + (id === 'x' || id === '=' ? ' rf-op' : ''), jeton(id));
      b.type = 'button'; b.dataset.id = id;
      pal.appendChild(b);
      const toucher = () => { if (!fige) poser(active, id); };
      if (window.DragDrop) {
        DragDrop.enable(b, {
          zoneSelector: '.rf-case',
          onDrop(item, z, evt) {
            if (z && box.contains(z)) { poser(z, id); return; }
            const r = b.getBoundingClientRect();
            if (!z && evt.clientX >= r.left && evt.clientX <= r.right && evt.clientY >= r.top && evt.clientY <= r.bottom) toucher();
          },
        });
      } else b.onclick = toucher;
    });
    marquer();
    function lecture() {
      const lire1 = k => Array.from(box.querySelectorAll(`.rf-cases[data-l="${k}"] .rf-case`)).map(c => contenu.get(c) || null);
      return o.forme === 'fraction' ? { num: lire1('num'), den: lire1('den') } : lire1('loi');
    }
    function remplir(rep) {
      cases.forEach(vider);
      if (o.forme === 'fraction') {
        ['num', 'den'].forEach(k => rep[k].forEach((id, i) => { const c = box.querySelector(`.rf-cases[data-l="${k}"] .rf-case[data-i="${i}"]`); if (c && id) { contenu.set(c, id); c.innerHTML = jeton(id); c.classList.add('rf-pleine'); } }));
      } else rep.forEach((id, i) => { if (cases[i] && id) { contenu.set(cases[i], id); cases[i].innerHTML = jeton(id); cases[i].classList.add('rf-pleine'); } });
    }
    function figer() {
      fige = true; marquer();
      box.classList.add('rf-fige');
      box.querySelectorAll('.er-actions button, .rf-jeton').forEach(b => { b.disabled = true; });
      box.querySelector('.rf-aide-saisie').hidden = true;
      pal.hidden = true;
    }
    box.querySelector('[data-a="eff"]').onclick = () => { if (fige) return; cases.forEach(vider); active = cases[0]; marquer(); };
    box.querySelector('[data-a="ok"]').onclick = () => {
      if (fige || (api && api.fini())) return;
      const r = o.verifier(lecture()) || {};
      if (r.format) { api.message(r.format); return; }
      if (r.ok) { figer(); api.reussi(); }
      else api.erreur(r.diag || '');
    };
    return { montrer() { remplir(o.reponse); figer(); }, lecture };
  }

  /* ============================================================
     ANALYSE DE LA LOI ET DE L'EXPRESSION LITTÉRALE
     ctx = { N1: 'n:air', N2: 'n:eau', S1: 's:1', S2: 's:2', A1: 'a:1', A2: 'a:2',
             m1, m2 (milieux), inconnue: 's2' | 's1' | 'n2' | 'n1' }
     ============================================================ */
  const estN = t => t === 'n1' || t === 'n2' || (t && t.startsWith('n:'));
  const estS = t => t && t.startsWith('s:');
  const estA = t => t && t.startsWith('a:');
  const egal = (a, b) => a.length === b.length && a.slice().sort().join('|') === b.slice().sort().join('|');
  // produit « a × b × … » → liste des facteurs, ou null s'il est mal écrit
  function produit(l) {
    const t = l.filter(x => x);
    if (!t.length) return [];
    if (t.length % 2 === 0) return null;
    const f = [];
    for (let i = 0; i < t.length; i++) {
      if (i % 2) { if (t[i] !== 'x') return null; }
      else { if (t[i] === 'x' || t[i] === '=') return null; f.push(t[i]); }
    }
    return f;
  }
  // diagnostics communs (notations générales, sinus oublié, milieu étranger)
  function diagCommuns(facteurs, ctx) {
    const noms = `${nHTML(ctx.m1.sym)} et ${nHTML(ctx.m2.sym)}`;
    if (facteurs.some(t => t === 'n1' || t === 'n2')) return `Adapte les notations : écris ${noms}, pas n<sub>1</sub> et n<sub>2</sub>.`;
    if (facteurs.some(estA)) return `Il manque le sinus : la loi utilise sin(${iHTML(ctx.sym1)}) et sin(${iHTML(ctx.sym2)}), pas les angles eux-mêmes.`;
    const etr = facteurs.find(t => estN(t) && t !== ctx.N1 && t !== ctx.N2);
    if (etr) return `Ici, les deux milieux sont ${ctx.m1.le} et ${ctx.m2.le} : les indices sont ${noms}.`;
    return null;
  }
  function analyserLoi(seq, ctx) {
    if (seq.some(x => !x)) return { format: 'Remplis les 7 cases.' };
    const g = produit(seq.slice(0, 3)), d = produit(seq.slice(4, 7));
    if (seq[3] !== '=' || !g || !d || g.length !== 2 || d.length !== 2) return { diag: 'La loi s\'écrit : indice × sinus d\'un angle = indice × sinus d\'un angle (un « × » de chaque côté du « = »).' };
    const c = diagCommuns(g.concat(d), ctx);
    if (c) return { diag: c };
    const okCote = f => f.filter(estN).length === 1 && f.filter(estS).length === 1;
    if (!okCote(g) || !okCote(d)) return { diag: 'De chaque côté du « = » : l\'indice d\'un milieu multiplié par le sinus d\'un angle.' };
    const paire = f => f.find(estN) + '|' + f.find(estS);
    const P = [paire(g), paire(d)].sort().join('&');
    if (P === [ctx.N1 + '|' + ctx.S1, ctx.N2 + '|' + ctx.S2].sort().join('&')) return { ok: true };
    if (P === [ctx.N2 + '|' + ctx.S1, ctx.N1 + '|' + ctx.S2].sort().join('&'))
      return { diag: `${ctx.diagEchange ? ctx.diagEchange + ' ' : ''}Le milieu 1 est celui qui contient le rayon incident : ${nHTML(ctx.m1.sym)} va avec sin(${iHTML(ctx.sym1)}) (angle d'incidence), ${nHTML(ctx.m2.sym)} avec sin(${iHTML(ctx.sym2)}).` };
    return { diag: `Un côté pour le milieu 1 (${nHTML(ctx.m1.sym)} et sin(${iHTML(ctx.sym1)})), l'autre pour le milieu 2 (${nHTML(ctx.m2.sym)} et sin(${iHTML(ctx.sym2)})).` };
  }
  // expression attendue de l'inconnue : { num, den } (listes de facteurs)
  function attendue(ctx) {
    return {
      s2: { num: [ctx.N1, ctx.S1], den: [ctx.N2] },
      s1: { num: [ctx.N2, ctx.S2], den: [ctx.N1] },
      n2: { num: [ctx.N1, ctx.S1], den: [ctx.S2] },
      n1: { num: [ctx.N2, ctx.S2], den: [ctx.S1] },
    }[ctx.inconnue];
  }
  const nomInconnue = ctx => ({ s2: `sin(${iHTML(ctx.sym2)})`, s1: `sin(${iHTML(ctx.sym1)})`, n2: nHTML(ctx.m2.sym), n1: nHTML(ctx.m1.sym) })[ctx.inconnue];
  const idInconnue = ctx => ({ s2: ctx.S2, s1: ctx.S1, n2: ctx.N2, n1: ctx.N1 })[ctx.inconnue];
  function analyserFraction(l, ctx) {
    const num = produit(l.num), den = produit(l.den);
    if (!l.num.some(x => x) || !l.den.some(x => x)) return { format: 'Remplis le numérateur et le dénominateur.' };
    if (!num || !den) return { diag: 'Écris un produit avec « × » entre deux étiquettes (par exemple : indice × sinus).' };
    const c = diagCommuns(num.concat(den), ctx);
    if (c) return { diag: c };
    const A = attendue(ctx), X = nomInconnue(ctx);
    if (egal(num, A.num) && egal(den, A.den)) return { ok: true };
    if (num.concat(den).includes(idInconnue(ctx))) return { diag: `On cherche ${X} : il ne doit pas apparaître dans le membre de droite.` };
    if (egal(num, A.den) && egal(den, A.num)) return { diag: `Tu as renversé la fraction. Pars de ${loiHTML(ctx)} : ${X} est multiplié par ${A.den.map(jeton).join(' × ')}, on divise donc par ${A.den.map(jeton).join(' × ')}.` };
    const nE = num.find(estN), dE = den.find(estN);
    if ((ctx.inconnue === 's2' || ctx.inconnue === 's1') && nE && dE && nE === A.den[0] && dE === A.num[0])
      return { diag: `Les indices sont échangés : dans ${loiHTML(ctx)}, ${nHTML(ctx.m1.sym)} va avec sin(${iHTML(ctx.sym1)}) et ${nHTML(ctx.m2.sym)} avec sin(${iHTML(ctx.sym2)}).` };
    return { diag: `Pars de ${loiHTML(ctx)} et divise les deux côtés par ce qui multiplie ${X}.` };
  }
  const loiHTML = ctx => `${nHTML(ctx.m1.sym)} × sin(${iHTML(ctx.sym1)}) = ${nHTML(ctx.m2.sym)} × sin(${iHTML(ctx.sym2)})`;

  /* ============================================================
     CALCULATRICE À L'ÉCRAN : sin⁻¹ de la valeur précédente (« SHIFT sin » puis « ans »)
     ============================================================ */
  function calculatrice(zone, ans) {
    const b = el('div', 'rf-calc', `<div class="rf-calc-ecran" aria-live="polite"><span class="rf-calc-mode">DEG</span><span class="rf-calc-l1">Ans = ${fmt(ans)}</span><span class="rf-calc-l2"></span></div>
      <button type="button" class="btn-secondary rf-calc-b" aria-label="Calculer l'arc sinus de Ans">sin<sup>−1</sup>(Ans)</button>`);
    zone.appendChild(b);
    b.querySelector('button').onclick = () => {
      const l2 = b.querySelector('.rf-calc-l2');
      if (ans > 1 || ans < -1) { l2.textContent = 'Math ERROR'; return; }
      const v = asinD(ans);
      l2.textContent = `sin⁻¹(Ans) = ${fmt(+v.toPrecision(8))}`;
    };
  }

  /* ============================================================
     PARTIES D'UN CALCUL AVEC LA LOI DE DESCARTES
     c = { m1, m2 (ids de MILIEUX), n1, n2 (valeurs si autres que celles du milieu),
           i1, i2 (degrés ; celui qu'on cherche peut manquer), inconnue: 's2' | 's1' | 'n2',
           sym1: '1', sym2: '2' (indices des angles), csAngle (chiffres significatifs du résultat),
           sansExpression, sansLoi, jetons (liste imposée), texteDonnees }
     ============================================================ */
  function contexte(c) {
    const m1 = Object.assign({}, MILIEUX[c.m1], c.n1 != null ? { n: c.n1 } : {}, c.sym1m ? { sym: c.sym1m, le: c.le1 } : {});
    const m2 = Object.assign({}, MILIEUX[c.m2], c.n2 != null ? { n: c.n2 } : {}, c.sym2m ? { sym: c.sym2m, le: c.le2 } : {});
    const s1 = c.sym1 || '1', s2 = c.sym2 || '2';
    return { m1, m2, sym1: s1, sym2: s2, N1: 'n:' + m1.sym, N2: 'n:' + m2.sym, S1: 's:' + s1, S2: 's:' + s2, A1: 'a:' + s1, A2: 'a:' + s2, inconnue: c.inconnue, diagEchange: c.diagEchange };
  }
  function jetonsDe(ctx, c) {
    if (c.jetons) return c.jetons;
    const ns = ['n:air', 'n:eau', 'n:verre', 'n:plexi'];
    [ctx.N1, ctx.N2].forEach(n => { if (!ns.includes(n)) ns.push(n); });
    return ns.concat(['n1', 'n2', ctx.S1, ctx.S2, ctx.A1, ctx.A2, 'x', '=']);
  }
  function partiesCalcul(c) {
    const ctx = contexte(c), A = attendue(ctx);
    const { m1, m2 } = ctx, n1 = m1.n, n2 = m2.n;
    const parties = [];
    const jets = jetonsDe(ctx, c);
    const i1T = `${iHTML(ctx.sym1)}`, i2T = `${iHTML(ctx.sym2)}`;
    if (!c.sansLoi) {
      parties.push({
        type: 'ecriture', forme: 'loi', jetons: jets, etape: 'loi',
        q: c.qLoi || `Écris la loi de Descartes pour la réfraction, avec les notations de cette situation.`,
        verifier: l => analyserLoi(l, ctx),
        reponse: [ctx.N1, 'x', ctx.S1, '=', ctx.N2, 'x', ctx.S2],
        solution: `${loiHTML(ctx)}`,
      });
    }
    if (!c.sansExpression) {
      parties.push({
        type: 'ecriture', forme: 'fraction', jetons: jets.filter(t => t !== '='), cases: 3, gauche: nomInconnue(ctx), etape: 'expr',
        q: `Donne l'expression littérale de ${nomInconnue(ctx)}.`,
        verifier: l => analyserFraction(l, ctx),
        reponse: { num: [A.num[0], 'x', A.num[1]], den: [A.den[0]] },
        solution: `${nomInconnue(ctx)} = ${fr(A.num.map(jeton).join(' × '), A.den.map(jeton).join(' × '))}`,
      });
    }
    // indices écrits avec au moins 2 décimales (1,00 ; 1,33 ; 1,673)
    const f2 = v => { const t = fmt(v); return (t.split(',')[1] || '').length >= 2 ? t : fmt(v, 2); };
    const ang = (a, cs) => sig(a, cs);
    const csA = c.csAngle || 3;
    const angTxt = (a, d) => (d != null ? fmt(a, d) : fmt(a));
    if (ctx.inconnue === 's2' || ctx.inconnue === 's1') {
      // angle connu, angle cherché
      const versI2 = ctx.inconnue === 's2';
      const nA = versI2 ? n1 : n2, nB = versI2 ? n2 : n1, aC = versI2 ? c.i1 : c.i2;
      const sinX = nA * sinD(aC) / nB, X = asinD(sinX);
      const symX = versI2 ? ctx.sym2 : ctx.sym1, symC = versI2 ? ctx.sym1 : ctx.sym2;
      const nAh = nHTML((versI2 ? m1 : m2).sym), nBh = nHTML((versI2 ? m2 : m1).sym);
      const sinRad = nA * Math.sin(aC) / nB;                     // calculatrice réglée en radians
      const sinEch = nB * sinD(aC) / nA;                          // indices échangés
      let sinEleve = null;
      parties.push({
        type: 'nombre', etape: 'sin',
        q: `Calcule sin(${iHTML(symX)}) (3 chiffres significatifs).`,
        label: `sin(${iHTML(symX)}) = ${fr(`${nAh} × sin(${iHTML(symC)})`, nBh)} = ${fr(`${f2(nA)} × sin(${angTxt(aC, c.dec)})`, f2(nB))} =`, calc: true,
        verifier(v, t) {
          if (Math.abs(v - sinX) <= 0.0011 + 1e-9) {
            if (sinX !== 0 && cs(t) !== 3) return { format: `Ta valeur est juste : écris-la avec 3 chiffres significatifs (${sig(sinX, 3)}).` };
            sinEleve = v; return { ok: true };
          }
          if (tropCourt(v, t, sinX, 3)) return { format: `Écris sin(${iHTML(symX)}) avec 3 chiffres significatifs.` };
          if (v > 1) return { diag: 'Un sinus ne dépasse jamais 1 : vérifie ton calcul. (Hors programme : quand ce calcul donne plus de 1, il n\'y a pas de rayon réfracté, voir le simulateur du module 3.)' };
          if (aC && Math.abs(v - sinRad) <= 0.002 && Math.abs(sinRad - sinX) > 0.01) return { diag: 'Ta calculatrice est en radians : mets-la en degrés.' };
          if (aC && Math.abs(v - sinEch) <= 0.002) return { diag: `Les indices sont échangés : sin(${iHTML(symX)}) = ${nAh} × sin(${iHTML(symC)}) / ${nBh}.` };
          if (Math.abs(v - X) <= 0.6 && X > 1) return { diag: `C'est la valeur de l'angle ; on demande d'abord sin(${iHTML(symX)}).` };
          if (aC && Math.abs(v - nA * aC / nB) <= 0.06) return { diag: `Il manque le sinus : calcule sin(${angTxt(aC, c.dec)}°), pas ${angTxt(aC, c.dec)}.` };
          return { diag: `Calcule ${f2(nA)} × sin(${angTxt(aC, c.dec)}) ÷ ${f2(nB)}, calculatrice en degrés.` };
        },
        remplir(i) { i.value = sig(sinX, 3).replace(/\s/g, ''); sinEleve = +sinX.toPrecision(3); },
        solution: `sin(${iHTML(symX)}) = ${fr(`${f2(nA)} × sin(${angTxt(aC, c.dec)})`, f2(nB))} ${sinX === 0 ? '=' : '≈'} <b>${sig(sinX, 3)}</b>`,
      });
      const tol = csA >= 3 ? 0.06 : 0.6;
      parties.push({
        type: 'nombre', etape: 'angle',
        q: `Calcule l'angle ${iHTML(symX)} (${csA} chiffres significatifs).`,
        label: `${iHTML(symX)} =`, unite: '°', calc: true,
        avant(z) { calculatrice(z, sinEleve != null ? sinEleve : +sinX.toPrecision(3)); },
        verifier(v, t) {
          const ref = sinEleve != null ? asinD(Math.min(1, sinEleve)) : X;
          const juste = Math.abs(v - X) <= tol + 1e-9 || Math.abs(v - ref) <= tol + 1e-9;
          if (juste) {
            if (X !== 0 && cs(t) !== csA) return { format: `Ta valeur est juste : écris-la avec ${csA} chiffres significatifs (${ang(X, csA)}°).` };
            return { ok: true };
          }
          if (tropCourt(v, t, X, csA)) return { format: `Écris ${iHTML(symX)} avec ${csA} chiffres significatifs.` };
          if (sinEleve != null && Math.abs(v - sinEleve) <= 0.002 && X > 1) return { diag: `C'est sin(${iHTML(symX)}) ; il faut maintenant l'angle : sin<sup>−1</sup>.` };
          if (Math.abs(v - Math.asin(Math.min(1, sinX)) ) <= 0.006 && X > 1) return { diag: 'Ta calculatrice est en radians : mets-la en degrés.' };
          if (v > 90) return { diag: 'Un angle d\'incidence ou de réfraction est compris entre 0° et 90°.' };
          return { diag: `Calcule sin<sup>−1</sup>(${sig(sinX, 3)}) (touches « SHIFT sin » puis « ans »).` };
        },
        remplir(i) { i.value = ang(X, csA).replace(/\s/g, ''); },
        solution: `${iHTML(symX)} = sin<sup>−1</sup>(${sig(sinX, 3)}) ${X === 0 ? '=' : '≈'} <b>${ang(X, csA)}°</b>`,
      });
      return parties;
    }
    // indice cherché : n2 = n1 × sin(i1) / sin(i2)
    const nX = n1 * sinD(c.i1) / sinD(c.i2);
    const nRad = n1 * Math.sin(c.i1) / Math.sin(c.i2), nInv = 1 / nX;
    const csN = c.csIndice || 3;
    parties.push({
      type: 'nombre', etape: 'indice',
      q: `Calcule l'indice ${nHTML(m2.sym)} (${csN} chiffres significatifs).`,
      label: `${nHTML(m2.sym)} = ${fr(`${nHTML(m1.sym)} × sin(${i1T})`, `sin(${i2T})`)} = ${fr(`${f2(n1)} × sin(${angTxt(c.i1, c.dec)})`, `sin(${angTxt(c.i2, c.dec)})`)} =`, calc: true,
      verifier(v, t) {
        if (Math.abs(v - nX) <= 0.006 + 1e-9) {
          if (cs(t) !== csN) return { format: `Ta valeur est juste : écris-la avec ${csN} chiffres significatifs (${sig(nX, csN)}).` };
          return { ok: true };
        }
        if (tropCourt(v, t, nX, csN)) return { format: `Écris ${nHTML(m2.sym)} avec ${csN} chiffres significatifs.` };
        if (Math.abs(v - nRad) <= 0.01) return { diag: 'Ta calculatrice est en radians : mets-la en degrés.' };
        if (Math.abs(v - nInv) <= 0.01) return { diag: `Tu as renversé la fraction : ${nHTML(m2.sym)} = ${nHTML(m1.sym)} × sin(${i1T}) / sin(${i2T}).` };
        if (Math.abs(v - c.i1 / c.i2) <= 0.01) return { diag: `Il manque le sinus : divise sin(${angTxt(c.i1, c.dec)}°) par sin(${angTxt(c.i2, c.dec)}°), pas les angles.` };
        if (v < 1) return { diag: 'Un indice de réfraction est toujours supérieur ou égal à 1.' };
        return { diag: `Calcule ${f2(n1)} × sin(${angTxt(c.i1, c.dec)}) ÷ sin(${angTxt(c.i2, c.dec)}), calculatrice en degrés.` };
      },
      remplir(i) { i.value = sig(nX, csN).replace(/\s/g, ''); },
      solution: `${nHTML(m2.sym)} = ${fr(`${f2(n1)} × sin(${angTxt(c.i1, c.dec)})`, `sin(${angTxt(c.i2, c.dec)})`)} ≈ <b>${sig(nX, csN)}</b>`,
    });
    return parties;
  }

  window.RF = {
    PLAN, CALC, MILIEUX, fmt, sig, court, lire, cs, fr, sinD, asinD, el, melanger, hasard, defiler, amener, surOrdi, revois,
    jeton, ecrire, nHTML, iHTML, PARTIES, question, serie, ecriture, analyserLoi, analyserFraction, contexte, partiesCalcul,
    calculatrice, confettis,
  };
})();
