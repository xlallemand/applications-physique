/* ============================================================
   Outils de l'application « Équilibrer une réaction »
     ER.analyser      formule brute → nombre de chaque atome
                      (indices, parenthèses : Cu(OH)2, CH2=C(CH3)2…)
     ER.formuleHTML   formule avec indices en <sub>
     ER.molecule      dessin SVG d'une molécule en boules colorées
     ER.boules        atomes d'une espèce, en boules regroupées par molécule
     ER.selecteur     sélecteur de nombre : flèche +1 au-dessus, −1 au-dessous
     ER.Reaction      réaction interactive (sélecteurs, formules, dessins)
     ER.verifier      réaction équilibrée ? plus petits entiers ?
     ER.calculHTML    calcul détaillé du nombre d'atomes (explications)
     ER.Comptage      compter les atomes d'une espèce (modules 1 et 2)
     ER.indice        indice pour équilibrer (premier élément non conservé)
     ER.diagComptage  diagnostic d'une erreur de comptage (nombre stœchiométrique oublié…)
     ER.partieCompter, ER.partieRegler, ER.partieEquilibrer
                      outils des « À toi » des cours (assets/cours.js, partie 'perso')
     ER.interrupteur  interrupteur « Afficher les molécules et les atomes »
     ER.entrainement  entraînement noté sur 20 (modules 3 et 4)
     ER.menu          bandeau et menu communs aux modules
     ER.confettis     pluie de confettis (sans-faute)
   ============================================================ */
(function () {
  'use strict';

  // Formules, dessins des molécules et sélecteur à flèches : fichier commun assets/molecules.js
  const { ELEMENTS, analyser, nb, formuleHTML, molecule, boules, bouleHTML, selecteur } = window.MOL;

  /* ============================================================
     RÉACTION INTERACTIVE
     cfg = {
       reactifs: ['CH4', 'O2'], produits: ['CO2', 'H2O'],
       coefs: [1, 1, 1, 1],        valeurs de départ
       max: 30,
       comptes: true,              nombre de chaque atome écrit sous la formule (« 4 H »)
       detail: false,              écrit aussi le calcul (« 2 × 2 = 4 H »)
       dessins: true,              molécules et atomes en boules sous la formule
       selecteurs: true,           false : nombres fixes, sans flèches (le nombre 1 n'est pas écrit)
       onChange(coefs)
     }
     produits peut être vide : une ou plusieurs espèces seules, sans flèche.
     ============================================================ */
  function Reaction(el, cfg) {
    this.el = el;
    this.cfg = Object.assign({ comptes: false, detail: false, dessins: false, max: 30, selecteurs: true }, cfg);
    this.especes = cfg.reactifs.concat(cfg.produits);
    this.coefs = (cfg.coefs || this.especes.map(() => 1)).slice();
    this.construire();
  }

  Reaction.prototype.construire = function () {
    const moi = this, c = this.cfg, nR = c.reactifs.length;
    this.el.innerHTML = '';
    this.el.classList.add('er-reaction');
    const membres = [document.createElement('div'), document.createElement('div')];
    membres.forEach(m => { m.className = 'er-membre'; });
    this.sels = []; this.zones = [];
    this.especes.forEach((f, k) => {
      // le signe « + » (ou la flèche) est groupé avec l'espèce qui le suit :
      // sur un écran étroit, il passe à la ligne avec elle
      const m = document.createElement('div');
      m.className = 'er-groupe';
      membres[k < nR ? 0 : 1].appendChild(m);
      if (k === nR) m.insertAdjacentHTML('beforeend', '<div class="er-op er-fleche">→</div>');
      else if (k !== 0) m.insertAdjacentHTML('beforeend', '<div class="er-op">+</div>');
      const b = document.createElement('div');
      b.className = 'er-espece';
      b.innerHTML = `<div class="er-tete"><span class="er-sel-place"></span><span class="er-formule">${formuleHTML(f)}</span></div>` +
        `<div class="er-comptes"></div><div class="er-dessin"></div>`;
      if (c.selecteurs) {
        const sel = selecteur({
          valeur: moi.coefs[k], min: 1, max: c.max, label: 'le nombre stœchiométrique de ' + f,
          onChange: v => { moi.coefs[k] = v; moi.majEspece(k); if (c.onChange) c.onChange(moi.coefs.slice()); },
        });
        b.querySelector('.er-sel-place').replaceWith(sel.el);
        moi.sels.push(sel);
      } else {
        b.classList.add('er-espece-fixe');
        b.querySelector('.er-sel-place').outerHTML = moi.coefs[k] > 1 ? `<span class="er-coef-fixe">${moi.coefs[k]}</span>` : '';
      }
      m.appendChild(b);
      moi.zones.push(b);
    });
    this.el.appendChild(membres[0]);
    if (c.produits.length) this.el.appendChild(membres[1]);
    this.especes.forEach((_, k) => moi.majEspece(k));
  };

  Reaction.prototype.majEspece = function (k) {
    const f = this.especes[k], coef = this.coefs[k], z = this.zones[k], c = this.cfg;
    const cpt = z.querySelector('.er-comptes'), des = z.querySelector('.er-dessin');
    cpt.classList.toggle('hidden', !c.comptes);
    if (c.comptes) {
      cpt.innerHTML = analyser(f).map(a => `<div class="er-compte" data-el="${a.el}">` +
        (c.detail ? `<span class="er-calc">${coef} × ${a.n} = </span>` : '') +
        `<b>${coef * a.n}</b>&nbsp;${a.el}</div>`).join('');
    }
    des.classList.toggle('hidden', !c.dessins);
    if (c.dessins) {
      des.innerHTML = `<div class="er-mols">${molecule(f).repeat(coef)}</div><div class="er-atomes">${boules(f, coef)}</div>`;
    }
  };

  Reaction.prototype.options = function (o) {
    Object.assign(this.cfg, o);
    this.especes.forEach((_, k) => this.majEspece(k));
  };
  Reaction.prototype.fixer = function (coefs) {
    this.coefs = coefs.slice();
    this.sels.forEach((s, k) => s.fixer(coefs[k]));
    this.especes.forEach((_, k) => this.majEspece(k));
  };
  Reaction.prototype.activer = function (b) { this.sels.forEach(s => s.activer(b)); };

  Reaction.prototype.verifier = function () { return verifier(this.cfg.reactifs, this.cfg.produits, this.coefs); };

  // Bilan : nombre de chaque atome côté réactifs et côté produits
  Reaction.prototype.bilan = function () { return bilan(this.cfg.reactifs, this.cfg.produits, this.coefs); };

  function bilan(reactifs, produits, coefs) {
    const ordre = [], R = {}, P = {};
    reactifs.concat(produits).forEach((f, k) => {
      analyser(f).forEach(a => {
        if (!ordre.includes(a.el)) ordre.push(a.el);
        const cote = k < reactifs.length ? R : P;
        cote[a.el] = (cote[a.el] || 0) + coefs[k] * a.n;
      });
    });
    return ordre.map(el => ({ el, r: R[el] || 0, p: P[el] || 0 }));
  }

  // Réaction équilibrée ? avec les plus petits entiers ? éléments non conservés
  const pgcd = (a, b) => (b ? pgcd(b, a % b) : a);
  function verifier(reactifs, produits, coefs) {
    const b = bilan(reactifs, produits, coefs);
    const faux = b.filter(e => e.r !== e.p).map(e => e.el);
    return { bilan: b, faux, equilibree: faux.length === 0, minimale: coefs.reduce(pgcd) === 1 };
  }

  // Tableau bilan : nombre de chaque atome dans les réactifs et dans les produits
  function bilanHTML(b, opts) {
    opts = opts || {};
    return `<table class="er-bilan"><thead><tr><th>Atomes</th><th>Réactifs</th><th>Produits</th><th></th></tr></thead><tbody>` +
      b.map(e => {
        const ok = e.r === e.p;
        return `<tr class="${ok ? 'ok' : 'ko'}"><td><span class="er-bilan-el">${opts.boule === false ? '' : bouleHTML(e.el)}${e.el}</span></td>` +
          `<td><b>${e.r}</b> ${e.el}</td><td><b>${e.p}</b> ${e.el}</td><td class="er-bilan-signe">${ok ? '✓' : '✗'}</td></tr>`;
      }).join('') + '</tbody></table>';
  }

  // Écriture d'une équation : « CH4 + 2 O2 → CO2 + 2 H2O » (le nombre 1 n'est pas écrit)
  function equationHTML(reactifs, produits, coefs) {
    const t = (f, k) => (coefs[k] > 1 ? `<span class="er-eq-c">${coefs[k]}</span>&nbsp;` : '') + formuleHTML(f);
    return reactifs.map((f, k) => t(f, k)).join(' + ') + ' → ' + produits.map((f, k) => t(f, k + reactifs.length)).join(' + ');
  }

  // Tirage aléatoire sans remise
  function melanger(t) {
    const a = t.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }

  /* ============================================================
     DÉTAIL DU COMPTAGE (explications)
     Pour chaque élément : la liste des endroits où il apparaît,
     avec son indice et l'indice de la parenthèse qui l'entoure.
     Cu(OH)2 → O : [{ n: 1, m: 2, grp: '(OH)2' }]
     ============================================================ */
  function detailler(formule) {
    const f = formule.replace(/[=≡·\-\s]/g, '');
    const res = [];
    const ajouter = (el, t) => {
      let e = res.find(a => a.el === el);
      if (!e) res.push(e = { el, termes: [] });
      e.termes.push(t);
    };
    let i = 0;
    while (i < f.length) {
      if (f[i] === '(') {
        // parenthèse : on lit son contenu et l'indice qui la suit
        const fin = f.indexOf(')', i);
        const dedans = f.slice(i + 1, fin);
        let j = fin + 1, s = '';
        while (j < f.length && /\d/.test(f[j])) s += f[j++];
        const m = s ? +s : 1;
        analyser(dedans).forEach(a => ajouter(a.el, { n: a.n, m, grp: '(' + dedans + ')' + s }));
        i = j;
      } else {
        const mm = /^([A-Z][a-z]?)(\d*)/.exec(f.slice(i));
        if (!mm) { i++; continue; }
        ajouter(mm[1], { n: mm[2] ? +mm[2] : 1, m: 1 });
        i += mm[0].length;
      }
    }
    return res;
  }

  // Calcul écrit pour un élément : « 2 × (2 + 2 × 3) = 16 »
  function calculHTML(formule, coef, el) {
    const d = detailler(formule).find(a => a.el === el);
    if (!d) return '0';
    const par = d.termes.reduce((s, t) => s + t.n * t.m, 0);
    const termes = d.termes.map(t => (t.m > 1 ? `${t.m} × ${t.n}` : `${t.n}`));
    let expr = termes.join(' + ');
    const simple = termes.length === 1 && d.termes[0].m === 1;
    if (coef > 1) expr = `${coef} × ` + (simple ? expr : `(${expr})`);
    if (simple && coef === 1) return par === 1 ? 'pas d\'indice → 1' : `indice ${par} → ${par}`;
    return `${expr} = ${coef * par}`;
  }

  /* ============================================================
     ENTRAÎNEMENT NOTÉ (modules 3 et 4)
     opts = {
       app, badge, titre, intro,
       groupes: BANQUE.faciles,    sous-groupes de difficulté croissante
       aide: 5,                    nombre de questions avec l'interrupteur « dessins »
       suite: { href, label },     lien proposé à la fin
     }
     2 points si juste du premier coup, 1 point après au moins une erreur,
     0 point si la réponse est affichée. Note sur 20.
     ============================================================ */
  function entrainement(opts) {
    const app = opts.app, aide = opts.aide || 0;
    let questions = [], idx = 0, score = 0, recap = [], dessins = false;
    const total = () => questions.length * 2;

    function tirer() {
      questions = [];
      opts.groupes.forEach(g => { questions = questions.concat(melanger(g.reactions).slice(0, g.tirage)); });
    }
    function entete() {
      const pct = Math.round(idx / questions.length * 100);
      return `<div class="er-card">
          <span class="er-badge">${opts.badge}</span>
          <h2 class="er-titre">${opts.titre}</h2>
          <p class="er-meta">Question ${idx + 1}/${questions.length} · Score : <b data-a="score">${score} pt${score > 1 ? 's' : ''}</b></p>
          <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
        </div>`;
    }
    function intro() {
      app.innerHTML = `<div class="er-card">
          <span class="er-badge">${opts.badge}</span>
          <h2 class="er-titre">${opts.titre}</h2>
          ${opts.intro}
          <div class="cle" style="margin:14px 0">
            <p><b class="cle-titre">Barème</b> · 10 réactions, de difficulté croissante, notées sur 20 :</p>
            <ul class="er-liste">
              <li><b>2 points</b> si la réaction est équilibrée du premier coup ;</li>
              <li><b>1 point</b> si tu y arrives après au moins une erreur ;</li>
              <li><b>0 point</b> si tu affiches la réponse.</li>
            </ul>
          </div>
          <button type="button" class="btn-primary" data-a="go">Commencer →</button>
        </div>`;
      app.querySelector('[data-a="go"]').onclick = demarrer;
    }
    function demarrer() { tirer(); idx = 0; score = 0; recap = []; afficher(); }

    function afficher() {
      if (idx >= questions.length) return fin();
      const q = questions[idx], avecAide = idx < aide;
      let erreur = false, fini = false;
      app.innerHTML = entete() + `<div class="er-card" data-a="q">
          <p class="er-q-nom">${q.nom}</p>
          <p class="er-consigne">Équilibre la réaction en ajustant les nombres stœchiométriques.</p>
          ${avecAide ? '<div data-a="switch"></div>' : (aide && idx === aide ? `<p class="er-note">À partir de cette question, il n'y a plus d'aide dessinée : compte les atomes avec le calcul <b>nombre stœchiométrique × indice</b>.</p>` : '')}
          <div data-a="reaction"></div>
          <div data-a="retour"></div>
          <div class="er-actions" data-a="actions">
            <button type="button" class="btn-primary" data-a="valider">Valider</button>
            <button type="button" class="btn-secondary" data-a="reponse">Afficher la réponse</button>
          </div>
        </div>`;
      window.scrollTo(0, 0);
      const $ = a => app.querySelector(`[data-a="${a}"]`);
      const reaction = new Reaction($('reaction'), {
        reactifs: q.r, produits: q.p, dessins: avecAide && dessins,
        onChange: () => { if (!fini) $('retour').innerHTML = ''; },
      });
      if (avecAide) {
        $('switch').replaceWith(interrupteur(dessins, b => { dessins = b; reaction.options({ dessins }); },
          `aide pour les ${aide} premières questions`));
      }

      function terminer(points, html) {
        fini = true;
        reaction.activer(false);
        score += points;
        recap.push({ n: idx + 1, p: points });
        $('score').textContent = score + ' pt' + (score > 1 ? 's' : '');
        $('retour').innerHTML = html;
        const der = idx === questions.length - 1;
        $('actions').innerHTML = `<button type="button" class="btn-primary" data-a="suivant" disabled>${der ? 'Voir mon score →' : 'Question suivante →'}</button>`;
        // court délai : un double-clic sur « Valider » ne fait pas passer la question sans la lire
        setTimeout(() => { const b = $('suivant'); if (b) b.disabled = false; }, 450);
        $('suivant').onclick = () => { idx++; afficher(); };
      }

      $('valider').onclick = () => {
        if (fini) return;
        const v = reaction.verifier();
        const eq = equationHTML(q.r, q.p, reaction.coefs);
        if (v.equilibree && v.minimale) {
          const p = erreur ? 1 : 2;
          terminer(p, `<div class="callout-success er-retour"><p><b class="er-ok">${erreur ? 'C\'est juste !' : 'Bravo, juste du premier coup !'}</b> +${p} point${p > 1 ? 's' : ''}</p>
            <p class="er-eq">${eq}</p></div>`);
          return;
        }
        const premiere = !erreur;
        erreur = true;
        let msg;
        if (v.equilibree) {
          const g = reaction.coefs.reduce(pgcd);
          msg = `<p><b class="er-ko">La réaction est équilibrée, mais ce ne sont pas les plus petits nombres entiers possibles.</b></p>
            <p>Tous tes nombres stœchiométriques peuvent être divisés par ${g}.</p>`;
        } else {
          const liste = v.faux.map(e => `<b>${e}</b>`).join(', ').replace(/, ([^,]*)$/, ' et $1');
          msg = `<p><b class="er-ko">Pas encore équilibrée.</b> Les atomes ${v.faux.length > 1 ? 'des éléments' : 'de l\'élément'} ${liste} ne sont pas aussi nombreux dans les réactifs que dans les produits.</p>
            <p>Compte-les de chaque côté de la flèche : nombre stœchiométrique × indice.</p>`;
        }
        if (premiere) msg += `<p class="er-petit">Corrige ta réponse : cette question peut encore rapporter 1 point.</p>`;
        $('retour').innerHTML = `<div class="callout-danger er-retour">${msg}</div>`;
        $('reaction').classList.remove('er-secoue'); void $('reaction').offsetWidth; $('reaction').classList.add('er-secoue');
      };
      $('reponse').onclick = () => {
        if (fini) return;
        reaction.fixer(q.c);
        terminer(0, `<div class="callout er-retour"><p><b>Réponse :</b> 0 point pour cette question.</p>
          <p class="er-eq">${equationHTML(q.r, q.p, q.c)}</p></div>`);
      };
    }

    function fin() {
      const max = total(), pct = Math.round(score / max * 100);
      window.SOM.marquer({ note: Math.round(score / max * 20 * 2) / 2 });   // meilleure note sur 20 (sommaire, accueil)
      let msg;
      if (score === max) msg = 'Tu sais équilibrer ces réactions.';
      else if (pct >= 70) msg = 'Très bien ! Encore un peu d\'entraînement pour le sans-faute.';
      else if (pct >= 50) msg = 'Pas mal ! Recommence pour progresser : les réactions changent à chaque fois.';
      else msg = 'Continue à t\'entraîner. Tu peux revoir le module 1 pour la méthode.';
      app.innerHTML = `<div class="er-card er-fin">
          <span class="er-badge">${opts.badge}</span>
          <h2 class="er-titre">Entraînement terminé !</h2>
          ${score === max ? '<p class="er-trophee">🏆 Sans-faute !</p>' : ''}
          <div class="er-score">${score} / ${max}</div>
          <p class="er-score-pct">${pct} %</p>
          <p class="er-contexte">${msg}</p>
          <div class="er-recap">${recap.map(r => `<div class="${r.p === 2 ? 'ok' : r.p === 1 ? 'moyen' : 'ko'}">Q${r.n}<b>${r.p}/2</b></div>`).join('')}</div>
          <div class="er-actions" style="justify-content:center">
            <button type="button" class="btn-secondary" data-a="re">↺ Recommencer avec d'autres réactions</button>
            ${opts.suite ? `<a class="btn-primary" style="text-decoration:none" href="${opts.suite.href}">${opts.suite.label}</a>` : ''}
          </div>
        </div>`;
      app.querySelector('[data-a="re"]').onclick = demarrer;
      window.scrollTo(0, 0);
      if (score === max) confettis();
    }

    intro();
  }

  /* ============================================================
     INTERRUPTEUR « Afficher les molécules et les atomes »
     ============================================================ */
  function interrupteur(coche, onChange, sousTitre) {
    const l = document.createElement('label');
    l.className = 'er-switch-bar';
    l.innerHTML = `<span class="np-pref-label">Afficher les molécules et les atomes${sousTitre ? ` <small>${sousTitre}</small>` : ''}</span>
      <span class="np-switch"><input type="checkbox" ${coche ? 'checked' : ''}><span class="np-slider"></span></span>`;
    l.querySelector('input').addEventListener('change', e => onChange(e.target.checked));
    return l;
  }

  /* ============================================================
     COMPTER LES ATOMES D'UNE ESPÈCE (modules 1 et 2)
     L'élève règle, pour chaque élément, le nombre d'atomes avec
     les flèches ; la réponse se lit « 4 H ».
     cfg = {
       formule, coef,
       dessins: false,            état initial de l'interrupteur
       regle: '…',                rappel donné après la 1re erreur
       resolu: false,             affiche directement la réponse (retour en arrière)
       valeurs: [1, 1],           valeurs de départ des flèches (retour du module 2)
       onValeurs(valeurs),        appelé à chaque réglage
       onReussi(nbErreurs)
     }
     ============================================================ */
  function Comptage(el, cfg) {
    const coef = cfg.coef || 1, f = cfg.formule, comp = analyser(f);
    let erreurs = 0, fini = false;
    el.classList.add('er-cpt');
    el.innerHTML = `<div data-c="switch"></div>
      <div data-c="espece"></div>
      <p class="er-cpt-q">Nombre d'atomes de chaque élément :</p>
      <div class="er-reps" data-c="reps"></div>
      <div data-c="retour"></div>
      <div class="er-actions" data-c="actions"><button type="button" class="btn-primary" data-c="verifier">Vérifier</button></div>`;
    const $ = a => el.querySelector(`[data-c="${a}"]`);
    const esp = new Reaction($('espece'), { reactifs: [f], produits: [], coefs: [coef], selecteurs: false, dessins: !!cfg.dessins });
    $('switch').replaceWith(interrupteur(!!cfg.dessins, b => esp.options({ dessins: b })));
    let sels = [];
    sels = comp.map((a, k) => {
      const box = document.createElement('div');
      box.className = 'er-rep';
      const sel = selecteur({
        valeur: (cfg.valeurs && cfg.valeurs[k]) || 1, min: 1, max: 60, label: "le nombre d'atomes de " + a.el,
        onChange: () => {
          box.classList.remove('ok', 'ko');
          if (!fini) $('retour').innerHTML = '';
          if (cfg.onValeurs) cfg.onValeurs(sels.map(x => x.sel.valeur));
        },
      });
      box.appendChild(sel.el);
      box.insertAdjacentHTML('beforeend', `<span class="er-rep-el">${a.el}</span>`);
      $('reps').appendChild(box);
      return { sel, box, el: a.el, n: coef * a.n };
    });
    const calculs = liste => liste.map(x => `<li><b>${x.el}</b> : ${calculHTML(f, coef, x.el)} atome${x.n > 1 ? 's' : ''}</li>`).join('');
    function reussir(silencieux) {
      fini = true;
      sels.forEach(x => { x.sel.fixer(x.n); x.sel.activer(false); x.box.classList.remove('ko'); x.box.classList.add('ok'); });
      $('actions').innerHTML = '';
      $('retour').innerHTML = `<div class="callout-success er-retour"><p><b class="er-ok">${silencieux ? 'Réponse' : 'Bravo !'}</b></p><ul class="er-calculs">${calculs(sels)}</ul></div>`;
    }
    $('verifier').onclick = () => {
      if (fini) return;
      const faux = sels.filter(x => x.sel.valeur !== x.n);
      sels.forEach(x => { x.box.classList.toggle('ok', x.sel.valeur === x.n); x.box.classList.toggle('ko', x.sel.valeur !== x.n); });
      if (!faux.length) { reussir(); if (cfg.onReussi) cfg.onReussi(erreurs); return; }
      erreurs++;
      const noms = faux.map(x => `<b>${x.el}</b>`).join(', ').replace(/, ([^,]*)$/, ' et $1');
      let html = `<p><b class="er-ko">Pas tout à fait.</b> Vérifie le nombre d'atomes de ${noms}.</p>`;
      if (erreurs === 1) html += cfg.regle ? `<p>${cfg.regle}</p>` : '';
      else html += `<p>Voici le calcul :</p><ul class="er-calculs">${calculs(faux)}</ul><p class="er-petit">Règle les flèches sur ces valeurs, puis vérifie.</p>`;
      $('retour').innerHTML = `<div class="callout-danger er-retour">${html}</div>`;
      $('reps').classList.remove('er-secoue'); void $('reps').offsetWidth; $('reps').classList.add('er-secoue');
    };
    if (cfg.resolu) reussir(true);
  }

  /* ============================================================
     INDICE pour équilibrer (module 1) : premier élément non conservé,
     dans l'ordre conseillé par la méthode
     ============================================================ */
  function indice(reactifs, produits, coefs, ordre) {
    const v = verifier(reactifs, produits, coefs);
    if (v.equilibree && v.minimale) return { ok: true, html: '' };
    if (v.equilibree) {
      return { ok: false, html: `L'équation est équilibrée, mais il faut les <b>plus petits nombres entiers possibles</b> : tous tes nombres peuvent être divisés par ${coefs.reduce(pgcd)}.` };
    }
    const el = (ordre || v.faux).find(e => v.faux.includes(e)) || v.faux[0];
    const b = v.bilan.find(x => x.el === el);
    const cote = b.r > b.p ? produits : reactifs;
    const especes = cote.filter(f => nb(f, el) > 0).map(f => `<b>${formuleHTML(f)}</b>`).join(' ou ');
    return {
      ok: false,
      html: `Atomes de <b>${el}</b> : ${b.r} dans les réactifs, ${b.p} dans les produits. ` +
        `Il en manque ${b.r > b.p ? 'dans les produits' : 'dans les réactifs'} : augmente le nombre stœchiométrique devant ${especes}.`,
    };
  }

  /* ============================================================
     DIAGNOSTIC D'UNE ERREUR DE COMPTAGE
     Pour l'élément el de la formule f précédée du nombre stœchiométrique
     coef, l'élève a trouvé v atomes : on reconnaît les erreurs classiques
     (nombre stœchiométrique oublié ou additionné, indice d'une parenthèse
     oublié, élément présent à plusieurs endroits, indice mal attribué).
     Renvoie '' si l'erreur n'est pas reconnue.
     ============================================================ */
  function diagComptage(f, coef, el, v) {
    const d = detailler(f).find(a => a.el === el);
    if (!d) return '';
    coef = coef || 1;
    const par = d.termes.reduce((s, t) => s + t.n * t.m, 0);              // atomes dans une molécule
    const sansPar = d.termes.reduce((s, t) => s + t.n, 0);                // … en oubliant l'indice des parenthèses
    const tPar = d.termes.find(t => t.m > 1);
    const E = `<b>${el}</b>`;
    if (tPar && coef > 1 && v === sansPar) {
      return `Pour ${E}, n'oublie ni l'indice ${tPar.m} de la parenthèse, ni le nombre stœchiométrique ${coef} : ${calculHTML(f, coef, el)}.`;
    }
    if (tPar && coef > 1 && v === par && v === coef * sansPar) {
      return `Pour ${E}, il faut multiplier par l'indice ${tPar.m} de la parenthèse <b>et</b> par le nombre stœchiométrique ${coef} : ${calculHTML(f, coef, el)}.`;
    }
    if (coef > 1 && v === par) {
      return `Pour ${E}, tu as compté les atomes d'<b>une seule</b> molécule. Le nombre stœchiométrique ${coef} multiplie toute la molécule : ${coef} × ${par}.`;
    }
    if (coef > 1 && v === par + coef) {
      return `Pour ${E}, tu as additionné le nombre stœchiométrique et l'indice : on les <b>multiplie</b>.`;
    }
    if (tPar && v === coef * sansPar) {
      return `Pour ${E}, l'indice ${tPar.m} écrit après la parenthèse porte sur <b>tout</b> ce qu'elle contient, donc aussi sur ${el}.`;
    }
    if (d.termes.length > 1 && d.termes.some(t => v === coef * t.n * t.m)) {
      return `${E} apparaît à plusieurs endroits de la formule : additionne tous ses atomes.`;
    }
    if (d.termes.length === 1 && par === 1) {
      return `${E} n'a pas d'indice : il compte pour 1 atome par molécule${coef > 1 ? `, donc ${coef} × 1 = ${coef}` : ''}.`;
    }
    if (d.termes.length === 1 && !tPar && v === coef) {
      return `L'indice ${par} est écrit juste après ${E} : il porte sur ${el}${coef > 1 ? `, puis on multiplie par ${coef}` : ''}.`;
    }
    return '';
  }

  /* ============================================================
     OUTILS DES COURS (« À toi » de assets/cours.js)
     Chaque fonction renvoie une partie de question
       { type: 'perso', q, solution, monter(zone, api) → { montrer() } }
     L'outil se construit dans zone, sans id ni état global : plusieurs
     exemplaires peuvent être affichés en même temps (« Afficher tout le cours »).
     api.reussi() quand c'est juste, api.erreur(diagnostic) sinon ; montrer()
     affiche la réponse.
     cfg.memoire (facultatif) : objet où l'outil garde son état
       { c: nombres choisis, d: 1 si les dessins sont affichés, v: 1 si la réponse
         en place a déjà été validée } ; il y est relu au montage (retour du
       module 2 au même endroit, voir module_1.html).
     cfg.dessins : dessins affichés au départ (booléen ou fonction) ; cfg.onDessins(b).
     ============================================================ */
  function creer(tag, cls, html) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }
  function secouer(e) { if (!e) return; e.classList.remove('er-secoue'); void e.offsetWidth; e.classList.add('er-secoue'); }
  const enListe = t => t.join(', ').replace(/, ([^,]*)$/, ' et $1');
  // bouton « Valider » (même présentation que ceux de assets/cours.js)
  function boutonValider(zone) {
    const a = creer('div', 'er-actions crs-actions-partie', '<button type="button" class="btn-primary">Valider</button>');
    zone.appendChild(a);
    return a;
  }
  // dessins affichés au départ : mémoire de l'outil, sinon réglage demandé
  function dessinsDepart(cfg, mem) {
    if (mem.d != null) return !!mem.d;
    return !!(typeof cfg.dessins === 'function' ? cfg.dessins() : cfg.dessins);
  }
  // nombres gardés en mémoire, s'ils sont valables (adresse abîmée…)
  const nombresValables = (c, n, max) => Array.isArray(c) && c.length === n && c.every(x => Number.isInteger(x) && x >= 1 && x <= max);

  /* ---------- Compter les atomes de chaque élément d'une espèce ----------
     cfg = { formule, coef, q, regle (rappel si l'erreur n'est pas reconnue), dessins, onDessins, memoire } */
  function partieCompter(cfg) {
    const f = cfg.formule, coef = cfg.coef || 1;
    const comp = analyser(f).map(a => ({ el: a.el, n: coef * a.n }));
    const calculs = liste => liste.map(x => `<li><b>${x.el}</b> : ${calculHTML(f, coef, x.el)} atome${x.n > 1 ? 's' : ''}</li>`).join('');
    return {
      type: 'perso', q: cfg.q,
      solution: `<ul class="er-calculs">${calculs(comp)}</ul>`,
      monter(zone, api) {
        const mem = cfg.memoire || {};
        const box = creer('div', 'er-cpt', `<div data-c="switch"></div><div data-c="espece"></div>
          <p class="er-cpt-q">Nombre d'atomes de chaque élément :</p><div class="er-reps" data-c="reps"></div>`);
        zone.appendChild(box);
        const $ = a => box.querySelector(`[data-c="${a}"]`);
        const dessins = dessinsDepart(cfg, mem);
        const esp = new Reaction($('espece'), { reactifs: [f], produits: [], coefs: [coef], selecteurs: false, dessins });
        $('switch').replaceWith(interrupteur(dessins, b => {
          mem.d = b ? 1 : 0;
          esp.options({ dessins: b });
          if (cfg.onDessins) cfg.onDessins(b);
        }));
        const depart = nombresValables(mem.c, comp.length, 60) ? mem.c : null;
        let erreurs = 0;
        const sels = comp.map((a, k) => {
          const rep = creer('div', 'er-rep');
          const sel = selecteur({
            valeur: depart ? depart[k] : 1, min: 1, max: 60, label: 'le nombre d\'atomes de ' + a.el,
            onChange: () => {
              rep.classList.remove('ok', 'ko');
              mem.c = sels.map(x => x.sel.valeur); mem.v = 0;
              api.effacer();
            },
          });
          rep.appendChild(sel.el);
          rep.insertAdjacentHTML('beforeend', `<span class="er-rep-el">${a.el}</span>`);
          $('reps').appendChild(rep);
          return { sel, rep, el: a.el, n: a.n };
        });
        const act = boutonValider(zone);
        function fermer() {
          sels.forEach(x => { x.sel.fixer(x.n); x.sel.activer(false); x.rep.classList.remove('ko'); x.rep.classList.add('ok'); });
          act.remove();
        }
        function valider() {
          if (api.fini()) return;
          mem.v = 1;
          const faux = sels.filter(x => x.sel.valeur !== x.n);
          sels.forEach(x => { x.rep.classList.toggle('ok', x.sel.valeur === x.n); x.rep.classList.toggle('ko', x.sel.valeur !== x.n); });
          if (!faux.length) { fermer(); api.reussi(); return; }
          erreurs++;
          // un diagnostic par élément faux (sans répétition) ; sinon la règle
          const raisons = faux.map(x => diagComptage(f, coef, x.el, x.sel.valeur));
          const uniques = [...new Set(raisons.filter(Boolean))];
          let h = `Vérifie le nombre d'atomes de ${enListe(faux.map(x => `<b>${x.el}</b>`))}. ${uniques.join(' ')}`;
          if (raisons.some(r => !r) && cfg.regle) h += ' ' + cfg.regle;
          // à partir de la 2e erreur, le calcul des éléments faux
          if (erreurs >= 2) h += `<br>Le calcul : ${faux.map(x => `<b>${x.el}</b> : ${calculHTML(f, coef, x.el)}`).join(' ; ')}.`;
          api.erreur(h);
          secouer($('reps'));
        }
        act.querySelector('button').onclick = valider;
        if (mem.v && depart) valider();                       // retour du module 2 : réponse déjà validée
        return { montrer: fermer };
      },
    };
  }

  /* ---------- Régler un nombre stœchiométrique pour obtenir un nombre d'atomes ----------
     cfg = { formule, el, cible (nombre d'atomes de el voulu), max, q, dessins, memoire } */
  function partieRegler(cfg) {
    const f = cfg.formule, el = cfg.el, n = nb(f, el), bon = cfg.cible / n, max = cfg.max || 9;
    const fh = formuleHTML(f);
    return {
      type: 'perso', q: cfg.q,
      solution: `<p class="crs-calc">${bon} ${fh} : ${bon} × ${n} = <span class="c">${cfg.cible} atomes ${el}</span></p>`,
      monter(zone, api) {
        const mem = cfg.memoire || {};
        const box = creer('div', null, '<div data-c="switch"></div><div data-c="r"></div>');
        zone.appendChild(box);
        const dessins = dessinsDepart(cfg, mem);
        const r = new Reaction(box.querySelector('[data-c="r"]'), {
          reactifs: [f], produits: [], max, dessins,
          coefs: nombresValables(mem.c, 1, max) ? mem.c : [1],
          onChange: c => { mem.c = c; mem.v = 0; api.effacer(); },
        });
        box.querySelector('[data-c="switch"]').replaceWith(interrupteur(dessins, b => { mem.d = b ? 1 : 0; r.options({ dessins: b }); }));
        const act = boutonValider(zone);
        function fermer() { r.fixer([bon]); r.activer(false); act.remove(); }
        function valider() {
          if (api.fini()) return;
          mem.v = 1;
          const k = r.coefs[0];
          if (k === bon) { r.activer(false); act.remove(); api.reussi(); return; }
          secouer(r.el);
          const at = k * n > 1 ? 'atomes' : 'atome';
          if (k === cfg.cible) {
            api.erreur(`Tu as écrit ${k} molécules : ${k} × ${n} = ${k * n} atomes ${el}. Chaque molécule ${fh} contient déjà ${n} atomes ${el} (l'indice).`);
          } else {
            api.erreur(`Avec ${k > 1 ? k + ' ' : ''}${fh}, il y a ${k} × ${n} = ${k * n} ${at} ${el}. Il en faut ${cfg.cible} : ${k * n < cfg.cible ? 'augmente' : 'diminue'} le nombre stœchiométrique.`);
          }
        }
        act.querySelector('button').onclick = valider;
        if (mem.v) valider();
        return { montrer: fermer };
      },
    };
  }

  /* ---------- Équilibrer une réaction ----------
     cfg = { r: réactifs, p: produits, solution: [nombres], ordre: ['H', 'Cl'] (méthode),
             direct: true   bilan et indice en direct, réussite dès que c'est équilibré ;
                     false  l'élève calcule et valide (bilan montré après « Valider »),
             comptes: true  nombre d'atomes écrit sous chaque formule (avec le calcul),
             essais: 10     (direct) changements sans réussite avant de proposer « Afficher la réponse »,
             q, bravo (explication ajoutée à la solution), dessins, memoire } */
  function partieEquilibrer(cfg) {
    const R = cfg.r, P = cfg.p, nbEsp = R.length + P.length;
    return {
      type: 'perso', q: cfg.q,
      solution: `<p class="er-eq">${equationHTML(R, P, cfg.solution)}</p>${cfg.bravo ? `<p>${cfg.bravo}</p>` : ''}`,
      monter(zone, api) {
        const mem = cfg.memoire || {};
        const box = creer('div', null, '<div data-c="switch"></div><div data-c="r"></div><div data-c="bilan"></div><div data-c="guide"></div>');
        zone.appendChild(box);
        const $ = a => box.querySelector(`[data-c="${a}"]`);
        const dessins = dessinsDepart(cfg, mem);
        let changements = 0, aide = false, fini = false, act = null;
        const r = new Reaction($('r'), {
          reactifs: R, produits: P, dessins, comptes: cfg.comptes !== false, detail: true,
          coefs: nombresValables(mem.c, nbEsp, 30) ? mem.c : null,
          onChange: c => {
            mem.c = c; mem.v = 0;
            if (cfg.direct) {
              maj();
              // pas d'erreur « validée » en direct : « Afficher la réponse » après plusieurs essais
              if (!fini && ++changements >= (cfg.essais || 10) && !aide) { aide = true; api.compterErreur(); }
            } else { $('bilan').innerHTML = ''; api.effacer(); }
          },
        });
        $('switch').replaceWith(interrupteur(dessins, b => { mem.d = b ? 1 : 0; r.options({ dessins: b }); }));
        // réaction équilibrée (ou réponse affichée) : nombres figés, bilan final
        function fermer() {
          fini = true;
          r.activer(false);
          $('guide').innerHTML = '';
          $('bilan').innerHTML = bilanHTML(r.bilan());
          if (act) act.remove();
        }
        // mode direct : bilan et indice à chaque réglage
        function maj() {
          if (fini || api.fini()) return;
          $('bilan').innerHTML = bilanHTML(r.bilan());
          const ind = indice(R, P, r.coefs, cfg.ordre);
          if (ind.ok) { fermer(); api.reussi(); return; }
          $('guide').innerHTML = `<p class="er-guide">${ind.html}</p>`;
        }
        // mode « Valider » : bilan et indice après chaque essai
        function valider() {
          if (fini || api.fini()) return;
          mem.v = 1;
          $('bilan').innerHTML = bilanHTML(r.bilan());
          const ind = indice(R, P, r.coefs, cfg.ordre);
          if (ind.ok) { fermer(); api.reussi(); return; }
          secouer(r.el);
          api.erreur(ind.html);
        }
        if (!cfg.direct) {
          act = boutonValider(zone);
          act.querySelector('button').onclick = valider;
        }
        if (cfg.direct) maj();
        else if (mem.v) valider();                            // retour du module 2 : réponse déjà validée
        return { montrer() { if (!fini) r.fixer(cfg.solution); fermer(); } };
      },
    };
  }

  /* ---------- Plan de l'application et navigation (voir assets/sommaire.js) ---------- */
  const PLAN = [
    { n: 1, titre: 'Comment équilibrer une réaction', desc: 'Conservation des atomes, nombres stœchiométriques, la méthode sur trois réactions', fiche: 'fiche_1',
      parties: [{ nom: 'Comment équilibrer', cours: 'module_1' }] },
    { n: 2, titre: 'Compter les atomes', desc: 'Indices, nombre stœchiométrique, parenthèses comme dans Cu(OH)<sub>2</sub>', fiche: 'fiche_2',
      parties: [{ nom: 'Compter les atomes', cours: 'module_2' }] },
    { n: 3, titre: 'Entraînement : réactions faciles', desc: '10 réactions de difficulté croissante, notées sur 20',
      parties: [{ nom: 'Réactions faciles', entrainement: 'module_3' }] },
    { n: 4, titre: 'Entraînement : réactions moins faciles', desc: 'Combustions, grands nombres stœchiométriques, parenthèses, notées sur 20',
      parties: [{ nom: 'Réactions moins faciles', entrainement: 'module_4' }] },
  ];
  // (er.js est aussi chargé par « Combustions », dont le moteur remplace ensuite cette configuration)
  window.SOM.init({ nom: 'Équilibrer une réaction', id: 'equilibrer-reactions', plan: PLAN });
  const menu = cle => window.SOM.menu(cle);
  const accueil = zone => window.SOM.accueil(zone);

  /* ---------- Confettis (sans-faute) ---------- */
  function confettis() {
    const col = ['#0a7d57', '#16a34a', '#e8890c', '#d61f69', '#2952c8'];
    for (let i = 0; i < 70; i++) {
      const el = document.createElement('div');
      el.className = 'er-confetti';
      el.style.left = (Math.random() * 100) + 'vw';
      el.style.background = col[i % col.length];
      el.style.animationDuration = (2.2 + Math.random() * 1.6) + 's';
      el.style.animationDelay = (Math.random() * 0.8) + 's';
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 4800);
    }
  }

  window.ER = {
    ELEMENTS, analyser, nb, formuleHTML, molecule, boules, bouleHTML, selecteur, Reaction, bilan, verifier, bilanHTML,
    equationHTML, melanger, detailler, calculHTML, entrainement, menu, accueil, PLAN, confettis, interrupteur, Comptage, indice,
    diagComptage, partieCompter, partieRegler, partieEquilibrer,
  };
})();
