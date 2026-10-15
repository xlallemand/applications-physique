/* ============================================================
   Exercices du module 5 (application « Chapitre 5 : Flux et
   transferts thermiques ») : les exercices 6, 7, 8 et 13 à 19 du
   manuel (p. 74-77), avec la même numérotation.

   Chaque exercice : { id, groupe, titre, desc, contexte (HTML),
   parties: [p] } ; chaque partie suit le format de TT.PARTIES avec
   p.q (question) et p.correction (correction détaillée : formule,
   grandeur isolée, application numérique avec les unités).
   Les exercices de parois composées (13, 14, 18, 19) commencent par
   le schéma de la paroi en couches, où l'élève place les données.

   Valeurs vérifiées par un script. Écarts avec la correction manuscrite :
     ex. 8 d) : Φ = 25 / 4,94 × 10⁻³ ≈ 5,1 × 10³ W (la correction écrit
       « 50·10³ K·W⁻¹ » : valeur et unité fausses) ;
     ex. 13 e) : ΔT = 20 °C, comme le demande la question (la figure
       donne 19 °C et 5 °C) ;
     ex. 18 : unité K·W⁻¹ (la correction écrit « W·K⁻¹ ») ; remarque sur
       la résistance thermique surfacique (R = e / λ en m²·K·W⁻¹) ;
     ex. 19 : R non arrondie avant de diviser : Φ_A ≈ 89 W et Φ_B ≈ 68 W
       (la correction trouve 88 W et 69 W avec R arrondie).
   ============================================================ */
(function () {
  'use strict';

  const { o, fmt, fr, sci, cs, proche, paroi, val, schemaParoi, paroiRemplie, partieSens } = window.TT;
  const calc = h => `<p class="ph-calc">${h}</p>`;
  const c = h => `<span class="c">${h}</span>`;
  const KW = 'K·W<sup>−1</sup>', LAM = 'W·m<sup>−1</sup>·K<sup>−1</sup>';
  // fabriques de parties
  const choix = (q, options, bonne, correction, opts) => Object.assign({ type: 'choix', q, options, bonne, correction, colonne: options.some(x => x.label.replace(/<[^>]+>/g, '').length > 24) }, opts);
  const nombre = (q, label, valeur, unite, correction, opts) => Object.assign({ type: 'nombre', q, label, valeur, unite, correction, signe: false }, opts);
  // 2 chiffres significatifs : l'arrondi peut s'écarter de 5 % de la valeur exacte (1,35 → 1,4)
  const scient = (q, label, valeur, unite, correction, opts) => Object.assign({ type: 'sci', q, label, valeur, unite, correction, cs: 2, rel: .05 }, opts);
  // diagnostics fréquents
  const dPhi = (v, dT, R) => proche(v, dT * R, .03) ? 'Φ = ΔT / R : on divise par R.' : proche(v, R / dT, .03) ? 'Rapport inversé : Φ = ΔT / R.' : 'Φ = ΔT / R<sub>th</sub>.';
  const dR = (v, e, l, S, unite) => proche(v, e * (unite === 'mm' ? 1000 : 100) / (l * S), .03) ? `L'épaisseur doit être en mètres (${unite === 'mm' ? '1 mm = 10<sup>−3</sup> m' : '1 cm = 10<sup>−2</sup> m'}).`
    : proche(v, e * l * S, .03) || proche(v, e * l / S, .03) || proche(v, e * S / l, .03) ? 'R = e / (λ × S) : λ et S sont au dénominateur.' : 'R<sub>th</sub> = e / (λ × S), e en m et S en m<sup>2</sup>.';
  const Rth = (e, l, S) => e / (l * S);

  /* ---------- données des parois composées ---------- */
  // ex. 13 : polystyrène expansé sur la face interne d'un mur de béton
  const P13 = { couches: [{ nom: 'polystyrène', motif: 'isolant', e: '2 cm', lam: .039 }, { nom: 'béton', motif: 'beton', e: '10 cm', lam: 1.28 }],
    cotes: [{ nom: 'face interne', T: 19 }, { nom: 'face externe', T: 5 }], S: 10 };
  const R13p = Rth(.02, .039, 10), R13m = Rth(.10, 1.28, 10), R13 = R13p + R13m;
  // ex. 14 : faux plafond (au-dessus : laine de verre ; dessous : plâtre, côté local)
  const P14 = { couches: [{ nom: 'laine de verre', motif: 'isolant', e: '20 cm', lam: .04, lamLab: '0,040' }, { nom: 'plâtre', motif: 'platre', e: '13 mm', lam: .35 }],
    cotes: [{ nom: 'au-dessus du faux plafond', T: 8 }, { nom: 'local', T: 20 }], S: 70 };
  const R14l = Rth(.2, .04, 70), R14p = Rth(.013, .35, 70), R14 = R14l + R14p, P14phi = 12 / R14;
  // ex. 18 : mur extérieur de 2,4 × 12,0 m (BA13 côté intérieur, polystyrène extrudé, brique)
  const S18 = 2.4 * 12;
  const P18 = { couches: [{ nom: 'BA13', motif: 'platre', e: '12,5 mm', lam: .31 }, { nom: 'polystyrène extrudé', motif: 'isolant', e: '10 cm', lam: .03, lamLab: '0,030' }, { nom: 'brique', motif: 'brique', e: '20 cm', lam: 1.15 }],
    cotes: [{ nom: 'intérieur' }, { nom: 'extérieur' }], S: S18, Slab: '28,8 m<sup>2</sup>' };
  const R18b = Rth(.0125, .31, S18), R18p = Rth(.1, .03, S18), R18r = Rth(.2, 1.15, S18), R18 = R18b + R18p + R18r;
  const R18f = 2.2 - R18b - R18r, e18 = R18f * .05 * S18, e18s = .05 * (2.2 - .0125 / .31 - .2 / 1.15);
  // ex. 19 : vitrages A (verre 4 / air 12 / verre 4 / verre 4) et B (verre 4 / air 16 / verre 4), 2,0 m²
  const verre = { nom: 'verre', motif: 'verre', e: '4 mm', lam: .811 };
  const P19 = { couches: [verre, { nom: 'air', motif: 'air', e: '12 mm', lam: .025 }, verre, verre],
    cotes: [{ nom: 'intérieur', T: 20 }, { nom: 'extérieur', T: -2 }], S: 2, Slab: '2,0 m<sup>2</sup>' };
  const Rv = Rth(.004, .811, 2), RA = 3 * Rv + Rth(.012, .025, 2), RB = 2 * Rv + Rth(.016, .025, 2);
  const phiA = 22 / RA, phiB = 22 / RB, phiS = 22 / Rv;

  const GROUPES_EX = [
    { id: 'flux', titre: 'Flux et résistance thermique (p. 74-75) : exercices 6, 7 et 8' },
    { id: 'parois', titre: 'Parois et matériaux (p. 76-77) : exercices 13 à 19' },
  ];

  const EXERCICES = [

    /* ============================ EXERCICE 6 ============================ */
    { id: '6', groupe: 'flux', titre: 'Exercice 6 p. 74 : l\'hôtel de glace', desc: 'Flux à travers un mur de glace, puis de glace et de neige.',
      contexte: `<p class="er-contexte">En hiver, les touristes en mal de sensations fortes peuvent séjourner dans des hôtels de glace au confort très relatif puisque la température moyenne est de −3,0 °C, alors que la température extérieure est de −20 °C. On considère une paroi de glace de 10 m<sup>2</sup> de surface.</p>
        <ol class="tt-donnees"><li>Calculer le flux thermique qui traverse une paroi de glace, séparant l'intérieur de l'hôtel de l'extérieur, épaisse de 50 cm et de résistance thermique R<sub>1</sub> = 0,022 ${KW}.</li>
        <li>Dans quel sens ce transfert de chaleur se produit-il ?</li><li>Quelle est la valeur de la résistance thermique R<sub>2</sub> de la paroi si l'on double l'épaisseur de glace ?</li>
        <li>Comment varie alors le flux thermique traversant cette paroi ? Justifier.</li><li>Calculer la résistance thermique R<sub>3</sub> d'un mur de glace de 50 cm d'épaisseur qu'on aurait doublé avec un mur de neige de 50 cm.</li>
        <li>Quel est, du mur de glace ou du mur de glace et neige, le mur le plus isolant ?</li></ol>
        <p class="tt-donnees"><b>Données</b> : λ<sub>neige</sub> = 0,100 ${LAM} ; λ<sub>glace</sub> = 2,200 ${LAM}.</p>`,
      parties: [
        nombre('1. Calcule l\'écart de température entre l\'intérieur et l\'extérieur.', 'ΔT =', 17, 'K', calc(`ΔT = T<sub>int</sub> − T<sub>ext</sub> = −3,0 − (−20) = −3,0 + 20 = ${c('17 K')}`),
          { tol: .05, signe: true, diag: v => proche(v, 23) || proche(v, -23) ? 'Soustraire −20, c\'est ajouter 20 : −3,0 − (−20) = −3,0 + 20.' : proche(v, -17) ? 'Le côté chaud est l\'intérieur : ΔT = T<sub>chaud</sub> − T<sub>froid</sub> est positif.' : 'ΔT = T<sub>int</sub> − T<sub>ext</sub>.' }),
        nombre('1. Calcule le flux thermique à travers la paroi de glace (3 chiffres significatifs).', 'Φ =', 17 / .022, 'W', calc(`Φ = ${fr('T<sub>int</sub> − T<sub>ext</sub>', 'R<sub>1</sub>')} = ${fr('17', '0,022')} ≈ ${c('773 W')}`),
          { rel: .01, affiche: '773', diag: v => dPhi(v, 17, .022) }),
        partieSens({ q: '2. Dans quel sens ce transfert de chaleur se produit-il ?', cotes: ['l\'intérieur (−3,0 °C)', 'l\'extérieur (−20 °C)'], bon: 1,
          solution: '<p>Le transfert thermique se fait du chaud (l\'intérieur, −3,0 °C) vers le froid (l\'extérieur, −20 °C).</p>' }),
        nombre('3. Quelle est la résistance thermique R<sub>2</sub> si l\'on double l\'épaisseur de glace ?', 'R<sub>2</sub> =', .044, KW, calc(`R = ${fr('e', 'λ × S')} est proportionnelle à e : si on double e, on double R.<br>R<sub>2</sub> = 2 × R<sub>1</sub> = 2 × 0,022 = ${c('0,044 ' + KW)}`),
          { rel: .01, diag: v => proche(v, .011) ? 'R = e / (λ S) : e est au numérateur, donc R augmente avec e.' : 'R est proportionnelle à e.' }),
        choix('4. Comment varie alors le flux thermique ?', [o('ok', 'il diminue : R augmente, on est mieux isolé'), o('a', 'il augmente : la paroi est plus épaisse'), o('b', 'il ne change pas : les températures sont les mêmes')], 'ok',
          '<p>Si R augmente, on est mieux isolé : Φ = ΔT / R diminue (il est divisé par 2).</p>', { melanger: false, indices: { a: 'Plus la paroi est épaisse, plus elle résiste au transfert.', b: 'Φ = ΔT / R : R a changé.' } }),
        nombre('5. Calcule la résistance thermique du mur de neige seul.', 'R<sub>neige</sub> =', .5, KW, calc(`R<sub>neige</sub> = ${fr('e<sub>neige</sub>', 'λ<sub>neige</sub> × S')} = ${fr('50 × 10<sup>−2</sup>', '0,100 × 10')} = ${c('0,5 ' + KW)}`),
          { rel: .01, diag: v => dR(v, .5, .1, 10, 'cm') }),
        nombre('5. En déduire R<sub>3</sub> (glace + neige).', 'R<sub>3</sub> =', .522, KW, calc(`R<sub>3</sub> = R<sub>1</sub> + R<sub>neige</sub> = 0,022 + 0,5 = ${c('0,522 ' + KW)}`),
          { rel: .005, diag: v => proche(v, .5) ? 'Le mur de glace est toujours là : ajoute R<sub>1</sub>.' : proche(v, .011) ? 'Les résistances s\'additionnent.' : 'R<sub>3</sub> = R<sub>1</sub> + R<sub>neige</sub>.' }),
        choix('6. Quel est le mur le plus isolant ?', [o('ok', 'le mur de glace et neige'), o('a', 'le mur de glace seul'), o('b', 'ils isolent autant')], 'ok',
          '<p>R<sub>3</sub> = 0,522 K·W<sup>−1</sup> &gt; R<sub>1</sub> = 0,022 K·W<sup>−1</sup> : le mur glace + neige est plus isolant que le mur de glace.</p>',
          { melanger: false, indices: { a: 'Compare R<sub>1</sub> et R<sub>3</sub> : la plus grande résistance isole le mieux.', b: 'Les deux résistances sont très différentes.' } }),
      ] },

    /* ============================ EXERCICE 7 ============================ */
    { id: '7', groupe: 'flux', titre: 'Exercice 7 p. 75 : trois flux', desc: 'Φ = Q / Δt, Φ = ΔT / R, puis R = e / (λ S).',
      contexte: `<p class="er-contexte">Calculer le flux thermique dans les situations suivantes :</p>
        <ul class="tt-donnees"><li>a) Une quantité de chaleur Q = 750 kJ est échangée à travers une paroi en 1 h 15.</li>
        <li>b) La différence de température entre deux faces d'une paroi de résistance R<sub>th</sub> = 5,3 ${KW} est de 17 °C.</li>
        <li>c) La différence de température entre deux faces d'une épaisseur de laine de mouton de 1,0 m<sup>2</sup> (λ = 0,035 ${LAM}) de 5,0 cm est de 17 °C.</li></ul>`,
      parties: [
        nombre('a) Convertis la durée 1 h 15 en secondes.', 'Δt =', 4500, 's', calc(`1 h 15 = 3 600 s + 15 × 60 s = ${c('4 500 s')}`),
          { diag: v => proche(v, 75) ? 'Ce sont des minutes : multiplie par 60.' : proche(v, 1.15 * 3600) ? '1 h 15, ce n\'est pas 1,15 h : convertis séparément l\'heure et les minutes.' : '1 h = 3 600 s et 1 min = 60 s.' }),
        nombre('a) Calcule le flux thermique (3 chiffres significatifs).', 'Φ =', 750e3 / 4500, 'W', calc(`Φ = ${fr('Q', 'Δt')} = ${fr('750 × 10<sup>3</sup> J', '4 500 s')} ≈ ${c('167 W')}`),
          { rel: .01, affiche: '167', diag: v => proche(v, 750 / 4500, .02) ? 'Convertis l\'énergie en joules : 750 kJ = 750 × 10<sup>3</sup> J.' : proche(v, 750e3 / 75, .02) || proche(v, 750e3 / 1.25, .02) ? 'La durée doit être en secondes.' : 'Φ = Q / Δt.' }),
        nombre('b) Calcule le flux thermique (2 chiffres significatifs).', 'Φ =', 17 / 5.3, 'W', calc(`Φ = ${fr('T<sub>chaud</sub> − T<sub>froid</sub>', 'R<sub>th</sub>')} = ${fr('17', '5,3')} ≈ ${c('3,2 W')}`),
          { rel: .02, affiche: '3,2', diag: v => dPhi(v, 17, 5.3) }),
        nombre('c) Calcule la résistance thermique de la couche de laine de mouton (3 chiffres significatifs).', 'R<sub>th</sub> =', .05 / .035, KW, calc(`R<sub>th</sub> = ${fr('e', 'λ × S')} = ${fr('5,0 × 10<sup>−2</sup>', '0,035 × 1,0')} ≈ ${c('1,43 ' + KW)}`),
          { rel: .01, affiche: '1,43', diag: v => dR(v, .05, .035, 1, 'cm') }),
        nombre('c) Calcule le flux thermique (2 chiffres significatifs).', 'Φ =', 17 / (.05 / .035), 'W', calc(`Φ = ${fr('T<sub>chaud</sub> − T<sub>froid</sub>', 'R<sub>th</sub>')} = ${fr('17', '1,43')} ≈ ${c('12 W')}`),
          { rel: .03, affiche: '12', diag: v => dPhi(v, 17, 1.43) }),
      ] },

    /* ============================ EXERCICE 8 ============================ */
    { id: '8', groupe: 'flux', titre: 'Exercice 8 p. 75 : flux et sens du transfert', desc: 'Quatre parois de 1,0 m² : flux et sens.',
      contexte: `<p class="er-contexte">Calculer le flux thermique traversant une paroi de 1,0 m<sup>2</sup> dans les situations suivantes. Vous préciserez le sens du flux thermique.</p>
        <ul class="tt-donnees"><li>a) La différence de température entre les deux faces est de 15 °C et une résistance thermique de 5,00 ${KW}.</li>
        <li>b) La résistance thermique de la paroi est de 3,33 ${KW} avec une température intérieure de 22 °C et une température extérieure de 35 °C.</li>
        <li>c) L'énergie thermique perdue à travers la paroi est de 180 kJ par heure.</li>
        <li>d) La différence de température entre les deux faces est de 25 °C pour une paroi d'épaisseur e = 4 mm et dont la conductivité thermique est de λ = 0,810 ${LAM}.</li></ul>`,
      parties: [
        nombre('a) Calcule le flux thermique (2 chiffres significatifs).', 'Φ =', 3, 'W', calc(`Φ = ${fr('ΔT', 'R<sub>th</sub>')} = ${fr('15', '5,00')} = ${c('3,0 W')}, du chaud vers le froid`), { rel: .01, diag: v => dPhi(v, 15, 5) }),
        nombre('b) Calcule le flux thermique (2 chiffres significatifs).', 'Φ =', 13 / 3.33, 'W', calc(`Φ = ${fr('T<sub>ext</sub> − T<sub>int</sub>', 'R<sub>th</sub>')} = ${fr('35 − 22', '3,33')} ≈ ${c('3,9 W')}`),
          { rel: .02, affiche: '3,9', diag: v => proche(v, 57 / 3.33, .03) ? 'ΔT est une différence : 35 − 22.' : dPhi(v, 13, 3.33) }),
        partieSens({ q: 'b) Dans quel sens se fait ce transfert ?', cotes: ['l\'intérieur (22 °C)', 'l\'extérieur (35 °C)'], bon: 2,
          solution: '<p>L\'extérieur (35 °C) est plus chaud que l\'intérieur (22 °C) : le transfert se fait de l\'extérieur vers l\'intérieur.</p>' }),
        nombre('c) Calcule le flux thermique.', 'Φ =', 50, 'W', calc(`Φ = ${fr('Q', 'Δt')} = ${fr('180 × 10<sup>3</sup> J', '3 600 s')} = ${c('50 W')}, du chaud vers le froid`),
          { rel: .01, diag: v => proche(v, 180) ? 'L\'énergie est perdue en une heure : divise par Δt = 3 600 s (et convertis 180 kJ en J).' : proche(v, .05) ? 'Convertis 180 kJ en joules.' : proche(v, 3000) ? 'Δt = 1 h = 3 600 s (pas 60 s).' : 'Φ = Q / Δt, Q en J et Δt en s.' }),
        scient('d) Calcule la résistance thermique de la paroi (3 chiffres significatifs).', 'R<sub>th</sub> =', .004 / .81, KW, calc(`R<sub>th</sub> = ${fr('e', 'λ × S')} = ${fr('4 × 10<sup>−3</sup>', '0,810 × 1,0')} ≈ ${c('4,94 × 10<sup>−3</sup> ' + KW)}`),
          { cs: 3, rel: .01, diag: v => dR(v, .004, .81, 1, 'mm') }),
        scient('d) Calcule le flux thermique (2 chiffres significatifs).', 'Φ =', 25 / (.004 / .81), 'W', calc(`Φ = ${fr('ΔT', 'R<sub>th</sub>')} = ${fr('25', '4,94 × 10<sup>−3</sup>')} ≈ ${c('5,1 × 10<sup>3</sup> W')}, du chaud vers le froid`) +
          '<p class="tt-note">Un flux s\'exprime en watts. Une paroi aussi mince et aussi conductrice laisse passer un très grand flux.</p>',
          { diag: v => proche(v, 25 * .004 / .81, .03) ? 'Φ = ΔT / R : on divise par R.' : proche(v, 25 / 4.94, .03) ? 'Attention à la puissance de 10 : R = 4,94 × 10<sup>−3</sup> K·W<sup>−1</sup>.' : 'Φ = ΔT / R.' }),
      ] },

    /* ============================ EXERCICE 13 ============================ */
    { id: '13', groupe: 'parois', titre: 'Exercice 13 p. 76 : isoler un mur de béton', desc: 'Polystyrène accolé au béton : R totale et flux.',
      contexte: `<p class="er-contexte">Afin de réaliser des travaux d'isolation thermique, on souhaite accoler (en série) du polystyrène expansé sur la face interne d'un mur de béton de 10 cm d'épaisseur et de surface égale à 10 m<sup>2</sup>. Sur la figure : face interne θ<sub>int</sub> = 19 °C ; face externe θ<sub>ext</sub> = 5 °C.</p>
        <ul class="tt-donnees"><li>a) Dans quel sens se fait le transfert de chaleur ?</li><li>b) Selon quel mode (rayonnement, conduction ou convection) se propage essentiellement la chaleur à travers le mur ?</li>
        <li>c) Le polystyrène expansé possède une conductivité thermique de 0,039 ${LAM}. Calculer la résistance thermique d'une plaque de polystyrène d'épaisseur e = 2 cm.</li>
        <li>d) Quelle est alors la résistance thermique globale du mur constitué de béton doublé avec du polystyrène ?</li>
        <li>e) Quelle est alors la valeur du flux thermique qui traverse ce mur isolé lorsque la différence de température entre les deux faces est de 20 °C ?</li></ul>
        <p class="tt-donnees"><b>Donnée</b> : λ<sub>béton</sub> = 1,28 ${LAM}.</p>`,
      parties: [
        schemaParoi(P13),
        partieSens({ q: 'a) Dans quel sens se fait le transfert de chaleur ?', cotes: ['l\'intérieur (19 °C)', 'l\'extérieur (5 °C)'], bon: 1,
          solution: '<p>Le transfert thermique se fait de l\'intérieur vers l\'extérieur (du chaud vers le froid).</p>' }),
        choix('b) Selon quel mode la chaleur se propage-t-elle à travers le mur ?', [o('cond', 'conduction'), o('conv', 'convection'), o('ray', 'rayonnement')], 'cond',
          '<p>La chaleur se propage dans le mur (un solide), de proche en proche : par <b>conduction</b>.</p>', { melanger: false, indices: { conv: 'La convection demande un fluide qui se déplace ; le mur est solide.', ray: 'Le rayonnement se propage sans support matériel ; ici, l\'énergie traverse un solide.' } }),
        scient('c) Calcule la résistance thermique R<sub>poly</sub> de la plaque de polystyrène.', 'R<sub>poly</sub> =', R13p, KW, calc(`R<sub>poly</sub> = ${fr('e', 'λ × S')} = ${fr('2 × 10<sup>−2</sup>', '0,039 × 10')} ≈ ${c('5,1 × 10<sup>−2</sup> ' + KW)}`),
          { diag: v => dR(v, .02, .039, 10, 'cm') }),
        scient('d) Calcule la résistance thermique R<sub>mur</sub> du mur de béton.', 'R<sub>mur</sub> =', R13m, KW, calc(`R<sub>mur</sub> = ${fr('e<sub>mur</sub>', 'λ<sub>béton</sub> × S')} = ${fr('10 × 10<sup>−2</sup>', '1,28 × 10')} ≈ ${c('7,8 × 10<sup>−3</sup> ' + KW)}`),
          { diag: v => dR(v, .1, 1.28, 10, 'cm') }),
        scient('d) En déduire la résistance thermique globale du mur isolé.', 'R<sub>totale</sub> =', R13, KW, calc(`R<sub>totale</sub> = R<sub>mur</sub> + R<sub>poly</sub> = 7,8 × 10<sup>−3</sup> + 5,1 × 10<sup>−2</sup> ≈ ${c('5,9 × 10<sup>−2</sup> ' + KW)}`),
          { diag: v => proche(v, R13p * R13m, .05) ? 'Les résistances s\'additionnent.' : proche(v, R13p, .03) || proche(v, R13m, .03) ? 'Additionne les deux résistances.' : 'R<sub>totale</sub> = R<sub>mur</sub> + R<sub>poly</sub> (attention aux puissances de 10).' }),
        nombre('e) Calcule le flux thermique pour une différence de température de 20 °C (2 chiffres significatifs).', 'Φ =', 20 / R13, 'W', calc(`Φ = ${fr('T<sub>int</sub> − T<sub>ext</sub>', 'R<sub>totale</sub>')} = ${fr('20', '5,9 × 10<sup>−2</sup>')} ≈ ${c('340 W')} (2 chiffres significatifs)`) +
          '<p class="tt-note">La question impose ΔT = 20 °C (et non 19 − 5 = 14 °C, les valeurs de la figure).</p>',
          { rel: .015, affiche: '340', diag: v => proche(v, 14 / R13, .03) ? 'La question donne la différence de température : 20 °C.' : proche(v, 20 / R13p, .03) || proche(v, 20 / R13m, .03) ? 'Utilise la résistance <b>totale</b>.' : dPhi(v, 20, R13) }),
      ] },

    /* ============================ EXERCICE 14 ============================ */
    { id: '14', groupe: 'parois', titre: 'Exercice 14 p. 76 : le faux plafond', desc: 'Plâtre + laine de verre : résistance, flux, énergie en 30 min.',
      contexte: `<p class="er-contexte">Pour isoler thermiquement le faux plafond du service après-vente d'un magasin, on pose au-dessus des plaques de plâtre une couche de laine de verre de 20 cm d'épaisseur. L'épaisseur des plaques de plâtre est de 13 mm. L'aire du local est égale à 70 m<sup>2</sup>.</p>
        <ul class="tt-donnees"><li>a) Calculer la résistance thermique totale du faux plafond.</li><li>b) Calculer le flux thermique si la température du local service après-vente est de 20 °C et la température au-dessus du faux plafond est de 8 °C.</li>
        <li>c) Déterminer l'énergie dissipée par le faux-plafond en 30 min.</li></ul>
        <p class="tt-donnees"><b>Données</b> : λ<sub>laine de verre</sub> = 0,040 ${LAM} ; λ<sub>plâtre</sub> = 0,35 ${LAM}.</p>`,
      parties: [
        schemaParoi(P14, 'Place les données de l\'énoncé sur le schéma du faux plafond (la laine de verre est au-dessus du plâtre ; les cases « ? » restées vides sont les inconnues).'),
        partieSens({ q: 'Dans quel sens se fait le transfert thermique à travers le faux plafond ?', cotes: ['l\'espace au-dessus du faux plafond (8 °C)', 'le local (20 °C)'], bon: 2,
          solution: '<p>Du chaud vers le froid : du local (20 °C) vers l\'espace au-dessus du faux plafond (8 °C).</p>' }),
        scient('a) Calcule la résistance thermique R<sub>plâtre</sub> des plaques de plâtre.', 'R<sub>plâtre</sub> =', R14p, KW, calc(`R<sub>plâtre</sub> = ${fr('e<sub>p</sub>', 'λ<sub>p</sub> × S')} = ${fr('13 × 10<sup>−3</sup>', '0,35 × 70')} ≈ ${c('5,3 × 10<sup>−4</sup> ' + KW)}`),
          { diag: v => dR(v, .013, .35, 70, 'mm') }),
        scient('a) Calcule la résistance thermique R<sub>laine</sub> de la laine de verre.', 'R<sub>laine</sub> =', R14l, KW, calc(`R<sub>laine</sub> = ${fr('e<sub>ℓ</sub>', 'λ<sub>ℓ</sub> × S')} = ${fr('20 × 10<sup>−2</sup>', '0,040 × 70')} ≈ ${c('7,1 × 10<sup>−2</sup> ' + KW)}`),
          { diag: v => dR(v, .2, .04, 70, 'cm') }),
        scient('a) En déduire la résistance thermique totale du faux plafond.', 'R<sub>totale</sub> =', R14, KW, calc(`R<sub>totale</sub> = R<sub>plâtre</sub> + R<sub>laine</sub> = 5,3 × 10<sup>−4</sup> + 7,1 × 10<sup>−2</sup> ≈ ${c('7,2 × 10<sup>−2</sup> ' + KW)}`),
          { diag: v => proche(v, R14l, .01) ? 'N\'oublie pas le plâtre : sa résistance est petite, mais elle s\'ajoute.' : 'R<sub>totale</sub> = R<sub>plâtre</sub> + R<sub>laine</sub> (attention aux puissances de 10).' }),
        nombre('b) Calcule le flux thermique (3 chiffres significatifs).', 'Φ =', P14phi, 'W', calc(`Φ = ${fr('T<sub>chaud</sub> − T<sub>froid</sub>', 'R<sub>totale</sub>')} = ${fr('20 − 8', '7,2 × 10<sup>−2</sup>')} ≈ ${c('167 W')}`),
          { rel: .01, affiche: '167', diag: v => proche(v, 28 / R14, .03) ? 'ΔT = 20 − 8 = 12 K (une différence).' : dPhi(v, 12, R14) }),
        scient('c) Calcule l\'énergie dissipée en 30 min.', 'Q =', P14phi * 1800, 'J', calc(`E (ou Q) = Φ × Δt = 167 W × 30 × 60 s ≈ ${c('3,0 × 10<sup>5</sup> J')} = 300 kJ`),
          { diag: v => proche(v, P14phi * 30, .03) ? 'La durée doit être en secondes : 30 min = 1 800 s.' : proche(v, P14phi * .5, .03) ? 'En joules, la durée doit être en secondes (0,5 h donnerait des Wh).' : 'Q = Φ × Δt, Δt en s.' }),
      ] },

    /* ============================ EXERCICE 15 ============================ */
    { id: '15', groupe: 'parois', titre: 'Exercice 15 p. 76 : de quoi est faite la porte ?', desc: 'Retrouver λ à partir du flux, puis l\'épaisseur en pin.',
      contexte: `<p class="er-contexte">On donne le tableau suivant des conductivités thermiques.</p>
        <div class="ph-defile"><table class="ph-tableau"><tr><th>Matériaux</th><th>Pin maritime</th><th>Liège expansé</th><th>Contre-plaqué</th><th>Bois naturels (chêne, hêtre)</th></tr>
          <tr><td>λ (${LAM})</td><td>0,150</td><td>0,043</td><td>0,200</td><td>0,230</td></tr></table></div>
        <ol class="tt-donnees"><li>Parmi les matériaux ci-dessus, lequel est le plus isolant ? Justifier votre réponse.</li>
        <li>On envisage la conduction thermique à travers une porte séparant deux pièces ; l'une est maintenue à la température de 22 °C et l'autre est maintenue à 19 °C.<br>
          a) Cette porte a une épaisseur e de 4,0 cm et une aire S de 1,6 m<sup>2</sup>. Sachant que le flux thermique Φ est de 27,6 W, calculer la conductivité thermique λ du matériau constitutif de la porte.<br>
          b) Quel est ce matériau ?<br>c) Pour une isolation équivalente, quelle serait l'épaisseur de cette porte en pin maritime ? Arrondir au millimètre.</li></ol>`,
      parties: [
        choix('1. Quel est le matériau le plus isolant ?', [o('pin', 'pin maritime'), o('liege', 'liège expansé'), o('cp', 'contre-plaqué'), o('bois', 'bois naturels')], 'liege',
          '<p>Le plus isolant est le <b>liège expansé</b> car il a la conductivité thermique la plus faible (0,043 W·m<sup>−1</sup>·K<sup>−1</sup>).</p>',
          { melanger: false, indices: { bois: 'C\'est la plus grande conductivité : le moins isolant.', cp: 'Le plus isolant a la plus petite conductivité λ.', pin: 'Il y a une conductivité plus petite dans le tableau.' } }),
        nombre('2. a) Calcule d\'abord la résistance thermique de la porte (3 chiffres significatifs).', 'R<sub>th</sub> =', 3 / 27.6, KW, calc(`Φ = ${fr('ΔT', 'R<sub>th</sub>')} donc R<sub>th</sub> = ${fr('ΔT', 'Φ')} = ${fr('22 − 19', '27,6')} ≈ ${c('0,109 ' + KW)}`),
          { rel: .01, affiche: '0,109', diag: v => proche(v, 27.6 / 3, .02) ? 'Rapport inversé : R = ΔT / Φ.' : proche(v, 41 / 27.6, .02) ? 'ΔT est une différence : 22 − 19 = 3 K.' : 'R = ΔT / Φ.' }),
        nombre('2. a) Calcule la conductivité thermique λ du matériau de la porte (2 chiffres significatifs).', 'λ =', .04 / (3 / 27.6 * 1.6), LAM, calc(`R<sub>th</sub> = ${fr('e', 'λ × S')} donc λ = ${fr('e', 'R<sub>th</sub> × S')} = ${fr('4,0 × 10<sup>−2</sup>', '0,109 × 1,6')} ≈ ${c('0,23 ' + LAM)}`),
          { rel: .02, affiche: '0,23', diag: v => proche(v, 4 / (3 / 27.6 * 1.6), .03) ? 'L\'épaisseur doit être en mètres : 4,0 cm = 4,0 × 10<sup>−2</sup> m.' : proche(v, 3 / 27.6 * 1.6 / .04, .03) ? 'Rapport inversé : λ = e / (R × S).' : 'λ = e / (R<sub>th</sub> × S).' }),
        choix('2. b) Quel est ce matériau ?', [o('pin', 'pin maritime'), o('liege', 'liège expansé'), o('cp', 'contre-plaqué'), o('bois', 'bois naturels (chêne, hêtre)')], 'bois',
          '<p>La porte est en <b>bois naturel</b> : il a la même conductivité thermique (0,230 W·m<sup>−1</sup>·K<sup>−1</sup>).</p>', { melanger: false, indice: 'Cherche dans le tableau la conductivité égale à 0,23.' }),
        nombre('2. c) Quelle serait l\'épaisseur d\'une porte en pin maritime pour la même isolation (au mm près) ?', 'e<sub>pm</sub> =', 3 / 27.6 * .15 * 1.6 * 1000, 'mm', calc(`On veut le même R<sub>th</sub> avec λ<sub>pm</sub> = 0,150 W·m<sup>−1</sup>·K<sup>−1</sup> :<br>R<sub>th</sub> = ${fr('e<sub>pm</sub>', 'λ<sub>pm</sub> × S')} ⇔ e<sub>pm</sub> = R<sub>th</sub> × λ<sub>pm</sub> × S = 0,109 × 0,150 × 1,6 ≈ 0,026 m = ${c('26 mm')}`),
          { tol: .6, affiche: '26', diag: v => proche(v, 26 / 1000, .05) ? 'C\'est en mètres : convertis en mm.' : proche(v, 2.6, .05) ? 'C\'est en cm : l\'énoncé demande des mm.' : proche(v, 40 * .15 / .23, .05) ? 'Bonne idée (e proportionnelle à λ pour la même R) : vérifie le calcul, e = R × λ × S.' : 'R = e / (λ S) donc e = R × λ × S, avec λ du pin.' }),
      ] },

    /* ============================ EXERCICE 16 ============================ */
    { id: '16', groupe: 'parois', titre: 'Exercice 16 p. 76 : la casserole des chefs', desc: 'Cuivre, aluminium, acier : quel métal transfère le plus vite ?',
      contexte: `<p class="er-contexte">Pourquoi la batterie de cuisine des grands chefs n'est pas en acier inoxydable ou en aluminium mais en cuivre ? On soumet trois plaques de surface 100 cm<sup>2</sup> et de 5 mm d'épaisseur de métaux différents (cuivre, acier et aluminium) à une différence de température constante de 20 °C pendant 10 min.</p>
        <ul class="tt-donnees"><li>a) Calculer le flux thermique traversant la plaque de cuivre sachant que la quantité de chaleur transférée est de 2,94 MJ.</li>
        <li>b) Calculer le flux thermique traversant la plaque d'aluminium dont la résistance thermique est de 2,1 × 10<sup>−2</sup> ${KW}.</li>
        <li>c) Calculer la résistance thermique de la plaque d'acier, sachant que le flux thermique qui traverse cette surface est de 2 kW.</li>
        <li>d) Quel est le matériau qui transfère le plus rapidement la chaleur ? Justifier le choix des grands chefs.</li></ul>`,
      parties: [
        nombre('a) Convertis la durée en secondes.', 'Δt =', 600, 's', calc(`Δt = 10 × 60 = ${c('600 s')}`), { diag: () => '1 min = 60 s.' }),
        nombre('a) Calcule le flux thermique à travers la plaque de cuivre.', 'Φ<sub>Cu</sub> =', 4900, 'W', calc(`Φ<sub>Cu</sub> = ${fr('Q', 'Δt')} = ${fr('2,94 × 10<sup>6</sup> J', '10 × 60 s')} = ${c('4 900 W')}`),
          { rel: .01, diag: v => proche(v, 2.94e6 / 10) ? 'La durée doit être en secondes : 10 min = 600 s.' : proche(v, 2.94 / 600, .02) ? 'Convertis : 2,94 MJ = 2,94 × 10<sup>6</sup> J.' : 'Φ = Q / Δt.' }),
        nombre('b) Calcule le flux thermique à travers la plaque d\'aluminium (3 chiffres significatifs).', 'Φ<sub>Al</sub> =', 20 / .021, 'W', calc(`Φ<sub>Al</sub> = ${fr('ΔT', 'R')} = ${fr('20', '2,1 × 10<sup>−2</sup>')} ≈ ${c('952 W')}`),
          { rel: .01, affiche: '952', diag: v => dPhi(v, 20, .021) }),
        nombre('c) Calcule la résistance thermique de la plaque d\'acier.', 'R<sub>ac</sub> =', .01, KW, calc(`Φ<sub>ac</sub> = ${fr('ΔT', 'R')} ⇔ R = ${fr('ΔT', 'Φ<sub>ac</sub>')} = ${fr('20', '2 × 10<sup>3</sup>')} = ${c('0,01 ' + KW)}`),
          { rel: .01, diag: v => proche(v, 10) ? 'Convertis : 2 kW = 2 000 W.' : proche(v, 100) ? 'Rapport inversé : R = ΔT / Φ.' : 'R = ΔT / Φ.' }),
        choix('d) Quel matériau transfère le plus rapidement la chaleur ?', [o('cu', 'le cuivre'), o('al', 'l\'aluminium'), o('ac', 'l\'acier')], 'cu',
          '<p>Le matériau qui transfère le plus rapidement la chaleur est celui qui a le flux thermique le plus élevé : le <b>cuivre</b> (4 900 W, contre 2 000 W pour l\'acier et 952 W pour l\'aluminium). D\'où le choix des grands chefs : il chauffe plus rapidement les aliments.</p>',
          { melanger: false, indices: { al: 'Compare les trois flux : 4 900 W, 952 W et 2 000 W.', ac: 'Compare les trois flux : le plus grand flux transfère le plus vite.' } }),
      ] },

    /* ============================ EXERCICE 17 ============================ */
    { id: '17', groupe: 'parois', titre: 'Exercice 17 p. 77 : verre ou Altuglas ?', desc: 'Deux plaques pour une fenêtre de 1,8 m².',
      contexte: `<p class="er-contexte">Pour réaliser la partie transparente d'une fenêtre de 1,8 m<sup>2</sup>, on envisage deux matériaux : le verre et le PPMA. Le PPMA (polyméthacrylate de méthyle) est connu sous le nom de la marque déposée Altuglas®.</p>
        <ul class="tt-donnees"><li>a) Entre une plaque de verre et une plaque d'Altuglas® de même épaisseur, laquelle a la plus grande résistance thermique ? Justifier la réponse.</li>
        <li>b) Calculer la résistance thermique R<sub>verre</sub> d'une plaque de verre d'épaisseur 12 mm.</li><li>c) Calculer la résistance thermique R<sub>Altuglas</sub> d'une plaque d'Altuglas® d'épaisseur 4 mm.</li>
        <li>d) Quel est, de ces deux plaques, le meilleur isolant thermique ?</li></ul>
        <p class="tt-donnees"><b>Données</b> : λ<sub>verre</sub> = 1 ${LAM} ; λ<sub>Altuglas</sub> = 0,17 ${LAM}.</p>`,
      parties: [
        choix('a) À épaisseur égale, quelle plaque a la plus grande résistance thermique ?', [o('alt', 'l\'Altuglas'), o('verre', 'le verre'), o('eg', 'elles ont la même résistance')], 'alt',
          '<p>λ<sub>Altuglas</sub> &lt; λ<sub>verre</sub> donc R<sub>Altuglas</sub> &gt; R<sub>verre</sub> (R = e / (λ S) : λ est au dénominateur).</p>',
          { melanger: false, indices: { verre: 'R = e / (λ S) : le plus petit λ donne la plus grande résistance.', eg: 'Les deux matériaux n\'ont pas la même conductivité.' } }),
        scient('b) Calcule R<sub>verre</sub> pour une plaque de 12 mm.', 'R<sub>verre</sub> =', Rth(.012, 1, 1.8), KW, calc(`R<sub>verre</sub> = ${fr('e<sub>verre</sub>', 'λ<sub>verre</sub> × S')} = ${fr('12 × 10<sup>−3</sup>', '1 × 1,8')} ≈ ${c('6,7 × 10<sup>−3</sup> ' + KW)}`),
          { diag: v => dR(v, .012, 1, 1.8, 'mm') }),
        scient('c) Calcule R<sub>Altuglas</sub> pour une plaque de 4 mm.', 'R<sub>Altuglas</sub> =', Rth(.004, .17, 1.8), KW, calc(`R<sub>Altuglas</sub> = ${fr('e<sub>Altuglas</sub>', 'λ<sub>Altuglas</sub> × S')} = ${fr('4 × 10<sup>−3</sup>', '0,17 × 1,8')} ≈ ${c('1,3 × 10<sup>−2</sup> ' + KW)}`),
          { diag: v => dR(v, .004, .17, 1.8, 'mm') }),
        choix('d) Quel est le meilleur isolant thermique ?', [o('alt', 'la plaque d\'Altuglas de 4 mm'), o('verre', 'la plaque de verre de 12 mm')], 'alt',
          '<p>Le meilleur isolant thermique est la plaque d\'Altuglas, car sa résistance thermique est plus élevée (1,3 × 10<sup>−2</sup> &gt; 6,7 × 10<sup>−3</sup> K·W<sup>−1</sup>), même si elle est trois fois plus mince.</p>',
          { melanger: false, indices: { verre: 'Compare les résistances : 1,3 × 10<sup>−2</sup> = 0,013 et 6,7 × 10<sup>−3</sup> = 0,0067.' } }),
      ] },

    /* ============================ EXERCICE 18 ============================ */
    { id: '18', groupe: 'parois', titre: 'Exercice 18 p. 77 : un mur en trois couches', desc: 'Brique, isolant, BA13 : R totale, puis épaisseur de fibre de bois.',
      contexte: `<p class="er-contexte">a) Déterminer la résistance thermique totale d'un mur extérieur de 2,4 × 12,0 m, formé de 20 cm de brique en terre cuite, de 10 cm de polystyrène extrudé et d'un panneau de plâtre type BA13 de 12,5 mm d'épaisseur, associés en série.</p>
        <div class="ph-defile"><table class="ph-tableau"><tr><th>Matériau</th><th>Conductivité thermique (${LAM})</th></tr>
          <tr><td>Brique en terre cuite</td><td>1,15</td></tr><tr><td>Polystyrène extrudé</td><td>0,030</td></tr><tr><td>BA 13</td><td>0,31</td></tr><tr><td>Fibre de bois</td><td>0,050</td></tr></table></div>
        <p class="er-contexte" style="margin-top:8px">b) On remplace le polystyrène par de la fibre de bois. Déterminer son épaisseur afin de former un mur de 20 cm de brique en terre cuite, de fibre de bois et d'un panneau de plâtre type BA13 de 12,5 mm d'épaisseur si l'on souhaite avoir une résistance thermique totale R = 2,2 ${KW}.</p>`,
      parties: [
        nombre('a) Calcule la surface du mur.', 'S =', S18, 'm<sup>2</sup>', calc(`S = 2,4 × 12,0 = ${c('28,8 m<sup>2</sup>')}`), { rel: .005, diag: v => proche(v, 2 * (2.4 + 12)) ? 'C\'est le périmètre : la surface est longueur × largeur.' : 'S = 2,4 m × 12,0 m.' }),
        schemaParoi(P18),
        scient('a) Calcule la résistance du BA13 (3 chiffres significatifs).', 'R<sub>BA13</sub> =', R18b, KW, calc(`R<sub>BA13</sub> = ${fr('12,5 × 10<sup>−3</sup>', '0,31 × 28,8')} ≈ ${c('1,40 × 10<sup>−3</sup> ' + KW)}`), { cs: 3, rel: .015, diag: v => dR(v, .0125, .31, S18, 'mm') }),
        nombre('a) Calcule la résistance du polystyrène (3 chiffres significatifs).', 'R<sub>polystyrène</sub> =', R18p, KW, calc(`R<sub>polystyrène</sub> = ${fr('10 × 10<sup>−2</sup>', '0,030 × 28,8')} ≈ ${c('0,116 ' + KW)}`), { rel: .015, affiche: '0,116', diag: v => dR(v, .1, .03, S18, 'cm') }),
        scient('a) Calcule la résistance de la brique (3 chiffres significatifs).', 'R<sub>brique</sub> =', R18r, KW, calc(`R<sub>brique</sub> = ${fr('20 × 10<sup>−2</sup>', '1,15 × 28,8')} ≈ ${c('6,04 × 10<sup>−3</sup> ' + KW)}`), { cs: 3, rel: .015, diag: v => dR(v, .2, 1.15, S18, 'cm') }),
        nombre('a) En déduire la résistance thermique totale du mur (2 chiffres significatifs).', 'R<sub>totale</sub> =', R18, KW, calc(`R<sub>totale</sub> = R<sub>BA13</sub> + R<sub>polystyrène</sub> + R<sub>brique</sub> = 1,40 × 10<sup>−3</sup> + 0,116 + 6,04 × 10<sup>−3</sup> ≈ ${c('0,12 ' + KW)}`),
          { rel: .03, affiche: '0,12', diag: v => proche(v, R18p, .02) ? 'Les petites résistances s\'ajoutent aussi.' : 'Additionne les trois résistances.' }),
        nombre('b) Quelle doit être la résistance de la fibre de bois pour que R<sub>totale</sub> = 2,2 K·W<sup>−1</sup> (3 chiffres significatifs) ?', 'R<sub>fibre</sub> =', R18f, KW,
          calc(`R<sub>BA13</sub> + R<sub>fibre</sub> + R<sub>brique</sub> = 2,2<br>⇔ R<sub>fibre</sub> = 2,2 − R<sub>BA13</sub> − R<sub>brique</sub> = 2,2 − 1,40 × 10<sup>−3</sup> − 6,04 × 10<sup>−3</sup> ≈ ${c('2,19 ' + KW)}`),
          { rel: .005, affiche: '2,19', diag: v => proche(v, 2.2) ? 'Retire les résistances du BA13 et de la brique, qui restent dans le mur.' : proche(v, 2.2 - R18, .01) ? 'Le polystyrène est remplacé : ne retire que le BA13 et la brique.' : 'R<sub>fibre</sub> = 2,2 − R<sub>BA13</sub> − R<sub>brique</sub>.' }),
        nombre('b) En déduire l\'épaisseur de fibre de bois (3 chiffres significatifs).', 'e =', e18, 'm', calc(`R<sub>fibre</sub> = ${fr('e', 'λ<sub>fibre</sub> × S')} donc e = R<sub>fibre</sub> × λ<sub>fibre</sub> × S = 2,19 × 0,050 × 28,8 ≈ ${c('3,15 m')} !`),
          { rel: .01, affiche: '3,15', diag: v => proche(v, R18f / (.05 * S18), .02) ? 'e = R × λ × S : on multiplie.' : 'e = R<sub>fibre</sub> × λ<sub>fibre</sub> × S.' }),
        choix('b) Que penser de ce résultat ?', [o('ok', 'plus de 3 m d\'isolant : c\'est irréaliste, il y a un problème dans les données de l\'énoncé'), o('a', 'c\'est normal : la fibre de bois isole mal'), o('b', 'c\'est une épaisseur courante pour un mur')], 'ok',
          `<p>Il y a un problème dans les données de l'énoncé.</p>
          <p class="tt-note"><b>Remarque.</b> La valeur R = 2,2 de l'énoncé est en réalité une <b>résistance thermique surfacique</b> R = e / λ, en m<sup>2</sup>·K·W<sup>−1</sup> : c'est celle des étiquettes d'isolants (elle ne dépend pas de la surface du mur). Avec elle :<br>
          e<sub>fibre</sub> = λ<sub>fibre</sub> × (2,2 − e<sub>BA13</sub> / λ<sub>BA13</sub> − e<sub>brique</sub> / λ<sub>brique</sub>) = 0,050 × (2,2 − 0,040 − 0,174) ≈ ${fmt(+e18s.toFixed(2))} m, soit environ 10 cm : une épaisseur réaliste.</p>`,
          { melanger: false, indices: { a: 'La fibre de bois est un bon isolant (λ = 0,050) : le problème vient d\'ailleurs.', b: 'Un mur courant fait 30 à 40 cm d\'épaisseur en tout.' } }),
      ] },

    /* ============================ EXERCICE 19 ============================ */
    { id: '19', groupe: 'parois', titre: 'Exercice 19 p. 77 : double ou triple vitrage', desc: 'Vitrages A et B : résistance, flux, énergie perdue en un jour.',
      contexte: `<p class="er-contexte">On se propose d'étudier l'isolation thermique de deux vitrages A et B de 2,0 m<sup>2</sup>, utilisant des plaques de verre de 4 mm d'épaisseur. Les deux vitrages ont même épaisseur (24 mm au total). Les cotes sont données en mm :</p>
        ${paroi({ couches: [{ nom: 'verre', motif: 'verre', e: val('4') }, { nom: 'air', motif: 'air', e: val('12') }, { nom: 'verre', motif: 'verre', e: val('4') }, { nom: 'verre', motif: 'verre', e: val('4') }], cotes: [{ nom: 'vitrage A' }, { nom: '' }], aria: 'Vitrage A : verre 4 mm, air 12 mm, verre 4 mm, verre 4 mm' })}
        ${paroi({ couches: [{ nom: 'verre', motif: 'verre', e: val('4') }, { nom: 'air', motif: 'air', e: val('16') }, { nom: 'verre', motif: 'verre', e: val('4') }], cotes: [{ nom: 'vitrage B' }, { nom: '' }], aria: 'Vitrage B : verre 4 mm, air 16 mm, verre 4 mm' })}
        <ul class="tt-donnees"><li>a) Calculer la résistance thermique de chaque vitrage.</li><li>b) Quel vitrage assure la meilleure isolation thermique ? Justifier la réponse.</li>
        <li>c) En considérant que la température extérieure est de −2 °C et que la température intérieure est de 20 °C, calculer le flux thermique à travers ces deux types de vitrages. Préciser dans quel sens s'effectue ce transfert thermique.</li>
        <li>d) Quelle est l'énergie transférée en 1 jour, en admettant que le flux est constant toute la journée ?</li><li>e) Comparer cette valeur à celle qui aurait été perdue si le vitrage avait été un simple vitrage. Conclure.</li></ul>
        <p class="tt-donnees"><b>Données</b> : λ<sub>air</sub> = 0,025 ${LAM} ; λ<sub>verre</sub> = 0,811 ${LAM}.</p>`,
      parties: [
        schemaParoi(P19, 'Place les données sur le schéma du vitrage A (trois verres de 4 mm et 12 mm d\'air ; les cases « ? » restées vides sont les inconnues).'),
        scient('a) Calcule la résistance thermique d\'une plaque de verre de 4 mm (3 chiffres significatifs).', 'R<sub>verre</sub> =', Rv, KW, calc(`R<sub>verre</sub> = ${fr('4 × 10<sup>−3</sup>', '0,811 × 2,0')} ≈ ${c('2,47 × 10<sup>−3</sup> ' + KW)}`), { cs: 3, rel: .01, diag: v => dR(v, .004, .811, 2, 'mm') }),
        nombre('a) Calcule la résistance thermique du vitrage A (2 chiffres significatifs).', 'R<sub>A</sub> =', RA, KW, calc(`R<sub>A</sub> = 3 × R<sub>verre</sub> + R<sub>air</sub> = 3 × 2,47 × 10<sup>−3</sup> + ${fr('12 × 10<sup>−3</sup>', '0,025 × 2,0')} = 7,4 × 10<sup>−3</sup> + 0,24 ≈ ${c('0,25 ' + KW)}`),
          { rel: .02, affiche: '0,25', diag: v => proche(v, .24, .02) ? 'Ajoute les trois verres.' : proche(v, Rv + .24, .01) || proche(v, 2 * Rv + .24, .01) ? 'Le vitrage A a <b>trois</b> verres.' : 'R<sub>A</sub> = 3 × R<sub>verre</sub> + R<sub>air</sub>.' }),
        nombre('a) Calcule la résistance thermique du vitrage B (2 chiffres significatifs).', 'R<sub>B</sub> =', RB, KW, calc(`R<sub>B</sub> = 2 × R<sub>verre</sub> + R<sub>air</sub> = 2 × 2,47 × 10<sup>−3</sup> + ${fr('16 × 10<sup>−3</sup>', '0,025 × 2,0')} ≈ ${c('0,32 ' + KW)}`),
          { rel: .02, affiche: '0,32', diag: v => proche(v, .32, .005) ? 'Ajoute les deux verres.' : 'R<sub>B</sub> = 2 × R<sub>verre</sub> + R<sub>air</sub>, avec 16 mm d\'air.' }),
        choix('b) Quel vitrage isole le mieux ?', [o('B', 'le vitrage B'), o('A', 'le vitrage A, qui a trois verres')], 'B',
          '<p>Le vitrage B est un meilleur isolant car sa résistance thermique est plus élevée : c\'est la lame d\'air, plus épaisse, qui isole (le verre conduit bien l\'énergie).</p>',
          { melanger: false, indices: { A: 'Compare R<sub>A</sub> ≈ 0,25 et R<sub>B</sub> ≈ 0,32 K·W<sup>−1</sup>.' } }),
        nombre('c) Calcule le flux thermique à travers le vitrage A (2 chiffres significatifs).', 'Φ<sub>A</sub> =', phiA, 'W', calc(`Φ<sub>A</sub> = ${fr('ΔT', 'R<sub>A</sub>')} = ${fr('20 − (−2)', 'R<sub>A</sub>')} = ${fr('22', '0,247')} ≈ ${c('89 W')}`) +
          '<p class="tt-note">Avec R<sub>A</sub> arrondie à 0,25, on trouve 88 W.</p>',
          { rel: .03, affiche: '89', diag: v => proche(v, 18 / RA, .03) ? 'ΔT = 20 − (−2) = 22 K.' : dPhi(v, 22, RA) }),
        nombre('c) Calcule le flux thermique à travers le vitrage B (2 chiffres significatifs).', 'Φ<sub>B</sub> =', phiB, 'W', calc(`Φ<sub>B</sub> = ${fr('22', '0,325')} ≈ ${c('68 W')}`) + '<p class="tt-note">Avec R<sub>B</sub> arrondie à 0,32, on trouve 69 W.</p>',
          { rel: .03, affiche: '68', diag: v => proche(v, 18 / RB, .03) ? 'ΔT = 20 − (−2) = 22 K.' : dPhi(v, 22, RB) }),
        partieSens({ q: 'c) Dans quel sens s\'effectue ce transfert thermique ?', cotes: ['l\'intérieur (20 °C)', 'l\'extérieur (−2 °C)'], bon: 1,
          solution: '<p>Le transfert thermique se fait de l\'intérieur vers l\'extérieur.</p>' }),
        scient('d) Calcule l\'énergie transférée en un jour à travers le vitrage A.', 'Q<sub>A</sub> =', phiA * 86400, 'J', calc(`En 24 h = 24 × 3 600 s : Q<sub>A</sub> = Φ<sub>A</sub> × Δt = 89 × 24 × 3 600 ≈ ${c('7,7 × 10<sup>6</sup> J')}<br>(ou 89 × 24 ≈ 2,1 × 10<sup>3</sup> Wh = 2,1 kWh)`),
          { diag: v => proche(v, phiA * 24, .03) ? 'Ce sont des Wh : en joules, Δt = 24 × 3 600 s.' : 'Q = Φ × Δt avec Δt = 24 × 3 600 s.' }),
        scient('d) Et à travers le vitrage B ?', 'Q<sub>B</sub> =', phiB * 86400, 'J', calc(`Q<sub>B</sub> = 68 × 24 × 3 600 ≈ ${c('5,8 × 10<sup>6</sup> J')}<br>(ou 68 × 24 ≈ 1,6 × 10<sup>3</sup> Wh = 1,6 kWh)`),
          { diag: v => proche(v, phiB * 24, .03) ? 'Ce sont des Wh : en joules, Δt = 24 × 3 600 s.' : 'Q = Φ × Δt avec Δt = 24 × 3 600 s.' }),
        scient('e) Calcule le flux à travers un simple vitrage de 4 mm.', 'Φ =', phiS, 'W', calc(`R = R<sub>verre</sub> = 2,47 × 10<sup>−3</sup> ${KW}<br>Φ = ${fr('22', '2,47 × 10<sup>−3</sup>')} ≈ ${c('8,9 × 10<sup>3</sup> W')} : il est beaucoup plus grand.`),
          { diag: v => dPhi(v, 22, Rv) }),
        nombre('e) Calcule l\'énergie perdue en un jour avec ce simple vitrage, en kWh (3 chiffres significatifs).', 'E =', phiS * 24 / 1000, 'kWh', calc(`E = 8 900 W × 24 h ≈ 214 × 10<sup>3</sup> Wh = ${c('214 kWh')}`),
          { rel: .01, affiche: '214', diag: v => proche(v, phiS * 24, .02) ? 'Ce sont des Wh : divise par 1 000.' : proche(v, phiS * 86400 / 1000, .02) ? 'Avec Δt en h, Φ × Δt est en Wh.' : 'E = Φ × Δt, Δt = 24 h, puis en kWh.' }),
        choix('e) Conclure.', [o('ok', 'l\'isolation avec un simple vitrage est beaucoup plus mauvaise : environ 100 fois plus d\'énergie perdue'), o('a', 'le simple vitrage isole presque aussi bien'), o('b', 'le simple vitrage isole mieux, car il a moins de verre')], 'ok',
          '<p>214 kWh par jour contre 2,1 et 1,6 kWh : l\'isolation avec un simple vitrage est beaucoup plus mauvaise. C\'est la lame d\'air immobile qui isole.</p>',
          { melanger: false, indices: { a: 'Compare 214 kWh avec 2,1 kWh.', b: 'Le verre conduit bien l\'énergie : c\'est l\'air qui isole.' } }),
      ] },
  ];

  window.TT.EXERCICES = EXERCICES;
  window.TT.GROUPES_EX = GROUPES_EX;
})();
