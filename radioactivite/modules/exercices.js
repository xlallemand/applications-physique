/* ============================================================
   Exercices du module 6 (application « Chapitre 12 : Radioactivité ») :
   les exercices de la feuille, dans l'ordre et avec leur numérotation
   (7 p. 155, 1, 2, 10 p. 155, 11 p. 156, 6 p. 154, 16 p. 156), le
   sujet de bac (cobalt 60), puis les exercices supplémentaires
   « Applications technologiques » 17, 18 et 19.

   Chaque exercice : { id, groupe, titre, desc, contexte (HTML),
   parties: fonction qui les fabrique } ; chaque partie suit le format
   de RAD.PARTIES avec p.q (question) et p.correction (correction
   détaillée : formule, grandeur isolée, application numérique avec
   les unités). Outils propres : RAD.partieTableau (ex. 7),
   RAD.partieEquation (équations à compléter), RAD.partieLecture
   (demi-vie ou date lue sur la courbe).

   Valeurs vérifiées par un script :
     ex. 10 : 120 / 60 = 2,0 Bq ; 5,0 × 10⁶ / 60 ≈ 8,3 × 10⁴ Bq ; 6 × 10⁶ / 300 = 2 × 10⁴ Bq ;
     ex. 6 : 6 protons, 8 neutrons ; A₀/2 = 4 × 10³ Bq à 6 × 10³ ans ; 1 000 Bq à 18 × 10³ ans ;
     ex. 16 : 238 − 4 = 234, 92 − 2 = 90 ; N₀/2 = 2,5 × 10¹² noyaux à 4,5 × 10⁹ années ;
     bac : f = 2,13 × 10⁻¹³ / 6,63 × 10⁻³⁴ ≈ 3,21 × 10²⁰ Hz ; λ = 3,00 × 10⁸ / 3,21 × 10²⁰ ≈ 9,3 × 10⁻¹³ m ;
       A₀ = 41 000 kBq ; 20 500 kBq à 5,3 ans ; 10 × 5,3 = 53 ans ;
     ex. 17 : a = 192 − 192 = 0, b = 77 − 76 = 1 : positon, β⁺ ;
     ex. 18 : Mo 99 : 42 p, 57 n ; Tc 99m et Tc 99 : 43 p, 56 n ;
     ex. 19 : Cs 135 : 55 p, 80 n ; Pu 241 : 94 p, 147 n ; X = ²⁴¹₉₅Am ;
       m₀ = 3,0 mg, 1,5 mg à 14 ans ; césium : 2,0 × 2^(−56 / 2,3 × 10⁶) ≈ 2,0 mg.
   Écarts avec la correction :
     ex. 11 : la correction écrit « N = A₀ e^(−λt) » : c'est A = A₀ e^(−λt) ;
     bac Q2 : la correction écrit f = 2,06 × 10²² Hz (faux) et ne calcule pas la longueur
       d'onde demandée : f ≈ 3,21 × 10²⁰ Hz et λ ≈ 9,3 × 10⁻¹³ m ;
     ex. 17, 18, 19 : pas de correction fournie (rédigée ici) ;
     ex. 19 : la légende du manuel dit « masse désintégrée » : la courbe est la masse restante.
   ============================================================ */
(function () {
  'use strict';

  const { o, fmt, sci, proche, nuc, n, equation, figCourbe, partieTableau, partieEquation, partieLecture } = window.RAD;
  const M = window.RAD.MOINS;
  const calc = h => `<p class="ph-calc">${h}</p>`;
  const c = h => `<span class="c">${h}</span>`;
  const L = h => `<span class="rad-lisible">${h}</span>`;
  const pr = (a, b) => proche(a, b, .02);
  const decroit = (y0, T) => t => y0 * Math.pow(2, -t / T);
  // fabriques de parties
  const choix = (q, options, bonne, correction, opts) => Object.assign({ type: 'choix', q, options, bonne, correction, colonne: options.some(x => x.label.replace(/<[^>]+>/g, '').length > 24) }, opts);
  const nombre = (q, label, valeur, unite, correction, opts) => Object.assign({ type: 'nombre', q, label, valeur, unite, correction, signe: false }, opts);
  const scient = (q, label, valeur, unite, correction, opts) => Object.assign({ type: 'sci', q, label, valeur, unite, correction, cs: 2, rel: .02 }, opts);
  const donnees = l => `<p class="ph-donnees">Données : ${l.join(' ; ')}.</p>`;
  const TYPES = [o('alpha', 'α'), o('moins', 'β<sup>−</sup>'), o('plus', 'β<sup>+</sup>')];
  const IND_TYPES = { alpha: 'α : on trouve He (noyau d\'hélium) dans l\'équation.', moins: 'β<sup>−</sup> : on trouve e avec −1 en bas (électron).', plus: 'β<sup>+</sup> : on trouve e avec +1 en bas (positron).' };
  const DEF_DEMIVIE = choix('Donne la définition de la demi-vie t<sub>1/2</sub> (ou période radioactive).',
    [o('ok', 'la durée au bout de laquelle le nombre de noyaux radioactifs est divisé par 2'), o('tout', 'la durée au bout de laquelle tous les noyaux se sont désintégrés'), o('moitie', 'la moitié de la durée de vie d\'un noyau')], 'ok',
    '<p>La demi-vie t<sub>1/2</sub> est la durée au bout de laquelle le nombre de noyaux radioactifs (ou l\'activité) est <b>divisé par 2</b>.</p>',
    { indices: { tout: 'Le nombre de noyaux est divisé par 2 à chaque demi-vie : il en reste toujours.', moitie: 'On ne peut pas prévoir quand un noyau donné se désintègre : la demi-vie concerne un grand nombre de noyaux.' } });
  const ISOTOPES = choix('Qu\'appelle-t-on isotopes ?',
    [o('ok', 'des noyaux de même Z (même élément) mais de A différents'), o('memeA', 'des noyaux de même A mais de Z différents'), o('tout', 'des noyaux de même A et de même Z')], 'ok',
    '<p>Des isotopes ont le même nombre de protons Z et des nombres de nucléons A différents (des nombres de neutrons différents).</p>',
    { indices: { memeA: 'Avec des Z différents, ce sont des éléments différents.', tout: 'Même A et même Z : c\'est le même noyau.' } });
  const CONSERVATION = '<p>Lois de conservation : la somme des nombres de nucléons A et la somme des nombres de charge Z sont les mêmes à gauche et à droite de la flèche.</p>';

  /* ---------- Exercice 7 p. 155 : tableau des isotopes ---------- */
  const ex7 = {
    id: '7', groupe: 'noyau', titre: 'Exercice 7 p. 155 : compléter le tableau', desc: 'Nom, symbole, protons, nucléons et neutrons de dix isotopes',
    contexte: `<p class="er-contexte">Compléter le tableau suivant.</p>
      <div class="rad-defile"><table class="rad-tab rad-lisible">
        <tr><th>Nom de l'isotope</th><th>Symbole</th><th>Nombre de protons Z</th><th>Nombre de nucléons A</th><th>Nombre de neutrons</th></tr>
        <tr><td>Oxygène 16</td><td></td><td></td><td></td><td></td></tr>
        <tr><td></td><td>${nuc(17, 8, 'O')}</td><td></td><td></td><td></td></tr>
        <tr><td></td><td></td><td>8</td><td>18</td><td></td></tr>
        <tr><td></td><td></td><td>26</td><td></td><td>28</td></tr>
        <tr><td></td><td>${nuc(56, 26, 'Fe')}</td><td></td><td></td><td></td></tr>
        <tr><td>Uranium 238</td><td></td><td></td><td></td><td></td></tr>
        <tr><td></td><td></td><td></td><td>235</td><td>143</td></tr>
        <tr><td>Hydrogène 1</td><td>${nuc(1, 1, 'H')}</td><td></td><td></td><td></td></tr>
        <tr><td>Hydrogène 2 (deutérium)</td><td></td><td>1</td><td></td><td>1</td></tr>
        <tr><td>Hydrogène 3 (tritium)</td><td></td><td></td><td></td><td></td></tr>
      </table></div>`,
    parties: () => {
      const elts = ['O', 'Fe', 'U', 'H'];
      return [
        partieTableau([{ A: 16, Z: 8, inc: 'sZAN' }, { A: 17, Z: 8, inc: 'nZAN' }, { A: 18, Z: 8, inc: 'nsN' }], { elements: elts, q: 'Lignes 1 à 3 : l\'oxygène.',
          correction: `<p>Oxygène 16 : ${L(nuc(16, 8, 'O'))}, 8 protons, 16 nucléons, 16 − 8 = 8 neutrons. Oxygène 17 : ${L(nuc(17, 8, 'O'))}, 8, 17, 9. Z = 8 et A = 18 : oxygène 18, ${L(nuc(18, 8, 'O'))}, 10 neutrons.</p>` }),
        partieTableau([{ A: 54, Z: 26, inc: 'nsA' }, { A: 56, Z: 26, inc: 'nZAN' }], { elements: elts, q: 'Lignes 4 et 5 : le fer (Z = 26, voir le symbole de la ligne 5).',
          correction: `<p>Z = 26 et 28 neutrons : A = 26 + 28 = 54, fer 54, ${L(nuc(54, 26, 'Fe'))}. Fer 56 : ${L(nuc(56, 26, 'Fe'))}, 26 protons, 56 nucléons, 30 neutrons.</p>` }),
        partieTableau([{ A: 238, Z: 92, inc: 'sZAN' }, { A: 235, Z: 92, inc: 'nsZ' }], { elements: elts, q: 'Lignes 6 et 7 : l\'uranium (Z = 92).',
          correction: `<p>Uranium 238 : ${L(nuc(238, 92, 'U'))}, 92 protons, 238 nucléons, 146 neutrons. A = 235 et 143 neutrons : Z = 235 − 143 = 92, uranium 235, ${L(nuc(235, 92, 'U'))}.</p>` }),
        partieTableau([{ A: 1, Z: 1, inc: 'ZAN' }, { A: 2, Z: 1, surnom: 'deutérium', inc: 'sA' }, { A: 3, Z: 1, surnom: 'tritium', inc: 'sZAN' }], { elements: elts, q: 'Lignes 8 à 10 : l\'hydrogène.',
          correction: `<p>Hydrogène 1 : 1 proton, 1 nucléon, 0 neutron. Deutérium : A = 1 + 1 = 2, ${L(nuc(2, 1, 'H'))}. Tritium : ${L(nuc(3, 1, 'H'))}, 1 proton, 3 nucléons, 2 neutrons. Ce sont trois isotopes de l'hydrogène.</p>` }),
      ];
    },
  };

  /* ---------- Exercice 1 : type de radioactivité et particule émise ---------- */
  const EQ1 = [
    ['a', equation([n(226, 88)], [n(222, 86), n(4, 2, 'He')]), 'alpha'],
    ['b', equation([n(32, 15)], [n(32, 16), n(0, -1, 'e')]), 'moins'],
    ['c', equation([n(238, 92)], [n(234, 90), n(4, 2, 'He')]), 'alpha'],
    ['d', equation([n(53, 27)], [n(53, 26), n(0, 1, 'e')]), 'plus'],
    ['e', equation([n(212, 83)], [n(208, 81), n(4, 2, 'He')]), 'alpha'],
    ['f', equation([n(12, 7)], [n(0, 1, 'e'), n(12, 6)]), 'plus'],
    ['g', equation([n(14, 6)], [n(0, -1, 'e'), n(14, 7)]), 'moins'],
  ];
  const NOM_PART = { alpha: `radioactivité α, particule noyau d'hélium ${nuc(4, 2, 'He')}`, moins: `radioactivité β<sup>−</sup>, particule électron ${nuc(0, -1, 'e')}`, plus: `radioactivité β<sup>+</sup>, particule positron ${nuc(0, 1, 'e')}` };
  const OPTS1 = [o('alpha', 'α : noyau d\'hélium'), o('moins', 'β<sup>−</sup> : électron'), o('plus', 'β<sup>+</sup> : positron')];
  const grille1 = (lignes, q) => ({ type: 'grille', q, options: OPTS1,
    lignes: lignes.map(([id, eq, t]) => ({ id, label: `${id}) ${L(eq)}`, bonne: t, indices: IND_TYPES })),
    correction: lignes.map(([id, eq, t]) => `<p>${id}) ${L(eq)} : ${NOM_PART[t]}.</p>`).join('') });
  const ex1 = {
    id: '1', groupe: 'noyau', titre: 'Exercice 1 : type de radioactivité', desc: 'Sept équations : α, β<sup>−</sup> ou β<sup>+</sup>, et la particule émise',
    contexte: `<p class="er-contexte">Indiquer pour chaque réaction suivante le type de radioactivité et la nature des particules émises.</p>
      ${EQ1.map(([id, eq]) => `<p class="ph-calc">${id}) ${L(eq)}</p>`).join('')}`,
    parties: () => [grille1(EQ1.slice(0, 4), 'Réactions a) à d) : type de radioactivité et particule émise.'), grille1(EQ1.slice(4), 'Réactions e) à g).')],
  };

  /* ---------- Exercice 2 : nature et symbole de la particule ---------- */
  const OPTS2 = [o('alpha', `${L(nuc(4, 2, 'He'))} noyau d'hélium`), o('moins', `${L(nuc(0, -1, 'e'))} électron`), o('plus', `${L(nuc(0, 1, 'e'))} positron`)];
  const part2 = (lettre, t, nom) => choix(`${lettre}) ${nom}`, OPTS2, t, `<p>${{ alpha: `α : noyau d'hélium ${L(nuc(4, 2, 'He'))}`, moins: `β<sup>−</sup> : électron ${L(nuc(0, -1, 'e'))}`, plus: `β<sup>+</sup> : positron ${L(nuc(0, 1, 'e'))}` }[t]}.</p>`,
    { melanger: false, colonne: true, indices: { alpha: 'Le noyau d\'hélium est la particule α.', moins: 'L\'électron (Z = −1) est la particule β<sup>−</sup>.', plus: 'Le positron (Z = +1) est la particule β<sup>+</sup>.' } });
  const ex2 = {
    id: '2', groupe: 'noyau', titre: 'Exercice 2 : particule émise', desc: 'Nature et symbole de la particule pour β<sup>+</sup>, α et β<sup>−</sup>',
    contexte: '<p class="er-contexte">Donner la nature et le symbole de la particule émise lors d\'une désintégration : a) β<sup>+</sup> ; b) α ; c) β<sup>−</sup>.</p>',
    parties: () => [part2('a', 'plus', 'β<sup>+</sup>'), part2('b', 'alpha', 'α'), part2('c', 'moins', 'β<sup>−</sup>')],
  };

  /* ---------- Exercice 10 p. 155 : activités en becquerels ---------- */
  const ex10 = {
    id: '10', groupe: 'activite', titre: 'Exercice 10 p. 155 : activités en becquerels', desc: 'Désintégrations par minute ou pendant une durée → Bq',
    contexte: `<p class="er-contexte">Exprimer les activités suivantes en becquerel (Bq).</p>
      <ul class="er-liste"><li>a) 120 désintégrations par minute.</li><li>b) 5,0 × 10<sup>6</sup> désintégrations par minute.</li><li>c) 6 millions de désintégrations en 5 minutes.</li></ul>`,
    parties: () => [
      nombre('a) 120 désintégrations par minute.', 'A =', 2, 'Bq', calc(`A = ${window.RAD.fr('120', '60')} = ${c('2,0 Bq')}`) + '<p>1 Bq = 1 désintégration par seconde : on divise par 60 s.</p>',
        { rel: .01, diag: v => (pr(v, 7200) ? 'Une minute dure 60 s : on divise par 60.' : pr(v, 120) ? 'Le becquerel compte par seconde : divise par 60.' : 'A = 120 / 60.') }),
      scient('b) 5,0 × 10<sup>6</sup> désintégrations par minute.', 'A =', 5e6 / 60, 'Bq', calc(`A = ${window.RAD.fr('5,0 × 10<sup>6</sup>', '60')} ≈ ${c('8,3 × 10<sup>4</sup> Bq')}`),
        { diag: v => (pr(v, 3e8) ? 'On divise par 60, on ne multiplie pas.' : pr(v, 5e6) ? 'Divise par 60 pour avoir des désintégrations par seconde.' : 'A = 5,0 × 10<sup>6</sup> / 60.') }),
      scient('c) 6 millions de désintégrations en 5 minutes.', 'A =', 2e4, 'Bq', calc('Δt = 5 min = 5 × 60 = 300 s') + calc(`A = ${window.RAD.fr('6 × 10<sup>6</sup>', '5 × 60')} = ${c('2 × 10<sup>4</sup> Bq')}`),
        { cs: 1, diag: v => (pr(v, 1.2e6) ? 'Ça, c\'est par minute : divise encore par 60.' : pr(v, 1e5) ? 'La durée doit être en secondes : 5 min = 300 s.' : pr(v, 6e6 / 60) ? 'Il y a 5 minutes : la durée est 5 × 60 = 300 s.' : 'A = 6 × 10<sup>6</sup> / (5 × 60).') }),
    ],
  };

  /* ---------- Exercice 11 p. 156 : loi de décroissance et activité ---------- */
  const ex11 = {
    id: '11', groupe: 'activite', titre: 'Exercice 11 p. 156 : expression de A(t)', desc: 'N = N<sub>0</sub> e<sup>−λt</sup>, A = −dN/dt, A<sub>0</sub> = λN<sub>0</sub>',
    contexte: `<p class="er-contexte">Données : N = N<sub>0</sub> e<sup>${M}λt</sup> ; la dérivée de la fonction exponentielle est (e<sup>ax</sup>)′ = a × e<sup>ax</sup>.</p>
      <ul class="er-liste"><li>a) Rappeler l'expression de la loi de décroissance radioactive N = N(t).</li>
        <li>b) Sachant que l'activité A d'un échantillon est reliée au nombre N d'éléments radioactifs de cet échantillon par la relation A = −dN/dt, déterminer l'expression de la fonction A = A(t).</li>
        <li>c) Exprimer l'activité initiale A<sub>0</sub> de l'échantillon en fonction du nombre initial N<sub>0</sub> d'éléments radioactifs.</li></ul>`,
    parties: () => [
      choix('a) Loi de décroissance radioactive :', [o('ok', `N = N<sub>0</sub> e<sup>${M}λt</sup>`), o('plus', 'N = N<sub>0</sub> e<sup>λt</sup>'), o('lin', 'N = N<sub>0</sub> − λt')], 'ok',
        `<p>${c(`N = N<sub>0</sub> e<sup>${M}λt</sup>`)} : le nombre de noyaux diminue de façon exponentielle.</p>`,
        { indices: { plus: 'Avec e<sup>λt</sup>, N augmenterait : il faut le signe −.', lin: 'La décroissance radioactive est exponentielle, pas linéaire.' } }),
      choix('b) Expression de A(t) :', [o('ok', `A = λ N<sub>0</sub> e<sup>${M}λt</sup>`), o('signe', `A = ${M}λ N<sub>0</sub> e<sup>${M}λt</sup>`), o('meme', `A = N<sub>0</sub> e<sup>${M}λt</sup>`)], 'ok',
        calc(`A = ${M}${window.RAD.fr('dN', 'dt')} = ${M}N<sub>0</sub> × (${M}λ) × e<sup>${M}λt</sup> = ${c(`λ N<sub>0</sub> e<sup>${M}λt</sup>`)} (= λN)`),
        { indices: { signe: `${M}λ N<sub>0</sub> e<sup>${M}λt</sup> est la dérivée dN/dt ; A en est l'opposé.`, meme: '(e<sup>ax</sup>)′ = a e<sup>ax</sup> avec a = −λ : il faut multiplier par −λ.' } }),
      choix('c) Activité initiale A<sub>0</sub> :', [o('ok', 'A<sub>0</sub> = λ N<sub>0</sub>'), o('div', 'A<sub>0</sub> = N<sub>0</sub> / λ'), o('n', 'A<sub>0</sub> = N<sub>0</sub>')], 'ok',
        `<p>À t = 0, e<sup>0</sup> = 1 : ${c('A<sub>0</sub> = λ N<sub>0</sub>')}, donc A = A<sub>0</sub> e<sup>${M}λt</sup>.</p>`,
        { indices: { div: 'Remplace t par 0 dans A = λ N<sub>0</sub> e<sup>−λt</sup>.', n: 'L\'activité compte des désintégrations par seconde, pas des noyaux : A<sub>0</sub> = A(0).' } }),
    ],
  };

  /* ---------- Exercice 6 p. 154 : carbone 14 ---------- */
  const C14 = { f: decroit(8, 6), y0: 8, sym: 'A', grilleFine: true, x: { max: 30, pas: 6, fin: 1, titre: 't (en 10³ ans)' }, y: { max: 9, pas: 2, fin: .5, grille: 1, titre: 'A (en 10³ Bq)' } };
  const ex6 = {
    id: '6', groupe: 'demivie', titre: 'Exercice 6 p. 154 : le carbone 14', desc: 'Composition, équation de désintégration, demi-vie et datation sur la courbe',
    contexte: `<p class="er-contexte">Le carbone 14 noté ${L(nuc(14, 6, 'C'))} est un émetteur β<sup>−</sup>.</p>
      <ul class="er-liste"><li>1. Donner la composition du noyau de l'atome de carbone 14.</li><li>2. Sachant que le carbone 14 se désintègre en azote ${L(nuc(14, 7, 'N'))}, écrire l'équation bilan de la désintégration du carbone 14.</li>
        <li>3. Dans les êtres vivants, la radioactivité due au carbone 14 est stable du fait des échanges avec l'extérieur. Par contre, à leur mort, les échanges étant interrompus, la radioactivité due au carbone 14 décroît progressivement. Le graphique donne l'évolution, en fonction du temps t (exprimé en milliers d'années), de l'activité A (exprimée en milliers de becquerels) d'un échantillon ne contenant que du carbone 14 comme nucléide radioactif. À l'aide du graphique, montrer que la période radioactive du carbone 14, notée T<sub>c</sub>, est T<sub>c</sub> ≈ 6 000 ans.</li>
        <li>4. Le carbone 14 est utilisé pour dater les fossiles. Quel est l'âge de l'échantillon dont l'activité du carbone 14 est de 1 000 Bq ?</li></ul>
      ${figCourbe(C14, 'Activité du carbone 14 en fonction du temps : 8 × 10³ Bq au départ')}`,
    parties: () => [
      { type: 'gabarit', q: '1. Composition du noyau de carbone 14.', morceaux: ['protons :', { v: 6 }, ' neutrons :', { v: 8 }],
        diag: v => (v[1] === 14 ? 'A compte tous les nucléons : neutrons = A − Z.' : v[0] === 14 ? 'Le nombre de protons est Z = 6, le nombre du bas.' : 'Protons : Z ; neutrons : A − Z.'),
        correction: `<p>${L(nuc(14, 6, 'C'))} contient ${c('6 protons')} et 14 − 6 = ${c('8 neutrons')}.</p>` },
      partieEquation({ g: [n(14, 6)], d: [n(14, 7), Object.assign(n(0, -1, 'e'), { inc: 'AZs' })] }, { q: '2. Complète l\'équation de désintégration : A et Z de la particule émise, puis la particule.',
        correction: `${CONSERVATION}${calc(L(equation([n(14, 6)], [n(14, 7), n(0, -1, 'e')])))}<p>A : 14 = 14 + 0 ; Z : 6 = 7 + (${M}1) : un électron est émis (β<sup>−</sup>).</p>` }),
      partieLecture(Object.assign({}, C14, { rep: { label: 'T<sub>c</sub> =', unite: 'ans', facteur: 1000, tol: .5 } }), { q: '3. Mesure la période radioactive T<sub>c</sub> sur la courbe.',
        correction: '<p>On cherche la date à laquelle l\'activité est divisée par deux : A<sub>1</sub> = A<sub>0</sub>/2 = 8 / 2 = 4 × 10<sup>3</sup> Bq. Par lecture graphique, on trouve ' + c('T<sub>c</sub> = 6 × 10<sup>3</sup> ans = 6 000 ans') + '.</p>' }),
      partieLecture(Object.assign({}, C14, { mode: 'valeur', cible: 1, cibleTxt: 'A = 1 000 Bq = 1 × 10³ Bq', rep: { label: 'âge =', unite: 'ans', facteur: 1000, tol: .5 } }), { q: '4. Âge de l\'échantillon dont l\'activité est de 1 000 Bq.',
        correction: `<p>1 000 Bq = 1 × 10<sup>3</sup> Bq : on lit 18 sur l'axe en 10<sup>3</sup> ans, l'âge est de ${c('18 000 ans')}.</p><p>Vérification : 8 000 → 4 000 → 2 000 → 1 000 Bq, c'est 3 demi-vies : 3 × 6 000 = 18 000 ans.</p>` }),
    ],
  };

  /* ---------- Exercice 16 p. 156 : âge de la Terre ---------- */
  const U238 = { f: decroit(5, 4.5), y0: 5, sym: 'N', grilleFine: true, x: { max: 35, pas: 5, fin: .5, grille: 1, titre: 't (10⁹ années)' }, y: { max: 6, pas: 1, fin: .5, grille: .25, titre: 'N<tspan dy="3" font-size="9">U</tspan><tspan dy="-3"> (10¹² noyaux d\'uranium)</tspan>' } };
  const ex16 = {
    id: '16', groupe: 'demivie', titre: 'Exercice 16 p. 156 : l\'âge de la Terre', desc: 'Équation de la désintégration α de l\'uranium 238, demi-vie sur la courbe',
    contexte: `<p class="er-contexte">La détermination de l'âge de la Terre a commencé vers le XVI<sup>e</sup> siècle, on l'estimait alors autour de 5 000 ans. Au XIX<sup>e</sup> siècle, des scientifiques admettaient un âge d'environ 100 millions d'années.</p>
      <p class="er-contexte">La découverte de la radioactivité par Henri Becquerel en 1896 bouleversa toutes les données connues. La datation à l'uranium/plomb permit de déterminer assez précisément l'âge de la Terre. Le noyau d'uranium 238, naturellement radioactif, se transforme en un noyau de plomb 206, stable, par une série de désintégrations successives. Dans la première étape, un noyau d'uranium ${L(nuc(238, 92, 'U'))} subit une radioactivité α. Le noyau fils est du thorium (${L(nuc(234, 90, 'Th'))}).</p>
      ${figCourbe(U238, 'Nombre de noyaux d\'uranium 238 en fonction du temps : 5 × 10¹² au départ')}
      <ul class="er-liste"><li>a) Écrire l'équation de la réaction nucléaire de cette première étape.</li><li>b) À l'aide du graphique, déterminer la demi-vie de l'uranium 238 et justifier qu'il puisse servir à la datation de la Terre.</li></ul>`,
    parties: () => [
      partieEquation({ g: [n(238, 92)], d: [n(234, 90), Object.assign(n(4, 2, 'He'), { inc: 'AZs' })] }, { q: 'a) Complète l\'équation : A et Z de la particule émise, puis la particule.',
        correction: `${calc(L(equation([n(238, 92)], [n(234, 90), n(4, 2, 'He')])))}<p>Au cours d'une réaction nucléaire, il y a conservation de la charge électrique et conservation du nombre de nucléons : A = 238 − 234 = 4, Z = 92 − 90 = 2, c'est un noyau d'hélium (radioactivité α).</p>` }),
      partieLecture(Object.assign({}, U238, { rep: { label: 't<sub>1/2</sub> =', unite: '× 10<sup>9</sup> années', tol: .5 } }), { q: 'b) Mesure la demi-vie de l\'uranium 238 sur la courbe.',
        correction: `<p>N<sub>0</sub> = 5 × 10<sup>12</sup> noyaux ; N<sub>0</sub>/2 = 2,5 × 10<sup>12</sup> noyaux ; on lit ${c('t<sub>1/2</sub> ≈ 4,5 × 10<sup>9</sup> années')}.</p>` }),
      choix('Pourquoi l\'uranium 238 peut-il servir à la datation de la Terre ?', [o('ok', 'Sa demi-vie (4,5 milliards d\'années) est de l\'ordre de grandeur de l\'âge de la Terre'), o('court', 'Sa demi-vie est très courte'), o('alpha', 'Parce qu\'il est radioactif α')], 'ok',
        '<p>La demi-vie de l\'uranium 238 est de l\'ordre de grandeur de l\'âge de la Terre : il en reste encore une part mesurable, qui a nettement diminué depuis la formation de la Terre. Il peut donc servir à la dater.</p>',
        { indices: { court: '4,5 × 10<sup>9</sup> années, c\'est 4,5 milliards d\'années : c\'est très long.', alpha: 'Le type de radioactivité n\'y est pour rien : c\'est la durée de la demi-vie qui compte.' } }),
    ],
  };

  /* ---------- Sujet de bac : le cobalt 60 ---------- */
  const PTS_CO = []; for (let t = 0; t <= 30; t++) PTS_CO.push([t, 41000 * Math.pow(2, -t / 5.3)]);
  const CO60 = { f: decroit(41000, 5.3), y0: 41000, sym: 'A', grilleFine: true, margeG: 58, points: PTS_CO,
    x: { max: 30, pas: 5, fin: .5, grille: 1, titre: 't (en années)' }, y: { max: 45000, pas: 5000, fin: 500, grille: 2500, titre: 'Activité de la source (kBq)' } };
  const exBac = {
    id: 'Bac', groupe: 'demivie', titre: 'Sujet de bac : le cobalt 60', desc: 'Types de radioactivité, photon γ (f et λ), activité initiale, demi-vie, 10 demi-vies',
    contexte: `${donnees(['constante de Planck : h = 6,63 × 10<sup>−34</sup> J·s', 'célérité de la lumière dans le vide : c = 3,00 × 10<sup>8</sup> m·s<sup>−1</sup>', '1 kBq correspond à 1 000 désintégrations par seconde'])}
      <p class="er-contexte" style="margin-top:8px">Le cobalt 60, de symbole ${L(nuc(60, 27, 'Co'))}, se désintègre pour donner un noyau fils de nickel de symbole ${L(nuc(60, 28, 'Ni'))} selon une désintégration de type β<sup>−</sup>.</p>
      <p class="er-contexte"><b>Q1.</b> Rappeler les différents types de rayonnement radioactif. Préciser la nature de la particule émise lors de la désintégration du ${L(nuc(60, 27, 'Co'))} en ${L(nuc(60, 28, 'Ni'))}.</p>
      <p class="er-contexte">Le noyau fils ${L(nuc(60, 28, 'Ni'))} issu de cette désintégration est dans un état excité. Il se désexcite en émettant un photon d'énergie 2,13 × 10<sup>−13</sup> J.</p>
      <p class="er-contexte"><b>Q2.</b> Calculer la fréquence, puis la longueur d'onde du rayonnement émis au cours de la désexcitation du ${L(nuc(60, 28, 'Ni'))}.</p>
      <p class="er-contexte">Le traitement des déchets diffère selon la valeur de la demi-vie des éléments radioactifs qu'ils contiennent. Les éléments dont la durée de demi-vie est inférieure à 31 ans peuvent être stockés sur le lieu d'utilisation. On considère qu'au bout d'une durée de 10 demi-vies, l'activité de la source est négligeable. Le document 1 représente la courbe de décroissance radioactive au cours du temps de l'activité d'un échantillon de cobalt 60 utilisé en milieu hospitalier.</p>
      ${figCourbe(CO60, 'Document 1 : décroissance de l\'activité d\'un échantillon de cobalt 60, 41 000 kBq au départ')}
      <p class="ph-donnees" style="text-align:center">Document 1 : décroissance de l'activité d'un échantillon de cobalt 60</p>
      <p class="er-contexte"><b>Q3.</b> Définir l'activité d'une source radioactive et déterminer l'activité initiale de l'échantillon de cobalt 60 considéré.</p>
      <p class="er-contexte"><b>Q4.</b> À l'aide du document 1, déterminer la durée de demi-vie du cobalt 60 en expliquant la méthode.</p>
      <p class="er-contexte"><b>Q5.</b> Calculer la durée au bout de laquelle on peut considérer que l'activité de l'échantillon est négligeable. Préciser alors si les noyaux de ${L(nuc(60, 27, 'Co'))} sont présents dans la nature.</p>`,
    parties: () => [
      choix('Q1. Quels sont les différents types de rayonnement radioactif ?', [o('ok', 'α (noyau d\'hélium), β<sup>−</sup> (électron), β<sup>+</sup> (positron), accompagnés du rayonnement γ'), o('deux', 'α et β seulement'), o('gamma', 'γ seulement')], 'ok',
        '<p>Radioactivité α : émission d\'un noyau d\'hélium ; radioactivité β<sup>−</sup> : émission d\'un électron ; radioactivité β<sup>+</sup> : émission d\'un positron. Ces désintégrations s\'accompagnent d\'un rayonnement γ (celui dont on parle à la question 2).</p>',
        { indices: { deux: 'La radioactivité β se décline en deux types, β<sup>−</sup> et β<sup>+</sup>, et le rayonnement γ les accompagne.', gamma: 'γ accompagne les désintégrations α, β<sup>−</sup> et β<sup>+</sup>.' } }),
      partieEquation({ g: [n(60, 27)], d: [n(60, 28), Object.assign(n(0, -1, 'e'), { inc: 'AZs' })] }, { q: 'Q1. Complète l\'équation de désintégration du cobalt 60 pour trouver la particule émise.',
        correction: `${calc(L(equation([n(60, 27)], [n(60, 28), n(0, -1, 'e')])))}<p>Cobalt : β<sup>−</sup>, donc émission d'un ${c('électron')} (A = 0, Z = 27 − 28 = −1).</p>` }),
      scient('Q2. Calcule la fréquence f du photon émis (3 chiffres significatifs).', 'f =', 2.13e-13 / 6.63e-34, 'Hz',
        calc('E = h × f, donc f = E / h') + calc(`f = ${window.RAD.fr('2,13 × 10<sup>−13</sup> J', '6,63 × 10<sup>−34</sup> J·s')} ≈ ${c('3,21 × 10<sup>20</sup> Hz')}`),
        { cs: 3, rel: .01, diag: v => (pr(v, 6.63e-34 / 2.13e-13) ? 'f = E / h : l\'énergie au numérateur.' : pr(v, 2.13e-13 * 6.63e-34) ? 'E = h × f, donc f = E / h : on divise.' : 'E = h × f, donc f = E / h.') }),
      scient('Q2. Calcule la longueur d\'onde λ du rayonnement (2 chiffres significatifs).', 'λ =', 3e8 / (2.13e-13 / 6.63e-34), 'm',
        calc('c = λ × f, donc λ = c / f') + calc(`λ = ${window.RAD.fr('3,00 × 10<sup>8</sup> m·s<sup>−1</sup>', '3,21 × 10<sup>20</sup> Hz')} ≈ ${c('9,3 × 10<sup>−13</sup> m')}`) + '<p>Une longueur d\'onde bien plus petite que celle du visible (400 à 800 nm) : c\'est un rayonnement γ.</p>',
        { diag: v => (pr(v, 3.2127e20 / 3e8) ? 'λ = c / f : la célérité au numérateur.' : pr(v, 3e8 * 3.2127e20) ? 'c = λ × f, donc λ = c / f : on divise.' : 'λ = c / f, avec f calculée juste avant.') }),
      choix('Q3. Qu\'est-ce que l\'activité d\'une source radioactive ?', [o('ok', 'le nombre moyen de désintégrations par seconde, en becquerels'), o('n', 'le nombre de noyaux radioactifs de la source'), o('e', 'l\'énergie émise par seconde')], 'ok',
        '<p>L\'activité est le nombre de désintégrations par seconde (en Bq) : A = −dN/dt.</p>',
        { indices: { n: 'L\'activité compte des désintégrations par seconde.', e: 'L\'unité est le becquerel, pas le watt.' } }),
      nombre('Q3. Lis l\'activité initiale de l\'échantillon (document 1).', 'A<sub>0</sub> =', 41000, 'kBq', '<p>On lit sur le graphique sa valeur à t = 0 : ' + c('A<sub>0</sub> = 41 000 kBq') + ' (soit 4,1 × 10<sup>7</sup> Bq).</p>',
        { tol: 500, diag: v => (Math.abs(v - 45000) < 1 ? '45 000 est le haut de l\'axe : lis la valeur de la courbe à t = 0.' : Math.abs(v - 41) < 1 ? 'L\'axe est gradué en kBq : 41 000 kBq.' : 'Lis la valeur de la courbe à t = 0, sur l\'axe vertical.') }),
      partieLecture(Object.assign({}, CO60, { rep: { label: 't<sub>1/2</sub> =', unite: 'ans', tol: .3 } }), { q: 'Q4. Détermine la demi-vie du cobalt 60 : divise A<sub>0</sub> par 2, reporte sur la courbe, puis sur l\'axe des temps.',
        correction: `<p>La demi-vie est la durée pour que l'activité ait diminué de moitié : passer de 41 000 à 20 500 kBq. On mesure ${c('t<sub>1/2</sub> = 5,3 ans')}.</p>` }),
      nombre('Q5. Au bout de combien de temps l\'activité est-elle négligeable ?', 'durée =', 53, 'ans', calc(`10 × t<sub>1/2</sub> = 10 × 5,3 = ${c('53 ans')}`),
        { tol: 2, diag: v => (Math.abs(v - 10.6) < .5 ? 'C\'est 2 demi-vies : il en faut 10.' : Math.abs(v - 5.3) < .3 ? 'Il faut 10 demi-vies.' : 'On considère l\'activité négligeable au bout de 10 demi-vies.') }),
      choix('Q5. Les noyaux de cobalt 60 sont-ils présents dans la nature ?', [o('non', 'Non : 53 ans, c\'est très court devant l\'âge de la Terre, les noyaux formés avec elle ont disparu'), o('oui', 'Oui, puisqu\'il est radioactif')], 'non',
        '<p>Cette durée (53 ans) est très courte par rapport à l\'âge de la Terre (4,5 milliards d\'années) : les noyaux de cobalt 60 ne sont donc plus présents dans la nature (on le fabrique).</p>',
        { melanger: false, indices: { oui: 'Compare 53 ans à l\'âge de la Terre, environ 4,5 milliards d\'années.' } }),
    ],
  };

  /* ---------- Exercice 17 : médecine nucléaire (iridium 192) ---------- */
  const ex17 = {
    id: '17', groupe: 'applications', titre: 'Exercice 17 : médecine nucléaire', desc: 'Iridium 192 : composition, particule émise par conservation, isotopes, demi-vie',
    contexte: `<p class="er-contexte">Les cellules malades sont plus sensibles aux rayonnements radioactifs que les cellules saines. Il est donc possible de les détruire sélectivement par irradiation. En ORL (Oto-Rhino-Laryngologie), on peut traiter les tumeurs du sinus, des lèvres, des joues, de la langue, en implantant au voisinage des cellules cancéreuses des aiguilles ou des fils contenant de l'iridium 192 dont la période radioactive est 74 jours.</p>
      <p class="er-contexte">L'activité de l'aiguille implantée est 7 × 10<sup>7</sup> becquerels. On laisse cette aiguille le temps nécessaire pour que la dose absorbée par la tumeur et les tissus environnants soit voisine de 0,07 gray.</p>
      <ul class="er-liste"><li>1. Sachant que le nucléide iridium 192 se note ${L(nuc(192, 77, 'Ir'))}, que représentent les nombres 192 et 77 ?</li>
        <li>2. L'équation de désintégration nucléaire de l'iridium 192 s'écrit : ${L(equation([n(192, 77)], [n('a', 'b', 'X'), n(192, 76), 'γ']))}.<br>
          a) En appliquant deux règles de conservation nucléaire que vous énoncerez, identifier la particule X émise lors de la désintégration. En déduire si l'iridium 192 est radioémetteur α, β<sup>−</sup> ou β<sup>+</sup>.<br>
          b) Le nucléide ${L(nuc(192, 76, 'Os'))} possède de nombreux isotopes naturels. Qu'appelle-t-on isotopes ?</li>
        <li>3. Donner la définition de la période, ou demi-vie, radioactive.</li></ul>`,
    parties: () => [
      { type: 'grille', q: '1. Que représentent les nombres 192 et 77 ?', options: [o('nuc', 'nombre de nucléons'), o('p', 'nombre de protons'), o('n', 'nombre de neutrons')],
        lignes: [{ id: 'a', label: '192', bonne: 'nuc', indice: 'Le nombre du haut, A, compte tous les nucléons.' }, { id: 'z', label: '77', bonne: 'p', indice: 'Le nombre du bas, Z, est le nombre de protons.' }],
        correction: `<p>192 = A, le ${c('nombre de nucléons')} (protons + neutrons) ; 77 = Z, le ${c('nombre de protons')}. Le noyau a 192 − 77 = 115 neutrons.</p>` },
      partieEquation({ g: [n(192, 77)], d: [Object.assign(n(0, 1, 'e'), { inc: 'AZs' }), n(192, 76), 'γ'] }, { q: '2. a) Trouve a et b par conservation, puis la particule X.',
        correction: `${CONSERVATION}${calc('A : 192 = a + 192, donc a = 0 ; Z : 77 = b + 76, donc b = 1')}<p>X = ${L(nuc(0, 1, 'e'))} : c'est un ${c('positron (positon)')}.</p>` }),
      choix('2. a) L\'iridium 192 est donc radioémetteur :', TYPES, 'plus', '<p>Un positron est émis : l\'iridium 192 est radioémetteur ' + c('β<sup>+</sup>') + ' (d\'après cette équation).</p>',
        { melanger: false, indices: IND_TYPES }),
      Object.assign({}, ISOTOPES, { q: '2. b) Qu\'appelle-t-on isotopes ?' }),
      Object.assign({}, DEF_DEMIVIE, { q: '3. Définition de la période, ou demi-vie, radioactive.' }),
    ],
  };

  /* ---------- Exercice 18 : radio-immuno-scintigraphie (technétium 99m) ---------- */
  const TcEx = n(99, 43, 'Tc*');
  const compo = (q, A, Z, nom) => ({ type: 'gabarit', q, morceaux: ['protons :', { v: Z }, ' neutrons :', { v: A - Z }],
    diag: v => (v[1] === A ? 'Neutrons = A − Z.' : v[0] === A ? 'Le nombre de protons est Z.' : 'Protons : Z ; neutrons : A − Z.'),
    correction: `<p>${nom} : ${Z} protons et ${A} − ${Z} = ${A - Z} neutrons.</p>` });
  const ex18 = {
    id: '18', groupe: 'applications', titre: 'Exercice 18 : radio-immuno-scintigraphie', desc: 'Molybdène 99 → technétium 99m → technétium 99 : équations, types, compositions',
    contexte: `<p class="er-contexte">La scintigraphie est un outil puissant d'imagerie médicale car elle permet de fournir des informations anatomiques mais également fonctionnelles. La radio-immuno-scintigraphie consiste à marquer par un isotope radioactif un anticorps ayant une spécificité pour un tissu particulier.</p>
      <p class="er-contexte">Le technétium 99 métastable <sup>99m</sup><sub>43</sub>Tc (encore noté ${L(nuc(99, 43, 'Tc*'))}) est le radionucléide le plus utilisé (80 % des examens de diagnostic) du fait de son émission γ bien adaptée au matériel de détection par gamma caméra, sa période radioactive courte (T = 6 h), sa faible radiotoxicité et son faible coût d'exploitation.</p>
      <p class="er-contexte">Le technétium 99 métastable est fabriqué par un générateur au molybdène 99 : ${L(nuc(99, 42, 'Mo'))}.</p>
      <ul class="er-liste"><li>a) Écrire la réaction de désintégration du molybdène 99 en technétium 99 métastable, puis celle du technétium 99 métastable en technétium 99.</li>
        <li>b) Quelles sont les natures de ces radioactivités ?</li>
        <li>c) Quelles sont les compositions (nombre de protons et nombre de neutrons) des trois noyaux mis en jeu dans les réactions précédentes : molybdène 99, technétium 99 métastable et technétium 99 ?</li></ul>`,
    parties: () => [
      partieEquation({ g: [n(99, 42)], d: [TcEx, Object.assign(n(0, -1, 'e'), { inc: 'AZs' })] }, { q: 'a) Molybdène 99 → technétium 99 métastable : trouve la particule émise.',
        correction: `${calc(L(equation([n(99, 42)], [TcEx, n(0, -1, 'e')])))}<p>A : 99 = 99 + 0 ; Z : 42 = 43 + (${M}1) : un électron est émis.</p>` }),
      partieEquation({ g: [TcEx], d: [Object.assign(n(99, 43), { inc: 'AZ' }), 'γ'] }, { q: 'a) Technétium 99 métastable → technétium 99 : complète A et Z du technétium 99.',
        correction: `${calc(L(equation([TcEx], [n(99, 43), 'γ'])))}<p>Le noyau excité se désexcite en émettant un rayonnement γ : A et Z ne changent pas.</p>` }),
      { type: 'grille', q: 'b) Nature de ces radioactivités.', options: [o('alpha', 'α'), o('moins', 'β<sup>−</sup>'), o('plus', 'β<sup>+</sup>'), o('g', 'émission γ')],
        lignes: [{ id: 'mo', label: 'Mo 99 → Tc 99m', bonne: 'moins', indice: 'Un électron est émis.' }, { id: 'tc', label: 'Tc 99m → Tc 99', bonne: 'g', indice: 'Aucune particule n\'est émise : seulement un rayonnement.' }],
        correction: `<p>Molybdène 99 : radioactivité ${c('β<sup>−</sup>')} (électron émis). Technétium 99 métastable : ${c('émission γ')} (désexcitation du noyau, Y* → Y + γ).</p>` },
      compo('c) Composition du molybdène 99, ' + L(nuc(99, 42, 'Mo')) + '.', 99, 42, 'Molybdène 99'),
      compo('c) Composition du technétium 99 métastable, ' + L(nuc(99, 43, 'Tc*')) + '.', 99, 43, 'Technétium 99 métastable'),
      compo('c) Composition du technétium 99, ' + L(nuc(99, 43, 'Tc')) + '.', 99, 43, 'Technétium 99 : la même composition, le noyau n\'est simplement plus excité'),
    ],
  };

  /* ---------- Exercice 19 : les déchets radioactifs (césium 135, plutonium 241) ---------- */
  const PTS_PU = []; for (let t = 2; t <= 54; t += 2) PTS_PU.push([t, 3 * Math.pow(2, -t / 14)]);
  const PU = { f: decroit(3, 14), y0: 3, sym: 'm', grilleFine: true, points: PTS_PU,
    x: { max: 56, pas: 7, fin: 1, titre: 'T (ans)' }, y: { max: 3, pas: .5, fin: .25, grille: .25, titre: 'Masse (mg)' } };
  const ex19 = {
    id: '19', groupe: 'applications', titre: 'Exercice 19 : les déchets radioactifs', desc: 'Césium 135 et plutonium 241 : compositions, isotopes, équation, demi-vie sur la courbe',
    contexte: `<p class="er-contexte">Les déchets radioactifs provenant du combustible des centrales nucléaires contiennent de nombreuses substances radioactives. Le tableau suivant indique les caractéristiques de deux nucléides pouvant être présents parmi ces déchets : le césium 135 et le plutonium 241.</p>
      <div class="rad-defile"><table class="rad-tab rad-lisible"><tr><th>Nucléide</th><td>${nuc(135, 55, 'Cs')}</td><td>${nuc(241, 94, 'Pu')}</td></tr><tr><th>Type de radioactivité</th><td>β<sup>−</sup></td><td>β<sup>−</sup></td></tr></table></div>
      <ul class="er-liste"><li>a) Déterminer le nombre de protons et de neutrons de chaque nucléide.</li><li>b) Les nucléides césium 135 et plutonium 241 sont-ils isotopes ? Justifier.</li>
        <li>c) Quelle est la particule émise au cours d'une désintégration de type β<sup>−</sup> ?</li><li>d) Rappeler les lois de conservation utilisées pour écrire les équations de désintégration.</li>
        <li>e) Compléter l'équation de la désintégration nucléaire suivante : ${L(equation([n(241, 94)], [n('…', '…', 'X'), n(0, -1, 'e')]))}.</li>
        <li>f) Identifier X parmi les symboles des nucléides suivants : <sub>92</sub>U, <sub>93</sub>Np et <sub>95</sub>Am.</li>
        <li>g) Donner la définition de la période t<sub>1/2</sub> ou demi-vie d'un nucléide radioactif.</li>
        <li>h) À partir du graphique ci-dessous, vérifier que la valeur de la période T, ou demi-vie, du plutonium 241 est T = 14 ans.</li>
        <li>i) Le césium 135 a une demi-vie de 2,3 millions d'années. Représenter sur la courbe précédente l'évolution de la masse de césium 135 au cours du temps, sachant qu'à t = 0 la masse présente est de 2,0 mg.</li></ul>
      ${figCourbe(PU, 'Masse de plutonium 241 restante en fonction du temps : 3,0 mg au départ')}
      <p class="ph-donnees" style="text-align:center">Masse de plutonium 241 restante en fonction du temps (le manuel écrit « désintégrée »)</p>`,
    parties: () => [
      { type: 'gabarit', q: 'a) Nombres de protons et de neutrons.', morceaux: ['Cs 135 : protons', { v: 55 }, ' neutrons', { v: 80 }, ' ; Pu 241 : protons', { v: 94 }, ' neutrons', { v: 147 }],
        diag: v => (v[1] === 135 || v[3] === 241 ? 'Neutrons = A − Z.' : v[0] === 135 || v[2] === 241 ? 'Le nombre de protons est Z.' : 'Protons : Z ; neutrons : A − Z.'),
        correction: `<p>Césium 135 : ${c('55 protons')} et 135 − 55 = ${c('80 neutrons')}. Plutonium 241 : ${c('94 protons')} et 241 − 94 = ${c('147 neutrons')}.</p>` },
      choix('b) Le césium 135 et le plutonium 241 sont-ils isotopes ?', [o('non', 'Non : ils n\'ont pas le même nombre de protons Z'), o('oui', 'Oui : ils sont tous les deux radioactifs β<sup>−</sup>'), o('nonA', 'Non : ils n\'ont pas le même A')], 'non',
        '<p>Non : Z = 55 pour le césium, Z = 94 pour le plutonium. Des isotopes ont le même Z (le même élément).</p>',
        { indices: { oui: 'Le type de radioactivité ne dit rien : des isotopes ont le même Z.', nonA: 'Des isotopes ont justement des A différents : c\'est Z qu\'il faut comparer.' } }),
      choix('c) Quelle est la particule émise au cours d\'une désintégration β<sup>−</sup> ?', [o('e', `un électron ${L(nuc(0, -1, 'e'))}`), o('p', `un positron ${L(nuc(0, 1, 'e'))}`), o('he', `un noyau d'hélium ${L(nuc(4, 2, 'He'))}`)], 'e',
        `<p>Un ${c('électron')} ${L(nuc(0, -1, 'e'))}.</p>`, { indices: { p: 'Le positron est la particule β<sup>+</sup>.', he: 'Le noyau d\'hélium est la particule α.' } }),
      choix('d) Quelles lois de conservation utilise-t-on ?', [o('ok', 'conservation du nombre de nucléons A et du nombre de charge Z'), o('m', 'conservation de la masse'), o('n', 'conservation du nombre de neutrons')], 'ok',
        CONSERVATION, { indices: { m: 'On compte les nucléons et les charges, pas les masses.', n: 'Le nombre de neutrons change souvent (un neutron peut devenir un proton) : ce sont A et Z qui se conservent.' } }),
      partieEquation({ g: [n(241, 94)], d: [Object.assign(n(241, 95, 'X'), { inc: 'AZ' }), n(0, -1, 'e')] }, { q: 'e) Complète l\'équation : A et Z du noyau X.',
        correction: `${calc('A : 241 = A + 0, donc A = 241 ; Z : 94 = Z − 1, donc Z = 95')}${calc(L(equation([n(241, 94)], [n(241, 95, 'X'), n(0, -1, 'e')])))}` }),
      choix('f) Identifie X parmi <sub>92</sub>U, <sub>93</sub>Np et <sub>95</sub>Am.', [o('u', '<sub>92</sub>U'), o('np', '<sub>93</sub>Np'), o('am', '<sub>95</sub>Am')], 'am',
        `<p>Z = 95 : X est l'américium, ${c(L(nuc(241, 95, 'Am')))}.</p>`, { melanger: false, indices: { u: 'Z = 92 : relis le Z trouvé à la question e).', np: 'Z = 93 : l\'électron compte pour −1, donc Z = 94 + 1.' } }),
      Object.assign({}, DEF_DEMIVIE, { q: 'g) Définition de la période t<sub>1/2</sub>, ou demi-vie.' }),
      partieLecture(Object.assign({}, PU, { rep: { label: 'T =', unite: 'ans', tol: 1 } }), { q: 'h) Vérifie sur la courbe que T = 14 ans.',
        correction: `<p>m<sub>0</sub> = 3,0 mg ; m<sub>0</sub>/2 = 1,5 mg ; on lit ${c('T = 14 ans')} : la valeur est vérifiée.</p>` }),
      choix('i) Sur ce graphique (0 à 56 ans), à quoi ressemble la courbe de la masse de césium 135 (2,0 mg à t = 0) ?', [o('ok', 'Une droite quasi horizontale à 2,0 mg'), o('pu', 'Une courbe qui atteint 1,0 mg au bout de 14 ans'), o('zero', 'Une courbe qui tombe à 0 mg avant 56 ans')], 'ok',
        `<p>56 ans, c'est très peu devant 2,3 millions d'années : la masse de césium 135 ne diminue presque pas (2,0 × 2<sup>−56 / 2 300 000</sup> ≈ 2,0 mg). Sa courbe est quasi horizontale.</p>${figCourbe(Object.assign({}, PU, { points: [], courbes: [{ f: () => 2, txt: 'césium 135', tx: 42 }] }), 'Masse de plutonium 241 et de césium 135 (droite horizontale à 2,0 mg)')}`,
        { indices: { pu: 'La demi-vie du césium 135 n\'est pas 14 ans : elle est de 2,3 millions d\'années.', zero: 'Il faudrait des dizaines de millions d\'années : compare 56 ans à sa demi-vie.' } }),
    ],
  };

  window.RAD.GROUPES_EX = [
    { id: 'noyau', titre: 'Noyaux et équations' },
    { id: 'activite', titre: 'Activité et loi de décroissance' },
    { id: 'demivie', titre: 'Demi-vie et datation' },
    { id: 'applications', titre: 'Applications technologiques (exercices supplémentaires)' },
  ];
  window.RAD.EXERCICES = [ex7, ex1, ex2, ex10, ex11, ex6, ex16, exBac, ex17, ex18, ex19];
})();
