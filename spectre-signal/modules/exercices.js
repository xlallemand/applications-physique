/* ============================================================
   Exercices du module 4 (application « Chapitre 17 : Spectre d'un
   signal périodique ») : les exercices de la feuille, dans l'ordre de
   la correction et avec la numérotation du manuel : 9 p. 219, 6 p. 218,
   11 p. 220, 12 p. 220, 13 p. 221, 14 p. 221. Les graphiques sont
   redessinés en SVG (SP.DOCS) ; les signaux sont calculés à partir de
   leur spectre (assets/fourier.js).

   Chaque exercice : { id, groupe, titre, desc, contexte (HTML),
   parties: [p] ou une fonction qui les fabrique, voir (signal à charger
   dans le simulateur, facultatif) } ; chaque partie suit le format de
   SP.PARTIES avec p.q (question) et p.correction (correction détaillée :
   formule, grandeur isolée, application numérique avec les unités).

   Valeurs vérifiées par un script :
     ex. 9 : |a0| = 2 V ; f1 = 50 Hz ; a1 = 8 V ; f6 = 300 Hz, a6 = 1 V ;
       a3 = 0 ; T = 1 / 50 = 0,020 s ;
     ex. 6 : T = 5,0 ms, f = 200 Hz ; rangs 2 (400 Hz) et 5 (1 000 Hz) ;
       a1 = 500 mV, a2 = 750 mV, a5 = 1 000 mV ;
     ex. 11 : f1 = 100 Hz ; [100 ; 700] Hz, largeur 600 Hz ; de 200 à
       1 200 Hz : rangs 3, 5, 7, 9 et 11 ;
     ex. 12 : guitare 3,08 kHz ≈ 3,1 kHz = 7 × 0,44 kHz ; orgue
       0,88 kHz = 2 × 0,44 kHz ;
     ex. 13 : 3T = 10 ms, T = 3,3 ms, f = 1 / 3,3 × 10⁻³ ≈ 300 Hz ;
       600, 900, 1 200 Hz ; 6 000 / 60 = 100 tr/s ; 300, 400, 500
       combustions/s ; 6 cylindres ;
     ex. 14 : f1 = 50 Hz ; 150, 250, 350 Hz ; a1 = 1, a3 = 0,86,
       a5 = 0,81, a7 = 0,72.
   Écarts avec la correction :
     ex. 11 d) la correction ajoute le rang 13 et place la dernière
       raie à « 1 200 Hz » : elle est à 1 300 Hz, hors de l'intervalle
       [200 Hz ; 1 200 Hz] : rangs 3, 5, 7, 9 et 11 seulement ;
     ex. 12 a) la correction lit 0,80 kHz pour l'orgue : sur le
       graphique, la raie est à 0,87 kHz environ, soit 2 × 0,44 kHz
       (rang 2, comme dans la correction) : on attend 0,88 kHz.
   ============================================================ */
(function () {
  'use strict';

  const { o, fr, proche, fmt, DOCS, SPEC } = window.SP;
  const calc = h => `<p class="ph-calc">${h}</p>`;
  const c = h => `<span class="c">${h}</span>`;
  const an = n => `a<sub>${n}</sub>`;
  const fn = n => `f<sub>${n}</sub>`;
  // fabriques de parties
  const choix = (q, options, bonne, correction, opts) => Object.assign({ type: 'choix', q, options, bonne, correction, melanger: false, colonne: options.some(x => x.label.replace(/<[^>]+>/g, '').length > 24) }, opts);
  const nombre = (q, label, valeur, unite, correction, opts) => Object.assign({ type: 'nombre', q, label, valeur, unite, correction, signe: false }, opts);
  const gabarit = (q, morceaux, correction, opts) => Object.assign({ type: 'gabarit', q, morceaux, correction }, opts);
  const figSpectre = (d, W) => window.SP.figSpectre(d.raies, Object.assign({ Wmax: W || 560 }, d.opts));
  const figSignal = (d, W) => window.SP.figSignal(d.spec, Object.assign({ Wmax: W || 620, H: 230 }, d.opts));

  /* ---------- Exercice 9 p. 219 : lire un spectre ---------- */
  const ex9 = {
    id: '9', groupe: 'lire', titre: 'Exercice 9 p. 219 : spectre d\'une tension', desc: 'Composante continue, fondamental, harmoniques, période',
    contexte: `<p class="er-contexte">Soit le spectre d'amplitude d'une tension périodique u(t).</p>${figSpectre(DOCS.ex9)}`,
    parties: [
      nombre('a) Quelle est la valeur absolue de la composante continue de la tension u(t) ?', `|${an(0)}| =`, 2, 'V',
        `<p>La composante continue est la raie à 0 Hz : |${an(0)}| = ${c('2 V')}.</p>`,
        { tol: .25, diag: v => (proche(v, 8) ? 'C\'est la raie à 50 Hz, le fondamental. La composante continue est la raie à <b>0 Hz</b>, contre l\'axe vertical.' : 'Regarde la raie à 0 Hz, contre l\'axe vertical (une ligne du quadrillage par volt).') }),
      nombre('b) Quelle est la fréquence du fondamental ?', `${fn(1)} =`, 50, 'Hz', `<p>Le fondamental est la première raie après 0 Hz : ${fn(1)} = ${c('50 Hz')}.</p>`,
        { tol: 3, diag: v => (proche(v, 0) ? 'La raie à 0 Hz est la composante continue, pas le fondamental.' : proche(v, 250) ? 'Le fondamental n\'est pas la raie la plus haute : c\'est la première raie après 0 Hz.' : 'Première raie après 0 Hz ; une ligne verticale tous les 25 Hz.') }),
      nombre('c) Quelle est l\'amplitude du fondamental ?', `${an(1)} =`, 8, 'V', `<p>${an(1)} = ${c('8 V')}.</p>`,
        { tol: .3, diag: v => (proche(v, 2) ? 'C\'est la raie à 0 Hz : prends celle à 50 Hz.' : 'Hauteur de la raie à 50 Hz (une ligne du quadrillage par volt).') }),
      nombre('d) Quelle est la fréquence de l\'harmonique de rang 6 ?', `${fn(6)} =`, 300, 'Hz', calc(`${fn(6)} = 6 × ${fn(1)} = 6 × 50 Hz = ${c('300 Hz')}`),
        { tol: 3, diag: v => (proche(v, 400) ? 'La 6<sup>e</sup> raie dessinée n\'est pas le rang 6 : le rang 3 manque. Calcule 6 × f<sub>1</sub>.' : proche(v, 250) ? 'Le rang n\'est pas la position de la raie : f<sub>6</sub> = 6 × f<sub>1</sub>.' : 'f<sub>6</sub> = 6 × f<sub>1</sub>.') }),
      nombre('Quelle est son amplitude ?', `${an(6)} =`, 1, 'V', `<p>La raie à 300 Hz : ${an(6)} = ${c('1 V')}.</p>`,
        { tol: .25, diag: v => (proche(v, 7) ? 'C\'est la raie à 400 Hz (rang 8). Le rang 6 est à 300 Hz.' : 'Hauteur de la raie à 300 Hz.') }),
      nombre('e) Quelle est l\'amplitude de l\'harmonique de rang 3 ?', `${an(3)} =`, 0, 'V', `<p>Le rang 3 est à 3 × 50 = 150 Hz : il n'y a pas de raie, donc ${an(3)} = ${c('0 V')}.</p>`,
        { tol: .01, diag: v => (proche(v, 11) ? 'La raie à 100 Hz est le rang 2 (100 / 50 = 2). Le rang 3 est à 150 Hz.' : proche(v, 5) ? 'La raie à 200 Hz est le rang 4 (200 / 50). Le rang 3 est à 150 Hz.' : 'Le rang 3 est à 3 × 50 = 150 Hz : y a-t-il une raie ?') }),
      nombre('f) Quelle est la fréquence de la tension u(t) ?', 'f =', 50, 'Hz', `<p>La fréquence du signal est celle du fondamental : f = ${fn(1)} = ${c('50 Hz')}.</p>`,
        { tol: 1, diag: v => (proche(v, 400) || proche(v, 250) ? 'La fréquence du signal est celle du <b>fondamental</b>.' : 'f = f<sub>1</sub>.') }),
      nombre('En déduire sa période.', 'T =', .02, 's', calc(`T = ${fr('1', 'f')} = ${fr('1', '50 Hz')} = ${c('0,020 s')}`),
        { rel: .01, affiche: '0,020', diag: v => (proche(v, 20) ? 'En secondes : 20 ms = 0,020 s.' : proche(v, 50) ? 'T = 1 / f.' : 'T = 1 / f, en s.') }),
    ],
  };

  /* ---------- Exercice 6 p. 218 : signal et spectre ---------- */
  const ex6 = {
    id: '6', groupe: 'lire', titre: 'Exercice 6 p. 218 : signal et spectre', desc: 'Période, fondamental, rangs et amplitudes des harmoniques', voir: SPEC.ex6,
    contexte: `<p class="er-contexte">On a enregistré un signal u(t) et son spectre d'amplitude.</p>${figSignal(DOCS.ex6Signal)}${figSpectre(DOCS.ex6)}`,
    parties: [
      nombre('1. D\'après l\'enregistrement du signal, quelle est sa période ?', 'T =', 5, 'ms', '<p>Le motif se répète toutes les 5,0 ms : on mesure T = ' + c('5,0 ms') + ' (entre t = 0 et t = 5 ms, par exemple).</p>',
        { tol: .15, diag: v => (proche(v, 10) ? 'Sur 10 ms, il y a deux périodes : divise par 2.' : proche(v, 2.5) ? 'À 2,5 ms le signal n\'a pas encore repris la même valeur en variant dans le même sens : cherche où le motif recommence.' : 'Cherche l\'instant où le motif recommence à l\'identique (à t = 0, le signal part de 0 en montant).') }),
      nombre('En déduire la fréquence du signal.', 'f =', 200, 'Hz', calc(`f = ${fr('1', 'T')} = ${fr('1', '5,0 × 10<sup>−3</sup> s')} = ${c('200 Hz')}`),
        { rel: .02, diag: v => (proche(v, .2) ? 'T doit être en secondes : 5,0 ms = 5,0 × 10<sup>−3</sup> s.' : 'f = 1 / T, avec T en s.') }),
      nombre('2. D\'après le spectre d\'amplitude, quelle est la fréquence du fondamental ?', `${fn(1)} =`, 200, 'Hz', `<p>La première raie est à ${fn(1)} = ${c('200 Hz')}.</p>`,
        { tol: 15, diag: v => (proche(v, 250) ? 'La raie est un peu avant la graduation 250 : une ligne verticale tous les 50 Hz.' : proche(v, 1000) ? 'Le fondamental est la première raie (la plus basse fréquence), pas la plus haute.' : 'Première raie du spectre.') }),
      choix('Commente ce résultat.', [o('ok', 'On retrouve la fréquence du signal : le fondamental a la fréquence du signal'), o('diff', 'C\'est une autre fréquence que celle du signal'), o('max', 'C\'est la raie la plus haute')], 'ok',
        '<p>On retrouve la fréquence du signal : f = f<sub>1</sub> = 200 Hz.</p>',
        { indices: { diff: 'Compare avec la fréquence trouvée à la question 1.', max: 'La raie la plus haute est à 1 000 Hz.' } }),
      gabarit('3. Détermine les fréquences des harmoniques et leur rang.', ['f =', { v: 400, tol: 15, aria: 'Fréquence du premier harmonique, en Hz' }, 'Hz, rang', { v: 2, aria: 'Rang du premier harmonique' }, '; f =', { v: 1000, tol: 15, aria: 'Fréquence du second harmonique, en Hz' }, 'Hz, rang', { v: 5, aria: 'Rang du second harmonique' }],
        calc(`Rang 2 : ${fn(2)} = 2 × 200 = ${c('400 Hz')} ; rang 5 : ${fn(5)} = 5 × 200 = ${c('1 000 Hz')}`),
        { diag: v => (v[3] === 3 ? 'Le rang n\'est pas la position de la raie : n = f / f<sub>1</sub> = 1 000 / 200.' : 'Rang : n = f / f<sub>1</sub>, avec f<sub>1</sub> = 200 Hz.') }),
      gabarit('4. Quelle est l\'amplitude de chacun des harmoniques composant le spectre ?', [`${an(1)} =`, { v: 500, tol: 30 }, 'mV ;', `${an(2)} =`, { v: 750, tol: 30 }, 'mV ;', `${an(5)} =`, { v: 1000, tol: 30 }, 'mV'],
        `<p>${an(1)} = ${c('500 mV')} (fondamental) ; ${an(2)} = ${c('750 mV')} ; ${an(5)} = ${c('1 000 mV')}. Les amplitudes des rangs 3 et 4 sont nulles.</p>`,
        { diag: v => (v.some(x => x > 0 && x < 2) ? 'Le spectre est en <b>mV</b>.' : 'Une ligne horizontale du quadrillage tous les 100 mV.') }),
      choix('5. Le signal comporte-t-il une composante continue ?', [o('ok', 'Non : il n\'y a pas de raie à 0 Hz'), o('oui', 'Oui : a<sub>0</sub> = 500 mV'), o('forme', 'Oui, car le signal n\'est pas une sinusoïde')], 'ok',
        '<p>Il n\'y a pas de pic à 0 Hz, donc pas de composante continue (le signal est symétrique : sa valeur moyenne est nulle).</p>',
        { indices: { oui: '500 mV est l\'amplitude du fondamental, à 200 Hz. La composante continue serait à 0 Hz.', forme: 'Un signal non sinusoïdal a des harmoniques ; la composante continue, elle, est la raie à 0 Hz.' } }),
    ],
  };

  /* ---------- Exercice 11 p. 220 : transmettre des harmoniques ---------- */
  const ex11 = {
    id: '11', groupe: 'bande', titre: 'Exercice 11 p. 220 : transmettre des harmoniques', desc: 'Fondamental, rangs, intervalle de fréquences',
    contexte: `<p class="er-contexte">Soit le spectre d'amplitude d'un signal périodique.</p>${figSpectre(DOCS.ex11)}`,
    parties: [
      nombre('a) Quelle est la fréquence du fondamental ?', `${fn(1)} =`, 100, 'Hz', `<p>Première raie : ${fn(1)} = ${c('100 Hz')}.</p>`,
        { tol: 10, diag: v => (proche(v, 900) ? 'Le fondamental n\'est pas forcément la raie la plus haute : c\'est la première.' : 'Première raie ; une ligne verticale tous les 100 Hz.') }),
      choix('b) Quels sont les rangs des harmoniques ?', [o('ok', '1, 3, 5, 7, 9, 11 et 13'), o('pos', '1, 2, 3, 4, 5, 6 et 7'), o('f', '100, 300, 500, 700, 900, 1 100 et 1 300')], 'ok',
        calc(`n = ${fr('f<sub>n</sub>', 'f<sub>1</sub>')} : ${fr('300', '100')} = 3, ${fr('500', '100')} = 5… ${fr('1 300', '100')} = 13`) + '<p>Seuls les rangs impairs sont présents.</p>',
        { indices: { pos: 'Le rang n\'est pas la position de la raie : n = f<sub>n</sub> / f<sub>1</sub>. Calcule 300 / 100.', f: 'Ce sont les fréquences. Le rang est n = f<sub>n</sub> / f<sub>1</sub>.' } }),
      gabarit('c) On souhaite transmettre les harmoniques de rang n = 1 à 7. Quel intervalle de fréquences choisit-on ?', ['[', { v: 100, tol: 5 }, 'Hz ;', { v: 700, tol: 5 }, 'Hz ]'],
        calc(`Rang 1 : ${fn(1)} = 100 Hz ; rang 7 : ${fn(7)} = 7 × 100 = 700 Hz. Il faut transmettre ${c('[100 Hz ; 700 Hz]')}`),
        { diag: v => (proche(v[1], 800) ? 'La borne haute est la fréquence du rang 7 : 7 × 100 Hz.' : proche(v[0], 0) ? 'La borne basse est la fréquence du rang 1.' : 'De f<sub>1</sub> à f<sub>7</sub> = 7 × f<sub>1</sub>.') }),
      nombre('Quelle est la largeur de cet intervalle ?', 'Δf =', 600, 'Hz', calc(`Δf = 700 − 100 = ${c('600 Hz')}`),
        { diag: v => (proche(v, 700) ? 'Retire la borne basse : 700 − 100.' : proche(v, 800) ? 'On soustrait les bornes.' : 'Δf = borne haute − borne basse.') }),
      nombre('d) On transmet un intervalle de largeur Δf = 1 000 Hz à partir de la fréquence 200 Hz. Quelle est la borne haute de cet intervalle ?', 'f<sub>max</sub> =', 1200, 'Hz', calc(`f<sub>max</sub> = 200 + 1 000 = ${c('1 200 Hz')} : l'intervalle est [200 Hz ; 1 200 Hz]`),
        { diag: v => (proche(v, 1000) ? 'L\'intervalle commence à 200 Hz : 200 + 1 000.' : 'f<sub>max</sub> = 200 Hz + Δf.') }),
      choix('Quels harmoniques seront transmis ?', [o('ok', 'Les rangs 3, 5, 7, 9 et 11'), o('13', 'Les rangs 3, 5, 7, 9, 11 et 13'), o('1', 'Les rangs 1, 3, 5, 7, 9 et 11'), o('2', 'Les rangs 2 à 12')], 'ok',
        '<p>Dans [200 Hz ; 1 200 Hz] : les raies à 300, 500, 700, 900 et 1 100 Hz, soit les rangs ' + c('3, 5, 7, 9 et 11') + '. Le fondamental (100 Hz) est en dessous ; la raie de rang 13 est à 1 300 Hz, au-dessus de 1 200 Hz : elle n\'est pas transmise.</p>',
        { indices: { 13: 'Le rang 13 est à 13 × 100 = 1 300 Hz : au-dessus de 1 200 Hz.', 1: 'Le fondamental est à 100 Hz : en dessous de 200 Hz.', 2: 'Les rangs pairs n\'existent pas dans ce spectre : il n\'y a pas de raie à 200, 400… Hz.' } }),
    ],
  };

  /* ---------- Exercice 12 p. 220 : deux instruments ---------- */
  const ex12 = {
    id: '12', groupe: 'bande', titre: 'Exercice 12 p. 220 : guitare et orgue', desc: 'Harmonique le plus élevé, rang, bande passante',
    contexte: `<p class="er-contexte">Pour transmettre le son émis par deux instruments de musique, on utilise un système qui possède une <b>bande passante de 0 à 2 kHz</b>. La bande passante est l'intervalle de fréquences des signaux sinusoïdaux qu'un système est capable de transmettre avec une bonne qualité.</p>
      <div class="sp-figs deux"><div>${figSpectre(DOCS.ex12Guitare, 460)}<p class="sp-fig-leg">Guitare folk</p></div><div>${figSpectre(DOCS.ex12Orgue, 460)}<p class="sp-fig-leg">Orgue</p></div></div>`,
    parties: [
      gabarit('a) Pour les deux instruments, quelle est la fréquence de l\'harmonique de rang le plus élevé ?', ['guitare :', { v: 3.08, tol: .07, aria: 'Guitare, en kHz' }, 'kHz ; orgue :', { v: .88, tol: .06, aria: 'Orgue, en kHz' }, 'kHz'],
        '<p>Guitare folk : la dernière raie est à ' + c('3,1 kHz') + ' environ. Orgue : la dernière raie est à ' + c('0,88 kHz') + ' environ (entre 0,75 et 1 kHz, un peu avant le milieu).</p>',
        { diag: v => (proche(v[1], .44, .1) ? 'Pour l\'orgue, prends la raie la plus à droite.' : proche(v[0], 3080, .05) || proche(v[1], 880, .1) ? 'L\'axe est gradué en <b>kHz</b>.' : 'Prends la raie la plus à droite de chaque spectre.') }),
      gabarit('b) Précise le rang de cet harmonique.', ['guitare : rang', { v: 7 }, '; orgue : rang', { v: 2 }],
        calc(`Fondamentaux : 0,44 kHz pour les deux instruments. Guitare : n = ${fr('3,08 kHz', '0,44 kHz')} = ${c('7')} ; orgue : n = ${fr('0,88 kHz', '0,44 kHz')} = ${c('2')}`),
        { diag: v => (v[0] === 5 ? 'Le rang n\'est pas la position de la raie (des harmoniques manquent) : n = f / f<sub>1</sub> avec f<sub>1</sub> = 0,44 kHz.' : 'n = f / f<sub>1</sub> ; f<sub>1</sub> est la première raie de chaque spectre.') }),
      { type: 'grille', q: 'c) Le son émis par ces deux instruments sera-t-il transmis avec une bonne qualité ?', options: [o('bien', 'bien transmis'), o('mal', 'mal transmis')],
        lignes: [
          { id: 'g', label: 'Guitare folk <span class="sp-grille-desc">harmoniques jusqu\'à 3,1 kHz</span>', bonne: 'mal', indices: { bien: 'Des raies de la guitare sont au-dessus de 2 kHz (2,2 et 3,1 kHz).' } },
          { id: 'o', label: 'Orgue <span class="sp-grille-desc">harmoniques jusqu\'à 0,88 kHz</span>', bonne: 'bien', indices: { mal: 'Toutes les raies de l\'orgue sont en dessous de 2 kHz.' } }],
        correction: '<p>Le signal de la guitare folk ne sera pas transmis avec une bonne qualité : il a des harmoniques au-dessus de 2 kHz, qui ne seront pas transmis. Le signal de l\'orgue sera bien transmis : tous ses harmoniques sont en dessous de 2 kHz.</p>' },
      choix('d) S\'il manque des harmoniques à un signal, sa fréquence sera-t-elle modifiée ?', [o('ok', 'Non : elle correspond au fondamental, qui est transmis'), o('oui', 'Oui : elle diminue'), o('forme', 'Oui : elle change avec la forme du signal')], 'ok',
        '<p>La fréquence ne sera pas modifiée car elle correspond au fondamental. Seule la forme du signal (le timbre du son) change.</p>',
        { indices: { oui: 'La période du signal est imposée par le fondamental.', forme: 'La forme change, mais pas la période : elle est imposée par le fondamental.' } }),
    ],
  };

  /* ---------- Exercice 13 p. 221 : le moteur de la Porsche 911 ---------- */
  const ex13 = {
    id: '13', groupe: 'reel', titre: 'Exercice 13 p. 221 : le son d\'un moteur', desc: 'Période, fondamental, harmoniques, nombre de cylindres', voir: SPEC.ex13,
    contexte: `<p class="er-contexte">On admet que le son émis par un moteur est produit par la succession des combustions dans les cylindres. Ce son possède donc la même fréquence que la fréquence des explosions dans le moteur. Pour un moteur 4 temps, les 4 temps moteur sont répartis sur deux tours : on a <b>0,5 combustion par tour pour 1 cylindre</b>. Il y a donc 3 combustions par tour pour un moteur à 6 cylindres, 4 pour 8 cylindres, 5 pour 10 cylindres…</p>
      <p class="er-contexte" style="margin-top:8px">On a enregistré le bruit du moteur de la Porsche 911 tournant à <b>6 000 tours·min<sup>−1</sup></b>. Voici le signal (simplifié) et sa décomposition de Fourier.</p>
      ${figSignal(DOCS.ex13Signal)}<p class="sp-fig-leg">Enregistrement du son du moteur de la Porsche 911</p>
      ${figSpectre(DOCS.ex13)}<p class="sp-fig-leg">Spectre du son émis par le moteur</p>`,
    parties: [
      nombre('a) Détermine la période du son : lis d\'abord la durée de 3 périodes.', '3T =', 10, 'ms', '<p>Entre t = 0 et t = 10 ms, le motif se répète 3 fois : 3T = ' + c('10 ms') + '.</p>',
        { tol: .25, diag: v => (proche(v, 3.3, .05) ? 'C\'est la durée d\'une période : lis celle de 3 périodes.' : 'Compte 3 motifs à partir de t = 0 (le signal part de 0 en montant).') }),
      nombre('En déduire la période T.', 'T =', 10 / 3, 'ms', calc(`3T = 10 ms, donc T = ${fr('10 ms', '3')} = ${c('3,3 ms')}`),
        { tol: .05, affiche: '3,3', diag: v => (proche(v, 30) ? 'On divise par 3.' : 'T = 10 ms / 3.') }),
      nombre('b) En déduire la fréquence de ce son.', 'f =', 300, 'Hz', calc(`f = ${fr('1', 'T')} = ${fr('1', '3,3 × 10<sup>−3</sup> s')} ≈ ${c('300 Hz')}`),
        { rel: .025, diag: v => (proche(v, .3, .05) ? 'T doit être en secondes : 3,3 ms = 3,3 × 10<sup>−3</sup> s.' : 'f = 1 / T, avec T en s.') }),
      nombre('c) Analyse le spectre : quelle est la fréquence du fondamental ?', `${fn(1)} =`, 300, 'Hz', `<p>Première raie : ${fn(1)} = ${c('300 Hz')}, la fréquence du son.</p>`,
        { tol: 15, diag: v => (proche(v, 250) ? 'La raie est un peu après la graduation 250 : une ligne verticale tous les 50 Hz.' : 'Première raie du spectre.') }),
      gabarit('d) Quelles sont les fréquences des harmoniques ? (rangs 2, 3 et 4)', [`rang 2 :`, { v: 600, tol: 15 }, 'Hz ; rang 3 :', { v: 900, tol: 15 }, 'Hz ; rang 4 :', { v: 1200, tol: 15 }, 'Hz'],
        calc(`${fn(2)} = 2 × 300 = ${c('600 Hz')} ; ${fn(3)} = 3 × 300 = ${c('900 Hz')} ; ${fn(4)} = 4 × 300 = ${c('1 200 Hz')}`),
        { diag: () => 'f<sub>n</sub> = n × f<sub>1</sub>, avec f<sub>1</sub> = 300 Hz.' }),
      nombre('e) Détermine la fréquence de rotation du moteur à ce régime, en tours par seconde.', 'f<sub>rot</sub> =', 100, 'tr/s', calc(`6 000 tr/min = ${fr('6 000', '60')} tr/s = ${c('100 tr/s')}`),
        { diag: v => (proche(v, 360000) ? 'Une minute = 60 s : on <b>divise</b> par 60.' : proche(v, 6000) ? 'C\'est en tours par minute : divise par 60.' : '1 min = 60 s.') }),
      gabarit('f) En utilisant les données de l\'énoncé, déduis la fréquence des combustions de moteurs à 6, 8 ou 10 cylindres à ce régime (en combustions par seconde).', ['6 cylindres :', { v: 300 }, '; 8 cylindres :', { v: 400 }, '; 10 cylindres :', { v: 500 }],
        calc('6 cylindres : 3 combustions par tour × 100 tr/s = ' + c('300 combustions/s')) + calc('8 cylindres : 4 × 100 = ' + c('400 combustions/s') + ' ; 10 cylindres : 5 × 100 = ' + c('500 combustions/s')),
        { diag: v => (proche(v[0], 3) ? 'Multiplie par le nombre de tours par seconde (100 tr/s).' : proche(v[0], 600) ? '6 cylindres : 0,5 combustion par tour par cylindre, soit 3 combustions par tour.' : 'Combustions par tour × 100 tr/s.') }),
      choix('g) Déduis-en le nombre de cylindres de la Porsche 911.', [o('4', '4 cylindres'), o('6', '6 cylindres'), o('8', '8 cylindres'), o('10', '10 cylindres')], '6',
        '<p>La fréquence du son (300 Hz) est égale au nombre de combustions par seconde : 300 combustions/s correspondent à un moteur à ' + c('6 cylindres') + '.</p>',
        { indices: { 4: '4 cylindres : 2 combustions par tour, soit 200 combustions/s. Le son est à 300 Hz.', 8: '8 cylindres : 400 combustions/s. Le son est à 300 Hz.', 10: '10 cylindres : 500 combustions/s. Le son est à 300 Hz.' } }),
    ],
  };

  /* ---------- Exercice 14 p. 221 : courant d'un micro-ordinateur ---------- */
  const ex14 = {
    id: '14', groupe: 'reel', titre: 'Exercice 14 p. 221 : courant d\'un ordinateur', desc: 'Fondamental, harmoniques de rang impair, coefficients', voir: SPEC.ex14,
    contexte: `<p class="er-contexte">Le réseau électrique fournit une tension sinusoïdale de fréquence 50 Hz. Des équipements comportant des composants électroniques pour les alimenter en courant continu sont à l'origine de courants électriques dont la fréquence est un multiple de 50 Hz : ces courants sont appelés des harmoniques. Le courant que l'équipement reçoit n'est pas de la même forme que la tension électrique.</p>
      <p class="er-contexte" style="margin-top:8px">Voici le spectre d'amplitude du courant alimentant un micro-ordinateur. L'axe des ordonnées représente l'intensité relative des coefficients des signaux sinusoïdaux composant le signal.</p>
      ${figSpectre(DOCS.ex14)}
      <p class="ph-formule" style="font-size:1.05rem">${fr('i(t)', 'I<sub>0</sub>')} = a<sub>1</sub> × sin(2π × f<sub>1</sub> × t) + a<sub>3</sub> × sin(2π × f<sub>3</sub> × t) + a<sub>5</sub> × sin(2π × f<sub>5</sub> × t) + a<sub>7</sub> × sin(2π × f<sub>7</sub> × t)</p>`,
    parties: [
      nombre('a) Quelle est la fréquence du fondamental ?', `${fn(1)} =`, 50, 'Hz', `<p>Première raie : ${fn(1)} = ${c('50 Hz')}, la fréquence du réseau.</p>`,
        { tol: 3, diag: () => 'Première raie du spectre.' }),
      choix('b) Quels sont les rangs des harmoniques ?', [o('ok', '3, 5 et 7'), o('pos', '2, 3 et 4'), o('f', '150, 250 et 350')], 'ok',
        calc(`n = ${fr('f<sub>n</sub>', 'f<sub>1</sub>')} : ${fr('150', '50')} = 3 ; ${fr('250', '50')} = 5 ; ${fr('350', '50')} = 7`),
        { indices: { pos: 'Le rang n\'est pas la position de la raie : n = f<sub>n</sub> / f<sub>1</sub>.', f: 'Ce sont des fréquences ; le rang est n = f<sub>n</sub> / f<sub>1</sub>.' } }),
      gabarit('Quelles sont leurs fréquences ?', [`${fn(3)} =`, { v: 150, tol: 3 }, 'Hz ;', `${fn(5)} =`, { v: 250, tol: 3 }, 'Hz ;', `${fn(7)} =`, { v: 350, tol: 3 }, 'Hz'],
        calc(`${fn(3)} = 3 × 50 = ${c('150 Hz')} ; ${fn(5)} = 5 × 50 = ${c('250 Hz')} ; ${fn(7)} = 7 × 50 = ${c('350 Hz')}`),
        { diag: () => 'f<sub>n</sub> = n × f<sub>1</sub>, avec f<sub>1</sub> = 50 Hz.' }),
      gabarit('c) Donne les valeurs des coefficients a<sub>1</sub>, a<sub>3</sub>, a<sub>5</sub> et a<sub>7</sub> (100 % = 1).', [`${an(1)} =`, { v: 1, tol: .005 }, ';', `${an(3)} =`, { v: .86, tol: .005 }, ';', `${an(5)} =`, { v: .81, tol: .005 }, ';', `${an(7)} =`, { v: .72, tol: .005 }],
        `<p>On lit les pourcentages sur le spectre et on les écrit en décimal : ${an(1)} = ${c('1')} (100 %) ; ${an(3)} = ${c('0,86')} ; ${an(5)} = ${c('0,81')} ; ${an(7)} = ${c('0,72')}. Fréquences : ${fn(1)} = 50 Hz, ${fn(3)} = 150 Hz, ${fn(5)} = 250 Hz, ${fn(7)} = 350 Hz.</p>`,
        { diag: v => (v.some(x => x > 1.5) ? 'Les coefficients sont sans unité : 86 % = 0,86.' : 'Lis la hauteur de chaque raie (en %), puis divise par 100.') }),
    ],
  };

  window.SP.GROUPES_EX = [
    { id: 'lire', titre: 'Lire un spectre' },
    { id: 'bande', titre: 'Intervalle de fréquences et bande passante' },
    { id: 'reel', titre: 'Signaux réels' },
  ];
  window.SP.EXERCICES = [ex9, ex6, ex11, ex12, ex13, ex14];
})();
