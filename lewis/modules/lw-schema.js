/* ============================================================
   Schémas de Lewis : données des molécules, dessin SVG, comptage
   (application « Schémas de Lewis » ; à charger après lw.js et assets/atome.js ;
   comparaison de molécules : ORGA.meme de assets/orga.js)

   Molécule : { id, f (formule HTML), nom, atomes: [{ el, x, y, d }], liaisons: [{ a, b, o }] }
     x, y : position (unités de liaison, y vers le bas) ; d : doublets non liants dessinés
     (ceux de l'élément par défaut, imposés dans un schéma faux ou incomplet) ; o : 1, 2 ou 3.
     Tous les atomes sont écrits, H compris.

   LW.MOL                         molécules (par identifiant) ; LW.molecule(id) : une copie
   LW.info(el)                    { Z, valence (électrons de valence), liaisons, doublets, regle (2 ou 8) }
   LW.analyse(mol)                par atome : { el, l (doublets liants), d, e (électrons autour), regle, ok, bon }
   LW.diagAtome(mol, i)           diagnostic d'un atome (null s'il est juste)
   LW.raisons(mol)                expressions à piocher pour conclure (vraies et fausses, avec leur diagnostic)
   LW.fausser(mol, type)          variante fausse : 'moinsDoublet', 'plusDoublet', 'double', 'hDouble', 'manqueH'
   LW.versOrga(mol, implicite)    molécule ORGA (H écrits, ou H implicites pour le rendu semi-développé)
   LW.meme(m1, m2)                même molécule (ORGA.meme), quel que soit le dessin
   LW.connexe(mol)                tous les atomes forment une seule molécule
   LW.ligneAtome(el)              ligne du tableau des atomes : { v (valence), g (à gagner), l (liaisons), d (doublets) }
   LW.diagLigne(el, x, mode)      diagnostic d'une ligne fausse (mode 'position' : élément donné par sa place)
   LW.bilanJuste(mol)             phrase de bilan d'un schéma juste
   LW.ajuster(mol, W, H, o)       positions en px pour un dessin de W × H : { pos, f }
   LW.rendu(etat, o)              code SVG d'un état (positions en px) et géométrie des cibles :
                                  { html, geo: { stubs, doublets, liaisons, atomes } }
     etat : { atomes: [{ el, x, y, d, libres, inconnu }], liaisons } ; o : { f, choisi, marques (Set),
            etiquettes ([texte]), stubChoisi ({ i, k }), provisoire ({ x1, y1, x2, y2 }), cache (dispositions) }
   ============================================================ */
(function () {
  'use strict';
  const LW = window.LW;
  const n360 = a => ((a % 360) + 360) % 360;
  const ecart = (a, b) => { const d = Math.abs(n360(a - b)); return d > 180 ? 360 - d : d; };
  const RAD = Math.PI / 180;
  const pl = (k, mot) => `${k} ${mot}${k > 1 ? 's' : ''}`;

  /* ---------- Éléments (outil ATOME) ---------- */
  function info(el) {
    const e = ATOME.element(el);
    return { Z: e.Z, sym: el, nom: e.nom, valence: ATOME.valence(e.Z), liaisons: e.liaisons, doublets: e.doubletsNonLiants, regle: el === 'H' ? 2 : 8 };
  }
  // « 1 doublet non liant », « aucun doublet non liant »
  const doublets = k => (k ? `${k} doublet${k > 1 ? 's' : ''} non liant${k > 1 ? 's' : ''}` : 'aucun doublet non liant');

  /* ============================================================
     MOLÉCULES
     a : [el, x, y] ou [el, x, y, d] ; l : [a, b] ou [a, b, o]
     ============================================================ */
  const MOL = {
    h2: { f: 'H<sub>2</sub>', nom: 'dihydrogène', a: [['H', 0, 0], ['H', 1, 0]], l: [[0, 1]] },
    cl2: { f: 'Cl<sub>2</sub>', nom: 'dichlore', a: [['Cl', 0, 0], ['Cl', 1, 0]], l: [[0, 1]] },
    hcl: { f: 'HCl', nom: 'chlorure d\'hydrogène', a: [['H', 0, 0], ['Cl', 1, 0]], l: [[0, 1]] },
    h2o: { f: 'H<sub>2</sub>O', nom: 'eau', a: [['H', 0, 0], ['O', 1, 0], ['H', 2, 0]], l: [[0, 1], [1, 2]] },
    nh3: { f: 'NH<sub>3</sub>', nom: 'ammoniac', a: [['H', 0, 0], ['N', 1, 0], ['H', 2, 0], ['H', 1, 1]], l: [[0, 1], [1, 2], [1, 3]] },
    ch4: { f: 'CH<sub>4</sub>', nom: 'méthane', a: [['C', 1, 1], ['H', 1, 0], ['H', 0, 1], ['H', 2, 1], ['H', 1, 2]], l: [[0, 1], [0, 2], [0, 3], [0, 4]] },
    h2s: { f: 'H<sub>2</sub>S', nom: 'sulfure d\'hydrogène', a: [['H', 0, 0], ['S', 1, 0], ['H', 2, 0]], l: [[0, 1], [1, 2]] },
    co2: { f: 'CO<sub>2</sub>', nom: 'dioxyde de carbone', a: [['O', 0, 0], ['C', 1, 0], ['O', 2, 0]], l: [[0, 1, 2], [1, 2, 2]] },
    n2: { f: 'N<sub>2</sub>', nom: 'diazote', a: [['N', 0, 0], ['N', 1, 0]], l: [[0, 1, 3]] },
    o2: { f: 'O<sub>2</sub>', nom: 'dioxygène', a: [['O', 0, 0], ['O', 1, 0]], l: [[0, 1, 2]] },
    c2h6: { f: 'C<sub>2</sub>H<sub>6</sub>', nom: 'éthane',
      a: [['C', 1, 1], ['C', 2, 1], ['H', 0, 1], ['H', 1, 0], ['H', 1, 2], ['H', 3, 1], ['H', 2, 0], ['H', 2, 2]],
      l: [[0, 1], [0, 2], [0, 3], [0, 4], [1, 5], [1, 6], [1, 7]] },
    ch4o: { f: 'CH<sub>4</sub>O', nom: 'méthanol',
      a: [['C', 1, 1], ['H', 0, 1], ['H', 1, 0], ['H', 1, 2], ['O', 2, 1], ['H', 3, 1]],
      l: [[0, 1], [0, 2], [0, 3], [0, 4], [4, 5]] },
    ch5n: { f: 'CH<sub>5</sub>N', nom: 'méthylamine',
      a: [['C', 1, 1], ['H', 0, 1], ['H', 1, 0], ['H', 1, 2], ['N', 2, 1], ['H', 3, 1], ['H', 2, 2]],
      l: [[0, 1], [0, 2], [0, 3], [0, 4], [4, 5], [4, 6]] },
    c2h3cl: { f: 'C<sub>2</sub>H<sub>3</sub>Cl', nom: 'chlorure de vinyle',
      a: [['C', 1, 1], ['C', 2, 1], ['H', 1, 0], ['H', 1, 2], ['H', 2, 0], ['Cl', 3, 1]],
      l: [[0, 1, 2], [0, 2], [0, 3], [1, 4], [1, 5]] },
    c3h3n: { f: 'C<sub>3</sub>H<sub>3</sub>N', nom: 'acrylonitrile',
      a: [['C', 1, 1], ['C', 2, 1], ['C', 3, 1], ['N', 4, 1], ['H', 1, 0], ['H', 1, 2], ['H', 2, 0]],
      l: [[0, 1, 2], [1, 2], [2, 3, 3], [0, 4], [0, 5], [1, 6]],
      indice: 'il y a une liaison double C=C et une liaison triple C≡N' },
    // C3H8O : les trois molécules du défi
    propan1ol: { f: 'C<sub>3</sub>H<sub>8</sub>O', semi: 'CH<sub>3</sub>–CH<sub>2</sub>–CH<sub>2</sub>–OH',
      a: [['C', 1, 1], ['C', 2, 1], ['C', 3, 1], ['O', 4, 1], ['H', 5, 1], ['H', 0, 1], ['H', 1, 0], ['H', 1, 2], ['H', 2, 0], ['H', 2, 2], ['H', 3, 0], ['H', 3, 2]],
      l: [[0, 1], [1, 2], [2, 3], [3, 4], [0, 5], [0, 6], [0, 7], [1, 8], [1, 9], [2, 10], [2, 11]] },
    propan2ol: { f: 'C<sub>3</sub>H<sub>8</sub>O', semi: 'CH<sub>3</sub>–CH(OH)–CH<sub>3</sub>',
      a: [['C', 1, 2], ['C', 2, 2], ['C', 3, 2], ['O', 2, 1], ['H', 2, 0], ['H', 0, 2], ['H', 1, 1], ['H', 1, 3], ['H', 2, 3], ['H', 3, 1], ['H', 3, 3], ['H', 4, 2]],
      l: [[0, 1], [1, 2], [1, 3], [3, 4], [0, 5], [0, 6], [0, 7], [1, 8], [2, 9], [2, 10], [2, 11]] },
    methoxyethane: { f: 'C<sub>3</sub>H<sub>8</sub>O', semi: 'CH<sub>3</sub>–O–CH<sub>2</sub>–CH<sub>3</sub>',
      a: [['C', 1, 1], ['O', 2, 1], ['C', 3, 1], ['C', 4, 1], ['H', 0, 1], ['H', 1, 0], ['H', 1, 2], ['H', 3, 0], ['H', 3, 2], ['H', 4, 0], ['H', 4, 2], ['H', 5, 1]],
      l: [[0, 1], [1, 2], [2, 3], [0, 4], [0, 5], [0, 6], [2, 7], [2, 8], [3, 9], [3, 10], [3, 11]] },
    // C2H6S : les deux molécules possibles
    c2h6s1: { f: 'C<sub>2</sub>H<sub>6</sub>S', semi: 'CH<sub>3</sub>–S–CH<sub>3</sub>',
      a: [['C', 1, 1], ['S', 2, 1], ['C', 3, 1], ['H', 0, 1], ['H', 1, 0], ['H', 1, 2], ['H', 3, 0], ['H', 3, 2], ['H', 4, 1]],
      l: [[0, 1], [1, 2], [0, 3], [0, 4], [0, 5], [2, 6], [2, 7], [2, 8]] },
    c2h6s2: { f: 'C<sub>2</sub>H<sub>6</sub>S', semi: 'CH<sub>3</sub>–CH<sub>2</sub>–SH',
      a: [['C', 1, 1], ['C', 2, 1], ['S', 3, 1], ['H', 4, 1], ['H', 0, 1], ['H', 1, 0], ['H', 1, 2], ['H', 2, 0], ['H', 2, 2]],
      l: [[0, 1], [1, 2], [2, 3], [0, 4], [0, 5], [0, 6], [1, 7], [1, 8]] },
    // schémas à vérifier ou à compléter
    hocl: { f: 'HOCl', nom: 'acide hypochloreux', a: [['H', 0, 0], ['O', 1, 0], ['Cl', 2, 0]], l: [[0, 1], [1, 2]] },
    hcn: { f: 'HCN', nom: 'acide cyanhydrique', a: [['H', 0, 0], ['C', 1, 0], ['N', 2, 0]], l: [[0, 1], [1, 2, 3]] },
    ch3cl: { f: 'CH<sub>3</sub>Cl', nom: 'chlorométhane', a: [['C', 1, 1], ['H', 1, 0], ['H', 0, 1], ['H', 1, 2], ['Cl', 2, 1]], l: [[0, 1], [0, 2], [0, 3], [0, 4]] },
    cf4: { f: 'CF<sub>4</sub>', nom: 'tétrafluorométhane', a: [['C', 1, 1], ['F', 1, 0], ['F', 0, 1], ['F', 2, 1], ['F', 1, 2]], l: [[0, 1], [0, 2], [0, 3], [0, 4]] },
    c4h10o: { f: 'C<sub>4</sub>H<sub>10</sub>O',
      a: [['H', 0, 2], ['C', 1, 2], ['H', 1, 1], ['H', 1, 3], ['C', 3, 2], ['C', 3, 1], ['H', 3, 0], ['H', 2, 1], ['H', 4, 1],
          ['C', 5, 2], ['H', 5, 1], ['H', 5, 3], ['O', 6, 2], ['H', 7, 2], ['H', 3, 3]],
      l: [[0, 1], [1, 2], [1, 3], [1, 4], [4, 5], [5, 6], [5, 7], [5, 8], [4, 9], [9, 10], [9, 11], [9, 12], [12, 13], [4, 14]] },
    ethanamine: { f: 'C<sub>2</sub>H<sub>7</sub>N', nom: 'éthanamine',
      a: [['H', 0, 1], ['C', 1, 1], ['C', 2, 1], ['N', 3, 1], ['H', 4, 1], ['H', 1, 0], ['H', 1, 2], ['H', 2, 0], ['H', 2, 2], ['H', 3, 0]],
      l: [[0, 1], [1, 2], [2, 3], [3, 4], [1, 5], [1, 6], [2, 7], [2, 8], [3, 9]] },
    ethanediol: { f: 'C<sub>2</sub>H<sub>6</sub>O<sub>2</sub>', nom: 'éthane-1,2-diol',
      a: [['H', 0, 1], ['O', 1, 1], ['C', 2, 1], ['C', 3, 1], ['O', 4, 1], ['H', 5, 1], ['H', 2, 0], ['H', 2, 2], ['H', 3, 0], ['H', 3, 2]],
      l: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [2, 6], [2, 7], [3, 8], [3, 9]] },
    methanal: { f: 'CH<sub>2</sub>O', nom: 'méthanal', a: [['O', 1, 0], ['C', 1, 1], ['H', 0, 1], ['H', 2, 1]], l: [[0, 1, 2], [1, 2], [1, 3]] },
    methanimine: { f: 'CH<sub>3</sub>N', nom: 'méthanimine', a: [['N', 1, 0], ['C', 1, 1], ['H', 0, 1], ['H', 2, 1], ['H', 2, 0]], l: [[0, 1, 2], [1, 2], [1, 3], [0, 4]] },
    // glucose (chaîne ouverte) : OH en haut et en bas, en alternance
    glucose: { f: 'C<sub>6</sub>H<sub>12</sub>O<sub>6</sub>', nom: 'glucose',
      a: [['C', 1, 2], ['O', 1, 1], ['H', 0, 2],
          ['C', 2.3, 2], ['O', 2.3, 1], ['H', 2.3, 0], ['H', 2.3, 3],
          ['C', 3.6, 2], ['O', 3.6, 3], ['H', 3.6, 4], ['H', 3.6, 1],
          ['C', 4.9, 2], ['O', 4.9, 1], ['H', 4.9, 0], ['H', 4.9, 3],
          ['C', 6.2, 2], ['O', 6.2, 3], ['H', 6.2, 4], ['H', 6.2, 1],
          ['C', 7.5, 2], ['H', 7.5, 1], ['H', 7.5, 3], ['O', 8.5, 2], ['H', 9.5, 2]],
      l: [[0, 1, 2], [0, 2], [0, 3], [3, 4], [4, 5], [3, 6], [3, 7], [7, 8], [8, 9], [7, 10], [7, 11], [11, 12], [12, 13], [11, 14],
          [11, 15], [15, 16], [16, 17], [15, 18], [15, 19], [19, 20], [19, 21], [19, 22], [22, 23]] },
  };

  // copie d'une molécule, doublets de chaque élément par défaut
  function molecule(id, mod) {
    const m = MOL[id];
    const mol = {
      id, f: m.f, nom: m.nom, semi: m.semi, indice: m.indice,
      atomes: m.a.map(t => ({ el: t[0], x: t[1], y: t[2], d: t[3] != null ? t[3] : info(t[0]).doublets })),
      liaisons: m.l.map(t => ({ a: t[0], b: t[1], o: t[2] || 1 })),
    };
    if (mod) mod(mol);
    return mol;
  }
  const copier = mol => Object.assign({}, mol, { atomes: mol.atomes.map(a => Object.assign({}, a)), liaisons: mol.liaisons.map(l => Object.assign({}, l)) });

  /* ============================================================
     COMPTAGE
     ============================================================ */
  const somme = (mol, i) => mol.liaisons.reduce((s, l) => s + (l.a === i || l.b === i ? l.o : 0), 0);
  const voisins = (mol, i) => mol.liaisons.filter(l => l.a === i || l.b === i).map(l => (l.a === i ? l.b : l.a));
  function analyse(mol) {
    return mol.atomes.map((a, i) => {
      const s = info(a.el), l = somme(mol, i), e = 2 * (l + a.d);
      return { el: a.el, l, d: a.d, e, regle: s.regle, ok: e === s.regle, bon: e === s.regle && l === s.liaisons && a.d === s.doublets, info: s, nv: voisins(mol, i).length };
    });
  }

  // diagnostic d'un atome (null s'il est juste) : « O est entouré de 6 électrons : il lui manque un doublet non liant »
  function diagAtome(mol, i) {
    const a = analyse(mol)[i], s = a.info, el = a.el;
    if (a.bon) return null;
    if (el === 'H') {
      if (a.d) return `H n'a qu'un électron de valence : il n'a jamais de doublet non liant.`;
      if (a.e > 2) return `H est entouré de ${a.e} électrons : il ne forme qu'une liaison (règle du duet).`;
      return `H est entouré de ${a.e} électron${a.e > 1 ? 's' : ''} : il lui faut une liaison (règle du duet).`;
    }
    if (a.e < 8) {
      if (a.d < s.doublets) {
        const k = s.doublets - a.d;
        return `${el} est entouré de ${a.e} électrons : il lui manque ${k === 1 ? 'un doublet non liant' : k + ' doublets non liants'}.`;
      }
      const k = s.liaisons - a.l;
      return `${el} est entouré de ${a.e} électrons : il lui manque ${k === 1 ? 'une liaison' : k + ' liaisons'}.`;
    }
    if (a.e > 8) {
      if (a.l > s.liaisons) { const k = a.l - s.liaisons; return `${el} est entouré de ${a.e} électrons : ${k === 1 ? 'une liaison' : k + ' liaisons'} en trop.`; }
      const k = a.d - s.doublets;
      return `${el} est entouré de ${a.e} électrons : ${k === 1 ? 'un doublet non liant' : k + ' doublets non liants'} en trop.`;
    }
    // 8 électrons, mais pas le bon nombre de liaisons
    return `${el} a bien 8 électrons autour de lui, mais avec ${s.valence} électrons de valence il doit former ${pl(s.liaisons, 'liaison')} ${s.doublets ? 'et avoir ' + doublets(s.doublets) : 'sans doublet non liant'}.`;
  }

  /* ============================================================
     EXPRESSIONS À PIOCHER POUR CONCLURE
     → { juste (le schéma est juste), raisons: [{ id, t, sorte: 'defaut' | 'regle', vraie, diag }] }
     ============================================================ */
  function raisons(mol) {
    const an = analyse(mol);
    const juste = an.every(a => a.bon);
    const els = [...new Set(an.map(a => a.el))];
    const R = [];
    const ajouter = (t, sorte, vraie, diag) => { if (!R.some(r => r.t === t)) R.push({ id: 'r' + R.length, t, sorte, vraie, diag }); };
    els.forEach(el => {
      const at = an.filter(a => a.el === el), s = at[0].info, regle = s.regle;
      const faux = at.filter(a => !a.ok);
      // nombre d'électrons autour : vrai pour un atome fautif, faux si les doublets sont comptés pour 1 électron
      faux.forEach(a => ajouter(`${el} est entouré de ${a.e} électrons au lieu de ${regle}`, 'defaut', true));
      at.forEach(a => {
        const e1 = 2 * a.l + a.d;
        if (a.d && e1 !== a.e && e1 !== regle) ajouter(`${el} est entouré de ${e1} électrons au lieu de ${regle}`, 'defaut', false,
          `Un doublet, c'est 2 électrons : ${el} a ${pl(a.l, 'doublet')} liant${a.l > 1 ? 's' : ''} et ${pl(a.d, 'doublet')} non liant${a.d > 1 ? 's' : ''}, soit ${a.e} électrons.`);
        if (el === 'H' && a.l === 1 && a.e === 2) ajouter('H est entouré de 4 électrons au lieu de 2', 'defaut', false,
          'Une liaison compte pour les deux atomes qu\'elle relie : chaque H n\'a qu\'une liaison, soit 2 électrons.');
      });
      // règle respectée
      if (el === 'H') ajouter('H respecte la règle du duet', 'regle', !faux.length, faux.length ? `Un H est entouré de ${faux[0].e} électrons, pas 2.` : null);
      else ajouter(`${el} respecte la règle de l'octet`, 'regle', !faux.length, faux.length ? `${el} est entouré de ${faux[0].e} électrons, pas 8.` : null);
      if (el === 'H') return;
      // doublets non liants
      const manque = at.some(a => a.d < s.doublets), trop = at.some(a => a.d > s.doublets);
      const un = at.length > 1 ? `Chaque ${el}` : el;
      if (s.doublets) {
        ajouter(`il manque un doublet non liant sur ${el}`, 'defaut', manque, manque ? null : `${el} a bien ${doublets(s.doublets)} : il ne lui en manque pas.`);
        if (trop || el === 'Cl' || el === 'O') ajouter(`il y a un doublet non liant en trop sur ${el}`, 'defaut', trop, trop ? null : `${un} a au plus ${doublets(s.doublets)} ici.`);
      }
      // liaisons
      const lTrop = at.some(a => a.l > s.liaisons);
      ajouter(`il y a une liaison en trop sur ${el}`, 'defaut', lTrop, lTrop ? null : `${un} forme au plus ${pl(s.liaisons, 'liaison')} ici.`);
      // 8 électrons, mais pas le bon nombre de liaisons (HCN, proposition 1)
      const mauvais = at.some(a => a.l < s.liaisons);
      if (mauvais || el === 'C' || el === 'N') ajouter(`${el} doit former ${pl(s.liaisons, 'liaison')}`, 'defaut', mauvais, mauvais ? null : `${at.length > 1 ? 'Chaque ' + el : el} a ici ${at.some(a => a.l > s.liaisons) ? 'trop de liaisons, pas trop peu' : 'bien ' + pl(s.liaisons, 'liaison')}.`);
    });
    // H manquants : un C entouré de moins de 8 électrons sans doublet non liant
    const manqueH = an.some(a => a.el === 'C' && a.e < 8 && a.d === 0 && a.l < 4 && a.nv === a.l);
    if (manqueH || an.some(a => a.el === 'C')) ajouter('il manque des atomes H', 'defaut', manqueH, manqueH ? null : 'Chaque C forme déjà 4 liaisons : il ne manque pas d\'atome H.');
    return { juste, raisons: R, analyse: an };
  }

  /* ============================================================
     VARIANTES FAUSSES (module 4) : une seule erreur, décrite par { type, i, texte }
     ============================================================ */
  function fausser(mol, type) {
    const m = copier(mol), an = analyse(m);
    const choisir = f => { const c = an.map((a, i) => i).filter(f); return c.length ? LW.hasard(c) : -1; };
    if (type === 'moinsDoublet') {
      const i = choisir(k => an[k].d > 0);
      if (i < 0) return null;
      m.atomes[i].d--; return { mol: m, i, type };
    }
    if (type === 'plusDoublet') {
      const i = choisir(k => an[k].el !== 'H' && an[k].d > 0);
      if (i < 0) return null;
      m.atomes[i].d++; return { mol: m, i, type };
    }
    if (type === 'double') {
      // liaison double au lieu de simple entre deux atomes qui ne sont pas des H
      const ks = m.liaisons.map((l, k) => k).filter(k => { const l = m.liaisons[k]; return l.o === 1 && m.atomes[l.a].el !== 'H' && m.atomes[l.b].el !== 'H'; });
      if (!ks.length) return null;
      const k = LW.hasard(ks); m.liaisons[k].o = 2;
      return { mol: m, i: m.liaisons[k].a, j: m.liaisons[k].b, type };
    }
    if (type === 'hDouble') {
      // H avec deux liaisons : son voisin perd un doublet non liant (il garde 8 électrons)
      const ks = m.liaisons.map((l, k) => k).filter(k => { const l = m.liaisons[k]; const h = m.atomes[l.a].el === 'H' ? l.b : m.atomes[l.b].el === 'H' ? l.a : -1; return h >= 0 && m.atomes[h].d > 0; });
      if (!ks.length) return null;
      const k = LW.hasard(ks), l = m.liaisons[k], x = m.atomes[l.a].el === 'H' ? l.b : l.a;
      l.o = 2; m.atomes[x].d--;
      return { mol: m, i: x === l.a ? l.b : l.a, type };
    }
    if (type === 'manqueH') {
      const ks = m.atomes.map((a, i) => i).filter(i => m.atomes[i].el === 'H' && m.atomes[voisins(m, i)[0]].el === 'C');
      if (!ks.length) return null;
      const h = LW.hasard(ks), c = voisins(m, h)[0];
      m.atomes.splice(h, 1);
      m.liaisons = m.liaisons.filter(l => l.a !== h && l.b !== h).map(l => ({ a: l.a > h ? l.a - 1 : l.a, b: l.b > h ? l.b - 1 : l.b, o: l.o }));
      return { mol: m, i: c > h ? c - 1 : c, type };
    }
    return null;
  }

  /* ============================================================
     COMPARAISON (ORGA)
     ============================================================ */
  function versOrga(mol, implicite) {
    if (!implicite || mol.atomes.every(a => a.el === 'H')) {
      return { atomes: mol.atomes.map(a => ({ el: a.el })), liaisons: mol.liaisons.map(l => ({ a: l.a, b: l.b, o: l.o })) };
    }
    // H implicites : on retire les H liés à un autre atome
    const garde = mol.atomes.map(a => a.el !== 'H');
    const idx = []; let k = 0;
    garde.forEach((g, i) => { idx[i] = g ? k++ : -1; });
    return {
      atomes: mol.atomes.filter((a, i) => garde[i]).map(a => ({ el: a.el })),
      liaisons: mol.liaisons.filter(l => garde[l.a] && garde[l.b]).map(l => ({ a: idx[l.a], b: idx[l.b], o: l.o })),
    };
  }
  const meme = (m1, m2) => ORGA.meme(versOrga(m1), versOrga(m2));
  function composantes(mol) {
    const n = mol.atomes.length, c = new Array(n).fill(-1);
    let k = 0;
    for (let i = 0; i < n; i++) {
      if (c[i] >= 0) continue;
      const pile = [i]; c[i] = k;
      while (pile.length) { const x = pile.pop(); voisins(mol, x).forEach(y => { if (c[y] < 0) { c[y] = k; pile.push(y); } }); }
      k++;
    }
    return { c, n: k };
  }
  const connexe = mol => composantes(mol).n <= 1;

  /* ============================================================
     DESSIN
     ============================================================ */
  // demi-largeur et demi-hauteur du symbole (police f)
  const boite = (el, f) => ({ rx: f * (el.length > 1 ? .56 : .36), ry: f * .42 });
  // point du bord (ellipse) dans la direction a
  function bord(el, f, a, marge) {
    const b = boite(el, f), c = Math.cos(a * RAD), s = Math.sin(a * RAD);
    const t = 1 / Math.sqrt((c / b.rx) ** 2 + (s / b.ry) ** 2);
    return t + (marge || 0);
  }
  const CANDIDATS = [0, 180, 90, 270, 45, 135, 225, 315];
  // dispositions de base d'un atome seul (comme le tableau des atomes) : traits libres puis doublets
  function seul(el, libres, d) {
    const st = el === 'H' ? [0] : [180, 0, 90, 270].slice(0, libres);
    const reste = [270, 90, 0, 180].filter(a => st.indexOf(a) < 0);
    return { stubs: st.slice(0, libres), doublets: reste.slice(0, d) };
  }
  // combinaisons de k angles parmi les candidats
  function combinaisons(t, k) {
    const r = [];
    (function go(i, acc) {
      if (acc.length === k) { r.push(acc.slice()); return; }
      for (let j = i; j < t.length; j++) { acc.push(t[j]); go(j + 1, acc); acc.pop(); }
    })(0, []);
    return r;
  }
  // angles des traits libres et des doublets d'un atome (liaisons dans les directions occ)
  function disposer(el, occ, libres, d, avant) {
    const k = libres + d;
    if (!k) return { stubs: [], doublets: [] };
    if (!occ.length) return seul(el, libres, d);
    // la disposition précédente reste si elle est encore libre (pas de saut pendant un glisser)
    if (avant && avant.stubs.length === libres && avant.doublets.length === d &&
        avant.stubs.concat(avant.doublets).every(a => occ.every(b => ecart(a, b) >= 38))) return avant;
    let cands = CANDIDATS.filter(a => occ.every(b => ecart(a, b) >= 40));
    if (cands.length < k) cands = CANDIDATS.filter(a => occ.every(b => ecart(a, b) >= 22));
    if (cands.length < k) cands = CANDIDATS.slice();
    let best = null, bs = -1;
    combinaisons(cands, k).forEach(c => {
      // plus petit écart entre un angle choisi et toutes les autres directions
      const tous = occ.concat(c);
      let g = 360;
      for (let x = occ.length; x < tous.length; x++) for (let y = 0; y < tous.length; y++) if (x !== y) g = Math.min(g, ecart(tous[x], tous[y]));
      const sc = Math.round(g) * 10 + c.filter(a => a % 90 === 0).length;
      if (sc > bs) { bs = sc; best = c; }
    });
    // les traits libres prennent les directions les plus éloignées des liaisons
    const loin = a => Math.min(...occ.map(b => ecart(a, b)));
    const tri = best.slice().sort((a, b) => loin(b) - loin(a));
    return { stubs: tri.slice(0, libres), doublets: tri.slice(libres) };
  }

  const r1 = x => Math.round(x * 10) / 10;
  function rendu(etat, o) {
    o = o || {};
    const f = o.f || 22, at = etat.atomes, cache = o.cache || [];
    const ep = Math.max(1.8, f * .085);                // épaisseur des traits
    const geo = { stubs: [], doublets: [], liaisons: [], atomes: [] };
    const angles = at.map(() => []);
    etat.liaisons.forEach(l => {
      const A = at[l.a], B = at[l.b];
      angles[l.a].push(n360(Math.atan2(B.y - A.y, B.x - A.x) / RAD));
      angles[l.b].push(n360(Math.atan2(A.y - B.y, A.x - B.x) / RAD));
    });
    const out = [];
    // liaisons (simples, doubles, triples)
    etat.liaisons.forEach((l, k) => {
      const A = at[l.a], B = at[l.b];
      const dx = B.x - A.x, dy = B.y - A.y, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L;
      const aA = n360(Math.atan2(dy, dx) / RAD), aB = n360(aA + 180);
      const tA = bord(A.el, f, aA, f * .12), tB = bord(B.el, f, aB, f * .12);
      const x1 = A.x + ux * tA, y1 = A.y + uy * tA, x2 = B.x - ux * tB, y2 = B.y - uy * tB;
      const e = f * .24, decal = l.o === 1 ? [0] : l.o === 2 ? [-e / 2, e / 2] : [-e, 0, e];
      if (L > tA + tB) decal.forEach(dv => out.push(`<line class="lw-li" x1="${r1(x1 - uy * dv)}" y1="${r1(y1 + ux * dv)}" x2="${r1(x2 - uy * dv)}" y2="${r1(y2 + ux * dv)}" stroke-width="${r1(ep)}"/>`));
      geo.liaisons.push({ k, x1, y1, x2, y2 });
    });
    // doublets non liants et traits libres
    const dispo = at.map((a, i) => {
      if (a.inconnu) return { stubs: [], doublets: [] };
      const lib = a.libres || 0;
      return disposer(a.el, angles[i], lib, a.d || 0, cache[i]);
    });
    if (o.cache) dispo.forEach((d, i) => { o.cache[i] = d; });
    at.forEach((a, i) => {
      dispo[i].doublets.forEach(ang => {
        const r = bord(a.el, f, ang, f * .16), c = Math.cos(ang * RAD), s = Math.sin(ang * RAD), w = f * .34;
        const cx = a.x + c * r, cy = a.y + s * r;
        out.push(`<line class="lw-dl" data-i="${i}" x1="${r1(cx - s * w)}" y1="${r1(cy + c * w)}" x2="${r1(cx + s * w)}" y2="${r1(cy - c * w)}" stroke-width="${r1(ep)}"/>`);
        geo.doublets.push({ i, x: cx, y: cy });
      });
    });
    at.forEach((a, i) => {
      dispo[i].stubs.forEach((ang, k) => {
        const r = bord(a.el, f, ang, f * .12), c = Math.cos(ang * RAD), s = Math.sin(ang * RAD), L = f * 1.15;
        const x0 = a.x + c * r, y0 = a.y + s * r, x = x0 + c * L, y = y0 + s * L;
        const choisi = o.stubChoisi && o.stubChoisi.i === i && o.stubChoisi.k === k;
        out.push(`<line class="lw-tl" x1="${r1(x0)}" y1="${r1(y0)}" x2="${r1(x)}" y2="${r1(y)}" stroke-width="${r1(ep)}"/>`);
        out.push(`<circle class="lw-po${choisi ? ' lw-po-choisi' : ''}" data-i="${i}" cx="${r1(x)}" cy="${r1(y)}" r="${r1(Math.max(5.5, f * .27))}"/>`);
        geo.stubs.push({ i, k, a: ang, x0, y0, x, y });
      });
    });
    // atomes : anneau de sélection, symbole, marque d'erreur
    at.forEach((a, i) => {
      const b = boite(a.el, f);
      const R = Math.max(b.rx, b.ry) + f * .3;
      const Rs = Math.max(b.rx, b.ry) + f * .66;         // anneau autour du symbole et de ses doublets
      if (o.choisi === i) out.push(`<circle class="lw-sel" cx="${r1(a.x)}" cy="${r1(a.y)}" r="${r1(Rs)}"/>`);
      if (o.marques && o.marques.has(i)) out.push(`<circle class="lw-faux" cx="${r1(a.x)}" cy="${r1(a.y)}" r="${r1(Rs + (o.choisi === i ? 4 : 0))}"/>`);
      if (a.inconnu) out.push(`<circle class="lw-inc" cx="${r1(a.x)}" cy="${r1(a.y)}" r="${r1(R)}"/>`);
      out.push(`<text class="lw-at${a.inconnu ? ' lw-at-inc' : ''}" x="${r1(a.x)}" y="${r1(a.y)}" dy=".35em" font-size="${r1(f)}">${a.el}</text>`);
      geo.atomes.push({ i, x: a.x, y: a.y, R });
    });
    // étiquettes (« 8 e⁻ ») : sous l'atome, ou dans la première direction libre
    if (o.etiquettes) at.forEach((a, i) => {
      const t = o.etiquettes[i];
      if (!t) return;
      const occ = angles[i].concat(dispo[i].stubs, dispo[i].doublets);
      const ang = [90, 45, 135, 0, 180, 315, 225, 270].find(x => occ.every(y => ecart(x, y) >= 35));
      const g = ang == null ? 60 : ang;
      const r = bord(a.el, f, g, f * (g % 90 === 0 ? .95 : 1.05));
      const x = a.x + Math.cos(g * RAD) * r, y = a.y + Math.sin(g * RAD) * r;
      out.push(`<text class="lw-ne${t.faux ? ' lw-ne-faux' : ''}" x="${r1(x)}" y="${r1(y)}" dy=".35em" font-size="${r1(Math.max(10.5, f * .5))}">${t.t || t}</text>`);
    });
    if (o.provisoire) {
      const p = o.provisoire;
      out.push(`<line class="lw-prov" x1="${r1(p.x1)}" y1="${r1(p.y1)}" x2="${r1(p.x2)}" y2="${r1(p.y2)}" stroke-width="${r1(ep)}"/>`);
    }
    return { html: out.join(''), geo };
  }

  // positions en px d'une molécule (unités de liaison) dans un dessin W × H
  function ajuster(mol, W, H, o) {
    o = o || {};
    const xs = mol.atomes.map(a => a.x), ys = mol.atomes.map(a => a.y);
    const mx = Math.min(...xs), my = Math.min(...ys), bw = Math.max(...xs) - mx, bh = Math.max(...ys) - my;
    let f = o.fmax || 24, s = 60;
    for (let t = 0; t < 3; t++) {
      const pad = f * 1.9;
      s = Math.min(bw ? (W - 2 * pad) / bw : 1e9, bh ? (H - 2 * pad) / bh : 1e9, f * 3.1);
      f = Math.max(12, Math.min(o.fmax || 24, s * .37));
    }
    const ox = (W - bw * s) / 2 - mx * s, oy = (H - bh * s) / 2 - my * s;
    return { pos: mol.atomes.map(a => ({ x: ox + a.x * s, y: oy + a.y * s })), f, s };
  }

  // petit dessin d'un atome seul avec ses traits et ses doublets (tableau des atomes)
  function atomeSeul(el, libres, d, taille) {
    const f = 15, W = 62, t = taille || 46;
    const r = rendu({ atomes: [{ el, x: W / 2, y: W / 2, libres, d }], liaisons: [] }, { f });
    return `<svg class="lw-mini" viewBox="0 0 ${W} ${W}" width="${t}" height="${t}" role="img" aria-label="${el} : ${pl(libres, 'liaison')}, ${doublets(d)}">${r.html.replace(/<circle class="lw-po[^>]*>/g, '')}</svg>`;
  }

  // valeurs justes d'une ligne du tableau des atomes
  function ligneAtome(el) {
    const s = LW.info(el);
    return { v: s.valence, g: s.regle - s.valence, l: s.liaisons, d: s.doublets };
  }
  // diagnostic d'une ligne fausse (la première case fausse, dans l'ordre du tableau)
  // mode 'position' : l'élément est donné par sa ligne et sa colonne (et non par sa configuration)
  function diagLigne(el, x, mode) {
    const s = LW.info(el), b = ligneAtome(el), Z = s.Z;
    const c = ATOME.config(Z), n = ATOME.derniereCouche(c), ext = c.filter(t => ATOME.couche(t[0]) === n);
    if (x.v !== b.v) {
      if (mode === 'position') {
        const col = b.v <= 2 ? b.v : b.v + 10;
        if (x.v === n && n !== b.v) return `La ligne ${n} donne la couche externe (n = ${n}), pas le nombre d'électrons de valence : lis la colonne.`;
        if (x.v === col) return `Colonne ${col} : on retire les 10 colonnes cachées du tableau.`;
        return 'Lis la colonne : colonnes 1 et 2 → 1 et 2 électrons de valence ; colonnes 13 à 18 → 3 à 8.';
      }
      if (x.v === Z) return `${Z}, c'est le nombre total d'électrons. Les électrons de valence sont ceux de la dernière couche (n = ${n}).`;
      if (ext.length > 1 && x.v === ext[ext.length - 1][1]) return `Compte toute la couche n = ${n} : ${ext.map(t => `${t[0]}<sup>${t[1]}</sup>`).join(' et ')}.`;
      return `Les électrons de valence sont ceux de la dernière couche (n = ${n}) : compte-les dans la configuration.`;
    }
    if (x.g !== b.g) {
      if (x.g === b.v) return `C'est son nombre d'électrons de valence. Combien lui en manque-t-il pour en avoir ${s.regle} (${s.regle === 2 ? 'règle du duet, comme He' : 'règle de l\'octet'}) ?`;
      return `Il a ${pl(b.v, 'électron')} de valence ; il lui en faut ${s.regle} sur sa couche externe (${s.regle === 2 ? 'règle du duet, comme He' : 'règle de l\'octet'}).`;
    }
    if (x.l !== b.l) return 'Chaque liaison covalente lui fait gagner un électron : il forme autant de liaisons que d\'électrons à gagner.';
    if (x.d !== b.d) {
      const reste = b.v - b.l;
      if (reste && x.d === reste) return `Il reste ${b.v} − ${b.l} = ${pl(reste, 'électron')} de valence : ils se regroupent <b>par deux</b>.`;
      if (x.d * 2 === b.v && b.l) return `Les électrons engagés dans les liaisons ne comptent pas : il reste ${b.v} − ${b.l} = ${pl(reste, 'électron')}, regroupés par deux.`;
      return reste ? `Il reste ${b.v} − ${b.l} = ${pl(reste, 'électron')} de valence, regroupés par deux.` : 'Tous ses électrons de valence sont engagés dans les liaisons : il ne lui en reste pas.';
    }
    return '';
  }

  // bilan d'un schéma juste
  function bilanJuste(mol) {
    const h = mol.atomes.some(a => a.el === 'H'), autres = mol.atomes.some(a => a.el !== 'H');
    return h && autres ? 'H est entouré de 2 électrons (règle du duet), chacun des autres atomes de 8 électrons (règle de l\'octet).'
      : h ? 'Chaque H est entouré de 2 électrons (règle du duet).' : 'Chaque atome est entouré de 8 électrons (règle de l\'octet).';
  }

  Object.assign(LW, { ligneAtome, diagLigne, bilanJuste, MOL, molecule, copier, info, doublets, pl, analyse, diagAtome, raisons, fausser, versOrga, meme, connexe, composantes,
    somme, voisins, rendu, ajuster, atomeSeul, bord, ecart, n360 });
})();
