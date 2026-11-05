/* ============================================================
   Exercices du module 6 (application « Chapitre 15 : Oxydoréduction
   (piles et accumulateurs) ») : les exercices 1 à 11 de la feuille,
   dans l'ordre et avec leur numérotation.

   Chaque exercice : { id, groupe, titre, desc, contexte (HTML),
   parties: fonction qui les fabrique } ; chaque partie suit le format
   de OX.PARTIES avec p.q (question) et p.correction (correction
   détaillée : formule, grandeur isolée, application numérique avec les
   unités). Outils : OX.methode (schéma de la méthode à compléter, puis
   les calculs, assets/schema-methode.js) en première partie de chaque
   calcul (ex. 1 à 4, 9.6, 10, 11) ; PILE.monter (pile/pile.js) en
   partie d'exercice pour les schémas de pile (ex. 8 et 9).

   Valeurs vérifiées par un script :
     ex. 1 : Cu²⁺ + Fe → Cu + Fe²⁺ ; n(Fe²⁺) = 2,0 mol ;
     ex. 2 : Cu + Fe²⁺ → Cu²⁺ + Fe ; n(Cu) = 3,5 / 64 = 0,0547 ≈ 0,055 mol = n(Fe) ;
     ex. 3 : Cu²⁺ + 2 Fe²⁺ → Cu + 2 Fe³⁺ ; n(Cu²⁺) = 7,5 × 10⁻³ mol ; n(Fe³⁺) = 1,5 × 10⁻² mol ;
       c(Fe³⁺) = 0,50 mol/L ; m(Cu) = 0,48 g ;
     ex. 4 : Cu + 2 Fe³⁺ → Cu²⁺ + 2 Fe²⁺ ; n(Cu) = 1,5 × 10⁻² mol ; m(Cu) = 0,96 g ;
     ex. 5 : Cr₂O₇²⁻ + 14 H⁺ + 3 Fe → 2 Cr³⁺ + 7 H₂O + 3 Fe²⁺ ;
     ex. 6 : Ca + 2 H⁺ → Ca²⁺ + H₂ ;
     ex. 7 : 2 H₂O₂ → 2 H₂O + O₂ (après simplification des 2 H⁺) ;
     ex. 8 : Zn anode (−), Cu cathode (+), Zn + Cu²⁺ → Zn²⁺ + Cu ;
     ex. 9 : Cu + 2 Ag⁺ → Cu²⁺ + 2 Ag ; n(Cu) = 7,87 × 10⁻³ mol ; n(Ag) = 1,57 × 10⁻² mol ; m(Ag) = 1,70 g ≈ 1,7 g ;
     ex. 10 : 2 H₂ + O₂ → 2 H₂O ; n(H₂) = 250 mol ; n(e⁻) = 500 mol ; V = 6 000 L = 6 m³ ;
     ex. 11 : 2 NiO(OH) + 2 H₂O + Cd → 2 Ni(OH)₂ + Cd(OH)₂ ; Q = 5 760 C ; n(e⁻) = 5,97 × 10⁻² ≈ 6,0 × 10⁻² mol ;
       M(NiO(OH)) = 91,7 g/mol ; m = 5,47 ≈ 5,5 g ; E = 6 912 J ≈ 6,9 × 10³ J.
   Écarts avec la feuille :
     ex. 2 : l'énoncé dit « entre Fe et Cu²⁺ », mais la question (cuivre consommé, fer produit)
       et la correction traitent Cu + Fe²⁺ → Cu²⁺ + Fe : l'énoncé écrit « entre Cu et Fe²⁺ » ;
     ex. 7 : la correction manuscrite écrit « H₂O + 2 H⁺ + H₂O₂ » à gauche avant de simplifier :
       c'est H₂O₂ + 2 H⁺ + H₂O₂ (le résultat 2 H₂O₂ → 2 H₂O + O₂ est juste) ;
     ex. 8 : l'appareil du schéma est un ampèremètre (A), affiché comme tel sur le schéma de la pile.
   ============================================================ */
(function () {
  'use strict';

  const { o, fmt, cs, sci, fr, egal, nE, UNITE, FARADAY, methode, figPile } = window.OX;
  const E = 'e<sup>−</sup>', H = 'H<sup>+</sup>', EAU = 'H<sub>2</sub>O';
  const calc = h => `<p class="ph-calc">${h}</p>`;
  const c = h => `<span class="c">${h}</span>`;
  const donnees = l => `<p class="ph-donnees">Données : ${l.join(' ; ')}.</p>`;
  // fabriques de parties
  const choix = (q, options, bonne, correction, opts) => Object.assign({ type: 'choix', q, options, bonne, correction, colonne: options.some(x => x.label.replace(/<[^>]+>/g, '').length > 24) }, opts);
  const nombre = (q, label, valeur, unite, correction, opts) => Object.assign({ type: 'nombre', q, label, valeur, unite, correction, signe: false, rel: .02 }, opts);

  /* ---------- Écrire l'équation : orienter, multiplier, additionner ----------
     demis [{ html (demi-équation donnée), inv (true : à inverser), oriente (écrite dans le bon sens), role }]
     mult [m1, m2] ; esp [[formule, nombre], …] dans l'ordre de l'équation ; g : nombre de réactifs */
  function orienter(demis, correction) {
    return { type: 'grille', q: 'Oriente chaque demi-équation : le réactif doit être à gauche de la flèche.',
      options: [o('garder', 'garder le sens'), o('inv', 'inverser')],
      lignes: demis.map((d, i) => ({ id: 'd' + i, label: d.html, bonne: d.inv ? 'inv' : 'garder',
        indice: d.inv ? `Le réactif de ce couple est à droite du signe = : il faut inverser la demi-équation (${d.role}).` : `Le réactif de ce couple est déjà à gauche : on garde le sens (${d.role}).`,
        apres: calc(`${d.oriente} &nbsp;(${d.role})`) })),
      correction: correction || `<p>On écrit chaque demi-équation avec son réactif à gauche :</p>${calc(demis.map(d => d.oriente).join('<br>'))}` };
  }
  function multiplier(m, n, demis) {
    return { type: 'gabarit', q: 'Par combien multiplies-tu chaque demi-équation pour avoir autant d\'électrons des deux côtés ?',
      morceaux: [{ v: m[0], signe: false, aria: 'Multiplicateur de la première demi-équation' }, '× la 1<sup>re</sup> ;', { v: m[1], signe: false, aria: 'Multiplicateur de la seconde demi-équation' }, '× la 2<sup>de</sup>'],
      diag: vs => {
        const e1 = vs[0] * n[0], e2 = vs[1] * n[1];
        if (e1 === e2) return `Les électrons sont bien égaux (${e1} de chaque côté), mais prends les plus petits multiplicateurs.`;
        return `Avec tes valeurs, la 1<sup>re</sup> échange ${e1} électron(s), la 2<sup>de</sup> ${e2}. Il en faut autant des deux côtés.`;
      },
      correction: calc(demis.map((d, i) => `${m[i]} × ( ${d.oriente} )`).join('<br>')) + `<p>${m[0] * n[0]} électrons de chaque côté.</p>` };
  }
  function equationTrous(esp, g, correction, diag) {
    const morceaux = [];
    esp.forEach(([f, k], i) => {
      morceaux.push({ v: k, signe: false, aria: 'Nombre stœchiométrique de ' + f.replace(/<[^>]+>/g, '') });
      morceaux.push(f + (i === esp.length - 1 ? '' : i === g - 1 ? ' →' : ' +'));
    });
    return { type: 'gabarit', q: 'Écris l\'équation de la réaction : complète les nombres stœchiométriques (1 s\'il n\'y a pas de nombre).',
      morceaux, diag: diag || (() => 'Additionne les demi-équations multipliées : chaque espèce garde le nombre écrit dans sa demi-équation, multiplié. Les électrons s\'éliminent.'),
      correction };
  }
  const eqTexte = (esp, g) => esp.slice(0, g).map(([f, k]) => (k === 1 ? '' : k + ' ') + f).join(' + ') + ' → ' + esp.slice(g).map(([f, k]) => (k === 1 ? '' : k + ' ') + f).join(' + ');

  // espèces des exercices (formule, nom, masse molaire de l'énoncé)
  const sp = (f, coef, nom, M) => ({ f, coef, nom, M });
  const CU2 = 'Cu<sup>2+</sup>', FE2 = 'Fe<sup>2+</sup>', FE3 = 'Fe<sup>3+</sup>', AG = 'Ag<sup>+</sup>';

  // outil « schéma d'une pile » (pile/pile.js) comme partie d'exercice
  const partiePile = (q, def, correction) => ({ type: 'perso', q, correction, monter: (zone, api) => {
    const d = document.createElement('div');
    zone.appendChild(d);
    const outil = window.PILE.monter(d, { questions: [def], partie: { reussi: () => api.reussi(), erreur: h => api.erreur(h), compterErreur: () => api.compterErreur() } });
    return { montrer() { outil.montrer(); } };
  } });

  /* ---------- Exercice 1 ---------- */
  const ex1 = { id: '1', groupe: 'calcul', titre: 'Exercice 1 : Cu<sup>2+</sup> et Fe', desc: 'Écrire la réaction, puis n(Fe<sup>2+</sup>) produit d\'après n(Cu<sup>2+</sup>)',
    contexte: `<p class="er-contexte">Écrire la réaction d'oxydoréduction entre Cu<sup>2+</sup> et Fe.</p>
      ${donnees([`couples oxydant/réducteur : Cu<sup>2+</sup>/Cu : Cu<sup>2+</sup> + 2 ${E} = Cu`, `Fe<sup>2+</sup>/Fe : Fe<sup>2+</sup> + 2 ${E} = Fe`])}
      <p class="er-contexte" style="margin-top:8px">On fait disparaître 2,0 mol de Cu<sup>2+</sup>. Quelle est la quantité de matière de Fe<sup>2+</sup> produite ?</p>`,
    parties: () => {
      const esp = [[CU2, 1], ['Fe', 1], ['Cu', 1], [FE2, 1]];
      const M = methode({ especes: [sp(CU2, 1, 'ions cuivre'), sp('Fe', 1, 'fer'), sp('Cu', 1, 'cuivre'), sp(FE2, 1, 'ions fer(II)')], produits: 2,
        depart: { k: 0, n: 2.0, nTxt: '2,0 mol' }, cible: { k: 3, quoi: 'n' }, autres: [1, 2], cs: 2,
        q: { nB: 'Quelle est la quantité de matière de Fe<sup>2+</sup> produite ?' } });
      return [
        orienter([{ html: `Cu<sup>2+</sup> + 2 ${E} = Cu`, inv: false, oriente: `Cu<sup>2+</sup> + 2 ${E} → Cu`, role: 'réduction' },
                  { html: `Fe<sup>2+</sup> + 2 ${E} = Fe`, inv: true, oriente: `Fe → Fe<sup>2+</sup> + 2 ${E}`, role: 'oxydation' }]),
        equationTrous(esp, 2, `<p>Les deux demi-équations échangent 2 électrons : on les additionne directement.</p>${calc(`Cu<sup>2+</sup> + 2 ${E} → Cu<br>Fe → Fe<sup>2+</sup> + 2 ${E}`)}${calc(c(eqTexte(esp, 2)))}`),
      ].concat(M.parties);
    } };

  /* ---------- Exercice 2 ---------- */
  const ex2 = { id: '2', groupe: 'calcul', titre: 'Exercice 2 : Cu et Fe<sup>2+</sup>', desc: 'Écrire la réaction, puis n(Fe) produit d\'après 3,5 g de cuivre',
    contexte: `<p class="er-contexte">Écrire la réaction d'oxydoréduction entre Cu et Fe<sup>2+</sup>.</p>
      ${donnees([`couples oxydant/réducteur : Cu<sup>2+</sup>/Cu : Cu<sup>2+</sup> + 2 ${E} = Cu`, `Fe<sup>2+</sup>/Fe : Fe<sup>2+</sup> + 2 ${E} = Fe`])}
      <p class="er-contexte" style="margin-top:8px">On fait disparaître 3,5 g de cuivre Cu. Quelle est la quantité de matière de Fe produite ?</p>
      ${donnees([`M(Cu) = 64 ${UNITE.M}`])}`,
    parties: () => {
      const esp = [['Cu', 1], [FE2, 1], [CU2, 1], ['Fe', 1]];
      const M = methode({ especes: [sp('Cu', 1, 'cuivre', 64), sp(FE2, 1, 'ions fer(II)'), sp(CU2, 1, 'ions cuivre'), sp('Fe', 1, 'fer')], produits: 2,
        depart: { k: 0, m: 3.5, M: 64 }, cible: { k: 3, quoi: 'n' }, autres: [1, 2], cs: 2,
        q: { nA: 'Calcule la quantité de matière de cuivre consommé.', nB: 'Quelle est la quantité de matière de Fe produite ?' } });
      return [
        orienter([{ html: `Cu<sup>2+</sup> + 2 ${E} = Cu`, inv: true, oriente: `Cu → Cu<sup>2+</sup> + 2 ${E}`, role: 'oxydation' },
                  { html: `Fe<sup>2+</sup> + 2 ${E} = Fe`, inv: false, oriente: `Fe<sup>2+</sup> + 2 ${E} → Fe`, role: 'réduction' }]),
        equationTrous(esp, 2, `${calc(`Cu → Cu<sup>2+</sup> + 2 ${E}<br>Fe<sup>2+</sup> + 2 ${E} → Fe`)}${calc(c(eqTexte(esp, 2)))}`),
      ].concat(M.parties);
    } };

  /* ---------- Exercice 3 ---------- */
  const ex3 = { id: '3', groupe: 'calcul', titre: 'Exercice 3 : Cu<sup>2+</sup> et Fe<sup>2+</sup>', desc: 'Écrire la réaction ; n et c de Fe<sup>3+</sup> formé, masse de cuivre produit',
    contexte: `<p class="er-contexte">Écrire la réaction d'oxydoréduction entre Cu<sup>2+</sup> et Fe<sup>2+</sup>.</p>
      ${donnees([`couples oxydant/réducteur : Cu<sup>2+</sup>/Cu : Cu<sup>2+</sup> + 2 ${E} = Cu`, `Fe<sup>3+</sup>/Fe<sup>2+</sup> : Fe<sup>3+</sup> + ${E} = Fe<sup>2+</sup>`])}
      <p class="er-contexte" style="margin-top:8px">On dispose d'une solution d'ions Cu<sup>2+</sup> à la concentration c = 0,25 ${UNITE.c}, de volume V = 30 mL.
        Quelle est la quantité de matière de Fe<sup>3+</sup> formé ? Le volume restant constant (V = 30 mL), quelle est la concentration en ions Fe<sup>3+</sup> ? Quelle est la masse de cuivre Cu produit ?</p>
      ${donnees([`M(Cu) = 64 ${UNITE.M}`])}`,
    parties: () => {
      const esp = [[CU2, 1], [FE2, 2], ['Cu', 1], [FE3, 2]];
      const especes = [sp(CU2, 1, 'ions cuivre'), sp(FE2, 2, 'ions fer(II)'), sp('Cu', 1, 'cuivre', 64), sp(FE3, 2, 'ions fer(III)')];
      const M1 = methode({ especes, produits: 2, depart: { k: 0, c: 0.25, V: 30 }, cible: { k: 3, quoi: 'c', V: 30 }, autres: [1, 2], cs: 2,
        q: { nA: 'Calcule la quantité de matière d\'ions Cu<sup>2+</sup> (V en litres).', nB: 'Quelle est la quantité de matière de Fe<sup>3+</sup> formé ?', res: 'Le volume restant constant, quelle est la concentration en ions Fe<sup>3+</sup> ?' } });
      const M2 = methode({ especes, produits: 2, depart: { k: 0, n: M1.nA }, cible: { k: 2, quoi: 'm', M: 64 }, cs: 2, sans: ['schema'],
        q: { relation: 'Masse de cuivre produit : quelle relation relie n(Cu<sup>2+</sup>) et n(Cu) ?', nB: 'Calcule la quantité de matière de cuivre produit.', res: 'Quelle est la masse de cuivre Cu produit ?' } });
      return [
        orienter([{ html: `Cu<sup>2+</sup> + 2 ${E} = Cu`, inv: false, oriente: `Cu<sup>2+</sup> + 2 ${E} → Cu`, role: 'réduction' },
                  { html: `Fe<sup>3+</sup> + ${E} = Fe<sup>2+</sup>`, inv: true, oriente: `Fe<sup>2+</sup> → Fe<sup>3+</sup> + ${E}`, role: 'oxydation' }]),
        multiplier([1, 2], [2, 1], [{ oriente: `Cu<sup>2+</sup> + 2 ${E} → Cu` }, { oriente: `Fe<sup>2+</sup> → Fe<sup>3+</sup> + ${E}` }]),
        equationTrous(esp, 2, calc(`Cu<sup>2+</sup> + 2 ${E} → Cu<br>2 Fe<sup>2+</sup> → 2 Fe<sup>3+</sup> + 2 ${E}`) + calc(c(eqTexte(esp, 2)))),
      ].concat(M1.parties, M2.parties);
    } };

  /* ---------- Exercice 4 ---------- */
  const ex4 = { id: '4', groupe: 'calcul', titre: 'Exercice 4 : Cu et Fe<sup>3+</sup>', desc: 'Écrire la réaction, puis la masse de cuivre consommée d\'après n(Fe<sup>2+</sup>)',
    contexte: `<p class="er-contexte">Écrire la réaction d'oxydoréduction entre Cu et Fe<sup>3+</sup>.</p>
      ${donnees([`couples oxydant/réducteur : Cu<sup>2+</sup>/Cu : Cu<sup>2+</sup> + 2 ${E} = Cu`, `Fe<sup>3+</sup>/Fe<sup>2+</sup> : Fe<sup>3+</sup> + ${E} = Fe<sup>2+</sup>`])}
      <p class="er-contexte" style="margin-top:8px">On a produit n(Fe<sup>2+</sup>) = 3,0 × 10<sup>−2</sup> mol. Quelle a été la masse de cuivre Cu consommée ?</p>
      ${donnees([`M(Cu) = 64 ${UNITE.M}`])}`,
    parties: () => {
      const esp = [['Cu', 1], [FE3, 2], [CU2, 1], [FE2, 2]];
      const M = methode({ especes: [sp('Cu', 1, 'cuivre', 64), sp(FE3, 2, 'ions fer(III)'), sp(CU2, 1, 'ions cuivre'), sp(FE2, 2, 'ions fer(II)')], produits: 2,
        depart: { k: 3, n: 3.0e-2, nTxt: '3,0 × 10<sup>−2</sup> mol' }, cible: { k: 0, quoi: 'm', M: 64 }, autres: [1, 2], cs: 2,
        q: { nB: 'Calcule la quantité de matière de cuivre consommé.', res: 'Quelle a été la masse de cuivre Cu consommée ?' } });
      return [
        orienter([{ html: `Cu<sup>2+</sup> + 2 ${E} = Cu`, inv: true, oriente: `Cu → Cu<sup>2+</sup> + 2 ${E}`, role: 'oxydation' },
                  { html: `Fe<sup>3+</sup> + ${E} = Fe<sup>2+</sup>`, inv: false, oriente: `Fe<sup>3+</sup> + ${E} → Fe<sup>2+</sup>`, role: 'réduction' }]),
        multiplier([1, 2], [2, 1], [{ oriente: `Cu → Cu<sup>2+</sup> + 2 ${E}` }, { oriente: `Fe<sup>3+</sup> + ${E} → Fe<sup>2+</sup>` }]),
        equationTrous(esp, 2, calc(`Cu → Cu<sup>2+</sup> + 2 ${E}<br>2 Fe<sup>3+</sup> + 2 ${E} → 2 Fe<sup>2+</sup>`) + calc(c(eqTexte(esp, 2)))),
      ].concat(M.parties);
    } };

  /* ---------- Exercice 5 ---------- */
  const CR = 'Cr<sub>2</sub>O<sub>7</sub><sup>2−</sup>';
  const ex5 = { id: '5', groupe: 'acide', titre: 'Exercice 5 : dichromate de potassium et fer', desc: 'Une demi-équation avec H<sup>+</sup> et H<sub>2</sub>O',
    contexte: `<p class="er-contexte">Écrire la réaction entre le dichromate de potassium (K<sup>+</sup>, ${CR}) et le fer (Fe).</p>
      ${donnees([`couples oxydant/réducteur : ${CR}/Cr<sup>3+</sup> : ${CR} + 14 ${H} + 6 ${E} = 2 Cr<sup>3+</sup> + 7 ${EAU}`, `Fe<sup>2+</sup>/Fe : Fe<sup>2+</sup> + 2 ${E} = Fe`])}`,
    parties: () => {
      const esp = [[CR, 1], [H, 14], ['Fe', 3], ['Cr<sup>3+</sup>', 2], [EAU, 7], [FE2, 3]];
      return [
        choix('Quelle espèce de la solution de dichromate de potassium réagit avec le fer ?', [o('cr', CR), o('k', 'K<sup>+</sup>')], 'cr',
          '<p>L\'oxydant est l\'ion dichromate : il réagit avec le fer, réducteur de l\'autre couple. K<sup>+</sup> ne fait partie d\'aucun couple : c\'est un ion spectateur, il n\'apparaît pas dans l\'équation.</p>',
          { indices: { k: 'K<sup>+</sup> n\'apparaît dans aucune des demi-équations données : c\'est un ion spectateur.' }, melanger: false }),
        orienter([{ html: `${CR} + 14 ${H} + 6 ${E} = 2 Cr<sup>3+</sup> + 7 ${EAU}`, inv: false, oriente: `${CR} + 14 ${H} + 6 ${E} → 2 Cr<sup>3+</sup> + 7 ${EAU}`, role: 'réduction' },
                  { html: `Fe<sup>2+</sup> + 2 ${E} = Fe`, inv: true, oriente: `Fe → Fe<sup>2+</sup> + 2 ${E}`, role: 'oxydation' }]),
        multiplier([1, 3], [6, 2], [{ oriente: `${CR} + 14 ${H} + 6 ${E} → 2 Cr<sup>3+</sup> + 7 ${EAU}` }, { oriente: `Fe → Fe<sup>2+</sup> + 2 ${E}` }]),
        equationTrous(esp, 3, calc(`${CR} + 14 ${H} + 6 ${E} → 2 Cr<sup>3+</sup> + 7 ${EAU}<br>3 Fe → 3 Fe<sup>2+</sup> + 6 ${E}`) + calc(c(eqTexte(esp, 3))) +
          '<p>Les 6 électrons s\'éliminent ; H<sup>+</sup> et H<sub>2</sub>O ne sont que d\'un côté : rien à simplifier.</p>',
          vs => (vs[2] === 1 ? 'Le fer cède 2 électrons, le dichromate en capte 6 : il faut 3 Fe.' : vs[1] !== 14 || vs[4] !== 7 ? 'H<sup>+</sup> et H<sub>2</sub>O gardent les nombres de leur demi-équation (multipliée par 1) : 14 H<sup>+</sup> et 7 H<sub>2</sub>O.' : 'Multiplie la demi-équation du fer par 3, puis additionne.')),
      ];
    } };

  /* ---------- Exercice 6 ---------- */
  const ex6 = { id: '6', groupe: 'acide', titre: 'Exercice 6 : le calcium dans l\'eau acide', desc: 'Ca et H<sup>+</sup> : couple H<sup>+</sup>/H<sub>2</sub>',
    contexte: `<p class="er-contexte">L'eau acide (qui contient des ions H<sup>+</sup>) réagit avec le calcium métallique. Les couples mis en jeu sont Ca<sup>2+</sup>(aq)/Ca(s) et H<sup>+</sup>(aq)/H<sub>2</sub>(g). Écrire l'équation de la réaction.</p>
      ${donnees([`les demi-équations mises en jeu sont : Ca<sup>2+</sup> + 2 ${E} = Ca`, `2 ${H} + 2 ${E} = H<sub>2</sub>`])}`,
    parties: () => {
      const esp = [['Ca', 1], [H, 2], ['Ca<sup>2+</sup>', 1], ['H<sub>2</sub>', 1]];
      return [
        orienter([{ html: `Ca<sup>2+</sup> + 2 ${E} = Ca`, inv: true, oriente: `Ca → Ca<sup>2+</sup> + 2 ${E}`, role: 'oxydation' },
                  { html: `2 ${H} + 2 ${E} = H<sub>2</sub>`, inv: false, oriente: `2 ${H} + 2 ${E} → H<sub>2</sub>`, role: 'réduction' }]),
        equationTrous(esp, 2, calc(`Ca → Ca<sup>2+</sup> + 2 ${E}<br>2 ${H} + 2 ${E} → H<sub>2</sub>`) + calc(c(eqTexte(esp, 2))),
          vs => (vs[1] === 1 ? 'La demi-équation du couple H<sup>+</sup>/H<sub>2</sub> contient 2 H<sup>+</sup>.' : 'Les deux demi-équations échangent 2 électrons : additionne-les directement.')),
      ];
    } };

  /* ---------- Exercice 7 ---------- */
  const H2O2 = 'H<sub>2</sub>O<sub>2</sub>', O2 = 'O<sub>2</sub>';
  const ex7 = { id: '7', groupe: 'acide', titre: 'Exercice 7 : dismutation de l\'eau oxygénée', desc: 'H<sub>2</sub>O<sub>2</sub> à la fois oxydant et réducteur ; simplifier H<sup>+</sup>',
    contexte: `<p class="er-contexte">L'eau oxygénée est instable car elle est à la fois oxydant et réducteur. Écrire la réaction d'oxydoréduction de dismutation de l'eau oxygénée.</p>
      ${donnees([`couples oxydant/réducteur : ${H2O2}(aq)/${EAU} : ${H2O2} + 2 ${H} + 2 ${E} = 2 ${EAU}`, `${O2}(g)/${H2O2}(aq) : ${O2} + 2 ${H} + 2 ${E} = ${H2O2}`])}`,
    parties: () => [
      choix('Quel est le seul réactif de cette réaction ?', [o('ok', H2O2), o('eau', EAU), o('o2', O2)], 'ok',
        `<p>${H2O2} est l'oxydant du couple ${H2O2}/${EAU} et le réducteur du couple ${O2}/${H2O2} : il réagit avec lui-même (dismutation).</p>`,
        { indices: { eau: `${EAU} est un produit : ${H2O2} se transforme en eau.`, o2: `${O2} est un produit : il se dégage quand ${H2O2} est oxydé.` } }),
      orienter([{ html: `${H2O2} + 2 ${H} + 2 ${E} = 2 ${EAU}`, inv: false, oriente: `${H2O2} + 2 ${H} + 2 ${E} → 2 ${EAU}`, role: 'réduction' },
                { html: `${O2} + 2 ${H} + 2 ${E} = ${H2O2}`, inv: true, oriente: `${H2O2} → ${O2} + 2 ${H} + 2 ${E}`, role: 'oxydation' }]),
      { type: 'gabarit', q: 'Additionne les deux demi-équations (2 électrons de chaque côté). Complète :',
        morceaux: [`${H2O2} + ${H2O2} +`, { v: 2, signe: false, aria: 'Nombre de H+ à gauche' }, `${H} → 2 ${EAU} + ${O2} +`, { v: 2, signe: false, aria: 'Nombre de H+ à droite' }, H],
        diag: () => 'Les deux demi-équations contiennent chacune 2 H<sup>+</sup> : 2 à gauche (réduction), 2 à droite (oxydation).',
        correction: calc(`${H2O2} + 2 ${H} + 2 ${E} → 2 ${EAU}<br>${H2O2} → ${O2} + 2 ${H} + 2 ${E}`) + calc(`${H2O2} + ${H2O2} + 2 ${H} → 2 ${EAU} + ${O2} + 2 ${H}`) },
      equationTrous([[H2O2, 2], [EAU, 2], [O2, 1]], 1,
        `<p>On simplifie : 2 H<sup>+</sup> de chaque côté s'éliminent, et ${H2O2} + ${H2O2} = 2 ${H2O2}.</p>${calc(c(`2 ${H2O2} → 2 ${EAU} + ${O2}`))}`,
        vs => (vs[0] === 1 ? `Il y a ${H2O2} dans les deux demi-équations : 2 ${H2O2} au total.` : 'Simplifie les H<sup>+</sup> (2 de chaque côté) : ils disparaissent de l\'équation.')),
    ] };

  /* ---------- Exercice 8 ---------- */
  const ex8 = { id: '8', groupe: 'piles', titre: 'Exercice 8 : la pile zinc-cuivre', desc: 'Compléter le schéma : polarités, I, e<sup>−</sup>, ions, demi-équations, équation',
    contexte: `<p class="er-contexte">L'ampèremètre affiche une valeur positive. Compléter le schéma avec la polarité des électrodes, le sens de circulation du courant et des électrons, le sens de circulation des anions et des cations dans le pont salin, les demi-équations pour chaque demi-pile, l'anode et la cathode, et l'équation de fonctionnement de la pile.</p>
      ${donnees([`couples Zn<sup>2+</sup>/Zn : Zn<sup>2+</sup> + 2 ${E} = Zn`, `Cu<sup>2+</sup>/Cu : Cu<sup>2+</sup> + 2 ${E} = Cu`, 'la borne COM de l\'ampèremètre est reliée à l\'électrode de zinc'])}`,
    parties: () => [
      partiePile('Complète le schéma de la pile, les demi-piles et l\'équation de fonctionnement (« Vérifier » contrôle tout).',
        { anode: 'Zn', cathode: 'Cu', anodeSide: 'L', hint: 'meter', appareil: 'A', gML: true, gIL: true, gMR: true, gIR: true },
        `<p>La valeur est positive : la borne COM est sur le −, donc le zinc est la borne −. Les électrons vont du zinc vers le cuivre dans les fils, le courant du cuivre vers le zinc. Dans le pont salin, les anions vont vers le zinc, les cations vers le cuivre.</p>
          ${figPile({ g: 'Zn', d: 'Cu', anode: 'g', appareil: 'A' })}
          <p>Zn = Zn<sup>2+</sup> + 2 ${E} : oxydation, donc anode ; Cu<sup>2+</sup> + 2 ${E} = Cu : réduction, donc cathode.</p>
          ${calc(c(`Zn + Cu<sup>2+</sup> → Zn<sup>2+</sup> + Cu`))}`),
    ] };

  /* ---------- Exercice 9 ---------- */
  const ex9 = { id: '9', groupe: 'piles', titre: 'Exercice 9 : la pile cuivre-argent', desc: 'Schéma, demi-équations, anode et cathode, équation ; masse d\'argent formée',
    contexte: `<p class="er-contexte">On fabrique une pile cuivre-argent en plongeant une électrode de cuivre dans une solution contenant des ions Cu<sup>2+</sup> et une électrode d'argent dans une solution contenant des ions argent Ag<sup>+</sup>. On observe que l'électrode de cuivre est consommée et qu'un dépôt d'argent se forme sur l'électrode d'argent.</p>
      <ol class="er-liste"><li>Faire le schéma de la pile.</li><li>Écrire les demi-équations dans le bon sens sous chaque demi-pile.</li><li>Indiquer où se trouvent l'anode et la cathode.</li>
        <li>Indiquer le sens de circulation des électrons et des ions.</li><li>Écrire la réaction de fonctionnement de la pile.</li>
        <li>Si on consomme 0,5 g de cuivre, quelle masse d'argent sera fabriquée ?</li></ol>
      ${donnees([`M(Cu) = 63,5 ${UNITE.M}`, `M(Ag) = 108 ${UNITE.M}`])}`,
    parties: () => {
      const M = methode({ especes: [sp('Cu', 1, 'cuivre', 63.5), sp(AG, 2, 'ions argent'), sp(CU2, 1, 'ions cuivre'), sp('Ag', 2, 'argent', 108)], produits: 2,
        depart: { k: 0, m: 0.5, M: 63.5 }, cible: { k: 3, quoi: 'm', M: 108 }, autres: [1, 2], cs: 3,
        q: { schema: '6. Place les données sur le schéma de la méthode (équation de la pile en tête).', nA: '6. Calcule la quantité de matière de cuivre consommé.', nB: '6. Calcule la quantité de matière d\'argent formé.', res: '6. Quelle masse d\'argent sera fabriquée ?' } });
      return [
        partiePile('1 à 5. Complète le schéma de la pile (électrode de cuivre à gauche), les demi-piles et l\'équation de fonctionnement.',
          { anode: 'Cu', cathode: 'Ag', anodeSide: 'L', hint: 'consomme', appareil: 'V' },
          `<p>Le cuivre est consommé : Cu = Cu<sup>2+</sup> + 2 ${E}, les électrons en partent : borne −, oxydation, anode. L'argent se forme : Ag<sup>+</sup> + ${E} = Ag, les électrons y arrivent : borne +, réduction, cathode.</p>
            ${figPile({ g: 'Cu', d: 'Ag', anode: 'g', appareil: 'V' })}
            ${calc(`Cu → Cu<sup>2+</sup> + 2 ${E}<br>2 × ( Ag<sup>+</sup> + ${E} → Ag )`)}${calc(c('Cu + 2 Ag<sup>+</sup> → Cu<sup>2+</sup> + 2 Ag'))}`),
      ].concat(M.parties);
    } };

  /* ---------- Exercice 10 ---------- */
  const H2 = 'H<sub>2</sub>';
  const ex10 = { id: '10', groupe: 'energie', titre: 'Exercice 10 : stockage du combustible dans un véhicule électrique', desc: 'Pile à combustible H<sub>2</sub>/O<sub>2</sub> : équation, n(H<sub>2</sub>), n(e<sup>−</sup>), volume de H<sub>2</sub>',
    contexte: `<p class="er-contexte">Un véhicule électrique fonctionnant avec une pile à combustible ayant des caractéristiques usuelles consomme environ 0,5 kg de dihydrogène pour parcourir 100 km. La pile qui transfère de l'énergie au moteur électrique est constituée de deux électrodes alimentées de façon continue : l'une en dihydrogène, l'autre en dioxygène. Les couples d'oxydoréduction mis en jeu dans la réaction sont H<sup>+</sup>(aq)/H<sub>2</sub>(g) et O<sub>2</sub>(g)/H<sub>2</sub>O(l).</p>
      <ol class="er-liste"><li>Compléter les deux réactions aux électrodes en indiquant quels sont les réactifs qui disparaissent, puis écrire la réaction de fonctionnement de la pile :
          H<sup>+</sup>(aq)/H<sub>2</sub>(g) : … H<sup>+</sup> + … ${E} = H<sub>2</sub> ; O<sub>2</sub>(g)/H<sub>2</sub>O(l) : … O<sub>2</sub> + … H<sup>+</sup> + … ${E} = 2 H<sub>2</sub>O.</li>
        <li>Indiquer si le produit formé est polluant.</li><li>Préciser la nature des porteurs de charges à l'extérieur de la pile.</li>
        <li>Le combustible est le réactif oxydé dans la pile. Identifier cette espèce.</li><li>Indiquer pourquoi il est inutile de transporter le second réactif.</li>
        <li>Indiquer la quantité de matière de dihydrogène nécessaire pour parcourir 100 km avec ce véhicule.</li>
        <li>En déduire la quantité de matière n(${E}) des porteurs de charges ayant circulé dans le moteur électrique pour parcourir cette distance.</li>
        <li>Dans les conditions usuelles de température et de pression, le volume molaire est égal à 24 L·mol<sup>−1</sup>. En déduire le volume de dihydrogène nécessaire pour parcourir 100 km. Un réservoir de ce type vous paraît-il raisonnable ?</li>
        <li>Proposer une solution pour améliorer le stockage du combustible.</li></ol>
      ${donnees([`M(H) = 1 ${UNITE.M}`])}`,
    parties: () => {
      // 6. et 7. : schéma de la méthode sur la demi-équation de l'anode (colonne e⁻)
      const M = methode({ especes: [sp(H2, 1, 'dihydrogène', 2), sp(H, 2, 'ions H+'), sp(E, 2, 'électrons')], produits: 1, signe: '=',
        depart: { k: 0, m: 500, M: 2 }, cible: { k: 2, quoi: 'n' }, autres: [1], cs: 3,
        q: { schema: '6 et 7. Place les données sur le schéma de la méthode (demi-équation de l\'anode en tête ; 0,5 kg = 500 g ; M(H<sub>2</sub>) = 2 × 1 = 2 g·mol<sup>−1</sup>).',
          nA: '6. Quelle quantité de matière de dihydrogène faut-il pour parcourir 100 km ?', relation: '7. Quelle relation relie n(H<sub>2</sub>) et n(e<sup>−</sup>) ?', nB: '7. Quelle quantité de matière d\'électrons a circulé ?' } });
      const nH2 = M.nA, V = nH2 * 24;
      return [
        { type: 'gabarit', q: '1. Complète la demi-équation du couple H<sup>+</sup>/H<sub>2</sub>.',
          morceaux: [{ v: 2, signe: false, aria: 'Nombre de H+' }, `${H} +`, { v: 2, signe: false, aria: 'Nombre d\'électrons' }, `${E} = H<sub>2</sub>`],
          diag: () => 'H<sub>2</sub> contient 2 atomes H : il faut 2 H<sup>+</sup> ; ils portent 2 charges + : il faut 2 électrons.',
          correction: calc(`2 ${H} + 2 ${E} = H<sub>2</sub>`) },
        { type: 'gabarit', q: '1. Complète la demi-équation du couple O<sub>2</sub>/H<sub>2</sub>O.',
          morceaux: [{ v: 1, signe: false, aria: 'Nombre de O2' }, `${O2} +`, { v: 4, signe: false, aria: 'Nombre de H+' }, `${H} +`, { v: 4, signe: false, aria: 'Nombre d\'électrons' }, `${E} = 2 ${EAU}`],
          diag: vs => (vs[1] !== 4 ? '2 H<sub>2</sub>O contiennent 4 atomes H : il faut 4 H<sup>+</sup>.' : '4 H<sup>+</sup> portent 4 charges + : il faut 4 électrons pour que les charges se compensent.'),
          correction: calc(`${O2} + 4 ${H} + 4 ${E} = 2 ${EAU}`) },
        orienter([{ html: `2 ${H} + 2 ${E} = H<sub>2</sub>`, inv: true, oriente: `H<sub>2</sub> → 2 ${H} + 2 ${E}`, role: 'oxydation' },
                  { html: `${O2} + 4 ${H} + 4 ${E} = 2 ${EAU}`, inv: false, oriente: `${O2} + 4 ${H} + 4 ${E} → 2 ${EAU}`, role: 'réduction' }],
          `<p>Les réactifs qui disparaissent sont H<sub>2</sub> et O<sub>2</sub> :</p>${calc(`H<sub>2</sub> → 2 ${H} + 2 ${E}<br>${O2} + 4 ${H} + 4 ${E} → 2 ${EAU}`)}`),
        equationTrous([[H2, 2], [O2, 1], [EAU, 2]], 2,
          `<p>On multiplie la première par 2 (4 électrons), on additionne, puis on simplifie les 4 H<sup>+</sup> présents des deux côtés :</p>${calc(`2 H<sub>2</sub> + ${O2} + 4 ${H} + 4 ${E} → 4 ${H} + 4 ${E} + 2 ${EAU}`)}${calc(c(`2 H<sub>2</sub> + ${O2} → 2 ${EAU}`))}`,
          vs => (vs[0] === 1 ? 'Multiplie la demi-équation de H<sub>2</sub> par 2 pour avoir 4 électrons des deux côtés.' : 'Après l\'addition, 4 H<sup>+</sup> sont de chaque côté : ils s\'éliminent.')),
        choix('2. Le produit formé est-il polluant ?', [o('non', 'Non : c\'est de l\'eau'), o('oui', 'Oui : c\'est du dioxyde de carbone')], 'non',
          '<p>Le produit formé est de l\'eau : il est <b>non polluant</b>.</p>', { indices: { oui: 'Relis l\'équation : il ne se forme que de l\'eau, sans carbone.' }, melanger: false }),
        choix('3. Quels sont les porteurs de charges à l\'extérieur de la pile ?', [o('e', 'des électrons'), o('ions', 'des ions H<sup>+</sup>'), o('p', 'des protons')], 'e',
          '<p>À l\'extérieur de la pile (fils, moteur), les porteurs de charges sont les <b>électrons</b>.</p>', { indices: { ions: 'Les ions H<sup>+</sup> restent dans la pile : dans les fils, ce sont des électrons.', p: 'Dans les fils métalliques, ce sont des électrons qui se déplacent.' } }),
        choix('4. Quel est le combustible, réactif oxydé dans la pile ?', [o('h2', 'le dihydrogène H<sub>2</sub>'), o('o2', 'le dioxygène O<sub>2</sub>')], 'h2',
          `<p>H<sub>2</sub> → 2 ${H} + 2 ${E} : red → ox + ${E}, c'est une oxydation. Le combustible est <b>H<sub>2</sub></b>.</p>`,
          { indices: { o2: 'O<sub>2</sub> capte des électrons (O<sub>2</sub> + 4 H<sup>+</sup> + 4 e<sup>−</sup> → 2 H<sub>2</sub>O) : il est réduit.' }, melanger: false }),
        choix('5. Pourquoi est-il inutile de transporter le second réactif ?', [o('air', 'Le dioxygène est présent dans l\'air'), o('prod', 'Il est produit par la pile'), o('peu', 'Il en faut très peu')], 'air',
          '<p>Le second réactif est le dioxygène : il est présent dans l\'air.</p>', { indices: { prod: 'La pile produit de l\'eau, pas du dioxygène.', peu: 'Il en faut la moitié de la quantité de H<sub>2</sub> : ce n\'est pas peu, mais l\'air en contient.' } }),
      ].concat(M.parties, [
        nombre('8. Quel volume de dihydrogène faut-il pour parcourir 100 km ?', 'V =', V, 'L',
          `<div class="ph-defile"><table class="ph-tableau"><thead><tr><th>V (L)</th><th>n (mol)</th></tr></thead><tbody><tr><td>24</td><td>1</td></tr><tr><td><b>V</b></td><td>${fmt(nH2)}</td></tr></tbody></table></div>
            ${calc(`V = ${fr(`24 × ${fmt(nH2)}`, '1')} = ${c(`${fmt(V)} L`)} = 6 m<sup>3</sup>`)}`,
          { diag: v => (egal(v, nH2 / 24) ? 'Un volume molaire de 24 L·mol<sup>−1</sup> : 1 mol occupe 24 L, donc 250 mol occupent 250 fois plus.' : egal(v, 500 * 24) ? 'Tu as pris la masse (500 g) : il faut la quantité de matière n(H<sub>2</sub>) = 250 mol.' : 'V = n × V<sub>m</sub> = 250 × 24.'),
            affiche: fmt(V) }),
        choix('8. Un réservoir de 6 000 L vous paraît-il raisonnable pour une voiture ?', [o('non', 'Non : 6 m<sup>3</sup>, c\'est beaucoup trop gros'), o('oui', 'Oui : c\'est le volume d\'un réservoir d\'essence')], 'non',
          '<p>6 000 L = 6 m<sup>3</sup> : ce n\'est pas raisonnable (un réservoir d\'essence contient environ 50 L).</p>', { indices: { oui: 'Un réservoir d\'essence contient environ 50 L : 6 000 L, c\'est plus de cent fois plus.' }, melanger: false }),
        choix('9. Comment améliorer le stockage du combustible ?', [o('p', 'Le stocker sous pression (le gaz occupe moins de place, mais c\'est plus risqué)'), o('chaud', 'Le chauffer pour qu\'il prenne moins de place'), o('air', 'Le mélanger à l\'air dans le réservoir')], 'p',
          '<p>On peut stocker le dihydrogène <b>sous pression</b> : il occupe beaucoup moins de place, mais cela augmente les risques.</p>',
          { indices: { chaud: 'Chauffer un gaz augmente son volume (ou sa pression) : c\'est l\'inverse.', air: 'Mélangé au dioxygène de l\'air, le dihydrogène forme un mélange explosif.' } }),
      ]);
    } };

  /* ---------- Exercice 11 ---------- */
  const NIOOH = 'NiO(OH)', NIOH2 = 'Ni(OH)<sub>2</sub>', CDOH2 = 'Cd(OH)<sub>2</sub>', OH = 'OH<sup>−</sup>';
  const ex11 = { id: '11', groupe: 'energie', titre: 'Exercice 11 : accumulateur nickel-cadmium', desc: 'Équation, borne −, Q = 5 760 C, n(e<sup>−</sup>), masse de NiO(OH), énergie',
    contexte: `<p class="er-contexte">La capacité d'un accumulateur nickel-cadmium est 1,6 A·h. Les couples en présence sont :</p>
      ${calc(`${NIOOH} / ${NIOH2} : ${NIOOH} + ${EAU} + ${E} = ${NIOH2} + ${OH}<br>${CDOH2} / Cd : ${CDOH2} + 2 ${E} = Cd + 2 ${OH}`)}
      <p class="er-contexte">Lors du fonctionnement de l'accumulateur, le cadmium Cd est consommé.</p>
      <ol class="er-liste"><li>Écrire la réaction de fonctionnement.</li><li>Quelle est la borne négative ?</li><li>Quelle quantité d'électricité totale en coulomb peut fournir l'accumulateur de 1,6 A·h ?</li>
        <li>Calculer la quantité de matière n(${E}) d'électrons mise en jeu.</li><li>En déduire la masse de réactif NiO(OH) nécessaire pour assurer cette capacité.</li>
        <li>Quelle énergie peut fournir la pile, sachant que la tension U à ses bornes est égale à 1,2 V ?</li></ol>
      ${donnees([`la charge en coulombs de n(${E}) moles d'électrons est Q = n(${E}) × F avec F = 96 500 ${UNITE.F}`, `masses molaires : M(Ni) = 58,7 ${UNITE.M}`, `M(H) = 1 ${UNITE.M}`, `M(Cd) = 112,4 ${UNITE.M}`, `M(O) = 16 ${UNITE.M}`])}`,
    parties: () => {
      const Q = 1.6 * 3600, Mn = 58.7 + 16 + 16 + 1;
      const esp = [[NIOOH, 2], [EAU, 2], ['Cd', 1], [NIOH2, 2], [CDOH2, 1]];
      const M = methode({ especes: [sp(NIOOH, 1, 'NiO(OH)', Mn), sp(EAU, 1, 'eau'), sp(E, 1, 'électrons'), sp(NIOH2, 1, 'Ni(OH)2'), sp(OH, 1, 'ions hydroxyde')], produits: 3, signe: '=',
        depart: { k: 2, Q }, cible: { k: 0, quoi: 'm', M: Mn }, autres: [3], cs: 2,
        q: { schema: '4 et 5. Place les données sur le schéma de la méthode (demi-équation du nickel en tête ; M(NiO(OH)) = 58,7 + 16 + 16 + 1).',
          nA: '4. Calcule la quantité de matière d\'électrons n(e<sup>−</sup>) mise en jeu.', relation: '5. Quelle relation relie n(e<sup>−</sup>) et n(NiO(OH)) ?',
          nB: '5. Calcule la quantité de matière de NiO(OH) consommé.', res: '5. En déduire la masse de NiO(OH) nécessaire.' } });
      const parties = M.parties.slice();
      // masse molaire de NiO(OH), avant le calcul de la masse
      parties.splice(parties.length - 1, 0, nombre('5. Calcule la masse molaire de NiO(OH).', 'M(NiO(OH)) =', Mn, UNITE.M,
        calc(`M(NiO(OH)) = M(Ni) + 2 M(O) + M(H) = 58,7 + 2 × 16 + 1 = ${c(`${fmt(Mn)} ${UNITE.M}`)}`),
        { rel: .001, affiche: fmt(Mn), diag: v => (egal(v, 58.7 + 16 + 1, .001) ? 'NiO(OH) contient 2 atomes d\'oxygène : un dans « NiO », un dans « (OH) ».' : 'Additionne les masses molaires de tous les atomes : 1 Ni, 2 O, 1 H.') }));
      return [
        orienter([{ html: `${NIOOH} + ${EAU} + ${E} = ${NIOH2} + ${OH}`, inv: false, oriente: `${NIOOH} + ${EAU} + ${E} → ${NIOH2} + ${OH}`, role: 'réduction' },
                  { html: `${CDOH2} + 2 ${E} = Cd + 2 ${OH}`, inv: true, oriente: `Cd + 2 ${OH} → ${CDOH2} + 2 ${E}`, role: 'oxydation' }],
          `<p>Le cadmium est consommé : on inverse sa demi-équation.</p>${calc(`${NIOOH} + ${EAU} + ${E} → ${NIOH2} + ${OH}<br>Cd + 2 ${OH} → ${CDOH2} + 2 ${E}`)}`),
        multiplier([2, 1], [1, 2], [{ oriente: `${NIOOH} + ${EAU} + ${E} → ${NIOH2} + ${OH}` }, { oriente: `Cd + 2 ${OH} → ${CDOH2} + 2 ${E}` }]),
        equationTrous(esp, 3,
          `${calc(`2 ${NIOOH} + 2 ${EAU} + Cd + 2 ${OH} → 2 ${NIOH2} + 2 ${OH} + ${CDOH2}`)}<p>On simplifie : 2 ${OH} de chaque côté.</p>${calc(c(eqTexte(esp, 3)))}`,
          vs => (vs[0] === 1 ? 'Multiplie la demi-équation du nickel par 2 (2 électrons de chaque côté).' : 'Les ions OH<sup>−</sup> sont des deux côtés (2 et 2) : ils s\'éliminent, ils n\'apparaissent pas dans l\'équation.')),
        choix('2. Quelle est la borne négative ?', [o('cd', 'l\'électrode de cadmium'), o('ni', 'l\'électrode de nickel')], 'cd',
          '<p>La borne négative est celle qui produit des électrons (ils partent du − pour aller au +) : Cd + 2 OH<sup>−</sup> → Cd(OH)<sub>2</sub> + 2 e<sup>−</sup>. C\'est le <b>cadmium</b>.</p>',
          { indices: { ni: 'NiO(OH) capte des électrons : ils arrivent à cette électrode, c\'est le +.' }, melanger: false }),
        nombre('3. Quelle quantité d\'électricité (en C) peut fournir l\'accumulateur de 1,6 A·h ?', 'Q =', Q, 'C',
          calc(`Q = 1,6 A·h = 1,6 × 3 600 A·s = ${c(`${fmt(Q)} C`)}`),
          { affiche: fmt(Q), diag: v => (egal(v, 1.6 * 60) ? '1 h = 3 600 s : 1 A·h = 3 600 C.' : 'Q = 1,6 × 3 600.') }),
      ].concat(parties, [
        nombre('6. Quelle énergie peut fournir l\'accumulateur sous U = 1,2 V ?', 'E =', Q * 1.2, 'J',
          calc(`E = Q × U = ${fmt(Q)} C × 1,2 V = ${fmt(Q * 1.2)} J ≈ ${c(`6,9 × 10<sup>3</sup> J`)}`),
          { affiche: fmt(Q * 1.2), diag: v => (egal(v, 1.6 * 1.2) ? 'Ça, c\'est l\'énergie en W·h (Q en A·h). En joules, Q doit être en coulombs : 5 760 C.' : 'E = Q × U = 5 760 × 1,2.') }),
      ]);
    } };

  window.OX.EXERCICES = [ex1, ex2, ex3, ex4, ex5, ex6, ex7, ex8, ex9, ex10, ex11];
  window.OX.GROUPES_EX = [
    { id: 'calcul', titre: 'Écrire une réaction et calculer une quantité de matière' },
    { id: 'acide', titre: 'Avec H<sup>+</sup> et H<sub>2</sub>O ; dismutation' },
    { id: 'piles', titre: 'Schéma d\'une pile' },
    { id: 'energie', titre: 'Pile à combustible et accumulateur' },
  ];
})();
