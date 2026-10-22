/* ============================================================
   Exercices du module 5 (application « Chapitre 19 : Ondes
   électromagnétiques ») : les exercices de la feuille, dans son ordre
   et avec la numérotation du manuel : 9, 10 et 11 p. 245, 12 p. 246,
   17 p. 247, puis les exercices de bac 1 « Carte RFID » et 2 « Le
   talkie-walkie ». Les documents sont redessinés en SVG (échelle des
   bandes, figure de l'exercice 12 avec le moteur MOD, carte RFID,
   talkie-walkie à l'échelle, signal et spectre du son enregistré).

   Chaque exercice : { id, num (texte de la pastille), groupe, titre,
   desc, contexte (HTML), parties: [p] ou une fonction qui les
   fabrique } ; chaque partie suit le format de OEM.PARTIES avec p.q
   (question) et p.correction (correction détaillée : formule, grandeur
   isolée, application numérique avec les unités).

   Valeurs vérifiées par un script (c = 3,00 × 10⁸ m·s⁻¹) :
     ex. 9 : 1 mm → 3,0 × 10¹¹ Hz = 300 GHz ; 10 km → 3,0 × 10⁴ Hz =
       30 kHz ; 400 kHz → 750 m ; 252 MHz → 1,19 m ; 1,25 × 10⁵ Hz →
       2 400 m ; 12 000 Hz → 25 000 m (pas radio) ; 125 m → 2,4 MHz
       (MF) ; 3,5 km → 86 kHz (BF) ; 4,5 mm → 67 GHz (EHF) ; 78 m →
       3,8 MHz (HF) ;
     ex. 10 : 2 450 MHz → 0,122 m : micro-ondes ;
     ex. 11 : 0,5 mm ; 1,5 km ; 7,5 cm ; 21 dm ; 7 500 m ; 2,5 GHz →
       12 cm, 6,0 cm ; 45 kHz → 6 667 m, 3 333 m ; 75 Hz → 4 000 km,
       2 000 km ; 1,2 × 10⁵ Hz → 2 500 m, 1 250 m ; 433 MHz → 0,693 m,
       0,346 m ;
     ex. 17 : 700 MHz → 0,43 m (UHF) ; 26 GHz → 11,5 mm (SHF) ;
     bac 1 : BF, HF, UHF ; 135 kHz → 2 222 m ; p = 22 cm ; L = 1 111 m ;
       5 050 tours ;
     bac 2 : canal 3 → λ = 0,673 m, L = 33,6 cm ; 7T = 6,6 ms,
       f ≈ 1 061 Hz → do₅ ; f_m ≈ 4,2 kHz ; f₄ − f₂ = 25 kHz > 8,4 kHz ;
       I₁ = 5,01 × 10⁻⁴ W·m⁻², P = 1,57 × 10⁻³ W ≈ 1,6 × 10⁻³ W ;
       I₅ = 5,1 × 10⁻⁶ W·m⁻², L = 67 dB.
   Écarts avec la correction :
     ex. 11 2. b) la correction arrondit λ à 6,7 × 10³ m avant de
       diviser et trouve 3,4 × 10³ m ; sans arrondi, L = 3 333 m ≈
       3,3 × 10³ m : les deux sont acceptés ;
     bac 2 2.4 le spectre a aussi une toute petite raie vers 5,3 kHz,
       que la correction néglige (f_m ≈ 4,2 kHz) : 5,3 kHz est accepté,
       la conclusion de 2.5 ne change pas ;
     bac 2 2.5 la correction prend l'écart entre les porteuses des
       canaux 4 et 2 (25 kHz) ; l'énoncé dit « deux canaux successifs »
       (12,5 kHz) : les deux sont acceptés, la conclusion ne change pas.
   ============================================================ */
(function () {
  'use strict';

  const { o, fr, proche, fmt, sci, C } = window.OEM;
  const calc = h => `<p class="ph-calc">${h}</p>`;
  const c = h => `<span class="c">${h}</span>`;
  const C8 = '3,00 × 10<sup>8</sup> m·s<sup>−1</sup>';
  // fabriques de parties
  const choix = (q, options, bonne, correction, opts) => Object.assign({ type: 'choix', q, options, bonne, correction, melanger: false, colonne: options.some(x => x.label.replace(/<[^>]+>/g, '').length > 24) }, opts);
  const nombre = (q, label, valeur, unite, correction, opts) => Object.assign({ type: 'nombre', q, label, valeur, unite, correction, signe: false }, opts);
  const scient = (q, label, valeur, unite, correction, opts) => Object.assign({ type: 'sci', q, label, valeur, unite, correction, cs: 2, rel: .03 }, opts);
  const gabarit = (q, morceaux, correction, opts) => Object.assign({ type: 'gabarit', q, morceaux, correction }, opts);
  const grille = (q, lignes, options, correction, opts) => Object.assign({ type: 'grille', q, lignes, options, correction }, opts);
  const fig = (dessin, Wmax) => window.OEM.fig(W => dessin(Math.min(W, Wmax || 640)));
  const doc = (titre, html) => `<div class="oem-doc"><p class="oem-doc-t">${titre}</p>${html}</div>`;
  const tableau = (tete, lignes) => `<div class="ph-defile"><table class="ph-tableau"><thead><tr>${tete.map(t => `<th>${t}</th>`).join('')}</tr></thead><tbody>${lignes.map(l => `<tr>${l.map(x => `<td>${x}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  const bandeDe = f => window.OEM.bande(f).id;

  /* ---------- Exercice 9 p. 245 : les ondes radio ---------- */
  const lignesBandes = vals => vals.map(([id, f, t]) => ({ id, label: `${id}) ${t}`, bonne: bandeDe(f),
    indices: Object.fromEntries(window.OEM.BANDES.map(b => [b.id, window.OEM.diagBande(f, b.id)])) }));
  const ex9 = {
    id: '9', groupe: 'lambda', titre: 'Exercice 9 p. 245 : les ondes radio', desc: 'λ ↔ f, onde radio ou non, bande de fréquences',
    contexte: `<p class="er-contexte">Les ondes radio ont une longueur d'onde comprise entre 1 mm et 10 km.</p>
      <p class="ph-donnees">Donnée : c = ${C8}. Bandes des ondes radio (pour la question 4) :</p>${window.OEM.figBandes()}`,
    parties: [
      scient('1. Calcule la fréquence associée à λ = 1 mm.', 'f =', 3e11, 'Hz', calc(`f = ${fr('c', 'λ')} = ${fr('3,00 × 10<sup>8</sup>', '1 × 10<sup>−3</sup>')} = ${c('3,0 × 10<sup>11</sup> Hz')} = 300 GHz`),
        { diag: v => window.OEM.diagFreq(v, 1e-3, 1) }),
      scient('Calcule la fréquence associée à λ = 10 km.', 'f =', 3e4, 'Hz', calc(`f = ${fr('c', 'λ')} = ${fr('3,00 × 10<sup>8</sup>', '10 × 10<sup>3</sup>')} = ${c('3,0 × 10<sup>4</sup> Hz')} = 30 kHz`),
        { diag: v => window.OEM.diagFreq(v, 1e4, 10) }),
      nombre('2. a) f = 400 × 10<sup>3</sup> Hz : calcule la longueur d\'onde associée.', 'λ =', 750, 'm', calc(`λ = ${fr('c', 'f')} = ${fr('3,00 × 10<sup>8</sup>', '400 × 10<sup>3</sup>')} = ${c('750 m')}`),
        { rel: .01, diag: v => window.OEM.diagLambda(v, 4e5, 400) }),
      nombre('b) f = 252 × 10<sup>6</sup> Hz', 'λ =', C / 252e6, 'm', calc(`λ = ${fr('3,00 × 10<sup>8</sup>', '252 × 10<sup>6</sup>')} = ${c('1,19 m')}`),
        { rel: .01, affiche: '1,19', diag: v => window.OEM.diagLambda(v, 252e6, 252) }),
      nombre('c) f = 1,25 × 10<sup>5</sup> Hz', 'λ =', 2400, 'm', calc(`λ = ${fr('3,00 × 10<sup>8</sup>', '1,25 × 10<sup>5</sup>')} = ${c('2 400 m')} = 2,40 km`),
        { rel: .01, diag: v => window.OEM.diagLambda(v, 1.25e5) }),
      nombre('d) f = 12 000 Hz', 'λ =', 25000, 'm', calc(`λ = ${fr('3,00 × 10<sup>8</sup>', '12 000')} = ${c('25 000 m')} = 25,0 km`),
        { rel: .01, diag: v => window.OEM.diagLambda(v, 12000) }),
      grille('Lesquelles de ces ondes sont des ondes radio (λ entre 1 mm et 10 km) ?', [['a', '750 m'], ['b', '1,19 m'], ['c', '2,40 km'], ['d', '25,0 km']].map(([id, t]) => ({
        id, label: `${id}) λ = ${t}`, bonne: id === 'd' ? 'non' : 'oui', indices: { oui: '25,0 km est plus grand que 10 km.', non: 'Compare λ à 1 mm et à 10 km.' } })),
        [o('oui', 'Onde radio'), o('non', 'Pas une onde radio')], '<p>a), b) et c) sont des ondes radio. d) n\'en est pas une car λ = 25,0 km &gt; 10 km.</p>'),
      scient('3. a) λ = 125 m : calcule la fréquence associée.', 'f =', 2.4e6, 'Hz', calc(`f = ${fr('c', 'λ')} = ${fr('3,00 × 10<sup>8</sup>', '125')} = ${c('2,4 × 10<sup>6</sup> Hz')} = 2,4 MHz`),
        { diag: v => window.OEM.diagFreq(v, 125) }),
      scient('b) λ = 3,5 × 10<sup>3</sup> m', 'f =', C / 3.5e3, 'Hz', calc(`f = ${fr('3,00 × 10<sup>8</sup>', '3,5 × 10<sup>3</sup>')} = ${c('8,6 × 10<sup>4</sup> Hz')} = 86 kHz`),
        { diag: v => window.OEM.diagFreq(v, 3.5e3, 3.5) }),
      scient('c) λ = 4,5 × 10<sup>−3</sup> m', 'f =', C / 4.5e-3, 'Hz', calc(`f = ${fr('3,00 × 10<sup>8</sup>', '4,5 × 10<sup>−3</sup>')} = ${c('6,7 × 10<sup>10</sup> Hz')} = 67 GHz`),
        { diag: v => window.OEM.diagFreq(v, 4.5e-3, 4.5) }),
      scient('d) λ = 7,8 × 10<sup>1</sup> m', 'f =', C / 78, 'Hz', calc(`f = ${fr('3,00 × 10<sup>8</sup>', '78')} = ${c('3,8 × 10<sup>6</sup> Hz')} = 3,8 MHz`),
        { diag: v => window.OEM.diagFreq(v, 78, 7.8) }),
      grille('4. Dans quelle bande se situent ces ondes radio (fréquences de la question 3) ?', lignesBandes([['a', 2.4e6, '2,4 MHz'], ['b', C / 3.5e3, '86 kHz'], ['c', C / 4.5e-3, '67 GHz'], ['d', C / 78, '3,8 MHz']]),
        window.OEM.optionsBande(), '<p>a) 2,4 MHz : bande <b>MF</b> (300 kHz à 3 MHz) ; b) 86 kHz : bande <b>BF</b> (30 à 300 kHz) ; c) 67 GHz : bande <b>EHF</b> (30 à 300 GHz) ; d) 3,8 MHz : bande <b>HF</b> (3 à 30 MHz).</p>'),
    ],
  };

  /* ---------- Exercice 10 p. 245 : le four à micro-ondes ---------- */
  const ex10 = {
    id: '10', groupe: 'lambda', titre: 'Exercice 10 p. 245 : le four à micro-ondes', desc: 'Longueur d\'onde, domaine des micro-ondes',
    contexte: `<p class="er-contexte">Pour réchauffer un plat rapidement, on peut utiliser un four micro-ondes. Le magnétron qui génère les ondes émet des ondes électromagnétiques de fréquence 2 450 MHz.</p>
      <p class="ph-donnees">Donnée : c = ${C8}.</p>`,
    parties: [
      nombre('a) Quelle est la longueur d\'onde des ondes utilisées dans le four micro-ondes ?', 'λ =', C / 2450e6, 'm',
        calc(`λ = ${fr('c', 'f')} = ${fr('3,00 × 10<sup>8</sup>', '2 450 × 10<sup>6</sup>')} = ${c('0,122 m')}`), { rel: .01, affiche: '0,122', diag: v => window.OEM.diagLambda(v, 2450e6, 2450) }),
      choix('b) Ces ondes sont-elles réellement des micro-ondes, sachant que les limites du domaine des micro-ondes sont, en longueur d\'onde, 1 × 10<sup>−3</sup> m et 3 × 10<sup>−1</sup> m ?',
        [o('oui', 'Oui : 0,122 m est compris entre 1 × 10<sup>−3</sup> m et 3 × 10<sup>−1</sup> m'), o('non', 'Non : 0,122 m est plus grand que 3 × 10<sup>−1</sup> m')], 'oui',
        '<p>1 × 10<sup>−3</sup> m = 0,001 m &lt; 0,122 m &lt; 3 × 10<sup>−1</sup> m = 0,3 m : ce sont des micro-ondes.</p>',
        { indices: { non: '3 × 10<sup>−1</sup> m = 0,3 m, et 0,122 m &lt; 0,3 m.' } }),
    ],
  };

  /* ---------- Exercice 11 p. 245 : antennes demi-onde ---------- */
  const diagAnt = (vs, ls) => (vs.some((v, k) => proche(v, ls[k], .02)) ? 'Une antenne demi-onde mesure λ / 2 : n\'oublie pas de diviser par 2.' : vs.some((v, k) => proche(v, ls[k] * 2, .02)) ? 'On divise λ par 2 (et non on multiplie).' : 'L = λ / 2, dans la même unité que λ.');
  const ant = (lettre, f, ftxt, u, k, rel, corr) => {
    const l = C / f / k;
    const aff = v => fmt(v >= 100 ? Math.round(v) : +v.toPrecision(3));
    return gabarit(`${lettre}) f = ${ftxt}`, ['λ =', { v: l, rel: .02, affiche: aff(l) }, `${u} ; L =`, { v: l / 2, rel, affiche: aff(l / 2) }, u], corr,
      { diag: v => (proche(v[1], v[0], .02) ? 'Une antenne demi-onde mesure L = λ / 2.' : !proche(v[0], l, .02) ? window.OEM.diagLambda(v[0], f, null, u) : 'L = λ / 2.') });
  };
  const ex11 = {
    id: '11', groupe: 'lambda', titre: 'Exercice 11 p. 245 : antennes demi-onde', desc: 'Longueur d\'une antenne demi-onde à partir de λ ou de f',
    contexte: `<p class="er-contexte">Détermine les dimensions des antennes linéaires demi-onde que l'on devrait adopter pour émettre ou recevoir dans de bonnes conditions des ondes électromagnétiques suivantes.</p>
      <p class="ph-donnees">Donnée : c = ${C8}. Antenne demi-onde : L = λ / 2.</p>`,
    parties: [
      gabarit('1. Longueur d\'onde : a) 1 mm ; b) 3 km ; c) 15 cm ; d) 42 dm ; e) 1,5 × 10<sup>4</sup> m. Donne la longueur L de chaque antenne demi-onde.',
        ['a)', { v: .5, rel: .01 }, 'mm ; b)', { v: 1.5, rel: .01 }, 'km ; c)', { v: 7.5, rel: .01 }, 'cm ; d)', { v: 21, rel: .01 }, 'dm ; e)', { v: 7500, rel: .01 }, 'm'],
        calc(`L = ${fr('λ', '2')} : a) ${c('0,5 mm')} ; b) ${c('1,5 km')} ; c) ${c('7,5 cm')} ; d) ${c('21 dm')} ; e) ${fr('1,5 × 10<sup>4</sup>', '2')} = ${c('7 500 m')}`),
        { diag: v => diagAnt(v, [1, 3, 15, 42, 15000]) }),
      ant('2. On calcule d\'abord la longueur d\'onde λ = c / f, puis L = λ / 2. a', 2.5e9, '2,5 GHz', 'cm', 1e-2, .02,
        calc(`λ = ${fr('3,00 × 10<sup>8</sup>', '2,5 × 10<sup>9</sup>')} = 0,12 m = ${c('12 cm')} ; L = ${fr('12 cm', '2')} = ${c('6,0 cm')}`)),
      ant('b', 45e3, '45 kHz', 'm', 1, .03,
        calc(`λ = ${fr('3,00 × 10<sup>8</sup>', '45 × 10<sup>3</sup>')} = 6 667 m ≈ ${c('6,7 × 10<sup>3</sup> m')} ; L = ${fr('6 667 m', '2')} ≈ ${c('3,3 × 10<sup>3</sup> m')}`) +
        '<p>(La correction de la feuille divise la valeur arrondie : 6,7 × 10<sup>3</sup> / 2 ≈ 3,4 × 10<sup>3</sup> m ; les deux résultats sont acceptés.)</p>'),
      ant('c', 75, '75 Hz', 'km', 1e3, .02,
        calc(`λ = ${fr('3,00 × 10<sup>8</sup>', '75')} = 4,0 × 10<sup>6</sup> m = ${c('4 000 km')} ; L = ${fr('4,0 × 10<sup>6</sup> m', '2')} = 2,0 × 10<sup>6</sup> m = ${c('2 000 km')}`)),
      ant('d', 1.2e5, '1,2 × 10<sup>5</sup> Hz', 'm', 1, .045,
        calc(`λ = ${fr('3,00 × 10<sup>8</sup>', '1,2 × 10<sup>5</sup>')} = ${c('2,5 × 10<sup>3</sup> m')} ; L = ${fr('2 500 m', '2')} = 1 250 m ≈ ${c('1,3 × 10<sup>3</sup> m')}`)),
      ant('e', 433e6, '433 MHz', 'm', 1, .02,
        calc(`λ = ${fr('3,00 × 10<sup>8</sup>', '433 × 10<sup>6</sup>')} = ${c('0,69 m')} = 6,9 × 10<sup>−1</sup> m ; L = ${fr('0,69 m', '2')} ≈ ${c('0,35 m')}`)),
    ],
  };

  /* ---------- Exercice 12 p. 246 : modulant, porteuse, modulé ---------- */
  const E12 = { fm: 1, F: 20, Um: .7, forme: 'sinus' };
  const sig12 = (type, n) => `<p class="oem-signal-t">Signal ${n}</p>${fig(W => window.MOD.svgSignal(type, E12, { W, titre: '', axeT: false, H: type === 'am' ? 150 : 110 }), 620)}`;
  const ex12 = {
    id: '12', groupe: 'modulation', titre: 'Exercice 12 p. 246 : identifier les signaux', desc: 'Signal modulant, porteuse, signal modulé ; AM ou FM',
    contexte: `<p class="er-contexte">Identifie le signal modulant, l'onde porteuse et le signal modulé sur le schéma ci-dessous. Précise si c'est une modulation d'amplitude ou de fréquence.</p>
      <div class="oem-doc oem-signaux">${sig12('modulant', 1)}${sig12('porteuse', 2)}${sig12('am', 3)}</div>`,
    parties: [
      grille('Identifie chaque signal.', [1, 2, 3].map(n => ({ id: 's' + n, label: `Signal ${n}`, bonne: ['', 'modulant', 'porteuse', 'module'][n],
        indices: { modulant: 'Le modulant est le signal lent (basse fréquence) : c\'est l\'information.', porteuse: 'La porteuse est la sinusoïde rapide d\'amplitude constante.', module: 'Le signal modulé est rapide et son amplitude varie.' } })),
        [o('modulant', 'Modulant'), o('porteuse', 'Porteuse'), o('module', 'Modulé')],
        '<p>Le premier signal est le <b>signal modulant</b>, le deuxième est la <b>porteuse</b>, et le troisième est le <b>signal modulé</b>.</p>'),
      choix('Est-ce une modulation d\'amplitude ou de fréquence ?', [o('am', 'Modulation d\'amplitude'), o('fm', 'Modulation de fréquence')], 'am',
        '<p>L\'amplitude du signal modulé varie au rythme du modulant (son enveloppe reproduit le signal 1) : c\'est une <b>modulation d\'amplitude</b>.</p>',
        { indices: { fm: 'Les oscillations du signal 3 sont régulièrement espacées : c\'est leur hauteur qui varie.' } }),
    ],
  };

  /* ---------- Exercice 17 p. 247 : téléphonie mobile ---------- */
  const ex17 = {
    id: '17', groupe: 'modulation', titre: 'Exercice 17 p. 247 : la téléphonie mobile', desc: 'Longueurs d\'onde, bandes, portée et débit',
    contexte: `<p class="er-contexte">Les réseaux mobiles utilisent une partie du spectre électromagnétique de 700 MHz à 26 GHz. En fonction de la technologie mobile utilisée, les fréquences d'ondes sont différentes :</p>
      <ul class="er-liste"><li>2G : bandes 800 MHz et 1 800 MHz ;</li><li>3G : bandes 900 MHz et 2 100 MHz ;</li><li>4G : bandes 700 MHz, 800 MHz, 1 800 MHz et 2 600 MHz ;</li><li>5G : bandes 700 MHz, 3,5 GHz et 26 GHz.</li></ul>
      <p class="er-contexte" style="margin-top:8px">L'intérêt d'utiliser plusieurs bandes de fréquence est double : il permet d'additionner la bande passante de chaque plage de fréquence pour obtenir un meilleur débit et il permet d'optimiser les différentes propriétés de chaque plage d'ondes.</p>
      <p class="er-contexte" style="margin-top:8px">En effet, les ondes de grande longueur d'onde ont une grande portée et pénètrent mieux dans les bâtiments alors que les ondes de faible longueur d'onde ont une portée limitée et pénètrent moins bien les bâtiments mais permettent des débits plus importants. Les ondes dites moyennes sont, elles, plus polyvalentes.</p>
      <p class="ph-donnees">Donnée : c = ${C8}. Bandes des ondes radioélectriques (graphique redessiné) :</p>${window.OEM.figBandes()}`,
    parties: [
      nombre('a) Calcule la longueur d\'onde correspondant à la fréquence limite basse, 700 MHz.', 'λ =', C / 700e6, 'm', calc(`λ = ${fr('c', 'f')} = ${fr('3,00 × 10<sup>8</sup>', '700 × 10<sup>6</sup>')} = ${c('0,43 m')}`),
        { rel: .01, affiche: '0,43', diag: v => window.OEM.diagLambda(v, 700e6, 700) }),
      nombre('Calcule la longueur d\'onde correspondant à la fréquence limite haute, 26 GHz.', 'λ =', C / 26e9 * 1000, 'mm', calc(`λ = ${fr('3,00 × 10<sup>8</sup>', '26 × 10<sup>9</sup>')} = 0,0115 m = ${c('11,5 mm')}`),
        { rel: .01, affiche: '11,5', diag: v => (proche(v, C / 26e9, .02) ? 'C\'est en mètres : convertis en mm (1 m = 1 000 mm).' : window.OEM.diagLambda(v, 26e9, 26, 'mm')) }),
      grille('b) Dans quelle bande du spectre électromagnétique ces ondes se situent-elles ?', [['l', 700e6, '700 MHz (λ = 0,43 m)'], ['h', 26e9, '26 GHz (λ = 11,5 mm)']].map(([id, f, t]) => ({
        id, label: t, bonne: bandeDe(f), indices: Object.fromEntries(window.OEM.BANDES.map(b => [b.id, window.OEM.diagBande(f, b.id)])) })),
        window.OEM.optionsBande(), '<p>700 MHz est dans la bande <b>UHF</b> des ondes radioélectriques (300 MHz à 3 GHz) ; 26 GHz est dans la bande <b>SHF</b> (3 GHz à 30 GHz).</p>'),
      choix('c) Pourquoi, dans les zones rurales, la téléphonie mobile utilise-t-elle quasi exclusivement des ondes de basse fréquence ?',
        [o('ok', 'Elles ont une grande portée : il faut moins d\'antennes relais pour couvrir le territoire'), o('debit', 'Elles ont le meilleur débit'), o('cout', 'Elles traversent mieux le vide')], 'ok',
        '<p>Les ondes de basse fréquence (grande longueur d\'onde) ont une portée supérieure : on limite le nombre d\'antennes relais tout en couvrant le territoire.</p>',
        { indices: { debit: 'Le texte dit que ce sont les faibles longueurs d\'onde (hautes fréquences) qui permettent les débits les plus importants.', cout: 'Toutes les ondes électromagnétiques se propagent dans le vide ; relis ce que le texte dit de la portée.' } }),
      choix('d) Pourquoi, en milieu urbain, la 4G utilise-t-elle quasi exclusivement les bandes 1,8 GHz et 2,6 GHz ?',
        [o('ok', 'Leur fréquence élevée permet un meilleur débit ; leur portée réduite n\'est pas gênante en ville, où l\'on peut multiplier les relais car les clients sont nombreux'),
          o('portee', 'Elles ont la plus grande portée'), o('bat', 'Elles pénètrent mieux dans les bâtiments')], 'ok',
        '<p>Les bandes 1,8 GHz et 2,6 GHz ont des fréquences élevées, donc des longueurs d\'onde courtes : portée inférieure, mais meilleur débit d\'information. En ville, leur portée moindre n\'est pas un souci et on peut économiquement multiplier les relais car le nombre de clients potentiels est très élevé.</p>',
        { indices: { portee: 'Fréquence élevée = petite longueur d\'onde = portée limitée.', bat: 'Le texte dit que les petites longueurs d\'onde pénètrent moins bien dans les bâtiments.' } }),
      choix('e) Pourquoi la 3G ne permet-elle pas de « surfer » confortablement sur Internet ?',
        [o('ok', 'Son débit d\'information est insuffisant'), o('portee', 'Sa portée est trop faible'), o('freq', 'Ses fréquences ne sont pas dans le domaine radio')], 'ok',
        '<p>Le débit d\'information de la 3G (bandes 900 MHz et 2 100 MHz) est insuffisant pour Internet.</p>',
        { indices: { portee: 'La 3G utilise des fréquences moyennes, de portée correcte ; le problème est le débit.', freq: '900 MHz et 2 100 MHz sont dans la bande UHF des ondes radio.' } }),
      choix('f) Explique pourquoi la bande de 700 MHz sera toujours utilisée lorsque la technologie 5G sera déployée.',
        [o('ok', 'Il faudra toujours émettre avec une portée suffisante vers les zones périphériques et rurales : on garde cette bande de grande longueur d\'onde'),
          o('debit', 'C\'est la bande de plus grand débit'), o('prix', 'Elle permet de supprimer les antennes relais en ville')], 'ok',
        '<p>Lorsque la 5G sera déployée, il faudra toujours pouvoir émettre avec une portée suffisante, surtout vers les zones périphériques et rurales : d\'où le maintien de cette bande à grande longueur d\'onde.</p>',
        { indices: { debit: '700 MHz est la plus basse fréquence de la liste : c\'est la plus grande portée, pas le plus grand débit.', prix: 'En ville, le débit est assuré par les hautes fréquences ; 700 MHz sert surtout pour la portée.' } }),
      choix('g) La 5G en milieu urbain utilisera exclusivement la bande des 26 GHz car elle permet les meilleurs débits. Quel est l\'inconvénient majeur de cette bande de fréquence ?',
        [o('ok', 'Sa portée est très faible'), o('debit', 'Son débit est faible'), o('ant', 'Il faut des antennes immenses')], 'ok',
        '<p>À 26 GHz (λ = 11,5 mm), la portée sera très faible.</p>',
        { indices: { debit: 'Le texte dit que cette bande permet les meilleurs débits.', ant: 'Plus la fréquence est grande, plus λ et l\'antenne sont petites.' } }),
      choix('h) Quelle solution devra être envisagée pour remédier à ce problème ?',
        [o('ok', 'Multiplier les antennes relais'), o('baisser', 'Baisser la fréquence à 700 MHz en ville'), o('rien', 'Augmenter la longueur d\'onde de la 5G')], 'ok',
        '<p>Pour remédier à la faible portée, il faudra multiplier les antennes relais.</p>',
        { indices: { baisser: 'On perdrait le très haut débit, qui est le but de la 5G en ville.', rien: 'La longueur d\'onde est fixée par la fréquence (26 GHz) : on ne peut pas la changer sans perdre le débit.' } }),
    ],
  };

  /* ---------- Exercice de bac 1 : carte RFID ---------- */
  const DOC1 = tableau(['Fréquence de fonctionnement', '135 kHz', '13,56 MHz', '433 MHz'], [
    ['<b>Distance maximale de lecture (m)</b>', '0,5', '1', '3 à 6'],
    ['<b>Taux de transfert</b>', '1 kb·s<sup>−1</sup>', '25 kb·s<sup>−1</sup>', '28 kb·s<sup>−1</sup>'],
    ['<b>Normes</b>', 'ISO 14223-1<br>ISO 18000-2', 'ISO 14443<br>ISO 15693<br>ISO 18000-3', 'ISO 18000-6'],
    ['<b>Caractéristiques générales</b>', 'Faible dégradation des performances en milieu métallique ou liquide', 'Bien adapté aux applications à courte portée ; fréquence unique dans le monde ; les plus utilisées actuellement',
      'Performances dégradées en milieu métallique ou aqueux ; adaptées à la lecture en volume à longue distance']]).replace(/<td>/g, '<td style="white-space:normal;min-width:110px">');
  const DOC3 = tableau(['Type d\'antenne', 'L', ''], [['Antenne pleine onde', 'L = λ', 'La longueur du fil d\'antenne est égale à la longueur d\'onde de l\'onde radio.'],
    ['Antenne demi-onde', 'L = λ / 2', 'La longueur du fil d\'antenne est 2 fois plus petite que la longueur d\'onde de l\'onde radio.'],
    ['Antenne quart d\'onde', 'L = λ / 4', 'La longueur du fil d\'antenne est 4 fois plus petite que la longueur d\'onde de l\'onde radio.'],
    ['Antenne n-ième d\'onde', 'L = λ / n', 'La longueur du fil d\'antenne est n fois plus petite que la longueur d\'onde de l\'onde radio.']]).replace(/<td>La/g, '<td style="white-space:normal;min-width:220px;text-align:left">La');
  const bac1 = {
    id: 'bac1', num: 'Bac 1', groupe: 'bac', titre: 'Exercice de bac 1 : carte RFID', desc: 'Bandes, longueur d\'onde, antenne demi-onde bobinée',
    contexte: `<p class="er-contexte">Une carte de cantine RFID (<i>Radio Frequency IDentification</i>) comporte une puce électronique et une antenne formée d'un fil de longueur L enroulé sur lui-même. La technologie RFID permet au lecteur de carte d'identifier la personne qui passe et d'effectuer le décompte de ses repas sur le réseau informatique du lycée. Lorsque l'on approche la carte du lecteur de puce, celui-ci émet une onde électromagnétique. Cette onde fournit, par induction, de l'énergie à la puce électronique qui s'active et transmet alors un numéro d'identification au lecteur de carte.</p>
      ${doc('Document 1 : fréquences des puces RFID', DOC1)}
      ${doc('Document 2 : domaines des ondes radio et leurs usages', window.OEM.figBandes({ usages: [{ f: 10e9, lignes: ['Radars'] }, { f: 2.4e9, lignes: ['Wi-Fi', 'micro-ondes', 'téléphonie'] }, { f: 100e6, lignes: ['FM'] }] }))}
      ${doc('Document 3 : dimension d\'une antenne', `<p class="ph-donnees">La longueur L (en m) du fil servant d'antenne dépend de la longueur d'onde λ (en m) de l'onde transmise ou reçue. On utilise en général des sous-multiples de la longueur d'onde. Le sous-multiple le plus efficace est la demi-longueur d'onde.</p>${DOC3}`)}
      <p class="ph-donnees">La célérité d'une onde électromagnétique dans l'air vaut c = 3 × 10<sup>8</sup> m·s<sup>−1</sup>.</p>`,
    parties: [
      grille('1. Détermine, à l\'aide des documents 1 et 2, à quel domaine des ondes radio appartient chacune des trois fréquences utilisées en communication RFID.',
        [['f1', 135e3, '135 kHz'], ['f2', 13.56e6, '13,56 MHz'], ['f3', 433e6, '433 MHz']].map(([id, f, t]) => ({ id, label: t, bonne: bandeDe(f),
          indices: Object.fromEntries(window.OEM.BANDES.map(b => [b.id, window.OEM.diagBande(f, b.id)])) })),
        window.OEM.optionsBande(), '<p>135 kHz : <b>BF</b> ; 13,56 MHz : <b>HF</b> ; 433 MHz : <b>UHF</b>.</p>'),
      choix('2. Quels arguments justifient l\'utilisation de plusieurs fréquences pour la communication RFID ?',
        [o('ok', 'S\'adapter à des situations différentes : milieux de propagation différents (métal, liquide), distances de lecture et vitesses de transfert différentes'),
          o('energie', 'Plusieurs fréquences apportent plus d\'énergie à la puce'), o('secu', 'Une seule fréquence serait interdite par les normes')], 'ok',
        '<p>Utiliser plusieurs fréquences permet de s\'adapter à plusieurs situations différentes :</p><ul class="er-liste"><li>des milieux de propagation différents (métal, liquide) ;</li><li>des distances de lecture différentes ;</li><li>des vitesses de transfert plus ou moins grandes.</li></ul>',
        { indices: { energie: 'Relis la ligne « caractéristiques générales » du document 1 : chaque fréquence a ses avantages.', secu: 'Le document 1 cite des normes pour chaque fréquence, mais rien n\'interdit une fréquence unique ; compare plutôt les distances et les taux de transfert.' } }),
      nombre('3. Calcule la longueur d\'onde d\'une onde radio de fréquence 135 kHz.', 'λ =', C / 135e3, 'm', calc(`λ = ${fr('c', 'f')} = ${fr('3 × 10<sup>8</sup>', '135 × 10<sup>3</sup>')} = ${c('2 222 m')}`),
        { rel: .01, affiche: '2 222', diag: v => window.OEM.diagLambda(v, 135e3, 135) }),
      Object.assign(nombre('4. Sur une carte de cantine, l\'antenne RFID est réalisée en bobinant un fil de cuivre autour d\'une surface rectangulaire de longueur 6,5 cm et de largeur 4,5 cm. Calcule le périmètre de la surface rectangulaire.', 'p =', 22, 'cm',
        calc(`p = 2 × 6,5 + 2 × 4,5 = ${c('22 cm')}`), { rel: .01, diag: v => (proche(v, 11) ? 'Le périmètre : 2 × longueur + 2 × largeur.' : proche(v, 29.25) ? 'C\'est l\'aire ; le périmètre est 2 × longueur + 2 × largeur.' : 'p = 2 × longueur + 2 × largeur.') }),
        { figure: z => { z.innerHTML = fig(() => window.OEM.svgCarteRFID()); } }),
      nombre('5. On veut une antenne demi-onde pour la fréquence de 135 kHz (document 3). Quelle doit être la longueur L du fil ?', 'L =', C / 135e3 / 2, 'm', calc(`L = ${fr('λ', '2')} = ${fr('2 222 m', '2')} = ${c('1 111 m')}`),
        { rel: .01, affiche: '1 111', diag: v => (proche(v, C / 135e3, .02) ? 'C\'est λ : une antenne demi-onde mesure λ / 2.' : proche(v, C / 135e3 / 4, .02) ? 'Demi-onde : λ / 2 (et non λ / 4).' : 'L = λ / 2.') }),
      nombre('Calcule le nombre de tours de fil de cuivre qu\'il faut bobiner.', 'n ≈', C / 135e3 / 2 / .22, 'tours', calc(`n = ${fr('L', 'p')} = ${fr('1 111 m', '22 × 10<sup>−2</sup> m')} ≈ ${c('5 050 tours')}`),
        { rel: .02, affiche: '5 050', diag: v => (proche(v, 1111 / 22, .03) ? 'Convertis le périmètre en mètres : 22 cm = 22 × 10<sup>−2</sup> m.' : proche(v, .22 / 1111, .05) ? 'n = L / p (et non p / L).' : 'n = L / p, avec L et p en mètres.') }),
      choix('6. On admet qu\'une onde radio de fréquence 13,56 MHz a une longueur d\'onde de 22 m. Propose un avantage à augmenter la fréquence lorsqu\'on utilise la technologie RFID.',
        [o('debit', 'Le taux de transfert (débit) augmente'), o('antenne', 'L\'antenne est beaucoup plus courte (11 m au lieu de 1 111 m) : moins de tours à bobiner'), o('dist', 'La distance de lecture diminue')], ['debit', 'antenne'],
        '<p>Augmenter la fréquence permet d\'augmenter le <b>taux de transfert</b> (1 kb·s<sup>−1</sup> à 135 kHz, 25 kb·s<sup>−1</sup> à 13,56 MHz). Autre avantage : λ = 22 m donne une antenne demi-onde de 11 m, soit 50 tours seulement.</p>',
        { notes: { debit: 'C\'est l\'avantage donné par la correction. L\'antenne plus courte en est un autre.', antenne: 'C\'est aussi juste ; la correction retient l\'augmentation du taux de transfert.' },
          indices: { dist: 'D\'après le document 1, la distance de lecture augmente avec la fréquence, et une distance plus petite ne serait pas un avantage.' } }),
    ],
  };

  /* ---------- Exercice de bac 2 : le talkie-walkie ---------- */
  // son enregistré (note la plus aiguë) : 5 harmoniques de f1 = 1,06 kHz, phases ajustées sur l'enregistrement de l'énoncé
  const SON = { f1: 1.06, a: [.297, .105, .389, .041, .016], phi: [-.367, -.665, -2.046, -2.841, -2.853] };
  const son = t => SON.a.reduce((s, a, i) => s + a * Math.sin(2 * Math.PI * (i + 1) * SON.f1 * t + SON.phi[i]), 0);
  const figSon = () => fig(W => window.MOD.svgCourbe({ W, H: W < 480 ? 230 : 270, f: son, tmax: 8, pasT: .2, etiqT: [1, 2, 3, 4, 5, 6, 7], ymin: -1.1, ymax: 1.1, pasY: .1, etiqY: [-1, -.5, 0, .5, 1],
    titreT: 'Temps (en ms)', titreY: 'Amplitude', aria: 'Portion du signal enregistré pour la note la plus aiguë : signal périodique non sinusoïdal, environ 7 périodes en 6,6 ms' }), 700);
  const figSpectreSon = () => fig(W => window.MOD.svgRaies({ W, H: 230, fmax: 13.5, pasF: 1, etiqF: [2, 4, 6, 8, 10, 12], amax: .25, pasA: .05, etiqA: [.05, .1, .15, .2],
    raies: SON.a.map((a, i) => ({ f: (i + 1) * SON.f1, a: [.17, .06, .22, .022, .009][i] })), titreF: 'Fréquence (en kHz)', titreA: 'Amplitude',
    aria: 'Spectre d\'amplitude du signal enregistré : raies à 1,06, 2,12, 3,18, 4,24 et 5,3 kHz, d\'amplitudes 0,17, 0,06, 0,22, 0,022 et 0,009' }), 640);
  const CANAUX = [446.00625, 446.01875, 446.03125, 446.04375, 446.05625, 446.06875, 446.08125, 446.09375];
  const NOTES = [['fa<sub>4</sub>', 689.5], ['sol<sub>4</sub>', 784], ['la<sub>4</sub>', 880], ['si<sub>4</sub>', 987.8], ['do<sub>5</sub>', 1046], ['ré<sub>5</sub>', 1175], ['mi<sub>5</sub>', 1319], ['fa<sub>5</sub>', 1397]];
  const tabNotes = `<div class="ph-defile"><table class="ph-tableau"><tbody><tr><th>Note de musique</th>${NOTES.map(n => `<td>${n[0]}</td>`).join('')}</tr><tr><th>Fréquence (en Hz)</th>${NOTES.map(n => `<td>${fmt(n[1])}</td>`).join('')}</tr></tbody></table></div>`;
  const lambda3 = C / (CANAUX[2] * 1e6);
  const bac2 = {
    id: 'bac2', num: 'Bac 2', groupe: 'bac', titre: 'Exercice de bac 2 : le talkie-walkie', desc: 'Antenne demi-onde, son complexe, bande passante d\'un canal, niveau sonore',
    contexte: `<p class="er-contexte">Un talkie-walkie est un émetteur-récepteur radio portatif, permettant la communication radiophonique de courte distance entre deux personnes disposant chacune d'un appareil.</p>
      <p class="er-contexte" style="margin-top:8px">Le talkie-walkie dispose de 8 canaux de communication autorisés dans tous les pays, activés par défaut. Chaque canal est associé à une onde électromagnétique, dite « porteuse ». Les deux personnes doivent sélectionner le même canal pour pouvoir communiquer.</p>
      <div class="oem-figs deux">${doc('Talkie-walkie (photographie redessinée à l\'échelle)', fig(() => window.OEM.svgTalkie()))}
        ${doc('Fréquences des porteuses des différents canaux (extrait de la notice)', tableau(['Canal', 'Fréquence (MHz)'], CANAUX.map((f, i) => [i + 1, f.toFixed(5).replace('.', ',')])))}</div>
      <p class="er-contexte">On s'intéresse d'une part à l'antenne du talkie-walkie, puis à la qualité de la transmission d'un son musical, et enfin à sa sonnerie.</p>`,
    parties: [
      nombre(`<b>1. Antenne de la radio.</b> Les antennes les plus simples sont les antennes dites « dipolaires », constituées de deux brins conducteurs et alimentées en leur milieu. Pour une qualité d'émission optimale, la longueur d'une antenne dipolaire doit être égale à la longueur d'onde de la porteuse, ou à un sous-multiple de la longueur d'onde : demi-longueur d'onde (antenne dite « demi-onde ») ou quart de longueur d'onde (antenne dite « quart d'onde »). Donnée : c = 3,00 × 10<sup>8</sup> m·s<sup>−1</sup>.<br><br>1.1. Calcule la longueur d'onde de la porteuse du canal n° 3 (3 chiffres significatifs).`,
        'λ =', lambda3, 'm', calc(`f = 446,031 25 MHz ; λ = ${fr('c', 'f')} = ${fr('3,00 × 10<sup>8</sup>', '446,031 25 × 10<sup>6</sup>')} = ${c('0,673 m')}`),
        { rel: .004, affiche: '0,673', diag: v => window.OEM.diagLambda(v, CANAUX[2] * 1e6, CANAUX[2]) }),
      nombre('Calcule la longueur de l\'antenne dipolaire demi-onde qu\'il faudrait utiliser pour émettre sur le canal n° 3. Exprime le résultat avec 3 chiffres significatifs.', 'L =', lambda3 / 2 * 100, 'cm',
        calc(`L = ${fr('λ', '2')} = ${fr('0,673 m', '2')} = 0,336 m = ${c('33,6 cm')}`),
        { rel: .004, affiche: '33,6', diag: v => (proche(v, lambda3 * 100, .01) ? 'C\'est λ : l\'antenne demi-onde mesure λ / 2.' : proche(v, lambda3 / 2, .01) ? 'Le résultat est demandé en cm.' : 'L = λ / 2, puis convertis en cm.') }),
      choix('1.2. En te basant sur la photographie, indique si l\'antenne du talkie-walkie semble être une antenne dipolaire demi-onde.',
        [o('non', 'Non : sur la photographie, l\'antenne mesure quelques centimètres, bien moins que 33,6 cm'), o('oui', 'Oui : elle mesure environ 33,6 cm')], 'non',
        '<p>Sur la photographie, l\'antenne fait moins de 33 cm (environ 4 cm) : ce n\'est pas une antenne demi-onde.</p>',
        { indices: { oui: 'Compare l\'antenne avec la règle de 10 cm dessinée à côté.' } }),
      choix(`<b>2. Transmission d'un son musical.</b> On souhaite savoir si une petite mélodie jouée avec un instrument de musique peut être transmise par un talkie-walkie sans être déformée. On appelle « bande passante » d'un canal la largeur de l'intervalle des fréquences susceptibles d'être transmises par ce canal. Pour que la mélodie soit transmise sans déformation, il est nécessaire que la bande passante du canal 3 soit suffisamment large pour transmettre toutes les fréquences contenues dans le spectre de la mélodie. Pour cela, on enregistre la note la plus aiguë de l'instrument pour déterminer la fréquence maximale que pourrait contenir la mélodie.
        <div class="oem-doc"><p class="oem-doc-t">Portion du signal temporel enregistré pour la note la plus aiguë de l'instrument</p>${figSon()}</div>
        2.1. Le son enregistré est-il un son pur ou un son complexe ?`,
        [o('complexe', 'Un son complexe : le signal est périodique mais pas sinusoïdal'), o('pur', 'Un son pur : le signal est périodique')], 'complexe',
        '<p>C\'est un son <b>complexe</b> car le signal n\'est pas sinusoïdal.</p>', { indices: { pur: 'Un son pur est sinusoïdal. Ce signal est périodique, mais chaque motif a plusieurs bosses.' } }),
      nombre('2.2. Chaque note de musique correspond à une fréquence précise. Sur l\'enregistrement, mesure la durée de 7 périodes (de sommet le plus haut à sommet le plus haut).', '7 T =', 7 / SON.f1, 'ms',
        '<p>On mesure entre deux sommets les plus hauts séparés de 7 motifs : <span class="c">7 T ≈ 6,6 ms</span>. Mesurer plusieurs périodes est plus précis.</p>',
        { tol: .12, affiche: '6,6', diag: v => (proche(v, 1 / SON.f1, .1) ? 'C\'est une seule période : mesure la durée de 7 périodes, c\'est plus précis.' : 'Place-toi sur un sommet le plus haut, compte 7 motifs, et lis la durée sur l\'axe (en ms).') }),
      nombre('Déduis-en la fréquence f de la note.', 'f ≈', 7 / 6.6 * 1000, 'Hz',
        calc(`T = ${fr('6,6 ms', '7')} = 0,94 ms ; f = ${fr('1', 'T')} = ${fr('1', '0,94 × 10<sup>−3</sup> s')} ≈ ${c('1 060 Hz')}`),
        { rel: .03, affiche: '1 060', diag: v => (proche(v, 6.6 / 7, .05) || proche(v, 1 / 6.6 * 1000, .05) ? 'f = 1 / T, avec T = (7 T) / 7, en secondes.' : proche(v, 1.06, .05) ? 'En Hz : T est en ms, convertis en s (1 ms = 10<sup>−3</sup> s).' : 'T = (durée de 7 périodes) / 7, puis f = 1 / T avec T en s.') }),
      Object.assign(choix('À l\'aide de l\'enregistrement et du tableau, quelle note de musique est jouée ?', NOTES.map(([n, f]) => o(n, `${n} (${fmt(f)} Hz)`)), 'do<sub>5</sub>',
        '<p>La note la plus proche de 1 060 Hz est le <b>do<sub>5</sub></b> (1 046 Hz).</p>',
        { colonne: false, indices: { 'ré<sub>5</sub>': '1 175 Hz est plus loin de 1 060 Hz que 1 046 Hz.', 'si<sub>4</sub>': '987,8 Hz est plus loin de 1 060 Hz que 1 046 Hz.' }, indice: 'Cherche la fréquence du tableau la plus proche de celle que tu as calculée.' }),
        { figure: z => { z.innerHTML = tabNotes; } }),
      choix(`On trace le spectre d'amplitude du signal enregistré, afin de pouvoir visualiser sa composition.
        <div class="oem-doc"><p class="oem-doc-t">Spectre d'amplitude du signal enregistré</p>${figSpectreSon()}</div>
        2.3. En quoi ce spectre permet-il de retrouver les réponses aux questions 2.1 et 2.2 ?`,
        [o('ok', 'Il a plusieurs pics : le son est composé ; le premier pic (le fondamental), vers 1,05 kHz, donne la fréquence de la note'),
          o('haut', 'Le pic le plus haut, vers 3,2 kHz, donne la fréquence de la note'), o('un', 'Il n\'a qu\'un pic : le son est pur')], 'ok',
        '<p>C\'est un son composé car le spectre a plusieurs pics. On peut mesurer sa fréquence : c\'est celle du premier pic (le fondamental), f ≈ 1 050 Hz.</p>',
        { indices: { haut: 'La fréquence d\'un son est celle du fondamental, le premier pic, même s\'il n\'est pas le plus haut.', un: 'Compte les raies du spectre.' } }),
      nombre('2.4. À l\'aide du spectre, détermine la fréquence maximale des composantes du signal enregistré, notée f<sub>m</sub>.', 'f<sub>m</sub> ≈', 4.2, 'kHz',
        '<p>La dernière raie bien visible est vers <span class="c">f<sub>m</sub> ≈ 4,2 kHz</span> (4 × 1,06 kHz). Une toute petite raie vers 5,3 kHz est négligée par la correction.</p>',
        { tol: .15, aussi: [{ valeur: 5.3, note: 'Tu as pris la toute petite raie vers 5,3 kHz : c\'est juste aussi. La correction la néglige et retient f<sub>m</sub> ≈ 4,2 kHz ; la conclusion de 2.5 ne change pas.' }],
          diag: v => (proche(v, 3.2, .05) ? 'C\'est la raie la plus haute ; on cherche la raie de plus grande <b>fréquence</b> (la plus à droite).' : proche(v, 1.06, .1) ? 'C\'est le fondamental ; on cherche la composante de plus grande fréquence.' : 'Lis la fréquence de la raie la plus à droite (en kHz).') }),
      nombre(`Pour pouvoir transmettre sans déformation un signal de fréquence donnée, la bande passante utilisée doit être au moins égale au double de cette fréquence. On précise que la bande passante de chaque canal correspond à l'écart de fréquence entre les porteuses de deux canaux successifs.<br><br>2.5. Calcule la bande passante du canal 3.`, 'bande passante =', 25, 'kHz',
        calc(`f<sub>4</sub> − f<sub>2</sub> = 446,043 75 − 446,018 75 = 0,025 MHz = ${c('25 kHz')}`) +
        '<p>La correction prend l\'écart entre les porteuses des canaux 4 et 2, qui encadrent le canal 3. L\'énoncé dit « deux canaux successifs » : 446,043 75 − 446,031 25 = 0,012 5 MHz = 12,5 kHz. Ce calcul est accepté aussi : la conclusion ne change pas.</p>',
        { tol: .3, affiche: '25', aussi: [{ valeur: 12.5, note: 'C\'est l\'écart entre deux canaux successifs, comme le dit l\'énoncé. La correction prend l\'écart entre les canaux 4 et 2 (25 kHz) ; la conclusion est la même.' }],
          diag: v => (proche(v, .025, .02) || proche(v, .0125, .02) ? 'C\'est en MHz : convertis en kHz (1 MHz = 1 000 kHz).' : proche(v, 2 * 4.2, .02) ? 'C\'est 2 f<sub>m</sub> ; la bande passante du canal se calcule avec les fréquences des porteuses.' : 'Calcule l\'écart entre les fréquences des porteuses voisines (tableau des canaux), puis convertis en kHz.') }),
      choix('Cette bande passante est-elle suffisante pour transmettre intégralement n\'importe quelle mélodie jouée par l\'instrument, sans déformer le signal ?',
        [o('oui', 'Oui'), o('non', 'Non')], 'oui',
        calc(`2 × f<sub>m</sub> = 2 × 4,2 = 8,4 kHz &nbsp; et &nbsp; 25 kHz &gt; 8,4 kHz`) + '<p>La bande passante est donc <b>suffisante</b> (12,5 kHz &gt; 8,4 kHz aussi ; et même avec f<sub>m</sub> = 5,3 kHz, 2 f<sub>m</sub> = 10,6 kHz reste plus petit).</p>',
        { indices: { non: 'Compare la bande passante au double de f<sub>m</sub> : 2 × 4,2 kHz = 8,4 kHz.' } }),
      scient(`<b>3. Sonnerie du talkie-walkie.</b> Données : relation entre le niveau sonore L en dB et l'intensité sonore I : L = 10 × log(I / I<sub>0</sub>) ou I = I<sub>0</sub> × 10<sup>L/10</sup>, avec I<sub>0</sub> = 10<sup>−12</sup> W·m<sup>−2</sup> ; l'intensité sonore I, à une distance R (en m) d'une source de puissance sonore P (en W), est I = P / (4πR<sup>2</sup>).
        On mesure le niveau sonore de la sonnerie du talkie-walkie n° 1 seul, situé à 50 cm du sonomètre ; on trouve L<sub>1</sub> = 87 dB.<br><br>3.1. Calcule l'intensité sonore I<sub>1</sub> à 50 cm.`, 'I<sub>1</sub> =', 1e-12 * Math.pow(10, 8.7), 'W·m<sup>−2</sup>',
        calc(`I<sub>1</sub> = I<sub>0</sub> × 10<sup>L<sub>1</sub>/10</sup> = 10<sup>−12</sup> × 10<sup>87/10</sup> = ${c('5,01 × 10<sup>−4</sup> W·m<sup>−2</sup>')}`),
        { cs: 3, diag: v => (proche(v, 8.7, .02) ? 'I = I<sub>0</sub> × 10<sup>L/10</sup> : 10 puissance (87 / 10), multiplié par 10<sup>−12</sup>.' : proche(v, 1e-12 * 87 / 10, .05) ? 'L / 10 est un exposant : 10<sup>8,7</sup>, pas 8,7.' : 'I<sub>1</sub> = 10<sup>−12</sup> × 10<sup>8,7</sup>.') }),
      scient('Montre que la puissance sonore de la sonnerie est voisine de P = 1,6 × 10<sup>−3</sup> W : calcule P.', 'P =', 1e-12 * Math.pow(10, 8.7) * 4 * Math.PI * .25, 'W',
        calc(`I<sub>1</sub> = ${fr('P', '4πR<sup>2</sup>')} donc P = I<sub>1</sub> × 4πR<sup>2</sup> = 5,01 × 10<sup>−4</sup> × 4π × (50 × 10<sup>−2</sup>)<sup>2</sup> = 1,57 × 10<sup>−3</sup> W ≈ ${c('1,6 × 10<sup>−3</sup> W')}`),
        { rel: .04, diag: v => (proche(v, 5.01e-4 * 4 * Math.PI * 2500, .05) ? 'R en mètres : 50 cm = 0,50 m.' : proche(v, 5.01e-4 * 4 * Math.PI * .5, .05) ? 'R est au carré : R<sup>2</sup> = 0,50<sup>2</sup> = 0,25 m<sup>2</sup>.' : 'P = I<sub>1</sub> × 4πR<sup>2</sup>, avec R = 0,50 m.') }),
      scient('3.2. Calcule l\'intensité sonore I<sub>5</sub> à 5,0 m de distance du talkie-walkie (prends P = 1,6 × 10<sup>−3</sup> W).', 'I<sub>5</sub> =', 1.6e-3 / (4 * Math.PI * 25), 'W·m<sup>−2</sup>',
        calc(`I<sub>5</sub> = ${fr('P', '4πR<sup>2</sup>')} = ${fr('1,6 × 10<sup>−3</sup>', '4π × 5,0<sup>2</sup>')} = ${c('5,1 × 10<sup>−6</sup> W·m<sup>−2</sup>')}`),
        { diag: v => (proche(v, 1.6e-3 / (4 * Math.PI * 5), .05) ? 'R est au carré : 5,0<sup>2</sup> = 25.' : 'I<sub>5</sub> = P / (4πR<sup>2</sup>), avec R = 5,0 m.') }),
      nombre('Calcule le niveau sonore de la sonnerie à 5,0 m.', 'L<sub>5</sub> =', 67, 'dB',
        calc(`L<sub>5</sub> = 10 × log${fr('I<sub>5</sub>', 'I<sub>0</sub>')} = 10 × log${fr('5,1 × 10<sup>−6</sup>', '10<sup>−12</sup>')} = ${c('67 dB')}`),
        { tol: .6, diag: v => (proche(v, 6.7, .05) ? 'N\'oublie pas le facteur 10 : L = 10 × log(I / I<sub>0</sub>).' : proche(v, 87, .02) ? 'Le niveau sonore diminue quand on s\'éloigne : calcule avec I<sub>5</sub>.' : 'L<sub>5</sub> = 10 × log(I<sub>5</sub> / 10<sup>−12</sup>).') }),
    ],
  };

  window.OEM.GROUPES_EX = [
    { id: 'lambda', titre: 'Longueur d\'onde, fréquence et antennes' },
    { id: 'modulation', titre: 'Modulation et télécommunications' },
    { id: 'bac', titre: 'Exercices de bac' },
  ];
  window.OEM.EXERCICES = [ex9, ex10, ex11, ex12, ex17, bac1, bac2];
})();
