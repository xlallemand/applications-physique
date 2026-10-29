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
    const besoin = faut ? `il lui faut ${faut} H (${v} liaisons en tout)` : `il ne lui faut aucun H (il a déjà ses ${v} liaisons)`;
    if (h == null) return `${cap(CE(el))} n'a pas encore ses H : il a ${liaisonsTxt(s)}, ${besoin}.`;
    return `${cap(CE(el))} a ${liaisonsTxt(s)} : ${besoin}.`;
  }

  const ORGA = racine.ORGA || {};
  Object.assign(ORGA, {
    VALENCE, HALOGENES, FAMILLES,
    lire, ecrire, copier, valence, adjacence, somme, nbH,
    formuleBrute, etiquetteH, meme, cycles, benzene, groupes,
    cheminsLesPlusLongs, composantes, extraire,
    diagLiaison, diagNouvel, diagH, CE,
  });
  racine.ORGA = ORGA;
  if (typeof module !== 'undefined' && module.exports) module.exports = ORGA;
})(typeof window !== 'undefined' ? window : globalThis);
