/* ============================================================
   Exercices du module 4 (application « Transport et distribution
   de l'électricité ») :
     - les exercices 8 à 12, 14, 16 et 17 du chapitre (p. 63-65),
       avec la même numérotation ;
     - les exercices de synthèse A à F : transformateurs + charge
       avec facteur de puissance et rendement (chapitres « Puissance
       active » et « Transport et distribution de l'électricité »).

   Chaque exercice : { id, groupe, titre, desc, contexte (HTML),
   figure(zone) (facultatif), parties: [p] } ; chaque partie suit
   le format de TE.PARTIES avec p.q (question) et p.correction
   (correction détaillée, toujours consultable).
   Une partie 'schema' commence la plupart des exercices : on place
   les valeurs de l'énoncé sur le schéma avant de calculer. Le schéma
   porte U, I et la puissance apparente S dans chaque partie (la même
   partout), P juste avant la charge, et les trois formules de chaque
   transformateur ; avant un calcul avec m, l'élève choisit laquelle
   des trois formules utiliser (SCH.choixFormule).
   ============================================================ */
(function () {
  'use strict';

  const { o, fmt, proche } = window.TE;
  const calc = h => `<p class="ph-calc">${h}</p>`;
  const c = h => `<span class="c">${h}</span>`;
  const sub = (x, i) => `${x}<sub>${i}</sub>`;
  const U = k => sub('U', k), I = k => sub('I', k), N = k => sub('N', k), m = k => sub('m', k);
  const PU = sub('P', 'u'), PP = sub('P', 'perdue');
  const rap = (h, b) => `<span class="te-rap"><span>${h}</span><span>${b}</span></span>`;
  const etiq = (id, label, cible, indice) => ({ id, label, cible, indice });
  // fabriques de parties
  const choix = (q, options, bonne, correction, opts) => Object.assign({ type: 'choix', q, options, bonne, correction, colonne: options.some(x => x.label.length > 24) }, opts);
  const nombre = (q, label, valeur, unite, correction, opts) => Object.assign({ type: 'nombre', q, label, valeur, unite, correction }, opts);
  const sci = (q, label, valeur, unite, correction, opts) => Object.assign({ type: 'sci', q, label, valeur, unite, correction, cs: 3, rel: .02 }, opts);
  const schema = (q, sch, etiquettes, correction) => ({ type: 'schema', q: q || 'Place les valeurs de l\'énoncé sur le schéma (les cases restées vides sont les inconnues).', schema: sch, etiquettes, correction });
  const ELEV = [o('elev', 'élévateur de tension'), o('abai', 'abaisseur de tension')];
  const RES3 = (val, charge, titres) => window.SCH.reseau(val, { charge, titres });
  const PARTIES_N = ['partie 1', 'partie 2', 'partie 3'];
  // laquelle des trois formules du transformateur utiliser ? (T : transformateur seul ; T1, T2 : chaîne)
  const T = (connues, cherche) => window.SCH.choixFormule({ a: 1, b: 2, connues, cherche });
  const T1 = (connues, cherche) => window.SCH.choixFormule({ a: 1, b: 2, m: m(1), nomTr: 'T<sub>1</sub>', connues, cherche });
  const T2 = (connues, cherche) => window.SCH.choixFormule({ a: 2, b: 3, m: m(2), prime: true, nomTr: 'T<sub>2</sub>', connues, cherche });
  // repérer la production, le transport et la distribution sur la chaîne (noms à placer)
  const reperage = charge => schema('Place le nom de chaque partie du réseau.',
    window.SCH.chaine({ etages: [1, 2, 3].map(k => ({ titre: 'partie ' + k, u: sub('u', k), lignes: [window.SCH.l('', window.SCH.slot('p' + k))] })),
      transfos: [{ nom: sub('T', 1) }, { nom: sub('T', 2) }], charge: { nom: charge }, aria: 'Chaîne : partie 1, transformateur T1, partie 2, transformateur T2, partie 3, charge' }), [
      etiq('p', 'production', 'p1', 'La centrale <b>produit</b> l\'électricité : c\'est le début de la chaîne, avant l\'élévateur T<sub>1</sub>.'),
      etiq('t', 'transport', 'p2', 'Entre T<sub>1</sub> et T<sub>2</sub>, la très haute tension sert à <b>transporter</b> l\'électricité sur de longues distances.'),
      etiq('d', 'distribution', 'p3', 'Après l\'abaisseur T<sub>2</sub>, on <b>distribue</b> l\'électricité aux utilisateurs.')],
    '<p>Partie 1 : <b>production</b> (centrale) ; partie 2 : <b>transport</b> (très haute tension) ; partie 3 : <b>distribution</b> (vers les utilisateurs).</p>');

  // tableau des effets du courant (exercice 14)
  const EFFETS = `<div class="te-defile"><table class="te-tab">
    <tr><th>Intensité minimale du courant</th><th>Effet physiologique</th></tr>
    <tr><td>0,5 mA</td><td>sensations très faibles</td></tr><tr><td>10 mA</td><td>contraction musculaire, seuil de non-lâcher</td></tr>
    <tr><td>30 mA – 3 min</td><td>seuil de paralysie respiratoire</td></tr><tr><td>50 mA – 1 s ; 40 mA – 3 s</td><td>seuil de fibrillation cardiaque irréversible</td></tr>
    <tr><td>1 A</td><td>arrêt du cœur</td></tr></table></div>`;

  // graphique de l'exercice 14 : résistance du corps humain en fonction de la tension de contact (peau sèche)
  function grapheR() {
    const P = [[0, 3.1], [25, 2.5], [50, 2], [100, 1.45], [150, 1.2], [200, 1.07], [230, 1], [270, .94]];
    const X = u => 46 + u * 1.25, Y = r => 220 - r * 60;
    // courbe lissée (Catmull-Rom) passant par les points
    let d = `M${X(P[0][0])},${Y(P[0][1])}`;
    for (let i = 0; i < P.length - 1; i++) {
      const p0 = P[Math.max(0, i - 1)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(P.length - 1, i + 2)];
      d += ` C${X(p1[0] + (p2[0] - p0[0]) / 6)},${Y(p1[1] + (p2[1] - p0[1]) / 6)} ${X(p2[0] - (p3[0] - p1[0]) / 6)},${Y(p2[1] - (p3[1] - p1[1]) / 6)} ${X(p2[0])},${Y(p2[1])}`;
    }
    let g = '';
    for (let u = 0; u <= 250; u += 25) g += `<line x1="${X(u)}" y1="${Y(0)}" x2="${X(u)}" y2="${Y(3.25)}" stroke="#dfdbd2" stroke-dasharray="2 3"/>`;
    for (let r = 0.5; r <= 3; r += .5) g += `<line x1="${X(0)}" y1="${Y(r)}" x2="${X(270)}" y2="${Y(r)}" stroke="#dfdbd2" stroke-dasharray="2 3"/>`;
    const tx = (x, y, t, a) => `<text x="${x}" y="${y}" font-size="13" text-anchor="${a || 'middle'}" fill="#16181d">${t}</text>`;
    return `<svg class="te-fig" viewBox="0 0 410 250" style="max-width:480px" role="img" aria-label="Résistance du corps humain en kilo-ohms en fonction de la tension de contact en volts : 3 kΩ à 0 V, 2,5 kΩ à 25 V, 2 kΩ à 50 V, environ 1 kΩ vers 230 V">
      ${g}
      <line x1="${X(0)}" y1="${Y(0)}" x2="${X(275)}" y2="${Y(0)}" stroke="#16181d" stroke-width="1.6"/><path d="M${X(275) + 8},${Y(0)} l-9,-4 v8 z" fill="#16181d"/>
      <line x1="${X(0)}" y1="${Y(0)}" x2="${X(0)}" y2="${Y(3.4)}" stroke="#16181d" stroke-width="1.6"/><path d="M${X(0)},${Y(3.4) - 8} l-4,9 h8 z" fill="#16181d"/>
      ${[0, 25, 50, 100, 150, 200, 250].map(u => tx(X(u), Y(0) + 17, u)).join('')}${tx(X(275) + 4, Y(0) - 8, 'U (V)', 'end')}
      ${[0.5, 1, 1.5, 2, 2.5, 3].map(r => tx(X(0) - 8, Y(r) + 4, fmt(r), 'end')).join('')}${tx(X(0) + 8, Y(3.4) - 2, 'R (kΩ)', 'start')}
      <path d="${d}" fill="none" stroke="#5a3fc4" stroke-width="2.6"/>
      <path d="M${X(25)},${Y(0)} V${Y(2.5)} H${X(0)} M${X(50)},${Y(0)} V${Y(2)} H${X(0)}" fill="none" stroke="#55585f" stroke-width="1.2" stroke-dasharray="4 3"/>
      ${tx(X(170), Y(2.75), 'peau sèche', 'middle')}
    </svg>`;
  }

  const GROUPES_EX = [
    { id: 'transfo', titre: 'Transformateur et transport (exercices 8 à 11)' },
    { id: 'protec', titre: 'Puissance et protection (exercices 12, 14, 16, 17)' },
    { id: 'synth', titre: 'Synthèse : puissance active et transport (exercices A à F)' },
  ];

  const EXERCICES = [

    /* ============================ EXERCICE 8 ============================ */
    { id: '8', groupe: 'transfo', titre: 'Exercice 8 : transport sous haute tension', desc: 'Centrale nucléaire : 20 kV → 400 kV, 800 kW.',
      contexte: '<p class="er-contexte">À la sortie d\'une centrale nucléaire, un transformateur va faire passer la tension d\'environ 20 kV à 400 kV pour être injectée sur le réseau de transport d\'électricité. La puissance à l\'entrée du transformateur est de 800 kW.</p>',
      parties: [
        schema(null, window.SCH.transfo1({ U1: '#U1', I1: '?', S1: '#S', U2: '#U2', I2: '?', S2: '?', m: '?' }), [
          etiq('a', '20 kV', 'U1', 'La tension d\'entrée est au primaire.'), etiq('b', '400 kV', 'U2', 'La tension de sortie est au secondaire.'), etiq('c', '800 kW', 'S', 'La puissance est donnée à l\'entrée du transformateur : elle se place avec U<sub>1</sub> et I<sub>1</sub>.')],
          `<p>Primaire : ${U(1)} = 20 kV et la puissance S = 800 kW ; secondaire : ${U(2)} = 400 kV. Le transformateur ne perd pas de puissance : on retrouve la même puissance S au secondaire. Les trois formules de m sont sous le transformateur.</p>`),
        nombre('a. Déterminer le courant à l\'entrée du transformateur.', `${I(1)} =`, 40, 'A', calc(`S = ${U(1)} × ${I(1)} donc ${I(1)} = ${rap('S', U(1))} = ${rap('800 × 10<sup>3</sup>', '20 × 10<sup>3</sup>')} = ${c('40 A')}`),
          { diag: v => proche(v, .04) || proche(v, 40000) ? 'Convertis : 800 kW = 800 000 W et 20 kV = 20 000 V.' : `${I(1)} = S / ${U(1)}.` }),
        T(['U1', 'U2', 'S1', 'I1'], 'm'),
        nombre('b. Calculer le rapport de transformation de ce transformateur.', 'm =', 20, '', calc(`m = ${rap(U(2), U(1))} = ${rap('400', '20')} = ${c('20')} (la tension est multipliée par 20)`),
          { diag: v => proche(v, .05) ? `m = ${U(2)} / ${U(1)} (sortie sur entrée).` : `m = ${U(2)} / ${U(1)}.` }),
        T(['U1', 'U2', 'I1', 'm'], 'I2'),
        nombre('c. En déduire le courant de sortie.', `${I(2)} =`, 2, 'A', calc(`m = ${rap(I(1), I(2))} donc ${I(2)} = ${rap(I(1), 'm')} = ${rap('40', '20')} = ${c('2 A')}`) + '<p>(ou avec la même puissance S au secondaire : S = U<sub>2</sub> × I<sub>2</sub>, donc I<sub>2</sub> = 800 000 / 400 000 = 2 A.)</p>',
          { diag: v => proche(v, 800) ? `Relation à l'envers : m = ${I(1)} / ${I(2)}, donc ${I(2)} = ${I(1)} / m.` : `${I(2)} = ${I(1)} / m.` }),
        choix('d. Rappeler la relation permettant de déterminer la puissance dissipée par effet Joule dans un dipôle ohmique de résistance R.', [o('ok', 'P<sub>J</sub> = R × I<sup>2</sup>'), o('a', 'P<sub>J</sub> = R × I'), o('b', 'P<sub>J</sub> = U × I'), o('c', 'P<sub>J</sub> = R / I<sup>2</sup>')], 'ok',
          '<p>P<sub>J</sub> = R × I<sup>2</sup>.</p>', { indice: 'L\'intensité est au carré.' }),
        choix('e. Justifier l\'intérêt de transporter l\'énergie électrique sous haute tension.', [o('ok', 'sous haute tension, l\'intensité est plus faible, donc les pertes par effet Joule sont plus faibles'), o('a', 'sous haute tension, l\'intensité est plus grande, donc on transporte plus d\'énergie'), o('b', 'la haute tension est moins dangereuse')], 'ok',
          '<p>Sous haute tension, l\'intensité est plus faible (2 A au lieu de 40 A), donc les pertes par effet Joule R × I<sup>2</sup> sont plus faibles (divisées par 20<sup>2</sup> = 400).</p>', { indice: 'Compare les intensités à l\'entrée et à la sortie.' }),
        choix('f. Entre quelles parties du réseau électrique ce transformateur est-il placé ?', [o('ok', 'entre la production et le transport'), o('a', 'entre le transport et la distribution'), o('b', 'entre la production et la distribution')], 'ok',
          '<p>Il est à la sortie de la centrale (<b>production</b>, 20 kV) et élève la tension pour le réseau de <b>transport</b> (400 kV).</p>', { melanger: false, indice: 'Il est à la sortie de la centrale, et la tension de sortie est injectée sur le réseau de transport.', indices: { a: 'Le transport se fait sous 400 kV : ce transformateur fabrique cette très haute tension, il est donc avant le transport.', b: 'La distribution se fait sous basse tension (230 V) ; ici, la tension de sortie est 400 kV.' } }),
      ] },

    /* ============================ EXERCICE 9 ============================ */
    { id: '9', groupe: 'transfo', titre: 'Exercice 9 : chaîne de distribution', desc: '10 kV, 400 kV, 230 V : charge résistive, puis moteur (k = 0,8).',
      contexte: '<p class="er-contexte">On symbolise la chaîne de distribution électrique par le schéma ci-dessous. Les tensions efficaces sont : 10 kV au primaire de T<sub>1</sub> ; 400 kV au secondaire de T<sub>1</sub> ; 230 V au secondaire de T<sub>2</sub>. On alimente d\'abord une charge résistive de puissance 2 600 W.</p>',
      parties: [
        schema(null, RES3({ U1: '#U1', I1: '?', S1: '?', m1: '?', U2: '#U2', I2: '?', S2: '?', m2: '?', U3: '#U3', I3: '?', S3: '?', P: '#P', k: '?' }, 'charge', PARTIES_N), [
          etiq('a', '10 kV', 'U1', 'Le primaire de T<sub>1</sub> : partie 1.'), etiq('b', '400 kV', 'U2', 'Le secondaire de T<sub>1</sub> est aussi le primaire de T<sub>2</sub> : partie 2.'), etiq('c', '230 V', 'U3', 'Le secondaire de T<sub>2</sub> alimente la charge : partie 3.'), etiq('d', '2 600 W', 'P', 'La puissance de la charge résistive est sa puissance active : elle se place juste avant la charge.')],
          `<p>${U(1)} = 10 kV ; ${U(2)} = 400 kV ; ${U(3)} = 230 V ; P = 2 600 W juste avant la charge. La puissance apparente S est la même dans les trois parties ; les trois formules de ${m(1)} et de ${m(2)} sont sous T<sub>1</sub> et T<sub>2</sub>.</p>`),
        choix('a. Quel qualificatif convient à la partie 1 (avant T<sub>1</sub>) ?', [o('prod', 'production'), o('tr', 'transport'), o('dist', 'distribution')], 'prod', '<p>Partie 1 : <b>production</b> (centrale, 10 kV).</p>', { melanger: false, indice: 'C\'est là que se trouve la centrale.' }),
        choix('Et à la partie 2 (entre T<sub>1</sub> et T<sub>2</sub>) ?', [o('prod', 'production'), o('tr', 'transport'), o('dist', 'distribution')], 'tr', '<p>Partie 2 : <b>transport</b> (lignes à 400 kV).</p>', { melanger: false, indice: 'La très haute tension sert à transporter l\'électricité sur de grandes distances.' }),
        choix('Et à la partie 3 (après T<sub>2</sub>) ?', [o('prod', 'production'), o('tr', 'transport'), o('dist', 'distribution')], 'dist', '<p>Partie 3 : <b>distribution</b> (230 V, chez les utilisateurs).</p>', { melanger: false, indice: 'On amène l\'électricité aux utilisateurs.' }),
        choix('b. Comment se nomment les éléments T<sub>1</sub> et T<sub>2</sub> ?', [o('ok', 'des transformateurs'), o('a', 'des alternateurs'), o('b', 'des disjoncteurs')], 'ok', '<p>T<sub>1</sub> et T<sub>2</sub> sont des transformateurs (T<sub>1</sub> élévateur, T<sub>2</sub> abaisseur).</p>', { indice: 'Ils changent la valeur de la tension.' }),
        T1(['U1', 'U2'], 'm'),
        nombre(`c. Déterminer le rapport de transformation ${m(1)} de T<sub>1</sub>.`, `${m(1)} =`, 40, '', calc(`${m(1)} = ${rap(U(2), U(1))} = ${rap('400', '10')} = ${c('40')}`), { diag: v => proche(v, .025) ? `${m(1)} = ${U(2)} / ${U(1)}.` : `${m(1)} = ${U(2)} / ${U(1)}.` }),
        T2(['U2', 'U3'], 'm'),
        sci(`Déterminer le rapport de transformation ${m(2)} de T<sub>2</sub>.`, `${m(2)} =`, 230 / 400000, '', calc(`${m(2)} = ${rap(U(3), U(2))} = ${rap('230', '400 × 10<sup>3</sup>')} = ${c('5,75 × 10<sup>−4</sup>')}`), { diag: v => proche(v, 400000 / 230, .03) ? `${m(2)} = ${U(3)} / ${U(2)} (sortie de T<sub>2</sub> sur entrée).` : 'Écris 400 kV en volts : 400 000 V.' }),
        nombre('d. Rappeler la valeur du facteur de puissance d\'une charge résistive.', 'k =', 1, '', '<p>Pour une charge résistive, φ = 0 et <b>k = cos φ = 1</b>.</p>', { diag: () => 'Pour une charge résistive, u et i sont en phase : φ = 0.' }),
        nombre('e. Déterminer l\'intensité du courant circulant dans le câble d\'alimentation de la charge.', `${I(3)} =`, 2600 / 230, 'A', calc(`k = 1 donc P = S = ${U(3)} × ${I(3)} ; ${I(3)} = ${rap('2 600', '230')} = ${c('11,3 A')}`), { rel: .01, diag: () => `k = 1 donc S = P, puis ${I(3)} = S / ${U(3)}.` }),
        T2(['U2', 'U3', 'I3', 'm'], 'I2'),
        sci(`f. En déduire le courant ${I(2)} circulant dans les câbles entre les éléments T<sub>1</sub> et T<sub>2</sub>.`, `${I(2)} =`, 230 / 400000 * 2600 / 230, 'A', calc(`${m(2)} = ${rap(I(2), I(3))} donc ${I(2)} = ${m(2)} × ${I(3)} = 5,75 × 10<sup>−4</sup> × 11,3 = ${c('6,50 × 10<sup>−3</sup> A')}`) + `<p>(ou avec la même puissance S partout : ${I(2)} = ${rap('S', U(2))} = ${rap('2 600', '400 000')} = 6,50 × 10<sup>−3</sup> A.)</p>`, { diag: v => proche(v, 11.3 / 5.75e-4, .03) ? `Relation à l'envers : ${m(2)} = ${I(2)} / ${I(3)}, donc ${I(2)} = ${m(2)} × ${I(3)}.` : `${I(2)} = ${m(2)} × ${I(3)}.` }),
        nombre('g. La charge est à présent un moteur de puissance active 2 600 W et de facteur de puissance k = 0,8. Déterminer la puissance apparente consommée par le moteur.', 'S =', 3250, 'VA', calc(`S = ${rap('P', 'k')} = ${rap('2 600', '0,8')} = ${c('3 250 VA')}`), { diag: v => proche(v, 2080) ? 'k = P / S, donc S = P / k.' : 'S = P / k.' }),
        nombre('h. En déduire l\'intensité du courant circulant dans le câble d\'alimentation de la charge.', `${I(3)} =`, 3250 / 230, 'A', calc(`S = ${U(3)} × ${I(3)} donc ${I(3)} = ${rap('3 250', '230')} = ${c('14,1 A')}`), { rel: .01, diag: v => proche(v, 11.3, .01) ? 'Avec le moteur, c\'est S (et non P) qui donne l\'intensité.' : `${I(3)} = S / ${U(3)}.` }),
        T2(['U2', 'U3', 'I3', 'm'], 'I2'),
        sci(`i. En déduire le courant ${I(2)} circulant dans les câbles entre T<sub>1</sub> et T<sub>2</sub>.`, `${I(2)} =`, 230 / 400000 * 3250 / 230, 'A', calc(`${I(2)} = ${m(2)} × ${I(3)} = 5,75 × 10<sup>−4</sup> × 14,1 = ${c('8,1 × 10<sup>−3</sup> A')}`) + `<p>(ou ${I(2)} = ${rap('S', U(2))} = ${rap('3 250', '400 000')} ≈ 8,1 × 10<sup>−3</sup> A.)</p>`, { diag: () => `${I(2)} = ${m(2)} × ${I(3)}.` }),
        choix('j. Par comparaison des résultats e et h : « Plus le facteur de puissance de la charge est faible, plus les pertes dans les lignes d\'alimentation sont… »', [o('ok', 'grandes'), o('a', 'petites')], 'ok',
          '<p>Plus le facteur de puissance est faible, plus les pertes dans les lignes sont <b>grandes</b> : I<sub>2</sub> passe de 6,5 mA à 8,1 mA, et P<sub>J</sub> = R × I<sup>2</sup>.</p>', { melanger: false, indice: 'Compare les intensités dans les lignes avec la charge résistive et avec le moteur.' }),
      ] },

    /* ============================ EXERCICE 10 ============================ */
    { id: '10', groupe: 'transfo', titre: 'Exercice 10 : transformateur', desc: 'Plaque signalétique 5 V / 20 V ; 400 spires au primaire.',
      contexte: '<p class="er-contexte">La plaque signalétique d\'un transformateur donne les indications suivantes : tension au primaire U<sub>1</sub> = 5 V ; tension au secondaire U<sub>2</sub> = 20 V ; fréquence f = 50 Hz. L\'enroulement au primaire de ce transformateur, supposé parfait, comporte 400 spires.</p>',
      parties: [
        schema(null, window.SCH.transfo1({ U1: '#U1', I1: '?', S1: '?', N1: '#N1', U2: '#U2', I2: '?', S2: '?', N2: '?', m: '?' }), [
          etiq('a', '5 V', 'U1', 'Tension au primaire.'), etiq('b', '20 V', 'U2', 'Tension au secondaire.'), etiq('c', '400 spires', 'N1', 'L\'enroulement au primaire.')]),
        choix('a. Ce transformateur est-il utilisé en abaisseur ou en élévateur de tension ?', ELEV, 'elev', `<p>C'est un <b>élévateur</b> de tension car ${U(2)} &gt; ${U(1)}.</p>`, { melanger: false, indice: `Compare ${U(2)} et ${U(1)}.` }),
        T(['U1', 'U2', 'N1'], 'm'),
        nombre('b. Calculer m, le rapport de transformation du transformateur.', 'm =', 4, '', calc(`m = ${rap(U(2), U(1))} = ${rap('20', '5')} = ${c('4')}`), { diag: v => proche(v, .25) ? `m = ${U(2)} / ${U(1)}.` : `m = ${U(2)} / ${U(1)}.` }),
        T(['U1', 'U2', 'N1', 'm'], 'N2'),
        nombre('c. Déterminer le nombre de spires de l\'enroulement au secondaire.', `${N(2)} =`, 1600, 'spires', calc(`m = ${rap(N(2), N(1))} donc ${N(2)} = m × ${N(1)} = 4 × 400 = ${c('1 600 spires')}`), { diag: v => proche(v, 100) ? `${N(2)} = m × ${N(1)}.` : `${N(2)} = m × ${N(1)}.` }),
      ] },

    /* ============================ EXERCICE 11 ============================ */
    { id: '11', groupe: 'transfo', titre: 'Exercice 11 : rapports de transformation', desc: 'Transformateur 225 kV / 63 kV ; plaque 230 V / 48 V.',
      contexte: '<p class="er-contexte"><b>1.</b> Le transformateur 225 kV / 63 kV peut abaisser une tension de 225 kV à 63 kV ou réaliser l\'opération inverse.<br><b>2.</b> La plaque signalétique d\'un transformateur monophasé indique : tension au primaire 230 V ; tension au secondaire 48 V.</p>',
      parties: [
        choix('1. a. Quelle est la tension d\'entrée de ce transformateur lorsqu\'il fonctionne en élévateur de tension ?', [o('ok', '63 kV'), o('a', '225 kV')], 'ok', '<p>En élévateur, la tension d\'entrée est la plus petite : U<sub>e</sub> = 63 kV.</p>', { melanger: false, indice: 'Un élévateur fait passer la tension de la plus petite à la plus grande.' }),
        nombre('En déduire son rapport de transformation (arrondi à 0,1).', 'm =', 3.6, '', calc(`m = ${rap('U<sub>s</sub>', 'U<sub>e</sub>')} = ${rap('225', '63')} ≈ ${c('3,6')}`), { tol: .051, diag: v => proche(v, .28, .03) ? 'En élévateur, m &gt; 1 : m = 225 / 63.' : 'm = U<sub>s</sub> / U<sub>e</sub>.' }),
        choix('b. Quelle est la tension de sortie lorsqu\'il fonctionne en abaisseur de tension ?', [o('ok', '63 kV'), o('a', '225 kV')], 'ok', '<p>En abaisseur, la tension de sortie est la plus petite : U<sub>s</sub> = 63 kV.</p>', { melanger: false, indice: 'Un abaisseur diminue la tension.' }),
        nombre('En déduire son rapport de transformation (arrondi à 0,01).', 'm =', 0.28, '', calc(`m = ${rap('63', '225')} = ${c('0,28')}`), { tol: .006, diag: v => proche(v, 3.57, .03) ? 'En abaisseur, m &lt; 1 : m = 63 / 225.' : 'm = U<sub>s</sub> / U<sub>e</sub>.' }),
        nombre('c. Lorsque la tension d\'entrée est de 225 kV, le courant d\'entrée peut atteindre 444 A. Calculer le courant de sortie.', 'I<sub>s</sub> =', 1586, 'A', calc(`m = ${rap('I<sub>e</sub>', 'I<sub>s</sub>')} donc I<sub>s</sub> = ${rap('I<sub>e</sub>', 'm')} = ${rap('444', '0,28')} ≈ ${c('1 586 A')}`), { rel: .01, diag: v => proche(v, 124, .03) ? 'Relation à l\'envers : I<sub>s</sub> = I<sub>e</sub> / m (la tension baisse, l\'intensité augmente).' : 'I<sub>s</sub> = I<sub>e</sub> / m.' }),
        nombre('2. a. Calculer le rapport de transformation de ce transformateur (arrondir le résultat à 0,1 près).', 'm =', 0.2, '', calc(`m = ${rap('48', '230')} ≈ ${c('0,2')}`), { tol: .011, diag: v => proche(v, 4.8, .03) ? `m = ${U(2)} / ${U(1)}.` : `m = ${U(2)} / ${U(1)}.` }),
        nombre('b. L\'enroulement secondaire possède 120 spires. Calculer le nombre de spires de l\'enroulement primaire.', `${N(1)} =`, 600, 'spires', calc(`m = ${rap(N(2), N(1))} donc ${N(1)} = ${rap(N(2), 'm')} = ${rap('120', '0,2')} = ${c('600 spires')}`) + '<p>(Avec la valeur non arrondie m = 48 / 230, on trouve 575 spires.)</p>', { rel: .05, diag: v => proche(v, 24, .05) ? `${N(1)} = ${N(2)} / m.` : `m = ${N(2)} / ${N(1)}, donc ${N(1)} = ${N(2)} / m.` }),
      ] },

    /* ============================ EXERCICE 12 ============================ */
    { id: '12', groupe: 'protec', titre: 'Exercice 12 : four', desc: 'Plaque signalétique 230 V ~ 50 Hz 2 600 W ; fusible de 16 A.',
      contexte: '<p class="er-contexte">Un four possède les caractéristiques ci-dessous.</p><div class="te-plaque"><p class="te-plaque-t">Plaque signalétique</p><p>Mod. LSL 150 — Type PS41212</p><p>230 V ~50 Hz 2 600 W — 16 A</p><p>Charge nominale 5 kg</p></div>',
      parties: [
        nombre('a. Quelle est la puissance électrique consommée par le four en pleine puissance ?', 'P =', 2600, 'W', '<p>P = 2 600 W (puissance indiquée sur la plaque).</p>', { diag: () => 'Lis la puissance (en W) sur la plaque.' }),
        nombre('b. En déduire le courant efficace absorbé lors d\'une utilisation en pleine puissance.', 'I =', 2600 / 230, 'A', calc(`C'est un four électrique (une résistance) : φ = 0 et k = 1, donc S = P = 2 600 VA.<br>S = U × I donc I = ${rap('S', 'U')} = ${rap('2 600', '230')} = ${c('11,3 A')}`), { rel: .01, diag: () => 'Four résistif : k = 1, S = P, puis I = S / U.' }),
        nombre('c. Rappeler la relation entre courant efficace et courant maximal. En déduire le courant maximal absorbé.', 'I<sub>max</sub> =', 16, 'A', calc(`I<sub>eff</sub> = ${rap('I<sub>max</sub>', '√2')} donc I<sub>max</sub> = √2 × I<sub>eff</sub> = √2 × 11,3 = ${c('16,0 A')}`), { rel: .01, diag: v => proche(v, 8, .03) ? 'I<sub>max</sub> = √2 × I<sub>eff</sub> (on multiplie).' : 'I<sub>max</sub> = √2 × I<sub>eff</sub>.' }),
        choix('d. Le fusible de 16 A dont est équipé le four est-il adapté ?', [o('ok', 'oui, il est tout juste adapté'), o('a', 'non, il fond dès qu\'on allume le four'), o('b', 'non, il faudrait un fusible de 2 600 A')], 'ok', '<p>Le fusible est <b>tout juste adapté</b> : l\'intensité ne dépasse pas 16 A.</p>', { indice: 'Compare l\'intensité du four au calibre du fusible.' }),
      ] },

    /* ============================ EXERCICE 14 ============================ */
    { id: '14', groupe: 'protec', titre: 'Exercice 14 : résistance du corps humain', desc: 'Lecture graphique, courant dans le corps, très basse tension.',
      contexte: `<p class="er-contexte">Le graphique donne la résistance du corps humain en fonction de la tension de contact (peau sèche). Le tableau donne les effets physiologiques du passage du courant.</p>`,
      figure: z => { z.innerHTML = `<div class="te-fig-cadre te-fig-etroite">${grapheR()}</div>${EFFETS}`; },
      parties: [
        nombre('a. D\'après le graphique, quelle est la valeur de la résistance du corps humain soumis à la tension du secteur (230 V) ?', 'R =', 1, 'kΩ', '<p>Soumis à 230 V, la résistance du corps humain est d\'environ <b>R = 1 kΩ</b>.</p>', { tol: .15, diag: () => 'Place-toi à U = 230 V sur l\'axe horizontal, monte jusqu\'à la courbe, puis lis R.' }),
        nombre('b. En déduire le courant qui traverse le corps humain, en supposant qu\'il se comporte comme un conducteur ohmique (en mA).', 'I =', 230, 'mA', calc(`U = R × I donc I = ${rap('U', 'R')} = ${rap('230', '1 × 10<sup>3</sup>')} = 0,23 A = ${c('230 mA')}`), { diag: v => proche(v, .23) ? 'Exprime le résultat en milliampères.' : 'I = U / R, avec R = 1 000 Ω.' }),
        choix('c. En vous appuyant sur le tableau, quel est l\'effet de ce courant ?', [o('ok', 'il dépasse le seuil de fibrillation cardiaque : il est dangereux, voire mortel'), o('a', 'il ne provoque qu\'une sensation très faible'), o('b', 'il est juste au seuil de non-lâcher')], 'ok', '<p>230 mA est bien au-dessus du seuil de fibrillation cardiaque (40 à 50 mA) : ce courant est <b>dangereux</b>.</p>', { indice: 'Compare 230 mA aux valeurs du tableau.' }),
        nombre('d. Reprendre les questions pour une très basse tension U = 50 V. Résistance du corps :', 'R =', 2, 'kΩ', '<p>Pour U = 50 V, on lit R = 2 kΩ.</p>', { tol: .15, diag: () => 'Lis R pour U = 50 V (pointillés).' }),
        nombre('Courant qui traverse le corps (en mA) :', 'I =', 25, 'mA', calc(`I = ${rap('50', '2 × 10<sup>3</sup>')} = 0,025 A = ${c('25 mA')}`), { diag: v => proche(v, .025) ? 'Exprime le résultat en milliampères.' : 'I = U / R, avec R = 2 000 Ω.' }),
        choix('Que pensez-vous de l\'affirmation : « Travailler en très basse tension permet de protéger les personnes contre les risques électriques » ?', [o('ok', 'elle est fausse pour 50 V : 25 mA dépasse le seuil de non-lâcher'), o('a', 'elle est vraie : 50 V ne présente aucun danger'), o('b', 'elle est vraie : 25 mA arrête le cœur')], 'ok', '<p>25 mA dépasse le seuil de non-lâcher (10 mA) : 50 V n\'est pas assez bas pour protéger les personnes.</p>', { indice: 'Compare 25 mA au tableau.' }),
      ] },

    /* ============================ EXERCICE 16 ============================ */
    { id: '16', groupe: 'protec', titre: 'Exercice 16 : tableau électrique', desc: 'Différentiel 30 mA, disjoncteurs, section des fils.',
      contexte: '<p class="er-contexte">Le document ci-dessous correspond au tableau électrique d\'une installation domestique (première rangée : 30 mA ; 32 A ; 20 A ; 20 A ; 16 A ; 16 A ; 16 A ; 10 A ; 10 A).</p>',
      figure: z => { z.innerHTML = window.SCH.tableau(); },
      parties: [
        choix('a. À partir de quelle valeur d\'intensité de courant se déclenche le disjoncteur différentiel ?', [o('ok', '30 mA'), o('a', '40 A'), o('b', '32 A'), o('c', '10 A')], 'ok', '<p><b>30 mA</b> (courant de fuite).</p>', { indice: 'C\'est la valeur en milliampères.' }),
        choix('b. Quel est son rôle ?', [o('ok', 'protéger les personnes'), o('a', 'protéger les biens contre les surintensités'), o('b', 'abaisser la tension')], 'ok', '<p>Le disjoncteur différentiel <b>protège les personnes</b> : il coupe s\'il détecte une fuite de courant.</p>', { indice: '30 mA est le seuil de paralysie respiratoire.' }),
        choix('c. Comment se nomme l\'élément de protection relié aux appareils électriques ?', [o('ok', 'un disjoncteur'), o('a', 'un disjoncteur différentiel'), o('b', 'un transformateur')], 'ok', '<p>Un <b>disjoncteur</b> (divisionnaire), un par circuit.</p>', { indice: 'Il y en a un par circuit, avec un calibre en ampères.' }),
        choix('d. Quel est son rôle ?', [o('ok', 'éviter les surintensités dans les appareils et les fils (risque d\'incendie)'), o('a', 'protéger les personnes contre les fuites de courant'), o('b', 'augmenter l\'intensité disponible')], 'ok', '<p>Il évite les surintensités (risque d\'incendie) : il <b>protège les biens</b>.</p>', { indice: 'Il coupe quand l\'intensité dépasse son calibre.' }),
        nombre('e. Jusqu\'à quelle valeur d\'intensité de courant a-t-on accès à la sortie d\'une prise de courant ?', 'I =', 16, 'A', '<p>Les prises sont protégées par des disjoncteurs de <b>16 A</b>.</p>', { diag: () => 'Lis le calibre du disjoncteur des prises.' }),
        choix('f. Pourquoi la section du fil alimentant une table de cuisson est-elle plus importante que les autres ?', [o('ok', 'pour permettre le passage d\'un courant plus important'), o('a', 'parce que la tension y est plus grande'), o('b', 'pour protéger les personnes')], 'ok', '<p>La section est plus grande pour permettre le passage d\'un <b>courant plus important</b> (32 A) sans que le fil chauffe trop.</p>', { indice: 'Pense au calibre de son disjoncteur et à l\'effet Joule.' }),
      ] },

    /* ============================ EXERCICE 17 ============================ */
    { id: '17', groupe: 'protec', titre: 'Exercice 17 : usage d\'une multiprise', desc: 'Grille-pain (3,5 A) et bouilloire (6,5 A) ; fusible de 25 A.',
      contexte: '<p class="er-contexte">À l\'aide d\'une multiprise, on branche simultanément deux appareils : un grille-pain (230 V – 3,5 A) et une bouilloire (230 V – 6,5 A).</p>',
      parties: [
        choix('a. Que signifient les valeurs (x V – y A) ?', [o('ok', 'x : tension de fonctionnement ; y : intensité (efficace) de fonctionnement'), o('a', 'x : puissance ; y : tension'), o('b', 'x : tension maximale ; y : intensité maximale instantanée')], 'ok', '<p>x V : tension de fonctionnement ; y A : intensité de fonctionnement (valeurs efficaces).</p>', { indice: 'V pour volts, A pour ampères.' }),
        choix('b. Branchés sur une multiprise, ces deux appareils sont-ils en série ou en dérivation ?', [o('ok', 'en dérivation'), o('a', 'en série')], 'ok', '<p>En <b>dérivation</b> : chacun reçoit les 230 V de la prise.</p>', { melanger: false, indice: 'Chaque appareil reçoit 230 V.' }),
        nombre('c. Déterminer la valeur du courant sortant de la prise lorsque ces deux appareils fonctionnent simultanément.', 'I =', 10, 'A', calc(`I = 3,5 + 6,5 = ${c('10 A')}`), { diag: () => 'En dérivation, les intensités s\'additionnent.' }),
        choix('d. Sachant qu\'un fusible de 25 A protège la prise, peut-on faire fonctionner les appareils simultanément à pleine puissance ?', [o('ok', 'oui, car 10 A &lt; 25 A'), o('a', 'non, car 10 A &lt; 25 A')], 'ok', '<p>25 A &gt; 10 A : <b>on peut</b> les faire fonctionner simultanément.</p>', { indice: 'Le fusible fond si l\'intensité dépasse 25 A.' }),
      ] },

    /* ============================ SYNTHÈSE A ============================ */
    { id: 'A', groupe: 'synth', titre: 'Exercice A : alimenter un radiateur', desc: '20 kV, 400 kV, 230 V ; radiateur de 2 300 W.',
      contexte: '<p class="er-contexte">Une centrale produit l\'électricité sous 20 kV. Le transformateur T<sub>1</sub> élève la tension à 400 kV pour le transport ; le transformateur T<sub>2</sub> l\'abaisse à 230 V. On alimente un radiateur (charge résistive) de puissance 2 300 W.</p>',
      parties: [
        reperage('radiateur'),
        schema(null, RES3({ U1: '#U1', I1: '?', S1: '?', m1: '?', U2: '#U2', I2: '?', S2: '?', m2: '?', U3: '#U3', I3: '?', S3: '?', P: '#P', k: '#k' }, 'radiateur'), [
          etiq('a', '20 kV', 'U1', 'La centrale : la production.'), etiq('b', '400 kV', 'U2', 'Le transport, entre T<sub>1</sub> et T<sub>2</sub>.'), etiq('c', '230 V', 'U3', 'La distribution, après T<sub>2</sub>.'), etiq('d', '2 300 W', 'P', 'Puissance active du radiateur, juste avant la charge.'), etiq('e', '1', 'k', 'Charge résistive : k = 1.')]),
        T1(['U1', 'U2'], 'm'),
        nombre(`Calcule ${m(1)}.`, `${m(1)} =`, 20, '', calc(`${m(1)} = ${rap('400', '20')} = ${c('20')}`), { diag: () => `${m(1)} = ${U(2)} / ${U(1)}.` }),
        T2(['U2', 'U3'], 'm'),
        sci(`Calcule ${m(2)}.`, `${m(2)} =`, 230 / 400000, '', calc(`${m(2)} = ${rap('230', '400 000')} = ${c('5,75 × 10<sup>−4</sup>')}`), { diag: () => `${m(2)} = ${U(3)} / ${U(2)}, avec ${U(2)} = 400 000 V.` }),
        nombre(`Calcule ${I(3)}.`, `${I(3)} =`, 10, 'A', calc(`k = 1 : S = P = 2 300 VA ; ${I(3)} = ${rap('2 300', '230')} = ${c('10 A')}`), { diag: () => `${I(3)} = S / ${U(3)}, avec S = P (k = 1).` }),
        T2(['U2', 'U3', 'I3', 'm'], 'I2'),
        nombre(`Calcule ${I(2)} (en mA).`, `${I(2)} =`, 5.75, 'mA', calc(`${I(2)} = ${m(2)} × ${I(3)} = 5,75 × 10<sup>−4</sup> × 10 = ${c('5,75 mA')}`) + `<p>(ou avec la même puissance S partout : ${I(2)} = ${rap('2 300', '400 000')} = 5,75 × 10<sup>−3</sup> A.)</p>`, { rel: .01, diag: v => proche(v, .00575, .02) ? 'Exprime le résultat en milliampères.' : `${I(2)} = ${m(2)} × ${I(3)} (relation à l'envers).` }),
        T1(['U1', 'U2', 'I2', 'm'], 'I1'),
        nombre(`Calcule ${I(1)} (en mA).`, `${I(1)} =`, 115, 'mA', calc(`${I(1)} = ${m(1)} × ${I(2)} = 20 × 5,75 = ${c('115 mA')}`) + `<p>(ou ${I(1)} = ${rap('S', U(1))} = ${rap('2 300', '20 000')} = 0,115 A.)</p>`, { rel: .01, diag: v => proche(v, .2875, .02) ? `Relation à l'envers : ${I(1)} = ${m(1)} × ${I(2)}.` : `${I(1)} = ${m(1)} × ${I(2)}.` }),
      ] },

    /* ============================ SYNTHÈSE B ============================ */
    { id: 'B', groupe: 'synth', titre: 'Exercice B : un moteur sur le même réseau', desc: 'Machine de 1 840 W, k = 0,8 : comparaison avec un radiateur.',
      contexte: '<p class="er-contexte">Sur le réseau de l\'exercice A (20 kV, 400 kV, 230 V), on branche une machine de puissance active 1 840 W et de facteur de puissance 0,8.</p>',
      parties: [
        schema(null, RES3({ U1: '#U1', I1: '?', S1: '?', m1: '?', U2: '#U2', I2: '?', S2: '?', m2: '?', U3: '#U3', I3: '?', S3: '?', P: '#P', k: '#k' }, 'machine'), [
          etiq('a', '20 kV', 'U1', 'La centrale : la production.'), etiq('b', '400 kV', 'U2', 'Le transport, entre T<sub>1</sub> et T<sub>2</sub>.'), etiq('c', '230 V', 'U3', 'La distribution, après T<sub>2</sub>.'), etiq('d', '1 840 W', 'P', 'Puissance active de la machine, juste avant la charge.'), etiq('e', '0,8', 'k', 'Facteur de puissance de la machine.')]),
        nombre('Calcule la puissance apparente S.', 'S =', 2300, 'VA', calc(`S = ${rap('P', 'k')} = ${rap('1 840', '0,8')} = ${c('2 300 VA')}`), { diag: v => proche(v, 1472) ? 'S = P / k (et non P × k).' : 'S = P / k.' }),
        nombre(`Calcule ${I(3)}.`, `${I(3)} =`, 10, 'A', calc(`${I(3)} = ${rap('S', U(3))} = ${rap('2 300', '230')} = ${c('10 A')}`), { diag: v => proche(v, 8) ? 'C\'est S (et non P) qui donne l\'intensité.' : `${I(3)} = S / ${U(3)}.` }),
        T2(['U2', 'U3', 'I3'], 'm'),
        sci(`Calcule ${m(2)}.`, `${m(2)} =`, 230 / 400000, '', calc(`${m(2)} = ${rap(U(3), U(2))} = ${rap('230', '400 000')} = ${c('5,75 × 10<sup>−4</sup>')}`), { diag: v => proche(v, 400000 / 230, .03) ? `${m(2)} = ${U(3)} / ${U(2)} (sortie de T<sub>2</sub> sur entrée).` : `${m(2)} = ${U(3)} / ${U(2)}, avec ${U(2)} = 400 000 V.` }),
        T2(['U2', 'U3', 'I3', 'm'], 'I2'),
        nombre(`Calcule ${I(2)} (en mA).`, `${I(2)} =`, 5.75, 'mA', calc(`${I(2)} = ${m(2)} × ${I(3)} = 5,75 × 10<sup>−4</sup> × 10 = ${c('5,75 mA')}`) + `<p>(ou ${I(2)} = ${rap('S', U(2))} = ${rap('2 300', '400 000')} = 5,75 × 10<sup>−3</sup> A.)</p>`, { rel: .01, diag: v => proche(v, .00575, .02) ? 'Exprime le résultat en milliampères.' : `${I(2)} = ${m(2)} × ${I(3)}.` }),
        nombre(`Un radiateur de même puissance (1 840 W) appellerait quelle intensité ${I(3)} ?`, `${I(3)} =`, 8, 'A', calc(`k = 1 : ${I(3)} = ${rap('1 840', '230')} = ${c('8 A')}`), { diag: () => 'Radiateur : S = P, puis I = S / U.' }),
        choix('Avec la machine plutôt qu\'avec le radiateur, les pertes par effet Joule dans tout le réseau sont multipliées par :', [o('ok', '1,56'), o('a', '1,25'), o('b', '0,8'), o('c', '2')], 'ok', calc(`Intensités × ${rap('10', '8')} = 1,25 partout, pertes × 1,25<sup>2</sup> ≈ ${c('1,56')}`), { indice: 'Les pertes dépendent de I<sup>2</sup>.' }),
      ] },

    /* ============================ SYNTHÈSE C ============================ */
    { id: 'C', groupe: 'synth', titre: 'Exercice C : moteur avec rendement', desc: 'Un transformateur 20 kV → 230 V ; moteur de 2,4 kW utiles.',
      contexte: '<p class="er-contexte">Un transformateur abaisse la tension de 20 kV à 230 V. Il alimente un moteur de puissance utile 2,4 kW, de rendement 80 % et de facteur de puissance 0,75.</p>',
      parties: [
        schema(null, window.SCH.reseau({ U1: '#U1', I1: '?', S1: '?', m: '?', U2: '#U2', I2: '?', S2: '?', P: '?', k: '#k', eta: '#eta', Pu: '#Pu', Pp: '?' }, { n: 2, charge: 'moteur' }), [
          etiq('a', '20 kV', 'U1', 'Avant le transformateur.'), etiq('b', '230 V', 'U2', 'Le moteur est alimenté sous 230 V.'), etiq('c', '2,4 kW', 'Pu', 'La puissance utile sort du moteur.'), etiq('d', '0,8', 'eta', 'Rendement : 80 % = 0,8.'), etiq('e', '0,75', 'k', 'Facteur de puissance du moteur.')]),
        nombre('Calcule la puissance active P consommée par le moteur.', 'P =', 3000, 'W', calc(`P = ${rap(PU, 'η')} = ${rap('2 400', '0,8')} = ${c('3 000 W')}`), { diag: v => proche(v, 1920) ? `η = ${PU} / P, donc P = ${PU} / η.` : `P = ${PU} / η.` }),
        nombre('Calcule la puissance perdue par le moteur.', `${PP} =`, 600, 'W', calc(`${PP} = P − ${PU} = 3 000 − 2 400 = ${c('600 W')}`), { diag: () => `${PP} = P − ${PU}.` }),
        nombre('Calcule la puissance apparente S.', 'S =', 4000, 'VA', calc(`S = ${rap('3 000', '0,75')} = ${c('4 000 VA')}`), { diag: v => proche(v, 2250) ? 'S = P / k.' : 'S = P / k.' }),
        nombre(`Calcule ${I(2)}, l'intensité dans le câble du moteur.`, `${I(2)} =`, 4000 / 230, 'A', calc(`${I(2)} = ${rap('4 000', '230')} ≈ ${c('17,4 A')}`), { rel: .01, diag: () => `${I(2)} = S / ${U(2)}.` }),
        T(['U1', 'U2', 'I2'], 'm'),
        nombre('Calcule le rapport de transformation m.', 'm =', 0.0115, '', calc(`m = ${rap(U(2), U(1))} = ${rap('230', '20 000')} = ${c('0,0115')}`), { rel: .01, diag: v => proche(v, 20000 / 230, .02) ? `m = ${U(2)} / ${U(1)} (sortie sur entrée).` : `m = ${U(2)} / ${U(1)}, avec ${U(1)} = 20 000 V.` }),
        T(['U1', 'U2', 'I2', 'm'], 'I1'),
        nombre(`Calcule ${I(1)}, l'intensité dans la ligne à 20 kV.`, `${I(1)} =`, 0.2, 'A', calc(`m = ${rap(I(1), I(2))} donc ${I(1)} = m × ${I(2)} = 0,0115 × 17,4 = ${c('0,2 A')}`) + `<p>(ou ${I(1)} = ${rap('S', U(1))} = ${rap('4 000', '20 000')} = 0,2 A.)</p>`, { rel: .01, diag: v => proche(v, 1513, .03) ? `Relation à l'envers : ${I(1)} = m × ${I(2)}.` : `${I(1)} = m × ${I(2)}.` }),
      ] },

    /* ============================ SYNTHÈSE D ============================ */
    { id: 'D', groupe: 'synth', titre: 'Exercice D : une usine pénalisée', desc: 'Usine de 920 kW sous 20 kV, k = 0,8 ; compensation.',
      contexte: '<p class="er-contexte">Une usine est alimentée sous 20 kV par un transformateur relié à une ligne à 400 kV. Elle consomme une puissance active de 920 kW avec un facteur de puissance de 0,8.</p>',
      parties: [
        schema(null, window.SCH.reseau({ U1: '#U1', I1: '?', S1: '?', m: '?', U2: '#U2', I2: '?', S2: '?', P: '#P', k: '#k' }, { n: 2, charge: 'usine', titres: ['transport', 'usine'] }), [
          etiq('a', '400 kV', 'U1', 'La ligne de transport, avant le transformateur.'), etiq('b', '20 kV', 'U2', 'L\'usine est alimentée sous 20 kV.'), etiq('c', '920 kW', 'P', 'Puissance active de l\'usine, juste avant la charge.'), etiq('d', '0,8', 'k', 'Facteur de puissance de l\'usine.')]),
        nombre('Calcule la puissance apparente S (en kVA).', 'S =', 1150, 'kVA', calc(`S = ${rap('920', '0,8')} = ${c('1 150 kVA')}`), { diag: v => proche(v, 736) ? 'S = P / k.' : proche(v, 1150000) ? 'Le résultat est demandé en kVA.' : 'S = P / k.' }),
        nombre(`Calcule l'intensité ${I(2)} du courant qui alimente l'usine.`, `${I(2)} =`, 57.5, 'A', calc(`${I(2)} = ${rap('S', U(2))} = ${rap('1 150 000', '20 000')} = ${c('57,5 A')}`), { diag: v => proche(v, 46) ? 'C\'est S (et non P) qui donne l\'intensité.' : `${I(2)} = S / ${U(2)} (en VA et en V).` }),
        T(['U1', 'U2', 'I2'], 'm'),
        nombre('Calcule le rapport de transformation m.', 'm =', 0.05, '', calc(`m = ${rap(U(2), U(1))} = ${rap('20', '400')} = ${c('0,05')}`), { diag: v => proche(v, 20) ? `m = ${U(2)} / ${U(1)} (sortie sur entrée).` : `m = ${U(2)} / ${U(1)}.` }),
        T(['U1', 'U2', 'I2', 'm'], 'I1'),
        nombre(`Calcule l'intensité ${I(1)} dans la ligne à 400 kV.`, `${I(1)} =`, 2.875, 'A', calc(`m = ${rap(I(1), I(2))} donc ${I(1)} = m × ${I(2)} = 0,05 × 57,5 ≈ ${c('2,88 A')}`) + `<p>(ou ${I(1)} = ${rap('S', U(1))} = ${rap('1 150 000', '400 000')} ≈ 2,88 A.)</p>`, { rel: .01, diag: v => proche(v, 1150) ? `Relation à l'envers : ${I(1)} = m × ${I(2)}.` : `${I(1)} = m × ${I(2)}.` }),
        choix('EDF impose cos φ ≥ 0,93 aux installations industrielles. Cette usine :', [o('ok', 'est pénalisée, car 0,8 &lt; 0,93'), o('a', 'respecte la règle, car 0,8 &lt; 1'), o('b', 'n\'est pas concernée')], 'ok', '<p>0,8 &lt; 0,93 : l\'usine paie des pénalités. Elle a intérêt à améliorer son facteur de puissance (par exemple avec des condensateurs).</p>', { indice: 'Compare 0,8 à 0,93.' }),
        nombre(`Après compensation, k = 1. Calcule la nouvelle intensité ${I(2)}.`, `${I(2)} =`, 46, 'A', calc(`S = P = 920 kVA ; ${I(2)} = ${rap('920 000', '20 000')} = ${c('46 A')}`), { diag: () => 'Avec k = 1, S = P.' }),
        choix('Les pertes par effet Joule dans les lignes sont alors divisées par :', [o('ok', '1,56'), o('a', '1,25'), o('b', '0,8'), o('c', '2')], 'ok', calc(`${rap('57,5', '46')} = 1,25 ; pertes ÷ 1,25<sup>2</sup> ≈ ${c('1,56')}`), { indice: 'Les pertes dépendent de I<sup>2</sup>.' }),
      ] },

    /* ============================ SYNTHÈSE E ============================ */
    { id: 'E', groupe: 'synth', titre: 'Exercice E : le schéma complet', desc: 'Centrale, deux transformateurs, compresseur avec rendement.',
      contexte: '<p class="er-contexte">Une centrale produit sous 20 kV ; T<sub>1</sub> élève la tension à 400 kV ; T<sub>2</sub> l\'abaisse à 230 V. On alimente un compresseur de puissance utile 2,76 kW, de rendement 80 % et de facteur de puissance 0,75.</p>',
      parties: [
        reperage('compresseur'),
        schema(null, RES3({ U1: '#U1', I1: '?', S1: '?', m1: '?', U2: '#U2', I2: '?', S2: '?', m2: '?', U3: '#U3', I3: '?', S3: '?', P: '?', k: '#k', eta: '#eta', Pu: '#Pu', Pp: '?' }, 'compresseur'), [
          etiq('a', '20 kV', 'U1', 'La centrale : la production.'), etiq('b', '400 kV', 'U2', 'Le transport, entre T<sub>1</sub> et T<sub>2</sub>.'), etiq('c', '230 V', 'U3', 'La distribution, après T<sub>2</sub>.'),
          etiq('d', '2,76 kW', 'Pu', 'La puissance utile sort du compresseur.'), etiq('e', '0,8', 'eta', 'Rendement : 80 % = 0,8.'), etiq('f', '0,75', 'k', 'Facteur de puissance du compresseur.')]),
        nombre('Calcule la puissance active P.', 'P =', 3450, 'W', calc(`P = ${rap('2 760', '0,8')} = ${c('3 450 W')}`), { diag: v => proche(v, 2208) ? `P = ${PU} / η.` : `P = ${PU} / η.` }),
        nombre('Calcule la puissance perdue par le compresseur.', `${PP} =`, 690, 'W', calc(`${PP} = 3 450 − 2 760 = ${c('690 W')}`), { diag: () => `${PP} = P − ${PU}.` }),
        nombre('Calcule la puissance apparente S.', 'S =', 4600, 'VA', calc(`S = ${rap('3 450', '0,75')} = ${c('4 600 VA')}`), { diag: () => 'S = P / k.' }),
        nombre(`Calcule ${I(3)}.`, `${I(3)} =`, 20, 'A', calc(`${I(3)} = ${rap('4 600', '230')} = ${c('20 A')}`), { diag: () => `${I(3)} = S / ${U(3)}.` }),
        T2(['U2', 'U3', 'I3'], 'm'),
        sci(`Calcule ${m(2)}.`, `${m(2)} =`, 230 / 400000, '', calc(`${m(2)} = ${rap(U(3), U(2))} = ${rap('230', '400 000')} = ${c('5,75 × 10<sup>−4</sup>')}`), { diag: v => proche(v, 400000 / 230, .03) ? `${m(2)} = ${U(3)} / ${U(2)} (sortie de T<sub>2</sub> sur entrée).` : `${m(2)} = ${U(3)} / ${U(2)}, avec ${U(2)} = 400 000 V.` }),
        T2(['U2', 'U3', 'I3', 'm'], 'I2'),
        nombre(`Calcule ${I(2)} (en mA).`, `${I(2)} =`, 11.5, 'mA', calc(`${I(2)} = ${m(2)} × ${I(3)} = 5,75 × 10<sup>−4</sup> × 20 = ${c('11,5 mA')}`) + `<p>(ou ${I(2)} = ${rap('S', U(2))} = ${rap('4 600', '400 000')} = 11,5 × 10<sup>−3</sup> A.)</p>`, { rel: .01, diag: v => proche(v, .0115, .02) ? 'Exprime le résultat en milliampères.' : `${I(2)} = ${m(2)} × ${I(3)}.` }),
        T1(['U1', 'U2', 'I2'], 'm'),
        nombre(`Calcule ${m(1)}.`, `${m(1)} =`, 20, '', calc(`${m(1)} = ${rap(U(2), U(1))} = ${rap('400', '20')} = ${c('20')}`), { diag: v => proche(v, .05) ? `${m(1)} = ${U(2)} / ${U(1)} (sortie de T<sub>1</sub> sur entrée).` : `${m(1)} = ${U(2)} / ${U(1)}.` }),
        T1(['U1', 'U2', 'I2', 'm'], 'I1'),
        nombre(`Calcule ${I(1)} (en mA).`, `${I(1)} =`, 230, 'mA', calc(`${I(1)} = ${m(1)} × ${I(2)} = 20 × 11,5 = ${c('230 mA')}`) + `<p>(ou ${I(1)} = ${rap('S', U(1))} = ${rap('4 600', '20 000')} = 0,23 A.)</p>`, { rel: .01, diag: v => proche(v, .23, .02) ? 'Exprime le résultat en milliampères.' : `${I(1)} = ${m(1)} × ${I(2)}.` }),
      ] },

    /* ============================ SYNTHÈSE F ============================ */
    { id: 'F', groupe: 'synth', titre: 'Exercice F : remonter à la puissance utile', desc: 'On mesure 20 A dans le câble d\'un moteur : puissances et ligne à 20 kV.',
      contexte: '<p class="er-contexte">Un transformateur abaisse la tension de 20 kV à 230 V pour alimenter un moteur de facteur de puissance 0,85 et de rendement 90 %. Un ampèremètre indique que le câble du moteur est parcouru par un courant de 20 A.</p>',
      parties: [
        schema(null, window.SCH.reseau({ U1: '#U1', I1: '?', S1: '?', m: '?', U2: '#U2', I2: '#I2', S2: '?', P: '?', k: '#k', eta: '#eta', Pu: '?', Pp: '?' }, { n: 2, charge: 'moteur' }), [
          etiq('a', '20 kV', 'U1', 'Avant le transformateur.'), etiq('b', '230 V', 'U2', 'Le moteur est alimenté sous 230 V.'), etiq('c', '20 A', 'I2', 'Le courant dans le câble du moteur.'), etiq('d', '0,85', 'k', 'Facteur de puissance du moteur.'), etiq('e', '0,9', 'eta', 'Rendement : 90 % = 0,9.')]),
        nombre('Calcule la puissance apparente S.', 'S =', 4600, 'VA', calc(`S = ${U(2)} × ${I(2)} = 230 × 20 = ${c('4 600 VA')}`), { diag: () => `S = ${U(2)} × ${I(2)}.` }),
        nombre('Calcule la puissance active P.', 'P =', 3910, 'W', calc(`k = ${rap('P', 'S')} donc P = k × S = 0,85 × 4 600 = ${c('3 910 W')}`), { diag: v => proche(v, 5412, .01) ? 'k = P / S, donc P = k × S.' : 'P = k × S.' }),
        nombre('Calcule la puissance utile du moteur.', `${PU} =`, 3519, 'W', calc(`${PU} = η × P = 0,9 × 3 910 = ${c('3 519 W')}`), { diag: v => proche(v, 4344, .01) ? `η = ${PU} / P, donc ${PU} = η × P.` : `${PU} = η × P.` }),
        T(['U1', 'U2', 'I2'], 'm'),
        nombre('Calcule le rapport de transformation m.', 'm =', 0.0115, '', calc(`m = ${rap(U(2), U(1))} = ${rap('230', '20 000')} = ${c('0,0115')}`), { rel: .01, diag: v => proche(v, 20000 / 230, .02) ? `m = ${U(2)} / ${U(1)} (sortie sur entrée).` : `m = ${U(2)} / ${U(1)}, avec ${U(1)} = 20 000 V.` }),
        T(['U1', 'U2', 'I2', 'm'], 'I1'),
        nombre(`Calcule ${I(1)}, l'intensité dans la ligne à 20 kV.`, `${I(1)} =`, 0.23, 'A', calc(`m = ${rap(I(1), I(2))} donc ${I(1)} = m × ${I(2)} = 0,0115 × 20 = ${c('0,23 A')}`) + `<p>(ou ${I(1)} = ${rap('S', U(1))} = ${rap('4 600', '20 000')} = 0,23 A.)</p>`, { diag: v => proche(v, 1739, .02) ? `Relation à l'envers : ${I(1)} = m × ${I(2)}.` : `${I(1)} = m × ${I(2)}.` }),
      ] },
  ];

  window.TE.EXERCICES = EXERCICES;
  window.TE.GROUPES_EX = GROUPES_EX;
})();
