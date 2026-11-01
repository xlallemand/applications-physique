/* ============================================================
   Exercices du module 4 (application « Nomenclature (Structure des
   entités organiques) », 1re spécialité), numérotés de 1 à 5 :
     ex. 1 : reconnaître le groupe caractéristique (7 molécules en
       semi-développée, dont une avec C₂H₅ en abrégé) ;
     ex. 2 : plusieurs groupes : molécules à groupes hydroxyle,
       carbonyle et carboxyle (NOM.PLUSIEURS) ;
     ex. 3 : du nom à la formule semi-développée ;
     ex. 4 : compléter le tableau (formule semi-développée ou nom) ;
     ex. 5 : alcanes cycliques, en semi-développée.

   Chaque exercice : { id, num, groupe, titre, desc, contexte (HTML), parties: () => [p] }
   Chaque partie suit le format de NOM.PARTIES ; p.correction : correction
   détaillée (la molécule dessinée par le moteur, groupe entouré, nom du
   groupe et famille entre parenthèses, nom en couleurs).
   Plusieurs outils à la suite dans une partie : NOM.enchainer.
   Écritures abrégées de l'énoncé (ex. 1) : C₂H₅, expliquée par une bulle ⓘ.
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
    return `<div class="nom-fig">${d}</div>${leg}<p class="nom-mol-n">${r.horsProgramme ? '' : O.nomHTML(r.parties)}</p>`;
  }

  /* ---------- Ex. 1 : reconnaître un groupe caractéristique ---------- */
  const EX1 = [['a', 'CC(C)(O)C(C)CC'], ['b', 'CCC(C)CC=O'], ['c', 'CCC(CC)C(C)C(=O)C(C)C'], ['d', 'CCCC(CC)C(=O)O'],
    ['e', 'CC(C)CCC(C)O'], ['f', 'CC(=O)CC(CC)CC', [{ atomes: [5, 6], texte: 'C2H5' }]], ['g', 'CCCC=O']];
  const ex1 = () => EX1.map(([l, s, cond]) => {
    const m = mol(s), md = cond ? O.condenser(m, cond).mol : m;
    return enchainer(`<p><b>${l}.</b></p>`,
      [O.partieEntourer(m, { condenser: cond, q: 'Entoure le groupe caractéristique, puis valide.' })].concat(O.partiesNommerGroupes(m)),
      corrige(s, 'semi', { condenser: cond }));
  });

  /* ---------- Ex. 2 : entourer et nommer tous les groupes, donner les familles ---------- */
  const EX2 = [['a', 'lactique'], ['b', 'malique'], ['c', 'pyruvique'], ['d', 'glyceraldehyde'], ['e', 'acetoine']];
  const ex2 = () => EX2.map(([l, k]) => {
    const x = PLUSIEURS[k];
    return enchainer(`<p><b>${l}. ${x.titre}</b></p>`, partiesPlusieurs(x), O.corrigeGroupes(mol(x.s), { condenser: x.condenser }));
  });

  /* ---------- Ex. 3 : du nom à la formule semi-développée ---------- */
  const EX3 = [['a', 'CCC(C)CO', '2-méthylbutan-1-ol'], ['b', 'CCC(CC)CC=O', '3-éthylpentanal'], ['c', 'CCC(C)C(C)=O', '3-méthylpentan-2-one'],
    ['d', 'CC(C)CC(=O)O', 'acide 3-méthylbutanoïque']];
  const ex3 = () => EX3.map(([l, s, nom]) => Object.assign(
    O.partieDessin(mol(s), { ecriture: 'semi', nom, q: `<b>${l}.</b> ${nom}` }), { correction: corrige(s, 'semi', { groupes: false }) }));

  /* ---------- Ex. 4 : compléter le tableau (pour chaque ligne, la case vide) ---------- */
  // [n° de la ligne, SMILES, case donnée ('semi' ou 'nom')]
  const EX4 = [[1, 'CC(C)C(C)C(C)(C)C', 'semi'], [2, 'CCCC(CC)C(C)C', 'nom'], [3, 'CCC(C)(O)C(C)C', 'semi'], [4, 'CCCC(C)C(=O)O', 'nom'],
    [5, 'O=CC(CC)CC', 'semi'], [6, 'CCC(C)C(C)=O', 'nom'], [7, 'CC(O)CC(C)C', 'semi'], [8, 'CCCC(CCC)C(C)=O', 'semi']];
  const CASES = { semi: 'formule semi-développée', nom: 'nom' };
  function ligneTableau([n, s, donnee]) {
    const m = mol(s), r = O.nommer(m);
    const donne = donnee === 'nom' ? `<p class="nom-mol-n"><b>${r.nom}</b></p>` : dessin(s, { ecriture: 'semi', label: 'formule semi-développée donnée' });
    const etape = donnee === 'nom' ? O.partieDessin(m, { ecriture: 'semi', q: 'Formule semi-développée :' }) : partieNom(m, { ecriture: 'semi', q: 'Nom :' });
    return enchainer(`<p><b>Ligne ${n}</b> : ${CASES[donnee]} donnée.</p>${donne}`, [etape],
      `<div class="nom-mols">${O.dessinHTML(m, { ecriture: 'semi', couleurs: r.couleurs, numeros: r.numeros })}</div><p class="nom-mol-n">${O.nomHTML(r.parties)}</p>`);
  }
  const ex4 = () => EX4.map(ligneTableau);

  /* ---------- Ex. 5 : alcanes cycliques ---------- */
  const EX5 = [['a', 'C1CCCC1'], ['b', 'CCC1CCCCC1'], ['c', 'CCC1CCCC(CC)C1'], ['d', 'CCC1CCCC(C)C1']];
  const ex5 = () => EX5.map(([l, s]) => Object.assign(partieNom(mol(s), { ecriture: 'semi', q: `<b>${l}.</b> Nomme cette molécule.` }), { correction: corrige(s, 'semi', { groupes: false }) }));

  const CTX = (titre, txt) => `<p class="er-contexte"><b>${titre}</b></p><p class="er-contexte">${txt}</p>`;
  const EXERCICES = [
    { id: '1', num: '1', groupe: 'groupes', titre: 'Exercice 1 : reconnaître un groupe caractéristique', desc: '7 molécules : entourer et nommer le groupe, donner la famille',
      contexte: CTX('Exercice 1 : reconnaître un groupe caractéristique.', 'Pour chaque molécule, entourer et nommer le groupe caractéristique. Associer à chaque groupe caractéristique la classe fonctionnelle correspondante. C₂H₅ est une écriture abrégée : touche ⓘ sous la formule.'),
      parties: ex1 },
    { id: '2', num: '2', groupe: 'groupes', titre: 'Exercice 2 : plusieurs groupes caractéristiques', desc: 'Acides lactique, malique et pyruvique, glycéraldéhyde, acétoïne : tous les groupes',
      contexte: CTX('Exercice 2 : plusieurs groupes caractéristiques.', 'Pour chacune des molécules suivantes, entourer et nommer les groupes caractéristiques. Associer à chaque groupe caractéristique la classe fonctionnelle correspondante.'),
      parties: ex2 },
    { id: '3', num: '3', groupe: 'noms', titre: 'Exercice 3 : écrire une formule semi-développée à partir d\'un nom', desc: '4 noms : dessiner la formule semi-développée',
      contexte: CTX('Exercice 3 : écrire une formule semi-développée à partir d\'un nom.', 'Écrire les formules semi-développées des molécules suivantes. Le nom de ce que tu dessines s\'affiche en direct.'),
      parties: ex3 },
    { id: '4', num: '4', groupe: 'noms', titre: 'Exercice 4 : compléter le tableau', desc: '8 lignes : la formule semi-développée ou le nom',
      contexte: CTX('Exercice 4 : compléter le tableau.', 'Chaque ligne donne une case : la formule semi-développée ou le nom. Complète l\'autre.'), parties: ex4 },
    { id: '5', num: '5', groupe: 'noms', titre: 'Exercice 5 : alcanes cycliques', desc: 'Nommer quatre alcanes cycliques',
      contexte: CTX('Exercice 5 : alcanes cycliques.', 'Nommer les molécules suivantes.'), parties: ex5 },
  ];
  const GROUPES_EX = [
    { id: 'groupes', titre: 'Reconnaître les groupes caractéristiques' },
    { id: 'noms', titre: 'Nommer et dessiner' },
  ];
  window.NOM.EXERCICES = EXERCICES;
  window.NOM.GROUPES_EX = GROUPES_EX;
})();
