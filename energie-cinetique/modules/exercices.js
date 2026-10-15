/* ============================================================
   Exercices du module 5 (application « Chapitre 7 : Théorème de
   l'énergie cinétique ») : les exercices supplémentaires de la
   feuille, avec la numérotation du manuel : 18 p. 98 (camion qui
   freine) et 19 p. 98 (pierre de curling). Les exemples 1 à 5 du
   cours sont traités dans le module 4 (pas de doublon ici).

   Chaque exercice : { id, groupe, titre, desc, contexte (HTML),
   parties: [p] ou une fonction qui les fabrique } ; chaque partie suit
   le format de EC.PARTIES avec p.q (question) et p.correction
   (correction détaillée : formule, grandeur isolée, application
   numérique avec les unités).
   L'ex. 18 commence par l'outil schéma (données glissées sur le
   schéma, angle de chaque force).

   Valeurs vérifiées par un script :
     ex. 18 : v = 90,0 / 3,6 = 25,0 m/s ; E_c,A = ½ × 33,0 × 10³ × 25,0²
       = 1,03 × 10⁷ J ; W(f⃗) = −1,03 × 10⁷ J ; f = 1,03 × 10⁷ / 60,0
       = 1,72 × 10⁵ N ;
     ex. 19 : E_c,i = ½ × 18,52 × 2,8² ≈ 72,6 J ≈ 73 J ;
       μ = 72,6 / (18,52 × 9,8 × 27,5) ≈ 0,0145 ≈ 0,015.
   Écarts avec la correction : ex. 19 g) le corrigé écrit 0,014 (arrondi
   trop tôt) : on attend 0,015 ; ex. 18 b) « réaction de la route sur la
   remorque » devient « sur le camion ».
   ============================================================ */
(function () {
  'use strict';

  const { o, fr, nomV, W, partieDonnees, partieAngles, proche } = window.EC;
  const calc = h => `<p class="ph-calc">${h}</p>`;
  const c = h => `<span class="c">${h}</span>`;
  const vA = 'v<sub>A</sub>', EC_ = 'E<sub>c</sub>';
  // fabriques de parties
  const choix = (q, options, bonne, correction, opts) => Object.assign({ type: 'choix', q, options, bonne, correction, melanger: false, colonne: options.some(x => x.label.replace(/<[^>]+>/g, '').length > 24) }, opts);
  const nombre = (q, label, valeur, unite, correction, opts) => Object.assign({ type: 'nombre', q, label, valeur, unite, correction, signe: false }, opts);
  const scient = (q, label, valeur, unite, correction, opts) => Object.assign({ type: 'sci', q, label, valeur, unite, correction, cs: 3, rel: .01 }, opts);

  /* ---------- Exercice 18 p. 98 : le camion ---------- */
  const CAMION = { sens: 'droite', objet: 'camion', forces: ['P', 'R', 'f'] };
  const M18 = 33.0e3, V18 = 90.0 / 3.6, D18 = 60.0, EC18 = .5 * M18 * V18 * V18, F18 = EC18 / D18;
  const ex18 = {
    id: '18', groupe: 'p98', titre: 'Exercice 18 p. 98 : un camion freine', desc: 'Travail nul, énergie cinétique, force de freinage',
    contexte: `<p class="er-contexte">Un camion de <b>33,0 tonnes</b> roulant à <b>90,0 km·h<sup>−1</sup></b> freine en urgence. Il met <b>5,0 s</b> à s'immobiliser et parcourt <b>60,0 m</b>. On suppose que seule la force de freinage ${nomV('f')} travaille lors de ce déplacement.</p>`,
    parties: () => [
      partieDonnees(CAMION, { m: '33,0 t', vA: '90,0 km/h', vB: '0 m/s', d: '60,0 m' }, {
        q: 'Commence par le schéma : place les données de l\'énoncé (une étiquette est en trop).',
        intrus: [{ label: '5,0 s', indice: 'C\'est une <b>durée</b> : le théorème de l\'énergie cinétique n\'en a pas besoin.' }],
        correction: '<p>m = 33,0 t ; en A, v<sub>A</sub> = 90,0 km/h ; en B, le camion est immobilisé : v<sub>B</sub> = 0 ; AB = 60,0 m. La durée de 5,0 s ne sert pas.</p>' }),
      partieAngles(CAMION, { correction: '<p>Le poids et la réaction de la route sont verticaux, le déplacement horizontal : α = 90°. La force de freinage est opposée au mouvement : α = 180°.</p>' }),
      choix('a) Pourquoi le travail du poids est-il nul lors de ce déplacement ?', [o('ok', 'Le poids est perpendiculaire au déplacement'), o('neg', 'Le poids est négligeable devant la force de freinage'), o('arret', 'Le camion finit par s\'arrêter'), o('opp', 'Le poids est opposé au déplacement')], 'ok',
        `<p>Le travail est nul car le vecteur poids ${nomV('P')} est <b>perpendiculaire</b> à la trajectoire du camion (cos 90° = 0).</p>`,
        { indices: { neg: 'Le poids d\'un camion de 33 t n\'est pas négligeable : c\'est son <b>angle</b> avec le déplacement qui compte.', arret: 'L\'arrêt du camion ne rend pas nul le travail d\'une force : regarde l\'angle entre le poids et le déplacement.', opp: 'Le poids est vertical, le déplacement horizontal : ils ne sont pas opposés.' } }),
      choix('b) Pourquoi le travail de la réaction de la route sur le camion est-il nul ?', [o('ok', 'La réaction de la route est perpendiculaire au déplacement'), o('comp', 'Elle compense le poids'), o('route', 'La route ne se déplace pas')], 'ok',
        `<p>Le vecteur force de la réaction de la route ${nomV('R')} est perpendiculaire à la trajectoire du camion, donc ${W('R')} = 0.</p>`,
        { indices: { comp: 'Elle compense bien le poids, mais ce n\'est pas la raison : c\'est son angle avec le déplacement (90°) qui rend son travail nul.', route: 'C\'est le déplacement du <b>camion</b> qui compte, et l\'angle entre la force et ce déplacement.' } }),
      nombre('c) Pour calculer l\'énergie cinétique, convertis d\'abord la vitesse en m/s.', `${vA} =`, V18, 'm/s', calc(`${vA} = ${fr('90,0', '3,6')} = ${c('25,0 m/s')}`),
        { rel: .005, diag: v => (proche(v, 324) ? 'Des km/h aux m/s, on <b>divise</b> par 3,6.' : 'v = 90,0 / 3,6.') }),
      scient(`Calcule l'énergie cinétique ${EC_},<sub>A</sub> du camion au début du freinage.`, `${EC_},<sub>A</sub> =`, EC18, 'J',
        calc(`${EC_},<sub>A</sub> = ½ × m × v<sup>2</sup> = ½ × 33,0 × 10<sup>3</sup> kg × (25,0 m/s)<sup>2</sup> = ${c('1,03 × 10<sup>7</sup> J')}`),
        { diag: v => (proche(v, .5 * 33 * 625, .02) ? 'La masse doit être en kg : 33,0 t = 33,0 × 10<sup>3</sup> kg.' : proche(v, .5 * M18 * 8100, .02) ? 'Utilise la vitesse en m/s (25,0 m/s).' : proche(v, 2 * EC18, .02) ? 'N\'oublie pas le ½.' : 'E<sub>c</sub> = ½ m v², m en kg, v en m/s.') }),
      nombre(`d) Que vaut son énergie cinétique ${EC_},<sub>B</sub> à l'arrêt ?`, `${EC_},<sub>B</sub> =`, 0, 'J', '<p>À l\'arrêt, v<sub>B</sub> = 0 : son énergie cinétique est <b>nulle</b>, E<sub>c,B</sub> = 0 J.</p>',
        { tol: 1e-9, diag: () => 'À l\'arrêt, v = 0 : E<sub>c</sub> = ½ × m × 0².' }),
      scient(`e) La variation de l'énergie cinétique est égale à la somme des travaux des forces : détermine le travail de la force de freinage ${W('f')}.`, `${W('f')} =`, -EC18, 'J',
        calc(`Σ W<sub>AB</sub>(${nomV('F')}<sub>i</sub>) = ${W('f')} = ${EC_},<sub>B</sub> − ${EC_},<sub>A</sub> = 0 − 1,03 × 10<sup>7</sup> = ${c('−1,03 × 10<sup>7</sup> J')}`) + '<p>Le travail des autres forces (poids, réaction de la route) est nul.</p>',
        { diag: v => (proche(v, EC18, .02) ? 'ΔE<sub>c</sub> = E<sub>c,B</sub> − E<sub>c,A</sub> = 0 − 1,03 × 10<sup>7</sup> : le travail est <b>négatif</b>.' : 'W(f⃗) = E<sub>c,B</sub> − E<sub>c,A</sub>.') }),
      choix('f) Lors de ce déplacement, le travail de la force de freinage est :', [o('r', 'résistant'), o('m', 'moteur'), o('n', 'nul')], 'r',
        '<p>Le travail de la force de freinage est <b>résistant</b> : il s\'oppose au mouvement du camion (sa valeur est négative).</p>',
        { indices: { m: 'Le travail trouvé est négatif, et le camion ralentit.', n: 'Le travail trouvé n\'est pas nul : −1,03 × 10<sup>7</sup> J.' } }),
      scient('g) En déduire l\'intensité f de la force de freinage.', 'f =', F18, 'N',
        calc(`${W('f')} = f × AB × cos 180° = −f × AB = −1,03 × 10<sup>7</sup> J`) + calc(`donc f = ${fr('−' + W('f'), 'AB')} = ${fr('1,03 × 10<sup>7</sup> J', '60,0 m')} = ${c('1,72 × 10<sup>5</sup> N')}`),
        { diag: v => (proche(v, -F18, .02) ? 'L\'intensité d\'une force est positive : −1,03 × 10<sup>7</sup> = −f × 60,0.' : proche(v, EC18 * D18, .02) ? 'On <b>divise</b> par AB.' : proche(v, EC18 / 5, .02) ? 'On divise par la <b>distance</b> AB (60,0 m), pas par la durée.' : 'W(f⃗) = −f × AB.') }),
    ],
  };

  /* ---------- Exercice 19 p. 98 : la pierre de curling ---------- */
  const PIERRE = { sens: 'droite', objet: 'pierre', forces: ['P', 'N', 'f'], d: 'ℓ' };
  const M19 = 18.52, V19 = 2.8, L19 = 27.5, G19 = 9.8, EC19 = .5 * M19 * V19 * V19, MU = EC19 / (M19 * G19 * L19);
  const mgl = 'μ × m × g × ℓ';
  const Wp = k => `W(${nomV(k)})`;           // notation de la correction : W(f⃗)
  const ex19 = {
    id: '19', groupe: 'p98', titre: 'Exercice 19 p. 98 : une pierre de curling', desc: 'Bilan des forces, travail des frottements, coefficient de glissement',
    contexte: `<p class="er-contexte">Au curling, les joueurs sont sensibles au frottement entre la pierre en granite et la surface de jeu glacée. La pierre quitte la main du joueur avec une vitesse <b>v<sub>i</sub> = 2,8 m·s<sup>−1</sup></b> et s'immobilise dans la « maison », <b>ℓ = 27,5 m</b> plus loin. Le but est de déterminer le coefficient de glissement μ entre la pierre et la glace. Masse de la pierre : <b>m = 18,52 kg</b>.</p>
      <p class="ph-donnees">Donnée : intensité de la pesanteur g = 9,8 N·kg<sup>−1</sup>.</p>`,
    parties: () => [
      choix('a) Fais le bilan des forces qui s\'exercent sur la pierre de granite, pendant qu\'elle glisse.', [o('ok', `${nomV('P')}, ${nomV('N')} et ${nomV('f')} : le poids, la réaction de la glace et les frottements`), o('PN', `${nomV('P')} et ${nomV('N')} seulement`), o('main', `${nomV('P')}, ${nomV('N')}, ${nomV('f')} et la force de la main du joueur`), o('Pf', `${nomV('P')} et ${nomV('f')}`)], 'ok',
        `<p>Les forces qui s'exercent sur la pierre sont son poids ${nomV('P')}, la réaction de la glace ${nomV('N')} et les forces de frottement ${nomV('f')}.</p>`,
        { indices: { PN: 'L\'énoncé parle du frottement entre la pierre et la glace : il y a aussi une force de frottement.', main: 'La pierre a <b>quitté</b> la main du joueur : la main ne la touche plus.', Pf: 'La glace porte la pierre : il y a aussi la réaction de la glace.' } }),
      partieAngles(PIERRE, { q: 'b) Pour calculer le travail du poids et de la réaction de la glace, choisis l\'angle α de chaque force avec le déplacement.',
        correction: `<p>${nomV('P')} et ${nomV('N')} sont perpendiculaires au déplacement : leurs travaux sont <b>nuls</b>. Les frottements sont opposés au mouvement (α = 180°).</p>` }),
      choix('c) Quelle est la relation entre la force de frottement f, la réaction du support N et le coefficient de glissement μ ?', [o('ok', 'f = μ × N'), o('div', 'f = N / μ'), o('m', 'f = μ × m'), o('plus', 'f = μ + N')], 'ok',
        '<p class="ph-formule">f = μ × N</p><p>(relation donnée en marge de l\'exercice.)</p>',
        { indices: { div: 'μ est un coefficient sans unité : f est μ <b>fois</b> N.', m: 'f est une force : elle est proportionnelle à une autre force, N.', plus: 'On n\'additionne pas un coefficient sans unité et une force.' } }),
      choix(`d) En déduire l'expression du travail ${Wp('f')} des frottements en fonction de μ, m, g et ℓ.`, [o('ok', `${Wp('f')} = −${mgl}`), o('pos', `${Wp('f')} = ${mgl}`), o('sansmu', `${Wp('f')} = −m × g × ℓ`), o('sansl', `${Wp('f')} = −μ × m × g`)], 'ok',
        calc(`${Wp('f')} = f × ℓ × cos 180° = −f × ℓ = −μ × N × ℓ = ${c('−' + mgl)}`) + '<p>car N = P = m × g (la réaction de la glace compense le poids). Ce travail est <b>résistant</b>.</p>',
        { indices: { pos: 'Les frottements sont opposés au déplacement : cos 180° = −1.', sansmu: 'f = μ × N : il manque μ.', sansl: 'Un travail est une force multipliée par une <b>distance</b> : il manque ℓ.' } }),
      choix('Ce travail est :', [o('r', 'résistant'), o('m', 'moteur'), o('n', 'nul')], 'r', '<p>Il est négatif : travail <b>résistant</b>, la pierre ralentit.</p>',
        { indices: { m: 'Les frottements ralentissent la pierre.', n: 'Les frottements ne sont pas perpendiculaires au déplacement.' } }),
      nombre(`e) Calcule l'énergie cinétique ${EC_},<sub>i</sub> de la pierre quand elle quitte la main du joueur (2 chiffres significatifs).`, `${EC_},<sub>i</sub> =`, EC19, 'J',
        calc(`${EC_},<sub>i</sub> = ½ × m × v<sub>i</sub><sup>2</sup> = ½ × 18,52 kg × (2,8 m/s)<sup>2</sup> ≈ ${c('73 J')}`), { rel: .012, affiche: '73',
          diag: v => (proche(v, 2 * EC19, .02) ? 'N\'oublie pas le ½.' : proche(v, .5 * M19 * V19, .02) ? 'La vitesse est au carré.' : 'E<sub>c</sub> = ½ m v².') }),
      nombre(`Et ${EC_},<sub>f</sub>, quand elle s'immobilise dans la « maison » ?`, `${EC_},<sub>f</sub> =`, 0, 'J', '<p>E<sub>c,f</sub> = 0 J car la pierre est à l\'arrêt.</p>', { tol: 1e-9, diag: () => 'La pierre s\'immobilise : v = 0.' }),
      choix('f) Applique le théorème de l\'énergie cinétique à la pierre en granite.', [o('ok', `0 − ${EC_},<sub>i</sub> = −${mgl}`), o('inv', `${EC_},<sub>i</sub> − 0 = −${mgl}`), o('signe', `0 − ${EC_},<sub>i</sub> = ${mgl}`), o('P', `0 − ${EC_},<sub>i</sub> = m × g × ℓ − ${mgl}`)], 'ok',
        calc(`ΔE<sub>c</sub> = Σ W(${nomV('F')}<sub>i</sub>) d'où ${EC_},<sub>f</sub> − ${EC_},<sub>i</sub> = ${Wp('P')} + ${Wp('N')} + ${Wp('f')}`) + calc(`0 − ${EC_},<sub>i</sub> = 0 + 0 − ${mgl}`),
        { indices: { inv: 'ΔE<sub>c</sub> = E<sub>c,f</sub> − E<sub>c,i</sub> : l\'état final moins l\'état initial.', signe: 'Le travail des frottements est négatif.', P: 'Le poids est perpendiculaire au déplacement : son travail est nul.' } }),
      nombre('g) En déduire le coefficient de glissement μ (2 chiffres significatifs).', 'μ =', .0148, '',
        calc(`μ = ${fr(EC_ + ',<sub>i</sub>', 'm × g × ℓ')} = ${fr('72,6', '18,52 × 9,8 × 27,5')} ≈ 0,0145 ≈ ${c('0,015')}`) + '<p>μ est sans unité. Garde tous les chiffres jusqu\'au bout, puis arrondis : 0,0145… donne 0,015.</p>',
        { tol: .0003, affiche: '0,015',
          diag: v => (proche(v, .014, .01) ? '0,0145… s\'arrondit à <b>0,015</b> avec 2 chiffres significatifs (et non 0,014).' : proche(v, 1 / MU, .03) ? 'Rapport inversé : μ = E<sub>c,i</sub> / (m × g × ℓ).' : proche(v, EC19 / (M19 * L19), .03) ? 'N\'oublie pas g au dénominateur.' : 'μ = E<sub>c,i</sub> / (m × g × ℓ).') }),
    ],
  };

  window.EC.EXERCICES = [ex18, ex19];
  window.EC.GROUPES_EX = [{ id: 'p98', titre: 'Exercices supplémentaires (p. 98)' }];
})();
