/* ============================================================
   Moteur de l'application « Rappels de 1ère STI2D » (chimie,
   Terminale STI2D ; même moteur de questions que « Chapitre 13 :
   Énergie nucléaire » ; navigation commune assets/sommaire.js, cours
   avec assets/cours.js)

   RP.o, RP.fq.choix                 fabriques d'options et de parties de question
   RP.PARTIES                        parties de question : 'choix', 'perso' (p.monter(zone, api) → { montrer() })
   RP.question(zone, q, cb, mode)    question en plusieurs parties (série, exercice)
   RP.serie(opts)                    série de questions notée sur 20

   Groupes caractéristiques :
     RP.MOL                          molécules (formule semi-développée décrite par sa chaîne)
     RP.formule(m, o)                formule semi-développée (HTML) ; o.entoure : groupes entourés et numérotés
     RP.groupes(m)                   groupes caractéristiques : [{ type: 'hydroxyle' | 'carboxyle', pieces, n }]
     RP.famille(m)                   famille d'une molécule qui n'a qu'une sorte de groupe
     RP.partieEntourer(m, o)         outil : toucher les atomes à entourer, puis Valider (partie 'perso')
     RP.partiesNommer(m)             nommer chaque sorte de groupe entouré et sa famille (parties 'choix')
     RP.legende(m)                   groupes entourés, numérotés, avec leur nom et leur famille (HTML)
   Pictogrammes de sécurité (images communes assets/pictogrammes/) :
     RP.PICTOS, RP.picto(id, o)      les neuf pictogrammes : nom, dessin, danger, précautions ; image (HTML)
     RP.partieSens, partieImage, partiePrecaution
                                     questions sur un pictogramme : signification, image, précaution
   RP.menu(cle), RP.accueil(zone)    navigation commune (SOM) avec le plan de l'application

   Une molécule : { nom, chaine: [élément] } ; un élément de la chaîne
   (de gauche à droite) : { t: 'H3C' | 'CH2' | 'CH' | 'C' | 'OH' | 'HO' | 'H',
   haut: { t, double }, bas: { t, double } } (atome lié au-dessus ou
   au-dessous, double : double liaison). Les chiffres de t sont écrits
   en indice.

   Les styles des cartes, boutons et écrans de fin viennent de
   equilibrer-reactions/modules/er.css (même présentation).
   ============================================================ */
(function () {
  'use strict';

  // nombre écrit à la française (note sur 20)
  const fmt = v => String(Math.round(v * 100) / 100).replace('.', ',');

  // fabriques de parties de question (cours, séries, exercices)
  const o = (id, label) => ({ id, label });
  const fq = {
    choix: (q, options, bonne, opts) => Object.assign({ type: 'choix', q, options, bonne, colonne: options.some(x => x.label.replace(/<[^>]+>/g, '').length > 24) }, opts),
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

  /* ============================================================
     PARTIES DE QUESTION
     Chaque partie reçoit (zone, p, api) et renvoie { montrer() }.
     api.reussi() · api.erreur(indice) · api.effacer() · api.message(h) · api.fini()
     ============================================================ */

  // Choix parmi des boutons : p.options [{ id, label }], p.bonne, p.indice ou p.indices[id], p.colonne, p.images (options en images)
  function pChoix(zone, p, api) {
    const box = el('div', 'ph-choix' + (p.colonne ? ' ph-choix-col' : '') + (p.images ? ' rp-choix-images' : ''));
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
      return { b, x };
    });
    return { montrer() { bs.forEach(({ b, x }) => { b.disabled = true; if (x.id === p.bonne) b.classList.add('juste'); }); } };
  }

  // Outil propre à l'application : p.monter(zone, api) → { montrer() }
  function pPerso(zone, p, api) {
    const ctx = p.monter(zone, api) || {};
    return { montrer() { if (ctx.montrer) ctx.montrer(); } };
  }

  const PARTIES = { choix: pChoix, perso: pPerso };

  /* ============================================================
     UNE QUESTION : parties successives
     q = { parties: [p] } ; p = { type, q (texte), solution (HTML affiché après), … }
     mode : 'serie'    bouton « Afficher la réponse » (0 point pour la question)
            'exercice' bouton « Voir la correction » toujours disponible
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
      window.RP.partieEnCours = p;          // partie en cours (utile pour vérifier l'application)
      const d = el('div', 'ph-partie', `${p.q ? `<div class="ph-partie-q">${p.q}</div>` : ''}<div class="ph-partie-zone"></div><div class="ph-partie-retour"></div>
        <div class="ph-partie-aide"><button type="button" class="btn-small">${libAide}</button></div>`);
      zone.appendChild(d);
      const ret = d.querySelector('.ph-partie-retour'), aide = d.querySelector('.ph-partie-aide'), bRep = aide.querySelector('button');
      let finie = false, erreursIci = 0;
      const api = {
        fini: () => finie || etat.fini,
        effacer() { if (!finie) ret.innerHTML = ''; },
        message(h) { if (!finie) ret.innerHTML = `<p class="ph-msg">${h}</p>`; },
        compterErreur() { etat.erreurs++; erreursIci++; },
        erreur(h) {
          api.compterErreur();
          ret.innerHTML = `<div class="callout-danger er-retour"><p><b class="er-ko">Ce n'est pas ça.</b> ${h || ''}</p>${erreursIci >= 2 ? `<p class="er-petit">Corrige ta réponse, ou ${mode === 'exercice' ? 'regarde la correction' : 'affiche la réponse'} (0 point pour cette ${mode === 'exercice' ? 'partie' : 'question'}).</p>` : ''}</div>`;
        },
        reussi() { terminer(false); },
      };
      const ctx = PARTIES[p.type](d.querySelector('.ph-partie-zone'), p, api);
      bRep.onclick = () => { if (finie) return; ctx.montrer(); etat.vue = true; terminer(true); };
      function terminer(vue) {
        finie = true;
        aide.remove();
        etat.details.push({ vue, erreurs: erreursIci });
        const titre = vue ? (mode === 'exercice' ? 'Correction' : 'Réponse') : (erreursIci ? 'C\'est juste.' : 'Juste !');
        const sol = p.solution || p.correction;
        ret.innerHTML = sol || vue
          ? `<div class="${vue ? 'callout' : 'callout-success'} er-retour ph-solution"><p><b class="${vue ? '' : 'er-ok'}">${titre}</b></p>${sol ? `<div>${sol}</div>` : ''}</div>`
          : '<p class="ph-ok">✓ Juste</p>';
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
     q = { theme, consigne, enonce, parties, bilan }
     ============================================================ */
  function serie(opts) {
    const app = opts.app;
    let qs = [], idx = 0, score = 0, recap = [];
    const pts = v => `${v} pt${v > 1 ? 's' : ''}`;

    function intro() {
      app.innerHTML = `<div class="er-card"><span class="er-badge">${opts.badge}</span><h2 class="er-titre">${opts.titre}</h2>${opts.intro || ''}
        <div class="cle" style="margin:14px 0"><p><b class="cle-titre">Barème</b> · 10 questions, notées sur 20 :</p>
          <ul class="er-liste"><li><b>2 points</b> si tout est juste du premier coup ;</li><li><b>1 point</b> si tu y arrives après au moins une erreur ;</li><li><b>0 point</b> si tu affiches la réponse.</li></ul></div>
        <button type="button" class="btn-primary" data-a="go">Commencer →</button></div>`;
      app.querySelector('[data-a="go"]').onclick = demarrer;
      window.scrollTo(0, 0);
    }
    function demarrer() { qs = opts.questions(); idx = 0; score = 0; recap = []; afficher(); }

    function afficher() {
      if (idx >= qs.length) return fin();
      const q = qs[idx];
      window.RP.questionEnCours = q;          // question en cours (utile pour vérifier l'application)
      app.innerHTML = `<div class="er-card"><span class="er-badge">${opts.badge}</span><h2 class="er-titre">${opts.titre}</h2>
          <p class="er-meta">Question ${idx + 1}/${qs.length} · Score : <b data-a="score">${pts(score)}</b></p>
          <div class="progress-bar"><div class="progress-fill" style="width:${Math.round(idx / qs.length * 100)}%"></div></div></div>
        <div class="er-card ph-question">
          ${q.theme ? `<p class="er-q-nom">${q.theme}</p>` : ''}
          ${q.consigne ? `<div class="er-consigne">${q.consigne}</div>` : ''}
          ${q.enonce ? `<div class="ph-enonce">${q.enonce}</div>` : ''}
          <div data-a="parties"></div>
          <div data-a="retour"></div>
          <div class="er-actions" data-a="suite"></div>
        </div>`;
      window.scrollTo(0, 0);
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
     GROUPES CARACTÉRISTIQUES
     ============================================================ */
  const ecrire = t => t.replace(/(\d+)/g, '<sub>$1</sub>');          // CH2 → CH₂
  const texte = t => t.replace(/<[^>]+>/g, '');
  const estOH = t => t === 'OH' || t === 'HO';
  const NOMS = {
    hydroxyle: { groupe: 'groupe hydroxyle', famille: 'famille des alcools', court: 'alcool', formule: '−OH' },
    carboxyle: { groupe: 'groupe carboxyle', famille: 'famille des acides carboxyliques', court: 'acide carboxylique', formule: '−COOH' },
  };
  const O2 = { t: 'O', double: true };
  const MOL = {
    // molécules des exemples de la fiche
    diol23: { nom: 'butane-2,3-diol', chaine: [{ t: 'H3C' }, { t: 'CH', haut: { t: 'OH' } }, { t: 'CH', bas: { t: 'OH' } }, { t: 'CH3' }] },
    hydroxy3: { nom: 'acide 3-hydroxybutanoïque', chaine: [{ t: 'H3C' }, { t: 'CH', haut: { t: 'OH' } }, { t: 'CH2' }, { t: 'C', haut: O2 }, { t: 'OH' }] },
    ethanoiqueBas: { nom: 'acide éthanoïque', chaine: [{ t: 'H3C' }, { t: 'C', bas: O2 }, { t: 'OH' }] },
    hydroxy4: { nom: 'acide 4-hydroxybutanoïque', chaine: [{ t: 'HO' }, { t: 'C', haut: O2 }, { t: 'CH2' }, { t: 'CH2' }, { t: 'CH2' }, { t: 'OH' }] },
    // propylène glycol (sujet de bac du chapitre 14)
    glycol: { nom: 'propylène glycol', chaine: [{ t: 'CH2', haut: { t: 'OH' } }, { t: 'CH', haut: { t: 'OH' } }, { t: 'CH3' }] },
    // autres molécules des cours et des séries
    methanol: { nom: 'méthanol', chaine: [{ t: 'H3C' }, { t: 'OH' }] },
    ethanol: { nom: 'éthanol', chaine: [{ t: 'H3C' }, { t: 'CH2' }, { t: 'OH' }] },
    propan1ol: { nom: 'propan-1-ol', chaine: [{ t: 'H3C' }, { t: 'CH2' }, { t: 'CH2' }, { t: 'OH' }] },
    propan2ol: { nom: 'propan-2-ol', chaine: [{ t: 'H3C' }, { t: 'CH', haut: { t: 'OH' } }, { t: 'CH3' }] },
    butan2ol: { nom: 'butan-2-ol', chaine: [{ t: 'H3C' }, { t: 'CH', bas: { t: 'OH' } }, { t: 'CH2' }, { t: 'CH3' }] },
    ethanediol: { nom: 'éthane-1,2-diol', chaine: [{ t: 'HO' }, { t: 'CH2' }, { t: 'CH2' }, { t: 'OH' }] },
    glycerol: { nom: 'glycérol', chaine: [{ t: 'HO' }, { t: 'CH2' }, { t: 'CH', haut: { t: 'OH' } }, { t: 'CH2' }, { t: 'OH' }] },
    methanoique: { nom: 'acide méthanoïque', chaine: [{ t: 'H' }, { t: 'C', haut: O2 }, { t: 'OH' }] },
    ethanoique: { nom: 'acide éthanoïque', chaine: [{ t: 'H3C' }, { t: 'C', haut: O2 }, { t: 'OH' }] },
    propanoique: { nom: 'acide propanoïque', chaine: [{ t: 'H3C' }, { t: 'CH2' }, { t: 'C', bas: O2 }, { t: 'OH' }] },
    butanoique: { nom: 'acide butanoïque', chaine: [{ t: 'H3C' }, { t: 'CH2' }, { t: 'CH2' }, { t: 'C', haut: O2 }, { t: 'OH' }] },
    lactique: { nom: 'acide lactique', chaine: [{ t: 'H3C' }, { t: 'CH', haut: { t: 'OH' } }, { t: 'C', haut: O2 }, { t: 'OH' }] },
    glycolique: { nom: 'acide glycolique', chaine: [{ t: 'HO' }, { t: 'CH2' }, { t: 'C', haut: O2 }, { t: 'OH' }] },
    propane: { nom: 'propane', chaine: [{ t: 'H3C' }, { t: 'CH2' }, { t: 'CH3' }] },
    // le groupe carboxyle seul (tableau des groupes) : le premier élément vide laisse la liaison —C
    carboxyle: { nom: 'groupe carboxyle', chaine: [{ t: '' }, { t: 'C', haut: O2 }, { t: 'OH' }] },
    butane: { nom: 'butane', chaine: [{ t: 'H3C' }, { t: 'CH2' }, { t: 'CH2' }, { t: 'CH3' }] },
  };

  // toutes les pièces (atomes ou groupes d'atomes écrits) : id 'k' dans la chaîne, 'k:h' et 'k:b' au-dessus, au-dessous
  function pieces(m) {
    const l = [];
    m.chaine.forEach((it, k) => {
      if (it.haut) l.push({ id: k + ':h', t: it.haut.t, k });
      if (it.t) l.push({ id: String(k), t: it.t, k });
      if (it.bas) l.push({ id: k + ':b', t: it.bas.t, k });
    });
    return l;
  }
  // groupes caractéristiques, de gauche à droite, numérotés : un carbone qui porte =O et un OH → carboxyle ; les autres OH → hydroxyle
  function groupes(m) {
    const g = [], pris = new Set();
    m.chaine.forEach((it, k) => {
      ['haut', 'bas'].forEach(cote => {
        const s = it[cote];
        if (!s || s.t !== 'O' || !s.double) return;
        const autre = it[cote === 'haut' ? 'bas' : 'haut'];
        let oh = null;
        if (autre && estOH(autre.t)) oh = k + ':' + (cote === 'haut' ? 'b' : 'h');
        else if (m.chaine[k + 1] && estOH(m.chaine[k + 1].t)) oh = String(k + 1);
        else if (m.chaine[k - 1] && estOH(m.chaine[k - 1].t)) oh = String(k - 1);
        if (!oh) return;
        const p = [String(k), k + ':' + cote[0], oh];
        p.forEach(x => pris.add(x));
        g.push({ type: 'carboxyle', pieces: p, k: Math.min(k, parseInt(oh, 10)) });
      });
    });
    pieces(m).forEach(pc => { if (estOH(pc.t) && !pris.has(pc.id)) g.push({ type: 'hydroxyle', pieces: [pc.id], k: pc.k }); });
    g.sort((a, b) => a.k - b.k);
    g.forEach((x, i) => { x.n = i + 1; });
    return g;
  }
  // famille d'une molécule qui n'a qu'une sorte de groupe (null sinon)
  function famille(m) {
    const t = Array.from(new Set(groupes(m).map(x => x.type)));
    return t.length === 1 ? t[0] : t.length ? null : 'aucune';
  }

  /* Formule semi-développée : une grille, une colonne par atome et par liaison de la chaîne ;
     les atomes liés au-dessus ou au-dessous ont leur ligne. o.boutons : atomes en boutons
     (outil « entourer ») ; o.entoure : groupes entourés et numérotés (dessinés une fois la
     formule dans la page, voir cercles()). */
  function formule(m, o) {
    o = o || {};
    const haut = m.chaine.some(x => x.haut), bas = m.chaine.some(x => x.bas);
    const r0 = haut ? 2 : 0;                                        // ligne de la chaîne (1 et 2 : au-dessus)
    const cell = (r, c, h, cls, sous) => `<span class="${cls}"${sous || ''} style="grid-row:${r};grid-column:${c}">${h}</span>`;
    // texte de l'atome : dans un span, pour que les indices restent à leur place (le bouton est une boîte flexible) ;
    // ancre : dans un atome qui porte un substituant, le C est repéré (.rp-c) : aligner() y place la liaison verticale
    function etiquette(t, ancre) {
      const i = t.indexOf('C');
      if (!ancre || i < 0) return `<span class="rp-txt">${ecrire(t)}</span>`;
      return `<span class="rp-txt">${ecrire(t.slice(0, i))}<span class="rp-c">C</span>${ecrire(t.slice(i + 1))}</span>`;
    }
    const atome = (id, t, r, c, ancre, sous) => (!t ? `<span class="rp-vide" style="grid-row:${r};grid-column:${c}"></span>` : o.boutons
      ? `<button type="button" class="rp-at" data-p="${id}"${sous} style="grid-row:${r};grid-column:${c}" aria-label="${texte(t)}" aria-pressed="false">${etiquette(t, ancre)}</button>`
      : `<span class="rp-at" data-p="${id}"${sous} style="grid-row:${r};grid-column:${c}">${etiquette(t, ancre)}</span>`);
    let h = '';
    m.chaine.forEach((it, k) => {
      const c = 2 * k + 1, sous = ` data-sous="${k}"`;          // liaison et atome portés par l'élément k de la chaîne
      h += atome(String(k), it.t, r0 + 1, c, !!(it.haut || it.bas), '');
      if (k < m.chaine.length - 1) h += cell(r0 + 1, c + 1, '', 'rp-lh');
      if (it.haut) { h += atome(k + ':h', it.haut.t, 1, c, false, sous); h += cell(2, c, '', 'rp-lv' + (it.haut.double ? ' double' : ''), sous); }
      if (it.bas) { h += cell(r0 + 2, c, '', 'rp-lv' + (it.bas.double ? ' double' : ''), sous); h += atome(k + ':b', it.bas.t, r0 + 3, c, false, sous); }
    });
    // (outil « entourer » : sans le nom de la molécule, qui donnerait sa famille)
    const desc = `Formule semi-développée${m.nom && !o.boutons ? ' : ' + m.nom : ''}`;
    return `<div class="rp-defile"><div class="rp-mol${o.boutons ? ' rp-mol-outil' : ''}"${o.entoure ? ` data-entoure="${m.cle || ''}"` : ''} role="${o.boutons ? 'group' : 'img'}" aria-label="${desc}">${h}</div></div>`;
  }

  /* Place la liaison verticale et l'atome lié au-dessus (au-dessous) juste sur le C de l'atome qui les porte
     (« CH », « CH2 » : le C n'est pas au milieu du texte). Le texte garde son espacement ; on mesure l'écart
     entre le milieu du C et le milieu de la colonne, et on décale d'autant la liaison et l'atome lié. */
  function aligner(grille) {
    grille.querySelectorAll('.rp-c').forEach(cs => {
      const at = cs.closest('.rp-at'), r = at.getBoundingClientRect(), c = cs.getBoundingClientRect();
      if (!r.width) return;
      const dx = Math.round(((c.left + c.width / 2) - (r.left + r.width / 2)) * 10) / 10;
      grille.querySelectorAll(`[data-sous="${at.dataset.p}"]`).forEach(e => { e.style.transform = dx ? `translateX(${dx}px)` : ''; });
    });
  }
  // cercle autour d'un groupe (union des rectangles de ses pièces) ; numero : pastille du numéro (rien : cercle provisoire)
  function cercle(grille, g, numero) {
    const g0 = grille.getBoundingClientRect();
    if (!g0.width) return;
    const rs = g.pieces.map(id => grille.querySelector(`[data-p="${id}"]`).getBoundingClientRect());
    const x0 = Math.min(...rs.map(r => r.left)), x1 = Math.max(...rs.map(r => r.right));
    const y0 = Math.min(...rs.map(r => r.top)), y1 = Math.max(...rs.map(r => r.bottom));
    const c = el('span', 'rp-cercle' + (g.pieces.length > 1 ? ' large' : '') + (numero ? '' : ' provisoire'), numero ? `<i>${numero}</i>` : '');
    c.setAttribute('aria-hidden', 'true');
    Object.assign(c.style, { left: (x0 - g0.left - 3) + 'px', top: (y0 - g0.top - 3) + 'px', width: (x1 - x0 + 6) + 'px', height: (y1 - y0 + 6) + 'px' });
    grille.appendChild(c);
  }
  // entoure les groupes dans une formule déjà affichée ; redessiné si la taille change
  function cercles(grille, gs) {
    const tracer = () => {
      aligner(grille);
      grille.querySelectorAll('.rp-cercle').forEach(x => x.remove());
      gs.forEach(g => cercle(grille, g, g.n));
    };
    tracer();
    if (window.ResizeObserver && !grille.dataset.observe) { grille.dataset.observe = '1'; new ResizeObserver(tracer).observe(grille); }
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(tracer);
  }
  // formules arrivées dans la page : liaisons verticales alignées sur le C (aussi quand la taille change ou que
  // la police est chargée) ; formules écrites avec o.entoure : leurs groupes sont entourés
  function chercherFormules(racine) {
    if (!racine || !racine.querySelectorAll) return;
    const l = racine.matches && racine.matches('.rp-mol') ? [racine] : [];
    racine.querySelectorAll('.rp-mol').forEach(x => l.push(x));
    l.forEach(x => {
      if (x.dataset.vu) return;
      x.dataset.vu = '1';
      if (x.dataset.entoure && MOL[x.dataset.entoure]) { cercles(x, groupes(MOL[x.dataset.entoure])); return; }   // (cercles() aligne aussi)
      aligner(x);
      if (window.ResizeObserver) new ResizeObserver(() => aligner(x)).observe(x);
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => aligner(x));
    });
  }
  new MutationObserver(ms => ms.forEach(mu => mu.addedNodes.forEach(nd => chercherFormules(nd)))).observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener('DOMContentLoaded', () => chercherFormules(document.body));

  // « le propane », « l'éthanol », « l'acide lactique » (maj : majuscule au début)
  function leNom(m, maj) {
    const t = (/^[aeéèiouyh]/i.test(m.nom) ? 'l\'' : 'le ') + m.nom;
    return maj ? t.charAt(0).toUpperCase() + t.slice(1) : t;
  }
  // nom et famille de chaque groupe entouré
  function legende(m) {
    return `<ul class="rp-legende">${groupes(m).map(g => `<li><i>${g.n}</i> <b>${NOMS[g.type].groupe}</b> (${NOMS[g.type].formule}) : ${NOMS[g.type].famille}</li>`).join('')}</ul>`;
  }
  // formule avec ses groupes entourés, puis la légende
  const corrigee = m => `${formule(m, { entoure: true })}${legende(m)}`;
  const listeN = ns => (ns.length > 1 ? `n° ${ns.slice(0, -1).join(', ')} et ${ns[ns.length - 1]}` : `n° ${ns[0]}`);

  /* Outil « entourer les groupes caractéristiques » (partie 'perso') : on touche un atome pour
     l'entourer (ou le libérer), puis Valider. Diagnostics : atome de la chaîne carbonée (C et H
     seulement), OH d'un groupe carboxyle entouré seul, carboxyle incomplet, groupe oublié. */
  function partieEntourer(m, opts) {
    const gs = groupes(m), attendus = new Set(gs.flatMap(g => g.pieces));
    const pcs = pieces(m);
    return Object.assign({
      type: 'perso', mol: m,
      q: 'Touche les atomes qui forment les groupes caractéristiques pour les entourer, puis valide.',
      solution: corrigee(m),
      monter(zone, api) {
        const box = el('div', 'rp-outil', formule(m, { boutons: true }));
        zone.appendChild(box);
        const grille = box.querySelector('.rp-mol');
        const act = el('div', 'er-actions ph-actions-partie', '<button type="button" class="btn-primary">Valider</button>');
        zone.appendChild(act);
        const choisis = new Set();
        let fige = false;
        // groupe carboxyle dont les trois parties sont touchées : entouré en entier, comme après Valider (sans numéro)
        const carbos = gs.filter(g => g.type === 'carboxyle');
        function provisoires() {
          if (fige) return;
          aligner(grille);
          grille.querySelectorAll('.rp-cercle.provisoire').forEach(x => x.remove());
          grille.querySelectorAll('.rp-at.dans-groupe').forEach(b => b.classList.remove('dans-groupe'));
          carbos.filter(g => g.pieces.every(x => choisis.has(x))).forEach(g => {
            g.pieces.forEach(x => grille.querySelector(`[data-p="${x}"]`).classList.add('dans-groupe'));
            cercle(grille, g);
          });
        }
        if (window.ResizeObserver) new ResizeObserver(provisoires).observe(grille);
        grille.querySelectorAll('.rp-at').forEach(b => {
          b.onclick = () => {
            if (fige || api.fini()) return;
            const id = b.dataset.p;
            if (choisis.has(id)) choisis.delete(id); else choisis.add(id);
            b.classList.toggle('choisi', choisis.has(id));
            b.setAttribute('aria-pressed', String(choisis.has(id)));
            provisoires();
            api.effacer();
          };
        });
        function fermer() {
          fige = true;
          act.remove();
          grille.querySelectorAll('.rp-at').forEach(b => { b.disabled = true; b.classList.remove('choisi', 'dans-groupe'); });
          grille.classList.add('rp-fini');
          cercles(grille, gs);
        }
        act.querySelector('button').onclick = () => {
          if (fige || api.fini()) return;
          if (!choisis.size) { secouer(grille); api.message('Touche les atomes à entourer : ils se marquent. Touche-les à nouveau pour les libérer.'); return; }
          const ok = choisis.size === attendus.size && [...choisis].every(x => attendus.has(x));
          if (ok) { fermer(); api.reussi(); return; }
          secouer(grille);
          // pièce de la chaîne carbonée (que du C et du H)
          const intrus = [...choisis].find(id => !attendus.has(id));
          if (intrus) {
            const t = pcs.find(x => x.id === intrus).t;
            if (!/O/.test(t)) { api.erreur(`${ecrire(t)} ne contient que des atomes de <b>carbone</b> et d'<b>hydrogène</b> : ce n'est pas un groupe caractéristique. Un groupe caractéristique contient au moins un atome qui n'est ni C ni H (ici, l'oxygène O).`); return; }
          }
          // groupe carboxyle entouré en partie
          const partiel = gs.find(g => g.type === 'carboxyle' && g.pieces.some(x => choisis.has(x)) && !g.pieces.every(x => choisis.has(x)));
          if (partiel) {
            const ohSeul = partiel.pieces.filter(x => choisis.has(x)).every(x => estOH(pcs.find(y => y.id === x).t));
            api.erreur(ohSeul
              ? `Ce OH est lié à un atome C qui porte aussi un atome O par une <b>double liaison</b> : C, =O et OH forment ensemble un <b>groupe carboxyle</b>. Entoure les trois.`
              : 'Le groupe carboxyle est formé de <b>trois parties liées entre elles</b> : l\'atome C, l\'atome O lié par une double liaison et le OH. Entoure-les toutes.');
            return;
          }
          const oublie = gs.find(g => !g.pieces.some(x => choisis.has(x)));
          if (oublie) { api.erreur(`Il manque ${gs.length > 1 ? 'au moins un' : 'le'} groupe caractéristique : repère tous les atomes d'oxygène O de la molécule.`); return; }
          api.erreur('Entoure seulement les atomes des groupes caractéristiques : ceux qui contiennent l\'oxygène.');
        };
        return {
          montrer() {
            choisis.clear();
            attendus.forEach(id => { choisis.add(id); });
            fermer();
          },
        };
      },
    }, opts);
  }

  // nommer chaque sorte de groupe entouré (numéros des cercles) et la famille correspondante
  const COMBOS = [o('hydroxyle', 'groupe hydroxyle · famille des alcools'), o('carboxyle', 'groupe carboxyle · famille des acides carboxyliques'),
    o('hydroxyleFaux', 'groupe hydroxyle · famille des acides carboxyliques'), o('carboxyleFaux', 'groupe carboxyle · famille des alcools')];
  function partiesNommer(m) {
    const gs = groupes(m);
    // une question par sorte de groupe, dans l'ordre des numéros
    return Array.from(new Set(gs.map(g => g.type))).map(type => {
      const ns = gs.filter(g => g.type === type).map(g => g.n);
      const autre = type === 'hydroxyle' ? 'carboxyle' : 'hydroxyle';
      return fq.choix(`Nomme le groupe ${ns.length > 1 ? 'entouré ' + listeN(ns) + ' (ils sont identiques)' : 'entouré ' + listeN(ns)} et sa famille.`, COMBOS, type, {
        colonne: true,
        indices: {
          [autre]: type === 'hydroxyle' ? 'Ce groupe est −OH seul, lié à un carbone qui ne porte pas de =O : c\'est un groupe <b>hydroxyle</b>.'
            : 'Ce groupe contient un C lié à un =O <b>et</b> à un OH : c\'est un groupe <b>carboxyle</b>.',
          hydroxyleFaux: 'Le groupe hydroxyle −OH donne la famille des <b>alcools</b>.',
          carboxyleFaux: 'Le groupe carboxyle donne la famille des <b>acides carboxyliques</b>.',
        },
        solution: `<p>Groupe ${listeN(ns)} : <b>${NOMS[type].groupe}</b> (${NOMS[type].formule}), ${NOMS[type].famille}.</p>`,
      });
    });
  }

  /* ============================================================
     PICTOGRAMMES DE SÉCURITÉ (images communes : assets/pictogrammes/)
     dessin : description de l'image (texte de remplacement qui ne donne pas la signification)
     ============================================================ */
  const PICTOS = [
    { id: 'explosif', nom: 'Explosif', dessin: 'une bombe qui éclate', type: 'physique',
      danger: 'peut exploser au contact d\'une flamme, sous l\'effet d\'un choc, d\'un frottement ou de la chaleur',
      precaution: 'éviter les chocs, les frottements, les flammes et la chaleur' },
    { id: 'inflammable', nom: 'Inflammable', dessin: 'une flamme', type: 'physique',
      danger: 'peut s\'enflammer au contact d\'une flamme, d\'une étincelle ou de la chaleur',
      precaution: 'tenir loin de toute flamme ou étincelle et à l\'abri de la chaleur' },
    { id: 'comburant', nom: 'Comburant', dessin: 'une flamme au-dessus d\'un cercle', type: 'physique',
      danger: 'peut provoquer ou aggraver un incendie (il fait brûler les autres produits)',
      precaution: 'tenir éloigné des produits combustibles (qui peuvent brûler)' },
    { id: 'gaz-sous-pression', nom: 'Gaz sous pression', dessin: 'une bouteille de gaz', type: 'physique',
      danger: 'peut exploser sous l\'effet de la chaleur ; un gaz très froid peut brûler la peau',
      precaution: 'tenir à l\'abri de la chaleur et du soleil' },
    { id: 'corrosif', nom: 'Corrosif', dessin: 'des gouttes qui rongent une surface et une main', type: 'sante',
      danger: 'ronge la peau, les yeux et les métaux : brûlures graves',
      precaution: 'porter des gants et des lunettes de protection' },
    { id: 'toxique', nom: 'Toxicité aiguë', dessin: 'une tête de mort sur deux os croisés', type: 'sante',
      danger: 'empoisonne rapidement, même en petite quantité (avalé, respiré ou au contact de la peau) : peut tuer',
      precaution: 'éviter tout contact, ne pas respirer, travailler sous une hotte' },
    { id: 'nocif-irritant', nom: 'Nocif ou irritant', dessin: 'un point d\'exclamation', type: 'sante',
      danger: 'irrite la peau, les yeux ou les voies respiratoires ; nocif à forte dose',
      precaution: 'porter des gants et des lunettes, ne pas respirer les vapeurs' },
    { id: 'danger-sante', nom: 'Danger pour la santé', dessin: 'un buste avec une étoile sur la poitrine', type: 'sante',
      danger: 'effets graves, souvent à long terme : cancer, modification de l\'ADN, atteinte des organes, des poumons ou de la fertilité',
      precaution: 'éviter toute exposition : gants, lunettes, hotte' },
    { id: 'danger-environnement', nom: 'Danger pour l\'environnement', dessin: 'un arbre mort et un poisson', type: 'environnement',
      danger: 'toxique pour les êtres vivants, surtout dans l\'eau',
      precaution: 'ne pas jeter à l\'évier ni dans la nature : récupérer dans un bidon de déchets' },
  ];
  const PICTO = id => PICTOS.find(x => x.id === id);
  // pictogrammes faciles à confondre (mauvais choix des questions)
  const PROCHES = {
    explosif: ['gaz-sous-pression', 'inflammable', 'comburant'], inflammable: ['comburant', 'explosif', 'gaz-sous-pression'],
    comburant: ['inflammable', 'explosif', 'gaz-sous-pression'], 'gaz-sous-pression': ['explosif', 'inflammable', 'comburant'],
    corrosif: ['nocif-irritant', 'toxique', 'danger-sante'], toxique: ['nocif-irritant', 'danger-sante', 'corrosif'],
    'nocif-irritant': ['toxique', 'danger-sante', 'corrosif'], 'danger-sante': ['toxique', 'nocif-irritant', 'corrosif'],
    'danger-environnement': ['toxique', 'danger-sante', 'nocif-irritant'],
  };
  // image d'un pictogramme (chemin depuis une page de modules/) ; o.taille (px), o.legende : nom écrit dessous
  function picto(id, op) {
    op = op || {};
    const p = PICTO(id), t = op.taille || 72;
    const img = `<img class="rp-picto" src="../../assets/pictogrammes/${id}.png" alt="${op.alt || 'pictogramme : ' + p.dessin}" width="${t}" height="${t}">`;
    return op.legende ? `<figure class="rp-picto-fig">${img}<figcaption>${p.nom}</figcaption></figure>` : img;
  }

  // questions sur un pictogramme (parties 'choix') : sa signification, son image, la précaution à prendre
  const nomPicto = x => `« ${PICTO(x).nom} »`;
  const ficheP = id => `<div class="rp-pictos-ligne">${picto(id, { legende: true })}</div><p><b>${PICTO(id).nom}</b> : ${PICTO(id).danger}.</p>`;
  function partieSens(id, q) {
    const l = [id].concat(PROCHES[id]);
    return fq.choix(q || 'Que signifie ce pictogramme ?', l.map(x => o(x, PICTO(x).nom)), id, {
      indices: Object.fromEntries(PROCHES[id].map(x => [x, `Le pictogramme ${nomPicto(x)} montre ${PICTO(x).dessin}. Regarde bien le dessin.`])),
      solution: ficheP(id) });
  }
  function partieImage(id, q) {
    const l = melanger([id].concat(PROCHES[id]));
    return fq.choix(q || `Quel pictogramme signifie ${nomPicto(id)} ?`, l.map(x => o(x, picto(x, { taille: 64 }))), id, {
      images: true, colonne: false,
      indices: Object.fromEntries(PROCHES[id].map(x => [x, `Ce pictogramme (${PICTO(x).dessin}) signifie ${nomPicto(x)}.`])),
      solution: ficheP(id) });
  }
  function partiePrecaution(id, q) {
    const P = PICTO(id), autres = melanger(PICTOS.filter(x => x.type !== P.type)).slice(0, 2);
    return fq.choix(q || 'Quelle précaution faut-il prendre ?', [o(id, P.precaution)].concat(autres.map(x => o(x.id, x.precaution))), id, {
      colonne: true,
      indices: Object.fromEntries(autres.map(x => [x.id, `Cette précaution correspond au pictogramme ${nomPicto(x.id)}, pas à ${nomPicto(id)}.`])),
      solution: `${ficheP(id)}<p>Précaution : <b>${P.precaution}</b>.</p>` });
  }

  /* ---------- Plan de l'application et navigation (voir assets/sommaire.js) ---------- */
  const PLAN = [
    { n: 1, titre: 'Les groupes caractéristiques', desc: 'Groupes hydroxyle et carboxyle, familles des alcools et des acides carboxyliques, entourer et nommer', fiche: 'fiche_1',
      parties: [{ nom: 'Groupes caractéristiques', cours: 'module_1_cours', questions: 'module_1_questions' }] },
    { n: 2, titre: 'Les pictogrammes de sécurité', desc: 'Les neuf pictogrammes de danger, leur signification et les précautions à prendre', fiche: 'fiche_2',
      parties: [{ nom: 'Pictogrammes de sécurité', cours: 'module_2_cours', questions: 'module_2_questions' }] },
    { n: 3, titre: 'Exercices', desc: 'Les exemples de la fiche (entourer et nommer), puis deux extraits de sujets de bac', exercices: 'module_3', exNom: 'Exercices 1 à 4, A et B', nbEx: 6 },
  ];
  window.SOM.init({ nom: 'Rappels de 1ère STI2D', id: 'rappels-1ere-sti2d', cleEx: 'rappels-1ere-sti2d-exercices', plan: PLAN });
  const menu = cle => window.SOM.menu(cle);
  const accueil = zone => window.SOM.accueil(zone);

  // la clé de chaque molécule (pour entourer ses groupes une fois affichée)
  Object.keys(MOL).forEach(k => { MOL[k].cle = k; });

  window.RP = {
    fmt, o, fq, el, secouer, melanger, hasard, PARTIES, question, serie, confettis,
    ecrire, NOMS, MOL, leNom, pieces, groupes, famille, formule, cercles, legende, corrigee, partieEntourer, partiesNommer,
    PICTOS, PICTO, PROCHES, picto, partieSens, partieImage, partiePrecaution,
    PLAN, menu, accueil,
  };
})();
