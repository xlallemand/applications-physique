/* Relecture des flashcards de l'application « Chapitre 5 : Flux et transferts thermiques » (transferts-thermiques)
   Tour 2 : toutes les cartes (voir docs/flashcards/prompt-generation.md)
   Tour 1 (compétences) : m2/c5, m2/c6 et m4/c5 retirées par l'enseignant ; prérequis inchangés
   (chaque paquet après son cours). Le module 5 (exercices du manuel) n'a pas de cours :
   ses méthodes et exercices-types sont rangés dans les paquets m2, m3 et m4. */
(function () {
  // couleurs de assets/theme.css (accent physique)
  const ENC = '#16181d', ENC2 = '#55585f', PAP = '#f3f1ec', PAP3 = '#dfdbd2', ACC = '#5a3fc4', ACC2 = '#3f2a93', CLE = '#ebe7f8', BLANC = '#ffffff';
  const fig = s => `<div class="rev-fig">${s}</div>`;
  const formule = s => `<p class="rev-formule">${s}</p>`;
  const unites = s => `<p class="rev-unites">${s}</p>`;
  const KW = 'K·W<sup>−1</sup>', LAM = 'W·m<sup>−1</sup>·K<sup>−1</sup>';
  // texte SVG avec indices _{…} et exposants ^{…} (tspan décalés, puis retour à la ligne de base)
  const sv = s => s.replace(/_\{([^}]*)\}/g, '<tspan dy="4" font-size="75%">$1</tspan><tspan dy="-4">​</tspan>')
    .replace(/\^\{([^}]*)\}/g, '<tspan dy="-6" font-size="75%">$1</tspan><tspan dy="6">​</tspan>');
  // pastille numérotée ①, ②… (cercle de l'accent, chiffre blanc)
  const pastille = (x, y, n) => `<circle cx="${x}" cy="${y}" r="11" fill="${ACC}"/><text x="${x}" y="${y + 5}" text-anchor="middle" font-size="14" font-weight="800" fill="${BLANC}">${n}</text>`;
  // texte ou pastille : un nombre donne une pastille centrée sur la ligne de texte
  const ecrire = (x, y, v, att) => (typeof v === 'number' ? pastille(x, y - 5, v) : `<text x="${x}" y="${y}" text-anchor="middle" ${att}>${sv(v)}</text>`);
  // pointe de flèche en (x, y), vers la droite (d = 1) ou vers la gauche (d = −1)
  const pointe = (x, y, d, coul) => `<polygon points="${x},${y} ${x - 12 * d},${y - 6} ${x - 12 * d},${y + 6}" fill="${coul}"/>`;

  /* ---------- Figures (SVG autonomes : attributs de présentation) ---------- */
  // Les deux échelles de température (comme TT.echelles) ; remplie : valeurs en kelvins, sinon pastilles ① à ④
  function echelles(remplie) {
    const xK = 74, xC = 266, haut = 46, h = 250, y = t => haut + (100 - t) / 373 * (h - haut - 16);
    const reperes = [[100, 'l\'eau bout'], [0, 'l\'eau gèle'], [-196, 'l\'azote liquide bout'], [-273, 'zéro absolu']];
    let s = `<text x="${xK}" y="22" text-anchor="middle" font-size="15" font-weight="800" fill="${ENC}">T (K)</text><text x="${xC}" y="22" text-anchor="middle" font-size="15" font-weight="800" fill="${ENC}">θ (°C)</text>`;
    s += `<line x1="${xK}" y1="${haut - 12}" x2="${xK}" y2="${h - 10}" stroke="${ENC}" stroke-width="2"/><line x1="${xC}" y1="${haut - 12}" x2="${xC}" y2="${h - 10}" stroke="${ENC}" stroke-width="2"/>`;
    s += `<path d="M${xK - 5},${haut - 6} L${xK},${haut - 16} L${xK + 5},${haut - 6} Z M${xC - 5},${haut - 6} L${xC},${haut - 16} L${xC + 5},${haut - 6} Z" fill="${ENC}"/>`;
    reperes.forEach(([t, nom], i) => {
      const yy = y(t);
      s += `<line x1="${xK}" y1="${yy}" x2="${xC}" y2="${yy}" stroke="${PAP3}" stroke-width="1.5" stroke-dasharray="5 4"/>`;
      s += `<line x1="${xK - 6}" y1="${yy}" x2="${xK + 6}" y2="${yy}" stroke="${ENC}" stroke-width="2"/><line x1="${xC - 6}" y1="${yy}" x2="${xC + 6}" y2="${yy}" stroke="${ENC}" stroke-width="2"/>`;
      s += remplie ? `<text x="${xK - 10}" y="${yy + 5}" text-anchor="end" font-size="16" font-weight="800" fill="${ACC2}">${t + 273} K</text>` : pastille(xK - 24, yy, i + 1);
      s += `<text x="${xC + 10}" y="${yy + 5}" font-size="16" font-weight="700" fill="${ENC}">${String(t).replace('-', '−')} °C</text>`;
      s += `<text x="${(xK + xC) / 2}" y="${yy - 6}" text-anchor="middle" font-size="14" font-weight="600" fill="${ENC2}">${nom}</text>`;
    });
    const aria = remplie ? 'Échelles Kelvin et Celsius côte à côte : l\'eau bout à 373 K et 100 °C, l\'eau gèle à 273 K et 0 °C, l\'azote liquide bout à 77 K et −196 °C, zéro absolu 0 K et −273 °C'
      : 'Échelles Kelvin et Celsius côte à côte : 100 °C (l\'eau bout), 0 °C (l\'eau gèle), −196 °C (l\'azote liquide bout), −273 °C (zéro absolu) ; en face, sur l\'échelle Kelvin, les cases 1 à 4 à compléter';
    return `<svg viewBox="0 0 360 ${h}" width="360" height="${h}" role="img" aria-label="${aria}">${s}</svg>`;
  }

  // Casserole d'eau sur une plaque chauffante, une main à côté : ① conduction, ② convection, ③ rayonnement
  function casserole(legendee) {
    const fl = `stroke="${ACC}" stroke-width="2.6" fill="none" stroke-linecap="round"`;
    const vague = y => { let d = `M88,${y}`; for (let x = 88; x > 58; x -= 3) d += ` L${x - 3},${(y + 3.5 * Math.sin((88 - x + 3) / 15 * 2 * Math.PI)).toFixed(1)}`; return `<path d="${d}" ${fl}/>` + pointe(52, y, -1, ACC); };
    const mot = (x, y, t, a) => (legendee ? `<text x="${x}" y="${y}" text-anchor="${a || 'middle'}" font-size="16" font-weight="800" fill="${ACC2}">${t}</text>` : '');
    const s = `<rect x="104" y="100" width="152" height="66" fill="${CLE}"/>` +
      `<path d="M102,78 L102,168 L258,168 L258,78" fill="none" stroke="${ENC}" stroke-width="4" stroke-linejoin="round"/>` +
      `<line x1="260" y1="90" x2="334" y2="82" stroke="${ENC}" stroke-width="7" stroke-linecap="round"/>` +
      `<line x1="104" y1="100" x2="256" y2="100" stroke="${ACC}" stroke-width="1.5" opacity=".5"/>` +
      `<rect x="92" y="174" width="176" height="16" rx="3" fill="${ENC}"/><rect x="98" y="170" width="164" height="5" fill="${ACC}"/>` +
      `<text x="180" y="210" text-anchor="middle" font-size="15" font-weight="600" fill="${ENC2}">plaque chauffante</text>` +
      // convection : l'eau chaude du fond monte, l'eau plus froide redescend sur les côtés
      `<path d="M180,160 L180,118" ${fl}/>` + `<polygon points="180,110 174,122 186,122" fill="${ACC}"/>` +
      `<path d="M188,114 C222,108 238,124 238,152" ${fl}/><polygon points="238,160 232,148 244,148" fill="${ACC}"/>` +
      `<path d="M172,114 C138,108 122,124 122,152" ${fl}/><polygon points="122,160 116,148 128,148" fill="${ACC}"/>` +
      // conduction : de la plaque au fond de la casserole
      `<line x1="268" y1="170" x2="288" y2="182" stroke="${ENC2}" stroke-width="1.5"/>` + pastille(300, 188, 1) + mot(300, 218, 'conduction') +
      pastille(180, 140, 2) + mot(180, 92, 'convection') +
      // rayonnement : de la plaque à la main, à distance
      vague(160) + vague(176) +
      `<g fill="${BLANC}" stroke="${ENC2}" stroke-width="1.8"><rect x="12" y="150" width="34" height="26" rx="11"/><ellipse cx="25" cy="152" rx="11" ry="5"/></g>` +
      `<path d="M26,160 h16 M26,165 h17 M26,170 h15" stroke="${ENC2}" stroke-width="1.2" fill="none"/>` +
      `<text x="29" y="194" text-anchor="middle" font-size="15" font-weight="600" fill="${ENC2}">main</text>` +
      pastille(70, 136, 3) + mot(4, 116, 'rayonnement', 'start');
    const aria = 'Casserole d\'eau sur une plaque chauffante, une main posée à côté de la plaque. 1 : entre la plaque et le fond de la casserole ; 2 : l\'eau chaude monte au centre et redescend sur les côtés ; 3 : ondes de la plaque vers la main' +
      (legendee ? ' ; 1 conduction, 2 convection, 3 rayonnement' : '');
    return `<svg viewBox="0 72 350 152" width="350" height="152" role="img" aria-label="${aria}">${s}</svg>`;
  }

  /* Paroi en couches vue en coupe (comme TT.paroi) :
     o = { couches: [{ nom, fond, lignes: ['e_{1} = 15 cm', …] }], cotes: [{ nom, T }, { nom, T }],
           fleche: { sens: 1 (du côté 1 vers le côté 2) | 2, txt }, bas, aria }
     un nombre à la place d'un texte donne une pastille ①, ②… */
  function paroi(o) {
    const n = o.couches.length, x0 = 80, L = 200, w = L / n, H = 226;
    let s = '';
    o.couches.forEach((c, i) => {
      const x = x0 + i * w, xm = x + w / 2;
      // nom de la couche sur deux lignes s'il est long (« laine de » / « verre »)
      const k = c.nom.length > 9 ? c.nom.lastIndexOf(' ') : -1, noms = k > 0 ? [c.nom.slice(0, k), c.nom.slice(k + 1)] : [c.nom];
      s += `<rect x="${x}" y="30" width="${w}" height="90" fill="${c.fond || PAP3}" stroke="${ENC2}" stroke-width="1.5"/>`;
      noms.forEach((t, j) => { s += `<text x="${xm}" y="${81 + (j - (noms.length - 1) / 2) * 18}" text-anchor="middle" font-size="15" font-weight="800" fill="${ENC}">${t}</text>`; });
      (c.lignes || []).forEach((l, j) => { s += ecrire(xm, 170 + j * 20, l, `font-size="16" font-weight="700" fill="${ENC}"`); });
    });
    o.cotes.forEach((c, k) => {
      const xm = k ? (x0 + L + 360) / 2 : x0 / 2;
      s += `<text x="${xm}" y="22" text-anchor="middle" font-size="15" font-weight="700" fill="${ENC2}">${c.nom}</text>`;
      if (c.T != null) s += ecrire(xm, 82, c.T, `font-size="19" font-weight="800" fill="${ENC}"`);
    });
    if (o.fleche) {
      const d = o.fleche.sens === 2 ? -1 : 1, xa = d > 0 ? 14 : 346, xb = d > 0 ? 346 : 14;
      s += `<line x1="${xa}" y1="144" x2="${xb - 10 * d}" y2="144" stroke="${ACC}" stroke-width="4"/>` + pointe(xb, 144, d, ACC);
      if (o.fleche.txt != null) s += ecrire(180, 136, o.fleche.txt, `font-size="17" font-weight="800" fill="${ACC2}"`);
    }
    if (o.bas != null) s += ecrire(180, 216, o.bas, `font-size="16" font-weight="700" fill="${ENC}"`);
    return `<svg viewBox="0 0 360 ${H}" width="360" height="${H}" role="img" aria-label="${o.aria}">${s}</svg>`;
  }
  // mur d'un bureau climatisé : 24 °C dedans, 34 °C dehors, R_th = 0,050 K·W⁻¹ (exemple du cours 3)
  const bureau = (fleche, aria) => paroi({ couches: [{ nom: 'mur' }], cotes: [{ nom: 'intérieur', T: '24 °C' }, { nom: 'extérieur', T: '34 °C' }],
    bas: 'R_{th} = 0,050 K·W^{−1}', fleche, aria });
  // mur de 12 m² : laine de verre côté intérieur, béton (cours 4, étape 2)
  const murCouches = remplie => paroi({
    couches: [{ nom: 'laine de verre', fond: CLE, lignes: remplie ? ['e_{1} = 10 cm', 'λ_{1} = 0,040'] : [1] },
      { nom: 'béton', lignes: remplie ? ['e_{2} = 20 cm', 'λ_{2} = 1,28'] : [1] }],
    cotes: [{ nom: 'intérieur', T: remplie ? '20 °C' : 2 }, { nom: 'extérieur', T: remplie ? '−5 °C' : 2 }],
    fleche: { sens: 1, txt: remplie ? 'Φ' : 4 }, bas: remplie ? 'S = 12 m² (λ en W·m^{−1}·K^{−1})' : 3,
    aria: remplie ? 'Mur en deux couches : laine de verre, e1 = 10 cm, λ1 = 0,040, côté intérieur à 20 °C ; béton, e2 = 20 cm, λ2 = 1,28, côté extérieur à −5 °C ; S = 12 m² ; flèche du flux Φ de l\'intérieur vers l\'extérieur'
      : 'Mur en deux couches, laine de verre et béton : case 1 sous chaque couche, case 2 de chaque côté, case 3 sous le mur, case 4 sur la flèche qui traverse le mur' });

  RELECTURE({
    dossier: 'transferts-thermiques', titre: 'Chapitre 5 : Flux et transferts thermiques', court: 'Chapitre 5', matiere: 'physique',
    tour: 2, etape: 'cartes',
    // pages de cours de l'application (prérequis possibles)
    cours: [
      { cle: 'module_1_cours', nom: 'Cours : température et modes de transfert' },
      { cle: 'module_2_cours', nom: 'Cours : flux thermique' },
      { cle: 'module_3_cours', nom: 'Cours : résistance thermique d\'une paroi' },
      { cle: 'module_4_cours', nom: 'Cours : parois composées' },
    ],
    paquets: [
      /* ---------- Module 1 · Température et modes de transfert ---------- */
      { id: 'm1', module: 1, titre: 'Température et modes de transfert', apres: ['module_1_cours'],
        competences: [
          { id: 'c1', texte: 'Passer des °C aux kelvins et des kelvins aux °C : T (K) = θ (°C) + 273 (de tête)', types: ['formule'], source: 'fiche_1 · Kelvins et degrés Celsius ; série 1 · conversions (diagnostic : 273 retiré au lieu d\'être ajouté)' },
          { id: 'c2', texte: 'Donner le zéro absolu (0 K = −273 °C) ; savoir qu\'une température en kelvins n\'est jamais négative', types: ['savoir'], source: 'fiche_1 · Kelvins et degrés Celsius ; série 1 · zéro absolu' },
          { id: 'c3', texte: 'Lire les repères sur les deux échelles K et °C (zéro absolu, azote liquide, eau qui gèle, eau qui bout)', types: ['schema'], source: 'cours 1 · figure des deux échelles ; fiche_1' },
          { id: 'c4', texte: 'Calculer un écart de température ΔT = T_chaud − T_froid avec une température négative (de tête)', types: ['reflexe'], source: 'fiche_1 · Écart de température ; série 1 · diagnostic « soustraire un nombre négatif »' },
          { id: 'c5', texte: 'Savoir qu\'un écart de température a la même valeur en K et en °C (on n\'ajoute pas 273 à un écart)', types: ['reflexe'], source: 'fiche_1 · Écart de température ; série 1 · diagnostic « 273 ajouté à un écart »' },
          { id: 'c6', texte: 'Définir les trois modes de transfert : conduction, convection, rayonnement', types: ['definition'], source: 'fiche_1 · Modes et sens du transfert ; À retenir' },
          { id: 'c7', texte: 'Reconnaître les trois modes de transfert sur un schéma (casserole sur une plaque)', types: ['schema'], source: 'cours 1 · étape 3, exemple de la casserole ; figure des modes' },
          { id: 'c8', texte: 'Donner le sens du transfert thermique (du chaud vers le froid) ; le « froid » ne se transfère pas', types: ['savoir', 'reflexe'], source: 'fiche_1 · sens du transfert ; série 1 · diagnostic « le froid qui se transfère »' },
        ],
        cartes: [
          { id: 'tt-1-kelvin', type: 'formule', competence: 'c1', statut: 'nouvelle', faces: [
            { q: '<p>Passer d\'une température θ en degrés Celsius à la température absolue T en kelvins : formule ?</p>',
              r: formule('T (K) = θ (°C) + 273') + unites('Dans l\'autre sens : θ (°C) = T (K) − 273.') + '<p>Exemple : 20 °C → 20 + 273 = 293 K.</p>' },
            { q: formule('T = θ + 273') + '<p>Que calcule-t-on ? Que représente chaque lettre ? Unités ?</p>',
              r: '<p>La <b>température absolue T</b>, en <b>kelvins</b> (K), à partir de la température θ en <b>degrés Celsius</b> (°C).</p><p>On écrit « 293 K », sans « degré ».</p>' }] },
          { id: 'tt-1-zero', type: 'savoir', competence: 'c2', statut: 'nouvelle', faces: [
            { q: '<p>Que vaut le zéro absolu, en kelvins et en degrés Celsius ? Une température en kelvins peut-elle être négative ?</p>',
              r: '<p><b>0 K = −273 °C</b> : c\'est la température la plus basse possible.</p><p>Une température en kelvins n\'est donc <b>jamais négative</b>.</p>' }] },
          { id: 'tt-1-echelles', type: 'schema', competence: 'c3', statut: 'nouvelle', faces: [
            { q: fig(echelles(false)) + '<p>Quelles températures en kelvins faut-il écrire dans les cases ① à ④ ?</p>',
              r: fig(echelles(true)) + '<p>① <b>373 K</b> ; ② <b>273 K</b> ; ③ <b>77 K</b> ; ④ <b>0 K</b> (zéro absolu).</p><p>T (K) = θ (°C) + 273.</p>' }] },
          { id: 'tt-1-ecart', type: 'reflexe', competence: 'c4', statut: 'nouvelle', faces: [
            { q: '<p>Il fait −3 °C d\'un côté d\'une paroi et −20 °C de l\'autre. Que vaut ΔT = T<sub>chaud</sub> − T<sub>froid</sub> ?</p>',
              r: '<p><b>ΔT = 17 K</b></p><p>Le côté chaud est à −3 °C : ΔT = −3 − (−20) = −3 + 20 = 17 K.</p><p>Soustraire un nombre négatif, c\'est ajouter son opposé.</p>' }] },
          { id: 'tt-1-ecartK', type: 'reflexe', competence: 'c5', statut: 'nouvelle', faces: [
            { q: '<p>Un écart de température vaut ΔT = 14 °C. Combien vaut-il en kelvins ?</p>',
              r: '<p><b>ΔT = 14 K</b> : un écart a la même valeur en K et en °C.</p><p>On ajoute 273 à une température, jamais à un écart : les « + 273 » des deux températures s\'annulent.</p>' }] },
          { id: 'tt-1-conduction', type: 'definition', competence: 'c6', statut: 'nouvelle', faces: [
            { q: '<p>Qu\'est-ce que la conduction ?</p>',
              r: '<p>Un mode de transfert thermique <b>dans un solide, de proche en proche, sans déplacement de matière</b>.</p><p>Exemple : un mur, une tige chauffée à un bout.</p>' },
            { q: '<p>Comment s\'appelle le transfert thermique dans un solide, de proche en proche, sans déplacement de matière ?</p>',
              r: '<p>La <b>conduction</b>.</p>' }] },
          { id: 'tt-1-convection', type: 'definition', competence: 'c6', statut: 'nouvelle', faces: [
            { q: '<p>Qu\'est-ce que la convection ?</p>',
              r: '<p>Un mode de transfert thermique où un <b>fluide (air, eau) se déplace et transporte l\'énergie</b>.</p><p>Exemple : au-dessus d\'un radiateur, l\'air chaud monte.</p>' },
            { q: '<p>Comment s\'appelle le transfert thermique par un fluide (air, eau) qui se déplace et transporte l\'énergie ?</p>',
              r: '<p>La <b>convection</b>.</p>' }] },
          { id: 'tt-1-rayonnement', type: 'definition', competence: 'c6', statut: 'nouvelle', faces: [
            { q: '<p>Qu\'est-ce que le rayonnement ?</p>',
              r: '<p>Un mode de transfert thermique <b>sans support matériel</b> : l\'énergie se propage même dans le vide.</p><p>Exemple : le Soleil chauffe la Terre ; la chaleur d\'un feu sur le visage.</p>' },
            { q: '<p>Comment s\'appelle le transfert thermique sans support matériel, qui se fait même dans le vide ?</p>',
              r: '<p>Le <b>rayonnement</b>.</p>' }] },
          { id: 'tt-1-casserole', type: 'schema', competence: 'c7', statut: 'nouvelle', faces: [
            { q: fig(casserole(false)) + '<p>Une casserole d\'eau chauffe sur une plaque. Quel mode de transfert thermique en ①, ② et ③ ?</p>',
              r: fig(casserole(true)) + '<p>① <b>conduction</b> : la plaque chauffe le fond de la casserole.</p><p>② <b>convection</b> : l\'eau chaude du fond monte.</p><p>③ <b>rayonnement</b> : la main sent la plaque à distance.</p>' }] },
          { id: 'tt-1-sens', type: 'savoir', competence: 'c8', statut: 'nouvelle', faces: [
            { q: '<p>Dans quel sens se fait toujours un transfert thermique ? Quand s\'arrête-t-il ?</p>',
              r: '<p><b>Du corps le plus chaud vers le corps le plus froid.</b></p><p>Il s\'arrête quand les deux corps sont à la même température.</p>' }] },
          { id: 'tt-1-froid', type: 'reflexe', competence: 'c8', statut: 'nouvelle', faces: [
            { q: '<p>Une canette à 5 °C est posée dans une pièce à 22 °C. « La canette cède du froid à la pièce » : vrai ou faux ?</p>',
              r: '<p><b>Faux : le « froid » ne se transfère pas.</b></p><p>C\'est l\'énergie qui va du plus chaud (l\'air, la table) vers le plus froid (la canette), qui se réchauffe jusqu\'à 22 °C.</p>' }] },
        ] },

      /* ---------- Module 2 · Flux thermique ---------- */
      { id: 'm2', module: 2, titre: 'Flux thermique', apres: ['module_2_cours'],
        competences: [
          { id: 'c1', texte: 'Définir le flux thermique Φ : une puissance, en W', types: ['definition'], source: 'fiche_2 · Le flux thermique est une puissance ; série 2 · unité de Φ' },
          { id: 'c2', texte: 'Connaître la formule Φ = Q / Δt et les unités (W, J, s)', types: ['formule'], source: 'fiche_2 · Le flux thermique ; À retenir' },
          { id: 'c3', texte: 'Relier Φ = Q / Δt et Q = Φ × Δt à P = E / Δt et E = P × Δt (mêmes formules, autres noms)', types: ['savoir'], source: 'fiche_2 · tableau énergie et puissance / transfert thermique ; série 2 · flux et puissance' },
          { id: 'c4', texte: 'Connaître la formule Q = Φ × Δt : Δt en s donne des J, Δt en h donne des Wh', types: ['formule'], source: 'fiche_2 · L\'énergie transférée ; À retenir' },
          { id: 'c7', texte: 'Exercice-type : calculer un flux à partir d\'une énergie en kJ et d\'une durée en h et min (calculatrice)', types: ['methode'], source: 'exercice 7 a) · 750 kJ en 1 h 15 ; exercice 8 c)' },
          { id: 'c8', texte: 'Exercice-type : calculer l\'énergie perdue en un jour, en J et en kWh (calculatrice)', types: ['methode'], source: 'cours 2 · étape 3 (vitrage, 88 W pendant 24 h) ; exercice 19 d) et e)' },
        ],
        cartes: [
          { id: 'tt-2-flux', type: 'definition', competence: 'c1', statut: 'nouvelle', faces: [
            { q: '<p>Qu\'est-ce que le flux thermique Φ ? Unité ?</p>',
              r: '<p>La <b>puissance thermique</b> qui traverse une paroi : l\'énergie qui la traverse chaque seconde.</p><p>Φ s\'exprime en <b>watts (W)</b>, comme toute puissance.</p>' },
            { q: '<p>Comment s\'appelle la puissance thermique qui traverse une paroi ? Symbole, unité ?</p>',
              r: '<p>Le <b>flux thermique Φ</b>, en watts (W).</p>' }] },
          { id: 'tt-2-formule', type: 'formule', competence: 'c2', statut: 'nouvelle', faces: [
            { q: '<p>Flux thermique Φ quand une énergie thermique Q traverse une paroi pendant une durée Δt : formule et unités ?</p>',
              r: formule('Φ = Q / Δt') + unites('Φ en W ; Q en J ; Δt en s') + '<p>C\'est P = E / Δt.</p>' },
            { q: formule('Φ = Q / Δt') + '<p>Que calcule-t-on ? Que représente chaque lettre ? Unités ?</p>',
              r: '<p>Le <b>flux thermique Φ</b> (W) : l\'énergie thermique <b>Q</b> (J) qui traverse la paroi, divisée par la durée <b>Δt</b> (s).</p>' }] },
          { id: 'tt-2-lien', type: 'savoir', competence: 'c3', statut: 'nouvelle', faces: [
            { q: '<p>Φ = Q / Δt et Q = Φ × Δt : à quelles formules déjà connues correspondent-elles ?</p>',
              r: '<p><b>P = E / Δt</b> et <b>E = P × Δt</b>.</p><p>Seuls les noms changent : le flux Φ est une puissance P, l\'énergie thermique Q est une énergie E.</p>' }] },
          { id: 'tt-2-energie', type: 'formule', competence: 'c4', statut: 'nouvelle', faces: [
            { q: '<p>Énergie thermique Q transférée par un flux Φ pendant une durée Δt : formule et unités ?</p>',
              r: formule('Q = Φ × Δt') + unites('Φ en W ; Δt en s : Q en J ; Δt en h : Q en Wh') + '<p>C\'est E = P × Δt.</p>' },
            { q: formule('Q = Φ × Δt') + '<p>Que calcule-t-on ? Que représente chaque lettre ? Unités ?</p>',
              r: '<p>L\'<b>énergie thermique Q</b> transférée : <b>Φ</b> le flux thermique (W), <b>Δt</b> la durée.</p><p>Δt en s : Q en J ; Δt en h : Q en Wh.</p>' }] },
          { id: 'tt-2-ex-flux', type: 'methode', competence: 'c7', statut: 'nouvelle', outils: ['calculatrice'], faces: [
            { q: '<p>Une quantité de chaleur Q = 750 kJ traverse une paroi en 1 h 15. Comment calculer le flux thermique ?</p><small>Démarche</small>',
              r: '<ol><li>Q en joules : 750 kJ = 750 × 10<sup>3</sup> J.</li><li>Δt en secondes : 1 h 15 = 3 600 + 15 × 60 = 4 500 s.</li><li>Φ = Q / Δt ≈ <b>167 W</b>.</li></ol>' }] },
          { id: 'tt-2-ex-jour', type: 'methode', competence: 'c8', statut: 'nouvelle', outils: ['calculatrice'], faces: [
            { q: '<p>Un vitrage laisse passer un flux de 88 W pendant une journée. Comment calculer l\'énergie perdue, en joules puis en kWh ?</p><small>Démarche</small>',
              r: '<ol><li>En joules : Δt = 24 × 3 600 s, Q = 88 × 24 × 3 600 ≈ <b>7,6 × 10<sup>6</sup> J</b>.</li><li>En kWh : Δt = 24 h, Q = 88 × 24 = 2 112 Wh ≈ <b>2,1 kWh</b>.</li></ol>' }] },
        ] },

      /* ---------- Module 3 · Résistance thermique d'une paroi ---------- */
      { id: 'm3', module: 3, titre: 'Résistance thermique d\'une paroi', apres: ['module_3_cours'],
        competences: [
          { id: 'c1', texte: 'Connaître la formule Φ = ΔT / R_th et les unités (W, K, K·W⁻¹)', types: ['formule'], source: 'fiche_3 · Flux et résistance thermique ; À retenir' },
          { id: 'c2', texte: 'Connaître la formule R_th = e / (λ × S) et les unités (m, m², W·m⁻¹·K⁻¹)', types: ['formule'], source: 'fiche_3 · Flux et résistance thermique ; À retenir' },
          { id: 'c3', texte: 'Définir la conductivité thermique λ : petite pour un matériau isolant', types: ['definition'], source: 'fiche_3 · Raisonner ; série 3 · le meilleur isolant (tableau de λ)' },
          { id: 'c4', texte: 'Donner le flux et son sens en STI2D : Φ positif, ΔT = T_chaud − T_froid, sens à part (vers l\'intérieur quand il fait plus chaud dehors)', types: ['savoir', 'graphique'], source: 'fiche_3 · En STI2D, Φ est compté positivement ; cours 3 · schéma de paroi avec la flèche du flux ; exercice 8 b)' },
          { id: 'c5', texte: 'Interpréter un flux négatif : il va dans le sens contraire de la flèche (ce n\'est pas faux)', types: ['reflexe'], source: 'fiche_3 · Remarque ; série 3 · « Un élève écrit Φ = −… W »' },
          { id: 'c6', texte: 'Raisonner : λ petit = isolant ; R grande = Φ petit ; doubler e double R et divise Φ par 2 ; doubler S divise R par 2', types: ['savoir'], source: 'fiche_3 · Raisonner ; cours 3 · paroi réglable ; série 3 · doubler e, S ou ΔT' },
          { id: 'c7', texte: 'Isoler R, λ ou e : R = ΔT / Φ ; λ = e / (R × S) ; e = R × λ × S (crayon)', types: ['methode'], source: 'fiche_3 · Isoler une grandeur ; exercices 15 et 16 c)' },
          { id: 'c8', texte: 'Convertir e et S en m et en m² avant de calculer R (cm, mm, cm²)', types: ['reflexe'], source: 'fiche_3 · conversions ; série 3 · diagnostic « e laissée en cm ou en mm », surface de 100 cm²' },
        ],
        cartes: [
          { id: 'tt-3-flux', type: 'formule', competence: 'c1', statut: 'nouvelle', faces: [
            { q: '<p>Flux thermique Φ à travers une paroi de résistance thermique R<sub>th</sub>, avec un écart de température ΔT entre ses faces : formule et unités ?</p>',
              r: formule('Φ = ΔT / R<sub>th</sub>') + unites(`Φ en W ; ΔT = T<sub>chaud</sub> − T<sub>froid</sub> en K ; R<sub>th</sub> en ${KW}`) },
            { q: formule('Φ = ΔT / R<sub>th</sub>') + '<p>Que calcule-t-on ? Que représente chaque lettre ? Unités ?</p>',
              r: `<p>Le <b>flux thermique Φ</b> (W) qui traverse la paroi : <b>ΔT</b> = T<sub>chaud</sub> − T<sub>froid</sub>, l'écart de température (K) ; <b>R<sub>th</sub></b>, la résistance thermique de la paroi (${KW}).</p>` }] },
          { id: 'tt-3-resistance', type: 'formule', competence: 'c2', statut: 'nouvelle', faces: [
            { q: '<p>Résistance thermique R<sub>th</sub> d\'une paroi d\'épaisseur e et de surface S, faite d\'un matériau de conductivité thermique λ : formule et unités ?</p>',
              r: formule('R<sub>th</sub> = e / (λ × S)') + unites(`e en m ; S en m<sup>2</sup> ; λ en ${LAM} ; R<sub>th</sub> en ${KW}`) },
            { q: formule('R<sub>th</sub> = e / (λ × S)') + '<p>Que calcule-t-on ? Que représente chaque lettre ? Unités ?</p>',
              r: `<p>La <b>résistance thermique R<sub>th</sub></b> de la paroi (${KW}) : <b>e</b> l'épaisseur (m), <b>λ</b> la conductivité thermique du matériau (${LAM}), <b>S</b> la surface (m<sup>2</sup>).</p>` }] },
          { id: 'tt-3-lambda', type: 'definition', competence: 'c3', statut: 'nouvelle', faces: [
            { q: '<p>Qu\'est-ce que la conductivité thermique λ ? Unité ?</p>',
              r: `<p>Une grandeur du <b>matériau</b>, en ${LAM} : plus λ est grand, mieux le matériau conduit l'énergie.</p><p><b>λ petit : matériau isolant</b> (laine de verre, polystyrène, air immobile).</p>` },
            { q: `<p>Comment s'appelle la grandeur d'un matériau, en ${LAM}, qui est petite pour un isolant ? Symbole ?</p>`,
              r: '<p>La <b>conductivité thermique λ</b>.</p>' }] },
          { id: 'tt-3-sti2d', type: 'savoir', competence: 'c4', statut: 'nouvelle', faces: [
            { q: '<p>En STI2D, comment calcule-t-on ΔT pour que le flux Φ soit positif ? Comment donne-t-on son sens, en hiver et en été ?</p>',
              r: '<p><b>ΔT = T<sub>chaud</sub> − T<sub>froid</sub></b> : Φ est positif, son sens se donne à part.</p><p>Hiver : ΔT = T<sub>int</sub> − T<sub>ext</sub>, vers l\'extérieur.</p><p>Été : ΔT = T<sub>ext</sub> − T<sub>int</sub>, <b>vers l\'intérieur</b>.</p>' }] },
          { id: 'tt-3-sens', type: 'graphique', competence: 'c4', statut: 'nouvelle', outils: ['calculatrice'], faces: [
            { q: fig(bureau(null, 'Mur d\'un bureau climatisé : intérieur à 24 °C, extérieur à 34 °C ; résistance thermique 0,050 K·W⁻¹')) + '<p>Sens du transfert, ΔT et Φ ?</p><small>Φ compté positivement, comme en STI2D</small>',
              r: fig(bureau({ sens: 2, txt: 'Φ = 200 W' }, 'Le même mur : flèche du flux de 200 W de l\'extérieur vers l\'intérieur')) +
                '<p><b>De l\'extérieur vers l\'intérieur</b> : du chaud vers le froid.</p><p>ΔT = T<sub>ext</sub> − T<sub>int</sub> = 34 − 24 = 10 K ; Φ = 10 / 0,050 = <b>200 W</b>.</p>' }] },
          { id: 'tt-3-negatif', type: 'reflexe', competence: 'c5', statut: 'nouvelle', faces: [
            { q: fig(bureau({ sens: 1, txt: 'Φ = −200 W' }, 'Mur : intérieur à 24 °C, extérieur à 34 °C, R = 0,050 K·W⁻¹ ; flèche de l\'intérieur vers l\'extérieur, Φ = −200 W')) +
                '<p>Un élève compte le flux de l\'intérieur vers l\'extérieur et trouve Φ = −200 W. Est-ce faux ?</p>',
              r: '<p><b>Non, c\'est juste.</b> Le signe « − » indique que le flux va dans le <b>sens contraire de la flèche</b> : 200 W entrent dans le bureau.</p><p>En STI2D, on préfère : Φ = 200 W, de l\'extérieur vers l\'intérieur.</p>' }] },
          { id: 'tt-3-isolant', type: 'savoir', competence: 'c6', statut: 'nouvelle', faces: [
            { q: '<p>Une paroi isole bien : sa résistance thermique R est-elle grande ou petite ? Et le flux Φ ?</p>',
              r: '<p><b>R grande, Φ petit</b>, car Φ = ΔT / R.</p><p>À ne pas confondre avec λ : c\'est un λ <b>petit</b> qui fait un matériau isolant.</p>' }] },
          { id: 'tt-3-epaisseur', type: 'savoir', competence: 'c6', statut: 'nouvelle', faces: [
            { q: '<p>On double l\'épaisseur e d\'une paroi, sans rien changer d\'autre. Que deviennent R et Φ ?</p>',
              r: '<p><b>R double, Φ est divisé par 2.</b></p><p>R = e / (λ × S) est proportionnelle à e ; Φ = ΔT / R.</p>' }] },
          { id: 'tt-3-surface', type: 'savoir', competence: 'c6', statut: 'nouvelle', faces: [
            { q: '<p>On double la surface S d\'une paroi, sans rien changer d\'autre. Que deviennent R et Φ ?</p>',
              r: '<p><b>R est divisée par 2, Φ double.</b></p><p>S est au dénominateur de R = e / (λ × S) : deux fois plus de surface laisse passer deux fois plus d\'énergie.</p>' }] },
          { id: 'tt-3-isoler', type: 'methode', competence: 'c7', statut: 'nouvelle', outils: ['crayon'], faces: [
            { q: '<p>À partir de Φ = ΔT / R et de R = e / (λ × S), écris R en fonction de ΔT et Φ, puis λ et e.</p>',
              r: formule('R = ΔT / Φ<br>λ = e / (R × S)<br>e = R × λ × S') + '<p>Exemple : on connaît Φ et ΔT, on calcule R, puis λ ou e.</p>' }] },
          { id: 'tt-3-unites', type: 'reflexe', competence: 'c8', statut: 'nouvelle', faces: [
            { q: '<p>Une plaque a 4 cm d\'épaisseur et une surface de 100 cm<sup>2</sup>. Que fais-tu avant de calculer R = e / (λ × S) ?</p>',
              r: '<p><b>Convertir e en m et S en m<sup>2</sup>.</b></p><p>e = 4 cm = 4 × 10<sup>−2</sup> m ; S = 100 × 10<sup>−4</sup> = 0,01 m<sup>2</sup>.</p><p>1 cm = 10<sup>−2</sup> m ; 1 mm = 10<sup>−3</sup> m ; 1 cm<sup>2</sup> = 10<sup>−4</sup> m<sup>2</sup>.</p>' }] },
        ] },

      /* ---------- Module 4 · Parois composées ---------- */
      { id: 'm4', module: 4, titre: 'Parois composées', apres: ['module_4_cours'],
        competences: [
          { id: 'c1', texte: 'Connaître la résistance d\'une paroi en couches accolées : R = R₁ + R₂ + R₃, même surface S', types: ['formule'], source: 'fiche_4 · Couches accolées ; À retenir' },
          { id: 'c2', texte: 'Appliquer la méthode avec un schéma : e et λ de chaque couche, températures, S → chaque Rᵢ → R → Φ', types: ['methode'], source: 'fiche_4 · La méthode avec un schéma ; cours 4 · étape 2 (glisser-déposer sur le schéma)' },
          { id: 'c3', texte: 'Lire le schéma d\'une paroi en couches : où sont e, λ, les températures, S, la flèche du flux', types: ['schema'], source: 'cours 4 · schéma de la paroi en couches (TT.paroiRemplie) ; fiche_4' },
          { id: 'c4', texte: 'Additionner les résistances (pas les multiplier) et prendre la résistance totale pour calculer Φ', types: ['reflexe'], source: 'série 4 · diagnostics « résistances multipliées », « résistance d\'une seule couche »' },
          { id: 'c6', texte: 'Calculer l\'épaisseur d\'isolant à ajouter : R_isolant = R visée − R des autres couches, puis e = R_isolant × λ × S', types: ['methode'], source: 'fiche_4 · isolant à ajouter ; série 4 · diagnostic « R du mur oubliée » ; exercice 18' },
          { id: 'c7', texte: 'Choisir l\'isolant qui donne la couche la plus mince (le plus petit λ, à R égale)', types: ['savoir'], source: 'série 4 · « quel isolant permet la couche la plus mince »' },
          { id: 'c8', texte: 'Exercice-type : mur de béton isolé par du polystyrène, résistance totale et flux (calculatrice)', types: ['methode'], source: 'fiche_4 · exemple (béton 15 cm + polystyrène 5 cm) ; exercice 13' },
        ],
        cartes: [
          { id: 'tt-4-serie', type: 'formule', competence: 'c1', statut: 'nouvelle', faces: [
            { q: '<p>Résistance thermique R d\'une paroi formée de trois couches accolées, de résistances R<sub>1</sub>, R<sub>2</sub> et R<sub>3</sub> : formule ?</p>',
              r: formule('R = R<sub>1</sub> + R<sub>2</sub> + R<sub>3</sub>') + unites(`avec R<sub>i</sub> = e<sub>i</sub> / (λ<sub>i</sub> × S) ; R en ${KW}`) + '<p>Toutes les couches ont la <b>même surface S</b>.</p>' },
            { q: formule('R = R<sub>1</sub> + R<sub>2</sub> + R<sub>3</sub>') + '<p>Que calcule-t-on ? Que représente chaque lettre ?</p>',
              r: `<p>La <b>résistance thermique totale R</b> d'une paroi en couches accolées : R<sub>1</sub>, R<sub>2</sub>, R<sub>3</sub> sont les résistances des couches (${KW}), toutes de même surface S.</p>` }] },
          { id: 'tt-4-methode', type: 'methode', competence: 'c2', statut: 'nouvelle', faces: [
            { q: '<p>Comment calculer le flux thermique à travers une paroi formée de plusieurs couches ?</p><small>Les étapes</small>',
              r: '<ol><li>Schéma : e et λ de chaque couche, températures des deux côtés, S.</li><li>R<sub>i</sub> = e<sub>i</sub> / (λ<sub>i</sub> × S) pour chaque couche (e en m).</li><li>R = R<sub>1</sub> + R<sub>2</sub> + …</li><li>Φ = ΔT / R, du chaud vers le froid.</li></ol>' }] },
          { id: 'tt-4-schema', type: 'schema', competence: 'c3', statut: 'nouvelle', faces: [
            { q: fig(murCouches(false)) + '<p>Schéma d\'une paroi en couches : que note-t-on dans les cases ① à ④ ?</p>',
              r: fig(murCouches(true)) + '<p>① <b>e et λ</b> de chaque couche ; ② les <b>températures</b> des deux côtés ; ③ la <b>surface S</b>, la même pour toutes les couches ; ④ le <b>flux Φ</b>, du chaud vers le froid.</p>' }] },
          { id: 'tt-4-total', type: 'reflexe', competence: 'c4', statut: 'nouvelle', faces: [
            { q: `<p>Une paroi a deux couches : R<sub>1</sub> = 0,016 ${KW} et R<sub>2</sub> = 0,50 ${KW}. Quelle résistance utilises-tu pour calculer Φ = ΔT / R ?</p>`,
              r: `<p><b>La résistance totale R = R<sub>1</sub> + R<sub>2</sub> ≈ 0,52 ${KW}.</b></p><p>Les résistances s'additionnent, on ne les multiplie pas ; et on ne prend jamais la résistance d'une seule couche.</p>` }] },
          { id: 'tt-4-isolant', type: 'methode', competence: 'c6', statut: 'nouvelle', outils: ['calculatrice'], faces: [
            { q: `<p>Un mur de béton de 10 m<sup>2</sup> a une résistance de 0,016 ${KW}. On veut R = 0,50 ${KW} avec de la laine de verre (λ = 0,040). Quelle épaisseur de laine ?</p><small>Démarche</small>`,
              r: `<ol><li>R<sub>laine</sub> = R − R<sub>béton</sub> = 0,50 − 0,016 = 0,484 ${KW}.</li><li>e = R<sub>laine</sub> × λ × S = 0,484 × 0,040 × 10 ≈ <b>0,19 m = 19 cm</b>.</li></ol>` }] },
          { id: 'tt-4-mince', type: 'savoir', competence: 'c7', statut: 'nouvelle', faces: [
            { q: '<p>Même surface, même résistance thermique visée : quel isolant donne la couche la plus mince ?</p>',
              r: '<p><b>Celui qui a le plus petit λ.</b></p><p>e = R × λ × S : à R et S égales, l\'épaisseur est proportionnelle à λ (polystyrène extrudé, λ = 0,030, plutôt que fibre de bois, λ = 0,050).</p>' }] },
          { id: 'tt-4-ex-mur', type: 'methode', competence: 'c8', statut: 'nouvelle', outils: ['calculatrice'], faces: [
            { q: '<p>Mur de 20 m<sup>2</sup> : 15 cm de béton (λ = 1,28) et 5 cm de polystyrène (λ = 0,030) ; 20 °C dedans, 0 °C dehors. Comment calculer le flux ?</p><small>Démarche</small>',
              r: `<ol><li>R<sub>1</sub> = 0,15 / (1,28 × 20) ≈ 5,9 × 10<sup>−3</sup> ${KW}.</li><li>R<sub>2</sub> = 0,05 / (0,030 × 20) ≈ 8,3 × 10<sup>−2</sup> ${KW}.</li><li>R = R<sub>1</sub> + R<sub>2</sub> ≈ 0,089 ${KW}.</li><li>Φ = 20 / 0,089 ≈ <b>224 W</b>, vers l'extérieur.</li></ol>` }] },
        ] },
    ],
  });
})();
