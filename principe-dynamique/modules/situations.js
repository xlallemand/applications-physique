/* ============================================================
   Situations du bilan des forces (application « Chapitre 6 : Principe
   fondamental de la dynamique »), dessins repris de la fiche « Faire
   un bilan des forces ». La fiche est vierge : les bilans attendus
   sont ceux du prompt du chapitre.

   PFD.SITUATIONS : { id: situation }, PFD.PARCOURS : ordre de l'atelier,
   PFD.BALLON : les trois dessins de l'exemple traité, PFD.ballonHTML() : l'exemple
   traité (diagramme objet-action au-dessus de chaque dessin).
   Une situation :
     { id, titre, systeme ('la brique'), sysCourt (nom dans le diagramme objet-action, facultatif),
       enonce, dessin (SVG, repère 360 × 240),
       points: { G: [x, y], A: […] }, nomsPts: { G: 'centre…' }, lf (longueur des flèches, facultatif),
       acteurs: [{ id, nom, pourquoi, manque, court }] (les actions à distance, puis les objets qui touchent),
       distracteurs: [{ id, nom, diag }] (objets proposés à tort parmi ceux qui touchent le système),
       air: { neglige, cause ('frottements' | 'archi'), raison, indice } : l'air touche presque
         toujours le système, c'est donc un acteur (le dernier) ; sa force est négligée sauf
         si ses frottements ou sa poussée d'Archimède ne sont pas négligeables,
       forces: [{ acteur, type: 'distance' | 'contact', lib, pts: [points acceptés],
                  angs: [angles acceptés, en degrés, 0 = vers la droite, 90 = vers le haut],
                  noms: [noms acceptés], diagDir, indNom }],
       speciales: [{ label, ang }] (directions propres : perpendiculaire au support…),
       nomsProposes: [noms affichés à l'étape 4], comp: { bonne, expl, indice, q } }
   Plan incliné : pente de 25° (descend vers la droite) : perpendiculaire au
   support 65°, parallèle vers le haut de la pente 155°, vers le bas 335°.
   ============================================================ */
(function () {
  'use strict';

  const { nomV } = window.PFD;

  /* ---------- petits dessins ---------- */
  function sol(x1, x2, y) {
    let s = `<line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" class="pfd-sc-sol"/>`;
    for (let x = x1 + 10; x <= x2; x += 12) s += `<line x1="${x}" y1="${y + 1}" x2="${x - 8}" y2="${y + 9}" class="pfd-sc-hach"/>`;
    return s;
  }
  const txt = (x, y, t, ancre) => `<text x="${x}" y="${y}" class="pfd-sc-txt"${ancre ? ` text-anchor="${ancre}"` : ''}>${t}</text>`;
  // flèche en pointillés : sens du mouvement (indication, pas une force)
  function mvt(x1, y1, x2, y2, t) {
    const a = Math.atan2(y2 - y1, x2 - x1), c = Math.cos(a), s = Math.sin(a);
    return `<line x1="${x1}" y1="${y1}" x2="${x2 - 8 * c}" y2="${y2 - 8 * s}" class="pfd-sc-mvt"/><path d="M${x2},${y2} L${(x2 - 9 * c - 4 * s).toFixed(1)},${(y2 - 9 * s + 4 * c).toFixed(1)} L${(x2 - 9 * c + 4 * s).toFixed(1)},${(y2 - 9 * s - 4 * c).toFixed(1)} Z" class="pfd-sc-mvt-p"/>` +
      (t ? txt((x1 + x2) / 2, Math.min(y1, y2) - 7, t, 'middle') : '');
  }
  const main = (x, y) => `<path d="M${x},${y} q 8,-10 22,-8 l 26,2 q 6,1 6,6 q 0,5 -6,5 l -18,0 q 6,8 -2,12 l -24,0 q -8,-4 -4,-17 z" class="pfd-sc-obj"/>`;
  // plan incliné (pente de 25°), et points d'une figure posée dessus
  const A_INC = 25 * Math.PI / 180, U = [Math.cos(A_INC), Math.sin(A_INC)], N = [Math.sin(A_INC), -Math.cos(A_INC)];
  const P0 = [30, 80], AI = [P0[0] + 150 * U[0], P0[1] + 150 * U[1]];
  const sur = (t, h) => [+(AI[0] + t * U[0] + h * N[0]).toFixed(1), +(AI[1] + t * U[1] + h * N[1]).toFixed(1)];
  const plan = () => `<polygon points="30,80 ${(30 + 300).toFixed(0)},${(80 + 300 * Math.tan(A_INC)).toFixed(1)} 30,${(80 + 300 * Math.tan(A_INC)).toFixed(1)}" class="pfd-sc-obj"/>`;
  const brique = () => `<polygon points="${[sur(-34, 0), sur(34, 0), sur(34, 40), sur(-34, 40)].map(p => p.join(',')).join(' ')}" class="pfd-sc-sys"/>`;
  const SPEC_INC = [{ label: '⊥ perpendiculaire au support', ang: 65 }, { label: '∥ au support, vers le haut de la pente', ang: 155 }, { label: '∥ au support, vers le bas de la pente', ang: 335 }];
  const skieur = () => {
    const a = sur(-30, 0), b = sur(30, 0), k = sur(0, 4), h = sur(0, 30), t = sur(0, 38), m = sur(0, 22), bt = sur(14, 2);
    return `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" class="pfd-sc-ski"/><line x1="${k[0]}" y1="${k[1]}" x2="${h[0]}" y2="${h[1]}" class="pfd-sc-corps"/>` +
      `<circle cx="${t[0]}" cy="${t[1]}" r="6.5" class="pfd-sc-sys"/><line x1="${m[0]}" y1="${m[1]}" x2="${bt[0]}" y2="${bt[1]}" class="pfd-sc-corps fin"/>`;
  };
  const fil = (x1, y1, x2, y2) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="pfd-sc-fil"/>`;
  const support = (x, y, w) => `<rect x="${x}" y="${y}" width="${w}" height="10" class="pfd-sc-obj"/>` + Array.from({ length: Math.floor(w / 12) }, (_, k) => `<line x1="${x + 6 + k * 12}" y1="${y}" x2="${x + k * 12}" y2="${y - 6}" class="pfd-sc-hach"/>`).join('');
  const aimant = (x, y, sys) => `<g class="${sys ? 'pfd-sc-sys' : 'pfd-sc-obj'}"><rect x="${x}" y="${y}" width="84" height="30"/><line x1="${x + 42}" y1="${y}" x2="${x + 42}" y2="${y + 30}"/></g>` +
    txt(x + 21, y + 20, 'N', 'middle') + txt(x + 63, y + 20, 'S', 'middle');
  // point d'un cercle de centre c, de rayon r, vers le point o
  const versPt = (c, r, o) => { const dx = o[0] - c[0], dy = o[1] - c[1], l = Math.hypot(dx, dy); return [+(c[0] + r * dx / l).toFixed(1), +(c[1] + r * dy / l).toFixed(1)]; };
  const angVers = (a, b) => +(Math.atan2(a[1] - b[1], b[0] - a[0]) * 180 / Math.PI).toFixed(1);

  /* ---------- acteurs et distracteurs ---------- */
  const TERRE = { id: 'terre', nom: 'la Terre', pourquoi: 'elle attire le système, à distance (le poids)', manque: 'La Terre attire <b>toujours</b> le système : n\'oublie pas le poids.' };
  // l'air touche toujours le système (sauf dans le vide ou dans un liquide) : c'est un acteur, de contact
  const AIR = { id: 'air', nom: 'l\'air', pourquoi: 'il touche toujours le système (force souvent négligeable)', manque: 'L\'air touche toujours le système : il exerce toujours une force de contact (souvent négligeable).' };
  const NEGL = r => ({ neglige: true, raison: r || 'Pas de grande vitesse ni de grande surface (frottements faibles), et le système n\'est pas très léger pour son volume (poussée d\'Archimède faible) : on néglige la force de l\'air.' });
  const touche = (id, nom, sys) => ({ id, nom, pourquoi: `elle touche ${sys}`, manque: `${nom.charAt(0).toUpperCase() + nom.slice(1)} touche ${sys} : elle exerce une force de contact.` });
  const touche2 = (id, nom, sys) => ({ id, nom, pourquoi: `il touche ${sys}`, manque: `${nom.charAt(0).toUpperCase() + nom.slice(1)} touche ${sys} : il exerce une force de contact.` });

  /* ---------- forces fréquentes ---------- */
  const POIDS = { acteur: 'terre', type: 'distance', lib: 'force exercée par la Terre', pts: ['G'], angs: [270], noms: ['P'], diagDir: 'le poids est <b>vertical, vers le bas</b>.', indNom: `La force exercée par la Terre est le poids ${nomV('P')}.` };
  const RN_HORIZ = (acteur, lib, avecR) => ({ acteur, type: 'contact', lib, pts: ['A'], angs: [90], noms: avecR ? ['RN', 'R'] : ['RN'],
    diagDir: 'la réaction normale est <b>perpendiculaire au support</b> : ici, verticale vers le haut.', indNom: `La réaction perpendiculaire au support se note ${nomV('RN')} (N comme normale).` });
  const RN_INC = acteur => ({ acteur, type: 'contact', lib: `réaction perpendiculaire de la ${acteur === 'piste' ? 'piste' : 'planche'}`, pts: ['A'], angs: [65], noms: ['RN'],
    diagDir: 'la réaction normale est <b>perpendiculaire au support</b>, même quand il est incliné : choisis « perpendiculaire au support ».', indNom: `La réaction perpendiculaire au support se note ${nomV('RN')}.` });
  const F_INC = acteur => ({ acteur, type: 'contact', lib: `frottement de la ${acteur === 'piste' ? 'piste' : 'planche'}`, pts: ['A'], angs: [155], noms: ['f'],
    diagDir: 'les frottements s\'opposent au glissement : sans eux, le système glisserait vers le bas de la pente, donc <span class="vec-nom">f</span> est <b>parallèle au support, vers le haut de la pente</b>.', indNom: `Les frottements se notent ${nomV('f')}.` });
  const NOMS_BASE = ['P', 'RN', 'R', 'f', 'T', 'Farchi'];

  const S = {};

  /* ===== brique sur une planche horizontale ===== */
  S.brique = { id: 'brique', titre: 'Brique sur une planche horizontale', systeme: 'la brique', enonce: 'Une brique est posée, immobile, sur une planche horizontale.',
    dessin: `<rect x="40" y="170" width="280" height="12" class="pfd-sc-obj"/>${txt(48, 200, 'planche')}<rect x="140" y="118" width="80" height="52" class="pfd-sc-sys"/>`,
    points: { G: [180, 144], A: [180, 170] }, nomsPts: { G: 'centre de la brique', A: 'contact avec la planche' },
    acteurs: [TERRE, touche('planche', 'la planche', 'la brique'), AIR], air: NEGL(),
    distracteurs: [{ id: 'table', nom: 'la table', diag: 'La table ne touche pas la brique : c\'est la planche qui la porte.' }],
    forces: [POIDS, RN_HORIZ('planche', 'force exercée par la planche', true)], nomsProposes: NOMS_BASE,
    comp: { bonne: 'oui', expl: `${nomV('P')} et ${nomV('RN')} ont la même direction, des sens opposés et la même valeur : elles se compensent, la brique reste immobile.`, indice: 'La brique est immobile : ses deux forces s\'annulent.' } };

  /* ===== masse suspendue à un ressort ===== */
  const zig = (() => { let d = 'M180,26 L180,34'; for (let k = 0; k < 8; k++) d += ` L${k % 2 ? 190 : 170},${38 + k * 8.5}`; return d + ' L180,108 L180,112'; })();
  S.ressort = { id: 'ressort', titre: 'Masse suspendue à un ressort', systeme: 'la masse', enonce: 'Une masse est accrochée, immobile, au bout d\'un ressort fixé à une potence.',
    dessin: `<rect x="70" y="18" width="10" height="212" class="pfd-sc-obj"/><rect x="70" y="18" width="122" height="8" class="pfd-sc-obj"/><rect x="40" y="226" width="80" height="8" class="pfd-sc-obj"/>` +
      `<path d="${zig}" class="pfd-sc-ressort"/><rect x="158" y="112" width="44" height="44" class="pfd-sc-sys"/>${txt(206, 70, 'ressort')}${txt(30, 216, 'potence')}`,
    points: { G: [180, 134], A: [180, 112] }, nomsPts: { G: 'centre de la masse', A: 'accroche du ressort' },
    acteurs: [TERRE, touche2('ressort', 'le ressort', 'la masse'), AIR], air: NEGL(),
    distracteurs: [{ id: 'potence', nom: 'la potence', diag: 'La potence ne touche pas la masse : c\'est le ressort qui la tient.' }],
    forces: [POIDS, { acteur: 'ressort', type: 'contact', lib: 'force exercée par le ressort', pts: ['A'], angs: [90], noms: ['T'], diagDir: 'le ressort retient la masse : sa force est <b>verticale, vers le haut</b>.', indNom: `La force d'un ressort tendu (ou d'un fil) se note ${nomV('T')} (tension).` }],
    nomsProposes: NOMS_BASE,
    comp: { bonne: 'oui', expl: `La masse est immobile : ${nomV('P')} et ${nomV('T')} se compensent.`, indice: 'La masse est immobile.' } };

  /* ===== pendule ===== */
  const O_P = [150, 24], C_P = [226, 150], A_P = versPt(C_P, 16, O_P), T_P = angVers(A_P, O_P);
  S.pendule = { id: 'pendule', titre: 'Pendule', systeme: 'la boule', enonce: 'Une boule est accrochée au bout d\'un fil ; le pendule oscille. On l\'étudie quand il est écarté de la verticale.',
    dessin: `<rect x="105" y="14" width="90" height="10" class="pfd-sc-obj"/>${fil(O_P[0], O_P[1], A_P[0], A_P[1])}<line x1="150" y1="24" x2="150" y2="190" class="pfd-sc-verticale"/>` +
      `<circle cx="${C_P[0]}" cy="${C_P[1]}" r="16" class="pfd-sc-sys"/>${txt(102, 46, 'point d\'attache')}`,
    points: { G: C_P, A: A_P }, nomsPts: { G: 'centre de la boule', A: 'accroche du fil' },
    acteurs: [TERRE, touche2('fil', 'le fil', 'la boule'), AIR], air: NEGL('Le pendule oscille lentement : on néglige la force de l\'air.'),
    distracteurs: [{ id: 'support', nom: 'le support', diag: 'Le support ne touche pas la boule : c\'est le fil qui la tient.' }],
    forces: [POIDS, { acteur: 'fil', type: 'contact', lib: 'force exercée par le fil', pts: ['A'], angs: [T_P], noms: ['T'], diagDir: 'un fil tire <b>le long du fil, vers le point d\'attache</b>.', indNom: `La force exercée par un fil se note ${nomV('T')} (tension).` }],
    speciales: [{ label: 'le long du fil, vers le point d\'attache', ang: T_P }, { label: 'le long du fil, vers la boule', ang: T_P - 180 }], nomsProposes: NOMS_BASE,
    comp: { bonne: 'non', expl: `${nomV('P')} et ${nomV('T')} ne sont pas sur la même droite : elles ne peuvent pas se compenser. Le pendule ne reste pas immobile : il revient vers la verticale.`, indice: 'Deux forces qui se compensent ont la même direction ; regarde les deux flèches.' } };

  /* ===== balle lancée ===== */
  S.balle = { id: 'balle', titre: 'Balle lancée', systeme: 'la balle', enonce: 'Une balle vient d\'être lancée vers le haut : elle a quitté la main. On néglige les frottements de l\'air.',
    dessin: `<path d="M160,178 Q186,96 210,74" class="pfd-sc-mvt"/>${main(118, 196)}<circle cx="220" cy="64" r="14" class="pfd-sc-sys"/>${sol(20, 340, 226)}`,
    points: { G: [220, 64] }, nomsPts: { G: 'centre de la balle' },
    acteurs: [TERRE, AIR], air: NEGL('L\'énoncé le dit : on néglige les frottements de l\'air (et la balle n\'est pas très légère pour son volume).'),
    distracteurs: [{ id: 'main', nom: 'la main', diag: 'La main ne touche plus la balle : elle n\'exerce plus de force.' }, { id: 'sol', nom: 'le sol', diag: 'Le sol ne touche pas la balle.' }],
    forces: [POIDS], nomsProposes: ['P', 'F', 'T', 'f'],
    comp: { bonne: 'non', expl: `Une seule force, ${nomV('P')} : rien ne la compense. La balle ne monte pas en ligne droite à vitesse constante : elle ralentit, puis retombe.`, indice: 'Il n\'y a qu\'une seule force.' } };

  /* ===== bouchon qui flotte ===== */
  S.bouchon = { id: 'bouchon', titre: 'Bouchon qui flotte', systeme: 'le bouchon', enonce: 'Un bouchon en liège flotte, immobile, à la surface de l\'eau.',
    dessin: `<rect x="92" y="120" width="176" height="90" class="pfd-sc-eau"/><path d="M90,70 V212 H270 V70" class="pfd-sc-recip"/><rect x="150" y="96" width="60" height="44" class="pfd-sc-sys"/>${txt(100, 200, 'eau')}`,
    points: { G: [180, 118], A: [180, 140] }, nomsPts: { G: 'centre du bouchon', A: 'centre de la face du dessous' },
    acteurs: [TERRE, { id: 'eau', nom: 'l\'eau', pourquoi: 'elle touche le bouchon (poussée d\'Archimède)', manque: 'L\'eau touche le bouchon : elle exerce une force de contact (elle le pousse vers le haut).' }, AIR],
    air: NEGL('La partie hors de l\'eau touche l\'air, mais la poussée d\'Archimède de l\'air est très faible devant celle de l\'eau : on néglige la force de l\'air.'),
    distracteurs: [{ id: 'recipient', nom: 'le récipient', diag: 'Le récipient ne touche pas le bouchon.' }],
    forces: [POIDS, { acteur: 'eau', type: 'contact', lib: 'force exercée par l\'eau', pts: ['G', 'A'], angs: [90], noms: ['Farchi'], diagDir: 'la poussée d\'Archimède est <b>verticale, vers le haut</b>.', diagPt: 'l\'eau touche toute la partie immergée : on dessine la poussée depuis le centre G (ou le centre de la face immergée A).', indNom: `La force verticale vers le haut exercée par un fluide est la poussée d'Archimède ${nomV('Farchi')}.` }],
    nomsProposes: NOMS_BASE,
    comp: { bonne: 'oui', expl: `Le bouchon est immobile : ${nomV('P')} et ${nomV('Farchi')} se compensent.`, indice: 'Le bouchon est immobile.' } };

  /* ===== goutte dans l'huile ===== */
  S.goutte = { id: 'goutte', titre: 'Goutte qui tombe dans l\'huile', systeme: 'la goutte', enonce: 'Une goutte de permanganate de potassium tombe dans l\'huile, à vitesse constante.',
    dessin: `<rect x="152" y="40" width="56" height="180" class="pfd-sc-eau"/><path d="M150,20 V214 Q150,222 158,222 H202 Q210,222 210,214 V20" class="pfd-sc-recip"/><circle cx="180" cy="110" r="9" class="pfd-sc-sys"/>${mvt(232, 92, 232, 140, '')}${txt(240, 120, 'chute')}${txt(218, 200, 'huile')}`,
    points: { G: [180, 110] }, nomsPts: { G: 'centre de la goutte' },
    acteurs: [TERRE, { id: 'huile', nom: 'l\'huile', pourquoi: 'elle touche la goutte (poussée d\'Archimède et frottements)', manque: 'L\'huile touche la goutte : elle exerce une force de contact (qu\'on sépare en poussée d\'Archimède et frottements).' }],
    distracteurs: [{ id: 'eprouvette', nom: 'l\'éprouvette', diag: 'L\'éprouvette ne touche pas la goutte.' }, { id: 'air', nom: 'l\'air', diag: 'La goutte est dans l\'huile : l\'air ne la touche pas.' }],
    forces: [POIDS, { acteur: 'huile', type: 'contact', lib: 'poussée d\'Archimède de l\'huile', pts: ['G'], angs: [90], noms: ['Farchi'], diagDir: 'la poussée d\'Archimède est <b>verticale, vers le haut</b>.', diagPt: 'l\'huile entoure toute la goutte : on dessine la force depuis le centre G.', indNom: `La poussée d'Archimède d'un fluide se note ${nomV('Farchi')}.` },
      { acteur: 'huile', type: 'contact', lib: 'frottement de l\'huile', pts: ['G'], angs: [90], noms: ['f'], diagDir: 'les frottements s\'opposent au mouvement : la goutte descend, <span class="vec-nom">f</span> est <b>vertical, vers le haut</b>.', diagPt: 'l\'huile entoure toute la goutte : on dessine la force depuis le centre G.', indNom: `Les frottements se notent ${nomV('f')}.` }],
    nomsProposes: NOMS_BASE,
    comp: { q: 'La goutte descend à vitesse constante, en ligne droite. Ces forces se compensent-elles ?', bonne: 'oui', expl: `Mouvement rectiligne uniforme : d'après le principe d'inertie, ${nomV('P')} + ${nomV('Farchi')} + ${nomV('f')} = <span class="vec-nom">0</span>. L'huile exerce une seule action, qu'on sépare en deux forces (comme dans l'exercice 19).`, indice: 'Mouvement rectiligne à vitesse constante : pense au principe d\'inertie.' } };

  /* ===== brique immobile sur une planche inclinée ===== */
  const G_INC = sur(0, 20);
  S.incline = { id: 'incline', titre: 'Brique immobile sur une planche inclinée', systeme: 'la brique', enonce: 'Une brique est posée sur une planche inclinée ; elle reste immobile.',
    dessin: `${plan()}${brique()}${txt(50, 214, 'planche inclinée')}`,
    points: { G: G_INC, A: AI.map(v => +v.toFixed(1)) }, nomsPts: { G: 'centre de la brique', A: 'contact avec la planche' },
    acteurs: [TERRE, touche('planche', 'la planche', 'la brique'), AIR], air: NEGL(),
    forces: [POIDS, RN_INC('planche'), F_INC('planche')], speciales: SPEC_INC, nomsProposes: NOMS_BASE,
    comp: { bonne: 'oui', expl: `La brique est immobile : la réaction de la planche ${nomV('R')} = ${nomV('RN')} + ${nomV('f')} compense le poids. Sans frottements, elle glisserait.`, indice: 'La brique reste immobile.' } };

  /* ===== brique qui glisse ===== */
  const m1 = sur(-24, 58), m2 = sur(38, 58);
  S.glisse = { id: 'glisse', titre: 'Brique qui glisse sur une planche inclinée', systeme: 'la brique', enonce: 'Une brique glisse vers le bas d\'une planche inclinée, de plus en plus vite.',
    dessin: `${plan()}${brique()}${mvt(m1[0], m1[1], m2[0], m2[1], '')}${txt(m2[0] + 6, m2[1] - 6, 'glisse')}${txt(50, 214, 'planche inclinée')}`,
    points: { G: G_INC, A: AI.map(v => +v.toFixed(1)) }, nomsPts: { G: 'centre de la brique', A: 'contact avec la planche' },
    acteurs: [TERRE, touche('planche', 'la planche', 'la brique'), AIR], air: NEGL(),
    forces: [POIDS, RN_INC('planche'), Object.assign(F_INC('planche'), { diagDir: 'les frottements s\'opposent au glissement : la brique glisse vers le bas, <span class="vec-nom">f</span> est <b>parallèle au support, vers le haut de la pente</b>.' })],
    speciales: SPEC_INC, nomsProposes: NOMS_BASE,
    comp: { bonne: 'non', expl: 'La brique accélère : les forces ne se compensent pas ; leur somme est dirigée vers le bas de la pente.', indice: 'La brique glisse de plus en plus vite.' } };

  /* ===== aimant posé près d'un autre aimant ===== */
  S.aimants = { id: 'aimants', titre: 'Aimant posé près d\'un autre aimant', systeme: 'l\'aimant de gauche', enonce: 'Deux aimants sont posés sur une table ; ils s\'attirent, mais l\'aimant de gauche reste immobile.',
    dessin: `<rect x="30" y="170" width="300" height="10" class="pfd-sc-obj"/>${aimant(86, 140, true)}${aimant(214, 140, false)}${txt(40, 202, 'table')}${txt(214, 130, 'aimant de droite')}`,
    points: { G: [128, 155], A: [128, 170] }, nomsPts: { G: 'centre de l\'aimant de gauche', A: 'contact avec la table' },
    acteurs: [TERRE, { id: 'aimant', nom: 'l\'aimant de droite', court: 'aimant (droite)', pourquoi: 'il attire l\'aimant de gauche, à distance', manque: 'L\'aimant de droite attire l\'aimant de gauche, sans le toucher : force magnétique, à distance.' }, touche('table', 'la table', 'l\'aimant'), AIR],
    air: NEGL(), sysCourt: 'aimant (gauche)',
    forces: [POIDS, { acteur: 'aimant', type: 'distance', lib: 'force exercée par l\'aimant de droite', pts: ['G'], angs: [0], noms: ['Fmag'], diagDir: 'les deux aimants s\'attirent (pôles S et N face à face) : la force est dirigée <b>vers l\'aimant de droite</b>.', indNom: `La force exercée par un aimant se note ${nomV('Fmag')}.` },
      RN_HORIZ('table', 'réaction perpendiculaire de la table'),
      { acteur: 'table', type: 'contact', lib: 'frottement de la table', pts: ['A'], angs: [180], noms: ['f'], diagDir: 'l\'aimant reste immobile : les frottements de la table s\'opposent au glissement qu\'il aurait vers l\'autre aimant, donc <b>vers la gauche</b>.', indNom: `Les frottements se notent ${nomV('f')}.` }],
    nomsProposes: ['P', 'RN', 'f', 'T', 'Fmag', 'Felec'],
    comp: { bonne: 'oui', expl: `L'aimant est immobile : ${nomV('P')} et ${nomV('RN')} se compensent, ${nomV('Fmag')} et ${nomV('f')} aussi.`, indice: 'L\'aimant reste immobile.' } };

  /* ===== boule d'aluminium et bâton d'ébonite frotté ===== */
  const O_B = [120, 24], C_B = [190, 140], A_B = versPt(C_B, 10, O_B), T_B = angVers(A_B, O_B);
  S.ebonite = { id: 'ebonite', titre: 'Boule d\'aluminium attirée par un bâton d\'ébonite frotté', systeme: 'la boule', enonce: 'Une boule d\'aluminium, suspendue à un fil, est attirée par un bâton d\'ébonite frotté (électrisé) ; elle reste immobile, déviée.',
    dessin: `<rect x="80" y="14" width="90" height="10" class="pfd-sc-obj"/>${fil(O_B[0], O_B[1], A_B[0], A_B[1])}<line x1="120" y1="24" x2="120" y2="180" class="pfd-sc-verticale"/><circle cx="${C_B[0]}" cy="${C_B[1]}" r="10" class="pfd-sc-sys"/>` +
      `<rect x="226" y="135" width="110" height="10" rx="4" class="pfd-sc-obj"/>${txt(281, 128, '− − − −', 'middle')}${txt(281, 166, 'bâton frotté', 'middle')}`,
    points: { G: C_B, A: A_B }, nomsPts: { G: 'centre de la boule', A: 'accroche du fil' },
    acteurs: [TERRE, touche2('fil', 'le fil', 'la boule'), { id: 'baton', nom: 'le bâton frotté', pourquoi: 'il attire la boule, à distance (force électrique)', manque: 'Le bâton frotté attire la boule sans la toucher : force électrique, à distance.' }, AIR],
    air: NEGL('La boule est immobile et pas très légère pour son volume : on néglige la force de l\'air.'),
    distracteurs: [{ id: 'support', nom: 'le support', diag: 'Le support ne touche pas la boule : c\'est le fil qui la tient.' }],
    forces: [POIDS, { acteur: 'fil', type: 'contact', lib: 'force exercée par le fil', pts: ['A'], angs: [T_B], noms: ['T'], diagDir: 'un fil tire <b>le long du fil, vers le point d\'attache</b>.', indNom: `La force exercée par un fil se note ${nomV('T')}.` },
      { acteur: 'baton', type: 'distance', lib: 'force exercée par le bâton', pts: ['G'], angs: [0], noms: ['Felec'], diagDir: 'le bâton attire la boule : la force est dirigée <b>vers le bâton</b>, horizontale vers la droite.', indNom: `La force exercée par un objet électrisé se note ${nomV('Felec')}.` }],
    speciales: [{ label: 'le long du fil, vers le point d\'attache', ang: T_B }], nomsProposes: ['P', 'RN', 'f', 'T', 'Fmag', 'Felec'],
    comp: { bonne: 'oui', expl: `La boule est immobile : ${nomV('P')} + ${nomV('T')} + ${nomV('Felec')} = <span class="vec-nom">0</span> (trois forces qui se compensent).`, indice: 'La boule reste immobile.' } };

  /* ===== clou attiré par un aimant ===== */
  S.clou = { id: 'clou', titre: 'Clou attiré par un aimant', systeme: 'le clou', enonce: 'Un clou, posé sur le sol, est attiré par un aimant placé au-dessus de lui, sur la gauche ; il reste incliné, immobile.',
    dessin: `<rect x="60" y="30" width="70" height="26" class="pfd-sc-obj"/>${txt(95, 48, 'aimant', 'middle')}${sol(190, 320, 210)}<line x1="250" y1="210" x2="204" y2="140" class="pfd-sc-clou"/><line x1="198.2" y1="143.8" x2="209.8" y2="136.2" class="pfd-sc-clou"/>`,
    points: { G: [227, 175], A: [250, 210] }, nomsPts: { G: 'centre du clou', A: 'contact avec le sol' },
    acteurs: [TERRE, { id: 'aimant', nom: 'l\'aimant', pourquoi: 'il attire le clou, à distance', manque: 'L\'aimant attire le clou sans le toucher : force magnétique, à distance.' }, touche2('sol', 'le sol', 'le clou'), AIR],
    air: NEGL(),
    forces: [POIDS, { acteur: 'aimant', type: 'distance', lib: 'force exercée par l\'aimant', pts: ['G'], angs: [135], noms: ['Fmag'], diagDir: 'l\'aimant attire le clou : la force est dirigée <b>vers l\'aimant</b>, en haut à gauche.', indNom: `La force exercée par un aimant se note ${nomV('Fmag')}.` },
      { acteur: 'sol', type: 'contact', lib: 'réaction du sol', pts: ['A'], angs: [90, 45], noms: ['R', 'RN'], diagDir: 'le sol empêche le clou de s\'enfoncer : sa réaction est dirigée <b>vers le haut</b> (verticale, ou penchée vers la droite car elle retient aussi le clou de glisser).', indNom: `La réaction du sol se note ${nomV('R')}.` }],
    nomsProposes: ['P', 'R', 'f', 'T', 'Fmag', 'Felec'] };

  /* ===== voiture au démarrage ===== */
  S.voiture = { id: 'voiture', titre: 'Voiture au démarrage (traction avant)', systeme: 'la voiture', lf: 46, enonce: 'Une voiture à traction avant (les roues avant sont motrices) démarre vers la droite.',
    dessin: `<path d="M58,192 L58,160 Q60,150 74,148 L122,144 L146,120 Q151,115 161,115 L228,115 Q238,115 246,122 L270,145 L296,150 Q306,152 306,165 L306,192 Z" class="pfd-sc-sys"/>` +
      `<path d="M152,124 L194,124 L194,142 L134,142 Z M202,124 L236,124 L254,142 L202,142 Z" class="pfd-sc-vitre"/><circle cx="110" cy="192" r="18" class="pfd-sc-roue"/><circle cx="250" cy="192" r="18" class="pfd-sc-roue"/>${sol(20, 340, 210)}` +
      `${mvt(140, 70, 230, 70, '')}${txt(234, 74, 'démarre')}${txt(110, 234, 'arrière', 'middle')}${txt(250, 234, 'avant', 'middle')}`,
    points: { G: [204, 150], B: [110, 210], A: [250, 210] }, nomsPts: { G: 'centre de gravité (moteur à l\'avant)', B: 'contact roue arrière-route', A: 'contact roue avant-route' },
    acteurs: [TERRE, touche('route', 'la route', 'les roues'), Object.assign({}, AIR, { pourquoi: 'il touche la carrosserie et la freine (frottements)' })],
    air: { neglige: false, cause: 'frottements', raison: 'Une voiture a une grande surface face à l\'air, et sa vitesse augmente : les frottements de l\'air ne sont pas négligeables.', indice: 'Une voiture qui roule a une grande surface face à l\'air : ses frottements comptent.' },
    distracteurs: [{ id: 'moteur', nom: 'le moteur', diag: 'Le moteur fait partie de la voiture (le système) : il n\'exerce pas de force extérieure. C\'est la route qui pousse les roues motrices vers l\'avant.' },
      { id: 'conducteur', nom: 'le conducteur', diag: 'Le conducteur est dans la voiture : il fait partie du système.' }],
    forces: [POIDS,
      { acteur: 'route', type: 'contact', lib: 'route sur les roues avant : réaction perpendiculaire', pts: ['A'], angs: [90], noms: ['RN'], diagDir: 'la réaction normale est <b>perpendiculaire à la route</b> : verticale, vers le haut.', diagPt: 'les roues avant touchent la route au point A.', indNom: `La réaction perpendiculaire au support se note ${nomV('RN')}.` },
      { acteur: 'route', type: 'contact', lib: 'route sur les roues avant (motrices) : frottement', pts: ['A'], angs: [0], noms: ['Fm'], diagDir: 'les roues motrices poussent la route vers l\'arrière ; la route les pousse donc <b>vers l\'avant</b> : c\'est la force motrice.', diagPt: 'les roues avant (motrices) touchent la route au point A.', indNom: `Ce frottement de la route sur les roues motrices fait avancer la voiture : c'est la force motrice ${nomV('Fm')}.` },
      { acteur: 'route', type: 'contact', lib: 'route sur les roues arrière : réaction perpendiculaire', pts: ['B'], angs: [90], noms: ['RN'], cote: -1, diagDir: 'la réaction normale est <b>perpendiculaire à la route</b> : verticale, vers le haut.', diagPt: 'les roues arrière touchent la route au point B.', indNom: `La réaction perpendiculaire au support se note ${nomV('RN')}.` },
      { acteur: 'route', type: 'contact', lib: 'route sur les roues arrière : frottement', pts: ['B'], angs: [180], noms: ['f'], diagDir: 'sur les roues arrière (non motrices), les frottements de la route s\'opposent au mouvement : <b>vers l\'arrière</b>.', diagPt: 'les roues arrière touchent la route au point B.', indNom: `Les frottements se notent ${nomV('f')}.` },
      { acteur: 'air', type: 'contact', lib: 'force de l\'air (frottements)', pts: ['G'], angs: [180], noms: ['Fair', 'f'], diagDir: 'les frottements de l\'air s\'opposent au mouvement : <b>vers l\'arrière</b>.', diagPt: 'l\'air touche toute la carrosserie : on dessine sa force depuis le centre G.', indNom: `La force de l'air (ses frottements) se note ${nomV('Fair')}.` }],
    nomsProposes: ['P', 'RN', 'f', 'Fair', 'Fm', 'Farchi'],
    comp: { bonne: 'non', expl: 'La voiture accélère : les forces ne se compensent pas ; leur somme est dirigée vers l\'avant.', indice: 'La voiture démarre : sa vitesse augmente.' } };

  /* ===== livre tiré par une corde (ajouté) ===== */
  S.livre = { id: 'livre', titre: 'Livre que l\'on tire avec une corde', systeme: 'le livre', enonce: 'On tire un livre avec une corde horizontale : il glisse sur la table, en ligne droite, à vitesse constante.',
    dessin: `<rect x="30" y="170" width="300" height="10" class="pfd-sc-obj"/><rect x="120" y="138" width="96" height="32" rx="3" class="pfd-sc-sys"/>${fil(216, 154, 316, 154)}${main(312, 154)}${mvt(132, 118, 206, 118, '')}${txt(212, 122, 'glisse')}${txt(40, 202, 'table')}${txt(262, 146, 'corde', 'middle')}`,
    points: { G: [168, 154], A: [168, 170], B: [216, 154] }, nomsPts: { G: 'centre du livre', A: 'contact avec la table', B: 'accroche de la corde' },
    acteurs: [TERRE, touche('table', 'la table', 'le livre'), touche('corde', 'la corde', 'le livre'), AIR], air: NEGL(),
    distracteurs: [{ id: 'main', nom: 'la main', diag: 'La main tient la corde mais ne touche pas le livre : c\'est la corde qui le tire.' }],
    forces: [POIDS, RN_HORIZ('table', 'réaction perpendiculaire de la table'),
      { acteur: 'table', type: 'contact', lib: 'frottement de la table', pts: ['A'], angs: [180], noms: ['f'], diagDir: 'les frottements s\'opposent au glissement du livre vers la droite : <b>vers la gauche</b>.', indNom: `Les frottements se notent ${nomV('f')}.` },
      { acteur: 'corde', type: 'contact', lib: 'force exercée par la corde', pts: ['B'], angs: [0], noms: ['F', 'T'], diagDir: 'la corde tire le livre <b>le long de la corde</b>, vers la droite.', diagPt: 'la corde touche le livre au point B.', indNom: `La force de la corde se note ${nomV('F')} (ou ${nomV('T')}, tension).` }],
    nomsProposes: ['P', 'RN', 'f', 'F', 'Fm', 'Farchi'],
    comp: { bonne: 'oui', expl: `Mouvement rectiligne uniforme : les forces se compensent (${nomV('P')} et ${nomV('RN')} ; ${nomV('F')} et ${nomV('f')}).`, indice: 'Le livre va en ligne droite à vitesse constante : pense au principe d\'inertie.' } };

  /* ===== skieur avec frottements (ajouté) ===== */
  const G_SKI = sur(0, 20);
  S.skieur = { id: 'skieur', titre: 'Skieur qui descend une piste, avec frottements', systeme: 'le skieur', enonce: 'Un skieur descend une piste droite en prenant de la vitesse. On néglige l\'action de l\'air.',
    dessin: `${plan()}${skieur()}${txt(50, 214, 'piste')}`,
    points: { G: G_SKI, A: AI.map(v => +v.toFixed(1)) }, nomsPts: { G: 'centre du skieur', A: 'contact skis-neige' },
    acteurs: [TERRE, touche('piste', 'la piste', 'les skis'), AIR], air: NEGL('L\'énoncé le dit : on néglige l\'action de l\'air.'),
    distracteurs: [{ id: 'teleski', nom: 'le téléski', diag: 'Le skieur a lâché le téléski : il ne le touche plus.' }],
    forces: [POIDS, RN_INC('piste'), Object.assign(F_INC('piste'), { diagDir: 'les frottements de la neige s\'opposent au glissement vers le bas : <b>parallèles au support, vers le haut de la pente</b>.' })],
    speciales: SPEC_INC, nomsProposes: NOMS_BASE,
    comp: { bonne: 'non', expl: 'Le skieur accélère : les forces ne se compensent pas ; leur somme est dirigée vers le bas de la pente.', indice: 'Le skieur prend de la vitesse.' } };

  /* ===== parachutiste (ajouté) ===== */
  S.parachute = { id: 'parachute', titre: 'Parachutiste à vitesse constante', systeme: 'le parachutiste et son parachute', sysCourt: 'parachutiste', enonce: 'Un parachutiste, parachute ouvert, descend verticalement à vitesse constante.',
    // dessin descendu de 20 px et flèches plus courtes : la force de l'air, depuis le parachute, reste dans le cadre
    lf: 46, dessin: `<g transform="translate(0,20)"><path d="M110,82 Q180,0 250,82 Q215,70 180,76 Q145,70 110,82 Z" class="pfd-sc-sys"/>${fil(112, 82, 180, 150)}${fil(248, 82, 180, 150)}${fil(180, 76, 180, 150)}` +
      `<circle cx="180" cy="148" r="7" class="pfd-sc-sys"/><path d="M180,155 V184 M180,184 L172,202 M180,184 L188,202 M180,162 L168,152 M180,162 L192,152" class="pfd-sc-corps"/>${mvt(276, 110, 276, 170, '')}${txt(284, 144, 'descend')}</g>`,
    points: { G: [180, 188], C: [180, 70] }, nomsPts: { G: 'centre du parachutiste', C: 'centre du parachute' },
    acteurs: [TERRE, Object.assign({}, AIR, { pourquoi: 'il touche le parachute et freine la chute (frottements)' })],
    air: { neglige: false, cause: 'frottements', raison: 'Le parachute a une très grande surface : les frottements de l\'air ne sont pas négligeables, ce sont eux qui freinent la chute.', indice: 'Qu\'est-ce qui freine la chute du parachutiste ?' },
    distracteurs: [{ id: 'avion', nom: 'l\'avion', diag: 'Le parachutiste a quitté l\'avion : l\'avion ne le touche plus.' }, { id: 'sol', nom: 'le sol', diag: 'Le parachutiste n\'a pas encore atteint le sol.' }],
    forces: [POIDS, { acteur: 'air', type: 'contact', lib: 'force de l\'air (frottements)', pts: ['C', 'G'], angs: [90], noms: ['Fair', 'f'], diagDir: 'les frottements de l\'air freinent la chute : <b>verticaux, vers le haut</b>.', diagPt: 'l\'air agit surtout sur le parachute : on dessine la force depuis le parachute C (ou depuis G).', indNom: `La force de l'air (ses frottements) se note ${nomV('Fair')}.` }],
    nomsProposes: ['P', 'RN', 'f', 'T', 'Farchi', 'Fair'],
    comp: { bonne: 'oui', expl: `Mouvement rectiligne uniforme : d'après le principe d'inertie, ${nomV('P')} et ${nomV('Fair')} se compensent.`, indice: 'Il descend en ligne droite à vitesse constante.' } };

  /* ===== palet d'air-hockey (cours) ===== */
  S.palet = { id: 'palet', titre: 'Palet d\'air-hockey', systeme: 'le palet', enonce: 'Un palet glisse sur une table d\'air-hockey : un coussin d\'air supprime les frottements.',
    dessin: `<rect x="30" y="170" width="300" height="10" class="pfd-sc-obj"/><rect x="148" y="154" width="64" height="16" rx="7" class="pfd-sc-sys"/>${mvt(150, 132, 220, 132, '')}${txt(226, 136, 'glisse')}${txt(40, 202, 'table (coussin d\'air)')}`,
    points: { G: [180, 160], A: [180, 170] }, nomsPts: { G: 'centre du palet', A: 'contact avec la table' },
    acteurs: [TERRE, touche('table', 'la table', 'le palet'), AIR], air: NEGL('Le coussin d\'air fait partie de l\'action de la table ; l\'air autour du palet le freine très peu : on néglige sa force.'),
    distracteurs: [{ id: 'crosse', nom: 'la crosse', diag: 'La crosse a frappé le palet, mais elle ne le touche plus.' }],
    forces: [POIDS, RN_HORIZ('table', 'force exercée par la table', true)], nomsProposes: NOMS_BASE,
    comp: { bonne: 'oui', expl: `${nomV('RN')} et ${nomV('P')} se compensent toujours : sans frottement, le palet glisse en ligne droite à vitesse constante.`, indice: 'Le support est horizontal, et il n\'y a pas de frottement.' } };

  /* ===== skieur sans frottements (cours) ===== */
  S.skieurSans = { id: 'skieurSans', titre: 'Skieur sans frottements', systeme: 'le skieur', enonce: 'Un skieur descend une piste ; on néglige tous les frottements (neige et air).',
    dessin: `${plan()}${skieur()}${txt(50, 214, 'piste')}`,
    points: { G: G_SKI, A: AI.map(v => +v.toFixed(1)) }, nomsPts: { G: 'centre du skieur', A: 'contact skis-neige' },
    acteurs: [TERRE, touche('piste', 'la piste', 'les skis'), AIR], air: NEGL('L\'énoncé le dit : on néglige tous les frottements, ceux de l\'air compris.'),
    forces: [POIDS, Object.assign(RN_INC('piste'), { noms: ['RN', 'R'], diagDir: 'sans frottement, la réaction du support est <b>perpendiculaire au support</b>.' })],
    speciales: SPEC_INC, nomsProposes: NOMS_BASE,
    comp: { bonne: 'non', expl: `${nomV('RN')} et ${nomV('P')} n'ont pas la même direction : elles ne se compensent pas. Leur somme Σ <span class="vec-nom">F</span> = ${nomV('RN')} + ${nomV('P')} est dirigée vers le bas de la pente : le skieur accélère.`, indice: 'Regarde les directions des deux flèches.' } };

  /* ===== ballon de baudruche gonflé à l'hélium (cours : la force de l'air) ===== */
  S.helium = { id: 'helium', titre: 'Ballon d\'hélium retenu par une ficelle', systeme: 'le ballon', enonce: 'Un ballon de baudruche gonflé à l\'hélium est retenu par une ficelle attachée à un petit poids : il reste immobile.',
    dessin: `${sol(60, 300, 232)}<rect x="166" y="212" width="28" height="20" class="pfd-sc-obj"/>${fil(180, 136, 180, 212)}<ellipse cx="180" cy="92" rx="34" ry="40" class="pfd-sc-sys"/>` +
      `<path d="M175,138 L185,138 L180,131 Z" class="pfd-sc-sys"/>${txt(172, 200, 'ficelle', 'end')}${txt(228, 60, 'hélium')}`,
    points: { G: [180, 92], A: [180, 132] }, nomsPts: { G: 'centre du ballon', A: 'accroche de la ficelle' },
    acteurs: [TERRE, touche('ficelle', 'la ficelle', 'le ballon'), Object.assign({}, AIR, { pourquoi: 'il touche le ballon et le pousse vers le haut (poussée d\'Archimède)' })],
    air: { neglige: false, cause: 'archi', raison: 'Le ballon d\'hélium est très léger pour son volume : la poussée d\'Archimède de l\'air n\'est pas négligeable (lâché, il monterait).', indice: 'Lâché, le ballon monterait : qu\'est-ce qui le pousse vers le haut ?' },
    distracteurs: [{ id: 'poids', nom: 'le petit poids', diag: 'Le petit poids ne touche pas le ballon : c\'est la ficelle qui le retient.' }],
    forces: [POIDS, { acteur: 'ficelle', type: 'contact', lib: 'force exercée par la ficelle', pts: ['A'], angs: [270], noms: ['T'], diagDir: 'la ficelle retient le ballon : elle tire <b>vers le bas</b>, le long de la ficelle.', indNom: `La force d'une ficelle (d'un fil) se note ${nomV('T')} (tension).` },
      { acteur: 'air', type: 'contact', lib: 'poussée d\'Archimède de l\'air', pts: ['G'], angs: [90], noms: ['Farchi'], diagDir: 'la poussée d\'Archimède est <b>verticale, vers le haut</b>.', diagPt: 'l\'air entoure tout le ballon : on dessine sa poussée depuis le centre G.', indNom: `La poussée d'Archimède se note ${nomV('Farchi')}.` }],
    nomsProposes: ['P', 'RN', 'f', 'T', 'Farchi', 'Fair'],
    comp: { bonne: 'oui', expl: `Le ballon est immobile : ${nomV('P')} + ${nomV('T')} + ${nomV('Farchi')} = <span class="vec-nom">0</span>. La poussée d'Archimède compense le poids et la tension de la ficelle.`, indice: 'Le ballon reste immobile.' } };

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
    return `<path d="M${J(-11, -4)} L${J(-11, 66)} L${J(11, 66)} L${J(11, -4)} Z" class="pfd-sc-jambe"/><path d="M${J(-11, 50)} L${J(11, 50)}" class="pfd-sc-chaussette"/>` +
      `<path d="${ch}" class="pfd-sc-chaussure"/><path d="M${P(-2, 10)} L${P(-44, 10)}" class="pfd-sc-semelle"/>`;
  }
  const ballon = (x, y) => `<circle cx="${x}" cy="${y}" r="30" class="pfd-sc-sys"/><path d="M${x - 9},${y - 8} L${x + 9},${y - 8} L${x + 13},${y + 7} L${x},${y + 16} L${x - 13},${y + 7} Z" class="pfd-sc-penta"/>`;
  // au moment de la frappe : le pied, tourné de 45°, touche le ballon en B ; sa force, à 45° vers le haut, passe par le centre
  const B_PIED = [+(210 - 30 * Math.SQRT1_2).toFixed(1), +(140 + 30 * Math.SQRT1_2).toFixed(1)];
  const P_B = { acteur: 'terre', type: 'distance', pts: ['G'], angs: [270], noms: ['P'] }, RN_B = { acteur: 'sol', type: 'contact', pts: ['A'], angs: [90], noms: ['RN'] };
  const SOL_ACT = touche2('sol', 'le sol', 'le ballon');
  const BALLON = [
    { id: 'avant', titre: 'Avant la frappe', systeme: 'le ballon', lf: 72, dessin: `${SOL_B}${pied([118, 160], 0, 0)}${ballon(210, 140)}`, points: { G: [210, 140], A: [210, 170] }, nomsPts: {},
      acteurs: [TERRE, SOL_ACT, AIR], air: NEGL(), forces: [P_B, RN_B],
      texte: `La Terre agit à distance (pointillés) : poids ${nomV('P')}, depuis G, vers le bas. Le sol touche le ballon (trait plein) : ${nomV('RN')}, depuis A, vers le haut. L'air touche le ballon, mais sa force est négligeable. ${nomV('P')} et ${nomV('RN')} se compensent : le ballon reste immobile.` },
    { id: 'pendant', titre: 'Au moment de la frappe', systeme: 'le ballon', lf: 72, dessin: `${SOL_B}${ballon(210, 140)}${pied(B_PIED, 45, 0)}`, points: { G: [210, 140], A: [210, 170], B: B_PIED }, nomsPts: {},
      acteurs: [TERRE, touche2('pied', 'le pied', 'le ballon'), SOL_ACT, AIR], air: NEGL(),
      forces: [P_B, RN_B, { acteur: 'pied', type: 'contact', pts: ['B'], angs: [45], noms: ['Fpied'] }],
      texte: `${nomV('P')} et ${nomV('RN')}, plus le pied, qui touche le ballon en B : ${nomV('Fpied')}, depuis B, à 45° vers le haut. La force de l'air est encore négligeable.` },
    { id: 'apres', titre: 'Après la frappe', systeme: 'le ballon', lf: 72, dessin: `${SOL_B}${pied([146, 126], -35, -40)}${ballon(250, 66)}${mvt(284, 36, 314, 6, '')}`, points: { G: [250, 66] }, nomsPts: {},
      acteurs: [TERRE, Object.assign({}, AIR, { pourquoi: 'il touche le ballon et le freine (frottements)' })],
      air: { neglige: false, cause: 'frottements', raison: 'Le ballon va vite : les frottements de l\'air ne sont pas négligeables.' },
      forces: [P_B, { acteur: 'air', type: 'contact', pts: ['G'], angs: [225], noms: ['Fair'] }],
      texte: `Le pied et le sol ne touchent plus le ballon. Il reste le poids ${nomV('P')} et la force de l'air ${nomV('Fair')} : le ballon va vite, les frottements de l'air ne sont pas négligeables. ${nomV('Fair')} s'oppose au mouvement.` },
  ];
  // l'exemple traité : pour chaque moment, le diagramme objet-action au-dessus du dessin
  function ballonHTML() {
    const dos = window.PFD.diagrammesDe(BALLON);
    return `<div class="pfd-ballon">${BALLON.map((b, k) => `<figure><p class="pfd-ballon-t">${b.titre}</p>${dos[k]}` +
      `${window.PFD.sceneRemplie(b, { aria: 'Ballon ' + b.titre.toLowerCase() + ' : bilan des forces' })}<figcaption>${b.texte}</figcaption></figure>`).join('')}</div>`;
  }

  window.PFD.SITUATIONS = S;
  // ordre de l'atelier : du plus simple au plus difficile (le ballon est l'exemple traité)
  window.PFD.PARCOURS = ['brique', 'ressort', 'pendule', 'balle', 'bouchon', 'goutte', 'incline', 'glisse', 'aimants', 'ebonite', 'clou', 'voiture', 'livre', 'skieur', 'parachute'];
  window.PFD.BALLON = BALLON;
  window.PFD.ballonHTML = ballonHTML;
})();
