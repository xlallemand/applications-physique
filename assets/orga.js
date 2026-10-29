/* ============================================================
   ORGA : moteur partagé de chimie organique — modèle (sans DOM)
   Se charge dans une page (script classique) ou dans Node (tests).
   Le rendu SVG, la disposition automatique, l'éditeur et les outils
   de conversion sont dans assets/orga-dessin.js.

   Molécule : { atomes: [{ el }], liaisons: [{ a, b, o }] }
     el : 'C', 'N', 'O', 'F', 'Cl', 'Br', 'I' ; H implicites
     a, b : indices des atomes liés ; o : ordre (1, 2 ou 3)
   Nombre de H d'un atome = valence − somme des ordres de ses liaisons.

   API
     ORGA.lire(smiles)              SMILES simplifié → molécule
                                    (majuscules, ramifications entre parenthèses,
                                    =, #, cycles par chiffres, benzène en Kékulé)
     ORGA.ecrire(mol)               molécule → SMILES simplifié
     ORGA.copier(mol)
     ORGA.valence(el)               C 4, N 3, O 2, halogènes 1, H 1
     ORGA.adjacence(mol)            [[{ j, o, k }]] : voisins de chaque atome (k : n° de liaison)
     ORGA.somme(mol, i)             somme des ordres des liaisons de l'atome i
     ORGA.nbH(mol, i)               H implicites de l'atome i
     ORGA.formuleBrute(mol, o)      'C5H12O' (C, H puis ordre alphabétique) ;
                                    o.html : indices en <sub> ; o.h : H imposés par atome (H saisis par l'élève)
     ORGA.meme(m1, m2)              même molécule (même graphe, éléments, ordres), quel que soit le dessin
     ORGA.cycles(mol)               cycles (listes d'indices, dans l'ordre du cycle)
     ORGA.benzene(mol)              ensemble des atomes des cycles benzéniques
     ORGA.groupes(mol)              groupes caractéristiques :
                                    [{ cle, famille, familles, groupe, nomGroupe, classe, atomes, avecH }]
     ORGA.FAMILLES                  noms des familles et des groupes (par clé)
     ORGA.cheminsLesPlusLongs(mol, permis)   chaînes (chemins) les plus longues
     ORGA.composantes(mol)          parties connexes (listes d'indices)
     ORGA.extraire(mol, atomes)     sous-molécule (et correspondance des indices)
     ORGA.diagLiaison(mol, i, plus) message si l'atome i ne peut pas recevoir « plus » liaisons
     ORGA.diagNouvel(el, o)         message si un nouvel atome el ne peut pas avoir une liaison d'ordre o
     ORGA.diagH(mol, i, h)          message si l'atome i ne porte pas h H (null si c'est juste)
     ORGA.etiquetteH(el, n, html)   'CH3' (ou 'CH<sub>3</sub>')

   Nomenclature (règles du cours : une seule fonction, ramifications alkyles et halogènes, cycloalcanes)
     ORGA.nommer(mol, o)            o.chaine : chaîne principale imposée, dans l'ordre de la numérotation (une des meilleures ;
                                    une autre donne le nom faux qu'on obtiendrait avec elle)
                                    { nom, variantes (autres écritures acceptées), parties [[texte, classe]] (nom en couleurs),
                                      morceaux (nom découpé), ramifs, couleurs (atomes par classe), famille, groupe,
                                      chaine / numeros (chaîne principale numérotée), alkyle (ester : { chaine, classe }),
                                      struct, chaines }
                                    ou { horsProgramme: raison }
     ORGA.evaluerChaine(mol, res, atomes)       la chaîne touchée est-elle la chaîne principale ? { ok, diag, orientations }
     ORGA.evaluerDepart(mol, res, chaine, i)    le C touché est-il le n° 1 ? { ok, chaine, diag }
     ORGA.lireNom(nom)              nom → molécule (null si illisible ou impossible)
     ORGA.analyserNom(nom)          nom → structure (préfixes, chaîne, terminaison…)
     ORGA.diagnostiquerNom(saisie, mol ou nommer(mol))
                                    { ok, remarque } ou { ok: false, diag } (chaîne trop courte, numérotation,
                                    ordre alphabétique, di/tri, tirets et virgules, terminaison, N-, ester…) ;
                                    { ok: true, numeroUn: true, diag } : « pentan-1-oate », « butan-1-al » (le 1 en trop :
                                    faux, mais la bonne molécule)
     ORGA.fabriqueAlcane(o)         { mol, nom, res, smiles } : chaîne de o.min à o.max C, o.ramMin à o.ramMax ramifications
     ORGA.fabriqueFamille(cle, o)   idem pour une famille ('alcene', 'alcool', 'aldehyde', 'cetone', 'acide', 'ester',
                                    'amine', 'amide', 'halogeno')
     ORGA.condenser(mol, [{ atomes, texte }])   étiquettes condensées d'un énoncé (C2H5, (CH2)5, C6H5) :
                                    { mol (réduite, atomes { el, etiq }), vers (ancien → nouvel indice), pseudo }
     ORGA.AIDES_CONDENSEES          explication de chaque étiquette condensée (bulles d'aide)
   ============================================================ */
(function (racine) {
  'use strict';

  const VALENCE = { C: 4, N: 3, O: 2, F: 1, Cl: 1, Br: 1, I: 1, H: 1 };
  const valence = el => VALENCE[el] || 0;
  const HALOGENES = ['F', 'Cl', 'Br', 'I'];

  // Désignation d'un atome dans les messages : « ce C », « cet O »
  const CE = el => (el === 'O' || el === 'I' ? 'cet ' : 'ce ') + el;
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);

  /* ---------- Lecture d'un SMILES simplifié ---------- */
  function lier(mol, a, b, o) { mol.liaisons.push({ a, b, o }); }

  function lire(s) {
    const mol = { atomes: [], liaisons: [] };
    const pile = [], cycles = {};
    let prec = -1, ordre = 1, i = 0;
    while (i < s.length) {
      const c = s[i];
      if (c === ' ') { i++; continue; }
      if (c === '(') { pile.push(prec); i++; continue; }
      if (c === ')') { prec = pile.pop(); i++; continue; }
      if (c === '-') { ordre = 1; i++; continue; }
      if (c === '=') { ordre = 2; i++; continue; }
      if (c === '#') { ordre = 3; i++; continue; }
      if (c >= '0' && c <= '9') {
        // fermeture de cycle : la liaison relie l'atome courant à celui qui a ouvert le chiffre
        if (cycles[c]) { lier(mol, cycles[c].at, prec, Math.max(ordre, cycles[c].o)); delete cycles[c]; }
        else cycles[c] = { at: prec, o: ordre };
        ordre = 1; i++; continue;
      }
      let el;
      const deux = s.substr(i, 2);
      if (deux === 'Cl' || deux === 'Br') { el = deux; i += 2; }
      else if ('CNOFI'.includes(c)) { el = c; i++; }
      else throw new Error('ORGA.lire : caractère inattendu « ' + c + ' » dans ' + s);
      const k = mol.atomes.push({ el }) - 1;
      if (prec >= 0) lier(mol, prec, k, ordre);
      prec = k; ordre = 1;
    }
    return mol;
  }

  const copier = mol => ({ atomes: mol.atomes.map(a => Object.assign({}, a)), liaisons: mol.liaisons.map(l => Object.assign({}, l)) });

  function adjacence(mol) {
    const adj = mol.atomes.map(() => []);
    mol.liaisons.forEach((l, k) => { adj[l.a].push({ j: l.b, o: l.o, k }); adj[l.b].push({ j: l.a, o: l.o, k }); });
    return adj;
  }

  const somme = (mol, i) => mol.liaisons.reduce((s, l) => s + (l.a === i || l.b === i ? l.o : 0), 0);
  const nbH = (mol, i) => Math.max(0, valence(mol.atomes[i].el) - somme(mol, i));

  /* ---------- Écriture d'un SMILES (parcours en profondeur) ---------- */
  function ecrire(mol) {
    const n = mol.atomes.length;
    if (!n) return '';
    const adj = adjacence(mol);
    let depart = adj.findIndex(v => v.length <= 1);
    if (depart < 0) depart = 0;
    const parent = new Array(n).fill(-1), vu = new Array(n).fill(false), arbre = new Set();
    (function dfs(i) {
      vu[i] = true;
      for (const v of adj[i]) if (!vu[v.j]) { arbre.add(v.k); parent[v.j] = i; dfs(v.j); }
    })(depart);
    const fermetures = {};
    let num = 1;
    mol.liaisons.forEach((l, k) => {
      if (arbre.has(k) || !vu[l.a] || !vu[l.b]) return;
      (fermetures[l.a] = fermetures[l.a] || []).push({ k, num });
      (fermetures[l.b] = fermetures[l.b] || []).push({ k, num });
      num++;
    });
    const symb = o => (o === 2 ? '=' : o === 3 ? '#' : '');
    const ouvert = new Set();
    function ecr(i) {
      let s = mol.atomes[i].el;
      for (const f of fermetures[i] || []) {
        if (!ouvert.has(f.k)) { ouvert.add(f.k); s += symb(mol.liaisons[f.k].o) + f.num; } else s += f.num;
      }
      const enfants = adj[i].filter(v => arbre.has(v.k) && parent[v.j] === i);
      enfants.forEach((v, x) => {
        const t = symb(v.o) + ecr(v.j);
        s += x < enfants.length - 1 ? '(' + t + ')' : t;
      });
      return s;
    }
    return ecr(depart);
  }

  /* ---------- Formule brute ---------- */
  function etiquetteH(el, n, html) {
    if (!n) return el;
    return el + 'H' + (n > 1 ? (html ? '<sub>' + n + '</sub>' : n) : '');
  }

  function formuleBrute(mol, o) {
    o = o || {};
    const compte = {};
    mol.atomes.forEach((a, i) => {
      compte[a.el] = (compte[a.el] || 0) + 1;
      const h = o.h && o.h[i] != null ? o.h[i] : (o.h ? 0 : nbH(mol, i));
      if (h) compte.H = (compte.H || 0) + h;
    });
    const ordre = Object.keys(compte).filter(e => e !== 'C' && e !== 'H').sort();
    if (compte.H) ordre.unshift('H');
    if (compte.C) ordre.unshift('C');
    return ordre.map(e => e + (compte[e] > 1 ? (o.html ? '<sub>' + compte[e] + '</sub>' : compte[e]) : '')).join('');
  }

  /* ---------- Même molécule ? (isomorphisme de graphes) ----------
     Invariants (élément, H, ordres des liaisons), affinés par les voisins
     (méthode de Morgan), puis appariement par retour arrière. */
  function invariants(mol, adj) {
    return mol.atomes.map((a, i) => a.el + nbH(mol, i) + '|' + adj[i].map(v => v.o).sort().join(''));
  }

  function meme(m1, m2) {
    const n = m1.atomes.length;
    if (n !== m2.atomes.length || m1.liaisons.length !== m2.liaisons.length) return false;
    if (!n) return true;
    if (formuleBrute(m1) !== formuleBrute(m2)) return false;
    const a1 = adjacence(m1), a2 = adjacence(m2);
    let l1 = invariants(m1, a1), l2 = invariants(m2, a2);
    for (let t = 0; t < n; t++) {
      const classes = [...new Set([...l1, ...l2])].sort();
      const id = new Map(classes.map((x, k) => [x, k]));
      const c1 = l1.map(x => id.get(x)), c2 = l2.map(x => id.get(x));
      const n1 = c1.map((c, i) => c + ':' + a1[i].map(v => v.o + '-' + c1[v.j]).sort().join(','));
      const n2 = c2.map((c, i) => c + ':' + a2[i].map(v => v.o + '-' + c2[v.j]).sort().join(','));
      l1 = n1; l2 = n2;
      if (new Set([...n1, ...n2]).size === classes.length) break;
    }
    const tri = l => [...l].sort().join(';');
    if (tri(l1) !== tri(l2)) return false;
    // ordre de parcours (en largeur) de m1, pour que chaque atome ait si possible un voisin déjà associé
    const ordre = [], vu = new Array(n).fill(false);
    for (let r = 0; r < n; r++) {
      if (vu[r]) continue;
      vu[r] = true; ordre.push(r);
      for (let q = ordre.length - 1; q < ordre.length; q++) {
        for (const v of a1[ordre[q]]) if (!vu[v.j]) { vu[v.j] = true; ordre.push(v.j); }
      }
    }
    const assoc = new Array(n).fill(-1), inverse = new Array(n).fill(-1);
    function essayer(k) {
      if (k === n) return true;
      const i = ordre[k];
      for (let j = 0; j < n; j++) {
        if (inverse[j] >= 0 || l2[j] !== l1[i]) continue;
        let ok = a1[i].every(v => {
          if (assoc[v.j] < 0) return true;
          const w = a2[j].find(x => x.j === assoc[v.j]);
          return w && w.o === v.o;
        });
        if (ok) ok = a2[j].every(w => inverse[w.j] < 0 || a1[i].some(v => v.j === inverse[w.j]));
        if (!ok) continue;
        assoc[i] = j; inverse[j] = i;
        if (essayer(k + 1)) return true;
        assoc[i] = -1; inverse[j] = -1;
      }
      return false;
    }
    return essayer(0);
  }

  /* ---------- Cycles (base de cycles d'un arbre couvrant) ---------- */
  function cycles(mol) {
    const n = mol.atomes.length, adj = adjacence(mol);
    const parent = new Array(n).fill(-1), prof = new Array(n).fill(-1), arbre = new Set();
    for (let r = 0; r < n; r++) {
      if (prof[r] >= 0) continue;
      prof[r] = 0;
      const file = [r];
      while (file.length) {
        const i = file.shift();
        for (const v of adj[i]) if (prof[v.j] < 0) { prof[v.j] = prof[i] + 1; parent[v.j] = i; arbre.add(v.k); file.push(v.j); }
      }
    }
    const res = [];
    mol.liaisons.forEach((l, k) => {
      if (arbre.has(k)) return;
      let a = l.a, b = l.b;
      const ca = [a], cb = [b];
      while (a !== b) {
        if (prof[a] >= prof[b]) { a = parent[a]; ca.push(a); } else { b = parent[b]; cb.push(b); }
      }
      cb.pop();
      res.push(ca.concat(cb.reverse()));
    });
    return res;
  }

  // atomes des cycles benzéniques (6 C, 3 doubles liaisons alternées)
  function benzene(mol) {
    const res = new Set();
    for (const c of cycles(mol)) {
      if (c.length !== 6 || c.some(i => mol.atomes[i].el !== 'C')) continue;
      const ordres = c.map((i, k) => {
        const j = c[(k + 1) % 6];
        const l = mol.liaisons.find(x => (x.a === i && x.b === j) || (x.a === j && x.b === i));
        return l ? l.o : 0;
      });
      const alt = ordres.every((o, k) => o === (ordres[0] === 2 ? (k % 2 ? 1 : 2) : (k % 2 ? 2 : 1)));
      if (alt) c.forEach(i => res.add(i));
    }
    return res;
  }

  /* ---------- Groupes caractéristiques ---------- */
  const FAMILLES = {
    alcene:   { famille: 'alcène', familles: 'alcènes', groupe: 'C=C', nomGroupe: 'C=C' },
    alcool:   { famille: 'alcool', familles: 'alcools', groupe: 'hydroxyle', nomGroupe: 'groupe hydroxyle' },
    aldehyde: { famille: 'aldéhyde', familles: 'aldéhydes', groupe: 'carbonyle', nomGroupe: 'groupe carbonyle' },
    cetone:   { famille: 'cétone', familles: 'cétones', groupe: 'carbonyle', nomGroupe: 'groupe carbonyle' },
    acide:    { famille: 'acide carboxylique', familles: 'acides carboxyliques', groupe: 'carboxyle', nomGroupe: 'groupe carboxyle' },
    ester:    { famille: 'ester', familles: 'esters', groupe: 'ester', nomGroupe: 'groupe ester' },
    amine:    { famille: 'amine', familles: 'amines', groupe: 'amine', nomGroupe: 'groupe amine' },
    amide:    { famille: 'amide', familles: 'amides', groupe: 'amide', nomGroupe: 'groupe amide' },
    halogeno: { famille: 'halogénoalcane', familles: 'halogénoalcanes', groupe: 'halogéno', nomGroupe: 'groupe halogéno' },
  };

  function groupes(mol) {
    const adj = adjacence(mol), aro = benzene(mol), res = [];
    const el = i => mol.atomes[i].el;
    const ajouter = (cle, atomes, avecH, classe) => res.push(Object.assign({ cle, atomes, avecH: avecH || [], classe: classe || '' }, FAMILLES[cle]));
    const carbonyles = new Set();
    // C=O : acide, ester, amide, aldéhyde, cétone
    mol.atomes.forEach((a, c) => {
      if (a.el !== 'C') return;
      const o2 = adj[c].find(v => el(v.j) === 'O' && v.o === 2);
      if (!o2) return;
      carbonyles.add(c);
      const autres = adj[c].filter(v => v !== o2);
      const oS = autres.find(v => el(v.j) === 'O' && v.o === 1 && nbH(mol, v.j) === 1);
      const oE = autres.find(v => el(v.j) === 'O' && v.o === 1 && nbH(mol, v.j) === 0);
      const nS = autres.find(v => el(v.j) === 'N' && v.o === 1);
      if (oS) ajouter('acide', [c, o2.j, oS.j], [oS.j]);
      else if (oE) ajouter('ester', [c, o2.j, oE.j]);
      else if (nS) ajouter('amide', [c, o2.j, nS.j], [nS.j]);
      else if (nbH(mol, c) >= 1) ajouter('aldehyde', [c, o2.j], [c]);
      else ajouter('cetone', [c, o2.j]);
    });
    // C=C (hors cycle benzénique)
    mol.liaisons.forEach(l => {
      if (l.o === 2 && el(l.a) === 'C' && el(l.b) === 'C' && !(aro.has(l.a) && aro.has(l.b))) ajouter('alcene', [l.a, l.b]);
    });
    // O–H sur un C qui n'est pas celui d'un C=O
    mol.atomes.forEach((a, o) => {
      if (a.el !== 'O' || nbH(mol, o) !== 1 || adj[o].length !== 1) return;
      const c = adj[o][0].j;
      if (el(c) !== 'C' || carbonyles.has(c)) return;
      ajouter('alcool', [o], [o], aro.has(c) ? 'phénol' : '');
    });
    // N lié seulement à des C par des liaisons simples, aucun n'étant un C=O
    mol.atomes.forEach((a, n) => {
      if (a.el !== 'N' || !adj[n].length) return;
      if (adj[n].some(v => v.o !== 1 || el(v.j) !== 'C' || carbonyles.has(v.j))) return;
      ajouter('amine', [n], [n], ['', 'primaire', 'secondaire', 'tertiaire'][adj[n].length]);
    });
    // halogène lié à un C
    mol.atomes.forEach((a, x) => {
      if (HALOGENES.includes(a.el) && adj[x].length === 1 && el(adj[x][0].j) === 'C') ajouter('halogeno', [x]);
    });
    res.sort((g, h) => Math.min(...g.atomes) - Math.min(...h.atomes));
    return res;
  }

  /* ---------- Chaînes les plus longues ----------
     permis[i] : l'atome i peut faire partie de la chaîne (tous par défaut).
     Renvoie tous les chemins simples de longueur maximale (chacun une seule fois). */
  function cheminsLesPlusLongs(mol, permis) {
    const n = mol.atomes.length, adj = adjacence(mol);
    const ok = i => !permis || permis[i];
    let max = 0, res = [];
    const dans = new Array(n).fill(false), chemin = [];
    function dfs(i) {
      dans[i] = true; chemin.push(i);
      let prolonge = false;
      for (const v of adj[i]) if (ok(v.j) && !dans[v.j]) { prolonge = true; dfs(v.j); }
      if (!prolonge) {
        if (chemin.length > max) { max = chemin.length; res = []; }
        if (chemin.length === max && chemin[0] <= chemin[chemin.length - 1]) res.push(chemin.slice());
      }
      chemin.pop(); dans[i] = false;
    }
    for (let i = 0; i < n; i++) if (ok(i)) dfs(i);
    // un chemin peut apparaître deux fois (extrémités égales : atome seul)
    const vus = new Set();
    return res.filter(c => { const k = c.join(','); if (vus.has(k)) return false; vus.add(k); return true; });
  }

  /* ---------- Parties connexes, sous-molécule ---------- */
  function composantes(mol) {
    const n = mol.atomes.length, adj = adjacence(mol), vu = new Array(n).fill(false), res = [];
    for (let r = 0; r < n; r++) {
      if (vu[r]) continue;
      const c = [r]; vu[r] = true;
      for (let q = 0; q < c.length; q++) for (const v of adj[c[q]]) if (!vu[v.j]) { vu[v.j] = true; c.push(v.j); }
      res.push(c);
    }
    return res;
  }

  function extraire(mol, atomes) {
    const garde = [...atomes].sort((a, b) => a - b), nouveau = new Map(garde.map((i, k) => [i, k]));
    return {
      mol: {
        atomes: garde.map(i => Object.assign({}, mol.atomes[i])),
        liaisons: mol.liaisons.filter(l => nouveau.has(l.a) && nouveau.has(l.b)).map(l => ({ a: nouveau.get(l.a), b: nouveau.get(l.b), o: l.o })),
      },
      nouveau,           // ancien indice → nouvel indice
      ancien: garde,     // nouvel indice → ancien indice
    };
  }

  /* ---------- Diagnostics de valence ---------- */
  const liaisonsTxt = n => n + (n > 1 ? ' liaisons' : ' liaison');
  const ORDRE_TXT = { 1: 'une liaison de plus', 2: 'une double liaison', 3: 'une triple liaison' };

  function diagLiaison(mol, i, plus) {
    const el = mol.atomes[i].el, v = valence(el), s = somme(mol, i);
    if (s + plus <= v) return null;
    if (s >= v) return `${cap(CE(el))} a déjà ${liaisonsTxt(s)} : un ${el} en fait ${v}.`;
    return `${cap(CE(el))} a déjà ${liaisonsTxt(s)} : avec ${ORDRE_TXT[plus]}, il en aurait ${s + plus} (un ${el} en fait ${v}).`;
  }

  function diagNouvel(el, o) {
    const v = valence(el);
    if (o <= v) return null;
    return `Un ${el} ne fait que ${liaisonsTxt(v)} : pas de ${o === 2 ? 'double' : 'triple'} liaison.`;
  }

  // H d'un atome : « Ce C a 2 liaisons : il lui faut 2 H (4 liaisons en tout). »
  function diagH(mol, i, h) {
    const el = mol.atomes[i].el, v = valence(el), s = somme(mol, i), faut = Math.max(0, v - s);
    if (h === faut) return null;
    // atome qui a déjà toutes ses liaisons : on n'a pas à y toucher (aucun H)
    if (h == null && !faut) return null;
    const besoin = faut ? `il lui faut ${faut} H (${v} liaisons en tout)` : `il ne lui faut aucun H (il a déjà ses ${v} liaisons)`;
    if (h == null) return `${cap(CE(el))} n'a pas encore ses H : il a ${liaisonsTxt(s)}, ${besoin}.`;
    return `${cap(CE(el))} a ${liaisonsTxt(s)} : ${besoin}.`;
  }

  /* ============================================================
     NOMENCLATURE (règles du cours, niveau lycée)
     Une seule fonction par molécule (alcool, aldéhyde, cétone, acide
     carboxylique, ester, amine, amide, ou une C=C), avec des ramifications
     alkyles linéaires et des halogènes ; alcanes cycliques. Le reste est
     « hors programme ».
     ============================================================ */
  const RACINES = ['méth', 'éth', 'prop', 'but', 'pent', 'hex', 'hept', 'oct', 'non', 'déc'];
  const MULT = ['', '', 'di', 'tri', 'tétra', 'penta', 'hexa'];
  const HALO_NOM = { F: 'fluoro', Cl: 'chloro', Br: 'bromo', I: 'iodo' };
  const TERMINAUX = ['aldehyde', 'acide', 'ester', 'amide'];
  const SUFFIXE = { alcane: 'ane', halogeno: 'ane', alcene: 'ène', alcool: 'ol', aldehyde: 'al', cetone: 'one', acide: 'oïque', ester: 'oate', amine: 'amine', amide: 'amide' };
  const sansAccent = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '');
  const alkyl = k => RACINES[k - 1] + 'yl';
  const commenceVoyelle = s => /^[aeiouyhéèêâîô]/i.test(s);
  const hp = raison => ({ horsProgramme: raison });
  const ordreAlpha = (a, b) => { const x = sansAccent(a), y = sansAccent(b); return x < y ? -1 : x > y ? 1 : 0; };

  // comparaison de deux suites de numéros (premier point de différence)
  function cmpCles(a, b) {
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
      const x = a[i] == null ? -1 : a[i], y = b[i] == null ? -1 : b[i];
      if (x !== y) return x - y;
    }
    return 0;
  }

  // atomes atteints depuis « depart » sans passer par les atomes bloqués
  function branche(adj, depart, bloques) {
    const vu = new Set([depart]), file = [depart];
    for (let q = 0; q < file.length; q++) for (const v of adj[file[q]]) if (!vu.has(v.j) && !bloques.has(v.j)) { vu.add(v.j); file.push(v.j); }
    return file;
  }

  // chemins simples maximaux dans S (un arbre) qui contiennent tous les atomes de « contient » ;
  // depart : extrémité imposée (C d'un groupe en bout de chaîne). Chaque chemin est donné dans les deux sens.
  function chemins(adj, S, contient, depart) {
    const res = [];
    const deg = i => adj[i].filter(v => S.has(v.j)).length;
    const departs = depart != null ? [depart] : [...S].filter(i => deg(i) <= 1);
    for (const s of departs) {
      const chemin = [], dans = new Set();
      (function dfs(i) {
        chemin.push(i); dans.add(i);
        let prolonge = false;
        for (const v of adj[i]) if (S.has(v.j) && !dans.has(v.j)) { prolonge = true; dfs(v.j); }
        if (!prolonge) res.push(chemin.slice());
        chemin.pop(); dans.delete(i);
      })(s);
    }
    return res.filter(c => contient.every(g => c.includes(g)));
  }

  // nom d'une branche : alkyle linéaire accroché par son bout (méthyl, éthyl…), sinon « complexe »
  function nomBranche(mol, adj, depart, parent, atomes) {
    const S = new Set(atomes);
    if (atomes.some(i => mol.atomes[i].el !== 'C')) return { complexe: true };
    for (const i of atomes) for (const v of adj[i]) if ((S.has(v.j) || v.j === parent) && v.o !== 1) return { complexe: true };
    let prec = parent, cour = depart, k = 1;
    for (;;) {
      const suiv = adj[cour].filter(v => v.j !== prec && S.has(v.j));
      if (suiv.length > 1) return { complexe: true };
      if (!suiv.length) break;
      prec = cour; cour = suiv[0].j; k++;
    }
    if (k !== atomes.length || k > 10) return { complexe: true };
    return { nom: alkyl(k), k };
  }

  // ramifications (alkyles, halogènes) d'une chaîne orientée ; exclus : atomes du groupe (O, N…)
  function substituants(mol, adj, chaine, exclus) {
    const dans = new Set(chaine), bloques = new Set([...chaine, ...exclus]), res = [];
    chaine.forEach((i, k) => {
      for (const v of adj[i]) {
        if (dans.has(v.j) || exclus.has(v.j)) continue;
        const el = mol.atomes[v.j].el;
        if (HALO_NOM[el]) { res.push({ pos: k + 1, nom: HALO_NOM[el], atomes: [v.j], halo: true, k: 0 }); continue; }
        const at = branche(adj, v.j, bloques);
        res.push(Object.assign({ pos: k + 1, atomes: at, racine: v.j }, nomBranche(mol, adj, v.j, i, at)));
      }
    });
    return res;
  }

  // clé d'une orientation : n° du groupe, numéros des ramifications, puis numéros dans l'ordre alphabétique
  function cleOrientation(subs, locG) {
    const locs = subs.map(s => s.pos).sort((a, b) => a - b);
    const alpha = subs.slice().sort((a, b) => ordreAlpha(a.nom, b.nom) || a.pos - b.pos).map(s => s.pos);
    return [locG || 0].concat(locs, alpha);
  }

  // chaîne principale : la plus longue, puis le plus de ramifications, puis les plus petits numéros
  function choisir(cands, force) {
    cands.forEach(c => { c.cle = cleOrientation(c.subs, c.locG); });
    const L = Math.max(...cands.map(c => c.chaine.length));
    let r = cands.filter(c => c.chaine.length === L);
    const S = Math.max(...r.map(c => c.subs.length));
    r = r.filter(c => c.subs.length === S);
    r.sort((a, b) => cmpCles(a.cle, b.cle));
    const optimales = r.filter(c => cmpCles(c.cle, r[0].cle) === 0);
    optimales.forEach(c => { c.optimale = true; });
    // chaîne imposée (celle que l'élève a choisie, si elle est aussi bonne)
    const impose = force && (optimales.find(c => c.chaine.join() === force.join()) || cands.find(c => c.chaine.join() === force.join()));
    return { meilleur: impose || r[0], optimales, L, S, tous: cands };
  }

  // préfixes regroupés par nom (numéros : N d'abord), dans l'ordre alphabétique
  function grouperPrefixes(prefs) {
    const m = new Map();
    for (const p of prefs) {
      if (!m.has(p.nom)) m.set(p.nom, { nom: p.nom, halo: p.halo, k: p.k, items: [] });
      m.get(p.nom).items.push(p);
    }
    const gs = [...m.values()];
    gs.forEach(g => {
      g.items.sort((a, b) => (a.loc === 'N' ? 0 : a.loc) - (b.loc === 'N' ? 0 : b.loc));
      g.locs = g.items.map(p => p.loc);
    });
    return gs.sort((a, b) => ordreAlpha(a.nom, b.nom));
  }
  const texteLocs = locs => locs.join(',');

  // nom d'un groupe alkyle accroché par « racine » (alkyle d'un ester) : numéroté à partir de racine
  function nommerAlkyle(mol, adj, racine, interdits) {
    const tous = branche(adj, racine, interdits);
    const S = new Set(tous.filter(i => mol.atomes[i].el === 'C'));
    const cands = chemins(adj, S, [racine], racine).map(ch => ({ chaine: ch, subs: substituants(mol, adj, ch, interdits), locG: 0 }));
    const { meilleur } = choisir(cands);
    if (meilleur.subs.some(s => s.complexe)) return { complexe: true };
    const gs = grouperPrefixes(meilleur.subs.map(s => ({ nom: s.nom, loc: s.pos, atomes: s.atomes, halo: !!s.halo, k: s.k })));
    const pref = gs.map(g => texteLocs(g.locs) + '-' + MULT[g.locs.length] + g.nom).join('-');
    const n = meilleur.chaine.length;
    return { nom: pref + alkyl(n), n, chaine: meilleur.chaine, atomes: tous, prefixes: gs.map(g => ({ nom: g.nom, locs: g.locs.slice() })) };
  }

  // nombre de places possibles pour une seule ramification sur une chaîne de n C
  function placesPossibles(p, n, fam) {
    const k = p.halo ? 0 : p.k, terminal = TERMINAUX.includes(fam);
    const lo = terminal ? 2 : Math.max(1, k + 1), hi = n - k;
    return Math.max(0, hi - lo + 1);
  }

  /* ---------- Nom final, morceaux et couleurs ---------- */
  function resultat(mol, x) {
    const b = x.choix.meilleur, n = b.chaine.length, fam = x.famille;
    const prefs = b.subs.map(s => ({ nom: s.nom, loc: s.pos, atomes: s.atomes, halo: !!s.halo, k: s.k || 0 }))
      .concat((x.nsubs || []).map(s => ({ nom: s.nom, loc: 'N', atomes: s.atomes, halo: false, k: s.k })));
    const gs = grouperPrefixes(prefs);
    let r = 0;
    gs.forEach(g => { g.classe = g.halo ? 'groupe' : 'r' + Math.min(4, ++r); });
    const classeAlk = x.alkyle ? 'r' + Math.min(4, ++r) : null;
    const prefsC = prefs.filter(p => p.loc !== 'N');
    // numéro du groupe : écrit, sauf s'il n'y a qu'une place possible (éthanol, propanone, propène…)
    const locG = b.locG || 0;
    let gEcrit = false;
    if (['alcene', 'alcool', 'cetone', 'amine'].includes(fam)) gEcrit = prefsC.length > 0 || n > { alcool: 2, amine: 2, cetone: 4, alcene: 3 }[fam];
    // numéros des ramifications : écrits, sauf pour une seule ramification qui n'a qu'une place possible
    // sur une chaîne de 2 ou 3 C (méthylpropane, méthylpropanoate d'éthyle, chloroéthane), comme dans le cours
    let pEcrits = true;
    if (x.cyclo) pEcrits = prefsC.length > 1;
    else if (n === 1) pEcrits = false;
    else if (!gEcrit && prefs.length === 1 && prefsC.length === 1) pEcrits = !(n === 2 || (n === 3 && placesPossibles(prefsC[0], n, fam) === 1));
    gs.forEach(g => { g.ecrits = pEcrits || g.locs.includes('N'); });

    const racine = (x.cyclo ? 'cyclo' : '') + RACINES[n - 1];
    let chaineTxt, groupeTxt = '';
    if (fam === 'alcane' || fam === 'halogeno') chaineTxt = racine + 'ane';
    else if (fam === 'alcene') { chaineTxt = racine; groupeTxt = gEcrit ? `-${locG}-ène` : 'ène'; }
    else if (['alcool', 'cetone', 'amine'].includes(fam)) { chaineTxt = racine + 'an'; groupeTxt = gEcrit ? `-${locG}-${SUFFIXE[fam]}` : SUFFIXE[fam]; }
    else { chaineTxt = racine + 'an'; groupeTxt = SUFFIXE[fam]; }
    const txtPref = g => (g.ecrits ? texteLocs(g.locs) + '-' : '') + MULT[g.locs.length] + g.nom;
    const prefTxt = gs.map(txtPref).join('-');
    const acide = fam === 'acide';
    let nom = (acide ? 'acide ' : '') + prefTxt + chaineTxt + groupeTxt;
    let alkTxt = '', de = '';
    if (x.alkyle) { alkTxt = x.alkyle.nom + 'e'; de = commenceVoyelle(alkTxt) ? ' d\'' : ' de '; nom += de + alkTxt; }

    // autre écriture acceptée : ramifications sur le N écrites à part (N-éthyl-N-méthyl-4-méthyl…)
    const variantes = [];
    if (gs.some(g => g.locs.includes('N') && g.locs.some(l => l !== 'N'))) {
      const sep = [];
      gs.forEach(g => { const ns = g.locs.filter(l => l === 'N'); if (ns.length) sep.push({ nom: g.nom, locs: ns, ecrits: true }); });
      gs.forEach(g => { const cs = g.locs.filter(l => l !== 'N'); if (cs.length) sep.push({ nom: g.nom, locs: cs, ecrits: g.ecrits }); });
      variantes.push((acide ? 'acide ' : '') + sep.map(txtPref).join('-') + chaineTxt + groupeTxt + (x.alkyle ? de + alkTxt : ''));
    }

    // morceaux colorés du nom (même couleur que la partie du dessin)
    const parties = [];
    if (acide) parties.push(['acide ', 'groupe']);
    gs.forEach((g, k) => {
      if (k) parties.push(['-']);
      if (g.ecrits) parties.push([texteLocs(g.locs) + '-', g.classe]);
      parties.push([MULT[g.locs.length] + g.nom, g.classe]);
    });
    parties.push([chaineTxt, 'chaine']);
    if (groupeTxt) parties.push([groupeTxt, 'groupe']);
    if (x.alkyle) { parties.push([de]); parties.push([alkTxt, classeAlk]); }
    // morceaux du « nom découpé »
    const morceaux = gs.map(g => ({ type: 'ramif', classe: g.classe, nom: g.nom, mult: MULT[g.locs.length], locs: g.locs.slice(), ecrits: g.ecrits, halo: !!g.halo, k: g.k }));
    morceaux.push({ type: 'chaine', classe: 'chaine', texte: chaineTxt, n });
    if (groupeTxt) morceaux.push({ type: 'groupe', classe: 'groupe', texte: groupeTxt, suffixe: SUFFIXE[fam], loc: locG, ecrit: gEcrit, acide });
    if (x.alkyle) morceaux.push({ type: 'alkyle', classe: classeAlk, texte: alkTxt, de });

    // ramifications une par une, et couleurs du dessin
    const ramifs = [];
    gs.forEach(g => g.items.forEach(p => ramifs.push({ atomes: p.atomes, nom: g.nom, classe: g.classe, pos: p.loc, halo: !!g.halo })));
    if (x.alkyle) ramifs.push({ atomes: x.alkyle.atomes, nom: alkTxt, classe: classeAlk, pos: 'O', alkyle: true });
    const couleurs = { chaine: b.chaine.slice() };
    const ajouter = (c, at) => { (couleurs[c] = couleurs[c] || []).push(...at); };
    ramifs.forEach(rm => ajouter(rm.classe, rm.atomes));
    if (x.f) ajouter('groupe', x.f.atomes);
    return {
      mol, nom, variantes, parties, morceaux, ramifs, couleurs,
      famille: fam, groupe: x.f || null, cyclo: !!x.cyclo, n,
      chaine: b.chaine.slice(), numeros: b.chaine.slice(), locG,
      // ester : chaîne de l'alkyle, numérotée à partir du C lié à l'O (pour la numéroter sur le dessin)
      alkyle: x.alkyle ? { chaine: x.alkyle.chaine.slice(), classe: classeAlk } : null,
      struct: {
        famille: fam, acide, cyclo: !!x.cyclo, n, locG, gEcrit,
        prefixes: gs.map(g => ({ nom: g.nom, locs: g.locs.slice(), ecrits: g.ecrits, halo: !!g.halo, k: g.k })),
        alkyle: x.alkyle ? { n: x.alkyle.n, nom: x.alkyle.nom, prefixes: x.alkyle.prefixes } : null,
      },
      chaines: { tous: x.choix.tous, optimales: x.choix.optimales, L: x.choix.L, S: x.choix.S, contient: x.contient || [], depart: x.depart },
    };
  }

  /* ---------- Alcanes cycliques ---------- */
  function nommerCyclo(mol, adj, R, fam, force) {
    if (R.some(i => mol.atomes[i].el !== 'C')) return hp('un cycle qui contient un autre atome que C n\'est pas au programme');
    const m = R.length;
    if (m < 3 || m > 10) return hp('cycle trop grand');
    for (let k = 0; k < m; k++) {
      const a = R[k], b = R[(k + 1) % m];
      if (mol.liaisons.some(l => ((l.a === a && l.b === b) || (l.a === b && l.b === a)) && l.o !== 1)) return hp('une double liaison dans un cycle n\'est pas au programme');
    }
    const cands = [];
    for (let s = 0; s < m; s++) for (const d of [1, -1]) {
      const ordre = R.map((x, k) => R[((s + d * k) % m + m) % m]);
      cands.push({ chaine: ordre, subs: substituants(mol, adj, ordre, new Set()), locG: 0 });
    }
    const choix = choisir(cands, force);
    if (choix.meilleur.subs.some(s => s.complexe)) return hp('une ramification elle-même ramifiée n\'est pas au programme');
    return resultat(mol, { famille: fam, f: null, cyclo: true, choix });
  }

  /* ---------- Nommer une molécule ----------
     Renvoie { nom, variantes, parties, morceaux, ramifs, couleurs, famille, groupe, chaine, numeros, struct, chaines }
     ou { horsProgramme: raison }. */
  function nommer(mol, opt) {
    const force = opt && opt.chaine;
    const n = mol.atomes.length;
    if (!n) return hp('il n\'y a aucun atome');
    if (composantes(mol).length > 1) return hp('les atomes ne sont pas tous reliés entre eux');
    if (!mol.atomes.some(a => a.el === 'C')) return hp('il n\'y a aucun atome de carbone');
    if (mol.liaisons.some(l => l.o === 3)) return hp('une triple liaison (alcyne) n\'est pas au programme');
    if (benzene(mol).size) return hp('un cycle benzénique n\'est pas au programme');
    const adj = adjacence(mol), gs = groupes(mol), el = i => mol.atomes[i].el;
    for (const l of mol.liaisons) {
      if (l.o !== 2) continue;
      const e = [el(l.a), el(l.b)].sort().join('');
      if (e !== 'CC' && e !== 'CO') return hp('cette double liaison n\'est pas au programme');
    }
    if (mol.liaisons.some(l => el(l.a) !== 'C' && el(l.b) !== 'C')) return hp('deux atomes autres que C liés entre eux : hors programme');
    const couverts = new Set();
    gs.forEach(g => g.atomes.forEach(i => couverts.add(i)));
    for (let i = 0; i < n; i++) {
      if (el(i) === 'C' || couverts.has(i)) continue;
      return hp(el(i) === 'O' ? 'un atome O qui n\'appartient à aucun groupe du cours (éther) n\'est pas au programme' : `un atome ${el(i)} qui n'appartient à aucun groupe du cours n'est pas au programme`);
    }
    const fonctions = gs.filter(g => g.cle !== 'halogeno');
    if (fonctions.length > 1) return hp('il y a plusieurs groupes caractéristiques : on ne nomme ici que les molécules qui n\'en ont qu\'un');
    const f = fonctions[0] || null;
    if (f && ['aldehyde', 'cetone', 'acide', 'ester', 'amide'].includes(f.cle) && adj[f.atomes[0]].some(v => HALO_NOM[el(v.j)])) return hp('un halogène sur le C d\'un groupe C=O n\'est pas au programme');
    const famille = f ? f.cle : (gs.length ? 'halogeno' : 'alcane');
    const cyc = cycles(mol);
    if (cyc.length) {
      if (f || cyc.length > 1) return hp(f ? 'un cycle avec un groupe caractéristique n\'est pas au programme' : 'plusieurs cycles : hors programme');
      return nommerCyclo(mol, adj, cyc[0], famille, force);
    }
    const Cs = new Set(); mol.atomes.forEach((a, i) => { if (a.el === 'C') Cs.add(i); });
    const complexe = c => c.subs.some(s => s.complexe);
    const fin = x => (complexe(x.choix.meilleur) ? hp('une ramification elle-même ramifiée n\'est pas au programme') : resultat(mol, x));

    if (!f || ['alcene', 'alcool', 'aldehyde', 'cetone', 'acide'].includes(f.cle)) {
      let G = [], depart = null;
      const exclus = new Set();
      if (f) {
        f.atomes.forEach(i => { if (el(i) !== 'C') exclus.add(i); });
        if (f.cle === 'alcene') G = f.atomes.slice();
        else if (f.cle === 'alcool') G = [adj[f.atomes[0]][0].j];
        else { G = [f.atomes[0]]; if (f.cle !== 'cetone') depart = f.atomes[0]; }
      }
      const locDe = ch => (!f ? 0 : f.cle === 'alcene' ? Math.min(ch.indexOf(G[0]), ch.indexOf(G[1])) + 1 : ch.indexOf(G[0]) + 1);
      const cands = chemins(adj, Cs, G, depart).map(ch => ({ chaine: ch, subs: substituants(mol, adj, ch, exclus), locG: locDe(ch) }));
      if (!cands.length) return hp('chaîne introuvable');
      return fin({ famille, f, choix: choisir(cands, force), contient: G, depart });
    }
    if (f.cle === 'ester') {
      const [c, o2, oE] = f.atomes;
      const alkC = adj[oE].find(v => v.j !== c).j;
      const exclus = new Set([o2, oE]);
      const S = new Set(branche(adj, c, new Set([oE])).filter(i => el(i) === 'C'));
      const cands = chemins(adj, S, [c], c).map(ch => ({ chaine: ch, subs: substituants(mol, adj, ch, exclus), locG: 1 }));
      const alk = nommerAlkyle(mol, adj, alkC, new Set([oE]));
      if (alk.complexe) return hp('un alkyle trop ramifié n\'est pas au programme');
      return fin({ famille, f, choix: choisir(cands, force), alkyle: alk, contient: [c], depart: c });
    }
    // amide et amine : les ramifications sur le N
    const nsDe = (nA, sauf) => adj[nA].filter(v => !sauf.includes(v.j)).map(v => {
      const at = branche(adj, v.j, new Set([nA]));
      return Object.assign({ atomes: at }, nomBranche(mol, adj, v.j, nA, at));
    });
    if (f.cle === 'amide') {
      const [c, o2, nA] = f.atomes;
      const S = new Set(branche(adj, c, new Set([nA])).filter(i => el(i) === 'C'));
      const cands = chemins(adj, S, [c], c).map(ch => ({ chaine: ch, subs: substituants(mol, adj, ch, new Set([o2, nA])), locG: 1 }));
      const nsubs = nsDe(nA, [c]);
      if (nsubs.some(s => s.complexe)) return hp('une ramification ramifiée sur le N n\'est pas au programme');
      return fin({ famille, f, choix: choisir(cands, force), nsubs, contient: [c], depart: c });
    }
    // amine : la plus longue chaîne liée au N donne le nom
    const nA = f.atomes[0];
    const cands = [];
    adj[nA].forEach(v => {
      const a = v.j, K = new Set(branche(adj, a, new Set([nA])).filter(i => el(i) === 'C'));
      chemins(adj, K, [a]).forEach(ch => cands.push({ chaine: ch, subs: substituants(mol, adj, ch, new Set([nA])), locG: ch.indexOf(a) + 1, a }));
    });
    const choix = choisir(cands, force);
    const nsubs = nsDe(nA, [choix.meilleur.a]);
    if (nsubs.some(s => s.complexe)) return hp('une ramification ramifiée sur le N n\'est pas au programme');
    return fin({ famille, f, choix, nsubs, contient: [], amineN: nA });
  }

  /* ---------- La chaîne touchée par l'élève est-elle la chaîne principale ? ----------
     res = nommer(mol) ; choix : atomes touchés. Renvoie { ok, diag, orientations } */
  function evaluerChaine(mol, res, choix) {
    const S = new Set(choix), adj = adjacence(mol);
    if (!S.size) return { ok: false, diag: 'Touche les atomes de carbone de la chaîne principale.' };
    if ([...S].some(i => mol.atomes[i].el !== 'C')) return { ok: false, diag: 'La chaîne carbonée ne contient que des atomes de carbone C.' };
    // une seule chaîne : reliée, sans embranchement
    const deg = i => adj[i].filter(v => S.has(v.j)).length;
    const relies = branche(adj, [...S][0], new Set(mol.atomes.map((a, i) => i).filter(i => !S.has(i))));
    if (relies.length !== S.size) return { ok: false, diag: 'Ces C ne sont pas tous reliés : la chaîne est une suite de C liés les uns aux autres.' };
    // alcane cyclique : la chaîne principale est le cycle (ses C n'ont pas de bout : on le teste avant la forme d'une chaîne)
    if (res.cyclo) {
      const ok = res.chaine.length === S.size && res.chaine.every(i => S.has(i));
      return ok ? { ok: true, orientations: res.chaines.optimales.map(c => c.chaine) } : { ok: false, diag: 'Dans un alcane cyclique, la chaîne principale est le cycle : touche tous ses C, et seulement eux.' };
    }
    if ([...S].some(i => deg(i) > 2) || (S.size > 1 && [...S].filter(i => deg(i) === 1).length !== 2)) return { ok: false, diag: 'Ces C ne forment pas une seule chaîne : une chaîne n\'a pas d\'embranchement, elle va d\'un bout à l\'autre.' };
    const ch = res.chaines;
    if (res.famille === 'ester' && !S.has(ch.depart)) return { ok: false, diag: 'La chaîne principale d\'un ester est celle qui porte le C=O (elle donne l\'alcanoate) : la chaîne liée à l\'O donne l\'alkyle.' };
    if (res.famille === 'amine' && ![...S].some(i => adj[i].some(v => mol.atomes[v.j].el === 'N'))) return { ok: false, diag: 'La chaîne principale d\'une amine est liée au N.' };
    if (ch.contient.some(g => !S.has(g))) return { ok: false, diag: 'La chaîne principale doit contenir le groupe caractéristique' + (res.famille === 'alcene' ? ' (les deux C de la C=C).' : ' (le C qui le porte).') };
    const memes = ch.tous.filter(c => c.chaine.length === S.size && c.chaine.every(i => S.has(i)));
    if (S.size < ch.L || !memes.length) return { ok: false, diag: 'Il y a une chaîne plus longue' + (ch.contient.length ? ' qui contient le groupe' : '') + ' : elle n\'est pas toujours dessinée en ligne droite.' };
    if (memes[0].subs.length < ch.S) return { ok: false, diag: 'Il y a une autre chaîne aussi longue : à longueur égale, on prend celle qui porte le plus de ramifications.' };
    const opt = memes.filter(c => c.optimale);
    if (!opt.length) return { ok: false, diag: 'Il y a une autre chaîne aussi longue, avec des numéros plus petits pour les ramifications.' };
    return { ok: true, orientations: opt.map(c => c.chaine) };
  }

  // le C touché comme n° 1 : { ok, chaine (dans l'ordre de la numérotation), diag }
  function evaluerDepart(mol, res, atomesChaine, i) {
    const S = new Set(atomesChaine);
    const memes = res.chaines.tous.filter(c => c.chaine.length === S.size && c.chaine.every(x => S.has(x)));
    const opt = memes.filter(c => c.optimale && c.chaine[0] === i);
    if (opt.length) return { ok: true, chaine: opt[0].chaine };
    if (!S.has(i)) return { ok: false, diag: 'Le n° 1 est un C de la chaîne principale.' };
    if (res.cyclo) return { ok: false, diag: 'Dans un cycle, le n° 1 est sur un C qui porte une ramification, choisi pour que les numéros soient les plus petits possibles (à égalité : la ramification qui vient la première dans l\'ordre alphabétique).' };
    const depuis = memes.find(c => c.chaine[0] === i);
    if (!depuis) {
      if (TERMINAUX.includes(res.famille)) return { ok: false, diag: 'Le C du groupe caractéristique porte le n° 1.' };
      return { ok: false, diag: 'Le n° 1 est à un bout de la chaîne.' };
    }
    const best = memes.find(c => c.optimale);
    if (depuis.locG !== best.locG) return { ok: false, diag: 'Le C qui porte le groupe doit avoir le plus petit numéro possible : pars de l\'autre bout.' };
    const l1 = depuis.cle.slice(1, 1 + depuis.subs.length), l2 = best.cle.slice(1, 1 + best.subs.length);
    if (cmpCles(l1, l2) !== 0) return { ok: false, diag: 'En partant de l\'autre bout, les numéros des ramifications sont plus petits.' };
    return { ok: false, diag: 'Les numéros sont les mêmes dans les deux sens : à égalité, le plus petit numéro va à la ramification qui vient la première dans l\'ordre alphabétique.' };
  }

  /* ============================================================
     DU NOM À LA MOLÉCULE
     ============================================================ */
  const RACINES_SA = RACINES.map(sansAccent);
  const PREF_SA = ['methyl', 'ethyl', 'propyl', 'butyl', 'pentyl', 'hexyl', 'heptyl', 'octyl', 'nonyl', 'decyl', 'fluoro', 'chloro', 'bromo', 'iodo'];
  const PREF_NOM = ['méthyl', 'éthyl', 'propyl', 'butyl', 'pentyl', 'hexyl', 'heptyl', 'octyl', 'nonyl', 'décyl', 'fluoro', 'chloro', 'bromo', 'iodo'];
  const MULT_SA = { '': 1, di: 2, tri: 3, tetra: 4, penta: 5, hexa: 6 };
  const PREF_RE = /^(?:((?:\d+|n)(?:,(?:\d+|n))*)-)?(di|tri|tetra|penta|hexa)?(methyl|ethyl|propyl|butyl|pentyl|hexyl|heptyl|octyl|nonyl|decyl|fluoro|chloro|bromo|iodo)-?/;
  const PARENT_RE = /^(cyclo)?(meth|eth|prop|but|pent|hex|hept|oct|non|dec)(?:(ane)|(?:-(\d+)-)?(ene)|an(e?)(?:-(\d+)-)?(ol|one|amine|al|oique|oate|amide))$/;
  const ALKYLE_RE = /^(meth|eth|prop|but|pent|hex|hept|oct|non|dec)yl(e?)$/;
  const FAM_SUF = { ane: 'alcane', ene: 'alcene', ol: 'alcool', al: 'aldehyde', one: 'cetone', oique: 'acide', oate: 'ester', amine: 'amine', amide: 'amide' };
  const SUF_AFF = { ane: 'ane', ene: 'ène', ol: 'ol', al: 'al', one: 'one', oique: 'oïque', oate: 'oate', amine: 'amine', amide: 'amide' };

  // saisie nettoyée : apostrophes, tirets, espaces
  const normaliserSaisie = s => String(s == null ? '' : s).trim().replace(/[’`´ʼ]/g, '\'').replace(/[‐‑‒–—−]/g, '-').replace(/\s+/g, ' ');

  // écriture tolérante (sans accents, minuscules) : tirets et virgules remis à leur place
  function canoniser(t) {
    t = t.replace(/\s+/g, '');
    t = t.replace(/(\d)[-.;:](?=\d)/g, '$1,').replace(/,+/g, ',');
    let r = '';
    for (let i = 0; i < t.length; i++) {
      const c = t[i];
      if (c === '-' && /[a-z]/.test(t[i - 1] || '') && /[a-z]/.test(t[i + 1] || '')) {
        const avantN = t[i - 1] === 'n' && (i - 1 === 0 || /[-,]/.test(t[i - 2]));
        const apresN = t[i + 1] === 'n' && /[-,]/.test(t[i + 2] || '');
        if (!avantN && !apresN) continue;
      }
      r += c;
    }
    return r.replace(/(\d)(?=[a-z])/g, '$1-').replace(/([a-z])(?=\d)/g, '$1-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  }

  function lirePrefixes(t) {
    const prefs = [];
    for (let garde = 0; garde < 20; garde++) {
      if (PARENT_RE.test(t) || ALKYLE_RE.test(t)) break;
      const m = t.match(PREF_RE);
      if (!m || !m[0].length) break;
      prefs.push({ locs: m[1] ? m[1].split(',').map(x => (x === 'n' ? 'N' : +x)) : null, mult: m[2] || '', nom: PREF_NOM[PREF_SA.indexOf(m[3])] });
      t = t.slice(m[0].length);
    }
    return { prefs, reste: t };
  }

  // analyse d'un nom écrit → structure { acide, cyclo, n, suffixe, loc, prefixes, alkyle } (+ remarques)
  function analyserNom(saisie) {
    const notes = {};
    const s = normaliserSaisie(saisie);
    let t = sansAccent(s).toLowerCase();
    let acide = false;
    if (/^acide(\s|$)/.test(t)) { acide = true; t = t.replace(/^acide\s*/, ''); }
    let alkTxt = null, m;
    if ((m = t.match(/^(.+?oate)\s*(?:de\s+|d\s*'\s*|d\s+)(.+)$/))) { t = m[1]; alkTxt = m[2]; }
    else if ((m = t.match(/^(.+?oate)\s+(.+)$/))) { t = m[1]; alkTxt = m[2]; notes.deManquant = true; }
    // « méthyle-… » : e en trop à la fin d'une ramification
    if (/yle(?=[-\s,])/.test(t)) { notes.yleEnTrop = true; t = t.replace(/yle(?=[-\s,])/g, 'yl'); }
    t = canoniser(t);
    if (/(^|-)\d+-(meth|eth|prop|but|pent|hex|hept|oct|non|dec)an(ol|one|amine)$/.test(t)) notes.numeroDevant = true;
    if (/(meth|eth|prop|but|pent|hex|hept|oct|non|dec)an?$/.test(t)) notes.terminaison = true;
    const { prefs, reste } = lirePrefixes(t);
    const p = reste.match(PARENT_RE);
    if (!p) return { erreur: true, notes };
    const st = { acide, cyclo: !!p[1], n: RACINES_SA.indexOf(p[2]) + 1, suffixe: null, loc: null, prefixes: prefs, alkyle: null };
    if (p[3]) st.suffixe = 'ane';
    else if (p[5]) { st.suffixe = 'ene'; st.loc = p[4] ? +p[4] : null; }
    else { st.suffixe = p[8]; st.loc = p[7] ? +p[7] : null; if (p[6]) notes.elision = true; }
    if (alkTxt != null) {
      const a = lirePrefixes(canoniser(alkTxt.replace(/\s+/g, '')));
      const q = a.reste.match(ALKYLE_RE);
      if (!q) return { erreur: true, notes, st };
      st.alkyle = { n: RACINES_SA.indexOf(q[1]) + 1, prefixes: a.prefs };
      if (!q[2]) notes.alkyleSansE = true;
    }
    return { st, notes };
  }

  const familleDe = st => (st.suffixe === 'ane' ? (st.prefixes.some(p => /o$/.test(p.nom)) ? 'halogeno' : 'alcane') : FAM_SUF[st.suffixe]);
  const nbDe = p => (p.locs ? p.locs.length : MULT_SA[sansAccent(p.mult)] || 1);
  const kDe = nom => PREF_NOM.indexOf(nom) + 1;

  // construit la molécule d'une structure dont tous les numéros sont connus ; { mol } ou { erreur }
  function construireSt(st) {
    const mol = { atomes: [], liaisons: [] }, fam = familleDe(st), n = st.n;
    const ajouter = el => mol.atomes.push({ el }) - 1;
    const lier = (a, b, o) => mol.liaisons.push({ a, b, o: o || 1 });
    for (let i = 0; i < n; i++) { ajouter('C'); if (i) lier(i - 1, i); }
    if (st.cyclo) { if (n < 3) return { erreur: 'un cycle a au moins 3 C' }; lier(n - 1, 0); }
    const enC = p => (p >= 1 && p <= n ? p - 1 : -1);
    let N = -1;
    const l = st.loc;
    switch (fam) {
      case 'alcene': { if (l < 1 || l >= n) return { erreur: 'numéro de la double liaison impossible' }; mol.liaisons[l - 1].o = 2; break; }
      case 'alcool': { if (enC(l) < 0) return { erreur: 'numéro du groupe impossible' }; lier(enC(l), ajouter('O')); break; }
      case 'cetone': { if (enC(l) < 0) return { erreur: 'numéro du groupe impossible' }; lier(enC(l), ajouter('O'), 2); break; }
      case 'amine': { if (enC(l) < 0) return { erreur: 'numéro du groupe impossible' }; N = ajouter('N'); lier(enC(l), N); break; }
      case 'aldehyde': lier(0, ajouter('O'), 2); break;
      case 'acide': lier(0, ajouter('O'), 2); lier(0, ajouter('O')); break;
      case 'amide': lier(0, ajouter('O'), 2); N = ajouter('N'); lier(0, N); break;
      case 'ester': {
        lier(0, ajouter('O'), 2);
        const oE = ajouter('O'); lier(0, oE);
        if (!st.alkyle) return { erreur: 'ester sans alkyle' };
        const a0 = mol.atomes.length;
        for (let i = 0; i < st.alkyle.n; i++) { ajouter('C'); if (i) lier(a0 + i - 1, a0 + i); }
        lier(oE, a0);
        for (const p of st.alkyle.prefixes) for (const loc of p.locs) {
          if (loc === 'N' || loc < 1 || loc > st.alkyle.n) return { erreur: 'numéro impossible dans l\'alkyle' };
          accrocher(a0 + loc - 1, p.nom);
        }
        break;
      }
      default: break;
    }
    function accrocher(at, nom) {
      const k = kDe(nom);
      if (k > 10) { lier(at, ajouter(Object.keys(HALO_NOM).find(e => HALO_NOM[e] === nom))); return; }
      let prec = at;
      for (let i = 0; i < k; i++) { const c = ajouter('C'); lier(prec, c); prec = c; }
    }
    for (const p of st.prefixes) for (const loc of p.locs) {
      if (loc === 'N') { if (N < 0) return { erreur: 'il n\'y a pas de N dans ce nom' }; accrocher(N, p.nom); }
      else { if (enC(loc) < 0) return { erreur: `il n'y a pas de C n° ${loc} dans la chaîne` }; accrocher(enC(loc), p.nom); }
    }
    for (let i = 0; i < mol.atomes.length; i++) if (somme(mol, i) > valence(mol.atomes[i].el)) return { erreur: `trop de liaisons sur un ${mol.atomes[i].el}` };
    return { mol };
  }

  // numéros manquants : on essaie toutes les places ; une seule molécule possible → elle
  function construireNom(st) {
    const fam = familleDe(st), trous = [];
    const besoinLoc = ['alcene', 'alcool', 'cetone', 'amine'].includes(fam);
    const places = [];
    for (let p = 1; p <= st.n; p++) places.push(p);
    if (besoinLoc && st.loc == null) trous.push({ g: true, vals: (fam === 'alcene' ? places.filter(p => p !== 'N' && p < st.n) : places.filter(p => p !== 'N')).map(p => [p]) });
    const combis = (k, from) => {
      if (!k) return [[]];
      const r = [];
      for (let i = from; i < places.length; i++) for (const c of combis(k - 1, i)) r.push([places[i]].concat(c));
      return r;
    };
    st.prefixes.forEach(p => { if (!p.locs) trous.push({ p, vals: combis(MULT_SA[sansAccent(p.mult)] || 1, 0) }); });
    (st.alkyle ? st.alkyle.prefixes : []).forEach(p => {
      if (!p.locs) {
        const pl = []; for (let q = 1; q <= st.alkyle.n; q++) pl.push(q);
        const cb = (k, from) => { if (!k) return [[]]; const r = []; for (let i = from; i < pl.length; i++) for (const c of cb(k - 1, i)) r.push([pl[i]].concat(c)); return r; };
        trous.push({ p, vals: cb(MULT_SA[sansAccent(p.mult)] || 1, 0) });
      }
    });
    if (!trous.length) return construireSt(st);
    const trouvees = [];
    let essais = 0;
    const essayer = k => {
      if (essais > 4000 || trouvees.length > 1) return;
      if (k === trous.length) {
        essais++;
        const st2 = Object.assign({}, st, {
          loc: st.loc,
          prefixes: st.prefixes.map(p => Object.assign({}, p)),
          alkyle: st.alkyle ? Object.assign({}, st.alkyle, { prefixes: st.alkyle.prefixes.map(p => Object.assign({}, p)) }) : null,
        });
        trous.forEach(t => {
          if (t.g) st2.loc = t.choix[0];
          else {
            const liste = st.alkyle && st.alkyle.prefixes.includes(t.p) ? st2.alkyle.prefixes : st2.prefixes;
            const src = st.alkyle && st.alkyle.prefixes.includes(t.p) ? st.alkyle.prefixes : st.prefixes;
            liste[src.indexOf(t.p)].locs = t.choix;
          }
        });
        const r = construireSt(st2);
        if (!r.mol) return;
        const nm = nommer(r.mol);
        if (nm.horsProgramme || nm.n !== st.n || nm.famille !== fam || nm.cyclo !== st.cyclo) return;
        if (!trouvees.some(x => meme(x, r.mol))) trouvees.push(r.mol);
        return;
      }
      for (const v of trous[k].vals) { trous[k].choix = v; essayer(k + 1); }
    };
    essayer(0);
    if (trouvees.length === 1) return { mol: trouvees[0] };
    return trouvees.length ? { ambigu: true, erreur: 'il manque des numéros' } : { erreur: 'ce nom ne correspond à aucune molécule' };
  }

  // nom → molécule (null si le nom est illisible ou impossible)
  function lireNom(nom) {
    const a = analyserNom(nom);
    if (!a.st) return null;
    const r = construireNom(a.st);
    return r.mol || null;
  }

  /* ============================================================
     DIAGNOSTIC D'UN NOM SAISI
     diagnostiquerNom(saisie, mol ou nommer(mol)) → { ok, remarque } ou { ok: false, diag }
     ============================================================ */
  const ACCENTUES = ['méthyl', 'éthyl', 'méthan', 'éthan', 'tétra', 'décyl', 'déc', 'ène', 'oïque'];
  function remarqueAccents(saisie, att) {
    const s = saisie.toLowerCase();
    for (const w of ACCENTUES) if (att.nom.includes(w) && !s.includes(w) && sansAccent(s).includes(sansAccent(w))) return `Pense aux accents : ${w}.`;
    return 'Pense aux accents.';
  }

  // tirets, virgules, espaces (sur la saisie telle quelle)
  function diagFormat(s) {
    const lettre = '[a-zàâäéèêëîïôöùûüç]';
    const sansEsp = s.replace(/^acide\s+/i, '').replace(/\s+(de\s+|d'\s*)/i, '#');
    if (/\s/.test(sansEsp)) return 'Pas d\'espace dans le nom (seulement dans « acide … » et « … de … »).';
    if (/\d\s*[-.;]\s*\d/.test(s)) return 'Entre deux chiffres, on met une virgule : 2,3-diméthyl.';
    if (new RegExp('\\d' + lettre, 'i').test(s) || new RegExp(lettre + '\\d', 'i').test(s)) return 'Entre un chiffre et une lettre, on met un tiret : 2-méthyl, pentan-2-ol.';
    const re = new RegExp('(' + lettre + ')-(' + lettre + ')', 'gi');
    let m;
    while ((m = re.exec(s))) {
      const i = m.index;
      const avantN = /n/i.test(m[1]) && (i === 0 || /[-,\s]/.test(s[i - 1]));
      const apresN = /n/i.test(m[2]) && /[-,]/.test(s[i + 3] || '');
      if (!avantN && !apresN) {
        const g = (s.slice(0, i + 1).match(/[a-zàâäéèêëîïôöùûüç]+$/i) || [''])[0], d = (s.slice(i + 2).match(/^[a-zàâäéèêëîïôöùûüç]+/i) || [''])[0];
        return `Pas de tiret entre deux lettres : « ${g}-${d} » s'écrit « ${g}${d} ».`;
      }
      re.lastIndex = i + 1;
    }
    if (/,-|-,|,,|--/.test(s)) return 'Vérifie les virgules et les tirets : une virgule entre deux chiffres, un tiret entre un chiffre et une lettre.';
    return null;
  }

  const UN = { alcane: 'un alcane', halogeno: 'un halogénoalcane', alcene: 'un alcène', alcool: 'un alcool', aldehyde: 'un aldéhyde', cetone: 'une cétone', acide: 'un acide carboxylique', ester: 'un ester', amine: 'une amine', amide: 'un amide' };
  const DES = { ane: 'alcanes', ene: 'alcènes', ol: 'alcools', al: 'aldéhydes', one: 'cétones', oique: 'acides carboxyliques', oate: 'esters', amine: 'amines', amide: 'amides' };
  const SUF_ATT = { alcane: 'ane', halogeno: 'ane', alcene: 'ene', alcool: 'ol', aldehyde: 'al', cetone: 'one', acide: 'oique', ester: 'oate', amine: 'amine', amide: 'amide' };

  function diagFamille(st, E) {
    const suf = st.suffixe, att = SUF_ATT[E.famille];
    const fin = `Cette molécule est ${UN[E.famille]} : terminaison « -${SUF_AFF[att]} »${E.famille === 'acide' ? ' (acide …-oïque)' : E.famille === 'ester' ? ' (…oate de …yle)' : ''}.`;
    if (suf === 'one' && att === 'al') return 'Le C=O est au bout de la chaîne (son C porte un H) : c\'est un aldéhyde, terminaison « -al », pas une cétone.';
    if (suf === 'al' && att === 'one') return 'Le C=O est entre deux C : c\'est une cétone, terminaison « -one », pas un aldéhyde.';
    if (att === 'oique' && (suf === 'ol' || suf === 'one' || suf === 'al')) return 'Le C porte un =O et un OH : ensemble, ils forment le groupe carboxyle (un acide carboxylique : acide …-oïque), pas un alcool ni une cétone.';
    if (att === 'oate' && suf === 'oique') return 'Le O lié au C=O est lié à un autre C, pas à un H : c\'est un ester (…oate de …yle), pas un acide.';
    if (att === 'amide' && (suf === 'amine' || suf === 'one')) return 'Le N est lié au C du C=O : ensemble ils forment le groupe amide (terminaison « -amide »), pas une amine ni une cétone.';
    return `Ta terminaison « -${SUF_AFF[suf]} » est celle des ${DES[suf]}. ${fin}`;
  }

  // la ramification d'un bout (1-méthyl, 2-éthyl…) prolonge la chaîne
  function prolongement(st, fam) {
    const terminal = TERMINAUX.includes(fam);
    for (const p of st.prefixes) {
      const k = kDe(p.nom);
      if (k > 10 || !p.locs) continue;
      for (const loc of p.locs) {
        if (loc === 'N') continue;
        if ((!terminal && loc <= k) || loc >= st.n + 1 - k) return `Un ${p.nom} sur le C n° ${loc} prolonge la chaîne : ses C font partie de la chaîne principale.`;
      }
    }
    return '';
  }

  function comparerNoms(an, att) {
    const st = an.st, E = att.struct, notes = an.notes;
    const fam = familleDe(st);
    // 1. famille, « acide », cycle
    if (SUF_ATT[E.famille] !== st.suffixe) return diagFamille(st, E);
    if (E.acide && !st.acide) return 'Le nom d\'un acide carboxylique commence par « acide » : acide …-oïque.';
    if (!E.acide && st.acide) return 'Ce n\'est pas un acide carboxylique : pas de « acide » dans le nom.';
    if (E.cyclo && !st.cyclo) return 'Les C forment un cycle : le nom de la chaîne commence par « cyclo » (cyclohexane).';
    if (!E.cyclo && st.cyclo) return 'Il n\'y a pas de cycle dans cette molécule : pas de « cyclo ».';
    if (notes.yleEnTrop) return 'Pas de « e » à la fin du nom d\'une ramification : méthyl, éthyl, propyl.';
    // 2. ester : les deux chaînes
    if (E.alkyle) {
      if (!st.alkyle) return 'Un ester se nomme « …oate de …yle » : l\'alcanoate (chaîne du C=O), puis l\'alkyle (chaîne liée à l\'O).';
      if (st.n === E.alkyle.n && st.alkyle.n === E.n && E.n !== E.alkyle.n) return 'Tu as inversé les deux chaînes : la chaîne qui porte le C=O donne l\'alcanoate ; la chaîne liée à l\'O donne l\'alkyle.';
    }
    // 3. longueur de la chaîne principale
    if (st.n !== E.n) {
      const gr = ['alcane', 'halogeno'].includes(E.famille) ? '' : ' qui contient le groupe';
      if (st.n < E.n) return `Ta chaîne a ${st.n} C ; il y en a une de ${E.n}${gr}.${prolongement(st, fam) ? ' ' + prolongement(st, fam) : ' Elle n\'est pas toujours dessinée en ligne droite.'}`;
      return `Ta chaîne a ${st.n} C, mais la plus longue chaîne${gr} n'en a que ${E.n}. Recompte les C.`;
    }
    if (E.alkyle) {
      if (st.alkyle.n !== E.alkyle.n) return `La chaîne liée à l'O (l'alkyle) a ${E.alkyle.n} C dans sa chaîne la plus longue : compte-les à partir du C lié à l'O.`;
      const pa = st.alkyle.prefixes.map(p => (p.locs || []).join(',') + '-' + p.mult + sansAccent(p.nom)).join('-');
      const pe = E.alkyle.prefixes.map(p => p.locs.join(',') + '-' + MULT_SA_INV(p.locs.length) + sansAccent(p.nom)).join('-');
      if (sansAccent(pa) !== sansAccent(pe)) return 'Vérifie l\'alkyle (la chaîne liée à l\'O) : on numérote sa chaîne à partir du C lié à l\'O (1-méthyléthyle, 2-méthylpropyle).';
    }
    // 4. numéro du groupe
    if (['alcene', 'alcool', 'cetone', 'amine'].includes(E.famille)) {
      if (st.loc == null) {
        if (E.gEcrit) return `Il manque le numéro du groupe : il se place juste devant la terminaison (${EX_LOC[E.famille]}) ; c'est le n° de l'atome de carbone qui porte le groupe caractéristique.`;
      } else if (st.loc !== E.locG) {
        if (E.famille === 'alcene' && st.loc === E.locG + 1) return 'Le n° d\'une double liaison est celui de son premier C (le plus petit des deux).';
        const inverse = E.famille === 'alcene' ? E.n - E.locG : E.n + 1 - E.locG;
        if (st.loc === inverse) return 'En partant de l\'autre bout, le numéro du groupe est plus petit : le C qui porte le groupe doit avoir le plus petit numéro possible.';
        return 'Le numéro du groupe est celui de l\'atome de carbone qui porte le groupe caractéristique : vérifie la numérotation.';
      }
    } else if (st.loc != null && st.loc !== 1 && TERMINAUX.includes(E.famille)) {
      return `Le C du groupe est toujours le n° 1 : on n'écrit pas son numéro (…${SUF_AFF[SUF_ATT[E.famille]]}).`;
    }
    // 5. ramifications
    const S = st.prefixes, EP = E.prefixes;
    const total = (liste, nom) => liste.filter(p => p.nom === nom).reduce((s, p) => s + nbDe(p), 0);
    for (const p of S) if (!EP.some(e => e.nom === p.nom)) {
      if (kDe(p.nom) > 10) return `Il n'y a pas ${deNom(p.nom)} dans cette molécule.`;
      const manque = EP.find(e => !S.some(q => q.nom === e.nom) && !e.halo);
      return manque ? `Il n'y a pas ${deNom(p.nom)} dans cette molécule : compte les C de chaque ramification (méthyl : 1 C, éthyl : 2 C, propyl : 3 C).` : `Il n'y a pas ${deNom(p.nom)} dans cette molécule.`;
    }
    for (const e of EP) if (!S.some(p => p.nom === e.nom)) return e.halo ? `Il manque un halogène : ${e.nom} (${e.locs.length > 1 ? MULT[e.locs.length] + e.nom : e.nom}).` : `Il manque une ramification : compte toutes les ramifications de la chaîne principale.`;
    for (const e of EP) {
      const ts = total(S, e.nom), te = e.locs.length;
      if (ts < te) return `Il y a ${te} ${e.nom} : préfixe « ${MULT[te]} » et un numéro pour chacun.`;
      if (ts > te) return `Il n'y a ${te === 1 ? 'qu\'un' : 'que ' + te} ${e.nom}${te > 1 ? ' (' + MULT[te] + e.nom + ')' : ''}.`;
    }
    const vus = new Set();
    for (const p of S) {
      if (vus.has(p.nom)) {
        const locs = S.filter(q => q.nom === p.nom).flatMap(q => q.locs || []).sort((a, b) => (a === 'N' ? 0 : a) - (b === 'N' ? 0 : b));
        return `Les ramifications identiques se regroupent : ${locs.length ? locs.join(',') + '-' : ''}${MULT[total(S, p.nom)]}${p.nom} (di, tri, tétra…).`;
      }
      vus.add(p.nom);
    }
    for (const p of S) {
      const k = MULT_SA[sansAccent(p.mult)] || 1;
      if (!p.locs) continue;
      if (p.locs.length > 1 && !p.mult) return `${p.locs.length} ${p.nom} : on écrit ${p.locs.join(',')}-${MULT[p.locs.length]}${p.nom}.`;
      if (p.locs.length < k) return `« ${p.mult} » veut dire ${k} : il faut ${k} numéros, un par ramification, même s'ils sont égaux (2,2-diméthyl).`;
      if (p.locs.length > k) return `${p.locs.length} numéros : il y a ${p.locs.length} ${p.nom}, préfixe « ${MULT[p.locs.length]} ».`;
    }
    for (const e of EP) {
      const p = S.find(q => q.nom === e.nom);
      const eN = e.locs.filter(l => l === 'N').length, sN = (p.locs || []).filter(l => l === 'N').length;
      if (eN > sN) return `${ceNom(e.nom)} est accroché sur le N : on écrit N-${e.nom}.`;
      if (sN > eN) return `${ceNom(e.nom)} n'est pas accroché sur le N, mais sur un C de la chaîne.`;
    }
    const sansNum = S.find(q => !q.locs && EP.find(e => e.nom === q.nom).ecrits);
    if (sansNum) return `Il manque ${nbDe(sansNum) > 1 ? 'les numéros' : 'le numéro'} : ${sansNum.nom} sur quel${nbDe(sansNum) > 1 ? 's' : ''} C ?`;
    // valeurs des numéros
    const numeriques = (locs, inv) => (locs || []).filter(l => l !== 'N').map(l => (inv ? E.n + 1 - l : l));
    let differe = false, inverse = true, memeEnsemble = true;
    const tousS = [], tousE = [];
    for (const e of EP) {
      const p = S.find(q => q.nom === e.nom);
      if (!p.locs) continue;
      const ls = numeriques(p.locs).sort((a, b) => a - b), le = numeriques(e.locs).sort((a, b) => a - b);
      tousS.push(...ls); tousE.push(...le);
      if (ls.join() !== le.join()) differe = true;
      if (ls.join() !== numeriques(e.locs, true).sort((a, b) => a - b).join()) inverse = false;
    }
    if (differe) {
      tousS.sort((a, b) => a - b); tousE.sort((a, b) => a - b);
      if (tousS.join() !== tousE.join()) memeEnsemble = false;
      if (memeEnsemble) return 'Les numéros sont les mêmes dans les deux sens : à égalité, le plus petit numéro va à la ramification qui vient la première dans l\'ordre alphabétique.';
      if (inverse && !TERMINAUX.includes(E.famille) && !E.cyclo) return 'En partant de l\'autre bout de la chaîne, les numéros sont plus petits.';
      if (E.cyclo) return 'Numérote le cycle pour que les numéros soient les plus petits possibles (et le n° 1 à la ramification qui vient la première dans l\'ordre alphabétique).';
      return 'Vérifie les numéros : ce sont ceux des C de la chaîne principale qui portent les ramifications, en partant du bon bout.';
    }
    // ordre alphabétique (la variante « N-… d'abord » est acceptée)
    const ordre = S.map(p => p.nom);
    const trie = ordre.slice().sort(ordreAlpha);
    if (ordre.join() !== trie.join() && !(att.variantes || []).length) {
      const avecMult = S.slice().sort((a, b) => ordreAlpha(a.mult + a.nom, b.mult + b.nom)).map(p => p.nom);
      if (ordre.join() === avecMult.join()) return 'Di, tri, tétra… ne comptent pas dans l\'ordre alphabétique : on classe éthyl, méthyl… (é avant m).';
      return 'Les ramifications s\'écrivent dans l\'ordre alphabétique (é avant m ; di, tri… ne comptent pas).';
    }
    if (notes.elision) return 'Devant une voyelle, on enlève le « e » de « ane » : butan-2-ol, butanal.';
    if (notes.alkyleSansE) return 'Dans « …oate de …yle », l\'alkyle prend un « e » à la fin : éthyle, butyle.';
    if (notes.deManquant) return 'Un ester se nomme « …oate de …yle » : n\'oublie pas « de » (ou « d\' » devant une voyelle).';
    return null;
  }
  const MULT_SA_INV = k => sansAccent(MULT[k]);
  const ceNom = nom => (commenceVoyelle(nom) ? 'Cet ' : 'Ce ') + nom;
  const deNom = nom => (commenceVoyelle(nom) ? 'd\'' : 'de ') + nom;
  const EX_LOC = { alcene: 'but-2-ène', alcool: 'propan-2-ol', cetone: 'pentan-2-one', amine: 'propan-2-amine' };

  function diagnostiquerNom(saisie, mol) {
    const att = mol && mol.nom ? mol : nommer(mol);
    if (att.horsProgramme) return { ok: false, diag: 'Cette molécule n\'est pas au programme : ' + att.horsProgramme + '.' };
    const s = normaliserSaisie(saisie);
    if (!s) return { ok: false, vide: true, diag: 'Écris le nom.' };
    const formes = [att.nom].concat(att.variantes || []);
    const bas = x => x.toLowerCase();
    if (formes.some(f => bas(f) === bas(s))) return { ok: true };
    const accents = formes.some(f => bas(sansAccent(f)) === bas(sansAccent(s)));
    if (accents) return { ok: true, remarque: remarqueAccents(s, att) };
    const an = analyserNom(s);
    const format = diagFormat(s);
    if (!an.st) {
      if (an.notes.numeroDevant) return { ok: false, diag: 'Le numéro du groupe se place juste devant la terminaison : pentan-2-ol, pas 2-pentanol.' };
      if (an.notes.yleEnTrop) return { ok: false, diag: 'Pas de « e » à la fin du nom d\'une ramification : méthyl, éthyl, propyl.' };
      if (an.notes.terminaison) return { ok: false, diag: 'Il manque la fin du nom : la terminaison de la famille (pentane, pentan-2-ol, pentanal…).' };
      return { ok: false, diag: format || 'Je ne reconnais pas ce nom : vérifie l\'orthographe (méthyl, éthyl… ; pentane, pentan-2-ol, pentanal…).' };
    }
    const d = comparerNoms(an, att);
    if (d) return { ok: false, diag: d };
    if (format) return { ok: false, diag: format };
    // dernière vérification : le nom décrit bien la molécule
    const r = construireNom(an.st);
    if (!r.mol || !meme(r.mol, molDe(mol))) return { ok: false, diag: 'Ce nom ne correspond pas à cette molécule : relis la chaîne principale et les ramifications.' };
    // « pentan-1-oate », « butan-1-al » : faux (on n'écrit pas le 1), mais la molécule est la bonne :
    // l'outil le signale comme une erreur, affiche le bon nom et valide quand même
    if (an.st.loc === 1 && TERMINAUX.includes(att.famille)) {
      return { ok: true, numeroUn: true, diag: `Le C du groupe ${TXT_UN[att.famille]} est toujours le n° 1 : on n'écrit pas ce « 1 ». Le nom juste est <b>${att.nom}</b>.` };
    }
    const acc = sansAccent(s) === s && att.nom !== sansAccent(att.nom);
    return { ok: true, remarque: acc ? remarqueAccents(s, att) : '' };
  }
  const molDe = m => (m && m.atomes ? m : m && m.mol);
  const TXT_UN = { aldehyde: 'd\'un aldéhyde (…al)', acide: 'd\'un acide carboxylique (acide …oïque)', ester: 'd\'un ester (…oate)', amide: 'd\'un amide (…amide)' };

  /* ============================================================
     FABRIQUES (questions aléatoires)
     ============================================================ */
  const entre = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const auHasard = t => t[Math.floor(Math.random() * t.length)];

  function chaineDe(n) {
    const mol = { atomes: [], liaisons: [] };
    for (let i = 0; i < n; i++) { mol.atomes.push({ el: 'C' }); if (i) mol.liaisons.push({ a: i - 1, b: i, o: 1 }); }
    return mol;
  }
  function brancher(mol, at, k) {
    let prec = at;
    for (let i = 0; i < k; i++) { const c = mol.atomes.push({ el: 'C' }) - 1; mol.liaisons.push({ a: prec, b: c, o: 1 }); prec = c; }
  }
  function libre(mol, i) { return nbH(mol, i) > 0; }
  const tailleRamif = n => { const x = Math.random(); return x < .62 || n < 5 ? 1 : x < .9 || n < 7 ? 2 : 3; };

  // alcane : chaîne de min à max C, ramMin à ramMax ramifications (méthyl, éthyl, propyl)
  function fabriqueAlcane(o) {
    o = Object.assign({ min: 4, max: 10, ramMin: 1, ramMax: 3 }, o);
    for (let essai = 0; essai < 400; essai++) {
      const n = entre(o.min, o.max), nr = entre(o.ramMin, o.ramMax), mol = chaineDe(n);
      for (let r = 0; r < nr; r++) {
        const k = tailleRamif(n);
        if (n - k < k + 1) continue;
        const p = entre(k + 1, n - k) - 1;
        if (somme(mol, p) <= 2) brancher(mol, p, k);
      }
      const res = nommer(mol);
      if (res.horsProgramme || res.n < o.min || res.n > o.max) continue;
      if (res.ramifs.length < o.ramMin || res.ramifs.length > o.ramMax) continue;
      return { mol, nom: res.nom, res, smiles: ecrire(mol) };
    }
    return null;
  }

  // une molécule d'une famille : chaîne de min à max C, ramMin à ramMax ramifications
  function fabriqueFamille(cle, o) {
    o = Object.assign({ min: 2, max: 8, ramMin: 0, ramMax: 2 }, o);
    for (let essai = 0; essai < 600; essai++) {
      const n = entre(Math.max(o.min, cle === 'cetone' ? 3 : 1), o.max);
      const mol = chaineDe(n);
      const ajout = el => mol.atomes.push({ el }) - 1;
      const lier = (a, b, x) => mol.liaisons.push({ a, b, o: x || 1 });
      let N = -1, interdit = new Set();
      if (cle === 'alcene') { if (n < 2) continue; const l = entre(0, n - 2); mol.liaisons[l].o = 2; }
      else if (cle === 'alcool') lier(entre(0, n - 1), ajout('O'));
      else if (cle === 'cetone') lier(entre(1, n - 2), ajout('O'), 2);
      else if (cle === 'aldehyde') { lier(0, ajout('O'), 2); interdit.add(0); }
      else if (cle === 'acide') { lier(0, ajout('O'), 2); lier(0, ajout('O')); }
      else if (cle === 'amide') { lier(0, ajout('O'), 2); N = ajout('N'); lier(0, N); if (Math.random() < .5) brancher(mol, N, entre(1, 2)); if (Math.random() < .2) brancher(mol, N, 1); }
      else if (cle === 'amine') { N = ajout('N'); lier(entre(0, n - 1), N); if (Math.random() < .45) brancher(mol, N, entre(1, Math.max(1, Math.min(3, n - 1)))); if (Math.random() < .25) brancher(mol, N, 1); }
      else if (cle === 'ester') {
        lier(0, ajout('O'), 2); const oE = ajout('O'); lier(0, oE);
        const m = entre(1, 4), a0 = mol.atomes.length; brancher(mol, oE, m);
        if (Math.random() < .3 && m >= 2) { const p = a0 + entre(0, m - 2); if (nbH(mol, p) >= 2 || (p !== a0 + m - 1)) brancher(mol, p, 1); }
        for (let i = a0; i < mol.atomes.length; i++) interdit.add(i);
      } else if (cle === 'halogeno') {
        const x = entre(1, Math.random() < .7 ? 1 : 2);
        for (let h = 0; h < x; h++) { const p = entre(0, n - 1); if (libre(mol, p)) lier(p, ajout(auHasard(['Cl', 'Cl', 'Br', 'Br', 'F', 'I']))); }
      }
      interdit.add(N); interdit.add(0);
      const nr = entre(o.ramMin, o.ramMax);
      for (let r = 0; r < nr; r++) {
        const k = n >= 6 && Math.random() < .3 ? 2 : 1;
        const p = entre(1, n - 1);
        if (interdit.has(p) || nbH(mol, p) < 1 || somme(mol, p) > 2) continue;
        brancher(mol, p, k);
      }
      const res = nommer(mol);
      if (res.horsProgramme || res.famille !== cle || res.n < o.min || res.n > o.max) continue;
      if (res.ramifs.filter(x => !x.alkyle && x.pos !== 'N' && !x.halo).length > o.ramMax) continue;
      return { mol, nom: res.nom, res, smiles: ecrire(mol) };
    }
    return null;
  }

  /* ============================================================
     ÉTIQUETTES CONDENSÉES (pour reproduire un énoncé : C2H5, (CH2)5, C6H5)
     condenser(mol, [{ atomes, texte }]) → { mol (réduite), vers (ancien → nouvel indice), pseudo }
     Chaque groupe d'atomes devient un seul atome (el 'C', etiq : texte) ; on dessine
     la molécule réduite, on calcule sur la molécule complète.
     ============================================================ */
  function condenser(mol, specs) {
    const dans = new Map();
    specs.forEach((sp, k) => sp.atomes.forEach(i => dans.set(i, k)));
    const res = { atomes: [], liaisons: [] }, vers = new Map(), pseudo = new Set(), idSpec = [];
    mol.atomes.forEach((a, i) => {
      if (dans.has(i)) {
        const k = dans.get(i);
        if (idSpec[k] == null) { idSpec[k] = res.atomes.push({ el: 'C', etiq: specs[k].texte, aide: specs[k].aide }) - 1; pseudo.add(idSpec[k]); }
        vers.set(i, idSpec[k]);
      } else vers.set(i, res.atomes.push(Object.assign({}, a)) - 1);
    });
    mol.liaisons.forEach(l => {
      const a = vers.get(l.a), b = vers.get(l.b);
      if (a !== b) res.liaisons.push({ a, b, o: l.o });
    });
    return { mol: res, vers, pseudo };
  }
  // explications des étiquettes condensées (bulles d'aide)
  const AIDES_CONDENSEES = {
    C2H5: 'C₂H₅ est l\'écriture abrégée de –CH₂–CH₃ : 2 C et 5 H, un groupe éthyle.',
    C3H7: 'C₃H₇ est l\'écriture abrégée de –CH₂–CH₂–CH₃ : 3 C et 7 H, un groupe propyle.',
    '(CH2)5': '(CH₂)₅ : cinq groupes –CH₂– à la suite, –CH₂–CH₂–CH₂–CH₂–CH₂–.',
    '(CH2)2': '(CH₂)₂ : deux groupes –CH₂– à la suite, –CH₂–CH₂–.',
    '(CH2)3': '(CH₂)₃ : trois groupes –CH₂– à la suite, –CH₂–CH₂–CH₂–.',
    '(CH2)4': '(CH₂)₄ : quatre groupes –CH₂– à la suite, –CH₂–CH₂–CH₂–CH₂–.',
    C6H5: 'C₆H₅ : un cycle de 6 C (cycle benzénique) qui porte 5 H ; il est lié à la molécule par son 6e C.',
    'C(CH3)2': 'C(CH₃)₂ : un C qui porte deux groupes –CH₃ (les parenthèses : ce qui est accroché sur le C).',
    'CH(CH3)2': 'CH(CH₃)₂ : un C qui porte un H et deux groupes –CH₃.',
    '(CH3)2': '(CH₃)₂ : deux groupes –CH₃ accrochés sur l\'atome écrit juste avant.',
  };

  const ORGA = racine.ORGA || {};
  Object.assign(ORGA, {
    VALENCE, HALOGENES, FAMILLES,
    lire, ecrire, copier, valence, adjacence, somme, nbH,
    formuleBrute, etiquetteH, meme, cycles, benzene, groupes,
    cheminsLesPlusLongs, composantes, extraire,
    diagLiaison, diagNouvel, diagH, CE,
    RACINES, MULT, HALO_NOM, SUFFIXE, sansAccent, ordreAlpha,
    nommer, evaluerChaine, evaluerDepart, analyserNom, construireNom, lireNom, diagnostiquerNom, diagFormat, normaliserSaisie,
    fabriqueAlcane, fabriqueFamille, condenser, AIDES_CONDENSEES,
  });
  racine.ORGA = ORGA;
  if (typeof module !== 'undefined' && module.exports) module.exports = ORGA;
})(typeof window !== 'undefined' ? window : globalThis);
