/* ============================================================
   Exercices du module 5 (application « Chapitre 8 : Mouvements de
   rotation ») : les exercices de la feuille, dans son ordre et avec sa
   numérotation : 9 p. 107 (manège), 8 p. 107 (chronophotographie),
   12 p. 108 (lave-linge), 11 p. 108 (tire-bouchon), 1 (écrou et clé à
   bougie), 2 (roue crevée), 15 p. 108 (barrière), 16 p. 109 (moteur
   à courant continu) et 17 p. 109 (moteur asynchrone et pompe).

   Chaque exercice : { id, groupe, titre, desc, contexte (HTML),
   parties: [p] ou une fonction qui les fabrique } ; chaque partie suit
   le format de ROT.PARTIES avec p.q (question) et p.correction
   (correction détaillée : formule, grandeur isolée, application
   numérique avec les unités).

   Valeurs vérifiées par un script :
     ex. 9 : T = 3 × 60 / 45 = 4 s ; f = 0,25 Hz ; 45 / 3 = 15 tr/min ;
       ω = 2π / 4 ≈ 1,57 rad/s ; v = 3 × 1,57 = 4,71 m/s ;
       θ = 1,57 × 10 = 15,7 rad ≈ 900° ;
     ex. 8 : 4 × 20 = 80 ms ; 160 ms ; ω = 2π / 0,160 ≈ 39 rad/s ;
     ex. 12 : ω = 900 × 2π / 60 ≈ 94,2 rad/s ; R = 0,325 m ;
       v = 0,325 × 94,2 ≈ 30,6 m/s ; T = 2π / 94,2 ≈ 6,67 × 10⁻² s ;
     ex. 11 : 15 × 0,10 = 1,5 N·m ; 15 × 0,06 = 0,9 N·m ;
     ex. 1 : 200 × 0,20 = 40 N·m ; 90 × 0,20 = 18 N·m ;
     ex. 2 : d = 35 cos 25° ≈ 31,7 cm ; M = 130 × 0,317 ≈ 41,2 N·m < 45 ;
       F_min = 45 / 0,40 = 112,5 N < 130 N ;
     ex. 15 : P = 20 × 9,81 ≈ 196 N ; M = 196 × 1,2 ≈ 235 N·m ;
     ex. 16 : à vide 550 tr/min ; point de fonctionnement (≈ 518 ; 8) ;
     ex. 17 : T_u,max ≈ 25,5 N·m à 750 tr/min ; n_max = 1 000 tr/min ;
       T_r,min = 2 N·m ; point de fonctionnement (950 ; 9).
   Écarts avec la correction manuscrite :
     ex. 12 b) la correction prend le diamètre (v = 61,2 m/s) : on prend
       le rayon R = 32,5 cm, v ≈ 30,6 m/s, et l'erreur est expliquée ;
     ex. 16 2. c) la correction lit 525 tr/min ; les caractéristiques des
       documents se coupent vers 518 tr/min : toute lecture entre 500 et
       540 tr/min est acceptée.
   ============================================================ */
(function () {
  'use strict';

  const { o, fr, V, fmt, proche, rad, DEUX_PI, pchip, grapheFig, partiePoint, partieFraction } = window.ROT;
  const calc = h => `<p class="ph-calc">${h}</p>`;
  const c = h => `<span class="c">${h}</span>`;
  const pr = (a, b) => proche(a, b, .015);
  const Tu = 'T<sub>u</sub>', Tr = 'T<sub>r</sub>';
  // fabriques de parties
  const choix = (q, options, bonne, correction, opts) => Object.assign({ type: 'choix', q, options, bonne, correction, melanger: false, colonne: options.some(x => x.label.replace(/<[^>]+>/g, '').length > 24) }, opts);
  const nombre = (q, label, valeur, unite, correction, opts) => Object.assign({ type: 'nombre', q, label, valeur, unite, correction, signe: false }, opts);
  const scient = (q, label, valeur, unite, correction, opts) => Object.assign({ type: 'sci', q, label, valeur, unite, correction, cs: 3, rel: .01 }, opts);
  const doc = (titre, html) => `<div class="rot-doc-carte"><p class="rot-doc-t">${titre}</p>${html}</div>`;

  /* ---------- Exercice 9 p. 107 : le manège ---------- */
  const W9 = DEUX_PI / 4;
  const ex9 = {
    id: '9', groupe: 'vitesse', titre: 'Exercice 9 p. 107 : un manège', desc: 'Période, vitesse angulaire, vitesse d\'un enfant, angle balayé',
    contexte: `<p class="er-contexte">Un manège de <b>10 m de diamètre</b> met exactement <b>3 min</b> pour réaliser <b>45 tours</b>.</p>${ROT.figManege()}
      <p class="rot-note">La question a) est barrée sur la feuille, mais la correction la fait : elle sert pour la suite.</p>`,
    parties: [
      nombre('a) Détermine la période de rotation T (durée d\'un tour), en secondes.', 'T =', 4, 's',
        calc(`Durée pour 1 tour : ${fr('3', '45')} min = ${fr('3', '45')} × 60 s`) + calc(`T = ${fr('3 × 60', '45')} = ${c('4 s')}`) + '<p>Remarque : fréquence de rotation f = 1 / T = 1 / 4 = 0,25 Hz.</p>',
        { rel: .005, diag: v => (pr(v, 3 / 45) ? 'C\'est la durée en <b>minutes</b> : convertis en secondes (3 min = 180 s).' : pr(v, 15) ? 'C\'est le nombre de tours par minute : T est la <b>durée</b> d\'un tour.' : pr(v, .25) ? 'C\'est la fréquence f = 1 / T : T est la durée d\'un tour.' : pr(v, 45 / 180) ? 'T = durée / nombre de tours (et non l\'inverse).' : 'T = 3 × 60 s / 45 tours.') }),
      nombre('b) Déduis-en la vitesse de rotation en tours par minute.', 'n =', 15, 'tr/min',
        calc(`n = ${fr('45 tours', '3 min')} = ${c('15 tr/min')}`),
        { rel: .005, diag: v => (pr(v, 135) ? 'On <b>divise</b> le nombre de tours par la durée.' : pr(v, .25) ? 'C\'est en tours par <b>seconde</b> : on veut des tours par minute.' : 'n = 45 tours / 3 min.') }),
      nombre('… puis la vitesse angulaire ω en rad/s (3 chiffres significatifs).', 'ω =', W9, 'rad/s',
        calc(`ω = ${fr('θ', 'Δt')} = ${fr('2π', 'T')} = ${fr('2π', '4')} = ${fr('π', '2')} rad·s<sup>−1</sup> ≈ ${c('1,57 rad·s<sup>−1</sup>')}`) + `<p>OU : ω = ${fr('15 × 2π rad', '60 s')} ≈ 1,57 rad·s<sup>−1</sup>.</p>`,
        { rel: .01, affiche: '1,57', diag: v => (pr(v, .25) ? 'C\'est la fréquence : un tour vaut 2π rad, ω = 2π / T.' : pr(v, Math.PI / 4) ? 'Un tour vaut 2π rad (pas π).' : pr(v, DEUX_PI * 4) ? 'On <b>divise</b> 2π par T.' : pr(v, 15 * DEUX_PI) ? '15 tr/min : il faut aussi diviser par 60 (1 min = 60 s).' : 'ω = 2π / T.') }),
      nombre('c) Calcule la vitesse d\'un enfant situé à 3 m de l\'axe de rotation.', 'v =', 3 * W9, 'm/s',
        calc(`v = R × ω = 3 m × 1,57 rad·s<sup>−1</sup> = ${c('4,71 m·s<sup>−1</sup>')}`),
        { rel: .01, affiche: '4,71', diag: v => (pr(v, 5 * W9) ? 'L\'enfant est à <b>3 m</b> de l\'axe : R = 3 m (le rayon du manège ne sert pas ici).' : pr(v, 10 * W9) ? 'R est la distance de l\'enfant à l\'axe : 3 m.' : pr(v, 3 / W9) ? 'v = R × ω : on multiplie.' : 'v = R × ω avec R = 3 m.') }),
      nombre('d) Détermine l\'angle balayé lors d\'une rotation du manège de 10 s, en radians.', 'θ =', 15.7, 'rad',
        calc(`ω = ${fr('θ', 'Δt')} ⇔ θ = ω × Δt = 1,57 × 10 = ${c('15,7 rad')}`),
        { rel: .01, diag: v => (pr(v, .157) ? 'θ = ω × Δt : on multiplie.' : pr(v, 150) ? 'Utilise ω en rad/s (1,57), pas en tr/min.' : 'θ = ω × Δt.') }),
      nombre('Exprime cet angle en degrés.', 'θ =', 900, '°',
        `<div class="ph-defile"><table class="ph-tableau"><tr><td>2π rad</td><td>360°</td></tr><tr><td>15,7 rad</td><td>?</td></tr></table></div>` + calc(`θ = ${fr('360 × 15,7', '2π')} ≈ ${c('900°')}`) + '<p>Soit 2,5 tours.</p>',
        { tol: 2, diag: v => (pr(v, 15.7 * 360) ? 'C\'est 2π rad qui vaut 360° (pas 1 rad).' : pr(v, 15.7 * DEUX_PI / 360) ? 'Produit en croix inversé : 360 × 15,7 / 2π.' : pr(v, 450) ? '2π rad = 360° (et π rad = 180°).' : 'Tableau de proportionnalité : 2π rad ↔ 360°.') }),
    ],
  };

  /* ---------- Exercice 8 p. 107 : enregistrement d'un mouvement circulaire ---------- */
  const ex8 = {
    id: '8', groupe: 'vitesse', titre: 'Exercice 8 p. 107 : un mouvement circulaire enregistré', desc: 'Mouvement uniforme, durée d\'un tour, vitesse angulaire',
    contexte: `<p class="er-contexte">On enregistre le mouvement d'un solide à des intervalles de temps égaux <b>τ = 20 ms</b>. OA<sub>1</sub> = 35 cm.</p>${ROT.figChrono()}`,
    parties: [
      choix('a) Pourquoi peut-on dire que le mouvement est uniforme ?',
        [o('ok', 'Les points sont régulièrement espacés'), o('cercle', 'La trajectoire est un cercle'), o('tau', 'Les positions sont enregistrées à intervalles de temps égaux'), o('rayon', 'Tous les points sont à 35 cm de O')], 'ok',
        '<p>Le mouvement est uniforme car les points sont <b>régulièrement espacés</b> : le solide parcourt la même distance pendant chaque intervalle τ.</p>',
        { indices: { cercle: 'Le cercle montre que le mouvement est <b>circulaire</b> ; « uniforme » veut dire que la vitesse est constante.', tau: 'C\'est vrai pour tout enregistrement : ce qui compte, c\'est la distance parcourue pendant chaque intervalle.', rayon: 'Cela montre que la trajectoire est un cercle de centre O, pas que la vitesse est constante.' } }),
      nombre('b) Quelle est la durée d\'un demi-tour (de A<sub>1</sub> à A<sub>5</sub>), en ms ?', 'Δt =', 80, 'ms',
        calc(`Durée pour ½ rotation : 4 × 20 ms = ${c('80 ms')}`),
        { rel: .005, diag: v => (pr(v, 100) ? 'Compte les <b>intervalles</b>, pas les points : de A<sub>1</sub> à A<sub>5</sub>, il y a 4 intervalles.' : pr(v, 5) || pr(v, 4) ? 'Chaque intervalle dure 20 ms.' : '4 intervalles de 20 ms.') }),
      nombre('Quelle est la durée d\'une rotation complète du point A autour de l\'axe O, en ms ?', 'T =', 160, 'ms',
        calc(`Durée d'une rotation : 2 × 80 = ${c('160 ms = 160 × 10<sup>−3</sup> s')}`),
        { rel: .005, diag: v => (pr(v, 80) ? 'C\'est un demi-tour : un tour complet dure deux fois plus.' : pr(v, 200) ? 'Le demi-tour dure 4 intervalles (80 ms), pas 5.' : 'Un tour = deux demi-tours.') }),
      nombre('c) Déduis-en la vitesse angulaire ω (2 chiffres significatifs).', 'ω =', DEUX_PI / .16, 'rad/s',
        calc(`ω = ${fr('θ', 'Δt')} = ${fr('2π', '160 × 10<sup>−3</sup>')} ≈ ${c('39 rad·s<sup>−1</sup>')}`),
        { rel: .02, affiche: '39', diag: v => (pr(v, DEUX_PI / 160) ? 'La durée doit être en <b>secondes</b> : 160 ms = 0,160 s.' : pr(v, Math.PI / .16) ? 'Un tour vaut 2π rad (pas π).' : pr(v, 1 / .16) ? 'En un tour, θ = 2π rad.' : 'ω = 2π / T, T en s.') }),
    ],
  };

  /* ---------- Exercice 12 p. 108 : le lave-linge ---------- */
  const W12 = 900 * DEUX_PI / 60;
  const ex12 = {
    id: '12', groupe: 'vitesse', titre: 'Exercice 12 p. 108 : un lave-linge essore', desc: 'tr/min → rad/s, vitesse d\'un point du tambour (rayon !), durée d\'un tour',
    contexte: '<p class="er-contexte">Un lave-linge essore à <b>900 tr·min<sup>−1</sup></b>. Le diamètre du tambour est de <b>65,0 cm</b>.</p>',
    parties: () => [
      Object.assign(partieFraction({ sens: 'trmin', valeur: 900, q: 'a) Détermine sa vitesse angulaire en rad·s<sup>−1</sup> : complète la fraction ligne par ligne (le bouton <b>?</b> change à chaque appui : 2π, π, 360).' }),
        { correction: calc(`ω = 900 tours/min = ${fr('900 × 2π rad', '60 s')} = ${c('94,2 rad·s<sup>−1</sup>')}`) }),
      nombre('b) Pour la vitesse d\'un point du tambour : quel est le rayon R du tambour, en mètres ?', 'R =', .325, 'm',
        calc(`R = ${fr('D', '2')} = ${fr('65,0 cm', '2')} = 32,5 cm = ${c('0,325 m')}`) + '<p><b>Attention</b> : la correction de la feuille utilise le diamètre (65,0 × 10<sup>−2</sup> m). C\'est une erreur : dans v = R × ω, R est le <b>rayon</b>.</p>',
        { rel: .005, diag: v => (pr(v, .65) ? 'C\'est le <b>diamètre</b> : le rayon en est la moitié.' : pr(v, 32.5) ? 'Convertis en mètres (÷ 100).' : 'R = D / 2, en m.') }),
      nombre('Calcule la vitesse v d\'un point du tambour (3 chiffres significatifs).', 'v =', .325 * W12, 'm/s',
        calc(`v = R × ω = 0,325 m × 94,2 rad·s<sup>−1</sup> ≈ ${c('30,6 m·s<sup>−1</sup>')}`) + '<p>Avec le diamètre, on trouverait 61,2 m·s<sup>−1</sup> : c\'est deux fois trop.</p>',
        { rel: .01, affiche: '30,6', diag: v => (pr(v, .65 * W12) ? 'Tu as pris le diamètre (c\'est l\'erreur de la correction de la feuille) : R = 0,325 m.' : pr(v, 32.5 * W12) ? 'R doit être en mètres.' : pr(v, .325 * 900) ? 'Utilise ω en rad/s (94,2), pas en tr/min.' : 'v = R × ω.') }),
      scient('c) Quelle est la durée d\'un tour (période T) ?', 'T =', DEUX_PI / W12, 's',
        calc(`ω = ${fr('θ', 'Δt')} ⇔ Δt = ${fr('θ', 'ω')}`) + calc(`Pour 1 tour, θ = 2π rad et Δt<sub>1 tour</sub> (= T) = ${fr('2π', '94,2')} = ${c('6,67 × 10<sup>−2</sup> s')}`),
        { diag: v => (pr(v, W12 / DEUX_PI) ? 'C\'est l\'inverse : T = 2π / ω.' : pr(v, 1 / W12) ? 'En un tour, θ = 2π rad : T = 2π / ω.' : 'T = 2π / ω.') }),
    ],
  };

  /* ---------- Exercice 11 p. 108 : le tire-bouchon ---------- */
  const ex11 = {
    id: '11', groupe: 'moment', titre: 'Exercice 11 p. 108 : un tire-bouchon', desc: 'Moment d\'un couple, influence de la distance entre les forces',
    contexte: `<p class="er-contexte">Lorsqu'on utilise un tire-bouchon, on exerce un <b>couple de forces</b>.</p>
      ${ROT.figBarre({ gauche: ['F', ''], droite: ['F', ''], moinsD: true, long: '10 cm', titre: 'poignée du tire-bouchon (vue de dessus)', aria: 'Poignée de tire-bouchon de 10 cm, tournant autour de son milieu ; une force F à une extrémité, la force opposée moins F à l\'autre' })}`,
    parties: [
      nombre('a) L\'intensité des forces est de 15 N ; on les exerce aux extrémités du tire-bouchon, de longueur 10 cm. Détermine le moment du couple.', 'M =', 1.5, 'N·m',
        calc(`M = F × d = 15 N × 10 × 10<sup>−2</sup> m = ${c('1,5 N·m')}`),
        { rel: .01, diag: v => (pr(v, 150) ? 'La distance doit être en mètres : 10 cm = 0,10 m.' : pr(v, .75) ? 'La distance entre les deux droites d\'action est toute la longueur : 10 cm.' : pr(v, 3) ? 'F est la valeur commune des deux forces : on ne la double pas.' : 'M = F × D.') }),
      nombre('b) Calcule le moment du couple si on exerce les forces à 3 cm de l\'axe.', 'M\' =', .9, 'N·m',
        calc(`Les forces sont à 3 cm de part et d'autre de l'axe : d' = 3 + 3 = 6 cm.`) + calc(`M' = F × d' = 15 N × 6 × 10<sup>−2</sup> m = ${c('0,9 N·m')}`),
        { rel: .01, diag: v => (pr(v, .45) ? 'Chaque force est à 3 cm de l\'axe : la distance entre les deux droites d\'action est 3 + 3 = 6 cm.' : pr(v, 90) ? 'La distance doit être en mètres.' : 'M\' = F × d\' avec d\' = 6 cm.') }),
      choix('Compare ce résultat à celui de la question a).', [o('faible', 'Le moment est plus faible'), o('grand', 'Le moment est plus grand'), o('egal', 'Le moment est le même')], 'faible',
        '<p>0,9 N·m < 1,5 N·m : le moment est plus faible si la distance entre les forces est plus faible.</p>',
        { indices: { grand: '0,9 N·m est plus petit que 1,5 N·m.', egal: 'Les forces sont les mêmes, mais la distance entre elles a changé.' } }),
    ],
  };

  /* ---------- Exercice 1 : écrou de vélo et clé à bougie ---------- */
  const ex1 = {
    id: '1', groupe: 'moment', titre: 'Exercice 1 : écrou de vélo et clé à bougie', desc: 'Moment d\'une force, moment d\'un couple',
    contexte: `<p class="er-contexte">1. Pour serrer un écrou sur une roue de vélo, on exerce, à <b>20 cm</b> de l'axe de rotation, une force perpendiculaire à un rayon, de valeur <b>F = 200 N</b>.</p>
      ${ROT.figCle({ a: .2, beta: -90, aria: 'Clé tournant autour de l\'écrou O ; force de 200 N perpendiculaire à la clé, appliquée à 20 cm de O' })}
      <p class="er-contexte">2. À l'aide d'une clé à bougie, on serre une bougie sur son support : F<sub>1</sub> = F<sub>2</sub> = <b>90 N</b>, d = <b>20 cm</b>.</p>
      ${ROT.figBarre({ gauche: ['F', '1'], droite: ['F', '2'], long: 'd = 20 cm', titre: 'clé à bougie (vue de dessus)', aria: 'Clé à bougie en T vue de dessus : deux forces opposées de 90 N aux extrémités de la poignée, distantes de 20 cm' })}`,
    parties: [
      nombre('1. Calcule le moment de la force exercée sur l\'écrou.', 'M =', 40, 'N·m',
        calc(`M = F × d = 200 N × 20 × 10<sup>−2</sup> m = ${c('40 N·m')}`),
        { rel: .01, diag: v => (pr(v, 4000) ? 'd doit être en mètres : 20 cm = 0,20 m.' : pr(v, 1000) || pr(v, .001) ? 'M = F × d : on multiplie.' : 'M = F × d.') }),
      choix('2. Que forment les forces F⃗<sub>1</sub> et F⃗<sub>2</sub> exercées sur la clé à bougie ?', [o('couple', 'Un couple de forces'), o('nul', 'Deux forces qui s\'annulent : la clé ne tourne pas'), o('une', 'Une seule force de 180 N')], 'couple',
        '<p>Même intensité, même direction, sens opposés : c\'est un <b>couple de forces</b>.</p>',
        { indices: { nul: 'Elles ne s\'appliquent pas au même endroit : leurs droites d\'action sont différentes, elles font tourner la clé.', une: 'On n\'additionne pas des forces de sens opposés : ensemble, elles forment un couple.' } }),
      nombre('Calcule le couple exercé par la clé sur la bougie.', 'M\' =', 18, 'N·m',
        calc(`M' = F × d = 90 N × 20 × 10<sup>−2</sup> m = ${c('18 N·m')} &nbsp;(F = F<sub>1</sub> = F<sub>2</sub>)`),
        { rel: .01, diag: v => (pr(v, 36) ? 'F est la valeur <b>commune</b> des deux forces (90 N) : on ne les additionne pas.' : pr(v, 9) ? 'd est toute la distance entre les deux forces (20 cm).' : pr(v, 1800) ? 'd doit être en mètres.' : 'M\' = F × d.') }),
    ],
  };

  /* ---------- Exercice 2 : la roue crevée ---------- */
  const D2 = 35 * Math.cos(rad(25));
  const ex2 = {
    id: '2', groupe: 'moment', titre: 'Exercice 2 : une roue crevée', desc: 'Bras de levier d\'une force oblique, couple de la clé en croix',
    contexte: `<p class="er-contexte">Un automobiliste est victime d'une crevaison et doit démonter la roue endommagée pour la remplacer par la roue de secours. Le couple de serrage de l'écrou qu'il veut dévisser est <b>C<sub>s</sub> = 45 N·m</b>. La longueur de la clé est <b>OA = D = 35 cm</b>, et l'automobiliste est capable de fournir une force d'intensité <b>F = 130 N</b>.</p>
      <div class="rot-docs deux">${doc('Situation 1 : la clé', ROT.figOblique({ alpha: 25, OA: '35 cm' }))}
        ${doc('Situation 2 : la clé en croix', ROT.figBarre({ gauche: ['F', '1'], droite: ['F', '2'], ptG: 'A', ptD: 'B', long: 'AB = 40 cm', aria: 'Clé en croix : force F1 vers le bas en A, force F2 vers le haut en B, O au milieu ; AB = 40 cm' }))}</div>`,
    parties: [
      nombre('1. Situation 1 : calcule le bras de levier d de la force F⃗ par rapport à l\'axe passant par O, en cm (3 chiffres significatifs).', 'd =', D2, 'cm',
        calc(`Dans le triangle OHA rectangle en H : cos(25°) = ${fr('d', 'OA')}`) + calc(`donc d = OA × cos(25°) = 35 × cos(25°) = ${c('31,7 cm')}`),
        { rel: .01, affiche: '31,7', diag: v => (pr(v, 35 * Math.sin(rad(25))) ? 'd est le côté <b>adjacent</b> à l\'angle de 25° : on prend cos (et non sin).' : pr(v, 35) ? 'La force n\'est pas perpendiculaire à la clé : d n\'est pas OA.' : pr(v, 35 * Math.cos(25)) ? 'Mets ta calculatrice en <b>degrés</b>.' : 'd = OA × cos(25°).') }),
      nombre('Calcule le moment de la force F⃗.', 'M =', 130 * D2 / 100, 'N·m',
        calc(`M = F × d = 130 N × 31,7 × 10<sup>−2</sup> m = ${c('41,2 N·m')}`),
        { rel: .01, affiche: '41,2', diag: v => (pr(v, 130 * D2) ? 'd doit être en mètres : 31,7 cm = 0,317 m.' : pr(v, 130 * .35) ? 'Utilise le bras de levier d = 0,317 m, pas OA.' : 'M = F × d.') }),
      choix('Cette opération permet-elle à l\'automobiliste de débloquer l\'écrou ?', [o('non', 'Non : M < 45 N·m'), o('oui', 'Oui : M > 45 N·m')], 'non',
        '<p>M = 41,2 N·m < 45 N·m : l\'automobiliste ne peut pas débloquer l\'écrou.</p>',
        { indices: { oui: 'Compare : 41,2 N·m et 45 N·m.' } }),
      choix('2. a) Situation 2 : pourquoi l\'association des forces F⃗<sub>1</sub> et F⃗<sub>2</sub> constitue-t-elle un couple de forces ?',
        [o('ok', 'Même intensité, même direction, sens contraires'), o('meme', 'Elles sont appliquées au même point'), o('perp', 'Elles sont perpendiculaires à la clé')], 'ok',
        '<p>Les deux forces sont de même intensité F, de même direction et de sens contraire : elles forment donc un couple de forces.</p>',
        { indices: { meme: 'Elles sont appliquées en A et en B, deux points différents.', perp: 'C\'est vrai, mais ce n\'est pas la définition d\'un couple.' } }),
      nombre('b) Sachant que la distance AB est de 40 cm, quelle force minimale doit-il fournir pour débloquer l\'écrou ?', 'F<sub>min</sub> =', 112.5, 'N',
        calc(`M = F × d ⇔ F = ${fr('M', 'd')}`) + calc(`La force minimale à appliquer est F<sub>min</sub> = ${fr('45', '40 × 10<sup>−2</sup>')} = ${c('112,5 N')}`),
        { rel: .01, diag: v => (pr(v, 18) ? 'F = M / d : on <b>divise</b>.' : pr(v, 225) ? 'd est la distance entre les deux droites d\'action : AB = 40 cm (et non 20 cm).' : pr(v, 1.125) ? 'd doit être en mètres.' : pr(v, 45 / .35) ? 'Avec la clé en croix, d = AB = 40 cm.' : 'F = M / d avec d = AB.') }),
      choix('En a-t-il les capacités ?', [o('oui', 'Oui : 112,5 N < 130 N'), o('non', 'Non : il lui faudrait plus de 130 N')], 'oui',
        '<p>Cette force est inférieure à 130 N : il peut débloquer l\'écrou, sans avoir besoin de forcer au maximum.</p>',
        { indices: { non: 'Compare : 112,5 N et 130 N.' } }),
    ],
  };

  /* ---------- Exercice 15 p. 108 : la barrière de parking ---------- */
  const P15 = 20 * 9.81, M15 = P15 * 1.2;
  const ex15 = {
    id: '15', groupe: 'moment', titre: 'Exercice 15 p. 108 : une barrière de parking', desc: 'Poids, moment du poids, sens et couple du moteur',
    contexte: `<p class="er-contexte">Une barrière de parking de masse <b>m = 20 kg</b> est mobile autour d'un axe passant par O. Son centre de gravité G se trouve à <b>1,2 m</b> de l'axe de rotation. On prend g = 9,81 N/kg.</p>${ROT.figBarriere()}`,
    parties: [
      choix('1. Quelles sont les caractéristiques du poids P⃗ de la barrière ?', [o('ok', 'Appliqué en G, vertical, vers le bas'), o('O', 'Appliqué en O, vertical, vers le bas'), o('h', 'Appliqué en G, horizontal, vers O'), o('haut', 'Appliqué en G, vertical, vers le haut')], 'ok',
        `<p>${V('P')} : appliqué en G, vertical, vers le bas.</p>${ROT.figBarriere({ poids: true })}`,
        { indices: { O: 'Le poids s\'applique au <b>centre de gravité</b> G.', h: 'Le poids est toujours <b>vertical</b>.', haut: 'Le poids est dirigé vers le <b>bas</b>.' } }),
      nombre('Calcule la valeur du poids.', 'P =', P15, 'N',
        calc(`P = m × g = 20 kg × 9,81 N/kg = ${c('196 N')}`),
        { rel: .01, affiche: '196', diag: v => (pr(v, 20) ? 'C\'est la masse : P = m × g.' : pr(v, 20 / 9.81) ? 'On <b>multiplie</b> par g.' : 'P = m × g.') }),
      nombre('2. La barrière est initialement à l\'horizontale. Calcule le moment du poids de la barrière par rapport au point O.', 'M =', M15, 'N·m',
        calc(`Le poids est vertical, la barrière horizontale : le bras de levier est OG.`) + calc(`M = P × OG = 196 N × 1,2 m = ${c('235 N·m')}`),
        { rel: .01, affiche: '235', diag: v => (pr(v, 24) ? 'Utilise le <b>poids</b> P (en N), pas la masse.' : pr(v, P15 / 1.2) ? 'M = P × OG : on multiplie.' : pr(v, P15 * 120) ? 'OG doit être en mètres.' : 'M = P × OG.') }),
      choix('3. a) Afin de soulever la barrière, le moteur exerce un couple de forces. Dans quel sens doit tourner le moteur ?', [o('s2', 'Dans le sens 2'), o('s1', 'Dans le sens 1')], 's2',
        '<p>Le moteur doit tourner dans le <b>sens 2</b> pour soulever la barrière (le poids la fait tourner dans le sens 1).</p>',
        { indices: { s1: 'Dans le sens 1, l\'extrémité de la barrière descend : c\'est le sens dans lequel le poids la fait tourner.' } }),
      nombre('b) Quelle est la valeur minimale du couple de forces du moteur ?', 'M<sub>moteur</sub> =', M15, 'N·m',
        calc(`Le moteur doit au moins compenser le moment du poids : valeur minimale du couple du moteur ${c('235 N·m')}`),
        { rel: .01, affiche: '235', diag: v => (pr(v, P15) ? 'C\'est un moment (N·m) : il doit compenser le moment du poids.' : 'Le couple du moteur doit compenser le moment du poids (question 2).') }),
      choix('Quand la barrière se lève, le moment du poids par rapport à O :', [o('dim', 'diminue'), o('aug', 'augmente'), o('cst', 'ne change pas')], 'dim',
        '<p>Quand la barrière se lève, le moment du poids diminue car la distance entre la direction de P⃗ (verticale passant par G) et O diminue.</p>',
        { indices: { aug: 'Imagine la barrière verticale : la droite d\'action du poids passe alors par O.', cst: 'Le poids ne change pas, mais le bras de levier, si : regarde la distance entre O et la verticale passant par G.' } }),
    ],
  };

  /* ---------- Caractéristiques des exercices 16 et 17 ---------- */
  // ex. 16 : moteur à courant continu (12,4 N·m jusqu'à 500 tr/min, puis droite jusqu'à 0 à 550 tr/min) ;
  // charge lue sur le doc. 2 ; elles se coupent en T = 8 N·m, n = 550 − 8 × 50 / 12,4 ≈ 518 tr/min
  const M16 = n => (n <= 500 ? 12.4 : 12.4 * (550 - n) / 50);
  const N16 = 550 - 8 * 50 / 12.4;
  const C16 = pchip([[0, 5], [200, 5.6], [400, 6.8], [N16, 8], [600, 9], [800, 12.6], [1000, 19]]);
  // ex. 17 : moteur asynchrone et pompe (lus sur les documents), qui se coupent en (950 ; 9)
  const M17 = pchip([[0, 12], [200, 14.2], [400, 17.8], [600, 22.4], [750, 25.5], [850, 21], [950, 9], [1000, 0]]);
  const C17 = pchip([[0, 2], [200, 2.2], [400, 3.2], [600, 4.9], [800, 7.1], [950, 9], [1000, 9.8], [1200, 13.2]]);
  const NOM_TU = 'T<tspan dy="4" font-size="10">u</tspan><tspan dy="-4"> (N·m)</tspan>', NOM_TR = 'T<tspan dy="4" font-size="10">r</tspan><tspan dy="-4"> (N·m)</tspan>';

  /* ---------- Exercice 16 p. 109 : moteur à courant continu ---------- */
  const def16a = { x: { max: 600, pas: 100, sous: 50, nom: 'n (tr/min)' }, y: { max: 14, pas: 2, sous: 1, nom: NOM_TU }, courbes: [{ f: M16, de: 0, a: 550, cls: 'moteur' }],
    lectures: [{ x: 500, y: 12.4, tx: '500', ty: '12,4' }], aria: 'Doc. 1 : caractéristique du moteur : 12,4 N·m de 0 à 500 tr/min, puis droite jusqu\'à 0 à 550 tr/min' };
  const def16b = { x: { max: 1000, pas: 200, sous: 100, nom: 'n (tr/min)' }, y: { max: 20, pas: 2, sous: 1, nom: NOM_TR }, courbes: [{ f: C16, de: 0, a: 1000, cls: 'charge', etiq: { x: 960, y: 15, texte: 'T<tspan dy="3" font-size="9">R</tspan><tspan dy="-3">(n)</tspan>', ancre: 'end' } }],
    aria: 'Doc. 2 : caractéristique de la charge : 5 N·m à l\'arrêt, la courbe monte de plus en plus vite jusqu\'à 19 N·m à 1 000 tr/min' };
  const def16 = { x: def16b.x, y: { max: 20, pas: 2, sous: 1, nom: 'T (N·m)' },
    courbes: [{ f: M16, de: 0, a: 550, cls: 'moteur', etiq: { x: 470, y: 13.2, texte: 'moteur', ancre: 'end' } }, { f: C16, de: 0, a: 1000, cls: 'charge', etiq: { x: 960, y: 15, texte: 'charge', ancre: 'end' } }],
    aria: 'Caractéristiques du moteur et de la charge superposées' };
  const ex16 = {
    id: '16', groupe: 'carac', titre: 'Exercice 16 p. 109 : un moteur à courant continu', desc: 'Fréquence à vide, point de fonctionnement (superposition interactive)',
    contexte: `<p class="er-contexte">On utilise un moteur à courant continu dont la caractéristique ${Tu}(n) est représentée dans le doc. 1. Ce moteur entraîne une charge (un scooter) exerçant un couple résistant T<sub>R</sub>. La caractéristique T<sub>R</sub>(n) est représentée sur le doc. 2.</p>
      <div class="rot-docs deux">${doc('Doc. 1 : caractéristique du moteur à courant continu', grapheFig(def16a))}${doc('Doc. 2 : caractéristique T<sub>R</sub>(n) de la charge', grapheFig(def16b))}</div>`,
    parties: () => [
      nombre('1. Quelle est la vitesse de rotation du moteur « à vide » ?', 'n =', 550, 'tr/min',
        '<p>Vitesse de rotation à vide : n = 550 tr/min (doc. 1, quand le couple T<sub>u</sub> est nul).</p>',
        { tol: 10, diag: v => (pr(v, 500) ? 'À 500 tr/min, le moteur fournit encore 12,4 N·m : à vide, le couple est <b>nul</b>.' : v < 20 ? 'C\'est un couple : la vitesse se lit sur l\'axe horizontal.' : 'À vide, T<sub>u</sub> = 0 : lis où la caractéristique coupe l\'axe horizontal (doc. 1).') }),
      Object.assign(partiePoint(def16, { q: '2. Quand le moteur est connecté au scooter : pour voir le point de fonctionnement, il faut superposer les deux courbes (c\'est fait ci-dessous). Place le point de fonctionnement.',
        cible: [N16, 8], tol: [20, .7], depart: [200, 16], moteur: M16, charge: C16 }),
        { correction: '<p>Le point de fonctionnement est l\'intersection de la caractéristique de la charge et de la caractéristique du moteur.</p>' }),
      nombre('a) Détermine au point de fonctionnement le moment T\'<sub>u</sub> du couple du moteur.', 'T\'<sub>u</sub> =', 8, 'N·m',
        '<p>Pointillés horizontaux depuis le point de fonctionnement : T\'<sub>u</sub> = 8 N·m.</p>',
        { tol: .6, diag: v => (pr(v, 12.4) ? '12,4 N·m, c\'est le couple du moteur à basse vitesse : lis la hauteur du <b>point de fonctionnement</b>.' : v > 100 ? 'C\'est une vitesse : le couple se lit sur l\'axe vertical.' : 'Lis l\'ordonnée du point de fonctionnement (1 carreau = 1 N·m).') }),
      choix('b) Que vaut le moment T\'<sub>r</sub> du couple résistant imposé au moteur ?', [o('ok', 'T\'<sub>r</sub> = 8 N·m'), o('124', 'T\'<sub>r</sub> = 12,4 N·m'), o('zero', 'T\'<sub>r</sub> = 0')], 'ok',
        '<p>T\'<sub>r</sub> = 8 N·m (c\'est forcément le même : au point de fonctionnement, T<sub>u</sub> = T<sub>r</sub>).</p>',
        { indices: { 124: 'Au point de fonctionnement, le couple résistant est égal au couple du moteur.', zero: 'Le scooter freine le moteur : son couple résistant n\'est pas nul.' } }),
      nombre('c) Quelle est la fréquence de rotation en tr/min ?', 'n =', N16, 'tr/min',
        '<p>Vitesse de rotation en tr/min (appelée fréquence de rotation dans l\'énoncé) : n ≈ 520 tr/min. La correction de la feuille lit 525 tr/min : à la lecture graphique, toute valeur entre 500 et 540 tr/min convient.</p>',
        { tol: 22, affiche: '520', diag: v => (pr(v, 550) ? '550 tr/min, c\'est la vitesse à vide : lis l\'abscisse du <b>point de fonctionnement</b>.' : v < 30 ? 'C\'est un couple : la fréquence se lit sur l\'axe horizontal.' : 'Descends en pointillés du point de fonctionnement jusqu\'à l\'axe horizontal.') }),
    ],
  };

  /* ---------- Exercice 17 p. 109 : moteur asynchrone et pompe ---------- */
  const def17a = { x: { max: 1200, pas: 200, sous: 100, nom: 'n (tr/min)' }, y: { max: 30, pas: 5, sous: 1, nom: NOM_TU }, courbes: [{ f: M17, de: 0, a: 1000, cls: 'moteur', etiq: { x: 690, y: 27.5, texte: 'moteur asynchrone', ancre: 'end' } }],
    aria: 'Doc. 1 : caractéristique du moteur asynchrone : 12 N·m au démarrage, sommet vers 25,5 N·m à 750 tr/min, couple nul à 1 000 tr/min' };
  const def17b = { x: { max: 1200, pas: 200, sous: 100, nom: 'n (tr/min)' }, y: { max: 30, pas: 5, sous: 1, nom: NOM_TR }, courbes: [{ f: C17, de: 0, a: 1200, cls: 'charge', etiq: { x: 1100, y: 15.5, texte: 'pompe', ancre: 'end' } }],
    aria: 'Doc. 2 : caractéristique de la pompe : 2 N·m à l\'arrêt, la courbe monte lentement jusqu\'à 13 N·m à 1 200 tr/min' };
  const def17 = { x: def17a.x, y: { max: 30, pas: 5, sous: 1, nom: 'T (N·m)' },
    courbes: [{ f: M17, de: 0, a: 1000, cls: 'moteur', etiq: { x: 690, y: 27.5, texte: 'moteur', ancre: 'end' } }, { f: C17, de: 0, a: 1200, cls: 'charge', etiq: { x: 1190, y: 15.5, texte: 'pompe', ancre: 'end' } }],
    aria: 'Caractéristiques du moteur asynchrone et de la pompe superposées' };
  const ex17 = {
    id: '17', groupe: 'carac', titre: 'Exercice 17 p. 109 : moteur asynchrone et pompe', desc: 'Couple maximal, fréquence maximale, point de fonctionnement',
    contexte: `<p class="er-contexte">Un moteur asynchrone (MAS) entraîne une pompe de relevage des eaux. La caractéristique ${Tu}(n) du MAS est donnée dans le doc. 1, celle de la pompe ${Tr}(n) dans le doc. 2.</p>
      <div class="rot-docs deux">${doc('Doc. 1 : caractéristique du MAS', grapheFig(def17a))}${doc('Doc. 2 : caractéristique de la pompe', grapheFig(def17b))}</div>`,
    parties: () => [
      nombre('Étude du MAS. a) Quelle est la valeur du plus grand couple délivré par le MAS ?', 'T<sub>u,max</sub> =', 25.5, 'N·m',
        '<p>Couple max : T<sub>u,max</sub> = 25,5 N·m (sommet de la courbe).</p>',
        { tol: .8, diag: v => (pr(v, 12) ? 'C\'est le couple au démarrage : le plus grand couple est le <b>sommet</b> de la courbe.' : v > 100 ? 'C\'est une fréquence : le couple se lit sur l\'axe vertical.' : 'Lis l\'ordonnée du sommet (1 carreau = 1 N·m).') }),
      nombre('À quelle fréquence de rotation le MAS délivre-t-il ce couple ?', 'n =', 750, 'tr/min',
        '<p>Fréquence de rotation (vitesse) : 750 tr/min.</p>',
        { tol: 40, diag: v => (pr(v, 1000) ? 'C\'est la fréquence à vide : descends du <b>sommet</b> jusqu\'à l\'axe horizontal.' : v < 40 ? 'C\'est un couple : la fréquence se lit sur l\'axe horizontal.' : 'Descends du sommet en pointillés jusqu\'à l\'axe horizontal.') }),
      nombre('b) Quelle est la fréquence de rotation maximale du MAS ?', 'n<sub>max</sub> =', 1000, 'tr/min',
        '<p>Fréquence de rotation max : 1 000 tr/min (le couple du moteur y devient nul).</p>',
        { tol: 20, diag: v => (pr(v, 750) ? 'C\'est la fréquence du couple maximal : la fréquence maximale est atteinte quand le couple devient <b>nul</b>.' : pr(v, 1200) ? '1 200 tr/min est la fin de l\'axe : regarde où la courbe s\'arrête.' : 'Lis où la courbe coupe l\'axe horizontal.') }),
      nombre('Étude de la pompe. c) Quel est le couple minimum nécessaire pour entraîner la pompe ?', 'T<sub>r,min</sub> =', 2, 'N·m',
        '<p>Couple min pour la pompe : T<sub>r,min</sub> = 2 N·m (à n = 0).</p>',
        { tol: .5, diag: v => (pr(v, 13) || pr(v, 13.2) ? 'C\'est le couple le plus grand : le minimum est au départ de la courbe (n = 0).' : 'Lis la valeur de la courbe de la pompe pour n = 0.') }),
      choix('d) La caractéristique de la pompe est-elle « linéaire » ?', [o('non', 'Non : ce n\'est pas une droite'), o('oui', 'Oui : elle augmente toujours')], 'non',
        '<p>La caractéristique de la pompe n\'est pas linéaire (ce n\'est pas une droite).</p>',
        { indices: { oui: 'Une caractéristique « linéaire » est une <b>droite</b>. Celle-ci s\'incurve.' } }),
      Object.assign(partiePoint(def17, { q: 'Point de fonctionnement. Il faut superposer les deux caractéristiques pour trouver le point de fonctionnement (c\'est fait ci-dessous) : place-le.',
        cible: [950, 9], tol: [25, .8], depart: [400, 25], moteur: M17, charge: C17 }),
        { correction: '<p>Au point de fonctionnement : intersection des deux caractéristiques.</p>' }),
      nombre('e) Détermine le couple résistant imposé au moteur par la pompe au point de fonctionnement.', 'T<sub>r</sub> =', 9, 'N·m',
        '<p>Couple résistant : 9 N·m.</p>',
        { tol: .8, diag: v => (v > 100 ? 'C\'est une fréquence : le couple se lit sur l\'axe vertical.' : pr(v, 25.5) ? 'C\'est le couple maximal du moteur : lis la hauteur du point de fonctionnement.' : 'Lis l\'ordonnée du point de fonctionnement.') }),
      nombre('f) Quelle est alors la fréquence de rotation ?', 'n =', 950, 'tr/min',
        '<p>Fréquence de rotation : 950 tr/min.</p>',
        { tol: 25, diag: v => (pr(v, 1000) ? 'C\'est la fréquence à vide : lis l\'abscisse du point de fonctionnement.' : v < 40 ? 'C\'est un couple : la fréquence se lit sur l\'axe horizontal.' : 'Descends du point de fonctionnement jusqu\'à l\'axe horizontal.') }),
    ],
  };

  window.ROT.EXERCICES = [ex9, ex8, ex12, ex11, ex1, ex2, ex15, ex16, ex17];
  window.ROT.GROUPES_EX = [
    { id: 'vitesse', titre: 'Vitesse angulaire (p. 107 et 108)' },
    { id: 'moment', titre: 'Moment d\'une force et couple' },
    { id: 'carac', titre: 'Caractéristiques et point de fonctionnement (p. 109)' },
  ];
})();
