/* ============================================================
   Exercices du module 4 (application « Chapitre 1 : Énergie et
   puissance ») : les exercices 7 à 16 du manuel (p. 30 à 32), avec
   la même numérotation, dans l'ordre du cours :
     rendement (11, 12, 13, 14), puissance instantanée (9, 8, 10),
     énergie (7, 15, 16).

   Chaque exercice : { id, groupe, titre, desc, contexte (HTML),
   parties: [p] } ; chaque partie suit le format de EP.PARTIES avec
   p.q (question) et p.correction (correction détaillée, rédigée en
   trois temps : formule, grandeur isolée, application numérique avec
   les unités). Les exercices de rendement commencent par placer les
   valeurs de l'énoncé sur le schéma de conversion ; ceux d'énergie
   utilisent l'outil « aire sous la courbe » (EP.partieAire).

   Écarts avec la correction manuscrite (voir le prompt du chapitre) :
     ex. 16 e) : E₂ = 13,7 W × 120 s ≈ 1,64 × 10³ J (et non « 7,2 × 120 ») ;
     ex. 16 c) et e) : intervalles t₁-t₂ et t₂-t₄, comme dans la correction.
   ============================================================ */
(function () {
  'use strict';

  const { o, fmt, fr, proche, conv, slot, val, inc, graphe, diagramme, partieAire } = window.EP;
  const calc = h => `<p class="ph-calc">${h}</p>`;
  const c = h => `<span class="c">${h}</span>`;
  const etiq = (id, label, cible, indice) => ({ id, label, cible, indice });
  // fabriques de parties
  const choix = (q, options, bonne, correction, opts) => Object.assign({ type: 'choix', q, options, bonne, correction, colonne: options.some(x => x.label.replace(/<[^>]+>/g, '').length > 24) }, opts);
  const nombre = (q, label, valeur, unite, correction, opts) => Object.assign({ type: 'nombre', q, label, valeur, unite, correction, signe: false }, opts);
  const sci = (q, label, valeur, unite, correction, opts) => Object.assign({ type: 'sci', q, label, valeur, unite, correction, cs: 2, rel: .02 }, opts);
  const gab = (q, label, morceaux, correction, opts) => Object.assign({ type: 'gabarit', q, label, morceaux, correction }, opts);
  const schema = (q, sch, etiquettes, correction) => ({ type: 'schema', q: q || 'Place les valeurs de l\'énoncé sur le schéma de conversion (la case restée « ? » est l\'inconnue).', schema: sch, etiquettes, correction });
  const Pu = 'P<sub>u</sub>', Pa = 'P<sub>a</sub>';
  // diagnostics du rendement
  const dEta = (v, u, a, bu, ba) => proche(v, a / u, .02) ? `Rapport inversé : η = ${Pu} / ${Pa} ne dépasse jamais 1.` : (bu != null && proche(v, bu / ba, .02)) ? 'Mets les deux puissances dans la même unité avant de diviser.' : `η = ${Pu} / ${Pa}.`;
  const dPu = (v, eta, a) => proche(v, a / eta, .02) ? `Tu as divisé par η : ${Pu} = η × ${Pa}.` : `${Pu} = η × ${Pa}.`;
  const dPa = (v, eta, u) => proche(v, eta * u, .02) ? `Tu as multiplié par η : ${Pa} = ${Pu} / η.` : `${Pa} = ${Pu} / η.`;
  const schemaP = (a, u) => conv({ grandeur: 'Puissance', appareil: 'appareil', eta: 'η = ?', a: { v: a }, u: { v: u }, p: {} });

  /* ---------- Figures ---------- */
  const G7a = { xmax: 4, ymax: 250, pasX: 1, pasY: 50, nomX: 't (s)', nomY: 'P (W)', courbes: [[[0, 200], [4, 200]]], hMax: 260, aria: 'Puissance constante de 200 W entre 0 et 4 s' };
  const G7b = { xmax: 220, ymax: 250, pasX: 50, pasY: 50, nomX: 't (s)', nomY: 'P (W)', courbes: [[[0, 0], [100, 200], [200, 0], [220, 0]]], traits: [[0, 200, 100, 200]], hMax: 260,
    aria: 'Puissance qui monte de 0 à 200 W entre 0 et 100 s, puis redescend à 0 à 200 s' };
  const G10 = { xmax: 60, ymax: 16000, pasX: 10, pasY: 2000, nomX: 'Temps d\'utilisation (s)', nomY: 'Énergie électrique (J)', mg: 62, mh: 40, courbes: [[[0, 0], [60, 15000]]], hMax: 300,
    aria: 'Énergie électrique consommée en fonction du temps : droite passant par l\'origine et par (60 s ; 15 000 J)' };
  // exercice 15 : intensité (A), puis puissance P = 400 × I (W)
  const I15 = [[0, 180], [25, 180], [25, 95], [180, 35], [180, -40], [200, -45], [200, 30], [214, 30], [214, -60], [219, -60], [219, 30], [232, 30]];
  const G15I = { xmax: 240, ymin: -70, ymax: 200, pasX: 25, gradX: 50, pasY: 20, gradY: 20, nomX: 'Temps (s)', nomY: 'I (A)', mg: 46, courbes: [I15], hMax: 320, ratio: .6,
    aria: 'Intensité du moteur : 180 A de 0 à 25 s, puis de 95 A à 25 s à 35 A à 180 s, puis négative ou faible jusqu\'à 232 s' };
  const P15 = I15.map(([t, i]) => [t, 400 * i]);
  const G15P = { xmax: 240, ymin: -28000, ymax: 80000, pasX: 25, gradX: 50, pasY: 8000, gradY: 16000, nomX: 'Temps (s)', nomY: 'P (W)', mg: 86, courbes: [P15], hMax: 340, ratio: .62,
    fmtY: v => `400 × ${fmt(v / 400)}`, aria: 'Puissance du moteur : 72 000 W de 0 à 25 s, puis de 38 000 W à 14 000 W entre 25 et 180 s' };
  // exercice 16 : intensité (A), puis puissance (W)
  const I16 = [[0, 0], [5, 0], [5, .65], [60, .65], [60, 1.9], [180, 1.9], [180, 0], [190, 0]];
  const tI = [[5, 't₁'], [60, 't₂'], [120, 't₃'], [180, 't₄']].map(([x, t]) => ({ x, y: 0, t, dy: -6 }));
  const G16I = { xmax: 190, ymax: 2.4, pasX: 10, gradX: 20, pasY: .1, gradY: .5, nomX: 't (s)', nomY: 'I (A)', mg: 44, courbes: [I16], textes: tI.concat([{ x: 32, y: .65, t: '0,65 A', dy: -8 }, { x: 120, y: 1.9, t: '1,9 A', dy: -8 }]),
    traits: [[120, 0, 120, 1.9]], hMax: 270, aria: 'Intensité : 0 de 0 à 5 s, 0,65 A de 5 à 60 s, 1,9 A de 60 à 180 s' };
  const P16 = I16.map(([t, i]) => [t, +(7.2 * i).toFixed(2)]);
  const G16P = { xmax: 190, ymax: 16, pasX: 10, gradX: 20, pasY: 1, gradY: 2, nomX: 't (s)', nomY: 'P (W)', mg: 44, courbes: [P16], textes: [{ x: 32, y: 4.68, t: '4,7 W', dy: -8 }, { x: 120, y: 13.68, t: '13,7 W', dy: -8 }],
    hMax: 280, aria: 'Puissance : 0 de 0 à 5 s, 4,7 W de 5 à 60 s, 13,7 W de 60 à 180 s' };

  const GROUPES_EX = [
    { id: 'rend', titre: 'Rendement (p. 32) : exercices 11 à 14' },
    { id: 'puis', titre: 'Puissance instantanée (p. 31) : exercices 9, 8 et 10' },
    { id: 'ener', titre: 'Énergie (p. 31-32) : exercices 7, 15 et 16' },
  ];

  const EXERCICES = [

    /* ============================ EXERCICE 11 ============================ */
    { id: '11', groupe: 'rend', titre: 'Exercice 11 p. 32 : calculer un rendement', desc: 'Trois appareils, des unités parfois différentes.',
      contexte: '<p class="er-contexte">Calculer le rendement avec :</p><ul class="ep-donnees"><li>a) P<sub>u</sub> = 15 W et P<sub>a</sub> = 45 W ;</li><li>b) P<sub>u</sub> = 5,0 mW et P<sub>a</sub> = 4,5 W ;</li><li>c) P<sub>u</sub> = 2,8 kW et P<sub>a</sub> = 3 000 W.</li></ul>',
      parties: [
        schema('Cas a) : place les deux puissances sur le schéma de conversion.', schemaP(slot('a'), slot('u')),
          [etiq('a', '45 W', 'a', 'La puissance apportée P<sub>a</sub> est celle que l\'appareil reçoit.'), etiq('u', '15 W', 'u', 'La puissance utile P<sub>u</sub> est celle qu\'il fournit.')],
          '<p>P<sub>a</sub> = 45 W entre dans l\'appareil ; P<sub>u</sub> = 15 W en sort sous la forme utile.</p>'),
        nombre('a) Calcule le rendement (2 chiffres significatifs).', 'η =', 15 / 45, '', calc(`η = ${fr(Pu, Pa)} = ${fr('15 W', '45 W')} = ${c('0,33')}`), { rel: .02, affiche: '0,33', diag: v => dEta(v, 15, 45) }),
        nombre('b) Avant de diviser, convertis la puissance utile en watts.', 'P<sub>u</sub> =', .005, 'W', calc(`P<sub>u</sub> = 5,0 mW = 5,0 × 10<sup>−3</sup> W = ${c('0,005 W')}`),
          { diag: v => proche(v, 5000) ? '1 mW = 0,001 W : on divise par 1 000.' : '1 mW = 10<sup>−3</sup> W.' }),
        sci('b) Calcule le rendement.', 'η =', .005 / 4.5, '', calc(`η = ${fr('5,0 × 10<sup>−3</sup> W', '4,5 W')} = ${c('1,1 × 10<sup>−3</sup>')} (soit 0,0011)`),
          { diag: v => proche(v, 5 / 4.5, .03) ? 'Convertis 5,0 mW en W avant de diviser.' : dEta(v, .005, 4.5) }),
        nombre('c) Calcule le rendement (2 chiffres significatifs).', 'η =', 2800 / 3000, '', calc(`P<sub>u</sub> = 2,8 kW = 2 800 W<br>η = ${fr('2 800 W', '3 000 W')} = ${c('0,93')} (η = 93 %)`),
          { rel: .02, affiche: '0,93', diag: v => dEta(v, 2800, 3000, 2.8, 3000) }),
      ] },

    /* ============================ EXERCICE 12 ============================ */
    { id: '12', groupe: 'rend', titre: 'Exercice 12 p. 32 : calculer une puissance utile', desc: 'P<sub>u</sub> = η × P<sub>a</sub>, en W, kW et mW.',
      contexte: '<p class="er-contexte">Calculer la puissance utile avec :</p><ul class="ep-donnees"><li>a) η = 0,85 et P<sub>a</sub> = 45 W ;</li><li>b) η = 0,05 et P<sub>a</sub> = 1,0 kW ;</li><li>c) η = 0,33 et P<sub>a</sub> = 10 mW.</li></ul>',
      parties: [
        schema('Cas a) : place les données sur le schéma de conversion.', conv({ grandeur: 'Puissance', appareil: 'appareil', eta: slot('e'), a: { v: slot('a') }, u: { v: inc() }, p: {} }),
          [etiq('a', '45 W', 'a', 'P<sub>a</sub> = 45 W est la puissance reçue.'), etiq('e', 'η = 0,85', 'e', 'Le rendement est une caractéristique de l\'appareil.')],
          '<p>P<sub>a</sub> = 45 W entre dans l\'appareil de rendement η = 0,85 ; la puissance utile est l\'inconnue.</p>'),
        choix('Quelle formule donne la puissance utile ?', [o('ok', 'P<sub>u</sub> = η × P<sub>a</sub>'), o('a', `P<sub>u</sub> = ${fr(Pa, 'η')}`), o('b', `P<sub>u</sub> = ${fr('η', Pa)}`)], 'ok',
          `<p>η = ${fr(Pu, Pa)} donc P<sub>u</sub> = η × P<sub>a</sub>.</p>`, { melanger: false, indice: 'Pars de η = P<sub>u</sub> / P<sub>a</sub> et isole P<sub>u</sub> : P<sub>u</sub> est plus petite que P<sub>a</sub>.' }),
        nombre('a) Calcule la puissance utile.', 'P<sub>u</sub> =', .85 * 45, 'W', calc(`P<sub>u</sub> = η × P<sub>a</sub> = 0,85 × 45 W ≈ ${c('38 W')}`), { rel: .02, affiche: '38', diag: v => dPu(v, .85, 45) }),
        nombre('b) Calcule la puissance utile, en watts.', 'P<sub>u</sub> =', 50, 'W', calc(`P<sub>u</sub> = 0,05 × 1,0 kW = 0,05 kW = ${c('50 W')}`),
          { diag: v => proche(v, .05) ? 'C\'est en kW : 0,05 kW = 50 W.' : dPu(v, .05, 1000) }),
        nombre('c) Calcule la puissance utile, en milliwatts.', 'P<sub>u</sub> =', 3.3, 'mW', calc(`P<sub>u</sub> = 0,33 × 10 mW = ${c('3,3 mW')} (= 3,3 × 10<sup>−3</sup> W)`),
          { rel: .01, diag: v => proche(v, .0033) ? 'Le résultat est demandé en mW.' : dPu(v, .33, 10) }),
      ] },

    /* ============================ EXERCICE 13 ============================ */
    { id: '13', groupe: 'rend', titre: 'Exercice 13 p. 32 : calculer une puissance fournie', desc: 'P<sub>a</sub> = P<sub>u</sub> / η.',
      contexte: '<p class="er-contexte">Calculer la puissance apportée (fournie à l\'appareil) avec :</p><ul class="ep-donnees"><li>a) η = 0,13 et P<sub>u</sub> = 500 W ;</li><li>b) η = 0,42 et P<sub>u</sub> = 54 mW ;</li><li>c) η = 0,60 et P<sub>u</sub> = 5,2 kW.</li></ul>',
      parties: [
        schema('Cas a) : place les données sur le schéma de conversion.', conv({ grandeur: 'Puissance', appareil: 'appareil', eta: slot('e'), a: { v: inc() }, u: { v: slot('u') }, p: {} }),
          [etiq('u', '500 W', 'u', 'P<sub>u</sub> = 500 W est la puissance utile, en sortie.'), etiq('e', 'η = 0,13', 'e', 'Le rendement est une caractéristique de l\'appareil.')],
          '<p>La puissance utile 500 W sort de l\'appareil ; la puissance apportée est l\'inconnue.</p>'),
        choix('Quelle formule donne la puissance apportée ?', [o('ok', `P<sub>a</sub> = ${fr(Pu, 'η')}`), o('a', 'P<sub>a</sub> = η × P<sub>u</sub>'), o('b', `P<sub>a</sub> = ${fr('η', Pu)}`)], 'ok',
          `<p>η = ${fr(Pu, Pa)} donc P<sub>a</sub> = ${fr(Pu, 'η')}.</p>`, { melanger: false, indice: 'Isole P<sub>a</sub> dans η = P<sub>u</sub> / P<sub>a</sub> : P<sub>a</sub> est plus grande que P<sub>u</sub>.' }),
        nombre('a) Calcule la puissance apportée.', 'P<sub>a</sub> =', 500 / .13, 'W', calc(`P<sub>a</sub> = ${fr(Pu, 'η')} = ${fr('500 W', '0,13')} ≈ ${c('3 846 W')} (≈ 3,8 kW)`), { rel: .01, affiche: '3846', diag: v => dPa(v, .13, 500) }),
        nombre('b) Calcule la puissance apportée, en mW.', 'P<sub>a</sub> =', 54 / .42, 'mW', calc(`P<sub>a</sub> = ${fr('54 mW', '0,42')} ≈ ${c('129 mW')} (ou ${fr('54 × 10<sup>−3</sup> W', '0,42')} ≈ 0,129 W)`), { rel: .01, affiche: '129', diag: v => proche(v, .1286, .02) ? 'Le résultat est demandé en mW.' : dPa(v, .42, 54) }),
        nombre('c) Calcule la puissance apportée, en kW.', 'P<sub>a</sub> =', 5.2 / .6, 'kW', calc(`P<sub>a</sub> = ${fr('5,2 kW', '0,60')} ≈ ${c('8,7 kW')} (ou 8,7 × 10<sup>3</sup> W)`), { rel: .01, affiche: '8,7', diag: v => proche(v, 8667, .02) ? 'Le résultat est demandé en kW.' : dPa(v, .6, 5.2) }),
      ] },

    /* ============================ EXERCICE 14 ============================ */
    { id: '14', groupe: 'rend', titre: 'Exercice 14 p. 32 : rendement d\'une ampoule', desc: 'Lampe à incandescence ou lampe fluocompacte ?',
      contexte: `<p class="er-contexte">On donne les chaînes énergétiques de deux types d'ampoules : une ampoule à incandescence et une ampoule fluocompacte.</p>
        ${diagramme({ entree: { t: 'Énergie électrique', v: '60 J', k: 60 }, appareil: 'Lampe à incandescence', sorties: [{ t: 'Énergie lumineuse', v: '3 J', k: 3 }, { t: 'Énergie thermique', v: '57 J', k: 57 }] })}
        <p class="ep-fig-leg">Diagramme énergétique pour une lampe à incandescence</p>
        ${diagramme({ entree: { t: 'Énergie électrique', v: '11 J', k: 11 }, appareil: 'Lampe fluocompacte', sorties: [{ t: 'Énergie lumineuse', v: '3 J', k: 3 }, { t: 'Énergie thermique', v: '8 J', k: 8 }] })}
        <p class="ep-fig-leg">Diagramme énergétique pour une lampe fluocompacte</p>`,
      parties: [
        choix('a) Rappeler la définition du rendement d\'un convertisseur.', [o('ok', `η = ${fr('E<sub>u</sub>', 'E<sub>a</sub>')} = ${fr(Pu, Pa)}`), o('a', `η = ${fr('E<sub>a</sub>', 'E<sub>u</sub>')}`), o('b', `η = ${fr('E<sub>perdue</sub>', 'E<sub>a</sub>')}`)], 'ok',
          `<p>Rendement : η = ${fr('E<sub>u</sub>', 'E<sub>a</sub>')} = ${fr(Pu, Pa)} (énergie utile sur énergie apportée).</p>`, { melanger: false, indices: { a: 'Ce rapport est plus grand que 1 : impossible pour un rendement.', b: 'Le rendement compare l\'énergie <b>utile</b> à l\'énergie apportée.' } }),
        nombre('b) Calcule le rendement de la lampe à incandescence.', 'η =', 3 / 60, '', calc(`η = ${fr('E<sub>u</sub>', 'E<sub>a</sub>')} = ${fr('3 J', '60 J')} = ${c('0,05')} (5 %)`),
          { rel: .01, diag: v => proche(v, 57 / 60, .02) ? 'L\'énergie utile d\'une lampe est l\'énergie <b>lumineuse</b> (3 J), pas l\'énergie thermique.' : dEta(v, 3, 60) }),
        nombre('b) Calcule le rendement de la lampe fluocompacte (2 chiffres significatifs).', 'η =', 3 / 11, '', calc(`η = ${fr('3 J', '11 J')} ≈ ${c('0,27')} (27 %)`),
          { rel: .02, affiche: '0,27', diag: v => proche(v, 8 / 11, .02) ? 'L\'énergie utile est l\'énergie lumineuse (3 J).' : dEta(v, 3, 11) }),
        choix('c) Quelle est la lampe la plus économe ? Justifier.', [o('ok', 'la lampe fluocompacte : elle a le meilleur rendement'), o('a', 'la lampe à incandescence : elle reçoit plus d\'énergie'), o('b', 'les deux : elles donnent la même énergie lumineuse')], 'ok',
          '<p>La lampe la plus économe est la fluocompacte, qui a le meilleur rendement : pour la même lumière (3 J), elle consomme 11 J au lieu de 60 J.</p>',
          { indices: { a: 'Recevoir plus d\'énergie pour la même lumière, c\'est gaspiller.', b: 'Même lumière, mais pas la même énergie consommée : compare les rendements.' } }),
      ] },

    /* ============================ EXERCICE 9 ============================ */
    { id: '9', groupe: 'puis', titre: 'Exercice 9 p. 31 : calculer une puissance instantanée', desc: 'P(t) = E\'(t), puis P à t = 10 s.',
      contexte: '<p class="er-contexte">L\'énergie convertie par un système est donnée par une fonction de t : E = f(t). Déterminer l\'expression de la puissance instantanée P(t) dans chacun des cas suivants et calculer la puissance instantanée échangée à t = 10 s.</p><ul class="ep-donnees"><li>a) E(t) = 500</li><li>b) E(t) = 25 × t + 5</li><li>c) E(t) = 98 × t² + 5 × t + 1</li><li>d) E(t) = 25 × sin(6,28 × t) + 2</li></ul><p class="ph-donnees">On a l\'expression de E en fonction de t : on calcule P en dérivant E (P = E\').</p>',
      parties: [
        nombre('a) E(t) = 500 : calcule P(10).', 'P(10) =', 0, 'W', calc(`P(t) = 0 (dérivée d'une constante) ; pour t = 10 s, ${c('P(10) = 0 W')}`), { tol: 1e-9, signe: true, diag: v => proche(v, 500) ? 'La dérivée d\'une constante est 0.' : 'La dérivée d\'une constante est 0.' }),
        nombre('b) E(t) = 25 t + 5 : calcule P(10).', 'P(10) =', 25, 'W', calc(`P(t) = 25 ; pour t = 10 s, ${c('P(10) = 25 W')}`),
          { diag: v => proche(v, 255) ? 'Tu as calculé E(10) : dérive d\'abord, P(t) = 25.' : proche(v, 30) ? 'La constante 5 disparaît en dérivant.' : proche(v, 250) ? 'La dérivée de 25 t est 25 (pas 25 t).' : 'La dérivée de a t + b est a.' }),
        gab('c) E(t) = 98 t² + 5 t + 1 : écris P(t).', 'P(t) =', [{ v: 196, aria: 'Coefficient de t' }, 't +', { v: 5, aria: 'Terme constant' }], calc(`P(t) = 2 × 98 t + 5 = ${c('196 t + 5')}`),
          { diag: ([u, v]) => proche(u, 98) ? 'La dérivée de 98 t² est 2 × 98 t.' : proche(v, 6) ? 'La constante 1 disparaît.' : 'Dérive terme à terme : a t² → 2 a t ; b t → b ; constante → 0.' }),
        nombre('c) Calcule P(10).', 'P(10) =', 1965, 'W', calc(`P(10) = 196 × 10 + 5 = ${c('1 965 W')}`), { diag: v => proche(v, 9851) ? 'Tu as calculé E(10) : utilise P(t) = 196 t + 5.' : 'P(10) = 196 × 10 + 5.' }),
        gab('d) E(t) = 25 sin(6,28 t) + 2 : écris P(t). (La dérivée de sin(a t) est a cos(a t).)', 'P(t) =', [{ v: 157, rel: .001, aria: 'Coefficient devant le cosinus' }, 'cos(', { v: 6.28, aria: 'Nombre devant t' }, 't)'],
          calc(`P(t) = 25 × 6,28 cos(6,28 t) + 0 = ${c('157 cos(6,28 t)')}`), { diag: ([u]) => proche(u, 25) ? 'Multiplie 25 par 6,28.' : 'La dérivée de A sin(ω t) est A ω cos(ω t).' }),
        nombre('d) Calcule P(10), calculatrice en radians (3 chiffres significatifs).', 'P(10) =', 157 * Math.cos(62.8), 'W', calc(`P(10) = 157 cos(6,28 × 10) = 157 cos(62,8) ≈ ${c('157 W')}, en réglant la calculatrice en <b>radians</b> et non en degrés`),
          { rel: .01, signe: true, affiche: '157', diag: v => proche(v, 157 * Math.cos(62.8 * Math.PI / 180), .02) ? 'Ta calculatrice est en degrés : passe-la en <b>radians</b>.' : 'P(10) = 157 × cos(62,8), en radians.' }),
      ] },

    /* ============================ EXERCICE 8 ============================ */
    { id: '8', groupe: 'puis', titre: 'Exercice 8 p. 31 : énergie cinétique d\'un véhicule', desc: 'v(t) = 2 t, E<sub>c</sub> = 2 m t², P = 4 m t.',
      contexte: '<p class="er-contexte">Un véhicule d\'une masse de 1 000 kg accélère de façon constante et voit sa vitesse augmenter selon la loi suivante : v(t) = 2 × t.</p>',
      parties: [
        choix('a) Rappeler l\'expression de l\'énergie cinétique, en précisant les unités.', [o('ok', 'E<sub>c</sub> = ½ m v² (E<sub>c</sub> en J, m en kg, v en m/s)'), o('a', 'E<sub>c</sub> = ½ m v (E<sub>c</sub> en J, m en kg, v en m/s)'), o('b', 'E<sub>c</sub> = m g z (E<sub>c</sub> en J, m en kg, z en m)')], 'ok',
          '<p>E<sub>c</sub> = ½ m v², avec E<sub>c</sub> en J, m en kg et v en m/s.</p>', { melanger: false, indices: { a: 'La vitesse est au carré.', b: 'C\'est l\'énergie potentielle de pesanteur.' } }),
        gab('b) En déduire E<sub>c</sub> en fonction de la masse et du temps.', 'E<sub>c</sub>(t) =', [{ v: 2, aria: 'Coefficient' }, '× m × t²'], calc(`E<sub>c</sub>(t) = ½ m (2 t)² = ½ m × 4 t² = ${c('2 m t²')}`),
          { diag: ([v]) => proche(v, 1) ? '(2 t)² = 4 t² : le 2 aussi est au carré.' : proche(v, 4) ? 'N\'oublie pas le ½.' : 'Remplace v par 2 t dans ½ m v².' }),
        gab('c) Détermine l\'expression de la puissance instantanée reçue par le véhicule.', 'P(t) =', [{ v: 4, aria: 'Coefficient' }, '× m × t'], calc(`P = E<sub>c</sub>' = 2 m × 2 t = ${c('4 m t')}`),
          { diag: ([v]) => proche(v, 2) ? 'La dérivée de t² est 2 t : 2 m × 2 t.' : 'P(t) est la dérivée de E<sub>c</sub>(t) = 2 m t².' }),
        nombre('d) Calcule la puissance reçue par le véhicule à t = 2 s.', 'P(2) =', 8000, 'W', calc(`P(2) = 4 × 1 000 × 2 = ${c('8 000 W')}`), { diag: v => proche(v, 8) ? 'La masse est m = 1 000 kg.' : proche(v, 4000) ? 'P(t) = 4 m t : 4 × 1 000 × 2.' : 'P(2) = 4 × m × 2.' }),
        nombre('d) Calcule la puissance reçue à t = 4 s.', 'P(4) =', 16000, 'W', calc(`P(4) = 4 × 1 000 × 4 = ${c('16 000 W')}`), { diag: v => proche(v, 32000) ? 'Tu as calculé E<sub>c</sub>(4) = 2 m t² ; utilise P(t) = 4 m t.' : 'P(4) = 4 × m × 4.' }),
      ] },

    /* ============================ EXERCICE 10 ============================ */
    { id: '10', groupe: 'puis', titre: 'Exercice 10 p. 31 : appareil électrique', desc: 'Coefficient directeur d\'une droite E(t).',
      contexte: `<p class="er-contexte">La courbe ci-dessous donne l'énergie électrique consommée par un appareil en fonction du temps d'utilisation.</p>${graphe(G10)}`,
      parties: [
        choix('a) Cette droite représente-t-elle une fonction linéaire ou affine ? Justifier.', [o('ok', 'linéaire, car elle passe par l\'origine'), o('a', 'affine, car c\'est une droite'), o('b', 'linéaire, car elle monte')], 'ok',
          '<p>Cette droite est linéaire car elle passe par l\'origine.</p>', { melanger: false, indices: { a: 'Une droite qui passe par l\'origine représente une fonction linéaire (cas particulier des fonctions affines, avec b = 0).', b: 'Monter ne suffit pas : regarde si elle passe par l\'origine.' } }),
        nombre('b) Détermine le coefficient directeur de cette droite (lis le point d\'abscisse 40 s).', 'a =', 250, 'J/s', calc(`Coefficient directeur = ${fr('10 000 J', '40 s')} = ${c('250 J/s')} (= 250 W)`),
          { diag: v => proche(v, .004) ? 'Rapport inversé : a = ΔE / Δt.' : proche(v, 10000) ? 'Divise par la durée : a = ΔE / Δt.' : 'Au point t = 40 s, E = 10 000 J : a = 10 000 / 40.' }),
        gab('c) En déduire une expression de la fonction donnant l\'énergie en fonction du temps.', 'E =', [{ v: 250, aria: 'Coefficient directeur' }, '× t'], calc(`Équation de la droite : y = 250 x ; avec les notations E et t : ${c('E = 250 t')}`),
          { diag: () => 'Une fonction linéaire s\'écrit E = a t, avec a le coefficient directeur.' }),
        choix('d) Rappelle la relation permettant de calculer la puissance instantanée en fonction de l\'énergie.', [o('ok', 'P(t) = E\'(t) (dérivée de l\'énergie)'), o('a', 'P = E × t'), o('b', 'P(t) = E(t) / t² ')], 'ok',
          '<p>On a E en fonction de t : P(t) = E\'(t), la dérivée de l\'énergie.</p>', { melanger: false, indices: { a: 'Vérifie les unités : J × s n\'est pas une puissance.', b: 'On dérive l\'énergie par rapport au temps : P = E\'.' } }),
        nombre('e) En déduire la puissance instantanée consommée par cet appareil.', 'P =', 250, 'W', calc(`P(t) = E'(t) = ${c('250 W')} (la dérivée de 250 t est 250)`),
          { diag: v => proche(v, 15000) ? 'Dérive E = 250 t : P = 250.' : 'La dérivée de a t est a.' }),
      ] },

    /* ============================ EXERCICE 7 ============================ */
    { id: '7', groupe: 'ener', titre: 'Exercice 7 p. 31 : calcul de l\'énergie', desc: 'Un rectangle et un triangle sous la courbe P(t).',
      contexte: '<p class="er-contexte">1. Rappeler l\'expression permettant de calculer l\'énergie échangée à partir de la puissance.<br>2. Dans chacun des cas suivants, déterminer l\'énergie échangée par le convertisseur : a) entre t = 1 s et t = 3 s ; b) entre t = 100 s et t = 200 s.</p>',
      parties: [
        choix('1. Comment calcule-t-on l\'énergie échangée à partir de la puissance ?', [o('ok', 'E = P × Δt si P est constante ; sinon E = aire sous la courbe P(t)'), o('a', 'E = P / Δt'), o('b', 'E = P × Δt dans tous les cas, avec la valeur maximale de P')], 'ok',
          '<p>Si P est constante : E = P × Δt (et P = E / Δt). Sinon, E est l\'aire sous la courbe P(t) ; inversement, P est la dérivée de E (P = E\').</p>', { melanger: false, indices: { a: 'Vérifie les unités : W / s n\'est pas une énergie. E = P × Δt.', b: 'Quand P varie, on calcule l\'aire sous la courbe.' } }),
        partieAire({ g: G7a, de: 1, a: 3, t1: 0, t2: 4, q: '2. a) Règle l\'intervalle de t = 1 s à t = 3 s sur le graphique.', solution: '<p>L\'aire hachurée est un rectangle : base 2 s, hauteur 200 W.</p>' }),
        nombre('2. a) Calcule l\'énergie échangée entre t = 1 s et t = 3 s.', 'E =', 400, 'J', calc(`E = 200 W × 2 s = ${c('400 J')}`),
          { diag: v => proche(v, 600) ? 'La durée est Δt = 3 − 1 = 2 s.' : proche(v, 200) ? 'C\'est un rectangle : pas de / 2.' : 'E = P × Δt.' }),
        partieAire({ g: G7b, de: 100, a: 200, t1: 0, t2: 50, q: '2. b) Règle l\'intervalle de t = 100 s à t = 200 s.', solution: '<p>L\'aire hachurée est un triangle : base 100 s, hauteur 200 W.</p>' }),
        nombre('2. b) Calcule l\'énergie échangée entre t = 100 s et t = 200 s.', 'E =', 10000, 'J', calc(`E = ${fr('200 W × 100 s', '2')} = ${c('10 000 J')} (= 10 kJ)`),
          { diag: v => proche(v, 20000) ? 'C\'est un triangle : base × hauteur / 2.' : proche(v, 20000 * 2) ? 'La base est 200 − 100 = 100 s.' : 'Aire du triangle : base × hauteur / 2.' }),
      ] },

    /* ============================ EXERCICE 15 ============================ */
    { id: '15', groupe: 'ener', titre: 'Exercice 15 p. 32 : installation de levage', desc: 'De I(t) à P(t), puis l\'aire sous la courbe.',
      contexte: `<p class="er-contexte">La courbe ci-dessous indique l'intensité du courant d'alimentation d'un moteur dans une installation industrielle de levage fonctionnant à <b>tension constante 400 V</b>.</p>${graphe(G15I)}`,
      parties: [
        nombre('a) Pour tracer P(t), on multiplie chaque graduation par U, car P = U × I. Quelle puissance correspond à I = 180 A ?', 'P =', 72000, 'W', calc(`P = U × I = 400 V × 180 A = ${c('72 000 W')}`),
          { diag: v => proche(v, 180 / 400) || proche(v, 400 / 180) ? 'P = U × I : on multiplie.' : 'P = U × I avec U = 400 V.' }),
        choix('b) Rappeler la relation permettant de déterminer l\'énergie absorbée à partir de la courbe de puissance.', [o('ok', 'énergie = aire sous la courbe de P (intégrale de P)'), o('a', 'énergie = dérivée de P'), o('b', 'énergie = valeur maximale de P')], 'ok',
          '<p>Énergie = aire sous la courbe de P (= intégrale de P).</p>', { melanger: false, indices: { a: 'C\'est l\'inverse : la puissance est la dérivée de l\'énergie.', b: 'L\'énergie dépend aussi de la durée : c\'est l\'aire sous la courbe.' }, figure: z => { z.innerHTML = graphe(G15P); } }),
        partieAire({ g: G15P, de: 0, a: 25, t1: 50, t2: 75, pas: 5, decoupe: [{ de: 0, a: 25, motif: 1 }], q: 'c) Règle l\'intervalle de t = 0 à t = 25 s sur la courbe de puissance.' }),
        sci('c) En déduire l\'énergie absorbée par le moteur entre t = 0 et t = 25 s.', 'E<sub>1</sub> =', 1.8e6, 'J', calc(`E<sub>1</sub> = 72 000 W × 25 s = 1 800 000 J = ${c('1,8 × 10<sup>6</sup> J')}`),
          { diag: v => proche(v, 180 * 25, .02) ? 'Utilise la puissance (72 000 W), pas l\'intensité.' : 'Rectangle : E<sub>1</sub> = 72 000 W × 25 s.' }),
        partieAire({ g: G15P, de: 25, a: 180, t1: 0, t2: 25, pas: 5,
          decoupe: [{ pts: [[25, 14000], [25, 38000], [180, 14000]], motif: 2 }, { pts: [[25, 0], [25, 14000], [180, 14000], [180, 0]], motif: 3 }],
          q: 'd) Règle l\'intervalle de t = 25 s à t = 180 s : l\'aire se découpe en un triangle posé sur un rectangle.' }),
        { type: 'gabarit', q: 'd) À 25 s, P = 400 × 95 = 38 000 W ; à 180 s, P = 400 × 35 = 14 000 W. Calcule l\'aire du triangle et celle du rectangle.', label: 'triangle :',
          morceaux: [{ v: 24000 * 155 / 2, rel: .01, aria: 'Aire du triangle en J' }, 'J ; rectangle :', { v: 14000 * 155, rel: .01, aria: 'Aire du rectangle en J' }, 'J'],
          diag: ([a, b]) => proche(a, 24000 * 155, .02) ? 'Triangle : base × hauteur / 2.' : proche(a, 38000 * 155 / 2, .02) ? 'Le triangle est posé sur le rectangle : sa hauteur est 38 000 − 14 000 = 24 000 W.' : 'Triangle : 24 000 W × 155 s / 2 ; rectangle : 14 000 W × 155 s.',
          correction: calc(`Durée : 180 − 25 = 155 s<br>triangle : ${fr('24 000 W × 155 s', '2')} = 1 860 000 J ; rectangle : 14 000 W × 155 s = 2 170 000 J`) },
        sci('d) En déduire l\'énergie absorbée entre t = 25 s et t = 180 s.', 'E<sub>2</sub> =', 24000 * 155 / 2 + 14000 * 155, 'J', calc(`E<sub>2</sub> = ${fr('24 000 × 155', '2')} + 14 000 × 155 = 4 030 000 J ≈ ${c('4,0 × 10<sup>6</sup> J')}`),
          { diag: () => 'Additionne l\'aire du triangle et celle du rectangle.' }),
      ] },

    /* ============================ EXERCICE 16 ============================ */
    { id: '16', groupe: 'ener', titre: 'Exercice 16 p. 32 : robot', desc: 'Énergie absorbée et autonomie de la batterie.',
      contexte: `<p class="er-contexte">L'un des deux moteurs d'un robot, alimenté par une série d'accumulateurs de tension globale <b>7,2 V</b>, absorbe en 180 s une intensité moyenne donnée par le graphe ci-dessous. La série d'accumulateurs contient une énergie de <b>11,5 Wh</b>.</p>
        <ul class="ep-donnees"><li>de 0 à t<sub>1</sub> : 5 secondes ;</li><li>de t<sub>1</sub> à t<sub>2</sub> : 55 secondes ;</li><li>de t<sub>2</sub> à t<sub>3</sub> : 60 secondes ;</li><li>de t<sub>3</sub> à t<sub>4</sub> : 60 secondes.</li></ul>${graphe(G16I)}`,
      parties: [
        choix('a) Rappeler la relation permettant de déterminer la puissance électrique consommée par le robot.', [o('ok', 'P = U × I'), o('a', 'P = U / I'), o('b', 'P = E × Δt')], 'ok', '<p>P = U × I.</p>', { melanger: false, indices: { a: 'Vérifie les unités : V / A, ce sont des ohms.', b: 'E × Δt n\'est pas une puissance (et E = P × Δt).' } }),
        { type: 'gabarit', q: 'b) Pour tracer l\'allure de P(t), calcule la puissance sur chaque palier (1 chiffre après la virgule).', label: 'de t<sub>1</sub> à t<sub>2</sub> :',
          morceaux: [{ v: 7.2 * .65, rel: .02, aria: 'Puissance de t1 à t2' }, 'W ; de t<sub>2</sub> à t<sub>4</sub> :', { v: 7.2 * 1.9, rel: .02, aria: 'Puissance de t2 à t4' }, 'W'],
          diag: () => 'P = U × I avec U = 7,2 V : 7,2 × 0,65 et 7,2 × 1,9.', correction: calc('P<sub>1</sub> = 7,2 × 0,65 ≈ 4,7 W ; P<sub>2</sub> = 7,2 × 1,9 ≈ 13,7 W') },
        partieAire({ g: G16P, de: 5, a: 60, t1: 100, t2: 110, pas: 5, q: 'c) Sur la courbe P(t), règle l\'intervalle de t<sub>1</sub> = 5 s à t<sub>2</sub> = 60 s.', solution: '<p>L\'aire est un rectangle : base 55 s, hauteur 4,7 W.</p>' }),
        nombre('c) Détermine, par une méthode géométrique, l\'énergie absorbée entre t<sub>1</sub> et t<sub>2</sub>.', 'E<sub>1</sub> ≈', 4.7 * 55, 'J', calc(`E<sub>1</sub> = 4,7 W × 55 s ≈ ${c('259 J')} (aire du rectangle)`),
          { rel: .02, affiche: '259', diag: v => proche(v, 4.7 * 60, .02) ? 'La durée de t<sub>1</sub> à t<sub>2</sub> est 55 s.' : proche(v, .65 * 55, .02) ? 'Utilise la puissance P = 4,7 W, pas l\'intensité.' : 'Aire du rectangle : 4,7 W × 55 s.' }),
        choix('d) Cette valeur est-elle compatible avec l\'énergie calculée par E = P × Δt ?', [o('ok', 'oui : la relation donne la même valeur, car P est constante sur ce palier'), o('a', 'non : E = P × Δt ne s\'applique jamais à un graphique'), o('b', 'non : il faudrait diviser par 2')], 'ok',
          '<p>La relation E = P × Δt donne la même valeur : c\'est normal, car P est constante.</p>', { melanger: false, indices: { a: 'Sur un palier, P est constante : P × Δt est exactement l\'aire du rectangle.', b: 'C\'est un rectangle : pas de division par 2.' } }),
        partieAire({ g: G16P, de: 60, a: 180, t1: 0, t2: 10, pas: 5, q: 'e) Règle l\'intervalle de t<sub>2</sub> = 60 s à t<sub>4</sub> = 180 s.' }),
        nombre('e) Détermine par une méthode géométrique l\'énergie absorbée entre t<sub>2</sub> et t<sub>4</sub>.', 'E<sub>2</sub> ≈', 13.7 * 120, 'J', calc(`E<sub>2</sub> = 13,7 W × 120 s ≈ ${c('1,64 × 10<sup>3</sup> J')} (aire du rectangle)`),
          { rel: .02, affiche: '1644', diag: v => proche(v, 7.2 * 120, .02) ? 'Multiplie la <b>puissance</b> 13,7 W (et non la tension 7,2 V) par la durée.' : proche(v, 13.7 * 60, .02) ? 'De t<sub>2</sub> à t<sub>4</sub>, il y a 120 s.' : 'Aire du rectangle : 13,7 W × 120 s.' }),
        sci('f) En déduire l\'énergie totale absorbée par les deux moteurs du robot.', 'E<sub>totale</sub> ≈', 2 * (259 + 1640), 'J', calc(`Pour un moteur : E<sub>1</sub> + E<sub>2</sub> ; il y a 2 moteurs :<br>E<sub>totale</sub> = 2 × (259 + 1 640) ≈ ${c('3,8 × 10<sup>3</sup> J')}`),
          { diag: v => proche(v, 259 + 1640, .03) ? 'Le robot a <b>deux</b> moteurs.' : 'E<sub>totale</sub> = 2 × (E<sub>1</sub> + E<sub>2</sub>).' }),
        nombre('g) Le robot utilise 3 800 J en 175 s (de t<sub>1</sub> à t<sub>4</sub>). Quelle est sa puissance moyenne ?', 'P ≈', 3800 / 175, 'W', calc(`P = ${fr('3 800 J', '175 s')} ≈ ${c('21,7 W')} (21,7 J en une seconde)`),
          { rel: .01, affiche: '21,7', diag: v => proche(v, 3800 / 180, .01) ? 'Le robot ne consomme rien pendant les 5 premières secondes : Δt = 175 s.' : proche(v, 175 / 3800, .02) ? 'Rapport inversé : P = E / Δt.' : 'P = E / Δt.' }),
        nombre('g) Convertis l\'énergie disponible dans la batterie, 11,5 Wh, en joules.', 'E =', 41400, 'J', calc(`E = 11,5 Wh = 11,5 W × 3 600 s = ${c('41 400 J')}`),
          { diag: v => proche(v, 690) ? '1 h = 3 600 s.' : '1 Wh = 3 600 J.' }),
        nombre('g) Quelle durée de fonctionnement assure la batterie, en minutes ?', 'autonomie ≈', 41400 / 21.7 / 60, 'min', calc(`autonomie = ${fr('41 400 J', '21,7 W')} ≈ 1 908 s, soit ${fr('1 908', '60')} ≈ ${c('31,8 min')}`),
          { rel: .02, affiche: '31,8', diag: v => proche(v, 1908, .02) ? 'C\'est en secondes : divise par 60.' : proche(v, 21.7 / 41400 * 60, .05) ? 'autonomie = énergie / puissance.' : 'autonomie = énergie disponible / puissance moyenne.' }),
      ] },
  ];

  window.EP.EXERCICES = EXERCICES;
  window.EP.GROUPES_EX = GROUPES_EX;
})();
