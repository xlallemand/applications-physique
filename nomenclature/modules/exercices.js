/* ============================================================
   Exercices du module 4 (application « Nomenclature ») :
   ceux de la feuille, dans le même ordre et avec la même numérotation,
   « Exercices 2 à 10 » (sans 1 : exercices en ligne, remplacés par les
   séries ; sans 8 : isomères, hors de cette application ; le 4 est fait
   avec le 2 et le 3).

   Chaque exercice : { id, num, groupe, titre, desc, contexte (HTML), parties: () => [p] }
   Chaque partie suit le format de NOM.PARTIES ; p.correction : correction
   détaillée (la molécule dessinée par le moteur, groupe entouré, nom du
   groupe et famille entre parenthèses, nom en couleurs).
   Une partie par lettre (ex. 2, 3, 5, 6, 7, 10) ou par ligne du tableau
   (ex. 9) ; plusieurs outils à la suite dans une partie : NOM.enchainer.

   Données vérifiées par un script (noms et SMILES du prompt, ORGA.nommer).
   Écarts avec la feuille (voir le prompt) :
     ex. 7a : « 5-méthylhex-3-ène » sur la feuille ; la double liaison a le
       n° 3 dans les deux sens, le méthyl doit avoir le plus petit numéro :
       2-méthylhex-3-ène ;
     tirets : 6h N-éthylbutan-1-amine, 6j N-méthyléthanamide,
       7g N-éthyl-N-méthylpropan-2-amine ;
     ex. 9.18 : le nom de la feuille (N-éthyl-N-méthyl-4-méthylpentanamide) est
       écrit dans l'énoncé ; le moteur écrit N-éthyl-N,4-diméthylpentanamide ;
       les deux sont acceptés, la correction explique le regroupement (même règle pour 2i).
   Écritures abrégées de l'énoncé (ex. 3 et 5) : C₂H₅, C(CH₃)₂, (CH₂)₅, C₆H₅,
   expliquées par une bulle ⓘ.
   ============================================================ */
(function () {
  'use strict';

  const { mol, dessin, enchainer, partieNom, PLUSIEURS, partiesPlusieurs } = window.NOM;
  const O = window.ORGA;
  const ent = gs => gs.map(g => ({ atomes: g.atomes, avecH: g.avecH }));

  // correction : la molécule (écriture demandée), groupe entouré et légende, nom en couleurs
  function corrige(s, ec, op) {
    op = op || {};
    const m = mol(s), r = O.nommer(m), gs = O.groupes(m);
    const md = op.condenser ? O.condenser(m, op.condenser).mol : m;
    const d = op.condenser ? O.dessinHTML(md, { ecriture: ec, sansAide: true }) : O.dessinHTML(m, { ecriture: ec, couleurs: r.couleurs, numeros: r.numeros, entourer: op.groupes === false ? null : ent(gs) });
    const leg = op.groupes === false || !gs.length ? '' : O.legendeHTML(gs);
    const reg = r.variantes && r.variantes.length ? `<p class="orga-note">On regroupe les méthyl, même si l'un est sur le N et l'autre sur un C : ${O.nomHTML(r.parties)} ; on accepte aussi ${r.variantes[0]}.</p>` : '';
    return `<div class="nom-fig">${d}</div>${leg}<p class="nom-mol-n">${r.horsProgramme ? '' : O.nomHTML(r.parties)}</p>${reg}`;
  }
  // le groupe d'une molécule à un groupe : entourer, puis nommer le groupe et la famille (ex. 4)
  const groupe = (s, ec) => [O.partieEntourer(mol(s), { ecriture: ec, q: 'Ex. 4 : entoure le groupe caractéristique, puis valide.' })].concat(O.partiesNommerGroupes(mol(s)));

  /* ---------- Ex. 2 (+ 4) : topologique → semi-développée, puis le groupe ---------- */
  const EX2 = [['a', 'CC(C)C=CC'], ['b', 'CC(C)(O)C(C)CC'], ['c', 'CCC(C)CC=O'], ['d', 'CCC(CC)C(C)C(=O)C(C)C'], ['e', 'CCCC(CC)C(=O)O'],
    ['f', 'CCC(C)C(=O)OCC'], ['g', 'CCCC(C)NC'], ['h', 'CCCCN(C)CC'], ['i', 'CCCC(C)CC(=O)NC']];
  const ex2 = () => EX2.map(([l, s]) => enchainer(`<p><b>${l}.</b></p>${dessin(s, { ecriture: 'topo', label: 'Formule topologique ' + l })}`,
    [O.partieDessin(mol(s), { ecriture: 'semi', hydrogenes: 'eleve', q: 'Écris la formule semi-développée (avec les H), puis valide.' })].concat(groupe(s, 'semi')),
    corrige(s, 'semi')));

  /* ---------- Ex. 3 (+ 4) : semi-développée (écritures abrégées de l'énoncé) → topologique, puis le groupe ---------- */
  const EX3 = [['a', 'CC=C(C)C', [{ atomes: [2, 3, 4], texte: 'C(CH3)2' }]], ['b', 'CC(C)CCC(C)O'], ['c', 'CC(N)CCC'], ['d', 'CC(=O)CC(CC)CC', [{ atomes: [5, 6], texte: 'C2H5' }]],
    ['e', 'CCCC=O'], ['f', 'CC(NCC)CC', [{ atomes: [3, 4], texte: 'C2H5' }]], ['g', 'CCC(C)C(=O)OCC', [{ atomes: [7, 8], texte: 'C2H5' }]], ['h', 'CCCC(=O)NC']];
  const enonce3 = (s, cond) => `<div class="nom-fig">${O.dessinHTML(cond ? O.condenser(mol(s), cond).mol : mol(s), { ecriture: 'semi', label: 'Formule semi-développée' })}</div>`;
  const ex3 = () => EX3.map(([l, s, cond]) => enchainer(`<p><b>${l}.</b></p>${enonce3(s, cond)}`,
    [O.partieDessin(mol(s), { ecriture: 'topo', q: 'Écris la formule topologique, puis valide.' })].concat(groupe(s, 'topo')),
    corrige(s, 'topo')));

  /* ---------- Ex. 5 : entourer et nommer tous les groupes, donner les familles ---------- */
  const EX5 = [['a', 'glycine'], ['b', 'serine'], ['c', 'asparagine'], ['d', 'pheromone'], ['e', 'cannelle']];
  const ex5 = () => EX5.map(([l, k]) => {
    const x = PLUSIEURS[k];
    return enchainer(`<p><b>${l}. ${x.titre}</b></p>`, partiesPlusieurs(x), O.corrigeGroupes(mol(x.s), { condenser: x.condenser }));
  });

  /* ---------- Ex. 6 et 7 : du nom à la formule ---------- */
  const EX6 = [['a', 'CC=CC(C)C', '4-méthylpent-2-ène'], ['b', 'CCC(C)CO', '2-méthylbutan-1-ol'], ['c', 'CCC(CC)CC=O', '3-éthylpentanal'], ['d', 'CCC(C)C(C)=O', '3-méthylpentan-2-one'],
    ['e', 'CC(C)CC(=O)O', 'acide 3-méthylbutanoïque'], ['f', 'CC(C)C(=O)OCC', 'méthylpropanoate d\'éthyle'], ['g', 'CC(C)N', 'propan-2-amine'], ['h', 'CCCCNCC', 'N-éthylbutan-1-amine'],
    ['i', 'CCC(N)=O', 'propanamide'], ['j', 'CC(=O)NC', 'N-méthyléthanamide']];
  const EX7 = [['a', 'CCC=CC(C)C', '2-méthylhex-3-ène'], ['b', 'CC(O)CC(C)C', '4-méthylpentan-2-ol'], ['c', 'CC(C)C(=O)C(CC)CC', '4-éthyl-2-méthylhexan-3-one'], ['d', 'CCCC(CC)C(=O)O', 'acide 2-éthylpentanoïque'],
    ['e', 'CCC(=O)OC(C)C', 'propanoate de 1-méthyléthyle'], ['f', 'CCC(C)CC(=O)OCC(C)C', '3-méthylpentanoate de 2-méthylpropyle'], ['g', 'CC(C)N(C)CC', 'N-éthyl-N-méthylpropan-2-amine'], ['h', 'CCC(C)CC(=O)NCC', 'N-éthyl-3-méthylpentanamide']];
  const duNom = (liste, ec) => () => liste.map(([l, s, nom]) => Object.assign(
    O.partieDessin(mol(s), { ecriture: ec, nom, q: `<b>${l}.</b> ${nom}` }), { correction: corrige(s, ec, { groupes: false }) }));

  /* ---------- Ex. 9 : compléter le tableau (pour chaque ligne, les deux cases vides) ---------- */
  // [n°, SMILES, case donnée ('semi', 'topo' ou 'nom'), nom écrit sur la feuille]
  const EX9 = [[1, 'C=C(C)CC', 'semi'], [2, 'CC(C)C(C)C(C)(C)C', 'topo'], [3, 'CCCC(CC)C(C)C', 'nom'], [4, 'CCC(C)(O)C(C)C', 'semi'], [5, 'C=C(CC)CC(C)C', 'topo'], [6, 'CCCC(C)C(=O)O', 'nom'],
    [7, 'O=CC(CC)CC', 'semi'], [8, 'CC(N)CC(C)(C)C', 'topo'], [9, 'CCC(C)C(C)=O', 'nom'], [10, 'CC(=O)OCCC(C)C', 'semi'], [11, 'CC(O)CC(C)C', 'topo'], [12, 'CCC(C)C(=O)OC(C)CC', 'nom'],
    [13, 'CCCC(CCC)C(C)=O', 'semi'], [14, 'CC(Cl)C(C)(Br)Br', 'topo'], [15, 'CCC(C)C(C)C(C)N', 'nom'], [16, 'CCN(C)CC', 'semi'], [17, 'CCC(C)C(N)=O', 'topo'], [18, 'CCN(C)C(=O)CCC(C)C', 'nom', 'N-éthyl-N-méthyl-4-méthylpentanamide']];
  const CASES = { semi: 'formule semi-développée', topo: 'formule topologique', nom: 'nom' };
  function ligne9([n, s, donnee, nomFeuille]) {
    const m = mol(s), r = O.nommer(m);
    const donne = donnee === 'nom' ? `<p class="nom-mol-n"><b>${nomFeuille || r.nom}</b></p>` : dessin(s, { ecriture: donnee, label: CASES[donnee] + ' donnée' });
    const etapes = [];
    if (donnee !== 'semi') etapes.push(O.partieDessin(m, { ecriture: 'semi', q: 'Formule semi-développée :' }));
    if (donnee !== 'topo') etapes.push(O.partieDessin(m, { ecriture: 'topo', q: 'Formule topologique :' }));
    if (donnee !== 'nom') etapes.push(partieNom(m, { ecriture: donnee, q: 'Nom :' }));
    return enchainer(`<p><b>Ligne ${n}</b> : ${CASES[donnee]} donnée.</p>${donne}`, etapes,
      `<div class="nom-mols">${O.dessinHTML(m, { ecriture: 'semi', couleurs: r.couleurs, numeros: r.numeros })}${O.dessinHTML(m, { ecriture: 'topo', couleurs: r.couleurs, numeros: r.numeros })}</div><p class="nom-mol-n">${O.nomHTML(r.parties)}</p>${r.variantes.length ? `<p class="orga-note">On regroupe les deux méthyl (l'un sur le N, l'autre sur le C n° 4) : N,4-diméthyl ; le nom de la feuille, ${r.variantes[0]}, est accepté aussi.</p>` : ''}`);
  }
  const ex9 = (de, a) => () => EX9.slice(de - 1, a).map(ligne9);

  /* ---------- Ex. 10 : alcanes cycliques ---------- */
  const EX10 = [['a', 'C1CCCC1', 'semi'], ['b', 'CCC1CCCCC1', 'topo'], ['c', 'CCC1CCCC(CC)C1', 'topo'], ['d', 'CCC1CCCC(C)C1', 'topo']];
  const ex10 = () => EX10.map(([l, s, ec]) => Object.assign(partieNom(mol(s), { ecriture: ec, q: `<b>${l}.</b> Nomme cette molécule.` }), { correction: corrige(s, ec, { groupes: false }) }));

  const CTX = (titre, txt) => `<p class="er-contexte"><b>${titre}</b></p><p class="er-contexte">${txt}</p>`;
  const EXERCICES = [
    { id: '2', num: '2', groupe: 'ecritures', titre: 'Exercices 2 et 4 : de la topologique à la semi-développée', desc: '9 molécules : formule semi-développée, puis le groupe caractéristique (ex. 4)',
      contexte: CTX('Exercice 2 : passer d\'une formule topologique à une formule semi-développée.', 'Pour chacune des molécules suivantes, écrire la formule semi-développée.') + CTX('Exercice 4 : reconnaître un groupe caractéristique.', 'Pour chaque molécule, entourer et nommer les groupes caractéristiques. Associer à chaque groupe caractéristique la classe fonctionnelle correspondante.'),
      parties: ex2 },
    { id: '3', num: '3', groupe: 'ecritures', titre: 'Exercices 3 et 4 : de la semi-développée à la topologique', desc: '8 molécules : formule topologique, puis le groupe caractéristique (ex. 4)',
      contexte: CTX('Exercice 3 : passer d\'une formule semi-développée à une formule topologique.', 'Pour chacune des molécules suivantes, écrire la formule topologique. C₂H₅ et (CH₃)₂ sont des écritures abrégées : touche ⓘ sous la formule.') + CTX('Exercice 4 : reconnaître un groupe caractéristique.', 'Entourer et nommer les groupes caractéristiques ; associer la classe fonctionnelle.'),
      parties: ex3 },
    { id: '5', num: '5', groupe: 'groupes', titre: 'Exercice 5 : reconnaître un groupe caractéristique', desc: 'Glycine, sérine, asparagine, phéromone, arôme de cannelle : tous les groupes',
      contexte: CTX('Exercice 5 : reconnaître un groupe caractéristique.', 'Pour chacune des molécules suivantes, entourer et nommer les groupes caractéristiques. Associer à chaque groupe caractéristique la classe fonctionnelle correspondante.'),
      parties: ex5 },
    { id: '6', num: '6', groupe: 'noms', titre: 'Exercice 6 : écrire une formule semi-développée à partir d\'un nom', desc: '10 noms : dessiner la formule semi-développée',
      contexte: CTX('Exercice 6 : écrire une formule semi-développée à partir d\'un nom.', 'Écrire les formules semi-développées des molécules suivantes. Le nom de ce que tu dessines s\'affiche en direct.'),
      parties: duNom(EX6, 'semi') },
    { id: '7', num: '7', groupe: 'noms', titre: 'Exercice 7 : écrire une formule topologique à partir d\'un nom', desc: '8 noms : dessiner la formule topologique',
      contexte: CTX('Exercice 7 : écrire une formule topologique à partir d\'un nom.', 'Écrire les formules topologiques des molécules suivantes.'),
      parties: duNom(EX7, 'topo') },
    { id: '9a', num: '9', groupe: 'noms', titre: 'Exercice 9 : compléter le tableau (lignes 1 à 7)', desc: 'Pour chaque ligne, les deux cases vides : semi-développée, topologique ou nom',
      contexte: CTX('Exercice 9 : compléter les tableaux suivants (lignes 1 à 7).', 'Chaque ligne donne une case : formule semi-développée, formule topologique ou nom. Complète les deux autres.'), parties: ex9(1, 7) },
    { id: '9b', num: '9', groupe: 'noms', titre: 'Exercice 9 : compléter le tableau (lignes 8 à 15)', desc: 'Pour chaque ligne, les deux cases vides',
      contexte: CTX('Exercice 9 : compléter les tableaux suivants (lignes 8 à 15).', 'Chaque ligne donne une case : complète les deux autres.'), parties: ex9(8, 15) },
    { id: '9c', num: '9', groupe: 'noms', titre: 'Exercice 9 : compléter le tableau (lignes 16 à 18)', desc: 'Pour chaque ligne, les deux cases vides',
      contexte: CTX('Exercice 9 : compléter les tableaux suivants (lignes 16 à 18).', 'Chaque ligne donne une case : complète les deux autres.'), parties: ex9(16, 18) },
    { id: '10', num: '10', groupe: 'noms', titre: 'Exercice 10 : alcanes cycliques', desc: 'Nommer quatre alcanes cycliques',
      contexte: CTX('Exercice 10 : alcanes cycliques.', 'Nommer les molécules suivantes.'), parties: ex10 },
  ];
  const GROUPES_EX = [
    { id: 'ecritures', titre: 'Changer d\'écriture et reconnaître le groupe' },
    { id: 'groupes', titre: 'Plusieurs groupes caractéristiques' },
    { id: 'noms', titre: 'Nommer et dessiner' },
  ];
  window.NOM.EXERCICES = EXERCICES;
  window.NOM.GROUPES_EX = GROUPES_EX;
})();
