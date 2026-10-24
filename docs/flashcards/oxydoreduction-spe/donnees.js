/* Relecture des flashcards de l'application « Oxydoréduction » (oxydoreduction-spe)
   Tour 2 : les cartes (voir docs/flashcards/prompt-generation.md)
   Le module 4 (Écrire les réactions) reprend tous les autres : pas de paquet.
   Prérequis : chaque paquet après son cours (choix de l'enseignant, tour 1). */
(function () {
  // écritures chimiques (comme OX.h dans l'application)
  const E = 'e<sup>−</sup>', HP = 'H<sup>+</sup>', EAU = 'H<sub>2</sub>O';
  const n = (k, f) => `${k}&nbsp;${f}`;                                  // nombre stœchiométrique devant une espèce
  const MnO4 = 'MnO<sub>4</sub><sup>−</sup>', Mn2 = 'Mn<sup>2+</sup>', Cr2O7 = 'Cr<sub>2</sub>O<sub>7</sub><sup>2−</sup>', Cr3 = 'Cr<sup>3+</sup>';
  const Fe2 = 'Fe<sup>2+</sup>', Fe3 = 'Fe<sup>3+</sup>', Cu2 = 'Cu<sup>2+</sup>', Zn2 = 'Zn<sup>2+</sup>', Ag1 = 'Ag<sup>+</sup>';
  const Sn2 = 'Sn<sup>2+</sup>', Sn4 = 'Sn<sup>4+</sup>', S4O6 = 'S<sub>4</sub>O<sub>6</sub><sup>2−</sup>', S2O3 = 'S<sub>2</sub>O<sub>3</sub><sup>2−</sup>';
  const H2O2 = 'H<sub>2</sub>O<sub>2</sub>', O2 = 'O<sub>2</sub>', I2 = 'I<sub>2</sub>', Im = 'I<sup>−</sup>';
  const Ox = i => `Ox<sub>${i}</sub>`, Red = i => `Red<sub>${i}</sub>`;
  const formule = s => `<p class="rev-formule">${s}</p>`;

  // figures (SVG autonomes : attributs de présentation, couleurs de assets/theme.css, accent chimie)
  const ACC = '#0a7d57', ENC = '#16181d';
  // les deux sens de la demi-équation : flèche du haut vers la droite, flèche du bas vers la gauche
  function sens(legende) {
    const etiq = (y, num, mot) => legende
      ? `<circle cx="182" cy="${y}" r="15" fill="${ACC}"/><text x="182" y="${y + 6}" text-anchor="middle" font-size="18" font-weight="700" fill="#ffffff">${num}</text><text x="206" y="${y + 7}" font-size="21" font-weight="700" fill="${ACC}">${mot}</text>`
      : `<circle cx="260" cy="${y}" r="15" fill="${ACC}"/><text x="260" y="${y + 6}" text-anchor="middle" font-size="18" font-weight="700" fill="#ffffff">${num}</text>`;
    const aria = legende
      ? 'Demi-équation Ox + n e⁻ = Red ; flèche 1 de gauche à droite : réduction ; flèche 2 de droite à gauche : oxydation'
      : 'Demi-équation Ox + n e⁻ = Red ; flèche 1 de gauche à droite, flèche 2 de droite à gauche';
    return `<svg viewBox="0 0 520 200" width="520" height="200" role="img" aria-label="${aria}">` +
      `<rect x="1" y="1" width="518" height="198" rx="14" fill="#f3f1ec"/>` +
      `<line x1="140" y1="62" x2="368" y2="62" stroke="${ACC}" stroke-width="3.5"/><polygon points="384,62 366,53 366,71" fill="${ACC}"/>` +
      `<line x1="380" y1="140" x2="152" y2="140" stroke="${ACC}" stroke-width="3.5"/><polygon points="136,140 154,131 154,149" fill="${ACC}"/>` +
      `<text x="260" y="111" text-anchor="middle" font-size="30" font-weight="700" fill="${ENC}">Ox + n e⁻ = Red</text>` +
      etiq(28, '1', 'réduction') + etiq(174, '2', 'oxydation') + '</svg>';
  }
  const fig = s => `<div class="rev-fig">${s}</div>`;

  RELECTURE({
    dossier: 'oxydoreduction-spe', titre: 'Oxydoréduction', court: 'Oxydoréduction', matiere: 'chimie',
    tour: 2, etape: 'cartes',
    // pages de cours de l'application (prérequis possibles)
    cours: [
      { cle: 'module_1a_cours', nom: 'Cours : oxydant et réducteur' },
      { cle: 'module_1b_cours', nom: 'Cours : couple et demi-équation' },
      { cle: 'module_1c_cours', nom: 'Cours : oxydation et réduction' },
      { cle: 'module_1d_cours', nom: 'Cours : réaction entre un oxydant et un réducteur' },
      { cle: 'module_2a_cours', nom: 'Cours : la méthode en 4 étapes' },
      { cle: 'module_2b_cours', nom: 'Cours : équilibrer les charges' },
      { cle: 'module_3_cours', nom: 'Cours du module 3' },
      { cle: 'module_4_cours', nom: 'Méthode express (module 4)' },
    ],
    paquets: [
      /* ---------- Module 1 · Oxydant et réducteur ---------- */
      { id: 'm1a', module: 1, titre: 'Oxydant et réducteur', apres: ['module_1a_cours'],
        competences: [
          { id: 'c1', texte: 'Définir un oxydant', types: ['definition'], source: 'fiche_1 · Oxydant et réducteur' },
          { id: 'c2', texte: 'Définir un réducteur', types: ['definition'], source: 'fiche_1 · Oxydant et réducteur' },
          { id: 'c3', texte: 'Relier capter / céder des électrons à la baisse / la hausse de la charge', types: ['savoir'], source: 'cours 1a · étape 1 ; À retenir' },
          { id: 'c4', texte: 'Trouver le nombre d\'électrons échangés à partir des deux charges (exercice-type : Sn²⁺ devient Sn⁴⁺)', types: ['methode'], source: 'cours 1a · « Compter les électrons »' },
        ],
        cartes: [
          { id: 'ox-1a-oxydant', type: 'definition', competence: 'c1', statut: 'nouvelle', faces: [
            { q: '<p>Qu\'est-ce qu\'un oxydant ?</p><small>Définition et un exemple</small>',
              r: `<p>Une espèce chimique capable de <b>capter</b> un ou plusieurs électrons.</p><p>${Cu2} capte 2 électrons pour devenir Cu.</p>` },
            { q: '<p>Comment s\'appelle une espèce chimique capable de capter un ou plusieurs électrons ?</p>',
              r: `<p>Un <b>oxydant</b>. Exemple : ${Cu2}, qui devient Cu.</p>` }] },
          { id: 'ox-1a-reducteur', type: 'definition', competence: 'c2', statut: 'nouvelle', faces: [
            { q: '<p>Qu\'est-ce qu\'un réducteur ?</p><small>Définition et un exemple</small>',
              r: `<p>Une espèce chimique capable de <b>céder</b> un ou plusieurs électrons.</p><p>${Fe2} cède 1 électron pour devenir ${Fe3}.</p>` },
            { q: '<p>Comment s\'appelle une espèce chimique capable de céder un ou plusieurs électrons ?</p>',
              r: `<p>Un <b>réducteur</b>. Exemple : ${Fe2}, qui devient ${Fe3}.</p>` }] },
          { id: 'ox-1a-charge', type: 'savoir', competence: 'c3', statut: 'nouvelle', faces: [
            { q: '<p>Une espèce capte n électrons : que devient sa charge ? Et si elle en cède ?</p>',
              r: '<p><b>Capter</b> n électrons : la charge <b>diminue</b> de n.</p><p><b>Céder</b> n électrons : la charge <b>augmente</b> de n.</p><p>Un électron porte la charge −1.</p>' }] },
          { id: 'ox-1a-compter', type: 'methode', competence: 'c4', statut: 'nouvelle', faces: [
            { q: `<p>${Sn2} devient ${Sn4}. Combien d'électrons échange-t-il ? Oxydant ou réducteur ?</p><small>Démarche</small>`,
              r: `<ol><li>Lire les deux charges : +2, puis +4.</li><li>Faire leur <b>différence</b> : la charge augmente de <b>2</b>.</li><li>Elle augmente : ${Sn2} <b>cède 2 électrons</b>, c'est un <b>réducteur</b>.</li></ol>` }] },
        ] },

      /* ---------- Module 1 · Couple et demi-équation ---------- */
      { id: 'm1b', module: 1, titre: 'Couple et demi-équation', apres: ['module_1b_cours'],
        competences: [
          { id: 'c1', texte: 'Définir un couple oxydant / réducteur et l\'écrire Ox / Red, l\'oxydant en premier', types: ['definition'], source: 'fiche_1 · Couple et demi-équation' },
          { id: 'c2', texte: 'Écrire la demi-équation d\'un couple : Oxydant + n e⁻ = Réducteur', types: ['formule'], source: 'fiche_1 · Couple et demi-équation ; À retenir 1b' },
          { id: 'c3', texte: 'Écrire le couple à partir d\'une phrase (« Cu²⁺ peut être réduit en Cu », « Fe²⁺ peut être oxydé en Fe³⁺ »)', types: ['methode'], source: 'série 1 · Écrire un couple' },
          { id: 'c5', texte: 'Trouver l\'oxydant dans une demi-équation avec H⁺ et H₂O (H⁺ n\'est pas l\'oxydant)', types: ['reflexe'], source: 'cours 1b · « L\'oxydant d\'une demi-équation » ; série 1 · diagnostic H⁺' },
        ],
        cartes: [
          { id: 'ox-1b-couple', type: 'definition', competence: 'c1', statut: 'nouvelle', faces: [
            { q: '<p>Qu\'est-ce qu\'un couple oxydant / réducteur ? Comment l\'écrit-on ?</p>',
              r: `<p>Un oxydant et le <b>réducteur qu'il devient</b> en captant des électrons.</p><p>On l'écrit <b>Oxydant / Réducteur</b>, l'oxydant en premier : ${Cu2} / Cu.</p>` },
            { q: '<p>Comment s\'appelle l\'ensemble d\'un oxydant et du réducteur qu\'il devient en captant des électrons ? Comment l\'écrit-on ?</p>',
              r: `<p>Un <b>couple oxydant / réducteur</b>, écrit <b>Ox / Red</b> : ${Cu2} / Cu.</p>` }] },
          { id: 'ox-1b-demi', type: 'formule', competence: 'c2', statut: 'nouvelle', faces: [
            { q: '<p>Demi-équation d\'un couple Ox / Red ?</p><small>Écriture générale et un exemple</small>',
              r: `${formule(`Oxydant + n ${E} = Réducteur`)}<p>Les électrons du côté de l'<b>oxydant</b> : c'est lui qui les capte.</p><p>${Cu2} + ${n(2, E)} = Cu</p>` },
            { q: `${formule(`Oxydant + n ${E} = Réducteur`)}<p>Comment s'appelle cette écriture ? Que représente n ? Que signifie le signe = ?</p>`,
              r: '<p>La <b>demi-équation</b> du couple Ox / Red.</p><p>n : le nombre d\'électrons échangés. Le signe = : l\'échange peut se faire dans les deux sens.</p>' }] },
          { id: 'ox-1b-phrase', type: 'methode', competence: 'c3', statut: 'nouvelle', faces: [
            { q: `<p>« ${Fe2} peut être oxydé en ${Fe3}. » Comment écris-tu le couple ?</p><small>Démarche</small>`,
              r: `<ol><li>Oxydé : ${Fe2} <b>cède</b> des électrons, c'est le <b>réducteur</b>.</li><li>Il devient ${Fe3}, l'<b>oxydant</b>.</li><li>L'oxydant en premier : <b>${Fe3} / ${Fe2}</b>.</li></ol>` }] },
          { id: 'ox-1b-hplus', type: 'reflexe', competence: 'c5', statut: 'nouvelle', faces: [
            { q: `${formule(`${Cr2O7} + ${n(14, HP)} + ${n(6, E)} = ${n(2, Cr3)} + ${n(7, EAU)}`)}<p>Dans cette demi-équation, quel est l'oxydant du couple ?</p>`,
              r: `<p><b>${Cr2O7}</b> : l'espèce du couple écrite <b>du côté des électrons</b>. Couple ${Cr2O7} / ${Cr3}.</p><p>${HP} n'est pas l'oxydant : il sert seulement à équilibrer l'élément H.</p>` }] },
        ] },

      /* ---------- Module 1 · Oxydation et réduction ---------- */
      { id: 'm1c', module: 1, titre: 'Oxydation et réduction', apres: ['module_1c_cours'],
        competences: [
          { id: 'c1', texte: 'Définir une oxydation (perte d\'électrons)', types: ['definition'], source: 'fiche_1 · Oxydation et réduction' },
          { id: 'c2', texte: 'Définir une réduction (gain d\'électrons)', types: ['definition'], source: 'fiche_1 · Oxydation et réduction' },
          { id: 'c3', texte: 'Placer « réduction » et « oxydation » sur les deux sens de Ox + n e⁻ = Red', types: ['schema'], source: 'méthode express · tuile « Réduction et oxydation »' },
          { id: 'c4', texte: 'Savoir que l\'oxydant est réduit et que le réducteur est oxydé', types: ['savoir'], source: 'cours 1c · « Oxydé ou réduit ? » ; série 1 · grille vocabulaire' },
          { id: 'c5', texte: 'Reconnaître une oxydation ou une réduction sur une demi-équation orientée (place des électrons)', types: ['methode'], source: 'cours 1c · « Reconnaître » ; série 1 · Oxydation ou réduction' },
        ],
        cartes: [
          { id: 'ox-1c-oxydation', type: 'definition', competence: 'c1', statut: 'nouvelle', faces: [
            { q: '<p>Qu\'est-ce qu\'une oxydation ?</p><small>Définition et demi-équation pour un couple Ox / Red</small>',
              r: `<p>Une <b>perte d'électrons</b> : le réducteur cède des électrons et forme l'oxydant.</p>${formule(`Réducteur = Oxydant + n ${E}`)}<p>Le réducteur <b>est oxydé</b>.</p>` },
            { q: '<p>Comment s\'appelle une perte d\'électrons ?</p>',
              r: `<p>Une <b>oxydation</b> : Réducteur = Oxydant + n ${E}.</p>` }] },
          { id: 'ox-1c-reduction', type: 'definition', competence: 'c2', statut: 'nouvelle', faces: [
            { q: '<p>Qu\'est-ce qu\'une réduction ?</p><small>Définition et demi-équation pour un couple Ox / Red</small>',
              r: `<p>Un <b>gain d'électrons</b> : l'oxydant capte des électrons et forme le réducteur.</p>${formule(`Oxydant + n ${E} = Réducteur`)}<p>L'oxydant <b>est réduit</b>.</p>` },
            { q: '<p>Comment s\'appelle un gain d\'électrons ?</p>',
              r: `<p>Une <b>réduction</b> : Oxydant + n ${E} = Réducteur.</p>` }] },
          { id: 'ox-1c-sens', type: 'schema', competence: 'c3', statut: 'nouvelle', faces: [
            { q: '<p>Nomme les transformations ① et ②.</p>' + fig(sens(false)),
              r: fig(sens(true)) + '<p>① <b>réduction</b> : formation du réducteur. ② <b>oxydation</b> : formation de l\'oxydant.</p>' }] },
          { id: 'ox-1c-oxyde', type: 'savoir', competence: 'c4', statut: 'nouvelle', faces: [
            { q: '<p>Au cours d\'une réaction, l\'oxydant est-il oxydé ou réduit ? Et le réducteur ?</p>',
              r: '<p>L\'oxydant <b>est réduit</b> : il capte des électrons.</p><p>Le réducteur <b>est oxydé</b> : il cède des électrons.</p>' }] },
          { id: 'ox-1c-reconnaitre', type: 'methode', competence: 'c5', statut: 'nouvelle', faces: [
            { q: `${formule(`Zn = ${Zn2} + ${n(2, E)}`)}<p>Oxydation ou réduction ? Comment le reconnais-tu ?</p>`,
              r: `<p><b>Oxydation</b> : les électrons sont à <b>droite</b> du signe =, Zn les cède. Zn est oxydé en ${Zn2}.</p><p>Électrons à gauche, avec l'espèce qui les capte : réduction.</p>` }] },
        ] },

      /* ---------- Module 1 · Réaction entre un oxydant et un réducteur ---------- */
      { id: 'm1d', module: 1, titre: 'Réaction entre un oxydant et un réducteur', apres: ['module_1d_cours'],
        competences: [
          { id: 'c2', texte: 'Savoir que les électrons ne restent jamais libres en solution', types: ['savoir'], source: 'cours 1d · étape 1 ; série 1 · grille vocabulaire' },
          { id: 'c3', texte: 'Trouver les produits d\'une réaction à partir des réactifs et des couples (exercice-type : Ag⁺ et Cu)', types: ['methode'], source: 'cours 1d · « Les produits » ; série 1 · Une réaction' },
        ],
        cartes: [
          { id: 'ox-1d-libres', type: 'savoir', competence: 'c2', statut: 'nouvelle', faces: [
            { q: '<p>Un réducteur peut-il céder des électrons s\'il n\'y a pas d\'oxydant pour les capter ? Pourquoi ?</p>',
              r: '<p><b>Non</b> : les électrons ne restent jamais libres dans une solution.</p><p>Les électrons cédés par le réducteur sont captés par l\'oxydant : la réaction est un <b>transfert d\'électrons</b>.</p>' }] },
          { id: 'ox-1d-produits', type: 'methode', competence: 'c3', statut: 'nouvelle', faces: [
            { q: `<p>On met en présence ${Ag1} et Cu. Couples : ${Ag1} / Ag et ${Cu2} / Cu. Quels sont les produits ?</p><small>Démarche</small>`,
              r: `<ol><li>${Ag1}, l'oxydant, est <b>réduit</b> : il devient le réducteur de son couple, <b>Ag</b>.</li><li>Cu, le réducteur, est <b>oxydé</b> : il devient l'oxydant de son couple, <b>${Cu2}</b>.</li></ol><p>${Ag1} + Cu → Ag + ${Cu2} (nombres stœchiométriques non écrits)</p>` }] },
        ] },

      /* ---------- Module 2 · La méthode en 4 étapes ---------- */
      { id: 'm2a', module: 2, titre: 'La méthode en 4 étapes', apres: ['module_2a_cours'],
        competences: [
          { id: 'c1', texte: 'Citer dans l\'ordre les 4 étapes pour équilibrer une demi-équation', types: ['methode'], source: 'fiche_2 · La méthode en 4 étapes' },
          { id: 'c2', texte: 'Équilibrer un élément avec un nombre stœchiométrique, jamais en changeant un indice', types: ['reflexe'], source: 'cours 2a · étape 1 ; outil DEMI · diagnostic « indice »' },
          { id: 'c3', texte: 'N\'ajouter H₂O et H⁺ que s\'il en faut (I₂ / I⁻, O₂ / H₂O₂)', types: ['savoir'], source: 'cours 2a · étape 2 ; fiche_2' },
          { id: 'c6', texte: 'Écrire la demi-équation du couple MnO₄⁻ / Mn²⁺ (exercice-type, démarche étape par étape)', types: ['methode'], source: 'fiche_2 · exemple ; méthode express · bloc B' },
        ],
        cartes: [
          { id: 'ox-2a-etapes', type: 'methode', competence: 'c1', statut: 'nouvelle', faces: [
            { q: '<p>Équilibrer la demi-équation d\'un couple Ox / Red : les 4 étapes, dans l\'ordre ?</p>',
              r: `<ol><li>Oxydant à gauche, réducteur à droite ; équilibrer les éléments <b>autres que O et H</b>.</li><li>Équilibrer <b>O</b> en ajoutant ${EAU}.</li><li>Équilibrer <b>H</b> en ajoutant ${HP}.</li><li>Équilibrer les <b>charges</b> en ajoutant ${E}.</li></ol>` }] },
          { id: 'ox-2a-indice', type: 'reflexe', competence: 'c2', statut: 'nouvelle', faces: [
            { q: `${formule(`${Cr2O7} = ${Cr3}`)}<p>2 atomes Cr à gauche, 1 à droite : comment équilibres-tu Cr ? Que ne fais-tu jamais ?</p>`,
              r: `<p>Écrire le nombre stœchiométrique <b>2 devant ${Cr3}</b> : ${Cr2O7} = ${n(2, Cr3)}.</p><p>Ne <b>jamais changer un indice</b> : ${Cr2O7} reste ${Cr2O7}.</p>` }] },
          { id: 'ox-2a-sifaut', type: 'savoir', competence: 'c3', statut: 'nouvelle', faces: [
            { q: `<p>Faut-il toujours ajouter ${EAU} et ${HP} dans une demi-équation ?</p><small>Règle et un exemple</small>`,
              r: `<p><b>Non</b> : ${EAU} seulement s'il <b>manque des atomes O</b>, ${HP} seulement s'il <b>manque des atomes H</b>.</p><p>${I2} + ${n(2, E)} = ${n(2, Im)} : ni O ni H, on n'ajoute rien.</p>` }] },
          { id: 'ox-2a-mno4', type: 'methode', competence: 'c6', statut: 'nouvelle', faces: [
            { q: `<p>Écris la demi-équation du couple ${MnO4} / ${Mn2}.</p><small>Démarche, étape par étape</small>`,
              r: `<ol><li>Mn : 1 de chaque côté.</li><li>4 O à gauche : ${n(4, EAU)} à droite.</li><li>8 H à droite : ${n(8, HP)} à gauche.</li><li>Charges +7 et +2 : ${n(5, E)} à gauche.</li></ol>${formule(`${MnO4} + ${n(8, HP)} + ${n(5, E)} = ${Mn2} + ${n(4, EAU)}`)}` }] },
        ] },

      /* ---------- Module 2 · Équilibrer les charges ---------- */
      { id: 'm2b', module: 2, titre: 'Équilibrer les charges', apres: ['module_2b_cours'],
        competences: [
          { id: 'c1', texte: 'Calculer la charge totale d\'un membre (exercice-type : MnO₄⁻ + 8 H⁺)', types: ['methode'], source: 'fiche_2 · Équilibrer les charges ; cours 2b · étape 1' },
          { id: 'c4', texte: 'Placer les électrons du côté où la charge est la plus grande, y compris avec des charges négatives (−2 > −4)', types: ['savoir', 'reflexe'], source: 'cours 2b · « Où placer les électrons ? » ; diagnostic e-signe' },
        ],
        cartes: [
          { id: 'ox-2b-charge', type: 'methode', competence: 'c1', statut: 'nouvelle', faces: [
            { q: `<p>Charge totale du membre ${MnO4} + ${n(8, HP)} ?</p><small>Démarche</small>`,
              r: `<p>Additionner les charges, chacune <b>multipliée par son nombre stœchiométrique</b> ; une charge négative compte en moins :</p>${formule('(−1) + 8 × (+1) = +7')}<p>Une molécule (${EAU}, SO<sub>2</sub>…) compte pour 0.</p>` }] },
          { id: 'ox-2b-cote', type: 'savoir', competence: 'c4', statut: 'nouvelle', faces: [
            { q: '<p>Sans les électrons, les deux membres d\'une demi-équation n\'ont pas la même charge. De quel côté ajoutes-tu les électrons ? Pourquoi ?</p>',
              r: `<p>Du côté où la charge est <b>la plus grande</b> (celui de l'oxydant).</p><p>Un électron porte la charge −1 : ajouter n ${E} fait <b>baisser</b> la charge de n.</p>` }] },
          { id: 'ox-2b-negatif', type: 'reflexe', competence: 'c4', statut: 'nouvelle', faces: [
            { q: `${formule(`${S4O6} = ${n(2, S2O3)}`)}<p>Charge −2 à gauche, −4 à droite : de quel côté vont les électrons ?</p>`,
              r: `<p><b>À gauche</b> : −2 est plus grand que −4 (plus proche de 0).</p><p>${S4O6} + ${n(2, E)} = ${n(2, S2O3)}</p>` }] },
        ] },

      /* ---------- Module 3 · Écrire l'équation d'une réaction ---------- */
      { id: 'm3', module: 3, titre: 'Écrire l\'équation d\'une réaction', apres: ['module_3_cours'],
        competences: [
          { id: 'c1', texte: 'Citer dans l\'ordre les 3 étapes pour écrire l\'équation d\'une réaction', types: ['methode'], source: 'fiche_3 · La méthode ; À retenir 3' },
          { id: 'c2', texte: 'Entourer les réactifs et écrire chaque demi-équation dans le sens de la réaction, le réactif à gauche du signe =', types: ['savoir'], source: 'fiche_3 · étape 1 ; série 3 · Dans le sens de la réaction' },
          { id: 'c3', texte: 'Trouver les multiplicateurs : le plus petit multiple commun des nombres d\'électrons (exercice-type : 5 et 1, 2 et 3)', types: ['methode'], source: 'série 3 · Égaliser les électrons (diagnostics)' },
          { id: 'c4', texte: 'Multiplier toute la demi-équation ; aucun électron dans l\'équation de la réaction', types: ['reflexe'], source: 'méthode express · Les pièges ; diagnostic de l\'équation (électrons)' },
          { id: 'c5', texte: 'Simplifier les H⁺ et H₂O présents des deux côtés (exercice-type : 16 H⁺ à gauche, 10 à droite)', types: ['methode'], source: 'fiche_3 · Simplifier H⁺ et H₂O' },
          { id: 'c6', texte: 'Trouver l\'autre réactif : un oxydant réagit avec le réducteur de l\'autre couple', types: ['savoir'], source: 'série 3 · L\'autre réactif' },
          { id: 'c7', texte: 'Choisir le bon couple quand un réactif appartient à deux couples (H₂O₂ avec MnO₄⁻, avec Fe²⁺)', types: ['reflexe'], source: 'série 3 · Le bon couple (OX.DEUX_COUPLES)' },
          { id: 'c8', texte: 'Écrire l\'équation de la réaction entre MnO₄⁻ et Fe²⁺ (exercice-type, démarche)', types: ['methode'], source: 'fiche_3 · exemple ; À retenir 3' },
        ],
        cartes: [
          { id: 'ox-3-etapes', type: 'methode', competence: 'c1', statut: 'nouvelle', faces: [
            { q: `<p>Équation de la réaction entre ${Ox(1)} et ${Red(2)} : les 3 étapes, dans l'ordre ?</p>`,
              r: `<ol><li><b>Entourer les réactifs</b> dans les couples, puis écrire les deux demi-équations dans le sens de la réaction.</li><li>Les <b>multiplier</b> pour qu'elles échangent le même nombre d'électrons.</li><li>Les <b>additionner</b>, puis simplifier les ${E}, ${HP} et ${EAU} présents des deux côtés.</li></ol>` }] },
          { id: 'ox-3-sens', type: 'savoir', competence: 'c2', statut: 'nouvelle', faces: [
            { q: `<p>Réaction entre ${Ox(1)} et ${Red(2)} : dans quel sens écris-tu chaque demi-équation ?</p>`,
              r: `<p>Le <b>réactif à gauche</b> du signe = :</p>${formule(`${Ox(1)} + n<sub>1</sub> ${E} = ${Red(1)}<br>${Red(2)} = ${Ox(2)} + n<sub>2</sub> ${E}`)}<p>Toujours le signe = : la flèche est réservée à l'équation de la réaction.</p>` }] },
          { id: 'ox-3-multiplier', type: 'methode', competence: 'c3', statut: 'nouvelle', faces: [
            { q: '<p>Une demi-équation échange 2 électrons, l\'autre 3. Par combien multiplies-tu chacune ?</p><small>Démarche</small>',
              r: '<ol><li>Chercher le <b>plus petit multiple commun</b> de 2 et 3 : <b>6</b>.</li><li>Multiplier la première par <b>3</b> et la seconde par <b>2</b> : 6 électrons chacune.</li></ol><p>Avec 5 et 1 : 1 × la première, 5 × la seconde.</p>' }] },
          { id: 'ox-3-tout', type: 'reflexe', competence: 'c4', statut: 'nouvelle', faces: [
            { q: `<p>Tu multiplies par 5 la demi-équation ${Fe2} = ${Fe3} + ${E}. Qu'est-ce que tu multiplies ?</p>`,
              r: `<p><b>Toute</b> la demi-équation, pas seulement une espèce :</p>${formule(`${n(5, Fe2)} = ${n(5, Fe3)} + ${n(5, E)}`)}` }] },
          { id: 'ox-3-electrons', type: 'reflexe', competence: 'c4', statut: 'nouvelle', faces: [
            { q: '<p>Ton équation de réaction contient encore des électrons. Que fais-tu ?</p>',
              r: '<p>Il n\'y a <b>jamais d\'électrons</b> dans l\'équation d\'une réaction : tous ceux que cède le réducteur sont captés par l\'oxydant.</p><p>Égalise les électrons (multiplicateurs), puis additionne : ils se simplifient.</p>' }] },
          { id: 'ox-3-simplifier', type: 'methode', competence: 'c5', statut: 'nouvelle', faces: [
            { q: `<p>Après l'addition des deux demi-équations : ${n(16, HP)} à gauche, ${n(10, HP)} à droite. Que fais-tu ?</p>`,
              r: `<p>Simplifier : retirer ${n(10, HP)} de chaque côté. Il en reste <b>${n(6, HP)} à gauche</b>.</p><p>Même chose pour ${EAU} s'il figure des deux côtés.</p>` }] },
          { id: 'ox-3-autre', type: 'savoir', competence: 'c6', statut: 'nouvelle', faces: [
            { q: `<p>${MnO4} réagit avec une espèce du couple ${Fe3} / ${Fe2}. Laquelle ? Pourquoi ?</p>`,
              r: `<p><b>${Fe2}</b> : ${MnO4} est un oxydant, il réagit avec le <b>réducteur</b> de l'autre couple (écrit en second).</p><p>${Fe3} est un oxydant, comme ${MnO4} : ils ne réagissent pas ensemble.</p>` }] },
          { id: 'ox-3-boncouple', type: 'reflexe', competence: 'c7', statut: 'nouvelle', faces: [
            { q: `<p>${H2O2} appartient à deux couples : ${H2O2} / ${EAU} et ${O2} / ${H2O2}. Il réagit avec ${MnO4}. Quel couple utilises-tu ?</p>`,
              r: `<p><b>${O2} / ${H2O2}</b> : ${MnO4} est un oxydant, il réagit avec un <b>réducteur</b>. ${H2O2} est le réducteur de ce couple (écrit en second).</p><p>Dans ${H2O2} / ${EAU}, ${H2O2} est l'oxydant : ce couple ne sert pas.</p>` }] },
          { id: 'ox-3-mno4fe', type: 'methode', competence: 'c8', statut: 'nouvelle', faces: [
            { q: `<p>Écris l'équation de la réaction entre ${MnO4} et ${Fe2}. Couples : ${MnO4} / ${Mn2} et ${Fe3} / ${Fe2}.</p><small>Démarche</small>`,
              r: `<ol><li>${MnO4} + ${n(8, HP)} + ${n(5, E)} = ${Mn2} + ${n(4, EAU)}<br>${Fe2} = ${Fe3} + ${E}</li><li>1 × la première, 5 × la seconde.</li><li>Additionner : les ${n(5, E)} se simplifient.</li></ol>${formule(`${MnO4} + ${n(5, Fe2)} + ${n(8, HP)} → ${Mn2} + ${n(5, Fe3)} + ${n(4, EAU)}`)}` }] },
        ] },
    ],
  });
})();
