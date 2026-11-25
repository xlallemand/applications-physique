/* ============================================================
   Situations du bilan des forces (application « Bilan des forces »),
   reprises de principe-dynamique/modules/situations.js (dessins de la
   fiche « Faire un bilan des forces » de Terminale STI2D), complétées
   par les situations du cours et des exercices 1 à 4 de Terminale
   spécialité (ballon de foot avant, pendant et après la frappe ;
   valise portée, posée ; lancer du poids ; skieur tiré par un téléski ;
   livre immobile sur un plan incliné ; voiture au freinage ; bateau à
   voile ; caravane tractée par une voiture qui freine).

   BF.SITUATIONS : { id: situation }, BF.PARCOURS : ordre de l'atelier
   (par niveau, puis du plus simple au plus difficile), BF.NIVEAUX : les
   niveaux de l'atelier, BF.BALLON : les trois dessins de l'exemple traité,
   BF.ballonHTML() : l'exemple traité (diagramme objet-action au-dessus
   de chaque dessin).
   Une situation :
     { id, titre, niv ('2de' | '1re' | 'Tle'), systeme ('la brique'), sysCourt (nom dans le diagramme objet-action, facultatif),
       enonce, dessin (SVG, repère 360 × 240),
       points: { G: [x, y], A: […] }, nomsPts: { G: 'centre…' }, lf (longueur des flèches, facultatif),
       acteurs: [{ id, nom, pourquoi, manque, court }] (les actions à distance, puis les objets qui touchent),
       distracteurs: [{ id, nom, diag }] (objets proposés à tort parmi ceux qui touchent le système),
       air: { neglige, cause ('frottements' | 'archi'), raison, indice } : l'air touche presque
         toujours le système, c'est donc un acteur (le dernier) ; sa force est négligée sauf
         si ses frottements ou sa poussée d'Archimède ne sont pas négligeables,
       forces: [{ acteur, type: 'distance' | 'contact', lib, pts: [points acceptés],
                  angs: [angles acceptés, en degrés, 0 = vers la droite, 90 = vers le haut],
                  noms: [noms acceptés], diagDir, diagPt, indNom, L (longueur de la flèche, facultatif) }],
       speciales: [{ label, court, ang }] (directions propres : perpendiculaire au support… ; court : libellé court de l'atelier),
       nomsProposes: [noms affichés à l'étape des noms], comp: { bonne, expl, indice, q } }
   Plan incliné qui descend vers la droite : pente de 25° : perpendiculaire au
   support 65°, parallèle vers le haut de la pente 155°, vers le bas 335°.
   Plan incliné qui monte vers la droite (livre de l'exercice 3) : pente de 20° :
   perpendiculaire 110°, vers le haut de la pente 20°, vers le bas 200°.
   Longueurs des flèches (sans souci d'échelle, mais cohérentes) : des forces
   qui se compensent ont des longueurs qui s'équilibrent (<span class="vec-nom">F</span>archi = <span class="vec-nom">P</span> + <span class="vec-nom">T</span> pour le
   ballon d'hélium ; sur le plan incliné, <span class="vec-nom">R</span>ₙ = P cos 25° et <span class="vec-nom">f</span> = P sin 25°) ; quand
   elles ne se compensent pas, leur somme a le sens du mouvement accéléré.
   ============================================================ */
(function () {
  'use strict';

  const { nomV } = window.BF;

  /* ---------- petits dessins ---------- */
  function sol(x1, x2, y) {
    let s = `<line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" class="bf-sc-sol"/>`;
    for (let x = x1 + 10; x <= x2; x += 12) s += `<line x1="${x}" y1="${y + 1}" x2="${x - 8}" y2="${y + 9}" class="bf-sc-hach"/>`;
    return s;
  }
  const txt = (x, y, t, ancre) => `<text x="${x}" y="${y}" class="bf-sc-txt"${ancre ? ` text-anchor="${ancre}"` : ''}>${t}</text>`;
  // flèche en pointillés : sens du mouvement (indication, pas une force)
  function mvt(x1, y1, x2, y2, t) {
    const a = Math.atan2(y2 - y1, x2 - x1), c = Math.cos(a), s = Math.sin(a);
    return `<line x1="${x1}" y1="${y1}" x2="${x2 - 8 * c}" y2="${y2 - 8 * s}" class="bf-sc-mvt"/><path d="M${x2},${y2} L${(x2 - 9 * c - 4 * s).toFixed(1)},${(y2 - 9 * s + 4 * c).toFixed(1)} L${(x2 - 9 * c + 4 * s).toFixed(1)},${(y2 - 9 * s - 4 * c).toFixed(1)} Z" class="bf-sc-mvt-p"/>` +
      (t ? txt((x1 + x2) / 2, Math.min(y1, y2) - 7, t, 'middle') : '');
  }
  const main = (x, y) => `<path d="M${x},${y} q 8,-10 22,-8 l 26,2 q 6,1 6,6 q 0,5 -6,5 l -18,0 q 6,8 -2,12 l -24,0 q -8,-4 -4,-17 z" class="bf-sc-obj"/>`;
  // plan incliné (pente de 25°), et points d'une figure posée dessus
  const A_INC = 25 * Math.PI / 180, U = [Math.cos(A_INC), Math.sin(A_INC)], N = [Math.sin(A_INC), -Math.cos(A_INC)];
  const P0 = [30, 80], AI = [P0[0] + 150 * U[0], P0[1] + 150 * U[1]];
  const sur = (t, h) => [+(AI[0] + t * U[0] + h * N[0]).toFixed(1), +(AI[1] + t * U[1] + h * N[1]).toFixed(1)];
  const plan = () => `<polygon points="30,80 ${(30 + 300).toFixed(0)},${(80 + 300 * Math.tan(A_INC)).toFixed(1)} 30,${(80 + 300 * Math.tan(A_INC)).toFixed(1)}" class="bf-sc-obj"/>`;
  const brique = () => `<polygon points="${[sur(-34, 0), sur(34, 0), sur(34, 40), sur(-34, 40)].map(p => p.join(',')).join(' ')}" class="bf-sc-sys"/>`;
  // longueurs : celle du poids (longueur par défaut des flèches), et ses composantes sur le plan incliné
  const LP = 58, L_RN_INC = +(LP * Math.cos(A_INC)).toFixed(1), L_F_INC = +(LP * Math.sin(A_INC)).toFixed(1);
  const SPEC_INC = [{ label: '⊥ perpendiculaire au support', court: '⊥ au support', ang: 65 }, { label: '∥ au support, vers le haut de la pente', court: '∥ vers le haut', ang: 155 }, { label: '∥ au support, vers le bas de la pente', court: '∥ vers le bas', ang: 335 }];
  const skieur = () => {
    const a = sur(-30, 0), b = sur(30, 0), k = sur(0, 4), h = sur(0, 30), t = sur(0, 38), m = sur(0, 22), bt = sur(14, 2);
    return `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" class="bf-sc-ski"/><line x1="${k[0]}" y1="${k[1]}" x2="${h[0]}" y2="${h[1]}" class="bf-sc-corps"/>` +
      `<circle cx="${t[0]}" cy="${t[1]}" r="6.5" class="bf-sc-sys"/><line x1="${m[0]}" y1="${m[1]}" x2="${bt[0]}" y2="${bt[1]}" class="bf-sc-corps fin"/>`;
  };
  const fil = (x1, y1, x2, y2) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="bf-sc-fil"/>`;
  const support = (x, y, w) => `<rect x="${x}" y="${y}" width="${w}" height="10" class="bf-sc-obj"/>` + Array.from({ length: Math.floor(w / 12) }, (_, k) => `<line x1="${x + 6 + k * 12}" y1="${y}" x2="${x + k * 12}" y2="${y - 6}" class="bf-sc-hach"/>`).join('');
  const aimant = (x, y, sys) => `<g class="${sys ? 'bf-sc-sys' : 'bf-sc-obj'}"><rect x="${x}" y="${y}" width="84" height="30"/><line x1="${x + 42}" y1="${y}" x2="${x + 42}" y2="${y + 30}"/></g>` +
    txt(x + 21, y + 20, 'N', 'middle') + txt(x + 63, y + 20, 'S', 'middle');
  // point d'un cercle de centre c, de rayon r, vers le point o
  const versPt = (c, r, o) => { const dx = o[0] - c[0], dy = o[1] - c[1], l = Math.hypot(dx, dy); return [+(c[0] + r * dx / l).toFixed(1), +(c[1] + r * dy / l).toFixed(1)]; };
  const angVers = (a, b) => +(Math.atan2(a[1] - b[1], b[0] - a[0]) * 180 / Math.PI).toFixed(1);

  /* ---------- acteurs et distracteurs ---------- */
  const TERRE = { id: 'terre', nom: 'la Terre', pourquoi: 'elle attire le système, à distance (le poids)', manque: 'La Terre attire <b>toujours</b> le système : n\'oublie pas le poids.' };
  // l'air touche toujours le système (sauf dans le vide ou dans un liquide) : c'est un acteur, de contact
  const AIR = { id: 'air', nom: 'l\'air', pourquoi: 'il touche toujours le système (force souvent négligeable)', manque: 'L\'air touche toujours le système : il exerce toujours une force de contact (souvent négligeable).' };
  const NEGL = r => ({ neglige: true, raison: r || 'Pas de grande vitesse ni de grande surface (frottements faibles), et le système n\'est pas très léger pour son volume (poussée d\'Archimède faible) : on néglige la force de l\'air.' });
  const touche = (id, nom, sys) => ({ id, nom, pourquoi: `elle touche ${sys}`, manque: `${nom.charAt(0).toUpperCase() + nom.slice(1)} touche ${sys} : elle exerce une force de contact.` });
  const touche2 = (id, nom, sys) => ({ id, nom, pourquoi: `il touche ${sys}`, manque: `${nom.charAt(0).toUpperCase() + nom.slice(1)} touche ${sys} : il exerce une force de contact.` });

  /* ---------- forces fréquentes ---------- */
  const POIDS = { acteur: 'terre', type: 'distance', lib: 'force exercée par la Terre', pts: ['G'], angs: [270], noms: ['P'], diagDir: 'le poids est <b>vertical, vers le bas</b>.', indNom: `La force exercée par la Terre est le poids ${nomV('P')}.` };
  const RN_HORIZ = (acteur, lib, avecR) => ({ acteur, type: 'contact', lib, pts: ['A'], angs: [90], noms: avecR ? ['RN', 'R'] : ['RN'],
    diagDir: 'la réaction normale est <b>perpendiculaire au support</b> : ici, verticale vers le haut.', indNom: `La réaction perpendiculaire au support se note ${nomV('RN')} (N comme normale).` });
  const RN_INC = acteur => ({ acteur, type: 'contact', lib: `réaction perpendiculaire de la ${acteur === 'piste' ? 'piste' : 'planche'}`, pts: ['A'], angs: [65], noms: ['RN'], L: L_RN_INC,
    diagDir: 'la réaction normale est <b>perpendiculaire au support</b>, même quand il est incliné : choisis « perpendiculaire au support ».', indNom: `La réaction perpendiculaire au support se note ${nomV('RN')}.` });
  // frottements qui retiennent la brique immobile (P sin 25°) ; plus faibles quand elle glisse en accélérant (L: 14)
  const F_INC = acteur => ({ acteur, type: 'contact', lib: `frottement de la ${acteur === 'piste' ? 'piste' : 'planche'}`, pts: ['A'], angs: [155], noms: ['f'], L: L_F_INC,
    diagDir: 'les frottements s\'opposent au glissement : sans eux, le système glisserait vers le bas de la pente, donc <span class="vec-nom">f</span> est <b>parallèle au support, vers le haut de la pente</b>.', indNom: `Les frottements se notent ${nomV('f')}.` });
  const NOMS_BASE = ['P', 'RN', 'R', 'f', 'T', 'Farchi'];

  const S = {};

  /* ===== brique sur une planche horizontale ===== */
  S.brique = { id: 'brique', titre: 'Brique sur une planche horizontale', systeme: 'la brique', enonce: 'Une brique est posée, immobile, sur une planche horizontale.',
    dessin: `<rect x="40" y="170" width="280" height="12" class="bf-sc-obj"/>${txt(48, 200, 'planche')}<rect x="140" y="118" width="80" height="52" class="bf-sc-sys"/>`,
    points: { G: [180, 144], A: [180, 170] }, nomsPts: { G: 'centre de la brique', A: 'contact avec la planche' },
    acteurs: [TERRE, touche('planche', 'la planche', 'la brique'), AIR], air: NEGL(),
    distracteurs: [{ id: 'table', nom: 'la table', diag: 'La table ne touche pas la brique : c\'est la planche qui la porte.' }],
    forces: [POIDS, RN_HORIZ('planche', 'force exercée par la planche', true)], nomsProposes: NOMS_BASE,
    comp: { bonne: 'oui', expl: `${nomV('P')} et ${nomV('RN')} ont la même direction, des sens opposés et la même valeur : elles se compensent, la brique reste immobile.`, indice: 'La brique est immobile : ses deux forces s\'annulent.' } };

  /* ===== masse suspendue à un ressort ===== */
  const zig = (() => { let d = 'M180,26 L180,34'; for (let k = 0; k < 8; k++) d += ` L${k % 2 ? 190 : 170},${38 + k * 8.5}`; return d + ' L180,108 L180,112'; })();
  S.ressort = { id: 'ressort', titre: 'Masse suspendue à un ressort', systeme: 'la masse', enonce: 'Une masse est accrochée, immobile, au bout d\'un ressort fixé à une potence.',
    dessin: `<rect x="70" y="18" width="10" height="212" class="bf-sc-obj"/><rect x="70" y="18" width="122" height="8" class="bf-sc-obj"/><rect x="40" y="226" width="80" height="8" class="bf-sc-obj"/>` +
      `<path d="${zig}" class="bf-sc-ressort"/><rect x="158" y="112" width="44" height="44" class="bf-sc-sys"/>${txt(206, 70, 'ressort')}${txt(30, 216, 'potence')}`,
    points: { G: [180, 134], A: [180, 112] }, nomsPts: { G: 'centre de la masse', A: 'accroche du ressort' },
    acteurs: [TERRE, touche2('ressort', 'le ressort', 'la masse'), AIR], air: NEGL(),
    distracteurs: [{ id: 'potence', nom: 'la potence', diag: 'La potence ne touche pas la masse : c\'est le ressort qui la tient.' }],
    forces: [POIDS, { acteur: 'ressort', type: 'contact', lib: 'force exercée par le ressort', pts: ['A'], angs: [90], noms: ['T'], diagDir: 'le ressort retient la masse : sa force est <b>verticale, vers le haut</b>.', indNom: `La force d'un ressort tendu (ou d'un fil) se note ${nomV('T')} (tension).` }],
    nomsProposes: NOMS_BASE,
    comp: { bonne: 'oui', expl: `La masse est immobile : ${nomV('P')} et ${nomV('T')} se compensent.`, indice: 'La masse est immobile.' } };

  /* ===== pendule ===== */
  const O_P = [150, 24], C_P = [226, 150], A_P = versPt(C_P, 16, O_P), T_P = angVers(A_P, O_P);
  S.pendule = { id: 'pendule', titre: 'Pendule', systeme: 'la boule', enonce: 'Une boule est accrochée au bout d\'un fil ; le pendule oscille. On l\'étudie quand il est écarté de la verticale.',
    dessin: `<rect x="105" y="14" width="90" height="10" class="bf-sc-obj"/>${fil(O_P[0], O_P[1], A_P[0], A_P[1])}<line x1="150" y1="24" x2="150" y2="190" class="bf-sc-verticale"/>` +
      `<circle cx="${C_P[0]}" cy="${C_P[1]}" r="16" class="bf-sc-sys"/>${txt(102, 46, 'point d\'attache')}`,
    points: { G: C_P, A: A_P }, nomsPts: { G: 'centre de la boule', A: 'accroche du fil' },
    acteurs: [TERRE, touche2('fil', 'le fil', 'la boule'), AIR], air: NEGL('Le pendule oscille lentement : on néglige la force de l\'air.'),
    distracteurs: [{ id: 'support', nom: 'le support', diag: 'Le support ne touche pas la boule : c\'est le fil qui la tient.' }],
    forces: [POIDS, { acteur: 'fil', type: 'contact', lib: 'force exercée par le fil', pts: ['A'], angs: [T_P], noms: ['T'], diagDir: 'un fil tire <b>le long du fil, vers le point d\'attache</b>.', indNom: `La force exercée par un fil se note ${nomV('T')} (tension).` }],
    speciales: [{ label: 'le long du fil, vers le point d\'attache', court: 'fil → attache', ang: T_P }, { label: 'le long du fil, vers la boule', court: 'fil → boule', ang: T_P - 180 }], nomsProposes: NOMS_BASE,
    comp: { bonne: 'non', expl: `${nomV('P')} et ${nomV('T')} ne sont pas sur la même droite : elles ne peuvent pas se compenser. Le pendule ne reste pas immobile : il revient vers la verticale.`, indice: 'Deux forces qui se compensent ont la même direction ; regarde les deux flèches.' } };

  /* ===== balle lancée ===== */
  S.balle = { id: 'balle', titre: 'Balle lancée', systeme: 'la balle', enonce: 'Une balle vient d\'être lancée vers le haut : elle a quitté la main. On néglige les frottements de l\'air.',
    dessin: `<path d="M160,178 Q186,96 210,74" class="bf-sc-mvt"/>${main(118, 196)}<circle cx="220" cy="64" r="14" class="bf-sc-sys"/>${sol(20, 340, 226)}`,
    points: { G: [220, 64] }, nomsPts: { G: 'centre de la balle' },
    acteurs: [TERRE, AIR], air: NEGL('L\'énoncé le dit : on néglige les frottements de l\'air (et la balle n\'est pas très légère pour son volume).'),
    distracteurs: [{ id: 'main', nom: 'la main', diag: 'La main ne touche plus la balle : elle n\'exerce plus de force.' }, { id: 'sol', nom: 'le sol', diag: 'Le sol ne touche pas la balle.' }],
    forces: [POIDS], nomsProposes: ['P', 'F', 'T', 'f'],
    comp: { bonne: 'non', expl: `Une seule force, ${nomV('P')} : rien ne la compense. La balle ne monte pas en ligne droite à vitesse constante : elle ralentit, puis retombe.`, indice: 'Il n\'y a qu\'une seule force.' } };

  /* ===== bouchon qui flotte ===== */
  S.bouchon = { id: 'bouchon', titre: 'Bouchon qui flotte', systeme: 'le bouchon', enonce: 'Un bouchon en liège flotte, immobile, à la surface de l\'eau.',
    dessin: `<rect x="92" y="120" width="176" height="90" class="bf-sc-eau"/><path d="M90,70 V212 H270 V70" class="bf-sc-recip"/><rect x="150" y="96" width="60" height="44" class="bf-sc-sys"/>${txt(100, 200, 'eau')}`,
    points: { G: [180, 118], A: [180, 140] }, nomsPts: { G: 'centre du bouchon', A: 'centre de la face du dessous' },
    acteurs: [TERRE, { id: 'eau', nom: 'l\'eau', pourquoi: 'elle touche le bouchon (poussée d\'Archimède)', manque: 'L\'eau touche le bouchon : elle exerce une force de contact (elle le pousse vers le haut).' }, AIR],
    air: NEGL('La partie hors de l\'eau touche l\'air, mais la poussée d\'Archimède de l\'air est très faible devant celle de l\'eau : on néglige la force de l\'air.'),
    distracteurs: [{ id: 'recipient', nom: 'le récipient', diag: 'Le récipient ne touche pas le bouchon.' }],
    forces: [POIDS, { acteur: 'eau', type: 'contact', lib: 'force exercée par l\'eau', pts: ['G', 'A'], angs: [90], noms: ['Farchi'], diagDir: 'la poussée d\'Archimède est <b>verticale, vers le haut</b>.', diagPt: 'l\'eau touche toute la partie immergée : on dessine la poussée depuis le centre G (ou le centre de la face immergée A).', indNom: `La force verticale vers le haut exercée par un fluide est la poussée d'Archimède ${nomV('Farchi')}.` }],
    nomsProposes: NOMS_BASE,
    comp: { bonne: 'oui', expl: `Le bouchon est immobile : ${nomV('P')} et ${nomV('Farchi')} se compensent.`, indice: 'Le bouchon est immobile.' } };

  /* ===== goutte dans l'huile ===== */
  S.goutte = { id: 'goutte', titre: 'Goutte qui tombe dans l\'huile', systeme: 'la goutte', enonce: 'Une goutte de permanganate de potassium tombe dans l\'huile, à vitesse constante.',
    dessin: `<rect x="152" y="40" width="56" height="180" class="bf-sc-eau"/><path d="M150,20 V214 Q150,222 158,222 H202 Q210,222 210,214 V20" class="bf-sc-recip"/><circle cx="180" cy="110" r="9" class="bf-sc-sys"/>${mvt(232, 92, 232, 140, '')}${txt(240, 120, 'chute')}${txt(218, 200, 'huile')}`,
    points: { G: [180, 110] }, nomsPts: { G: 'centre de la goutte' },
    acteurs: [TERRE, { id: 'huile', nom: 'l\'huile', pourquoi: 'elle touche la goutte (poussée d\'Archimède et frottements)', manque: 'L\'huile touche la goutte : elle exerce une force de contact (qu\'on sépare en poussée d\'Archimède et frottements).' }],
    distracteurs: [{ id: 'eprouvette', nom: 'l\'éprouvette', diag: 'L\'éprouvette ne touche pas la goutte.' }, { id: 'air', nom: 'l\'air', diag: 'La goutte est dans l\'huile : l\'air ne la touche pas.' }],
    forces: [POIDS, { acteur: 'huile', type: 'contact', lib: 'poussée d\'Archimède de l\'huile', pts: ['G'], angs: [90], noms: ['Farchi'], L: 22, diagDir: 'la poussée d\'Archimède est <b>verticale, vers le haut</b>.', diagPt: 'l\'huile entoure toute la goutte : on dessine la force depuis le centre G.', indNom: `La poussée d'Archimède d'un fluide se note ${nomV('Farchi')}.` },
      { acteur: 'huile', type: 'contact', lib: 'frottement de l\'huile', pts: ['G'], angs: [90], noms: ['f'], L: 36, diagDir: 'les frottements s\'opposent au mouvement : la goutte descend, <span class="vec-nom">f</span> est <b>vertical, vers le haut</b>.', diagPt: 'l\'huile entoure toute la goutte : on dessine la force depuis le centre G.', indNom: `Les frottements se notent ${nomV('f')}.` }],
    nomsProposes: NOMS_BASE,
    comp: { q: 'La goutte descend à vitesse constante, en ligne droite. Ces forces se compensent-elles ?', bonne: 'oui', expl: `Mouvement rectiligne uniforme : d'après le principe d'inertie, ${nomV('P')} + ${nomV('Farchi')} + ${nomV('f')} = <span class="vec-nom">0</span>. L'huile exerce une seule action, qu'on sépare en deux forces.`, indice: 'Mouvement rectiligne à vitesse constante : pense au principe d\'inertie.' } };

  /* ===== brique immobile sur une planche inclinée ===== */
  const G_INC = sur(0, 20);
  S.incline = { id: 'incline', titre: 'Brique immobile sur une planche inclinée', systeme: 'la brique', enonce: 'Une brique est posée sur une planche inclinée ; elle reste immobile.',
    dessin: `${plan()}${brique()}${txt(50, 214, 'planche inclinée')}`,
    points: { G: G_INC, A: AI.map(v => +v.toFixed(1)) }, nomsPts: { G: 'centre de la brique', A: 'contact avec la planche' },
    acteurs: [TERRE, touche('planche', 'la planche', 'la brique'), AIR], air: NEGL(),
    forces: [POIDS, RN_INC('planche'), F_INC('planche')], speciales: SPEC_INC, nomsProposes: NOMS_BASE,
    comp: { bonne: 'oui', expl: `La brique est immobile : la réaction de la planche ${nomV('R')} = ${nomV('RN')} + ${nomV('f')} compense le poids. Sans frottements, elle glisserait.`, indice: 'La brique reste immobile.' } };

  /* ===== brique qui glisse ===== */
  const m1 = sur(-24, 58), m2 = sur(38, 58);
  S.glisse = { id: 'glisse', titre: 'Brique qui glisse sur une planche inclinée', systeme: 'la brique', enonce: 'Une brique glisse vers le bas d\'une planche inclinée, de plus en plus vite.',
    dessin: `${plan()}${brique()}${mvt(m1[0], m1[1], m2[0], m2[1], '')}${txt(m2[0] + 6, m2[1] - 6, 'glisse')}${txt(50, 214, 'planche inclinée')}`,
    points: { G: G_INC, A: AI.map(v => +v.toFixed(1)) }, nomsPts: { G: 'centre de la brique', A: 'contact avec la planche' },
    acteurs: [TERRE, touche('planche', 'la planche', 'la brique'), AIR], air: NEGL(),
    forces: [POIDS, RN_INC('planche'), Object.assign(F_INC('planche'), { L: 14, diagDir: 'les frottements s\'opposent au glissement : la brique glisse vers le bas, <span class="vec-nom">f</span> est <b>parallèle au support, vers le haut de la pente</b>.' })],
    speciales: SPEC_INC, nomsProposes: NOMS_BASE,
    comp: { bonne: 'non', expl: 'La brique accélère : les forces ne se compensent pas ; leur somme est dirigée vers le bas de la pente.', indice: 'La brique glisse de plus en plus vite.' } };

  /* ===== aimant posé près d'un autre aimant ===== */
  S.aimants = { id: 'aimants', titre: 'Aimant posé près d\'un autre aimant', systeme: 'l\'aimant de gauche', enonce: 'Deux aimants sont posés sur une table ; ils s\'attirent, mais l\'aimant de gauche reste immobile.',
    dessin: `<rect x="30" y="170" width="300" height="10" class="bf-sc-obj"/>${aimant(86, 140, true)}${aimant(214, 140, false)}${txt(40, 202, 'table')}${txt(214, 130, 'aimant de droite')}`,
    points: { G: [128, 155], A: [128, 170] }, nomsPts: { G: 'centre de l\'aimant de gauche', A: 'contact avec la table' },
    acteurs: [TERRE, { id: 'aimant', nom: 'l\'aimant de droite', court: 'aimant (droite)', pourquoi: 'il attire l\'aimant de gauche, à distance', manque: 'L\'aimant de droite attire l\'aimant de gauche, sans le toucher : force magnétique, à distance.' }, touche('table', 'la table', 'l\'aimant'), AIR],
    air: NEGL(), sysCourt: 'aimant (gauche)',
    forces: [POIDS, { acteur: 'aimant', type: 'distance', lib: 'force exercée par l\'aimant de droite', pts: ['G'], angs: [0], noms: ['Fmag'], diagDir: 'les deux aimants s\'attirent (pôles S et N face à face) : la force est dirigée <b>vers l\'aimant de droite</b>.', indNom: `La force exercée par un aimant se note ${nomV('Fmag')}.` },
      RN_HORIZ('table', 'réaction perpendiculaire de la table'),
      { acteur: 'table', type: 'contact', lib: 'frottement de la table', pts: ['A'], angs: [180], noms: ['f'], diagDir: 'l\'aimant reste immobile : les frottements de la table s\'opposent au glissement qu\'il aurait vers l\'autre aimant, donc <b>vers la gauche</b>.', indNom: `Les frottements se notent ${nomV('f')}.` }],
    nomsProposes: ['P', 'RN', 'f', 'T', 'Fmag', 'Felec'],
    comp: { bonne: 'oui', expl: `L'aimant est immobile : ${nomV('P')} et ${nomV('RN')} se compensent, ${nomV('Fmag')} et ${nomV('f')} aussi.`, indice: 'L\'aimant reste immobile.' } };

  /* ===== boule d'aluminium et bâton d'ébonite frotté ===== */
  const O_B = [120, 24], C_B = [190, 140], A_B = versPt(C_B, 10, O_B), T_B = angVers(A_B, O_B);
  // T⃗ compense à la fois le poids (verticalement) et la force électrique (horizontalement)
  const L_T_B = +(LP / Math.sin(T_B * Math.PI / 180)).toFixed(1), L_FE_B = +(-L_T_B * Math.cos(T_B * Math.PI / 180)).toFixed(1);
  S.ebonite = { id: 'ebonite', titre: 'Boule d\'aluminium attirée par un bâton d\'ébonite frotté', systeme: 'la boule', enonce: 'Une boule d\'aluminium, suspendue à un fil, est attirée par un bâton d\'ébonite frotté (électrisé) ; elle reste immobile, déviée.',
    dessin: `<rect x="80" y="14" width="90" height="10" class="bf-sc-obj"/>${fil(O_B[0], O_B[1], A_B[0], A_B[1])}<line x1="120" y1="24" x2="120" y2="180" class="bf-sc-verticale"/><circle cx="${C_B[0]}" cy="${C_B[1]}" r="10" class="bf-sc-sys"/>` +
      `<rect x="226" y="135" width="110" height="10" rx="4" class="bf-sc-obj"/>${txt(281, 128, '− − − −', 'middle')}${txt(281, 166, 'bâton frotté', 'middle')}`,
    points: { G: C_B, A: A_B }, nomsPts: { G: 'centre de la boule', A: 'accroche du fil' },
    acteurs: [TERRE, touche2('fil', 'le fil', 'la boule'), { id: 'baton', nom: 'le bâton frotté', pourquoi: 'il attire la boule, à distance (force électrique)', manque: 'Le bâton frotté attire la boule sans la toucher : force électrique, à distance.' }, AIR],
    air: NEGL('La boule est immobile et pas très légère pour son volume : on néglige la force de l\'air.'),
    distracteurs: [{ id: 'support', nom: 'le support', diag: 'Le support ne touche pas la boule : c\'est le fil qui la tient.' }],
    forces: [POIDS, { acteur: 'fil', type: 'contact', lib: 'force exercée par le fil', pts: ['A'], angs: [T_B], noms: ['T'], L: L_T_B, diagDir: 'un fil tire <b>le long du fil, vers le point d\'attache</b>.', indNom: `La force exercée par un fil se note ${nomV('T')}.` },
      { acteur: 'baton', type: 'distance', lib: 'force exercée par le bâton', pts: ['G'], angs: [0], noms: ['Felec'], L: L_FE_B, diagDir: 'le bâton attire la boule : la force est dirigée <b>vers le bâton</b>, horizontale vers la droite.', indNom: `La force exercée par un objet électrisé se note ${nomV('Felec')}.` }],
    speciales: [{ label: 'le long du fil, vers le point d\'attache', court: 'fil → attache', ang: T_B }], nomsProposes: ['P', 'RN', 'f', 'T', 'Fmag', 'Felec'],
    comp: { bonne: 'oui', expl: `La boule est immobile : ${nomV('P')} + ${nomV('T')} + ${nomV('Felec')} = <span class="vec-nom">0</span> (trois forces qui se compensent).`, indice: 'La boule reste immobile.' } };

  /* ===== clou attiré par un aimant ===== */
  S.clou = { id: 'clou', titre: 'Clou attiré par un aimant', systeme: 'le clou', enonce: 'Un clou, posé sur le sol, est attiré par un aimant placé au-dessus de lui, sur la gauche ; il reste incliné, immobile.',
    dessin: `<rect x="60" y="30" width="70" height="26" class="bf-sc-obj"/>${txt(95, 48, 'aimant', 'middle')}${sol(190, 320, 210)}<line x1="250" y1="210" x2="204" y2="140" class="bf-sc-clou"/><line x1="198.2" y1="143.8" x2="209.8" y2="136.2" class="bf-sc-clou"/>`,
    points: { G: [227, 175], A: [250, 210] }, nomsPts: { G: 'centre du clou', A: 'contact avec le sol' },
    acteurs: [TERRE, { id: 'aimant', nom: 'l\'aimant', pourquoi: 'il attire le clou, à distance', manque: 'L\'aimant attire le clou sans le toucher : force magnétique, à distance.' }, touche2('sol', 'le sol', 'le clou'), AIR],
    air: NEGL(),
    forces: [POIDS, { acteur: 'aimant', type: 'distance', lib: 'force exercée par l\'aimant', pts: ['G'], angs: [135], noms: ['Fmag'], L: 41, diagDir: 'l\'aimant attire le clou : la force est dirigée <b>vers l\'aimant</b>, en haut à gauche.', indNom: `La force exercée par un aimant se note ${nomV('Fmag')}.` },
      { acteur: 'sol', type: 'contact', lib: 'réaction du sol', pts: ['A'], angs: [45, 90], noms: ['R', 'RN'], L: 41, diagDir: 'le sol empêche le clou de s\'enfoncer et le retient de glisser vers l\'aimant : sa réaction est dirigée <b>vers le haut et la droite</b> (on accepte aussi verticale, vers le haut).', indNom: `La réaction du sol se note ${nomV('R')}.` }],
    nomsProposes: ['P', 'R', 'f', 'T', 'Fmag', 'Felec'] };

  /* ===== voiture au démarrage ===== */
  S.voiture = { id: 'voiture', titre: 'Voiture au démarrage (traction avant)', systeme: 'la voiture', lf: 46, enonce: 'Une voiture à traction avant (les roues avant sont motrices) démarre vers la droite.',
    dessin: `<path d="M58,192 L58,160 Q60,150 74,148 L122,144 L146,120 Q151,115 161,115 L228,115 Q238,115 246,122 L270,145 L296,150 Q306,152 306,165 L306,192 Z" class="bf-sc-sys"/>` +
      `<path d="M152,124 L194,124 L194,142 L134,142 Z M202,124 L236,124 L254,142 L202,142 Z" class="bf-sc-vitre"/><circle cx="110" cy="192" r="18" class="bf-sc-roue"/><circle cx="250" cy="192" r="18" class="bf-sc-roue"/>${sol(20, 340, 210)}` +
      `${mvt(140, 70, 230, 70, '')}${txt(234, 74, 'démarre')}${txt(110, 234, 'arrière', 'middle')}${txt(250, 234, 'avant', 'middle')}`,
    points: { G: [204, 150], B: [110, 210], A: [250, 210] }, nomsPts: { G: 'centre de gravité (moteur à l\'avant)', B: 'contact roue arrière-route', A: 'contact roue avant-route' },
    acteurs: [TERRE, touche('route', 'la route', 'les roues'), Object.assign({}, AIR, { pourquoi: 'il touche la carrosserie et la freine (frottements)' })],
    air: { neglige: false, cause: 'frottements', raison: 'Une voiture a une grande surface face à l\'air, et sa vitesse augmente : les frottements de l\'air ne sont pas négligeables.', indice: 'Une voiture qui roule a une grande surface face à l\'air : ses frottements comptent.' },
    distracteurs: [{ id: 'moteur', nom: 'le moteur', diag: 'Le moteur fait partie de la voiture (le système) : il n\'exerce pas de force extérieure. C\'est la route qui pousse les roues motrices vers l\'avant.' },
      { id: 'conducteur', nom: 'le conducteur', diag: 'Le conducteur est dans la voiture : il fait partie du système.' }],
    forces: [POIDS,
      { acteur: 'route', type: 'contact', lib: 'route sur les roues avant : réaction perpendiculaire', pts: ['A'], angs: [90], noms: ['RN'], L: 26, diagDir: 'la réaction normale est <b>perpendiculaire à la route</b> : verticale, vers le haut.', diagPt: 'les roues avant touchent la route au point A.', indNom: `La réaction perpendiculaire au support se note ${nomV('RN')}.` },
      { acteur: 'route', type: 'contact', lib: 'route sur les roues avant (motrices) : frottement', pts: ['A'], angs: [0], noms: ['Fm', 'f'], diagDir: 'les roues motrices poussent la route vers l\'arrière ; la route les pousse donc <b>vers l\'avant</b> : c\'est la force motrice.', diagPt: 'les roues avant (motrices) touchent la route au point A.', indNom: `Ce frottement de la route sur les roues motrices fait avancer la voiture : c'est la force motrice ${nomV('Fm')} (on peut aussi l'appeler ${nomV('f')}, frottement).` },
      { acteur: 'route', type: 'contact', lib: 'route sur les roues arrière : réaction perpendiculaire', pts: ['B'], angs: [90], noms: ['RN'], cote: -1, L: 20, diagDir: 'la réaction normale est <b>perpendiculaire à la route</b> : verticale, vers le haut.', diagPt: 'les roues arrière touchent la route au point B.', indNom: `La réaction perpendiculaire au support se note ${nomV('RN')}.` },
      { acteur: 'route', type: 'contact', lib: 'route sur les roues arrière : frottement', pts: ['B'], angs: [180], noms: ['f'], L: 14, diagDir: 'sur les roues arrière (non motrices), les frottements de la route s\'opposent au mouvement : <b>vers l\'arrière</b>.', diagPt: 'les roues arrière touchent la route au point B.', indNom: `Les frottements se notent ${nomV('f')}.` },
      { acteur: 'air', type: 'contact', lib: 'force de l\'air (frottements)', pts: ['G'], angs: [180], noms: ['Fair', 'f'], L: 18, diagDir: 'les frottements de l\'air s\'opposent au mouvement : <b>vers l\'arrière</b>.', diagPt: 'l\'air touche toute la carrosserie : on dessine sa force depuis le centre G.', indNom: `La force de l'air (ses frottements) se note ${nomV('Fair')}.` }],
    nomsProposes: ['P', 'RN', 'f', 'Fair', 'Fm', 'Farchi'],
    comp: { bonne: 'non', expl: 'La voiture accélère : les forces ne se compensent pas ; leur somme est dirigée vers l\'avant.', indice: 'La voiture démarre : sa vitesse augmente.' } };

  /* ===== livre tiré par une corde (ajouté) ===== */
  S.livre = { id: 'livre', titre: 'Livre que l\'on tire avec une corde', systeme: 'le livre', enonce: 'On tire un livre avec une corde horizontale : il glisse sur la table, en ligne droite, à vitesse constante.',
    dessin: `<rect x="30" y="170" width="300" height="10" class="bf-sc-obj"/><rect x="120" y="138" width="96" height="32" rx="3" class="bf-sc-sys"/>${fil(216, 154, 316, 154)}${main(312, 154)}${mvt(132, 118, 206, 118, '')}${txt(212, 122, 'glisse')}${txt(40, 202, 'table')}${txt(262, 146, 'corde', 'middle')}`,
    points: { G: [168, 154], A: [168, 170], B: [216, 154] }, nomsPts: { G: 'centre du livre', A: 'contact avec la table', B: 'accroche de la corde' },
    acteurs: [TERRE, touche('table', 'la table', 'le livre'), touche('corde', 'la corde', 'le livre'), AIR], air: NEGL(),
    distracteurs: [{ id: 'main', nom: 'la main', diag: 'La main tient la corde mais ne touche pas le livre : c\'est la corde qui le tire.' }],
    forces: [POIDS, RN_HORIZ('table', 'réaction perpendiculaire de la table'),
      { acteur: 'table', type: 'contact', lib: 'frottement de la table', pts: ['A'], angs: [180], noms: ['f'], diagDir: 'les frottements s\'opposent au glissement du livre vers la droite : <b>vers la gauche</b>.', indNom: `Les frottements se notent ${nomV('f')}.` },
      { acteur: 'corde', type: 'contact', lib: 'force exercée par la corde', pts: ['B'], angs: [0], noms: ['F', 'T'], diagDir: 'la corde tire le livre <b>le long de la corde</b>, vers la droite.', diagPt: 'la corde touche le livre au point B.', indNom: `La force de la corde se note ${nomV('F')} (ou ${nomV('T')}, tension).` }],
    nomsProposes: ['P', 'RN', 'f', 'F', 'Fm', 'Farchi'],
    comp: { bonne: 'oui', expl: `Mouvement rectiligne uniforme : les forces se compensent (${nomV('P')} et ${nomV('RN')} ; ${nomV('F')} et ${nomV('f')}).`, indice: 'Le livre va en ligne droite à vitesse constante : pense au principe d\'inertie.' } };

  /* ===== skieur avec frottements (ajouté) ===== */
  const G_SKI = sur(0, 20);
  S.skieur = { id: 'skieur', titre: 'Skieur qui descend une piste, avec frottements', systeme: 'le skieur', enonce: 'Un skieur descend une piste droite en prenant de la vitesse. On néglige l\'action de l\'air.',
    dessin: `${plan()}${skieur()}${txt(50, 214, 'piste')}`,
    points: { G: G_SKI, A: AI.map(v => +v.toFixed(1)) }, nomsPts: { G: 'centre du skieur', A: 'contact skis-neige' },
    acteurs: [TERRE, touche('piste', 'la piste', 'les skis'), AIR], air: NEGL('L\'énoncé le dit : on néglige l\'action de l\'air.'),
    distracteurs: [{ id: 'teleski', nom: 'le téléski', diag: 'Le skieur a lâché le téléski : il ne le touche plus.' }],
    forces: [POIDS, RN_INC('piste'), Object.assign(F_INC('piste'), { L: 14, diagDir: 'les frottements de la neige s\'opposent au glissement vers le bas : <b>parallèles au support, vers le haut de la pente</b>.' })],
    speciales: SPEC_INC, nomsProposes: NOMS_BASE,
    comp: { bonne: 'non', expl: 'Le skieur accélère : les forces ne se compensent pas ; leur somme est dirigée vers le bas de la pente.', indice: 'Le skieur prend de la vitesse.' } };

  /* ===== parachutiste (ajouté) ===== */
  S.parachute = { id: 'parachute', titre: 'Parachutiste à vitesse constante', systeme: 'le parachutiste et son parachute', sysCourt: 'parachutiste', enonce: 'Un parachutiste, parachute ouvert, descend verticalement à vitesse constante.',
    // dessin descendu de 20 px et flèches plus courtes : la force de l'air, depuis le parachute, reste dans le cadre
    lf: 46, dessin: `<g transform="translate(0,20)"><path d="M110,82 Q180,0 250,82 Q215,70 180,76 Q145,70 110,82 Z" class="bf-sc-sys"/>${fil(112, 82, 180, 150)}${fil(248, 82, 180, 150)}${fil(180, 76, 180, 150)}` +
      `<circle cx="180" cy="148" r="7" class="bf-sc-sys"/><path d="M180,155 V184 M180,184 L172,202 M180,184 L188,202 M180,162 L168,152 M180,162 L192,152" class="bf-sc-corps"/>${mvt(276, 110, 276, 170, '')}${txt(284, 144, 'descend')}</g>`,
    points: { G: [180, 188], C: [180, 70] }, nomsPts: { G: 'centre du parachutiste', C: 'centre du parachute' },
    acteurs: [TERRE, Object.assign({}, AIR, { pourquoi: 'il touche le parachute et freine la chute (frottements)' })],
    air: { neglige: false, cause: 'frottements', raison: 'Le parachute a une très grande surface : les frottements de l\'air ne sont pas négligeables, ce sont eux qui freinent la chute.', indice: 'Qu\'est-ce qui freine la chute du parachutiste ?' },
    distracteurs: [{ id: 'avion', nom: 'l\'avion', diag: 'Le parachutiste a quitté l\'avion : l\'avion ne le touche plus.' }, { id: 'sol', nom: 'le sol', diag: 'Le parachutiste n\'a pas encore atteint le sol.' }],
    forces: [POIDS, { acteur: 'air', type: 'contact', lib: 'force de l\'air (frottements)', pts: ['C', 'G'], angs: [90], noms: ['Fair', 'f'], diagDir: 'les frottements de l\'air freinent la chute : <b>verticaux, vers le haut</b>.', diagPt: 'l\'air agit surtout sur le parachute : on dessine la force depuis le parachute C (ou depuis G).', indNom: `La force de l'air (ses frottements) se note ${nomV('Fair')}.` }],
    nomsProposes: ['P', 'RN', 'f', 'T', 'Farchi', 'Fair'],
    comp: { bonne: 'oui', expl: `Mouvement rectiligne uniforme : d'après le principe d'inertie, ${nomV('P')} et ${nomV('Fair')} se compensent.`, indice: 'Il descend en ligne droite à vitesse constante.' } };

  /* ===== palet d'air-hockey (cours) ===== */
  S.palet = { id: 'palet', titre: 'Palet d\'air-hockey', systeme: 'le palet', enonce: 'Un palet glisse sur une table d\'air-hockey : un coussin d\'air supprime les frottements.',
    dessin: `<rect x="30" y="170" width="300" height="10" class="bf-sc-obj"/><rect x="148" y="154" width="64" height="16" rx="7" class="bf-sc-sys"/>${mvt(150, 132, 220, 132, '')}${txt(226, 136, 'glisse')}${txt(40, 202, 'table (coussin d\'air)')}`,
    points: { G: [180, 160], A: [180, 170] }, nomsPts: { G: 'centre du palet', A: 'contact avec la table' },
    acteurs: [TERRE, touche('table', 'la table', 'le palet'), AIR], air: NEGL('Le coussin d\'air fait partie de l\'action de la table ; l\'air autour du palet le freine très peu : on néglige sa force.'),
    distracteurs: [{ id: 'crosse', nom: 'la crosse', diag: 'La crosse a frappé le palet, mais elle ne le touche plus.' }],
    forces: [POIDS, RN_HORIZ('table', 'force exercée par la table', true)], nomsProposes: NOMS_BASE,
    comp: { bonne: 'oui', expl: `${nomV('RN')} et ${nomV('P')} se compensent toujours : sans frottement, le palet glisse en ligne droite à vitesse constante.`, indice: 'Le support est horizontal, et il n\'y a pas de frottement.' } };

  /* ===== skieur sans frottements (cours) ===== */
  S.skieurSans = { id: 'skieurSans', titre: 'Skieur sans frottements', systeme: 'le skieur', enonce: 'Un skieur descend une piste ; on néglige tous les frottements (neige et air).',
    dessin: `${plan()}${skieur()}${txt(50, 214, 'piste')}`,
    points: { G: G_SKI, A: AI.map(v => +v.toFixed(1)) }, nomsPts: { G: 'centre du skieur', A: 'contact skis-neige' },
    acteurs: [TERRE, touche('piste', 'la piste', 'les skis'), AIR], air: NEGL('L\'énoncé le dit : on néglige tous les frottements, ceux de l\'air compris.'),
    forces: [POIDS, Object.assign(RN_INC('piste'), { noms: ['RN', 'R'], diagDir: 'sans frottement, la réaction du support est <b>perpendiculaire au support</b>.' })],
    speciales: SPEC_INC, nomsProposes: NOMS_BASE,
    comp: { bonne: 'non', expl: `${nomV('RN')} et ${nomV('P')} n'ont pas la même direction : elles ne se compensent pas. Leur somme Σ <span class="vec-nom">F</span> = ${nomV('RN')} + ${nomV('P')} est dirigée vers le bas de la pente : le skieur accélère.`, indice: 'Regarde les directions des deux flèches.' } };

  /* ===== ballon de baudruche gonflé à l'hélium (cours : la force de l'air) ===== */
  S.helium = { id: 'helium', titre: 'Ballon d\'hélium retenu par une ficelle', systeme: 'le ballon', enonce: 'Un ballon de baudruche gonflé à l\'hélium est retenu par une ficelle attachée à un petit poids : il reste immobile.',
    dessin: `${sol(60, 300, 232)}<rect x="166" y="212" width="28" height="20" class="bf-sc-obj"/>${fil(180, 136, 180, 212)}<ellipse cx="180" cy="92" rx="34" ry="40" class="bf-sc-sys"/>` +
      `<path d="M175,138 L185,138 L180,131 Z" class="bf-sc-sys"/>${txt(172, 200, 'ficelle', 'end')}${txt(228, 60, 'hélium')}`,
    points: { G: [180, 92], A: [180, 132] }, nomsPts: { G: 'centre du ballon', A: 'accroche de la ficelle' },
    acteurs: [TERRE, touche('ficelle', 'la ficelle', 'le ballon'), Object.assign({}, AIR, { pourquoi: 'il touche le ballon et le pousse vers le haut (poussée d\'Archimède)' })],
    air: { neglige: false, cause: 'archi', raison: 'Le ballon d\'hélium est très léger pour son volume : la poussée d\'Archimède de l\'air n\'est pas négligeable (lâché, il monterait).', indice: 'Lâché, le ballon monterait : qu\'est-ce qui le pousse vers le haut ?' },
    distracteurs: [{ id: 'poids', nom: 'le petit poids', diag: 'Le petit poids ne touche pas le ballon : c\'est la ficelle qui le retient.' }],
    // F⃗archi compense P⃗ + T⃗ : sa flèche est aussi longue que les deux autres réunies
    forces: [Object.assign({}, POIDS, { L: 30 }), { acteur: 'ficelle', type: 'contact', lib: 'force exercée par la ficelle', pts: ['A'], angs: [270], noms: ['T'], L: 26, diagDir: 'la ficelle retient le ballon : elle tire <b>vers le bas</b>, le long de la ficelle.', indNom: `La force d'une ficelle (d'un fil) se note ${nomV('T')} (tension).` },
      { acteur: 'air', type: 'contact', lib: 'poussée d\'Archimède de l\'air', pts: ['G'], angs: [90], noms: ['Farchi'], L: 56, diagDir: 'la poussée d\'Archimède est <b>verticale, vers le haut</b>.', diagPt: 'l\'air entoure tout le ballon : on dessine sa poussée depuis le centre G.', indNom: `La poussée d'Archimède se note ${nomV('Farchi')}.` }],
    nomsProposes: ['P', 'RN', 'f', 'T', 'Farchi', 'Fair'],
    comp: { bonne: 'oui', expl: `Le ballon est immobile : ${nomV('P')} + ${nomV('T')} + ${nomV('Farchi')} = <span class="vec-nom">0</span>. La poussée d'Archimède compense le poids et la tension de la ficelle.`, indice: 'Le ballon reste immobile.' } };

  /* ===== l'exemple traité : le ballon ===== */
  const SOL_B = sol(20, 340, 170);
  // jambe et chaussure. T : bout du pied, sur le dessus (c'est là qu'il touche le ballon) ;
  // af : inclinaison du pied (degrés, sens des aiguilles d'une montre ; 0 : à plat, pointe à droite) ;
  // aj : inclinaison de la jambe par rapport à la verticale (même sens)
  function pied(T, af, aj) {
    const r = af * Math.PI / 180, d = [Math.cos(r), Math.sin(r)], m = [-Math.sin(r), Math.cos(r)];
    const P = (x, y) => `${(T[0] + d[0] * x + m[0] * y).toFixed(1)},${(T[1] + d[1] * x + m[1] * y).toFixed(1)}`;
    // chaussure, dans le repère du pied (x vers la pointe, y vers la semelle)
    const ch = `M${P(0, 0)} Q${P(5, 1)} ${P(5, 5)} Q${P(4, 10)} ${P(-2, 10)} L${P(-44, 10)} Q${P(-52, 10)} ${P(-52, 2)} L${P(-52, -12)} L${P(-30, -12)} Q${P(-24, 0)} ${P(-14, 0)} Z`;
    // jambe : bande de 22 px qui part de la cheville K
    const ra = aj * Math.PI / 180, e = [Math.sin(ra), -Math.cos(ra)], q = [Math.cos(ra), Math.sin(ra)];
    const K = [T[0] - 41 * d[0] - 6 * m[0], T[1] - 41 * d[1] - 6 * m[1]];
    const J = (a, b) => `${(K[0] + q[0] * a + e[0] * b).toFixed(1)},${(K[1] + q[1] * a + e[1] * b).toFixed(1)}`;
    return `<path d="M${J(-11, -4)} L${J(-11, 66)} L${J(11, 66)} L${J(11, -4)} Z" class="bf-sc-jambe"/><path d="M${J(-11, 50)} L${J(11, 50)}" class="bf-sc-chaussette"/>` +
      `<path d="${ch}" class="bf-sc-chaussure"/><path d="M${P(-2, 10)} L${P(-44, 10)}" class="bf-sc-semelle"/>`;
  }
  const ballon = (x, y) => `<circle cx="${x}" cy="${y}" r="30" class="bf-sc-sys"/><path d="M${x - 9},${y - 8} L${x + 9},${y - 8} L${x + 13},${y + 7} L${x},${y + 16} L${x - 13},${y + 7} Z" class="bf-sc-penta"/>`;
  // au moment de la frappe : le pied, tourné de 45°, touche le ballon en B ; sa force, à 45° vers le haut, passe par le centre
  const B_PIED = [+(210 - 30 * Math.SQRT1_2).toFixed(1), +(140 + 30 * Math.SQRT1_2).toFixed(1)];
  const P_B = { acteur: 'terre', type: 'distance', pts: ['G'], angs: [270], noms: ['P'] }, RN_B = { acteur: 'sol', type: 'contact', pts: ['A'], angs: [90], noms: ['RN'] };
  const SOL_ACT = touche2('sol', 'le sol', 'le ballon');
  const BALLON = [
    { id: 'avant', titre: 'Avant la frappe', systeme: 'le ballon', lf: 72, dessin: `${SOL_B}${pied([118, 160], 0, 0)}${ballon(210, 140)}`, points: { G: [210, 140], A: [210, 170] }, nomsPts: {},
      acteurs: [TERRE, SOL_ACT, AIR], air: NEGL(), forces: [P_B, RN_B],
      texte: `La Terre agit à distance (pointillés) : poids ${nomV('P')}, depuis G, vers le bas. Le sol touche le ballon (trait plein) : ${nomV('RN')}, depuis A, vers le haut. L'air touche le ballon, mais sa force est négligeable. ${nomV('P')} et ${nomV('RN')} se compensent : le ballon reste immobile.` },
    { id: 'pendant', titre: 'Au moment de la frappe', systeme: 'le ballon', lf: 72, dessin: `${SOL_B}${ballon(210, 140)}${pied(B_PIED, 45, 0)}`, points: { G: [210, 140], A: [210, 170], B: B_PIED }, nomsPts: {},
      acteurs: [TERRE, touche2('pied', 'le pied', 'le ballon'), SOL_ACT, AIR], air: NEGL(),
      forces: [P_B, RN_B, { acteur: 'pied', type: 'contact', pts: ['B'], angs: [45], noms: ['Fpied'] }],
      texte: `${nomV('P')} et ${nomV('RN')}, plus le pied, qui touche le ballon en B : ${nomV('Fpied')}, depuis B, à 45° vers le haut. La force de l'air est encore négligeable.` },
    { id: 'apres', titre: 'Après la frappe', systeme: 'le ballon', lf: 72, dessin: `${SOL_B}${pied([146, 126], -35, -40)}${ballon(250, 66)}${mvt(284, 36, 314, 6, '')}`, points: { G: [250, 66] }, nomsPts: {},
      acteurs: [TERRE, Object.assign({}, AIR, { pourquoi: 'il touche le ballon et le freine (frottements)' })],
      air: { neglige: false, cause: 'frottements', raison: 'Le ballon va vite : les frottements de l\'air ne sont pas négligeables.' },
      forces: [P_B, { acteur: 'air', type: 'contact', pts: ['G'], angs: [225], noms: ['Fair'] }],
      texte: `Le pied et le sol ne touchent plus le ballon. Il reste le poids ${nomV('P')} et la force de l'air ${nomV('Fair')} : le ballon va vite, les frottements de l'air ne sont pas négligeables. ${nomV('Fair')} s'oppose au mouvement.` },
  ];
  // l'exemple traité : pour chaque moment, le diagramme objet-action au-dessus du dessin
  function ballonHTML() {
    const dos = window.BF.diagrammesDe(BALLON);
    return `<div class="bf-ballon">${BALLON.map((b, k) => `<figure><p class="bf-ballon-t">${b.titre}</p>${dos[k]}` +
      `${window.BF.sceneRemplie(b, { aria: 'Ballon ' + b.titre.toLowerCase() + ' : bilan des forces' })}<figcaption>${b.texte}</figcaption></figure>`).join('')}</div>`;
  }

  /* ============================================================
     SITUATIONS AJOUTÉES (cours et exercices de Terminale spécialité)
     ============================================================ */
  const NOMS_TLE = ['P', 'R', 'RN', 'f', 'T', 'Farchi'];

  /* ===== le ballon de foot, avant, pendant et après la frappe (cours) ===== */
  const PIED_DIST = d => ({ id: 'pied', nom: 'le pied', diag: d });
  S.ballonAvant = Object.assign({}, BALLON[0], { id: 'ballonAvant', titre: 'Ballon de foot, avant la frappe',
    enonce: 'Un ballon de foot est posé, immobile, sur le sol ; le joueur s\'apprête à le frapper.',
    nomsPts: { G: 'centre du ballon', A: 'contact avec le sol' },
    distracteurs: [PIED_DIST('Le pied ne touche pas encore le ballon : il n\'exerce pas de force.')],
    forces: [POIDS, RN_HORIZ('sol', 'force exercée par le sol', true)], nomsProposes: ['P', 'RN', 'R', 'f', 'Fpied', 'Fair'],
    comp: { bonne: 'oui', expl: `Le ballon est immobile : ${nomV('P')} et ${nomV('RN')} ont la même direction, des sens opposés et la même valeur. Elles se compensent.`, indice: 'Le ballon est immobile.' } });
  S.ballonPendant = Object.assign({}, BALLON[1], { id: 'ballonPendant', titre: 'Ballon de foot, au moment de la frappe',
    enonce: 'Le pied du joueur frappe le ballon posé sur le sol.',
    nomsPts: { G: 'centre du ballon', A: 'contact avec le sol', B: 'contact avec le pied' },
    forces: [POIDS, RN_HORIZ('sol', 'force exercée par le sol', true),
      { acteur: 'pied', type: 'contact', lib: 'force exercée par le pied', pts: ['B'], angs: [45], noms: ['Fpied', 'F'],
        diagDir: 'le pied pousse le ballon <b>vers l\'avant et vers le haut</b> (à 45°), vers le centre du ballon.', diagPt: 'le pied touche le ballon au point B.',
        indNom: `La force exercée par le pied se note ${nomV('Fpied')}.` }],
    nomsProposes: ['P', 'RN', 'R', 'f', 'Fpied', 'Fair'],
    comp: { bonne: 'non', expl: `${nomV('Fpied')} n'est compensée par aucune force : le ballon part, sa vitesse change.`, indice: 'Le ballon part : sa vitesse change.' } });
  S.ballonApres = Object.assign({}, BALLON[2], { id: 'ballonApres', titre: 'Ballon de foot, après la frappe',
    enonce: 'Le ballon vient d\'être frappé : il monte très vite vers la droite.',
    nomsPts: { G: 'centre du ballon' },
    distracteurs: [PIED_DIST('Le pied ne touche plus le ballon : il n\'exerce plus de force.'), { id: 'sol', nom: 'le sol', diag: 'Le ballon ne touche plus le sol.' }],
    air: { neglige: false, cause: 'frottements', raison: 'Le ballon va très vite : les frottements de l\'air ne sont pas négligeables.', indice: 'Le ballon va très vite : pense aux frottements de l\'air.' },
    forces: [POIDS, { acteur: 'air', type: 'contact', lib: 'force de l\'air (frottements)', pts: ['G'], angs: [225], noms: ['Fair', 'f'],
      diagDir: 'les frottements de l\'air s\'opposent au mouvement : le ballon monte vers la droite, la force de l\'air est dirigée <b>vers le bas et la gauche</b>.',
      diagPt: 'l\'air touche tout le ballon : on dessine sa force depuis le centre G.', indNom: `La force de l'air (ses frottements) se note ${nomV('Fair')}.` }],
    nomsProposes: ['P', 'RN', 'f', 'T', 'Fpied', 'Fair'],
    comp: { bonne: 'non', expl: `${nomV('P')} et ${nomV('Fair')} n'ont pas la même direction : elles ne se compensent pas. Le ballon ralentit et sa trajectoire se courbe.`, indice: 'Regarde les directions des deux flèches.' } });

  /* ===== valise posée, valise portée (exercice 1) ===== */
  const valise = (x, y) => `<rect x="${x}" y="${y}" width="120" height="70" rx="8" class="bf-sc-sys"/><path d="M${x + 42},${y} V${y - 12} Q${x + 42},${y - 18} ${x + 48},${y - 18} H${x + 72} Q${x + 78},${y - 18} ${x + 78},${y - 12} V${y}" class="bf-sc-anse"/>` +
    `<line x1="${x + 30}" y1="${y + 4}" x2="${x + 30}" y2="${y + 66}" class="bf-sc-couture"/><line x1="${x + 90}" y1="${y + 4}" x2="${x + 90}" y2="${y + 66}" class="bf-sc-couture"/>`;
  S.valisePosee = { id: 'valisePosee', niv: '2de', titre: 'Valise posée sur le sol', systeme: 'la valise', enonce: 'Une valise est posée, immobile, sur le sol.',
    dessin: `${sol(20, 340, 200)}${valise(120, 130)}`,
    points: { G: [180, 165], A: [180, 200] }, nomsPts: { G: 'centre de la valise', A: 'contact avec le sol' },
    acteurs: [TERRE, touche2('sol', 'le sol', 'la valise'), AIR], air: NEGL(),
    distracteurs: [{ id: 'main', nom: 'la main', diag: 'Personne ne tient la valise : aucune main ne la touche.' }],
    forces: [POIDS, Object.assign(RN_HORIZ('sol', 'force exercée par le sol', true), { noms: ['R', 'RN'], indNom: `La force exercée par le sol (la réaction du support) se note ${nomV('R')} (ou ${nomV('RN')} : perpendiculaire au sol).` })],
    nomsProposes: NOMS_TLE,
    comp: { bonne: 'oui', expl: `La valise est immobile : ${nomV('P')} et ${nomV('R')} se compensent.`, indice: 'La valise est immobile.' } };
  // main fermée sur la poignée, et le bras
  const poing = (x, y) => `<path d="M${x - 4},${y - 70} L${x - 4},${y - 14}" class="bf-sc-bras"/><rect x="${x - 17}" y="${y - 16}" width="34" height="22" rx="9" class="bf-sc-obj"/>`;
  S.valisePortee = { id: 'valisePortee', niv: '2de', titre: 'Valise portée', systeme: 'la valise', enonce: 'Une personne porte une valise par la poignée ; la valise est immobile, elle ne touche pas le sol.',
    dessin: `${sol(20, 340, 226)}${valise(120, 132)}${poing(180, 114)}${txt(200, 58, 'bras')}`,
    points: { G: [180, 167], A: [180, 110] }, nomsPts: { G: 'centre de la valise', A: 'contact avec la main (poignée)' },
    acteurs: [TERRE, touche('main', 'la main', 'la valise'), AIR], air: NEGL(),
    distracteurs: [{ id: 'sol', nom: 'le sol', diag: 'La valise est portée : elle ne touche pas le sol.' }],
    forces: [POIDS, { acteur: 'main', type: 'contact', lib: 'force exercée par la main', pts: ['A'], angs: [90], noms: ['Fmain', 'F', 'T'],
      diagDir: 'la main retient la valise : sa force est <b>verticale, vers le haut</b>.', diagPt: 'la main touche la valise au niveau de la poignée, au point A.',
      indNom: `La force exercée par la main se note ${nomV('Fmain')} (ou <span class="vec-nom">F</span><sub>M/V</sub> : force de la main sur la valise).` }],
    nomsProposes: ['P', 'R', 'f', 'Fmain', 'Farchi', 'Fair'],
    comp: { bonne: 'oui', expl: `La valise est immobile : ${nomV('P')} et ${nomV('Fmain')} se compensent.`, indice: 'La valise est immobile.' } };

  /* ===== lancer du poids (exercice 1) ===== */
  const boule = (x, y) => `<circle cx="${x}" cy="${y}" r="15" class="bf-sc-sys"/>`;
  S.poidsAvant = { id: 'poidsAvant', niv: '2de', titre: 'Lancer du poids : la boule dans la main', systeme: 'la boule', sysCourt: 'boule',
    enonce: 'Au lancer du poids, l\'athlète pousse la boule de métal (le « poids ») vers le haut et vers l\'avant pour la lancer ; elle est encore dans sa main.',
    dessin: `<path d="M120,196 L172,124" class="bf-sc-bras"/>${main(168, 124)}${boule(200, 97)}${mvt(226, 72, 262, 36, '')}${txt(266, 40, 'poussée')}${txt(84, 214, 'bras de l\'athlète')}`,
    points: { G: [200, 97], A: [200, 112] }, nomsPts: { G: 'centre de la boule', A: 'contact avec la main' },
    acteurs: [TERRE, touche('main', 'la main', 'la boule'), AIR], air: NEGL(),
    distracteurs: [{ id: 'sol', nom: 'le sol', diag: 'La boule ne touche pas le sol.' }],
    forces: [POIDS, { acteur: 'main', type: 'contact', lib: 'force exercée par la main', pts: ['A'], angs: [45], noms: ['Fmain', 'F'],
      diagDir: 'la main pousse la boule dans la direction du lancer : <b>vers le haut et vers l\'avant</b>.', diagPt: 'la main touche la boule au point A.',
      indNom: `La force exercée par la main se note ${nomV('Fmain')}.` }],
    nomsProposes: ['P', 'R', 'f', 'T', 'Fmain', 'Fair'],
    comp: { bonne: 'non', expl: `${nomV('P')} et ${nomV('Fmain')} n'ont pas la même direction : elles ne se compensent pas. La boule prend de la vitesse.`, indice: 'L\'athlète lance la boule : sa vitesse change.' } };
  S.poidsLance = { id: 'poidsLance', niv: '2de', titre: 'Lancer du poids : la boule vient d\'être lancée', systeme: 'la boule', sysCourt: 'boule',
    enonce: 'La boule vient de quitter la main de l\'athlète. On néglige l\'action de l\'air.',
    dessin: `<path d="M70,170 Q130,70 206,64" class="bf-sc-mvt"/>${boule(220, 64)}${mvt(238, 62, 282, 66, '')}${sol(20, 340, 226)}${txt(30, 200, 'athlète')}<path d="M44,226 L44,184 M44,196 L68,172" class="bf-sc-bras"/>`,
    points: { G: [220, 64] }, nomsPts: { G: 'centre de la boule' },
    acteurs: [TERRE, AIR], air: NEGL('L\'énoncé le dit : on néglige l\'action de l\'air (et la boule de métal est lourde pour son volume).'),
    distracteurs: [{ id: 'main', nom: 'la main', diag: 'La main ne touche plus la boule : elle n\'exerce plus de force.' }, { id: 'sol', nom: 'le sol', diag: 'Le sol ne touche pas la boule.' }],
    forces: [POIDS], nomsProposes: ['P', 'F', 'Fmain', 'f'],
    comp: { bonne: 'non', expl: `Une seule force, ${nomV('P')} : rien ne la compense. La boule ne va pas en ligne droite à vitesse constante : elle retombe.`, indice: 'Il n\'y a qu\'une seule force.' } };

  /* ===== bateau à voile (exercice 1) ===== */
  S.bateau = { id: 'bateau', niv: 'Tle', titre: 'Bateau à voile qui avance', systeme: 'le bateau', lf: 50,
    enonce: 'Un bateau à voile avance vers la droite, poussé par le vent. On néglige les frottements de l\'eau sur la coque.',
    dessin: `<rect x="10" y="170" width="340" height="66" class="bf-sc-eau"/><path d="M90,150 L270,150 L246,186 L114,186 Z" class="bf-sc-sys"/><line x1="170" y1="150" x2="170" y2="26" class="bf-sc-mat"/>` +
      `<path d="M174,30 Q236,74 246,144 L174,144 Z" class="bf-sc-voile"/><path d="M166,40 L120,144 L166,144 Z" class="bf-sc-voile"/>${mvt(276, 40, 336, 40, '')}${txt(282, 32, 'avance')}${txt(20, 228, 'eau')}${txt(262, 120, 'voile')}`,
    points: { G: [180, 160], A: [180, 178], C: [206, 112] }, nomsPts: { G: 'centre du bateau', A: 'centre de la partie immergée', C: 'centre de la voile' },
    acteurs: [TERRE, { id: 'eau', nom: 'l\'eau', pourquoi: 'elle touche la coque et la porte (poussée d\'Archimède)', manque: 'L\'eau touche la coque : elle exerce une force de contact (elle porte le bateau).' },
      Object.assign({}, AIR, { pourquoi: 'il touche la voile et la pousse (le vent)', manque: 'L\'air touche le bateau : c\'est même le vent, sur la voile, qui le fait avancer.' })],
    air: { neglige: false, cause: 'frottements', raison: 'Le vent frotte sur la voile et la pousse : la force de l\'air n\'est pas négligeable, c\'est elle qui fait avancer le bateau.', indice: 'Qu\'est-ce qui fait avancer un bateau à voile ?' },
    distracteurs: [{ id: 'fond', nom: 'le fond de la mer', diag: 'Le bateau flotte : le fond de la mer ne le touche pas.' }],
    forces: [POIDS, { acteur: 'eau', type: 'contact', lib: 'force exercée par l\'eau', pts: ['A', 'G'], angs: [90], noms: ['Farchi', 'F'],
      diagDir: 'l\'eau porte le bateau : la poussée d\'Archimède est <b>verticale, vers le haut</b>.', diagPt: 'l\'eau touche toute la partie immergée : on dessine sa force depuis le centre de la partie immergée A (ou depuis G).',
      indNom: `La force de l'eau sur la coque est la poussée d'Archimède ${nomV('Farchi')} (notée <span class="vec-nom">F</span><sub>E</sub> dans la correction).` },
      { acteur: 'air', type: 'contact', lib: 'force exercée par l\'air (le vent)', pts: ['C'], angs: [0], noms: ['Fair', 'F'], L: 40,
        diagDir: 'le vent pousse la voile <b>dans le sens où avance le bateau</b> : horizontale, vers la droite.', diagPt: 'le vent agit sur la voile : on dessine sa force depuis le centre de la voile, le point C.',
        indNom: `La force de l'air se note ${nomV('Fair')} (<span class="vec-nom">F</span><sub>A</sub> dans la correction).` }],
    nomsProposes: ['P', 'RN', 'f', 'T', 'Farchi', 'Fair'] };

  /* ===== caravane tractée par une voiture qui freine (exercice 1) ===== */
  S.caravane = { id: 'caravane', niv: 'Tle', titre: 'Caravane tractée par une voiture qui freine', systeme: 'la caravane', lf: 46,
    enonce: 'Une voiture tire une caravane vers la droite, puis freine. On ne néglige pas l\'action de l\'air ; on néglige les frottements de la route sur les roues de la caravane.',
    dessin: `<rect x="40" y="104" width="130" height="80" rx="12" class="bf-sc-sys"/><rect x="58" y="118" width="40" height="26" rx="4" class="bf-sc-vitre"/><circle cx="105" cy="190" r="16" class="bf-sc-roue"/>` +
      `<line x1="170" y1="172" x2="204" y2="172" class="bf-sc-fil"/><path d="M200,186 L200,160 L226,156 L244,136 L292,136 L312,156 L334,160 L334,186 Z" class="bf-sc-obj"/>` +
      `<circle cx="230" cy="192" r="14" class="bf-sc-roue"/><circle cx="306" cy="192" r="14" class="bf-sc-roue"/>${sol(20, 340, 206)}${mvt(196, 70, 280, 70, '')}${txt(196, 60, 'avance en freinant')}${txt(244, 230, 'voiture', 'middle')}${txt(74, 230, 'caravane', 'middle')}${txt(176, 162, 'attelage')}`,
    points: { G: [105, 144], A: [105, 206], B: [170, 172] }, nomsPts: { G: 'centre de la caravane', A: 'contact roue-route', B: 'attelage' },
    acteurs: [TERRE, touche('route', 'la route', 'la roue'), { id: 'voiture', nom: 'la voiture', pourquoi: 'elle touche la caravane par l\'attelage', manque: 'La voiture touche la caravane par l\'attelage : elle exerce une force de contact.' },
      Object.assign({}, AIR, { pourquoi: 'il touche la caravane et la freine (frottements)' })],
    air: { neglige: false, cause: 'frottements', raison: 'L\'énoncé le dit : on ne néglige pas l\'action de l\'air. Une caravane a une grande surface face à l\'air.', indice: 'Relis l\'énoncé.' },
    distracteurs: [{ id: 'conducteur', nom: 'le conducteur', diag: 'Le conducteur est dans la voiture : il ne touche pas la caravane.' },
      { id: 'freins', nom: 'les freins de la voiture', diag: 'Les freins sont sur les roues de la voiture : ils ne touchent pas la caravane. C\'est la voiture, par l\'attelage, qui la retient.' }],
    forces: [POIDS, Object.assign(RN_HORIZ('route', 'force exercée par la route'), { noms: ['R', 'RN'], diagPt: 'la roue touche la route au point A.', indNom: `La force exercée par la route (réaction du support) se note ${nomV('R')} (ou ${nomV('RN')}).` }),
      { acteur: 'voiture', type: 'contact', lib: 'force exercée par la voiture', pts: ['B'], angs: [180], noms: ['Fvoiture', 'F', 'T'],
        diagDir: 'la voiture freine : par l\'attelage, elle retient la caravane, donc sa force est dirigée <b>vers l\'arrière</b>, horizontale, vers la gauche.', diagPt: 'la voiture touche la caravane à l\'attelage, le point B.',
        indNom: `La force exercée par la voiture se note ${nomV('Fvoiture')} (<span class="vec-nom">F</span><sub>V</sub> dans la correction).` },
      { acteur: 'air', type: 'contact', lib: 'force de l\'air (frottements)', pts: ['G'], angs: [180], noms: ['Fair', 'f'], L: 26,
        diagDir: 'les frottements de l\'air s\'opposent au mouvement : <b>vers l\'arrière</b>.', diagPt: 'l\'air touche toute la caravane : on dessine sa force depuis le centre G.',
        indNom: `La force de l'air (ses frottements) se note ${nomV('Fair')}.` }],
    nomsProposes: ['P', 'R', 'f', 'Fvoiture', 'Fair', 'Farchi'],
    comp: { bonne: 'non', expl: 'La caravane ralentit : les forces ne se compensent pas ; leur somme est dirigée vers l\'arrière.', indice: 'La caravane ralentit.' } };

  /* ===== skieur tiré par un téléski (exercice 2) ===== */
  // la perche fait 45° avec l'horizontale ; longueurs : les forces se compensent (montée à vitesse constante)
  const G_TS = sur(0, 20), C_TS = sur(-2, 28), A_TS = AI.map(v => +v.toFixed(1));
  const BOUT = [+(C_TS[0] - 104 * Math.SQRT1_2).toFixed(1), +(C_TS[1] - 104 * Math.SQRT1_2).toFixed(1)];
  S.teleski = { id: 'teleski', niv: 'Tle', titre: 'Skieur tiré par un téléski', systeme: 'le skieur',
    enonce: 'Un skieur monte la piste vers la gauche, tiré par la perche d\'un téléski, à vitesse constante. On néglige l\'action de l\'air, pas les frottements de la neige.',
    dessin: `${plan()}${skieur()}<line x1="${C_TS[0]}" y1="${C_TS[1]}" x2="${BOUT[0]}" y2="${BOUT[1]}" class="bf-sc-perche"/><circle cx="${C_TS[0]}" cy="${C_TS[1]}" r="4" class="bf-sc-obj"/>` +
      `<line x1="20" y1="${(BOUT[1] + (20 - BOUT[0]) * Math.tan(A_INC)).toFixed(1)}" x2="${BOUT[0] + 60}" y2="${(BOUT[1] + 60 * Math.tan(A_INC)).toFixed(1)}" class="bf-sc-cable"/>` +
      `${txt(50, 214, 'piste')}${txt(BOUT[0] - 4, BOUT[1] + 26, 'perche', 'end')}`,
    points: { G: G_TS, A: A_TS, C: C_TS }, nomsPts: { G: 'centre du skieur', A: 'contact skis-neige', C: 'accroche de la perche' },
    acteurs: [TERRE, touche('piste', 'la piste', 'les skis'), touche('perche', 'la perche', 'le skieur'), AIR], air: NEGL('L\'énoncé le dit : on néglige l\'action de l\'air.'),
    distracteurs: [{ id: 'cable', nom: 'le câble du téléski', diag: 'Le câble ne touche pas le skieur : c\'est la perche qui le tire.' }],
    forces: [POIDS, Object.assign(RN_INC('piste'), { L: 40.7 }),
      Object.assign(F_INC('piste'), { angs: [335], L: 8, diagDir: 'les frottements de la neige s\'opposent au glissement : le skieur monte vers la gauche, <span class="vec-nom">f</span> est <b>parallèle au support, vers le bas de la pente</b>.' }),
      { acteur: 'perche', type: 'contact', lib: 'force exercée par la perche', pts: ['C'], angs: [135], noms: ['Fperche', 'F', 'T'], L: 34.6,
        diagDir: 'la perche tire le skieur <b>le long de la perche</b> : vers le haut et la gauche (à 45° de l\'horizontale).', diagPt: 'la perche touche le skieur au point C.',
        indNom: `La force exercée par la perche se note ${nomV('Fperche')}.` }],
    speciales: SPEC_INC, nomsProposes: ['P', 'RN', 'R', 'f', 'Fperche', 'Fair'],
    comp: { bonne: 'oui', expl: `Mouvement rectiligne uniforme : d'après le principe d'inertie, ${nomV('P')} + ${nomV('RN')} + ${nomV('f')} + ${nomV('Fperche')} = <span class="vec-nom">0</span>.`, indice: 'Il monte en ligne droite à vitesse constante : pense au principe d\'inertie.' } };

  /* ===== livre immobile sur un plan incliné (exercice 3) : la pente monte vers la droite (20°) ===== */
  const A20 = 20 * Math.PI / 180, U2 = [Math.cos(A20), -Math.sin(A20)], N2 = [-Math.sin(A20), -Math.cos(A20)], Q0 = [40, 206];
  const sur2 = (t, h) => [+(Q0[0] + t * U2[0] + h * N2[0]).toFixed(1), +(Q0[1] + t * U2[1] + h * N2[1]).toFixed(1)];
  const A_LI = sur2(150, 0), G_LI = sur2(150, 13);
  S.livreIncline = { id: 'livreIncline', niv: 'Tle', titre: 'Livre immobile sur un plan incliné', systeme: 'le livre',
    enonce: 'Un livre est posé sur un plan incliné ; il reste immobile.',
    dessin: `<polygon points="${Q0.join(',')} ${sur2(300, 0).join(',')} ${sur2(300, 0)[0]},${Q0[1]}" class="bf-sc-obj"/>` +
      `<polygon points="${[sur2(116, 0), sur2(184, 0), sur2(184, 26), sur2(116, 26)].map(p => p.join(',')).join(' ')}" class="bf-sc-sys"/>${txt(210, 224, 'plan incliné')}`,
    points: { G: G_LI, A: A_LI }, nomsPts: { G: 'centre du livre', A: 'contact avec le plan' },
    acteurs: [TERRE, touche2('plan', 'le plan incliné', 'le livre'), AIR], air: NEGL(),
    distracteurs: [{ id: 'table', nom: 'la table', diag: 'Le plan incliné est posé sur la table, mais la table ne touche pas le livre.' }],
    forces: [POIDS,
      { acteur: 'plan', type: 'contact', lib: 'réaction perpendiculaire du plan', pts: ['A'], angs: [110], noms: ['RN', 'R'], L: 54.5,
        diagDir: 'la réaction normale est <b>perpendiculaire au support</b>, même quand il est incliné : choisis « perpendiculaire au support ».', indNom: `La réaction perpendiculaire au support se note ${nomV('RN')}.` },
      { acteur: 'plan', type: 'contact', lib: 'frottement du plan', pts: ['A'], angs: [20], noms: ['f'], L: 19.8,
        diagDir: 'les frottements s\'opposent au glissement : sans eux, le livre glisserait vers le bas de la pente (vers la gauche), donc <span class="vec-nom">f</span> est <b>parallèle au support, vers le haut de la pente</b>.', indNom: `Les frottements se notent ${nomV('f')}.` }],
    speciales: [{ label: '⊥ perpendiculaire au support', court: '⊥ au support', ang: 110 }, { label: '∥ au support, vers le haut de la pente', court: '∥ vers le haut', ang: 20 }, { label: '∥ au support, vers le bas de la pente', court: '∥ vers le bas', ang: 200 }],
    nomsProposes: NOMS_BASE,
    comp: { bonne: 'oui', expl: `Le livre est immobile donc ${nomV('P')} + ${nomV('RN')} + ${nomV('f')} = <span class="vec-nom">0</span> : la réaction du plan ${nomV('R')} = ${nomV('RN')} + ${nomV('f')} compense le poids.`, indice: 'Le livre reste immobile.' } };

  /* ===== voiture au freinage (exercice 4) : même dessin que la voiture au démarrage ===== */
  const V = S.voiture;
  S.voitureFrein = Object.assign({}, V, { id: 'voitureFrein', niv: 'Tle', titre: 'Voiture au freinage (traction avant)',
    enonce: 'Une voiture à traction avant roule vers la droite et freine : ses roues se bloquent presque.',
    dessin: V.dessin.replace('démarre', 'freine'),
    acteurs: [TERRE, touche('route', 'la route', 'les roues'), Object.assign({}, AIR, { pourquoi: 'il touche la carrosserie et la freine (frottements)' })],
    air: { neglige: false, cause: 'frottements', raison: 'Une voiture a une grande surface face à l\'air, et elle roule vite : les frottements de l\'air ne sont pas négligeables.', indice: 'Une voiture qui roule a une grande surface face à l\'air : ses frottements comptent.' },
    distracteurs: [{ id: 'freins', nom: 'les freins', diag: 'Les freins font partie de la voiture (le système) : ils n\'exercent pas de force extérieure. C\'est la route qui freine les roues.' },
      { id: 'conducteur', nom: 'le conducteur', diag: 'Le conducteur est dans la voiture : il fait partie du système.' }],
    forces: [POIDS,
      Object.assign({}, V.forces[1], { lib: 'route sur les roues avant : réaction perpendiculaire' }),
      { acteur: 'route', type: 'contact', lib: 'route sur les roues avant : frottement', pts: ['A'], angs: [180], noms: ['f'], L: 22,
        diagDir: 'au freinage, sans frottements, les roues presque bloquées glisseraient vers l\'avant : les frottements de la route sont dirigés <b>vers l\'arrière</b>.', diagPt: 'les roues avant touchent la route au point A.', indNom: `Les frottements se notent ${nomV('f')}.` },
      Object.assign({}, V.forces[3]),
      Object.assign({}, V.forces[4], { L: 18, diagDir: 'au freinage, sans frottements, les roues presque bloquées glisseraient vers l\'avant : les frottements de la route sont dirigés <b>vers l\'arrière</b>.' }),
      Object.assign({}, V.forces[5], { L: 14 })],
    nomsProposes: ['P', 'RN', 'f', 'Fair', 'Fm', 'Farchi'],
    comp: { bonne: 'non', expl: 'La voiture ralentit : les forces ne se compensent pas ; leur somme est dirigée vers l\'arrière.', indice: 'La voiture freine : sa vitesse diminue.' } });

  /* ===== niveaux de l'atelier ===== */
  const NIV = { '2de': ['valisePosee', 'brique', 'valisePortee', 'ressort', 'ballonAvant', 'ballonPendant', 'balle', 'poidsAvant', 'poidsLance', 'pendule'],
    '1re': ['ballonApres', 'parachute', 'livre', 'aimants', 'ebonite', 'clou'],
    Tle: ['palet', 'skieurSans', 'bouchon', 'helium', 'goutte', 'bateau', 'incline', 'livreIncline', 'glisse', 'skieur', 'teleski', 'voiture', 'voitureFrein', 'caravane'] };
  Object.keys(NIV).forEach(n => NIV[n].forEach(id => { S[id].niv = n; }));

  window.BF.SITUATIONS = S;
  // ordre de l'atelier : par niveau, puis du plus simple au plus difficile
  window.BF.NIVEAUX = [{ id: '2de', nom: '2de' }, { id: '1re', nom: '1re' }, { id: 'Tle', nom: 'Tle' }];
  window.BF.PARCOURS = NIV['2de'].concat(NIV['1re'], NIV.Tle);
  window.BF.BALLON = BALLON;
  window.BF.ballonHTML = ballonHTML;
})();
