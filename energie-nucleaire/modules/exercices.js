/* ============================================================
   Exercices du module 4 (application « Chapitre 13 : Énergie
   nucléaire ») : les exercices 1 à 7 de la feuille, dans l'ordre et
   avec leur numérotation.

   Chaque exercice : { id, groupe, titre, desc, contexte (HTML),
   parties: fonction qui les fabrique } ; chaque partie suit le format
   de NUC.PARTIES avec p.q (question) et p.correction (correction
   détaillée : formule, grandeur isolée, application numérique avec les
   unités). Outils propres : NUC.partieReaction (équation à compléter,
   plus grand nombre de nucléons, fission / fusion / radioactivité),
   NUC.partieDefaut (tableau du défaut de masse).

   Valeurs vérifiées par un script :
     ex. 1 : a) x = 2, Z = 53, fission ; b) A = 231, Z = 90, α ; c) Z = 1 (H), x = 1, fusion ;
       d) A = 131, Z = 52, β⁺ ; e) Z = 53 (I), A = 124, β⁻ ;
     ex. 2 : Δm = −3,20744 × 10⁻²⁸ kg ; E = 2,8827 × 10⁻¹¹ J ;
     ex. 3 : Δm = −9,6 × 10⁻³⁰ kg ; E = 8,64 × 10⁻¹³ J = 5,39 MeV ; N = 9,99 × 10²³ ;
       E = 8,63 × 10¹¹ J ; m = 2,05 × 10⁴ kg ;
     ex. 4 : Z = 54, x = 2 ; Δm = −0,19825 u = −3,29202 × 10⁻²⁸ kg ; Q = 2,95872 × 10⁻¹¹ J = 184,7 MeV ;
       m(noyau) = 3,90216 × 10⁻²⁵ kg ; N = 1,28 × 10²² ; E = 3,79 × 10¹¹ J ; m = 9,03 × 10³ kg ;
     ex. 5 : neutron ; Δm = −3,1500 × 10⁻²⁹ kg ; E = 2,8311 × 10⁻¹² J = 17,67 MeV ; N = 1,50 × 10²⁴ ;
       E = 2,64 × 10²⁵ MeV = 4,23 × 10¹² J ;
     ex. 7 : Δm = −9,809 × 10⁻³⁰ kg ; E = 8,828 × 10⁻¹³ J ; 4,98 × 10¹⁵ désintégrations par seconde, A₀ = 4,98 × 10¹⁵ Bq.
   Écarts avec la correction manuscrite :
     ex. 4 d) e) f) : la correction trouve N = 1,28 × 10²⁵ (division fausse), puis 3,79 × 10¹⁴ J et
       9 000 t : les bonnes valeurs sont 1,28 × 10²², 3,79 × 10¹¹ J et 9,0 × 10³ kg ≈ 9 t ;
     ex. 5 : l'énoncé écrit « c = 299 792 458.10⁸ m·s⁻¹ » : c'est 299 792 458 m·s⁻¹ ;
       g) la correction arrondit N à 1,5 × 10²⁴ et trouve 2,7 × 10²⁵ MeV ; avec N non arrondi, 2,6 × 10²⁵ MeV
       (les deux sont acceptées).
   ============================================================ */
(function () {
  'use strict';

  const { o, fmt, noyau, esp, neutron, electron, positron, helium, trou, equation, lisible, masse, partieReaction, partieDefaut, redaction, analyse, explication,
    egal, diagE, diagMeV, diagKg, diagN, diagEtot, diagPetrole, diagActivite, C, C_EXACT, MEV, EV, U_KG, PC, fleche, txt, svgFig } = window.NUC;
  const L = lisible;
  const calc = h => `<p class="ph-calc">${h}</p>`;
  const c = h => `<span class="c">${h}</span>`;
  const n = () => neutron();
  const ligne = (x, m) => ({ x, m: masse(m) });
  // fabriques de parties
  const choix = (q, options, bonne, correction, opts) => Object.assign({ type: 'choix', q, options, bonne, correction, colonne: options.some(x => x.label.replace(/<[^>]+>/g, '').length > 24) }, opts);
  const nombre = (q, label, valeur, unite, correction, opts) => Object.assign({ type: 'nombre', q, label, valeur, unite, correction, signe: false, rel: .01 }, opts);
  const scient = (q, label, valeur, unite, correction, opts) => Object.assign({ type: 'sci', q, label, valeur, unite, correction, cs: 3, rel: .01 }, opts);
  const donnees = l => `<p class="ph-donnees">Données : ${l.join(' ; ')}.</p>`;
  const eq = (g, d) => `<p class="ph-calc">${L(equation(g, d))}</p>`;
  const X = (A, Z, s) => esp(A, Z, s);          // noyau écrit avec des lettres (énoncé)

  /* ---------- Exercice 1 : compléter et classer ---------- */
  const EX1 = {
    a: { g: [esp(235, 92), n()], d: [esp(94, 39), trou(esp(140, 53), 'Z'), trou(neutron(2), 'k')] },
    b: { g: [esp(235, 92)], d: [helium(), trou(esp(231, 90), 'AZ')] },
    c: { g: [esp(2, 1), trou(esp(3, 1), 'Zs')], d: [helium(), trou(neutron(1), 'k')] },
    d: { g: [esp(131, 53)], d: [positron(), trou(esp(131, 52), 'AZ')] },
    e: { g: [trou(esp(124, 53), 'Zs')], d: [electron(), trou(esp(124, 54), 'A')] },
  };
  // l'équation de l'énoncé, avec des lettres à la place des inconnues
  const lettres = l => l.map(x => {
    const inc = x.inc || '';
    return esp(inc.includes('A') ? 'A' : x.A, inc.includes('Z') ? 'Z' : x.Z, inc.includes('s') ? 'X' : x.s, inc.includes('k') ? 'x' : x.k);
  });
  const ex1 = {
    id: '1', groupe: 'reactions', titre: 'Exercice 1 : compléter et classer des réactions', desc: 'A, Z, x et l\'élément par conservation ; fission, fusion ou radioactivité α, β<sup>+</sup>, β<sup>−</sup>',
    contexte: `<p class="er-contexte">1. Compléter les réactions nucléaires suivantes en justifiant les calculs et en précisant la nature des transformations (fission, fusion, radioactivité α, β<sup>+</sup>, β<sup>−</sup>) en justifiant.</p>
      ${['a', 'b', 'c', 'd', 'e'].map(k => `<p class="ph-calc">${k}) ${L(equation(lettres(EX1[k].g), lettres(EX1[k].d)))}</p>`).join('')}
      ${donnees(['numéro atomique de l\'iode I : 53'])}
      <p class="er-contexte" style="margin-top:8px">2. Quel est le nom de la particule dont le symbole est ${L(noyau(1, 0, 'n'))} ? Expliquer cette notation.</p>`,
    parties: () => {
      const r = (k, q, plus) => {
        const def = Object.assign({ reperer: true, classer: true }, EX1[k]);
        return partieReaction(def, { q, correction: `${redaction(def.g, def.d)}<p>${explication(analyse(def.g, def.d))}${plus || ''}</p>` });
      };
      return [
        r('a', 'a) Trouve Z et x par conservation (Valider), repère le plus grand nombre de nucléons, puis classe la réaction.'),
        r('b', 'b) Trouve A et Z, puis classe la réaction.'),
        r('c', 'c) Trouve Z, l\'élément X et x, puis classe la réaction.', ' Ce n\'est pas une radioactivité α : il y a deux noyaux à gauche.'),
        r('d', 'd) Trouve A et Z, puis classe la réaction.'),
        r('e', 'e) Trouve Z, l\'élément X et A, puis classe la réaction.'),
        choix(`2. Quel est le nom de la particule ${L(noyau(1, 0, 'n'))} ?`, [o('n', 'un neutron'), o('p', 'un proton'), o('e', 'un électron')], 'n',
          `<p>C'est un ${c('neutron')}.</p>`, { melanger: false, indices: { p: 'Z = 0 : la particule n\'a aucun proton.', e: 'L\'électron s\'écrit ⁰₋₁e : ici A = 1.' } }),
        { type: 'gabarit', q: '2. Explique la notation : protons, nucléons et neutrons.', morceaux: ['protons :', { v: 0 }, ' nucléons :', { v: 1 }, ' neutrons :', { v: 1 }],
          diag: v => (v[0] === 1 ? 'Le nombre de protons est Z, en bas : 0.' : v[2] !== 1 ? 'Neutrons = A − Z = 1 − 0.' : 'Nucléons : A, en haut.'),
          correction: `<p>${L(noyau(1, 0, 'n'))} : Z = 0, donc ${c('0 proton')} ; A = 1, donc ${c('1 nucléon')} ; 1 − 0 = ${c('1 neutron')}. C'est un neutron.</p>` },
      ];
    },
  };

  /* ---------- Exercice 2 : défaut de masse d'une fission ---------- */
  const R2 = { g: [ligne(esp(235, 92), '3,902170e-25'), ligne(n(), '1,674928e-27')], d: [ligne(esp(94, 38), '1,559155e-25'), ligne(esp(139, 54), '2,306309e-25'), ligne(neutron(3), '1,674928e-27')] };
  const DM2 = 1.559155e-25 + 2.306309e-25 + 2 * 1.674928e-27 - 3.902170e-25;
  const ex2 = {
    id: '2', groupe: 'energie', titre: 'Exercice 2 : défaut de masse d\'une fission', desc: 'Δm avec le tableau, neutrons des deux côtés, énergie libérée en joules',
    contexte: `<p class="er-contexte">Soit la réaction nucléaire suivante :</p>${eq(R2.g.map(l => l.x), R2.d.map(l => l.x))}
      <ul class="er-liste"><li>1. Déterminer le défaut de masse.</li><li>2. En déduire l'énergie libérée par la réaction en J.</li></ul>
      ${donnees(['m(²³⁵₉₂U) = 3,902170 × 10<sup>−25</sup> kg', 'm(¹³⁹₅₄Xe) = 2,306309 × 10<sup>−25</sup> kg', 'm(⁹⁴₃₈Sr) = 1,559155 × 10<sup>−25</sup> kg', 'm(¹₀n) = 1,674928 × 10<sup>−27</sup> kg', 'c = 299 792 458 m·s<sup>−1</sup>'])}`,
    parties: () => [
      partieDefaut(R2, { q: '1. Le défaut de masse : coefficients (Valider), neutrons à simplifier, puis Δm.',
        correction: `${calc('Δm = m<sub>produits</sub> − m<sub>réactifs</sub>')}${calc('Δm = m(Sr) + m(Xe) + 3 × m(n) − m(U) − m(n) = m(Sr) + m(Xe) + 2 × m(n) − m(U)')}
          ${calc(`Δm = 1,559155 × 10<sup>−25</sup> + 2,306309 × 10<sup>−25</sup> + 2 × 1,674928 × 10<sup>−27</sup> − 3,902170 × 10<sup>−25</sup> = ${c('−3,20744 × 10<sup>−28</sup> kg')}`)}` }),
      scient('2. L\'énergie libérée par la réaction en joules.', 'E =', Math.abs(DM2) * C_EXACT * C_EXACT, 'J',
        `${calc('E = |Δm| × c²')}${calc(`E = 3,20744 × 10<sup>−28</sup> kg × (299 792 458 m·s<sup>−1</sup>)² = ${c('2,88 × 10<sup>−11</sup> J')}`)}`, { diag: v => diagE(v, DM2, C_EXACT) }),
    ],
  };

  /* ---------- Exercice 3 : fusion dans le Soleil (type bac) ---------- */
  const R3 = { g: [ligne(esp(1, 1), '1,6726e-27'), ligne(esp(2, 1), '3,3434e-27')], d: [ligne(esp(3, 2), '5,0064e-27')] };
  const DM3 = 5.0064e-27 - 1.6726e-27 - 3.3434e-27, E3 = Math.abs(DM3) * C * C, N3 = 5.00e-3 / 5.0064e-27;
  const ex3 = {
    id: '3', groupe: 'energie', titre: 'Exercice 3 : une fusion dans le Soleil (type bac)', desc: 'Fusion, défaut de masse, énergie en J et en MeV, 5,00 g d\'hélium 3, masse de pétrole',
    contexte: `<p class="er-contexte"><b>Très important : type bac.</b> L'une des réactions de fusion nucléaire à la base de l'énergie rayonnée par le Soleil est :</p>${eq(R3.g.map(l => l.x), R3.d.map(l => l.x))}
      <ul class="er-liste"><li>1. De quel type de réaction nucléaire s'agit-il ? Justifier.</li><li>2. Calculer la perte de masse de cette réaction nucléaire.</li>
        <li>3. Calculer, en joule puis en MeV, la quantité d'énergie libérée au cours de cette réaction nucléaire.</li>
        <li>4. Calculer en joule la quantité d'énergie libérée lors de la formation de 5,00 g d'hélium 3.</li>
        <li>5. Calculer la masse de pétrole libérant, par combustion, la même énergie.</li></ul>
      ${donnees(['m(¹₁H) = 1,6726 × 10<sup>−27</sup> kg', 'm(²₁H) = 3,3434 × 10<sup>−27</sup> kg', 'm(³₂He) = 5,0064 × 10<sup>−27</sup> kg', 'c = 3,00 × 10<sup>8</sup> m·s<sup>−1</sup>', '1 eV = 1,602177 × 10<sup>−19</sup> J', 'pouvoir calorifique du pétrole : 42 MJ·kg<sup>−1</sup> (c\'est l\'énergie libérable par la combustion d\'un kilogramme de pétrole)'])}`,
    parties: () => [
      partieReaction({ g: R3.g.map(l => l.x), d: R3.d.map(l => l.x), reperer: true, classer: true }, { q: '1. Repère le plus grand nombre de nucléons, puis donne le type de réaction.',
        correction: `<p>C'est une ${c('fusion')} car le noyau le plus lourd est à droite (³₂He, 3 nucléons) : deux noyaux fusionnent en un plus gros.</p>` }),
      partieDefaut(R3, { q: '2. La perte de masse : coefficients (Valider), puis Δm.',
        correction: `${calc('Δm = m(³₂He) − m(¹₁H) − m(²₁H)')}${calc(`Δm = 5,0064 × 10<sup>−27</sup> − 1,6726 × 10<sup>−27</sup> − 3,3434 × 10<sup>−27</sup> = ${c('−9,6 × 10<sup>−30</sup> kg')}`)}` }),
      scient('3. L\'énergie libérée, en joules.', 'E =', E3, 'J', `${calc('E = |Δm| × c²')}${calc(`E = 9,6 × 10<sup>−30</sup> kg × (3,00 × 10<sup>8</sup> m·s<sup>−1</sup>)² = ${c('8,64 × 10<sup>−13</sup> J')}`)}`, { diag: v => diagE(v, DM3, C) }),
      nombre('3. La même énergie en MeV (3 chiffres significatifs).', 'E =', E3 / EV / 1e6, 'MeV',
        `${calc(`E = 8,64 × 10<sup>−13</sup> / 1,602177 × 10<sup>−19</sup> = 5,39 × 10<sup>6</sup> eV`)}${calc(`E = ${c('5,39 MeV')} (1 MeV = 10<sup>6</sup> eV)`)}`, { cs: 3, rel: .006, diag: v => diagMeV(v, E3) }),
      scient('4. a) Le nombre de noyaux d\'hélium 3 dans 5,00 g.', 'N =', N3, 'noyaux',
        `<p>E est l'énergie libérée lors de la formation d'<b>un</b> noyau d'hélium : il faut compter les noyaux d'hélium dans 5,00 g.</p>
          ${calc(`N = m / m(1 noyau) = 5,00 × 10<sup>−3</sup> kg / 5,0064 × 10<sup>−27</sup> kg = ${c('9,99 × 10<sup>23</sup> noyaux')}`)}
          <p><span class="nuc-ou">OU</span></p><div class="ph-defile"><table class="ph-tableau"><thead><tr><th>N (noyaux)</th><th>m (kg)</th></tr></thead><tbody><tr><td>1</td><td>5,0064 × 10<sup>−27</sup></td></tr><tr><td>N</td><td>5 g = 5 × 10<sup>−3</sup> kg</td></tr></tbody></table></div>`,
        { diag: v => diagN(v, 5, 5.0064e-27, '5,00 g') }),
      scient('4. b) L\'énergie libérée lors de la formation de 5,00 g d\'hélium 3.', 'E =', N3 * E3, 'J',
        calc(`E<sub>5 g</sub> = N × E = 9,99 × 10<sup>23</sup> × 8,64 × 10<sup>−13</sup> J = ${c('8,63 × 10<sup>11</sup> J')}`), { diag: v => diagEtot(v, N3, E3) }),
      nombre('5. La masse de pétrole qui libère la même énergie.', 'm =', N3 * E3 / PC, 'kg',
        `<div class="ph-defile"><table class="ph-tableau"><thead><tr><th>m (kg)</th><th>E (J)</th></tr></thead><tbody><tr><td>1</td><td>42 MJ = 42 × 10<sup>6</sup> J</td></tr><tr><td>m</td><td>8,63 × 10<sup>11</sup></td></tr></tbody></table></div>
          ${calc(`m<sub>pétrole</sub> = 1 × 8,63 × 10<sup>11</sup> / 42 × 10<sup>6</sup> = ${c('2,05 × 10<sup>4</sup> kg')}`)}<p>Soit 20,5 tonnes de pétrole !</p>`,
        { cs: 3, diag: v => diagPetrole(v, N3 * E3) }),
    ],
  };

  /* ---------- Exercice 4 : fission dans une centrale (masses en u) ---------- */
  const R4u = { g: [ligne(esp(235, 92), '234,99332'), ligne(n(), '1,00867')], d: [ligne(esp(94, 38), '93,89446'), ligne(esp(140, 54), '139,89194'), ligne(neutron(2), '1,00867')], unite: 'u' };
  const DMU4 = 93.89446 + 139.89194 + 2 * 1.00867 - 234.99332 - 1.00867, DM4 = DMU4 * U_KG, Q4 = Math.abs(DM4) * C_EXACT * C_EXACT;
  const MU4 = 234.99332 * U_KG, N4 = 5.00e-3 / MU4;
  const ex4 = {
    id: '4', groupe: 'energie', titre: 'Exercice 4 : fission dans une centrale', desc: 'Z et x, défaut de masse en u puis en kg, Q en J et en MeV, 5,00 g d\'uranium, masse de pétrole',
    contexte: `<p class="er-contexte">Dans une centrale nucléaire, une des réactions est la suivante :</p>
      ${eq([esp(235, 92), n()], [esp(94, 38), esp(140, 'Z', 'Xe'), esp(1, 0, 'n', 'x')])}
      <ul class="er-liste"><li>a) Déterminer, en les justifiant, les valeurs de Z et de x.</li><li>b) Calculer la perte de masse en u, puis en kg.</li>
        <li>c) Calculer, en joule puis en MeV, l'énergie libérée Q par la fission d'un noyau d'uranium 235.</li>
        <li>d) Déterminer le nombre de noyaux d'uranium présents dans un échantillon de 5,00 g d'uranium 235.</li>
        <li>e) Calculer l'énergie libérée par la fission de 5,00 g d'uranium 235.</li><li>f) Calculer la masse de pétrole libérant, par combustion, la même énergie.</li></ul>
      ${donnees(['masses des noyaux : ²³⁵U : 234,99332 u ; ⁹⁴Sr : 93,89446 u ; ¹⁴⁰Xe : 139,89194 u', 'masse d\'un neutron : 1,00867 u', 'pouvoir calorifique du pétrole : 42 MJ·kg<sup>−1</sup>', 'c = 299 792 458 m·s<sup>−1</sup>', '1 u = 1,660539 × 10<sup>−27</sup> kg', '1 eV = 1,602177 × 10<sup>−19</sup> J'])}
      <p class="ph-donnees">Une unité de masse atomique (notée u) correspond à la masse d'un atome de carbone 12 divisée par 12 (la masse d'un nucléon est à peu près égale à 1 u).</p>`,
    parties: () => [
      partieReaction({ g: [esp(235, 92), n()], d: [esp(94, 38), trou(esp(140, 54), 'Z'), trou(neutron(2), 'k')] }, { q: 'a) Trouve Z et x par conservation.',
        correction: `${calc('A : 235 + 1 = 94 + 140 + x × 1, donc 236 = 234 + x et x = <span class="c">2</span>')}${calc('Z : 92 + 0 = 38 + Z, donc Z = <span class="c">54</span>')}` }),
      partieDefaut(R4u, { q: 'b) La perte de masse en u : coefficients (Valider), somme de chaque colonne (Valider), puis Δm.',
        correction: `${calc('Δm = m(Sr) + m(Xe) + 2 × m(n) − m(U) − m(n) = m(Sr) + m(Xe) + m(n) − m(U)')}${calc(`Δm = 93,89446 u + 139,89194 u + 1,00867 u − 234,99332 u = ${c('−0,19825 u')}`)}` }),
      scient('b) La perte de masse en kg.', 'Δm =', DM4, 'kg', calc(`Δm = −0,19825 × 1,660539 × 10<sup>−27</sup> kg = ${c('−3,29202 × 10<sup>−28</sup> kg')}`), { cs: 4, rel: .005, diag: v => diagKg(v, DMU4) }),
      scient('c) L\'énergie libérée Q, en joules.', 'Q =', Q4, 'J', `${calc('Q = |Δm| × c²')}${calc(`Q = 3,29202 × 10<sup>−28</sup> kg × (299 792 458 m·s<sup>−1</sup>)² = ${c('2,95872 × 10<sup>−11</sup> J')}`)}`, { cs: 4, diag: v => diagE(v, DM4, C_EXACT) }),
      nombre('c) Q en MeV (4 chiffres significatifs).', 'Q =', Q4 / EV / 1e6, 'MeV',
        `${calc('Q = 2,95872 × 10<sup>−11</sup> / 1,602177 × 10<sup>−19</sup> = 1,84669 × 10<sup>8</sup> eV')}${calc(`Q = ${c('184,7 MeV')} (1 MeV = 10<sup>6</sup> eV)`)}`, { cs: 4, rel: .005, diag: v => diagMeV(v, Q4) }),
      scient('d) Important (question posée au bac). La masse d\'un noyau d\'uranium 235, en kg.', 'm =', MU4, 'kg',
        calc(`m(noyau) = 234,99332 u = 234,99332 × 1,660539 × 10<sup>−27</sup> kg = ${c('3,90216 × 10<sup>−25</sup> kg')}`), { cs: 5, rel: .002, diag: v => diagKg(v, 234.99332) }),
      scient('d) Le nombre de noyaux d\'uranium dans 5,00 g.', 'N =', N4, 'noyaux',
        `${calc(`N = m / m(noyau) = 5,00 × 10<sup>−3</sup> kg / 3,90216 × 10<sup>−25</sup> kg = ${c('1,28 × 10<sup>22</sup> noyaux')}`)}
          <p>Attention : 5,00 g = 5,00 × 10<sup>−3</sup> kg. Les deux masses doivent être dans la même unité (ou 5,00 g / 3,90216 × 10<sup>−22</sup> g).</p>
          <p><b>Contrôle</b> : à l'exercice 3, 5 g d'hélium 3 contiennent environ 10<sup>24</sup> noyaux ; un noyau d'uranium 235 est environ 78 fois plus lourd qu'un noyau d'hélium 3 (235 / 3). On attend donc environ 10<sup>24</sup> / 78 ≈ 1,3 × 10<sup>22</sup> noyaux.</p>`,
        { diag: v => diagN(v, 5, MU4, '5,00 g') }),
      scient('e) L\'énergie libérée par la fission de 5,00 g d\'uranium 235.', 'E =', N4 * Q4, 'J',
        `<p>Un noyau libère 2,95872 × 10<sup>−11</sup> J, donc 1,28 × 10<sup>22</sup> noyaux libèrent :</p>${calc(`E = 1,28 × 10<sup>22</sup> × 2,95872 × 10<sup>−11</sup> J = ${c('3,79 × 10<sup>11</sup> J')}`)}`,
        { diag: v => (egal(v, N4 * Q4 * 1e3) ? 'Vérifie le nombre de noyaux de la question d) : 1,28 × 10<sup>22</sup>, pas 1,28 × 10<sup>25</sup> (5,00 g = 5,00 × 10<sup>−3</sup> kg).' : diagEtot(v, N4, Q4)) }),
      nombre('f) La masse de pétrole qui libère la même énergie.', 'm =', N4 * Q4 / PC, 'kg',
        `<p>1 kg de pétrole libère 42 MJ = 42 × 10<sup>6</sup> J. Pour libérer 3,79 × 10<sup>11</sup> J, il faut une masse de pétrole :</p>
          ${calc(`m = 3,79 × 10<sup>11</sup> / 42 × 10<sup>6</sup> = ${c('9,0 × 10<sup>3</sup> kg')}`)}<p>Soit environ 9 tonnes de pétrole, pour 5 g d'uranium !</p>`,
        { cs: 3, diag: v => (egal(v, N4 * Q4 / PC * 1e3) ? 'C\'est 1 000 fois trop : reprends l\'énergie de la question e), 3,79 × 10<sup>11</sup> J.' : diagPetrole(v, N4 * Q4)) }),
    ],
  };

  /* ---------- Exercice 5 : le projet ITER ---------- */
  const R5 = { g: [ligne(esp(2, 1), '3,3436e-27'), ligne(esp(3, 1), '5,0074e-27')], d: [ligne(helium(), '6,6446e-27'), ligne(n(), '1,6749e-27')] };
  const DM5 = 6.6446e-27 + 1.6749e-27 - 3.3436e-27 - 5.0074e-27, E5 = Math.abs(DM5) * C_EXACT * C_EXACT, M5 = E5 / EV / 1e6, N5 = 5.0e-3 / 3.3436e-27;
  // l'énoncé écrit « c = 299 792 458.10⁸ » : coquille
  const diagE5 = v => (egal(v, E5 * 1e16) ? 'L\'énoncé écrit « 299 792 458.10<sup>8</sup> » : c\'est une coquille, c = 299 792 458 m·s<sup>−1</sup> (environ 3,00 × 10<sup>8</sup>).' : diagE(v, DM5, C_EXACT));
  const ex5 = {
    id: '5', groupe: 'energie', titre: 'Exercice 5 : le projet ITER', desc: 'Particule formée, fusion, défaut de masse, énergie d\'une réaction puis de 5,0 g de deutérium',
    contexte: `<p class="er-contexte">Le projet ITER mettra en jeu la réaction suivante :</p>${eq([esp(2, 1), esp(3, 1)], [helium(), esp('A', 'Z', 'X')])}
      <ul class="er-liste"><li>a) Identifier la nature de la particule formée, ᴬ_Z X. Justifier.</li><li>b) Pourquoi ce n'est pas une réaction chimique ?</li><li>c) Quel est le type de réaction nucléaire ?</li>
        <li>d) Calculer la perte de masse au cours de la réaction.</li><li>e) En déduire l'énergie libérée par une réaction en joule, puis en MeV.</li>
        <li>f) Vérifier que le nombre de noyaux présents dans 5,0 g de noyaux de deutérium est de 1,5 × 10<sup>24</sup> noyaux.</li>
        <li>g) En déduire l'énergie, en MeV puis en joule, que l'on pourrait espérer obtenir si on réalisait la réaction de fusion de 5,0 g de noyaux de deutérium.</li></ul>
      ${donnees(['m(²₁H) = 3,3436 × 10<sup>−27</sup> kg', 'm(³₁H) = 5,0074 × 10<sup>−27</sup> kg', 'm(⁴₂He) = 6,6446 × 10<sup>−27</sup> kg', 'm(¹₀n) = 1,6749 × 10<sup>−27</sup> kg', 'c = 299 792 458 m·s<sup>−1</sup> (l\'énoncé écrit « 299 792 458.10<sup>8</sup> » : c\'est une coquille)', '1 eV = 1,602177 × 10<sup>−19</sup> J'])}`,
    parties: () => [
      partieReaction({ g: [esp(2, 1), esp(3, 1)], d: [helium(), trou(n(), 'AZs')] }, { q: 'a) Trouve A et Z par conservation (Valider), puis la particule.',
        correction: `${calc('A + 4 = 2 + 3, donc A = <span class="c">1</span>')}${calc('Z + 2 = 1 + 1, donc Z = <span class="c">0</span>')}<p>La particule émise est donc un ${c('neutron')} ${L(noyau(1, 0, 'n'))} (0 proton et 1 − 0 = 1 neutron).</p>` }),
      choix('b) Pourquoi ce n\'est pas une réaction chimique ?', [o('ok', 'les éléments ne sont pas conservés'), o('eq', 'A et Z ne sont pas conservés'), o('o2', 'il n\'y a pas de dioxygène')], 'ok',
        `<p>Ce n'est pas une réaction chimique car ${c('les éléments ne sont pas conservés')} (l'hydrogène devient de l'hélium).</p>`,
        { indices: { eq: 'A et Z sont conservés (question a). Compare les éléments à gauche et à droite.', o2: 'Ce n\'est pas la raison : compare les éléments à gauche et à droite.' } }),
      partieReaction({ g: [esp(2, 1), esp(3, 1)], d: [helium(), n()], reperer: true, classer: true }, { q: 'c) Le type de réaction nucléaire.',
        correction: `<p>C'est une ${c('fusion')} (formation d'un élément plus lourd : le plus grand nombre de nucléons, 4, est à droite).</p>` }),
      partieDefaut(R5, { q: 'd) La perte de masse : coefficients (Valider), puis Δm.',
        correction: `${calc('Δm = m(⁴₂He) + m(¹₀n) − m(²₁H) − m(³₁H)')}${calc(`Δm = 6,6446 × 10<sup>−27</sup> + 1,6749 × 10<sup>−27</sup> − 3,3436 × 10<sup>−27</sup> − 5,0074 × 10<sup>−27</sup> = ${c('−3,1500 × 10<sup>−29</sup> kg')}`)}` }),
      scient('e) L\'énergie libérée par une réaction, en joules.', 'E =', E5, 'J', `${calc('E = |Δm| × c²')}${calc(`E = 3,15 × 10<sup>−29</sup> kg × (299 792 458 m·s<sup>−1</sup>)² = ${c('2,8311 × 10<sup>−12</sup> J')}`)}`, { cs: 4, diag: diagE5 }),
      nombre('e) La même énergie en MeV (4 chiffres significatifs).', 'E =', M5, 'MeV',
        `${calc('E = 2,8311 × 10<sup>−12</sup> / 1,602177 × 10<sup>−19</sup> = 1,7670 × 10<sup>7</sup> eV')}${calc(`E = ${c('17,67 MeV')}`)}`, { cs: 4, rel: .005, diag: v => diagMeV(v, E5) }),
      scient('f) Vérifie le nombre de noyaux de deutérium dans 5,0 g.', 'N =', N5, 'noyaux',
        `${calc('m = 5,0 g = 5,0 × 10<sup>−3</sup> kg')}${calc(`N = 5,0 × 10<sup>−3</sup> / 3,3436 × 10<sup>−27</sup> = 1,4954 × 10<sup>24</sup> noyaux, soit ${c('1,5 × 10<sup>24</sup> noyaux')}`)}`,
        { cs: 2, diag: v => diagN(v, 5, 3.3436e-27, '5,0 g') }),
      scient('g) L\'énergie libérée par la fusion de 5,0 g de deutérium, en MeV.', 'E =', N5 * M5, 'MeV',
        `<p>E<sub>5,0 g</sub> = nombre de noyaux × énergie pour 1 noyau :</p>${calc(`E = 1,4954 × 10<sup>24</sup> × 17,670 MeV = ${c('2,6 × 10<sup>25</sup> MeV')}`)}<p>(2,7 × 10<sup>25</sup> MeV si on arrondit d'abord N à 1,5 × 10<sup>24</sup>.)</p>`,
        { cs: 2, rel: .03, diag: v => diagEtot(v, N5, M5) }),
      scient('g) La même énergie en joules.', 'E =', N5 * E5, 'J', calc(`E = 1,4954 × 10<sup>24</sup> × 2,8311 × 10<sup>−12</sup> J = ${c('4,2 × 10<sup>12</sup> J')}`),
        { cs: 2, rel: .02, diag: v => diagEtot(v, N5, E5) }),
    ],
  };

  /* ---------- Exercice 6 : la bombe H ---------- */
  // schéma de la bombe H : 1er étage (bombe A au plutonium), 2e étage (uranium 235 et hydrogène)
  function figBombe() {
    let s = '<rect x="72" y="6" width="66" height="22" rx="6" class="nuc-bombe-corps"/><rect x="40" y="22" width="130" height="246" rx="62" class="nuc-bombe-corps"/>';
    s += '<circle cx="105" cy="88" r="44" class="nuc-a-bombe"/>';
    for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; s += `<line x1="${(105 + 17 * Math.cos(a)).toFixed(1)}" y1="${(88 + 17 * Math.sin(a)).toFixed(1)}" x2="${(105 + 40 * Math.cos(a)).toFixed(1)}" y2="${(88 + 40 * Math.sin(a)).toFixed(1)}" class="nuc-rayon"/>`; }
    s += '<circle cx="105" cy="88" r="14" class="nuc-pu"/><circle cx="105" cy="88" r="5" class="nuc-neutron"/>';
    s += fleche(105, 136, 105, 168, 'accent');
    s += '<circle cx="105" cy="214" r="40" class="nuc-u235"/><circle cx="105" cy="214" r="24" class="nuc-h2"/><circle cx="105" cy="214" r="7" class="nuc-u235"/>';
    s += '<line x1="119" y1="88" x2="196" y2="98" class="nuc-repere"/><line x1="141" y1="198" x2="196" y2="204" class="nuc-repere"/><line x1="124" y1="226" x2="196" y2="228" class="nuc-repere"/>';
    s += txt(200, 54, '1er étage', 'nuc-fig-t2', 'start') + txt(200, 72, 'bombe de type A', 'nuc-fig-t', 'start') + txt(200, 102, 'plutonium', 'nuc-fig-t2', 'start');
    s += txt(200, 178, '2e étage', 'nuc-fig-t2', 'start') + txt(200, 208, 'uranium 235', 'nuc-fig-t2', 'start') + txt(200, 232, 'hydrogène', 'nuc-fig-t2', 'start');
    return `<div class="nuc-figure">${svgFig(330, 274, s, 'Schéma d\'une bombe H : au premier étage, une bombe de type A au plutonium ; au deuxième étage, de l\'uranium 235 et de l\'hydrogène')}</div>`;
  }
  const E6a = [[n(), esp(239, 94)], [esp(102, 42), esp(135, 52), neutron(3)]], E6b = [[n(), esp(235, 92)], [esp(90, 36), esp(142, 56), neutron(4)]];
  const FF = [o('fission', 'Fission'), o('fusion', 'Fusion')], ON = [o('oui', 'Oui'), o('non', 'Non')];
  const ex6 = {
    id: '6', groupe: 'applications', titre: 'Exercice 6 : la bombe H', desc: 'Les réactions des deux étages et de la phase finale : fission ou fusion ?',
    contexte: `<p class="er-contexte">Dans les bombes atomiques, les réactions en chaîne qui libèrent l'énergie nucléaire sont amplifiées, contrairement à celles dans les centrales nucléaires qui sont stabilisées. Actuellement, il existe deux types de bombes atomiques : la bombe A (utilisée à Hiroshima et Nagasaki en 1945), et la bombe H, mise au point au début des années 1950 mais qui n'a jamais été utilisée sur des populations. Le schéma illustre un des modèles de bombe H existant.</p>
      ${figBombe()}
      <p class="er-contexte">La bombe H comporte deux étages : au premier étage, l'explosion d'une bombe A à partir de la réaction ${L(equation(...E6a))} amorce au deuxième étage des réactions impliquant l'uranium 235. Un exemple de réactions possibles est donné par ${L(equation(...E6b))}. Sous la pression, les noyaux d'hydrogène s'assemblent libérant ainsi énormément d'énergie.</p>
      <ul class="er-liste"><li>1. Quelles sont les différentes réactions mises en jeu dans la bombe H ? Préciser s'il s'agit de fission ou de fusion en justifiant.</li>
        <li>2. Comment la réaction du deuxième étage impliquant l'uranium 235 est-elle amorcée ?</li>
        <li>3. Parmi les réactions ci-dessous, indiquer lesquelles peuvent se produire dans la phase finale. Justifier.<br>
          a) 2 H<sub>2</sub> + O<sub>2</sub> → 2 H<sub>2</sub>O ; b) ${L(equation([esp(2, 1), esp(2, 1)], [esp(3, 2), n()]))} ; c) ${L(equation([esp(2, 1), esp(3, 1)], [helium(), n()]))} ; d) ${L(equation([esp(2, 1), esp(239, 94)], [esp(241, 95)]))}</li></ul>`,
    parties: () => [
      { type: 'grille', q: '1. Fission ou fusion ? (plus grand nombre de nucléons à gauche ou à droite)', options: FF,
        lignes: [
          { id: 'pu', label: `1<sup>er</sup> étage : ${L(equation(...E6a))}`, bonne: 'fission', indices: { fusion: 'Le plus grand nombre de nucléons (239) est à gauche : un gros noyau se scinde.' } },
          { id: 'u', label: `2<sup>e</sup> étage : ${L(equation(...E6b))}`, bonne: 'fission', indices: { fusion: 'Le plus grand nombre de nucléons (235) est à gauche : un gros noyau se scinde.' } },
          { id: 'h', label: 'Phase finale : « les noyaux d\'hydrogène s\'assemblent »', bonne: 'fusion', indices: { fission: 'Des noyaux légers qui s\'assemblent en un noyau plus gros : c\'est une fusion.' } }],
        correction: `<p>1<sup>er</sup> étage : ${c('fission')} du plutonium 239 (239, le plus grand nombre de nucléons, est à gauche) ; 2<sup>e</sup> étage : ${c('fission')} de l'uranium 235 (235 à gauche) ; phase finale : « les noyaux d'hydrogène s'assemblent » : ${c('fusion')}.</p>` },
      choix('2. Comment la réaction du deuxième étage, qui implique l\'uranium 235, est-elle amorcée ?',
        [o('ok', 'par les neutrons libérés par la fission du plutonium, qui font fissionner l\'uranium'), o('h', 'par la fusion de l\'hydrogène'), o('chim', 'par une réaction chimique explosive')], 'ok',
        `<p>La réaction impliquant l'uranium est amorcée grâce à la première réaction, impliquant le plutonium : elle ${c('libère des neutrons, qui font fissionner l\'uranium')}.</p>`,
        { indices: { h: 'La fusion de l\'hydrogène vient après, dans la phase finale.', chim: 'Regarde l\'équation du 1<sup>er</sup> étage : quelles particules libère-t-elle, qui sont nécessaires à la fission de l\'uranium ?' } }),
      { type: 'grille', q: '3. Ces réactions peuvent-elles se produire dans la phase finale ?', options: ON,
        lignes: [
          { id: 'a', label: 'a) 2 H<sub>2</sub> + O<sub>2</sub> → 2 H<sub>2</sub>O', bonne: 'non', indices: { oui: 'C\'est une réaction chimique (les éléments sont conservés) : pas une réaction nucléaire.' } },
          { id: 'b', label: `b) ${L(equation([esp(2, 1), esp(2, 1)], [esp(3, 2), n()]))}`, bonne: 'oui', indices: { non: 'Deux noyaux d\'hydrogène s\'assemblent : c\'est une fusion d\'hydrogène.' } },
          { id: 'c', label: `c) ${L(equation([esp(2, 1), esp(3, 1)], [helium(), n()]))}`, bonne: 'oui', indices: { non: 'Deux noyaux d\'hydrogène s\'assemblent : c\'est une fusion d\'hydrogène.' } },
          { id: 'd', label: `d) ${L(equation([esp(2, 1), esp(239, 94)], [esp(241, 95)]))}`, bonne: 'non', indices: { oui: 'Le plutonium est au 1<sup>er</sup> étage : dans la phase finale, seuls des noyaux d\'hydrogène s\'assemblent.' } }],
        correction: `<p>a) ${c('non')} : c'est une réaction chimique. b) ${c('oui')} : fusion d'hydrogène. c) ${c('oui')} : fusion d'hydrogène. d) ${c('non')} : fusion du plutonium et de l'hydrogène, alors que la phase finale est la fusion des noyaux d'hydrogène.</p>` },
    ],
  };

  /* ---------- Exercice 7 : la sonde New Horizons ---------- */
  const R7 = { g: [ligne(esp(238, 94), '3,952073e-25')], d: [ligne(esp(234, 92), '3,885528e-25'), ligne(helium(), '6,644691e-27')] };
  const DM7 = 3.885528e-25 + 6.644691e-27 - 3.952073e-25, E7 = Math.abs(DM7) * C * C, A7 = 4400 / E7;
  const ex7 = {
    id: '7', groupe: 'applications', titre: 'Exercice 7 : la sonde New Horizons', desc: 'Générateur au plutonium 238 : particule émise, défaut de masse, énergie, désintégrations par seconde, activité',
    contexte: `<p class="er-contexte">Dans les missions spatiales trop lointaines, la lumière du Soleil est trop faible pour pouvoir alimenter les panneaux solaires d'une sonde spatiale. Il faut alors utiliser un générateur thermoélectrique à radio-isotopes, ou RTG en anglais (Radioisotope Thermoelectric Generator). Ce générateur utilise principalement du plutonium 238, noyau radioactif, qui en se désintégrant libère de l'énergie thermique. Cette énergie est ensuite convertie en énergie électrique par un thermocouple.</p>
      <div class="nuc-doc"><p class="nuc-doc-t"><span class="er-badge">DOC. 1</span>La sonde spatiale New Horizons</p>
        <p>La sonde New Horizons lancée en janvier 2006 pour étudier le système de la planète naine Pluton, avait à son bord un RTG fonctionnant avec 7,8 kg de plutonium 238. À son lancement, la sonde était capable de produire une puissance thermique de 4 400 W, convertie ensuite en une puissance électrique de 240 W. Au moment de son survol au-dessus de Pluton, en juillet 2015, la puissance électrique délivrée n'était plus que de 190 W.</p></div>
      <div class="nuc-doc"><p class="nuc-doc-t"><span class="er-badge">DOC. 2</span>Désintégration du plutonium 238</p>
        <ul class="er-liste"><li>Réaction de désintégration : ${L(equation([esp(238, 94)], [esp(234, 92), helium()]))}</li><li>Demi-vie du plutonium 238 : t<sub>1/2</sub> = 87,7 ans</li><li>Masses des noyaux :</li></ul>
        <div class="ph-defile"><table class="ph-tableau nuc-lisible"><tr><th>${noyau(238, 94, 'Pu')}</th><th>${noyau(234, 92, 'U')}</th><th>${noyau(4, 2, 'He')}</th></tr>
          <tr><td>3,952073 × 10<sup>−25</sup> kg</td><td>3,885528 × 10<sup>−25</sup> kg</td><td>6,644691 × 10<sup>−27</sup> kg</td></tr></table></div></div>
      <ul class="er-liste" style="margin-top:10px"><li>1. On considère la désintégration d'un noyau de plutonium 238. a) Indiquer la nature de la particule émise ainsi que le type de rayonnement radioactif. b) Déterminer la valeur du défaut de masse lors de cette réaction. c) En déduire l'énergie libérée en joule.</li>
        <li>2. On s'intéresse au lancement de la sonde New Horizons en janvier 2006. a) Déterminer le nombre de désintégrations par seconde subies par la source radioactive du RTG pour fournir la valeur de la puissance thermique à son lancement. b) En déduire la valeur initiale de l'activité de la source radioactive.</li></ul>`,
    parties: () => [
      choix('1. a) La particule émise et le type de radioactivité.', [o('a', `un noyau d'hélium ${L(noyau(4, 2, 'He'))} : radioactivité α`), o('m', `un électron ${L(noyau(0, -1, 'e'))} : radioactivité β<sup>−</sup>`), o('p', `un positron ${L(noyau(0, 1, 'e'))} : radioactivité β<sup>+</sup>`), o('f', 'deux noyaux plus légers : fission')], 'a',
        `<p>Émission d'un noyau d'hélium ${L(noyau(4, 2, 'He'))} : ${c('radioactivité α')}.</p>`,
        { melanger: false, colonne: true, indices: { m: 'Il n\'y a pas d\'électron dans l\'équation : regarde la particule émise, ⁴₂He.', p: 'Il n\'y a pas de positron dans l\'équation : regarde la particule émise, ⁴₂He.', f: 'Un seul réactif : ce n\'est pas une fission. Le plutonium émet un noyau d\'hélium.' } }),
      partieDefaut(R7, { q: '1. b) Le défaut de masse : coefficients (Valider), puis Δm.',
        correction: `${calc('Δm = m(²³⁴₉₂U) + m(⁴₂He) − m(²³⁸₉₄Pu)')}${calc(`Δm = 3,885528 × 10<sup>−25</sup> + 6,644691 × 10<sup>−27</sup> − 3,952073 × 10<sup>−25</sup> = ${c('−9,809 × 10<sup>−30</sup> kg')}`)}` }),
      scient('1. c) L\'énergie libérée en joules (la valeur de c n\'est pas donnée).', 'E =', E7, 'J',
        `${calc('E = |Δm| × c²')}${calc(`E = 9,809 × 10<sup>−30</sup> kg × (3,00 × 10<sup>8</sup> m·s<sup>−1</sup>)² = ${c('8,828 × 10<sup>−13</sup> J')}`)}<p>Quand c n'est pas donné, on prend c = 3,00 × 10<sup>8</sup> m·s<sup>−1</sup>.</p>`,
        { cs: 4, diag: v => diagE(v, DM7, C) }),
      scient('2. a) Le nombre de désintégrations par seconde au lancement.', 'nombre =', A7, 'désintégrations par seconde',
        `<p>La puissance au lancement était de 4 400 W, soit 4 400 J libérés par seconde. La désintégration d'un noyau libère 8,828 × 10<sup>−13</sup> J.</p>
          ${calc(`4 400 / 8,828 × 10<sup>−13</sup> = ${c('4,98 × 10<sup>15</sup> désintégrations par seconde')}`)}`,
        { diag: v => (egal(v, 240 / E7) || egal(v, 190 / E7) ? 'Utilise la puissance thermique, 4 400 W : c\'est l\'énergie libérée chaque seconde par les désintégrations (240 W et 190 W sont des puissances électriques, après conversion).' : diagActivite(v, 4400, E7)) }),
      scient('2. b) La valeur initiale de l\'activité de la source.', 'A<sub>0</sub> =', A7, 'Bq',
        `<p>L'activité est le nombre de désintégrations par seconde : ${c('A<sub>0</sub> = 4,98 × 10<sup>15</sup> Bq')}.</p>`,
        { diag: () => 'L\'activité est le nombre de désintégrations par seconde : reprends la valeur de la question a).' }),
    ],
  };

  window.NUC.GROUPES_EX = [
    { id: 'reactions', titre: 'Réactions nucléaires' },
    { id: 'energie', titre: 'Défaut de masse et énergie libérée' },
    { id: 'applications', titre: 'Applications : bombe H, sonde spatiale' },
  ];
  window.NUC.EXERCICES = [ex1, ex2, ex3, ex4, ex5, ex6, ex7];
})();
