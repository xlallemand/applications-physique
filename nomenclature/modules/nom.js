/* ============================================================
   Moteur de l'application « Nomenclature » (Terminale
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
   NOM.familles(cles, o)              familles et groupes caractéristiques côte à côte (cours 3a) ; o.exemples : un exemple dessiné (fiche)
   NOM.partieNom(smiles, o)           nommer avec l'outil ORGA (aides gardées dans « nomenclature-aides »)
   NOM.enchainer(q, parties, corr.)   plusieurs outils à la suite dans une seule partie (exercices)
   NOM.PLUSIEURS, NOM.partiesPlusieurs(x)   molécules à plusieurs groupes (ex. 5, sujets de bac) : entourer puis nommer
   NOM.nomsFaux(mol, op)              noms faux classiques [{ nom, diag, type }] (QCM « trouver l'erreur ») ; op.types
   NOM.aideTopo(mol, op)              aide pas à pas pour lire une topologique (C repérés, H de chaque C)
   NOM.partieBrute(mol, o)            formule brute à écrire (diagnostic : C, H implicites, autres atomes)
   NOM.motif(el, liaisons, doublets)  liaisons et doublets non liants d'un atome (SVG)
   NOM.classif(zone, o)               extrait de la classification : toucher un élément compte les cases jusqu'aux gaz nobles
   NOM.atelier(o)                     atelier « infini » : une tâche à la fois, au hasard ou dans l'ordre (faites gardées dans « nomenclature-ateliers »)
   NOM.aidesAtelier(cle, liste), NOM.aidesNommer(liste)   aides d'un atelier, réglées une à une
   NOM.reglagesAides(zone, aides, surChange)   une case à cocher par aide (carte « Réglages » de l'atelier)
   NOM.partieAutres(fabriquer, op)    partie à refaire avec une autre molécule (« À toi »)
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
     ATELIER « INFINI » : une seule tâche à la fois, tirée au hasard, sans numéro
     atelier({ zone, cle, items | tirer, id, tache, bilan, seuil, suivant, ordre, recommencer })
       items  : liste finie ; tirée au hasard sans refaire deux fois la même, remise à zéro
                quand toutes ont été faites ;
       ordre  : true : la liste dans l'ordre (on reprend à la première tâche pas encore faite) ;
                recommencer : texte du bouton après la dernière tâche (retour à la première) ;
       tirer  : () → élément au hasard (fabrique) ; id(élément) : pour ne pas refaire le même ;
       tache(élément) → { titre, enonce, parties }, construite avec les réglages du moment ;
       seuil  : tâches faites pour que l'atelier compte comme fait (page marquée faite, bilan affiché s'il y en a un) ;
                par défaut : toute la liste, ou 10 pour une fabrique ;
       suivant : texte du bouton (« Molécule suivante → »).
     Renvoie { refaire() (même élément, nouveaux réglages), nouvelle() (un autre élément) }.
     Gardé dans localStorage « nomenclature-ateliers » : { <cle>: { faits: [id], total }, 'aides:<cle>': { <aide>: booléen } }.
     ============================================================ */
  const CLE_ATELIERS = 'nomenclature-ateliers';
  const memoire = {};          // réglages gardés pendant la page si le stockage est indisponible
  function lireAteliers() { try { return JSON.parse(localStorage.getItem(CLE_ATELIERS)) || {}; } catch (e) { return {}; } }
  function ecrireAteliers(cle, v) {
    memoire[cle] = v;
    try { const r = lireAteliers(); r[cle] = v; localStorage.setItem(CLE_ATELIERS, JSON.stringify(r)); } catch (e) { /* stockage indisponible */ }
  }
  function etatAtelier(cle) {
    const r = lireAteliers();
    let x = r[cle] != null ? r[cle] : memoire[cle];
    if (Array.isArray(x)) x = { faits: [], total: x.length };       // ancienne forme : liste des tâches faites
    return Object.assign({ faits: [], total: 0 }, x);
  }
  /* Aides d'un atelier, réglées une à une (cases à cocher de la carte « Réglages ») :
     liste [[aide, texte]] ; renvoie { liste, active(aide) → booléen, regler(aide, booléen) }.
     aidesAtelier : dessin, conversion, entourer ; activées par défaut
     (ancienne forme gardée : un seul booléen pour toutes les aides). */
  function aidesAtelier(cle, liste) {
    const k = 'aides:' + cle;
    const lire = () => { const r = lireAteliers(); return r[k] != null ? r[k] : memoire[k]; };
    const active = a => { const v = lire(); return v == null ? true : typeof v === 'boolean' ? v : v[a] !== false; };
    return {
      liste, active,
      regler(a, on) {
        const v = {};
        liste.forEach(([x]) => { v[x] = active(x); });
        v[a] = !!on;
        ecrireAteliers(k, v);
      },
    };
  }
  // aides des outils « nommer » (couleurs, nom découpé, bulles), gardées dans « nomenclature-aides »
  // (les mêmes que le panneau « Aides » de l'outil dans les cours et les séries)
  const aidesNommer = liste => ({
    liste,
    active: a => !!O.lireAides('nomenclature-aides')[a],
    regler(a, on) { O.ecrireAides('nomenclature-aides', Object.assign(O.lireAides('nomenclature-aides'), { [a]: !!on })); },
  });
  // une case à cocher par aide ; surChange(aide, booléen) après chaque réglage
  function reglagesAides(zone, aides, surChange) {
    zone.innerHTML = `<span class="nom-reglages-t">Aides</span>${aides.liste.map(([a, t]) =>
      `<label class="nom-interr"><input type="checkbox" data-aide="${a}"${aides.active(a) ? ' checked' : ''}> ${t}</label>`).join('')}`;
    zone.addEventListener('change', ev => {
      const c = ev.target.closest('[data-aide]');
      if (!c) return;
      aides.regler(c.dataset.aide, c.checked);
      if (surChange) surChange(c.dataset.aide, c.checked);
    });
  }

  function atelier(opts) {
    const zone = opts.zone, bilan = opts.bilan, items = opts.items;
    const idDe = opts.id || (x => String(x));
    const seuil = opts.seuil || (items ? items.length : 10);
    let courant = null;
    function afficherBilan() {
      window.SOM.marquer({ fait: true });                        // atelier fait (sommaire, accueil)
      if (bilan) bilan.hidden = false;
    }
    // dans l'ordre : la tâche qui suit (au début : la première pas encore faite)
    function suivante() {
      if (courant != null) return items[(items.indexOf(courant) + 1) % items.length];
      const faits = new Set(etatAtelier(opts.cle).faits);
      return items.find(x => !faits.has(idDe(x))) || items[0];
    }
    // élément suivant, au hasard, jamais celui qu'on vient de faire ni un élément déjà fait
    function tirer() {
      if (opts.ordre) return suivante();
      const st = etatAtelier(opts.cle), faits = new Set(st.faits), idCour = courant == null ? null : idDe(courant);
      if (items) {
        let libres = items.filter(x => !faits.has(idDe(x)) && idDe(x) !== idCour);
        if (!libres.length) {
          // toutes faites : on recommence la liste
          ecrireAteliers(opts.cle, Object.assign(st, { faits: [] }));
          libres = items.filter(x => idDe(x) !== idCour);
          if (!libres.length) libres = items;
        }
        return hasard(libres);
      }
      let x = null;
      for (let k = 0; k < 40; k++) { x = opts.tirer(); if (x && !faits.has(idDe(x)) && idDe(x) !== idCour) break; }
      return x;
    }
    function rendre(defiler) {
      const t = opts.tache(courant), element = courant;
      zone.innerHTML = `<h3 class="er-titre nom-atelier-titre">${t.titre}</h3>
        ${t.enonce ? `<div class="ph-enonce" style="margin-top:12px">${t.enonce}</div>` : ''}<div data-a="parties"></div><div class="er-actions" data-a="suite"></div>`;
      if (defiler) zone.scrollIntoView({ behavior: 'smooth', block: 'start' });
      question(zone.querySelector('[data-a="parties"]'), t, {
        fin() {
          const st = etatAtelier(opts.cle), id = idDe(element);
          if (!st.faits.includes(id)) st.faits.push(id);
          if (!items && st.faits.length > 200) st.faits = st.faits.slice(-200);
          st.total++;
          ecrireAteliers(opts.cle, st);
          if (st.total >= seuil) afficherBilan();
          const s = zone.querySelector('[data-a="suite"]');
          const dernier = opts.ordre && items.indexOf(element) === items.length - 1;
          s.innerHTML = `<button type="button" class="${dernier ? 'btn-secondary' : 'btn-primary'}">${dernier ? opts.recommencer || '↺ Recommencer depuis le début' : opts.suivant || 'Molécule suivante →'}</button>`;
          s.querySelector('button').onclick = () => nouvelle(true);
          setTimeout(() => s.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 80);
        },
      }, 'cours');
    }
    function nouvelle(defiler) { courant = tirer(); rendre(defiler); }
    nouvelle(false);
    if (etatAtelier(opts.cle).total >= seuil) afficherBilan();
    return { refaire: () => rendre(false), nouvelle: () => nouvelle(false) };
  }

  /* ---------- Partie qu'on peut refaire avec une autre molécule (« À toi » des cours) ----------
     partieAutres(fabriquer, op) → partie 'perso' ; fabriquer() → { enonce, parties }, une autre molécule à chaque appel.
     La partie est réussie avec la première molécule ; « ↺ Recommencer avec une autre molécule » en propose ensuite une autre. */
  function partieAutres(fabriquer, op) {
    op = op || {};
    return {
      type: 'perso', q: op.q || '', solution: '',
      monter(zone, api) {
        let premiere = true;
        function lancer() {
          zone.innerHTML = '';
          const t = fabriquer();
          if (t.enonce) zone.appendChild(el('div', 'ph-enonce', t.enonce));
          const z = el('div');
          zone.appendChild(z);
          question(z, t, {
            fin() {
              if (premiere) { premiere = false; api.reussi(); }
              const a = el('div', 'er-actions nom-autre', '<button type="button" class="btn-secondary">↺ Recommencer avec une autre molécule</button>');
              zone.appendChild(a);
              a.querySelector('button').onclick = () => { lancer(); setTimeout(() => zone.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 60); };
            },
          }, 'cours');
        }
        lancer();
        // « Afficher la réponse » : la réponse de la molécule en cours
        return { montrer() { premiere = false; const b = zone.querySelector('.ph-partie-aide button'); if (b) b.click(); } };
      },
    };
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
    // ester : la chaîne de l'alkyle est numérotée aussi (à partir du C lié à l'O), dans sa couleur
    const alk = r && r.alkyle && op.numeros !== false ? [{ atomes: r.alkyle.chaine, classe: r.alkyle.classe }] : null;
    const d = O.dessinHTML(m, Object.assign({}, r && op.couleurs !== false ? { couleurs: r.couleurs, numeros: op.numeros === false ? null : r.numeros, autresNumeros: alk } : {}, autres));
    const nom = r ? O.nomHTML(r.parties) : op.nom || '';
    return `<div class="nom-mol">${op.titre ? `<div class="nom-mol-t">${op.titre}</div>` : ''}${d}${nom ? `<div class="nom-mol-n">${nom}</div>` : ''}${op.legende || ''}</div>`;
  }
  // la même molécule dans les trois écritures, côte à côte
  const trois = (s, op) => `<div class="nom-mols nom-mols-3">${['developpee', 'semi', 'topo'].map(ec => molHTML(s, Object.assign({ titre: EC[ec], ecriture: ec }, op))).join('')}</div>`;
  /* ---------- Familles et groupes caractéristiques côte à côte (présentation du cours 3a) ----------
     familles(cles, op) → HTML : une ligne par famille : la famille ; le groupe écrit et entouré, son nom, une précision.
     op.exemples : true : une colonne de plus, un exemple en topologique, groupe entouré, avec son nom (fiche).
     FAMILLES_TAB[cle] = [famille, groupe écrit, nom du groupe, précision, exemple (SMILES)] */
  const FAMILLES_TAB = {
    alcane: ['alcanes', '', 'aucun groupe', 'seulement des C et des H, liaisons simples', 'CCC(C)C'],
    alcene: ['alcènes', 'C=C', 'double liaison C=C', '', 'C=CCC(C)C'],
    alcool: ['alcools', '–OH', 'groupe hydroxyle', 'sur un C qui ne porte pas de =O', 'CC(C)(C)O'],
    halogeno: ['halogénoalcanes', '–X', 'groupe halogéno', 'X = F, Cl, Br ou I', 'CCC(C)CC(C)Br'],
    amine: ['amines', '–N', 'groupe amine', 'N lié seulement à des C (et à des H), sans C=O', 'CCCCCN'],
    aldehyde: ['aldéhydes', 'C=O', 'groupe carbonyle', 'C=O en bout de chaîne (le C porte un H)', 'CC=O'],
    cetone: ['cétones', 'C=O', 'groupe carbonyle', 'C=O entre deux C', 'CCCC(C)=O'],
    acide: ['acides carboxyliques', '–COOH', 'groupe carboxyle', 'le C=O et un OH sur le même C', 'CC(C)CC(=O)O'],
    ester: ['esters', '–COO–C', 'groupe ester', 'le C=O et un O lié à un autre C, sur le même C', 'CCCCOC(C)=O'],
    amide: ['amides', '–CO–N', 'groupe amide', 'le C=O et un N sur le même C', 'CCCC(N)=O'],
  };
  // exemple d'une famille : topologique, groupe entouré, nom en couleurs
  function exempleFamille(s) {
    const m = mol(s), r = O.nommer(m);
    return `${O.dessinHTML(m, { ecriture: 'topo', couleurs: r.couleurs, entourer: O.groupes(m).map(g => ({ atomes: g.atomes, avecH: g.avecH })) })}<div class="nom-mol-n">${O.nomHTML(r.parties)}</div>`;
  }
  function familles(cles, op) {
    const ex = op && op.exemples;
    return `<div class="nom-familles${ex ? ' nom-familles-ex' : ''}">
      <div class="nom-fam-tete"><span>Famille</span><span>Groupe caractéristique</span>${ex ? '<span>Exemple</span>' : ''}</div>
      ${cles.map(k => {
        const [f, x, g, note, s] = FAMILLES_TAB[k];
        return `<div class="nom-fam"><span class="nom-fam-f">${f}</span><span class="nom-fam-g">${x ? `<span class="nom-fam-x">${x}</span>` : ''}<span class="nom-fam-n"><b>${g}</b>${note ? `<small>${note}</small>` : ''}</span></span>${ex ? `<span class="nom-fam-ex">${exempleFamille(s)}</span>` : ''}</div>`;
      }).join('')}
    </div>`;
  }
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
     nomsFaux(m, op) → [{ nom, diag, type }] : chaîne trop courte (1-méthyl…, 2-éthyl…), numérotation inversée,
     di oublié, ramifications identiques séparées, ordre alphabétique, tirets et virgules ;
     chaque nom faux avec le diagnostic de ORGA.diagnostiquerNom.
     op.types : seulement ces erreurs : 'chaine', 'numeros' (numérotation), 'multi' (di, tri…), 'alpha', 'format'. */
  function nomsFaux(m0, op) {
    const types = op && op.types ? new Set(op.types) : null;
    const m = mol(m0), r = O.nommer(m), S = r.struct, out = new Map();
    const ajouter = (n, type) => {
      if ((types && !types.has(type)) || !n || n === r.nom || out.has(n)) return;
      const d = O.diagnostiquerNom(n, r);
      if (!d.ok) out.set(n, { diag: d.diag, type });
    };
    const fin = r.nom.slice(r.nom.lastIndexOf(r.parties.filter(p => p[1] === 'chaine')[0][0]));
    const acide = S.acide ? 'acide ' : '';
    const pref = (gs, ecr) => gs.map(g => (ecr !== false ? g.locs.join(',') + '-' : '') + O.MULT[g.locs.length] + g.nom).join('-');
    // chaîne trop courte : le nom qu'on obtiendrait avec une autre chaîne
    r.chaines.tous.filter(c => c.chaine.length < r.n && !c.subs.some(x => x.complexe)).slice(0, 6).forEach(c => {
      const r2 = O.nommer(m, { chaine: c.chaine });
      if (!r2.horsProgramme) ajouter(r2.nom, 'chaine');
    });
    const gs = S.prefixes;
    if (gs.length && !S.cyclo && !['aldehyde', 'acide', 'ester', 'amide'].includes(S.famille)) {
      const inv = gs.map(g => ({ nom: g.nom, locs: g.locs.map(l => (l === 'N' ? l : S.n + 1 - l)).sort((a, b) => a - b) }));
      // numérotation par l'autre bout (le numéro du groupe aussi)
      const mg = r.morceaux.find(x => x.type === 'groupe');
      const finInv = S.gEcrit && mg ? fin.replace(`-${mg.loc}-`, `-${S.famille === 'alcene' ? S.n - mg.loc : S.n + 1 - mg.loc}-`) : fin;
      ajouter(acide + pref(inv) + finInv, 'numeros');
    }
    gs.forEach((g, k) => {
      if (g.locs.length < 2) return;
      const sep = gs.slice(0, k).map(x => pref([x])).concat(g.locs.map(l => `${l}-${g.nom}`), gs.slice(k + 1).map(x => pref([x])));
      ajouter(acide + sep.join('-') + fin, 'multi');                                                        // 2-méthyl-3-méthyl…
      ajouter(acide + gs.map(x => (x === g ? g.locs.join(',') + '-' + g.nom : pref([x]))).join('-') + fin, 'multi');      // 2,3-méthyl…
      ajouter(acide + gs.map(x => (x === g ? g.locs.slice(0, -1).join(',') + '-' + O.MULT[g.locs.length] + g.nom : pref([x]))).join('-') + fin, 'multi');   // 2-diméthyl, 2,4-triméthyl…
      ajouter(acide + gs.map(x => (x === g ? g.locs.join('-') + '-' + O.MULT[g.locs.length] + g.nom : pref([x]))).join('-') + fin, 'format');
    });
    if (gs.length >= 2) ajouter(acide + pref(gs.slice().reverse()) + fin, 'alpha');
    if (gs.length) ajouter(acide + pref(gs) + '-' + fin, 'format');
    return [...out].map(([nom, x]) => ({ nom, diag: x.diag, type: x.type }));
  }

  /* ---------- Aide pas à pas pour lire une formule topologique ----------
     aideTopo(m, op) → HTML : le dessin avec un point et une étiquette (C1, C2…) sur chaque sommet et chaque
     bout de trait, puis la méthode : 1. compter les C ; 2. les H de chaque C (4 − nombre de traits) ;
     3. les autres atomes, écrits avec leurs H. op.seulementC : la première étape seulement. */
  function aideTopo(m0, op) {
    op = op || {};
    const m = mol(m0), sc = O.scene(m, 'topo', { echelle: { x: 60, y: 60 } });
    // les C de gauche à droite (puis de haut en bas)
    const Cs = m.atomes.map((a, i) => i).filter(i => m.atomes[i].el === 'C').sort((a, b) => sc.px[a].x - sc.px[b].x || sc.px[a].y - sc.px[b].y);
    const nomC = i => 'C' + (Cs.indexOf(i) + 1);
    const dessinAide = O.dessinHTML(m, { ecriture: 'topo', echelle: { x: 60, y: 60 }, police: 18, marques: Cs, annotations: Cs.map(i => ({ i, t: nomC(i) })), label: 'Formule topologique : chaque C est repéré par un point' });
    const lignesH = Cs.map(i => {
      const nv = O.adjacence(m)[i].length, traits = O.somme(m, i), h = O.nbH(m, i), dbl = traits > nv;
      const quoi = nv === 1 ? 'bout de trait' : 'sommet';
      return `<li><b>${nomC(i)}</b> (${quoi}) : ${traits} trait${traits > 1 ? 's' : ''}${dbl ? ' (une double liaison compte pour 2)' : ''} → 4 − ${traits} = <b>${h} H</b></li>`;
    }).join('');
    const autres = m.atomes.map((a, i) => i).filter(i => m.atomes[i].el !== 'C');
    const txtAutres = autres.length ? autres.map(i => { const h = O.nbH(m, i); return `<b>${O.etiquetteH(m.atomes[i].el, h, true)}</b> : 1 ${m.atomes[i].el}${h ? ` et ${h} H` : ''}`; }).join(' ; ') : 'aucun';
    return `<div class="nom-aide"><p class="nom-aide-t">Aide pas à pas</p>
      <div class="nom-fig">${dessinAide}</div>
      <ol class="nom-aide-etapes">
        <li><b>Compte les C.</b> Chaque sommet et chaque <b>bout de trait</b> est un atome de carbone : ils sont repérés par un point (C1, C2…).</li>
        ${op.seulementC ? '' : `<li><b>Compte les H des C</b> (on ne les voit pas) : chaque C fait 4 liaisons, ses H complètent : <b>4 − nombre de traits</b>.<ul>${lignesH}</ul>Additionne-les.</li>
        <li><b>Compte les autres atomes</b>, écrits avec leurs H : ${txtAutres}.</li>`}
      </ol></div>`;
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
        { nom: 'Prise en main de l\'outil de dessin', simulation: 'module_1_dessin', noms: { simulation: 'Atelier : prise en main de l\'outil de dessin des molécules' } },
        { nom: 'Dessin libre', simulation: 'module_1_libre', noms: { simulation: 'Atelier : dessin libre de molécules' } },
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
        { nom: 'Nommer alcènes, alcools, halogénoalcanes, aldéhydes, cétones, acides carboxyliques', slug: 'nommer', cours: 'module_3d_cours', noms: { cours: 'Cours : nommer alcènes, alcools, aldéhydes, cétones, acides carboxyliques' } },
        { nom: 'Nommer les esters, amines et amides', slug: 'esters', cours: 'module_3e_cours', noms: { cours: 'Cours : nommer les esters, amines et amides' } },
        { nom: 'Entourer les groupes', simulation: 'module_3_entourer', noms: { simulation: 'Atelier : entourer les groupes' } },
        { nom: 'Nommer une molécule', simulation: 'module_3_nommer', noms: { simulation: 'Atelier : nommer une molécule' } },
        { nom: 'Dessiner à partir du nom', simulation: 'module_3_dessiner', noms: { simulation: 'Atelier : dessiner une molécule à partir de son nom' } },
        { nom: 'Les familles', questions: 'module_3_questions' }] },
    { n: 4, titre: 'Exercices', desc: 'Exercices 2 à 10 de la feuille, guidés pas à pas', exercices: 'module_4', exNom: 'Exercices 2 à 10', nbEx: 9 },
  ];
  window.SOM.init({ nom: 'Nomenclature', id: 'nomenclature', cleEx: 'nomenclature-exercices', plan: PLAN });
  const menu = cle => window.SOM.menu(cle);
  const accueil = zone => window.SOM.accueil(zone);
  const marquer = info => window.SOM.marquer(info);

  window.NOM = Object.assign(window.NOM || {}, {
    MOINS, fmt, lire, el, secouer, melanger, hasard, entre, o, mol, dessin, PARTIES,
    question, serie, confettis, atelier, aidesAtelier, aidesNommer, reglagesAides, partieAutres, CLE_AIDES: 'nomenclature-aides',
    EC, video, molHTML, trois, familles, partieNom, enchainer, motif, classif, NOMS_EL, diagBrute, partieBrute, nomsFaux, aideTopo, PLUSIEURS, partiesPlusieurs,
    PLAN, menu, accueil, marquer,
  });
})();
