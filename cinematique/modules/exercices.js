/* ============================================================
   Exercices du module 6 (application « Cinématique ») :
   les exercices 1 à 16 du chapitre, avec la même numérotation.

   Chaque exercice : { id, groupe, titre, desc, contexte (HTML),
   figure(zone) (facultatif), parties: [p] } ; chaque partie suit
   le format de CIN.PARTIES avec p.q (question) et p.correction
   (correction détaillée, toujours consultable).
   ============================================================ */
(function () {
  'use strict';

  const { fmt, fr, dd, poly } = window.CIN;
  const { nomHTML: N, colHTML: col } = window.VEC;
  const M = window.CIN.MOINS;
  const o = (id, label) => ({ id, label });
  const I = N('i'), J = N('j'), K = N('k'), UT = N('u_t'), UN = N('u_n');
  const MS = `m·s<sup>${M}1</sup>`, MS2 = `m·s<sup>${M}2</sup>`;
  const R = h => `<span class="racine">√<span>${h}</span></span>`;
  const calc = h => `<p class="ph-calc">${h}</p>`;
  const c = h => `<span class="c">${h}</span>`;
  // fabriques de parties
  const choix = (q, options, bonne, correction, opts) => Object.assign({ type: 'choix', q, options, bonne, correction, colonne: true }, opts);
  const nombre = (q, label, valeur, correction, opts) => {
    const p = Object.assign({ type: 'nombre', q, label, valeur, correction }, opts);
    if (p.tol == null && p.rel == null) p.tol = 1e-9;
    return p;
  };
  const gabarit = (q, label, morceaux, correction, opts) => Object.assign({ type: 'gabarit', q, label, morceaux, correction }, opts);
  const coord = (q, label, valeurs, correction, opts) => Object.assign({ type: 'coord', q, label, valeurs, correction }, opts);
  const MVT = [o('acc', 'rectiligne accéléré : <b>a⃗</b> vers le bas, dans le même sens que <b>v⃗</b>'), o('unif', 'rectiligne uniforme : <b>a⃗</b> = <b>0⃗</b>'), o('ral', 'rectiligne ralenti : <b>a⃗</b> vers le haut, dans le sens contraire de <b>v⃗</b>')];

  // schéma vu de dessus pour l'exercice 13 (vitesse en rouge, accélération en vert)
  const schema = opts => window.FIG.frenet(Object.assign({ W: 210, H: 200, r: 64, theta: 50, v: 56, ut: false, un: false, rayon: false }, opts));

  const GROUPES_EX = [
    { id: 'ref', titre: 'Référentiel et dérivation' },
    { id: 'pva', titre: 'Position, vitesse, accélération' },
    { id: 'mvt', titre: 'Reconnaître un mouvement' },
    { id: 'circ', titre: 'Mouvement circulaire' },
  ];

  const EXERCICES = [

    /* ============================ EXERCICE 1 ============================ */
    { id: '1', groupe: 'ref', titre: 'Exercice 1 : choisir un référentiel', desc: 'Terre, satellite, cycliste, Io autour de Jupiter.',
      contexte: '<p class="er-contexte">Pour chacune des situations suivantes, choisir le référentiel d\'étude le plus adapté compte tenu du système étudié.</p>',
      parties: ['a. Terre tournant autour du Soleil', 'b. Satellite artificiel terrestre', 'c. Cycliste roulant sur une route', 'd. Io en rotation autour de Jupiter'].map((q, k) => choix(q,
        [o('helio', 'héliocentrique'), o('geo', 'géocentrique'), o('terre', 'terrestre'), o('jup', '« jupiterocentrique » (centre de Jupiter, axes vers des étoiles fixes)')],
        ['helio', 'geo', 'terre', 'jup'][k],
        ['<p>Référentiel <b>héliocentrique</b> : la Terre tourne autour du Soleil.</p>', '<p>Référentiel <b>géocentrique</b> : le satellite tourne autour de la Terre.</p>', '<p>Référentiel <b>terrestre</b> : le cycliste se déplace sur Terre.</p>', '<p>Référentiel « <b>jupiterocentrique</b> » : centré sur Jupiter, avec des axes dirigés vers des étoiles fixes, comme le référentiel géocentrique l\'est pour la Terre.</p>'][k],
        { melanger: false, indice: 'Autour de quel astre l\'objet tourne-t-il ? Ou bien se déplace-t-il sur Terre ?' })) },

    /* ============================ EXERCICE 2 ============================ */
    { id: '2', groupe: 'ref', titre: 'Exercice 2 : dériver par rapport au temps', desc: 'Fonctions et vecteurs, notation d/dt.',
      contexte: '<p class="er-contexte">Exprimer les dérivées par rapport au temps des fonctions et vecteurs suivants.</p>',
      parties: [
        gabarit('a. x(t) = 5t + 1', `${dd('x')} =`, [{ v: 5 }], calc(`${dd('x')} = ${c('5')}`), { indice: 'at + b se dérive en a.' }),
        gabarit('b. y(t) = 5t + 1', `${dd('y')} =`, [{ v: 5 }], calc(`${dd('y')} = ${c('5')}`), { indice: 'Même calcul : seul le nom change.' }),
        gabarit('c. f(t) = 3t² + 4t + 2', `${dd('f')} =`, [{ v: 6 }, ' t + ', { v: 4 }], calc(`${dd('f')} = ${c('6t + 4')}`), { indice: 'at² → 2at ; at → a ; constante → 0.' }),
        gabarit(`d. ${N('OM')}(t) = 3t${I} + 5${J}`, `${dd(N('OM') + '(t)')} =`, [{ v: 3 }, ` ${I} + `, { v: 0 }, ` ${J}`], calc(`${dd(N('OM') + '(t)')} = ${c(`3${I}`)}`), { indice: 'Dérive chaque coordonnée : 3t → 3 et 5 → 0.' }),
        choix(`e. ${N('OM')}(t) = (4t² + 8t)${I} + ${fr('1', 't')}${J} + 5t³${K}`, [
          o('ok', `(8t + 8)${I} ${M} ${fr('1', 't²')}${J} + 15t²${K}`), o('a', `(8t + 8)${I} + ${fr('1', 't²')}${J} + 15t²${K}`), o('b', `(4t + 8)${I} ${M} ${fr('1', 't²')}${J} + 15t²${K}`), o('d', `(8t + 8)${I} + 15t²${K}`)], 'ok',
          calc(`${dd(N('OM') + '(t)')} = ${c(`(8t + 8)${I} ${M} ${fr('1', 't²')}${J} + 15t²${K}`)}`) + '<p>(1/x)\' = −1/x² et (x³)\' = 3x² (tableau des dérivées).</p>', { indice: 'Utilise le tableau complet : (1/x)\' = −1/x² et (xⁿ)\' = n xⁿ⁻¹.' }),
        gabarit('f. v<sub>x</sub>(t) = 5t + 1', `${dd('v<sub>x</sub>')} =`, [{ v: 5 }], calc(`${dd('v<sub>x</sub>' + '(t)')} = ${c('5')}`), { indice: 'Même calcul qu\'au a.' }),
        gabarit(`g. ${N('v')}(t) = 3t${I} + 5${J}`, `${dd(N('v') + '(t)')} =`, [{ v: 3 }, ` ${I} + `, { v: 0 }, ` ${J}`], calc(`${dd(N('v') + '(t)')} = ${c(`3${I}`)}`), { indice: 'Dérive chaque coordonnée.' }),
        gabarit(`h. ${N('v')}(t) = 8t²${I}`, `${dd(N('v') + '(t)')} =`, [{ v: 16 }, ` t${I}`], calc(`${dd(N('v') + '(t)')} = ${c(`16t${I}`)}`), { indice: '8t² → 16t ; i⃗ est constant.', diag: v => (v[0] === 8 ? 'La dérivée de 8t² est 2 × 8t = 16t.' : null) }),
        choix(`i. ${N('v')}(t) = 3${I}`, [o('ok', `${N('0')} (vecteur nul)`), o('a', `3${I}`), o('b', '3'), o('c', `${I}`)], 'ok', calc(`${dd(N('v') + '(t)')} = ${c(N('0'))}`) + '<p>Le vecteur 3i⃗ est constant : sa dérivée est le vecteur nul.</p>', { indice: 'La coordonnée 3 est une constante.' }),
      ] },

    /* ============================ EXERCICE 3 ============================ */
    { id: '3', groupe: 'pva', titre: 'Exercice 3 : un point dans un plan', desc: 'x(t) = 5t + 1 et y(t) = 3 : position, vitesse, accélération.',
      contexte: `<p class="er-contexte">Un point mobile noté M se déplace dans un plan. L'étude est réalisée dans le repère (O, ${I}, ${J}). L'enregistrement de son mouvement a permis d'obtenir l'expression de ses coordonnées en fonction du temps : <b>x(t) = 5t + 1</b> et <b>y(t) = 3</b> (x et y en m et t en s).</p>`,
      parties: [
        gabarit('a. Donner l\'expression du vecteur position à l\'instant t.', `${N('OM')}(t) =`, ['(', { v: 5 }, ' t + ', { v: 1 }, `) ${I} + `, { v: 3 }, ` ${J}`], calc(`${N('OM')}(t) = ${c(`(5t + 1)${I} + 3${J}`)}`), { indice: `${N('OM')}(t) = x(t)${I} + y(t)${J}.` }),
        { type: 'ij', q: 'b. Donner l\'expression du vecteur position à l\'instant t<sub>0</sub> = 0 s.', label: `${N('OM')}(0) =`, valeurs: [1, 3], indice: 'Remplace t par 0 dans x(t) et y(t).',
          correction: calc(`${N('OM')}(0) = (5 × 0 + 1)${I} + 3${J} = ${c(`${I} + 3${J}`)}`) },
        { type: 'ij', q: 'c. Déterminer le vecteur vitesse.', label: `${N('v')} =`, valeurs: [5, 0], lecture: false, indice: `${N('v')} = ${dd(N('OM'))} : dérive chaque coordonnée.`,
          correction: calc(`${N('v')} = ${dd(N('OM') + '(t)')} = ${c(`5${I}`)}`) },
        coord('d. Donner les coordonnées v<sub>x</sub> et v<sub>y</sub> du vecteur vitesse.', N('v'), [5, 0], calc(`v<sub>x</sub> = ${c('5')} ${MS} et v<sub>y</sub> = ${c('0')}`), { unite: MS, indice: 'Ce sont les nombres devant i⃗ et j⃗.' }),
        choix('e. Déterminer le vecteur accélération.', [o('ok', `${N('a')} = ${N('0')}`), o('a', `${N('a')} = 5${I}`), o('b', `${N('a')} = 5`), o('c', `${N('a')} = ${I}`)], 'ok', calc(`${N('a')} = ${dd(N('v'))} = ${c(N('0'))}`) + '<p>Le vecteur vitesse est constant : le mouvement est rectiligne uniforme.</p>', { colonne: false, indice: 'Dérive le vecteur vitesse 5i⃗.' }),
      ] },

    /* ============================ EXERCICE 4 ============================ */
    { id: '4', groupe: 'pva', titre: 'Exercice 4 : un mouvement plan', desc: 'x(t) = 3t³ + 6t² + t, y(t) = t, z(t) = 0.',
      contexte: `<p class="er-contexte">Un point matériel G est animé d'un mouvement décrit, dans un repère orthonormé (O, ${I}, ${J}, ${K}), par les équations horaires de ses coordonnées : <b>x(t) = 3t³ + 6t² + t</b>, <b>y(t) = t</b> et <b>z(t) = 0</b>.</p>`,
      parties: [
        choix('a. Justifier que ce mouvement est plan.', [o('ok', 'z(t) = 0 à chaque instant : le point reste dans le plan (O, x, y)'), o('a', 'x(t) contient un terme en t³'), o('b', 'y(t) = t est une droite'), o('c', 'le point ne bouge pas selon x')], 'ok', '<p>Le mouvement s\'effectue dans le plan (O, x, y) car z est toujours nul.</p>', { indice: 'Regarde la troisième coordonnée.' }),
        gabarit('b. Donner l\'expression du vecteur position.', `${N('OG')}(t) =`, ['(', { v: 3 }, ' t³ + ', { v: 6 }, ' t² + ', { v: 1 }, ` t) ${I} + `, { v: 1 }, ` t ${J}`], calc(`${N('OG')}(t) = ${c(`(3t³ + 6t² + t)${I} + t${J}`)}`), { indice: `${N('OG')}(t) = x(t)${I} + y(t)${J} + z(t)${K}, avec z = 0.` }),
        gabarit('b. Donner l\'expression du vecteur vitesse.', `${N('v')}(t) =`, ['(', { v: 9 }, ' t² + ', { v: 12 }, ' t + ', { v: 1 }, `) ${I} + `, { v: 1 }, ` ${J}`], calc(`${N('v')}(t) = ${dd(N('OG'))} = ${c(`(9t² + 12t + 1)${I} + ${J}`)}`),
          { indice: '(t³)\' = 3t² (tableau : (xⁿ)\' = n xⁿ⁻¹), donc (3t³)\' = 9t².' }),
        gabarit('b. Donner l\'expression du vecteur accélération.', `${N('a')}(t) =`, ['(', { v: 18 }, ' t + ', { v: 12 }, `) ${I} + `, { v: 0 }, ` ${J}`], calc(`${N('a')}(t) = ${dd(N('v'))} = ${c(`(18t + 12)${I}`)}`), { indice: 'Dérive (9t² + 12t + 1) et 1.' }),
        choix('c. Donner l\'expression de la norme du vecteur vitesse.', [o('ok', `v(t) = ${R('(9t² + 12t + 1)² + 1²')}`), o('a', 'v(t) = 9t² + 12t + 1 + 1'), o('b', `v(t) = ${R('9t² + 12t + 2')}`), o('c', 'v(t) = (9t² + 12t + 1)² + 1')], 'ok',
          calc(`v(t) = ${R('v<sub>x</sub>² + v<sub>y</sub>²')} = ${c(R('(9t² + 12t + 1)² + 1'))}`) + calc(`OG(t) = ${R('(3t³ + 6t² + t)² + t²')}`), { indice: 'v = √(vx² + vy²).' }),
        choix('c. Donner l\'expression de la norme du vecteur accélération (pour t ≥ 0).', [o('ok', 'a(t) = 18t + 12'), o('a', `a(t) = ${R('18t + 12')}`), o('b', 'a(t) = (18t + 12)²'), o('c', 'a(t) = 18t + 13')], 'ok',
          calc(`a(t) = ${R('(18t + 12)² + 0²')} = ${c('18t + 12')}`), { indice: 'a = √(ax² + ay²), avec ay = 0.' }),
      ] },

    /* ============================ EXERCICE 5 ============================ */
    { id: '5', groupe: 'pva', titre: 'Exercice 5 : équations horaires', desc: 'x(t) = 4,00t² + 6,00t et y(t) = 3,00t : vitesse et accélération.',
      contexte: '<p class="er-contexte">Un point matériel G est animé d\'un mouvement décrit, dans un repère orthonormé, par les équations horaires de ses coordonnées : <b>x(t) = 4,00t² + 6,00t</b> et <b>y(t) = 3,00t</b> (en m, t en s).</p>',
      parties: [
        choix('a. Pourquoi qualifie-t-on ces équations d\'« horaires » ?', [o('ok', 'parce qu\'elles font intervenir le temps t'), o('a', 'parce qu\'elles sont mesurées en heures'), o('b', 'parce que le mouvement est uniforme'), o('c', 'parce qu\'elles donnent la vitesse')], 'ok', '<p>Ce sont des équations horaires car elles font intervenir le temps t.</p>', { indice: 'Que contiennent-elles ?' }),
        coord('b. Quelles sont les coordonnées de G à l\'instant t = 0 ?', 'G(0)', [0, 0], calc(`x(0) = ${c('0')} et y(0) = ${c('0')}`), { unite: 'm', indice: 'Remplace t par 0.' }),
        gabarit('c. Donner l\'expression de v<sub>x</sub> en fonction du temps.', `v<sub>x</sub>(t) = ${dd('x')} =`, [{ v: 8 }, ' t + ', { v: 6 }], calc(`v<sub>x</sub>(t) = ${dd('x')} = ${c('8,00t + 6,00')}`), { indice: '4,00t² → 8,00t ; 6,00t → 6,00.' }),
        gabarit('c. Donner l\'expression de v<sub>y</sub> en fonction du temps.', `v<sub>y</sub>(t) = ${dd('y')} =`, [{ v: 3 }], calc(`v<sub>y</sub>(t) = ${dd('y')} = ${c(`3,00 ${MS}`)}`), { indice: 'Dérive 3,00t.' }),
        coord('d. Calculer les coordonnées de la vitesse à t = 1,00 s.', `${N('v')}(1)`, [14, 3], calc(`v<sub>x</sub>(1) = 8,00 × 1 + 6,00 = ${c(`14,0 ${MS}`)} et v<sub>y</sub>(1) = ${c(`3,00 ${MS}`)}`), { unite: MS, tol: .051, indice: 'Remplace t par 1,00 dans vx(t) et vy(t).' }),
        nombre('d. En déduire la valeur de la vitesse à cet instant.', 'v(1) ≈', Math.hypot(14, 3), calc(`v(1) = ${R('v<sub>x</sub>(1)² + v<sub>y</sub>(1)²')} = ${R('14,0² + 3,00²')} = ${c(`14,3 ${MS}`)}`),
          { tol: .051, dec: 1, unite: MS, indice: 'v = √(vx² + vy²).', diag: v => (Math.abs(v - 17) < .06 ? 'On n\'additionne pas : v = √(vx² + vy²).' : null) }),
        coord('e. Donner les coordonnées a<sub>x</sub> et a<sub>y</sub> de l\'accélération.', N('a'), [8, 0], calc(`a<sub>x</sub> = ${dd('v<sub>x</sub>')} = ${c('8,00')} et a<sub>y</sub> = ${dd('v<sub>y</sub>')} = ${c('0')}`), { unite: MS2, indice: 'Dérive vx(t) et vy(t).' }),
        nombre('e. En déduire la valeur de l\'accélération.', 'a =', 8, calc(`a = ${R('8,00² + 0²')} = ${c(`8,00 ${MS2}`)} (elle est constante)`), { tol: .051, unite: MS2, indice: 'a = √(ax² + ay²).' }),
      ] },

    /* ============================ EXERCICE 6 ============================ */
    { id: '6', groupe: 'pva', titre: 'Exercice 6 : un mouvement dans l\'espace', desc: 'Vecteur position en trois dimensions.',
      contexte: `<p class="er-contexte">Un point matériel M est animé d'un mouvement décrit, dans un repère orthonormé (O, ${I}, ${J}, ${K}), par son vecteur position : <b>${N('OM')}(t) = 3t²${I} + 5t${J} + (8t² + 5)${K}</b>.</p>`,
      parties: [
        gabarit('a. Donner l\'expression du vecteur vitesse.', `${N('v')}(t) =`, [{ v: 6 }, ` t ${I} + `, { v: 5 }, ` ${J} + `, { v: 16 }, ` t ${K}`], calc(`${N('v')}(t) = ${dd(N('OM'))} = ${c(`6t${I} + 5${J} + 16t${K}`)}`), { indice: 'Dérive chacune des trois coordonnées.' }),
        gabarit('a. Donner l\'expression du vecteur accélération.', `${N('a')}(t) =`, [{ v: 6 }, ` ${I} + `, { v: 0 }, ` ${J} + `, { v: 16 }, ` ${K}`], calc(`${N('a')}(t) = ${dd(N('v'))} = ${c(`6${I} + 16${K}`)}`), { indice: 'Dérive les coordonnées du vecteur vitesse.' }),
        choix('b. Donner l\'expression de la valeur de la vitesse.', [o('ok', `v(t) = ${R('292t² + 25')}`), o('a', 'v(t) = 22t + 5'), o('b', `v(t) = ${R('6t + 5 + 16t')}`), o('c', `v(t) = ${R('36t² + 25')}`)], 'ok',
          calc(`v(t) = ${R('(6t)² + 5² + (16t)²')} = ${R('36t² + 25 + 256t²')} = ${c(R('292t² + 25'))}`), { indice: 'v = √(vx² + vy² + vz²) en trois dimensions.' }),
        nombre('b. Calculer la valeur de l\'accélération, arrondie au dixième.', 'a ≈', Math.hypot(6, 16), calc(`a = ${R('6² + 16²')} = ${R('292')} ≈ ${c(`17,1 ${MS2}`)}`), { tol: .051, dec: 1, unite: MS2, indice: 'a = √(ax² + ay² + az²).', diag: v => (Math.abs(v - 22) < .06 ? 'On n\'additionne pas : a = √(ax² + ay² + az²).' : null) }),
      ] },

    /* ============================ EXERCICE 7 ============================ */
    { id: '7', groupe: 'pva', titre: 'Exercice 7 : analyse dimensionnelle', desc: 'x(t) = 9,2t et y(t) = −5t² + 9,6t + 1,0 : unités, vitesse, accélération.',
      contexte: `<p class="er-contexte">On considère un point matériel se déplaçant dans un plan (O, ${I}, ${J}). Les équations horaires de sa trajectoire sont : <b>x(t) = 9,2t</b> et <b>y(t) = ${M}5t² + 9,6t + 1,0</b>, où x et y s'expriment en mètres et t en secondes.</p>`,
      parties: [
        ...[['9,2', 'ms', '9,2 × t est en m et t en s : 9,2 est en m/s. C\'est une <b>vitesse</b>.'], ['5', 'ms2', '5 × t² est en m et t² en s² : 5 est en m/s². C\'est une <b>accélération</b>.'], ['9,6', 'ms', '9,6 × t est en m : 9,6 est en m/s. C\'est une <b>vitesse</b>.'], ['1,0', 'm', '1,0 s\'ajoute à des mètres : il est en m. C\'est une <b>longueur</b>.']].map(([k, bonne, sol], i) =>
          choix(`${i ? '' : '1. et 2. '}Unité du coefficient ${k} (et type de grandeur) :`, [o('m', 'm (longueur)'), o('ms', `${MS} (vitesse)`), o('ms2', `${MS2} (accélération)`), o('s', 's (durée)')], bonne, `<p>${sol}</p>`,
            { melanger: false, colonne: false, indice: 'Chaque terme de x(t) ou y(t) doit être en mètres.' })),
        gabarit('3. Exprimer v<sub>x</sub>(t).', `v<sub>x</sub>(t) =`, [{ v: 9.2 }], calc(`v<sub>x</sub>(t) = ${dd('x')} = ${c('9,2')}`), { indice: 'Dérive x(t) = 9,2t.' }),
        gabarit('3. Exprimer v<sub>y</sub>(t).', `v<sub>y</sub>(t) =`, [{ v: -10 }, ' t + ', { v: 9.6 }], calc(`v<sub>y</sub>(t) = ${dd('y')} = ${c(`${M}10t + 9,6`)}`), { indice: '−5t² → −10t ; 9,6t → 9,6 ; 1,0 → 0.' }),
        coord('3. Donner a<sub>x</sub>(t) et a<sub>y</sub>(t).', N('a'), [0, -10], calc(`a<sub>x</sub>(t) = ${dd('v<sub>x</sub>')} = ${c('0')} et a<sub>y</sub>(t) = ${dd('v<sub>y</sub>')} = ${c(`${M}10`)}`), { unite: MS2, indice: 'Dérive vx(t) et vy(t).' }),
        choix('4. En déduire la valeur de la vitesse.', [o('ok', `v(t) = ${R('9,2² + (−10t + 9,6)²')}`), o('a', 'v(t) = 9,2 + (−10t + 9,6)'), o('b', `v(t) = ${R('9,2 + (−10t + 9,6)')}`), o('c', 'v(t) = 9,2² + (−10t + 9,6)²')], 'ok',
          calc(`v(t) = ${R('v<sub>x</sub>² + v<sub>y</sub>²')} = ${c(R('9,2² + (−10t + 9,6)²'))} = ${R('176,8 + 100t² − 192t')}`), { indice: 'v = √(vx² + vy²).' }),
        nombre('4. En déduire la valeur de l\'accélération.', 'a =', 10, calc(`a = ${R('0² + (−10)²')} = ${c(`10 ${MS2}`)}`), { tol: .051, unite: MS2, indice: 'a = √(ax² + ay²).', diag: v => (v === -10 ? 'Une valeur (un module) est toujours positive.' : null) }),
      ] },

    /* ============================ EXERCICE 8 ============================ */
    { id: '8', groupe: 'pva', titre: 'Exercice 8 : objet lancé vers le haut', desc: 'Vitesse qui change de sens, accélération −g k⃗.',
      contexte: `<p class="er-contexte">La position d'un objet lancé depuis l'altitude h à la vitesse v<sub>0</sub> est donnée par l'expression :</p><p class="ph-formule">${N('OM')} = (${M}${fr('1', '2')}gt² + v<sub>0</sub>t + h)${K}</p><p class="er-contexte">(${K} est vertical, vers le haut, et g = 9,8 ${MS2}).</p>`,
      parties: [
        choix('1. a. Donner l\'expression de la vitesse de cet objet au cours du temps.', [o('ok', `${N('v')} = (${M}gt + v<sub>0</sub>)${K}`), o('a', `${N('v')} = (${M}${fr('1', '2')}gt + v<sub>0</sub>)${K}`), o('b', `${N('v')} = (${M}gt + v<sub>0</sub> + h)${K}`), o('c', `${N('v')} = (${M}gt² + v<sub>0</sub>)${K}`)], 'ok',
          calc(`${N('v')} = ${dd(N('OM'))} = ${c(`(${M}gt + v<sub>0</sub>)${K}`)}`) + '<p>(½ gt²)\' = ½ × 2gt = gt ; la dérivée de la constante h est nulle.</p>', { indice: 'g, v₀ et h sont des constantes ; dérive par rapport à t.' }),
        choix('1. b. Le vecteur vitesse change de sens à la date :', [o('ok', `t = ${fr('v<sub>0</sub>', 'g')}`), o('a', `t = ${fr('g', 'v<sub>0</sub>')}`), o('b', `t = ${fr('2v<sub>0</sub>', 'g')}`), o('c', 'jamais')], 'ok',
          `<p>Le vecteur vitesse change de sens quand sa coordonnée selon ${K} change de signe. Au départ, v(0) = v<sub>0</sub> &gt; 0. Ensuite le terme ${M}gt devient de plus en plus négatif : la coordonnée est nulle pour ${c(`t = v<sub>0</sub> / g`)}, puis négative.</p>`, { colonne: false, indice: 'Cherche quand −gt + v₀ = 0.' }),
        choix('2. Exprimer le vecteur accélération et l\'identifier.', [o('ok', `${N('a')} = ${M}g${K} : vertical, vers le bas, de valeur g`), o('a', `${N('a')} = ${M}gt${K}`), o('b', `${N('a')} = ${N('0')}`), o('c', `${N('a')} = g${K} : vertical, vers le haut`)], 'ok',
          calc(`${N('a')} = ${dd(N('v'))} = ${c(`${M}g${K}`)}`) + '<p>L\'accélération est un vecteur vertical, vers le bas, de valeur égale à l\'accélération de la pesanteur g.</p>', { indice: 'Dérive (−gt + v₀).' }),
      ] },

    /* ============================ EXERCICE 9 ============================ */
    { id: '9', groupe: 'mvt', titre: 'Exercice 9 : six graphiques, trois mouvements', desc: 'Reconnaître un mouvement uniforme, accéléré ou ralenti sur un graphique.',
      contexte: '<p class="er-contexte">Trois mouvements rectilignes différents ont été étudiés. Des représentations graphiques temporelles des projections des vecteurs position, vitesse et accélération sont proposées. Regrouper ces représentations de telle sorte que chaque groupe corresponde à l\'un des trois mouvements étudiés (le point se déplace dans le sens positif de l\'axe).</p>',
      parties: [['A', 'v-croissant', 'v (m·s⁻¹)', 'acc', 'La vitesse augmente : mouvement accéléré.'], ['B', 'x-droite', 'x (m)', 'unif', 'x augmente proportionnellement au temps : la vitesse est constante, mouvement uniforme.'],
        ['C', 'v-constant', 'v (m·s⁻¹)', 'unif', 'La vitesse est constante : mouvement uniforme.'], ['D', 'a-negatif', 'a (m·s⁻²)', 'ral', 'L\'accélération est négative (de sens contraire au mouvement) : la vitesse diminue, mouvement ralenti.'],
        ['E', 'x-courbe', 'x (m)', 'acc', 'x augmente de plus en plus vite (la pente augmente) : mouvement accéléré.'], ['F', 'v-decroissant', 'v (m·s⁻¹)', 'ral', 'La vitesse diminue : mouvement ralenti.']].map(([l, t, y, bonne, sol]) =>
        Object.assign(choix(`Graphique ${l} : quel mouvement ?`, [o('unif', 'rectiligne uniforme'), o('acc', 'rectiligne accéléré'), o('ral', 'rectiligne ralenti')], bonne, `<p>${sol}</p>`,
          { melanger: false, colonne: false, indice: 'Que fait la vitesse ? Sur un graphique de x(t), la vitesse est la pente.' }), { figure: z => { z.innerHTML = window.FIG.miniGraphe(t, y); } })) },

    /* ============================ EXERCICE 10 ============================ */
    { id: '10', groupe: 'mvt', titre: 'Exercice 10 : saut à ski', desc: 'Directions du vecteur accélération sur une piste.',
      contexte: '<p class="er-contexte">Un skieur s\'élance sur une piste de saut à ski. Le mouvement lui permettant de prendre son élan jusqu\'au tremplin est rectiligne uniformément accéléré. La partie correspondant au tremplin lui-même est considérée comme une portion de cercle. Pour simplifier, on considérera que la vitesse reste constante dans la portion circulaire. Tracer schématiquement les vecteurs accélération aux points A, B, C, D et E.</p>',
      figure: z => { z.innerHTML = window.FIG.skieur(false); },
      parties: [
        choix('Aux points A, B et C, le vecteur accélération est :', [o('ok', 'dirigé selon la piste, dans le sens du mouvement'), o('a', 'dirigé selon la piste, dans le sens contraire du mouvement'), o('b', 'dirigé vers le centre du cercle'), o('c', 'nul')], 'ok',
          '<p>Mouvement rectiligne accéléré : le vecteur accélération a la direction de la trajectoire et le sens du mouvement.</p>', { indice: 'Mouvement rectiligne accéléré.' }),
        choix('Aux points D et E, le vecteur accélération est :', [o('ok', 'dirigé vers le centre du cercle'), o('a', 'dirigé selon la piste, dans le sens du mouvement'), o('b', 'dirigé vers l\'extérieur du cercle'), o('c', 'nul, car la vitesse est constante')], 'ok',
          '<p>Mouvement circulaire uniforme : le vecteur accélération est centripète (vers le centre du cercle), de valeur v²/r.</p><p>Les vecteurs accélération aux cinq points :</p>' + window.FIG.skieur(true), { indice: 'Mouvement circulaire uniforme.' }),
      ] },

    /* ============================ EXERCICE 11 ============================ */
    { id: '11', groupe: 'mvt', titre: 'Exercice 11 : caractéristiques des vecteurs', desc: 'Mouvements rectiligne, rectiligne uniforme, circulaire uniforme ; produit scalaire.',
      contexte: '<p class="er-contexte">Questions sur les caractéristiques des vecteurs vitesse et accélération.</p>',
      parties: [
        choix('1. Quelles sont les caractéristiques des vecteurs vitesse et accélération dans le cas d\'un mouvement rectiligne ?', [
          o('ok', 'v⃗ a la direction de la trajectoire et le sens du mouvement ; a⃗ a la direction de la trajectoire'), o('a', 'v⃗ et a⃗ sont perpendiculaires à la trajectoire'), o('b', 'v⃗ a la direction de la trajectoire ; a⃗ est toujours nul'), o('c', 'v⃗ est perpendiculaire à la trajectoire ; a⃗ a sa direction')], 'ok',
          '<p>Lors d\'un mouvement rectiligne, le vecteur vitesse a la même direction et le même sens que le mouvement ; le vecteur accélération a la même direction que le mouvement.</p>', { indice: 'Sur une droite, tout se passe le long de la droite.' }),
        choix('2. Mouvement rectiligne uniforme :', [o('ok', 'v⃗ est constant, dans la direction et le sens du mouvement ; a⃗ = 0⃗'), o('a', 'v⃗ est constant ; a⃗ est dans le sens du mouvement'), o('b', 'v⃗ varie ; a⃗ = 0⃗'), o('c', 'v⃗ = 0⃗ ; a⃗ = 0⃗')], 'ok',
          '<p>Rectiligne uniforme : le vecteur vitesse est constant (même direction et même sens que le mouvement) et le vecteur accélération est nul.</p>', { indice: 'Rien ne change pour le vecteur vitesse.' }),
        choix('2. Mouvement circulaire uniforme :', [o('ok', 'v⃗ est tangent, de norme constante ; a⃗ est dirigé vers le centre, de norme v²/r'), o('a', 'v⃗ est constant ; a⃗ = 0⃗'), o('b', 'v⃗ est tangent ; a⃗ est tangent'), o('c', 'v⃗ est dirigé vers le centre ; a⃗ est tangent')], 'ok',
          '<p>Circulaire uniforme : le vecteur vitesse est tangent à la trajectoire, dans le sens du mouvement, de norme constante ; le vecteur accélération est centripète (vers le centre du cercle) et sa norme est v²/r.</p>', { indice: 'Repère de Frenet : a⃗ = (dv/dt) u⃗t + (v²/r) u⃗n.' }),
        choix('b. Que peut-on dire du produit scalaire a⃗ · v⃗ dans les deux cas ?', [o('ok', 'il est nul dans les deux cas'), o('a', 'il est nul seulement pour le mouvement rectiligne uniforme'), o('b', 'il est nul seulement pour le mouvement circulaire uniforme'), o('c', 'il n\'est jamais nul')], 'ok',
          '<p>Rectiligne uniforme : a⃗ · v⃗ = 0 car a⃗ = 0⃗. Circulaire uniforme : a⃗ · v⃗ = 0 car a⃗ est perpendiculaire à v⃗.</p>', { indice: 'Le produit scalaire est nul si un vecteur est nul ou si les deux vecteurs sont perpendiculaires.' }),
      ] },

    /* ============================ EXERCICE 12 ============================ */
    { id: '12', groupe: 'mvt', titre: 'Exercice 12 : trouver les erreurs', desc: 'Six schémas de vecteurs vitesse et accélération : lesquels sont faux ?',
      contexte: '<p class="er-contexte">Ces représentations sont celles de trajectoires pour lesquelles un élève a associé en un point le vecteur vitesse (en rouge) et le vecteur accélération (en vert) pour traduire le mouvement. Certaines d\'entre elles ne peuvent pas être correctes. Identifie-les en justifiant.</p>',
      parties: [['A', 'v', 'A est incorrect car v⃗ n\'est pas tangent à la trajectoire.'], ['B', 'ext', 'B est incorrect car a⃗ est dirigé vers l\'extérieur de la trajectoire.'], ['C', 'ok', 'C est correct (mouvement rectiligne ralenti : a⃗ de sens contraire à v⃗).'],
        ['D', 'dir', 'D est incorrect car a⃗ devrait avoir la même direction que la trajectoire (mouvement rectiligne).'], ['E', 'ok', 'E est correct : a⃗ est dirigé vers l\'intérieur de la courbe.'], ['F', 'int', 'F est incorrect car a⃗ devrait être dirigé vers l\'intérieur de la trajectoire.']].map(([l, bonne, sol]) =>
        Object.assign(choix(`Schéma ${l} :`, [o('ok', 'correct'), o('v', 'incorrect : v⃗ n\'est pas tangent à la trajectoire'), o('ext', 'incorrect : a⃗ est dirigé vers l\'extérieur de la courbe'), o('dir', 'incorrect : sur une droite, a⃗ doit avoir la direction de la trajectoire'), o('int', 'incorrect : sur une courbe, a⃗ doit être dirigé vers l\'intérieur')], bonne, `<p>${sol}</p>`,
          { melanger: false, indice: 'v⃗ est toujours tangent. Sur une droite, a⃗ est le long de la droite ; sur une courbe, a⃗ est tourné vers l\'intérieur.' }), { figure: z => { z.innerHTML = window.FIG.ex12(l); } })) },

    /* ============================ EXERCICE 13 ============================ */
    { id: '13', groupe: 'circ', titre: 'Exercice 13 : le manège', desc: 'Mouvement circulaire uniforme : vitesse et accélération dans le repère de Frenet.',
      contexte: '<p class="er-contexte">Un manège de 16,0 m de diamètre, animé d\'un mouvement circulaire uniforme autour d\'un axe vertical, fait un tour complet en 2,40 s.</p>',
      parties: [
        choix('1. Quel schéma (vu de dessus) représente correctement les vecteurs vitesse (rouge) et accélération (vert) d\'un point du bord ?', [
          o('ok', schema({ an: 44 })), o('t', schema({ at: 40 })), o('e', schema({ an: -40 }))], 'ok',
          '<p>Le vecteur vitesse est tangent au cercle, dans le sens du mouvement ; le vecteur accélération est dirigé vers le centre (mouvement circulaire uniforme).</p>' + window.FIG.frenet({ theta: 50, v: 70, an: 56, ut: false, un: false, rayon: false }), { colonne: false, indice: 'Mouvement circulaire uniforme : a⃗ = (v²/r) u⃗n.' }),
        nombre('2. a. Calculer la vitesse d\'un point se trouvant à la périphérie du manège (trois chiffres significatifs).', 'v ≈', 2 * Math.PI * 8 / 2.4,
          calc(`v = ${fr('distance pour un tour', 'temps pour un tour')} = ${fr('2π × 8,0', '2,40')} = ${c(`20,9 ${MS}`)}`), { rel: .006, cs: 3, unite: MS, indice: 'Rayon : 16,0 / 2 = 8,0 m ; distance pour un tour : 2πr.',
            diag: v => (Math.abs(v - 2 * Math.PI * 16 / 2.4) < .5 ? 'Attention : 16,0 m est le diamètre ; le rayon vaut 8,0 m.' : null) }),
        coord(`2. b. Coordonnées de ${N('v')} dans la base de Frenet (${UT} en haut, ${UN} en bas).`, N('v'), [2 * Math.PI * 8 / 2.4, 0], calc(`${N('v')} = ${c(`20,9${UT}`)}`), { tol: .06, affiche: ['20,9', '0'], unite: MS, indice: `${N('v')} = v${UT}.` }),
        coord(`2. b. Coordonnées de ${N('a')} dans la base de Frenet.`, N('a'), [0, Math.pow(2 * Math.PI * 8 / 2.4, 2) / 8], calc(`${N('a')} = ${fr('v²', 'R')}${UN} = ${fr('20,9²', '8,0')}${UN} = ${c(`54,8${UN}`)}`), { tol: .4, affiche: ['0', '54,8'], unite: MS2, indice: `${N('a')} = (v²/R)${UN} ; a<sub>t</sub> = 0 car v est constante.` }),
        nombre('3. Mêmes questions pour un point situé à 4 m de l\'axe : calculer v.', 'v ≈', 2 * Math.PI * 4 / 2.4, calc(`v = ${fr('2π × 4,0', '2,40')} = ${c(`10,5 ${MS}`)} : la durée d'un tour est la même, donc plus on se rapproche du centre, plus la vitesse diminue.`), { rel: .006, cs: 3, unite: MS, indice: 'Même calcul avec r = 4,0 m.' }),
        nombre('3. Calculer a pour ce point.', 'a ≈', Math.pow(2 * Math.PI * 4 / 2.4, 2) / 4, calc(`${N('v')} = 10,5${UT} ; ${N('a')} = ${fr('10,5²', '4,0')}${UN} = ${c(`27,4${UN}`)}`), { rel: .01, cs: 3, unite: MS2, indice: 'a = v² / r.' }),
      ] },

    /* ============================ EXERCICE 14 ============================ */
    { id: '14', groupe: 'circ', titre: 'Exercice 14 : la rotation de la Terre', desc: 'Vitesse d\'un point de l\'équateur dans le référentiel géocentrique.',
      contexte: '<p class="er-contexte">Le rayon de la Terre est R = 6,4 × 10<sup>3</sup> km. On étudie le mouvement d\'un point se trouvant à la surface de la Terre, au niveau de l\'équateur, dans un référentiel dont l\'origine est le centre de la Terre et dont les axes sont orientés vers des étoiles lointaines (référentiel géocentrique).</p>',
      parties: [
        choix('1. a. Quel est le type de mouvement de ce point ?', [o('ok', 'circulaire uniforme'), o('a', 'rectiligne uniforme'), o('b', 'circulaire accéléré'), o('c', 'immobile')], 'ok', '<p>Mouvement <b>circulaire uniforme</b> : le point tourne autour de l\'axe de la Terre, à vitesse constante.</p>', { colonne: false, indice: 'La Terre tourne sur elle-même, toujours au même rythme.' }),
        { type: 'sci', q: '1. b. Calculer le périmètre de la Terre au niveau de l\'équateur, en mètres.', label: 'P ≈', valeur: 2 * Math.PI * 6.4e6, cs: 2, unite: 'm', indice: 'P = 2πR, avec R = 6,4 × 10⁶ m.',
          diag: v => (window.CIN.proche(v, 2 * Math.PI * 6.4e3, .03) ? 'Le résultat est demandé en mètres : R = 6,4 × 10³ km = 6,4 × 10⁶ m.' : window.CIN.proche(v, Math.PI * 6.4e6, .03) ? 'Le périmètre est 2πR.' : null),
          correction: calc(`P = 2πR = 2π × 6,4 × 10<sup>6</sup> = ${c('4,0 × 10<sup>7</sup> m')}`) },
        nombre('1. b. En déduire la vitesse de ce point (trois chiffres significatifs).', 'v ≈', 2 * Math.PI * 6.4e6 / 86400, calc(`La durée d'une rotation est 24 h : v = ${fr('périmètre', 'temps pour un tour')} = ${fr('4,0 × 10<sup>7</sup>', '24 × 3600')} = ${c(`465 ${MS}`)}`),
          { rel: .01, cs: 3, unite: MS, indice: 'Un tour en 24 h, à convertir en secondes.', diag: v => (window.CIN.proche(v, 2 * Math.PI * 6.4e6 / 24, .03) ? 'Convertis 24 h en secondes : 24 × 3 600 s.' : window.CIN.proche(v, 2 * Math.PI * 6.4e6 / 1440, .03) ? 'Convertis 24 h en secondes (et non en minutes).' : null) }),
        choix('1. c. Décrire le vecteur accélération de ce point.', [o('ok', 'centripète (dirigé vers le centre de la Terre), de valeur constante v²/R'), o('a', 'nul, car la vitesse est constante'), o('b', 'tangent à la trajectoire'), o('c', 'dirigé vers le Soleil')], 'ok',
          `<p>C'est un mouvement circulaire uniforme donc a = v²/R : le vecteur accélération est centripète (dirigé vers le centre de la trajectoire) et de norme constante.</p>`, { indice: 'Mouvement circulaire uniforme.' }),
      ] },

    /* ============================ EXERCICE 15 ============================ */
    { id: '15', groupe: 'mvt', titre: 'Exercice 15 : le saut en parachute', desc: 'Cinq phases d\'un saut : mouvements et vecteurs.',
      contexte: '<p class="er-contexte">Voici la représentation graphique de la vitesse de chute d\'un parachutiste lors d\'un saut complet. Le saut se déroule ainsi : le parachutiste sort de l\'avion et effectue une chute libre de 4&nbsp;000 m à 1&nbsp;000 m. À cette altitude, il ouvre son parachute et continue sa descente. À la fin de la descente, à quelques mètres du sol, il effectue une manœuvre de ses commandes afin d\'atterrir en douceur.</p>',
      figure: z => { z.innerHTML = window.FIG.parachute(); },
      parties: [
        choix('1. Repère les 5 phases sur le graphique. L\'ouverture du parachute (phase 3) correspond à l\'intervalle :', [o('ok', 'de 50 s à 55 s'), o('a', 'de 0 à quelques secondes'), o('b', 'de 55 s à 350 s'), o('c', 'à partir de 350 s')], 'ok',
          '<p>(1) de 0 à quelques secondes : chute libre accélérée, jusqu\'à 50 m·s⁻¹ ; (2) jusqu\'à 50 s : chute à vitesse constante (les frottements de l\'air compensent le poids) ; (3) de 50 à 55 s : décélération lors de l\'ouverture du parachute ; (4) de 55 à 350 s : chute à vitesse constante ; (5) à 350 s : manœuvre pour atterrir en douceur.</p>', { colonne: false, indice: 'L\'ouverture du parachute fait chuter brutalement la vitesse.' }),
        ...[['Phase 1 (de 0 à quelques secondes)', 'acc'], ['Phase 2 (jusqu\'à 50 s)', 'unif'], ['Phase 3 (de 50 s à 55 s)', 'ral'], ['Phase 4 (de 55 s à 350 s)', 'unif'], ['Phase 5 (à partir de 350 s)', 'ral']].map(([q, bonne], k) =>
          choix(`2. et 3. ${q} : nom du mouvement et vecteurs (le vecteur vitesse est vers le bas)`, MVT, bonne,
            `<p>${['Rectiligne accéléré : la vitesse augmente, a⃗ est vers le bas, comme v⃗.', 'Rectiligne uniforme : la vitesse est constante, a⃗ = 0⃗.', 'Rectiligne ralenti (décéléré) : la vitesse diminue, a⃗ est vers le haut, de sens contraire à v⃗.', 'Rectiligne uniforme : a⃗ = 0⃗.', 'Rectiligne ralenti : a⃗ vers le haut.'][k]}</p>`,
            { melanger: false, indice: 'Sur le graphique : la vitesse augmente, reste constante, ou diminue ?' })),
      ] },

    /* ============================ EXERCICE 16 ============================ */
    { id: '16', groupe: 'circ', titre: 'Exercice 16 : la grande roue', desc: 'Vitesse et accélération à partir des positions d\'une nacelle.',
      contexte: '<p class="er-contexte">On a représenté ci-dessous les positions consécutives d\'un point A d\'une nacelle d\'une grande roue dans un référentiel terrestre. L\'intervalle de temps séparant deux positions consécutives est <b>Δt = 10,0 s</b>.</p><p class="ph-donnees">Mesures faites sur la figure du livre (échelle : 1,0 cm ↔ 5,0 m) : A<sub>2</sub>A<sub>3</sub> = A<sub>3</sub>A<sub>4</sub> = 2,3 cm ; rayon de la roue sur la figure : 4,1 cm.</p>',
      figure: z => { z.innerHTML = window.FIG.grandeRoue(false); },
      parties: [
        nombre('1. Calculer la distance réelle A<sub>2</sub>A<sub>3</sub>.', 'A<sub>2</sub>A<sub>3</sub> =', 11.5, calc(`A<sub>2</sub>A<sub>3</sub> = 2,3 × 5,0 = ${c('11,5 m')}, car 1,0 cm sur le schéma correspond à 5,0 m`), { tol: .051, unite: 'm', indice: '1,0 cm ↔ 5,0 m.' }),
        nombre('1. Calculer la valeur de la vitesse v<sub>2</sub> au point A<sub>2</sub>.', 'v<sub>2</sub> =', 1.15, calc(`v<sub>2</sub> = ${fr('A<sub>2</sub>A<sub>3</sub>', 'Δt')} = ${fr('11,5', '10,0')} = ${c(`1,15 ${MS}`)} ; de même v<sub>3</sub> = ${fr('A<sub>3</sub>A<sub>4</sub>', 'Δt')} = 1,15 ${MS}. On représente les vitesses avec l'échelle 1 cm ↔ 1 ${MS} : flèches de 1,15 cm, tangentes au cercle.`),
          { tol: .006, unite: MS, indice: 'v₂ = A₂A₃ / Δt.', diag: v => (Math.abs(v - .23) < .01 ? 'Utilise la distance réelle (11,5 m), pas la mesure sur la figure.' : null) }),
        choix('2. Quelle est la nature du mouvement ?', [o('ok', 'circulaire uniforme'), o('a', 'rectiligne uniforme'), o('b', 'circulaire accéléré'), o('c', 'circulaire ralenti')], 'ok', '<p>Le mouvement est <b>circulaire uniforme</b> : la trajectoire est un cercle et la valeur de la vitesse est constante (v<sub>2</sub> = v<sub>3</sub>).</p>', { colonne: false, indice: 'Trajectoire ? Les positions sont-elles régulièrement espacées ?' }),
        nombre('3. On représente Δv⃗ = v⃗<sub>3</sub> − v⃗<sub>2</sub> au point A<sub>2</sub> (échelle 1 cm ↔ 1 m·s⁻¹) et on mesure une flèche de 0,7 cm. Quelle est la valeur Δv ?', 'Δv =', .7, calc(`Δv = ${c(`0,7 ${MS}`)}`) + window.FIG.grandeRoue(true),
          { tol: .051, unite: MS, indice: '1 cm ↔ 1 m·s⁻¹.' }),
        { type: 'sci', q: '4. En déduire la valeur de l\'accélération a<sub>2</sub> au point A<sub>2</sub>.', label: 'a<sub>2</sub> =', valeur: .07, cs: 2, unite: MS2, indice: 'a₂ = Δv / Δt.',
          correction: calc(`a<sub>2</sub> = ${fr('Δv', 'Δt')} = ${fr('0,7', '10,0')} = ${c(`7,0 × 10<sup>${M}2</sup> ${MS2}`)}`) },
        nombre('5. Calculer le rayon réel R de la trajectoire.', 'R =', 20.5, calc(`R = 4,1 × 5,0 = ${c('20,5 m')}`), { tol: .051, unite: 'm', indice: 'Rayon sur la figure : 4,1 cm, avec 1,0 cm ↔ 5,0 m.' }),
        { type: 'sci', q: '5. Calculer v²/R.', label: 'v²/R =', valeur: 1.15 * 1.15 / 20.5, cs: 2, unite: MS2, indice: 'v = 1,15 m·s⁻¹ et R = 20,5 m.',
          correction: calc(`${fr('v²', 'R')} = ${fr('1,15²', '20,5')} = ${c(`6,5 × 10<sup>${M}2</sup> ${MS2}`)} : on retrouve quasiment a<sub>2</sub> = v²/R (les mesures sur la figure ne sont pas très précises).`) },
      ] },
  ];

  window.CIN.EXERCICES = EXERCICES;
  window.CIN.GROUPES_EX = GROUPES_EX;
})();
