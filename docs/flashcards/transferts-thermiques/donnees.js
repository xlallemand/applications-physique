/* Relecture des flashcards de l'application « Chapitre 5 : Flux et transferts thermiques » (transferts-thermiques)
   Tour 3 : cartes écrites de nouveau avec le prompt modifié (voir docs/flashcards/prompt-generation.md) :
   toutes les définitions et toutes les formules (deux sens), peu de cartes d'autres types.
   Tour 1 (compétences) : m2/c5, m2/c6 et m4/c5 retirées par l'enseignant ; prérequis inchangés
   (chaque paquet après son cours). Le module 5 (exercices du manuel) n'a pas de cours : pas de paquet.
   Tour 4, à la demande de l'enseignant : ajoutée tt-1-feu (les trois modes autour d'un feu, schéma du cours papier) ;
   modifiées tt-1-kelvin (sans sens 2), tt-3-isolerL et tt-3-isolerE (exprimer λ, e à partir de R_th = e / (λ × S), un sens),
   tt-3-sens (question), tt-3-unites (conversion de S), tt-4-isolant (crayon et calculatrice) ;
   supprimées tt-1-deltaT, tt-3-isolerR, tt-4-methode.
   Tour 5 : tt-1-feu modifiée (sans schéma au recto ; mains du schéma plus réalistes) ; toutes les autres validées.
   Tour 6 : tt-1-feu modifiée (pouce retiré de la main qui tient la tige). */
(function () {
  // couleurs de assets/theme.css (accent physique)
  const ENC = '#16181d', ENC2 = '#55585f', PAP3 = '#dfdbd2', ACC = '#5a3fc4', ACC2 = '#3f2a93';
  const fig = s => `<div class="rev-fig">${s}</div>`;
  const formule = s => `<p class="rev-formule">${s}</p>`;
  const unites = s => `<p class="rev-unites">${s}</p>`;
  const KW = 'K·W<sup>−1</sup>', LAM = 'W·m<sup>−1</sup>·K<sup>−1</sup>';
  const UNITES = '<small>Unités de chaque grandeur</small>';
  const QUOI = ' Que peux-tu calculer ? Avec quelle formule ?</p>';

  /* ---------- Figure (SVG autonome : attributs de présentation) ---------- */
  // texte SVG avec indices _{…} et exposants ^{…} (tspan décalés, puis retour à la ligne de base)
  const sv = s => s.replace(/_\{([^}]*)\}/g, '<tspan dy="4" font-size="75%">$1</tspan><tspan dy="-4">​</tspan>')
    .replace(/\^\{([^}]*)\}/g, '<tspan dy="-6" font-size="75%">$1</tspan><tspan dy="6">​</tspan>');
  // pointe de flèche en (x, y), vers la droite (d = 1) ou vers la gauche (d = −1)
  const CLE = '#ebe7f8';
  /* Feu de camp (comme le schéma du cours), légendé : ① conduction dans une tige tenue à la main,
     ② convection de l'air au-dessus du feu, ③ rayonnement vers des mains tendues */
  function feu() {
    // pointe de flèche en (x, y), orientée selon l'angle a (degrés, 0 = vers la droite)
    const pointe = (x, y, a) => { const r = a * Math.PI / 180, c = Math.cos(r), s = Math.sin(r);
      return `<polygon points="${[[x, y], [x - 12 * c - 6 * s, y - 12 * s + 6 * c], [x - 12 * c + 6 * s, y - 12 * s - 6 * c]].map(q => q.map(v => v.toFixed(1)).join(',')).join(' ')}" fill="${ACC}"/>`; };
    const fl = (d, tir) => `<path d="${d}" fill="none" stroke="${ACC}" stroke-width="3" stroke-linecap="round"${tir ? ' stroke-dasharray="7 6"' : ''}/>`;
    // flamme de hauteur h posée en (x, y)
    const flamme = (x, y, h) => { const w = .34 * h, p = (k, H) => `M${x},${y} C${x - k},${y - .37 * H} ${x - k / 2},${y - .68 * H} ${x},${y - H} C${x + k / 2},${y - .68 * H} ${x + k},${y - .37 * H} ${x},${y} Z`;
      return `<path d="${p(w, h)}" fill="${CLE}" stroke="${ACC}" stroke-width="2.5"/><path d="${p(w * .5, h * .55)}" fill="${ACC}" opacity=".55"/>`; };
    /* main ouverte, doigts vers +x (paume vue de face, pouce en haut), poignet en x < 0 ; tr : position, rotation, symétrie */
    function mainOuverte(tr) {
      const d = 'M-30,-11 L-12,-13 C-7,-16 -2,-25 5,-29 C10,-31 14,-27 11,-22 C8,-18 5,-15 5,-14 ' +   // poignet, pouce
        'L30,-14 C34,-14 34,-7 30,-7 L15,-7 L35,-6 C39,-6 39,1 35,1 L15,1 ' +                         // index, majeur
        'L33,2 C37,2 37,9 33,9 L14,9 L27,10 C30.5,10 30.5,16.5 27,16.5 L10,17 ' +                    // annulaire, auriculaire
        'C2,19 -8,17 -14,13 L-30,11 Z';                                                              // paume
      return `<g transform="${tr}"><path d="${d}" fill="#ffffff" stroke="${ENC2}" stroke-width="2" stroke-linejoin="round"/>` +
        `<path d="M-6,10 C-2,4 -2,-4 -4,-10" fill="none" stroke="#8d8f94" stroke-width="1"/></g>`;
    }
    /* main qui tient une tige (tige le long de l'axe x, vers x < 0 ; poignet vers +x) : poing vu de côté (sans pouce) */
    function mainTige(tr) {
      const poing = 'M40,-10 L18,-12 C8,-19 -10,-19 -17,-10 C-22,-3 -21,8 -15,14 ' +
        'Q-11,19 -7,15 Q-3,19 1,15 Q5,19 9,15 Q13,19 18,12 L40,9 Z';
      return `<g transform="${tr}"><path d="${poing}" fill="#ffffff" stroke="${ENC2}" stroke-width="2" stroke-linejoin="round"/>` +
        `<path d="M-7,15 C-8,9 -8,4 -6,0 M1,15 C0,9 0,4 2,0 M9,15 C8,9 8,4 10,0" fill="none" stroke="#8d8f94" stroke-width="1.2"/></g>`;
    }
    const pastille = (x, y, num, mot) => `<circle cx="${x}" cy="${y}" r="15" fill="${ACC}"/><text x="${x}" y="${y + 6}" text-anchor="middle" font-size="19" font-weight="700" fill="#ffffff">${num}</text>` +
      `<text x="${x + 20}" y="${y + 6}" font-size="19" font-weight="800" fill="${ACC2}">${mot}</text>`;
    // ondes du rayonnement
    const onde = y => { let d = `M244,${y}`; for (let x = 244; x < 320; x += 4) d += ` L${x + 4},${(y + 4 * Math.sin((x + 4 - 244) / 19 * 2 * Math.PI)).toFixed(1)}`; return fl(d) + pointe(326, y, 0); };
    const s =
      // bûches
      `<rect x="132" y="224" width="120" height="12" rx="6" fill="${PAP3}" stroke="${ENC2}" stroke-width="1.5" transform="rotate(-12 192 230)"/>` +
      `<rect x="132" y="224" width="120" height="12" rx="6" fill="${PAP3}" stroke="${ENC2}" stroke-width="1.5" transform="rotate(12 192 230)"/>` +
      flamme(168, 226, 52) + flamme(214, 226, 58) + flamme(191, 226, 84) +
      // ① conduction : tige posée dans le feu, tenue à la main
      `<line x1="198" y1="198" x2="290" y2="70" stroke="${ENC2}" stroke-width="10" stroke-linecap="round"/><line x1="198" y1="198" x2="290" y2="70" stroke="${PAP3}" stroke-width="6" stroke-linecap="round"/>` +
      mainTige('translate(294,68) rotate(-54) scale(.85)') + fl('M232,124 L256,91') + pointe(261, 84, -54) +
      // ② convection : l'air chauffé monte (trait plein), l'air froid revient vers le feu (tirets)
      fl('M186,128 C182,86 150,58 104,54') + pointe(98, 54, 182) + mainOuverte('translate(56,50) scale(.9)') +
      fl('M48,82 C34,150 70,214 128,222', true) + pointe(136, 223, 6) +
      // ③ rayonnement vers des mains tendues
      onde(168) + onde(192) + onde(216) + mainOuverte('translate(368,192) scale(-.9,.9)') +
      pastille(274, 128, '1', 'conduction') + pastille(58, 150, '2', 'convection') + pastille(232, 246, '3', 'rayonnement');
    return `<svg viewBox="0 0 400 266" width="400" height="266" role="img" aria-label="Feu de camp : conduction dans une tige tenue à la main, convection de l'air qui monte au-dessus du feu, rayonnement vers des mains tendues">` +
      `<rect x="1" y="1" width="398" height="264" rx="14" fill="#f3f1ec"/>${s}</svg>`;
  }
  const pointe = (x, y, d) => `<polygon points="${x},${y} ${x - 12 * d},${y - 6} ${x - 12 * d},${y + 6}" fill="${ACC}"/>`;
  /* Mur d'un bureau climatisé vu en coupe (comme TT.paroi) : 24 °C dedans, 34 °C dehors, R_th = 0,050 K·W⁻¹
     (exemple du cours 3) ; fleche = { sens: 1 (vers l'extérieur) | 2 (vers l'intérieur), txt } ou null */
  function bureau(fleche, aria) {
    const t = (x, y, txt, att) => `<text x="${x}" y="${y}" text-anchor="middle" ${att}>${sv(txt)}</text>`;
    let s = `<rect x="80" y="30" width="200" height="90" fill="${PAP3}" stroke="${ENC2}" stroke-width="1.5"/>` +
      t(180, 81, 'mur', `font-size="15" font-weight="800" fill="${ENC}"`) +
      t(40, 22, 'intérieur', `font-size="15" font-weight="700" fill="${ENC2}"`) + t(320, 22, 'extérieur', `font-size="15" font-weight="700" fill="${ENC2}"`) +
      t(40, 82, '24 °C', `font-size="19" font-weight="800" fill="${ENC}"`) + t(320, 82, '34 °C', `font-size="19" font-weight="800" fill="${ENC}"`) +
      t(180, 186, 'R_{th} = 0,050 K·W^{−1}', `font-size="16" font-weight="700" fill="${ENC}"`);
    if (fleche) {
      const d = fleche.sens === 2 ? -1 : 1, xa = d > 0 ? 14 : 346, xb = d > 0 ? 346 : 14;
      s += `<line x1="${xa}" y1="148" x2="${xb - 10 * d}" y2="148" stroke="${ACC}" stroke-width="4"/>` + pointe(xb, 148, d) +
        t(180, 140, fleche.txt, `font-size="17" font-weight="800" fill="${ACC2}"`);
    }
    return `<svg viewBox="0 0 360 196" width="360" height="196" role="img" aria-label="${aria}">${s}</svg>`;
  }

  RELECTURE({
    dossier: 'transferts-thermiques', titre: 'Chapitre 5 : Flux et transferts thermiques', court: 'Chapitre 5', matiere: 'physique',
    tour: 6, etape: 'cartes',
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
          { id: 'c1', texte: 'Passer des °C aux kelvins : T (K) = θ (°C) + 273', types: ['formule'], source: 'fiche_1 · Kelvins et degrés Celsius ; À retenir' },
          { id: 'c2', texte: 'Définir le zéro absolu : 0 K = −273 °C, la température la plus basse possible', types: ['definition'], source: 'fiche_1 · Kelvins et degrés Celsius ; série 1 · zéro absolu' },
          { id: 'c4', texte: 'Calculer un écart de température ΔT = T_chaud − T_froid (même valeur en K et en °C)', types: ['formule'], source: 'fiche_1 · Écart de température ; série 1 · diagnostics « soustraire un nombre négatif », « 273 ajouté à un écart »' },
          { id: 'c6', texte: 'Définir les trois modes de transfert : conduction, convection, rayonnement', types: ['definition', 'savoir'], source: 'fiche_1 · Modes et sens du transfert ; À retenir' },
          { id: 'c8', texte: 'Donner le sens du transfert thermique : du chaud vers le froid', types: ['savoir'], source: 'fiche_1 · sens du transfert ; À retenir' },
        ],
        cartes: [
          { id: 'tt-1-kelvin', type: 'formule', competence: 'c1', statut: 'validee', faces: [
            { q: '<p>La formule qui donne la température absolue T à partir de la température θ en degrés Celsius ?</p>' + UNITES,
              r: formule('T = θ + 273') + unites('T en kelvins (K) ; θ en degrés Celsius (°C)') + '<p>Exemple : 20 °C → 293 K.</p>' }] },
          { id: 'tt-1-zero', type: 'definition', competence: 'c2', statut: 'validee', faces: [
            { q: '<p>Qu\'est-ce que le zéro absolu ? Sa valeur en K et en °C ?</p>',
              r: '<p>La <b>température la plus basse possible</b> : <b>0 K = −273 °C</b>.</p><p>Une température en kelvins n\'est donc jamais négative.</p>' },
            { q: '<p>Comment s\'appelle la température la plus basse possible ? Sa valeur en K et en °C ?</p>',
              r: '<p>Le <b>zéro absolu</b> : 0 K = −273 °C.</p>' }] },
          { id: 'tt-1-conduction', type: 'definition', competence: 'c6', statut: 'validee', faces: [
            { q: '<p>Qu\'est-ce que la conduction ?</p>',
              r: '<p>Un mode de transfert thermique <b>dans un solide, de proche en proche, sans déplacement de matière</b>.</p><p>Exemple : un mur, une tige chauffée à un bout.</p>' },
            { q: '<p>Comment s\'appelle le transfert thermique dans un solide, de proche en proche, sans déplacement de matière ?</p>',
              r: '<p>La <b>conduction</b>.</p>' }] },
          { id: 'tt-1-convection', type: 'definition', competence: 'c6', statut: 'validee', faces: [
            { q: '<p>Qu\'est-ce que la convection ?</p>',
              r: '<p>Un mode de transfert thermique où un <b>fluide (air, eau) se déplace et transporte l\'énergie</b>.</p><p>Exemple : au-dessus d\'un radiateur, l\'air chaud monte.</p>' },
            { q: '<p>Comment s\'appelle le transfert thermique par un fluide (air, eau) qui se déplace et transporte l\'énergie ?</p>',
              r: '<p>La <b>convection</b>.</p>' }] },
          { id: 'tt-1-rayonnement', type: 'definition', competence: 'c6', statut: 'validee', faces: [
            { q: '<p>Qu\'est-ce que le rayonnement ?</p>',
              r: '<p>Un mode de transfert thermique <b>sans support matériel</b> : l\'énergie se propage même dans le vide.</p><p>Exemple : le Soleil chauffe la Terre ; la chaleur d\'un feu sur le visage.</p>' },
            { q: '<p>Comment s\'appelle le transfert thermique sans support matériel, qui se fait même dans le vide ?</p>',
              r: '<p>Le <b>rayonnement</b>.</p>' }] },
          { id: 'tt-1-sens', type: 'savoir', competence: 'c8', statut: 'validee', faces: [
            { q: '<p>Dans quel sens se fait toujours un transfert thermique ? Quand s\'arrête-t-il ?</p>',
              r: '<p><b>Du corps le plus chaud vers le corps le plus froid.</b></p><p>Il s\'arrête quand les deux corps sont à la même température. Le « froid » ne se transfère pas.</p>' }] },
          { id: 'tt-1-feu', type: 'savoir', competence: 'c6', statut: 'modifiee', faces: [
            { q: '<p>Quels sont les trois modes de transfert thermique ? Comment interviennent-ils autour d\'un feu ?</p>',
              r: fig(feu()) + '<p>① <b>Conduction</b> : la tige chauffe de proche en proche jusqu\'à la main.</p><p>② <b>Convection</b> : l\'air chauffé par le feu monte.</p><p>③ <b>Rayonnement</b> : les mains devant le feu chauffent, sans contact.</p>' }] },
        ] },

      /* ---------- Module 2 · Flux thermique ---------- */
      { id: 'm2', module: 2, titre: 'Flux thermique', apres: ['module_2_cours'],
        competences: [
          { id: 'c1', texte: 'Définir le flux thermique Φ : une puissance, en W', types: ['definition'], source: 'fiche_2 · Le flux thermique est une puissance ; série 2 · unité de Φ' },
          { id: 'c2', texte: 'Connaître la formule Φ = Q / Δt et les unités (W, J, s)', types: ['formule'], source: 'fiche_2 · Le flux thermique ; À retenir' },
          { id: 'c3', texte: 'Relier Φ = Q / Δt et Q = Φ × Δt à P = E / Δt et E = P × Δt (mêmes formules, autres noms)', types: ['savoir'], source: 'fiche_2 · tableau énergie et puissance / transfert thermique ; série 2 · flux et puissance' },
          { id: 'c4', texte: 'Connaître la formule Q = Φ × Δt : Δt en s donne des J, Δt en h donne des Wh', types: ['formule'], source: 'fiche_2 · L\'énergie transférée ; À retenir' },
        ],
        cartes: [
          { id: 'tt-2-flux', type: 'definition', competence: 'c1', statut: 'validee', faces: [
            { q: '<p>Qu\'est-ce que le flux thermique Φ ? Unité ?</p>',
              r: '<p>La <b>puissance thermique</b> qui traverse une paroi : l\'énergie qui la traverse chaque seconde.</p><p>Φ s\'exprime en <b>watts (W)</b>, comme toute puissance.</p>' },
            { q: '<p>Comment s\'appelle la puissance thermique qui traverse une paroi ? Symbole, unité ?</p>',
              r: '<p>Le <b>flux thermique Φ</b>, en watts (W).</p>' }] },
          { id: 'tt-2-formule', type: 'formule', competence: 'c2', statut: 'validee', faces: [
            { q: '<p>La formule qui donne le flux thermique Φ en fonction de l\'énergie thermique Q et de la durée Δt ?</p>' + UNITES,
              r: formule('Φ = Q / Δt') + unites('Φ en W ; Q en J ; Δt en s') + '<p>C\'est P = E / Δt.</p>' },
            { q: '<p>Données : l\'énergie thermique Q, en J, qui traverse une paroi pendant une durée Δt, en s.' + QUOI,
              r: '<p>Le <b>flux thermique Φ</b>, en W :</p>' + formule('Φ = Q / Δt') }] },
          { id: 'tt-2-energie', type: 'formule', competence: 'c4', statut: 'validee', faces: [
            { q: '<p>La formule qui donne l\'énergie thermique Q transférée à travers une paroi ?</p>' + UNITES,
              r: formule('Q = Φ × Δt') + unites('Φ en W ; Δt en s : Q en J ; Δt en h : Q en Wh') + '<p>C\'est E = P × Δt.</p>' },
            { q: '<p>Données : le flux thermique Φ, en W, qui traverse une paroi pendant une durée Δt, en s.' + QUOI,
              r: '<p>L\'<b>énergie thermique Q</b> transférée, en J (en Wh si Δt est en h) :</p>' + formule('Q = Φ × Δt') }] },
          { id: 'tt-2-lien', type: 'savoir', competence: 'c3', statut: 'validee', faces: [
            { q: '<p>Φ = Q / Δt et Q = Φ × Δt : à quelles formules déjà connues correspondent-elles ?</p>',
              r: '<p><b>P = E / Δt</b> et <b>E = P × Δt</b>.</p><p>Seuls les noms changent : le flux Φ est une puissance P, l\'énergie thermique Q est une énergie E.</p>' }] },
        ] },

      /* ---------- Module 3 · Résistance thermique d'une paroi ---------- */
      { id: 'm3', module: 3, titre: 'Résistance thermique d\'une paroi', apres: ['module_3_cours'],
        competences: [
          { id: 'c9', texte: 'Définir la résistance thermique R_th d\'une paroi, en K·W⁻¹', types: ['definition'], source: 'cours 3 · étape 1 ; fiche_3 · Flux et résistance thermique' },
          { id: 'c3', texte: 'Définir la conductivité thermique λ : petite pour un matériau isolant', types: ['definition'], source: 'fiche_3 · Raisonner ; série 3 · le meilleur isolant (tableau de λ)' },
          { id: 'c1', texte: 'Connaître la formule Φ = ΔT / R_th et les unités (W, K, K·W⁻¹)', types: ['formule'], source: 'fiche_3 · Flux et résistance thermique ; À retenir' },
          { id: 'c2', texte: 'Connaître la formule R_th = e / (λ × S) et les unités (m, m², W·m⁻¹·K⁻¹)', types: ['formule'], source: 'fiche_3 · Flux et résistance thermique ; À retenir' },
          { id: 'c7', texte: 'Connaître les formules qui isolent une grandeur : R = ΔT / Φ ; λ = e / (R × S) ; e = R × λ × S', types: ['formule'], source: 'fiche_3 · Isoler une grandeur ; exercices 15, 16 c) et 18' },
          { id: 'c4', texte: 'Donner le flux et son sens en STI2D : Φ positif, ΔT = T_chaud − T_froid, sens à part (vers l\'intérieur quand il fait plus chaud dehors)', types: ['graphique'], source: 'fiche_3 · En STI2D, Φ est compté positivement ; cours 3 · schéma de paroi avec la flèche du flux ; exercice 8 b)' },
          { id: 'c8', texte: 'Convertir e et S en m et en m² avant de calculer R (cm, mm, cm²)', types: ['reflexe'], source: 'fiche_3 · conversions ; série 3 · diagnostic « e laissée en cm ou en mm », surface de 100 cm²' },
        ],
        cartes: [
          { id: 'tt-3-rth', type: 'definition', competence: 'c9', statut: 'validee', faces: [
            { q: '<p>Qu\'est-ce que la résistance thermique R<sub>th</sub> d\'une paroi ? Unité ?</p>',
              r: `<p>Une grandeur qui dit combien la paroi <b>résiste au transfert thermique</b>, en <b>${KW}</b>.</p><p>Plus R<sub>th</sub> est grande, meilleure est l'isolation et plus le flux est petit.</p>` },
            { q: `<p>Comment s'appelle la grandeur, en ${KW}, qui dit combien une paroi résiste au transfert thermique ? Symbole ?</p>`,
              r: '<p>La <b>résistance thermique R<sub>th</sub></b>.</p>' }] },
          { id: 'tt-3-lambda', type: 'definition', competence: 'c3', statut: 'validee', faces: [
            { q: '<p>Qu\'est-ce que la conductivité thermique λ ? Unité ?</p>',
              r: `<p>Une grandeur du <b>matériau</b>, en ${LAM} : plus λ est grand, mieux le matériau conduit l'énergie.</p><p><b>λ petit : matériau isolant</b> (laine de verre, polystyrène, air immobile).</p>` },
            { q: `<p>Comment s'appelle la grandeur d'un matériau, en ${LAM}, qui est petite pour un isolant ? Symbole ?</p>`,
              r: '<p>La <b>conductivité thermique λ</b>.</p>' }] },
          { id: 'tt-3-flux', type: 'formule', competence: 'c1', statut: 'validee', faces: [
            { q: '<p>La formule qui donne le flux thermique Φ à travers une paroi en fonction de l\'écart de température ΔT et de la résistance thermique R<sub>th</sub> ?</p>' + UNITES,
              r: formule('Φ = ΔT / R<sub>th</sub>') + unites(`Φ en W ; ΔT = T<sub>chaud</sub> − T<sub>froid</sub> en K ; R<sub>th</sub> en ${KW}`) },
            { q: `<p>Données : l'écart de température ΔT, en K, entre les deux faces d'une paroi et sa résistance thermique R<sub>th</sub>, en ${KW}.` + QUOI,
              r: '<p>Le <b>flux thermique Φ</b> qui traverse la paroi, en W :</p>' + formule('Φ = ΔT / R<sub>th</sub>') }] },
          { id: 'tt-3-resistance', type: 'formule', competence: 'c2', statut: 'validee', faces: [
            { q: '<p>La formule qui donne la résistance thermique R<sub>th</sub> d\'une paroi en fonction de son épaisseur e, de sa surface S et de la conductivité thermique λ ?</p>' + UNITES,
              r: formule('R<sub>th</sub> = e / (λ × S)') + unites(`e en m ; S en m<sup>2</sup> ; λ en ${LAM} ; R<sub>th</sub> en ${KW}`) },
            { q: `<p>Données : l'épaisseur e d'une paroi, en m, sa surface S, en m<sup>2</sup>, et la conductivité thermique λ de son matériau, en ${LAM}.` + QUOI,
              r: `<p>La <b>résistance thermique R<sub>th</sub></b> de la paroi, en ${KW} :</p>` + formule('R<sub>th</sub> = e / (λ × S)') }] },
          { id: 'tt-3-isolerL', type: 'formule', competence: 'c7', statut: 'validee', faces: [
            { q: '<p>À partir de la formule qui donne la résistance thermique R<sub>th</sub> en fonction de e, λ et S, exprime la conductivité thermique λ.</p>',
              r: '<p>R<sub>th</sub> = e / (λ × S), donc :</p>' + formule('λ = e / (R<sub>th</sub> × S)') + unites(`λ en ${LAM} ; e en m ; R<sub>th</sub> en ${KW} ; S en m<sup>2</sup>`) }] },
          { id: 'tt-3-isolerE', type: 'formule', competence: 'c7', statut: 'validee', faces: [
            { q: '<p>À partir de la formule qui donne la résistance thermique R<sub>th</sub> en fonction de e, λ et S, exprime l\'épaisseur e.</p>',
              r: '<p>R<sub>th</sub> = e / (λ × S), donc :</p>' + formule('e = R<sub>th</sub> × λ × S') + unites(`e en m ; R<sub>th</sub> en ${KW} ; λ en ${LAM} ; S en m<sup>2</sup>`) }] },
          { id: 'tt-3-sens', type: 'graphique', competence: 'c4', statut: 'validee', outils: ['calculatrice'], faces: [
            { q: fig(bureau(null, 'Mur d\'un bureau climatisé : intérieur à 24 °C, extérieur à 34 °C ; résistance thermique 0,050 K·W⁻¹')) + '<p>Donne le sens du transfert et calcule Φ.</p><small>Φ compté positivement, comme en STI2D</small>',
              r: fig(bureau({ sens: 2, txt: 'Φ = 200 W' }, 'Le même mur : flèche du flux de 200 W de l\'extérieur vers l\'intérieur')) +
                '<p><b>De l\'extérieur vers l\'intérieur</b> : du chaud vers le froid.</p><p>ΔT = T<sub>ext</sub> − T<sub>int</sub> = 34 − 24 = 10 K ; Φ = 10 / 0,050 = <b>200 W</b>.</p>' }] },
          { id: 'tt-3-unites', type: 'reflexe', competence: 'c8', statut: 'validee', faces: [
            { q: '<p>Une plaque a 4 cm d\'épaisseur et une surface de 100 cm<sup>2</sup>. Que fais-tu avant de calculer R = e / (λ × S) ?</p>',
              r: '<p><b>Convertir e en m et S en m<sup>2</sup>.</b></p><p>e = 4 cm = 4 × 10<sup>−2</sup> m ; S = 100 cm<sup>2</sup> = 100 × (10<sup>−2</sup>)<sup>2</sup> = 100 × 10<sup>−4</sup> = 0,01 m<sup>2</sup>.</p>' }] },
        ] },

      /* ---------- Module 4 · Parois composées ---------- */
      { id: 'm4', module: 4, titre: 'Parois composées', apres: ['module_4_cours'],
        competences: [
          { id: 'c1', texte: 'Connaître la résistance d\'une paroi en couches accolées : R = R₁ + R₂ + R₃, même surface S', types: ['formule'], source: 'fiche_4 · Couches accolées ; À retenir' },
          { id: 'c2', texte: 'Appliquer la méthode avec un schéma : e et λ de chaque couche, températures, S → chaque Rᵢ → R → Φ', types: ['methode'], source: 'fiche_4 · La méthode avec un schéma ; cours 4 · étape 2' },
          { id: 'c6', texte: 'Calculer l\'épaisseur d\'isolant à ajouter : R_isolant = R visée − R des autres couches, puis e = R_isolant × λ × S', types: ['methode'], source: 'fiche_4 · isolant à ajouter ; série 4 · diagnostic « R du mur oubliée » ; exercice 18' },
        ],
        cartes: [
          { id: 'tt-4-serie', type: 'formule', competence: 'c1', statut: 'validee', faces: [
            { q: '<p>La formule qui donne la résistance thermique R d\'une paroi de trois couches accolées en fonction des résistances R<sub>1</sub>, R<sub>2</sub>, R<sub>3</sub> des couches ?</p>' + UNITES,
              r: formule('R = R<sub>1</sub> + R<sub>2</sub> + R<sub>3</sub>') + unites(`toutes en ${KW} ; R<sub>i</sub> = e<sub>i</sub> / (λ<sub>i</sub> × S)`) + '<p>Toutes les couches ont la <b>même surface S</b>.</p>' },
            { q: `<p>Données : les résistances thermiques R<sub>1</sub>, R<sub>2</sub> et R<sub>3</sub>, en ${KW}, de trois couches accolées d'une paroi.` + QUOI,
              r: `<p>La <b>résistance thermique totale R</b> de la paroi, en ${KW} :</p>` + formule('R = R<sub>1</sub> + R<sub>2</sub> + R<sub>3</sub>') }] },
          { id: 'tt-4-isolant', type: 'methode', competence: 'c6', statut: 'validee', outils: ['crayon', 'calculatrice'], faces: [
            { q: `<p>Un mur de béton de 10 m<sup>2</sup> a une résistance de 0,016 ${KW}. On veut R = 0,50 ${KW} avec de la laine de verre (λ = 0,040). Quelle épaisseur de laine ?</p><small>Démarche</small>`,
              r: `<ol><li>R<sub>laine</sub> = R − R<sub>béton</sub> = 0,50 − 0,016 = 0,484 ${KW}.</li><li>e = R<sub>laine</sub> × λ × S = 0,484 × 0,040 × 10 ≈ <b>0,19 m = 19 cm</b>.</li></ol>` }] },
        ] },
    ],
  });
})();
