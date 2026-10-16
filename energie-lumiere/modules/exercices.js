/* ============================================================
   Exercices du module 5 (application « Chapitre 10 : Énergie
   transportée par la lumière ») : les exercices de la feuille, dans
   l'ordre de la correction et avec leur numérotation : 7 et 8 p. 129
   (énergie d'un photon), 14 p. 131 (panneau solaire de piscine),
   10 p. 130 (schéma d'un chauffe-eau solaire), 15 p. 131 (toiture
   photovoltaïque, module TE2200).
   Donnée de la feuille : h = 6,63 × 10⁻³⁴ J·s.

   Chaque exercice : { id, groupe, titre, desc, contexte (HTML),
   parties: [p] ou une fonction qui les fabrique } ; chaque partie suit
   le format de EL.PARTIES avec p.q (question) et p.correction
   (correction détaillée : formule, grandeur isolée, application
   numérique avec les unités).

   Valeurs vérifiées par un script :
     ex. 7 : 6,63 × 10⁻³⁴ × 2,5 × 10⁵ ≈ 1,7 × 10⁻²⁸ J ; × 375 × 10⁹ ≈ 2,49 × 10⁻²² J ;
       × 2,5 × 10¹⁶ ≈ 1,7 × 10⁻¹⁷ J ; 5,0 × 10⁻¹⁵ / h ≈ 7,5 × 10¹⁸ Hz ;
       45 × 10⁻²⁰ / h ≈ 6,8 × 10¹⁴ Hz ; 0,25 × 10⁻²³ / h ≈ 3,8 × 10⁹ Hz ;
     ex. 8 : h c / λ ≈ 5,7 × 10⁻²⁶ J (3,5 m) ; 4,0 × 10⁻²¹ J (50 µm) ; 3,98 × 10⁻¹⁹ J (500 nm) ;
       5,0 × 10⁻¹⁸ J (40 nm) ; 4 × 10⁻¹⁶ J (0,5 nm) ; 4,0 × 10⁻¹³ J (5,0 × 10⁻⁴ nm) ;
       λ = h c / E ≈ 4,0 × 10⁻¹¹ m (X) ; 4,4 × 10⁻¹⁰ m (X) ; 0,080 m (hertzien) ;
     ex. 14 : 500 × 3,40 × 7 200 ≈ 1,22 × 10⁷ J ; 1 × 2 = 2 m³ ;
       1,22 × 10⁷ / (2 000 × 4 180) ≈ 1,46 K ;
     ex. 15 : 29,7 × 7,5 ≈ 2,2 × 10² W ; × 342 ≈ 76 kW ; (0,156)² ≈ 2,43 × 10⁻² m² ;
       × 60 × 342 ≈ 5,0 × 10² m² ; 1 000 × 5,0 × 10² ≈ 500 kW ; 76 / 500 ≈ 15 %.
   Écarts avec la correction :
     ex. 14 c) la correction utilise c = 4 185 J·kg⁻¹·K⁻¹ ; la feuille donne
       4,18 kJ·kg⁻¹·K⁻¹ : on prend 4 180 (≈ 1,46 K dans les deux cas) ;
     ex. 15 d) la correction écrit 2,40 × 10⁻² m² pour une cellule ;
       (0,156)² = 2,43 × 10⁻² m² (valeur retenue ; le total reste ≈ 5,0 × 10² m²).
   ============================================================ */
(function () {
  'use strict';

  const { o, fr, fmt, sci, proche, H, C, optionsDomaine, partieChaine, partiePanneau, carac, dessin } = window.EL;
  const calc = h => `<p class="ph-calc">${h}</p>`;
  const c = h => `<span class="c">${h}</span>`;
  const pr = (a, b) => proche(a, b, .02);
  const HV = '6,63 × 10<sup>−34</sup>', CV = '3,00 × 10<sup>8</sup>';
  // fabriques de parties
  const choix = (q, options, bonne, correction, opts) => Object.assign({ type: 'choix', q, options, bonne, correction, melanger: false, colonne: options.some(x => x.label.replace(/<[^>]+>/g, '').length > 24) }, opts);
  const nombre = (q, label, valeur, unite, correction, opts) => Object.assign({ type: 'nombre', q, label, valeur, unite, correction, signe: false }, opts);
  const scient = (q, label, valeur, unite, correction, opts) => Object.assign({ type: 'sci', q, label, valeur, unite, correction, cs: 2, rel: .02 }, opts);
  const donneeH = `<p class="ph-donnees">Donnée : constante de Planck h = ${HV} J·s.</p>`;

  /* ---------- Exercice 7 p. 129 : E = h × f ---------- */
  // diagnostics de E = h × f et f = E / h
  const diagE = (f, txtF) => v => (pr(v, f) ? 'Multiplie par la constante de Planck h.' : pr(v, H / f) || pr(v, f / H) ? 'E = h × f : on multiplie.' : `E = ${HV} × ${txtF}.`);
  const diagF = (E, txtE) => v => (pr(v, E * H) ? 'De E = h × f, on tire f = E / h : on <b>divise</b>.' : pr(v, H / E) ? 'C\'est f = E / h (pas h / E).' : `f = ${txtE} / ${HV}.`);
  const ex7 = {
    id: '7', groupe: 'photon', titre: 'Exercice 7 p. 129 : énergie et fréquence', desc: 'E = h × f et f = E / h, avec des préfixes',
    contexte: `<p class="er-contexte">1. Calculer l'énergie E en joules du photon associé à l'onde de fréquence :</p>
      <ul class="er-liste"><li>a) f = 2,5 × 10<sup>5</sup> Hz ;</li><li>b) f = 375 GHz ;</li><li>c) f = 2,5 × 10<sup>4</sup> THz.</li></ul>
      <p class="er-contexte">2. Compléter : « Plus la fréquence de l'onde électromagnétique est grande, plus l'énergie du photon associé est … ».</p>
      <p class="er-contexte">3. Calculer la fréquence f en hertz avec :</p>
      <ul class="er-liste"><li>a) E = 5,0 × 10<sup>−15</sup> J ;</li><li>b) E = 45 × 10<sup>−20</sup> J ;</li><li>c) E = 0,25 × 10<sup>−23</sup> J.</li></ul>
      <p class="er-contexte">4. Compléter : « Plus l'énergie de l'onde électromagnétique est petite, plus la fréquence est … ».</p>${donneeH}`,
    parties: [
      scient('1. a) f = 2,5 × 10<sup>5</sup> Hz.', 'E =', H * 2.5e5, 'J',
        calc(`E = h × f = ${HV} × 2,5 × 10<sup>5</sup> = ${c('1,7 × 10<sup>−28</sup> J')}`), { diag: diagE(2.5e5, '2,5 × 10<sup>5</sup>') }),
      scient('b) f = 375 GHz.', 'E =', H * 375e9, 'J',
        calc('f = 375 GHz = 375 × 10<sup>9</sup> Hz') + calc(`E = h × f = ${HV} × 375 × 10<sup>9</sup> = ${c('2,49 × 10<sup>−22</sup> J')}`),
        { cs: 3, rel: .01, diag: v => (pr(v, H * 375) ? 'Convertis la fréquence en Hz : 1 GHz = 10<sup>9</sup> Hz.' : pr(v, H * 375e6) ? '1 GHz = 10<sup>9</sup> Hz (giga, pas méga).' : diagE(375e9, '375 × 10<sup>9</sup>')(v)) }),
      scient('c) f = 2,5 × 10<sup>4</sup> THz.', 'E =', H * 2.5e16, 'J',
        calc('f = 2,5 × 10<sup>4</sup> THz = 2,5 × 10<sup>4</sup> × 10<sup>12</sup> Hz = 2,5 × 10<sup>16</sup> Hz') + calc(`E = h × f = ${HV} × 2,5 × 10<sup>16</sup> = ${c('1,7 × 10<sup>−17</sup> J')}`),
        { diag: v => (pr(v, H * 2.5e4) ? 'Convertis la fréquence en Hz : 1 THz = 10<sup>12</sup> Hz.' : pr(v, H * 2.5e13) ? '1 THz = 10<sup>12</sup> Hz (téra, pas giga).' : diagE(2.5e16, '2,5 × 10<sup>16</sup>')(v)) }),
      choix('2. « Plus la fréquence de l\'onde électromagnétique est grande, plus l\'énergie du photon associé est … »', [o('grande', 'grande'), o('petite', 'petite')], 'grande',
        '<p>E = h × f : E est proportionnelle à f. Plus la fréquence est grande, plus l\'énergie du photon est <b>grande</b>.</p>',
        { indices: { petite: 'Compare tes résultats de la question 1 : la plus grande fréquence (c) donne la plus grande énergie.' } }),
      scient('3. a) E = 5,0 × 10<sup>−15</sup> J.', 'f =', 5e-15 / H, 'Hz',
        calc(`f = ${fr('E', 'h')} = ${fr('5,0 × 10<sup>−15</sup>', HV)} = ${c('7,5 × 10<sup>18</sup> Hz')}`), { diag: diagF(5e-15, '5,0 × 10<sup>−15</sup>') }),
      scient('b) E = 45 × 10<sup>−20</sup> J.', 'f =', 45e-20 / H, 'Hz',
        calc(`f = ${fr('E', 'h')} = ${fr('45 × 10<sup>−20</sup>', HV)} = ${c('6,8 × 10<sup>14</sup> Hz')}`), { diag: diagF(45e-20, '45 × 10<sup>−20</sup>') }),
      scient('c) E = 0,25 × 10<sup>−23</sup> J.', 'f =', 0.25e-23 / H, 'Hz',
        calc(`f = ${fr('E', 'h')} = ${fr('0,25 × 10<sup>−23</sup>', HV)} = ${c('3,8 × 10<sup>9</sup> Hz')}`), { diag: diagF(0.25e-23, '0,25 × 10<sup>−23</sup>') }),
      choix('4. « Plus l\'énergie de l\'onde électromagnétique est petite, plus la fréquence est … »', [o('grande', 'grande'), o('petite', 'petite')], 'petite',
        '<p>f = E / h : plus l\'énergie est petite, plus la fréquence est <b>petite</b>.</p>',
        { indices: { grande: 'Compare tes résultats de la question 3 : la plus petite énergie (c) donne la plus petite fréquence.' } }),
    ],
  };

  /* ---------- Exercice 8 p. 129 : E = h c / λ ---------- */
  const diagEl = (lam, txtL, conv) => v => (conv && pr(v, H * C / conv) ? 'Convertis la longueur d\'onde en mètres.' : pr(v, C / lam) ? 'Ça, c\'est la fréquence : multiplie-la par h.' : pr(v, lam / (H * C)) || pr(v, H * lam / C) ? 'E = h × c / λ : λ est au dénominateur.' : `E = ${HV} × ${CV} / ${txtL}.`);
  const lignesE = [
    ['a', 'λ = 3,5 m (onde hertzienne)', 3.5, '3,5', null, '5,7 × 10<sup>−26</sup> J', 2],
    ['b', 'λ = 50 µm (IR)', 50e-6, '50 × 10<sup>−6</sup>', 50, '4,0 × 10<sup>−21</sup> J', 2],
    ['c', 'λ = 500 nm (visible)', 500e-9, '500 × 10<sup>−9</sup>', 500, '3,98 × 10<sup>−19</sup> J', 3],
    ['d', 'λ = 40 nm (UV)', 40e-9, '40 × 10<sup>−9</sup>', 40, '5,0 × 10<sup>−18</sup> J', 2],
    ['e', 'λ = 0,5 nm (rayon X)', 0.5e-9, '0,5 × 10<sup>−9</sup>', 0.5, '4 × 10<sup>−16</sup> J', 1],
    ['f', 'λ = 5,0 × 10<sup>−4</sup> nm (rayon γ)', 5e-13, '5,0 × 10<sup>−13</sup>', 5e-4, '4,0 × 10<sup>−13</sup> J', 2],
  ];
  const ex8 = {
    id: '8', groupe: 'photon', titre: 'Exercice 8 p. 129 : énergie et longueur d\'onde', desc: 'E = h × c / λ, puis λ et le domaine',
    contexte: `<p class="er-contexte">1. Calculer l'énergie E en joules du photon associé à l'onde de longueur d'onde λ :</p>
      <ul class="er-liste">${lignesE.map(l => `<li>${l[0]}) ${l[1]} ;</li>`).join('')}</ul>
      <p class="er-contexte">2. Compléter : « Plus la longueur d'onde est petite, plus l'énergie du photon associé est … ».</p>
      <p class="er-contexte">3. Calculer la longueur d'onde λ en m, puis préciser le domaine d'onde électromagnétique à laquelle elle appartient, pour :</p>
      <ul class="er-liste"><li>a) E = 5,0 × 10<sup>−15</sup> J ;</li><li>b) E = 45 × 10<sup>−17</sup> J ;</li><li>c) E = 0,25 × 10<sup>−23</sup> J.</li></ul>
      <p class="er-contexte">4. Compléter : « Plus l'énergie de l'onde électromagnétique est petite, plus la longueur d'onde est … ».</p>
      <p class="ph-donnees">Données : h = ${HV} J·s ; c = ${CV} m·s<sup>−1</sup>.</p>`,
    parties: [
      ...lignesE.map(([n, txt, lam, txtL, conv, res, cs], k) => scient(`${k ? '' : '1. '}${n}) ${txt}.`, 'E =', H * C / lam, 'J',
        (conv != null ? calc(`λ = ${txt.replace(/^λ = /, '').replace(/ \(.*\)$/, '')} = ${txtL} m`) : '') + calc(`E = ${fr('h × c', 'λ')} = ${fr(HV + ' × ' + CV, txtL)} = ${c(res)}`),
        { cs, rel: cs === 3 ? .01 : .03, diag: diagEl(lam, txtL, conv == null ? null : conv) })),
      choix('2. « Plus la longueur d\'onde est petite, plus l\'énergie du photon associé est … »', [o('grande', 'grande'), o('petite', 'petite')], 'grande',
        '<p>E = h × c / λ : λ est au dénominateur. Plus λ est petite, plus l\'énergie est <b>grande</b>.</p>',
        { indices: { petite: 'Compare tes résultats : le rayon γ (la plus petite λ) a la plus grande énergie.' } }),
      scient('3. a) E = 5,0 × 10<sup>−15</sup> J : calcule λ.', 'λ =', H * C / 5e-15, 'm',
        calc(`λ = ${fr('h × c', 'E')} = ${fr(HV + ' × ' + CV, '5,0 × 10<sup>−15</sup>')} = ${c('4,0 × 10<sup>−11</sup> m')}`),
        { diag: v => (pr(v, 5e-15 / (H * C)) ? 'De E = h × c / λ, on tire λ = h × c / E.' : pr(v, 5e-15 / H) ? 'Ça, c\'est la fréquence ; λ = c / f = h × c / E.' : `λ = ${HV} × ${CV} / 5,0 × 10<sup>−15</sup>.`) }),
      scient('b) E = 45 × 10<sup>−17</sup> J : calcule λ.', 'λ =', H * C / 45e-17, 'm',
        calc(`λ = ${fr(HV + ' × ' + CV, '45 × 10<sup>−17</sup>')} = ${c('4,4 × 10<sup>−10</sup> m')}`),
        { diag: v => (pr(v, 45e-17 / (H * C)) ? 'λ = h × c / E.' : `λ = ${HV} × ${CV} / 45 × 10<sup>−17</sup>.`) }),
      nombre('c) E = 0,25 × 10<sup>−23</sup> J : calcule λ.', 'λ =', H * C / 0.25e-23, 'm',
        calc(`λ = ${fr(HV + ' × ' + CV, '0,25 × 10<sup>−23</sup>')} = ${c('0,080 m')}`),
        { rel: .02, affiche: '0,080', diag: v => (pr(v, 0.25e-23 / (H * C)) ? 'λ = h × c / E.' : `λ = ${HV} × ${CV} / 0,25 × 10<sup>−23</sup>.`) }),
      { type: 'grille', q: 'Précise le domaine de chacune de ces trois ondes.', options: optionsDomaine(),
        lignes: [
          { id: 'a', label: 'a) λ = 4,0 × 10<sup>−11</sup> m', bonne: 'X', indice: 'a) Entre 10<sup>−11</sup> m et 10<sup>−8</sup> m : rayons X.' },
          { id: 'b', label: 'b) λ = 4,4 × 10<sup>−10</sup> m', bonne: 'X', indice: 'b) Entre 10<sup>−11</sup> m et 10<sup>−8</sup> m : rayons X.' },
          { id: 'c', label: 'c) λ = 0,080 m', bonne: 'hertz', indice: 'c) 8 cm, plus de 1 mm : ondes hertziennes.' },
        ],
        correction: '<p>a) 4,0 × 10<sup>−11</sup> m : <b>rayons X</b> ; b) 4,4 × 10<sup>−10</sup> m : <b>rayons X</b> ; c) 0,080 m : <b>ondes hertziennes</b>.</p>' },
      choix('4. « Plus l\'énergie de l\'onde électromagnétique est petite, plus la longueur d\'onde est … »', [o('grande', 'grande'), o('petite', 'petite')], 'grande',
        '<p>λ = h × c / E : plus l\'énergie est petite, plus la longueur d\'onde est <b>grande</b>.</p>',
        { indices: { petite: 'Compare tes résultats de la question 3 : la plus petite énergie (c) donne la plus grande longueur d\'onde.' } }),
    ],
  };

  /* ---------- Exercice 14 p. 131 : panneau solaire de piscine ---------- */
  const Q14 = 500 * 3.40 * 7200, DT14 = Q14 / (2000 * 4180);
  const ex14 = {
    id: '14', groupe: 'capteurs', titre: 'Exercice 14 p. 131 : un panneau solaire de piscine', desc: 'Énergie reçue, volume d\'eau, élévation de température',
    contexte: `<p class="er-contexte">Voici les caractéristiques d'un panneau solaire de piscine.</p>
      <div class="cle"><p>6 capteurs solaires Heliocol de 3,40 m² chacun – Noir<br>Dimensions d'un panneau : 2,908 m × 1,172 m<br>Surface : 3,408 m²<br>Volume d'eau par capteur : 11,4 L<br>Débit d'eau recommandé dans les capteurs : 1 m³/h par capteur</p></div>
      <p class="er-contexte">a) Déterminer l'énergie de rayonnement solaire transférée à 3,40 m² d'un capteur solaire durant 2 h par journée ombragée, quand le rayonnement solaire vaut 500 W·m<sup>−2</sup>.</p>
      <p class="er-contexte">b) Quel est le volume d'eau circulant dans un capteur durant cette période ?</p>
      <p class="er-contexte">c) Déterminer l'élévation de température de l'eau entre l'entrée et la sortie d'un capteur durant cette période. Commenter. Ce panneau solaire réalise-t-il une conversion photovoltaïque ou photothermique ?</p>
      <p class="ph-donnees">Donnée : capacité thermique massique de l'eau c<sub>eau</sub> = 4,18 kJ·kg<sup>−1</sup>·K<sup>−1</sup>.</p>`,
    parties: [
      scient('a) Énergie solaire reçue par un capteur en 2 h.', 'Q =', Q14, 'J',
        calc('Δt = 2 h = 2 × 3 600 s = 7 200 s') + calc(`Q = irradiance × S × Δt = 500 × 3,40 × (2 × 3 600) = ${c('1,22 × 10<sup>7</sup> J')}`),
        { cs: 3, rel: .01, diag: v => (pr(v, 500 * 3.4 * 2) ? 'Pour des joules, la durée doit être en <b>secondes</b> : 2 h = 7 200 s.' : pr(v, 500 * 3.4) ? 'C\'est la puissance reçue (en W) : multiplie par la durée en s.' : pr(v, 500 * 3.4 * 120) ? '1 h = 3 600 s.' : 'Q = 500 × 3,40 × 7 200.') }),
      nombre('b) Volume d\'eau qui circule dans un capteur pendant ces 2 h.', 'V =', 2, 'm³',
        calc(`V = D × Δt = 1 m³/h × 2 h = ${c('2 m³')}`),
        { tol: .01, diag: v => (pr(v, 11.4) || pr(v, 0.0114) ? 'Le volume d\'eau <b>contenu</b> dans le capteur n\'est pas celui qui y <b>circule</b> : utilise le débit.' : pr(v, .5) ? 'V = D × Δt : on multiplie.' : 'V = D × Δt = 1 × 2.') }),
      nombre('c) Quelle est la masse de cette eau ?', 'm =', 2000, 'kg',
        calc(`2 m³ d'eau : ${c('m = 2 000 kg')}`), { tol: .5, diag: v => (pr(v, 2) ? '1 m³ d\'eau a une masse de 1 000 kg.' : 'm = 2 × 1 000.') }),
      nombre('Calcule l\'élévation de température de l\'eau (2 décimales).', 'Δθ =', DT14, 'K',
        calc('c<sub>eau</sub> = 4,18 kJ·kg<sup>−1</sup>·K<sup>−1</sup> = 4 180 J·kg<sup>−1</sup>·K<sup>−1</sup>') + calc(`Q = m × c × Δθ, donc Δθ = ${fr('Q', 'm × c')} = ${fr('1,22 × 10<sup>7</sup>', '2 000 × 4 180')} ≈ ${c('1,46 K')}`) + '<p>soit une élévation de température de 1,46 °C.</p>',
        { tol: .02, dec: 2, diag: v => (pr(v, Q14 / (2000 * 4.18)) ? 'Convertis c en J : 4,18 kJ = 4 180 J.' : pr(v, Q14 / (2 * 4180)) ? 'La masse doit être en kg : 2 m³ = 2 000 kg.' : pr(v, Q14 * 2000 / 4180) ? 'Δθ = Q / (m × c) : on divise par le produit.' : 'Δθ = 1,22 × 10<sup>7</sup> / (2 000 × 4 180).') }),
      choix('Comment commenter cette valeur ?', [o('ok', 'Elle est faible : d\'où la nécessité de placer 6 capteurs en série'), o('forte', 'Elle est très grande : l\'eau risque de bouillir'), o('nulle', 'Elle est nulle : le capteur ne chauffe pas l\'eau')], 'ok',
        '<p>1,46 °C, c\'est faible : l\'eau traverse <b>6 capteurs en série</b> pour se réchauffer davantage.</p>',
        { indices: { forte: '1,46 °C de plus, c\'est très peu.', nulle: 'La température monte de 1,46 °C : c\'est faible, mais pas nul.' } }),
      choix('Ce panneau solaire réalise-t-il une conversion photovoltaïque ou photothermique ?', [o('th', 'photothermique'), o('pv', 'photovoltaïque')], 'th',
        '<p>Il convertit l\'énergie lumineuse en énergie thermique (l\'eau chauffe) : conversion <b>photothermique</b>.</p>',
        { indices: { pv: 'Le panneau chauffe l\'eau de la piscine : il ne produit pas d\'électricité.' } }),
    ],
  };

  /* ---------- Exercice 10 p. 130 : chauffe-eau solaire ---------- */
  const ex10 = {
    id: '10', groupe: 'capteurs', titre: 'Exercice 10 p. 130 : un chauffe-eau solaire', desc: 'Schéma énergétique à compléter',
    contexte: `<p class="er-contexte">Dans un panneau solaire thermique, un fluide dit « caloporteur » se réchauffe lorsqu'il reçoit de l'énergie lumineuse et restitue cette énergie à l'eau d'un ballon.</p>${dessin('capteurs')}
      <p class="er-contexte">Recopier et compléter le schéma énergétique.</p>`,
    parties: () => [partieChaine({ q: 'Complète le schéma : fais glisser les étiquettes dans les cases.', titrePalette: 'Étiquettes',
      convOptions: [o('cesol', 'chauffe-eau solaire thermique'), o('pv', 'panneau photovoltaïque')], convBonne: 'cesol',
      entree: 'solaire', sorties: ['thermique'], pertes: 'thermique', intrus: ['electrique'],
      noms: { entree: 'Énergie reçue', sortie: 'Énergie utile', pertes: 'Énergie cédée à l\'environnement' },
      indices: { electrique: 'Un chauffe-eau solaire ne produit pas d\'électricité.', pv: 'Le panneau chauffe un fluide : ce n\'est pas un panneau photovoltaïque.', solaire: 'Le chauffe-eau reçoit l\'énergie solaire (lumineuse) ; il fournit de l\'énergie thermique.' },
      solution: '<p>Énergie reçue : <b>solaire</b> ; convertisseur : <b>chauffe-eau solaire thermique</b> ; énergie utile : <b>thermique</b> ; énergie cédée à l\'environnement : <b>thermique</b>.</p>' })],
  };

  /* ---------- Exercice 15 p. 131 : toiture photovoltaïque ---------- */
  const P15 = 29.7 * 7.5, PT = 342 * P15, SC = 0.156 * 0.156, ST = 342 * 60 * SC, PL = 1000 * ST;
  const ex15 = {
    id: '15', groupe: 'capteurs', titre: 'Exercice 15 p. 131 : une toiture photovoltaïque', desc: 'Point de fonctionnement, puissance, surface, rendement',
    contexte: `<p class="er-contexte">Une toiture est recouverte de 342 modules photovoltaïques, composés chacun de 60 cellules dont les caractéristiques sont décrites dans les documents ci-dessous.</p>
      <p class="er-petit">Mesures dans les conditions standards de qualification des panneaux solaires : spectre AM1,5 (puissance incidente de 1 000 W·m<sup>−2</sup>, température de 25 °C).</p>
      <div class="el-defile"><table class="el-tab"><tr><th>Tension aux bornes du module à puissance maximale V<sub>pm</sub> (V)</th><td>29,7</td></tr><tr><th>Intensité à puissance maximale I<sub>pm</sub> (A)</th><td>7,5</td></tr></table></div>
      <p class="er-petit" style="margin-bottom:10px">Doc. 1 : caractéristiques d'un module utilisé.</p>
      <div class="el-defile"><table class="el-tab"><tr><th>Taille d'une cellule</th><td>156 mm × 156 mm</td></tr><tr><th>Nombre de cellules</th><td>60 cellules</td></tr><tr><th>Type de semi-conducteur</th><td>polycristallin</td></tr></table></div>
      <p class="er-petit" style="margin-bottom:10px">Doc. 2 : cellules d'un module photovoltaïque.</p>
      <ul class="er-liste"><li>a) Établir la chaîne énergétique d'une cellule photovoltaïque.</li><li>b) Placer, sur le graphique, le point où la puissance délivrée par le module TE2200 est maximale.</li>
        <li>c) Calculer la puissance électrique maximale délivrée par l'ensemble des modules.</li><li>d) Déterminer la surface S de l'ensemble des modules de la toiture.</li>
        <li>e) Montrer que le maximum de la puissance lumineuse totale reçue par la toiture est proche de 500 kW.</li><li>f) Après avoir rappelé la définition du rendement, calculer sa valeur maximale.</li></ul>
      <p class="ph-donnees">Donnée : la puissance lumineuse P<sub>lum</sub> reçue sur une surface S, exprimée en m², est donnée par la relation P<sub>lum</sub> = E × S, où E est l'éclairement du module, exprimé en W·m<sup>−2</sup>.</p>`,
    parties: () => [
      partieChaine({ q: 'a) Établis la chaîne énergétique d\'une cellule photovoltaïque.', conv: 'panneau solaire photovoltaïque',
        entree: 'solaire', sorties: ['electrique'], pertes: 'thermique', intrus: ['chimique', 'mecanique'],
        noms: { entree: 'Énergie absorbée', sortie: 'Énergie produite', pertes: 'Énergie perdue' },
        indices: { chimique: 'Pas d\'énergie chimique dans une cellule photovoltaïque.', mecanique: 'Rien ne bouge : pas d\'énergie mécanique.', electrique: 'La cellule produit de l\'énergie électrique à partir de l\'énergie solaire.', thermique: 'L\'énergie perdue est thermique : la cellule chauffe.' },
        solution: '<p>Énergie absorbée : <b>solaire</b> ; énergie produite : <b>électrique</b> ; énergie perdue : <b>thermique</b>.</p>' }),
      partiePanneau({ def: carac('te2200'), depart: 12, mini: false, tolU: 1.5,
        q: 'b) Voici la caractéristique I(U) du module TE2200 (éclairement 1,00 kW·m<sup>−2</sup> à 25 °C). Fais glisser le point jusqu\'au point où la puissance est maximale : le rectangle a pour aire P = U × I.',
        solution: '<p>Le point de puissance maximale est au coude de la courbe : <b>U ≈ 29,7 V</b> et <b>I ≈ 7,5 A</b> (valeurs du doc. 1).</p>' }),
      scient('c) Calcule d\'abord la puissance maximale d\'un module.', 'P =', P15, 'W',
        calc(`P = V<sub>pm</sub> × I<sub>pm</sub> = 29,7 × 7,5 = ${c('2,2 × 10<sup>2</sup> W')}`),
        { rel: .03, diag: v => (pr(v, 29.7 / 7.5) || pr(v, 7.5 / 29.7) ? 'P = U × I : on multiplie.' : 'P = 29,7 × 7,5.') }),
      nombre('Puis la puissance électrique maximale de l\'ensemble des 342 modules, en kW.', 'P<sub>T</sub> =', PT / 1000, 'kW',
        calc(`P<sub>T</sub> = 342 × P = 342 × 2,2 × 10<sup>2</sup> ≈ 7,6 × 10<sup>4</sup> W = ${c('76 kW')}`),
        { rel: .02, affiche: '76', diag: v => (pr(v, PT) ? 'Ton résultat est en W : 1 kW = 1 000 W.' : pr(v, PT * 60 / 1000) ? 'La puissance d\'un <b>module</b> (pas d\'une cellule) est 2,2 × 10<sup>2</sup> W : multiplie seulement par 342.' : pr(v, P15 / 1000) ? 'Multiplie par le nombre de modules : 342.' : 'P<sub>T</sub> = 342 × 2,2 × 10<sup>2</sup> W, puis en kW.') }),
      scient('d) Calcule la surface d\'une cellule, en m² (3 chiffres significatifs).', 'S =', SC, 'm²',
        calc(`S = (156 × 10<sup>−3</sup> m)² = ${c('2,43 × 10<sup>−2</sup> m²')}`),
        { cs: 3, rel: .01, diag: v => (pr(v, 156 * 156) ? 'Convertis le côté en mètres : 156 mm = 156 × 10<sup>−3</sup> m.' : pr(v, 0.156) ? 'La surface d\'un carré est côté × côté.' : pr(v, 156 * 156 * 1e-3) ? '(156 × 10<sup>−3</sup>)² = 156² × 10<sup>−6</sup>.' : 'S = 0,156 × 0,156.') }),
      scient('Puis la surface S<sub>T</sub> de l\'ensemble des modules.', 'S<sub>T</sub> =', ST, 'm²',
        calc(`S<sub>T</sub> = 342 × 60 × 2,43 × 10<sup>−2</sup> ≈ ${c('5,0 × 10<sup>2</sup> m²')}`),
        { diag: v => (pr(v, 342 * SC) ? 'Chaque module a <b>60</b> cellules : multiplie aussi par 60.' : pr(v, 60 * SC) ? 'C\'est la surface d\'<b>un</b> module : multiplie par 342.' : 'S<sub>T</sub> = 342 × 60 × 2,43 × 10<sup>−2</sup>.') }),
      nombre('e) Calcule la puissance lumineuse totale reçue par la toiture, en kW.', 'P<sub>lum</sub> =', PL / 1000, 'kW',
        calc(`P<sub>lum</sub> = E × S<sub>T</sub> = (1 000 W·m<sup>−2</sup>) × (5,0 × 10<sup>2</sup> m²) = 5,0 × 10<sup>5</sup> W = ${c('5,0 × 10<sup>2</sup> kW')}`) + '<p>soit environ 500 kW.</p>',
        { rel: .02, affiche: '500', diag: v => (pr(v, PL) ? 'Ton résultat est en W : divise par 1 000 pour l\'avoir en kW.' : pr(v, 1000 / ST) ? 'P<sub>lum</sub> = E × S : on multiplie.' : 'P<sub>lum</sub> = 1 000 × 5,0 × 10<sup>2</sup> W, puis en kW.') }),
      choix('f) Quelle est la définition du rendement de la toiture ?', [o('ok', 'η = P<sub>T</sub> / P<sub>lum</sub> (puissance électrique fournie / puissance lumineuse reçue)'), o('inv', 'η = P<sub>lum</sub> / P<sub>T</sub>'), o('diff', 'η = P<sub>lum</sub> − P<sub>T</sub>')], 'ok',
        `<p>η = ${fr('P<sub>T</sub>', 'P<sub>lum</sub>')} : puissance utile (électrique) divisée par la puissance absorbée (lumineuse).</p>`,
        { indices: { inv: 'Le rendement est plus petit que 1 : puissance utile divisée par puissance reçue.', diff: 'P<sub>lum</sub> − P<sub>T</sub>, c\'est la puissance perdue, pas le rendement.' } }),
      nombre('Calcule le rendement maximal, en pourcentage.', 'η =', 76 / 500 * 100, '%',
        calc(`η = ${fr('P<sub>T</sub>', 'P<sub>lum</sub>')} = ${fr('76', '500')} = 0,15 = ${c('15 %')}`),
        { tol: .6, affiche: '15', diag: v => (pr(v, 500 / 76 * 100) || pr(v, 500 / 76) ? 'η = P<sub>T</sub> / P<sub>lum</sub> (plus petit que 1).' : pr(v, .152) ? 'Multiplie par 100 pour l\'avoir en %.' : 'η = 76 / 500, puis × 100.') }),
    ],
  };

  window.EL.EXERCICES = [ex7, ex8, ex14, ex10, ex15];
  window.EL.GROUPES_EX = [
    { id: 'photon', titre: 'Énergie d\'un photon' },
    { id: 'capteurs', titre: 'Capteurs et panneaux solaires' },
  ];
})();
