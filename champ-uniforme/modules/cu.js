/* ============================================================
   Moteur de l'application « Mouvement dans un champ uniforme »
   (Terminale spécialité). Moteur de questions repris de « Bilan des
   forces » (bilan-forces/modules/bf.js, lui-même issu de
   cinematique/modules/cin.js) ; navigation commune assets/sommaire.js,
   cours avec assets/cours.js.

   NOMBRES ET QUESTIONS
   CU.fmt, CU.cs, CU.sci, CU.lire, CU.proche  écriture et lecture des nombres (virgule)
   CU.o, CU.fq.choix, CU.fq.nombre             fabriques d'options et de parties de question
   CU.PARTIES                                  parties : 'choix', 'nombre' (p.calc : icône calculatrice),
                                               'gabarit' (expression à trous), 'sci', 'perso'
   CU.question(zone, q, cb, mode)              question en plusieurs parties (série, exercice)
   CU.serie(opts)                              série de 10 questions notée sur 20
   CU.fig(dessin), CU.outil(monter)            figure dessinée à la largeur disponible, outil placé dans du HTML

   ÉCRITURES
   CU.V(n, s)                 nom de vecteur (flèche au-dessus), indice hors de la flèche
   CU.col(a, b)               coordonnées en colonne
   CU.sys(l1, l2, …)          système avec une accolade à sa hauteur
   CU.fr(h, b), CU.rac(x)     fraction sur deux étages, racine carrée
   CU.CALC                    icône calculatrice (après l'unité d'un champ)
   CU.MS, CU.MS2, CU.VM       unités m·s⁻¹, m·s⁻², V·m⁻¹
   CU.E_CH, CU.M_P, CU.M_E    charge élémentaire, masses du proton et de l'électron

   FIGURES SVG (couleurs : attributs de présentation, comme VEC.C)
   CU.COUL                    { v (vitesse), a (accélération), E (champ), F (force), traj }
   CU.fl, CU.nom, CU.txt, CU.svg   flèche, nom de vecteur, texte, cadre de figure
   CU.figTir(o)               repère, sol, point de départ, v⃗₀ et son angle, trajectoire (chute libre)
   CU.condo(o)                condensateur plan horizontal : signes, E⃗, flèche de U, particule, trajectoire
   CU.courbes(o)              graphique de fonctions du temps (x(t), vₓ(t)…)
   CU.partieConstante(o)      « atelier » : la primitive se règle en glissant la courbe jusqu'à la
                              condition initiale (partie 'perso' des cours et des séries)

   NAVIGATION
   CU.PLAN, CU.menu(cle), CU.accueil(zone)

   Les styles des cartes, boutons et écrans de fin viennent de
   equilibrer-reactions/modules/er.css ; ceux des questions et des
   écritures de cu.css.
   ============================================================ */
(function () {
  'use strict';

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
    let s = (Math.abs(v) < Math.pow(10, -dec) / 2 ? 0 : v).toFixed(dec);
    return s.replace('-', MOINS).replace('.', ',');
  }
  // n chiffres significatifs, zéros finaux gardés : 4,70 ; −0,107
  function cs(v, n) {
    const e = Math.floor(Math.log10(Math.abs(v) || 1));
    if (e >= n) return fmt(Math.round(v));
    return v.toPrecision(n).replace('-', MOINS).replace('.', ',');
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
  const proche = (a, b, rel) => Math.abs(a - b) <= (rel == null ? .01 : rel) * Math.abs(b) + (b === 0 ? 1e-12 : Math.abs(b) * 1e-12);

  // valeur avec un préfixe d'unité : unite(20000, 'V') → « 20 kV » ; unite(0.0065, 'A') → « 6,5 mA »
  // n : nombre de chiffres significatifs au plus (3 par défaut)
  function unite(v, u, n) {
    const P = [[1e9, 'G'], [1e6, 'M'], [1e3, 'k'], [1, ''], [1e-3, 'm']];
    const a = Math.abs(v), [f, pre] = P.find(([x]) => a >= x * .9995) || P[P.length - 1];
    return `${fmt(+(v / f).toPrecision(n || 3))} ${pre}${u}`;
  }
  // fabriques de parties de question (cours, séries, exercices)
  const o = (id, label) => ({ id, label });
  const fq = {
    choix: (q, options, bonne, opts) => Object.assign({ type: 'choix', q, options, bonne, colonne: options.some(x => x.label.length > 24) }, opts),
    nombre: (q, label, valeur, unite, opts) => Object.assign({ type: 'nombre', q, label, valeur, unite }, opts),
  };

  // fraction écrite sur deux étages
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
  const surOrdi = () => matchMedia('(hover: hover)').matches;

  // Champ de saisie d'un nombre, avec un bouton ± (le pavé numérique
  // des smartphones n'a pas toujours de touche « − »)
  function champ(opts) {
    opts = opts || {};
    const d = el('span', 'ph-champ-box' + (opts.petit ? ' petit' : ''));
    d.innerHTML = `${opts.signe === false ? '' : `<button type="button" class="ph-pm" aria-label="Changer le signe" title="Changer le signe">±</button>`}
      <input type="text" class="ph-champ" inputmode="decimal" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="${opts.aria || 'Réponse'}">`;
    const input = d.querySelector('input'), pm = d.querySelector('.ph-pm');
    if (pm) {
      pm.addEventListener('click', () => {
        if (input.disabled) return;
        const v = input.value.trim();
        input.value = /^[-−]/.test(v) ? v.replace(/^[-−]\s*/, '') : MOINS + v;
        input.dispatchEvent(new Event('input'));
        // pas de focus sur smartphone : le clavier masquerait la question
        if (surOrdi()) input.focus();
      });
    }
    return { el: d, input, desactiver(b) { input.disabled = b; if (pm) pm.disabled = b; } };
  }

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

  // Bouton « Valider » d'une partie
  function boutonValider(zone) {
    const a = el('div', 'er-actions ph-actions-partie', '<button type="button" class="btn-primary">Valider</button>');
    zone.appendChild(a);
    const b = a.querySelector('button');
    // une fois la partie terminée, le bouton disparaît
    b.fermer = () => { b.disabled = true; a.remove(); };
    return b;
  }
  function juste(v, p) {
    if (p.tol != null) return Math.abs(v - p.valeur) <= p.tol + 1e-12;
    return proche(v, p.valeur, p.rel == null ? .005 : p.rel);
  }
  // valeur affichée par « Afficher la réponse »
  function affichage(p) {
    if (p.affiche) return p.affiche;
    if (p.cs) return cs(p.valeur, p.cs);
    if (p.dec != null) return fmt(p.valeur, p.dec);
    if (p.tol != null && p.tol >= 1e-4) return fmt(p.valeur, Math.max(0, Math.ceil(-Math.log10(2 * p.tol) - 1e-9)));
    return fmt(p.valeur);
  }

  // icône calculatrice après l'unité (p.calc : valeur qui se calcule à la calculatrice, charte §7)
  const CALC = '<span class="calc-icone" role="img" aria-label="À calculer à la calculatrice" title="À calculer à la calculatrice"></span>';
  // Valeur numérique : p.label, p.valeur, p.tol (écart absolu) ou p.rel (écart relatif), p.unite, p.calc, p.diag(v), p.indice
  function pNombre(zone, p, api) {
    const d = el('div', 'ph-valeur');
    if (p.label) d.appendChild(el('span', 'ph-lab', p.label));
    const ch = champ({ signe: p.signe });
    d.appendChild(ch.el);
    if (p.unite) d.appendChild(el('span', 'ph-unite', p.unite));
    if (p.calc) d.insertAdjacentHTML('beforeend', CALC);
    zone.appendChild(d);
    const bVal = boutonValider(zone);
    ch.input.addEventListener('input', () => api.effacer());
    ch.input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); valider(); } });
    function valider() {
      if (api.fini()) return;
      const v = lire(ch.input.value);
      if (isNaN(v)) { secouer(d); api.message('Écris un nombre (avec une virgule si besoin).'); return; }
      if (juste(v, p)) { ch.desactiver(true); bVal.fermer(); api.reussi(); return; }
      api.erreur((p.diag && p.diag(v)) || p.indice || 'Vérifie ton calcul.');
      secouer(d);
    }
    bVal.onclick = valider;
    return { montrer() { ch.input.value = affichage(p); ch.desactiver(true); bVal.fermer(); } };
  }

  // Expression à trous : p.label, p.morceaux = [texte HTML | { v, tol, rel, aria }], p.diag(valeurs)
  function pGabarit(zone, p, api) {
    const d = el('div', 'ph-valeur cu-gab');
    if (p.label) d.appendChild(el('span', 'ph-lab', p.label));
    // chaque case forme un groupe insécable avec le texte qui la suit (et le texte d'ouverture
    // avec la première case) : sur un petit écran, la ligne ne se coupe qu'entre deux groupes
    const champs = [];
    let grp = el('span', 'cu-gab-grp');
    d.appendChild(grp);
    p.morceaux.forEach(m => {
      if (typeof m === 'string') { grp.appendChild(el('span', 'cu-gab-txt', m)); return; }
      if (champs.length) { grp = el('span', 'cu-gab-grp'); d.appendChild(grp); }
      const c = champ({ petit: true, aria: m.aria || 'Nombre à compléter' });
      c.m = m; champs.push(c); grp.appendChild(c.el);
    });
    zone.appendChild(d);
    const bVal = boutonValider(zone);
    champs.forEach((c, k) => {
      c.input.addEventListener('input', () => { api.effacer(); c.el.classList.remove('ko'); });
      c.input.addEventListener('keydown', e => {
        if (e.key !== 'Enter') return;
        e.preventDefault();
        const vide = champs.find(x => x.input.value.trim() === '');
        if (vide) vide.input.focus(); else valider();
      });
    });
    function valider() {
      if (api.fini()) return;
      const vals = champs.map(c => lire(c.input.value));
      if (vals.some(isNaN)) { secouer(d); api.message('Complète toutes les cases (écris 0 si le terme n\'existe pas).'); return; }
      const oks = champs.map((c, k) => juste(vals[k], { valeur: c.m.v, tol: c.m.tol == null ? (c.m.rel == null ? 1e-9 : null) : c.m.tol, rel: c.m.rel }));
      if (oks.every(Boolean)) { champs.forEach(c => c.desactiver(true)); bVal.fermer(); api.reussi(); return; }
      champs.forEach((c, k) => c.el.classList.toggle('ko', !oks[k]));
      api.erreur((p.diag && p.diag(vals)) || p.indice || (oks.filter(x => !x).length > 1 ? 'Les cases en rouge sont fausses.' : 'La case en rouge est fausse.'));
      secouer(d);
    }
    bVal.onclick = valider;
    return {
      montrer() {
        champs.forEach(c => { c.input.value = c.m.affiche || fmt(c.m.v); c.el.classList.remove('ko'); c.desactiver(true); });
        bVal.fermer();
      },
    };
  }

  // Écriture scientifique a × 10ⁿ : p.label, p.valeur, p.unite, p.calc, p.rel (écart relatif, 3 % par défaut), p.cs, p.diag(v)
  function pSci(zone, p, api) {
    const d = el('div', 'ph-valeur');
    if (p.label) d.appendChild(el('span', 'ph-lab', p.label));
    const s = el('span', 'ph-sci'), a = champ({ petit: true, aria: 'Nombre devant la puissance de 10' }), n = champ({ petit: true, aria: 'Exposant de la puissance de 10' });
    n.el.classList.add('ph-exposant');
    s.appendChild(a.el); s.appendChild(el('span', 'ph-x10', '× 10')); s.appendChild(n.el);
    d.appendChild(s);
    if (p.unite) d.appendChild(el('span', 'ph-unite', p.unite));
    if (p.calc) d.insertAdjacentHTML('beforeend', CALC);
    zone.appendChild(d);
    const bVal = boutonValider(zone);
    [a, n].forEach(c => {
      c.input.addEventListener('input', () => api.effacer());
      c.input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); valider(); } });
    });
    function valider() {
      if (api.fini()) return;
      const va = lire(a.input.value), vn = lire(n.input.value);
      if (isNaN(va)) { secouer(d); api.message('Écris le nombre devant la puissance de 10.'); return; }
      if (isNaN(vn) || !Number.isInteger(vn)) { secouer(d); api.message('Écris l\'exposant de la puissance de 10 (un nombre entier).'); return; }
      const v = va * Math.pow(10, vn);
      if (proche(v, p.valeur, p.rel == null ? .03 : p.rel)) { a.desactiver(true); n.desactiver(true); bVal.fermer(); api.reussi(); return; }
      api.erreur((p.diag && p.diag(v)) || p.indice || 'Vérifie ton calcul.');
      secouer(d);
    }
    bVal.onclick = valider;
    return {
      montrer() {
        let e = Math.floor(Math.log10(Math.abs(p.valeur)) + 1e-12), m = +(p.valeur / Math.pow(10, e)).toFixed((p.cs || 2) - 1);
        if (Math.abs(m) >= 10) { m /= 10; e++; }
        a.input.value = fmt(m, (p.cs || 2) - 1); n.input.value = String(e).replace('-', MOINS);
        a.desactiver(true); n.desactiver(true); bVal.fermer();
      },
    };
  }

    // Outil propre à l'application : p.monter(zone, api) → { montrer() }
  function pPerso(zone, p, api) {
    const ctx = p.monter(zone, api) || {};
    return { montrer() { if (ctx.montrer) ctx.montrer(); } };
  }

  const PARTIES = { choix: pChoix, nombre: pNombre, gabarit: pGabarit, sci: pSci, perso: pPerso };

  /* ============================================================
     « AFFICHER TOUT LE COURS »
     Les questions et les « À toi » en cours s'inscrivent ici. Quand
     l'élève demande tout le cours, chacun « se déplie » : toutes ses
     parties sont affichées d'un coup, avec le bouton « Afficher la
     réponse » disponible tout de suite. CU.tout reste vrai ensuite :
     les nouvelles questions s'affichent directement dépliées.
     ============================================================ */
  const vivants = new Set();

  /* ============================================================
     UNE QUESTION : parties successives
     q = { parties: [p] } ; p = { type, q (texte), figure(zone), solution (HTML affiché après), … }
     mode : 'serie'    bouton « Afficher la réponse » (0 point pour la question)
            'exercice' bouton « Voir la correction » toujours disponible
            'cours'    « Afficher la réponse » proposé après une erreur
                       (ou tout de suite quand tout le cours est affiché)
     cb.fin(points) : 2 sans erreur, 1 après au moins une erreur, 0 si une réponse est affichée
     ============================================================ */
  function question(zone, q, cb, mode) {
    mode = mode || 'serie';
    const etat = { erreurs: 0, vue: false, fini: false, details: [] };
    const n = q.parties.length, aides = [];
    let rendues = 0, finies = 0, deplie = false;
    const libAide = mode === 'exercice' ? 'Voir la correction' : 'Afficher la réponse';
    // « Afficher tout le cours » : les parties restantes apparaissent d'un coup
    const inst = {
      deplier() {
        if (deplie) return;
        deplie = true;
        aides.forEach(a => a.classList.remove('hidden'));
        while (rendues < n) partie();
      },
    };
    function partie() {
      const p = q.parties[rendues++];
      window.CU.partieEnCours = p;          // partie en cours (utile pour vérifier l'application)
      const d = el('div', 'ph-partie', `${p.q ? `<div class="ph-partie-q">${p.q}</div>` : ''}<div class="ph-partie-fig"></div><div class="ph-partie-zone"></div><div class="ph-partie-retour"></div>
        <div class="ph-partie-aide${mode === 'cours' && !deplie ? ' hidden' : ''}"><button type="button" class="btn-small">${libAide}</button></div>`);
      zone.appendChild(d);
      if (p.figure) p.figure(d.querySelector('.ph-partie-fig'));
      const ret = d.querySelector('.ph-partie-retour'), aide = d.querySelector('.ph-partie-aide'), bRep = aide.querySelector('button');
      aides.push(aide);
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
        reussi(silencieux, note) { terminer(false, silencieux, note); },
      };
      const ctx = PARTIES[p.type](d.querySelector('.ph-partie-zone'), p, api);
      p.ctx = ctx;
      bRep.onclick = () => { if (finie) return; ctx.montrer(); etat.vue = true; terminer(true); };
      function terminer(vue, silencieux, note) {
        finie = true;
        aide.remove();
        etat.details.push({ vue, erreurs: erreursIci });
        const titre = vue ? (mode === 'exercice' ? 'Correction' : 'Réponse') : (erreursIci ? 'C\'est juste.' : 'Juste !');
        const sol = p.solution || p.correction;
        if (sol || vue || note) {
          ret.innerHTML = `<div class="${vue ? 'callout' : 'callout-success'} er-retour ph-solution"><p><b class="${vue ? '' : 'er-ok'}">${titre}</b>${note ? ' ' + note : ''}</p>${sol ? `<div>${sol}</div>` : ''}</div>`;
        } else if (!silencieux) {
          ret.innerHTML = '<p class="ph-ok">✓ Juste</p>';
        } else ret.innerHTML = '';
        finies++;
        if (finies < n) {
          // partie suivante (déjà affichée si tout le cours est déplié)
          if (!deplie && rendues < n) {
            partie();
            const s = zone.lastElementChild;
            setTimeout(() => s.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 80);
          }
        } else {
          etat.fini = true;
          vivants.delete(inst);
          cb.fin(etat.vue ? 0 : etat.erreurs ? 1 : 2, etat);
        }
      }
    }
    if (mode === 'cours') vivants.add(inst);
    partie();
    if (mode === 'cours' && window.CU.tout) inst.deplier();
  }

  /* ============================================================
     SÉRIE DE QUESTIONS NOTÉE SUR 20
     opts = { app, badge, titre, intro, questions: niv => [q], revoir, suite, niveaux }
     q = { theme, consigne, enonce, figure(zone), parties, bilan }
     opts.niveaux = [{ id, nom }] (facultatif) : un bouton par niveau à la place
     de « Commencer » ; questions(niv) reçoit l'id du niveau choisi.
     ============================================================ */
  function serie(opts) {
    const app = opts.app;
    let qs = [], idx = 0, score = 0, recap = [], niv = null;
    const nomNiv = () => (opts.niveaux.find(n => n.id === niv) || {}).nom;
    const pts = v => `${v} pt${v > 1 ? 's' : ''}`;

    function intro() {
      app.innerHTML = `<div class="er-card"><span class="er-badge">${opts.badge}</span><h2 class="er-titre">${opts.titre}</h2>${opts.intro || ''}
        <div class="cle" style="margin:14px 0"><p><b class="cle-titre">Barème</b> · ${opts.nombre || 10} questions, notées sur 20 :</p>
          <ul class="er-liste"><li><b>2 points</b> si tout est juste du premier coup ;</li><li><b>1 point</b> si tu y arrives après au moins une erreur ;</li><li><b>0 point</b> si tu affiches la réponse.</li></ul></div>
        ${opts.niveaux ? `<p><b>Choisis ton niveau :</b></p><div class="er-actions bf-niveaux">${opts.niveaux.map(n => `<button type="button" class="btn-primary" data-niv="${n.id}">${n.nom} →</button>`).join('')}</div>`
          : '<button type="button" class="btn-primary" data-a="go">Commencer →</button>'}</div>`;
      if (opts.niveaux) app.querySelectorAll('[data-niv]').forEach(b => { b.onclick = () => { niv = b.dataset.niv; demarrer(); }; });
      else app.querySelector('[data-a="go"]').onclick = demarrer;
      window.scrollTo(0, 0);
    }
    function demarrer() { qs = opts.questions(niv); idx = 0; score = 0; recap = []; afficher(); }

    function afficher() {
      if (idx >= qs.length) return fin();
      const q = qs[idx];
      window.CU.questionEnCours = q;          // question en cours (utile pour vérifier l'application)
      app.innerHTML = `<div class="er-card"><span class="er-badge">${opts.badge}</span><h2 class="er-titre">${opts.titre}</h2>
          <p class="er-meta">Question ${idx + 1}/${qs.length}${niv ? ` · Niveau ${nomNiv()}` : ''} · Score : <b data-a="score">${pts(score)}</b></p>
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
          const titre = p === 2 ? 'Bravo, juste du premier coup !' : p === 1 ? 'C\'est juste, après au moins une erreur.' : 'La réponse a été affichée.';
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
      const msg = score === max ? 'Tout est juste : bravo !' : pct >= 70 ? 'Très bien ! Encore un peu d\'entraînement pour le sans-faute.'
        : pct >= 50 ? 'Pas mal ! Recommence pour progresser : les questions changent à chaque fois.' : 'Continue à t\'entraîner : relis le cours, puis recommence.';
      app.innerHTML = `<div class="er-card er-fin"><span class="er-badge">${opts.badge}</span><h2 class="er-titre">Série terminée !</h2>${niv ? `<p class="er-meta">Niveau ${nomNiv()}</p>` : ''}
        ${score === max ? '<p class="er-trophee">🏆 Sans-faute !</p>' : ''}
        <div class="er-score">${fmt(note)} / 20</div><p class="er-score-pct">${pct} %</p><p class="er-contexte">${msg}</p>
        <div class="er-recap">${recap.map(r => `<div class="${r.p === 2 ? 'ok' : r.p === 1 ? 'moyen' : 'ko'}">Q${r.n}<b>${r.p}/2</b></div>`).join('')}</div>
        <div class="er-actions" style="justify-content:center"><button type="button" class="btn-secondary" data-a="re">↺ Recommencer avec d'autres questions</button>
        ${niv ? '<button type="button" class="btn-secondary" data-a="niv">Changer de niveau</button>' : ''}
        ${opts.revoir ? `<a class="btn-secondary" style="text-decoration:none" href="${opts.revoir.href}">${opts.revoir.label}</a>` : ''}
        ${opts.suite ? `<a class="btn-primary" style="text-decoration:none" href="${opts.suite.href}">${opts.suite.label}</a>` : ''}</div></div>`;
      app.querySelector('[data-a="re"]').onclick = demarrer;
      if (niv) app.querySelector('[data-a="niv"]').onclick = intro;
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
     FIGURES À LA LARGEUR DISPONIBLE
     CU.fig(dessin) renvoie un emplacement HTML ; dès qu'il est dans la
     page, dessin(W) y est appelé avec la largeur disponible W (et de
     nouveau quand la largeur change) : les textes gardent leur taille
     et restent lisibles sur un téléphone. Plusieurs figures par page.
     ============================================================ */
  const DESSINS = new Map();
  let nFig = 0, nMotif = 0;
  function fig(dessin, cls) {
    const k = String(++nFig);
    DESSINS.set(k, dessin);
    return `<div class="cu-fig${cls ? ' ' + cls : ''}" data-fig="${k}"></div>`;
  }
  // dessine dans div et suit les changements de largeur (rotation du téléphone…)
  function monter(div, dessin) {
    if (div.dataset.monte) return;
    div.dataset.monte = '1';
    let largeur = 0;
    const tracerIci = () => {
      const W = Math.round(div.clientWidth);
      if (!W || W === largeur) return;
      largeur = W;
      div.innerHTML = dessin(W);
    };
    if (window.ResizeObserver) new ResizeObserver(tracerIci).observe(div); else addEventListener('resize', tracerIci);
    tracerIci();
  }
  // les emplacements ajoutés à la page (cours, questions, exercices) sont dessinés tout seuls
  function chercher(racine) {
    if (!racine || !racine.querySelectorAll) return;
    const l = racine.matches && racine.matches('.cu-fig[data-fig]') ? [racine] : [];
    racine.querySelectorAll('.cu-fig[data-fig]').forEach(x => l.push(x));
    l.forEach(x => { const f = DESSINS.get(x.dataset.fig); if (f) monter(x, f); });
  }
  new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(chercher))).observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener('DOMContentLoaded', () => chercher(document.body));

  /* ============================================================
     OUTILS INTERACTIFS PLACÉS DANS DU HTML
     CU.outil(monter) renvoie un emplacement HTML ; dès qu'il est dans la
     page, monter(div) y construit l'outil, une seule fois.
     ============================================================ */
  const OUTILS = new Map();
  let nOutil = 0;
  function outil(f) {
    const k = String(++nOutil);
    OUTILS.set(k, f);
    return `<div class="cu-outil" data-outil="${k}"></div>`;
  }
  function chercherOutils(racine) {
    if (!racine || !racine.querySelectorAll) return;
    const l = racine.matches && racine.matches('.cu-outil[data-outil]') ? [racine] : [];
    racine.querySelectorAll('.cu-outil[data-outil]').forEach(x => l.push(x));
    l.forEach(x => {
      if (x.dataset.monte) return;
      const f = OUTILS.get(x.dataset.outil);
      if (f) { x.dataset.monte = '1'; f(x); }
    });
  }
  new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(chercherOutils))).observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener('DOMContentLoaded', () => chercherOutils(document.body));
  const cap = t => t.charAt(0).toUpperCase() + t.slice(1);

  /* ============================================================
     ÉCRITURES
     ============================================================ */
  const V = (n, s) => `<span class="vec-nom">${n}</span>${s ? `<sub>${s}</sub>` : ''}`;
  const NUL = V('0');
  const col = (a, b) => `<span class="vcol"><span>${a}</span><span>${b}</span></span>`;
  // système avec une accolade à sa hauteur : sys('x(t) = 3t + 2', 'y(t) = 0', …)
  const ACC = '<span class="cu-acc" aria-hidden="true"><svg viewBox="0 0 10 8"><path d="M10,1 Q5,1 5,8"/></svg><i></i>' +
    '<svg viewBox="0 0 10 14"><path d="M5,0 Q5,7 0,7 Q5,7 5,14"/></svg><i></i><svg viewBox="0 0 10 8"><path d="M5,0 Q5,7 10,7"/></svg></span>';
  const sys = (...l) => `<span class="cu-sys">${ACC}<span class="cu-sys-l">${l.map(x => `<span>${x}</span>`).join('')}</span></span>`;
  const rac = x => `<span class="racine">√<span>${x}</span></span>`;
  const MS = 'm·s<sup>−1</sup>', MS2 = 'm·s<sup>−2</sup>', VM = 'V·m<sup>−1</sup>';
  // constantes (valeurs du cours et des exercices)
  const E_CH = 1.60e-19, M_P = 1.67e-27, M_E = 9.11e-31;

  /* ============================================================
     PETITES FIGURES SVG
     ============================================================ */
  const ENCRE = '#16181d', ENCRE2 = '#55585f', ENCRE3 = '#8d8f94';
  const COUL = { v: '#c2570c', a: '#2952c8', E: '#0e7490', F: '#b0177f', traj: '#5a3fc4', grille: '#dcd7e8' };
  const f1 = v => (Math.round(v * 10) / 10).toString();
  const POLICE = 'Hanken Grotesk, Arial, sans-serif';
  // flèche de (x1, y1) à (x2, y2) ; o.ep (épaisseur), o.lt (longueur de la pointe), o.tirets
  function fl(x1, y1, x2, y2, coul, o) {
    o = o || {};
    const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy);
    if (L < 1) return '';
    const ux = dx / L, uy = dy / L, lt = Math.min(o.lt || 10, L * .6), lw = lt * .45, bx = x2 - ux * lt, by = y2 - uy * lt;
    return `<line x1="${f1(x1)}" y1="${f1(y1)}" x2="${f1(bx + ux)}" y2="${f1(by + uy)}" stroke="${coul || ENCRE}" stroke-width="${o.ep || 2.2}" stroke-linecap="round"${o.tirets ? ' stroke-dasharray="5 4"' : ''}/>` +
      `<path d="M${f1(x2)},${f1(y2)} L${f1(bx - uy * lw)},${f1(by + ux * lw)} L${f1(bx + uy * lw)},${f1(by - ux * lw)} Z" fill="${coul || ENCRE}"/>`;
  }
  // nom d'un vecteur centré en x : lettre, indice, petite flèche au-dessus de la lettre
  function nom(x, y, n, s, coul, o) {
    o = o || {};
    const t = o.t || 14, wl = n.length * t * .62, ws = s ? s.length * t * .45 : 0, x0 = x - (wl + ws) / 2, c = coul || ENCRE;
    return `<g fill="${c}" stroke="none"><text x="${f1(x0)}" y="${f1(y)}" font-size="${t}" font-weight="800" font-family="${POLICE}">${n}${s ? `<tspan dy="${f1(t * .3)}" font-size="${f1(t * .68)}">${s}</tspan>` : ''}</text>` +
      `<path d="M${f1(x0 + 1)},${f1(y - t * .9)} h${f1(wl)} m-3,-2.5 l3,2.5 l-3,2.5" fill="none" stroke="${c}" stroke-width="1.2"/></g>`;
  }
  const txt = (x, y, t, o) => { o = o || {}; return `<text x="${f1(x)}" y="${f1(y)}" font-size="${o.t || 12}" font-weight="${o.g || 600}" fill="${o.c || ENCRE2}" text-anchor="${o.a || 'start'}" font-family="${POLICE}">${t}</text>`; };
  const svg = (w, h, contenu, aria, cls) => `<div class="cu-fig-cadre"><svg viewBox="0 0 ${w} ${h}" class="cu-figure${cls ? ' ' + cls : ''}" style="max-width:${Math.round(w * 1.3)}px" role="img" aria-label="${aria}">${contenu}</svg></div>`;

  /* ---------- Chute libre : repère, sol, départ, v⃗₀, trajectoire ----------
     o = { h, v0, alpha (degrés), g (9,81), axe ('y' ou 'z'), traj (true), v0Vec (true),
           gVec (true), sommet, chute (points S et C), hTxt ('h'), aria, W, H } */
  function figTir(o) {
    o = Object.assign({ h: 2, v0: 5, alpha: 0, g: 9.81, axe: 'y', traj: true, v0Vec: true, gVec: true, W: 340, H: 200, hTxt: 'h' }, o);
    const a = o.alpha * Math.PI / 180, vx = o.v0 * Math.cos(a), vy = o.v0 * Math.sin(a);
    const tc = (vy + Math.sqrt(vy * vy + 2 * o.g * o.h)) / o.g;
    const X = Math.max(vx * tc, o.h * .8, .5), Y = Math.max(o.h + (vy > 0 ? vy * vy / (2 * o.g) : 0), .5);
    // même échelle sur les deux axes (l'angle α n'est pas déformé)
    const mg = { g: 34, d: 34, h: 26, b: 26 };
    const s = Math.min((o.W - mg.g - mg.d) / (X * 1.12), (o.H - mg.h - mg.b) / (Y * 1.15));
    const px = x => mg.g + x * s, py = y => o.H - mg.b - y * s;
    let c = `<line x1="8" y1="${f1(py(0))}" x2="${o.W - 8}" y2="${f1(py(0))}" stroke="${ENCRE2}" stroke-width="1.5"/>`;
    for (let x = 12; x < o.W - 8; x += 12) c += `<line x1="${x}" y1="${f1(py(0) + 1)}" x2="${x - 7}" y2="${f1(py(0) + 8)}" stroke="${ENCRE3}" stroke-width="1"/>`;
    // axes
    c += fl(px(0), py(0), o.W - 12, py(0), ENCRE, { ep: 1.4, lt: 8 }) + fl(px(0), py(0), px(0), 10, ENCRE, { ep: 1.4, lt: 8 });
    c += txt(o.W - 14, py(0) - 7, 'x', { g: 800, c: ENCRE, t: 13, a: 'end' }) + txt(px(0) + 8, 20, o.axe, { g: 800, c: ENCRE, t: 13 }) + txt(px(0) - 6, py(0) + 15, 'O', { g: 800, c: ENCRE, t: 12, a: 'end' });
    // hauteur de départ
    if (o.h > 0) c += `<line x1="${f1(px(0) - 4)}" y1="${f1(py(o.h))}" x2="${f1(px(0) + 4)}" y2="${f1(py(o.h))}" stroke="${ENCRE}" stroke-width="1.4"/>` + txt(px(0) - 7, py(o.h) + 4, o.hTxt, { g: 800, c: ENCRE, t: 12, a: 'end' });
    // trajectoire
    if (o.traj) {
      let d = '';
      for (let k = 0; k <= 60; k++) { const t = tc * k / 60; d += `${k ? 'L' : 'M'}${f1(px(vx * t))},${f1(py(o.h + vy * t - o.g * t * t / 2))}`; }
      c += `<path d="${d}" fill="none" stroke="${COUL.traj}" stroke-width="2.2" stroke-dasharray="6 4"/>`;
    }
    if (o.sommet && vy > 0) {
      const ts = vy / o.g, xs = px(vx * ts), ys = py(o.h + vy * vy / (2 * o.g));
      c += `<circle cx="${f1(xs)}" cy="${f1(ys)}" r="3.5" fill="${ENCRE}"/>` + txt(xs, ys - 8, 'S', { g: 800, c: ENCRE, t: 12, a: 'middle' });
      if (o.sommet === 'v') c += fl(xs, ys, xs + 34, ys, COUL.v, { ep: 2.2 }) + nom(xs + 30, ys - 8, 'v', '', COUL.v, { t: 13 });
    }
    if (o.chute) c += `<circle cx="${f1(px(vx * tc))}" cy="${f1(py(0))}" r="3.5" fill="${ENCRE}"/>` + txt(px(vx * tc), py(0) + 16, 'C', { g: 800, c: ENCRE, t: 12, a: 'middle' });
    // point de départ, vitesse initiale et son angle
    c += `<circle cx="${f1(px(0))}" cy="${f1(py(o.h))}" r="5" fill="${ENCRE}"/>`;
    if (o.v0Vec && o.v0 > 0) {
      const L = 46;
      c += fl(px(0), py(o.h), px(0) + L * Math.cos(a), py(o.h) - L * Math.sin(a), COUL.v, { ep: 2.4 }) + nom(px(0) + L * Math.cos(a) + 10, py(o.h) - L * Math.sin(a) - 2, 'v', '0', COUL.v, { t: 13 });
      if (o.alpha) {
        c += `<line x1="${f1(px(0))}" y1="${f1(py(o.h))}" x2="${f1(px(0) + 40)}" y2="${f1(py(o.h))}" stroke="${ENCRE3}" stroke-width="1" stroke-dasharray="3 3"/>`;
        c += `<path d="M${f1(px(0) + 24)},${f1(py(o.h))} A24,24 0 0 0 ${f1(px(0) + 24 * Math.cos(a))},${f1(py(o.h) - 24 * Math.sin(a))}" fill="none" stroke="${ENCRE2}" stroke-width="1.2"/>` + txt(px(0) + 28, py(o.h) - 5, 'α', { g: 700, c: ENCRE2, t: 12 });
      }
    }
    if (o.gVec) c += fl(o.W - 24, 14, o.W - 24, 50, COUL.a, { ep: 2.2 }) + nom(o.W - 12, 40, 'g', '', COUL.a, { t: 13 });
    return svg(o.W, o.H, c, o.aria || 'Repère : axe horizontal x, axe vertical vers le haut, point de départ à la hauteur h, vecteur vitesse initiale et trajectoire', 'cu-fig-tir');
  }

  /* ---------- Condensateur plan horizontal ----------
     o = { haut: '+' ou '−' (signe de l'armature du haut), E (true : flèches de E⃗), U (true : flèche de U),
           q: 1 | −1 | 0 (particule entrant en O), ang (angle de v⃗₀, degrés), traj (true), a (true : a⃗ ou F⃗ dessinée),
           nomA, nomB (noms des armatures), W, H, aria } */
  function condo(o) {
    o = Object.assign({ haut: '+', E: true, U: true, q: 0, ang: 0, traj: true, W: 340, H: 170 }, o);
    const yh = 28, yb = o.H - 28, x0 = 40, x1 = o.W - 50, ym = (yh + yb) / 2, haut = o.haut === '+';
    let c = '';
    [[yh, haut ? '+' : '−'], [yb, haut ? '−' : '+']].forEach(([y, sg]) => {
      c += `<rect x="${x0}" y="${y - 3}" width="${x1 - x0}" height="6" rx="2" fill="#ebe8e1" stroke="${ENCRE2}" stroke-width="1.2"/>`;
      for (let x = x0 + 22; x < x1; x += 52) c += txt(x, y < ym ? y - 8 : y + 18, sg, { g: 800, c: ENCRE, t: 15, a: 'middle' });
    });
    if (o.nomA) c += txt(x1 + 6, yh + 4, o.nomA, { g: 700, c: ENCRE2, t: 11 });
    if (o.nomB) c += txt(x1 + 6, yb + 4, o.nomB, { g: 700, c: ENCRE2, t: 11 });
    // champ : de l'armature + vers l'armature −
    if (o.E) {
      const xe = x1 - 34, d = haut ? 1 : -1;
      c += fl(xe, ym - 30 * d, xe, ym + 30 * d, COUL.E, { ep: 2.2 }) + nom(xe + 14, ym + 4, 'E', '', COUL.E, { t: 14 });
    }
    // tension : la flèche de U pointe vers la borne +
    if (o.U) {
      const xu = o.W - 20, d = haut ? -1 : 1;
      c += fl(xu, ym - (yb - yh) / 2 * d + 4 * d, xu, ym + (yb - yh) / 2 * d - 4 * d, ENCRE, { ep: 1.6, lt: 8 }) + txt(xu + 6, ym + 4, 'U', { g: 800, c: ENCRE, t: 13 });
    }
    // particule entrant en O, vecteur vitesse initiale, trajectoire parabolique
    if (o.q) {
      c += txt(x0 - 6, ym + 4, 'O', { g: 800, c: ENCRE, t: 12, a: 'end' });
      const ar = o.ang * Math.PI / 180, bas = (o.q > 0) === haut;           // accélération vers le bas ?
      if (o.traj) {
        const k = 46 / Math.pow(x1 - x0 - 30, 2) * (o.ang ? 2.6 : 1);
        let d = `M${x0},${ym}`, x = 0, y = ym, touche = false;
        const Lp = x1 - x0, zx = X => ym - Math.tan(ar) * X + (bas ? 1 : -1) * k * X * X;
        for (x = 3; x <= Lp; x += 3) {
          y = zx(x);
          if (y < yh + 4 || y > yb - 4) { y = Math.max(yh + 4, Math.min(yb - 4, y)); d += `L${f1(x0 + x)},${f1(y)}`; touche = true; break; }
          d += `L${f1(x0 + x)},${f1(y)}`;
        }
        // sortie : mouvement rectiligne uniforme (tangente au point de sortie)
        if (!touche) { const pente = -Math.tan(ar) + (bas ? 2 : -2) * k * Lp; d += `L${f1(x1 + 18)},${f1(zx(Lp) + pente * 18)}`; }
        c += `<path d="${d}" fill="none" stroke="${COUL.traj}" stroke-width="2.2" stroke-dasharray="6 4"/>`;
      }
      c += `<circle cx="${x0}" cy="${ym}" r="5" fill="${o.q > 0 ? '#fff' : ENCRE}" stroke="${ENCRE}" stroke-width="1.6"/>` + txt(x0, ym + 3.5, o.q > 0 ? '+' : '−', { g: 800, c: o.q > 0 ? ENCRE : '#fff', t: 9, a: 'middle' });
      c += fl(x0 + 6 * Math.cos(ar), ym - 6 * Math.sin(ar), x0 + 48 * Math.cos(ar), ym - 48 * Math.sin(ar), COUL.v, { ep: 2.2 }) + nom(x0 + 48 * Math.cos(ar) + 6, ym - 48 * Math.sin(ar) - 6, 'v', '0', COUL.v, { t: 13 });
      if (o.a) c += fl(x0 + 70, ym, x0 + 70, ym + (bas ? 34 : -34), COUL.F, { ep: 2.2 }) + nom(x0 + 84, ym + (bas ? 28 : -18), o.a === 'F' ? 'F' : 'a', '', COUL.F, { t: 13 });
    }
    return svg(o.W, o.H, c, o.aria || `Condensateur plan : armature du haut chargée ${haut ? 'positivement' : 'négativement'} ; le champ électrique va de l'armature positive vers l'armature négative ; la flèche de la tension U pointe vers l'armature positive`, 'cu-fig-condo');
  }

  /* ---------- Graphique de fonctions du temps ----------
     o = { tmax, ymin, ymax, pasT, pasY, series: [{ f, coul, nom }], nomX ('t (s)'), nomY, W, H, aria, points: [[t, y, texte]] } */
  function courbes(o) {
    o = Object.assign({ W: 320, H: 180, nomX: 't (s)', nomY: '' }, o);
    const g = 40, d = 26, h = 22, b = 26;
    const X = t => g + t / o.tmax * (o.W - g - d), Y = y => h + (o.ymax - y) / (o.ymax - o.ymin) * (o.H - h - b);
    let c = '';
    for (let t = 0; t <= o.tmax + 1e-9; t += o.pasT) c += `<line x1="${f1(X(t))}" y1="${f1(Y(o.ymin))}" x2="${f1(X(t))}" y2="${f1(Y(o.ymax))}" stroke="${COUL.grille}" stroke-dasharray="3 3"/>` + txt(X(t), Y(Math.max(o.ymin, 0)) + 14, fmt(+t.toFixed(6)), { t: 10, a: 'middle' });
    for (let y = Math.ceil(o.ymin / o.pasY) * o.pasY; y <= o.ymax + 1e-9; y += o.pasY) c += `<line x1="${f1(X(0))}" y1="${f1(Y(y))}" x2="${f1(X(o.tmax))}" y2="${f1(Y(y))}" stroke="${COUL.grille}" stroke-dasharray="3 3"/>` + (Math.abs(y) > 1e-9 ? txt(X(0) - 5, Y(y) + 4, fmt(+y.toFixed(6)), { t: 10, a: 'end' }) : '');
    c += fl(X(0), Y(Math.max(o.ymin, 0)), o.W - 8, Y(Math.max(o.ymin, 0)), ENCRE, { ep: 1.3, lt: 7 }) + fl(X(0), Y(o.ymin), X(0), 6, ENCRE, { ep: 1.3, lt: 7 });
    c += txt(o.W - 8, Y(Math.max(o.ymin, 0)) - 6, o.nomX, { g: 700, c: ENCRE, t: 11, a: 'end' }) + txt(X(0) + 6, 13, o.nomY, { g: 700, c: ENCRE, t: 11 });
    o.series.forEach(s => {
      let p = '';
      for (let k = 0; k <= 80; k++) { const t = o.tmax * k / 80, y = s.f(t); if (y < o.ymin - 1e-9 || y > o.ymax + 1e-9) continue; p += `${p ? 'L' : 'M'}${f1(X(t))},${f1(Y(y))}`; }
      c += `<path d="${p}" fill="none" stroke="${s.coul || COUL.traj}" stroke-width="2.4"/>`;
      if (s.nom) { const t = s.tNom == null ? o.tmax * .72 : s.tNom; c += txt(X(t) + 4, Y(s.f(t)) - 7, s.nom, { g: 800, c: s.coul || COUL.traj, t: 11 }); }
    });
    (o.points || []).forEach(([t, y, n]) => { c += `<circle cx="${f1(X(t))}" cy="${f1(Y(y))}" r="3.5" fill="${ENCRE}"/>` + (n ? txt(X(t) + 6, Y(y) - 6, n, { g: 700, c: ENCRE, t: 11 }) : ''); });
    return svg(o.W, o.H, c, o.aria || 'Graphique en fonction du temps', 'cu-fig-courbe');
  }

  /* ============================================================
     ATELIER « PRIMITIVE ET CONDITION INITIALE » (partie 'perso')
     o = { q, A, forme ('lin' : A t + C ; 'quad' : ½ A t² + C), C0 (condition initiale),
           nom ('v'), unite (HTML), ymin, ymax, tmax, solution }
     La courbe de la primitive (forme donnée par la dérivée) se glisse
     verticalement (doigt, souris, boutons ▲ ▼, flèches du clavier) jusqu'à
     passer par le point de la condition initiale ; « Valider » vérifie C.
     ============================================================ */
  function partieConstante(o) {
    o = Object.assign({ forme: 'lin', nom: 'v', tmax: 4, ymin: -6, ymax: 12 }, o);
    const f = (t, C) => (o.forme === 'lin' ? o.A * t + C : o.A * t * t / 2 + C);
    return { type: 'perso', q: o.q, solution: o.solution, monter(zone, api) {
      let C = o.depart == null ? 0 : o.depart, fini = false;
      const d = el('div', 'cu-cst');
      d.innerHTML = `<div class="cu-cst-corps"><svg class="cu-cst-svg" tabindex="0" role="img" aria-label="Graphique de ${o.nom}(t) : glisse la courbe vers le haut ou vers le bas"></svg>
        <div class="cu-cst-pad" role="group" aria-label="Déplacer la courbe"><button type="button" data-d="1" aria-label="Monter la courbe d'une unité">▲</button><button type="button" data-d="-1" aria-label="Descendre la courbe d'une unité">▼</button></div></div>
        <p class="cu-cst-val" aria-live="polite"></p>`;
      zone.appendChild(d);
      const s = d.querySelector('svg'), W = 300, H = 190, g = 34, b = 22, h = 14, dr = 14;
      s.setAttribute('viewBox', `0 0 ${W} ${H}`);
      const X = t => g + t / o.tmax * (W - g - dr), Y = y => h + (o.ymax - y) / (o.ymax - o.ymin) * (H - h - b);
      function dessiner() {
        let c = `<rect width="${W}" height="${H}" fill="#fff"/>`;
        for (let y = o.ymin; y <= o.ymax; y++) c += `<line x1="${X(0)}" y1="${f1(Y(y))}" x2="${X(o.tmax)}" y2="${f1(Y(y))}" stroke="${COUL.grille}" stroke-width="${y % 2 ? .6 : 1}"/>` + (y % 2 === 0 && y ? txt(X(0) - 4, Y(y) + 4, fmt(y), { t: 10, a: 'end' }) : '');
        for (let t = 0; t <= o.tmax; t++) c += `<line x1="${f1(X(t))}" y1="${Y(o.ymin)}" x2="${f1(X(t))}" y2="${Y(o.ymax)}" stroke="${COUL.grille}"/>` + (t ? txt(X(t), Y(0) + 13, fmt(t), { t: 10, a: 'middle' }) : '');
        c += fl(X(0), Y(0), W - 4, Y(0), ENCRE, { ep: 1.3, lt: 7 }) + fl(X(0), Y(o.ymin), X(0), 4, ENCRE, { ep: 1.3, lt: 7 }) + txt(W - 6, Y(0) - 5, 't', { g: 800, c: ENCRE, t: 12, a: 'end' }) + txt(X(0) + 5, 12, o.nom, { g: 800, c: ENCRE, t: 12 });
        // condition initiale
        c += `<circle cx="${X(0)}" cy="${f1(Y(o.C0))}" r="7" fill="none" stroke="${COUL.v}" stroke-width="2"/>` + txt(X(0) + 10, Y(o.C0) + (o.C0 >= o.ymax - 2 ? 14 : -8), `${o.nom}(0) = ${fmt(o.C0)}`, { g: 800, c: COUL.v, t: 11 });
        let p = '';
        for (let k = 0; k <= 60; k++) { const t = o.tmax * k / 60, y = f(t, C); if (y < o.ymin || y > o.ymax) { if (p) break; continue; } p += `${p ? 'L' : 'M'}${f1(X(t))},${f1(Y(y))}`; }
        c += `<path d="${p}" fill="none" stroke="${fini ? '#16a34a' : COUL.traj}" stroke-width="3"/>`;
        s.innerHTML = c;
        const k = o.forme === 'lin' ? o.A : o.A / 2, ex = `${k === 1 ? '' : fmt(k)}t${o.forme === 'lin' ? '' : '<sup>2</sup>'}`;
        d.querySelector('.cu-cst-val').innerHTML = `${o.nom}(t) = ${ex} ${C < 0 ? '−' : '+'} <b>${fmt(Math.abs(C))}</b> &nbsp;·&nbsp; ${o.nom}(0) = ${fmt(C)}`;
      }
      function poser(c) { if (fini || api.fini()) return; C = Math.max(o.ymin, Math.min(o.ymax, c)); api.effacer(); dessiner(); }
      d.querySelectorAll('[data-d]').forEach(bt => { bt.onclick = () => poser(C + Number(bt.dataset.d)); });
      s.addEventListener('keydown', e => { const k = { ArrowUp: 1, ArrowDown: -1 }[e.key]; if (k) { e.preventDefault(); poser(C + k); } });
      let prise = null;
      const yDe = e => { const r = s.getBoundingClientRect(); return o.ymax - ((e.clientY - r.top) * H / r.height - h) / (H - h - b) * (o.ymax - o.ymin); };
      s.addEventListener('pointerdown', e => { prise = { id: e.pointerId, y: yDe(e), C }; try { s.setPointerCapture(e.pointerId); } catch (er) { /* rien */ } e.preventDefault(); });
      s.addEventListener('pointermove', e => { if (!prise || prise.id !== e.pointerId) return; const c = Math.round(prise.C + yDe(e) - prise.y); if (c !== C) poser(c); });
      const lacher = e => { if (prise && prise.id === e.pointerId) prise = null; };
      s.addEventListener('pointerup', lacher); s.addEventListener('pointercancel', lacher);
      const bVal = boutonValider(zone);
      bVal.onclick = () => {
        if (api.fini()) return;
        if (C === o.C0) { fini = true; dessiner(); bVal.fermer(); api.reussi(); return; }
        api.erreur(`À t = 0, ta courbe donne ${o.nom}(0) = ${fmt(C)} : elle doit passer par le point de la condition initiale, ${o.nom}(0) = ${fmt(o.C0)}. Fais-la glisser (ou utilise ▲ ▼).`);
      };
      dessiner();
      return { montrer() { C = o.C0; fini = true; dessiner(); bVal.fermer(); } };
    } };
  }

  /* ============================================================
     PLAN DE L'APPLICATION ET NAVIGATION (voir assets/sommaire.js)
     ============================================================ */
  const PLAN = [
    { n: 1, titre: 'De l\'accélération à la position', desc: 'Intégrer : primitives, constantes fixées par les conditions initiales, les six étapes de résolution', fiche: 'fiche_1',
      parties: [{ nom: 'De l\'accélération à la position', cours: 'module_1_cours', questions: 'module_1_questions' }] },
    { n: 2, titre: 'Chute libre dans un champ de pesanteur uniforme', desc: 'Équations horaires, mouvement plan, trajectoire parabolique, durée de chute, portée, altitude maximale', fiche: 'fiche_2',
      sousModules: true,
      parties: [
        { nom: 'Chute sans vitesse initiale', slug: 'sans-vitesse', cours: 'module_2a_cours', noms: { cours: 'Cours : chute sans vitesse initiale' } },
        { nom: 'Vitesse initiale horizontale', slug: 'horizontale', cours: 'module_2b_cours', noms: { cours: 'Cours : vitesse initiale horizontale' } },
        { nom: 'Vitesse initiale quelconque', slug: 'quelconque', cours: 'module_2c_cours', noms: { cours: 'Cours : vitesse initiale quelconque' } },
        { nom: 'Exploiter les équations', slug: 'exploiter', cours: 'module_2d_cours', noms: { cours: 'Cours : exploiter les équations' } },
        { nom: 'Chute libre', simulation: 'module_2_simulation', questions: 'module_2_questions', noms: { simulation: 'Simulateur : tir dans le champ de pesanteur' } }] },
    { n: 3, titre: 'Particule chargée dans un champ électrique uniforme', desc: 'Condensateur plan, E = U / L, force q<span class="vec-nom">E</span>, poids négligeable, équations du mouvement, déviation', fiche: 'fiche_3',
      sousModules: true,
      parties: [
        { nom: 'Champ électrique et condensateur plan', slug: 'condensateur', cours: 'module_3a_cours', noms: { cours: 'Cours : champ électrique et condensateur plan' } },
        { nom: 'Poids et force électrique', slug: 'poids', cours: 'module_3b_cours', noms: { cours: 'Cours : poids et force électrique' } },
        { nom: 'Équations du mouvement', slug: 'equations', cours: 'module_3c_cours', noms: { cours: 'Cours : équations du mouvement' } },
        { nom: 'Déviation d\'une particule', slug: 'deviation', cours: 'module_3d_cours', noms: { cours: 'Cours : déviation d\'une particule' } },
        { nom: 'Particule chargée', simulation: 'module_3_simulation', questions: 'module_3_questions', noms: { simulation: 'Simulateur : déviation dans un condensateur' } }] },
    { n: 4, titre: 'Accélérateurs de particules', desc: 'Vitesse de sortie v = √(2qU / m), succession de condensateurs et inversion de polarité, applications', fiche: 'fiche_4',
      sousModules: true,
      parties: [
        { nom: 'Accélération dans un condensateur', slug: 'acceleration', cours: 'module_4a_cours', noms: { cours: 'Cours : accélération dans un condensateur' } },
        { nom: 'Accélérateur linéaire et applications', slug: 'pratique', cours: 'module_4b_cours', noms: { cours: 'Cours : accélérateur linéaire et applications' } },
        { nom: 'Accélérateurs', simulation: 'module_4_simulation', questions: 'module_4_questions', noms: { simulation: 'Animation : accélérateur linéaire' } }] },
    { n: 5, titre: 'Exercices', desc: 'Les exercices 1 à 16 de la feuille (avec 1 bis et 2 bis), guidés pas à pas', exercices: 'module_5', exNom: 'Exercices 1 à 16', nbEx: 18 },
  ];
  window.SOM.init({ nom: 'Mouvement dans un champ uniforme', id: 'champ-uniforme', cleEx: 'champ-uniforme-exercices', plan: PLAN });
  const menu = cle => window.SOM.menu(cle);
  const accueil = zone => window.SOM.accueil(zone);

  window.CU = Object.assign(window.CU || {}, {
    MOINS, fmt, cs, sci, lire, proche, fr, unite, o, fq, el, secouer, melanger, hasard, entre, champ, PARTIES, boutonValider, CALC,
    question, serie, confettis, fig, monter, outil, cap,
    V, NUL, col, sys, rac, MS, MS2, VM, E_CH, M_P, M_E,
    ENCRE, ENCRE2, ENCRE3, COUL, fl, nom, txt, svg, figTir, condo, courbes, partieConstante,
    PLAN, menu, accueil,
  });
})();
