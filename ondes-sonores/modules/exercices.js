/* ============================================================
   Exercices du module 5 (application « Chapitre 18 : Ondes
   sonores ») : les exercices de la feuille, dans son ordre et avec la
   numérotation du manuel : 6 p. 230, 8 p. 231, 10 et 11 p. 232,
   17 p. 233, exercice A (audiogramme et bouchons d'oreilles), 16 p. 233,
   puis le sujet de bac « Étude du son d'un violon » (Polynésie 2022).
   Graphiques redessinés en SVG ; les signaux sont calculés à partir de
   leur spectre (assets/fourier.js).

   Chaque exercice : { id, groupe, titre, desc, contexte (HTML),
   parties: [p] ou une fonction qui les fabrique, sons (spectres à
   écouter dans le simulateur, facultatif) } ; chaque partie suit le
   format de OS.PARTIES avec p.q (question) et p.correction (correction
   détaillée : formule, grandeur isolée, application numérique avec
   les unités).

   Données de la feuille : L = 10 log(I / I0), I0 = 10⁻¹² W·m⁻²,
   I = I0 × 10^(L/10).

   Valeurs vérifiées par un script :
     ex. 6 : T = 1,0 ms, f = 1 000 Hz ; harmoniques 2 kHz (rang 2) et
       4 kHz (rang 4) ; I = 10⁻¹² × 10¹⁰ = 1,0 × 10⁻² W·m⁻² ; deux
       voitures : 2,0 × 10⁻² W·m⁻², L = 10 log(2,0 × 10¹⁰) ≈ 103 dB ;
     ex. 8 : f1 ≈ 1 kHz (988 Hz : Si₄) ; 2 kHz et 5 kHz : rangs 2 et 5 ;
     ex. 10 : 10 log(10⁷) = 70 dB ; 10 log(4,0 × 10⁵) ≈ 56 dB ;
       10 log(5,0 × 10⁴) ≈ 47 dB ;
     ex. 11 : 10⁻¹² × 10^4,5 ≈ 3,2 × 10⁻⁸ ; 10⁻¹² × 10¹³ = 10 ;
       10⁻¹² × 10⁹ = 1,0 × 10⁻³ W·m⁻² ;
     ex. A : perte de 35 dB à 4 000 Hz (40-60 ans) ;
     ex. 16 : T = 0,008 s, f = 125 Hz ; 250, 375, 500 Hz ; 750, 875 Hz ;
     bac : 7 motifs en 18,25 ms, T ≈ 2,6 ms, f ≈ 384 Hz ≈ 390 Hz ;
       770 / 390 ≈ 1,97 ≈ 2 ; 1 160 / 390 ≈ 2,97 ≈ 3.
   Écart avec la correction :
     bac 5) la correction écrit « fC / f1 = 770 / 390 » : c'est
       1 160 / 390 ≈ 2,97.
   ============================================================ */
(function () {
  'use strict';

  const { o, fr, proche, fmt, sci, niveau, intensite, fmtHz, interpLog, OCTAVES, BAC } = window.OS;
  const calc = h => `<p class="ph-calc">${h}</p>`;
  const c = h => `<span class="c">${h}</span>`;
  const I0f = '10<sup>−12</sup>';
  // fabriques de parties
  const choix = (q, options, bonne, correction, opts) => Object.assign({ type: 'choix', q, options, bonne, correction, melanger: false, colonne: options.some(x => x.label.replace(/<[^>]+>/g, '').length > 24) }, opts);
  const nombre = (q, label, valeur, unite, correction, opts) => Object.assign({ type: 'nombre', q, label, valeur, unite, correction, signe: false }, opts);
  const gabarit = (q, morceaux, correction, opts) => Object.assign({ type: 'gabarit', q, morceaux, correction }, opts);
  const sciP = (q, label, valeur, unite, correction, opts) => Object.assign({ type: 'sci', q, label, valeur, unite, correction, cs: 2 }, opts);
  const figSpectre = (raies, opts, W) => window.OS.figSpectre(raies, Object.assign({ Wmax: W || 560 }, opts));
  const figSignal = (spec, opts, W) => window.OS.figSignal(spec, Object.assign({ Wmax: W || 620, H: 220 }, opts));
  const donnees = '<p class="ph-donnees">Données : L = 10 log(I / I<sub>0</sub>) ; I = I<sub>0</sub> × 10<sup>L/10</sup> ; I<sub>0</sub> = 10<sup>−12</sup> W·m<sup>−2</sup>.</p>';
  const diagL = (v, I) => (Math.abs(v - 10 * Math.log10(I)) < .6 ? 'Tu as oublié I<sub>0</sub> : L = 10 log(I / I<sub>0</sub>).'
    : Math.abs(v - 10 * Math.log(I / 1e-12)) < .6 ? 'Touche <b>log</b>, pas ln.' : Math.abs(v - niveau(I) / 10) < .1 ? 'Il manque le facteur 10.' : 'L = 10 log(I / I<sub>0</sub>).');
  const diagI = (v, L) => (proche(v, Math.pow(10, L / 10), .03) ? 'Il manque I<sub>0</sub> : I = I<sub>0</sub> × 10<sup>L/10</sup>.' : proche(v, 1e-12 * Math.pow(10, L), .03) ? 'L\'exposant est <b>L / 10</b>.' : 'I = I<sub>0</sub> × 10<sup>L/10</sup>.');

  /* ---------- Documents (redessinés en SVG) ---------- */
  const raiesDe = l => l.map(([f, a, nom]) => ({ f, a, nom }));
  const ONDE = {
    // ex. 6 : son de la Lexus LFA (T = 1,0 ms ; raies à 1, 2 et 4 kHz)
    ex6: { f1: 1000, a0: 0, a: [1, .6, 0, .35] },
    // ex. 16 : instrument 1 (f1 = 125 Hz, rangs 1 à 4) et instrument 2 (rangs 1 à 4, 6 et 7)
    ex16a: { f1: 125, a0: 0, a: [1, .7, .5, .3] },
    ex16b: { f1: 125, a0: 0, a: [1, .4, .6, .25, 0, .3, .2] },
    // ex. A : flûte jouant do₄ (spectre simplifié du simulateur)
    flute: { f1: 523, a0: 0, a: window.SON ? window.SON.INSTRUMENTS.flute.a : [1.6, .45, .3, .15] },
  };
  const OPTS_KHZ = { uniteF: 'kHz', titreF: 'Fréquence (en kHz)' };
  const DOCS = {
    ex6Signal: { tmax: 5, pasT: .25, etiqT: [1, 2, 3, 4, 5], ymin: -2, ymax: 2, pasY: .5, etiqY: [-2, -1, 0, 1, 2], nom: 'u', unite: 'V', titreY: 'u (en V)', aria: 'Signal du son du moteur de la Lexus LFA, de 0 à 5 ms' },
    ex6: Object.assign({ unite: 'V', amax: 1.2, pasA: .2, etiqA: [0, .2, .4, .6, .8, 1, 1.2], fmax: 5000, pasF: 250, etiqF: [0, 1000, 2000, 3000, 4000, 5000], H: 210,
      aria: 'Spectre du son de la Lexus LFA : raies à 1, 2 et 4 kHz' }, OPTS_KHZ),
    ex8: { raies: raiesDe([[988, 1], [1976, .45], [4940, .3]]),
      opts: Object.assign({ unite: '', titreA: 'Amplitude relative', amax: 1.2, pasA: .1, etiqA: [0, .2, .4, .6, .8, 1, 1.2], fmax: 6000, pasF: 250, etiqF: [0, 1000, 2000, 3000, 4000, 5000, 6000], H: 220,
        aria: 'Spectre du son d\'une lame de glockenspiel : trois raies' }, OPTS_KHZ) },
    ex16Signal: { tmax: 32, pasT: 2, etiqT: [4, 8, 12, 16, 20, 24, 28, 32], ymin: -3, ymax: 3, pasY: .5, etiqY: [-3, -2, -1, 0, 1, 2, 3], nom: 'u', unite: 'V', titreY: 'u (en V)', aria: 'Signal du son de l\'instrument 1, de 0 à 32 ms' },
    ex16: { unite: 'V', amax: 1.2, pasA: .2, etiqA: [0, .2, .4, .6, .8, 1, 1.2], fmax: 1000, pasF: 25, etiqF: [0, 125, 250, 375, 500, 625, 750, 875, 1000], H: 200 },
    bacSignal: { tmax: 20, pasT: .5, etiqT: [2, 4, 6, 8, 10, 12, 14, 16, 18, 20], ymin: -2, ymax: 2, pasY: .5, etiqY: [-2, -1, 0, 1, 2], nom: 'u', unite: 'V', titreY: 'u (en V)', aria: 'Signal du son du violon, de 0 à 20 ms' },
  };
  // ex. 17 : atténuation (dB) d'un mur de béton et d'une cloison de plâtre (courbes lissées)
  const BETON = [[100, 40], [130, 42], [200, 45], [315, 48], [400, 50], [500, 52], [800, 56], [1000, 58], [2000, 62], [4000, 66], [5000, 67]];
  const PLATRE = [[100, 30], [130, 42], [160, 44], [200, 41], [315, 33], [400, 29], [500, 33], [800, 44], [1000, 50], [2000, 60], [4000, 65], [5000, 66]];
  const figMurs = () => window.OS.fig(W => window.OS.svgLog({ W: Math.min(W, 640), H: W < 480 ? 260 : 280, fmin: 100, fmax: 5000, ymin: 0, ymax: 70, pasY: 5, etiqY: [0, 10, 20, 30, 40, 50, 60, 70],
    titreY: 'Atténuation (en dB)', etiqF: [100, 200, 500, 1000, 2000, 5000],
    courbes: [{ pts: BETON, cls: 'os-courbe', label: 'béton', lf: 700, dy: -10 }, { pts: PLATRE, cls: 'os-courbe-2', label: 'plâtre', lf: 400, dy: 22, clsT: 'encre' }],
    reperes: [{ f: 130 }], textes: [{ f: 130, y: 66, t: '130 Hz', cls: 'os-txt-pt' }],
    aria: 'Atténuation d\'un mur de béton et d\'une cloison de plâtre en fonction de la fréquence (échelle logarithmique)' }));
  // ex. A : perte auditive de Lucas, pertes moyennes selon l'âge, atténuation de deux bouchons
  const LUCAS = [5, 5, 5, 10, 15, 35, 20];
  const AGES = [['20 à 30 ans', [0, 0, 0, 0, 5, 5, 10], 'os-courbe-3'], ['40 à 60 ans', [5, 5, 5, 10, 15, 35, 40], 'os-courbe'], ['plus de 70 ans', [10, 15, 20, 25, 40, 55, 65], 'os-courbe-2']];
  const MOULES = [18, 19, 20, 20, 21, 22, 22], MOUSSE = [22, 25, 28, 30, 34, 40, 42];
  const pts = l => OCTAVES.map((f, k) => [f, l[k]]);
  const figLucas = () => window.OS.fig(W => window.OS.svgPerte({ W: Math.min(W, 600), H: W < 480 ? 240 : 260, courbes: [{ pts: pts(LUCAS), cls: 'os-courbe' }], points: OCTAVES.map((f, k) => ({ f, y: LUCAS[k] })),
    aria: 'Audiogramme médical de Lucas : perte auditive en fonction de la fréquence' }));
  const figAges = () => window.OS.fig(W => window.OS.svgPerte({ W: Math.min(W, 600), H: W < 480 ? 250 : 270,
    courbes: AGES.map(([nom, l, cls], k) => ({ pts: pts(l), cls, label: nom, lf: [6000, 6000, 3000][k], dy: [16, 16, 18][k], ancre: 'middle', clsT: k === 2 ? 'encre' : '' })),
    aria: 'Pertes auditives moyennes selon l\'âge en fonction de la fréquence' }));
  const figBouchons = () => window.OS.fig(W => window.OS.svgLog({ W: Math.min(W, 600), H: W < 480 ? 240 : 260, fmin: 100, fmax: 10000, ymin: 0, ymax: 50, pasY: 5, etiqY: [0, 10, 20, 30, 40, 50],
    etiqF: OCTAVES, titreY: 'Atténuation (en dB)',
    courbes: [{ pts: pts(MOULES), cls: 'os-courbe', label: 'bouchons moulés', lf: 500, dy: 18 }, { pts: pts(MOUSSE), cls: 'os-courbe-2', label: 'bouchons en mousse', lf: 2000, dy: -10, clsT: 'encre' }],
    aria: 'Atténuation de deux types de bouchons d\'oreilles en fonction de la fréquence' }));

  /* ---------- Exercice 6 p. 230 : le son d'une Lexus LFA ---------- */
  const I6 = intensite(100);
  const ex6 = {
    id: '6', groupe: 'feuille', titre: 'Exercice 6 p. 230 : le son d\'une Lexus LFA', desc: 'Son complexe, fondamental, harmoniques, intensité, deux voitures',
    contexte: `<p class="er-contexte">Le moteur de la Lexus LFA produit un son très reconnaissable. On a enregistré ce son avec un micro et réalisé son spectre. Près de la voiture, le niveau sonore vaut <b>L = 100 dB</b>.</p>
      ${figSignal(ONDE.ex6, DOCS.ex6Signal)}<p class="os-fig-leg">Signal du son</p>
      ${figSpectre(window.OS.raiesSon(1000, ONDE.ex6.a), DOCS.ex6)}<p class="os-fig-leg">Spectre du son</p>${donnees}`,
    parties: [
      choix('1. Ce son est-il pur ou complexe ?', [o('ok', 'Complexe : le spectre a trois raies'), o('pur', 'Pur : le signal est périodique')], 'ok',
        '<p>Le spectre a <b>trois raies</b> (le signal n\'est pas sinusoïdal) : c\'est un ' + c('son complexe') + '.</p>',
        { indices: { pur: 'Un son pur a un signal <b>sinusoïdal</b> et une seule raie. Être périodique ne suffit pas.' } }),
      nombre('2. Quelle est la fréquence f<sub>1</sub> du fondamental ?', 'f<sub>1</sub> =', 1000, 'Hz', `<p>La première raie est à ${c('1 kHz = 1 000 Hz')}.</p>`,
        { tol: 40, diag: v => (proche(v, 1) ? 'L\'axe est en kHz : 1 kHz = 1 000 Hz.' : proche(v, 2000, .05) || proche(v, 4000, .05) ? 'Le fondamental est la <b>première</b> raie (la plus petite fréquence).' : 'Lis la fréquence de la première raie (1 graduation = 1 kHz).') }),
      nombre('2 bis. Sur le signal, détermine la période T.', 'T =', 1, 'ms', `<p>Le motif se répète 5 fois en 5,0 ms : T = ${c('1,0 ms')}.</p>`,
        { tol: .05, affiche: '1,0', diag: v => (proche(v, .5, .05) ? 'Une période est la durée d\'un motif <b>complet</b> : deux sommets les plus hauts voisins.' : proche(v, 5, .05) ? 'C\'est la durée de 5 périodes.' : 'Repère deux sommets les plus hauts voisins (1 graduation = 1 ms).') }),
      nombre('En déduire la fréquence du son.', 'f =', 1000, 'Hz', calc(`f = ${fr('1', 'T')} = ${fr('1', '1,0 × 10<sup>−3</sup> s')} = ${c('1 000 Hz')}`) + '<p>C\'est la fréquence du fondamental.</p>',
        { rel: .02, diag: v => (proche(v, 1, .02) ? 'T doit être en secondes : 1,0 ms = 1,0 × 10<sup>−3</sup> s.' : 'f = 1 / T, avec T en s.') }),
      gabarit('3. Quelles sont les fréquences des deux autres raies ?', ['f =', { v: 2000, tol: 60 }, 'Hz et f =', { v: 4000, tol: 60 }, 'Hz'],
        `<p>Les deux autres raies sont à ${c('2 kHz = 2 000 Hz')} et ${c('4 kHz = 4 000 Hz')}.</p>`,
        { diag: v => (v.some(x => x < 10) ? 'Écris les fréquences en Hz : 1 kHz = 1 000 Hz.' : 'Lis les fréquences des deuxième et troisième raies.') }),
      choix('Ces harmoniques sont-ils compatibles avec le fondamental ?', [o('ok', 'Oui : 2 000 = 2 × 1 000 (rang 2) et 4 000 = 4 × 1 000 (rang 4)'), o('non', 'Non : il manque l\'harmonique de rang 3'), o('non2', 'Non : les raies devraient être régulièrement espacées')], 'ok',
        calc(`f<sub>n</sub> = n × f<sub>1</sub> : ${fr('2 000', '1 000')} = 2 et ${fr('4 000', '1 000')} = 4`) + '<p>Ce sont des multiples de f<sub>1</sub> : harmoniques de rangs 2 et 4. Un harmonique peut manquer (ici le rang 3).</p>',
        { indices: { non: 'Un harmonique peut avoir une amplitude nulle : il manque dans le spectre, ce n\'est pas une erreur.', non2: 'Il suffit que chaque fréquence soit un multiple de f<sub>1</sub>.' } }),
      sciP('4. Calcule l\'intensité sonore I près de la voiture.', 'I =', I6, 'W·m<sup>−2</sup>', calc(`I = I<sub>0</sub> × 10<sup>L/10</sup> = ${I0f} × 10<sup>100/10</sup> = 10<sup>−12</sup> × 10<sup>10</sup> = ${c('1,0 × 10<sup>−2</sup> W·m<sup>−2</sup>')}`),
        { diag: v => diagI(v, 100) }),
      sciP('5. Deux voitures identiques passent ensemble. Quelle est l\'intensité sonore totale ?', 'I =', 2 * I6, 'W·m<sup>−2</sup>', calc(`I = I<sub>1</sub> + I<sub>2</sub> = 2 × 1,0 × 10<sup>−2</sup> = ${c('2,0 × 10<sup>−2</sup> W·m<sup>−2</sup>')}`),
        { diag: v => (proche(v, intensite(200), .05) ? 'Ce sont les intensités qui s\'additionnent, pas les niveaux.' : 'Les intensités s\'additionnent : I = I<sub>1</sub> + I<sub>2</sub> = 2 × I<sub>1</sub>.') }),
      nombre('En déduire le niveau sonore des deux voitures.', 'L =', niveau(2 * I6), 'dB', calc(`L = 10 log${fr('I', 'I<sub>0</sub>')} = 10 log${fr('2,0 × 10<sup>−2</sup>', '10<sup>−12</sup>')} = 10 log(2,0 × 10<sup>10</sup>) ≈ ${c('103 dB')}`) + '<p>Deux sources identiques : + 3 dB (et non 200 dB).</p>',
        { tol: .3, affiche: '103', diag: v => (Math.abs(v - 200) < 1 ? '<b>Les niveaux ne s\'additionnent pas</b>.' : diagL(v, 2 * I6)) }),
    ],
  };

  /* ---------- Exercice 8 p. 231 : le glockenspiel ---------- */
  const NOTES8 = [['La<sub>4</sub>', 880], ['Si<sub>4</sub>', 988], ['Do<sub>5</sub>', 1046], ['Ré<sub>5</sub>', 1174]];
  const ex8 = {
    id: '8', groupe: 'feuille', titre: 'Exercice 8 p. 231 : le glockenspiel', desc: 'Son complexe, fondamental, note jouée, harmoniques',
    contexte: `<p class="er-contexte">Le glockenspiel est un instrument à percussion formé de lames métalliques que l'on frappe avec des maillets. Voici le spectre du son émis par une lame.</p>
      ${figSpectre(DOCS.ex8.raies, DOCS.ex8.opts)}
      <div class="ph-defile"><table class="ph-tableau"><thead><tr><th>Note</th>${NOTES8.map(n => `<th>${n[0]}</th>`).join('')}</tr></thead><tbody><tr><td>f (Hz)</td>${NOTES8.map(n => `<td>${fmt(n[1])}</td>`).join('')}</tr></tbody></table></div>`,
    parties: [
      choix('a) Le son émis est-il pur ou complexe ?', [o('ok', 'Complexe : un fondamental et deux harmoniques'), o('pur', 'Pur')], 'ok',
        '<p>Trois raies : le fondamental et deux harmoniques. C\'est un ' + c('son complexe') + '.</p>', { indices: { pur: 'Un son pur n\'a qu\'une raie.' } }),
      nombre('b) Quelle est la fréquence f<sub>1</sub> du fondamental ?', 'f<sub>1</sub> ≈', 1000, 'Hz', `<p>La première raie est à f<sub>1</sub> ≈ ${c('1 kHz')} (un peu moins : ≈ 990 Hz).</p>`,
        { tol: 60, diag: v => (proche(v, 1, .06) ? 'Écris la fréquence en Hz : 1 kHz = 1 000 Hz.' : 'Lis la fréquence de la première raie (une ligne verticale tous les 0,25 kHz).') }),
      choix('c) Quelle note est jouée ?', NOTES8.map(n => o(String(n[1]), n[0])), '988',
        '<p>f<sub>1</sub> ≈ 1 000 Hz : la note la plus proche du tableau est ' + c('Si<sub>4</sub> (988 Hz)') + '.</p>',
        { indices: { 880: '880 Hz est trop loin de 1 000 Hz.', 1046: 'La raie est un peu <b>avant</b> 1 kHz, pas après.', 1174: '1 174 Hz est trop loin de 1 000 Hz.' } }),
      gabarit('d) Quelles sont les fréquences des deux harmoniques ?', ['f =', { v: 2000, tol: 120 }, 'Hz et f =', { v: 5000, tol: 120 }, 'Hz'],
        `<p>Les deux harmoniques sont à ${c('2 kHz')} et ${c('5 kHz')} environ (2 000 Hz et 5 000 Hz).</p>`,
        { diag: v => (v.some(x => x < 10) ? 'Écris les fréquences en Hz : 1 kHz = 1 000 Hz.' : 'Lis les fréquences des deuxième et troisième raies.') }),
      gabarit('e) La relation f<sub>n</sub> = n × f<sub>1</sub> est-elle vérifiée ? Donne les rangs des deux harmoniques.', ['n =', { v: 2 }, 'et n =', { v: 5 }],
        calc(`${fr('2 kHz', '1 kHz')} = 2 et ${fr('5 kHz', '1 kHz')} = 5 : la relation est vérifiée pour les rangs ${c('2 et 5')}.`),
        { diag: v => (v[0] === 2 && v[1] === 3 ? 'Le rang n\'est pas la position de la raie : n = f<sub>n</sub> / f<sub>1</sub>.' : 'n = f<sub>n</sub> / f<sub>1</sub>.') }),
    ],
  };

  /* ---------- Exercice 10 p. 232 : calculer un niveau sonore ---------- */
  const I10 = [1e-5, 4e-7, 5e-8];
  const ex10 = {
    id: '10', groupe: 'feuille', titre: 'Exercice 10 p. 232 : calculer un niveau sonore', desc: 'L = 10 log(I / I₀)',
    contexte: `<p class="er-contexte">Calcule le niveau sonore correspondant à chacune de ces intensités sonores (arrondi à l'unité) :</p>
      <ul class="er-liste"><li>a) I = 1,0 × 10<sup>−5</sup> W·m<sup>−2</sup> ;</li><li>b) I = 4,0 × 10<sup>−7</sup> W·m<sup>−2</sup> ;</li><li>c) I = 5,0 × 10<sup>−8</sup> W·m<sup>−2</sup>.</li></ul>${donnees}`,
    parties: I10.map((I, k) => nombre(`${'abc'[k]}) I = ${sci(I, 2)} W·m<sup>−2</sup> :`, 'L =', niveau(I), 'dB',
      calc(`L = 10 log${fr('I', 'I<sub>0</sub>')} = 10 log${fr(sci(I, 2), I0f)} = 10 log(${sci(I / 1e-12, 2)}) ≈ ${c(Math.round(niveau(I)) + ' dB')}`),
      { tol: .6, affiche: String(Math.round(niveau(I))), diag: v => diagL(v, I) })),
  };

  /* ---------- Exercice 11 p. 232 : calculer une intensité sonore ---------- */
  const L11 = [45, 130, 90];
  const ex11 = {
    id: '11', groupe: 'feuille', titre: 'Exercice 11 p. 232 : calculer une intensité sonore', desc: 'I = I₀ × 10^(L/10)',
    contexte: `<p class="er-contexte">Calcule l'intensité sonore correspondant à chacun de ces niveaux sonores :</p>
      <ul class="er-liste"><li>a) L = 45 dB ;</li><li>b) L = 130 dB ;</li><li>c) L = 90 dB.</li></ul>${donnees}`,
    parties: L11.map((L, k) => sciP(`${'abc'[k]}) L = ${L} dB :`, 'I =', intensite(L), 'W·m<sup>−2</sup>',
      calc(`I = I<sub>0</sub> × 10<sup>L/10</sup> = ${I0f} × 10<sup>${L}/10</sup> = 10<sup>−12</sup> × 10<sup>${fmt(L / 10)}</sup> ≈ ${c(sci(intensite(L), 2) + ' W·m<sup>−2</sup>')}`),
      { diag: v => diagI(v, L) })),
  };

  /* ---------- Exercice 17 p. 233 : béton ou plâtre ---------- */
  const ex17 = {
    id: '17', groupe: 'feuille', titre: 'Exercice 17 p. 233 : béton ou plâtre ?', desc: 'Atténuation selon la fréquence, échelle logarithmique',
    contexte: `<p class="er-contexte">Le graphique donne l'atténuation acoustique d'un mur de béton et d'une cloison de plâtre en fonction de la fréquence du son. L'axe des fréquences est en échelle logarithmique.</p>${figMurs()}`,
    parties: [
      choix('a) Le béton est-il un bon isolant pour les hautes fréquences ?', [o('ok', 'Oui : l\'atténuation y dépasse 60 dB'), o('non', 'Non')], 'ok',
        '<p>Au-dessus de 1 000 Hz, l\'atténuation du béton dépasse 58 dB : c\'est un ' + c('bon isolant') + ' pour les hautes fréquences.</p>', { indices: { non: 'Regarde la courbe du béton à droite du graphique (hautes fréquences).' } }),
      choix('b) Et pour les basses fréquences ?', [o('ok', 'Il est moins performant : l\'atténuation descend vers 40 dB'), o('mieux', 'Il est encore meilleur')], 'ok',
        '<p>Vers 100 Hz, l\'atténuation n\'est plus que de 40 dB environ : le béton est ' + c('moins performant') + ' pour les basses fréquences.</p>', { indices: { mieux: 'À gauche du graphique, la courbe du béton est plus basse.' } }),
      choix('c) Le plâtre est-il un bon isolant pour les hautes fréquences ?', [o('ok', 'Oui'), o('non', 'Non')], 'ok',
        '<p>Au-dessus de 2 000 Hz, le plâtre atténue d\'environ 60 dB : ' + c('bon isolant') + ' pour les hautes fréquences.</p>', { indices: { non: 'Regarde la courbe du plâtre au-dessus de 2 000 Hz.' } }),
      choix('d) Et pour les basses fréquences ?', [o('ok', 'Il est moins bon, surtout vers 400 Hz'), o('100', 'Il est moins bon, surtout vers 100 Hz'), o('mieux', 'Il est aussi bon')], 'ok',
        '<p>L\'atténuation du plâtre est plus faible aux basses fréquences, avec un creux vers ' + c('400 Hz') + ' (environ 30 dB).</p>',
        { indices: { 100: 'Cherche le point le plus bas de la courbe du plâtre : il est plus à droite (compte les traits après 100 Hz).', mieux: 'Compare avec les hautes fréquences : la courbe du plâtre est bien plus basse à gauche.' } }),
      choix('e) « Une cloison de plâtre isole aussi bien qu\'un mur de béton. » Est-ce vrai ?', [o('ok', 'Vrai seulement pour les hautes fréquences'), o('vrai', 'Vrai à toutes les fréquences'), o('faux', 'Faux à toutes les fréquences')], 'ok',
        '<p>Les deux courbes se rejoignent au-dessus de 2 000 Hz environ ; en dessous, le béton isole beaucoup mieux (sauf vers 130-200 Hz). C\'est ' + c('vrai seulement en hautes fréquences') + '.</p>',
        { indices: { vrai: 'Compare les courbes vers 400 Hz : l\'écart est important.', faux: 'Compare les courbes vers 4 000 Hz : elles sont presque confondues.' } }),
      { type: 'grille', q: 'f) Quel matériau isole le mieux à chacune de ces fréquences ?', options: [o('b', 'Béton'), o('p', 'Plâtre'), o('e', 'Équivalents')],
        lignes: [{ id: '100', label: '100 Hz', bonne: 'b', indice: 'À 100 Hz, la courbe du béton (≈ 40 dB) est au-dessus de celle du plâtre (≈ 30 dB).' },
          { id: '130', label: '130 Hz', bonne: 'e', indice: 'À 130 Hz (trait repéré), les deux courbes se croisent.' },
          { id: '500', label: '500 Hz', bonne: 'b', indice: 'À 500 Hz, le béton atténue d\'environ 52 dB, le plâtre d\'environ 33 dB.' }],
        correction: '<p>100 Hz : ' + c('béton') + ' (≈ 40 dB contre ≈ 30 dB) ; 130 Hz : ' + c('équivalents') + ' (les courbes se croisent) ; 500 Hz : ' + c('béton') + ' (≈ 52 dB contre ≈ 33 dB).</p>' },
    ],
  };

  /* ---------- Exercice A : audiogramme et bouchons d'oreilles ---------- */
  const exA = {
    id: 'A', groupe: 'feuille', titre: 'Exercice A : audiogramme et bouchons d\'oreilles', desc: 'Perte auditive, âge, choix de bouchons, spectre d\'une flûte',
    contexte: `<p class="er-contexte">Lucas, 17 ans, va souvent à des concerts sans protection. Son médecin lui fait passer un audiogramme (doc. 1).</p>
      <p class="os-fig-leg"><b>Doc. 1 : audiogramme de Lucas</b> (perte auditive ; 0 dB : audition normale)</p>${figLucas()}
      <p class="os-fig-leg"><b>Doc. 2 : pertes auditives moyennes selon l'âge</b></p>${figAges()}
      <p class="os-fig-leg"><b>Doc. 3 : atténuation de deux types de bouchons d'oreilles</b></p>${figBouchons()}
      <p class="os-fig-leg"><b>Doc. 4 : spectre du son d'une flûte</b></p>${figSpectre(window.OS.raiesSon(523, ONDE.flute.a), { unite: 'V', amax: 2, pasA: .25, etiqA: [0, .5, 1, 1.5, 2], fmax: 2500, pasF: 100, etiqF: [0, 500, 1000, 1500, 2000, 2500], H: 190, etiquettes: true })}`,
    parties: [
      nombre('1. Quelle est la perte auditive de Lucas à 4 000 Hz ?', 'perte =', 35, 'dB', `<p>Sur le doc. 1, à 4 000 Hz, la perte est de ${c('35 dB')}.</p>`,
        { tol: 2.5, diag: v => (proche(v, 20, .1) ? 'C\'est la perte à 8 000 Hz : repère le trait de 4 000 Hz.' : 'L\'axe vertical est orienté vers le bas (0 dB en haut, un trait tous les 10 dB).') }),
      choix('2. D\'après le doc. 2, à quel âge correspond habituellement cette perte ? Qu\'en conclure ?', [o('ok', 'À 40-60 ans : Lucas, 17 ans, a un problème d\'audition'), o('jeune', 'À 20-30 ans : son audition est normale'), o('vieux', 'À plus de 70 ans : son audition est normale')], 'ok',
        '<p>À 4 000 Hz, une perte de 35 dB correspond à la courbe ' + c('40 à 60 ans') + '. À 17 ans, c\'est anormal : Lucas a un ' + c('problème d\'audition') + ' (sans doute causé par les concerts).</p>',
        { indices: { jeune: 'À 4 000 Hz, la courbe 20-30 ans est à 5 dB seulement.', vieux: 'À 4 000 Hz, la courbe « plus de 70 ans » est à 55 dB.' } }),
      choix('3. Pour protéger ses oreilles sans déformer la musique, quels bouchons Lucas doit-il choisir (doc. 3) ?', [o('ok', 'Les bouchons moulés : leur atténuation est presque la même à toutes les fréquences'), o('mousse', 'Les bouchons en mousse : ils atténuent le plus')], 'ok',
        '<p>Les ' + c('bouchons moulés') + ' atténuent d\'environ 20 dB à toutes les fréquences. Les bouchons en mousse atténuent beaucoup plus les aigus (40 dB) que les graves (22 dB) : ils déforment le son.</p>',
        { indices: { mousse: 'Ils atténuent beaucoup, mais pas de la même façon à toutes les fréquences : compare 125 Hz et 8 000 Hz.' } }),
      choix('4. Le son de la flûte (doc. 4) est-il pur ou complexe ?', [o('ok', 'Complexe : un fondamental et des harmoniques'), o('pur', 'Pur')], 'ok',
        '<p>Plusieurs raies (fondamental à 523 Hz et harmoniques à 1 046, 1 569 et 2 092 Hz) : ' + c('son complexe') + '.</p>', { indices: { pur: 'Il y a plusieurs raies.' } }),
      choix('5. Que deviennent le spectre et le son de la flûte avec chaque type de bouchons ?', [o('ok', 'Moulés : toutes les raies baissent pareil, le spectre garde sa forme ; mousse : les harmoniques aigus baissent plus, le timbre change'), o('inv', 'Moulés : les harmoniques disparaissent ; mousse : le spectre garde sa forme'), o('note', 'Avec les deux, la note change')], 'ok',
        '<p>Avec les ' + c('bouchons moulés') + ', toutes les raies sont atténuées de la même façon : le spectre ne se déforme pas, le timbre est conservé. Avec la ' + c('mousse') + ', les harmoniques (fréquences plus élevées) sont plus atténués que le fondamental : on perd des harmoniques, le son est moins riche. La note (fondamental) ne change pas.</p>',
        { indices: { inv: 'Regarde le doc. 3 : quelle atténuation varie avec la fréquence ?', note: 'La note est donnée par le fondamental, qui reste à 523 Hz.' } }),
    ],
  };

  /* ---------- Exercice 16 p. 233 : deux instruments ---------- */
  const r16a = window.OS.raiesSon(125, ONDE.ex16a.a), r16b = window.OS.raiesSon(125, ONDE.ex16b.a);
  const ex16 = {
    id: '16', groupe: 'feuille', titre: 'Exercice 16 p. 233 : deux instruments', desc: 'Période, fondamental, harmoniques, hauteur et timbre',
    sons: [{ label: 'Instrument 1', f1: 125, a: ONDE.ex16a.a }, { label: 'Instrument 2', f1: 125, a: ONDE.ex16b.a }],
    contexte: `<p class="er-contexte">Deux instruments jouent la même note. On a enregistré le signal du son de l'instrument 1 et réalisé les spectres des sons des deux instruments.</p>
      ${figSignal(ONDE.ex16a, DOCS.ex16Signal)}<p class="os-fig-leg">Signal du son de l'instrument 1</p>
      <div class="os-figs deux"><div>${figSpectre(r16a, DOCS.ex16, 460)}<p class="os-fig-leg">Spectre de l'instrument 1</p></div><div>${figSpectre(r16b, DOCS.ex16, 460)}<p class="os-fig-leg">Spectre de l'instrument 2</p></div></div>`,
    parties: [
      choix('a) Comment qualifier le signal de l\'instrument 1 ?', [o('ok', 'Périodique, non sinusoïdal'), o('sin', 'Périodique et sinusoïdal'), o('np', 'Non périodique')], 'ok',
        '<p>Le même motif se répète : le signal est ' + c('périodique') + '. Ce n\'est pas une sinusoïde : ' + c('non sinusoïdal') + '.</p>',
        { indices: { sin: 'Les bosses ne sont pas toutes identiques et arrondies comme une sinusoïde.', np: 'Le même motif se répète toutes les 8 ms.' } }),
      nombre('b) Détermine la période T du signal, en secondes.', 'T =', .008, 's', '<p>4 motifs en 32 ms : T = 8 ms = ' + c('0,008 s') + '.</p>',
        { rel: .02, affiche: '0,008', diag: v => (proche(v, 8, .02) ? 'En <b>secondes</b> : 8 ms = 0,008 s.' : proche(v, .032, .02) ? 'C\'est la durée de 4 périodes.' : 'Repère la durée d\'un motif complet (1 graduation = 4 ms).') }),
      nombre('En déduire la fréquence du son.', 'f =', 125, 'Hz', calc(`f = ${fr('1', 'T')} = ${fr('1', '0,008 s')} = ${c('125 Hz')}`),
        { rel: .02, diag: v => (proche(v, .125, .02) ? 'T doit être en secondes.' : 'f = 1 / T.') }),
      choix('c) Que représentent les raies du spectre de l\'instrument 1 ?', [o('ok', 'Le fondamental et des harmoniques'), o('notes', 'Quatre notes jouées en même temps')], 'ok',
        '<p>La première raie est le ' + c('fondamental') + ' ; les suivantes, à des fréquences multiples, sont des ' + c('harmoniques') + '.</p>',
        { indices: { notes: 'Les fréquences des raies sont des multiples de la première : c\'est un seul son, avec ses harmoniques.' } }),
      gabarit('d) Donne les fréquences f<sub>1</sub> à f<sub>4</sub> du spectre de l\'instrument 1.', ['f<sub>1</sub> =', { v: 125, tol: 6 }, '; f<sub>2</sub> =', { v: 250, tol: 6 }, '; f<sub>3</sub> =', { v: 375, tol: 6 }, '; f<sub>4</sub> =', { v: 500, tol: 6 }, 'Hz'],
        calc(`f<sub>1</sub> = ${c('125 Hz')} ; f<sub>2</sub> = 2 × 125 = ${c('250 Hz')} ; f<sub>3</sub> = 3 × 125 = ${c('375 Hz')} ; f<sub>4</sub> = 4 × 125 = ${c('500 Hz')}`),
        { diag: () => 'Lis chaque raie (graduations tous les 125 Hz) ; vérifie avec f<sub>n</sub> = n × f<sub>1</sub>.' }),
      gabarit('e) Donne les fréquences des raies du spectre de l\'instrument 2, dans l\'ordre.', [{ v: 125, tol: 6 }, ';', { v: 250, tol: 6 }, ';', { v: 375, tol: 6 }, ';', { v: 500, tol: 6 }, ';', { v: 750, tol: 6 }, ';', { v: 875, tol: 6 }, 'Hz'],
        `<p>${c('125, 250, 375, 500, 750 et 875 Hz')} : rangs 1, 2, 3, 4, 6 et 7 (pas de raie de rang 5, à 625 Hz).</p>`,
        { diag: v => (v.some(x => Math.abs(x - 625) < 6) ? 'Il n\'y a pas de raie à 625 Hz (rang 5).' : 'Lis chaque raie : les graduations sont tous les 125 Hz.') }),
      choix('f) Les deux sons ont-ils la même hauteur ?', [o('ok', 'Oui : même fondamental, 125 Hz'), o('non', 'Non : l\'instrument 2 a des raies plus aiguës')], 'ok',
        '<p>Même fréquence du fondamental (125 Hz) : ' + c('même hauteur') + ' (même note).</p>', { indices: { non: 'La hauteur est la fréquence du fondamental seulement.' } }),
      choix('g) L\'oreille perçoit pourtant deux sons différents. Pourquoi ?', [o('ok', 'Leurs timbres sont différents : ils n\'ont pas les mêmes harmoniques'), o('fort', 'L\'un est plus fort que l\'autre'), o('haut', 'Ils n\'ont pas la même hauteur')], 'ok',
        '<p>Les harmoniques (nombre et amplitudes) sont différents : les deux sons ont des ' + c('timbres différents') + '. Écoute-les dans le simulateur.</p>',
        { indices: { fort: 'Les fondamentaux ont la même amplitude : ce n\'est pas une question de force.', haut: 'Même fondamental : même hauteur.' } }),
    ],
  };

  /* ---------- Sujet de bac : étude du son d'un violon ---------- */
  const fBac = 7 / 18.25e-3;
  const exBac = {
    id: 'Bac', groupe: 'bac', titre: 'Bac : étude du son d\'un violon', desc: 'Période, fondamental, rangs des harmoniques, hauteur et timbre (Polynésie 2022)',
    contexte: `<p class="er-contexte">Un violoniste joue une note. On enregistre le son avec un micro (doc. 1) et on réalise son spectre (doc. 2). On programme ensuite un microcontrôleur pour qu'il imite le son du violon ; le doc. 3 est le spectre du son produit par le microcontrôleur.</p>
      <p class="os-fig-leg"><b>Doc. 1 : signal du son du violon</b></p>${figSignal(BAC.signal, DOCS.bacSignal)}
      <div class="os-figs deux"><div><p class="os-fig-leg"><b>Doc. 2 : spectre du son du violon</b></p>${figSpectre(BAC.violon, Object.assign({ etiquettes: true }, BAC.optsSpectre), 460)}</div>
        <div><p class="os-fig-leg"><b>Doc. 3 : spectre du son du microcontrôleur</b></p>${figSpectre(BAC.micro, BAC.optsSpectre, 460)}</div></div>`,
    parties: [
      nombre('1. Mesure la durée de 7 motifs du signal (doc. 1).', '7T =', 18.25, 'ms', '<p>7 motifs du signal durent ' + c('18,25 ms') + ' (environ 18,3 ms).</p>',
        { tol: .3, affiche: '18,25', diag: v => (proche(v, 18.25 / 7, .05) ? 'C\'est la durée d\'un seul motif : lis celle de 7 motifs.' : 'Compte 7 motifs à partir de t = 0 (le signal part de 0 en montant).') }),
      nombre('En déduire la période T.', 'T =', 18.25 / 7, 'ms', calc(`T = ${fr('18,25 ms', '7')} ≈ ${c('2,6 ms')}`),
        { tol: .05, affiche: '2,6', diag: v => (proche(v, 18.25 * 7, .02) ? 'On <b>divise</b> par 7.' : 'T = durée de 7 motifs / 7.') }),
      nombre('2. Calcule la fréquence f du son.', 'f =', fBac, 'Hz', calc(`f = ${fr('1', 'T')} = ${fr('7', '18,25 × 10<sup>−3</sup> s')} ≈ ${c('384 Hz')} ≈ 390 Hz`),
        { rel: .03, affiche: '384', diag: v => (proche(v, fBac / 1000, .04) ? 'T doit être en secondes : 2,6 ms = 2,6 × 10<sup>−3</sup> s.' : 'f = 1 / T avec T en s.') }),
      choix('3. Pourquoi le pic A du doc. 2 correspond-il au fondamental ?', [o('ok', 'C\'est le pic de plus petite fréquence, à la fréquence du signal (≈ 390 Hz)'), o('haut', 'C\'est le pic le plus haut'), o('prem', 'C\'est le premier pic écrit sur le graphique')], 'ok',
        '<p>A est le pic de ' + c('plus petite fréquence') + ' et sa fréquence (≈ 390 Hz) est celle du signal : c\'est le ' + c('fondamental') + '.</p>',
        { indices: { haut: 'Le plus haut est le pic B. Le fondamental n\'est pas forcément le plus grand.', prem: 'Ce qui compte, c\'est sa fréquence : la plus petite, égale à celle du signal.' } }),
      gabarit('4. Lis les fréquences des pics B et C.', ['f<sub>B</sub> =', { v: 770, tol: 20 }, 'Hz ; f<sub>C</sub> =', { v: 1160, tol: 20 }, 'Hz'],
        `<p>f<sub>B</sub> ≈ ${c('770 Hz')} ; f<sub>C</sub> ≈ ${c('1 160 Hz')}.</p>`,
        { diag: () => 'Une ligne verticale tous les 50 Hz ; graduations tous les 250 Hz.' }),
      gabarit('5. Calcule les rapports f<sub>B</sub> / f<sub>A</sub> et f<sub>C</sub> / f<sub>A</sub> (au centième).', [`${fr('f<sub>B</sub>', 'f<sub>A</sub>')} =`, { v: 770 / 390, tol: .04 }, `; ${fr('f<sub>C</sub>', 'f<sub>A</sub>')} =`, { v: 1160 / 390, tol: .04 }],
        calc(`${fr('f<sub>B</sub>', 'f<sub>A</sub>')} = ${fr('770', '390')} ≈ ${c('1,97')} ≈ 2 ; ${fr('f<sub>C</sub>', 'f<sub>A</sub>')} = ${fr('1 160', '390')} ≈ ${c('2,97')} ≈ 3`) +
          '<p class="er-petit">Attention : une correction écrit « f<sub>C</sub> / f<sub>1</sub> = 770 / 390 » ; c\'est bien 1 160 / 390.</p>',
        { diag: v => (Math.abs(v[1] - 770 / 390) < .04 ? 'Pour C, divise f<sub>C</sub> = 1 160 Hz (et non 770 Hz) par f<sub>A</sub>.' : 'Divise chaque fréquence par f<sub>A</sub> ≈ 390 Hz.') }),
      gabarit('6. Quels sont les rangs des harmoniques B et C ?', ['B : n =', { v: 2 }, '; C : n =', { v: 3 }],
        '<p>f<sub>B</sub> ≈ 2 × f<sub>A</sub> : ' + c('rang 2') + ' ; f<sub>C</sub> ≈ 3 × f<sub>A</sub> : ' + c('rang 3') + '.</p>',
        { diag: () => 'Le rang est l\'entier le plus proche du rapport f<sub>n</sub> / f<sub>1</sub>.' }),
      choix('7. Le son du microcontrôleur (doc. 3) a-t-il la même hauteur que celui du violon ?', [o('ok', 'Oui : son fondamental est aussi à ≈ 390 Hz'), o('non', 'Non : ses harmoniques sont à 810 Hz et 1 200 Hz')], 'ok',
        '<p>Fondamental à ≈ 390 Hz dans les deux cas : ' + c('même hauteur') + '.</p>', { indices: { non: 'La hauteur ne dépend que du fondamental.' } }),
      choix('8. Comparer leurs timbres.', [o('ok', 'Très proches : les harmoniques sont presque aux mêmes fréquences (≈ 810 et 1 200 Hz contre 770 et 1 160 Hz)'), o('id', 'Identiques'), o('diff', 'Très différents')], 'ok',
        '<p>Les deux spectres ont un fondamental et deux harmoniques voisins (≈ 810 Hz et 1 200 Hz) : les timbres sont ' + c('très proches') + ', pas identiques.</p>',
        { indices: { id: 'Les harmoniques ne sont pas exactement aux mêmes fréquences.', diff: 'Compare les deux spectres : trois raies, à des fréquences voisines.' } }),
    ],
  };

  // les exercices de la feuille dans son ordre, puis le sujet de bac
  window.OS.GROUPES_EX = [
    { id: 'feuille', titre: 'Les exercices de la feuille' },
    { id: 'bac', titre: 'Sujet de bac' },
  ];
  // ordre de la feuille
  window.OS.EXERCICES = [ex6, ex8, ex10, ex11, ex17, exA, ex16, exBac];
  window.OS.DOCS_EX = { ONDE, DOCS, BETON, PLATRE, LUCAS, AGES, MOULES, MOUSSE, interpLog, fmtHz };
})();
