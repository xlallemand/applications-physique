/* ============================================================
   ORGA : moteur partagé de chimie organique — dessin (SVG)
   À charger après assets/orga.js ; styles : assets/orga.css ;
   couleurs de marquage : variables --orga-* de assets/theme.css.

   Trois écritures : 'developpee' (formule de Lewis), 'semi', 'topo'.

   API
     ORGA.disposer(mol, ecriture, o)   disposition automatique → positions (unités de liaison, y vers le haut)
                                       o.chaine : atomes de la chaîne à mettre à l'horizontale
     ORGA.scene(mol, ecriture, o)      géométrie du dessin (px) : atomes, étiquettes, H, liaisons…
     ORGA.dessinHTML(mol, o)           code SVG (dans un conteneur défilant)
     ORGA.dessiner(zone, mol, o)       dessine dans zone ; renvoie { svg, scene }
       o.ecriture   'developpee' | 'semi' | 'topo' (défaut 'semi')
       o.couleurs   { chaine, r1, r2, r3, r4, groupe } : atomes à colorer
       o.numeros    atomes de la chaîne principale dans l'ordre de la numérotation
       o.entourer   true (groupes de ORGA.groupes, numérotés s'il y en a plusieurs)
                    ou [{ atomes, avecH, numero }]
       o.doublets   false : pas de doublets non liants en développée
       o.label      texte de aria-label (défaut : formule brute)
       atomes { el, etiq } (ORGA.condenser) : étiquette condensée (C₂H₅…), expliquée sous le dessin (bulle ⓘ)
     ORGA.nomHTML(parties)             nom en couleurs : [['2-', 'r1'], ['méthyl', 'r1'], ['pentane', 'chaine']]
     ORGA.legendeHTML(groupes)         « groupe hydroxyle (alcools) », numérotés
     ORGA.editeur(zone, o)             éditeur de molécules (voir plus bas) ; façon d'ajouter un atome : ORGA.GLISSER
     ORGA.conversion(zone, o)          passer d'une écriture à l'autre par les gestes du cours
     ORGA.bulle(conteneur, x, y, options, choisir)   bulle de choix (au toucher)
     ORGA.info(html, label)            bouton ⓘ qui ouvre une bulle d'aide au toucher ; ORGA.BULLES : règles du cours
     ORGA.dessinActif(zone, mol, o)    dessin dont on touche les atomes (outils ci-dessous)

   Parties de question 'perso' (p.monter(zone, api) : api.reussi(note), api.erreur(h), api.message(h),
   api.effacer(), api.compterErreur(), api.fini() ; renvoie { montrer() }) :
     ORGA.partieEntourer(mol, o)       entourer les groupes caractéristiques (toucher les atomes, Valider)
     ORGA.partiesNommerGroupes(mol)    parties 'choix' : « groupe … · famille des … » pour chaque sorte de groupe
     ORGA.partieChaine(mol, o)         toucher la chaîne principale
     ORGA.partieNom(mol, o)            nommer, avec les aides (couleurs, nom découpé, bulles) ; o.cleAides : clé localStorage
     ORGA.partieDessin(mol, o)         dessiner dans l'éditeur (o.nom : du nom au dessin, nom en direct)
     ORGA.partieH(mol, o)              compléter les H d'une formule
     ORGA.partieConversion(mol, de, vers, o)   changer d'écriture par les gestes du cours
   ============================================================ */
(function () {
  'use strict';
  const O = window.ORGA;

  /* ============================================================
     GÉOMÉTRIE
     ============================================================ */
  const RAD = Math.PI / 180;
  const n360 = a => ((a % 360) + 360) % 360;
  const n180 = a => { a = n360(a); return a > 180 ? a - 360 : a; };
  const ecart = (a, b) => Math.abs(n180(a - b));
  const vec = a => ({ x: Math.cos(a * RAD), y: Math.sin(a * RAD) });
  const angleDe = (p, q) => n360(Math.atan2(q.y - p.y, q.x - p.x) / RAD);
  const dist = (p, q) => Math.hypot(p.x - q.x, p.y - q.y);
  const r1 = x => Math.round(x * 10) / 10;

  // les segments [a, b] et [c, d] se coupent-ils (hors extrémités communes) ?
  function croise(a, b, c, d) {
    const o = (p, q, r) => (q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x);
    const d1 = o(c, d, a), d2 = o(c, d, b), d3 = o(a, b, c), d4 = o(a, b, d);
    return ((d1 > 1e-6 && d2 < -1e-6) || (d1 < -1e-6 && d2 > 1e-6)) && ((d3 > 1e-6 && d4 < -1e-6) || (d3 < -1e-6 && d4 > 1e-6));
  }
  function distSegment(p, a, b) {
    const dx = b.x - a.x, dy = b.y - a.y, L2 = dx * dx + dy * dy || 1;
    const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / L2));
    return Math.hypot(p.x - a.x - t * dx, p.y - a.y - t * dy);
  }

  /* Échelles : px par unité de disposition. Semi-développée et développée
     se disposent sur une grille (x, y), la topologique en zigzag (liaison = 1). */
  const ECHELLES = {
    affichage: { topo: { x: 38, y: 38 }, semi: { x: 56, y: 44 }, developpee: { x: 62, y: 62 } },
    editeur:   { topo: { x: 52, y: 52 }, semi: { x: 70, y: 56 }, developpee: { x: 76, y: 76 } },
  };
  const POLICE = { affichage: 16, editeur: 18 };
  const NOM_EC = { developpee: 'Développée', semi: 'Semi-développée', topo: 'Topologique' };

  /* ============================================================
     DISPOSITION AUTOMATIQUE
     Chaîne la plus longue à l'horizontale (sans les O, N, halogènes en bout) ;
     ramifications de part et d'autre ; zigzag en topologique ; cycles réguliers.
     Placement des ramifications par essais successifs (sans chevauchement).
     ============================================================ */
  function disposer(mol, ec, o) {
    o = o || {};
    const n = mol.atomes.length, pos = new Array(n).fill(null);
    if (!n) return pos;
    const topo = ec === 'topo';
    const ech = o.echelle || ECHELLES.affichage[topo ? 'topo' : ec === 'developpee' ? 'developpee' : 'semi'];
    const adj = O.adjacence(mol);
    const ordres = new Map();
    mol.liaisons.forEach(l => { ordres.set(l.a + ',' + l.b, l.o); ordres.set(l.b + ',' + l.a, l.o); });
    const cyc = O.cycles(mol);
    const dansCycle = new Array(n).fill(null);
    cyc.forEach((c, k) => c.forEach(i => { if (dansCycle[i] === null) dansCycle[i] = k; }));
    const ctx = {
      mol, adj, pos, topo, ech, cyc, dansCycle, ordres,
      cyclePlace: cyc.map(() => false),
      tour: new Array(n).fill(0),       // sens du dernier virage du zigzag (+1 / −1)
      milieu: new Array(n).fill(false), // atome au milieu du squelette
      bout: new Array(n).fill(false),   // atome au bout du squelette
      cote: new Array(n).fill(0),       // semi : côté de la ramification (90 haut, 270 bas)
      aspect: ech.x / ech.y,
    };
    let decalage = 0;
    for (const comp of O.composantes(mol)) {
      disposerPartie(ctx, comp, o);
      // parties séparées : côte à côte
      const xs = comp.map(i => pos[i].x), mn = Math.min(...xs), mx = Math.max(...xs);
      comp.forEach(i => { pos[i].x += decalage - mn; });
      decalage += mx - mn + 2;
    }
    return pos;
  }

  const estSp = (ctx, i) => {
    const os = ctx.adj[i].map(v => v.o);
    return os.includes(3) || os.filter(x => x === 2).length >= 2;
  };

  // squelette : chaîne la plus longue (o.chaine : chaîne à garder entière si possible)
  function squelette(ctx, atomes, o) {
    const { mol, adj } = ctx, dans = new Set(atomes), ref = o.chaine;
    const hetTerm = i => mol.atomes[i].el !== 'C' && adj[i].length === 1;
    let permis = mol.atomes.map((a, i) => dans.has(i) && !hetTerm(i));
    if (!atomes.some(i => permis[i])) permis = mol.atomes.map((a, i) => dans.has(i));
    let best = null, bs = -1;
    for (const c of O.cheminsLesPlusLongs(mol, permis)) {
      let s = 0;
      for (let k = 0; k + 1 < c.length; k++) if (ctx.ordres.get(c[k] + ',' + c[k + 1]) > 1) s += 10;
      c.forEach((i, k) => { s += adj[i].length - (k === 0 || k === c.length - 1 ? 1 : 2); });
      if (ref) s += 100 * c.filter(i => ref.includes(i)).length;
      if (s > bs) { bs = s; best = c; }
    }
    return best;
  }

  function disposerPartie(ctx, atomes, o) {
    const { pos, adj, mol } = ctx;
    if (atomes.length === 1) { pos[atomes[0]] = { x: 0, y: 0 }; return; }
    const file = [];
    const cycles = ctx.cyc.map((c, k) => k).filter(k => atomes.includes(ctx.cyc[k][0]));
    if (cycles.length) {
      // cycle d'abord ; le premier atome substitué vers la droite
      const k = cycles[0], R = ctx.cyc[k], m = R.length;
      let ks = R.findIndex(i => adj[i].some(v => !R.includes(v.j)));
      const pas = 360 / m;
      let a0 = ks < 0 ? 90 : (ctx.topo ? 30 : 0) - ks * pas;
      if (ks < 0 && ctx.topo && m === 6) a0 = 90;
      placerCycle(ctx, k, { x: 0, y: 0 }, a0);
      file.push(...R);
    } else {
      const sq = squelette(ctx, atomes, o);
      placerSquelette(ctx, sq);
      file.push(...sq);
    }
    placerReste(ctx, file);
  }

  // rayon d'un cycle régulier de m atomes (côté = 1 en topo, ≈ 1,15 colonne en semi)
  function placerCycle(ctx, k, centre, a0) {
    const R = ctx.cyc[k], m = R.length, pas = 360 / m;
    const cote = ctx.topo ? 1 : 1.15;
    const ray = cote / (2 * Math.sin(Math.PI / m));
    R.forEach((i, j) => {
      if (ctx.pos[i]) return;
      const v = vec(a0 + j * pas);
      ctx.pos[i] = { x: centre.x + ray * v.x, y: centre.y + ray * v.y * (ctx.topo ? 1 : ctx.aspect) };
    });
    ctx.cyclePlace[k] = true;
  }

  function placerSquelette(ctx, sq) {
    const { pos, topo } = ctx;
    sq.forEach((i, k) => {
      ctx.milieu[i] = k > 0 && k < sq.length - 1;
      ctx.bout[i] = !ctx.milieu[i];
    });
    if (!topo) {
      sq.forEach((i, k) => { pos[i] = { x: k, y: 0 }; });
      // côté des ramifications : en alternance, d'abord en bas (=O toujours en haut)
      let bas = true;
      sq.forEach(i => {
        if (!ctx.milieu[i]) return;
        const enf = ctx.adj[i].filter(v => !sq.includes(v.j));
        if (enf.length !== 1) return;
        const oDouble = ctx.mol.atomes[enf[0].j].el === 'O' && enf[0].o === 2;
        if (oDouble) { ctx.cote[i] = 90; return; }
        ctx.cote[i] = bas ? 270 : 90;
        bas = !bas;
      });
      return;
    }
    pos[sq[0]] = { x: 0, y: 0 };
    let s = 1, dPrec = 30;
    const dirs = [];
    for (let k = 0; k + 1 < sq.length; k++) {
      let d;
      if (k > 0 && estSp(ctx, sq[k])) d = dPrec;
      else { d = 30 * s; s = -s; }
      const v = vec(d);
      pos[sq[k + 1]] = { x: pos[sq[k]].x + v.x, y: pos[sq[k]].y + v.y };
      dirs.push(d); dPrec = d;
    }
    // virages aux deux bouts (pour continuer le zigzag dans les groupes en bout de chaîne)
    const L = sq.length;
    if (L >= 3) {
      ctx.tour[sq[L - 1]] = Math.sign(n180(dirs[L - 2] - dirs[L - 3]));
      ctx.tour[sq[0]] = Math.sign(n180((dirs[0] + 180) - (dirs[1] + 180)));
    }
  }

  // directions idéales des enfants d'un atome (dans l'ordre des enfants)
  function ideaux(ctx, p, occ, enfants) {
    const k = enfants.length;
    const bissec = () => {
      const m = occ.map(vec).reduce((s, v) => ({ x: s.x + v.x, y: s.y + v.y }), { x: 0, y: 0 });
      return Math.hypot(m.x, m.y) < 1e-6 ? n360(occ[0] + 90) : n360(Math.atan2(-m.y, -m.x) / RAD);
    };
    if (!occ.length) return [0, 180, 90, 270].slice(0, k);
    if (ctx.topo) {
      if (occ.length === 1) {
        const din = n360(occ[0] + 180);
        if (estSp(ctx, p)) return k === 1 ? [din] : [din + 60, din - 60, din].slice(0, k);
        let t = ctx.tour[p];
        if (!t) { const ref = Math.cos(din * RAD) >= -1e-9 ? 0 : 180; t = Math.sign(n180(din - ref)) || 1; }
        const zz = din - 60 * t;
        if (k === 1) return [zz];
        if (k === 2) return [zz, din + 60 * t];
        return [zz, din + 60 * t, din];
      }
      const b = bissec();
      if (occ.length === 2) {
        if (k === 1) return [b];
        if (ctx.dansCycle[p] !== null) return [b + 30, b - 30];
        return [b, b + 180];
      }
      return [b];
    }
    // semi-développée, développée
    if (ctx.milieu[p] && occ.length === 2 && ctx.dansCycle[p] === null) {
      const c = ctx.cote[p] || 270;
      return k === 1 ? [c] : [c, c + 180];
    }
    if (occ.length === 1) {
      const din = n360(occ[0] + 180);
      if (ctx.bout[p]) {
        if (k === 1) return [din];
        // deux groupes au bout de la chaîne (acide, amide…) : en oblique, =O en haut
        const h = Math.sin((din + 60) * RAD) > 0 ? din + 60 : din - 60, b = h === din + 60 ? din - 60 : din + 60;
        if (k === 2) return [b, h];
        return [din, 90, 270];
      }
      if (k === 1) return [din];
      if (k === 2) return [din, din + 90];
      return [din, din + 90, din - 90];
    }
    const b = bissec();
    if (k === 1) return [b];
    return [b + 30, b - 30, b + 180].slice(0, k);
  }

  // taille d'une ramification (pour ordonner les enfants : la plus grosse continue la chaîne)
  function taille(ctx, i, p) {
    let t = 1;
    const vu = new Set([p, i]), pile = [i];
    while (pile.length) {
      const a = pile.pop();
      for (const v of ctx.adj[a]) if (!vu.has(v.j) && !ctx.pos[v.j]) { vu.add(v.j); pile.push(v.j); t++; }
    }
    return t;
  }

  function encombrement(ctx, q) {
    let s = 0;
    ctx.pos.forEach(r => { if (r) { const d = dist(r, q); s += 1 / Math.max(d * d, .05); } });
    return s;
  }

  function collision(ctx, p, q) {
    const seuil = ctx.topo ? .8 : .85;
    for (let i = 0; i < ctx.pos.length; i++) {
      const r = ctx.pos[i];
      if (r && dist(r, q) < seuil) return true;
    }
    const P = ctx.pos[p];
    for (const l of ctx.mol.liaisons) {
      const a = ctx.pos[l.a], b = ctx.pos[l.b];
      if (!a || !b) continue;
      if (distSegment(q, a, b) < .45) return true;
      if (l.a !== p && l.b !== p && croise(P, q, a, b)) return true;
    }
    return false;
  }

  // propositions de directions pour les enfants de p, classées
  function propositions(ctx, p, enfants) {
    const P = ctx.pos[p];
    const occ = ctx.adj[p].filter(v => ctx.pos[v.j]).map(v => angleDe(P, ctx.pos[v.j]));
    const ideal = ideaux(ctx, p, occ, enfants).map(n360);
    const ecartMin = ctx.topo ? 59 : 44;
    const deltas = [0, 30, -30, 60, -60, 90, -90, 120, -120, 180];
    const res = [], vus = new Set();
    const essai = (T, estIdeal) => {
      const cle = T.map(a => Math.round(a)).join(',');
      if (vus.has(cle)) return;
      vus.add(cle);
      const tout = occ.concat(T);
      for (let a = 0; a < tout.length; a++) for (let b = a + 1; b < tout.length; b++) if (ecart(tout[a], tout[b]) < ecartMin) return;
      let dev = 0, enc = 0;
      T.forEach((a, e) => {
        dev += ecart(a, ideal[e]);
        const v = vec(a); enc += encombrement(ctx, { x: P.x + v.x, y: P.y + v.y });
      });
      res.push({ T, score: dev * 10 + enc, estIdeal });
    };
    essai(ideal, true);
    const k = enfants.length;
    if (k === 1) deltas.forEach(d => essai([n360(ideal[0] + d)]));
    else if (k === 2) deltas.forEach(d0 => deltas.forEach(d1 => essai([n360(ideal[0] + d0), n360(ideal[1] + d1)])));
    else deltas.forEach(d0 => deltas.forEach(d1 => deltas.forEach(d2 => essai([n360(ideal[0] + d0), n360(ideal[1] + d1), n360(ideal[2] + d2)]))));
    const tete = res.length && res[0].estIdeal ? [res.shift()] : [];
    res.sort((a, b) => a.score - b.score);
    return tete.concat(res).slice(0, 10).map(r => r.T);
  }

  function placerReste(ctx, file) {
    let essais = 0;
    const MAX = 3000;
    const placerEnfant = (p, c, a) => {
      const P = ctx.pos[p], v = vec(a);
      const q = { x: P.x + v.x, y: P.y + v.y };
      ctx.pos[c] = q;
      const occ = ctx.adj[p].filter(w => w.j !== c && ctx.pos[w.j]).map(w => angleDe(P, ctx.pos[w.j]));
      ctx.tour[c] = occ.length === 1 ? Math.sign(n180(a - n360(occ[0] + 180))) : 0;
      const places = [c];
      // un cycle atteint par cet atome : on le place en entier
      const k = ctx.dansCycle[c];
      if (k !== null && !ctx.cyclePlace[k]) {
        const R = ctx.cyc[k], m = R.length, j0 = R.indexOf(c);
        const ray = (ctx.topo ? 1 : 1.15) / (2 * Math.sin(Math.PI / m));
        const centre = { x: q.x + ray * v.x, y: q.y + ray * v.y * (ctx.topo ? 1 : ctx.aspect) };
        const a0 = a + 180;
        R.forEach((i, j) => {
          if (ctx.pos[i]) return;
          const w = vec(a0 + ((j - j0 + m) % m) * 360 / m);
          ctx.pos[i] = { x: centre.x + ray * w.x, y: centre.y + ray * w.y * (ctx.topo ? 1 : ctx.aspect) };
          places.push(i);
        });
        ctx.cyclePlace[k] = true;
      }
      return places;
    };
    const retirer = places => places.forEach(i => {
      ctx.pos[i] = null;
      const k = ctx.dansCycle[i];
      if (k !== null) ctx.cyclePlace[k] = false;
    });

    function recur(idx, tolerant) {
      if (idx === file.length) return true;
      const p = file[idx];
      let enfants = ctx.adj[p].filter(v => !ctx.pos[v.j]).map(v => v.j);
      if (!enfants.length) return recur(idx + 1, tolerant);
      enfants.sort((a, b) => taille(ctx, b, p) - taille(ctx, a, p) || ctx.ordres.get(p + ',' + a) - ctx.ordres.get(p + ',' + b));
      let props = propositions(ctx, p, enfants);
      if (tolerant) {
        const libre = props.find(T => enfants.every((c, e) => { const v = vec(T[e]), P = ctx.pos[p]; return !collision(ctx, p, { x: P.x + v.x, y: P.y + v.y }); }));
        if (libre) props = [libre].concat(props.filter(T => T !== libre));
      }
      for (const T of props) {
        if (++essais > MAX && !tolerant) return false;
        const places = [];
        let ok = true;
        for (let e = 0; e < enfants.length; e++) {
          if (ctx.pos[enfants[e]]) continue;     // déjà placé (cycle)
          const v = vec(T[e]), P = ctx.pos[p];
          const q = { x: P.x + v.x, y: P.y + v.y };
          if (!tolerant && collision(ctx, p, q)) { ok = false; break; }
          places.push(...placerEnfant(p, enfants[e], T[e]));
        }
        if (ok) {
          const avant = file.length;
          file.push(...places);
          if (recur(idx + 1, tolerant)) return true;
          file.length = avant;
        }
        retirer(places);
        if (tolerant) break;
      }
      if (tolerant) {
        // dernier recours : première proposition, même avec chevauchement
        const T = props[0] || enfants.map((e, k) => k * 120);
        const places = [];
        enfants.forEach((c, e) => { if (!ctx.pos[c]) places.push(...placerEnfant(p, c, T[e])); });
        file.push(...places);
        return recur(idx + 1, tolerant);
      }
      return false;
    }
    const sauve = file.slice();
    if (!recur(0, false)) {
      // échec : on recommence en acceptant les chevauchements
      ctx.pos.forEach((r, i) => { if (!sauve.includes(i)) ctx.pos[i] = null; });
      ctx.cyclePlace = ctx.cyclePlace.map((x, k) => ctx.cyc[k].every(i => ctx.pos[i]));
      file.length = 0; file.push(...sauve);
      recur(0, true);
    }
  }

  /* ============================================================
     SCÈNE : géométrie du dessin en px (y vers le bas)
     ============================================================ */
  // largeurs approchées des lettres (en fraction de la taille de police)
  const LARG = { C: .68, N: .74, O: .78, F: .58, Cl: .92, Br: .98, I: .32, H: .74 };
  const LARG_IND = .44;

  // texte d'une étiquette condensée (C2H5, (CH2)5…) : morceaux [texte, indice ?]
  function morceauxEtiq(t) {
    const r = [];
    for (const m of String(t).match(/\d+|[^\d]+/g) || []) {
      const ind = /^\d/.test(m) && r.length && /[A-Za-z)]$/.test(r[r.length - 1][0]);
      r.push([m, ind]);
    }
    return r;
  }
  const largeurEtiq = (t, f) => morceauxEtiq(t).reduce((s, [m, ind]) => s + [...m].reduce((a, c) => a + (ind ? LARG_IND : /[()]/.test(c) ? .36 : LARG[c] || (/[a-z]/.test(c) ? .5 : .7)), 0), 0) * f;
  // formule écrite en HTML : C2H5 → C<sub>2</sub>H<sub>5</sub>
  const formuleHTML = t => morceauxEtiq(t).map(([m, ind]) => (ind ? `<sub>${m}</sub>` : m)).join('');
  function boiteEtiq(t, f) {
    const w = largeurEtiq(t, f), ind = morceauxEtiq(t).some(x => x[1]);
    return { x1: -w / 2, x2: w / 2, y1: -.42 * f, y2: (ind ? .62 : .4) * f, we: w, ex1: -w / 2, ex2: w / 2, ey1: -.42 * f, ey2: .4 * f };
  }

  function boite(el, nh, cote, f) {
    const we = (LARG[el] || .72) * f, wh = nh ? (LARG.H + (nh > 1 ? LARG_IND : 0)) * f : 0;
    const y1 = -.42 * f, y2 = (nh > 1 ? .62 : .4) * f, e = { ex1: -we / 2, ex2: we / 2, ey1: -.42 * f, ey2: .4 * f };
    return Object.assign(cote === 'g' ? { x1: -we / 2 - wh, x2: we / 2, y1, y2, we } : { x1: -we / 2, x2: we / 2 + wh, y1, y2, we }, e);
  }

  // côté des H d'une étiquette : à gauche (H3C, HO) si les liaisons partent seulement vers la droite
  function coteH(px, adj, i) {
    let droite = false, gauche = false;
    for (const v of adj[i]) {
      const dx = px[v.j].x - px[i].x, d = Math.hypot(dx, px[v.j].y - px[i].y) || 1;
      if (dx / d > .3) droite = true;
      if (dx / d < -.3) gauche = true;
    }
    return droite && !gauche ? 'g' : 'd';
  }

  // distance du centre p à la sortie de la boîte bt (relative à p), le long de p → q
  function sortie(p, q, bt, marge) {
    if (!bt) return 0;
    const dx = q.x - p.x, dy = q.y - p.y, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L, m = marge == null ? 2.5 : marge;
    // liaison presque verticale : elle part de la lettre de l'élément (pas des H écrits à côté)
    const b = Math.abs(uy) > .8 && bt.ex1 != null ? { x1: bt.ex1, x2: bt.ex2, y1: bt.ey1, y2: bt.ey2 } : bt;
    const tx = ux > 1e-9 ? (b.x2 + m) / ux : ux < -1e-9 ? (b.x1 - m) / ux : Infinity;
    const ty = uy > 1e-9 ? (b.y2 + m) / uy : uy < -1e-9 ? (b.y1 - m) / uy : Infinity;
    return Math.min(tx, ty);
  }

  const PRIO = ['groupe', 'r1', 'r2', 'r3', 'r4', 'chaine'];

  function scene(mol, ec, o) {
    o = o || {};
    const n = mol.atomes.length;
    const usage = o.editeur ? 'editeur' : 'affichage';
    const f = o.police || POLICE[usage];
    const ech = o.echelle || ECHELLES[usage][ec];
    const pos = o.px ? null : (o.pos || disposer(mol, ec, Object.assign({}, o, { echelle: ech })));
    const px = o.px ? o.px.map(p => ({ x: p.x, y: p.y })) : pos.map(p => ({ x: p.x * ech.x, y: -p.y * ech.y }));
    // étiquette condensée plus large qu'une case : on écarte les atomes de part et d'autre
    if (!o.px && ec !== 'topo') mol.atomes.forEach((a, i) => {
      if (!a.etiq) return;
      const extra = largeurEtiq(a.etiq, f) - .5 * ech.x;
      if (extra <= 0) return;
      const x0 = px[i].x;
      px.forEach((q, j) => { if (j !== i) { if (q.x > x0 + 1) q.x += extra / 2; else if (q.x < x0 - 1) q.x -= extra / 2; } });
    });
    const adj = O.adjacence(mol);
    const dev = ec === 'developpee';
    const hDe = i => (mol.atomes[i].etiq ? 0 : o.h ? (o.h[i] == null ? null : o.h[i]) : O.nbH(mol, i));

    // ensembles colorés
    const ens = {};
    if (o.couleurs) for (const c of PRIO) if (o.couleurs[c]) ens[c] = new Set(o.couleurs[c]);
    const classeAt = i => { for (const c of PRIO) if (ens[c] && ens[c].has(i)) return c; return ''; };
    const classeLi = (a, b) => {
      for (const c of PRIO) if (ens[c] && ens[c].has(a) && ens[c].has(b)) return c;
      const ca = classeAt(a), cb = classeAt(b);
      const rang = c => (c.startsWith('r') ? 0 : c === 'groupe' ? 1 : c === 'chaine' ? 2 : 3);
      return rang(ca) <= rang(cb) ? (ca === 'chaine' ? '' : ca) : (cb === 'chaine' ? '' : cb);
    };

    // étiquettes
    const etiq = new Array(n).fill(null);
    for (let i = 0; i < n; i++) {
      const el = mol.atomes[i].el;
      const replie = dev && o.replies && o.replies.has(i);
      let visible = !!mol.atomes[i].etiq || !(ec === 'topo' && el === 'C' && adj[i].length && !(o.etiqueter && o.etiqueter.has(i)));
      if (o.masquer && o.masquer.has(i)) visible = false;
      if (!visible) continue;
      let nh = dev && !replie ? 0 : hDe(i);
      const manque = nh == null;
      if (manque) nh = 0;
      const cote = coteH(px, adj, i);
      const t = mol.atomes[i].etiq;
      etiq[i] = t ? { el, nh: 0, cote: 'd', manque: false, texte: t, boite: boiteEtiq(t, f), classe: classeAt(i) }
        : { el, nh, cote, manque, boite: boite(el, nh, cote, f), classe: classeAt(i) };
    }

    // H et doublets non liants de la développée
    const H = [], doublets = [];
    if (dev) {
      const dH = .52 * ech.x;
      const pris = px.slice();
      for (let i = 0; i < n; i++) {
        if (o.replies && o.replies.has(i)) continue;
        const nh = hDe(i) || 0;
        if (mol.atomes[i].etiq) continue;
        const occ = adj[i].map(v => angleDe(px[i], px[v.j]));
        for (let h = 0; h < nh; h++) {
          let best = null, bs = -Infinity;
          for (const a of [0, 90, 180, 270, 45, 135, 225, 315, 30, 150, 210, 330, 60, 120, 240, 300]) {
            const g = occ.length ? Math.min(...occ.map(x => ecart(x, a))) : 180;
            if (g < 35) continue;
            const v = vec(a), q = { x: px[i].x + v.x * dH, y: px[i].y + v.y * dH };
            const proche = Math.min(...pris.map(r => dist(r, q)));
            let s = Math.min(g, 90) + (a % 90 === 0 ? 15 : 0) + Math.min(proche, dH) * 1.2;
            if (proche < .55 * dH) s -= 200;
            if (s > bs) { bs = s; best = { a, q }; }
          }
          if (!best) break;
          occ.push(best.a); pris.push(best.q);
          H.push({ x: best.q.x, y: best.q.y, de: i, a: best.a, classe: classeAt(i) });
        }
        // doublets non liants : N 1, O 2, halogènes 3
        const el = mol.atomes[i].el;
        if (o.doublets !== false && (el === 'N' || el === 'O' || O.HALOGENES.includes(el))) {
          const nl = 4 - O.valence(el);          // N 1, O 2, halogènes 3 (même si les H ne sont pas encore écrits)
          const bt = etiq[i] ? etiq[i].boite : boite(el, 0, 'd', f);
          const unSeul = occ.length === 1 && nl === 2 && occ[0] % 90 === 0;
          for (let d = 0; d < nl; d++) {
            let best = null, bs = -Infinity;
            if (unSeul) best = n360(occ[0] + (d ? -90 : 90));
            else for (const a of [0, 90, 180, 270, 45, 135, 225, 315]) {
              const g = occ.length ? Math.min(...occ.map(x => ecart(x, a))) : 180;
              if (g < (a % 90 === 0 ? 60 : 40)) continue;
              const s = Math.min(g, 90) + (a % 90 === 0 ? 100 : 0);
              if (s > bs) { bs = s; best = a; }
            }
            if (best === null) break;
            occ.push(best);
            const v = vec(best), r = sortie({ x: 0, y: 0 }, v, bt, 0) + 3.5;
            const c = { x: px[i].x + v.x * r, y: px[i].y + v.y * r }, w = .34 * f;
            doublets.push({ x1: c.x - v.y * w, y1: c.y + v.x * w, x2: c.x + v.y * w, y2: c.y - v.x * w, de: i, classe: classeAt(i) });
          }
        }
      }
    }

    // liaisons
    const bH = { x1: -.37 * f, x2: .37 * f, y1: -.42 * f, y2: .4 * f };
    const cyc = O.cycles(mol);
    const liaisons = mol.liaisons.map((l, k) => {
      const p = px[l.a], q = px[l.b];
      const L = dist(p, q) || 1, ux = (q.x - p.x) / L, uy = (q.y - p.y) / L, nx = -uy, ny = ux;
      const ta = etiq[l.a] ? sortie(p, q, etiq[l.a].boite) : 0, tb = etiq[l.b] ? sortie(q, p, etiq[l.b].boite) : 0;
      const seg = (off, ra, rb) => ({
        x1: p.x + ux * ra + nx * off, y1: p.y + uy * ra + ny * off,
        x2: q.x - ux * rb + nx * off, y2: q.y - uy * rb + ny * off,
      });
      const segs = [];
      const ecartT = f * .2;
      if (l.o === 1) segs.push(seg(0, ta, tb));
      else if (l.o === 3) [-1, 0, 1].forEach(s => segs.push(seg(s * ecartT * 1.15, ta, tb)));
      else {
        // double liaison : centrée, sauf en topologique entre deux atomes de la chaîne (trait intérieur)
        const termA = adj[l.a].length === 1, termB = adj[l.b].length === 1;
        const centree = ec !== 'topo' || (termA && etiq[l.a]) || (termB && etiq[l.b]) || (termA && termB);
        if (centree) { segs.push(seg(-ecartT * .65, ta, tb)); segs.push(seg(ecartT * .65, ta, tb)); }
        else {
          const mid = { x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 };
          let s = 0;
          const c = cyc.find(cy => cy.includes(l.a) && cy.includes(l.b));
          if (c) {
            const g = c.reduce((acc, i) => ({ x: acc.x + px[i].x / c.length, y: acc.y + px[i].y / c.length }), { x: 0, y: 0 });
            s = (g.x - mid.x) * nx + (g.y - mid.y) * ny;
          } else {
            for (const v of adj[l.a]) if (v.j !== l.b) s += Math.sign((px[v.j].x - mid.x) * nx + (px[v.j].y - mid.y) * ny);
            for (const v of adj[l.b]) if (v.j !== l.a) s += Math.sign((px[v.j].x - mid.x) * nx + (px[v.j].y - mid.y) * ny);
            if (!s) s = ny;                     // à égalité : vers le bas
          }
          const sg = s >= 0 ? 1 : -1, court = .16 * L;
          segs.push(seg(0, ta, tb));
          segs.push(seg(sg * ecartT * 1.6, Math.max(ta, court), Math.max(tb, court)));
        }
      }
      return { k, a: l.a, b: l.b, o: l.o, segs, classe: classeLi(l.a, l.b) };
    });
    // liaisons C–H de la développée
    const liensH = H.map(h => {
      const p = px[h.de], q = { x: h.x, y: h.y };
      const ta = etiq[h.de] ? sortie(p, q, etiq[h.de].boite) : 0, tb = sortie(q, p, bH);
      const L = dist(p, q), ux = (q.x - p.x) / L, uy = (q.y - p.y) / L;
      return { de: h.de, x1: p.x + ux * ta, y1: p.y + uy * ta, x2: q.x - ux * tb, y2: q.y - uy * tb, classe: h.classe };
    });

    // numéros de la chaîne principale : à côté de l'atome, sans toucher ni lettre ni trait
    const numeros = [];
    const obst = [], traits = [];
    etiq.forEach((e, i) => { if (e) obst.push({ x1: px[i].x + e.boite.x1, x2: px[i].x + e.boite.x2, y1: px[i].y + e.boite.y1, y2: px[i].y + e.boite.y2 }); });
    H.forEach(h => obst.push({ x1: h.x - .37 * f, x2: h.x + .37 * f, y1: h.y - .42 * f, y2: h.y + .4 * f }));
    liaisons.forEach(l => l.segs.forEach(sg => traits.push(sg)));
    liensH.forEach(sg => traits.push(sg)); doublets.forEach(sg => traits.push(sg));
    (o.numeros || []).forEach((i, k) => {
      const p = px[i], t = String(k + 1), lw = .3 * f * t.length, lh = .36 * f;
      const pref = ec === 'topo' ? 90 : 270;
      const libre = c => obst.every(b => c.x + lw < b.x1 - 1 || c.x - lw > b.x2 + 1 || c.y + lh < b.y1 - 1 || c.y - lh > b.y2 + 1)
        && traits.every(sg => distSegment(c, { x: sg.x1, y: sg.y1 }, { x: sg.x2, y: sg.y2 }) > .44 * f);
      const dirs = [];
      for (let a = 0; a < 360; a += 15) dirs.push(a);
      dirs.sort((a, b) => ecart(a, pref) - ecart(b, pref));
      let c = null;
      for (const pas of [0, .3, .6]) {
        for (const a of dirs) {
          const v = vec(a);
          const r = (etiq[i] ? sortie({ x: 0, y: 0 }, v, etiq[i].boite, 0) + .5 * f : .62 * f) + pas * f;
          const q = { x: p.x + v.x * r, y: p.y + v.y * r };
          if (libre(q)) { c = q; break; }
        }
        if (c) break;
      }
      if (!c) { const v = vec(pref); c = { x: p.x + v.x * .9 * f, y: p.y + v.y * .9 * f }; }
      obst.push({ x1: c.x - lw, x2: c.x + lw, y1: c.y - lh, y2: c.y + lh });
      numeros.push({ x: c.x, y: c.y, t });
    });

    // entourages des groupes caractéristiques
    let ent = o.entourer;
    if (ent === true) {
      const gs = O.groupes(mol);
      ent = gs.map((g, k) => ({ atomes: g.atomes, avecH: g.avecH, numero: gs.length > 1 ? k + 1 : null }));
    }
    const entourages = (ent || []).map(e => {
      const pts = [];
      e.atomes.forEach(i => {
        const p = px[i];
        if (etiq[i]) { const b = etiq[i].boite; [[b.x1, b.y1], [b.x2, b.y1], [b.x1, b.y2], [b.x2, b.y2]].forEach(([x, y]) => pts.push({ x: p.x + x, y: p.y + y })); }
        else for (let a = 0; a < 360; a += 45) { const v = vec(a); pts.push({ x: p.x + v.x * 5, y: p.y + v.y * 5 }); }
      });
      doublets.filter(d => e.atomes.includes(d.de)).forEach(d => { pts.push({ x: d.x1, y: d.y1 }); pts.push({ x: d.x2, y: d.y2 }); });
      (e.avecH || []).forEach(i => H.filter(h => h.de === i).forEach(h => [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sy]) => pts.push({ x: h.x + sx * .37 * f, y: h.y + sy * .5 * f }))));
      // cadre arrondi qui n'épouse pas le groupe (comme on entoure à la main) ; ellipse autour d'un seul atome écrit
      const xs = pts.map(q => q.x), ys = pts.map(q => q.y);
      const b = { x1: Math.min(...xs), x2: Math.max(...xs), y1: Math.min(...ys), y2: Math.max(...ys) };
      const seul = e.atomes.length === 1 && etiq[e.atomes[0]] && !(e.avecH || []).some(i => H.some(h => h.de === i));
      let cadre;
      if (seul) {
        const rx = (b.x2 - b.x1) / 2 * 1.2 + 4, ry = (b.y2 - b.y1) / 2 * 1.3 + 4, cx = (b.x1 + b.x2) / 2, cy = (b.y1 + b.y2) / 2;
        cadre = { ellipse: true, cx, cy, rx, ry, x1: cx - rx, x2: cx + rx, y1: cy - ry, y2: cy + ry };
      } else {
        const m = 7;
        cadre = { x1: b.x1 - m, x2: b.x2 + m, y1: b.y1 - m, y2: b.y2 + m };
        cadre.r = Math.min(14, (cadre.y2 - cadre.y1) / 2, (cadre.x2 - cadre.x1) / 2);
      }
      return Object.assign({ cadre, pts: [{ x: cadre.x1, y: cadre.y1 }, { x: cadre.x2, y: cadre.y1 }, { x: cadre.x1, y: cadre.y2 }, { x: cadre.x2, y: cadre.y2 }] }, e);
    });

    // cadre
    const bx = { x1: Infinity, y1: Infinity, x2: -Infinity, y2: -Infinity };
    const ajout = (x, y) => { bx.x1 = Math.min(bx.x1, x); bx.x2 = Math.max(bx.x2, x); bx.y1 = Math.min(bx.y1, y); bx.y2 = Math.max(bx.y2, y); };
    px.forEach((p, i) => {
      if (etiq[i]) { const b = etiq[i].boite; ajout(p.x + b.x1, p.y + b.y1); ajout(p.x + b.x2, p.y + b.y2); }
      else { ajout(p.x - 4, p.y - 4); ajout(p.x + 4, p.y + 4); }
    });
    H.forEach(h => { ajout(h.x - .4 * f, h.y - .55 * f); ajout(h.x + .4 * f, h.y + .55 * f); });
    doublets.forEach(d => { ajout(d.x1, d.y1); ajout(d.x2, d.y2); });
    numeros.forEach(m => { ajout(m.x - .45 * f, m.y - .45 * f); ajout(m.x + .45 * f, m.y + .45 * f); });
    entourages.forEach(e => { const c = e.cadre; ajout(c.x1 - 3, c.y1 - 3); ajout(c.x2 + 3, c.y2 + 3); if (e.numero) { ajout(c.x2 + 10, c.y1 - 10); } });
    if (!isFinite(bx.x1)) { bx.x1 = bx.y1 = 0; bx.x2 = bx.y2 = 1; }

    return { mol, ec, f, ech, pos, px, adj, etiq, H, liensH, doublets, liaisons, numeros, entourages, cadre: bx };
  }

  /* ============================================================
     CODE SVG
     ============================================================ */
  const cl = c => (c ? ' orga-c-' + c : '');

  function texteEtiquette(e, x, y, f) {
    const base = r1(y + .36 * f), d = r1(.26 * f), t = r1(.72 * f);
    if (e.texte) {
      let h = '', bas = false;
      for (const [m, ind] of morceauxEtiq(e.texte)) {
        if (ind && !bas) { h += `<tspan dy="${d}" font-size="${t}">${m}</tspan>`; bas = true; }
        else if (!ind && bas) { h += `<tspan dy="${-d}">${m}</tspan>`; bas = false; }
        else h += ind ? `<tspan font-size="${t}">${m}</tspan>` : m;
      }
      return `<text class="orga-t${cl(e.classe)}" x="${r1(x - e.boite.we / 2)}" y="${base}">${h}</text>`;
    }
    const ind = e.nh > 1 ? `<tspan dy="${d}" font-size="${t}">${e.nh}</tspan>` : '';
    if (e.cote === 'g') {
      const h = e.nh ? 'H' + ind + (e.nh > 1 ? `<tspan dy="${-d}">${e.el}</tspan>` : e.el) : e.el;
      return `<text class="orga-t${cl(e.classe)}" x="${r1(x + e.boite.we / 2)}" y="${base}" text-anchor="end">${h}</text>`;
    }
    return `<text class="orga-t${cl(e.classe)}" x="${r1(x - e.boite.we / 2)}" y="${base}">${e.el}${e.nh ? 'H' + ind : ''}</text>`;
  }

  // corps du SVG ; o.sous : code à mettre sous les atomes (sélection) ; o.points : sommets visibles (éditeur)
  function svgCorps(sc, o) {
    o = o || {};
    const f = sc.f, out = [`<g font-size="${f}">`];
    if (o.sous) out.push(o.sous);
    out.push('<g class="orga-liens">');
    sc.liaisons.forEach(l => l.segs.forEach(s => out.push(`<line class="orga-l${cl(l.classe)}" data-l="${l.k}" x1="${r1(s.x1)}" y1="${r1(s.y1)}" x2="${r1(s.x2)}" y2="${r1(s.y2)}"/>`)));
    sc.liensH.forEach(l => out.push(`<line class="orga-l orga-lh${cl(l.classe)}" data-de="${l.de}" x1="${r1(l.x1)}" y1="${r1(l.y1)}" x2="${r1(l.x2)}" y2="${r1(l.y2)}"/>`));
    sc.doublets.forEach(d => out.push(`<line class="orga-dl${cl(d.classe)}" data-de="${d.de}" x1="${r1(d.x1)}" y1="${r1(d.y1)}" x2="${r1(d.x2)}" y2="${r1(d.y2)}"/>`));
    out.push('</g><g class="orga-atomes">');
    sc.etiq.forEach((e, i) => {
      if (!e) {
        if (o.points) out.push(`<circle class="orga-pt" cx="${r1(sc.px[i].x)}" cy="${r1(sc.px[i].y)}" r="3.4"/>`);
        return;
      }
      const p = sc.px[i];
      out.push(`<g class="orga-at" data-a="${i}">`);
      if (e.manque) out.push(`<rect class="orga-h-manque" x="${r1(p.x + e.boite.x1 - 4)}" y="${r1(p.y + e.boite.y1 - 3)}" width="${r1(e.boite.x2 - e.boite.x1 + 8)}" height="${r1(e.boite.y2 - e.boite.y1 + 6)}" rx="8"/>`);
      out.push(texteEtiquette(e, p.x, p.y, f) + '</g>');
    });
    sc.H.forEach(h => out.push(`<text class="orga-t orga-th${cl(h.classe)}" data-de="${h.de}" x="${r1(h.x)}" y="${r1(h.y + .36 * f)}" text-anchor="middle">H</text>`));
    out.push('</g>');
    if (sc.numeros.length) {
      out.push('<g class="orga-nums">');
      sc.numeros.forEach(m => out.push(`<text class="orga-num" x="${r1(m.x)}" y="${r1(m.y + .27 * f)}" text-anchor="middle" font-size="${r1(.74 * f)}">${m.t}</text>`));
      out.push('</g>');
    }
    sc.entourages.forEach(e => {
      const c = e.cadre, cls = 'orga-ent' + (e.provisoire ? ' orga-ent-prov' : '');
      out.push(c.ellipse ? `<ellipse class="${cls}" cx="${r1(c.cx)}" cy="${r1(c.cy)}" rx="${r1(c.rx)}" ry="${r1(c.ry)}"/>`
        : `<rect class="${cls}" x="${r1(c.x1)}" y="${r1(c.y1)}" width="${r1(c.x2 - c.x1)}" height="${r1(c.y2 - c.y1)}" rx="${r1(c.r)}"/>`);
      if (e.numero) {
        const x = c.ellipse ? c.cx + c.rx * .7 : c.x2, y = c.ellipse ? c.cy - c.ry * .7 : c.y1;
        out.push(`<circle class="orga-ent-n" cx="${r1(x)}" cy="${r1(y)}" r="9"/><text class="orga-ent-t" x="${r1(x)}" y="${r1(y + 4)}" text-anchor="middle">${e.numero}</text>`);
      }
    });
    out.push('</g>');
    return out.join('');
  }

  function dessinHTML(mol, o) {
    o = o || {};
    const ec = o.ecriture || 'semi';
    const sc = scene(mol, ec, Object.assign({ chaine: o.numeros || undefined }, o));
    const m = 8, b = sc.cadre;
    const x = Math.floor(b.x1 - m), y = Math.floor(b.y1 - m), w = Math.ceil(b.x2 - b.x1 + 2 * m), h = Math.ceil(b.y2 - b.y1 + 2 * m);
    const label = (o.label || (mol.atomes.some(a => a.etiq) ? NOM_EC[ec] : O.formuleBrute(mol))).replace(/"/g, '&quot;');
    const mini = Math.round(w * .6);
    return `<div class="orga-defile"><svg class="orga-mol orga-${ec}" viewBox="${x} ${y} ${w} ${h}" width="${w}" height="${h}" style="width:${w}px;max-width:100%;min-width:${mini}px;height:auto" role="img" aria-label="${label}">${svgCorps(sc, o)}</svg></div>${o.sansAide ? '' : aidesCondensees(mol)}`;
  }

  // étiquettes condensées d'un dessin (C₂H₅…), chacune avec sa bulle d'aide ⓘ
  function aidesCondensees(mol) {
    const ts = [...new Set(mol.atomes.filter(a => a.etiq).map(a => a.etiq))];
    if (!ts.length) return '';
    return `<p class="orga-cond">${ts.map(t => `<span class="orga-cond-t">${formuleHTML(t)} ${info(O.AIDES_CONDENSEES[t] || 'Écriture abrégée d\'un groupe d\'atomes.', 'Que veut dire ' + t + ' ?')}</span>`).join('')}</p>`;
  }

  function dessiner(zone, mol, o) {
    if (typeof mol === 'string') mol = O.lire(mol);
    zone.innerHTML = dessinHTML(mol, o);
    return { svg: zone.querySelector('svg'), mol };
  }

  /* ---------- Nom en couleurs, légende des groupes ---------- */
  function nomHTML(parties) {
    return '<span class="orga-nom">' + parties.map(([t, c]) => (c ? `<span class="orga-n-${c}">${t}</span>` : t)).join('') + '</span>';
  }


  /* ============================================================
     BULLE DE CHOIX (au toucher, dans un conteneur en position relative)
     options : [{ html, aria }] ; choisir(k)
     ============================================================ */
  function bulle(conteneur, x, y, options, choisir) {
    fermerBulle(conteneur);
    const W = conteneur.scrollWidth, Hc = conteneur.scrollHeight;   // mesurés avant d'ajouter la bulle
    const b = document.createElement('div');
    b.className = 'orga-bulle';
    b.setAttribute('role', 'dialog');
    b.innerHTML = options.map((op, k) => `<button type="button" class="orga-choix" data-k="${k}"${op.aria ? ` aria-label="${op.aria}"` : ''}>${op.html}</button>`).join('');
    conteneur.appendChild(b);
    b.style.top = '0px';
    const w = b.offsetWidth, h = b.offsetHeight;
    b.style.left = Math.max(4, Math.min(W - w - 4, x - w / 2)) + 'px';
    // sous l'atome, ou au-dessus s'il n'y a pas la place
    b.style.top = (y + 26 + h > Hc && y - 26 - h >= 0 ? y - 26 - h : Math.max(4, Math.min(y + 26, Hc - h - 4))) + 'px';
    b.addEventListener('click', ev => {
      const t = ev.target.closest('[data-k]');
      if (!t) return;
      fermerBulle(conteneur);
      choisir(+t.dataset.k);
    });
    const dehors = ev => { if (!b.contains(ev.target)) fermerBulle(conteneur); };
    setTimeout(() => document.addEventListener('pointerdown', dehors, true), 0);
    b._dehors = dehors;
    const premier = b.querySelector('button');
    if (premier && matchMedia('(hover: hover)').matches) premier.focus();
    return b;
  }
  function fermerBulle(conteneur) {
    conteneur.querySelectorAll('.orga-bulle').forEach(b => { document.removeEventListener('pointerdown', b._dehors, true); b.remove(); });
  }

  // choix du nombre de H d'un atome (C, CH, CH₂, CH₃…)
  function optionsH(el) {
    const max = O.valence(el) - (el === 'C' ? 1 : 0);
    const res = [];
    for (let h = 0; h <= Math.max(0, max); h++) res.push({ h, html: O.etiquetteH(el, h, true), aria: el + ' avec ' + h + ' H' });
    return res;
  }

  // point SVG → coordonnées dans un conteneur (pour placer une bulle)
  function versConteneur(svg, conteneur, p) {
    const m = svg.getScreenCTM();
    const q = new DOMPoint(p.x, p.y).matrixTransform(m);
    const r = conteneur.getBoundingClientRect();
    return { x: q.x - r.left + conteneur.scrollLeft, y: q.y - r.top + conteneur.scrollTop };
  }
  function versSVG(svg, ev) {
    return new DOMPoint(ev.clientX, ev.clientY).matrixTransform(svg.getScreenCTM().inverse());
  }

  const animer = () => !matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ============================================================
     ÉDITEUR
     ORGA.editeur(zone, {
       ecriture   'semi' | 'topo' | 'developpee'    écriture de départ
       ecritures  écritures proposées (défaut : les trois)
       hydrogenes 'auto' | 'eleve'                   H complétés seuls ou par l'élève
       choixH     true : interrupteur H automatiques / à compléter affiché
       elements   éléments de la palette
       depart     molécule ou SMILES de départ (défaut 'C')
       ajout      façon d'ajouter un atome (défaut : ORGA.GLISSER, la maquette C retenue) :
                  objet { nom, installer(ed), calque(ed, sc), clic(ed, cible), apres(ed) }
       nomDirect  true : le nom de la molécule dessinée s'affiche en direct, en couleurs (dessin compris)
       brute      false : pas de formule brute sous le dessin
       structure  false : molécule figée (seul l'outil H reste : compléter les H d'une formule)
       surChange  fonction (ed) appelée à chaque modification
     })
     Renvoie ed : ed.mol, ed.ec, ed.sel, ed.libres(i), ed.prefere(i), ed.ajouter(i, angle),
                  ed.charger(mol, o), ed.changerEcriture(ec), ed.changerH(mode), ed.hJustes(), ed.rendre()…
     ============================================================ */
  /* ---------- Façon d'ajouter un atome retenue (maquette C « Glisser ») ----------
     On tire un trait depuis un atome : il s'aimante à la direction permise la plus proche ;
     au lâcher, un nouvel atome. Un appui court sur un atome montre ses emplacements voisins
     (celui qui continue le zigzag mis en valeur) : les toucher fait pareil. */
  function emplacements(ed, sc) {
    if (ed.sel == null || !sc.px[ed.sel]) return '';
    const pref = ed.prefere(ed.sel);
    let h = '';
    for (const d of ed.libres(ed.sel)) {
      const c = d.cible != null ? sc.px[d.cible] : ed.px(d.q), p = d.a === pref;
      if (d.cible != null) h += `<circle class="orga-empl orga-empl-fermer" cx="${r1(c.x)}" cy="${r1(c.y)}" r="15"/>`;
      else h += `<circle class="orga-empl${p ? ' orga-empl-pref' : ''}" cx="${r1(c.x)}" cy="${r1(c.y)}" r="${p ? 8 : 6}"/>`;
      h += `<circle class="orga-cible" data-cible="e${d.a}" cx="${r1(c.x)}" cy="${r1(c.y)}" r="22"/>`;
    }
    return h;
  }
  const GLISSER = {
    nom: 'glisser',
    installer(ed) {
      ed.racine.classList.add('orga-ed-glisser');
      const svg = ed.svg;
      let g = null;
      const fantome = () => {
        const cal = svg.querySelector('.orga-calque');
        if (!cal) return;
        cal.querySelectorAll('.orga-glisse').forEach(x => x.remove());
        if (!g || g.a == null) return;
        const d = ed.libres(g.i).find(x => x.a === g.a);
        if (!d) return;
        const p = ed.sc.px[g.i], c = d.cible != null ? ed.sc.px[d.cible] : ed.px(d.q);
        const t = ed.el !== 'C' || ed.ec !== 'topo' ? `<text class="orga-empl-t" x="${r1(c.x)}" y="${r1(c.y + 4.5)}" text-anchor="middle">${ed.el}</text>` : '';
        cal.insertAdjacentHTML('beforeend', `<g class="orga-glisse"><line class="orga-fantome" x1="${r1(p.x)}" y1="${r1(p.y)}" x2="${r1(c.x)}" y2="${r1(c.y)}"/><circle class="orga-fantome-at" cx="${r1(c.x)}" cy="${r1(c.y)}" r="${d.cible != null ? 18 : 12}"/>${t}</g>`);
      };
      svg.addEventListener('pointerdown', ev => {
        if (ed.fige || ed.outil !== 'dessin' || (ev.pointerType === 'mouse' && ev.button !== 0)) return;
        const c = ed.cibleDe(ev.target);
        if (c.type !== 'atome') return;
        g = { i: +c.v, id: ev.pointerId, a: null, bouge: false };
      });
      svg.addEventListener('pointermove', ev => {
        if (!g || ev.pointerId !== g.id) return;
        const p = versSVG(svg, ev), c = ed.sc.px[g.i];
        const dx = p.x - c.x, dy = p.y - c.y, L = Math.hypot(dx, dy);
        if (L < 14) { if (g.a != null) { g.a = null; fantome(); } return; }
        // le glisser commence : pointeur capturé (pas avant : un appui court reste un clic sur l'atome)
        if (!g.bouge) { try { svg.setPointerCapture(ev.pointerId); } catch (e) { /* rien */ } }
        g.bouge = true;
        const ang = n360(Math.atan2(-dy, dx) / RAD);
        let best = null;
        for (const d of ed.libres(g.i)) if (!best || ecart(d.a, ang) < ecart(best.a, ang)) best = d;
        const a = best && ecart(best.a, ang) < 50 ? best.a : null;
        if (a !== g.a) { g.a = a; fantome(); }
      });
      const fin = ev => {
        if (!g || ev.pointerId !== g.id) return;
        const { i, a, bouge } = g;
        g = null;
        if (bouge) ed.ignorerClic = Date.now();
        if (a != null) ed.ajouter(i, a);
        else if (bouge) ed.rendre();
      };
      svg.addEventListener('pointerup', fin);
      svg.addEventListener('pointercancel', ev => { if (g && ev.pointerId === g.id) { g = null; ed.rendre(); } });
      // iOS : pas de défilement de la page pendant le glisser
      svg.addEventListener('touchmove', ev => { if (g && g.bouge) ev.preventDefault(); }, { passive: false });
    },
    calque: (ed, sc) => emplacements(ed, sc),
    clic(ed, cible) {
      if (cible.type !== 'empl' || ed.sel == null) return false;
      ed.ajouter(ed.sel, +cible.v);
      return true;
    },
  };

  const ELEMENTS = ['C', 'N', 'O', 'F', 'Cl', 'Br', 'I'];
  const DIRS = { topo: [30, 90, 150, 210, 270, 330], semi: [0, 90, 180, 270], developpee: [0, 90, 180, 270] };

  function editeur(zone, opts) {
    // (une option non précisée garde sa valeur par défaut)
    const o = Object.assign({ ecriture: 'semi', ecritures: ['semi', 'topo', 'developpee'], hydrogenes: 'auto', choixH: true, elements: ELEMENTS, depart: 'C', brute: true, structure: true },
      Object.fromEntries(Object.entries(opts || {}).filter(([, v]) => v !== undefined)));
    const mode = o.ajout || GLISSER;
    const racine = document.createElement('div');
    racine.className = 'orga-ed' + (o.structure ? '' : ' orga-ed-h-seul');
    const seg = (cls, label, items) => `<div class="orga-seg ${cls}" role="group" aria-label="${label}">${items}</div>`;
    racine.innerHTML = `
      ${o.ecritures.length > 1 ? seg('orga-ed-ecritures', 'Écriture', o.ecritures.map(e => `<button type="button" class="orga-pil" data-ec="${e}">${NOM_EC[e]}</button>`).join('')) : ''}
      <div class="orga-ed-zone"><svg class="orga-mol orga-ed-svg" role="img" aria-label="Molécule en cours de dessin"></svg></div>
      <p class="orga-ed-msg" role="status" aria-live="polite"></p>
      <div class="orga-ed-mode"></div>
      <div class="orga-ed-barre">
        ${seg('orga-ed-el', 'Élément ajouté', o.elements.map(e => `<button type="button" class="orga-pil orga-carre" data-el="${e}" aria-label="Ajouter ${e}">${e}</button>`).join(''))}
        ${seg('orga-ed-ordre', 'Liaison', [[1, '–', 'simple'], [2, '=', 'double'], [3, '≡', 'triple']].map(([k, t, a]) => `<button type="button" class="orga-pil orga-carre" data-ordre="${k}" aria-label="Liaison ${a}">${t}</button>`).join(''))}
      </div>
      <div class="orga-ed-barre">
        ${seg('orga-ed-outil', 'Outil', `<button type="button" class="orga-pil" data-outil="dessin">✎ Dessiner</button><button type="button" class="orga-pil" data-outil="h">H</button><button type="button" class="orga-pil" data-outil="gomme">⌫ Gomme</button>`)}
        <button type="button" class="btn-small orga-ed-annuler">↶ Annuler</button>
        <button type="button" class="btn-small orga-ed-effacer">Tout effacer</button>
      </div>
      ${o.choixH ? `<div class="orga-ed-barre orga-ed-hbarre">${seg('orga-ed-hmode', 'Hydrogènes', `<button type="button" class="orga-pil" data-h="auto">H automatiques</button><button type="button" class="orga-pil" data-h="eleve">H à compléter</button>`)}
        <button type="button" class="btn-small orga-ed-verif">Vérifier les H</button></div>` : ''}
      <p class="orga-ed-info"></p>`;
    zone.appendChild(racine);
    const svg = racine.querySelector('svg'), zoneSvg = racine.querySelector('.orga-ed-zone');
    const msg = racine.querySelector('.orga-ed-msg'), info = racine.querySelector('.orga-ed-info');

    const ed = {
      o, racine, svg, zoneSvg, mode,
      ec: o.ecriture, hydro: o.hydrogenes, el: 'C', ordre: 1, outil: o.structure ? 'dessin' : 'h',
      mol: null, pos: [], h: [], sel: 0, pile: [], vue: null, sc: null,
    };

    /* ----- état ----- */
    const molDe = m => (typeof m === 'string' ? O.lire(m) : O.copier(m));
    function charger(m, op) {
      op = op || {};
      if (op.ecriture) ed.ec = op.ecriture;
      if (op.hydrogenes) ed.hydro = op.hydrogenes;
      ed.mol = molDe(m || o.depart);
      ed.pos = disposer(ed.mol, ed.ec, { echelle: ECHELLES.editeur[ed.ec] });
      ed.h = ed.mol.atomes.map(() => undefined);
      ed.sel = o.structure ? 0 : null; ed.pile = []; ed.vue = null;
      message('');
      changement(true);
    }
    const instantane = () => JSON.stringify({ mol: ed.mol, pos: ed.pos, h: ed.h, sel: ed.sel, ec: ed.ec });
    function memoriser() { ed.pile.push(instantane()); if (ed.pile.length > 80) ed.pile.shift(); }
    function annuler() {
      const s = ed.pile.pop();
      if (!s) return message('Rien à annuler.', 'info');
      const e = JSON.parse(s);
      Object.assign(ed, { mol: e.mol, pos: e.pos, h: e.h.map(x => (x === null ? undefined : x)), sel: e.sel });
      if (e.ec !== ed.ec) { ed.ec = e.ec; ed.vue = null; }
      message('');
      changement();
    }

    const voisins = i => O.adjacence(ed.mol)[i];
    // nombre de liaisons entre deux atomes (plus court chemin)
    function ecartChemin(i, j) {
      const adj = O.adjacence(ed.mol), d = new Map([[i, 0]]), file = [i];
      while (file.length) { const a = file.shift(); for (const v of adj[a]) if (!d.has(v.j)) { d.set(v.j, d.get(a) + 1); file.push(v.j); } }
      return d.has(j) ? d.get(j) : Infinity;
    }
    const lies = (i, j) => ed.mol.liaisons.some(l => (l.a === i && l.b === j) || (l.a === j && l.b === i));

    // directions libres autour de l'atome i : { a (degrés), q (position), cible (atome déjà là : fermeture de cycle) }
    ed.libres = function (i) {
      if (i == null || !ed.pos[i]) return [];
      const p = ed.pos[i];
      const occ = voisins(i).map(v => angleDe(p, ed.pos[v.j]));
      const res = [];
      for (const a of DIRS[ed.ec]) {
        if (occ.some(x => ecart(x, a) < 35)) continue;
        const v = vec(a), q = { x: p.x + v.x, y: p.y + v.y };
        let cible = null, gene = false;
        ed.pos.forEach((r, j) => { if (j === i) return; const d = dist(r, q); if (d < .3) cible = j; else if (d < .7) gene = true; });
        if (cible === null && gene) continue;
        // fermeture de cycle : seulement vers un atome qui peut encore se lier, pour un cycle d'au moins 5 atomes
        if (cible !== null && (lies(i, cible) || O.somme(ed.mol, cible) >= O.valence(ed.mol.atomes[cible].el) ||
          O.somme(ed.mol, i) >= O.valence(ed.mol.atomes[i].el) || ecartChemin(i, cible) < 4)) continue;
        res.push({ a, q, cible });
      }
      return res;
    };

    // direction proposée en premier : celle qui continue le zigzag (ou la ligne droite en semi-développée)
    ed.prefere = function (i) {
      const libres = ed.libres(i);
      if (!libres.length) return null;
      const vs = voisins(i), p = ed.pos[i];
      let ideal;
      if (!vs.length) ideal = ed.ec === 'topo' ? 30 : 0;
      else if (vs.length === 1) {
        const n = vs[0].j, din = angleDe(ed.pos[n], p);
        if (ed.ec !== 'topo' || vs[0].o === 3) ideal = din;
        else {
          const avant = voisins(n).filter(v => v.j !== i);
          let t;
          if (avant.length === 1) t = Math.sign(n180(din - angleDe(ed.pos[avant[0].j], ed.pos[n])));
          if (!t) { const ref = Math.cos(din * RAD) >= -1e-9 ? 0 : 180; t = Math.sign(n180(din - ref)) || 1; }
          ideal = din - 60 * t;
        }
      } else {
        const m = vs.map(v => vec(angleDe(p, ed.pos[v.j]))).reduce((s, v) => ({ x: s.x + v.x, y: s.y + v.y }), { x: 0, y: 0 });
        ideal = n360(Math.atan2(-m.y, -m.x) / RAD);
      }
      return libres.slice().sort((x, y) => ecart(x.a, ideal) - ecart(y.a, ideal))[0].a;
    };

    // ajoute un atome (ou ferme un cycle) depuis i dans la direction a ; renvoie l'atome sélectionné ou null
    ed.ajouter = function (i, a) {
      const d = ed.libres(i).find(x => ecart(x.a, a) < 1);
      if (!d) { message('Cette place est déjà prise.', 'info'); return null; }
      const or = ed.ordre;
      let m = O.diagLiaison(ed.mol, i, or);
      if (m) { message(m); ed.sel = i; ed.rendre(); return null; }
      if (d.cible !== null) {
        m = O.diagLiaison(ed.mol, d.cible, or);
        if (m) { message(m); return null; }
        memoriser();
        ed.mol.liaisons.push({ a: i, b: d.cible, o: or });
        ed.sel = d.cible;
      } else {
        m = O.diagNouvel(ed.el, or);
        if (m) { message(m); return null; }
        memoriser();
        const k = ed.mol.atomes.push({ el: ed.el }) - 1;
        ed.pos.push(d.q); ed.h.push(undefined);
        ed.mol.liaisons.push({ a: i, b: k, o: or });
        ed.sel = k;
      }
      message('');
      changement();
      return ed.sel;
    };

    function changerOrdre(k) {
      const l = ed.mol.liaisons[k];
      let nouv = ed.ordre;
      if (nouv === l.o) nouv = 1;
      if (nouv === l.o) return message('Pour changer une liaison, choisis « = » ou « ≡ » puis touche-la.', 'info');
      const plus = nouv - l.o;
      if (plus > 0) {
        const m = O.diagLiaison(ed.mol, l.a, plus) || O.diagLiaison(ed.mol, l.b, plus);
        if (m) return message(m);
      }
      memoriser();
      l.o = nouv;
      message('');
      changement();
    }

    // garde la plus grande partie de la molécule (après une suppression)
    function garderPlusGrande(sel) {
      const comps = O.composantes(ed.mol).sort((a, b) => b.length - a.length);
      const ex = O.extraire(ed.mol, comps[0]);
      ed.pos = ex.ancien.map(i => ed.pos[i]);
      ed.h = ex.ancien.map(i => ed.h[i]);
      ed.mol = ex.mol;
      ed.sel = ex.nouveau.has(sel) ? ex.nouveau.get(sel) : 0;
    }
    function gommer(cible) {
      if (cible.type === 'atome') {
        const i = +cible.v;
        if (ed.mol.atomes.length === 1) return message('Il faut garder au moins un atome.', 'info');
        memoriser();
        const v = voisins(i)[0];
        ed.mol.liaisons = ed.mol.liaisons.filter(l => l.a !== i && l.b !== i);
        // retire l'atome i, puis garde la plus grande partie
        const reste = ed.mol.atomes.map((x, j) => j).filter(j => j !== i);
        const ex = O.extraire(ed.mol, reste);
        ed.pos = ex.ancien.map(j => ed.pos[j]); ed.h = ex.ancien.map(j => ed.h[j]); ed.mol = ex.mol;
        garderPlusGrande(v ? ex.nouveau.get(v.j) : 0);
      } else if (cible.type === 'liaison') {
        const l = ed.mol.liaisons[+cible.v];
        memoriser();
        if (l.o > 1) l.o -= 1;
        else { ed.mol.liaisons.splice(+cible.v, 1); garderPlusGrande(ed.sel); }
      } else if (cible.type === 'h') {
        const i = +cible.v;
        if (ed.h[i]) { memoriser(); ed.h[i] -= 1; }
      } else return;
      message('');
      changement();
    }

    // outil H (H à compléter)
    function outilH(cible) {
      if (ed.hydro !== 'eleve') return message('Les H se complètent seuls : choisis « H à compléter » pour les écrire toi-même.', 'info');
      if (ed.ec === 'topo') return message('En topologique, on n\'écrit pas les H des atomes de carbone.', 'info');
      if (cible.type === 'h') { memoriser(); ed.h[+cible.v] -= 1; return changement(); }
      if (cible.type !== 'atome') return;
      const i = +cible.v, el = ed.mol.atomes[i].el;
      ed.sel = i;
      if (O.HALOGENES.includes(el)) { ed.rendre(); return message(`Un ${el} ne porte jamais d'H : il ne fait qu'une liaison.`, 'info'); }
      if (ed.ec === 'developpee') {
        const h = ed.h[i] || 0;
        if (O.somme(ed.mol, i) + h >= O.valence(el)) { ed.rendre(); return message(`${O.CE(el).replace(/^./, c => c.toUpperCase())} a déjà ${O.valence(el)} liaisons en comptant ses H.`); }
        memoriser(); ed.h[i] = h + 1; message(''); return changement();
      }
      ed.rendre();
      const p = versConteneur(svg, zoneSvg, ed.sc.px[i]);
      bulle(zoneSvg, p.x, p.y, optionsH(el), k => { memoriser(); ed.h[i] = optionsH(el)[k].h; message(''); changement(); });
    }

    ed.hJustes = () => ed.mol.atomes.every((a, i) => !O.diagH(ed.mol, i, ed.h[i]));
    function verifierH() {
      if (ed.hydro !== 'eleve') return message('Les H sont complétés automatiquement.', 'info');
      const i = ed.mol.atomes.findIndex((a, j) => O.diagH(ed.mol, j, ed.h[j]));
      if (i < 0) return message(`Juste ! Tous les H sont à leur place : ${O.formuleBrute(ed.mol, { html: true })}.`, 'ok');
      ed.sel = i; ed.rendre();
      message(O.diagH(ed.mol, i, ed.h[i]), 'faux');
    }

    function message(t, type) {
      msg.innerHTML = t ? (type === 'ok' || type === 'info' ? '' : type === 'faux' ? '<b>Ce n\'est pas ça.</b> ' : '<b>Ce n\'est pas possible.</b> ') + t : '';
      msg.className = 'orga-ed-msg' + (t ? (type === 'ok' ? ' callout-success' : type === 'info' ? ' callout' : ' callout-danger') : '');
    }
    ed.message = message;

    /* ----- rendu ----- */
    ed.px = q => ({ x: q.x * ECHELLES.editeur[ed.ec].x, y: -q.y * ECHELLES.editeur[ed.ec].y });
    ed.rendre = function () {
      const eleve = ed.hydro === 'eleve' && ed.ec !== 'topo';
      const sc = scene(ed.mol, ed.ec, { editeur: true, pos: ed.pos, h: eleve ? ed.h : null, couleurs: o.nomDirect && ed.nom && !ed.nom.horsProgramme ? ed.nom.couleurs : null });
      ed.sc = sc;
      const L = ECHELLES.editeur[ed.ec].x;
      const b = sc.cadre, marge = (o.structure ? 1.25 : .5) * L;
      const W0 = Math.max(300, zoneSvg.clientWidth || 320), H0 = ed.ec === 'topo' ? 230 : 250;
      if (!ed.vue) {
        const cx = (b.x1 + b.x2) / 2, cy = (b.y1 + b.y2) / 2;
        ed.vue = { x1: cx - W0 / 2, x2: cx + W0 / 2, y1: cy - H0 / 2, y2: cy + H0 / 2 };
      }
      // la vue suit le dessin : elle glisse juste assez pour le contenir, et ne s'élargit que s'il dépasse la zone
      const v = ed.vue;
      const ajuster = (a1, a2, c1, c2, min) => {
        const L2 = Math.max(min, c2 - c1 + 2 * marge, a2 - a1 > min ? Math.min(a2 - a1, Math.max(min, c2 - c1 + 2 * marge)) : min);
        let d = a1;
        if (c1 - marge < d) d = c1 - marge;
        if (c2 + marge > d + L2) d = c2 + marge - L2;
        return [d, d + L2];
      };
      [v.x1, v.x2] = ajuster(v.x1, v.x2, b.x1, b.x2, W0);
      [v.y1, v.y2] = ajuster(v.y1, v.y2, b.y1, b.y2, H0);
      const w = Math.round(v.x2 - v.x1), h = Math.round(v.y2 - v.y1);
      svg.setAttribute('viewBox', `${r1(v.x1)} ${r1(v.y1)} ${w} ${h}`);
      svg.setAttribute('width', w); svg.setAttribute('height', h);
      // la zone peut rétrécir un peu le dessin (jusqu'à 80 %) avant de défiler
      Object.assign(svg.style, { width: w + 'px', maxWidth: '100%', minWidth: Math.round(w * (o.structure ? .8 : .6)) + 'px', height: 'auto' });
      // sélection, sommets, cibles tactiles
      let sel = '';
      if (ed.sel != null && sc.px[ed.sel]) {
        // atome sélectionné : cercle autour du sommet, ou cadre arrondi autour de l'étiquette
        const p = sc.px[ed.sel], e = sc.etiq[ed.sel];
        if (!e) sel = `<circle class="orga-sel" cx="${r1(p.x)}" cy="${r1(p.y)}" r="12"/>`;
        else {
          const bt = e.boite, m = 6;
          sel = `<rect class="orga-sel" x="${r1(p.x + bt.x1 - m)}" y="${r1(p.y + bt.y1 - m)}" width="${r1(bt.x2 - bt.x1 + 2 * m)}" height="${r1(bt.y2 - bt.y1 + 2 * m)}" rx="12"/>`;
        }
      }
      let cibles = '<g class="orga-cibles">';
      sc.liaisons.forEach(l => {
        const p = sc.px[l.a], q = sc.px[l.b], D = dist(p, q) || 1, ux = (q.x - p.x) / D, uy = (q.y - p.y) / D, a0 = Math.min(18, D / 3);
        cibles += `<line class="orga-cible orga-cible-l" data-cible="l${l.k}" x1="${r1(p.x + ux * a0)}" y1="${r1(p.y + uy * a0)}" x2="${r1(q.x - ux * a0)}" y2="${r1(q.y - uy * a0)}"/>`;
      });
      sc.H.forEach(hh => { cibles += `<circle class="orga-cible" data-cible="h${hh.de}" cx="${r1(hh.x)}" cy="${r1(hh.y)}" r="13"/>`; });
      sc.px.forEach((p, i) => { cibles += `<circle class="orga-cible orga-cible-a" data-cible="a${i}" cx="${r1(p.x)}" cy="${r1(p.y)}" r="22"/>`; });
      cibles += '</g>';
      const calque = ed.outil === 'dessin' && mode.calque ? mode.calque(ed, sc) : '';
      svg.innerHTML = svgCorps(sc, { sous: sel, points: true }) + cibles + `<g class="orga-calque">${calque}</g>`;
      // boutons
      racine.querySelectorAll('[data-ec]').forEach(b2 => b2.setAttribute('aria-pressed', b2.dataset.ec === ed.ec));
      racine.querySelectorAll('[data-el]').forEach(b2 => b2.setAttribute('aria-pressed', b2.dataset.el === ed.el));
      racine.querySelectorAll('[data-ordre]').forEach(b2 => b2.setAttribute('aria-pressed', +b2.dataset.ordre === ed.ordre));
      racine.querySelectorAll('[data-outil]').forEach(b2 => b2.setAttribute('aria-pressed', b2.dataset.outil === ed.outil));
      racine.querySelectorAll('[data-h]').forEach(b2 => b2.setAttribute('aria-pressed', b2.dataset.h === ed.hydro));
      const bH = racine.querySelector('[data-outil="h"]');
      if (bH) bH.disabled = ed.hydro !== 'eleve' || ed.ec === 'topo';
      const bV = racine.querySelector('.orga-ed-verif');
      if (bV) bV.hidden = ed.hydro !== 'eleve' || ed.ec === 'topo';
      racine.querySelector('.orga-ed-annuler').disabled = !ed.pile.length;
      svg.classList.toggle('orga-gomme', ed.outil === 'gomme');
      if (mode.apres) mode.apres(ed, sc);
    };

    function changement(premier) {
      if (ed.outil === 'h' && (ed.hydro !== 'eleve' || ed.ec === 'topo') && o.structure) ed.outil = 'dessin';
      ed.nom = o.nomDirect ? O.nommer(ed.mol) : null;
      ed.rendre();
      const eleve = ed.hydro === 'eleve' && ed.ec !== 'topo';
      const fb = O.formuleBrute(ed.mol, { html: true });
      let h = '';
      if (o.brute) h = eleve
        ? `Formule brute avec tes H : <b>${O.formuleBrute(ed.mol, { html: true, h: ed.h.map(x => x || 0) })}</b>${ed.hJustes() ? ' ✓' : ''}`
        : `Formule brute : <b>${fb}</b>`;
      if (ed.nom) h += `<span class="orga-ed-nom">Ta molécule : ${ed.nom.horsProgramme ? `<i>nom hors programme</i> (${ed.nom.horsProgramme})` : nomHTML(ed.nom.parties)}</span>`;
      info.innerHTML = h;
      if (!premier || o.surChangeDebut) { if (o.surChange) o.surChange(ed); }
    }
    ed.changement = changement;

    ed.changerEcriture = function (ec) {
      if (ec === ed.ec) return;
      memoriser();
      ed.ec = ec;
      ed.pos = disposer(ed.mol, ec, { echelle: ECHELLES.editeur[ec] });
      ed.vue = null;
      message('');
      changement();
    };
    ed.changerH = function (m) {
      ed.hydro = m;
      if (m === 'eleve' && ed.ec !== 'topo') message('Choisis l\'outil « H », puis touche chaque atome pour écrire ses H.', 'info');
      else message('');
      changement();
    };
    ed.charger = charger;
    // éditeur figé : plus de modification (réponse affichée, partie terminée)
    ed.figer = function () { ed.fige = true; racine.classList.add('orga-ed-fige'); ed.sel = null; ed.outil = 'aucun'; ed.rendre(); };

    /* ----- événements ----- */
    racine.addEventListener('click', ev => {
      const b = ev.target.closest('button');
      if (ed.fige || !b || !racine.contains(b) || b.closest('.orga-bulle') || b.classList.contains('orga-info')) return;
      if (b.dataset.ec) ed.changerEcriture(b.dataset.ec);
      else if (b.dataset.el) { ed.el = b.dataset.el; if (ed.outil !== 'dessin') ed.outil = 'dessin'; ed.rendre(); }
      else if (b.dataset.ordre) { ed.ordre = +b.dataset.ordre; if (ed.outil !== 'dessin') ed.outil = 'dessin'; ed.rendre(); }
      else if (b.dataset.outil) {
        ed.outil = b.dataset.outil;
        message(ed.outil === 'gomme' ? 'Touche un atome ou une liaison pour l\'effacer (une double liaison redevient simple).' : ed.outil === 'h' ? (ed.ec === 'developpee' ? 'Touche un atome pour lui ajouter un H, touche un H pour l\'enlever.' : 'Touche un atome et choisis ses H.') : '', 'info');
        ed.rendre();
      } else if (b.dataset.h) ed.changerH(b.dataset.h);
      else if (b.classList.contains('orga-ed-annuler')) annuler();
      else if (b.classList.contains('orga-ed-effacer')) { memoriser(); const p = ed.pile.slice(); charger(o.depart); ed.pile = p; ed.rendre(); }
      else if (b.classList.contains('orga-ed-verif')) verifierH();
    });

    const cibleDe = t => {
      const c = t && t.closest ? t.closest('[data-cible]') : null;
      if (!c) return { type: 'vide' };
      const v = c.dataset.cible;
      return { type: { a: 'atome', l: 'liaison', e: 'empl', h: 'h' }[v[0]], v: v.slice(1), el: c };
    };
    ed.cibleDe = cibleDe;
    svg.addEventListener('pointerdown', () => { ed.ignorerClic = 0; });   // nouveau geste
    svg.addEventListener('click', ev => {
      // clic qui suit un glisser (maquette C) : ignoré une seule fois
      if (ed.ignorerClic) { const recent = Date.now() - ed.ignorerClic < 300; ed.ignorerClic = 0; if (recent) return; }
      if (ed.fige) return;
      const cible = cibleDe(ev.target);
      if (ed.outil === 'gomme') return gommer(cible);
      if (ed.outil === 'h') return outilH(cible);
      if (mode.clic && mode.clic(ed, cible, ev) === true) return;
      if (cible.type === 'liaison') changerOrdre(+cible.v);
      else if (cible.type === 'atome') { ed.sel = +cible.v; message(''); ed.rendre(); }
    });

    if (mode.installer) mode.installer(ed);
    charger(o.depart, {});
    if (!o.structure) message(ed.ec === 'developpee' ? 'Touche un atome pour lui ajouter un H, touche un H pour l\'enlever.' : 'Touche chaque atome et choisis ses H.', 'info');
    racine.__ed = ed;           // accès depuis la page (tests, outils)
    return ed;
  }

  /* ============================================================
     CONVERSION : passer d'une écriture à l'autre par les gestes du cours
     ORGA.conversion(zone, { mol, de, vers, compterH, surFin, surErreur })
       de → vers : 'developpee' → 'semi'   « on enlève les liaisons des H et on les regroupe sur leur atome »
                   'semi' → 'topo'         « on efface tous les CH »
                   'topo' → 'semi'         « on ajoute un C avec le bon nombre de H au bout de chaque trait… »
                   'developpee' → 'topo'   les deux premières à la suite
       compterH : l'élève choisit le nombre de H (CH₃, CH₂…) au lieu d'un repli automatique
       phrase   : false : la phrase du cours n'est pas rappelée au-dessus du dessin
       surFin() : conversion faite ; surErreur(message) : geste faux (pour compter les erreurs)
       Topologique → semi-développée : la conversion est finie quand tous les C sont écrits ;
       « Redresser en semi-développée » est proposé ensuite, facultatif.
     ============================================================ */
  const PHRASES = {
    replier: 'On enlève les liaisons des H et on les regroupe sur leur atome.',
    effacer: 'On efface tous les CH.',
    ajouterC: 'On ajoute un C avec le bon nombre de H au bout de chaque trait, s\'il n\'y a pas déjà un autre atome.',
  };
  const CONSIGNES = {
    replier: 'Touche chaque atome qui porte des H pour les regrouper sur lui.',
    effacer: 'Touche chaque C (CH₃, CH₂, CH, C) pour l\'effacer : les traits restent.',
    ajouterC: 'Touche chaque sommet et chaque bout de trait, et choisis C, CH, CH₂ ou CH₃.',
  };

  function conversion(zone, opts) {
    const o = Object.assign({ de: 'developpee', vers: 'semi', compterH: false }, opts);
    const mol = typeof o.mol === 'string' ? O.lire(o.mol) : o.mol;
    const n = mol.atomes.length;
    const phases = o.de === 'developpee' ? (o.vers === 'topo' ? ['replier', 'effacer'] : ['replier']) : o.de === 'semi' ? ['effacer'] : ['ajouterC'];
    const racine = document.createElement('div');
    racine.className = 'orga-conv';
    racine.innerHTML = `<div class="cle orga-conv-phrase"></div>
      <p class="orga-conv-consigne"></p>
      <div class="orga-conv-zone"><svg class="orga-mol" role="img"></svg></div>
      <p class="orga-ed-msg" role="status" aria-live="polite"></p>
      <div class="er-actions orga-conv-actions"></div>`;
    zone.appendChild(racine);
    const svg = racine.querySelector('svg'), zoneSvg = racine.querySelector('.orga-conv-zone');
    const msg = racine.querySelector('.orga-ed-msg'), actions = racine.querySelector('.orga-conv-actions');
    const E = ECHELLES.affichage, f = 19;
    const posSemi = disposer(mol, 'semi', { echelle: E.semi }), posTopo = disposer(mol, 'topo', { echelle: E.topo });
    const st = { phase: 0, replies: new Set(), effaces: new Set(), ajoutes: new Set(), fini: false, cadre: null };

    const message = (t, type) => {
      msg.innerHTML = t ? (type ? '' : '<b>Ce n\'est pas ça.</b> ') + t : '';
      msg.className = 'orga-ed-msg' + (t ? (type === 'ok' ? ' callout-success' : type === 'info' ? ' callout' : ' callout-danger') : '');
      if (t && !type && o.surErreur) o.surErreur(t);
    };
    const ph = () => phases[st.phase];

    // positions en px de chaque écriture, centrées au même endroit
    const enPx = (pos, e) => pos.map(p => ({ x: p.x * e.x, y: -p.y * e.y }));
    const centrer = px => {
      const xs = px.map(p => p.x), ys = px.map(p => p.y);
      const cx = (Math.min(...xs) + Math.max(...xs)) / 2, cy = (Math.min(...ys) + Math.max(...ys)) / 2;
      return px.map(p => ({ x: p.x - cx, y: p.y - cy }));
    };
    const PX = {
      developpee: centrer(enPx(posSemi, E.developpee)),
      semi: centrer(enPx(posSemi, E.semi)),
      topo: centrer(enPx(posTopo, E.topo)),
    };

    // dessin d'une étape ; ec : écriture du dessin ; px : positions
    function dessin(ec, px, extra) {
      const so = Object.assign({ px, police: f }, extra);
      const sc = scene(mol, ec, so);
      const b = sc.cadre, m = 26;
      const c = st.cadre || { x1: b.x1 - m, y1: b.y1 - m, x2: b.x2 + m, y2: b.y2 + m };
      c.x1 = Math.min(c.x1, b.x1 - m); c.y1 = Math.min(c.y1, b.y1 - m); c.x2 = Math.max(c.x2, b.x2 + m); c.y2 = Math.max(c.y2, b.y2 + m);
      st.cadre = c;
      const w = Math.round(c.x2 - c.x1), h = Math.round(c.y2 - c.y1);
      svg.setAttribute('viewBox', `${r1(c.x1)} ${r1(c.y1)} ${w} ${h}`);
      svg.setAttribute('width', w); svg.setAttribute('height', h);
      // réduit si besoin (jusqu'à 75 %), puis défilement dans la zone
      Object.assign(svg.style, { width: w + 'px', maxWidth: '100%', minWidth: Math.round(w * .75) + 'px', height: 'auto' });
      let cibles = '';
      if (!st.fini && !st.anime) sc.px.forEach((p, i) => { cibles += `<circle class="orga-cible" data-cible="a${i}" cx="${r1(p.x)}" cy="${r1(p.y)}" r="22"/>`; });
      sc.H.forEach(hh => { if (!st.fini && !st.anime) cibles += `<circle class="orga-cible" data-cible="a${hh.de}" cx="${r1(hh.x)}" cy="${r1(hh.y)}" r="14"/>`; });
      svg.innerHTML = svgCorps(sc, { points: ec === 'topo' && ph() === 'ajouterC' && !st.fini }) + `<g class="orga-cibles">${cibles}</g>`;
      svg.setAttribute('aria-label', NOM_EC[ec] + ' : ' + O.formuleBrute(mol));
      return sc;
    }

    // atomes à traiter dans la phase en cours
    const aTraiter = () => {
      const p = ph();
      if (p === 'replier') return mol.atomes.map((a, i) => i).filter(i => O.nbH(mol, i) > 0 && !st.replies.has(i));
      if (p === 'effacer') return mol.atomes.map((a, i) => i).filter(i => mol.atomes[i].el === 'C' && !st.effaces.has(i));
      return mol.atomes.map((a, i) => i).filter(i => mol.atomes[i].el === 'C' && !st.ajoutes.has(i));
    };

    function rendre() {
      const p = ph();
      racine.querySelector('.orga-conv-phrase').hidden = o.phrase === false;
      racine.querySelector('.orga-conv-phrase').innerHTML = `<b class="cle-titre">${p === 'replier' ? 'Développée → semi-développée' : p === 'effacer' ? 'Semi-développée → topologique' : 'Topologique → semi-développée'}.</b> « ${PHRASES[p]} »`;
      racine.querySelector('.orga-conv-consigne').textContent = st.fini ? '' : CONSIGNES[p];
      if (p === 'replier') st.sc = dessin('developpee', PX.developpee, { replies: st.replies });
      else if (p === 'effacer') st.sc = dessin('semi', PX.semi, { masquer: st.effaces });
      else st.sc = dessin('topo', PX.topo, { etiqueter: st.ajoutes });
    }
    // réponse affichée : la conversion faite d'un coup
    function montrer() {
      if (st.anime) return;
      st.fini = true; st.cadre = null; actions.innerHTML = '';
      racine.querySelector('.orga-conv-consigne').textContent = '';
      const fin = o.vers === 'topo' ? 'topo' : 'semi';
      dessin(fin, fin === 'topo' ? PX.topo : PX.semi, {});
      message('Voici la formule ' + (fin === 'topo' ? 'topologique.' : 'semi-développée.'), 'info');
    }

    // animation des positions (et de l'écartement) d'une écriture à l'autre
    function transition(ecFin, de, vers, extra, fin) {
      if (!animer()) { fin(); return; }
      st.anime = true;
      const t0 = performance.now(), duree = 700;
      const pas = t => {
        const u = Math.min(1, (t - t0) / duree), e = u < .5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
        dessin(ecFin, de.map((p, i) => ({ x: p.x + (vers[i].x - p.x) * e, y: p.y + (vers[i].y - p.y) * e })), extra);
        if (u < 1) requestAnimationFrame(pas); else { st.anime = false; fin(); }
      };
      requestAnimationFrame(pas);
    }

    function finPhase() {
      const p = ph();
      if (p === 'replier') {
        // les atomes sans H (et leurs doublets) se replient aussi, puis on resserre en semi-développée
        mol.atomes.forEach((a, i) => st.replies.add(i));
        rendre();
        message('Tous les H sont regroupés : on resserre, c\'est la formule semi-développée.', 'ok');
        transition('developpee', PX.developpee, PX.semi, { replies: st.replies }, () => {
          if (st.phase + 1 < phases.length) { st.phase++; st.cadre = null; message(''); rendre(); }
          else { st.fini = true; st.cadre = null; dessin('semi', PX.semi, {}); terminer('Voici la formule semi-développée.'); }
        });
      } else if (p === 'effacer') {
        actions.innerHTML = '<button type="button" class="btn-primary orga-conv-zz">Mettre en zigzag</button>';
        message('Tous les C sont effacés : il reste les traits et les autres atomes.', 'info');
      } else {
        // tous les C sont écrits : c'est déjà une formule semi-développée (redresser est facultatif)
        rendre();
        terminer('Tous les C sont écrits avec leurs H : c\'est la formule semi-développée.', true);
      }
    }

    function terminer(t, redresser) {
      st.fini = true;
      racine.querySelector('.orga-conv-consigne').textContent = '';
      actions.innerHTML = (redresser ? '<button type="button" class="btn-secondary orga-conv-sd">Redresser en semi-développée <span class="orga-facultatif">(facultatif)</span></button>' : '') +
        (o.refaire === false ? '' : '<button type="button" class="btn-secondary orga-conv-refaire">↺ Recommencer</button>');
      message(t, 'ok');
      if (o.surFin && !st.finSignalee) { st.finSignalee = true; o.surFin(); }
    }

    actions.addEventListener('click', ev => {
      const b = ev.target.closest('button');
      if (!b) return;
      if (b.classList.contains('orga-conv-zz')) {
        actions.innerHTML = ''; message('');
        transition('topo', PX.semi, PX.topo, { masquer: st.effaces }, () => { st.cadre = null; st.fini = true; dessin('topo', PX.topo, {}); terminer('Voici la formule topologique.'); });
      } else if (b.classList.contains('orga-conv-sd')) {
        actions.innerHTML = ''; message('');
        const tous = new Set(mol.atomes.map((a, i) => i));
        transition('topo', PX.topo, PX.semi, { etiqueter: tous }, () => { st.cadre = null; st.fini = true; dessin('semi', PX.semi, {}); terminer('Voici la formule semi-développée, redressée.'); });
      } else if (b.classList.contains('orga-conv-refaire')) {
        Object.assign(st, { phase: 0, replies: new Set(), effaces: new Set(), ajoutes: new Set(), fini: false, cadre: null, redresse: false });
        actions.innerHTML = ''; message('');
        rendre();
      }
    });

    // geste sur un atome
    function geste(i) {
      const p = ph(), el = mol.atomes[i].el, nh = O.nbH(mol, i);
      if (p === 'replier') {
        if (st.replies.has(i)) return;
        if (!nh) return message(`${O.CE(el).replace(/^./, c => c.toUpperCase())} ne porte aucun H : rien à regrouper.`, 'info');
        const replier = () => {
          message('');
          // les H glissent vers leur atome puis disparaissent
          const gs = svg.querySelectorAll(`[data-de="${i}"]`);
          if (animer() && gs.length) {
            const c = st.sc.px[i];
            gs.forEach(g => {
              const bb = g.getBBox ? g.getBBox() : null;
              const cx = bb ? bb.x + bb.width / 2 : c.x, cy = bb ? bb.y + bb.height / 2 : c.y;
              g.style.transition = 'transform .35s ease, opacity .35s ease';
              g.style.transformBox = 'view-box';
              requestAnimationFrame(() => { g.style.transform = `translate(${r1(c.x - cx)}px, ${r1(c.y - cy)}px)`; g.style.opacity = '0'; });
            });
            st.anime = true;
            setTimeout(() => { st.anime = false; st.replies.add(i); rendre(); if (!aTraiter().length) finPhase(); }, 380);
          } else { st.replies.add(i); rendre(); if (!aTraiter().length) finPhase(); }
        };
        if (!o.compterH) return replier();
        const p2 = versConteneur(svg, zoneSvg, st.sc.px[i]);
        const ops = optionsH(el).filter(x => x.h > 0);
        bulle(zoneSvg, p2.x, p2.y, ops, k => {
          const h = ops[k].h;
          if (h === nh) return replier();
          message(`Tu as regroupé ${h} H : ${O.CE(el)} en porte ${nh}. Compte les H liés à cet atome.`);
        });
      } else if (p === 'effacer') {
        if (el !== 'C') return message(`On n'efface que les C et leurs H : ${O.etiquetteH(el, nh, true)} reste.`);
        if (st.effaces.has(i)) return;
        message('');
        const g = svg.querySelector(`.orga-at[data-a="${i}"]`);
        const fin = () => { st.effaces.add(i); rendre(); if (!aTraiter().length) finPhase(); };
        if (g && animer()) { g.style.transition = 'opacity .25s'; g.style.opacity = '0'; setTimeout(fin, 260); } else fin();
      } else {
        if (el !== 'C') return message(`Au bout de ce trait il y a déjà ${O.etiquetteH(el, nh, true)} : pas de C à ajouter.`);
        if (st.ajoutes.has(i)) return;
        const p2 = versConteneur(svg, zoneSvg, st.sc.px[i]);
        const ops = optionsH('C');
        bulle(zoneSvg, p2.x, p2.y, ops, k => {
          const h = ops[k].h, traits = O.somme(mol, i);
          if (h === nh) { message(''); st.ajoutes.add(i); rendre(); if (!aTraiter().length) finPhase(); return; }
          const quoi = mol.liaisons.filter(l => l.a === i || l.b === i).length > 1 ? 'Ce sommet' : 'Ce bout de trait';
          message(`${quoi} a ${traits} trait${traits > 1 ? 's' : ''} : 4 − ${traits} = ${nh} H, c'est ${O.etiquetteH('C', nh, true)}.`);
        });
      }
    }

    svg.addEventListener('click', ev => {
      if (st.fini || st.anime) return;
      const c = ev.target.closest('[data-cible]');
      if (c) geste(+c.dataset.cible.slice(1));
    });

    rendre();
    return { racine, montrer, recommencer: () => actions.querySelector('.orga-conv-refaire') };
  }

  /* ============================================================
     BULLES D'AIDE ⓘ (au toucher, pas au survol)
     info(html, label) → bouton ⓘ suivi de son texte caché ; un appui ouvre la bulle,
     un autre appui (ou ailleurs, ou Échap) la ferme. Plusieurs bulles par page.
     ============================================================ */
  function info(html, label) {
    return `<button type="button" class="orga-info" aria-label="${(label || 'Aide').replace(/"/g, '&quot;')}" aria-expanded="false"><span aria-hidden="true">i</span></button><span class="orga-info-txt" hidden>${html}</span>`;
  }
  let bulleInfo = null;
  function fermerInfo() {
    if (!bulleInfo) return;
    bulleInfo.b.setAttribute('aria-expanded', 'false');
    bulleInfo.el.remove();
    bulleInfo = null;
  }
  document.addEventListener('click', ev => {
    const b = ev.target.closest && ev.target.closest('.orga-info');
    if (!b) return;
    ev.preventDefault();
    if (bulleInfo && bulleInfo.b === b) { fermerInfo(); return; }
    fermerInfo();
    const t = b.nextElementSibling && b.nextElementSibling.classList.contains('orga-info-txt') ? b.nextElementSibling.innerHTML : '';
    const el = document.createElement('div');
    el.className = 'orga-bulle-info';
    el.setAttribute('role', 'note');
    el.innerHTML = t;
    document.body.appendChild(el);
    const r = b.getBoundingClientRect(), w = el.offsetWidth;
    el.style.left = (Math.max(8, Math.min(document.documentElement.clientWidth - w - 8, r.left + r.width / 2 - w / 2)) + window.scrollX) + 'px';
    el.style.top = (r.bottom + 6 + window.scrollY) + 'px';
    b.setAttribute('aria-expanded', 'true');
    bulleInfo = { b, el };
  });
  document.addEventListener('pointerdown', ev => { if (bulleInfo && !bulleInfo.el.contains(ev.target) && !bulleInfo.b.contains(ev.target)) fermerInfo(); }, true);
  document.addEventListener('keydown', ev => { if (ev.key === 'Escape') fermerInfo(); });

  // règles du cours avec un mini-exemple (bulles des outils de nomenclature)
  const BULLES = {
    chaine: '<b>La chaîne la plus longue</b> donne le nom. Elle n\'est pas toujours dessinée en ligne droite : suis tous les chemins d\'un bout à l\'autre. À longueur égale, on prend celle qui porte le plus de ramifications.',
    chaineGroupe: '<b>La chaîne principale contient le groupe caractéristique</b> : pour une C=C, ses deux C ; sinon le C qui porte le groupe.',
    ramif: '<b>Nom d\'une ramification</b> : le nom de l\'alcane, en remplaçant « ane » par « yl ». –CH₃ : méthyl ; –CH₂–CH₃ : éthyl ; –CH₂–CH₂–CH₃ : propyl.',
    numeros: '<b>Numérotation</b> : on numérote la chaîne principale par la droite ou par la gauche, pour que les numéros soient les plus petits possibles. Exemple : 2-méthylpentane, pas 4-méthylpentane.',
    groupeNum: '<b>Le n° est celui de l\'atome de carbone qui porte le groupe caractéristique.</b> Il a le plus petit numéro possible. Exemple : butan-2-ol. Pour -al, -oïque, -oate, -amide, ce C est le n° 1 (on ne l\'écrit pas).',
    multi: '<b>Ramifications identiques</b> : di (2), tri (3), tétra (4), penta (5), hexa (6), avec un numéro pour chacune. 2,3,5-triméthyl : un –CH₃ sur les carbones 2, 3 et 5.',
    alpha: '<b>Ordre alphabétique</b> : é avant m (éthyl avant méthyl) ; di, tri… ne comptent pas. Exemple : 3-éthyl-2,2-diméthylhexane.',
    tirets: '<b>Tirets et virgules</b> : une virgule entre deux chiffres (2,3), un tiret entre un chiffre et une lettre (2-méthyl, butan-2-ol), rien entre deux lettres (méthylpentane). Pas d\'espace, sauf « acide … » et « … de … ».',
    racines: '<b>Nombre de C de la chaîne</b> : méth 1, éth 2, prop 3, but 4, pent 5, hex 6, hept 7, oct 8, non 9, déc 10. Alcane : …ane (hexane).',
    suffixes: '<b>Terminaisons</b> : alcane -ane ; alcène -ène (but-2-ène) ; alcool -ol (butan-2-ol) ; aldéhyde -al (butanal) ; cétone -one (butan-2-one) ; acide carboxylique acide …-oïque (acide butanoïque) ; ester …oate de …yle ; amine -amine (butan-1-amine) ; amide -amide (butanamide). Devant une voyelle, « ane » perd son e : butan-2-ol.',
    ester: '<b>Ester « alcanoate d\'alkyle »</b> : la chaîne qui porte le C=O donne l\'alcanoate (son C est le n° 1) ; la chaîne liée à l\'O donne l\'alkyle, numérotée à partir du C lié à l\'O. Exemple : CH₃–COO–CH₂–CH₂–CH₂–CH₃, éthanoate de butyle.',
    N: '<b>N-</b> : la ramification est accrochée sur le N (pas sur un C). Exemple : N-éthyléthanamine : sur le N, il y a un éthyle accroché.',
    entourer: '<b>Un groupe caractéristique</b> contient un atome autre que C et H (O, N, halogène), ou une double liaison C=C. Entoure tous ses atomes : C=O et OH sur le même C forment un seul groupe, le groupe carboxyle.',
    familles: '<b>Familles</b> : C=C alcène ; –OH (hydroxyle) alcool ; C=O (carbonyle) au bout de la chaîne aldéhyde, entre deux C cétone ; –COOH (carboxyle) acide carboxylique ; –COO–C (ester) ester ; N (amine) amine ; –CO–N (amide) amide ; F, Cl, Br, I (halogéno) halogénoalcane.',
    depart: '<b>Le n° 1</b> est à un bout de la chaîne principale : celui qui donne les plus petits numéros (d\'abord au groupe caractéristique, puis aux ramifications).',
  };

  /* ============================================================
     DESSIN À TOUCHER (outils : entourer, chaîne, ramifications)
     dessinActif(zone, mol, { ecriture, hCibles }) → d
       d.rendre({ choisis: Set d'atomes, choisisH: Set de H, couleurs, numeros, entourer })
       d.surToucher = c => …   c : { type: 'atome', i } ou { type: 'h', k, de }
     Disposition fixe (calculée une fois) ; cadre stable (il ne fait que grandir).
     ============================================================ */
  function dessinActif(zone, mol, o) {
    o = o || {};
    const ec = o.ecriture || 'semi', f = 18;
    const racine = document.createElement('div');
    racine.className = 'orga-actif';
    racine.innerHTML = '<div class="orga-conv-zone orga-actif-zone"><svg class="orga-mol" role="img"></svg></div>';
    zone.appendChild(racine);
    const svg = racine.querySelector('svg');
    const px = scene(mol, ec, { police: f, chaine: o.chaine }).px;
    let cadre = null;
    const d = {
      racine, svg, mol, ec, px, sc: null,
      rendre(x) {
        x = x || {};
        const sc = scene(mol, ec, { px, police: f, couleurs: x.couleurs, numeros: x.numeros, entourer: x.entourer, doublets: o.doublets });
        d.sc = sc;
        const b = sc.cadre, m = 24;
        if (!cadre) cadre = { x1: b.x1 - m, y1: b.y1 - m, x2: b.x2 + m, y2: b.y2 + m };
        cadre.x1 = Math.min(cadre.x1, b.x1 - m); cadre.y1 = Math.min(cadre.y1, b.y1 - m); cadre.x2 = Math.max(cadre.x2, b.x2 + m); cadre.y2 = Math.max(cadre.y2, b.y2 + m);
        const w = Math.round(cadre.x2 - cadre.x1), h = Math.round(cadre.y2 - cadre.y1);
        svg.setAttribute('viewBox', `${r1(cadre.x1)} ${r1(cadre.y1)} ${w} ${h}`);
        svg.setAttribute('width', w); svg.setAttribute('height', h);
        Object.assign(svg.style, { width: w + 'px', maxWidth: '100%', minWidth: Math.round(Math.min(w, w * .8)) + 'px', height: 'auto' });
        // atomes choisis : fond sous l'étiquette ou cercle autour du sommet
        let sous = '';
        (x.choisis || new Set()).forEach(i => {
          const p = sc.px[i], e = sc.etiq[i];
          if (!p) return;
          if (!e) sous += `<circle class="orga-choisi" cx="${r1(p.x)}" cy="${r1(p.y)}" r="12"/>`;
          else { const bt = e.boite, mm = 5; sous += `<rect class="orga-choisi" x="${r1(p.x + bt.x1 - mm)}" y="${r1(p.y + bt.y1 - mm)}" width="${r1(bt.x2 - bt.x1 + 2 * mm)}" height="${r1(bt.y2 - bt.y1 + 2 * mm)}" rx="10"/>`; }
        });
        (x.choisisH || new Set()).forEach(k => { const hh = sc.H[k]; if (hh) sous += `<circle class="orga-choisi" cx="${r1(hh.x)}" cy="${r1(hh.y)}" r="11"/>`; });
        let cibles = '';
        if (!x.fige) {
          sc.px.forEach((p, i) => { cibles += `<circle class="orga-cible" data-cible="a${i}" cx="${r1(p.x)}" cy="${r1(p.y)}" r="22"/>`; });
          if (o.hCibles) sc.H.forEach((hh, k) => { cibles += `<circle class="orga-cible" data-cible="h${k}" cx="${r1(hh.x)}" cy="${r1(hh.y)}" r="13"/>`; });
        }
        svg.innerHTML = svgCorps(sc, { sous, points: ec === 'topo' && !x.fige }) + `<g class="orga-cibles">${cibles}</g>`;
        svg.setAttribute('aria-label', x.label || o.label || NOM_EC[ec]);
        racine.classList.toggle('orga-actif-fige', !!x.fige);
      },
    };
    svg.addEventListener('click', ev => {
      const c = ev.target.closest('[data-cible]');
      if (!c || !d.surToucher) return;
      const v = c.dataset.cible, k = +v.slice(1);
      d.surToucher(v[0] === 'a' ? { type: 'atome', i: k } : { type: 'h', k, de: d.sc.H[k] && d.sc.H[k].de });
    });
    return d;
  }

  // petit élément HTML
  function el(tag, cls, html) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }
  const secouer = e => { if (!e) return; e.classList.remove('er-secoue'); void e.offsetWidth; e.classList.add('er-secoue'); };
  const molDe = m => (typeof m === 'string' ? O.lire(m) : m);
  // désignation d'un atome dessiné dans un message : « CH₂ », « C₂H₅ », « ce sommet »
  function nomAtome(mol, i, ec) {
    const a = mol.atomes[i];
    if (a.etiq) return formuleHTML(a.etiq);
    if (ec === 'topo' && a.el === 'C') return 'Ce sommet (un C avec ses H)';
    return O.etiquetteH(a.el, ec === 'developpee' ? 0 : O.nbH(mol, i), true);
  }

  /* ============================================================
     ENTOURER LES GROUPES CARACTÉRISTIQUES
     (repris de rappels-1ere-sti2d/ RP.partieEntourer, étendu à toutes les familles et aux trois écritures)
     partieEntourer(mol, { ecriture, condenser, q }) → partie 'perso' :
       l'élève touche les atomes (et les H en développée), puis Valider ; groupes entourés et numérotés.
     partiesNommerGroupes(mol) → une partie 'choix' par sorte de groupe : « groupe … · famille des … »
     ============================================================ */
  function prepGroupes(mol, o) {
    const cond = o && o.condenser ? O.condenser(mol, o.condenser) : null;
    const md = cond ? cond.mol : mol;
    const map = i => (cond ? cond.vers.get(i) : i);
    const gs = O.groupes(mol).map(g => Object.assign({}, g, { at: [...new Set(g.atomes.map(map))], aH: g.avecH.map(map) }));
    return { md, gs };
  }
  const entouresDe = gs => gs.map((g, k) => ({ atomes: g.at, avecH: g.aH, numero: gs.length > 1 ? k + 1 : null }));
  function legendeHTML(gs) {
    return '<ul class="orga-legende">' + gs.map((g, k) => `<li>${gs.length > 1 ? `<i>${k + 1}</i> ` : ''}<b>${g.nomGroupe === 'C=C' ? 'double liaison C=C' : g.nomGroupe}</b> (${g.familles}${g.classe && g.cle === 'amine' ? ', ' + g.classe : ''})</li>`).join('') + '</ul>';
  }
  // correction : le dessin avec ses groupes entourés, puis la légende
  function corrigeGroupes(mol, o) {
    const { md, gs } = prepGroupes(mol, o || {});
    return dessinHTML(md, { ecriture: (o && o.ecriture) || 'semi', entourer: entouresDe(gs), sansAide: true }) + legendeHTML(gs);
  }

  // diagnostic d'un entourage (atomes et H choisis) ; null si c'est juste
  function diagEntourer(md, gs, choisis, hPar, ec) {
    const attendus = new Set(gs.flatMap(g => g.at));
    if (!choisis.size) return 'Touche les atomes à entourer : ils se marquent. Touche-les à nouveau pour les libérer.';
    const intrus = [...choisis].find(i => !attendus.has(i));
    if (intrus != null) {
      const a = md.atomes[intrus];
      if (a.el === 'C' || a.etiq) return `${nomAtome(md, intrus, ec)} ne contient que des atomes de carbone et d'hydrogène : ce n'est pas un groupe caractéristique (il faut un atome O, N, un halogène, ou une double liaison C=C).`;
      return 'Entoure seulement les atomes des groupes caractéristiques.';
    }
    const hIntrus = hPar.find(de => !attendus.has(de));
    if (hIntrus != null) return 'Ce H est lié à un atome qui ne fait pas partie d\'un groupe caractéristique.';
    for (const g of gs) {
      const pris = g.at.filter(i => choisis.has(i));
      if (!pris.length || pris.length === g.at.length) continue;
      const el = i => md.atomes[i].el;
      const que = els => pris.every(i => els.includes(el(i)));
      if (g.cle === 'acide') return que(['O']) && pris.length === 1 && O.nbH(md, pris[0]) === 1
        ? 'Ce OH est sur un C qui porte aussi un =O : C, =O et OH forment ensemble un <b>groupe carboxyle</b> (acide ≠ alcool). Entoure les trois.'
        : 'Le groupe carboxyle est formé du C, du O lié par une double liaison et du OH, sur le même C : entoure-les tous.';
      if (g.cle === 'ester') return 'Le groupe ester est formé du C, du =O et du O lié à un autre C, sur le même C : entoure les trois (ester ≠ cétone).';
      if (g.cle === 'amide') return que(['N']) ? 'Ce N est lié au C d\'un C=O : C, =O et N forment ensemble un <b>groupe amide</b> (amide ≠ amine). Entoure les trois.'
        : 'Le N lié au C du C=O fait partie du groupe : C, =O et N forment ensemble un <b>groupe amide</b> (amide ≠ cétone). Entoure les trois.';
      if (g.cle === 'aldehyde' || g.cle === 'cetone') return 'Le groupe carbonyle, c\'est le C et le O liés par la double liaison : entoure les deux.';
      if (g.cle === 'alcene') return 'Pour la double liaison C=C, entoure ses deux atomes de carbone.';
    }
    const oublie = gs.find(g => !g.at.some(i => choisis.has(i)));
    if (oublie) return `Il manque ${gs.length > 1 ? 'au moins un' : 'le'} groupe caractéristique : repère les atomes O, N, les halogènes et les doubles liaisons C=C.`;
    return null;
  }

  function partieEntourer(mol0, o) {
    o = o || {};
    const mol = molDe(mol0), ec = o.ecriture || 'semi';
    const { md, gs } = prepGroupes(mol, o);
    return Object.assign({
      type: 'perso',
      q: o.q != null ? o.q : 'Touche les atomes qui forment les groupes caractéristiques pour les entourer, puis valide.',
      // la légende (noms des groupes) seulement sur demande : elle donnerait la réponse des questions suivantes
      solution: o.legende ? legendeHTML(gs) : `<p>${gs.length > 1 ? `Les ${gs.length} groupes caractéristiques sont entourés et numérotés.` : 'Le groupe caractéristique est entouré.'}</p>`,
      monter(zone, api) {
        const da = dessinActif(zone, md, { ecriture: ec, hCibles: ec === 'developpee' });
        if (md.atomes.some(a => a.etiq)) zone.insertAdjacentHTML('beforeend', aidesCondensees(md));
        const act = el('div', 'er-actions orga-actions-partie', `<button type="button" class="btn-primary">Valider</button>${info(BULLES.entourer, 'Aide : entourer un groupe')}`);
        zone.appendChild(act);
        const choisis = new Set(), choisisH = new Set();
        let fige = false;
        // groupe dont tous les atomes sont touchés : entouré tout de suite, sans numéro
        const rendre = () => da.rendre(fige ? { entourer: entouresDe(gs), fige: true }
          : { choisis, choisisH, entourer: gs.filter(g => g.at.every(i => choisis.has(i))).map(g => ({ atomes: g.at, avecH: [], provisoire: true })) });
        da.surToucher = c => {
          if (fige || api.fini()) return;
          const s = c.type === 'atome' ? choisis : choisisH, k = c.type === 'atome' ? c.i : c.k;
          if (s.has(k)) s.delete(k); else s.add(k);
          api.effacer();
          rendre();
        };
        const fermer = () => { fige = true; act.remove(); rendre(); };
        act.querySelector('.btn-primary').onclick = () => {
          if (fige || api.fini()) return;
          const d = diagEntourer(md, gs, choisis, [...choisisH].map(k => da.sc.H[k].de), ec);
          if (!d) { fermer(); api.reussi(); return; }
          secouer(da.racine);
          if (!choisis.size) api.message(d); else api.erreur(d);
        };
        rendre();
        return { montrer() { choisis.clear(); choisisH.clear(); fermer(); } };
      },
    }, o.partie);
  }

  // propositions « groupe … · famille des … » : la bonne et trois confusions classiques
  const CONFUSIONS = {
    alcool: [['alcool', 'acide', 'Le groupe hydroxyle –OH, sur un C qui ne porte pas de =O, donne la famille des <b>alcools</b>.'], ['acide', 'acide', 'Ce OH est sur un C qui ne porte pas de =O : c\'est un groupe <b>hydroxyle</b>.'], ['cetone', 'cetone', 'Pas de C=O ici : le O est lié à un H, c\'est –OH.']],
    aldehyde: [['aldehyde', 'cetone', 'Le C du C=O est au bout de la chaîne et porte un H : famille des <b>aldéhydes</b>.'], ['alcool', 'alcool', 'Le O est lié au C par une double liaison : C=O, groupe <b>carbonyle</b>.'], ['acide', 'acide', 'Pas de OH sur ce C : ce n\'est pas un carboxyle.']],
    cetone: [['cetone', 'aldehyde', 'Le C du C=O est entre deux C (il ne porte pas de H) : famille des <b>cétones</b>.'], ['alcool', 'alcool', 'Le O est lié au C par une double liaison : C=O, groupe <b>carbonyle</b>.'], ['ester', 'ester', 'Il n\'y a pas de second O sur ce C : ce n\'est pas un ester.']],
    acide: [['alcool', 'alcool', 'Acide ≠ alcool : le OH est sur un C qui porte aussi un =O ; ensemble, c\'est un groupe <b>carboxyle</b>.'], ['cetone', 'cetone', 'Acide ≠ cétone : le C du C=O porte aussi un OH ; ensemble, c\'est un groupe <b>carboxyle</b>.'], ['ester', 'ester', 'Le O lié au C=O porte un H, pas un C : ce n\'est pas un ester.']],
    ester: [['acide', 'acide', 'Ester ≠ acide : le O lié au C=O est lié à un C, pas à un H.'], ['cetone', 'cetone', 'Le C du C=O porte aussi un O lié à un C : groupe <b>ester</b>.'], ['alcool', 'alcool', 'Aucun O ne porte de H ici : pas de groupe hydroxyle.']],
    amine: [['amide', 'amide', 'Le N n\'est pas lié au C d\'un C=O : c\'est un groupe <b>amine</b>.'], ['amine', 'amide', 'Le groupe amine donne la famille des <b>amines</b>.'], ['alcool', 'alcool', 'L\'atome entouré est un N, pas un O.']],
    amide: [['amine', 'amine', 'Amide ≠ amine : le N est lié au C d\'un C=O ; ensemble, c\'est un groupe <b>amide</b>.'], ['cetone', 'cetone', 'Amide ≠ cétone : le C du C=O porte aussi un N ; ensemble, c\'est un groupe <b>amide</b>.'], ['amide', 'amine', 'Le groupe amide donne la famille des <b>amides</b>.']],
    alcene: [['alcene', 'alcane', 'Une double liaison C=C donne la famille des <b>alcènes</b> (les alcanes n\'ont que des liaisons simples).'], ['cetone', 'cetone', 'C=C : deux atomes de carbone, pas de O.'], ['alcool', 'alcool', 'Il n\'y a pas de O dans ce groupe.']],
    halogeno: [['halogeno', 'alcane', 'Un halogène (F, Cl, Br, I) sur la chaîne donne la famille des <b>halogénoalcanes</b>.'], ['alcool', 'alcool', 'L\'atome entouré est un halogène, pas un O.'], ['amine', 'amine', 'L\'atome entouré est un halogène, pas un N.']],
  };
  const NOM_GROUPE = c => (c === 'alcene' ? 'double liaison C=C' : c === 'alcane' ? '' : O.FAMILLES[c].nomGroupe);
  const FAMILLES_TXT = c => (c === 'alcane' ? 'alcanes' : O.FAMILLES[c].familles);
  const combo = (g, f) => `${NOM_GROUPE(g)} · famille des ${FAMILLES_TXT(f)}`;
  const melanger = t => { const a = t.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  function partieNommerGroupe(cle, q, numeros) {
    const conf = CONFUSIONS[cle];
    const options = [{ id: 'ok', label: combo(cle, cle) }].concat(conf.map((c, k) => ({ id: 'c' + k, label: combo(c[0], c[1]) })));
    const indices = {};
    conf.forEach((c, k) => { indices['c' + k] = c[2]; });
    return {
      type: 'choix', q, options: melanger(options), bonne: 'ok', indices, colonne: true, melanger: false,
      solution: `<p>Groupe ${numeros ? numeros + ' ' : ''}: <b>${NOM_GROUPE(cle)}</b> (${FAMILLES_TXT(cle)}).</p>`,
    };
  }
  function partiesNommerGroupes(mol0) {
    const gs = O.groupes(molDe(mol0));
    const cles = [...new Set(gs.map(g => g.cle))];
    return cles.map(cle => {
      const ns = gs.map((g, k) => (g.cle === cle ? k + 1 : 0)).filter(Boolean);
      const txt = gs.length === 1 ? '' : ns.length > 1 ? `n° ${ns.slice(0, -1).join(', ')} et ${ns[ns.length - 1]}` : `n° ${ns[0]}`;
      const q = gs.length === 1 ? 'Nomme le groupe entouré et donne sa famille.' : `Nomme le groupe entouré ${txt}${ns.length > 1 ? ' (ils sont identiques)' : ''} et donne sa famille.`;
      return partieNommerGroupe(cle, q, txt);
    });
  }

  /* ============================================================
     CHAÎNE PRINCIPALE À TOUCHER (séries : « toucher la chaîne la plus longue »)
     ============================================================ */
  function partieChaine(mol0, o) {
    o = o || {};
    const mol = molDe(mol0), res = O.nommer(mol), ec = o.ecriture || 'semi';
    return Object.assign({
      type: 'perso',
      q: o.q != null ? o.q : 'Touche les C de la chaîne principale (la plus longue), puis valide.',
      solution: `<p>La chaîne principale a ${res.n} C${res.chaine.length ? '' : ''}.</p>`,
      monter(zone, api) {
        const da = dessinActif(zone, mol, { ecriture: ec });
        const act = el('div', 'er-actions orga-actions-partie', `<button type="button" class="btn-primary">Valider la chaîne</button>${info(BULLES.chaine, 'Aide : chaîne principale')}`);
        zone.appendChild(act);
        const choisis = new Set();
        let fige = false;
        da.surToucher = c => {
          if (fige || api.fini() || c.type !== 'atome') return;
          if (mol.atomes[c.i].el !== 'C') { api.message('La chaîne carbonée ne contient que des atomes de carbone.'); return; }
          if (choisis.has(c.i)) choisis.delete(c.i); else choisis.add(c.i);
          api.effacer(); da.rendre({ choisis });
        };
        const fermer = ch => { fige = true; act.remove(); da.rendre({ couleurs: { chaine: ch }, fige: true }); };
        act.querySelector('.btn-primary').onclick = () => {
          if (fige || api.fini()) return;
          const r = O.evaluerChaine(mol, res, [...choisis]);
          if (r.ok) { fermer([...choisis]); api.reussi(); return; }
          secouer(da.racine);
          if (!choisis.size) api.message(r.diag); else api.erreur(r.diag);
        };
        da.rendre({ choisis });
        return { montrer() { fermer(res.chaine); } };
      },
    }, o.partie);
  }

  /* ============================================================
     NOMMER UNE MOLÉCULE, AVEC DES AIDES ACTIVABLES
     partieNom(mol, { ecriture, cleAides, q, groupe }) → partie 'perso'
     Aides (interrupteurs gardés dans localStorage[cleAides], toutes activées par défaut) :
       couleurs : l'élève entoure le groupe (familles), touche la chaîne principale, le n° 1,
                  puis chaque ramification ; chaque partie prend sa couleur ;
       decoupe  : le nom en morceaux de la couleur des parties ; la chaîne d'abord ;
                  tirets et virgules ajoutés tout seuls, nom complet dessous ;
       bulles   : boutons ⓘ (règles du cours et mini-exemples).
     ============================================================ */
  const AIDES_DEFAUT = { couleurs: true, decoupe: true, bulles: true };
  function lireAides(cle) {
    if (!cle) return Object.assign({}, AIDES_DEFAUT);
    try { return Object.assign({}, AIDES_DEFAUT, JSON.parse(localStorage.getItem(cle)) || {}); } catch (e) { return Object.assign({}, AIDES_DEFAUT); }
  }
  function ecrireAides(cle, a) { if (!cle) return; try { localStorage.setItem(cle, JSON.stringify(a)); } catch (e) { /* stockage indisponible */ } }
  let aidesSession = null;   // réglage gardé pendant la page si le stockage est indisponible

  function solutionNom(mol, res, ec) {
    const ent = res.groupe ? [{ atomes: res.groupe.atomes, avecH: res.groupe.avecH }] : null;
    const reg = res.variantes.length ? `<p class="orga-note">On regroupe les ramifications identiques, même si l'une est sur le N et l'autre sur un C : ${nomHTML(res.parties)} (on accepte aussi ${res.variantes[0]}).</p>` : '';
    return `${dessinHTML(mol, { ecriture: ec, couleurs: res.couleurs, numeros: res.cyclo && res.ramifs.length < 2 ? null : res.numeros, entourer: ent })}<p class="orga-sol-nom">${nomHTML(res.parties)}</p>${reg}`;
  }

  function partieNom(mol0, o) {
    o = Object.assign({ ecriture: 'semi' }, o);
    const mol = molDe(mol0), res = O.nommer(mol);
    return Object.assign({
      type: 'perso',
      q: o.q != null ? o.q : 'Donne le nom de cette molécule.',
      solution: res.horsProgramme ? '' : `<p class="orga-sol-nom">${nomHTML(res.parties)}</p>${res.variantes.length ? `<p class="orga-note">On regroupe les ramifications identiques, même si l'une est sur le N et l'autre sur un C ; on accepte aussi ${res.variantes[0]}.</p>` : ''}`,
      monter(zone, api) { return outilNom(zone, mol, res, o, api); },
    }, o.partie);
  }

  function outilNom(zone, mol, res0, o, api) {
    const ec = o.ecriture;
    const racine = el('div', 'orga-nommer');
    zone.appendChild(racine);
    let fini = false, ctx = null;
    const famille = !['alcane'].includes(res0.famille) && O.groupes(mol).length > 0;

    function monter() {
      racine.innerHTML = '';
      const aides = aidesSession || lireAides(o.cleAides);
      const B = (cle, label) => (aides.bulles ? info(BULLES[cle], label) : '');
      // panneau des aides
      const panneau = el('details', 'orga-aides');
      panneau.innerHTML = `<summary>Aides</summary><div class="orga-aides-l">${[['couleurs', 'Couleurs : je repère le groupe, la chaîne, le n° 1 et les ramifications'], ['decoupe', 'Nom découpé : un morceau par partie de la molécule'], ['bulles', 'Bulles ⓘ : les règles du cours']]
        .map(([k, t]) => `<label class="orga-interr"><input type="checkbox" data-aide="${k}"${aides[k] ? ' checked' : ''}> ${t}</label>`).join('')}</div>`;
      racine.appendChild(panneau);
      panneau.addEventListener('change', ev => {
        const c = ev.target.closest('[data-aide]');
        if (!c) return;
        const a = Object.assign({}, aides, { [c.dataset.aide]: c.checked });
        aidesSession = a; ecrireAides(o.cleAides, a);
        if (!fini) { monter(); racine.querySelector('.orga-aides').open = true; }
      });
      const consigne = el('p', 'orga-nommer-consigne');
      racine.appendChild(consigne);
      const da = dessinActif(racine, mol, { ecriture: ec, chaine: res0.chaine });
      if (mol.atomes.some(a => a.etiq)) racine.insertAdjacentHTML('beforeend', aidesCondensees(mol));
      const legende = el('div', 'orga-ram-liste');
      racine.appendChild(legende);
      const act = el('div', 'er-actions orga-actions-partie');
      racine.appendChild(act);
      const champ = el('div', 'orga-nom-champ');
      racine.appendChild(champ);

      // état de la couleur du dessin
      const st = { etape: null, choisis: new Set(), groupeFait: false, chaine: null, ordre: null, res: res0, faites: new Set() };
      const couleursActuelles = () => {
        const c = {};
        if (st.groupeFait && st.res.groupe) c.groupe = O.groupes(mol).flatMap(g => g.atomes);
        if (st.ordre) c.chaine = st.ordre;
        else if (st.chaine) c.chaine = st.chaine;
        st.res.ramifs.forEach((r, k) => { if (st.faites.has(k)) (c[r.classe] = c[r.classe] || []).push(...r.atomes); });
        return c;
      };
      const rendre = () => da.rendre({
        choisis: st.choisis, couleurs: couleursActuelles(), numeros: st.ordre && !(st.res.cyclo && st.res.ramifs.length < 2) ? st.ordre : null,
        entourer: st.groupeFait ? O.groupes(mol).map(g => ({ atomes: g.atomes, avecH: g.avecH })) : null, fige: fini || st.etape === 'nom' || st.etape === 'groupeNom',
      });
      const ramifsATrouver = () => st.res.ramifs.map((r, k) => k).filter(k => !st.res.ramifs[k].halo);

      function etape(e) {
        st.etape = e; st.choisis.clear(); act.innerHTML = '';
        if (e === 'groupe') {
          consigne.innerHTML = `Entoure le groupe caractéristique : touche ses atomes, puis valide. ${B('entourer', 'Aide : groupe caractéristique')}`;
          act.innerHTML = '<button type="button" class="btn-primary">Valider le groupe</button>';
          act.querySelector('button').onclick = () => {
            const gs = O.groupes(mol).map(g => Object.assign({}, g, { at: g.atomes, aH: g.avecH }));
            const d = diagEntourer(mol, gs, st.choisis, [], ec);
            if (d) { secouer(da.racine); if (!st.choisis.size) api.message(d); else api.erreur(d); return; }
            api.effacer(); st.groupeFait = true; etape('groupeNom');
          };
        } else if (e === 'groupeNom') {
          const g = st.res.groupe ? st.res.groupe.cle : 'halogeno';
          const p = partieNommerGroupe(g, 'Nomme ce groupe et donne la famille de la molécule.');
          consigne.innerHTML = `${p.q} ${B('familles', 'Aide : les familles')}`;
          const box = el('div', 'orga-choix-box ph-choix ph-choix-col');
          p.options.forEach(op => {
            const b = el('button', 'btn-secondary', op.label);
            b.type = 'button';
            b.onclick = () => {
              if (op.id === p.bonne) { b.classList.add('juste'); api.effacer(); setTimeout(() => etape('chaine'), 250); }
              else { b.classList.add('faux'); b.disabled = true; api.erreur(p.indices[op.id]); }
            };
            box.appendChild(b);
          });
          act.appendChild(box);
        } else if (e === 'chaine') {
          consigne.innerHTML = `Touche les C de la chaîne principale${famille ? ' (la plus longue qui contient le groupe)' : ' (la plus longue)'}, puis valide. ${B('chaine', 'Aide : chaîne principale')}${famille ? B('chaineGroupe', 'Aide : chaîne et groupe') : ''}`;
          act.innerHTML = '<button type="button" class="btn-primary">Valider la chaîne</button>';
          act.querySelector('button').onclick = () => {
            const r = O.evaluerChaine(mol, res0, [...st.choisis]);
            if (!r.ok) { secouer(da.racine); if (!st.choisis.size) api.message(r.diag); else api.erreur(r.diag); return; }
            api.effacer(); st.chaine = [...st.choisis]; etape('depart');
          };
        } else if (e === 'depart') {
          consigne.innerHTML = `Touche le C n° 1 de la chaîne principale. ${B('depart', 'Aide : le n° 1')}${famille ? B('groupeNum', 'Aide : numéro du groupe') : B('numeros', 'Aide : numérotation')}`;
        } else if (e === 'ramifs') {
          if (!ramifsATrouver().length) return etape('nom');
          consigne.innerHTML = `Touche les C de chaque ramification${st.res.famille === 'ester' ? ' (et de l\'alkyle, la chaîne liée à l\'O)' : ''} : elle prend la couleur de son type. ${B('ramif', 'Aide : ramifications')}${st.res.ramifs.some(r => r.pos === 'N') ? B('N', 'Aide : ramification sur le N') : ''}`;
        } else if (e === 'nom') {
          consigne.innerHTML = aides.decoupe ? 'Écris le nom, morceau par morceau : commence par la chaîne principale, c\'est la fin du nom.' : 'Écris le nom de la molécule.';
          champNom(champ, aides);
        }
        majLegende();
        rendre();
      }
      // types de ramifications déjà repérés, chacun dans sa couleur
      function majLegende() {
        const vus = new Set(), l = [];
        st.res.ramifs.forEach((r, k) => {
          if (!st.faites.has(k) || r.halo) return;
          const cle = r.nom + (r.pos === 'N' ? 'N' : '');
          if (vus.has(cle)) return;
          vus.add(cle);
          l.push(`<span class="orga-ram orga-n-${r.classe}">${r.alkyle ? 'alkyle : ' : ''}${r.nom}${r.pos === 'N' ? ' (sur le N)' : ''}</span>`);
        });
        legende.innerHTML = l.join('');
      }

      da.surToucher = c => {
        if (fini || api.fini() || c.type !== 'atome') return;
        const i = c.i, a = mol.atomes[i];
        if (st.etape === 'groupe' || st.etape === 'chaine') {
          if (st.etape === 'chaine' && a.el !== 'C') { api.message('La chaîne carbonée ne contient que des atomes de carbone.'); return; }
          if (st.choisis.has(i)) st.choisis.delete(i); else st.choisis.add(i);
          api.effacer(); rendre();
        } else if (st.etape === 'depart') {
          const r = O.evaluerDepart(mol, res0, st.chaine, i);
          if (!r.ok) { secouer(da.racine); api.erreur(r.diag); return; }
          api.effacer();
          st.ordre = r.chaine;
          st.res = O.nommer(mol, { chaine: r.chaine });
          etape('ramifs');
        } else if (st.etape === 'ramifs') {
          const k = st.res.ramifs.findIndex(r => r.atomes.includes(i));
          if (st.ordre.includes(i)) { api.message('Ce C fait partie de la chaîne principale.'); return; }
          if (k < 0 || st.res.ramifs[k].halo) { api.message(a.el === 'C' ? 'Ce C n\'est pas dans une ramification.' : 'Cet atome fait partie du groupe caractéristique.'); return; }
          if (st.faites.has(k)) return;
          if (st.choisis.has(i)) st.choisis.delete(i); else st.choisis.add(i);
          api.effacer();
          // une ramification dont tous les C sont touchés prend la couleur de son type
          st.res.ramifs.forEach((r, j) => {
            if (st.faites.has(j) || r.halo) return;
            const cs = r.atomes.filter(x => mol.atomes[x].el === 'C');
            if (cs.every(x => st.choisis.has(x))) { st.faites.add(j); cs.forEach(x => st.choisis.delete(x)); }
          });
          if (ramifsATrouver().every(j => st.faites.has(j))) { etape('nom'); return; }
          majLegende(); rendre();
        }
      };

      // ---------- champ du nom : découpé (morceaux colorés) ou libre ----------
      function champNom(z, aides) {
        const res = st.res;
        if (!aides.decoupe) {
          z.innerHTML = `<div class="orga-nom-libre"><input type="text" class="orga-champ orga-champ-nom" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Nom de la molécule" placeholder="nom">${B('tirets', 'Aide : tirets et virgules')}${B('alpha', 'Aide : ordre alphabétique')}</div>
            <div class="er-actions orga-actions-partie"><button type="button" class="btn-primary">Valider</button></div>`;
          const inp = z.querySelector('input');
          const valider = () => {
            if (fini || api.fini()) return;
            const d = O.diagnostiquerNom(inp.value, res);
            if (d.vide) { api.message(d.diag); return; }
            if (!d.ok) { secouer(inp); api.erreur(d.diag); return; }
            inp.disabled = true; terminer(d.remarque);
          };
          inp.addEventListener('input', () => api.effacer());
          inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); valider(); } });
          z.querySelector('.btn-primary').onclick = valider;
          return;
        }
        const ms = res.morceaux;
        let h = '<div class="orga-morceaux">';
        ms.forEach((m, k) => {
          const coul = `style="--mc: var(--orga-${m.classe === 'chaine' ? 'chaine' : m.classe === 'groupe' ? 'groupe' : 'ram-' + m.classe.slice(1)})"`;
          if (m.type === 'ramif') {
            h += `<div class="orga-mx" data-k="${k}" ${coul}><span class="orga-mx-t">${m.halo ? 'Halogène' : 'Ramification'}</span>
              <input type="text" class="orga-champ orga-mx-num" data-r="num" inputmode="text" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Numéros" placeholder="n°">
              <span class="orga-seg orga-mx-mult" role="group" aria-label="Préfixe">${['', 'di', 'tri', 'tétra'].map(x => `<button type="button" class="orga-pil" data-mult="${x}" aria-pressed="${x === '' ? 'true' : 'false'}">${x || '–'}</button>`).join('')}</span>
              <input type="text" class="orga-champ orga-mx-nom" data-r="nom" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Nom de la ramification" placeholder="${m.halo ? 'chloro…' : 'méthyl…'}">
              ${B(m.halo ? 'multi' : 'ramif', 'Aide : nom de la ramification')}${B('numeros', 'Aide : numéros')}${m.locs.includes('N') ? B('N', 'Aide : N-') : ''}</div>`;
          } else if (m.type === 'chaine') {
            h += `<div class="orga-mx" data-k="${k}" ${coul}><span class="orga-mx-t">Chaîne principale</span>
              <input type="text" class="orga-champ orga-mx-chaine" data-r="chaine" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Chaîne principale" placeholder="${res.famille === 'alcane' || res.famille === 'halogeno' ? 'hexane…' : 'hexan…'}">${B('racines', 'Aide : nombre de C')}</div>`;
          } else if (m.type === 'groupe') {
            h += `<div class="orga-mx" data-k="${k}" ${coul}><span class="orga-mx-t">Groupe${m.acide ? ' (acide …)' : ''}</span>
              <input type="text" class="orga-champ orga-mx-num" data-r="gnum" inputmode="numeric" autocomplete="off" aria-label="Numéro du groupe" placeholder="n°">
              <input type="text" class="orga-champ orga-mx-nom" data-r="suf" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Terminaison" placeholder="terminaison">${B('suffixes', 'Aide : terminaisons')}${B('groupeNum', 'Aide : numéro du groupe')}</div>`;
          } else if (m.type === 'alkyle') {
            h += `<div class="orga-mx" data-k="${k}" ${coul}><span class="orga-mx-t">Alkyle (sur l'O)</span>
              <input type="text" class="orga-champ orga-mx-nom" data-r="alk" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Alkyle" placeholder="éthyle…">${B('ester', 'Aide : ester')}</div>`;
          }
        });
        h += `</div><p class="orga-nom-complet" aria-live="polite"></p><div class="er-actions orga-actions-partie"><button type="button" class="btn-primary">Valider</button>${B('alpha', 'Aide : ordre alphabétique')}${B('tirets', 'Aide : tirets et virgules')}</div>`;
        z.innerHTML = h;
        const lignes = [...z.querySelectorAll('.orga-mx')];
        const ligneChaine = lignes.find(l => ms[+l.dataset.k].type === 'chaine');
        const sa = x => O.sansAccent(String(x || '').trim().toLowerCase());
        // la chaîne : « hex », « hexane », « hexan » acceptés ; le reste attend qu'elle soit juste
        const chaineJuste = () => {
          const m = sa(ligneChaine.querySelector('input').value).match(/^(cyclo)?(meth|eth|prop|but|pent|hex|hept|oct|non|dec)(an|ane)?$/);
          return !!m && O.RACINES.map(O.sansAccent).indexOf(m[2]) + 1 === res.n && !!m[1] === res.cyclo;
        };
        const verrou = () => {
          const ok = chaineJuste();
          ligneChaine.classList.toggle('ok', ok);
          lignes.forEach(l => { if (l !== ligneChaine) { l.classList.toggle('attend', !ok); l.querySelectorAll('input, button').forEach(x => { if (!x.classList.contains('orga-info')) x.disabled = !ok; }); } });
        };
        const lire = l => {
          const v = r => { const x = l.querySelector(`[data-r="${r}"]`); return x ? x.value.trim() : ''; };
          const mult = l.querySelector('[data-mult][aria-pressed="true"]');
          return { num: v('num'), nom: v('nom'), chaine: v('chaine'), gnum: v('gnum'), suf: v('suf'), alk: v('alk'), mult: mult ? mult.dataset.mult : '' };
        };
        // nom complet assemblé (tirets et virgules ajoutés tout seuls)
        const assembler = () => {
          let pref = [], chaine = '', groupe = '', alk = '', acide = false;
          lignes.forEach(l => {
            const m = ms[+l.dataset.k], x = lire(l);
            if (m.type === 'ramif') {
              const locs = (x.num.match(/\d+|[nN]/g) || []).map(t => (/n/i.test(t) ? 'N' : t));
              if (x.nom || locs.length) pref.push({ t: (locs.length ? locs.join(',') + '-' : '') + x.mult + x.nom.replace(/^-+|-+$/g, ''), c: m.classe });
            } else if (m.type === 'chaine') {
              chaine = chaineJuste() ? m.texte : x.chaine;
            } else if (m.type === 'groupe') {
              acide = m.acide;
              const suf = x.suf.replace(/^[-\s\d]+/, '').replace(/^acide\s*/i, '');
              const num = (x.gnum.match(/\d+/) || x.suf.match(/\d+/) || [''])[0];
              groupe = suf ? (num ? `-${num}-${suf}` : suf) : '';
            } else alk = x.alk;
          });
          const de = alk ? (/^[aeiouyhéèê]/i.test(alk) ? ' d\'' : ' de ') : '';
          const texte = (acide ? 'acide ' : '') + pref.map(p => p.t).join('-') + chaine + groupe + de + alk;
          const html = (acide ? '<span class="orga-n-groupe">acide </span>' : '') + pref.map(p => `<span class="orga-n-${p.c}">${p.t}</span>`).join('-') +
            `<span class="orga-n-chaine">${chaine}</span><span class="orga-n-groupe">${groupe}</span>${de}${alk ? `<span class="orga-n-${ms[ms.length - 1].classe}">${alk}</span>` : ''}`;
          return { texte, html };
        };
        const maj = () => { verrou(); const a = assembler(); z.querySelector('.orga-nom-complet').innerHTML = a.texte.trim() ? `Nom : <span class="orga-nom">${a.html}</span>` : ''; };
        z.addEventListener('input', () => { api.effacer(); lignes.forEach(l => l.classList.remove('ko')); maj(); });
        z.addEventListener('click', ev => {
          const b = ev.target.closest('[data-mult]');
          if (!b || b.disabled) return;
          b.parentNode.querySelectorAll('[data-mult]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
          api.effacer(); maj();
        });
        // morceau faux : bordure rouge
        const juste = l => {
          const m = ms[+l.dataset.k], x = lire(l);
          if (m.type === 'chaine') return chaineJuste();
          if (m.type === 'ramif') {
            const locs = (x.num.match(/\d+|[nN]/g) || []).map(t => (/n/i.test(t) ? 'N' : +t));
            const okLocs = (!locs.length && !m.ecrits) || locs.join() === m.locs.join();
            return okLocs && sa(x.mult) === sa(m.mult) && sa(x.nom) === sa(m.nom);
          }
          if (m.type === 'groupe') {
            const num = (x.gnum.match(/\d+/) || x.suf.match(/\d+/) || [''])[0];
            const suf = sa(x.suf.replace(/^[-\s\d]+/, '').replace(/^acide\s*/i, ''));
            const okNum = num ? +num === (m.loc || 1) : !m.ecrit;
            return okNum && suf === sa(m.suffixe);
          }
          return sa(x.alk) === sa(m.texte);
        };
        const valider = () => {
          if (fini || api.fini()) return;
          if (!chaineJuste()) {
            ligneChaine.classList.add('ko'); secouer(ligneChaine);
            const v = sa(ligneChaine.querySelector('input').value);
            if (!v) { api.message('Commence par la chaîne principale : c\'est la fin du nom.'); return; }
            const m = v.match(/^(cyclo)?(meth|eth|prop|but|pent|hex|hept|oct|non|dec)/);
            const k = m ? O.RACINES.map(O.sansAccent).indexOf(m[2]) + 1 : 0;
            api.erreur(k ? (m[1] && !res.cyclo ? 'Il n\'y a pas de cycle : pas de « cyclo ».' : !m[1] && res.cyclo ? 'Les C forment un cycle : cyclo… (cyclohexane).' : `« ${O.RACINES[k - 1]} » veut dire ${k} C : la chaîne principale en a ${k > res.n ? 'moins' : 'plus'}. Compte-les.`) : 'Écris le nom de la chaîne principale : méth (1 C), éth (2), prop (3), but (4), pent (5), hex (6)…');
            return;
          }
          const a = assembler();
          const d = O.diagnostiquerNom(a.texte, res);
          lignes.forEach(l => l.classList.toggle('ko', !juste(l)));
          if (!d.ok) { secouer(z.querySelector('.orga-morceaux')); api.erreur(d.diag); return; }
          z.querySelectorAll('input, [data-mult]').forEach(x => { x.disabled = true; });
          terminer(d.remarque);
        };
        z.querySelector('.orga-actions-partie .btn-primary').onclick = valider;
        z.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.tagName === 'INPUT') { e.preventDefault(); valider(); } });
        maj();
      }

      function terminer(remarque) {
        fini = true;
        st.res = st.res || res0;
        st.ordre = st.ordre || res0.numeros;
        st.groupeFait = famille;
        st.res.ramifs.forEach((r, k) => st.faites.add(k));
        consigne.innerHTML = '';
        act.innerHTML = '';
        champ.querySelectorAll('.btn-primary').forEach(b => b.closest('.er-actions').remove());
        rendre();
        api.reussi(remarque || undefined);
      }

      ctx = {
        montrer() {
          fini = true;
          st.res = res0; st.ordre = res0.numeros; st.groupeFait = famille;
          res0.ramifs.forEach((r, k) => st.faites.add(k));
          consigne.innerHTML = ''; act.innerHTML = ''; legende.innerHTML = '';
          champ.innerHTML = `<p class="orga-nom-complet">Nom : ${nomHTML(res0.parties)}</p>`;
          rendre();
        },
      };
      if (res0.horsProgramme) { consigne.textContent = 'Molécule hors programme.'; return; }
      if (aides.couleurs) etape(famille ? 'groupe' : 'chaine');
      else etape('nom');
    }
    monter();
    return { montrer() { if (ctx) ctx.montrer(); } };
  }

  /* ============================================================
     DESSINER DANS L'ÉDITEUR (parties 'perso')
     partieDessin(cible, { ecriture, hydrogenes, q, nom, nomDirect, elements })
       l'élève dessine la molécule cible dans l'écriture demandée ; validation : même molécule
       (et H justes si « H à compléter »). o.nom : le nom est donné (du nom au dessin) :
       le nom de ce qui est dessiné s'affiche en direct et sert au diagnostic.
     partieH(mol, { ecriture }) : compléter les H d'une formule donnée (structure figée)
     partieConversion(mol, de, vers, { compterH }) : la conversion guidée par les gestes du cours
     ============================================================ */
  function diagDessin(m, cible, o) {
    if (!m.liaisons.length && m.atomes.length <= 1) return 'Dessine la molécule : tire un trait depuis le C pour ajouter un atome.';
    const comp = el => m.atomes.filter(a => a.el === el).length, compC = el => cible.atomes.filter(a => a.el === el).length;
    if (o.nom) {
      const d = O.nommer(m), e = O.nommer(cible);
      if (d.horsProgramme) return `Ta molécule n'a pas de nom au programme (${d.horsProgramme}).`;
      if (d.famille !== e.famille) return `Ta molécule s'appelle ${d.nom} : c'est ${famLe(d.famille)} ; ${o.nom} est ${famLe(e.famille)}.`;
      if (d.n !== e.n) return `Ta molécule s'appelle ${d.nom} : sa chaîne principale a ${d.n} C, il en faut ${e.n}. Écris d'abord la chaîne principale (la fin du nom), puis place les ramifications.`;
      return `Ta molécule s'appelle ${d.nom}, pas ${o.nom} : compare les ramifications et leurs numéros.`;
    }
    const nc = comp('C'), ncC = compC('C');
    if (nc !== ncC) {
      if (o.ecriture === 'topo' && nc < ncC) return `Il manque des C : ta molécule en a ${nc}, il en faut ${ncC}. En topologique, chaque sommet et chaque bout de trait est un C.`;
      return `Ta molécule a ${nc} C ; il en faut ${ncC}. Compte les C.`;
    }
    for (const x of ['O', 'N', 'F', 'Cl', 'Br', 'I']) if (comp(x) !== compC(x)) return `Vérifie les atomes ${x} : il en faut ${compC(x)}${compC(x) ? '' : ' (aucun)'}.`;
    const d2 = mm => mm.liaisons.filter(l => l.o === 2).length;
    if (d2(m) !== d2(cible)) return `Vérifie les doubles liaisons : il en faut ${d2(cible)}.`;
    return 'Même formule brute, mais ce n\'est pas la même molécule : vérifie où sont accrochés les atomes et les ramifications.';
  }
  const famLe = f => ({ alcane: 'un alcane', halogeno: 'un halogénoalcane', alcene: 'un alcène', alcool: 'un alcool', aldehyde: 'un aldéhyde', cetone: 'une cétone', acide: 'un acide carboxylique', ester: 'un ester', amine: 'une amine', amide: 'un amide' })[f];

  function partieDessin(cible0, o) {
    o = Object.assign({ ecriture: 'semi', hydrogenes: 'auto' }, o);
    const cible = molDe(cible0);
    const eleve = o.hydrogenes === 'eleve' && o.ecriture !== 'topo';
    const res = o.nom ? O.nommer(cible) : {};
    return Object.assign({
      type: 'perso',
      q: o.q != null ? o.q : `Dessine la molécule en ${NOM_EC[o.ecriture].toLowerCase()}, puis valide.`,
      solution: o.nom && !res.horsProgramme ? `<p class="orga-sol-nom">${nomHTML(res.parties)}</p>` : (o.solution || ''),
      monter(zone, api) {
        const ed = editeur(zone, { ecriture: o.ecriture, ecritures: o.ecritures || [o.ecriture], hydrogenes: o.hydrogenes, choixH: false, elements: o.elements, nomDirect: !!o.nom, brute: o.brute !== false, surChange: () => api.effacer() });
        if (eleve) ed.message('Dessine les atomes ; puis, avec l\'outil « H », touche chaque atome et choisis ses H.', 'info');
        const act = el('div', 'er-actions orga-actions-partie', '<button type="button" class="btn-primary">Valider</button>');
        zone.appendChild(act);
        let fige = false;
        act.querySelector('.btn-primary').onclick = () => {
          if (fige || api.fini()) return;
          const m = ed.mol;
          if (!O.meme(m, cible)) { secouer(ed.zoneSvg); api.erreur(diagDessin(m, cible, o)); return; }
          if (eleve && ed.ec !== 'topo' && !ed.hJustes()) {
            const i = m.atomes.findIndex((a, j) => O.diagH(m, j, ed.h[j]));
            ed.sel = i; ed.rendre();
            secouer(ed.zoneSvg); api.erreur('Les atomes sont justes, mais pas tous les H. ' + O.diagH(m, i, ed.h[i]));
            return;
          }
          fige = true; act.remove(); ed.message(''); ed.figer(); api.reussi();
        };
        return {
          montrer() {
            fige = true; act.remove();
            ed.charger(cible, { ecriture: o.ecriture, hydrogenes: 'auto' });
            ed.message(''); ed.figer();
          },
        };
      },
    }, o.partie);
  }

  function partieH(mol0, o) {
    o = Object.assign({ ecriture: 'semi' }, o);
    const mol = molDe(mol0);
    return Object.assign({
      type: 'perso',
      q: o.q != null ? o.q : 'Touche chaque atome et choisis le nombre de H qu\'il porte, puis valide.',
      solution: o.solution || '',
      monter(zone, api) {
        const ed = editeur(zone, { ecriture: o.ecriture, ecritures: [o.ecriture], hydrogenes: 'eleve', choixH: false, depart: mol, structure: false, brute: false, surChange: () => api.effacer() });
        const act = el('div', 'er-actions orga-actions-partie', '<button type="button" class="btn-primary">Valider</button>');
        zone.appendChild(act);
        let fige = false;
        act.querySelector('.btn-primary').onclick = () => {
          if (fige || api.fini()) return;
          const m = ed.mol, i = m.atomes.findIndex((a, j) => O.diagH(m, j, ed.h[j]));
          if (i >= 0) { ed.sel = i; ed.rendre(); secouer(ed.zoneSvg); api.erreur(O.diagH(m, i, ed.h[i])); return; }
          fige = true; act.remove(); ed.message(''); ed.figer(); api.reussi();
        };
        return { montrer() { fige = true; act.remove(); ed.charger(mol, { hydrogenes: 'auto' }); ed.message(''); ed.figer(); } };
      },
    }, o.partie);
  }

  function partieConversion(mol0, de, vers, o) {
    o = o || {};
    const mol = molDe(mol0);
    const TXT = { semi: 'semi-développée', topo: 'topologique', developpee: 'développée' };
    return Object.assign({
      type: 'perso',
      q: o.q || '',
      solution: o.solution || '',
      monter(zone, api) {
        let fini = false;
        const cv = conversion(zone, { mol, de, vers, compterH: !!o.compterH, refaire: false, phrase: o.phrase,
          surErreur: () => { if (!fini) api.compterErreur(); },
          surFin: () => { if (!fini) { fini = true; api.reussi(); } } });
        return { montrer() { fini = true; cv.montrer(); } };
      },
    }, o.partie);
  }

  Object.assign(O, {
    ECHELLES, NOM_EC, DIRS_EDITEUR: DIRS, GLISSER, BULLES,
    info, fermerInfo, formuleHTML, aidesCondensees, dessinActif, corrigeGroupes,
    partieEntourer, partiesNommerGroupes, partieNommerGroupe, partieChaine, partieNom, partieDessin, partieH, partieConversion, diagDessin,
    disposer, scene, svgCorps, dessinHTML, dessiner, nomHTML, legendeHTML,
    editeur, conversion, bulle, fermerBulle, optionsH, versSVG, versConteneur,
    geo: { vec, angleDe, ecart, dist, n360, n180 },
  });
})();
