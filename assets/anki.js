/* ============================================================
   Export des flashcards vers Anki : paquet .apkg (objet ANKI)
   (voir docs/charte-applications.md, section « Flashcards »)

   Chargé par assets/revisions.js au premier clic sur « Exporter les
   cartes sous Anki » (page Flashcards d'une application).

   Le fichier .apkg est une archive ZIP qui contient :
     collection.anki2   base SQLite au format des collections Anki (schéma 11),
                        lisible par toutes les versions d'Anki (ordinateur, AnkiDroid, AnkiMobile)
     media              liste des fichiers joints (JSON : { "0": "nom.svg", … })
     0, 1, 2…           les fichiers joints : les figures SVG des cartes
   Tout est fabriqué dans le navigateur, sans bibliothèque ni serveur
   (fonctionne en file://).

   Correspondance avec les cartes du site (assets/revisions.js) :
     une carte du site     → une note Anki (type de note « Flashcard Physique-Chimie ») ;
                             son identifiant global (guid) vient de l'id de la carte : réimporter
                             un fichier plus récent met les notes à jour, sans doublon
     ses faces (1 ou 2)    → les cartes « Sens 1 » et « Sens 2 » de la note
     l'application         → le paquet « Physique-Chimie::<titre de l'application> »
     le module             → l'étiquette « Physique-Chimie::<dossier>::Module_<n> »
     les figures SVG       → des fichiers joints (images .svg autonomes)
     ses outils            → la ligne « Utiliser » (crayon, calculatrice) à la fin de la question
   Les cartes arrivent comme nouvelles : Anki les planifie avec son propre algorithme.
   Présentation : celle des fiches du site, couleurs et police lues dans assets/theme.css.

   API (objet ANKI) :
     ANKI.paquet(app)       contenu du fichier .apkg (Uint8Array) d'une application chargée par REV
     ANKI.nomFichier(app)   nom du fichier : « flashcards-<dossier>.apkg »
   ============================================================ */
(function () {
  'use strict';

  /* ============================================================
     RÉGLAGES
     ============================================================ */
  const RACINE = 'Physique-Chimie';                              // paquet Anki qui regroupe les chapitres
  const NOM_TYPE = 'Flashcard Physique-Chimie';                  // type de note
  const ID_TYPE = 1761264000000;                                 // id du type de note : ne change jamais (réimport sans doublon)
  const MATIERES = ['maths', 'chimie', 'physique', 'college'];   // valeurs de data-matiere (assets/theme.css)
  const CHAMPS = ['Question', 'Réponse', 'Question 2', 'Réponse 2', 'Chapitre', 'Module', 'Cours', 'Type', 'Compétence', 'Matière'];

  /* ============================================================
     OUTILS : octets, SHA-1, CRC-32
     ============================================================ */
  const utf8 = s => new TextEncoder().encode(s);
  // assemble des morceaux (tableaux d'octets) en un seul Uint8Array
  function assembler(morceaux) {
    let n = 0;
    morceaux.forEach(m => { n += m.length; });
    const r = new Uint8Array(n);
    let i = 0;
    morceaux.forEach(m => { r.set(m, i); i += m.length; });
    return r;
  }
  const ecrire16 = (p, i, v) => { p[i] = v >> 8 & 255; p[i + 1] = v & 255; };
  const ecrire32 = (p, i, v) => { p[i] = v >>> 24 & 255; p[i + 1] = v >> 16 & 255; p[i + 2] = v >> 8 & 255; p[i + 3] = v & 255; };

  // SHA-1 (empreinte en hexadécimal) : somme de contrôle des notes, noms des fichiers joints, identifiants
  function sha1(o) {
    const l = o.length, nb = ((l + 8) >> 6) + 1, w = new Int32Array(nb * 16);
    for (let i = 0; i < l; i++) w[i >> 2] |= o[i] << (24 - (i % 4) * 8);
    w[l >> 2] |= 0x80 << (24 - (l % 4) * 8);
    w[nb * 16 - 1] = l * 8;
    const rol = (v, s) => (v << s) | (v >>> (32 - s));
    const h = [0x67452301, 0xEFCDAB89 | 0, 0x98BADCFE | 0, 0x10325476, 0xC3D2E1F0 | 0];
    const x = new Int32Array(80);
    for (let b = 0; b < w.length; b += 16) {
      let a = h[0], c = h[1], d = h[2], e = h[3], f = h[4];
      for (let t = 0; t < 80; t++) {
        x[t] = t < 16 ? w[b + t] : rol(x[t - 3] ^ x[t - 8] ^ x[t - 14] ^ x[t - 16], 1);
        const g = t < 20 ? (c & d) | (~c & e) : t < 40 ? c ^ d ^ e : t < 60 ? (c & d) | (c & e) | (d & e) : c ^ d ^ e;
        const k = t < 20 ? 0x5A827999 : t < 40 ? 0x6ED9EBA1 : t < 60 ? 0x8F1BBCDC | 0 : 0xCA62C1D6 | 0;
        const tmp = (rol(a, 5) + g + f + k + x[t]) | 0;
        f = e; e = d; d = rol(c, 30); c = a; a = tmp;
      }
      h[0] = (h[0] + a) | 0; h[1] = (h[1] + c) | 0; h[2] = (h[2] + d) | 0; h[3] = (h[3] + e) | 0; h[4] = (h[4] + f) | 0;
    }
    return h.map(v => ('0000000' + (v >>> 0).toString(16)).slice(-8)).join('');
  }

  // CRC-32 (archive ZIP)
  const TABLE_CRC = (function () {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c; }
    return t;
  })();
  function crc32(o) {
    let c = -1;
    for (let i = 0; i < o.length; i++) c = TABLE_CRC[(c ^ o[i]) & 255] ^ (c >>> 8);
    return (c ^ -1) >>> 0;
  }

  /* ============================================================
     BASE SQLITE (format de fichier 3, pages de 4 096 octets)
     La base est écrite d'un coup : une b-tree par table et par index,
     la table du schéma (sqlite_master) à la page 1.
     ============================================================ */
  const PAGE = 4096;                                             // taille d'une page (aucun octet réservé)
  const MAX_TABLE = PAGE - 35;                                   // charge utile gardée en entier dans une feuille de table
  const MAX_INDEX = Math.floor((PAGE - 12) * 64 / 255) - 23;     // … dans une page d'index
  const MIN_LOCAL = Math.floor((PAGE - 12) * 32 / 255) - 23;     // part gardée dans la page quand la charge déborde

  // entier positif en varint SQLite : 7 bits par octet, poids fort d'abord (n < 2^53)
  function varint(n) {
    const t = [n % 128];
    n = Math.floor(n / 128);
    while (n > 0) { t.unshift(n % 128 | 128); n = Math.floor(n / 128); }
    return t;
  }
  // entier signé sur n octets, poids fort d'abord (complément à deux)
  function octetsEntier(v, n) {
    const t = new Array(n), neg = v < 0;
    let x = neg ? -v - 1 : v;
    for (let i = n - 1; i >= 0; i--) { const o = x % 256; t[i] = neg ? 255 - o : o; x = Math.floor(x / 256); }
    return t;
  }
  // type d'un entier dans un enregistrement : [code, nombre d'octets]
  function typeEntier(v) {
    if (v === 0) return [8, 0];
    if (v === 1) return [9, 0];
    const a = v < 0 ? -v - 1 : v;
    if (a < 0x80) return [1, 1];
    if (a < 0x8000) return [2, 2];
    if (a < 0x800000) return [3, 3];
    if (a < 0x80000000) return [4, 4];
    if (a < 0x800000000000) return [5, 6];
    return [6, 8];
  }
  // enregistrement : en-tête (types des colonnes) puis valeurs ; valeurs : null, entier ou texte
  function enregistrement(valeurs) {
    const types = [], corps = [];
    valeurs.forEach(v => {
      if (v === null) types.push(0);
      else if (typeof v === 'number') { const t = typeEntier(v); types.push(t[0]); if (t[1]) corps.push(octetsEntier(v, t[1])); }
      else { const b = utf8(v); types.push(b.length * 2 + 13); corps.push(b); }
    });
    const tete = [];
    types.forEach(t => { tete.push.apply(tete, varint(t)); });
    let h = tete.length + 1;
    while (varint(h).length + tete.length !== h) h = varint(h).length + tete.length;
    return assembler([varint(h), tete].concat(corps));
  }
  // comparaison de deux entrées d'index (listes d'entiers)
  function comparer(a, b) {
    for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return a[i] < b[i] ? -1 : 1;
    return 0;
  }
  // part de la charge utile gardée dans la page (le reste va dans des pages de débordement)
  function partLocale(p, max) {
    if (p <= max) return p;
    const k = MIN_LOCAL + (p - MIN_LOCAL) % (PAGE - 4);
    return k <= max ? k : MIN_LOCAL;
  }
  // taille d'une charge utile dans sa cellule : longueur, partie locale, n° de la page de débordement
  function tailleCharge(r, max) { const loc = partLocale(r.length, max); return varint(r.length).length + loc + (loc < r.length ? 4 : 0); }

  // tables : [{ nom, sql, lignes: [[rowid, [valeurs]]] (rowid croissants), index: [{ nom, sql, colonnes: [rangs] }] }]
  // (une colonne « integer primary key » vaut null dans les valeurs : c'est le rowid)
  function baseSQLite(tables) {
    const pages = [null];                                        // pages[i] : page n° i + 1 ; la page 1 est écrite à la fin
    const nouvelle = () => { pages.push(null); return pages.length; };

    // charge utile dans une cellule : longueur, partie locale, puis chaîne de pages de débordement
    function charge(r, max) {
      const loc = partLocale(r.length, max);
      if (loc === r.length) return [varint(r.length), r];
      const reste = r.subarray(loc), nums = [];
      for (let i = 0; i < reste.length; i += PAGE - 4) nums.push(nouvelle());
      nums.forEach((num, j) => {
        const p = new Uint8Array(PAGE);
        ecrire32(p, 0, nums[j + 1] || 0);
        p.set(reste.subarray(j * (PAGE - 4), (j + 1) * (PAGE - 4)), 4);
        pages[num - 1] = p;
      });
      return [varint(r.length), r.subarray(0, loc), octetsEntier(nums[0], 4)];
    }
    // une page de b-tree : type (13 feuille de table, 5 intérieure de table, 10 feuille d'index, 2 intérieure d'index)
    function ecrirePage(num, type, cellules, droite) {
      const p = new Uint8Array(PAGE), h0 = num === 1 ? 100 : 0, inter = type === 2 || type === 5;
      p[h0] = type;
      ecrire16(p, h0 + 3, cellules.length);
      let fin = PAGE, ptr = h0 + (inter ? 12 : 8);
      cellules.forEach(c => { fin -= c.length; p.set(c, fin); ecrire16(p, ptr, fin); ptr += 2; });
      ecrire16(p, h0 + 5, fin);
      if (inter) ecrire32(p, h0 + 8, droite);
      pages[num - 1] = p;
    }
    // répartit des cellules (tailles) dans des pages : [début, fin[ de chaque page
    function grouper(tailles, place) {
      const g = [];
      let debut = 0, pris = 0;
      tailles.forEach((t, i) => {
        if (i > debut && pris + t + 2 > place) { g.push([debut, i]); debut = i; pris = 0; }
        pris += t + 2;
      });
      g.push([debut, tailles.length]);
      return g;
    }

    // b-tree d'une table (les lignes dans les feuilles) ; fixe : n° imposé de la racine (page 1)
    function arbreTable(lignes, fixe) {
      const place = PAGE - (fixe ? 100 : 0);
      const recs = lignes.map(l => enregistrement(l[1]));
      let groupes = grouper(recs.map((r, i) => varint(lignes[i][0]).length + tailleCharge(r, MAX_TABLE)), place - 8);
      let niveau = groupes.map(([a, b]) => {
        const num = groupes.length === 1 && fixe ? fixe : nouvelle(), cellules = [];
        for (let i = a; i < b; i++) {
          const ch = charge(recs[i], MAX_TABLE);
          cellules.push(assembler([ch[0], varint(lignes[i][0])].concat(ch.slice(1))));
        }
        ecrirePage(num, 13, cellules);
        return { num, cle: b > a ? lignes[b - 1][0] : 0 };
      });
      // pages intérieures : une cellule [page de gauche][plus grand rowid de cette page] par enfant, le dernier à droite
      while (niveau.length > 1) {
        const enfants = niveau, t = enfants.map(e => 4 + varint(e.cle).length);
        groupes = [];
        for (let a = 0; a < enfants.length;) {
          let b = a, pris = 0;
          while (b + 1 < enfants.length && pris + t[b] + 2 <= place - 12) { pris += t[b] + 2; b++; }
          groupes.push([a, b]);
          a = b + 1;
        }
        // pas de page intérieure sans cellule : le dernier groupe prend un enfant au précédent
        const d = groupes[groupes.length - 1];
        if (groupes.length > 1 && d[0] === d[1]) { groupes[groupes.length - 2][1]--; d[0]--; }
        niveau = groupes.map(([a, b]) => {
          const num = groupes.length === 1 && fixe ? fixe : nouvelle(), cellules = [];
          for (let i = a; i < b; i++) cellules.push(assembler([octetsEntier(enfants[i].num, 4), varint(enfants[i].cle)]));
          ecrirePage(num, 5, cellules, enfants[b].num);
          return { num, cle: enfants[b].cle };
        });
      }
      return niveau[0].num;
    }

    // b-tree d'un index : entrées triées (colonnes de l'index puis rowid) ; entre deux pages, une entrée monte dans la page du dessus
    function arbreIndex(entrees) {
      const recs = entrees.map(enregistrement), n = recs.length;
      const tf = recs.map(r => tailleCharge(r, MAX_INDEX));
      const place = PAGE - 8;
      // feuilles
      const feuilles = [];
      let seps = [];
      for (let a = 0; ;) {
        let b = a, pris = 0;
        while (b < n && (b === a || pris + tf[b] + 2 <= place)) { pris += tf[b] + 2; b++; }
        if (b >= n) { feuilles.push([a, n]); break; }
        if (b + 1 === n) b--;                                    // la dernière feuille ne reste jamais vide
        feuilles.push([a, b]);
        seps.push(b);
        a = b + 1;
      }
      let enfants = feuilles.map(([a, b]) => {
        const num = nouvelle(), cellules = [];
        for (let i = a; i < b; i++) cellules.push(assembler(charge(recs[i], MAX_INDEX)));
        ecrirePage(num, 10, cellules);
        return num;
      });
      // pages intérieures : cellules [page de gauche][entrée séparatrice], la dernière page à droite
      while (enfants.length > 1) {
        const m = enfants.length - 1, haut = [], nouveaux = [];
        const ecrire = (a, b) => {
          const num = nouvelle(), cellules = [];
          for (let j = a; j < b; j++) cellules.push(assembler([octetsEntier(enfants[j], 4)].concat(charge(recs[seps[j]], MAX_INDEX))));
          ecrirePage(num, 2, cellules, enfants[b]);
          nouveaux.push(num);
        };
        for (let a = 0; ;) {
          let b = a, pris = 0;
          while (b < m && (b === a || pris + 4 + tf[seps[b]] + 2 <= PAGE - 12)) { pris += 4 + tf[seps[b]] + 2; b++; }
          if (b >= m) { ecrire(a, m); break; }
          if (b + 1 === m) b--;                                  // le dernier groupe garde au moins une cellule
          ecrire(a, b);
          haut.push(seps[b]);
          a = b + 1;
        }
        enfants = nouveaux;
        seps = haut;
      }
      return enfants[0];
    }

    // tables, index, puis le schéma à la page 1
    const schema = [];
    tables.forEach(t => {
      schema.push(['table', t.nom, t.nom, arbreTable(t.lignes), t.sql]);
      (t.index || []).forEach(x => {
        const entrees = t.lignes.map(l => x.colonnes.map(c => l[1][c]).concat([l[0]])).sort(comparer);
        schema.push(['index', x.nom, t.nom, arbreIndex(entrees), x.sql]);
      });
    });
    arbreTable(schema.map((s, i) => [i + 1, s]), 1);

    // en-tête du fichier (100 premiers octets de la page 1)
    const p = pages[0];
    p.set(utf8('SQLite format 3'), 0);
    ecrire16(p, 16, PAGE);
    p[18] = 1; p[19] = 1; p[20] = 0; p[21] = 64; p[22] = 32; p[23] = 32;
    ecrire32(p, 24, 1);                                          // compteur de modifications
    ecrire32(p, 28, pages.length);                               // nombre de pages
    ecrire32(p, 40, 1);                                          // version du schéma
    ecrire32(p, 44, 4);                                          // format du schéma
    ecrire32(p, 56, 1);                                          // textes en UTF-8
    ecrire32(p, 92, 1);                                          // = compteur de modifications
    ecrire32(p, 96, 3045001);                                    // version de SQLite
    return assembler(pages);
  }

  /* ============================================================
     ARCHIVE ZIP (fichiers stockés sans compression)
     ============================================================ */
  // fichiers : [{ nom, octets }]
  function archive(fichiers) {
    const d = new Date();
    const heure = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1);
    const jour = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
    const locaux = [], central = [];
    let pos = 0;
    fichiers.forEach(f => {
      const nom = utf8(f.nom), crc = crc32(f.octets), n = f.octets.length;
      // en-tête local
      const l = new Uint8Array(30), v = new DataView(l.buffer);
      v.setUint32(0, 0x04034b50, true); v.setUint16(4, 20, true);
      v.setUint16(10, heure, true); v.setUint16(12, jour, true);
      v.setUint32(14, crc, true); v.setUint32(18, n, true); v.setUint32(22, n, true);
      v.setUint16(26, nom.length, true);
      locaux.push(l, nom, f.octets);
      // entrée du répertoire central
      const c = new Uint8Array(46), w = new DataView(c.buffer);
      w.setUint32(0, 0x02014b50, true); w.setUint16(4, 20, true); w.setUint16(6, 20, true);
      w.setUint16(12, heure, true); w.setUint16(14, jour, true);
      w.setUint32(16, crc, true); w.setUint32(20, n, true); w.setUint32(24, n, true);
      w.setUint16(28, nom.length, true); w.setUint32(42, pos, true);
      central.push(c, nom);
      pos += 30 + nom.length + n;
    });
    let taille = 0;
    central.forEach(x => { taille += x.length; });
    // fin du répertoire central
    const fin = new Uint8Array(22), e = new DataView(fin.buffer);
    e.setUint32(0, 0x06054b50, true);
    e.setUint16(8, fichiers.length, true); e.setUint16(10, fichiers.length, true);
    e.setUint32(12, taille, true); e.setUint32(16, pos, true);
    return assembler(locaux.concat(central, [fin]));
  }

  /* ============================================================
     PRÉSENTATION DES CARTES DANS ANKI
     ============================================================ */
  // couleurs et police du thème (assets/theme.css), lues dans la page : aucune couleur n'est écrite ici
  function theme() {
    const html = document.documentElement, avant = html.getAttribute('data-matiere');
    const lire = noms => { const s = getComputedStyle(html), o = {}; noms.forEach(n => { o[n] = s.getPropertyValue('--' + n).trim(); }); return o; };
    const ACCENT = ['accent-ink', 'cle-bg', 'cle-line'];
    const t = { base: lire(['ink', 'ink-2', 'sheet', 'paper', 'paper-3', 'line-strong', 'font-sans']), ici: lire(ACCENT), matieres: {} };
    // accent de chaque matière : data-matiere changé le temps de la lecture, transitions coupées (la page ne bouge pas)
    const gel = document.createElement('style');
    gel.textContent = '*, *::before, *::after { transition: none !important; }';
    document.head.appendChild(gel);
    MATIERES.forEach(m => { html.setAttribute('data-matiere', m); t.matieres[m] = lire(ACCENT); });
    if (avant === null) html.removeAttribute('data-matiere'); else html.setAttribute('data-matiere', avant);
    lire(ACCENT);
    gel.remove();
    return t;
  }
  // feuille de style du type de note : la fiche du site (règles reprises de assets/revisions.css)
  function feuilleDeStyle(th) {
    const b = th.base;
    const accent = v => `--accent-ink: ${v['accent-ink']}; --cle-bg: ${v['cle-bg']}; --cle-line: ${v['cle-line']};`;
    return [
      '/* Flashcards Physique-Chimie : la fiche du site (couleurs et police du thème) */',
      '.card { margin: 0; padding: 12px; text-align: left; }',
      `.pc-carte { --ink: ${b.ink}; --ink-2: ${b['ink-2']}; --sheet: ${b.sheet}; --paper: ${b.paper}; --paper-3: ${b['paper-3']}; --line-strong: ${b['line-strong']}; ${accent(th.ici)}`,
      '  box-sizing: border-box; max-width: 680px; min-height: 280px; margin: 0 auto; padding: 18px 24px 20px;',
      '  display: flex; flex-direction: column; gap: 14px; background: var(--sheet); color: var(--ink);',
      `  border: 1px solid var(--line-strong); border-radius: 22px; font-family: ${b['font-sans']}; font-size: 1rem; line-height: 1.5; text-align: left; }`,
      ...MATIERES.map(m => `.pc-carte.${m} { ${accent(th.matieres[m])} }`),
      '.pc-carte .rev-tete { display: flex; align-items: center; gap: 8px; padding-bottom: 10px; border-bottom: 2px solid var(--cle-line); font-size: .8rem; font-weight: 700; color: var(--ink-2); }',
      '.pc-carte .rev-ou { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }',
      '.pc-carte .rev-type { flex-shrink: 0; background: var(--cle-bg); color: var(--accent-ink); border-radius: 999px; padding: 3px 10px; font-size: .72rem; font-weight: 800; letter-spacing: .04em; text-transform: uppercase; }',
      '.pc-carte .rev-sens { flex-shrink: 0; color: var(--ink-2); font-weight: 800; }',
      '.pc-carte .rev-corps { flex: 1; display: flex; flex-direction: column; justify-content: center; gap: 12px; min-width: 0; }',
      '.pc-carte .rev-q { font-size: 1.32rem; font-weight: 700; line-height: 1.35; letter-spacing: -.01em; text-align: center; text-wrap: balance; }',
      '.pc-carte .rev-q small { display: block; margin-top: 6px; font-size: .9rem; font-weight: 600; color: var(--ink-2); }',
      '.pc-carte .rev-q .rev-formule { margin-bottom: 8px; }',
      '.pc-carte .rev-outils { display: flex; justify-content: center; align-items: center; gap: 8px; margin: 10px 0 0; font-size: .85rem; font-weight: 700; color: var(--ink-2); }',
      '.pc-carte .rev-outils img { width: 30px; height: 30px; }',
      // rappel de la question au verso : son texte seul, sans figure ni tableau (comme REV.texteQ)
      '.pc-carte .rev-rappel { font-size: .88rem; font-weight: 600; color: var(--ink-2); line-height: 1.4; }',
      '.pc-carte .rev-rappel p, .pc-carte .rev-rappel div, .pc-carte .rev-rappel ol, .pc-carte .rev-rappel ul, .pc-carte .rev-rappel li { display: inline; margin: 0; padding: 0; }',
      '.pc-carte .rev-rappel .rev-fig, .pc-carte .rev-rappel .rev-defile, .pc-carte .rev-rappel img, .pc-carte .rev-rappel table, .pc-carte .rev-rappel small, .pc-carte .rev-rappel .rev-outils { display: none; }',
      '.pc-carte .rev-rappel .rev-formule { display: inline; padding: 0; background: none; font: inherit; }',
      '.pc-carte .rev-rappel .rev-formule::after { content: " : "; }',
      '.pc-carte #answer { margin: 0; border: none; border-top: 1px dashed var(--line-strong); }',
      '.pc-carte .rev-rep { font-size: 1.05rem; line-height: 1.5; }',
      '.pc-carte .rev-rep p { margin: 0; }',
      '.pc-carte .rev-rep p + p { margin-top: 6px; }',
      '.pc-carte .rev-rep ol, .pc-carte .rev-rep ul { margin: 0; padding-left: 1.3em; display: grid; gap: 4px; }',
      '.pc-carte .rev-formule { font-size: 1.45rem; font-weight: 800; text-align: center; letter-spacing: -.01em; padding: 10px; background: var(--cle-bg); border-radius: 14px; margin: 0; }',
      '.pc-carte .rev-unites { text-align: center; color: var(--ink-2); font-size: .95rem; }',
      '.pc-carte .rev-fig { max-width: 520px; width: 100%; margin: 0 auto; }',
      '.pc-carte .rev-fig img { display: block; max-width: 100%; height: auto; margin: 0 auto; }',
      '.pc-carte .rev-defile { overflow-x: auto; -webkit-overflow-scrolling: touch; max-width: 100%; }',
      '.pc-carte .rev-tab { border-collapse: collapse; font-size: .92rem; margin: 0 auto; }',
      '.pc-carte .rev-tab td, .pc-carte .rev-tab th { border: 1px solid var(--paper-3); padding: 6px 10px; text-align: left; }',
      '.pc-carte .rev-tab th { background: var(--paper); }',
      '@media (max-width: 600px) {',
      '  .card { padding: 6px; }',
      '  .pc-carte { padding: 14px 16px 12px; min-height: 240px; border-radius: 18px; }',
      '  .pc-carte .rev-q { font-size: 1.15rem; }',
      '  .pc-carte .rev-formule { font-size: 1.2rem; }',
      '}',
    ].join('\n');
  }
  // modèles de cartes : en-tête comme sur le site (« Chapitre 11 · Module 1 », sens, type), question ; au verso, rappel puis réponse
  const tete = sens => '<div class="rev-tete"><span class="rev-ou">{{Chapitre}} · {{Module}}</span>' +
    (sens === 2 ? '<span class="rev-sens">⇄ 2/2</span>' : '{{#Question 2}}<span class="rev-sens">⇄ 1/2</span>{{/Question 2}}') +
    '<span class="rev-type">{{Type}}</span></div>';
  const recto = (sens, q) => `<div class="pc-carte {{Matière}}">${tete(sens)}<div class="rev-corps"><div class="rev-q">{{${q}}}</div></div></div>`;
  const verso = (sens, q, r) => `<div class="pc-carte {{Matière}}">${tete(sens)}<div class="rev-corps"><div class="rev-rappel">{{${q}}}</div><hr id="answer"><div class="rev-rep">{{${r}}}</div></div></div>`;
  const MODELES = [
    { nom: 'Sens 1', recto: recto(1, 'Question'), verso: verso(1, 'Question', 'Réponse') },
    // carte créée seulement si la note a un second sens
    { nom: 'Sens 2', recto: '{{#Question 2}}' + recto(2, 'Question 2') + '{{/Question 2}}', verso: verso(2, 'Question 2', 'Réponse 2') },
  ];

  /* ============================================================
     CONTENU DES CHAMPS
     ============================================================ */
  // remplace chaque figure SVG d'un champ par une image jointe (fichier .svg autonome, même police que le site)
  function joindreFigures(html, dossier, medias, police) {
    if (html.indexOf('<svg') < 0) return html;
    const t = document.createElement('template');
    t.innerHTML = html;
    Array.from(t.content.querySelectorAll('svg')).filter(s => !(s.parentElement && s.parentElement.closest('svg'))).forEach(s => {
      const svg = s.cloneNode(true);
      if (!svg.getAttribute('font-family')) svg.setAttribute('font-family', police);
      const octets = utf8('<?xml version="1.0" encoding="UTF-8"?>\n' + new XMLSerializer().serializeToString(svg));
      const nom = 'pc-' + dossier + '-' + sha1(octets).slice(0, 12) + '.svg';
      medias.set(nom, octets);
      const img = document.createElement('img');
      img.setAttribute('src', nom);
      if (s.getAttribute('aria-label')) img.setAttribute('alt', s.getAttribute('aria-label'));
      s.replaceWith(img);
    });
    return t.innerHTML;
  }
  // texte d'un champ sans balises, les images remplacées par leur nom (champ de tri et somme de contrôle d'Anki)
  function texteBrut(html) {
    const t = document.createElement('template');
    t.innerHTML = html;
    t.content.querySelectorAll('img').forEach(i => i.replaceWith(' ' + (i.getAttribute('src') || '') + ' '));
    return t.content.textContent;
  }
  // identifiant stable tiré d'un texte (paquets Anki)
  const idDe = s => 1e12 + parseInt(sha1(utf8(s)).slice(0, 10), 16) % 1e12;

  /* ============================================================
     COLLECTION ANKI (schéma 11) ET PAQUET .apkg
     ============================================================ */
  const deckAnki = (id, nom, mod) => ({
    id, name: nom, mod, usn: 0, lrnToday: [0, 0], revToday: [0, 0], newToday: [0, 0], timeToday: [0, 0],
    collapsed: false, browserCollapsed: false, desc: '', dyn: 0, conf: 1, extendNew: 0, extendRev: 0,
  });
  // options de révision par défaut d'Anki (le paquet importé garde celles de l'élève)
  const OPTIONS = {
    id: 1, name: 'Default', mod: 0, usn: 0, maxTaken: 60, autoplay: true, timer: 0, replayq: true, dyn: false,
    new: { bury: false, delays: [1, 10], initialFactor: 2500, ints: [1, 4, 0], order: 1, perDay: 20 },
    lapse: { delays: [10], leechAction: 1, leechFails: 8, minInt: 1, mult: 0 },
    rev: { bury: false, ease4: 1.3, ivlFct: 1, maxIvl: 36500, perDay: 200, hardFactor: 1.2 },
  };

  function paquet(app) {
    const maintenant = Date.now(), s = Math.floor(maintenant / 1000);
    const th = theme(), medias = new Map();
    const nomChap = RACINE + '::' + app.titre, idChap = idDe(nomChap), idRacine = idDe(RACINE);
    const types = (window.REV && window.REV.TYPES) || {};

    // une note par carte du site, une carte Anki par sens
    const notes = [], cartes = [];
    let idCarte = maintenant;
    app.cartes.forEach((c, i) => {
      const f = c.faces, champ = h => joindreFigures(h || '', app.dossier, medias, th.base['font-sans']);
      // ligne « Utiliser » (crayon, calculatrice) à la fin de la question : icônes en fichiers joints, couleur du thème
      const outils = s => (window.REV && window.REV.outils ? window.REV.outils(c, s).replace(/currentColor/g, th.base['ink-2']) : '');
      const valeurs = [champ(f[0].q + outils(0)), champ(f[0].r), f[1] ? champ(f[1].q + outils(1)) : '', f[1] ? champ(f[1].r) : '',
        app.court, 'Module ' + c.paquet.module, c.paquet.titre, types[c.type] || c.type, c.competence || '', app.matiere || ''];
      const tri = texteBrut(champ(f[0].q)), nid = maintenant + i + 1;
      const etiquettes = ' ' + RACINE + '::' + app.dossier + '::Module_' + c.paquet.module + ' ';
      // notes : id, guid, mid, mod, usn, tags, flds, sfld, csum, flags, data
      notes.push([nid, [null, 'physique-chimie:' + c.id, ID_TYPE, s, 0, etiquettes, valeurs.join('\x1f'), tri, parseInt(sha1(utf8(tri)).slice(0, 8), 16), 0, '']]);
      // cartes : id, nid, did, ord, mod, usn, type, queue, due (rang des nouvelles), ivl, factor, reps, lapses, left, odue, odid, flags, data
      f.slice(0, 2).forEach((x, ord) => cartes.push([++idCarte, [null, nid, idChap, ord, s, 0, 0, 0, i + 1, 0, 0, 0, 0, 0, 0, 0, 0, '']]));
    });

    // type de note
    const modele = {
      id: ID_TYPE, name: NOM_TYPE, type: 0, mod: s, usn: 0, sortf: 0, did: idChap,
      tmpls: MODELES.map((m, ord) => ({ name: m.nom, ord, qfmt: m.recto, afmt: m.verso, bqfmt: '', bafmt: '', did: null, bfont: '', bsize: 0 })),
      flds: CHAMPS.map((nom, ord) => ({ name: nom, ord, sticky: false, rtl: false, font: 'Arial', size: 20, media: [] })),
      css: feuilleDeStyle(th),
      latexPre: '\\documentclass[12pt]{article}\n\\special{papersize=3in,5in}\n\\usepackage[utf8]{inputenc}\n\\usepackage{amssymb,amsmath}\n\\pagestyle{empty}\n\\setlength{\\parindent}{0in}\n\\begin{document}\n',
      latexPost: '\\end{document}', latexsvg: false,
      req: [[0, 'any', [0]], [1, 'all', [2]]], tags: [], vers: [],
    };
    const decks = {};
    decks[1] = deckAnki(1, 'Default', s);
    decks[idRacine] = deckAnki(idRacine, RACINE, s);
    decks[idChap] = deckAnki(idChap, nomChap, s);
    const conf = {
      nextPos: app.cartes.length + 1, estTimes: true, activeDecks: [idChap], sortType: 'noteFld', timeLim: 0, sortBackwards: false,
      addToCur: true, curDeck: idChap, newSpread: 0, dueCounts: true, curModel: String(ID_TYPE), collapseTime: 1200,
    };
    const jour = new Date(); jour.setHours(4, 0, 0, 0);

    const base = baseSQLite([
      { nom: 'col', sql: 'CREATE TABLE col (id integer primary key, crt integer not null, mod integer not null, scm integer not null, ver integer not null, dty integer not null, usn integer not null, ls integer not null, conf text not null, models text not null, decks text not null, dconf text not null, tags text not null)',
        lignes: [[1, [null, Math.floor(jour.getTime() / 1000), maintenant, maintenant, 11, 0, 0, 0,
          JSON.stringify(conf), JSON.stringify({ [ID_TYPE]: modele }), JSON.stringify(decks), JSON.stringify({ 1: OPTIONS }), '{}']]] },
      { nom: 'notes', sql: 'CREATE TABLE notes (id integer primary key, guid text not null, mid integer not null, mod integer not null, usn integer not null, tags text not null, flds text not null, sfld integer not null, csum integer not null, flags integer not null, data text not null)',
        lignes: notes,
        index: [{ nom: 'ix_notes_usn', sql: 'CREATE INDEX ix_notes_usn on notes (usn)', colonnes: [4] },
                { nom: 'ix_notes_csum', sql: 'CREATE INDEX ix_notes_csum on notes (csum)', colonnes: [8] }] },
      { nom: 'cards', sql: 'CREATE TABLE cards (id integer primary key, nid integer not null, did integer not null, ord integer not null, mod integer not null, usn integer not null, type integer not null, queue integer not null, due integer not null, ivl integer not null, factor integer not null, reps integer not null, lapses integer not null, left integer not null, odue integer not null, odid integer not null, flags integer not null, data text not null)',
        lignes: cartes,
        index: [{ nom: 'ix_cards_usn', sql: 'CREATE INDEX ix_cards_usn on cards (usn)', colonnes: [5] },
                { nom: 'ix_cards_nid', sql: 'CREATE INDEX ix_cards_nid on cards (nid)', colonnes: [1] },
                { nom: 'ix_cards_sched', sql: 'CREATE INDEX ix_cards_sched on cards (did, queue, due)', colonnes: [2, 7, 8] }] },
      { nom: 'revlog', sql: 'CREATE TABLE revlog (id integer primary key, cid integer not null, usn integer not null, ease integer not null, ivl integer not null, lastIvl integer not null, factor integer not null, time integer not null, type integer not null)',
        lignes: [],
        index: [{ nom: 'ix_revlog_usn', sql: 'CREATE INDEX ix_revlog_usn on revlog (usn)', colonnes: [2] },
                { nom: 'ix_revlog_cid', sql: 'CREATE INDEX ix_revlog_cid on revlog (cid)', colonnes: [1] }] },
      { nom: 'graves', sql: 'CREATE TABLE graves (usn integer not null, oid integer not null, type integer not null)', lignes: [] },
    ]);

    // archive : la collection, la liste des fichiers joints, puis les fichiers (nommés 0, 1, 2…)
    const liste = {}, fichiers = [{ nom: 'collection.anki2', octets: base }];
    Array.from(medias.keys()).forEach((nom, i) => { liste[i] = nom; fichiers.push({ nom: String(i), octets: medias.get(nom) }); });
    fichiers.splice(1, 0, { nom: 'media', octets: utf8(JSON.stringify(liste)) });
    return archive(fichiers);
  }

  window.ANKI = { paquet, nomFichier: app => 'flashcards-' + app.dossier + '.apkg' };
})();
