/* ============================================================
   Exercices du module 5 (application « Chapitre 6 : Principe
   fondamental de la dynamique ») : ceux de la feuille, dans le même
   ordre et avec la même numérotation : 1, 2, 3 (hors manuel), puis
   7 p. 85, 9 p. 85, 10 p. 86, 11 p. 86, 5 p. 84, 13 p. 86, 14 p. 86
   et 19 p. 87.

   Chaque exercice : { id, groupe, titre, desc, contexte (HTML),
   parties: [p] ou une fonction qui les fabrique (ex. 2 : le bilan des forces garde son état) } ; chaque partie suit le format de PFD.PARTIES avec
   p.q (question) et p.correction (correction détaillée : formule,
   grandeur isolée, application numérique avec les unités).
   Le bilan des forces de l'ex. 2 utilise l'outil PFD.bilan ; les
   résultantes de l'ex. 9 b) se tracent dans le quadrillage
   (cinematique/modules/vecteurs.js).

   Valeurs vérifiées par un script. Écarts avec les corrections :
     ex. 3 : l'énoncé dit « sur la voiture » : on écrit « sur l'avion » ;
     ex. 5 : le corrigé du manuel calcule avec 580 kg ; avec 850 kg,
       F_m = 850 × 2,50 + 250 = 2 375 N ≈ 2,4 × 10³ N (corrigé à la main) ;
     ex. 11 : la corde est dessinée horizontale, pour que <span class="vec-nom">P</span> et <span class="vec-nom">R</span> se
       compensent comme le dit la correction ;
     ex. 19 : la correction titre « p. 86 » : c'est la p. 87.
   ============================================================ */
(function () {
  'use strict';

  const { o, fmt, fr, sci, proche, nomV, chrono, bilan, sceneRemplie, partieResultante, partieAcc } = window.PFD;
  const calc = h => `<p class="ph-calc">${h}</p>`;
  const c = h => `<span class="c">${h}</span>`;
  const MS2 = 'm·s<sup>−2</sup>';
  // fabriques de parties
  const choix = (q, options, bonne, correction, opts) => Object.assign({ type: 'choix', q, options, bonne, correction, melanger: false, colonne: options.some(x => x.label.replace(/<[^>]+>/g, '').length > 24) }, opts);
  const nombre = (q, label, valeur, unite, correction, opts) => Object.assign({ type: 'nombre', q, label, valeur, unite, correction, signe: false }, opts);
  const scient = (q, label, valeur, unite, correction, opts) => Object.assign({ type: 'sci', q, label, valeur, unite, correction, cs: 3, rel: .01 }, opts);
  // les parties d'un bilan des forces : la correction est la solution de chaque étape
  const parties = q => q.parties.map(p => Object.assign({}, p, { correction: p.solution }));

  /* ---------- petites figures (SVG) ---------- */
  function fl(x1, y1, x2, y2, cls) {
    const a = Math.atan2(y2 - y1, x2 - x1), c_ = Math.cos(a), s = Math.sin(a), bx = x2 - 11 * c_, by = y2 - 11 * s;
    return `<g class="pfd-f${cls ? ' ' + cls : ''}"><line x1="${x1}" y1="${y1}" x2="${bx.toFixed(1)}" y2="${by.toFixed(1)}"/><path d="M${x2},${y2} L${(bx - 5.5 * s).toFixed(1)},${(by + 5.5 * c_).toFixed(1)} L${(bx + 5.5 * s).toFixed(1)},${(by - 5.5 * c_).toFixed(1)} Z"/></g>`;
  }
  const etiq = (x, y, n, s) => `<text x="${x}" y="${y}" class="pfd-sc-txt" text-anchor="middle" style="font-weight:800">${n}${s ? `<tspan dy="3" font-size="9">${s}</tspan>` : ''}</text><path d="M${x - 5},${y - 13} h10 m-3,-2.5 l3,2.5 l-3,2.5" fill="none" stroke="currentColor" style="color:var(--ink-2)" stroke-width="1.2"/>`;
  const svg = (w, h, contenu, aria) => `<div class="pfd-sc-cadre"><svg viewBox="0 0 ${w} ${h}" class="pfd-sc" style="max-width:${w * 1.3}px" role="img" aria-label="${aria}">${contenu}</svg></div>`;
  // ex. 9 a) : bloc sur un support, deux forces horizontales de longueurs g (vers la gauche) et d (vers la droite)
  const bloc9 = (g, d, n1, n2, titre) => svg(260, 90, `<rect x="40" y="56" width="180" height="10" class="pfd-sc-obj"/><rect x="104" y="38" width="52" height="18" class="pfd-sc-sys"/>` +
    fl(104, 47, 104 - g, 47) + fl(156, 47, 156 + d, 47) + etiq(104 - g / 2, 34, 'F', n1) + etiq(156 + d / 2, 34, 'F', n2) + `<text x="130" y="84" text-anchor="middle" class="pfd-sc-txt" style="font-weight:800">${titre}</text>`, `${titre} : force F${n1} vers la gauche, F${n2} vers la droite`);

  /* ---------- la balle de golf (ex. 2) ---------- */
  const GOLF = { id: 'golf', titre: 'Balle de golf qui roule sur le green', systeme: 'la balle', enonce: 'La balle roule vers la droite sur le green et ralentit à cause des frottements de l\'herbe.',
    dessin: `<rect x="20" y="190" width="320" height="8" class="pfd-sc-eau"/><line x1="20" y1="190" x2="340" y2="190" class="pfd-sc-sol"/><circle cx="180" cy="170" r="20" class="pfd-sc-sys"/>` +
      `<line x1="150" y1="130" x2="214" y2="130" class="pfd-sc-mvt"/><path d="M222,130 L213,126 L213,134 Z" class="pfd-sc-mvt-p"/><text x="226" y="134" class="pfd-sc-txt">roule</text><text x="28" y="214" class="pfd-sc-txt">green (herbe)</text>`,
    points: { G: [180, 170], A: [180, 190] }, nomsPts: { G: 'centre de la balle', A: 'contact avec l\'herbe' },
    acteurs: [{ id: 'terre', nom: 'la Terre', pourquoi: 'elle attire la balle, à distance (le poids)', manque: 'La Terre attire toujours le système : n\'oublie pas le poids.' },
      { id: 'herbe', nom: 'l\'herbe', pourquoi: 'elle touche la balle', manque: 'L\'herbe touche la balle : elle exerce une force de contact.' }],
    distracteurs: [{ id: 'club', nom: 'le club', diag: 'Le club a frappé la balle, mais il ne la touche plus.' }, { id: 'air', nom: 'l\'air', diag: 'On néglige l\'action de l\'air.' }],
    forces: [{ acteur: 'terre', type: 'distance', lib: 'force exercée par la Terre', pts: ['G'], angs: [270], noms: ['P'], diagDir: 'le poids est <b>vertical, vers le bas</b>.', indNom: `La force exercée par la Terre est le poids ${nomV('P')}.` },
      { acteur: 'herbe', type: 'contact', lib: 'réaction perpendiculaire de l\'herbe', pts: ['A'], angs: [90], noms: ['RN'], diagDir: 'la réaction normale est <b>perpendiculaire au sol</b> : verticale, vers le haut.', indNom: `La réaction perpendiculaire au support se note ${nomV('RN')}.` },
      { acteur: 'herbe', type: 'contact', lib: 'frottement de l\'herbe', pts: ['A'], angs: [180], noms: ['f'], diagDir: 'les frottements s\'opposent au mouvement de la balle vers la droite : <b>vers la gauche</b>.', indNom: `Les frottements se notent ${nomV('f')}.` }],
    nomsProposes: ['P', 'RN', 'R', 'f', 'T', 'FA'] };

  // ex. 9 b) : forces au point G (1 carreau = 1 N)
  const CAS1 = [{ nom: 'F_1', coord: [0, 2] }, { nom: 'F_2', coord: [3, 0] }, { nom: 'F_3', coord: [0, -4] }];
  const CAS2 = [{ nom: 'F_1', coord: [0, 3] }, { nom: 'F_2', coord: [2, 0] }, { nom: 'F_3', coord: [-4, 0] }, { nom: 'F_4', coord: [0, -3] }];
  const V19 = 4 / 3 * Math.PI * Math.pow(0.05, 3), FA19 = 1.23 * V19 * 9.81, P19 = 0.4 * 9.81;

  const GROUPES_EX = [
    { id: 'hors', titre: 'Exercices 1 à 3 (hors manuel) : accélération et résultante' },
    { id: 'direction', titre: 'Mouvement et résultante (p. 85-86) : exercices 7, 9, 10 et 11' },
    { id: 'pfd', titre: 'Principe fondamental (p. 84-87) : exercices 5, 13, 14 et 19' },
  ];

  const EXERCICES = [

    /* ============================ EXERCICE 1 ============================ */
    { id: '1', groupe: 'hors', titre: 'Exercice 1 : voiture de course', desc: 'De 0 à 100 km/h en 2,5 s : a, puis Σ F.',
      contexte: '<p class="er-contexte">Une voiture de course de masse m = 600 kg passe de 0 à 100 km/h (= 27,8 m·s<sup>−1</sup>) en Δt = 2,5 s en ligne droite. On considère que son accélération est constante.<br>Calculer la résultante des forces qui s\'applique sur la voiture lors de ce mouvement.</p>',
      parties: [
        nombre('Calcule l\'accélération de la voiture (3 chiffres significatifs).', 'a =', 27.8 / 2.5, MS2, calc(`a = ${fr('Δv', 'Δt')} = ${fr('27,8', '2,5')} = ${c('11,1 ' + MS2)}`),
          { rel: .01, affiche: '11,1', diag: v => proche(v, 100 / 2.5, .02) ? 'Utilise la vitesse en m/s : 27,8 m·s<sup>−1</sup>.' : proche(v, 2.5 / 27.8, .02) ? 'Rapport inversé : a = Δv / Δt.' : 'a = Δv / Δt.' }),
        scient('Calcule la résultante des forces.', 'Σ F<sub>ext</sub> =', 600 * 11.1, 'N', calc(`D'après le principe fondamental de la dynamique, Σ F<sub>ext</sub> = m a = 600 × 11,1 = ${c('6,66 × 10<sup>3</sup> N')}`),
          { diag: v => proche(v, 11.1 / 600, .02) || proche(v, 600 / 11.1, .02) ? 'Σ F = m × a : on multiplie.' : 'Σ F<sub>ext</sub> = m × a.' }),
      ] },

    /* ============================ EXERCICE 2 ============================ */
    { id: '2', groupe: 'hors', titre: 'Exercice 2 : balle de golf', desc: 'Bilan des forces, a, Σ F, puis les frottements f.',
      contexte: '<p class="er-contexte">Une balle de golf de masse m = 46 g roule sur un green, sa vitesse passe de 10 m·s<sup>−1</sup> à 0 m·s<sup>−1</sup> en 4,0 s à cause de l\'action des frottements <span class="vec-nom">f</span> de l\'herbe sur la balle.<br>Calculer la norme de Σ <span class="vec-nom">F</span><sub>ext</sub>, puis la norme de <span class="vec-nom">f</span>.</p>',
      parties: () => [
        ...parties(bilan(GOLF)),
        nombre('Calcule la valeur de l\'accélération de la balle.', 'a =', 2.5, MS2, calc(`a = ${fr('Δv', 'Δt')} = ${fr('10', '4')} = ${c('2,5 ' + MS2)}`) +
          '<p>Remarque : si on fait v<sub>finale</sub> − v<sub>initiale</sub>, on obtient une valeur négative (−2,5 m·s<sup>−2</sup>) : la balle ralentit. On n\'a besoin que de la valeur de a ; son signe ne nous importe pas pour calculer la résultante.</p>',
          { rel: .01, diag: v => proche(v, -2.5) ? 'La valeur négative indique que la balle ralentit ; ici, donne la valeur (positive).' : proche(v, .4) ? 'Rapport inversé : a = Δv / Δt.' : 'a = Δv / Δt.' }),
        nombre('Calcule la norme de Σ <span class="vec-nom">F</span><sub>ext</sub> (3 chiffres significatifs).', 'Σ F<sub>ext</sub> =', .046 * 2.5, 'N', calc(`D'après le principe fondamental de la dynamique, Σ F<sub>ext</sub> = m a = 46 × 10<sup>−3</sup> × 2,5 = ${c('0,115 N')}`),
          { rel: .01, affiche: '0,115', diag: v => proche(v, 46 * 2.5) ? 'Convertis la masse en kg : 46 g = 46 × 10<sup>−3</sup> kg.' : 'Σ F = m × a.' }),
        choix('Pourquoi la norme de <span class="vec-nom">f</span> est-elle égale à celle de Σ <span class="vec-nom">F</span><sub>ext</sub> ?', [o('ok', 'car <span class="vec-nom">P</span> + <span class="vec-nom">R</span><sub>N</sub> = <span class="vec-nom">0</span> : il ne reste que <span class="vec-nom">f</span>'), o('a', 'car <span class="vec-nom">f</span> est la seule force qui s\'exerce sur la balle'), o('b', 'car <span class="vec-nom">P</span> et <span class="vec-nom">f</span> se compensent')], 'ok',
          calc(`Σ <span class="vec-nom">F</span><sub>ext</sub> = ${nomV('P')} + ${nomV('RN')} + ${nomV('f')} = ${nomV('f')} car ${nomV('P')} + ${nomV('RN')} = <span class="vec-nom">0</span>`), { indices: { a: 'Le poids et la réaction de l\'herbe s\'exercent aussi : regarde ton bilan.', b: '<span class="vec-nom">P</span> est vertical, <span class="vec-nom">f</span> horizontal : ils ne peuvent pas se compenser.' } }),
        nombre('En déduire la norme de <span class="vec-nom">f</span>.', 'f =', .115, 'N', calc(`Donc f = Σ F<sub>ext</sub> = ${c('0,115 N')}`), { rel: .01, diag: () => 'f = Σ F<sub>ext</sub>.' }),
      ] },

    /* ============================ EXERCICE 3 ============================ */
    { id: '3', groupe: 'hors', titre: 'Exercice 3 : un avion démarre', desc: 'v = 7,25 t : a par dérivation, puis Σ F.',
      contexte: '<p class="er-contexte">Un avion de masse m = 10,0 tonnes démarre en ligne droite avec une vitesse qui s\'exprime en fonction de t avec : v = 7,25 t.<br>Calculer la résultante des forces qui s\'applique sur l\'avion lors de ce mouvement.</p>',
      parties: [
        nombre('Calcule l\'accélération de l\'avion.', 'a =', 7.25, MS2, calc(`a = ${fr('dv', 'dt')} (= v′) = ${c('7,25 ' + MS2)}`), { diag: () => 'a est la dérivée de la vitesse : la dérivée de 7,25 t est 7,25.' }),
        scient('Calcule la résultante des forces.', 'Σ F<sub>ext</sub> =', 7.25e4, 'N', calc(`D'après le principe fondamental de la dynamique, Σ F<sub>ext</sub> = m a = 10,0 × 10<sup>3</sup> × 7,25 = ${c('7,25 × 10<sup>4</sup> N')}`),
          { diag: v => proche(v, 72.5, .02) ? 'Convertis la masse en kg : 10,0 t = 10,0 × 10<sup>3</sup> kg.' : 'Σ F = m × a, m en kg.' }),
      ] },

    /* ============================ EXERCICE 7 ============================ */
    { id: '7', groupe: 'direction', titre: 'Exercice 7 p. 85 : trois mouvements rectilignes', desc: 'Accéléré, décéléré ou uniforme ?',
      contexte: `<p class="er-contexte">On peut considérer trois cas de mouvement rectiligne, mobile allant de la gauche vers la droite. Attribuer à chacun des cas la bonne dénomination : accéléré – décéléré – uniforme.</p>
        ${chrono({ type: 'uniforme', n: 10, anim: false, titre: '1<sup>er</sup> cas' })}${chrono({ pos: [0, .03, .07, .12, .2, .31, .45, .61, .8, 1], anim: false, titre: '2<sup>e</sup> cas' })}${chrono({ pos: [0, .2, .39, .55, .69, .8, .88, .94, .98, 1], anim: false, titre: '3<sup>e</sup> cas' })}`,
      parties: ['1<sup>er</sup>', '2<sup>e</sup>', '3<sup>e</sup>'].map((n, k) => choix(`Quelle est la nature du mouvement dans le ${n} cas ?`, [o('u', 'uniforme'), o('a', 'accéléré'), o('d', 'décéléré')], ['u', 'a', 'd'][k],
        `<p>${n} cas : mouvement rectiligne ${['uniforme (positions régulièrement espacées)', 'accéléré (positions de plus en plus espacées)', 'décéléré (positions de moins en moins espacées)'][k]}.</p>`,
        { indice: 'Le mobile va de gauche à droite : regarde comment évoluent les écarts entre deux positions successives.' })) },

    /* ============================ EXERCICE 9 ============================ */
    { id: '9', groupe: 'direction', titre: 'Exercice 9 p. 85 : vecteur accélération', desc: 'Direction de <span class="vec-nom">a</span> ; résultante de trois ou quatre forces.',
      contexte: `<p class="er-contexte">a) Sans soucis d'échelle, représenter le vecteur accélération <span class="vec-nom">a</span> dans chacun des cas suivants :</p>
        <div class="som-fiche-figs">${bloc9(56, 30, '1', '2', 'Cas 1')}${bloc9(42, 42, '3', '4', 'Cas 2')}${bloc9(26, 58, '5', '6', 'Cas 3')}</div>
        <p class="er-contexte" style="margin-top:8px">b) Dans chaque cas, déterminer la résultante des forces appliquées au point G, puis, sans soucis d'échelle, représenter le vecteur accélération.</p>
        <ul class="pfd-donnees"><li><b>Cas 1</b> : F<sub>1</sub> = 2 N vers le haut ; F<sub>2</sub> = 3 N vers la droite ; F<sub>3</sub> = 4 N vers le bas.</li>
        <li><b>Cas 2</b> : F<sub>1</sub> = 3 N vers le haut ; F<sub>2</sub> = 2 N vers la droite ; F<sub>3</sub> = 4 N vers la gauche ; F<sub>4</sub> = 3 N vers le bas.</li></ul>`,
      parties: [
        ...[['1', 'g', '<span class="vec-nom">F</span><sub>1</sub> (vers la gauche) est plus grande que <span class="vec-nom">F</span><sub>2</sub> : <span class="vec-nom">a</span> est dirigé vers la gauche.'], ['2', '0', '<span class="vec-nom">F</span><sub>3</sub> et <span class="vec-nom">F</span><sub>4</sub> sont égales et opposées : elles se compensent, <span class="vec-nom">a</span> = <span class="vec-nom">0</span>.'], ['3', 'd', '<span class="vec-nom">F</span><sub>6</sub> (vers la droite) est plus grande que <span class="vec-nom">F</span><sub>5</sub> : <span class="vec-nom">a</span> est dirigé vers la droite.']]
          .map(([n, b, sol]) => choix(`a) Cas ${n} : comment est dirigé <span class="vec-nom">a</span> ?`, [o('g', 'vers la gauche'), o('d', 'vers la droite'), o('0', '<span class="vec-nom">a</span> = <span class="vec-nom">0</span>')], b,
            `<p>La résultante des forces et le vecteur accélération ont la même direction et le même sens. ${sol}</p>`, { indice: '<span class="vec-nom">a</span> a la même direction et le même sens que Σ <span class="vec-nom">F</span> : du côté de la plus grande force ; deux forces égales et opposées se compensent.' })),
        Object.assign(partieResultante({ forces: CAS1, etendue: 4, q: 'b) Cas 1 : trace la résultante Σ <span class="vec-nom">F</span> depuis G (1 carreau = 1 N).' }),
          { correction: '<p><span class="vec-nom">F</span><sub>1</sub> + <span class="vec-nom">F</span><sub>3</sub> = 2 N vers le bas ; avec <span class="vec-nom">F</span><sub>2</sub> = 3 N vers la droite, Σ <span class="vec-nom">F</span> est la diagonale du rectangle : 3 carreaux à droite et 2 vers le bas.</p>' }),
        Object.assign(partieAcc({ forces: CAS1, etendue: 4, q: 'b) Cas 1 : trace le vecteur accélération <span class="vec-nom">a</span> depuis G (sans souci d\'échelle).' }),
          { correction: '<p><span class="vec-nom">a</span> a la même direction et le même sens que Σ <span class="vec-nom">F</span> : en diagonale, vers le bas et la droite.</p>' }),
        Object.assign(partieResultante({ forces: CAS2, etendue: 4, q: 'b) Cas 2 : trace la résultante Σ <span class="vec-nom">F</span> depuis G.' }),
          { correction: '<p>Les forces verticales se compensent (3 N vers le haut, 3 N vers le bas) ; à l\'horizontale, 2 N vers la droite et 4 N vers la gauche : Σ <span class="vec-nom">F</span> = 2 N vers la gauche.</p>' }),
        choix('b) Cas 2 : comment est dirigé <span class="vec-nom">a</span> ?', [o('g', 'horizontal, vers la gauche'), o('d', 'horizontal, vers la droite'), o('0', '<span class="vec-nom">a</span> = <span class="vec-nom">0</span>')], 'g',
          '<p><span class="vec-nom">a</span> a la même direction et le même sens que Σ <span class="vec-nom">F</span> : horizontal, vers la gauche.</p>', { indices: { d: 'La plus grande force horizontale est vers la gauche.', 0: 'Les forces verticales se compensent, mais pas les forces horizontales.' } }),
      ] },

    /* ============================ EXERCICE 10 ============================ */
    { id: '10', groupe: 'direction', titre: 'Exercice 10 p. 86 : la résultante des forces', desc: 'Balle qui tombe, voiture qui freine.',
      contexte: `<p class="er-contexte">Sans soucis d'échelle, représenter la résultante des forces s'exerçant sur chacun des objets :</p>
        <div class="som-fiche-figs deux">${svg(160, 150, `<circle cx="80" cy="44" r="26" class="pfd-sc-sys"/><circle cx="80" cy="44" r="3" class="pfd-pt-m"/><text x="88" y="40" class="pfd-pt-t">G</text>${fl(80, 74, 80, 132)}${etiq(100, 112, 'a', '')}<text x="80" y="148" text-anchor="middle" class="pfd-sc-txt" style="font-weight:800">Balle qui tombe</text>`, 'Balle qui tombe, vecteur accélération vers le bas')}
        ${svg(200, 150, `<path d="M30,96 L30,74 Q32,66 44,64 L70,60 L88,40 L150,40 L168,62 L170,96 Z" class="pfd-sc-sys"/><circle cx="60" cy="98" r="12" class="pfd-sc-roue"/><circle cx="140" cy="98" r="12" class="pfd-sc-roue"/><line x1="10" y1="110" x2="190" y2="110" class="pfd-sc-sol"/>` +
          `<circle cx="100" cy="74" r="3" class="pfd-pt-m"/><text x="92" y="70" class="pfd-pt-t">G</text>${fl(108, 74, 160, 74)}${etiq(148, 66, 'a', '')}<text x="100" y="140" text-anchor="middle" class="pfd-sc-txt" style="font-weight:800">Voiture qui freine (elle roule vers la gauche)</text>`, 'Voiture qui roule vers la gauche et freine, vecteur accélération vers la droite')}</div>`,
      parties: [
        choix('Balle qui tombe : comment est dirigée la résultante des forces ?', [o('bas', 'verticale, vers le bas'), o('haut', 'verticale, vers le haut'), o('0', 'elle est nulle')], 'bas',
          '<p>La résultante des forces et le vecteur accélération ont la même direction et le même sens : Σ <span class="vec-nom">F</span> est verticale, vers le bas, comme <span class="vec-nom">a</span>.</p>', { indices: { haut: 'Σ <span class="vec-nom">F</span> a le même sens que <span class="vec-nom">a</span>.', 0: 'La balle accélère : <span class="vec-nom">a</span> ≠ <span class="vec-nom">0</span>.' } }),
        choix('Voiture qui freine : comment est dirigée la résultante des forces ?', [o('d', 'horizontale, vers la droite (vers l\'arrière de la voiture)'), o('g', 'horizontale, vers la gauche (dans le sens du mouvement)'), o('0', 'elle est nulle')], 'd',
          '<p>Σ <span class="vec-nom">F</span> a la même direction et le même sens que <span class="vec-nom">a</span> : vers la droite, c\'est-à-dire vers l\'arrière de la voiture, qui ralentit.</p>', { indices: { g: 'La voiture freine : <span class="vec-nom">a</span> est opposé au mouvement, et Σ <span class="vec-nom">F</span> a le sens de <span class="vec-nom">a</span>.', 0: 'La vitesse change : <span class="vec-nom">a</span> ≠ <span class="vec-nom">0</span>.' } }),
      ] },

    /* ============================ EXERCICE 11 ============================ */
    { id: '11', groupe: 'direction', titre: 'Exercice 11 p. 86 : un bloc tiré', desc: 'Résultante, bilan des forces, force de traction.',
      contexte: `<p class="er-contexte">Le bloc ci-dessous glisse le long du sol sans frottement.</p>
        ${svg(300, 110, `<rect x="10" y="88" width="280" height="10" class="pfd-sc-obj"/><rect x="60" y="44" width="56" height="44" class="pfd-sc-sys"/><circle cx="88" cy="66" r="3" class="pfd-pt-m"/><text x="76" y="62" class="pfd-pt-t">G</text>` +
          `<line x1="116" y1="66" x2="246" y2="66" class="pfd-sc-fil"/><path d="M246,58 q 10,-4 18,2 q 6,6 0,12 q -8,6 -18,2 z" class="pfd-sc-obj"/>${fl(92, 30, 150, 30)}${etiq(121, 22, 'a', '')}`, 'Bloc tiré par une corde horizontale, accélération vers la droite')}
        <ul class="pfd-donnees"><li>a) Tracer, sans soucis d'échelle, la résultante des forces s'exerçant sur le bloc.</li><li>b) Faire le bilan des forces s'exerçant sur le bloc.</li><li>c) En déduire le sens et la direction de la force de traction <span class="vec-nom">F</span>.</li></ul>`,
      parties: [
        choix('a) Comment est dirigée la résultante des forces ?', [o('ok', 'horizontale, vers la droite, comme <span class="vec-nom">a</span>'), o('a', 'verticale, vers le bas'), o('b', 'elle est nulle')], 'ok',
          '<p>Σ <span class="vec-nom">F</span> a la même direction et le même sens que <span class="vec-nom">a</span> : horizontale, vers la droite.</p>', { indices: { a: 'Σ <span class="vec-nom">F</span> a le sens de <span class="vec-nom">a</span>.', b: 'Le bloc accélère : <span class="vec-nom">a</span> ≠ <span class="vec-nom">0</span>.' } }),
        choix('b) Quelles forces s\'exercent sur le bloc ?', [o('ok', 'le poids, la réaction du sol et la force de traction'), o('a', 'le poids et la force de traction'), o('b', 'le poids, la réaction du sol, la traction et des frottements')], 'ok',
          '<p>Sur le bloc s\'exercent le poids <span class="vec-nom">P</span>, la réaction du support <span class="vec-nom">R</span> et la force de traction <span class="vec-nom">F</span>.</p>', { indices: { a: 'Le sol touche le bloc : il exerce une force.', b: 'Le bloc glisse <b>sans frottement</b>.' } }),
        choix('c) Quels sont la direction et le sens de la force de traction <span class="vec-nom">F</span> ?', [o('ok', 'la même direction et le même sens que Σ <span class="vec-nom">F</span> et <span class="vec-nom">a</span> : horizontale, vers la droite'), o('a', 'verticale, vers le haut'), o('b', 'horizontale, vers la gauche')], 'ok',
          '<p>Comme le poids et la réaction du support se compensent, Σ <span class="vec-nom">F</span> = <span class="vec-nom">F</span> : la force de traction a le même sens et la même direction que la résultante des forces et que le vecteur accélération.</p>',
          { indices: { a: '<span class="vec-nom">P</span> et <span class="vec-nom">R</span> se compensent : il reste <span class="vec-nom">F</span> = Σ <span class="vec-nom">F</span>.', b: '<span class="vec-nom">F</span> = Σ <span class="vec-nom">F</span>, qui a le sens de <span class="vec-nom">a</span>.' } }),
      ] },

    /* ============================ EXERCICE 5 ============================ */
    { id: '5', groupe: 'pfd', titre: 'Exercice 5 p. 84 : démarrage au feu vert', desc: 'Bilan, poids, résultante, puis la force motrice.',
      contexte: `<p class="er-contexte">Une automobile de masse m = 850 kg est à l'arrêt à un feu rouge. Quand le feu passe au vert, la voiture a une accélération constante a = 2,50 m·s<sup>−2</sup>, suivant une trajectoire rectiligne. On évalue les forces de frottement à f = 250 N. On note <span class="vec-nom">F</span><sub>m</sub> la force motrice de la voiture.</p>
        <ol class="pfd-donnees"><li>Faire le bilan des forces s'exerçant sur la voiture.</li><li>Calculer la valeur du poids P de l'automobile.</li><li>Exprimer la résultante des forces Σ <span class="vec-nom">F</span> s'exerçant sur la voiture.</li>
        <li>Représenter, sans soucis d'échelle, le vecteur accélération <span class="vec-nom">a</span> puis la résultante des forces Σ <span class="vec-nom">F</span> sur un même schéma.</li><li>Quelle relation peut-on écrire entre m, a, f et F<sub>m</sub> ?</li><li>En déduire la valeur de la force motrice F<sub>m</sub> de la voiture.</li></ol>
        <p class="pfd-donnees"><b>Donnée</b> : g = 9,81 m·s<sup>−2</sup>.</p>`,
      parties: [
        choix('1. Quelles forces s\'exercent sur la voiture ?', [o('ok', 'le poids <span class="vec-nom">P</span>, la réaction de la route <span class="vec-nom">N</span>, les frottements <span class="vec-nom">f</span> et la force motrice <span class="vec-nom">F</span><sub>m</sub>'), o('a', 'le poids <span class="vec-nom">P</span>, la force motrice <span class="vec-nom">F</span><sub>m</sub> et la force du moteur'), o('b', 'le poids <span class="vec-nom">P</span> et la force motrice <span class="vec-nom">F</span><sub>m</sub>')], 'ok',
          '<p>Les forces qui s\'exercent sur la voiture sont le poids <span class="vec-nom">P</span>, la réaction de la route <span class="vec-nom">N</span>, les forces de frottement <span class="vec-nom">f</span> et la force motrice <span class="vec-nom">F</span><sub>m</sub>.</p>',
          { indices: { a: 'Le moteur fait partie de la voiture : la force motrice est exercée par la route sur les roues motrices.', b: 'La route touche la voiture (réaction), et il y a des frottements.' } }),
        scient('2. Calcule la valeur du poids P.', 'P =', 850 * 9.81, 'N', calc(`P = m × g = 850 × 9,81 = ${c('8,34 × 10<sup>3</sup> N')}`), { diag: v => proche(v, 850 / 9.81, .02) ? 'P = m × g : on multiplie.' : 'P = m × g.' }),
        choix('3. Exprime la résultante des forces.', [o('ok', 'Σ <span class="vec-nom">F</span> = <span class="vec-nom">P</span> + <span class="vec-nom">N</span> + <span class="vec-nom">f</span> + <span class="vec-nom">F</span><sub>m</sub> = <span class="vec-nom">f</span> + <span class="vec-nom">F</span><sub>m</sub>, car <span class="vec-nom">P</span> + <span class="vec-nom">N</span> = <span class="vec-nom">0</span>'), o('a', 'Σ <span class="vec-nom">F</span> = <span class="vec-nom">F</span><sub>m</sub>'), o('b', 'Σ <span class="vec-nom">F</span> = <span class="vec-nom">P</span> + <span class="vec-nom">F</span><sub>m</sub>')], 'ok',
          calc('Σ <span class="vec-nom">F</span> = <span class="vec-nom">P</span> + <span class="vec-nom">N</span> + <span class="vec-nom">f</span> + <span class="vec-nom">F</span><sub>m</sub> = <span class="vec-nom">f</span> + <span class="vec-nom">F</span><sub>m</sub> car <span class="vec-nom">P</span> + <span class="vec-nom">N</span> = <span class="vec-nom">0</span>'), { indices: { a: 'N\'oublie pas les frottements.', b: 'Le poids est compensé par la réaction de la route.' } }),
        choix('4. Comment sont dirigés <span class="vec-nom">a</span> et Σ <span class="vec-nom">F</span> ?', [o('ok', 'tous les deux dans le sens du mouvement (vers l\'avant)'), o('a', '<span class="vec-nom">a</span> vers l\'avant, Σ <span class="vec-nom">F</span> vers l\'arrière'), o('b', 'tous les deux vers l\'arrière, comme <span class="vec-nom">f</span>')], 'ok',
          '<p>La voiture accélère vers l\'avant : <span class="vec-nom">a</span> est dans le sens du mouvement, et Σ <span class="vec-nom">F</span> = m <span class="vec-nom">a</span> a la même direction et le même sens.</p>', { indices: { a: 'Σ <span class="vec-nom">F</span> et <span class="vec-nom">a</span> ont toujours le même sens.', b: 'La voiture accélère : <span class="vec-nom">a</span> est dans le sens du mouvement.' } }),
        choix('5. Quelle relation peut-on écrire entre m, a, f et F<sub>m</sub> ?', [o('ok', 'm × a = F<sub>m</sub> − f'), o('a', 'm × a = F<sub>m</sub> + f'), o('b', 'm × a = f − F<sub>m</sub>')], 'ok',
          '<p>D\'après la loi fondamentale de la dynamique, projetée sur le sens du mouvement : m × a = F<sub>m</sub> − f.</p>', { indices: { a: 'Les frottements sont opposés au mouvement : ils comptent négativement.', b: 'La force motrice est dans le sens du mouvement.' } }),
        nombre('6. En déduire la valeur de la force motrice.', 'F<sub>m</sub> =', 850 * 2.5 + 250, 'N', calc(`F<sub>m</sub> = m × a + f = 850 × 2,5 + 250 = ${c('2 375 N')} ≈ 2,4 × 10<sup>3</sup> N`) +
          '<p class="pfd-note">Le corrigé du manuel calcule avec 580 kg (coquille) : avec la masse de l\'énoncé, 850 kg, on trouve 2 375 N.</p>',
          { rel: .015, diag: v => proche(v, 580 * 2.5 + 250, .01) ? 'La masse de la voiture est 850 kg.' : proche(v, 850 * 2.5 - 250, .01) ? 'F<sub>m</sub> = m a <b>+</b> f.' : proche(v, 850 * 2.5, .01) ? 'N\'oublie pas les frottements.' : 'F<sub>m</sub> = m × a + f.' }),
      ] },

    /* ============================ EXERCICE 13 ============================ */
    { id: '13', groupe: 'pfd', titre: 'Exercice 13 p. 86 : Formule 1 contre avion de chasse', desc: 'Force de propulsion et force de poussée.',
      contexte: '<p class="er-contexte">Cet exercice reprend la vidéo de la page 78. On suppose que l\'accélération de la F1 pendant les 200 premiers mètres vaut a<sub>1</sub> = 11,5 m·s<sup>−2</sup> et celle de l\'avion de chasse vaut a<sub>2</sub> = 6,0 m·s<sup>−2</sup>.<br>On suppose que les seules forces qui s\'exercent sur la F1 sont le poids, la réaction du support et la force de propulsion, et sur l\'avion de chasse, le poids, la réaction du support et la force de poussée. Sachant que le poids et la réaction du support se compensent, déterminer la valeur de la force de propulsion de la F1 et la valeur de la force de poussée de l\'avion de chasse.</p><p class="pfd-donnees"><b>Données</b> : masse de la Formule 1 : 740 kg ; masse de l\'avion de chasse : 10 tonnes.</p>',
      parties: [
        choix('Que vaut la résultante des forces sur la F1 ?', [o('ok', 'Σ <span class="vec-nom">F</span> = <span class="vec-nom">F</span><sub>pr</sub>, car le poids et la réaction du support se compensent'), o('a', 'Σ <span class="vec-nom">F</span> = <span class="vec-nom">P</span> + <span class="vec-nom">F</span><sub>pr</sub>'), o('b', 'Σ <span class="vec-nom">F</span> = <span class="vec-nom">0</span>')], 'ok',
          '<p>Le principe fondamental de la dynamique Σ <span class="vec-nom">F</span> = m <span class="vec-nom">a</span> devient m<sub>1</sub> × a<sub>1</sub> = F<sub>pr</sub>, car le poids et la réaction du support se compensent.</p>', { indices: { a: 'Le poids est compensé par la réaction.', b: 'La F1 accélère : Σ <span class="vec-nom">F</span> ≠ <span class="vec-nom">0</span>.' } }),
        scient('Calcule la force de propulsion de la F1.', 'F<sub>pr</sub> =', 740 * 11.5, 'N', calc(`F<sub>pr</sub> = m<sub>1</sub> × a<sub>1</sub> = 740 × 11,5 = ${c('8,51 × 10<sup>3</sup> N')}`), { diag: v => proche(v, 740 / 11.5, .02) ? 'F = m × a : on multiplie.' : 'F<sub>pr</sub> = m<sub>1</sub> × a<sub>1</sub>.' }),
        scient('Calcule la force de poussée de l\'avion de chasse (2 chiffres significatifs).', 'F<sub>pou</sub> =', 6e4, 'N', calc(`F<sub>pou</sub> = m<sub>2</sub> × a<sub>2</sub> = 10 × 10<sup>3</sup> × 6,0 = ${c('6,0 × 10<sup>4</sup> N')}`),
          { cs: 2, diag: v => proche(v, 60, .02) ? 'Convertis la masse en kg : 10 t = 10 × 10<sup>3</sup> kg.' : 'F<sub>pou</sub> = m<sub>2</sub> × a<sub>2</sub>.' }),
      ] },

    /* ============================ EXERCICE 14 ============================ */
    { id: '14', groupe: 'pfd', titre: 'Exercice 14 p. 86 : la boule de bowling et la plume', desc: 'Chute dans le vide : <span class="vec-nom">a</span> = <span class="vec-nom">g</span> pour les deux.',
      contexte: '<p class="er-contexte">On laisse tomber, d\'une même hauteur et au même instant, une boule de bowling et une plume dans le vide. Montrer, à partir du principe fondamental de la dynamique, que les deux objets touchent le sol en même temps.</p>',
      parties: [
        choix('Quelles forces s\'exercent sur chaque objet, dans le vide ?', [o('ok', 'seulement leur poids'), o('a', 'leur poids et les frottements de l\'air'), o('b', 'leur poids et la poussée d\'Archimède de l\'air')], 'ok',
          '<p>Dans le vide, la boule de bowling et la plume ne sont soumises qu\'à leur poids.</p>', { indices: { a: 'Il n\'y a pas d\'air dans le vide.', b: 'Il n\'y a pas d\'air dans le vide.' } }),
        choix('Que donne le principe fondamental de la dynamique ?', [o('ok', '<span class="vec-nom">P</span> = m <span class="vec-nom">a</span> et <span class="vec-nom">P</span> = m <span class="vec-nom">g</span>, donc <span class="vec-nom">a</span> = <span class="vec-nom">g</span>'), o('a', '<span class="vec-nom">a</span> = m <span class="vec-nom">g</span>'), o('b', '<span class="vec-nom">a</span> = <span class="vec-nom">P</span>')], 'ok',
          calc('Σ <span class="vec-nom">F</span> = m <span class="vec-nom">a</span>, c\'est-à-dire <span class="vec-nom">P</span> = m <span class="vec-nom">a</span>. Donc m <span class="vec-nom">g</span> = m <span class="vec-nom">a</span>, où <span class="vec-nom">g</span> est le champ de pesanteur, donc <span class="vec-nom">g</span> = <span class="vec-nom">a</span>.'), { indices: { a: 'La masse se simplifie : m <span class="vec-nom">g</span> = m <span class="vec-nom">a</span>.', b: '<span class="vec-nom">P</span> est une force (en N), <span class="vec-nom">a</span> une accélération : écris <span class="vec-nom">P</span> = m <span class="vec-nom">g</span>.' } }),
        choix('Conclure.', [o('ok', 'les deux objets ont la même accélération <span class="vec-nom">g</span> : ils touchent le sol en même temps'), o('a', 'la boule, plus lourde, arrive la première'), o('b', 'la plume arrive la première')], 'ok',
          '<p>Leur accélération est identique (<span class="vec-nom">a</span> = <span class="vec-nom">g</span>, quelle que soit la masse), donc la boule de bowling et la plume atteindront le sol en même temps.</p>', { indices: { a: 'L\'accélération <span class="vec-nom">a</span> = <span class="vec-nom">g</span> ne dépend pas de la masse.', b: 'Dans l\'air, la plume serait freinée ; mais ici on est dans le vide.' } }),
      ] },

    /* ============================ EXERCICE 19 ============================ */
    { id: '19', groupe: 'pfd', titre: 'Exercice 19 p. 87 : boule de pétanque et parachute', desc: 'Poussée d\'Archimède négligeable, chute à vitesse constante.',
      contexte: `<p class="er-contexte">On considère un système {boule de pétanque + parachute}. La masse de la boule de pétanque étant très supérieure à celle des tissus et fils utilisés pour fabriquer le parachute, on assimile la masse du système à la masse de la boule de pétanque. Le système en chute est soumis à l'action mécanique de la Terre, modélisée par le poids <span class="vec-nom">P</span>, et à l'action mécanique exercée par l'air, modélisée par une force de frottement <span class="vec-nom">f</span> et par la poussée d'Archimède <span class="vec-nom">F</span><sub>A</sub>. La masse du système étudié est m = 400 g, et le diamètre de la boule est d = 10 cm.</p>
        ${svg(200, 150, `<line x1="20" y1="132" x2="180" y2="132" class="pfd-sc-sol"/><circle cx="100" cy="76" r="14" class="pfd-sc-sys"/><circle cx="100" cy="76" r="2.5" class="pfd-pt-m"/><text x="86" y="80" class="pfd-pt-t">G</text>` +
          fl(100, 76, 100, 116) + fl(96, 76, 96, 30) + fl(106, 76, 106, 50) + etiq(116, 120, 'P', '') + etiq(84, 34, 'f', '') + etiq(124, 54, 'F', 'A'), 'Système en chute : poids vers le bas, frottement et poussée d\'Archimède vers le haut, depuis G')}
        <ol class="pfd-donnees"><li>Le référentiel d'étude étant supposé galiléen, écrire le principe fondamental de la dynamique appliqué au système étudié.</li>
        <li>Montrer, à l'aide d'un calcul numérique, que l'on peut négliger la poussée d'Archimède par rapport au poids du système.</li>
        <li>Durant la dernière partie de la chute de la boule de pétanque la vitesse est constante. Que peut-on déduire quant à son accélération ?</li>
        <li>D'après les questions précédentes, déterminer la valeur de la force de frottement durant la dernière partie de la chute.</li></ol>
        <p class="pfd-donnees"><b>Données</b> : F<sub>A</sub> = ρ<sub>air</sub> × V × g, où ρ<sub>air</sub> = 1,23 kg·m<sup>−3</sup>, V le volume (en m<sup>3</sup>) du corps placé dans l'air, g = 9,81 m·s<sup>−2</sup> ; volume d'une sphère de rayon r : V = (4/3) × π × r<sup>3</sup>.</p>`,
      parties: [
        choix('1. Écris le principe fondamental de la dynamique.', [o('ok', 'Σ <span class="vec-nom">F</span> = m <span class="vec-nom">a</span>, soit <span class="vec-nom">P</span> + <span class="vec-nom">f</span> + <span class="vec-nom">F</span><sub>A</sub> = m <span class="vec-nom">a</span>'), o('a', 'Σ <span class="vec-nom">F</span> = <span class="vec-nom">0</span>'), o('b', '<span class="vec-nom">P</span> = m <span class="vec-nom">a</span>')], 'ok',
          calc('Σ <span class="vec-nom">F</span><sub>i</sub> = m × <span class="vec-nom">a</span>, soit <span class="vec-nom">P</span> + <span class="vec-nom">f</span> + <span class="vec-nom">F</span><sub>A</sub> = m <span class="vec-nom">a</span>.'), { indices: { a: 'Σ <span class="vec-nom">F</span> = <span class="vec-nom">0</span> est le principe d\'inertie : un cas particulier.', b: 'Il y a trois forces : la somme de toutes les forces.' } }),
        nombre('2. Calcule le poids du système (3 chiffres significatifs).', 'P =', P19, 'N', calc(`P = m × g = 0,400 × 9,81 = ${c('3,92 N')}`), { rel: .01, affiche: '3,92', diag: v => proche(v, 400 * 9.81, .02) ? 'Convertis la masse en kg : 400 g = 0,400 kg.' : 'P = m × g.' }),
        scient('2. Calcule le volume de la boule (2 chiffres significatifs).', 'V =', V19, 'm<sup>3</sup>', calc(`r = d / 2 = 5,0 cm = 0,050 m ; V = ${fr('4', '3')} × π × (0,050)<sup>3</sup> = ${c('5,2 × 10<sup>−4</sup> m<sup>3</sup>')}`),
          { cs: 2, rel: .02, diag: v => proche(v, 4 / 3 * Math.PI * 1e-3, .03) ? 'Le rayon est la moitié du diamètre : r = 0,050 m.' : proche(v, V19 * 1e6, .03) ? 'Le rayon doit être en mètres : r = 0,050 m.' : 'V = (4/3) × π × r<sup>3</sup>, avec r = 0,050 m.' }),
        scient('2. Calcule la poussée d\'Archimède (2 chiffres significatifs).', 'F<sub>A</sub> =', FA19, 'N', calc(`F<sub>A</sub> = ρ<sub>air</sub> × V × g = 1,23 × 5,2 × 10<sup>−4</sup> × 9,81 = ${c('6,3 × 10<sup>−3</sup> N')}`),
          { cs: 2, rel: .03, diag: v => proche(v, 1.23 * V19, .03) ? 'N\'oublie pas g = 9,81 m·s<sup>−2</sup>.' : 'F<sub>A</sub> = ρ<sub>air</sub> × V × g.' }),
        nombre('2. Calcule le rapport P / F<sub>A</sub> (2 chiffres significatifs).', 'P / F<sub>A</sub> =', P19 / FA19, '', calc(`${fr('P', 'F<sub>A</sub>')} = ${fr('3,92', '6,3 × 10<sup>−3</sup>')} ≈ ${c('620')}`) +
          '<p>Cela signifie que l\'intensité du poids est 620 fois supérieure à celle de la poussée d\'Archimède : on peut donc négliger cette dernière devant le poids.</p>',
          { rel: .02, affiche: '620', diag: v => proche(v, FA19 / P19, .03) ? 'Rapport inversé : P / F<sub>A</sub>.' : 'P / F<sub>A</sub>.' }),
        choix('3. La vitesse est constante (et le mouvement rectiligne). Que peut-on en déduire ?', [o('ok', 'l\'accélération est nulle'), o('a', 'l\'accélération est égale à g'), o('b', 'l\'accélération est constante mais non nulle')], 'ok',
          '<p>Si la vitesse est constante, alors son accélération est nulle.</p>', { indices: { a: 'L\'accélération est la variation de la vitesse.', b: 'La vitesse ne varie pas.' } }),
        nombre('4. Détermine la valeur de la force de frottement (3 chiffres significatifs).', 'f =', P19, 'N', calc(`D'après les questions précédentes, Σ <span class="vec-nom">F</span> = <span class="vec-nom">0</span> (<span class="vec-nom">F</span><sub>A</sub> négligée), donc f − P = 0, c'est-à-dire : f = P = ${c('3,92 N')}`),
          { rel: .01, affiche: '3,92', diag: v => proche(v, P19 - FA19, .002) ? 'La poussée d\'Archimède est négligeable : f = P.' : proche(v, 0) ? 'Le poids, lui, n\'est pas nul : f compense P.' : 'Σ <span class="vec-nom">F</span> = <span class="vec-nom">0</span> donc f = P.' }),
      ] },
  ];

  window.PFD.EXERCICES = EXERCICES;
  window.PFD.GROUPES_EX = GROUPES_EX;
})();
