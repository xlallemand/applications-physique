/* ============================================================
   Moteur de l'application « Chapitre 2 : Nomenclature » (Terminale
   spécialité ; même moteur de questions que « Cinématique » et
   « Chapitre 6 : Principe fondamental de la dynamique » ; navigation
   commune assets/sommaire.js, cours avec assets/cours.js ; molécules :
   moteur partagé ORGA, assets/orga.js et assets/orga-dessin.js)

   NOM.fmt, NOM.el, NOM.secouer, NOM.melanger, NOM.hasard, NOM.entre
   NOM.o(id, label)                   option d'une partie 'choix'
   NOM.PARTIES                        parties de question : 'choix', 'nombre', 'texte',
                                      'perso' (p.monter(zone, api) → { montrer() } : outils ORGA)
                                      api.reussi(note) · api.erreur(h) · api.compterErreur() · api.effacer() · api.message(h) · api.fini()
   NOM.question(zone, q, cb, mode)    question en parties successives ('serie', 'exercice', 'cours')
   NOM.serie(opts)                    série de questions notée sur 20
   NOM.confettis()
   NOM.mol(smiles)                    ORGA.lire
   NOM.dessin(smiles ou mol, o)       dessin d'une molécule (ORGA.dessinHTML) dans un cadre blanc
   NOM.CLE_AIDES                      clé localStorage des aides des outils « nommer »
   NOM.video(url, texte, avert)       lien vers une vidéo facultative (encart)
   NOM.molHTML(smiles, o)             molécule dans une petite carte : o.titre, o.ecriture, o.nom (true : nom et couleurs)
   NOM.trois(smiles, o)               la molécule dans les trois écritures, côte à côte
   NOM.partieNom(smiles, o)           nommer avec l'outil ORGA (aides gardées dans « nomenclature-aides »)
   NOM.enchainer(q, parties, corr.)   plusieurs outils à la suite dans une seule partie (exercices)
   NOM.PLUSIEURS, NOM.partiesPlusieurs(x)   molécules à plusieurs groupes (ex. 5, sujets de bac) : entourer puis nommer
   NOM.nomsFaux(mol)                  noms faux classiques [{ nom, diag }] (QCM « trouver l'erreur »)
   NOM.partieBrute(mol, o)            formule brute à écrire (diagnostic : C, H implicites, autres atomes)
   NOM.motif(el, liaisons, doublets)  liaisons et doublets non liants d'un atome (SVG)
   NOM.classif(zone, o)               extrait de la classification : toucher un élément compte les cases jusqu'aux gaz nobles
   NOM.atelier(o)                     liste de tâches d'un atelier (faites gardées dans « nomenclature-ateliers »)
   NOM.PLAN, NOM.menu(cle), NOM.accueil(zone), NOM.marquer(info)

   Les styles des cartes, boutons et écrans de fin viennent de
   equilibrer-reactions/modules/er.css (même présentation).
   ============================================================ */
(function () {
  'use strict';

  const MOINS = '−';
  const O = window.ORGA;

  /* ============================================================
     NOMBRES ET OUTILS
     ============================================================ */
  function fmt(v) {
    const r = Math.round(v * 1e9) / 1e9;
    return String(r).replace('-', MOINS).replace('.', ',');
  }
  function lire(s) {
    const t = String(s == null ? '' : s).trim().replace(/[\s  ]/g, '').replace(',', '.').replace(/[−–]/g, '-');
    return /^[-+]?(\d+\.?\d*|\.\d+)$/.test(t) ? parseFloat(t) : NaN;
  }
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
  const o = (id, label) => ({ id, label });
  const surOrdi = () => matchMedia('(hover: hover)').matches;

  // molécules
  const mol = s => (typeof s === 'string' ? O.lire(s) : s);
  const dessin = (s, op) => `<div class="nom-fig">${O.dessinHTML(mol(s), op || {})}</div>`;

  /* ============================================================
     PARTIES DE QUESTION
     Chaque partie reçoit (zone, p, api) et renvoie { montrer() }.
     ============================================================ */

  // Choix parmi des boutons : p.options [{ id, label }], p.bonne, p.indice ou p.indices[id], p.colonne
  function pChoix(zone, p, api) {
    const box = el('div', 'ph-choix' + (p.colonne ? ' ph-choix-col' : ''));
    zone.appendChild(box);
    const opts = p.melanger === false ? p.options : melanger(p.options);
    const bs = opts.map(op => {
      const b = el('button', 'btn-secondary', op.label);
      b.type = 'button';
      b.dataset.id = op.id;
      box.appendChild(b);
      b.onclick = () => {
        if (api.fini() || b.disabled) return;
        if (op.id === p.bonne) {
          b.classList.add('juste');
          bs.forEach(x => { x.b.disabled = true; });
          api.reussi();
        } else {
          b.classList.add('faux'); b.disabled = true;
          api.erreur((p.indices && p.indices[op.id]) || p.indice || '');
        }
      };
      return { b, o: op };
    });
    return { montrer() { bs.forEach(({ b, o: op }) => { b.disabled = true; if (op.id === p.bonne) b.classList.add('juste'); }); } };
  }

  // Bouton « Valider » d'une partie (disparaît une fois la partie terminée)
  function boutonValider(zone) {
    const a = el('div', 'er-actions ph-actions-partie', '<button type="button" class="btn-primary">Valider</button>');
    zone.appendChild(a);
    const b = a.querySelector('button');
    b.fermer = () => { b.disabled = true; a.remove(); };
    return b;
  }

  // Nombre entier ou décimal : p.label, p.valeur, p.tol, p.unite, p.diag(v), p.indice
  function pNombre(zone, p, api) {
    const d = el('div', 'ph-valeur');
    if (p.label) d.appendChild(el('span', 'ph-lab', p.label));
    const box = el('span', 'ph-champ-box');
    box.innerHTML = `<input type="text" class="ph-champ" inputmode="${p.entier ? 'numeric' : 'decimal'}" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="${p.aria || 'Réponse'}">`;
    d.appendChild(box);
    if (p.unite) d.appendChild(el('span', 'ph-unite', p.unite));
    zone.appendChild(d);
    const input = box.querySelector('input');
    const bVal = boutonValider(zone);
    input.addEventListener('input', () => api.effacer());
    input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); valider(); } });
    function valider() {
      if (api.fini()) return;
      const v = lire(input.value);
      if (isNaN(v)) { secouer(d); api.message('Écris un nombre.'); return; }
      if (Math.abs(v - p.valeur) <= (p.tol || 0) + 1e-9) { input.disabled = true; bVal.fermer(); api.reussi(); return; }
      api.erreur((p.diag && p.diag(v)) || p.indice || 'Vérifie ta réponse.');
      secouer(d);
    }
    bVal.onclick = valider;
    return { montrer() { input.value = fmt(p.valeur); input.disabled = true; bVal.fermer(); } };
  }

  // Réponse écrite : p.reponses (comparaison sans espaces, ni casse ; accents ignorés si p.accents === false),
  // p.verifier(texte) → { ok, remarque } ou { ok: false, diag } (nom d'une molécule…), p.affiche, p.largeur
  const normaliser = s => String(s || '').replace(/[\s  ]/g, '').replace(/[−–]/g, '-').toLowerCase();
  function pTexte(zone, p, api) {
    const d = el('div', 'ph-valeur');
    if (p.label) d.appendChild(el('span', 'ph-lab', p.label));
    const input = el('input', 'ph-champ nom-texte');
    input.type = 'text';
    input.setAttribute('autocomplete', 'off'); input.setAttribute('autocapitalize', 'off'); input.setAttribute('spellcheck', 'false');
    input.setAttribute('aria-label', p.aria || 'Réponse');
    input.style.width = (p.largeur || 260) + 'px';
    input.style.maxWidth = '100%';
    d.appendChild(input);
    if (p.unite) d.appendChild(el('span', 'ph-unite', p.unite));
    if (p.apres) d.insertAdjacentHTML('beforeend', p.apres);
    zone.appendChild(d);
    const bVal = boutonValider(zone);
    input.addEventListener('input', () => api.effacer());
    input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); valider(); } });
    function valider() {
      if (api.fini()) return;
      const v = input.value.trim();
      if (!v) { secouer(d); api.message('Écris ta réponse.'); return; }
      if (p.verifier) {
        const r = p.verifier(v);
        if (r.ok) { input.disabled = true; bVal.fermer(); api.reussi(r.remarque || undefined); return; }
        if (r.vide) { api.message(r.diag); return; }
        api.erreur(r.diag); secouer(d); return;
      }
      const sa = x => (p.accents === false ? O.sansAccent(x) : x);
      if (p.reponses.some(r => sa(normaliser(r)) === sa(normaliser(v)))) { input.disabled = true; bVal.fermer(); api.reussi(); return; }
      api.erreur((p.diag && p.diag(v)) || p.indice || 'Relis la règle.');
      secouer(d);
    }
    bVal.onclick = valider;
    return { montrer() { input.value = p.affiche || p.reponses[0]; input.disabled = true; bVal.fermer(); } };
  }

  // Outil propre à l'application (outils ORGA) : p.monter(zone, api) → { montrer() }
  function pPerso(zone, p, api) {
    const ctx = p.monter(zone, api) || {};
    return { montrer() { if (ctx.montrer) ctx.montrer(); } };
  }

  const PARTIES = { choix: pChoix, nombre: pNombre, texte: pTexte, perso: pPerso };

  /* ============================================================
     UNE QUESTION : parties successives
     q = { parties: [p] } ; p = { type, q (texte), figure(zone), solution / correction (HTML affiché après), … }
     mode : 'serie'    bouton « Afficher la réponse » (0 point pour la question)
            'exercice' bouton « Voir la correction » toujours disponible
            'cours'    « Afficher la réponse » proposé après une erreur
     cb.fin(points, etat) : 2 sans erreur, 1 après au moins une erreur, 0 si une réponse est affichée
     ============================================================ */
  function question(zone, q, cb, mode) {
    mode = mode || 'serie';
    const etat = { erreurs: 0, vue: false, fini: false, details: [] };
    const n = q.parties.length;
    let rendues = 0, finies = 0;
    const libAide = mode === 'exercice' ? 'Voir la correction' : 'Afficher la réponse';
    function partie() {
      const p = q.parties[rendues++];
      window.NOM.partieEnCours = p;          // partie en cours (utile pour vérifier l'application)
      const d = el('div', 'ph-partie', `${p.q ? `<div class="ph-partie-q">${p.q}</div>` : ''}<div class="ph-partie-fig"></div><div class="ph-partie-zone"></div><div class="ph-partie-retour"></div>
        <div class="ph-partie-aide${mode === 'cours' ? ' hidden' : ''}"><button type="button" class="btn-small">${libAide}</button></div>`);
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
        reussi(note) { terminer(false, note); },
      };
      window.NOM.apiEnCours = api;           // (idem)
      const ctx = PARTIES[p.type](d.querySelector('.ph-partie-zone'), p, api);
      bRep.onclick = () => { if (finie) return; ctx.montrer(); etat.vue = true; terminer(true); };
      function terminer(vue, note) {
        finie = true;
        aide.remove();
        etat.details.push({ vue, erreurs: erreursIci });
        const titre = vue ? (mode === 'exercice' ? 'Correction' : 'Réponse') : (erreursIci ? 'C\'est juste.' : 'Juste !');
        const sol = (vue && p.correction ? p.correction : (p.solution || p.correction)) || (vue && p.type === 'perso' ? '<p>La réponse est affichée ci-dessus.</p>' : '');
        if (sol || vue || note) {
          ret.innerHTML = `<div class="${vue ? 'callout' : 'callout-success'} er-retour ph-solution"><p><b class="${vue ? '' : 'er-ok'}">${titre}</b>${note ? ' ' + note : ''}</p>${sol ? `<div>${sol}</div>` : ''}</div>`;
        } else ret.innerHTML = '<p class="ph-ok">✓ Juste</p>';
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
      window.NOM.questionEnCours = q;          // question en cours (utile pour vérifier l'application)
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
     ATELIER : une liste de tâches, une à la fois, faites gardées dans le navigateur
     atelier({ zone, cle, taches: [{ titre, enonce, parties }], bilan, surFait })
       les tâches réussies sont gardées dans localStorage « nomenclature-ateliers » ;
       quand toutes sont faites (ou au bout de la liste), le bilan s'affiche et la page est marquée faite.
     ============================================================ */
  const CLE_ATELIERS = 'nomenclature-ateliers';
  function lireAteliers() { try { return JSON.parse(localStorage.getItem(CLE_ATELIERS)) || {}; } catch (e) { return {}; } }
  function noterAtelier(cle, k) {
    try { const r = lireAteliers(); r[cle] = Array.from(new Set((r[cle] || []).concat([k]))); localStorage.setItem(CLE_ATELIERS, JSON.stringify(r)); } catch (e) { /* stockage indisponible */ }
  }
  function atelier(opts) {
    const zone = opts.zone, ts = opts.taches, bilan = opts.bilan;
    const faites = () => new Set(lireAteliers()[opts.cle] || []);
    function afficherBilan() {
      if (!bilan || !bilan.hidden) return;
      bilan.hidden = false;
      window.SOM.marquer({ fait: true });                        // atelier fait (sommaire, accueil)
    }
    function tache(k, defiler) {
      const t = typeof ts[k] === 'function' ? ts[k]() : ts[k], f = faites();
      zone.innerHTML = `<p class="er-q-nom">${opts.nomTache || 'Tâche'} ${k + 1} / ${ts.length}</p><h3 class="er-titre" style="margin-top:2px">${t.titre}</h3>
        <div class="nom-taches" role="group" aria-label="Choisir une tâche">${ts.map((x, i) => `<button type="button" data-k="${i}" class="${f.has(i) ? 'fait' : ''}" aria-current="${i === k}" aria-label="${opts.nomTache || 'Tâche'} ${i + 1}${f.has(i) ? ' (faite)' : ''}">${f.has(i) ? '✓' : i + 1}</button>`).join('')}</div>
        ${t.enonce ? `<div class="ph-enonce" style="margin-top:12px">${t.enonce}</div>` : ''}<div data-a="parties"></div><div class="er-actions" data-a="suite"></div>`;
      zone.querySelectorAll('.nom-taches button').forEach(b => { b.onclick = () => tache(+b.dataset.k, true); });
      if (defiler) zone.scrollIntoView({ behavior: 'smooth', block: 'start' });
      question(zone.querySelector('[data-a="parties"]'), t, {
        fin() {
          noterAtelier(opts.cle, k);
          const s = zone.querySelector('[data-a="suite"]'), der = k === ts.length - 1;
          s.innerHTML = der ? (bilan ? '<button type="button" class="btn-primary">Voir le bilan →</button>' : '') : `<button type="button" class="btn-primary">${opts.nomTache || 'Tâche'} ${k + 2} →</button>`;
          const b = s.querySelector('button');
          if (b) b.onclick = () => { if (der) { afficherBilan(); bilan.scrollIntoView({ behavior: 'smooth', block: 'start' }); } else tache(k + 1, true); };
          if (der || ts.every((x, i) => faites().has(i))) afficherBilan();
          setTimeout(() => s.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 80);
        },
      }, 'cours');
    }
    const f = faites(), premiere = ts.findIndex((x, i) => !f.has(i));
    tache(premiere < 0 ? 0 : premiere, false);
    if (premiere < 0) afficherBilan();
    return { tache };
  }

  /* ============================================================
     AIDES DE RÉDACTION (cours, séries, exercices)
     ============================================================ */
  const EC = { developpee: 'Développée', semi: 'Semi-développée', topo: 'Topologique' };
  // lien vers une vidéo (facultative), juste avant la notion qu'elle explique
  const video = (url, texte, apres) => `<div class="callout nom-video"><p>▶ <b>Vidéo (facultative)</b> : <a href="${url}" target="_blank" rel="noopener">${texte}</a></p>${apres ? `<p class="nom-avert">${apres}</p>` : ''}</div>`;
  // une molécule dans une petite carte, avec un titre et un nom (en couleurs si n = nommer(…))
  function molHTML(s, op) {
    op = op || {};
    const m = mol(s);
    const r = op.nom === true ? O.nommer(m) : null;
    const autres = Object.assign({}, op);
    if (typeof autres.numeros === 'boolean') delete autres.numeros;      // numeros: false → pas de numéros
    const d = O.dessinHTML(m, Object.assign({}, r && op.couleurs !== false ? { couleurs: r.couleurs, numeros: op.numeros === false ? null : r.numeros } : {}, autres));
    const nom = r ? O.nomHTML(r.parties) : op.nom || '';
    return `<div class="nom-mol">${op.titre ? `<div class="nom-mol-t">${op.titre}</div>` : ''}${d}${nom ? `<div class="nom-mol-n">${nom}</div>` : ''}${op.legende || ''}</div>`;
  }
  // la même molécule dans les trois écritures, côte à côte
  const trois = (s, op) => `<div class="nom-mols nom-mols-3">${['developpee', 'semi', 'topo'].map(ec => molHTML(s, Object.assign({ titre: EC[ec], ecriture: ec }, op))).join('')}</div>`;
  // nommer une molécule avec l'outil ORGA (aides gardées dans le navigateur)
  const partieNom = (s, op) => O.partieNom(mol(s), Object.assign({ cleAides: 'nomenclature-aides' }, op));

  /* ---------- Formule brute saisie ----------
     partieBrute(m, op) → partie 'texte' : diagnostic dans l'ordre C, H (implicites), autres atomes */
  function compter(f) {
    const r = {}, t = String(f).replace(/\s/g, '').replace(/[₀-₉]/g, c => '₀₁₂₃₄₅₆₇₈₉'.indexOf(c));
    if (!/^([A-Z][a-z]?\d*)+$/.test(t)) return null;
    t.replace(/([A-Z][a-z]?)(\d*)/g, (x, e, n) => { r[e] = (r[e] || 0) + (n ? +n : 1); return ''; });
    return r;
  }
  function diagBrute(v, m, op) {
    const s = compter(v), e = compter(O.formuleBrute(m));
    if (!s) return 'Écris la formule brute avec les symboles des atomes et leur nombre : C, puis H, puis les autres (exemple : C5H12O).';
    const ec = (op && op.ecriture) || 'topo';
    if ((s.C || 0) !== e.C) return `Tu as compté ${s.C || 0} C : il y en a ${(s.C || 0) < e.C ? 'plus' : 'moins'}.${ec === 'topo' ? ' En topologique, chaque sommet et chaque bout de trait est un C.' : ''}`;
    if ((s.H || 0) !== (e.H || 0)) return ec === 'topo' ? 'Compte les H : en topologique, les H des C ne sont pas dessinés. Chaque C a 4 liaisons : les H complètent (4 − nombre de traits).' : 'Compte les H de chaque groupe (CH₃ : 3 H, CH₂ : 2 H…), sans oublier ceux des OH, NH₂… et ceux des écritures abrégées (C₂H₅ : 5 H).';
    for (const x of Object.keys(e)) if ((s[x] || 0) !== e[x]) return `Compte les atomes ${x} : il y en a ${e[x]}.`;
    for (const x of Object.keys(s)) if (!e[x]) return `Il n'y a pas d'atome ${x} dans cette molécule.`;
    return 'Écris d\'abord C, puis H, puis les autres atomes dans l\'ordre alphabétique.';
  }
  const partieBrute = (m, op) => Object.assign({ type: 'texte', label: 'Formule brute :', reponses: [O.formuleBrute(mol(m))], casse: true, largeur: 150,
    affiche: O.formuleBrute(mol(m)), diag: v => diagBrute(v, mol(m), op), solution: `<p>Formule brute : <b>${O.formuleBrute(mol(m), { html: true })}</b>.</p>` }, op && op.partie);

  /* ---------- Molécules à plusieurs groupes (ex. 5 de la feuille, sujets de bac) ----------
     { titre, s (SMILES), ecriture, condenser (étiquettes de l'énoncé), pos (coordonnées données), note } */
  const POS_ATROPINE = [[0, .15], [0, 1], [-.87, .5], [-.6, 1.6], [.6, 1.6], [.87, .5], [.87, -.5], [0, -1], [-.87, -.5], [0, -2], [.87, -2.5], [.87, -3.5],
    [1.73, -2], [1.73, -1], [2.6, -.5], [2.6, -2.5], [3.47, -2], [4.34, -2.5], [4.34, -3.5], [3.47, -4], [2.6, -3.5]].map(([x, y]) => ({ x, y }));
  const PLUSIEURS = {
    glycine: { titre: 'Glycine', s: 'NCC(=O)O' },
    serine: { titre: 'Sérine', s: 'OCC(N)C(=O)O' },
    asparagine: { titre: 'Asparagine', s: 'NC(=O)CC(N)C(=O)O' },
    pheromone: { titre: 'Phéromone de la reine chez les abeilles', s: 'CC(=O)CCCCCC=CC(=O)O', condenser: [{ atomes: [3, 4, 5, 6, 7], texte: '(CH2)5' }] },
    cannelle: { titre: 'Arôme de cannelle', s: 'C1=CC=CC=C1C=CC=O', condenser: [{ atomes: [0, 1, 2, 3, 4, 5], texte: 'C6H5' }] },
    lactique: { titre: 'Acide lactique (lait, muscles)', s: 'CC(O)C(=O)O' },
    malique: { titre: 'Acide malique (pomme)', s: 'OC(=O)CC(O)C(=O)O' },
    frambinone: { titre: 'Frambinone (arôme de framboise)', s: 'CC(=O)CCC1=CC=C(O)C=C1', ecriture: 'topo',
      note: 'Le OH porté par le cycle benzénique est un groupe hydroxyle, mais la molécule n\'est pas un alcool : c\'est un phénol, famille hors programme.' },
    atropine: { titre: 'Atropine (médicament, belladone)', s: 'CN1C2CCC1CC(C2)OC(=O)C(CO)C3=CC=CC=C3', ecriture: 'topo', pos: POS_ATROPINE },
  };
  // parties d'une molécule à plusieurs groupes : entourer, puis nommer chaque sorte de groupe (sauf un OH sur un cycle benzénique)
  function partiesPlusieurs(x, op) {
    const m = mol(x.s), gs = O.groupes(m);
    const ent = O.partieEntourer(m, Object.assign({ ecriture: x.ecriture || 'semi', condenser: x.condenser, pos: x.pos }, op));
    const noms = gs.some(g => g.classe === 'phénol')
      ? [...new Set(gs.filter(g => g.classe !== 'phénol').map(g => g.cle))].map(cle => {
        const ns = gs.map((g, k) => (g.cle === cle && g.classe !== 'phénol' ? k + 1 : 0)).filter(Boolean);
        return Object.assign(O.partieNommerGroupe(cle, `Nomme le groupe entouré n° ${ns.join(' et ')} et donne sa famille.`, 'n° ' + ns.join(' et ')), { solution: `<p>Groupe n° ${ns.join(' et ')} : <b>${O.FAMILLES[cle].nomGroupe}</b> (${O.FAMILLES[cle].familles}). ${x.note || ''}</p>` });
      })
      : O.partiesNommerGroupes(m);
    return [ent].concat(noms);
  }

  /* ---------- Noms faux classiques d'une molécule (QCM « trouver l'erreur ») ----------
     nomsFaux(m) → [{ nom, diag }] : chaîne trop courte (1-méthyl…, 2-éthyl…), numérotation inversée,
     di oublié, ramifications identiques séparées, ordre alphabétique, tirets et virgules ;
     chaque nom faux avec le diagnostic de ORGA.diagnostiquerNom. */
  function nomsFaux(m0) {
    const m = mol(m0), r = O.nommer(m), S = r.struct, out = new Map();
    const ajouter = n => { if (!n || n === r.nom || out.has(n)) return; const d = O.diagnostiquerNom(n, r); if (!d.ok) out.set(n, d.diag); };
    const fin = r.nom.slice(r.nom.lastIndexOf(r.parties.filter(p => p[1] === 'chaine')[0][0]));
    const acide = S.acide ? 'acide ' : '';
    const pref = (gs, ecr) => gs.map(g => (ecr !== false ? g.locs.join(',') + '-' : '') + O.MULT[g.locs.length] + g.nom).join('-');
    // chaîne trop courte : le nom qu'on obtiendrait avec une autre chaîne
    r.chaines.tous.filter(c => c.chaine.length < r.n && !c.subs.some(x => x.complexe)).slice(0, 6).forEach(c => {
      const r2 = O.nommer(m, { chaine: c.chaine });
      if (!r2.horsProgramme) ajouter(r2.nom);
    });
    const gs = S.prefixes;
    if (gs.length && !S.cyclo && !['aldehyde', 'acide', 'ester', 'amide'].includes(S.famille)) {
      const inv = gs.map(g => ({ nom: g.nom, locs: g.locs.map(l => (l === 'N' ? l : S.n + 1 - l)).sort((a, b) => a - b) }));
      // numérotation par l'autre bout (le numéro du groupe aussi)
      const mg = r.morceaux.find(x => x.type === 'groupe');
      const finInv = S.gEcrit && mg ? fin.replace(`-${mg.loc}-`, `-${S.famille === 'alcene' ? S.n - mg.loc : S.n + 1 - mg.loc}-`) : fin;
      ajouter(acide + pref(inv) + finInv);
    }
    gs.forEach((g, k) => {
      if (g.locs.length < 2) return;
      const sep = gs.slice(0, k).map(x => pref([x])).concat(g.locs.map(l => `${l}-${g.nom}`), gs.slice(k + 1).map(x => pref([x])));
      ajouter(acide + sep.join('-') + fin);
      ajouter(acide + gs.map(x => (x === g ? g.locs.join(',') + '-' + g.nom : pref([x]))).join('-') + fin);
      ajouter(acide + gs.map(x => (x === g ? g.locs.join('-') + '-' + O.MULT[g.locs.length] + g.nom : pref([x]))).join('-') + fin);
    });
    if (gs.length >= 2) ajouter(acide + pref(gs.slice().reverse()) + fin);
    if (gs.length) ajouter(acide + pref(gs) + '-' + fin);
    return [...out].map(([nom, diag]) => ({ nom, diag }));
  }

  /* ---------- Liaisons et doublets d'un atome (écritures de la remarque manuscrite du cours) ----------
     motif(el, liaisons [[angle, ordre]], doublets [angles], label) → SVG : l'atome, ses liaisons (vers rien)
     et ses doublets non liants (petits traits). Angles en degrés, 0 à droite, 90 en haut. */
  function motif(e, liaisons, doublets, label) {
    const R = Math.PI / 180, f = 20, r0 = 12, r1 = 34;
    let h = '';
    liaisons.forEach(([a, ord]) => {
      const c = Math.cos(a * R), s2 = -Math.sin(a * R), nx = -s2, ny = c;
      const off = ord === 1 ? [0] : ord === 2 ? [-3, 3] : [-4.5, 0, 4.5];
      off.forEach(d => { h += `<line x1="${(c * r0 + nx * d).toFixed(1)}" y1="${(s2 * r0 + ny * d).toFixed(1)}" x2="${(c * r1 + nx * d).toFixed(1)}" y2="${(s2 * r1 + ny * d).toFixed(1)}"/>`; });
    });
    doublets.forEach(a => {
      const c = Math.cos(a * R), s2 = -Math.sin(a * R), nx = -s2, ny = c, d = 13, l = 7;
      h += `<line class="nom-dl" x1="${(c * d + nx * l).toFixed(1)}" y1="${(s2 * d + ny * l).toFixed(1)}" x2="${(c * d - nx * l).toFixed(1)}" y2="${(s2 * d - ny * l).toFixed(1)}"/>`;
    });
    return `<svg class="nom-motif" viewBox="-40 -40 80 80" width="80" height="80" role="img" aria-label="${label}"><g>${h}</g><text x="0" y="${f * .36}" text-anchor="middle" font-size="${f}">${e}</text></svg>`;
  }

  /* ---------- Extrait de la classification (lignes 1 à 3, Br et I dans la colonne 17) ----------
     classif(zone, { surChoix(el, n) }) : l'élève touche un élément ; les cases se comptent jusqu'à la
     colonne des gaz nobles (dernière colonne) : ce nombre est le nombre de liaisons. */
  const LIGNES = [
    ['H', '', '', '', '', '', '', 'He'],
    ['Li', 'Be', 'B', 'C', 'N', 'O', 'F', 'Ne'],
    ['Na', 'Mg', 'Al', 'Si', 'P', 'S', 'Cl', 'Ar'],
    ['', '', '', '', '', '', 'Br', 'Kr'],
    ['', '', '', '', '', '', 'I', 'Xe'],
  ];
  const ACTIFS = ['H', 'C', 'N', 'O', 'F', 'Si', 'P', 'S', 'Cl', 'Br', 'I'];
  const GAZ = ['He', 'Ne', 'Ar', 'Kr', 'Xe'];
  const NOMS_EL = { H: 'hydrogène', C: 'carbone', N: 'azote', O: 'oxygène', F: 'fluor', Si: 'silicium', P: 'phosphore', S: 'soufre', Cl: 'chlore', Br: 'brome', I: 'iode',
    He: 'hélium', Ne: 'néon', Ar: 'argon', Kr: 'krypton', Xe: 'xénon' };
  function classif(zone, op) {
    op = op || {};
    const box = el('div', 'nom-classif-box');
    box.innerHTML = `<div class="nom-classif" role="group" aria-label="Extrait de la classification périodique">${LIGNES.map((l, r) => l.map((x, c) => {
      if (!x) return '<span class="nom-case vide"></span>';
      const actif = ACTIFS.includes(x), gaz = GAZ.includes(x);
      return `<button type="button" class="nom-case${gaz ? ' gaz' : ''}${actif ? '' : ' inactif'}" data-el="${x}" data-r="${r}" data-c="${c}"${actif ? '' : ' disabled'} aria-label="${NOMS_EL[x] || x}">${x}${gaz ? '<small>gaz noble</small>' : ''}</button>`;
    }).join('')).join('')}</div><p class="nom-classif-res" aria-live="polite"></p>`;
    zone.appendChild(box);
    const res = box.querySelector('.nom-classif-res');
    box.addEventListener('click', ev => {
      const b = ev.target.closest('.nom-case:not(.inactif)');
      if (!b) return;
      const r = +b.dataset.r, c = +b.dataset.c, x = b.dataset.el;
      box.querySelectorAll('.nom-case').forEach(k => { k.classList.remove('choisi', 'compte'); const t = k.querySelector('i'); if (t) t.remove(); });
      b.classList.add('choisi');
      // on compte les cases vers la droite jusqu'au gaz noble de la ligne
      let n = 0;
      box.querySelectorAll(`.nom-case[data-r="${r}"]`).forEach(k => {
        if (+k.dataset.c > c) { n++; k.classList.add('compte'); k.insertAdjacentHTML('beforeend', `<i class="nom-case-n">${n}</i>`); }
      });
      const gaz = LIGNES[r][7];
      const jusque = { He: 'à l\'hélium', Ne: 'au néon', Ar: 'à l\'argon', Kr: 'au krypton', Xe: 'au xénon' }[gaz];
      res.innerHTML = `${x} : ${n} case${n > 1 ? 's' : ''} jusqu'${jusque} (${gaz}), gaz noble : <b>${x} fait ${n} liaison${n > 1 ? 's' : ''}</b>.`;
      if (op.surChoix) op.surChoix(x, n);
    });
    return box;
  }

  /* Plusieurs outils à la suite dans une seule partie (exercices : dessiner, puis entourer, puis nommer le groupe) :
     enchainer(q, parties, correction) → partie 'perso' ; chaque étape réussie fait apparaître la suivante ;
     les erreurs comptent pour la partie ; « Voir la correction » montre toutes les étapes. */
  function enchainer(q, parties, correction) {
    return {
      type: 'perso', q, correction,
      monter(zone, api) {
        let k = 0, courant = null, fini = false;
        const ctxs = [];
        function suivante() {
          const p = parties[k];
          const d = el('div', 'nom-etape', `${p.q ? `<p class="ph-partie-q">${p.q}</p>` : ''}<div class="nom-etape-zone"></div><div class="nom-etape-retour"></div>`);
          zone.appendChild(d);
          const ret = d.querySelector('.nom-etape-retour');
          let finie = false;
          const sous = {
            fini: () => finie || fini || api.fini(),
            effacer() { if (!finie) { ret.innerHTML = ''; api.effacer(); } },
            message: h => { if (!finie) api.message(h); },
            compterErreur: () => api.compterErreur(),
            erreur: h => { if (!finie) api.erreur(h); },
            reussi(note) {
              finie = true; api.effacer();
              ret.innerHTML = `<p class="ph-ok">✓ ${note || 'Juste'}</p>${p.solution ? `<div class="nom-etape-sol">${p.solution}</div>` : ''}`;
              k++;
              if (k < parties.length) { suivante(); setTimeout(() => zone.lastElementChild.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 80); }
              else { fini = true; api.reussi(); }
            },
          };
          courant = { ctx: PARTIES[p.type](d.querySelector('.nom-etape-zone'), p, sous), fini: () => finie, montree: () => { finie = true; } };
          ctxs.push(courant);
        }
        suivante();
        return {
          montrer() {
            // l'étape en cours, puis les suivantes, réponses affichées
            fini = true;
            courant.montree(); courant.ctx.montrer();
            while (++k < parties.length) {
              const p = parties[k];
              const d = el('div', 'nom-etape', `${p.q ? `<p class="ph-partie-q">${p.q}</p>` : ''}<div class="nom-etape-zone"></div>`);
              zone.appendChild(d);
              const vide = { fini: () => true, effacer() {}, message() {}, compterErreur() {}, erreur() {}, reussi() {} };
              PARTIES[p.type](d.querySelector('.nom-etape-zone'), p, vide).montrer();
            }
          },
        };
      },
    };
  }

  /* ============================================================
     PLAN DE L'APPLICATION ET NAVIGATION (voir assets/sommaire.js)
     ============================================================ */
  const PLAN = [
    { n: 1, titre: 'Représenter les molécules', desc: 'Combien de liaisons ; formules développée, semi-développée et topologique ; passer de l\'une à l\'autre', fiche: 'fiche_1',
      sousModules: true,
      parties: [
        { nom: 'Combien de liaisons ?', slug: 'liaisons', cours: 'module_1a_cours', noms: { cours: 'Cours : combien de liaisons ?' } },
        { nom: 'Les trois écritures', slug: 'ecritures', cours: 'module_1b_cours', noms: { cours: 'Cours : les trois écritures' } },
        { nom: 'Passer d\'une écriture à l\'autre', slug: 'passer', cours: 'module_1c_cours', noms: { cours: 'Cours : passer d\'une écriture à l\'autre' } },
        { nom: 'Dessiner une molécule', simulation: 'module_1_dessin', noms: { simulation: 'Atelier : dessiner une molécule' } },
        { nom: 'Changer d\'écriture', simulation: 'module_1_conversion', noms: { simulation: 'Atelier : changer d\'écriture' } },
        { nom: 'Représenter les molécules', questions: 'module_1_questions' }] },
    { n: 2, titre: 'Nommer les alcanes', desc: 'Les dix alcanes linéaires, nommer un alcane ramifié et le dessiner à partir de son nom, alcanes cycliques', fiche: 'fiche_2',
      sousModules: true,
      parties: [
        { nom: 'Les alcanes à chaîne linéaire', slug: 'lineaires', cours: 'module_2a_cours', noms: { cours: 'Cours : les alcanes à chaîne linéaire' } },
        { nom: 'Nommer un alcane ramifié', slug: 'ramifie', cours: 'module_2b_cours', noms: { cours: 'Cours : nommer un alcane ramifié' } },
        { nom: 'Du nom à la formule', slug: 'formule', cours: 'module_2c_cours', noms: { cours: 'Cours : du nom à la formule' } },
        { nom: 'Les alcanes cycliques', slug: 'cycliques', cours: 'module_2d_cours', noms: { cours: 'Cours : les alcanes cycliques' } },
        { nom: 'Nommer un alcane', simulation: 'module_2_nommer', noms: { simulation: 'Atelier : nommer un alcane' } },
        { nom: 'Dessiner un alcane', simulation: 'module_2_dessiner', noms: { simulation: 'Atelier : dessiner un alcane' } },
        { nom: 'Nommer les alcanes', questions: 'module_2_questions' }] },
    { n: 3, titre: 'Les familles', desc: 'Entourer et nommer le groupe caractéristique, donner la famille, nommer et dessiner les molécules', fiche: 'fiche_3',
      sousModules: true,
      parties: [
        { nom: 'Alcènes, alcools, halogénoalcanes, amines', slug: 'familles', cours: 'module_3a_cours', noms: { cours: 'Cours : alcènes, alcools, halogénoalcanes, amines' } },
        { nom: 'Le groupe carbonyle', slug: 'carbonyle', cours: 'module_3b_cours', noms: { cours: 'Cours : le groupe carbonyle' } },
        { nom: 'Acides carboxyliques, esters, amides', slug: 'acides', cours: 'module_3c_cours', noms: { cours: 'Cours : acides carboxyliques, esters, amides' } },
        { nom: 'Nommer alcènes, alcools, halogénoalcanes, aldéhydes, cétones, acides', slug: 'nommer', cours: 'module_3d_cours', noms: { cours: 'Cours : nommer alcènes, alcools, aldéhydes, cétones, acides' } },
        { nom: 'Nommer les esters, amines et amides', slug: 'esters', cours: 'module_3e_cours', noms: { cours: 'Cours : nommer les esters, amines et amides' } },
        { nom: 'Entourer les groupes', simulation: 'module_3_entourer', noms: { simulation: 'Atelier : entourer les groupes' } },
        { nom: 'Nommer une molécule', simulation: 'module_3_nommer', noms: { simulation: 'Atelier : nommer une molécule' } },
        { nom: 'Dessiner à partir du nom', simulation: 'module_3_dessiner', noms: { simulation: 'Atelier : dessiner une molécule à partir de son nom' } },
        { nom: 'Les familles', questions: 'module_3_questions' }] },
    { n: 4, titre: 'Exercices', desc: 'Exercices 2 à 10 de la feuille, guidés pas à pas', exercices: 'module_4', exNom: 'Exercices 2 à 10', nbEx: 9 },
  ];
  window.SOM.init({ nom: 'Chapitre 2 : Nomenclature', id: 'nomenclature', cleEx: 'nomenclature-exercices', plan: PLAN });
  const menu = cle => window.SOM.menu(cle);
  const accueil = zone => window.SOM.accueil(zone);
  const marquer = info => window.SOM.marquer(info);

  window.NOM = Object.assign(window.NOM || {}, {
    MOINS, fmt, lire, el, secouer, melanger, hasard, entre, o, mol, dessin, PARTIES,
    question, serie, confettis, atelier, CLE_AIDES: 'nomenclature-aides',
    EC, video, molHTML, trois, partieNom, enchainer, motif, classif, NOMS_EL, diagBrute, partieBrute, nomsFaux, PLUSIEURS, partiesPlusieurs,
    PLAN, menu, accueil, marquer,
  });
})();
