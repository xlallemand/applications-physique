/* ============================================================
   Moteur de l'application « Chapitre 19 : Ondes électromagnétiques »
   (Terminale STI2D ; même moteur de questions que « Cinématique » et
   « Chapitre 17 : Spectre d'un signal périodique » ; navigation
   commune assets/sommaire.js, cours avec assets/cours.js ;
   modulation AM / FM : modules/modulation.js, objet MOD)

   OEM.fmt, OEM.cs, OEM.sci, OEM.lire   écriture et lecture des nombres (virgule)
   OEM.o, OEM.fq.choix, OEM.fq.nombre   fabriques d'options et de parties de question
   OEM.PARTIES                          parties de question : 'choix' (bonne : un id ou une liste),
                                        'nombre' (aussi : autres réponses justes), 'gabarit', 'sci',
                                        'grille' (un choix par ligne), 'perso' (p.monter(zone, api) → { montrer() })
   OEM.versCours(p)                     une de ces parties dans un cours (assets/cours.js)
   OEM.question(zone, q, cb, mode)      question en plusieurs parties (série, exercice, activité)
   OEM.serie(opts)                      série de questions notée sur 20
   OEM.fig(dessin), OEM.outil(monter)   figure dessinée à la largeur disponible, outil placé dans du HTML
   OEM.C, OEM.txtF(f), OEM.txtL(λ)      célérité ; f et λ écrites avec le préfixe le plus simple
   OEM.diagLambda, OEM.diagFreq         diagnostics des calculs λ = c / f et f = c / λ (préfixe non converti,
                                        λ = f / c, 10³ et 10⁶ confondus)
   OEM.DOMAINES, OEM.domaine(λ)         domaines des ondes électromagnétiques (γ, X, UV, visible, IR,
                                        micro-ondes, radio) ; OEM.partieDomaine(λ, texte) : question « dans quel domaine ? »
   OEM.svgEM(o), OEM.monterEchelle      échelle logarithmique des ondes (λ en haut, f en bas) et repère
                                        à déplacer (glisser, toucher, curseur ; saisie de f ou de λ)
   OEM.partieEchelle(o)                 partie 'perso' : placer une onde sur l'échelle
   OEM.BANDES, OEM.bande(f)             bandes radio EHF … BF (bornes « 3 × 10ⁿ »)
   OEM.svgBandes(o), OEM.figBandes(o)   échelle des bandes (de 300 GHz à 30 kHz, comme le manuel)
   OEM.USAGES, OEM.partieEtiquettes(o)  partie 'perso' : étiquettes (FM, 4G, Wi-Fi, RFID…) à placer
                                        dans les bandes (glisser, ou toucher l'étiquette puis la bande)
   OEM.svgLambda, svgAntenne, svgCarteRFID, svgTalkie   figures du cours et des exercices
   OEM.menu(cle), OEM.accueil(zone)     navigation commune (SOM) avec le plan de l'application

   Les styles des cartes, boutons et écrans de fin viennent de
   equilibrer-reactions/modules/er.css (même présentation).
   ============================================================ */
(function () {
  'use strict';

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
     api.reussi(silencieux, note, sansDefiler) · api.erreur(indice) · api.effacer() · api.message(h) · api.fini()
     (sansDefiler : la partie suivante apparaît sans que la page défile jusqu'à elle)
     ============================================================ */

  // Choix parmi des boutons : p.options [{ id, label }], p.bonne (un id ou une liste d'ids), p.notes[id],
  // p.indice ou p.indices[id], p.colonne
  function pChoix(zone, p, api) {
    const box = el('div', 'ph-choix' + (p.colonne ? ' ph-choix-col' : ''));
    zone.appendChild(box);
    const opts = p.melanger === false ? p.options : melanger(p.options);
    const bonnes = [].concat(p.bonne);          // plusieurs réponses justes possibles
    const bs = opts.map(o => {
      const b = el('button', 'btn-secondary', o.label);
      b.type = 'button';
      b.dataset.id = o.id;
      box.appendChild(b);
      b.onclick = () => {
        if (api.fini() || b.disabled) return;
        if (bonnes.includes(o.id)) {
          b.classList.add('juste');
          bs.forEach(x => { x.b.disabled = true; });
          api.reussi(false, p.notes && p.notes[o.id]);
        } else {
          b.classList.add('faux'); b.disabled = true;
          api.erreur((p.indices && p.indices[o.id]) || p.indice || '');
        }
      };
      return { b, o };
    });
    return { montrer() { bs.forEach(({ b, o }) => { b.disabled = true; if (bonnes.includes(o.id)) b.classList.add('juste'); }); } };
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

  // Valeur numérique : p.label, p.valeur, p.tol (écart absolu) ou p.rel (écart relatif), p.unite, p.diag(v), p.indice,
  // p.aussi [{ valeur, note }] : autres réponses justes
  function pNombre(zone, p, api) {
    const d = el('div', 'ph-valeur');
    if (p.label) d.appendChild(el('span', 'ph-lab', p.label));
    const ch = champ({ signe: p.signe });
    d.appendChild(ch.el);
    if (p.unite) d.appendChild(el('span', 'ph-unite', p.unite));
    zone.appendChild(d);
    const bVal = boutonValider(zone);
    ch.input.addEventListener('input', () => api.effacer());
    ch.input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); valider(); } });
    function valider() {
      if (api.fini()) return;
      const v = lire(ch.input.value);
      if (isNaN(v)) { secouer(d); api.message('Écris un nombre (avec une virgule si besoin).'); return; }
      if (juste(v, p)) { ch.desactiver(true); bVal.fermer(); api.reussi(); return; }
      // autre réponse juste (lecture d'un graphique, autre méthode), avec sa remarque
      const autre = (p.aussi || []).find(a => juste(v, Object.assign({}, p, { valeur: a.valeur })));
      if (autre) { ch.desactiver(true); bVal.fermer(); api.reussi(false, autre.note); return; }
      api.erreur((p.diag && p.diag(v)) || p.indice || 'Vérifie ton calcul.');
      secouer(d);
    }
    bVal.onclick = valider;
    return { montrer() { ch.input.value = affichage(p); ch.desactiver(true); bVal.fermer(); } };
  }

  // Expression à trous : p.label, p.morceaux = [texte HTML | { v, tol, rel, aria }], p.diag(valeurs)
  function pGabarit(zone, p, api) {
    const d = el('div', 'ph-valeur oem-gab');
    if (p.label) d.appendChild(el('span', 'ph-lab', p.label));
    // chaque case forme un groupe insécable avec le texte qui la suit (et le texte d'ouverture
    // avec la première case) : sur un petit écran, la ligne ne se coupe qu'entre deux groupes
    const champs = [];
    let grp = el('span', 'oem-gab-grp');
    d.appendChild(grp);
    p.morceaux.forEach(m => {
      if (typeof m === 'string') { grp.appendChild(el('span', 'oem-gab-txt', m)); return; }
      if (champs.length) { grp = el('span', 'oem-gab-grp'); d.appendChild(grp); }
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

  // Écriture scientifique a × 10ⁿ : p.label, p.valeur, p.unite, p.rel (écart relatif, 3 % par défaut), p.cs, p.diag(v)
  function pSci(zone, p, api) {
    const d = el('div', 'ph-valeur');
    if (p.label) d.appendChild(el('span', 'ph-lab', p.label));
    const s = el('span', 'ph-sci'), a = champ({ petit: true, aria: 'Nombre devant la puissance de 10' }), n = champ({ petit: true, aria: 'Exposant de la puissance de 10' });
    n.el.classList.add('ph-exposant');
    s.appendChild(a.el); s.appendChild(el('span', 'ph-x10', '× 10')); s.appendChild(n.el);
    d.appendChild(s);
    if (p.unite) d.appendChild(el('span', 'ph-unite', p.unite));
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
      const autre = (p.aussi || []).find(x => proche(v, x.valeur, p.rel == null ? .03 : p.rel));
      if (autre) { a.desactiver(true); n.desactiver(true); bVal.fermer(); api.reussi(false, autre.note); return; }
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


  /* Grille de choix : une ligne par élément, un choix par ligne, toutes validées ensemble
     (« Entoure l'adjectif qui convient », angle α de chaque force…)
     p.lignes [{ id, label (HTML), bonne (id d'option), indices { id d'option: diagnostic }, apres (HTML affiché une fois réussi) }]
     p.options [{ id, label }] : les mêmes pour chaque ligne ; p.diag(fausses) → diagnostic d'ensemble (facultatif) */
  function pGrille(zone, p, api) {
    const g = el('div', 'oem-grille');
    g.innerHTML = p.lignes.map(l => `<div class="oem-grille-l" data-l="${l.id}">
        <div class="oem-grille-nom">${l.label}</div>
        <div class="oem-grille-ch" role="group" aria-label="${String(l.label).replace(/<[^>]+>/g, '').replace(/"/g, '')}">
          ${p.options.map(o => `<button type="button" class="oem-grille-b" data-o="${o.id}" aria-pressed="false">${o.label}</button>`).join('')}</div>
        <div class="oem-grille-apres" hidden></div></div>`).join('');
    zone.appendChild(g);
    const lignes = Array.from(g.querySelectorAll('.oem-grille-l'));
    const choisi = {};
    lignes.forEach(L => {
      L.querySelectorAll('.oem-grille-b').forEach(b => {
        b.onclick = () => {
          if (api.fini() || b.disabled) return;
          choisi[L.dataset.l] = b.dataset.o;
          L.querySelectorAll('.oem-grille-b').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
          L.classList.remove('ok', 'ko');
          api.effacer();
        };
      });
    });
    const bVal = boutonValider(zone);
    function terminer() {
      lignes.forEach((L, k) => {
        L.classList.remove('ko'); L.classList.add('ok');
        L.querySelectorAll('.oem-grille-b').forEach(b => { b.disabled = true; });
        const a = L.querySelector('.oem-grille-apres');
        if (p.lignes[k].apres) { a.innerHTML = p.lignes[k].apres; a.hidden = false; }
      });
      bVal.fermer();
    }
    bVal.onclick = () => {
      if (api.fini()) return;
      const manque = p.lignes.filter(l => !choisi[l.id]).length;
      if (manque) { secouer(g); api.message(`Fais un choix sur chaque ligne (il en manque ${manque}).`); return; }
      const fausses = p.lignes.filter(l => choisi[l.id] !== l.bonne);
      lignes.forEach((L, k) => { const ok = choisi[p.lignes[k].id] === p.lignes[k].bonne; L.classList.toggle('ok', ok); L.classList.toggle('ko', !ok); });
      if (!fausses.length) { terminer(); api.reussi(); return; }
      const ind = fausses.map(l => (l.indices && l.indices[choisi[l.id]]) || l.indice).filter(Boolean);
      api.erreur(`${fausses.length > 1 ? `${fausses.length} lignes sont fausses` : 'Une ligne est fausse'} (en rouge).` +
        ((p.diag && p.diag(fausses)) ? ' ' + p.diag(fausses) : '') + (ind.length ? '<br>' + ind.map(t => '☛ ' + t).join('<br>') : ''));
      secouer(g);
    };
    return {
      montrer() {
        lignes.forEach((L, k) => L.querySelectorAll('.oem-grille-b').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.o === p.lignes[k].bonne))));
        terminer();
      },
    };
  }

  // Outil propre à l'application : p.monter(zone, api) → { montrer() }
  function pPerso(zone, p, api) {
    const ctx = p.monter(zone, api) || {};
    return { montrer() { if (ctx.montrer) ctx.montrer(); } };
  }

  const PARTIES = { choix: pChoix, nombre: pNombre, gabarit: pGabarit, sci: pSci, grille: pGrille, perso: pPerso };
  // une partie de ce moteur dans un cours (assets/cours.js) : elle y devient un outil « perso »
  const versCours = p => ({ type: 'perso', orig: p, q: p.q, solution: p.solution || p.correction, aide: p.aide, monter: (zone, api) => PARTIES[p.type](zone, p, api) });

  /* ============================================================
     « AFFICHER TOUT LE COURS »
     Les questions et les « À toi » en cours s'inscrivent ici. Quand
     l'élève demande tout le cours, chacun « se déplie » : toutes ses
     parties sont affichées d'un coup, avec le bouton « Afficher la
     réponse » disponible tout de suite. SP.tout reste vrai ensuite :
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
      window.OEM.partieEnCours = p;          // partie en cours (utile pour vérifier l'application)
      const d = el('div', 'ph-partie', `${p.q ? `<div class="ph-partie-q">${p.q}</div>` : ''}<div class="ph-partie-fig"></div><div class="ph-partie-zone"></div><div class="ph-partie-retour"></div>
        <div class="ph-partie-aide${mode === 'cours' && !deplie && !p.aide ? ' hidden' : ''}"><button type="button" class="btn-small">${libAide}</button></div>`);
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
        reussi(silencieux, note, sansDefiler) { terminer(false, silencieux, note, sansDefiler); },
      };
      const ctx = PARTIES[p.type](d.querySelector('.ph-partie-zone'), p, api);
      p.ctx = ctx;
      bRep.onclick = () => { if (finie) return; ctx.montrer(); etat.vue = true; terminer(true); };
      function terminer(vue, silencieux, note, sansDefiler) {
        if (finie) return;
        finie = true;
        aide.remove();
        etat.details.push({ vue, erreurs: erreursIci });
        const titre = vue ? (mode === 'exercice' ? 'Correction' : 'Réponse') : (erreursIci ? 'C\'est juste.' : 'Juste !');
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
            if (!sansDefiler) setTimeout(() => s.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 80);
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
    if (mode === 'cours' && window.OEM.tout) inst.deplier();
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
      window.OEM.questionEnCours = q;          // question en cours (utile pour vérifier l'application)
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
     FIGURES À LA LARGEUR DISPONIBLE
     SP.fig(dessin) renvoie un emplacement HTML ; dès qu'il est dans la
     page, dessin(W) y est appelé avec la largeur disponible W (et de
     nouveau quand la largeur change) : les textes gardent leur taille
     et restent lisibles sur un téléphone. Plusieurs figures par page.
     ============================================================ */
  const DESSINS = new Map();
  let nFig = 0, nMotif = 0;
  function fig(dessin, cls) {
    const k = String(++nFig);
    DESSINS.set(k, dessin);
    return `<div class="oem-fig${cls ? ' ' + cls : ''}" data-fig="${k}"></div>`;
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
    const l = racine.matches && racine.matches('.oem-fig[data-fig]') ? [racine] : [];
    racine.querySelectorAll('.oem-fig[data-fig]').forEach(x => l.push(x));
    l.forEach(x => { const f = DESSINS.get(x.dataset.fig); if (f) monter(x, f); });
  }
  new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(chercher))).observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener('DOMContentLoaded', () => chercher(document.body));

  /* ============================================================
     OUTILS INTERACTIFS PLACÉS DANS DU HTML
     SP.outil(monter) renvoie un emplacement HTML ; dès qu'il est dans la
     page, monter(div) y construit l'outil, une seule fois.
     ============================================================ */
  const OUTILS = new Map();
  let nOutil = 0;
  function outil(f) {
    const k = String(++nOutil);
    OUTILS.set(k, f);
    return `<div class="oem-outil" data-outil="${k}"></div>`;
  }
  function chercherOutils(racine) {
    if (!racine || !racine.querySelectorAll) return;
    const l = racine.matches && racine.matches('.oem-outil[data-outil]') ? [racine] : [];
    racine.querySelectorAll('.oem-outil[data-outil]').forEach(x => l.push(x));
    l.forEach(x => {
      if (x.dataset.monte) return;
      const f = OUTILS.get(x.dataset.outil);
      if (f) { x.dataset.monte = '1'; f(x); }
    });
  }
  new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(chercherOutils))).observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener('DOMContentLoaded', () => chercherOutils(document.body));
  const cap = t => t.charAt(0).toUpperCase() + t.slice(1);

  // racine carrée écrite avec sa barre : √200 ; le signe (SVG étiré) prend la hauteur du contenu
  // (une fraction comprise) et rejoint la barre posée juste au-dessus du contenu
  const rac = x => '<span class="racine"><span class="racine-signe"><span class="racine-lu">√</span>' +
    '<svg viewBox="0 0 10 100" preserveAspectRatio="none" aria-hidden="true"><path d="M0,62 L2.6,55 L5.6,99 L10,0" vector-effect="non-scaling-stroke"/></svg></span>' +
    `<span class="racine-sous">${x}</span></span>`;

  /* ============================================================
     PROPRE AU CHAPITRE 19 : célérité, écriture de f et λ avec un préfixe
     ============================================================ */
  const C = 3.00e8;                                   // célérité des ondes électromagnétiques (m·s⁻¹)
  const ESP = ' ';                                    // espace insécable (valeur et unité)
  // fréquence avec le préfixe le plus simple : 2,45 GHz ; 162 kHz (n chiffres significatifs au plus, 3 par défaut)
  function txtF(f, n) {
    if (f >= 1e12) return `${sci(f, n || 2)}${ESP}Hz`;
    const P = [[1e9, 'GHz'], [1e6, 'MHz'], [1e3, 'kHz'], [1, 'Hz']];
    const [k, u] = P.find(([x]) => f >= x * .9995) || P[3];
    return `${fmt(+(f / k).toPrecision(n || 3))}${ESP}${u}`;
  }
  // longueur d'onde avec l'unité la plus simple : 0,43 m ; 12 cm ; 4,5 mm ; 500 nm ; 2,4 km
  function txtL(l, n) {
    if (l >= 1e6 || l < 1e-9) return `${sci(l, n || 2)}${ESP}m`;
    if (l >= .1 && l < 1) return `${fmt(+l.toPrecision(n || 3))}${ESP}m`;
    const P = [[1e3, 'km'], [1, 'm'], [1e-2, 'cm'], [1e-3, 'mm'], [1e-6, 'µm'], [1e-9, 'nm']];
    const [k, u] = P.find(([x]) => l >= x * .9995) || P[P.length - 1];
    return `${fmt(+(l / k).toPrecision(n || 3))}${ESP}${u}`;
  }
  // diagnostics d'un calcul λ = c / f : f en Hz, fNum : nombre écrit devant le préfixe (100 pour 100 MHz)
  function diagLambda(v, f, fNum, unite) {
    const k = unite ? ({ km: 1e3, m: 1, cm: 1e-2, mm: 1e-3 })[unite] : 1, l = C / f / k;
    if (fNum != null && fNum !== f && proche(v, C / fNum / k, .02)) return 'Convertis d\'abord f en Hz : 1 kHz = 10<sup>3</sup> Hz, 1 MHz = 10<sup>6</sup> Hz, 1 GHz = 10<sup>9</sup> Hz.';
    if (proche(v, f / C / k, .02)) return 'λ = c / f, et non f / c.';
    if (proche(v, C * f / k, .02)) return 'On divise : λ = c / f.';
    if ([1e3, 1e-3, 1e6, 1e-6].some(x => proche(v, l * x, .02))) return 'Erreur de puissance de 10 : ne confonds pas 10<sup>3</sup> (kilo) et 10<sup>6</sup> (méga), ni 10<sup>6</sup> et 10<sup>9</sup> (giga).' + (unite && unite !== 'm' ? ` Le résultat est demandé en ${unite}.` : '');
    return 'λ = c / f, avec c = 3,00 × 10<sup>8</sup> m·s<sup>−1</sup> et f en Hz.';
  }
  // diagnostics d'un calcul f = c / λ : λ en m, lNum : nombre écrit devant l'unité (12 pour 12 cm) ; k : unité du résultat (1e6 pour MHz)
  function diagFreq(v, l, lNum, k) {
    k = k || 1;
    const f = C / l / k;
    if (lNum != null && lNum !== l && proche(v, C / lNum / k, .02)) return 'Convertis d\'abord λ en mètres (1 cm = 10<sup>−2</sup> m, 1 mm = 10<sup>−3</sup> m, 1 km = 10<sup>3</sup> m).';
    if (proche(v, l / C / k, .02)) return 'f = c / λ, et non λ / c.';
    if (proche(v, C * l / k, .02)) return 'On divise : f = c / λ.';
    if ([1e3, 1e-3, 1e6, 1e-6].some(x => proche(v, f * x, .02))) return 'Erreur de puissance de 10 : vérifie la conversion des unités (10<sup>3</sup> et 10<sup>6</sup> ne sont pas interchangeables).';
    return 'f = c / λ, avec λ en m : le résultat est en Hz.';
  }
  // puissance de 10 dans un texte SVG : 10⁻¹²
  const p10 = e => `10<tspan dy="-6" font-size="0.72em">${String(e).replace('-', MOINS)}</tspan><tspan dy="6"></tspan>`;
  const r1 = v => Math.round(v * 10) / 10;

  /* ============================================================
     DOMAINES DES ONDES ÉLECTROMAGNÉTIQUES (λ en m, bornes supérieures)
     micro-ondes de 1 mm à 30 cm (exercice 10 p. 245) ; les ondes radio
     des télécommunications vont de 1 mm à 10 km (exercice 9 p. 245)
     ============================================================ */
  const DOMAINES = [
    { id: 'gamma', nom: 'rayons γ', court: 'γ', max: 1e-11 },
    { id: 'X', nom: 'rayons X', court: 'X', max: 1e-8 },
    { id: 'UV', nom: 'ultraviolet', court: 'UV', max: 4e-7 },
    { id: 'visible', nom: 'visible', court: 'visible', max: 8e-7 },
    { id: 'IR', nom: 'infrarouge', court: 'IR', max: 1e-3 },
    { id: 'micro', nom: 'micro-ondes', court: 'micro-ondes', max: .3 },
    { id: 'radio', nom: 'ondes radio', court: 'radio', max: Infinity },
  ];
  const domaine = l => DOMAINES.find(d => l < d.max);
  const optionsDomaine = () => DOMAINES.map(d => o(d.id, d.nom === 'visible' ? 'lumière visible' : d.nom));
  // bornes écrites : « de 1 mm à 30 cm »
  const BORNES_DOM = { gamma: 'λ < 10<sup>−11</sup> m', X: '10<sup>−11</sup> m à 10<sup>−8</sup> m', UV: '10 nm à 400 nm', visible: '400 nm à 800 nm',
    IR: '800 nm à 1 mm', micro: '1 mm à 30 cm', radio: 'λ > 30 cm' };

  // partie de question : domaine d'une onde de longueur d'onde l (en m), écrite « texte »
  function partieDomaine(l, texte, q) {
    const d = domaine(l);
    return { type: 'choix', q: q || `Dans quel domaine est une onde de longueur d'onde λ = ${texte} ?`, options: optionsDomaine(), bonne: d.id, melanger: false,
      indices: { radio: d.id === 'micro' ? 'Les micro-ondes vont de 1 mm à 30 cm : c\'est le domaine précis de cette onde.' : 'Les ondes radio ont des longueurs d\'onde supérieures à 30 cm.',
        micro: 'Les micro-ondes ont des longueurs d\'onde de 1 mm à 30 cm.' },
      indice: 'Écris λ en mètres (avec une puissance de 10), puis compare aux bornes des domaines.',
      solution: `<p>λ = ${texte} : domaine ${d.id === 'visible' ? 'du <b>visible</b>' : `des <b>${d.nom}</b>`} (${BORNES_DOM[d.id]}).</p>` };
  }

  // couleur d'une radiation visible (λ en nm), en attribut SVG (comme VEC.C), reprise du chapitre 10
  function couleurLambda(nm) {
    let r = 0, g = 0, b = 0;
    if (nm < 440) { r = (440 - nm) / 60; b = 1; } else if (nm < 490) { g = (nm - 440) / 50; b = 1; }
    else if (nm < 510) { g = 1; b = (510 - nm) / 20; } else if (nm < 580) { r = (nm - 510) / 70; g = 1; }
    else if (nm < 645) { r = 1; g = (645 - nm) / 65; } else r = 1;
    const k = nm > 540 && nm < 600 ? .72 : .86, h2 = v => Math.round(Math.max(0, Math.min(1, v)) * k * 255).toString(16).padStart(2, '0');
    return '#' + h2(r) + h2(g) + h2(b);
  }

  /* ============================================================
     ÉCHELLE DES ONDES ÉLECTROMAGNÉTIQUES (logarithmique)
     λ de 10⁻¹³ m à 10⁴ m en haut, f en bas (f = c / λ), domaines au milieu.
     ============================================================ */
  const EM = { lmin: -13, lmax: 4 };
  function geomEM(W) {
    const x0 = W < 480 ? 30 : 40, x1 = W - 14;
    return {
      W, H: 140, x0, x1, yL: 42, yB: 52, hB: 48,
      X: lg => x0 + (lg - EM.lmin) / (EM.lmax - EM.lmin) * (x1 - x0),
      LG: x => EM.lmin + (x - x0) / (x1 - x0) * (EM.lmax - EM.lmin),
    };
  }
  let nEM = 0;
  // o = { W, marque (log10 λ du repère, ou null), aria }
  function svgEM(o) {
    o = o || {};
    const W = Math.max(280, Math.round(o.W || 700)), g = geomEM(W), etroit = W < 560, id = 'oem-vis-' + (++nEM);
    const yB = g.yB, hB = g.hB, X = g.X;
    let s = `<svg viewBox="0 0 ${W} ${g.H}" width="${W}" height="${g.H}" class="oem-svg oem-em-svg" role="img" aria-label="${o.aria || 'Échelle des ondes électromagnétiques : longueur d\'onde en haut, fréquence en bas, de gauche à droite : rayons gamma, rayons X, ultraviolet, visible, infrarouge, micro-ondes, ondes radio'}">`;
    s += `<defs><linearGradient id="${id}" x1="0" x2="1" y1="0" y2="0">` +
      [400, 450, 490, 530, 570, 600, 640, 700, 800].map(nm => `<stop offset="${((Math.log10(nm) - Math.log10(400)) / Math.log10(2)).toFixed(3)}" stop-color="${couleurLambda(nm)}"/>`).join('') + '</linearGradient></defs>';
    // domaines
    let lgA = EM.lmin;
    DOMAINES.forEach((d, k) => {
      const lgB = Math.min(EM.lmax, Math.log10(d.max)), xa = X(lgA), xb = X(lgB), w = xb - xa;
      if (d.id === 'visible') s += `<rect x="${r1(xa)}" y="${yB}" width="${r1(w)}" height="${hB}" fill="url(#${id})"/>`;
      else s += `<rect class="oem-em-dom${k % 2 ? ' c2' : ''}" x="${r1(xa)}" y="${yB}" width="${r1(w)}" height="${hB}"/>`;
      const nom = d.id === 'visible' ? '' : (w > d.nom.length * (etroit ? 6.2 : 7) + 6 ? d.nom : d.court);
      if (nom) {
        const fs = etroit ? 10.5 : 12.5;
        if (nom === 'micro-ondes' && w < nom.length * fs * .58) {
          s += `<text class="oem-em-nom" x="${r1(xa + w / 2)}" y="${yB + hB / 2 - 3}" text-anchor="middle" font-size="${fs}">micro-</text><text class="oem-em-nom" x="${r1(xa + w / 2)}" y="${yB + hB / 2 + 10}" text-anchor="middle" font-size="${fs}">ondes</text>`;
        } else s += `<text class="oem-em-nom" x="${r1(xa + w / 2)}" y="${yB + hB / 2 + 4}" text-anchor="middle" font-size="${fs}">${nom}</text>`;
      }
      if (k) s += `<line class="oem-em-sep" x1="${r1(xa)}" y1="${yB}" x2="${r1(xa)}" y2="${yB + hB}"/>`;
      lgA = lgB;
    });
    s += `<rect class="oem-em-cadre" x="${g.x0}" y="${yB}" width="${r1(g.x1 - g.x0)}" height="${hB}"/>`;
    // « visible » : flèche au-dessus de la bande
    const xv = X(Math.log10(5.6e-7));
    s += `<text class="oem-em-vis" x="${r1(xv)}" y="12" text-anchor="middle">visible</text><path class="oem-em-fl" d="M${r1(xv)},16 V26 m-4,-5 l4,5 l4,-5"/>`;
    // λ : graduations en haut (exposants impairs), f : en bas (f = 10ᵏ Hz)
    const expL = etroit ? [-11, -7, -3, 1] : [-11, -9, -7, -5, -3, -1, 1, 3];
    for (let e = EM.lmin; e <= EM.lmax; e++) s += `<line class="oem-em-tic" x1="${r1(X(e))}" y1="${yB - (expL.includes(e) ? 7 : 4)}" x2="${r1(X(e))}" y2="${yB}"/>`;
    expL.forEach(e => { s += `<text class="oem-em-txt" x="${r1(X(e))}" y="${g.yL - 5}" text-anchor="middle">${p10(e)}</text>`; });
    const lc = Math.log10(C), expF = etroit ? [20, 16, 12, 8] : [21, 19, 17, 15, 13, 11, 9, 7, 5];
    for (let k = 5; k <= 21; k++) { const x = X(lc - k); if (x >= g.x0 - .5 && x <= g.x1 + .5) s += `<line class="oem-em-tic" x1="${r1(x)}" y1="${yB + hB}" x2="${r1(x)}" y2="${yB + hB + (expF.includes(k) ? 7 : 4)}"/>`; }
    expF.forEach(k => { const x = X(lc - k); if (x >= g.x0 && x <= g.x1) s += `<text class="oem-em-txt" x="${r1(x)}" y="${yB + hB + 22}" text-anchor="middle">${p10(k)}</text>`; });
    s += `<text class="oem-em-ax" x="${g.x0 - 6}" y="${g.yL - 5}" text-anchor="end">λ (m)</text><text class="oem-em-ax" x="${g.x0 - 6}" y="${yB + hB + 22}" text-anchor="end">f (Hz)</text>`;
    s += `<text class="oem-em-sens" x="${g.x0}" y="${g.H - 2}">← f augmente</text><text class="oem-em-sens" x="${g.x1}" y="${g.H - 2}" text-anchor="end">λ augmente →</text>`;
    // repère (outil « placer une onde ») : triangle en haut, trait vertical
    if (o.marque != null) {
      s += `<g class="oem-em-repere" transform="translate(${r1(X(o.marque))},0)"><line x1="0" y1="${yB - 14}" x2="0" y2="${yB + hB + 10}"/>` +
        `<path d="M0,${yB - 2} l-8,-14 h16 z"/></g>`;
    }
    return s + '</svg>';
  }

  /* ---------- outil « échelle » : un repère à placer sur l'échelle des ondes ----------
     monterEchelle(zone, { lg (départ), lecture (bool : λ, f et domaine affichés en direct), saisie (bool : champs f ou λ) })
     → { lg(), placer(lg), surChange(f), lecture(bool), bloquer() } */
  function monterEchelle(zone, opts) {
    opts = opts || {};
    const d = el('div', 'oem-em');
    d.innerHTML = `<div class="oem-em-fig" aria-hidden="false"></div>
      <label class="oem-em-curseur"><span class="oem-em-curseur-t">Déplace le repère (fais glisser sur l'échelle, touche-la, ou utilise ce curseur)</span>
        <input type="range" min="0" max="1700" step="1" aria-label="Position du repère sur l'échelle des ondes électromagnétiques"></label>
      <p class="oem-em-lect" aria-live="polite"></p>
      ${opts.saisie ? `<div class="oem-em-saisie"><div class="oem-em-g" role="group" aria-label="Grandeur donnée">
          <button type="button" class="oem-pill" data-g="f" aria-pressed="true">Je donne f</button><button type="button" class="oem-pill" data-g="l" aria-pressed="false">Je donne λ</button></div>
        <div class="oem-em-ligne"><span class="ph-lab" data-a="lab">f =</span><span data-a="champ"></span>
          <select class="oem-select" data-a="unite" aria-label="Unité"></select>
          <button type="button" class="btn-secondary" data-a="placer">Placer sur l'échelle</button></div><p class="oem-em-msg"></p></div>` : ''}`;
    zone.appendChild(d);
    const fig = d.querySelector('.oem-em-fig'), range = d.querySelector('input[type="range"]'), lect = d.querySelector('.oem-em-lect');
    let lg = opts.lg != null ? opts.lg : -6.3, W = 0, g = null, actif = true, voir = opts.lecture !== false;
    const ecouteurs = [];
    function dessiner() {
      W = Math.round(fig.clientWidth) || 640;
      g = geomEM(W);
      fig.innerHTML = svgEM({ W, marque: lg });
    }
    function maj(silencieux) {
      lg = Math.max(EM.lmin, Math.min(EM.lmax, lg));
      const rep = fig.querySelector('.oem-em-repere');
      if (rep && g) rep.setAttribute('transform', `translate(${r1(g.X(lg))},0)`);
      range.value = String(Math.round((lg - EM.lmin) * 100));
      const l = Math.pow(10, lg), f = C / l;
      lect.innerHTML = voir ? `λ = <b>${txtL(l, 2)}</b> ; f = <b>${txtF(f, 2)}</b> ; domaine : <b>${domaine(l).nom}</b>` : 'Place le repère, puis valide.';
      if (!silencieux) ecouteurs.forEach(fn => fn(lg));
    }
    // glisser sur l'échelle (souris, doigt) ou la toucher
    let tire = false;
    const versLg = ev => { const r = fig.querySelector('svg').getBoundingClientRect(); return g.LG((ev.clientX - r.left) * W / r.width); };
    fig.addEventListener('pointerdown', ev => {
      if (!actif || !fig.querySelector('svg')) return;
      tire = true; lg = versLg(ev); maj();
      try { fig.setPointerCapture(ev.pointerId); } catch (x) { /* rien */ }
    });
    fig.addEventListener('pointermove', ev => { if (tire && actif) { lg = versLg(ev); maj(); } });
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(t => fig.addEventListener(t, () => { tire = false; }));
    range.addEventListener('input', () => { if (!actif) return; lg = EM.lmin + (+range.value) / 100; maj(); });
    if (window.ResizeObserver) new ResizeObserver(() => { if (Math.round(fig.clientWidth) !== W) { dessiner(); maj(true); } }).observe(fig);
    dessiner(); maj(true);
    // saisie de f ou de λ (outil libre du cours)
    if (opts.saisie) {
      const UF = [['Hz', 1], ['kHz', 1e3], ['MHz', 1e6], ['GHz', 1e9]], UL = [['nm', 1e-9], ['µm', 1e-6], ['mm', 1e-3], ['cm', 1e-2], ['m', 1], ['km', 1e3]];
      const ch = champ({ signe: false, aria: 'Valeur' });
      d.querySelector('[data-a="champ"]').appendChild(ch.el);
      const sel = d.querySelector('[data-a="unite"]'), msg = d.querySelector('.oem-em-msg');
      let gr = 'f';
      const remplir = () => {
        sel.innerHTML = (gr === 'f' ? UF : UL).map(([u, k]) => `<option value="${k}"${u === (gr === 'f' ? 'MHz' : 'm') ? ' selected' : ''}>${u}</option>`).join('');
        d.querySelector('[data-a="lab"]').textContent = gr === 'f' ? 'f =' : 'λ =';
        d.querySelectorAll('[data-g]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.g === gr)));
      };
      d.querySelectorAll('[data-g]').forEach(b => { b.onclick = () => { gr = b.dataset.g; remplir(); msg.textContent = ''; }; });
      remplir();
      const placer = () => {
        const v = lire(ch.input.value) * +sel.value;
        if (!(v > 0)) { msg.textContent = 'Écris un nombre positif.'; secouer(ch.el); return; }
        const l = gr === 'f' ? C / v : v, x = Math.log10(l);
        if (x < EM.lmin || x > EM.lmax) { msg.textContent = 'Cette onde est hors de l\'échelle dessinée (λ de 10⁻¹³ m à 10⁴ m).'; return; }
        msg.textContent = '';
        lg = x; maj();
      };
      d.querySelector('[data-a="placer"]').onclick = placer;
      ch.input.addEventListener('keydown', ev => { if (ev.key === 'Enter') { ev.preventDefault(); placer(); } });
    }
    return {
      el: d,
      lg: () => lg,
      placer(x, silencieux) { lg = x; maj(silencieux); },
      surChange(fn) { ecouteurs.push(fn); },
      lecture(b) { voir = b; maj(true); },
      bloquer() { actif = false; range.disabled = true; d.classList.add('fini'); },
    };
  }

  /* ---------- partie de question : placer une onde sur l'échelle ----------
     o = { donnee: 'f' | 'l', valeur (f en Hz ou λ en m), texte (valeur écrite, avec son préfixe), q, solution }
     Réussie quand le repère est à moins de 0,3 décade de la bonne position (facteur 2). */
  function partieEchelle(o) {
    const l = o.donnee === 'f' ? C / o.valeur : o.valeur, cible = Math.log10(l);
    const dom = domaine(l);
    return {
      type: 'perso', cible,                  // cible : log10 λ (utile pour vérifier l'application)
      q: o.q || `Place sur l'échelle une onde de ${o.donnee === 'f' ? 'fréquence' : 'longueur d\'onde'} <b>${o.donnee === 'f' ? 'f' : 'λ'} = ${o.texte}</b>, puis valide.`,
      solution: o.solution || `<p>${o.donnee === 'f' ? `On lit f = ${o.texte} sur l'axe du bas (ou on calcule λ = c / f = ${txtL(l, 2)}).` : `On lit λ = ${o.texte} sur l'axe du haut.`} Cette onde est dans le domaine des <b>${dom.nom}</b>.</p>`,
      monter(zone, api) {
        const ech = monterEchelle(zone, { lg: cible > -4.5 ? -9 : 1, lecture: false });
        ech.surChange(() => api.effacer());
        const bVal = boutonValider(zone);
        bVal.onclick = () => {
          if (api.fini()) return;
          const x = ech.lg(), ecart = x - cible;
          if (Math.abs(ecart) <= .3) { ech.bloquer(); ech.lecture(true); bVal.fermer(); api.reussi(); return; }
          let diag;
          const v = Math.log10(o.valeur);
          if (o.donnee === 'f' && Math.abs(x - v) <= .3) diag = 'Tu as placé la fréquence sur l\'axe des <b>longueurs d\'onde</b> (en haut). La fréquence se lit sur l\'axe du <b>bas</b>, f (Hz).';
          else if (Math.abs(Math.abs(ecart) - 3) <= .3 || Math.abs(Math.abs(ecart) - 6) <= .3) diag = 'Ton repère est à 3 ou 6 graduations près : vérifie la conversion du préfixe (1 kHz = 10<sup>3</sup> Hz, 1 MHz = 10<sup>6</sup> Hz, 1 GHz = 10<sup>9</sup> Hz ; 1 mm = 10<sup>−3</sup> m, 1 nm = 10<sup>−9</sup> m).';
          else diag = ecart > 0 ? 'Ton repère est trop à <b>droite</b> : la longueur d\'onde y est trop grande (la fréquence trop petite).'
            : 'Ton repère est trop à <b>gauche</b> : la longueur d\'onde y est trop petite (la fréquence trop grande).';
          api.erreur(diag + ' Une graduation = une puissance de 10.');
        };
        return { montrer() { ech.placer(cible, true); ech.bloquer(); ech.lecture(true); bVal.fermer(); } };
      },
    };
  }

  /* ============================================================
     BANDES DE FRÉQUENCES RADIO (de 300 GHz à 30 kHz, comme dans le manuel)
     ============================================================ */
  const BANDES = [
    { id: 'EHF', min: 30e9, nom: 'Extra High', nom2: 'Frequencies', bornes: '30 GHz à 300 GHz' },
    { id: 'SHF', min: 3e9, nom: 'Super High', nom2: 'Frequencies', bornes: '3 GHz à 30 GHz' },
    { id: 'UHF', min: 300e6, nom: 'Ultra High', nom2: 'Frequencies', bornes: '300 MHz à 3 GHz' },
    { id: 'VHF', min: 30e6, nom: 'Very High', nom2: 'Frequencies', bornes: '30 MHz à 300 MHz' },
    { id: 'HF', min: 3e6, nom: 'Hautes fréq.', nom2: 'ondes courtes', bornes: '3 MHz à 30 MHz' },
    { id: 'MF', min: 300e3, nom: 'Moyennes fréq.', nom2: 'petites ondes', bornes: '300 kHz à 3 MHz' },
    { id: 'BF', min: 30e3, nom: 'Basses fréq.', nom2: 'grandes ondes', bornes: '30 kHz à 300 kHz' },
  ];
  const BORNES_BANDES = ['300 GHz', '30 GHz', '3 GHz', '300 MHz', '30 MHz', '3 MHz', '300 kHz', '30 kHz'];
  const bande = f => BANDES.find(b => f >= b.min * (1 - 1e-9) && f < b.min * 10 * (1 + 1e-9)) || null;
  const optionsBande = () => BANDES.map(b => o(b.id, b.id));
  // diagnostic d'une bande mal choisie pour la fréquence f (préfixe, sens de l'échelle)
  function diagBande(f, id, viaLambda) {
    const b = bande(f), i = BANDES.findIndex(x => x.id === id), j = BANDES.indexOf(b);
    if (!b || i < 0) return '';
    if (Math.abs(i - j) === 3) return 'Tu t\'es trompé de préfixe : 1 GHz = 1 000 MHz, 1 MHz = 1 000 kHz.';
    if (viaLambda && Math.abs(i - j) >= 1) return 'Calcule d\'abord la fréquence f = c / λ (λ en m), puis compare-la aux bornes des bandes.';
    return `La bande ${id} va de ${BANDES[i].bornes}. Les bornes sont des « 3 × 10<sup>n</sup> » : compare ${txtF(f)} à ces bornes.`;
  }

  // échelle des bandes (SVG, largeur fixe, défile sur un petit écran)
  // o = { usages: [{ f, lignes: ['Wi-Fi', …] }], marques: [{ f, txt }], aria }
  function svgBandes(o) {
    o = o || {};
    const W = 700, x0 = 22, cw = (W - 2 * x0) / 7, haut = o.usages ? 52 : 0, yA = haut + 22, yC = yA + 8, hC = 72;
    const X = f => x0 + (Math.log10(300e9) - Math.log10(f)) * cw;
    const H = yC + hC + (o.marques ? 34 : 6);
    let s = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" class="oem-svg oem-bandes-svg" role="img" aria-label="${o.aria || 'Bandes de fréquences radio, de 300 GHz à gauche à 30 kHz à droite : EHF, SHF, UHF, VHF, HF (ondes courtes), MF (petites ondes), BF (grandes ondes)'}">`;
    BANDES.forEach((b, k) => {
      const x = x0 + k * cw;
      s += `<rect class="oem-bd-c${k % 2 ? ' c2' : ''}" x="${r1(x)}" y="${yC}" width="${r1(cw)}" height="${hC}"/>`;
      s += `<text class="oem-bd-nom" x="${r1(x + cw / 2)}" y="${yC + 25}" text-anchor="middle">${b.id}</text>`;
      s += `<text class="oem-bd-sous" x="${r1(x + cw / 2)}" y="${yC + 44}" text-anchor="middle">${b.nom}</text><text class="oem-bd-sous" x="${r1(x + cw / 2)}" y="${yC + 58}" text-anchor="middle">${b.nom2}</text>`;
    });
    s += `<rect class="oem-em-cadre" x="${x0}" y="${yC}" width="${r1(7 * cw)}" height="${hC}"/>`;
    BORNES_BANDES.forEach((t, k) => {
      const x = x0 + k * cw;
      s += `<line class="oem-em-tic" x1="${r1(x)}" y1="${yA - 4}" x2="${r1(x)}" y2="${yC + hC}"/>`;
      s += `<text class="oem-em-txt" x="${r1(Math.min(W - 26, Math.max(26, x)))}" y="${yA - 8}" text-anchor="middle">${t}</text>`;
    });
    (o.usages || []).forEach(u => {
      const x = X(u.f);
      u.lignes.forEach((l, i) => { s += `<text class="oem-bd-usage" x="${r1(x)}" y="${12 + i * 12 + (3 - u.lignes.length) * 6}" text-anchor="middle">${l}</text>`; });
      s += `<path class="oem-em-fl" d="M${r1(x)},${haut - 12} V${haut + 4} m-4,-5 l4,5 l4,-5"/>`;
    });
    (o.marques || []).forEach(m => {
      const x = X(m.f);
      s += `<path class="oem-bd-marque" d="M${r1(x)},${yC + hC + 2} l-6,10 h12 z"/><text class="oem-bd-mtxt" x="${r1(Math.min(W - 40, Math.max(40, x)))}" y="${yC + hC + 27}" text-anchor="middle">${m.txt}</text>`;
    });
    return s + '</svg>';
  }
  const figBandes = o => `<div class="oem-defile"><div class="oem-bandes">${svgBandes(o)}</div></div>`;

  /* ---------- usages à placer dans les bandes (outil « étiquettes ») ---------- */
  const USAGES = [
    { id: 'fm', nom: 'Radio FM', f: 100e6, txt: '100 MHz' },
    { id: 'go', nom: 'Radio grandes ondes', f: 162e3, txt: '162 kHz' },
    { id: 'po', nom: 'Radio petites ondes', f: 1e6, txt: 'λ = 300 m', l: 300 },
    { id: 'oc', nom: 'Radio ondes courtes', f: 6e6, txt: '6 MHz' },
    { id: 'cb', nom: 'Cibi (CB)', f: 27e6, txt: '27 MHz' },
    { id: 'rfid', nom: 'Carte RFID de cantine', f: 13.56e6, txt: '13,56 MHz' },
    { id: 'badge', nom: 'Badge RFID', f: 135e3, txt: '135 kHz' },
    { id: 'tnt', nom: 'TNT', f: 6e8, txt: 'λ = 0,50 m', l: .5 },
    { id: '4g', nom: '4G', f: 3e8 / .43, txt: 'λ = 0,43 m', l: .43 },
    { id: 'wifi', nom: 'Wi-Fi', f: 2.4e9, txt: '2,4 GHz' },
    { id: 'wifi5', nom: 'Wi-Fi', f: 5e9, txt: 'λ = 6,0 cm', l: .06 },
    { id: 'radar', nom: 'Radar météo', f: 10e9, txt: '10 GHz' },
    { id: '5g', nom: '5G en ville', f: 26e9, txt: '26 GHz' },
    { id: 'auto', nom: 'Radar de voiture', f: 77e9, txt: '77 GHz' },
    { id: 'tw', nom: 'Talkie-walkie', f: 446e6, txt: '446 MHz' },
    { id: 'avion', nom: 'Radio des avions', f: 120e6, txt: 'λ = 2,5 m', l: 2.5 },
    { id: 'horloge', nom: 'Horloge radio-pilotée', f: 77.5e3, txt: '77,5 kHz' },
    { id: 'gps', nom: 'GPS', f: 3e8 / .19, txt: 'λ = 19 cm', l: .19 },
  ];
  // tirage de n usages, de bandes le plus possible différentes, avec au moins une longueur d'onde
  function tirerUsages(n) {
    for (let essai = 0; essai < 50; essai++) {
      const l = melanger(USAGES).slice(0, n), bs = new Set(l.map(u => bande(u.f).id));
      if (bs.size >= n - 1 && l.some(u => u.l) && l.some(u => !u.l)) return l;
    }
    return melanger(USAGES).slice(0, n);
  }

  /* Partie de question : étiquettes à placer dans les bandes (glisser, ou toucher l'étiquette puis la bande)
     o = { usages (liste de USAGES), q, solution } — assets/dragdrop.js doit être chargé */
  function partieEtiquettes(o) {
    const us = o.usages || tirerUsages(o.n || 4);
    return {
      type: 'perso', usages: us,             // usages tirés (utile pour vérifier l'application)
      q: o.q || 'Place chaque étiquette dans la bonne bande (calcule d\'abord f = c / λ quand on te donne la longueur d\'onde).',
      solution: o.solution || `<ul class="er-liste">${us.map(u => `<li><b>${u.nom}</b> : ${u.l ? `f = c / λ = ${fmt(C)} / ${fmt(u.l)} ≈ ${txtF(u.f, 2)}, ` : `f = ${u.txt}, `}bande <b>${bande(u.f).id}</b> (${bande(u.f).bornes}).</li>`).join('')}</ul>`,
      monter(zone, api) {
        const d = el('div', 'oem-et');
        d.innerHTML = `<div class="oem-et-palette"><p class="oem-et-palette-t">Étiquettes à placer <span>· fais-les glisser dans une bande, ou touche une étiquette puis une bande</span></p>
            <div class="oem-et-liste">${us.map(u => `<button type="button" class="oem-chip" data-id="${u.id}"><b>${u.nom}</b> <span>${u.txt}</span></button>`).join('')}</div></div>
          <div class="oem-et-bandes">${BANDES.map(b => `<div class="oem-et-bande" data-b="${b.id}" tabindex="0"><div class="oem-et-tete"><b>${b.id}</b><span>${b.bornes}</span></div><div class="oem-et-depot"></div></div>`).join('')}</div>
          <p class="oem-et-sens">Les fréquences diminuent de gauche à droite (de haut en bas sur un téléphone), comme dans le manuel.</p>`;
        zone.appendChild(d);
        const liste = d.querySelector('.oem-et-liste'), chips = Array.from(d.querySelectorAll('.oem-chip')), cases = Array.from(d.querySelectorAll('.oem-et-bande'));
        const us_ = id => us.find(u => u.id === id);
        const bVal = boutonValider(zone);
        let choisie = null, fini = false;
        function choisir(c) {
          if (choisie) choisie.classList.remove('choisie');
          choisie = c; if (c) c.classList.add('choisie');
          d.classList.toggle('en-choix', !!c);
        }
        function placer(c, cible) {
          (cible ? cible.querySelector('.oem-et-depot') : liste).appendChild(c);
          cases.forEach(x => x.classList.remove('ok', 'ko'));
          chips.forEach(x => x.classList.remove('ok', 'ko'));
          d.querySelector('.oem-et-palette').classList.toggle('vide', !liste.querySelector('.oem-chip'));
          api.effacer();
        }
        chips.forEach(c => {
          let x0 = 0, y0 = 0;
          c.addEventListener('pointerdown', ev => { x0 = ev.clientX; y0 = ev.clientY; }, true);
          window.DragDrop.enable(c, {
            zoneSelector: '.oem-et-bande, .oem-et-palette',
            dragOverClass: 'survol',
            onDrop: (item, z, ev) => {
              if (fini) return;
              // simple appui : sélection (puis toucher une bande)
              if (Math.hypot(ev.clientX - x0, ev.clientY - y0) < 8) { choisir(choisie === item ? null : item); return; }
              choisir(null);
              if (!z || !d.contains(z)) return;
              placer(item, z.classList.contains('oem-et-bande') ? z : null);
            },
          });
          c.addEventListener('keydown', ev => { if ((ev.key === 'Enter' || ev.key === ' ') && !fini) { ev.preventDefault(); choisir(choisie === c ? null : c); } });
        });
        cases.forEach(s => {
          const poser = () => { if (!fini && choisie) { placer(choisie, s); choisir(null); } };
          s.addEventListener('click', ev => { if (!ev.target.closest('.oem-chip')) poser(); });
          s.addEventListener('keydown', ev => { if ((ev.key === 'Enter' || ev.key === ' ') && ev.target === s) { ev.preventDefault(); poser(); } });
        });
        d.querySelector('.oem-et-palette').addEventListener('click', ev => { if (!fini && choisie && !ev.target.closest('.oem-chip')) { placer(choisie, null); choisir(null); } });
        function terminer() { fini = true; choisir(null); chips.forEach(c => { c.style.pointerEvents = 'none'; c.tabIndex = -1; }); d.classList.add('fini'); bVal.fermer(); }
        bVal.onclick = () => {
          if (fini || api.fini()) return;
          const reste = chips.filter(c => !c.closest('.oem-et-bande')).length;
          if (reste) { secouer(d.querySelector('.oem-et-palette')); api.message(`Place toutes les étiquettes (il en reste ${reste}).`); return; }
          const fausses = chips.filter(c => c.closest('.oem-et-bande').dataset.b !== bande(us_(c.dataset.id).f).id);
          chips.forEach(c => { const ok = fausses.indexOf(c) === -1; c.classList.toggle('ok', ok); c.classList.toggle('ko', !ok); });
          if (!fausses.length) { terminer(); api.reussi(); return; }
          api.erreur(`${fausses.length > 1 ? `${fausses.length} étiquettes sont mal placées` : 'Une étiquette est mal placée'} (en rouge).<br>` +
            fausses.map(c => { const u = us_(c.dataset.id); return `☛ ${u.nom} : ${diagBande(u.f, c.closest('.oem-et-bande').dataset.b, !!u.l)}`; }).join('<br>'));
          secouer(d.querySelector('.oem-et-bandes'));
        };
        return {
          montrer() {
            chips.forEach(c => { placer(c, cases.find(s => s.dataset.b === bande(us_(c.dataset.id).f).id)); c.classList.add('ok'); });
            terminer();
          },
        };
      },
    };
  }

  /* ============================================================
     FIGURES PROPRES AU CHAPITRE (SVG)
     ============================================================ */
  // sinusoïde en fonction de la distance, λ repérée entre deux crêtes
  // o = { W, n (nombre de longueurs d'onde dessinées), D (distance totale), unite ('m'), pas (graduation), lambda (true : accolade λ) }
  function svgLambda(o) {
    o = o || {};
    const W = Math.max(260, Math.round(o.W || 560)), H = 150, n = o.n || 3, D = o.D, x0 = 26, x1 = W - 70, y0 = 78, A = 34;
    const X = x => x0 + x / D * (x1 - x0), lam = D / n;
    let s = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" class="oem-svg" role="img" aria-label="${o.aria || `Onde dessinée en fonction de la distance : ${n} longueurs d'onde sur ${fmt(D)} ${o.unite || 'm'}`}">`;
    if (o.pas) {
      for (let x = 0; x <= D + 1e-9; x += o.pas) {
        s += `<line class="mod-grille" x1="${r1(X(x))}" y1="${y0 - A - 6}" x2="${r1(X(x))}" y2="${y0 + A + 6}"/>`;
        s += `<text class="mod-txt" x="${r1(X(x))}" y="${y0 + A + 22}" text-anchor="middle">${fmt(+x.toFixed(6))}</text>`;
      }
    }
    s += `<line class="mod-axe" x1="${x0}" y1="${y0}" x2="${x1 + 14}" y2="${y0}"/><path class="mod-pointe" d="M${x1 + 19},${y0} l-7,-3.5 v7 z"/>`;
    s += `<line class="mod-axe" x1="${x0}" y1="${y0 + A + 10}" x2="${x0}" y2="${y0 - A - 12}"/>`;
    s += `<text class="mod-txt mod-titre-axe" x="${x1 + 20}" y="${y0 + 18}" text-anchor="end">distance (${o.unite || 'm'})</text>`;
    let p = '';
    for (let k = 0; k <= 400; k++) { const x = D * k / 400; p += (k ? 'L' : 'M') + r1(X(x)) + ',' + r1(y0 - A * Math.sin(2 * Math.PI * x / lam)); }
    s += `<path class="mod-courbe" d="${p}"/>`;
    if (o.lambda !== false) {
      const xa = X(lam / 4), xb = X(lam * 5 / 4), y = y0 - A - 10;
      s += `<line class="oem-cote" x1="${r1(xa)}" y1="${y0 - A}" x2="${r1(xa)}" y2="${y - 6}"/><line class="oem-cote" x1="${r1(xb)}" y1="${y0 - A}" x2="${r1(xb)}" y2="${y - 6}"/>`;
      s += `<path class="oem-cote-fl" d="M${r1(xa)},${y} H${r1(xb)} M${r1(xa + 7)},${y - 4} L${r1(xa)},${y} L${r1(xa + 7)},${y + 4} M${r1(xb - 7)},${y - 4} L${r1(xb)},${y} L${r1(xb - 7)},${y + 4}"/>`;
      s += `<text class="oem-cote-t" x="${r1((xa + xb) / 2)}" y="${y - 6}" text-anchor="middle">λ</text>`;
    }
    return s + '</svg>';
  }

  // antenne dipôle : une longueur d'onde en haut, l'antenne (deux brins) en dessous
  // o = { W, n (2 : demi-onde, 4 : quart d'onde) }
  function svgAntenne(o) {
    o = o || {};
    const W = Math.max(260, Math.round(o.W || 520)), H = 170, n = o.n || 2, x0 = 30, x1 = W - 30, yS = 46, A = 20, yA = 128;
    const L = (x1 - x0) / n, xm = x0 + L / 2;
    let s = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" class="oem-svg" role="img" aria-label="${o.aria || `Une longueur d'onde λ, et une antenne ${n === 2 ? 'demi-onde de longueur L = λ / 2' : 'quart d\'onde de longueur L = λ / 4'}`}">`;
    let p = '';
    for (let k = 0; k <= 300; k++) { const x = x0 + (x1 - x0) * k / 300; p += (k ? 'L' : 'M') + r1(x) + ',' + r1(yS - A * Math.sin(2 * Math.PI * k / 300)); }
    s += `<line class="mod-grille" x1="${x0}" y1="${yS}" x2="${x1}" y2="${yS}"/><path class="mod-courbe" d="${p}"/>`;
    const fl = (xa, xb, y, t) => `<path class="oem-cote-fl" d="M${r1(xa)},${y} H${r1(xb)} M${r1(xa + 7)},${y - 4} L${r1(xa)},${y} L${r1(xa + 7)},${y + 4} M${r1(xb - 7)},${y - 4} L${r1(xb)},${y} L${r1(xb - 7)},${y + 4}"/>` +
      `<line class="oem-cote" x1="${r1(xa)}" y1="${y - 8}" x2="${r1(xa)}" y2="${y + 8}"/><line class="oem-cote" x1="${r1(xb)}" y1="${y - 8}" x2="${r1(xb)}" y2="${y + 8}"/>` +
      `<text class="oem-cote-t" x="${r1((xa + xb) / 2)}" y="${y - 7}" text-anchor="middle">${t}</text>`;
    s += fl(x0, x1, yS + A + 18, 'λ');
    // antenne : deux brins alimentés en leur milieu
    s += `<line class="oem-brin" x1="${r1(x0)}" y1="${yA}" x2="${r1(xm - 5)}" y2="${yA}"/><line class="oem-brin" x1="${r1(xm + 5)}" y1="${yA}" x2="${r1(x0 + L)}" y2="${yA}"/>`;
    s += `<path class="oem-cable" d="M${r1(xm - 5)},${yA} V${yA + 26} M${r1(xm + 5)},${yA} V${yA + 26}"/>`;
    s += fl(x0, x0 + L, yA - 14, n === 2 ? 'L = λ / 2' : 'L = λ / 4');
    s += `<text class="mod-txt" x="${r1(xm + 12)}" y="${yA + 24}">alimentation</text>`;
    return s + '</svg>';
  }

  // carte RFID : antenne bobinée sur une surface rectangulaire de 6,5 cm × 4,5 cm
  function svgCarteRFID() {
    const W = 380, H = 250, x = 40, y = 30, w = 260, h = 180;
    let s = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" class="oem-svg" role="img" aria-label="Carte RFID : fil de cuivre bobiné autour d'une surface rectangulaire de 6,5 cm sur 4,5 cm, relié à la puce">`;
    s += `<rect class="oem-carte" x="${x - 18}" y="${y - 14}" width="${w + 36}" height="${h + 28}" rx="14"/>`;
    for (let k = 0; k < 4; k++) s += `<rect class="oem-spire" x="${x + k * 6}" y="${y + k * 6}" width="${w - 12 * k}" height="${h - 12 * k}" rx="6"/>`;
    s += `<rect class="oem-puce" x="${x + w / 2 - 18}" y="${y + h / 2 - 14}" width="36" height="28" rx="4"/><text class="mod-txt" x="${x + w / 2}" y="${y + h / 2 + 32}" text-anchor="middle">puce</text>`;
    s += `<path class="oem-cable" d="M${x + 18},${y + h / 2} H${x + w / 2 - 18}"/>`;
    s += `<path class="oem-cote-fl" d="M${x},${y + h + 26} H${x + w} M${x + 7},${y + h + 22} L${x},${y + h + 26} L${x + 7},${y + h + 30} M${x + w - 7},${y + h + 22} L${x + w},${y + h + 26} L${x + w - 7},${y + h + 30}"/>`;
    s += `<text class="oem-cote-t" x="${x + w / 2}" y="${y + h + 22}" text-anchor="middle">6,5 cm</text>`;
    s += `<path class="oem-cote-fl" d="M${x + w + 30},${y} V${y + h} M${x + w + 26},${y + 7} L${x + w + 30},${y} L${x + w + 34},${y + 7} M${x + w + 26},${y + h - 7} L${x + w + 30},${y + h} L${x + w + 34},${y + h - 7}"/>`;
    s += `<text class="oem-cote-t" x="${x + w + 38}" y="${y + h / 2 + 4}">4,5 cm</text>`;
    return s + '</svg>';
  }

  // talkie-walkie dessiné à l'échelle (la photo de l'énoncé), avec une règle de 10 cm
  function svgTalkie() {
    const W = 300, H = 300, k = 12, x = 70, y = 70, w = 6 * k, h = 15 * k;           // 1 cm = 12 px : boîtier 6 cm × 15 cm
    let s = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" class="oem-svg" role="img" aria-label="Talkie-walkie dessiné à l'échelle : boîtier d'environ 15 cm de haut, antenne d'environ 4 cm ; règle de 10 cm">`;
    s += `<rect class="oem-tw-ant" x="${x + w - 20}" y="${y - 4 * k}" width="12" height="${4 * k + 6}" rx="6"/>`;
    s += `<rect class="oem-tw" x="${x}" y="${y}" width="${w}" height="${h}" rx="16"/>`;
    s += `<rect class="oem-tw-ecran" x="${x + 14}" y="${y + 30}" width="${w - 28}" height="34" rx="5"/><text class="mod-txt" x="${x + w / 2}" y="${y + 53}" text-anchor="middle">3</text>`;
    for (let i = 0; i < 3; i++) s += `<circle class="oem-tw-bt" cx="${x + 18 + i * 18}" cy="${y + 84}" r="6"/>`;
    for (let i = 0; i < 4; i++) s += `<line class="oem-tw-hp" x1="${x + 16}" y1="${y + 112 + i * 12}" x2="${x + w - 16}" y2="${y + 112 + i * 12}"/>`;
    // règle de 10 cm
    const xr = 210, yr = y - 4 * k + 10;
    s += `<line class="oem-cote" x1="${xr}" y1="${yr}" x2="${xr}" y2="${yr + 10 * k}"/>`;
    for (let i = 0; i <= 10; i++) s += `<line class="oem-cote" x1="${xr}" y1="${yr + i * k}" x2="${xr + (i % 5 ? 6 : 12)}" y2="${yr + i * k}"/>`;
    s += `<text class="mod-txt" x="${xr + 16}" y="${yr + 4}">0</text><text class="mod-txt" x="${xr + 16}" y="${yr + 10 * k + 4}">10 cm</text>`;
    return s + '</svg>';
  }

  /* ============================================================
     PLAN DE L'APPLICATION ET NAVIGATION (voir assets/sommaire.js)
     ============================================================ */
  const PLAN = [
    { n: 1, titre: 'Longueur d\'onde et fréquence', desc: 'Onde électromagnétique, c = 3,00 × 10<sup>8</sup> m·s<sup>−1</sup>, λ = c / f, domaines des ondes', fiche: 'fiche_1',
      // deux sous-modules de cours, puis une seule série de questions et la fiche
      sousModules: true,
      parties: [
        { nom: 'Longueur d\'onde et fréquence', slug: 'lambda', cours: 'module_1a_cours', noms: { cours: 'Cours : longueur d\'onde et fréquence' } },
        { nom: 'Domaines des ondes', slug: 'domaines', cours: 'module_1b_cours', noms: { cours: 'Cours : domaines des ondes électromagnétiques' } },
        { nom: 'Longueur d\'onde et fréquence', questions: 'module_1_questions' }] },
    { n: 2, titre: 'Domaines de fréquences des télécommunications', desc: 'Bandes EHF à BF, placer une onde dans sa bande, portée et débit', fiche: 'fiche_2',
      sousModules: true,
      parties: [
        { nom: 'Bandes de fréquences', slug: 'bandes', cours: 'module_2a_cours', noms: { cours: 'Cours : bandes de fréquences' } },
        { nom: 'Usages, portée et débit', slug: 'portee', cours: 'module_2b_cours', noms: { cours: 'Cours : usages, portée et débit' } },
        { nom: 'Fréquences des télécommunications', questions: 'module_2_questions' }] },
    { n: 3, titre: 'Transposition de fréquence et modulation', desc: 'Modulant, porteuse, signal modulé ; AM et FM ; bande occupée 2 f<sub>h</sub>, bande passante d\'un canal', fiche: 'fiche_3',
      // le simulateur (activité de découverte), deux sous-modules de cours, puis les questions et la fiche
      sousModules: true,
      parties: [
        { nom: 'Simulateur', simulation: 'module_3_simulation', noms: { simulation: 'Simulateur : modulation AM et FM' } },
        { nom: 'Transposition et modulation', slug: 'modulation', cours: 'module_3a_cours', noms: { cours: 'Cours : transposition et modulation' } },
        { nom: 'Spectre et bande passante', slug: 'spectre', cours: 'module_3b_cours', noms: { cours: 'Cours : spectre et bande passante' } },
        { nom: 'Modulation', questions: 'module_3_questions' }] },
    { n: 4, titre: 'Antennes', desc: 'Antenne demi-onde L = λ / 2, quart d\'onde L = λ / 4, antenne bobinée', fiche: 'fiche_4',
      parties: [{ nom: 'Antennes', cours: 'module_4_cours', questions: 'module_4_questions' }] },
    { n: 5, titre: 'Exercices', desc: 'Exercices 9, 10, 11, 12 et 17 du manuel, exercices de bac « Carte RFID » et « Le talkie-walkie »', exercices: 'module_5', exNom: 'Exercices 9 à 17 et bac', nbEx: 7 },
  ];
  window.SOM.init({ nom: 'Chapitre 19 : Ondes électromagnétiques', id: 'ondes-electromagnetiques', cleEx: 'ondes-electromagnetiques-exercices', plan: PLAN });
  const menu = cle => window.SOM.menu(cle);
  const accueil = zone => window.SOM.accueil(zone);
  const marquer = info => window.SOM.marquer(info);

  window.OEM = Object.assign(window.OEM || {}, {
    MOINS, fmt, cs, sci, lire, proche, fr, rac, unite, o, fq, el, secouer, melanger, hasard, entre, champ, boutonValider, PARTIES, versCours,
    question, serie, confettis, fig, monter, outil, cap,
    C, txtF, txtL, diagLambda, diagFreq, DOMAINES, domaine, optionsDomaine, BORNES_DOM, partieDomaine, EM, svgEM, monterEchelle, partieEchelle,
    BANDES, BORNES_BANDES, bande, optionsBande, diagBande, svgBandes, figBandes, USAGES, tirerUsages, partieEtiquettes,
    svgLambda, svgAntenne, svgCarteRFID, svgTalkie,
    PLAN, menu, accueil, marquer,
  });
})();
