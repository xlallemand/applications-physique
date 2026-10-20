/* ============================================================
   Exercices du module 5 (application « Chapitre 9 : Statique des
   fluides ») : les exercices de la feuille, dans son ordre et avec sa
   numérotation : 7, 8 et 11 p. 119 (pression, force pressante),
   14 p. 120 (baie vitrée), 21 p. 121 (cric hydraulique), 18 p. 121
   (piscine), 15 p. 120 (deux liquides), 22 p. 121 (baromètre de
   Torricelli), puis l'exercice supplémentaire 20 p. 120 (chalet).
   Données de la feuille : P_atm = 1 bar = 10⁵ Pa ; g = 9,81 N·kg⁻¹
   (la feuille écrit « N·m⁻² ») ; 1 atm = 1 bar.

   Chaque exercice : { id, groupe, titre, desc, contexte (HTML),
   parties: [p] ou une fonction qui les fabrique } ; chaque partie suit
   le format de SF.PARTIES avec p.q (question) et p.correction
   (correction détaillée : formule, grandeur isolée, application
   numérique avec les unités).

   Valeurs vérifiées par un script :
     ex. 7 : 2,0 × 10³ / 45 × 10⁻⁵ ≈ 4,4 × 10⁶ Pa ; 15 / 20 × 10⁻⁴ = 7,5 × 10³ Pa ;
       20 × 10³ / 33 × 10⁻⁶ ≈ 6,1 × 10⁸ Pa ;
     ex. 8 : 1,2 × 10⁵ × 4 × 10⁻³ = 4,8 × 10² N ; 1 500 × 10² × 4 × 10⁻⁴ = 60 N ;
       0,85 × 10⁵ × 0,55 ≈ 4,7 × 10⁴ N ;
     ex. 14 : 1,013 × 10⁵ × 2,5 ≈ 2,53 × 10⁵ N ; 2,53 × 10⁵ / 9,81 ≈ 2,58 × 10⁴ kg ;
     ex. 21 : S_A = π × (5,0 × 10⁻³)² ≈ 7,85 × 10⁻⁵ m² ; p_A ≈ 1,9 × 10⁶ Pa ;
       F₂ = p × π × (50 × 10⁻³)² = 15 000 N ; poids 1 000 × 9,81 = 9,81 × 10³ N ;
     ex. 18 : 10⁵ + 1 000 × 9,81 × 1,9 ≈ 1,19 × 10⁵ Pa ; p₂ ≈ 1,9 × 10⁴ Pa ;
     ex. 15 : 10⁵ + 800 × 9,81 × 0,50 ≈ 1,04 × 10⁵ Pa ; + 1 000 × 9,81 × 1,0 ≈ 1,14 × 10⁵ Pa ;
     ex. 22 : 13 600 × 9,81 × 0,760 ≈ 101 396 Pa ; 96 000 / (13 600 × 9,81) ≈ 0,720 m ;
     ex. 20 : Δp = 9,81 × 10³ Pa ; p₂ = 92 000 + 9 810 + 1 000 × 9,81 × 60 ≈ 6,9 × 10⁵ Pa ;
       p₃ (56 m) ≈ 6,5 × 10⁵ Pa ; 162 × 4 = 648 L ; 83 × 4 = 332 L.
   Écart avec la correction manuscrite :
     ex. 14 b) la correction écrit 2,56 × 10⁴ kg ; le calcul donne
       2,53 × 10⁵ / 9,81 ≈ 2,58 × 10⁴ kg ≈ 25,8 t (valeur retenue).
   ============================================================ */
(function () {
  'use strict';

  const { o, fr, fmt, sci, proche, dessin, partieSchema, choixFormule, diagHydro } = window.SF;
  const calc = h => `<p class="ph-calc">${h}</p>`;
  const c = h => `<span class="c">${h}</span>`;
  const pr = (a, b) => proche(a, b, .02);
  const G = 9.81, PI = Math.PI;
  const ATM = 'P<sub>atm</sub> = 10<sup>5</sup> Pa';
  // fabriques de parties
  const choix = (q, options, bonne, correction, opts) => Object.assign({ type: 'choix', q, options, bonne, correction, melanger: false, colonne: options.some(x => x.label.replace(/<[^>]+>/g, '').length > 24) }, opts);
  const nombre = (q, label, valeur, unite, correction, opts) => Object.assign({ type: 'nombre', q, label, valeur, unite, correction, signe: false }, opts);
  const scient = (q, label, valeur, unite, correction, opts) => Object.assign({ type: 'sci', q, label, valeur, unite, correction, cs: 2, rel: .02 }, opts);
  const donnees = '<p class="ph-donnees">Données : P<sub>atm</sub> = 1 bar = 10<sup>5</sup> Pa ; g = 9,81 N·kg<sup>−1</sup>.</p>';

  /* ---------- Exercice 7 p. 119 : calculer une pression ---------- */
  const ex7 = {
    id: '7', groupe: 'pression', titre: 'Exercice 7 p. 119 : calculer une pression', desc: 'P = F / S avec des surfaces en m², cm² et mm²',
    contexte: `<p class="er-contexte">Calculer la pression p avec :</p>
      <ul class="er-liste"><li>a) F = 2,0 × 10<sup>3</sup> N et S = 45 × 10<sup>−5</sup> m² ;</li><li>b) F = 15 N et S = 20 cm² ;</li><li>c) F = 20 kN et S = 33 mm².</li></ul>`,
    parties: [
      scient('a) F = 2,0 × 10<sup>3</sup> N et S = 45 × 10<sup>−5</sup> m².', 'p =', 2e3 / 45e-5, 'Pa',
        calc(`p = ${fr('F', 'S')} = ${fr('2,0 × 10<sup>3</sup> N', '45 × 10<sup>−5</sup> m²')} ≈ ${c('4,4 × 10<sup>6</sup> Pa')}`),
        { diag: v => (pr(v, 45e-5 / 2e3) ? 'C\'est p = F / S (pas S / F).' : pr(v, 2e3 * 45e-5) ? 'On divise : p = F / S.' : 'p = 2,0 × 10<sup>3</sup> / (45 × 10<sup>−5</sup>).') }),
      scient('b) F = 15 N et S = 20 cm².', 'p =', 15 / 20e-4, 'Pa',
        calc('S = 20 cm² = 20 × 10<sup>−2</sup> × 10<sup>−2</sup> m² = 20 × 10<sup>−4</sup> m²') + calc(`p = ${fr('F', 'S')} = ${fr('15 N', '20 × 10<sup>−4</sup> m²')} = ${c('7,5 × 10<sup>3</sup> Pa')}`),
        { diag: v => (pr(v, 15 / 20e-2) ? 'Tu as converti les cm² comme des cm : 1 cm² = 10<sup>−2</sup> × 10<sup>−2</sup> m² = 10<sup>−4</sup> m².' : pr(v, 15 / 20) ? 'Convertis la surface en m².' : 'S = 20 × 10<sup>−4</sup> m², puis p = F / S.') }),
      scient('c) F = 20 kN et S = 33 mm².', 'p =', 20e3 / 33e-6, 'Pa',
        calc('F = 20 kN = 20 × 10<sup>3</sup> N ; S = 33 mm² = 33 × 10<sup>−3</sup> × 10<sup>−3</sup> m² = 33 × 10<sup>−6</sup> m²') + calc(`p = ${fr('F', 'S')} = ${fr('20 × 10<sup>3</sup> N', '33 × 10<sup>−6</sup> m²')} ≈ ${c('6,1 × 10<sup>8</sup> Pa')}`),
        { diag: v => (pr(v, 20e3 / 33e-3) || pr(v, 20 / 33e-6) ? 'Vérifie les deux conversions : 1 kN = 10<sup>3</sup> N et 1 mm² = 10<sup>−6</sup> m².' : pr(v, 20 / 33e-3) ? 'Convertis les kN en N (× 10<sup>3</sup>) et les mm² en m² (× 10<sup>−6</sup>).' : pr(v, 20e3 / 33) ? 'Convertis la surface en m² : 1 mm² = 10<sup>−6</sup> m².' : 'F en N, S en m², puis p = F / S.') }),
    ],
  };

  /* ---------- Exercice 8 p. 119 : calculer une force pressante ---------- */
  const ex8 = {
    id: '8', groupe: 'pression', titre: 'Exercice 8 p. 119 : calculer une force pressante', desc: 'F = P × S avec des pressions en Pa, hPa et atm',
    contexte: `<p class="er-contexte">Calculer F avec :</p>
      <ul class="er-liste"><li>a) p = 1,2 × 10<sup>5</sup> Pa et S = 4 × 10<sup>−3</sup> m² ;</li><li>b) p = 1 500 hPa et S = 4 cm² ;</li><li>c) p = 0,85 atm et S = 55 dm².</li></ul>
      <p class="ph-donnees">Donnée : 1 atm = 1 bar.</p>`,
    parties: [
      scient('a) p = 1,2 × 10<sup>5</sup> Pa et S = 4 × 10<sup>−3</sup> m².', 'F =', 1.2e5 * 4e-3, 'N',
        calc(`p = ${fr('F', 'S')}, donc F = p × S`) + calc(`F = 1,2 × 10<sup>5</sup> Pa × 4 × 10<sup>−3</sup> m² = ${c('4,8 × 10<sup>2</sup> N')}`),
        { diag: v => (pr(v, 1.2e5 / 4e-3) ? 'F = p × S (on multiplie).' : 'F = p × S = 1,2 × 10<sup>5</sup> × 4 × 10<sup>−3</sup>.') }),
      nombre('b) p = 1 500 hPa et S = 4 cm².', 'F =', 60, 'N',
        calc('p = 1 500 hPa = 1 500 × 10<sup>2</sup> Pa ; S = 4 cm² = 4 × 10<sup>−4</sup> m²') + calc(`F = p × S = 1 500 × 10<sup>2</sup> × 4 × 10<sup>−4</sup> = ${c('60 N')}`),
        { rel: .01, diag: v => (pr(v, 0.6) ? 'Convertis les hPa en Pa : 1 hPa = 10<sup>2</sup> Pa.' : pr(v, 6000) ? '1 cm² = 10<sup>−4</sup> m² (pas 10<sup>−2</sup>).' : pr(v, 600) ? '1 hPa = 100 Pa (pas 1 000).' : pr(v, 6e5) ? 'Convertis la surface en m² : 4 cm² = 4 × 10<sup>−4</sup> m².' : 'p en Pa, S en m², puis F = p × S.') }),
      scient('c) p = 0,85 atm et S = 55 dm².', 'F =', 0.85e5 * 0.55, 'N',
        calc('p = 0,85 atm = 0,85 bar = 0,85 × 10<sup>5</sup> Pa ; S = 55 dm² = 55 × 10<sup>−1</sup> × 10<sup>−1</sup> m² = 0,55 m²') + calc(`F = p × S = 0,85 × 10<sup>5</sup> × 0,55 ≈ ${c('4,7 × 10<sup>4</sup> N')}`),
        { diag: v => (pr(v, 0.85e5 * 5.5) ? 'Tu as converti les dm² comme des dm : 1 dm² = 10<sup>−2</sup> m².' : pr(v, 0.85 * 0.55) ? 'Convertis la pression en Pa : 1 atm = 1 bar = 10<sup>5</sup> Pa.' : pr(v, 0.85e5 * 55) ? 'Convertis la surface en m².' : 'p en Pa, S en m², puis F = p × S.') }),
    ],
  };

  /* ---------- Exercice 11 p. 119 : le couteau ---------- */
  const ex11 = {
    id: '11', groupe: 'pression', titre: 'Exercice 11 p. 119 : un couteau bien aiguisé', desc: 'Même force, plus petite surface : plus grande pression',
    contexte: '<p class="er-contexte">En considérant la notion de pression, pourquoi un couteau bien aiguisé coupe-t-il mieux qu\'un couteau mal aiguisé ?</p>',
    parties: [
      choix('Choisis l\'explication.', [o('ok', 'Sa surface de contact est plus petite : pour la même force, la pression est plus grande'), o('force', 'On appuie avec une force plus grande'), o('grand', 'Sa surface de contact est plus grande : la pression est plus grande'), o('dur', 'Sa lame est plus dure')], 'ok',
        '<p>Un couteau bien aiguisé a une surface de contact beaucoup plus petite qu\'un couteau mal aiguisé. En exerçant la même force avec la main, la pression P = F / S est beaucoup plus grande et le couteau coupe mieux.</p>',
        { indices: { force: 'On compare les deux couteaux avec la <b>même</b> force de la main.', grand: 'P = F / S : quand S augmente, P diminue.', dur: 'La dureté n\'est pas la notion de pression : regarde la surface de contact.' } }),
    ],
  };

  /* ---------- Exercice 14 p. 120 : une baie vitrée ---------- */
  const F14 = 1.013e5 * 2.5;
  const ex14 = {
    id: '14', groupe: 'pression', titre: 'Exercice 14 p. 120 : une baie vitrée', desc: 'Force de l\'air sur une vitre, masse équivalente',
    contexte: `<p class="er-contexte">a) Déterminer la force exercée par l'air, à la pression atmosphérique normale, sur une des faces d'une baie vitrée de surface 2,5 m².</p>
      <p class="er-contexte">b) Quelle masse produirait une force de gravitation de même intensité ?</p>
      <p class="er-contexte">c) Pourquoi cette baie vitrée ne se brise-t-elle pas ?</p>
      <p class="ph-donnees">Donnée : pression atmosphérique normale P<sub>atm n</sub> = 1,013 × 10<sup>5</sup> Pa ; g = 9,81 N·kg<sup>−1</sup>.</p>`,
    parties: [
      scient('a) Calcule la force exercée par l\'air sur une face de la baie vitrée (3 chiffres significatifs).', 'F =', F14, 'N',
        calc('F = P × S = 1,013 × 10<sup>5</sup> Pa × 2,5 m² ≈ ' + c('2,53 × 10<sup>5</sup> N')),
        { cs: 3, rel: .005, diag: v => (pr(v, 1.013e5 / 2.5) ? 'F = P × S (on multiplie).' : pr(v, 1e5 * 2.5) ? 'Prends la pression atmosphérique normale : 1,013 × 10<sup>5</sup> Pa.' : 'F = P × S.') }),
      scient('b) Quelle masse aurait un poids de même intensité (3 chiffres significatifs) ?', 'm =', F14 / G, 'kg',
        calc(`P = m × g, donc m = ${fr('F', 'g')}`) + calc(`m = ${fr('2,53 × 10<sup>5</sup> N', '9,81 N·kg<sup>−1</sup>')} ≈ ${c('2,58 × 10<sup>4</sup> kg')}, soit environ 25,8 tonnes !`),
        { cs: 3, rel: .006, diag: v => (pr(v, F14 * G) ? 'P = m × g, donc m = F / g (on divise).' : pr(v, F14 / 10) ? 'Prends g = 9,81 N·kg<sup>−1</sup>.' : 'm = F / g.') }),
      choix('c) Pourquoi la baie vitrée ne se brise-t-elle pas ?', [o('ok', 'L\'air exerce une force identique sur ses deux faces'), o('solide', 'Elle est assez solide pour supporter 25 tonnes'), o('ext', 'L\'air ne pousse que sur la face extérieure'), o('faible', 'La pression de l\'air est trop faible pour agir')], 'ok',
        '<p>La vitre ne se brise pas car elle subit une force identique sur ses deux faces : l\'air pousse autant de chaque côté, les deux forces se compensent.</p>',
        { indices: { solide: 'Une vitre ne supporterait pas 25 tonnes posées dessus. Regarde ce qui se passe de l\'autre côté de la vitre.', ext: 'L\'air de la maison est lui aussi à la pression atmosphérique : il pousse l\'autre face.', faible: 'Tu viens de calculer 2,53 × 10<sup>5</sup> N : ce n\'est pas faible !' } }),
    ],
  };

  /* ---------- Exercice 21 p. 121 : le cric hydraulique ---------- */
  const SA = PI * 5e-3 ** 2, pA = 150 / SA, SB = PI * 50e-3 ** 2, F2 = pA * SB;
  const ex21 = {
    id: '21', groupe: 'cric', titre: 'Exercice 21 p. 121 : le cric hydraulique', desc: 'Surface d\'un piston, pression transmise, force multipliée',
    contexte: `<p class="er-contexte">Le cric hydraulique est un outil utilisé par les mécaniciens automobiles pour soulever les véhicules avec moins d'efforts. Il est formé de deux pistons (1) et (2) de section circulaire. Sous l'effet d'une action sur le levier, le piston (1) agit, au point A, par une force de pression F<sub>1</sub> sur l'huile. L'huile agit, au point B, sur le piston (2) par une force F<sub>2</sub>. Les points A et B sont à la même altitude (z<sub>A</sub> = z<sub>B</sub>).</p>
      ${dessin('cric', { charge: 'véhicule', s1: 'piston 1 : R<tspan dy="4" font-size="10">1</tspan>', s2: 'piston 2 : R<tspan dy="4" font-size="10">2</tspan>' })}
      <p class="ph-donnees">On donne : rayons des pistons R<sub>1</sub> = 5,0 mm et R<sub>2</sub> = 50 mm ; intensité de la force de pression exercée en A : F<sub>1</sub> = 150 N ; g = 9,81 N·kg<sup>−1</sup>.</p>`,
    parties: [
      scient('a) Calcule d\'abord la surface S<sub>A</sub> du piston 1 (3 chiffres significatifs).', 'S<sub>A</sub> =', SA, 'm²',
        calc('Surface au point A : S<sub>A</sub> = π × R<sub>1</sub>² = π × (5,0 × 10<sup>−3</sup> m)² ≈ ' + c('7,85 × 10<sup>−5</sup> m²')),
        { cs: 3, rel: .01, diag: v => (pr(v, PI * 5e-3) ? 'Le rayon est élevé au carré : S = π × R².' : pr(v, PI * 10e-3 ** 2) ? 'Prends le rayon (5,0 mm), pas le diamètre.' : pr(v, PI * 25) ? 'Le rayon doit être en mètres : 5,0 mm = 5,0 × 10<sup>−3</sup> m.' : pr(v, PI * 5e-2 ** 2) ? '1 mm = 10<sup>−3</sup> m (pas 10<sup>−2</sup>).' : 'S<sub>A</sub> = π × (5,0 × 10<sup>−3</sup>)².') }),
      scient('a) Détermine la pression p<sub>A</sub> de l\'huile au point A (2 chiffres significatifs).', 'p<sub>A</sub> =', pA, 'Pa',
        calc(`p<sub>A</sub> = ${fr('F<sub>1</sub>', 'S<sub>A</sub>')} = ${fr('150 N', '7,85 × 10<sup>−5</sup> m²')} ≈ ${c('1,9 × 10<sup>6</sup> Pa')}`),
        { diag: v => (pr(v, SA / 150) ? 'p = F / S (pas S / F).' : pr(v, 150 * SA) ? 'On divise : p = F / S.' : 'p<sub>A</sub> = F<sub>1</sub> / S<sub>A</sub>.') }),
      choix('b) Quelle est la pression p<sub>B</sub> ?', [o('ok', 'p<sub>B</sub> = p<sub>A</sub> ≈ 1,9 × 10<sup>6</sup> Pa'), o('moins', 'p<sub>B</sub> < p<sub>A</sub>, car le piston 2 est plus grand'), o('plus', 'p<sub>B</sub> > p<sub>A</sub>, car F<sub>2</sub> est plus grande')], 'ok',
        '<p>A et B sont dans la même huile, à la même altitude : p<sub>B</sub> = p<sub>A</sub> ≈ 1,9 × 10<sup>6</sup> Pa.</p>',
        { indices: { moins: 'La surface ne change pas la pression du liquide : seule l\'altitude compte (z<sub>A</sub> = z<sub>B</sub>).', plus: 'C\'est la force qui est plus grande, pas la pression : z<sub>A</sub> = z<sub>B</sub>.' } }),
      scient('c) Déduis-en l\'intensité de la force F<sub>2</sub> exercée sur le piston 2 (2 chiffres significatifs).', 'F<sub>2</sub> =', F2, 'N',
        calc('F<sub>2</sub> = p<sub>B</sub> × S<sub>B</sub>') + calc(`F<sub>2</sub> = 1,9 × 10<sup>6</sup> Pa × π × (50 × 10<sup>−3</sup> m)² ≈ ${c('15 000 N')}`),
        { diag: v => (pr(v, 1500) ? 'Tu as multiplié F<sub>1</sub> par le rapport des <b>rayons</b> (10) : la force est multipliée par le rapport des surfaces, 10² = 100.' : pr(v, pA / SB) ? 'F<sub>2</sub> = p<sub>B</sub> × S<sub>B</sub> (on multiplie).' : pr(v, pA * PI * 50e-3) ? 'S<sub>B</sub> = π × R<sub>2</sub>² : le rayon est élevé au carré.' : pr(v, 150) ? 'Le grand piston donne une force bien plus grande que F<sub>1</sub>.' : 'S<sub>B</sub> = π × (50 × 10<sup>−3</sup>)², puis F<sub>2</sub> = p<sub>B</sub> × S<sub>B</sub>.') }),
      choix('d) Quel est l\'intérêt d\'un tel système ?', [o('ok', 'Multiplier la force : F<sub>2</sub> est 100 fois plus grande que F<sub>1</sub>'), o('p', 'Multiplier la pression de l\'huile'), o('moins', 'Diminuer la force à fournir en B'), o('vite', 'Soulever le véhicule plus vite')], 'ok',
        '<p>La force exercée en B est bien plus grande que celle fournie en A : 15 000 N au lieu de 150 N, 100 fois plus (S<sub>B</sub> / S<sub>A</sub> = (50 / 5,0)² = 100).</p>',
        { indices: { p: 'La pression est la même en A et en B : ce n\'est pas elle qui est multipliée.', moins: 'En B, la force est bien plus <b>grande</b> que celle fournie en A.', vite: 'Le petit piston doit au contraire parcourir une grande distance pour faire monter un peu le grand.' } }),
      scient('e) Calcule le poids d\'un véhicule de 1 tonne.', 'P =', 1000 * G, 'N',
        calc('P = m × g = 1 × 10<sup>3</sup> kg × 9,81 N·kg<sup>−1</sup> = ' + c('9,81 × 10<sup>3</sup> N')),
        { cs: 3, rel: .005, diag: v => (pr(v, 9.81) ? '1 tonne = 1 000 kg.' : pr(v, 1e4) ? 'Prends g = 9,81 N·kg<sup>−1</sup>.' : 'P = m × g avec m = 1 000 kg.') }),
      choix('e) La force exercée par le cric est-elle suffisante pour soulever ce véhicule ?', [o('oui', 'Oui : 1,5 × 10<sup>4</sup> N > 9,81 × 10<sup>3</sup> N'), o('non', 'Non : 1,5 × 10<sup>4</sup> N < 9,81 × 10<sup>3</sup> N')], 'oui',
        '<p>F<sub>2</sub> = 15 000 N = 1,5 × 10<sup>4</sup> N > 9,81 × 10<sup>3</sup> N : la force est suffisante pour soulever le véhicule.</p>',
        { indices: { non: 'Compare les exposants : 10<sup>4</sup> est plus grand que 10<sup>3</sup>.' } }),
      { type: 'grille', q: 'f) Pour soulever un camion de 12 tonnes (poids ≈ 1,18 × 10<sup>5</sup> N), comment modifier chaque paramètre du cric ?', options: [o('aug', 'augmenter'), o('dim', 'diminuer')],
        lignes: [
          { id: 'SA', label: 'La surface S<sub>A</sub> du petit piston', bonne: 'dim', indices: { aug: 'p = F<sub>1</sub> / S<sub>A</sub> : une surface plus petite donne une pression plus grande.' } },
          { id: 'SB', label: 'La surface S<sub>B</sub> du grand piston', bonne: 'aug', indices: { dim: 'F<sub>2</sub> = p × S<sub>B</sub> : une plus grande surface donne une plus grande force.' } },
          { id: 'F1', label: 'La force F<sub>1</sub> exercée sur le petit piston', bonne: 'aug', indices: { dim: 'F<sub>2</sub> = F<sub>1</sub> × S<sub>B</sub> / S<sub>A</sub> : F<sub>2</sub> augmente avec F<sub>1</sub>.' } },
        ],
        correction: '<p>Pour soulever plus lourd, on peut : diminuer la surface S<sub>A</sub>, augmenter la surface S<sub>B</sub>, augmenter la force F<sub>1</sub>.</p>' },
    ],
  };

  /* ---------- Exercice 18 p. 121 : la piscine du chalet ---------- */
  const p1_18 = 1e5 + 1000 * G * 1.9;
  const ex18 = {
    id: '18', groupe: 'hydro', titre: 'Exercice 18 p. 121 : une piscine', desc: 'Pression à la surface, pression absolue et relative au fond',
    contexte: `<p class="er-contexte">La piscine intérieure d'un chalet de montagne particulièrement bien équipé a des dimensions tout à fait respectables : longueur 6,0 m, largeur 3,0 m et profondeur 1,9 m.</p>
      <p class="er-contexte">a) Quelle est la pression p<sub>0</sub> qui s'exerce à la surface de l'eau ? b) Déterminer la pression absolue p<sub>1</sub> s'exerçant au fond du bassin. c) En déduire la pression relative p<sub>2</sub> exercée par l'eau au fond du bassin.</p>${donnees}`,
    parties: () => [
      choix('a) Quelle est la pression p<sub>0</sub> à la surface de l\'eau ?', [o('ok', 'p<sub>0</sub> = P<sub>atm</sub> = 10<sup>5</sup> Pa'), o('zero', 'p<sub>0</sub> = 0 Pa'), o('rgh', 'p<sub>0</sub> = ρ × g × h')], 'ok',
        '<p>p<sub>0</sub> = pression atmosphérique = 1 bar = 10<sup>5</sup> Pa (surface libre à l\'air libre).</p>',
        { indices: { zero: '0 Pa, c\'est le vide. À la surface libre, l\'air appuie sur l\'eau.', rgh: 'Il n\'y a pas d\'eau au-dessus de la surface.' } }),
      partieSchema({ type: 'piscine', dessin: { nomLiquide: 'eau' }, q: 'b) Sur le schéma, repère le point haut et le point bas, puis place les valeurs connues. Laisse vide la case de l\'inconnue.',
        points: [{ pt: 'A', desc: 'surface', role: 'haut', p: ATM, indice: 'P<sub>atm</sub> est la pression de la surface (A).', indiceVide: 'À la surface de l\'eau, la pression est connue : p<sub>0</sub> = 10<sup>5</sup> Pa.' },
          { pt: 'B', desc: 'fond', role: 'bas', p: null }],
        h: { label: '1,9 m' }, intrus: [{ label: '6,0 m', indice: '6,0 m est la longueur du bassin : h est la différence d\'altitude entre la surface et le fond, la profondeur.' }],
        solution: '<p>A (surface) : point haut, P<sub>A</sub> = p<sub>0</sub> = 10<sup>5</sup> Pa. B (fond) : point bas, inconnue p<sub>1</sub>. h = profondeur = 1,9 m.</p>' }),
      choixFormule({ haut: 'A', bas: 'B', cherche: 'bas' }),
      scient('b) Calcule la pression absolue p<sub>1</sub> au fond du bassin (3 chiffres significatifs).', 'p<sub>1</sub> =', p1_18, 'Pa',
        calc('Au fond de la piscine : p<sub>1</sub> = p<sub>0</sub> + ρ<sub>eau</sub> × g × h, avec h la profondeur') + calc(`p<sub>1</sub> = 10<sup>5</sup> Pa + 1 000 kg·m<sup>−3</sup> × 9,81 N·kg<sup>−1</sup> × 1,9 m ≈ ${c('1,19 × 10<sup>5</sup> Pa')}`),
        { cs: 3, rel: .006, diag: diagHydro({ cherche: 'bas', Ph: 1e5, rho: 1000, g: G, h: 1.9, surface: true }) }),
      scient('c) Déduis-en la pression relative p<sub>2</sub> au fond du bassin (2 chiffres significatifs).', 'p<sub>2</sub> =', p1_18 - 1e5, 'Pa',
        calc(`Pression relative : p<sub>2</sub> = p<sub>1</sub> − p<sub>0</sub> ≈ 1,19 × 10<sup>5</sup> − 10<sup>5</sup> = 0,19 × 10<sup>5</sup> Pa = ${c('1,9 × 10<sup>4</sup> Pa')}`),
        { rel: .03, diag: v => (pr(v, p1_18 + 1e5) ? 'p<sub>2</sub> = p<sub>1</sub> − p<sub>0</sub> : on <b>retire</b> la pression atmosphérique.' : pr(v, p1_18) ? 'C\'est la pression absolue p<sub>1</sub>.' : 'p<sub>2</sub> = p<sub>1</sub> − p<sub>0</sub>.') }),
    ],
  };

  /* ---------- Exercice 15 p. 120 : deux liquides ---------- */
  const pI15 = 1e5 + 800 * G * 0.5, pF15 = pI15 + 1000 * G * 1.0;
  const ex15 = {
    id: '15', groupe: 'hydro', titre: 'Exercice 15 p. 120 : un réservoir à deux liquides', desc: 'Huile sur eau : pression à l\'interface puis au fond',
    contexte: `<p class="er-contexte">Soit un réservoir rempli par deux fluides non miscibles de masses volumiques différentes ρ<sub>huile</sub> = 800 kg·m<sup>−3</sup> et ρ<sub>eau</sub> = 1 000 kg·m<sup>−3</sup>. On donne h<sub>1</sub> = 50 cm et h<sub>2</sub> = 1,0 m.</p>
      ${dessin('reservoir')}
      <p class="er-contexte">a) Quelle est la pression exercée sur la surface libre ? b) Déterminer la pression exercée à l'interface entre les deux fluides. c) En déduire la pression exercée sur le fond du réservoir.</p>${donnees}`,
    parties: () => [
      choix('a) Quelle est la pression sur la surface libre ?', [o('ok', 'P<sub>0</sub> = P<sub>atm</sub> = 10<sup>5</sup> Pa'), o('zero', '0 Pa'), o('rgh', 'ρ<sub>huile</sub> × g × h<sub>1</sub>')], 'ok',
        '<p>Sur la surface libre, P<sub>0</sub> = P<sub>atm</sub> = 10<sup>5</sup> Pa.</p>',
        { indices: { zero: '0 Pa, c\'est le vide : la surface libre est à l\'air libre.', rgh: 'Au-dessus de la surface libre, il n\'y a pas de liquide.' } }),
      choix('b) Quel liquide est au-dessus ?', [o('huile', 'L\'huile, car elle est moins dense que l\'eau'), o('eau', 'L\'eau, car elle est plus dense'), o('rien', 'On ne peut pas savoir')], 'huile',
        '<p>C\'est l\'huile qui est au-dessus, car elle est moins dense que l\'eau (800 < 1 000 kg·m<sup>−3</sup>).</p>',
        { indices: { eau: 'Le liquide le plus dense descend au fond.', rien: 'Compare les masses volumiques : le moins dense flotte sur l\'autre.' } }),
      partieSchema({ type: 'reservoir', dessin: { etape: 1 }, q: 'b) Étape 1, dans l\'huile : repère le point haut et le point bas, puis place les valeurs connues. Laisse vide la case de l\'inconnue.',
        points: [{ pt: 'S', desc: 'surface', role: 'haut', p: ATM, indice: 'P<sub>atm</sub> est la pression de la surface libre (S).', indiceVide: 'À la surface libre, la pression est connue : P<sub>atm</sub>.' },
          { pt: 'I', desc: 'interface', role: 'bas', p: null }],
        h: { nom: 'h<sub>1</sub>', label: '50 cm = 0,50 m' }, intrus: [{ label: '1,0 m', indice: '1,0 m est la hauteur d\'eau : entre S et I, il n\'y a que de l\'huile (h<sub>1</sub>).' }],
        solution: '<p>Dans l\'huile : S (surface libre) est le point haut, P<sub>S</sub> = 10<sup>5</sup> Pa ; I (interface) est le point bas, inconnue P<sub>1</sub>. h<sub>1</sub> = 0,50 m.</p>' }),
      scient('b) Calcule la pression P<sub>1</sub> à l\'interface (3 chiffres significatifs).', 'P<sub>1</sub> =', pI15, 'Pa',
        calc('À l\'interface : P<sub>1</sub> = P<sub>0</sub> + ρ<sub>huile</sub> × g × h<sub>1</sub>') + calc(`P<sub>1</sub> = 10<sup>5</sup> + 800 × 9,81 × 50 × 10<sup>−2</sup> ≈ ${c('1,04 × 10<sup>5</sup> Pa')}`),
        { cs: 3, rel: .006, diag: v => (pr(v, 1e5 + 1000 * G * 0.5) ? 'Au-dessus de l\'interface, c\'est de l\'<b>huile</b> : ρ = 800 kg·m<sup>−3</sup>.' : diagHydro({ cherche: 'bas', Ph: 1e5, rho: 800, g: G, h: 0.5, hcm: true, surface: true })(v)) }),
      partieSchema({ type: 'reservoir', dessin: { etape: 2 }, q: 'c) Étape 2, dans l\'eau : repère le nouveau point haut et le nouveau point bas, puis place les valeurs connues.',
        points: [{ pt: 'I', desc: 'interface', role: 'haut', p: '1,04 × 10<sup>5</sup> Pa', indice: 'C\'est la pression de l\'interface, calculée en b).', indiceVide: 'La pression de l\'interface est connue : tu viens de la calculer.' },
          { pt: 'F', desc: 'fond', role: 'bas', p: null }],
        h: { nom: 'h<sub>2</sub>', label: '1,0 m' }, intrus: [{ label: ATM, indice: 'I n\'est pas à l\'air libre : sa pression est celle calculée en b).' }],
        solution: '<p>Dans l\'eau : I est maintenant le point haut (P<sub>1</sub> ≈ 1,04 × 10<sup>5</sup> Pa), F (fond) le point bas, inconnue P<sub>2</sub>. h<sub>2</sub> = 1,0 m.</p>' }),
      scient('c) Calcule la pression P<sub>2</sub> sur le fond du réservoir (3 chiffres significatifs).', 'P<sub>2</sub> =', pF15, 'Pa',
        calc('Au fond du réservoir : P<sub>2</sub> = P<sub>1</sub> + ρ<sub>eau</sub> × g × h<sub>2</sub>') + calc(`P<sub>2</sub> = 1,04 × 10<sup>5</sup> + 1 000 × 9,81 × 1,0 ≈ ${c('1,14 × 10<sup>5</sup> Pa')}`),
        { cs: 3, rel: .006, diag: v => (pr(v, pI15 + 800 * G * 1.0) ? 'Entre l\'interface et le fond, c\'est de l\'<b>eau</b> : ρ = 1 000 kg·m<sup>−3</sup>.' : pr(v, 1e5 + 1000 * G * 1.0) ? 'Le point haut est l\'interface : pars de P<sub>1</sub>, pas de P<sub>atm</sub>.' : pr(v, 1e5 + 1000 * G * 1.5) ? 'Il y a deux liquides : on ne peut pas prendre ρ<sub>eau</sub> sur toute la hauteur.' : diagHydro({ cherche: 'bas', Ph: pI15, rho: 1000, g: G, h: 1.0 })(v)) }),
    ],
  };

  /* ---------- Exercice 22 p. 121 : le baromètre de Torricelli ---------- */
  const RHG = 13600, h22 = 96000 / (RHG * G);
  const ex22 = {
    id: '22', groupe: 'hydro', titre: 'Exercice 22 p. 121 : le baromètre de Torricelli', desc: 'Vide, points à la même altitude, pression atmosphérique et hauteur de mercure',
    contexte: `<p class="er-contexte">Un baromètre de Torricelli est un dispositif de mesure de la pression atmosphérique mis au point par Evangelista Torricelli à Florence, au XVII<sup>e</sup> siècle. On remplit complètement un tube de mercure, on le bouche pour empêcher l'air de rentrer, puis on le renverse sur un bassin lui aussi rempli de mercure. Le tube ne se vide pas complètement : une colonne de mercure reste dans le tube.</p>
      ${dessin('barometre')}
      <p class="ph-donnees">Données : masse volumique du mercure ρ = 13 600 kg·m<sup>−3</sup> ; g = 9,81 m·s<sup>−2</sup>.</p>`,
    parties: () => [
      choix('a) Détermine la différence de pression entre les points B et C.', [o('ok', 'Elle est nulle : p<sub>B</sub> = p<sub>C</sub>'), o('rgh', 'p<sub>B</sub> − p<sub>C</sub> = ρ × g × h'), o('atm', 'p<sub>B</sub> − p<sub>C</sub> = P<sub>atm</sub>')], 'ok',
        '<p>p<sub>B</sub> = p<sub>C</sub> car B et C sont à la même altitude, dans le même liquide (le mercure).</p>',
        { indices: { rgh: 'B et C sont à la même altitude : h = 0 entre eux.', atm: 'B et C sont dans le même mercure, à la même altitude.' } }),
      choix('b) Quelle est la valeur de la pression en A ?', [o('zero', 'p<sub>A</sub> = 0 Pa'), o('atm', 'p<sub>A</sub> = P<sub>atm</sub>'), o('rgh', 'p<sub>A</sub> = ρ × g × h')], 'zero',
        '<p>Au-dessus du mercure, c\'est le vide : <b>p<sub>A</sub> = 0 Pa</b> (à retenir).</p>',
        { indices: { atm: 'Le tube a été bouché puis retourné : l\'air n\'y est pas entré. Au-dessus du mercure, c\'est le vide.', rgh: 'ρ × g × h, c\'est l\'écart de pression entre A et B.' } }),
      choix('c) Exprime la pression en B en fonction de h.', [o('ok', 'p<sub>B</sub> = ρ × g × h'), o('atm', 'p<sub>B</sub> = P<sub>atm</sub> + ρ × g × h'), o('moins', 'p<sub>B</sub> = ρ × g × h − P<sub>atm</sub>'), o('sans', 'p<sub>B</sub> = ρ × g')], 'ok',
        calc('p<sub>B</sub> = p<sub>A</sub> + ρ × g × h = 0 + ρ × g × h, donc p<sub>B</sub> = ρ × g × h') + '<p>ρ : masse volumique du mercure ; g : intensité de la pesanteur ; h : hauteur de la colonne de mercure.</p>',
        { indices: { atm: 'Le point haut est A, où p<sub>A</sub> = 0 Pa (vide), pas P<sub>atm</sub>.', moins: 'Le principe fondamental entre A (haut) et B (bas) : p<sub>B</sub> = p<sub>A</sub> + ρ × g × h.', sans: 'Il manque la hauteur h de la colonne.' } }),
      scient('d) Par beau temps, au niveau de la mer, h = 760 mm. Calcule la pression atmosphérique (3 chiffres significatifs).', 'P<sub>atm</sub> =', RHG * G * 0.76, 'Pa',
        calc('p<sub>B</sub> = P<sub>atm</sub> (B à la même altitude que C, à la surface libre), donc P<sub>atm</sub> = ρ × g × h') + calc(`P<sub>atm</sub> = 13 600 kg·m<sup>−3</sup> × 9,81 m·s<sup>−2</sup> × 760 × 10<sup>−3</sup> m ≈ ${c('101 396 Pa')}`),
        { cs: 3, rel: .005, diag: v => (pr(v, RHG * G * 760) ? 'h doit être en mètres : 760 mm = 760 × 10<sup>−3</sup> m.' : pr(v, 1e5 + RHG * G * 0.76) ? 'En A, c\'est le vide : P<sub>atm</sub> = ρ × g × h, sans rien ajouter.' : pr(v, 1000 * G * 0.76) ? 'C\'est du mercure : ρ = 13 600 kg·m<sup>−3</sup>.' : 'P<sub>atm</sub> = ρ × g × h, h en m.') }),
      partieSchema({ type: 'barometre', q: 'e) À l\'approche d\'une tempête, la pression atmosphérique chute à 960 hPa. Sur le schéma, repère le point haut et le point bas, puis place les valeurs connues. Laisse vide la case de l\'inconnue.',
        points: [{ pt: 'A', desc: 'vide', role: 'haut', p: '0 Pa', indice: '0 Pa est la pression du vide, en A.', indiceVide: 'En A, c\'est le vide : sa pression est connue, 0 Pa.' },
          { pt: 'B', desc: 'niveau de la cuve', role: 'bas', p: '960 hPa', indice: 'La pression atmosphérique est celle de C, donc aussi celle de B (même altitude).', indiceVide: 'B est à la même altitude que C, à la surface libre : p<sub>B</sub> = P<sub>atm</sub> = 960 hPa.' }],
        h: { label: null }, intrus: [{ label: ATM, indice: 'Ce jour-là, la pression atmosphérique vaut 960 hPa.' }],
        solution: '<p>A (vide) : point haut, p<sub>A</sub> = 0 Pa. B : point bas, p<sub>B</sub> = P<sub>atm</sub> = 960 hPa. L\'inconnue est h.</p>' }),
      choixFormule({ haut: 'A', bas: 'B', cherche: 'h', rho: 'ρ<sub>Hg</sub>' }),
      nombre('e) Calcule la hauteur de la colonne de mercure ce jour-là, en mm (3 chiffres significatifs).', 'h =', h22 * 1000, 'mm',
        calc(`P<sub>atm</sub> = ρ × g × h ⟺ h = ${fr('P<sub>atm</sub>', 'ρ × g')} = ${fr('960 × 10<sup>2</sup> Pa', '13 600 × 9,81')} ≈ 0,720 m`) + calc(`soit ${c('720 mm de mercure')}`) + '<p>Remarque : le mm de mercure est une unité de mesure de la pression atmosphérique.</p>',
        { rel: .005, affiche: '720', diag: v => (pr(v, h22) ? 'C\'est la hauteur en <b>mètres</b> : la question la demande en mm.' : pr(v, h22 * 10) || pr(v, 960 / (RHG * G) * 1000) ? 'Convertis la pression en Pa : 960 hPa = 960 × 10<sup>2</sup> Pa.' : pr(v, 96000 / (1000 * G) * 1000) ? 'C\'est du mercure : ρ = 13 600 kg·m<sup>−3</sup>.' : pr(v, (1e5 - 96000) / (RHG * G) * 1000) ? 'En A, c\'est le vide (0 Pa) : h = P<sub>atm</sub> / (ρ × g).' : 'h = P<sub>atm</sub> / (ρ × g), en m, puis en mm.') }),
    ],
  };

  /* ---------- Exercice 20 p. 120 (exercice supplémentaire) : le chalet ---------- */
  const dp20 = 1000 * G * 1.0, pF20 = 92000 + dp20, p2_20 = pF20 + 1000 * G * 60, p3_20 = pF20 + 1000 * G * 56;
  const ex20 = {
    id: '20', groupe: 'supp', titre: 'Exercice 20 p. 120 : l\'eau d\'un chalet', desc: 'Exercice supplémentaire : pression au rez-de-chaussée, réducteur, consommation',
    contexte: `<p class="er-contexte">Un chalet de montagne dont le rez-de-chaussée situé à 800 m d'altitude est alimenté en eau potable par une source. Cette source permet le remplissage d'une citerne ayant une capacité de 2 000 L située à une altitude de 860 m. La cuve a les dimensions suivantes : largeur 1,5 m, longueur 1,5 m et hauteur 1,0 m. La pression atmosphérique à 860 m est 920 hPa.</p>
      ${dessin('chalet', { h: false })}
      <p class="er-contexte">L'eau arrivée dans le chalet doit être acheminée au premier étage où se trouve la salle de bain. Pour un meilleur confort d'utilisation, il est souhaitable que la pression au niveau des robinets soit inférieure à 2 bars. Les robinets de l'étage sont situés environ 4 m plus haut que le rez-de-chaussée.</p>
      <p class="er-contexte">Consommation quotidienne moyenne d'eau potable par personne :</p>
      <div class="ph-defile"><table class="ph-tableau"><tr><th>Usage</th><th>Alimentation</th><th>Vaisselle</th><th>Hygiène corporelle</th><th>Lessive</th><th>Nettoyage</th><th>WC</th><th>Arrosage</th></tr>
        <tr><th>Consommation (L)</th><td>11</td><td>8</td><td>60</td><td>18</td><td>10</td><td>50</td><td>5</td></tr></table></div>
      <p class="ph-donnees">Donnée : g = 9,81 N·kg<sup>−1</sup> ; ρ<sub>eau</sub> = 1 000 kg·m<sup>−3</sup>.</p>`,
    parties: () => [
      choix('a) Quelle est la pression p<sub>0</sub> à la surface libre du réservoir ?', [o('ok', 'p<sub>0</sub> = P<sub>atm</sub> = 920 hPa'), o('mer', 'p<sub>0</sub> = 1 013 hPa'), o('zero', 'p<sub>0</sub> = 0 Pa'), o('rgh', 'p<sub>0</sub> = ρ × g × h')], 'ok',
        '<p>p<sub>0</sub> = p<sub>atm</sub> = 920 hPa : c\'est la pression atmosphérique (à 860 m d\'altitude).</p>',
        { indices: { mer: '1 013 hPa, c\'est au niveau de la mer. L\'énoncé donne la pression atmosphérique à 860 m.', zero: 'La surface libre est à l\'air libre, pas dans le vide.', rgh: 'Au-dessus de la surface libre, il n\'y a pas d\'eau.' } }),
      scient('b) Calcule la différence de pression Δp entre le fond de la cuve et la surface libre (2 chiffres significatifs).', 'Δp =', dp20, 'Pa',
        calc(`Δp = ρ × g × h<sub>1</sub> = 1 000 × 9,81 × 1,0 = ${c('9,8 × 10<sup>3</sup> Pa')}`),
        { diag: v => (pr(v, 1000) ? 'Tu as oublié g : Δp = ρ × g × h<sub>1</sub>.' : pr(v, 1000 * G * 1.5) ? 'h<sub>1</sub> est la <b>hauteur</b> d\'eau dans la cuve : 1,0 m (1,5 m est sa largeur).' : pr(v, 92000 + dp20) ? 'On demande la <b>différence</b> de pression : ρ × g × h<sub>1</sub>, sans ajouter p<sub>0</sub>.' : 'Δp = ρ × g × h<sub>1</sub> avec h<sub>1</sub> = 1,0 m.') }),
      scient('c) Calcule d\'abord la pression au fond de la cuve, p<sub>F</sub> = p<sub>0</sub> + Δp (4 chiffres significatifs).', 'p<sub>F</sub> =', pF20, 'Pa',
        calc(`p<sub>F</sub> = 920 × 10<sup>2</sup> + 9,81 × 10<sup>3</sup> = ${c('1,018 × 10<sup>5</sup> Pa')}`),
        { cs: 4, rel: .002, diag: v => (pr(v, 920 + dp20) ? 'Convertis p<sub>0</sub> en Pa : 920 hPa = 920 × 10<sup>2</sup> Pa.' : pr(v, 1e5 + dp20) ? 'Ici, p<sub>0</sub> = 920 hPa (et non 10<sup>5</sup> Pa).' : 'p<sub>F</sub> = 92 000 + 9 810.') }),
      partieSchema({ type: 'chalet', dessin: { points: ['F', 'R'] }, q: 'c) Entre le fond de la cuve (F) et le rez-de-chaussée (R) : repère le point haut et le point bas, puis place les valeurs connues. Laisse vide la case de l\'inconnue.',
        points: [{ pt: 'F', desc: 'fond de la cuve', role: 'haut', p: '1,018 × 10<sup>5</sup> Pa', indice: 'C\'est la pression au fond de la cuve (F).', indiceVide: 'La pression au fond de la cuve est connue : tu viens de la calculer.' },
          { pt: 'R', desc: 'rez-de-chaussée', role: 'bas', p: null }],
        h: { label: '60 m' }, intrus: [{ label: '920 hPa', indice: '920 hPa est la pression à la surface libre (S), pas au fond de la cuve (F).' }, { label: '860 m', indice: '860 m est une altitude ; h est la différence d\'altitude entre F et R : 860 − 800 = 60 m.' }],
        solution: '<p>F (fond de la cuve, 860 m) : point haut, p<sub>F</sub> ≈ 1,018 × 10<sup>5</sup> Pa. R (rez-de-chaussée, 800 m) : point bas, inconnue p<sub>2</sub>. h = 860 − 800 = 60 m.</p>' }),
      choixFormule({ haut: 'F', bas: 'R', cherche: 'bas' }),
      scient('c) Calcule la pression p<sub>2</sub> de l\'eau qui arrive au rez-de-chaussée (2 chiffres significatifs).', 'p<sub>2</sub> =', p2_20, 'Pa',
        calc('p<sub>2</sub> = p<sub>atm</sub> + Δp + ρ × g × h<sub>2</sub>') + calc(`p<sub>2</sub> = 920 × 10<sup>2</sup> + 9,8 × 10<sup>3</sup> + 1 000 × 9,81 × 60 ≈ ${c('6,9 × 10<sup>5</sup> Pa')}`),
        { diag: v => (pr(v, 1000 * G * 60) ? 'Ajoute la pression au fond de la cuve : p<sub>2</sub> = p<sub>F</sub> + ρ × g × h.' : pr(v, 1e5 + 1000 * G * 60) || pr(v, 92000 + 1000 * G * 60) ? 'Pars du fond de la cuve : p<sub>F</sub> = p<sub>0</sub> + Δp ≈ 1,018 × 10<sup>5</sup> Pa.' : pr(v, pF20 + 1000 * G * 860) ? 'h est la différence d\'altitude : 860 − 800 = 60 m.' : diagHydro({ cherche: 'bas', Ph: pF20, rho: 1000, g: G, h: 60 })(v)) }),
      nombre('d) Exprime cette pression en bars.', 'p<sub>2</sub> ≈', 6.9, 'bar',
        calc(`p<sub>2</sub> ≈ 6,9 × 10<sup>5</sup> Pa, soit ${c('6,9 bars')}`), { tol: .1, diag: v => (pr(v, 6.9e5) || pr(v, 69) || pr(v, 690) ? '1 bar = 10<sup>5</sup> Pa : on divise par 10<sup>5</sup>.' : 'p<sub>2</sub> / 10<sup>5</sup>.') }),
      scient('e) Calcule la pression p<sub>3</sub> aux robinets de l\'étage, 4 m plus haut (2 chiffres significatifs).', 'p<sub>3</sub> =', p3_20, 'Pa',
        calc('L\'étage est à 800 + 4 = 804 m : h<sub>3</sub> = 860 − 804 = 56 m') + calc(`p<sub>3</sub> = p<sub>atm</sub> + Δp + ρ × g × h<sub>3</sub> = 920 × 10<sup>2</sup> + 9,8 × 10<sup>3</sup> + 1 000 × 9,81 × 56 ≈ ${c('6,5 × 10<sup>5</sup> Pa')}`) +
          `<p>OU : p<sub>3</sub> = p<sub>2</sub> − ρ × g × 4 ≈ 6,9 × 10<sup>5</sup> − 1 000 × 9,81 × 4 ≈ 6,5 × 10<sup>5</sup> Pa.</p>`,
        { diag: v => (pr(v, p2_20 + 1000 * G * 4) ? 'L\'étage est plus <b>haut</b> : sa pression est plus petite. On retire ρ × g × 4.' : pr(v, 1000 * G * 56) ? 'Ajoute la pression au fond de la cuve.' : 'p<sub>3</sub> = p<sub>2</sub> − ρ × g × 4, ou p<sub>F</sub> + ρ × g × 56.') }),
      choix('e) Faut-il mettre en place un réducteur de pression sur le circuit d\'arrivée d\'eau ?', [o('oui', 'Oui : 6,5 bar est supérieur à 2 bars'), o('non', 'Non : 6,5 bar est inférieur à 2 bars'), o('rdc', 'Non : seul le rez-de-chaussée compte')], 'oui',
        '<p>p<sub>3</sub> ≈ 6,5 × 10<sup>5</sup> Pa, soit 6,5 bar. Un réducteur s\'impose car la pression est supérieure à 2 bars.</p>',
        { indices: { non: '6,5 × 10<sup>5</sup> Pa = 6,5 bar, plus de trois fois 2 bars.', rdc: 'La condition porte sur les robinets de l\'étage : moins de 2 bars.' } }),
      nombre('f) Quel volume d\'eau une famille de 4 personnes consomme-t-elle en moyenne chaque jour ?', 'V =', 648, 'L',
        calc('Par personne : 11 + 8 + 60 + 18 + 10 + 50 + 5 = 162 L') + calc(`Consommation moyenne d'une famille : 162 × 4 = ${c('648 L')}`),
        { rel: .001, diag: v => (pr(v, 162) ? 'C\'est la consommation d\'<b>une</b> personne : multiplie par 4.' : 'Additionne les consommations d\'une personne, puis multiplie par 4.') }),
      choix('g) La capacité du réservoir est-elle suffisante pour couvrir les besoins de cette famille ?', [o('oui', 'Oui : 2 000 L > 648 L'), o('non', 'Non : 2 000 L < 648 L')], 'oui',
        '<p>La capacité de la cuve est suffisante car 2 000 L > 648 L.</p>', { indices: { non: 'Compare 2 000 L et 648 L.' } }),
      nombre('h) Quel volume d\'eau potable pourrait être économisé chaque jour en utilisant de l\'eau de pluie ?', 'V =', 332, 'L',
        calc('L\'eau de pluie peut servir pour les WC, l\'arrosage, le nettoyage et la lessive : 50 + 5 + 10 + 18 = 83 L par personne') + calc(`soit 83 × 4 = ${c('332 L')}`),
        { rel: .001, diag: v => (pr(v, 83) ? 'C\'est pour <b>une</b> personne : multiplie par 4.' : pr(v, 65 * 4) ? 'La lessive peut aussi se faire à l\'eau de pluie.' : pr(v, 73 * 4) ? 'Le nettoyage peut aussi se faire à l\'eau de pluie.' : 'Eau de pluie : WC, arrosage, nettoyage et lessive (pas l\'alimentation, la vaisselle ni l\'hygiène).') }),
    ],
  };

  window.SF.EXERCICES = [ex7, ex8, ex11, ex14, ex21, ex18, ex15, ex22, ex20];
  window.SF.GROUPES_EX = [
    { id: 'pression', titre: 'Pression et force pressante' },
    { id: 'cric', titre: 'Le cric hydraulique' },
    { id: 'hydro', titre: 'Principe fondamental de l\'hydrostatique' },
    { id: 'supp', titre: 'Exercice supplémentaire' },
  ];
})();
