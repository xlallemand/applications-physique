/* ============================================================
   Exercices du module 7 (application « Chapitre 14 : Combustions ») :
   les exercices de la feuille, dans son ordre et avec sa numérotation
   (1, 2, 3, 4, puis 16 p. 178, 15 p. 178 et 21 p. 179 du manuel),
   puis les deux extraits de sujets de bac (A : l'avion, B : le poêle à bois).

   Chaque exercice : { id, groupe, titre, desc, contexte (HTML), parties: [p] } ;
   chaque partie suit le format de CO.PARTIES ('choix', 'valeur', 'sci',
   'especes', 'equilibrer', 'schema') avec p.q (question) et p.correction
   (correction détaillée : formule, grandeur isolée, application numérique
   avec les unités, comme dans les corrections du professeur).
   Les exercices de combustion commencent leur partie calcul par le
   schéma de la méthode (CO.schemaDonnees) : l'élève y place les données
   de l'énoncé, puis enchaîne équation, n = m / M, relation
   stœchiométrique, m = n × M et énergie.

   Valeurs vérifiées par un script :
     ex. 1 : M(C6H12O6) = 180 g/mol ;
     ex. 2 : n(Fe) = 3,8 × 10⁻² mol et 56 mol ; n(Al) = 1,1 × 10⁻³ mol et 1,1 mol ;
       n(CH4) = 2,1 / 16 = 0,13 mol ; éthanol : m = 0,79 × 2,0 = 1,58 g,
       n = 1,58 / 46 = 3,4 × 10⁻² mol ; eau : n = 2,0 / 18 = 1,1 × 10⁻¹ mol ;
       M(H2O) = 18 g/mol, 10 mol → 180 g ; M(Cu(OH)2) = 97,5 g/mol, m = 2,9 g ;
     ex. 3 : M = 72 g/mol, n = 7,4 × 10⁻² mol, n(CO2) = 0,37 mol, m = 16 g, E = 0,26 MJ ;
     ex. 4 : 114,5 MJ ; 2,88 MJ ; 2,0 × 10⁵ MJ ; 528 g → 24,2 MJ ; 0,24 g → 1,2 × 10⁻² MJ ;
       2,85 × 10³ kg → 1,21 × 10⁵ MJ ;
     ex. 16 : n = 200 / 44 = 4,55 mol, n(CO2) = 13,6 mol, PC = 9,16 / 0,200 = 45,8 MJ/kg ;
     ex. 15 : n = 92 / 46 = 2 mol ; 2 / 1 < 9 / 3 : éthanol limitant ; 4 mol de CO2
       (176 g), 6 mol de H2O (108 g) ; E = 28,8 × 0,092 = 2,65 MJ ;
     ex. 21 : n = 6,25 mol ; Qcomb = 802 × 6,25 = 5,01 × 10³ kJ ; n(H2O) = 12,5 mol,
       m = 225 g ; Qliq = 2 260 × 0,225 = 508,5 kJ ; total 5,52 × 10³ kJ ; gain 10 % ;
     bac A : 2 C10H22 + 31 O2 → 20 CO2 + 22 H2O ; nk = 500 × 10³ / 142 = 3 521 mol ;
       n(CO2) = 3,52 × 10⁴ mol ; m = 1 549 kg ; 1 549 × 560 / 24 ≈ 36 t ;
     bac B : m = 1 000 / 4,0 = 250 kg ; M = 162 g/mol ; n = 1 543 mol ≈ 1,5 × 10³ mol ;
       n(CO2) = 6 × 1 543 = 9 259 mol ; m = 407 kg ≈ 4,0 × 10² kg.
   Écart avec la correction :
     bac B 2.2 : la correction arrondit n à 1,5 × 10³ mol avant de multiplier
       (9 × 10³ mol, donc 396 kg) ; avec n = 1 543 mol on trouve 407 kg.
       On attend m ≈ 4,0 × 10² kg (les deux valeurs sont acceptées) et la
       correction explique l'arrondi.
   ============================================================ */
(function () {
  'use strict';

  const { fH, fmt, egal, equation } = window.CO;
  const o = (id, label) => ({ id, label });
  const frac = (a, b) => `<span class="co-frac"><span>${a}</span><span>${b}</span></span>`;
  const calc = h => `<p class="co-calc">${h}</p>`;
  const c = h => `<span class="c">${h}</span>`;
  const p10 = (m, e) => `${m} × 10<sup>${e}</sup>`;
  const n = f => `n(${fH(f)})`, m = f => `m(${fH(f)})`, Mf = f => `M(${fH(f)})`;
  // tableau de proportionnalité (une colonne par grandeur, voir docs/charte-applications.md §4)
  const tableau = (t1, t2, l1, l2) => `<div class="ph-defile"><table class="ph-tableau"><thead><tr><th>${t1}</th><th>${t2}</th></tr></thead>
    <tbody><tr><td>${l1[0]}</td><td>${l1[1]}</td></tr><tr><td>${l2[0]}</td><td>${l2[1]}</td></tr></tbody></table></div>`;

  // fabriques de parties
  const choix = (q, options, bonne, correction, opts) => Object.assign({ type: 'choix', q, options, bonne, correction, colonne: options.some(x => x.label.replace(/<[^>]+>/g, '').length > 24) }, opts);
  const valeur = (q, label, v, unite, unites, correction, opts) => Object.assign({ type: 'valeur', q, label, valeur: v, unite, unites, correction }, opts);
  const sci = (q, label, v, unite, correction, opts) => Object.assign({ type: 'sci', q, label, valeur: v, unite, correction }, opts);
  const schema = (f, v, etiquettes, correction, opts) => Object.assign({
    type: 'schema', q: 'Place les données de l\'énoncé sur le schéma de la méthode. Les « ? » sont les grandeurs à calculer.',
    schema: window.CO.schemaDonnees(f, v, opts), etiquettes, correction }, opts);
  const etiq = (id, label, cible, indice) => ({ id, label, cible: cible || id, indice });
  const equilibrer = (f, q, correction, opts) => Object.assign({ type: 'equilibrer', comb: f, q, correction }, opts);

  // unités proposées selon la grandeur cherchée
  const U_N = ['mol', 'g', 'gmol'], U_M = ['g', 'kg', 'mol'], U_MM = ['gmol', 'g', 'mol'], U_E = ['MJ', 'kJ', 'MJkg'];

  // erreurs fréquentes sur n = m / M (conv : résultat obtenu sans convertir la masse en g)
  const diagN = (mg, Mm, conv) => v => (egal(v, mg * Mm) ? 'Tu as multiplié la masse par la masse molaire. La quantité de matière est n = m / M : on <b>divise</b>.'
    : egal(v, Mm / mg) ? 'Tu as calculé M / m. C\'est la masse qu\'on divise par la masse molaire : n = m / M.'
      : conv != null && egal(v, conv) ? 'Convertis d\'abord la masse en <b>grammes</b> : la masse molaire est en g/mol.' : '');
  // erreurs fréquentes sur une masse molaire (atomes comptés une fois, ou comptés sans leur masse)
  const diagMM = (une, nb) => v => (egal(v, une, 0) ? 'Tu as compté chaque élément une seule fois. Multiplie la masse molaire de chaque atome par son nombre dans la formule (l\'indice).'
    : egal(v, nb, 0) ? 'Tu as compté les atomes. Il faut additionner leurs <b>masses molaires</b>.' : '');
  const MASSES = 'M(H) = 1 g/mol ; M(C) = 12 g/mol ; M(O) = 16 g/mol';
  const donnees = h => `<p class="ph-donnees">Données : ${h}</p>`;
  // lien vers une autre application (nouvelle fenêtre)
  const lienApp = (href, texte, bouton) => `<div class="ph-lien-app"><p>${texte}</p><a class="btn-small" href="${href}" target="_blank" rel="noopener">${bouton} ↗</a></div>`;

  /* ============================================================
     FIGURES ET DOCUMENTS DES ÉNONCÉS
     ============================================================ */
  // extrait de la classification périodique (exercice 2) : numéro atomique, symbole, nom, masse molaire atomique
  const CLASSIF = [['1', 'H', 'Hydrogène', '1,0'], ['6', 'C', 'Carbone', '12,0'], ['8', 'O', 'Oxygène', '16,0'],
    ['13', 'Al', 'Aluminium', '27,0'], ['26', 'Fe', 'Fer', '55,8'], ['29', 'Cu', 'Cuivre', '63,5']];
  const classification = `<div class="co-classif" role="img" aria-label="Extrait de la classification périodique : masses molaires atomiques H 1,0 ; C 12,0 ; O 16,0 ; Al 27,0 ; Fe 55,8 ; Cu 63,5 g/mol">
      ${CLASSIF.map(([z, s, nom, mm]) => `<div class="co-case"><span class="co-case-z">${z}</span><span class="co-case-m">${mm}</span><b>${s}</b><span class="co-case-nom">${nom}</span></div>`).join('')}
    </div><p class="ph-donnees">Dans chaque case : numéro atomique Z (à gauche) et masse molaire atomique M en g/mol (à droite).</p>`;

  // pouvoirs calorifiques (exercice 4)
  const PCS = [['Charbon', '33,3'], ['Méthane', '50,1'], ['Propane', '45,8'], ['Essence', '42,5'], ['Diesel', '43,0'], ['Éthanol', '28,8'], ['Bois sec', '14,0'], ['Bois humide', '8,0']];
  const tablePC = `<div class="ph-defile"><table class="ph-tableau"><thead><tr><th>Combustible</th><th>PC (MJ/kg)</th></tr></thead>
    <tbody>${PCS.map(([nom, pc]) => `<tr><td>${nom}</td><td>${pc}</td></tr>`).join('')}</tbody></table></div>`;

  // encadré du manuel : le réactif limitant (exercice 15)
  const encadreLimitant = `<div class="co-encadre">
      <p>• Le <b>réactif limitant</b> est le réactif qui disparaît à la fin de la réaction et limite celle-ci.</p>
      <p>• Dans la réaction <i>a</i> A + <i>b</i> B → <i>c</i> C + <i>d</i> D, A et B sont les réactifs, C et D les produits ; <i>a</i>, <i>b</i>, <i>c</i> et <i>d</i> sont les nombres stœchiométriques.</p>
      <p>• Pour trouver le réactif limitant, on compare les <b>quantités de matière initiales</b> de chaque réactif, divisées par leur nombre stœchiométrique :
        si ${frac('n(A)<sub>i</sub>', '<i>a</i>')} &lt; ${frac('n(B)<sub>i</sub>', '<i>b</i>')}, alors A est le réactif limitant.</p>
      <p>• Si A est le réactif limitant, les <b>quantités de produits formés</b> sont données par : ${frac('n(C)<sub>f</sub>', '<i>c</i>')} = ${frac('n(A)<sub>i</sub>', '<i>a</i>')} et ${frac('n(D)<sub>f</sub>', '<i>d</i>')} = ${frac('n(A)<sub>i</sub>', '<i>a</i>')}.</p>
      <p>• Il reste du réactif B en excès : n(B)<sub>f</sub> = n(B)<sub>i</sub> − ${frac('<i>b</i>', '<i>a</i>')} × n(A)<sub>i</sub>.</p>
    </div>`;

  // chaudière à condensation (exercice 21), redessinée
  const chaudiere = `<svg class="co-fig" viewBox="0 0 440 230" role="img" aria-label="Chaudière à condensation : le brûleur chauffe l'eau du circuit (partie évaporation) ; les fumées passent ensuite sur le serpentin où revient l'eau froide du radiateur : la vapeur d'eau s'y condense (partie condensation) et l'eau liquide est évacuée.">
      <g font-family="Hanken Grotesk, Arial, sans-serif" font-size="12" fill="#16181d">
        <rect x="200" y="20" width="200" height="160" rx="14" fill="#f3f1ec" stroke="#16181d" stroke-width="2"/>
        <line x1="300" y1="20" x2="300" y2="180" stroke="#16181d" stroke-width="1.5"/>
        <path d="M218,46 h64 a8,8 0 0 1 0,16 h-64 a8,8 0 0 0 0,16 h64 a8,8 0 0 1 0,16 h-64" fill="none" stroke="#0a7d57" stroke-width="5"/>
        <path d="M318,46 h64 a8,8 0 0 1 0,16 h-64 a8,8 0 0 0 0,16 h64 a8,8 0 0 1 0,16 h-64" fill="none" stroke="#8d8f94" stroke-width="5"/>
        <text x="250" y="118" text-anchor="middle" font-weight="700">Évaporation</text>
        <text x="350" y="118" text-anchor="middle" font-weight="700">Condensation</text>
        <path d="M238,160 q6,-18 12,-6 q4,-16 12,-2 q6,-14 10,8 z" fill="#ebe8e1" stroke="#16181d" stroke-width="1.5"/>
        <line x1="232" y1="162" x2="268" y2="162" stroke="#16181d" stroke-width="2"/>
        <text x="250" y="176" text-anchor="middle">Brûleur</text>
        <path d="M335,126 l-4,8 a5,5 0 1 0 8,0 z M362,132 l-4,8 a5,5 0 1 0 8,0 z" fill="#8d8f94"/>
        <text x="350" y="160" text-anchor="middle">Évacuation</text><text x="350" y="173" text-anchor="middle">de l'eau</text>
        <line x1="350" y1="180" x2="350" y2="206" stroke="#16181d" stroke-width="2"/>
        <path d="M344,198 l6,10 l6,-10" fill="none" stroke="#16181d" stroke-width="2"/>
        <rect x="20" y="64" width="110" height="74" rx="6" fill="#ffffff" stroke="#16181d" stroke-width="2"/>
        <path d="M38,70 v62 M56,70 v62 M74,70 v62 M92,70 v62 M110,70 v62" stroke="#8d8f94" stroke-width="5"/>
        <text x="75" y="156" text-anchor="middle" font-weight="700">Radiateur</text>
        <path d="M218,54 H130" fill="none" stroke="#0a7d57" stroke-width="4"/>
        <path d="M150,48 l-10,6 l10,6" fill="none" stroke="#0a7d57" stroke-width="2"/>
        <text x="165" y="42" text-anchor="middle" fill="#075c40">eau chaude</text>
        <path d="M130,128 H170 V210 H420 V54 H382" fill="none" stroke="#8d8f94" stroke-width="4"/>
        <path d="M300,204 l10,6 l-10,6" fill="none" stroke="#8d8f94" stroke-width="2"/>
        <text x="230" y="224" text-anchor="middle" fill="#55585f">eau froide (retour)</text>
      </g>
    </svg>`;

  // pictogrammes de sécurité du kérosène (sujet de bac A), le premier est entouré
  const losange = (x, h, entoure) => `<g transform="translate(${x},0)">${entoure ? '<rect x="2" y="2" width="76" height="76" rx="6" fill="none" stroke="#0a7d57" stroke-width="3"/>' : ''}
      <path d="M40,8 L72,40 L40,72 L8,40 Z" fill="#ffffff" stroke="#16181d" stroke-width="3.5" stroke-linejoin="round"/>${h}</g>`;
  const pictos = `<svg class="co-fig co-pictos" viewBox="0 0 340 80" role="img" aria-label="Quatre pictogrammes de sécurité : une flamme (entourée), un point d'exclamation, un buste avec une étoile sur la poitrine (danger pour la santé), un arbre mort et un poisson (danger pour l'environnement)">
      ${losange(0, '<path d="M40,58 c-10,0 -14,-8 -10,-16 c2,4 4,5 6,5 c-3,-8 2,-16 8,-20 c-1,7 4,9 6,14 c2,-2 3,-5 3,-8 c5,7 5,25 -13,25 z" fill="#16181d"/><line x1="26" y1="61" x2="54" y2="61" stroke="#16181d" stroke-width="3"/>', true)}
      ${losange(86, '<rect x="36" y="22" width="8" height="26" rx="3" fill="#16181d"/><circle cx="40" cy="56" r="4.5" fill="#16181d"/>')}
      ${losange(172, '<circle cx="40" cy="26" r="6" fill="#16181d"/><path d="M27,58 c0,-16 5,-24 13,-24 c8,0 13,8 13,24 z" fill="#16181d"/><path d="M40,38 l2.5,6 l6,0.5 l-4.6,4 l1.5,6 l-5.4,-3.2 l-5.4,3.2 l1.5,-6 l-4.6,-4 l6,-0.5 z" fill="#ffffff"/>')}
      ${losange(258, '<path d="M28,56 V32 M28,40 l-7,-7 M28,44 l7,-8 M28,36 l5,-6" stroke="#16181d" stroke-width="2.5" fill="none"/><path d="M38,54 c4,-6 14,-6 18,0 c-4,6 -14,6 -18,0 z M56,54 l6,-5 v10 z" fill="#16181d"/><line x1="20" y1="60" x2="62" y2="60" stroke="#16181d" stroke-width="2"/>')}
    </svg>`;

  // formule semi-développée du propylène glycol (sujet de bac B)
  const glycol = `<svg class="co-fig co-glycol" viewBox="0 0 220 84" role="img" aria-label="Formule semi-développée du propylène glycol : CH2 – CH – CH3, un groupe OH lié au premier carbone et un groupe OH lié au deuxième carbone">
      <g font-family="Hanken Grotesk, Arial, sans-serif" font-size="18" font-weight="700" fill="#16181d" text-anchor="middle">
        <text x="40" y="22">OH</text><text x="110" y="22">OH</text>
        <line x1="40" y1="30" x2="40" y2="48" stroke="#16181d" stroke-width="2"/><line x1="110" y1="30" x2="110" y2="48" stroke="#16181d" stroke-width="2"/>
        <text x="40" y="70">CH<tspan font-size="12" dy="5">2</tspan></text><text x="75" y="70">–</text><text x="110" y="70">CH</text><text x="142" y="70">–</text><text x="178" y="70">CH<tspan font-size="12" dy="5">3</tspan></text>
      </g>
    </svg>`;
  const tableGlycol = `<div class="ph-defile"><table class="ph-tableau"><thead><tr><th>Propriété du propylène glycol</th><th>Valeur</th></tr></thead>
    <tbody><tr><td>Température de fusion</td><td>−59 °C</td></tr><tr><td>Température d'ébullition</td><td>188,2 °C</td></tr>
    <tr><td>Miscibilité</td><td>miscible à l'eau, l'acétone et l'éthanol</td></tr><tr><td>Masse volumique</td><td>1 036 kg·m<sup>−3</sup></td></tr></tbody></table></div>`;

  /* ============================================================
     GROUPES ET EXERCICES (ordre de la feuille)
     ============================================================ */
  const GROUPES_EX = [
    { id: 'base', titre: 'Masse molaire et quantité de matière (exercices 1 et 2)' },
    { id: 'comb', titre: 'Combustion et énergie libérée (exercices 3 et 4)' },
    { id: 'manuel', titre: 'Exercices du manuel (16 et 15 p. 178, 21 p. 179)' },
    { id: 'bac', titre: 'Extraits de sujets de bac (A et B)' },
  ];

  // ---------- Exercice 2 : une quantité de matière n = m / M ----------
  // (tol : 1,1 mol pour 1,148 mol, l'arrondi à 2 chiffres de la correction, doit être accepté)
  function nFe(q, label, mg, Mm, cs, conv, corr, opts) {
    const v = mg / Mm, diag = diagN(mg, Mm, conv);
    opts = Object.assign({ tol: .05 }, opts);
    const p = v < 0.1 || v >= 1000 ? sci(q, label, v, 'mol', corr, Object.assign({ cs, diag }, opts)) : valeur(q, label, v, 'mol', U_N, corr, Object.assign({ diag }, opts));
    return p;
  }

  const EXERCICES = [

    /* ============================ EXERCICE 1 ============================ */
    { id: '1', groupe: 'base', titre: 'Exercice 1 : masse molaire du glucose', desc: `M(${fH('C6H12O6')}) à partir des masses molaires atomiques.`,
      contexte: `<p class="er-contexte">Calculer la masse molaire moléculaire du glucose de formule ${fH('C6H12O6')}.</p>${donnees(MASSES + '.')}`,
      parties: [
        choix('a. Quelle expression donne la masse molaire du glucose ?', [
          o('ok', '6 × 12 + 12 × 1 + 6 × 16'), o('une', '12 + 1 + 16'), o('nb', '6 + 12 + 6')], 'ok',
        `<p>La molécule contient 6 atomes C, 12 atomes H et 6 atomes O : chaque masse molaire atomique est multipliée par le nombre d'atomes (l'indice).</p>`,
        { indices: { une: 'Chaque élément n\'est compté qu\'une fois : il faut multiplier par le nombre d\'atomes (6 C, 12 H, 6 O).', nb: 'Cette somme compte les atomes ; il faut additionner leurs masses molaires.' } }),
        valeur('b. Calcule la masse molaire du glucose.', `${Mf('C6H12O6')} =`, 180, 'gmol', U_MM,
          calc(`${Mf('C6H12O6')} = 6 × M(C) + 12 × M(H) + 6 × M(O) = 6 × 12 + 12 × 1 + 6 × 16 = ${c('180 g/mol')}`),
          { tol: 0, diag: diagMM(29, 24) }),
      ] },

    /* ============================ EXERCICE 2 ============================ */
    { id: '2', groupe: 'base', titre: 'Exercice 2 : quantités de matière', desc: 'n = m / M avec des masses en g, en kg, puis des volumes ; m = n × M.',
      contexte: `<p class="er-contexte">Données : extrait de la classification périodique.</p>${classification}
        <p class="er-contexte"><b>1.</b> Calculer les quantités de matière correspondant à : une masse m<sub>Fe</sub> = 2,1 g de fer (Fe) ; une masse m<sub>Fe</sub> = 3,1 kg de fer ;
          une masse m<sub>Al</sub> = ${p10('3,1', '−2')} g d'aluminium (Al) ; une masse m<sub>Al</sub> = ${p10('3,1', '−2')} kg d'aluminium ; une masse m<sub>CH<sub>4</sub></sub> = 2,1 g de méthane (${fH('CH4')}) ;
          un volume V<sub>éthanol</sub> = 2,0 mL d'éthanol (${fH('C2H6O')}), de masse volumique ρ = 0,79 g/mL ; un volume V<sub>eau</sub> = 2,0 mL d'eau.</p>
        <p class="er-contexte"><b>2.</b> Calculer la masse molaire de l'eau ${fH('H2O')}. Quelle masse d'eau faut-il prélever pour en avoir 10 moles ?</p>
        <p class="er-contexte"><b>3.</b> Quelle est la masse de ${p10('3,0', '−2')} mol d'hydroxyde de cuivre ${fH('Cu(OH)2')} ?</p>`,
      parties: [
        nFe('1. a) m<sub>Fe</sub> = 2,1 g de fer.', `n<sub>Fe</sub> =`, 2.1, 55.8, 2, null,
          calc(`n<sub>Fe</sub> = ${frac('m<sub>Fe</sub>', 'M<sub>Fe</sub>')} = ${frac('2,1 g', '55,8 g/mol')} = ${c(p10('3,8', '−2') + ' mol')}`)),
        nFe('1. b) m<sub>Fe</sub> = 3,1 kg de fer.', `n<sub>Fe</sub> =`, 3100, 55.8, 2, 3.1 / 55.8,
          `<p>La masse molaire est en g/mol : on convertit d'abord la masse en grammes, 3,1 kg = ${p10('3,1', '3')} g.</p>`
          + calc(`n<sub>Fe</sub> = ${frac('m<sub>Fe</sub>', 'M<sub>Fe</sub>')} = ${frac(p10('3,1', '3') + ' g', '55,8 g/mol')} = ${c('56 mol')}`)),
        nFe(`1. c) m<sub>Al</sub> = ${p10('3,1', '−2')} g d'aluminium.`, `n<sub>Al</sub> =`, 3.1e-2, 27, 2, null,
          calc(`n<sub>Al</sub> = ${frac('m<sub>Al</sub>', 'M<sub>Al</sub>')} = ${frac(p10('3,1', '−2') + ' g', '27 g/mol')} = ${c(p10('1,1', '−3') + ' mol')}`)),
        nFe(`1. d) m<sub>Al</sub> = ${p10('3,1', '−2')} kg d'aluminium.`, `n<sub>Al</sub> =`, 31, 27, 2, 3.1e-2 / 27,
          `<p>On convertit en grammes : ${p10('3,1', '−2')} kg = ${p10('3,1', '−2')} × 10<sup>3</sup> g = 31 g.</p>`
          + calc(`n<sub>Al</sub> = ${frac('m<sub>Al</sub>', 'M<sub>Al</sub>')} = ${frac(p10('3,1', '−2') + ' × 10<sup>3</sup> g', '27 g/mol')} = ${c('1,1 mol')}`)),
        valeur(`1. e) m = 2,1 g de méthane. Calcule d'abord la masse molaire du méthane.`, `${Mf('CH4')} =`, 16, 'gmol', U_MM,
          calc(`${Mf('CH4')} = M(C) + 4 × M(H) = 12 + 4 × 1 = ${c('16 g/mol')}`), { tol: 0, diag: diagMM(13, 5) }),
        valeur('Puis la quantité de matière de méthane.', `${n('CH4')} =`, 2.1 / 16, 'mol', U_N,
          calc(`${n('CH4')} = ${frac(m('CH4'), Mf('CH4'))} = ${frac('2,1 g', '16 g/mol')} = ${c('0,13 mol')}`), { diag: diagN(2.1, 16) }),
        valeur('1. f) V = 2,0 mL d\'éthanol, ρ = 0,79 g/mL. Calcule d\'abord la masse d\'éthanol.', 'm<sub>éthanol</sub> =', 1.58, 'g', U_M,
          `<p>La <b>masse volumique</b> ρ est la masse d'un millilitre : ρ = 0,79 g/mL signifie que 1 mL d'éthanol a une masse de 0,79 g. La masse est proportionnelle au volume :</p>
          ${calc(`ρ = ${frac('m', 'V')} donc m = ρ × V`)}${calc(`m<sub>éthanol</sub> = 0,79 g/mL × 2,0 mL = ${c('1,58 g')}`)}`,
          { diag: v => (egal(v, 2 / 0.79) ? 'Tu as divisé le volume par la masse volumique. La masse est m = ρ × V : 1 mL a une masse de 0,79 g, donc 2,0 mL…' : 'La masse volumique est la masse d\'un millilitre : m = ρ × V.') }),
        valeur('Puis la masse molaire de l\'éthanol.', `${Mf('C2H6O')} =`, 46, 'gmol', U_MM,
          calc(`${Mf('C2H6O')} = 2 × 12 + 6 × 1 + 16 = ${c('46 g/mol')}`), { tol: 0, diag: diagMM(29, 9) }),
        sci('Puis la quantité de matière d\'éthanol.', 'n<sub>éthanol</sub> =', 1.58 / 46, 'mol',
          calc(`n<sub>éthanol</sub> = ${frac('m<sub>éthanol</sub>', 'M<sub>éthanol</sub>')} = ${frac('1,58 g', '46 g/mol')} = ${c(p10('3,4', '−2') + ' mol')}`),
          { diag: v => diagN(1.58, 46)(v) || (egal(v, 2 / 46) ? 'Tu as utilisé le volume (2,0 mL) à la place de la masse : n = m / M, avec la masse m = 1,58 g.' : '') }),
        valeur('1. g) V = 2,0 mL d\'eau. Quelle est la masse de cette eau ?', 'm<sub>eau</sub> =', 2, 'g', U_M,
          `<p>La masse volumique de l'eau est 1 g/mL (1 kg/L) : 1 mL d'eau a une masse de 1 g.</p>${calc(`m<sub>eau</sub> = ρ × V = 1 g/mL × 2,0 mL = ${c('2,0 g')}`)}`,
          { indice: 'La masse volumique de l\'eau vaut ρ = 1 g/mL : 1 mL d\'eau a une masse de 1 g.' }),
        sci('Puis la quantité de matière d\'eau.', 'n<sub>eau</sub> =', 2 / 18, 'mol',
          calc(`n<sub>eau</sub> = ${frac('m<sub>eau</sub>', 'M<sub>eau</sub>')} = ${frac('2,0 g', '2 × 1 + 16 g/mol')} = ${frac('2,0', '18')} = ${c(p10('1,1', '−1') + ' mol')}`),
          { diag: diagN(2, 18) }),
        valeur('2. Calcule la masse molaire de l\'eau.', `${Mf('H2O')} =`, 18, 'gmol', U_MM,
          calc(`${Mf('H2O')} = 2 × M(H) + M(O) = 2 + 16 = ${c('18 g/mol')}`), { tol: 0, diag: diagMM(17, 3) }),
        valeur('Quelle masse d\'eau faut-il prélever pour en avoir 10 moles ?', `${m('H2O')} =`, 180, 'g', U_M,
          calc(`${m('H2O')} = ${n('H2O')} × ${Mf('H2O')} = 10 mol × 18 g/mol = ${c('180 g')}`),
          { diag: v => (egal(v, 10 / 18) ? 'Tu as divisé n par M. Pour retrouver la masse, on <b>multiplie</b> : m = n × M.' : 'm = n × M, avec n en mol et M en g/mol.') }),
        valeur(`3. Calcule la masse molaire de l'hydroxyde de cuivre ${fH('Cu(OH)2')}.`, `${Mf('Cu(OH)2')} =`, 97.5, 'gmol', U_MM,
          calc(`${Mf('Cu(OH)2')} = M(Cu) + 2 × (M(O) + M(H)) = 63,5 + 2 × (16 + 1) = ${c('97,5 g/mol')}`),
          { tol: .001, diag: v => (egal(v, 80.5, .001) ? 'Les parenthèses : (OH)<sub>2</sub> contient 2 atomes O <b>et</b> 2 atomes H. Multiplie M(O) + M(H) par 2.' : egal(v, 81.5, .001) ? 'Le 2 multiplie tout le groupe OH : 2 atomes O et 2 atomes H.' : '') }),
        valeur(`Quelle est la masse de ${p10('3,0', '−2')} mol d'hydroxyde de cuivre ?`, `${m('Cu(OH)2')} =`, 3e-2 * 97.5, 'g', U_M,
          calc(`${m('Cu(OH)2')} = ${n('Cu(OH)2')} × ${Mf('Cu(OH)2')} = ${p10('3,0', '−2')} mol × 97,5 g/mol = ${c('2,9 g')}`),
          { diag: v => (egal(v, 3e-2 / 97.5) ? 'Tu as divisé n par M. Pour retrouver la masse, on <b>multiplie</b> : m = n × M.' : 'm = n × M, avec n en mol et M en g/mol.') }),
      ] },

    /* ============================ EXERCICE 3 ============================ */
    { id: '3', groupe: 'comb', titre: 'Exercice 3 : combustion du pentane', desc: '5,3 g de pentane : équation, quantité de matière, masse de CO₂, énergie.',
      contexte: `<p class="er-contexte">On brûle 5,3 g de pentane, de formule ${fH('C5H12')}, dans le dioxygène de l'air.</p>
        ${donnees(`M(H) = 1,0 g/mol ; M(C) = 12 g/mol ; M(O) = 16 g/mol ; pouvoir calorifique du pentane : 48,6 MJ/kg.`)}
        <p class="er-contexte"><b>1.</b> Écrire la réaction de combustion du pentane. <b>2.</b> Calculer la quantité de matière de pentane qui a brûlé. <b>3.</b> En déduire la masse de dioxyde de carbone émis par cette combustion. <b>4.</b> Calculer l'énergie libérée par cette combustion.</p>`,
      parties: [
        schema('C5H12', { m0: '#m', n0: '?', n2: '?', m2: '?', E: [['PC', '#pc'], ['E', '?']] }, [
          etiq('m', '5,3 g', 'm', 'La masse de pentane brûlé se place en haut de la colonne du combustible.'),
          etiq('pc', '48,6 MJ/kg', 'pc', 'Le pouvoir calorifique sert à calculer l\'énergie : ligne du bas.')],
          '<p>On part de la masse de pentane brûlé (5,3 g) ; on cherche n(C<sub>5</sub>H<sub>12</sub>), puis n(CO<sub>2</sub>) et m(CO<sub>2</sub>). Le pouvoir calorifique (48,6 MJ/kg) donne l\'énergie.</p>'),
        { type: 'especes', comb: 'C5H12', q: '1. Écris la réaction de combustion du pentane : complète l\'équation avec les bonnes espèces.',
          correction: `<p>${fH('C5H12')} + ${fH('O2')} → ${fH('CO2')} + ${fH('H2O')} : le pentane brûle avec le dioxygène de l'air et donne du dioxyde de carbone et de l'eau.</p>` },
        equilibrer('C5H12', 'Équilibre-la : C, puis H, puis O.', `<p class="co-eq">${equation('C5H12')}</p><p>5 atomes C donnent 5 CO<sub>2</sub> ; 12 atomes H donnent 6 H<sub>2</sub>O ; à droite, 5 × 2 + 6 = 16 atomes O, soit 8 O<sub>2</sub>.</p>`),
        valeur('2. Calcule d\'abord la masse molaire du pentane.', `${Mf('C5H12')} =`, 72, 'gmol', U_MM,
          calc(`${Mf('C5H12')} = 5 × 12 + 12 × 1 = ${c('72 g/mol')}`), { tol: 0, diag: diagMM(13, 17) }),
        sci('Puis la quantité de matière de pentane qui a brûlé.', `${n('C5H12')} =`, 5.3 / 72, 'mol',
          calc(`${n('C5H12')} = ${frac(m('C5H12'), Mf('C5H12'))} = ${frac('5,3 g', '72 g/mol')} = ${c(p10('7,4', '−2') + ' mol')}`), { diag: diagN(5.3, 72) }),
        valeur('3. Quelle quantité de dioxyde de carbone est formée ?', `${n('CO2')} =`, 5 * 5.3 / 72, 'mol', U_N,
          `<p>D'après l'équation : ${frac(n('CO2'), 5)} = ${frac(n('C5H12'), 1)}, donc</p>${calc(`${n('CO2')} = 5 × ${n('C5H12')} = 5 × ${p10('7,4', '−2')} = ${c('0,37 mol')}`)}`,
          { diag: v => (egal(v, 5.3 / 72) ? `Une molécule de pentane donne 5 molécules de CO<sub>2</sub> : multiplie par 5.` : egal(v, 5.3 / 72 / 5) ? 'Il se forme 5 fois <b>plus</b> de CO<sub>2</sub> que de pentane consommé : multiplie par 5.' : '') }),
        valeur('Calcule la masse de dioxyde de carbone émis.', `${m('CO2')} =`, 5 * 5.3 / 72 * 44, 'g', U_M,
          calc(`${m('CO2')} = ${n('CO2')} × ${Mf('CO2')} = 0,37 mol × (12 + 2 × 16) g/mol = 0,37 × 44 = ${c('16 g')}`) + '<p>Soit 16 g de dioxyde de carbone émis (2 chiffres significatifs, comme les données).</p>',
          { diag: v => (egal(v, 5.3) ? 'La masse de CO<sub>2</sub> n\'est pas égale à la masse de pentane : m = n × M(CO<sub>2</sub>).' : 'm = n × M, avec M(CO<sub>2</sub>) = 12 + 2 × 16 = 44 g/mol.') }),
        valeur('4. Calcule l\'énergie libérée par cette combustion.', 'E =', 48.6 * 5.3e-3, 'MJ', U_E,
          `<p>Le pouvoir calorifique est en MJ/kg : la masse doit être en kg, 5,3 g = ${p10('5,3', '−3')} kg.</p>${calc(`E = PC × m = 48,6 MJ/kg × ${p10('5,3', '−3')} kg = ${c('0,26 MJ')}`)}`,
          { diag: v => (egal(v, 48.6 * 5.3) ? 'Le pouvoir calorifique est donné par <b>kilogramme</b> : convertis 5,3 g en kg.' : egal(v, 48.6 / 5.3e-3) ? 'E = PC × m : on multiplie le pouvoir calorifique par la masse (en kg).' : '') }),
      ] },

    /* ============================ EXERCICE 4 ============================ */
    { id: '4', groupe: 'comb', titre: 'Exercice 4 : énergie libérée', desc: 'E = PC × m, à partir d\'une masse, puis d\'une quantité de matière.',
      contexte: `<p class="er-contexte">Données : pouvoirs calorifiques.</p>${tablePC}${donnees('masses molaires M(H) = 1 g/mol ; M(C) = 12 g/mol.')}
        <p class="er-contexte"><b>1.</b> Calculer l'énergie libérée par la combustion complète : a) de 2,50 kg de propane ; b) de 100 g d'éthanol ; c) de 6,0 tonnes de charbon.</p>
        <p class="er-contexte"><b>2.</b> Calculer l'énergie libérée par la combustion complète de : a) 12 mol de propane ${fH('C3H8')} ; b) 15 mmol de méthane ${fH('CH4')} ; c) 25 kmol d'essence ${fH('C8H18')}.</p>`,
      parties: [
        valeur('1. a) 2,50 kg de propane.', 'E =', 2.5 * 45.8, 'MJ', U_E, calc(`E = PC × m = 45,8 MJ/kg × 2,5 kg = ${c('114,5 MJ')}`),
          { diag: v => (egal(v, 45.8 / 2.5) ? 'E = PC × m : on <b>multiplie</b> le pouvoir calorifique par la masse.' : 'Lis le pouvoir calorifique du propane dans le tableau, puis E = PC × m.') }),
        valeur('1. b) 100 g d\'éthanol.', 'E =', 0.1 * 28.8, 'MJ', U_E,
          `<p>100 g = ${p10('100', '−3')} kg = 0,100 kg.</p>${calc(`E = PC × m = 28,8 MJ/kg × 0,100 kg = ${c('2,88 MJ')}`)}`,
          { diag: v => (egal(v, 2880) ? 'Le pouvoir calorifique est en MJ/<b>kg</b> : convertis 100 g en kg.' : '') }),
        sci('1. c) 6,0 tonnes de charbon.', 'E =', 6e3 * 33.3, 'MJ',
          `<p>6,0 t = ${p10('6,0', '3')} kg.</p>${calc(`E = PC × m = 33,3 MJ/kg × ${p10('6,0', '3')} kg = ${c(p10('2,0', '5') + ' MJ')}`)}`,
          { diag: v => (egal(v, 6 * 33.3) ? 'Convertis les tonnes en kg : 1 t = 1 000 kg.' : egal(v, 6e6 * 33.3) ? 'Le pouvoir calorifique est par <b>kg</b> : 6,0 t = 6,0 × 10<sup>3</sup> kg (pas en g).' : '') }),
        valeur('2. a) 12 mol de propane : calcule d\'abord la masse de propane.', `${m('C3H8')} =`, 12 * 44, 'g', U_M,
          calc(`${m('C3H8')} = n × M = 12 mol × (3 × 12 + 8) g/mol = 12 × 44 = ${c('528 g')}`),
          { diag: v => (egal(v, 12 / 44) ? 'Tu as divisé n par M : m = n × M.' : 'm = n × M, avec M(C<sub>3</sub>H<sub>8</sub>) = 3 × 12 + 8 × 1 = 44 g/mol.') }),
        valeur('Puis l\'énergie libérée.', 'E =', 0.528 * 45.8, 'MJ', U_E, calc(`E = m × PC = ${p10('528', '−3')} kg × 45,8 MJ/kg = ${c('24,2 MJ')}`),
          { diag: v => (egal(v, 528 * 45.8) ? 'Convertis la masse en kg : 528 g = 0,528 kg.' : egal(v, 12 * 45.8) ? 'Le pouvoir calorifique est par kg, pas par mole : utilise la masse (en kg).' : '') }),
        valeur('2. b) 15 mmol de méthane : calcule d\'abord la masse de méthane.', `${m('CH4')} =`, 15e-3 * 16, 'g', U_M,
          `<p>15 mmol = ${p10('15', '−3')} mol.</p>${calc(`${m('CH4')} = n × M = ${p10('15', '−3')} mol × (12 + 4) g/mol = ${c('0,24 g')}`)}`,
          { diag: v => (egal(v, 15 * 16) ? '15 mmol = 15 × 10<sup>−3</sup> mol (1 mmol = 10<sup>−3</sup> mol).' : '') }),
        sci('Puis l\'énergie libérée.', 'E =', 0.24e-3 * 50.1, 'MJ', calc(`E = m × PC = 0,24 × 10<sup>−3</sup> kg × 50,1 MJ/kg = ${c(p10('1,2', '−2') + ' MJ')}`),
          { diag: v => (egal(v, 0.24 * 50.1) ? 'Convertis la masse en kg : 0,24 g = 0,24 × 10<sup>−3</sup> kg.' : '') }),
        sci('2. c) 25 kmol d\'essence : calcule d\'abord la masse d\'essence.', `${m('C8H18')} =`, 25e3 * 114 / 1e3, 'kg',
          `<p>25 kmol = ${p10('25', '3')} mol et M(C<sub>8</sub>H<sub>18</sub>) = 8 × 12 + 18 = 114 g/mol.</p>${calc(`${m('C8H18')} = n × M = ${p10('25', '3')} × 114 = ${p10('2,85', '6')} g = ${c(p10('2,85', '3') + ' kg')}`)}`,
          { cs: 3, diag: v => (egal(v, 25e3 * 114) ? 'Ce résultat est en grammes : convertis en kg (÷ 1 000).' : egal(v, 25 * 114 / 1e3) ? '25 kmol = 25 × 10<sup>3</sup> mol (1 kmol = 1 000 mol).' : '') }),
        sci('Puis l\'énergie libérée.', 'E =', 2850 * 42.5, 'MJ', calc(`E = m × PC = ${p10('2,85', '3')} kg × 42,5 MJ/kg = ${c(p10('1,21', '5') + ' MJ')}`),
          { cs: 3, diag: v => (egal(v, 2.85e6 * 42.5) ? 'Utilise la masse en kg : 2,85 × 10<sup>3</sup> kg.' : '') }),
      ] },

    /* ============================ EXERCICE 16 p. 178 ============================ */
    { id: '16', groupe: 'manuel', titre: 'Exercice 16 p. 178 : combustion du propane', desc: '200 g de propane : produits, équation, quantités de matière, pouvoir calorifique.',
      contexte: `<p class="er-contexte">On effectue la combustion complète de 200 g de propane ${fH('C3H8')} dans un excès de dioxygène.</p>${donnees(MASSES + '.')}
        <p class="er-contexte"><b>a)</b> Identifier les deux produits de la réaction. <b>b)</b> Écrire l'équation de combustion du propane considérée comme complète. <b>c)</b> Calculer la quantité de matière, en moles, de propane ayant réagi.
          <b>d)</b> En déduire la quantité de matière de dioxyde de carbone formé par la réaction. <b>e)</b> La combustion complète de la totalité du propane libère 9,16 MJ. Déterminer le pouvoir calorifique du propane, en MJ·kg<sup>−1</sup>.</p>`,
      parties: [
        choix('a) Quels sont les deux produits de la combustion complète du propane ?', [
          o('co', `du monoxyde de carbone ${fH('CO')} et de l'eau ${fH('H2O')}`), o('ok', `du dioxyde de carbone ${fH('CO2')} et de l'eau ${fH('H2O')}`),
          o('h2', `du dioxyde de carbone ${fH('CO2')} et du dihydrogène ${fH('H2')}`)], 'ok',
          '<p>Une combustion complète produit du <b>dioxyde de carbone CO<sub>2</sub></b> et de l\'<b>eau H<sub>2</sub>O</b>.</p>',
          { indices: { co: 'Le monoxyde de carbone se forme lors d\'une combustion <b>incomplète</b> (manque de dioxygène). Ici, le dioxygène est en excès.', h2: 'L\'hydrogène du combustible se retrouve dans l\'eau H<sub>2</sub>O.' } }),
        schema('C3H8', { m0: '#m', n0: '?', n2: '?', E: [['E', '#e'], ['PC', '?']], formuleE: 'E = PC × m' }, [
          etiq('m', '200 g', 'm', 'La masse de propane se place en haut de la colonne du combustible.'),
          etiq('e', '9,16 MJ', 'e', 'L\'énergie libérée se place sur la ligne de l\'énergie.')],
          '<p>On part de la masse de propane (200 g) pour calculer n(C<sub>3</sub>H<sub>8</sub>) puis n(CO<sub>2</sub>). Avec l\'énergie libérée (9,16 MJ), on cherche le pouvoir calorifique.</p>'),
        equilibrer('C3H8', 'b) Écris l\'équation de combustion du propane : équilibre-la.', `<p class="co-eq">${equation('C3H8')}</p>`),
        valeur('c) Calcule la quantité de matière de propane ayant réagi.', `${n('C3H8')} =`, 200 / 44, 'mol', U_N,
          calc(`${n('C3H8')} = ${frac(m('C3H8'), Mf('C3H8'))} = ${frac('200 g', '(3 × 12 + 8) g/mol')} = ${frac('200', '44')} = ${c('4,55 mol')}`), { diag: diagN(200, 44) }),
        valeur('d) En déduis la quantité de matière de dioxyde de carbone formé.', `${n('CO2')} =`, 3 * 200 / 44, 'mol', U_N,
          `<p>D'après la réaction : ${frac(n('CO2'), 3)} = ${frac(n('C3H8'), 1)}, donc</p>${calc(`${n('CO2')} = 3 × ${n('C3H8')} = 3 × 4,55 = ${c('13,6 mol')}`)}`,
          { diag: v => (egal(v, 200 / 44) ? 'Une molécule de propane donne 3 molécules de CO<sub>2</sub> : multiplie par 3.' : egal(v, 200 / 44 / 3) ? 'Il se forme 3 fois <b>plus</b> de CO<sub>2</sub> que de propane consommé.' : '') }),
        valeur('e) Détermine le pouvoir calorifique du propane.', 'PC =', 9.16 / 0.2, 'MJkg', ['MJkg', 'MJ', 'kg'],
          `${calc('E = PC × m<sub>propane</sub> donc PC = ' + frac('E', 'm<sub>propane</sub>'))}${calc(`PC = ${frac('9,16 MJ', '200 × 10<sup>−3</sup> kg')} = ${c('45,8 MJ/kg')}`)}`,
          { diag: v => (egal(v, 9.16 / 200) ? 'Le pouvoir calorifique est en MJ par <b>kg</b> : convertis 200 g en kg.' : egal(v, 9.16 * 0.2) ? 'E = PC × m, donc PC = E / m : on divise l\'énergie par la masse.' : '') }),
      ] },

    /* ============================ EXERCICE 15 p. 178 ============================ */
    { id: '15', groupe: 'manuel', titre: 'Exercice 15 p. 178 : combustion de l\'éthanol', desc: '92 g d\'éthanol et 9 mol de dioxygène : réactif limitant, produits formés, énergie.',
      contexte: `<p class="er-contexte">La combustion complète de l'éthanol ${fH('C2H5OH')} dans le dioxygène de l'air ne produit que du dioxyde de carbone et de la vapeur d'eau. On fait brûler 92 g d'éthanol dans 9 moles de dioxygène.</p>
        ${donnees(MASSES + ' ; PC de l\'éthanol : 28,8 MJ·kg<sup>−1</sup>.')}
        <p class="er-contexte"><b>a)</b> Écrire et équilibrer l'équation-bilan de la réaction considérée comme totale. <b>b)</b> Calculer le nombre de moles d'éthanol introduit. <b>c)</b> En déduire le réactif limitant.
          <b>d)</b> Déterminer le nombre de moles des différents produits formés. <b>e)</b> En déduire la masse de CO<sub>2</sub> et la masse de vapeur d'eau générées. <b>f)</b> Quelle est l'énergie libérée par la combustion totale de l'alcool ?</p>
        ${encadreLimitant}
        ${lienApp('../../avancement-reaction/modules/module_7.html', 'Revoir le réactif limitant : application « Avancement d\'une réaction », module 7.', 'Réactif limitant')}`,
      parties: [
        schema('C2H5OH', { m0: '#m', n0: '?', n1: '#o2', n2: '?', n3: '?', m2: '?', m3: '?', E: [['PC', '#pc'], ['E', '?']] }, [
          etiq('m', '92 g', 'm', 'La masse d\'éthanol se place en haut de la colonne du combustible.'),
          etiq('o2', '9 mol', 'o2', '9 mol de dioxygène : c\'est la quantité de matière de O<sub>2</sub>, dans la colonne du dioxygène.'),
          etiq('pc', '28,8 MJ/kg', 'pc', 'Le pouvoir calorifique sert à calculer l\'énergie : ligne du bas.')],
          '<p>Deux réactifs sont donnés : 92 g d\'éthanol et 9 mol de dioxygène. Il faudra trouver lequel est limitant avant de calculer les produits formés.</p>'),
        equilibrer('C2H5OH', 'a) Écris et équilibre l\'équation de la combustion de l\'éthanol.', `<p class="co-eq">${equation('C2H5OH')}</p><p>2 atomes C : 2 CO<sub>2</sub> ; 6 atomes H : 3 H<sub>2</sub>O ; à droite 2 × 2 + 3 = 7 atomes O, dont 1 apporté par l'éthanol : 6 atomes O, soit 3 O<sub>2</sub>.</p>`),
        valeur('b) Calcule d\'abord la masse molaire de l\'éthanol.', `${Mf('C2H5OH')} =`, 46, 'gmol', U_MM,
          calc(`${Mf('C2H5OH')} = 2 × 12 + 6 × 1 + 16 = ${c('46 g/mol')}`), { tol: 0, diag: diagMM(29, 9) }),
        valeur('Puis le nombre de moles d\'éthanol introduit.', `${n('C2H5OH')} =`, 2, 'mol', U_N,
          calc(`${n('C2H5OH')} = ${frac(m('C2H5OH'), Mf('C2H5OH'))} = ${frac('92 g', '46 g/mol')} = ${c('2 mol')}`), { diag: diagN(92, 46) }),
        valeur(`c) Divise la quantité de dioxygène par son nombre stœchiométrique.`, `${frac(n('O2'), 3)} =`, 3, 'mol', U_N,
          calc(`${frac(n('O2') + '<sub>i</sub>', 3)} = ${frac('9', '3')} = ${c('3 mol')}`) + `<p>Pour l'éthanol : ${frac(n('C2H5OH') + '<sub>i</sub>', 1)} = 2 mol.</p>`,
          { diag: v => (egal(v, 27) ? 'On <b>divise</b> par le nombre stœchiométrique 3.' : egal(v, 9) ? 'Divise 9 mol par 3, le nombre stœchiométrique de O<sub>2</sub>.' : '') }),
        choix('Quel est le réactif limitant ?', [o('ok', 'l\'éthanol'), o('o2', 'le dioxygène')], 'ok',
          `${calc(`${frac(n('C2H5OH') + '<sub>i</sub>', 1)} = 2 mol &nbsp;&lt;&nbsp; ${frac(n('O2') + '<sub>i</sub>', 3)} = 3 mol`)}<p>2 &lt; 3 donc l'<b>éthanol est le réactif limitant</b> : il a complètement disparu avant le dioxygène (il reste 9 − 3 × 2 = 3 mol de O<sub>2</sub>).</p>`,
          { indices: { o2: 'Il y a plus de moles de dioxygène (9 mol) que d\'éthanol, mais il faut comparer les quantités <b>divisées par les nombres stœchiométriques</b> : 2 / 1 pour l\'éthanol, 9 / 3 pour O<sub>2</sub>. Le plus petit quotient désigne le réactif limitant.' } }),
        valeur('d) Quelle quantité de dioxyde de carbone est formée ?', `${n('CO2')} =`, 4, 'mol', U_N,
          `<p>Avec le réactif limitant, l'éthanol : ${frac(n('C2H5OH'), 1)} = ${frac(n('CO2'), 2)} = ${frac(n('H2O'), 3)}.</p>${calc(`${n('CO2')} = 2 × ${n('C2H5OH')} = 2 × 2 = ${c('4 mol')}`)}`,
          { diag: v => (egal(v, 6) ? 'Tu es parti du dioxygène. Les produits se calculent avec le <b>réactif limitant</b>, l\'éthanol : n(CO<sub>2</sub>) = 2 × n(éthanol).' : egal(v, 2) ? 'Une molécule d\'éthanol donne 2 molécules de CO<sub>2</sub> : multiplie par 2.' : egal(v, 18) ? 'Pars du réactif limitant, l\'éthanol (2 mol), pas des 9 mol de dioxygène.' : '') }),
        valeur('Quelle quantité d\'eau est formée ?', `${n('H2O')} =`, 6, 'mol', U_N,
          calc(`${n('H2O')} = 3 × ${n('C2H5OH')} = 3 × 2 = ${c('6 mol')}`),
          { diag: v => (egal(v, 9) ? 'Tu es parti du dioxygène : les produits se calculent avec le réactif limitant, l\'éthanol.' : egal(v, 4) ? 'Il se forme 3 H<sub>2</sub>O pour 1 éthanol : multiplie par 3.' : '') }),
        valeur('e) Calcule la masse de CO<sub>2</sub> formé.', `${m('CO2')} =`, 176, 'g', U_M,
          calc(`${m('CO2')} = ${n('CO2')} × ${Mf('CO2')} = 4 mol × (12 + 2 × 16) g/mol = 4 × 44 = ${c('176 g')}`),
          { diag: v => (egal(v, 4 / 44) ? 'Tu as divisé n par M : m = n × M.' : 'm = n × M, avec M(CO<sub>2</sub>) = 44 g/mol.') }),
        valeur('Calcule la masse de vapeur d\'eau formée.', `${m('H2O')} =`, 108, 'g', U_M,
          calc(`${m('H2O')} = ${n('H2O')} × ${Mf('H2O')} = 6 mol × (2 + 16) g/mol = 6 × 18 = ${c('108 g')}`),
          { diag: v => (egal(v, 6 / 18) ? 'Tu as divisé n par M : m = n × M.' : 'm = n × M, avec M(H<sub>2</sub>O) = 18 g/mol.') }),
        valeur('f) Quelle est l\'énergie libérée par la combustion totale de l\'alcool ?', 'E =', 28.8 * 0.092, 'MJ', U_E,
          `${calc(`E = PC × m<sub>éthanol</sub> = 28,8 MJ/kg × ${p10('92', '−3')} kg = ${c('2,65 MJ')}`)}<p>(92 g = ${p10('92', '−3')} kg : le pouvoir calorifique est donné par kilogramme.)</p>`,
          { diag: v => (egal(v, 28.8 * 92) ? 'Convertis la masse d\'éthanol en kg : 92 g = 0,092 kg.' : egal(v, 28.8 * 2) ? 'Le pouvoir calorifique est par <b>kg</b>, pas par mole : utilise la masse.' : '') }),
      ] },

    /* ============================ EXERCICE 21 p. 179 ============================ */
    { id: '21', groupe: 'manuel', titre: 'Exercice 21 p. 179 : chaudière à condensation', desc: '100 g de méthane : énergie de combustion (PC par mole), puis énergie récupérée en liquéfiant la vapeur d\'eau.',
      contexte: `${chaudiere}
        <p class="er-contexte">La chaudière utilisée dans une résidence est une chaudière à condensation fonctionnant au gaz naturel : le méthane. La combustion du méthane ${fH('CH4')} produit du dioxyde de carbone et de la vapeur d'eau qui transfèrent de l'énergie à l'eau du circuit de chauffage.
          Les produits de la combustion, dont la vapeur d'eau, sont ensuite mis en contact avec le serpentin dans lequel circule l'eau froide de retour du circuit de chauffage. À ce contact, la vapeur d'eau se condense en fournissant à nouveau de l'énergie thermique au circuit de chauffage.</p>
        <p class="er-contexte">La chaleur de liquéfaction est l'énergie que libère un corps en se liquéfiant (en passant de l'état gazeux à l'état liquide). Chaleur latente de liquéfaction de l'eau : L<sub>liquéfaction</sub> = −2 260 kJ·kg<sup>−1</sup>.</p>
        ${donnees(MASSES + ' ; PC du méthane : <b>802 kJ·mol<sup>−1</sup></b> (attention : par <b>mole</b>, pas par kg).')}
        <p class="er-contexte"><b>a)</b> Calculer la quantité de matière n(CH<sub>4</sub>) contenue dans 100 g de méthane. <b>b)</b> En déduire l'énergie thermique Q<sub>combustion</sub> produite par la combustion de cette même quantité de méthane.
          <b>c)</b> Écrire l'équation bilan de la réaction de combustion complète du méthane dans le dioxygène. <b>d)</b> Calculer la quantité de matière en eau n(H<sub>2</sub>O) produite par la combustion de 100 g de méthane.
          <b>e)</b> L'eau, présente tout d'abord à l'état de vapeur, va se condenser. Calculer l'énergie thermique Q<sub>condensation</sub> produite par cette condensation. <b>f)</b> En déduire l'énergie thermique totale Q<sub>totale</sub> produite dans la chaudière pour la combustion de 100 g de méthane.
          <b>g)</b> Déterminer le pourcentage d'énergie supplémentaire obtenu grâce à la condensation de la vapeur d'eau par rapport à une chaudière classique, dans laquelle la vapeur d'eau produite par la combustion n'est pas condensée mais directement évacuée.</p>`,
      parties: [
        schema('CH4', { m0: '#m', n0: '?', n3: '?', m3: '?', E: [['PC', '#pc'], ['Q<sub>comb</sub>', '?'], ['L', '#l'], ['Q<sub>liq</sub>', '?']],
          formuleE: 'Q<sub>comb</sub> = PC × n (PC par mole) ; Q<sub>liq</sub> = L × m(H<sub>2</sub>O)' }, [
          etiq('m', '100 g', 'm', 'La masse de méthane se place en haut de la colonne du combustible.'),
          etiq('pc', '802 kJ/mol', 'pc', 'Le pouvoir calorifique (par mole) donne l\'énergie de combustion : ligne du bas.'),
          etiq('l', '2 260 kJ/kg', 'l', 'La chaleur latente de liquéfaction L donne l\'énergie de la condensation : ligne du bas.')],
          '<p>Ici le pouvoir calorifique est donné <b>par mole</b> : Q<sub>comb</sub> = PC × n. La vapeur d\'eau formée (colonne de H<sub>2</sub>O) libère encore de l\'énergie en se liquéfiant : Q<sub>liq</sub> = L × m(H<sub>2</sub>O).</p>'),
        valeur('a) Calcule la quantité de matière de méthane contenue dans 100 g.', `${n('CH4')} =`, 6.25, 'mol', U_N,
          calc(`${n('CH4')} = ${frac(m('CH4'), Mf('CH4'))} = ${frac('100 g', '(12 + 4) g/mol')} = ${c('6,25 mol')}`), { diag: diagN(100, 16) }),
        sci('b) Calcule l\'énergie thermique produite par la combustion.', 'Q<sub>comb</sub> =', 802 * 6.25, 'kJ',
          `<p>Le pouvoir calorifique est en kJ par <b>mole</b> : on le multiplie par la quantité de matière (kJ·mol<sup>−1</sup> × mol → kJ).</p>${calc(`Q<sub>comb</sub> = PC × ${n('CH4')} = 802 kJ/mol × 6,25 mol = ${c(p10('5,01', '3') + ' kJ')}`)}`,
          { cs: 3, diag: v => (egal(v, 802 * 100) || egal(v, 802 * 0.1) ? 'Ici le PC est donné <b>par mole</b> (kJ/mol) : multiplie-le par la quantité de matière n, pas par la masse.' : egal(v, 802 / 6.25) ? 'Q = PC × n : on multiplie.' : '') }),
        equilibrer('CH4', 'c) Écris l\'équation bilan de la combustion complète du méthane.', `<p class="co-eq">${equation('CH4')}</p>`),
        valeur('d) Calcule la quantité de matière d\'eau produite.', `${n('H2O')} =`, 12.5, 'mol', U_N,
          `<p>D'après l'équation de la réaction : ${frac(n('H2O'), 2)} = ${frac(n('CH4'), 1)}, donc</p>${calc(`${n('H2O')} = 2 × ${n('CH4')} = 2 × 6,25 = ${c('12,5 mol')}`)}`,
          { diag: v => (egal(v, 6.25) ? 'Une molécule de méthane donne 2 molécules d\'eau : multiplie par 2.' : egal(v, 3.125) ? 'Il se forme 2 fois <b>plus</b> d\'eau que de méthane consommé.' : '') }),
        valeur('e) Calcule la masse de vapeur d\'eau produite.', `${m('H2O')} =`, 225, 'g', U_M,
          calc(`${m('H2O')} = ${n('H2O')} × ${Mf('H2O')} = 12,5 mol × (2 + 16) g/mol = ${c('225 g')}`),
          { diag: v => (egal(v, 12.5 / 18) ? 'Tu as divisé n par M : m = n × M.' : 'm = n × M, avec M(H<sub>2</sub>O) = 18 g/mol.') }),
        valeur('Calcule l\'énergie thermique produite par cette condensation.', 'Q<sub>liq</sub> =', 2260 * 0.225, 'kJ', ['kJ', 'MJ', 'MJkg'],
          `${calc(`Q<sub>liq</sub> = |L<sub>liquéfaction</sub>| × ${m('H2O')} = 2 260 kJ/kg × ${p10('225', '−3')} kg = ${c('508,5 kJ')}`)}
          <p>Le signe − de L indique que l'eau <b>cède</b> cette énergie ; le circuit de chauffage la reçoit : 508,5 kJ.</p>
          <p>Remarque de la correction : Q<sub>condensation</sub> devrait s'appeler Q<sub>liquéfaction</sub> (la vapeur d'eau devient liquide).</p>`,
          { diag: v => (egal(v, 2260 * 225) ? 'L est en kJ par <b>kg</b> : convertis 225 g en kg.' : egal(v, 2260 * 12.5) ? 'L est par kilogramme : utilise la masse d\'eau (en kg), pas la quantité de matière.' : '') }),
        sci('f) Calcule l\'énergie thermique totale produite dans la chaudière.', 'Q<sub>totale</sub> =', 802 * 6.25 + 2260 * 0.225, 'kJ',
          calc(`Q<sub>totale</sub> = Q<sub>comb</sub> + Q<sub>liq</sub> = ${p10('5,01', '3')} + 508,5 = ${c(p10('5,52', '3') + ' kJ')}`),
          { cs: 3, diag: v => (egal(v, 802 * 6.25 - 508.5) ? 'Les deux énergies sont <b>reçues</b> par le circuit de chauffage : on les additionne.' : '') }),
        valeur('g) Quel pourcentage d\'énergie supplémentaire la condensation apporte-t-elle, par rapport à une chaudière classique ?', 'gain =', 2260 * 0.225 / (802 * 6.25) * 100, 'pct', null,
          `<p>Une chaudière classique ne récupère que Q<sub>comb</sub>. La condensation apporte 508,5 kJ en plus de ${p10('5,01', '3')} kJ :</p>${calc(`${frac('Q<sub>liq</sub>', 'Q<sub>comb</sub>')} = ${frac('508,5', p10('5,01', '3'))} = 0,10 = ${c('10 %')}`)}`,
          { uniteFixe: true, tol: .03, diag: v => (egal(v, 508.5 / 5521 * 100, .02) ? 'On compare à une chaudière <b>classique</b> : divise par Q<sub>comb</sub> (5,01 × 10<sup>3</sup> kJ), pas par le total.' : egal(v, 0.1014, .03) ? 'C\'est la proportion : multiplie par 100 pour l\'avoir en pourcentage.' : '') }),
      ] },

    /* ============================ SUJET DE BAC A ============================ */
    { id: 'A', groupe: 'bac', titre: 'Sujet de bac A : l\'avion au kérosène', desc: 'Solar Impulse 2 : pictogramme, équation, quantité de matière, masse de CO₂ en 24 h puis en 560 h.',
      contexte: `<p class="er-contexte">Le 26 juillet 2016, l'avion <i>Solar Impulse 2</i> a atterri à Abou Dhabi, aux Émirats arabes unis, après avoir effectué un tour du monde de 43 041 km avec, comme seule source d'énergie, l'énergie solaire.
          L'objectif de cet exercice est d'évaluer la masse en dioxyde de carbone qu'aurait rejetée un avion de mêmes caractéristiques réalisant un vol identique en tous points, mais consommant comme carburant du kérosène.</p>
        <p class="er-contexte"><b>Document : caractéristiques du kérosène</b></p>
        <div class="ph-defile"><table class="ph-tableau co-doc"><tbody>
          <tr><th>Formule brute</th><td>Mélange d'hydrocarbures. La formule chimique sera assimilée à ${fH('C10H22')}.</td></tr>
          <tr><th>État physique à 15 °C</th><td>Liquide</td></tr><tr><th>Masse molaire moléculaire M</th><td>142 g·mol<sup>−1</sup></td></tr>
          <tr><th>Pictogrammes de sécurité</th><td>${pictos}</td></tr></tbody></table></div>
        <p class="er-contexte">En considérant un vol identique en tous points (durée, vitesse, énergie nécessaire à la propulsion), on estime à <b>500 kg</b> la masse de kérosène nécessaire pour un vol de <b>24 h</b>.
          La durée de vol effective de <i>Solar Impulse 2</i> lors de son tour du monde a été de <b>560 h</b>.</p>
        ${donnees('masses molaires atomiques M(C) = 12,0 g·mol<sup>−1</sup> ; M(O) = 16,0 g·mol<sup>−1</sup>.')}
        <p class="er-contexte"><b>1.</b> Donner la signification du pictogramme de sécurité entouré ainsi que les précautions associées. <b>2.</b> Recopier et compléter l'équation de combustion du kérosène : 2 ${fH('C10H22')} + … ${fH('O2')} → 20 ${fH('CO2')} + … ${fH('H2O')}.
          <b>3.</b> Calculer la quantité de matière n<sub>k</sub> de kérosène nécessaire à ce vol de 24 h. <b>4.</b> Montrer que la quantité de matière n<sub>CO<sub>2</sub></sub> de dioxyde de carbone rejetée durant un vol de 24 h vaut ${p10('3,52', '4')} mol.
          <b>5.</b> Calculer la masse m<sub>CO<sub>2</sub></sub> de dioxyde de carbone rejetée durant ce vol de 24 h. <b>6.</b> En déduire la masse de dioxyde de carbone qu'aurait rejetée un avion consommant du kérosène, en nombre entier de tonnes.</p>`,
      parties: [
        choix('1. Que signifie le pictogramme entouré (la flamme) ?', [o('comb', 'comburant'), o('ok', 'inflammable'), o('expl', 'explosif'), o('tox', 'toxique')], 'ok',
          '<p>La flamme seule signifie <b>inflammable</b>.</p>',
          { indices: { comb: 'Le pictogramme « comburant » montre une flamme <b>au-dessus d\'un cercle</b> ; ici, la flamme est seule.', expl: 'Le pictogramme « explosif » montre une bombe qui éclate.', tox: 'Le pictogramme « toxique » montre une tête de mort.' } }),
        choix('Quelles précautions faut-il prendre ?', [
          o('ok', 'manipuler le kérosène loin de toute flamme ou étincelle et le conserver à l\'abri de la chaleur'),
          o('gants', 'porter seulement des gants, car il attaque la peau'), o('eau', 'le diluer dans l\'eau avant de l\'utiliser')], 'ok',
          '<p>Il faut <b>manipuler le kérosène loin de toute flamme ou étincelle et le conserver à l\'abri de la chaleur</b>.</p>',
          { indices: { gants: 'Ce pictogramme signale un risque d\'incendie : la précaution concerne les flammes, les étincelles et la chaleur.', eau: 'Le kérosène est un risque d\'incendie : il faut l\'éloigner des flammes, des étincelles et de la chaleur.' } }),
        schema('C10H22', { m0: '#m', M0: '#mm', n0: '?', n2: '#n2', m2: '?' }, [
          etiq('m', '500 kg', 'm', 'La masse de kérosène brûlé en 24 h se place en haut de la colonne du combustible.'),
          etiq('mm', '142 g/mol', 'mm', 'La masse molaire du kérosène se place avec sa masse, dans la colonne du combustible.'),
          etiq('n2', p10('3,52', '4') + ' mol', 'n2', 'La quantité de matière de CO<sub>2</sub> à retrouver se place sous la relation, dans la colonne du CO<sub>2</sub>.')],
          '<p>On part de la masse de kérosène (500 kg) et de sa masse molaire (142 g/mol) ; la question 4 donne la valeur à retrouver pour n(CO<sub>2</sub>) ; on cherche ensuite la masse de CO<sub>2</sub>.</p>'),
        equilibrer('C10H22', '2. Complète l\'équation : ajuste les nombres devant O<sub>2</sub> et H<sub>2</sub>O.',
          `<p class="co-eq">${equation('C10H22')}</p><p>On équilibre l'hydrogène : 2 × 22 = 44 atomes H à gauche, donc 22 H<sub>2</sub>O. Puis l'oxygène : 20 × 2 + 22 × 1 = 62 atomes O à droite, donc 31 O<sub>2</sub>.</p>`,
          { depart: [2, 1, 20, 1], max: 40 }),
        valeur('3. Calcule la quantité de matière n<sub>k</sub> de kérosène nécessaire au vol de 24 h.', 'n<sub>k</sub> =', 500e3 / 142, 'mol', U_N,
          `<p>La masse molaire est en g/mol : 500 kg = 500 × 10<sup>3</sup> g.</p>${calc(`n<sub>k</sub> = ${frac('m<sub>k</sub>', 'M<sub>k</sub>')} = ${frac('500 × 10<sup>3</sup> g', '142 g/mol')} = ${c('3 521 mol')}`)}`,
          { diag: diagN(500e3, 142, 500 / 142) }),
        choix(`4. D'après l'équation, n<sub>CO<sub>2</sub></sub> = … × n<sub>k</sub>`, [o('20', '20'), o('ok', '10'), o('2', '2'), o('f', frac(1, 10))], 'ok',
          `<p>Pour 2 moles de kérosène consommées, 20 moles de CO<sub>2</sub> sont formées : ${frac('n<sub>CO<sub>2</sub></sub>', 20)} = ${frac('n<sub>k</sub>', 2)}, donc n<sub>CO<sub>2</sub></sub> = 10 n<sub>k</sub>.</p>`,
          { indices: { 20: 'Le nombre stœchiométrique du kérosène vaut 2 : 2 moles de kérosène donnent 20 moles de CO<sub>2</sub>.', 2: 'C\'est le nombre stœchiométrique du kérosène : compare 2 kérosène et 20 CO<sub>2</sub>.', f: 'Il se forme <b>plus</b> de CO<sub>2</sub> que de kérosène consommé.' } }),
        sci('Calcule n<sub>CO<sub>2</sub></sub> et vérifie la valeur de l\'énoncé.', 'n<sub>CO<sub>2</sub></sub> =', 10 * 500e3 / 142, 'mol',
          calc(`n<sub>CO<sub>2</sub></sub> = 10 n<sub>k</sub> = 10 × 3 521 = ${c(p10('3,52', '4') + ' mol')}`), { cs: 3 }),
        valeur('5. Calcule la masse de dioxyde de carbone rejetée durant ce vol de 24 h.', 'm<sub>CO<sub>2</sub></sub> =', 10 * 500e3 / 142 * 44 / 1e3, 'kg', ['kg', 'g', 'mol'],
          `<p>M<sub>CO<sub>2</sub></sub> = M<sub>C</sub> + 2 × M<sub>O</sub> = 12 + 2 × 16 = 44 g/mol = 44 × 10<sup>−3</sup> kg/mol.</p>${calc(`m<sub>CO<sub>2</sub></sub> = n<sub>CO<sub>2</sub></sub> × M<sub>CO<sub>2</sub></sub> = ${p10('3,52', '4')} mol × 44 × 10<sup>−3</sup> kg/mol = ${c('1 549 kg')}`)}`,
          { diag: v => (egal(v, 3.52e4 / 44) ? 'Tu as divisé n par M : m = n × M.' : '') }),
        valeur('6. Quelle masse de CO<sub>2</sub> aurait rejetée l\'avion pendant les 560 h du tour du monde (en nombre entier de tonnes) ?', 'm =', 1549.3 * 560 / 24 / 1e3, 't', null,
          `<p>La masse rejetée est proportionnelle à la durée du vol :</p>${tableau('m (kg)', 't (h)', ['1 549', '24'], ['<b class="x">m</b>', '560'])}
          ${calc(`m = ${frac('1 549 × 560', '24')} ≈ 36 143 kg ≈ ${c('36 t')}`)}`,
          { uniteFixe: true, diag: v => (egal(v, 1549.3 * 560 / 1e3) ? 'Les 1 549 kg sont rejetés en 24 h : le tour du monde dure 560 h, soit 560 / 24 fois plus longtemps.' : egal(v, 1549.3 * 560 / 24) ? 'Ce résultat est en kg : convertis en tonnes (1 t = 1 000 kg).' : egal(v, 1.5493 * 24 / 560, .05) ? 'Le tour du monde dure plus longtemps (560 h) que le vol de 24 h : la masse rejetée est plus grande.' : '') }),
      ] },

    /* ============================ SUJET DE BAC B ============================ */
    { id: 'B', groupe: 'bac', titre: 'Sujet de bac B : le poêle à bois', desc: 'Cellulose : quantité de matière pour 1 MWh, masse de CO₂, bilan carbone, fluide caloporteur.',
      contexte: `<p class="er-contexte"><b>Informations sur la combustion du bois.</b> Lors de sa combustion, le bois ne fait que libérer le dioxyde de carbone utilisé pour la croissance de l'arbre dont il est tiré.
          Selon les règles de l'ADEME, les chauffages au gaz, au fioul et à l'électricité émettent respectivement 222 kg, 480 kg et environ 180 kg de CO<sub>2</sub> par MWh. Le bilan net pour le chauffage au bois est de 40 kg de CO<sub>2</sub> émis par MWh.
          Ainsi l'utilisation du bois permet de diviser les émissions de CO<sub>2</sub> par 12 par rapport au fioul et par 6 par rapport au gaz.</p>
        ${donnees(`bois assimilé à de la cellulose de formule brute ${fH('C6H10O5')} ; énergie libérée par la combustion d'un kilogramme de bois (pouvoir calorifique) : PC = 4,0 kWh·kg<sup>−1</sup> ; M(C) = 12,0 g·mol<sup>−1</sup> ; M(H) = 1,0 g·mol<sup>−1</sup> ; M(O) = 16,0 g·mol<sup>−1</sup>.`)}
        <p class="er-contexte"><b>2.1.</b> Montrer que la quantité de matière de bois nécessaire à l'obtention d'une énergie de 1 MWh est proche de ${p10('1,5', '3')} mol. <b>2.2.</b> Calculer alors la masse de dioxyde de carbone libérée lors de la combustion du bois afin d'obtenir 1 MWh d'énergie.
          <b>2.3.</b> Expliquer pourquoi la valeur trouvée est très supérieure à celle donnée par l'ADEME. Expliquer l'intérêt écologique d'avoir installé un poêle à bois au refuge plutôt qu'un autre système de chauffage (fioul ou gaz).</p>
        <p class="er-contexte"><b>3. Aspect « thermique » des panneaux.</b> Les panneaux solaires thermiques fonctionnent grâce à un fluide caloporteur (mélange eau-propylène glycol) qui y circule et est chauffé par le rayonnement solaire. Cette énergie thermique est ensuite fournie au ballon d'eau chaude.</p>
        <p class="er-contexte">Formule semi-développée de la molécule de propylène glycol :</p>${glycol}${tableGlycol}
        <p class="er-contexte"><b>3.1.</b> Recopier la formule semi-développée de la molécule de propylène glycol et entourer les groupes caractéristiques. Nommer ce(s) groupe(s). <b>3.2.</b> Expliquer pourquoi on ne peut pas utiliser l'eau pure comme fluide caloporteur, notamment dans le cas d'un refuge de montagne, et préciser l'intérêt d'employer le propylène glycol.</p>`,
      parties: [
        schema('C6H10O5', { m0: '?', n0: '#n0', n2: '?', m2: '?', E: [['E', '#e'], ['PC', '#pc']], formuleE: 'E = PC × m, donc m = E / PC' }, [
          etiq('e', '1 MWh', 'e', 'L\'énergie à obtenir se place sur la ligne de l\'énergie.'),
          etiq('pc', '4,0 kWh/kg', 'pc', 'Le pouvoir calorifique se place sur la ligne de l\'énergie.'),
          etiq('n0', p10('1,5', '3') + ' mol', 'n0', 'La quantité de matière de bois à retrouver se place dans la colonne du combustible, sous sa masse.')],
          '<p>Cette fois, on part de l\'énergie (1 MWh) et du pouvoir calorifique (4,0 kWh/kg) pour trouver la masse de bois, puis sa quantité de matière (à comparer à 1,5 × 10<sup>3</sup> mol), puis la masse de CO<sub>2</sub> formé.</p>'),
        valeur('2.1. Calcule la masse de bois nécessaire pour obtenir 1 MWh.', `${m('C6H10O5')} =`, 250, 'kg', ['kg', 'g', 'mol'],
          `${calc(`E = PC × m donc m = ${frac('E', 'PC')}`)}<p>1 MWh = 1 000 kWh, car PC est en kWh/kg :</p>${calc(`${m('C6H10O5')} = ${frac('1 000 kWh', '4,0 kWh/kg')} = ${c('250 kg')}`)}`,
          { diag: v => (egal(v, 0.25) ? 'Convertis 1 MWh en kWh : 1 MWh = 1 000 kWh, comme le pouvoir calorifique est en kWh/kg.' : egal(v, 4000) || egal(v, 4) ? 'E = PC × m, donc m = E / PC : on divise l\'énergie par le pouvoir calorifique.' : '') }),
        valeur('Calcule la masse molaire de la cellulose.', `${Mf('C6H10O5')} =`, 162, 'gmol', U_MM,
          calc(`${Mf('C6H10O5')} = 6 × M(C) + 10 × M(H) + 5 × M(O) = 6 × 12 + 10 × 1 + 5 × 16 = ${c('162 g/mol')}`), { tol: 0, diag: diagMM(29, 21) }),
        sci('Calcule la quantité de matière de bois et compare à la valeur de l\'énoncé.', `${n('C6H10O5')} =`, 250e3 / 162, 'mol',
          calc(`${n('C6H10O5')} = ${frac(m('C6H10O5'), Mf('C6H10O5'))} = ${frac('250 × 10<sup>3</sup> g', '162 g/mol')} = 1 543 mol, soit ${c(p10('1,5', '3') + ' mol')}`),
          { tol: .035, diag: diagN(250e3, 162, 250 / 162) }),
        equilibrer('C6H10O5', '2.2. Écris l\'équation de la combustion de la cellulose.', `<p class="co-eq">${equation('C6H10O5')}</p><p>Le dioxygène est en large excès : la cellulose est le réactif limitant.</p>`),
        sci('Quelle quantité de CO<sub>2</sub> est formée ?', `${n('CO2')} =`, 6 * 250e3 / 162, 'mol',
          calc(`${frac(n('CO2'), 6)} = ${frac(n('C6H10O5'), 1)} donc ${n('CO2')} = 6 × ${n('C6H10O5')} = 6 × 1 543 = ${c(p10('9,26', '3') + ' mol')}`),
          { tol: .04, cs: 3, diag: v => (egal(v, 250e3 / 162, .04) ? 'Une molécule de cellulose donne 6 molécules de CO<sub>2</sub> : multiplie par 6.' : '') }),
        sci('Calcule la masse de dioxyde de carbone libérée pour obtenir 1 MWh.', `${m('CO2')} =`, 6 * 250e3 / 162 * 44 / 1e3, 'kg',
          `${calc(`${m('CO2')} = ${n('CO2')} × ${Mf('CO2')} = ${p10('9,26', '3')} mol × 44 g/mol = ${p10('4,07', '5')} g ≈ ${c(p10('4,0', '2') + ' kg')}`)}
          <p>La correction arrondit d'abord n à ${p10('1,5', '3')} mol : n(CO<sub>2</sub>) = 6 × ${p10('1,5', '3')} = ${p10('9', '3')} mol, puis m = ${p10('9', '3')} × 44 = 396 kg. Avec n = 1 543 mol, on trouve 407 kg.
            Les deux arrondissent à ${p10('4,0', '2')} kg ; pour éviter cet écart, on garde la valeur non arrondie dans la calculatrice et on n'arrondit que le résultat final.</p>`,
          { tol: .04, diag: v => (egal(v, 6 * 250e3 / 162 * 44, .04) ? 'Ce résultat est en grammes : convertis en kg (÷ 1 000).' : egal(v, 250e3 / 162 * 44 / 1e3, .04) ? 'Utilise n(CO<sub>2</sub>) = 6 × n(cellulose), pas la quantité de cellulose.' : '') }),
        choix('2.3. Pourquoi la valeur trouvée est-elle très supérieure aux 40 kg par MWh de l\'ADEME ?', [
          o('pc', 'le pouvoir calorifique du bois est surestimé'),
          o('ok', 'le bois n\'est pas constitué que de cellulose : le modèle est très simplifié, et l\'ADEME donne un bilan net'),
          o('o2', 'le dioxygène est le réactif limitant')], 'ok',
          '<p>En réalité, <b>le bois n\'est pas seulement constitué de cellulose</b> : l\'hypothèse est très simplificatrice. De plus, l\'ADEME compte un bilan <b>net</b> : le CO<sub>2</sub> libéré avait été absorbé par l\'arbre pendant sa croissance.</p>',
          { indices: { pc: 'Le pouvoir calorifique est une donnée de l\'énoncé ; c\'est le modèle « bois = cellulose » qui est très simplifié.', o2: 'Le dioxygène de l\'air est en large excès : la cellulose est le réactif limitant.' } }),
        choix('Quel est l\'intérêt écologique d\'un poêle à bois plutôt qu\'un chauffage au fioul ou au gaz ?', [
          o('ok', 'son bilan carbone est bien plus faible : 40 kg de CO<sub>2</sub> par MWh, contre 480 kg (fioul) et 222 kg (gaz)'),
          o('zero', 'il ne rejette aucun dioxyde de carbone'), o('pc', 'le bois a un pouvoir calorifique plus grand que le fioul et le gaz')], 'ok',
          '<p>L\'intérêt majeur d\'un poêle à bois est le faible rejet de CO<sub>2</sub> par rapport au fioul ou au gaz : <b>l\'impact environnemental est bien plus faible</b> (émissions divisées par 12 par rapport au fioul, par 6 par rapport au gaz).</p>',
          { indices: { zero: 'La combustion du bois rejette du CO<sub>2</sub> (tu viens de le calculer) ; c\'est le bilan <b>net</b> qui est faible.', pc: 'Le pouvoir calorifique du bois (4,0 kWh/kg) n\'est pas plus grand ; c\'est le bilan carbone qui compte ici.' } }),
        choix('3.1. Quels groupes caractéristiques la molécule de propylène glycol contient-elle ?', [
          o('un', 'un groupe hydroxyle −OH'), o('ok', 'deux groupes hydroxyle −OH'), o('carb', 'deux groupes carboxyle −COOH')], 'ok',
          `${glycol}<p>Les deux groupes −OH liés aux atomes de carbone sont des <b>groupes hydroxyle</b> : il y en a <b>2</b>.</p>`,
          { indices: { un: 'Compte les groupes OH sur la formule : il y en a sur deux atomes de carbone.', carb: 'Un groupe carboxyle −COOH contient un atome O doublement lié au carbone ; ici, il n\'y a que des groupes −OH.' } }),
        choix('3.2. Pourquoi ne peut-on pas utiliser l\'eau pure comme fluide caloporteur dans un refuge de montagne ?', [
          o('ebu', 'l\'eau pure bouillirait au soleil'),
          o('ok', 'l\'eau pure gèlerait en hiver (fusion à 0 °C) ; le propylène glycol, miscible à l\'eau, abaisse la température de fusion du mélange'),
          o('rho', 'l\'eau pure est trop lourde : le propylène glycol diminue la masse volumique')], 'ok',
          '<p>En montagne, l\'hiver, la température descend souvent sous 0 °C : <b>l\'eau pure se solidifierait</b> et empêcherait la circulation du fluide. Le propylène glycol fond à −59 °C et il est miscible à l\'eau : <b>la température de fusion du mélange est abaissée</b>, le fluide ne gèle pas.</p>',
          { indices: { ebu: 'Le problème, en montagne, c\'est le froid de l\'hiver : regarde la température de fusion du propylène glycol (−59 °C).', rho: 'La masse volumique du propylène glycol (1 036 kg/m<sup>3</sup>) est proche de celle de l\'eau ; regarde plutôt sa température de fusion.' } }),
      ] },
  ];

  Object.assign(window.CO, { EXERCICES, GROUPES_EX });
})();
