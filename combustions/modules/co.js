/* ============================================================
   Moteur de l'application « Combustions » (Terminale STI2D)

   CO.COMB                combustibles : nom, pouvoir calorifique (MJ/kg)
   CO.coefs(f)            nombres stœchiométriques de la combustion de f
   CO.M(f)                masse molaire (C = 12, H = 1, O = 16, N = 14 g/mol)
   CO.calculM(f)          calcul détaillé de la masse molaire
   CO.equation(f)         équation de combustion équilibrée (HTML)
   CO.fmt, CO.lire        écriture et lecture des nombres (virgule)
   CO.partie(type, …)     parties de question : 'choix', 'valeur', 'especes', 'equilibrer'
   CO.serie(options)      série de questions notée sur 20
   CO.indiceCombustion    indice pour équilibrer (ordre C, puis H, puis O)
   CO.menu(cle)           bandeau et menu communs aux modules

   Les réactions sont affichées avec ER.Reaction (application
   « Équilibrer une réaction ») pour garder les mêmes commandes.
   ============================================================ */
(function () {
  'use strict';

  const ER = window.ER, MOL = window.MOL;
  const fH = MOL.formuleHTML;

  /* ============================================================
     COMBUSTIBLES (pouvoir calorifique en MJ/kg, valeurs arrondies)
     ============================================================ */
  const COMB = {
    CH4: { nom: 'méthane', PC: 50 },
    C2H6: { nom: 'éthane', PC: 47.5 },
    C3H8: { nom: 'propane', PC: 46 },
    C4H10: { nom: 'butane', PC: 45 },
    C5H12: { nom: 'pentane', PC: 45 },
    C6H14: { nom: 'hexane', PC: 45 },
    C7H16: { nom: 'heptane', PC: 45 },
    C8H18: { nom: 'octane', PC: 44 },
    C2H4: { nom: 'éthylène', PC: 47 },
    C2H2: { nom: 'acétylène', PC: 48 },
    C3H6: { nom: 'propène', PC: 46 },
    C6H6: { nom: 'benzène', PC: 40 },
    CH4O: { nom: 'méthanol', PC: 20 },
    C2H6O: { nom: 'éthanol', PC: 28.8 },
    C3H8O: { nom: 'propanol', PC: 31 },
    C4H10O: { nom: 'butanol', PC: 33 },
    C3H6O: { nom: 'acétone', PC: 29 },
    C6H12O6: { nom: 'glucose', PC: 15.6 },
    C12H22O11: { nom: 'saccharose', PC: 16.5 },
  };
  const MASSES = { C: 12, H: 1, O: 16, N: 14 };

  // nombres stœchiométriques [combustible, O2, CO2, H2O] (plus petits entiers)
  function coefs(f) {
    const n = el => MOL.nb(f, el), x = n('C'), y = n('H'), z = n('O');
    for (let k = 1; k <= 4; k++) {
      const o2 = k * (2 * x + y / 2 - z) / 2, h2o = k * y / 2;
      if (Number.isInteger(o2) && Number.isInteger(h2o)) return [k, o2, k * x, h2o];
    }
    return null;
  }
  const M = f => MOL.analyser(f).reduce((s, a) => s + a.n * MASSES[a.el], 0);
  // « M(C2H6O) = 2 × 12 + 6 × 1 + 16 = 46 g/mol »
  function calculM(f, sansResultat) {
    const t = MOL.analyser(f).map(a => (a.n > 1 ? `${a.n} × ${MASSES[a.el]}` : `${MASSES[a.el]}`)).join(' + ');
    return `M(${fH(f)}) = ${t}${sansResultat ? '' : ` = ${M(f)} g/mol`}`;
  }
  const equation = (f, c) => ER.equationHTML([f, 'O2'], ['CO2', 'H2O'], c || coefs(f));

  /* ============================================================
     NOMBRES : écriture française et lecture d'une saisie
     ============================================================ */
  const net = v => Math.round(v * 1e9) / 1e9;
  function fmt(v) {
    v = net(v);
    const s = Number.isInteger(v) || Math.abs(v) >= 1000 ? String(Math.round(v * 100) / 100) : String(+v.toPrecision(4));
    let [e, d] = s.split('.');
    e = e.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return d ? e + ',' + d : e;
  }
  function lire(s) {
    const t = String(s).trim().replace(/[\s  ]/g, '').replace(',', '.');
    return /^(\d+\.?\d*|\.\d+)$/.test(t) ? parseFloat(t) : NaN;
  }
  const egal = (a, b, tol) => Math.abs(a - b) <= (tol == null ? .02 : tol) * Math.abs(b) + 1e-9;

  /* ============================================================
     UNITÉS
     ============================================================ */
  const UNITES = {
    mol: { t: 'mol', g: 'n', f: 1 },
    g: { t: 'g', g: 'm', f: 1 },
    kg: { t: 'kg', g: 'm', f: 1000 },
    gmol: { t: 'g/mol', g: 'M', f: 1 },
    MJ: { t: 'MJ', g: 'E', f: 1 },
    kJ: { t: 'kJ', g: 'E', f: 1e-3 },
    MJkg: { t: 'MJ/kg', g: 'PC', f: 1 },
  };
  const GRANDEURS = { n: 'une quantité de matière', m: 'une masse', M: 'une masse molaire', E: 'une énergie', PC: 'un pouvoir calorifique' };

  function el(tag, cls, html) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }
  function secouer(e) { e.classList.remove('er-secoue'); void e.offsetWidth; e.classList.add('er-secoue'); }

  /* ============================================================
     PARTIES DE QUESTION
     Chaque partie reçoit (zone, p, api) et renvoie { montrer() }.
     api.reussi() · api.erreur(indice) · api.effacer() · api.fini()
     ============================================================ */

  // Choix parmi des boutons : p.options [{ id, label }], p.bonne, p.indice ou p.indices[id]
  function pChoix(zone, p, api) {
    const box = el('div', 'co-choix' + (p.colonne ? ' co-choix-col' : ''));
    zone.appendChild(box);
    const bs = p.options.map(o => {
      const b = el('button', 'btn-secondary', o.label);
      b.type = 'button';
      box.appendChild(b);
      b.onclick = () => {
        if (api.fini() || b.disabled) return;
        if (o.id === p.bonne) {
          b.classList.add('juste');
          bs.forEach(x => { x.disabled = true; });
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

  // Valeur numérique et unité : p.label, p.valeur, p.unite, p.unites (choix proposés), p.uniteFixe, p.tol, p.indice
  function pValeur(zone, p, api) {
    const U = UNITES[p.unite], liste = p.unites || ['mol', 'g', 'gmol'];
    const d = el('div', 'co-valeur', `<span class="co-lab">${p.label}</span>
      <input type="text" class="co-champ" inputmode="decimal" autocomplete="off" aria-label="Valeur">
      ${p.uniteFixe ? `<span class="co-unite-fixe">${U.t}</span>` : '<span class="co-unites" role="group" aria-label="Unité"></span>'}`);
    zone.appendChild(d);
    const champ = d.querySelector('input');
    let choisie = p.uniteFixe ? p.unite : null;
    const bUnites = p.uniteFixe ? [] : liste.map(u => {
      const b = el('button', 'co-u', UNITES[u].t);
      b.type = 'button';
      d.querySelector('.co-unites').appendChild(b);
      b.onclick = () => {
        if (api.fini()) return;
        choisie = u;
        bUnites.forEach(x => x.classList.toggle('actif', x === b));
        api.effacer();
      };
      return b;
    });
    const a = el('div', 'er-actions co-actions-partie', '<button type="button" class="btn-primary">Valider</button>');
    zone.appendChild(a);
    const bVal = a.querySelector('button');
    champ.addEventListener('input', () => api.effacer());
    champ.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); valider(); } });
    function valider() {
      if (api.fini()) return;
      const v = lire(champ.value);
      if (isNaN(v)) { secouer(champ); champ.focus(); return; }
      if (!choisie) { api.message('Choisis aussi l\'unité du résultat.'); secouer(d.querySelector('.co-unites')); return; }
      const C = UNITES[choisie];
      if (C.g === U.g && egal(v * C.f, p.valeur * U.f, p.tol)) { fermer(); api.reussi(); return; }
      if (C.g !== U.g) {
        api.erreur(egal(v, p.valeur, p.tol)
          ? `Le nombre est juste, mais pas l'unité : ${GRANDEURS[U.g]} s'exprime en <b>${U.t}</b>${U.g === 'm' ? ' (ou en kg)' : U.g === 'E' ? ' (ou en kJ)' : ''}.`
          : `Vérifie l'unité : on cherche ${GRANDEURS[U.g]}.${p.indice ? ' ' + p.indice : ''}`);
        return;
      }
      api.erreur(p.indice || 'Vérifie ton calcul.');
    }
    bVal.onclick = valider;
    function fermer() { champ.disabled = true; bVal.disabled = true; bUnites.forEach(b => { b.disabled = true; }); }
    return {
      montrer() {
        champ.value = fmt(p.valeur);
        choisie = p.unite;
        bUnites.forEach((b, k) => b.classList.toggle('actif', liste[k] === p.unite));
        fermer();
      },
      focus() { champ.focus({ preventScroll: true }); },
    };
  }

  // Espèces d'une combustion : combustible + ? → ? + ?
  function pEspeces(zone, p, api) {
    const CHOIX = window.ER.melanger(['O2', 'CO2', 'H2O', 'CO', 'H2', 'C']);
    const slots = [null, null, null];
    const eq = el('div', 'co-esp-eq');
    zone.appendChild(eq);
    const pal = el('div', 'co-esp-pal');
    zone.appendChild(pal);
    const chips = CHOIX.map(f => {
      const b = el('button', 'co-chip', fH(f));
      b.type = 'button';
      pal.appendChild(b);
      b.onclick = () => {
        if (api.fini() || slots.includes(f)) return;
        const k = slots.indexOf(null);
        if (k < 0) return;
        slots[k] = f; dessiner(); api.effacer();
      };
      return { b, f };
    });
    const a = el('div', 'er-actions co-actions-partie', '<button type="button" class="btn-primary">Valider</button>');
    zone.appendChild(a);
    const bVal = a.querySelector('button');
    let fige = false;
    function dessiner() {
      const s = k => `<button type="button" class="co-slot${slots[k] ? ' plein' : ''}" data-k="${k}">${slots[k] ? fH(slots[k]) : '?'}</button>`;
      eq.innerHTML = `<span class="co-esp-f">${fH(p.comb)}</span><span class="co-op">+</span>${s(0)}<span class="co-op">→</span>${s(1)}<span class="co-op">+</span>${s(2)}`;
      eq.querySelectorAll('.co-slot').forEach(b => {
        b.disabled = fige;
        b.onclick = () => { if (api.fini() || fige) return; slots[+b.dataset.k] = null; dessiner(); api.effacer(); };
      });
      chips.forEach(c => c.b.classList.toggle('pris', slots.includes(c.f)));
    }
    dessiner();
    bVal.onclick = () => {
      if (api.fini()) return;
      if (slots.includes(null)) { secouer(eq); api.message('Complète les trois cases : touche une espèce pour la placer, touche une case pour la vider.'); return; }
      const ok = slots[0] === 'O2' && [slots[1], slots[2]].sort().join() === 'CO2,H2O';
      if (ok) { fermer(); api.reussi(); return; }
      api.erreur(slots[0] !== 'O2'
        ? 'Un combustible brûle toujours en réagissant avec le <b>dioxygène de l\'air</b>.'
        : 'Une combustion complète produit toujours les deux mêmes espèces : du <b>dioxyde de carbone</b> et de l\'<b>eau</b>.');
    };
    function fermer() { fige = true; dessiner(); bVal.disabled = true; chips.forEach(c => { c.b.disabled = true; }); }
    return { montrer() { slots[0] = 'O2'; slots[1] = 'CO2'; slots[2] = 'H2O'; fermer(); } };
  }

  // Indice pour équilibrer une combustion : C, puis H, puis O (avec O2)
  const pgcd = (a, b) => (b ? pgcd(b, a % b) : a);
  function indiceCombustion(f, c) {
    const v = ER.verifier([f, 'O2'], ['CO2', 'H2O'], c);
    if (v.equilibree) return `La réaction est équilibrée, mais avec des nombres trop grands : divise tous les nombres stœchiométriques par ${c.reduce(pgcd)}.`;
    const B = e => v.bilan.find(x => x.el === e);
    const C = B('C'), H = B('H'), O = B('O');
    if (C.r !== C.p) return `Commence par le <b>carbone C</b> : ${C.r} atome${C.r > 1 ? 's' : ''} dans les réactifs, ${C.p} dans les produits. Règle le nombre devant ${fH('CO2')}.`;
    if (H.r !== H.p) return `Carbone : c'est bon. Ensuite l'<b>hydrogène H</b> : ${H.r} atomes dans les réactifs, ${H.p} dans les produits. Règle le nombre devant ${fH('H2O')}.`;
    const apport = O.r - 2 * c[1], besoin = (O.p - apport) / 2;
    if (!Number.isInteger(besoin)) {
      return `Carbone et hydrogène : c'est bon. Pour l'<b>oxygène O</b>, il faudrait ${fmt(besoin)} ${fH('O2')} : c'est impossible, on ne coupe pas une molécule en deux. <b>Multiplie tous les nombres stœchiométriques par 2</b>, puis termine par ${fH('O2')}.`;
    }
    return `Carbone et hydrogène : c'est bon. Termine par l'<b>oxygène O</b> : ${O.p} atomes dans les produits${apport ? `, dont ${apport} apporté${apport > 1 ? 's' : ''} par le combustible` : ''}. Règle le nombre devant ${fH('O2')}.`;
  }

  // Équilibrer une combustion : p.comb, p.comptes (nombre d'atomes affiché)
  function pEquilibrer(zone, p, api) {
    const d = el('div');
    zone.appendChild(d);
    const r = new ER.Reaction(d, { reactifs: [p.comb, 'O2'], produits: ['CO2', 'H2O'], comptes: !!p.comptes, onChange: () => api.effacer() });
    const a = el('div', 'er-actions co-actions-partie', '<button type="button" class="btn-primary">Valider</button>');
    zone.appendChild(a);
    const bVal = a.querySelector('button');
    bVal.onclick = () => {
      if (api.fini()) return;
      const v = r.verifier();
      if (v.equilibree && v.minimale) { r.activer(false); bVal.disabled = true; api.reussi(); return; }
      secouer(d);
      api.erreur(indiceCombustion(p.comb, r.coefs));
    };
    return { montrer() { r.fixer(coefs(p.comb)); r.activer(false); bVal.disabled = true; } };
  }

  const PARTIES = { choix: pChoix, valeur: pValeur, especes: pEspeces, equilibrer: pEquilibrer };

  /* ============================================================
     UNE QUESTION : parties successives
     q = { parties: [p], … } ; p = { type, q (texte), solution (HTML affiché après), … }
     cb.fin(points) : 2 sans erreur, 1 après au moins une erreur, 0 si une réponse est affichée
     ============================================================ */
  function question(zone, q, cb) {
    const etat = { erreurs: 0, vue: false, fini: false };
    let k = 0;
    function partie() {
      const p = q.parties[k];
      window.CO.partie = p;                 // partie en cours (utile pour vérifier l'application)
      const d = el('div', 'co-partie', `${p.q ? `<p class="co-partie-q">${p.q}</p>` : ''}<div class="co-partie-zone"></div><div class="co-partie-retour"></div>
        <div class="co-partie-aide"><button type="button" class="btn-small">Afficher la réponse</button></div>`);
      zone.appendChild(d);
      const ret = d.querySelector('.co-partie-retour'), bRep = d.querySelector('.co-partie-aide button');
      let finie = false, erreursIci = 0;
      const api = {
        fini: () => finie || etat.fini,
        effacer() { if (!finie) ret.innerHTML = ''; },
        message(h) { ret.innerHTML = `<p class="co-msg">${h}</p>`; },
        erreur(h) {
          etat.erreurs++; erreursIci++;
          ret.innerHTML = `<div class="callout-danger er-retour"><p><b class="er-ko">Ce n'est pas ça.</b> ${h || ''}</p>${erreursIci >= 2 ? '<p class="er-petit">Corrige ta réponse, ou affiche la réponse (0 point pour cette question).</p>' : ''}</div>`;
        },
        reussi() { terminer(false); },
      };
      const ctx = PARTIES[p.type](d.querySelector('.co-partie-zone'), p, api);
      bRep.onclick = () => { if (finie) return; ctx.montrer(); etat.vue = true; terminer(true); };
      function terminer(vue) {
        finie = true;
        bRep.parentNode.remove();
        ret.innerHTML = p.solution || vue
          ? `<div class="${vue ? 'callout' : 'callout-success'} er-retour">${vue ? '<p><b>Réponse.</b></p>' : '<p><b class="er-ok">Juste !</b></p>'}${p.solution ? `<p>${p.solution}</p>` : ''}</div>`
          : '<p class="co-ok">✓ Juste</p>';
        k++;
        if (k < q.parties.length) { partie(); const n = zone.lastElementChild; if (n && k > 0) setTimeout(() => n.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 60); }
        else { etat.fini = true; cb.fin(etat.vue ? 0 : etat.erreurs ? 1 : 2, etat); }
      }
    }
    partie();
  }

  /* ============================================================
     SÉRIE DE QUESTIONS NOTÉE SUR 20
     opts = { app, badge, titre, intro, questions: () => [q], nombre, suite: { href, label },
              contexte(q, idx) (carte affichée au-dessus de chaque question), recommencer, finTitre }
     q = { theme, consigne, enonce, parties, bilan }
     ============================================================ */
  function serie(opts) {
    const app = opts.app, nombre = opts.nombre || 10;
    let qs = [], idx = 0, score = 0, recap = [];
    const pts = v => `${String(v).replace('.', ',')} pt${v > 1 ? 's' : ''}`;

    function intro() {
      app.innerHTML = `<div class="er-card"><span class="er-badge">${opts.badge}</span><h2 class="er-titre">${opts.titre}</h2>${opts.intro || ''}
        <div class="cle" style="margin:14px 0"><p><b class="cle-titre">Barème</b> · ${opts.bareme || `${nombre} questions de difficulté croissante${nombre === 10 ? ', notées sur 20' : ''}`} :</p>
          <ul class="er-liste"><li><b>2 points</b> si tout est juste du premier coup ;</li><li><b>1 point</b> si tu y arrives après au moins une erreur ;</li><li><b>0 point</b> si tu affiches une réponse${nombre === 10 ? '' : ` ;</li><li>à la fin, le total est <b>ramené sur 20</b>`}.</li></ul></div>
        <button type="button" class="btn-primary" data-a="go">${opts.commencer || 'Commencer →'}</button></div>`;
      app.querySelector('[data-a="go"]').onclick = demarrer;
      window.scrollTo(0, 0);
    }
    function demarrer() { qs = opts.questions(); idx = 0; score = 0; recap = []; afficher(); }

    function afficher() {
      if (idx >= qs.length) return fin();
      const q = qs[idx];
      window.CO.question = q;               // question en cours (utile pour vérifier l'application)
      app.innerHTML = `<div class="er-card"><span class="er-badge">${opts.badge}</span><h2 class="er-titre">${opts.titre}</h2>
          <p class="er-meta">${opts.etiquette || 'Question'} ${idx + 1}/${qs.length} · Score : <b data-a="score">${pts(score)}</b></p>
          <div class="progress-bar"><div class="progress-fill" style="width:${Math.round(idx / qs.length * 100)}%"></div></div></div>
        ${opts.contexte ? `<div class="er-card co-contexte">${opts.contexte(q, idx)}</div>` : ''}
        <div class="er-card co-question">
          ${q.theme ? `<p class="er-q-nom">${q.theme}</p>` : ''}
          ${q.consigne ? `<p class="er-consigne">${q.consigne}</p>` : ''}
          ${q.enonce ? `<div class="co-enonce">${q.enonce}</div>` : ''}
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
          const titre = p === 2 ? 'Bravo, tout est juste du premier coup !' : p === 1 ? 'C\'est juste, après au moins une erreur.' : 'Une réponse a été affichée.';
          app.querySelector('[data-a="retour"]').innerHTML = `<div class="${p ? 'callout-success' : 'callout'} er-retour co-bilan"><p><b class="${p ? 'er-ok' : ''}">${titre}</b> +${pts(p)}</p>${q.bilan ? `<p>${q.bilan}</p>` : ''}</div>`;
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
      const max = qs.length * 2, note = Math.round(score / max * 40) / 2, pct = Math.round(score / max * 100);
      window.SOM.marquer({ note });                                 // meilleure note sur 20 (sommaire, accueil)
      const msg = score === max ? 'Tout est juste : bravo !' : pct >= 70 ? 'Très bien ! Encore un peu d\'entraînement pour le sans-faute.'
        : pct >= 50 ? 'Pas mal ! Recommence pour progresser.' : 'Continue à t\'entraîner : relis bien les corrections.';
      app.innerHTML = `<div class="er-card er-fin"><span class="er-badge">${opts.badge}</span><h2 class="er-titre">${opts.finTitre || 'Série terminée !'}</h2>
        ${score === max ? '<p class="er-trophee">🏆 Sans-faute !</p>' : ''}
        <div class="er-score">${String(note).replace('.', ',')} / 20</div><p class="er-score-pct">${max === 20 ? '' : `${String(score).replace('.', ',')} points sur ${max} · `}${pct} %</p><p class="er-contexte">${msg}</p>
        <div class="er-recap">${recap.map(r => `<div class="${r.p === 2 ? 'ok' : r.p === 1 ? 'moyen' : 'ko'}">${opts.recapNom || 'Q'}${r.n}<b>${r.p}/2</b></div>`).join('')}</div>
        <div class="er-actions" style="justify-content:center"><button type="button" class="btn-secondary" data-a="re">${opts.recommencer || '↺ Recommencer avec d\'autres questions'}</button>
        ${opts.suite ? `<a class="btn-primary" style="text-decoration:none" href="${opts.suite.href}">${opts.suite.label}</a>` : ''}</div></div>`;
      app.querySelector('[data-a="re"]').onclick = opts.sansIntro || opts.direct ? demarrer : intro;
      window.scrollTo(0, 0);
      if (score === max) ER.confettis();
    }
    if (opts.sansIntro) demarrer(); else intro();
  }

  /* ---------- Plan de l'application et navigation (voir assets/sommaire.js) ---------- */
  const PLAN = [
    { n: 1, titre: 'L\'exercice type et la méthode', desc: 'Masse de combustible → quantités de matière → masse de CO<sub>2</sub>, énergie libérée', fiche: 'fiche_1',
      parties: [{ nom: 'La méthode', cours: 'module_1' }] },
    { n: 2, titre: 'Équilibrer une combustion', desc: 'Test de départ, méthode C, H puis O, exemples guidés, entraînement noté', fiche: 'fiche_2',
      parties: [{ nom: 'Équilibrer une combustion', cours: 'module_2', noms: { cours: 'Cours et entraînement' } }] },
    { n: 3, titre: 'Masse, quantité de matière, masse molaire', desc: 'n = m / M, masse molaire d\'une molécule', fiche: 'fiche_3',
      parties: [{ nom: 'Masse et quantité de matière', cours: 'module_3_cours', questions: 'module_3' }] },
    { n: 4, titre: 'Les relations stœchiométriques', desc: 'Quantités consommées et formées, proportionnelles aux nombres stœchiométriques', fiche: 'fiche_4',
      parties: [{ nom: 'Relations stœchiométriques', questions: 'module_4', noms: { questions: 'Cours rapide et questions' } }] },
    { n: 5, titre: 'L\'énergie libérée', desc: 'Pouvoir calorifique, E = PC × m', fiche: 'fiche_5',
      parties: [{ nom: 'L\'énergie libérée', questions: 'module_5', noms: { questions: 'Cours rapide et questions' } }] },
    { n: 6, titre: 'L\'exemple du cours, pas à pas', desc: 'L\'exercice type résolu étape par étape, puis un deuxième exemple',
      parties: [{ nom: 'L\'exemple du cours', exemple: 'module_6' }] },
    { n: 7, titre: 'Exercices complets', desc: '10 exercices différents, étape par étape', exercices: 'module_7', exNom: 'Exercices complets' },
  ];
  // (co.js est chargé après er.js : cette configuration remplace la sienne)
  window.SOM.init({ nom: 'Combustions', id: 'combustions', plan: PLAN });
  const menu = cle => window.SOM.menu(cle);
  const accueil = zone => window.SOM.accueil(zone);

  const hasard = t => t[Math.floor(Math.random() * t.length)];

  /* ============================================================
     SCHÉMA DE LA MÉTHODE (comme la fiche de cours)
     f : combustible, m : masse brûlée (g), autres : n(O2) et n(H2O) aussi
     Une colonne par espèce de l'équation ; flèches pleines pour le calcul
     de la masse de CO2, en pointillés pour les autres espèces.
     ============================================================ */
  function schema(f, m, autres) {
    const c = coefs(f), esp = [f, 'O2', 'CO2', 'H2O'], n = m / M(f);
    const ns = c.map(k => n * k / c[0]);
    const cell = (k, html, cls) => `<div class="co-sch-c${cls ? ' ' + cls : ''}" style="grid-column:${k + 1}">${html}</div>`;
    const val = (lab, v) => `<span class="co-sch-lab">${lab}</span><b>${v}</b>`;
    const fl = (ks, pointilles) => ks.slice().sort().map(k => cell(k, '↓', 'co-sch-fl' + (pointilles && pointilles.includes(k) ? ' pointille' : ''))).join('');
    const autresK = autres ? [1, 3] : [];
    const frac = (a, b) => `<span class="co-frac"><span>${a}</span><span>${b}</span></span>`;
    // signe placé entre deux colonnes (« + », « → » ou « = »), pour que chaque espèce reste centrée dans sa colonne
    const op = k => (k === 0 ? '' : ` data-op="${k === 2 ? '→' : '+'}"`);
    return `<div class="co-schema">
      ${esp.map((e, k) => `<div class="co-sch-c co-sch-eq" style="grid-column:${k + 1}"${op(k)}><span class="co-sch-f">${c[k] > 1 ? `<span class="er-eq-c">${c[k]}</span>` : ''}${fH(e)}</span></div>`).join('')}
      ${fl([0])}
      ${cell(0, val(`m(${fH(f)})`, `${fmt(m)} g`), 'co-sch-v')}
      ${fl([0])}
      ${cell(0, val(`n = m / M`, `${fmt(n)} mol`), 'co-sch-v')}
      ${fl([0].concat(autresK, [2]), autresK)}
      ${esp.map((e, k) => `<div class="co-sch-c co-sch-rel" style="grid-column:${k + 1}"${k ? ' data-op="="' : ''}>${frac(`n(${fH(e)})`, c[k])}</div>`).join('')}
      ${fl([2].concat(autresK), autresK)}
      ${[2].concat(autresK).sort().map(k => cell(k, val(`n(${fH(esp[k])})`, `${fmt(ns[k])} mol`), 'co-sch-v' + (k === 2 ? '' : ' pointille'))).join('')}
      ${fl([2])}
      ${cell(2, val(`m = n × M`, `${fmt(ns[2] * 44)} g`), 'co-sch-v')}
    </div>`;
  }

  window.CO = {
    COMB, MASSES, coefs, M, calculM, equation, fmt, lire, egal, UNITES, PARTIES, question, serie, indiceCombustion, menu, accueil, PLAN,
    hasard, melanger: ER.melanger, fH, schema,
  };
})();
