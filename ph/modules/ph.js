/* ============================================================
   Moteur de l'application « pH » (Terminale)

   PH.fmt, PH.sci, PH.lire    écriture et lecture des nombres (virgule, × 10ⁿ)
   PH.H3O, PH.C0, PH.UNITE    écritures communes ([H₃O⁺], c°, mol·L⁻¹)
   PH.PARTIES                 parties de question : 'choix', 'nombre', 'sci',
                              'tableau', 'equation' (glisser-déposer, voir eq.js)
   PH.question(zone, q, cb)   question en plusieurs parties
   PH.serie(opts)             série de questions notée sur 20 (questions des modules 1 et 2)
   PH.aToi(zone, parties)     « À toi » dans les cours : il faut réussir pour continuer
   PH.Cours                   cours par étapes (une étape réussie fait apparaître la suivante)
   PH.diagPH, PH.diagC        erreurs fréquentes sur un pH ou une concentration
   PH.menu(cle)               bandeau et menu communs aux modules

   Les styles des cartes, boutons et écrans de fin viennent de
   equilibrer-reactions/modules/er.css (même présentation).
   ============================================================ */
(function () {
  'use strict';

  /* ============================================================
     NOMBRES
     ============================================================ */
  const MOINS = '−';
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
    let s = (Math.abs(v) < Math.pow(10, -dec) / 2 ? 0 : v).toFixed(dec);
    return s.replace('-', MOINS).replace('.', ',');
  }
  // mantisse et exposant avec cs chiffres significatifs
  function decomposer(v, cs) {
    if (v === 0) return { m: 0, e: 0 };
    let e = Math.floor(Math.log10(Math.abs(v)) + 1e-12);
    let m = +(v / Math.pow(10, e)).toFixed(cs - 1);
    if (Math.abs(m) >= 10) { m /= 10; e++; }
    return { m, e };
  }
  // écriture scientifique : 6,3 × 10⁻⁶ (HTML)
  function sci(v, cs) {
    const d = decomposer(v, cs || 2);
    return `${fmt(d.m, (cs || 2) - 1)} × 10<sup>${String(d.e).replace('-', MOINS)}</sup>`;
  }
  // puissance de 10 seule : 10⁻³
  const p10 = n => `10<sup>${fmt(n)}</sup>`;
  // lecture d'une saisie : « 2,3 », « −0,5 », « 2.5e-3 »
  function lire(s) {
    const t = String(s == null ? '' : s).trim().replace(/[\s  ]/g, '').replace(',', '.').replace(/[−–]/g, '-');
    return /^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i.test(t) ? parseFloat(t) : NaN;
  }
  const proche = (a, b, rel) => Math.abs(a - b) <= (rel == null ? .01 : rel) * Math.abs(b) + 1e-300;

  // écritures communes
  const H3O = '[H<sub>3</sub>O<sup>+</sup>]';
  const C0 = 'c°';
  const UNITE = 'mol·L<sup>−1</sup>';

  /* ============================================================
     ERREURS FRÉQUENTES
     ============================================================ */
  // pH attendu ph, valeur proposée v, concentration c (mol/L) qui a servi au calcul
  function diagPH(v, ph, c) {
    if (Math.abs(v + ph) < .06 && Math.abs(ph) > .06) return `Attention au signe : pH = ${MOINS}log(${H3O}/c°). Le log d'un nombre plus petit que 1 est négatif, le signe ${MOINS} rend le pH positif.`;
    if (c && Math.abs(v - (-Math.log(c))) < .06) return 'Tu as utilisé la touche <b>ln</b> : le pH se calcule avec <b>log</b>, le logarithme décimal.';
    if (Math.abs(v - Math.round(ph)) < 1e-9 && Math.abs(ph - Math.round(ph)) > .05) return 'Donne le pH avec <b>une décimale</b> (au dixième près).';
    return null;
  }
  // concentration attendue c (mol/L), valeur proposée v, pH qui a servi au calcul
  function diagC(v, c, ph) {
    if (ph != null && proche(v, Math.pow(10, ph), .03)) return `L'exposant doit être <b>négatif</b> : ${H3O} = c° × 10<sup>${MOINS}pH</sup>.`;
    if (ph != null && (Math.abs(v - ph) < .01 || Math.abs(v + ph) < .01)) return `Tu as écrit le pH : la concentration se calcule avec la fonction 10<sup>x</sup> : ${H3O} = c° × 10<sup>${MOINS}pH</sup>.`;
    if (ph != null && proche(v, Math.exp(-ph), .03)) return 'Tu as utilisé la touche <b>e<sup>x</sup></b> : il faut la touche <b>10<sup>x</sup></b>.';
    const r = v / c, k = Math.round(Math.log10(r));
    if (k !== 0 && proche(r, Math.pow(10, k), .03)) return 'Le nombre devant la puissance de 10 est juste, mais pas l\'exposant : vérifie la puissance de 10.';
    return null;
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
  function secouer(e) { if (!e) return; e.classList.remove('er-secoue'); void e.offsetWidth; e.classList.add('er-secoue'); }
  function melanger(t) {
    const a = t.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }
  const hasard = t => t[Math.floor(Math.random() * t.length)];
  const entre = (a, b) => a + Math.floor(Math.random() * (b - a + 1));

  // Champ de saisie d'un nombre, avec un bouton ± (le pavé numérique
  // des smartphones n'a pas toujours de touche « − »)
  function champ(opts) {
    opts = opts || {};
    const d = el('span', 'ph-champ-box' + (opts.petit ? ' petit' : ''));
    d.innerHTML = `${opts.signe === false ? '' : `<button type="button" class="ph-pm" aria-label="Changer le signe" title="Changer le signe">±</button>`}
      <input type="text" class="ph-champ" inputmode="${opts.entier ? 'numeric' : 'decimal'}" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="${opts.aria || 'Réponse'}">`;
    const input = d.querySelector('input'), pm = d.querySelector('.ph-pm');
    if (pm) {
      pm.addEventListener('click', () => {
        if (input.disabled) return;
        const v = input.value.trim();
        input.value = /^[-−]/.test(v) ? v.replace(/^[-−]\s*/, '') : MOINS + v;
        input.dispatchEvent(new Event('input'));
        // pas de focus sur smartphone : le clavier masquerait la question
        if (matchMedia('(hover: hover)').matches) input.focus();
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

  // Valeur numérique : p.label (« pH = »), p.valeur, p.tol (écart absolu accepté) ou p.rel (écart relatif),
  // p.unite, p.entier, p.diag(v) → indice, p.indice
  function pNombre(zone, p, api) {
    const d = el('div', 'ph-valeur');
    if (p.label) d.appendChild(el('span', 'ph-lab', p.label));
    const ch = champ({ entier: p.entier, signe: p.signe });
    d.appendChild(ch.el);
    if (p.unite) d.appendChild(el('span', 'ph-unite', p.unite));
    zone.appendChild(d);
    const bVal = boutonValider(zone);
    ch.input.addEventListener('input', () => api.effacer());
    ch.input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); valider(); } });
    function juste(v) {
      if (p.tol != null) return Math.abs(v - p.valeur) <= p.tol + 1e-12;
      return proche(v, p.valeur, p.rel == null ? .005 : p.rel);
    }
    function valider() {
      if (api.fini()) return;
      const v = lire(ch.input.value);
      if (isNaN(v)) { secouer(d); api.message('Écris un nombre (avec une virgule si besoin).'); return; }
      if (juste(v)) { ch.desactiver(true); bVal.fermer(); api.reussi(); return; }
      api.erreur((p.diag && p.diag(v)) || p.indice || 'Vérifie ton calcul.');
      secouer(d);
    }
    bVal.onclick = valider;
    return {
      montrer() { ch.input.value = p.affiche || fmt(p.valeur, p.dec); ch.desactiver(true); bVal.fermer(); },
    };
  }

  // Écriture scientifique a × 10ⁿ : p.label, p.valeur, p.unite, p.rel (écart relatif, 3 % par défaut),
  // p.cs (chiffres significatifs de la réponse affichée), p.diag(v)
  function champsSci(petit) {
    const d = el('span', 'ph-sci');
    const a = champ({ aria: 'Nombre devant la puissance de 10', petit });
    const n = champ({ aria: 'Exposant de la puissance de 10', entier: true, petit: true });
    n.el.classList.add('ph-exposant');
    d.appendChild(a.el);
    d.appendChild(el('span', 'ph-x10', '× 10'));
    d.appendChild(n.el);
    return {
      el: d, a, n,
      valeur() {
        const va = lire(a.input.value), sn = n.input.value.trim();
        if (isNaN(va)) return { err: 'mantisse' };
        if (sn === '') return { err: 'exposant' };
        const vn = lire(sn);
        if (isNaN(vn) || !Number.isInteger(vn)) return { err: 'exposant' };
        return { v: va * Math.pow(10, vn) };
      },
      remplir(v, cs) { const x = decomposer(v, cs || 2); a.input.value = fmt(x.m, (cs || 2) - 1); n.input.value = String(x.e).replace('-', MOINS); },
      desactiver(b) { a.desactiver(b); n.desactiver(b); },
    };
  }
  function pSci(zone, p, api) {
    const d = el('div', 'ph-valeur');
    if (p.label) d.appendChild(el('span', 'ph-lab', p.label));
    const s = champsSci(true);
    d.appendChild(s.el);
    if (p.unite) d.appendChild(el('span', 'ph-unite', p.unite));
    zone.appendChild(d);
    const bVal = boutonValider(zone);
    [s.a.input, s.n.input].forEach(i => {
      i.addEventListener('input', () => api.effacer());
      i.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); valider(); } });
    });
    function valider() {
      if (api.fini()) return;
      const r = s.valeur();
      if (r.err) {
        secouer(d);
        api.message(r.err === 'mantisse' ? 'Écris le nombre devant la puissance de 10.' : 'Écris l\'exposant de la puissance de 10 (un nombre entier, avec le bouton ± s\'il est négatif).');
        return;
      }
      if (proche(r.v, p.valeur, p.rel == null ? .03 : p.rel)) { s.desactiver(true); bVal.fermer(); api.reussi(); return; }
      api.erreur((p.diag && p.diag(r.v)) || p.indice || 'Vérifie ton calcul.');
      secouer(d);
    }
    bVal.onclick = valider;
    return { montrer() { s.remplir(p.valeur, p.cs); s.desactiver(true); bVal.fermer(); } };
  }

  // Tableau [H₃O⁺] / pH (exercice 11) : p.cols [{ c, ph, trouver: 'c' | 'ph' }]
  // Une colonne par case du tableau du cours ; sur smartphone, les colonnes passent à la ligne.
  function pTableau(zone, p, api) {
    const g = el('div', 'ph-tab');
    zone.appendChild(g);
    const cases = p.cols.map((col, k) => {
      const c = el('div', 'ph-tab-col');
      c.innerHTML = `<div class="ph-tab-l"><span class="ph-tab-t">${H3O} en ${UNITE}</span><div class="ph-tab-v" data-v="c"></div></div>
        <div class="ph-tab-l"><span class="ph-tab-t">pH</span><div class="ph-tab-v" data-v="ph"></div></div>`;
      g.appendChild(c);
      const vc = c.querySelector('[data-v="c"]'), vp = c.querySelector('[data-v="ph"]');
      let saisie;
      if (col.trouver === 'c') {
        vp.innerHTML = `<b>${fmt(col.ph, 1)}</b>`;
        saisie = champsSci(true);
        vc.appendChild(saisie.el);
        [saisie.a.input, saisie.n.input].forEach(i => i.addEventListener('input', () => { c.classList.remove('ok', 'ko'); api.effacer(); }));
      } else {
        vc.innerHTML = `<b>${col.cTxt || sci(col.c, 2)}</b>`;
        saisie = champ({ aria: 'pH, colonne ' + (k + 1), petit: true });
        vp.appendChild(saisie.el);
        saisie.input.addEventListener('input', () => { c.classList.remove('ok', 'ko'); api.effacer(); });
      }
      return { col, c, saisie };
    });
    const bVal = boutonValider(zone);
    bVal.onclick = () => {
      if (api.fini()) return;
      let vide = false;
      const faux = [];
      cases.forEach((x, k) => {
        let ok, v;
        if (x.col.trouver === 'c') {
          const r = x.saisie.valeur();
          if (r.err) { vide = true; return; }
          v = r.v; ok = proche(v, x.col.c, .03);
          if (!ok) faux.push({ k, d: diagC(v, x.col.c, x.col.ph) });
        } else {
          v = lire(x.saisie.input.value);
          if (isNaN(v)) { vide = true; return; }
          ok = Math.abs(v - x.col.ph) <= .051;
          if (!ok) faux.push({ k, d: diagPH(v, x.col.ph, x.col.c) });
        }
        x.c.classList.toggle('ok', ok); x.c.classList.toggle('ko', !ok);
      });
      if (vide) { secouer(g); api.message('Complète toutes les cases du tableau.'); return; }
      if (!faux.length) { cases.forEach(x => x.saisie.desactiver(true)); bVal.fermer(); api.reussi(); return; }
      const d = faux.find(f => f.d);
      api.erreur(`${faux.length > 1 ? 'Les cases en rouge sont fausses.' : 'La case en rouge est fausse.'}${d ? ' ' + d.d : ''}`);
      secouer(g);
    };
    return {
      montrer() {
        cases.forEach(x => {
          if (x.col.trouver === 'c') x.saisie.remplir(x.col.c, 2); else x.saisie.input.value = fmt(x.col.ph, 1);
          x.saisie.desactiver(true); x.c.classList.remove('ko'); x.c.classList.add('ok');
        });
        bVal.fermer();
      },
    };
  }

  // Manipulation d'une équation par glisser-déposer (eq.js) : p.eq = configuration de PH.Editeur
  function pEquation(zone, p, api) {
    const d = el('div');
    zone.appendChild(d);
    let fini = false;
    const ed = new window.PH.Editeur(d, Object.assign({}, p.eq, {
      onErreur: () => { if (!fini) api.compterErreur(); },
      onResolu: () => { fini = true; api.reussi(true); },
    }));
    return { montrer() { fini = true; ed.montrerSolution(); } };
  }

  const PARTIES = { choix: pChoix, nombre: pNombre, sci: pSci, tableau: pTableau, equation: pEquation };

  /* ============================================================
     UNE QUESTION : parties successives
     q = { parties: [p] } ; p = { type, q (texte), solution (HTML affiché après), … }
     mode : 'serie'    bouton « Afficher la réponse » (0 point pour la question)
            'exercice' bouton « Voir la correction » toujours disponible
            'cours'    « Afficher la réponse » proposé après une erreur
     cb.fin(points) : 2 sans erreur, 1 après au moins une erreur, 0 si une réponse est affichée
     ============================================================ */
  function question(zone, q, cb, mode) {
    mode = mode || 'serie';
    const etat = { erreurs: 0, vue: false, fini: false, details: [] };
    let k = 0;
    const libAide = mode === 'exercice' ? 'Voir la correction' : 'Afficher la réponse';
    function partie() {
      const p = q.parties[k];
      window.PH.partieEnCours = p;          // partie en cours (utile pour vérifier l'application)
      const d = el('div', 'ph-partie', `${p.q ? `<p class="ph-partie-q">${p.q}</p>` : ''}<div class="ph-partie-zone"></div><div class="ph-partie-retour"></div>
        <div class="ph-partie-aide${mode === 'cours' ? ' hidden' : ''}"><button type="button" class="btn-small">${libAide}</button></div>`);
      zone.appendChild(d);
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
        reussi(silencieux) { terminer(false, silencieux); },
      };
      const ctx = PARTIES[p.type](d.querySelector('.ph-partie-zone'), p, api);
      bRep.onclick = () => { if (finie) return; ctx.montrer(); etat.vue = true; terminer(true); };
      function terminer(vue, silencieux) {
        finie = true;
        aide.remove();
        etat.details.push({ vue, erreurs: erreursIci });
        const titre = vue ? (mode === 'exercice' ? 'Correction' : 'Réponse') : (erreursIci ? 'C\'est juste.' : 'Juste !');
        const sol = p.solution || p.correction;
        if (sol || vue) {
          ret.innerHTML = `<div class="${vue ? 'callout' : 'callout-success'} er-retour ph-solution"><p><b class="${vue ? '' : 'er-ok'}">${titre}</b></p>${sol ? `<div>${sol}</div>` : ''}</div>`;
        } else if (!silencieux) {
          ret.innerHTML = '<p class="ph-ok">✓ Juste</p>';
        } else ret.innerHTML = '';
        k++;
        if (k < q.parties.length) {
          partie();
          const n = zone.lastElementChild;
          setTimeout(() => n.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 80);
        } else { etat.fini = true; cb.fin(etat.vue ? 0 : etat.erreurs ? 1 : 2, etat); }
      }
    }
    partie();
  }

  /* ============================================================
     SÉRIE DE QUESTIONS NOTÉE SUR 20
     opts = { app, badge, titre, intro, questions: () => [q], suite: { href, label } }
     q = { theme, consigne, enonce, parties, bilan }
     ============================================================ */
  function serie(opts) {
    const app = opts.app;
    let qs = [], idx = 0, score = 0, recap = [];
    const pts = v => `${v} pt${v > 1 ? 's' : ''}`;

    function intro() {
      app.innerHTML = `<div class="er-card"><span class="er-badge">${opts.badge}</span><h2 class="er-titre">${opts.titre}</h2>${opts.intro || ''}
        <div class="cle" style="margin:14px 0"><p><b class="cle-titre">Barème</b> · 10 questions de difficulté croissante, notées sur 20 :</p>
          <ul class="er-liste"><li><b>2 points</b> si tout est juste du premier coup ;</li><li><b>1 point</b> si tu y arrives après au moins une erreur ;</li><li><b>0 point</b> si tu affiches la réponse.</li></ul></div>
        <button type="button" class="btn-primary" data-a="go">Commencer →</button></div>`;
      app.querySelector('[data-a="go"]').onclick = demarrer;
      window.scrollTo(0, 0);
    }
    function demarrer() { qs = opts.questions(); idx = 0; score = 0; recap = []; afficher(); }

    function afficher() {
      if (window.DragDrop) window.DragDrop.cleanupGhosts();
      if (idx >= qs.length) return fin();
      const q = qs[idx];
      window.PH.questionEnCours = q;          // question en cours (utile pour vérifier l'application)
      app.innerHTML = `<div class="er-card"><span class="er-badge">${opts.badge}</span><h2 class="er-titre">${opts.titre}</h2>
          <p class="er-meta">Question ${idx + 1}/${qs.length} · Score : <b data-a="score">${pts(score)}</b></p>
          <div class="progress-bar"><div class="progress-fill" style="width:${Math.round(idx / qs.length * 100)}%"></div></div></div>
        <div class="er-card ph-question">
          ${q.theme ? `<p class="er-q-nom">${q.theme}</p>` : ''}
          ${q.consigne ? `<p class="er-consigne">${q.consigne}</p>` : ''}
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
      const max = qs.length * 2, pct = Math.round(score / max * 100);
      const msg = score === max ? 'Tout est juste : bravo !' : pct >= 70 ? 'Très bien ! Encore un peu d\'entraînement pour le sans-faute.'
        : pct >= 50 ? 'Pas mal ! Recommence pour progresser : les questions changent à chaque fois.' : 'Continue à t\'entraîner : relis le cours, puis recommence.';
      app.innerHTML = `<div class="er-card er-fin"><span class="er-badge">${opts.badge}</span><h2 class="er-titre">Série terminée !</h2>
        ${score === max ? '<p class="er-trophee">🏆 Sans-faute !</p>' : ''}
        <div class="er-score">${score} / ${max}</div><p class="er-score-pct">${pct} %</p><p class="er-contexte">${msg}</p>
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

  /* ============================================================
     « À TOI » DANS LES COURS
     Une suite de petites questions sans points ; onFini() quand
     toutes sont réussies (ou leur réponse affichée).
     items = [{ titre, parties: [p] }]
     ============================================================ */
  function aToi(zone, items, onFini) {
    const box = el('div', 'ph-atoi');
    box.innerHTML = '<p class="ph-atoi-t">À toi</p>';
    zone.appendChild(box);
    let i = 0;
    function suivant() {
      if (i >= items.length) { if (onFini) onFini(); return; }
      const it = items[i];
      const d = el('div', 'ph-atoi-q', `${it.titre ? `<p class="ph-atoi-titre">${it.titre}</p>` : ''}<div></div>`);
      box.appendChild(d);
      question(d.lastElementChild, it, { fin() { i++; suivant(); } }, 'cours');
      if (i > 0) setTimeout(() => d.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 80);
    }
    suivant();
    return box;
  }

  /* ============================================================
     COURS PAR ÉTAPES (modèle : module 1 de « Équilibrer une réaction »)
     const cours = new PH.Cours(zone, [ (c) => { … }, … ]);
     Chaque étape reçoit l'objet cours et construit sa carte avec
     cours.carte(titre), cours.ajouter(carte, html), puis appelle
     cours.continuer(carte) pour proposer l'étape suivante.
     ============================================================ */
  function Cours(zone, etapes) {
    this.zone = zone; this.etapes = etapes; this.n = 0;
    this.lancer(0);
  }
  Cours.prototype.carte = function (titre) {
    const c = el('section', 'er-card er-etape');
    c.innerHTML = `<h3 class="cours-titre">${titre}</h3>`;
    this.zone.appendChild(c);
    return c;
  };
  Cours.prototype.ajouter = function (parent, html) {
    const d = el('div', null, html);
    parent.appendChild(d);
    return d;
  };
  Cours.prototype.lancer = function (n) {
    this.n = n;
    return this.etapes[n](this);
  };
  // bouton « Continuer » : affiche l'étape suivante et la fait défiler à l'écran
  Cours.prototype.continuer = function (parent, texte) {
    const moi = this;
    if (this.n + 1 >= this.etapes.length) return;
    const d = this.ajouter(parent, `<div class="er-suite"><button type="button" class="btn-primary">${texte || 'Continuer →'}</button></div>`);
    d.querySelector('button').onclick = () => {
      d.remove();
      const c = moi.lancer(moi.n + 1);
      if (c) setTimeout(() => c.scrollIntoView({ behavior: 'smooth', block: 'start' }), 30);
    };
  };

  /* ---------- Bandeau et menu communs aux modules ---------- */
  const GROUPES = [
    { title: 'Module 1 · La fonction logarithme décimal', items: [
      { key: 'module_1_cours', label: 'Cours : la fonction log' },
      { key: 'module_1_questions', label: 'Questions sur la fonction log' },
    ]},
    { title: 'Module 2 · Définition du pH', items: [
      { key: 'module_2_cours', label: 'Cours : pH et [H₃O⁺]' },
      { key: 'module_2_questions', label: 'Questions sur le pH' },
    ]},
    { title: 'Module 3 · Exercices', items: [
      { key: 'module_3', label: "Exercices d'entraînement" },
    ]},
  ];
  function menu(cle) {
    const n = window.AppNav.init({
      appName: 'pH', portalHref: '../../index.html', portalLabel: 'Toutes les applications',
      onHome: () => { window.location.href = '../index.html'; },
      onNavigate: key => { window.location.href = key + '.html'; },
      groups: GROUPES,
    });
    n.setActive(cle);
    const g = GROUPES.find(x => x.items.some(m => m.key === cle));
    const item = g && g.items.find(m => m.key === cle);
    n.setTitle(item ? `${g.title.split(' · ')[0]} · ${item.label}` : null);
    return n;
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
     COURBE DE LA FONCTION log (SVG)
     opts = { xmax: 11, ymin: -2, ymax: 1.3, w: 600, h: 300, reperes: true }
     Renvoie { svg (HTML), px(x), py(y) } pour placer d'autres éléments.
     ============================================================ */
  function repere(opts) {
    const o = Object.assign({ xmin: 0, xmax: 11, ymin: -2, ymax: 1.4, w: 620, h: 300, m: { g: 34, d: 18, h: 16, b: 26 } }, opts);
    const L = o.w - o.m.g - o.m.d, H = o.h - o.m.h - o.m.b;
    const px = x => o.m.g + (x - o.xmin) / (o.xmax - o.xmin) * L;
    const py = y => o.m.h + (o.ymax - y) / (o.ymax - o.ymin) * H;
    return Object.assign(o, { px, py, L, H });
  }
  function courbeLog(opts) {
    const o = repere(opts);
    const { px, py } = o;
    let g = '';
    // quadrillage
    for (let x = Math.ceil(o.xmin); x <= o.xmax; x++) g += `<line x1="${px(x)}" y1="${py(o.ymax)}" x2="${px(x)}" y2="${py(o.ymin)}" class="ph-grille"/>`;
    for (let y = Math.ceil(o.ymin); y <= o.ymax; y++) g += `<line x1="${px(o.xmin)}" y1="${py(y)}" x2="${px(o.xmax)}" y2="${py(y)}" class="ph-grille"/>`;
    // axes
    g += `<line x1="${px(o.xmin)}" y1="${py(0)}" x2="${px(o.xmax) + 8}" y2="${py(0)}" class="ph-axe" marker-end="url(#ph-fl)"/>`;
    g += `<line x1="${px(0)}" y1="${py(o.ymin)}" x2="${px(0)}" y2="${py(o.ymax) - 8}" class="ph-axe" marker-end="url(#ph-fl)"/>`;
    for (let x = Math.ceil(o.xmin); x <= o.xmax; x++) if (x) g += `<text x="${px(x)}" y="${py(0) + 17}" class="ph-graduation" text-anchor="middle">${x}</text>`;
    for (let y = Math.ceil(o.ymin); y <= o.ymax; y++) g += `<text x="${px(0) - 7}" y="${py(y) + 4}" class="ph-graduation" text-anchor="end">${String(y).replace('-', MOINS)}</text>`;
    g += `<text x="${px(o.xmax) + 4}" y="${py(0) - 8}" class="ph-axe-nom" text-anchor="end">x</text>`;
    g += `<text x="${px(0) + 8}" y="${py(o.ymax) + 6}" class="ph-axe-nom">log(x)</text>`;
    // courbe
    let d = '';
    const x0 = Math.pow(10, o.ymin - .15);
    for (let i = 0; i <= 400; i++) {
      const t = Math.log10(x0) + (Math.log10(o.xmax) - Math.log10(x0)) * i / 400;
      const x = Math.pow(10, t);
      d += (i ? 'L' : 'M') + px(x).toFixed(1) + ',' + py(Math.log10(x)).toFixed(1);
    }
    g += `<path d="${d}" class="ph-courbe"/>`;
    if (o.reperes) {
      g += `<line x1="${px(0)}" y1="${py(1)}" x2="${px(10)}" y2="${py(1)}" class="ph-pointille"/><line x1="${px(10)}" y1="${py(1)}" x2="${px(10)}" y2="${py(0)}" class="ph-pointille"/>`;
      g += `<circle cx="${px(1)}" cy="${py(0)}" r="5" class="ph-point"/><circle cx="${px(10)}" cy="${py(1)}" r="5" class="ph-point"/>`;
    }
    o.svg = `<svg viewBox="0 0 ${o.w} ${o.h}" class="ph-graphe" role="img" aria-label="Courbe de la fonction logarithme décimal">
      <defs><marker id="ph-fl" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="ph-fleche"/></marker></defs>
      <clipPath id="ph-clip"><rect x="${px(o.xmin)}" y="${py(o.ymax)}" width="${o.L}" height="${o.H}"/></clipPath>
      ${g}<g data-x="dyn"></g></svg>`;
    return o;
  }

  window.PH = Object.assign(window.PH || {}, {
    fmt, sci, p10, lire, proche, decomposer, H3O, C0, UNITE, MOINS, diagPH, diagC,
    el, secouer, melanger, hasard, entre, champ, champsSci, PARTIES, question, serie, aToi, Cours, menu, GROUPES, confettis,
    repere, courbeLog,
  });
})();
