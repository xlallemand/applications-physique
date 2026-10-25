/* Relecture des flashcards de l'application « Chapitre 5 : Flux et transferts thermiques » (transferts-thermiques)
   Tour 3 : cartes écrites de nouveau avec le prompt modifié (voir docs/flashcards/prompt-generation.md) :
   toutes les définitions et toutes les formules (deux sens), peu de cartes d'autres types.
   Tour 1 (compétences) : m2/c5, m2/c6 et m4/c5 retirées par l'enseignant ; prérequis inchangés
   (chaque paquet après son cours). Le module 5 (exercices du manuel) n'a pas de cours : pas de paquet. */
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
    tour: 3, etape: 'cartes',
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
          { id: 'c6', texte: 'Définir les trois modes de transfert : conduction, convection, rayonnement', types: ['definition'], source: 'fiche_1 · Modes et sens du transfert ; À retenir' },
          { id: 'c8', texte: 'Donner le sens du transfert thermique : du chaud vers le froid', types: ['savoir'], source: 'fiche_1 · sens du transfert ; À retenir' },
        ],
        cartes: [
          { id: 'tt-1-kelvin', type: 'formule', competence: 'c1', statut: 'nouvelle', faces: [
            { q: '<p>La formule qui donne la température absolue T à partir de la température θ en degrés Celsius ?</p>' + UNITES,
              r: formule('T = θ + 273') + unites('T en kelvins (K) ; θ en degrés Celsius (°C)') + '<p>Exemple : 20 °C → 293 K.</p>' },
            { q: '<p>Données : la température θ d\'un objet, en °C.' + QUOI,
              r: '<p>Sa <b>température absolue T</b>, en kelvins (K) :</p>' + formule('T = θ + 273') }] },
          { id: 'tt-1-zero', type: 'definition', competence: 'c2', statut: 'nouvelle', faces: [
            { q: '<p>Qu\'est-ce que le zéro absolu ? Sa valeur en K et en °C ?</p>',
              r: '<p>La <b>température la plus basse possible</b> : <b>0 K = −273 °C</b>.</p><p>Une température en kelvins n\'est donc jamais négative.</p>' },
            { q: '<p>Comment s\'appelle la température la plus basse possible ? Sa valeur en K et en °C ?</p>',
              r: '<p>Le <b>zéro absolu</b> : 0 K = −273 °C.</p>' }] },
          { id: 'tt-1-deltaT', type: 'formule', competence: 'c4', statut: 'nouvelle', faces: [
            { q: '<p>La formule qui donne l\'écart de température ΔT entre le côté chaud et le côté froid d\'une paroi ?</p>' + UNITES,
              r: formule('ΔT = T<sub>chaud</sub> − T<sub>froid</sub>') + unites('ΔT en K, températures en K ou en °C') + '<p>Un écart a la <b>même valeur</b> en K et en °C : −3 − (−20) = 17 K.</p>' },
            { q: '<p>Données : la température T<sub>chaud</sub> du côté chaud d\'une paroi et la température T<sub>froid</sub> du côté froid, en °C.' + QUOI,
              r: '<p>L\'<b>écart de température ΔT</b>, en K (même valeur qu\'en °C) :</p>' + formule('ΔT = T<sub>chaud</sub> − T<sub>froid</sub>') }] },
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
          { id: 'tt-1-sens', type: 'savoir', competence: 'c8', statut: 'nouvelle', faces: [
            { q: '<p>Dans quel sens se fait toujours un transfert thermique ? Quand s\'arrête-t-il ?</p>',
              r: '<p><b>Du corps le plus chaud vers le corps le plus froid.</b></p><p>Il s\'arrête quand les deux corps sont à la même température. Le « froid » ne se transfère pas.</p>' }] },
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
          { id: 'tt-2-flux', type: 'definition', competence: 'c1', statut: 'nouvelle', faces: [
            { q: '<p>Qu\'est-ce que le flux thermique Φ ? Unité ?</p>',
              r: '<p>La <b>puissance thermique</b> qui traverse une paroi : l\'énergie qui la traverse chaque seconde.</p><p>Φ s\'exprime en <b>watts (W)</b>, comme toute puissance.</p>' },
            { q: '<p>Comment s\'appelle la puissance thermique qui traverse une paroi ? Symbole, unité ?</p>',
              r: '<p>Le <b>flux thermique Φ</b>, en watts (W).</p>' }] },
          { id: 'tt-2-formule', type: 'formule', competence: 'c2', statut: 'nouvelle', faces: [
            { q: '<p>La formule qui donne le flux thermique Φ en fonction de l\'énergie thermique Q et de la durée Δt ?</p>' + UNITES,
              r: formule('Φ = Q / Δt') + unites('Φ en W ; Q en J ; Δt en s') + '<p>C\'est P = E / Δt.</p>' },
            { q: '<p>Données : l\'énergie thermique Q, en J, qui traverse une paroi pendant une durée Δt, en s.' + QUOI,
              r: '<p>Le <b>flux thermique Φ</b>, en W :</p>' + formule('Φ = Q / Δt') }] },
          { id: 'tt-2-energie', type: 'formule', competence: 'c4', statut: 'nouvelle', faces: [
            { q: '<p>La formule qui donne l\'énergie thermique Q transférée à travers une paroi ?</p>' + UNITES,
              r: formule('Q = Φ × Δt') + unites('Φ en W ; Δt en s : Q en J ; Δt en h : Q en Wh') + '<p>C\'est E = P × Δt.</p>' },
            { q: '<p>Données : le flux thermique Φ, en W, qui traverse une paroi pendant une durée Δt, en s.' + QUOI,
              r: '<p>L\'<b>énergie thermique Q</b> transférée, en J (en Wh si Δt est en h) :</p>' + formule('Q = Φ × Δt') }] },
          { id: 'tt-2-lien', type: 'savoir', competence: 'c3', statut: 'nouvelle', faces: [
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
          { id: 'tt-3-rth', type: 'definition', competence: 'c9', statut: 'nouvelle', faces: [
            { q: '<p>Qu\'est-ce que la résistance thermique R<sub>th</sub> d\'une paroi ? Unité ?</p>',
              r: `<p>Une grandeur qui dit combien la paroi <b>résiste au transfert thermique</b>, en <b>${KW}</b>.</p><p>Plus R<sub>th</sub> est grande, meilleure est l'isolation et plus le flux est petit.</p>` },
            { q: `<p>Comment s'appelle la grandeur, en ${KW}, qui dit combien une paroi résiste au transfert thermique ? Symbole ?</p>`,
              r: '<p>La <b>résistance thermique R<sub>th</sub></b>.</p>' }] },
          { id: 'tt-3-lambda', type: 'definition', competence: 'c3', statut: 'nouvelle', faces: [
            { q: '<p>Qu\'est-ce que la conductivité thermique λ ? Unité ?</p>',
              r: `<p>Une grandeur du <b>matériau</b>, en ${LAM} : plus λ est grand, mieux le matériau conduit l'énergie.</p><p><b>λ petit : matériau isolant</b> (laine de verre, polystyrène, air immobile).</p>` },
            { q: `<p>Comment s'appelle la grandeur d'un matériau, en ${LAM}, qui est petite pour un isolant ? Symbole ?</p>`,
              r: '<p>La <b>conductivité thermique λ</b>.</p>' }] },
          { id: 'tt-3-flux', type: 'formule', competence: 'c1', statut: 'nouvelle', faces: [
            { q: '<p>La formule qui donne le flux thermique Φ à travers une paroi en fonction de l\'écart de température ΔT et de la résistance thermique R<sub>th</sub> ?</p>' + UNITES,
              r: formule('Φ = ΔT / R<sub>th</sub>') + unites(`Φ en W ; ΔT = T<sub>chaud</sub> − T<sub>froid</sub> en K ; R<sub>th</sub> en ${KW}`) },
            { q: `<p>Données : l'écart de température ΔT, en K, entre les deux faces d'une paroi et sa résistance thermique R<sub>th</sub>, en ${KW}.` + QUOI,
              r: '<p>Le <b>flux thermique Φ</b> qui traverse la paroi, en W :</p>' + formule('Φ = ΔT / R<sub>th</sub>') }] },
          { id: 'tt-3-resistance', type: 'formule', competence: 'c2', statut: 'nouvelle', faces: [
            { q: '<p>La formule qui donne la résistance thermique R<sub>th</sub> d\'une paroi en fonction de son épaisseur e, de sa surface S et de la conductivité thermique λ ?</p>' + UNITES,
              r: formule('R<sub>th</sub> = e / (λ × S)') + unites(`e en m ; S en m<sup>2</sup> ; λ en ${LAM} ; R<sub>th</sub> en ${KW}`) },
            { q: `<p>Données : l'épaisseur e d'une paroi, en m, sa surface S, en m<sup>2</sup>, et la conductivité thermique λ de son matériau, en ${LAM}.` + QUOI,
              r: `<p>La <b>résistance thermique R<sub>th</sub></b> de la paroi, en ${KW} :</p>` + formule('R<sub>th</sub> = e / (λ × S)') }] },
          { id: 'tt-3-isolerR', type: 'formule', competence: 'c7', statut: 'nouvelle', faces: [
            { q: '<p>La formule qui donne la résistance thermique R d\'une paroi en fonction de l\'écart de température ΔT et du flux Φ ?</p>' + UNITES,
              r: formule('R = ΔT / Φ') + unites(`R en ${KW} ; ΔT en K ; Φ en W`) + '<p>Elle vient de Φ = ΔT / R.</p>' },
            { q: '<p>Données : l\'écart de température ΔT, en K, entre les faces d\'une paroi et le flux Φ, en W, qui la traverse.' + QUOI,
              r: `<p>La <b>résistance thermique R</b> de la paroi, en ${KW} :</p>` + formule('R = ΔT / Φ') }] },
          { id: 'tt-3-isolerL', type: 'formule', competence: 'c7', statut: 'nouvelle', faces: [
            { q: '<p>La formule qui donne la conductivité thermique λ d\'un matériau en fonction de l\'épaisseur e, de la résistance R et de la surface S d\'une paroi ?</p>' + UNITES,
              r: formule('λ = e / (R × S)') + unites(`λ en ${LAM} ; e en m ; R en ${KW} ; S en m<sup>2</sup>`) + '<p>Elle vient de R = e / (λ × S).</p>' },
            { q: `<p>Données : l'épaisseur e d'une paroi, en m, sa résistance thermique R, en ${KW}, et sa surface S, en m<sup>2</sup>.` + QUOI,
              r: `<p>La <b>conductivité thermique λ</b> du matériau, en ${LAM} :</p>` + formule('λ = e / (R × S)') }] },
          { id: 'tt-3-isolerE', type: 'formule', competence: 'c7', statut: 'nouvelle', faces: [
            { q: '<p>La formule qui donne l\'épaisseur e d\'une paroi en fonction de sa résistance thermique R, de la conductivité λ et de la surface S ?</p>' + UNITES,
              r: formule('e = R × λ × S') + unites(`e en m ; R en ${KW} ; λ en ${LAM} ; S en m<sup>2</sup>`) + '<p>Elle vient de R = e / (λ × S).</p>' },
            { q: `<p>Données : la résistance thermique R visée pour une paroi, en ${KW}, la conductivité λ du matériau, en ${LAM}, et la surface S, en m<sup>2</sup>.` + QUOI,
              r: '<p>L\'<b>épaisseur e</b> de la paroi, en m :</p>' + formule('e = R × λ × S') }] },
          { id: 'tt-3-sens', type: 'graphique', competence: 'c4', statut: 'nouvelle', outils: ['calculatrice'], faces: [
            { q: fig(bureau(null, 'Mur d\'un bureau climatisé : intérieur à 24 °C, extérieur à 34 °C ; résistance thermique 0,050 K·W⁻¹')) + '<p>Sens du transfert, ΔT et Φ ?</p><small>Φ compté positivement, comme en STI2D</small>',
              r: fig(bureau({ sens: 2, txt: 'Φ = 200 W' }, 'Le même mur : flèche du flux de 200 W de l\'extérieur vers l\'intérieur')) +
                '<p><b>De l\'extérieur vers l\'intérieur</b> : du chaud vers le froid.</p><p>ΔT = T<sub>ext</sub> − T<sub>int</sub> = 34 − 24 = 10 K ; Φ = 10 / 0,050 = <b>200 W</b>.</p>' }] },
          { id: 'tt-3-unites', type: 'reflexe', competence: 'c8', statut: 'nouvelle', faces: [
            { q: '<p>Une plaque a 4 cm d\'épaisseur et une surface de 100 cm<sup>2</sup>. Que fais-tu avant de calculer R = e / (λ × S) ?</p>',
              r: '<p><b>Convertir e en m et S en m<sup>2</sup>.</b></p><p>e = 4 cm = 4 × 10<sup>−2</sup> m ; S = 100 × 10<sup>−4</sup> = 0,01 m<sup>2</sup>.</p><p>1 cm = 10<sup>−2</sup> m ; 1 mm = 10<sup>−3</sup> m ; 1 cm<sup>2</sup> = 10<sup>−4</sup> m<sup>2</sup>.</p>' }] },
        ] },

      /* ---------- Module 4 · Parois composées ---------- */
      { id: 'm4', module: 4, titre: 'Parois composées', apres: ['module_4_cours'],
        competences: [
          { id: 'c1', texte: 'Connaître la résistance d\'une paroi en couches accolées : R = R₁ + R₂ + R₃, même surface S', types: ['formule'], source: 'fiche_4 · Couches accolées ; À retenir' },
          { id: 'c2', texte: 'Appliquer la méthode avec un schéma : e et λ de chaque couche, températures, S → chaque Rᵢ → R → Φ', types: ['methode'], source: 'fiche_4 · La méthode avec un schéma ; cours 4 · étape 2' },
          { id: 'c6', texte: 'Calculer l\'épaisseur d\'isolant à ajouter : R_isolant = R visée − R des autres couches, puis e = R_isolant × λ × S', types: ['methode'], source: 'fiche_4 · isolant à ajouter ; série 4 · diagnostic « R du mur oubliée » ; exercice 18' },
        ],
        cartes: [
          { id: 'tt-4-serie', type: 'formule', competence: 'c1', statut: 'nouvelle', faces: [
            { q: '<p>La formule qui donne la résistance thermique R d\'une paroi de trois couches accolées en fonction des résistances R<sub>1</sub>, R<sub>2</sub>, R<sub>3</sub> des couches ?</p>' + UNITES,
              r: formule('R = R<sub>1</sub> + R<sub>2</sub> + R<sub>3</sub>') + unites(`toutes en ${KW} ; R<sub>i</sub> = e<sub>i</sub> / (λ<sub>i</sub> × S)`) + '<p>Toutes les couches ont la <b>même surface S</b>.</p>' },
            { q: `<p>Données : les résistances thermiques R<sub>1</sub>, R<sub>2</sub> et R<sub>3</sub>, en ${KW}, de trois couches accolées d'une paroi.` + QUOI,
              r: `<p>La <b>résistance thermique totale R</b> de la paroi, en ${KW} :</p>` + formule('R = R<sub>1</sub> + R<sub>2</sub> + R<sub>3</sub>') }] },
          { id: 'tt-4-methode', type: 'methode', competence: 'c2', statut: 'nouvelle', faces: [
            { q: '<p>Comment calculer le flux thermique à travers une paroi formée de plusieurs couches ?</p><small>Les étapes</small>',
              r: '<ol><li>Schéma : e et λ de chaque couche, températures des deux côtés, S.</li><li>R<sub>i</sub> = e<sub>i</sub> / (λ<sub>i</sub> × S) pour chaque couche (e en m).</li><li>R = R<sub>1</sub> + R<sub>2</sub> + …</li><li>Φ = ΔT / R, du chaud vers le froid.</li></ol>' }] },
          { id: 'tt-4-isolant', type: 'methode', competence: 'c6', statut: 'nouvelle', outils: ['calculatrice'], faces: [
            { q: `<p>Un mur de béton de 10 m<sup>2</sup> a une résistance de 0,016 ${KW}. On veut R = 0,50 ${KW} avec de la laine de verre (λ = 0,040). Quelle épaisseur de laine ?</p><small>Démarche</small>`,
              r: `<ol><li>R<sub>laine</sub> = R − R<sub>béton</sub> = 0,50 − 0,016 = 0,484 ${KW}.</li><li>e = R<sub>laine</sub> × λ × S = 0,484 × 0,040 × 10 ≈ <b>0,19 m = 19 cm</b>.</li></ol>` }] },
        ] },
    ],
  });
})();
