/* ============================================================
   Moteur de l'application « Période et fréquence d'un signal »
   (Physique · Seconde ; moteur de questions repris de « Cinématique »
   via « Chromatographie », navigation commune assets/sommaire.js,
   graphiques, règle et lecture directe avec l'outil LG de lecture-graphique/)

   PF.fmt(v, dec), PF.sci(v, c), PF.sciCourt(v), PF.sig(v, c), PF.court(v, c), PF.egal(v, c), PF.lire(s), PF.fr(h, b)   écriture et lecture des nombres
   PF.el(tag, cls, html), PF.melanger(t), PF.hasard(t), PF.defiler(e)
   PF.PARTIES                       parties de question :
     'choix'  : p.options [{ id, label }], p.bonne, p.indices[id] ou p.indice
     'nombre' : p.label, p.unite, p.verifier(v) → { ok } | { diag } | { format } ; p.sci : saisie a × 10ⁿ
     'perso'  : p.monter(zone, api) → { montrer() } ; api.reussi(), api.erreur(diag), api.compter() (erreur sans message)
   PF.question(zone, q, cb, mode)   question en parties successives ; mode 'serie' (Afficher la réponse
                                    toujours là, 0 point) ou 'manip' (proposé après 2 erreurs)
   PF.serie(opts)                   série de 10 questions notée sur 20
   PF.partiesFrequence(o)           parties « T en secondes » puis « f = 1 / T » (diagnostics des erreurs classiques)
     o = { T (valeur), unite: 'ms' | 's' | 'µs', sym: 'T', exact (valeur exacte, facultatif) }
   PF.phaseSommet(forme, T, tS)     phase qui place le sommet principal d'une forme LG à la date tS
   PF.revois(liste)                 liens « Revois… » vers d'autres applications (nouvelle fenêtre)
   PF.confettis()
   ============================================================ */
(function () {
  'use strict';

  /* ---------- Plan de l'application (sommaire, accueil, progression) ---------- */
  const PLAN = [
    { n: 1, titre: 'Le motif élémentaire', desc: 'Signal périodique ou non, puis repérer le motif qui se répète',
      parties: [{ nom: 'Le motif élémentaire', entrainement: 'module_1_manip', noms: { entrainement: 'Manipulation : le motif élémentaire' } }] },
    { n: 2, titre: 'Mesurer T et calculer f', desc: 'Une période, plusieurs périodes, puis la règle et le tableau ; f = 1 / T',
      parties: [{ nom: 'Mesurer T et calculer f', entrainement: 'module_2_manip', noms: { entrainement: 'Manipulation : mesurer T et calculer f' } }] },
    { n: 3, titre: 'Écran d\'oscilloscope', desc: 'Compter les carreaux, base de temps, T puis f',
      parties: [{ nom: 'Écran d\'oscilloscope', simulation: 'module_3_simulation', noms: { simulation: 'Simulateur : écran d\'oscilloscope' } }] },
    { n: 4, titre: 'Entraînement', desc: 'Série notée sur 20 : graphiques, signaux à l\'échelle, oscilloscope, T et f',
      parties: [{ nom: 'Entraînement', questions: 'module_4_questions', noms: { questions: 'Entraînement' } }] },
  ];
  SOM.init({ nom: 'Période et fréquence d\'un signal', id: 'periode-frequence', plan: PLAN });
  // pavé numérique de LG : seulement sur les écrans tactiles (le clavier suffit à la souris)
  document.addEventListener('DOMContentLoaded', () => { if (window.setNumpadPref && matchMedia('(hover: hover)').matches) setNumpadPref(false); });

  const MOINS = '−';

  /* ============================================================
     NOMBRES
     ============================================================ */
  // nombre écrit à la française : 2,3 ; −0,30 ; 1 000 (dec : nombre de décimales imposé)
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
  // écriture scientifique a × 10ⁿ avec c chiffres significatifs
  function sci(v, c) {
    if (v === 0) return '0';
    let e = Math.floor(Math.log10(Math.abs(v)) + 1e-12), m = +(v / Math.pow(10, e)).toFixed((c || 2) - 1);
    if (Math.abs(m) >= 10) { m /= 10; e++; }
    return `${fmt(m, (c || 2) - 1)} × 10<sup>${String(e).replace('-', MOINS)}</sup>`;
  }
  // écriture scientifique sans zéros inutiles : 4 × 10⁻³, 2,5 × 10⁻³, 2,89 × 10⁻³
  function sciCourt(v) {
    if (v === 0) return '0';
    let e = Math.floor(Math.log10(Math.abs(v)) + 1e-12), m = +(v / Math.pow(10, e)).toPrecision(3);
    if (Math.abs(m) >= 10) { m = +(m / 10).toPrecision(3); e++; }
    return `${fmt(m)} × 10<sup>${String(e).replace('-', MOINS)}</sup>`;
  }
  // valeur arrondie à c chiffres significatifs (3 par défaut), sans zéros inutiles : 2,5 ; 2 500 ; 66,7
  const court = (v, c) => fmt(+v.toPrecision(c || 3));
  // « = » si l'arrondi ne change pas la valeur, sinon « ≈ »
  const egal = (v, c) => Math.abs(+v.toPrecision(c || 3) - v) <= 1e-9 * Math.abs(v) ? '=' : '≈';
  // nombre avec c chiffres significatifs, écrit simplement (345 ; 2,90 ; 0,0029)
  function sig(v, c) {
    if (!v) return '0';
    const dec = Math.max(0, c - 1 - Math.floor(Math.log10(Math.abs(v)) + 1e-12));
    return fmt(v, dec);
  }
  // lecture d'une saisie : « 2,3 », « −0,5 », « 2,9e-3 », « 2,9.10^-3 », « 2,9 × 10⁻³ »
  function lire(s) {
    let t = String(s == null ? '' : s).trim().replace(/[\s  ]/g, '').replace(/[−–]/g, '-');
    t = t.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁻]/g, c => ({ '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9', '⁻': '-' })[c]);
    // a × 10^n écrit avec ×, x, *, ou un point (écriture « 2,9.10-3 » du cours)
    const m = t.match(/^([-+]?\d+(?:[.,]\d*)?)(?:[×x*.])10\^?([-+]?\d+)$/i);
    if (m) return parseFloat(m[1].replace(',', '.')) * Math.pow(10, +m[2]);
    t = t.replace(',', '.');
    return /^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i.test(t) ? parseFloat(t) : NaN;
  }
  const fr = (h, b) => `<span class="fr"><span>${h}</span><span>${b}</span></span>`;
  // deux valeurs égales à r près (relatif)
  const proche = (a, b, r) => Math.abs(a - b) <= (r || 0.005) * Math.abs(b);

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

  // liens « Revois… » vers d'autres applications (nouvelle fenêtre)
  const APPLIS = {
    lecture: { href: '../../lecture-graphique/index.html', texte: 'Revois la lecture graphique' },
    proportionnalite: { href: '../../proportionnalite/index.html', texte: 'Revois les tableaux de proportionnalité' },
    conversions: { href: '../../conversions/index.html', texte: 'Revois les conversions' },
    puissances: { href: '../../puissances-10/index.html', texte: 'Revois les puissances de 10' },
  };
  function revois(liste) {
    return `<p class="pf-revois">${liste.map(k => `<a href="${APPLIS[k].href}" target="_blank" rel="noopener">${APPLIS[k].texte} ↗</a>`).join('')}</p>`;
  }

  /* ============================================================
     PARTIES DE QUESTION
     Chaque partie reçoit (zone, p, api) et renvoie { montrer() }.
     ============================================================ */
  // Choix parmi des boutons : p.options [{ id, label }], p.bonne, p.indice ou p.indices[id], p.colonne
  function pChoix(zone, p, api) {
    const box = el('div', 'ph-choix' + (p.colonne ? ' ph-choix-col' : ''));
    zone.appendChild(box);
    const opts = p.melanger === false ? p.options : melanger(p.options);
    const bs = opts.map(o => {
      const b = el('button', 'btn-secondary', o.label);
      b.type = 'button';
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

  // Saisie d'un nombre : champ + bouton ±, unité ; p.sci : saisie a × 10ⁿ (deux champs)
  // p.verifier(v) → { ok } | { diag } | { format } ; p.reponse : texte de la réponse (affichée)
  function pNombre(zone, p, api) {
    const champ = (cls, aria, ph) => `<span class="pf-champ-box"><input type="text" class="ph-champ ${cls}" inputmode="decimal" autocomplete="off" spellcheck="false" aria-label="${aria}" placeholder="${ph || ''}"><button type="button" class="pf-pm" aria-label="Changer le signe">±</button></span>`;
    const box = el('div', 'pf-saisie', `<div class="pf-saisie-l">${p.label ? `<span class="pf-saisie-t">${p.label}</span>` : ''}
        ${p.sci ? `<span class="pf-sci">${champ('pf-mant', 'Nombre', '')}<span class="pf-puiss"><span class="pf-x10">× 10</span><span class="pf-exp-box">${champ('pf-exp', 'Exposant de 10', '0')}</span>${p.unite ? `<span class="pf-unite">${p.unite}</span>` : ''}</span></span>`
          : champ('pf-val', p.aria || 'Réponse', '') + (p.unite ? `<span class="pf-unite">${p.unite}</span>` : '')}</div>
      <div class="er-actions"><button type="button" class="btn-primary" data-a="ok">Valider</button></div>
      ${p.aide ? `<p class="pf-aide-saisie">${p.aide}</p>` : ''}`);
    zone.appendChild(box);
    const ins = Array.from(box.querySelectorAll('input'));
    box.querySelectorAll('.pf-pm').forEach(b => {
      b.onclick = () => {
        const i = b.previousElementSibling;
        i.value = i.value.trim().startsWith(MOINS) || i.value.trim().startsWith('-') ? i.value.trim().slice(1) : MOINS + i.value.trim();
        if (surOrdi()) i.focus();
      };
    });
    function valeur() {
      if (!p.sci) return lire(ins[0].value);
      const a = lire(ins[0].value), e = ins[1].value.trim() === '' ? 0 : lire(ins[1].value);
      return isNaN(a) || isNaN(e) || Math.round(e) !== e ? NaN : a * Math.pow(10, e);
    }
    function valider() {
      if (api.fini()) return;
      const v = valeur();
      if (isNaN(v)) { api.message(p.sci ? 'Écris un nombre (avec une virgule si besoin) et un exposant entier.' : 'Écris un nombre (avec une virgule si besoin).'); return; }
      const r = p.verifier(v) || {};
      if (r.format) { api.message(r.format); return; }
      if (r.ok) { ins.forEach(i => { i.disabled = true; }); box.querySelectorAll('.pf-pm').forEach(b => { b.disabled = true; }); api.reussi(); }
      else api.erreur(r.diag || '');
    }
    box.querySelector('[data-a="ok"]').onclick = valider;
    ins.forEach(i => i.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); valider(); } }));
    if (surOrdi()) setTimeout(() => ins[0].focus({ preventScroll: true }), 50);
    return {
      montrer() {
        ins.forEach(i => { i.disabled = true; });
        box.querySelectorAll('.pf-pm').forEach(b => { b.disabled = true; });
        if (p.remplir) p.remplir(ins);
      },
    };
  }
  // Outil propre à l'application : p.monter(zone, api) → { montrer() }
  function pPerso(zone, p, api) {
    const ctx = p.monter(zone, api) || {};
    return { montrer() { if (ctx.montrer) ctx.montrer(); } };
  }
  const PARTIES = { choix: pChoix, nombre: pNombre, perso: pPerso };

  /* ============================================================
     UNE QUESTION : parties successives
     q = { parties: [p] } ; p = { type, q (texte), figure(zone), solution (HTML affiché après), … }
     cb.fin(points) : 2 sans erreur, 1 après au moins une erreur, 0 si une réponse est affichée
     cb.partie(i) : appelée quand la partie i est réussie (déroulé guidé)
     mode 'serie' : « Afficher la réponse » toujours là (0 point pour la question) ;
     mode 'manip' : proposé après deux erreurs sur la même partie.
     Une partie finie garde son retour ; la suivante s'affiche dessous (« Suite → » en série).
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
        message(h) { if (!finie) ret.innerHTML = `<p class="ph-msg">${h}</p>`; },
        // erreur comptée sans message (l'outil affiche lui-même son diagnostic)
        compter() { etat.erreurs++; erreursIci++; if (mode === 'manip' && erreursIci >= 2) aide.hidden = false; },
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
        const titre = vue ? 'Réponse' : (erreursIci ? 'C\'est juste.' : 'Juste !');
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
            a.querySelector('button').onclick = () => { d.remove(); partie(); defiler(zone); };
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
      window.PF.questionEnCours = q;          // question en cours (utile pour vérifier l'application)
      app.innerHTML = `<div class="er-card ph-tete"><div class="pf-tete"><span class="er-badge">${opts.badge}</span><h2 class="er-titre">${opts.titre}</h2>
            <p class="er-meta">Question ${idx + 1}/${qs.length} · Score : <b data-a="score">${pts(score)}</b></p></div>
          <div class="progress-bar"><div class="progress-fill" style="width:${Math.round(idx / qs.length * 100)}%"></div></div></div>
        <div class="er-card ph-question">${q.theme ? `<p class="er-q-nom">${q.theme}</p>` : ''}${q.consigne ? `<div class="er-consigne">${q.consigne}</div>` : ''}${q.enonce ? `<div class="ph-enonce">${q.enonce}</div>` : ''}
          <div data-a="parties"></div><div data-a="retour"></div><div class="er-actions" data-a="suite"></div></div>`;
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
          defiler(s);
        },
      }, 'serie');
    }

    function fin() {
      const max = qs.length * 2, note = Math.round(score / max * 20 * 2) / 2, pct = Math.round(score / max * 100);
      SOM.marquer({ note });
      const msg = score === max ? 'Tout est juste : bravo !' : pct >= 70 ? 'Très bien ! Encore un peu d\'entraînement pour le sans-faute.'
        : pct >= 50 ? 'Pas mal ! Recommence pour progresser : les questions changent à chaque fois.' : 'Continue à t\'entraîner : refais les manipulations des modules 2 et 3, puis recommence.';
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
     FRÉQUENCE : T en secondes, puis f = 1 / T
     o = { T, unite: 'ms' | 's' | 'µs', sym: 'T', exact }
     Erreurs reconnues : T gardée en ms, conversion à l'envers (× 10³), T et f confondues.
     ============================================================ */
  const PUIS = { ms: -3, 'µs': -6, s: 0 };
  function partiesFrequence(o) {
    const sym = o.sym || 'T', u = o.unite || 'ms', k = PUIS[u];
    const Ts = o.T * Math.pow(10, k);                          // période de l'élève, en s
    const exS = (o.exact != null ? o.exact : o.T) * Math.pow(10, k);
    const fJ = 1 / Ts, fEx = 1 / exS;
    const unitePref = u === 'µs' ? '1 µs = 10<sup>−6</sup> s' : '1 ms = 10<sup>−3</sup> s';
    const parties = [];
    if (k) {
      parties.push({
        type: 'nombre', sci: true,
        q: `Convertis ${sym} en secondes.`,
        label: `${sym} = ${fmt(o.T)} ${u} =`, unite: 's',
        aide: `Écris le nombre, puis l'exposant de 10 (laisse 0 si tu écris un nombre décimal comme 0,002).`,
        verifier(v) {
          if (proche(v, Ts, 0.012) || proche(v, exS, 0.012)) return { ok: true };
          if (proche(v, o.T * Math.pow(10, -k), 0.02)) return { diag: `${unitePref} : ${sym} en secondes est plus petit que ${sym} en ${u}.` };
          if (proche(v, o.T, 0.02)) return { diag: `Tu as recopié la valeur en ${u} : convertis-la en secondes (${unitePref}).` };
          if (u === 'ms' && proche(v, o.T * 1e-6, 0.02)) return { diag: '1 ms = 10<sup>−3</sup> s (10<sup>−6</sup> s, c\'est 1 µs).' };
          if (u === 'µs' && proche(v, o.T * 1e-3, 0.02)) return { diag: '1 µs = 10<sup>−6</sup> s (10<sup>−3</sup> s, c\'est 1 ms).' };
          return { diag: `${unitePref} : multiplie ${fmt(o.T)} par 10<sup>${k === -3 ? '−3' : '−6'}</sup>.` };
        },
        solution: `${sym} = ${fmt(o.T)} ${u} = ${sciCourt(Ts)} s`,
        remplir(ins) { ins[0].value = fmt(+(Ts / Math.pow(10, k)).toPrecision(4)); ins[1].value = String(k).replace('-', MOINS); },
      });
    }
    parties.push({
      type: 'nombre',
      q: `Calcule la fréquence f (2 ou 3 chiffres significatifs).`,
      label: `f = 1 / ${sym} =`, unite: 'Hz',
      verifier(v) {
        if (proche(v, fJ, 0.02) || proche(v, fEx, 0.025)) return { ok: true };
        if (k && proche(v, 1 / o.T, 0.03)) return { diag: `Tu as gardé ${sym} en ${u} : dans f = 1 / ${sym}, ${sym} doit être en secondes.` };
        if (k && proche(v, 1 / (o.T * Math.pow(10, -k)), 0.03)) return { diag: `${unitePref} : ${sym} en secondes est plus petit que ${sym} en ${u}.` };
        if (proche(v, Ts, 0.03) || proche(v, o.T, 0.03)) return { diag: `f = 1 / ${sym} : la fréquence est l'inverse de la période.` };
        if (proche(v, fJ / 1000, 0.03)) return { diag: 'Donne f en hertz (Hz), pas en kilohertz : 1 kHz = 10<sup>3</sup> Hz.' };
        return { diag: `f = 1 / ${sym}, avec ${sym} en secondes : calcule 1 / ${k ? `(${sciCourt(Ts)})` : fmt(Ts)}.` };
      },
      solution: () => `f = 1 / ${sym} = 1 / ${k ? `(${sciCourt(Ts)})` : fmt(Ts)} ${egal(fJ)} <b>${court(fJ)} Hz</b>`,
      remplir(ins) { ins[0].value = court(fJ).replace(/\s/g, ''); },
    });
    return parties;
  }

  /* Phase (en unité de temps) qui place le sommet principal d'une forme LG à la date tS */
  function phaseSommet(forme, T, tS) {
    const g = LG.FORMES[forme] || LG.FORMES.sinus;
    let uM = 0, best = -Infinity;
    for (let i = 0; i < 4000; i++) { const v = g(i / 4000); if (v > best) { best = v; uM = i / 4000; } }
    for (let j = -50; j <= 50; j++) { const u = uM + j / 200000, v = g(u); if (v > best) { best = v; uM = u; } }   // affinage
    return tS - uM * T;
  }

  window.PF = { phaseSommet, fmt, sci, sciCourt, sig, court, egal, lire, fr, proche, el, melanger, hasard, defiler, surOrdi, revois, PARTIES, question, serie, partiesFrequence, confettis, PLAN };
})();
