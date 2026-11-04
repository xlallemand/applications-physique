/* ============================================================
   Exercices du module 5 (application « Chapitre 18 : Ondes
   sonores ») : les exercices de la feuille, dans son ordre et avec la
   numérotation du manuel : 6 p. 230, 8 p. 231, 10 et 11 p. 232,
   17 p. 233, exercice A (audiogramme et bouchons d'oreilles), 16 p. 233,
   puis le sujet de bac « Étude du son d'un violon » (Polynésie 2022).
   Énoncés de la feuille (Chap18-Exercices.pdf) et du sujet ; graphiques
   redessinés en SVG d'après les documents (valeurs relevées sur les
   figures agrandies) ; les signaux sont calculés à partir de leur
   série de Fourier (assets/fourier.js, phases du document si besoin).

   Chaque exercice : { id, groupe, titre, desc, contexte (HTML),
   parties: [p] ou une fonction qui les fabrique, sons (spectres à
   écouter dans le simulateur, facultatif) } ; chaque partie suit le
   format de OS.PARTIES avec p.q (question) et p.correction (correction
   détaillée : formule, grandeur isolée, application numérique avec
   les unités).

   Données de la feuille : L = 10 log(I / I0), I0 = 10⁻¹² W·m⁻²,
   I = I0 × 10^(L/10).

   Valeurs vérifiées par un script :
     ex. 6 : signal 2 sin(ωt) + 1,5 sin(2ωt) + 1 sin(4ωt) (en V),
       T = 1,0 ms, f = 1 000 Hz ; raies 1, 2 et 4 kHz (rangs 1, 2 et 4) ;
       I = 10⁻¹² × 10¹⁰ = 1,0 × 10⁻² W·m⁻² ; deux voitures :
       2,0 × 10⁻² W·m⁻², L = 10 log(2,0 × 10¹⁰) ≈ 103 dB ;
     ex. 8 : f1 ≈ 1 kHz (988 Hz : Si₄) ; 2 kHz et 5 kHz : rangs 2 et 5 ;
     ex. 10 : 10 log(10⁷) = 70 dB ; 10 log(4,3 × 10⁵) ≈ 56 dB ;
       10 log(5,0 × 10⁴) ≈ 47 dB ;
     ex. 11 : 10⁻¹² × 10^4,5 ≈ 3,2 × 10⁻⁸ ; 10⁻¹² × 10¹³ = 10 ;
       10⁻¹² × 10⁹ = 1,0 × 10⁻³ W·m⁻² ;
     ex. 17 : 100 Hz : béton 37,5 dB, plâtre 34 dB ; 130 Hz : 35 et
       34 dB ; 500 Hz : 52,5 et 26,5 dB ;
     ex. A : perte de 35 dB à 4 000 Hz (entre les courbes 40 et 60 ans) ;
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
  const P2 = Math.PI / 2;
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
  const raiesDe = l => l.map(([f, a, nom]) => ({ f, a, nom }));
  // raies f1, 2 f1, 3 f1… d'amplitudes a (les amplitudes nulles sont omises)
  const raiesRang = (f1, a) => a.map((x, i) => ({ f: (i + 1) * f1, a: x, n: i + 1 })).filter(r => r.a);

  /* ---------- Documents (redessinés en SVG d'après la feuille) ---------- */
  const ONDE = {
    // ex. 6 : signal du document (en V) : 2 sin(ωt) + 1,5 sin(2ωt) + 1 sin(4ωt), T = 1,0 ms
    ex6: { f1: 1000, a0: 0, a: [2, 1.5, 0, 1] },
    // ex. 16 : signal du document (tension de 0,5 V à 5 V, sommets à 0, 8, 16, 24 ms) :
    // 2 + 0,25 × (5 cos ωt + cos 2ωt + 4 cos 3ωt + 2 cos 4ωt), en V
    ex16Signal: { f1: 125, a0: 2, a: [1.25, .25, 1, .5], phi: [P2, P2, P2, P2] },
    // ex. 16 : amplitudes (en V) des raies des deux spectres du document
    ex16a: [5, 1, 4, 2],
    ex16b: [2.1, 4, 2.1, 3, 0, .6, 1],
    // ex. A : la₄ (880 Hz) joué par la flûte (amplitudes relatives) : sans bouchon, bouchon en mousse, bouchon moulé
    flute: [1, .3, .08], mousse: [1, .03], moule: [1, .28, .065],
  };
  const OPTS_KHZ = { uniteF: 'kHz', titreF: 'Fréquence (en kHz)' };
  const DOCS = {
    ex6Signal: { tmax: 2, pasT: .1, etiqT: [.5, 1, 1.5, 2], ymin: -3.5, ymax: 3.5, pasY: .5, etiqY: [-3, -2, -1, 0, 1, 2, 3], nom: 'u', unite: 'V', titreY: 'Amplitude (en V)',
      aria: 'Signal du bruit du moteur de la Lexus LFA, de 0 à 2 ms' },
    ex6: Object.assign({ unite: 'V', titreA: 'Amplitude (en V)', amax: 2.25, gradA: [0, .25, .5, .75, 1, 1.25, 1.5, 1.75, 2], etiqA: [0, .5, 1, 1.5, 2], fmax: 5000, pasF: 250, etiqF: [0, 1000, 2000, 3000, 4000, 5000], H: 210, etiquettes: true,
      aria: 'Décomposition de Fourier du bruit de la Lexus LFA : raies 1, 2 et 3 à 1, 2 et 4 kHz' }, OPTS_KHZ),
    ex8: { raies: raiesDe([[988, 620], [1976, 320], [4940, 1150]]),
      opts: Object.assign({ unite: '', titreA: 'Amplitude (unité SI)', amax: 1200, pasA: 200, fmax: 6000, pasF: 500, etiqF: [0, 1000, 2000, 3000, 4000, 5000, 6000], H: 220,
        aria: 'Décomposition de Fourier de la note de la 7e lame du glockenspiel : trois raies' }, OPTS_KHZ) },
    ex16Signal: { tmax: 25, pasT: 1, etiqT: [5, 10, 15, 20, 25], ymin: 0, ymax: 5.5, pasY: .5, etiqY: [1, 2, 3, 4, 5], nom: 'u', unite: 'V', titreY: 'Tension (en V)',
      aria: 'Signal de la note enregistrée, de 0 à 25 ms' },
    ex16: { unite: 'V', titreA: 'Amplitude (en V)', amax: 6, pasA: 1, fmax: 1000, pasF: 50, etiqF: [0, 200, 400, 600, 800, 1000], H: 200 },
    bacSignal: { tmax: 20, pasT: .5, etiqT: [2.5, 5, 7.5, 10, 12.5, 15, 17.5, 20], ymin: -.6, ymax: .4, pasY: .1, etiqY: [-.6, -.4, -.2, 0, .2, .4], nom: 'u', unite: 'V', titreY: 'Tension (en V)',
      aria: 'Chronogramme du signal d\'enregistrement du violon, de 0 à 20 ms' },
    // flûte de l'exercice A : 0 à 6 kHz, amplitude relative
    flute: Object.assign({ unite: '', titreA: 'Amplitude relative', amax: 1, pasA: .2, fmax: 6000, pasF: 500, etiqF: [0, 1000, 2000, 3000, 4000, 5000, 6000], H: 170 }, OPTS_KHZ),
  };

  /* ---------- Ex. 17 : graphique en paliers du manuel ----------
     une colonne par bande de fréquences, toutes de même largeur (échelle
     logarithmique), fréquences écrites sur deux rangées comme sur le document */
  const BANDES = [100, 125, 150, 200, 250, 320, 400, 530, 640, 800, 1000, 1200, 1600, 2000, 2500, 3200, 4000, 5000];
  // atténuation (dB) de chaque palier : valeur k entre la graduation k − 1 et la graduation k (k = 0 : avant 100 Hz)
  const BETON = [35, 37.5, 35, 41.5, 44.5, 46.5, 49.5, 52.5, 54, 55.5, 58.5, 60, 63, 66, 68, 70, 72, 75];
  const PLATRE = [null, 34, 34, 31.5, 30, 28.5, 26.5, 26.5, 30, 34.5, 37.5, 40.5, 42.5, 46, 48.5, 50.5, 53.5, 55.5];
  // palier lu à la fréquence f (bande qui contient f)
  const palier = (l, f) => { let k = 0; while (k < BANDES.length && f >= BANDES[k]) k++; return l[k]; };
  function svgBandes(W) {
    const etroit = W < 480, H = 300, x0 = 44, x1 = W - 14, y0 = 30, y1 = H - 66;
    const w = (x1 - x0) / BANDES.length;
    const X = e => x0 + e * w, Y = v => y1 - v / 80 * (y1 - y0);
    const s = [], cls = etroit ? 'fo-txt os-txt-etroit' : 'fo-txt';
    // bornes des bandes : lignes verticales et fréquences écrites sur deux rangées
    BANDES.forEach((f, i) => {
      const x = X(i + 1).toFixed(1);
      s.push(`<line class="fo-grille" x1="${x}" y1="${y0}" x2="${x}" y2="${y1}"/><line class="fo-axe" x1="${x}" y1="${y1}" x2="${x}" y2="${y1 + (i % 2 ? 19 : 5)}"/>`);
      s.push(`<text class="${cls}" x="${x}" y="${y1 + (i % 2 ? 31 : 16)}" text-anchor="middle">${etroit ? f : fmt(f)}</text>`);
    });
    // lignes horizontales tous les 10 dB
    for (let v = 0; v <= 80; v += 10) {
      const y = Y(v).toFixed(1);
      if (v) s.push(`<line class="fo-grille" x1="${x0}" y1="${y}" x2="${x1}" y2="${y}"/>`);
      s.push(`<text class="fo-txt" x="${x0 - 6}" y="${+y + 4}" text-anchor="end">${v}</text>`);
    }
    // axes et titres
    s.push(`<line class="fo-axe" x1="${x0}" y1="${y1}" x2="${x1 + 4}" y2="${y1}"/><path class="fo-pointe" d="M${x1 + 12},${y1}L${x1 + 3},${y1 - 4.5}L${x1 + 3},${y1 + 4.5}Z"/>`);
    s.push(`<line class="fo-axe" x1="${x0}" y1="${y1}" x2="${x0}" y2="${y0 - 14}"/><path class="fo-pointe" d="M${x0},${y0 - 22}L${x0 - 4.5},${y0 - 13}L${x0 + 4.5},${y0 - 13}Z"/>`);
    s.push(`<text class="fo-titre" x="${x0 + 9}" y="${y0 - 12}">Atténuation (en dB)</text>`);
    s.push(`<text class="fo-titre" x="${x1 + 4}" y="${y1 + 50}" text-anchor="end">Fréquence (en Hz)</text>`);
    // paliers : béton (trait plein) dès l'axe, plâtre (tirets) à partir de 100 Hz
    const marches = (l, k0) => l.slice(k0).map((v, j) => `${j ? 'L' : 'M'}${X(k0 + j).toFixed(1)},${Y(v).toFixed(1)}L${X(k0 + j + 1).toFixed(1)},${Y(v).toFixed(1)}`).join('');
    s.push(`<path class="os-courbe" d="${marches(BETON, 0)}"/><path class="os-courbe-2" d="${marches(PLATRE, 1)}"/>`);
    s.push(`<text class="os-txt-courbe" x="${X(9).toFixed(1)}" y="${(Y(BETON[9]) - 10).toFixed(1)}" text-anchor="middle">béton (14 cm)</text>`);
    s.push(`<text class="os-txt-courbe encre" x="${X(7).toFixed(1)}" y="${(Y(PLATRE[7]) + 20).toFixed(1)}" text-anchor="middle">plâtre (7 cm)</text>`);
    return `<svg class="fo-svg os-log" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Atténuation d'un mur de béton de 14 cm (trait plein) et de carreaux de plâtre de 7 cm (tirets), par bandes de fréquences de 100 Hz à 5 000 Hz">${s.join('')}</svg>`;
  }
  const figMurs = () => window.OS.fig(W => svgBandes(Math.min(W, 680)));

  /* ---------- Ex. A : audiogramme, pertes selon l'âge, bouchons ---------- */
  const pts = l => OCTAVES.map((f, k) => [f, l[k]]);
  // perte d'auditivité de l'étudiante aux fréquences 125, 250, 500, 1 000, 2 000, 4 000, 8 000 Hz
  const ETUDIANTE = [10, 10, 10, 10, 25, 35, 50];
  // pertes liées à l'âge (relevées sur le document) : [nom, points [f, perte], suffixe des classes, position de l'étiquette]
  const AGES = [
    ['20 ans', [[125, 2], [250, 2], [500, 2], [1000, 2], [2000, 5], [4000, 8], [8000, 12]], 'age20', { lf: 8000, ancre: 'end', dy: -8 }],
    ['40 ans', [[125, 10], [250, 9], [500, 8.5], [1000, 10], [2000, 17], [4000, 25], [8000, 33]], 'age40', { lf: 8000, ancre: 'end', dy: -12 }],
    ['60 ans', [[125, 18], [250, 17], [500, 17], [1000, 19], [2000, 28], [4000, 58], [6000, 65], [8000, 77]], 'age60', { lf: 4300, ancre: 'start', dy: -9 }],
    ['90 ans', [[125, 24], [250, 24], [500, 24], [1000, 26], [2000, 40], [4000, 82], [6000, 89], [8000, 100]], 'age90', { lf: 2000, ancre: 'end', dy: 18 }],
  ];
  // atténuation (dB) des deux types de bouchons aux mêmes fréquences
  const MOUSSE = [25, 29.5, 32, 31.5, 33, 40, 42], MOULES = [21.5, 23, 20.5, 21.5, 23, 24.5, 24.5];
  const PERTE100 = { ymax: 100, pasY: 10, etiqY: [0, 20, 40, 60, 80, 100] };
  const figEtudiante = () => window.OS.fig(W => window.OS.svgPerte(Object.assign({ W: Math.min(W, 600), H: W < 480 ? 250 : 270, titreY: 'Perte d\'auditivité (en dB)',
    courbes: [{ pts: pts(ETUDIANTE), cls: 'os-courbe', droit: true }], points: OCTAVES.map((f, k) => ({ f, y: ETUDIANTE[k] })),
    aria: 'Audiogramme de l\'étudiante : perte d\'auditivité en fonction de la fréquence' }, PERTE100)));
  const figAges = () => window.OS.fig(W => window.OS.svgPerte(Object.assign({ W: Math.min(W, 600), H: W < 480 ? 260 : 280, titreY: 'Perte (en dB)',
    courbes: AGES.map(([nom, p, k, e]) => Object.assign({ pts: p, cls: 'os-c-' + k, droit: true, label: nom, clsT: 'os-t-' + k }, e)),
    aria: 'Perte auditive liée à l\'âge (20, 40, 60 et 90 ans) en fonction de la fréquence' }, PERTE100)));
  const figBouchons = () => window.OS.fig(W => window.OS.svgLog({ W: Math.min(W, 600), H: W < 480 ? 240 : 260, fmin: 100, fmax: 10000, ymin: 0, ymax: 45, pasY: 5, etiqY: [0, 5, 10, 15, 20, 25, 30, 35, 40, 45],
    etiqF: OCTAVES, titreY: 'Atténuation (en dB)',
    courbes: [{ pts: pts(MOUSSE), cls: 'os-courbe', label: 'bouchon en mousse', lf: 1000, dy: -10 }, { pts: pts(MOULES), cls: 'os-courbe-2', label: 'bouchon moulé', lf: 1000, dy: 20, clsT: 'encre' }],
    aria: 'Courbes d\'atténuation des bouchons en mousse et des bouchons moulés en fonction de la fréquence' }));
  const figFlute = (a, aria) => figSpectre(raiesRang(880, a), Object.assign({ aria }, DOCS.flute), 460);

  /* ---------- Exercice 6 p. 230 : le son d'une Lexus LFA ---------- */
  const I6 = intensite(100);
  const ex6 = {
    id: '6', groupe: 'feuille', titre: 'Exercice 6 p. 230 : le bruit de la Lexus LFA', desc: 'Son pur ou non, fondamental, harmoniques, intensité acoustique, deux voitures',
    contexte: `<p class="er-contexte">On a effectué l'enregistrement du bruit émis par le moteur de la Lexus LFA : la mesure du son émis par la voiture au sonomètre indique <b>100 dB</b>. Le signal de cet enregistrement (simplifié) est donné ci-dessous, ainsi que le résultat de la décomposition de Fourier.</p>
      ${figSignal(ONDE.ex6, DOCS.ex6Signal)}<p class="os-fig-leg">Signal de l'enregistrement</p>
      ${figSpectre(raiesDe([[1000, 2, '①'], [2000, 1.5, '②'], [4000, 1, '③']]), DOCS.ex6)}<p class="os-fig-leg">Décomposition de Fourier</p>${donnees}`,
    parties: [
      choix('1. Le son émis par la Lexus est-il pur ? Justifie.', [o('ok', 'Non : le spectre a trois raies, c\'est un son complexe'), o('pur', 'Oui : le signal est périodique')], 'ok',
        '<p>Le spectre a <b>trois raies</b> (le signal n\'est pas sinusoïdal) : ce n\'est pas un son pur, c\'est un ' + c('son complexe') + '.</p>',
        { indices: { pur: 'Un son pur a un signal <b>sinusoïdal</b> et une seule raie. Être périodique ne suffit pas.' } }),
      nombre('2. Détermine la fréquence du fondamental.', 'f<sub>1</sub> =', 1000, 'Hz', `<p>Le fondamental est la raie ① (la plus petite fréquence) : f<sub>1</sub> = ${c('1 kHz = 1 000 Hz')}.</p>`,
        { tol: 40, diag: v => (proche(v, 1) ? 'L\'axe est en kHz : 1 kHz = 1 000 Hz.' : proche(v, 2000, .05) || proche(v, 4000, .05) ? 'Le fondamental est la raie de <b>plus petite</b> fréquence.' : 'Lis la fréquence de la raie ① (1 graduation écrite = 1 kHz).') }),
      nombre('2 bis. Vérifie que cette fréquence est bien la même que celle que l\'on obtient à partir du signal. Mesure d\'abord la période T.', 'T =', 1, 'ms',
        `<p>Les deux sommets les plus hauts sont à 0,1 ms et 1,1 ms : T = ${c('1,0 ms')} (le motif se répète 2 fois en 2,0 ms).</p>`,
        { tol: .05, affiche: '1,0', diag: v => (proche(v, .5, .05) ? 'Une période est la durée d\'un motif <b>complet</b> : entre deux sommets les plus hauts voisins.' : proche(v, 2, .05) ? 'C\'est la durée de 2 périodes.' : 'Repère deux sommets les plus hauts voisins (1 ligne verticale tous les 0,1 ms).') }),
      nombre('En déduire la fréquence du signal.', 'f =', 1000, 'Hz', calc(`f = ${fr('1', 'T')} = ${fr('1', '1,0 × 10<sup>−3</sup> s')} = ${c('1 000 Hz')}`) + '<p>C\'est bien la fréquence du fondamental.</p>',
        { rel: .02, diag: v => (proche(v, 1, .02) ? 'T doit être en secondes : 1,0 ms = 1,0 × 10<sup>−3</sup> s.' : 'f = 1 / T, avec T en s.') }),
      gabarit('3. Les fréquences des harmoniques sont-elles compatibles avec celle du fondamental ? Lis d\'abord les fréquences des raies ② et ③.', ['f<sub>②</sub> =', { v: 2000, tol: 60 }, 'Hz et f<sub>③</sub> =', { v: 4000, tol: 60 }, 'Hz'],
        `<p>Les raies ② et ③ sont à ${c('2 kHz = 2 000 Hz')} et ${c('4 kHz = 4 000 Hz')}.</p>`,
        { diag: v => (v.some(x => x < 10) ? 'Écris les fréquences en Hz : 1 kHz = 1 000 Hz.' : 'Lis les fréquences des raies ② et ③.') }),
      choix('Ces harmoniques sont-ils compatibles avec le fondamental ?', [o('ok', 'Oui : 2 000 = 2 × 1 000 (rang 2) et 4 000 = 4 × 1 000 (rang 4)'), o('non', 'Non : il manque l\'harmonique de rang 3'), o('non2', 'Non : les raies devraient être régulièrement espacées')], 'ok',
        calc(`f<sub>n</sub> = n × f<sub>1</sub> : ${fr('2 000', '1 000')} = 2 et ${fr('4 000', '1 000')} = 4`) + '<p>Ce sont des multiples de f<sub>1</sub> : harmoniques de rangs 2 et 4. Un harmonique peut manquer (ici le rang 3).</p>',
        { indices: { non: 'Un harmonique peut avoir une amplitude nulle : il manque dans le spectre, ce n\'est pas une erreur.', non2: 'Il suffit que chaque fréquence soit un multiple de f<sub>1</sub>.' } }),
      sciP('4. Calcule l\'intensité acoustique du son émis par la voiture.', 'I =', I6, 'W·m<sup>−2</sup>', calc(`I = I<sub>0</sub> × 10<sup>L/10</sup> = ${I0f} × 10<sup>100/10</sup> = 10<sup>−12</sup> × 10<sup>10</sup> = ${c('1,0 × 10<sup>−2</sup> W·m<sup>−2</sup>')}`),
        { diag: v => diagI(v, 100) }),
      sciP('5. Une deuxième voiture se gare à côté de la première en émettant le même son avec la même intensité acoustique. Quelle est l\'intensité acoustique totale ?', 'I =', 2 * I6, 'W·m<sup>−2</sup>', calc(`I = I<sub>1</sub> + I<sub>2</sub> = 2 × 1,0 × 10<sup>−2</sup> = ${c('2,0 × 10<sup>−2</sup> W·m<sup>−2</sup>')}`),
        { diag: v => (proche(v, intensite(200), .05) ? 'Ce sont les intensités qui s\'additionnent, pas les niveaux.' : 'Les intensités s\'additionnent : I = I<sub>1</sub> + I<sub>2</sub> = 2 × I<sub>1</sub>.') }),
      nombre('Quel est le niveau sonore auquel un amateur de mécanique est soumis ?', 'L =', niveau(2 * I6), 'dB', calc(`L = 10 log${fr('I', 'I<sub>0</sub>')} = 10 log${fr('2,0 × 10<sup>−2</sup>', '10<sup>−12</sup>')} = 10 log(2,0 × 10<sup>10</sup>) ≈ ${c('103 dB')}`) + '<p>Deux sources identiques : + 3 dB (et non 200 dB).</p>',
        { tol: .3, affiche: '103', diag: v => (Math.abs(v - 200) < 1 ? '<b>Les niveaux ne s\'additionnent pas</b>.' : diagL(v, 2 * I6)) }),
    ],
  };

  /* ---------- Exercice 8 p. 231 : le glockenspiel ---------- */
  const NOTES8 = [['La<sub>4</sub>', 880], ['Si<sub>4</sub>', 988], ['Do<sub>5</sub>', 1046], ['Ré<sub>5</sub>', 1174]];
  const ex8 = {
    id: '8', groupe: 'feuille', titre: 'Exercice 8 p. 231 : le glockenspiel', desc: 'Son pur ou non, fondamental, note jouée, harmoniques',
    contexte: `<p class="er-contexte">Les glockenspiels sont des instruments de musique constitués de lames d'acier de longueurs différentes que l'on frappe avec un maillet. La 7<sup>e</sup> lame de l'instrument donne une note dont la décomposition de Fourier est donnée ci-dessous.</p>
      ${figSpectre(DOCS.ex8.raies, DOCS.ex8.opts)}
      <p class="ph-donnees">Données :</p>
      <div class="ph-defile"><table class="ph-tableau"><thead><tr><th>Note</th>${NOTES8.map(n => `<th>${n[0]}</th>`).join('')}</tr></thead><tbody><tr><td>Fréquence (Hz)</td>${NOTES8.map(n => `<td>${fmt(n[1])}</td>`).join('')}</tr></tbody></table></div>`,
    parties: [
      choix('a) Le son émis est-il un son pur ?', [o('ok', 'Non : on distingue le fondamental et deux harmoniques'), o('pur', 'Oui')], 'ok',
        '<p>Le spectre a trois raies : le fondamental et deux harmoniques. Ce n\'est pas un son pur, c\'est un ' + c('son complexe') + '.</p>', { indices: { pur: 'Un son pur n\'a qu\'une raie.' } }),
      nombre('b) Détermine la fréquence du fondamental.', 'f<sub>1</sub> ≈', 1000, 'Hz', `<p>Le fondamental est la raie de plus petite fréquence : f<sub>1</sub> ≈ ${c('1 kHz = 1 000 Hz')}.</p>`,
        { tol: 60, diag: v => (proche(v, 1, .06) ? 'Écris la fréquence en Hz : 1 kHz = 1 000 Hz.' : proche(v, 5000, .05) ? 'Le fondamental est la raie de <b>plus petite fréquence</b>, même si ce n\'est pas la plus haute.' : proche(v, 2000, .05) ? 'Le fondamental est la <b>première</b> raie.' : 'Lis la fréquence de la première raie (1 graduation écrite = 1 kHz).') }),
      choix('c) Le son joué a la fréquence du fondamental. Quelle est la note jouée ?', NOTES8.map(n => o(String(n[1]), n[0])), '988',
        '<p>Le son joué a une fréquence d\'environ 1 kHz : la note la plus proche du tableau est ' + c('Si<sub>4</sub> (988 Hz)') + '.</p>',
        { indices: { 880: '880 Hz est trop loin de 1 000 Hz.', 1046: '1 046 Hz est plus loin de 1 000 Hz que 988 Hz.', 1174: '1 174 Hz est trop loin de 1 000 Hz.' } }),
      gabarit('d) Détermine la fréquence des harmoniques.', ['f =', { v: 2000, tol: 120 }, 'Hz et f =', { v: 5000, tol: 120 }, 'Hz'],
        `<p>Les deux harmoniques sont à ${c('2 kHz')} et ${c('5 kHz')} environ (2 000 Hz et 5 000 Hz).</p>`,
        { diag: v => (v.some(x => x < 10) ? 'Écris les fréquences en Hz : 1 kHz = 1 000 Hz.' : 'Lis les fréquences des deuxième et troisième raies.') }),
      choix('Quelle relation existe entre les fréquences du fondamental et des harmoniques ?', [o('ok', 'f<sub>n</sub> = n × f<sub>1</sub>'), o('plus', 'f<sub>n</sub> = f<sub>1</sub> + n'), o('div', 'f<sub>n</sub> = f<sub>1</sub> / n')], 'ok',
        '<p>La fréquence de l\'harmonique de rang n est un multiple de celle du fondamental : ' + c('f<sub>n</sub> = n × f<sub>1</sub>') + '.</p>',
        { indices: { plus: 'Les fréquences des harmoniques sont des <b>multiples</b> de f<sub>1</sub>.', div: 'Les harmoniques ont des fréquences <b>plus grandes</b> que le fondamental.' } }),
      gabarit('e) Cette relation est-elle vérifiée ? Donne les rangs des deux harmoniques.', ['n =', { v: 2 }, 'et n =', { v: 5 }],
        calc(`${fr('2 kHz', '1 kHz')} = 2 et ${fr('5 kHz', '1 kHz')} = 5 : la relation est vérifiée pour les harmoniques de rangs ${c('2 et 5')}.`),
        { diag: v => (v[0] === 2 && v[1] === 3 ? 'Le rang n\'est pas la position de la raie : n = f<sub>n</sub> / f<sub>1</sub>.' : 'n = f<sub>n</sub> / f<sub>1</sub>.') }),
    ],
  };

  /* ---------- Exercice 10 p. 232 : calculer un niveau sonore ---------- */
  const I10 = [1e-5, 4.3e-7, 5e-8];
  const ex10 = {
    id: '10', groupe: 'feuille', titre: 'Exercice 10 p. 232 : calculer un niveau sonore', desc: 'L = 10 log(I / I₀)',
    contexte: `<p class="er-contexte">Calcule le niveau sonore d'une source sonore si I est égal à (arrondi à l'unité) :</p>
      <ul class="er-liste"><li>a) 1,0 × 10<sup>−5</sup> W·m<sup>−2</sup> ;</li><li>b) 4,3 × 10<sup>−7</sup> W·m<sup>−2</sup> ;</li><li>c) 5,0 × 10<sup>−8</sup> W·m<sup>−2</sup>.</li></ul>${donnees}`,
    parties: I10.map((I, k) => nombre(`${'abc'[k]}) I = ${sci(I, 2)} W·m<sup>−2</sup> :`, 'L =', niveau(I), 'dB',
      calc(`L = 10 log${fr('I', 'I<sub>0</sub>')} = 10 log${fr(sci(I, 2), I0f)} = 10 log(${sci(I / 1e-12, 2)}) ≈ ${c(Math.round(niveau(I)) + ' dB')}`),
      { tol: .6, affiche: String(Math.round(niveau(I))), diag: v => diagL(v, I) })),
  };

  /* ---------- Exercice 11 p. 232 : calculer une intensité sonore ---------- */
  const L11 = [45, 130, 90];
  const ex11 = {
    id: '11', groupe: 'feuille', titre: 'Exercice 11 p. 232 : calculer une intensité acoustique', desc: 'I = I₀ × 10^(L/10)',
    contexte: `<p class="er-contexte">Détermine l'intensité acoustique correspondant à un niveau sonore de :</p>
      <ul class="er-liste"><li>a) 45 dB ;</li><li>b) 130 dB ;</li><li>c) 90 dB.</li></ul>${donnees}`,
    parties: L11.map((L, k) => sciP(`${'abc'[k]}) L = ${L} dB :`, 'I =', intensite(L), 'W·m<sup>−2</sup>',
      calc(`I = I<sub>0</sub> × 10<sup>L/10</sup> = ${I0f} × 10<sup>${L}/10</sup> = 10<sup>−12</sup> × 10<sup>${fmt(L / 10)}</sup> ≈ ${c(sci(intensite(L), 2) + ' W·m<sup>−2</sup>')}`),
      { diag: v => diagI(v, L) })),
  };

  /* ---------- Exercice 17 p. 233 : béton ou plâtre ---------- */
  const r17 = f => `béton ≈ ${fmt(palier(BETON, f))} dB, plâtre ≈ ${fmt(palier(PLATRE, f))} dB`;
  const ex17 = {
    id: '17', groupe: 'feuille', titre: 'Exercice 17 p. 233 : béton ou plâtre ?', desc: 'Atténuation selon la fréquence, épaisseur de la paroi, choix d\'un matériau',
    contexte: `<p class="er-contexte">Les mesures d'atténuation acoustique d'un mur de béton de 14 cm d'épaisseur (trait plein) et de carreaux de plâtre de 7 cm d'épaisseur (tirets) sont résumées dans le graphe ci-dessous. Toutes les bandes de fréquences ont la même largeur : l'axe des fréquences est en échelle logarithmique.</p>${figMurs()}`,
    parties: [
      choix('a) Pour quel domaine de fréquences le béton constitue-t-il un bon isolant phonique ?', [o('hf', 'Les hautes fréquences'), o('bf', 'Les basses fréquences')], 'hf',
        '<p>L\'atténuation du béton augmente avec la fréquence : elle dépasse 60 dB au-dessus de 1 200 Hz. Le béton est un ' + c('bon isolant pour les hautes fréquences') + '.</p>',
        { indices: { bf: 'À gauche (basses fréquences), la courbe du béton est la plus basse : l\'atténuation y est la plus faible.' } }),
      choix('b) Pour quels types de sons est-il moins performant ?', [o('graves', 'Les sons graves (basses fréquences)'), o('aigus', 'Les sons aigus (hautes fréquences)')], 'graves',
        '<p>Vers 100-150 Hz, l\'atténuation n\'est que de 35 à 37 dB : le béton est ' + c('moins performant pour les basses fréquences') + ' (sons graves).</p>',
        { indices: { aigus: 'Les sons aigus ont de hautes fréquences : à droite, la courbe du béton est la plus haute.' } }),
      choix('c) Pour quel domaine de fréquences le plâtre constitue-t-il un bon isolant phonique ?', [o('hf', 'Les hautes fréquences'), o('bf', 'Les basses fréquences')], 'hf',
        '<p>L\'atténuation des carreaux de plâtre atteint 46 à 55 dB au-dessus de 1 600 Hz : ' + c('bon isolant pour les hautes fréquences') + '.</p>',
        { indices: { bf: 'Regarde la courbe du plâtre : où est-elle la plus haute ?' } }),
      choix('d) Pour quels types de sons est-il moins performant ?', [o('400', 'Les sons graves, surtout autour de 400 Hz'), o('100', 'Les sons graves, surtout autour de 100 Hz'), o('aigus', 'Les sons aigus')], '400',
        '<p>Le plâtre est moins performant pour les basses fréquences, avec un creux d\'environ 26 dB entre 320 et 530 Hz : ' + c('surtout autour de 400 Hz') + '.</p>',
        { indices: { 100: 'Cherche le palier le plus bas de la courbe du plâtre : il est plus à droite que 100 Hz.', aigus: 'À droite (sons aigus), la courbe du plâtre monte jusqu\'à 55 dB.' } }),
      choix('e) L\'affirmation selon laquelle plus l\'épaisseur de la paroi est importante, meilleure est l\'atténuation phonique te paraît-elle justifiée ?', [o('hf', 'Oui, mais seulement pour les hautes fréquences'), o('tout', 'Oui, à toutes les fréquences'), o('non', 'Non, à aucune fréquence')], 'hf',
        '<p>Aux hautes fréquences, le mur de béton (14 cm) atténue environ 20 dB de plus que les carreaux de plâtre (7 cm). Mais vers 100-150 Hz, les deux atténuations sont presque égales : l\'affirmation est ' + c('vraie seulement pour les hautes fréquences') + '.</p>',
        { indices: { tout: 'Compare les deux courbes entre 100 et 150 Hz : la paroi la plus épaisse n\'atténue presque pas plus.', non: 'Compare les courbes au-dessus de 1 000 Hz : la paroi la plus épaisse atténue nettement plus.' } }),
      { type: 'grille', q: 'f) Quel matériau choisir si la fréquence des bruits que l\'on souhaite atténuer est de 100 Hz ? de 130 Hz ? de 500 Hz ?', options: [o('b', 'Béton'), o('p', 'Plâtre'), o('e', 'Équivalents')],
        lignes: [{ id: '100', label: '100 Hz', bonne: 'b', indice: `Sur le palier qui commence à 100 Hz, la courbe du béton est au-dessus (${r17(100)}).` },
          { id: '130', label: '130 Hz', bonne: 'e', indice: '130 Hz est entre 125 et 150 Hz : sur ce palier, les deux courbes sont presque au même niveau.' },
          { id: '500', label: '500 Hz', bonne: 'b', indice: `500 Hz est entre 400 et 530 Hz : ${r17(500)}.` }],
        correction: `<p>100 Hz : ${c('béton')} (${r17(100)}) ; 130 Hz : ${c('quasi équivalents')} (${r17(130)}) ; 500 Hz : ${c('béton')} (${r17(500)}).</p>` },
    ],
  };

  /* ---------- Exercice A : audiogramme et bouchons d'oreilles ---------- */
  const exA = {
    id: 'A', groupe: 'feuille', titre: 'Exercice A : audiogramme et bouchons d\'oreilles', desc: 'Perte d\'auditivité, perte liée à l\'âge, choix de bouchons, spectres d\'une flûte',
    contexte: `<p class="er-contexte">Une étudiante, adepte de concerts, passe un audiogramme afin de vérifier son audition. Le diagramme suivant représente sa perte d'auditivité en dB en fonction de la fréquence (doc. 1).</p>
      <p class="os-fig-leg"><b>Doc. 1 : audiogramme de l'étudiante</b></p>${figEtudiante()}
      <p class="er-contexte">La courbe suivante présente la perte auditive liée à l'âge (doc. 2).</p>
      <p class="os-fig-leg"><b>Doc. 2 : perte auditive liée à l'âge</b></p>${figAges()}
      <p class="er-contexte">Elle désire maintenant choisir des protections auditives pour ses prochains concerts. Elle doit choisir entre des bouchons en mousse et des bouchons moulés. La figure ci-dessous représente l'atténuation en dB de ces deux types de bouchons en fonction de la fréquence (doc. 3).</p>
      <p class="os-fig-leg"><b>Doc. 3 : courbes d'atténuation</b></p>${figBouchons()}
      <p class="er-contexte">Elle décide de tester ces bouchons en enregistrant un la<sub>4</sub> joué par une flûte. Elle obtient les spectres de cette note sans bouchon et avec les deux types de bouchons (doc. 4).</p>
      <p class="os-fig-leg"><b>Doc. 4 : spectres du la<sub>4</sub> joué par la flûte</b></p>
      ${figFlute(ONDE.flute, 'Spectre du la4 émis par la flûte')}<p class="os-fig-leg">Spectre du la<sub>4</sub> émis par la flûte</p>
      <div class="os-figs deux"><div>${figFlute(ONDE.mousse, 'Spectre du la4 restitué après passage par un bouchon en mousse')}<p class="os-fig-leg">Après passage par un bouchon en mousse</p></div>
        <div>${figFlute(ONDE.moule, 'Spectre du la4 restitué après passage par un bouchon moulé en silicone')}<p class="os-fig-leg">Après passage par un bouchon moulé en silicone</p></div></div>`,
    parties: [
      nombre('1. Quelle est sa perte, en dB, pour 4 000 Hz (doc. 1) ?', 'perte =', 35, 'dB', `<p>Sur le doc. 1, à 4 000 Hz, la perte d'auditivité est de ${c('35 dB')}.</p>`,
        { tol: 2.5, diag: v => (proche(v, 50, .06) ? 'C\'est la perte à 8 000 Hz : repère le trait de 4 000 Hz.' : proche(v, 25, .08) ? 'C\'est la perte à 2 000 Hz : repère le trait de 4 000 Hz.' : 'L\'axe vertical est orienté vers le bas (0 dB en haut, un trait tous les 10 dB).') }),
      choix('2. L\'étudiante a-t-elle un problème d\'audition (doc. 2) ? Justifie.', [o('ok', 'Oui : à 4 000 Hz, une perte de 35 dB correspond à une personne de 40 à 60 ans'), o('jeune', 'Non : sa perte est celle d\'une personne de 20 ans'), o('vieux', 'Non : sa perte est plus petite que celle d\'une personne de 90 ans')], 'ok',
        '<p>À 4 000 Hz, une perte de 35 dB se situe entre les courbes ' + c('40 ans et 60 ans') + ' (25 dB et 58 dB). À moins que cette étudiante soit particulièrement âgée, elle a un ' + c('problème d\'audition') + '.</p>',
        { indices: { jeune: 'À 4 000 Hz, la courbe 20 ans est vers 8 dB seulement.', vieux: 'Il faut comparer à une personne de <b>son âge</b> : une étudiante a environ 20 ans.' } }),
      choix('3. Quels sont les bouchons qui ont la meilleure qualité acoustique, c\'est-à-dire qui déformeront le moins possible le son des concerts (doc. 3) ?', [o('ok', 'Les bouchons moulés : leur atténuation est à peu près la même quelle que soit la fréquence'), o('mousse', 'Les bouchons en mousse : ils atténuent le plus')], 'ok',
        '<p>Les ' + c('bouchons moulés') + ' atténuent d\'environ 20 à 25 dB à toutes les fréquences. Les bouchons en mousse atténuent plus les fréquences élevées (42 dB à 8 000 Hz) que les basses (25 dB à 125 Hz) : ils déforment le son en atténuant plus les aigus que les graves.</p>',
        { indices: { mousse: 'Ils atténuent beaucoup, mais pas de la même façon à toutes les fréquences : compare 125 Hz et 8 000 Hz.' } }),
      choix('4. Le son de la flûte est-il un son pur ou un son composé ? Justifie.', [o('ok', 'Un son composé : son spectre présente des harmoniques'), o('pur', 'Un son pur : une raie est beaucoup plus haute que les autres')], 'ok',
        '<p>Le spectre du la<sub>4</sub> présente un fondamental (880 Hz) et des harmoniques (1 760 Hz et 2 640 Hz) : c\'est un ' + c('son composé') + ' (complexe).</p>', { indices: { pur: 'Un son pur n\'a qu\'<b>une seule</b> raie, même petite à côté.' } }),
      choix('5. Quels sont les bouchons qui déformeront le moins possible le son ? Justifie à l\'aide des spectres.', [o('ok', 'Les bouchons moulés : le spectre garde ses harmoniques, sa forme ne change pas'), o('mousse', 'Les bouchons en mousse : il ne reste presque que le fondamental'), o('aucun', 'Aucun : les deux bouchons changent la note')], 'ok',
        '<p>Avec le bouchon en mousse, les harmoniques ont presque disparu : la forme du spectre est modifiée. Avec le bouchon moulé, le spectre garde la même forme (fondamental et harmoniques). Les bouchons qui déformeront le moins le son sont les ' + c('bouchons moulés') + '.</p>',
        { indices: { mousse: 'Un spectre sans ses harmoniques n\'a plus le même <b>timbre</b> : le son est déformé.', aucun: 'Le fondamental reste à 880 Hz dans les trois spectres : la note ne change pas.' } }),
    ],
  };

  /* ---------- Exercice 16 p. 233 : deux instruments ---------- */
  const ex16 = {
    id: '16', groupe: 'feuille', titre: 'Exercice 16 p. 233 : la même note, deux instruments', desc: 'Période, fondamental, harmoniques, hauteur et timbre',
    sons: [{ label: 'Instrument 1', f1: 125, a: ONDE.ex16a }, { label: 'Instrument 2', f1: 125, a: ONDE.ex16b }],
    contexte: `<p class="er-contexte">Une note jouée par un instrument est enregistrée à l'aide d'un microphone relié à un système d'acquisition informatisé pour obtenir le graphique ci-dessous.</p>
      ${figSignal(ONDE.ex16Signal, DOCS.ex16Signal)}
      <p class="er-contexte">Un logiciel d'analyse spectrale permet ensuite d'obtenir le spectre 1. L'analyse par le même dispositif de la même note émise par un autre instrument donne le spectre 2.</p>
      <div class="os-figs deux"><div>${figSpectre(raiesRang(125, ONDE.ex16a), DOCS.ex16, 460)}<p class="os-fig-leg">Spectre 1 : premier instrument</p></div><div>${figSpectre(raiesRang(125, ONDE.ex16b), DOCS.ex16, 460)}<p class="os-fig-leg">Spectre 2 : autre instrument</p></div></div>`,
    parties: [
      choix('a) Le signal est-il sinusoïdal ? Est-il périodique ? Justifie.', [o('ok', 'Périodique mais pas sinusoïdal'), o('sin', 'Périodique et sinusoïdal'), o('np', 'Non périodique')], 'ok',
        '<p>Le même motif se répète : le signal est ' + c('périodique') + '. Ce motif n\'est pas celui d\'une sinusoïde : il est ' + c('non sinusoïdal') + '.</p>',
        { indices: { sin: 'Une sinusoïde n\'a qu\'une bosse par période ; ici, il y en a plusieurs de hauteurs différentes.', np: 'Le même motif se répète toutes les 8 ms.' } }),
      nombre('b) Détermine la période T du signal, en secondes.', 'T =', .008, 's', '<p>Deux sommets les plus hauts voisins : t = 8 ms et t = 16 ms. T = 8 ms = ' + c('0,008 s') + '.</p>',
        { rel: .02, affiche: '0,008', diag: v => (proche(v, 8, .02) ? 'En <b>secondes</b> : 8 ms = 0,008 s.' : proche(v, .004, .03) ? 'Une période va d\'un sommet le plus haut au suivant.' : proche(v, .024, .02) ? 'C\'est la durée de 3 périodes.' : 'Repère la durée d\'un motif complet (1 ligne verticale par ms).') }),
      nombre('Détermine la fréquence de ce signal.', 'f =', 125, 'Hz', calc(`f = ${fr('1', 'T')} = ${fr('1', '0,008 s')} = ${c('125 Hz')}`),
        { rel: .02, diag: v => (proche(v, .125, .02) ? 'T doit être en secondes.' : 'f = 1 / T.') }),
      choix('c) Que représentent les fréquences qui apparaissent sur le spectre 1 ?', [o('ok', 'Les fréquences du fondamental et des harmoniques'), o('notes', 'Quatre notes jouées en même temps')], 'ok',
        '<p>Ce sont les fréquences du ' + c('fondamental') + ' (la première raie) et des ' + c('harmoniques') + ' (fréquences multiples).</p>',
        { indices: { notes: 'Les fréquences des raies sont des multiples de la première : c\'est un seul son, avec ses harmoniques.' } }),
      gabarit('d) Détermine la fréquence du fondamental et des harmoniques (spectre 1).', ['f<sub>1</sub> =', { v: 125, tol: 10 }, '; f<sub>2</sub> =', { v: 250, tol: 10 }, '; f<sub>3</sub> =', { v: 375, tol: 10 }, '; f<sub>4</sub> =', { v: 500, tol: 10 }, 'Hz'],
        calc(`f<sub>1</sub> = ${c('125 Hz')} ; f<sub>2</sub> = 2 × 125 = ${c('250 Hz')} ; f<sub>3</sub> = 3 × 125 = ${c('375 Hz')} ; f<sub>4</sub> = 4 × 125 = ${c('500 Hz')}`) + '<p>La relation f<sub>n</sub> = n × f<sub>1</sub> est bien vérifiée.</p>',
        { diag: () => 'Lis chaque raie (une ligne verticale tous les 50 Hz) ; vérifie avec f<sub>n</sub> = n × f<sub>1</sub>.' }),
      gabarit('e) Détermine la fréquence du fondamental et celle des harmoniques (spectre 2), dans l\'ordre.', [{ v: 125, tol: 10 }, ';', { v: 250, tol: 10 }, ';', { v: 375, tol: 10 }, ';', { v: 500, tol: 10 }, ';', { v: 750, tol: 10 }, ';', { v: 875, tol: 10 }, 'Hz'],
        `<p>f<sub>1</sub> = 125 Hz ; harmoniques : ${c('250, 375, 500, 750 et 875 Hz')} (rangs 2, 3, 4, 6 et 7 : pas de raie de rang 5, à 625 Hz).</p>`,
        { diag: v => (v.some(x => Math.abs(x - 625) < 10) ? 'Il n\'y a pas de raie à 625 Hz (rang 5).' : 'Lis chaque raie : une ligne verticale tous les 50 Hz.') }),
      choix('f) Ces deux instruments ont-ils la même hauteur ?', [o('ok', 'Oui : même fondamental, 125 Hz'), o('non', 'Non : le deuxième a des raies plus aiguës')], 'ok',
        '<p>La hauteur est donnée par la fréquence du fondamental : 125 Hz dans les deux cas, ' + c('même hauteur') + '.</p>', { indices: { non: 'La hauteur ne dépend que de la fréquence du fondamental.' } }),
      choix('g) Ces deux notes donnent-elles la même sensation sonore ? Comment se nomme cette propriété ?', [o('ok', 'Non : l\'impression sonore est différente, c\'est le timbre'), o('haut', 'Non : c\'est la hauteur qui change'), o('oui', 'Oui : même note, même sensation')], 'ok',
        '<p>Les harmoniques (nombre et amplitudes) sont différents : l\'impression sonore est différente. On nomme cela le ' + c('timbre') + '. Écoute les deux sons dans le simulateur.</p>',
        { indices: { haut: 'Même fondamental : même hauteur.', oui: 'Même note ne veut pas dire même son : compare les harmoniques des deux spectres.' } }),
    ],
  };

  /* ---------- Sujet de bac : étude du son d'un violon ---------- */
  const fBac = 7 / 18.25e-3;
  const exBac = {
    id: 'Bac', groupe: 'bac', titre: 'Bac : étude du son d\'un violon', desc: 'Période, fondamental, rangs des harmoniques, hauteur et timbre (Polynésie 2022)',
    contexte: `<p class="er-contexte">Un élève souhaite reproduire électroniquement le son d'un violon. Cet exercice propose de suivre les premières étapes de sa démarche. L'élève enregistre le son d'un violon à l'aide d'un microphone et d'un logiciel d'acquisition. Il obtient le chronogramme suivant.</p>
      <p class="os-fig-leg"><b>Document 1 : chronogramme du signal d'enregistrement du violon</b></p>${figSignal(BAC.signal, DOCS.bacSignal, 680)}
      <p class="er-contexte">Le spectre d'amplitude du son du violon est obtenu à l'aide d'un logiciel d'acquisition.</p>
      <p class="os-fig-leg"><b>Document 2 : spectre d'amplitude de l'enregistrement du violon</b></p>${figSpectre(BAC.violon, BAC.optsViolon, 620)}
      <p class="er-contexte">Pour générer un son complexe, l'élève utilise un microcontrôleur. Le son est enregistré et analysé de la même manière que pour le violon. Le spectre d'amplitude du son émis par le haut-parleur est donné ci-dessous.</p>
      <p class="os-fig-leg"><b>Document 3 : spectre d'amplitude du son produit par le microcontrôleur</b></p>${figSpectre(BAC.micro, BAC.optsMicro, 620)}`,
    parties: [
      nombre('1. Détermine le plus précisément possible la période T du son émis par le violon à l\'aide du chronogramme : mesure d\'abord la durée de 7 motifs.', '7T =', 18.25, 'ms', '<p>Les sommets les plus hauts sont à 1,2 ms et 19,4 ms environ : 7 motifs durent ' + c('18,25 ms') + ' (environ 18,2 à 18,4 ms).</p>',
        { tol: .3, affiche: '18,25', diag: v => (proche(v, 18.25 / 7, .05) ? 'C\'est la durée d\'un seul motif : lis celle de 7 motifs.' : 'Prends le premier et le dernier des sommets les plus hauts du document : ils sont séparés de 7 motifs.') }),
      nombre('En déduire la période T.', 'T =', 18.25 / 7, 'ms', calc(`T = ${fr('18,25 ms', '7')} ≈ ${c('2,6 ms')}`),
        { tol: .05, affiche: '2,6', diag: v => (proche(v, 18.25 * 7, .02) ? 'On <b>divise</b> par 7.' : 'T = durée de 7 motifs / 7.') }),
      nombre('2. Vérifie que la fréquence du son émis par le violon est voisine de 390 Hz : calcule f.', 'f =', fBac, 'Hz', calc(`f = ${fr('1', 'T')} = ${fr('1', '2,6 × 10<sup>−3</sup> s')} ≈ ${c('384 Hz')}`) + '<p>La fréquence trouvée avoisine bien les 390 Hz, aux incertitudes de mesure près.</p>',
        { rel: .03, affiche: '384', diag: v => (proche(v, fBac / 1000, .04) ? 'T doit être en secondes : 2,6 ms = 2,6 × 10<sup>−3</sup> s.' : 'f = 1 / T avec T en s.') }),
      choix('3. Justifie que le pic A correspond au fondamental du signal enregistré.', [o('ok', 'C\'est le pic de plus petite fréquence, à la fréquence du signal (≈ 390 Hz)'), o('haut', 'C\'est le pic le plus haut'), o('prem', 'C\'est le premier pic nommé sur le graphique')], 'ok',
        '<p>Le pic A est le ' + c('plus petit pic en fréquence') + '. Il est situé autour de 390 Hz, qui est bien la fréquence émise par le violon : c\'est le ' + c('fondamental') + '.</p>',
        { indices: { haut: 'Le plus haut est le pic B. Le fondamental n\'est pas forcément le plus grand.', prem: 'Ce qui compte, c\'est sa fréquence : la plus petite, égale à celle du signal.' } }),
      gabarit('4. Les pics B et C sont associés aux harmoniques du signal enregistré. Donne leurs fréquences.', ['f<sub>B</sub> =', { v: 770, tol: 20 }, 'Hz ; f<sub>C</sub> =', { v: 1160, tol: 20 }, 'Hz'],
        `<p>Graphiquement, on lit f<sub>B</sub> ≈ ${c('770 Hz')} et f<sub>C</sub> ≈ ${c('1 160 Hz')}.</p>`,
        { diag: () => 'Une graduation tous les 50 Hz ; nombres écrits tous les 250 Hz.' }),
      gabarit('5. Vérifie la relation f<sub>n</sub> = n × f<sub>1</sub> : calcule les rapports f<sub>B</sub> / f<sub>1</sub> et f<sub>C</sub> / f<sub>1</sub> (au centième), avec f<sub>1</sub> = 390 Hz.', [`${fr('f<sub>B</sub>', 'f<sub>1</sub>')} =`, { v: 770 / 390, tol: .04 }, `; ${fr('f<sub>C</sub>', 'f<sub>1</sub>')} =`, { v: 1160 / 390, tol: .04 }],
        calc(`${fr('f<sub>B</sub>', 'f<sub>1</sub>')} = ${fr('770', '390')} ≈ ${c('1,97')} ≈ 2 ; ${fr('f<sub>C</sub>', 'f<sub>1</sub>')} = ${fr('1 160', '390')} ≈ ${c('2,97')} ≈ 3`) +
          '<p>On ne trouve pas exactement des entiers, à cause des incertitudes de lecture : la relation f<sub>n</sub> = n × f<sub>1</sub> est bien vérifiée.</p><p class="er-petit">Attention : la correction écrit « f<sub>C</sub> / f<sub>1</sub> = 770 / 390 » ; c\'est bien 1 160 / 390.</p>',
        { diag: v => (Math.abs(v[1] - 770 / 390) < .04 ? 'Pour C, divise f<sub>C</sub> = 1 160 Hz (et non 770 Hz) par f<sub>1</sub>.' : 'Divise chaque fréquence par f<sub>1</sub> = 390 Hz.') }),
      gabarit('6. Indique les rangs des harmoniques B et C.', ['B : n =', { v: 2 }, '; C : n =', { v: 3 }],
        '<p>f<sub>B</sub> ≈ 2 × f<sub>1</sub> : l\'harmonique B est de ' + c('rang 2') + ' ; f<sub>C</sub> ≈ 3 × f<sub>1</sub> : l\'harmonique C est de ' + c('rang 3') + '.</p>',
        { diag: () => 'Le rang est l\'entier le plus proche du rapport f<sub>n</sub> / f<sub>1</sub>.' }),
      choix('7. Vérifie que le son produit par le microcontrôleur a la même hauteur que la note jouée par le violon.', [o('ok', 'Même hauteur : son fondamental est aussi à ≈ 390 Hz'), o('non', 'Hauteur différente : ses harmoniques sont à 810 Hz et 1 200 Hz')], 'ok',
        '<p>On lit le fondamental du microcontrôleur sur le grand pic vers ' + c('390 Hz') + ' (les petits pics voisins, moins hauts, ne changent pas la hauteur). Le microcontrôleur et le violon ont la même fréquence fondamentale : ils ont la ' + c('même hauteur') + '.</p>',
        { indices: { non: 'La hauteur ne dépend que de la fréquence du fondamental.' } }),
      choix('8. Justifie que le son produit par le microcontrôleur est similaire à celui d\'un violon.', [o('ok', 'Il a aussi des harmoniques autour de 810 Hz et 1 200 Hz : les timbres sont très proches'), o('id', 'Ses pics ont les mêmes amplitudes que ceux du violon'), o('h', 'Il a seulement la même hauteur')], 'ok',
        '<p>Le microcontrôleur possède aussi des ' + c('harmoniques autour de 810 Hz et 1 200 Hz') + ' : le violon et le microcontrôleur ont quasiment les mêmes harmoniques, leurs ' + c('timbres sont extrêmement proches') + '. Le son produit par le microcontrôleur est donc similaire à celui d\'un violon.</p>',
        { indices: { id: 'Les amplitudes sont très différentes (de l\'ordre de 0,1 V pour le violon, 0,001 V pour le microcontrôleur) : compare plutôt les fréquences des pics.', h: 'La même hauteur ne suffit pas : un son « similaire » a aussi le même timbre.' } }),
    ],
  };

  // les exercices de la feuille dans son ordre, puis le sujet de bac
  window.OS.GROUPES_EX = [
    { id: 'feuille', titre: 'Les exercices de la feuille' },
    { id: 'bac', titre: 'Sujet de bac' },
  ];
  // ordre de la feuille
  window.OS.EXERCICES = [ex6, ex8, ex10, ex11, ex17, exA, ex16, exBac];
  window.OS.DOCS_EX = { ONDE, DOCS, BANDES, BETON, PLATRE, palier, ETUDIANTE, AGES, MOULES, MOUSSE, interpLog, fmtHz };
})();
