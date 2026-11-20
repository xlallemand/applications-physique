/* ============================================================
   ATOME : éléments, configuration électronique, dessins de l'atome
   (outil partagé des applications de 2nde « Atome et ions »,
   « Classification périodique », « Schémas de Lewis »)
   Styles : assets/atome.css (classes atm-). Glisser-déposer : assets/dragdrop.js
   (facultatif : sans lui, la réserve d'électrons se touche seulement).
   Bulle ⓘ de la sous-couche 3d : assets/bulle.js (facultatif).

   ---------- Données ----------
   ATOME.ELEMENTS[Z]   Z = 1 à 20 : { Z, sym, nom, A, famille, ion, liaisons, doubletsNonLiants }
       A                 nombre de nucléons usuel (H 1, He 4, Li 7… Ar 40, K 39, Ca 40)
       famille           'alcalins' (Li, Na, K), 'halogènes' (F, Cl), 'gaz nobles' (He, Ne, Ar), sinon null
       ion               charge de l'ion monoatomique stable (règle du duet ou de l'octet) : +1, +2, −1…
                         (H : +1, l'ion hydrogène H⁺) ; null pour les gaz nobles et la colonne 14 (C, Si)
       liaisons, doubletsNonLiants   H 1/0, C 4/0, N 3/1, O 2/2, F 1/3, Si 4/0, P 3/1, S 2/2, Cl 1/3 ; sinon null
   ATOME.element(Z | 'Na')        l'élément (ou null)
   ATOME.SOUS_COUCHES             ordre de remplissage : 1s, 2s, 2p, 3s, 3p, 4s ({ nom, n, type, max })
                                  (4s : seulement pour K et Ca ; jamais de 3d)

   ---------- Configuration ----------
   ATOME.config(nbElectrons)      → [['1s', 2], ['2s', 2], ['2p', 6], ['3s', 1]] (état fondamental, 0 à 20 électrons)
   ATOME.configHTML(config | nb, { entourer })   1s<sup>2</sup> 2s<sup>2</sup>… ; entourer : la dernière
                                  couche dans un cadre (classe atm-val), comme au tableau
   ATOME.configTexte(config | nb) « 1s2 2s2 2p6 » (pour aria-label : « 1s 2, 2s 2… »)
   ATOME.couche(nom)              numéro de couche d'une sous-couche ('2p' → 2)
   ATOME.derniereCouche(config)   numéro de la dernière couche qui a des électrons (0 si aucun)
   ATOME.valence(config | nb)     électrons de valence : ceux de toute la dernière couche
   ATOME.total(config)            nombre d'électrons d'une configuration
   ATOME.ionStable(Z)             charge de l'ion stable (voir ion ci-dessus)
   ATOME.gazNoble(nb)             gaz noble qui a exactement nb électrons (2, 10, 18) ou null
   ATOME.regle(nb)                'duet' (2 électrons), 'octet' (10 ou 18), sinon null
   ATOME.gazNobles(nb)            { avant, apres } : gaz nobles qui encadrent nb ({ Z, sym, nom, ecart }) ;
                                  ecart > 0 : électrons à gagner, < 0 : à perdre
   ATOME.gazNobleProche(nb)       le plus proche des deux ({ Z, sym, nom, ecart }) ; null à égalité (4 électrons de valence)
   ATOME.formuleIon(sym, q)       'Mg<sup>2+</sup>', 'Cl<sup>−</sup>' (q = 0 : le symbole seul)
   ATOME.exposant(q)              '2+', '−', '' ; ATOME.chargeTexte(q) : '+2e', '−e', '0'
   ATOME.notation(A, Z, sym, q)   écriture conventionnelle ᴬ_Z X (et la charge d'un ion), en HTML
   ATOME.verifierConfig(saisie, nb, opts)  configuration écrite par l'élève ([['1s', 2], …]) comparée à celle
                                  d'une entité de nb électrons → { ok: true } ou { code, diag } ;
                                  codes : vide, double, ordre, saute, max, pasPleine, total ; opts.textes remplace
                                  un ou plusieurs textes (voir TEXTES_CONFIG), opts.texteTotal(total, nb) le dernier
   ATOME.diagValence(config, reponse)  diagnostic d'un nombre d'électrons de valence faux (ou null s'il est juste)
   ATOME.paires(Z, nb)            HTML : protons ⊕ et électrons ⊖ rangés par paires (charges qui se compensent)

   ---------- Dessins ----------
   ATOME.dessin(zones, opts) → { ajouter(cible), retirer(cible), regler({ Z, A, electrons }), etat(), maj(),
                                 entourer(on), options({ entourer… }), prochaine(), dessinCouches, dessinCases }
     zones : un élément (les dessins s'y placent l'un après l'autre) ou { couches, cases } (deux conteneurs)
     opts  :
       Z, A (A usuel par défaut), electrons (0 par défaut)
       mode        'deux' (défaut), 'couches' (cercles seuls) ou 'cases' (cases seules) ; avec { couches, cases }, les deux
       noyau       'detail' (protons ⊕ et neutrons dessinés, défaut) ou 'simple' (disque encre avec le symbole)
       max         nombre maximal d'électrons (défaut : Z, l'atome est neutre ; 18 au plus)
       entourer    'auto' (la dernière couche est entourée quand l'atome est complet), 'toujours' (dès qu'il y a
                   des électrons), 'toucher' (atome complet : l'élève touche la couche externe pour l'entourer), false
       ajout       true : toucher une case ou un cercle y ajoute un électron (refus expliqués)
       retrait     true : glisser un électron hors de l'atome le retire (seulement depuis la couche externe) ;
                   les dessins ne font alors pas défiler la page au doigt (touch-action: none)
       etiquettes  true (défaut) : « n = 1 »… sur les cercles
       alignement  preserveAspectRatio du dessin des cercles (défaut 'xMidYMid meet')
       textes      remplace des textes de refus (voir TEXTES) : { trop, pleine, sautee, couchePleine, troisD,
                   interne, vide, horsCouche, toucherInterne }
       onChange(etat, action)       après chaque ajout ou retrait (action 'ajout' | 'retrait' | 'regler')
       onMessage(html, type)        refus ('refus'), information ('info') ; html vide : effacer
       onEntourer(etat)             la couche externe vient d'être entourée par l'élève (entourer 'toucher')
     cible : nom de sous-couche ('2p'), { couche: n }, ou rien (la place suivante)
     etat() → { Z, A, sym, nom, electrons, config, valence, couche (dernière couche), complet, entoure, charge }
   ATOME.reserve(zone, dessin, opts) → élément : réserve d'électrons à glisser vers une case ou un cercle
                                (toucher la réserve ajoute un électron à la place suivante) ; opts.aria, opts.texte (écrit
                                à côté de l'électron ; sans texte : l'électron seul) ; opts.surToucher() : toucher la
                                réserve n'ajoute rien, cette fonction est appelée à la place (l'électron se pose à la main)
   ATOME.composeur(zone, opts) → { valeur(), fixer(config), bloquer(b), vider(), el }
                                ligne de configuration à composer sans clavier : toucher (ou glisser) les étiquettes
                                1s, 2s… dans l'ordre, puis régler l'exposant de la sous-couche choisie avec − / +
     opts : sousCouches (défaut 1s à 3p), onChange(valeur), aria

   Exemples :
     ATOME.config(11)                       → [['1s',2],['2s',2],['2p',6],['3s',1]]
     ATOME.valence(ATOME.config(16))        → 6
     const d = ATOME.dessin({ couches: zc, cases: zk }, { Z: 11, ajout: true, entourer: 'auto', onChange: maj });
     d.ajouter('2s');                       // refusé si 1s n'est pas pleine (message par onMessage)
     ATOME.dessin(zone, { mode: 'cases', Z: 16, electrons: 16, entourer: 'auto' });   // dessin fixe
   ============================================================ */
(function () {
  'use strict';

  const NS = 'http://www.w3.org/2000/svg';
  const MOINS = '−';

  /* ============================================================
     DONNÉES DES ÉLÉMENTS (Z = 1 à 20)
     ============================================================ */
  const BRUT = [
    // Z, symbole, nom, A, famille, ion, liaisons, doublets non liants
    [1, 'H', 'hydrogène', 1, null, 1, 1, 0],
    [2, 'He', 'hélium', 4, 'gaz nobles', null, null, null],
    [3, 'Li', 'lithium', 7, 'alcalins', 1, null, null],
    [4, 'Be', 'béryllium', 9, null, 2, null, null],
    [5, 'B', 'bore', 11, null, 3, null, null],
    [6, 'C', 'carbone', 12, null, null, 4, 0],
    [7, 'N', 'azote', 14, null, -3, 3, 1],
    [8, 'O', 'oxygène', 16, null, -2, 2, 2],
    [9, 'F', 'fluor', 19, 'halogènes', -1, 1, 3],
    [10, 'Ne', 'néon', 20, 'gaz nobles', null, null, null],
    [11, 'Na', 'sodium', 23, 'alcalins', 1, null, null],
    [12, 'Mg', 'magnésium', 24, null, 2, null, null],
    [13, 'Al', 'aluminium', 27, null, 3, null, null],
    [14, 'Si', 'silicium', 28, null, null, 4, 0],
    [15, 'P', 'phosphore', 31, null, -3, 3, 1],
    [16, 'S', 'soufre', 32, null, -2, 2, 2],
    [17, 'Cl', 'chlore', 35, 'halogènes', -1, 1, 3],
    [18, 'Ar', 'argon', 40, 'gaz nobles', null, null, null],
    [19, 'K', 'potassium', 39, 'alcalins', 1, null, null],
    [20, 'Ca', 'calcium', 40, null, 2, null, null],
  ];
  const ELEMENTS = [null].concat(BRUT.map(([Z, sym, nom, A, famille, ion, liaisons, doubletsNonLiants]) =>
    Object.freeze({ Z, sym, nom, A, famille, ion, liaisons, doubletsNonLiants })));
  function element(x) {
    if (typeof x === 'number') return ELEMENTS[x] || null;
    return ELEMENTS.find(e => e && e.sym === x) || null;
  }

  // sous-couches dans l'ordre de remplissage (jusqu'à 4s pour K et Ca)
  const SOUS_COUCHES = [
    { nom: '1s', n: 1, type: 's', max: 2 }, { nom: '2s', n: 2, type: 's', max: 2 }, { nom: '2p', n: 2, type: 'p', max: 6 },
    { nom: '3s', n: 3, type: 's', max: 2 }, { nom: '3p', n: 3, type: 'p', max: 6 }, { nom: '4s', n: 4, type: 's', max: 2 },
  ];
  const SC = {};
  SOUS_COUCHES.forEach((s, i) => { SC[s.nom] = Object.assign({ i }, s); });
  const ORDRE = SOUS_COUCHES.map(s => s.nom);
  const MAX_TYPE = { s: 2, p: 6, d: 10 };
  const GAZ = [2, 10, 18];

  /* ============================================================
     CONFIGURATION ÉLECTRONIQUE
     ============================================================ */
  function config(nb) {
    const c = [];
    let reste = Math.max(0, Math.min(20, Math.round(nb)));
    for (const s of SOUS_COUCHES) {
      if (!reste) break;
      const k = Math.min(s.max, reste);
      c.push([s.nom, k]);
      reste -= k;
    }
    return c;
  }
  const versConfig = x => (Array.isArray(x) ? x : config(x || 0));
  const couche = nom => parseInt(nom, 10);
  const total = c => versConfig(c).reduce((s, t) => s + t[1], 0);
  function derniereCouche(c) {
    return versConfig(c).reduce((m, t) => (t[1] > 0 ? Math.max(m, couche(t[0])) : m), 0);
  }
  function valence(c) {
    c = versConfig(c);
    const n = derniereCouche(c);
    return c.reduce((s, t) => (couche(t[0]) === n ? s + t[1] : s), 0);
  }
  // configuration écrite : la dernière couche entourée si demandé
  function configHTML(c, opts) {
    c = versConfig(c);
    opts = opts || {};
    if (!c.length) return opts.vide != null ? opts.vide : '<span class="atm-vide">aucun électron</span>';
    const n = derniereCouche(c);
    const terme = t => `<span class="atm-t">${t[0]}<sup>${t[1]}</sup></span>`;
    const avant = c.filter(t => couche(t[0]) !== n).map(terme), ext = c.filter(t => couche(t[0]) === n).map(terme);
    if (!opts.entourer) return avant.concat(ext).join(' ');
    return (avant.length ? avant.join(' ') + ' ' : '') + `<span class="atm-val">${ext.join(' ')}</span>`;
  }
  const configTexte = (c, sep) => versConfig(c).map(t => t[0] + (sep || '') + t[1]).join(sep ? ', ' : ' ');

  const ionStable = Z => (ELEMENTS[Z] ? ELEMENTS[Z].ion : null);
  const gazNoble = nb => (GAZ.indexOf(nb) >= 0 ? ELEMENTS[nb] : null);
  const regle = nb => (nb === 2 ? 'duet' : nb === 10 || nb === 18 ? 'octet' : null);
  function gazNobles(nb) {
    const fiche = z => (z ? { Z: z, sym: ELEMENTS[z].sym, nom: ELEMENTS[z].nom, ecart: z - nb } : null);
    const avant = GAZ.filter(z => z <= nb).pop() || null;
    const apres = GAZ.find(z => z >= nb) || null;
    return { avant: fiche(avant), apres: fiche(apres) };
  }
  function gazNobleProche(nb) {
    const g = gazNobles(nb);
    if (!g.avant) return g.apres;
    if (!g.apres) return g.avant;
    const a = Math.abs(g.avant.ecart), b = Math.abs(g.apres.ecart);
    return a < b ? g.avant : b < a ? g.apres : null;
  }

  // charge écrite en exposant : 2+, −, 3− ; et en multiple de e : +2e, −e
  const exposant = q => (!q ? '' : (Math.abs(q) > 1 ? Math.abs(q) : '') + (q > 0 ? '+' : MOINS));
  const formuleIon = (sym, q) => (q ? `${sym}<sup>${exposant(q)}</sup>` : sym);
  const chargeTexte = q => (!q ? '0' : (q > 0 ? '+' : MOINS) + (Math.abs(q) > 1 ? Math.abs(q) : '') + 'e');
  // écriture conventionnelle du noyau (A en haut, Z en bas, à gauche du symbole)
  function notation(A, Z, sym, q) {
    return `<span class="atm-nota"><span class="atm-nota-az"><span>${A}</span><span>${Z}</span></span><span class="atm-nota-x">${sym}</span>${q ? `<span class="atm-nota-q">${exposant(q)}</span>` : ''}</span>`;
  }

  /* ---------- Vérification d'une configuration écrite par l'élève ---------- */
  const TEXTES_CONFIG = {
    vide: () => 'Place au moins une sous-couche.',
    double: nom => `La sous-couche ${nom} est écrite deux fois.`,
    ordre: (a, b) => `Les sous-couches se remplissent dans l'ordre : 1s, 2s, 2p, 3s, 3p. Ici, ${a} est écrite avant ${b}.`,
    saute: nom => `Tu as sauté ${nom} : les sous-couches se remplissent dans l'ordre 1s, 2s, 2p, 3s, 3p, sans en sauter.`,
    max: (nom, k) => `${nom}<sup>${k}</sup> est impossible : une sous-couche ${SC[nom].type} contient au plus ${SC[nom].max} électrons (${SC[nom].type === 's' ? 'p : 6' : 's : 2'}).`,
    pasPleine: (nom, k) => `${nom}<sup>${k}</sup> n'est pas pleine : on ne passe à la sous-couche suivante que quand ${nom} contient ${SC[nom].max} électrons.`,
    total: (t, nb) => `Ta configuration contient ${t} électron${t > 1 ? 's' : ''} ; il en faut ${nb}.`,
  };
  function verifierConfig(saisie, nb, opts) {
    opts = opts || {};
    const T = Object.assign({}, TEXTES_CONFIG, opts.textes || {});
    const s = (saisie || []).filter(t => t && t[0]);
    if (!s.length) return { code: 'vide', diag: T.vide() };
    const vus = {};
    for (const t of s) { if (vus[t[0]]) return { code: 'double', diag: T.double(t[0]) }; vus[t[0]] = true; }
    // ordre de remplissage
    for (let i = 1; i < s.length; i++) {
      if (SC[s[i][0]].i < SC[s[i - 1][0]].i) return { code: 'ordre', diag: T.ordre(s[i - 1][0], s[i][0]) };
    }
    // sous-couche sautée
    const der = SC[s[s.length - 1][0]].i;
    for (let i = 0; i <= der; i++) if (!vus[ORDRE[i]]) return { code: 'saute', diag: T.saute(ORDRE[i]) };
    // nombre maximal dépassé
    for (const t of s) if (t[1] > SC[t[0]].max) return { code: 'max', diag: T.max(t[0], t[1]) };
    // sous-couche pas pleine suivie d'une autre
    for (let i = 0; i < s.length - 1; i++) if (s[i][1] < SC[s[i][0]].max) return { code: 'pasPleine', diag: T.pasPleine(s[i][0], s[i][1]) };
    const t = total(s);
    if (t !== nb) return { code: 'total', diag: opts.texteTotal ? opts.texteTotal(t, nb) : T.total(t, nb) };
    return { ok: true };
  }
  // électrons de valence : diagnostic d'une réponse fausse
  function diagValence(c, rep) {
    c = versConfig(c);
    const v = valence(c), n = derniereCouche(c), der = c[c.length - 1];
    if (rep === v) return null;
    const ext = c.filter(t => couche(t[0]) === n);
    if (ext.length > 1 && rep === der[1]) {
      return `Les électrons de valence sont ceux de toute la dernière couche : ${ext.map(t => t[0]).join(' et ')}, soit ${ext.map(t => t[1]).join(' + ')} = ${v}.`;
    }
    if (rep === total(c)) return `Ce sont tous les électrons de l'atome. Seuls ceux de la dernière couche (n = ${n}) sont des électrons de valence : ${v}.`;
    const avant = c.filter(t => couche(t[0]) === n - 1);
    if (avant.length && rep === avant.reduce((s, t) => s + t[1], 0)) return `Tu as compté la couche n = ${n - 1}. La dernière couche qui a des électrons est la couche n = ${n}.`;
    return `Compte les électrons de la dernière couche qui a des électrons (n = ${n}).`;
  }
  // charges qui se compensent : une colonne par paire ⊕ / ⊖, les charges sans partenaire en évidence
  function paires(Z, nb) {
    const m = Math.max(Z, nb);
    let h = '';
    for (let i = 0; i < m; i++) {
      const p = i < Z, e = i < nb, seul = p !== e;
      h += `<span class="atm-paire${seul ? ' atm-seul' : ''}">${p ? '<span class="atm-pp">+</span>' : '<span class="atm-trou"></span>'}${e ? '<span class="atm-pe">−</span>' : '<span class="atm-trou"></span>'}</span>`;
    }
    return `<span class="atm-paires" role="img" aria-label="${Z} charges positives (protons) et ${nb} charges négatives (électrons)">${h}</span>`;
  }

  /* ============================================================
     DESSINS
     ============================================================ */
  // textes des refus (remplaçables par opts.textes)
  const TEXTES = {
    trop: () => 'L\'atome a autant d\'électrons que de protons : il ne peut pas en recevoir un de plus.',
    pleine: nom => `La sous-couche ${nom} est pleine : une sous-couche ${SC[nom].type} contient au plus ${SC[nom].max} électrons (${SC[nom].type === 's' ? 'p : 6' : 's : 2'}).`,
    sautee: nom => `Les sous-couches se remplissent dans l'ordre : 1s, 2s, 2p, 3s, 3p. Remplis d'abord ${nom}.`,
    couchePleine: n => (n === 1 ? 'La couche n = 1 est pleine : elle contient au plus 2 électrons (1s<sup>2</sup>).'
      : `La couche n = ${n} est pleine : ${n}s et ${n}p contiennent au plus 2 + 6 = 8 électrons.`),
    troisD: () => 'Pour les 18 premiers éléments, la sous-couche 3d reste vide.',
    plein18: () => 'La sous-couche 3p est pleine : on s\'arrête à 18 électrons (la sous-couche 3d reste vide).',
    interne: () => 'On retire les électrons de la couche externe.',
    vide: () => 'Il n\'y a plus d\'électron à retirer.',
    toucherInterne: (n, ext) => `La couche n = ${n} n'est pas la dernière couche qui a des électrons : c'est la couche n = ${ext}.`,
  };

  // géométrie des cercles (unités du dessin, centre en 0)
  const R = [0, 100, 145, 190];       // rayons des couches n = 1, 2, 3
  const ER = 11;                      // rayon d'un électron sur un cercle (petit : les couches restent bien visibles)
  const RN = 10, PAS_N = 11.2;        // rayon d'un nucléon, pas de la spirale du noyau
  // places des électrons sur chaque couche (angles en degrés, 0 à droite, −90 en haut)
  const PLACES = {
    1: [180, 0],
    2: [-90, 90, 0, 180, -45, 135, 45, -135],
    3: [-67.5, 112.5, 22.5, -157.5, -22.5, 157.5, 67.5, -112.5],
  };
  const ANGLE_NOM = { 1: 90, 2: 112.5, 3: 90 };   // place du nom « n = … » sur chaque cercle (sans électron)
  // géométrie des cases (une ligne, regroupées par couche, flèche « Énergie » dessous)
  const KS = { s: 48, p: 78, d: 50 }, KH = 60, KY = 24, KG = 5, KGG = 16, KM = 6;
  const CASES = (() => {
    const l = [];
    let x = KM;
    [['1s'], ['2s', '2p'], ['3s', '3p', '3d']].forEach((g, i) => {
      if (i) x += KGG;
      g.forEach((nom, j) => {
        if (j) x += KG;
        const type = nom[1];
        l.push({ nom, n: couche(nom), type, x, l: KS[type], max: MAX_TYPE[type], d: type === 'd' });
        x += KS[type];
      });
    });
    return l;
  })();
  const KW = CASES[CASES.length - 1].x + CASES[CASES.length - 1].l + KM;   // largeur du dessin des cases
  const KHT = 140;                                                         // hauteur

  function svgEl(tag, attrs, parent) {
    const e = document.createElementNS(NS, tag);
    if (attrs) for (const k in attrs) if (attrs[k] != null) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  const r1 = v => Math.round(v * 10) / 10;
  // un électron : disque d'accent et signe −
  function electron(parent, x, y, r, cls) {
    const g = svgEl('g', { class: 'atm-e' + (cls ? ' ' + cls : ''), transform: `translate(${r1(x)} ${r1(y)})` }, parent);
    svgEl('circle', { r }, g);
    svgEl('line', { x1: -r * 0.45, y1: 0, x2: r * 0.45, y2: 0, class: 'atm-e-signe', 'stroke-width': Math.max(1.6, r * 0.2) }, g);
    return g;
  }
  const reduit = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

  function dessin(zones, opts) {
    opts = Object.assign({ mode: 'deux', noyau: 'detail', electrons: 0, entourer: 'auto', etiquettes: true }, opts || {});
    const T = Object.assign({}, TEXTES, opts.textes || {});
    const st = { Z: opts.Z || 1, A: null, n: 0, entoure: false };
    st.A = opts.A || ELEMENTS[st.Z].A;
    const max = () => Math.min(18, opts.max != null ? (typeof opts.max === 'function' ? opts.max(st.Z) : opts.max) : st.Z);
    st.n = Math.max(0, Math.min(max(), opts.electrons || 0));

    // conteneurs
    let zC = null, zK = null;
    if (zones && !(zones instanceof Element)) { zC = zones.couches || null; zK = zones.cases || null; }
    else {
      if (opts.mode !== 'cases') { zC = document.createElement('div'); zones.appendChild(zC); }
      if (opts.mode !== 'couches') { zK = document.createElement('div'); zones.appendChild(zK); }
    }

    /* ----- Cercles des couches et noyau ----- */
    let svgC = null, gNoyau, gElec, gAnneau, gCibleC;
    if (zC) {
      zC.classList.add('atm-couches', 'atm-zone');
      svgC = svgEl('svg', { viewBox: '-212 -212 424 424', class: 'atm-svg atm-svg-couches', role: 'img', preserveAspectRatio: opts.alignement || 'xMidYMid meet' }, zC);
      const gFond = svgEl('g', null, svgC);
      for (let n = 3; n >= 1; n--) {
        svgEl('circle', { r: R[n], class: 'atm-couche' }, gFond);
        if (opts.etiquettes) {
          // nom posé sur le cercle, entre deux places d'électrons (fond blanc qui coupe le pointillé)
          const a = ANGLE_NOM[n] * Math.PI / 180;
          svgEl('text', { x: r1(R[n] * Math.cos(a)), y: r1(R[n] * Math.sin(a) + 6), class: 'atm-couche-nom', 'text-anchor': 'middle' }, gFond).textContent = `n = ${n}`;
        }
      }
      // zones à toucher : un anneau large et transparent par couche (sous les électrons, qui se touchent aussi)
      gCibleC = svgEl('g', null, svgC);
      for (let n = 1; n <= 3; n++) svgEl('circle', { r: R[n], class: 'atm-cible atm-cible-c', 'data-couche': n }, gCibleC);
      gAnneau = svgEl('g', { class: 'atm-inerte' }, svgC);
      gNoyau = svgEl('g', { class: 'atm-noyau atm-inerte' }, svgC);
      gElec = svgEl('g', null, svgC);
    }

    /* ----- Cases des sous-couches ----- */
    let svgK = null, gK, gKe, gKv, gKc, info3d = null;
    if (zK) {
      zK.classList.add('atm-cases', 'atm-zone');
      const boite = document.createElement('div');
      boite.className = 'atm-cases-in';
      zK.appendChild(boite);
      svgK = svgEl('svg', { viewBox: `0 0 ${KW} ${KHT}`, class: 'atm-svg atm-svg-cases', role: 'img' }, boite);
      gK = svgEl('g', null, svgK);
      // noms des couches au-dessus des groupes
      [1, 2, 3].forEach(n => {
        const cs = CASES.filter(c => c.n === n && !c.d);
        const x0 = cs[0].x, x1 = cs[cs.length - 1].x + cs[cs.length - 1].l;
        svgEl('text', { x: (x0 + x1) / 2, y: 16, class: 'atm-k-couche', 'text-anchor': 'middle' }, gK).textContent = `n = ${n}`;
      });
      CASES.forEach(c => {
        svgEl('rect', { x: c.x, y: KY, width: c.l, height: KH, rx: 9, class: 'atm-case' + (c.d ? ' atm-case-d' : '') }, gK);
        svgEl('text', { x: c.x + c.l / 2, y: KY + 16, class: 'atm-case-nom', 'text-anchor': 'middle' }, gK).textContent = c.nom;
      });
      // flèche « Énergie »
      const ya = KY + KH + 31;
      svgEl('line', { x1: KM, y1: ya, x2: KW - KM - 6, y2: ya, class: 'atm-fleche' }, gK);
      svgEl('path', { d: `M${KW - KM} ${ya} l-11 -5 v10 z`, class: 'atm-fleche-pointe' }, gK);
      svgEl('text', { x: KW - KM, y: ya + 19, class: 'atm-k-couche', 'text-anchor': 'end' }, gK).textContent = 'Énergie';
      // zones à toucher (un peu plus grandes que les cases), sous les électrons
      const gCibleK = svgEl('g', null, svgK);
      CASES.forEach(c => svgEl('rect', { x: c.x - 2, y: KY - 6, width: c.l + 4, height: KH + 28, class: 'atm-cible atm-cible-k', 'data-sc': c.nom }, gCibleK));
      gKv = svgEl('g', { class: 'atm-inerte' }, svgK);
      gKc = svgEl('g', { class: 'atm-inerte' }, svgK);
      gKe = svgEl('g', null, svgK);
      // bulle ⓘ sur la case 3d (grisée)
      const c3 = CASES.find(c => c.d);
      info3d = document.createElement('span');
      info3d.className = 'atm-info3d atm-cible';
      info3d.dataset.sc = '3d';
      info3d.style.left = (100 * (c3.x + c3.l / 2) / KW) + '%';
      info3d.style.top = (100 * (KY + KH / 2 + 6) / KHT) + '%';
      info3d.innerHTML = window.BULLE ? BULLE.info(T.troisD(), 'Sous-couche 3d') : '';
      boite.appendChild(info3d);
    }

    /* ----- Dessin de l'état ----- */
    function noyau() {
      if (!svgC) return;
      while (gNoyau.firstChild) gNoyau.removeChild(gNoyau.firstChild);
      const el = ELEMENTS[st.Z];
      if (opts.noyau === 'simple') {
        svgEl('circle', { r: 30, class: 'atm-noyau-simple' }, gNoyau);
        svgEl('text', { x: 0, y: 8, class: 'atm-noyau-sym', 'text-anchor': 'middle' }, gNoyau).textContent = el.sym;
        return;
      }
      const N = st.A, Z = st.Z;
      const rmax = PAS_N * Math.sqrt(N) + RN;
      svgEl('circle', { r: r1(rmax + 5), class: 'atm-noyau-fond' }, gNoyau);
      for (let k = 0; k < N; k++) {
        const r = PAS_N * Math.sqrt(k + 0.5) * (N === 1 ? 0 : 1), a = k * 137.508 * Math.PI / 180;
        const x = r * Math.cos(a), y = r * Math.sin(a);
        const proton = Math.floor((k + 1) * Z / N) > Math.floor(k * Z / N);
        const g = svgEl('g', { class: proton ? 'atm-proton' : 'atm-neutron', transform: `translate(${r1(x)} ${r1(y)})` }, gNoyau);
        svgEl('circle', { r: RN }, g);
        if (proton) {
          svgEl('line', { x1: -5, y1: 0, x2: 5, y2: 0, class: 'atm-p-signe' }, g);
          svgEl('line', { x1: 0, y1: -5, x2: 0, y2: 5, class: 'atm-p-signe' }, g);
        }
      }
    }
    // électrons par couche (cercles) et par sous-couche (cases)
    function parCouche() {
      const c = config(st.n), k = { 1: 0, 2: 0, 3: 0 };
      c.forEach(t => { k[couche(t[0])] += t[1]; });
      return k;
    }
    let dernierAjout = null;
    function maj() {
      const c = config(st.n), ext = derniereCouche(c);
      const montrer = estEntoure();
      // cercles
      if (svgC) {
        while (gElec.firstChild) gElec.removeChild(gElec.firstChild);
        while (gAnneau.firstChild) gAnneau.removeChild(gAnneau.firstChild);
        const k = parCouche();
        let rang = 0;
        for (let n = 1; n <= 3; n++) {
          for (let i = 0; i < k[n]; i++) {
            rang++;
            const a = PLACES[n][i] * Math.PI / 180;
            const g = electron(gElec, R[n] * Math.cos(a), R[n] * Math.sin(a), ER, 'atm-cible' + (opts.retrait ? ' atm-e-mobile' : ''));
            g.dataset.couche = n;
            if (rang === dernierAjout && !reduit()) g.classList.add('atm-e-nouveau');
          }
        }
        if (montrer && ext) {
          // la couche externe entourée : un anneau autour de ses électrons
          const ri = R[ext] - ER - 3, re = R[ext] + ER + 3;          // anneau fin, juste autour des électrons
          svgEl('path', { d: `M${re} 0 A${re} ${re} 0 1 0 ${-re} 0 A${re} ${re} 0 1 0 ${re} 0 Z M${ri} 0 A${ri} ${ri} 0 1 1 ${-ri} 0 A${ri} ${ri} 0 1 1 ${ri} 0 Z`, class: 'atm-anneau-fond', 'fill-rule': 'evenodd' }, gAnneau);
          svgEl('circle', { r: ri, class: 'atm-anneau' }, gAnneau);
          svgEl('circle', { r: re, class: 'atm-anneau' }, gAnneau);
        }
        svgC.setAttribute('aria-label', `Modèle de l'atome : noyau de ${st.Z} proton${st.Z > 1 ? 's' : ''} et ${st.A - st.Z} neutron${st.A - st.Z > 1 ? 's' : ''}, ${st.n} électron${st.n > 1 ? 's' : ''} sur les couches`
          + (st.n ? ` (${[1, 2, 3].map(n => `couche n = ${n} : ${parCouche()[n]}`).join(', ')})` : ''));
      }
      // cases
      if (svgK) {
        [gKe, gKv, gKc].forEach(g => { while (g.firstChild) g.removeChild(g.firstChild); });
        const nb = {};
        c.forEach(t => { nb[t[0]] = t[1]; });
        let rang = 0;
        CASES.forEach(cs => {
          const k = nb[cs.nom] || 0, cx = cs.x + cs.l / 2;
          if (!cs.d) svgEl('text', { x: cx, y: KY + KH + 17, class: 'atm-case-nb' + (k ? '' : ' atm-case-nb0'), 'text-anchor': 'middle' }, gKc).textContent = String(k);
          for (let i = 0; i < k; i++) {
            rang++;
            let x, y;
            if (cs.type === 's') { x = cx + (i ? 11 : -11); y = KY + 41; }
            else { x = cx + ((i % 3) - 1) * 22; y = KY + (i < 3 ? 33 : 50); }
            const g = electron(gKe, x, y, 7.5, 'atm-cible' + (opts.retrait ? ' atm-e-mobile' : ''));
            g.dataset.couche = cs.n;
            g.dataset.sc = cs.nom;
            if (rang === dernierAjout && !reduit()) g.classList.add('atm-e-nouveau');
          }
        });
        if (montrer && ext) {
          const cs = CASES.filter(x => x.n === ext && !x.d);
          const x0 = cs[0].x - 5, x1 = cs[cs.length - 1].x + cs[cs.length - 1].l + 5;
          svgEl('rect', { x: x0, y: KY - 5, width: x1 - x0, height: KH + 10, rx: 13, class: 'atm-anneau' }, gKv);
        }
        svgK.setAttribute('aria-label', `Cases des sous-couches : ${st.n ? configTexte(c, ' ') : 'vides'}`);
      }
      dernierAjout = null;
    }
    function estEntoure() {
      if (!st.n || opts.entourer === false) return false;
      if (opts.entourer === 'toujours') return true;
      if (opts.entourer === 'auto') return st.n === st.Z;
      if (opts.entourer === 'toucher') return st.entoure && st.n === st.Z;
      return false;
    }

    /* ----- État ----- */
    function etat() {
      const c = config(st.n), el = ELEMENTS[st.Z];
      return { Z: st.Z, A: st.A, sym: el.sym, nom: el.nom, electrons: st.n, config: c, valence: valence(c),
        couche: derniereCouche(c), complet: st.n === st.Z, entoure: estEntoure(), charge: st.Z - st.n };
    }
    const message = (h, type) => { if (opts.onMessage) opts.onMessage(h, type); };
    const change = action => { maj(); if (opts.onChange) opts.onChange(etat(), action); };

    /* ----- Ajouter un électron (avec les refus) ----- */
    function prochaine() {
      const c = config(st.n);
      const s = SOUS_COUCHES.find(x => { const t = c.find(y => y[0] === x.nom); return !t || t[1] < x.max; });
      return s ? s.nom : null;
    }
    function ajouter(cible) {
      if (cible === '3d') { message(T.troisD(), 'refus'); return false; }
      // atome complet, entourer au toucher : l'élève désigne la couche externe
      if (opts.entourer === 'toucher' && st.n === st.Z && st.n > 0 && cible != null && !st.entoure) return toucherCouche(cible);
      if (st.n >= max()) { message(st.n >= 18 ? T.plein18() : T.trop(st.Z), 'refus'); return false; }
      const p = prochaine();
      if (cible != null && typeof cible === 'object') {
        const n = cible.couche;
        if (couche(p) < n) { message(T.sautee(p), 'refus'); return false; }
        if (couche(p) > n) { message(T.couchePleine(n), 'refus'); return false; }
      } else if (typeof cible === 'string') {
        const t = config(st.n).find(y => y[0] === cible);
        if (t && t[1] >= SC[cible].max) { message(T.pleine(cible), 'refus'); return false; }
        if (cible !== p) { message(T.sautee(p), 'refus'); return false; }
      }
      st.n++;
      dernierAjout = st.n;
      message('', 'info');
      change('ajout');
      return true;
    }
    /* ----- Retirer un électron (toujours le dernier placé, depuis la couche externe) ----- */
    function retirer(cible) {
      if (!st.n) { message(T.vide(), 'refus'); return false; }
      const ext = derniereCouche(config(st.n));
      const n = cible == null ? ext : typeof cible === 'object' ? cible.couche : couche(cible);
      if (n < ext) { message(T.interne(), 'refus'); return false; }
      st.n--;
      st.entoure = false;
      message('', 'info');
      change('retrait');
      return true;
    }
    // entourer au toucher : la couche touchée est-elle la couche externe ?
    function toucherCouche(cible) {
      const n = typeof cible === 'object' ? cible.couche : couche(cible);
      const ext = derniereCouche(config(st.n));
      if (n !== ext) { message(T.toucherInterne(n, ext), 'refus'); return false; }
      st.entoure = true;
      message('', 'info');
      maj();
      if (opts.onEntourer) opts.onEntourer(etat());
      return true;
    }
    function regler(o) {
      if (o.Z != null) { st.Z = Math.max(1, Math.min(18, o.Z)); st.A = o.A || ELEMENTS[st.Z].A; }
      else if (o.A != null) st.A = o.A;
      if (o.electrons != null) st.n = o.electrons;
      st.n = Math.max(0, Math.min(max(), st.n));
      st.entoure = false;
      noyau();
      message('', 'info');
      change('regler');
    }

    /* ----- Toucher une case ou un cercle ----- */
    function cibleDe(e) {
      if (!e) return null;
      if (e.dataset.sc) return e.dataset.sc;
      if (e.dataset.couche) return { couche: +e.dataset.couche };
      return null;
    }
    [svgC, svgK].forEach(svg => {
      if (!svg) return;
      svg.addEventListener('click', ev => {
        if (glisse) return;
        const c = ev.target.closest && ev.target.closest('.atm-cible');
        if (!c) return;
        if (opts.ajout || (opts.entourer === 'toucher' && st.n === st.Z && st.n > 0)) ajouter(cibleDe(c));
      });
    });

    /* ----- Glisser un électron hors de l'atome pour le retirer ----- */
    // (au doigt, le geste ne doit pas faire défiler la page : touch-action none sur les dessins)
    let glisse = false;
    if (opts.retrait) {
      [svgC, svgK].forEach(svg => { if (svg) svg.style.touchAction = 'none'; });
      [svgC, svgK].forEach(svg => {
        if (!svg) return;
        svg.addEventListener('pointerdown', ev => {
          const g = ev.target.closest && ev.target.closest('.atm-e');
          if (!g || (ev.pointerType === 'mouse' && ev.button !== 0)) return;
          ev.preventDefault();
          const n = g.dataset.sc ? { couche: couche(g.dataset.sc) } : { couche: +g.dataset.couche }, x0 = ev.clientX, y0 = ev.clientY, id = ev.pointerId;
          let fantome = null;
          try { svg.setPointerCapture(id); } catch (e) { /* rien */ }
          function bouger(e) {
            if (e.pointerId !== id) return;
            if (!fantome && Math.hypot(e.clientX - x0, e.clientY - y0) > 6) {
              fantome = document.createElement('div');
              fantome.className = 'atm-fantome';
              fantome.textContent = MOINS;
              document.body.appendChild(fantome);
              g.classList.add('atm-e-pris');
              glisse = true;
            }
            if (fantome) { fantome.style.left = e.clientX + 'px'; fantome.style.top = e.clientY + 'px'; }
          }
          function finir(e) {
            if (e.pointerId !== id) return;
            svg.removeEventListener('pointermove', bouger);
            svg.removeEventListener('pointerup', finir);
            svg.removeEventListener('pointercancel', finir);
            if (fantome) {
              fantome.remove();
              g.classList.remove('atm-e-pris');
              // déposé hors des dessins de l'atome : l'électron est retiré
              const sous = e.type === 'pointerup' ? document.elementFromPoint(e.clientX, e.clientY) : null;
              const dedans = sous && sous.closest('.atm-zone') && (sous.closest('.atm-zone') === zC || sous.closest('.atm-zone') === zK);
              if (e.type === 'pointerup' && !dedans) retirer(n);
              setTimeout(() => { glisse = false; }, 0);
            }
          }
          svg.addEventListener('pointermove', bouger);
          svg.addEventListener('pointerup', finir);
          svg.addEventListener('pointercancel', finir);
        });
      });
    }

    noyau();
    maj();
    return {
      ajouter, retirer, regler, etat, maj, prochaine,
      entourer(on) { st.entoure = !!on; maj(); },
      options(o) { Object.assign(opts, o || {}); st.entoure = false; maj(); },
      dessinCouches: svgC, dessinCases: svgK, zones: { couches: zC, cases: zK },
    };
  }

  /* ---------- Réserve d'électrons à glisser vers une case ou un cercle ---------- */
  function reserve(zone, d, opts) {
    opts = opts || {};
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'atm-reserve';
    b.setAttribute('aria-label', opts.aria || 'Réserve d\'électrons : glisser un électron vers une case ou un cercle, ou toucher pour en ajouter un');
    b.innerHTML = `<span class="atm-reserve-e" aria-hidden="true">${MOINS}</span>${opts.texte ? `<span class="atm-reserve-t">${opts.texte}</span>` : ''}`;
    zone.appendChild(b);
    if (window.DragDrop) {
      DragDrop.enable(b, {
        zoneSelector: '.atm-cible',
        dragOverClass: 'atm-survol',
        fantome: () => b.querySelector('.atm-reserve-e'),          // on déplace un électron, pas toute la réserve
        onDrop(item, z, ev) {
          if (z) { d.ajouter(z.dataset.sc ? z.dataset.sc : { couche: +z.dataset.couche }); return; }
          // simple appui (relâché sur la réserve) : un électron à la place suivante
          const r = b.getBoundingClientRect();
          if (ev && ev.clientX >= r.left && ev.clientX <= r.right && ev.clientY >= r.top && ev.clientY <= r.bottom) toucher();
        },
      });
    } else b.addEventListener('click', toucher);
    // simple appui : un électron à la place suivante, ou la fonction donnée (l'électron se pose alors à la main)
    function toucher() { if (opts.surToucher) opts.surToucher(); else d.ajouter(); }
    return b;
  }

  /* ---------- Composer une configuration sans clavier ---------- */
  function composeur(zone, opts) {
    opts = opts || {};
    const noms = opts.sousCouches || ['1s', '2s', '2p', '3s', '3p'];
    const st = { termes: [], choisi: -1, bloque: false };
    const box = document.createElement('div');
    box.className = 'atm-comp';
    box.innerHTML = `<div class="atm-comp-ligne" role="group" aria-label="${opts.aria || 'Ta configuration électronique'}"></div>
      <div class="atm-comp-reglage" hidden><span class="atm-comp-sel"></span>
        <button type="button" class="btn-secondary atm-comp-pm" data-d="-1" aria-label="Un électron de moins">${MOINS}</button>
        <button type="button" class="btn-secondary atm-comp-pm" data-d="1" aria-label="Un électron de plus">+</button>
        <button type="button" class="btn-small atm-comp-x">Retirer</button></div>
      <div class="atm-comp-palette" role="group" aria-label="Sous-couches à placer">${noms.map(n => `<button type="button" class="btn-secondary atm-comp-et" data-n="${n}">${n}</button>`).join('')}</div>`;
    zone.appendChild(box);
    const ligne = box.querySelector('.atm-comp-ligne'), reglage = box.querySelector('.atm-comp-reglage');
    function dessiner() {
      ligne.innerHTML = st.termes.length ? st.termes.map((t, i) => `<button type="button" class="atm-comp-t${i === st.choisi ? ' atm-choisi' : ''}" data-i="${i}" aria-label="${t[0]} : ${t[1]} électron${t[1] > 1 ? 's' : ''}${i === st.choisi ? ', choisie' : ''}">${t[0]}<sup>${t[1]}</sup></button>`).join('')
        : '<span class="atm-comp-vide">Touche les sous-couches dans l\'ordre</span>';
      const t = st.termes[st.choisi];
      reglage.hidden = !t || st.bloque;
      if (t) reglage.querySelector('.atm-comp-sel').innerHTML = `${t[0]}<sup>${t[1]}</sup>`;
      box.querySelectorAll('.atm-comp-et').forEach(b => { b.disabled = st.bloque || st.termes.some(x => x[0] === b.dataset.n); });
      ligne.querySelectorAll('.atm-comp-t').forEach(b => { b.disabled = st.bloque; });
      if (opts.onChange) opts.onChange(valeur());
    }
    function placer(n) {
      if (st.bloque || st.termes.some(x => x[0] === n)) return;
      st.termes.push([n, 1]);
      st.choisi = st.termes.length - 1;
      dessiner();
    }
    box.querySelectorAll('.atm-comp-et').forEach(b => {
      if (window.DragDrop) {
        DragDrop.enable(b, {
          zoneSelector: '.atm-comp-ligne',
          dragOverClass: 'atm-survol',
          onDrop(item, z, ev) {
            if (z === ligne) { placer(b.dataset.n); return; }
            const r = b.getBoundingClientRect();
            if (ev && ev.clientX >= r.left && ev.clientX <= r.right && ev.clientY >= r.top && ev.clientY <= r.bottom) placer(b.dataset.n);
          },
        });
      } else b.addEventListener('click', () => placer(b.dataset.n));
    });
    ligne.addEventListener('click', ev => {
      const b = ev.target.closest('.atm-comp-t');
      if (!b || st.bloque) return;
      st.choisi = +b.dataset.i;
      dessiner();
    });
    reglage.querySelectorAll('.atm-comp-pm').forEach(b => {
      b.addEventListener('click', () => {
        const t = st.termes[st.choisi];
        if (!t || st.bloque) return;
        t[1] = Math.max(1, Math.min(9, t[1] + +b.dataset.d));
        dessiner();
      });
    });
    reglage.querySelector('.atm-comp-x').addEventListener('click', () => {
      if (st.bloque || st.choisi < 0) return;
      st.termes.splice(st.choisi, 1);
      st.choisi = st.termes.length - 1;
      dessiner();
    });
    const valeur = () => st.termes.map(t => [t[0], t[1]]);
    dessiner();
    return {
      el: box, valeur,
      fixer(c) { st.termes = versConfig(c).map(t => [t[0], t[1]]); st.choisi = -1; dessiner(); },
      bloquer(b) { st.bloque = !!b; if (b) st.choisi = -1; dessiner(); },
      vider() { st.termes = []; st.choisi = -1; dessiner(); },
    };
  }

  window.ATOME = {
    ELEMENTS, element, SOUS_COUCHES, ORDRE,
    config, configHTML, configTexte, couche, derniereCouche, valence, total,
    ionStable, gazNoble, regle, gazNobles, gazNobleProche, exposant, formuleIon, chargeTexte, notation,
    TEXTES, TEXTES_CONFIG, verifierConfig, diagValence, paires,
    dessin, reserve, composeur,
  };
})();
