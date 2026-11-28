/* ============================================================
   Équations en physique (smartphone) — combiner des équations (objet EPM.CO)
   ------------------------------------------------------------
   Famille CO : exprimer une grandeur en fonction d'autres grandeurs qui
   apparaissent dans plusieurs équations (CO1 à CO8). Ce fichier contient :
     - les grandeurs (identifiant → libellé, sens) : un identifiant par sens
       (Ech : champ électrique E, E : énergie ; cl : célérité c, c : concentration…) ;
     - la banque des questions (contenu validé par le professeur) : équations
       en écriture compacte (assets/equations.js), « ! » devant une équation
       inutile, grandeur cherchée, grandeurs permises, forme finale attendue ;
     - les formulaires des chapitres (CO8 : l'élève choisit ses équations) ;
     - un petit calcul littéral sur les monômes (produits de grandeurs élevées
       à des puissances, racines comprises) : tirage de valeurs qui vérifient
       toutes les équations (vérification de chaque étape), résolution détaillée,
       indices, contrôle de la fin (grandeurs permises, plus rien à simplifier).
   API :
     EPM.CO.estCO(comp)                    la compétence est-elle de la famille CO ?
     EPM.CO.choisir(comp, niv, deja)       une question de la compétence (difficulté niv, classe du réglage)
     EPM.CO.question(id)                   question prête pour l'affichage (modules/question-co.js)
     EPM.CO.questions(comp)                questions de la compétence
     EPM.CO.FORMS, EPM.CO.SYM              formulaires, grandeurs
     EPM.CO.cas                            calcul littéral (tests automatiques)
   Ajoute deux équations à la fin de la Découverte (EPM.DECOUVERTE).
   Dépend de : assets/equations.js (EQ), equations.js (EPM.DECOUVERTE).
   ============================================================ */
(function () {
  'use strict';
  const EPM = window.EPM = window.EPM || {};

  /* ---------- Grandeurs : identifiant → [libellé, sens] ; nombres : valeur ---------- */
  const SYM = {
    c: ['c', 'concentration en quantité de matière (mol·L⁻¹)'], n: ['n', 'quantité de matière (mol)'], V: ['V', 'volume (L)'],
    m: ['m', 'masse'], M: ['M', 'masse molaire (g·mol⁻¹)'], N: ['N', 'nombre d’entités'], NA: ['N<sub>A</sub>', 'constante d’Avogadro (mol⁻¹)'],
    rho: ['ρ', 'masse volumique'], Cm: ['C<sub>m</sub>', 'concentration en masse (g·L⁻¹)'], d: ['d', 'distance (m)'], v: ['v', 'vitesse (m·s⁻¹)'],
    Dt: ['Δt', 'durée (s)'], cl: ['c', 'célérité de la lumière dans le vide (m·s⁻¹)'], nI: ['n', 'indice de réfraction'], D: ['D', 'distance (m)'],
    Pp: ['P', 'poids (N)'], g: ['g', 'intensité de la pesanteur (N·kg⁻¹)'], P: ['P', 'puissance (W)'], U: ['U', 'tension (V)'],
    I: ['I', 'intensité du courant (A)'], R: ['R', 'résistance (Ω)'], E: ['E', 'énergie (J)'], hP: ['h', 'constante de Planck (J·s)'],
    nu: ['ν', 'fréquence de la radiation (Hz)'], lambda: ['λ', 'longueur d’onde (m)'], A: ['A', 'absorbance'], k: ['k', 'coefficient (L·mol⁻¹)'],
    f: ['f', 'fréquence (Hz)'], T: ['T', 'période (s)'], a: ['a', 'accélération (m·s⁻²)'], F: ['F', 'force (N)'], q: ['q', 'charge électrique (C)'],
    Ech: ['E', 'champ électrique (V·m⁻¹)'], Aa: ['A', 'activité (Bq)'], lam: ['λ', 'constante radioactive (s⁻¹)'], tdemi: ['t<sub>½</sub>', 'demi-vie (s)'],
    gL: ['g<sub>L</sub>', 'intensité de la pesanteur sur la Lune (N·kg⁻¹)'], gT: ['g<sub>T</sub>', 'intensité de la pesanteur sur la Terre (N·kg⁻¹)'],
    Vg: ['V', 'volume de gaz (L)'], Vm: ['V<sub>m</sub>', 'volume molaire (L·mol⁻¹)'], A0: ['A<sub>0</sub>', 'absorbance de la solution de référence'],
    c0: ['c<sub>0</sub>', 'concentration de la solution mère (mol·L⁻¹)'], c1: ['c<sub>1</sub>', 'concentration de la solution fille (mol·L⁻¹)'],
    V0: ['V<sub>0</sub>', 'volume de solution mère (L)'], V1: ['V<sub>1</sub>', 'volume de solution fille (L)'], Ff: ['F', 'facteur de dilution'],
    gam: ['γ', 'grandissement'], ApBp: ['A′B′', 'taille de l’image (m)'], AB: ['AB', 'taille de l’objet (m)'], OA: ['OA', 'position de l’objet (m)'],
    OAp: ['OA′', 'position de l’image (m)'], fp: ['f′', 'distance focale (m)'], G: ['G', 'constante de gravitation (N·m²·kg⁻²)'],
    MT: ['M<sub>T</sub>', 'masse de la Terre (kg)'], RT: ['R<sub>T</sub>', 'rayon de la Terre (m)'], Ma: ['M', 'masse de l’astre (kg)'],
    Ec: ['E<sub>c</sub>', 'énergie cinétique (J)'], Ep: ['E<sub>p</sub>', 'énergie potentielle (J)'], h: ['h', 'hauteur (m)'],
    cA: ['c<sub>A</sub>', 'concentration de la solution titrée (mol·L⁻¹)'], VA: ['V<sub>A</sub>', 'volume de solution titrée (L)'],
    cB: ['c<sub>B</sub>', 'concentration de la solution titrante (mol·L⁻¹)'], VE: ['V<sub>E</sub>', 'volume versé à l’équivalence (L)'],
    nA: ['n<sub>A</sub>', 'quantité de matière titrée (mol)'], Pr: ['P', 'pression (Pa)'], S: ['S', 'aire de la section (m²)'], W: ['W', 'travail (J)'],
    r: ['r', 'rayon de l’orbite (m)'], rr: ['r', 'rapport des poids'], PT: ['P<sub>T</sub>', 'poids sur la Terre (N)'], PL: ['P<sub>L</sub>', 'poids sur la Lune (N)'],
    eta: ['η', 'rendement'], Eu: ['E<sub>u</sub>', 'énergie utile (J)'], Ea: ['E<sub>a</sub>', 'énergie absorbée (J)'],
    Pu: ['P<sub>u</sub>', 'puissance utile (W)'], Pa: ['P<sub>a</sub>', 'puissance absorbée (W)'], Ve: ['V<sub>e</sub>', 'volume d’éthanol (L)'],
    Pg: ['P', 'pression du gaz (Pa)'], Rg: ['R', 'constante des gaz parfaits (J·mol⁻¹·K⁻¹)'], Tk: ['T', 'température (K)'],
    mn: ['m<sub>n</sub>', 'masse d’un noyau (kg)'], e: ['e', 'charge élémentaire (C)'], Gg: ['G', 'grossissement'],
    th: ['θ', 'angle sous lequel on voit l’objet (rad)'], thp: ['θ′', 'angle sous lequel on voit l’image (rad)'],
    AB1: ['A<sub>1</sub>B<sub>1</sub>', 'taille de l’image intermédiaire (m)'], f1: ['f<sub>1</sub>′', 'distance focale de l’objectif (m)'],
    f2: ['f<sub>2</sub>′', 'distance focale de l’oculaire (m)'], x: ['x', 'position (m)'], t: ['t', 'date (s)'], ts: ['t<sub>s</sub>', 'date de sortie (s)'],
    L: ['L', 'longueur (m)'], p: ['p', 'quantité de mouvement (kg·m·s⁻¹)'], tt: ['t', 'titre massique'],
    mNaOH: ['m<sub>NaOH</sub>', 'masse de soude (g)'], msol: ['m<sub>sol</sub>', 'masse de solution (g)'],
    cD: ['c<sub>D</sub>', 'concentration de la solution diluée (mol·L⁻¹)'], VD: ['V<sub>D</sub>', 'volume de solution diluée titrée (L)'],
    cm: ['c', 'capacité thermique massique de l’eau (J·kg⁻¹·K⁻¹)'], dT: ['ΔT', 'élévation de température (K)'], Ppct: ['P', 'pourcentage massique'],
    mA: ['m<sub>A</sub>', 'masse de vitamine C (g)'], mcp: ['m<sub>cp</sub>', 'masse du comprimé (g)'], af: ['a', 'largeur de la fente (m)'],
    thd: ['θ', 'demi-angle de diffraction (rad)'], Lt: ['L', 'largeur de la tache centrale (m)'], b: ['b', 'distance entre les fentes (m)'],
    i: ['i', 'interfrange (m)'], Qe: ['Q', 'charge électrique (C)']
  };
  // nombres écrits dans les équations : libellé et valeur
  const NB = { deux: ['2', 2], quatre: ['4', 4], pi: ['π', Math.PI], ln2: ['ln 2', Math.log(2)] };
  const estNombre = id => id in NB;
  const lab = id => (NB[id] ? NB[id][0] : SYM[id] ? SYM[id][0] : id);
  const g = {};
  Object.keys(SYM).forEach(k => { g[k] = SYM[k][0]; });
  Object.keys(NB).forEach(k => { g[k] = NB[k][0]; });

  /* ---------- Banque des questions (contenu validé) ----------
     [compétence, difficulté, classe, titre, contexte, équations (« ! » : inutile), grandeur cherchée,
      grandeurs permises, forme finale attendue, sens propres à la question (facultatif)] */
  const DATA = [
    /* ---- CO1 : remplacer une grandeur ---- */
    ['CO1', 1, '2de', 'Solution de sulfate de cuivre', 'Une masse m de soluté de masse molaire M est dissoute dans un volume V de solution.', ['c = [n|V]', 'n = [m|M]'], 'c', 'm M V', 'c = [m|M V]'],
    ['CO1', 1, '2de', 'Nombre de molécules', 'Un échantillon de masse m contient N molécules.', ['N = n NA', 'n = [m|M]'], 'N', 'm M NA', 'N = [m NA|M]'],
    ['CO1', 1, '2de', 'Masse volumique', 'Un échantillon de liquide de volume V contient n moles de molécules de masse molaire M.', ['rho = [m|V]', 'm = n M'], 'rho', 'n M V', 'rho = [n M|V]'],
    ['CO1', 1, '2de', 'Concentration en masse', 'Une solution de volume V contient n moles de soluté de masse molaire M.', ['Cm = [m|V]', 'm = n M'], 'Cm', 'n M V', 'Cm = [n M|V]'],
    ['CO1', 1, '2de', 'Lumière dans une fibre optique', 'La lumière parcourt une distance d dans une fibre d’indice n pendant Δt.', ['d = v Dt', 'v = [cl|nI]'], 'd', 'cl nI Dt', 'd = [cl Dt|nI]', { v: 'vitesse de la lumière dans la fibre (m·s⁻¹)' }],
    ['CO1', 1, '2de', 'Écho d’un sonar', 'Un sonar mesure la durée Δt d’un aller-retour du son jusqu’au fond, à la profondeur D.', ['D = [d|deux]', 'd = v Dt'], 'D', 'v Dt', 'D = [v Dt|deux]', { D: 'profondeur (m)', d: 'distance aller-retour (m)', v: 'vitesse du son dans l’eau (m·s⁻¹)' }],
    ['CO1', 1, '2de', 'Poids d’un bloc', 'Un bloc de béton de volume V et de masse volumique ρ.', ['Pp = m g', 'm = rho V'], 'Pp', 'rho V g', 'Pp = rho V g'],
    ['CO1', 2, '2de', 'Puissance d’un conducteur ohmique (U)', 'Un conducteur ohmique de résistance R est soumis à la tension U.', ['P = U I', 'I = [U|R]'], 'P', 'U R', 'P = [U^2|R]'],
    ['CO1', 2, '2de', 'Puissance d’un conducteur ohmique (I)', 'Un conducteur ohmique de résistance R est traversé par le courant I.', ['P = U I', 'U = R I'], 'P', 'R I', 'P = R I^2'],
    ['CO1', 1, '1re', 'Énergie consommée', 'Un appareil fonctionne pendant Δt sous la tension U, traversé par le courant I.', ['E = P Dt', 'P = U I'], 'E', 'U I Dt', 'E = U I Dt'],
    ['CO1', 1, '1re', 'Énergie d’un photon', 'Un photon de longueur d’onde λ dans le vide.', ['E = hP nu', 'nu = [cl|lambda]'], 'E', 'hP cl lambda', 'E = [hP cl|lambda]'],
    ['CO1', 1, '1re', 'Absorbance', 'Une solution colorée contient n moles de soluté dans un volume V.', ['A = k c', 'c = [n|V]'], 'A', 'k n V', 'A = [k n|V]'],
    ['CO1', 3, '1re', 'Célérité d’une onde', 'Une onde périodique de fréquence f et de longueur d’onde λ.', ['v = [lambda|T]', 'T = [1|f]'], 'v', 'lambda f', 'v = lambda f', { v: 'célérité de l’onde (m·s⁻¹)' }],
    ['CO1', 1, 'tle', 'Particule dans un champ électrique', 'Une particule de charge q et de masse m est soumise au champ E (poids négligé).', ['a = [F|m]', 'F = q Ech'], 'a', 'q Ech m', 'a = [q Ech|m]'],
    ['CO1', 2, 'tle', 'Champ dans un condensateur', 'Deux armatures distantes de d sont soumises à la tension U.', ['a = [q Ech|m]', 'Ech = [U|d]'], 'a', 'q U m d', 'a = [q U|m d]'],
    ['CO1', 2, 'tle', 'Activité d’un échantillon', 'Un échantillon contient N noyaux radioactifs de demi-vie t½.', ['Aa = lam N', 'lam = [ln2|tdemi]'], 'Aa', 'N tdemi', 'Aa = [ln2 N|tdemi]'],

    /* ---- CO2 : isoler pour remplacer ---- */
    ['CO2', 1, '2de', 'Préparer une solution', 'On veut préparer un volume V de solution de concentration c, avec un soluté de masse molaire M.', ['c = [n|V]', 'n = [m|M]'], 'm', 'c V M', 'm = c V M'],
    ['CO2', 2, '2de', 'Volume de solution', 'On dissout une masse m de soluté de masse molaire M pour obtenir une concentration c.', ['c = [n|V]', 'n = [m|M]'], 'V', 'm M c', 'V = [m|M c]'],
    ['CO2', 2, '2de', 'Masse d’un échantillon', 'Un échantillon contient N atomes de masse molaire M.', ['N = n NA', 'n = [m|M]'], 'm', 'N M NA', 'm = [N M|NA]'],
    ['CO2', 2, '2de', 'Volume d’un liquide', 'On prélève n moles d’éthanol, de masse molaire M et de masse volumique ρ.', ['rho = [m|V]', 'n = [m|M]'], 'V', 'n M rho', 'V = [n M|rho]'],
    ['CO2', 2, '2de', 'Profondeur par écho', 'L’ultrason fait l’aller-retour jusqu’à l’obstacle (distance D) en Δt.', ['v = [d|Dt]', 'd = deux D'], 'D', 'v Dt', 'D = [v Dt|deux]', { d: 'distance aller-retour (m)', v: 'vitesse de l’ultrason (m·s⁻¹)' }],
    ['CO2', 2, '2de', 'Volume d’un bloc', 'Un bloc de masse volumique ρ a un poids P.', ['Pp = m g', 'm = rho V'], 'V', 'Pp rho g', 'V = [Pp|rho g]'],
    ['CO2', 3, '2de', 'Résistance d’une lampe', 'Une lampe de puissance P fonctionne sous la tension U (on la modélise par une résistance R).', ['U = R I', 'P = U I'], 'R', 'U P', 'R = [U^2|P]'],
    ['CO2', 3, '2de', 'Durée de traversée', 'La lumière traverse une épaisseur d de verre d’indice n.', ['nI = [cl|v]', 'v = [d|Dt]'], 'Dt', 'd nI cl', 'Dt = [nI d|cl]', { v: 'vitesse de la lumière dans le verre (m·s⁻¹)', d: 'épaisseur de verre (m)' }],
    ['CO2', 1, '2de', 'Masse volumique d’une roche lunaire', 'Une roche lunaire de volume V a un poids P sur la Lune, où l’intensité de la pesanteur vaut g_L.', ['Pp = m gL', 'rho = [m|V]'], 'rho', 'Pp gL V', 'rho = [Pp|gL V]'],
    ['CO2', 2, '1re', 'Longueur d’onde', 'Une onde de célérité v et de fréquence f.', ['f = [1|T]', 'v = [lambda|T]'], 'lambda', 'v f', 'lambda = [v|f]', { v: 'célérité de l’onde (m·s⁻¹)' }],
    ['CO2', 3, '1re', 'Longueur d’onde d’un photon', 'Un photon d’énergie E.', ['E = hP nu', 'lambda = [cl|nu]'], 'lambda', 'hP cl E', 'lambda = [hP cl|E]'],
    ['CO2', 2, '1re', 'Intensité dans un appareil', 'Un appareil consomme l’énergie E en Δt sous la tension U.', ['E = P Dt', 'P = U I'], 'I', 'E U Dt', 'I = [E|U Dt]'],
    ['CO2', 2, '1re', 'Masse d’un gaz', 'Un volume V de gaz (volume molaire V_m) de masse molaire M.', ['n = [Vg|Vm]', 'n = [m|M]'], 'm', 'Vg Vm M', 'm = [Vg M|Vm]'],
    ['CO2', 3, '1re', 'Dosage par étalonnage', 'Une solution de concentration c_0 a une absorbance A_0 ; l’absorbance d’une solution inconnue vaut A.', ['A = k c', 'A0 = k c0'], 'c', 'A A0 c0', 'c = [c0 A|A0]', { c0: 'concentration de la solution de référence (mol·L⁻¹)', c: 'concentration de la solution inconnue (mol·L⁻¹)' }],
    ['CO2', 2, '1re', 'Taille d’une image', 'Une lentille donne d’un objet AB une image A′B′ ; on connaît OA et OA′.', ['gam = [ApBp|AB]', 'gam = [OAp|OA]'], 'ApBp', 'AB OA OAp', 'ApBp = [AB OAp|OA]'],
    ['CO2', 2, 'tle', 'Tension d’accélération', 'On veut donner l’accélération a à une particule (charge q, masse m) entre deux armatures distantes de d.', ['a = [q Ech|m]', 'Ech = [U|d]'], 'U', 'a m d q', 'U = [m a d|q]'],

    /* ---- CO3 : remplacer puis simplifier ---- */
    ['CO3', 2, '2de', 'Pesanteur à la surface de la Terre', 'Le poids d’un objet de masse m est la force d’attraction de la Terre (masse M_T, rayon R_T).', ['Pp = m g', 'Pp = [G MT m|RT^2]'], 'g', 'G MT RT', 'g = [G MT|RT^2]'],
    ['CO3', 2, '2de', 'Dilution', 'On dilue F fois une solution mère (c_0, V_0) : la solution fille a le volume V_1 = F V_0.', ['c0 V0 = c1 V1', 'V1 = Ff V0'], 'c1', 'c0 Ff', 'c1 = [c0|Ff]'],
    ['CO3', 3, '2de', 'Facteur de dilution', 'Une dilution de facteur F fait passer de la concentration c_0 à c_1.', ['Ff = [c0|c1]', 'c0 V0 = c1 V1'], 'Ff', 'V0 V1', 'Ff = [V1|V0]'],
    ['CO3', 3, '2de', 'Masse de la Terre', 'Le poids d’un objet de masse m est la force d’attraction de la Terre (masse M_T, rayon R_T).', ['Pp = m g', 'Pp = [G MT m|RT^2]'], 'MT', 'g RT G', 'MT = [g RT^2|G]'],
    ['CO3', 2, '1re', 'Hauteur de chute', 'Une bille lâchée sans vitesse tombe de h ; son énergie cinétique finale vaut m g h.', ['Ec = m g h', 'Ec = [1|deux] m v^2'], 'h', 'v g', 'h = [v^2|deux g]'],
    ['CO3', 2, '1re', 'Titrage', 'On titre un volume V_A d’acide par une solution de concentration c_B ; équivalence pour V_E.', ['cA VA = cB VE', 'cA = [nA|VA]'], 'nA', 'cB VE', 'nA = cB VE'],
    ['CO3', 3, '1re', 'Puissance d’un conducteur ohmique', 'Un conducteur ohmique de résistance R sous la tension U.', ['P = R I^2', 'I = [U|R]'], 'P', 'U R', 'P = [U^2|R]'],
    ['CO3', 2, '1re', 'Pression au fond d’un récipient', 'Une colonne de liquide (masse volumique ρ, hauteur h, section S) appuie sur le fond avec la force F.', ['Pr = [F|S]', 'F = rho S h g'], 'Pr', 'rho g h', 'Pr = rho g h'],
    ['CO3', 1, 'tle', 'Travail de la force électrique', 'Une charge q traverse un condensateur (armatures distantes de d, tension U).', ['W = F d', 'F = [q U|d]'], 'W', 'q U', 'W = q U'],
    ['CO3', 1, 'tle', 'Accélération d’un satellite', 'Un satellite de masse m est à la distance r du centre de la Terre (masse M).', ['a = [F|m]', 'F = [G Ma m|r^2]'], 'a', 'G Ma r', 'a = [G Ma|r^2]', { Ma: 'masse de la Terre (kg)', r: 'distance au centre de la Terre (m)' }],
    ['CO3', 3, 'tle', 'Accélération d’un mouvement circulaire', 'Un satellite parcourt un cercle de rayon r en une période T.', ['a = [v^2|r]', 'v = [deux pi r|T]'], 'a', 'r T', 'a = [quatre pi^2 r|T^2]'],
    ['CO3', 1, 'tle', 'Champ électrique dans un condensateur', 'Une charge q subit la force F entre deux armatures distantes de d, sous la tension U.', ['Ech = [F|q]', 'F = [q U|d]'], 'Ech', 'U d', 'Ech = [U|d]'],

    /* ---- CO4 : trois équations ---- */
    ['CO4', 2, '1re', 'Concentration en masse et en quantité', 'Une solution de volume V contient n moles de soluté de masse molaire M.', ['Cm = [m|V]', 'm = n M', 'n = c V'], 'Cm', 'c M', 'Cm = c M'],
    ['CO4', 2, '1re', 'Solution d’éthanol', 'On dissout un volume V_e d’éthanol (masse volumique ρ, masse molaire M) pour obtenir un volume V de solution.', ['c = [n|V]', 'n = [m|M]', 'm = rho Ve'], 'c', 'rho Ve M V', 'c = [rho Ve|M V]', { V: 'volume de solution (L)' }],
    ['CO4', 1, '1re', 'Poids sur la Terre et sur la Lune', 'Un même objet de masse m a les poids P_T et P_L.', ['rr = [PT|PL]', 'PT = m gT', 'PL = m gL'], 'rr', 'gT gL', 'rr = [gT|gL]'],
    ['CO4', 1, '1re', 'Rendement', 'Pendant Δt, un appareil reçoit E_a et fournit E_u.', ['eta = [Eu|Ea]', 'Eu = Pu Dt', 'Ea = Pa Dt'], 'eta', 'Pu Pa', 'eta = [Pu|Pa]'],
    ['CO4', 1, '1re', 'Effet Joule', 'Un conducteur ohmique de résistance R est traversé par I pendant Δt.', ['E = P Dt', 'P = U I', 'U = R I'], 'E', 'R I Dt', 'E = R I^2 Dt'],
    ['CO4', 2, '1re', 'Chute libre', 'Une bille lâchée sans vitesse de la hauteur h : son énergie potentielle devient énergie cinétique.', ['Ec = Ep', 'Ec = [1|deux] m v^2', 'Ep = m g h'], 'h', 'v g', 'h = [v^2|deux g]'],
    ['CO4', 3, '1re', 'Longueur d’onde mesurée', 'Une onde de fréquence f parcourt d en Δt.', ['v = [lambda|T]', 'T = [1|f]', 'v = [d|Dt]'], 'lambda', 'd Dt f', 'lambda = [d|f Dt]', { v: 'célérité de l’onde (m·s⁻¹)' }],
    ['CO4', 3, '1re', 'Masse d’acide titrée', 'Un volume V_A d’acide est titré par c_B (équivalence V_E) ; on cherche la masse d’acide dans un volume V.', ['m = Cm V', 'Cm = cA M', 'cA VA = cB VE'], 'm', 'cB VE VA M V', 'm = [cB VE M V|VA]'],
    ['CO4', 2, '1re', 'Solution fille', 'On prélève V_0 de solution mère (c_0), qu’on dilue F fois.', ['c1 = [n|V1]', 'n = c0 V0', 'V1 = Ff V0'], 'c1', 'c0 Ff', 'c1 = [c0|Ff]'],
    ['CO4', 1, 'tle', 'Accélération dans un condensateur', 'Une particule (q, m) entre deux armatures distantes de d, sous la tension U.', ['a = [F|m]', 'F = q Ech', 'Ech = [U|d]'], 'a', 'q U m d', 'a = [q U|m d]'],
    ['CO4', 2, 'tle', 'Travail entre les armatures', 'Une charge q va d’une armature à l’autre (distance d, tension U).', ['W = F d', 'F = q Ech', 'Ech = [U|d]'], 'W', 'q U', 'W = q U'],
    ['CO4', 3, 'tle', 'Masse volumique d’un gaz', 'Un gaz parfait de masse molaire M, à la pression P et à la température T.', ['Pg V = n Rg Tk', 'n = [m|M]', 'rho = [m|V]'], 'rho', 'Pg M Rg Tk', 'rho = [Pg M|Rg Tk]', { V: 'volume du gaz (m³)', rho: 'masse volumique du gaz' }],
    ['CO4', 2, 'tle', 'Activité d’un échantillon', 'Un échantillon radioactif de masse m, de noyaux de masse m_n, de demi-vie t½.', ['Aa = lam N', 'lam = [ln2|tdemi]', 'N = [m|mn]'], 'Aa', 'm mn tdemi', 'Aa = [ln2 m|tdemi mn]', { N: 'nombre de noyaux' }],
    ['CO4', 2, 'tle', 'Photon émis par un électron', 'Un électron accéléré sous la tension U donne toute son énergie à un photon.', ['E = hP nu', 'nu = [cl|lambda]', 'E = e U'], 'lambda', 'hP cl e U', 'lambda = [hP cl|e U]'],
    ['CO4', 2, '1re', 'Pression dans un liquide', 'Une colonne de liquide (masse volumique ρ, hauteur h, section S) a le poids F.', ['Pr = [F|S]', 'F = m g', 'm = rho S h'], 'Pr', 'rho g h', 'Pr = rho g h', { F: 'poids de la colonne de liquide (N)' }],
    ['CO4', 2, 'tle', 'Grossissement d’une lunette', 'Une lunette afocale donne d’un objet vu sous l’angle θ une image vue sous θ′ ; image intermédiaire de taille A_1B_1.', ['Gg = [thp|th]', 'th = [AB1|f1]', 'thp = [AB1|f2]'], 'Gg', 'f1 f2', 'Gg = [f1|f2]'],

    /* ---- CO5 : repérer l'équation inutile ---- */
    ['CO5', 1, '1re', 'Préparer une solution', 'On veut un volume V de solution de concentration c (masse molaire M du soluté).', ['c = [n|V]', 'n = [m|M]', '!N = n NA'], 'm', 'c V M', 'm = c V M'],
    ['CO5', 1, '1re', 'Puissance dissipée', 'Un conducteur ohmique de résistance R est traversé par I.', ['P = U I', 'U = R I', '!E = P Dt'], 'P', 'R I', 'P = R I^2'],
    ['CO5', 1, '1re', 'Écho', 'Un ultrason fait l’aller-retour jusqu’à un obstacle à la distance D en Δt.', ['v = [d|Dt]', 'd = deux D', '!f = [1|T]'], 'D', 'v Dt', 'D = [v Dt|deux]', { d: 'distance aller-retour (m)', v: 'vitesse de l’ultrason (m·s⁻¹)', f: 'fréquence de l’ultrason (Hz)' }],
    ['CO5', 2, '1re', 'Chute d’une pierre', 'Une pierre lâchée sans vitesse de la hauteur h.', ['Ec = Ep', 'Ec = [1|deux] m v^2', 'Ep = m g h', '!Pp = m g'], 'h', 'v g', 'h = [v^2|deux g]'],
    ['CO5', 2, '1re', 'Titrage', 'On titre V_A d’acide par c_B ; équivalence pour V_E.', ['cA VA = cB VE', 'nA = cA VA', '!Cm = cA M'], 'nA', 'cB VE', 'nA = cB VE'],
    ['CO5', 1, '1re', 'Énergie d’un photon', 'Un photon de longueur d’onde λ.', ['E = hP nu', 'nu = [cl|lambda]', '!v = [d|Dt]'], 'E', 'hP cl lambda', 'E = [hP cl|lambda]'],
    ['CO5', 2, '1re', 'Taille d’une image', 'Une lentille de distance focale f′ donne de AB une image A′B′.', ['gam = [ApBp|AB]', 'gam = [OAp|OA]', '![1|OAp] - [1|OA] = [1|fp]'], 'ApBp', 'AB OA OAp', 'ApBp = [AB OAp|OA]'],
    ['CO5', 2, '1re', 'Volume d’un liquide', 'On prélève n moles d’un liquide (masse molaire M, masse volumique ρ).', ['rho = [m|V]', 'n = [m|M]', '!N = n NA'], 'V', 'n M rho', 'V = [n M|rho]'],
    ['CO5', 3, '1re', 'Énergie électrique', 'Un appareil fonctionne pendant Δt sous U, traversé par I.', ['E = P Dt', 'P = U I', '!U = R I'], 'E', 'U I Dt', 'E = U I Dt'],
    ['CO5', 3, '1re', 'Longueur d’onde', 'Une onde de célérité v et de fréquence f.', ['lambda = v T', 'f = [1|T]', '!v = [d|Dt]'], 'lambda', 'v f', 'lambda = [v|f]', { v: 'célérité de l’onde (m·s⁻¹)' }],
    ['CO5', 1, 'tle', 'Accélération dans un condensateur', 'Une particule (q, m) entre deux armatures distantes de d, sous U ; poids négligé.', ['a = [q Ech|m]', 'Ech = [U|d]', '!Pp = m g'], 'a', 'q U m d', 'a = [q U|m d]'],
    ['CO5', 2, 'tle', 'Masse d’un gaz', 'Un gaz parfait de masse molaire M occupe V à P et T.', ['Pg V = n Rg Tk', 'n = [m|M]', '!N = n NA'], 'm', 'Pg V M Rg Tk', 'm = [Pg V M|Rg Tk]', { V: 'volume du gaz (m³)' }],

    /* ---- CO6 : remplacer dans un carré ou une racine ---- */
    ['CO6', 1, '1re', 'Énergie cinétique d’un coureur', 'Un coureur de masse m parcourt d en Δt à vitesse constante.', ['Ec = [1|deux] m v^2', 'v = [d|Dt]'], 'Ec', 'm d Dt', 'Ec = [m d^2|deux Dt^2]'],
    ['CO6', 2, '1re', 'Vitesse en fin de chute', 'Une bille lâchée sans vitesse de la hauteur h ; son énergie cinétique finale vaut m g h.', ['Ec = m g h', 'Ec = [1|deux] m v^2'], 'v', 'g h', 'v = sqrt(deux g h)'],
    ['CO6', 2, '1re', 'Intensité dans un conducteur', 'Un conducteur ohmique de résistance R dissipe la puissance P.', ['P = U I', 'U = R I'], 'I', 'P R', 'I = sqrt([P|R])'],
    ['CO6', 2, '1re', 'Tension aux bornes d’un conducteur', 'Un conducteur ohmique de résistance R dissipe la puissance P.', ['P = U I', 'I = [U|R]'], 'U', 'P R', 'U = sqrt(P R)'],
    ['CO6', 3, '1re', 'Chute libre', 'Un objet lâché sans vitesse tombe pendant t.', ['v^2 = deux g h', 'h = [1|deux] g t^2'], 'v', 'g t', 'v = g t', { h: 'hauteur de chute (m)', t: 'durée de la chute (s)' }],
    ['CO6', 3, '1re', 'Rayon de la Terre', 'Le poids d’un objet de masse m est la force d’attraction de la Terre (masse M_T).', ['Pp = m g', 'Pp = [G MT m|RT^2]'], 'RT', 'G MT g', 'RT = sqrt([G MT|g])'],
    ['CO6', 2, 'tle', 'Électron accéléré', 'Un électron (charge e, masse m), parti au repos, est accéléré sous la tension U.', ['Ec = e U', 'Ec = [1|deux] m v^2'], 'v', 'e U m', 'v = sqrt([deux e U|m])'],
    ['CO6', 2, 'tle', 'Vitesse d’un satellite', 'Satellite en orbite circulaire de rayon r autour d’un astre de masse M.', ['a = [v^2|r]', 'a = [G Ma|r^2]'], 'v', 'G Ma r', 'v = sqrt([G Ma|r])'],
    ['CO6', 3, 'tle', 'Période d’un satellite', 'Satellite en orbite circulaire de rayon r autour d’un astre de masse M.', ['T = [deux pi r|v]', 'v = sqrt([G Ma|r])'], 'T', 'G Ma r', 'T = deux pi sqrt([r^3|G Ma])'],
    ['CO6', 2, 'tle', 'Durée de traversée d’un condensateur', 'Une particule (q, m) part au repos et parcourt x dans le champ E.', ['x = [1|deux] a t^2', 'a = [q Ech|m]'], 't', 'x m q Ech', 't = sqrt([deux m x|q Ech])', { x: 'distance parcourue (m)', t: 'durée du parcours (s)' }],
    ['CO6', 3, 'tle', 'Vitesse de sortie (accélération uniforme)', 'Partie au repos, la particule parcourt L avec l’accélération a ; elle sort à t_s.', ['v = a ts', 'ts = sqrt([deux L|a])'], 'v', 'a L', 'v = sqrt(deux a L)', { L: 'distance parcourue (m)', v: 'vitesse de sortie (m·s⁻¹)' }],
    ['CO6', 2, 'tle', 'Quantité de mouvement', 'Une particule de masse m et de quantité de mouvement p.', ['Ec = [1|deux] m v^2', 'p = m v'], 'Ec', 'p m', 'Ec = [p^2|deux m]'],

    /* ---- CO7 : jusqu'à quatre équations ---- */
    ['CO7', 2, 'tle', 'Titre massique (solution commerciale)', 'Un volume V de Destop (masse volumique ρ) contient de la soude de concentration c (masse molaire M).', ['tt = [mNaOH|msol]', 'mNaOH = Cm V', 'msol = rho V', 'Cm = c M'], 'tt', 'c M rho', 'tt = [c M|rho]', { rho: 'masse volumique du Destop (g·L⁻¹)', V: 'volume de Destop (L)' }],
    ['CO7', 3, 'tle', 'Titre massique (titrage pH-métrique)', 'La solution commerciale est diluée F fois ; on titre V_D de solution diluée par c_A, équivalence pour V_E.', ['tt = [Cm|rho]', 'Cm = c0 M', 'c0 = Ff cD', 'cD VD = cA VE'], 'tt', 'Ff cA VE M rho VD', 'tt = [Ff cA VE M|rho VD]', { c0: 'concentration de la solution commerciale (mol·L⁻¹)', cA: 'concentration de l’acide titrant (mol·L⁻¹)', Cm: 'concentration en masse de la solution commerciale (g·L⁻¹)', rho: 'masse volumique de la solution commerciale (g·L⁻¹)' }],
    ['CO7', 3, 'tle', 'Vitesse de sortie d’un condensateur', 'Accélération dans un condensateur : particule (q, m) au repos, armatures distantes de L, tension U.', ['v = [q Ech|m] t', 't = sqrt([deux m L|q Ech])', 'Ech = [U|L]'], 'v', 'q U m', 'v = sqrt([deux q U|m])', { L: 'distance entre les armatures (m)', t: 'date de sortie (s)', v: 'vitesse de sortie (m·s⁻¹)' }],
    ['CO7', 3, 'tle', 'Vitesse de sortie (par l’accélération)', 'Particule (q, m) au repos, armatures distantes de d, tension U.', ['v^2 = deux a d', 'a = [F|m]', 'F = q Ech', 'Ech = [U|d]'], 'v', 'q U m', 'v = sqrt([deux q U|m])', { v: 'vitesse de sortie (m·s⁻¹)', d: 'distance entre les armatures (m)' }],
    ['CO7', 2, 'tle', 'Chauffe-eau', 'Un chauffe-eau de puissance P et de rendement η chauffe une masse m d’eau (capacité c) de ΔT.', ['eta = [Eu|Ea]', 'Eu = m cm dT', 'Ea = P Dt'], 'Dt', 'm cm dT eta P', 'Dt = [m cm dT|eta P]', { m: 'masse d’eau (kg)', Dt: 'durée de chauffage (s)' }],
    ['CO7', 3, 'tle', 'Activité d’une source', 'Une source contient une masse m d’un radionucléide de masse molaire M et de demi-vie t½.', ['Aa = lam N', 'lam = [ln2|tdemi]', 'N = n NA', 'n = [m|M]'], 'Aa', 'm NA tdemi M', 'Aa = [ln2 m NA|tdemi M]', { N: 'nombre de noyaux' }],
    ['CO7', 3, 'tle', 'Masse d’une planète', 'Un satellite décrit une orbite circulaire de rayon r en une période T.', ['T = [deux pi r|v]', 'a = [v^2|r]', 'a = [G Ma|r^2]'], 'Ma', 'T r G', 'Ma = [quatre pi^2 r^3|G T^2]', { Ma: 'masse de la planète (kg)' }],
    ['CO7', 2, 'tle', 'Comprimé de vitamine C', 'Un comprimé de masse m_cp est dissous ; on titre la vitamine C par c_B (réaction mole à mole), équivalence pour V_E.', ['Ppct = [mA|mcp]', 'mA = nA M', 'nA = cB VE'], 'Ppct', 'cB VE M mcp', 'Ppct = [cB VE M|mcp]', { nA: 'quantité de vitamine C (mol)', M: 'masse molaire de la vitamine C (g·mol⁻¹)' }],
    ['CO7', 2, 'tle', 'Largeur d’une fente', 'Diffraction par une fente de largeur a, tache centrale de largeur L sur un écran à la distance D ; source de fréquence ν.', ['thd = [lambda|af]', 'thd = [Lt|deux D]', 'lambda = [cl|nu]'], 'af', 'cl D nu Lt', 'af = [deux cl D|nu Lt]', { D: 'distance entre la fente et l’écran (m)' }],
    ['CO7', 3, 'tle', 'Électron et photon', 'Un électron accéléré sous U donne toute son énergie à un photon.', ['E = hP nu', 'nu = [cl|lambda]', 'E = e U', '!Ec = [1|deux] m v^2'], 'lambda', 'hP cl e U', 'lambda = [hP cl|e U]', { m: 'masse de l’électron (kg)', v: 'vitesse de l’électron (m·s⁻¹)' }],
    ['CO7', 2, 'tle', 'Masse volumique d’un gaz', 'Gaz parfait de masse molaire M à P et T.', ['Pg V = n Rg Tk', 'n = [m|M]', 'rho = [m|V]', '!N = n NA'], 'rho', 'Pg M Rg Tk', 'rho = [Pg M|Rg Tk]', { V: 'volume du gaz (m³)', rho: 'masse volumique du gaz' }],
    ['CO7', 3, 'tle', 'Interfrange', 'Fentes d’Young distantes de b, écran à D ; lumière de fréquence f.', ['i = [lambda D|b]', 'lambda = cl T', 'T = [1|f]'], 'i', 'cl D b f', 'i = [cl D|b f]', { D: 'distance entre les fentes et l’écran (m)', T: 'période de l’onde lumineuse (s)', f: 'fréquence de la lumière (Hz)' }],

    /* ---- CO8 : choisir ses équations (formulaire du chapitre : nom, formules utiles, renommage des grandeurs) ---- */
    ['CO8', 1, '1re', 'Préparer une solution', 'On veut un volume V de solution de concentration c (masse molaire M du soluté).', { form: 'SOL', utiles: [0, 2] }, 'm', 'c V M', 'm = c V M'],
    ['CO8', 1, '1re', 'Nombre de molécules', 'Un échantillon de masse m (masse molaire M).', { form: 'SOL', utiles: [3, 2] }, 'N', 'm M NA', 'N = [m NA|M]'],
    ['CO8', 2, '1re', 'Concentration en masse', 'Solution de concentration c d’un soluté de masse molaire M.', { form: 'SOL', utiles: [1, 2, 0] }, 'Cm', 'c M', 'Cm = c M'],
    ['CO8', 2, '1re', 'Intensité dans un conducteur', 'Un conducteur ohmique de résistance R dissipe la puissance P.', { form: 'ELEC', utiles: [0, 1] }, 'I', 'P R', 'I = sqrt([P|R])'],
    ['CO8', 1, '1re', 'Énergie consommée', 'Un appareil fonctionne Δt sous U, traversé par I.', { form: 'ELEC', utiles: [2, 1] }, 'E', 'U I Dt', 'E = U I Dt'],
    ['CO8', 1, '1re', 'Longueur d’onde', 'Une onde de célérité v et de fréquence f.', { form: 'ONDES', utiles: [2, 1] }, 'lambda', 'v f', 'lambda = [v|f]'],
    ['CO8', 2, '1re', 'Énergie d’un photon', 'Un photon de longueur d’onde λ.', { form: 'ONDES', utiles: [3, 4] }, 'E', 'hP cl lambda', 'E = [hP cl|lambda]'],
    ['CO8', 2, 'tle', 'Accélération dans un condensateur', 'Particule (q, m), armatures distantes de d, tension U, poids négligé.', { form: 'CHAMP', utiles: [2, 0, 1] }, 'a', 'q U m d', 'a = [q U|m d]'],
    ['CO8', 3, 'tle', 'Vitesse de sortie', 'Particule (q, m) partie au repos, accélérée sous la tension U.', { form: 'CHAMP', utiles: [5, 6, 7] }, 'v', 'q U m', 'v = sqrt([deux q U|m])'],
    ['CO8', 3, 'tle', 'Vitesse d’un satellite', 'Orbite circulaire de rayon r autour d’un astre de masse M.', { form: 'GRAV', utiles: [2, 1, 0] }, 'v', 'G Ma r', 'v = sqrt([G Ma|r])'],
    ['CO8', 3, 'tle', 'Masse d’une planète', 'Un satellite parcourt son orbite circulaire (rayon r) en T.', { form: 'GRAV', utiles: [3, 2, 1, 0] }, 'Ma', 'T r G', 'Ma = [quatre pi^2 r^3|G T^2]'],
    ['CO8', 3, 'tle', 'Titre massique', 'Solution commerciale diluée F fois, titrée (V_D, c_A, V_E) ; masse volumique ρ.', { form: 'TITR', utiles: [3, 2, 1, 0], ren: { c: 'c0', cA: 'cD', VA: 'VD', cB: 'cA' } }, 'tt', 'Ff cA VE M rho VD', 'tt = [Ff cA VE M|rho VD]',
      { c0: 'concentration de la solution commerciale (mol·L⁻¹)', cA: 'concentration de l’acide titrant (mol·L⁻¹)', Cm: 'concentration en masse de la solution commerciale (g·L⁻¹)', rho: 'masse volumique de la solution commerciale (g·L⁻¹)' }],
  ];

  // formulaires des chapitres (CO8) : [écriture compacte, nom de la formule]
  const FORMS = {
    SOL: { titre: 'Solutions et quantité de matière', f: [['c = [n|V]', 'concentration en quantité de matière'], ['Cm = [m|V]', 'concentration en masse'], ['n = [m|M]', 'quantité de matière'],
      ['N = n NA', 'nombre d’entités'], ['rho = [m|V]', 'masse volumique'], ['c0 V0 = c1 V1', 'dilution']] },
    ELEC: { titre: 'Électricité', f: [['U = R I', 'loi d’Ohm'], ['P = U I', 'puissance électrique'], ['E = P Dt', 'énergie électrique'], ['eta = [Pu|Pa]', 'rendement'], ['Qe = I Dt', 'charge électrique']] },
    ONDES: { titre: 'Ondes et lumière', f: [['v = [d|Dt]', 'vitesse de propagation'], ['f = [1|T]', 'fréquence'], ['lambda = v T', 'longueur d’onde'], ['E = hP nu', 'énergie d’un photon'],
      ['nu = [cl|lambda]', 'fréquence d’une radiation'], ['nI = [cl|v]', 'indice de réfraction']] },
    CHAMP: { titre: 'Mouvement dans un champ uniforme', f: [['F = q Ech', 'force électrique'], ['Ech = [U|d]', 'champ dans un condensateur plan'], ['a = [F|m]', 'seconde loi de Newton'],
      ['v = a t', 'vitesse (départ au repos)'], ['x = [1|deux] a t^2', 'position (départ au repos)'], ['Ec = [1|deux] m v^2', 'énergie cinétique'], ['W = q U', 'travail de la force électrique'],
      ['Ec = W', 'théorème de l’énergie cinétique (départ au repos)']] },
    GRAV: { titre: 'Gravitation, mouvement circulaire', f: [['F = [G m Ma|r^2]', 'loi de la gravitation'], ['a = [F|m]', 'seconde loi de Newton'], ['a = [v^2|r]', 'accélération (mouvement circulaire uniforme)'],
      ['v = [deux pi r|T]', 'vitesse sur l’orbite'], ['Pp = m g', 'poids']] },
    TITR: { titre: 'Titrage et titre massique', f: [['cA VA = cB VE', 'équivalence (réaction mole à mole)'], ['c0 = Ff cD', 'dilution de facteur F'], ['Cm = c M', 'concentration en masse'],
      ['tt = [Cm|rho]', 'titre massique'], ['n = c V', 'quantité de matière'], ['m = n M', 'masse']] },
  };

  /* ============================================================
     CALCUL LITTÉRAL SUR LES MONÔMES
     Un membre : { h: { id: exposant }, b: { id: exposant } } (en haut, en bas ;
     exposants positifs, ½ pour une racine), sans simplification entre le haut
     et le bas (la résolution détaillée montre la simplification).
     ============================================================ */
  const ARR = x => Math.round(x * 1e9) / 1e9;
  const ajouter = (o, id, e) => { o[id] = ARR((o[id] || 0) + e); if (!o[id]) delete o[id]; };
  // membre d'après un nœud de l'éditeur ; null si ce n'est pas un monôme (somme, sinus…)
  function membreDe(n) {
    const M = { h: {}, b: {} };
    function voir(x, s, k) {
      if (x.kind === 'simple') {
        for (const it of x.items) {
          if (it.id === 'plus' || it.id === 'minus') return false;
          if (it.id === 'one' || it.id === 'times') continue;
          ajouter(s > 0 ? M.h : M.b, it.id, k * (it.pow || 1));
        }
        return true;
      }
      if (x.kind === 'seq') return x.slots.every(y => voir(y, s, k));
      if (x.kind === 'frac') return voir(x.num, s, k) && voir(x.den, -s, k);
      if (x.kind === 'func') {
        const e = { sqrt: 0.5, sq: 2, cube: 3, pow: x.n }[x.fn];
        return e ? voir(x.inner, s, k * e) : false;
      }
      return false;
    }
    return voir(n, 1, 1) ? M : null;
  }
  const copie = M => ({ h: Object.assign({}, M.h), b: Object.assign({}, M.b) });
  // exposants nets (haut − bas)
  function net(M) { const o = {}; Object.keys(M.h).forEach(k => ajouter(o, k, M.h[k])); Object.keys(M.b).forEach(k => ajouter(o, k, -M.b[k])); return o; }
  const deNet = o => { const M = { h: {}, b: {} }; Object.keys(o).forEach(k => { if (o[k] > 0) M.h[k] = o[k]; else if (o[k] < 0) M.b[k] = -o[k]; }); return M; };
  const ids = M => Object.keys(M.h).concat(Object.keys(M.b));
  const contient = (M, id) => id in M.h || id in M.b;
  // remplace la grandeur X (puissance e) par l'expression E
  function remplacer(M, X, E) {
    const R = copie(M);
    [['h', 'b'], ['b', 'h']].forEach(([ici, la]) => {
      const e = R[ici][X];
      if (!e) return;
      delete R[ici][X];
      Object.keys(E.h).forEach(k => ajouter(R[ici], k, E.h[k] * e));
      Object.keys(E.b).forEach(k => ajouter(R[la], k, E.b[k] * e));
    });
    return R;
  }
  // équation G = D : X isolée → expression (membre net)
  function isoler(G, D, X) {
    const T = net(G), Dn = net(D);
    Object.keys(Dn).forEach(k => ajouter(T, k, -Dn[k]));
    const eX = T[X];
    if (!eX) return null;
    const o = {};
    Object.keys(T).forEach(k => { if (k !== X) o[k] = ARR(-T[k] / eX); });
    return deNet(o);
  }
  // simplification : dans chaque membre (haut et bas), puis facteur commun aux deux membres
  function simplifier(G, D) {
    const a = net(G), b = net(D);
    Object.keys(a).forEach(k => {
      if (!(k in b) || Math.sign(a[k]) !== Math.sign(b[k])) return;
      const m = Math.sign(a[k]) * Math.min(Math.abs(a[k]), Math.abs(b[k]));
      ajouter(a, k, -m); ajouter(b, k, -m);
    });
    return [deNet(a), deNet(b)];
  }
  // écriture compacte d'un membre (2² s'écrit 4 ; les puissances ½ sous une racine)
  function compact(M) {
    function facteurs(o) {
      const ent = [], dem = [];
      Object.keys(o).sort(ordre).forEach(k => {
        let e = o[k];
        if (k === 'deux' && e >= 2 && Number.isInteger(e)) { ent.push(e === 2 ? 'quatre' : 'deux^' + e); return; }
        const n = Math.floor(e + 1e-9), r = ARR(e - n);
        if (r) dem.push(k + (ARR(2 * e) > 1 ? '^' + ARR(2 * e) : ''));
        else if (n) ent.push(k + (n > 1 ? '^' + n : ''));
      });
      return [ent, dem];
    }
    const [hE, hD] = facteurs(M.h), [bE, bD] = facteurs(M.b);
    let rac = '';
    if (hD.length || bD.length) rac = 'sqrt(' + (bD.length ? '[' + (hD.join(' ') || '1') + '|' + bD.join(' ') + ']' : hD.join(' ')) + ')';
    const haut = hE.concat(rac ? [rac] : []).join(' ') || '1';
    return bE.length ? '[' + haut + '|' + bE.join(' ') + ']' : haut;
  }
  // ordre d'écriture : les nombres d'abord
  const RANG_NB = { deux: 0, quatre: 0, ln2: 1, pi: 2 };
  function ordre(a, b) { return ((a in RANG_NB ? RANG_NB[a] : 9) - (b in RANG_NB ? RANG_NB[b] : 9)); }
  // même monôme (2² et 4 confondus)
  function memeNet(A, B) {
    const n = M => { const o = net(M); if (o.quatre) { ajouter(o, 'deux', 2 * o.quatre); delete o.quatre; } return o; };
    const a = n(A), b = n(B);
    const k = new Set(Object.keys(a).concat(Object.keys(b)));
    return [...k].every(x => Math.abs((a[x] || 0) - (b[x] || 0)) < 1e-9);
  }

  /* ============================================================
     QUESTIONS
     ============================================================ */
  const RANG = { '2de': 0, '1re': 1, tle: 2 };
  const estCO = comp => /^CO\d$/.test(comp);
  // équation : écriture compacte → { txt, inutile, G, D (nœuds), mG, mD (membres) }
  function equation(txt, ren) {
    const inutile = txt[0] === '!';
    let t = inutile ? txt.slice(1) : txt;
    if (ren) t = t.replace(/[A-Za-z_][A-Za-z0-9_']*/g, w => (w in ren ? ren[w] : w));
    const q = EQ.lire(t, g);
    return { txt: t, inutile, G: q.left, D: q.right, mG: membreDe(q.left), mD: membreDe(q.right) };
  }
  // grandeurs d'une équation (nombres compris)
  const idsEq = e => {
    const o = new Set();
    (function voir(n) {
      if (!n) return;
      if (n.kind === 'simple') n.items.forEach(it => { if (it.id !== 'one' && it.id !== 'plus' && it.id !== 'minus' && it.id !== 'times') o.add(it.id); });
      else if (n.kind === 'seq') n.slots.forEach(voir);
      else if (n.kind === 'frac') { voir(n.num); voir(n.den); }
      else if (n.kind === 'func') voir(n.inner);
      else if (n.kind === 'sum') n.terms.forEach(x => voir(x.node));
    })({ kind: 'seq', slots: [e.G, e.D] });
    return [...o];
  };

  const LISTE = [];
  const compteur = {};
  DATA.forEach(x => {
    compteur[x[0]] = (compteur[x[0]] || 0) + 1;
    const id = x[0] + '-' + String(compteur[x[0]]).padStart(2, '0');
    const form = Array.isArray(x[5]) ? null : x[5];
    LISTE.push({ id, comp: x[0], diff: x[1], classe: x[2], titre: x[3], ctx: x[4], eqs: form ? null : x[5], form, cible: x[6], avec: x[7].split(' '), forme: x[8], leg: x[9] || {} });
  });
  const PAR_ID = {};
  LISTE.forEach(q => { PAR_ID[q.id] = q; });

  // les équations d'une question (CO8 : les formules utiles du formulaire, renommées)
  function equationsDe(q) {
    if (!q.form) return q.eqs.map(t => equation(t));
    return FORMS[q.form.form].f.map(f => equation(f[0], q.form.ren));
  }

  /* ---------- Tirage de valeurs qui vérifient toutes les équations ----------
     Grandeurs permises : au hasard ; puis chaque équation qui n'a plus qu'une grandeur inconnue
     la donne ; s'il n'y en a pas, une grandeur inconnue (autre que la cherchée) est tirée au hasard. */
  const hasard = () => 0.5 + Math.random() * 4.5;
  function resoudre1(e, X, v) {
    // monôme : X directement
    if (e.mG && e.mD) {
      const E = isoler(e.mG, e.mD, X);
      if (E) { let r = 1; Object.keys(E.h).forEach(k => { r *= Math.pow(v[k], E.h[k]); }); Object.keys(E.b).forEach(k => { r /= Math.pow(v[k], E.b[k]); }); return r; }
    }
    // sinon : dichotomie (positif, puis négatif)
    const f = x => { const w = Object.assign({}, v, { [X]: x }); return EQ.evaluer(e.G, w) - EQ.evaluer(e.D, w); };
    for (const s of [1, -1]) {
      let a = s * 1e-6, fa = f(a);
      for (let k = 1; k <= 60; k++) {
        const b = s * 1e-6 * Math.pow(10, k / 5), fb = f(b);
        if (isFinite(fa) && isFinite(fb) && fa * fb <= 0) {
          let lo = a, hi = b, flo = fa;
          for (let i = 0; i < 200; i++) { const mi = (lo + hi) / 2, fm = f(mi); if (flo * fm <= 0) hi = mi; else { lo = mi; flo = fm; } }
          return (lo + hi) / 2;
        }
        a = b; fa = fb;
      }
    }
    return NaN;
  }
  function valeurs(eqs, cible, avec) {
    for (let essai = 0; essai < 40; essai++) {
      const v = {};
      Object.keys(NB).forEach(k => { v[k] = NB[k][1]; });
      avec.forEach(k => { if (!(k in v)) v[k] = hasard(); });
      const tous = new Set();
      eqs.forEach(e => idsEq(e).forEach(k => tous.add(k)));
      // 1. équations monômes : système linéaire sur les logarithmes (grandeur cherchée en premier :
      //    les grandeurs libres, tirées au hasard, sont des grandeurs intermédiaires)
      const mono = eqs.filter(e => e.mG && e.mD);
      const X = [...tous].filter(k => !(k in v) && mono.some(e => idsEq(e).indexOf(k) >= 0)).sort((a, b) => (b === cible) - (a === cible));
      const col = {};
      X.forEach((k, i) => { col[k] = i; });
      const A = mono.map(e => {
        const T = net(e.mG), Dn = net(e.mD);
        Object.keys(Dn).forEach(k => ajouter(T, k, -Dn[k]));
        const row = X.map(() => 0);
        let rhs = 0;
        Object.keys(T).forEach(k => { if (k in col) row[col[k]] += T[k]; else rhs -= T[k] * Math.log(v[k]); });
        return row.concat([rhs]);
      });
      // élimination de Gauss-Jordan
      const piv = [];
      let r = 0;
      for (let c = 0; c < X.length && r < A.length; c++) {
        let best = r;
        for (let i = r; i < A.length; i++) if (Math.abs(A[i][c]) > Math.abs(A[best][c])) best = i;
        if (Math.abs(A[best][c]) < 1e-12) continue;
        [A[r], A[best]] = [A[best], A[r]];
        const d = A[r][c];
        for (let j = 0; j <= X.length; j++) A[r][j] /= d;
        for (let i = 0; i < A.length; i++) if (i !== r && A[i][c]) { const f = A[i][c]; for (let j = 0; j <= X.length; j++) A[i][j] -= f * A[r][j]; }
        piv.push(c); r++;
      }
      // grandeurs libres (sans pivot) : au hasard ; les autres s'en déduisent
      const Lg = {};
      X.forEach((k, c) => { if (piv.indexOf(c) < 0) Lg[c] = Math.log(hasard()); });
      piv.forEach((c, i) => { let x = A[i][X.length]; Object.keys(Lg).forEach(f => { x -= A[i][f] * Lg[f]; }); Lg[c] = x; });
      Object.keys(Lg).forEach(c => { v[X[c]] = Math.exp(Lg[c]); });
      // 2. autres équations (somme…) : une grandeur inconnue à la fois, sinon au hasard
      let garde = 0;
      while ([...tous].some(k => !(k in v)) && garde++ < 30) {
        const e = eqs.find(x => idsEq(x).filter(k => !(k in v)).length === 1);
        if (e) { const Y = idsEq(e).find(k => !(k in v)); v[Y] = resoudre1(e, Y, v); continue; }
        v[[...tous].find(k => !(k in v))] = hasard();
      }
      const ok = eqs.every(e => { const a = EQ.evaluer(e.G, v), b = EQ.evaluer(e.D, v); return isFinite(a) && isFinite(b) && Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a), Math.abs(b)); });
      if (ok) return v;
    }
    return null;
  }

  /* ---------- Résolution détaillée, indices ----------
     On part de l'équation utile qui contient la grandeur cherchée ; chaque grandeur à éliminer
     est isolée dans une autre équation utile et reportée ; on simplifie, puis on isole. */
  function resolution(eqs, utiles, cible, avec) {
    const permis = new Set(avec.concat(Object.keys(NB)));
    const U = utiles.filter(k => eqs[k].mG && eqs[k].mD);
    const autres = k => idsEq(eqs[k]).filter(x => !permis.has(x) && x !== cible).length;
    const departs = U.filter(k => idsEq(eqs[k]).indexOf(cible) >= 0).sort((a, b) => autres(a) - autres(b));
    // la grandeur X est-elle déjà seule à gauche de l'équation F ? (report direct, à essayer d'abord)
    const seule = (F, X) => { const h = eqs[F].mG.h; return Object.keys(h).length === 1 && h[X] === 1 && !Object.keys(eqs[F].mG.b).length; };
    // recherche en profondeur : un ordre des reports qui élimine toutes les grandeurs non permises
    function suite(G, D, used, lignes, etapes, dep) {
      const X0 = ids(G).concat(ids(D)).filter(x => !permis.has(x) && x !== cible);
      if (!X0.length) return { G, D, lignes, etapes };
      const choix = [];
      X0.forEach(X => U.forEach(F => { if (!used.has(F) && idsEq(eqs[F]).indexOf(X) >= 0) choix.push({ X, F, p: seule(F, X) ? 0 : 1 }); }));
      choix.sort((a, b) => a.p - b.p);
      for (const c of choix) {
        const E = isoler(eqs[c.F].mG, eqs[c.F].mD, c.X);
        if (!E) continue;
        let G1 = remplacer(G, c.X, E), D1 = remplacer(D, c.X, E);
        const L = lignes.concat([{ texte: 'L’équation ' + (c.F + 1) + ' donne ' + lab(c.X) + ' :', eq: c.X + ' = ' + compact(E) },
          { texte: 'On remplace ' + lab(c.X) + ' dans l’équation ' + (dep + 1) + ' :', eq: compact(G1) + ' = ' + compact(D1) }]);
        // simplification dès qu'elle est possible (une grandeur à éliminer peut disparaître ainsi)
        const [G2, D2] = simplifier(G1, D1), s2 = compact(G2) + ' = ' + compact(D2);
        if (s2 !== L[L.length - 1].eq) { L.push({ texte: 'On simplifie :', eq: s2 }); G1 = G2; D1 = D2; }
        const r = suite(G1, D1, new Set([...used, c.F]), L, etapes.concat([{ X: c.X, F: c.F, dans: dep }]), dep);
        if (r) return r;
      }
      return null;
    }
    for (const dep of departs) {
      const r = suite(copie(eqs[dep].mG), copie(eqs[dep].mD), new Set([dep]), [{ texte: 'Équation ' + (dep + 1) + ' :', eq: eqs[dep].txt }], [], dep);
      if (!r) continue;
      const lignes = r.lignes;
      const [G2, D2] = simplifier(r.G, r.D), apres = compact(G2) + ' = ' + compact(D2);
      if (apres !== lignes[lignes.length - 1].eq) lignes.push({ texte: 'On simplifie :', eq: apres });
      const fin = isoler(G2, D2, cible);
      if (!fin) continue;
      const nc = net(G2), nd = net(D2), expCible = Math.abs((nc[cible] || 0) - (nd[cible] || 0));
      const finale = cible + ' = ' + compact(fin);
      if (finale !== apres) lignes.push({ texte: 'On isole ' + lab(cible) + ' :', eq: finale });
      lignes[lignes.length - 1].final = true;
      return { lignes, etapes: r.etapes, fin, depart: dep, expCible };
    }
    return null;
  }

  // question prête pour l'affichage : équations, valeurs, résolution, indices, légende
  function question(id) {
    const q = PAR_ID[id];
    const eqs = equationsDe(q);
    const utiles = q.form ? q.form.utiles.slice() : eqs.map((e, k) => (e.inutile ? -1 : k)).filter(k => k >= 0);
    const res = resolution(eqs, utiles, q.cible, q.avec);
    const permis = new Set(q.avec.concat(Object.keys(NB)));
    // grandeurs à éliminer : celles des équations utiles, ni cherchée ni permise
    const elim = [];
    utiles.forEach(k => idsEq(eqs[k]).forEach(x => { if (!permis.has(x) && x !== q.cible && elim.indexOf(x) < 0) elim.push(x); }));
    // légende : toutes les grandeurs des équations données (du formulaire pour CO8 : celles des formules utiles)
    const vues = [];
    (q.form ? utiles.map(k => eqs[k]) : eqs).forEach(e => idsEq(e).forEach(x => { if (!estNombre(x) && vues.indexOf(x) < 0) vues.push(x); }));
    const leg = vues.map(x => lab(x) + ' : ' + (q.leg[x] || (SYM[x] ? SYM[x][1] : ''))).join(' · ');
    const L = x => '<i>' + lab(x) + '</i>';
    const liste = l => l.length > 1 ? l.slice(0, -1).map(L).join(', ') + ' et ' + L(l[l.length - 1]) : L(l[0]);
    const avecSansNb = q.avec.filter(x => !estNombre(x));
    // indices successifs
    const indices = [];
    if (q.form) indices.push('Choisis d’abord une formule qui contient ' + L(q.cible) + '.');
    if (elim.length) indices.push('Grandeur' + (elim.length > 1 ? 's' : '') + ' à éliminer (pas dans la liste) : ' + liste(elim) + '.');
    else indices.push('Toutes les grandeurs des équations sont permises, sauf ' + L(q.cible) + '.');
    if (q.form) indices.push('Formules utiles : ' + utiles.map(k => FORMS[q.form.form].f[k][1]).join(', ') + '.');
    if (res) res.etapes.forEach(s => indices.push('Isole ' + L(s.X) + ' dans ' + (q.form ? 'la formule de ' + FORMS[q.form.form].f[s.F][1] : 'l’équation ' + (s.F + 1)) + ' (seule, à gauche), puis glisse l’outil « ' + lab(s.X) + ' = … » de la réserve sur ' + L(s.X) + ' dans ' + (q.form ? 'la formule de ' + FORMS[q.form.form].f[res.depart][1] : 'l’équation ' + (res.depart + 1)) + '.'));
    indices.push('Simplifie (touche une grandeur, puis la même en haut et en bas, ou dans les deux membres), puis isole ' + L(q.cible) + ' à gauche.');
    const racineEq = eqs.some(e => /sqrt/.test(e.txt));
    if (racineEq) indices.push('Un facteur qui multiplie une racine y entre au carré : glisse-le sur la racine, puis simplifie sous la racine.');
    if (res && res.expCible === 2) indices.push(L(q.cible) + ' est au carré : isole ' + L(q.cible) + '² à gauche, puis applique √ aux deux membres.');
    // équations inutiles : bilan (G1)
    const inutiles = q.form ? [] : eqs.map((e, k) => ({ e, k })).filter(x => x.e.inutile).map(x => {
      const neuves = idsEq(x.e).filter(y => !permis.has(y) && y !== q.cible && elim.indexOf(y) < 0 && !estNombre(y));
      return 'L’équation ' + (x.k + 1) + ' ne servait pas' + (neuves.length ? ' : ' + liste(neuves) + (neuves.length > 1 ? ' ne sont' : ' n’est') + ' pas dans la consigne et ne ' + (neuves.length > 1 ? 'servent' : 'sert') + ' pas à exprimer ' + L(q.cible) : '') + '.';
    });
    // outils de la réserve : √ et x² si une équation ou le résultat a une racine ou un carré
    const racine = eqs.some(e => /sqrt|\^/.test(e.txt)) || /sqrt/.test(q.forme);
    return {
      id: q.id, cle: q.id, comp: q.comp, diff: q.diff, classe: q.classe, titre: q.titre, ctx: q.ctx.replace(/_(\d+|[A-Za-z]+)/g, '<sub>$1</sub>'), leg, g,
      eqs, utiles, cible: q.cible, avec: q.avec, avecSansNb, elim, form: q.form ? Object.assign({ titre: FORMS[q.form.form].titre, noms: FORMS[q.form.form].f.map(f => f[1]) }, q.form) : null,
      nom: lab(q.cible), lab, res, indices, inutiles, racine, racineOuverte: racineEq, outils: racine ? ['sqrt', 'sq'] : [],
      valeurs: liste2 => valeurs(liste2 || utiles.map(k => eqs[k]).concat(q.form ? [] : eqs.filter(e => e.inutile)), q.cible, q.avec),
      consigne: 'Exprime ' + L(q.cible) + ' en fonction de ' + liste(avecSansNb) + '.',
      permis,
    };
  }

  // questions d'une compétence (classe du réglage), une au hasard (difficulté niv, pas déjà posée)
  const questions = comp => LISTE.filter(q => q.comp === comp);
  function choisir(comp, niv, deja) {
    deja = deja || [];
    const cl = EPM.reglages ? EPM.reglages().classe : 'tle';
    let L = questions(comp).filter(q => RANG[q.classe] <= RANG[cl || 'tle']);
    if (!L.length) L = questions(comp);
    const libres = L.filter(q => deja.indexOf(q.id) < 0);
    const base = libres.length ? libres : L;
    let cand = base.filter(q => q.diff === niv);
    if (!cand.length) cand = base.filter(q => q.diff <= niv);
    if (!cand.length) cand = base;
    return question(cand[Math.floor(Math.random() * cand.length)].id);
  }

  /* ---------- contrôle de la fin (après chaque étape juste d'une équation) ----------
     fini : grandeur cherchée seule à gauche, grandeurs permises seulement, aucun 1 inutile,
     plus rien à simplifier ; sinon un message ciblé (aucune erreur comptée). */
  function controle(q, st) {
    const C = q.cible, L = x => '<b>' + lab(x) + '</b>';
    const seul = (n, X) => n && n.kind === 'seq' && n.slots.length === 1 && n.slots[0].kind === 'simple' && n.slots[0].items.length === 1 && (!X || n.slots[0].items[0].id === X) && !n.slots[0].items[0].pow;
    const idsN = n => idsEq({ G: n, D: { kind: 'simple', items: [] } });
    if (!seul(st.left, C)) {
      if (seul(st.right, C)) return { message: 'Étape correcte ! ' + L(C) + ' est seule à droite : échange les deux membres avec ⇄.' };
      if (seul(st.left) && idsN(st.right).indexOf(st.left.slots[0].items[0].id) < 0 && st.left.slots[0].items[0].id !== C) {
        const X = st.left.slots[0].items[0].id;
        return { message: 'Étape correcte ! ' + L(X) + ' est seule à gauche : tu peux la reporter. Dans une autre équation qui contient ' + L(X) + ', glisse l’outil « ' + lab(X) + ' = … » de la réserve sur ' + L(X) + '.' };
      }
      return { message: 'Étape correcte, continue !' };
    }
    const reste = idsN(st.right).filter(x => !q.permis.has(x));
    if (reste.indexOf(C) >= 0) return { message: 'Étape correcte, mais ' + L(C) + ' est encore à droite : continue.' };
    if (reste.length) return { message: 'Étape correcte : ' + L(C) + ' est seule, mais il reste ' + reste.map(L).join(', ') + ', qui n’' + (reste.length > 1 ? 'sont' : 'est') + ' pas dans la liste. Remplace-' + (reste.length > 1 ? 'les' : 'la') + ' en reportant une autre équation.' };
    if (EQ.compterUns(st.left) + EQ.compterUns(st.right)) return { message: 'Étape correcte ! Retire les 1 inutiles (touche un 1, puis sa croix ✕).' };
    // plus rien à simplifier : aucune grandeur à la fois en haut et en bas
    const sens = {};
    (function voir(n, s, rac) {
      if (n.kind === 'simple') n.items.forEach(it => { if (it.id !== 'one') (sens[it.id] = sens[it.id] || []).push({ s, rac }); });
      else if (n.kind === 'seq') n.slots.forEach(x => voir(x, s, rac));
      else if (n.kind === 'frac') { voir(n.num, s, rac); voir(n.den, -s, rac); }
      else if (n.kind === 'func') voir(n.inner, s, rac || n.fn === 'sqrt');
      else if (n.kind === 'sum') n.terms.forEach(t => voir(t.node, s, rac));
    })(st.right, 1, false);
    const X = Object.keys(sens).find(k => sens[k].some(o => o.s > 0) && sens[k].some(o => o.s < 0));
    if (X) {
      const r = sens[X].some(o => o.rac) && sens[X].some(o => !o.rac);
      return { message: 'Presque : ' + L(C) + ' est seule, avec les bonnes grandeurs, mais ' + L(X) + ' est en haut et en bas : ' + (r ? 'fais entrer ' + L(X) + ' sous la racine (glisse-le sur la racine), puis simplifie.' : 'simplifie-le (touche ' + L(X) + ' en haut, puis ' + L(X) + ' en bas).') };
    }
    return { fini: true };
  }

  /* ---------- Découverte : deux équations de plus, à la fin ---------- */
  if (EPM.DECOUVERTE) {
    EPM.DECOUVERTE.push({ co: 'CO1-01', comp: 'CO1', titre: 'Remplacer une grandeur', niveau: '' });
    EPM.DECOUVERTE.push({ co: 'CO3-01', comp: 'CO3', titre: 'Remplacer et simplifier', niveau: '' });
  }

  EPM.CO = { estCO, choisir, question, questions, controle, LISTE, FORMS, SYM, NB, g, lab, equation,
    cas: { membreDe, net, remplacer, isoler, simplifier, compact, memeNet, valeurs, resolution, equationsDe: id => equationsDe(PAR_ID[id]) } };
})();
