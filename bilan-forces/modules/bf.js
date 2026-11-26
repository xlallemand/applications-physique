/* ============================================================
   Moteur de l'application « Bilan des forces » (2de, 1re, Terminale
   spécialité), extrait du moteur de « Chapitre 6 : Principe fondamental
   de la dynamique » (principe-dynamique/modules/pfd.js : même moteur de
   questions que « Cinématique » ; navigation commune assets/sommaire.js,
   cours avec assets/cours.js)

   BF.fmt, BF.cs, BF.sci, BF.lire        écriture et lecture des nombres (virgule)
   BF.o, BF.fq.choix, BF.fq.nombre       fabriques d'options et de parties de question
   BF.PARTIES                            parties de question : 'choix', 'nombre', 'gabarit',
                                         'sci', 'perso' (p.monter(zone, api) → { montrer() })
   BF.question(zone, q, cb, mode)        question en plusieurs parties (série, exercice, cours)
   BF.serie(opts)                        série de questions notée sur 20
   BF.outil(monter)                      outil interactif placé dans du HTML
   BF.V(n, s), BF.nomV(clé)              noms de vecteurs (flèche au-dessus) : <span class="vec-nom">P</span>, <span class="vec-nom">R</span>ₙ, <span class="vec-nom">f</span>, <span class="vec-nom">T</span>…
   BF.couleurs(noms)                     une couleur différente pour chaque force d'un dessin
   BF.scene(s, o), BF.sceneRemplie(s, o) dessin d'une situation (SVG), avec ses forces (flèches superposées décalées) ;
                                         o.reaction : la réaction R⃗ = R⃗ₙ + f⃗ du support dessinée en plus (Terminale)
   BF.reactions(s)                       réactions décomposées d'une situation : [{ acteur, pt, iN, iF, ang, L }]
   BF.diagramme(sys, objets), BF.diagrammeDe(s, etat)
                                         diagramme objet-action (SVG)
   BF.bilan(s, opts)                     bilan des forces étape par étape (situations : modules/situations.js),
                                         méthode du diagramme objet-action : actions à distance, objets qui
                                         touchent le système, force de l'air négligeable ou non, puis tracé
                                         des forces sur le schéma, noms, compensation
   BF.verif                              vérifications et diagnostics de chaque étape du bilan (atelier)
   BF.infoForces()                       infographie : forces à distance, forces de contact
   BF.partieResultante(o), BF.partieAcc(o)
                                         tracer Σ <span class="vec-nom">F</span> puis <span class="vec-nom">a</span> (ou <span class="vec-nom">Δv</span>) dans un quadrillage
                                         (repère de cinematique/modules/vecteurs.js, à charger avant)
   BF.partieCentre(o), BF.solide(o)      centre de masse : placer G sur un solide (homogène ou non)
   BF.menu(cle), BF.accueil(zone)        navigation commune (SOM) avec le plan de l'application ;
                                         le niveau écrit à la fin d'un nom de page (« · 2de ») devient une pastille

   Les styles des cartes, boutons et écrans de fin viennent de
   equilibrer-reactions/modules/er.css (même présentation).
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
    const d = el('div', 'ph-valeur bf-gab');
    if (p.label) d.appendChild(el('span', 'ph-lab', p.label));
    // chaque case forme un groupe insécable avec le texte qui la suit (et le texte d'ouverture
    // avec la première case) : sur un petit écran, la ligne ne se coupe qu'entre deux groupes
    const champs = [];
    let grp = el('span', 'bf-gab-grp');
    d.appendChild(grp);
    p.morceaux.forEach(m => {
      if (typeof m === 'string') { grp.appendChild(el('span', 'bf-gab-txt', m)); return; }
      if (champs.length) { grp = el('span', 'bf-gab-grp'); d.appendChild(grp); }
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
     réponse » disponible tout de suite. BF.tout reste vrai ensuite :
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
      window.BF.partieEnCours = p;          // partie en cours (utile pour vérifier l'application)
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
    if (mode === 'cours' && window.BF.tout) inst.deplier();
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
      window.BF.questionEnCours = q;          // question en cours (utile pour vérifier l'application)
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
      app.innerHTML = `<div class="er-card er-fin"><span class="er-badge">${opts.badge}</span><h2 class="er-titre">Série terminée !</h2>${niv ? `<p class="er-meta">Niveau ${nomNiv()}</p>` : ''}
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
     BF.fig(dessin) renvoie un emplacement HTML ; dès qu'il est dans la
     page, dessin(W) y est appelé avec la largeur disponible W (et de
     nouveau quand la largeur change) : les textes gardent leur taille
     et restent lisibles sur un téléphone. Plusieurs figures par page.
     ============================================================ */
  const DESSINS = new Map();
  let nFig = 0, nMotif = 0;
  function fig(dessin, cls) {
    const k = String(++nFig);
    DESSINS.set(k, dessin);
    return `<div class="bf-fig${cls ? ' ' + cls : ''}" data-fig="${k}"></div>`;
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
    const l = racine.matches && racine.matches('.bf-fig[data-fig]') ? [racine] : [];
    racine.querySelectorAll('.bf-fig[data-fig]').forEach(x => l.push(x));
    l.forEach(x => { const f = DESSINS.get(x.dataset.fig); if (f) monter(x, f); });
  }
  new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(chercher))).observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener('DOMContentLoaded', () => chercher(document.body));

  /* ============================================================
     OUTILS INTERACTIFS PLACÉS DANS DU HTML
     BF.outil(monter) renvoie un emplacement HTML ; dès qu'il est dans la
     page, monter(div) y construit l'outil, une seule fois.
     ============================================================ */
  const OUTILS = new Map();
  let nOutil = 0;
  function outil(f) {
    const k = String(++nOutil);
    OUTILS.set(k, f);
    return `<div class="bf-outil" data-outil="${k}"></div>`;
  }
  function chercherOutils(racine) {
    if (!racine || !racine.querySelectorAll) return;
    const l = racine.matches && racine.matches('.bf-outil[data-outil]') ? [racine] : [];
    racine.querySelectorAll('.bf-outil[data-outil]').forEach(x => l.push(x));
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
     NOMS DES VECTEURS FORCES (HTML et SVG)
     ============================================================ */
  const V = (n, s) => `<span class="vec-nom">${n}</span>${s ? `<sub>${s}</sub>` : ''}`;
  // F⃗archi : poussée d'Archimède (eau, huile, air…) ; F⃗air : force de l'air (ses frottements)
  const NOMS = { P: ['P'], RN: ['R', 'N'], R: ['R'], f: ['f'], T: ['T'], Farchi: ['F', 'archi'], Fair: ['F', 'air'], Fm: ['F', 'm'], Fmag: ['F', 'mag'], Felec: ['F', 'élec'], Fpied: ['F', 'pied'], Fmain: ['F', 'main'], Fperche: ['F', 'perche'], Fvoiture: ['F', 'voiture'], F: ['F'] };
  const nomV = k => V(...NOMS[k]);
  // ce que désigne chaque nom (diagnostic d'un nom mal choisi)
  const SENS_NOM = {
    P: `${nomV('P')} est le <b>poids</b> : la force exercée par la Terre.`,
    RN: `${nomV('RN')} est la <b>réaction normale</b> du support, perpendiculaire au support (N comme normale).`,
    R: `${nomV('R')} est la <b>réaction</b> du support (<span class="vec-nom">R</span> = <span class="vec-nom">R</span><sub>N</sub> + <span class="vec-nom">f</span>).`,
    f: `${nomV('f')} désigne les <b>frottements</b>.`,
    T: `${nomV('T')} est la <b>tension</b> d'un fil, d'un ressort ou d'une corde.`,
    Farchi: `${nomV('Farchi')} est la <b>poussée d'Archimède</b> exercée par un fluide (eau, huile, air…), verticale vers le haut.`,
    Fair: `${nomV('Fair')} est la force exercée par l'<b>air</b> (ses frottements).`,
    Fm: `${nomV('Fm')} est la <b>force motrice</b>.`,
    Fmag: `${nomV('Fmag')} est la force <b>magnétique</b> exercée par un aimant.`,
    Felec: `${nomV('Felec')} est la force <b>électrique</b> exercée par un objet chargé.`,
    Fpied: `${nomV('Fpied')} est la force exercée par le <b>pied</b>.`,
    Fmain: `${nomV('Fmain')} est la force exercée par la <b>main</b>.`,
    Fperche: `${nomV('Fperche')} est la force exercée par la <b>perche</b> du téléski.`,
    Fvoiture: `${nomV('Fvoiture')} est la force exercée par la <b>voiture</b> (par l'attelage).`,
    F: `${nomV('F')} est une force quelconque : ici, on attend un nom plus précis.`,
  };
  // largeur d'un nom en SVG
  const largeurNom = k => { const [p, s] = NOMS[k]; return p.length * 9.5 + (s ? s.length * 6.6 : 0); };
  // nom en SVG (lettre, indice, petite flèche au-dessus) ; x : centre, y : ligne de base ; coul : couleur de la force
  function nomSVG(k, x, y, cls, coul) {
    const [p, s] = NOMS[k];
    const wp = p.length * 9.5, ws = s ? s.length * 6.6 : 0, x0 = x - (wp + ws) / 2;
    const ya = y - 15, x2 = x0 + Math.max(wp, 9) + 1;
    return `<g class="bf-nom${cls ? ' ' + cls : ''}"${coul ? ` style="color:${coul}"` : ''}><text x="${x0.toFixed(1)}" y="${y.toFixed(1)}">${p}${s ? `<tspan dy="4" font-size="10.5">${s}</tspan>` : ''}</text>` +
      `<path d="M${(x0 + 1).toFixed(1)},${ya.toFixed(1)} H${x2.toFixed(1)} M${(x2 - 3).toFixed(1)},${(ya - 2.6).toFixed(1)} L${x2.toFixed(1)},${ya.toFixed(1)} L${(x2 - 3).toFixed(1)},${(ya + 2.6).toFixed(1)}"/></g>`;
  }

  /* ============================================================
     COULEURS DES VECTEURS FORCES : une couleur différente pour chaque
     force d'un même dessin (attributs de présentation des SVG, comme
     VEC.C). La couleur suit le nom de la force (le poids est toujours
     orange, la réaction du support bleue…) ; si deux forces d'un même
     dessin ont la même couleur, la seconde prend une couleur libre.
     ============================================================ */
  const COUL = { P: '#d9480f', RN: '#1971c2', R: '#1971c2', f: '#c2255c', T: '#5c940d', Farchi: '#0b7285', Fair: '#1098ad',
    Fm: '#b35c00', F: '#b35c00', Fpied: '#5c940d', Fmain: '#5c940d', Fperche: '#5c940d', Fvoiture: '#b35c00', Fmag: '#862e9c', Felec: '#862e9c' };
  const COUL_LIBRES = ['#5c940d', '#862e9c', '#b35c00', '#c2255c', '#1971c2', '#0b7285', '#d9480f', '#1098ad'];
  const COUL_QUAD = ['#d9480f', '#1971c2', '#5c940d', '#862e9c'];      // <span class="vec-nom">F</span>₁, <span class="vec-nom">F</span>₂… dans le quadrillage
  function couleurs(noms) {
    const res = noms.map(() => null), prises = [];
    // d'abord la couleur propre à chaque nom, puis une couleur libre pour les doublons
    noms.forEach((k, i) => { const c = COUL[k]; if (c && prises.indexOf(c) === -1) { res[i] = c; prises.push(c); } });
    noms.forEach((k, i) => {
      if (res[i]) return;
      res[i] = COUL_LIBRES.find(x => prises.indexOf(x) === -1) || COUL_LIBRES[0];
      prises.push(res[i]);
    });
    return res;
  }
  const couleursForces = fs => couleurs(fs.map(f => f.noms[0]));

  /* ============================================================
     DIRECTIONS (angles en degrés, 0 = vers la droite, 90 = vers le haut)
     ============================================================ */
  const DIRS8 = [[135, '↖'], [90, '↑'], [45, '↗'], [180, '←'], null, [0, '→'], [225, '↙'], [270, '↓'], [315, '↘']];
  const DIR_TXT = { 0: 'horizontale, vers la droite', 45: 'oblique, vers le haut et la droite', 90: 'verticale, vers le haut', 135: 'oblique, vers le haut et la gauche',
    180: 'horizontale, vers la gauche', 225: 'oblique, vers le bas et la gauche', 270: 'verticale, vers le bas', 315: 'oblique, vers le bas et la droite' };
  const ecartAngle = (a, b) => Math.abs((((a - b) % 360) + 540) % 360 - 180);
  function texteDir(s, ang) {
    const sp = (s.speciales || []).find(x => ecartAngle(x.ang, ang) < 2);
    if (sp) return sp.label;
    return DIR_TXT[((Math.round(ang / 45) * 45) % 360 + 360) % 360];
  }

  /* ============================================================
     SCÈNE D'UNE SITUATION (SVG, repère 360 × 256 ; dessins entre y = 0 et 240,
     la marge du bas garde lisibles les noms des forces dirigées vers le bas)
     s = { dessin (SVG), points: { G: [x, y], A: […] }, nomsPts, titre, lf (longueur des flèches) }
     o = { forces: [{ pt, ang, nom, num, etat ('ok', 'ko', 'actif'), coul, cote, L }], points (cliquables), actif (point choisi) }
     L : longueur propre d'une flèche (sinon s.lf) : des forces qui se compensent ont
     des longueurs qui s'équilibrent (ex. <span class="vec-nom">F</span>archi = <span class="vec-nom">P</span> + <span class="vec-nom">T</span> en longueur).
     Chaque force a sa couleur (coul) ; l'état d'un tracé se lit sur sa pastille
     numérotée (verte si juste, rouge si faux) et une flèche fausse est en tirets.
     ============================================================ */
  const LF = 58, HS = 256;                        // longueur des flèches (sans souci d'échelle), hauteur du dessin
  function fleche(x, y, ang, cls, dec, lf, coul) {
    const r = ang * Math.PI / 180, c = Math.cos(r), s = -Math.sin(r), L = lf || LF;
    const x1 = x - s * dec, y1 = y + c * dec, x2 = x1 + L * c, y2 = y1 + L * s, bx = x2 - 11 * c, by = y2 - 11 * s;
    const f = v => v.toFixed(1);
    return { svg: `<g class="bf-f${cls ? ' ' + cls : ''}"${coul ? ` style="color:${coul}"` : ''}><line x1="${f(x1)}" y1="${f(y1)}" x2="${f(bx)}" y2="${f(by)}"/><path d="M${f(x2)},${f(y2)} L${f(bx - 5.5 * s)},${f(by + 5.5 * c)} L${f(bx + 5.5 * s)},${f(by - 5.5 * c)} Z"/></g>`, x2, y2, c, s };
  }
  // Deux flèches qui se superposeraient (sur la même droite, segments qui se recouvrent) :
  // on les écarte toutes les deux de 2 px perpendiculairement, chacune d'un côté, pour qu'on
  // voie les deux (le nom d'une flèche décalée s'écrit du côté de son décalage).
  // a, b : { x, y, c, s, L } (départ, direction unitaire, longueur) ; ea, eb : décalages
  function recouvre(a, ea, b, eb) {
    if (Math.abs(a.c * b.s - a.s * b.c) > .06) return false;              // pas parallèles
    const meme = a.c * b.c + a.s * b.s > 0;                               // même sens : les pointes se gênent
    const ax = a.x - a.s * ea, ay = a.y + a.c * ea, bx = b.x - b.s * eb, by = b.y + b.c * eb;
    if (Math.abs((bx - ax) * -a.s + (by - ay) * a.c) >= (meme ? 11 : 5)) return false;
    // recouvrement des deux segments, projetés sur la direction de a
    const t1 = (bx - ax) * a.c + (by - ay) * a.s, t2 = t1 + b.L * (b.c * a.c + b.s * a.s);
    return Math.min(a.L, Math.max(t1, t2)) - Math.max(0, Math.min(t1, t2)) > 3;
  }
  const ECART = 2;                                 // décalage de chaque flèche superposée (px)
  function decalages(geo) {
    const dec = geo.map(() => 0);
    // groupes de flèches qui se recouvrent (de proche en proche)
    const groupe = geo.map((_, i) => i);
    const chef = i => (groupe[i] === i ? i : (groupe[i] = chef(groupe[i])));
    geo.forEach((a, i) => {
      if (!a) return;
      for (let j = 0; j < i; j++) if (geo[j] && recouvre(geo[j], 0, a, 0)) groupe[chef(i)] = chef(j);
    });
    const groupes = {};
    geo.forEach((a, i) => { if (a) (groupes[chef(i)] = groupes[chef(i)] || []).push(i); });
    Object.keys(groupes).forEach(k => {
      const g = groupes[k];
      if (g.length < 2) return;
      // repère du groupe : la première flèche ; n = (−s, c), côté vers lequel une flèche est décalée
      const r = geo[g[0]], pos = i => (geo[i].x - r.x) * -r.s + (geo[i].y - r.y) * r.c;
      // les flèches déjà un peu écartées gardent leur ordre ; à égalité, la première du côté +
      g.slice().sort((i, j) => pos(j) - pos(i) || i - j).forEach((i, k) => {
        const e = ECART * (g.length - 1 - 2 * k);
        // une flèche de sens opposé à la première a sa normale inversée
        dec[i] = geo[i].c * r.c + geo[i].s * r.s > 0 ? e : -e;
      });
    });
    return dec;
  }
  function scene(s, o) {
    o = o || {};
    const fs = o.forces || [];
    const geo = fs.map(f => {
      if (!f || f.pt == null || f.ang == null) return null;
      const r = f.ang * Math.PI / 180, p = s.points[f.pt];
      return { x: p[0], y: p[1], c: Math.cos(r), s: -Math.sin(r), L: f.L || s.lf || LF };
    });
    const dec = decalages(geo);
    let g = s.dessin;
    fs.forEach((f, i) => {
      if (!geo[i]) return;
      const p = s.points[f.pt], a = fleche(p[0], p[1], f.ang, f.etat, dec[i], f.L || s.lf, f.coul);
      g += a.svg;
      // nom au-delà de la pointe, sur le côté ; une flèche décalée a son nom du côté du décalage
      // (f.cote = −1 : nom de l'autre côté, quand il gênerait un autre nom) ; une flèche
      // verticale décalée écarte son nom de toute sa demi-largeur, pour qu'il ne tombe pas
      // sur la flèche voisine, plus longue (F⃗archi et f⃗ de la goutte)
      const ecart = f.nom && dec[i] && Math.abs(a.s) > .7 ? Math.max(9, 5 + largeurNom(f.nom) / 2) : 9;
      const cote = (f.cote || (dec[i] < 0 ? -1 : 1)) * ecart;
      const lx = a.x2 + a.c * 15 - a.s * cote, ly = a.y2 + a.s * 15 + a.c * cote;
      if (f.nom) g += nomSVG(f.nom, lx, ly + 6, f.etat, f.coul);
      else if (f.num) g += `<g class="bf-num${f.etat ? ' ' + f.etat : ''}"${!f.etat && f.coul ? ` style="color:${f.coul}"` : ''}><circle cx="${lx.toFixed(1)}" cy="${ly.toFixed(1)}" r="8.5"/><text x="${lx.toFixed(1)}" y="${(ly + 4).toFixed(1)}" text-anchor="middle">${f.num}</text></g>`;
    });
    // dessins par-dessus les forces (réaction R⃗ = R⃗ₙ + f⃗ du support, en Terminale)
    if (o.dessus) g += o.dessus;
    Object.keys(s.points).forEach(id => {
      const [x, y] = s.points[id];
      if (!o.points && !(o.marques || []).includes(id)) return;
      g += `<circle cx="${x}" cy="${y}" r="4.5" class="bf-pt-m${o.actif === id ? ' actif' : ''}"/><text x="${x + 8}" y="${y - 7}" class="bf-pt-t">${id}</text>`;
      if (o.points) g += `<circle cx="${x}" cy="${y}" r="20" class="bf-poignee" data-pt="${id}"/>`;
    });
    return `<svg viewBox="0 0 360 ${HS}" class="bf-sc" role="img" aria-label="${o.aria || s.titre}">${g}</svg>`;
  }

  /* ============================================================
     DIAGRAMME OBJET-ACTION (SVG, repère 360 × 200)
     Le système au centre ; autour, chaque objet qui agit sur lui, relié
     par un trait en pointillés (action à distance) ou plein (action de
     contact) ; trait barré : force négligeable. Le nom des forces est
     écrit près du trait, dans la couleur de leur vecteur. Un objet donne
     une force ; quand on la décompose (<span class="vec-nom">R</span> = <span class="vec-nom">R</span>ₙ + <span class="vec-nom">f</span>), ses composantes sont
     reliées par « + ».
     BF.diagramme(sys, objets, o)
       objets : [{ nom, type ('distance' | 'contact' | null : pas encore choisi),
                   neglige, forces: [{ nom (clé de NOMS), coul }], note }]
       placement : le premier objet (la Terre) en haut à droite, les trois
       suivants en bas, les autres en haut à gauche
     BF.diagrammeDe(s, etat) : celui d'une situation ; etat (pendant le bilan) :
       { bulles() : [{ a (acteur, distracteur ou action à distance absente), type }] dessinées par l'élève,
         air: null (pas encore dit) | true | false, noms: [clé du nom choisi, par force] }
     ============================================================ */
  const HD = 200;
  const court = t => t.replace(/^(la |le |les |l'|l’)/i, '');
  const lgTexte = t => t.length * 7.5;                       // largeur d'un texte de 13 px, gras
  function diagramme(sys, objets, o) {
    o = o || {};
    const f1 = v => v.toFixed(1);
    const S = { x: 180, y: 100, rx: Math.min(112, lgTexte(sys) / 2 + 18), ry: 20 };
    const haut = [], bas = [];
    objets.forEach((ob, i) => { if (i === 0) haut.push(ob); else if (bas.length < 3) bas.push(ob); else haut.unshift(ob); });
    const XH = [[], [280], [80, 280]], XB = [[], [180], [92, 268], [62, 180, 298]];
    const pl = haut.map((ob, k) => ({ ob, x: XH[haut.length][k], y: 32, max: 150 }))
      .concat(bas.map((ob, k) => ({ ob, x: XB[bas.length][k], y: 170, max: bas.length === 3 ? 114 : 160 })));
    // point du bord d'une ellipse, dans la direction (dx, dy)
    const bord = (e, dx, dy) => { const l = Math.hypot(dx, dy), ux = dx / l, uy = dy / l, t = 1 / Math.hypot(ux / e.rx, uy / e.ry); return [e.x + t * ux, e.y + t * uy]; };
    // nom dans une bulle (resserré s'il est trop long)
    const texte = (e, t) => `<text x="${e.x}" y="${e.y + 4.5}" text-anchor="middle" class="bf-do-t"${lgTexte(t) > 2 * e.rx - 14 ? ` textLength="${(2 * e.rx - 16).toFixed(0)}" lengthAdjust="spacingAndGlyphs"` : ''}>${t}</text>`;
    let traits = '', bulles = `<ellipse cx="${S.x}" cy="${S.y}" rx="${f1(S.rx)}" ry="${S.ry}" class="bf-do-sys"/>${texte(S, sys)}`, noms = '';
    // étendue horizontale du dessin : le cadre est resserré autour (texte plus grand à l'écran)
    let xmin = S.x - S.rx, xmax = S.x + S.rx;
    const etendre = (a, b) => { xmin = Math.min(xmin, a); xmax = Math.max(xmax, b); };
    pl.forEach(p => {
      const ob = p.ob, e = { x: p.x, y: p.y, rx: Math.min(p.max / 2, lgTexte(ob.nom) / 2 + 13), ry: 16 };
      etendre(e.x - e.rx, e.x + e.rx);
      bulles += `<ellipse cx="${e.x}" cy="${e.y}" rx="${f1(e.rx)}" ry="${e.ry}" class="bf-do-obj"/>${texte(e, ob.nom)}`;
      const [x1, y1] = bord(S, e.x - S.x, e.y - S.y), [x2, y2] = bord(e, S.x - e.x, S.y - e.y);
      traits += `<line x1="${f1(x1)}" y1="${f1(y1)}" x2="${f1(x2)}" y2="${f1(y2)}" class="bf-do-l${ob.type === 'distance' ? ' dist' : ob.type === 'contact' ? '' : ' vide'}"/>`;
      // milieu du trait, direction du trait (ux, uy) et normale tournée vers l'extérieur (nx, ny)
      const mx = (x1 + x2) / 2, my = (y1 + y2) / 2, l = Math.hypot(x2 - x1, y2 - y1), ux = (x2 - x1) / l, uy = (y2 - y1) / l;
      let nx = -uy, ny = ux;
      // côté des noms : vers l'extérieur pour les objets du bas, au-dessus du trait pour ceux du haut
      if (e.y < S.y ? ny > 0 : (nx * (e.x - S.x) < 0 || (Math.abs(e.x - S.x) < 1 && nx < 0))) { nx = -nx; ny = -ny; }
      const ancre = nx > .3 ? 'start' : nx < -.3 ? 'end' : 'middle';
      if (ob.neglige) {
        // trait barré : un petit trait en travers (à 60° du trait), et le mot « négligeable »
        const vx = ux * .5 - uy * .866, vy = ux * .866 + uy * .5;
        traits += `<line x1="${f1(mx - 11 * vx)}" y1="${f1(my - 11 * vy)}" x2="${f1(mx + 11 * vx)}" y2="${f1(my + 11 * vy)}" class="bf-do-barre"/>`;
        const xn = mx + nx * 13;
        noms += `<text x="${f1(xn)}" y="${f1(my + ny * 13 + 4)}" text-anchor="${ancre}" class="bf-do-neg">négligeable</text>`;
        etendre(ancre === 'start' ? xn : ancre === 'end' ? xn - 70 : xn - 35, ancre === 'start' ? xn + 70 : ancre === 'end' ? xn : xn + 35);
      }
      // noms des forces, en ligne à côté du milieu du trait (un nom répété n'est écrit qu'une fois)
      // (la note, « (frottements) », suit les noms sur la même ligne)
      const fs = (ob.forces || []).filter((fo, k, l) => l.findIndex(x => x.nom === fo.nom) === k);
      if (!fs.length) return;
      const larg = fs.map(fo => largeurNom(fo.nom)), lnote = ob.note ? ob.note.length * 6.4 + 6 : 0, PLUS = 18;
      const tot = larg.reduce((a, b) => a + b, 0) + PLUS * (fs.length - 1) + lnote;
      let x = mx + nx * 12 - (ancre === 'end' ? tot : ancre === 'middle' ? tot / 2 : 0);
      etendre(x, x + tot);
      const yb = my + ny * 12 + (ny < -.3 ? 3 : ny > .3 ? 19 : 6);
      fs.forEach((fo, k) => {
        noms += nomSVG(fo.nom, x + larg[k] / 2, yb, '', fo.coul);
        x += larg[k];
        if (k < fs.length - 1) { noms += `<text x="${f1(x + PLUS / 2)}" y="${f1(yb)}" text-anchor="middle" class="bf-do-plus">+</text>`; x += PLUS; }
      });
      if (ob.note) noms += `<text x="${f1(x + 6)}" y="${f1(yb)}" class="bf-do-neg">${ob.note}</text>`;
    });
    const aria = o.aria || `Diagramme objet-action du système ${sys} : ` + objets.map(ob => `${ob.nom}, ${ob.type === 'distance' ? 'action à distance' : ob.type === 'contact' ? 'action de contact' : 'type à choisir'}${ob.neglige ? ', force négligeable' : ''}`).join(' ; ');
    // o.cadre = [x0, x1] : cadre imposé (diagrammes côte à côte, à la même échelle)
    // (un peu au-delà de 0 … 360 si une note dépasse : « (Archimède + frottements) »)
    const x0 = o.cadre ? o.cadre[0] : Math.max(-60, Math.floor(xmin - 8)), x1 = o.cadre ? o.cadre[1] : Math.min(420, Math.ceil(xmax + 8));
    return `<svg viewBox="${x0} 0 ${x1 - x0} ${HD}" class="bf-do" style="max-width:${Math.round(440 * (x1 - x0) / 360)}px" role="img" aria-label="${aria}">${traits}${bulles}${noms}</svg>`;
  }
  // type d'action d'un acteur (l'air agit toujours par contact, même quand sa force est négligée)
  const typeDe = (s, a) => a.type || (s.forces.find(f => f.acteur === a.id) || {}).type || 'contact';
  // les trois actions à distance possibles (la Terre toujours, plus rarement un aimant ou un objet électrisé)
  const DIST = [
    { id: 'terre', label: 'la Terre (le poids)', court: 'Terre', manque: 'La Terre attire <b>toujours</b> le système : n\'oublie pas le poids.' },
    { id: 'aimant', label: 'un aimant (force magnétique)', court: 'aimant', intrus: 'Aucun aimant n\'agit ici : pas de force magnétique.' },
    { id: 'charge', label: 'un objet électrisé (force électrique)', court: 'objet électrisé', intrus: 'Aucun objet électrisé (frotté) ici : pas de force électrique.' },
  ];
  // sorte d'une action à distance, d'après le nom de sa force
  function sorteDist(s, a) {
    const n = (s.forces.find(f => f.acteur === a.id) || { noms: [] }).noms;
    return n.indexOf('Fmag') !== -1 ? 'aimant' : n.indexOf('Felec') !== -1 ? 'charge' : 'terre';
  }
  function diagrammeDe(s, etat, o) {
    const cols = couleursForces(s.forces);
    // pendant le bilan : seulement les bulles déjà dessinées par l'élève
    const bulles = etat ? etat.bulles() : s.acteurs.map(a => ({ a, type: typeDe(s, a) }));
    const objets = bulles.map(({ a, type }) => {
      const forces = [];
      s.forces.forEach((f, i) => {
        if (f.acteur !== a.id) return;
        const k = etat ? etat.noms[i] : f.noms[0];
        if (k) forces.push({ nom: k, coul: cols[i] });
      });
      const neglige = a.id === 'air' && !!s.air && s.air.neglige && (!etat || etat.air != null);
      return { nom: a.court || court(a.nom), type, neglige, forces,
        // note après les noms : « (frottements) » pour l'air ; a.note d'un acteur (huile : « (Archimède + frottements) »),
        // une fois ses deux forces nommées
        note: a.id === 'air' && forces.length && s.air && s.air.cause === 'frottements' ? '(frottements)' : a.note && forces.length > 1 ? a.note : '' };
    });
    return diagramme(s.sysCourt || court(s.systeme), objets, o);
  }
  // diagrammes de plusieurs situations affichées côte à côte : même cadre, donc même échelle
  function diagrammesDe(liste) {
    const cadres = liste.map(s => diagrammeDe(s).match(/viewBox="([\d.]+) 0 ([\d.]+)/)).map(m => [+m[1], +m[1] + +m[2]]);
    const cadre = [Math.min(...cadres.map(c => c[0])), Math.max(...cadres.map(c => c[1]))];
    return liste.map(s => diagrammeDe(s, null, { cadre }));
  }

  /* ============================================================
     BILAN DES FORCES : une situation, étape par étape
     BF.bilan(s, opts) → { enonce, parties } : question pour BF.question ou COURS
     Méthode du diagramme objet-action : on dessine d'abord le diagramme, bulle par bulle,
     puis les forces sur le schéma.
       1. les actions à distance : parmi les trois possibles (la Terre, toujours ; un aimant ;
          un objet électrisé), lesquelles ? (trait en pointillés)
       2. une bulle pour chaque objet qui touche le système, l'air compris (distracteurs) ;
          chacun donne une force (trait plein)
       3. l'air touche le système : peut-on négliger sa force ? (si l'air est un acteur ; trait barré)
       4. tracé sur le schéma : point de départ (centre G ou point de contact), direction et sens
          (8 directions, + directions propres : perpendiculaire au support, le long du fil…)
       5. nom de chaque vecteur (écrit aussi sur le diagramme)
       6. les forces se compensent-elles ? (si s.comp)
     opts.jusqua : 'diagramme' (étapes 1 à 3), 'trace' (1 à 4), 'noms' (1 à 5) ; sinon tout.
     Toutes les parties partagent l'état de la situation (plusieurs exemplaires
     possibles) ; le diagramme se dessine au fil des choix et suit l'élève : il
     s'affiche dans la dernière étape commencée (celui d'une étape finie est masqué
     quand la suivante apparaît).
     Format d'une situation : voir modules/situations.js.
     ============================================================ */
  const MANQUE = 'Il manque un objet : cherche <b>chaque objet qui touche</b> le système (l\'air aussi).';
  // diagramme objet-action d'une étape : il remplace celui des étapes déjà finies
  function figDo(zone, st) {
    const fig = el('div', 'bf-do-cadre');
    zone.appendChild(fig);
    st.figs.forEach(f => { if (f.dataset.fini) f.hidden = true; });
    st.figs.push(fig);
    return fig;
  }
  // boutons à cocher (actions à distance, objets qui touchent) : ids sélectionnés, dans l'ordre des appuis
  function boutonsActs(zone, liste, choisis, api, quand) {
    const d = el('div', 'bf-acts');
    d.innerHTML = liste.map(a => `<button type="button" class="bf-act" data-id="${a.id}" aria-pressed="false">${cap(a.label || a.nom)}</button>`).join('');
    zone.appendChild(d);
    d.querySelectorAll('.bf-act').forEach(b => {
      b.onclick = () => {
        if (b.disabled || api.fini()) return;
        const oui = b.getAttribute('aria-pressed') !== 'true', k = choisis.indexOf(b.dataset.id);
        b.setAttribute('aria-pressed', oui ? 'true' : 'false');
        if (oui && k === -1) choisis.push(b.dataset.id);
        if (!oui && k !== -1) choisis.splice(k, 1);
        b.classList.remove('ko');
        api.effacer();
        quand();
      };
    });
    // réponse connue : les bons boutons en vert, tout est figé
    d.figer = bons => d.querySelectorAll('.bf-act').forEach(b => {
      const bon = bons.indexOf(b.dataset.id) !== -1;
      b.disabled = true; b.classList.remove('ko'); b.classList.toggle('ok', bon); b.setAttribute('aria-pressed', bon ? 'true' : 'false');
    });
    return d;
  }
  // 1. les actions à distance : il n'y en a que trois possibles
  function partieDistance(s, st, distants) {
    const presentes = distants.map(a => sorteDist(s, a));
    return { type: 'perso', q: `Dessine le <b>diagramme objet-action</b>. D'abord les actions <b>à distance</b> : il n'y en a que trois possibles. Lesquelles s'exercent sur ${s.systeme} ? Sélectionne-les, puis valide.`,
      solution: `<p>${distants.map(a => `${cap(a.nom)} : ${a.pourquoi}`).join(' ; ')}. Dans le diagramme : trait en <b>pointillés</b>.</p>`,
      monter(zone, api) {
        const fig = figDo(zone, st);
        const d = boutonsActs(zone, DIST, st.dist, api, st.maj);
        const bVal = boutonValider(zone);
        function figer() {
          st.distOk = true; fig.dataset.fini = '1';
          d.figer(presentes); bVal.fermer(); st.maj();
        }
        bVal.onclick = () => {
          if (st.distOk || api.fini()) return;
          if (!st.dist.length) { secouer(d); api.message('Touche les actions à distance qui s\'exercent sur le système, puis valide.'); return; }
          const intrus = st.dist.filter(k => presentes.indexOf(k) === -1), manque = presentes.filter(k => st.dist.indexOf(k) === -1);
          if (!intrus.length && !manque.length) { figer(); api.reussi(); return; }
          intrus.forEach(k => d.querySelector(`[data-id="${k}"]`).classList.add('ko'));
          api.erreur('<br>' + intrus.map(k => '☛ ' + DIST.find(x => x.id === k).intrus)
            .concat(manque.map(k => '☛ ' + (distants.find(a => sorteDist(s, a) === k).manque || DIST.find(x => x.id === k).manque))).join('<br>'));
          secouer(d);
        };
        st.maj();
        return { montrer: figer };
      } };
  }
  // 2. une bulle pour chaque objet qui touche le système : chacun donne une force
  function partieContact(s, st, contacts) {
    return { type: 'perso', q: `Puis les actions <b>de contact</b> : une bulle pour <b>chaque objet qui touche</b> ${s.systeme}. Chacun donne une force. Sélectionne-les, puis valide.`,
      solution: `<p>${contacts.length ? contacts.map(a => `${cap(a.nom)} : ${a.pourquoi}`).join(' ; ') + '. Dans le diagramme : trait <b>plein</b>.' : 'Aucun objet ne touche le système.'}</p>`,
      monter(zone, api) {
        const fig = figDo(zone, st);
        const cands = melanger(contacts.concat(s.distracteurs || []));
        const d = boutonsActs(zone, cands, st.contacts, api, st.maj);
        const bVal = boutonValider(zone);
        function figer() {
          st.contactOk = true; fig.dataset.fini = '1';
          d.figer(contacts.map(a => a.id)); bVal.fermer(); st.maj();
        }
        bVal.onclick = () => {
          if (st.contactOk || api.fini()) return;
          if (!st.contacts.length && contacts.length) { secouer(d); api.message('Touche les objets qui touchent le système, puis valide.'); return; }
          const intrus = (s.distracteurs || []).filter(x => st.contacts.indexOf(x.id) !== -1), manque = contacts.filter(a => st.contacts.indexOf(a.id) === -1);
          if (!intrus.length && !manque.length) { figer(); api.reussi(); return; }
          intrus.forEach(x => d.querySelector(`[data-id="${x.id}"]`).classList.add('ko'));
          api.erreur('<br>' + intrus.map(x => '☛ ' + x.diag).concat(manque.length ? ['☛ ' + (manque[0].manque || MANQUE)] : []).join('<br>'));
          secouer(d);
        };
        st.maj();
        return { montrer: figer };
      } };
  }
  // L'air touche le système : peut-on négliger sa force ?
  // s.air = { neglige, cause ('frottements' | 'archi', si elle n'est pas négligeable), raison, indice }
  const REGLE_AIR = 'On néglige la force de l\'air, sauf si ses <b>frottements</b> ne sont pas négligeables (grande vitesse, grande surface : parachute…) ou si sa <b>poussée d\'Archimède</b> ne l\'est pas (objet très léger pour son volume : montgolfière, ballon d\'hélium).';
  const OPTS_AIR = [{ id: 'oui', label: 'oui : on la néglige' }, { id: 'frottements', label: 'non : les frottements de l\'air ne sont pas négligeables' },
    { id: 'archi', label: 'non : la poussée d\'Archimède de l\'air n\'est pas négligeable' }];
  const bonneAir = a => (a.neglige ? 'oui' : a.cause);
  function partieAir(s, st) {
    const bonne = bonneAir(s.air);
    return { type: 'perso', q: 'L\'air touche le système : peut-on <b>négliger</b> sa force ? (Si oui, son trait est barré.)', solution: `<p>${s.air.raison}</p>`,
      monter(zone, api) {
        const fig = figDo(zone, st);
        const box = el('div', 'ph-choix ph-choix-col');
        zone.appendChild(box);
        let fige = false;
        const bs = OPTS_AIR.map(x => {
          const b = el('button', 'btn-secondary', x.label);
          b.type = 'button';
          box.appendChild(b);
          b.onclick = () => {
            if (fige || api.fini() || b.disabled) return;
            if (x.id === bonne) { figer(); api.reussi(); return; }
            b.classList.add('faux'); b.disabled = true;
            api.erreur(s.air.indice || REGLE_AIR);
          };
          return { b, x };
        });
        // réponse connue : les diagrammes affichés barrent le trait de l'air si sa force est négligeable
        function figer() {
          fige = true; fig.dataset.fini = '1';
          bs.forEach(({ b, x }) => { b.disabled = true; if (x.id === bonne) b.classList.add('juste'); });
          st.air = s.air.neglige;
          st.maj();
        }
        st.maj();
        return { montrer: figer };
      } };
  }
  // diagnostics du tracé
  function diagPt(f) {
    return f.type === 'distance' ? 'une force à distance part du <b>centre</b> du système, le point G.' : (f.diagPt || `une force de contact part du <b>point de contact</b> (${f.pts.join(' ou ')}).`);
  }
  function diagDir(f, ang) {
    return (ecartAngle(f.angs[0], ang) > 176 ? 'la direction est bonne, mais le <b>sens</b> est inversé. ' : '') + f.diagDir;
  }
  function partieTrace(s, st) {
    const lieu = p => (p === 'G' ? 'le centre G' : 'le point ' + p);
    const cols = couleursForces(s.forces);
    return { type: 'perso', q: `Dessine maintenant sur le schéma les forces du diagramme : pour chacune, choisis son <b>point de départ</b>, puis sa <b>direction</b> et son <b>sens</b> (sans souci d'échelle).${s.air && s.air.neglige ? ' La force de l\'air est négligée : on ne la dessine pas.' : ''}`,
      solution: `<p>${s.forces.map((f, i) => `${i + 1}. ${cap(f.lib)} : depuis ${lieu(f.pts[0])}${f.pts.length > 1 ? ` (ou ${f.pts.slice(1).map(lieu).join(', ')})` : ''}, ${texteDir(s, f.angs[0])}`).join(' ;<br>')}.</p>`,
      monter(zone, api) {
        const pos = st.pos;
        let sel = 0, fige = false, drag = null;
        const doFig = figDo(zone, st);
        const d = el('div', 'bf-tr');
        d.innerHTML = `<div class="vec-chips bf-tr-chips" role="group" aria-label="Force à tracer">${s.forces.map((f, i) => `<button type="button" class="vec-chip" data-i="${i}"><span class="bf-tr-pastille" style="background:${cols[i]}" aria-hidden="true"></span>${i + 1}. ${cap(f.lib)}</button>`).join('')}</div>
          <div class="bf-sc-cadre bf-tr-fig"></div>
          <p class="bf-tr-etape" aria-live="polite"></p>
          <div class="bf-tr-pts" role="group" aria-label="Point de départ">${Object.keys(s.points).map(id => `<button type="button" class="bf-pt" data-pt="${id}" aria-pressed="false"><b>${id}</b> ${s.nomsPts[id]}</button>`).join('')}</div>
          <div class="bf-tr-dirs"><div class="bf-pad" role="group" aria-label="Direction et sens">${DIRS8.map(x => (x ? `<button type="button" data-a="${x[0]}" aria-label="${DIR_TXT[x[0]]}" title="${DIR_TXT[x[0]]}">${x[1]}</button>` : '<span aria-hidden="true"></span>')).join('')}</div>
          ${(s.speciales || []).length ? `<div class="bf-spec">${s.speciales.map(x => `<button type="button" data-a="${x.ang}">${x.label}</button>`).join('')}</div>` : ''}</div>`;
        zone.appendChild(d);
        const figZ = d.querySelector('.bf-tr-fig'), etape = d.querySelector('.bf-tr-etape');
        const bVal = boutonValider(zone);
        const verrou = i => fige || pos[i].ok;
        function dessiner() {
          figZ.innerHTML = scene(s, { forces: pos.map((p, i) => ({ pt: p.pt, ang: p.ang, num: i + 1, coul: cols[i], cote: s.forces[i].cote, L: s.forces[i].L, etat: p.etat || (i === sel && !fige ? 'actif' : '') })),
            points: !fige, actif: pos[sel] && pos[sel].pt, aria: `${s.titre} : forces tracées` });
          d.querySelectorAll('.bf-tr-chips .vec-chip').forEach(c => {
            const i = +c.dataset.i, p = pos[i];
            c.classList.toggle('actif', i === sel && !fige); c.classList.toggle('place', p.pt != null && p.ang != null);
            c.classList.toggle('ok', p.etat === 'ok'); c.classList.toggle('ko', p.etat === 'ko'); c.setAttribute('aria-pressed', i === sel ? 'true' : 'false');
          });
          d.querySelectorAll('.bf-pt').forEach(b => { b.setAttribute('aria-pressed', pos[sel].pt === b.dataset.pt ? 'true' : 'false'); b.disabled = verrou(sel); });
          d.querySelectorAll('.bf-tr-dirs button').forEach(b => { b.disabled = verrou(sel); b.classList.toggle('choisi', pos[sel].ang != null && ecartAngle(+b.dataset.a, pos[sel].ang) < 1); });
          etape.innerHTML = fige ? '' : pos[sel].ok ? `La force ${sel + 1} est juste. Choisis une autre force au-dessus du dessin.`
            : pos[sel].pt == null ? `<b>Force ${sel + 1}</b> : touche son point de départ, sur le dessin ou ci-dessous.`
            : `<b>Force ${sel + 1}</b> : choisis sa direction et son sens avec les flèches (ou fais glisser depuis le point).`;
        }
        const suivante = () => { const k = pos.findIndex((p, i) => i > sel && (p.pt == null || p.ang == null)); if (k >= 0) sel = k; };
        d.querySelectorAll('.bf-tr-chips .vec-chip').forEach(c => { c.onclick = () => { if (fige) return; sel = +c.dataset.i; dessiner(); }; });
        function poserPoint(id) {
          if (verrou(sel) || api.fini()) return;
          pos[sel].pt = id; pos[sel].etat = '';
          api.effacer(); dessiner();
        }
        d.querySelectorAll('.bf-pt').forEach(b => { b.onclick = () => poserPoint(b.dataset.pt); });
        d.querySelectorAll('.bf-tr-dirs button').forEach(b => {
          b.onclick = () => {
            if (verrou(sel) || api.fini()) return;
            if (pos[sel].pt == null) { etape.innerHTML = `Choisis d'abord le <b>point de départ</b> de la force ${sel + 1}.`; secouer(d.querySelector('.bf-tr-pts')); return; }
            pos[sel].ang = +b.dataset.a; pos[sel].etat = '';
            api.effacer(); suivante(); dessiner();
          };
        });
        // glisser depuis un point : la pointe suit le doigt (ou la souris), aimantée sur les directions proposées
        const angles = DIRS8.filter(Boolean).map(x => x[0]).concat((s.speciales || []).map(x => x.ang));
        const coord = e => { const r = figZ.querySelector('svg').getBoundingClientRect(); return [(e.clientX - r.left) * 360 / r.width, (e.clientY - r.top) * HS / r.height]; };
        figZ.addEventListener('touchstart', e => { if (e.target.closest && e.target.closest('.bf-poignee')) e.preventDefault(); }, { passive: false });
        figZ.addEventListener('pointerdown', e => {
          const h = e.target.closest && e.target.closest('.bf-poignee');
          if (!h || drag || verrou(sel) || api.fini()) return;
          e.preventDefault();
          poserPoint(h.dataset.pt);
          drag = { id: e.pointerId, bouge: false };
          try { figZ.setPointerCapture(e.pointerId); } catch (_) { /* rien */ }
        });
        figZ.addEventListener('pointermove', e => {
          if (!drag || e.pointerId !== drag.id) return;
          const [x, y] = coord(e), [px, py] = s.points[pos[sel].pt];
          if (Math.hypot(x - px, y - py) < 16) return;
          const brut = Math.atan2(py - y, x - px) * 180 / Math.PI;
          const a = angles.reduce((m, v) => (ecartAngle(v, brut) < ecartAngle(m, brut) ? v : m), angles[0]);
          if (pos[sel].ang == null || ecartAngle(pos[sel].ang, a) > .5) { pos[sel].ang = a; pos[sel].etat = ''; drag.bouge = true; api.effacer(); dessiner(); }
        });
        const finDrag = e => {
          if (!drag || e.pointerId !== drag.id) return;
          const bouge = drag.bouge;
          drag = null;
          if (bouge) { suivante(); dessiner(); }
        };
        ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(t => figZ.addEventListener(t, finDrag));
        dessiner();
        bVal.onclick = () => {
          if (fige || api.fini()) return;
          const manque = pos.findIndex(p => p.pt == null || p.ang == null);
          if (manque >= 0) { sel = manque; dessiner(); secouer(figZ); api.message(`Trace d'abord la force ${manque + 1} : ${s.forces[manque].lib}.`); return; }
          const msgs = [];
          s.forces.forEach((f, i) => {
            const p = pos[i];
            if (p.ok) return;
            const okPt = f.pts.indexOf(p.pt) !== -1, okAng = f.angs.some(a => ecartAngle(a, p.ang) < 3);
            if (okPt && okAng) { p.ok = true; p.etat = 'ok'; return; }
            p.etat = 'ko';
            msgs.push(`☛ <b>Force ${i + 1}</b> (${f.lib}) : ${!okPt ? diagPt(f) : diagDir(f, p.ang)}`);
          });
          if (!msgs.length) { fige = true; doFig.dataset.fini = '1'; dessiner(); bVal.fermer(); st.maj(); api.reussi(); return; }
          sel = pos.findIndex(p => !p.ok);
          dessiner();
          api.erreur('<br>' + msgs.join('<br>'));
          secouer(figZ);
        };
        st.maj();
        return { montrer() { s.forces.forEach((f, i) => Object.assign(pos[i], { pt: f.pts[0], ang: f.angs[0], ok: true, etat: 'ok' })); fige = true; doFig.dataset.fini = '1'; dessiner(); bVal.fermer(); st.maj(); } };
      } };
  }
  function partieNoms(s, st) {
    const cands = s.nomsProposes, cols = couleursForces(s.forces);
    return { type: 'perso', q: 'Donne le <b>nom</b> de chaque vecteur force (il s\'écrit aussi sur le diagramme objet-action).',
      solution: `<p>${s.forces.map((f, i) => `${i + 1}. ${cap(f.lib)} : ${nomV(f.noms[0])}`).join(' ; ')}.</p>`,
      monter(zone, api) {
        const d = el('div', 'bf-noms');
        d.innerHTML = `<div class="bf-noms-figs"><div class="bf-do-cadre bf-noms-do"></div><div class="bf-sc-cadre bf-noms-fig"></div></div>` + s.forces.map((f, i) => `<div class="bf-nom-l" data-i="${i}"><span class="bf-nom-lib"><span class="bf-tr-pastille" style="background:${cols[i]}" aria-hidden="true"></span>${i + 1}. ${cap(f.lib)}</span>
          <span class="bf-nom-ch" role="group" aria-label="Nom de la force ${i + 1}">${cands.map(k => `<button type="button" data-k="${k}" aria-pressed="false">${nomV(k)}</button>`).join('')}</span></div>`).join('');
        zone.appendChild(d);
        const doZ = d.querySelector('.bf-noms-do'), figZ = d.querySelector('.bf-noms-fig');
        st.figs.forEach(f => { if (f.dataset.fini) f.hidden = true; });
        st.figs.push(doZ);
        const bVal = boutonValider(zone);
        let fige = false;
        // le diagramme et le dessin montrent les noms choisis, dans la couleur de chaque force
        const dessiner = () => {
          doZ.innerHTML = diagrammeDe(s, st);
          figZ.innerHTML = scene(s, { forces: s.forces.map((f, i) => ({ pt: st.pos[i].pt || f.pts[0], ang: st.pos[i].ang == null ? f.angs[0] : st.pos[i].ang, num: i + 1, nom: st.noms[i], coul: cols[i], cote: f.cote, L: f.L })),
            marques: Object.keys(s.points), aria: `${s.titre} : forces à nommer` });
        };
        st.ecoute.push(dessiner);
        d.querySelectorAll('.bf-nom-ch button').forEach(b => {
          b.onclick = () => {
            if (fige || api.fini()) return;
            b.parentElement.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x === b ? 'true' : 'false'));
            const r = b.closest('.bf-nom-l');
            r.classList.remove('ko');
            st.noms[+r.dataset.i] = b.dataset.k;
            api.effacer();
            st.maj();
          };
        });
        function figer() {
          fige = true;
          d.querySelectorAll('.bf-nom-l').forEach(r => {
            const i = +r.dataset.i, f = s.forces[i];
            st.noms[i] = f.noms[0];
            r.classList.remove('ko'); r.classList.add('ok');
            r.querySelectorAll('button').forEach(b => { b.disabled = true; b.setAttribute('aria-pressed', b.dataset.k === f.noms[0] ? 'true' : 'false'); });
          });
          bVal.fermer(); st.maj();
        }
        bVal.onclick = () => {
          if (fige || api.fini()) return;
          const rangs = Array.from(d.querySelectorAll('.bf-nom-l'));
          if (rangs.some(r => !r.querySelector('[aria-pressed="true"]'))) { secouer(d); api.message('Choisis un nom pour chaque force.'); return; }
          const faux = rangs.filter(r => s.forces[+r.dataset.i].noms.indexOf(r.querySelector('[aria-pressed="true"]').dataset.k) === -1);
          if (!faux.length) {
            // les noms choisis restent affichés (<span class="vec-nom">R</span> accepté pour <span class="vec-nom">R</span>ₙ sans frottement…)
            fige = true;
            rangs.forEach(r => { r.classList.add('ok'); r.querySelectorAll('button').forEach(b => { b.disabled = true; }); });
            bVal.fermer(); st.maj(); api.reussi(); return;
          }
          faux.forEach(r => r.classList.add('ko'));
          api.erreur('<br>' + faux.map(r => {
            const f = s.forces[+r.dataset.i], k = r.querySelector('[aria-pressed="true"]').dataset.k;
            return `☛ <b>Force ${+r.dataset.i + 1}</b> : ${SENS_NOM[k]} ${f.indNom || ''}`;
          }).join('<br>'));
          secouer(d);
        };
        dessiner();
        return { montrer: figer };
      } };
  }
  function partieComp(s) {
    const autre = s.comp.bonne === 'oui' ? 'non' : 'oui';
    return { type: 'choix', q: s.comp.q || 'Ces forces se compensent-elles ?', melanger: false, colonne: true,
      options: [{ id: 'oui', label: 'oui : leur somme est nulle' }, { id: 'non', label: 'non : leur somme n\'est pas nulle' }], bonne: s.comp.bonne,
      indices: { [autre]: s.comp.indice }, solution: `<p>${s.comp.expl}</p>` };
  }
  function bilan(s, opts) {
    opts = opts || {};
    const distants = s.acteurs.filter(a => typeDe(s, a) === 'distance'), contacts = s.acteurs.filter(a => typeDe(s, a) !== 'distance');
    const objets = contacts.concat(s.distracteurs || []);
    // état partagé : actions à distance et objets choisis, réponse sur l'air, tracés et noms ; diagrammes à redessiner
    const st = { dist: [], contacts: [], distOk: false, contactOk: false, air: null, pos: s.forces.map(() => ({ pt: null, ang: null, etat: '', ok: false })),
      noms: s.forces.map(() => null), figs: [], ecoute: [] };
    // bulles dessinées : les actions à distance (une sorte choisie sans acteur : bulle de l'élève), puis les objets qui touchent
    st.bulles = () => (st.distOk ? distants : DIST.filter(k => st.dist.indexOf(k.id) !== -1).map(k => distants.find(a => sorteDist(s, a) === k.id) || { id: '_' + k.id, nom: k.court }))
      .map(a => ({ a, type: 'distance' }))
      .concat((st.contactOk ? contacts : st.contacts.map(id => objets.find(x => x.id === id))).map(a => ({ a, type: 'contact' })));
    st.maj = () => { st.figs.forEach(f => { f.innerHTML = diagrammeDe(s, st); }); st.ecoute.forEach(f => f()); };
    const jusqua = opts.jusqua || 'tout';
    const parties = [partieDistance(s, st, distants)];
    if (objets.length) parties.push(partieContact(s, st, contacts));
    if (s.air) parties.push(partieAir(s, st));
    if (jusqua !== 'diagramme') parties.push(partieTrace(s, st));
    if (jusqua === 'noms' || jusqua === 'tout') parties.push(partieNoms(s, st));
    if (jusqua === 'tout' && s.comp) parties.push(partieComp(s));
    parties.forEach((p, k) => { p.q = `${k + 1}. ${p.q}`; });
    return { enonce: `${s.enonce ? `<p>${s.enonce}</p>` : ''}${s.dessin ? `<div class="bf-sc-cadre">${scene(s, { aria: s.titre })}</div>` : ''}`, parties };
  }
  // scène avec toutes ses forces tracées et nommées (exemples, fiches, corrections)
  // o.reaction : la réaction R⃗ = R⃗ₙ + f⃗ de chaque support est dessinée en plus (Terminale)
  const sceneRemplie = (s, o) => {
    const cols = couleursForces(s.forces);
    o = Object.assign({}, o);
    if (o.reaction) o.dessus = (o.dessus || '') + reactionsSVG(s);
    return scene(s, Object.assign({ forces: s.forces.map((f, i) => ({ pt: f.pts[0], ang: f.angs[0], nom: f.noms[0], coul: cols[i], cote: f.cote, L: f.L })), marques: Object.keys(s.points), aria: `${s.titre} : bilan des forces` }, o));
  };

  /* ============================================================
     RÉACTION DU SUPPORT DÉCOMPOSÉE : R⃗ = R⃗ₙ + f⃗ (Terminale)
     BF.reactions(s) : pour chaque objet qui exerce à la fois une réaction normale (R⃗ₙ)
       et un frottement (f⃗ ou force motrice F⃗ₘ) au même point : { acteur, pt, iN, iF, ang, L }
       (ang, L : direction et longueur de la somme des deux flèches).
     BF.reactionsSVG(s, liste) : R⃗ dessinée depuis le point de contact, en noir, avec les
       pointillés du parallélogramme (sans souci d'échelle, mais cohérent).
     ============================================================ */
  const vecF = (s, f) => { const L = f.L || s.lf || LF, r = f.angs[0] * Math.PI / 180; return [L * Math.cos(r), L * Math.sin(r)]; };
  function reactions(s) {
    const res = [];
    s.forces.forEach((f, iN) => {
      if (['RN', 'R'].indexOf(f.noms[0]) === -1 || f.type !== 'contact') return;
      const iF = s.forces.findIndex(g => g !== f && g.acteur === f.acteur && g.pts[0] === f.pts[0] && ['f', 'Fm'].indexOf(g.noms[0]) !== -1);
      if (iF < 0) return;
      const a = vecF(s, f), b = vecF(s, s.forces[iF]), x = a[0] + b[0], y = a[1] + b[1];
      res.push({ acteur: f.acteur, pt: f.pts[0], iN, iF, ang: Math.atan2(y, x) * 180 / Math.PI, L: Math.hypot(x, y) });
    });
    return res;
  }
  function reactionsSVG(s, liste) {
    const f1 = v => v.toFixed(1);
    return (liste || reactions(s)).map(r => {
      const p = s.points[r.pt], a = vecF(s, s.forces[r.iN]), b = vecF(s, s.forces[r.iF]);
      const xa = p[0] + a[0], ya = p[1] - a[1], xb = p[0] + b[0], yb = p[1] - b[1], xr = p[0] + a[0] + b[0], yr = p[1] - a[1] - b[1];
      const fl = fleche(p[0], p[1], r.ang, 'bf-f-r', 0, r.L, '#16181d');
      const rad = r.ang * Math.PI / 180;
      return `<path d="M${f1(xa)},${f1(ya)} L${f1(xr)},${f1(yr)} L${f1(xb)},${f1(yb)}" class="bf-r-constr"/>${fl.svg}` +
        nomSVG('R', fl.x2 + Math.cos(rad) * 12 + 9, fl.y2 - Math.sin(rad) * 12 + 2, '', '#16181d');
    }).join('');
  }

  /* ============================================================
     INFOGRAPHIE « forces à distance, forces de contact »
     BF.infoForces() → HTML : deux colonnes (une seule sur téléphone),
     dans l'ordre de la méthode : d'abord les forces à distance (trois
     possibles, flèche depuis le centre, pointillés dans le diagramme
     objet-action), puis les forces de contact (chaque objet qui touche,
     l'air compris ; flèche depuis le point de contact, trait plein).
     ============================================================ */
  function infoForces() {
    // petit dessin : un bloc posé sur un support, une force depuis le centre G ou depuis le point de contact A
    const bloc = dist => `<svg viewBox="0 0 150 104" class="bf-info-sc" role="img" aria-label="${dist ? 'Force à distance : la flèche part du centre G' : 'Force de contact : la flèche part du point de contact A'}">
        <line x1="12" y1="66" x2="138" y2="66" class="bf-sc-sol"/>${[24, 40, 56, 72, 88, 104, 120, 136].map(x => `<line x1="${x}" y1="67" x2="${x - 7}" y2="74" class="bf-sc-hach"/>`).join('')}
        <rect x="48" y="36" width="54" height="30" class="bf-sc-sys"/>
        ${dist ? fleche(75, 51, 270, '', 0, 46, COUL.P).svg + '<circle cx="75" cy="51" r="3.5" class="bf-pt-m"/><text x="81" y="47" class="bf-pt-t">G</text>'
    : fleche(75, 66, 90, '', 0, 52, COUL.RN).svg + '<circle cx="75" cy="66" r="3.5" class="bf-pt-m"/><text x="81" y="82" class="bf-pt-t">A</text>'}</svg>`;
    // petit diagramme objet-action : un objet relié au système
    const mini = (obj, dist) => `<svg viewBox="0 0 170 38" class="bf-info-do" role="img" aria-label="Diagramme objet-action : ${obj} relié au système par un trait ${dist ? 'en pointillés' : 'plein'}">
        <line x1="58" y1="19" x2="104" y2="19" class="bf-do-l${dist ? ' dist' : ''}"/>
        <ellipse cx="32" cy="19" rx="28" ry="14" class="bf-do-obj"/><text x="32" y="23" text-anchor="middle" class="bf-do-t">${obj}</text>
        <ellipse cx="134" cy="19" rx="32" ry="15" class="bf-do-sys"/><text x="134" y="23" text-anchor="middle" class="bf-do-t">système</text></svg>`;
    // icônes des trois forces à distance
    const ic = {
      terre: '<svg viewBox="0 0 32 32" class="bf-info-ic" aria-hidden="true"><circle cx="16" cy="16" r="12" class="bf-sc-sys"/><ellipse cx="16" cy="16" rx="5.5" ry="12" class="bf-info-trait"/><line x1="4" y1="16" x2="28" y2="16" class="bf-info-trait"/></svg>',
      aimant: '<svg viewBox="0 0 32 32" class="bf-info-ic" aria-hidden="true"><rect x="2" y="10" width="28" height="12" class="bf-sc-obj"/><line x1="16" y1="10" x2="16" y2="22" class="bf-info-trait"/><text x="9" y="20" text-anchor="middle" class="bf-info-ict">N</text><text x="23" y="20" text-anchor="middle" class="bf-info-ict">S</text></svg>',
      charges: '<svg viewBox="0 0 32 32" class="bf-info-ic" aria-hidden="true"><circle cx="9" cy="16" r="7" class="bf-sc-obj"/><circle cx="23" cy="16" r="7" class="bf-sc-obj"/><text x="9" y="20.5" text-anchor="middle" class="bf-info-ict">+</text><text x="23" y="20" text-anchor="middle" class="bf-info-ict">−</text></svg>',
    };
    return `<div class="bf-info">
      <section class="bf-info-c" aria-label="D'abord les forces à distance">
        <p class="bf-info-t"><span class="bf-info-n">1</span><span>D'abord : les forces <b>à distance</b></span></p>
        <p class="bf-info-s">Il n'y en a que <b>trois</b> possibles :</p>
        <ul class="bf-info-l">
          <li>${ic.terre}<span><b>le poids</b> ${nomV('P')}<small>exercé par la Terre (toujours)</small></span></li>
          <li>${ic.aimant}<span><b>la force magnétique</b> ${nomV('Fmag')}<small>s'il y a des aimants</small></span></li>
          <li>${ic.charges}<span><b>la force électrique</b> ${nomV('Felec')}<small>s'il y a des charges + ou −</small></span></li></ul>
        <div class="bf-info-fig">${bloc(true)}<p>La flèche part du <b>centre</b> G du système.</p></div>
        <div class="bf-info-fig">${mini('Terre', true)}<p>Diagramme objet-action : trait en <b>pointillés</b>.</p></div>
      </section>
      <section class="bf-info-c" aria-label="Puis les forces de contact">
        <p class="bf-info-t"><span class="bf-info-n">2</span><span>Puis : les forces <b>de contact</b></span></p>
        <p class="bf-info-s"><b>Chaque objet qui touche</b> le système exerce une force :</p>
        <ul class="bf-info-chips"><li>le support (sol, table…)</li><li>un fil, une corde, un ressort</li><li>une main, un pied</li><li>un liquide (eau, huile…)</li><li><b>l'air</b>, toujours</li></ul>
        <div class="bf-info-fig">${bloc(false)}<p>La flèche part du <b>point de contact</b> A.</p></div>
        <div class="bf-info-fig">${mini('sol', false)}<p>Diagramme objet-action : trait <b>plein</b>.</p></div>
      </section>
    </div>`;
  }

  /* ============================================================
     RÉSULTANTE ET ACCÉLÉRATION DANS UN QUADRILLAGE
     (repère et tracé de vecteurs de cinematique/modules/vecteurs.js, objet VEC)
     BF.partieResultante(o) : les forces sont dessinées depuis G ; l'élève
       trace Σ <span class="vec-nom">F</span> depuis G (1 carreau = o.echelle N), pointe glissable + flèches.
     BF.partieAcc(o) : Σ <span class="vec-nom">F</span> est dessinée ; l'élève trace <span class="vec-nom">a</span> depuis G, même
       direction et même sens (sans souci d'échelle : toute longueur convient).
     o = { forces: [{ nom: 'F_1', coord: [0, 2] }], somme: [x, y] (facultatif), etendue, echelle, q, solution }
     ============================================================ */
  const somme = fs => fs.reduce((s, f) => [s[0] + f.coord[0], s[1] + f.coord[1]], [0, 0]);
  function repere(zone, o, aTracer) {
    const E = o.etendue || 5;
    return new window.VEC.Repere(zone, { xmin: -E, xmax: E, ymin: -E, ymax: E, axes: false, unitaires: false, mode: 'mixte',
      points: [{ nom: 'G', x: 0, y: 0, dx: -10, dy: 16 }], aria: o.aria || 'Quadrillage : forces appliquées au point G',
      // une couleur par force (Σ F⃗, déjà tracée, en noir)
      vecteurs: o.forces.map((f, i) => ({ nom: f.nom, dep: [0, 0], coord: f.coord, fixe: true, coul: f.nom === 'ΣF' ? window.VEC.C.encre : COUL_QUAD[i % COUL_QUAD.length], nomPos: f.nomPos })).concat([aTracer]) });
  }
  function partieResultante(o) {
    const S = o.somme || somme(o.forces), ech = o.echelle || 1;
    return { type: 'perso', q: o.q || 'Trace la résultante Σ <span class="vec-nom">F</span> depuis le point G (glisse la pointe, ou utilise les flèches), puis valide.', solution: o.solution,
      monter(zone, api) {
        const rep = repere(zone, o, { nom: 'ΣF', dep: [0, 0], coord: S, valeur: { k: ech, unite: 'N', dec: 1 } });
        const bVal = boutonValider(zone);
        bVal.onclick = () => {
          if (api.fini()) return;
          const v = rep.vs[rep.vs.length - 1];
          if (!v.fin) { api.message('Trace d\'abord la résultante depuis G.'); return; }
          const r = rep.verifier()[0];
          if (r.code === 'ok') { bVal.fermer(); api.reussi(); return; }
          const d = [v.fin[0], v.fin[1]];
          const partielle = o.forces.length > 1 && o.forces.some((f, i) => { const sans = somme(o.forces.filter((_, k) => k !== i)); return sans[0] === d[0] && sans[1] === d[1]; });
          api.erreur(d[0] === -S[0] && d[1] === -S[1] ? 'Le sens est inversé.'
            : partielle ? 'Il manque une force : additionne <b>toutes</b> les forces.'
            : 'Mets les flèches bout à bout : la résultante va de G à l\'extrémité de la dernière flèche. Deux forces opposées se soustraient ; deux forces perpendiculaires donnent la diagonale du rectangle.');
        };
        return { montrer() { rep.montrer(); bVal.fermer(); } };
      } };
  }
  // o.nomVec : nom du vecteur à tracer ('a' par défaut ; 'Δv' : variation du vecteur vitesse, en 1re)
  function partieAcc(o) {
    const S = o.somme || somme(o.forces), nv = o.nomVec || 'a', NV = `<span class="vec-nom">${nv}</span>`;
    return { type: 'perso', q: o.q || 'Trace le vecteur accélération <span class="vec-nom">a</span> depuis G (sans souci d\'échelle), puis valide.', solution: o.solution,
      monter(zone, api) {
        const fs = o.forces.concat([{ nom: 'ΣF', coord: S }]);
        const rep = repere(zone, Object.assign({}, o, { forces: fs }), { nom: nv, dep: [0, 0], coord: S });
        const bVal = boutonValider(zone);
        bVal.onclick = () => {
          if (api.fini()) return;
          const v = rep.vs[rep.vs.length - 1];
          if (!v.fin) { api.message(`Trace d'abord ${NV} depuis G.`); return; }
          const d = v.fin, croix = d[0] * S[1] - d[1] * S[0], scal = d[0] * S[0] + d[1] * S[1];
          if (croix === 0 && scal > 0) { v.etat = 'ok'; v.bloque = true; rep.verrou = true; rep.dessiner(); bVal.fermer(); api.reussi(); return; }
          v.etat = 'ko'; rep.dessiner();
          api.erreur(croix === 0 ? `La direction est bonne, mais le <b>sens</b> est inversé : ${NV} a le même sens que Σ <span class="vec-nom">F</span>.` : `${NV} a la <b>même direction</b> et le <b>même sens</b> que Σ <span class="vec-nom">F</span> (sa longueur n'a pas d'importance ici).`);
        };
        return { montrer() { rep.montrer(); bVal.fermer(); } };
      } };
  }


  /* ============================================================
     VÉRIFICATIONS DU BILAN, ÉTAPE PAR ÉTAPE (atelier sur un écran)
     Mêmes règles et mêmes diagnostics que BF.bilan (parties de question) :
     BF.verif.distants(s), BF.verif.contacts(s), BF.verif.objets(s) (objets proposés)
     BF.verif.distance(s, ids)  → { ok, intrus: [ids], manque: [ids], msg }
     BF.verif.contact(s, ids)   → { ok, intrus, manque, msg }
     BF.verif.air(s, id)        → { ok, bonne, msg }
     BF.verif.force(s, i, p)    → { ok, msg } (p = { pt, ang })
     BF.verif.nom(s, i, k)      → { ok, msg }
     ============================================================ */
  const verif = {
    distants: s => s.acteurs.filter(a => typeDe(s, a) === 'distance'),
    contacts: s => s.acteurs.filter(a => typeDe(s, a) !== 'distance'),
    objets: s => verif.contacts(s).concat(s.distracteurs || []),
    distance(s, ids) {
      const distants = verif.distants(s), presentes = distants.map(a => sorteDist(s, a));
      const intrus = ids.filter(k => presentes.indexOf(k) === -1), manque = presentes.filter(k => ids.indexOf(k) === -1);
      const msg = intrus.map(k => '☛ ' + DIST.find(x => x.id === k).intrus)
        .concat(manque.map(k => '☛ ' + (distants.find(a => sorteDist(s, a) === k).manque || DIST.find(x => x.id === k).manque))).join('<br>');
      return { ok: !intrus.length && !manque.length, intrus, manque, presentes, msg };
    },
    contact(s, ids) {
      const contacts = verif.contacts(s);
      const intrus = (s.distracteurs || []).filter(x => ids.indexOf(x.id) !== -1), manque = contacts.filter(a => ids.indexOf(a.id) === -1);
      const msg = intrus.map(x => '☛ ' + x.diag).concat(manque.length ? ['☛ ' + (manque[0].manque || MANQUE)] : []).join('<br>');
      return { ok: !intrus.length && !manque.length, intrus: intrus.map(x => x.id), manque: manque.map(a => a.id), bons: contacts.map(a => a.id), msg };
    },
    air(s, id) {
      const bonne = bonneAir(s.air);
      return { ok: id === bonne, bonne, msg: s.air.indice || REGLE_AIR };
    },
    force(s, i, p) {
      const f = s.forces[i], okPt = f.pts.indexOf(p.pt) !== -1, okAng = p.ang != null && f.angs.some(a => ecartAngle(a, p.ang) < 3);
      return { ok: okPt && okAng, msg: !okPt ? diagPt(f) : diagDir(f, p.ang) };
    },
    nom(s, i, k) {
      const f = s.forces[i];
      return { ok: f.noms.indexOf(k) !== -1, msg: `${SENS_NOM[k]} ${f.indNom || ''}` };
    },
  };

  /* ============================================================
     CENTRE DE MASSE (Terminale) : solides dessinés en SVG (repère 360 × 220)
     BF.SOLIDES : { id: { titre, homogene, dessin, pts: { G: [x, y], A: … }, diags: { A: diagnostic }, raison } }
       pts.G : le centre de masse ; les autres points : réponses fausses fréquentes
     BF.solide(id, o) : SVG du solide (o.points : points à choisir ; o.G : G marqué ; o.etats { id: 'ok' | 'ko' })
     BF.partieCentre({ solide, q }) : partie 'perso' : toucher le point où se trouve G
     ============================================================ */
  const SOL_H = 220;
  const SOLIDES = {
    plaque: { titre: 'Plaque rectangulaire homogène', homogene: true,
      dessin: '<rect x="84" y="56" width="192" height="108" class="bf-cm-h"/><path d="M84,56 L276,164 M276,56 L84,164" class="bf-cm-aide"/>',
      pts: { G: [180, 110], A: [180, 56], B: [132, 83], C: [240, 140] },
      raison: 'Solide homogène : G est au <b>centre de symétrie</b>, à l\'intersection des diagonales.' },
    disque: { titre: 'Disque homogène', homogene: true,
      dessin: '<circle cx="180" cy="110" r="72" class="bf-cm-h"/>',
      pts: { G: [180, 110], A: [180, 182], B: [214, 76], C: [180, 38] },
      raison: 'Solide homogène : G est au <b>centre de symétrie</b>, le centre du disque.' },
    triangle: { titre: 'Plaque triangulaire homogène (triangle équilatéral)', homogene: true,
      dessin: '<polygon points="180,26 84,192 276,192" class="bf-cm-h"/><path d="M180,26 L180,192 M84,192 L228,109 M276,192 L132,109" class="bf-cm-aide"/>',
      pts: { G: [180, 136.7], A: [180, 109], B: [180, 192], C: [132, 109] },
      diags: { A: 'Ce point est au milieu de la hauteur : G est plus bas, plus près de la base (là où il y a le plus de matière).' },
      raison: 'Solide homogène : G est sur chaque <b>axe de symétrie</b> du triangle, donc à leur intersection.' },
    anneau: { titre: 'Anneau homogène', homogene: true,
      dessin: '<circle cx="180" cy="110" r="76" class="bf-cm-h"/><circle cx="180" cy="110" r="50" class="bf-cm-trou"/>',
      pts: { G: [180, 110], A: [180, 47], B: [243, 110], C: [180, 173] },
      diags: { A: 'G est au centre de symétrie de l\'anneau, même s\'il n\'y a pas de matière à cet endroit.', B: 'G est au centre de symétrie de l\'anneau, même s\'il n\'y a pas de matière à cet endroit.', C: 'G est au centre de symétrie de l\'anneau, même s\'il n\'y a pas de matière à cet endroit.' },
      raison: 'Solide homogène : G est au <b>centre de symétrie</b>. Ici, il n\'y a pas de matière en G : le centre de masse peut être hors du solide.' },
    marteau: { titre: 'Marteau (tête en acier, manche en bois)', homogene: false,
      dessin: '<rect x="40" y="102" width="232" height="16" rx="3" class="bf-cm-leger"/><rect x="262" y="70" width="44" height="80" rx="4" class="bf-cm-lourd"/>' +
        '<text x="120" y="96" class="bf-cm-t">manche en bois</text><text x="284" y="166" text-anchor="middle" class="bf-cm-t">tête en acier</text>',
      pts: { G: [246, 110], A: [173, 110], B: [284, 110], C: [70, 110] },
      diags: { A: 'Ce point est au milieu de la longueur : ce serait G si le marteau était homogène. La tête en acier est bien plus lourde que le manche : G est plus près de la tête.',
        B: 'Le manche a aussi une masse : il « tire » G un peu vers lui. G est près de la tête, mais pas en son centre.',
        C: 'G est plus près de la partie la plus <b>lourde</b>, pas de la plus légère.' },
      raison: 'Solide non homogène : G est plus près de la partie la plus <b>lourde</b>, la tête en acier.' },
    haltere: { titre: 'Haltère à disques inégaux', homogene: false,
      dessin: '<rect x="60" y="104" width="240" height="12" rx="3" class="bf-cm-leger"/><rect x="66" y="50" width="34" height="120" rx="6" class="bf-cm-lourd"/><rect x="262" y="80" width="24" height="60" rx="5" class="bf-cm-lourd"/>' +
        '<text x="83" y="190" text-anchor="middle" class="bf-cm-t">disque de 10 kg</text><text x="274" y="160" text-anchor="middle" class="bf-cm-t">disque de 2 kg</text>',
      pts: { G: [120, 110], A: [180, 110], B: [242, 110], C: [83, 110] },
      diags: { A: 'Ce point est au milieu de la barre : ce serait G si les deux disques avaient la même masse. Le disque de gauche est plus lourd : G est plus près de lui.',
        B: 'G est plus près de la partie la plus <b>lourde</b>, le disque de 10 kg.',
        C: 'Le disque de 2 kg et la barre ont aussi une masse : ils « tirent » G un peu vers la droite. G n\'est pas au centre du gros disque.' },
      raison: 'Solide non homogène : G est plus près de la partie la plus <b>lourde</b>, le disque de 10 kg.' },
    bouteille: { titre: 'Bouteille fermée, à moitié remplie d\'eau', homogene: false,
      dessin: '<path d="M150,206 L150,92 Q150,74 166,64 L170,40 L190,40 L194,64 Q210,74 210,92 L210,206 Z" class="bf-cm-leger"/><path d="M151,146 L209,146 L209,205 L151,205 Z" class="bf-cm-lourd"/>' +
        '<rect x="168" y="30" width="24" height="10" class="bf-cm-lourd"/><text x="220" y="180" class="bf-cm-t">eau</text><text x="220" y="110" class="bf-cm-t">air</text>',
      pts: { G: [180, 168], A: [180, 123], B: [180, 82], C: [180, 205] },
      diags: { A: 'Ce point est au milieu de la bouteille : ce serait G si elle était homogène. L\'eau, bien plus lourde que l\'air, est en bas : G est plus bas.',
        B: 'L\'air du haut de la bouteille est très léger : G est en bas, du côté de l\'eau.',
        C: 'Le plastique de toute la bouteille a une masse : G est près du centre de l\'eau, pas tout au fond.' },
      raison: 'Solide non homogène : G est plus près de la partie la plus <b>lourde</b>, l\'eau, en bas de la bouteille.' },
  };
  const DIAG_H = 'Le solide est homogène : G est au <b>centre de symétrie</b> (ou à l\'intersection de ses axes de symétrie).';
  function solide(id, o) {
    o = o || {};
    const S = SOLIDES[id], etats = o.etats || {};
    let g = S.dessin;
    if (o.G) g += `<circle cx="${S.pts.G[0]}" cy="${S.pts.G[1]}" r="4.5" class="bf-pt-m actif"/><text x="${S.pts.G[0] + 8}" y="${S.pts.G[1] - 7}" class="bf-pt-t">G</text>`;
    if (o.points) {
      Object.keys(S.pts).sort().forEach(k => {
        const [x, y] = S.pts[k], lab = o.lettres[k];
        g += `<g class="bf-cm-pt${etats[k] ? ' ' + etats[k] : ''}" data-pt="${k}" role="button" tabindex="0" aria-label="Point ${lab}">` +
          `<circle cx="${x}" cy="${y}" r="22" class="bf-poignee"/><circle cx="${x}" cy="${y}" r="5.5" class="bf-cm-rond"/><text x="${x + 9}" y="${y - 8}" class="bf-pt-t">${lab}</text></g>`;
      });
    }
    return `<svg viewBox="0 0 360 ${SOL_H}" class="bf-sc bf-cm" role="img" aria-label="${o.aria || S.titre}">${g}</svg>`;
  }
  // toucher le point où se trouve G (les lettres sont mélangées : G n'est jamais nommé)
  function partieCentre(o) {
    const S = SOLIDES[o.solide];
    return { type: 'perso', q: o.q || `${S.titre} : touche le point où se trouve son <b>centre de masse</b> G.`, solution: `<p>${S.raison}</p>`,
      monter(zone, api) {
        const ids = Object.keys(S.pts), lettres = {};
        melanger(['1', '2', '3', '4']).forEach((l, k) => { lettres[ids[k]] = l; });
        const etats = {};
        let fige = false;
        const d = el('div', 'bf-sc-cadre bf-cm-cadre');
        const bs = el('div', 'bf-acts bf-cm-bs');
        zone.appendChild(d); zone.appendChild(bs);
        bs.innerHTML = ids.slice().sort((a, b) => lettres[a] - lettres[b]).map(k => `<button type="button" class="bf-act" data-pt="${k}">Point ${lettres[k]}</button>`).join('');
        const dessiner = () => {
          d.innerHTML = solide(o.solide, { points: true, lettres, etats, aria: `${S.titre} : quatre points proposés` });
          bs.querySelectorAll('[data-pt]').forEach(b => { b.classList.toggle('ok', etats[b.dataset.pt] === 'ok'); b.classList.toggle('ko', etats[b.dataset.pt] === 'ko'); b.disabled = fige || etats[b.dataset.pt] === 'ko'; });
        };
        function choisir(k) {
          if (fige || api.fini() || etats[k] === 'ko') return;
          if (k === 'G') { etats.G = 'ok'; fige = true; dessiner(); api.reussi(); return; }
          etats[k] = 'ko'; dessiner();
          api.erreur((S.diags && S.diags[k]) || (S.homogene ? DIAG_H : S.raison));
        }
        d.addEventListener('click', e => { const p = e.target.closest && e.target.closest('[data-pt]'); if (p) choisir(p.dataset.pt); });
        d.addEventListener('keydown', e => { const p = e.target.closest && e.target.closest('[data-pt]'); if (p && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); choisir(p.dataset.pt); } });
        bs.addEventListener('click', e => { const b = e.target.closest('[data-pt]'); if (b) choisir(b.dataset.pt); });
        dessiner();
        return { montrer() { etats.G = 'ok'; fige = true; dessiner(); } };
      } };
  }

  /* ============================================================
     FLÈCHE D'UNE FORCE SUR UN QUADRILLAGE (module 1 : valeur et échelle)
     BF.flecheEchelle({ L, ang, k, x, y, cols, rows, pt, coul }) → SVG
       L : longueur en carreaux ; ang : 0, 90, 180 ou 270 ; k : clé du nom (NOMS, 'F' par défaut) ;
       x, y : point d'application (en carreaux depuis le coin en haut à gauche) ; pt : nom du point
     ============================================================ */
  function flecheEchelle(o) {
    const C = 26, cols = o.cols || 10, rows = o.rows || 6, W = cols * C, H = rows * C;
    let g = '';
    for (let i = 0; i <= cols; i++) g += `<line x1="${i * C}" y1="0" x2="${i * C}" y2="${H}" class="bf-ech-grille"/>`;
    for (let j = 0; j <= rows; j++) g += `<line x1="0" y1="${j * C}" x2="${W}" y2="${j * C}" class="bf-ech-grille"/>`;
    const x0 = o.x * C, y0 = o.y * C, fl = fleche(x0, y0, o.ang, '', 0, o.L * C, o.coul || COUL.T), r = o.ang * Math.PI / 180;
    g += fl.svg + `<circle cx="${x0}" cy="${y0}" r="4" class="bf-pt-m"/>`;
    if (o.pt) g += `<text x="${x0 - 8}" y="${y0 + 16}" text-anchor="end" class="bf-pt-t">${o.pt}</text>`;
    g += nomSVG(o.k || 'F', fl.x2 + Math.cos(r) * 14 + (Math.abs(Math.sin(r)) > .5 ? 16 : 0), fl.y2 - Math.sin(r) * 14 + 6, '', o.coul || COUL.T);
    return `<svg viewBox="-4 -4 ${W + 8} ${H + 8}" class="bf-ech" role="img" aria-label="${o.aria || 'Flèche d\'une force sur un quadrillage'}">${g}</svg>`;
  }

  /* ============================================================
     MOUVEMENT DU CENTRE DE MASSE : un marteau lancé (chronophotographie, SVG 360 × 200)
     BF.marteauLance() → SVG : le marteau tourne sur lui-même, son centre de masse G décrit
     une parabole (pointillés) ; le bout du manche décrit une courbe compliquée.
     ============================================================ */
  function marteauLance() {
    const f1 = v => v.toFixed(1), N = 7;
    // G : parabole ; le marteau fait un tour et demi pendant le vol
    const pos = Array.from({ length: N }, (_, k) => { const t = k / (N - 1); return [40 + 280 * t, 182 - 560 * t * (1 - t) - 10 * t, -40 + 540 * t]; });
    const rot = (x, y, a) => { const r = a * Math.PI / 180; return [x * Math.cos(r) - y * Math.sin(r), x * Math.sin(r) + y * Math.cos(r)]; };
    let g = '', bout = [];
    const parabole = Array.from({ length: 41 }, (_, k) => { const t = k / 40; return `${f1(40 + 280 * t)},${f1(182 - 560 * t * (1 - t) - 10 * t)}`; }).join(' ');
    // trajectoire du bout du manche (échantillonnée finement)
    for (let k = 0; k <= 60; k++) { const t = k / 60, x = 40 + 280 * t, y = 182 - 560 * t * (1 - t) - 10 * t, [dx, dy] = rot(-32, 0, -40 + 540 * t); bout.push(`${f1(x + dx)},${f1(y + dy)}`); }
    g += `<polyline points="${bout.join(' ')}" class="bf-cm-bout"/><polyline points="${parabole}" class="bf-cm-traj"/>`;
    pos.forEach(([x, y, a]) => {
      const P = (u, v) => { const [dx, dy] = rot(u, v, a); return `${f1(x + dx)},${f1(y + dy)}`; };
      g += `<polygon points="${P(-32, -2)} ${P(8, -2)} ${P(8, 2)} ${P(-32, 2)}" class="bf-cm-leger"/><polygon points="${P(6, -8)} ${P(16, -8)} ${P(16, 8)} ${P(6, 8)}" class="bf-cm-lourd"/>` +
        `<circle cx="${f1(x)}" cy="${f1(y)}" r="3" class="bf-pt-m actif"/>`;
    });
    g += `<text x="${f1(pos[3][0] + 8)}" y="${f1(pos[3][1] - 12)}" class="bf-pt-t">G</text><text x="330" y="186" text-anchor="end" class="bf-cm-t">trajectoire de G : une parabole</text>`;
    return `<svg viewBox="0 0 360 200" class="bf-sc bf-cm" role="img" aria-label="Marteau lancé : il tourne sur lui-même, mais son centre de masse G décrit une parabole">${g}</svg>`;
  }

  /* ============================================================
     PLAN DE L'APPLICATION ET NAVIGATION (voir assets/sommaire.js)
     Le niveau de chaque page est écrit à la fin de son nom (« · 2de », « · 1re »,
     « · Tle », « · 1re et Tle », « · 2de à Tle ») : dans le sommaire et sur l'accueil, il devient
     une pastille (BF.pastilles) ; rien n'est verrouillé.
     ============================================================ */
  const PLAN = [
    { n: 1, titre: 'Modéliser une action par une force', desc: 'Système, action mécanique, vecteur force et ses quatre caractéristiques, forces à distance et de contact', fiche: 'fiche_1',
      sousModules: true,
      parties: [
        { nom: 'Système et vecteur force', slug: 'force', cours: 'module_1a_cours', noms: { cours: 'Cours : système et vecteur force · 2de' } },
        { nom: 'Forces à distance, forces de contact', slug: 'distance', cours: 'module_1b_cours', noms: { cours: 'Cours : forces à distance, forces de contact · 2de' } },
        { nom: 'Modéliser une action par une force', questions: 'module_1_questions', noms: { questions: 'Questions · 2de' } }] },
    { n: 2, titre: 'Le diagramme objets-actions', desc: 'La méthode à suivre partout : actions à distance, objets en contact, force de l\'air, exemple du ballon de foot', fiche: 'fiche_2',
      parties: [{ nom: 'Le diagramme objets-actions', cours: 'module_2_cours', questions: 'module_2_questions', noms: { cours: 'Cours : méthode du diagramme objet-action · 2de à Tle', questions: 'Questions · 2de à Tle' } }] },
    { n: 3, titre: 'Les forces usuelles', desc: 'Poids, réaction du support sans frottements, frottements solides, tension d\'un fil, force de l\'air, poussée d\'Archimède', fiche: 'fiche_3',
      sousModules: true,
      parties: [
        { nom: 'Poids', slug: 'poids', cours: 'module_3a_cours', noms: { cours: 'Cours : poids · 2de' } },
        { nom: 'Réaction du support sans frottements', slug: 'reaction', cours: 'module_3b_cours', noms: { cours: 'Cours : réaction du support sans frottements · 2de' } },
        { nom: 'Frottements solides', slug: 'frottements', cours: 'module_3f_cours', noms: { cours: 'Cours : frottements solides · 1re et Tle' } },
        { nom: 'Tension d\'un fil', slug: 'tension', cours: 'module_3c_cours', noms: { cours: 'Cours : tension d\'un fil · 2de' } },
        { nom: 'Force de l\'air', slug: 'air', cours: 'module_3e_cours', noms: { cours: 'Cours : force de l\'air · 2de' } },
        { nom: 'Poussée d\'Archimède', slug: 'archimede', cours: 'module_3d_cours', noms: { cours: 'Cours : poussée d\'Archimède · Tle' } },
        { nom: 'Les forces usuelles', questions: 'module_3_questions', noms: { questions: 'Questions · 2de à Tle' } }] },
    { n: 4, titre: 'Centre de masse', desc: 'Système et milieu extérieur, centre de masse d\'un solide homogène ou non, mouvement du centre de masse', fiche: 'fiche_4',
      parties: [{ nom: 'Centre de masse', cours: 'module_4_cours', questions: 'module_4_questions', noms: { cours: 'Cours : centre de masse · 2de', questions: 'Questions · 2de' } }] },
    { n: 5, titre: 'Forces qui se compensent', desc: 'Forces qui se compensent, principe d\'inertie', fiche: 'fiche_5',
      sousModules: true,
      parties: [
        { nom: 'Forces qui se compensent', slug: 'compensation', cours: 'module_5a_cours', noms: { cours: 'Cours : forces qui se compensent · 2de' } },
        { nom: 'Principe d\'inertie', slug: 'inertie', cours: 'module_5b_cours', noms: { cours: 'Cours : principe d\'inertie · 2de' } },
        { nom: 'Forces qui se compensent', questions: 'module_5_questions', noms: { questions: 'Questions · 2de à Tle' } }] },
    { n: 6, titre: 'Atelier : bilan des forces', desc: 'Toutes les situations, de la 2de à la Terminale, dans n\'importe quel ordre, puis une série de synthèse',
      parties: [{ nom: 'Bilan des forces', simulation: 'module_6_simulation', questions: 'module_6_questions', noms: { simulation: 'Atelier : bilan des forces · 2de à Tle', questions: 'Questions de synthèse · 2de à Tle' } }] },
  ];
  // une autre application qui reprend ce moteur (forces-vitesse/) déclare son propre plan avant de charger ce fichier
  if (!window.BF_AUTRE_PLAN) window.SOM.init({ nom: 'Bilan des forces', id: 'bilan-forces', plan: PLAN });

  // niveau écrit à la fin d'un nom (« Cours : poids · 2de ») → pastille, dans le sommaire et sur l'accueil
  const RE_NIV = /\s·\s(2de à Tle|1re et Tle|2de|1re|Tle)\s*$/;
  function pastilles(racine) {
    if (!racine) return;
    const it = document.createTreeWalker(racine, NodeFilter.SHOW_TEXT), liste = [];
    while (it.nextNode()) if (RE_NIV.test(it.currentNode.data)) liste.push(it.currentNode);
    liste.forEach(t => {
      const m = t.data.match(RE_NIV);
      const sp = document.createElement('span');
      sp.className = 'bf-niv';
      sp.textContent = m[1];
      t.data = t.data.slice(0, m.index);
      t.parentNode.insertBefore(sp, t.nextSibling);
    });
  }
  // le sommaire et l'accueil se redessinent (dépliage, retour sur la page) : on suit leurs changements
  function suivre(racine) {
    if (!racine) return;
    pastilles(racine);
    new MutationObserver(() => pastilles(racine)).observe(racine, { childList: true, subtree: true, characterData: true });
  }
  const menu = cle => { window.SOM.menu(cle); suivre(document.getElementById('app-nav')); };
  const accueil = zone => { window.SOM.accueil(zone); suivre(zone); };
  const marquer = info => window.SOM.marquer(info);

  window.BF = Object.assign(window.BF || {}, {
    MOINS, fmt, cs, sci, lire, proche, fr, unite, o, fq, el, secouer, melanger, hasard, entre, champ, PARTIES, boutonValider,
    question, serie, confettis, fig, monter, outil, cap, V, NOMS, nomV, nomSVG, SENS_NOM, DIRS8, DIR_TXT, texteDir, ecartAngle, LF, HS, scene, sceneRemplie,
    reactions, reactionsSVG, bilan, verif, diagPt, diagDir,
    COUL, COUL_LIBRES, couleurs, couleursForces, court, diagramme, diagrammeDe, diagrammesDe, typeDe, DIST, sorteDist, MANQUE, REGLE_AIR, OPTS_AIR, bonneAir, infoForces,
    somme, partieResultante, partieAcc, SOLIDES, solide, partieCentre, flecheEchelle, marteauLance, PLAN, menu, accueil, marquer, pastilles,
  });
})();
