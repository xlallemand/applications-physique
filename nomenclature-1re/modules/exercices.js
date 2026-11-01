/* ============================================================
   Exercices du module 4 (application « Nomenclature (Structure des
   entités organiques) », 1re spécialité) : ceux de la feuille de
   terminale qui sont au programme de 1re, avec la même numérotation
   (numéros des exercices, lettres et lignes du tableau de la feuille) :
     ex. 4 : reconnaître le groupe caractéristique, sur les molécules
       des ex. 2 et 3 qui sont au programme (2 b, c, d, e ; 3 b, d, e),
       données en semi-développée ;
     ex. 5 : plusieurs groupes : molécules à groupes hydroxyle,
       carbonyle et carboxyle (NOM.PLUSIEURS), à la place de celles de
       la feuille (amines, amides, alcènes) ;
     ex. 6 : b, c, d, e (sans a alcène, f ester, g h amines, i j amides) ;
     ex. 9 : lignes 2, 3, 4, 6, 7, 9, 11, 13 ; formule semi-développée
       ou nom (pas de topologique : les lignes 2 et 11 sont données en
       semi-développée) ;
     ex. 10 : alcanes cycliques, en semi-développée.
   Sans 2, 3, 7 (formule topologique : hors programme de 1re) ni 8.

   Chaque exercice : { id, num, groupe, titre, desc, contexte (HTML), parties: () => [p] }
   Chaque partie suit le format de NOM.PARTIES ; p.correction : correction
   détaillée (la molécule dessinée par le moteur, groupe entouré, nom du
   groupe et famille entre parenthèses, nom en couleurs).
   Plusieurs outils à la suite dans une partie : NOM.enchainer.
   Écritures abrégées de l'énoncé (ex. 4) : C₂H₅, expliquée par une bulle ⓘ.
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

  /* ---------- Ex. 4 : reconnaître un groupe caractéristique (molécules des ex. 2 et 3 au programme) ---------- */
  const EX4 = [['2 b', 'CC(C)(O)C(C)CC'], ['2 c', 'CCC(C)CC=O'], ['2 d', 'CCC(CC)C(C)C(=O)C(C)C'], ['2 e', 'CCCC(CC)C(=O)O'],
    ['3 b', 'CC(C)CCC(C)O'], ['3 d', 'CC(=O)CC(CC)CC', [{ atomes: [5, 6], texte: 'C2H5' }]], ['3 e', 'CCCC=O']];
  const ex4 = () => EX4.map(([l, s, cond]) => {
    const m = mol(s), md = cond ? O.condenser(m, cond).mol : m;
    return enchainer(`<p><b>${l}.</b></p>`,
      [O.partieEntourer(m, { condenser: cond, q: 'Entoure le groupe caractéristique, puis valide.' })].concat(O.partiesNommerGroupes(m)),
      corrige(s, 'semi', { condenser: cond }));
  });

  /* ---------- Ex. 5 : entourer et nommer tous les groupes, donner les familles ---------- */
  const EX5 = [['a', 'lactique'], ['b', 'malique'], ['c', 'pyruvique'], ['d', 'glyceraldehyde'], ['e', 'acetoine']];
  const ex5 = () => EX5.map(([l, k]) => {
    const x = PLUSIEURS[k];
    return enchainer(`<p><b>${l}. ${x.titre}</b></p>`, partiesPlusieurs(x), O.corrigeGroupes(mol(x.s), { condenser: x.condenser }));
  });

  /* ---------- Ex. 6 : du nom à la formule semi-développée ---------- */
  const EX6 = [['b', 'CCC(C)CO', '2-méthylbutan-1-ol'], ['c', 'CCC(CC)CC=O', '3-éthylpentanal'], ['d', 'CCC(C)C(C)=O', '3-méthylpentan-2-one'],
    ['e', 'CC(C)CC(=O)O', 'acide 3-méthylbutanoïque']];
  const ex6 = () => EX6.map(([l, s, nom]) => Object.assign(
    O.partieDessin(mol(s), { ecriture: 'semi', nom, q: `<b>${l}.</b> ${nom}` }), { correction: corrige(s, 'semi', { groupes: false }) }));

  /* ---------- Ex. 9 : compléter le tableau (pour chaque ligne, la case vide) ---------- */
  // [n° de la ligne sur la feuille, SMILES, case donnée ('semi' ou 'nom')]
  const EX9 = [[2, 'CC(C)C(C)C(C)(C)C', 'semi'], [3, 'CCCC(CC)C(C)C', 'nom'], [4, 'CCC(C)(O)C(C)C', 'semi'], [6, 'CCCC(C)C(=O)O', 'nom'],
    [7, 'O=CC(CC)CC', 'semi'], [9, 'CCC(C)C(C)=O', 'nom'], [11, 'CC(O)CC(C)C', 'semi'], [13, 'CCCC(CCC)C(C)=O', 'semi']];
  const CASES = { semi: 'formule semi-développée', nom: 'nom' };
  function ligne9([n, s, donnee]) {
    const m = mol(s), r = O.nommer(m);
    const donne = donnee === 'nom' ? `<p class="nom-mol-n"><b>${r.nom}</b></p>` : dessin(s, { ecriture: 'semi', label: 'formule semi-développée donnée' });
    const etape = donnee === 'nom' ? O.partieDessin(m, { ecriture: 'semi', q: 'Formule semi-développée :' }) : partieNom(m, { ecriture: 'semi', q: 'Nom :' });
    return enchainer(`<p><b>Ligne ${n}</b> : ${CASES[donnee]} donnée.</p>${donne}`, [etape],
      `<div class="nom-mols">${O.dessinHTML(m, { ecriture: 'semi', couleurs: r.couleurs, numeros: r.numeros })}</div><p class="nom-mol-n">${O.nomHTML(r.parties)}</p>`);
  }
  const ex9 = () => EX9.map(ligne9);

  /* ---------- Ex. 10 : alcanes cycliques ---------- */
  const EX10 = [['a', 'C1CCCC1'], ['b', 'CCC1CCCCC1'], ['c', 'CCC1CCCC(CC)C1'], ['d', 'CCC1CCCC(C)C1']];
  const ex10 = () => EX10.map(([l, s]) => Object.assign(partieNom(mol(s), { ecriture: 'semi', q: `<b>${l}.</b> Nomme cette molécule.` }), { correction: corrige(s, 'semi', { groupes: false }) }));

  const CTX = (titre, txt) => `<p class="er-contexte"><b>${titre}</b></p><p class="er-contexte">${txt}</p>`;
  const EXERCICES = [
    { id: '4', num: '4', groupe: 'groupes', titre: 'Exercice 4 : reconnaître un groupe caractéristique', desc: '7 molécules des exercices 2 et 3 : entourer et nommer le groupe, donner la famille',
      contexte: CTX('Exercice 4 : reconnaître un groupe caractéristique.', 'Pour chaque molécule, entourer et nommer le groupe caractéristique. Associer à chaque groupe caractéristique la classe fonctionnelle correspondante. C₂H₅ est une écriture abrégée : touche ⓘ sous la formule.'),
      parties: ex4 },
    { id: '5', num: '5', groupe: 'groupes', titre: 'Exercice 5 : plusieurs groupes caractéristiques', desc: 'Acides lactique, malique et pyruvique, glycéraldéhyde, acétoïne : tous les groupes',
      contexte: CTX('Exercice 5 : reconnaître un groupe caractéristique.', 'Pour chacune des molécules suivantes, entourer et nommer les groupes caractéristiques. Associer à chaque groupe caractéristique la classe fonctionnelle correspondante.'),
      parties: ex5 },
    { id: '6', num: '6', groupe: 'noms', titre: 'Exercice 6 : écrire une formule semi-développée à partir d\'un nom', desc: '4 noms : dessiner la formule semi-développée',
      contexte: CTX('Exercice 6 : écrire une formule semi-développée à partir d\'un nom.', 'Écrire les formules semi-développées des molécules suivantes. Le nom de ce que tu dessines s\'affiche en direct.'),
      parties: ex6 },
    { id: '9', num: '9', groupe: 'noms', titre: 'Exercice 9 : compléter le tableau', desc: '8 lignes : la formule semi-développée ou le nom',
      contexte: CTX('Exercice 9 : compléter le tableau.', 'Chaque ligne donne une case : la formule semi-développée ou le nom. Complète l\'autre.'), parties: ex9 },
    { id: '10', num: '10', groupe: 'noms', titre: 'Exercice 10 : alcanes cycliques', desc: 'Nommer quatre alcanes cycliques',
      contexte: CTX('Exercice 10 : alcanes cycliques.', 'Nommer les molécules suivantes.'), parties: ex10 },
  ];
  const GROUPES_EX = [
    { id: 'groupes', titre: 'Reconnaître les groupes caractéristiques' },
    { id: 'noms', titre: 'Nommer et dessiner' },
  ];
  window.NOM.EXERCICES = EXERCICES;
  window.NOM.GROUPES_EX = GROUPES_EX;
})();
