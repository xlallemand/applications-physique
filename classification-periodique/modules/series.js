/* ============================================================
   Module 3 : défis (série notée sur 20)
   CP.questionsDefis() → 10 questions tirées au hasard, mélange des quatre sortes :
     placer un élément d'après sa configuration (ligne et colonne, puis l'élément, classification fournie) ;
     prévoir l'ion d'un élément d'une colonne donnée (formule, puis nom des ions à connaître) ;
     prévoir le nombre de liaisons et de doublets non liants ;
     reconnaître une famille (liste de configurations, propriétés communes, gaz nobles).
   Chaque question est une fabrique : nouvel élément, nouveaux distracteurs à chaque appel.
   Diagnostics : ceux du module 2 (CP.diagLigne, CP.diagColonne, CP.diagIon).
   ============================================================ */
(function () {
  'use strict';

  const MOINS = '−';
  const pl = (k, mot) => `${k} ${mot}${k > 1 ? 's' : ''}`;
  const sym = Z => ATOME.element(Z).sym;
  const conf = (Z, o) => `<span class="cp-donnee">${ATOME.configHTML(Z, o)}</span>`;
  const le = Z => { const n = ATOME.element(Z).nom; return /^[aeéèêiouyh]/i.test(n) ? 'l\'' + n : 'le ' + n; };

  /* ============================================================
     1. PLACER UN ÉLÉMENT D'APRÈS SA CONFIGURATION
     ============================================================ */
  // classification fournie (Z = 1 à 20, symboles seuls), avec les numéros de lignes et de colonnes
  function classifHTML() {
    let h = '<div class="cp-classif" role="img" aria-label="Classification périodique des éléments de Z = 1 à 20">';
    h += '<span></span>' + CP.COLS.map(c => `<span class="cp-classif-num">${c}</span>`).join('');
    for (let l = 1; l <= 4; l++) {
      h += `<span class="cp-classif-num">${l}</span>`;
      CP.COLS.forEach(c => { const z = CP.aLaPlace(l, c); h += z ? `<span class="cp-classif-c">${sym(z)}</span>` : '<span></span>'; });
    }
    return h + '</div>';
  }
  function qPlacer(Z) {
    const p = CP.position(Z), v = CP.valenceCase(Z), e = ATOME.element(Z);
    const voisins = CP.melanger([Z - 1, Z + 1, Z - 8, Z + 8, Z + 2].filter(z => z >= 1 && z <= 18 && z !== Z && z !== 2)).slice(0, 3);
    return {
      theme: 'Placer un élément',
      consigne: 'Trouve la place de cet élément dans le tableau, puis, avec la classification, de quel élément il s\'agit.',
      enonce: `<p>Configuration électronique d'un atome : ${conf(Z)}</p>${classifHTML()}`,
      parties: [
        { type: 'champs', q: 'Dans quelle ligne et dans quelle colonne du tableau est-il ?', ligne: true,
          champs: [{ id: 'l', label: 'Ligne', bonne: p.ligne }, { id: 'c', label: 'Colonne', bonne: p.col }],
          verifier(vals) {
            const faux = [];
            if (vals.l !== p.ligne) faux.push('l');
            if (vals.c !== p.col) faux.push('c');
            if (!faux.length) return { ok: true };
            if (vals.l !== p.ligne) return { diag: CP.diagLigne(Z, vals.l), faux };
            return { diag: CP.diagColonne(Z, vals.c), faux };
          },
          solution: `Couche externe n = ${p.ligne} → <b>ligne ${p.ligne}</b> ; ${pl(v, 'électron')} de valence (${ATOME.configHTML(Z, { entourer: true })}) → <b>colonne ${p.col}</b>${p.col > 2 ? ` (${v} + 10)` : ''}.` },
        { type: 'choix', q: 'Quel est l\'élément qui a cette configuration électronique ?', grand: true,
          options: [Z].concat(voisins).map(z => ({ id: z, label: sym(z) })), bonne: Z,
          indices: Object.fromEntries(voisins.map(z => {
            const q = CP.position(z);
            return [z, `${sym(z)} est dans la ligne ${q.ligne}, colonne ${q.col}. Cet atome est dans la ligne ${p.ligne}, colonne ${p.col} : lis la case à cette place dans la classification.`];
          })),
          solution: `Ligne ${p.ligne}, colonne ${p.col} de la classification : c'est ${le(Z)}, <b>${e.sym}</b>.` },
      ],
      bilan: `${e.sym} : ligne ${p.ligne}, colonne ${p.col}.`,
    };
  }

  /* ============================================================
     2. PRÉVOIR L'ION D'UN ÉLÉMENT D'UNE COLONNE DONNÉE
     ============================================================ */
  const ION_POOL = [1, 3, 11, 19, 4, 12, 20, 13, 8, 16, 9, 17];
  function choixFormules(s, q, autres) {
    const qs = [q, -q].concat(autres);
    const u = qs.filter((x, k) => x && qs.indexOf(x) === k);
    let k = q;
    while (u.length < 4) { k += q > 0 ? 1 : -1; if (u.indexOf(k) < 0) u.push(k); }
    return u.slice(0, 4).map(x => ({ id: x, label: ATOME.formuleIon(s, x) }));
  }
  // noms proposés pour un ion à connaître : erreurs classiques (atome, autre ion, terminaison)
  function nomsIons(Z) {
    const e = ATOME.element(Z), q = Z === 1 ? 1 : CP.ion(Z).q, bon = CP.nomIon(Z);
    const qDe = z => (z === 1 ? 1 : CP.ion(z).q);
    const memeSigne = [1, 11, 19, 20, 12, 9, 17].filter(z => z !== Z && (qDe(z) > 0) === (q > 0));
    const autres = CP.tirer(memeSigne, q > 0 ? 2 : 1);
    const opts = [{ id: 'bon', label: bon }, { id: 'atome', label: `atome ${/^[aeéèêiouyh]/i.test(e.nom) ? 'd\'' + e.nom : 'de ' + e.nom}` }];
    const ind = { atome: `Ce n'est plus un atome : il a ${q > 0 ? 'perdu' : 'gagné'} des électrons, c'est un ion.` };
    autres.forEach((z, k) => { opts.push({ id: 'autre' + k, label: CP.nomIon(z) }); ind['autre' + k] = `L'${CP.nomIon(z)} est ${ATOME.formuleIon(sym(z), qDe(z))}.`; });
    if (q < 0) { opts.push({ id: 'sans', label: `ion ${e.nom}` }); ind.sans = `Le nom d'un ion négatif formé d'un seul atome se termine en « ure » : ${bon}.`; }
    return { opts, ind, bon };
  }
  function qIon(Z) {
    const e = ATOME.element(Z), p = CP.position(Z), i = CP.ion(Z), v = CP.valenceCase(Z);
    const parties = [];
    if (Z === 1) {
      parties.push({ type: 'choix', q: 'Quelle est la formule de l\'ion qu\'il forme ?', grand: true,
        options: [{ id: 1, label: 'H<sup>+</sup>' }, { id: -1, label: `H<sup>${MOINS}</sup>` }, { id: 2, label: 'H<sup>2+</sup>' }, { id: 0, label: 'H (pas d\'ion)' }], bonne: 1,
        indices: { '-1': 'En comptant les cases, on trouverait H<sup>−</sup>, mais l\'hydrogène est un cas à part : il perd son unique électron.', 2: 'H n\'a qu\'un seul électron : il ne peut en perdre qu\'un.', 0: 'L\'hydrogène forme un ion à connaître, en perdant son unique électron.' },
        solution: 'Cas à part : H perd son unique électron et forme l\'ion <b>H<sup>+</sup></b>.' });
    } else {
      const autres = [i.sens === 'droite' ? v : -(8 - v), i.q > 0 ? i.q + 1 : i.q - 1];
      parties.push({ type: 'choix', q: 'Quelle est la formule de l\'ion qu\'il forme ?', grand: true,
        options: choixFormules(e.sym, i.q, autres), bonne: i.q,
        indices: Object.fromEntries([-i.q].concat(autres, [i.q + 1, i.q - 1, i.q + 2, i.q - 2]).map(q => [q, CP.diagIon(Z, q)])),
        solution: `${pl(i.n, 'case')} vers la ${i.sens} jusqu'à la dernière colonne : ${e.sym} ${i.sens === 'droite' ? 'gagne' : 'perd'} ${pl(i.n, 'électron')} → <b>${ATOME.formuleIon(e.sym, i.q)}</b>.` });
    }
    if (CP.ionAConnaitre(Z)) {
      const n = nomsIons(Z);
      parties.push({ type: 'choix', q: `Quel est le nom de l'ion ${ATOME.formuleIon(e.sym, Z === 1 ? 1 : i.q)} ?`, colonne: true,
        options: n.opts, bonne: 'bon', indices: n.ind, solution: `${ATOME.formuleIon(e.sym, Z === 1 ? 1 : i.q)} : <b>${n.bon}</b> (à connaître).` });
    }
    return {
      theme: 'Prévoir un ion',
      consigne: 'Utilise le tableau : compte les cases jusqu\'à la dernière colonne.',
      enonce: `<p>${CP.nom(Z)} (${e.sym}) : ligne ${p.ligne}, <b>colonne ${p.col}</b> du tableau.</p>`,
      parties,
      bilan: Z === 1 ? 'H forme l\'ion H<sup>+</sup> (cas à part).' : `${e.sym} forme l'ion ${ATOME.formuleIon(e.sym, i.q)}.`,
    };
  }
  // élément inconnu X d'une colonne donnée
  function qIonX() {
    const col = CP.hasard([1, 2, 13, 16, 17]), v = col <= 2 ? col : col - 10;
    const q = v <= 3 ? v : -(8 - v), n = Math.abs(q), sens = q > 0 ? 'gauche' : 'droite';
    const autres = [q > 0 ? -(8 - v) : v, q > 0 ? q + 1 : q - 1];
    const ind = {};
    ind[-q] = sens === 'droite' ? 'Vers la droite, l\'atome gagne des électrons : la charge est négative.' : 'Vers la gauche, l\'atome perd des électrons : la charge est positive.';
    ind[autres[0]] = q > 0 ? `Vers la droite, il faudrait gagner ${8 - v} électrons ; vers la gauche, ${pl(n, 'case')} suffi${n > 1 ? 'sent' : 't'}.` : `X a ${v} électrons de valence, mais il est plus simple d'en gagner ${n} que d'en perdre ${v}.`;
    ind[autres[1]] = `Compte les cases jusqu'à la dernière colonne : ${pl(n, 'case')} vers la ${sens}.`;
    for (let k = -4; k <= 4; k++) if (k && k !== q && !ind[k]) ind[k] = `Compte les cases jusqu'à la dernière colonne : ${pl(n, 'case')} vers la ${sens}.`;
    return {
      theme: 'Prévoir un ion',
      consigne: 'Utilise le tableau : compte les cases jusqu\'à la dernière colonne.',
      enonce: `<p>Un élément inconnu X est dans la <b>colonne ${col}</b> du tableau.</p>`,
      parties: [{ type: 'choix', q: 'Quelle est la formule de l\'ion qu\'il forme ?', grand: true,
        options: choixFormules('X', q, autres), bonne: q, indices: ind,
        solution: `Colonne ${col} : ${pl(v, 'électron')} de valence ; ${pl(n, 'case')} vers la ${sens} jusqu'à la dernière colonne → <b>${ATOME.formuleIon('X', q)}</b>.` }],
      bilan: `Colonne ${col} → ion ${ATOME.formuleIon('X', q)}.`,
    };
  }

  /* ============================================================
     3. PRÉVOIR LE NOMBRE DE LIAISONS ET DE DOUBLETS NON LIANTS
     ============================================================ */
  const LIAISONS_POOL = [1, 6, 7, 8, 9, 14, 15, 16, 17];
  function qLiaisons(Z) {
    const e = ATOME.element(Z), l = CP.liaisons(Z), v = l.valence, g = l.gagner, reste = v - g, gaz = ATOME.element(l.gaz);
    return {
      theme: 'Prévoir le nombre de liaisons',
      consigne: 'Chaque atome forme autant de liaisons que le nombre d\'électrons qu\'il doit gagner pour avoir la configuration d\'un gaz noble.',
      enonce: `<p>Atome ${CP.de(Z)} (${e.sym}) : ${conf(Z, { entourer: true })}</p>`,
      parties: [
        { type: 'nombre', entier: true, q: 'Combien d\'électrons doit-il gagner pour avoir la configuration d\'un gaz noble ?', label: 'Électrons à gagner :',
          verifier(x) {
            if (x === g) return { ok: true };
            if (x === v) return { diag: Z === 1 ? 'C\'est son nombre d\'électrons de valence. H suit la règle du duet : il lui en faut 2, comme He.' : `C'est son nombre d'électrons de valence. Il lui en manque 8 ${MOINS} ${v} pour en avoir 8 sur sa couche externe (règle de l'octet).` };
            if (Z === 1 && x === 7) return { diag: 'L\'hydrogène suit la règle du duet : 2 électrons sur sa couche externe, comme He.' };
            return { diag: `Il a ${pl(v, 'électron')} de valence ; il en faut ${Z === 1 ? '2 (règle du duet, comme He)' : '8 (règle de l\'octet)'}.` };
          },
          remplir: inp => { inp.value = String(g); },
          solution: `${pl(v, 'électron')} de valence ; ${Z === 1 ? 'règle du duet (2 électrons, comme He)' : `règle de l'octet (8 électrons, comme ${gaz.sym})`} : il doit en gagner <b>${g}</b>.` },
        { type: 'champs', q: 'Combien de liaisons forme-t-il, et combien de doublets non liants a-t-il ?', ligne: true,
          champs: [{ id: 'l', label: 'Liaisons', bonne: l.liaisons }, { id: 'd', label: 'Doublets non liants', bonne: l.doublets }],
          verifier(vals) {
            const faux = [];
            if (vals.l !== l.liaisons) faux.push('l');
            if (vals.d !== l.doublets) faux.push('d');
            if (!faux.length) return { ok: true };
            if (vals.l !== l.liaisons) {
              if (vals.l === v) return { diag: `Le nombre de liaisons n'est pas le nombre d'électrons de valence : chaque liaison lui fait gagner un électron, il en forme autant que d'électrons à gagner (${g}).`, faux };
              return { diag: `Chaque liaison covalente lui fait gagner un électron : autant de liaisons que d'électrons à gagner (${g}).`, faux };
            }
            if (reste && vals.d === reste) return { diag: `Il reste ${pl(reste, 'électron')} de valence : ils se regroupent par deux, soit ${l.doublets} doublet${l.doublets > 1 ? 's' : ''}.`, faux };
            if (vals.d * 2 === v && v !== reste) return { diag: `Les électrons des liaisons ne comptent pas : il reste ${v} ${MOINS} ${g} = ${pl(reste, 'électron')} → ${l.doublets} doublet${l.doublets > 1 ? 's' : ''} non liant${l.doublets > 1 ? 's' : ''}.`, faux };
            return { diag: `Il reste ${v} ${MOINS} ${g} = ${pl(reste, 'électron')} de valence, regroupés par deux.`, faux };
          },
          solution: `<span class="cp-sol-at">${CP.atomeLiaisons(e.sym, l.liaisons, l.doublets)}<span><b>${pl(l.liaisons, 'liaison')}</b> ; il reste ${v} ${MOINS} ${g} = ${pl(reste, 'électron')} → <b>${CP.doublets(l.doublets)}</b>.</span></span>${CP.revois(['lewis'])}` },
      ],
      bilan: `${e.sym} : ${pl(l.liaisons, 'liaison')}, ${CP.doublets(l.doublets)}.`,
    };
  }

  /* ============================================================
     4. RECONNAÎTRE UNE FAMILLE
     ============================================================ */
  const LETTRES = 'abcdefgh';
  // liste de configurations étiquetées a, b, c…
  const listeHTML = l => `<div class="cp-liste">${l.map((z, k) => `<span><b>${LETTRES[k]}</b> : ${ATOME.configHTML(z)}</span>`).join('')}</div>`;
  const lettre = (l, z) => LETTRES[l.indexOf(z)];
  // même colonne (famille) et même ligne (période)
  function qFamilleListe() {
    const X = CP.hasard([3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18]);
    const p = CP.position(X), Y = p.ligne === 2 ? X + 8 : X - 8;
    const R = CP.hasard([3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18].filter(z => z !== X && CP.position(z).ligne === p.ligne));
    const R2 = CP.hasard([3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18].filter(z => z !== X && z !== R && CP.position(z).ligne === CP.position(Y).ligne && z !== Y));
    const liste = CP.melanger([X, Y, R, R2, 1].filter((z, k, t) => t.indexOf(z) === k));
    const L = z => lettre(liste, z), vX = CP.valenceCase(X);
    const opts = liste.filter(z => z !== X).map(z => ({ id: z, label: `<b>${L(z)}</b> : ${ATOME.configHTML(z)}` }));
    const indFam = {}, indPer = {};
    liste.forEach(z => {
      if (z === X) return;
      const q = CP.position(z), vz = CP.valenceCase(z);
      if (z === 1) indFam[z] = `H est dans la colonne 1, mais l'hydrogène n'est d'aucune famille étudiée ici, et ${L(X)} a ${pl(vX, 'électron')} de valence.`;
      else if (q.ligne === p.ligne) indFam[z] = `${L(z)} et ${L(X)} ont la même couche externe (n = ${p.ligne}) : même ligne, pas même famille.`;
      else indFam[z] = `${L(z)} a ${pl(vz, 'électron')} de valence, ${L(X)} en a ${vX} : pas la même colonne.`;
      if (q.col === p.col && z !== 1) indPer[z] = `${L(z)} et ${L(X)} ont le même nombre d'électrons de valence : même colonne (même famille), pas même ligne.`;
      else indPer[z] = `La couche externe de ${L(z)} est n = ${q.ligne}, celle de ${L(X)} est n = ${p.ligne} : pas la même ligne.`;
    });
    return {
      theme: 'Reconnaître une famille',
      consigne: 'Voici les configurations électroniques de quelques atomes.',
      enonce: listeHTML(liste),
      parties: [
        { type: 'choix', q: `Quel atome appartient à la même famille que l'atome <b>${L(X)}</b> ?`, colonne: true, options: opts, bonne: Y, indices: indFam,
          solution: `${L(X)} et ${L(Y)} ont ${pl(vX, 'électron')} de valence : même colonne, donc même famille (propriétés chimiques communes).` },
        { type: 'choix', q: `Quel atome appartient à la même période (ligne) que l'atome <b>${L(X)}</b> ?`, colonne: true, options: opts, bonne: R, indices: indPer,
          solution: `${L(X)} et ${L(R)} ont la même couche externe (n = ${p.ligne}) : même ligne.` },
      ],
      bilan: 'Même colonne : même famille ; même ligne : même couche externe.',
    };
  }
  // les halogènes, puis le nom de la famille de la dernière colonne
  function qHalogenes() {
    const H = CP.hasard([9, 17]), G = CP.hasard([10, 18]), A = CP.hasard([3, 11]), O = CP.hasard([8, 16]);
    const liste = CP.melanger([H, G, A, O]);
    const L = z => lettre(liste, z);
    return {
      theme: 'Reconnaître une famille',
      consigne: 'Voici les configurations électroniques de quelques atomes.',
      enonce: listeHTML(liste),
      parties: [
        { type: 'choix', q: 'Lequel est un halogène (avant-dernière colonne) ?', colonne: true,
          options: liste.map(z => ({ id: z, label: `<b>${L(z)}</b> : ${ATOME.configHTML(z)}` })), bonne: H,
          indices: { [G]: `${L(G)} a 8 électrons de valence : il est dans la dernière colonne (gaz noble). Les halogènes en ont 7.`,
            [A]: `${L(A)} a 1 électron de valence : colonne 1. Les halogènes sont dans l'avant-dernière colonne, avec 7 électrons de valence.`,
            [O]: `${L(O)} a 6 électrons de valence : colonne 16. Les halogènes en ont 7 (colonne 17).` },
          solution: `${L(H)} a 7 électrons de valence : colonne 17, c'est un <b>halogène</b> (${sym(H)}).` },
        { type: 'choix', q: `Quel est le nom de la famille de l'atome <b>${L(G)}</b> (dernière colonne) ?`,
          options: [{ id: 'g', label: 'les gaz nobles' }, { id: 'h', label: 'les halogènes' }, { id: 'a', label: 'les alcalins' }, { id: 'm', label: 'les métaux' }], bonne: 'g',
          indices: { h: 'Les halogènes sont dans l\'avant-dernière colonne (colonne 17).', a: 'Les alcalins sont dans la colonne 1.', m: 'La dernière colonne est une famille d\'éléments très stables, qui ne réagissent pas.' },
          solution: 'Colonne 18 : la famille des <b>gaz nobles</b> (He, Ne, Ar), très stables.' },
      ],
      bilan: 'Halogènes : colonne 17 ; gaz nobles : colonne 18.',
    };
  }
  // propriétés chimiques communes
  function qProprietes() {
    const [X, Y] = CP.hasard([[4, 12], [3, 11], [8, 16], [9, 17], [7, 15], [6, 14], [11, 19]]);
    const cfg = z => (z <= 18 ? ` (${ATOME.configHTML(z)})` : '');
    const vX = CP.valenceCase(X);
    return {
      theme: 'Reconnaître une famille',
      consigne: 'Utilise la position des éléments dans le tableau.',
      enonce: `<p><b>${sym(X)}</b>${cfg(X)} et <b>${sym(Y)}</b>${cfg(Y)} sont dans la même colonne du tableau.</p>`,
      parties: [
        { type: 'choix', q: 'Que peut-on dire de leurs propriétés chimiques ?', colonne: true,
          options: [{ id: 'ok', label: 'Elles sont similaires : ils ont le même nombre d\'électrons de valence.' },
            { id: 'nb', label: 'Elles sont différentes : ils n\'ont pas le même nombre d\'électrons.' },
            { id: 'couche', label: 'Elles sont similaires : ils ont la même couche externe.' },
            { id: 'rien', label: 'On ne peut rien dire sans faire d\'expérience.' }], bonne: 'ok',
          indices: { nb: 'Ce qui compte pour les propriétés chimiques, ce sont les électrons de valence, pas le nombre total d\'électrons.',
            couche: `Même couche externe = même ligne. ${sym(X)} et ${sym(Y)} sont dans la même colonne : même nombre d'électrons de valence.`,
            rien: 'La position dans le tableau suffit : une même colonne donne le même nombre d\'électrons de valence.' },
          solution: `${sym(X)} et ${sym(Y)} ont ${pl(vX, 'électron')} de valence : même famille, <b>propriétés chimiques similaires</b>.` },
      ],
      bilan: 'Même colonne : même nombre d\'électrons de valence, donc propriétés chimiques similaires.',
    };
  }

  /* ---------- Série : 10 questions, mélange des quatre sortes ---------- */
  function questionsDefis() {
    const placer = CP.tirer([1, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18], 3).map(qPlacer);
    const z3 = CP.tirer(ION_POOL, 3);
    const ions = z3.slice(0, 2).map(qIon).concat([Math.random() < 0.5 ? qIonX() : qIon(z3[2])]);
    const liaisons = CP.tirer(LIAISONS_POOL, 2).map(qLiaisons);
    const famille = CP.tirer([qFamilleListe, qHalogenes, qProprietes], 2).map(f => f());
    return CP.melanger(placer.concat(ions, liaisons, famille));
  }

  Object.assign(CP, { questionsDefis, qPlacer, qIon, qIonX, qLiaisons, qFamilleListe, qHalogenes, qProprietes });
})();
